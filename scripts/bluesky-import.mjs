import { loadEnvFile } from 'node:process'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { Agent, RichText } from '@atproto/api'

loadEnvFile()

const HANDLE = process.env.BLUESKY_HANDLE
if (!HANDLE) {
  console.error('Set BLUESKY_HANDLE in .env')
  process.exit(1)
}

const STATE_FILE = '.bluesky-import-state.json'
const BLOG_BASE = 'src/content/blog'

const agent = new Agent({ service: 'https://public.api.bsky.app' })

// --- State ---

function loadState() {
  try {
    return JSON.parse(readFileSync(STATE_FILE, 'utf-8'))
  } catch {
    return { lastImportDate: null }
  }
}

function saveState(state) {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2) + '\n')
}

// --- Helpers ---

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

function extractTitle(text) {
  const firstLine = text.split('\n')[0].trim()
  const cleaned = firstLine.replace(/^@\S+\s*/, '').trim()
  if (cleaned.length > 60) return cleaned.slice(0, 57) + '...'
  if (cleaned.length >= 3) return cleaned
  const fallback = text.slice(0, 57) + '...'
  return fallback || 'Bluesky post'
}

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

function imageFilename(fullsizeUrl) {
  const pathname = new URL(fullsizeUrl).pathname
  const last = pathname.split('/').pop()
  return last.replace('@', '.')
}

function blueskyUrl(uri) {
  const parts = uri.replace('at://', '').split('/')
  return `https://bsky.app/profile/${parts[0]}/post/${parts[2]}`
}

async function downloadImage(url, dest) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const buffer = Buffer.from(await response.arrayBuffer())
  writeFileSync(dest, buffer)
}

function escapeMarkdown(text) {
  return text.replace(/([*_\[`])/g, '\\$1')
}

function renderRichText(text, facets) {
  if (!facets || facets.length === 0) return escapeMarkdown(text)

  const rt = new RichText({ text, facets })
  const parts = []
  for (const seg of rt.segments()) {
    if (seg.isLink()) {
      parts.push(`[${escapeMarkdown(seg.text)}](${seg.link.uri})`)
    } else if (seg.isMention()) {
      parts.push(`[${escapeMarkdown(seg.text)}](https://bsky.app/profile/${seg.mention.did})`)
    } else if (seg.isTag()) {
      parts.push(`#${seg.tag.tag}`)
    } else {
      parts.push(escapeMarkdown(seg.text))
    }
  }
  return parts.join('')
}

function generateFrontmatter(title, pubDate, blueskyUri) {
  const dateStr = pubDate.toISOString().replace(/\.\d{3}Z$/, '')
  return [
    '---',
    `title: "${title.replace(/"/g, '\\"')}"`,
    `pubDate: "${dateStr}"`,
    'bluesky:',
    `  uri: "${blueskyUri}"`,
    `  url: "${blueskyUrl(blueskyUri)}"`,
    '---',
    '',
  ].join('\n')
}

// --- Main ---

async function main() {
  const state = loadState()
  const cutoff = state.lastImportDate ? new Date(state.lastImportDate) : null

  console.log(`Fetching feed for @${HANDLE} ...`)

  const { data } = await agent.getAuthorFeed({ actor: HANDLE, limit: 100 })
  const feed = data.feed

  let newCount = 0

  for (const feedItem of feed) {
    const { post } = feedItem

    // Skip reposts
    if (feedItem.reason?.$type?.endsWith('reasonRepost')) {
      continue
    }

    const record = post.record
    if (typeof record !== 'object' || record.$type !== 'app.bsky.feed.post') {
      continue
    }

    // Skip replies
    if (record.reply) {
      continue
    }

    const pubDate = new Date(record.createdAt)

    // Stop if post is older than or equal to the cutoff date (caught up)
    if (cutoff && pubDate <= cutoff) {
      console.log('Caught up — no new posts to import.')
      break
    }

    // --- Process new post ---
    const year = pubDate.getFullYear().toString()
    const title = extractTitle(record.text)
    let slug = slugify(title) || `post-${post.uri.split('/').pop()}`
    let postDir = join(BLOG_BASE, year, slug)

    // Handle slug collision
    let counter = 2
    while (existsSync(join(postDir, 'index.mdx'))) {
      postDir = join(BLOG_BASE, year, `${slug}-${counter}`)
      counter++
    }

    ensureDir(join(postDir, 'media'))

    // --- Build body ---
    const body = []

    // Rich text
    const rendered = renderRichText(record.text, record.facets)
    if (rendered) body.push(rendered)

    // Embeds
    const embed = post.embed
    if (embed) {
      // Images
      if (embed.$type === 'app.bsky.embed.images#view' && embed.images) {
        for (const img of embed.images) {
          try {
            const fname = imageFilename(img.fullsize)
            const dest = join(postDir, 'media', fname)
            if (!existsSync(dest)) {
              await downloadImage(img.fullsize, dest)
            }
            body.push('')
            body.push(`![${img.alt || ''}](./media/${fname})`)
          } catch (err) {
            console.warn(`  ⚠ Failed to download image: ${err.message}`)
          }
        }
      }

      // External link card
      if (embed.$type === 'app.bsky.embed.external#view' && embed.external) {
        const ext = embed.external
        body.push('')
        body.push(`[${ext.title || ext.uri}](${ext.uri})`)
        if (ext.description) {
          body.push(`> ${ext.description}`)
        }
      }

      // Video
      if (embed.$type === 'app.bsky.embed.video#view') {
        body.push('')
        if (embed.playlist) {
          body.push(`[Video](${embed.playlist})`)
        }
        if (embed.alt) {
          body.push(`> ${embed.alt}`)
        }
      }

      // Record embed (quote post)
      if (embed.$type === 'app.bsky.embed.record#view' && embed.record) {
        const rec = embed.record
        if (rec.uri) {
          const handle = rec.author?.handle || 'unknown'
          body.push('')
          body.push(`> Quoting [@${handle}](https://bsky.app/profile/${rec.author?.did || handle})`)
          const excerpt = rec.value?.text?.slice(0, 200)
          if (excerpt) {
            body.push(`> ${excerpt}${rec.value.text.length > 200 ? '…' : ''}`)
          }
        }
      }
    }

    body.push('')

    // --- Write files ---
    const frontmatter = generateFrontmatter(title, pubDate, post.uri)
    const content = frontmatter + body.join('\n')
    writeFileSync(join(postDir, 'index.mdx'), content)

    newCount++

    // Track newest imported post date as cutoff for next run
    if (!state.lastImportDate || pubDate > new Date(state.lastImportDate)) {
      state.lastImportDate = record.createdAt
    }

    console.log(`  ✓ ${title}`)
  }

  // Persist state
  saveState(state)

  if (newCount === 0) {
    console.log('No new posts to import.')
  } else {
    console.log(`\nImported ${newCount} new post${newCount > 1 ? 's' : ''}.`)
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
