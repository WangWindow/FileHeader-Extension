export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function firstLine(value: string): string {
  const index = value.search(/\r\n|\r|\n/)
  return index === -1 ? value : value.slice(0, index)
}

export function normalizeEol(value: string, eol: '\n' | '\r\n'): string {
  return value.replace(/\r\n|\r|\n/g, eol)
}

export function padWithSpaces(value: string, maxWidth: number, enabled = true): string {
  if (!enabled || !Number.isFinite(maxWidth) || maxWidth <= 0) return value
  const diff = maxWidth - value.length
  return diff > 0 ? value + ' '.repeat(diff) : value
}

export function deepMerge<T>(base: T, override: unknown): T {
  if (override === undefined) return base
  if (!isPlainObject(base) || !isPlainObject(override)) return override as T

  const result: Record<string, unknown> = { ...base }
  for (const [key, value] of Object.entries(override)) {
    const current = result[key]
    result[key] = isPlainObject(current) && isPlainObject(value) ? deepMerge(current, value) : value
  }
  return result as T
}
