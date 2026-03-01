/**
 * @module utils/index
 * @description Re-exports all utility functions
 *
 * PURPOSE:
 * - Provide single import point for all utilities
 *
 * EXPORTS:
 * - scoring: calculateLeadScore
 * - csv: parseCSV, generateCSV, normalizeVertical, escapeCSVValue, CSV_HEADERS
 * - phone: detectPhoneCountry, formatPhoneForTel, formatPhoneDisplay, validatePhone, formatPhoneE164, isValidE164, parsePhone
 * - dates: calculateFollowUpDate, getTaskPriority, FOLLOW_UP_DAYS
 * - storage: saveToStorage, loadFromStorage, STORAGE_KEY
 * - transform: transformLead, toDbLead, transformApolloLead, getCompanySizeBucket, getRevenueBucket, detectVertical
 * - analytics: calculateLocalAnalytics, calculateCallMetrics, calculateConversionFunnel, calculateLeadSourceStats, calculateRepStats, DATE_RANGES, getDateRange, formatDuration, calculateTrend
 * - sequences: TRIGGER_TYPES, TRIGGER_LABELS, DEFAULT_NEW_SEQUENCE, DEFAULT_STEP_BODY, validateSequenceName, validateSequence, validateStepFields, buildSequencePayload, buildStepPayload, sortSteps, getNextStepNumber, formatStepDelay, addSequenceToList, removeSequenceFromList, toggleSequenceInList, addStepToSequence, removeStepFromSequence, updateStepInSequences
 * - scriptBuilder: getMergedVertical, hasOverride, setOverride, removeOverride, saveVerticalOverridesToStorage, loadVerticalOverridesFromStorage, VERTICAL_OVERRIDES_KEY
 */

export { calculateLeadScore } from './scoring.js';

export {
  parseCSV,
  generateCSV,
  normalizeVertical,
  escapeCSVValue,
  CSV_HEADERS
} from './csv.js';

export {
  detectPhoneCountry,
  formatPhoneForTel,
  formatPhoneDisplay,
  validatePhone,
  formatPhoneE164,
  isValidE164,
  parsePhone
} from './phone.js';

export {
  calculateFollowUpDate,
  getTaskPriority,
  FOLLOW_UP_DAYS
} from './dates.js';

export {
  saveToStorage,
  loadFromStorage,
  STORAGE_KEY
} from './storage.js';

export {
  transformLead,
  toDbLead,
  transformApolloLead,
  getCompanySizeBucket,
  getRevenueBucket,
  detectVertical
} from './transform.js';

export {
  calculateLocalAnalytics,
  calculateCallMetrics,
  calculateConversionFunnel,
  calculateLeadSourceStats,
  calculateMeetingStats,
  calculateRepStats,
  calculateCallsByDay,
  DATE_RANGES,
  getDateRange,
  formatDuration,
  calculateTrend
} from './analytics.js';

export {
  TRIGGER_TYPES,
  TRIGGER_LABELS,
  STATUS_TRIGGER_VALUES,
  MILESTONE_TRIGGER_VALUES,
  DEFAULT_NEW_SEQUENCE,
  DEFAULT_STEP_BODY,
  TEMPLATE_TOKENS,
  validateSequenceName,
  validateSequence,
  validateStepFields,
  buildSequencePayload,
  buildStepPayload,
  sortSteps,
  getNextStepNumber,
  formatStepDelay,
  addSequenceToList,
  removeSequenceFromList,
  toggleSequenceInList,
  addStepToSequence,
  removeStepFromSequence,
  updateStepInSequences
} from './sequences.js';

export {
  validateStep1,
  validateStep2,
  generateVerticalKey,
  parseAIResponse,
  buildVerticalObject,
  mergeVerticals,
  saveCustomScriptsToStorage,
  loadCustomScriptsFromStorage,
  deleteScript,
  CUSTOM_SCRIPTS_KEY,
  getMergedVertical,
  hasOverride,
  saveVerticalOverridesToStorage,
  loadVerticalOverridesFromStorage,
  setOverride,
  removeOverride,
  VERTICAL_OVERRIDES_KEY
} from './scriptBuilder.js';
