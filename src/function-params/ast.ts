import fs from 'node:fs'
import path from 'node:path'
import * as wasmBg from '@ast-grep/wasm/wasm_bg.js'
import type { Node as SyntaxNode, Tree } from 'web-tree-sitter'
import { Parser } from 'web-tree-sitter'
import type { FunctionParamsLanguage, ParamInfo } from '../types'

interface LanguageParserConfig {
  astGrepName: string
  file: string
  parameterKinds: string[]
  wrapper?: (text: string) => string
}

const LANGUAGES: Record<FunctionParamsLanguage, LanguageParserConfig> = {
  c: {
    astGrepName: 'c',
    file: 'c.wasm',
    parameterKinds: ['parameter_list'],
  },
  cpp: {
    astGrepName: 'cpp',
    file: 'cpp.wasm',
    parameterKinds: ['parameter_list'],
    wrapper: (text) => `class __FileHeader__ {\npublic:\n${text}\n};`,
  },
  csharp: {
    astGrepName: 'c_sharp',
    file: 'c_sharp.wasm',
    parameterKinds: ['parameter_list'],
    wrapper: (text) => `class __FileHeader__ {\n${text}\n}`,
  },
  java: {
    astGrepName: 'java',
    file: 'java.wasm',
    parameterKinds: ['formal_parameters'],
    wrapper: (text) => `class __FileHeader__ {\n${text}\n}`,
  },
  js: {
    astGrepName: 'javascript',
    file: 'javascript.wasm',
    parameterKinds: ['formal_parameters'],
    wrapper: (text) => `class __FileHeader__ {\n${text}\n}`,
  },
  python: {
    astGrepName: 'python',
    file: 'python.wasm',
    parameterKinds: ['parameters'],
    wrapper: (text) => `class __FileHeader__:\n    ${text.trimStart()}`,
  },
  rust: {
    astGrepName: 'rust',
    file: 'rust.wasm',
    parameterKinds: ['parameters'],
    wrapper: (text) => `impl __FileHeader__ {\n${text}\n}`,
  },
  ts: {
    astGrepName: 'typescript',
    file: 'typescript.wasm',
    parameterKinds: ['formal_parameters'],
    wrapper: (text) => `class __FileHeader__ {\n${text}\n}`,
  },
}

let initialization: Promise<boolean> | undefined

function patchParserInit(wasmDirectory: string): void {
  const parser = Parser as unknown as {
    init: (options?: Record<string, unknown>) => Promise<void>
  }
  const originalInit = parser.init.bind(Parser)
  parser.init = (options = {}) =>
    originalInit({
      ...options,
      locateFile: (file: string) => path.join(wasmDirectory, file),
    })
}

async function initialize(extensionPath: string): Promise<boolean> {
  try {
    const wasmDirectory = path.join(extensionPath, 'dist')
    patchParserInit(wasmDirectory)

    const wasmBytes = fs.readFileSync(path.join(wasmDirectory, 'ast-grep.wasm'))
    const { instance } = await WebAssembly.instantiate(wasmBytes, {
      './wasm_bg.js': wasmBg,
    })
    wasmBg.__wbg_set_wasm(instance.exports)
    const start = instance.exports.__wbindgen_start as (() => void) | undefined
    start?.()

    await wasmBg.initializeTreeSitter()

    const registrations: Record<string, { libraryPath: string }> = {}
    for (const config of Object.values(LANGUAGES)) {
      const file = path.join(wasmDirectory, 'parsers', config.file)
      if (fs.existsSync(file)) {
        registrations[config.astGrepName] = { libraryPath: file }
      }
    }

    if (Object.keys(registrations).length === 0) return false
    await wasmBg.registerDynamicLanguage(registrations)
    return true
  } catch (error) {
    console.error('File Header: failed to initialize ast-grep', error)
    return false
  }
}

export function initializeAstParser(extensionPath: string): Promise<boolean> {
  initialization ??= initialize(extensionPath)
  return initialization
}

function findParameterNode(root: SyntaxNode, kinds: Set<string>): SyntaxNode | undefined {
  if (kinds.has(root.type)) return root
  for (const child of root.namedChildren) {
    const found = findParameterNode(child, kinds)
    if (found) return found
  }
  return undefined
}

function findIdentifier(node: SyntaxNode): string | undefined {
  if (node.type === 'identifier' || node.type.endsWith('_identifier')) return node.text
  for (const child of node.namedChildren) {
    const found = findIdentifier(child)
    if (found) return found
  }
  return undefined
}

function stripTypeAnnotation(value: string): string {
  return value.replace(/^:\s*/, '').trim()
}

function extractJsLike(node: SyntaxNode, index: number): ParamInfo | undefined {
  switch (node.type) {
    case 'identifier':
    case 'this':
      return { type: '*', param: node.text }
    case 'rest_pattern': {
      const name = findIdentifier(node)
      return name ? { type: 'array', param: name } : undefined
    }
    case 'assignment_pattern': {
      const left = node.childForFieldName('left') ?? node.namedChildren[0]
      const name = left ? findIdentifier(left) : undefined
      return name ? { type: '*', param: name } : undefined
    }
    case 'object_pattern':
      return { type: 'object', param: `param${index + 1}` }
    case 'array_pattern':
      return { type: 'array', param: `param${index + 1}` }
    case 'required_parameter':
    case 'optional_parameter': {
      const pattern = node.childForFieldName('pattern') ?? node.namedChildren[0]
      if (!pattern) return undefined
      if (pattern.type === 'object_pattern') {
        return { type: 'object', param: `param${index + 1}` }
      }
      if (pattern.type === 'array_pattern') {
        return { type: 'array', param: `param${index + 1}` }
      }
      const name = findIdentifier(pattern)
      if (!name) return undefined
      const typeNode = node.childForFieldName('type')
      return { type: typeNode ? stripTypeAnnotation(typeNode.text) : '*', param: name }
    }
    default:
      return undefined
  }
}

function extractPython(node: SyntaxNode): ParamInfo | undefined {
  switch (node.type) {
    case 'identifier':
      return { type: '*', param: node.text }
    case 'typed_parameter': {
      const name = findIdentifier(node)
      const typeNode = node.childForFieldName('type')
      return name ? { type: typeNode?.text ?? '*', param: name } : undefined
    }
    case 'default_parameter': {
      const name = node.childForFieldName('name')?.text ?? findIdentifier(node)
      return name ? { type: '*', param: name } : undefined
    }
    case 'typed_default_parameter': {
      const name = node.childForFieldName('name')?.text ?? findIdentifier(node)
      const typeNode = node.childForFieldName('type')
      return name ? { type: typeNode?.text ?? '*', param: name } : undefined
    }
    case 'list_splat_pattern': {
      const name = findIdentifier(node)
      return name ? { type: 'array', param: name } : undefined
    }
    case 'dictionary_splat_pattern': {
      const name = findIdentifier(node)
      return name ? { type: 'object', param: name } : undefined
    }
    default:
      return undefined
  }
}

function extractRust(node: SyntaxNode): ParamInfo | undefined {
  if (node.type === 'self_parameter') return { type: '*', param: 'self' }
  if (node.type !== 'parameter') return undefined

  const pattern = node.childForFieldName('pattern')
  const typeNode = node.childForFieldName('type')
  const name = pattern ? findIdentifier(pattern) : undefined
  return name ? { type: typeNode?.text ?? '*', param: name } : undefined
}

function extractCSharp(node: SyntaxNode): ParamInfo | undefined {
  if (node.type !== 'parameter' && node.type !== 'parameter_array') return undefined
  const name = node.childForFieldName('name')?.text ?? findIdentifier(node)
  const typeNode = node.childForFieldName('type')
  return name ? { type: typeNode?.text ?? '*', param: name } : undefined
}

function extractJava(node: SyntaxNode): ParamInfo | undefined {
  if (node.type !== 'formal_parameter' && node.type !== 'spread_parameter') return undefined
  const name = node.childForFieldName('name')?.text ?? findIdentifier(node)
  const typeNode = node.childForFieldName('type')
  return name ? { type: typeNode?.text ?? '*', param: name } : undefined
}

function extractC(node: SyntaxNode): ParamInfo | undefined {
  if (node.type !== 'parameter_declaration' && node.type !== 'optional_parameter_declaration') {
    return undefined
  }

  const declarator = node.childForFieldName('declarator')
  const name = declarator ? findIdentifier(declarator) : undefined
  if (!name) return undefined

  const text = node.text
  const index = text.lastIndexOf(name)
  const type =
    index > 0 ? text.slice(0, index).trim() : (node.childForFieldName('type')?.text ?? '*')
  return { type: type || '*', param: name }
}

function extractParams(
  language: FunctionParamsLanguage,
  node: SyntaxNode,
): ParamInfo[] | undefined {
  const result: ParamInfo[] = []
  const children = node.namedChildren

  for (const child of children) {
    let param: ParamInfo | undefined
    switch (language) {
      case 'js':
      case 'ts':
        param = extractJsLike(child, result.length)
        break
      case 'python':
        param = extractPython(child)
        break
      case 'rust':
        param = extractRust(child)
        break
      case 'csharp':
        param = extractCSharp(child)
        break
      case 'java':
        param = extractJava(child)
        break
      case 'c':
      case 'cpp':
        param = extractC(child)
        break
    }
    if (param) result.push(param)
  }

  if (result.length === 0 && children.length > 0) {
    return undefined
  }
  return result
}

function parseSource(
  language: FunctionParamsLanguage,
  config: LanguageParserConfig,
  source: string,
): ParamInfo[] | undefined {
  const tree: Tree = wasmBg.parse(config.astGrepName, source).getInnerTree()
  const node = findParameterNode(tree.rootNode, new Set(config.parameterKinds))
  if (!node) return undefined
  return extractParams(language, node)
}

export async function extractParamsFromAst(
  language: FunctionParamsLanguage,
  text: string,
  extensionPath: string,
): Promise<ParamInfo[] | undefined> {
  if (!text.trim()) return undefined
  const ready = await initializeAstParser(extensionPath)
  if (!ready) return undefined

  const config = LANGUAGES[language]
  const sources = [text]
  if (config.wrapper) sources.push(config.wrapper(text))

  for (const source of sources) {
    try {
      const params = parseSource(language, config, source)
      if (params !== undefined) return params
    } catch {
      // Try the next source form.
    }
  }

  return undefined
}
