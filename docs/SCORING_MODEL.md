# Lead Scoring Model

This document explains the lead scoring methodology used by the Fexle Sales Engine.

## Overview

Every lead receives an automated score from **0-100** based on how well they match Fexle's Ideal Customer Profile (ICP). Higher scores indicate better fit and should be prioritized.

## Scoring Components

The score is calculated from five weighted components:

| Component | Max Points | Weight |
|-----------|------------|--------|
| Company Size | 20 | 20% |
| Revenue | 20 | 20% |
| Title/Role | 25 | 25% |
| Intent Signals | 20 | 20% |
| Vertical Fit | 15 | 15% |
| **Total** | **100** | **100%** |

---

## Component Details

### 1. Company Size (Max 20 Points)

Based on employee count. Mid-market companies (201-500) score highest as they have budget but still value cost-effective partners.

| Employee Count | Points | Rationale |
|----------------|--------|-----------|
| 1-50 | 5 | Too small, limited budget |
| 51-200 | 15 | Growing, good fit |
| **201-500** | **20** | **Sweet spot** - best fit for Fexle |
| 501-1000 | 15 | Good fit, more process |
| 1000+ | 10 | Enterprise, longer cycles |

### 2. Revenue (Max 20 Points)

Based on annual revenue. Companies with $50M-$200M typically have CRM budget and complexity needs.

| Revenue Range | Points | Rationale |
|---------------|--------|-----------|
| Under $5M | 5 | Limited budget |
| $5M-$20M | 10 | Growing, budget forming |
| $20M-$50M | 15 | Good budget, needs CRM |
| **$50M-$200M** | **20** | **Sweet spot** - ideal budget |
| $200M+ | 15 | Enterprise, more vendors |

### 3. Title/Role (Max 25 Points)

Decision-maker level. C-suite executives can approve projects; managers need approval chains.

| Title | Points | Rationale |
|-------|--------|-----------|
| **CEO, MD, Founder** | **25** | Ultimate decision maker |
| COO, CIO, CTO | 22 | Key influencer/decision maker |
| CFO | 20 | Budget holder |
| VP, Vice President | 18 | Senior influencer |
| Director, Head of | 15 | Department leader |
| Manager | 10 | Implementer, needs approval |
| Other | 5 | May not have authority |

### 4. Intent Signals (Max 20 Points)

Behavioral signals indicating active buying interest. Multiple signals can stack.

| Signal | Points | Detection |
|--------|--------|-----------|
| Hiring Salesforce roles | 10 | Job postings for SF Admin/Dev |
| Researching CRM | 8 | G2/Capterra activity, content downloads |
| Recent funding | 7 | Series A+, PE investment |
| New executive | 5 | New CIO/CTO in last 6 months |
| Expansion/hiring | 5 | General hiring activity |
| Tech stack match | 5 | Using Salesforce competitors |

**Note**: Intent signals are capped at 20 points total (not 40).

### 5. Vertical Fit (Max 15 Points)

How well the industry matches Fexle's expertise and case studies.

| Vertical | Points | Rationale |
|----------|--------|-----------|
| **Healthcare** | **15** | Strong case studies, ACHS compliance |
| **Financial Services** | **15** | APRA compliance, wealth management |
| Manufacturing | 12 | Good fit, ERP integration |
| Professional Services | 12 | Law firms, accounting, consulting |
| Retail | 10 | B2C Salesforce expertise |
| Education | 10 | University/school systems |
| Real Estate | 10 | Property management |
| Logistics | 10 | Field service, transport |
| Nonprofit | 8 | Budget constraints |
| Government | 8 | Long procurement cycles |
| Hospitality | 8 | Seasonal, budget sensitive |

---

## Score Calculation

### Formula

```javascript
function calculateLeadScore(lead) {
  let score = 0;
  
  // Company Size (0-20)
  score += COMPANY_SIZE_SCORES[lead.companySize] || 10;
  
  // Revenue (0-20)
  score += REVENUE_SCORES[lead.revenue] || 10;
  
  // Title (0-25)
  score += getTitleScore(lead.title);
  
  // Intent Signals (0-20, capped)
  let intentScore = 0;
  if (lead.intentSignals?.hiringSalesforce) intentScore += 10;
  if (lead.intentSignals?.researchingCRM) intentScore += 8;
  if (lead.intentSignals?.recentFunding) intentScore += 7;
  if (lead.intentSignals?.newExecutive) intentScore += 5;
  if (lead.intentSignals?.expansion) intentScore += 5;
  if (lead.intentSignals?.techStackMatch) intentScore += 5;
  score += Math.min(intentScore, 20);
  
  // Vertical Fit (0-15)
  score += VERTICAL_SCORES[lead.vertical] || 8;
  
  // Normalize to 0-100
  return Math.min(Math.round(score), 100);
}
```

### Example Calculations

#### Example 1: Hot Lead (Score: 92)
```
Company: MedTech Solutions
Size: 350 employees (201-500) → 20 points
Revenue: $80M → 20 points
Title: CEO → 25 points
Signals: Hiring SF Admin + New CTO → 15 points (capped at 20)
Vertical: Healthcare → 15 points
------------------------------------------
Total: 95 → Normalized: 92
```

#### Example 2: Warm Lead (Score: 67)
```
Company: Smith & Partners Legal
Size: 45 employees (1-50) → 5 points
Revenue: $12M → 10 points
Title: Managing Partner → 25 points
Signals: None → 0 points
Vertical: Professional Services → 12 points
------------------------------------------
Total: 52 → Normalized: 67
```

#### Example 3: Cool Lead (Score: 43)
```
Company: Local Retail Store
Size: 25 employees → 5 points
Revenue: $3M → 5 points
Title: IT Manager → 10 points
Signals: None → 0 points
Vertical: Retail → 10 points
------------------------------------------
Total: 30 → Normalized: 43
```

---

## Score Interpretation

### Priority Tiers

| Score Range | Priority | Color | Action |
|-------------|----------|-------|--------|
| **80-100** | 🔥 Hot | Red/Orange | Call immediately, same day |
| **60-79** | ⚡ Warm | Yellow | Call within 48 hours |
| **40-59** | 🌱 Cool | Green | Email first, nurture |
| **0-39** | ❄️ Cold | Gray | Deprioritize, may not be ICP |

### Call Order Strategy

1. Start each day with **80+ score** leads
2. Move to **60-79** leads mid-morning
3. Use afternoon for **40-59** lead emails
4. Review **<40** leads weekly for potential upgrades

---

## Improving Scores

### Data Enrichment

Scores improve with more data. Ways to enrich:

1. **Apollo.io Import** - Includes company size, revenue, intent
2. **AI Research** - Discovers signals from public data
3. **Manual Entry** - Add info learned during calls
4. **LinkedIn Research** - Verify titles, company info

### Score Recalculation

Scores recalculate automatically when:
- Lead data is updated
- New fields are added
- Lead is imported from Apollo

---

## Customizing the Model

### Adjusting Weights

To customize for your market, modify the scoring constants:

```javascript
const SCORING_WEIGHTS = {
  companySize: {
    '1-50': 5,      // Increase if targeting SMB
    '51-200': 15,
    '201-500': 20,  // Decrease if not sweet spot
    '501-1000': 15,
    '1000+': 10
  },
  // ... other weights
};
```

### Adding New Signals

To add new intent signals:

```javascript
intentSignals: {
  hiringSalesforce: 10,
  researchingCRM: 8,
  recentFunding: 7,
  newExecutive: 5,
  expansion: 5,
  techStackMatch: 5,
  // Add new signals:
  attendedWebinar: 8,
  downloadedContent: 6,
  visitedPricingPage: 7
}
```

---

## Score Analytics

### Tracking Score Effectiveness

Monitor these metrics to validate scoring:

| Metric | Target | How to Calculate |
|--------|--------|------------------|
| Conversion by Score | Higher scores → Higher conversion | Meetings / Leads by score tier |
| Call-to-Meeting | 80+ leads should convert 3x better | Meetings / Calls by score |
| Revenue by Score | 80+ leads should yield higher deals | ARR / Leads by score |

### Quarterly Review

Every quarter, analyze:

1. **Which scores converted best?** - Adjust weights accordingly
2. **What signals predicted success?** - Add/weight those signals
3. **What profiles failed?** - Lower those scores

---

## Technical Implementation

### Score Display

```javascript
// Color coding
const getScoreColor = (score) => {
  if (score >= 80) return 'bg-red-100 text-red-700';
  if (score >= 60) return 'bg-yellow-100 text-yellow-700';
  if (score >= 40) return 'bg-green-100 text-green-700';
  return 'bg-gray-100 text-gray-700';
};
```

### Score Breakdown Modal

Users can click any score to see the breakdown:

```javascript
const { score, breakdown } = calculateLeadScore(lead);
// breakdown = {
//   companySize: 20,
//   revenue: 15,
//   title: 25,
//   intent: 12,
//   vertical: 15
// }
```

---

## FAQ

**Q: Why is my lead scored low despite being a big company?**
A: Large companies (1000+) score lower because they typically have longer sales cycles and more vendor competition. The model optimizes for likelihood of close, not just company size.

**Q: Can I manually override scores?**
A: Currently no - scores are calculated automatically. Update the lead's data fields to affect the score.

**Q: How often should I recalculate scores?**
A: Scores recalculate automatically whenever lead data changes. No manual action needed.

**Q: What if my ICP is different from the defaults?**
A: Modify the scoring constants in the code to match your specific ICP.
