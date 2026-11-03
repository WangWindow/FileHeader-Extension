import path from 'node:path'
import { BUILTIN_LANGUAGES, LANGUAGE_ALIASES, NO_MATCH_LANGUAGE } from '../constants'
import type {
  BuiltinLanguage,
  ConfigObj,
  CustomHeadEndMode,
  LanguageDefinition,
  ResolvedLanguage,
  Settings,
  SymbolSetting,
} from '../types'
import { firstLine } from './util'

export type SymbolName = 'atSymbol' | 'colon'
export type SymbolValueType = 'arr' | 'head' | 'fn'

export interface SymbolOptions {
  settings: Settings
  resolved: ResolvedLanguage
  languageId: string
  fsPath: string
  symbolName: SymbolName
  valueType: SymbolValueType
}

export function getFileName(fsPath: string): string {
  return path.basename(fsPath)
}

export function getFileExtension(fsPath: string): string {
  const fileName = getFileName(fsPath)
  const index = fileName.lastIndexOf('.')
  return index === -1 ? fileName : fileName.slice(index + 1)
}

export function findSpecialLanguageKey(settings: Settings, fsPath: string): string | undefined {
  const fileName = getFileName(fsPath)
  return Object.keys(settings.configObj.language).find(
    (key) => key.includes('.') && fileName.includes(key) && fileName !== key,
  )
}

export function findCustomLanguageKey(
  settings: Settings,
  languageId: string,
  fsPath: string,
): string | undefined {
  const languages = settings.configObj.language
  const specialKey = findSpecialLanguageKey(settings, fsPath)
  if (specialKey) return specialKey

  if (languages[languageId]) return languageId

  const fileName = getFileName(fsPath)
  if (languages[fileName]) return fileName

  const extension = getFileExtension(fsPath)
  if (languages[extension]) return extension

  return Object.keys(languages).find((key) => {
    if (!key.includes('/')) return false
    return key.split('/').some((part) => part === languageId || part === extension)
  })
}

export function resolveLanguage(
  languageId: string,
  fsPath: string,
  settings: Settings,
): ResolvedLanguage {
  const customKey = findCustomLanguageKey(settings, languageId, fsPath)
  if (customKey) {
    return {
      kind: 'custom',
      id: customKey,
      config: settings.configObj.language[customKey],
    }
  }

  const builtin =
    LANGUAGE_ALIASES[languageId] ?? LANGUAGE_ALIASES[getFileExtension(fsPath).toLowerCase()]
  if (builtin) {
    return { kind: 'builtin', id: builtin }
  }

  return { kind: 'unknown', id: NO_MATCH_LANGUAGE }
}

export function getLanguageDefinition(
  resolved: ResolvedLanguage,
  settings: Settings,
): LanguageDefinition {
  if (resolved.kind === 'custom' && resolved.config) return resolved.config
  if (resolved.kind === 'builtin') {
    return BUILTIN_LANGUAGES[resolved.id as BuiltinLanguage] ?? BUILTIN_LANGUAGES.javascript
  }
  if (settings.configObj.annotationStr.use) return settings.configObj.annotationStr
  return BUILTIN_LANGUAGES.javascript
}

export function getFunctionLanguageDefinition(
  resolved: ResolvedLanguage,
  settings: Settings,
): LanguageDefinition {
  const definition = getLanguageDefinition(resolved, settings)
  if (resolved.kind !== 'custom' || !resolved.config?.functionSymbol) return definition
  return { ...definition, ...resolved.config.functionSymbol }
}

export function usesCustomRendering(resolved: ResolvedLanguage, settings: Settings): boolean {
  return (
    resolved.kind === 'custom' ||
    (resolved.kind === 'unknown' && settings.configObj.annotationStr.use)
  )
}

function normalizeSymbolSetting(value: SymbolSetting): [string, string] {
  return Array.isArray(value) ? [value[0] ?? '', value[1] ?? ''] : [value, value]
}

function findRecordSettingKey<T>(
  record: Record<string, T>,
  resolved: ResolvedLanguage,
  languageId: string,
  fsPath: string,
): string | undefined {
  const fileName = getFileName(fsPath)
  const extension = getFileExtension(fsPath)
  const specialKey = Object.keys(record).find(
    (key) => key.includes('.') && fileName.includes(key) && fileName !== key,
  )
  if (specialKey !== undefined) return specialKey

  const candidates = [resolved.id, languageId, fileName, extension]
  for (const candidate of candidates) {
    if (record[candidate] !== undefined) return candidate
  }

  return Object.keys(record).find((key) => {
    if (!key.includes('/')) return false
    return key
      .split('/')
      .some((part) => part === resolved.id || part === languageId || part === extension)
  })
}

export function getSymbol(options: SymbolOptions): string | string[] {
  const { settings, resolved, languageId, fsPath, symbolName, valueType } = options
  const overrideName = symbolName === 'atSymbol' ? 'atSymbolObj' : 'colonObj'
  const overrideRecord = settings.configObj[overrideName] as Record<string, SymbolSetting>
  const key = findRecordSettingKey(overrideRecord, resolved, languageId, fsPath)
  const configured = key === undefined ? settings.configObj[symbolName] : overrideRecord[key]
  let pair = normalizeSymbolSetting(configured)

  if (symbolName === 'atSymbol') {
    if (resolved.kind === 'custom') {
      pair = ['', '']
    } else if (
      resolved.id === 'python' ||
      languageId === 'python' ||
      getFileExtension(fsPath).toLowerCase() === 'py'
    ) {
      pair = ['', '']
    }
  }

  if (valueType === 'arr') return pair
  return valueType === 'head' ? pair[0] : pair[1]
}

export function getLanguageOverride<T>(
  settings: Settings,
  optionsName: keyof ConfigObj,
  resolved: ResolvedLanguage,
  languageId: string,
  fsPath: string,
  defaultValue: T,
): T {
  const record = settings.configObj[optionsName] as unknown as Record<string, unknown>
  const key = findRecordSettingKey(record, resolved, languageId, fsPath)
  if (key !== undefined) return record[key] as T

  const defaultSetting = record.defaultSetting
  if (defaultSetting !== undefined) return defaultSetting as T

  return defaultValue
}

export function getSpecialOptions(
  settings: Settings,
  resolved: ResolvedLanguage,
  languageId: string,
  fsPath: string,
): Record<string, string> {
  const record = settings.configObj.specialOptions
  const result: Record<string, string> = {}

  for (const [key, value] of Object.entries(record)) {
    if (typeof value === 'string') result[key] = value
  }

  const languageKey = findRecordSettingKey(record, resolved, languageId, fsPath)
  const languageOptions = languageKey === undefined ? undefined : record[languageKey]
  if (languageOptions && typeof languageOptions === 'object') {
    for (const [key, value] of Object.entries(languageOptions)) {
      if (typeof value === 'string') result[key] = value
    }
  }

  return result
}

export function getSpecialOptionName(
  settings: Settings,
  resolved: ResolvedLanguage,
  languageId: string,
  fsPath: string,
  key: string,
  onlyIfConfigured = false,
): string | undefined {
  const options = getSpecialOptions(settings, resolved, languageId, fsPath)
  if (onlyIfConfigured) return options[key]
  return options[key] ?? key
}

export function noLinkHeadEnd(
  settings: Settings,
  resolved: ResolvedLanguage,
  languageId: string,
  fsPath: string,
  type: 'head' | 'function',
): boolean {
  if (resolved.kind !== 'custom') return false

  const mode = getLanguageOverride<CustomHeadEndMode>(
    settings,
    'customHasHeadEnd',
    resolved,
    languageId,
    fsPath,
    '',
  )

  if (mode === 'cancel head and function') return true
  if (type === 'function' && mode === 'cancel function') return true
  if (type === 'head' && mode === 'cancel head') return true
  return false
}

export function getAnnotationStart(
  settings: Settings,
  resolved: ResolvedLanguage,
  languageId: string,
  fsPath: string,
  type: 'head' | 'function' = 'head',
): string {
  const definition = getLanguageDefinition(resolved, settings)
  if (definition.style === 'line') {
    return firstLine(definition.middle).trim()
  }
  if (noLinkHeadEnd(settings, resolved, languageId, fsPath, type)) {
    return firstLine(definition.middle || definition.head)
  }
  return firstLine(definition.head)
}

export function getNewlineMiddle(settings: Settings, resolved: ResolvedLanguage): string {
  if (resolved.kind === 'custom' && resolved.config) return resolved.config.middle
  if (resolved.kind === 'builtin') {
    return BUILTIN_LANGUAGES[resolved.id as BuiltinLanguage].middle
  }
  return settings.configObj.annotationStr.use
    ? settings.configObj.annotationStr.middle
    : BUILTIN_LANGUAGES.javascript.middle
}
