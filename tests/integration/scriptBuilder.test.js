/**
 * @module tests/integration/scriptBuilder.test
 * @description Integration tests for AI Script Builder complete workflows
 *
 * PURPOSE:
 * - Test complete create workflow (validation → generation → save → load)
 * - Test edit workflow (load → modify → save → verify)
 * - Test delete workflow (create → delete → verify)
 * - Test error recovery and edge cases
 *
 * EXPORTS:
 * - Integration test suites (~10 tests)
 *
 * CLAUDE NOTES:
 * - Tests complete user workflows end-to-end
 * - Uses jsdom localStorage (provided by vitest)
 * - Simulates AI responses for parsing tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateStep1,
  validateStep2,
  generateVerticalKey,
  parseAIResponse,
  buildVerticalObject,
  mergeVerticals,
  saveCustomScriptsToStorage,
  loadCustomScriptsFromStorage,
  deleteScript,
  CUSTOM_SCRIPTS_KEY
} from '../../src/utils/scriptBuilder.js';

describe('Script Builder Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Create Workflow', () => {
    it('completes full create workflow: validation → generation → save → load → merge', () => {
      // Step 1: Validate step 1 form data
      const step1Data = {
        verticalName: 'Healthcare Technology',
        productService: 'AI-powered CRM platform',
        targetTitles: 'CEO, CTO, Head of IT'
      };
      expect(validateStep1(step1Data)).toBe(true);

      // Step 2: Validate step 2 form data
      const step2Data = {
        painPoints: 'Manual patient data entry\nLack of integration\nCompliance challenges',
        valueProps: 'Automated workflows\nSeamless EHR integration\nHIPAA compliant'
      };
      expect(validateStep2(step2Data)).toBe(true);

      // Step 3: Generate vertical key
      const verticalKey = generateVerticalKey(step1Data.verticalName);
      expect(verticalKey).toBe('healthcare_technology');

      // Step 4: Simulate AI response and parse
      const aiResponse = `Here is your sales playbook:
\`\`\`json
{
  "openingScripts": [
    {"name": "Direct Approach", "script": "Hi [PROSPECT_NAME], this is [YOUR_NAME] from HealthTech..."}
  ],
  "discoveryQuestions": [
    "What challenges are you facing with patient data management?",
    "How much time does your team spend on manual data entry?"
  ],
  "valueStatements": [
    "We help healthcare organizations reduce data entry time by 80%"
  ],
  "objectionHandlers": {
    "We're not interested": "I understand. Many of our best clients felt the same way initially...",
    "Send me an email": "Happy to do that. What specific aspects would you like me to cover?"
  },
  "closingScripts": [
    {"name": "Assumptive Close", "script": "Great, let's get a quick 15-minute call on the calendar..."}
  ],
  "voicemailScript": "Hi [PROSPECT_NAME], this is [YOUR_NAME] calling about...",
  "followUpScript": "I'm following up on my previous message...",
  "postDeckFollowUp": "I wanted to follow up on the materials I sent..."
}
\`\`\``;

      const parsed = parseAIResponse(aiResponse);
      expect(parsed).not.toBeNull();
      expect(parsed.openingScripts).toHaveLength(1);

      // Step 5: Build complete vertical object
      const formData = {
        ...step1Data,
        ...step2Data,
        verticalIcon: '🏥',
        companyName: 'HealthTech Solutions',
        desiredOutcome: 'Demo'
      };
      const vertical = buildVerticalObject(parsed, formData, verticalKey);

      expect(vertical.name).toBe('Healthcare Technology');
      expect(vertical.isCustom).toBe(true);
      expect(vertical.targetTitles).toEqual(['CEO', 'CTO', 'Head of IT']);
      expect(vertical.painPoints).toEqual([
        'Manual patient data entry',
        'Lack of integration',
        'Compliance challenges'
      ]);

      // Step 6: Save to localStorage
      const scripts = { [verticalKey]: vertical };
      const saveResult = saveCustomScriptsToStorage(scripts);
      expect(saveResult).toBe(true);

      // Step 7: Load from localStorage
      const loaded = loadCustomScriptsFromStorage();
      expect(loaded[verticalKey]).toBeDefined();
      expect(loaded[verticalKey].name).toBe('Healthcare Technology');

      // Step 8: Merge with defaults
      const defaults = {
        financial_services: { name: 'Financial Services', isCustom: false }
      };
      const merged = mergeVerticals(defaults, loaded);
      expect(merged.financial_services).toBeDefined();
      expect(merged.healthcare_technology).toBeDefined();
      expect(merged.healthcare_technology.isCustom).toBe(true);
    });
  });

  describe('Edit Workflow', () => {
    it('completes full edit workflow: load existing → modify → save → verify', () => {
      // Setup: Create initial script
      const initialScript = {
        healthcare: {
          name: 'Healthcare',
          icon: '🏥',
          isCustom: true,
          productService: 'Old Product',
          targetTitles: ['CEO'],
          painPoints: ['Old pain point'],
          valueProps: ['Old value prop'],
          openingScripts: [{ name: 'Old', script: 'Old script...' }],
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z'
        }
      };
      saveCustomScriptsToStorage(initialScript);

      // Load existing
      const loaded = loadCustomScriptsFromStorage();
      expect(loaded.healthcare.productService).toBe('Old Product');

      // Modify
      const modified = {
        ...loaded.healthcare,
        productService: 'Updated Product',
        targetTitles: ['CEO', 'CTO', 'CFO'],
        openingScripts: [
          { name: 'Old', script: 'Old script...' },
          { name: 'New', script: 'New script...' }
        ],
        updatedAt: new Date().toISOString()
      };

      // Save updated
      const updatedScripts = { ...loaded, healthcare: modified };
      saveCustomScriptsToStorage(updatedScripts);

      // Verify changes
      const reloaded = loadCustomScriptsFromStorage();
      expect(reloaded.healthcare.productService).toBe('Updated Product');
      expect(reloaded.healthcare.targetTitles).toHaveLength(3);
      expect(reloaded.healthcare.openingScripts).toHaveLength(2);
      expect(reloaded.healthcare.createdAt).toBe('2025-01-01T00:00:00.000Z');
      expect(reloaded.healthcare.updatedAt).not.toBe('2025-01-01T00:00:00.000Z');
    });
  });

  describe('Delete Workflow', () => {
    it('completes full delete workflow: create multiple → delete one → verify remaining', () => {
      // Create multiple scripts
      const scripts = {
        healthcare: { name: 'Healthcare', isCustom: true },
        fintech: { name: 'Fintech', isCustom: true },
        retail: { name: 'Retail', isCustom: true }
      };
      saveCustomScriptsToStorage(scripts);

      // Verify all exist
      let loaded = loadCustomScriptsFromStorage();
      expect(Object.keys(loaded)).toHaveLength(3);

      // Delete one
      const afterDelete = deleteScript(loaded, 'fintech');
      saveCustomScriptsToStorage(afterDelete);

      // Verify remaining
      loaded = loadCustomScriptsFromStorage();
      expect(Object.keys(loaded)).toHaveLength(2);
      expect(loaded.healthcare).toBeDefined();
      expect(loaded.fintech).toBeUndefined();
      expect(loaded.retail).toBeDefined();
    });
  });

  describe('Empty localStorage', () => {
    it('handles empty localStorage → merge with defaults → verify', () => {
      // Load from empty storage
      const loaded = loadCustomScriptsFromStorage();
      expect(loaded).toEqual({});

      // Merge with defaults
      const defaults = {
        healthcare: { name: 'Healthcare', isCustom: false },
        financial: { name: 'Financial Services', isCustom: false }
      };
      const merged = mergeVerticals(defaults, loaded);

      // Verify defaults are present
      expect(Object.keys(merged)).toHaveLength(2);
      expect(merged.healthcare.isCustom).toBe(false);
    });
  });

  describe('Error Recovery', () => {
    it('handles corrupted localStorage gracefully → fallback to empty', () => {
      // Corrupt the localStorage
      localStorage.setItem(CUSTOM_SCRIPTS_KEY, '{invalid json}}}}');

      // Should return empty object, not throw
      const loaded = loadCustomScriptsFromStorage();
      expect(loaded).toEqual({});

      // Should be able to save new data
      const newScripts = { test: { name: 'Test' } };
      const result = saveCustomScriptsToStorage(newScripts);
      expect(result).toBe(true);

      // Should load correctly after saving
      const reloaded = loadCustomScriptsFromStorage();
      expect(reloaded.test.name).toBe('Test');
    });
  });

  describe('Minimal AI Response', () => {
    it('handles AI response with only required fields', () => {
      const minimalResponse = '{"openingScripts": []}';
      const parsed = parseAIResponse(minimalResponse);
      expect(parsed).not.toBeNull();

      const formData = {
        verticalName: 'Test Vertical',
        productService: 'Test Product',
        targetTitles: 'CEO',
        painPoints: 'Test pain',
        valueProps: 'Test value'
      };

      const vertical = buildVerticalObject(parsed, formData, 'test');

      // Should have all fields with defaults
      expect(vertical.name).toBe('Test Vertical');
      expect(vertical.openingScripts).toEqual([]);
      expect(vertical.discoveryQuestions).toEqual([]);
      expect(vertical.objectionHandlers).toEqual({});
      expect(vertical.voicemailScript).toBe('');
    });
  });

  describe('Rich AI Response', () => {
    it('handles AI response with all optional fields populated', () => {
      const richResponse = JSON.stringify({
        openingScripts: [
          { name: 'Direct', script: 'Script 1' },
          { name: 'Curiosity', script: 'Script 2' },
          { name: 'Pain-focused', script: 'Script 3' },
          { name: 'Value-first', script: 'Script 4' },
          { name: 'Referral', script: 'Script 5' }
        ],
        discoveryQuestions: ['Q1?', 'Q2?', 'Q3?', 'Q4?', 'Q5?'],
        valueStatements: ['V1', 'V2', 'V3', 'V4'],
        objectionHandlers: {
          'Not interested': 'R1',
          'Send email': 'R2',
          'Have solution': 'R3',
          'Bad timing': 'R4',
          'Too expensive': 'R5',
          'Need to think': 'R6',
          'No budget': 'R7',
          'Call back later': 'R8'
        },
        closingScripts: [
          { name: 'Assumptive', script: 'C1' },
          { name: 'Alternative', script: 'C2' },
          { name: 'Summary', script: 'C3' }
        ],
        voicemailScript: 'VM script here',
        followUpScript: 'Follow-up script here',
        postDeckFollowUp: 'Post-deck script here'
      });

      const parsed = parseAIResponse(richResponse);
      expect(parsed.openingScripts).toHaveLength(5);
      expect(parsed.discoveryQuestions).toHaveLength(5);
      expect(Object.keys(parsed.objectionHandlers)).toHaveLength(8);
      expect(parsed.closingScripts).toHaveLength(3);
      expect(parsed.voicemailScript).toBe('VM script here');
    });
  });

  describe('Key Collision', () => {
    it('two verticals with same name overwrite correctly', () => {
      // Create first vertical
      const firstVertical = {
        name: 'Healthcare',
        icon: '🏥',
        isCustom: true,
        version: 1
      };
      const key = generateVerticalKey('Healthcare');
      expect(key).toBe('healthcare');

      saveCustomScriptsToStorage({ [key]: firstVertical });

      // Create second vertical with same name
      const secondVertical = {
        name: 'Healthcare',
        icon: '🏥',
        isCustom: true,
        version: 2
      };

      const existing = loadCustomScriptsFromStorage();
      const updated = { ...existing, [key]: secondVertical };
      saveCustomScriptsToStorage(updated);

      // Verify second overwrote first
      const loaded = loadCustomScriptsFromStorage();
      expect(Object.keys(loaded)).toHaveLength(1);
      expect(loaded.healthcare.version).toBe(2);
    });
  });

  describe('Special Characters', () => {
    it('quotes, apostrophes, unicode in scripts preserved correctly', () => {
      const complexScript = {
        name: "Johnson & Johnson's \"Health\" Division",
        icon: '🏥',
        isCustom: true,
        openingScripts: [
          {
            name: 'Friendly',
            script: 'Hi! I\'m calling about "Project Alpha" & the <beta> release...'
          }
        ],
        objectionHandlers: {
          "We're not interested": "I understand you're busy. Let me ask you this...",
          'Send me info': 'Absolutely! What\'s your email? Is it john@company.com?'
        },
        painPoints: [
          'Dealing with "legacy" systems',
          "Can't integrate with Partner's API",
          'UTF-8: 日本語 & Ελληνικά'
        ],
        unicodeField: '🚀💼📊 emoji test',
        htmlChars: '<script>alert("XSS")</script>',
        backslashes: 'path\\to\\file'
      };

      const key = generateVerticalKey(complexScript.name);
      saveCustomScriptsToStorage({ [key]: complexScript });

      const loaded = loadCustomScriptsFromStorage();
      const loadedScript = loaded[key];

      expect(loadedScript.name).toBe("Johnson & Johnson's \"Health\" Division");
      expect(loadedScript.openingScripts[0].script).toContain('"Project Alpha"');
      expect(loadedScript.objectionHandlers["We're not interested"]).toContain("you're");
      expect(loadedScript.painPoints[2]).toContain('日本語');
      expect(loadedScript.unicodeField).toBe('🚀💼📊 emoji test');
      expect(loadedScript.htmlChars).toBe('<script>alert("XSS")</script>');
      expect(loadedScript.backslashes).toBe('path\\to\\file');
    });
  });

  describe('Persistence Across Sessions', () => {
    it('simulates session restart: save → clear state → load → verify', () => {
      // "Session 1" - Create and save
      const session1Scripts = {
        healthcare: {
          name: 'Healthcare',
          isCustom: true,
          createdAt: '2025-01-15T10:00:00.000Z',
          data: {
            nested: {
              deeply: 'value'
            }
          }
        },
        fintech: {
          name: 'Fintech',
          isCustom: true,
          createdAt: '2025-01-15T11:00:00.000Z'
        }
      };
      saveCustomScriptsToStorage(session1Scripts);

      // Simulate session end - clear all in-memory state
      // (In real app, this would be closing the browser)

      // "Session 2" - Load fresh
      const session2Loaded = loadCustomScriptsFromStorage();

      // Verify all data persisted
      expect(Object.keys(session2Loaded)).toHaveLength(2);
      expect(session2Loaded.healthcare.name).toBe('Healthcare');
      expect(session2Loaded.healthcare.createdAt).toBe('2025-01-15T10:00:00.000Z');
      expect(session2Loaded.healthcare.data.nested.deeply).toBe('value');
      expect(session2Loaded.fintech.name).toBe('Fintech');

      // Merge with defaults (simulating app startup)
      const defaults = { retail: { name: 'Retail', isCustom: false } };
      const merged = mergeVerticals(defaults, session2Loaded);

      expect(Object.keys(merged)).toHaveLength(3);
      expect(merged.retail.isCustom).toBe(false);
      expect(merged.healthcare.isCustom).toBe(true);
    });
  });
});
