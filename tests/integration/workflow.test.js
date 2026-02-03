/**
 * @module tests/integration/workflow.test
 * @description Integration tests for complete lead workflow
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { calculateLeadScore } from '../../src/utils/scoring.js';
import { transformApolloLead, transformLead, toDbLead } from '../../src/utils/transform.js';
import { saveToStorage, loadFromStorage } from '../../src/utils/storage.js';
import { parseCSV, generateCSV } from '../../src/utils/csv.js';
import { formatPhoneForTel, formatPhoneDisplay, detectPhoneCountry } from '../../src/utils/phone.js';
import { calculateFollowUpDate, getTaskPriority } from '../../src/utils/dates.js';

describe('Complete Lead Workflow', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('transforms Apollo lead, calculates score, and saves to storage', () => {
    // 1. Simulate Apollo API response
    const apolloResponse = {
      id: 'apollo-123',
      first_name: 'Sarah',
      last_name: 'Chen',
      title: 'COO',
      email: 'schen@sunrisecare.com.au',
      phone_numbers: [{ sanitized_number: '0295551234' }],
      linkedin_url: 'https://linkedin.com/in/sarahchen',
      city: 'Sydney',
      state: 'NSW',
      country: 'Australia',
      organization: {
        name: 'Sunrise Aged Care Group',
        estimated_num_employees: 350,
        annual_revenue: 75000000,
        industry: 'Healthcare Services',
        website_url: 'https://sunrisecare.com.au'
      }
    };

    // 2. Transform Apollo lead to app format
    const lead = transformApolloLead(apolloResponse);
    expect(lead.company).toBe('Sunrise Aged Care Group');
    expect(lead.contact).toBe('Sarah Chen');
    expect(lead.title).toBe('COO');
    expect(lead.vertical).toBe('healthcare');
    expect(lead.companySize).toBe('201-500');
    expect(lead.revenue).toBe('$50M-$200M');

    // 3. Calculate lead score
    const { score, breakdown } = calculateLeadScore(lead);
    lead.score = score;

    // COO = 22, 201-500 = 20, $50M-$200M = 20, healthcare = 15
    // Total: 22 + 20 + 20 + 0 + 15 = 77
    expect(score).toBeGreaterThanOrEqual(70);
    expect(breakdown.title).toBe(22);  // COO
    expect(breakdown.companySize).toBe(20);  // 201-500 sweet spot
    expect(breakdown.revenue).toBe(20);  // $50M-$200M sweet spot
    expect(breakdown.vertical).toBe(15);  // healthcare

    // 4. Save to storage
    const data = { leads: [lead] };
    const saved = saveToStorage(data);
    expect(saved).toBe(true);

    // 5. Load and verify
    const loaded = loadFromStorage();
    expect(loaded.leads).toHaveLength(1);
    expect(loaded.leads[0].company).toBe('Sunrise Aged Care Group');
    expect(loaded.leads[0].score).toBe(score);
  });

  it('imports CSV, processes leads, and exports back to CSV', () => {
    // 1. Parse CSV import
    const csvInput = `company,contact,title,phone,email,vertical
Acme Healthcare,John Smith,CEO,0412345678,john@acme.com,Healthcare
Globex Financial,Jane Doe,CFO,0298765432,jane@globex.com,Financial Services
Initech Mfg,Bob Wilson,Director,0398765432,bob@initech.com,Manufacturing`;

    const leads = parseCSV(csvInput);
    expect(leads).toHaveLength(3);

    // 2. Calculate scores for each lead
    leads.forEach(lead => {
      const { score } = calculateLeadScore(lead);
      lead.score = score;
    });

    // CEO of Healthcare should score highest
    const acmeLead = leads.find(l => l.company === 'Acme Healthcare');
    const globexLead = leads.find(l => l.company === 'Globex Financial');
    expect(acmeLead.score).toBeGreaterThan(globexLead.score);

    // 3. Export back to CSV
    const csvOutput = generateCSV(leads);
    expect(csvOutput).toContain('Acme Healthcare');
    expect(csvOutput).toContain('Globex Financial');
    expect(csvOutput).toContain('Initech Mfg');
  });

  it('formats phone numbers through the complete pipeline', () => {
    // Australian mobile
    const auMobile = '0412345678';
    expect(detectPhoneCountry(auMobile)).toBe('AU');
    expect(formatPhoneForTel(auMobile)).toBe('+61412345678');
    expect(formatPhoneDisplay(auMobile)).toBe('0412 345 678');

    // US number
    const usNumber = '2025551234';
    expect(detectPhoneCountry(usNumber)).toBe('US');
    expect(formatPhoneForTel(usNumber)).toBe('+12025551234');
    expect(formatPhoneDisplay(usNumber)).toBe('(202) 555-1234');
  });

  it('manages lead status and follow-up dates', () => {
    const lead = {
      company: 'Test Corp',
      contact: 'John',
      title: 'CEO',
      score: 85,
      status: 'Qualified',
      vertical: 'healthcare'
    };

    // High-score qualified lead should be high priority
    const priority = getTaskPriority(lead);
    expect(priority).toBe(1); // Score 85+ = P1

    // Calculate follow-up date - use local date to avoid timezone issues
    const lastContact = new Date(2025, 0, 15); // Jan 15, 2025 local time
    const followUp = calculateFollowUpDate(lastContact, 'Qualified');
    expect(followUp.getDate()).toBe(20); // +5 days for Qualified

    // Change to CEO Meeting Booked
    lead.status = 'CEO Meeting Booked';
    const newPriority = getTaskPriority(lead);
    expect(newPriority).toBe(1); // CEO Meeting = P1

    const newFollowUp = calculateFollowUpDate(lastContact, 'CEO Meeting Booked');
    expect(newFollowUp.getDate()).toBe(16); // +1 day for CEO Meeting
  });

  it('handles Supabase DB round-trip transformation', () => {
    // Simulate data from Supabase
    const dbLead = {
      id: 'uuid-123',
      company: 'Acme Corp',
      contact: 'John Smith',
      title: 'CEO',
      phone: '0412345678',
      email: 'john@acme.com',
      vertical: 'healthcare',
      notes: 'Important client',
      score: 92,
      status: 'CEO Meeting Booked',
      last_contact_date: '2025-01-15T10:30:00Z',
      company_size: '201-500',
      revenue: '$50M-$200M',
      website: 'https://acme.com',
      linkedin_url: 'https://linkedin.com/company/acme',
      city: 'Sydney',
      state: 'NSW',
      country: 'AU',
      industry: 'Healthcare',
      source: 'apollo',
      milestones: { deckSent: true, ceoMeetingBooked: true },
      intent_signals: { hiringSalesforce: true, recentFunding: true },
      created_at: '2025-01-01T00:00:00Z'
    };

    // Transform to app format
    const appLead = transformLead(dbLead);
    expect(appLead.companySize).toBe('201-500');
    expect(appLead.linkedinUrl).toBe('https://linkedin.com/company/acme');
    expect(appLead.intentSignals.hiringSalesforce).toBe(true);

    // Modify in app
    appLead.notes = 'Updated notes';
    appLead.status = 'Closed Won';

    // Transform back to DB format
    const updatedDb = toDbLead(appLead);
    expect(updatedDb.notes).toBe('Updated notes');
    expect(updatedDb.status).toBe('Closed Won');
    expect(updatedDb.company_size).toBe('201-500');
    expect(updatedDb.linkedin_url).toBe('https://linkedin.com/company/acme');
  });

  it('processes multiple leads with different scores', () => {
    const leads = [
      {
        company: 'Hot Lead Inc',
        title: 'CEO',
        companySize: '201-500',
        revenue: '$50M-$200M',
        vertical: 'healthcare',
        intentSignals: { hiringSalesforce: true, recentFunding: true }
      },
      {
        company: 'Warm Lead Corp',
        title: 'Director',
        companySize: '51-200',
        revenue: '$20M-$50M',
        vertical: 'manufacturing',
        intentSignals: {}
      },
      {
        company: 'Cold Lead LLC',
        title: 'Analyst',
        companySize: '1-50',
        revenue: 'Under $5M',
        vertical: 'general',
        intentSignals: {}
      }
    ];

    const scoredLeads = leads.map(lead => {
      const { score } = calculateLeadScore(lead);
      return { ...lead, score };
    });

    // Hot lead should be 80+
    expect(scoredLeads[0].score).toBeGreaterThanOrEqual(80);

    // Warm lead should be 40-79
    expect(scoredLeads[1].score).toBeGreaterThanOrEqual(40);
    expect(scoredLeads[1].score).toBeLessThan(80);

    // Cold lead should be <40
    expect(scoredLeads[2].score).toBeLessThan(40);

    // Verify ordering
    expect(scoredLeads[0].score).toBeGreaterThan(scoredLeads[1].score);
    expect(scoredLeads[1].score).toBeGreaterThan(scoredLeads[2].score);
  });

  it('persists and retrieves complete application state', () => {
    // Create complete app state
    const appState = {
      leads: [
        {
          id: 1,
          company: 'Acme Corp',
          contact: 'John Smith',
          title: 'CEO',
          score: 92,
          status: 'CEO Meeting Booked',
          vertical: 'healthcare'
        }
      ],
      tasks: [
        {
          id: 1,
          leadId: 1,
          type: 'call',
          description: 'Confirm CEO meeting',
          dueDate: '2025-01-20',
          completed: false
        }
      ],
      settings: {
        userName: 'Sales Rep',
        apolloApiKey: 'test-key',
        sheetsUrl: 'https://script.google.com/...'
      }
    };

    // Save state
    saveToStorage(appState);

    // Reload state
    const loaded = loadFromStorage();

    // Verify all components
    expect(loaded.leads).toHaveLength(1);
    expect(loaded.leads[0].company).toBe('Acme Corp');
    expect(loaded.tasks).toHaveLength(1);
    expect(loaded.tasks[0].type).toBe('call');
    expect(loaded.settings.userName).toBe('Sales Rep');
  });
});
