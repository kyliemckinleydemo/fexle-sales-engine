# White-Label Customization Guide

This guide explains how to customize the Sales Engine platform for your company.

---

## Quick Start

1. **Create your organization** - Done automatically on first login
2. **Go to Settings** - Click the gear icon
3. **Configure each section** - Company info, scripts, verticals, etc.

---

## Configuration Areas

### 1. Company Information

| Field | Description | Used In |
|-------|-------------|---------|
| `name` | Your company name | Scripts, emails, everywhere |
| `tagline` | Your value proposition | Scripts, emails |
| `size` | Team size (e.g., "50+ employees") | Scripts |
| `locations` | Office locations | Scripts |
| `keyProducts` | Products/services you sell | Scripts, research |
| `proofPoints` | Case studies, achievements | Objection handlers |
| `website` | Company website | Email signatures |
| `ceoName` | Meeting host name | Meeting invites |
| `meetingDuration` | Default meeting length | Calendar |
| `targetAction` | Primary conversion goal | See Target Action section |

### 2. Target Action (Conversion Goal)

The **target action** is your primary conversion goal - the action you want prospects to take. By default, this is "CEO Meeting," but you can customize it for your business model.

**Configuration Schema:**

```json
{
  "targetAction": {
    "type": "meeting",
    "label": "CEO Meeting",
    "shortLabel": "CEO Meeting",
    "statusLabel": "CEO Meeting Booked",
    "milestoneLabel": "CEO Meeting Held",
    "milestoneKey": "ceoMeetingHeld",
    "buttonText": "Schedule CEO Meeting",
    "description": "20-minute conversation with our CEO",
    "duration": 20,
    "priority": 1,
    "followUpDays": 1,
    "icon": "📅",
    "color": {
      "bg": "bg-green-200",
      "text": "text-green-900",
      "border": "border-green-400"
    }
  }
}
```

**Available Presets:**

| Preset | Type | Status Label | Button Text |
|--------|------|--------------|-------------|
| CEO Meeting | `meeting` | CEO Meeting Booked | Schedule CEO Meeting |
| Product Demo | `demo` | Demo Booked | Book a Demo |
| Free Consultation | `consultation` | Consultation Booked | Book Free Consultation |
| Webinar Registration | `webinar` | Webinar Registered | Register for Webinar |
| Discovery Call | `meeting` | Discovery Booked | Schedule Discovery Call |
| Callback Request | `callback` | Callback Requested | Request Callback |

**Configuration Fields:**

| Field | Description | Example |
|-------|-------------|---------|
| `type` | Action category | `meeting`, `demo`, `webinar`, `consultation`, `callback`, `resource` |
| `label` | Full display name | "Product Demo" |
| `shortLabel` | Short name for buttons | "Demo" |
| `statusLabel` | Lead status when booked | "Demo Booked" |
| `milestoneLabel` | Checkbox label | "Demo Completed" |
| `milestoneKey` | Milestone field name | "demoCompleted" |
| `buttonText` | Call-to-action button | "Book a Demo" |
| `description` | Calendar invite description | "30-minute product demonstration" |
| `duration` | Default meeting length (minutes) | 30 |
| `priority` | Task priority (1=highest) | 1 |
| `followUpDays` | Days until follow-up | 1 |
| `icon` | Emoji for buttons | "🎬" |
| `color.bg` | Background color class | "bg-blue-200" |
| `color.text` | Text color class | "text-blue-900" |
| `color.border` | Border color class | "border-blue-400" |

**Example: Product Demo Configuration**

```json
{
  "targetAction": {
    "type": "demo",
    "label": "Product Demo",
    "shortLabel": "Demo",
    "statusLabel": "Demo Booked",
    "milestoneLabel": "Demo Completed",
    "milestoneKey": "demoCompleted",
    "buttonText": "Book a Demo",
    "description": "30-minute product demonstration showing key features",
    "duration": 30,
    "priority": 1,
    "followUpDays": 1,
    "icon": "🎬",
    "color": {
      "bg": "bg-blue-200",
      "text": "text-blue-900",
      "border": "border-blue-400"
    }
  }
}
```

**What Changes:**

When you customize the target action, the following UI elements update automatically:
- Status dropdown options
- Milestone checkbox labels
- Quick action buttons (e.g., "Schedule CEO Meeting" → "Book a Demo")
- Meeting modal titles
- Calendar invite content
- Lead status colors
- Task priorities
- Follow-up schedules
- Dashboard metrics

### 3. Localization

| Field | Options | Effect |
|-------|---------|--------|
| `country` | AU, US, CA, UK | Phone formatting, states |
| `currency` | AUD, USD, CAD, GBP | Revenue brackets |
| `timezone` | IANA timezone | Meeting times |
| `dateFormat` | en-AU, en-US, etc. | Date display |

### 3. Call Scripts

Scripts use tokens that get replaced with actual values:

| Token | Replaced With |
|-------|---------------|
| `{COMPANY}` | Your company name |
| `{CALLER_NAME}` | Logged-in user's name |
| `{PROSPECT_NAME}` | Lead's contact name |
| `{PROSPECT_COMPANY}` | Lead's company |
| `{PRODUCT}` | Your primary product |
| `{PROOF_POINT}` | A proof point |
| `{COLLATERAL}` | Marketing material name |

**Script Categories:**
- `openings` - Initial call openers
- `pivots` - Transition to your pitch
- `closes` - Meeting/collateral asks
- `objections` - Objection handlers
- `followUp` - Follow-up scripts
- `openingsNonSF` - For prospects not using your product
- `pivotsNonSF` - Pivots for non-users

### 4. Industry Verticals

Each vertical includes:
- Pain points specific to that industry
- Decision maker titles
- Industry-specific scripts
- Competitor information
- Use cases for your solution

**Built-in Verticals:**
- Healthcare & Aged Care
- Professional Services
- Manufacturing
- Financial Services
- Retail & E-Commerce
- Education
- Nonprofit
- Government
- Real Estate
- Logistics
- Hospitality
- Telecom
- Energy
- Media
- Agriculture
- Construction
- Mining
- Automotive
- General

You can enable/disable verticals and customize their content.

### 5. Lead Scoring

Configure how leads are scored:

**Company Size Scores:**
```json
{
  "1-50": 5,
  "51-200": 15,
  "201-500": 20,
  "501-1000": 15,
  "1000+": 10
}
```

**Revenue Scores:**
```json
{
  "Under $5M": 5,
  "$5M-$20M": 10,
  "$20M-$50M": 15,
  "$50M-$200M": 20,
  "$200M+": 15
}
```

**Title Scores:**
```json
{
  "CEO": 25,
  "COO": 22,
  "Director": 15,
  "Manager": 10,
  "Other": 5
}
```

**Vertical Fit Scores:**
```json
{
  "healthcare": 15,
  "financial": 15,
  "manufacturing": 12,
  ...
}
```

### 6. Marketing Collateral

Upload and manage leave-behind materials:

| Field | Description |
|-------|-------------|
| `name` | Display name |
| `description` | What it contains |
| `type` | pdf, ppt, doc, image, video, link |
| `fileUrl` | URL or uploaded file |
| `tags` | For organization |

**Collateral Rules:**
Configure when to suggest specific materials:

| Trigger | When to Suggest |
|---------|-----------------|
| `objection_timing` | "Not ready yet" |
| `objection_vendor` | Has existing vendor |
| `objection_budget` | Cost concerns |
| `close_soft` | Soft close |
| `close_followup` | During follow-up |
| `stage_discovery` | Discovery calls |
| `always` | Always available |

---

## Importing Existing Configuration

### From Sample Config

The `examples/sample-config/` directory contains sample complete configuration as a reference. To use it as a starting point:

1. Open each file in the `examples/sample-config/` folder
2. Modify the content for your company
3. Import via the Settings panel

### From JSON

Export your config from Settings, modify it, and re-import.

---

## Phone Number Formatting

The platform auto-detects and formats phone numbers by country:

| Country | Mobile | Landline | Business |
|---------|--------|----------|----------|
| Australia | 04XX XXX XXX | 0X XXXX XXXX | 1300, 1800 |
| United States | (XXX) XXX-XXXX | Same | 800, 888, etc. |
| Canada | (XXX) XXX-XXXX | Same | Same as US |
| United Kingdom | 07XXX XXXXXX | 0XX XXXX XXXX | 0800, 0808 |

---

## Email Templates

Email templates use the same tokens as scripts, plus additional tokens for personalization and target action support.

### Basic Tokens

| Token | Replaced With |
|-------|---------------|
| `[FIRST_NAME]` | Lead's first name |
| `[COMPANY]` | Lead's company name |
| `[YOUR_NAME]` | Your name |
| `[YOUR_EMAIL]` | Your email |
| `[YOUR_PHONE]` | Your phone |
| `[INDUSTRY]` | Lead's industry name |
| `[PAIN_POINT]` | Industry pain point |
| `[TIMEZONE]` | Organization's timezone |
| `[COMPANY_SIGNATURE]` | Organization name and tagline |

### Target Action Tokens

These tokens automatically adapt based on your configured target action:

| Token | Replaced With |
|-------|---------------|
| `[TARGET_LABEL]` | Target action label (e.g., "CEO Meeting", "Product Demo") |
| `[TARGET_LABEL_LOWER]` | Lowercase label (e.g., "ceo meeting", "product demo") |
| `[TARGET_DURATION]` | Meeting/call duration in minutes |
| `[TARGET_HOST_DESC]` | Host description (e.g., "our CEO", "our product team") |
| `[TARGET_ICON]` | Target action emoji icon |
| `[TARGET_EXPECTATION]` | Auto-generated expectation text based on action type |
| `[TARGET_EMAIL_SUBJECT]` | Email subject prefix with host name |
| `[HOST_NAME]` | CEO/host name from company config |

### Meeting Tokens

| Token | Replaced With |
|-------|---------------|
| `[DATE]` | Meeting date (fill in manually) |
| `[TIME]` | Meeting time (fill in manually) |
| `[MEETING_LINK]` | Video call link (fill in manually) |

### Template Categories

Templates are organized into categories:

**Booking Confirmations:**
- `targetActionConfirm` - Dynamic confirmation for any target action
- `demoConfirm` - Product demo confirmation
- `webinarConfirm` - Webinar registration confirmation
- `consultationConfirm` - Consultation booking confirmation
- `callbackConfirm` - Callback request confirmation

**Follow-ups:**
- `targetActionFollowUp` - Pre-meeting preparation reminder
- `targetActionRecap` - Post-meeting recap
- `demoFollowUp` - Demo follow-up (2-3 days after)
- `webinarFollowUp` - Webinar attendee follow-up
- `webinarNoShow` - Follow-up for webinar no-shows
- `consultationFollowUp` - Post-consultation follow-up

**Resource Emails:**
- `aiDeck` - Agentforce guide (Salesforce leads)
- `aiDeckGeneral` - AI Success guide (general leads)
- `healthCheck` - Salesforce health check offer

**Outreach:**
- `coldOutreach` - Initial cold email
- `noAnswer` - Voicemail follow-up

**Relationship:**
- `meetingRecap` - Discovery call recap
- `referralRequest` - Ask for referrals
- `breakup` - Final attempt email

### Template Selection

The email modal highlights "Recommended" templates based on your configured target action. For example:
- **CEO Meeting** → `targetActionConfirm` and `targetActionFollowUp`
- **Product Demo** → `demoConfirm` and `demoFollowUp`
- **Webinar** → `webinarConfirm` and `webinarFollowUp`

---

## Best Practices

### Scripts

1. **Be specific** - Generic scripts don't convert
2. **Use proof points** - Include real numbers and results
3. **Test and iterate** - Track what works
4. **Match industry** - Use vertical-specific language

### Scoring

1. **Start with defaults** - They're reasonable baselines
2. **Adjust based on results** - Increase weights for factors that predict success
3. **Review quarterly** - Your ICP may evolve

### Verticals

1. **Disable unused ones** - Keep the UI clean
2. **Customize pain points** - Add industry-specific issues
3. **Add local competitors** - Relevant to your market

---

## API Access

For programmatic config updates:

```javascript
// Get config
const { data: config } = await supabase.rpc('get_org_config', {
  p_org_id: organizationId
});

// Update config
const { data: updated } = await supabase.rpc('update_org_config', {
  p_org_id: organizationId,
  p_config: { company: { name: 'New Name' } }
});
```

---

## Migration from Local Mode

If you started with localStorage and want to move to Supabase:

1. Export your leads from Settings
2. Set up Supabase (see SETUP.md)
3. Create your organization
4. Import leads via CSV or Apollo

Note: Local storage data is separate from Supabase data. They don't automatically sync.
