import type { BuiltinLanguage, ConfigObj, LanguageDefinition } from './types'

export const CONFIG_SECTION = 'fileheader'

export const FILE_PATH_COLON_KEEP = '路径分隔符替换'

export const NO_MATCH_LANGUAGE = 'no-match-language'

export const CUSTOM_STRING_PREFIX = 'custom_string_'

export const SPECIAL_LAST_EDIT_TIME = 'LastEditTime'
export const SPECIAL_LAST_EDITORS = 'LastEditors'
export const SPECIAL_FILE_PATH = 'FilePath'
export const SPECIAL_PARAM = 'param'
export const SPECIAL_RETURN = 'return'
export const SPECIAL_FN_DESCRIPTION = 'description'
export const SPECIAL_HEAD_DESCRIPTION = 'Description'
export const SPECIAL_AUTHOR = 'Author'
export const SPECIAL_DATE = 'Date'

export const HEADER_SCAN_LINES = 15

export const DEFAULT_CONFIG_OBJ: ConfigObj = {
  language: {},
  autoAdd: true,
  autoAddLine: 100,
  autoAlready: true,
  annotationStr: {
    head: '/*',
    middle: ' * @',
    end: ' */',
    use: false,
  },
  headInsertLine: {
    php: 2,
    sh: 2,
  },
  beforeAnnotation: {},
  afterAnnotation: {},
  specialOptions: {},
  switch: {
    newlineAddAnnotation: true,
  },
  supportAutoLanguage: [],
  prohibitAutoAdd: ['json'],
  folderBlacklist: ['node_modules'],
  prohibitItemAutoAdd: [],
  moveCursor: true,
  dateFormat: 'YYYY-MM-DD HH:mm:ss',
  atSymbol: ['@', '@'],
  atSymbolObj: {},
  colon: [': ', ': '],
  colonObj: {},
  filePathColon: FILE_PATH_COLON_KEEP,
  showErrorMessage: false,
  writeLog: false,
  wideSame: false,
  wideNum: 13,
  functionWideNum: 0,
  CheckFileChange: false,
  createHeader: false,
  useWorker: false,
  cursorModeInternalAll: {},
  openFunctionParamsCheck: true,
  functionParamsShape: ['{', '}'],
  functionBlankSpaceAll: {},
  functionTypeSymbol: '*',
  typeParamOrder: 'type param',
  customHasHeadEnd: {},
  throttleTime: 60000,
  functionParamAddStr: '',
  NoMatchParams: 'no show param',
  createFileTime: true,
}

export const DEFAULT_HEADER_DATA: Record<string, string> = {
  Author: 'git config user.name && git config user.email',
  Date: '',
  LastEditors: 'git config user.name && git config user.email',
  LastEditTime: '',
  FilePath: '',
}

export const DEFAULT_CURSOR_DATA: Record<string, string> = {
  description: '',
  param: '',
  return: '',
}

export const BUILTIN_LANGUAGES: Record<BuiltinLanguage, LanguageDefinition> = {
  html: {
    head: '<!--',
    middle: ' * ',
    end: ' -->',
  },
  javascript: {
    head: '/*',
    middle: ' * ',
    end: ' */',
  },
  python: {
    head: "'''",
    middle: '',
    end: "'''",
  },
  r: {
    head: '',
    middle: '# ',
    end: '',
    style: 'line',
  },
  shellscript: {
    head: '###',
    middle: ' # ',
    end: '###',
  },
  sql: {
    head: '',
    middle: '-- ',
    end: '',
    style: 'line',
  },
  visualbasic: {
    head: '',
    middle: "' ",
    end: '',
    style: 'line',
  },
}

export const LANGUAGE_ALIASES: Record<string, BuiltinLanguage> = {
  astro: 'html',
  bash: 'shellscript',
  c: 'javascript',
  cc: 'javascript',
  cjs: 'javascript',
  cpp: 'javascript',
  cs: 'javascript',
  csharp: 'javascript',
  css: 'javascript',
  cxx: 'javascript',
  h: 'javascript',
  hpp: 'javascript',
  html: 'html',
  hxx: 'javascript',
  java: 'javascript',
  javascript: 'javascript',
  javascriptreact: 'javascript',
  js: 'javascript',
  jsonc: 'javascript',
  jsx: 'javascript',
  less: 'javascript',
  markdown: 'html',
  md: 'html',
  mjs: 'javascript',
  py: 'python',
  python: 'python',
  r: 'r',
  rs: 'javascript',
  rust: 'javascript',
  scss: 'javascript',
  sh: 'shellscript',
  shellscript: 'shellscript',
  sql: 'sql',
  svelte: 'html',
  ts: 'javascript',
  tsx: 'javascript',
  typescript: 'javascript',
  typescriptreact: 'javascript',
  vb: 'visualbasic',
  visualbasic: 'visualbasic',
  vue: 'html',
  zsh: 'shellscript',
}

export const ERR_PATH_KEY = 'fileheader.errorPath'
export const DEFAULT_ERR_PATH = 'default'
