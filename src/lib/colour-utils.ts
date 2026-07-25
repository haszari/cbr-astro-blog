// Theme colour pair — used as defaults when content only specifies some colours.
// LIGHT is a muted white for dark backgrounds, DARK is a muted grey for light backgrounds.
const THEME_LIGHT = '#f3f1f3';
const THEME_DARK = '#222626';

// Parse a hex colour string like "#ff0000" into RGB components.
function parseHexColour(hex: string): { r: number; g: number; b: number } | null {
	const match = hex.replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
	if (!match) return null;
	return { r: parseInt(match[1], 16), g: parseInt(match[2], 16), b: parseInt(match[3], 16) };
}

// Calculate perceived brightness of an RGB colour (0 = black, 1 = white).
// Uses the standard sRGB luminance formula weighted by human eye sensitivity.
function perceivedBrightness({ r, g, b }: { r: number; g: number; b: number }): number {
	const [rs, gs, bs] = [r, g, b].map(c => {
		const s = c / 255;
		return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
	});
	return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Returns true if the colour reads as "light" (needs dark text on it).
export function isLightColour(hex: string): boolean {
	const rgb = parseHexColour(hex);
	if (!rgb) return true;
	return perceivedBrightness(rgb) > 0.5;
}

// Pick a contrasting foreground colour for a given background.
// Light bg → dark foreground, dark bg → light foreground.
export function themeForeground(bgHex: string): string {
	return isLightColour(bgHex) ? THEME_DARK : THEME_LIGHT;
}
