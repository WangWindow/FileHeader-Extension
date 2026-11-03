# 更新日志

[English](CHANGELOG.md) | [简体中文](CHANGELOG.zh-CN.md)

## [5.0.0] - 2026-11-03

本版本基于
[koro1FileHeader 4.9.3](https://github.com/OBKoro1/koro1FileHeader) 分支重构。

### 新增

- 通过 VS Code `package.nls` 和 `l10n` 支持中文、英文界面。
- 基于 AST 的函数参数提取，支持 Python、C、C++、Java、C#、JavaScript、
  TypeScript 和 Rust。
- Visual Basic、R、SQL 的行注释风格头部注释。
- 单元测试覆盖语言识别、头部渲染、保存时头部检测、git diff 判断和 AST
  参数提取。
- Bun 构建脚本，并自动复制 tree-sitter 资源文件。

### 变更

- 使用 TypeScript 重写插件。
- 工具链改为 Bun、Biome 和 `tsc`。
- 更新插件元信息、作者、仓库和包信息。
- 命令 ID `koroFileheader.table` 改为 `fileheader.table`。
- 自定义内容字段重命名：
  - `custom_string_obkoro1_copyright` → `custom_string_copyright`
  - `custom_string_obkoro1_date` → `custom_string_date`
  - `custom_string_obkoro*` → `custom_string_*`
- 移除源码中由原作者遗留的命名。
- 头部注释换行符统一为当前文档的换行符。
- 保存更新时能正确识别多行自定义 `head`。

### 移除

- 注释图案功能及相关命令、快捷键和配置。
- 旧 `images` 文件夹及所有截图引用。
- Solidity、PHP、Go、Lua 支持，以及支持语言范围之外的遗留代码路径。
  Visual Basic 现在由行注释风格处理。
- 旧 JavaScript 源码和过期测试文件。
- 全部手写正则参数解析器，参数提取现在只使用 AST。

### 修复

- 多行 `head` 自定义头部注释的检测问题。
- 文件路径更新不再依赖读取原始配置对象。
- Git 操作使用参数数组，避免 shell 拼接。
- Git 配置读取增加缓存，避免重复启动同步进程。
- HTML 函数注释现在使用 HTML 注释符号。

### 许可证

MIT。原项目版权归 OBKoro1 所有（2018-2023）。原项目停止更新后的修改版权归
WangWindow 所有（2023-至今）。
