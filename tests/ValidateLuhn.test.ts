import { validateLuhn } from "@/helpers/luhnCheck";
import { describe, expect, it } from "vitest";

describe("Luhn Validation Tests", () => {
  it("should validate a correct card number", () => {
    const validCardNumber = "4539 1488 0343 6467"; // Valid Visa card number
    const isValid = validateLuhn(validCardNumber);
    expect(isValid).toBe(true);
  });

  it("should invalidate an incorrect card number", () => {
    const invalidCardNumber = "1234 5678 9012 3456"; // Invalid card number
    const isValid = validateLuhn(invalidCardNumber);
    expect(isValid).toBe(false);
  });

  it("should invalidate a card number with non-digit characters", () => {
    const invalidCardNumber = "4539-1488-0343-646X"; // Invalid due to 'X'
    const isValid = validateLuhn(invalidCardNumber);
    expect(isValid).toBe(false);
  });

  it("should invalidate a card number that is too short", () => {
    const shortCardNumber = "1234567"; // Too short
    const isValid = validateLuhn(shortCardNumber);
    expect(isValid).toBe(false);
  });

  it("should invalidate a card number that is too long", () => {
    const longCardNumber = "12345678901234567890";
    const isValid = validateLuhn(longCardNumber);
    expect(isValid).toBe(false);
  });
});
