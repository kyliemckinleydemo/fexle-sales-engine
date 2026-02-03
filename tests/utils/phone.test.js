/**
 * @module tests/utils/phone.test
 * @description Tests for phone number formatting and validation
 */

import { describe, it, expect } from 'vitest';
import {
  detectPhoneCountry,
  formatPhoneForTel,
  formatPhoneDisplay,
  validatePhone
} from '../../src/utils/phone.js';

describe('detectPhoneCountry', () => {
  describe('Australian Numbers', () => {
    it('detects AU mobile from 04XX format', () => {
      expect(detectPhoneCountry('0412345678')).toBe('AU');
      expect(detectPhoneCountry('0498 765 432')).toBe('AU');
    });

    it('detects AU landline from 02 (Sydney) format', () => {
      expect(detectPhoneCountry('0298765432')).toBe('AU');
      expect(detectPhoneCountry('02 9876 5432')).toBe('AU');
    });

    it('detects AU landline from 03 (Melbourne) format', () => {
      expect(detectPhoneCountry('0398765432')).toBe('AU');
    });

    it('detects AU landline from 07 (Brisbane) format', () => {
      expect(detectPhoneCountry('0712345678')).toBe('AU');
    });

    it('detects AU landline from 08 (Perth/Adelaide) format', () => {
      expect(detectPhoneCountry('0812345678')).toBe('AU');
    });

    it('detects AU from +61 international format', () => {
      expect(detectPhoneCountry('+61412345678')).toBe('AU');
      expect(detectPhoneCountry('61412345678')).toBe('AU');
    });
  });

  describe('UK Numbers', () => {
    it('detects UK mobile from 07XXX format', () => {
      expect(detectPhoneCountry('07123456789')).toBe('UK');
      expect(detectPhoneCountry('07700 900123')).toBe('UK');
    });

    it('detects UK from +44 international format', () => {
      expect(detectPhoneCountry('+447123456789')).toBe('UK');
      expect(detectPhoneCountry('447123456789')).toBe('UK');
    });

    it('detects UK landline from 0X format', () => {
      expect(detectPhoneCountry('02071234567')).toBe('UK');
    });
  });

  describe('US Numbers', () => {
    it('detects US from 10-digit format', () => {
      expect(detectPhoneCountry('2025551234')).toBe('US');
      expect(detectPhoneCountry('(202) 555-1234')).toBe('US');
    });

    it('detects US from +1 international format with US area code', () => {
      expect(detectPhoneCountry('+12025551234')).toBe('US');
      expect(detectPhoneCountry('12025551234')).toBe('US');
    });
  });

  describe('Canadian Numbers', () => {
    it('detects CA from +1 with Canadian area code', () => {
      expect(detectPhoneCountry('+14165551234')).toBe('CA'); // Toronto 416
      expect(detectPhoneCountry('14165551234')).toBe('CA');
    });

    it('detects CA for Vancouver area code', () => {
      expect(detectPhoneCountry('+16045551234')).toBe('CA'); // Vancouver 604
    });

    it('detects CA for Montreal area code', () => {
      expect(detectPhoneCountry('+15145551234')).toBe('CA'); // Montreal 514
    });
  });

  describe('Edge Cases', () => {
    it('returns null for empty input', () => {
      expect(detectPhoneCountry('')).toBe(null);
      expect(detectPhoneCountry(null)).toBe(null);
      expect(detectPhoneCountry(undefined)).toBe(null);
    });

    it('returns null for unrecognized format', () => {
      expect(detectPhoneCountry('123')).toBe(null);
      expect(detectPhoneCountry('abcdefghij')).toBe(null);
    });
  });
});

describe('formatPhoneForTel', () => {
  describe('Australian Numbers', () => {
    it('formats AU mobile to E.164', () => {
      expect(formatPhoneForTel('0412345678')).toBe('+61412345678');
      expect(formatPhoneForTel('0412 345 678')).toBe('+61412345678');
    });

    it('formats AU landline to E.164', () => {
      expect(formatPhoneForTel('0298765432')).toBe('+61298765432');
      expect(formatPhoneForTel('02 9876 5432')).toBe('+61298765432');
    });

    it('preserves already formatted +61 numbers', () => {
      expect(formatPhoneForTel('+61412345678')).toBe('+61412345678');
    });

    it('handles international format without +', () => {
      expect(formatPhoneForTel('61412345678')).toBe('+61412345678');
    });
  });

  describe('US Numbers', () => {
    it('formats US 10-digit to E.164', () => {
      expect(formatPhoneForTel('2025551234')).toBe('+12025551234');
      expect(formatPhoneForTel('(202) 555-1234')).toBe('+12025551234');
    });

    it('preserves already formatted +1 numbers', () => {
      expect(formatPhoneForTel('+12025551234')).toBe('+12025551234');
    });

    it('handles 11-digit with country code', () => {
      expect(formatPhoneForTel('12025551234')).toBe('+12025551234');
    });
  });

  describe('UK Numbers', () => {
    it('formats UK mobile to E.164', () => {
      expect(formatPhoneForTel('07123456789')).toBe('+447123456789');
    });

    it('formats UK landline to E.164', () => {
      expect(formatPhoneForTel('02071234567')).toBe('+442071234567');
    });

    it('preserves already formatted +44 numbers', () => {
      expect(formatPhoneForTel('+447123456789')).toBe('+447123456789');
    });
  });

  describe('Canadian Numbers', () => {
    it('formats CA numbers to E.164', () => {
      expect(formatPhoneForTel('4165551234', 'CA')).toBe('+14165551234');
    });
  });

  describe('Edge Cases', () => {
    it('returns empty string for empty input', () => {
      expect(formatPhoneForTel('')).toBe('');
      expect(formatPhoneForTel(null)).toBe('');
    });

    it('returns cleaned number for unrecognized format', () => {
      const result = formatPhoneForTel('123');
      expect(result).not.toContain(' ');
    });

    it('respects country override', () => {
      // Force US formatting for ambiguous number
      expect(formatPhoneForTel('5551234567', 'US')).toBe('+15551234567');
    });
  });
});

describe('formatPhoneDisplay', () => {
  describe('Australian Numbers', () => {
    it('formats AU mobile as 04XX XXX XXX', () => {
      expect(formatPhoneDisplay('0412345678')).toBe('0412 345 678');
      expect(formatPhoneDisplay('+61412345678')).toBe('0412 345 678');
    });

    it('formats AU landline as 0X XXXX XXXX', () => {
      expect(formatPhoneDisplay('0298765432')).toBe('02 9876 5432');
      expect(formatPhoneDisplay('0398765432')).toBe('03 9876 5432');
    });
  });

  describe('US Numbers', () => {
    it('formats US as (XXX) XXX-XXXX', () => {
      expect(formatPhoneDisplay('2025551234')).toBe('(202) 555-1234');
      expect(formatPhoneDisplay('+12025551234')).toBe('(202) 555-1234');
    });

    it('formats 11-digit US as (XXX) XXX-XXXX', () => {
      expect(formatPhoneDisplay('12025551234')).toBe('(202) 555-1234');
    });
  });

  describe('Canadian Numbers', () => {
    it('formats CA as (XXX) XXX-XXXX', () => {
      expect(formatPhoneDisplay('4165551234', 'CA')).toBe('(416) 555-1234');
      expect(formatPhoneDisplay('+14165551234')).toBe('(416) 555-1234');
    });
  });

  describe('UK Numbers', () => {
    it('formats UK mobile as 07XXX XXXXXX', () => {
      expect(formatPhoneDisplay('07123456789')).toBe('07123 456789');
    });

    it('formats UK landline as 0XX XXXX XXXX', () => {
      expect(formatPhoneDisplay('02071234567')).toBe('020 7123 4567');
    });
  });

  describe('Edge Cases', () => {
    it('returns empty string for empty input', () => {
      expect(formatPhoneDisplay('')).toBe('');
      expect(formatPhoneDisplay(null)).toBe('');
    });

    it('returns original for unrecognized format', () => {
      expect(formatPhoneDisplay('123')).toBe('123');
    });
  });
});

describe('validatePhone', () => {
  describe('Australian Numbers', () => {
    it('validates AU mobile numbers', () => {
      expect(validatePhone('0412345678', 'AU')).toBe(true);
      expect(validatePhone('0498765432', 'AU')).toBe(true);
    });

    it('validates AU landline numbers', () => {
      expect(validatePhone('0298765432', 'AU')).toBe(true);
      expect(validatePhone('0398765432', 'AU')).toBe(true);
      expect(validatePhone('0712345678', 'AU')).toBe(true);
      expect(validatePhone('0812345678', 'AU')).toBe(true);
    });

    it('validates AU business numbers', () => {
      expect(validatePhone('1300123456', 'AU')).toBe(true);
      expect(validatePhone('1800123456', 'AU')).toBe(true);
      expect(validatePhone('131234', 'AU')).toBe(true);
    });

    it('rejects invalid AU numbers', () => {
      expect(validatePhone('0512345678', 'AU')).toBe(false); // 05 not valid
      expect(validatePhone('041234567', 'AU')).toBe(false);  // too short
    });
  });

  describe('US Numbers', () => {
    it('validates US numbers', () => {
      expect(validatePhone('2025551234', 'US')).toBe(true);
      expect(validatePhone('5551234567', 'US')).toBe(true);
    });

    it('rejects invalid US numbers', () => {
      expect(validatePhone('0125551234', 'US')).toBe(false); // starts with 0
      expect(validatePhone('1125551234', 'US')).toBe(false); // starts with 1
      expect(validatePhone('12345', 'US')).toBe(false);       // too short
    });
  });

  describe('UK Numbers', () => {
    it('validates UK mobile numbers', () => {
      expect(validatePhone('07123456789', 'UK')).toBe(true);
    });

    it('validates UK landline numbers', () => {
      expect(validatePhone('02071234567', 'UK')).toBe(true);
    });

    it('validates UK business numbers', () => {
      expect(validatePhone('08001234567', 'UK')).toBe(true);
      expect(validatePhone('08081234567', 'UK')).toBe(true);
    });
  });

  describe('Canadian Numbers', () => {
    it('validates CA numbers', () => {
      expect(validatePhone('4165551234', 'CA')).toBe(true);
      expect(validatePhone('6045551234', 'CA')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('returns false for empty input', () => {
      expect(validatePhone('', 'AU')).toBe(false);
      expect(validatePhone(null, 'AU')).toBe(false);
    });

    it('returns false for unknown country', () => {
      expect(validatePhone('0412345678', 'XX')).toBe(false);
    });

    it('returns false for missing country', () => {
      expect(validatePhone('0412345678', null)).toBe(false);
      expect(validatePhone('0412345678', undefined)).toBe(false);
    });

    it('strips non-digits before validation', () => {
      expect(validatePhone('(02) 9876 5432', 'AU')).toBe(true);
      expect(validatePhone('+61 412 345 678', 'AU')).toBe(false); // +61 format not matched by local patterns
      expect(validatePhone('0412-345-678', 'AU')).toBe(true);
    });
  });
});
