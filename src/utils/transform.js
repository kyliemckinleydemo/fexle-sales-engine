/**
 * @module utils/transform
 * @description Data transformation utilities for Supabase and Apollo.io integration
 *
 * PURPOSE:
 * - Transform Supabase DB format (snake_case) to app format (camelCase)
 * - Transform app format to Supabase DB format
 * - Transform Apollo.io API response to app format
 *
 * EXPORTS:
 * - transformLead - DB snake_case to app camelCase
 * - toDbLead - App camelCase to DB snake_case
 * - transformApolloLead - Apollo API to app format
 * - getCompanySizeBucket - Employee count to size bracket
 * - getRevenueBucket - Revenue number to bracket string
 * - detectVertical - Industry string to vertical key
 *
 * PATTERNS:
 * - Transform functions handle null/undefined fields gracefully
 * - Default values provided for missing fields
 *
 * CLAUDE NOTES:
 * - Supabase uses snake_case, app uses camelCase
 * - Apollo API has nested organization object
 * - Size buckets: 1-50, 51-200, 201-500, 501-1000, 1000+
 */

/**
 * Get company size bucket from employee count
 * @param {number} employees - Number of employees
 * @returns {string} Size bucket string
 */
export function getCompanySizeBucket(employees) {
  const count = employees || 0;
  if (count <= 50) return '1-50';
  if (count <= 200) return '51-200';
  if (count <= 500) return '201-500';
  if (count <= 1000) return '501-1000';
  return '1000+';
}

/**
 * Get revenue bucket from annual revenue
 * @param {number} revenue - Annual revenue in dollars
 * @returns {string} Revenue bucket string
 */
export function getRevenueBucket(revenue) {
  const amount = revenue || 0;
  if (amount < 5000000) return 'Under $5M';
  if (amount < 20000000) return '$5M-$20M';
  if (amount < 50000000) return '$20M-$50M';
  if (amount < 200000000) return '$50M-$200M';
  return '$200M+';
}

/**
 * Detect vertical from industry string
 * @param {string} industry - Industry name
 * @returns {string} Vertical key
 */
export function detectVertical(industry) {
  const lower = (industry || '').toLowerCase();

  // Check hospitality FIRST (before healthcare, as 'hospitality' contains 'hospital')
  if (lower.includes('hospitality') || lower.includes('hotel') || lower.includes('restaurant') || lower.includes('tourism')) {
    return 'hospitality';
  }
  // Check real estate BEFORE government (as 'real estate' might match 'state')
  if (lower.includes('real estate') || lower.includes('realestate') || lower.includes('property') || lower.includes('construction')) {
    return 'realestate';
  }
  if (lower.includes('health') || lower.includes('medical') || lower.includes('hospital') || lower.includes('aged care')) {
    return 'healthcare';
  }
  if (lower.includes('financ') || lower.includes('bank') || lower.includes('insurance') || lower.includes('wealth')) {
    return 'financial';
  }
  if (lower.includes('manufactur') || lower.includes('industrial')) {
    return 'manufacturing';
  }
  if (lower.includes('professional') || lower.includes('legal') || lower.includes('law') || lower.includes('accounting') || lower.includes('consulting')) {
    return 'professionalServices';
  }
  if (lower.includes('retail') || lower.includes('commerce') || lower.includes('consumer')) {
    return 'retail';
  }
  if (lower.includes('education') || lower.includes('school') || lower.includes('university') || lower.includes('training')) {
    return 'education';
  }
  if (lower.includes('nonprofit') || lower.includes('non-profit') || lower.includes('charity') || lower.includes('foundation')) {
    return 'nonprofit';
  }
  if (lower.includes('government') || lower.includes('public sector') || lower.includes('federal')) {
    return 'government';
  }
  if (lower.includes('logistics') || lower.includes('transport') || lower.includes('shipping') || lower.includes('freight')) {
    return 'logistics';
  }

  return 'general';
}

/**
 * Transform Supabase DB lead to app format
 * @param {Object} dbLead - Lead from Supabase (snake_case)
 * @returns {Object} Lead in app format (camelCase)
 */
export function transformLead(dbLead) {
  return {
    id: dbLead.id,
    company: dbLead.company,
    contact: dbLead.contact,
    title: dbLead.title,
    phone: dbLead.phone,
    email: dbLead.email,
    vertical: dbLead.vertical || 'general',
    notes: dbLead.notes,
    score: dbLead.score || 50,
    status: dbLead.status || 'New Lead',
    lastContact: dbLead.last_contact_date ? new Date(dbLead.last_contact_date).toLocaleDateString('en-AU') : 'Never',
    lastContactDate: dbLead.last_contact_date,
    research: dbLead.research,
    companySize: dbLead.company_size,
    revenue: dbLead.revenue,
    website: dbLead.website,
    linkedinUrl: dbLead.linkedin_url,
    city: dbLead.city,
    state: dbLead.state,
    country: dbLead.country || 'AU',
    industry: dbLead.industry,
    source: dbLead.source || 'manual',
    milestones: dbLead.milestones || {},
    intentSignals: dbLead.intent_signals || {},
    createdAt: dbLead.created_at
  };
}

/**
 * Transform app lead to Supabase DB format
 * @param {Object} lead - Lead in app format (camelCase)
 * @returns {Object} Lead for Supabase (snake_case)
 */
export function toDbLead(lead) {
  return {
    company: lead.company,
    contact: lead.contact,
    title: lead.title,
    phone: lead.phone,
    email: lead.email,
    vertical: lead.vertical,
    notes: lead.notes,
    score: lead.score,
    status: lead.status,
    last_contact_date: lead.lastContactDate,
    research: lead.research,
    company_size: lead.companySize,
    revenue: lead.revenue,
    website: lead.website,
    linkedin_url: lead.linkedinUrl,
    city: lead.city,
    state: lead.state,
    country: lead.country,
    industry: lead.industry,
    source: lead.source,
    milestones: lead.milestones,
    intent_signals: lead.intentSignals
  };
}

/**
 * Transform Apollo.io API response to app lead format
 * @param {Object} apolloPerson - Person object from Apollo API
 * @param {string} source - Source identifier (default: 'apollo')
 * @returns {Object} Lead in app format
 */
export function transformApolloLead(apolloPerson, source = 'apollo') {
  const org = apolloPerson.organization || {};
  const employees = org.estimated_num_employees || apolloPerson.organization_num_employees || 0;
  const annualRevenue = org.annual_revenue || 0;
  const industry = org.industry || '';

  return {
    id: apolloPerson.id || Date.now(),
    company: org.name || apolloPerson.organization_name || '',
    contact: `${apolloPerson.first_name || ''} ${apolloPerson.last_name || ''}`.trim(),
    title: apolloPerson.title || '',
    phone: apolloPerson.phone_numbers?.[0]?.sanitized_number || apolloPerson.phone || '',
    email: apolloPerson.email || '',
    vertical: detectVertical(industry),
    companySize: getCompanySizeBucket(employees),
    revenue: getRevenueBucket(annualRevenue),
    employeeCount: employees,
    website: org.website_url || org.primary_domain || '',
    linkedinUrl: apolloPerson.linkedin_url || '',
    city: apolloPerson.city || org.city || '',
    state: apolloPerson.state || org.state || '',
    country: apolloPerson.country || org.country || 'AU',
    industry: industry,
    source: source,
    sourceId: apolloPerson.id,
    status: 'New Lead',
    score: 50, // Will be recalculated
    lastContact: 'Never',
    lastContactDate: null,
    notes: '',
    research: null,
    milestones: {},
    intentSignals: {},
    createdAt: new Date().toISOString(),
    importedAt: new Date().toISOString()
  };
}
