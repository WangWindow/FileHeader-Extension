import { CUSTOM_STRING_PREFIX, SPECIAL_PARAM, SPECIAL_RETURN } from '../constants'
import type { ParamInfo, ResolvedLanguage, Settings, TemplateData } from '../types'
import {
  getFunctionLanguageDefinition,
  getLanguageDefinition,
  getLanguageOverride,
  getNewlineMiddle,
  getSpecialOptionName,
  getSymbol,
  noLinkHeadEnd,
  usesCustomRendering,
} from './language'

export interface RenderContext {
  settings: Settings
  resolved: ResolvedLanguage
  languageId: string
  fsPath: string
}

function symbol(
  context: RenderContext,
  symbolName: 'atSymbol' | 'colon',
  valueType: 'head' | 'fn',
): string {
  return getSymbol({
    settings: context.settings,
    resolved: context.resolved,
    languageId: context.languageId,
    fsPath: context.fsPath,
    symbolName,
    valueType,
  }) as string
}

function newlineAddAnnotationFn(value: string, context: RenderContext): string {
  if (!context.settings.configObj.switch.newlineAddAnnotation) return value
  const middle = getNewlineMiddle(context.settings, context.resolved)
  return value.replace(/\r\n|\r|\n/g, `\n${middle}`)
}

function contentPrefix(
  context: RenderContext,
  definition = getLanguageDefinition(context.resolved, context.settings),
): string {
  if (definition.style === 'line') return definition.middle

  if (!usesCustomRendering(context.resolved, context.settings)) {
    switch (context.resolved.id) {
      case 'python':
        return ''
      case 'shellscript':
        return ' # '
      default:
        return ' * '
    }
  }

  const at = symbol(context, 'atSymbol', 'head')
  const marker = at || '@'
  const middle = definition.middle
  if (!middle.trimEnd().endsWith(marker)) return middle

  const index = middle.lastIndexOf(marker)
  return middle.slice(0, index)
}

export function renderHeaderField(
  key: string,
  value: string,
  context: RenderContext,
  withNewline = true,
): string {
  const decorated = newlineAddAnnotationFn(value, context)
  const at = symbol(context, 'atSymbol', 'head')
  const colon = symbol(context, 'colon', 'head')
  const suffix = withNewline ? '\n' : ''
  const definition = getLanguageDefinition(context.resolved, context.settings)

  if (key.startsWith(CUSTOM_STRING_PREFIX)) {
    return renderHeaderContent(decorated, context, suffix)
  }

  if (definition.style === 'line') {
    return `${definition.middle}${at}${key}${colon}${decorated}${suffix}`
  }

  if (usesCustomRendering(context.resolved, context.settings)) {
    return `${definition.middle}${key}${colon}${decorated}${suffix}`
  }

  switch (context.resolved.id) {
    case 'python':
      return `${key}${colon}${decorated}${suffix}`
    case 'shellscript':
      return ` # ${at}${key}${colon}${decorated}${suffix}`
    default:
      return ` * ${at}${key}${colon}${decorated}${suffix}`
  }
}

function renderHeaderContent(value: string, context: RenderContext, suffix: string): string {
  return `${contentPrefix(context)}${value}${suffix}`
}

export function renderHeader(data: TemplateData, context: RenderContext): string {
  const middle = Object.entries(data)
    .map(([key, value]) => renderHeaderField(key, typeof value === 'string' ? value : '', context))
    .join('')

  const definition = getLanguageDefinition(context.resolved, context.settings)
  if (definition.style === 'line') {
    return middle
  }

  if (
    noLinkHeadEnd(context.settings, context.resolved, context.languageId, context.fsPath, 'head')
  ) {
    return middle
  }

  return `${definition.head}\n${middle}${definition.end}\n`
}

function getParamType(settings: Settings, item: ParamInfo): string {
  let shape = settings.configObj.functionParamsShape
  if (shape === 'no bracket') {
    shape = ['', '']
  } else if (shape === 'normal') {
    shape = ['{', '}']
  } else if (!Array.isArray(shape)) {
    shape = ['{', '}']
  }

  let typeSymbol =
    item.type === undefined || item.type === '*' ? settings.configObj.functionTypeSymbol : item.type
  if (settings.configObj.functionTypeSymbol === 'match param no type') {
    typeSymbol = ''
  }

  return `${shape[0]}${typeSymbol}${shape[1]}`
}

function getParamValue(settings: Settings, item: ParamInfo): string {
  const typeValue = getParamType(settings, item)

  if (settings.configObj.functionParamsShape === 'no type') {
    return item.param ?? ''
  }

  if (item.type === undefined && item.param === undefined) {
    return typeValue
  }

  let result = ''
  if (settings.configObj.typeParamOrder === 'type param') {
    result = `${typeValue} ${item.param ?? ''}`
  } else if (settings.configObj.typeParamOrder === 'param type') {
    result = `${item.param ?? ''} ${typeValue}`
  } else if (settings.configObj.typeParamOrder === 'param') {
    result = item.param ?? ''
  }

  const addStr = settings.configObj.functionParamAddStr
  return addStr ? `${result}${addStr}` : result
}

function renderFunctionKeyLine(
  key: string,
  value: string,
  context: RenderContext,
  indent: string,
): string {
  const definition = getFunctionLanguageDefinition(context.resolved, context.settings)
  const at = symbol(context, 'atSymbol', 'fn')
  const colon = symbol(context, 'colon', 'fn')

  if (definition.style === 'line') {
    return `${indent}${definition.middle}${at}${key}${colon}${value}\n`
  }

  if (usesCustomRendering(context.resolved, context.settings)) {
    return `${indent}${definition.middle}${key}${colon}${value}\n`
  }

  switch (context.resolved.id) {
    case 'python':
      return `${indent}${at}${key}${colon}${value}\n`
    case 'shellscript':
      return `${indent} # ${at}${key}${colon}${value}\n`
    default:
      return `${indent}* ${at}${key}${colon}${value}\n `
  }
}

function renderFunctionParamLine(
  key: string,
  typeValue: string,
  context: RenderContext,
  indent: string,
): string {
  const definition = getFunctionLanguageDefinition(context.resolved, context.settings)
  const at = symbol(context, 'atSymbol', 'fn')

  if (definition.style === 'line') {
    return `${indent}${definition.middle}${at}${key} ${typeValue}\n`
  }

  if (usesCustomRendering(context.resolved, context.settings)) {
    return `${indent}${definition.middle}${key} ${typeValue}\n`
  }

  switch (context.resolved.id) {
    case 'python':
      return `${indent}${at}${key} ${typeValue}\n`
    case 'shellscript':
      return `${indent} # ${at}${key} ${typeValue}\n`
    default:
      return `${indent}* ${at}${key} ${typeValue}\n `
  }
}

function renderFunctionContentLine(value: string, context: RenderContext, indent: string): string {
  return `${indent}${contentPrefix(context)}${value}\n`
}

function renderFunctionField(
  key: string,
  value: string | ParamInfo[],
  context: RenderContext,
  indent: string,
  state: { noParamMatch: boolean },
): string {
  if (key.startsWith(CUSTOM_STRING_PREFIX)) {
    return renderFunctionContentLine(typeof value === 'string' ? value : '', context, indent)
  }

  if (!key.startsWith('param') && !key.startsWith('return')) {
    return renderFunctionKeyLine(key, typeof value === 'string' ? value : '', context, indent)
  }

  let displayKey = key
  const specialParam = getSpecialOptionName(
    context.settings,
    context.resolved,
    context.languageId,
    context.fsPath,
    SPECIAL_PARAM,
    true,
  )
  const specialReturn = getSpecialOptionName(
    context.settings,
    context.resolved,
    context.languageId,
    context.fsPath,
    SPECIAL_RETURN,
    true,
  )

  if (specialParam && key.startsWith('param')) {
    displayKey = specialParam
  } else if (specialReturn && key.startsWith('return')) {
    displayKey = specialReturn
  }

  if (key.startsWith('param') && !Array.isArray(value)) {
    state.noParamMatch = true
    const mode = context.settings.configObj.NoMatchParams
    if (mode === 'no show param' || mode === 'no show param and return') {
      return ''
    }
  }

  if (
    key.startsWith('return') &&
    context.settings.configObj.NoMatchParams === 'no show param and return' &&
    state.noParamMatch
  ) {
    return ''
  }

  if (Array.isArray(value)) {
    return value
      .map((item) =>
        renderFunctionParamLine(displayKey, getParamValue(context.settings, item), context, indent),
      )
      .join('')
  }

  return renderFunctionParamLine(
    displayKey,
    getParamValue(context.settings, {} as ParamInfo),
    context,
    indent,
  )
}

function mergeFunctionTpl(
  content: string,
  indent: string,
  context: RenderContext,
  addTrailingNewline: boolean,
): string {
  const definition = getFunctionLanguageDefinition(context.resolved, context.settings)
  let result: string

  if (definition.style === 'line') {
    result = addTrailingNewline ? content : content.replace(/\n$/, '')
    return result
  }

  if (usesCustomRendering(context.resolved, context.settings)) {
    result = `${indent}${definition.head}\n${content}${indent}${definition.end}`
  } else {
    switch (context.resolved.id) {
      case 'html':
        result = `${indent}<!--\n${content}${indent}-->`
        break
      case 'python':
        result = `${indent}'''\n${content}${indent}'''`
        break
      case 'shellscript':
        result = `${indent}###\n${content}${indent}###`
        break
      default:
        result = `${indent}/**\n ${content}${indent}*/`
        break
    }
  }

  if (addTrailingNewline) result += '\n'
  return result
}

export function renderFunctionComment(
  data: TemplateData,
  context: RenderContext,
  indentWidth: number,
  addTrailingNewline: boolean,
): string {
  const blankSpace = getLanguageOverride<number>(
    context.settings,
    'functionBlankSpaceAll',
    context.resolved,
    context.languageId,
    context.fsPath,
    0,
  )
  const indent = ' '.repeat(Math.max(0, indentWidth + blankSpace))
  const state = { noParamMatch: false }
  let content = ''

  for (const [key, value] of Object.entries(data)) {
    content += renderFunctionField(key, value, context, indent, state)
  }

  if (
    noLinkHeadEnd(
      context.settings,
      context.resolved,
      context.languageId,
      context.fsPath,
      'function',
    )
  ) {
    return content
  }

  return mergeFunctionTpl(content, indent, context, addTrailingNewline)
}
