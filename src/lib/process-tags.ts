import { readFileSync } from "node:fs"
import { load as parseYaml } from "js-yaml"

import { normalizeTag } from "./normalize-tag"

export interface TagRules {
  split: Record<string, string[]>
  synonym: Record<string, string[]>
}

let cachedRules: TagRules | null = null

function loadRules(): TagRules {
  if (cachedRules) return cachedRules
  const raw = readFileSync("src/content/schema/tag-rules.yml", "utf-8")
  cachedRules = parseYaml(raw) as TagRules
  return cachedRules
}

export function applyTagRules(tags: string[]): string[] {
  const rules = loadRules()

  // 1. Split
  const splitResult: string[] = []
  for (const tag of tags) {
    const normalized = normalizeTag(tag)
    const parts = rules.split[normalized]
    if (parts) {
      splitResult.push(...parts)
    } else {
      splitResult.push(normalized)
    }
  }

  // 2. Synonym merge
  // Build reverse lookup: alias → canonical
  const aliasMap: Record<string, string> = {}
  for (const [canonical, aliases] of Object.entries(rules.synonym)) {
    for (const alias of aliases) {
      aliasMap[normalizeTag(alias)] = canonical
    }
  }

  const merged = splitResult.map((tag) => aliasMap[tag] ?? tag)

  // 3. Deduplicate
  return [...new Set(merged)]
}
