/**
 * @module tests/utils/storage.test
 * @description Tests for localStorage utilities - uses real jsdom localStorage
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveToStorage,
  loadFromStorage,
  STORAGE_KEY
} from '../../src/utils/storage.js';

describe('STORAGE_KEY', () => {
  it('has the expected value', () => {
    expect(STORAGE_KEY).toBe('sales_engine_data');
  });
});

describe('saveToStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves data to localStorage', () => {
    const data = { leads: [{ id: 1, company: 'Acme' }] };
    const result = saveToStorage(data);

    expect(result).toBe(true);
    expect(localStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify(data));
  });

  it('overwrites existing data', () => {
    saveToStorage({ version: 1 });
    saveToStorage({ version: 2 });

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(stored.version).toBe(2);
  });

  it('saves to custom key when provided', () => {
    const customKey = 'custom_key';
    const data = { test: true };
    saveToStorage(data, customKey);

    expect(localStorage.getItem(customKey)).toBe(JSON.stringify(data));
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('saves complex nested data', () => {
    const data = {
      leads: [
        { id: 1, company: 'Acme', nested: { deep: { value: 123 } } }
      ],
      settings: { theme: 'dark' },
      array: [1, 2, 3]
    };

    saveToStorage(data);
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));

    expect(stored.leads[0].nested.deep.value).toBe(123);
    expect(stored.settings.theme).toBe('dark');
    expect(stored.array).toEqual([1, 2, 3]);
  });

  it('handles null data', () => {
    const result = saveToStorage(null);
    expect(result).toBe(true);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('null');
  });

  it('handles empty object', () => {
    const result = saveToStorage({});
    expect(result).toBe(true);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('{}');
  });

  it('handles arrays', () => {
    const data = [1, 2, 3];
    saveToStorage(data);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('[1,2,3]');
  });
});

describe('loadFromStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads data from localStorage', () => {
    const data = { leads: [{ id: 1, company: 'Acme' }] };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    const result = loadFromStorage();
    expect(result).toEqual(data);
  });

  it('returns null when key does not exist', () => {
    const result = loadFromStorage();
    expect(result).toBeNull();
  });

  it('loads from custom key when provided', () => {
    const customKey = 'custom_key';
    const data = { test: true };
    localStorage.setItem(customKey, JSON.stringify(data));

    const result = loadFromStorage(customKey);
    expect(result).toEqual(data);
  });

  it('returns null for corrupted JSON', () => {
    localStorage.setItem(STORAGE_KEY, 'not valid json {{{');
    const result = loadFromStorage();
    expect(result).toBeNull();
  });

  it('returns null for empty string', () => {
    localStorage.setItem(STORAGE_KEY, '');
    const result = loadFromStorage();
    expect(result).toBeNull();
  });

  it('loads complex nested data correctly', () => {
    const data = {
      leads: [
        { id: 1, company: 'Acme', nested: { deep: { value: 123 } } }
      ],
      settings: { theme: 'dark' }
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    const result = loadFromStorage();
    expect(result.leads[0].nested.deep.value).toBe(123);
  });

  it('loads arrays correctly', () => {
    localStorage.setItem(STORAGE_KEY, '[1,2,3]');
    const result = loadFromStorage();
    expect(result).toEqual([1, 2, 3]);
  });

  it('loads null value correctly', () => {
    localStorage.setItem(STORAGE_KEY, 'null');
    const result = loadFromStorage();
    expect(result).toBeNull();
  });
});

describe('Round-trip save/load', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('preserves data through save then load', () => {
    const original = {
      leads: [
        { id: 1, company: 'Acme Corp', score: 85 },
        { id: 2, company: 'Globex', score: 72 }
      ],
      tasks: [
        { id: 1, leadId: 1, type: 'call' }
      ],
      settings: {
        userName: 'Test User',
        apiKey: 'abc123'
      }
    };

    saveToStorage(original);
    const loaded = loadFromStorage();

    expect(loaded).toEqual(original);
  });

  it('preserves special characters', () => {
    const original = {
      notes: 'He said "hello" & goodbye',
      unicode: '日本語テスト',
      newlines: 'line1\nline2\nline3'
    };

    saveToStorage(original);
    const loaded = loadFromStorage();

    expect(loaded.notes).toBe(original.notes);
    expect(loaded.unicode).toBe(original.unicode);
    expect(loaded.newlines).toBe(original.newlines);
  });

  it('preserves dates as strings', () => {
    const original = {
      createdAt: new Date().toISOString(),
      dates: ['2025-01-01', '2025-01-02']
    };

    saveToStorage(original);
    const loaded = loadFromStorage();

    expect(loaded.createdAt).toBe(original.createdAt);
    expect(loaded.dates).toEqual(original.dates);
  });
});
