import { generateAccountNumber } from "@/helpers/accountNumberGenerator";
import { describe, expect, it } from "vitest";

describe("Random Account Number Generator Tests", () => {
  it("should generate unique account numbers", () => {
    const accountNumbers = new Set<string>();
    const iterations = 10000;

    for (let i = 0; i < iterations; i++) {
      const accountNumber = generateAccountNumber();
      expect(accountNumber).toHaveLength(16); // Assuming account number length is 15 + 1 check digit
      accountNumbers.add(accountNumber);
    }

    expect(accountNumbers.size).toBe(iterations); // All generated numbers should be unique
  });

  it("should generate account numbers starting with the correct BIN", () => {
    const BIN = "69420"; // The BIN we set in the generator

    for (let i = 0; i < 1000; i++) {
      const accountNumber = generateAccountNumber();
      expect(accountNumber.startsWith(BIN)).toBe(true);
    }
  });
  
});
