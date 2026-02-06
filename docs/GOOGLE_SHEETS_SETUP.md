# Google Sheets Integration Setup

This guide provides detailed instructions for setting up Google Sheets as a shared data store for your team.

## Overview

The Google Sheets integration allows your team to:

- **Share leads** across multiple users
- **Sync tasks** for collaborative follow-up
- **Backup data** automatically to the cloud
- **Work offline** and sync when connected
- **Proxy API calls** for Apollo.io (bypasses CORS, hides API keys)

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  User Browser   │────▶│  Google Apps    │────▶│  Google Sheet   │
│  (Sales Engine) │◀────│    Script       │◀────│  (Leads/Tasks)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                      │  │                     │
         │                      │  └──▶ Apollo.io API    │
         │                      │  └──▶ Anthropic API    │
         │              ┌───────┴─────────┐              │
         └─────────────▶│  Other Team     │◀─────────────┘
                        │    Members      │
                        └─────────────────┘
```

The Apps Script serves dual purposes:
1. **Data sync** — Shared leads and tasks via Google Sheets
2. **API proxy** — Routes Apollo.io and Anthropic API calls server-side, bypassing browser CORS restrictions and keeping API keys secure

## Step-by-Step Setup

### 1. Create the Google Sheet

1. Go to [sheets.new](https://sheets.new) to create a new spreadsheet
2. Name it something like "Outbound Sales Engine - Team Data"
3. At the bottom, you'll see a tab called "Sheet1"
4. Right-click the tab → Rename → Type `Leads`
5. Click the **+** button to add another sheet
6. Name the new sheet `Tasks`

**Important:** Sheet names must be exactly `Leads` and `Tasks` (case-sensitive).

### 2. Open Apps Script Editor

1. In your Google Sheet, click **Extensions** in the menu bar
2. Click **Apps Script**
3. A new tab opens with the script editor
4. Delete any existing code (usually `function myFunction() {}`)

### 3. Add the Backend Code

> **Important:** The code below is a simplified version for reference. For the **full v3.0 backend** with version-based conflict resolution, incremental sync, and API proxy endpoints, copy from `scripts/google-apps-script.js` in the repository instead.

Copy and paste the following code into the Apps Script editor:

```javascript
// ============================================================
// Outbound Sales Engine - Google Sheets Backend
// ============================================================
// This script provides the API backend for syncing leads and
// tasks between the browser app and Google Sheets.
// ============================================================

/**
 * Handle GET requests (fetch data)
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
        lastModified: ss.getLastUpdated()
      });
    }
    return jsonResponse({ error: 'Unknown action' });
  } catch (error) {
    return jsonResponse({ error: error.message });
  }
}

/**
 * Handle POST requests (sync data)
 */
function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const data = JSON.parse(e.postData.contents);
  
  try {
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
 */
function getSheetData(ss, sheetName) {
  let sheet = ss.getSheetByName(sheetName);
  
  // Create sheet if it doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    return jsonResponse({ headers: [], rows: [] });
  }
  
  const data = sheet.getDataRange().getValues();
  
  if (data.length === 0) {
    return jsonResponse({ headers: [], rows: [] });
  }
  
  const headers = data[0];
  const rows = data.slice(1);
  
  return jsonResponse({ headers, rows });
}

/**
 * Sync data to a sheet (upsert - update or insert)
 */
function syncData(ss, sheetName, headers, rows, userName) {
  let sheet = ss.getSheetByName(sheetName);
  
  // Create sheet if it doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  
  // Get existing data
  const existingData = sheet.getDataRange().getValues();
  const existingHeaders = existingData[0] || [];
  const existingRows = existingData.slice(1);
  
  // Find ID column index
  const idIndex = headers.indexOf('id');
  const existingIdIndex = existingHeaders.indexOf('id');
  
  // Create lookup map for existing rows by ID
  const existingById = {};
  if (existingIdIndex >= 0) {
    existingRows.forEach((row, i) => {
      const id = String(row[existingIdIndex]);
      if (id) {
        existingById[id] = i + 2; // +2 for 1-indexed and header row
      }
    });
  }
  
  // Set headers if sheet is empty
  if (existingHeaders.length === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  
  // Process each row
  let updated = 0;
  let inserted = 0;
  
  rows.forEach(row => {
    const rowId = String(row[idIndex]);
    
    if (existingById[rowId]) {
      // Update existing row
      const rowNum = existingById[rowId];
      sheet.getRange(rowNum, 1, 1, row.length).setValues([row]);
      updated++;
    } else {
      // Insert new row
      sheet.appendRow(row);
      inserted++;
    }
  });
  
  // Log sync activity
  logSync(ss, userName, sheetName, updated, inserted);
  
  return jsonResponse({ 
    success: true, 
    updated, 
    inserted,
    total: rows.length,
    timestamp: new Date().toISOString()
  });
}

/**
 * Delete a row by ID
 */
function deleteRow(ss, sheetName, id) {
  const sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    return jsonResponse({ error: 'Sheet not found' });
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIndex = headers.indexOf('id');
  
  if (idIndex < 0) {
    return jsonResponse({ error: 'No ID column found' });
  }
  
  // Search from bottom to top to avoid index shifting issues
  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][idIndex]) === String(id)) {
      sheet.deleteRow(i + 1); // +1 for 1-indexed
      return jsonResponse({ success: true, deleted: id });
    }
  }
  
  return jsonResponse({ error: 'ID not found', id });
}

/**
 * Get row count for a sheet
 */
function getRowCount(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return 0;
  return Math.max(0, sheet.getLastRow() - 1); // -1 for header
}

/**
 * Log sync activity (optional - creates a SyncLog sheet)
 */
function logSync(ss, userName, sheetName, updated, inserted) {
  let logSheet = ss.getSheetByName('SyncLog');
  
  if (!logSheet) {
    logSheet = ss.insertSheet('SyncLog');
    logSheet.getRange(1, 1, 1, 5).setValues([
      ['Timestamp', 'User', 'Sheet', 'Updated', 'Inserted']
    ]);
  }
  
  logSheet.appendRow([
    new Date().toISOString(),
    userName || 'Unknown',
    sheetName,
    updated,
    inserted
  ]);
  
  // Keep only last 1000 log entries
  const lastRow = logSheet.getLastRow();
  if (lastRow > 1001) {
    logSheet.deleteRows(2, lastRow - 1001);
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

// ============================================================
// Optional: Scheduled cleanup functions
// ============================================================

/**
 * Remove duplicate rows (can be run manually or on schedule)
 */
function removeDuplicates() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ['Leads', 'Tasks'].forEach(sheetName => {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return;
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return;
    
    const headers = data[0];
    const idIndex = headers.indexOf('id');
    if (idIndex < 0) return;
    
    const seen = new Set();
    const rowsToDelete = [];
    
    for (let i = 1; i < data.length; i++) {
      const id = String(data[i][idIndex]);
      if (seen.has(id)) {
        rowsToDelete.push(i + 1);
      } else {
        seen.add(id);
      }
    }
    
    // Delete from bottom to top
    rowsToDelete.reverse().forEach(row => sheet.deleteRow(row));
  });
}
```

### 4. Save the Script

1. Click **File → Save** (or Ctrl+S / Cmd+S)
2. Name the project "Outbound Sales Engine Backend"

### 4b. Add API Keys to Script Properties (for proxy)

To enable the Apollo.io and Anthropic API proxy:

1. In the Apps Script editor, click the **gear icon** (Project Settings) in the left sidebar
2. Scroll down to **Script Properties**
3. Click **Add script property**
4. Add your API keys:

| Property Name | Value | Purpose |
|--------------|-------|---------|
| `APOLLO_API_KEY` | Your Apollo API key | Proxies Apollo search requests |
| `ANTHROPIC_API_KEY` | Your Anthropic API key | Proxies AI research requests |

This keeps API keys on Google's servers rather than in the browser — more secure and avoids CORS.

### 5. Deploy as Web App

1. Click **Deploy** (blue button, top right)
2. Click **New deployment**
3. Click the gear icon ⚙️ next to "Select type"
4. Choose **Web app**
5. Fill in the form:
   - **Description**: `Outbound Sales Engine Backend v1`
   - **Execute as**: `Me (your-email@gmail.com)`
   - **Who has access**: `Anyone`
6. Click **Deploy**

### 6. Authorize the App

1. Click **Authorize access**
2. Choose your Google account
3. You'll see a warning: "Google hasn't verified this app"
4. Click **Advanced**
5. Click **Go to Outbound Sales Engine Backend (unsafe)**
6. Click **Allow**

### 7. Copy the Web App URL

After authorization, you'll see a success screen with:
- **Deployment ID**: (internal identifier)
- **Web app URL**: `https://script.google.com/macros/s/ABC123.../exec`

**Copy the Web app URL** - you'll need this for the Sales Engine.

### 8. Connect in Sales Engine

1. Open the Outbound Sales Engine
2. Click **Settings** (⚙️ gear icon)
3. Paste the Web App URL into **Google Apps Script URL**
4. You should see: "✓ Proxy URL saved — Apollo searches will route through server"

Once configured, Apollo searches will automatically route through the proxy, bypassing CORS restrictions. This means you can open the app by double-clicking `index.html` — no localhost server needed.

## Using the Sync Features

### Manual Sync

| Button | Action |
|--------|--------|
| **⬆️ Push to Sheets** | Send your local data to Google Sheets |
| **⬇️ Pull from Sheets** | Get data from Google Sheets to your browser |
| **📊 Sync** (in header) | Quick push to sheets |

### Auto-Sync

1. In Settings, enable the **Auto-sync** toggle
2. Choose an interval:
   - **1 minute** - For active collaboration
   - **5 minutes** - Recommended for most teams
   - **15 minutes** - For less frequent updates
   - **30 minutes** - For light usage

### Team Workflow

1. **Morning**: Pull latest data from Sheets
2. **During calls**: App auto-syncs (if enabled)
3. **After changes**: Push to Sheets
4. **End of day**: Final push to ensure all data is saved

## Troubleshooting

### "CORS Error" or "Network Error"

**Cause**: The Web App is not accessible from your browser.

**Solution**:
1. Go back to Apps Script
2. Click **Deploy → Manage deployments**
3. Click the pencil icon to edit
4. Ensure "Who has access" is set to **Anyone**
5. Click **Deploy**

### "Authorization Error"

**Cause**: The script doesn't have permission to run.

**Solution**:
1. Go to Apps Script
2. Click **Run → doGet** (any function)
3. Complete the authorization flow again

### "Sheet not found"

**Cause**: Sheet names don't match exactly.

**Solution**:
1. Open your Google Sheet
2. Check that tabs are named exactly `Leads` and `Tasks`
3. Names are case-sensitive

### Data Not Appearing

**Cause**: Sync may have failed silently.

**Solution**:
1. Check the **SyncLog** sheet for errors
2. Try a manual Push, then Pull
3. Check browser console for errors (F12)

### Duplicate Data

**Cause**: Multiple syncs created duplicates.

**Solution**:
1. In Apps Script, run the `removeDuplicates()` function
2. Or manually delete duplicate rows in the sheet

## Security Considerations

### Who Can Access Your Data?

- **Web App URL**: Anyone with the URL can access the API
- **Google Sheet**: Only people you share it with can see the data
- **Recommendation**: Don't share the Web App URL publicly

### Limiting Access

For more security, change "Who has access" to:
- **Anyone with Google account** - Requires login
- **Only myself** - Only you can sync (not for teams)

### API Key Protection

The Web App URL acts as an API key. Treat it like a password:
- Don't post it publicly
- Share only with team members
- Rotate by creating a new deployment if compromised

## Advanced: Multiple Teams

To support multiple teams with separate data:

1. Create separate Google Sheets for each team
2. Deploy separate Apps Scripts
3. Each team uses their own Web App URL

## Updating the Script

When updates are available:

1. Copy the new script code
2. Go to Apps Script editor
3. Replace all code
4. Click **Save**
5. Click **Deploy → Manage deployments**
6. Click **Edit** (pencil icon)
7. Change version to **New version**
8. Click **Deploy**

The same URL will now use the updated code.
