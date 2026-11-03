import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const dist = path.join(root, 'dist')
const parsers = path.join(dist, 'parsers')

function copy(source: string, target: string): void {
  if (!fs.existsSync(source)) {
    throw new Error(`Missing asset: ${source}`)
  }
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.copyFileSync(source, target)
}

fs.mkdirSync(dist, { recursive: true })
fs.mkdirSync(parsers, { recursive: true })

copy(path.join(root, 'node_modules/@ast-grep/wasm/wasm_bg.wasm'), path.join(dist, 'ast-grep.wasm'))
copy(
  path.join(root, 'node_modules/web-tree-sitter/web-tree-sitter.wasm'),
  path.join(dist, 'web-tree-sitter.wasm'),
)

const grammars: Record<string, string> = {
  javascript: 'tree-sitter-javascript.wasm',
  typescript: 'tree-sitter-typescript.wasm',
  python: 'tree-sitter-python.wasm',
  rust: 'tree-sitter-rust.wasm',
  c: 'tree-sitter-c.wasm',
  cpp: 'tree-sitter-cpp.wasm',
  java: 'tree-sitter-java.wasm',
  c_sharp: 'tree-sitter-c_sharp.wasm',
}

for (const [name, file] of Object.entries(grammars)) {
  copy(
    path.join(root, 'node_modules/@repomix/tree-sitter-wasms/out', file),
    path.join(parsers, `${name}.wasm`),
  )
}

console.log('Copied parser assets to dist/')
