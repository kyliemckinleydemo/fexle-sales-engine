/**
 * @module tests/setup
 * @description Test setup file for Vitest - configures test environment
 *
 * PURPOSE:
 * - Clear localStorage before each test for isolation
 * - Configure global test utilities
 *
 * CLAUDE NOTES:
 * - Uses happy-dom/jsdom localStorage
 * - Each test starts with clean state
 */

import { beforeEach } from 'vitest';

// Create a simple localStorage mock if not available
if (typeof globalThis.localStorage === 'undefined' || !globalThis.localStorage.clear) {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
    get length() { return store.size; },
    key: (index) => [...store.keys()][index] ?? null
  };
}

beforeEach(() => {
  if (globalThis.localStorage && typeof globalThis.localStorage.clear === 'function') {
    globalThis.localStorage.clear();
  }
});
