# Fexle Sales Engine - User Guide

**Version 2.5** | Last Updated: January 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Apollo.io Integration](#apolloio-integration)
4. [Lead Scoring Model](#lead-scoring-model)
5. [Source Tracking & Analytics](#source-tracking--analytics)
6. [Dashboard - Today View](#dashboard---today-view)
7. [Today's Call List](#todays-call-list)
8. [Call Center](#call-center)
9. [CEO Calendar](#ceo-calendar)
10. [Industry Playbooks](#industry-playbooks)
11. [Email Templates](#email-templates)
12. [AI Research & Call Prep](#ai-research--call-prep)
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
| 🎯 **Today Dashboard** | Daily prioritized task list, performance metrics, and rotating Pro Tips |
| 📋 **Today's Call List** | Build focused daily call queues with filters |
| 📞 **Call Center** | Integrated calling interface with scripts, research, and quick actions |
| 📅 **CEO Calendar** | Visual availability booking for CEO meetings |
| 📚 **Industry Playbooks** | Tailored scripts and objection handling for 19 industry verticals |
| 🔍 **AI Research** | Claude-powered company research with saved call prep |
| ✉️ **Email Templates** | Pre-built templates for every stage of the sales process |

---

## Getting Started

### First-Time Setup

1. **Open the Application**
   - Open `FexleSalesEngine.html` in any modern browser (Chrome, Firefox, Safari, Edge)
   - The app runs entirely in your browser - no server required

2. **Configure Settings** (Click the ⚙️ gear icon)

   **Your Profile** (used in scripts & email signatures):
   - **Your Name**: Enter your full name (e.g., "Kylie McKinley")
   - **Your Email**: Enter your work email (e.g., "kylie@fexle.com")
   - **Your Phone**: Enter your phone number (e.g., "+61 4XX XXX XXX")

   **API Keys**:
   - **Anthropic API Key**: Required for AI Research feature ([Get key](https://console.anthropic.com/settings/keys))
   - **Apollo API Key**: Required for Apollo.io lead search ([Get key](https://app.apollo.io/#/settings/integrations/api))

3. **Set Up iPhone Calling from Mac** (Optional but recommended)

   Click "Dial" buttons to call directly from your Mac using your iPhone's cellular plan:

   1. Ensure both devices use the **same Apple ID**
   2. Connect both devices to the **same WiFi network**
   3. **On iPhone**: Settings → Phone → Calls on Other Devices → Allow Calls on Other Devices → toggle ON your Mac
   4. **On Mac**: Open FaceTime app → Settings → check "Calls from iPhone"

   Once configured, clicking any "Dial" button in the app will ring through your Mac using your iPhone. Free to set up - uses your existing phone plan.

4. **Sample Data**
   - Sample leads are included by default to help you explore
   - Turn OFF "Sample Test Data" in Settings for production use

### Data Storage

- ✅ All data persists in your browser's localStorage
- ✅ Survives browser restarts and computer reboots
- ⚠️ Cleared if you clear browser data/cache
- 💡 **Recommended**: Use "Backup Data" weekly (you'll get a reminder with a "Got it" button to dismiss)

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
| Manufacturing, Professional Services, Telecommunications | 12 |
| Retail, Education, Real Estate, Logistics, Energy, Automotive | 10 |
| Nonprofit, Government, Hospitality, Media, Construction, Mining, Agriculture | 8 |
| Other Industry | 5 |

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

## Dashboard - Today View

The Today view shows your daily priorities and key metrics.

### Priority Leads

The **🔥 Priority Leads** section shows your top 10 leads sorted by priority and score. Each lead displays a **Smart Next Action button** that changes based on the lead's current workflow state:

| Button | Color | Meaning |
|--------|-------|---------|
| 🔍 Research | Blue | Lead needs AI research first |
| 📞 Call | Green | Researched, ready for first call |
| 🔄 Follow Up | Orange | Deck was sent, needs follow-up |
| 📞 Follow Up | Orange | Status is Follow Up or No Answer |
| 📅 Book Meeting | Purple | Called, ready to book CEO meeting |
| ✅ Booked | Green badge | CEO meeting already scheduled |

Clicking the button takes you directly to the appropriate action.

### Priority Levels

Leads are automatically prioritized:

1. **Priority 1** (Red): Hot leads (85+), CEO meetings booked, calls scheduled
2. **Priority 2** (Orange): Warm leads in follow-up, qualified leads
3. **Priority 3** (Yellow): Deck sent, new hot leads
4. **Priority 4** (Gray): Standard follow-ups

### Quick Stats

- **Calls Made** - Today's call count
- **Hot Leads** - Leads scoring 80+
- **Meetings** - CEO meetings booked
- **Pipeline** - Leads in active stages

### Pro Tip of the Day

The dashboard displays a rotating **Pro Tip of the Day** to help improve your cold calling skills. The system includes 30 detailed, actionable tips covering:

| Category | Example Tips |
|----------|--------------|
| **Voice & Energy** | Stand up when calling, smile while speaking, breathe from your diaphragm |
| **Timing** | Best call times (4-5 PM), best days (Wed/Thu), warm up with easy calls first |
| **Technique** | Mirror prospect's pace, pause after questions, use their name early |
| **Mindset** | Rejection is redirection, visualize success, celebrate small wins |
| **Process** | Research before calling, take notes, end with clear next steps |
| **Voicemails** | Keep under 20 seconds, tease value, speak number twice slowly |

Tips rotate automatically based on the day of year, so you'll see a fresh tip each day. Each tip includes not just what to do, but **why it works** and **how to apply it**.

### Workday Guide

The **"Here's a Normal Workday"** section provides a step-by-step guide to structuring your sales day. Click the header to expand and see the recommended workflow:

1. **Morning** - Check priorities, review hot leads, prep research
2. **Mid-Morning** - Power calling block (prime hours for connects)
3. **Lunch** - Admin, email follow-ups, LinkedIn activity
4. **Afternoon** - Second calling block (4-5 PM is peak)
5. **End of Day** - Log outcomes, plan tomorrow, export backup

### Task List

- Click any task to open the associated lead
- Check off tasks when complete
- Overdue tasks show in red
- Backup reminders appear weekly (with "Got it" dismiss button)

---

## Today's Call List

The Today's Call List lets you build a focused queue of leads to call each day, separate from the auto-prioritized list.

### Building Your Call List

1. Click **📋 Build Call List** button on the Today dashboard
2. The lead picker modal opens with all available leads

### Filtering Leads

| Filter | Options |
|--------|---------|
| **Min Score** | Any, 40+, 60+, 80+ (Hot) |
| **Status** | All, New Lead, Contacted, Follow Up, Deck Sent, Meeting Requested |
| **Vertical** | All 19 industry verticals |

### Selecting Leads

- Click individual leads to toggle selection (checkbox)
- Use **"Select All"** to select all leads matching current filters
- Selected leads are highlighted in blue
- Shows count of selected leads at bottom

### Working Your Call List

Once added, your call list appears on the Today dashboard:

| Element | Description |
|---------|-------------|
| **Progress bar** | Shows X / Y calls completed |
| **Lead cards** | Company, contact, score, status for each lead |
| **📞 Call button** | Opens lead in Call Center |
| **✓ button** | Manually mark as called |
| **🗑️ button** | Remove from list |
| **+ Add More** | Add more leads to the list |
| **Clear** | Remove all leads from list |

### Auto-Completion

When you log a call outcome for a lead that's in your call list, it automatically marks as completed.

### Persistence

Your call list saves to localStorage and survives page refreshes. Start fresh each day by clicking "Clear".

---

## Call Center

### Lead List

The left panel shows all leads with:
- Company name and contact
- Title and vertical
- Score badge (color-coded)
- **Quick Status Line**: Shows last call date, outcome, and CEO meeting date if scheduled
- Status badge
- **Workflow Checklist**: Clickable icons showing progress (🔍📞📧📅)
- Delete button (hover to reveal)

### Workflow Checklist

Each lead card shows a mini checklist with clickable icons:

| Icon | Meaning | Click Action |
|------|---------|--------------|
| ○🔍 / ✓🔍 | Research pending/done | Triggers AI research |
| ○📞 / ✓📞 | Call pending/done | Opens lead detail |
| ○📧 / ✓📧 | Deck pending/sent | Opens lead detail |
| ○📅 / ✓📅 | Meeting pending/booked | Opens CEO Calendar |

Icons turn green with checkmarks as you complete each step. The checklist auto-updates based on lead state.

### Filters

| Filter | Options |
|--------|---------|
| **Search** | Search by company or contact name |
| **Vertical** | All 19 industry verticals |
| **Status** | All Leads, **⚡ Active**, 🎉 Won, ❌ Lost |
| **Source** | All, Apollo, LinkedIn, Referral, etc. |

**⚡ Active Filter**: Shows leads that have been contacted at least once and are not Won/Lost. Quick way to focus on leads you're actively working.

### Lead Detail Panel

When a lead is selected, the right panel shows:

#### Guided Workflow Panel

A visual 4-step progress tracker at the top:
- **Research → Call → Deck → Meeting**
- Current step pulses/animates
- Completed steps show green checkmarks
- **Smart Next Action Button**: One prominent button showing your next step

| Button | Color | When Shown |
|--------|-------|------------|
| 🔍 Research Company | Blue | Lead not yet researched |
| 📞 Make First Call | Green | Researched, not yet called |
| 🔄 Follow Up on Deck | Orange | Deck was sent |
| 📞 Follow Up Call | Orange | Status is Follow Up or No Answer |
| 📧 Send Deck / 📅 Book Meeting | Pink/Purple | Called, choose next action |
| ✅ Meeting Booked! | Green | Workflow complete |

#### Other Panels

- **Contact Info**: Phone, email, title
- **Saved Research Panel**: If AI research exists, shows summary with talking points
- **Quick Actions**: AI Research, Email Templates, Schedule CEO Meeting, Pop Out Scripts
- **Call Script**: Context-aware suggested opening with SF/Non-SF toggle
- **Call Prep Panel**: Expandable section with full AI research (if available)
- **Notes**: All communication history (delete with 🗑️ icon, confirmation required)
- **Log Call**: Record call outcomes
- **Major Milestones**: Track lead progression through the sales cycle

### Major Milestones

The lead detail panel includes Major Milestones checkboxes to track progress. Multiple milestones can be selected as the deal progresses:

| Milestone | Color | Description |
|-----------|-------|-------------|
| **Discovery Call** | Green | Initial discovery conversation completed |
| **Deck Sent** | Pink | AI Implementation deck sent to prospect |
| **CEO Meeting Held** | Purple | CEO meeting took place (not just requested) |
| **Proposal Sent** | Amber | Formal proposal delivered |
| **Won** | Emerald | Deal closed successfully 🎉 |
| **Lost** | Red | Deal lost or prospect declined |

**Notes:**
- "CEO Meeting Held" is different from the "Meeting Requested" call outcome. The call outcome tracks when they ask for a meeting; the milestone tracks when it actually happened.
- "Won" and "Lost" are mutually exclusive - selecting one automatically unchecks the other.
- The milestones replace the old "Stage" dropdown for a simpler, more flexible tracking system.

### Call Prep: AI Research Panel

When a lead has saved research, an expandable **"Call Prep: AI Research"** panel appears above the call logging form:

- Click to expand/collapse
- Shows priority badge (HIGH/MEDIUM/NURTURE)
- **Company Overview**: What the company does
- **Recommended Opening**: Best opening line for this prospect
- **Key Talking Points**: Specific things to mention
- **Pain Points to Probe**: Industry-specific challenges
- **Trigger Events**: Things to investigate or ask about
- **Key Contacts**: Additional contacts found during research
- **Refresh Research**: Button to re-run AI research

### Call Outcomes

Log the result of each call using these outcome buttons (available in both the main call page and the popup script):

| Outcome | Icon | Follow-up Created | Notes |
|---------|------|-------------------|-------|
| **Meeting Requested** | 📅 | None | Best outcome - they want a CEO meeting |
| **Deck Requested** | 📧 | 5-day follow-up | Auto-marks Deck Sent major milestone |
| **Call Back** | 🔄 | 2-day follow-up | They asked to call later |
| **Voicemail** | 📱 | 2-day follow-up | Left a message |
| **No Answer** | 📵 | 1-day follow-up | Try again tomorrow |
| **Not Interested** | ❌ | None | End of the line |

Each logged call adds a timestamped entry to the lead's notes, e.g.:
`[18/1/26, 2:30 pm] 📞 Deck Requested: Great conversation, sending AI deck`

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

## Industry Playbooks

### Overview

The Industry Playbooks tab provides tailored scripts and objection handling for **19 industry verticals**. Each vertical includes industry-specific opening scripts, objection handlers, pain points, and AI use cases.

### Vertical Selection

Use the dropdown to select an industry vertical:

| Icon | Vertical | Key Focus Areas |
|------|----------|-----------------|
| 🏥 | Healthcare / Aged Care | Staff burnout, family communication, compliance |
| 💰 | Financial Services | Compliance, client onboarding, wealth handoff |
| 🏭 | Manufacturing | Supply chain, plant floor visibility, quality |
| ⚖️ | Professional Services | Billable hours, client portals, M&A integration |
| 🛒 | Retail / E-Commerce | Omnichannel, inventory, loyalty programs |
| 🎓 | Education | Student lifecycle, enrollment, alumni engagement |
| 💚 | Nonprofit | Donor retention, grants, volunteer coordination |
| 🏛️ | Government | Digital services, citizen experience, procurement |
| 🏠 | Real Estate | Lead response time, transaction coordination |
| 🚚 | Logistics / Transport | WISMO calls, proactive communication, tracking |
| 🏨 | Hospitality | OTA dependency, guest recognition, group sales |
| 📡 | Telecommunications | Churn, billing calls, 5G, self-service |
| ⚡ | Energy & Utilities | Billing, outages, smart meters, energy transition |
| 🎬 | Media & Entertainment | Subscriber churn, content discovery, audience data |
| 🌾 | Agriculture | Spreadsheet migration, seasonal planning, growth |
| 🏗️ | Construction | Bid win rate, pipeline visibility, client comms |
| ⛏️ | Mining & Resources | Contracts, ESG reporting, remote coordination |
| 🚗 | Automotive | Lead response, service-sales, lifecycle marketing |
| 🏢 | Other Industry | General CRM value proposition |

### Industry-Specific Content

Each vertical includes:

| Section | Content |
|---------|---------|
| **Opening Scripts** | 4 tailored opening lines with "why it works" explanation |
| **Objection Handling** | 5 industry-specific objections with responses |
| **Target Profile** | Ideal company size, revenue, decision makers |
| **Pain Points** | Industry-specific problems to probe |
| **Buying Triggers** | Events that signal readiness to buy |
| **Agentforce Use Case** | AI application for this vertical |
| **Industry Stats** | Data points to use in conversations |

### Playbook Tabs

The playbook popup includes three distinct script sets:

| Tab | When to Use |
|-----|-------------|
| **Existing SF User** | Prospect already uses Salesforce - focus on AI upgrades, Agentforce, optimization |
| **Non-SF Prospect** | Prospect uses other CRM, spreadsheets, or nothing - focus on migration value |
| **Generic Pitch** | Pitch Fexle as a full-stack system integrator - Salesforce, E-Commerce, Mobile, Web |

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

### Generic Pitch Tab

Use this tab to pitch Fexle as a **full-stack system integrator** — not just Salesforce, but e-commerce, mobile apps, and custom web development.

#### When to Use

- When the conversation shifts to broader technology needs
- When positioning Fexle's overall value proposition
- When the prospect needs more than just Salesforce
- When comparing Fexle to other consultancies/integrators

#### Capabilities Covered

| Area | Technologies |
|------|--------------|
| **Salesforce** | Agentforce, Data Cloud, Sales/Service/Marketing Cloud, Industry Clouds, MuleSoft |
| **E-Commerce** | B2B & B2C platforms, Commerce Cloud, payment gateways, order management |
| **Mobile** | iOS, Android, React Native, Flutter, Xamarin |
| **Web Dev** | Laravel, Node.js, React, Angular, PHP, ASP.NET, WordPress, Drupal |

#### Script Structure (Same as Other Tabs)

1. **Opening Scripts** - Full capability intro, Salesforce-focused intro, existing partner scenario
2. **Pain Points to Probe** - Current partner issues (too slow, too expensive, junior staff, etc.)
3. **Pivot to Value** - Hybrid model, speed to value, Platinum expertise, full-stack capabilities
4. **Path Forward: CEO Meeting** - Primary goal is securing a meeting with Fexle's CEO. Includes scripts for when they hesitate, are interested, want more info first, or timing isn't right
5. **Objection Handling** - "Never heard of you", "Prefer Big Four", offshore concerns, etc.

#### Quick Stats to Reference

| Metric | Value |
|--------|-------|
| Support call reduction | 30% |
| Customer satisfaction increase | 25% |
| Case resolution improvement | 40% |
| Employee onboarding speed | 75% faster |
| Sales productivity | 35% improvement |
| Agentforce ROI | 213% |

---

## Email Templates

### Available Templates

| Template | When to Use |
|----------|-------------|
| **📧 Send Agentforce Guide** | After call when Salesforce prospect wants the deck |
| **📧 Send AI Success Guide** | After call when general AI prospect wants the deck |
| **🔄 Follow Up on Deck** | 5-7 days after sending deck |
| **📅 CEO Meeting Confirm** | Confirm booked CEO meeting |
| **📞 Voicemail Follow Up** | After leaving a voicemail |
| **❄️ Cold Email** | Initial outreach without prior call |
| **👋 Breakup Email** | Final email after multiple attempts |
| **🤝 LinkedIn Connection** | Personalized LinkedIn message |
| **🏥 Health Check Offer** | Offer free Salesforce assessment |

### Two Marketing Leave-Behinds

The app supports two different PDF guides depending on the lead type:

| Guide | PDF File | Best For |
|-------|----------|----------|
| **☁️ Agentforce Guide** | Your-Customers-Wont-Wait-Neither-Should-You.pdf | Salesforce/Agentforce leads |
| **🤖 AI Success Guide** | How-to-Succeed-with-AI-Implementation.pdf | General AI leads (non-Salesforce) |

**Agentforce Guide highlights:**
- 70% case deflection, 84% faster resolution, 213% ROI
- Wiley, Reddit, Accenture case studies
- AI readiness assessment
- Agentforce vs custom AI comparison

**AI Success Guide highlights:**
- 80% of AI projects fail, only 5% achieve meaningful impact
- 3.6x higher returns for those who master fundamentals
- Lessons from IBM Watson, McDonald's AI, Volkswagen failures
- 90-day implementation roadmap

### Send Deck Button

Click the **📧 Send Deck** button to see a dropdown with both options:
1. **Agentforce Guide** - Opens email with Salesforce-focused template
2. **AI Success Guide** - Opens email with general AI template

The email client opens with the template pre-populated. Remember to attach the appropriate PDF before sending.

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

## AI Research & Call Prep

### Requirements

- Anthropic API key configured in Settings
- Active internet connection

### Running Research

1. Select a lead in Call Center
2. Click **🔍 AI Research** button (or "Refresh Research" if already done)
3. Wait for Claude to analyze (15-30 seconds)
4. Research modal displays results

### Research Output

| Section | Content |
|---------|---------|
| **Priority Level** | HIGH / MEDIUM / NURTURE urgency rating |
| **Company Overview** | What the company does, size, market position |
| **Key Contacts** | Additional decision-makers found with phone/email |
| **Salesforce Likelihood** | Assessment of their CRM readiness |
| **AI Readiness Signals** | Signs they're ready for Agentforce |
| **Potential Pain Points** | Specific challenges to probe |
| **Trigger Events** | Things to investigate or ask about |
| **Recommended Opening** | Best opening line for this prospect |
| **Talking Points** | Personalized discussion points |

### Saved Research

Research automatically saves to the lead record and persists in localStorage.

**Where to find saved research:**

1. **Lead Header Panel**: Purple "Saved AI Research" box shows summary
2. **Call Prep Panel**: Expandable section above call logging form
3. **Research Modal**: Click "View Full" to see complete research

### Call Prep Panel

When preparing for a call, expand the **"Call Prep: AI Research"** panel to see:

- Company overview
- **Recommended opening** (highlighted)
- Key talking points
- Pain points to probe
- Trigger events to investigate
- Key contacts found
- Research date

### Refreshing Research

- Click **"Refresh Research"** or **"🔄 Refresh Research"** to re-run
- Useful if company situation has changed
- Old research is replaced with new

### Research Persistence

- Saved to lead record in localStorage
- Survives page refreshes and browser restarts
- Included in CSV exports (priority level, key insights)

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
| Backup Reminder | 💾 | Backup data reminder |

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
- Backup reminders (weekly)

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
2. Upload CSV file (see format below)
3. Leads are automatically normalized and scored

### CSV Import Format

The import supports flexible column headers. Include a header row with any of these column names:

| Column | Required | Alternatives | Notes |
|--------|----------|--------------|-------|
| `company` | Yes | (position 0 if no headers) | Company name |
| `contact` | Recommended | `name` | Contact person's full name |
| `title` | Optional | `role` | Job title |
| `phone` | Optional | | Phone number |
| `email` | Optional | | Email address |
| `vertical` | Optional | `industry` | See mapping below |
| `notes` | Optional | | Any notes about the lead |
| `score` | Optional | | 0-100; if blank, auto-calculated |
| `status` | Optional | | Defaults to "New Lead" |

**Example CSV:**
```csv
company,contact,title,phone,email,vertical,notes
Acme Corp,John Smith,CEO,02 9555 1234,john@acme.com,manufacturing,Met at conference
Pacific Health,Sarah Lee,COO,02 9555 5678,sarah@pacifichealth.com,healthcare,Expanding to 3 sites
```

**Vertical/Industry Mapping:**

The importer automatically normalizes industry values:

| If CSV contains... | Maps to |
|-------------------|---------|
| health, aged, medical | Healthcare |
| professional, legal, accounting, consulting | Professional Services |
| manufactur, industrial | Manufacturing |
| financ, bank, wealth | Financial Services |
| retail, commerce | Retail |
| education, training | Education |
| nonprofit, nfp, charity | Nonprofit |
| government, public | Government |
| real estate, property | Real Estate |
| logistics, transport | Logistics |
| hospitality, hotel, tourism | Hospitality |

**Tips:**
- Columns can be in any order if headers are included
- Use double quotes around values containing commas: `"Smith, John"`
- Empty rows are skipped
- Duplicate detection is by email address

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

**Quick Backup:**
1. Click **💾 Backup Data** button
2. CSV file downloads with all lead data
3. This also resets the weekly backup reminder timer

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

### Your Profile

Set up your profile information for use in call scripts and email signatures:

| Field | Purpose | Example |
|-------|---------|---------|
| **Your Name** | Used in scripts and email signatures | Kylie McKinley |
| **Your Email** | Included in email signature block | kylie@fexle.com |
| **Your Phone** | Included in email signature block | +61 4XX XXX XXX |

### API Keys

| Setting | Purpose |
|---------|---------|
| **Anthropic API Key** | Enables AI Research feature |
| **Apollo API Key** | Enables Apollo.io lead search |

### Other Options

| Setting | Purpose |
|---------|---------|
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
