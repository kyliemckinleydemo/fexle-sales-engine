/**
 * @module tests/utils/csv.test
 * @description Tests for CSV parsing and generation
 */

import { describe, it, expect } from 'vitest';
import {
  parseCSV,
  generateCSV,
  normalizeVertical,
  escapeCSVValue,
  CSV_HEADERS
} from '../../src/utils/csv.js';

describe('parseCSV', () => {
  describe('Basic Parsing', () => {
    it('parses basic two-column CSV', () => {
      const csv = 'company,contact\nAcme Corp,John Smith\nGlobex,Jane Doe';
      const leads = parseCSV(csv);
      expect(leads).toHaveLength(2);
      expect(leads[0].company).toBe('Acme Corp');
      expect(leads[0].contact).toBe('John Smith');
      expect(leads[1].company).toBe('Globex');
      expect(leads[1].contact).toBe('Jane Doe');
    });

    it('parses CSV with all columns', () => {
      const csv = 'company,contact,title,phone,email,vertical\nAcme Corp,John Smith,CEO,0412345678,john@acme.com,healthcare';
      const leads = parseCSV(csv);
      expect(leads).toHaveLength(1);
      expect(leads[0].company).toBe('Acme Corp');
      expect(leads[0].contact).toBe('John Smith');
      expect(leads[0].title).toBe('CEO');
      expect(leads[0].phone).toBe('0412345678');
      expect(leads[0].email).toBe('john@acme.com');
      expect(leads[0].vertical).toBe('healthcare');
    });

    it('returns empty array for empty input', () => {
      expect(parseCSV('')).toEqual([]);
      expect(parseCSV(null)).toEqual([]);
      expect(parseCSV(undefined)).toEqual([]);
    });

    it('returns empty array for header-only CSV', () => {
      const csv = 'company,contact,title';
      const leads = parseCSV(csv);
      expect(leads).toEqual([]);
    });
  });

  describe('Quoted Values', () => {
    it('handles quoted values with commas', () => {
      const csv = 'company,contact\n"Acme, Inc.",John Smith';
      const leads = parseCSV(csv);
      expect(leads).toHaveLength(1);
      expect(leads[0].company).toBe('Acme, Inc.');
    });

    it('handles quoted values with quotes inside', () => {
      const csv = 'company,notes\nAcme Corp,"He said ""hello""."';
      const leads = parseCSV(csv);
      expect(leads).toHaveLength(1);
      expect(leads[0].notes).toBe('He said "hello".');
    });
  });

  describe('Header Aliases', () => {
    it('maps "name" to contact', () => {
      const csv = 'company,name\nAcme Corp,John Smith';
      const leads = parseCSV(csv);
      expect(leads[0].contact).toBe('John Smith');
    });

    it('maps "role" to title', () => {
      const csv = 'company,role\nAcme Corp,CEO';
      const leads = parseCSV(csv);
      expect(leads[0].title).toBe('CEO');
    });

    it('maps "industry" to vertical', () => {
      const csv = 'company,industry\nAcme Corp,Healthcare';
      const leads = parseCSV(csv);
      expect(leads[0].vertical).toBe('healthcare');
    });
  });

  describe('Default Values', () => {
    it('sets default vertical to general', () => {
      const csv = 'company,contact\nAcme Corp,John';
      const leads = parseCSV(csv);
      expect(leads[0].vertical).toBe('general');
    });

    it('sets default status to New Lead', () => {
      const csv = 'company,contact\nAcme Corp,John';
      const leads = parseCSV(csv);
      expect(leads[0].status).toBe('New Lead');
    });

    it('sets default lastContact to Never', () => {
      const csv = 'company,contact\nAcme Corp,John';
      const leads = parseCSV(csv);
      expect(leads[0].lastContact).toBe('Never');
    });

    it('sets default score to 50', () => {
      const csv = 'company,contact\nAcme Corp,John';
      const leads = parseCSV(csv);
      expect(leads[0].score).toBe(50);
    });

    it('generates unique IDs', () => {
      const csv = 'company\nAcme\nGlobex\nInitech';
      const leads = parseCSV(csv);
      const ids = leads.map(l => l.id);
      expect(new Set(ids).size).toBe(3);
    });
  });

  describe('Skips Invalid Rows', () => {
    it('skips rows without company', () => {
      const csv = 'company,contact\n,John Smith\nAcme,Jane';
      const leads = parseCSV(csv);
      expect(leads).toHaveLength(1);
      expect(leads[0].company).toBe('Acme');
    });
  });
});

describe('normalizeVertical', () => {
  it('normalizes healthcare variations', () => {
    expect(normalizeVertical('Healthcare')).toBe('healthcare');
    expect(normalizeVertical('Aged Care')).toBe('healthcare');
    expect(normalizeVertical('Medical Devices')).toBe('healthcare');
    expect(normalizeVertical('HEALTH SERVICES')).toBe('healthcare');
  });

  it('normalizes professional services variations', () => {
    expect(normalizeVertical('Professional Services')).toBe('professionalServices');
    expect(normalizeVertical('Legal')).toBe('professionalServices');
    expect(normalizeVertical('Accounting')).toBe('professionalServices');
    expect(normalizeVertical('Consulting')).toBe('professionalServices');
  });

  it('normalizes manufacturing variations', () => {
    expect(normalizeVertical('Manufacturing')).toBe('manufacturing');
    expect(normalizeVertical('Industrial')).toBe('manufacturing');
  });

  it('normalizes financial variations', () => {
    expect(normalizeVertical('Financial Services')).toBe('financial');
    expect(normalizeVertical('Banking')).toBe('financial');
    expect(normalizeVertical('Wealth Management')).toBe('financial');
  });

  it('normalizes retail variations', () => {
    expect(normalizeVertical('Retail')).toBe('retail');
    expect(normalizeVertical('E-Commerce')).toBe('retail');
  });

  it('normalizes education variations', () => {
    expect(normalizeVertical('Education')).toBe('education');
    expect(normalizeVertical('School')).toBe('education');
    expect(normalizeVertical('University')).toBe('education');
  });

  it('normalizes nonprofit variations', () => {
    expect(normalizeVertical('Nonprofit')).toBe('nonprofit');
    expect(normalizeVertical('Non-Profit')).toBe('nonprofit');
    expect(normalizeVertical('Charity')).toBe('nonprofit');
  });

  it('normalizes government variations', () => {
    expect(normalizeVertical('Government')).toBe('government');
    expect(normalizeVertical('Public Sector')).toBe('government');
  });

  it('normalizes real estate variations', () => {
    expect(normalizeVertical('Real Estate')).toBe('realestate');
    expect(normalizeVertical('Property')).toBe('realestate');
  });

  it('normalizes logistics variations', () => {
    expect(normalizeVertical('Logistics')).toBe('logistics');
    expect(normalizeVertical('Transport')).toBe('logistics');
    expect(normalizeVertical('Shipping')).toBe('logistics');
  });

  it('normalizes hospitality variations', () => {
    expect(normalizeVertical('Hospitality')).toBe('hospitality');
    expect(normalizeVertical('Hotel')).toBe('hospitality');
    expect(normalizeVertical('Restaurant')).toBe('hospitality');
  });

  it('returns original for unknown verticals', () => {
    expect(normalizeVertical('Technology')).toBe('Technology');
    expect(normalizeVertical('general')).toBe('general');
  });

  it('handles null/undefined', () => {
    expect(normalizeVertical(null)).toBe('general');
    expect(normalizeVertical(undefined)).toBe('general');
  });
});

describe('escapeCSVValue', () => {
  it('returns simple values unchanged', () => {
    expect(escapeCSVValue('Hello')).toBe('Hello');
    expect(escapeCSVValue('123')).toBe('123');
  });

  it('wraps values with commas in quotes', () => {
    expect(escapeCSVValue('Hello, World')).toBe('"Hello, World"');
  });

  it('wraps values with quotes and escapes internal quotes', () => {
    expect(escapeCSVValue('He said "Hello"')).toBe('"He said ""Hello"""');
  });

  it('wraps values with newlines in quotes', () => {
    expect(escapeCSVValue('Line 1\nLine 2')).toBe('"Line 1\nLine 2"');
  });

  it('handles null/undefined', () => {
    expect(escapeCSVValue(null)).toBe('');
    expect(escapeCSVValue(undefined)).toBe('');
  });

  it('converts numbers to strings', () => {
    expect(escapeCSVValue(123)).toBe('123');
    expect(escapeCSVValue(0)).toBe('0');
  });
});

describe('generateCSV', () => {
  it('generates CSV with headers', () => {
    const leads = [
      { company: 'Acme Corp', contact: 'John' }
    ];
    const csv = generateCSV(leads);
    expect(csv).toContain('company,contact');
  });

  it('generates CSV row for each lead', () => {
    const leads = [
      { company: 'Acme Corp', contact: 'John', title: 'CEO' },
      { company: 'Globex', contact: 'Jane', title: 'COO' }
    ];
    const csv = generateCSV(leads);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(3); // header + 2 data rows
    expect(lines[1]).toContain('Acme Corp');
    expect(lines[2]).toContain('Globex');
  });

  it('escapes special characters in values', () => {
    const leads = [
      { company: 'Acme, Inc.', contact: 'John "Jack" Smith' }
    ];
    const csv = generateCSV(leads);
    expect(csv).toContain('"Acme, Inc."');
    expect(csv).toContain('"John ""Jack"" Smith"');
  });

  it('handles empty leads array', () => {
    const csv = generateCSV([]);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(1); // header only
  });

  it('handles leads with missing fields', () => {
    const leads = [{ company: 'Acme' }];
    const csv = generateCSV(leads);
    expect(csv).toContain('Acme');
    expect(csv).not.toContain('undefined');
  });

  it('includes research fields when present', () => {
    const leads = [{
      company: 'Acme',
      research: {
        timestamp: '2025-01-01',
        priorityLevel: 'High',
        companyOverview: 'A great company'
      }
    }];
    const csv = generateCSV(leads);
    expect(csv).toContain('Yes'); // has_research
    expect(csv).toContain('High');
  });

  it('extracts communication history from notes', () => {
    const leads = [{
      company: 'Acme',
      notes: '[12/01/26, 2:30 pm] Called\nLeft message\n\n[13/01/26, 10:00 am] Called back'
    }];
    const csv = generateCSV(leads);
    // Should contain flattened communication history
    expect(csv).toContain('[12/01/26');
  });
});

describe('Round-trip parsing', () => {
  it('preserves data through generate -> parse cycle', () => {
    const original = [
      {
        company: 'Acme Corp',
        contact: 'John Smith',
        title: 'CEO',
        phone: '0412345678',
        email: 'john@acme.com',
        vertical: 'healthcare',
        score: 85,
        status: 'Qualified'
      }
    ];

    const csv = generateCSV(original);
    const parsed = parseCSV(csv);

    expect(parsed[0].company).toBe('Acme Corp');
    expect(parsed[0].contact).toBe('John Smith');
    expect(parsed[0].title).toBe('CEO');
    expect(parsed[0].vertical).toBe('healthcare');
    expect(parsed[0].status).toBe('Qualified');
  });
});
