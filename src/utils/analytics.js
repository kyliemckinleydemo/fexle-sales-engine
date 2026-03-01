/**
 * @module utils/analytics
 * @description Analytics calculations for dashboard metrics and reporting
 *
 * PURPOSE:
 * - Calculate call metrics from call logs or local data
 * - Generate conversion funnel statistics
 * - Compute rep leaderboard rankings
 * - Aggregate data by date ranges and sources
 *
 * DEPENDENCIES:
 * - None (pure utility functions)
 *
 * EXPORTS:
 * - calculateLocalAnalytics - Compute analytics from localStorage data
 * - calculateCallMetrics - Aggregate call statistics
 * - calculateConversionFunnel - Pipeline stage percentages
 * - calculateLeadSourceStats - Source breakdown
 * - calculateRepStats - Per-rep performance metrics
 * - getDateRange - Get start/end dates for period
 * - formatDuration - Format seconds as MM:SS
 * - calculateTrend - Week-over-week trend percentage
 *
 * PATTERNS:
 * - All functions handle empty/null arrays gracefully
 * - Date ranges are inclusive on both ends
 * - Percentages are returned as 0-100 numbers
 *
 * CLAUDE NOTES:
 * - Used by both localStorage mode and as fallback for Supabase
 * - Supabase mode should prefer get_analytics_data() RPC function
 * - Conversion funnel stages are derived from lead status field
 */

/**
 * Date range presets
 */
export const DATE_RANGES = {
  today: 'today',
  yesterday: 'yesterday',
  last7Days: 'last7Days',
  last30Days: 'last30Days',
  thisWeek: 'thisWeek',
  lastWeek: 'lastWeek',
  thisMonth: 'thisMonth',
  lastMonth: 'lastMonth',
  custom: 'custom'
};

/**
 * Get start and end dates for a date range preset
 * @param {string} range - Date range preset from DATE_RANGES
 * @param {Date} customStart - Custom start date (for 'custom' range)
 * @param {Date} customEnd - Custom end date (for 'custom' range)
 * @returns {{ startDate: Date, endDate: Date }}
 */
export function getDateRange(range, customStart = null, customEnd = null) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (range) {
    case DATE_RANGES.today:
      return { startDate: today, endDate: today };

    case DATE_RANGES.yesterday: {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { startDate: yesterday, endDate: yesterday };
    }

    case DATE_RANGES.last7Days: {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      return { startDate: start, endDate: today };
    }

    case DATE_RANGES.last30Days: {
      const start = new Date(today);
      start.setDate(start.getDate() - 29);
      return { startDate: start, endDate: today };
    }

    case DATE_RANGES.thisWeek: {
      const start = new Date(today);
      start.setDate(start.getDate() - start.getDay()); // Sunday
      return { startDate: start, endDate: today };
    }

    case DATE_RANGES.lastWeek: {
      const end = new Date(today);
      end.setDate(end.getDate() - end.getDay() - 1); // Last Saturday
      const start = new Date(end);
      start.setDate(start.getDate() - 6); // Last Sunday
      return { startDate: start, endDate: end };
    }

    case DATE_RANGES.thisMonth: {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { startDate: start, endDate: today };
    }

    case DATE_RANGES.lastMonth: {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      return { startDate: start, endDate: end };
    }

    case DATE_RANGES.custom:
      return {
        startDate: customStart || today,
        endDate: customEnd || today
      };

    default:
      return { startDate: today, endDate: today };
  }
}

/**
 * Check if a date falls within a range (inclusive)
 * @param {Date|string} date - Date to check
 * @param {Date} startDate - Range start
 * @param {Date} endDate - Range end
 * @returns {boolean}
 */
function isInDateRange(date, startDate, endDate) {
  const d = date instanceof Date ? date : new Date(date);
  const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return dayStart >= startDate && dayStart <= endDate;
}

/**
 * Calculate call metrics from call log entries
 * @param {Array} callLogs - Array of call log objects
 * @param {Date} startDate - Start of date range
 * @param {Date} endDate - End of date range
 * @returns {Object} Call metrics
 */
export function calculateCallMetrics(callLogs, startDate, endDate) {
  if (!callLogs || callLogs.length === 0) {
    return {
      total: 0,
      connected: 0,
      noAnswer: 0,
      voicemail: 0,
      meetingRequested: 0,
      totalDuration: 0,
      avgDuration: 0
    };
  }

  const filtered = callLogs.filter(call => {
    const callDate = call.startedAt || call.started_at || call.createdAt || call.created_at;
    return callDate && isInDateRange(callDate, startDate, endDate);
  });

  const connected = filtered.filter(c =>
    c.status === 'completed' || c.status === 'connected'
  );

  const totalDuration = connected.reduce((sum, c) =>
    sum + (c.durationSeconds || c.duration_seconds || c.duration || 0), 0
  );

  return {
    total: filtered.length,
    connected: connected.length,
    noAnswer: filtered.filter(c => c.status === 'no-answer').length,
    voicemail: filtered.filter(c =>
      c.disposition === 'voicemail' || c.status === 'voicemail'
    ).length,
    meetingRequested: filtered.filter(c =>
      c.disposition === 'meeting-requested' ||
      c.disposition === 'meeting' ||
      c.disposition === 'Meeting Requested'
    ).length,
    totalDuration,
    avgDuration: connected.length > 0 ? Math.round(totalDuration / connected.length) : 0
  };
}

/**
 * Calculate conversion funnel from leads
 * @param {Array} leads - Array of lead objects
 * @returns {Object} Funnel metrics with counts and percentages
 */
export function calculateConversionFunnel(leads) {
  if (!leads || leads.length === 0) {
    return {
      new: 0,
      contacted: 0,
      qualified: 0,
      meetingBooked: 0,
      proposalSent: 0,
      closedWon: 0,
      closedLost: 0,
      percentages: {
        contactedRate: 0,
        qualifiedRate: 0,
        meetingRate: 0,
        proposalRate: 0,
        closeRate: 0
      }
    };
  }

  const counts = {
    new: leads.filter(l => l.status === 'New Lead' || l.status === 'New').length,
    contacted: leads.filter(l =>
      ['Contacted', 'Call Back', 'Voicemail', 'Left Message'].includes(l.status)
    ).length,
    qualified: leads.filter(l => l.status === 'Qualified').length,
    meetingBooked: leads.filter(l =>
      l.status?.includes('Meeting') ||
      l.status?.includes('Booked') ||
      l.milestones?.ceoMeetingHeld === true
    ).length,
    proposalSent: leads.filter(l => l.milestones?.proposalSent === true).length,
    closedWon: leads.filter(l => l.milestones?.closedWon === true).length,
    closedLost: leads.filter(l => l.milestones?.closedLost === true).length
  };

  const total = leads.length;
  const percentages = {
    contactedRate: total > 0 ? Math.round((counts.contacted / total) * 100) : 0,
    qualifiedRate: total > 0 ? Math.round((counts.qualified / total) * 100) : 0,
    meetingRate: total > 0 ? Math.round((counts.meetingBooked / total) * 100) : 0,
    proposalRate: counts.meetingBooked > 0 ? Math.round((counts.proposalSent / counts.meetingBooked) * 100) : 0,
    closeRate: counts.proposalSent > 0 ? Math.round((counts.closedWon / counts.proposalSent) * 100) : 0
  };

  return { ...counts, percentages };
}

/**
 * Calculate lead source breakdown
 * @param {Array} leads - Array of lead objects
 * @returns {Object} Source counts and percentages
 */
export function calculateLeadSourceStats(leads) {
  if (!leads || leads.length === 0) {
    return { sources: {}, total: 0 };
  }

  const sources = {};
  leads.forEach(lead => {
    const source = lead.source || 'unknown';
    sources[source] = (sources[source] || 0) + 1;
  });

  const total = leads.length;
  const withPercentages = {};
  Object.entries(sources).forEach(([source, count]) => {
    withPercentages[source] = {
      count,
      percentage: Math.round((count / total) * 100)
    };
  });

  return { sources: withPercentages, total };
}

/**
 * Calculate meeting statistics
 * @param {Array} meetings - Array of meeting objects
 * @param {Date} startDate - Start of date range
 * @param {Date} endDate - End of date range
 * @returns {Object} Meeting metrics
 */
export function calculateMeetingStats(meetings, startDate, endDate) {
  if (!meetings || meetings.length === 0) {
    return {
      booked: 0,
      completed: 0,
      noShow: 0,
      cancelled: 0,
      completionRate: 0
    };
  }

  const filtered = meetings.filter(m => {
    const meetingDate = m.startDate || m.meeting_date || m.meetingDate;
    return meetingDate && isInDateRange(meetingDate, startDate, endDate);
  });

  const counts = {
    booked: filtered.length,
    completed: filtered.filter(m => m.status === 'completed').length,
    noShow: filtered.filter(m => m.status === 'no-show').length,
    cancelled: filtered.filter(m => m.status === 'cancelled').length
  };

  counts.completionRate = counts.booked > 0
    ? Math.round((counts.completed / counts.booked) * 100)
    : 0;

  return counts;
}

/**
 * Calculate per-rep statistics for leaderboard
 * @param {Array} callLogs - Array of call log objects
 * @param {Array} meetings - Array of meeting objects
 * @param {Array} members - Array of team member objects (optional)
 * @param {Date} startDate - Start of date range
 * @param {Date} endDate - End of date range
 * @returns {Array} Sorted array of rep stats
 */
export function calculateRepStats(callLogs, meetings, members = [], startDate, endDate) {
  const repStats = {};

  // Aggregate call data
  (callLogs || []).forEach(call => {
    const callDate = call.startedAt || call.started_at || call.createdAt;
    if (!callDate || !isInDateRange(callDate, startDate, endDate)) return;

    const userId = call.userId || call.user_id || 'unknown';
    if (!repStats[userId]) {
      repStats[userId] = {
        userId,
        name: 'Unknown',
        calls: 0,
        connected: 0,
        meetings: 0,
        totalDuration: 0
      };
    }

    repStats[userId].calls++;
    if (call.status === 'completed' || call.status === 'connected') {
      repStats[userId].connected++;
      repStats[userId].totalDuration += call.durationSeconds || call.duration_seconds || 0;
    }
  });

  // Aggregate meeting data
  (meetings || []).forEach(meeting => {
    const meetingDate = meeting.startDate || meeting.meeting_date;
    if (!meetingDate || !isInDateRange(meetingDate, startDate, endDate)) return;

    const userId = meeting.createdBy || meeting.created_by || 'unknown';
    if (!repStats[userId]) {
      repStats[userId] = {
        userId,
        name: 'Unknown',
        calls: 0,
        connected: 0,
        meetings: 0,
        totalDuration: 0
      };
    }
    repStats[userId].meetings++;
  });

  // Enrich with member names
  (members || []).forEach(member => {
    const userId = member.userId || member.user_id;
    if (repStats[userId]) {
      repStats[userId].name = member.profile?.full_name || member.profile?.email || member.email || 'Unknown';
    }
  });

  // Calculate conversion rates and sort
  return Object.values(repStats)
    .map(rep => ({
      ...rep,
      conversionRate: rep.calls > 0 ? Math.round((rep.meetings / rep.calls) * 100 * 10) / 10 : 0,
      avgCallDuration: rep.connected > 0 ? Math.round(rep.totalDuration / rep.connected) : 0
    }))
    .sort((a, b) => b.meetings - a.meetings || b.connected - a.connected);
}

/**
 * Calculate calls by day for chart
 * @param {Array} callLogs - Array of call log objects
 * @param {Date} startDate - Start of date range
 * @param {Date} endDate - End of date range
 * @returns {Array} Array of { date, total, connected } objects
 */
export function calculateCallsByDay(callLogs, startDate, endDate) {
  const dayMap = {};

  // Initialize all days in range
  const current = new Date(startDate);
  while (current <= endDate) {
    const dateStr = current.toISOString().split('T')[0];
    dayMap[dateStr] = { date: dateStr, total: 0, connected: 0 };
    current.setDate(current.getDate() + 1);
  }

  // Aggregate calls
  (callLogs || []).forEach(call => {
    const callDate = call.startedAt || call.started_at || call.createdAt;
    if (!callDate) return;

    const date = new Date(callDate);
    const dateStr = date.toISOString().split('T')[0];

    if (dayMap[dateStr]) {
      dayMap[dateStr].total++;
      if (call.status === 'completed' || call.status === 'connected') {
        dayMap[dateStr].connected++;
      }
    }
  });

  return Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Calculate complete local analytics (for localStorage mode)
 * @param {Object} data - Object containing leads, tasks, meetings, callLogs
 * @param {string} dateRange - Date range preset
 * @param {Date} customStart - Custom start date
 * @param {Date} customEnd - Custom end date
 * @returns {Object} Complete analytics data
 */
export function calculateLocalAnalytics(data, dateRange = DATE_RANGES.last7Days, customStart = null, customEnd = null) {
  const { startDate, endDate } = getDateRange(dateRange, customStart, customEnd);
  const { leads = [], tasks = [], meetings = [], callLogs = [], members = [] } = data;

  return {
    period: { startDate, endDate, range: dateRange },
    callMetrics: calculateCallMetrics(callLogs, startDate, endDate),
    conversionFunnel: calculateConversionFunnel(leads),
    meetingStats: calculateMeetingStats(meetings, startDate, endDate),
    leadSources: calculateLeadSourceStats(leads),
    callsByDay: calculateCallsByDay(callLogs, startDate, endDate),
    repLeaderboard: calculateRepStats(callLogs, meetings, members, startDate, endDate)
  };
}

/**
 * Format duration in seconds to MM:SS or HH:MM:SS
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration
 */
export function formatDuration(seconds) {
  if (!seconds || seconds < 0) return '0:00';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Calculate trend percentage (current vs previous period)
 * @param {number} current - Current period value
 * @param {number} previous - Previous period value
 * @returns {{ value: number, direction: 'up'|'down'|'flat' }}
 */
export function calculateTrend(current, previous) {
  if (previous === 0) {
    return { value: current > 0 ? 100 : 0, direction: current > 0 ? 'up' : 'flat' };
  }

  const change = ((current - previous) / previous) * 100;
  return {
    value: Math.abs(Math.round(change)),
    direction: change > 0 ? 'up' : change < 0 ? 'down' : 'flat'
  };
}
