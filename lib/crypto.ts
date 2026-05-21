/**
 * AES-256-GCM encryption for sensitive fields stored in the database
 * (whatsappToken, whatsappAppSecret, instagramToken, emailApiKey, AiProvider.apiKey).
 *
 * Setup:
 *   1. Generate a 32-byte key: `openssl rand -hex 32`
 *   2. Add to .env: FIELD_ENCRYPTION_KEY=<64-char hex string>
 *
 * Migration of existing plain-text values:
 *   Run `npm run db:encrypt` (to be created) which reads each record,
 *   encrypts the value, and writes it back.
 *
 * Format of encrypted string: "<ivHex>:<authTagHex>:<ciphertextHex>"
 * Prefix "enc:" is used to detect already-encrypted values.
 */

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGO = "aes-256-gcm";
const ENC_PREFIX = "enc:";

function getKey(): Buffer {
  const hex = process.env.FIELD_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      "FIELD_ENCRYPTION_KEY must be a 64-character hex string. " +
      "Generate one with: openssl rand -hex 32"
    );
  }
  return Buffer.from(hex, "hex");
}

export function encrypt(plain: string): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ENC_PREFIX + [iv.toString("hex"), tag.toString("hex"), encrypted.toString("hex")].join(":");
}

export function decrypt(stored: string): string {
  if (!stored.startsWith(ENC_PREFIX)) return stored; // plain-text legacy value
  const payload = stored.slice(ENC_PREFIX.length);
  const [ivHex, tagHex, encHex] = payload.split(":");
  if (!ivHex || !tagHex || !encHex) throw new Error("Malformed encrypted value");
  const key = getKey();
  const decipher = createDecipheriv(ALGO, key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return Buffer.concat([
    decipher.update(Buffer.from(encHex, "hex")),
    decipher.final(),
  ]).toString("utf8");
}

/** Returns true if the value is already encrypted. */
export function isEncrypted(value: string): boolean {
  return value.startsWith(ENC_PREFIX);
}
