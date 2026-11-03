# File Header

[English](README.md) | [简体中文](README.zh-CN.md) | [Changelog](CHANGELOG.md) | [更新日志](CHANGELOG.zh-CN.md)

Insert and maintain file header comments, and generate function comments with
AST-based parameter extraction.

This is a fork of [koro1FileHeader](https://github.com/OBKoro1/koro1FileHeader)
4.9.3, maintained by [WangWindow](https://github.com/WangWindow).

## Quick start

1. Install the extension from a VSIX file or the marketplace.
2. Open `settings.json` and add the configuration you need (see below).
3. Run `File Header: Insert File Header` or press `Ctrl+Win+I`
   (`Ctrl+Cmd+I` on macOS).

The most common setup:

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

## Supported languages

| Area                         | Languages                                                                    |
| ---------------------------- | ---------------------------------------------------------------------------- |
| Header and function comments | Python, C, C++, Java, C#, JavaScript, TypeScript, Visual Basic, R, SQL, Rust |
| Header and function comments | Shell, HTML, CSS/SCSS/Less, Vue, Svelte, Astro, Markdown, JSONC              |
| AST parameter extraction     | Python, C, C++, Java, C#, JavaScript, TypeScript, Rust                       |

Visual Basic, R and SQL use line comments. Python uses a docstring-style block.
Other block-comment languages use `/* ... */` or `<!-- ... -->`.

## Commands

| Command                                    | Default keybinding          |
| ------------------------------------------ | --------------------------- |
| `File Header: Insert File Header`          | `Ctrl+Win+I` / `Ctrl+Cmd+I` |
| `File Header: Insert Function Comment`     | `Ctrl+Win+T` / `Ctrl+Cmd+T` |
| `File Header: Move Selection to Next Line` | `Alt+Y` / `Cmd+Y`           |
| `File Header: Set Error Log Path`          | -                           |

## Configuration

All settings use the `fileheader` namespace. You can edit them in
`Settings > Extensions > File Header` or directly in `settings.json`.

### `fileheader.customMade`

Defines the fields and order of the file header. Each key is printed as a field;
the value is its default content.

| Field             | Behavior                                                                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Author`          | Normal text field. Supports `git config user.name`, `git config user.email` and `git config user.name && git config user.email`.                        |
| `Date`            | Automatically replaced with the file creation time (or the current time when the creation time is unavailable).                                         |
| `LastEditors`     | Updated on save with `git config user.name`.                                                                                                            |
| `LastEditTime`    | Updated on save with the current time.                                                                                                                  |
| `FilePath`        | Generated automatically. Values: `no item name`, `only file name`, `only file name without ext`, or any other value for `project name + relative path`. |
| `Description`     | Normal text field. The cursor moves here after insertion when `moveCursor` is enabled.                                                                  |
| any other key     | Printed as a normal field. Key order is preserved.                                                                                                      |
| `custom_string_*` | Content-only field: the key is not printed.                                                                                                             |

Value placeholders and special behavior:

- `git config user.name`, `git config user.email` and the combined form are
  resolved from the repository containing the current file.
- `${now_year}` is replaced with the current year.
- `Date` and `LastEditTime` are always regenerated; their configured values are
  only documentation.
- `custom_string_copyright`, `custom_string_date`, and any other
  `custom_string_*` field print only their value. `custom_string_date` is
  replaced with the file creation time, or the current time when the creation
  time is unavailable.
- The old `custom_string_obkoro*` names are no longer supported.

### `fileheader.cursorMode`

Defines the fields and order of function comments. The default fields are:

```jsonc
{
  "description": "",
  "param": "",
  "return": ""
}
```

- `param` is filled automatically with extracted parameters when
  `openFunctionParamsCheck` is enabled.
- `description` is the field where the cursor is placed after insertion.
- Additional fields are printed as normal function-comment fields.

### `fileheader.configObj`

#### Basic behavior

| Key                | Default | Description                                                              |
| ------------------ | ------- | ------------------------------------------------------------------------ |
| `autoAdd`          | `true`  | Add a header automatically when a file is saved.                         |
| `autoAddLine`      | `100`   | Only auto-add when the file has at most this many lines.                 |
| `autoAlready`      | `true`  | Only auto-add languages that the extension recognizes.                   |
| `createHeader`     | `false` | Add a header when a new file is created.                                 |
| `createFileTime`   | `true`  | Use the file creation time for `Date`.                                   |
| `moveCursor`       | `true`  | Move the cursor to the `Description` field after insertion.              |
| `throttleTime`     | `60000` | Minimum interval in milliseconds between save-time updates for one file. |
| `CheckFileChange`  | `false` | Revert the file when a git diff shows that only header fields changed.   |
| `showErrorMessage` | `false` | Show errors in VS Code notifications.                                    |
| `writeLog`         | `false` | Write errors to the configured error log directory.                      |
| `useWorker`        | `false` | Prefer workspace-level `customMade` / `cursorMode` templates.            |

#### Header format

| Key                           | Default                                                          | Description                                                                |
| ----------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `dateFormat`                  | `YYYY-MM-DD HH:mm:ss`                                            | Day.js date format.                                                        |
| `filePathColon`               | `路径分隔符替换`                                                 | Set to a replacement string such as `/` or `\` to rewrite path separators. |
| `wideSame`                    | `false`                                                          | Pad header keys to the same width.                                         |
| `wideNum`                     | `13`                                                             | Width used by `wideSame`.                                                  |
| `atSymbol`                    | `["@", "@"]`                                                     | `[header, function]` `@` symbols.                                          |
| `atSymbolObj`                 | `{}`                                                             | Per-language overrides for `atSymbol`.                                     |
| `colon`                       | `[": ", ": "]`                                                   | `[header, function]` colon strings.                                        |
| `colonObj`                    | `{}`                                                             | Per-language overrides for `colon`.                                        |
| `annotationStr`               | `{ "head": "/*", "middle": " * @", "end": " */", "use": false }` | Fallback symbols for unknown languages when `use` is `true`.               |
| `headInsertLine`              | `{ "php": 2, "sh": 2 }`                                          | 1-based insertion line, keyed by extension.                                |
| `beforeAnnotation`            | `{}`                                                             | Text inserted before the header, keyed by extension.                       |
| `afterAnnotation`             | `{}`                                                             | Text inserted after the header, keyed by extension.                        |
| `specialOptions`              | `{}`                                                             | Rename special fields, optionally per language.                            |
| `switch.newlineAddAnnotation` | `true`                                                           | Prefix every line of multi-line field values with the comment symbol.      |
| `language`                    | `{}`                                                             | Custom comment definitions. See below.                                     |

#### Auto-add filters

| Key                   | Default            | Description                                         |
| --------------------- | ------------------ | --------------------------------------------------- |
| `supportAutoLanguage` | `[]`               | If non-empty, only these extensions are auto-added. |
| `prohibitAutoAdd`     | `["json"]`         | Extensions that are never auto-added.               |
| `folderBlacklist`     | `["node_modules"]` | Folder names that are never auto-added.             |
| `prohibitItemAutoAdd` | `[]`               | Project names that are never auto-added.            |

#### Function comments

| Key                       | Default         | Description                                                                           |
| ------------------------- | --------------- | ------------------------------------------------------------------------------------- |
| `openFunctionParamsCheck` | `true`          | Enable AST parameter extraction.                                                      |
| `cursorModeInternalAll`   | `{}`            | Insert function comments inside the function body, per language.                      |
| `functionParamsShape`     | `["{", "}"]`    | Parameter wrapper. Also accepts `"no type"`, `"no bracket"` and `"normal"`.           |
| `functionParamAddStr`     | `""`            | String appended after each parameter (for example `": "`).                            |
| `typeParamOrder`          | `type param`    | `type param`, `param type` or `param`.                                                |
| `functionTypeSymbol`      | `*`             | Default type symbol. Use `match param no type` to omit it.                            |
| `functionWideNum`         | `0`             | Pad function-comment keys to this width.                                              |
| `functionBlankSpaceAll`   | `{}`            | Extra indentation for function comments, per language.                                |
| `NoMatchParams`           | `no show param` | Hide unmatched `param`, or use `no show param and return` to hide both.               |
| `customHasHeadEnd`        | `{}`            | For custom languages: `cancel head`, `cancel function` or `cancel head and function`. |

#### Custom language definition

`language` keys can be a language ID, a file extension, a file name, a
slash-separated extension list, or a special suffix containing a dot.

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

Each definition supports:

| Key                       | Description                                                                    |
| ------------------------- | ------------------------------------------------------------------------------ |
| `head` / `middle` / `end` | Comment symbols for header comments.                                           |
| `functionSymbol`          | Optional `{ "head", "middle", "end" }` symbols for function comments.          |
| `functionParams`          | AST parser to use: `js`, `ts`, `java`, `python`, `rust`, `c`, `cpp`, `csharp`. |

#### Special field names

Use `specialOptions` to rename generated fields without changing their behavior:

```jsonc
"specialOptions": {
  "LastEditors": "LastAuthor",
  "LastEditTime": "LastTime",
  "FilePath": "Path"
}
```

It can also be configured per language:

```jsonc
"specialOptions": {
  "LastEditors": "LastAuthor",
  "js": {
    "LastEditors": "JSLastAuthor"
  }
}
```

## Development

Requires [Bun](https://bun.sh/) and VS Code 1.85+.

```bash
bun install
bun run check-types
bun run test
bun run lint
bun run compile
bun run vsce:package
```

The build copies tree-sitter WASM assets to `dist/`; use the project scripts
rather than running `bun build` directly.

## License

MIT. Original work copyright (c) 2018-2023 OBKoro1. Changes after the last
upstream update copyright (c) 2023-present WangWindow. See [LICENSE](LICENSE).
