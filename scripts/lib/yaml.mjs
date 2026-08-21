/**
 * Format a value as a double-quoted YAML string with embedded quotes escaped.
 * For hand-rolled frontmatter in scaffold scripts.
 */
export function yamlStr(value) {
  return `"${String(value).replace(/"/g, '\\"')}"`;
}
