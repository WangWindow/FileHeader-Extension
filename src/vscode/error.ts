import fs from 'node:fs'
import path from 'node:path'
import * as vscode from 'vscode'
import { DEFAULT_ERR_PATH, ERR_PATH_KEY } from '../constants'
import { getSettings } from './config'

let extensionContext: vscode.ExtensionContext | undefined
let errorPath = DEFAULT_ERR_PATH
let handlerRegistered = false

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return `${error.message}\n${error.stack ?? ''}`.trim()
  }
  if (typeof error === 'string') return error
  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}

export function initErrorHandling(context: vscode.ExtensionContext): void {
  extensionContext = context
  const saved = context.globalState.get<string>(ERR_PATH_KEY)
  if (saved) errorPath = saved

  if (!handlerRegistered) {
    handlerRegistered = true
    process.on('uncaughtException', (error) => {
      try {
        showErrorMessage(vscode.l10n.t('File Header: unexpected error.'), error)
      } catch {
        // Never let the crash handler throw.
      }
    })
  }
}

export function setErrorPath(fsPath: string): void {
  errorPath = fsPath
  void extensionContext?.globalState.update(ERR_PATH_KEY, errorPath)
}

export function writeLog(tag: string, message = ''): void {
  const settings = getSettings()
  if (!settings.configObj.writeLog) return

  if (errorPath === DEFAULT_ERR_PATH) {
    const saved = extensionContext?.globalState.get<string>(ERR_PATH_KEY)
    if (saved) {
      errorPath = saved
    } else {
      void vscode.window.showErrorMessage(
        vscode.l10n.t('File Header: please set the error log directory first.'),
      )
      return
    }
  }

  try {
    if (!fs.statSync(errorPath).isDirectory()) {
      void vscode.window.showErrorMessage(
        vscode.l10n.t('File Header: the error log directory does not exist.'),
      )
      return
    }
    const line = `[${new Date().toISOString()}] ${tag}: ${message}\n`
    fs.appendFileSync(path.join(errorPath, 'fileheader.log'), line, 'utf8')
  } catch {
    void vscode.window.showErrorMessage(
      vscode.l10n.t('File Header: the error log directory does not exist.'),
    )
  }
}

export function showErrorMessage(tag: string, error: unknown): void {
  const settings = getSettings()
  if (!settings.configObj.showErrorMessage) return

  const message = formatError(error)
  writeLog(tag, message)
  void vscode.window.showErrorMessage(`${tag} ${message}`.trim())
}
