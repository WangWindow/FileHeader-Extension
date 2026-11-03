import { execFileSync } from 'node:child_process'
import * as vscode from 'vscode'

const CACHE_TTL = 30_000
const CACHE = new Map<string, { value: string; expiresAt: number }>()

function readGitConfig(key: string, cwd?: string): string {
  const cacheKey = `${cwd ?? ''}::${key}`
  const cached = CACHE.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) return cached.value

  const value = execFileSync('git', ['config', '--get', key], {
    cwd,
    encoding: 'utf8',
    timeout: 3000,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim()

  CACHE.set(cacheKey, { value, expiresAt: Date.now() + CACHE_TTL })
  return value
}

export function getGitValue(command: string, cwd?: string): string {
  try {
    if (command === 'git config user.name && git config user.email') {
      const name = readGitConfig('user.name', cwd)
      const email = readGitConfig('user.email', cwd)
      return `${name} ${email}`.trim()
    }
    if (command === 'git config user.name') {
      return readGitConfig('user.name', cwd)
    }
    if (command === 'git config user.email') {
      return readGitConfig('user.email', cwd)
    }
  } catch {
    return vscode.l10n.t('File Header: git is not available: {0}', command)
  }

  return command
}

export function createGitResolver(cwd?: string): (command: string) => string {
  return (command: string) => getGitValue(command, cwd)
}
