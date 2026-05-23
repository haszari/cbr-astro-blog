/**
 * Fetch Bandcamp data for each artist in nz-artists.yml.
 *
 * Strategy:
 *   - Try to find each artist's Bandcamp page using common subdomain patterns
 *   - Fetch the music page and extract genre tags + latest release year
 *
 * Usage:
 *   node scripts/fetch-bandcamp.mjs              # process all artists
 *   node scripts/fetch-bandcamp.mjs --limit 10   # process first 10 only
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from '../node_modules/js-yaml/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const YAML_PATH = path.resolve(__dirname, '..', 'src/content/data/nz-artists.yml');
const DELAY_MS = 350;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function slugifyName(name) {
  return name.toLowerCase()
    .replace(/'/g, '')
    .replace(/[^a-z0-9]+/g, '')
    .replace(/^-|-$/g, '');
}

function slugifyHyphen(name) {
  return name.toLowerCase()
    .replace(/'/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function guessSubdomains(name) {
  const candidates = new Set();
  candidates.add(slugifyName(name));
  candidates.add(slugifyHyphen(name));
  // remove leading "the"
  const withoutThe = name.replace(/^the\s+/i, '');
  if (withoutThe !== name) {
    candidates.add(slugifyName(withoutThe));
    candidates.add(slugifyHyphen(withoutThe));
  }
  return [...candidates];
}

function extractPagedataGenres(html) {
  const genres = new Set();
  const m = html.match(/id="pagedata"[^>]*data-blob="([^"]+)"/);
  if (!m) return genres;
  try {
    const data = JSON.parse(decodeURIComponent(m[1]));
    const band = data?.band;
    if (band?.genre_id != null) {
      // Map genre_id to name using the genre list in signup_params
      const genreList = data?.signup_params?.genres || [];
      const genre = genreList.find(g => g.id === band.genre_id);
      if (genre) genres.add(genre.name);
    }
  } catch {}
  return genres;
}

function extractBandSubdomain(html) {
  const m = html.match(/data-band="([^"]+)"/);
  if (!m) return null;
  try {
    const data = JSON.parse(decodeURIComponent(m[1]));
    return data.subdomain || null;
  } catch { return null }
}

function extractMusicGridItems(html) {
  const items = [];
  const gridRe = /<li[^>]*data-item-id="(album-\d+|track-\d+)"[^>]*>[\s\S]*?<a\s+href="(\/[^"]+)"[^>]*>[\s\S]*?<p\s+class="title"[^>]*>([\s\S]*?)<\/p>/gi;
  let m;
  while ((m = gridRe.exec(html)) !== null) {
    const titleHtml = m[3].replace(/<br\s*\/?>/i, '\n').replace(/<[^>]+>/g, '').trim();
    items.push({
      id: m[1],
      url: m[2],
      title: titleHtml.split('\n')[0].trim(),
    });
  }
  return items;
}

async function fetchWithRetry(url, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        }
      });
      const text = await res.text();
      // Detect Cloudflare challenge
      if (text.includes('Client Challenge') || text.includes('_fs-ch-')) {
        return { status: 503, error: 'Cloudflare challenge' };
      }
      if (res.status === 404) return { status: 404 };
      if (!res.ok) return { status: res.status, error: `HTTP ${res.status}` };
      return { status: res.status, text };
    } catch (e) {
      if (i === retries) return { status: 0, error: e.message };
      await sleep(1000);
    }
  }
}

async function processArtist(entry) {
  const candidates = guessSubdomains(entry.name);
  console.log(`\n--- ${entry.name} ---`);

  let bestRes = null;
  let bestSubdomain = null;

  for (const sub of candidates) {
    const musicUrl = `https://${sub}.bandcamp.com/music`;
    const bandUrl = `https://${sub}.bandcamp.com`;
    const res = await fetchWithRetry(musicUrl);

    if (res.status === 404) {
      // try just the band page
      const bandRes = await fetchWithRetry(bandUrl);
      if (bandRes.status === 404 || bandRes.status === 503) continue;
      if (bandRes.text) {
        bestRes = bandRes;
        bestSubdomain = sub;
        break;
      }
    }
    if (res.text) {
      bestRes = res;
      bestSubdomain = sub;
      break;
    }
    // If we got a challenge, the page exists but we can't scrape
    if (res.status === 503) {
      if (!bestRes) { bestRes = res; bestSubdomain = sub; }
    }
  }

  if (!bestRes || (!bestRes.text && bestRes.status !== 503)) {
    console.log(`  No Bandcamp page found`);
    return null;
  }

  if (bestRes.status === 503) {
    console.log(`  Bandcamp page exists at ${bestSubdomain}.bandcamp.com (blocked by Cloudflare)`);
    // Can't scrape, preserve existing data
    return null;
  }

  const html = bestRes.text;

  // Check if this is actually an artist page (not a redirect/label)
  const actualSubdomain = extractBandSubdomain(html);
  if (actualSubdomain && actualSubdomain !== bestSubdomain) {
    console.log(`  Redirected to ${actualSubdomain}.bandcamp.com — treating as different entity`);
  }

  // Get genre from pagedata
  const genresFromPage = extractPagedataGenres(html);
  if (genresFromPage.size) {
    console.log(`  Page genre: ${[...genresFromPage].join(', ')}`);
  }

  // Get music grid items
  const items = extractMusicGridItems(html);
  console.log(`  Found ${items.length} release(s)`);

  let allStyles = new Set(genresFromPage);
  let maxYear = null;

  for (const item of items.slice(0, 8)) {
    const tralbumUrl = `https://${bestSubdomain}.bandcamp.com${item.url}`;
    await sleep(DELAY_MS);

    const trRes = await fetchWithRetry(tralbumUrl);
    if (!trRes.text) continue;

    // Extract tags from tralbum page
    // Tags use: <a class="tag" href="https://bandcamp.com/discover/TAGNAME?from=...">
    const tagRe = /<a[^>]+class="tag"[^>]*href="https:\/\/bandcamp\.com\/discover\/([^?"]+)/gi;
    let tm;
    while ((tm = tagRe.exec(trRes.text)) !== null) {
      allStyles.add(decodeURIComponent(tm[1]).toLowerCase());
    }

    // Extract release year from "released <date>" text
    const releasedRe = /released\s+\w+\s+\d+,\s*(\d{4})/i;
    const yearMatch = releasedRe.exec(trRes.text);
    if (yearMatch) {
      const y = parseInt(yearMatch[1], 10);
      if (y > 1900 && y < 2100 && (maxYear === null || y > maxYear)) maxYear = y;
    }

    const displayStyles = tagRe.lastIndex ? 'tags found' : 'no tags';
    console.log(`    ${item.url}: year=${maxYear ?? '?'} ${displayStyles}`);
  }

  // Capitalize style names
  const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const sortedStyles = [...allStyles].map(capitalize).sort();

  const result = { slug: entry.slug, name: entry.name };
  if (maxYear !== null) result.lastReleaseYear = maxYear;
  if (sortedStyles.length > 0) {
    result.styles = sortedStyles;
  } else if (entry.styles) {
    result.styles = entry.styles;
  }

  console.log(`  → year=${maxYear ?? '?'} styles=[${sortedStyles.join(', ')}]`);
  return result;
}

async function main() {
  const limit = process.argv.includes('--limit')
    ? parseInt(process.argv[process.argv.indexOf('--limit') + 1], 10)
    : Infinity;

  const raw = yaml.load(fs.readFileSync(YAML_PATH, 'utf-8'));
  console.log(`Loaded ${raw.length} artists\n`);

  const results = [];
  const save = () => {
    fs.writeFileSync(YAML_PATH, yaml.dump(results, {
      lineWidth: -1, quotingType: '"', forceQuotes: true, noCompatMode: true
    }));
  };

  for (let i = 0; i < raw.length; i++) {
    if (i >= limit) {
      results.push(raw[i]);
      continue;
    }
    const result = await processArtist(raw[i]);
    if (result) {
      results.push(result);
    } else {
      results.push({
        slug: raw[i].slug,
        name: raw[i].name,
        lastReleaseYear: raw[i].lastReleaseYear,
        styles: raw[i].styles,
      });
    }
    // Save every 10 artists so partial runs aren't lost
    if (i > 0 && i % 10 === 0) save();
    if (i < raw.length - 1) await sleep(DELAY_MS);
  }

  save();
  console.log(`\nDone! Updated ${YAML_PATH}`);
}

main().catch(console.error);
