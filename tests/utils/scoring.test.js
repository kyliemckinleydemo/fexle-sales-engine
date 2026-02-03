/**
 * @module tests/utils/scoring.test
 * @description Tests for lead scoring calculation
 */

import { describe, it, expect } from 'vitest';
import { calculateLeadScore } from '../../src/utils/scoring.js';
import { SCORING_WEIGHTS } from '../../src/constants/scoring-weights.js';

describe('calculateLeadScore', () => {
  describe('Company Size Scoring', () => {
    it('scores 1-50 employees at 5 points', () => {
      const lead = { companySize: '1-50', vertical: 'general' };
      const { breakdown } = calculateLeadScore(lead);
      expect(breakdown.companySize).toBe(5);
    });

    it('scores 51-200 employees at 15 points', () => {
      const lead = { companySize: '51-200', vertical: 'general' };
      const { breakdown } = calculateLeadScore(lead);
      expect(breakdown.companySize).toBe(15);
    });

    it('scores 201-500 employees at 20 points (sweet spot)', () => {
      const lead = { companySize: '201-500', vertical: 'general' };
      const { breakdown } = calculateLeadScore(lead);
      expect(breakdown.companySize).toBe(20);
    });

    it('scores 501-1000 employees at 15 points', () => {
      const lead = { companySize: '501-1000', vertical: 'general' };
      const { breakdown } = calculateLeadScore(lead);
      expect(breakdown.companySize).toBe(15);
    });

    it('scores 1000+ employees at 10 points', () => {
      const lead = { companySize: '1000+', vertical: 'general' };
      const { breakdown } = calculateLeadScore(lead);
      expect(breakdown.companySize).toBe(10);
    });

    it('uses default score for unknown company size', () => {
      const lead = { companySize: 'Unknown', vertical: 'general' };
      const { breakdown } = calculateLeadScore(lead);
      expect(breakdown.companySize).toBe(10);
    });
  });

  describe('Revenue Scoring', () => {
    it('scores Under $5M at 5 points', () => {
      const lead = { revenue: 'Under $5M', vertical: 'general' };
      const { breakdown } = calculateLeadScore(lead);
      expect(breakdown.revenue).toBe(5);
    });

    it('scores $5M-$20M at 10 points', () => {
      const lead = { revenue: '$5M-$20M', vertical: 'general' };
      const { breakdown } = calculateLeadScore(lead);
      expect(breakdown.revenue).toBe(10);
    });

    it('scores $20M-$50M at 15 points', () => {
      const lead = { revenue: '$20M-$50M', vertical: 'general' };
      const { breakdown } = calculateLeadScore(lead);
      expect(breakdown.revenue).toBe(15);
    });

    it('scores $50M-$200M at 20 points (sweet spot)', () => {
      const lead = { revenue: '$50M-$200M', vertical: 'general' };
      const { breakdown } = calculateLeadScore(lead);
      expect(breakdown.revenue).toBe(20);
    });

    it('scores $200M+ at 15 points', () => {
      const lead = { revenue: '$200M+', vertical: 'general' };
      const { breakdown } = calculateLeadScore(lead);
      expect(breakdown.revenue).toBe(15);
    });

    it('uses default score for unknown revenue', () => {
      const lead = { revenue: 'Unknown', vertical: 'general' };
      const { breakdown } = calculateLeadScore(lead);
      expect(breakdown.revenue).toBe(10);
    });
  });

  describe('Title Scoring', () => {
    it('scores CEO at 25 points', () => {
      const lead = { title: 'CEO', vertical: 'general' };
      const { breakdown } = calculateLeadScore(lead);
      expect(breakdown.title).toBe(25);
    });

    it('scores Chief Executive Officer at 25 points', () => {
      const lead = { title: 'Chief Executive Officer', vertical: 'general' };
      const { breakdown } = calculateLeadScore(lead);
      expect(breakdown.title).toBe(25);
    });

    it('scores Managing Director at 25 points', () => {
      const lead = { title: 'Managing Director', vertical: 'general' };
      const { breakdown } = calculateLeadScore(lead);
      expect(breakdown.title).toBe(25);
    });

    it('scores Founder at 25 points', () => {
      const lead = { title: 'Co-Founder & CEO', vertical: 'general' };
      const { breakdown } = calculateLeadScore(lead);
      expect(breakdown.title).toBe(25);
    });

    it('scores standalone COO at 22 points', () => {
      const lead = { title: 'COO', vertical: 'general' };
      const { breakdown } = calculateLeadScore(lead);
      expect(breakdown.title).toBe(22);
    });

    it('scores Chief Operating Officer at 22 points', () => {
      const lead = { title: 'COO - Chief Operating Officer', vertical: 'general' };
      const { breakdown } = calculateLeadScore(lead);
      expect(breakdown.title).toBe(22);
    });

    it('scores CIO at 22 points', () => {
      const lead = { title: 'CIO', vertical: 'general' };
      const { breakdown } = calculateLeadScore(lead);
      expect(breakdown.title).toBe(22);
    });

    it('scores CTO at 22 points', () => {
      const lead = { title: 'CTO', vertical: 'general' };
      const { breakdown } = calculateLeadScore(lead);
      expect(breakdown.title).toBe(22);
    });

    it('scores CFO at 20 points', () => {
      const lead = { title: 'CFO', vertical: 'general' };
      const { breakdown } = calculateLeadScore(lead);
      expect(breakdown.title).toBe(20);
    });

    it('scores VP at 18 points', () => {
      const lead = { title: 'VP of Sales', vertical: 'general' };
      const { breakdown } = calculateLeadScore(lead);
      expect(breakdown.title).toBe(18);
    });

    it('scores Vice President at 18 points', () => {
      const lead = { title: 'Vice President of Marketing', vertical: 'general' };
      const { breakdown } = calculateLeadScore(lead);
      expect(breakdown.title).toBe(18);
    });

    it('scores Director at 15 points', () => {
      const lead = { title: 'Director of Operations', vertical: 'general' };
      const { breakdown } = calculateLeadScore(lead);
      expect(breakdown.title).toBe(15);
    });

    it('scores Head of at 15 points', () => {
      const lead = { title: 'Head of Engineering', vertical: 'general' };
      const { breakdown } = calculateLeadScore(lead);
      expect(breakdown.title).toBe(15);
    });

    it('scores Manager at 10 points', () => {
      const lead = { title: 'Sales Manager', vertical: 'general' };
      const { breakdown } = calculateLeadScore(lead);
      expect(breakdown.title).toBe(10);
    });

    it('uses default score for unknown title', () => {
      const lead = { title: 'Analyst', vertical: 'general' };
      const { breakdown } = calculateLeadScore(lead);
      expect(breakdown.title).toBe(5);
    });

    it('handles null title', () => {
      const lead = { title: null, vertical: 'general' };
      const { breakdown } = calculateLeadScore(lead);
      expect(breakdown.title).toBe(5);
    });

    it('handles undefined title', () => {
      const lead = { vertical: 'general' };
      const { breakdown } = calculateLeadScore(lead);
      expect(breakdown.title).toBe(5);
    });
  });

  describe('Intent Signals Scoring', () => {
    it('scores hiringSalesforce at 10 points', () => {
      const lead = { intentSignals: { hiringSalesforce: true }, vertical: 'general' };
      const { breakdown } = calculateLeadScore(lead);
      expect(breakdown.intent).toBe(10);
    });

    it('scores researchingCRM at 8 points', () => {
      const lead = { intentSignals: { researchingCRM: true }, vertical: 'general' };
      const { breakdown } = calculateLeadScore(lead);
      expect(breakdown.intent).toBe(8);
    });

    it('scores recentFunding at 7 points', () => {
      const lead = { intentSignals: { recentFunding: true }, vertical: 'general' };
      const { breakdown } = calculateLeadScore(lead);
      expect(breakdown.intent).toBe(7);
    });

    it('scores newExecutive at 5 points', () => {
      const lead = { intentSignals: { newExecutive: true }, vertical: 'general' };
      const { breakdown } = calculateLeadScore(lead);
      expect(breakdown.intent).toBe(5);
    });

    it('scores expansion at 5 points', () => {
      const lead = { intentSignals: { expansion: true }, vertical: 'general' };
      const { breakdown } = calculateLeadScore(lead);
      expect(breakdown.intent).toBe(5);
    });

    it('scores techStackMatch at 5 points', () => {
      const lead = { intentSignals: { techStackMatch: true }, vertical: 'general' };
      const { breakdown } = calculateLeadScore(lead);
      expect(breakdown.intent).toBe(5);
    });

    it('adds multiple intent signals', () => {
      const lead = {
        intentSignals: {
          hiringSalesforce: true, // 10
          researchingCRM: true    // 8
        },
        vertical: 'general'
      };
      const { breakdown } = calculateLeadScore(lead);
      expect(breakdown.intent).toBe(18);
    });

    it('caps intent signals at 20 points', () => {
      const lead = {
        intentSignals: {
          hiringSalesforce: true, // 10
          researchingCRM: true,   // 8
          recentFunding: true,    // 7
          newExecutive: true,     // 5
          expansion: true,        // 5
          techStackMatch: true    // 5 = 40 total, capped at 20
        },
        vertical: 'general'
      };
      const { breakdown } = calculateLeadScore(lead);
      expect(breakdown.intent).toBe(20);
    });

    it('handles null intentSignals', () => {
      const lead = { intentSignals: null, vertical: 'general' };
      const { breakdown } = calculateLeadScore(lead);
      expect(breakdown.intent).toBe(0);
    });

    it('handles undefined intentSignals', () => {
      const lead = { vertical: 'general' };
      const { breakdown } = calculateLeadScore(lead);
      expect(breakdown.intent).toBe(0);
    });
  });

  describe('Vertical Fit Scoring', () => {
    it('scores healthcare at 15 points', () => {
      const lead = { vertical: 'healthcare' };
      const { breakdown } = calculateLeadScore(lead);
      expect(breakdown.vertical).toBe(15);
    });

    it('scores financial at 15 points', () => {
      const lead = { vertical: 'financial' };
      const { breakdown } = calculateLeadScore(lead);
      expect(breakdown.vertical).toBe(15);
    });

    it('scores manufacturing at 12 points', () => {
      const lead = { vertical: 'manufacturing' };
      const { breakdown } = calculateLeadScore(lead);
      expect(breakdown.vertical).toBe(12);
    });

    it('scores professionalServices at 12 points', () => {
      const lead = { vertical: 'professionalServices' };
      const { breakdown } = calculateLeadScore(lead);
      expect(breakdown.vertical).toBe(12);
    });

    it('scores retail at 10 points', () => {
      const lead = { vertical: 'retail' };
      const { breakdown } = calculateLeadScore(lead);
      expect(breakdown.vertical).toBe(10);
    });

    it('scores education at 10 points', () => {
      const lead = { vertical: 'education' };
      const { breakdown } = calculateLeadScore(lead);
      expect(breakdown.vertical).toBe(10);
    });

    it('scores nonprofit at 8 points', () => {
      const lead = { vertical: 'nonprofit' };
      const { breakdown } = calculateLeadScore(lead);
      expect(breakdown.vertical).toBe(8);
    });

    it('scores government at 8 points', () => {
      const lead = { vertical: 'government' };
      const { breakdown } = calculateLeadScore(lead);
      expect(breakdown.vertical).toBe(8);
    });

    it('uses default score for unknown vertical', () => {
      const lead = { vertical: 'tech' };
      const { breakdown } = calculateLeadScore(lead);
      expect(breakdown.vertical).toBe(8);
    });

    it('uses default score for general vertical', () => {
      const lead = { vertical: 'general' };
      const { breakdown } = calculateLeadScore(lead);
      expect(breakdown.vertical).toBe(8);
    });
  });

  describe('Complete Score Scenarios', () => {
    it('calculates hot lead score (80+)', () => {
      const lead = {
        companySize: '201-500',     // 20
        revenue: '$50M-$200M',       // 20
        title: 'CEO',                // 25
        intentSignals: {
          hiringSalesforce: true,    // 10
          researchingCRM: true       // 8 (capped contribution)
        },
        vertical: 'healthcare'       // 15
      };
      const { score, breakdown } = calculateLeadScore(lead);
      // 20 + 20 + 25 + 18 + 15 = 98
      expect(score).toBeGreaterThanOrEqual(80);
      expect(breakdown.companySize).toBe(20);
      expect(breakdown.revenue).toBe(20);
      expect(breakdown.title).toBe(25);
      expect(breakdown.intent).toBe(18);
      expect(breakdown.vertical).toBe(15);
    });

    it('calculates cold lead score (<40)', () => {
      const lead = {
        companySize: '1-50',         // 5
        revenue: 'Under $5M',        // 5
        title: 'Analyst',            // 5
        vertical: 'general'          // 8
      };
      const { score } = calculateLeadScore(lead);
      // 5 + 5 + 5 + 0 + 8 = 23
      expect(score).toBeLessThan(40);
    });

    it('caps score at 100', () => {
      const lead = {
        companySize: '201-500',      // 20
        revenue: '$50M-$200M',       // 20
        title: 'CEO',                // 25
        intentSignals: {
          hiringSalesforce: true,
          researchingCRM: true,
          recentFunding: true,
          newExecutive: true,
          expansion: true,
          techStackMatch: true       // 20 (capped)
        },
        vertical: 'healthcare'       // 15
      };
      const { score } = calculateLeadScore(lead);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('handles empty lead object', () => {
      const lead = {};
      const { score, breakdown } = calculateLeadScore(lead);
      // All defaults: 10 + 10 + 5 + 0 + 8 = 33
      expect(score).toBe(33);
      expect(breakdown.companySize).toBe(10);
      expect(breakdown.revenue).toBe(10);
      expect(breakdown.title).toBe(5);
      expect(breakdown.intent).toBe(0);
      expect(breakdown.vertical).toBe(8);
    });
  });
});
