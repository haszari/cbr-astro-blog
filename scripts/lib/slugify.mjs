/**
 * Slugify a string: lowercase, strip punctuation entirely, collapse
 * whitespace/underscore runs into single hyphens, trim leading/trailing
 * hyphens.
 *
 * `maxLength` truncates after trimming (used by scaffold-posts-from-bluesky
 * to keep slugs at 60 chars).
 */
export function slugify(text, maxLength) {
  const slug = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  return maxLength ? slug.slice(0, maxLength) : slug;
}
