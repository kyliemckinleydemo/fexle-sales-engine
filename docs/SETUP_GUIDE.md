# Setup Guide

This guide walks you through setting up the Fexle Sales Engine from scratch.

## Table of Contents

1. [Basic Setup](#basic-setup)
2. [API Configuration](#api-configuration)
3. [Google Sheets Setup](#google-sheets-setup)
4. [Production Deployment](#production-deployment)

---

## Basic Setup

### Requirements

- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Internet connection (for API features)

### Installation

#### Option 1: Direct Download

1. Download `index.html` from this repository
2. Double-click to open in your default browser
3. Done! The app runs entirely in your browser

#### Option 2: Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/fexle-sales-engine.git
cd fexle-sales-engine
open index.html
```

#### Option 3: Web Hosting

Upload `index.html` to any web hosting service:
- GitHub Pages
- Netlify
- Vercel
- AWS S3
- Any static file host

### Initial Configuration

1. **Open the App** - Click the file or navigate to the URL
2. **Open Settings** - Click the ⚙️ gear icon
3. **Enter Your Name** - This personalizes scripts and emails
4. **Explore Sample Data** - Sample leads are included by default

---

## API Configuration

### Apollo.io (Lead Search)

Apollo.io provides access to 250M+ business contacts.

#### Getting Your API Key

1. Go to [apollo.io](https://apollo.io) and sign up
2. Choose a plan (Pro at $99/month recommended)
3. Navigate to **Settings → Integrations → API**
4. Click **Generate API Key**
5. Copy the key

#### Configuring in App

1. Open Settings (⚙️)
2. Find **Apollo.io API Key**
3. Paste your key
4. Key is saved automatically

#### Usage Limits

| Plan | Monthly Credits | API Calls |
|------|-----------------|-----------|
| Free | 50 | Limited |
| Basic | 200 | Standard |
| Pro | 400 | Standard |
| Organization | Unlimited | Unlimited |

### Anthropic Claude (AI Research)

Claude powers the AI Research feature for company analysis.

#### Getting Your API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an account or sign in
3. Navigate to **Settings → API Keys**
4. Click **Create Key**
5. Copy the key (starts with `sk-ant-`)

#### Configuring in App

1. Open Settings (⚙️)
2. Find **Anthropic API Key**
3. Paste your key
4. Key is saved automatically

#### Pricing

- Pay-per-use model
- ~$0.01-0.03 per research query
- No monthly minimum

---

## Google Sheets Setup

Google Sheets enables team collaboration by syncing data to a shared spreadsheet.

### Step 1: Create the Sheet

1. Go to [sheets.new](https://sheets.new)
2. Name your spreadsheet (e.g., "Fexle Sales Engine Data")
3. Create two sheets (tabs) named exactly:
   - `Leads`
   - `Tasks`

### Step 2: Add Apps Script

1. In your Google Sheet, go to **Extensions → Apps Script**
2. Delete any existing code
3. Copy the entire contents of `scripts/google-apps-script.js`
4. Paste into the Apps Script editor
5. Click **Save** (Ctrl+S / Cmd+S)

### Step 3: Deploy as Web App

1. Click **Deploy → New deployment**
2. Click the gear icon ⚙️
3. Select **Web app**
4. Configure:
   - **Description**: "Fexle Sales Engine Backend"
   - **Execute as**: Me
   - **Who has access**: Anyone
5. Click **Deploy**
6. Click **Authorize access**
7. Choose your Google account
8. Click **Advanced** → **Go to [Project Name]**
9. Click **Allow**
10. **Copy the Web App URL**

### Step 4: Connect in App

1. Open Fexle Sales Engine
2. Go to Settings (⚙️)
3. Find **Google Sheets Sync**
4. Paste the Web App URL
5. Click **Test Connection**
6. You should see "✓ Connected"

### Troubleshooting

| Issue | Solution |
|-------|----------|
| CORS Error | Ensure "Who has access" = "Anyone" |
| Authorization Error | Re-deploy after code changes |
| Connection Failed | Check URL is correct, redeploy |
| Data Not Syncing | Verify sheet names are exact |

---

## Production Deployment

### For Individual Use

The default setup (opening `index.html` locally) works great for individual use.

### For Team Use

#### Option 1: Shared File Location

1. Place `index.html` on a shared network drive
2. Each team member opens from the shared location
3. Configure Google Sheets sync for data sharing

#### Option 2: Internal Web Server

1. Host on internal web server
2. Access via company intranet URL
3. All team members use same URL

#### Option 3: Cloud Hosting

Host on any static site platform:

**GitHub Pages:**
```bash
# Push to GitHub
git push origin main

# Enable Pages in repo settings
# Access at: https://username.github.io/fexle-sales-engine
```

**Netlify:**
```bash
# Drag and drop the folder to netlify.com
# Or connect to Git repo for auto-deploy
```

### Security Considerations

1. **API Keys** - Stored in browser localStorage (per-user)
2. **Lead Data** - Stored locally or in your Google Sheet
3. **No Server** - No data sent to external servers (except APIs you configure)

### Backup Strategy

1. **Enable Google Sheets sync** for automatic cloud backup
2. **Export CSV regularly** (app reminds every 3 days)
3. **Keep multiple backup files** with dates

---

## Next Steps

- Read the [User Guide](USER_GUIDE.md) for feature documentation
- Check [API Integration](API_INTEGRATION.md) for advanced API usage
- Review [Scoring Model](SCORING_MODEL.md) to understand lead prioritization
