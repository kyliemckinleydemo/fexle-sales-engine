# API Integration Guide

This document covers the external API integrations used by the Fexle Sales Engine.

## Overview

The Sales Engine integrates with two external APIs:

| API | Purpose | Required? |
|-----|---------|-----------|
| **Apollo.io** | Lead search and import | Optional |
| **Anthropic Claude** | AI-powered company research | Optional |

Both APIs are optional - the app works fully without them, just without those specific features.

---

## Apollo.io Integration

### What It Does

Apollo.io provides access to a database of 250M+ business contacts. The integration allows you to:

- Search for contacts by job title, company size, location
- Filter by intent signals (researching CRM, hiring Salesforce roles)
- Import leads directly into the Sales Engine
- Automatic lead scoring based on Apollo data

### Getting an API Key

1. Go to [apollo.io](https://www.apollo.io)
2. Sign up for an account
3. Choose a **paid plan** (API access requires Basic or higher):

| Plan | Price | Credits/Month | API Access |
|------|-------|---------------|-----------|
| Free | $0 | 50 | No API access |
| Basic | $49 | 200 | Yes |
| Professional | $99 | 400 | Yes |
| Organization | Custom | Unlimited | Yes |

4. Navigate to **Settings → Integrations → API**
5. Click **Generate API Key**
6. Copy the key

> **Note:** The free plan does not include API search access. All search endpoints return a 403 error on free plans.

### Configuration

There are two ways to configure Apollo:

**Option A — Direct API key (requires localhost):**
1. Open Fexle Sales Engine
2. Go to **Settings** (⚙️)
3. Find **Apollo.io API Key**
4. Paste your key
5. Key saves automatically
6. Serve the app from `http://localhost` (see [CORS](#cors-and-browser-access) below)

**Option B — Google Apps Script proxy (recommended):**
1. Set up the Google Apps Script backend (see [GOOGLE_SHEETS_SETUP.md](GOOGLE_SHEETS_SETUP.md))
2. Add `APOLLO_API_KEY` to Script Properties in the Apps Script editor
3. Paste the Web App URL into Settings → **Google Apps Script URL**
4. Apollo searches route server-to-server — no CORS issues, works in any browser

### Using Apollo Search

1. Click **🚀 Apollo Search** in the header
2. Configure search filters:
   - **Keywords**: Terms like "Salesforce", "CRM"
   - **Job Titles**: CEO, COO, CIO, etc.
   - **Company Size**: 51-200, 201-500, etc.
   - **Results**: 10, 25, 50, or 100
3. Click **Search Apollo**
4. Select leads to import
5. Click **Import X Leads**

### Search Parameters

```javascript
{
  personTitles: ['CEO', 'COO', 'CIO', 'CTO'],
  personLocations: ['Australia'],
  organizationLocations: ['Australia'],
  employeeRanges: ['51-200', '201-500', '501-1000'],
  keywords: 'Salesforce digital transformation',
  page: 1,
  perPage: 25
}
```

### Rate Limits

| Limit Type | Value |
|------------|-------|
| Requests per second | 5 |
| Requests per minute | 100 |
| Monthly credits | Based on plan |

### API Authentication

Apollo requires the API key in the `X-Api-Key` HTTP header (not the request body). The app handles this automatically for both direct and proxy modes.

### CORS and Browser Access

Apollo's API only allows cross-origin requests from `http://localhost`. This means:

| Origin | Apollo API Works? |
|--------|------------------|
| `file://` (double-click HTML) | No — CORS blocks it |
| `http://localhost` (any port) | Yes |
| `http://127.0.0.1` | No |
| Google Apps Script proxy | Yes (recommended) |

**Recommended solution:** Use the Google Apps Script proxy. It routes requests server-to-server, bypassing CORS entirely and keeping your API key secure. See [GOOGLE_SHEETS_SETUP.md](GOOGLE_SHEETS_SETUP.md) for setup.

**Alternative:** Serve the app from localhost:
```bash
cd fexle-sales-engine
python3 -m http.server 8000
# Open http://localhost:8000
```

### Troubleshooting Apollo

| Issue | Solution |
|-------|----------|
| "API key must be passed in the X-Api-Key header" | Update to the latest version of the app |
| "not accessible with this api_key on a free plan" | Upgrade to Apollo Basic ($49/mo) or higher |
| "Invalid API Key" | Regenerate key in Apollo settings |
| "Rate limit exceeded" | Wait 1 minute, reduce batch size |
| "No results" | Broaden search criteria |
| CORS error (direct mode) | Use the Google Apps Script proxy or serve from localhost |
| Apollo proxy error | Check `APOLLO_API_KEY` in Script Properties |

---

## Anthropic Claude Integration

### What It Does

Claude AI powers the Research feature, providing:

- Company overview and background
- Potential pain points analysis
- Salesforce readiness assessment
- Personalized talking points
- Recommended opening script
- Priority rating (HIGH/MEDIUM/LOW)

### Getting an API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an account or sign in
3. Navigate to **Settings → API Keys**
4. Click **Create Key**
5. Name it (e.g., "Fexle Sales Engine")
6. Copy the key (starts with `sk-ant-`)

### Pricing

Claude uses pay-per-use pricing:

| Model | Input | Output |
|-------|-------|--------|
| Claude 3 Haiku | $0.25/1M tokens | $1.25/1M tokens |
| Claude 3 Sonnet | $3/1M tokens | $15/1M tokens |
| Claude 3 Opus | $15/1M tokens | $75/1M tokens |

**Typical cost per research query**: $0.01 - $0.05

### Configuration

1. Open Fexle Sales Engine
2. Go to **Settings** (⚙️)
3. Find **Anthropic API Key**
4. Paste your key
5. Key saves automatically

### Using AI Research

1. Select a lead in the Call Center
2. Click **🔍 Research** button
3. Wait 15-30 seconds for analysis
4. Review the research report:
   - Priority level
   - Company overview
   - Pain points
   - Talking points
   - Recommended opening

### Research Prompt

The system sends this context to Claude:

```
Research this company for a B2B sales call:

Company: [Company Name]
Contact: [Contact Name]
Title: [Title]
Industry: [Vertical]
Notes: [Any existing notes]

Provide:
1. Company overview
2. Likely pain points related to Salesforce/CRM
3. Assessment of Salesforce implementation likelihood
4. Personalized talking points
5. Recommended opening line
6. Priority rating (HIGH/MEDIUM/LOW)
```

### Rate Limits

| Limit Type | Value |
|------------|-------|
| Requests per minute | 60 |
| Tokens per minute | 100,000 |
| Concurrent requests | 10 |

### Troubleshooting Claude

| Issue | Solution |
|-------|----------|
| "Invalid API Key" | Check key starts with `sk-ant-` |
| "Rate limit exceeded" | Wait 1 minute between requests |
| "Context too long" | Reduce notes length |
| No response | Check internet connection |

---

## API Key Security

### Storage

API keys can be stored in two places:

**Browser localStorage (direct mode):**
```javascript
localStorage.getItem('sales_engine_data')
// Contains: { anthropicApiKey: '...', apolloApiKey: '...' }
```

**Google Apps Script Properties (proxy mode — more secure):**
- Keys stored server-side in Google's infrastructure
- Not exposed to the browser
- Configured in Apps Script → Project Settings → Script Properties

### Security Best Practices

1. **Use the proxy** - Keeps API keys server-side, not in the browser
2. **Don't share keys** - Each user should have their own
3. **Rotate regularly** - Generate new keys periodically
4. **Use separate keys** - Don't reuse keys across apps
5. **Monitor usage** - Check API dashboards for unusual activity

### If a Key is Compromised

1. **Apollo**: Go to Settings → API → Revoke and regenerate
2. **Anthropic**: Go to API Keys → Delete and create new

---

## Custom API Integration

### Adding New APIs

The app is designed to be extensible. To add a new API:

1. Add API configuration to Settings state
2. Create API wrapper functions (like `GoogleSheetsAPI`)
3. Add UI components for the feature
4. Update storage to persist API keys

### Example: Adding a New Service

```javascript
// 1. Add state
const [newApiKey, setNewApiKey] = useState('');

// 2. Create wrapper
const NewServiceAPI = {
  search: async (params) => {
    const response = await fetch('https://api.newservice.com/search', {
      headers: { 'Authorization': `Bearer ${newApiKey}` },
      // ...
    });
    return response.json();
  }
};

// 3. Add to Settings UI
<input 
  value={newApiKey}
  onChange={(e) => setNewApiKey(e.target.value)}
/>

// 4. Add to storage
saveToStorage({ ...data, newApiKey });
```

---

## API Status Dashboard

To monitor your API usage:

### Apollo.io
- Dashboard: [app.apollo.io/settings/api](https://app.apollo.io/settings/api)
- Shows: Credits used, remaining, history

### Anthropic
- Dashboard: [console.anthropic.com/usage](https://console.anthropic.com/usage)
- Shows: Tokens used, costs, rate limits
