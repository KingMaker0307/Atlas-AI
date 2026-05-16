import type { EncryptedSecret } from "@/types/domain";

const DEVICE_SECRET_KEY = "atlas.deviceSecret.v1";
const EXPORT_SALT_PREFIX = "atlas-export-v1";

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes as Uint8Array<ArrayBuffer>;
}

function randomBase64(length = 32): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytesToBase64(bytes);
}

function getDeviceSecret(): string {
  if (typeof window === "undefined") {
    return "server-placeholder";
  }

  const existing = localStorage.getItem(DEVICE_SECRET_KEY);
  if (existing) return existing;

  const next = randomBase64(32);
  localStorage.setItem(DEVICE_SECRET_KEY, next);
  return next;
}

async function deriveKey(secret: string, salt: string): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode(salt),
      iterations: 160000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptString(value: string): Promise<EncryptedSecret> {
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  const key = await deriveKey(getDeviceSecret(), "atlas-api-key-v1");
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(value),
  );

  return {
    iv: bytesToBase64(iv),
    data: bytesToBase64(new Uint8Array(encrypted)),
  };
}

export async function decryptString(secret?: EncryptedSecret): Promise<string> {
  if (!secret) return "";

  try {
    const key = await deriveKey(getDeviceSecret(), "atlas-api-key-v1");
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: base64ToBytes(secret.iv) },
      key,
      base64ToBytes(secret.data),
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    return "";
  }
}

export async function encryptForExport(
  payload: unknown,
  passphrase: string,
): Promise<string> {
  const iv = new Uint8Array(12);
  const salt = `${EXPORT_SALT_PREFIX}:${randomBase64(16)}`;
  crypto.getRandomValues(iv);
  const key = await deriveKey(passphrase, salt);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(JSON.stringify(payload)),
  );

  return JSON.stringify(
    {
      format: "atlas-ai-coach-export",
      version: 1,
      encryptedAt: new Date().toISOString(),
      salt,
      iv: bytesToBase64(iv),
      data: bytesToBase64(new Uint8Array(encrypted)),
    },
    null,
    2,
  );
}

export async function decryptExport<T>(
  encryptedJson: string,
  passphrase: string,
): Promise<T> {
  const parsed = JSON.parse(encryptedJson) as {
    format: string;
    salt: string;
    iv: string;
    data: string;
  };

  if (parsed.format !== "atlas-ai-coach-export") {
    throw new Error("This is not an Atlas AI Coach export.");
  }

  const key = await deriveKey(passphrase, parsed.salt);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(parsed.iv) },
    key,
    base64ToBytes(parsed.data),
  );

  return JSON.parse(new TextDecoder().decode(decrypted)) as T;
}
