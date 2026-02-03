/**
 * @module utils/scoring
 * @description Lead scoring calculation based on ICP fit
 *
 * PURPOSE:
 * - Calculate lead scores (0-100) based on company attributes
 * - Provide score breakdown by component
 * - Support intent signal scoring with caps
 *
 * DEPENDENCIES:
 * - ../constants/scoring-weights.js - SCORING_WEIGHTS, DEFAULT_SCORES
 *
 * EXPORTS:
 * - calculateLeadScore - Main scoring function
 *
 * PATTERNS:
 * - Returns { score, breakdown } object
 * - Score is normalized to 0-100 range
 * - Title matching uses partial string matching (case-insensitive)
 *
 * CLAUDE NOTES:
 * - Intent signals are capped at 20 points total
 * - Title detection checks for keywords (ceo, coo, cio, etc.)
 * - Unknown values use DEFAULT_SCORES
 */

import { SCORING_WEIGHTS, DEFAULT_SCORES } from '../constants/scoring-weights.js';

/**
 * Calculate lead score based on company attributes, title, intent, and vertical
 * @param {Object} lead - Lead object with companySize, revenue, title, intentSignals, vertical
 * @returns {{ score: number, breakdown: Object }} Score (0-100) and component breakdown
 */
export function calculateLeadScore(lead) {
  let score = 0;
  const breakdown = {};

  // Company Size Score
  const sizeScore = SCORING_WEIGHTS.companySize[lead.companySize] || DEFAULT_SCORES.companySize;
  score += sizeScore;
  breakdown.companySize = sizeScore;

  // Revenue Score
  const revenueScore = SCORING_WEIGHTS.revenue[lead.revenue] || DEFAULT_SCORES.revenue;
  score += revenueScore;
  breakdown.revenue = revenueScore;

  // Title Score
  let titleScore = DEFAULT_SCORES.title;
  const titleLower = (lead.title || '').toLowerCase();

  // Check for more specific titles FIRST, then broader matches
  // Use word boundaries or specific patterns to avoid false positives
  if (titleLower.includes('ceo') || titleLower.includes('chief executive') || titleLower.includes('managing director') || titleLower.includes('founder')) {
    titleScore = 25;
  } else if (titleLower.includes('cfo')) {
    titleScore = 20;
  } else if (titleLower.includes('vp') || titleLower.includes('vice president')) {
    titleScore = 18;
  } else if (titleLower.includes('director') || titleLower.includes('head of')) {
    // Check director BEFORE COO/CIO/CTO since "Director of Operations" contains "coo"
    titleScore = 15;
  } else if (/\bcoo\b/.test(titleLower) || /\bcio\b/.test(titleLower) || /\bcto\b/.test(titleLower)) {
    // Use word boundary regex for C-suite to avoid matching "director of Operations"
    titleScore = 22;
  } else if (titleLower.includes('manager')) {
    titleScore = 10;
  }

  score += titleScore;
  breakdown.title = titleScore;

  // Intent Signals Score
  let intentScore = 0;
  if (lead.intentSignals) {
    if (lead.intentSignals.hiringSalesforce) intentScore += SCORING_WEIGHTS.intentSignals.hiringSalesforce;
    if (lead.intentSignals.researchingCRM) intentScore += SCORING_WEIGHTS.intentSignals.researchingCRM;
    if (lead.intentSignals.recentFunding) intentScore += SCORING_WEIGHTS.intentSignals.recentFunding;
    if (lead.intentSignals.newExecutive) intentScore += SCORING_WEIGHTS.intentSignals.newExecutive;
    if (lead.intentSignals.expansion) intentScore += SCORING_WEIGHTS.intentSignals.expansion;
    if (lead.intentSignals.techStackMatch) intentScore += SCORING_WEIGHTS.intentSignals.techStackMatch;
  }
  // Cap intent signals at 20
  const cappedIntentScore = Math.min(intentScore, 20);
  score += cappedIntentScore;
  breakdown.intent = cappedIntentScore;

  // Vertical Fit Score
  const verticalScore = SCORING_WEIGHTS.verticalFit[lead.vertical] || DEFAULT_SCORES.vertical;
  score += verticalScore;
  breakdown.vertical = verticalScore;

  // Normalize to 0-100
  const normalizedScore = Math.min(Math.round((score / 100) * 100), 100);

  return { score: normalizedScore, breakdown };
}
