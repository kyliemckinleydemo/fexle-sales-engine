/**
 * @module tests/utils/scriptBuilder.browser.test
 * @description Tests for browser-compatible ScriptBuilder module
 *
 * PURPOSE:
 * - Verify browser version exposes same API as ES module version
 * - Test global namespace registration
 * - Ensure parity between both versions
 *
 * CLAUDE NOTES:
 * - Loads browser version which attaches to global/window
 * - Tests the same functionality as scriptBuilder.test.js
 * - Verifies window.ScriptBuilder is correctly populated
 */

import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load the browser script into a simulated browser environment
describe('ScriptBuilder Browser Module', () => {
  let ScriptBuilder;

  beforeAll(() => {
    // Read the browser script
    const scriptPath = resolve(__dirname, '../../src/utils/scriptBuilder.browser.js');
    const scriptContent = readFileSync(scriptPath, 'utf-8');

    // Create a DOM with localStorage
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      runScripts: 'dangerously',
      url: 'http://localhost'
    });

    // Execute the script in the DOM context
    const scriptEl = dom.window.document.createElement('script');
    scriptEl.textContent = scriptContent;
    dom.window.document.body.appendChild(scriptEl);

    // Get the ScriptBuilder from the window
    ScriptBuilder = dom.window.ScriptBuilder;
  });

  describe('Global Registration', () => {
    it('exposes ScriptBuilder on window/global', () => {
      expect(ScriptBuilder).toBeDefined();
      expect(typeof ScriptBuilder).toBe('object');
    });

    it('exports all expected functions', () => {
      expect(typeof ScriptBuilder.validateStep1).toBe('function');
      expect(typeof ScriptBuilder.validateStep2).toBe('function');
      expect(typeof ScriptBuilder.generateVerticalKey).toBe('function');
      expect(typeof ScriptBuilder.parseAIResponse).toBe('function');
      expect(typeof ScriptBuilder.buildVerticalObject).toBe('function');
      expect(typeof ScriptBuilder.mergeVerticals).toBe('function');
      expect(typeof ScriptBuilder.saveCustomScriptsToStorage).toBe('function');
      expect(typeof ScriptBuilder.loadCustomScriptsFromStorage).toBe('function');
      expect(typeof ScriptBuilder.deleteScript).toBe('function');
    });

    it('exports CUSTOM_SCRIPTS_KEY constant', () => {
      expect(ScriptBuilder.CUSTOM_SCRIPTS_KEY).toBe('customScripts');
    });
  });

  describe('validateStep1', () => {
    it('returns true for valid data', () => {
      const data = {
        verticalName: 'Healthcare IT',
        productService: 'CRM Software',
        targetTitles: 'CEO, CTO'
      };
      expect(ScriptBuilder.validateStep1(data)).toBe(true);
    });

    it('returns false for missing verticalName', () => {
      const data = { productService: 'CRM', targetTitles: 'CEO' };
      expect(ScriptBuilder.validateStep1(data)).toBe(false);
    });

    it('returns false for null', () => {
      expect(ScriptBuilder.validateStep1(null)).toBe(false);
    });
  });

  describe('validateStep2', () => {
    it('returns true for valid data', () => {
      const data = {
        painPoints: 'Pain 1\nPain 2',
        valueProps: 'Value 1\nValue 2'
      };
      expect(ScriptBuilder.validateStep2(data)).toBe(true);
    });

    it('returns false for missing painPoints', () => {
      const data = { valueProps: 'Value 1' };
      expect(ScriptBuilder.validateStep2(data)).toBe(false);
    });
  });

  describe('generateVerticalKey', () => {
    it('converts to lowercase with underscores', () => {
      expect(ScriptBuilder.generateVerticalKey('Healthcare IT')).toBe('healthcare_it');
    });

    it('handles special characters', () => {
      expect(ScriptBuilder.generateVerticalKey('Healthcare & IT')).toBe('healthcare_it');
    });

    it('handles empty string', () => {
      expect(ScriptBuilder.generateVerticalKey('')).toBe('');
    });
  });

  describe('parseAIResponse', () => {
    it('extracts JSON from text', () => {
      const content = 'Here is your data: {"test": true}';
      const result = ScriptBuilder.parseAIResponse(content);
      expect(result).toEqual({ test: true });
    });

    it('handles markdown code blocks', () => {
      const content = '```json\n{"data": 123}\n```';
      const result = ScriptBuilder.parseAIResponse(content);
      expect(result).toEqual({ data: 123 });
    });

    it('returns null for invalid JSON', () => {
      expect(ScriptBuilder.parseAIResponse('{invalid')).toBeNull();
    });

    it('returns null for null input', () => {
      expect(ScriptBuilder.parseAIResponse(null)).toBeNull();
    });
  });

  describe('buildVerticalObject', () => {
    it('creates complete vertical object', () => {
      const parsed = { openingScripts: [{ name: 'Test', script: 'Hello' }] };
      const data = {
        verticalName: 'Test Vertical',
        productService: 'Test Product',
        targetTitles: 'CEO, CTO',
        painPoints: 'Pain 1\nPain 2',
        valueProps: 'Value 1'
      };
      const result = ScriptBuilder.buildVerticalObject(parsed, data, 'test');

      expect(result.name).toBe('Test Vertical');
      expect(result.isCustom).toBe(true);
      expect(result.targetTitles).toEqual(['CEO', 'CTO']);
      expect(result.painPoints).toEqual(['Pain 1', 'Pain 2']);
      expect(result.openingScripts).toEqual(parsed.openingScripts);
      expect(result.createdAt).toBeDefined();
    });

    it('handles null parsed data', () => {
      const data = {
        verticalName: 'Test',
        productService: 'Product',
        targetTitles: 'CEO',
        painPoints: 'Pain',
        valueProps: 'Value'
      };
      const result = ScriptBuilder.buildVerticalObject(null, data, 'test');
      expect(result.openingScripts).toEqual([]);
      expect(result.objectionHandlers).toEqual({});
    });
  });

  describe('mergeVerticals', () => {
    it('merges default and custom verticals', () => {
      const defaults = { healthcare: { name: 'Healthcare' } };
      const custom = { fintech: { name: 'Fintech' } };
      const result = ScriptBuilder.mergeVerticals(defaults, custom);

      expect(result.healthcare).toBeDefined();
      expect(result.fintech).toBeDefined();
    });

    it('custom overrides default', () => {
      const defaults = { test: { version: 1 } };
      const custom = { test: { version: 2 } };
      const result = ScriptBuilder.mergeVerticals(defaults, custom);
      expect(result.test.version).toBe(2);
    });

    it('handles null inputs', () => {
      expect(ScriptBuilder.mergeVerticals(null, null)).toEqual({});
    });
  });

  describe('deleteScript', () => {
    it('removes script by key', () => {
      const scripts = { a: { name: 'A' }, b: { name: 'B' } };
      const result = ScriptBuilder.deleteScript(scripts, 'a');
      expect(result.a).toBeUndefined();
      expect(result.b).toBeDefined();
    });

    it('does not mutate original', () => {
      const scripts = { a: { name: 'A' } };
      ScriptBuilder.deleteScript(scripts, 'a');
      expect(scripts.a).toBeDefined();
    });

    it('handles null scripts', () => {
      expect(ScriptBuilder.deleteScript(null, 'key')).toEqual({});
    });
  });
});

describe('ES Module vs Browser Module Parity', () => {
  // Import the ES module version
  let esModule;
  let browserModule;

  beforeAll(async () => {
    esModule = await import('../../src/utils/scriptBuilder.js');

    // Load browser version
    const scriptPath = resolve(__dirname, '../../src/utils/scriptBuilder.browser.js');
    const scriptContent = readFileSync(scriptPath, 'utf-8');
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      runScripts: 'dangerously',
      url: 'http://localhost'
    });
    const scriptEl = dom.window.document.createElement('script');
    scriptEl.textContent = scriptContent;
    dom.window.document.body.appendChild(scriptEl);
    browserModule = dom.window.ScriptBuilder;
  });

  it('both versions have same CUSTOM_SCRIPTS_KEY', () => {
    expect(esModule.CUSTOM_SCRIPTS_KEY).toBe(browserModule.CUSTOM_SCRIPTS_KEY);
  });

  it('validateStep1 produces same results', () => {
    const testCases = [
      { verticalName: 'Test', productService: 'Product', targetTitles: 'CEO' },
      { productService: 'Product', targetTitles: 'CEO' },
      null,
      {}
    ];

    testCases.forEach(data => {
      expect(esModule.validateStep1(data)).toBe(browserModule.validateStep1(data));
    });
  });

  it('validateStep2 produces same results', () => {
    const testCases = [
      { painPoints: 'Pain', valueProps: 'Value' },
      { painPoints: 'Pain' },
      null
    ];

    testCases.forEach(data => {
      expect(esModule.validateStep2(data)).toBe(browserModule.validateStep2(data));
    });
  });

  it('generateVerticalKey produces same results', () => {
    const testCases = ['Healthcare IT', 'Healthcare & IT', '', null, 'Test 123'];

    testCases.forEach(name => {
      expect(esModule.generateVerticalKey(name)).toBe(browserModule.generateVerticalKey(name));
    });
  });

  it('parseAIResponse produces same results', () => {
    const testCases = [
      '{"test": true}',
      '```json\n{"data": 1}\n```',
      'invalid',
      null
    ];

    testCases.forEach(content => {
      const esResult = esModule.parseAIResponse(content);
      const browserResult = browserModule.parseAIResponse(content);
      expect(JSON.stringify(esResult)).toBe(JSON.stringify(browserResult));
    });
  });

  it('mergeVerticals produces same results', () => {
    const defaults = { a: { name: 'A' } };
    const custom = { b: { name: 'B' } };

    const esResult = esModule.mergeVerticals(defaults, custom);
    const browserResult = browserModule.mergeVerticals(defaults, custom);

    expect(JSON.stringify(esResult)).toBe(JSON.stringify(browserResult));
  });

  it('deleteScript produces same results', () => {
    const scripts = { a: { name: 'A' }, b: { name: 'B' } };

    const esResult = esModule.deleteScript(scripts, 'a');
    const browserResult = browserModule.deleteScript(scripts, 'a');

    expect(JSON.stringify(esResult)).toBe(JSON.stringify(browserResult));
  });
});
