# Changelog

[English](CHANGELOG.md) | [简体中文](CHANGELOG.zh-CN.md)

## [5.0.0] - 2026-11-03

This release is a fork and major refactor of
[koro1FileHeader 4.9.3](https://github.com/OBKoro1/koro1FileHeader).

### Added

- Chinese and English UI through VS Code `package.nls` and `l10n` bundles.
- AST-based function parameter extraction for Python, C, C++, Java, C#,
  JavaScript, TypeScript and Rust.
- Line-comment header styles for Visual Basic, R and SQL.
- Unit tests for language resolution, header rendering, save-time header
  detection, git diff detection and AST parameter extraction.
- Bun build scripts with automatic tree-sitter asset copying.

### Changed

- Rewrote the extension in TypeScript.
- Replaced the old toolchain with Bun, Biome and `tsc`.
- Updated extension metadata, author, repository and package information.
- Replaced the old command ID `koroFileheader.table` with `fileheader.table`.
- Renamed custom content fields:
  - `custom_string_obkoro1_copyright` -> `custom_string_copyright`
  - `custom_string_obkoro1_date` -> `custom_string_date`
  - `custom_string_obkoro*` -> `custom_string_*`
- Removed the original author's legacy naming from source code.
- Header generation now normalizes line endings to the active document.
- Multi-line custom head markers are now detected correctly when updating the
  header on save.

### Removed

- ASCII comment art and all related commands, keybindings and settings.
- The old `images` folder and all screenshot references.
- Solidity, PHP, Go and Lua support, plus legacy code paths outside the
  supported language set. Visual Basic is now handled by the line-comment style.
- The old JavaScript source tree and obsolete test scaffolding.
- All hand-written regular-expression parameter parsers. Parameter extraction is
  now AST-only.

### Fixed

- Custom header detection for multi-line `head` values.
- File path updates no longer depend on reading the original settings object.
- Git operations use argument arrays instead of shell interpolation.
- Git config lookups are cached to avoid repeated synchronous process starts.
- HTML function comments now use HTML comment delimiters.

### License

MIT. Original work copyright (c) 2018-2023 OBKoro1. Changes after the last
upstream update copyright (c) 2023-present WangWindow.
