/**
 * @module utils/csv
 * @description CSV parsing and generation for lead import/export
 *
 * PURPOSE:
 * - Parse CSV text into lead objects
 * - Generate CSV from lead array
 * - Handle quoted values and special characters
 *
 * EXPORTS:
 * - parseCSV - Parse CSV text into lead array
 * - generateCSV - Generate CSV from lead array
 * - CSV_HEADERS - Standard export headers
 *
 * PATTERNS:
 * - parseCSV maps common header aliases (name -> contact, role -> title)
 * - parseCSV normalizes vertical names to internal keys
 * - generateCSV escapes commas, quotes, and newlines
 *
 * CLAUDE NOTES:
 * - parseCSV returns empty array for invalid input
 * - Vertical normalization: "healthcare", "aged care", "medical" -> "healthcare"
 * - Lead IDs are generated from Date.now() + row index
 */

// Standard CSV export headers
export const CSV_HEADERS = [
  'company',
  'contact',
  'title',
  'phone',
  'email',
  'vertical',
  'score',
  'status',
  'source',
  'company_size',
  'revenue',
  'employee_count',
  'website',
  'linkedin_url',
  'city',
  'state',
  'industry',
  'last_contact',
  'last_contact_date',
  'created_date',
  'notes'
];

/**
 * Parse CSV text into an array of lead objects
 * @param {string} csvText - Raw CSV text
 * @returns {Array<Object>} Array of lead objects
 */
export function parseCSV(csvText) {
  if (!csvText || typeof csvText !== 'string') {
    return [];
  }

  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    return [];
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
  const leads = [];

  for (let i = 1; i < lines.length; i++) {
    // Parse CSV values, handling quoted strings with commas
    const values = [];
    let current = '';
    let inQuotes = false;
    const line = lines[i];

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        if (inQuotes && line[j + 1] === '"') {
          current += '"';
          j++; // Skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim()); // Last value

    const cleanValues = values;

    if (cleanValues.length > 0) {
      const lead = {
        id: Date.now() + i,
        company: cleanValues[headers.indexOf('company')] || cleanValues[0] || '',
        contact: cleanValues[headers.indexOf('contact')] || cleanValues[headers.indexOf('name')] || cleanValues[1] || '',
        title: cleanValues[headers.indexOf('title')] || cleanValues[headers.indexOf('role')] || cleanValues[2] || '',
        phone: cleanValues[headers.indexOf('phone')] || cleanValues[3] || '',
        email: cleanValues[headers.indexOf('email')] || cleanValues[4] || '',
        vertical: cleanValues[headers.indexOf('vertical')] || cleanValues[headers.indexOf('industry')] || 'general',
        notes: cleanValues[headers.indexOf('notes')] || '',
        score: parseInt(cleanValues[headers.indexOf('score')]) || 50,
        status: cleanValues[headers.indexOf('status')] || 'New Lead',
        lastContact: 'Never',
        research: null,
        createdAt: new Date().toISOString().split('T')[0]
      };

      // Normalize vertical
      lead.vertical = normalizeVertical(lead.vertical);

      if (lead.company) {
        leads.push(lead);
      }
    }
  }

  return leads;
}

/**
 * Normalize vertical name to internal key
 * @param {string} vertical - Raw vertical name
 * @returns {string} Normalized vertical key
 */
export function normalizeVertical(vertical) {
  const verticalLower = (vertical || '').toLowerCase();

  if (verticalLower.includes('health') || verticalLower.includes('aged') || verticalLower.includes('medical')) {
    return 'healthcare';
  }
  if (verticalLower.includes('professional') || verticalLower.includes('legal') || verticalLower.includes('accounting') || verticalLower.includes('consulting')) {
    return 'professionalServices';
  }
  if (verticalLower.includes('manufactur') || verticalLower.includes('industrial')) {
    return 'manufacturing';
  }
  if (verticalLower.includes('financ') || verticalLower.includes('bank') || verticalLower.includes('wealth')) {
    return 'financial';
  }
  if (verticalLower.includes('retail') || verticalLower.includes('commerce')) {
    return 'retail';
  }
  if (verticalLower.includes('education') || verticalLower.includes('school') || verticalLower.includes('university')) {
    return 'education';
  }
  if (verticalLower.includes('nonprofit') || verticalLower.includes('non-profit') || verticalLower.includes('charity')) {
    return 'nonprofit';
  }
  if (verticalLower.includes('government') || verticalLower.includes('public sector')) {
    return 'government';
  }
  if (verticalLower.includes('real estate') || verticalLower.includes('realestate') || verticalLower.includes('property')) {
    return 'realestate';
  }
  if (verticalLower.includes('logistics') || verticalLower.includes('transport') || verticalLower.includes('shipping')) {
    return 'logistics';
  }
  if (verticalLower.includes('hospitality') || verticalLower.includes('hotel') || verticalLower.includes('restaurant')) {
    return 'hospitality';
  }

  return vertical || 'general';
}

/**
 * Escape a value for CSV output
 * @param {any} value - Value to escape
 * @returns {string} CSV-safe string
 */
export function escapeCSVValue(value) {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generate CSV string from array of leads
 * @param {Array<Object>} leads - Array of lead objects
 * @param {Object} options - Optional config (verticalData, leadSources for name lookups)
 * @returns {string} CSV string
 */
export function generateCSV(leads, options = {}) {
  const { verticalData = {}, leadSources = {} } = options;

  const headers = [
    'company',
    'contact',
    'title',
    'phone',
    'email',
    'vertical',
    'vertical_name',
    'score',
    'status',
    'source',
    'source_name',
    'company_size',
    'revenue',
    'employee_count',
    'website',
    'linkedin_url',
    'city',
    'state',
    'industry',
    'last_contact',
    'last_contact_date',
    'created_date',
    'imported_at',
    'notes',
    'has_research',
    'research_priority',
    'research_summary',
    'salesforce_likelihood',
    'recommended_opening',
    'communication_history'
  ];

  const rows = leads.map(lead => {
    const vertical = verticalData[lead.vertical];
    const research = lead.research || {};

    // Extract communication history from notes (entries start with timestamps like [12/01/26, 2:30 pm])
    const commHistory = (lead.notes || '').split('\n\n')
      .filter(entry => entry.trim().startsWith('['))
      .map(entry => entry.replace(/\n/g, ' | '))
      .join(' || ');

    const values = [
      lead.company || '',
      lead.contact || '',
      lead.title || '',
      lead.phone || '',
      lead.email || '',
      lead.vertical || '',
      vertical?.name || '',
      lead.score || '',
      lead.status || '',
      lead.source || 'manual',
      leadSources[lead.source]?.name || 'Manual Entry',
      lead.companySize || '',
      lead.revenue || '',
      lead.employeeCount || '',
      lead.website || '',
      lead.linkedinUrl || '',
      lead.city || '',
      lead.state || '',
      lead.industry || '',
      lead.lastContact || '',
      lead.lastContactDate || '',
      lead.createdDate || '',
      lead.importedAt || '',
      (lead.notes || '').replace(/\n/g, ' | '),
      research.timestamp ? 'Yes' : 'No',
      research.priorityLevel || '',
      research.companyOverview || '',
      research.salesforceLikelihood || '',
      research.recommendedOpening || '',
      commHistory
    ];

    return values.map(escapeCSVValue).join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}
