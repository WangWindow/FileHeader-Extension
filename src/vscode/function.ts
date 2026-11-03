import * as vscode from 'vscode'
import { SPECIAL_FN_DESCRIPTION, SPECIAL_PARAM } from '../constants'
import { getLanguageOverride, getSpecialOptionName, resolveLanguage } from '../core/language'
import { renderFunctionComment } from '../core/render'
import { buildFunctionData } from '../core/template'
import { normalizeEol, padWithSpaces } from '../core/util'
import { extractFunctionParams } from '../function-params'
import type { ResolvedLanguage, Settings } from '../types'
import { getSettings, getTemplate } from './config'
import { showErrorMessage } from './error'
import { createGitResolver } from './git'
import { getDocumentEol, getDocumentPath, getWorkspaceInfo } from './workspace'

interface FunctionLineContext {
  insertLine: number
  indent: number
  text: string
  addTrailingNewline: boolean
}

function getFunctionLineContext(
  editor: vscode.TextEditor,
  settings: Settings,
  resolved: ResolvedLanguage,
  document: vscode.TextDocument,
): FunctionLineContext {
  const fsPath = getDocumentPath(document)
  const cursorModeInternal = getLanguageOverride<boolean>(
    settings,
    'cursorModeInternalAll',
    resolved,
    document.languageId,
    fsPath,
    false,
  )
  const selection = editor.selections[0]
  const startLine = selection.start.line
  const endLine = selection.end.line

  if (startLine !== endLine) {
    const selectedLines: string[] = []
    let firstNonEmpty = startLine
    let lastNonEmpty = startLine
    for (let line = startLine; line <= endLine; line++) {
      const text = document.lineAt(line).text
      selectedLines.push(text)
      if (text.trim()) {
        if (firstNonEmpty === startLine && !document.lineAt(startLine).text.trim()) {
          firstNonEmpty = line
        }
        lastNonEmpty = line
      }
    }

    const targetLine = cursorModeInternal ? lastNonEmpty : firstNonEmpty
    return {
      insertLine: Math.min(
        document.lineCount,
        cursorModeInternal ? lastNonEmpty + 1 : firstNonEmpty,
      ),
      indent: document.lineAt(targetLine).firstNonWhitespaceCharacterIndex,
      text: selectedLines.join('\n'),
      addTrailingNewline: true,
    }
  }

  const activeLine = selection.active.line
  let lineProperty = document.lineAt(activeLine)
  let insertLine = activeLine
  let addTrailingNewline = true

  if (lineProperty.isEmptyOrWhitespace && document.lineCount !== activeLine + 1) {
    const nextLine = activeLine + 1
    lineProperty = document.lineAt(nextLine)
    addTrailingNewline = false
  } else if (cursorModeInternal) {
    insertLine = activeLine + 1
  }

  return {
    insertLine: Math.min(document.lineCount, insertLine),
    indent: lineProperty.firstNonWhitespaceCharacterIndex,
    text: lineProperty.text,
    addTrailingNewline,
  }
}

function moveCursorToDescription(
  editor: vscode.TextEditor,
  settings: Settings,
  resolved: ResolvedLanguage,
  startLine: number,
  template: string,
): void {
  if (!settings.configObj.moveCursor) return

  const document = editor.document
  const name =
    getSpecialOptionName(
      settings,
      resolved,
      document.languageId,
      getDocumentPath(document),
      SPECIAL_FN_DESCRIPTION,
    ) ?? SPECIAL_FN_DESCRIPTION
  const lastLine = Math.min(document.lineCount - 1, startLine + template.split('\n').length + 1)

  for (let line = startLine; line <= lastLine; line++) {
    if (document.lineAt(line).text.includes(name)) {
      const position = document.lineAt(line).range.end
      editor.selection = new vscode.Selection(position, position)
      editor.revealRange(
        new vscode.Range(position, position),
        vscode.TextEditorRevealType.InCenterIfOutsideViewport,
      )
      return
    }
  }
}

export async function insertFunctionComment(
  editor: vscode.TextEditor,
  extensionPath: string,
): Promise<void> {
  try {
    const document = editor.document
    const fsPath = getDocumentPath(document)
    const settings = getSettings()
    const resolved = resolveLanguage(document.languageId, fsPath, settings)
    const lineContext = getFunctionLineContext(editor, settings, resolved, document)
    const workspace = getWorkspaceInfo(fsPath)

    const data = buildFunctionData(getTemplate('cursorMode', settings), {
      settings,
      resolved,
      languageId: document.languageId,
      fsPath,
      workspace,
      now: new Date(),
      git: createGitResolver(workspace.itemPath),
      defaultDescription: vscode.l10n.t(
        'This is the default setting. Configure fileheader.customMade.',
      ),
    })

    if (settings.configObj.openFunctionParamsCheck) {
      const params = await extractFunctionParams(
        document.languageId,
        resolved,
        lineContext.text,
        extensionPath,
      )
      if (params && params.length > 0) {
        const key = padWithSpaces(SPECIAL_PARAM, settings.configObj.functionWideNum)
        data[key] = params
      }
    }

    const rendered = renderFunctionComment(
      data,
      {
        settings,
        resolved,
        languageId: document.languageId,
        fsPath,
      },
      lineContext.indent,
      lineContext.addTrailingNewline,
    )
    const template = normalizeEol(rendered, getDocumentEol(document))

    const inserted = await editor.edit((builder) => {
      builder.insert(new vscode.Position(lineContext.insertLine, 0), template)
    })
    if (!inserted) return

    moveCursorToDescription(editor, settings, resolved, lineContext.insertLine, template)
  } catch (error) {
    showErrorMessage(vscode.l10n.t('File Header: failed to insert the function comment.'), error)
  }
}
