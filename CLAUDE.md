# Fexle Sales Engine

AI-powered cold calling and lead generation platform for Australian B2B sales teams. Features multi-user support, white-label capabilities, and Twilio/Supabase integrations.

## Tech Stack

| Component | Technology | Notes |
|-----------|------------|-------|
| Frontend | React 18 | Single-file SPA via CDN (no build step) |
| Styling | Tailwind CSS | Utility-first, loaded via CDN |
| Backend | Supabase | Auth, PostgreSQL, real-time sync, Edge Functions |
| Voice/SMS | Twilio | Browser-based calling, SMS, webhooks |
| AI | Claude API | Lead research and insights |
| Lead Data | Apollo.io | Lead search and enrichment |
| Runtime | Node.js (ES Modules) | For utilities and testing |
| Testing | Vitest | 480 tests with coverage |

## Project Structure

```
fexle-sales-engine/
├── index.html                 # Main SPA (~750KB, entire React app)
├── src/
│   ├── index.js               # Library entry point
│   ├── constants/
│   │   ├── index.js           # Exports all constants
│   │   ├── phone-formats.js   # Country codes, area codes
│   │   └── scoring-weights.js # Lead scoring configuration
│   └── utils/
│       ├── index.js           # Exports all utilities
│       ├── phone.js           # Phone formatting (E.164, display, validation)
│       ├── scoring.js         # Lead score calculation
│       ├── dates.js           # Date/time utilities
│       ├── csv.js             # CSV parsing for imports
│       ├── storage.js         # localStorage wrapper
│       ├── transform.js       # Data transformation
│       └── analytics.js       # Tracking utilities
├── config/
│   ├── company.json           # Branding, CEO info, contact details
│   ├── onboarding.json        # 8-step tour configuration
│   ├── scoring.json           # Scoring weights and thresholds
│   ├── scripts.json           # Call scripts by vertical
│   ├── verticals.json         # 19 industry vertical definitions
│   ├── target-actions.json    # Meeting types (CEO Meeting, Demo, etc.)
│   ├── collateral.json        # Marketing materials config
│   └── localization.json      # AU/US/UK phone and currency
├── supabase/
│   ├── migrations/            # Database schema (3 migrations)
│   └── functions/             # Edge Functions
│       ├── twilio-voice/      # Voice call handling
│       ├── sms-send/          # SMS dispatch
│       ├── webhook-dispatch/  # Webhook routing
│       └── send-daily-report/ # Automated reporting
├── scripts/
│   └── google-apps-script.js  # Google Sheets automation
├── tests/
│   ├── utils/                 # Unit tests (phone, scoring, etc.)
│   └── integration/           # Workflow tests
└── docs/
    └── USER_GUIDE.md          # Feature documentation
```

## Commands

```bash
npm test              # Run all tests (328 tests)
npm run test:watch    # Watch mode
npm run test:ui       # Vitest UI
npm run test:coverage # Coverage report
```

No build step required - open `index.html` directly in browser.

## Main Application Screens

| Tab | Purpose | Key Components |
|-----|---------|----------------|
| Dashboard | Daily priorities | Today view, call list, performance metrics |
| Call Center | Active calling | Lead card, quick actions, milestones, call timer |
| Playbooks | Scripts by industry | 19 verticals, openers, objections, closes |
| Analytics | Performance tracking | Source ROI, metrics, filtering |

## Key Data Models

### Lead
```javascript
{
  id: string,
  company: string,
  contact: string,
  title: string,
  phone: string,
  email: string,
  score: number,              // 0-100, auto-calculated
  vertical: string,           // Industry vertical
  company_size: string,       // Employee count bracket
  revenue: string,            // Revenue bracket
  intent_signals: string[],   // Hiring, research, funding
  status: string,             // new, contacted, qualified
  last_contact: string,
  notes: string,
  research: string,           // Claude AI research output
  source: string,             // apollo, csv, manual
  // Milestones
  discovery_done: boolean,
  deck_sent: boolean,
  meeting_held: boolean,
  proposal_sent: boolean,
  won: boolean,
  lost: boolean
}
```

### Lead Score Calculation (0-100)
| Factor | Weight | Criteria |
|--------|--------|----------|
| Company Size | 20 pts | Sweet spot: 201-500 employees |
| Revenue | 20 pts | Sweet spot: $50M-$200M AUD |
| Title/Role | 25 pts | CEO/MD = 25, C-Suite = 20 |
| Intent Signals | 20 pts | 5 pts per signal (max 4) |
| Vertical Fit | 15 pts | Healthcare/Financial = 15 |

## Phone Utility Functions

```javascript
// Core formatting
formatPhoneE164(phone, country?)   // → '+61412345678' (Twilio API)
formatPhoneForTel(phone, country?) // → '+61412345678' (tel: links)
formatPhoneDisplay(phone, country?) // → '0412 345 678' (human display)

// Validation
validatePhone(phone, country)       // → boolean
isValidE164(phone)                  // → boolean (strict E.164 check)

// Parsing
parsePhone(phone, country?)         // → { e164, tel, display, country, valid }
detectPhoneCountry(phone)           // → 'AU' | 'US' | 'CA' | 'UK' | null
```

## Deployment Modes

### Local Mode (Default)
- Open `index.html` in browser
- Data stored in localStorage
- Single user only

### Multi-User Mode (Supabase)
- Requires Supabase project + 3 migrations
- Email/OAuth authentication
- Real-time sync, team features
- 4 roles: owner, admin, member, viewer

## CLAUDE NOTES

### Phone Numbers
- Default country: Australia (AU)
- E.164 format required for Twilio API
- `formatPhoneE164()` added for strict Twilio compliance
- 1300/1800 AU numbers need explicit 'AU' country hint
- 92 tests cover phone utilities

### Lead Scoring
- Score auto-recalculates on lead save
- Scores drive "Today" dashboard prioritization
- Hot (80-100), Warm (60-79), Cool (40-59), Cold (0-39)

### Integrations
- **Claude API**: Powers "Research" button for AI company intel
- **Apollo.io**: Powers lead search with 8+ filters
- **Twilio**: Browser-based VoIP calling + SMS via Edge Functions
- **Google Sheets**: Optional sync via Apps Script

### Testing
- 480 tests total, all passing
- Phone utilities: 92 tests (including E.164 functions)
- Script builder utilities: 120+ tests (including override functions)
- Run `npm test` before committing

### Single-File Architecture
- Entire React app is in `index.html` (~750KB)
- No build step - uses CDN for React, Tailwind, Babel
- Edit carefully - no component file separation

### Key Code Locations in index.html
- Auth: Lines ~100-180 (AuthContext, AuthProvider)
- Org: Lines ~184-350 (OrgContext, multi-user)
- Scoring: Search for `calculateLeadScore`
- Call Center: Search for `CallCenterPanel`
- Dashboard: Search for `DashboardTab`
- Onboarding: Search for `OnboardingTour`

### Configuration System
- Business rules in JSON config files (not code)
- White-label via `config/company.json`
- 19 industry verticals with unique scripts
- Configurable target actions (CEO Meeting, Demo, etc.)

### Communication Infrastructure
- Twilio Edge Functions for voice/SMS
- Status callbacks for call tracking
- Token-based authentication
- Webhook dispatch for integrations

### UX Improvements (v2.1)
Key UX changes to reduce overwhelm for new users:

**Call Center Declutter:**
- Milestones: Collapsible accordion (shows "2/6 complete" when collapsed)
- Notes: Moved to slide-out panel (button shows count + preview)
- Script panel: Hidden by default, toggle to show

**Score Badges:**
- Color-coded with labels: Hot (80+), Warm (60+), Cool (40+), Cold
- Uses `getScoreInfo(score)` helper function
- Applied across lead list, call center, dashboard

**Playbooks Tab:**
- Search input filters 19 industry verticals
- Button grid replaces dropdown for quick selection
- Filters by name and keywords

**Apollo Search:**
- 4 preset templates: Tech Sydney, Healthcare, Manufacturing Melbourne, Financial
- Progressive disclosure: basic filters shown, "More Filters" expands advanced
- Location filters now exposed in advanced section

**Onboarding:**
- Removed API key mention from final step
- Just-in-time prompts when features first used
- Skip tour button + "Restart Tour" in Settings

### Key State Variables
```javascript
milestonesExpanded    // Milestones accordion (persisted to localStorage)
showNotesPanel        // Notes slide-out panel
playbookSearch        // Playbook filter text
showAdvancedFilters   // Apollo progressive disclosure
verticalOverrides     // White-label script customizations
editingScriptItem     // Script item being edited in modal
```

### White-Label Script Customization (v2.2)
Admins can customize default vertical scripts per-organization without modifying the codebase.

**Storage:**
- Local mode: `localStorage:verticalOverrides`
- Supabase mode: `organizations.config.verticalOverrides`

**Editable Items:**
- Opening scripts (openings, openingScripts)
- Objection responses (objections, objectionHandlers)
- Pain points

**Key Functions in ScriptBuilder:**
```javascript
getMergedVertical(key, base, overrides)  // Apply overrides to base vertical
hasOverride(overrides, key, type, id)    // Check if item has override
setOverride(overrides, key, type, id, value)  // Create/update override
removeOverride(overrides, key, type, id)      // Reset to default
saveVerticalOverridesToStorage(overrides)     // Persist to localStorage
loadVerticalOverridesFromStorage()            // Load from localStorage
```

**UI Components:**
- Edit buttons on script cards (admin only)
- Script Edit Modal with original/custom comparison
- "Customized" badges on edited items
- "Reset All" button in admin banner
