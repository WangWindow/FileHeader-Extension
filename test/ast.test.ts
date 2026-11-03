import { describe, expect, test } from 'bun:test'
import { extractParamsFromAst } from '../src/function-params/ast'
import type { FunctionParamsLanguage } from '../src/types'

const extensionPath = process.cwd()

const CASES: Array<{
  language: FunctionParamsLanguage
  source: string
  expected: Array<{ type: string; param: string }>
}> = [
  {
    language: 'c',
    source: 'int example(int first, char *second) {',
    expected: [
      { type: 'int', param: 'first' },
      { type: 'char *', param: 'second' },
    ],
  },
  {
    language: 'cpp',
    source: 'void example(int first, const std::string& second) {',
    expected: [
      { type: 'int', param: 'first' },
      { type: 'const std::string&', param: 'second' },
    ],
  },
  {
    language: 'csharp',
    source: 'public void Example(int first, string second) {',
    expected: [
      { type: 'int', param: 'first' },
      { type: 'string', param: 'second' },
    ],
  },
  {
    language: 'java',
    source: 'public void example(int first, String second) {',
    expected: [
      { type: 'int', param: 'first' },
      { type: 'String', param: 'second' },
    ],
  },
  {
    language: 'js',
    source: 'function example(first, second = 1, ...rest) {',
    expected: [
      { type: '*', param: 'first' },
      { type: '*', param: 'second' },
      { type: 'array', param: 'rest' },
    ],
  },
  {
    language: 'python',
    source: 'def example(first: int, second=1, *args, **kwargs):',
    expected: [
      { type: 'int', param: 'first' },
      { type: '*', param: 'second' },
      { type: 'array', param: 'args' },
      { type: 'object', param: 'kwargs' },
    ],
  },
  {
    language: 'rust',
    source: 'fn example(first: i32, second: &str) -> i32 {',
    expected: [
      { type: 'i32', param: 'first' },
      { type: '&str', param: 'second' },
    ],
  },
  {
    language: 'ts',
    source: 'function example(first: string, second?: number): void {',
    expected: [
      { type: 'string', param: 'first' },
      { type: 'number', param: 'second' },
    ],
  },
]

describe('ast-grep parameter extraction', () => {
  for (const item of CASES) {
    test(item.language, async () => {
      const result = await extractParamsFromAst(item.language, item.source, extensionPath)
      expect(result).toEqual(item.expected)
    })
  }

  test('parses class methods through the wrapper fallback', async () => {
    const result = await extractParamsFromAst('js', 'handle(value, options = {}) {', extensionPath)
    expect(result).toEqual([
      { type: '*', param: 'value' },
      { type: '*', param: 'options' },
    ])
  })

  test('parses indented Python methods through the wrapper fallback', async () => {
    const result = await extractParamsFromAst(
      'python',
      '    def handle(self, value: int):',
      extensionPath,
    )
    expect(result).toEqual([
      { type: '*', param: 'self' },
      { type: 'int', param: 'value' },
    ])
  })

  test('returns an empty list for functions without parameters', async () => {
    const result = await extractParamsFromAst('js', 'function empty() {}', extensionPath)
    expect(result).toEqual([])
  })
})
