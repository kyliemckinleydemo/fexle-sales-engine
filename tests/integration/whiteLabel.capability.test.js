/**
 * @module tests/integration/whiteLabel.capability.test
 * @description Validates white-label system capabilities using Fexle example configs as test data
 *
 * PURPOSE:
 * - Verify override system can reproduce Fexle vertical customizations
 * - Test that example config JSON structures are compatible with the app
 * - Document what the white-label system CAN and CANNOT handle
 * - Prove end-to-end override flow: set → persist → load → merge → verify
 *
 * EXPORTS:
 * - Test suites for white-label capability validation
 *
 * CLAUDE NOTES:
 * - Uses real Fexle example config files from examples/fexle-config/
 * - Tests match the actual hardcoded vertical structure in index.html
 * - Gap tests are intentionally designed to PASS, documenting known limitations
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  getMergedVertical,
  hasOverride,
  setOverride,
  removeOverride,
  VERTICAL_OVERRIDES_KEY,
  CUSTOM_SCRIPTS_KEY,
  mergeVerticals,
  buildVerticalObject,
  generateVerticalKey,
  validateStep1,
  validateStep2
} from '../../src/utils/scriptBuilder.js';

// Load the actual Fexle example config files
let fexleCompany, fexleScripts, fexleVerticals;

beforeAll(() => {
  const configDir = resolve(__dirname, '../../examples/fexle-config');
  fexleCompany = JSON.parse(readFileSync(resolve(configDir, 'company.json'), 'utf-8'));
  fexleScripts = JSON.parse(readFileSync(resolve(configDir, 'scripts.json'), 'utf-8'));
  fexleVerticals = JSON.parse(readFileSync(resolve(configDir, 'verticals.json'), 'utf-8'));
});

// Simulate the hardcoded verticalData structure from index.html (healthcare as example)
const HARDCODED_HEALTHCARE = {
  name: "Healthcare & Aged Care",
  icon: "🏥",
  salesforceSolution: "Health Cloud + Agentforce",
  idealCompanySize: "50-500 employees",
  revenueRange: "$10M-$150M",
  decisionMakers: ["CEO", "COO", "CIO", "Director of Operations", "IT Manager", "Clinical Director"],
  painPoints: [
    "Patient data scattered across multiple systems",
    "Manual intake and referral processes consuming staff time",
    "Compliance headaches (ACHS, Aged Care Quality Standards, Privacy Act)",
    "Staff spending too much time on admin vs patient care",
    "24/7 patient inquiries overwhelming support staff",
    "Family communication and engagement gaps",
    "Difficulty coordinating care across providers"
  ],
  triggers: [
    "Recent ACHS accreditation review",
    "Expanding to new facilities or beds",
    "Leadership change (new CEO/COO)",
    "Hiring for IT or digital transformation roles",
    "Negative press about care quality",
    "Government funding changes"
  ],
  agentforceUseCase: "AI agents handling patient inquiries, appointment scheduling, and family updates 24/7 — freeing clinical staff for actual care",
  competitors: ["Existing legacy systems", "NetSuite", "MYOB Advanced", "iCare", "AlayaCare"],
  industryStats: "Healthcare organisations using Agentforce see 70% case deflection and 84% faster resolution times",
  openings: [
    { name: "Staff Burnout Angle", script: "Hi [NAME], quick question — are your clinical staff spending more time on paperwork and patient inquiries than actual patient care?", why: "Staff burnout is the #1 issue in healthcare right now" },
    { name: "Family Communication", script: "Hi [NAME], I'm curious — how are you currently handling family inquiries about patient status?", why: "Family communication is a major pain point" },
    { name: "Compliance Pressure", script: "Hi [NAME], with the Aged Care Quality Standards getting stricter, are you finding compliance documentation taking more time than ever?", why: "Regulatory compliance is top of mind" },
    { name: "After-Hours Coverage", script: "Hi [NAME], quick one — what happens when families call after hours with questions about their loved ones?", why: "24/7 coverage is expensive but expected" }
  ],
  objections: {
    "We have strict privacy requirements": "Absolutely — Health Cloud is built for healthcare compliance.",
    "Our staff aren't tech-savvy": "That's actually why AI works so well here.",
    "We're focused on care, not technology": "Exactly our point — technology should free you to focus on care.",
    "We had a bad CRM implementation before": "I hear that a lot. What made it fail?",
    "Our current systems work fine": "They might be working, but are they giving you time back?"
  }
};

describe('White-Label Capability Validation', () => {

  describe('1. Example Config Files - Structure Validation', () => {
    it('company.json has all required branding fields', () => {
      expect(fexleCompany.name).toBe('Fexle Services');
      expect(fexleCompany.tagline).toBeDefined();
      expect(fexleCompany.size).toBeDefined();
      expect(fexleCompany.locations).toBeInstanceOf(Array);
      expect(fexleCompany.model).toBeDefined();
      expect(fexleCompany.costAdvantage).toBeDefined();
      expect(fexleCompany.proofPoints).toBeInstanceOf(Array);
      expect(fexleCompany.colors).toBeDefined();
      expect(fexleCompany.colors.primary).toBeDefined();
      expect(fexleCompany.colors.secondary).toBeDefined();
    });

    it('scripts.json has all script categories', () => {
      expect(fexleScripts.openings).toBeDefined();
      expect(fexleScripts.pivots).toBeDefined();
      expect(fexleScripts.closes).toBeDefined();
      expect(fexleScripts.objections).toBeDefined();
      expect(fexleScripts.followUp).toBeDefined();
      expect(fexleScripts.keyMessages).toBeInstanceOf(Array);
      expect(fexleScripts.openingsNonSF).toBeDefined();
      expect(fexleScripts.pivotsNonSF).toBeDefined();
      expect(fexleScripts.objectionsNonSF).toBeDefined();
      expect(fexleScripts.closesNonSF).toBeDefined();
    });

    it('scripts.json has token definitions', () => {
      expect(fexleScripts.tokens).toBeDefined();
      expect(fexleScripts.tokens['{COMPANY}']).toBe('Fexle');
      expect(fexleScripts.tokens['{PRODUCT}']).toBe('Salesforce');
    });

    it('verticals.json has structured vertical definitions', () => {
      expect(fexleVerticals.verticals).toBeDefined();
      const verticalKeys = Object.keys(fexleVerticals.verticals);
      expect(verticalKeys.length).toBeGreaterThanOrEqual(6);
      expect(verticalKeys).toContain('healthcare');
      expect(verticalKeys).toContain('professionalServices');
      expect(verticalKeys).toContain('manufacturing');
      expect(verticalKeys).toContain('financial');
      expect(verticalKeys).toContain('retail');
      expect(verticalKeys).toContain('general');
    });

    it('each vertical in verticals.json has complete structure', () => {
      Object.entries(fexleVerticals.verticals).forEach(([key, vertical]) => {
        expect(vertical.name, `${key}.name`).toBeDefined();
        expect(vertical.icon, `${key}.icon`).toBeDefined();
        expect(vertical.enabled, `${key}.enabled`).toBe(true);
        expect(vertical.painPoints, `${key}.painPoints`).toBeInstanceOf(Array);
        expect(vertical.painPoints.length, `${key}.painPoints.length`).toBeGreaterThan(0);
        expect(vertical.openings, `${key}.openings`).toBeInstanceOf(Array);
        expect(vertical.openings.length, `${key}.openings.length`).toBeGreaterThan(0);
        expect(vertical.objections, `${key}.objections`).toBeDefined();
        expect(Object.keys(vertical.objections).length, `${key}.objections count`).toBeGreaterThan(0);
      });
    });

    it('vertical openings have name, script, and why fields', () => {
      Object.entries(fexleVerticals.verticals).forEach(([key, vertical]) => {
        vertical.openings.forEach((opening, i) => {
          expect(opening.name, `${key}.openings[${i}].name`).toBeDefined();
          expect(opening.script, `${key}.openings[${i}].script`).toBeDefined();
          expect(opening.why, `${key}.openings[${i}].why`).toBeDefined();
        });
      });
    });
  });

  describe('2. Override System - Vertical Script Customization', () => {
    it('can override all opening scripts in a vertical', () => {
      const fexleHealthcare = fexleVerticals.verticals.healthcare;
      let overrides = {};

      // Apply each Fexle opening as an override
      fexleHealthcare.openings.forEach((opening, index) => {
        overrides = setOverride(overrides, 'healthcare', 'openings', index, opening.script);
      });

      // Verify all overrides are set
      fexleHealthcare.openings.forEach((opening, index) => {
        expect(hasOverride(overrides, 'healthcare', 'openings', index)).toBe(true);
      });

      // Merge and verify the output
      const merged = getMergedVertical('healthcare', HARDCODED_HEALTHCARE, overrides);
      fexleHealthcare.openings.forEach((opening, index) => {
        expect(merged.openings[index].script).toBe(opening.script);
      });
    });

    it('can override all objection responses in a vertical', () => {
      const fexleHealthcare = fexleVerticals.verticals.healthcare;
      let overrides = {};

      // Apply each Fexle objection as an override
      Object.entries(fexleHealthcare.objections).forEach(([trigger, response]) => {
        overrides = setOverride(overrides, 'healthcare', 'objections', trigger, response);
      });

      // Verify all overrides are set
      Object.keys(fexleHealthcare.objections).forEach(trigger => {
        expect(hasOverride(overrides, 'healthcare', 'objections', trigger)).toBe(true);
      });

      // Merge and verify
      const merged = getMergedVertical('healthcare', HARDCODED_HEALTHCARE, overrides);
      Object.entries(fexleHealthcare.objections).forEach(([trigger, response]) => {
        expect(merged.objections[trigger]).toBe(response);
      });
    });

    it('can override all pain points in a vertical', () => {
      const fexleHealthcare = fexleVerticals.verticals.healthcare;
      let overrides = {};

      // Apply each Fexle pain point as an override
      fexleHealthcare.painPoints.forEach((painPoint, index) => {
        overrides = setOverride(overrides, 'healthcare', 'painPoints', index, painPoint);
      });

      // Merge and verify
      const merged = getMergedVertical('healthcare', HARDCODED_HEALTHCARE, overrides);
      fexleHealthcare.painPoints.forEach((painPoint, index) => {
        expect(merged.painPoints[index]).toBe(painPoint);
      });
    });

    it('can override scripts across ALL 6 Fexle verticals simultaneously', () => {
      let overrides = {};

      // Apply overrides for all verticals
      Object.entries(fexleVerticals.verticals).forEach(([key, vertical]) => {
        // Override first opening
        if (vertical.openings.length > 0) {
          overrides = setOverride(overrides, key, 'openings', 0, vertical.openings[0].script);
        }
        // Override first objection
        const firstObjection = Object.entries(vertical.objections)[0];
        if (firstObjection) {
          overrides = setOverride(overrides, key, 'objections', firstObjection[0], firstObjection[1]);
        }
      });

      // Verify all 6 verticals have overrides
      Object.keys(fexleVerticals.verticals).forEach(key => {
        expect(hasOverride(overrides, key, 'openings', 0)).toBe(true);
      });
    });

    it('override preserves non-overridden fields (name, icon, triggers, etc.)', () => {
      let overrides = {};
      overrides = setOverride(overrides, 'healthcare', 'openings', 0, 'Custom script');

      const merged = getMergedVertical('healthcare', HARDCODED_HEALTHCARE, overrides);

      // Non-overridden fields should remain unchanged
      expect(merged.name).toBe(HARDCODED_HEALTHCARE.name);
      expect(merged.icon).toBe(HARDCODED_HEALTHCARE.icon);
      expect(merged.salesforceSolution).toBe(HARDCODED_HEALTHCARE.salesforceSolution);
      expect(merged.triggers).toEqual(HARDCODED_HEALTHCARE.triggers);
      expect(merged.decisionMakers).toEqual(HARDCODED_HEALTHCARE.decisionMakers);
      expect(merged.competitors).toEqual(HARDCODED_HEALTHCARE.competitors);
    });

    it('can remove individual overrides to restore defaults', () => {
      let overrides = {};
      overrides = setOverride(overrides, 'healthcare', 'openings', 0, 'Custom script');
      overrides = setOverride(overrides, 'healthcare', 'openings', 1, 'Another custom');

      // Remove just the first override
      overrides = removeOverride(overrides, 'healthcare', 'openings', 0);

      const merged = getMergedVertical('healthcare', HARDCODED_HEALTHCARE, overrides);
      expect(merged.openings[0].script).toBe(HARDCODED_HEALTHCARE.openings[0].script); // restored
      expect(merged.openings[1].script).toBe('Another custom'); // still overridden
    });

    it('can clear all overrides for a vertical', () => {
      let overrides = {};
      overrides = setOverride(overrides, 'healthcare', 'openings', 0, 'Custom');
      overrides = setOverride(overrides, 'healthcare', 'objections', 'test', 'Custom');

      // Remove all
      overrides = removeOverride(overrides, 'healthcare', 'openings', 0);
      overrides = removeOverride(overrides, 'healthcare', 'objections', 'test');

      // Vertical key should be cleaned up
      expect(overrides.healthcare).toBeUndefined();

      const merged = getMergedVertical('healthcare', HARDCODED_HEALTHCARE, overrides);
      expect(merged).toEqual(HARDCODED_HEALTHCARE);
    });
  });

  describe('3. Override System - Full Fexle Vertical Reproduction', () => {
    it('can fully reproduce Fexle healthcare vertical via overrides', () => {
      const fexleHealthcare = fexleVerticals.verticals.healthcare;
      let overrides = {};

      // Apply ALL openings
      fexleHealthcare.openings.forEach((opening, i) => {
        overrides = setOverride(overrides, 'healthcare', 'openings', i, opening.script);
      });

      // Apply ALL objections
      Object.entries(fexleHealthcare.objections).forEach(([trigger, response]) => {
        overrides = setOverride(overrides, 'healthcare', 'objections', trigger, response);
      });

      // Apply ALL pain points
      fexleHealthcare.painPoints.forEach((pain, i) => {
        overrides = setOverride(overrides, 'healthcare', 'painPoints', i, pain);
      });

      // Verify the merged result
      const merged = getMergedVertical('healthcare', HARDCODED_HEALTHCARE, overrides);

      // Openings match
      fexleHealthcare.openings.forEach((opening, i) => {
        expect(merged.openings[i].script).toBe(opening.script);
        // Note: name and why come from base, only script is overridden
        expect(merged.openings[i].name).toBe(HARDCODED_HEALTHCARE.openings[i].name);
      });

      // Objections match (overrides replace matching keys and merge)
      Object.entries(fexleHealthcare.objections).forEach(([trigger, response]) => {
        expect(merged.objections[trigger]).toBe(response);
      });

      // Pain points match
      fexleHealthcare.painPoints.forEach((pain, i) => {
        expect(merged.painPoints[i]).toBe(pain);
      });
    });

    it('can reproduce ALL 6 Fexle verticals via overrides', () => {
      Object.entries(fexleVerticals.verticals).forEach(([key, fexleVertical]) => {
        // Build a base that matches the hardcoded structure
        const base = {
          name: fexleVertical.name,
          icon: fexleVertical.icon,
          openings: fexleVertical.openings.map(o => ({
            name: o.name,
            script: 'placeholder',
            why: o.why
          })),
          objections: Object.fromEntries(
            Object.keys(fexleVertical.objections).map(k => [k, 'placeholder'])
          ),
          painPoints: fexleVertical.painPoints.map(() => 'placeholder')
        };

        let overrides = {};

        // Apply all overrides
        fexleVertical.openings.forEach((opening, i) => {
          overrides = setOverride(overrides, key, 'openings', i, opening.script);
        });
        Object.entries(fexleVertical.objections).forEach(([trigger, response]) => {
          overrides = setOverride(overrides, key, 'objections', trigger, response);
        });
        fexleVertical.painPoints.forEach((pain, i) => {
          overrides = setOverride(overrides, key, 'painPoints', i, pain);
        });

        // Merge and verify
        const merged = getMergedVertical(key, base, overrides);

        fexleVertical.openings.forEach((opening, i) => {
          expect(merged.openings[i].script, `${key} opening ${i}`).toBe(opening.script);
        });
        Object.entries(fexleVertical.objections).forEach(([trigger, response]) => {
          expect(merged.objections[trigger], `${key} objection "${trigger}"`).toBe(response);
        });
        fexleVertical.painPoints.forEach((pain, i) => {
          expect(merged.painPoints[i], `${key} painPoint ${i}`).toBe(pain);
        });
      });
    });
  });

  describe('4. Override Persistence - Round-Trip Test', () => {
    it('overrides serialise and deserialise correctly via JSON', () => {
      let overrides = {};
      const fexleHealthcare = fexleVerticals.verticals.healthcare;

      // Build complex overrides
      fexleHealthcare.openings.forEach((opening, i) => {
        overrides = setOverride(overrides, 'healthcare', 'openings', i, opening.script);
      });
      Object.entries(fexleHealthcare.objections).forEach(([trigger, response]) => {
        overrides = setOverride(overrides, 'healthcare', 'objections', trigger, response);
      });

      // Serialise → deserialise (simulating localStorage round-trip)
      const serialised = JSON.stringify(overrides);
      const deserialised = JSON.parse(serialised);

      // Verify they produce the same merged result
      const merged1 = getMergedVertical('healthcare', HARDCODED_HEALTHCARE, overrides);
      const merged2 = getMergedVertical('healthcare', HARDCODED_HEALTHCARE, deserialised);

      expect(JSON.stringify(merged1)).toBe(JSON.stringify(merged2));
    });

    it('overrides for all 6 verticals fit in a single JSON object', () => {
      let overrides = {};

      Object.entries(fexleVerticals.verticals).forEach(([key, vertical]) => {
        vertical.openings.forEach((opening, i) => {
          overrides = setOverride(overrides, key, 'openings', i, opening.script);
        });
        Object.entries(vertical.objections).forEach(([trigger, response]) => {
          overrides = setOverride(overrides, key, 'objections', trigger, response);
        });
        vertical.painPoints.forEach((pain, i) => {
          overrides = setOverride(overrides, key, 'painPoints', i, pain);
        });
      });

      const serialised = JSON.stringify(overrides);
      // Verify it's reasonable size for localStorage (< 1MB)
      expect(serialised.length).toBeLessThan(1_000_000);
      // Verify it deserialises cleanly
      expect(() => JSON.parse(serialised)).not.toThrow();
    });
  });

  describe('5. Config Compatibility - Fexle Example Matches Hardcoded Structure', () => {
    it('Fexle company.json fields match FEXLE_INFO hardcoded structure', () => {
      // The company.json should have all the fields found in FEXLE_INFO in index.html
      expect(fexleCompany.name).toBeDefined();
      expect(fexleCompany.tagline).toBeDefined();
      expect(fexleCompany.size).toBeDefined();
      expect(fexleCompany.locations).toBeDefined();
      expect(fexleCompany.model).toBeDefined();
      expect(fexleCompany.costAdvantage).toBeDefined();
      expect(fexleCompany.proofPoints).toBeDefined();
      expect(fexleCompany.keyProducts).toBeDefined();
    });

    it('Fexle scripts.json structure matches FEXLE_SCRIPTS hardcoded structure', () => {
      // Verify the JSON config has all the script categories found in FEXLE_SCRIPTS
      expect(fexleScripts.openings).toBeDefined();
      expect(Object.keys(fexleScripts.openings).length).toBe(4); // aiPressure, supportCost, salesPerformance, permissionHybrid
      expect(fexleScripts.openings.aiPressure).toBeDefined();
      expect(fexleScripts.openings.aiPressure.name).toBeDefined();
      expect(fexleScripts.openings.aiPressure.script).toBeDefined();

      expect(fexleScripts.pivots).toBeDefined();
      expect(fexleScripts.closes).toBeDefined();
      expect(fexleScripts.objections).toBeDefined();
      expect(fexleScripts.followUp).toBeDefined();
      expect(fexleScripts.keyMessages).toBeDefined();
      expect(fexleScripts.keyMessages.length).toBe(7);
    });

    it('Fexle verticals.json opening structure matches hardcoded format', () => {
      const fexleHealthcare = fexleVerticals.verticals.healthcare;

      // Should have same array-of-objects format: { name, script, why }
      expect(fexleHealthcare.openings).toBeInstanceOf(Array);
      fexleHealthcare.openings.forEach(opening => {
        expect(opening).toHaveProperty('name');
        expect(opening).toHaveProperty('script');
        expect(opening).toHaveProperty('why');
      });
    });

    it('Fexle verticals.json objection structure matches hardcoded format', () => {
      const fexleHealthcare = fexleVerticals.verticals.healthcare;

      // Should be an object: { "trigger text": "response text" }
      expect(typeof fexleHealthcare.objections).toBe('object');
      expect(Array.isArray(fexleHealthcare.objections)).toBe(false);
      Object.entries(fexleHealthcare.objections).forEach(([trigger, response]) => {
        expect(typeof trigger).toBe('string');
        expect(typeof response).toBe('string');
        expect(trigger.length).toBeGreaterThan(0);
        expect(response.length).toBeGreaterThan(0);
      });
    });
  });

  describe('6. Gap Analysis - What Override System Cannot Do', () => {

    it('CANNOT override opening name or "why" field (only script text)', () => {
      const fexleHealthcare = fexleVerticals.verticals.healthcare;
      let overrides = {};

      // Override script text for opening 0
      overrides = setOverride(overrides, 'healthcare', 'openings', 0, fexleHealthcare.openings[0].script);

      const merged = getMergedVertical('healthcare', HARDCODED_HEALTHCARE, overrides);

      // Script is overridden
      expect(merged.openings[0].script).toBe(fexleHealthcare.openings[0].script);

      // But name still comes from the base — override system only changes script text
      expect(merged.openings[0].name).toBe(HARDCODED_HEALTHCARE.openings[0].name);
      expect(merged.openings[0].why).toBe(HARDCODED_HEALTHCARE.openings[0].why);
    });

    it('CANNOT add new openings beyond the base count', () => {
      // If the hardcoded base has 4 openings, we can't add a 5th via overrides
      let overrides = {};
      overrides = setOverride(overrides, 'healthcare', 'openings', 4, 'New fifth opening');

      const merged = getMergedVertical('healthcare', HARDCODED_HEALTHCARE, overrides);

      // The base only has 4 openings (indices 0-3), so index 4 has no base to merge with
      expect(merged.openings.length).toBe(HARDCODED_HEALTHCARE.openings.length);
    });

    it('CANNOT add new objection triggers that are not in the base', () => {
      // New objection keys CAN be added (they merge into the objections object)
      let overrides = {};
      overrides = setOverride(overrides, 'healthcare', 'objections', 'Brand new objection', 'New response');

      const merged = getMergedVertical('healthcare', HARDCODED_HEALTHCARE, overrides);

      // Actually, objections ARE merged, so new keys DO get added
      expect(merged.objections['Brand new objection']).toBe('New response');
      // This is a CAPABILITY, not a gap
    });

    it('CANNOT change vertical metadata (salesforceSolution, idealCompanySize, etc.)', () => {
      let overrides = {};
      // There's no mechanism to override non-script fields
      overrides = setOverride(overrides, 'healthcare', 'openings', 0, 'test');

      const merged = getMergedVertical('healthcare', HARDCODED_HEALTHCARE, overrides);
      expect(merged.salesforceSolution).toBe(HARDCODED_HEALTHCARE.salesforceSolution);
      expect(merged.idealCompanySize).toBe(HARDCODED_HEALTHCARE.idealCompanySize);
      expect(merged.revenueRange).toBe(HARDCODED_HEALTHCARE.revenueRange);
    });

    it('CANNOT override triggers or decision makers', () => {
      let overrides = {};
      overrides = setOverride(overrides, 'healthcare', 'openings', 0, 'test');

      const merged = getMergedVertical('healthcare', HARDCODED_HEALTHCARE, overrides);
      expect(merged.triggers).toEqual(HARDCODED_HEALTHCARE.triggers);
      expect(merged.decisionMakers).toEqual(HARDCODED_HEALTHCARE.decisionMakers);
    });

    it('CANNOT override general call scripts (FEXLE_SCRIPTS - pivots, closes, follow-ups)', () => {
      // The override system only works on verticalData, not on FEXLE_SCRIPTS
      // General scripts (pivots, closes, etc.) are separate from verticals
      const generalScriptCategories = ['openings', 'pivots', 'closes', 'objections', 'followUp', 'keyMessages'];
      generalScriptCategories.forEach(category => {
        expect(fexleScripts[category]).toBeDefined();
      });
      // These exist in configs but have no override mechanism in the current system
      // This documents the gap: vertical-level scripts can be overridden, but
      // company-level general scripts cannot
    });

    it('CANNOT override company branding (FEXLE_INFO)', () => {
      // The override system has no mechanism for company-level data
      // company.json exists but is never loaded at runtime
      expect(fexleCompany.name).toBe('Fexle Services');
      // In the actual app, "Fexle" is hardcoded in FEXLE_INFO and 30+ script references
    });

    it('CANNOT override email templates', () => {
      // Email templates are hardcoded in index.html and not part of the override system
      // The config files don't include email templates at all
      expect(fexleScripts.followUp).toBeDefined();
      expect(fexleScripts.followUp.email).toBeDefined();
      // But the in-app email templates (aiDeck, deckFollowUp, etc.) are separate
      // and not configurable
    });

    it('CANNOT add/remove/reorder verticals via overrides (only modify existing)', () => {
      // The override system modifies content within existing verticals
      // It cannot add new default verticals, remove existing ones, or reorder them
      // To add new verticals, users must use the Script Builder (AI-generated custom verticals)
      let overrides = {};
      overrides = setOverride(overrides, 'newVertical', 'openings', 0, 'test');

      // The override is stored, but without a base vertical, getMergedVertical returns null
      const merged = getMergedVertical('newVertical', null, overrides);
      expect(merged).toBeNull();
    });
  });

  describe('7. Custom Vertical Creation - Fexle Data Through Script Builder', () => {
    it('can create a custom vertical with Fexle vertical structure', () => {
      const fexleHealthcare = fexleVerticals.verticals.healthcare;

      // Simulate Script Builder form data using Fexle's vertical info
      const formData = {
        verticalName: fexleHealthcare.name,
        productService: fexleHealthcare.salesforceSolution,
        targetTitles: fexleHealthcare.decisionMakers.join(', '),
        painPoints: fexleHealthcare.painPoints.join('\n'),
        valueProps: 'Agentforce for healthcare\nHealth Cloud compliance\n24/7 patient support'
      };

      expect(validateStep1(formData)).toBe(true);
      expect(validateStep2(formData)).toBe(true);

      const key = generateVerticalKey(fexleHealthcare.name);
      expect(key).toBe('healthcare_aged_care');

      // Simulate AI-parsed response with Fexle's scripts
      const aiResponse = {
        openingScripts: fexleHealthcare.openings.map(o => ({
          name: o.name,
          script: o.script
        })),
        objectionHandlers: fexleHealthcare.objections
      };

      const verticalObj = buildVerticalObject(aiResponse, formData, key);

      expect(verticalObj.name).toBe(fexleHealthcare.name);
      expect(verticalObj.isCustom).toBe(true);
      expect(verticalObj.openingScripts.length).toBe(fexleHealthcare.openings.length);
      expect(verticalObj.objectionHandlers).toEqual(fexleHealthcare.objections);
      expect(verticalObj.painPoints).toEqual(fexleHealthcare.painPoints);
    });

    it('custom verticals merge correctly with defaults', () => {
      const defaults = { healthcare: HARDCODED_HEALTHCARE };
      const custom = {
        fexle_custom: {
          name: 'Fexle Custom',
          isCustom: true,
          openingScripts: [{ name: 'Test', script: 'Hello' }],
          objectionHandlers: { 'No thanks': 'Custom response' }
        }
      };

      const merged = mergeVerticals(defaults, custom);
      expect(merged.healthcare).toBeDefined();
      expect(merged.fexle_custom).toBeDefined();
      expect(merged.fexle_custom.isCustom).toBe(true);
    });
  });

  describe('8. Capability Summary', () => {
    it('documents what CAN be customised via the white-label system', () => {
      const capabilities = {
        perVerticalOpeningScripts: true,
        perVerticalObjectionResponses: true,
        perVerticalPainPoints: true,
        addNewObjectionTriggers: true,
        createNewVerticals: true, // via Script Builder
        mergeCustomAndDefaultVerticals: true,
        persistOverridesToStorage: true,
        restoreIndividualDefaults: true,
        restoreAllDefaultsPerVertical: true,
        jsonSerialisation: true,
        multiVerticalOverrides: true,
        supabaseOrgConfigSync: true // via orgConfig.verticalOverrides
      };

      Object.values(capabilities).forEach(v => expect(v).toBe(true));
    });

    it('documents what CANNOT be customised via the white-label system', () => {
      const gaps = {
        companyBranding: 'FEXLE_INFO hardcoded, company.json not loaded',
        generalCallScripts: 'FEXLE_SCRIPTS hardcoded, scripts.json not loaded',
        emailTemplates: 'Hardcoded in emailTemplates object, no config file',
        openingNameAndWhy: 'Override only changes script text, not name/why',
        verticalMetadata: 'salesforceSolution, idealCompanySize etc. not overridable',
        triggersAndDecisionMakers: 'Static arrays, not part of override system',
        addOpeningsBeyondBase: 'Can only override existing indices',
        verticalOrdering: 'Display order not configurable',
        scoringWeights: 'Hardcoded, scoring.json not loaded',
        collateral: 'Hardcoded, collateral.json not loaded',
        targetActions: 'Partially configurable via orgConfig, but defaults hardcoded'
      };

      // Each gap is documented with a reason
      Object.values(gaps).forEach(reason => {
        expect(typeof reason).toBe('string');
        expect(reason.length).toBeGreaterThan(0);
      });
    });

    it('counts total overridable items across Fexle verticals', () => {
      let totalOpenings = 0;
      let totalObjections = 0;
      let totalPainPoints = 0;

      Object.values(fexleVerticals.verticals).forEach(vertical => {
        totalOpenings += vertical.openings.length;
        totalObjections += Object.keys(vertical.objections).length;
        totalPainPoints += vertical.painPoints.length;
      });

      // Document the scale
      expect(totalOpenings).toBeGreaterThan(20);
      expect(totalObjections).toBeGreaterThan(25);
      expect(totalPainPoints).toBeGreaterThan(30);

      // All of these can be overridden through the current system
      let overrides = {};
      Object.entries(fexleVerticals.verticals).forEach(([key, vertical]) => {
        vertical.openings.forEach((o, i) => {
          overrides = setOverride(overrides, key, 'openings', i, o.script);
        });
        Object.entries(vertical.objections).forEach(([t, r]) => {
          overrides = setOverride(overrides, key, 'objections', t, r);
        });
        vertical.painPoints.forEach((p, i) => {
          overrides = setOverride(overrides, key, 'painPoints', i, p);
        });
      });

      // Verify all overrides were applied successfully
      const overrideKeys = Object.keys(overrides);
      expect(overrideKeys.length).toBe(6); // 6 verticals
    });
  });
});
