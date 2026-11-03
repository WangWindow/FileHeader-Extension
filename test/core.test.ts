import { describe, expect, test } from 'bun:test'
import packageJson from '../package.json'
import { DEFAULT_CONFIG_OBJ } from '../src/constants'
import { createFilePath } from '../src/core/filePath'
import { hasNonHeaderChanges } from '../src/core/gitDiff'
import { scanHeader } from '../src/core/headerScan'
import { getAnnotationStart, getSpecialOptionName, resolveLanguage } from '../src/core/language'
import { renderFunctionComment, renderHeader } from '../src/core/render'
import { buildFunctionData, buildHeaderData } from '../src/core/template'
import { deepMerge, padWithSpaces } from '../src/core/util'
import type {
  ConfigObj,
  ResolvedLanguage,
  Settings,
  TemplateData,
  WorkspaceInfo,
} from '../src/types'

const USER_LANGUAGE = {
  head: '/*\n==============================================================================',
  middle: ' * @',
  end: '==============================================================================\n*/',
}

const workspace: WorkspaceInfo = {
  itemPath: '/repo/project',
  itemName: 'project',
  fileItemPath: '/src/example.tsx',
}

function createSettings(config: Partial<ConfigObj> = {}): Settings {
  return {
    customMade: {},
    cursorMode: {},
    configObj: deepMerge(DEFAULT_CONFIG_OBJ, config),
  }
}

function userSettings(): Settings {
  return createSettings({
    autoAdd: false,
    language: {
      'c/cpp/cs/h/java/jsx/tsx/rs': USER_LANGUAGE,
      'ipynb/py': {
        head: '"""\n==============================================================================',
        middle: ' * @',
        end: '==============================================================================\n"""',
      },
    },
  })
}

function userCustomMade(): Record<string, string> {
  return {
    FilePath: 'only file name',
    Author: '<git config user.name && git config user.email>',
    Date: 'Do not edit',
    LastEditors: 'git config user.name',
    LastEditTime: 'Do not Edit',
    custom_string_copyright: '$' + '{now_year} by git config user.name, All Rights Reserved.',
    Descripttion: '',
  }
}

function renderContext(settings: Settings, resolved: ResolvedLanguage, fsPath: string) {
  return { settings, resolved, languageId: '', fsPath }
}

describe('package defaults', () => {
  test('keeps the manifest defaults in sync with the runtime defaults', () => {
    const manifest = packageJson as unknown as {
      contributes: {
        configuration: {
          properties: Record<string, { default: unknown }>
        }
      }
    }
    expect(manifest.contributes.configuration.properties['fileheader.configObj'].default).toEqual(
      DEFAULT_CONFIG_OBJ,
    )
  })
})

describe('language resolution', () => {
  test('matches slash separated custom extensions', () => {
    const settings = userSettings()
    expect(resolveLanguage('c', '/repo/example.c', settings).id).toBe('c/cpp/cs/h/java/jsx/tsx/rs')
    expect(resolveLanguage('javascript', '/repo/example.jsx', settings).id).toBe(
      'c/cpp/cs/h/java/jsx/tsx/rs',
    )
    expect(resolveLanguage('python', '/repo/example.py', settings).id).toBe('ipynb/py')
    expect(resolveLanguage('javascript', '/repo/example.js', settings).kind).toBe('builtin')
  })

  test('uses the first line of multi-line custom comments as the start marker', () => {
    const settings = userSettings()
    const resolved = resolveLanguage('javascript', '/repo/example.jsx', settings)
    expect(getAnnotationStart(settings, resolved, 'javascript', '/repo/example.jsx')).toBe('/*')
  })

  test('supports TIOBE top ten line comment styles', () => {
    const settings = createSettings()
    expect(getAnnotationStart(settings, { kind: 'builtin', id: 'r' }, 'r', '/repo/a.r')).toBe('#')
    expect(getAnnotationStart(settings, { kind: 'builtin', id: 'sql' }, 'sql', '/repo/a.sql')).toBe(
      '--',
    )
    expect(
      getAnnotationStart(settings, { kind: 'builtin', id: 'visualbasic' }, 'vb', '/repo/a.vb'),
    ).toBe("'")
  })
})

describe('header generation', () => {
  test('renders the user custom language, git values and copyright field', () => {
    const settings = userSettings()
    const resolved = resolveLanguage('javascript', '/repo/project/src/example.tsx', settings)
    const data = buildHeaderData(userCustomMade(), {
      settings,
      resolved,
      languageId: 'javascriptreact',
      fsPath: '/repo/project/src/example.tsx',
      workspace,
      now: new Date('2026-11-03T12:34:56Z'),
      git: (command) => {
        if (command === 'git config user.name && git config user.email') {
          return 'WangWindow 1598593280@qq.com'
        }
        if (command === 'git config user.name') return 'WangWindow'
        return command
      },
      defaultDescription: 'default',
    })

    expect(data.FilePath).toBe('example.tsx')
    expect(data.Author).toBe('<WangWindow 1598593280@qq.com>')
    expect(data.LastEditors).toBe('WangWindow')
    expect(data.custom_string_copyright).toBe('2026 by WangWindow, All Rights Reserved.')

    const text = renderHeader(
      data,
      renderContext(settings, resolved, '/repo/project/src/example.tsx'),
    )
    expect(
      text.startsWith(
        '/*\n==============================================================================',
      ),
    ).toBe(true)
    expect(text).toContain(' * @Author: <WangWindow 1598593280@qq.com>')
    expect(text).toContain(' * 2026 by WangWindow, All Rights Reserved.')
    expect(text).not.toContain('custom_string_copyright')
  })

  test('renders line style headers for R and SQL', () => {
    const settings = createSettings()
    const data: TemplateData = { Author: 'WangWindow', Date: '2026-11-03' }
    const r = renderHeader(data, renderContext(settings, { kind: 'builtin', id: 'r' }, '/a.r'))
    const sql = renderHeader(
      data,
      renderContext(settings, { kind: 'builtin', id: 'sql' }, '/a.sql'),
    )
    const vb = renderHeader(
      data,
      renderContext(settings, { kind: 'builtin', id: 'visualbasic' }, '/a.vb'),
    )
    expect(r).toBe('# @Author: WangWindow\n# @Date: 2026-11-03\n')
    expect(sql).toBe('-- @Author: WangWindow\n-- @Date: 2026-11-03\n')
    expect(vb).toBe("' @Author: WangWindow\n' @Date: 2026-11-03\n")
  })

  test('renders line style function comments', () => {
    const settings = createSettings()
    const data: TemplateData = {
      description: 'example',
      param: [{ type: '*', param: 'value' }],
      return: '',
    }
    const text = renderFunctionComment(
      data,
      renderContext(settings, { kind: 'builtin', id: 'r' }, '/a.r'),
      0,
      true,
    )
    expect(text).toBe('# @description: example\n# @param {*} value\n# @return {*}\n')
  })

  test('renders HTML function comments with HTML delimiters', () => {
    const settings = createSettings()
    const data: TemplateData = { description: 'example', param: '', return: '' }
    const text = renderFunctionComment(
      data,
      renderContext(settings, { kind: 'builtin', id: 'html' }, '/a.html'),
      0,
      true,
    )
    expect(text.startsWith('<!--\n')).toBe(true)
    expect(text.endsWith('-->\n')).toBe(true)
  })

  test('renders custom content fields without field names', () => {
    const settings = userSettings()
    const resolved = resolveLanguage('javascript', '/repo/project/src/example.tsx', settings)
    const data: TemplateData = {
      Author: 'WangWindow',
      custom_string_copyright: '2026 WangWindow',
      custom_string_note: 'Generated by File Header',
    }
    const header = renderHeader(
      data,
      renderContext(settings, resolved, '/repo/project/src/example.tsx'),
    )
    expect(header).toContain(' * @Author: WangWindow')
    expect(header).toContain(' * 2026 WangWindow')
    expect(header).toContain(' * Generated by File Header')
    expect(header).not.toContain('custom_string_')

    const comment = renderFunctionComment(
      {
        description: 'example',
        custom_string_copyright: '2026 WangWindow',
      },
      renderContext(settings, resolved, '/repo/project/src/example.tsx'),
      0,
      true,
    )
    expect(comment).toContain(' * 2026 WangWindow')
    expect(comment).not.toContain('custom_string_')
  })

  test('detects and updates a line style header', () => {
    const settings = createSettings()
    const resolved = { kind: 'builtin' as const, id: 'r' }
    const lines = ['# @Author: WangWindow', '# @LastEditors: WangWindow', '# @LastEditTime: old']
    const data: TemplateData = {
      Author: 'WangWindow',
      LastEditors: 'WangWindow',
      LastEditTime: 'old',
    }
    const result = scanHeader(
      lines,
      settings,
      resolved,
      'r',
      '/repo/a.r',
      data,
      new Date('2026-11-03T12:00:00Z'),
    )
    expect(result.hasAnnotation).toBe(true)
    expect(result.replacements.map((item) => item.line)).toEqual([1, 2])
  })

  test('detects a line style header that starts with a content field', () => {
    const settings = createSettings()
    const resolved = { kind: 'builtin' as const, id: 'r' }
    const result = scanHeader(
      ['# 2026 WangWindow', '# @LastEditors: old'],
      settings,
      resolved,
      'r',
      '/repo/a.r',
      { custom_string_copyright: '2026 WangWindow', LastEditors: 'WangWindow' },
      new Date('2026-11-03T12:00:00Z'),
    )
    expect(result.hasAnnotation).toBe(true)
    expect(result.replacements.map((item) => item.line)).toEqual([1])
  })

  test('uses a custom function symbol for function comments', () => {
    const settings = createSettings({
      language: {
        jsx: {
          head: '/*HEAD',
          middle: ' * @',
          end: 'HEAD*/',
          functionSymbol: {
            head: '/**FUNC',
            middle: ' * @',
            end: 'FUNC*/',
          },
        },
      },
    })
    const resolved = resolveLanguage('javascript', '/repo/a.jsx', settings)
    const text = renderFunctionComment(
      { description: 'example' },
      renderContext(settings, resolved, '/repo/a.jsx'),
      0,
      true,
    )
    expect(text.startsWith('/**FUNC\n')).toBe(true)
    expect(text.endsWith('FUNC*/\n')).toBe(true)
  })

  test('detects a header with only a date field', () => {
    const settings = createSettings()
    const resolved = { kind: 'builtin' as const, id: 'javascript' }
    const result = scanHeader(
      ['/*', ' * @Date: 2026-01-01 00:00:00', ' */'],
      settings,
      resolved,
      'javascript',
      '/repo/a.js',
      { Date: '2026-01-01 00:00:00' },
      new Date('2026-11-03T12:00:00Z'),
    )
    expect(result.hasAnnotation).toBe(true)
    expect(result.replacements).toEqual([])
  })

  test('detects and updates a multi-line custom header', () => {
    const settings = userSettings()
    const resolved = resolveLanguage('javascript', '/repo/project/src/example.tsx', settings)
    const data = buildHeaderData(userCustomMade(), {
      settings,
      resolved,
      languageId: 'javascriptreact',
      fsPath: '/repo/project/src/example.tsx',
      workspace,
      now: new Date('2026-11-03T12:34:56Z'),
      git: (command) => {
        if (command === 'git config user.name && git config user.email') {
          return 'WangWindow 1598593280@qq.com'
        }
        if (command === 'git config user.name') return 'WangWindow'
        return command
      },
      defaultDescription: 'default',
    })
    const lines = renderHeader(
      data,
      renderContext(settings, resolved, '/repo/project/src/example.tsx'),
    ).split('\n')

    const result = scanHeader(
      lines,
      settings,
      resolved,
      'javascriptreact',
      '/repo/project/src/example.tsx',
      data,
      new Date('2026-11-04T00:00:00Z'),
    )
    expect(result.hasAnnotation).toBe(true)
    expect(result.replacements.length).toBeGreaterThanOrEqual(3)
    expect(result.replacements.some((item) => item.text.includes('LastEditors'))).toBe(true)
  })
})

describe('file paths and defaults', () => {
  test('supports all file path modes', () => {
    const settings = createSettings()
    expect(createFilePath('no item name', settings, workspace)).toBe('/src/example.tsx')
    expect(createFilePath('only file name', settings, workspace)).toBe('example.tsx')
    expect(createFilePath('only file name without ext', settings, workspace)).toBe('example')
    expect(createFilePath('', settings, workspace)).toBe('/project/src/example.tsx')
  })

  test('replaces path separators when configured', () => {
    const settings = createSettings({ filePathColon: '-' })
    expect(createFilePath('', settings, workspace)).toBe('-project-src-example.tsx')
  })

  test('uses the localized default description for an empty template', () => {
    const settings = createSettings({ createFileTime: false })
    const resolved: ResolvedLanguage = { kind: 'builtin', id: 'javascript' }
    const data = buildHeaderData(
      {},
      {
        settings,
        resolved,
        languageId: 'javascript',
        fsPath: '/repo/project/src/example.tsx',
        workspace,
        now: new Date('2026-11-03T12:00:00Z'),
        git: (command) => (command.includes('user.name') ? 'WangWindow' : 'user@example.com'),
        defaultDescription: 'localized default',
      },
    )
    expect(data.Description).toBe('localized default')
    expect(data.Author).toBe('WangWindow')
  })

  test('builds default function fields', () => {
    const settings = createSettings()
    const data = buildFunctionData(
      {},
      {
        settings,
        resolved: { kind: 'builtin', id: 'javascript' },
        languageId: 'javascript',
        fsPath: '/repo/project/src/example.js',
        workspace,
        now: new Date('2026-11-03T12:00:00Z'),
        git: () => '',
        defaultDescription: 'default',
      },
    )
    expect(Object.keys(data)).toEqual(['description', 'param', 'return'])
  })

  test('merges language specific special options', () => {
    const settings = createSettings({
      specialOptions: {
        Author: 'Writer',
        js: { Author: 'JSWriter' },
      },
    })
    const resolved = resolveLanguage('javascript', '/repo/example.js', settings)
    expect(
      getSpecialOptionName(settings, resolved, 'javascript', '/repo/example.js', 'Author'),
    ).toBe('JSWriter')
    expect(
      getSpecialOptionName(settings, resolved, 'javascript', '/repo/example.js', 'LastEditors'),
    ).toBe('LastEditors')
  })

  test('pads keys when wideSame is enabled', () => {
    expect(padWithSpaces('Author', 10)).toBe('Author    ')
    expect(padWithSpaces('Author', 0)).toBe('Author')
    expect(padWithSpaces('Author', 10, false)).toBe('Author')
  })
})

describe('git diff detection', () => {
  test('accepts a header-only diff', () => {
    const diff = [
      'diff --git a/a.ts b/a.ts',
      '--- a/a.ts',
      '+++ b/a.ts',
      '@@ -3,2 +3,2 @@',
      '- * @LastEditors: old',
      '+ * @LastEditors: WangWindow',
      '- * @LastEditTime: 2026-01-01 00:00:00',
      '+ * @LastEditTime: 2026-11-03 00:00:00',
    ].join('\n')
    expect(hasNonHeaderChanges(diff, ['LastEditors', 'LastEditTime'])).toBe(false)
  })

  test('rejects code changes', () => {
    const diff = [
      'diff --git a/a.ts b/a.ts',
      '--- a/a.ts',
      '+++ b/a.ts',
      '@@ -3,2 +3,2 @@',
      '- * @LastEditors: old',
      '+ * @LastEditors: WangWindow',
      '-const a = 1',
      '+const a = 2',
    ].join('\n')
    expect(hasNonHeaderChanges(diff, ['LastEditors', 'LastEditTime'])).toBe(true)
  })

  test('rejects multiple diff hunks', () => {
    const diff = [
      'diff --git a/a.ts b/a.ts',
      '--- a/a.ts',
      '+++ b/a.ts',
      '@@ -3,1 +3,1 @@',
      '- * @LastEditors: old',
      '+ * @LastEditors: WangWindow',
      '@@ -20,1 +20,1 @@',
      '-const a = 1',
      '+const a = 2',
    ].join('\n')
    expect(hasNonHeaderChanges(diff, ['LastEditors', 'LastEditTime'])).toBe(true)
  })
})
