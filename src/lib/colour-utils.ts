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

// Convert RGB to HSL. h is 0-360, s and l are 0-100.
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
	r /= 255; g /= 255; b /= 255;
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const l = (max + min) / 2;
	if (max === min) return { h: 0, s: 0, l: l * 100 };
	const d = max - min;
	const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
	let h = 0;
	if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
	else if (max === g) h = ((b - r) / d + 2) / 6;
	else h = ((r - g) / d + 4) / 6;
	return { h: h * 360, s: s * 100, l: l * 100 };
}

// Convert HSL to RGB. h is 0-360, s and l are 0-100.
function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
	s /= 100; l /= 100;
	const a = s * Math.min(l, 1 - l);
	const f = (n: number) => {
		const k = (n + h / 30) % 12;
		return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
	};
	return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255) };
}

// Convert hex to HSL.
function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
	const rgb = parseHexColour(hex);
	if (!rgb) return null;
	return rgbToHsl(rgb.r, rgb.g, rgb.b);
}

// Convert HSL to hex string.
function hslToHex(h: number, s: number, l: number): string {
	const { r, g, b } = hslToRgb(h, s, l);
	return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
}

// Rotate the hue of a colour by the given degrees. Accepts hex strings.
// Non-hex input (e.g. named colours) passes through unchanged.
export function rotateHue(colour: string, degrees: number): string {
	const hsl = hexToHsl(colour);
	if (!hsl) return colour;
	const h = ((hsl.h + degrees) % 360 + 360) % 360;
	return hslToHex(h, hsl.s, hsl.l);
}
