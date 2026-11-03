# File Header 文件头部注释

[English](README.md) | [简体中文](README.zh-CN.md) | [Changelog](CHANGELOG.md) | [更新日志](CHANGELOG.zh-CN.md)

用于插入并自动维护文件头部注释，以及生成函数注释和基于 AST 的参数提取。

本项目基于 [koro1FileHeader](https://github.com/OBKoro1/koro1FileHeader) 4.9.3
重构，当前维护者为 [WangWindow](https://github.com/WangWindow)。

## 快速开始

1. 通过 VSIX 或应用市场安装插件。
2. 在 `settings.json` 中添加需要的配置（见下文）。
3. 执行 `File Header: Insert File Header`，或按 `Ctrl+Win+I`
   （macOS 为 `Ctrl+Cmd+I`）。

最常用的配置：

```jsonc
{
  "fileheader.customMade": {
    "Author": "git config user.name && git config user.email",
    "Date": "Do not edit",
    "LastEditors": "git config user.name",
    "LastEditTime": "Do not edit",
    "FilePath": "only file name",
    "Description": ""
  },
  "fileheader.configObj": {
    "autoAdd": false
  }
}
```

## 支持语言

| 功能               | 语言                                                                         |
| ------------------ | ---------------------------------------------------------------------------- |
| 头部注释和函数注释 | Python、C、C++、Java、C#、JavaScript、TypeScript、Visual Basic、R、SQL、Rust |
| 头部注释和函数注释 | Shell、HTML、CSS/SCSS/Less、Vue、Svelte、Astro、Markdown、JSONC              |
| AST 参数提取       | Python、C、C++、Java、C#、JavaScript、TypeScript、Rust                       |

Visual Basic、R、SQL 使用行注释；Python 使用文档字符串风格；其余块注释语言使用
`/* ... */` 或 `<!-- ... -->`。

## 命令

| 命令                                       | 默认快捷键                  |
| ------------------------------------------ | --------------------------- |
| `File Header: Insert File Header`          | `Ctrl+Win+I` / `Ctrl+Cmd+I` |
| `File Header: Insert Function Comment`     | `Ctrl+Win+T` / `Ctrl+Cmd+T` |
| `File Header: Move Selection to Next Line` | `Alt+Y` / `Cmd+Y`           |
| `File Header: Set Error Log Path`          | -                           |

## 配置

所有配置都在 `fileheader` 命名空间下。可以在
`设置 > 扩展 > File Header` 中修改，也可以直接编辑 `settings.json`。

### `fileheader.customMade`

定义文件头部注释的字段和顺序。每个 key 是一个字段，value 是默认内容。

| 字段              | 行为                                                                                                              |
| ----------------- | ----------------------------------------------------------------------------------------------------------------- |
| `Author`          | 普通文本字段，支持 `git config user.name`、`git config user.email` 和组合写法。                                   |
| `Date`            | 自动替换为文件创建时间；无法获取创建时间时使用当前时间。                                                          |
| `LastEditors`     | 保存时自动更新为 `git config user.name`。                                                                         |
| `LastEditTime`    | 保存时自动更新为当前时间。                                                                                        |
| `FilePath`        | 自动生成。可选值：`no item name`、`only file name`、`only file name without ext`，其他值表示“项目名 + 相对路径”。 |
| `Description`     | 普通文本字段。启用 `moveCursor` 时，插入后光标移动到这里。                                                        |
| 其他 key          | 按普通字段输出，顺序保持不变。                                                                                    |
| `custom_string_*` | 只输出内容，不输出字段名。                                                                                        |

占位符和特殊行为：

- `git config user.name`、`git config user.email` 和组合写法会根据当前文件所在
  仓库解析。
- `${now_year}` 替换为当前年份。
- `Date` 和 `LastEditTime` 每次都会重新生成，配置的值只起说明作用。
- `custom_string_copyright`、`custom_string_date` 以及其他
  `custom_string_*` 字段只输出内容。`custom_string_date` 会替换为文件创建时间；
  无法获取创建时间时使用当前时间。
- 旧的 `custom_string_obkoro*` 命名已不再支持。

### `fileheader.cursorMode`

定义函数注释的字段和顺序，默认字段为：

```jsonc
{
  "description": "",
  "param": "",
  "return": ""
}
```

- 启用 `openFunctionParamsCheck` 时，`param` 会自动填充 AST 提取的参数。
- `description` 是插入后光标停留的字段。
- 其他字段会作为普通函数注释字段输出。

### `fileheader.configObj`

#### 基础行为

| Key                | 默认值  | 说明                                                    |
| ------------------ | ------- | ------------------------------------------------------- |
| `autoAdd`          | `true`  | 保存文件时自动添加头部注释。                            |
| `autoAddLine`      | `100`   | 文件行数不超过该值时才自动添加。                        |
| `autoAlready`      | `true`  | 只自动添加插件能识别的语言。                            |
| `createHeader`     | `false` | 新建文件时自动添加头部注释。                            |
| `createFileTime`   | `true`  | `Date` 使用文件创建时间。                               |
| `moveCursor`       | `true`  | 插入后移动光标到 `Description` 字段。                   |
| `throttleTime`     | `60000` | 同一文件保存更新的最小间隔（毫秒）。                    |
| `CheckFileChange`  | `false` | git diff 显示只修改了头部字段时自动还原文件。           |
| `showErrorMessage` | `false` | 在 VS Code 通知中显示错误。                             |
| `writeLog`         | `false` | 将错误写入错误日志目录。                                |
| `useWorker`        | `false` | 优先使用工作区级别的 `customMade` / `cursorMode` 模板。 |

#### 头部注释格式

| Key                           | 默认值                                                           | 说明                                             |
| ----------------------------- | ---------------------------------------------------------------- | ------------------------------------------------ |
| `dateFormat`                  | `YYYY-MM-DD HH:mm:ss`                                            | Day.js 日期格式。                                |
| `filePathColon`               | `路径分隔符替换`                                                 | 设置为 `/` 或 `\` 等字符串时替换路径分隔符。     |
| `wideSame`                    | `false`                                                          | 将头部字段补齐到相同宽度。                       |
| `wideNum`                     | `13`                                                             | `wideSame` 使用的宽度。                          |
| `atSymbol`                    | `["@", "@"]`                                                     | `[头部, 函数]` 的 `@` 符号。                     |
| `atSymbolObj`                 | `{}`                                                             | 按语言覆盖 `atSymbol`。                          |
| `colon`                       | `[": ", ": "]`                                                   | `[头部, 函数]` 的冒号。                          |
| `colonObj`                    | `{}`                                                             | 按语言覆盖 `colon`。                             |
| `annotationStr`               | `{ "head": "/*", "middle": " * @", "end": " */", "use": false }` | 未知语言的兜底注释符号，`use` 为 `true` 时启用。 |
| `headInsertLine`              | `{ "php": 2, "sh": 2 }`                                          | 按文件后缀指定插入行，行号从 1 开始。            |
| `beforeAnnotation`            | `{}`                                                             | 在头部注释之前插入内容，按文件后缀配置。         |
| `afterAnnotation`             | `{}`                                                             | 在头部注释之后插入内容，按文件后缀配置。         |
| `specialOptions`              | `{}`                                                             | 重命名特殊字段，可按语言覆盖。                   |
| `switch.newlineAddAnnotation` | `true`                                                           | 多行字段值的每一行都添加注释符号。               |
| `language`                    | `{}`                                                             | 自定义注释定义，见下文。                         |

#### 自动添加过滤

| Key                   | 默认值             | 说明                             |
| --------------------- | ------------------ | -------------------------------- |
| `supportAutoLanguage` | `[]`               | 非空时，只有这些后缀会自动添加。 |
| `prohibitAutoAdd`     | `["json"]`         | 禁止自动添加的后缀。             |
| `folderBlacklist`     | `["node_modules"]` | 禁止自动添加的文件夹名。         |
| `prohibitItemAutoAdd` | `[]`               | 禁止自动添加的项目名。           |

#### 函数注释

| Key                       | 默认值          | 说明                                                                             |
| ------------------------- | --------------- | -------------------------------------------------------------------------------- |
| `openFunctionParamsCheck` | `true`          | 启用 AST 参数提取。                                                              |
| `cursorModeInternalAll`   | `{}`            | 按语言配置是否在函数内部插入函数注释。                                           |
| `functionParamsShape`     | `["{", "}"]`    | 参数包裹符号；也支持 `"no type"`、`"no bracket"`、`"normal"`。                   |
| `functionParamAddStr`     | `""`            | 每个参数后追加的字符串，例如 `": "`。                                            |
| `typeParamOrder`          | `type param`    | `type param`、`param type` 或 `param`。                                          |
| `functionTypeSymbol`      | `*`             | 默认类型符号；`match param no type` 表示不显示类型。                             |
| `functionWideNum`         | `0`             | 函数注释字段补齐宽度。                                                           |
| `functionBlankSpaceAll`   | `{}`            | 按语言增加函数注释缩进。                                                         |
| `NoMatchParams`           | `no show param` | 隐藏未匹配的 `param`；`no show param and return` 同时隐藏返回值。                |
| `customHasHeadEnd`        | `{}`            | 自定义语言使用：`cancel head`、`cancel function` 或 `cancel head and function`。 |

#### 自定义语言

`language` 的 key 可以是语言 ID、文件后缀、文件名、用 `/` 分隔的后缀列表，
或者包含 `.` 的特殊后缀。

```jsonc
"fileheader.configObj": {
  "language": {
    "c/cpp/cs/h/java/jsx/tsx/rs": {
      "head": "/*\n==============================================================================",
      "middle": " * @",
      "end": "==============================================================================\n*/"
    },
    "ipynb/py": {
      "head": "\"\"\"\n==============================================================================",
      "middle": " * @",
      "end": "==============================================================================\n\"\"\""
    }
  }
}
```

每个定义支持：

| Key                       | 说明                                                                            |
| ------------------------- | ------------------------------------------------------------------------------- |
| `head` / `middle` / `end` | 头部注释符号。                                                                  |
| `functionSymbol`          | 可选，函数注释使用 `{ "head", "middle", "end" }`。                              |
| `functionParams`          | 使用的 AST 解析器：`js`、`ts`、`java`、`python`、`rust`、`c`、`cpp`、`csharp`。 |

#### 特殊字段重命名

使用 `specialOptions` 可以重命名生成字段，而不改变其行为：

```jsonc
"specialOptions": {
  "LastEditors": "LastAuthor",
  "LastEditTime": "LastTime",
  "FilePath": "Path"
}
```

也可以按语言覆盖：

```jsonc
"specialOptions": {
  "LastEditors": "LastAuthor",
  "js": {
    "LastEditors": "JSLastAuthor"
  }
}
```

## 开发

需要 [Bun](https://bun.sh/) 和 VS Code 1.85+。

```bash
bun install
bun run check-types
bun run test
bun run lint
bun run compile
bun run vsce:package
```

构建脚本会将 tree-sitter WASM 资源复制到 `dist/`，请使用项目脚本，不要直接运行
`bun build`。

## 许可证

MIT。原项目版权归 OBKoro1 所有（2018-2023）。原项目停止更新后的修改版权归
WangWindow 所有（2023-至今）。详见 [LICENSE](LICENSE)。
