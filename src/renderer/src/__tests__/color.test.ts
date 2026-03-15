import { describe, it, expect, beforeEach } from "vitest";
import { labelColors } from "../lib/color";

describe("labelColors", () => {
  beforeEach(() => {
    // Default to dark mode
    document.documentElement.classList.remove("light");
  });

  describe("dark mode", () => {
    it("returns rgb strings for fg, bg, border", () => {
      const colors = labelColors("3b82f6");
      expect(colors.fg).toMatch(/^rgb\(/);
      expect(colors.bg).toMatch(/^rgba\(/);
      expect(colors.border).toMatch(/^rgba\(/);
    });

    it("lightens dark colors for readability", () => {
      // #000000 is very dark, should be lightened significantly
      const colors = labelColors("000000");
      // The fg should not be pure black in dark mode
      expect(colors.fg).not.toBe("rgb(0, 0, 0)");
    });

    it("keeps bright colors as-is", () => {
      // #ffffff is already bright
      const colors = labelColors("ffffff");
      expect(colors.fg).toBe("rgb(255, 255, 255)");
    });

    it("handles 3-digit hex", () => {
      const colors = labelColors("f00");
      expect(colors.fg).toMatch(/^rgb\(/);
    });

    it("handles hex with # prefix", () => {
      const colors = labelColors("#3b82f6");
      expect(colors.fg).toMatch(/^rgb\(/);
    });

    it("returns low-opacity background", () => {
      const colors = labelColors("3b82f6");
      // bg should have 0.12 opacity
      expect(colors.bg).toContain("0.12");
    });
  });

  describe("light mode", () => {
    beforeEach(() => {
      document.documentElement.classList.add("light");
    });

    it("returns rgb strings", () => {
      const colors = labelColors("3b82f6");
      expect(colors.fg).toMatch(/^rgb\(/);
      expect(colors.bg).toMatch(/^rgba\(/);
    });

    it("darkens light colors for readability", () => {
      // #ffffff is very light, should be darkened
      const colors = labelColors("ffffff");
      expect(colors.fg).not.toBe("rgb(255, 255, 255)");
    });

    it("keeps dark colors as-is in light mode", () => {
      // #000000 is already dark
      const colors = labelColors("000000");
      expect(colors.fg).toBe("rgb(0, 0, 0)");
    });

    it("returns low-opacity background", () => {
      const colors = labelColors("22c55e");
      expect(colors.bg).toContain("0.1");
    });
  });
});
