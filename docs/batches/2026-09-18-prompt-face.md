# 2026-09-18 · 提示词面三件（#23 + #27 + #25）

## §1 讨论（主 agent）

**状态行**：🔄 进行中（设计轮）

### 1.1 批件（用户 2026-09-18 04:46「都开了吧」）

| # | 条目 | 实况 |
|---|---|---|
| ① | **台账 #23**：子代理「机制性指令」**注入位置错误**（user 首条 → 应 `system`） | 机制面 = 核提示词装配；设计须核现态注入点与下游影响 |
| ② | **台账 #27**：提示词**死指针**——checklist 工具指令（M7 退役后） | **父侧实查（2026-09-18 04:4x · case-insensitive grep）：提示词面已净**——`discipline-engineering.md` / `discipline-normal.md` 全文**零** checklist 工具指令（仅余正当英文用法）；`persona-engineering.md:131` 明写「checklist retired」⇒ M9 管线已收。**残留面 = 文档面**（`NORMAL-MODE.md:27/:35` · `METHODOLOGY.md:53` · `FEATURES.md:87/:196` 等仍把 checklist 当活工具）⇒ 归 **#42/#54 的 sweep 批**。本批处置 = **核销 + 路由**（不再重改提示词） |
| ③ | ~~**台账 #25**：`common.md` 公共层提示词梳理（过复杂）~~ | **已消解——不属本批**（用户 2026-09-18 04:50 指正：「common.md 和 discipline 今天都已经处理过了」；父侧实查坐实：`thincoder-core/prompts/common.md` **mtime = 2026-09-18 04:43** + git 里今日重构链：任务边界/交付报告自 common 迁出（`c5421c1e` / `b6de2836`）· 多实现面纪律删除（`9f2c6e96`）· 注入锚清理（`21d77aa2`）· EN 再生成（`8b5ea7c3`）⇒ 原条目已过时） |
| ④ | **父侧自查纠正（同轮）**：上稿批档 ③ 曾把「工具路由表 20 行 × 每次装配」记为问题点——**该表 = COMMON-LAYER 批「C1–C8 上移」裁定的 C7（故意的）**，不得回退；本批不得重开 common 面 | 已修批档；⚠️ 我读的是文件现状、不是工作状态——**「已处理」必须查到「谁做的、什么时候」** |

### 1.2 路径

**设计轮（eng-designer）** → 评审 → 实施（eng-coder）。**提示词内容权 = 主 agent（父侧笔）**——设计者出机制/结构方案；**提示词正文改动 = 父侧落笔 + eng-coder 落地**（D1 矩阵）。

### 1.3 边界

- **禁触**：判据面引擎 · 数据面 · 冻结批档；提示词正文（父侧笔）。

### 1.4 台账

- **#23** · **#27** · **#25**。

## §2 批次任务与设计修订（eng-designer）

### 2.0 轮次与交付（设计轮 · initial · 2026-09-18）

- **轮次** = initial（设计轮）；**唯一条目** = 台账 #23（② #27 父侧已核销 · ③ #25 已消解——本批不重开）。
- **设计落点（三档，各有其权）**：
  - 机制单源 = `docs/core/design/AGENT-LOOP-SUBAGENT.md` **§6.26**（新增：分类裁定表 14 行 · 机制 · 缓存契约兼容证明 · 压缩面不变量 · 受影响文件 · 决策 D23-1–D23-7 · 用例 U1–U7 · 判据 A23-1–A23-6 · 边界 7 条）；
  - 契约精化 = `docs/core/design/AGENT-LOOP.md` **§6.3**（`:229` 句重写：操作条件 = 「同一 agent 的相邻请求前缀逐字节相同」+ 明列可入 system 的输入集）；
  - 装配事实指针 = `docs/core/design/PROMPT-SYSTEM.md` **§6.2**（一行指针——不复制机制，D2）。

### 2.1 机制摘要（一段）

子代理 spawn 的 **spawn 级固定机制性指令**（eng-coder/eng-designer 的批次档绝对路径行 · 审计 spawn 的六段审计模板）不再追加进 user 首条 `input`，
改由 **`child._spawnSystemBlock`**（`buildSpawnChild` 单点写入）承载，`prepareRun` 在槽位装配之后、项目指令之前拼接进 system。
理由链：① 该内容在 child 生命周期内逐字节稳定 ⇒ 前缀缓存不破（契约精化见 `AGENT-LOOP.md` §6.3）；
② `systemPrompt` 不属 `agent.history`，压缩（`context.mjs:274-324`）只重建 history ⇒ **结构上吞不掉**（`KEEP_HEAD = 0` 吞首条的机制对本块无效）；
③ 判据面自带独占性断言（整请求体中该文本恰出现 1 次）。
**零提示词正文改动**（块内文本逐字搬移——含块内自指词，整块搬移不改其真值）⇒ 内容权面无依赖、无上抛。

### 2.2 明确不在本批

| # | 面 | 处置 |
|---|---|---|
| 1 | 台账 #27（checklist 死指针） | 父侧已核销 + 路由（残留 = 文档面，归 #42/#54 sweep 批）——本批零动作 |
| 2 | 台账 #25（`common.md` 梳理） | 已消解（今日已处理）——**不重开**（§1.1 ④） |
| 3 | advisor 评审简报（同类根因） | **已由另一机制覆盖**：F13 pinned 重挂（`advisor/compaction.mjs:55-83`）⇒ 压缩不丢——登记为「同类已解」，本批不动 |
| 4 | 任务书本体（批次档 §2 文本）压缩面 | 不属「机制性指令」——仍走 user 首条、仍可被摘要（决策 D23-7，边界如实登记） |
| 5 | 压缩本体 / `KEEP_HEAD` 语义 | `context.mjs` 零改动 |
| 6 | common / discipline 提示词面 | 今日已处理——本批不重开 |
| 7 | 判据面引擎 / 数据面 / 冻结批档 / `_archive/**` / 参照树 | 禁触（派单边界）——本批零触碰 |

### 2.3 受影响文件表（实现轮施工面 · 行数口径 = 换行符计数 · as-of 2026-09-18）

| 文件 | 当前行数 | 预计增量 | 说明 |
|---|---|---|---|
| `thincoder-core/agent-tools/subagent-spawn.mjs` | 470 | −80 / +12 | ① `summarizeEngTaskBook`（`:44-80`）+ 审计模板构造体（`:394-437`）外提；② S1/S2/S3 三处改固块收集 + `child._spawnSystemBlock` 绑定 |
| `thincoder-core/agent-tools/audit-block.mjs`（拟新增） | 0 | +~95 | `summarizeEngTaskBook` + `buildAuditBlock(ctx)`（纯函数——判据直测面） |
| `thincoder-core/agent/setup.mjs` | 234 | +3 | `:214` 之后固块拼接（`prepareRun` 单点） |
| `thincoder-core/test/spawn-system-block.test.mjs`（拟新增） | 0 | +~120 | U1–U7 宿主（`npm test` 自动收集——`thincoder-core/test/run.mjs:8` 单层 glob） |
| `thincoder-cli/test/batch-doc-gate.test.mjs` | 188 | ±14 | `:98` · `:115-119` · `:127` · `:143-146` · `:185` 判据改指固块字段（`input` 侧反转「不含」） |
| `thincoder-cli/test/eng-designer-role.test.mjs` | 269 | ±8 | `:162-168` · `:202`（负控强化）· `:207`（对照改指固块） |
| `thincoder-vscode/test/eng-designer-role.test.mjs` | 198 | ±3 | `:167` 负控补固块字段断言（防空转——原断言改后恒真，见 F-6） |
| `thincoder-vscode/test/subagent-audit-summary.test.mjs` | 118 | ±6 | `:39-45` A2 摘要读取面由 `input` 改 `child._spawnSystemBlock` |
| `docs/core/design/AGENT-LOOP-SUBAGENT.md` | 883 | +~120 | 本节（机制单源）——本设计轮已落笔 |
| `docs/core/design/AGENT-LOOP.md` | 514 | ±2 | §6.3 契约精化 + 变更记录——本设计轮已落笔 |
| `docs/core/design/PROMPT-SYSTEM.md` | 270 | +1 | §6.2 指针 + 变更记录——本设计轮已落笔 |

> **前端 / 文档面零改动**：TUI 与 webview 不显示 system 消息 ⇒ 无 UI 面；提示词正本（`docs/core/design/prompts/**`）与运行期槽位（`thincoder-core/prompts/**`）本批零改动。

### 2.4 验收标准（回指条目）

| # | 判据（可机判） | 回指 |
|---|---|---|
| A23-1 | eng-coder/eng-designer spawn 后 `prepareRun(child).systemPrompt` 含 `Batch record (batchDoc): <abs>` ∧ 该 spawn 的 `input` 不含 | 条目 1 · 派单验收 ②③ |
| A23-2 | 审计 spawn（eng-coder 父 + role `explore` + attempt 非 null）的 system 含五锚（Audit instructions / A2 块头 / Zero-git scope authority / Audit budget / Audit report format）∧ `input` 不含 | 条目 2 |
| A23-3 | 长史压缩后：五锚仍在 system ∧ `agent.history` 无五锚（**先红**：现态两处皆无） | 条目 3 |
| A23-4 | 同一 child 两次装配 `systemPrompt` 逐字节相等；`_spawnSystemBlock` 为 null 的路径（depth-0 / explore / plan / consult）逐字节同改前 | 条目 4 |
| A23-5 | 分类裁定表 14 行逐处有裁定（含「同类已解」第 11 行 = advisor 简报） | 条目 5 · 派单验收 ① |
| A23-6 | `node scripts/doc-check.mjs` 本批触碰档零新增悬空锚 / 零新增行宽违规 | 条目 6 · 派单验收 ⑥ |
| A23-7 | `npm test` 全绿（核 + CLI + VSC 三包；受影响测档改造后） | 实现轮门 |

### 2.5 先红方案（夹具）

1. **U1 先红**：`buildSpawnChild(engParent, ctx, { task, batchDoc, round:"initial" }, "eng-coder", false, [], [], null)` → `prepareRun(child, input, {}, {depth:1})` ⇒ 断言 `systemPrompt` 含批次档行。**现态红**（该行只在 `input`）。
2. **U2 先红**：同形 + `engAuditAttempt = 1`（`gateEngCoderSpawn` 返回值，role `explore`）+ `parent._engTaskInput` 夹具 ⇒ 断言五锚在 system。**现态红**。
3. **U3 先红（核心病根复现）**：长史夹具（> 切割面）→ `compressFallback(agent)`（零网络）与 `compressIfNeeded` + stub provider 各一条 ⇒ 断言「五锚仍在 system ∧ history 无五锚」。**现态红**：压缩吞首条 ⇒ 两处皆无。
4. **U4/U5/U6 基线（现态即绿，实现后须保持绿）**：字节稳定 / null 固块零回归 / 勘察负控。

### 2.6 发现与上抛（逐条 · 编号 → 事实 + 建议）

| # | 发现 | 证据 / 坐标 | 建议处置 |
|---|---|---|---|
| F-1 | **派单指针失准**：派单书与台账 #23 均记「缓存契约在 `AGENT-LOOP-SUBAGENT.md` §6.3（`:215`/`:226`）」——实址 = `docs/core/design/AGENT-LOOP.md:229`（该档 §6.3 装配与上下文注入）；`AGENT-LOOP-SUBAGENT.md:215`/`:226` 属该档 §6.11（后台评审池） | 本席实读两档 | 设计已按实址落笔；**台账/TODO 描述机物件属父侧笔** ⇒ 上抛父侧收正 |
| F-2 | **三链同源缺口（需求档侧）**：台账 #23 = `tech_todo`、`req_doc = null` ⇒ 需求档（`docs/core/requirements/AGENT-LOOP.md`）无对应 §4.x 条目；本批判据回指 = 批次档 §2（本条）+ 派单验收 ①–⑥ | 台账查询（kind=tech_todo id=23）+ 需求档全文实读 | 建议父侧择一：① 补一条需求档 §4.x（五元素）② 明文「本类技术待办以台账 + 批档 §2 为需求面」（形态决策 = 需求档笔权 = 主 agent） |
| F-3 | **审计模板块内自指词失准（既有）**：`subagent-spawn.mjs:413`「_touchedFiles **above**」实际清单在块内位于该句**之后**（`:420`）——非本批引入，搬移不改变真值 | 实读 `:413` vs `:420` | 本批不动（逐字搬移 = 零正文改动）；若父侧欲收正措辞 ⇒ 另立提示词正文轮（内容权） |
| F-4 | **`AGENT-LOOP-SUBAGENT.md` 过千行**：本设计轮落笔后 ~1003 行（族已 26 节）——文档档不适用源码行数线，但已到拆档阈值 | 行数实测 883 → +~120 | 建议另案拆档（子代理族 / 评审池族两分）；本批不拆（避免与机制改动同轮耦合） |
| F-5 | **子代理面缓存字节断言缺位**：现存 systemPrompt 字节稳定断言只在 VSC `test/context-parity.test.mjs:335`（depth-0 面）；子代理面零断言 ⇒ 本批 U4 补入核测档 | `**/test/**` 实搜 | 已入设计（U4 / A23-4）——同轮补齐，不另立条目 |
| F-6 | **端侧负控断言改后空转**：`thincoder-vscode/test/eng-designer-role.test.mjs:167` 与 `thincoder-cli/test/eng-designer-role.test.mjs:202` 的「不含 Audit scope」在改后恒真（块已不在 `input`）⇒ 若不同轮补固块字段断言，判据面即失防 | 两档实读 | 已入受影响文件表（同轮补断言）；实现轮**必须**补，不得只删不改 |
| F-7 | **提示词正文面本批零改动**：块内文本逐字搬移 ⇒ 无父侧落笔项（D23-4）；F-3 若被采纳才产生正文轮 | 设计决策 D23-4 | 无需处置（如实声明） |

### 2.7 边界（本批不做）

压缩本体零改 · 任务书本体不入 system · advisor 简报不动 · VSC 镜像装配面不动（核单点即可——VSC 子代理恒经核 `runChildPipeline`）· `family-tools.mjs` schema 删除面不动 · `batch_segment` 工具描述不动 · 无 UI / 交互决策（**无 open 项**）。

### 2.8 机检基线（as-of 2026-09-18 设计轮收口 · 命令 = `node scripts/doc-check.mjs`（仓根））

- **收口读数**：悬空 **287**（闸态阈值 0——全仓存量，非本批引入）· 拟新增 4（列报 · 不入闸）· 迁移期引文 1 · **行宽 4 行**（> 300 字符）。
- **本批三档零新增（实测，非推断）**：① 悬空 **288 → 287**——本席修掉自己引入的 1 条（`AGENT-LOOP-SUBAGENT.md` 内 bare `context.mjs:46` 改全限定）；
  ② 行宽 **5 → 4**——本席修掉本档 1 行 352 字符（**批 TOOLFACE-FIXES 遗留长行**，纯机械折行、零语义改动，已在变更记录尾注）；
  ③ 余下 4 条行宽与全部闸态悬空均落在**本批未触碰档**（`CONTEXT-COMPACTION.md` ×2 面 · `prompts/persona-engineering.md` ×2——前者归文档债族，后者属提示词面 = 父侧笔）。
- **本批新增的非闸态行（如实登记）**：`audit-block.mjs`（拟新增）两处路径锚 = 拟新增族（列报 · 不入闸）；`_spawnSystemBlock` / `buildAuditBlock` 符号·宽 9 行 = 报告面（不入闸）——
  标识符入代码域后自动消解（依据 = 引擎 `collectCodeTokens`：`scripts/doc-check-anchors.mjs:234`）。
- **实现轮复核口径**：重跑同命令 ⇒（a）本批触碰档（含两个新档）零 ✗ 闸态行；（b）上述「拟新增 / 符号·宽」行随落地消解归零。

## §3 设计评审（评审子代理）

## §4 用户批准（主 agent）

## §5 实施记录（eng-coder）
