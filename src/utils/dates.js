/**
 * @module utils/dates
 * @description Date calculation utilities for follow-ups and task management
 *
 * PURPOSE:
 * - Calculate follow-up dates based on lead status
 * - Determine task priority based on lead score and status
 * - Support configurable target actions (CEO Meeting, Demo, Consultation, etc.)
 *
 * EXPORTS:
 * - calculateFollowUpDate - Calculate next follow-up date (supports targetAction config)
 * - getTaskPriority - Get priority level (1-4) for a lead (supports targetAction config)
 * - FOLLOW_UP_DAYS - Status to days mapping (base values)
 * - getFollowUpDays - Get follow-up days with configurable target action
 * - DEFAULT_TARGET_ACTION - Default target action config (CEO Meeting)
 *
 * PATTERNS:
 * - Priority 1 (highest) = hot leads, scheduled calls, target action booked
 * - Priority 4 (lowest) = general leads
 * - Follow-up dates are calculated from lastContactDate or now
 * - Pass targetActionConfig to override default CEO Meeting behavior
 *
 * CLAUDE NOTES:
 * - Unknown statuses default to 7 days follow-up
 * - Priority is 1-4 scale (1 = highest)
 * - targetActionConfig is optional; defaults to CEO Meeting for backward compatibility
 * - The statusLabel from targetAction replaces 'CEO Meeting Booked' in priority checks
 */

// Default target action configuration (CEO Meeting for backward compatibility)
export const DEFAULT_TARGET_ACTION = {
  type: 'meeting',
  label: 'CEO Meeting',
  shortLabel: 'CEO Meeting',
  statusLabel: 'CEO Meeting Booked',
  milestoneLabel: 'CEO Meeting Held',
  milestoneKey: 'ceoMeetingHeld',
  buttonText: 'Schedule CEO Meeting',
  description: '20-minute conversation with our CEO',
  duration: 20,
  priority: 1,
  followUpDays: 1,
  icon: '📅',
  color: {
    bg: 'bg-green-200',
    text: 'text-green-900',
    border: 'border-green-400'
  }
};

// Base follow-up schedule (without target action - added dynamically)
const BASE_FOLLOW_UP_DAYS = {
  'Deck Sent': 7,
  'Follow Up': 3,
  'Call Scheduled': 1,
  'Discovery Call Done': 2,
  'Qualified': 5,
  'Proposal Sent': 3,
  'New Lead': 0,
  'No Answer': 2
};

// Legacy export for backward compatibility (includes CEO Meeting Booked)
export const FOLLOW_UP_DAYS = {
  ...BASE_FOLLOW_UP_DAYS,
  'CEO Meeting Booked': 1
};

/**
 * Get follow-up days map with configurable target action
 * @param {Object} targetActionConfig - Target action configuration
 * @returns {Object} Status to days mapping
 */
export function getFollowUpDays(targetActionConfig = null) {
  const targetAction = targetActionConfig || DEFAULT_TARGET_ACTION;
  return {
    ...BASE_FOLLOW_UP_DAYS,
    [targetAction.statusLabel]: targetAction.followUpDays ?? 1
  };
}

/**
 * Calculate next follow-up date based on status
 * @param {string|Date|null} lastContactDate - Last contact date
 * @param {string} status - Lead status
 * @param {Object} targetActionConfig - Optional target action configuration
 * @returns {Date} Follow-up date
 */
export function calculateFollowUpDate(lastContactDate, status, targetActionConfig = null) {
  const now = new Date();
  const lastContact = lastContactDate ? new Date(lastContactDate) : now;

  const followUpDays = getFollowUpDays(targetActionConfig);
  const days = followUpDays[status] ?? 7;
  const followUp = new Date(lastContact);
  followUp.setDate(followUp.getDate() + days);
  return followUp;
}

/**
 * Get task priority based on lead score and status
 * @param {Object} lead - Lead object with score and status
 * @param {Object} targetActionConfig - Optional target action configuration
 * @returns {number} Priority level 1-4 (1 = highest)
 */
export function getTaskPriority(lead, targetActionConfig = null) {
  const targetAction = targetActionConfig || DEFAULT_TARGET_ACTION;
  const targetStatus = targetAction.statusLabel;
  const targetPriority = targetAction.priority ?? 1;

  // High priority: Hot leads, scheduled calls, overdue follow-ups
  if (lead.score >= 85) return 1;
  if (lead.status === targetStatus) return targetPriority;
  if (lead.status === 'Call Scheduled') return 1;
  if (lead.score >= 75 && ['Qualified', 'Discovery Call Done'].includes(lead.status)) return 2;
  if (lead.status === 'Deck Sent') return 3;
  if (lead.status === 'Follow Up') return 2;
  if (lead.status === 'New Lead' && lead.score >= 70) return 3;
  return 4;
}
