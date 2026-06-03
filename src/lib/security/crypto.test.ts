import { describe, it, expect } from "vitest";
import {
  encryptString,
  decryptString,
  encryptForExport,
  decryptExport,
  getDeviceSecretValue,
  setDeviceSecretValue,
} from "./crypto";

// Ensure Web Crypto API is available globally in Node.js environment
import { webcrypto } from "node:crypto";
if (!globalThis.crypto) {
  Object.defineProperty(globalThis, "crypto", {
    value: webcrypto,
    writable: true,
  });
}

describe("security/crypto.ts utilities", () => {
  describe("Device Secret", () => {
    it("should return server-placeholder when window/localStorage is undefined", () => {
      // In Node.js unit tests, window is undefined
      expect(getDeviceSecretValue()).toBe("server-placeholder");
    });
  });

  describe("encryptString and decryptString", () => {
    it("should encrypt and decrypt a string successfully", async () => {
      const originalText = "my-secret-api-key-12345";
      const encrypted = await encryptString(originalText);
      
      expect(encrypted).toBeDefined();
      expect(encrypted.iv).toBeTypeOf("string");
      expect(encrypted.data).toBeTypeOf("string");
      expect(encrypted.data).not.toBe(originalText);

      const decrypted = await decryptString(encrypted);
      expect(decrypted).toBe(originalText);
    });

    it("should return empty string for undefined secret", async () => {
      const decrypted = await decryptString(undefined);
      expect(decrypted).toBe("");
    });

    it("should throw for corrupted decrypt inputs (wrong key material)", async () => {
      await expect(
        decryptString({ iv: "invalid-iv", data: "invalid-data" })
      ).rejects.toThrow("Could not decrypt your saved API key");
    });
  });

  describe("encryptForExport and decryptExport", () => {
    it("should encrypt a payload and decrypt it with correct passphrase", async () => {
      const payload = {
        profile: { name: "Test User", age: 30 },
        workouts: [{ id: "w-1", name: "Push Day" }],
      };
      const passphrase = "secure-user-password-123";

      const encryptedJson = await encryptForExport(payload, passphrase);
      expect(encryptedJson).toBeDefined();
      
      const parsed = JSON.parse(encryptedJson);
      expect(parsed.format).toBe("atlas-ai-coach-export");
      expect(parsed.version).toBe(1);
      expect(parsed.salt).toBeDefined();
      expect(parsed.iv).toBeDefined();
      expect(parsed.data).toBeDefined();

      const decrypted = await decryptExport<typeof payload>(encryptedJson, passphrase);
      expect(decrypted).toEqual(payload);
    });

    it("should throw an error if the passphrase is wrong", async () => {
      const payload = { data: "secret" };
      const encryptedJson = await encryptForExport(payload, "correct-pass");

      await expect(
        decryptExport(encryptedJson, "wrong-pass")
      ).rejects.toThrow();
    });

    it("should throw an error if the export format is invalid", async () => {
      const badJson = JSON.stringify({
        format: "some-other-app-format",
        salt: "salt",
        iv: "iv",
        data: "data",
      });

      await expect(
        decryptExport(badJson, "pass")
      ).rejects.toThrow("This is not an Atlas AI Coach export.");
    });
  });
});
