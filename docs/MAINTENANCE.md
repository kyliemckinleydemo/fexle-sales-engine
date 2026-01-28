# Fexle Sales Engine — Maintenance Guide

Everything customizable lives in two files: **`index.html`** (frontend app, 8,284 lines) and **`scripts/google-apps-script.js`** (backend proxy + sync). This guide maps where things are, how to change them, and how often to review.

---

## Quick Reference

| What to change | File | Lines | Review cadence |
|---|---|---|---|
| Pro tips | `index.html` | 26–57 | Quarterly |
| Lead scoring weights | `index.html` | 81–127 | Quarterly |
| Apollo API config | `index.html` | 187–194 | Rarely |
| Company info | `index.html` | 291–309 | Quarterly |
| Call scripts | `index.html` | 312–435 | Monthly |
| Industry verticals | `index.html` | 438–1196 | Quarterly |
| Apollo search defaults | `index.html` | 1428–1437 | As needed |
| Email templates | `index.html` | 1643–1924 | Monthly |
| AI research prompt | `index.html` | 3020–3084 | As needed |
| API keys / Sheet config | `scripts/google-apps-script.js` | 24–30 | Rarely |
| Sheet headers | `scripts/google-apps-script.js` | 422–442 | Rarely |

---

## 1. Pro Tips (`COLD_CALLING_PRO_TIPS` — lines 26–57)

Rotating tips shown in the UI, one per day.

**Structure** — array of objects:

```js
{ tip: "Stand up when making calls...", icon: "🧍" }
```

**To add a tip:** append an object to the array before the closing `];`.

**To remove a tip:** delete the object and its trailing comma.

**Review:** quarterly refresh to keep tips relevant.

---

## 2. Lead Scoring (`SCORING_WEIGHTS` — lines 81–127)

Controls how leads are scored (0–100). Five categories, each with a max point value:

| Category | Max points | What it scores |
|---|---|---|
| `companySize` | 20 | Employee count buckets |
| `revenue` | 20 | Annual revenue tiers |
| `titleScore` | 25 | Contact seniority / relevance |
| `intentSignals` | 20 | Buying signals detected |
| `verticalFit` | 15 | Industry alignment |

**To adjust weights:** change the point values inside each category. Keep the total max at 100.

**To change thresholds:** edit the bucket ranges within each category object (e.g., employee count breakpoints for `companySize`).

**Review:** quarterly, informed by win/loss analysis.

---

## 3. Apollo API Config (`APOLLO_CONFIG` — lines 187–194)

Static configuration for the Apollo.io API:

```js
const APOLLO_CONFIG = {
  baseUrl: 'https://api.apollo.io/v1',
  endpoints: {
    search: '/mixed_people/search',
    // ...
  }
};
```

**When to change:** only if Apollo changes their API endpoints or base URL.

---

## 4. Company Information (`FEXLE_INFO` — lines 291–309)

Central object for all Fexle branding and proof points used throughout the app:

```js
const FEXLE_INFO = {
  name: "Fexle Services",
  tagline: "Australia's Most Cost-Effective Salesforce Implementation Partner",
  // size, locations, products, proof points...
};
```

**To update:** edit the property values directly. Changes propagate everywhere the object is referenced — scripts, email templates, research prompts.

**Review:** quarterly or whenever stats (team size, locations, certifications) change.

---

## 5. Call Scripts (`FEXLE_SCRIPTS` — lines 312–435)

All cold-call talk tracks, organized by section:

| Section | Description |
|---|---|
| `openings` | Named openers, each with `{ name, script, why }` |
| `pivots` | Transition phrases to steer the conversation |
| `closes` | Closing scripts for Salesforce prospects |
| `closesNonSF` | Closing scripts for non-Salesforce prospects |
| `objectionsNonSF` | Objection-handling for non-SF conversations |
| `keyMessages` | Core value propositions |

**To add a new opening:**

```js
openings: {
  // ... existing entries ...
  newOpener: {
    name: "New Opener Name",
    script: "Hi {name}, this is ...",
    why: "Explanation of when to use this"
  }
}
```

**To edit an objection handler:** find the objection key and update the string value.

**Review:** monthly with the sales team.

---

## 6. Industry Verticals (`verticalData` — lines 438–1196)

759 lines covering all supported industries. Each vertical is a keyed object:

```js
verticalData = {
  healthcare: {
    name: "Healthcare & Life Sciences",
    icon: "🏥",
    painPoints: [...],
    triggers: [...],
    competitors: [...],
    openings: [...],
    objections: {...},
    agentforceUseCase: "..."
  },
  // ... more verticals
};
```

**To add a new vertical:**

1. Pick a camelCase key (e.g., `legalServices`).
2. Copy an existing vertical block as a template.
3. Fill in all fields: `name`, `icon`, `painPoints`, `triggers`, `competitors`, `openings`, `objections`, `agentforceUseCase`.
4. Add the key to any UI dropdowns or filters that enumerate verticals.

**To edit an existing vertical:** find its key and update the fields.

**Review:** quarterly or when entering a new market segment.

---

## 7. Apollo Search Defaults (lines 1428–1437)

Default filter values for the Apollo people search:

```js
const [apolloSearchParams, setApolloSearchParams] = useState({
  personTitles: ['CEO', 'COO', 'CIO', 'CTO', 'Managing Director', ...],
  personLocations: ['Australia'],
  // ...
});
```

**To change default titles or locations:** edit the arrays in the `useState` initializer.

**When to change:** when target persona or geography shifts.

---

## 8. Email Templates (`emailTemplates` — lines 1643–1924)

10 templates, each with a key, display name, subject line, and body with variable placeholders.

```js
const emailTemplates = {
  aiDeck: {
    name: "Send Agentforce Guide",
    subject: "...",
    body: `Hi [FIRST_NAME], ...`
  },
  // ...
};
```

**Variable reference:**

| Variable | Replaced with |
|---|---|
| `[FIRST_NAME]` | Contact's first name |
| `[COMPANY]` | Company name |
| `[INDUSTRY]` | Detected industry / vertical |
| `[PAIN_POINT]` | Top pain point from research |
| `[YOUR_NAME]` | Sender's name |

**To add a template:**

1. Add a new keyed entry inside `emailTemplates`.
2. Include `name`, `subject`, and `body`.
3. Use the variables above — they're interpolated at send time.

**To edit a template:** find the key and update `subject` or `body`.

**Review:** monthly messaging review.

---

## 9. AI Research Prompt (lines 3020–3084)

The prompt template sent to the Claude API when researching a lead. It defines what research to perform and the expected JSON output format.

**Key sections of the prompt:**
- Today's date injection
- Company details (name, website, vertical)
- Instructions for 11 research areas (company overview, key contacts, Salesforce likelihood, AI readiness, pain points, trigger events, recommended opening, talking points, recent news, priority level, priority reason)
- Required JSON output schema with keys like `recommendedVertical`, `companyOverview`, `keyContacts`, `salesforceLikelihood`, etc.

**To change research output:** edit the prompt text and/or the JSON schema at the end of the template string.

**To change the model or token limits:** look for the `fetch` call to the Anthropic API (or the Google Apps Script proxy) near the prompt — model and `max_tokens` are set there.

**When to change:** when research needs shift or you want different output fields.

---

## 10. Google Apps Script Backend (`scripts/google-apps-script.js`)

The backend proxy handles API key security, Google Sheets sync, and CORS.

### API Keys (lines 24–30)

```js
const CONFIG = {
  APOLLO_API_KEY: PropertiesService.getScriptProperties().getProperty('APOLLO_API_KEY') || '',
  ANTHROPIC_API_KEY: PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY') || ''
};
```

Keys are stored in **Google Apps Script > Project Settings > Script Properties** — never in source code.

### Sheet Headers (lines 422–442)

**Leads sheet** — 27 columns:
`id`, `lastModified`, `_version`, `_syncedBy`, `_syncedAt`, `_dirty`, `company`, `contact`, `title`, `phone`, `email`, `vertical`, `companySize`, `revenue`, `employeeCount`, `website`, `linkedinUrl`, `city`, `state`, `country`, `industry`, `source`, `sourceId`, `status`, `score`, `lastContact`, `lastContactDate`, `notes`, `assignedTo`, `createdDate`, `intentSignals`, `technologies`, `research`

**Tasks sheet** — 11 columns:
`id`, `lastModified`, `_version`, `_syncedBy`, `_syncedAt`, `_dirty`, `leadId`, `type`, `description`, `dueDate`, `dueTime`, `completed`, `completedAt`, `priority`, `assignedTo`, `createdDate`

### Key Endpoints

| Method | Action | Purpose |
|---|---|---|
| GET | `getLeads` | Fetch all leads or changes since timestamp |
| GET | `getTasks` | Fetch all tasks or changes since timestamp |
| GET | `status` | API status and capabilities |
| GET | `getChanges` | Delta fetch by timestamp |
| POST | `syncLeads` / `syncTasks` | Full sync with version conflict detection |
| POST | `syncIncremental` | Delta sync for dirty records only |
| POST | `deleteLead` / `deleteTask` | Delete by ID |
| POST | `apolloSearch` | Proxy Apollo requests (hides API key) |
| POST | `anthropicResearch` | Proxy Claude requests (hides API key) |

### How to Redeploy the Script

1. Open the Google Sheet linked to the Sales Engine.
2. Go to **Extensions > Apps Script**.
3. Replace the script content with the updated `scripts/google-apps-script.js`.
4. Click **Deploy > Manage deployments**.
5. Edit the existing deployment and bump the version.
6. Copy the new Web App URL if it changed and update it in the Sales Engine settings.

### Utility Functions

- `removeDuplicates()` — deduplicate records by ID.
- `clearAllData()` — reset all data except headers.
- `getStats()` — log sheet statistics to the Apps Script console.
- Run these from the Apps Script editor via **Run > [function name]**.

---

## 11. Maintenance Schedule

### Monthly

- [ ] Review call scripts with sales team (`FEXLE_SCRIPTS`, lines 312–435)
- [ ] Review email templates for messaging updates (`emailTemplates`, lines 1643–1924)
- [ ] Check pro tips are still relevant (`COLD_CALLING_PRO_TIPS`, lines 26–57)

### Quarterly

- [ ] Update company info — team size, locations, certifications (`FEXLE_INFO`, lines 291–309)
- [ ] Review lead scoring weights against win/loss data (`SCORING_WEIGHTS`, lines 81–127)
- [ ] Audit industry verticals — add new ones, retire irrelevant ones (`verticalData`, lines 438–1196)
- [ ] Refresh pro tips (`COLD_CALLING_PRO_TIPS`, lines 26–57)

### As Needed

- [ ] Update AI research prompt when research needs change (lines 3020–3084)
- [ ] Update Apollo search defaults when target persona shifts (lines 1428–1437)
- [ ] Update Apollo API config if their API changes (`APOLLO_CONFIG`, lines 187–194)
- [ ] Rotate API keys in Google Apps Script Properties

---

## 12. How to Redeploy

### Frontend (`index.html`)

1. Edit `index.html` in your local clone.
2. Test locally by opening the file in a browser.
3. Commit and push to GitHub:
   ```bash
   git add index.html
   git commit -m "Update [what you changed]"
   git push
   ```
4. If hosted on GitHub Pages, the site updates automatically after push.

### Google Apps Script

See [How to Redeploy the Script](#how-to-redeploy-the-script) in section 10 above.
