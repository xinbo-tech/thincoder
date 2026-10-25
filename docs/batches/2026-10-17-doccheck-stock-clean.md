# 2026-10-17 · doccheck-stock-clean
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-17 · 来源 = 用户 2026-10-17 23:10「都处理掉」+ 23:40「一起全派出去」；本批 = B 组（机检存量清账）。
> 台账 = #1627（core · 归批）。前情 = docs/batches/2026-10-17-crossdoc-coords.md（同轮 · 并行）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-25
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**本批条目（1 条，含 12 簇）**：清掉文档机检的存量红——`eng-designer#98` 分诊：悬空 **430**（档缺 414 ∥ 节缺 16）· 超宽 **92**（真需折行；表格行 1259 豁免）· 12 簇。

**关键判据（父侧六裁，逐条）**：① K1（TODO 两档 153 命中）= **排除面**——工作笔记不是规范档，引擎不该拿规范尺子量；配套把 `docs/README.md:14` 的「无机械校验」声明改成实话。② K2（操作数名 96）∥ K8（示例 59）= **不动文档 → 改引擎**（`#1633`）——这些引用是真的（`AGENTS.md` 就在仓库根），删它才是破坏；根因 = 引擎 `basename` 索引只扫 `docs/`。③ K3/K4/K5/K10-TUI/K12（71）= 改指 / 退场。④ K6（`TOOLS.md` 迁移表 40）= 整段退场——状态档不携历史。⑤ K7（迁移清单整档）= 删档。⑥ 复跑读数**可作一次性验收读数**（记进本档、事后不引），**不作常设门禁**（12:10 令不变）。

**授权口径**：用户 2026-10-17 23:10「检查台账，分分批都处理掉」+ 23:40「队列里的不如一起全派出去」+ 23:36「提示词批你也自动跑完吧」（整批令口径 = 本批各子批的发火令）。

**批径**：文档面批次（`docs/**`）；`PROJECT-MANIFEST.json` 由父侧改（排除面配置），引擎改动属产品码面另批（`#1633`）。

> 不适用：§3 —— 存量清理批（改指 ∥ 退场 ∥ 删档），无新设计语义可评；判据 = 父侧六裁 + 复跑读数（见 §1 关键判据 ∥ §6）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成 2026-10-17（锚 430→249 · 宽 92→62（活档 0）· 档 214→213；K1/K2/K8 归主 agent 与引擎侧（#1633））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

### §2.0 本批边界与交付形态
- 本批 = B 组（机检存量清账）· **只分诊，不落改**：写面 = 本档 §2；零 `docs/**` 其它档、零产品码、零 `scripts/**`、零 manifest 改动。
- 设计档落点 = **无**（本批不产生设计档；分诊口径 + 清单 = 本节）。理由 = 清账轮的对象是存量读数，不是新机制；下一轮按簇表执行。
- 任务来源 = 父侧派单（逐条任务表 1–4）+ 台账 #1627（已吸收 #1619 / #1496 / #1560）。
- 已知偏差（如实登记）：本档 §1 仍是模板占位（`<§1 模板占位…>`）——主 agent 笔未填；本席按派单正文执行，任务面无缺口。

### §2.1 读数（产品内建引擎 · 枚举用，非门禁判据）
- **取值入口** = 产品内建 `doc_check` 的同一实现：`thincoder-core/agent-tools/doc-check.mjs:27-35` → `runDocCheck()`（`thincoder-core/doc-check/index.mjs:25`）。本席装配面无 `doc_check` 工具，故直接调用该入口函数；**未执行**被禁脚本 `node scripts/doc-check.mjs`（用户 2026-10-15 12:10 令）。
- **参数原文**：`runDocCheck("d:/teamcode/thincoder")`（= `doc_check` 工具的 `target` 缺省 = 会话锚；判据面 = `PROJECT-MANIFEST.json` `checkConfig`：`scanDirs=["docs"]` · `lineWidth=300` · `anchors.exclude=["_archive","batches"]` · `widthExemptZones=["变更记录","历史沿革"]` · `exemptions=[]`）。
- **读数（2026-10-17 23:4x 现盘）**：射程 **214 档** · **命中 522 = 锚 430（档缺 414 + 节缺 16）+ 行宽 92**；锚·多义报告 903 条（报告面，不判）。
- **与父侧 23:1x 读数（253 悬空 ∥ 95 宽）的差**：不是同一把尺子——253 出自旧 `scripts/doc-check.mjs`（判全部扩展名路径 token + 用例号 + 符号，自带注记/占位/可执行行豁免），本读数出自产品内建面（只判 `.md` token + `§` 节号，无占位/操作数/退役档豁免）。两数不可对齐；按派单「以你的读数为准」取本读数。
- **读数口径声明**：本读数只用于**枚举清账对象**，不作任何闸/绿判据（沿 12:10 令「不再以其红/绿作任何判据」；`docs/README.md:25` / `:105` 同旨）。门禁口径另议（§2.7 上抛 ⑥）。
- **工作树漂移**：当前工作树 = 71 档 M + 17 档未跟踪（多批并行在写）；读数随盘，下一轮复跑须以当刻盘为准。

### §2.2 三类分诊总账（合计 = 430）
| 类 | 条数 | 口径 | 簇 |
|---|---|---|---|
| ① 真悬空 | 143 | 对象确不存在于任何面 ⇒ 改指 ∥ 退场 | K3 · K4 · K5 · K6 · K9 · K10 · K12 |
| ② 迁移期/归档 | 215 | 对象在仓外/归档面（工作区操作数 · 产品归档树 · 运行时名） | K1 · K2 · K7 |
| ③ 拟新增/计划件 | 13 | 对象是目标态/命名示例，从未落盘 ⇒ 改写形态 | K11 |
| ④ 示例/非引用（差额） | 59 | `X.md` 族：格式示意 ∥ 他工具名 ∥ 黑名单名，不是引用 | K8 |
| **合计** | **430** | | |

- 三类之和（①+②+③）= 371；加 ④ 差额 59 = 430。**④ 不是悬空**，是引擎无占位豁免造成的列报——处置走豁免裁定（§2.7 上抛 ③）。
- `index.publicRepos = []`（声明源为空）⇒ 本批无「声明内」判据可用；② 的「归档面」= 本仓归档树 + 工作区面 + 运行时操作数，非声明源。

### §2.3 逐条清单（簇级；同 token 同处置，实例逐行列出）

#### K1 · TODO 退役历史两档（② 迁移期/归档 · 91 锚 + 62 宽行）
- 面 = `docs/TODO.md`（2 锚 + 16 宽）· `docs/TODO-archive.md`（89 锚 + 46 宽）。
- 性质：两档由 `docs/README.md:14` 声明为「退役历史（md 形态，**无机械校验**）」；产品内建引擎仍扫（`scanDomain` 只排除 `_archive`/`batches`，无台账档名排除——旧引擎的 `TODO.md`/`TODO-archive.md` 排除未随迁）⇒ **文档声明与引擎行为相抵**（§2.7 发现 ①）。
- 处置（二择一，待裁）：
  - **A** `PROJECT-MANIFEST.json` `checkConfig.anchors.exclude` 增 `"TODO.md"`、`"TODO-archive.md"`——`walkMd`/`scanDomain` 对文件名同判（`thincoder-core/doc-check/width.mjs:41`），零代码，一次消 91 锚 + 62 宽；
  - **B** 删两档（台账 SQLite 已承载条目；破坏性 ⇒ 须用户令）。
- 实例（`line:token`；同 token 多行照列）：
  - `docs/TODO-archive.md`（89）：
    3:thincoder-cli/docs/requirements/ENGINEERING-MODE.md · 13:…-SETTINGS-NULL-DEFAULT.md · 14:…ENGINEERING-MODE.md · 14:…-ENGINEERING-MODE.md · 15:…ENGINEERING-MODE.md · 15:…-BATCH-SEGMENT-TOOL.md · 17:…-COMMON-LAYER.md · 18:…ENGINEERING-MODE.md · 18:…-PORTABILITY.md · 19:…ENGINEERING-MODE.md · 19:…-ROLE-REDEFINITION.md · 20:…-MODEL-SELECTION.md · 21:…-DEEPSEEK-V41-FLASH.md · 23:…-TEST-LIFECYCLE.md · 25:…ENGINEERING-MODE.md · 25:…-POOL-LEDGER.md · 26:…ENGINEERING-MODE.md · 26:…-POOL-LEDGER.md · 28:…-PORTABILITY.md · 30:…ENGINEERING-MODE.md · 30:…-LEDGER-SURFACE.md · 31:…-TEST-DISCIPLINE-PROMPTS.md · 32:…-TUI-OOM-FORENSICS.md · 32:…-TUI-OOM-ROOTCAUSE.md · 33:…ENGINEERING-MODE.md · 35:…-PROSE-ANCHOR-RETIRE.md · 37:…ENGINEERING-MODE.md · 37:…-LEDGER-SELF-CONTAINED.md · 38:…ENGINEERING-MODE.md · 38:…-DOC-CODE-RECONCILE.md · 42:CHANGELOG.md · 42:…-MECH-DEBT-SWEEP.md · 48:thincoder-cli/docs/design/ENGINEERING-MODE.md · 50:同 · 56:…requirements/ENGINEERING-MODE.md · 67:AGENTS.md · 67:VERIFY-DOCONLY.md · 67:AGENTS.md · 70:…-NORMAL-MODE-AUDIT.md · 71:thincoder-cli/src/tools/read_image.md ×2 · 73:…design/ENGINEERING-MODE.md · 74:…-ABORT-PROVENANCE.md · 76:…-VSC-REVIEW-ASYNC-SWEEP.md · 83:…requirements/ENGINEERING-MODE.md · 89:…design/ENGINEERING-MODE.md · 94:SUBAGENT-ID-COUNTER-AGENT.md · 94:…-SWEEP-FOLLOWUP.md · 107:requirements/ENGINEERING-MODE.md · 118:CHANGELOG.md · 122:packages/foo/src/x.md · 131:methodology-template.md · 133:AGENTS.md ×2 · 134:AGENTS.md · 134:project_rules.md · 134:CLAUDE.md · 140:changelog.md · 156:.thincoder/advisor.md · 171:…VSC-ASYNC-PARITY.md · 172:…VSC-ACTIVITY-CLOSURE.md · 173:…VSC-CHILD-PERMISSION.md · 175:…PROSE-ANCHOR-RETIRE.md · 177:…requirements/ENGINEERING-MODE.md · 177:…LEDGER-SELF-CONTAINED.md · 178:…requirements/ENGINEERING-MODE.md · 178:…DOC-CODE-RECONCILE.md · 184:…VSC-MIRROR.md · 186:…VSC-GUARD-COMPLETION.md · 192:…design/ENGINEERING-MODE.md · 194:…VSC-GUARD-COMPLETION.md · 202:…PORTABILITY-VSC-MIRROR.md · 206:…VSC-REVIEW-ASYNC-SWEEP.md · 211:AGENTS.md ×2 · 224:system.md ×2 · 260:docs/core/design/ENGINEERING-MODE.md · 260:docs/core/requirements/ENGINEERING-MODE-MECHANISM.md · 268:docs/batches/2026-09-15-embedding-utf16-truncation.md · 269:docs/batches/2026-09-15-vsc-tool-table-dup.md · 270:docs/batches/2026-09-16-vsc-subagent-panel-channel.md · 271:docs/batches/2026-09-16-subagent-reasoning-echo.md · 272:docs/batches/2026-09-16-vsc-autoapprove-misalign.md · 274:docs/batches/2026-09-16-subagent-panel-residual-rings.md · 276:docs/batches/2026-09-16-tui-history-trim.md · 277:docs/batches/2026-09-15-vsc-agent-tools-spawn-fix.md · 291:docs/core/requirements/ENGINEERING-MODE-MECHANISM.md ×2
    （`…` = 同前缀 `thincoder-cli/docs/batches/` / `thincoder-vscode/docs/…`；逐条原名见现盘该行。）
  - `docs/TODO.md`（2）：3:thincoder-cli/docs/requirements/ENGINEERING-MODE.md · 22:docs/core/design/E2E-HARNESS.md
- 注：K1 内部按对象性质可再分（`thincoder-cli/docs/**` = 已归档；`docs/batches/**` = 已删批档；`AGENTS.md` 等 = 操作数）——但动作是**档级一刀**，故整簇列此，不逐条处置。

#### K2 · 操作数名族（② 迁移期/声明外 · 96）
- 面 = `AGENTS.md` 69 · `project_rules.md` 12 · `SKILL.md` 6 · `.thincoder/advisor.md` 5 · `agent.md` 3 · `CLAUDE.md` 1。
- 性质：项目指令 / 技能 / 顾问覆盖 / 他工具指令文件名——运行期操作数，不是仓内档。产品协议本身把它们列为「操作数豁免」；引擎无该豁免（§2.7 发现 ②）。
- 处置（三选一，待裁）：
  - **A** 引擎操作数豁免（产品码；与旧引擎 `PLACEHOLDERS` 同形，档名级）；
  - **B** `checkConfig.exemptions` 增六名（零代码；**行级**——同行其它真引用会一并免，须逐行核）；
  - **C** 文档改写为不带 `.md` 的指称（保真度损失，不推荐）。
- 可直接改指（4 处）：`TESTING.md:285`（×3）与 `desktop/design/PACKAGING.md:147` 指产品 `AGENTS.md`（`thincoder-cli/AGENTS.md` ∥ `thincoder-desktop/AGENTS.md` ∥ `thincoder-vscode/AGENTS.md` 均在盘）⇒ 加产品前缀。
- 实例：
  - `AGENTS.md`（69）：docs/RELEASE.md:311 :336 :384 · docs/core/design/AGENT-LOOP-SUBAGENT.md:502 :641 · docs/core/design/AGENT-LOOP.md:253 · docs/core/design/CHECKPOINT.md:108 · docs/core/design/CONTEXT-COMPACTION.md:600 · docs/core/design/DOC-DISCIPLINE.md:630 · docs/core/design/DOC-MIGRATION.md:307 :373 · docs/core/design/LEDGER.md:297 :332 :421 · docs/core/design/MEMORY.md:779 · docs/core/design/MODEL-BENCH.md:1815 :1996 · docs/core/design/PORTABILITY.md:298 · docs/core/design/PROMPT-SYSTEM.md:179 :215 :216 :578 :664 :794 · docs/core/design/TESTING.md:227 :285 ×3 · docs/core/design/VERIFY-REDESIGN.md:37 :67 :68 :90 :100 · docs/core/design/prompts/advisor-round1.md:17 :32 · docs/core/design/prompts/advisor-round2.md:18 · docs/core/design/prompts/advisor-round3.md:18 · docs/core/design/prompts/common.md:32 :48 :136 · docs/core/design/prompts/discipline-engineering.md:38 · docs/core/design/prompts/discipline-normal.md:7 :11 :154 :160 :193 · docs/core/design/prompts/persona-eng-coder.md:16 · docs/core/requirements/ADVISOR-CONVERGENCE.md:113 · docs/core/requirements/CHECKPOINT.md:48 · docs/core/requirements/MEMORY.md:308 · docs/core/requirements/NORMAL-MODE.md:14 :62 :80 · docs/core/requirements/PROMPT-SYSTEM.md:196 :200 :216 :220 :229 :230 :273 ×2 · docs/core/requirements/TESTING.md:136 · docs/core/requirements/VERIFY-REDESIGN.md:18 :27 · docs/desktop/design/PACKAGING.md:147 :397 · docs/vsc/design/SETTINGS.md:45 · docs/vsc/design/VSC-DEBT.md:155 :468
  - `project_rules.md`（12）：docs/core/design/AGENT-LOOP.md:253 · docs/core/design/PROMPT-SYSTEM.md:215 :216 :578 :658 :664 :794 · docs/core/design/prompts/common.md:48 · docs/core/requirements/PROMPT-SYSTEM.md:220 :229 :230 · docs/vsc/design/SETTINGS.md:45
  - `SKILL.md`（6）：docs/core/design/PROMPT-SYSTEM.md:215 :216 :794 · docs/core/design/TOOLS.md:78 · docs/core/design/WORKSPACE.md:33 · docs/core/design/prompts/common.md:48
  - `.thincoder/advisor.md`（5）：docs/core/design/ADVISOR-CONVERGENCE.md:374 · docs/core/design/PROMPT-SYSTEM.md:215 :216 :794 · docs/core/design/prompts/common.md:48
  - `agent.md`（3）：docs/core/design/PROMPT-SYSTEM.md:658 ×2 · docs/core/requirements/PROMPT-SYSTEM.md:229
  - `CLAUDE.md`（1）：docs/core/design/AGENT-LOOP.md:253

#### K3 · 归档产品树引用（② 迁移期/归档 · 1）
| file:line | token | 处置 |
|---|---|---|
| docs/core/design/DOC-DISCIPLINE.md:1212 | `thincoder-cli/docs/design/ENGINEERING-MODE.md` | 改指 `thincoder-cli/docs/_archive/design/ENGINEERING-MODE.md`（只读参照面；该句已自述「参照历史面不回改」） |

#### K4 · 旧档名改指（① 真悬空 · 23）
| token | 实例（file:line） | 处置 |
|---|---|---|
| `ENGINEERING-MODE.md`（9） | docs/core/design/ARCHITECTURE.md:103 · CONFIG.md:68 · DOC-DISCIPLINE.md:264 · DOC-MIGRATION.md:304 · docs/core/requirements/ENGINEERING-MODE-V2.md:536 :551 · METHODOLOGY.md:105 · PORTABILITY.md:14 :80 | 现行句 ⇒ 改指 `ENGINEERING-MODE-V2.md`（设计侧 `docs/core/design/` ∥ 需求侧 `docs/core/requirements/`）；历史/迁移句（DOC-MIGRATION:304 · PORTABILITY:14/:80 · METHODOLOGY:105 · EM-V2:536/:551）⇒ 退场或加 `_archive/` 前缀 |
| `SPEC-MANIFEST.md`（6） | docs/core/design/MANIFEST.md:339 :355 :422 :424 :470 :622 | 改指 `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MANIFEST.md`（在盘） |
| `ENGINEERING-MODE-MECHANISM.md`（3） | DOC-DISCIPLINE.md:264 · requirements/ENGINEERING-MODE-V2.md:535 :594 | 改指 `docs/core/requirements/_archive/ENGINEERING-MODE-MECHANISM.md`（在盘）或退场 |
| `ENGINEERING-MODE-ISSUES.md`（2） | requirements/ENGINEERING-MODE-V2.md:504 :537 | 改指 `docs/core/requirements/_archive/ENGINEERING-MODE-ISSUES.md`（在盘） |
| `docs/core/design/ENGINEERING-MODE.md`（1） | docs/core/design/AGENT-LOOP.md:452 | 改指 `docs/core/design/_archive/ENGINEERING-MODE.md`（在盘） |
| `SPEC-LEDGER.md`（1） | docs/core/design/MANIFEST.md:356 | 改指 `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-LEDGER.md`（在盘） |
| `SPEC-MACHINE-CHECK.md`（1） | docs/core/design/MANIFEST.md:356 | 改指 `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MACHINE-CHECK.md`（在盘） |

#### K5 · tool-docs 前缀补齐（① 真悬空 · 37）
- 形态：目标档均在盘，token 缺 `thincoder-core/` 前缀（引擎解析序不含 `thincoder-core/tool-docs/`）⇒ **逐处加前缀**即可，零语义变更。
| token | 实例（file:line） |
|---|---|
| `bash.md`（8） | BASH-EXECUTOR-FACE.md:6 :14 ×2 :74 :76 :119 :143 · MODEL-BENCH.md:1835 |
| `tool-docs/manifest.md`（7） | DOC-DISCIPLINE.md:1050 · MANIFEST.md:238 :641 :677 :681 :779 · PROMPT-SYSTEM.md:319 |
| `tool-docs/batch.md`（3） | BATCH-RECORD.md:323 :326 :330 |
| `tool-docs/browser.md`（2） | BROWSER-TOOL.md:295 :441 |
| `tool-docs/subagent.md`（2） | requirements/ENGINEERING-MODE-V2.md:433 · desktop/design/PANEL-READBACK.md:46 |
| `tool-docs/question.md`（2） | requirements/PROMPT-SYSTEM.md:44 :47 |
| `tool-docs/bash.md`（1） | BASH-EXECUTOR-FACE.md:151 |
| `tool-docs/doc_check.md`（1） | DOC-DISCIPLINE.md:1072 |
| `tool-docs/edit.md`（1） | EDIT.md:86 |
| `tool-docs/memory.md`（1） | MEMORY.md:646 |
| `tool-docs/settings.md`（1） | SETTINGS-TOOL.md:126 |
| `tool-docs/ssh.md`（1） | TOOLS.md:1170 |
| `settings.md`（1） | MANIFEST.md:708 |
| `read_image.md`（1） | TOOLS.md:109 |
| `process.md`（1） | TOOLS.md:915 |
| `wait_for.md`（1） | TOOLS.md:915 |
| `question.md`（1） | requirements/AGENT-LOOP.md:49 |
| `grep.md`（1） | MODEL-BENCH.md:1835 |
| `git.md`（1） | MODEL-BENCH.md:1835 |

#### K6 · 迁移历史表（① 真悬空 · 40）
- 性质：全部是**一次性迁移/读数表**（迁移批的逐字节比对、路径对位、旧读数），对象或被迁走或已删 ⇒ **退场**（删旧路径列/整表；历史归 git）。
- `docs/core/design/TOOLS.md:30–49`（§2.1 逐字节同组表）**20 行**：`tools/apply_patch.md` · `tools/checklist.md` · `tools/delete.md` · `tools/edit.md` · `tools/execute.md` · `tools/fetch.md` · `tools/file_ops.md` · `tools/get_current_time.md` · `tools/git.md` · `tools/glob.md` · `tools/hashline_edit.md` · `tools/insert_after.md` · `tools/ls.md` · `tools/lsp.md` · `tools/process.md` · `tools/read.md` · `tools/read_image.md` · `tools/tree.md` · `tools/wait_for.md` · `tools/write.md`（各 1 处，按行序 30–49）
- `TOOLS.md:55–58`（同表余行）：`tools/question.md`（:55）· `tools/bash.md`（:56）· `tools/grep.md`（:57）· `tools/lint.md`（:58）
- `TOOLS.md:31` 同行 `thincoder-core/tool-docs/checklist.md`（目标档本身已不存在 ⇒ 只能退场）
- `TOOLS.md:61` / `:122` `tools/websearch.md`（同族迁移行）
- `TOOLS.md:1535` / `:1541` `tool-docs/checklist.md`（工具已废除；该段 = 废除记录）
- `docs/core/design/CORE-UNIFICATION.md:40` + `docs/core/requirements/CORE-UNIFICATION.md:72`：`bash.md` · `grep.md` · `lint.md` · `question.md` · `websearch.md`（各 2 处——旧 `src/tools/*.md` 读数表）
- `docs/core/design/DOC-DISCIPLINE.md:506` `checklist.md`（「少 1 档」记录）

#### K7 · VSC 迁移清单（② 迁移期/归档 · 28）
- 面 = `docs/vsc/design/VSC-MIGRATION-INVENTORY.md`（单档 28 行）。
- 性质：该档 = VSC 文档迁移清单；所列档全部已入 `thincoder-vscode/docs/_archive/`（`docs/README.md:29-31` 载 VSC 树退役闭合）。
- 处置（二择一，待裁）：**A** 整档退场（迁 `_archive/` 或删——迁移已闭合，清单属过程载体）；**B** 逐条改指 `thincoder-vscode/docs/_archive/design/<名>`（28 处）。
- 实例（行:token）：20:CAPABILITY_GAP.md · 20:COMPETITIVE_ANALYSIS.md · 36:A2-SUMMARY-PARITY.md · 37:ACTIVITY-REWRITE-SIMPLE.md · 38:ACTIVITY-SPLIT.md · 41:AGENT-PARAMS-TUNING.md · 44:ASYNC-RESULT-CONTAINER.md · 52:ENG-TOKEN-BINDING-TUNING.md · 53:ENGINEERING-MODE.md · 55:GIT-ASYNC.md · 57:IMAGE-DOWNGRADE-VISION.md · 65:QUEUED-VISIBILITY.md · 66:READ-HISTORY-SPLIT.md · 69:REMOVE-POOL-SNAPSHOT.md · 70:SEND-STALL-DISTILL-TUNING.md · 71:SESSION-ACTIVITY-REVISED.md · 72:SESSION-FLOW-A.md · 73:SESSION-FLOW-B.md · 74:SESSION-FLOW-C.md · 75:SESSION-RESTORE-PARITY.md · 78:SUBAGENT-OBSERVE-SEND.md · 80:TOOL-OUTPUT-LIMITS-TUNING.md · 83:VSC-PROMPTS.md · 94:ASYNC-RESULT-CONTAINER.md · 100:ENGINEERING-MODE.md · 100:ENGINEERING-MODE-MECHANISM.md · 117:SUBAGENT-OBSERVE-SEND.md · 123:VSC-PROMPTS.md

#### K8 · 示例/非引用（④ 差额 · 59）
- 性质：格式示意（`X.md` / `x.md` / `a.md` / `docs/batches/x.md`…）、uid/扩展名示例（`file.md` / `out.md`）、黑名单名（`changelog.md`）、截断示意（`-release.md` / `-v2.md`）——**均非引用**。
- 处置（与 K2 同族裁定，见 §2.7 上抛 ③）：**A** 引擎占位豁免（产品码；旧引擎 `PLACEHOLDERS` 先例）；**B** 示例移入围栏块（围栏内整块免——零产品码，逐处改文）；**C** `checkConfig.exemptions` 按名加（行级，副作用同 K2-B）。
- 实例：`X.md`（20）docs/core/design/DOC-DISCIPLINE.md:88 :100 :101 :114 :1188 · DOC-MIGRATION.md:545 ×2 :565 ×3 · DOC-SYSTEM.md:198 ×4 :201 :204 ×2 :213 ×2 · LEDGER-SELF-CONTAINED.md:99 ｜ `requirements/X.md`（5）DOC-MIGRATION.md:413 :565 ×2 · DOC-SYSTEM.md:191 :213 ｜ `design/X.md`（4）DOC-MIGRATION.md:413 :565 · DOC-SYSTEM.md:191 :213 ｜ `x.md`（3）DOC-DISCIPLINE.md:1148 · LEDGER.md:803 · MEMORY.md:822 ｜ `docs/batches/X.md`（2）DOC-DISCIPLINE.md:1383 :1553 ｜ `file.md`（2）MEMORY.md:118 ×2 ｜ `docs/batches/x.md`（2）MEMORY.md:687 :707 ｜ `thincoder/docs/batches/x.md`（2）MEMORY.md:687 :707 ｜ `a/docs/batches/b.md`（2）MEMORY.md:687 :707 ｜ `docs/batchesx/x.md`（2）MEMORY.md:688 :708 ｜ `docs/batch/x.md`（2）MEMORY.md:688 :708 ｜ `doc/batches/x.md`（2）MEMORY.md:688 :708 ｜ `docsX/batches/x.md`（2）MEMORY.md:688 :708 ｜ `batches/x.md`（2）MEMORY.md:688 :708 ｜ `repo/docs/batches/x.md`（1）requirements/MEMORY.md:288 ｜ `docs/a.md`（1）docs/cli/design/ACP-PROTOCOL-COMPLIANCE.md:124 ｜ `-release.md`（1）docs/RELEASE.md:175 ｜ `-v2.md`（1）AGENT-LOOP-SUBAGENT.md:605 ｜ `changelog.md`（1）MANIFEST.md:754（黑名单名）｜ `a.md`（1）MEMORY.md:428 ｜ `out.md`（1）MEMORY.md:567

#### K9 · 历史残句退场（① 真悬空 · 14）
| file:line | token | 处置 |
|---|---|---|
| docs/README.md:42 | `batches/2026-09-13-CORE-UNIFICATION.md` | 退场：删批档坐标保结论（状态档不引过程档；批档可删） |
| docs/TEST-ENV-ECS.md:144 | `batches/2026-10-09-server-test-env-ecs.md` | 同上（删「批档 §1」指针） |
| docs/core/design/AGENT-LOOP-SUBAGENT.md:566 | `WEBVIEW-TOOLTABLE.md` | 改写形态：决策「不另建档」保留，去掉不存在的档名 |
| docs/core/design/CONSULTATION.md:42 | `DUAL-END-TRUNCATION.md` | 退场（读数差异注释里的旧指针） |
| docs/core/design/CORE-UNIFICATION.md:832 | `thincoder-cli/src/tools/question.md` · `thincoder-vscode/src/tools/question.md` | 退场（旧 `src/tools/*.md` 对位句）；若保留 ⇒ 改指 `thincoder-core/tool-docs/question.md` |
| docs/core/design/DOC-MIGRATION.md:266 | `CAPABILITY_GAP.md` · `COMPETITIVE_ANALYSIS.md` | 改指 `thincoder-vscode/docs/_archive/CAPABILITY_GAP.md` ∥ `…/COMPETITIVE_ANALYSIS.md`（均在盘） |
| docs/core/design/DOC-MIGRATION.md:280 | `batches/2026-09-13-TWO-REPO-MERGE.md` | 退场（phase-1 三档处置记录；批档坐标删） |
| docs/core/design/PORTABILITY.md:225 | `methodology-template.md` | 退场（历史 bug 记录——该行是「已不存在」陈述） |
| docs/core/requirements/TESTING.md:214 | `2026-10-16-uat-rtm.md` | 退场（删批档坐标保结论） |
| docs/server/design/sandbox/EXECUTION.md:296 | `sandbox/RUNNER.md` | 退场（「档头死指针收正」的过程记录——删残句） |
| docs/core/requirements/ENGINEERING-MODE-V2-SPEC-CHECKLIST-REMOVAL.md:18 | `.thincoder/checklist.md` | 改写形态：「checklist 约定废除」保留，去掉不存在的档名 |
| docs/core/requirements/ENGINEERING-MODE-V2.md:505 | `.thincoder/checklist.md` | 同上 |

#### K10 · 节缺（① 真悬空 · 16）
- 性质：15 行 = `DOC-DISCIPLINE.md` 内「旧指针 → 新指针」改指表（旧编号 `AGENT-LOOP.md §7.2 / §19 / §19.5 / §19.6 / §11.2` 已迁 `AGENT-LOOP-SUBAGENT.md §6.7.x`，该表自己写明）；1 行 = `TUI.md §7.5` 同名误解析（引用方目录先命中 `requirements/TUI.md`，目标实为 `design/TUI.md`）。
- 处置：
  - `DOC-DISCIPLINE.md:378 :389 :390 :391 :392 :393 :394 :395 :401 :1606 :1746` ⇒ **退场**（删旧指针列/整表——改指记录属过程面）；
  - `AGENT-LOOP-SUBAGENT.md:350 :410` ⇒ 退场（「不照抄旧编号」句——旧编号去掉，保留结论）；
  - `docs/cli/requirements/TUI.md:36` `TUI.md §7.5` ⇒ **改指** `docs/cli/design/TUI.md §7.5`（全路径消同名歧义）。

#### K11 · 计划件/格式示例（③ 拟新增/计划件 · 13）
| token（实例） | 性质 | 处置 |
|---|---|---|
| `RTM.md`（TESTING.md:440 :595 · requirements/TESTING.md:219）· `test/RTM.md`（TESTING.md:423）· `thincoder-cli/test/RTM.md`（TESTING.md:439）· `UAT-RTM.md`（requirements/TESTING.md:219） | 目标态交付物（F29 要求「RTM 存在且随交付」——尚未落盘） | 改写形态：标「目标态」并把档名写成不带 `.md` 的指称；或另批真建 RTM（二择一） |
| `PROJECT-REQUIREMENTS.md` · `spec-user-mgmt.md` · `design-user-mgmt.md` · `2026-09-17-engine-mode-v2-arch.md` · `daily-2026-09-17.md` · `test-report-m1.md` · `deliverables.md`（requirements/ENGINEERING-MODE-V2.md:223 :225 :226 :227 :229 :230 :232） | 命名规则表的「例子」列（示例值，不是引用） | 改写形态：例子列只留占位形（`spec-<模块名>.md`），具体示例名去掉或移入围栏块 |

#### K12 · 裸载体名（① 真悬空 · 12）
- 可改指（8 处，加产品前缀）：`docs/RELEASE.md:317 :366`（三端 CHANGELOG）· `docs/core/design/CONFIG.md:65` · `I18N.md:36` · `MEMORY.md:62` · `TWO-REPO-MERGE.md:57` · `docs/desktop/design/PACKAGING.md:314 :395` · `docs/server/design/mcp/MCP.md:78` ⇒ `thincoder-cli/CHANGELOG.md` ∥ `thincoder-core/CHANGELOG.md` ∥ `thincoder-desktop/CHANGELOG.md` ∥ `thincoder-vscode/CHANGELOG.md`（按句义择一）。
- 非引用（3 处）：`docs/core/design/MANIFEST.md:821`（测试夹具值）· `docs/core/design/DOC-MIGRATION.md:253`（`package.json` `files` 字面量）· `docs/core/design/AGENT-LOOP-SUBAGENT.md:147`（父侧维护文件黑名单名）⇒ 归 ④ 形态（随 K8 裁定）。

### §2.4 超宽行分诊（引擎判据下 92 行）
- 口径：`lineWidth=300` · 豁免五类（表格行 ∥ 围栏块 ∥ 可执行行 ∥ 连续引文 ∥ 区带）——`thincoder-core/doc-check/width.mjs:101-131`。
- **三分类实数**：**真需折行 92** ∥ **表格行（豁免）1259** ∥ **代码块/围栏内（豁免）0**。
  - 92 = 引擎判据命中（全部为非表格、非围栏正文行）；1259 = 原始 >300 行中「表格行」数（引擎已豁免、不在 92 内）；另：引用行 2 · 可执行行 11（同样豁免、不在 92 内）。原始 >300 行合计 1364。
- **92 行分布**：`docs/TODO-archive.md` 46 + `docs/TODO.md` 16（**62 行随 K1 档级裁定一次性消**）；活档 30 行（下表逐行）。
- 活档 30 行（`file:line`（字符数）· 行首摘要）：
  - `docs/core/design/CONTEXT-COMPACTION.md:57`（329）阈值链句 · `:115`（537）DeepSeek 兜底接法 · `:116`（390）高风险档清单
  - `docs/core/design/DOC-DISCIPLINE.md:966`（361）两级同源先例句 · `:1338`（315）判据真形式句
  - `docs/core/design/PROMPT-SYSTEM.md:571`（302）键面 · `:681`（317）判点同址 · `:699`（341）热应用 · `:710`（364）VSC 三处穿透 · `:712`（336）settings 面 · `:774`（303）落点句
  - `docs/core/design/prompts/common.md:47`（307）修订式表达禁令 · `:183`（309）可清理性
  - `docs/core/design/prompts/persona-engineering.md:84`（344）看门狗 note · `:98`（486）收口扫账
  - `docs/core/requirements/TOOLS.md:199`（321）凭据托管 A+B
  - `docs/desktop/design/PROJECT.md:195`（307）桌面阶段一不做 · `docs/desktop/design/SETTINGS.md:391`（313）批注归位 · `:398`（824）VSC 对位 · `:416`（491）判据段
  - `docs/server/design/accounts/ACCOUNTS.md:76`（347）建盒步级失败 · `docs/server/design/agent/MEMBER-AGENT.md:138`（566）掉线判定
  - `docs/server/design/sandbox/EXECUTION.md:109`（360）读件 · `:126`（695）留痕 · `:127`（437）卸除件
  - `docs/server/design/sandbox/SANDBOX.md:92`（316）tail 有界 · `docs/server/design/webui/SANDBOX.md:16`（447）添加节点弹窗
  - `docs/vsc/design/SETTINGS.md:38`（318）写入链 · `:45`（373）注入开关三键 · `:47`（306）控件
- 退役两档 62 行（若走 K1-A/B 即消；若保留则须逐行折行）：
  - `docs/TODO-archive.md`：23(312) · 25(325) · 32(362) · 35(371) · 37(663) · 38(586) · 60(326) · 65(366) · 171(337) · 172(320) · 173(308) · 175(490) · 177(613) · 178(625) · 190(305) · 211(334) · 222(307) · 237(346) · 239(351) · 245(459) · 251(325) · 253(323) · 255(599) · 257(448) · 258(479) · 260(356) · 263(523) · 265(402) · 268(466) · 269(504) · 270(389) · 271(466) · 272(436) · 273(333) · 274(642) · 276(624) · 277(760) · 279(586) · 281(349) · 282(406) · 283(397) · 286(339) · 290(372) · 291(452) · 293(308) · 311(718)
  - `docs/TODO.md`：13(481) · 15(838) · 18(484) · 20(576) · 22(606) · 23(498) · 24(1011) · 25(706) · 26(602) · 27(436) · 28(480) · 35(497) · 38(395) · 46(1715) · 51(515) · 53(320)

### §2.5 簇表与可执行顺序（任务 4）
| 簇 | 条数 | 涉及档 | 为什么能一起做 |
|---|---|---|---|
| K1 TODO 退役两档 | 91 锚 + 62 宽 | 2 档（TODO.md ∥ TODO-archive.md） | 档级一条裁定（manifest 排除 ∥ 删档）⇒ 全消 |
| K2 操作数名族 | 96 | 34 档 | 六名同形态（运行期操作数）；一条豁免裁定覆盖 |
| K3 归档树引用 | 1 | 1 档 | 单点改指 |
| K4 旧档名 | 23 | 9 档 | 全部「旧名 → 在盘现名」一对一映射，机械替换 |
| K5 tool-docs 前缀 | 37 | 15 档 | 同一形态：加 `thincoder-core/` 前缀；目标全部在盘 |
| K6 迁移历史表 | 40 | 4 档 | 全部是同一类历史表（迁移对位/旧读数）⇒ 同一条「退场」处置 |
| K7 VSC 迁移清单 | 28 | 1 档 | 单档整档去留（裁定） |
| K8 示例/非引用 | 59 | 14 档 | 同一占位族；一条豁免裁定（或示例入栏） |
| K9 历史残句 | 14 | 12 档 | 同一形态：删残句/改指；逐条独立、可并批 |
| K10 节缺 | 16 | 3 档 | 15 行同表（旧指针列）+ 1 行改指 |
| K11 计划件/示例 | 13 | 3 档 | 同一形态：目标态/命名示例改写 |
| K12 裸载体名 | 12（改指 9 + 非引用 3） | 10 档 | 同一形态：加产品前缀（3 处随 K8 裁定） |
| W1 活档超宽 | 30 行 | 14 档 | 纯折行（结构不动）；按档一次改完 |
- **建议执行顺序**：
  1. **先裁四条**（K1 ∥ K2 ∥ K7 ∥ K8）——解锁 **274 锚（63.7%）+ 62 宽行**；不先裁就落笔，改法可能被推翻。
  2. **机械改指批**（K3 1 + K4 23 + K5 37 + K10-TUI 1 + K12 9 = **71**）——零语义变更、token→在盘目标，可两轮闭。
  3. **退场批**（K6 40 + K9 14 + K10 15 + K12 3 = **72**）——删历史残句/旧指针列；同一条「过程不进状态档」判据。
  4. **计划件改写批**（K11 13）——目标态/示例形改写。
  5. **折行批**（W1 30 行，按档聚合；`PROMPT-SYSTEM` 6 行 ∥ `CONTEXT-COMPACTION` 3 ∥ desktop `SETTINGS` 3 ∥ `EXECUTION` 3 ∥ vsc `SETTINGS` 3 ∥ `DOC-DISCIPLINE` 2 ∥ prompts 4 ∥ 其余 6）。
  6. **复跑**：同 §2.1 入口复读 ⇒ 目标「锚 0 · 行宽 0」（或裁定豁免后的残余，须在批档写明口径）。

### §2.6 验收对照（对派单 ①–⑤）
| # | 验收项 | 落点 |
|---|---|---|
| ① | 两个实数读数 + 工具/参数原文 | §2.1（522 = 锚 430 ∥ 行宽 92；入口 `runDocCheck("d:/teamcode/thincoder")`） |
| ② | 三类之和 ≈ 悬空总数，差额解释 | §2.2（①143 + ②215 + ③13 = 371；④ 示例/非引用 59 = 差额；合计 430 = 锚总数） |
| ③ | 超宽行三分类 | §2.4（92 真需折行 ∥ 1259 表格行豁免 ∥ 0 围栏内；原始 >300 = 1364） |
| ④ | 簇表 + 执行顺序 | §2.5（12 簇 + W1；六步顺序） |
| ⑤ | 交付表 | 交付报告（本档外——按派单格式；本档 §2 不重复） |

### §2.7 关键决策 / 边界 / 上抛 / 发现
**关键决策**
- KD1 读数面 = 产品内建引擎（`thincoder-core/doc-check/*`），非被禁脚本；读数只作**枚举**，不作门禁判据。
- KD2 分类 = 派单三类 + 残差「示例/非引用」（差额 59 明列，不塞进三类）。
- KD3 处置粒度 = token 组级（同 token 同处置），实例逐行列出——下一轮可按 token 机械执行。
- KD4 本轮零改动（文档 ∥ 产品码 ∥ scripts ∥ manifest ∥ 台账全零触）。

**边界（不做）**
- 不改任何 `docs/**` 档（含本批清单上的档）；不改产品码 / `scripts/**` / manifest；不跑 `node scripts/doc-check.mjs`；不动台账行。
- 不替父侧/用户裁「退役档去留 ∥ 操作数豁免 ∥ 示例豁免 ∥ 迁移表去留」四类语义问题（见上抛）。

**上抛·待裁**
1. **K1**：`TODO.md` / `TODO-archive.md` 退役面——A 入 `checkConfig.anchors.exclude`（零代码）∥ B 删档（破坏性）。
2. **K2**：操作数名豁免——A 引擎豁免（产品码）∥ B `checkConfig.exemptions` 行级 ∥ C 文档改写。
3. **K8**：示例形豁免——A 引擎占位豁免（旧引擎 `PLACEHOLDERS` 先例，`scripts/doc-check-anchors.mjs:44`）∥ B 示例入栏 ∥ C `exemptions`。
4. **K7**：`VSC-MIGRATION-INVENTORY.md` 整档去留——A 退场 ∥ B 逐条改指 `_archive/`。
5. **K6**：`TOOLS.md` §2.1 迁移表去留——A 退场（历史归 git）∥ B 保留但补前缀（与 K5 同法）。
6. **读数口径**：12:10 令「不再引其读数 / 不以红绿作判据」与本批「报两个实数」并存——本席按**枚举读数**执行；下一轮复跑是否可作验收判据，请父侧裁（建议：复跑只作清账进度读数，门禁口径另议）。

**发现（逐条上报）**
1. **文档声明 vs 引擎行为相抵**：`docs/README.md:14` 称 `TODO.md` / `TODO-archive.md`「无机械校验」，产品引擎仍扫（K1 = 153/522 命中）。
2. **引擎无操作数豁免**：产品协议把 `AGENTS.md` / `SKILL.md` / `README.md` / `MANIFEST.md` / `.thincoder/advisor.md` / `project_rules.md` 列为操作数族，引擎无对应判据（K2 = 96）。
3. **引擎无占位豁免**：旧引擎有 `PLACEHOLDERS`（`scripts/doc-check-anchors.mjs:44`），产品引擎无（K8 = 59）。
4. **basename 索引只覆盖 `docs/`**（`thincoder-core/doc-check/anchors.mjs:66-71`）⇒ 产品 `AGENTS.md` 三档在盘仍判档缺（K2 的 4 处）。
5. **节缺解析序**：同名档按「引用方目录」先命中（`anchors.mjs:49-51`）⇒ `TUI.md §7.5` 误指 `requirements/TUI.md`（真实目标 = `design/TUI.md`）。
6. **计数收正（本节自校）**：K12 拆分 = 改指 9 + 非引用 3（合计 12）；K10 = 退场 15 + 改指 1（合计 16）。
7. **本档 §1 仍是模板占位**（主 agent 笔未填）——本批任务依据 = 父侧派单正文 + 台账 #1627。
8. **工作树漂移**：71 档 M + 17 档未跟踪（多批并行）——本轮读数 as-of 2026-10-17 23:4x，复跑须重取。

## 批次任务与设计（§2 · eng-designer）

**任务书依据** = 本批 §1（用户六条裁决 + 十二条钉点 + 折行一条）。**变更面** = `docs/**` 活文档面（含删 `docs/vsc/design/VSC-MIGRATION-INVENTORY.md`）。
**零触面**（明确不在本批）：`thincoder-core/**`（K2 操作数名 / K8 示例形 = 引擎侧修，台账 #1633）· `PROJECT-MANIFEST.json`（K1 排除声明 = 主 agent 笔）· `docs/batches/**`（冻结过程档，引用不回改）。

### 1. 条目表（一簇一行 · 判据 = 机检形）

| # | 条目 | 判据（机检形） | 本批处置 |
|---|---|---|---|
| K1 | TODO 两档不进锚检查 | `checkConfig.anchors.exclude` 含两档名；锚命中 −91 | **零文档改动**（排除声明 = 主 agent 笔）；`docs/README.md:14` 声明收正为「已排除在锚检查之外——排除项 = `PROJECT-MANIFEST.json` 的 `checkConfig.anchors.exclude`」 |
| K2 | 操作数名（`AGENTS.md` / `SKILL.md` / `project_rules.md` / `.thincoder/advisor.md` …） | 引擎侧判据收窄 | **已裁：不改文档，引擎侧修**（#1633） |
| K8 | 示例形（`X.md` / `x.md` / `docs/batches/x.md` / `-release.md` …） | 引擎侧排除示例形 | **已裁：不改文档，引擎侧修**（#1633） |
| K3/K4/K5/K10/K12 | 活档改指在盘现名 | 命中归零（除 K12 非引用面） | 已落（见 §2.2） |
| K6 | 旧 `src/tools/*.md` 名退场 | 旧名零命中 | 已落 |
| K7 | `VSC-MIGRATION-INVENTORY.md` 整档退场 | 档不在盘；活文档面零引用 | 已落（删档 + 7 处收引用） |
| K9 | 过程档 / 已不存在对象引用退场 | 活文档面零命中 | 已落 |
| K11 | 命名规则表例子面去具体档名 | 例子列零 `.md` 实档名（拟形保留） | 已落 |
| W1 | 活档超宽行折行（零语义） | `widthHits` 活档 = 0 | 已落（29 行） |

### 2. 逐簇处置（动作 → 落点）

**K5 工具描述档前缀（`thincoder-core/tool-docs/<名>.md`）**：`TOOLS.md:52-58`（四行路径 + read_image/websearch/ssh/process/wait_for）· `BASH-EXECUTOR-FACE.md` 9 处 · `MODEL-BENCH.md:1835` 3 处 · `MANIFEST.md`（`manifest.md` ×11 · `settings.md` ×1）· `BATCH-RECORD.md` ×3 · `BROWSER-TOOL.md` ×2 · `PANEL-READBACK.md:46` · `EDIT.md:86` · `MEMORY.md:646` · `SETTINGS-TOOL.md:126` · `PROMPT-SYSTEM.md:319` · `requirements/AGENT-LOOP.md:49` · `requirements/PROMPT-SYSTEM.md:44/:47` · `requirements/ENGINEERING-MODE-V2.md:433`。

**K3/K4 归档改指**：`AGENT-LOOP.md:452` → `docs/core/design/_archive/ENGINEERING-MODE.md`；`ARCHITECTURE.md:103` → `thincoder-vscode/docs/_archive/design/ENGINEERING-MODE.md`（另两档同前缀补齐）；`CONFIG.md:68` → `docs/core/design/ENGINEERING-MODE-V2.md`；`requirements/METHODOLOGY.md:105` → `docs/core/requirements/ENGINEERING-MODE-V2.md`；`requirements/PORTABILITY.md` ×2 → `docs/core/requirements/_archive/ENGINEERING-MODE.md`；`requirements/ENGINEERING-MODE-V2.md:535-537/:551` → 三档 `docs/core/requirements/_archive/` 前缀（`:504` 同）。

**K6 旧描述档名退场**：`design/CORE-UNIFICATION.md:40` 与 `requirements/CORE-UNIFICATION.md:72` 的 5 档分叉名删（保留计数 25/20/5）；`design/CORE-UNIFICATION.md:832` 两条旧 `src/tools/question.md` 对位句删（保留「CLI 值 = 核内 `:11` ∥ VSC 值 = 面板版」结论）；`MANIFEST.md` 的 `SPEC-*.md` 三个裸名 → `ENGINEERING-MODE-V2-SPEC-*`（唯一索引可解析）。

**K7 整档退场**：删 `docs/vsc/design/VSC-MIGRATION-INVENTORY.md`（275 行）；收引用 7 处 —— `README.md:72`（vsc 11 → 10 档、design 8 → 7）· `ANCHOR-DEBT-REPAIR.md:106`（档级行删）· `:285`（E1 括注去名）· `requirements/PORTABILITY.md:5`（指针句删、状态句「VSC 镜像面待并」保留）· `VSC-MIGRATION.md:55`（受影响文件格去名——计数 6 与剩余 6 项对齐）· `:56`（`INVENTORY §8B` 两处改「清单面已收口」）· `DOC-MIGRATION.md:313`（坐标串删）。

**K9 过程档 / 不存在档引用退场**：`README.md:42`（批档坐标删、裁定原话留）· `TEST-ENV-ECS.md:144`（批档坐标 → 「见该次部署执行记录」）· `AGENT-LOOP-SUBAGENT.md:566`（`WEBVIEW-TOOLTABLE.md` 名删、决策留）· `CONSULTATION.md:42`（档名删）· `DOC-MIGRATION.md:266`（两档改 `thincoder-vscode/docs/_archive/` 全路径）· `:280`（批档名删）· `:304`（两档示例名删）· `design/PORTABILITY.md:225`（`methodology-template.md` → 方法论模板）· `requirements/TESTING.md:214`（批档坐标删）· `EXECUTION.md:296`（`RUNNER.md` 残句删）· `SPEC-CHECKLIST-REMOVAL.md:18`（`.thincoder/checklist.md` → 「checklist 约定（项目内 md 清单档形态）」）。

**K10 旧编号退场**：`DOC-DISCIPLINE.md:1611`（三串旧编号 → 「档名 + 已废弃节号三串」）· `:1751`（DD-34 夹具描述同法）· `AGENT-LOOP-SUBAGENT.md:350`（旧编号字面删、结论留）· `:410`（同法）· `cli/requirements/TUI.md:36`（`TUI.md §7.5` → `docs/cli/design/TUI.md` §7.5——节点实读在盘 `### 7.5`）。

**K12 `CHANGELOG.md` 裸名 → 产品前缀**：`CONFIG.md:65` · `I18N.md:36` · `MEMORY.md:62` · `TWO-REPO-MERGE.md:57`（行标签改「各产品 `CHANGELOG`」+ 双路径注）· `RELEASE.md:317/:366`（三端逐路径；`:366` 折行）· `PACKAGING.md:314/:395`（`thincoder-desktop/`）· `server/design/mcp/MCP.md:78`（`thincoder-core/`）。

**K11 命名规则表例子列**：`requirements/ENGINEERING-MODE-V2.md:223-232` 例子列改「代入值形」（`模块名代入 user-mgmt` / `日期 2026-09-17 · 主题 engine-mode-v2-arch` / `里程碑 m1`）；固定名行改「固定名 + `.md` 扩展名」；`design/TESTING.md:423/:439-440/:595` 与 `requirements/TESTING.md:219` 的 `RTM.md` / `UAT-RTM.md` → 「RTM 总表（拟）」。

**W1 折行（零语义）29 行**：`RELEASE.md:366`（本批新增超宽，折 3 行）· `CONTEXT-COMPACTION.md:57/:115/:116` · `PROMPT-SYSTEM.md:572/:682/:700/:711/:713/:775` · `prompts/common.md:47/:188` · `prompts/persona-engineering.md:84/:98` · `requirements/TOOLS.md:199` · `desktop/PROJECT.md:195` · `desktop/SETTINGS.md:391/:398/:400/:416` · `ACCOUNTS.md:76` · `MEMBER-AGENT.md:138` · `EXECUTION.md:109/:126/:127` · `sandbox/SANDBOX.md:92` · `webui/SANDBOX.md:16` · `vsc/SETTINGS.md:38/:45/:47`。含表格行与围栏行零触；折点均在句界 / 分句界。

### 3. 读数对比（`runDocCheck("d:/teamcode/thincoder")` 实跑）

| 指标 | 基线 | 交付 | 目标 | 判定 |
|---|---|---|---|---|
| 锚命中 | 430 | **249** | 249 | ✅ 达标 |
| 宽超限 | 92 | **62** | 62 | ✅ 达标（活档 0） |
| 检查档数 | 214 | **213** | 213（−1 删档） | ✅ |

**锚残余 249 构成**（逐 token 实测）：`TODO.md` ∥ `TODO-archive.md` **91**（K1，待 manifest）· 操作数名 **93**（`AGENTS.md` 69 ∥ `project_rules.md` 12 ∥ `SKILL.md` 6 ∥ `.thincoder/advisor.md` 5 ∥ `CLAUDE.md` 1 = K2）· 示例形 **61**（`X.md` 系 / `docs/batches/x.md` 系 / `-release.md` / `-v2.md` / `agent.md` 等 = K8）· 非引用面 **4**（`CHANGELOG.md` / `changelog.md` 的路径式或名面非全等写法 = K12 射程外）。
**宽残余 62** = `docs/TODO.md` 16 行 + `docs/TODO-archive.md` 46 行——K1 manifest 排除落地后归零。

### 4. 验收标准（回指条目）

- **AC-1（K1–K12 总量）**：`runDocCheck` 锚命中 = 249（±0）；机检命令 = 仓内引擎实跑。
- **AC-2（W1）**：`widthHits` 中非 `docs/TODO*` 档 = **0**；总宽 = 62。
- **AC-3（K7）**：`git grep VSC-MIGRATION-INVENTORY -- docs ':!docs/batches'` = 零命中（实测零）；档不在盘。
- **AC-4（K3–K6 / K9–K12）**：上列逐簇旧 token 零命中——除 K12 的 4 处非引用面（射程外，已在残余构成单列）。
- **AC-5（零语义）**：折行只切断句界、不增删一字符（逐行 diff 可核）；无正文改写。

### 5. 边界（不在本批）

- 不动 `thincoder-core/**`（K2 / K8 的引擎侧判据修 = #1633）。
- 不动 `PROJECT-MANIFEST.json`（K1 排除声明 = 主 agent 笔）。
- 不回改 `docs/batches/**`（冻结过程档；批档内对已删档的引用按冻结口径保留）。
- 不展开 `README.md:17` 的历史计数链（D8 污染面，本批只做删档连带处 `:72`）——已登记 §2.6。

### 6. 存疑清单（上抛父侧）

1. **[上抛·知会] `docs/README.md:14` 的「已排除」是**以 manifest 同轮落地为前提**的声明**：本刻实读 `PROJECT-MANIFEST.json` 的 `checkConfig.anchors.exclude` = `["_archive","batches"]`，**尚无** `TODO.md` / `TODO-archive.md` ⇒ 91 命中仍在。主 agent 若不落该键，此句即不实。
2. **[上抛·知会] `docs/README.md:17` 的历史计数链**（「53 档（… vsc/ 11 = design 8 …）」⇒ 82 档）为 as-of 读数链（D8 级污染面）。删档后 vsc 实为 10 档（design 7）。本批只改活登记 `:72`，未改 `:17`——因改写会把带日期读数改成假历史。整块是否清退 = 另裁。
3. **[上抛·知会] `requirements/PORTABILITY.md:5` 保留「VSC 镜像面待并」状态句、删指针**：该待办的明细清单随 `VSC-MIGRATION-INVENTORY.md` 退场而失锚。若该待办仍活，需主 agent 落台账行；若已随之关闭，请明示。
4. **[上抛·知会] K6 在 `TOOLS.md:52-58` 的处置偏离**：裁决字面为「删旧路径列」，实际按「改指在盘现名」处置（四行 `src/tools/<名>.md` → `thincoder-core/tool-docs/<名>.md`）：该四行是「描述档加载面」活体断言，整行删会丢机制事实；且其中 `tool-docs` 现名与旧名同 basename，改指即达成「旧路径零命中」。`TOOLS.md` §9（checklist 废除段）保留废除以记录，仍含 `tools/checklist.mjs` 等非 `.md` 名——非本批射程。

**指针口径（本节内互指）**：「§2.2」= 第 2 节（逐簇处置）·「§2.6」= 第 6 节（存疑清单）。

**轮次口径（补充声明）**
- 本附加段 = **第二轮（落改轮）** 记录；上文 §2.0–§2.7 = **第一轮（分诊轮）** 记录。§2.0 的「只分诊，不落改」= 分诊轮的范围陈述，不辖本轮。
- 本附加段内互指只在段内成立：**「§2.2」= 本附加段第 2 节**（逐簇处置）· **「§2.6」= 本附加段第 6 节**（存疑清单）——与上文 §2.2（三类分诊总账）/ §2.6（验收对照）不同号。
- 计数对账（分诊轮 → 落改轮实测）：W1「30 行」→ 落改轮开工实测 **29 行**（`DOC-DISCIPLINE.md:966/:1338` 两行在分诊轮之后的先期折行中已折），折后新增 1 行超宽（`desktop/design/SETTINGS.md:400`）二次折 ⇒ 触达 30 行、交付活档 0；K12「非引用 3」→ 实测 **4**（多出 `MANIFEST.md:754` 的小写 `changelog.md`，形态属 K8 示例族）。锚总数不受影响（249 已逐 token 对账）。

## §3 设计评审（评审子代理）
## §4 用户批准（主 agent）

**状态行**：已批准 2026-10-17（补记——原轮授权已发生，本条为落档）

**批准范围**：清文档机检存量红（12 簇）——父侧六裁准入（K1 排除面 ∥ K2/K8 改引擎 ∥ K3–K5/K10/K12 改指退场 ∥ K6 整段退场 ∥ K7 删档 ∥ 复跑读数只作一次性验收）。原始授权原话已载 §1。

## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）

**验证与收口（父侧 · 2026-10-17 23:5x）**

**父侧亲跑读数（`runDocCheck("d:/teamcode/thincoder")`，manifest 排除面落地之后）**：

| 指标 | 基线 | `#106` 交付 | 父侧补 manifest 后 |
|---|---|---|---|
| 锚命中 | 430 | 249 | **158** |
| 超宽 | 92 | 62（活档 0） | **0** |
| 扫档数 | 214 | 213 | **211** |

**父侧笔**：`PROJECT-MANIFEST.json` → `checkConfig.anchors = {domain:"docs", exclude:["_archive","batches","TODO.md","TODO-archive.md"]}`（`anchors` 子树整写；`TODO.md` ∥ `TODO-archive.md` 入排除面）。⇒ `docs/README.md:14` 的「已排除在锚检查之外」**现在是真陈述**（此前是假陈述——它上抛第 1 条抓得对）。

**残余 158 的构成（全为引擎侧假阳，归 `#1633`）**：操作数名 `AGENTS.md` 族 93 ∥ 示例形 `X.md` 族 61 ∥ 非引用 4。**文档面已无可修项。**

**上抛 6 条处置**

| # | 处置 |
|---|---|
| 1 README:14 声明未成立 | **已落**（见上）；父侧亲跑证明 |
| 2 `README.md:17` 历史计数链 | **判为 D8 污染**（as-of 读数链：「53 ⇒ 76 ⇒ 79 ⇒ 80 ⇒ 81 ⇒ 82」，整行约 3000 字）。清退需重写整行 → 立项 `#1636` |
| 3 `requirements/PORTABILITY.md:5`「VSC 镜像面待并」失锚 | 立项 `#1637`（待办是否仍活着由用户裁） |
| 4 K6 按「改指」而非「删列」偏离裁决字面 | **父侧接受**：四行是描述档加载面的活体断言，整行删会丢机制事实；改指已达成「旧路径零命中」的裁决目的。偏离已披露，理由成立 |
| 5 计数对账（30→29 + 折后 1；K12 3→4） | 接受（实测为准，已在 §2 记明） |
| 6 `DOC-MIGRATION.md:266` 源列形态不一 | **裁：统一裸名**（该表其余行皆裸名；表头补一句「源列裸名，根 = `thincoder-vscode/docs`」）。归 `#1627` 收口轮小笔 |
| 7 `TOOLS.md` §9 checklist 作废记录 | 射程外，登记不动作（非 `.md` 名，不属锚检查面） |

**独立评审缺口（如实记）**：本批 52 档改动**未经独立评审轮**（父侧以「逐簇处置表 + 复跑读数 + 抽样实读」为验收依据）。同类批后续须把评审对象声明钉到本批 diff。

**收口**：本档冻结。
