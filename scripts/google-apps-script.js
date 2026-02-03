/**
 * @module scripts/google-apps-script
 * @description TODO: Describe what google-apps-script does
 *
 * PURPOSE:
 * - TODO: Describe the main responsibility of google-apps-script
 *
 * PATTERNS:
 * - TODO: Describe usage patterns
 *
 * CLAUDE NOTES:
 * - TODO: Add important context for Claude
 */
// ============================================================
// Fexle Sales Engine - Google Sheets Backend
// Version: 3.0.0
// ============================================================
// This script provides the API backend for syncing leads and
// tasks between the browser app and Google Sheets.
//
// NEW IN v3.0:
// - Version-based conflict resolution
// - Incremental sync support (only changed records)
// - lastModified timestamp tracking
// - Apollo.io and Anthropic API proxy endpoints
// - Improved error handling
//
// SETUP:
// 1. Create a Google Sheet with tabs named "Leads" and "Tasks"
// 2. Go to Extensions → Apps Script
// 3. Paste this entire file
// 4. Deploy → New deployment → Web app
// 5. Set "Who has access" to "Anyone"
// 6. Copy the Web App URL to your Sales Engine settings
// ============================================================

// ==================== CONFIGURATION ====================
const CONFIG = {
  // Optional: Store API keys in Script Properties for server-side calls
  // Go to Project Settings → Script Properties to add these
  APOLLO_API_KEY: PropertiesService.getScriptProperties().getProperty('APOLLO_API_KEY') || '',
  ANTHROPIC_API_KEY: PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY') || ''
};

// ==================== REQUEST HANDLERS ====================

/**
 * Handle GET requests (fetch data)
 * @param {Object} e - Event object with parameters
 */
function doGet(e) {
  const action = e.parameter.action;
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  try {
    switch (action) {
      case 'getLeads':
        return getSheetData(ss, 'Leads', e.parameter.since);
      case 'getTasks':
        return getSheetData(ss, 'Tasks', e.parameter.since);
      case 'status':
        return getStatus(ss);
      case 'getChanges':
        // Get only records modified since a timestamp
        return getChanges(ss, e.parameter.since, e.parameter.sheet);
      default:
        return jsonResponse({
          error: 'Unknown action',
          validActions: ['getLeads', 'getTasks', 'status', 'getChanges']
        });
    }
  } catch (error) {
    return jsonResponse({ error: error.message, stack: error.stack });
  }
}

/**
 * Handle POST requests (sync data)
 * @param {Object} e - Event object with POST data
 */
function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  try {
    const data = JSON.parse(e.postData.contents);

    switch (data.action) {
      case 'syncLeads':
        return syncDataWithVersioning(ss, 'Leads', data.rows, data.userName, data.forceOverwrite);
      case 'syncTasks':
        return syncDataWithVersioning(ss, 'Tasks', data.rows, data.userName, data.forceOverwrite);
      case 'syncIncremental':
        // Only sync dirty/changed records
        return syncIncremental(ss, data.sheetName, data.rows, data.userName);
      case 'deleteLead':
        return deleteRow(ss, 'Leads', data.leadId);
      case 'deleteTask':
        return deleteRow(ss, 'Tasks', data.taskId);
      case 'resolveConflict':
        return resolveConflict(ss, data.sheetName, data.id, data.resolution, data.row);
      // API Proxy endpoints (to avoid CORS and hide API keys)
      case 'apolloSearch':
        return apolloSearch(data.searchParams);
      case 'anthropicResearch':
        return anthropicResearch(data.prompt, data.leadData);
      default:
        return jsonResponse({ error: 'Unknown action' });
    }
  } catch (error) {
    return jsonResponse({ error: error.message, stack: error.stack });
  }
}

// ==================== DATA RETRIEVAL ====================

/**
 * Get status information
 */
function getStatus(ss) {
  return jsonResponse({
    status: 'connected',
    sheetName: ss.getName(),
    leadsCount: getRowCount(ss, 'Leads'),
    tasksCount: getRowCount(ss, 'Tasks'),
    lastModified: new Date().toISOString(),
    version: '3.0.0',
    capabilities: ['versioning', 'incrementalSync', 'conflictResolution', 'apiProxy']
  });
}

/**
 * Get all data from a sheet, optionally filtered by modification time
 * @param {Spreadsheet} ss - The spreadsheet
 * @param {string} sheetName - Name of the sheet
 * @param {string} since - ISO timestamp to filter records modified after this time
 */
function getSheetData(ss, sheetName, since) {
  let sheet = ss.getSheetByName(sheetName);

  // Create sheet if it doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    initializeSheetHeaders(sheet, sheetName);
    return jsonResponse({ headers: getDefaultHeaders(sheetName), rows: [], count: 0 });
  }

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();

  if (lastRow === 0 || lastCol === 0) {
    return jsonResponse({ headers: getDefaultHeaders(sheetName), rows: [], count: 0 });
  }

  const data = sheet.getRange(1, 1, lastRow, lastCol).getValues();

  if (data.length === 0) {
    return jsonResponse({ headers: getDefaultHeaders(sheetName), rows: [], count: 0 });
  }

  const headers = data[0];
  let rows = data.slice(1);

  // Filter by lastModified if 'since' parameter provided
  if (since) {
    const sinceDate = new Date(since);
    const lastModifiedIndex = headers.indexOf('lastModified');
    if (lastModifiedIndex >= 0) {
      rows = rows.filter(row => {
        const rowDate = new Date(row[lastModifiedIndex]);
        return rowDate > sinceDate;
      });
    }
  }

  // Convert rows to objects for easier handling
  const rowObjects = rows.map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = row[i];
    });
    return obj;
  });

  return jsonResponse({
    headers,
    rows: rowObjects,
    count: rowObjects.length,
    fetchedAt: new Date().toISOString()
  });
}

/**
 * Get only records changed since a timestamp
 */
function getChanges(ss, since, sheetName) {
  const sheets = sheetName ? [sheetName] : ['Leads', 'Tasks'];
  const changes = {};

  sheets.forEach(name => {
    const result = JSON.parse(getSheetData(ss, name, since).getContent());
    changes[name.toLowerCase()] = result.rows || [];
  });

  return jsonResponse({
    changes,
    since,
    fetchedAt: new Date().toISOString()
  });
}

// ==================== DATA SYNC WITH VERSIONING ====================

/**
 * Sync data with version-based conflict detection
 * @param {Spreadsheet} ss - The spreadsheet
 * @param {string} sheetName - Name of the sheet
 * @param {Object[]} rows - Data rows as objects
 * @param {string} userName - Name of user performing sync
 * @param {boolean} forceOverwrite - If true, overwrite regardless of version
 */
function syncDataWithVersioning(ss, sheetName, rows, userName, forceOverwrite) {
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    initializeSheetHeaders(sheet, sheetName);
  }

  const headers = getSheetHeaders(sheet);
  const idIndex = headers.indexOf('id');
  const versionIndex = headers.indexOf('_version');
  const lastModifiedIndex = headers.indexOf('lastModified');

  // Get existing data
  const existingData = getExistingDataMap(sheet, headers);

  let updated = 0;
  let inserted = 0;
  let conflicts = [];
  const errors = [];
  const now = new Date().toISOString();

  rows.forEach((row, index) => {
    try {
      const rowId = String(row.id);
      const existing = existingData[rowId];

      // Add/update metadata
      row.lastModified = now;
      row._syncedBy = userName || 'Unknown';
      row._syncedAt = now;

      if (existing) {
        // Check for version conflict
        const incomingVersion = row._version || 0;
        const existingVersion = existing.data._version || 0;

        if (!forceOverwrite && incomingVersion < existingVersion) {
          // Conflict detected - incoming data is older
          conflicts.push({
            id: rowId,
            field: 'version',
            localVersion: incomingVersion,
            remoteVersion: existingVersion,
            localData: row,
            remoteData: existing.data
          });
          return;
        }

        // Increment version
        row._version = Math.max(incomingVersion, existingVersion) + 1;

        // Update existing row
        const rowArray = headers.map(h => row[h] !== undefined ? row[h] : '');
        sheet.getRange(existing.rowNum, 1, 1, headers.length).setValues([rowArray]);
        updated++;
      } else {
        // New row - set initial version
        row._version = 1;

        const rowArray = headers.map(h => row[h] !== undefined ? row[h] : '');
        sheet.appendRow(rowArray);
        inserted++;
      }
    } catch (rowError) {
      errors.push({ index, id: row.id, error: rowError.message });
    }
  });

  // Log sync activity
  logSync(ss, userName, sheetName, updated, inserted, conflicts.length);

  return jsonResponse({
    success: true,
    updated,
    inserted,
    conflicts: conflicts.length > 0 ? conflicts : undefined,
    errors: errors.length > 0 ? errors : undefined,
    total: rows.length,
    timestamp: now
  });
}

/**
 * Sync only dirty/changed records (incremental sync)
 */
function syncIncremental(ss, sheetName, rows, userName) {
  // Same as syncDataWithVersioning but expects only changed records
  return syncDataWithVersioning(ss, sheetName, rows, userName, false);
}

/**
 * Resolve a sync conflict
 * @param {Spreadsheet} ss - The spreadsheet
 * @param {string} sheetName - Name of the sheet
 * @param {string} id - ID of the conflicting record
 * @param {string} resolution - 'local', 'remote', or 'merge'
 * @param {Object} row - The resolved row data (for 'local' or 'merge')
 */
function resolveConflict(ss, sheetName, id, resolution, row) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    return jsonResponse({ error: 'Sheet not found: ' + sheetName });
  }

  const headers = getSheetHeaders(sheet);
  const existingData = getExistingDataMap(sheet, headers);
  const existing = existingData[String(id)];

  if (!existing) {
    return jsonResponse({ error: 'Record not found: ' + id });
  }

  if (resolution === 'remote') {
    // Keep remote version - nothing to do
    return jsonResponse({ success: true, resolution: 'kept_remote' });
  }

  // For 'local' or 'merge', update with provided row
  const now = new Date().toISOString();
  row._version = (existing.data._version || 0) + 1;
  row.lastModified = now;
  row._conflictResolved = now;

  const rowArray = headers.map(h => row[h] !== undefined ? row[h] : '');
  sheet.getRange(existing.rowNum, 1, 1, headers.length).setValues([rowArray]);

  return jsonResponse({
    success: true,
    resolution: resolution === 'local' ? 'used_local' : 'merged',
    newVersion: row._version
  });
}

// ==================== API PROXY ENDPOINTS ====================

/**
 * Proxy Apollo.io search requests
 * This hides the API key from the client
 */
function apolloSearch(searchParams) {
  const apiKey = CONFIG.APOLLO_API_KEY;

  if (!apiKey) {
    return jsonResponse({
      error: 'Apollo API key not configured on server',
      hint: 'Add APOLLO_API_KEY to Script Properties'
    });
  }

  try {
    const response = UrlFetchApp.fetch('https://api.apollo.io/v1/mixed_people/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': apiKey
      },
      payload: JSON.stringify(searchParams),
      muteHttpExceptions: true
    });

    const result = JSON.parse(response.getContentText());
    return jsonResponse(result);
  } catch (error) {
    return jsonResponse({ error: 'Apollo API error: ' + error.message });
  }
}

/**
 * Proxy Anthropic API requests for company research
 */
function anthropicResearch(prompt, leadData) {
  const apiKey = CONFIG.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return jsonResponse({
      error: 'Anthropic API key not configured on server',
      hint: 'Add ANTHROPIC_API_KEY to Script Properties'
    });
  }

  try {
    const response = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      payload: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: prompt
        }]
      }),
      muteHttpExceptions: true
    });

    const result = JSON.parse(response.getContentText());
    return jsonResponse(result);
  } catch (error) {
    return jsonResponse({ error: 'Anthropic API error: ' + error.message });
  }
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Get default headers for a sheet
 */
function getDefaultHeaders(sheetName) {
  const commonHeaders = ['id', 'lastModified', '_version', '_syncedBy', '_syncedAt', '_dirty'];

  if (sheetName === 'Leads') {
    return [
      ...commonHeaders,
      'company', 'contact', 'title', 'phone', 'email', 'vertical',
      'companySize', 'revenue', 'employeeCount', 'website', 'linkedinUrl',
      'city', 'state', 'country', 'industry', 'source', 'sourceId',
      'status', 'score', 'lastContact', 'lastContactDate', 'notes',
      'assignedTo', 'createdDate', 'intentSignals', 'technologies', 'research'
    ];
  } else if (sheetName === 'Tasks') {
    return [
      ...commonHeaders,
      'leadId', 'type', 'description', 'dueDate', 'dueTime',
      'completed', 'completedAt', 'priority', 'assignedTo', 'createdDate'
    ];
  }
  return commonHeaders;
}

/**
 * Initialize sheet with headers
 */
function initializeSheetHeaders(sheet, sheetName) {
  const headers = getDefaultHeaders(sheetName);
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
}

/**
 * Get headers from sheet (first row)
 */
function getSheetHeaders(sheet) {
  const lastCol = sheet.getLastColumn();
  if (lastCol === 0) return getDefaultHeaders('');
  return sheet.getRange(1, 1, 1, lastCol).getValues()[0];
}

/**
 * Get existing data as a map by ID
 */
function getExistingDataMap(sheet, headers) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return {};

  const data = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  const idIndex = headers.indexOf('id');
  const map = {};

  data.forEach((row, i) => {
    const id = String(row[idIndex]);
    if (id && id !== '') {
      const obj = {};
      headers.forEach((h, j) => obj[h] = row[j]);
      map[id] = {
        rowNum: i + 2, // 1-indexed, +1 for header
        data: obj
      };
    }
  });

  return map;
}

/**
 * Delete a row by ID
 */
function deleteRow(ss, sheetName, id) {
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    return jsonResponse({ error: 'Sheet not found: ' + sheetName });
  }

  const headers = getSheetHeaders(sheet);
  const existingData = getExistingDataMap(sheet, headers);
  const existing = existingData[String(id)];

  if (!existing) {
    return jsonResponse({ error: 'ID not found: ' + id });
  }

  sheet.deleteRow(existing.rowNum);
  return jsonResponse({ success: true, deleted: id });
}

/**
 * Get row count for a sheet (excluding header)
 */
function getRowCount(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return 0;
  return Math.max(0, sheet.getLastRow() - 1);
}

/**
 * Log sync activity
 */
function logSync(ss, userName, sheetName, updated, inserted, conflicts) {
  try {
    let logSheet = ss.getSheetByName('SyncLog');

    if (!logSheet) {
      logSheet = ss.insertSheet('SyncLog');
      logSheet.getRange(1, 1, 1, 6).setValues([
        ['Timestamp', 'User', 'Sheet', 'Updated', 'Inserted', 'Conflicts']
      ]);
      logSheet.getRange(1, 1, 1, 6).setFontWeight('bold');
    }

    logSheet.appendRow([
      new Date().toISOString(),
      userName || 'Unknown',
      sheetName,
      updated,
      inserted,
      conflicts || 0
    ]);

    // Keep only last 1000 log entries
    const lastRow = logSheet.getLastRow();
    if (lastRow > 1001) {
      logSheet.deleteRows(2, lastRow - 1001);
    }
  } catch (e) {
    console.error('Failed to log sync:', e);
  }
}

/**
 * Create JSON response
 */
function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Remove duplicate rows based on ID column
 */
function removeDuplicates() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetsToClean = ['Leads', 'Tasks'];

  sheetsToClean.forEach(sheetName => {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return;

    const headers = getSheetHeaders(sheet);
    const existingData = getExistingDataMap(sheet, headers);

    // Data is already deduplicated by ID in the map
    console.log(`${sheetName}: ${Object.keys(existingData).length} unique records`);
  });
}

/**
 * Clear all data (except headers)
 */
function clearAllData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ['Leads', 'Tasks'].forEach(sheetName => {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return;

    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.deleteRows(2, lastRow - 1);
      console.log(`Cleared ${sheetName}`);
    }
  });
}

/**
 * Get statistics
 */
function getStats() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const stats = {
    sheetName: ss.getName(),
    leads: getRowCount(ss, 'Leads'),
    tasks: getRowCount(ss, 'Tasks'),
    syncLogs: getRowCount(ss, 'SyncLog')
  };
  console.log('Stats:', JSON.stringify(stats, null, 2));
  return stats;
}

/**
 * Test functions
 */
function testDoGet() {
  const result = doGet({ parameter: { action: 'status' } });
  console.log(result.getContent());
}

function testGetChanges() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const result = doGet({
    parameter: {
      action: 'getChanges',
      since: yesterday.toISOString()
    }
  });
  console.log(result.getContent());
}
