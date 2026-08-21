/**
 * Scaffold a radio show content post from a tracklist CSV.
 *
 * Expects a CSV with "Artist" and "Title" columns (case-insensitive).
 * An optional "NZ" column marks tracks as NZ: any truthy value (anything
 * not empty/false/no/0/n) emits `nz: true` for that track.
 * Everything else (listenUrl, colours, heroImage, show notes) is left as
 * commented placeholders / a stub body for you to fill in by hand.
 *
 * Usage:
 *   npm run scaffold:radio-from-csv -- <tracks.csv> [--title "Show Name"]
 *
 * Without --title, the show name is guessed from the CSV filename (see
 * SHOW_NAME_RULES below — currently "version" → "Version Reality", otherwise
 * "Beats Reality") and combined with the current month/year, e.g.
 * "Version Reality | August '26" → src/content/radio/2026/08/version-reality-aug-26.md
 * With --title, the slug is derived from the given title instead.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { slugify } from './lib/slugify.mjs';
import { parseCsv } from './lib/parse-csv.mjs';
import { yamlStr } from './lib/yaml.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');
const RADIO_CONTENT_ROOT = resolve(projectRoot, 'src/content/radio');

// Show series detection from the CSV filename. Show names repeat month to
// month, so the scaffolded slug/title append the current month-year.
// Add a rule per new show series; first match wins.
const SHOW_NAME_RULES = [
  [/version/, 'Version Reality'],
];
const DEFAULT_SHOW_NAME = 'Beats Reality';

// hack: use US locale because it reliably returns sep not sept
const longMonth = new Intl.DateTimeFormat('en-US', { month: 'long' });
const shortMonth = new Intl.DateTimeFormat('en-US', { month: 'short' });

function guessShowName(csvPath) {
  const filename = basename(csvPath).toLowerCase();
  for (const [pattern, name] of SHOW_NAME_RULES) {
    if (pattern.test(filename)) return name;
  }
  return DEFAULT_SHOW_NAME;
}

function parseArgs(argv) {
  const args = { positional: [] };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--title') {
      args.title = argv[i + 1];
      i += 1;
    } else {
      args.positional.push(argv[i]);
    }
  }
  return args;
}

function isTruthyCell(value) {
  const v = String(value ?? '').trim().toLowerCase();
  return v !== '' && v !== 'false' && v !== 'no' && v !== '0' && v !== 'n';
}

function buildTracklist(rows) {
  return rows
    .map((row) => {
      const artist = row.Artist || row.artist || ''.trim();
      const title = row.Title || row.title || ''.trim();
      if (!artist && !title) return null;
      return {
        artist: artist || 'Unknown artist',
        title: title || 'Untitled track',
        nz: isTruthyCell(row.NZ ?? row.nz),
      };
    })
    .filter(Boolean);
}

function buildFrontmatter({ title, pubDate, tracklist }) {
  const lines = [
    '---',
    `title: ${yamlStr(title)}`,
    `pubDate: ${pubDate.toISOString()}`,
    '# listenUrl: paste your link here',
    '# colours:',
    '#   background: "#010101"',
    '#   text: "#f0f0f0"',
    '# heroImage: ./your-photo.jpg',
    'tracklist:',
  ];
  for (const track of tracklist) {
    lines.push(`  - artist: ${yamlStr(track.artist)}`);
    lines.push(`    title: ${yamlStr(track.title)}`);
    if (track.nz) lines.push('    nz: true');
  }
  lines.push('---');
  return lines.join('\n');
}

function buildBody() {
  return '\nAdd your notes here.\n';
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const inputPath = args.positional[0];

  if (!inputPath) {
    console.error('Usage: npm run scaffold:radio-from-csv -- <tracks.csv> [--title "Show Name"]');
    process.exit(1);
  }

  const fullInputPath = resolve(process.cwd(), inputPath);
  const now = new Date();
  const year = now.getFullYear().toString();
  const yy = year.slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');

  let title;
  let slug;
  if (args.title) {
    title = args.title;
    slug = slugify(title) || `show-${year}-${month}-${now.getDate().toString().padStart(2, '0')}`;
  } else {
    const showName = guessShowName(fullInputPath);
    title = `${showName} | ${longMonth.format(now)} '${yy}`;
    slug = `${slugify(showName)}-${shortMonth.format(now).toLowerCase()}-${yy}`;
  }

  const relativeOutputPath = `${year}/${month}/${slug}.md`;
  const fullOutputPath = join(RADIO_CONTENT_ROOT, relativeOutputPath);

  const csvText = readFileSync(fullInputPath, 'utf-8');
  const rows = parseCsv(csvText);
  const tracklist = buildTracklist(rows);

  if (tracklist.length === 0) {
    console.error('No track rows found in CSV.');
    process.exit(1);
  }

  mkdirSync(dirname(fullOutputPath), { recursive: true });

  const content = [
    buildFrontmatter({ title, pubDate: now, tracklist }),
    buildBody(),
  ].join('\n');

  writeFileSync(fullOutputPath, content + '\n', 'utf-8');
  console.log(`Wrote ${tracklist.length} tracks to src/content/radio/${relativeOutputPath}`);
}

main();
