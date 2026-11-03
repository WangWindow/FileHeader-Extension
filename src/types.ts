export interface FunctionSymbol {
  head: string
  middle: string
  end: string
}

export type FunctionParamsLanguage =
  | 'js'
  | 'ts'
  | 'java'
  | 'python'
  | 'rust'
  | 'c'
  | 'cpp'
  | 'csharp'

export interface LanguageDefinition {
  head: string
  middle: string
  end: string
  style?: 'block' | 'line'
  functionSymbol?: FunctionSymbol
  functionParams?: FunctionParamsLanguage
}

export type SymbolSetting = string | string[]

export interface AnnotationSymbol {
  head: string
  middle: string
  end: string
  use: boolean
}

export type SpecialOptionValue = string | Record<string, string>
export type SpecialOptions = Record<string, SpecialOptionValue>

export type CustomHeadEndMode = '' | 'cancel head' | 'cancel function' | 'cancel head and function'

export interface ConfigObj {
  language: Record<string, LanguageDefinition>
  autoAdd: boolean
  autoAddLine: number
  autoAlready: boolean
  annotationStr: AnnotationSymbol
  headInsertLine: Record<string, number>
  beforeAnnotation: Record<string, string>
  afterAnnotation: Record<string, string>
  specialOptions: SpecialOptions
  switch: {
    newlineAddAnnotation: boolean
  }
  supportAutoLanguage: string[]
  prohibitAutoAdd: string[]
  folderBlacklist: string[]
  prohibitItemAutoAdd: string[]
  moveCursor: boolean
  dateFormat: string
  atSymbol: SymbolSetting
  atSymbolObj: Record<string, SymbolSetting>
  colon: SymbolSetting
  colonObj: Record<string, SymbolSetting>
  filePathColon: string
  showErrorMessage: boolean
  writeLog: boolean
  wideSame: boolean
  wideNum: number
  functionWideNum: number
  CheckFileChange: boolean
  createHeader: boolean
  useWorker: boolean
  cursorModeInternalAll: Record<string, boolean>
  openFunctionParamsCheck: boolean
  functionParamsShape: string | string[]
  functionBlankSpaceAll: Record<string, number>
  functionTypeSymbol: string
  typeParamOrder: 'type param' | 'param type' | 'param' | string
  customHasHeadEnd: Record<string, CustomHeadEndMode>
  throttleTime: number
  functionParamAddStr: string
  NoMatchParams: string
  createFileTime: boolean
}

export interface Settings {
  customMade: Record<string, string>
  cursorMode: Record<string, string>
  configObj: ConfigObj
}

export type BuiltinLanguage =
  | 'javascript'
  | 'python'
  | 'html'
  | 'shellscript'
  | 'visualbasic'
  | 'r'
  | 'sql'

export interface ResolvedLanguage {
  kind: 'builtin' | 'custom' | 'unknown'
  id: string
  config?: LanguageDefinition
}

export interface ParamInfo {
  type: string
  param: string
}

export type TemplateValue = string | ParamInfo[]
export type TemplateData = Record<string, TemplateValue>

export interface WorkspaceInfo {
  itemPath: string
  itemName: string
  fileItemPath: string
}

export interface FileStatInfo {
  birthtime: Date
  ctime: Date
}
