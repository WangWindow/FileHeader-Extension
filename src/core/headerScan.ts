import {
  HEADER_SCAN_LINES,
  SPECIAL_DATE,
  SPECIAL_FILE_PATH,
  SPECIAL_LAST_EDIT_TIME,
  SPECIAL_LAST_EDITORS,
} from '../constants'
import type { ResolvedLanguage, Settings, TemplateData } from '../types'
import { formatDate } from './date'
import { getAnnotationStart, getLanguageDefinition, getSymbol, noLinkHeadEnd } from './language'
import type { RenderContext } from './render'
import { renderHeaderField } from './render'
import { getSpecialOptionKey } from './special'

export interface HeaderReplacement {
  line: number
  text: string
}

export interface HeaderScanResult {
  hasAnnotation: boolean
  replacements: HeaderReplacement[]
}

function hasHeaderStart(
  line: string,
  settings: Settings,
  resolved: ResolvedLanguage,
  languageId: string,
  fsPath: string,
): boolean {
  const start = getAnnotationStart(settings, resolved, languageId, fsPath).trim()
  if (!start) return false
  const trimmed = line.trim()
  const definition = getLanguageDefinition(resolved, settings)

  if (definition.style === 'line') {
    return trimmed.startsWith(start) && !trimmed.startsWith(`${start}!`)
  }
  if (noLinkHeadEnd(settings, resolved, languageId, fsPath, 'head')) {
    return trimmed.startsWith(start)
  }
  return trimmed === start
}

export function findHeaderStartLine(
  lines: string[],
  settings: Settings,
  resolved: ResolvedLanguage,
  languageId: string,
  fsPath: string,
): number | undefined {
  const limit = Math.min(lines.length, HEADER_SCAN_LINES)
  for (let index = 0; index < limit; index++) {
    if (hasHeaderStart(lines[index] ?? '', settings, resolved, languageId, fsPath)) {
      return index
    }
  }
  return undefined
}

function containsHeaderKey(line: string, symbol: string, key: string): boolean {
  const token = `${symbol}${key}`
  const index = line.indexOf(token)
  if (index === -1) return false
  const next = line[index + token.length]
  return next === undefined || /[\s:：]/.test(next)
}

export function scanHeader(
  lines: string[],
  settings: Settings,
  resolved: ResolvedLanguage,
  languageId: string,
  fsPath: string,
  data: TemplateData,
  now: Date,
): HeaderScanResult {
  const replacements: HeaderReplacement[] = []
  const startLine = findHeaderStartLine(lines, settings, resolved, languageId, fsPath)
  if (startLine === undefined) return { hasAnnotation: false, replacements }

  const context: RenderContext = { settings, resolved, languageId, fsPath }
  const atSymbol = getSymbol({
    settings,
    resolved,
    languageId,
    fsPath,
    symbolName: 'atSymbol',
    valueType: 'head',
  }) as string

  const lastEditorsKey = getSpecialOptionKey(
    settings,
    resolved,
    languageId,
    fsPath,
    SPECIAL_LAST_EDITORS,
  )
  const lastEditTimeKey = getSpecialOptionKey(
    settings,
    resolved,
    languageId,
    fsPath,
    SPECIAL_LAST_EDIT_TIME,
  )
  const filePathKey = getSpecialOptionKey(settings, resolved, languageId, fsPath, SPECIAL_FILE_PATH)
  const dateKey = getSpecialOptionKey(settings, resolved, languageId, fsPath, SPECIAL_DATE)

  const limit = Math.min(lines.length, HEADER_SCAN_LINES)
  for (let index = startLine; index < limit; index++) {
    const line = lines[index] ?? ''

    if (containsHeaderKey(line, atSymbol, lastEditorsKey)) {
      const value = String(data[lastEditorsKey] ?? 'Please set LastEditors')
      replacements.push({
        line: index,
        text: renderHeaderField(lastEditorsKey, value, context, false),
      })
      continue
    }

    if (containsHeaderKey(line, atSymbol, lastEditTimeKey)) {
      replacements.push({
        line: index,
        text: renderHeaderField(
          lastEditTimeKey,
          formatDate(now, settings.configObj.dateFormat),
          context,
          false,
        ),
      })
      continue
    }

    if (data[filePathKey] !== undefined && containsHeaderKey(line, atSymbol, filePathKey)) {
      const value = String(data[filePathKey] ?? '')
      replacements.push({
        line: index,
        text: renderHeaderField(filePathKey, value, context, false),
      })
      continue
    }

    if (containsHeaderKey(line, atSymbol, dateKey)) {
      // Date is written when the header is created and is not updated on save.
    }
  }

  return { hasAnnotation: true, replacements }
}
