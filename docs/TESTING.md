# Testing Documentation

This document describes the testing infrastructure for the Outbound Sales Engine.

## Overview

The project uses [Vitest](https://vitest.dev/) as the test framework with jsdom for browser environment simulation. All tests use **real implementations** - no mocking or stubbing of core functionality.

## Test Philosophy

- **Real implementations only**: Tests use actual localStorage (via jsdom), real scoring weights, and real data transformations
- **Isolated tests**: Each test starts with clean state (localStorage cleared)
- **Comprehensive coverage**: Both unit tests and integration tests
- **Fast execution**: Vitest provides fast test execution with watch mode

## Quick Start

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run tests in watch mode (development)
npm run test:watch

# Run with coverage report
npm run test:coverage

# Run with Vitest UI (interactive)
npm run test:ui
```

## Project Structure

```
outbound-sales-engine/
├── src/
│   ├── constants/
│   │   ├── scoring-weights.js    # Lead scoring configuration
│   │   ├── phone-formats.js      # Phone number patterns
│   │   └── index.js              # Re-exports
│   └── utils/
│       ├── scoring.js            # calculateLeadScore
│       ├── csv.js                # parseCSV, generateCSV
│       ├── phone.js              # Phone formatting functions
│       ├── dates.js              # Date calculations
│       ├── storage.js            # localStorage helpers
│       ├── transform.js          # Data transformations
│       └── index.js              # Re-exports
├── tests/
│   ├── setup.js                  # Test environment setup
│   ├── utils/
│   │   ├── scoring.test.js       # 40+ scoring tests
│   │   ├── csv.test.js           # CSV parsing tests
│   │   ├── phone.test.js         # Phone formatting tests
│   │   ├── dates.test.js         # Date calculation tests
│   │   ├── storage.test.js       # localStorage tests
│   │   ├── transform.test.js     # Transform tests
│   │   └── analytics.test.js     # Analytics calculation tests
│   └── integration/
│       └── workflow.test.js      # End-to-end workflows
├── vitest.config.js              # Vitest configuration
└── package.json                  # npm scripts
```

## Test Configuration

### vitest.config.js

```javascript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',        // Browser-like environment
    globals: true,               // Global test functions
    include: ['tests/**/*.test.js'],
    setupFiles: ['tests/setup.js'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.js'],
      reporter: ['text', 'html', 'lcov']
    }
  }
});
```

### tests/setup.js

```javascript
beforeEach(() => {
  localStorage.clear();  // Clean state for each test
});
```

## Test Modules

### 1. Scoring Tests (`scoring.test.js`)

Tests the lead scoring algorithm with real scoring weights.

| Test Category | Tests |
|---------------|-------|
| Company Size | 6 tests for each size bracket |
| Revenue | 6 tests for each revenue bracket |
| Title | 14 tests for title hierarchy |
| Intent Signals | 9 tests including cap behavior |
| Vertical Fit | 10 tests for each vertical |
| Complete Scenarios | 4 end-to-end scoring tests |

Example:
```javascript
it('scores CEO at 25 points', () => {
  const lead = { title: 'CEO', vertical: 'general' };
  const { breakdown } = calculateLeadScore(lead);
  expect(breakdown.title).toBe(25);
});
```

### 2. CSV Tests (`csv.test.js`)

Tests CSV parsing and generation.

| Test Category | Tests |
|---------------|-------|
| Basic Parsing | 4 tests |
| Quoted Values | 2 tests |
| Header Aliases | 3 tests |
| Default Values | 5 tests |
| Vertical Normalization | 12 tests |
| CSV Generation | 6 tests |
| Round-trip | 1 test |

### 3. Phone Tests (`phone.test.js`)

Tests multi-country phone number handling.

| Test Category | Tests |
|---------------|-------|
| Country Detection | 15 tests (AU, US, CA, UK) |
| E.164 Formatting | 12 tests |
| Display Formatting | 10 tests |
| Validation | 15 tests |

### 4. Dates Tests (`dates.test.js`)

Tests date calculations and task priority.

| Test Category | Tests |
|---------------|-------|
| Follow-up Days | 9 status-based tests |
| Unknown Status | 2 tests |
| Date Input | 3 tests |
| Month Boundary | 2 tests |
| Task Priority | 12 tests |

### 5. Storage Tests (`storage.test.js`)

Tests localStorage with real jsdom implementation.

| Test Category | Tests |
|---------------|-------|
| saveToStorage | 6 tests |
| loadFromStorage | 8 tests |
| Round-trip | 3 tests |

### 6. Transform Tests (`transform.test.js`)

Tests data transformation between formats.

| Test Category | Tests |
|---------------|-------|
| Company Size Buckets | 6 tests |
| Revenue Buckets | 6 tests |
| Vertical Detection | 13 tests |
| transformLead | 3 tests |
| toDbLead | 2 tests |
| transformApolloLead | 5 tests |
| Round-trip | 1 test |

### 7. Analytics Tests (`analytics.test.js`)

Tests analytics calculations for dashboard metrics.

| Test Category | Tests |
|---------------|-------|
| Date Ranges | 6 tests for each preset |
| Call Metrics | 5 tests |
| Conversion Funnel | 4 tests |
| Lead Sources | 3 tests |
| Meeting Stats | 4 tests |
| Rep Stats | 3 tests |
| Calls by Day | 3 tests |
| Trend Calculation | 4 tests |
| Duration Formatting | 5 tests |

### 8. Integration Tests (`workflow.test.js`)

Tests complete workflows.

| Test | Description |
|------|-------------|
| Apollo → Score → Storage | Full lead import workflow |
| CSV Import → Process → Export | CSV round-trip |
| Phone Formatting Pipeline | Multi-country formatting |
| Status and Follow-up | Lead management workflow |
| Supabase Round-trip | DB transformation cycle |
| Multiple Leads Scoring | Batch processing |
| Complete App State | Full state persistence |

## Coverage Targets

| Module | Target | Notes |
|--------|--------|-------|
| scoring.js | 95% | Core business logic |
| csv.js | 90% | Import/export critical |
| phone.js | 90% | Multi-country support |
| dates.js | 90% | Task management |
| storage.js | 85% | Error handling paths |
| transform.js | 90% | DB integration |

## Running Specific Tests

```bash
# Run a specific test file
npx vitest tests/utils/scoring.test.js

# Run tests matching a pattern
npx vitest --testNamePattern "CEO"

# Run only integration tests
npx vitest tests/integration/
```

## Writing New Tests

### Test File Template

```javascript
/**
 * @module tests/utils/example.test
 * @description Tests for example module
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { myFunction } from '../../src/utils/example.js';

describe('myFunction', () => {
  describe('basic functionality', () => {
    it('handles normal input', () => {
      const result = myFunction('input');
      expect(result).toBe('expected');
    });
  });

  describe('edge cases', () => {
    it('handles null input', () => {
      expect(myFunction(null)).toBeNull();
    });
  });
});
```

### Best Practices

1. **Descriptive test names**: Use clear, behavior-focused descriptions
2. **Arrange-Act-Assert**: Structure tests clearly
3. **One assertion per concept**: Keep tests focused
4. **Test edge cases**: null, undefined, empty, boundaries
5. **Use real data**: Match production data structures

## Continuous Integration

Add to your CI pipeline:

```yaml
# Example GitHub Actions
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
    - run: npm install
    - run: npm test
    - run: npm run test:coverage
```

## Troubleshooting

### Tests fail with "localStorage is not defined"

Ensure `environment: 'jsdom'` is set in vitest.config.js.

### Tests are slow

- Use `npm run test:watch` for incremental testing
- Run specific test files rather than the full suite

### Coverage is lower than expected

- Check that source files are in the `include` pattern
- Some error handling paths may be difficult to cover
- Focus on business logic coverage first

---

## Manual Test Plans

The following features require manual testing in the browser. These tests verify UI behavior, Supabase integration, and end-to-end workflows.

### Test Environment Setup

**Local Mode Testing:**
1. Open `index.html` directly in browser
2. No Supabase configuration needed
3. Data persists in localStorage

**Supabase Mode Testing:**
1. Configure Supabase URL and anon key
2. Create a test account and organization
3. Have a second email for invitation testing

---

### 1. Target Action Configuration

**Purpose:** Verify target action presets work correctly across the UI.

#### Test 1.1: Switch Target Action Preset

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open Settings (gear icon) | Settings panel opens |
| 2 | Expand "Target Action" section | Shows 4 preset buttons |
| 3 | Click "Product Demo" preset | Button highlights, notification shown |
| 4 | Check status dropdown on any lead | Should show "Demo Booked" option |
| 5 | Check milestone checkbox label | Should say "Demo Completed" |
| 6 | Check quick action button | Should say "Book a Demo" with 🎬 icon |
| 7 | Open calendar modal | Title should be "🎬 Demo Schedule" |

#### Test 1.2: All Preset Variations

| Preset | Status Label | Button Text | Calendar Title |
|--------|--------------|-------------|----------------|
| CEO Meeting | CEO Meeting Booked | Schedule CEO Meeting | CEO Availability Calendar |
| Product Demo | Demo Booked | Book a Demo | Demo Schedule |
| Free Consultation | Consultation Booked | Book Free Consultation | Consultation Calendar |
| Webinar | Webinar Registered | Register for Webinar | Webinar Schedule |

#### Test 1.3: Target Action Persistence

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Set target action to "Product Demo" | UI updates |
| 2 | Refresh the page | Target action should still be "Product Demo" |
| 3 | Check all UI elements | Should show demo-related labels |

---

### 2. Dynamic Email Templates

**Purpose:** Verify email templates use correct target action tokens.

#### Test 2.1: Template Token Replacement

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select a lead | Lead details shown |
| 2 | Click "✉️ Email" button | Email modal opens |
| 3 | Select "targetActionConfirm" template | Template loads |
| 4 | Check subject line | Should include target action label |
| 5 | Check body text | Should include [TARGET_DURATION], [TARGET_HOST_DESC] replaced |
| 6 | Check "[COMPANY_SIGNATURE]" | Should show org name + tagline |

#### Test 2.2: Template Grouping

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open email modal | Templates shown in left panel |
| 2 | Check category headers | Should see: "Booking Confirmations", "Follow-ups", "Resource Emails", "Outreach", "Relationship" |
| 3 | Check recommended badge | Correct templates should show "Recommended" badge |

#### Test 2.3: Recommended Templates by Action Type

| Target Action | Recommended Confirm | Recommended Follow-up |
|---------------|--------------------|-----------------------|
| CEO Meeting | targetActionConfirm | targetActionFollowUp |
| Product Demo | demoConfirm | demoFollowUp |
| Webinar | webinarConfirm | webinarFollowUp |
| Consultation | consultationConfirm | consultationFollowUp |

#### Test 2.4: Email Template List

Verify all these templates exist and load correctly:

**Booking Confirmations:**
- [ ] targetActionConfirm
- [ ] demoConfirm
- [ ] webinarConfirm
- [ ] consultationConfirm
- [ ] callbackConfirm
- [ ] ceoMeetingConfirm (legacy)

**Follow-ups:**
- [ ] targetActionFollowUp
- [ ] targetActionRecap
- [ ] demoFollowUp
- [ ] webinarFollowUp
- [ ] webinarNoShow
- [ ] consultationFollowUp
- [ ] deckFollowUp
- [ ] deckFollowUpGeneral

**Resource Emails:**
- [ ] aiDeck
- [ ] aiDeckGeneral
- [ ] healthCheck

**Outreach:**
- [ ] coldOutreach
- [ ] noAnswer

**Relationship:**
- [ ] meetingRecap
- [ ] referralRequest
- [ ] breakup

---

### 3. Availability Calendar Abstraction

**Purpose:** Verify calendar UI updates based on target action.

#### Test 3.1: Calendar Header

| Target Action | Expected Title | Expected Subtitle |
|---------------|----------------|-------------------|
| CEO Meeting | 📅 CEO Availability Calendar | Click slots to mark available • Click available slots to book |
| Product Demo | 🎬 Demo Schedule | Set available demo times • Book demos for leads |
| Webinar | 📺 Webinar Schedule | Create webinar sessions • Register attendees |
| Consultation | 💬 Consultation Calendar | Set consultation availability • Book sessions |

#### Test 3.2: Calendar Legend Labels

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Set target action to "Product Demo" | - |
| 2 | Open calendar modal | - |
| 3 | Check legend | Should show "Demo Slot", "Demo Booked", "Custom Time" |

#### Test 3.3: Schedule Challenge Messages

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select a lead | - |
| 2 | Open calendar modal | - |
| 3 | Click an unavailable (empty) slot | Sidebar shows booking panel |
| 4 | Check challenge message | Should use target action's challengeMessage |
| 5 | Book the slot | Notification should mention correct label |

#### Test 3.4: Calendar Button in Header

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Set target action to "Webinar" | - |
| 2 | Check header button | Should show "📺 Webinar Calendar" |
| 3 | Set target action to "CEO Meeting" | - |
| 4 | Check header button | Should show "📅 CEO Meeting Calendar" |

#### Test 3.5: ICS Export Filename

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Book a meeting | ICS downloads |
| 2 | Check filename | Should be `{TargetAction}_Export_{date}.ics` |
| 3 | Example: Demo | `Demo_Export_2026-02-03.ics` |

---

### 4. Team Management (Supabase Mode)

**Purpose:** Verify team invitation and management features.

**Prerequisites:**
- Supabase mode configured
- Logged in as organization owner
- Have access to a second email address

#### Test 4.1: View Team Management Section

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open Settings | Settings panel opens |
| 2 | Check for "Team Management" section | Should be visible (owner only) |
| 3 | Expand the section | Shows invite form and member list |

#### Test 4.2: Invite Team Member

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter email in invite field | Email entered |
| 2 | Select role (admin/member/viewer) | Role selected |
| 3 | Click "Invite" button | Loading state, then success notification |
| 4 | Check "Pending Invitations" section | New invitation appears |

#### Test 4.3: Copy Invite Link

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find pending invitation | - |
| 2 | Click "📋 Link" button | "Invite link copied!" notification |
| 3 | Paste from clipboard | URL with `?invite=TOKEN` format |

#### Test 4.4: Cancel Invitation

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find pending invitation | - |
| 2 | Click "✕" button | Confirmation dialog |
| 3 | Confirm cancellation | Invitation removed from list |

#### Test 4.5: Resend Invitation

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find pending invitation | - |
| 2 | Click "🔄" button | "Invitation resent" notification |
| 3 | Check invitation | New expiry date (7 days from now) |

#### Test 4.6: Change Member Role

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find a non-owner member | - |
| 2 | Change dropdown to different role | "Role updated" notification |
| 3 | Refresh page | Role change persisted |

#### Test 4.7: Remove Team Member

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find a non-owner member | - |
| 2 | Click "✕" button | Confirmation dialog |
| 3 | Confirm removal | Member removed from list |

#### Test 4.8: Owner Cannot Be Removed

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find the owner in member list | - |
| 2 | Check for remove button | Should NOT have ✕ button |
| 3 | Check role dropdown | Should show "Owner" badge, no dropdown |

---

### 5. Invitation Acceptance Flow

**Purpose:** Verify new users can accept invitations.

**Prerequisites:**
- An active invitation link
- Access to invited email's inbox
- Incognito/private browser window

#### Test 5.1: Accept Invitation (New User)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open invite link in incognito | App loads with invite token |
| 2 | Click "Sign Up" | Registration form shown |
| 3 | Complete registration | Account created |
| 4 | After auth completes | "Accepting invitation..." spinner |
| 5 | Wait for acceptance | "Welcome to the Team!" screen |
| 6 | Click "Continue to App" | Lands in organization dashboard |

#### Test 5.2: Accept Invitation (Existing User)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open invite link (logged out) | App loads |
| 2 | Log in with existing account | - |
| 3 | After auth | Invitation accepted automatically |
| 4 | Check organization | Should be in invited organization |

#### Test 5.3: Invalid/Expired Invitation

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open link with invalid token | App loads |
| 2 | Log in | - |
| 3 | After auth | "Invitation Error" screen |
| 4 | Check error message | "Invalid or expired invitation" |
| 5 | Click "Continue Anyway" | Proceeds to org setup or existing org |

#### Test 5.4: Already Used Invitation

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Accept an invitation | Success |
| 2 | Try same link again | Should show error |
| 3 | Error message | Invitation already used |

---

### 6. Local Mode Features

**Purpose:** Verify local mode works independently without Supabase.

#### Test 6.1: Full Functionality Without Supabase

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open app without Supabase config | App loads in local mode |
| 2 | Check mode indicator in Settings | Shows "Local Mode" badge |
| 3 | Add a lead | Lead saved to localStorage |
| 4 | Change target action | Setting persisted |
| 5 | Refresh page | All data still present |

#### Test 6.2: Local Mode Config Editing

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open Settings | - |
| 2 | Find "Company Settings" section | Should be visible in local mode |
| 3 | Edit company name | Change saved |
| 4 | Refresh page | Change persisted |

#### Test 6.3: JSON Backup/Restore

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Add several leads and tasks | Data exists |
| 2 | Click "📦 Export JSON Backup" | JSON file downloads |
| 3 | Clear localStorage (or use new browser) | Data gone |
| 4 | Click "📥 Import JSON Backup" | File picker opens |
| 5 | Select exported file | "Backup restored" notification |
| 6 | Check data | All leads, tasks, settings restored |

#### Test 6.4: Local Mode Permissions

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open Settings in local mode | - |
| 2 | Check admin sections | Should all be accessible |
| 3 | Check "Team Management" section | Should NOT be visible (Supabase only) |

---

### 7. Call Timer & Logging

**Purpose:** Verify call timer tracks duration and logs calls correctly.

#### Test 7.1: Start Timer on Dial

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select a lead with phone number | Lead details shown |
| 2 | Click "📞 Dial & Start Timer" button | Phone app opens, timer starts |
| 3 | Check timer display | Red pulsing dot, MM:SS counting up |
| 4 | Wait 10 seconds | Timer shows 0:10 |
| 5 | Click "⏹️ Stop Timer" | Timer stops but duration preserved |

#### Test 7.2: Log Call with Duration

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Start a call timer | Timer running |
| 2 | Wait 30 seconds | Timer shows 0:30 |
| 3 | Select "Meeting Requested" outcome | Outcome highlighted |
| 4 | Add a note: "Great conversation" | Note entered |
| 5 | Click "📝 Log Call" | Notification shows "Call logged: Meeting Requested (0:30)" |
| 6 | Check lead notes | Shows "[timestamp] 📞 Meeting Requested: Great conversation\n(Duration: 0:30)" |

#### Test 7.3: Call History Display

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log 2-3 calls on a lead | Calls logged |
| 2 | Check "Call History" section | Shows "Call History (X calls)" toggle |
| 3 | Click to expand | Shows list of previous calls |
| 4 | Check call entries | Each shows: timestamp, outcome badge, duration, notes |

#### Test 7.4: Auto Status Update

| Outcome | Expected Status Change |
|---------|------------------------|
| Meeting Requested | → "Call Scheduled" |
| Deck Requested | → "Deck Sent" + milestone |
| Not Interested | → "Closed Lost" |
| Voicemail | No change, creates follow-up |
| No Answer | No change, creates follow-up |
| Call Back | No change, creates follow-up |

#### Test 7.5: Timer Reset on Lead Change

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Start timer for Lead A | Timer running |
| 2 | Select Lead B | Timer stops, resets to 0 |
| 3 | Return to Lead A | Timer is at 0 (not resumed) |

#### Test 7.6: Manual Timer Without Dial

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Make call using external phone | - |
| 2 | Click "📞 Dial & Start Timer" | Timer starts (even if not dialing) |
| 3 | Log call outcome | Duration recorded correctly |

---

### 8. Cross-Feature Integration Tests

**Purpose:** Verify features work together correctly.

#### Test 7.1: Target Action → Email → Calendar Flow

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Set target action to "Product Demo" | UI updates |
| 2 | Select a lead | Lead selected |
| 3 | Open email modal | - |
| 4 | Select "demoConfirm" template | Shows "Recommended" badge |
| 5 | Check template tokens | All [TARGET_*] tokens replaced |
| 6 | Close email modal | - |
| 7 | Open calendar | Title shows "Demo Schedule" |
| 8 | Book a demo slot | Notification uses "Demo" terminology |

#### Test 7.2: Team Member Sees Org Config

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | As owner, set target action to "Consultation" | Config saved |
| 2 | Log in as invited member | - |
| 3 | Check UI | Should show "Consultation" as target action |
| 4 | Check calendar | Should show "Consultation Calendar" |

#### Test 7.3: Webinar Multi-Registration (Future)

*Note: This tests the `allowMultipleBookings` flag when fully implemented.*

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Set target action to "Webinar" | - |
| 2 | Create a webinar session slot | Session created |
| 3 | Register Lead A for session | Registration recorded |
| 4 | Register Lead B for same session | Both registered (not overwritten) |

---

### Test Execution Checklist

Use this checklist when testing a new deployment:

**Quick Smoke Test (5 min):**
- [ ] App loads without errors
- [ ] Can add a lead
- [ ] Can change target action
- [ ] Calendar modal opens
- [ ] Email templates load

**Target Action Tests (10 min):**
- [ ] Test 1.1: Switch preset
- [ ] Test 1.2: All presets work
- [ ] Test 1.3: Persistence

**Email Template Tests (10 min):**
- [ ] Test 2.1: Token replacement
- [ ] Test 2.2: Template grouping
- [ ] Test 2.3: Recommended badges

**Calendar Tests (10 min):**
- [ ] Test 3.1: Dynamic header
- [ ] Test 3.2: Legend labels
- [ ] Test 3.3: Challenge messages
- [ ] Test 3.4: Header button

**Team Management Tests (Supabase, 15 min):**
- [ ] Test 4.1: View section
- [ ] Test 4.2: Send invitation
- [ ] Test 4.5: Resend invitation
- [ ] Test 4.6: Change role

**Invitation Flow (Supabase, 10 min):**
- [ ] Test 5.1: New user accepts
- [ ] Test 5.3: Invalid token handling

**Local Mode Tests (5 min):**
- [ ] Test 6.1: Works without Supabase
- [ ] Test 6.3: Backup/restore

**Call Timer Tests (5 min):**
- [ ] Test 7.1: Start timer on dial
- [ ] Test 7.2: Log call with duration
- [ ] Test 7.3: Call history display
- [ ] Test 7.4: Auto status update

---

### 9. Analytics Dashboard

**Purpose:** Verify analytics dashboard displays correct metrics and charts.

#### Test 9.1: Analytics Tab Navigation

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "📊 Analytics" in header | Analytics tab becomes active |
| 2 | Check URL/state | activeTab should be 'analytics' |
| 3 | Check page content | Shows gradient header with date picker |

#### Test 9.2: Date Range Selection

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open Analytics tab | Default shows "Last 7 Days" |
| 2 | Select "Today" | Metrics update for today only |
| 3 | Select "Last 30 Days" | Metrics update for 30-day range |
| 4 | Click "Refresh" button | Loading spinner, then refresh |

#### Test 9.3: Metric Cards

| Card | What to Verify |
|------|----------------|
| Total Calls | Shows count of completed call tasks |
| Connected | Shows connected calls with percentage rate |
| Meetings Booked | Shows meeting count |
| Qualified Leads | Shows leads with "Qualified" status |
| Closed Won | Shows leads with closedWon milestone |
| Total Leads | Shows total lead count |

#### Test 9.4: Call Volume Chart

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Check chart renders | Bar chart visible |
| 2 | Check date labels | Shows dates in range |
| 3 | Check legend | Shows "Total" and "Connected" |
| 4 | Hover/inspect bars | Heights proportional to values |

#### Test 9.5: Conversion Funnel

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Check funnel renders | Shows 6 stages |
| 2 | Verify stages | New → Contacted → Qualified → Meeting → Proposal → Won |
| 3 | Check percentages | Shows conversion rate between stages |
| 4 | Check bar widths | Proportional to count |

#### Test 9.6: Lead Source Chart

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Check donut chart renders | Circular chart visible |
| 2 | Check legend | Shows source names with counts |
| 3 | Check center text | Shows total lead count |
| 4 | Verify colors | Each source has distinct color |

#### Test 9.7: Team Leaderboard (Admin Only)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login as admin/owner | - |
| 2 | Open Analytics | - |
| 3 | Check leaderboard | Shows if rep data available |
| 4 | Verify columns | Rep, Calls, Connected, Meetings, Conv. Rate |
| 5 | Check ranking | Medal emojis for top 3 |

#### Test 9.8: Analytics in Local Mode

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Run in local mode (no Supabase) | Analytics still works |
| 2 | Check metrics | Calculated from localStorage data |
| 3 | Add a lead | Metrics update on refresh |

---

### 10. Phone E.164 Formatting (Twilio Prep)

**Purpose:** Verify E.164 phone formatting for Twilio integration.

#### Test 10.1: formatPhoneE164 Function

| Input | Country | Expected Output |
|-------|---------|-----------------|
| 0412345678 | AU | +61412345678 |
| (02) 1234 5678 | AU | +61212345678 |
| (555) 123-4567 | US | +15551234567 |
| 07700 900123 | UK | +447700900123 |
| +1 555 123 4567 | - | +15551234567 |

#### Test 10.2: isValidE164 Function

| Input | Expected |
|-------|----------|
| +61412345678 | true |
| +1234567 | true (min 7 digits) |
| +123456789012345 | true (max 15 digits) |
| 0412345678 | false (no +) |
| +0412345678 | false (starts with 0) |

#### Test 10.3: parsePhone Function

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Call parsePhone('0412345678') | Returns object with all formats |
| 2 | Check e164 property | '+61412345678' |
| 3 | Check tel property | '+61412345678' |
| 4 | Check display property | '0412 345 678' |
| 5 | Check country property | 'AU' |
| 6 | Check valid property | true |

---

### 11. Competitive Features (Database)

**Purpose:** Verify new database tables exist after migration.

**Prerequisites:**
- Supabase mode configured
- Migration 004_features.sql applied

#### Test 11.1: Verify New Tables Exist

| Table | Query to Verify |
|-------|-----------------|
| analytics_snapshots | SELECT COUNT(*) FROM analytics_snapshots |
| email_report_subscriptions | SELECT COUNT(*) FROM email_report_subscriptions |
| email_sequences | SELECT COUNT(*) FROM email_sequences |
| email_sequence_steps | SELECT COUNT(*) FROM email_sequence_steps |
| lead_sequence_enrollments | SELECT COUNT(*) FROM lead_sequence_enrollments |
| twilio_credentials | SELECT COUNT(*) FROM twilio_credentials |
| call_logs | SELECT COUNT(*) FROM call_logs |
| sms_messages | SELECT COUNT(*) FROM sms_messages |
| sms_templates | SELECT COUNT(*) FROM sms_templates |
| sms_opt_outs | SELECT COUNT(*) FROM sms_opt_outs |
| webhooks | SELECT COUNT(*) FROM webhooks |
| webhook_deliveries | SELECT COUNT(*) FROM webhook_deliveries |
| inbound_webhook_keys | SELECT COUNT(*) FROM inbound_webhook_keys |

#### Test 11.2: Verify RLS Policies

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Try to select from analytics_snapshots as member | Returns org data only |
| 2 | Try to insert into webhooks as member | Permission denied |
| 3 | Try to insert into webhooks as admin | Success |

#### Test 11.3: Verify Analytics RPC Function

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Call get_analytics_data(org_id, start, end) | Returns JSONB |
| 2 | Check callMetrics in response | Has total, connected, etc. |
| 3 | Check conversionFunnel in response | Has new, qualified, etc. |
| 4 | Check as non-member | Permission denied |

---

### Future Feature Tests (Not Yet Implemented)

The following test plans are for features defined in 004_features.sql that need UI implementation:

#### Email Reports (Future)
- [ ] Test subscription toggle in Settings
- [ ] Test daily report delivery
- [ ] Test weekly report delivery
- [ ] Test scope (own vs team)

#### Email Sequences (Future)
- [ ] Test sequence creation
- [ ] Test step configuration
- [ ] Test auto-enrollment on status change
- [ ] Test pause/resume enrollment
- [ ] Test sequence completion

#### Twilio Voice (Future)
- [ ] Test credential configuration
- [ ] Test browser-based calling
- [ ] Test call recording playback
- [ ] Test call disposition logging

#### SMS Support (Future)
- [ ] Test SMS composition
- [ ] Test conversation view
- [ ] Test opt-out compliance
- [ ] Test template selection

#### Webhooks (Future)
- [ ] Test webhook configuration
- [ ] Test event triggering
- [ ] Test retry logic
- [ ] Test inbound webhook API keys

---

## Related Documentation

- [Vitest Documentation](https://vitest.dev/)
- [jsdom Documentation](https://github.com/jsdom/jsdom)
- [src/utils/README.md](../src/utils/README.md) - Utility module documentation
- [CUSTOMIZATION.md](./CUSTOMIZATION.md) - Configuration options
- [SETUP.md](./SETUP.md) - Installation and setup
