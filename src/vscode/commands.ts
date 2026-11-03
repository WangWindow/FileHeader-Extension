import * as vscode from 'vscode'
import { setErrorPath } from './error'
import { insertFunctionComment } from './function'
import { insertHeader } from './header'
import { getActiveEditor } from './workspace'

function warnNoEditor(): void {
  void vscode.window.showWarningMessage(vscode.l10n.t('File Header: no active editor.'))
}

export function registerCommands(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('extension.fileheader', () => {
      const editor = getActiveEditor()
      if (!editor) {
        warnNoEditor()
        return
      }
      void insertHeader(editor)
    }),
    vscode.commands.registerCommand('extension.cursorTip', () => {
      const editor = getActiveEditor()
      if (!editor) {
        warnNoEditor()
        return
      }
      void insertFunctionComment(editor, context.extensionPath)
    }),
    vscode.commands.registerCommand('fileheader.table', () => {
      const editor = getActiveEditor()
      if (!editor) return
      const document = editor.document
      const nextLine = Math.min(editor.selection.active.line + 1, document.lineCount - 1)
      const position = document.lineAt(nextLine).range.end
      editor.selection = new vscode.Selection(position, position)
    }),
    vscode.commands.registerCommand('fileheader.errPathSet', async () => {
      const selected = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
      })
      if (!selected || selected.length === 0) return

      try {
        setErrorPath(selected[0].fsPath)
        void vscode.window.showInformationMessage(vscode.l10n.t('File Header: setting saved.'))
      } catch (error) {
        void vscode.window.showErrorMessage(
          `${vscode.l10n.t('File Header: failed to set the error log path.')} ${String(error)}`,
        )
      }
    }),
  )
}
