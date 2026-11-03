import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import * as vscode from 'vscode'
import { SPECIAL_FILE_PATH, SPECIAL_LAST_EDIT_TIME, SPECIAL_LAST_EDITORS } from '../constants'
import { hasNonHeaderChanges } from '../core/gitDiff'
import { scanHeader } from '../core/headerScan'
import { getFileExtension, resolveLanguage } from '../core/language'
import { getSpecialOptionKey } from '../core/special'
import type { Settings } from '../types'
import { getSettings } from './config'
import { showErrorMessage } from './error'
import { createHeaderData, documentHasHeader, insertHeader } from './header'
import { getDocumentPath, getEditorForDocument, getWorkspaceInfo } from './workspace'

const lastRun = new Map<string, number>()
const autoAddedFiles = new Set<string>()

function shouldRun(fileName: string, throttleTime: number): boolean {
  const now = Date.now()
  const last = lastRun.get(fileName)
  if (last !== undefined && now - last <= throttleTime) return false
  lastRun.set(fileName, now)
  return true
}

function isAllowedByAuth(fsPath: string, settings: ReturnType<typeof getSettings>): boolean {
  const extension = getFileExtension(fsPath)
  const prohibited = settings.configObj.prohibitAutoAdd
  if (prohibited.length > 0 && prohibited.includes(extension)) return false

  const supported = settings.configObj.supportAutoLanguage
  if (supported.length > 0 && !supported.includes(extension)) return false

  return true
}

function isFolderBlacklisted(fsPath: string, settings: ReturnType<typeof getSettings>): boolean {
  const parts = fsPath.split(path.sep)
  return parts.some((part) => settings.configObj.folderBlacklist.includes(part))
}

async function autoAddHeader(document: vscode.TextDocument, settings: Settings): Promise<void> {
  const fsPath = getDocumentPath(document)
  const resolved = resolveLanguage(document.languageId, fsPath, settings)

  if (document.lineCount > settings.configObj.autoAddLine) return
  if (documentHasHeader(document, settings, resolved)) return
  if (isFolderBlacklisted(fsPath, settings)) return
  if (!isAllowedByAuth(fsPath, settings)) return
  if (settings.configObj.prohibitItemAutoAdd.includes(getWorkspaceInfo(fsPath).itemName)) return
  if (autoAddedFiles.has(fsPath)) return
  if (settings.configObj.autoAlready && resolved.kind === 'unknown') return

  const editor =
    getEditorForDocument(document) ??
    (await vscode.window.showTextDocument(document, {
      preview: false,
      preserveFocus: true,
    }))

  autoAddedFiles.add(fsPath)
  await insertHeader(editor, { create: true, skipExisting: true })
}

function revertIfOnlyHeaderChanged(document: vscode.TextDocument, settings: Settings): void {
  if (!settings.configObj.CheckFileChange) return

  const fsPath = getDocumentPath(document)
  const workspace = getWorkspaceInfo(fsPath)
  if (!fs.existsSync(path.join(workspace.itemPath, '.git'))) return

  try {
    const diff = execFileSync('git', ['diff', '--', fsPath], {
      cwd: workspace.itemPath,
      encoding: 'utf8',
      timeout: 5000,
      windowsHide: true,
    })
    if (!diff) return

    const resolved = resolveLanguage(document.languageId, fsPath, settings)
    const fields = [
      getSpecialOptionKey(settings, resolved, document.languageId, fsPath, SPECIAL_LAST_EDITORS),
      getSpecialOptionKey(settings, resolved, document.languageId, fsPath, SPECIAL_LAST_EDIT_TIME),
      getSpecialOptionKey(settings, resolved, document.languageId, fsPath, SPECIAL_FILE_PATH),
    ]

    if (hasNonHeaderChanges(diff, fields)) return

    execFileSync('git', ['checkout', '--', fsPath], {
      cwd: workspace.itemPath,
      stdio: 'ignore',
      timeout: 5000,
      windowsHide: true,
    })
    void vscode.window.showInformationMessage(
      vscode.l10n.t('File Header: the file was restored because only the header changed.'),
    )
  } catch (error) {
    showErrorMessage(vscode.l10n.t('File Header: failed to update the file header.'), error)
  }
}

async function handleCreatedFiles(event: vscode.FileCreateEvent): Promise<void> {
  const settings = getSettings()
  if (!settings.configObj.createHeader) return

  for (const uri of event.files) {
    try {
      const document = await vscode.workspace.openTextDocument(uri)
      const editor = await vscode.window.showTextDocument(document, {
        preview: false,
        preserveFocus: true,
      })
      if (!isAllowedByAuth(uri.fsPath, settings)) continue
      await insertHeader(editor, { create: true, skipExisting: true })
    } catch (error) {
      showErrorMessage(
        vscode.l10n.t('File Header: failed to add the file header automatically.'),
        error,
      )
    }
  }
}

export function registerSaveHandling(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.workspace.onWillSaveTextDocument((event) => {
      if (!event.document.isDirty) return

      try {
        const settings = getSettings()
        if (!shouldRun(event.document.fileName, settings.configObj.throttleTime)) return

        const fsPath = getDocumentPath(event.document)
        const resolved = resolveLanguage(event.document.languageId, fsPath, settings)
        const data = createHeaderData(event.document, settings, resolved)
        const lines: string[] = []
        for (let index = 0; index < event.document.lineCount; index++) {
          lines.push(event.document.lineAt(index).text)
        }

        const result = scanHeader(
          lines,
          settings,
          resolved,
          event.document.languageId,
          fsPath,
          data,
          new Date(),
        )
        if (result.replacements.length === 0) return

        const edits = result.replacements.map(
          (replacement) =>
            new vscode.TextEdit(
              new vscode.Range(
                replacement.line,
                0,
                replacement.line,
                event.document.lineAt(replacement.line).text.length,
              ),
              replacement.text,
            ),
        )
        event.waitUntil(Promise.resolve(edits))
      } catch (error) {
        showErrorMessage(vscode.l10n.t('File Header: failed to update the file header.'), error)
      }
    }),
    vscode.workspace.onDidSaveTextDocument((document) => {
      try {
        const settings = getSettings()
        revertIfOnlyHeaderChanged(document, settings)
        if (settings.configObj.autoAdd) {
          void autoAddHeader(document, settings)
        }
      } catch (error) {
        showErrorMessage(
          vscode.l10n.t('File Header: failed to add the file header automatically.'),
          error,
        )
      }
    }),
    vscode.workspace.onDidCreateFiles((event) => {
      void handleCreatedFiles(event)
    }),
  )
}
