/**
 * @module utils/scriptBuilder.browser
 * @description Browser-compatible version of scriptBuilder functions
 *
 * PURPOSE:
 * - Expose scriptBuilder functions globally for use in index.html
 * - Same logic as scriptBuilder.js but without ES module syntax
 * - Support white-label customization of default vertical scripts
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
 * - getMergedVertical - Apply overrides to a base vertical
 * - hasOverride - Check if an item has an override
 * - saveVerticalOverridesToStorage, loadVerticalOverridesFromStorage
 * - setOverride, removeOverride - Manage individual overrides
 * - VERTICAL_OVERRIDES_KEY
 *
 * CLAUDE NOTES:
 * - This is a browser-compatible version of scriptBuilder.js
 * - Keep in sync with scriptBuilder.js when making changes
 * - Used by index.html single-file React app
 * - Overrides support both default verticals (openings, objections) and
 *   custom verticals (openingScripts, objectionHandlers)
 */

(function(global) {
  'use strict';

  var CUSTOM_SCRIPTS_KEY = 'customScripts';
  var VERTICAL_OVERRIDES_KEY = 'verticalOverrides';

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

  /**
   * Get merged vertical with overrides applied
   * @param {string} verticalKey - Key of the vertical
   * @param {Object} baseVertical - Base vertical data
   * @param {Object} overrides - Overrides object for all verticals
   * @returns {Object} Merged vertical with overrides applied
   */
  function getMergedVertical(verticalKey, baseVertical, overrides) {
    if (!baseVertical || typeof baseVertical !== 'object') {
      return baseVertical;
    }

    var verticalOverrides = overrides && overrides[verticalKey];
    if (!verticalOverrides) {
      return baseVertical;
    }

    var merged = Object.assign({}, baseVertical);

    // Apply opening script overrides (for default verticals with 'openings' array)
    if (verticalOverrides.openings && merged.openings) {
      merged.openings = merged.openings.map(function(opening, index) {
        var override = verticalOverrides.openings.find(function(o) { return o.index === index; });
        if (override) {
          return Object.assign({}, opening, { script: override.script });
        }
        return opening;
      });
    }

    // Apply opening script overrides (for custom verticals with 'openingScripts' array)
    if (verticalOverrides.openingScripts && merged.openingScripts) {
      merged.openingScripts = merged.openingScripts.map(function(opening, index) {
        var override = verticalOverrides.openingScripts.find(function(o) { return o.index === index; });
        if (override) {
          return Object.assign({}, opening, { script: override.script });
        }
        return opening;
      });
    }

    // Apply objection handler overrides (for default verticals with 'objections' object)
    if (verticalOverrides.objections && merged.objections) {
      merged.objections = Object.assign({}, merged.objections, verticalOverrides.objections);
    }

    // Apply objection handler overrides (for custom verticals with 'objectionHandlers' object)
    if (verticalOverrides.objectionHandlers && merged.objectionHandlers) {
      merged.objectionHandlers = Object.assign({}, merged.objectionHandlers, verticalOverrides.objectionHandlers);
    }

    // Apply pain point overrides
    if (verticalOverrides.painPoints && merged.painPoints) {
      merged.painPoints = merged.painPoints.map(function(pain, index) {
        var override = verticalOverrides.painPoints.find(function(p) { return p.index === index; });
        if (override) {
          return override.text;
        }
        return pain;
      });
    }

    return merged;
  }

  /**
   * Check if an item has an override
   * @param {Object} overrides - All overrides object
   * @param {string} verticalKey - Vertical key
   * @param {string} type - Type: 'openings', 'openingScripts', 'objections', 'objectionHandlers', 'painPoints'
   * @param {number|string} identifier - Index for arrays, objection text for objects
   * @returns {boolean} True if has override
   */
  function hasOverride(overrides, verticalKey, type, identifier) {
    if (!overrides || !overrides[verticalKey] || !overrides[verticalKey][type]) {
      return false;
    }

    var typeOverrides = overrides[verticalKey][type];

    // For objects (objections/objectionHandlers)
    if (type === 'objections' || type === 'objectionHandlers') {
      return Object.prototype.hasOwnProperty.call(typeOverrides, identifier);
    }

    // For arrays (openings, openingScripts, painPoints)
    return typeOverrides.some(function(o) { return o.index === identifier; });
  }

  /**
   * Save vertical overrides to localStorage
   * @param {Object} overrides - Overrides object
   * @returns {boolean} True if save succeeded
   */
  function saveVerticalOverridesToStorage(overrides) {
    try {
      localStorage.setItem(VERTICAL_OVERRIDES_KEY, JSON.stringify(overrides || {}));
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Load vertical overrides from localStorage
   * @returns {Object} Overrides or empty object
   */
  function loadVerticalOverridesFromStorage() {
    try {
      var stored = localStorage.getItem(VERTICAL_OVERRIDES_KEY);
      if (!stored) {
        return {};
      }
      var parsed = JSON.parse(stored);
      return parsed || {};
    } catch (error) {
      return {};
    }
  }

  /**
   * Set an override for a specific item
   * @param {Object} overrides - Current overrides
   * @param {string} verticalKey - Vertical key
   * @param {string} type - Type: 'openings', 'openingScripts', 'objections', 'objectionHandlers', 'painPoints'
   * @param {number|string} identifier - Index for arrays, objection text for objects
   * @param {string} value - New value (script text, response text, or pain point text)
   * @returns {Object} New overrides object
   */
  function setOverride(overrides, verticalKey, type, identifier, value) {
    var newOverrides = Object.assign({}, overrides);
    // Deep clone the vertical to avoid mutation
    newOverrides[verticalKey] = newOverrides[verticalKey]
      ? Object.assign({}, newOverrides[verticalKey])
      : {};

    // For objects (objections/objectionHandlers)
    if (type === 'objections' || type === 'objectionHandlers') {
      newOverrides[verticalKey][type] = newOverrides[verticalKey][type]
        ? Object.assign({}, newOverrides[verticalKey][type])
        : {};
      newOverrides[verticalKey][type][identifier] = value;
    } else {
      // For arrays (openings, openingScripts, painPoints)
      // Deep clone the array and its items
      newOverrides[verticalKey][type] = newOverrides[verticalKey][type]
        ? newOverrides[verticalKey][type].map(function(item) { return Object.assign({}, item); })
        : [];
      var existingIndex = newOverrides[verticalKey][type].findIndex(function(o) { return o.index === identifier; });
      if (existingIndex >= 0) {
        newOverrides[verticalKey][type][existingIndex] = type === 'painPoints'
          ? { index: identifier, text: value }
          : { index: identifier, script: value };
      } else {
        newOverrides[verticalKey][type].push(type === 'painPoints'
          ? { index: identifier, text: value }
          : { index: identifier, script: value });
      }
    }

    return newOverrides;
  }

  /**
   * Remove an override for a specific item
   * @param {Object} overrides - Current overrides
   * @param {string} verticalKey - Vertical key
   * @param {string} type - Type: 'openings', 'openingScripts', 'objections', 'objectionHandlers', 'painPoints'
   * @param {number|string} identifier - Index for arrays, objection text for objects
   * @returns {Object} New overrides object
   */
  function removeOverride(overrides, verticalKey, type, identifier) {
    if (!overrides || !overrides[verticalKey] || !overrides[verticalKey][type]) {
      return overrides;
    }

    var newOverrides = Object.assign({}, overrides);
    newOverrides[verticalKey] = Object.assign({}, newOverrides[verticalKey]);

    // For objects (objections/objectionHandlers)
    if (type === 'objections' || type === 'objectionHandlers') {
      newOverrides[verticalKey][type] = Object.assign({}, newOverrides[verticalKey][type]);
      delete newOverrides[verticalKey][type][identifier];
      // Clean up empty type
      if (Object.keys(newOverrides[verticalKey][type]).length === 0) {
        delete newOverrides[verticalKey][type];
      }
    } else {
      // For arrays
      newOverrides[verticalKey][type] = newOverrides[verticalKey][type].filter(function(o) { return o.index !== identifier; });
      // Clean up empty type
      if (newOverrides[verticalKey][type].length === 0) {
        delete newOverrides[verticalKey][type];
      }
    }

    // Clean up empty vertical
    if (Object.keys(newOverrides[verticalKey]).length === 0) {
      delete newOverrides[verticalKey];
    }

    return newOverrides;
  }

  // Export to global namespace
  global.ScriptBuilder = {
    CUSTOM_SCRIPTS_KEY: CUSTOM_SCRIPTS_KEY,
    VERTICAL_OVERRIDES_KEY: VERTICAL_OVERRIDES_KEY,
    validateStep1: validateStep1,
    validateStep2: validateStep2,
    generateVerticalKey: generateVerticalKey,
    parseAIResponse: parseAIResponse,
    buildVerticalObject: buildVerticalObject,
    mergeVerticals: mergeVerticals,
    saveCustomScriptsToStorage: saveCustomScriptsToStorage,
    loadCustomScriptsFromStorage: loadCustomScriptsFromStorage,
    deleteScript: deleteScript,
    getMergedVertical: getMergedVertical,
    hasOverride: hasOverride,
    saveVerticalOverridesToStorage: saveVerticalOverridesToStorage,
    loadVerticalOverridesFromStorage: loadVerticalOverridesFromStorage,
    setOverride: setOverride,
    removeOverride: removeOverride
  };

})(typeof window !== 'undefined' ? window : this);
