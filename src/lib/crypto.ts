import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits recommended for GCM

function getSecretKey(): Buffer {
  const secret = process.env.API_KEY_ENCRYPTION_SECRET;
  if (!secret) {
    // Fallback key for development if not explicitly configured in .env.local
    return crypto.scryptSync("local-seo-saas-dev-secret-key-32chars", "salt", 32);
  }

  // Generate 32-byte key from user secret using scrypt
  return crypto.scryptSync(secret, "local-seo-salt", 32);
}

/**
 * Encrypts a plaintext string (e.g. OpenAI or OpenRouter API key) using AES-256-GCM.
 * Output format: iv:tag:ciphertext (hex encoded)
 */
export function encryptApiKey(plaintext: string): string {
  if (!plaintext) return "";

  const key = getSecretKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  const tag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypts an encrypted API key back to plaintext.
 */
export function decryptApiKey(encryptedData: string): string {
  if (!encryptedData) return "";

  try {
    const parts = encryptedData.split(":");
    if (parts.length !== 3) {
      throw new Error("Invalid encrypted data format");
    }

    const [ivHex, tagHex, ciphertext] = parts;
    const key = getSecretKey();
    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(ciphertext, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Failed to decrypt API key:", error);
    return "";
  }
}

/**
 * Masks an API key for safe UI display (e.g. sk-proj-...3x8A)
 */
export function maskApiKey(key: string): string {
  if (!key) return "";
  if (key.length <= 8) return "••••••••";
  return `${key.slice(0, 6)}••••••••${key.slice(-4)}`;
}
