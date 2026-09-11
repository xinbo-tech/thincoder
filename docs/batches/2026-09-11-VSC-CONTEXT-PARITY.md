# VSC 会话对齐 CLI（提示词装配 + 注入面 + 顺序）· 批次记录（2026-09-11）

> 搬迁注记：本档自 CLI 仓 `thincoder/docs/batches/2026-09-11-VSC-CONTEXT-PARITY.md` 迁入本仓 `docs/batches/`（LEDGER-SELF-CONTAINED 批——实施面全在本仓的批档物理迁移，档名不变、文字逐字；源档 blob SHA = b17444f556e7 · 源提交 = cfcc621）。

> 六段 append-only，一段一作者。编制：主 agent · 2026-09-11 23:10 · 来源 = 用户 22:54「VSC 端会话体验与 CLI 差距巨大——提示词系统和注入信息面出现巨大差异，挖差异并修正使行为与 CLI 一致」+ 23:02 三条裁定。

---

## §1 讨论（主 agent 记）

### 状态

**已收口 2026-09-11**（用户三裁定落定）。下一步 = **设计**（spawn eng-designer）。

> **跨批协调（2026-09-11 23:24——父侧补记，用户追问后修正）**：本批 R3（语料修复：VSC `discipline-normal` 补两节 + 修压平 · `discipline-engineering` 补 3 条子句 · `persona-engineering` 并行节去重）/R4（工具描述）与并行批 `2026-09-11-TEST-DISCIPLINE-PROMPTS`（T1–T7 机制纪律落地）**实施域重叠**——VSC 提示词三档 + CN 镜像两批都改。
> **实施序 = 本批先、该批后**（先修语料基线，再叠新条款）；后落者**落笔前读现态**；两链 coder spawn 均声明共享 files 域、交调度器串行（不手工排队）。

### 用户裁定（2026-09-11 23:02——本批授权与边界）

1. **权威源 = CLI 蓝图**：按 CLI 为准对齐 VSC——VSC 设计档 `docs/design/VSC-PROMPTS.md` 的「[4] 层由调用面承担」宣告作废（该调用面从未实现）；固化缺口的 VSC 测试断言同步更新（`test/prompts-async-guidance.test.mjs` 相关行）。
2. **`[Current file:]` 编辑器注入**：**保留**该功能面，但**条件收窄**——仅当存在活动编辑器时注入（去每回合常驻的 3000 字符噪音；具体时机/去重形态由设计定）。
3. **顺序对齐（新增需求）**：**提示词装配顺序与每 run 注入块顺序都要与 CLI 一致**（同槽位顺序；注入块按 CLI 时序排布）。

### 勘察证据（两条 explore 已核事实——供 designer 免重复勘察；as-of 2026-09-11 现读）

#### E1 注入面缺口（CLI ✅ → VSC ❌，10 项——VSC 侧「零实现/零消费」均已 grep 反证）

| # | 项 | CLI 对位（实施参照） | VSC 实证（缺） |
|---|---|---|---|
| 1 | 项目指令注入（项目 `AGENTS.md` + `project_rules.md` + 用户级 `~/.thincoder/AGENTS.md`，`<untrusted_project_instructions>` 包裹，32K 软限） | `agent/setup.mjs:341-344` + `agent/helpers.mjs:324-348`（`loadProjectInstructions`；**不分 depth**） | 全仓零命中（`loadProjectInstructions`/`untrusted_project_instructions`） |
| 2 | 相关记忆召回（每 run，限 3 条） | `agent/setup.mjs:114-124` | 零（`memory.mjs:246` 注释仍写 automatic injection——与代码不符） |
| 3 | 相关文档召回（每 run，doc_search 限 5 条 chunk、300 字符预览） | `agent/setup.mjs:100-113` | 零 |
| 4 | checklist 待办推送（pending/in-progress，depth 0） | `agent/setup.mjs:126-139` | `tools/checklist.mjs:318` `pendingItems` 有实现**零调用** |
| 5 | 工作目录快照（目录树；root 30 / 每目录 10 / 省略注）+ `Session start` | `agent/setup.mjs:64-79` + `helpers.mjs:275-312`（进程内一次） | 零（VSC 仅 system prompt 尾一行 `OS:/Working directory:`，见 `setup.mjs:338`） |
| 6 | 依赖大纲推送（repomap summary；有索引时去重注入） | `agent/setup.mjs:90-98` + `helpers.mjs:85` | 零（`repomap.mjs` 仅按需工具，无 buildSummary） |
| 7 | skills 清单注入（depth 0） | `agent/setup.mjs:345-349` + `skills.mjs` | **载荷已传被丢弃**：`extension/panel-chat.mjs:401` 算好传入 → `agent/setup.mjs:133` 解构后无引用（死参数） |
| 8 | plan mode 节律重注（稀疏 2 轮/满 5 轮/新消息全量 + 进出模式 pending 句） | `run-stages.mjs:91-108` + `agent-tools/plan.mjs:11-53` | 仅压缩后重注一版（`run-helpers.mjs:280-285`）；`agent-tools/plan.mjs` 无 pending 注入 |
| 9 | 异常 finish reason / 流规则提醒（`the previous turn ended abnormally — …`） | `run-stages.mjs:27-51`（`injectResponseReminders`）+ `rules.mjs` | 零命中（`ended abnormally`/`streamRules`/`rules.mjs` 均无） |
| 10 | skill 注入形态：`<skill-loaded>` XML 转义 + user 消息 + 去重 + 8000 不截断 | `agent-tools/skill.mjs:30-45` | `agent-tools/skill.mjs:38-45`：工具结果返回 + `slice(0,8000)` 截断 + 无转义 + 无去重 |

附（低优先，同面）：MCP 连接失败提醒（CLI `cli/make-agent.mjs:104-109,124`）在 VSC `setup.mjs:177-184` 收集后**无消费点**；写入后单文件增量重索引（CLI `record-results.mjs:156-162`）VSC 无。

#### E2 顺序与载体差异（装配器同构，序不同）

- 两端 `prompt-overlays.mjs` 场景表**逐字相同**（7 场景四槽位链同构）；系统提示**三槽本体**装配序一致。
- 差异在**尾块与每 run 注入序**：CLI 的 OS/cwd/目录树/Session start（`setup.mjs:64-79`）在 VSC 不存在（载体只有 system prompt 尾一行）。
  CLI 注入序（`prepareRun`）：AUTO 提醒 → git 富上下文 → OS/cwd/快照 → process restarted → 依赖大纲 → 文档召回 → 记忆召回 → checklist → 用户输入 → env-state → peer → 时间（尾部）。
  VSC 序（`setup.mjs` hydrateRun + `agent.mjs`）：AUTO/许可提醒 → git → process restarted → 用户输入 → env-state → peer → 时间 → `opts.injections`（编辑器文件）→ 图片指针。**需按 CLI 重排 + 补齐缺口块**。
- VSC 独有 3 项（对称记账）：`[Current file:]`（裁定 2 收窄）· permission 提醒句（`setup-reminders.mjs:184-188` 注释自称 "CLI parity, byte-identical wording" 而 CLI 无此句——**注释失真，须处置**）· 粘贴图指针（面板能力，保留）。

#### E3 语料缺陷（VSC 侧，相对其自身中文权威——事故性漂移）

| # | 项 | 证据 |
|---|---|---|
| 1 | `discipline-normal.md` **缺两整节**：「`### 文档先行`」「`### 查重与意图（先定对再定小）`」 | VSC 中文镜像有（`docs/design/prompts/discipline-normal.md:29/:42` 与 CLI 同文）；英文 src 无（grep 零命中）；README 镜像差异表 #3 只登记「路径改写」——预期该两节存在 |
| 2 | 该档 **标题/结构被压平**（设计实测更正：**4 标题 + 2 合并行**——非初勘「5 处标题」）成超长连写行（`:27`/`:31`/`:36`/`:40`/`:62`——`UI & interface design:` 等并进正文） | 两端中文镜像与 CLI 英文均正常分节 |
| 3 | 工程模式**并行节重复装配**：VSC `persona-engineering.md:56-88` 与 `discipline-engineering.md:187-214` 近逐行重复（≈7KB），两槽同装配 | 行哈希证；CLI 只在 discipline 一份 |
| 4 | `discipline-engineering.md` CLI 有 VSC 无 3 条：「设计 = 对需求的检验」「需求缺口停报链」「写权：设计档与需求档由 eng-designer 写作」（CLI `:10-22`） | 双向增删对照 |
| 5 | R24 节：CLI 英文 src 缺、VSC 有（CLI 中文权威有）——**CLI 侧已在途登记**（`batches/2026-09-11-PORTABILITY-VSC-MIRROR.md:52,77` 等）；本批一并收口或维持登记（designer 判） | 双向增删对照 |

#### E4 工具描述面

- CLI：**25 档** `src/tools/*.md`（39,106 字符——设计实测更正 26→25；经 `shared.mjs:12` `DESC()` 装载；含 Routing/Notes 段，如 `read.md` 21 行含「不要用 bash cat」「指向 repo_outline/code_search/lsp」）。
- VSC：描述内联 `.mjs` 字符串（`description:` 30 处，无 Routing/Notes；`tools/file.mjs:22-29` read 描述 7 行）。
- 工具集本体大体对齐（VSC builtin 31 / CLI 25+6）。

### 需求清单（本批覆盖——5 条）

- **R1 注入面补齐**：E1 十项按 CLI 对位实现（含两家「有收集无消费」死载荷）。
- **R2 顺序对齐**：每 run 注入块顺序与 CLI 一致 + 系统提示尾块载体统一（OS/cwd/目录树/Session start 归位到 CLI 同款注入位）。
- **R3 语料修复**：E3 五项（缺节补回 · 压平修复 · 去重 · 3 条子句补 · R24 收口判定）。
- **R4 工具描述迁移**：26 档 `.md` 迁入 VSC + 装载面（含 Routing/Notes 段）。
- **R5 VSC 独有面处置**：`[Current file:]` 收窄（裁定 2）· permission 句处置（注释失真）· 粘贴图指针保留记账。

### 验收建议（designer 细化）

运行时对照验收：同一提示词/任务分别跑两端会话，dump 实际发给模型的 system message + 每 run 注入序列，逐块 diff（顺序 + 内容）——作为 AC 的可机验判据。

### 范围外（登记不改）

- VSC 渲染层/UI 面（webview）不在本批。
- CLI 侧仅当 R3-5 收口需要触碰（如 R24 CLI 英文 src），否则零改。

---

## §2 批次任务（eng-designer 写）

_（待写——eng-designer）_

---

**状态：任务书就绪**（2026-09-11——需求 + 设计 + 测试三层已落档，待设计评审）。实施者 = eng-coder（设计 token 门）。本 §2 = coder 任务书本体（不另写副本；契约逐字 / 序表 / 用例全文在设计档各节，本段只做任务书 + 口径锚）。

**落档位置**（三方一致——本批跨三板块，需求按板块入各自档）：
- 需求：CLI 仓 `docs/requirements/PROMPT-SYSTEM.md` **§9**（F-P1~F-P5 / N-P1~N-P3）· `docs/requirements/AGENT-LOOP.md` **§13**（F-Q1~F-Q13 / N-Q1~N-Q4）· `docs/requirements/TOOLS.md` **F7 + N9**；
- 设计 + 测试：VSC 仓 `docs/design/AGENT-LOOP.md` **§17**（注入面 / 顺序 / 缓存契约 / 用例 / AC）· `docs/design/VSC-PROMPTS.md` **「语料修复」节**（E-1a~f / E-2 / E-3 逐字表）· `docs/design/TOOLS.md` **§12**（25 档 `.md` 迁移）。

**目标与理由**：用户 2026-09-11 22:54 实测「VSC 端会话体验与 CLI 差距巨大——提示词系统和注入信息面出现巨大差异」；三条裁定（权威源 = CLI 蓝图 / `[Current file:]` 收窄保留 / **提示词与注入顺序全对齐**）+ 父侧 23:06 前缀缓存约束。五个需求面：R1 注入面补齐（10 项 + 两家死载荷）· R2 顺序对齐（含系统提示尾块）· R3 语料修复 · R4 工具描述迁移 · R5 VSC 独有面处置。

**覆盖需求（三方一致——本表 = 设计 AC 回指 = 需求档条目）**：

| 批次条目 | 需求条目 | 设计节 | 验收 |
|---|---|---|---|
| R1 注入面补齐 | AGENT-LOOP §13 F-Q1~F-Q12 | VSC AGENT-LOOP §17.3 D-CI1~D-CI9 | AC-CI-1/2/3 |
| R2 顺序对齐 | AGENT-LOOP §13 F-Q13 + N-Q1 | VSC AGENT-LOOP §17.4/§17.5 | AC-CI-4/5 + T-CI-1/5/9/11 |
| R3 语料修复 | PROMPT-SYSTEM §9 F-P1~F-P4 | VSC-PROMPTS「语料修复」修一/修二 | AC-PC-1 + T-PC-1~3 |
| R4 工具描述迁移 | TOOLS F7 + N9 | VSC TOOLS §12 | AC-TD-1~3 + T-TD-1~4 |
| R5 VSC 独有面处置 | AGENT-LOOP §13 F-Q10 + PROMPT-SYSTEM §9 F-P5 | VSC AGENT-LOOP §17.3 D-CI5/D-CI6 + VSC-PROMPTS 修四 | AC-CI-2/3 + T-CI-4 |

**设计者裁定（本批新增口径——已落设计档；如有异议请评审/父侧裁）**：
1. **计数更正（D3）**：CLI 工具 md = **25 档**（§1 E4「26 档」= 笔误——实测 25 文件 / 39,106 字符）；E3-2 压平 = **4 标题 + 2 合并行**（原「5 处标题」含 `:62`——实测为内容合并行，非标题）。
2. **permission 句 = 删除**（裁定 1：权威源 CLI——CLI 无此句；`pushModeReminders` 随之退役，AUTO 推送唯一 = `agent.mjs:168-170` 循环检查；`run-helpers` 压缩重注删 permission 分支）。
3. **`[Current file:]` 收窄 = 同文去重**（同路径 + 同区间 + 同内容不重注；「无活动编辑器零注入」现状已成立）+ 3000 字符上限不变；**粘贴图指针保留**（记账——挂真实用户消息，不占注入块位）。
4. **R24 = 维持登记**（VSC 侧已就位；CLI 英文源缺节 = CLI 侧登记面，本批 CLI 零改）。
5. **[4] 层 = 本批落地**（AGENTS + skills 入 systemPrompt 尾——不分 depth / skills 仅 depth 0；OS/cwd 尾行移出归注入块）。
6. **召回面（记忆/文档）= depth 0 门**（差异登记 §17.10——CLI 非 depth 门但依赖 `agent.memory` 载荷，子代理路径无此载荷）。
7. **出批登记**：写入后单文件增量重索引（§1 E1 附项）= 本批不做（VSC indexer 无单文件 API——索引板块另批）；**stream rules 不移植**（PROVIDER 传输面既定决策，登记 §17.9/§17.10）。

**明确出批（不做——勿扩面）**：CLI 仓代码与提示词零改（文档域除外）· 不改子代理（depth>0）注入面 · 不改 webview / 面板协议 · 不做注入预算 / 裁剪 · 不改非迁移 7 工具的描述文本（`repo_outline` / `code_search` / `doc_search` / `memory` / `context` / `focus` / `peer_instances`——D-TD3）。

**实施波次建议（同批设计一次评审；三波可串行，波内独立）**：
- **波 1（语料）**：R3——`src/prompts/discipline-normal.md` + `discipline-engineering.md` + `persona-engineering.md` + `test/prompts-async-guidance.test.mjs`（锚#7 宿主 pe→de + 语料锚断言）。
- **波 2（注入面 / 顺序 / 尾块）**：R1/R2/R5——新档 `src/agent/context-injections.mjs` + `setup.mjs` / `run-helpers.mjs` / `run-stages.mjs` / `agent.mjs` / `agent-tools/plan.mjs` / `agent-tools/skill.mjs` / `extension/skills.mjs` / `repomap.mjs` / `mcp/index.mjs` / `setup-reminders.mjs` +
  新测档 `test/context-parity.test.mjs` + `test/setup-reminders.test.mjs` + `test/prompts-async-guidance.test.mjs` 的 [4] 契约断言。
  （与本波同改或与波 1 串行——同一文件两波触碰，调度按 files 域串行。）

> 〔父侧代笔：折行——上方「波 2」行（原单行 436 字符）按空白归一逐字折行，零增删；父侧落笔打标。〕
- **波 3（工具描述）**：R4——`src/tools/*.md` 25 新档 + `src/tools/shared.mjs`（+DESC）+ 16 档工具接线 + 新测档 `test/tool-descriptions.test.mjs`。
- 共享登记面 = `test/files.mjs`（两新测档登记）——分波时按 files 域串行落笔（禁双手同改一行）。

**验收标准（机验——逐条回指设计 AC）**：
- VSC：`node test/run-fast.mjs` 全绿（含两新测档登记）；`node scripts/check-doc-width.mjs` 新增违规 0；
- 机检（AC-CI-2 / AC-TD-2 / AC-PC-1）：`pushModeReminders` 与 `Permission mode` 于 VSC src 零命中 · `description: DESC(` 命中 25 处 · `src/tools/*.md` 25 档在位 · `persona-engineering.md` 对 `Multi-Task` 零命中 · 两缺节 + 4 标题 + 3 子句在位 · `[mcp] ` 于 `mcp/index.mjs` 命中；
- CLI 仓：本批所改文档不新增宽度/一致性违规（`node scripts/check-doc-width.mjs` 对表——存量与他批违规不属本批）；
- 行数实测对表（设计 §17.6 / §12.4）——任一文件越 500 硬帽停下报告。

**交付报告格式（回报必含）**：① 逐需求透明表（R1~R5 → 文件:行 证据）；② 实测行数表（对照设计预计值——超档须说明）；③ 测试实测（命令 + 通过数 + 日志尾部）；④ 偏差披露（设计 vs 实现差异——零静默）；⑤ §5 写入自证。

**边界与纪律**：
- **D1 写权**：coder 写 `src/**` + `test/**`；三层文档 = eng-designer 写域（发现文档需改 → 回报，不自行改）；
- **提示词编辑 = 主 agent 内容权 + coder 机械落笔**：逐字 = 设计档 VSC-PROMPTS「语料修复」节（编辑点外零触碰；锚字面核对；落点逐处列明于报告）；
- **D5 冻结窗口**：评审在途不改被审文档（改动集齐后统一入场）；实现中撞设计缺陷 → 停下报告（回设计者/父侧），不静默偏离；
- 凭证不落档；逐字文案照抄设计档；测试断言优先行为断言（grep 仅作补充）。

**父侧维护面（不入 coder `files` 声明）**：CLI `docs/TODO.md`（登记/核销）· 两仓 `CHANGELOG.md` · VSC `docs/design/README.md` 地图行（如需登记语料修复状态）· VSC README 镜像差异表（语料修复后的行状态核对）。

### 修正轮同步（2026-09-11——设计评审轮次 1 后；本追加与上文本冲突时以本追加为准）

**背景**：设计评审轮次 1 VERDICT = **pass**（0🔴 · 7🟡 · 3🔵——发现表见 §3）。父侧裁决 **10 条全修**（doc 级）。本轮 = 修正轮（**只改文档、零代码**：`src/**` 零改动、未新建档、未碰 §3）。逐处已注「修正轮 #N」。

**十条落点（as-of 修正轮后）**：

| # | 级别 | 落点 |
|---|---|---|
| 1 | 🟡 | VSC AGENT-LOOP §17.7（T-CI-11 行 + 跨仓只读尾注：`../thincoder` 定位 / `THINCODER_CLI_ROOT` / fail-closed 理由 / 环境）+ §17.8 AC-CI-5 + §17.9 首条 + §17.11 KD-10；需求侧 `AGENT-LOOP` §13.3 N-Q3 登记豁免注 + `PROMPT-SYSTEM` §9.3 N-P1 登记豁免注 |
| 2 | 🟡 | VSC AGENT-LOOP §3「上下文注入（顶层）」段 → 改指针指 §17（旧「快照 + 依赖大纲」句随废） |
| 3 | 🟡 | VSC TOOLS §12.5 T-TD-3 → 全量断言（16 档 / 25 工具）；§12.6 AC-TD-2 → 补 N9 发布前清单核对落点 |
| 4 | 🟡 | VSC AGENT-LOOP §17.7 用例表：T-CI-2 拆 2a/2b/2c + 新增 T-CI-3b；§17.6 行 13 与 §17.11 计数同步 |
| 5 | 🟡 | VSC-PROMPTS 语料修复节 → 新增「受影响文件（行数实测 → 预计）」表 + AC-PC-1「四档」所指明确 |
| 6 | 🟡 | VSC AGENT-LOOP §17.6 尾注（run-stages 306→~340 结构债候选）+ VSC TOOLS §12.4 尾注（shared.mjs 406→~420 同口径） |
| 7 | 🟡 | `AGENT-LOOP` §13.2 F-Q13 边界 + §13.4 第一类边界 → 「per-run history 注入面」+ [4] 不分 depth（F-P5 既定）；VSC AGENT-LOOP §17.9 同步 |
| 8 | 🔵 | VSC AGENT-LOOP §17.4 尾注 + §17.3 D-CI2 边注 → restarted 段（`setup.mjs:396-399`）由 injectRunContext #3 承接、原段删除 |
| 9 | 🔵 | 计数对齐：VSC AGENT-LOOP §17.6 表头 / §17.11 → 15 档 = 源档 12（1 新 + 11 改）+ 测档 3（1 新 + 1 改 + 1 登记）；VSC TOOLS §12.4 计数行 / §12.7 → 44（补 `test/files.mjs`） |
| 10 | 🔵 | VSC AGENT-LOOP §17.7 尾注 N-Q2 + T-CI-5 / T-CI-10 行内 seam 计数断言 |

**对 coder 的实施影响（照设计档实现）**：

- 用例面：**T-CI-2a/2b/2c**（空态 / skills 正向 ≤3 / 截断 >3——含 F-Q12 正向消费）+ **T-CI-3b**（记忆无命中零注入）为新；**T-CI-5 / T-CI-10 含 seam 计数断言**（快照 1 次/实例 · 大纲 1 次/session · 召回/大纲/快照 1 次/run 失败不重试；计数 spy 形态自选、报告备案）；**用例共 14 条**。
- **T-CI-11 = 跨仓只读**（兄弟仓 `../thincoder`；`THINCODER_CLI_ROOT` 覆盖；缺仓/异位 fail-closed 不 skip）——先例 = `test/prompts-mirror-anchors.test.mjs`。
- **R4：T-TD-3 全量断言**（16 档 / 25 工具逐档扫描）；**AC-TD-2 增发布前清单核对**（`vsce ls` 列 `src/tools/*.md` 25 档）。
- 计数终值：§17 实施域 **15 档**；TOOLS 实施域 **44**（25 新 + 17 改 + 2 测档）。
- 其余契约 / 序表 / 逐字表 = **零语义变动**（本轮 = 口径、覆盖与登记补全）。

**自检**：D6 回读（5 档落点逐处复核）+ 两仓 `check-doc-width.mjs`——VSC 仓 **OK(宽度)·新增一致性违规 0**；CLI 仓本批所改两需求档零新增（报表明细内违规全为 `docs/batches/` 他批/本批 §1 存量面，不属本批改动）。

**计数（D3）**：修正 **10 条**（🟡7 + 🔵3）· 落修文档 **5 档**（VSC `AGENT-LOOP` / `VSC-PROMPTS` / `TOOLS` + `requirements` `AGENT-LOOP` / `PROMPT-SYSTEM`）。

### 实现后同步（2026-09-12——交付实测态对齐；本追加与上文本冲突时以本追加为准）

**背景**：实现已交付核验（快层 592/578/0；§5/§6）。本追加 = coder 缓交的 doc 层落地（§6 遗留 #23 设计侧同步）——**纯文档、零代码**；批次条目零增删（R1–R5 不变）。

**落点（逐处注「实现后同步（2026-09-12）」；实测口径 = 读档 `N lines total`）**：

| # | 档 | 节 | 内容 |
|---|---|---|---|
| 1 | VSC `TOOLS.md` | §12.2/§12.3/§12.4/§12.5/§12.7 | `edit` 宿主更正（= `file-edit.mjs`——原记 `file.mjs` 笔误）；§12.4 补列（452（实现前）→ 实测 435）+ 计数 44→45（25 新 + 18 改 + 2 测档——对齐 `test/tool-descriptions.test.mjs:9/:63`）；T-TD-3 档数 16→17 |
| 2 | VSC `AGENT-LOOP.md` | §17.6 | `repomap.mjs` 实测 304 → 结构债候选；`test/context-parity.test.mjs` 实测 385 → 登记；尾注补「实现后同步」段 |
| 3 | VSC `AGENT-LOOP.md` | §17.10 | 补登记：文档召回 `> heading` 段本端恒缺（`searchIndex` 无 heading 字段——行模板逐字、条件段恒省） |
| 4 | 三档 | 变更记录 | VSC `AGENT-LOOP.md` / `TOOLS.md` / `VSC-PROMPTS.md` 各一行（2026-09-12） |

**落点勘正（1 处——披露）**：`test/prompts-async-guidance.test.mjs` 535 的登记面——按文档归属落于 `VSC-PROMPTS.md` 语料修复节受影响文件表（AC-PC-1「四档行数实测对表」承载表：原 `~455` → 实测 535 + 登记口径）；`AGENT-LOOP.md` §17.6 尾注存指数行。故实际落笔 3 档（任务清单口径为两档）。

**自检**：D6 回读（3 档逐处复核）；VSC `check-doc-width` = OK(宽度) + 一致性新增 0；CLI 同检查本追加零新增；VSC 快层回归真跑（结果随交付报告）。

## §3 设计评审（评审子代理写）

_（待写——评审子代理）_

---

### 轮次 1（评审子代理）

### 设计评审轮（VSC-CONTEXT-PARITY——VSC AGENT-LOOP §17 / VSC-PROMPTS 语料修复节 / TOOLS §12）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements | 🟡 | T-CI-11 跨仓只读测试（AGENT-LOOP(VSC) §17.7 :1244 / AC-CI-5 :1254 / KD-10 :1285）与需求 N-Q3「零跨仓依赖；VSC 自身断言驻留绿」（requirements(CLI) AGENT-LOOP :475）与 N-P1「不加双端同步依赖」（PROMPT-SYSTEM :328）存在张力：CLI 仓缺失/异位/fail-closed 时 VSC 快层恒红 | 父侧确认该偏离（或测试改 skip-if-absent / 移交付期审计）；明示仓库定位与失败语义 |
| 2 | Document ownership | 🟡 | VSC AGENT-LOOP §3 「上下文注入（顶层）」（:150）与 §17.1 现状复核（:1066「无」）自相矛盾，批后与 §17 双描述；本批文档同步面（本 §17 + VSC-PROMPTS + TOOLS §12）未列 §3 | §3 段落改指针指 §17（或列 merge 项——同 §11.6 先例） |
| 3 | Acceptance criteria | 🟡 | TOOLS F7 判定句「内联 description 字符串零残留」（requirements(CLI) TOOLS :23）被 T-TD-3 降为「键控抽查 ≥5 档」（TOOLS(VSC) :339）；N9 vsix 面仅以 .vscodeignore 代理断言（:347） | 全量断言（16 档/25 工具）；发布前 vsix 清单核对落点登记 |
| 4 | Acceptance criteria | 🟡 | F-Q7 正向面（skills 非空 → systemPrompt 尾 DISREGARD+≤3 条+`... and N more`）无用例：T-CI-1（:1234）只断 history 块序、T-CI-2（:1235）/AC-CI-3（:1252）仅空态；F-Q2 无命中零注入、F-Q12 正向消费同缺 | 补 skills 正向/截断两态用例（T-CI-2 拆两态或扩 T-CI-1） |
| 5 | Affected-file annotations | 🟡 | VSC-PROMPTS 语料修复节无受影响文件/行数表，却修改 `test/prompts-async-guidance.test.mjs`（:187）+3 档 `src/prompts/*.md`；AC-PC-1（:204）引用「四档行数实测对表」而表未落 | 补行数标注表并明确「四档」所指 |
| 6 | Affected-file annotations | 🟡 | run-stages.mjs 306→~340（AGENT-LOOP(VSC) :1215）再增无拆分口径，违背本档先例「若后续批次再增长，挂结构债候选」（:671）；同类 shared.mjs 406→~420（TOOLS(VSC) :310） | 挂结构债候选行（或一句话拆分评估） |
| 7 | Requirements | 🟡 | F-Q13 边界「不改子代理（depth>0）注入面（仅时间提醒）」（requirements(CLI) AGENT-LOOP :467/:480）与 F-P5「不分 depth」（PROMPT-SYSTEM :322）+ D-CI2（:1117）/§17.9（:1258）语义张力；CLI 实证无 depth 门（thincoder/src/agent/setup.mjs:341-344） | 边界改述为「per-run history 注入面」+ 明示 [4] 尾块不分 depth（F-P5 既定） |
| 8 | Clarity | 🔵 | 现 restarted 段（:396-399）去向未明——D-CI2「替换现 git 注入位置」（:1118）可致误读为原位保留（序表 :1170-1172 要求其在 git/快照后） | 一句明示：现段由 injectRunContext #3 承接（原段删除） |
| 9 | Clarity | 🔵 | D3 计数与表行数不齐：:1207「13 改+1 新+2 测档」(=16) vs :1287「15 档（13 改+1 新+1 登记）」；TOOLS(VSC) :330(=44) vs :355(=43，漏 test/files.mjs) | 计数与表逐项对齐 |
| 10 | Acceptance criteria | 🔵 | N-Q2 度量方式「用例断言调用次数（seam 计数）」（requirements(CLI) AGENT-LOOP :474）在用例表（:1230-1244）无落点（仅效果断言） | 需要则补 seam 计数断言，或注记以效果断言等价 |

**核验附记**：行数标注抽样（§17.6 全 15 行 + TOOLS §12.4 全部）与磁盘实测一致；§17.1 现状复核、D-CI1/D-CI2/D-CI9 文案与 CLI 对位行号（setup.mjs:54-139/341-349/351、run-stages.mjs:27-51）逐条抽验一致；VSC-PROMPTS E-1/E-2/E-3 编辑点字符串与镜像/CLI 源一致（CN 镜像 pe 不含 Multi-Task 节——去重方向与镜像登记一致）。

VERDICT: pass（0🔴 · 7🟡 · 3🔵）

计数：发现 10（🔴0 / 🟡7 / 🔵3）；六档全文读毕；样例行数核验 = §17.6 表 15 行全部实测相符 + TOOLS §12.4 表全部相符。

## §4 用户批准（主 agent 记）

**2026-09-11 23:55 父侧代签**——用户 23:43「自动推进到排空」授权；条件齐备：轮次 1 pass（0🔴 · 7🟡 · 3🔵）→ **修正轮 10/10 落地**（#8——父侧已抽验落点：PSS:332 N-P1 登记豁免 ✓ / §17.4 尾注 ✓；§1 三行超宽折行，§2 折行打标）→ **token 已签发**（值不落档）。

**批准范围**：VSC 会话对齐 CLI（R1–R5）——实施面 = §2 三波（波 1 语料修复 / 波 2 注入面+顺序+尾块 / 波 3 工具描述迁移）；实施者 = eng-coder（设计 token 门）。

**遗留**：跨批序——TEST-DISCIPLINE-PROMPTS 批在本批之后落地（VSC 提示词三档同域——调度器串行）；commit 随「扫」批。

---

## §5 实施记录（eng-coder 自写）

_（待写——eng-coder）_

---

**实施完成**（2026-09-12 00:22——eng-coder 自写）· 三波全落地（波 1 语料 / 波 2 注入面+顺序+尾块 / 波 3 工具描述）· 终态 = **clean**（分歧审计 1 轮 → 修正；代码评审 1 轮 pass 0🔴 → 2 条修正、其余登记）。

### 逐需求透明表（R1–R5——文件:行 as-of 交付态）

| 需求 | 落点 |
|---|---|
| R1 注入面补齐（10 项 + 2 死载荷） | `src/agent/context-injections.mjs:39-202`（项目指令 / OS 快照 / restarted / 大纲 / 文档召回 / 记忆召回 / checklist + 单一编排）；`src/extension/skills.mjs:95-118`（skills 载荷真消费 + formatSkillListing）；`src/agent-tools/skill.mjs`（D-CI8 注入形态）；`src/mcp/index.mjs:339`（`[mcp] ` console 可见面） |
| R2 顺序对齐 | `src/agent/setup.mjs:417`（injectRunContext #1–#7）→`:427-431`（用户输入）→`:437-441`（env-state）→`:445`（peer）→`:449`（编辑器注入）→`:451`（time 尾位）；AUTO 唯一推送 = `src/agent.mjs:170-172` 循环头；[4] 层尾块 = `setup.mjs:344-353` |
| R3 语料修复 | `src/prompts/discipline-normal.md`（两缺节 :29-34/:42-47 + 4 标题 :36/:49/:56/:61 + 2 合并行拆分 :62-64/:84-85）；`src/prompts/discipline-engineering.md:19-21`（E-2 三子句）`:214`（E-3 cancel 行）；`src/prompts/persona-engineering.md`（并行节删除——87→55 行） |
| R4 工具描述迁移 | `src/tools/*.md` 25 档（39,256 字符）+ `src/tools/shared.mjs:15`（DESC）+ 17 接线档（25 处 `description: DESC(`） |
| R5 VSC 独有面 | `src/agent/setup-reminders.mjs:194-204`（D-CI5 同文去重）；permission 句退役（src 零残留）；粘贴图指针保留（零改——挂真实用户消息） |

### 测试实测（真跑——快层 + 定向）

- `node test/run-fast.mjs`：**tests 592 · pass 578 · fail 0 · skipped 14**（slow 归册）。
- slow 门：1 条存量抖动（`test/verify-redesign.test.mjs:87` T-V4，820–1031ms 波动）——HEAD 干净工作树**复现同条**（823ms），非本批引入（报告④）。
- 定向全绿：`test/context-parity.test.mjs` 14/14 · `test/tool-descriptions.test.mjs` 4/4 · `test/setup-reminders.test.mjs` · `test/prompts-async-guidance.test.mjs` · `test/agent-lifecycle-singleton.test.mjs` · `test/expand-home.test.mjs` · `test/eng-designer-role.test.mjs`。
- `node scripts/check-syntax.mjs`：276 JS files OK。

### 机检实测（AC 回指）

- AC-CI-2：`pushModeReminders` 与 `Permission mode` 于 `src` **零命中**；`slice(0, 8000)` 于 `skill.mjs` 零命中；`[mcp] ` 命中 `mcp/index.mjs`。
- AC-TD-2：`description: DESC(` **25 处**（机检）；`src/tools/*.md` **25 档**；`.vscodeignore` 无 `*.md` 排除。
- AC-PC-1：两缺节 + 4 标题独占行 + E-2 三子句在位；`persona-engineering.md` 对 `Multi-Task` 零命中。
- 文档核验：VSC `check-doc-width.mjs` = OK(宽度) + 新增一致性违规 0；CLI 仓本批所改两需求档零新增（存量/他批违规全在 `docs/batches/`）。

### 行数实测对表（§17.6 / §12.4——超档说明）

| 档 | 设计预计 | 实测 | 说明 |
|---|---|---|---|
| `src/agent/context-injections.mjs` | ~200 | 228 | 新档（块函数 + 编排 + seam 注释） |
| `src/agent/setup.mjs` | ~470 | 465 | 尾块 + 编排落位 + 退役注释 |
| `src/agent/run-stages.mjs` | ~340 | 337 | +injectResponseReminders + 压缩复位（结构债候选，设计已挂） |
| `src/agent-tools/plan.mjs` | ~90 | 89 | D-CI4 全件移植 |
| `src/extension/skills.mjs` | ~95 | 119 | loader + listing + readSkill 全语义 |
| `src/repomap.mjs` | ~245 | **304** | **超 300 咨询线**——buildSummary 块 ~78 行（建议设计侧挂结构债候选/拆分评估） |
| `test/context-parity.test.mjs` | ~260 | 385 | 14 用例 + 双端锚（超 300 咨询线，登记） |
| `test/prompts-async-guidance.test.mjs` | ~455 | **535** | **超 500 硬帽**（T-PC-1~3 承载 + T-CI 锚；同仓先例 `chat-panel.test.mjs` 621）——报告披露 |
| 其余波 2/3 源档 | 各净减/± | 与预计 ±10 内 | `file-edit.mjs` = 设计表未列（edit 宿主，见偏差 1） |

### 偏差披露（零静默）

1. **`edit` 宿主 = `src/tools/file-edit.mjs`**（设计 §12.3 D-TD2 / §12.4 记为 `file.mjs`）——实际改档 = `shared.mjs` + **17 工具档**（设计「17 改」→ 实际 18）；测试档自注更正（`test/tool-descriptions.test.mjs:9`）。设计表需随实现更正（父侧/designer）。
2. **`src/repomap.mjs` 304 行**（预计 ~245）——超 300 咨询线；本批不拆分（与设计对 buildSummary 的落点契约一致），建议挂结构债候选。
3. **`test/prompts-async-guidance.test.mjs` 535 行**（预计 ~455）——超 500 硬帽；测试档、无功能影响、同仓先例在。
4. **测试 seam 形态**：`context-injections._setInjectionDepsForTests` 依赖表（§17.7 修正轮 #10「spy 形态自选、报告备案」）；`pushGitContext` 在 T-CI 测试中桩化（真 git 语义由 `setup-reminders.test.mjs` 覆盖）。
5. **评审修正（advisor #4）**：`run-stages.mjs` 压缩成功路径补 `agent._planReminderAtLen = 0`（CLI `run-stages.mjs:65` 对位——防陈旧阈值压制 plan 全量句）。
6. **评审修正（advisor #5）**：`setup-reminders.test.mjs` 增 AUTO 双份字面量漂移锁（`run-helpers.mjs` 内联副本 vs 常量逐字节）。
7. **审计修正**：T-CI-1 扩 #3 restarted / #11 编辑器注入相对位断言；`discipline-normal.md` `### Review discipline` 前补空行（CLI 对位）。
8. **纪律记过**：过程中曾于仓根落 `log-tmp.txt` 抓取输出（随后删除、零残留）——长输出应落工作树外（报告披露）。
9. 提示词编辑 = 主 agent 内容权 + 本 coder 机械落笔（逐字 = VSC-PROMPTS 语料修复节；编辑点外零触碰）。

### 审计与代码评审（轮次与终态）

- **分歧审计**（explore 只读，1 轮）：DEVIATIONS 3 条（PARTIAL = T-CI-1 序表覆盖不全 / DOC-DRIFT = file-edit.mjs 落点 / OUT-OF-LIST = 临时日志）→ 可修项已修（见偏差 7），文档侧项随报告回父侧。
- **代码评审**（advisor type=code，1 轮）：**VERDICT: pass（0🔴 · 5🟡 · 2🔵）**——2 条已落地修正（#4/#5），其余为行数咨询线 / 设计差异登记补列 / 落点表笔误（doc 层登记）。
- **终态 = clean**：无未收敛 🔴；修正轮 = 2（审计修正 + 评审修正），均在本实施内收敛。

### §5 写入自证

本段由 eng-coder 经 `batch_segment({segment:"5", text})` 写入（无路径参数——目标档 = spawn 绑定）。

## §6 验证与收口（父代理自写）

**2026-09-12 00:34 收口（父侧核验）**

- **真跑**：VSC 快层 `node test/run-fast.mjs` → **tests 592 · pass 578 · fail 0 · skipped 14** ✓；定向 `context-parity` + `tool-descriptions` 18/18；`check-syntax` 276 files OK（coder 报告 + 父侧重跑一致）；
- **机检抽验**（父侧实跑）：`description: DESC(` = 25 ✓ · `src/tools/*.md` = 25 ✓ · permission 提醒句零残留 ✓（`"Denied by user (permission mode)"` 为工具拒绝文案——非本批退役对象）；`context-injections.mjs` 228 行；
- **R1–R5 全 Done**（交付表逐条）；内部审计 clean + advisor 代码评审 pass（2 修 5 缓）；CLI 仓零改 ✓；
- **遗留（doc 层——#23 设计侧同步）**：TOOLS §12.3/§12.4/T-TD-3（`file-edit.mjs` 落点 + 计数 44→45）· AGENT-LOOP §17.6（`repomap.mjs` 304 结构债候选 + 测试档实测值）· §17.10（文档召回 heading 端差异登记）；
- **存量抖动（非本批）**：`verify-redesign` T-V4 偶触 slow 门（820–1031ms vs 800ms）→ 另批登记；
- **链终**：design 链令牌已消费（值不落档）——再动需新评审。
