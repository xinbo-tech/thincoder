# ThinCoder VS Code 设计文档地图（docs/design/）

> 本文件是 `docs/design/` 的板块登记表与归属规则——写/改设计文档前**先查这里**。
> 文档地图重写批 V1（2026-09-08）：归档 11 文件移 `_archive/` 并更新登记；整文件单行 demux 为多行 markdown。
> 核心纪律：**一个板块一个文档**；功能点并入所属板块文档（不新建）；新板块才新建并在此登记；同一机制只在一处详述（权威源），其余文档引用、不复制。与 CLI 端 `thincoder/docs/design/README.md` 同构。

## 板块 → 文档映射

| 板块 | 文档文件 | 备注 |
|---|---|---|
| 架构 | `ARCHITECTURE.md` | 权威源（DOC-REORG-VSC 拆分批——机制板块陆续独立成文） |
| 工程模式 | `ENGINEERING-MODE.md` | 与 CLI 同名文档对应；会话级开关/eng token/门禁/guard |
| Webview 前端/消息协议 | `WEBVIEW.md` | VSC 独有（无 CLI 对应）；webview 布局/文件结构/活动面板 R22/组件 + 消息协议（ARCHITECTURE §11+§12 迁出） |
| 评审收敛 | `ADVISOR-CONVERGENCE.md` | 与 CLI 同名文档对应；advisor 轮次衰减/cap/铁律 R1-R7 |
| 需求与决策 | `REQUIREMENTS.md` | 需求与决策记录 |
| 三观（提示词根基） | `PHILOSOPHY.md` | |
| 配置面板（Settings） | `SETTINGS.md` | 现行权威源（2026-08-25 合并 6 份历史批次文档：SETTINGS-PANEL(-2)/PROXY-ROW/REORG/SUBMODEL-SHELL/MODEL-PICKER-UNIFY，已入 `_archive/`，细节查原文件） |
| Provider/transport | `PROVIDER.md` | 权威源（ARCHITECTURE §5 + RESPONSES-TRANSPORT 并入——2026-09-08 DOC-REORG） |
| 项目切换 | `PROJECT-SWITCHER.md` | |
| 发布流程 | `RELEASE.md` | |
| 会诊 | `CONSULTATION.md` | |
| 飞刀 | `ESCALATE.md` | |
| Design Token 硬化 | `ENG-TOKEN-BINDING-REQUIREMENTS.md`、`ENG-TOKEN-BINDING-TUNING.md` | v2 收窄：安全修复（双后门/复活陷阱）+ TTL 7 天可配（2026-08-25，v1 内容绑定被实况否决见文档考古） |
| 覆盖率缺口修复 | `_archive/COVERAGE-GAPS-REQUIREMENTS.md`、`_archive/COVERAGE-GAPS-TUNING.md` | 遗留测试覆盖收口（2026-08-25，与 CLI 同源）——已移 `_archive/` |
| 轮末蒸馏异步化 | `SEND-STALL-DISTILL-REQUIREMENTS.md`、`SEND-STALL-DISTILL-TUNING.md` | send 按钮卡顿修复：结束信号先行、蒸馏异步（2026-08-25，与 CLI 同源） |
| 工具移除 | `_archive/SLEEP-REMOVAL-REQUIREMENTS.md`、`_archive/SLEEP-REMOVAL-TUNING.md` | sleep 工具删除（2026-08-25，与 CLI 同源）——已移 `_archive/` |
| 工具输出限制 | `TOOL-OUTPUT-LIMITS-REQUIREMENTS.md`、`TOOL-OUTPUT-LIMITS-TUNING.md` | 落盘阈值/显示层 16K→64K（2026-08-24，与 CLI 同源） |
| Agent 运行参数 | `AGENT-PARAMS-REQUIREMENTS.md`、`AGENT-PARAMS-TUNING.md` | 评审超时/轮次上限调整（2026-08-24，与 CLI 同源） |
| Agent 循环 | `TURN-CAP-CONTINUE.md` | 插件侧实现记录；CLI 端同源文档见 thincoder/docs/design/（2026-08-25 收口：两端各自为实现记录，不再标待合并） |
| Webview 性能 | `_archive/webview-input-lag.md` | 输入卡顿修复方案（纯历史修复记录，已实施）——已移 `_archive/` |

## 规则

1. **一个板块一个文档**：新功能点不新建文档，并入所属板块的现有文档（追加变更段或更新章节）。
2. **先查地图定位归属**：写文档前先查本表——找到所属板块就改该板块文档，**不得为既有板块新建文件**。
3. **新板块才新建**：确无归属的新板块才新建文档，并立即在本表登记。
4. **单一权威源**：同一机制只在一处详述；其余文档引用（指路），不复制内容——多处复制必然漂移矛盾。
5. **存量碎片处理（2026-08-25 收口）**：Settings 6 文档已合并为 `SETTINGS.md`（现行权威源，历史批次文档已归档 `_archive/`）；TURN-CAP 两端同源已收口为各自实现记录。新增同主题内容须先查本表归属。
6. **文档人类可读（2026-09-08 防复发）**：写/改本文档映射内任一 `docs/design/` 文档须人类可读——**无 >300 字符单行**（整节/表/规则不得压成一行）、**markdown 结构正确**（标题/表格/代码块不被吞进正文，空行隔离节）、**变更记录折叠**（新变更落一行注记，不堆逐批需求/评审/测试流水账）。违反即文档格式债，与源码长行硬限同理。批量检查：`node scripts/check-doc-width.mjs`（扫 `docs/design/` 无 >300 单行，`_archive/` 豁免）。

## 变更记录

- 2026-08-21：初版（文档归属纪律，规格见 CLI `docs/design/AGENT-LOOP.md` §12 及本仓库 `ARCHITECTURE.md` 同步段）
- 2026-08-24：新增板块「Agent 运行参数」（AGENT-PARAMS-*）与「工具输出限制」（TOOL-OUTPUT-LIMITS-*）
- 2026-08-25：新增「轮末蒸馏异步化」（SEND-STALL-DISTILL-*）、「工具移除」（SLEEP-REMOVAL-*）、「覆盖率缺口修复」（COVERAGE-GAPS-*）；Settings 6 份历史批次文档合并入 `SETTINGS.md`
- 2026-09-06：README provider 数量修正（17→20——补 GLM Coding Plan / MiMo / MiMo Token Plan，与 `src/config-presets.mjs` PROVIDER_PRESETS 对齐）；其余文档质量观察项见会话记录，未入库
- 2026-09-06：会话目录残留 GC + 标题写显性化（机制权威源 CLI `SESSION.md` §12）——VSC 端 eng-coder 交付：`src/extension/session-gc.mjs`（残留 GC + 冷 cwd 原语，CLI 同源移植；F2 手动执行面仅 CLI `thincoder session gc`）+ setSlotTitle `{ok, reason}` 契约（session-io.mjs）+ 面板调用方适配（panel-messages/panel-session）+ `test/session-gc.test.mjs`
- 2026-09-08：文档格式债清理批——**归档 11 件移 `_archive/`**（SETTINGS-PANEL(-2)/PROXY-ROW/REORG/SUBMODEL-SHELL/MODEL-PICKER-UNIFY + COVERAGE-GAPS 对 + SLEEP-REMOVAL 对 + webview-input-lag）并更新登记；整文件单行 demux 为多行 markdown；归属规则加**规则 6（文档人类可读防复发）**——配 `scripts/check-doc-width.mjs` 批量检查。
- 2026-09-08：DOC-REORG 第 2 批——`RESPONSES-TRANSPORT.md` 并入新建 `PROVIDER.md`（板块 Provider/transport），README 登记行同步（原 Responses 行改为 PROVIDER 行）
- 2026-09-08：DOC-REORG-VSC 第 7 批——新板块登记：Webview 前端/消息协议（WEBVIEW，VSC 独有无 CLI 对应），自 ARCHITECTURE §11+§12 迁出（消息协议并入）。
- 2026-09-08：DOC-REORG-VSC 第 4 批——新板块登记：工程模式（ENGINEERING-MODE）+ 评审收敛（ADVISOR-CONVERGENCE），各自独立完整（与 CLI 同名档对应）。
