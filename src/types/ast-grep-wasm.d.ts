declare module '@ast-grep/wasm/wasm_bg.js' {
  import type { Tree } from 'web-tree-sitter'

  export interface SgRootLike {
    root(): {
      kind(): string
      text(): string
    }
    getInnerTree(): Tree
  }

  export function __wbg_set_wasm(exports: WebAssembly.Exports): void
  export function initializeTreeSitter(): Promise<void>
  export function registerDynamicLanguage(
    languages: Record<string, { libraryPath: string; expandoChar?: string }>,
  ): Promise<void>
  export function parse(language: string, source: string): SgRootLike
}
