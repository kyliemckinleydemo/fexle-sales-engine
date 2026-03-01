# Setup Guide

This guide walks you through setting up the Outbound Sales Engine from scratch.

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

> **Note:** Opening via `file://` works for all features except Apollo.io search, which requires either a localhost server or a Google Apps Script proxy (see [Apollo CORS](#apollo-cors) below).

#### Option 2: Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/outbound-sales-engine.git
cd outbound-sales-engine
open index.html
```

#### Option 3: Local Server (recommended for Apollo)

```bash
git clone https://github.com/YOUR_USERNAME/outbound-sales-engine.git
cd outbound-sales-engine
python3 -m http.server 8000
# Open http://localhost:8000
```

#### Option 4: Web Hosting

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

> **Important:** Apollo requires a **paid plan** (Basic or higher) for API search access. The free plan does not include API endpoints.

#### Getting Your API Key

1. Go to [apollo.io](https://apollo.io) and sign up
2. Choose a plan (Basic at $49/month minimum for API access)
3. Navigate to **Settings → Integrations → API**
4. Click **Generate API Key**
5. Copy the key

#### Configuring in App

**Option A — Direct API key (requires localhost):**
1. Open Settings (⚙️)
2. Find **Apollo.io API Key**
3. Paste your key
4. Key is saved automatically
5. Serve the app from `http://localhost` (see [Apollo CORS](#apollo-cors))

**Option B — Google Apps Script proxy (recommended):**
1. Set up the Google Apps Script backend (see [Google Sheets Setup](#google-sheets-setup))
2. Add your Apollo API key to Script Properties (see below)
3. Paste the Web App URL into Settings → **Google Apps Script URL**
4. Apollo searches route through the proxy — no CORS issues, works in any browser

#### Apollo CORS

Apollo's API only allows browser requests from `http://localhost`. This means:

| How You Open the App | Apollo Search Works? |
|---------------------|---------------------|
| `file://` (double-click HTML) | No — blocked by CORS |
| `http://localhost` (any port) | Yes |
| Google Apps Script proxy | Yes — recommended |

The **Google Apps Script proxy** is the best solution: it routes requests server-to-server, bypassing CORS entirely and keeping your API key secure on the server.

#### Usage Limits

| Plan | Monthly Credits | API Access |
|------|-----------------|-----------|
| Free | 50 | No API access |
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

Google Sheets enables team collaboration and also serves as a **server-side proxy** for Apollo.io API calls (bypassing CORS restrictions).

### Step 1: Create the Sheet

1. Go to [sheets.new](https://sheets.new)
2. Name your spreadsheet (e.g., "Outbound Sales Engine Data")
3. Create two sheets (tabs) named exactly:
   - `Leads`
   - `Tasks`

### Step 2: Add Apps Script

1. In your Google Sheet, go to **Extensions → Apps Script**
2. Delete any existing code
3. Copy the entire contents of `scripts/google-apps-script.js` (v3.0)
4. Paste into the Apps Script editor
5. Click **Save** (Ctrl+S / Cmd+S)

### Step 2b: Add API Keys to Script Properties (optional)

To use the proxy for Apollo searches:

1. In the Apps Script editor, click **Project Settings** (gear icon in left sidebar)
2. Scroll to **Script Properties**
3. Click **Add script property**
4. Add `APOLLO_API_KEY` with your Apollo API key as the value
5. (Optional) Add `ANTHROPIC_API_KEY` for server-side AI research

This stores your API keys securely on Google's servers, not in the browser.

### Step 3: Deploy as Web App

1. Click **Deploy → New deployment**
2. Click the gear icon ⚙️
3. Select **Web app**
4. Configure:
   - **Description**: "Outbound Sales Engine Backend"
   - **Execute as**: Me
   - **Who has access**: Anyone
5. Click **Deploy**
6. Click **Authorize access**
7. Choose your Google account
8. Click **Advanced** → **Go to [Project Name]**
9. Click **Allow**
10. **Copy the Web App URL**

### Step 4: Connect in App

1. Open Outbound Sales Engine
2. Go to Settings (⚙️)
3. Paste the Web App URL into **Google Apps Script URL**
4. Apollo searches will now route through the proxy automatically

### Troubleshooting

| Issue | Solution |
|-------|----------|
| CORS Error | Ensure "Who has access" = "Anyone" |
| Authorization Error | Re-deploy after code changes |
| Connection Failed | Check URL is correct, redeploy |
| Data Not Syncing | Verify sheet names are exact |
| Apollo proxy error | Check APOLLO_API_KEY in Script Properties |

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
# Access at: https://username.github.io/outbound-sales-engine
```

**Netlify:**
```bash
# Drag and drop the folder to netlify.com
# Or connect to Git repo for auto-deploy
```

### Security Considerations

1. **API Keys** - Stored in browser localStorage (per-user), or securely in Google Apps Script Properties when using the proxy
2. **Lead Data** - Stored locally or in your Google Sheet
3. **No Server** - No data sent to external servers (except APIs you configure and the optional Google Apps Script proxy)

### Backup Strategy

1. **Enable Google Sheets sync** for automatic cloud backup
2. **Export CSV regularly** (app reminds every 3 days)
3. **Keep multiple backup files** with dates

---

## Next Steps

- Read the [User Guide](USER_GUIDE.md) for feature documentation
- Check [API Integration](API_INTEGRATION.md) for advanced API usage
- Review [Scoring Model](SCORING_MODEL.md) to understand lead prioritization
