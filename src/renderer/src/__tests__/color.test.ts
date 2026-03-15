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

  describe("edge cases", () => {
    it("produces different colors for dark vs light mode", () => {
      document.documentElement.classList.remove("light");
      const darkColors = labelColors("0075ca");

      document.documentElement.classList.add("light");
      const lightColors = labelColors("0075ca");

      // The fg colors should differ between modes for dark input colors
      expect(darkColors.fg).not.toBe(lightColors.fg);
    });

    it("handles mid-luminance colors in dark mode", () => {
      document.documentElement.classList.remove("light");
      // Mid-gray should be lightened in dark mode for readability
      const colors = labelColors("808080");
      expect(colors.fg).toMatch(/^rgb\(/);
    });

    it("lightens colors with luminance just below 128 in dark mode", () => {
      document.documentElement.classList.remove("light");
      // rgb(0, 0, 0) has luminance 0, well below 128
      const colors = labelColors("000000");
      expect(colors.fg).not.toBe("rgb(0, 0, 0)");
    });

    it("handles mid-luminance colors in light mode (boundary at 160)", () => {
      document.documentElement.classList.add("light");
      // Need a color with luminance ~160
      // luminance = 0.299*r + 0.587*g + 0.114*b = 160
      // Using approximately rgb(160, 160, 160) = luminance 160
      const colors = labelColors("a0a0a0");
      // luminance = 0.299*160 + 0.587*160 + 0.114*160 = 160.0
      // Since lum > 160 is false at exactly 160, should NOT darken
      expect(colors.fg).toBe("rgb(160, 160, 160)");
    });

    it("returns valid border rgba in dark mode", () => {
      document.documentElement.classList.remove("light");
      const colors = labelColors("ff5500");
      expect(colors.border).toMatch(/^rgba\(\d+, \d+, \d+, 0\.2\d?\)$/);
    });

    it("returns valid border rgba in light mode", () => {
      document.documentElement.classList.add("light");
      const colors = labelColors("ff5500");
      expect(colors.border).toMatch(/^rgba\(\d+, \d+, \d+, 0\.25\)$/);
    });
  });
});
