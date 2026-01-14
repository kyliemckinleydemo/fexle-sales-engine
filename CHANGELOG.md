# Changelog

All notable changes to the Fexle Sales Engine will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2026-01-14

### Added
- **Industry-Specific Playbooks** - Tailored opening scripts and objection handling for each vertical
  - Healthcare: Staff burnout, family communication, compliance, patient engagement angles
  - Professional Services: Billable hours, client portal, M&A integration, knowledge management
  - Manufacturing: Supply chain, plant floor visibility, distributor management, quality assurance
  - Financial Services: Compliance, client onboarding, wealth handoff, regulatory pressure
  - Retail: Omnichannel, inventory visibility, customer loyalty, seasonal scaling
  - Education: Student lifecycle, enrollment funnel, alumni engagement, manual processes
  - Nonprofit: Donor retention, grant tracking, volunteer coordination, impact measurement
  - Government: Digital services, citizen experience, cross-agency collaboration, procurement
  - Real Estate: Lead response time, client relationship, market intelligence, transaction coordination
  - Logistics: WISMO calls, proactive communication, customer retention, e-commerce pressure
  - Hospitality: OTA dependency, guest recognition, 24/7 service, group sales
- **Non-Salesforce Prospect Scripts** - Complete playbook for prospects not using Salesforce
  - 5 new opening scripts for non-SF prospects (CRM Pain, Growth Challenge, Tech Stack, AI Opportunity, Current System Frustration)
  - 6 pivot scripts based on current system (Spreadsheets, HubSpot, Dynamics, Legacy, Nothing, AI Angle)
  - 10 objection handlers for non-SF scenarios
  - 4 close options (Discovery Call, Demo, ROI Conversation, Competitor Comparison)
  - Toggle to switch between "Existing SF User" and "Non-SF Prospect" modes
- **Delete Functionality** - Remove leads and tasks
  - Delete leads from list view (hover to reveal trash icon)
  - Delete leads from detail view (trash icon in header)
  - Delete tasks from Today dashboard
  - Confirmation prompts to prevent accidents
- **Playbook Popup Window** - Pop out scripts to separate browser window for better visibility during calls
- **Today's Call List** - Build a focused call queue from your master leads
  - "Build Call List" button on Today dashboard
  - Filter by minimum score (40+, 60+, 80+), status, and vertical
  - Select individual leads or "Select All" matching filters
  - Track progress with completion status and progress bar
  - Auto-mark as complete when call is logged
  - Persists in localStorage (survives refresh)

### Fixed
- Settings modal scrolling - content now scrolls while header/footer stay fixed
- Modal input focus issue - inputs no longer lose focus after each keystroke
- Click outside to close Settings modal
- CEO Meeting Booked status data integrity check
- Stale closure issues in booking functions

### Changed
- Renamed "Playbooks" tab to "Industry Playbooks"
- Updated User Guide with SF vs Non-SF playbook documentation
- Enhanced Playbooks section with detailed script options for both prospect types

---

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
