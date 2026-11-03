import type * as vscode from 'vscode'
import { registerCommands } from './vscode/commands'
import { initErrorHandling } from './vscode/error'
import { registerSaveHandling } from './vscode/save'

export function activate(context: vscode.ExtensionContext): void {
  initErrorHandling(context)
  registerCommands(context)
  registerSaveHandling(context)
}

export function deactivate(): void {}
