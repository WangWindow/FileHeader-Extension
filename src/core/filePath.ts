import path from 'node:path'
import { FILE_PATH_COLON_KEEP } from '../constants'
import type { Settings, WorkspaceInfo } from '../types'

export function createFilePath(
  setting: string,
  settings: Settings,
  workspace: WorkspaceInfo,
): string {
  let result: string

  if (setting === 'no item name') {
    result = workspace.fileItemPath
  } else if (setting === 'only file name') {
    result = path.basename(workspace.fileItemPath || workspace.itemPath)
  } else if (setting === 'only file name without ext') {
    const fileName = path.basename(workspace.fileItemPath || workspace.itemPath)
    const extension = path.extname(fileName)
    result = extension ? fileName.slice(0, -extension.length) : fileName
  } else {
    result = `${path.sep}${workspace.itemName}${workspace.fileItemPath}`
  }

  const replacement = settings.configObj.filePathColon
  if (replacement !== FILE_PATH_COLON_KEEP) {
    result = result.split(path.sep).join(replacement)
  }

  return result
}
