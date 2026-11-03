import fs from 'node:fs'
import path from 'node:path'
import * as vscode from 'vscode'
import type { FileStatInfo, WorkspaceInfo } from '../types'

export function getActiveEditor(): vscode.TextEditor | undefined {
  return vscode.window.activeTextEditor
}

export function getWorkspaceInfo(fsPath: string): WorkspaceInfo {
  const uri = vscode.Uri.file(fsPath)
  const folder = vscode.workspace.getWorkspaceFolder(uri)
  const itemPath = folder?.uri.fsPath ?? path.dirname(fsPath)
  const itemName = folder ? path.basename(folder.uri.fsPath) : path.basename(itemPath)
  const relative = path.relative(itemPath, fsPath)
  const fileItemPath = relative ? `${path.sep}${relative}` : ''

  return { itemPath, itemName, fileItemPath }
}

export function getEditorForDocument(document: vscode.TextDocument): vscode.TextEditor | undefined {
  return vscode.window.visibleTextEditors.find((editor) => editor.document === document)
}

export function getDocumentPath(document: vscode.TextDocument): string {
  return document.uri.fsPath || document.fileName
}

export function readFileStat(fsPath: string): FileStatInfo | undefined {
  try {
    const stat = fs.statSync(fsPath)
    return { birthtime: stat.birthtime, ctime: stat.ctime }
  } catch {
    return undefined
  }
}

export function getDocumentEol(document: vscode.TextDocument): '\n' | '\r\n' {
  return document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n'
}
