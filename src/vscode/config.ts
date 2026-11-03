import * as vscode from 'vscode'
import { CONFIG_SECTION, DEFAULT_CONFIG_OBJ } from '../constants'
import { deepMerge } from '../core/util'
import type { ConfigObj, Settings } from '../types'

export function getSettings(): Settings {
  const configuration = vscode.workspace.getConfiguration(CONFIG_SECTION)
  const raw = configuration.get<Partial<ConfigObj>>('configObj', {})

  return {
    customMade: configuration.get<Record<string, string>>('customMade', {}),
    cursorMode: configuration.get<Record<string, string>>('cursorMode', {}),
    configObj: deepMerge(DEFAULT_CONFIG_OBJ, raw),
  }
}

export function getTemplate(
  name: 'customMade' | 'cursorMode',
  settings: Settings,
): Record<string, string> {
  if (!settings.configObj.useWorker) return settings[name]

  const inspected = vscode.workspace
    .getConfiguration(CONFIG_SECTION)
    .inspect<Record<string, string>>(name)
  const workspaceValue = inspected?.workspaceValue

  if (!workspaceValue || Object.keys(workspaceValue).length === 0) {
    return settings[name]
  }
  return workspaceValue
}
