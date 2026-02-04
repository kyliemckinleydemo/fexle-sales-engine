/**
 * @module utils/scriptBuilder.browser
 * @description Browser-compatible version of scriptBuilder functions
 *
 * PURPOSE:
 * - Expose scriptBuilder functions globally for use in index.html
 * - Same logic as scriptBuilder.js but without ES module syntax
 *
 * USAGE:
 * - Load via <script src="src/utils/scriptBuilder.browser.js"></script>
 * - Access via window.ScriptBuilder.functionName()
 *
 * EXPORTS (via window.ScriptBuilder):
 * - validateStep1, validateStep2
 * - generateVerticalKey
 * - parseAIResponse
 * - buildVerticalObject
 * - mergeVerticals
 * - saveCustomScriptsToStorage, loadCustomScriptsFromStorage
 * - deleteScript
 * - CUSTOM_SCRIPTS_KEY
 *
 * CLAUDE NOTES:
 * - This is a browser-compatible version of scriptBuilder.js
 * - Keep in sync with scriptBuilder.js when making changes
 * - Used by index.html single-file React app
 */

(function(global) {
  'use strict';

  var CUSTOM_SCRIPTS_KEY = 'customScripts';

  function validateStep1(data) {
    if (!data || typeof data !== 'object') {
      return false;
    }

    var verticalName = data.verticalName;
    var productService = data.productService;
    var targetTitles = data.targetTitles;

    if (!verticalName || typeof verticalName !== 'string' || !verticalName.trim()) {
      return false;
    }

    if (!productService || typeof productService !== 'string' || !productService.trim()) {
      return false;
    }

    if (!targetTitles || typeof targetTitles !== 'string' || !targetTitles.trim()) {
      return false;
    }

    return true;
  }

  function validateStep2(data) {
    if (!data || typeof data !== 'object') {
      return false;
    }

    var painPoints = data.painPoints;
    var valueProps = data.valueProps;

    if (!painPoints || typeof painPoints !== 'string' || !painPoints.trim()) {
      return false;
    }

    if (!valueProps || typeof valueProps !== 'string' || !valueProps.trim()) {
      return false;
    }

    return true;
  }

  function generateVerticalKey(name) {
    if (!name || typeof name !== 'string') {
      return '';
    }

    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  function parseAIResponse(content) {
    if (!content || typeof content !== 'string') {
      return null;
    }

    try {
      var codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        var jsonStr = codeBlockMatch[1].trim();
        return JSON.parse(jsonStr);
      }

      var jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  function buildVerticalObject(parsed, data, key) {
    var verticalName = data.verticalName;
    var verticalIcon = data.verticalIcon || '🏢';
    var companyName = data.companyName || '';
    var productService = data.productService;
    var targetTitles = data.targetTitles;
    var painPoints = data.painPoints;
    var valueProps = data.valueProps;
    var desiredOutcome = data.desiredOutcome || 'CEO Meeting';

    var now = new Date().toISOString();

    return {
      name: verticalName,
      icon: verticalIcon,
      isCustom: true,
      companyName: companyName,
      productService: productService,
      targetTitles: targetTitles
        .split(',')
        .map(function(t) { return t.trim(); })
        .filter(function(t) { return t; }),
      desiredOutcome: desiredOutcome,
      openingScripts: (parsed && parsed.openingScripts) || [],
      discoveryQuestions: (parsed && parsed.discoveryQuestions) || [],
      valueStatements: (parsed && parsed.valueStatements) || [],
      objectionHandlers: (parsed && parsed.objectionHandlers) || {},
      closingScripts: (parsed && parsed.closingScripts) || [],
      voicemailScript: (parsed && parsed.voicemailScript) || '',
      followUpScript: (parsed && parsed.followUpScript) || '',
      postDeckFollowUp: (parsed && parsed.postDeckFollowUp) || '',
      painPoints: painPoints
        .split('\n')
        .map(function(p) { return p.trim(); })
        .filter(function(p) { return p; }),
      valueProps: valueProps
        .split('\n')
        .map(function(v) { return v.trim(); })
        .filter(function(v) { return v; }),
      createdAt: now,
      updatedAt: now
    };
  }

  function mergeVerticals(defaults, custom) {
    var defaultVerticals = defaults || {};
    var customVerticals = custom || {};

    return Object.assign({}, defaultVerticals, customVerticals);
  }

  function saveCustomScriptsToStorage(scripts) {
    try {
      localStorage.setItem(CUSTOM_SCRIPTS_KEY, JSON.stringify(scripts || {}));
      return true;
    } catch (error) {
      return false;
    }
  }

  function loadCustomScriptsFromStorage() {
    try {
      var stored = localStorage.getItem(CUSTOM_SCRIPTS_KEY);
      if (!stored) {
        return {};
      }
      var parsed = JSON.parse(stored);
      return parsed || {};
    } catch (error) {
      return {};
    }
  }

  function deleteScript(scripts, key) {
    if (!scripts || typeof scripts !== 'object') {
      return {};
    }

    if (!key || !Object.prototype.hasOwnProperty.call(scripts, key)) {
      return Object.assign({}, scripts);
    }

    var result = Object.assign({}, scripts);
    delete result[key];
    return result;
  }

  // Export to global namespace
  global.ScriptBuilder = {
    CUSTOM_SCRIPTS_KEY: CUSTOM_SCRIPTS_KEY,
    validateStep1: validateStep1,
    validateStep2: validateStep2,
    generateVerticalKey: generateVerticalKey,
    parseAIResponse: parseAIResponse,
    buildVerticalObject: buildVerticalObject,
    mergeVerticals: mergeVerticals,
    saveCustomScriptsToStorage: saveCustomScriptsToStorage,
    loadCustomScriptsFromStorage: loadCustomScriptsFromStorage,
    deleteScript: deleteScript
  };

})(typeof window !== 'undefined' ? window : this);
