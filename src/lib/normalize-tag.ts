export function normalizeTag(tag: string): string {
  return tag
    .trim()
    .replaceAll("-", " ")
    .replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
}
