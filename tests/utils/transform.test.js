/**
 * @module tests/utils/transform.test
 * @description Tests for data transformation utilities
 */

import { describe, it, expect } from 'vitest';
import {
  transformLead,
  toDbLead,
  transformApolloLead,
  getCompanySizeBucket,
  getRevenueBucket,
  detectVertical
} from '../../src/utils/transform.js';

describe('getCompanySizeBucket', () => {
  it('returns 1-50 for 0-50 employees', () => {
    expect(getCompanySizeBucket(0)).toBe('1-50');
    expect(getCompanySizeBucket(1)).toBe('1-50');
    expect(getCompanySizeBucket(50)).toBe('1-50');
  });

  it('returns 51-200 for 51-200 employees', () => {
    expect(getCompanySizeBucket(51)).toBe('51-200');
    expect(getCompanySizeBucket(100)).toBe('51-200');
    expect(getCompanySizeBucket(200)).toBe('51-200');
  });

  it('returns 201-500 for 201-500 employees', () => {
    expect(getCompanySizeBucket(201)).toBe('201-500');
    expect(getCompanySizeBucket(350)).toBe('201-500');
    expect(getCompanySizeBucket(500)).toBe('201-500');
  });

  it('returns 501-1000 for 501-1000 employees', () => {
    expect(getCompanySizeBucket(501)).toBe('501-1000');
    expect(getCompanySizeBucket(750)).toBe('501-1000');
    expect(getCompanySizeBucket(1000)).toBe('501-1000');
  });

  it('returns 1000+ for 1001+ employees', () => {
    expect(getCompanySizeBucket(1001)).toBe('1000+');
    expect(getCompanySizeBucket(5000)).toBe('1000+');
    expect(getCompanySizeBucket(100000)).toBe('1000+');
  });

  it('handles null/undefined as 0', () => {
    expect(getCompanySizeBucket(null)).toBe('1-50');
    expect(getCompanySizeBucket(undefined)).toBe('1-50');
  });
});

describe('getRevenueBucket', () => {
  it('returns Under $5M for < $5M', () => {
    expect(getRevenueBucket(0)).toBe('Under $5M');
    expect(getRevenueBucket(1000000)).toBe('Under $5M');
    expect(getRevenueBucket(4999999)).toBe('Under $5M');
  });

  it('returns $5M-$20M for $5M-$19.99M', () => {
    expect(getRevenueBucket(5000000)).toBe('$5M-$20M');
    expect(getRevenueBucket(10000000)).toBe('$5M-$20M');
    expect(getRevenueBucket(19999999)).toBe('$5M-$20M');
  });

  it('returns $20M-$50M for $20M-$49.99M', () => {
    expect(getRevenueBucket(20000000)).toBe('$20M-$50M');
    expect(getRevenueBucket(35000000)).toBe('$20M-$50M');
    expect(getRevenueBucket(49999999)).toBe('$20M-$50M');
  });

  it('returns $50M-$200M for $50M-$199.99M', () => {
    expect(getRevenueBucket(50000000)).toBe('$50M-$200M');
    expect(getRevenueBucket(100000000)).toBe('$50M-$200M');
    expect(getRevenueBucket(199999999)).toBe('$50M-$200M');
  });

  it('returns $200M+ for >= $200M', () => {
    expect(getRevenueBucket(200000000)).toBe('$200M+');
    expect(getRevenueBucket(500000000)).toBe('$200M+');
    expect(getRevenueBucket(1000000000)).toBe('$200M+');
  });

  it('handles null/undefined as 0', () => {
    expect(getRevenueBucket(null)).toBe('Under $5M');
    expect(getRevenueBucket(undefined)).toBe('Under $5M');
  });
});

describe('detectVertical', () => {
  it('detects healthcare', () => {
    expect(detectVertical('Healthcare')).toBe('healthcare');
    expect(detectVertical('Medical Devices')).toBe('healthcare');
    expect(detectVertical('Hospital Systems')).toBe('healthcare');
    expect(detectVertical('Aged Care Services')).toBe('healthcare');
  });

  it('detects financial', () => {
    expect(detectVertical('Financial Services')).toBe('financial');
    expect(detectVertical('Banking')).toBe('financial');
    expect(detectVertical('Insurance')).toBe('financial');
    expect(detectVertical('Wealth Management')).toBe('financial');
  });

  it('detects manufacturing', () => {
    expect(detectVertical('Manufacturing')).toBe('manufacturing');
    expect(detectVertical('Industrial Equipment')).toBe('manufacturing');
  });

  it('detects professional services', () => {
    expect(detectVertical('Professional Services')).toBe('professionalServices');
    expect(detectVertical('Legal')).toBe('professionalServices');
    expect(detectVertical('Law Firm')).toBe('professionalServices');
    expect(detectVertical('Accounting')).toBe('professionalServices');
    expect(detectVertical('Consulting')).toBe('professionalServices');
  });

  it('detects retail', () => {
    expect(detectVertical('Retail')).toBe('retail');
    expect(detectVertical('E-Commerce')).toBe('retail');
    expect(detectVertical('Consumer Goods')).toBe('retail');
  });

  it('detects education', () => {
    expect(detectVertical('Education')).toBe('education');
    expect(detectVertical('School')).toBe('education');
    expect(detectVertical('University')).toBe('education');
    expect(detectVertical('Training')).toBe('education');
  });

  it('detects nonprofit', () => {
    expect(detectVertical('Nonprofit')).toBe('nonprofit');
    expect(detectVertical('Non-Profit')).toBe('nonprofit');
    expect(detectVertical('Charity')).toBe('nonprofit');
    expect(detectVertical('Foundation')).toBe('nonprofit');
  });

  it('detects government', () => {
    expect(detectVertical('Government')).toBe('government');
    expect(detectVertical('Public Sector')).toBe('government');
    expect(detectVertical('Federal Agency')).toBe('government');
    expect(detectVertical('Federal Government')).toBe('government');
  });

  it('detects real estate', () => {
    expect(detectVertical('Real Estate')).toBe('realestate');
    expect(detectVertical('Property Management')).toBe('realestate');
    expect(detectVertical('Construction')).toBe('realestate');
  });

  it('detects logistics', () => {
    expect(detectVertical('Logistics')).toBe('logistics');
    expect(detectVertical('Transportation')).toBe('logistics');
    expect(detectVertical('Shipping')).toBe('logistics');
    expect(detectVertical('Freight')).toBe('logistics');
  });

  it('detects hospitality', () => {
    expect(detectVertical('Hospitality')).toBe('hospitality');
    expect(detectVertical('Hotel')).toBe('hospitality');
    expect(detectVertical('Restaurant')).toBe('hospitality');
    expect(detectVertical('Tourism')).toBe('hospitality');
  });

  it('returns general for unknown industries', () => {
    expect(detectVertical('Technology')).toBe('general');
    expect(detectVertical('Software')).toBe('general');
    expect(detectVertical('')).toBe('general');
    expect(detectVertical(null)).toBe('general');
    expect(detectVertical(undefined)).toBe('general');
  });
});

describe('transformLead', () => {
  it('transforms snake_case DB lead to camelCase', () => {
    const dbLead = {
      id: 1,
      company: 'Acme Corp',
      contact: 'John Smith',
      title: 'CEO',
      phone: '0412345678',
      email: 'john@acme.com',
      vertical: 'healthcare',
      notes: 'Test notes',
      score: 85,
      status: 'Qualified',
      last_contact_date: '2025-01-15',
      research: { summary: 'Good company' },
      company_size: '201-500',
      revenue: '$50M-$200M',
      website: 'https://acme.com',
      linkedin_url: 'https://linkedin.com/company/acme',
      city: 'Sydney',
      state: 'NSW',
      country: 'AU',
      industry: 'Healthcare',
      source: 'apollo',
      milestones: { deckSent: true },
      intent_signals: { hiringSalesforce: true },
      created_at: '2025-01-01'
    };

    const result = transformLead(dbLead);

    expect(result.id).toBe(1);
    expect(result.company).toBe('Acme Corp');
    expect(result.lastContactDate).toBe('2025-01-15');
    expect(result.companySize).toBe('201-500');
    expect(result.linkedinUrl).toBe('https://linkedin.com/company/acme');
    expect(result.intentSignals).toEqual({ hiringSalesforce: true });
    expect(result.createdAt).toBe('2025-01-01');
  });

  it('provides default values for missing fields', () => {
    const dbLead = {
      id: 1,
      company: 'Acme'
    };

    const result = transformLead(dbLead);

    expect(result.vertical).toBe('general');
    expect(result.score).toBe(50);
    expect(result.status).toBe('New Lead');
    expect(result.lastContact).toBe('Never');
    expect(result.country).toBe('AU');
    expect(result.source).toBe('manual');
    expect(result.milestones).toEqual({});
    expect(result.intentSignals).toEqual({});
  });

  it('formats lastContact date in en-AU locale', () => {
    const dbLead = {
      id: 1,
      company: 'Acme',
      last_contact_date: '2025-01-15'
    };

    const result = transformLead(dbLead);
    // en-AU format is DD/MM/YYYY
    expect(result.lastContact).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
  });
});

describe('toDbLead', () => {
  it('transforms camelCase lead to snake_case DB format', () => {
    const lead = {
      company: 'Acme Corp',
      contact: 'John Smith',
      title: 'CEO',
      phone: '0412345678',
      email: 'john@acme.com',
      vertical: 'healthcare',
      notes: 'Test notes',
      score: 85,
      status: 'Qualified',
      lastContactDate: '2025-01-15',
      research: { summary: 'Good company' },
      companySize: '201-500',
      revenue: '$50M-$200M',
      website: 'https://acme.com',
      linkedinUrl: 'https://linkedin.com/company/acme',
      city: 'Sydney',
      state: 'NSW',
      country: 'AU',
      industry: 'Healthcare',
      source: 'apollo',
      milestones: { deckSent: true },
      intentSignals: { hiringSalesforce: true }
    };

    const result = toDbLead(lead);

    expect(result.company).toBe('Acme Corp');
    expect(result.last_contact_date).toBe('2025-01-15');
    expect(result.company_size).toBe('201-500');
    expect(result.linkedin_url).toBe('https://linkedin.com/company/acme');
    expect(result.intent_signals).toEqual({ hiringSalesforce: true });
  });

  it('does not include id field', () => {
    const lead = {
      id: 123,
      company: 'Acme'
    };

    const result = toDbLead(lead);
    expect(result.id).toBeUndefined();
  });
});

describe('transformApolloLead', () => {
  it('transforms Apollo API response to lead format', () => {
    const apolloPerson = {
      id: 'apollo-123',
      first_name: 'John',
      last_name: 'Smith',
      title: 'CEO',
      email: 'john@acme.com',
      phone_numbers: [{ sanitized_number: '+61412345678' }],
      linkedin_url: 'https://linkedin.com/in/johnsmith',
      city: 'Sydney',
      state: 'NSW',
      country: 'Australia',
      organization: {
        name: 'Acme Corp',
        estimated_num_employees: 350,
        annual_revenue: 75000000,
        industry: 'Healthcare Services',
        website_url: 'https://acme.com'
      }
    };

    const result = transformApolloLead(apolloPerson);

    expect(result.company).toBe('Acme Corp');
    expect(result.contact).toBe('John Smith');
    expect(result.title).toBe('CEO');
    expect(result.email).toBe('john@acme.com');
    expect(result.phone).toBe('+61412345678');
    expect(result.companySize).toBe('201-500');
    expect(result.revenue).toBe('$50M-$200M');
    expect(result.vertical).toBe('healthcare');
    expect(result.source).toBe('apollo');
    expect(result.sourceId).toBe('apollo-123');
  });

  it('handles missing organization', () => {
    const apolloPerson = {
      first_name: 'John',
      last_name: 'Smith',
      organization_name: 'Acme Corp',
      organization_num_employees: 100
    };

    const result = transformApolloLead(apolloPerson);

    expect(result.company).toBe('Acme Corp');
    expect(result.contact).toBe('John Smith');
    expect(result.companySize).toBe('51-200');
  });

  it('handles missing phone numbers', () => {
    const apolloPerson = {
      first_name: 'John',
      phone: '+61412345678',
      organization: {}
    };

    const result = transformApolloLead(apolloPerson);
    expect(result.phone).toBe('+61412345678');
  });

  it('uses custom source when provided', () => {
    const apolloPerson = {
      first_name: 'John',
      organization: {}
    };

    const result = transformApolloLead(apolloPerson, 'linkedin');
    expect(result.source).toBe('linkedin');
  });

  it('sets default values', () => {
    const apolloPerson = {
      organization: {}
    };

    const result = transformApolloLead(apolloPerson);

    expect(result.status).toBe('New Lead');
    expect(result.score).toBe(50);
    expect(result.lastContact).toBe('Never');
    expect(result.notes).toBe('');
    expect(result.research).toBeNull();
    expect(result.milestones).toEqual({});
    expect(result.intentSignals).toEqual({});
  });

  it('generates ID if not present', () => {
    const apolloPerson = {
      organization: {}
    };

    const result = transformApolloLead(apolloPerson);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
  });
});

describe('Round-trip transformations', () => {
  it('preserves data through transformLead -> toDbLead', () => {
    const dbLead = {
      id: 1,
      company: 'Acme Corp',
      contact: 'John Smith',
      title: 'CEO',
      phone: '0412345678',
      email: 'john@acme.com',
      vertical: 'healthcare',
      notes: 'Test notes',
      score: 85,
      status: 'Qualified',
      last_contact_date: '2025-01-15',
      company_size: '201-500',
      revenue: '$50M-$200M',
      website: 'https://acme.com',
      linkedin_url: 'https://linkedin.com/company/acme',
      city: 'Sydney',
      state: 'NSW',
      country: 'AU',
      industry: 'Healthcare',
      source: 'apollo',
      milestones: { deckSent: true },
      intent_signals: { hiringSalesforce: true }
    };

    const appLead = transformLead(dbLead);
    const backToDb = toDbLead(appLead);

    expect(backToDb.company).toBe(dbLead.company);
    expect(backToDb.company_size).toBe(dbLead.company_size);
    expect(backToDb.linkedin_url).toBe(dbLead.linkedin_url);
    expect(backToDb.intent_signals).toEqual(dbLead.intent_signals);
  });
});
