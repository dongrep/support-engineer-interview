import { decryptSSN, encryptSSN } from '@/helpers/ssnEncryption';
import { describe, it, expect } from 'vitest';


describe('SSN Encryption Tests', () => {
  it('should encrypt an SSN correctly', () => {
    const ssn = '123456789';
    const encryptedSSN = encryptSSN(ssn);
    expect(encryptedSSN).not.toBe(ssn);
    expect(typeof encryptedSSN).toBe('string');
  });

  it('should decrypt an encrypted SSN back to the original', () => {
    const ssn = '123456789';
    const encryptedSSN = encryptSSN(ssn);
    const decryptedSSN = decryptSSN(encryptedSSN);
    expect(decryptedSSN).toBe(ssn);
  });

  it('should throw an error when encrypting an invalid SSN', () => {
    const invalidSSN = 'invalid-ssn';
    expect(() => encryptSSN(invalidSSN)).toThrow();
  });

  it('should throw an error when decrypting an invalid encrypted string', () => {
    const invalidEncryptedString = 'invalid-encrypted-string';
    expect(() => decryptSSN(invalidEncryptedString)).toThrow();
  });
});
