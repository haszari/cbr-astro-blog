import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');
const RADIO_CONTENT_ROOT = resolve(projectRoot, 'src/content/radio');

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map((value) => value.trim().replace(/^\"|\"$/g, ''));
  const rows = [];

  for (const line of lines.slice(1)) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    values.push(current.trim());

    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    rows.push(row);
  }

  return rows;
}

function buildTracklist(rows) {
  return rows
    .map((row) => {
      const artist = row.Artist || row.artist || ''.trim();
      const title = row.Title || row.title || ''.trim();
      if (!artist && !title) return null;
      return { artist: artist || 'Unknown artist', title: title || 'Untitled track' };
    })
    .filter(Boolean);
}

function buildFrontmatter({ title, pubDate, tracklist, listenUrl }) {
  const safeTitle = title.replace(/"/g, '\\"');
  const lines = [
    '---',
    `title: "${safeTitle}"`,
    `pubDate: ${pubDate.toISOString()}`,
  ];

  if (listenUrl) {
    lines.push(`listenUrl: "${listenUrl.replace(/"/g, '\\"')}"`);
  }

  lines.push('tracklist:');
  for (const track of tracklist) {
    lines.push(`  - artist: "${track.artist.replace(/"/g, '\\"')}"`);
    lines.push(`    title: "${track.title.replace(/"/g, '\\"')}"`);
  }
  lines.push('---');
  return lines.join('\n');
}

function buildBody() {
  return '\nAdd your notes here.\n';
}

function main() {
  const inputPath = process.argv[2];
  const outputPathArg = process.argv[3];

  if (!inputPath) {
    console.error('Usage: node scripts/scaffold-radio-show.mjs <input.csv> [output-file.md] [title] [listenUrl]');
    process.exit(1);
  }

  const fullInputPath = resolve(process.cwd(), inputPath);
  const title = process.argv[4] || 'Radio show';
  const listenUrl = process.argv[5] || '';
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const slug = slugify(title);
  const defaultRelativePath = `${year}/${month}/${slug}.md`;
  const relativeOutputPath = outputPathArg || defaultRelativePath;
  const fullOutputPath = relativeOutputPath.startsWith('src/content/radio')
    ? resolve(process.cwd(), relativeOutputPath)
    : join(RADIO_CONTENT_ROOT, relativeOutputPath);

  const csvText = readFileSync(fullInputPath, 'utf-8');
  const rows = parseCsv(csvText);
  const tracklist = buildTracklist(rows);

  if (tracklist.length === 0) {
    console.error('No track rows found in CSV.');
    process.exit(1);
  }

  const pubDate = now;

  const outputDir = dirname(fullOutputPath);
  mkdirSync(outputDir, { recursive: true });

  const content = [
    buildFrontmatter({ title, pubDate, tracklist, listenUrl }),
    buildBody(),
  ].join('\n');

  writeFileSync(fullOutputPath, content + '\n', 'utf-8');
  console.log(`Wrote ${tracklist.length} tracks to ${relativeOutputPath}`);
}

main();
