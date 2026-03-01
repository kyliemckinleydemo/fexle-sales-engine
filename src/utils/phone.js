/**
 * @module utils/phone
 * @description Phone number formatting and validation for multi-country support
 *
 * PURPOSE:
 * - Detect country from phone number pattern
 * - Format phone numbers for tel: links (E.164 format)
 * - Format phone numbers for human-readable display
 * - Validate phone numbers by country
 *
 * DEPENDENCIES:
 * - ../constants/phone-formats.js - PHONE_FORMATS, CANADA_AREA_CODES
 *
 * EXPORTS:
 * - detectPhoneCountry - Auto-detect country from phone number
 * - formatPhoneForTel - Format for tel: href (E.164)
 * - formatPhoneDisplay - Format for human-readable display
 * - validatePhone - Validate phone number for country
 * - formatPhoneE164 - Strict E.164 format for Twilio API
 * - isValidE164 - Validate E.164 format
 * - parsePhone - Parse phone and return all formats
 *
 * PATTERNS:
 * - All functions handle null/undefined input gracefully
 * - detectPhoneCountry returns null if country cannot be determined
 * - formatPhoneForTel returns original phone if format not recognized
 *
 * CLAUDE NOTES:
 * - US and CA are distinguished by area code lookup
 * - AU mobile starts with 04, landline with 02/03/07/08
 * - UK mobile starts with 07 (11 digits)
 */

import { PHONE_FORMATS, CANADA_AREA_CODES } from '../constants/phone-formats.js';

/**
 * Detect country from phone number pattern
 * @param {string} phone - Phone number (any format)
 * @returns {string|null} Country code (AU, US, CA, UK) or null
 */
export function detectPhoneCountry(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');

  // Check international format first
  if (digits.startsWith('61')) return 'AU';
  if (digits.startsWith('44')) return 'UK';
  if (digits.startsWith('1') && digits.length === 11) {
    // US or CA - check area code
    const areaCode = digits.substring(1, 4);
    return CANADA_AREA_CODES.includes(areaCode) ? 'CA' : 'US';
  }

  // Check local formats
  if (digits.startsWith('04') && digits.length === 10) return 'AU';
  if (digits.startsWith('0') && digits.length === 10 && /^0[2378]/.test(digits)) return 'AU';
  if (digits.startsWith('07') && digits.length === 11) return 'UK';
  if (digits.startsWith('0') && digits.length >= 10 && digits.length <= 11) return 'UK';
  if (digits.length === 10 && /^[2-9]/.test(digits)) return 'US'; // Default to US for 10-digit

  return null;
}

/**
 * Format phone number for tel: link (E.164 format)
 * @param {string} phone - Phone number (any format)
 * @param {string|null} country - Optional country override
 * @returns {string} E.164 formatted number (e.g., +61412345678)
 */
export function formatPhoneForTel(phone, country = null) {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  const detectedCountry = country || detectPhoneCountry(phone);

  // Already has + prefix
  if (phone.startsWith('+')) {
    return '+' + digits;
  }

  // Handle by country
  switch (detectedCountry) {
    case 'AU':
      // Already international format with 61
      if (digits.startsWith('61') && digits.length >= 11) {
        return '+' + digits;
      }
      // Australian local format (starts with 0)
      if (digits.startsWith('0') && digits.length === 10) {
        return '+61' + digits.substring(1);
      }
      // Business numbers (1300, 1800)
      if (digits.startsWith('1') && (digits.length === 10 || digits.length === 6)) {
        return '+61' + digits;
      }
      break;

    case 'US':
    case 'CA':
      // Already has country code
      if (digits.startsWith('1') && digits.length === 11) {
        return '+' + digits;
      }
      // 10-digit local format
      if (digits.length === 10) {
        return '+1' + digits;
      }
      break;

    case 'UK':
      // Already international format with 44
      if (digits.startsWith('44')) {
        return '+' + digits;
      }
      // UK local format (starts with 0)
      if (digits.startsWith('0') && digits.length >= 10) {
        return '+44' + digits.substring(1);
      }
      break;
  }

  // Return cleaned digits if format not recognized
  return phone.replace(/\s/g, '');
}

/**
 * Format phone number for human-readable display
 * @param {string} phone - Phone number (any format)
 * @param {string|null} country - Optional country override
 * @returns {string} Human-readable format (e.g., 0412 345 678)
 */
export function formatPhoneDisplay(phone, country = null) {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  const detectedCountry = country || detectPhoneCountry(phone);

  switch (detectedCountry) {
    case 'AU':
      // Mobile: 04XX XXX XXX
      if (digits.startsWith('04') || (digits.startsWith('614') && digits.length >= 11)) {
        const num = digits.startsWith('61') ? '0' + digits.substring(2) : digits;
        if (num.length === 10) {
          return `${num.substring(0, 4)} ${num.substring(4, 7)} ${num.substring(7)}`;
        }
      }
      // Landline: 0X XXXX XXXX
      if (digits.startsWith('0') && digits.length === 10) {
        return `${digits.substring(0, 2)} ${digits.substring(2, 6)} ${digits.substring(6)}`;
      }
      break;

    case 'US':
    case 'CA':
      // (XXX) XXX-XXXX
      const usDigits = digits.startsWith('1') ? digits.substring(1) : digits;
      if (usDigits.length === 10) {
        return `(${usDigits.substring(0, 3)}) ${usDigits.substring(3, 6)}-${usDigits.substring(6)}`;
      }
      break;

    case 'UK':
      // 07XXX XXXXXX (mobile) or 0XX XXXX XXXX (landline)
      const ukDigits = digits.startsWith('44') ? '0' + digits.substring(2) : digits;
      if (ukDigits.startsWith('07') && ukDigits.length === 11) {
        return `${ukDigits.substring(0, 5)} ${ukDigits.substring(5)}`;
      }
      if (ukDigits.length >= 10) {
        return `${ukDigits.substring(0, 3)} ${ukDigits.substring(3, 7)} ${ukDigits.substring(7)}`;
      }
      break;
  }

  // Return as-is if no formatting applied
  return phone;
}

/**
 * Validate phone number for a country
 * @param {string} phone - Phone number (any format)
 * @param {string} country - Country code (AU, US, CA, UK)
 * @returns {boolean} True if valid
 */
export function validatePhone(phone, country) {
  if (!phone || !country) return false;
  const digits = phone.replace(/\D/g, '');
  const format = PHONE_FORMATS[country];
  if (!format) return false;

  // Check against patterns
  const patterns = format.patterns;
  return Object.values(patterns).some(pattern => pattern.test(digits));
}

/**
 * Format phone number to strict E.164 format for Twilio
 * E.164 format: +[country code][subscriber number]
 * - Max 15 digits total (including country code)
 * - No spaces, dashes, or other characters
 * @param {string} phone - Phone number (any format)
 * @param {string|null} country - Optional country override
 * @returns {string|null} E.164 formatted number or null if invalid
 */
export function formatPhoneE164(phone, country = null) {
  if (!phone) return null;

  // Remove all non-digit characters except leading +
  const hasPlus = phone.trim().startsWith('+');
  const digits = phone.replace(/\D/g, '');

  if (!digits || digits.length < 7) return null;

  const detectedCountry = country || detectPhoneCountry(phone);

  // If already has + and proper length, just clean it
  if (hasPlus && digits.length >= 10 && digits.length <= 15) {
    return '+' + digits;
  }

  // Format by country
  switch (detectedCountry) {
    case 'AU':
      // International format with 61
      if (digits.startsWith('61') && digits.length >= 11 && digits.length <= 12) {
        return '+' + digits;
      }
      // Australian local format (starts with 0)
      if (digits.startsWith('0') && digits.length === 10) {
        return '+61' + digits.substring(1);
      }
      // 1300/1800 numbers
      if (digits.startsWith('1') && (digits.length === 10 || digits.length === 6)) {
        return '+61' + digits;
      }
      break;

    case 'US':
    case 'CA':
      // Already has country code 1
      if (digits.startsWith('1') && digits.length === 11) {
        return '+' + digits;
      }
      // 10-digit NANP format
      if (digits.length === 10 && /^[2-9]/.test(digits)) {
        return '+1' + digits;
      }
      break;

    case 'UK':
      // International format with 44
      if (digits.startsWith('44') && digits.length >= 11 && digits.length <= 12) {
        return '+' + digits;
      }
      // UK local format (starts with 0)
      if (digits.startsWith('0') && digits.length >= 10 && digits.length <= 11) {
        return '+44' + digits.substring(1);
      }
      break;
  }

  // Fallback: if starts with country code pattern and reasonable length, accept it
  if (digits.length >= 10 && digits.length <= 15) {
    if (digits.startsWith('1') || digits.startsWith('44') || digits.startsWith('61')) {
      return '+' + digits;
    }
  }

  return null;
}

/**
 * Check if a phone number is a valid E.164 format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid E.164 format
 */
export function isValidE164(phone) {
  if (!phone || typeof phone !== 'string') return false;
  // E.164: starts with +, followed by 1-15 digits
  return /^\+[1-9]\d{6,14}$/.test(phone);
}

/**
 * Parse phone number and return all formats
 * @param {string} phone - Phone number (any format)
 * @param {string|null} country - Optional country override
 * @returns {Object} Object with all phone formats
 */
export function parsePhone(phone, country = null) {
  if (!phone) {
    return {
      original: phone,
      e164: null,
      tel: '',
      display: '',
      country: null,
      valid: false
    };
  }

  const detectedCountry = country || detectPhoneCountry(phone);
  const e164 = formatPhoneE164(phone, detectedCountry);

  return {
    original: phone,
    e164,
    tel: formatPhoneForTel(phone, detectedCountry),
    display: formatPhoneDisplay(phone, detectedCountry),
    country: detectedCountry,
    valid: e164 !== null
  };
}
