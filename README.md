# Cartoon Beats Reality / Haszari website

https://cartoonbeats.com

## Development
- `npm install` 
- `npm run dev` to run a local dev build & dev server           
- `npm run build` to build

Deploys automatically to GitHub Pages on every push to `main` branch [using standard workflow](./.github/workflows/deploy.yml).

Built with [Astro](https://docs.astro.build).

## Content scaffolding

Scripts that turn source data into draft content for editing/publishing. Shared helpers live in `scripts/lib/`.

### `npm run scaffold:posts-from-bluesky`

Imports new posts from your Bluesky feed as blog drafts under `src/content/blog/<year>/<slug>/index.mdx`, downloading embedded media and rendering links/mentions/images.

- Requires `BLUESKY_HANDLE` in `.env`
- Incremental: tracks the newest imported post in `.bluesky-import-state.json`; each run imports only what's newer
- Skips reposts and replies

### `npm run scaffold:radio-from-csv`

Scaffolds a radio show post from a tracklist CSV: `src/content/radio/<year>/<month>/<slug>.md`.

```
npm run scaffold:radio-from-csv -- <tracks.csv> [--title "Show Name"]
```

- CSV needs "Artist" and "Title" columns (case-insensitive); quoted fields and commas are supported
- Optional "NZ" column: any truthy value (not empty/false/no/0/n) marks the track as NZ, rendered as `[NZ]` after the artist
- Without `--title`, show name and slug are guessed from the CSV filename + current month/year — e.g. `version-tracks-aug.csv` → `"Version Reality | August '26"` at `src/content/radio/2026/08/version-reality-aug-26.md`; any other filename defaults to "Beats Reality" (rules in `SHOW_NAME_RULES` in the script)
- Output slug comes from `--title`, falling back to a dated name
- `listenUrl`, `colours`, `heroImage` and show notes are left as commented placeholders / a stub for you to fill in

(`scripts/misc/` holds archived one-off scripts, not registered as npm commands.)
