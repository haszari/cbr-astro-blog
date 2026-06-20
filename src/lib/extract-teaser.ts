import type { CollectionEntry } from 'astro:content';

/**
 * Gets the teaser for a blog post.
 * Uses the manual `teaser` frontmatter field if provided,
 * otherwise extracts the first sentence from the post body.
 */
export function getTeaser(entry: CollectionEntry<'blog'>): string {
  // Use manual teaser if provided
  if (entry.data.teaser) {
    return entry.data.teaser;
  }

  const body = entry.body ?? '';
  // Try matching text up to first punctuation (.!?);
  // fall back to 160-char truncation if no punctuation found
  const firstSentence =
    body.match(/^[^.!?]+[.!?]/)?.[0] ||
    body.substring(0, 160) + '…';

  return firstSentence.trim();
}
