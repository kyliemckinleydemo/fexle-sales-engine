/**
 * @module utils/scriptBuilder
 * @description Pure functions for AI Script Builder feature - validation, parsing, storage
 *
 * PURPOSE:
 * - Validate script builder form data (step 1 and step 2)
 * - Generate storage keys from vertical names
 * - Parse AI responses to extract JSON
 * - Build vertical objects from parsed AI data
 * - Merge default and custom verticals
 * - Persist custom scripts to localStorage
 * - Support white-label customization of default vertical scripts
 *
 * DEPENDENCIES:
 * - None (pure functions, browser localStorage for storage functions)
 *
 * EXPORTS:
 * - validateStep1 - Validate step 1 form fields
 * - validateStep2 - Validate step 2 form fields
 * - generateVerticalKey - Convert name to storage key
 * - parseAIResponse - Extract JSON from AI response
 * - buildVerticalObject - Create vertical from AI response
 * - mergeVerticals - Combine default + custom scripts
 * - saveCustomScriptsToStorage - Save to localStorage
 * - loadCustomScriptsFromStorage - Load from localStorage
 * - deleteScript - Remove script by key
 * - CUSTOM_SCRIPTS_KEY - localStorage key constant
 * - getMergedVertical - Apply overrides to a base vertical
 * - hasOverride - Check if an item has an override
 * - saveVerticalOverridesToStorage - Save overrides to localStorage
 * - loadVerticalOverridesFromStorage - Load overrides from localStorage
 * - setOverride - Set an override for a specific item
 * - removeOverride - Remove an override for a specific item
 * - VERTICAL_OVERRIDES_KEY - localStorage key for overrides
 *
 * PATTERNS:
 * - All validation functions return boolean
 * - parseAIResponse returns null on failure
 * - Storage functions handle errors gracefully
 * - deleteScript returns new object (immutable)
 * - Override functions are immutable (return new objects)
 *
 * CLAUDE NOTES:
 * - Extracted from index.html lines 5816-6012
 * - These functions are used by the Script Builder modal
 * - generateVerticalKey replaces non-alphanumeric with underscore
 * - parseAIResponse handles markdown code blocks
 * - Overrides support both default verticals (openings, objections) and
 *   custom verticals (openingScripts, objectionHandlers)
 */

/**
 * localStorage key for custom scripts
 */
export const CUSTOM_SCRIPTS_KEY = 'customScripts';

/**
 * localStorage key for vertical overrides
 */
export const VERTICAL_OVERRIDES_KEY = 'verticalOverrides';

/**
 * Validate step 1 form data
 * @param {Object} data - Form data from step 1
 * @param {string} data.verticalName - Name of the playbook/vertical
 * @param {string} data.productService - Product or service description
 * @param {string} data.targetTitles - Comma-separated target titles
 * @returns {boolean} True if valid
 */
export function validateStep1(data) {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const { verticalName, productService, targetTitles } = data;

  // Check verticalName - required, non-empty after trim
  if (!verticalName || typeof verticalName !== 'string' || !verticalName.trim()) {
    return false;
  }

  // Check productService - required, non-empty after trim
  if (!productService || typeof productService !== 'string' || !productService.trim()) {
    return false;
  }

  // Check targetTitles - required, non-empty after trim
  if (!targetTitles || typeof targetTitles !== 'string' || !targetTitles.trim()) {
    return false;
  }

  return true;
}

/**
 * Validate step 2 form data
 * @param {Object} data - Form data from step 2
 * @param {string} data.painPoints - Pain points (newline separated)
 * @param {string} data.valueProps - Value propositions (newline separated)
 * @returns {boolean} True if valid
 */
export function validateStep2(data) {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const { painPoints, valueProps } = data;

  // Check painPoints - required, non-empty after trim
  if (!painPoints || typeof painPoints !== 'string' || !painPoints.trim()) {
    return false;
  }

  // Check valueProps - required, non-empty after trim
  if (!valueProps || typeof valueProps !== 'string' || !valueProps.trim()) {
    return false;
  }

  return true;
}

/**
 * Generate a storage key from vertical name
 * Converts to lowercase and replaces non-alphanumeric chars with underscores
 * @param {string} name - Vertical name
 * @returns {string} Storage key
 */
export function generateVerticalKey(name) {
  if (!name || typeof name !== 'string') {
    return '';
  }

  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, ''); // Trim leading/trailing underscores
}

/**
 * Parse AI response to extract JSON
 * Handles responses with markdown code blocks or raw JSON
 * @param {string} content - AI response content
 * @returns {Object|null} Parsed JSON or null if parsing fails
 */
export function parseAIResponse(content) {
  if (!content || typeof content !== 'string') {
    return null;
  }

  try {
    // Try to extract JSON from the content
    // First, try to find JSON in markdown code block
    const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      const jsonStr = codeBlockMatch[1].trim();
      return JSON.parse(jsonStr);
    }

    // Try to find raw JSON object
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return null;
  } catch (error) {
    // JSON parsing failed
    return null;
  }
}

/**
 * Build a vertical object from parsed AI response and form data
 * @param {Object} parsed - Parsed AI response
 * @param {Object} data - Form data from script builder
 * @param {string} key - Generated vertical key
 * @returns {Object} Complete vertical object
 */
export function buildVerticalObject(parsed, data, key) {
  const {
    verticalName,
    verticalIcon = '🏢',
    companyName = '',
    productService,
    targetTitles,
    painPoints,
    valueProps,
    desiredOutcome = 'CEO Meeting'
  } = data;

  const now = new Date().toISOString();

  return {
    name: verticalName,
    icon: verticalIcon,
    isCustom: true,
    companyName: companyName,
    productService: productService,
    targetTitles: targetTitles
      .split(',')
      .map(t => t.trim())
      .filter(t => t),
    desiredOutcome: desiredOutcome,
    openingScripts: parsed?.openingScripts || [],
    discoveryQuestions: parsed?.discoveryQuestions || [],
    valueStatements: parsed?.valueStatements || [],
    objectionHandlers: parsed?.objectionHandlers || {},
    closingScripts: parsed?.closingScripts || [],
    voicemailScript: parsed?.voicemailScript || '',
    followUpScript: parsed?.followUpScript || '',
    postDeckFollowUp: parsed?.postDeckFollowUp || '',
    painPoints: painPoints
      .split('\n')
      .map(p => p.trim())
      .filter(p => p),
    valueProps: valueProps
      .split('\n')
      .map(v => v.trim())
      .filter(v => v),
    createdAt: now,
    updatedAt: now
  };
}

/**
 * Merge default verticals with custom verticals
 * Custom verticals override defaults with the same key
 * @param {Object} defaults - Default vertical data
 * @param {Object} custom - Custom vertical data
 * @returns {Object} Merged verticals
 */
export function mergeVerticals(defaults, custom) {
  const defaultVerticals = defaults || {};
  const customVerticals = custom || {};

  return { ...defaultVerticals, ...customVerticals };
}

/**
 * Save custom scripts to localStorage
 * @param {Object} scripts - Custom scripts object
 * @returns {boolean} True if save succeeded
 */
export function saveCustomScriptsToStorage(scripts) {
  try {
    localStorage.setItem(CUSTOM_SCRIPTS_KEY, JSON.stringify(scripts || {}));
    return true;
  } catch (error) {
    // localStorage might be full or unavailable
    return false;
  }
}

/**
 * Load custom scripts from localStorage
 * @returns {Object} Custom scripts or empty object
 */
export function loadCustomScriptsFromStorage() {
  try {
    const stored = localStorage.getItem(CUSTOM_SCRIPTS_KEY);
    if (!stored) {
      return {};
    }
    const parsed = JSON.parse(stored);
    return parsed || {};
  } catch (error) {
    // Corrupted JSON or localStorage unavailable
    return {};
  }
}

/**
 * Delete a script by key (immutable - returns new object)
 * @param {Object} scripts - Current scripts object
 * @param {string} key - Key to delete
 * @returns {Object} New scripts object without the deleted key
 */
export function deleteScript(scripts, key) {
  if (!scripts || typeof scripts !== 'object') {
    return {};
  }

  if (!key || !Object.prototype.hasOwnProperty.call(scripts, key)) {
    return { ...scripts };
  }

  const { [key]: deleted, ...remaining } = scripts;
  return remaining;
}

/**
 * Get merged vertical with overrides applied
 * @param {string} verticalKey - Key of the vertical
 * @param {Object} baseVertical - Base vertical data
 * @param {Object} overrides - Overrides object for all verticals
 * @returns {Object} Merged vertical with overrides applied
 */
export function getMergedVertical(verticalKey, baseVertical, overrides) {
  if (!baseVertical || typeof baseVertical !== 'object') {
    return baseVertical;
  }

  const verticalOverrides = overrides?.[verticalKey];
  if (!verticalOverrides) {
    return baseVertical;
  }

  const merged = { ...baseVertical };

  // Apply opening script overrides (for default verticals with 'openings' array)
  if (verticalOverrides.openings && merged.openings) {
    merged.openings = merged.openings.map((opening, index) => {
      const override = verticalOverrides.openings.find(o => o.index === index);
      if (override) {
        return { ...opening, script: override.script };
      }
      return opening;
    });
  }

  // Apply opening script overrides (for custom verticals with 'openingScripts' array)
  if (verticalOverrides.openingScripts && merged.openingScripts) {
    merged.openingScripts = merged.openingScripts.map((opening, index) => {
      const override = verticalOverrides.openingScripts.find(o => o.index === index);
      if (override) {
        return { ...opening, script: override.script };
      }
      return opening;
    });
  }

  // Apply objection handler overrides (for default verticals with 'objections' object)
  if (verticalOverrides.objections && merged.objections) {
    merged.objections = { ...merged.objections, ...verticalOverrides.objections };
  }

  // Apply objection handler overrides (for custom verticals with 'objectionHandlers' object)
  if (verticalOverrides.objectionHandlers && merged.objectionHandlers) {
    merged.objectionHandlers = { ...merged.objectionHandlers, ...verticalOverrides.objectionHandlers };
  }

  // Apply pain point overrides
  if (verticalOverrides.painPoints && merged.painPoints) {
    merged.painPoints = merged.painPoints.map((pain, index) => {
      const override = verticalOverrides.painPoints.find(p => p.index === index);
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
export function hasOverride(overrides, verticalKey, type, identifier) {
  if (!overrides?.[verticalKey]?.[type]) {
    return false;
  }

  const typeOverrides = overrides[verticalKey][type];

  // For objects (objections/objectionHandlers)
  if (type === 'objections' || type === 'objectionHandlers') {
    return Object.prototype.hasOwnProperty.call(typeOverrides, identifier);
  }

  // For arrays (openings, openingScripts, painPoints)
  return typeOverrides.some(o => o.index === identifier);
}

/**
 * Save vertical overrides to localStorage
 * @param {Object} overrides - Overrides object
 * @returns {boolean} True if save succeeded
 */
export function saveVerticalOverridesToStorage(overrides) {
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
export function loadVerticalOverridesFromStorage() {
  try {
    const stored = localStorage.getItem(VERTICAL_OVERRIDES_KEY);
    if (!stored) {
      return {};
    }
    const parsed = JSON.parse(stored);
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
export function setOverride(overrides, verticalKey, type, identifier, value) {
  const newOverrides = { ...overrides };
  // Deep clone the vertical to avoid mutation
  newOverrides[verticalKey] = newOverrides[verticalKey]
    ? { ...newOverrides[verticalKey] }
    : {};

  // For objects (objections/objectionHandlers)
  if (type === 'objections' || type === 'objectionHandlers') {
    newOverrides[verticalKey][type] = newOverrides[verticalKey][type]
      ? { ...newOverrides[verticalKey][type] }
      : {};
    newOverrides[verticalKey][type][identifier] = value;
  } else {
    // For arrays (openings, openingScripts, painPoints)
    // Deep clone the array and its items
    newOverrides[verticalKey][type] = newOverrides[verticalKey][type]
      ? newOverrides[verticalKey][type].map(item => ({ ...item }))
      : [];
    const existingIndex = newOverrides[verticalKey][type].findIndex(o => o.index === identifier);
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
export function removeOverride(overrides, verticalKey, type, identifier) {
  if (!overrides?.[verticalKey]?.[type]) {
    return overrides;
  }

  const newOverrides = { ...overrides };
  newOverrides[verticalKey] = { ...newOverrides[verticalKey] };

  // For objects (objections/objectionHandlers)
  if (type === 'objections' || type === 'objectionHandlers') {
    newOverrides[verticalKey][type] = { ...newOverrides[verticalKey][type] };
    delete newOverrides[verticalKey][type][identifier];
    // Clean up empty type
    if (Object.keys(newOverrides[verticalKey][type]).length === 0) {
      delete newOverrides[verticalKey][type];
    }
  } else {
    // For arrays
    newOverrides[verticalKey][type] = newOverrides[verticalKey][type].filter(o => o.index !== identifier);
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
