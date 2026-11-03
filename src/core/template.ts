import {
  CUSTOM_STRING_PREFIX,
  DEFAULT_CURSOR_DATA,
  DEFAULT_HEADER_DATA,
  SPECIAL_DATE,
  SPECIAL_FILE_PATH,
  SPECIAL_LAST_EDIT_TIME,
} from '../constants'
import type {
  FileStatInfo,
  ResolvedLanguage,
  Settings,
  TemplateData,
  WorkspaceInfo,
} from '../types'
import { formatDate } from './date'
import { createFilePath } from './filePath'
import { changePrototypeNameFn, sameLengthFn } from './special'

export interface TemplateBuildContext {
  settings: Settings
  resolved: ResolvedLanguage
  languageId: string
  fsPath: string
  workspace: WorkspaceInfo
  now: Date
  git: (command: string) => string
  fileStat?: FileStatInfo
  defaultDescription: string
}

const GIT_COMMANDS = [
  'git config user.name && git config user.email',
  'git config user.name',
  'git config user.email',
]

function replaceTemplateValues(value: string, context: TemplateBuildContext): string {
  let result = value.replace(/\$\{now_year\}/g, formatDate(context.now, 'YYYY'))

  for (const command of GIT_COMMANDS) {
    if (result.includes(command)) {
      result = result.split(command).join(context.git(command))
    }
  }

  return result
}

function changeTplValue(
  data: Record<string, string>,
  context: TemplateBuildContext,
): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(data)) {
    result[key] = replaceTemplateValues(value, context)
  }
  return result
}

function applyGeneratedValues(
  data: Record<string, string>,
  context: TemplateBuildContext,
): Record<string, string> {
  const dateFormat = context.settings.configObj.dateFormat
  let time = formatDate(context.now, dateFormat)

  if (context.settings.configObj.createFileTime && context.fileStat) {
    let createTime: Date = context.fileStat.birthtime
    if (formatDate(createTime, dateFormat).startsWith('1970')) {
      createTime = context.fileStat.ctime
    }
    time = formatDate(createTime, dateFormat)
  }

  if (data[`${CUSTOM_STRING_PREFIX}date`] !== undefined) {
    data[`${CUSTOM_STRING_PREFIX}date`] = time
  }
  if (data[SPECIAL_DATE] !== undefined) {
    data[SPECIAL_DATE] = time
  }
  if (data[SPECIAL_LAST_EDIT_TIME] !== undefined) {
    data[SPECIAL_LAST_EDIT_TIME] = formatDate(context.now, dateFormat)
  }
  if (data[SPECIAL_FILE_PATH] !== undefined) {
    data[SPECIAL_FILE_PATH] = createFilePath(
      data[SPECIAL_FILE_PATH],
      context.settings,
      context.workspace,
    )
  }

  return data
}

export function buildHeaderData(
  template: Record<string, string>,
  context: TemplateBuildContext,
): TemplateData {
  const base: Record<string, string> =
    Object.keys(template).length > 0
      ? { ...template }
      : { ...DEFAULT_HEADER_DATA, Description: context.defaultDescription }

  let data = applyGeneratedValues(base, context)
  data = changePrototypeNameFn(
    data,
    context.settings,
    context.resolved,
    context.languageId,
    context.fsPath,
  )
  data = changeTplValue(data, context)
  return sameLengthFn(data, context.settings, context.settings.configObj.wideNum, 'head')
}

export function buildFunctionData(
  template: Record<string, string>,
  context: TemplateBuildContext,
): TemplateData {
  const base: Record<string, string> =
    Object.keys(template).length > 0 ? { ...template } : { ...DEFAULT_CURSOR_DATA }

  if (base[SPECIAL_DATE] !== undefined) {
    base[SPECIAL_DATE] = formatDate(context.now, context.settings.configObj.dateFormat)
  }

  let data = changePrototypeNameFn(
    base,
    context.settings,
    context.resolved,
    context.languageId,
    context.fsPath,
  )
  data = changeTplValue(data, context)
  return sameLengthFn(
    data,
    context.settings,
    context.settings.configObj.functionWideNum,
    'function',
  )
}
