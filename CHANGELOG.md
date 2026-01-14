# Changelog

All notable changes to the Fexle Sales Engine will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-01-13

### Added
- **Google Sheets Integration** - Real-time team collaboration via shared Google Sheets
  - Push/Pull sync functionality
  - Auto-sync with configurable intervals (1, 5, 15, 30 minutes)
  - Smart merge conflict resolution
  - Connection status indicator
  - Complete Apps Script backend
- **Apollo.io Integration** - Search and import leads from Apollo's database
  - Search by job titles, company size, keywords
  - Filter by Australian locations
  - Bulk import with duplicate detection
  - Intent signal tracking
- **Lead Scoring Model** - Automated 0-100 scoring based on ICP fit
  - Company size scoring (sweet spot: 201-500 employees)
  - Revenue scoring (sweet spot: $50M-$200M)
  - Title/role scoring (CEO, CIO, COO = highest)
  - Intent signals scoring
  - Vertical fit scoring
  - Score breakdown modal
- **Source Tracking** - Track and analyze lead sources
  - 9 source types (Apollo, LinkedIn, Referral, etc.)
  - Source analytics dashboard
  - Conversion rate by source
  - Filter by source in Call Center
- **Enhanced Add Lead Form** - More fields for accurate scoring
  - Source selection
  - Company size dropdown
  - Revenue range dropdown
  - Website and LinkedIn URL fields
  - Live score preview

### Changed
- Expanded CSV export with 30+ columns including source, scoring data
- Updated Settings modal with Google Sheets and Apollo configuration
- Improved lead filtering with source filter

## [1.5.0] - 2026-01-12

### Added
- **Schedule Challenge** - Book CEO meetings outside normal availability
  - Visual indicator (amber color) for challenge bookings
  - Warning in ICS file
  - Confirmation task auto-created
- **Comprehensive User Guide** - 15+ page documentation
- **Automatic Backup Reminders** - Every 3 days

### Changed
- Enhanced calendar legend with all booking types
- Improved ICS file generation with challenge flags

## [1.0.0] - 2026-01-11

### Added
- **Core Application**
  - React-based single-page application
  - Browser localStorage persistence
  - Responsive design with Tailwind CSS
- **Dashboard**
  - Priority task queue
  - Quick stats (calls, hot leads, meetings, pipeline)
  - Task management
- **Call Center**
  - Lead list with filtering
  - Call logging with outcomes
  - Auto-generated follow-up tasks
  - Context-aware scripts
- **CEO Calendar**
  - Visual weekly calendar
  - Availability management
  - Meeting booking with ICS download
- **Playbooks**
  - 11 industry verticals
  - Opening scripts (4 options)
  - Objection handling (10+ objections)
  - Follow-up strategy
- **Email Templates**
  - 8 pre-built templates
  - Auto-personalization
  - Copy to clipboard
- **AI Research**
  - Claude API integration
  - Company analysis
  - Personalized talking points
  - Priority assessment
- **Data Management**
  - CSV import/export
  - Full backup with leads + tasks

---

## Roadmap

### v2.1.0 (Planned)
- [ ] Slack integration for team notifications
- [ ] Advanced reporting dashboard
- [ ] Email sending via Gmail/Outlook API
- [ ] Mobile-optimized view

### v2.2.0 (Planned)
- [ ] Multi-user authentication
- [ ] Role-based permissions
- [ ] Activity feed
- [ ] Lead assignment workflows

### v3.0.0 (Future)
- [ ] CRM integrations (Salesforce, HubSpot)
- [ ] Phone system integration (click-to-dial)
- [ ] AI-powered call transcription
- [ ] Predictive lead scoring with ML
