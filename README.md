# Fexle Sales Engine

<div align="center">

![Version](https://img.shields.io/badge/version-2.1.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Platform](https://img.shields.io/badge/platform-Browser-orange.svg)

**AI-Powered Cold Calling & Lead Generation Platform**

*Built for Fexle Services - Australia's Most Cost-Effective Salesforce Implementation Partner*

[Features](#features) • [Quick Start](#quick-start) • [Documentation](#documentation) • [Setup](#setup)

</div>

---

## 🎯 Overview

The Fexle Sales Engine is a purpose-built sales productivity platform designed for B2B cold calling campaigns targeting Australian businesses. It combines AI-powered research, intelligent lead scoring, Apollo.io integration, and proven call scripts to maximize sales team effectiveness.

### Why Fexle Sales Engine?

- **Zero Server Required** - Runs entirely in the browser
- **Team Collaboration** - Google Sheets integration for shared data
- **AI-Powered** - Claude integration for company research
- **Lead Intelligence** - Apollo.io integration for prospect discovery
- **Smart Scoring** - Automated lead prioritization based on ICP fit

---

## ✨ Features

### Core Capabilities

| Feature | Description |
|---------|-------------|
| 🚀 **Apollo.io Integration** | Search and import qualified leads from Apollo's 250M+ contact database |
| 📊 **Lead Scoring** | Automated 0-100 scoring based on company size, revenue, title, intent signals |
| 📈 **Source Tracking** | Track lead sources and measure ROI by channel |
| 📋 **Google Sheets Sync** | Real-time team collaboration via shared Google Sheets |
| 🎯 **Today Dashboard** | AI-prioritized daily task list |
| 📞 **Call Center** | Integrated calling interface with context-aware scripts |
| 📅 **CEO Calendar** | Visual booking system with ICS file generation |
| 📚 **Playbooks** | Industry-specific scripts for 11 verticals + SF/Non-SF prospect modes |
| 🔍 **AI Research** | Claude-powered company research and call prep |
| ✉️ **Email Templates** | 8 pre-built templates for every sales stage |

### Supported Verticals

- Healthcare / Aged Care
- Financial Services
- Manufacturing
- Professional Services (Legal, Accounting)
- Retail / E-commerce
- Education
- Nonprofit
- Government
- Real Estate
- Logistics / Transport
- Hospitality

---

## 🇦🇺 Built for the Australian Market

This platform is specifically designed for selling to Australian businesses, with localization throughout:

### Phone Number Handling

Australian phone numbers are automatically formatted for click-to-dial:

| Input Format | Converted To | Type |
|--------------|--------------|------|
| `0412 345 678` | `+61412345678` | Mobile |
| `02 1234 5678` | `+61212345678` | Sydney landline |
| `(03) 9876 5432` | `+61398765432` | Melbourne landline |
| `07 1234 5678` | `+61712345678` | Brisbane landline |
| `08 1234 5678` | `+61812345678` | Perth landline |
| `9876 5432` (8 digits) | `+61298765432` | Assumes Sydney |
| `1300 123 456` | `1300123456` | Business number (no +61) |

### Australian-Focused Cold Calling Scripts

- **Opening scripts** tested for Australian business culture (direct but respectful)
- **Objection handling** tailored to common Australian responses
- **Industry playbooks** for 19 verticals common in the AU market
- **Timezone awareness** - Best call times (4-5 PM AEST) highlighted in Pro Tips
- **Local proof points** - Australian client success stories and stats

### Currency & Scoring

- Revenue brackets in **AUD** ($5M-$200M+ ranges)
- Lead scoring calibrated for Australian mid-market (sweet spot: 201-500 employees)
- Company size expectations aligned with AU business landscape

### Australian Business Context

- AI research assumes Australian location by default
- State-based area codes recognized (NSW, VIC, QLD, WA/SA)
- Local industry terminology and pain points
- References to Australian compliance requirements (APRA, ACHS, etc.)

---

## 🚀 Quick Start

### Option 1: Direct Use

1. Download `FexleSalesEngine.html`
2. Open in any modern browser (Chrome, Firefox, Safari, Edge)
3. Start adding leads!

### Option 2: Local Development

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/fexle-sales-engine.git

# Navigate to directory
cd fexle-sales-engine

# Open in browser
open index.html
# or on Linux:
xdg-open index.html
```

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [User Guide](docs/USER_GUIDE.md) | Complete feature documentation |
| [Setup Guide](docs/SETUP_GUIDE.md) | Installation and configuration |
| [Google Sheets Setup](docs/GOOGLE_SHEETS_SETUP.md) | Team collaboration setup |
| [API Integration](docs/API_INTEGRATION.md) | Apollo.io and Anthropic setup |
| [Scoring Model](docs/SCORING_MODEL.md) | Lead scoring methodology |

---

## ⚙️ Setup

### Basic Setup (5 minutes)

1. **Open the App** - Double-click `index.html` or open in browser
2. **Configure Your Name** - Go to Settings → Enter your name
3. **Start Calling** - Use sample data to explore, or add your own leads

### Full Setup (15 minutes)

#### 1. Apollo.io Integration (Lead Search)

```
1. Sign up at apollo.io ($99/month for Pro)
2. Go to Settings → Integrations → API
3. Copy your API key
4. Paste in Fexle Sales Engine Settings
```

#### 2. Anthropic API (AI Research)

```
1. Sign up at console.anthropic.com
2. Go to Settings → API Keys
3. Create a new key
4. Paste in Fexle Sales Engine Settings
```

#### 3. Google Sheets (Team Sync)

```
1. Create a new Google Sheet
2. Add Apps Script (see docs/GOOGLE_SHEETS_SETUP.md)
3. Deploy as Web App
4. Paste URL in Settings
```

---

## 📊 Lead Scoring Model

Leads are automatically scored 0-100 based on ICP fit:

| Factor | Max Points | Sweet Spot |
|--------|------------|------------|
| Company Size | 20 | 201-500 employees |
| Revenue | 20 | $50M-$200M AUD |
| Title/Role | 25 | CEO, COO, CIO, CTO |
| Intent Signals | 20 | Hiring Salesforce, researching CRM |
| Vertical Fit | 15 | Healthcare, Financial Services |

### Score Interpretation

- **80-100** 🔥 Hot - Call immediately
- **60-79** ⚡ Warm - Call this week
- **40-59** 🌱 Cool - Email first
- **0-39** ❄️ Cold - Deprioritize

---

## 🔧 Technical Details

### Stack

- **Frontend**: React 18 (via CDN)
- **Styling**: Tailwind CSS
- **Storage**: Browser localStorage + Google Sheets
- **APIs**: Apollo.io, Anthropic Claude
- **Calendar**: ICS file generation (RFC 5545)

### Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Data Storage

- All data stored locally in browser localStorage
- Optional Google Sheets sync for team collaboration
- CSV export for backup and migration

---

## 📁 Repository Structure

```
fexle-sales-engine/
├── index.html              # Main application file
├── README.md               # This file
├── LICENSE                 # MIT License
├── CHANGELOG.md            # Version history
├── docs/
│   ├── USER_GUIDE.md       # Complete user documentation
│   ├── SETUP_GUIDE.md      # Installation guide
│   ├── GOOGLE_SHEETS_SETUP.md  # Team sync setup
│   ├── API_INTEGRATION.md  # API configuration
│   └── SCORING_MODEL.md    # Scoring methodology
├── scripts/
│   └── google-apps-script.js  # Google Sheets backend code
└── assets/
    └── screenshots/        # App screenshots
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built for [Fexle Services](https://fexle.com) - Salesforce Platinum Partner
- Powered by [Anthropic Claude](https://anthropic.com) for AI research
- Lead data from [Apollo.io](https://apollo.io)

---

<div align="center">

**Built with ❤️ for Australian Sales Teams**

[Report Bug](https://github.com/YOUR_USERNAME/fexle-sales-engine/issues) • [Request Feature](https://github.com/YOUR_USERNAME/fexle-sales-engine/issues)

</div>
