/**
 * @module tests/utils/analytics.test
 * @description Tests for analytics calculation utilities
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getDateRange,
  DATE_RANGES,
  calculateCallMetrics,
  calculateConversionFunnel,
  calculateLeadSourceStats,
  calculateMeetingStats,
  calculateRepStats,
  calculateCallsByDay,
  calculateLocalAnalytics,
  formatDuration,
  calculateTrend
} from '../../src/utils/analytics.js';

describe('getDateRange', () => {
  describe('preset ranges', () => {
    it('returns today for DATE_RANGES.today', () => {
      const { startDate, endDate } = getDateRange(DATE_RANGES.today);
      expect(startDate.toDateString()).toBe(endDate.toDateString());
    });

    it('returns yesterday for DATE_RANGES.yesterday', () => {
      const { startDate, endDate } = getDateRange(DATE_RANGES.yesterday);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      expect(startDate.toDateString()).toBe(yesterday.toDateString());
      expect(endDate.toDateString()).toBe(yesterday.toDateString());
    });

    it('returns 7-day range for DATE_RANGES.last7Days', () => {
      const { startDate, endDate } = getDateRange(DATE_RANGES.last7Days);
      const diffDays = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(6); // 7 days inclusive = 6 day difference
    });

    it('returns 30-day range for DATE_RANGES.last30Days', () => {
      const { startDate, endDate } = getDateRange(DATE_RANGES.last30Days);
      const diffDays = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(29); // 30 days inclusive = 29 day difference
    });

    it('returns current month range for DATE_RANGES.thisMonth', () => {
      const { startDate, endDate } = getDateRange(DATE_RANGES.thisMonth);
      const today = new Date();
      expect(startDate.getDate()).toBe(1);
      expect(startDate.getMonth()).toBe(today.getMonth());
    });

    it('handles custom range', () => {
      const customStart = new Date(2024, 0, 1);
      const customEnd = new Date(2024, 0, 15);
      const { startDate, endDate } = getDateRange(DATE_RANGES.custom, customStart, customEnd);
      expect(startDate).toBe(customStart);
      expect(endDate).toBe(customEnd);
    });
  });
});

describe('calculateCallMetrics', () => {
  const baseCall = {
    status: 'completed',
    startedAt: new Date().toISOString(),
    durationSeconds: 120
  };

  it('returns zeros for empty array', () => {
    const result = calculateCallMetrics([], new Date(2020, 0, 1), new Date());
    expect(result.total).toBe(0);
    expect(result.connected).toBe(0);
  });

  it('counts total calls in date range', () => {
    const today = new Date();
    const calls = [
      { ...baseCall },
      { ...baseCall },
      { ...baseCall, status: 'no-answer' }
    ];
    const result = calculateCallMetrics(calls, new Date(today.getTime() - 86400000), today);
    expect(result.total).toBe(3);
  });

  it('counts connected calls', () => {
    const today = new Date();
    const calls = [
      { ...baseCall, status: 'completed' },
      { ...baseCall, status: 'completed' },
      { ...baseCall, status: 'no-answer' }
    ];
    const result = calculateCallMetrics(calls, new Date(today.getTime() - 86400000), today);
    expect(result.connected).toBe(2);
    expect(result.noAnswer).toBe(1);
  });

  it('calculates average duration', () => {
    const today = new Date();
    const calls = [
      { ...baseCall, durationSeconds: 60 },
      { ...baseCall, durationSeconds: 120 }
    ];
    const result = calculateCallMetrics(calls, new Date(today.getTime() - 86400000), today);
    expect(result.avgDuration).toBe(90);
  });

  it('handles meeting requested disposition', () => {
    const today = new Date();
    const calls = [
      { ...baseCall, disposition: 'meeting-requested' },
      { ...baseCall, disposition: 'voicemail' }
    ];
    const result = calculateCallMetrics(calls, new Date(today.getTime() - 86400000), today);
    expect(result.meetingRequested).toBe(1);
    expect(result.voicemail).toBe(1);
  });
});

describe('calculateConversionFunnel', () => {
  it('returns zeros for empty array', () => {
    const result = calculateConversionFunnel([]);
    expect(result.new).toBe(0);
    expect(result.percentages.contactedRate).toBe(0);
  });

  it('counts leads by status', () => {
    const leads = [
      { status: 'New Lead' },
      { status: 'New Lead' },
      { status: 'Qualified' },
      { status: 'Contacted' }
    ];
    const result = calculateConversionFunnel(leads);
    expect(result.new).toBe(2);
    expect(result.qualified).toBe(1);
    expect(result.contacted).toBe(1);
  });

  it('counts milestone-based stages', () => {
    const leads = [
      { status: 'Active', milestones: { proposalSent: true } },
      { status: 'Active', milestones: { closedWon: true } },
      { status: 'Active', milestones: { closedLost: true } }
    ];
    const result = calculateConversionFunnel(leads);
    expect(result.proposalSent).toBe(1);
    expect(result.closedWon).toBe(1);
    expect(result.closedLost).toBe(1);
  });

  it('calculates conversion percentages', () => {
    const leads = [
      { status: 'New Lead' },
      { status: 'Contacted' },
      { status: 'Qualified' },
      { status: 'CEO Meeting Booked', milestones: {} }
    ];
    const result = calculateConversionFunnel(leads);
    expect(result.percentages.contactedRate).toBe(25); // 1/4
    expect(result.percentages.qualifiedRate).toBe(25); // 1/4
  });
});

describe('calculateLeadSourceStats', () => {
  it('returns empty for no leads', () => {
    const result = calculateLeadSourceStats([]);
    expect(result.total).toBe(0);
    expect(Object.keys(result.sources)).toHaveLength(0);
  });

  it('counts leads by source', () => {
    const leads = [
      { source: 'apollo' },
      { source: 'apollo' },
      { source: 'manual' },
      { source: 'import' }
    ];
    const result = calculateLeadSourceStats(leads);
    expect(result.total).toBe(4);
    expect(result.sources.apollo.count).toBe(2);
    expect(result.sources.apollo.percentage).toBe(50);
  });

  it('handles missing source as unknown', () => {
    const leads = [{ company: 'Test' }];
    const result = calculateLeadSourceStats(leads);
    expect(result.sources.unknown.count).toBe(1);
  });
});

describe('calculateMeetingStats', () => {
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86400000);

  it('returns zeros for empty array', () => {
    const result = calculateMeetingStats([], yesterday, today);
    expect(result.booked).toBe(0);
  });

  it('counts meetings by status', () => {
    const meetings = [
      { startDate: today.toISOString(), status: 'scheduled' },
      { startDate: today.toISOString(), status: 'completed' },
      { startDate: today.toISOString(), status: 'no-show' },
      { startDate: today.toISOString(), status: 'cancelled' }
    ];
    const result = calculateMeetingStats(meetings, yesterday, today);
    expect(result.booked).toBe(4);
    expect(result.completed).toBe(1);
    expect(result.noShow).toBe(1);
    expect(result.cancelled).toBe(1);
  });

  it('calculates completion rate', () => {
    const meetings = [
      { startDate: today.toISOString(), status: 'completed' },
      { startDate: today.toISOString(), status: 'scheduled' }
    ];
    const result = calculateMeetingStats(meetings, yesterday, today);
    expect(result.completionRate).toBe(50);
  });
});

describe('calculateRepStats', () => {
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86400000);

  it('returns empty array for no data', () => {
    const result = calculateRepStats([], [], [], yesterday, today);
    expect(result).toHaveLength(0);
  });

  it('aggregates calls by user', () => {
    const calls = [
      { userId: 'user1', status: 'completed', startedAt: today.toISOString() },
      { userId: 'user1', status: 'completed', startedAt: today.toISOString() },
      { userId: 'user2', status: 'no-answer', startedAt: today.toISOString() }
    ];
    const result = calculateRepStats(calls, [], [], yesterday, today);
    expect(result).toHaveLength(2);
    const user1 = result.find(r => r.userId === 'user1');
    expect(user1.calls).toBe(2);
    expect(user1.connected).toBe(2);
  });

  it('calculates conversion rate', () => {
    const calls = [
      { userId: 'user1', status: 'completed', startedAt: today.toISOString() },
      { userId: 'user1', status: 'completed', startedAt: today.toISOString() }
    ];
    const meetings = [
      { createdBy: 'user1', startDate: today.toISOString() }
    ];
    const result = calculateRepStats(calls, meetings, [], yesterday, today);
    const user1 = result.find(r => r.userId === 'user1');
    expect(user1.conversionRate).toBe(50); // 1 meeting / 2 calls * 100
  });
});

describe('calculateCallsByDay', () => {
  it('returns array of days in range', () => {
    const start = new Date(2024, 0, 1);
    const end = new Date(2024, 0, 3);
    const result = calculateCallsByDay([], start, end);
    expect(result).toHaveLength(3);
    expect(result[0].date).toBe('2024-01-01');
    expect(result[2].date).toBe('2024-01-03');
  });

  it('aggregates calls by day', () => {
    const start = new Date(2024, 0, 1);
    const end = new Date(2024, 0, 2);
    const calls = [
      { startedAt: '2024-01-01T10:00:00Z', status: 'completed' },
      { startedAt: '2024-01-01T11:00:00Z', status: 'no-answer' },
      { startedAt: '2024-01-02T10:00:00Z', status: 'completed' }
    ];
    const result = calculateCallsByDay(calls, start, end);
    expect(result[0].total).toBe(2);
    expect(result[0].connected).toBe(1);
    expect(result[1].total).toBe(1);
  });
});

describe('formatDuration', () => {
  it('formats seconds under a minute', () => {
    expect(formatDuration(30)).toBe('0:30');
    expect(formatDuration(5)).toBe('0:05');
  });

  it('formats minutes', () => {
    expect(formatDuration(90)).toBe('1:30');
    expect(formatDuration(600)).toBe('10:00');
  });

  it('formats hours', () => {
    expect(formatDuration(3661)).toBe('1:01:01');
    expect(formatDuration(7200)).toBe('2:00:00');
  });

  it('handles zero and negative', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(-10)).toBe('0:00');
    expect(formatDuration(null)).toBe('0:00');
  });
});

describe('calculateTrend', () => {
  it('calculates positive trend', () => {
    const result = calculateTrend(150, 100);
    expect(result.value).toBe(50);
    expect(result.direction).toBe('up');
  });

  it('calculates negative trend', () => {
    const result = calculateTrend(50, 100);
    expect(result.value).toBe(50);
    expect(result.direction).toBe('down');
  });

  it('handles flat trend', () => {
    const result = calculateTrend(100, 100);
    expect(result.value).toBe(0);
    expect(result.direction).toBe('flat');
  });

  it('handles zero previous value', () => {
    const result = calculateTrend(50, 0);
    expect(result.value).toBe(100);
    expect(result.direction).toBe('up');
  });
});

describe('calculateLocalAnalytics', () => {
  it('returns complete analytics structure', () => {
    const data = {
      leads: [{ status: 'New Lead' }],
      tasks: [],
      meetings: [],
      callLogs: []
    };
    const result = calculateLocalAnalytics(data, DATE_RANGES.last7Days);

    expect(result).toHaveProperty('period');
    expect(result).toHaveProperty('callMetrics');
    expect(result).toHaveProperty('conversionFunnel');
    expect(result).toHaveProperty('meetingStats');
    expect(result).toHaveProperty('leadSources');
    expect(result).toHaveProperty('callsByDay');
    expect(result).toHaveProperty('repLeaderboard');
  });

  it('uses default date range', () => {
    const data = { leads: [], tasks: [], meetings: [], callLogs: [] };
    const result = calculateLocalAnalytics(data);
    expect(result.period.range).toBe(DATE_RANGES.last7Days);
  });
});
