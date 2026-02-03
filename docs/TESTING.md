# Testing Documentation

This document describes the testing infrastructure for the Fexle Sales Engine.

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
fexle-sales-engine/
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
│   │   └── transform.test.js     # Transform tests
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

### 7. Integration Tests (`workflow.test.js`)

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

### 7. Cross-Feature Integration Tests

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

---

## Related Documentation

- [Vitest Documentation](https://vitest.dev/)
- [jsdom Documentation](https://github.com/jsdom/jsdom)
- [src/utils/README.md](../src/utils/README.md) - Utility module documentation
- [CUSTOMIZATION.md](./CUSTOMIZATION.md) - Configuration options
- [SETUP.md](./SETUP.md) - Installation and setup
