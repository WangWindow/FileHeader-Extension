import type { ResolvedLanguage, Settings } from '../types'
import { getFileExtension, getFileName } from './language'

function lookupLanguageValue<T>(
  record: Record<string, T>,
  resolved: ResolvedLanguage,
  languageId: string,
  fsPath: string,
): T | undefined {
  const fileName = getFileName(fsPath)
  const extension = getFileExtension(fsPath)

  const specialKey = Object.keys(record).find(
    (key) => key.includes('.') && fileName.includes(key) && fileName !== key,
  )
  if (specialKey !== undefined) return record[specialKey]

  const candidates = [resolved.id, languageId, fileName, extension, '*']
  for (const candidate of candidates) {
    if (record[candidate] !== undefined) return record[candidate]
  }

  const slashKey = Object.keys(record).find((key) => {
    if (!key.includes('/')) return false
    return key
      .split('/')
      .some((part) => part === resolved.id || part === languageId || part === extension)
  })
  return slashKey === undefined ? undefined : record[slashKey]
}

export interface PreparedHeader {
  template: string
  lineNumber: number
}

export function prepareHeaderTemplate(
  template: string,
  settings: Settings,
  resolved: ResolvedLanguage,
  languageId: string,
  fsPath: string,
): PreparedHeader {
  const configuredLine = lookupLanguageValue(
    settings.configObj.headInsertLine,
    resolved,
    languageId,
    fsPath,
  )
  const lineNumber =
    typeof configuredLine === 'number' && configuredLine > 0 ? configuredLine - 1 : 0

  const before = lookupLanguageValue(
    settings.configObj.beforeAnnotation,
    resolved,
    languageId,
    fsPath,
  )
  const after = lookupLanguageValue(
    settings.configObj.afterAnnotation,
    resolved,
    languageId,
    fsPath,
  )

  let result = template
  if (before) result = `${before}\n${result}`
  if (after) {
    result = after === '\n' ? `${result}${after}` : `${result}${after}\n`
  }

  return { template: result, lineNumber }
}
