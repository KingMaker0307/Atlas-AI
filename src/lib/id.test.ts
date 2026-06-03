import { describe, it, expect } from "vitest";
import { createId, todayKey, minutesBetween, clamp } from "./id";

describe("id.ts utilities", () => {
  describe("createId", () => {
    it("should create an ID with the default prefix 'atlas'", () => {
      const id = createId();
      expect(id.startsWith("atlas_")).toBe(true);
      expect(id.length).toBeGreaterThan(6);
    });

    it("should create an ID with a custom prefix", () => {
      const id = createId("user");
      expect(id.startsWith("user_")).toBe(true);
    });
  });

  describe("todayKey", () => {
    it("should return the date formatted as YYYY-MM-DD", () => {
      const date = new Date(2026, 5, 1, 12, 0, 0); // Local June 1st
      const key = todayKey(date);
      expect(key).toBe("2026-06-01");
    });
  });

  describe("minutesBetween", () => {
    it("should return minutes difference between two ISO strings", () => {
      const start = "2026-06-01T12:00:00.000Z";
      const end = "2026-06-01T12:15:30.000Z";
      expect(minutesBetween(start, end)).toBe(16); // 15.5 min rounded to 16
    });

    it("should return at least 1 minute even if the difference is smaller", () => {
      const start = "2026-06-01T12:00:00.000Z";
      const end = "2026-06-01T12:00:05.000Z";
      expect(minutesBetween(start, end)).toBe(1);
    });
  });

  describe("clamp", () => {
    it("should return min value if input is below min", () => {
      expect(clamp(5, 10, 20)).toBe(10);
    });

    it("should return max value if input is above max", () => {
      expect(clamp(25, 10, 20)).toBe(20);
    });

    it("should return input if it is between min and max", () => {
      expect(clamp(15, 10, 20)).toBe(15);
    });
  });
});
