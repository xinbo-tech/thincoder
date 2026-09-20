# 2026-09-20 · 提示词引用清零批（PROMPT-REFS-ZERO-BATCH）

> 六段 append-only，一段一作者。编制：主 agent · 2026-09-20 19:3x · 来源 = 用户 **19:31 裁定**「**提示词中根本不应该出现对文档的引用，这个类东西是要清干净的**」。
> 本批 = **提示词面 / 模型可见面 的文档引用清零** + **立纪律**（此后新提示词禁带文档引用）+ **机判锁**（该域 doc-ref = 0）。

## §1 讨论（主 agent）

### 1.0 用户授权（**父侧代点火 + 代批准** · 时限 **跑到干完**）

用户 17:03「自动跑到干完吧」+ 19:26「处理吧」+ **19:31 口径裁定**（本批之依据 ✓）⇒ 本批设计评审点火权 + §4 批准权**委托父侧自动执行** ✓。

**父侧自缚**：① 代签三条件（评审 pass ∧ 修正轮已落 ∧ token 已签发）；② 代签写明依据；③ 需**新范围/用户口径** ⇒ 停下 ✓。

**状态行**：🔄 进行中（设计轮待发）

### 1.1 用户裁定（本批唯一判据源）

> **「提示词中根本不应该出现对文档的引用，这个类东西是要清干净的。」**（2026-09-20 19:31）

**推论（父侧读法 · 请设计轮据实勘定）**：
1. **删 ≠ 改**：不是「把旧节号换成新址」✗ —— **引用本身不该在** ✓；句义保留 ✓，指针删净 ✗。
2. **面**：**提示词面**（`thincoder-core/prompts/**` 等 ✓）+ **模型可见面**（工具说明 / schema 文本 ✓ · 回给模型的串 ✓ —— 它们=模型读的提示词 ✓）+ 同因人读串（日志/告警 ✓ 顺手 ✓）。
3. **立纪律**：此后**新写提示词不得带文档引用**（引用若必要 ⇒ 进档面/注释面，不进模型面 ✓）。
4. **机判锁**：该域 **doc-ref 零命中**（先红 → 后绿 ✓ · 全 ASCII 判据 ✓）。

**第二判据源（用户 2026-09-20 20:33 · 上位原则）**：「文档和提示词存活于两个完全不同的环境——文档是设计/开发时用的，开发工具可以读到；提示词是运行时用的，**运行时环境读不到文档**」⇒ 提示词内一切文档引用 = **运行时死文本**（所指对象不在运行时环境 ✗）；「模型可以现场读文档」不构成保留理由 ✗（仓开发档不随运行时载荷分发 ✗）；提示词内合法所指 = 运行时可解析者（工具与参数 · 会话内对象 · 用户项目内文件 · 协议自身段号 · 操作数）✓。本判据凌驾于 §2.1 判据线：判据 3 的「可测缝」不构成对文档引用的保留理由 ✗。

### 1.2 已知残留（起点 · 设计轮须全仓实勘补全）

| # | 位置 | 形态 |
|---|---|---|
| 1 | `thincoder-core/agent-tools/advisor.mjs:50` | **工具说明**（模型每轮读）内 `(AGENT-LOOP.md §11.2)` ✗ |
| 2 | `thincoder-core/agent-tools/advisor-async.mjs:369` | **同 scope 守卫报错串**（回给模型当工具结果）内 `(AGENT-LOOP.md §11.2)` ✗ |
| 3 | `thincoder-core/agent-tools/subagent-async.mjs:116` | `console.warn` 串内 `(AGENT-LOOP.md §11.1)` ✗ |
| 4 | 裸形 3 处（台账 #147 记载） | `§11.x` 无档名形 |
| 5 | 全仓其余（未勘） | **待设计轮实勘**（`prompts/**` · 各 `agent-tools/*` 工具说明 · 端壳提示串等） |

**归并**：台账 **#147**（域外同因 `§11.x` 族）⇒ 本批（其残留 = 本批起点 ✓）；**#149 批**（扩面族 · 在跑）与本批界：`#149` = **注释面节号**（非提示词面 ✗）· 本批 = **提示词/模型可见面引用** ✓ —— **不得相互吞并** ✓。

### 1.3 硬要求

- **先实勘后改** ✓（全仓逐域实读 · 逐处判「删引用 / 改写去指针 / 判保留 + 理由」✓）；**模型可见面每处须给理由** ✓。
- **句义保留**：删引用不得删掉该句的**行为语义** ✓（例：`(AGENT-LOOP.md §11.2)` 删后句子仍须自足 ✓）。
- **机判**：提示词域 doc-ref 正则（`[A-Z-]+\.md` 类 ✓ —— 设计轮定式 ✓）先红后绿 ✓ + 三包测试全绿 ✓。
- **机械约束**：`.mjs` 贴线档禁增行（硬限 500 ✓）· `.md` 行宽 ≤300 ✓。

### 1.4 验收（方向）

① 全仓实勘表（域 → 处数 → 逐处处置）· ② 改集「旧→新（或删）」逐处表 · ③ 机判先红后绿读数 · ④ 三包全绿 · ⑤ 纪律面落点（提示词模板/纪律层一句 ✓ —— 落点由设计轮勘定 ✓）· ⑥ D8 自查。

### 1.5 台账

#147 → 本批（在途）· 落定后核销。

## §2 批次任务与设计（eng-designer）

**轮次**：initial · **本批**：提示词引用清零批（PROMPT-REFS-ZERO-BATCH）· **判据源** = §1.1 用户 2026-09-20 19:31 裁定「提示词中根本不应该出现对文档的引用，这个类东西是要清干净的」。
**任务书** = §1 全段（§1.1 裁定 · §1.2 起点 5 组 · §1.3 硬要求 · §1.4 验收方向）。

### §2.1 判据线（先立线后处置——处置表的每一行由此线导出）

**文档引用（在射程内）= 三条件同时成立**：
1. **指向对象 = 文档**：档名（`NAME.md` 形 · 大写裸形如 `SUBAGENT-OBSERVE-SEND`）· 节号（`§N.M` · `§NN`）· 指路句（「见 X」「权威 = X」）。
2. **删后句义自足**：引用只提供「出处/可查处」，不承担行为语义 ⇒ **删之不动行为**（§1.1 推论 1：删 ≠ 改，不以新址替换）。
3. **位置 = 模型可见面**（提示词装配文本 · 工具说明/schema 文本 · 回给模型的串 · 注入提醒）**或同因人读串**（日志 / 告警——同一句面上的顺手面，§1.1 推论 2）。

**非引用（判保留面）——四类，逐处给理由**：

| 类 | 例 | 理由（判据 2 不成立：删除即动行为） |
|---|---|---|
| 行为操作数 | `AGENTS.md`（项目指南）· `SKILL.md`（技能档形）· `.thincoder/advisor.md`（评审标准档）· `project_rules.md` | agent 必须**打开**它——句子的行为语义就是「读这个文件」 |
| 路径操作数（形） | `docs/README.md`（文档地图探测址）· `docs/batches/<batch>-<topic>.md`（批次档路径形）· `batches/*.md` · `design/<board>.md`（写出落点）· `loadSlot("common.md")` 类槽名（loader key 字面量） | 是**操作数/字面量**，不是「可去查的出处」；删后指令不可执行 |
| 扩展名字面量 | `".md"`（DOC_EXTS / `endsWith(".md")`）· 纯 `.md` 文档豁免句 | 文件种类字面量 |
| 协议自名 | 批次档段号 `§1`–`§6`（`batch_segment` 段值域 + 六段全图术语）· 标题正则形 | 是本协议自己的对象名，不是对外部文档的指路 |

**排除面（不在本批——逐条给界）**：注释面（`//` · `/* */` · JSDoc——**#149 族在跑，不得吞并**）· 测试面（非模型可见；仅随串改动同步**断言**）· 归档面 `**/_archive/**` · `scripts/**` · `docs/**` 其余档（档面引用合法）· 冻结批档 · 他批写域。

### §2.2 全仓实勘表（逐域实读 · 非抽样）

| 域 | 扫描面 | 引证命中 | 说明 |
|---|---|---|---|
| D1 英文运行提示词面 | `thincoder-core/prompts/**`（15 档） | **12 档 / 17 处** | 未命中 3 档：`persona-normal.md` · `consult-base.md` · `discipline-normal.md`（后者只含行为操作数） |
| D2 工具描述文档面 | `thincoder-core/tool-docs/**`（24 档） | **0** | 实测零命中（`.md` / `§` 双模式） |
| D3 中文权威提示词面 | `docs/core/design/prompts/**`（15 档） | **12 档 / 17 处** | 与 D1 同构（翻译非同拷贝；各自判） |
| D4 模型可见串面（生产码） | `thincoder-core/**` + `thincoder-cli/src/**` + `thincoder-vscode/src/**` 的**字符串/模板字面量**（注释/测试除外） | **18 档** | 工具说明 · schema 文本 · 回模型串 · 注入提醒（含审计模板串） |
| D5 同因人读串面 | 同上（`console.warn/error` · 警告列表） | **4 处 / 4 档** | `settings.mjs:80` · `session-store.mjs:278/:355` · `provider/responses.mjs:194` · `advisor/project-context.mjs:103`（仅 `AGENTS.md`——判保留） |
| D6 端壳提示面 | `thincoder-cli/src/prompt-injections.mjs` · `thincoder-vscode/src/prompt-injections.mjs`（锚取值表） | **0** | 实测零命中；两端提示词副本均在 `docs/_archive/design/prompts/**`（归档面，出界） |

**实勘结论**：① 不存在「他域提示词副本漏网」（端壳只有锚取值表，且零命中）；② `tool-docs/` 面干净；③ 实际处置面 = D1+D3（24 档）+ D4（18 档）+ D5（3 处）。

### §2.3 处置表（逐处：旧 → 新（或删）+ 理由）

#### §2.3.1 提示词两面（D1 英文 / D3 中文 —— 同构逐处）

| # | 位（EN ∥ CN） | 旧 | 新（删/改写） | 理由 |
|---|---|---|---|---|
| P1 | `advisor-design.md:5` ∥ `:16` | 括注 `(The project's methodology backbone lives in the discipline-layer prompts discipline-engineering.md / discipline-normal.md; the former METHODOLOGY.md is retired.)` | **整括注删** | 审阅者 = advisor——纪律层提示词**不在其上下文**（指路不可达）；「METHODOLOGY.md 已退役」= 尸句（D8） |
| P2 | `advisor-design.md:19` ∥ `:43` | 引证格式示例 `path/to/file.md:42` | EN → `path/to/file.ext:42`（CN 判保留：`<file>.md` 占位形，锁不命中） | 该处是**格式示例**（host 按 `file:line` 核验）；换非档扩展名以过 J3，语义不变 |
| P3 | `advisor-design.md:32` ∥ `:62`；`advisor-round1.md:28` ∥ `:55`；`advisor-round2.md:33` ∥ `:46`；`advisor-round3.md:29` ∥ `:43` | `— keep the advisor-design.md convention —` | `— keep this convention —` | 自指本提示词档——模型无需文件名；句义 =「本评审既有惯例」 |
| P4 | `common.md:156` ∥ `:119` | `**Structure authority**: segment structure / gates / lifecycle → design/BATCH-RECORD.md (this section gives the map only — no mechanism restatement).` | `**Structure authority**: the project's own batch-record mechanism defines the segment structure / gates / lifecycle (this section gives the map only — no mechanism restatement).` | 删档名 + **改写去指针**（保留「不重述机制」的行为语义） |
| P5 | `discipline-engineering.md:113` ∥ `:110` | `⇒ the **fallback settlement path** = design/BATCH-RECORD.md §5.2)` | `⇒ the **fallback settlement path**)` | 纯引证（§5.2 = 出处）；句义自足 |
| P6 | `persona-engineering.md:133` ∥ `:131` | `⇒ the **fallback settlement path** (design/BATCH-RECORD.md §5.2).` | `⇒ the **fallback settlement path**.` | 同上 |
| P7 | 槽注 ×5 档（EN）`persona-coder.md:1` · `persona-eng-coder.md:1` · `persona-eng-designer.md:1` · `persona-explore.md:1` · `persona-plan.md:1`（CN 同名 5 档 `:1`） | `consumers:[<角色说明>; pairs with common.md + discipline-<层>.md …]` | `consumers:[<角色说明>]`（**只删 `pairs with …` 从句**） | 槽注**模型可见**——「与哪些档配对」是文档引用；槽位/消费方字段保留（机检正则 `^<!-- slot:\[1\] consumers:\[.+\] -->$` 仍匹配） |
| P8 | `persona-coder.md:9` ∥ `:7` | `see the same-named sections in common.md — already injected` ∥「见 common.md 同名节——已注入」 | `see the same-named sections in the shared layer — already injected` ∥「见公共层同名节——已注入」 | 指针改**层名**（层在同一条装配链内，正文实际在场） |
| P9 | `persona-eng-coder.md:29` ∥ `:29`；`persona-explore.md:10` ∥ `:10` | 「交付表按 common.md 统一格式」 | 「交付表按**公共层**统一格式」 | 同上 |
| P10 | `common.md`「文档写作纪律」节（EN/CN 各 +1 行） | —（新增） | 见 §2.6 纪律句 | §1.1 推论 3「立纪律」落点 |

**处置后两面 `.md` 形残留白名单**（判据 2 判保留）：`AGENTS.md` · `docs/README.md` · `SKILL.md` · 路径形（`docs/batches/<batch>-<topic>.md` · `batches/*.md` · `design/<board>.md`）· 扩展名字面量 · `.thincoder/advisor.md`。

#### §2.3.2 模型可见串面（D4——生产码字符串；统一删法 = 删引证括注，句义保留）

| # | 文件:行 | 删（旧片段） | 理由（模型面每处理由） |
|---|---|---|---|
| C1 | `agent-tools/advisor.mjs:48` | ` (AGENT-LOOP.md §18.8 — …)` 内引证 | 工具说明（模型每轮读） |
| C2 | `advisor.mjs:50` | `ASYNC (AGENT-LOOP.md §11.2):` → `ASYNC:` ★**起点 #1** | 工具说明；该档现无 §11（死指针） |
| C3 | `advisor.mjs:75` | `(§18.8)` | schema 说明 |
| C4 | `advisor.mjs:89` | ` (ENGINEERING-MODE.md §2.20)` 等引证 | schema 说明（batchDoc 参数） |
| C5 | `advisor.mjs:167` | ` (AGENT-LOOP-SUBAGENT.md §6.10)` | 回模型错误串 |
| C6 | `agent-tools/advisor-async.mjs:369` | ` (AGENT-LOOP.md §11.2)` ★**起点 #2** | 同 scope 守卫报错串（回模型当工具结果） |
| C7 | `agent-tools/subagent-async.mjs:116` | ` (AGENT-LOOP.md §11.1)` ★**起点 #3** | `console.warn`（人读串 · 同因） |
| C8 | `subagent-async.mjs:247/:251/:290` | `(AGENT-LOOP-SUBAGENT.md §6.7.2)` · `(AGENT-LOOP.md §20 D-SD5)` | 回模型错误串 / note 串 |
| C9 | `subagent-actions.mjs:111/:242/:294/:309` | `(AGENT-LOOP-SUBAGENT.md §6.7.2)` | 回模型错误串（status/observe/send） |
| C10 | `subagent-panel.mjs:60/:88/:102/:134/:136/:137` | `(§17.5.5 …)` · `(AGENT-LOOP-SUBAGENT.md §6.7.2)` · `(§25 D-R17a)` · `(§25 D-R17b)` · `(§17)` | 回模型 err/note 串 |
| C11 | `subagent-scheduler.mjs:195/:321` | `(AGENT-LOOP.md §21.1 P-SL2)`（`STALL_NOTE`——回模型） · `(AGENT-LOOP.md §20 D-SD5)` | 回模型串 |
| C12 | `subagent-spawn.mjs:226/:232` | `(AGENT-LOOP.md §20 D-SD5)` · `(AGENT-LOOP.md §20 round2 #7)` | 回模型错误串 |
| C13 | `subagent-spawn.mjs:408/:414/:419/:425/:433` | `(AGENT-LOOP.md §18.7 D-TS4 A1)` · `(… §18.5 D-AG3 …)` · `(… §18.7 D-TS5 A2)` · `(… §18.5 D-AG3)` · `(… §18.7 D-TS6 A3)` | **注入子提示词的审计模板串**（模型可见，最重面） |
| C14 | `subagent.mjs:126/:128/:131/:132/:143/:144/:153/:164/:188` | `(AGENT-LOOP-SUBAGENT.md §6.7–§6.7.5 + SUBAGENT-OBSERVE-SEND)` · `§6.7.2`（串内 ×3） · `(AGENT-LOOP.md §18)` · `(AGENT-LOOP.md §25 D-R17b)` · `(AGENT-LOOP.md §15/§18/§11.1)` · `(AGENT-LOOP.md §20)` · `(§6.7.2/§2.6)` · `(AGENT-LOOP.md §18 D-E1a)` · `(AGENT-LOOP.md §25 D-R17b)` · `(AGENT-LOOP.md §19 D-M3)` | subagent 工具说明 + schema（模型每轮读；含基线裸名 `SUBAGENT-OBSERVE-SEND`） |
| C15 | `agent/family-tools.mjs:111/:112/:123/:124` | `(ENGINEERING-MODE.md §2.15 D; ≤6 spawns per batch)` · `(AGENT-LOOP.md §18 D-E3)` · `(ENGINEERING-MODE.md §2.15 D)` · `(AGENT-LOOP.md §19)` · `(AGENT-LOOP.md §18 D-E2 ③)` · `(AGENT-LOOP.md §19)` | **注入子工具说明**（eng-designer/eng-coder 面工具说明——见 §2.10 F1） |
| C16 | `agent/spawn-child.mjs:54/:57/:63` | `(AGENT-LOOP.md §18 D-E3, ENGINEERING-MODE.md §2.15 D)` · `(AGENT-LOOP.md §18 D-E3)` · `(AGENT-LOOP.md §18: max 5 fix rounds; …)` | 回模型错误串（内部 spawn 门） |
| C17 | `agent/setup.mjs:200/:202` + `thincoder-vscode/src/agent/setup.mjs:389/:391` | `（蓝图 §3.4 特殊模块不自降级）`→`（特殊模块不自降级）` · `(no degraded fallback per PROMPT-SYSTEM §3.4)`→`(no degraded fallback)` | 回模型/人读串（两端同源；VSC 同改） |
| C18 | `agent-tools/batch-segment.mjs:73/:168/:196/:200/:208/:221/:228/:231/:237/:246/:249/:253` | `(ENGINEERING-MODE.md §2.20.2)` · `(§1.12)` · `(ENGINEERING-MODE.md §2.20 — 一段一作者)`→`(一段一作者)` · `— §2.7` · `(§2.20.1)` · `(ENGINEERING-MODE.md §2.20.1/§2.20.3)` · `; ENGINEERING-MODE.md §2.20.1` · `(…, ENGINEERING-MODE.md §2.20.2)` · `(ENGINEERING-MODE-V2-MODULE-BATCH-SEGMENT.md §2.1#2)` · `(§2.20.1)` · `(§2.20.1)` · `(…; ENGINEERING-MODE.md §2.7/§2.20.1)` | 工具说明 + schema + 回模型错误串（段号 `§1`–`§6` **保留**——协议自名） |
| C19 | `agent-tools/escalate-async.mjs:125/:135` | `(report-level — not a gate; AGENT-LOOP.md §25 D-R17b)`→`(report-level — not a gate)` · `(… warning — not a gate; AGENT-LOOP.md §25 D-R17b round2 #4)`→`(… warning — not a gate)` | 回模型 decision 串 |
| C20 | `agent-tools/settings.mjs:80` | `(SETTINGS-TOOL.md §8.3; N-S1.5 completeness lock)` 整删（留 `— declare their real consumption shape`） | `console.warn`（人读 · 同因） |
| C21 | `agent-tools/spawn-gates.mjs:67` | `(ENGINEERING-MODE-V2-MODULE-DELEGATION §1.2 F2)` | 回模型拒发串 |
| C22 | `session-store.mjs:278/:355` | `(SESSION.md §14.4 D-R4)` | `console.error`（人读 · 同因） |
| C23 | `provider/responses.mjs:194` | `（PROVIDER.md §13.3 D10；provider.stateful=false 可退出）`→`（provider.stateful=false 可退出）` | 警告串（模型/用户可见；保留可操作半句） |

★ = §1.2 起点三处（本批必落项）。**裸形面**（§1.2 第 4 组）实测落点 = `subagent-panel.mjs:60/:102`（`§17.5.5`）· `subagent.mjs:153`（`§6.7.2`/`§2.6`）· `subagent-spawn.mjs:163`（`§1.2`）——均已在表内。

#### §2.4 机判锁设计（新增常驻测试档）

**落点**：`thincoder-cli/test/prompt-refs-zero.test.mjs`（新增档；跨包只读扫描面——先例 = `test/prompts-dual-source.test.mjs` / `test/doc-fnum-refs.test.mjs`）。

**域（常量）**：
- `PROMPT_FACES` = `thincoder-core/prompts/**` · `thincoder-core/tool-docs/**` · `docs/core/design/prompts/**`（`.md` 全文）。
- `CODE_ROOTS` = `thincoder-core/**` · `thincoder-cli/src/**` · `thincoder-vscode/src/**`（`.mjs`/`.js`/`.cjs`）；**排除** = `test/**` `_archive/**` `docs/**` `scripts/**` `node_modules` `.git` `.thincoder/**`。
- **代码档扫描算法**（行级）：跳过全行注释（`*` / `//` / `/*` 起首）→ 引号感知截断行尾 `//` 注释 → 正则扫描。

**判据三式**：
| 式 | 正则 | 允许/豁免 | 语义 |
|---|---|---|---|
| **J1** 档名引证 | `/[A-Z][A-Z0-9-]{2,}\.md/g` | 白名单 `{AGENTS.md, SKILL.md, README.md, MANIFEST.md}`（前三个 = 行为操作数；`MANIFEST.md` = manifest schema 数据锚 `manifest.mjs:156`，非模型面） | 域内零命中 |
| **J2** 节号引证 | `/§\s*(?:\d{2,}(?![\d\\.])|\d+\.\d)/g` | 段号形 `§1`–`§6` 天然不命中（正例面）；**转义点形**（`§19\.6`——正则字面量专属，域内仅 `thincoder-vscode/src/agent/setup-tooltable.mjs:157`）按**形态**豁免（非按文件行号——行漂不破） | 域内零命中 |
| **J3** 提示词面小写档名 | `/[a-z][a-z0-9-]*\.md/g` | 仅扫 `PROMPT_FACES`；路径形（`<…>` / `*` 紧邻 `.md`）与全大写形天然不命中 | 两面零命中 |

**失败输出**：逐条 `file:line token`（先红 → 后绿须可逐条对账）。
**用例表（夹具全内存 · 零落盘）**：

| 类 | 用例 | 输入 | 期望 |
|---|---|---|---|
| 正常 | T1 J1 命中 | 夹具串 `"… (AGENT-LOOP.md §11.2)"` | 报 1 条（`<夹具>:1 AGENT-LOOP.md`） |
| 正常 | T2 白名单 | `"read AGENTS.md"` / `join(dir, "SKILL.md")` | 零报 |
| 边界 | T3 段号正例 | `batch_segment 说明串`（`§1`–`§6` 混排） | J2 零报 |
| 边界 | T4 路径形 | `` `docs/batches/<batch>-<topic>.md` `` / `batches/*.md` / `design/<board>.md` | J3 零报 |
| 边界 | T5 转义点形 | `"/panel \(… — §19\.6\), /"` | J2 零报（形态豁免） |
| 边界 | T6 注释面豁免 | 行 `// (AGENT-LOOP.md §6.10)` 与 JSDoc `* §14.5 …` | 两式零报 |
| 错误 | T7 小写档名（P 面） | 夹具 `"pairs with common.md"` | J3 报 1 条 |
| 错误 | T8 裸形 | 夹具串 `"… (…… §17.5.5 …)"` | J2 报 1 条 |
| 实档 | T9 三式绿 | 真实域 | 三式 `deepStrictEqual(hits, [])`（本批落定后的常驻锁） |

**接口契约**：本批**不新增/不改动任何运行期接口**（零函数签名、零导出、零 schema 变更）；唯一新增物 = 上述测试档（只读扫描）。J1/J2/J3 的域 / 正则 / 白名单 = 锁的公开契约面，记录于 `docs/core/design/PROMPT-SYSTEM.md` §6.6。
**UI/交互**：无 UI 面（本批不涉任何交互、渲染、文案呈现变更——§2.3.2 各串为工具返回文本，形制与格式不动）。

#### §2.5 机判先红读数（as-of 2026-09-20 本设计轮 · 按 §2.4 判据实跑）

| 式 | 命中 | 档数 | 分布 |
|---|---|---|---|
| J1 | **65** | 23 | 提示词两面 8（EN 4 = `advisor-design`/`common`/`discipline-engineering`/`persona-engineering`，CN 同 4）+ 代码串 57（`subagent.mjs` 10 · `batch-segment.mjs` 8 · `subagent-spawn.mjs` 7 · `family-tools.mjs` 6 · `advisor.mjs` 4 · `spawn-child.mjs` 4 · `subagent-actions.mjs` 4 · `subagent-async.mjs` 4 · `escalate-async.mjs` 2 · `subagent-scheduler.mjs` 2 · `session-store.mjs` 2 · `advisor-async.mjs` 1 · `settings.mjs` 1 · `subagent-panel.mjs` 1 · `responses.mjs` 1） |
| J2 | **87** | 23 | 提示词两面 4（`discipline-engineering.md` EN+CN · `persona-engineering.md` EN+CN，各 1）+ 代码串 83（`subagent.mjs` 19 · `batch-segment.mjs` 14 · `subagent-spawn.mjs` 7 · `family-tools.mjs` 6 · `subagent-panel.mjs` 6 · `advisor.mjs` 5 · `spawn-child.mjs` 4 · `subagent-actions.mjs` 4 · `subagent-async.mjs` 4 · `agent/setup.mjs` 2 · `escalate-async.mjs` 2 · `subagent-scheduler.mjs` 2 · `session-store.mjs` 2 · VSC `agent/setup.mjs` 2 · `advisor-async.mjs` 1 · `settings.mjs` 1 · `spawn-gates.mjs` 1 · `responses.mjs` 1） |
| J3 | **39** | 18 | 全在提示词两面：EN 20（`advisor-design.md` 4 · `persona-coder.md` 3 · `persona-eng-coder.md` 3 · `persona-explore.md` 3 · `persona-eng-designer.md` 2 · `persona-plan.md` 2 · `advisor-round1/2/3.md` 各 1）+ CN 19（同构） |

**后绿期望**：处置表（§2.3）全落 ⇒ J1 = J2 = J3 = **0**；实施轮须**先跑一次机检留读数**（对账 §2.5），改后复跑取零。**豁免剔除说明**：J2 原始读数 88，其中 `thincoder-vscode/src/agent/setup-tooltable.mjs:157`（转义点形）按形态豁免 ⇒ 87。

#### §2.6 纪律面落点（§1.1 推论 3 · §1.4 ⑤）

**① 运行期纪律句（提示词面 · 两面各 +1 行）**——落 `common.md`「文档写作纪律」节（两模式共读层 · 写作纪律同族；**否决**单模式层 + 否决双落点 = D2 单一权威）：

- EN：`- **Prompt face — no document references**: never write doc names, section numbers or "see X" pointers into anything the model reads (prompt files, tool descriptions, schema text, strings returned to the model) — a prompt sentence must stand on its own; a reference is **deleted, never re-pointed** (citations belong in docs or comments, never in the model's context).`
- CN：`- **提示词面禁带文档引用**：模型读到的任何文本（提示词档 · 工具说明 · schema 文本 · 回给模型的串）里**不得出现文档引用**（档名 / 节号 / 指路句）——提示词句子须自足；引用**删（不以新址替换）**，出处写进档面或注释面。`

**② 设计面记录（唯一权威 · 本设计轮落笔）**：`docs/core/design/PROMPT-SYSTEM.md` 新增 **§6.6「提示词面禁带文档引用（2026-09-20 用户裁定 · 机判锁）」**——载裁定句 / 判据线（三条件 + 四保留面）/ 锁三式与域 / 豁免与白名单 / 边界（裸名与小写形机器不可分）。落笔同时加一行变更记录（日期 + 变更点，无流水账）。

#### §2.7 受影响文件表（行数为实读现值）

| 类 | 档 | 现行情数 | 预期增量 |
|---|---|---|---|
| 提示词面 EN ×12 | `advisor-design` 44 · `advisor-round1` 42 · `advisor-round2` 47 · `advisor-round3` 43 · `common` 157 · `discipline-engineering` 124 · `persona-coder` 22 · `persona-eng-coder` 42 · `persona-eng-designer` 81 · `persona-engineering` 161 · `persona-explore` 16 · `persona-plan` 28 | —— | **±0 行**（`common.md` +1 纪律行除外） |
| 提示词面 CN ×12 | `advisor-design` 74 · `advisor-round1` 71 · `advisor-round2` 62 · `advisor-round3` 59 · `common` 119 · `discipline-engineering` 121 · `persona-coder` 19 · `persona-eng-coder` 42 · `persona-eng-designer` 81 · `persona-engineering` 162 · `persona-explore` 16 · `persona-plan` 27 | —— | 同上 |
| 生产码 core ×17 | `family-tools` 175 · `agent/setup` 235 · `spawn-child` 259 · `advisor-async` 482 · `advisor` 281 · `batch-segment` 266 · `escalate-async` 303 · `settings` 269 · `spawn-gates` 110 · `subagent-actions` 496 · `subagent-async` 457 · `subagent-panel` 161 · `subagent-scheduler` 447 · `subagent-spawn` 479 · `subagent` 420 · `provider/responses` 496 · `session-store` 442 | —— | **±0 行**（全为行内删字） |
| 生产码 VSC ×1 | `src/agent/setup.mjs` 496 | —— | **±0 行** |
| 测试 ×2（同步断言） | `thincoder-cli/test/subagent-observe-send.test.mjs` 331 · `thincoder-vscode/test/async-parity.test.mjs` 486 | —— | **±0 行**（只改期望串） |
| 测试 ×1（新增） | `thincoder-cli/test/prompt-refs-zero.test.mjs` | 0 | +≈110 行（新档，不触 500 硬限） |
| 设计档 ×1 | `docs/core/design/PROMPT-SYSTEM.md` 338 | —— | +≈14 行（§6.6 + 变更记录 1 行） |

**贴线档提示**：`subagent-actions.mjs` 496 · `provider/responses.mjs` 496 · VSC `agent/setup.mjs` 496（距硬限 500 各 4 行）——本轮**零增行** ⇒ 无越限风险；**无跨档拆分需求**（无档越 500）。
**笔与落地**：提示词两面 = 主 agent 内容权威 + eng-coder 落地（D1）；生产码 + 测试 = eng-coder；`PROMPT-SYSTEM.md` §6.6 = 设计席（本设计轮已落，见 §5 之前档面记录）。

#### §2.8 验收标准（逐条机判 · 全 ASCII 命令）

| AC | 判据 | 命令 / 读数 |
|---|---|---|
| **AC1** | 机判三式全绿（J1 = J2 = J3 = 0） | `cd D:\teamcode\thincoder\thincoder-cli && node --test test/prompt-refs-zero.test.mjs` → exit 0（T9 实档用例零命中） |
| **AC2** | 先红读数可复现且与 §2.5 一致（65 / 87 / 39） | 实施轮改前跑同档取读数，落批档 §5 对账（差异须逐条解释） |
| **AC3** | 三包全绿 | `cd thincoder-core && npm test` · `cd thincoder-cli && npm test` · `cd thincoder-vscode && npm test` → 各 exit 0 |
| **AC4** | 起点三处清零 | `grep -rn` 三模式（`AGENT-LOOP.md §11.2` / `AGENT-LOOP.md §11.1` / `AGENT-LOOP-SUBAGENT.md §6.7.2`）在**字符串面**零命中（注释面豁免） |
| **AC5** | 纪律句在位（两面各 1 行）+ §6.6 在位 | 逐档实读（读回核验；**不写为常驻散文锚测试**——测试纪律禁） |
| **AC6** | 机械约束零破坏 | `cd D:\teamcode\thincoder && node scripts/doc-check.mjs` → exit 0（锚 / 行宽）；提示词两面机检（双源头注正则 / `##` 块计数）随 AC3 覆盖 |
| **AC7** | 交付报告五段（§1.4 格式①–⑤）齐 + 逐处 `file:line` | 报告面核 |

#### §2.9 边界（本批**不做**）

1. **不动注释面**（`//` / `/* */` / JSDoc——#149 族在跑；本批不吞并、不代改）。
2. **不动行为**：删引证 ≠ 改址；不改任何串的结论 / 判定 / 匹配语义；不改段号 `§1`–`§6` 与路径操作数；不修 VSC 正则（§2.10 F2）。
3. **不新增提示词语义**（除 §2.6 纪律 1 行）；不顺带重写、不顺带瘦身。
4. **不碰**：归档面 · `scripts/**` · 冻结批档 · 他批写域 · 测试面（除两处断言串同步）· `docs/**` 其余档。
5. **不改需求档**（本批无需求档条目——判据源 = 用户裁定 + 台账 #147；三链同源 = 裁定 → §2 → AC）。

#### §2.10 不一致处 / 发现（只报不动 · 交父侧登记）

| # | 发现 | 处置 |
|---|---|---|
| F1 | `agent/family-tools.mjs:111-124` 的 explore 工具说明为**三元分支**（eng-designer / eng-coder / 通用），两分支文案近乎重复——结构债（非本批引入） | 只报（本批仅删引证） |
| F2 | `thincoder-vscode/src/agent/setup-tooltable.mjs:157` 正则 `/panel \(view … — §19\.6\), /` **已陈旧**（核文现为 `§6.7.2`）⇒ 该剥离规则今日**恒不命中**（VSC 的 `action` 说明仍带 panel 提法）；本批只报不动——**正则字面量非模型可见串**，修之 = 行为面改动（须另裁） | 只报 + 建议登记技术待办 |
| F3 | 判保留面**判断项**：`docs/README.md`（文档地图探测址）判「路径操作数」保留——若评审按纯文义读为「文档引用」，则须改为层名表述（`the project document map`）；本设计席按 §2.1 判据 2 判保留 | 请评审裁（默认判保留） |
| F4 | 模板↔落地两面（D1/D3）**无机械同源锁**（M9 gap 在册 · 台账 #25）——本批同批改两面，但两面日后仍可漂 | 只报（M9 缺口非本批） |
| F5 | 域内**裸档名**（无 `.md`：`SUBAGENT-OBSERVE-SEND` 等）机器不可分（与代码标识符同形）⇒ 机判锁不覆盖裸名 | 本批靠处置表（C14）覆盖 + §6.6 边界登记 |
| F6 | 测试面同因残留（测试名 / 注释引档，如 `prompts-async-guidance.test.mjs:53`）——非模型可见 | 不在本批；仅同步两处**断言串**（§2.7 测试 ×2） |
| F7 | 本批**不涉及** `docs/core/design/prompts/**` 之外的中文档面；#149 扩面族（VSC §11.x/§12.x 注释面绑定待核）与本批同因不同面 | 界已立（§2.1 排除面）· 不吞并 |

#### §2.11 关键决策记录（含否决备选）

| KD | 决策 | 理由 / 否决 |
|---|---|---|
| KD1 | 判据式取**大写档名形** `[A-Z][A-Z0-9-]{2,}\.md` 为 J1 主锁 | 否决 `/\.md\b/` 全域零命中（会连带打死扩展名 / 路径 / loader 操作数——行为面）；否决「改址」方案（用户口径 = 删） |
| KD2 | 机判锁落**测试档**（`thincoder-cli/test/prompt-refs-zero.test.mjs`） | 否决根 `scripts/**`（本批禁改工程工具面）；测试档为仓内既有机检先例落点 |
| KD3 | 白名单 = 行为操作数 + `MANIFEST.md` 数据锚；J2 以**形态**豁免转义点形 | 否决「零例外」写法（迫使删 `AGENTS.md` 行为指令 = 行为改动）；否决按文件行号豁免（行漂即破） |
| KD4 | 纪律句落 `common.md`（两模式共读层） | 否决 `discipline-engineering.md`（单模式可见）；否决双落点（D2 单一权威源） |
| KD5 | 中文面（D3）**同批**处置 | 否决只改英文面（同类残留会以中文面为活口重现；两面同构、判据对称） |
| KD6 | 处置法统一 = **删引证括注**（保留括注内行为句） | 否决改写为描述性长句（夹带新语义风险）；否决保留形（用户口径「清干净」） |

### §2.12 修正轮（fix · 评审 id=17 · VERDICT changes-required——§3 发现 1..15 逐条落）

**轮次**：fix（定点 · 追加制）· **依据** = §3 发现表 1..15（父侧逐条裁定：全接受 · `Suggestion` 列 = 处置建议，处置执行人 = 本席面）。
**记法约定（#14）**：本条起，域标写 `域D1`–`域D6`，纪律标写 `纪律D1`–`纪律D8`（DOC-DISCIPLINE §1）；两者此前同形 `D<n>`，读旧文按此约定区分。
**「处」口径（#10）**：「处」= 位点（逐 file:line 计，同档多行按位点计）；「档」= 文件数。
**机检基线（本轮实跑）**：`node scripts/doc-check.mjs --root .` → 锚 0 悬空 · 行宽 0 · exit 0（净增 0 ✓）。

#### §2.12.1 逐条处置表（发现号 → 改动 file:line / 修正内容）

| # | 处置（Suggestion 逐条执行） | 改动 file:line |
|---|---|---|
| 1 🔴 | **纪律句收正**：限定为「引证 / 指路句」一侧（不再一律禁档名 / 节号）+ 写入**操作数豁免句**（与判据 2 对齐）；**禁面边界单一承载** = §6.6；三面（纪律句 / 判据线 / 锁白名单）逐字一致（读数 §2.12.2）。纪律句定稿 = §2.12.2（EN 折两行 / CN 单行，量宽 §2.12.5）。 | `docs/core/design/PROMPT-SYSTEM.md:194`（判保留面改**操作数族规范豁免串**）· `:201`（J1 白名单同串）· 纪律句定稿 = 本档 §2.12.2 |
| 2 🟡 | **J2 档数 23 → 22**（枚举 = 提示词两面 4 + 代码 18；与 §2.7 生产码 17 + VSC 1 对平）。 | 本档 §2.12.2 附账（原 §2.5 J2 行 `:177` 档数值——以修正条为准） |
| 3 🟡 | **先红口径 = 仅跑 §2.4 三式**；`88` 来源实证 = **未含转义点守卫的探针**（`§\s*(?:\d{2,}|\d+\.\d)`）⇒ 域内 +1 = `thincoder-vscode/src/agent/setup-tooltable.mjs:157`（`§19\.6`）；守卫（`(?![\d\\.])`）成立后该处**天然不命中** ⇒ J2 终值 87；T5 期望不变（零报）；「按形态豁免」并入守卫注（非独立规则）。 | `docs/core/design/PROMPT-SYSTEM.md:202`（守卫注）· 本档 §2.12.2 附账 |
| 4 🟡 | `subagent-spawn.mjs:163` 定性 = **坐标误记**（该档 §-命中 7 处 · 无 `§1.2`；实为 **`subagent.mjs:163`**——`round` 参数 schema 串内 `(ENGINEERING-MODE-V2-MODULE-DELEGATION §1.2 F2)` = **外部引证 · 字符串面**）⇒ C14 补该片段（**读数不变**：已在 J1 10 / J2 19 内）；**类 4 边界改按指称**（+ 写明两段形归属）。 | 本档 §2.12.3（C14 补行 + 逐行计数）· `docs/core/design/PROMPT-SYSTEM.md:194`/`:202`（指称判据） |
| 5 🟡 | **逐行 hit 计数表**（C1–C23 逐行 J1/J2 + 与 §2.5 合计对账：57 / 83 全等）。 | 本档 §2.12.3 |
| 6 🟡 | **AC4 收正**：写明扫描面 / 排除项 + 以面感知读数承接。 | 本档 §2.12.4 |
| 7 🟡 | **补 AC8**（纪律 D8 自查——承接 §1.4⑥）。 | 本档 §2.12.4 |
| 8 🟡 | **行宽口径定**：新增 / 改写行 **≤300 字符**（机检面 = doc-check `docs` 域；核包提示词面同口径逐行量宽自查）；EN 纪律句折两行 · CN 单行 ⇒ 口径内（读数 §2.12.5）。 | 本档 §2.12.2 / §2.12.5 |
| 9 🟡 | C15 / C16 **改后文**（引证 + 行为混排括注逐行给保留半句）。 | 本档 §2.12.6 |
| 10 🔵 | **「处」口径**（见首部）；**D5 = 5 处 / 4 档**（4 处置 + 1 判保留）· §2.2 结论 D5 项改「3 档 4 处待处置 + 1 处判保留」。 | 本档 §2.12.1 本行 / §2.2 结论 `:87`（以修正条为准） |
| 11 🔵 | §6.6 边界清单**登记 J3 覆盖缺口**（代码串面小写档名实测 61 处——绝大多数 = 槽 loader key / 落点操作数）。 | `docs/core/design/PROMPT-SYSTEM.md:207` |
| 12 🔵 | P4–P6 **CN 改后文并列**。 | 本档 §2.12.7 |
| 13 🔵 | **人读面外沿**：日志 / 告警在内；CLI usage/help 等其余用户可见文案 = **界外**（实测零命中）。 | `docs/core/design/PROMPT-SYSTEM.md:198` |
| 14 🔵 | `D<n>` 加前缀区分（域标 `域D<n>` / 纪律标 `纪律D<n>`）——约定见首部，本条起为准。 | 本档 §2.12 首部 |
| 15 🔵 | **登记制核对**：PROMPT-SYSTEM **D-PS1–D-PS6 在册** ✓（登记制成立）；D-PS6 已登记但误置 §6.6 区 ⇒ **移入 §7 决策表**；**另**：本批设计轮误加一枚 D-PS5 重复行（§7 已有同文）⇒ 删除。§2.6② 补记 = 落点决策号 **D-PS6**。 | `docs/core/design/PROMPT-SYSTEM.md:221`（D-PS6 入表）· 误加重复行已删（原 `:197`）· §2.6② 补记 = 本行 |

#### §2.12.2 纪律句定稿（#1）· 三面逐字一致读数（C2）· 附账（#2 / #3 / #10）

**规范豁免串（CANON · 三面逐字一致的本体）**：
`AGENTS.md` · `SKILL.md` · `README.md` · `MANIFEST.md` · `.thincoder/advisor.md` · `project_rules.md`

**甲、纪律句定稿（落 `common.md`「文档写作纪律」节——写入权 = 主 agent 内容权威 + eng-coder 落笔）**：

- EN（折两行 · 逐行量宽 247 / 224 字符）：
  `- **Prompt face — no document references**: never cite a doc name, a section number or a "see X" pointer in anything the model reads — a sentence must stand on its own; citations are **deleted, never re-pointed** (they belong in docs or comments).`
  `  **Operand exemption** (kept as-is): `AGENTS.md` · `SKILL.md` · `README.md` · `MANIFEST.md` · `.thincoder/advisor.md` · `project_rules.md` · path forms · the `".md"` literal · this protocol's own section labels (`§1`–`§6`).`
- CN（单行 · 量宽 279 字符）：
  `- **提示词面禁带文档引用**：模型读到的任何文本（提示词档 · 工具说明 · schema 文本 · 回给模型的串）里不得出现**引证**（档名 / 节号 / 指路句）——提示词句子须自足；引用**删（不以新址替换）**，出处写进档面或注释面。**操作数豁免**：`AGENTS.md` · `SKILL.md` · `README.md` · `MANIFEST.md` · `.thincoder/advisor.md` · `project_rules.md` · 路径形 · `".md"` 字面量 · 本协议自身段号（`§1`–`§6`）保留。`

**乙、其余两面（已落 PROMPT-SYSTEM.md）**：判据线 / 判保留面 = `docs/core/design/PROMPT-SYSTEM.md:194`；锁白名单（J1）= `:201`；决策登记 = `:221`（D-PS6）。

**三面逐字一致读数（机判 · 本轮实跑）**：CANON 串在五处文本中**逐字命中**——① 纪律句 EN（本条甲）✓ ② 纪律句 CN（本条甲）✓ ③ §6.6 判保留面（`PROMPT-SYSTEM.md:194`）✓ ④ §6.6 J1 白名单（`:201`）✓ ⑤ D-PS6 登记行（`:221`）✓；`includes()` 逐字比对（脚本读数 · 全 true）。三面口径冲突项零（§2.4 原 `:150` 四名枚举 ⊂ CANON 六名——子集，非冲突；以本条为准）。

**附账 #2**：J2 档数收正 = **22**（提示词两面 4 = `discipline-engineering.md` EN/CN + `persona-engineering.md` EN/CN · 代码 18 = §2.5 代码枚举逐档点数）。J1 档数 23（8 + 15）不变 ✓。
**附账 #3**：先红读数 = **只跑 §2.4 三式**：J1 65（提示词 8 + 代码 57）· J2 **87**（提示词 4 + 代码 83）· J3 39（提示词 20 + 19）。`88` = **未含转义点守卫的探针**（`§\s*(?:\d{2,}|\d+\.\d)`）读数——差 1 = `thincoder-vscode/src/agent/setup-tooltable.mjs:157`（`§19\.6`）；守卫成立 ⇒ 该处天然不命中 ⇒ 88/87 与 T5 三方自洽（T5 保持零报）。
**附账 #10**：D5 = **5 处 / 4 档**（`settings.mjs:80` · `session-store.mjs:278` · `session-store.mjs:355` · `provider/responses.mjs:194` · `advisor/project-context.mjs:103`）；处置 = 4 处 / 3 档 + 1 处判保留（`project-context.mjs:103`——`AGENTS.md` 行为操作数）。

#### §2.12.3 逐行 hit 计数表（#5 · #4——按 §2.4 算法实跑，与 §2.5 合计对账）

| C | 逐行（J1×n / J2×n） | 合计 J1 / J2 |
|---|---|---|
| C1–C5 | `advisor.mjs` :48 ×1/×1 · :50 ×1/×1 · :75 ×0/×1 · :89 ×1/×1 · :167 ×1/×1 | 4 / 5 |
| C6 | `advisor-async.mjs` :369 ×1/×1 | 1 / 1 |
| C7 | `subagent-async.mjs` :116 ×1/×1 | 1 / 1 |
| C8 | `subagent-async.mjs` :247 ×1/×1 · :251 ×1/×1 · :290 ×1/×1 | 3 / 3 |
| C9 | `subagent-actions.mjs` :111/:242/:294/:309 各 ×1/×1 | 4 / 4 |
| C10 | `subagent-panel.mjs` :60 ×0/×1 · :88 ×1/×1 · :102 ×0/×1 · :134 ×0/×1 · :136 ×0/×1 · :137 ×0/×1 | 1 / 6 |
| C11 | `subagent-scheduler.mjs` :195/:321 各 ×1/×1 | 2 / 2 |
| C12 | `subagent-spawn.mjs` :226/:232 各 ×1/×1 | 2 / 2 |
| C13 | `subagent-spawn.mjs` :408/:414/:419/:425/:433 各 ×1/×1 | 5 / 5 |
| C14 | `subagent.mjs` :126 ×1/×2 · :128 ×1/×2 · :131 ×1/×1 · :132 ×1/×1 · :143 ×2/×4 · :144 ×1/×1 · :153 ×0/×4 · **:163 ×0/×1（修正轮补）** · :164 ×2/×2 · :188 ×1/×1 | 10 / 19 |
| C15 | `family-tools.mjs` :111 ×1/×1 · :112 ×1/×1 · :123 ×2/×2 · :124 ×2/×2 | 6 / 6 |
| C16 | `spawn-child.mjs` :54 ×2/×2 · :57 ×1/×1 · :63 ×1/×1 | 4 / 4 |
| C17 | `agent/setup.mjs` :200/:202 各 ×0/×1 · VSC `agent/setup.mjs` :389/:391 各 ×0/×1 | 0 / 4 |
| C18 | `batch-segment.mjs` :73 ×1/×1 · :168 ×0/×1 · :196 ×1/×1 · :200 ×0/×1 · :208 ×0/×1 · :221 ×1/×2 · :228 ×1/×1 · :231 ×1/×1 · :237 ×1/×1 · :246 ×1/×1 · :249 ×0/×1 · :253 ×1/×2 | 8 / 14 |
| C19 | `escalate-async.mjs` :125/:135 各 ×1/×1 | 2 / 2 |
| C20 | `settings.mjs` :80 ×1/×1 | 1 / 1 |
| C21 | `spawn-gates.mjs` :67 ×0/×1 | 0 / 1 |
| C22 | `session-store.mjs` :278/:355 各 ×1/×1 | 2 / 2 |
| C23 | `responses.mjs` :194 ×1/×1 | 1 / 1 |
| **合计** | —— | **57 / 83**（= §2.5 代码面读数 ✓） |

**C14 补行（#4）**：`subagent.mjs:163` 补入片段 = `(ENGINEERING-MODE-V2-MODULE-DELEGATION §1.2 F2)`（`round` 参数 schema 说明串尾 · 整删——纯引证）；⇒ C14 = **十一片段 / 十行**（行级计数见上表 · 读数不变）。

#### §2.12.4 验收标准收正（#6 / #7）

| AC | 判据（收正后） |
|---|---|
| **AC4**（收正） | 起点三处清零——**面感知**：域 = §2.4 三式同域（`CODE_ROOTS` + `PROMPT_FACES`；排除 `test/**` · `_archive/**` · `node_modules/**` · `.thincoder/**`，代码档按 §2.4 算法剥离注释行；本批档 `docs/batches/**` 天然出界——checkConfig.exclude）；读数承接 = `cd D:\teamcode\thincoder\thincoder-cli && node --test test/prompt-refs-zero.test.mjs`（T9 实档用例 · 三串含于 J1/J2 判据面）+ `grep` 工具同域复扫（排除项同上）。 |
| **AC8**（新增） | **纪律 D8 自查**（失效表达必删——承接 §1.4⑥）：本批全部新增 / 改写行逐行实读（D6 回读）零修订式表达（无 `~~划改~~` · 无「原记 X ⇒ 收正 Y」 · 无挂尸）；机扫辅证 = 本批改动档 `~~` 零命中。 |

#### §2.12.5 量宽与机检读数（#8 · C3 / C4）

- **行宽口径（#8 定）**：本批**新增 / 改写行 ≤300 字符**（判据面 = doc-check `lineWidth`；机检扫描域 = `docs/**`（batches 除外）；核包提示词面（`thincoder-core/prompts/**`）不在机检域——按同口径逐行量宽自查）。
- **逐行量宽（本轮实跑）**：EN 纪律句 247 / 224 · CN 纪律句 279（≤300 ✓）；PROMPT-SYSTEM §6.6 全部新增 / 改写行 ≤300（doc-check 行宽 0 命中 ✓）。
- **机检（本轮实跑）**：`node scripts/doc-check.mjs --root .` → 汇总「悬空 0」· `OK(锚)` · `OK(行宽)` · exit 0。

#### §2.12.6 C15 / C16 改后文（#9——引证 + 行为混排括注逐行给保留半句）

| 位 | 旧片段 | 改后文 |
|---|---|---|
| `family-tools.mjs:111` | `(ENGINEERING-MODE.md §2.15 D; ≤6 spawns per batch)` | `(≤6 spawns per batch)`——**保行为半句** |
| `family-tools.mjs:112` | `(AGENT-LOOP.md §18 D-E3)` | 整删（句尾）⇒ `…read-only divergence audits."` |
| `family-tools.mjs:123` | `(ENGINEERING-MODE.md §2.15 D)` | 整删 ⇒ `…SURVEY the current state for the design: it reads code…` |
| `family-tools.mjs:123` | `(AGENT-LOOP.md §19)` | 整删 ⇒ `…are not available. Survey budget: ≤6 explore spawns per batch…` |
| `family-tools.mjs:124` | `(AGENT-LOOP.md §18 D-E2 ③)` | 整删 ⇒ `…against the design: it compares the delivered code…` |
| `family-tools.mjs:124` | `(AGENT-LOOP.md §19)` | 整删 ⇒ `…are not available. The audit task book is appended MECHANICALLY…` |
| `spawn-child.mjs:54` | `(AGENT-LOOP.md §18 D-E3, ENGINEERING-MODE.md §2.15 D)` | 整删 ⇒ `…solely for read-only work (the eng-coder divergence audit / the designer's own survey)` |
| `spawn-child.mjs:57` | `(AGENT-LOOP.md §18 D-E3)` | 整删 ⇒ `…only available at the top level` |
| `spawn-child.mjs:63` | `(AGENT-LOOP.md §18: max 5 fix rounds; the 7th audit spawn is refused mechanically)` | `(max 5 fix rounds; the 7th audit spawn is refused mechanically)`——**保行为半句** |

#### §2.12.7 P4–P6 中文面改后文（#12——与 EN 改后文并列）

| 位 | 旧 | 改后文（CN） |
|---|---|---|
| P4 `docs/core/design/prompts/common.md:119` | `**结构权威**：段结构 / 门禁 / 生命周期 → `

（承接上行：§2.12.7 首表行于上行截断〔append-only 不可回改〕——下表完整重出）

| 位 | 旧 | 改后文（CN） |
|---|---|---|
| P4 `docs/core/design/prompts/common.md:119` | `**结构权威**：段结构 / 门禁 / 生命周期 → `design/BATCH-RECORD.md`（本节只给全图，不重述机制）。` | `**结构权威**：段结构 / 门禁 / 生命周期由**项目自身的批次档机制**定义（本节只给全图，不重述机制）。` |
| P5 `docs/core/design/prompts/discipline-engineering.md:110` | `…前批遗留核对**——条目已完成而挂靠批档未收口 ⇒ 兜底核销路径 = `design/BATCH-RECORD.md` §5.2）/ **台账可见面（收口行）**。` | `…前批遗留核对**——条目已完成而挂靠批档未收口 ⇒ 兜底核销路径）/ **台账可见面（收口行）**。` |
| P6 `docs/core/design/prompts/persona-engineering.md:131` | `…⇒ 走**兜底核销路径**（`design/BATCH-RECORD.md` §5.2）。` | `…⇒ 走**兜底核销路径**。` |

（P4 与 §2.3.1 的 EN 改后文同构：「项目自身的批次档机制」↔ `the project's own batch-record mechanism`。）

#### §2.12.8 新发现（只报不动 · 交父侧）

| # | 发现 | 证据 | 建议 |
|---|---|---|---|
| N1 | `docs/core/design/PROMPT-SYSTEM.md` §10.2 表**行 13（`persona-explore` · 3/3 对齐）缺失**——表题「15 对」与实存 14 行不符（纪律 D3 计数 / 枚举）。 | 工作区未提交改动：`git diff` 该档显示 `-| 13 | …persona-explore… |` + 留空行；HEAD 行在。**归属未证**（与本批 §6.6 改动同处一未提交工作区，但非本批任何发现所导出）。 | 父侧同轮一行回填（零语义 · 可 revert）；本修正轮按「只改必要处」未动 |
| N2 | **面级指路句 2 处**：`thincoder-core/prompts/common.md:149`（`field meanings and lifecycle usage → the engineering-mode prompts`）· `docs/core/design/prompts/common.md:112`（`…→ 见工程模式提示词`）——对象 = 提示词**面**（无档名 / 无节号），§2.3.1 无处置行；三式均不命中。 | 实读两档；已登记入 §6.6 边界「面级指路句」（`PROMPT-SYSTEM.md:208`） | 处置待裁（删 / 判保留——判保留须与 §6.6 边界登记同尺）；本修正轮未动 |
| N3 | 本轮 §2.12.7 首表行追加截断（见上行承接条）——内容已完整重出；残片留档。 | 本档 `:355` | 报告面已同步；如需清残片 ⇒ 父侧（§2 段作者 = 本席面，工具为 append-only） |

#### §2.12.9 修正轮完成度

- **C1**：§3 发现 1..15 逐条落 ✓（处置表 §2.12.1——15/15，无未落项、无不成立项）。
- **C2**：三面逐字一致（CANON 串五处逐字命中 · `includes()` 全 true ✓，读数 §2.12.2）。
- **C3**：`node scripts/doc-check.mjs --root .` → 锚 0 悬空 · 行宽 0 · exit 0（净增 0 ✓）。
- **C4**：新增 / 改写行量宽全 ≤300 ✓（EN 247 / 224 · CN 279 · PROMPT-SYSTEM 新增行全绿）。

#### §2.13 判据面补注轮（fix · eng-coder #24 上抛 · 父侧裁定候选 A · 2026-09-20 20:2x）

**依据**：实施轮上抛 eng-coder #24——**J3 式与纪律句互斥**：J3（`[a-z][a-z0-9-]*\.md` 无白名单 ✗）命中纪律句自身（EN 续行 `advisor.md`·`rules.md` + CN 同 2 = 4 处 ✗）；§6.6:201 只核「J1 天然不命中」漏 J3 ✗ ⇒ AC1「三式全 0」与 AC5「纪律句在位」不可同时成立 ✗。
  父侧裁定 = **候选 A**：J3 加 CANON 操作数串豁免（逐行先删六名 CANON 操作数子串再扫 ✓ 与 J1 白名单同构 ✓）。**判据语义不变**：豁免 = §2.1 判据 2「保留面四类·操作数」的显式化，非新语义（轮 2 复核 id=23 已确认该判据）；纪律句逐字稿不动（六名 CANON 本就含）。

**① §2.4 J3 行补豁免判据（补注）**：J3 扫描前**逐行先整串删除六名 CANON 操作数子串**（`AGENTS.md` · `SKILL.md` · `README.md` · `MANIFEST.md` · `.thincoder/advisor.md` · `project_rules.md`——与 J1 白名单同构同串），再以 `[a-z][a-z0-9-]*\.md` 扫剥离后行文；路径形（`<…>` / `*` 紧邻 `.md`）与全大写形天然不命中不变。
  可机判式（全 ASCII）：`for s of CANON: line = line.split(s).join(""); then scan [a-z][a-z0-9-]*\.md`。豁免面外同形 token（非 CANON 小写档名引证）照报 ✓。

**② AC1 口径注 + 实测留痕（本轮实跑 · 2026-09-20 20:2x）**：J3 后绿读数 = **豁免后 0**（CANON 剥离后扫零命中）。实测留痕——
- **互斥复现（§2.12.2 纪律句定稿逐字稿上实跑）**：EN 续行豁免前 2 tokens（`advisor.md`·`rules.md`——J3 子串匹配自 `.thincoder/advisor.md` / `project_rules.md`，`_`/`/` 不在 `[a-z0-9-]` 字符类）· CN 单行同 2 = **4 处** ✓；候选 A 豁免后两面各 **0** ✓。
- **落定终态模拟**（P 面非 CANON 引证已清 + 纪律句 EN 2 行 / CN 1 行 + 槽注行无档名）：豁免前 raw=4 · **豁免后 = 0** ⇒ AC1「三式全 0」与 AC5「纪律句在位」**可同时成立** ✓。
- **AC1 对账口径**：实施轮后绿读数按**豁免后**值核（AC2 的先红对账同口径——§2.5 的 J3=39 为无豁免形读数，落定态账目以本条为准）。

**修正记录（本条四要素齐）**：裁定来源 = 实施轮上抛 eng-coder #24 · 处置 = 父裁候选 A（J3 加 CANON 操作数串豁免 · 判据语义不变）· AC1 口径注 = J3 后绿读数 = **豁免后 0** ·
  豁免前实测留痕 = 纪律句逐字稿 EN/CN 各 2 tokens（共 4 处）· 落定终态模拟 raw=4 → 0。

#### §2.14 需求-设计两界回指微轮（fix · 定点追加 · 2026-09-20 20:35 · 用户 20:34 裁定承接）

**依据**：用户 20:34「这个说明（提示词与文档分属两界）应该进提示词系统的需求和设计文档，免得以后 agent 又把二者串了」。**需求面已由主 agent 落**：`docs/core/requirements/PROMPT-SYSTEM.md` §4 **第 16 条**（判据 + 合法所指白名单五类 + 写前自查 · 行 169–175；变更记录行 199 · 20:34 增补）；**本微轮 = 设计面承接**（三处定点 · `docs/core/design/PROMPT-SYSTEM.md`）。

**三处逐处表（D6 回读 ✓）**：

| 处 | 位 | 改动 |
|---|---|---|
| ① | `docs/core/design/PROMPT-SYSTEM.md:192`（§6.6 头部 · 裁定行后新增一行） | **上位原则回指**：「需求面第 16 条（`docs/core/requirements/PROMPT-SYSTEM.md` §4-16）= 本节判据的上位原则——**提示词与文档分属两界**：运行时环境读不到文档 ⇒ 提示词内一切文档引用 = **运行时死文本**；合法所指白名单（五类）见需求条，本节不重述（纪律D2）」——只回指 + 一句定位，**不重述判据全文**（D2 ✓ 判据全文在需求条） |
| ② | `docs/core/design/PROMPT-SYSTEM.md:209`（§6.6 边界清单「面级指路句」条） | **状态收口**：「存量 2 处 = 只报项（处置待裁）」→「存量 2 处已裁 = **删**（用户 2026-09-20 20:30「这种话都不应该出现在提示词里」）——两面已落（`d2181dae`），域内现余 0」；`d2181dae` 实证 = `git show --stat`（20:31 · `thincoder-core/prompts/common.md` + `docs/core/design/prompts/common.md` 台账节删除 ✓ 两面 N2 处置在档） |
| ③ | `docs/core/design/PROMPT-SYSTEM.md:320`（变更记录 +1 行） | 「2026-09-20（**需求-设计两界回指微轮 · eng-designer · fix** · 用户 20:34 裁定…）：§6.6 头部补上位原则回指…边界「面级指路句」收正为已裁 = 删（用户 20:30 · 两面已落 `d2181dae`）」——同日 · 同因（两界原则回指 + N2 收口） |

**机检读数（本轮实跑）**：`node scripts/doc-check.mjs --root .` → **锚悬空 0**（OK(锚) ✓）；**本席改域（design 档）行宽 0 命中**——唯一行宽命中 = `docs/core/requirements/PROMPT-SYSTEM.md:199`（371 字符 · **需求档 · 主 agent 20:34 落笔行**，本席零触面 · 本轮改动前已存在，非本微轮引入）；新增 / 改写三行逐行量宽 = 162 / 148 / 218 字符（≤300 ✓）。**基线对照**：本轮改动前同命令同读数（基线即含需求档 :199 行宽 1 红）⇒ **本微轮净增 = 0** ✓。
**边界遵守**：需求档 / 产品码（#24 实施在跑）/ `scripts/**` / 他批写域 / §10.2 行 13（N1）零触 ✓；J3 豁免口径未动（§2.13 定稿）✓；机判三式口径未动 ✓。
**D8 自查**：新增 / 改写行逐行实读零修订式表达（「存量 2 处 = 只报项（处置待裁）」旧句 = 处置表引用旧文（处置依据），非规范面残留 ✓；新行无 ~~划改~~ / 无「原记 X ⇒ 收正 Y」体 ✓）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

轮次 initial · 目标 = 提示词引用清零批（#147）批档 §2 全段（`thincoder/docs/batches/2026-09-20-prompt-refs-zero-batch.md`，下表 `:N` 均指该档）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership | 🔴 | §2.6① 纪律句（`:186`/`:187`）把档名/节号/指路句一律禁入模型面、无操作数豁免；而 §2.1 保留面（`:69`）、§2.3.1 处置后白名单（`:106`）、J1 白名单（`:150`）在同批中把 `AGENTS.md`/`SKILL.md`/`docs/README.md`/`.thincoder/advisor.md` 这类档名留在两面。落定后 `common.md`（规制模型面）与 PROMPT-SYSTEM §6.6（将载判据线+四保留面，`:189`）对同一机制给出两种禁面口径，机判锁白名单又与纪律句相反 ⇒ 同一机制两处不同写法；后续照纪律句办事会删行为操作数（动行为）。 | 把纪律句限定为「引证/指路句」一侧，或写入操作数豁免句与 §2.1 判据 2 对齐；禁面边界由 §6.6 单一承载，纪律句/判据线/锁白名单三面逐字一致。 |
| 2 | Acceptance（对账） | 🟡 | §2.5 J2 行「档数 23」（`:177`）与同行枚举不符：提示词两面 4 档 + 代码 18 档 = 22（18 档与 §2.7 生产码 17+VSC 1 对平）；J1 行 23 = 8+15 可对平（`:176`）。 | 改数或补档，使 AC2 对账基线自洽。 |
| 3 | Acceptance（可复现性） | 🟡 | T5 期望「转义点形 `§19\.6` J2 零报」（`:163`）与 §2.4 正则字面语义一致（`\` 属 `[\d\\.]` 排除类、`\d+\.\d` 需实点 ⇒ 不命中）；但 §2.5 豁免说明（`:180`）称该位点计入原始读数 88、豁免后 87。二者必有一处与实跑不符：若 88 来自别的判据式，则「按 §2.4 判据实跑」不成立、先红不可复现；若该处本不命中，则豁免规则多余。 | 先红轮只跑 §2.4 所列三式并写明 88 的来源，使 88/87、豁免规则、T5 三者一致。 |
| 4 | Coverage（实勘/处置） | 🟡 | ★ 注（`:136`）自列「裸形面实测落点…`subagent-spawn.mjs:163`（`§1.2`）——均已在表内」，但 C 表无该行（C12 为 `:226/:232`，C13 为 `:408/:414/:419/:425/:433`），该档 J2 读数 7（= C12 的 2 + C13 的 5，`:122`/`:123`/`:177`）也不含它 ⇒ 或为表外命中（零锁不达、读数应为 8），或该处属注释面而 ★ 注标错面。另：保留面类 4 按「§1–§6 位数」划界（`:72`/`:151`），两段形协议自名（如本协议自身的 §1.2 式小节）落空，判据按形状而非指称 ⇒ `§1.2` 形无唯一判。 | 对该位点先定性（外部引证 ⇒ 补 C 行并同步读数；协议自名 ⇒ 明示保留并扩 J2 豁免），并把类 4 边界改为按指称或写明两段形归属。 |
| 5 | Clarity（对账工作单） | 🟡 | §2.3.2「旧片段」列缩写（`…`/`等`/`串内 ×3`）且与 file:line 列非一一对齐：C14 十片段对九行（`:125`）；C18 十二行按字面仅数得 7 个 J1 档名，而 J1 表给 batch-segment 8（`:129`/`:176`）⇒「表外命中/表内误入」不能凭档面逐数核对（实档源文本本评审未读）。 | 逐行补 hit 计数（J1/J2/J3）或展开精确片段。 |
| 6 | Acceptance criteria | 🟡 | AC4（`:213`）只写「`grep -rn` 三模式 + 字符串面零命中（注释面豁免）」，未给命令与扫描面 ⇒ 按字面执行必不零命中：注释面（#149 族）、测试面、`_archive/`、以及本批档 §2.3.2 自身引了这些串都在射程。 | 写明扫描面/排除项，或改以 AC1 的面感知测试读数承接。 |
| 7 | Requirements（覆盖） | 🟡 | §1.4⑥「D8 自查」（`:47`）无 AC 承接——AC7 只覆盖格式①–⑤（`:216`）。 | §2.8 补该条或注明其承接面。 |
| 8 | Acceptance（机械约束） | 🟡 | §1.3 定「`.md` 行宽 ≤300」（`:43`）；§2.6① 拟落的 EN 纪律句（`:186`）逐字计数 ≈368 字符（CN 句约 110 字符无碍）⇒ 若该约束覆盖提示词档，AC6 的 doc-check（行宽）将红。 | 先定行宽口径与适用范围，再按口径缩句/折行。 |
| 9 | Clarity（句义保留） | 🟡 | 统一删法为「删引证括注（保留括注内行为句）」（`:108`），但 C15 `(ENGINEERING-MODE.md §2.15 D; ≤6 spawns per batch)`（`:126`）与 C16 `(AGENT-LOOP.md §18: max 5 fix rounds; …)`（`:127`）在「删（旧片段）」列整括注列出、未给改后文（C2/C17/C19/C20/C23 均给箭头式改后文）⇒ 照列面执行会连行为半句一起删，违 §1.3 句义保留。 | 对「引证+行为」混排括注逐行写出改后文或标注保留半句。 |
| 10 | Note（计数口径） | 🔵 | D5 行「4 处 / 4 档」枚举 5 个位点（`session-store.mjs:278/:355` 为两处，`:84`），而 D1/D3 的「处」按位点计（17 处可逐行点数，`:80`/`:95`–`:103`）；§2.2 结论随写「D5（3 处）」（`:87`）。 | 写明「处」的口径并在三处同步。 |
| 11 | Note（锁覆盖缺口） | 🔵 | J3 只扫 PROMPT_FACES（`:152`）⇒ 模型可见代码串（工具说明/回模型串）里的小写档名不落任何一式（J1 需大写形、J2 需节号）；与 F5（裸名不可分，`:234`）不同缺口。 | 在 §6.6 边界清单登记，或以同一操作数豁免扩锁。 |
| 12 | Clarity | 🔵 | P4–P6（`:98`–`:100`）只给 EN 改后文，CN 改后文未列；§2.7「笔与落地」称提示词两面内容权威在主 agent（`:204`）⇒ CN 面改后文处设计未定（叠上 F4 无同源锁更易漂）。 | 两面改后文并列。 |
| 13 | Note（判据边界） | 🔵 | 判据 3 的人读面只落到「日志/告警」（`:63`/`:84`）；其余用户可见文案（CLI usage/help 等）既不在该类、也不在排除面（`:74`）。 | 明确其界内/界外。 |
| 14 | Clarity（记法） | 🔵 | `D<n>` 双用：§2.2 域标 D1–D6（`:80`–`:85`）与判据/决策标（§1.4⑥「D8」`:47`、§2.6①「D2 单一权威」`:184`、KD4 `:245`）同形。 | 加前缀区分域/决策。 |
| 15 | Note（unverified） | 🔵 | 评审声明把纪律落点写作「PROMPT-SYSTEM §6.6/D-PS6」，§2.6②（`:189`）未提决策号/登记项——若 PROMPT-SYSTEM 有 D-PS 编号登记制须落号（PROMPT-SYSTEM.md 现状未读 · unverified）。 | 核对登记制并补号（若适用）。 |

计数：🔴 1 · 🟡 8 · 🔵 6 = 15 条。
VERDICT: changes-required

### 轮次 2（评审子代理）

轮次 2（缩范围复核）· 目标 = §2.12 追加块 15 条落点声明自洽 + C2 三面逐字一致 + C4 量宽读数（按评审对象声明：不实读代码、不展开全量、不重开已裁项）。读档：批档全文 + `docs/core/design/PROMPT-SYSTEM.md:180-244`（C2/C5 落点面，属声明目标内）。

| # | Orig# | 落点声明 | 判定 | 证据（本轮 read 逐字） |
|---|-------|----------|------|------------------------|
| 1 | 1🔴 | 纪律句收正 = §2.12.2 甲（EN 折两行+操作数豁免 / CN 单行+操作数豁免）· 边界单一承载 §6.6 · 三面一致 | Fixed ✓ | 批档 :284-285 EN「never **cite** a doc name…」+ Operand exemption 六名；:287 CN「不得出现**引证**…**操作数豁免**…保留」；PS:194 判保留面六名、PS:201 J1 白名单六名；§2.4 原 :150 四名枚举由 §2.12.2 三声明为 CANON 子集、「以本条为准」（append-only 下成立） |
| 2 | 2🟡 | J2 档数 23→22 | Fixed ✓ | 批档 :293 附账 #2：4（提示词）+ 18（代码）= 22；J1 23 不变 |
| 3 | 3🟡 | 先红口径 = 仅跑 §2.4 三式；88 = 无守卫探针读数 | Fixed ✓ | 批档 :262/:294：探针 `§\s*(?:\d{2,}\|\d+\.\d)` 首支无守卫命中 `§19\.6` ⇒ 88；终式 `(?![\d\\.])` 守卫天然不命中 ⇒ 87；T5 零报不变；PS:202 守卫注在档 |
| 4 | 4🟡 | :163 定性坐标误记（实为 `subagent.mjs:163`）→ C14 补行；类 4 改按指称 | Fixed ✓ | 批档 :310（**:163 ×0/×1（修正轮补）**）· :322（补入片段 `(ENGINEERING-MODE-V2-MODULE-DELEGATION §1.2 F2)`；C14 = 十一片段/十行 · 读数不变）；PS:196「判据 = **指称**…指外部文档者一律入引证面」· PS:202 |
| 5 | 5🟡 | 逐行 hit 计数表 | Fixed ✓ | 批档 :299-320：C1–C23 逐行 J1/J2；合计 **57/83** 与 §2.5 全等（本轮逐行复加通过；C18 = 8/14、C14 = 10/19——原缩写疑点消解） |
| 6 | 6🟡 | AC4 收正（面感知） | Fixed ✓ | 批档 :328：域/排除项/注释剥离 + T9 读数承接 + grep 同域复扫 |
| 7 | 7🟡 | 补 AC8（纪律 D8 自查） | Fixed ✓ | 批档 :329 AC8 行（承接 §1.4⑥；`~~` 零命中辅证） |
| 8 | 8🟡 | 行宽口径 + EN 折两行/CN 单行 | Fixed ✓ | 批档 :333 口径（新增/改写行 ≤300；doc-check docs 域；提示词面同口径自查）· :334 读数 247/224/279（本轮独立逐字计数 ≈241-247 / ≈224 / ≈270-279，全 ≤300 ✓） |
| 9 | 9🟡 | C15/C16 改后文 | Fixed ✓ | 批档 :341-349：family-tools :111 → `(≤6 spawns per batch)` 保行为半句；spawn-child :63 → `(max 5 fix rounds; the 7th audit spawn is refused mechanically)` 保行为半句；其余整删并给句尾 |
| 10 | 10🔵 | 「处」口径 + D5 = 5 处/4 档 | Fixed ✓ | 批档 :253（处=位点/档=文件数）· :295 附账 #10 五位点枚举（与原评审计数一致） |
| 11 | 11🔵 | §6.6 登记 J3 覆盖缺口 | Fixed ✓ | PS:207 在档（域内实测 61 处 · loader key/落点操作数） |
| 12 | 12🔵 | P4–P6 CN 改后文并列 | Fixed ✓ | 批档 :359-363 完整重出表（:355 截断残片 = N3，声明已排除） |
| 13 | 13🔵 | 人读面外沿 | Fixed ✓ | PS:198（日志/告警在内；CLI usage/help = 界外） |
| 14 | 14🔵 | D<n> 前缀约定 | Fixed ✓ | 批档 :252（域D1–域D6 / 纪律D1–纪律D8；旧文按约定读） |
| 15 | 15🔵 | D-PS6 入 §7 · D-PS5 重复行删 · §2.6② 补记 | Fixed ✓ | PS §7 表 D-PS1–D-PS6 各一行（D-PS6 = :221）；§6.6（:189-210）无决策行；D-PS5 仅 :220 一行（无重复） |

**C2（三面逐字一致机检）**：CANON 六名（`AGENTS.md`·`SKILL.md`·`README.md`·`MANIFEST.md`·`.thincoder/advisor.md`·`project_rules.md`）在五处逐字命中——批档 :279（CANON 行）· :285（EN 纪律句）· :287（CN 纪律句）· PS:194 · PS:201 · PS:221 ✓ includes 全 HIT，声明成立。
**C4（量宽）**：EN 247/224 · CN 279 全 ≤300 ✓（独立计数吻合）；§6.6 新增行 ≤300 + doc-check exit 0（:335 声明读数，无矛盾）。

新增（不阻塞）🔵 1 条：PS:202 称批次段号「及其下级两段形」为合法正例（判据 = 指称），而 J2 机判仍按形状（`\d+\.\d` 会命中 `§1.2` 形）——两段形协议自名若出现在模型可见串将被 J2 误伤；现域内无此形（处置表零此类），属潜在契约含糊，建议实施时在 §6.6 边界或 T3 夹具口径写明。不重开已裁项。

计数：15/15 Fixed ✓ · 新 🔵 1 · 新 🔴 0 · 新 🟡 0。
VERDICT: pass

## §4 用户批准（主 agent）

**2026-09-20 20:0x 父侧代签** —— 用户 19:31 口径裁定 + 17:03「自动跑到干完吧」⇒ 本批**设计评审点火权 + §4 批准权**均在授权射程内 ✓。

**三条件核验**：① 评审 **pass**（id=17 changes-required 🔴1/🟡8/🔵6 → 修正轮 id=19 **15/15** → **复核 id=23 pass**：15 条落点实核 ✓ · C2 三面逐字一致机检（六名五面 includes 全 HIT）✓ · C4 量宽 ≤300 独立复计吻合 ✓ · 无 fix 引入新 🔴/🟡 ✓）；② 修正轮已落地并经复核逐条核验 ✓；③ **token 已签发**（值不落档——运行时凭证 ✓）。

**批准范围**：本批全量（提示词两面 P1–P10 + 模型可见串 C1–C23 + 纪律面落点）。**实施车道**：**提示词两面 + 模型可见串（43 档 · 行内删字 ⇒ 零增行）→ eng-coder + token** ✓；PROMPT-SYSTEM 设计面已由修正轮落地 ✓（§6.6/D-PS6 在册 ✓）；common.md 两面纪律句（2+1 行）随实现轮同落 ✓。已派发 ✓。
## §5 实施记录（eng-coder）

**轮次**：initial · **执行人**：eng-coder（token 已核）· **2026-09-20 20:12–21:0x** · batchDoc = 本档 · 任务书 = §2 全段（以 §2.12 为准面）。
**总状态**：✅ 全落——P1–P10（两面 24 档）+ C1–C23（生产码 18 档 · 71 位点含修正）+ 锁档新增 + 断言同步 ×2；三包全绿 + 锁 T9 三式 0；**advisor 评审 = stalled（超时 600s）→ 发现逐条实核 → 1 条成立已修 + 复验全绿 → 终态 clean（评审收敛以实核读数为准，报告面如实披露）**。

### 5.1 先红后绿（AC2 对账）

| 式 | §2.5 期望 | 实跑（探针脚本 · §2.4 三式逐字） | 对账 |
|---|---|---|---|
| J1 | 65 | **65** | ✓ 全等（含逐档分布） |
| J2 | 87 | **87** | ✓ 全等（`setup-tooltable.mjs:157` 转义点形由守卫天然不命中 ✓） |
| J3 | 39 | **39** | ✓ 全等（EN 20 + CN 19） |

**口径教训（对后续批有用）**：探针首跑 61/85/20——`docs/**` 排除项误用于 PROMPT_FACES（`docs/core/design/prompts/` 恰在 docs 下）⇒ **排除项必须分面**（CODE_ROOTS 排 docs/scripts；PROMPT_FACES 不排）。锁档 T9 已内置域防呆（三面各自至少扫到 1 档）。

### 5.2 P1–P10 逐处回报（P号 → file:line → 处置 · EN∥CN）

| # | 位（EN ∥ CN） | 处置 |
|---|---|---|
| P1 | `prompts/advisor-design.md:5` ∥ `design/prompts/advisor-design.md:16` | 方法论括注整删（两侧同） |
| P2 | `advisor-design.md:19` ∥ `:43` | EN `file.md:42`→`file.ext:42`；CN `path/to/<file>.md:42` **判保留**（占位形——`<`/`>` 隔断 J3 实证不命中） |
| P3 | `advisor-design.md:32`∥`:62` + round1 `:28`∥`:55` + round2 `:33`∥`:46` + round3 `:29`∥`:43`（共 8 处） | `keep the advisor-design.md convention`→`keep this convention`／「保持 advisor-design.md 惯例」→「保持本档惯例」 |
| P4 | `common.md:156`∥`:119` | 结构权威句改写去档名（`the project's own batch-record mechanism`／「由项目自身的批次档机制定义」） |
| P5 | `discipline-engineering.md:113`∥`:110` | 兜底核销路径删 `= design/BATCH-RECORD.md §5.2`（两侧同构） |
| P6 | `persona-engineering.md:133`∥`:131` | 同上（纯括注删） |
| P7 | persona-{coder,eng-coder,eng-designer,explore,plan}.md `:1` ×2 面（10 处） | 槽注删「pairs with …」从句／「与 …配对」从句；槽位/消费方字段保留 |
| P8 | `persona-coder.md:9`∥`:7` | `common.md`→`the shared layer`／「见公共层同名节」 |
| P9 | `persona-eng-coder.md:29`∥`:29` + `persona-explore.md:10`∥`:10`（4 处） | 同层名改写（公共层/shared layer） |
| P10 | `common.md` 文档写作纪律节 EN `:39–40`（+2 行）∥ CN `:35`（+1 行） | 纪律句按 §2.12.2 逐字稿落——回读逐字一致 ✓ · 量宽 247/224/279 ✓ |

**两面残留白名单**（机扫+人工各一遍）：`AGENTS.md`（Project Guide 行为操作数）· `docs/batches/<batch>-<topic>.md` 等路径形 · `<file>.md` 占位形 · `".md"` 字面量——全部判保留面 ✓。

### 5.3 C1–C23 逐处回报（C号 → file:line → 处置摘要 · 全部行内删字零增行）

- **C1–C5** `advisor.mjs` :48 删 `(AGENT-LOOP.md §18.8 — …)` · :50 `ASYNC (… §11.2):`→`ASYNC:` · :75 删 `(§18.8)` · :89 删 `(ENGINEERING-MODE.md §2.20)`（保「counts into §3」协议自名）· :167 删 `(AGENT-LOOP-SUBAGENT.md §6.10)`
- **C6** `advisor-async.mjs:369` 删 `(AGENT-LOOP.md §11.2)` · **C7** `subagent-async.mjs:116` 删 `(AGENT-LOOP.md §11.1)`
- **C8** `subagent-async.mjs` :247/:251 删 `(AGENT-LOOP-SUBAGENT.md §6.7.2)` · :290 删 `(AGENT-LOOP.md §20 D-SD5)`
- **C9** `subagent-actions.mjs` :111/:242/:294/:309 删 `(AGENT-LOOP-SUBAGENT.md §6.7.2)`
- **C10** `subagent-panel.mjs` :60/:102 删 `§17.5.5` · :88 删 `(AGENT-LOOP-SUBAGENT.md §6.7.2)` · :134/:136/:137 删 `(§25 D-R17a/b)`·`(§17)`
- **C11** `subagent-scheduler.mjs` :195 STALL_NOTE 删 `(AGENT-LOOP.md §21.1 P-SL2)` · :321 删 `(AGENT-LOOP.md §20 D-SD5)`
- **C12** `subagent-spawn.mjs` :226 删 `(AGENT-LOOP.md §20 D-SD5)` · :232 删 `(AGENT-LOOP.md §20 round2 #7)`
- **C13** `subagent-spawn.mjs` :408/:414/:419/:425/:433 审计模板串删 `(AGENT-LOOP.md §18.7 D-TS4 A1)`·`(§18.5 D-AG3)`·`(§18.7 D-TS5 A2)`·`(§18.5 D-AG3)`·`(§18.7 D-TS6 A3)`
- **C14** `subagent.mjs` :126 删 `(AGENT-LOOP-SUBAGENT.md §6.7–§6.7.5 + SUBAGENT-OBSERVE-SEND)` · :128 删 `§6.7.2 touched-files` 前缀 + `(AGENT-LOOP.md §18)` · :131 删 `(AGENT-LOOP.md §25 D-R17b)` · :132 删 `(AGENT-LOOP.md §18)` · :143 删 `(AGENT-LOOP.md §15/§18/§11.1)` + `(AGENT-LOOP.md §11.1)` · :144 删 `(AGENT-LOOP.md §20)` · :153 删 `§6.7.2`×3 + `§2.6` · :163 删 `(ENGINEERING-MODE-V2-MODULE-DELEGATION §1.2 F2)` · :164 删 `(AGENT-LOOP.md §18 D-E1a)` + `(AGENT-LOOP.md §25 D-R17b)` · :188 删 `(AGENT-LOOP.md §19 D-M3)`
- **C15** `family-tools.mjs` :111 →`(≤6 spawns per batch)` 保行为半句 · :112 整删 · :123 删 `(ENGINEERING-MODE.md §2.15 D)`+`(AGENT-LOOP.md §19)` · :124 删 `(AGENT-LOOP.md §18 D-E2 ③)`+`(AGENT-LOOP.md §19)`（§2.12.6 逐字落）
- **C16** `spawn-child.mjs` :54/:57 整删 · :63 →`(max 5 fix rounds; the 7th audit spawn is refused mechanically)` 保行为半句
- **C17** `agent/setup.mjs:200/:202` ∥ VSC `agent/setup.mjs:389/:391`：`（蓝图 §3.4 特殊模块不自降级）`→`（特殊模块不自降级）` · `(no degraded fallback per PROMPT-SYSTEM §3.4)`→`(no degraded fallback)`（两端同源同改；`consult-base.md` 串 = 行为操作数判保留）
- **C18** `batch-segment.mjs` :73 删 `(ENGINEERING-MODE.md §2.20.2)` · :168 删 `(§1.12)` · :196 `…(§2.20 — 一段一作者)`→`(一段一作者)` · :200 删 `— §2.7` · :208 删 `(§2.20.1)` · :221 删 `(ENGINEERING-MODE.md §2.20.1/§2.20.3)` · :228 删 `; ENGINEERING-MODE.md §2.20.1` · :231 删 `, ENGINEERING-MODE.md §2.20.2` · :237 删 `(…, ENGINEERING-MODE-V2-MODULE-BATCH-SEGMENT.md §2.1#2)` · :246 删 `; ENGINEERING-MODE.md §2.20.1` · :249 `(§2.20.1 骨架保护)`→`(骨架保护)` · :253 删 `; ENGINEERING-MODE.md §2.7/§2.20.1`（段号 `§1`–`§6`/`§${seg}` 协议自名全保留）
- **C19** `escalate-async.mjs` :125/:135 删 `; AGENT-LOOP.md §25 D-R17b`/`… round2 #4`（保 `report-level — not a gate`）
- **C20** `settings.mjs:80` 删 `(SETTINGS-TOOL.md §8.3; N-S1.5 completeness lock)`（保 `— declare their real consumption shape`）
- **C21** `spawn-gates.mjs:67` 删 `(ENGINEERING-MODE-V2-MODULE-DELEGATION §1.2 F2)`
- **C22** `session-store.mjs` :278/:355 删 `(SESSION.md §14.4 D-R4)`
- **C23** `responses.mjs:194` `（PROVIDER.md §13.3 D10；provider.stateful=false 可退出）`→`（provider.stateful=false 可退出）`

### 5.4 测试面

- **新增** `thincoder-cli/test/prompt-refs-zero.test.mjs`（169 行）：T1–T9 + J3 CANON 整串豁免（父侧裁定 A——六名逐行先整串删除再扫；整串而非按 token：`project_rules.md` 的 J3 token 是 `rules.md`、`.thincoder/advisor.md` 的是 `advisor.md`，按 token 豁免会误放行孤立引证）+ T9 域防呆守卫；域/排除分面（PROMPT_FACES 不排 docs）。
- **同步断言 ×2**（§2.7 授权）：`thincoder-cli/test/subagent-observe-send.test.mjs:320`、`thincoder-vscode/test/async-parity.test.mjs:483`——断言串删 `(AGENT-LOOP-SUBAGENT.md §6.7.2)`（同步断言消息）。

### 5.5 实施中裁定与偏差（决策级 · 全部上抛后落）

1. **J3×纪律句互斥（上抛 → 父侧裁定候选 A ✓）**：纪律句 CANON 操作数（`.thincoder/advisor.md`·`project_rules.md`）落 `common.md` ∈ PROMPT_FACES 会被 J3 命中 4 处 ⇒ AC1 与 AC5 不可同时成立；`PROMPT-SYSTEM.md:201` 只核 J1 漏 J3 属设计疏。**落法**：J3 逐行先整串删除六名再扫（J1/J2 口径不变——J1 白名单机制）；J3 后绿两读（P 面）：**豁免前 = 4 · 豁免后 = 0**。设计面补注由并行 designer 微轮落地（父侧声明）。
2. **裸名残留（advisor 评审发现 · 实核成立 → 已修）**：`subagent-actions.mjs:247/:299` 串面残留 `(SUBAGENT-OBSERVE-SEND)`（判据线①明列射程 · C 表漏勘）⇒ 已删（行内删字零增行 · 测试无断言面 · `git grep` 零命中复扫 ✓）。
3. **CN/J3 假阳性（advisor 评审发现 · 实核不成立）**：评审断言 CN `path/to/<file>.md:42` 被 J3 命中——逐字符实证：`file` 与 `.md` 之间隔 `>`（不在字符类），**不命中** ✓；锁测试 exit 0 复跑证实。

### 5.6 验证读数（AC1–AC8）

| AC | 读数 |
|---|---|
| AC1 | `node --test test/prompt-refs-zero.test.mjs` → exit 0（T1–T9 全绿 · T9 三式 0）✓ |
| AC2 | 先红 65/87/39 与 §2.5 全等（5.1 表）✓ |
| AC3 | 三包 `npm test`：core **447 pass / 0 fail** · cli **754 pass / 0 fail** · vscode **862 pass / 0 fail** ✓ |
| AC4 | 起点三串面感知 grep（域同 §2.4 + 排除）零命中 ✓ + T9 三串含于 J1/J2 判据面 ✓ |
| AC5 | 纪律句两面在位（EN `:39–40`/CN `:35` · 逐字一致 · 量宽 247/224/279）✓ |
| AC6 | `node scripts/doc-check.mjs --root .` → 锚 0 悬空 · 行宽 0 · exit 0 ✓（`prompts-dual-source` T-CL1 十四节随 cli 包绿 ✓） |
| AC7 | 本记录 + 交付报告五段 ✓ |
| AC8 | 改动行逐行实读零修订式表达 + 机扫 `~~` 命中 0（44 改动档 +行面）✓ |

**机械约束**：零增行核对——贴线档 `subagent-actions.mjs`/`responses.mjs`/VSC `setup.mjs` 均 496 行（Δ0）；`common.md` 两面 +2/+1 = P10 授权增量；新测试档 169 行 ✓。**零触面**：`_archive/**`·`tool-docs/**`·`scripts/**`·冻结批档·注释面（git diff --stat 46 档全数对账：43 本批 + `PROMPT-SYSTEM.md`（设计轮/并行 designer 微轮）+ `TURN-CAP-CONTINUE.md`（工作区既有非本批）+ 其余为断言/测试档重叠计数）。

### 5.7 审计与评审轮次（终态 = clean）

1. **内部 explore 发散审计**：**CLEAN 零偏差**（P1–P10/C1–C23 逐处落位零漏 · 46 档=规格 46 档 · 行为面未动 · T1–T9 对齐 9/9；注记：AC 运行时读数其无执行面 unverified——由本席运行读数补齐）。
2. **advisor 代码评审（round 1）**：**超时终止（600s · stalled）**——报告面 partial。发现实核：🔴-1 CN/J3（5.5.3 **不成立**——逐字符实证 + 锁复跑）；🔴-2 裸名残留（5.5.2 **成立 → 已修**）；🔵 文件体量（贴线档既有债 · §2.7 已登记 · 不重开）。评审声明「CN `file.md` 命中」与其「2/19 host-verified」互斥——按证据纪律以实核读数为准。
3. **修复后全套复跑**：锁 exit 0 · 三包 447/754/862 全绿 · 位点扫描 71/0 · 裸名 grep 零命中 → **终态 clean**。

## §6 验证与收口（父代理）

**2026-09-20 21:0x 父侧收口**

**交付核验**：设计（#15 实勘 6 域）→ 评审（#17 changes-required）→ 修正（#19 15/15）→ 复核（#23 **pass**）→ 代签 §4 → **实施（#24）**✓——**33 处处置全落 + 实核加修 2 处裸名** · **终态 clean**

**读数（先红 → 后绿）**：J1 **65 → 0** · J2 **87 → 0**（转义点守卫 ✓）· J3 **39 → 0**（豁免后两读 4→0 留痕 ✓ 父裁候选 A ✓）· 三包 **447/754/862** 全绿（含新锁档 T1–T9 ✓）· doc-check 悬空 0/行宽 0/exit 0 ✓ · 位点终扫 71/0 ✓ · AC8 机扫 `~~` 0 ✓ · 零增行（贴线档 496 ×3 Δ0 ✓）· 零改址 ✗ 全程未犯 ✓

**父侧裁定与采纳**：① ⑤-1 判据面补注（#25 三处 ✓ 已落 ✓ 收口核其在档 ✓）；② ⑤-2 工作区两档（`PROMPT-SYSTEM.md` = 本批设计/微轮 ✓ 已入库 ✓；`TURN-CAP-CONTINUE.md` 6 行 = 他线 ✗ 不动 ✓）；③ ⑤-3 裸名锁外残留风险 ⇒ **入册** ✓；④ ⑤-4 N2 = 已裁已删（`d2181dae` ✓ 父裁 20:30 ✓）；⑤ advisor 轮 1 超时 → 实核 + 轮内复跑收敛 ✓ 采纳；⑥ 其 🔴-1（CN 被 J3 命中）驳回正确 ✓（逐字符实证）

**台账**：**#147 → 已核销** ✓（含 N2 面级指路句收口 `d2181dae` ✓ 两界原则第 16 条 `99d4b7b7` ✓）

**遗留（显式）**：① 裸名面专勘（锁外 ✗ 靠处置表+评审守 ✗ —— 入册 ✓）② 他线未提交档（`TURN-CAP-CONTINUE.md` ✗ 不动 ✓）。

**提交**：待入库（本笔）。
