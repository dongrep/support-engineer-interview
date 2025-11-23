export const isValidAge = (dob: string, minAge: number = 18): boolean => {
  const date = new Date(dob);
  const today = new Date();
  const age = today.getFullYear() - date.getFullYear();
  const isOldEnough = age > minAge || (age === minAge && today >= new Date(date.setFullYear(date.getFullYear() + minAge)));
  return isOldEnough;
}
