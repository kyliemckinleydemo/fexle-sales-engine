/**
 * @module constants/scoring-weights
 * @description Lead scoring weight configuration for ICP matching
 *
 * PURPOSE:
 * - Define scoring weights for company attributes (size, revenue)
 * - Define scoring weights for title/role hierarchy
 * - Define scoring weights for intent signals
 * - Define scoring weights for vertical fit
 *
 * EXPORTS:
 * - SCORING_WEIGHTS - Complete scoring configuration object
 *
 * PATTERNS:
 * - Scores are additive, max theoretical score is ~100
 * - Intent signals are capped at 20 points
 * - "Sweet spot" targets are highest-scoring (201-500 employees, $50M-$200M revenue)
 *
 * CLAUDE NOTES:
 * - Weights are calibrated for Australian mid-market
 * - Revenue brackets are in AUD
 * - Title matching in calculateLeadScore uses partial string matching
 */

export const SCORING_WEIGHTS = {
  // Company Attributes (max 40 points)
  companySize: {
    '1-50': 5,
    '51-200': 15,
    '201-500': 20,  // Sweet spot for Fexle
    '501-1000': 15,
    '1000+': 10
  },
  revenue: {
    'Under $5M': 5,
    '$5M-$20M': 10,
    '$20M-$50M': 15,
    '$50M-$200M': 20,  // Sweet spot
    '$200M+': 15
  },
  // Role/Title (max 25 points)
  titleScore: {
    'CEO': 25, 'Managing Director': 25, 'Founder': 25,
    'COO': 22, 'CIO': 22, 'CTO': 22, 'CFO': 20,
    'VP': 18, 'Director': 15, 'Head of': 15,
    'Manager': 10, 'Other': 5
  },
  // Intent Signals (max 20 points)
  intentSignals: {
    hiringSalesforce: 10,
    researchingCRM: 8,
    recentFunding: 7,
    newExecutive: 5,
    expansion: 5,
    techStackMatch: 5
  },
  // Vertical Fit (max 15 points)
  verticalFit: {
    healthcare: 15,
    financial: 15,
    manufacturing: 12,
    professionalServices: 12,
    retail: 10,
    education: 10,
    nonprofit: 8,
    government: 8,
    realestate: 10,
    logistics: 10,
    hospitality: 8
  }
};

// Default scores for unknown values
export const DEFAULT_SCORES = {
  companySize: 10,
  revenue: 10,
  title: 5,
  vertical: 8
};
