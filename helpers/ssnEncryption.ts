import crypto from "crypto"
const ENCRYPTION_KEY = process.env.SSN_ENCRYPTION_KEY 

export const encryptSSN = (ssn: string): string => {
  if (!ENCRYPTION_KEY) {
    throw new Error("Encryption key not set");
  }

  if (!/^\d{9}$/.test(ssn)) {
    throw new Error("Invalid SSN format");
  }

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY, "hex"),
    iv
  );
  let encrypted = cipher.update(ssn, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

export const decryptSSN = (encryptedSSN: string): string => {
  if (!ENCRYPTION_KEY) {
    throw new Error("Encryption key not set");
  }

  const parts = encryptedSSN.split(":");
  const iv = Buffer.from(parts.shift() || "", "hex");
  const encryptedText = parts.join(":");
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY, "hex"),
    iv
  );
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
