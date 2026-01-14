// ============================================================
// Fexle Sales Engine - Google Sheets Backend
// Version: 2.0.0
// ============================================================
// This script provides the API backend for syncing leads and
// tasks between the browser app and Google Sheets.
//
// SETUP:
// 1. Create a Google Sheet with tabs named "Leads" and "Tasks"
// 2. Go to Extensions → Apps Script
// 3. Paste this entire file
// 4. Deploy → New deployment → Web app
// 5. Set "Who has access" to "Anyone"
// 6. Copy the Web App URL to your Sales Engine settings
// ============================================================

/**
 * Handle GET requests (fetch data)
 * @param {Object} e - Event object with parameters
 */
function doGet(e) {
  const action = e.parameter.action;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  try {
    if (action === 'getLeads') {
      return getSheetData(ss, 'Leads');
    } else if (action === 'getTasks') {
      return getSheetData(ss, 'Tasks');
    } else if (action === 'status') {
      return jsonResponse({ 
        status: 'connected', 
        sheetName: ss.getName(),
        leadsCount: getRowCount(ss, 'Leads'),
        tasksCount: getRowCount(ss, 'Tasks'),
        lastModified: new Date().toISOString()
      });
    }
    return jsonResponse({ error: 'Unknown action. Valid actions: getLeads, getTasks, status' });
  } catch (error) {
    return jsonResponse({ error: error.message });
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
    
    if (data.action === 'syncLeads') {
      return syncData(ss, 'Leads', data.headers, data.rows, data.userName);
    } else if (data.action === 'syncTasks') {
      return syncData(ss, 'Tasks', data.headers, data.rows, data.userName);
    } else if (data.action === 'deleteLead') {
      return deleteRow(ss, 'Leads', data.leadId);
    } else if (data.action === 'deleteTask') {
      return deleteRow(ss, 'Tasks', data.taskId);
    }
    return jsonResponse({ error: 'Unknown action' });
  } catch (error) {
    return jsonResponse({ error: error.message });
  }
}

/**
 * Get all data from a sheet
 * @param {Spreadsheet} ss - The spreadsheet
 * @param {string} sheetName - Name of the sheet
 */
function getSheetData(ss, sheetName) {
  let sheet = ss.getSheetByName(sheetName);
  
  // Create sheet if it doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    return jsonResponse({ headers: [], rows: [] });
  }
  
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  
  if (lastRow === 0 || lastCol === 0) {
    return jsonResponse({ headers: [], rows: [] });
  }
  
  const data = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  
  if (data.length === 0) {
    return jsonResponse({ headers: [], rows: [] });
  }
  
  const headers = data[0];
  const rows = data.slice(1);
  
  return jsonResponse({ 
    headers, 
    rows,
    count: rows.length,
    fetchedAt: new Date().toISOString()
  });
}

/**
 * Sync data to a sheet (upsert - update or insert)
 * @param {Spreadsheet} ss - The spreadsheet
 * @param {string} sheetName - Name of the sheet
 * @param {string[]} headers - Column headers
 * @param {Array[]} rows - Data rows
 * @param {string} userName - Name of user performing sync
 */
function syncData(ss, sheetName, headers, rows, userName) {
  let sheet = ss.getSheetByName(sheetName);
  
  // Create sheet if it doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  
  // Get existing data
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  
  let existingHeaders = [];
  let existingRows = [];
  
  if (lastRow > 0 && lastCol > 0) {
    const existingData = sheet.getRange(1, 1, lastRow, lastCol).getValues();
    existingHeaders = existingData[0] || [];
    existingRows = existingData.slice(1);
  }
  
  // Find ID column index
  const idIndex = headers.indexOf('id');
  const existingIdIndex = existingHeaders.indexOf('id');
  
  // Create lookup map for existing rows by ID
  const existingById = {};
  if (existingIdIndex >= 0) {
    existingRows.forEach((row, i) => {
      const id = String(row[existingIdIndex]);
      if (id && id !== '') {
        existingById[id] = i + 2; // +2 for 1-indexed and header row
      }
    });
  }
  
  // Set headers if sheet is empty
  if (existingHeaders.length === 0 && headers.length > 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  
  // Process each row
  let updated = 0;
  let inserted = 0;
  const errors = [];
  
  rows.forEach((row, index) => {
    try {
      const rowId = idIndex >= 0 ? String(row[idIndex]) : null;
      
      if (rowId && existingById[rowId]) {
        // Update existing row
        const rowNum = existingById[rowId];
        sheet.getRange(rowNum, 1, 1, row.length).setValues([row]);
        updated++;
      } else {
        // Insert new row
        sheet.appendRow(row);
        inserted++;
      }
    } catch (rowError) {
      errors.push({ index, error: rowError.message });
    }
  });
  
  // Log sync activity
  logSync(ss, userName, sheetName, updated, inserted);
  
  return jsonResponse({ 
    success: true, 
    updated, 
    inserted,
    errors: errors.length > 0 ? errors : undefined,
    total: rows.length,
    timestamp: new Date().toISOString()
  });
}

/**
 * Delete a row by ID
 * @param {Spreadsheet} ss - The spreadsheet
 * @param {string} sheetName - Name of the sheet
 * @param {string} id - ID of the row to delete
 */
function deleteRow(ss, sheetName, id) {
  const sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    return jsonResponse({ error: 'Sheet not found: ' + sheetName });
  }
  
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  
  if (lastRow === 0) {
    return jsonResponse({ error: 'Sheet is empty' });
  }
  
  const data = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  const headers = data[0];
  const idIndex = headers.indexOf('id');
  
  if (idIndex < 0) {
    return jsonResponse({ error: 'No ID column found in sheet' });
  }
  
  // Search from bottom to top to avoid index shifting issues
  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][idIndex]) === String(id)) {
      sheet.deleteRow(i + 1); // +1 for 1-indexed
      return jsonResponse({ success: true, deleted: id });
    }
  }
  
  return jsonResponse({ error: 'ID not found: ' + id });
}

/**
 * Get row count for a sheet (excluding header)
 * @param {Spreadsheet} ss - The spreadsheet
 * @param {string} sheetName - Name of the sheet
 */
function getRowCount(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return 0;
  return Math.max(0, sheet.getLastRow() - 1); // -1 for header
}

/**
 * Log sync activity to a SyncLog sheet
 * @param {Spreadsheet} ss - The spreadsheet
 * @param {string} userName - Name of user
 * @param {string} sheetName - Sheet that was synced
 * @param {number} updated - Count of updated rows
 * @param {number} inserted - Count of inserted rows
 */
function logSync(ss, userName, sheetName, updated, inserted) {
  try {
    let logSheet = ss.getSheetByName('SyncLog');
    
    if (!logSheet) {
      logSheet = ss.insertSheet('SyncLog');
      logSheet.getRange(1, 1, 1, 5).setValues([
        ['Timestamp', 'User', 'Sheet', 'Updated', 'Inserted']
      ]);
      // Format header
      logSheet.getRange(1, 1, 1, 5).setFontWeight('bold');
    }
    
    logSheet.appendRow([
      new Date().toISOString(),
      userName || 'Unknown',
      sheetName,
      updated,
      inserted
    ]);
    
    // Keep only last 1000 log entries to prevent sheet from getting too large
    const lastRow = logSheet.getLastRow();
    if (lastRow > 1001) {
      logSheet.deleteRows(2, lastRow - 1001);
    }
  } catch (e) {
    // Don't fail the sync if logging fails
    console.error('Failed to log sync:', e);
  }
}

/**
 * Create JSON response with CORS headers
 * @param {Object} data - Data to return as JSON
 */
function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// UTILITY FUNCTIONS (can be run manually from Apps Script)
// ============================================================

/**
 * Remove duplicate rows based on ID column
 * Run this manually if you have duplicate data
 */
function removeDuplicates() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetsToClean = ['Leads', 'Tasks'];
  
  sheetsToClean.forEach(sheetName => {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      console.log('Sheet not found: ' + sheetName);
      return;
    }
    
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      console.log('No data in: ' + sheetName);
      return;
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIndex = headers.indexOf('id');
    
    if (idIndex < 0) {
      console.log('No ID column in: ' + sheetName);
      return;
    }
    
    const seen = new Set();
    const rowsToDelete = [];
    
    for (let i = 1; i < data.length; i++) {
      const id = String(data[i][idIndex]);
      if (seen.has(id)) {
        rowsToDelete.push(i + 1); // 1-indexed
      } else if (id && id !== '') {
        seen.add(id);
      }
    }
    
    // Delete from bottom to top to avoid index shifting
    rowsToDelete.reverse().forEach(row => {
      sheet.deleteRow(row);
    });
    
    console.log(`Removed ${rowsToDelete.length} duplicates from ${sheetName}`);
  });
}

/**
 * Clear all data (except headers) from Leads and Tasks sheets
 * USE WITH CAUTION - this deletes all your data!
 */
function clearAllData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetsToClean = ['Leads', 'Tasks'];
  
  sheetsToClean.forEach(sheetName => {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return;
    
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.deleteRows(2, lastRow - 1);
      console.log(`Cleared all data from ${sheetName}`);
    }
  });
}

/**
 * Get statistics about the data
 */
function getStats() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const stats = {
    sheetName: ss.getName(),
    leads: getRowCount(ss, 'Leads'),
    tasks: getRowCount(ss, 'Tasks'),
    syncLogs: getRowCount(ss, 'SyncLog'),
    lastModified: ss.getLastUpdated()
  };
  
  console.log('Stats:', JSON.stringify(stats, null, 2));
  return stats;
}

/**
 * Test the doGet function locally
 */
function testDoGet() {
  const result = doGet({ parameter: { action: 'status' } });
  console.log(result.getContent());
}
