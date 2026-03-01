/**
 * @module constants/phone-formats
 * @description Phone number format patterns for multi-country support
 *
 * PURPOSE:
 * - Define regex patterns for validating phone numbers by country
 * - Store country codes for E.164 formatting
 * - Support AU, US, CA, UK phone formats
 *
 * EXPORTS:
 * - PHONE_FORMATS - Country-specific phone format configuration
 * - CANADA_AREA_CODES - List of Canadian area codes to distinguish from US
 *
 * PATTERNS:
 * - Patterns expect digits only (no spaces, dashes, parentheses)
 * - AU mobile: 04XX XXX XXX (10 digits starting with 04)
 * - AU landline: 0X XXXX XXXX (10 digits starting with 02/03/07/08)
 * - US/CA: 10 digits (area code + 7-digit number)
 * - UK mobile: 07XXX XXXXXX (11 digits starting with 07)
 *
 * CLAUDE NOTES:
 * - US and CA share +1 country code, distinguished by area code
 * - Business numbers (1300, 1800, 0800) have special patterns
 * - detectPhoneCountry uses these patterns for auto-detection
 */

export const PHONE_FORMATS = {
  AU: {
    code: '+61',
    patterns: {
      mobile: /^04\d{8}$/,
      landline: /^0[2378]\d{8}$/,
      business: /^1[38]00\d{6}$|^13\d{4}$/
    }
  },
  US: {
    code: '+1',
    patterns: {
      mobile: /^[2-9]\d{9}$/,
      landline: /^[2-9]\d{9}$/,
      business: /^8[0-9]{2}[2-9]\d{6}$/
    }
  },
  CA: {
    code: '+1',
    patterns: {
      mobile: /^[2-9]\d{9}$/,
      landline: /^[2-9]\d{9}$/
    }
  },
  UK: {
    code: '+44',
    patterns: {
      mobile: /^07\d{9}$/,
      landline: /^0[1-9]\d{8,9}$/,
      business: /^0800\d{6,7}$|^0808\d{6,7}$/
    }
  }
};

// Canadian area codes for distinguishing from US numbers
export const CANADA_AREA_CODES = [
  '204', '226', '236', '249', '250', '289', '306', '343', '365',
  '403', '416', '418', '431', '437', '438', '450',
  '506', '514', '519', '579', '581', '587',
  '604', '613', '639', '647', '672',
  '705', '709', '778', '780', '782',
  '807', '819', '825', '867', '873',
  '902', '905'
];
