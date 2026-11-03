import type { FunctionParamsLanguage, ParamInfo, ResolvedLanguage } from '../types'
import { extractParamsFromAst } from './ast'

const LANGUAGE_PARSERS: Record<string, FunctionParamsLanguage> = {
  c: 'c',
  cpp: 'cpp',
  csharp: 'csharp',
  html: 'js',
  java: 'java',
  javascript: 'js',
  javascriptreact: 'js',
  python: 'python',
  rust: 'rust',
  typescript: 'ts',
  typescriptreact: 'ts',
  vue: 'js',
}

export function getFunctionParamsLanguage(
  languageId: string,
  resolved: ResolvedLanguage,
): FunctionParamsLanguage | undefined {
  if (resolved.kind === 'custom' && resolved.config?.functionParams) {
    return resolved.config.functionParams
  }
  return LANGUAGE_PARSERS[languageId]
}

export async function extractFunctionParams(
  languageId: string,
  resolved: ResolvedLanguage,
  text: string,
  extensionPath: string,
): Promise<ParamInfo[] | undefined> {
  const language = getFunctionParamsLanguage(languageId, resolved)
  if (!language) return undefined
  return extractParamsFromAst(language, text, extensionPath)
}
