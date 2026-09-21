# Changelog（@thincoder/core）

All notable changes to the core package are documented here.
Format: Keep a Changelog · 中文 · 号在发布时定（CalVer——见 `docs/RELEASE.md` §4）。

## [0.9.2] — 2026-09-21

> 0.9.1 → 0.9.2（月内序号——发布时定号）

### Added

- **PROJECT-MANIFEST 模型（按用点解析）**：项目发现五级梯（会话锚 → 带档祖先 → 一层子档 → 工作区……）+ owning-ancestor 归属 + 建档流；整档缺失不再静默（启动降级 + 明示提示）。
- **批档生命周期工具** `batch`（create / append / status / close——原 `batch_segment` 更名，别名保留）。
- **台账执行人列**（F-LX1）：executor 归属 + 判存活显示。
- **信号行两档标签**（digest / ask）+ ask 参数 + 起始行（F-UC8）。
- **会话认领释放**（F-CR1/CR2）：释放 + 拒绝零写入。

### Changed

- **非阻塞启动**：异步会话 GC · 陈旧清扫 · traces 清理（启动不再被大扫除卡住）。
- **工程模式排除 `plan` 角色**（FR31——装配 / 命令 / 残留三面一致）。
- **包面**：README 补建（static 工具口径收正）+ LICENSE + npm 元数据；`files` 白名单不变。

### Fixed

- 批别名残留（测试断言 / 提示词文档引用 / 错误串）· VSC 子代理块标题行与 CLI 对齐（标题段补全）。

## [0.9.1] — 2026-09-21

> 核首发（2026-09 当月推导——registry 无号 ⇒ `0.<当月>.1`；首发即本段 ✗ 无更早历史——核内容此前散在两产品仓 ✗ 无独立版本号可考 ✗）。

### Added

- **核包首发 `@thincoder/core@0.9.1`**：两产品共享机制收敛后的单一权威源——agent 执行环 / 子代理调度（spawn-gate · async 池 · notify_parent）· advisor 评审 · provider 层（SSE 流式 · thinking 映射 · 重试）· 记忆三层 · 工具系统 · 会话存储 · MCP 客户端 · git 集成 · 台账。
- **提示词与工具文档随包分发**：`prompts/` 15 档 + `tool-docs/` 24 档（一致性断言 D 对象——与 CLI 装机目录 / vsix 三处逐字相等）。
- **发布门禁**：`prepublishOnly` = `npm test`（与 CLI/VSC 门禁对称——2026-09-21 首发 补上）。

### Changed

- 两产品 `dependencies` 同步收正 `^0.1.0 → ^0.9.1`（声明面与 registry 实发对齐——断言 A）。
