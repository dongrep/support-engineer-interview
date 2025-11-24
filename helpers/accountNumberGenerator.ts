import crypto from "crypto";


// 1. Your BIN (Bank Identification Number) - fixed for your institution
const BIN = process.env.BANK_BIN

export function generateAccountNumber() {
  if (!BIN || BIN.length !== 5) {
    throw new Error("Invalid or missing BANK_BIN environment variable");
  }
  
  // 2. Generate cryptographically secure random digits
  const randomPart = crypto.randomInt(1000000000, 9999999999).toString(); // 10 digits
  
  // 3. Combine BIN + random part
  const baseNumber = `${BIN}${randomPart}`;
  
  // 4. Calculate check digit (Luhn algorithm for validation)
  const checkDigit = calculateLuhnCheckDigit(baseNumber);
  
  // 5. Final account number
  return baseNumber + checkDigit;
}

function calculateLuhnCheckDigit(number: string): number {
  let sum = 0;
  let isEven = true;
  
  // Process digits from right to left
  for (let i = number.length - 1; i >= 0; i--) {
    let digit = parseInt(number[i]);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return (10 - (sum % 10)) % 10;
}
