export function validateLuhn(cardNumber: string): boolean {
  // Remove spaces and dashes
  const digits = cardNumber.replace(/[\s-]/g, '');
  
  // Must be all digits
  if (!/^\d+$/.test(digits)) {
    return false;
  }
  
  // Must be at least 13 digits (some cards are 13-19 digits)
  if (digits.length < 13 || digits.length > 19) {
    return false;
  }
  
  let sum = 0;
  let isEven = false;
  
  // Loop from right to left
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
}
