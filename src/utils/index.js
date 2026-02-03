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
 * - phone: detectPhoneCountry, formatPhoneForTel, formatPhoneDisplay, validatePhone
 * - dates: calculateFollowUpDate, getTaskPriority, FOLLOW_UP_DAYS
 * - storage: saveToStorage, loadFromStorage, STORAGE_KEY
 * - transform: transformLead, toDbLead, transformApolloLead, getCompanySizeBucket, getRevenueBucket, detectVertical
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
  validatePhone
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
