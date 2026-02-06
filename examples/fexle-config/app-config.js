/**
 * @module examples/fexle-config/app-config
 * @description Complete Fexle Services example configuration
 *
 * PURPOSE:
 * - Reference implementation showing all configurable fields
 * - Copy this file to config/app-config.js and customize for your company
 *
 * USAGE:
 * 1. Copy this file: cp examples/fexle-config/app-config.js config/app-config.js
 * 2. Edit the values to match your company
 * 3. Remove sections you don't need (defaults will apply)
 *
 * CLAUDE NOTES:
 * - All sections are optional — omit or leave empty for defaults
 * - Deep merge is used: nested properties merge, arrays replace
 * - This is the Fexle-specific config as a complete reference
 * - Script overrides support tokens: {COMPANY}, {TAGLINE}, {COST_ADVANTAGE}, {STATUS}, {MODEL}, {SIZE}
 */
window.APP_CONFIG = {
  company: {
    name: "Fexle Services",
    tagline: "Australia's Most Cost-Effective Salesforce Implementation Partner",
    size: "300+ Salesforce Professionals",
    locations: ["Sydney", "Melbourne", "Gold Coast"],
    model: "Hybrid onshore-offshore - Australian leadership, global development capacity",
    costAdvantage: "30-40% lower cost than traditional consultancies",
    status: "Salesforce Platinum Partner",
    parentCompany: "Xoriant (since 2024)",
    website: "www.fexle.com",
    contactEmail: "contact@fexle.com",
    keyProducts: ["Agentforce", "Einstein Copilot", "Data Cloud", "Sales Cloud", "Service Cloud"],
    proofPoints: [
      "One client cut support ticket volume by 40% in 8 weeks",
      "213% ROI achieved by Wiley Publishing",
      "70% autonomous resolution during peak tax season (1-800-Accountant)",
      "84% faster resolution times",
      "700+ successful implementations"
    ],
    aiDeck: "AI Implementation Deck - practical guide on implementing Salesforce AI with real business impact",

    // Key Differentiators section stats
    stats: [
      { value: "300+", label: "Salesforce Professionals" },
      { value: "30-40%", label: "Lower Cost" },
      { value: "700+", label: "Implementations" }
    ],

    // "Why Us" cheat sheet - services grid
    services: [
      { icon: "\u2601\ufe0f", name: "Salesforce", detail: "Platinum Partner", bg: "#dbeafe", nameColor: "#1e40af", detailColor: "#3b82f6" },
      { icon: "\ud83d\uded2", name: "E-Commerce", detail: "B2B & B2C", bg: "#dcfce7", nameColor: "#166534", detailColor: "#22c55e" },
      { icon: "\ud83d\udcf1", name: "Mobile Apps", detail: "iOS & Android", bg: "#fef3c7", nameColor: "#92400e", detailColor: "#d97706" },
      { icon: "\ud83d\udcbb", name: "Web Dev", detail: "Full-Stack", bg: "#f3e8ff", nameColor: "#7c3aed", detailColor: "#a855f7" }
    ],

    // "Why Us" cheat sheet header
    whyUsTitle: "Fexle Services \u2014 Full-Stack System Integrator",
    whyUsSubtitle: "Salesforce \u2022 E-Commerce \u2022 Web & Mobile \u2022 Custom Development",
    whyUsStats: [
      { value: "700+", label: "Projects" },
      { value: "500+", label: "Clients" },
      { value: "5.0\u2605", label: "Rating" }
    ],

    // Collateral PDF filenames (shown in email attachment reminders)
    collateral: {
      salesforcePdf: "Your-Customers-Wont-Wait-Neither-Should-You.pdf",
      generalPdf: "How-to-Succeed-with-AI-Implementation.pdf",
      salesforceGuideName: "Agentforce Guide",
      generalGuideName: "AI Success Guide"
    }
  },

  // scripts: {
  //   // Override call scripts here — see config/scripts.json for structure
  //   // Only include the keys you want to override
  // },

  // verticals: {
  //   // Override or add verticals here — see config/verticals.json for structure
  //   // Only include verticals you want to override or add
  // },

  // scoring: {
  //   // Override scoring weights — see SCORING_WEIGHTS in index.html for defaults
  // },

  // targetActions: {
  //   default: {
  //     type: 'meeting',
  //     label: 'CEO Meeting',
  //     shortLabel: 'CEO Meeting',
  //     buttonText: 'Schedule CEO Meeting',
  //     description: '20-minute conversation with our CEO',
  //     duration: 20,
  //     icon: '\ud83d\udcc5',
  //     hostTitle: 'CEO',
  //     hostDescription: 'our CEO'
  //   }
  // },

  // emailTemplates: {
  //   // Override email templates by key — see emailTemplates in index.html for all keys
  //   // Example:
  //   // coldOutreach: { name: "...", subject: "...", description: "...", body: "..." }
  // }
};
