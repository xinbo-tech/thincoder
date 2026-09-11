# ThinCoder VS Code 文档地图（docs/README.md）

> 本档 = 本仓 `docs/` 的**总地图**：逐层登记 + 登记规则指针。写/改任何文档前先看本档定位层。
> 与 CLI 仓同名地图（`README（CLI 仓）`）语义同源（各端原文自持）；本端层清单与端差（`guides/` 不建）逐行登记于下。

## 层清单（逐行）

| # | 层 | 内容 | 规则 / 指针 |
|---|---|---|---|
| 1 | 仓根（非 `docs/`） | `AGENTS.md` · `README.md` · `CHANGELOG.md` · `LICENSE` | 保持——工程指南 / 用户说明 / 变更 / 许可 |
| 2 | `docs/README.md` | **本档**（总地图） | 逐层登记 + 登记规则指针；层变更同步本表 |
| 3 | `docs/TODO.md` / `docs/TODO-archive.md` | 台账（需求池 + 技术待办）｜归档档 | 形态权威见 `ENGINEERING-MODE.md`；活文件只留未决、归档条目移入归档档 |
| 4 | `docs/requirements/` | 需求层（**16 档**） | 地图与登记规则 = `docs/requirements/README.md`（本档不重述）；36 档对位表住该档 |
| 5 | `docs/design/` | 设计层（顶层板块档 + `README.md` 地图） | 板块登记与归属规则 = `docs/design/README.md`（本档不重述） |
| 6 | `docs/design/prompts/`（中文权威）+ `src/prompts/`（英文落地） | 提示词双源（各 15 档对位） | 机制权威 = 本端双源；差异登记 = `docs/design/README.md`「镜像差异表」 |
| 7 | `docs/batches/` | 批次档（`<批>-<主题>.md`；各仓自持） | 六段 append-only、一段一作者；批次档机制见 `ENGINEERING-MODE.md` |
| 8 | `docs/design/_archive/` | 设计归档（退役 / 历史快照） | 归档区豁免宽度与一致性机检（历史快照不追改） |
| 9 | `docs/guides/` | **不建**（端差——已登记） | 理由：本仓无「ACP / 终端 IDE 接入」类面（对位表 ③ 行）；接入 / 使用面已住本档与 `docs/design/WEBVIEW.md`，发布面住 `docs/design/RELEASE.md`。**触发**：出现首个「面向用户的操作指南」主题时建层并回本表登记 |
| 10 | 本仓独有档 | `docs/CAPABILITY_GAP.md` · `docs/COMPETITIVE_ANALYSIS.md` | **保留**（本仓独有，不得因对位而删） |

## 三条横切规则（摘要——详文不在此重述）

1. **各仓自持**：需求档 / 设计档 / 批次档 / 台账一律各仓记各仓的——禁跨仓写需求、禁跨仓指针（他仓档以「名称（仓别）§N」形态引用）。
   机制权威 = `docs/requirements/ENGINEERING-MODE.md`；提示词层 = `src/prompts/discipline-engineering.md`「文档与台账自持」节。
2. **人类可读**：无 >300 字符单行（表格行豁免）；markdown 结构正确；变更记录折叠为一行注记。
   批量检查：`node scripts/check-doc-width.mjs`（扫描域 = `docs/design` + `docs/requirements` + `docs/batches`；`_archive/` 豁免）。
3. **单一权威源**：同一机制只在一处详述，其余处只引用不重述——板块地图 = 各层 `README.md`（`docs/design/README.md` · `docs/requirements/README.md`）。

## 台账与批次档速查

- 台账两池：**需求池**（用户需求点）/ **技术待办**（设计遗留 / 评审发现 / 债）；条目一行一条、不展开细节（细节住设计档 / 批次档）。
- 状态机：待讨论 / 待设计 / 在途 / 待核销 / 已核销 / 已废弃——已核销 / 已废弃移入 `docs/TODO-archive.md`。
- 批次档 = `docs/batches/<批>-<主题>.md`；六段：§1 讨论（主 agent）· §2 任务书（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。

## 变更记录

- 2026-09-12：建档（LEDGER-SELF-CONTAINED 批——本仓文档地图首建；层清单十行逐行登记，含 `docs/guides/` 「不建 + 理由 + 触发」端差行）。
