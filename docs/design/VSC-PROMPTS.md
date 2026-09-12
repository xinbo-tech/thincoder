# VSC 提示词（VSC-PROMPTS）

> 板块：VSC 端提示词（src/prompts/ 新 15 文件——本端独立实现面）。权威关系：机制语义与施工设计源自
> CLI 仓 `PROMPT-SYSTEM（CLI 仓）`（分层模型/命名法/装配矩阵/编写纪律权威蓝图）及三施工
> 档（PROMPT-IMPL-1-TEXT/2-CODE/3-TEST-MIGRATE）——**本端文本以本端原文为准**（多实现面纪律——
> byte-identical 已废——端特有段各端保留）。状态：**槽位化现行态已落地**（2026-09-10 施工①②③双端
> 同批——旧 10 文件退役）。注入路径：`src/agent/setup.mjs` assemblePrompt 场景装配。

## 加载拼装机制（施工②四槽位装配——setup.mjs + prompt-overlays.mjs）

### 场景→槽位链（蓝图 §3.2 装配矩阵——`src/prompt-overlays.mjs` SCENARIO_SLOT_FILES）

| 场景 | 装配链 |
|---|---|
| 主会话·工程 | persona-engineering.md → common.md → discipline-engineering.md |
| 主会话·普通 | persona-normal.md → common.md → discipline-normal.md |
| 子代理·eng-coder | persona-eng-coder.md → common.md → discipline-engineering.md |
| 子代理·explore/coder/plan | persona-{role}.md → common.md → discipline-normal.md |
| 特殊·consult | consult-base.md（自含——不入主链） |
| 特殊·advisor | advisor-design.md / advisor-round{1,2,3}.md（setup 不拼装——advisor/main.mjs 独立注入） |

### 降级链（蓝图 §3.4——setup.mjs + prompt-overlays.mjs）

- 人格/纪律/common 槽文件缺失 → 该槽空缺跳过 + 醒目警告（`slotWarning`——depth 0 才注入 history——不
  fallback 其他槽——层间隔离）。
- AGENTS.md 缺失 → 项目层空缺静默跳过（无警告——蓝图 §3.4）；**[4] 层已随 VSC-CONTEXT-PARITY 批真实注入**（项目指令 + skills 清单入 systemPrompt 尾——见 `AGENT-LOOP（VSC 仓）§17` D-CI2/D-CI3；旧「[4] 层由调用面承担」句作废）。
- consult-base.md 缺失 → consultation module 不可用报错（不自降级——setup.mjs 收口）。

## 端特有差异（本端独有——保留面）

| 差异 | 位置 | 说明 |
|---|---|---|
| §11.1 R14 池规则段 | discipline-engineering.md 尾部节（R14 段） | per-role-domain pools（4+4 + agent.poolLimits 覆盖）——CLI 无此段（施工③随迁时 CLI 不引入——端注声明）；2026-09-11 并行节去重后宿主 = de 单处 |
| ~~persona-engineering.md Multi-Task/分工界面扩段~~（已消解） | — | 2026-09-11 并行节去重：副本删除（VSC-CONTEXT-PARITY 批）；单宿主 = discipline-engineering.md（与 CLI 同） |
| persona-eng-coder.md 授权链扩段 | persona-eng-coder.md | 本端版含验证义务细述（CLI 版更紧凑）——语义同源 |

## 纪律（多实现面）

- 各端独立实现语义同源——不加双端同步依赖；实现面互不追赶（乒乓已实证）；差异如实上报；
  端特有段各端保留（R14 等）。
- 语义锚断言：`test/prompts-async-guidance.test.mjs`（本端）fail-when-unchanged——施工③重写后锚网
  全绿（退役旧件零残留 + 装配矩阵 + 降级链 + 编写纪律巡检）。

## 用例表

| 用例 | 输入 | 预期 |
|---|---|---|
| 注入 | engineering 模式回合 | assemblePrompt("engineering") 按 §3.2 矩阵拼三槽 |
| 开关段生效 | 用户叫停（停/先别/别急） | manual 档——每步呈现等 go（persona-engineering 推进档位段 + de 收口段驱动） |
| 端特有保留 | 对照 CLI | R14 段仅本端有——不丢失 |
| 槽缺失 | 删任一槽文件 | 空缺 + 警告（不 fallback）——§3.4 |
| 锚断言 | prompts-async-guidance 测试 | 施工③重写后全绿 |

## 指针卫生（群 A 批——`§21` 前缀清理 + R24 归属登记）（2026-09-11）

> 来源：批次档 `2026-09-11-VSC-MIRROR-SWEEP（本仓）` §1 条目 A4/A5
> （指针 = CLI 批 `2026-09-11-NORMAL-MODE-AUDIT.md:246`（VSC 镜像登记）/ `2026-09-11-ROLE-REDEFINITION.md:72`）。

### A4：`§21` 前缀残留清理（6 行——逐字删前缀）

背景：`§21` 是 CLI 需求档 NORMAL-MODE 的旧节号（已重排）；CLI 两档已清前缀（批 23），本端遗留 6 行：

| # | 文件:行（as-of） | 旧（逐字） | 新（逐字——仅删 `§21 ` 前缀） |
|---|---|---|---|
| 1 | `src/prompts/discipline-normal.md:98` | `(§21 F-N1.5 2026-09-05 ruling)` | `(F-N1.5 2026-09-05 ruling)` |
| 2 | `src/prompts/discipline-normal.md:107` | `(§21 F-N1.6 2026-09-05 ruling;` | `(F-N1.6 2026-09-05 ruling;` |
| 3 | `src/prompts/discipline-engineering.md:161` | `(§21 F-N1.5 2026-09-05 ruling)` | `(F-N1.5 2026-09-05 ruling)` |
| 4 | `src/prompts/discipline-engineering.md:169` | `(§21 F-N1.6 2026-09-05 ruling;` | `(F-N1.6 2026-09-05 ruling;` |
| 5 | `docs/design/prompts/discipline-normal.md:128`（zh 权威） | `（§21 F-N1.5 2026-09-05 裁定）` | `（F-N1.5 2026-09-05 裁定）` |
| 6 | `docs/design/prompts/discipline-normal.md:136`（zh 权威） | `（§21 F-N1.6 2026-09-05 裁定）` | `（F-N1.6 2026-09-05 裁定）` |

- 语义源 = CLI 批 23（两档删前缀——本端同形；不抄 CLI 其他文本）；zh 权威档 `discipline-engineering.md` 无 F-N1.x 行（零改）；
- 替换纪律：逐处替换（禁批量 sed）；括弧宽度逐字保留（不顺手归一）。

**AC-MA4**：`§21 `（带尾空格）在代码域（`src` / `test`）零命中（机检模式 = `grep -rn '§21 ' src test`——as-of = 6 处全部落位）；`F-N1.5` / `F-N1.6` 子串在两档各保留；宽度新增 0；`prompts-async-guidance` / `prompts-mirror-anchors` / `doc-consistency` 族全绿（锚零损）。

**用例**：T-MA4-1（正常：6 行逐字替换——键控=文件+行）；T-MA4-2（边界：`grep -rn '§21 ' src test` 零命中——模式含尾空格、域 = 代码域 src/test）；T-MA4-3（错误/反证：合成含 `§21 ` 行 → 断言捕获）。

**边界（同族观察——另批，本批零动）**：冻结模式 = `§21 `（含尾空格）+ 域 = `src` / `test`——同族 `§21.1` 形态**不匹配**（空格差异——自然隔离）。
残余登记：`src/agent-tools/subagent-scheduler.mjs` 10 处（:10 / :206 / :230 / :245 / :256 / :257 / :293 / :310 / :311 / :313）+ `src/agent-tools/subagent-actions.mjs:161`；
记史面 `CHANGELOG.md:37/:43/:44`（域外——不参与代码域机检）。同族观察登记，另批勘察（格式同 A3（e）边界——`AGENT-LOOP.md` §13）。

### A5：R24 死指针修复（**增补裁定——纳入本批；原「PORTABILITY 承接」登记改判**）（2026-09-11 增补）

> **修正轮再改判（2026-09-11——设计评审轮次 1 #2 后，父侧裁定）**：本行**归 `PORTABILITY-VSC-MIRROR` 批次承接**——
> 设计 = VSC `PORTABILITY.md` §4.4（a）（其修正轮 #2 已落「（CLI 侧）」逐字同文）——**本批零动（防双写）**。
> 本节以下内容（增补裁定 / 逐字表 / AC-MA5-1 / T-MA5-1..3 / 协调留痕）为史留设计稿——其「本批承接」朝向均以本注为准；
> 本批验收不含 A5′（AC / 用例随承接批执行）。

> 增补来源：父侧 2026-09-11 转告（来源注记 =「评审 #157 顺带发现」——实证：`docs/design/METHODOLOGY.md`
> 在 VSC 仓从无、thincoder 仓亦已退役入 `_archive/`）。指令 = 纳入 A4 同族（指针卫生）设计；
> 同源语义 = CLI 侧已清同族（各端独立落——**勿抄文本**）。

**逐字（EN 档 `src/prompts/discipline-engineering.md:213`——仅句尾一句替换；行数零净变）**：

| 位置 | 文本 |
|---|---|
| 旧（`:213` 句尾） | `动机与完整机制见 \`docs/design/METHODOLOGY.md\` R24 节。` |
| 新（`:213` 句尾） | `动机与完整机制见纪律层 \`src/prompts/discipline-normal.md\` 代码结构判据节（原 \`docs/design/METHODOLOGY.md\`（CLI 侧）已于 2026-09-10 退役入 \`_archive/\`）。` |

- 语义源 = **本端 CN 现形态**（`docs/design/prompts/discipline-engineering.md:139`——逐字对齐，消 EN/CN 漂移）；CN 档零改；
- `（CLI 侧）` 事实限定保留（该方法论文件属 CLI 侧——本端从无）；
- **节结构零动**（保留 R24 挂钩节——两档本体内引「R24a」（:51/:68）编号引用零波及；不取 CLI 的「整删节」路径——本端独立落）；
- **与 PORTABILITY 批去重（呈请父侧）**：`2026-09-11-PORTABILITY-VSC-MIRROR` 设计档 §4.4(a):271 / T-V18 已含同行同动作修法（「EN 对齐 CN 现形态」）——本批（增补后）承接该行；请父侧协调 PORTABILITY 批撤下其 `:213` 编辑点（防双写），或另裁。

**AC-MA5-1**：`grep -rn "docs/design/METHODOLOGY.md" src/prompts/discipline-engineering.md` 命中仅新句退役注形态（`（CLI 侧）` 在位）；旧串 `见 \`docs/design/METHODOLOGY.md\` R24 节` 零命中；EN/CN 两档 R24 行同文；`prompts-async-guidance` / `prompts-mirror-anchors` 族全绿。

**用例**：T-MA5-1（正常：句尾替换落位——文件+串键控）；T-MA5-2（边界：EN/CN 同文——两档该行 diff 断言）；T-MA5-3（回归：旧串零命中 + 锚族绿）。

**协调留痕**：原「PORTABILITY 批承接——本批零改」句（本条前一版）随增补改判；文件行域避让维持（本批 A4/A7 编辑点 :110/:161/:169 + 本条 :213）。

**修正轮注（同上——以顶部改判注为准）**：本批编辑点 = `:110` / `:161` / `:169`（A4 / A7）；`:213` 不再属本批（归 PORTABILITY 批——本批零动并防双写）。
行号 as-of 漂移补记（修正轮实测）：目标句现落 `:217`（CN 侧 `docs/design/prompts/discipline-engineering.md:142`）；`:161` / `:169` 仍原位——字符串键控 = 旧句 ``动机与完整机制见 `docs/design/METHODOLOGY.md` R24 节。``（承接批动手前重扫）。

## 语料修复（VSC-CONTEXT-PARITY 批——2026-09-11）

> 来源：批次档 `2026-09-11-VSC-CONTEXT-PARITY（本仓）` §1 条目 E3（用户 22:54 原话 +
> 裁定 1：权威源 = CLI 蓝图）；需求 = `PROMPT-SYSTEM（CLI 仓）§9`（F-P1~F-P5）。
> 本批 = 事故性漂移的修复（缺节补回 / 压平修复 / 并行节去重 / 子句补齐 / [4] 层权威句更新）——
> 不改变提示词体系（四槽位/场景表/降级链零动）。

### 修一：`discipline-normal.md` 语料修复（编辑点——逐字表）

依据 = 本端中文权威镜像 `docs/design/prompts/discipline-normal.md:29-34/:36/:42-47/:49/:56/:97`（与 CLI
同源；下文 old 文本 = as-of 实测，实现按**字符串键控重扫**）：

| # | 点 | old（as-of） | new（逐字） |
|---|---|---|---|
| E-1a | 缺节 + 压平①（`:27` 行尾） | `…Trust the runtime over your theories. UI & interface design:` | `…Trust the runtime over your theories.` + 空行 + **`### 文档先行`** 整节（见「来源①」）+ 空行 + `### UI & interface design (from discipline.md)` |
| E-1b | 缺节 + 压平②（`:31` 行尾） | `…承诺点。 Code structure — plan the layering`（后接 ` while writing, not after (2026-09-05 methodology: comprehension-cost layering):`） | `…承诺点。` + 空行 + **`### 查重与意图（先定对再定小）`** 整节（见「来源②」）+ 空行 + `### 代码结构判据 — plan the layering while writing, not after (2026-09-05 methodology: comprehension-cost layering)` |
| E-1c | 压平③（`:36` 行尾） | `…(file caps are fallbacks, not goals). Edit & write discipline (2026-09-05 — …one machine):` | `…(file caps are fallbacks, not goals).` + 空行 + `### Edit & write discipline (2026-09-05 — …one machine)`（去尾冒号、补 `### `；标题文本余部逐字保留） |
| E-1d | 压平④（`:40` 整行） | `Review discipline (standard mode only — engineering mode has its own review timing rules):` | `### Review discipline (standard mode only — engineering mode has its own review timing rules)`（去尾冒号） |
| E-1e | 合并行①（`:42`） | `**After each advisor review…**（3 条 bullet 并入一行）` | 按 ` - ` 边界拆 3 行，片段逐字（结果 = CLI `:99-101` 同构） |
| E-1f | 合并行②（`:62`） | `complete the split inside ONE task (no two-batch intermediate states). Assertion-count parity binds splits only — …` | 拆 2 行（CLI `:75/:76` 同形）：第一行止于 `…intermediate states).`；第二行 = `  Assertion-count parity binds splits only — inventory cleanup rounds delete per an explicit itemized list (count delta = list).` |

**整节补入来源（逐字——实现读源档拷贝，不照本档转写）**：

- **来源①（文档先行）**：正文 = `src/prompts/discipline-normal.md:30-34`（CLI 仓） 逐字（3 bullet）；
  唯一替换：其中的 `docs/README.md` → `docs/design/README.md`（地图路径——镜像 `:32` 同）。
- **来源②（查重与意图）**：正文 = CLI 同文件 `:43-47` 逐字（零替换）。

**逐字块②（查重与意图——clause 与 CLI `:42-47` 同源）**：

```
### 查重与意图（先定对再定小）
- **Check existing code.** Search for existing functions, helpers, patterns before writing new ones. Duplicates are technical debt.
- **Understand intent.** Ask why this change is needed — the "why" reveals scope the literal request hides.
- **Decide what's right before deciding what's smallest.** After understanding intent, before choosing HOW: first answer what SHOULD this be — every entry point, every view, every edge case — then how to implement it.
Implementation size is a consequence of "right", never the criterion.
"Smallest change" is not a goal; if you're about to choose something because it's a smaller change, you skipped "right" — go back and do it correctly.
```

**标题文本裁定**（E-1a/b 的两个恢复标题）：`### UI & interface design (from discipline.md)` 与
`### 代码结构判据 — plan the layering…`——以镜像/CLI 同源标题为定稿（残余文本 `UI & interface design:` /
`Code structure — …` 为压平损伤的一部分）；若父侧裁定极小修（保留残余头词），仅换标题行字符串，余不动。

### 修二：`discipline-engineering.md` 子句补齐 + 并行节去重

- **E-2（3 子句）**：在 `:18`（`2. **设计** — …设计定了再动手。`）之后插入 3 行（逐字 = CLI
  `discipline-engineering.md:18-20`；缩进 3 空格 + `- `）：

```
   - 设计 = 对需求的检验——设计写不出来的地方，就是需求没说清的地方（回问，不自己补）。
   - **需求缺口停报链**：勘察发现需求说不通 / 与实现冲突 / 归属不明 → **停下打回主 agent**，不自行选一种解释往下写。
   - **写权**：设计档与需求档由 eng-designer 写作（含修订）；主 agent 记批次档、核验设计稿、发起评审。
```

- **E-3（并行节去重——单宿主裁定）**：单宿主 = `discipline-engineering.md`（理由：CLI 单宿主即 de；
  中文权威镜像亦登记「机制正文 = 本端英文落地 `src/prompts/discipline-engineering.md` Multi-Task 节」）：
  - 先**迁移**：`persona-engineering.md:83` 独有行（`Cancelling a running eng-coder is a last resort — its
    in-flight delivery dies unmerged and unaudited; verify the alarm with reliable checks and prefer
    scoped recovery first.`）插到 `discipline-engineering.md` 的 `Keep the concurrency cap…` 行与
    `- **Cap: at most 4 concurrent eng-coders.**` 行之间（与 pe 内原位同相对位）；
  - 再**删除**：`persona-engineering.md` 整节 `:56-87`（含标题行——「VSC 端特有段」注随节删除）；
    R14 内联句随副本删除（de `:222-226` R14 段为其单宿主）；
  - 同步：本档「端特有差异（本端独有——保留面）」表两行改写（上已更新）+ `test/prompts-async-guidance.test.mjs`
    锚#7 宿主断言 `persona-engineering.md` → `discipline-engineering.md`（与 CLI 同宿主）。

### 修三：R24 收口判定（本批零改）

- VSC 侧 R24 挂钩节（`discipline-engineering.md:216-218`）与两档镜像 R24 行均已就位（批次二已收口）——**本批零改**；
- CLI 英文源缺 R24 节 = CLI 侧登记面（`PORTABILITY（CLI 仓）` 口径「保留登记」）——本批不改 CLI，维持登记。

### 修四：权威句更新（裁定 1）

- 删除「[4] 层由调用面承担」句（本档降级链节——已替换为真实注入面指向）；
- `test/prompts-async-guidance.test.mjs:345-354` 的契约断言同步：本端降级链③（AGENTS 缺失 = 静默跳过）
  的机判改为：① `src/agent/setup.mjs` 含项目指令块 + skills 尾块注入（caller tail 真实存在）——已退场（段删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §8.1）；② 场景表仍无
  `/AGENTS|skills/i` 槽文件（四槽位矩阵零变）；③ 缺失静默语义由 `test/context-parity.test.mjs` T-CI-2 机判。

### 受影响文件（行数 as-of 2026-09-11 实测 → 预计——修正轮 #5 补）

| # | 文件 | 现 | 预计 | 改动点 |
|---|---|---|---|---|
| 1 | `src/prompts/discipline-normal.md` | 168 | ~191 | E-1a~f（两缺节补入 ~+18 · 4 标题/2 合并行拆分 ~+5——合 ~+23） |
| 2 | `src/prompts/discipline-engineering.md` | 225 | ~229 | E-2 三子句（+3）+ E-3 cancel 行迁入（+1） |
| 3 | `src/prompts/persona-engineering.md` | 87 | ~55 | E-3 并行节 `:56-87` 删除（−32；cancel 行先行迁入 de） |
| 4 | `test/prompts-async-guidance.test.mjs` | 453 | ~455 → **535（实测）** | 锚#7 宿主断言 pe→de（换向）+ 降级链③ 契约断言改写（修四——补 `setup.mjs` 尾块源断言）；超 500 硬帽（当时）——后经散文锚退役降至 **177**（≤500）；测试档 500 硬限无豁免——`child-permission` 超限拆分已落（方案 = `LEDGER-SELF-CONTAINED（本仓·设计）§9`）〔实现后同步（2026-09-12）〕 |

（口径 = 行数实测；预计为方向估计——实现报告实测对表。E-1a/b 两节整节行数取决于源档拷贝（来源①/②）——含其净增。本档自身亦随本批更新——文档域，不计入实施域。）

**实现后同步（2026-09-12——交付实测态对齐）**：行 4 `test/prompts-async-guidance.test.mjs` 实测 **535**（当时）——后经散文锚退役降至 **177**（≤500）；测试档 500 硬限无豁免——`child-permission` 超限拆分已落（方案 = `LEDGER-SELF-CONTAINED（本仓·设计）§9`）。

### 用例表

| # | 类型 | 输入 | 预期输出（断言） |
|---|---|---|---|
| T-PC-1 | 正常 | — | 已退场（整删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §8.1（`:182`）） |
| T-PC-2 | 边界 | — | 已退场（整删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §8.1（`:183`）） |
| T-PC-3 | 正常 | — | 已退场（整删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §8.1（`:184`）） |
| T-PC-4 | 回归 | 锚族 | `prompts-async-guidance`（含锚#7 宿主改 de）/ `prompts-mirror-anchors` / `doc-consistency` 全绿 |

### 验收标准

| AC | 判据 | 回指 |
|---|---|---|
| AC-PC-1 | 修一/修二逐点落地（字符串键控核验）+ **四档行数实测对表**（四档 = 上文受影响文件表：3 档提示词 + 1 测试档——修正轮 #5） | F-P1~F-P4 |
| AC-PC-2 | `AGENTS.md` 尾块两态断言（有→`<untrusted_project_instructions>` 在；无→静默）+ skills 空态零追加 | F-P5 |
| AC-PC-3 | 锚族全绿 + `check-doc-width` 新增违规 0 | N-P1/N-P3 |

**计数（D3）**：编辑点 = E-1a~f 六行（覆盖 8 处：两缺节 + 4 压平 + 2 合并行）+ E-2 三行 + E-3 两处
+ 测试同步 2 点位；涉及 3 档提示词 + 1 测试档 + 本档。

## 机制纪律提示词落地（TEST-DISCIPLINE-PROMPTS 批——2026-09-11）

> 来源：批次档 `2026-09-11-TEST-DISCIPLINE-PROMPTS（本仓）` §1（T1–T7）；需求 = `PROMPT-SYSTEM（CLI 仓）§10`
> （F-TD1–F-TD7 / N-TD1–N-TD3）；设计+测试 = `PROMPT-SYSTEM（CLI 仓）§8`（逐字文本权威 = 其 §8.3；本端三档 × 双源各版同文（修正轮 #5）——下文同文副本供本端自查）。
> **实施序（跨批硬约束）**：本端落笔在 `VSC-CONTEXT-PARITY` 批（语料修复）**之后**——落笔前读现态、在修复后的基线上叠加；
> 行号键控为准（语料修复漂移本端 dn/pe 行号）；两批逐字文本禁止并行落地。

### 本端编辑点（三档 × 双源 = 6 文件 / 8 编辑点 + 锚组——修正轮 #5）

| # | 文件（行数 as-of） | 键控定位 | 动作 |
|---|---|---|---|
| 1 | `src/prompts/discipline-engineering.md`（225） | 「### 推进档位收口」块末行后 / 「## 批次档与执行者纪律」前 | 插入新节「测试纪律」（Text A） |
| 2 | `docs/design/prompts/discipline-engineering.md`（152） | 四步流程 step 4 行后 / 「## 批次档与执行者纪律」前 | 同上 |
| 3 | `src/prompts/discipline-engineering.md` | 「台账条目一行一条…」行 | 尾注（计数口径 = 未决数）+ 插入台账块（Text D） |
| 4 | `docs/design/prompts/discipline-engineering.md` | 同上 | 同上 |
| 5 | `src/prompts/discipline-normal.md`（168） | 旧串 `- Code changes need at least one test.`；`:8` 尾改 | 替换为两行（Text B EN）+ Text C EN（行号受语料修复漂移——键控） |
| 6 | `docs/design/prompts/discipline-normal.md`（182） | 旧串 `- 代码变更至少要有一个测试。`；`:8` 尾改 | 替换为两行（Text B CN）+ Text C CN |
| 7 | `src/prompts/persona-engineering.md`（87） | 「Yours」条目后 | 插入归属句（Text E EN） |
| 8 | `docs/design/prompts/persona-engineering.md`（53） | 「你的」条目后 | 插入归属句（Text E CN） |
| 9 | `test/prompts-mirror-anchors.test.mjs`（319） | ⑧ 组后 | 追加「⑨ 机制纪律锚」组（字面串同 CLI §8.5——含 CLI 侧逐字对照） |

### 逐字文本（本端定稿——与 CLI 同文；落笔前与 CLI `PROMPT-SYSTEM（CLI 仓）§8.3` 字面核对）

**Text A — de ×2 源（全文）**：

```markdown
## 测试纪律（工程侧——寿命 / 门禁 / 归册）

- **测试按寿命分三层**：① **单元测试 = 开发期工具**——为改对代码而写（开发期自证，可断言实现内部）；②③ **集成测试 = 项目资产**——② 业务场景设立 + ③ 生产问题补入，只断言业务可观察结果；常驻，**不因单次改动而增补**。
- **① 的收口处置**：批次收口逐条判——**默认退役（删除）**；业务可观察 + 集成未覆盖 + 可稳定驱动，三者全满足才转 ②③（改写成业务语气场景）；处置行落批次档 §6。**退役是常态、保留须举证**——不为凑数写测试，同类即合、冗余即删（防回潮），不维护存量测试库存。
- **发布门 = 项目的完整验证链**（本产品自研仓 = lint → test:full → test:integration）：验收依据 = ②③ 集成资产全绿 + 项目其余门禁——**不是单批测试数量**。
- **重 IO 用例归册**：真 fs / git 子进程 / 定时器 / 网络类用例（单例超阈值——本产品自研仓 = >500ms 归 `slow()`）归册到慢测层——快层自动 skip、全量照跑；**未归册而超阈 = 硬红**（防慢测腐化）。
```

**Text B — dn 旧句替换（EN / CN）**：

```markdown
- Code changes must be verified — unit tests are development-time tools (write them to get the change right; their retention afterwards follows the project's test-lifecycle policy).
- Integration tests are project assets — never augmented per single change; the release gate is the project's full verification chain.

- 代码改动必须验证——单元测试是开发期工具（为改对代码而写；用后去留按项目的测试生命周期政策处置）。
- 集成测试是项目资产——不因单次改动而增补；发布门 = 项目的完整验证链。
```

**Text C — dn `:8` 尾改（EN / CN）**：`Add tests if the project has them — as unit tests (development-time tools; retention per the test-lifecycle policy).`
／ `项目有测试就加测试——写单元测试（开发期工具；用后去留按测试生命周期政策）。`

**Text D — de 台账块（×2 源）**：

```markdown
**状态机**：`status=` 只取**六态**——活文件只留**未决四态**（待讨论 / 待设计 / 在途 / 待核销）；**已核销 / 已废弃 = 归档态**——勾销后逐条移入项目归档档（本产品自研仓 = `docs/TODO-archive.md`），活文件不留已决条目。
**技术待办专属**：每条带**一种触发**——`触发=归批（<批名>）` / `触发=条件（<条件句>）` / `触发=认账不排期`；无触发的条目进「待处置」清单，行龄超 30 天标「老化」——报告只读，处置要人判（主 agent 与用户）。
```

**实现后同步（2026-09-12）**：原第 3 行「**维护归属**：…」**移除**——对齐 CLI 权威版 `PROMPT-SYSTEM（CLI 仓）§8.3.4` 最终版（修正轮 #2：归属规则单宿主 = pe（本端 Text E）；**不设 de 侧指针**——子代理装配无 pe 面、指针为死指针；理由与依据见该档落修注）。实现侧已达两行版（批次档 `2026-09-11-TEST-DISCIPLINE-PROMPTS（本仓）` §5 偏差 #1）；本注 = 文档面对齐交付态。

**Text E — pe 归属句（EN / CN）**：

```markdown
- **The ledger is yours**: the requirement-pool / tech-backlog ledger (record + status advance + physical writes; subagents never declare ledger files in `files`).

- **台账归你**：需求池 / 技术待办台账（记录 + 状态推进 + 物理落笔；子代理一律不在 `files` 声明台账档）。
```

### 用例与验收（本端对位）

- 用例 T-TD7（正常）：本端三档 × 双源（6 文件）全串命中（⑨ 组——修正轮 #5）；T-TD8（回归）：本端快层全绿（mirror-anchors / async-guidance / doc-consistency）；
- 验收 AC-TD1–AC-TD8（CLI 档 §8.6）逐条本端对位；本端专属判据 = ⑨ 组全绿（含 CLI 侧逐字对照）+ `check-doc-width` 新增违规 0；
- 端特有注：本端 de 行号背景含端特有段（R14 池规则 / Multi-Task 注）——本批编辑点均避开端特有段；pe 并行节去重（语料修复批 E-3）会漂移行号——本批锚点为 Yours 条目（键控）。

## 变更记录
- 2026-09-12（TEST-DISCIPLINE-PROMPTS 批·实现后对位——Text D 归属行移除）：机制纪律节 Text D 第 3 行移除——对齐 CLI 权威版 `PROMPT-SYSTEM（CLI 仓）§8.3.4` 最终版（单宿主 = pe、不设指针）；实现侧已达两行版（批次档 `2026-09-11-TEST-DISCIPLINE-PROMPTS（本仓）` §5 偏差 #1 闭合）。纯对位、零语义。
- 2026-09-12（VSC-CONTEXT-PARITY 批·实现后同步——交付实测态对齐）：语料修复节受影响文件表行 4 实测回填（`test/prompts-async-guidance.test.mjs` 453 → 实测 535——超 500 硬帽（当时）；后经散文锚退役降至 177（≤500）；测试档 500 硬限无豁免——`child-permission` 超限拆分已落，方案 = `LEDGER-SELF-CONTAINED（本仓·设计）§9`）。纯登记、零语义。
- 2026-09-12（修正轮 #5——TEST-DISCIPLINE-PROMPTS 设计评审轮次 1 落修）：机制纪律节计数口径统一「三档 × 双源 = 6 文件 / 8 编辑点」（原「四档 × 双源」/「四档双源」/「6 档提示词」/「四档同文」四处 + 同型残留——CLI 档 §8.5/§8.7 两处一并）。纯口径、零语义。
- 2026-09-11：机制纪律提示词落地节新增——TEST-DISCIPLINE-PROMPTS 批（本端 3 档提示词 × 双源 = 6 文件 / 8 编辑点 + ⑨ 锚组；逐字文本同 CLI `PROMPT-SYSTEM（CLI 仓）§8.3`；实施序 = 语料修复批后落）。
- 2026-09-11：语料修复节新增——VSC-CONTEXT-PARITY 批（E-1a~f 缺节/压平/合并行 + E-2 三子句 + E-3 并行节去重单宿主 de + R24 维持登记）；降级链节 [4] 层权威句替换（「由调用面承担」作废）；端特有差异表两行改写。
- 2026-09-11（修正轮——设计评审轮次 1 #5 落修）：语料修复节补「受影响文件（行数实测 → 预计）」表（3 档提示词 + 1 测试档）；AC-PC-1「四档」明确所指（= 该表）。纯登记与口径、零语义。
- 2026-09-11（修正轮——设计评审轮次 1 #1/#2/#8 落修）：A4 节 AC-MA4 冻结机检模式（`§21 ` 含尾空格 + 域 src/test）+「同族观察」边界登记（`§21.1` 残余——另批零动）；A5 节顶注再改判＝归 `PORTABILITY-VSC-MIRROR` 承接（本批零动——协调留痕随更）；`:3`「14 文件」→ 15。纯口径冻结与归属登记、零语义。
- 2026-09-11（增补）：A5 改判——R24 死指针纳入本批修复（逐字 = 本端 CN 现形态；原 PORTABILITY 承接登记改判 + 去重呈请——见 A5 节「协调留痕」）。
- 2026-09-11：群 A 批——新增「指针卫生」节（A4 `§21` 前缀清理 6 行——逐字表 + AC/用例；A5 R24 行归属登记——PORTABILITY 批承接、本批零改）。
- 2026-09-09：建档（用户裁定 VSC 端须有提示词设计文档——多实现面纪律下各端独立——本档承载本端
  15 文件现行形态 + 端特有差异 + 与 CLI 权威档的关系——批 1/批 2 已交付/批 3-5 待做如实记录）。
- 2026-09-10：PROMPT-SYSTEM 施工①②③双端同批——本档重写为 14 文件槽位化现行态（旧三件套/子代理
  拼装表/METHODOLOGY 降级链描述随退役作废；装配机制节换四槽位表驱动；端特有差异表按新宿主更新）。
- 2026-09-11：「提交即走」（spawn 排队）纪律句落档——本端落点 = `src/prompts/discipline-engineering.md` 调度段 + `src/prompts/persona-engineering.md` 对位段（各 +1 条）；语义同源（CLI 侧落点与逐字全文见 `PROMPT-SYSTEM（CLI 仓）` 变更记录）。
