# Plan: de-isolate the content scripts

Status: **awaiting review — do not execute until approved**
Revised: 2026-08-21 (v3 — script files renamed to match scaffold commands)

## Problem

`scripts/` contains three standalone Node scripts. Only one is registered in
`package.json`; there is no documentation; and basic utilities (slugify, CSV
parsing, frontmatter string escaping) are duplicated across scripts with
slightly divergent implementations.

## Research summary

| Script | Purpose | Registered | External deps | Header docs |
|---|---|---|---|---|
| `bluesky-import.mjs` | Incremental Bluesky feed → blog posts (`index.mdx` + downloaded media), state-file cutoff, renders rich text/embeds | ✅ `import:bluesky` | `@atproto/api`, `.env` `BLUESKY_HANDLE` | ❌ |
| `fetch-bandcamp.mjs` | Scrapes each NZ artist's Bandcamp → genre tags + last release year, written back into `nz-artists.yml`. Rate-limited, Cloudflare-aware | ❌ | `js-yaml` | ✅ good usage block |
| `scaffold-radio-show.mjs` | Tracklist CSV → radio show post scaffold | ❌ | none | ✅ added 2026-08-21 |

### Overlap found

| Utility | bluesky | bandcamp | scaffold | Decision |
|---|---|---|---|---|
| slugify | own impl (60-char cap, strips punctuation) | **two** impls (subdomain candidates) | own impl (punctuation → hyphen) | dedupe bluesky + scaffold → shared lib, strip-punctuation behaviour; bandcamp's stay separate (intentional subdomain heuristics) |
| YAML string escaping | inline `replace(/"/g,'\\"')` | — | same inline, ×3 | new tiny shared helper |
| fetch w/ retry | plain fetch | `fetchWithRetry` | — | leave as-is |
| mkdir recursive | `ensureDir` wrapper | direct | direct | trivial; leave as-is |

### Other findings

- `fetch-bandcamp.mjs:16` imports js-yaml via a fragile hack:
  ``import yaml from '../node_modules/js-yaml/index.js'``.
  One-off script, already served its purpose (`nz-artists.yml` exists) — see
  step 5: archived as-is, hack left untouched.
- `scripts/lib/` did not exist before this work. Its current contents
  (`slugify.mjs`, `parse-csv.mjs`) were created 2026-08-21 and the user has
  approved keeping them.

## Decisions already made with user

1. Keep the existing `scripts/lib/` files and the scaffold script migration.
2. Migrate `bluesky-import.mjs` to the shared slugify.
3. `fetch-bandcamp.mjs` is a **one-off**: move to `misc/`, rename, do **not**
   register, document, or fix.
4. Add `lib/yaml.mjs` frontmatter-string helper.
5. Naming: both content generators use the `scaffold:` prefix — same shape of
   tool (take input → produce draft for edit/publish). Script **files** are
   renamed to match their commands.
6. Shared slugify behaviour = **strip punctuation** (bluesky's historical
   behaviour): more sluggy, and centralised in one lib file so easy to
   revert/reinstate later.
7. Radio scaffold gains **no new behaviour** — colours/listenUrl/heroImage are
   trivial to fill in by hand; they just need to be present in the generated
   template.

## Naming map

| Current | New file | npm script |
|---|---|---|
| `bluesky-import.mjs` | `scaffold-posts-from-bluesky.mjs` | `scaffold:posts-from-bluesky` |
| `scaffold-radio-show.mjs` | `scaffold-radio-from-csv.mjs` | `scaffold:radio-from-csv` |
| `fetch-bandcamp.mjs` | `misc/guess-scrape-nz-artists-from-bandcamp.mjs` | *(none — archived)* |

## Steps

### 1. Keep existing work

Already in working tree:
- `scripts/lib/parse-csv.mjs`
- `scripts/scaffold-radio-show.mjs` migrated to lib imports + usage header

(`lib/slugify.mjs` exists but gets rewritten in step 3.)

### 2. Rename script files to match scaffold naming

- `git mv scripts/bluesky-import.mjs scripts/scaffold-posts-from-bluesky.mjs`
- `git mv scripts/scaffold-radio-show.mjs scripts/scaffold-radio-from-csv.mjs`
- Update internal usage headers / comments referencing old filenames or the
  old `scaffold:radio-show` command name.

All later steps refer to the new filenames.

### 3. Rewrite `scripts/lib/slugify.mjs` — strip-punctuation behaviour

Adopt bluesky's historical algorithm as the common behaviour:

```js
export function slugify(text, maxLength) {
  const slug = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')   // strip punctuation entirely
    .replace(/[\s_]+/g, '-')    // whitespace/underscores → hyphen
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  return maxLength ? slug.slice(0, maxLength) : slug;
}
```

- bluesky scaffold: zero behaviour change (this is its current impl).
- radio scaffold: adopts it; identical output for typical show titles
  (e.g. `"Version Reality | July '26"` → `version-reality-july-26` either way).

### 4. New helper `scripts/lib/yaml.mjs`

Tiny module exporting something like:

```js
export function yamlStr(value) {
  return `"${String(value).replace(/"/g, '\\"')}"`;
}
```

Use it in:
- `scaffold-radio-from-csv.mjs` `buildFrontmatter()` — replaces 3 inline escapes
- `scaffold-posts-from-bluesky.mjs` `generateFrontmatter()` — replaces 1 inline escape

### 5. Archive `fetch-bandcamp.mjs`

- `git mv scripts/fetch-bandcamp.mjs scripts/misc/guess-scrape-nz-artists-from-bandcamp.mjs`
- No content changes, no js-yaml import fix, not registered, not documented.
- Known consequence (accepted): its relative node_modules yaml import breaks
  at the new depth. Irrelevant for an archived one-off.

### 6. Register scripts in `package.json`

```json
"scaffold:posts-from-bluesky": "node scripts/scaffold-posts-from-bluesky.mjs",
"scaffold:radio-from-csv": "node scripts/scaffold-radio-from-csv.mjs",
```

- Renames the existing `import:bluesky`.

### 7. Consistent args

Convention: **one positional input (the source data); everything else is a
flag or hand-edited in the generated draft.**

- `scaffold:posts-from-bluesky` — no input arg (feed is the source); unchanged.
- `scaffold:radio-from-csv <tracks.csv> [--title "..."]`
  - Drops the `[output-file]`, `[title]`, `[listenUrl]` positional tail.
  - Output path always derived: `src/content/radio/<year>/<month>/<slug>.md`
    (slug from `--title`, falling back to a dated name when omitted).
  - `listenUrl` is no longer an arg — paste it into the draft.

### 8. Radio scaffold template — placeholders, no logic

Generated frontmatter includes commented placeholders so nothing is forgotten,
but the script parses/validates nothing new:

```yaml
# listenUrl: paste your link here
# colours:
#   background: "#......"
#   text: "#......"
# heroImage: ./your-photo.jpg
```

pubDate stays "now"; body stays a short placeholder. User edits the rest.

### 9. README docs

Add a "Content scaffolding" section documenting the two `scaffold:` scripts:
what each does, args, requirements (`.env` handle, state file, CSV format
expectations). Archived misc/ script intentionally excluded.

### 10. Verification

- `node --check` on all touched scripts and lib files.
- E2E scaffold run: temp CSV with quoted fields and commas in titles →
  `npm run scaffold:radio-from-csv -- <csv> --title "Test Show"` → confirm
  output lands in `src/content/radio/<year>/<month>/test-show.md`, frontmatter
  parses as YAML, placeholders present.
- Slugify spot-checks: bluesky-compat cases (`a!!!b` → `ab`) and show-title
  cases (`Version Reality | July '26` → `version-reality-july-26`).
- Confirm no stale references to `import:bluesky`, `bluesky-import.mjs`,
  `scaffold-radio-show.mjs`, or `fetch-bandcamp.mjs` remain (README, docs,
  internal comments).

## Explicitly out of scope

- Any behavioural upgrade to the archived bandcamp script.
- Interactive prompts / richer CLI for the radio scaffold.
