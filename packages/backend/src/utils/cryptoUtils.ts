const ENCRYPTION_KEY = 'E8A9F0B3C1D2E3F4A5B6C7D8E9F0A1B2';

/**
 * Imports the raw key as a CryptoKey for AES-GCM.
 */
async function getEncryptionKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey('raw', enc.encode(ENCRYPTION_KEY), 'AES-GCM', false, ['encrypt', 'decrypt']);
}

/**
 * Encrypts a given plaintext string using AES-GCM.
 * Returns a base64 encoded string containing the IV and ciphertext.
 */
export async function encryptText(plainText: string): Promise<string> {
  const key = await getEncryptionKey();
  // Generate a random 12-byte IV
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plainText);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);

  // Combine IV and ciphertext into one Uint8Array
  const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.byteLength);

  // Convert combined bytes to base64 string
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypts a base64 encoded string (containing IV + ciphertext) using AES-GCM.
 */
export async function decryptText(encryptedText: string): Promise<string> {
  const key = await getEncryptionKey();
  // Convert base64 string back to a Uint8Array
  const combined = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0));

  // Extract the IV (first 12 bytes) and ciphertext (rest)
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const decryptedBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return new TextDecoder().decode(decryptedBuffer);
}
