/**
 * @module constants/index
 * @description Re-exports all constants for convenient importing
 *
 * PURPOSE:
 * - Provide single import point for all constants
 *
 * EXPORTS:
 * - SCORING_WEIGHTS, DEFAULT_SCORES - from scoring-weights.js
 * - PHONE_FORMATS, CANADA_AREA_CODES - from phone-formats.js
 */

export { SCORING_WEIGHTS, DEFAULT_SCORES } from './scoring-weights.js';
export { PHONE_FORMATS, CANADA_AREA_CODES } from './phone-formats.js';
