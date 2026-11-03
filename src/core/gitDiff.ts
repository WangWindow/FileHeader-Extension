const HUNK_SPLIT = /@@ [+-].*@@/m
const DIFF_LINE = /^[-+]/
const HUNK_SEPARATOR = /\r\n|\r|\n/

/**
 * Returns true when the diff contains changes other than the header fields.
 * A single header-only hunk is safe to revert; anything else must be kept.
 */
export function hasNonHeaderChanges(diff: string, headerFields: string[]): boolean {
  const parts = diff.split(HUNK_SPLIT)
  if (parts.length !== 2) return true

  const changedLines = (parts[1] ?? '').split(HUNK_SEPARATOR)
  for (const line of changedLines) {
    if (!DIFF_LINE.test(line)) continue
    if (headerFields.some((field) => line.includes(field))) continue
    return true
  }

  return false
}
