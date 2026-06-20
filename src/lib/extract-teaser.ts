/**
 * Extracts the first sentence from content.
 * @param content - The content to extract from (post body or blurb)
 * @returns The extracted first sentence
 */
export function getTeaser(content: string): string {
  const text = content ?? '';
  // Try matching text up to first punctuation (.!?);
  // fall back to 160-char truncation if no punctuation found
  const firstSentence =
    text.match(/^[^.!?]+[.!?]/)?.[0] ||
    text.substring(0, 160) + '…';

  return firstSentence.trim();
}
