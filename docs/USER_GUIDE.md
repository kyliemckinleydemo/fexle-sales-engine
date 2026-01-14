# Fexle Sales Engine - User Guide

**Version 2.0** | Last Updated: January 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Apollo.io Integration](#apolloio-integration)
4. [Lead Scoring Model](#lead-scoring-model)
5. [Source Tracking & Analytics](#source-tracking--analytics)
6. [Google Sheets Integration](#google-sheets-integration)
7. [Dashboard - Today View](#dashboard---today-view)
8. [Call Center](#call-center)
9. [CEO Calendar](#ceo-calendar)
10. [Playbooks & Scripts](#playbooks--scripts)
11. [Email Templates](#email-templates)
12. [AI Research](#ai-research)
13. [Task Management](#task-management)
14. [Data Management](#data-management)
15. [Settings](#settings)
16. [Keyboard Shortcuts & Tips](#keyboard-shortcuts--tips)
17. [Troubleshooting](#troubleshooting)

---

## Overview

The **Fexle Sales Engine** is a purpose-built cold calling and lead generation platform designed specifically for Fexle Services' Australian market outreach. It combines AI-powered research, intelligent lead scoring, Apollo.io integration, and proven call scripts to maximize sales productivity.

### Key Features

| Feature | Description |
|---------|-------------|
| 🚀 **Apollo.io Integration** | Search and import qualified leads from Apollo's database |
| 📊 **Lead Scoring** | Automated scoring based on company size, revenue, title, intent signals, and vertical fit |
| 📈 **Source Tracking** | Track where leads come from and measure source effectiveness |
| 📋 **Google Sheets Sync** | Share leads and tasks across your team via Google Sheets |
| 🎯 **Today Dashboard** | Daily prioritized task list and performance metrics |
| 📞 **Call Center** | Integrated calling interface with scripts and quick actions |
| 📅 **CEO Calendar** | Visual availability booking for CEO meetings |
| 📋 **Playbooks** | Industry-specific scripts and objection handling |
| 🔍 **AI Research** | Claude-powered company research and call preparation |
| ✉️ **Email Templates** | Pre-built templates for every stage of the sales process |

---

## Getting Started

### First-Time Setup

1. **Open the Application**
   - Open `FexleSalesEngine.html` in any modern browser (Chrome, Firefox, Safari, Edge)
   - The app runs entirely in your browser - no server required

2. **Configure Settings** (Click the ⚙️ gear icon)
   - **Your Name**: Enter your name for personalized scripts and emails
   - **Anthropic API Key**: Required for AI Research feature ([Get key](https://console.anthropic.com/settings/keys))
   - **Apollo API Key**: Required for Apollo.io lead search ([Get key](https://app.apollo.io/#/settings/integrations/api))

3. **Sample Data**
   - Sample leads are included by default to help you explore
   - Turn OFF "Sample Test Data" in Settings for production use

### Data Storage

- ✅ All data persists in your browser's localStorage
- ✅ Survives browser restarts and computer reboots
- ⚠️ Cleared if you clear browser data/cache
- 💡 **Recommended**: Export CSV backup every 3 days (you'll get a reminder)

---

## Apollo.io Integration

### Accessing Apollo Search

Click the purple **🚀 Apollo Search** button in the header to open the Apollo search modal.

### Search Filters

| Filter | Description |
|--------|-------------|
| **Keywords** | Search terms like "Salesforce", "CRM", "digital transformation" |
| **Job Titles** | Select target titles: CEO, COO, CIO, CTO, Managing Director, etc. |
| **Company Size** | Employee count ranges: 1-50, 51-200, 201-500, 501-1000, 1000+ |
| **Results Per Page** | Number of results: 10, 25, 50, or 100 |

### Search Results

Each result displays:
- Contact name and title
- Company name
- Location and employee count
- Email/phone availability indicators
- Intent topics (if detected)
- Calculated lead score
- Industry vertical

### Importing Leads

1. Click individual leads to select/deselect them
2. Use "Select All" to select all results
3. Click **"Import X Leads"** to add to your database
4. Duplicates (matching email addresses) are automatically skipped

### API Key Setup

1. Log into [app.apollo.io](https://app.apollo.io)
2. Go to Settings → Integrations → API
3. Generate or copy your API key
4. Paste in Fexle Sales Engine Settings

---

## Lead Scoring Model

### How Scores Are Calculated

The lead scoring model evaluates five factors to generate a score from 0-100:

| Factor | Max Points | Description |
|--------|------------|-------------|
| **Company Size** | 20 | Based on employee count |
| **Revenue** | 20 | Based on annual revenue |
| **Title/Role** | 25 | Decision-maker level |
| **Intent Signals** | 20 | Buying behavior indicators |
| **Vertical Fit** | 15 | Industry alignment |

### Company Size Scoring

| Size | Points |
|------|--------|
| 1-50 employees | 5 |
| 51-200 employees | 15 |
| **201-500 employees** | **20** (Sweet spot) |
| 501-1000 employees | 15 |
| 1000+ employees | 10 |

### Revenue Scoring

| Revenue | Points |
|---------|--------|
| Under $5M | 5 |
| $5M-$20M | 10 |
| $20M-$50M | 15 |
| **$50M-$200M** | **20** (Sweet spot) |
| $200M+ | 15 |

### Title Scoring

| Title | Points |
|-------|--------|
| CEO, Managing Director, Founder | 25 |
| COO, CIO, CTO | 22 |
| CFO | 20 |
| VP, Vice President | 18 |
| Director, Head of | 15 |
| Manager | 10 |
| Other | 5 |

### Intent Signals

| Signal | Points |
|--------|--------|
| Hiring for Salesforce roles | 10 |
| Researching CRM solutions | 8 |
| Recent funding round | 7 |
| New executive hire | 5 |
| Expansion/hiring | 5 |
| Tech stack match | 5 |

### Vertical Fit Scoring

| Vertical | Points |
|----------|--------|
| Healthcare, Financial Services | 15 |
| Manufacturing, Professional Services | 12 |
| Retail, Education, Real Estate, Logistics | 10 |
| Nonprofit, Government, Hospitality | 8 |

### Score Interpretation

| Score | Priority | Action |
|-------|----------|--------|
| **80-100** | 🔥 Hot | Prioritize immediately - call today |
| **60-79** | ⚡ Warm | Good potential - call this week |
| **40-59** | 🌱 Cool | Needs nurturing - email first |
| **0-39** | ❄️ Cold | May not be ICP - deprioritize |

### Viewing Score Breakdown

Click on any lead's score badge to see exactly how points were calculated across all five factors.

---

## Source Tracking & Analytics

### Available Lead Sources

| Source | Icon | When to Use |
|--------|------|-------------|
| **Apollo.io** | 🚀 | Imported from Apollo search |
| **LinkedIn** | 💼 | Found via LinkedIn or Sales Navigator |
| **Referral** | 🤝 | Personal referral or word of mouth |
| **Website** | 🌐 | Inbound from Fexle website |
| **Conference** | 🎪 | Met at conference or event |
| **Cold Outreach** | 📞 | You found them manually |
| **Inbound** | 📥 | They reached out to Fexle |
| **Partner Referral** | 🏢 | Referred by a partner company |
| **Manual Entry** | ✏️ | Default for manual adds |

### Source Analytics Dashboard

Click the **📊** button in the header to view source analytics:

- **Total leads by source** - See which sources generate the most leads
- **Average score by source** - Which sources have the highest quality leads
- **Conversion count** - Leads that reached CEO Meeting or later stages
- **Conversion rate** - Percentage of leads that converted by source

### Filtering by Source

In the Call Center, use the Source dropdown filter to view leads from a specific source.

---

## Google Sheets Integration

The Google Sheets integration enables your team to share leads and tasks in real-time through a shared Google Sheet.

### Benefits

| Feature | Description |
|---------|-------------|
| **Team Sharing** | All team members can access and update the same leads |
| **Real-time Sync** | Changes sync automatically or on-demand |
| **Backup** | Google Sheets serves as automatic cloud backup |
| **Offline Work** | Work offline, sync when connected |
| **Conflict Resolution** | Smart merging prevents data loss |

### Setup Guide

#### Step 1: Create the Google Sheet

1. Go to [sheets.new](https://sheets.new) to create a new spreadsheet
2. Rename it (e.g., "Fexle Sales Engine Data")
3. Create two sheets named exactly: **Leads** and **Tasks**

#### Step 2: Add the Apps Script

1. In your Google Sheet, go to **Extensions → Apps Script**
2. Delete any existing code
3. Paste the code from the Setup Guide (click ⚙️ Setup Guide in Settings)
4. Click **Save** (Ctrl+S)

#### Step 3: Deploy as Web App

1. Click **Deploy → New deployment**
2. Click the gear icon ⚙️ → Select **Web app**
3. Configure:
   - **Description**: "Fexle Sales Engine Backend"
   - **Execute as**: Me
   - **Who has access**: Anyone
4. Click **Deploy**
5. Authorize the app when prompted (click through warnings)
6. **Copy the Web App URL** (looks like `https://script.google.com/macros/s/...`)

#### Step 4: Connect in Settings

1. Open Fexle Sales Engine
2. Go to **Settings** (gear icon)
3. Scroll to **Google Sheets Sync**
4. Paste the Web App URL
5. Click **Test Connection**
6. You should see "✓ Connected"

### Using Sync

#### Manual Sync

| Button | Action |
|--------|--------|
| **⬆️ Push to Sheets** | Upload local leads and tasks to Google Sheets |
| **⬇️ Pull from Sheets** | Download leads and tasks from Google Sheets |
| **📊 Sync** (header button) | Quick push to sheets |

#### Auto-Sync

1. Enable **Auto-sync** toggle in Settings
2. Choose sync interval (1, 5, 15, or 30 minutes)
3. Data syncs automatically in the background

### Sync Behavior

| Scenario | Result |
|----------|--------|
| New local lead | Added to Google Sheets |
| Modified local lead | Updates Google Sheets (if newer) |
| New remote lead | Added to local database |
| Conflict | Most recent change wins |
| Deleted locally | NOT deleted from Sheets (safety) |

### Multi-User Workflow

1. **Team Setup**: Each team member installs the app and connects to the same Sheet
2. **Assign Leads**: Use the "Assigned To" field to divide work
3. **Pull Updates**: Click "Pull from Sheets" to get team changes
4. **Push Changes**: After calls, click "Push to Sheets" to share updates

### Troubleshooting Google Sheets

| Issue | Solution |
|-------|----------|
| **CORS Error** | Ensure "Who has access" is set to "Anyone" |
| **Authorization Error** | Re-deploy after making code changes |
| **Data not syncing** | Check sheet names are exactly "Leads" and "Tasks" |
| **Connection failed** | Verify the Web App URL is correct and accessible |
| **Duplicates** | The system uses ID matching; don't manually edit IDs |

---

## Dashboard - Today View

The Today view shows your daily priorities and key metrics.

### Priority Queue

Tasks are automatically prioritized:

1. **Priority 1** (Red): Hot leads (85+), CEO meetings booked, calls scheduled
2. **Priority 2** (Orange): Warm leads in follow-up, qualified leads
3. **Priority 3** (Yellow): Deck sent, new hot leads
4. **Priority 4** (Gray): Standard follow-ups

### Quick Stats

- **Calls Made** - Today's call count
- **Hot Leads** - Leads scoring 80+
- **Meetings** - CEO meetings booked
- **Pipeline** - Leads in active stages

### Task List

- Click any task to open the associated lead
- Check off tasks when complete
- Overdue tasks show in red
- Backup reminders appear every 3 days

---

## Call Center

### Lead List

The left panel shows all leads with:
- Company name and contact
- Title and vertical
- Score badge (color-coded)
- Status badge
- Source indicator
- Last contact date
- Delete button (hover to reveal)

### Filters

| Filter | Options |
|--------|---------|
| **Search** | Search by company or contact name |
| **Vertical** | All, Healthcare, Financial, Manufacturing, Professional Services |
| **Status** | All, New Lead, Qualified, Deck Sent, Follow Up, etc. |
| **Source** | All, Apollo, LinkedIn, Referral, etc. |

### Lead Detail Panel

When a lead is selected, the right panel shows:

- **Contact Info**: Phone, email, title
- **Quick Actions**: Call, Email, Research, Book Meeting
- **Call Script**: Context-aware suggested opening
- **Notes**: All communication history
- **Log Call**: Record call outcomes

### Call Outcomes

| Outcome | Follow-up Created |
|---------|-------------------|
| **Deck Sent** | 7-day follow-up task |
| **Follow Up** | 3-day follow-up task |
| **No Answer** | 2-day follow-up task |
| **Call Scheduled** | No auto task |
| **CEO Meeting Booked** | Prep task created |
| **Not Interested** | No task |

---

## CEO Calendar

### Opening the Calendar

Click **📅 CEO Calendar** button in the header.

### Managing Availability

1. Click empty slots to mark them as **Available** (turns green)
2. Click green slots again to remove availability
3. Navigate weeks using the arrow buttons

### Booking Meetings

1. Select a lead in Call Center
2. Open CEO Calendar
3. Click an available (green) slot
4. Confirm the booking
5. ICS file downloads automatically

### Schedule Challenge

If a prospect needs a time outside normal availability:
1. Click any empty slot (not green)
2. A warning appears about "Schedule Challenge"
3. You can still book, but a confirmation task is created
4. The ICS file is marked with ⚠️ warning

### Meeting Management

- View upcoming meetings in the sidebar
- Click a meeting to see details
- Cancel meetings (returns slot to available)

---

## Playbooks & Scripts

### Prospect Type Toggle

The playbook includes two distinct script sets, accessible via the toggle at the top:

| Mode | When to Use |
|------|-------------|
| **Existing SF User** | Prospect already uses Salesforce - focus on AI upgrades, optimization |
| **Non-SF Prospect** | Prospect uses other CRM, spreadsheets, or nothing - focus on migration, new implementation |

### Vertical Selection

Select an industry vertical to see customized content:
- Healthcare / Aged Care
- Financial Services
- Manufacturing
- Professional Services (Legal, Accounting)
- Retail / E-Commerce
- Education
- Nonprofit
- Government
- Real Estate
- Logistics / Transport
- Hospitality

### Available Content

Each playbook includes:

| Section | Content |
|---------|---------|
| **Opening Scripts** | Multiple approaches based on prospect type |
| **Pivot Scripts** | How to transition after initial engagement |
| **Close Scripts** | Getting to the CEO meeting or discovery call |
| **Objection Handling** | Responses to 10+ common objections (SF and non-SF) |
| **Pain Points** | Industry-specific problems to probe |
| **Agentforce Use Case** | AI application for this vertical |
| **Follow-Up Strategy** | Day-by-day multi-touch sequence |

---

### Scripts for Existing Salesforce Users

#### Opening Script Options

1. **AI Pressure Question** (Recommended) - "Are you seeing pressure to do more with AI in your Salesforce environment?"
2. **Support Cost Question** - Focuses on reducing customer support costs
3. **Sales Performance Question** - Addresses gaps in Salesforce utilization
4. **Permission + Problem Hybrid** - Acknowledges cold call, hints at AI value

#### Pivot Scripts

| Scenario | Script Focus |
|----------|--------------|
| **Primary Pivot** | Introduce Fexle's hybrid model + Agentforce |
| **AI Interest** | Deep dive on Agentforce and Einstein capabilities |
| **Cost Pressure** | Emphasize 30-40% cost savings |
| **Sales Gaps** | Focus on Sales Cloud optimization |

#### Close Options

| Path | When to Use |
|------|-------------|
| **CEO Meeting** | Prospect is engaged and ready to explore |
| **AI Deck** | Prospect interested but not ready for meeting |
| **Deck + Meeting Hybrid** | Offer deck first, then meeting |

---

### Scripts for Non-Salesforce Prospects

Use these when calling prospects who don't currently use Salesforce — they may be using HubSpot, Dynamics, spreadsheets, or nothing at all.

#### Opening Script Options

1. **CRM Pain Question** (Recommended) - "Are you happy with how you're currently tracking customer interactions and sales opportunities?"
2. **Growth Challenge Question** - "As your business has grown, has keeping track of customer relationships become harder?"
3. **Tech Stack Curiosity** - Direct question about what they currently use
4. **AI Opportunity Question** - Lead with AI value proposition
5. **Current System Frustration** - "Are there gaps that are starting to slow the business down?"

#### Pivot Scripts by Current System

| Current System | Pivot Approach |
|----------------|----------------|
| **Spreadsheets/Nothing** | "Spreadsheets work until they don't" - emphasize visibility, collaboration, scalability |
| **HubSpot** | Address limitations: reporting, automation, AI capabilities, enterprise scale |
| **Dynamics 365** | Position Salesforce's superior CRM UX, ecosystem, and AI features |
| **Legacy Systems** | Focus on AI readiness, modern integrations, mobile access |
| **AI Angle (Universal)** | Lead with Agentforce/Einstein regardless of current system |

#### Non-SF Objection Handling

| Objection | Response Approach |
|-----------|-------------------|
| "We use HubSpot and it works fine" | Acknowledge, probe for limits, highlight AI gap |
| "We use Dynamics 365" | Position Salesforce's CRM superiority and AI lead |
| "We just use spreadsheets" | Empathize, describe tipping points, emphasize affordability |
| "CRM seems like overkill" | Reframe as growth preparation, start small |
| "We tried CRM before and it didn't stick" | Focus on implementation quality and adoption support |
| "Salesforce is too expensive" | Explain flexible pricing + Fexle's 30-40% savings |
| "We don't have bandwidth to implement" | Describe Fexle's full-service approach |
| "Our industry is different" | Highlight Salesforce's customizability |
| "We're waiting to see how AI develops" | Emphasize AI is working NOW, competitor advantage |
| "We've heard Salesforce is hard to use" | Stress importance of good implementation |

#### Non-SF Close Options

| Close Type | When to Use |
|------------|-------------|
| **Discovery Call** | 30-min conversation about their business and needs |
| **Tailored Demo** | Show Salesforce configured for their industry |
| **ROI Conversation** | Build business case based on their specifics |
| **Competitor Comparison** | Side-by-side vs their current system |

---

## Email Templates

### Available Templates

| Template | When to Use |
|----------|-------------|
| **📧 Send AI Deck** | After call when prospect wants the deck |
| **🔄 Follow Up on Deck** | 5-7 days after sending deck |
| **📅 CEO Meeting Confirm** | Confirm booked CEO meeting |
| **📞 Voicemail Follow Up** | After leaving a voicemail |
| **❄️ Cold Email** | Initial outreach without prior call |
| **👋 Breakup Email** | Final email after multiple attempts |
| **🤝 LinkedIn Connection** | Personalized LinkedIn message |
| **🏥 Health Check Offer** | Offer free Salesforce assessment |

### Using Templates

1. Select a lead in Call Center
2. Click **✉️ Email** button
3. Choose a template
4. Email auto-personalizes with lead info
5. Click **Copy to Clipboard**
6. Paste into your email client

### Personalization Fields

Templates automatically replace:
- `[FIRST_NAME]` - Contact's first name
- `[COMPANY]` - Company name
- `[YOUR_NAME]` - Your name from settings
- `[INDUSTRY]` - Lead's industry vertical
- `[PAIN_POINT]` - Industry-specific pain point

---

## AI Research

### Requirements

- Anthropic API key configured in Settings
- Active internet connection

### Running Research

1. Select a lead
2. Click **🔍 Research** button
3. Wait for Claude to analyze (15-30 seconds)

### Research Output

| Section | Content |
|---------|---------|
| **Priority Level** | HIGH / MEDIUM / LOW urgency rating |
| **Company Overview** | What the company does, size, market |
| **Pain Points** | Specific challenges they likely face |
| **Salesforce Likelihood** | Assessment of their CRM readiness |
| **Recommended Opening** | Customized first line for call |
| **Talking Points** | Key discussion points for call |
| **Questions to Ask** | Discovery questions |
| **News & Triggers** | Recent events or changes |

### Saving Research

- Research auto-saves to the lead record
- View saved research anytime by clicking Research button
- Export includes research data in CSV

---

## Task Management

### Task Types

| Type | Icon | Description |
|------|------|-------------|
| Call | 📞 | Initial outreach call |
| Follow-up Call | 🔄 | Return call after prior contact |
| Follow-up on Deck | 📧 | Check if they reviewed the deck |
| Email | ✉️ | Send an email |
| Meeting | 📅 | Scheduled meeting or call |
| Backup Reminder | 💾 | Export data backup |

### Creating Tasks

1. Click **➕ Add Task** in the header or dashboard
2. Select task type
3. Associate with a lead (optional)
4. Set due date and time
5. Add description
6. Click Create

### Auto-Created Tasks

The system automatically creates tasks for:
- Follow-ups after "Deck Sent" (7 days)
- Follow-ups after "No Answer" (2 days)
- Meeting prep before CEO meetings (1 day before)
- Backup reminders (every 3 days)

### Managing Tasks

- Click checkbox to complete
- Click task to view/edit associated lead
- Click ✕ button to delete a task
- Overdue tasks highlighted in red
- Filter by completed/incomplete

---

## Data Management

### Adding Leads

**Manual Entry:**
1. Click **+ Add Lead** button
2. Fill in company and contact (required)
3. Add optional: title, phone, email, vertical
4. Select source, company size, revenue for scoring
5. Add notes
6. Click Add Lead

**CSV Import:**
1. Click **⬇️ Import** in Call Center
2. Upload CSV file with columns: company, contact, title, phone, email, vertical, notes
3. Leads are automatically normalized and scored

**Apollo Import:**
1. Open Apollo Search modal
2. Configure search filters
3. Click Search Apollo
4. Select leads to import
5. Click Import Leads

### Deleting Leads

You can delete leads from two places:

1. **From Lead List**: Hover over a lead in the Call Center sidebar to reveal the trash icon
2. **From Lead Detail**: Click the trash icon next to the lead score in the header

A confirmation prompt appears before deletion. **Note**: Deleted leads cannot be recovered unless you have a CSV backup.

### Exporting Data

**Quick Export:**
1. Click **Export CSV** button
2. File downloads with all lead data

**Full Backup:**
1. Click **📥 Full Backup** button
2. Downloads both leads.csv and tasks.csv
3. Timestamped for easy organization

### Export Fields

The CSV export includes:
- Basic info: company, contact, title, phone, email
- Classification: vertical, status, score
- Source tracking: source, source_name, imported_at
- Scoring factors: company_size, revenue, employee_count
- Contact info: website, linkedin_url, city, state
- Research: has_research, research_priority, key insights
- History: last_contact, created_date, notes

---

## Settings

Access settings via the **⚙️** button.

### Available Options

| Setting | Purpose |
|---------|---------|
| **Your Name** | Used in scripts and email templates |
| **Anthropic API Key** | Enables AI Research feature |
| **Apollo API Key** | Enables Apollo.io lead search |
| **Sample Test Data** | Toggle sample leads on/off |

### Statistics

Settings shows current counts:
- Total leads
- Total tasks
- Completed tasks
- Researched leads

### Reset

**⚠️ Danger Zone**: Reset All Data clears:
- All leads (except sample data if enabled)
- All tasks
- All settings

---

## Keyboard Shortcuts & Tips

### Power User Tips

1. **Batch calling**: Sort by score descending, work top to bottom
2. **Morning routine**: Check Today dashboard first, tackle Priority 1 tasks
3. **Research first**: For 80+ score leads, run AI Research before calling
4. **Template customization**: Copy templates, personalize before sending
5. **Weekly review**: Check Source Analytics to see which sources convert best

### Quick Actions

| Action | How |
|--------|-----|
| Add new lead | Click + Add Lead button |
| Quick search | Type in search box (instant filter) |
| Log a call | Select lead → enter notes → select outcome → click Log Call |
| Send email | Select lead → ✉️ → choose template → copy |
| Book meeting | Select lead → open CEO Calendar → click slot |

---

## Troubleshooting

### Common Issues

**Issue: AI Research not working**
- Check Anthropic API key in Settings
- Verify key is valid at console.anthropic.com
- Check internet connection

**Issue: Apollo Search returns error**
- Verify Apollo API key in Settings
- Check your Apollo plan has API access
- CORS errors may require proxy setup

**Issue: Data disappeared**
- Check if browser data was cleared
- Try different browser
- Restore from CSV backup

**Issue: ICS file won't open**
- Ensure default calendar app is set
- Try opening directly in calendar app
- Check file downloaded completely

### Data Recovery

If you lose data:
1. Check browser's localStorage (Developer Tools → Application → Local Storage)
2. Look for recent CSV backups in Downloads
3. Re-import from backup CSV

### Getting Help

For issues or feature requests:
- Email: [your-support-email]
- Documentation: This guide
- In-app: Hover tooltips explain most features

---

## Appendix: Fexle Value Proposition

### Key Messages

- **Australia's Most Cost-Effective Salesforce Implementation Partner**
- **300+ Salesforce Professionals**
- **Hybrid onshore-offshore model** = 30-40% cost savings
- **700+ successful implementations**

### Proof Points

- One client cut support ticket volume by **40% in 8 weeks**
- **213% ROI** achieved by Wiley Publishing
- **70% autonomous resolution** during peak tax season
- **84% faster resolution times**

### Key Products

- Agentforce (AI agents for customer service)
- Einstein Copilot (AI for sales reps)
- Data Cloud (unified customer data)
- Sales Cloud, Service Cloud

---

*Built for Fexle Services - Australia's Salesforce Partner*
