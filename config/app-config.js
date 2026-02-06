/**
 * @module config/app-config
 * @description Runtime application configuration for white-label deployments
 *
 * PURPOSE:
 * - Override default company info, scripts, verticals, scoring, and email templates
 * - Enable full white-label capability without modifying index.html
 * - Follow same pattern as config/supabase.js (loaded via script tag)
 *
 * EXPORTS:
 * - window.APP_CONFIG - Global config object merged over hardcoded defaults
 *
 * PATTERNS:
 * - Edit this file to customize the sales engine for your company
 * - Leave sections empty or omit them to use defaults
 * - See examples/fexle-config/app-config.js for a complete reference
 * - Partial overrides work: set only what you want to change
 *
 * SECTIONS:
 * - company: Company name, tagline, stats, proof points, etc.
 * - scripts: Call scripts (openings, pivots, closes, objections)
 * - verticals: Industry vertical definitions (merged over defaults)
 * - scoring: Lead scoring weights
 * - targetActions: Default target action configuration
 * - emailTemplates: Email template overrides
 *
 * LAYERING ORDER:
 *   APP_CONFIG (this file) → hardcoded defaults → vertical overrides → org config
 *
 * TOKENS (for scripts, verticals, and email overrides):
 * - {COMPANY} → company.name
 * - {TAGLINE} → company.tagline
 * - {COST_ADVANTAGE} → company.costAdvantage
 * - {STATUS} → company.status
 * - {MODEL} → company.model
 * - {SIZE} → company.size
 *
 * CLAUDE NOTES:
 * - This file is loaded via script tag before index.html app code
 * - All sections are optional — omit or leave empty for defaults
 * - Deep merge is used: nested properties merge, arrays replace
 * - For a complete Fexle example, see examples/fexle-config/app-config.js
 */
window.APP_CONFIG = {
  // company: {
  //   name: "Your Company",
  //   tagline: "Your tagline here",
  //   size: "Team size description",
  //   locations: ["City 1", "City 2"],
  //   model: "Your delivery model description",
  //   costAdvantage: "Your cost advantage",
  //   status: "Your partner status",
  //   parentCompany: "",
  //   website: "https://yourcompany.com",
  //   contactEmail: "contact@yourcompany.com",
  //   keyProducts: ["Product 1", "Product 2"],
  //   proofPoints: [
  //     "Proof point 1",
  //     "Proof point 2"
  //   ],
  //   aiDeck: "Description of your leave-behind collateral",
  //   // Stats shown in Key Differentiators section
  //   stats: [
  //     { value: "100+", label: "Professionals" },
  //     { value: "20-30%", label: "Lower Cost" },
  //     { value: "500+", label: "Implementations" }
  //   ],
  //   // Services grid shown in "Why Us" section
  //   services: [
  //     { icon: "☁️", name: "Cloud", detail: "Partner", bg: "#dbeafe", nameColor: "#1e40af", detailColor: "#3b82f6" },
  //     { icon: "🛒", name: "E-Commerce", detail: "B2B & B2C", bg: "#dcfce7", nameColor: "#166534", detailColor: "#22c55e" }
  //   ],
  //   // "Why Us" section header
  //   whyUsTitle: "Your Company — Your Tagline",
  //   whyUsSubtitle: "Service 1 • Service 2 • Service 3",
  //   // "Why Us" section top stats
  //   whyUsStats: [
  //     { value: "500+", label: "Projects" },
  //     { value: "300+", label: "Clients" },
  //     { value: "5.0★", label: "Rating" }
  //   ],
  //   // Collateral PDF filenames (shown in email attachment reminders)
  //   collateral: {
  //     salesforcePdf: "Your-Guide-Name.pdf",
  //     generalPdf: "Your-General-Guide.pdf",
  //     salesforceGuideName: "Platform Guide",
  //     generalGuideName: "AI Success Guide"
  //   }
  // },

  // scripts: {
  //   openings: { ... },
  //   pivots: { ... },
  //   closes: { ... },
  //   objections: { ... },
  //   followUp: { ... },
  //   keyMessages: [ ... ]
  // },

  // verticals: {
  //   // Override existing or add new verticals
  //   // healthcare: { name: "Healthcare", ... }
  // },

  // scoring: {
  //   companySize: { ... },
  //   revenue: { ... },
  //   titleScore: { ... },
  //   intentSignals: { ... },
  //   verticalFit: { ... }
  // },

  // targetActions: {
  //   default: {
  //     type: 'meeting',
  //     label: 'CEO Meeting',
  //     ...
  //   }
  // },

  // emailTemplates: {
  //   // Override any email template by key
  //   // aiDeck: { name: "...", subject: "...", body: "..." }
  // }
};
