/**
 * @module utils/storage
 * @description localStorage utilities for data persistence
 *
 * PURPOSE:
 * - Save application data to localStorage
 * - Load application data from localStorage
 * - Handle JSON parsing errors gracefully
 *
 * EXPORTS:
 * - saveToStorage - Save data to localStorage
 * - loadFromStorage - Load data from localStorage
 * - STORAGE_KEY - Default storage key
 *
 * PATTERNS:
 * - saveToStorage returns boolean success indicator
 * - loadFromStorage returns null on error or missing data
 *
 * CLAUDE NOTES:
 * - Handles quota exceeded errors gracefully
 * - Returns null for corrupted JSON
 */

export const STORAGE_KEY = 'fexle_sales_engine_data';

/**
 * Save data to localStorage
 * @param {Object} data - Data object to save
 * @param {string} key - Optional custom storage key
 * @returns {boolean} True if successful
 */
export function saveToStorage(data, key = STORAGE_KEY) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
    return false;
  }
}

/**
 * Load data from localStorage
 * @param {string} key - Optional custom storage key
 * @returns {Object|null} Parsed data or null
 */
export function loadFromStorage(key = STORAGE_KEY) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error('Failed to load from localStorage:', e);
    return null;
  }
}
