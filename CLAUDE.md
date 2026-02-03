# fexle-sales-engine

A cold calling platform built with Google Apps Script integration for sales automation and lead management.

## Tech Stack

| Component | Technology | Notes |
|-----------|------------|-------|
| Frontend | React | Web application framework |
| Styling | Tailwind CSS | Utility-first CSS framework |
| Automation | Google Apps Script | Server-side automation and integrations |
| Language | JavaScript | Primary development language |

## Project Structure

```
fexle-sales-engine/
├── scripts/
│   └── google-apps-script.js     # Google Apps Script automation logic
└── (React app structure inferred)
```

## Key Types & Data Models

*Note: No TypeScript interfaces found in provided samples. Data models would be inferred from Google Apps Script integration and typical sales platform requirements.*

Expected data models likely include:
- Lead/Contact information
- Call records and outcomes
- Sales pipeline stages
- Campaign tracking data

## Commands

```bash
# Standard React development commands (package.json not provided)
npm start          # Start development server
npm run build      # Build for production
npm test           # Run tests
npm run deploy     # Deploy application
```

## Module Documentation Format

```javascript
/**
 * @module ModuleName
 * @description Brief description of the module's purpose
 */
```

## Code Patterns

- **Google Apps Script Integration**: Uses server-side Google Apps Script for automation
- **React Component Architecture**: Modern functional component approach expected
- **Tailwind Styling**: Utility-first CSS approach for responsive design
- **Cold Calling Workflow**: Platform designed for systematic cold calling processes
- **Sales Automation**: Integration with Google services for lead management

## Key Integrations

- **Google Apps Script**: Primary integration for automation and data processing
- **Google Workspace**: Likely integration with Gmail, Sheets, and Calendar for sales workflow
- **React Ecosystem**: Standard React tooling and component libraries

## Architectural Decisions

1. **Google Apps Script Backend**: Chosen for seamless integration with Google Workspace tools, enabling automated email sequences, calendar scheduling, and data synchronization with Google Sheets for lead tracking.

2. **React + Tailwind Frontend**: Modern web stack selection provides responsive design capabilities and component reusability essential for sales dashboard interfaces and call management workflows.

3. **JavaScript Monolingual Approach**: Single language across frontend and Google Apps Script backend reduces complexity and enables code sharing between client and server automation logic.

## CLAUDE NOTES

### Google Apps Script Integration
- The `scripts/google-apps-script.js` file contains the core automation logic
- Likely handles lead import/export, email automation, and CRM synchronization
- May include triggers for automated follow-ups and call scheduling

### Sales Platform Considerations
- Cold calling platforms typically require lead scoring and prioritization
- Call outcome tracking and follow-up automation are critical features
- Integration with phone systems or VoIP services may be implemented

### Development Workflow
- Google Apps Script deployment requires Google account and Apps Script project setup
- React build process needs to coordinate with Google Apps Script deployment
- Environment configuration for Google API credentials and permissions

### Data Flow
- Lead data likely flows from Google Sheets → Apps Script → React frontend
- Call outcomes and notes flow back through the same pipeline
- Automated sequences triggered by Google Apps Script based on call results