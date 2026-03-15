/**
 * Parse a 3 or 6 digit hex string (no #) into [r, g, b].
 */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h[0] + h[0] + h[1] + h[1] + h[2] + h[2] : h;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

/**
 * Perceived brightness (0-255) using the W3C relative luminance formula.
 */
function luminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * Lighten an rgb color toward white by a factor (0-1).
 */
function lighten(r: number, g: number, b: number, amount: number): [number, number, number] {
  return [
    Math.round(r + (255 - r) * amount),
    Math.round(g + (255 - g) * amount),
    Math.round(b + (255 - b) * amount),
  ];
}

/**
 * Darken an rgb color toward black by a factor (0-1).
 */
function darken(r: number, g: number, b: number, amount: number): [number, number, number] {
  return [Math.round(r * (1 - amount)), Math.round(g * (1 - amount)), Math.round(b * (1 - amount))];
}

/**
 * Given a GitHub label hex color (e.g. "0075ca"), return CSS-ready
 * foreground, background, and border colors that are readable
 * against both dark and light app backgrounds.
 *
 * Uses the current theme from the <html> class.
 */
export function labelColors(hex: string): { fg: string; bg: string; border: string } {
  const isDark = !document.documentElement.classList.contains("light");
  const [r, g, b] = hexToRgb(hex);
  const lum = luminance(r, g, b);

  if (isDark) {
    // Dark mode: lighten dark colors so text is readable, use low-opacity bg
    const textColor = lum < 128 ? lighten(r, g, b, 0.45) : [r, g, b];
    const [tr, tg, tb] = textColor as [number, number, number];
    return {
      fg: `rgb(${tr}, ${tg}, ${tb})`,
      bg: `rgba(${r}, ${g}, ${b}, 0.12)`,
      border: `rgba(${r}, ${g}, ${b}, 0.20)`,
    };
  }

  // Light mode: darken light colors so text is readable
  const textColor = lum > 160 ? darken(r, g, b, 0.35) : [r, g, b];
  const [tr, tg, tb] = textColor as [number, number, number];
  return {
    fg: `rgb(${tr}, ${tg}, ${tb})`,
    bg: `rgba(${r}, ${g}, ${b}, 0.10)`,
    border: `rgba(${r}, ${g}, ${b}, 0.25)`,
  };
}
