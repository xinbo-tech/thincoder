# Changelog（@thincoder/core）

All notable changes to the core package are documented here.
Format: Keep a Changelog · 中文 · 号在发布时定（CalVer——见 `docs/RELEASE.md` §4）。

## [0.9.1] — 2026-09-21

> 核首发（2026-09 当月推导——registry 无号 ⇒ `0.<当月>.1`；首发即本段 ✗ 无更早历史——核内容此前散在两产品仓 ✗ 无独立版本号可考 ✗）。

### Added

- **核包首发 `@thincoder/core@0.9.1`**：两产品共享机制收敛后的单一权威源——agent 执行环 / 子代理调度（spawn-gate · async 池 · notify_parent）· advisor 评审 · provider 层（SSE 流式 · thinking 映射 · 重试）· 记忆三层 · 工具系统 · 会话存储 · MCP 客户端 · git 集成 · 台账。
- **提示词与工具文档随包分发**：`prompts/` 15 档 + `tool-docs/` 24 档（一致性断言 D 对象——与 CLI 装机目录 / vsix 三处逐字相等）。
- **发布门禁**：`prepublishOnly` = `npm test`（与 CLI/VSC 门禁对称——2026-09-21 首发 补上）。

### Changed

- 两产品 `dependencies` 同步收正 `^0.1.0 → ^0.9.1`（声明面与 registry 实发对齐——断言 A）。
