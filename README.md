# Outbound Sales Engine

<div align="center">

![Version](https://img.shields.io/badge/version-2.1.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Platform](https://img.shields.io/badge/platform-Browser-orange.svg)
![Tests](https://img.shields.io/badge/tests-vitest-green.svg)

**AI-Powered Cold Calling & Lead Generation Platform**

*White-label sales productivity platform for B2B teams*

[Features](#features) | [Quick Start](#quick-start) | [Multi-User Mode](#multi-user-mode) | [Testing](#testing) | [Documentation](#documentation)

</div>

---

## Overview

Sales Engine is a purpose-built sales productivity platform designed for B2B cold calling campaigns. It combines AI-powered research, intelligent lead scoring, Apollo.io integration, and proven call scripts to maximize sales team effectiveness.

### Two Operating Modes

| Mode | Best For | Data Storage |
|------|----------|--------------|
| **Local Mode** | Individual users, quick start | Browser localStorage |
| **Multi-User Mode** | Teams, white-label deployments | Supabase (PostgreSQL) |

---

## Features

### Core Capabilities

| Feature | Description |
|---------|-------------|
| **Apollo.io Integration** | Search and import qualified leads from Apollo's 250M+ contact database |
| **Lead Scoring** | Automated 0-100 scoring based on company size, revenue, title, intent signals |
| **Source Tracking** | Track lead sources and measure ROI by channel |
| **Google Sheets Sync** | Real-time team collaboration via shared Google Sheets |
| **Today Dashboard** | AI-prioritized daily task list |
| **Call Center** | Integrated calling interface with context-aware scripts |
| **CEO Calendar** | Visual booking system with ICS file generation |
| **Playbooks** | Industry-specific scripts for 11 verticals |
| **AI Research** | Claude-powered company research and call prep |
| **Email Templates** | 8 pre-built templates for every sales stage |

### Multi-User Features (Supabase Mode)

| Feature | Description |
|---------|-------------|
| **User Authentication** | Email/password and OAuth support |
| **Team Management** | Organizations with role-based access (owner, admin, member, viewer) |
| **White-Label** | Customizable branding, scripts, and company information |
| **Real-Time Sync** | Instant updates across all team members |
| **Activity Logging** | Full audit trail of all actions |

---

## Quick Start

### Option 1: Local Mode (Fastest)

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/sales-engine.git
cd sales-engine

# Open in browser
open index.html
```

That's it! Data is stored in your browser's localStorage.

### Option 2: Multi-User Mode (Teams)

See [Multi-User Mode](#multi-user-mode) below for Supabase setup.

---

## Multi-User Mode

For team usage with shared data, user authentication, and white-label support:

### 1. Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the migrations in `supabase/migrations/` (001, 002, 003 in order)
3. Get your Project URL and anon key from Settings → API

### 2. Connect the App

**Via URL parameters:**
```
index.html?supabase_url=https://xxxxx.supabase.co&supabase_key=eyJ...
```

**Or via in-app setup:**
1. Open the app
2. Click "Configure Database Connection"
3. Paste your credentials
4. Click "Connect & Save"

### 3. Create Your Organization

After signing up, you'll be prompted to create or join an organization. Organization admins can:

- Customize company branding and scripts
- Manage team members and roles
- Configure vertical-specific playbooks
- Set up white-label customization

For detailed setup instructions, see [docs/SETUP.md](docs/SETUP.md).

---

## Testing

This project uses [Vitest](https://vitest.dev/) for testing with real implementations (no mocking).

### Install Dependencies

```bash
npm install
```

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage report
npm run test:coverage

# Run with Vitest UI
npm run test:ui
```

### Test Structure

```
tests/
├── setup.js                 # Test environment setup
├── utils/
│   ├── scoring.test.js      # Lead scoring tests
│   ├── csv.test.js          # CSV parsing/generation tests
│   ├── phone.test.js        # Phone formatting tests
│   ├── dates.test.js        # Date calculation tests
│   ├── storage.test.js      # localStorage tests
│   └── transform.test.js    # Data transformation tests
└── integration/
    └── workflow.test.js     # End-to-end workflow tests
```

### Coverage Targets

| Module | Target |
|--------|--------|
| scoring.js | 95% |
| csv.js | 90% |
| phone.js | 90% |
| dates.js | 90% |
| storage.js | 85% |
| transform.js | 90% |

For more details, see [docs/TESTING.md](docs/TESTING.md).

---

## Lead Scoring Model

Leads are automatically scored 0-100 based on ICP fit:

| Factor | Max Points | Sweet Spot |
|--------|------------|------------|
| Company Size | 20 | 201-500 employees |
| Revenue | 20 | $50M-$200M AUD |
| Title/Role | 25 | CEO, COO, CIO, CTO |
| Intent Signals | 20 | Hiring Salesforce, researching CRM |
| Vertical Fit | 15 | Healthcare, Financial Services |

### Score Interpretation

- **80-100** Hot - Call immediately
- **60-79** Warm - Call this week
- **40-59** Cool - Email first
- **0-39** Cold - Deprioritize

---

## Multi-Country Phone Support

The app automatically detects and formats phone numbers for:

| Country | Detection | Display Format | tel: Format |
|---------|-----------|----------------|-------------|
| Australia | 04XX, 02/03/07/08 | 0412 345 678 | +61412345678 |
| USA | 10-digit, +1 | (202) 555-1234 | +12025551234 |
| Canada | CA area codes | (416) 555-1234 | +14165551234 |
| UK | 07XX, +44 | 07123 456789 | +447123456789 |

---

## Repository Structure

```
sales-engine/
├── index.html              # Main application (single HTML file)
├── package.json            # npm dependencies and scripts
├── vitest.config.js        # Test configuration
├── README.md               # This file
├── CLAUDE.md               # AI assistant instructions
├── src/                    # Extracted modules for testing
│   ├── constants/          # Configuration constants
│   │   ├── scoring-weights.js
│   │   └── phone-formats.js
│   └── utils/              # Utility functions
│       ├── scoring.js      # Lead scoring
│       ├── csv.js          # CSV import/export
│       ├── phone.js        # Phone formatting
│       ├── dates.js        # Date calculations
│       ├── storage.js      # localStorage helpers
│       └── transform.js    # Data transformations
├── tests/                  # Test files
│   ├── setup.js
│   ├── utils/
│   └── integration/
├── scripts/
│   └── google-apps-script.js  # Google Sheets backend
├── supabase/
│   └── migrations/         # Database schema
└── docs/
    ├── SETUP.md            # Installation guide
    ├── CUSTOMIZATION.md    # White-label configuration
    ├── TESTING.md          # Test documentation
    ├── USER_GUIDE.md       # Feature documentation
    └── ...
```

---

## Technical Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 (via CDN) |
| Styling | Tailwind CSS |
| Local Storage | Browser localStorage |
| Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth |
| Testing | Vitest + jsdom |
| APIs | Apollo.io, Anthropic Claude |
| Sync | Google Apps Script |

---

## Documentation

| Document | Description |
|----------|-------------|
| [Setup Guide](docs/SETUP.md) | Supabase and multi-user setup |
| [Migration Guide](docs/MIGRATION.md) | Migrate from localStorage to Supabase |
| [Customization](docs/CUSTOMIZATION.md) | White-label configuration |
| [Testing](docs/TESTING.md) | Test documentation |
| [User Guide](docs/USER_GUIDE.md) | Feature documentation |
| [Google Sheets](docs/GOOGLE_SHEETS_SETUP.md) | Team sync setup |
| [API Integration](docs/API_INTEGRATION.md) | Apollo.io and Anthropic |
| [Scoring Model](docs/SCORING_MODEL.md) | Lead scoring methodology |
| [Maintenance](docs/MAINTENANCE.md) | Code customization guide |

---

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Run tests (`npm test`)
4. Commit changes (`git commit -m 'Add AmazingFeature'`)
5. Push to branch (`git push origin feature/AmazingFeature`)
6. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- Powered by [Anthropic Claude](https://anthropic.com) for AI research
- Lead data from [Apollo.io](https://apollo.io)
- Database by [Supabase](https://supabase.com)
- Voice/SMS by [Twilio](https://twilio.com)
- Email by [Resend](https://resend.com)
- Payments by [Stripe](https://stripe.com)

---

<div align="center">

**Built for B2B Sales Teams**

[Report Bug](https://github.com/YOUR_USERNAME/sales-engine/issues) | [Request Feature](https://github.com/YOUR_USERNAME/sales-engine/issues)

</div>
