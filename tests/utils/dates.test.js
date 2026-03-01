/**
 * @module tests/utils/dates.test
 * @description Tests for date calculations and task priority with configurable target action
 *
 * EXPORTS:
 * - Tests for FOLLOW_UP_DAYS constant
 * - Tests for getFollowUpDays with custom target action
 * - Tests for calculateFollowUpDate with optional targetAction config
 * - Tests for getTaskPriority with optional targetAction config
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  calculateFollowUpDate,
  getTaskPriority,
  getFollowUpDays,
  FOLLOW_UP_DAYS,
  DEFAULT_TARGET_ACTION
} from '../../src/utils/dates.js';

describe('FOLLOW_UP_DAYS', () => {
  it('defines correct follow-up days for each status', () => {
    expect(FOLLOW_UP_DAYS['Deck Sent']).toBe(7);
    expect(FOLLOW_UP_DAYS['Follow Up']).toBe(3);
    expect(FOLLOW_UP_DAYS['Call Scheduled']).toBe(1);
    expect(FOLLOW_UP_DAYS['Discovery Call Done']).toBe(2);
    expect(FOLLOW_UP_DAYS['Qualified']).toBe(5);
    expect(FOLLOW_UP_DAYS['CEO Meeting Booked']).toBe(1);
    expect(FOLLOW_UP_DAYS['Proposal Sent']).toBe(3);
    expect(FOLLOW_UP_DAYS['New Lead']).toBe(0);
    expect(FOLLOW_UP_DAYS['No Answer']).toBe(2);
  });
});

describe('DEFAULT_TARGET_ACTION', () => {
  it('has correct default values for CEO Meeting', () => {
    expect(DEFAULT_TARGET_ACTION.type).toBe('meeting');
    expect(DEFAULT_TARGET_ACTION.label).toBe('CEO Meeting');
    expect(DEFAULT_TARGET_ACTION.statusLabel).toBe('CEO Meeting Booked');
    expect(DEFAULT_TARGET_ACTION.milestoneLabel).toBe('CEO Meeting Held');
    expect(DEFAULT_TARGET_ACTION.followUpDays).toBe(1);
    expect(DEFAULT_TARGET_ACTION.priority).toBe(1);
  });
});

describe('getFollowUpDays', () => {
  it('returns default days with null config', () => {
    const days = getFollowUpDays(null);
    expect(days['CEO Meeting Booked']).toBe(1);
    expect(days['Deck Sent']).toBe(7);
  });

  it('uses custom target action status and days', () => {
    const customConfig = {
      statusLabel: 'Demo Booked',
      followUpDays: 2
    };
    const days = getFollowUpDays(customConfig);
    expect(days['Demo Booked']).toBe(2);
    expect(days['Deck Sent']).toBe(7); // Base values unchanged
  });

  it('defaults to 1 day if followUpDays not specified', () => {
    const customConfig = {
      statusLabel: 'Consultation Booked'
      // followUpDays not specified
    };
    const days = getFollowUpDays(customConfig);
    expect(days['Consultation Booked']).toBe(1);
  });
});

describe('calculateFollowUpDate', () => {
  // Helper to create a date with local timezone (avoids UTC parsing issues)
  const createLocalDate = (year, month, day) => new Date(year, month - 1, day);

  describe('Status-based calculations (no config)', () => {
    it('adds 7 days for Deck Sent', () => {
      const baseDate = createLocalDate(2025, 1, 15);
      const result = calculateFollowUpDate(baseDate, 'Deck Sent');
      expect(result.getDate()).toBe(22);
    });

    it('adds 3 days for Follow Up', () => {
      const baseDate = createLocalDate(2025, 1, 15);
      const result = calculateFollowUpDate(baseDate, 'Follow Up');
      expect(result.getDate()).toBe(18);
    });

    it('adds 1 day for Call Scheduled', () => {
      const baseDate = createLocalDate(2025, 1, 15);
      const result = calculateFollowUpDate(baseDate, 'Call Scheduled');
      expect(result.getDate()).toBe(16);
    });

    it('adds 2 days for Discovery Call Done', () => {
      const baseDate = createLocalDate(2025, 1, 15);
      const result = calculateFollowUpDate(baseDate, 'Discovery Call Done');
      expect(result.getDate()).toBe(17);
    });

    it('adds 5 days for Qualified', () => {
      const baseDate = createLocalDate(2025, 1, 15);
      const result = calculateFollowUpDate(baseDate, 'Qualified');
      expect(result.getDate()).toBe(20);
    });

    it('adds 1 day for CEO Meeting Booked (default)', () => {
      const baseDate = createLocalDate(2025, 1, 15);
      const result = calculateFollowUpDate(baseDate, 'CEO Meeting Booked');
      expect(result.getDate()).toBe(16);
    });

    it('adds 3 days for Proposal Sent', () => {
      const baseDate = createLocalDate(2025, 1, 15);
      const result = calculateFollowUpDate(baseDate, 'Proposal Sent');
      expect(result.getDate()).toBe(18);
    });

    it('adds 0 days for New Lead', () => {
      const baseDate = createLocalDate(2025, 1, 15);
      const result = calculateFollowUpDate(baseDate, 'New Lead');
      expect(result.getDate()).toBe(15);
    });

    it('adds 2 days for No Answer', () => {
      const baseDate = createLocalDate(2025, 1, 15);
      const result = calculateFollowUpDate(baseDate, 'No Answer');
      expect(result.getDate()).toBe(17);
    });
  });

  describe('Custom target action config', () => {
    const demoConfig = {
      statusLabel: 'Demo Booked',
      followUpDays: 3
    };

    it('uses custom status with configured days', () => {
      const baseDate = createLocalDate(2025, 1, 15);
      const result = calculateFollowUpDate(baseDate, 'Demo Booked', demoConfig);
      expect(result.getDate()).toBe(18); // 15 + 3 days
    });

    it('still uses default days for non-target statuses', () => {
      const baseDate = createLocalDate(2025, 1, 15);
      const result = calculateFollowUpDate(baseDate, 'Deck Sent', demoConfig);
      expect(result.getDate()).toBe(22); // 15 + 7 days
    });
  });

  describe('Unknown status handling', () => {
    it('defaults to 7 days for unknown status', () => {
      const baseDate = createLocalDate(2025, 1, 15);
      const result = calculateFollowUpDate(baseDate, 'Unknown Status');
      expect(result.getDate()).toBe(22);
    });

    it('defaults to 7 days for null status', () => {
      const baseDate = createLocalDate(2025, 1, 15);
      const result = calculateFollowUpDate(baseDate, null);
      expect(result.getDate()).toBe(22);
    });
  });

  describe('Date input handling', () => {
    it('accepts Date object', () => {
      const baseDate = createLocalDate(2025, 1, 15);
      const result = calculateFollowUpDate(baseDate, 'New Lead');
      expect(result instanceof Date).toBe(true);
    });

    it('accepts ISO date string', () => {
      const result = calculateFollowUpDate('2025-01-15T12:00:00', 'Deck Sent');
      expect(result.getDate()).toBe(22);
    });

    it('uses current date when lastContactDate is null', () => {
      const before = new Date();
      const result = calculateFollowUpDate(null, 'Deck Sent');
      const after = new Date();

      // The result should be 7 days from around now
      expect(result.getTime()).toBeGreaterThanOrEqual(before.getTime() + 7 * 24 * 60 * 60 * 1000 - 1000);
      expect(result.getTime()).toBeLessThanOrEqual(after.getTime() + 7 * 24 * 60 * 60 * 1000 + 1000);
    });
  });

  describe('Month boundary handling', () => {
    it('handles month rollover correctly', () => {
      const baseDate = createLocalDate(2025, 1, 30);
      const result = calculateFollowUpDate(baseDate, 'Deck Sent'); // +7 days
      expect(result.getMonth()).toBe(1); // February (0-indexed)
      expect(result.getDate()).toBe(6);
    });

    it('handles year rollover correctly', () => {
      const baseDate = createLocalDate(2024, 12, 30);
      const result = calculateFollowUpDate(baseDate, 'Deck Sent'); // +7 days
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getDate()).toBe(6);
    });
  });
});

describe('getTaskPriority', () => {
  describe('Priority 1 (Highest) - no config', () => {
    it('returns P1 for score >= 85', () => {
      expect(getTaskPriority({ score: 85, status: 'New Lead' })).toBe(1);
      expect(getTaskPriority({ score: 100, status: 'New Lead' })).toBe(1);
    });

    it('returns P1 for CEO Meeting Booked (default)', () => {
      expect(getTaskPriority({ score: 50, status: 'CEO Meeting Booked' })).toBe(1);
    });

    it('returns P1 for Call Scheduled', () => {
      expect(getTaskPriority({ score: 50, status: 'Call Scheduled' })).toBe(1);
    });
  });

  describe('Custom target action config', () => {
    const demoConfig = {
      statusLabel: 'Demo Booked',
      priority: 1
    };

    const lowPriorityConfig = {
      statusLabel: 'Webinar Registered',
      priority: 2
    };

    it('returns P1 for custom target action status', () => {
      expect(getTaskPriority({ score: 50, status: 'Demo Booked' }, demoConfig)).toBe(1);
    });

    it('returns custom priority for target action', () => {
      expect(getTaskPriority({ score: 50, status: 'Webinar Registered' }, lowPriorityConfig)).toBe(2);
    });

    it('does not give P1 to default CEO Meeting Booked when config overrides', () => {
      // When using custom config, CEO Meeting Booked is no longer special
      expect(getTaskPriority({ score: 50, status: 'CEO Meeting Booked' }, demoConfig)).toBe(4);
    });
  });

  describe('Priority 2', () => {
    it('returns P2 for score >= 75 with Qualified status', () => {
      expect(getTaskPriority({ score: 75, status: 'Qualified' })).toBe(2);
      expect(getTaskPriority({ score: 80, status: 'Qualified' })).toBe(2);
    });

    it('returns P2 for score >= 75 with Discovery Call Done status', () => {
      expect(getTaskPriority({ score: 75, status: 'Discovery Call Done' })).toBe(2);
    });

    it('returns P2 for Follow Up status', () => {
      expect(getTaskPriority({ score: 50, status: 'Follow Up' })).toBe(2);
    });

    it('returns P1 (not P2) if score >= 85 even with Qualified', () => {
      // Score check happens first
      expect(getTaskPriority({ score: 85, status: 'Qualified' })).toBe(1);
    });
  });

  describe('Priority 3', () => {
    it('returns P3 for Deck Sent status', () => {
      expect(getTaskPriority({ score: 50, status: 'Deck Sent' })).toBe(3);
    });

    it('returns P3 for New Lead with score >= 70', () => {
      expect(getTaskPriority({ score: 70, status: 'New Lead' })).toBe(3);
      expect(getTaskPriority({ score: 75, status: 'New Lead' })).toBe(3);
    });
  });

  describe('Priority 4 (Lowest)', () => {
    it('returns P4 for low score New Lead', () => {
      expect(getTaskPriority({ score: 50, status: 'New Lead' })).toBe(4);
      expect(getTaskPriority({ score: 60, status: 'New Lead' })).toBe(4);
    });

    it('returns P4 for unknown status', () => {
      expect(getTaskPriority({ score: 50, status: 'Unknown' })).toBe(4);
    });

    it('returns P4 for Closed Won', () => {
      expect(getTaskPriority({ score: 50, status: 'Closed Won' })).toBe(4);
    });

    it('returns P4 for Closed Lost', () => {
      expect(getTaskPriority({ score: 50, status: 'Closed Lost' })).toBe(4);
    });
  });

  describe('Edge Cases', () => {
    it('handles missing score', () => {
      expect(getTaskPriority({ status: 'CEO Meeting Booked' })).toBe(1);
      expect(getTaskPriority({ status: 'New Lead' })).toBe(4);
    });

    it('handles missing status', () => {
      expect(getTaskPriority({ score: 85 })).toBe(1);
      expect(getTaskPriority({ score: 50 })).toBe(4);
    });

    it('handles empty lead object', () => {
      expect(getTaskPriority({})).toBe(4);
    });

    it('handles config with missing priority (defaults to 1)', () => {
      const configNoPriority = {
        statusLabel: 'Custom Booked'
        // priority not specified
      };
      expect(getTaskPriority({ score: 50, status: 'Custom Booked' }, configNoPriority)).toBe(1);
    });
  });
});
