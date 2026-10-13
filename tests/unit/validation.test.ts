import { describe, expect, it } from 'vitest';
import { isEmail, isIndianMobile, isPincode, mobile10 } from '@/features/validation/india';
import { isValidAadhaar, isValidGstin, isValidIfsc, isValidPan } from '@/features/onboarding/validators';
import { hasValidAadhaar, identityForServer, EMPTY_FORM } from '@/features/recruitment/application';

describe('Indian mobile numbers', () => {
  it('accepts the ways people type a number', () => {
    for (const v of ['9822011001', '+91 98220 11001', '919822011001', '098220-11001']) expect(isIndianMobile(v)).toBe(true);
    expect(mobile10('+91 98220 11001')).toBe('9822011001');
  });
  it('refuses numbers that cannot be Indian mobiles', () => {
    for (const v of ['1234567890', '5822011001', '98220110', '98220110011', '']) expect(isIndianMobile(v)).toBe(false);
  });
  it('does not strip a 91 that is part of a ten-digit number', () => {
    expect(mobile10('9198765432')).toBe('9198765432');
    expect(isIndianMobile('9198765432')).toBe(true);
  });
});

describe('PIN code and email', () => {
  it('needs six digits not starting with 0', () => {
    expect(isPincode('411057')).toBe(true);
    expect(isPincode('011057')).toBe(false);
    expect(isPincode('41105')).toBe(false);
  });
  it('checks the shape of an email', () => {
    expect(isEmail('a@b.in')).toBe(true);
    expect(isEmail('a@b')).toBe(false);
  });
});

describe('identity numbers', () => {
  it('checks the Aadhaar checksum (Verhoeff), not only the length', () => {
    expect(isValidAadhaar('234567890124')).toBe(true);
    expect(isValidAadhaar('234567890125')).toBe(false);
  });
  it('checks PAN, IFSC and GSTIN formats', () => {
    expect(isValidPan('ABCDE1234F')).toBe(true);
    expect(isValidPan('ABCD1234F')).toBe(false);
    expect(isValidIfsc('HDFC0001234')).toBe(true);
    expect(isValidIfsc('HDFC1001234')).toBe(false);
    expect(isValidGstin('27AABCV1234A1Z5')).toBe(true);
    expect(isValidGstin('27AABCV1234A1Y5')).toBe(false);
  });
});

describe('Aadhaar never leaves the phone in full', () => {
  const base = EMPTY_FORM.identity;
  it('reduces a typed number to its last four digits and a checksum flag', () => {
    const out = identityForServer({ ...base, aadhaarNumber: '2345 6789 0124' });
    expect(out).toMatchObject({ aadhaarNumber: '', aadhaarLast4: '0124', aadhaarChecked: true });
  });
  it('keeps what is on file when nothing new was typed', () => {
    const out = identityForServer({ ...base, aadhaarLast4: '0124', aadhaarChecked: true });
    expect(out).toMatchObject({ aadhaarLast4: '0124', aadhaarChecked: true });
    expect(hasValidAadhaar(out)).toBe(true);
  });
  it('clears the record when a half-typed number replaces it', () => {
    const out = identityForServer({ ...base, aadhaarNumber: '2345', aadhaarLast4: '0124', aadhaarChecked: true });
    expect(out).toMatchObject({ aadhaarNumber: '', aadhaarLast4: '', aadhaarChecked: false });
  });
});
