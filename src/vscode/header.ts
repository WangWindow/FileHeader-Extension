import * as vscode from 'vscode'
import { HEADER_SCAN_LINES, SPECIAL_HEAD_DESCRIPTION } from '../constants'
import { findHeaderStartLine } from '../core/headerScan'
import { prepareHeaderTemplate } from '../core/insert'
import { getSpecialOptionName, resolveLanguage } from '../core/language'
import type { RenderContext } from '../core/render'
import { renderHeader } from '../core/render'
import { buildHeaderData } from '../core/template'
import { normalizeEol } from '../core/util'
import type { ResolvedLanguage, Settings, TemplateData } from '../types'
import { getSettings, getTemplate } from './config'
import { showErrorMessage } from './error'
import { createGitResolver } from './git'
import { getDocumentEol, getDocumentPath, getWorkspaceInfo, readFileStat } from './workspace'

export interface InsertHeaderOptions {
  create?: boolean
  skipExisting?: boolean
}

export function createHeaderData(
  document: vscode.TextDocument,
  settings: Settings,
  resolved: ResolvedLanguage,
): TemplateData {
  const fsPath = getDocumentPath(document)
  const workspace = getWorkspaceInfo(fsPath)
  return buildHeaderData(getTemplate('customMade', settings), {
    settings,
    resolved,
    languageId: document.languageId,
    fsPath,
    workspace,
    now: new Date(),
    git: createGitResolver(workspace.itemPath),
    fileStat: readFileStat(fsPath),
    defaultDescription: vscode.l10n.t(
      'This is the default setting. Configure fileheader.customMade.',
    ),
  })
}

export function createRenderContext(
  document: vscode.TextDocument,
  settings: Settings,
  resolved: ResolvedLanguage,
): RenderContext {
  return {
    settings,
    resolved,
    languageId: document.languageId,
    fsPath: getDocumentPath(document),
  }
}

export function documentHasHeader(
  document: vscode.TextDocument,
  settings: Settings,
  resolved: ResolvedLanguage,
): boolean {
  const fsPath = getDocumentPath(document)
  const limit = Math.min(document.lineCount, HEADER_SCAN_LINES)
  const lines: string[] = []
  for (let index = 0; index < limit; index++) {
    lines.push(document.lineAt(index).text)
  }
  return findHeaderStartLine(lines, settings, resolved, document.languageId, fsPath) !== undefined
}

function moveCursorToDescription(
  editor: vscode.TextEditor,
  settings: Settings,
  resolved: ResolvedLanguage,
  startLine: number,
  template: string,
  atTop: boolean,
): void {
  if (!settings.configObj.moveCursor) return

  const document = editor.document
  const fsPath = getDocumentPath(document)
  const name =
    getSpecialOptionName(
      settings,
      resolved,
      document.languageId,
      fsPath,
      SPECIAL_HEAD_DESCRIPTION,
    ) ?? SPECIAL_HEAD_DESCRIPTION
  const lastLine = Math.min(document.lineCount - 1, startLine + template.split('\n').length + 1)

  for (let line = startLine; line <= lastLine; line++) {
    if (document.lineAt(line).text.includes(name)) {
      const position = document.lineAt(line).range.end
      editor.selection = new vscode.Selection(position, position)
      editor.revealRange(
        new vscode.Range(position, position),
        atTop
          ? vscode.TextEditorRevealType.AtTop
          : vscode.TextEditorRevealType.InCenterIfOutsideViewport,
      )
      return
    }
  }
}

export async function insertHeader(
  editor: vscode.TextEditor,
  options: InsertHeaderOptions = {},
): Promise<void> {
  try {
    const document = editor.document
    const fsPath = getDocumentPath(document)
    const settings = getSettings()
    const resolved = resolveLanguage(document.languageId, fsPath, settings)

    if (options.create && resolved.kind === 'unknown') return
    if (options.skipExisting && documentHasHeader(document, settings, resolved)) return

    const data = createHeaderData(document, settings, resolved)
    const rendered = renderHeader(data, createRenderContext(document, settings, resolved))
    const prepared = prepareHeaderTemplate(
      rendered,
      settings,
      resolved,
      document.languageId,
      fsPath,
    )
    const template = normalizeEol(prepared.template, getDocumentEol(document))

    const inserted = await editor.edit((builder) => {
      builder.insert(new vscode.Position(prepared.lineNumber, 0), template)
    })
    if (!inserted) return

    await document.save()
    moveCursorToDescription(editor, settings, resolved, 0, template, true)
  } catch (error) {
    showErrorMessage(vscode.l10n.t('File Header: failed to insert the file header.'), error)
  }
}
