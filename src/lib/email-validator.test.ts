import { describe, it, expect } from "vitest";
import {
  validateEmailFormat,
  isDisposableEmail,
  isObviousFakeEmail,
  validateEmail,
} from "./email-validator";

describe("email-validator.ts utilities", () => {
  describe("validateEmailFormat", () => {
    it("should accept valid email formats", () => {
      expect(validateEmailFormat("alex@example.com")).toBe(true);
      expect(validateEmailFormat("user.name+tag@domain.co.uk")).toBe(true);
    });

    it("should reject invalid email formats", () => {
      expect(validateEmailFormat("invalid")).toBe(false);
      expect(validateEmailFormat("alex@")).toBe(false);
      expect(validateEmailFormat("@example.com")).toBe(false);
      expect(validateEmailFormat("alex@com")).toBe(false);
      expect(validateEmailFormat("alex@domain.c")).toBe(false); // TLD too short
    });
  });

  describe("isDisposableEmail", () => {
    it("should return true for known disposable domains", () => {
      expect(isDisposableEmail("test@mailinator.com")).toBe(true);
      expect(isDisposableEmail("user@yopmail.com")).toBe(true);
      expect(isDisposableEmail("temp@10minutemail.com")).toBe(true);
    });

    it("should return true for subdomains of disposable domains", () => {
      expect(isDisposableEmail("test@sub.mailinator.com")).toBe(true);
    });

    it("should return false for regular email domains", () => {
      expect(isDisposableEmail("alex@gmail.com")).toBe(false);
      expect(isDisposableEmail("work@company.org")).toBe(false);
    });
  });

  describe("isObviousFakeEmail", () => {
    it("should return true for obvious placeholder fakes", () => {
      expect(isObviousFakeEmail("test@test.com")).toBe(true);
      expect(isObviousFakeEmail("admin@example.com")).toBe(true);
      expect(isObviousFakeEmail("asdf@gmail.com")).toBe(true);
      expect(isObviousFakeEmail("a@gmail.com")).toBe(true); // prefix too short
    });

    it("should return false for genuine emails", () => {
      expect(isObviousFakeEmail("alex.smith@gmail.com")).toBe(false);
      expect(isObviousFakeEmail("john123@yahoo.com")).toBe(false);
    });
  });

  describe("validateEmail", () => {
    it("should return error for empty or blank email", () => {
      expect(validateEmail("")).toEqual({
        isValid: false,
        error: "Please enter an email address.",
      });
      expect(validateEmail("   ")).toEqual({
        isValid: false,
        error: "Please enter an email address.",
      });
    });

    it("should return error for invalid format", () => {
      expect(validateEmail("invalid-email")).toEqual({
        isValid: false,
        error: "Please enter a valid email address format (e.g. alex@example.com).",
      });
    });

    it("should return error for fake email", () => {
      expect(validateEmail("test@test.com")).toEqual({
        isValid: false,
        error: "Please enter a genuine email address. Placeholder or dummy emails are not allowed.",
      });
    });

    it("should return error for disposable email", () => {
      expect(validateEmail("alex@mailinator.com")).toEqual({
        isValid: false,
        error: "Please use a valid personal or work email address. Temporary/disposable email addresses are not allowed.",
      });
    });

    it("should return isValid=true for a genuine email", () => {
      expect(validateEmail("simran@atlasaicoach.com")).toEqual({
        isValid: true,
      });
    });
  });
});
