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
3. Choose a plan:

| Plan | Price | Credits/Month | Best For |
|------|-------|---------------|----------|
| Free | $0 | 50 | Testing |
| Basic | $49 | 200 | Individual |
| Professional | $99 | 400 | Small teams |
| Organization | Custom | Unlimited | Large teams |

4. Navigate to **Settings → Integrations → API**
5. Click **Generate API Key**
6. Copy the key

### Configuration

1. Open Fexle Sales Engine
2. Go to **Settings** (⚙️)
3. Find **Apollo.io API Key**
4. Paste your key
5. Key saves automatically

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

### Troubleshooting Apollo

| Issue | Solution |
|-------|----------|
| "Invalid API Key" | Regenerate key in Apollo settings |
| "Rate limit exceeded" | Wait 1 minute, reduce batch size |
| "No results" | Broaden search criteria |
| CORS error | Apollo may block browser requests - see below |

#### CORS Workaround

If you get CORS errors, Apollo may be blocking direct browser requests. Options:

1. **Use Apollo's Chrome Extension** for manual searches
2. **Export from Apollo website** and import via CSV
3. **Set up a proxy** server (advanced)

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

API keys are stored in your browser's localStorage:

```javascript
// Keys stored as:
localStorage.getItem('fexle_sales_engine_data')
// Contains: { anthropicApiKey: '...', apolloApiKey: '...' }
```

### Security Best Practices

1. **Don't share keys** - Each user should have their own
2. **Rotate regularly** - Generate new keys periodically
3. **Use separate keys** - Don't reuse keys across apps
4. **Monitor usage** - Check API dashboards for unusual activity

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
