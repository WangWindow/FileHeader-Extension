import {
  SPECIAL_AUTHOR,
  SPECIAL_DATE,
  SPECIAL_FILE_PATH,
  SPECIAL_FN_DESCRIPTION,
  SPECIAL_HEAD_DESCRIPTION,
  SPECIAL_LAST_EDIT_TIME,
  SPECIAL_LAST_EDITORS,
} from '../constants'
import type { ResolvedLanguage, Settings } from '../types'
import { getSpecialOptionName } from './language'
import { padWithSpaces } from './util'

const RENAMEABLE_FIELDS = new Set([
  SPECIAL_AUTHOR,
  SPECIAL_DATE,
  SPECIAL_HEAD_DESCRIPTION,
  SPECIAL_FN_DESCRIPTION,
  SPECIAL_LAST_EDIT_TIME,
  SPECIAL_LAST_EDITORS,
  SPECIAL_FILE_PATH,
])

export function changePrototypeNameFn(
  data: Record<string, string>,
  settings: Settings,
  resolved: ResolvedLanguage,
  languageId: string,
  fsPath: string,
): Record<string, string> {
  const result: Record<string, string> = {}

  for (const [key, value] of Object.entries(data)) {
    const specialName = getSpecialOptionName(settings, resolved, languageId, fsPath, key, true)

    if (RENAMEABLE_FIELDS.has(key) && specialName) {
      result[specialName] = value
    } else {
      result[key] = value
    }
  }

  return result
}

export function sameLengthFn<T>(
  data: Record<string, T>,
  settings: Settings,
  maxWidth: number,
  type: 'head' | 'function',
): Record<string, T> {
  if (type === 'head' && !settings.configObj.wideSame) return data
  if (!maxWidth) return data

  const result: Record<string, T> = {}
  for (const [key, value] of Object.entries(data)) {
    result[padWithSpaces(key, maxWidth)] = value
  }
  return result
}

export function getSpecialOptionKey(
  settings: Settings,
  resolved: ResolvedLanguage,
  languageId: string,
  fsPath: string,
  key: string,
): string {
  const name = getSpecialOptionName(settings, resolved, languageId, fsPath, key) ?? key
  return padWithSpaces(name, settings.configObj.wideNum, settings.configObj.wideSame)
}
