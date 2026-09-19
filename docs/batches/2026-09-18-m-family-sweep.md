# 2026-09-18 · M 家族小散件收正批（乙）

## §1 讨论（主 agent）

**状态行**：✅ 已收口 2026-09-18（提交 `983bb3e1`——8 档；三包全绿；残留已归 #52 / #42）

### 1.1 批件（用户 2026-09-18 02:28「M家族开」；盘点报告 = `2026-09-18-m-family-inventory.md` §三·乙 + §2.3 缺口 4）

| # | 条目 | 实况 |
|---|---|---|
| ① | **M5 残修 · 描述句与实门矛盾** | `thincoder-core/agent-tools/subagent.mjs:133` 逐字「engineering mode exposes explore/plan/eng-designer/eng-coder」vs 实门 `:245` 工程模式**禁 plan**（规格 ②.3「plan 不入」）——该句**进模型上下文**，会误导派单 |
| ② | **M5 残修 · `ROUND_VALUES` 单源不实** | `thincoder-core/agent-tools/spawn-gates.mjs:27` 导出 `ROUND_VALUES`，但 schema `subagent.mjs:154` 用**内联字面量**；唯一消费方 = 自己的测档（`spawn-gates.test.mjs:17/:81`）——用例名「schema enum 同源单点」与实况不符 ⇒ 真单源 or 删导出（择一 + 用例名收正） |
| ③ | **VSC 测试登记死项** | `thincoder-vscode/test/files.mjs:49/:74/:75/:76` 登记四个**已不存在**的档（`test/doc-consistency.test.mjs` · `test/ledger-check.test.mjs` · `test/doc-anchors.test.mjs` · `test/reconcile-lookup.test.mjs`）——`test/run.mjs:51` 直接透传清单 ⇒ **是否致 `npm test` 失败 = 未验证**（盘点 §2.3 缺口 4） |
| ④ | **AC-M5 补验** | AC-M5-1/2/5/6 机判（引既有用例）；与甲批同轮写 gate 档 §6 |

### 1.2 路径

- **设计轮**（eng-designer）：① 描述句收正文案 ② `ROUND_VALUES` 二选一裁定（真单源 = schema 引用导出 / 删导出 + 用例名改）③ 死项处置（先核 `npm test` 现状——死项是否致红 ⇒ 删登记 / 补档）④ 受影响文件表 + AC + 用例 → 评审 → coder。

### 1.3 边界

- **禁触**：`scripts/**` · 冻结批档 / `_archive/**` / 参照树 · 提示词面 · 提示词内容（① 改的是工具描述串 = core 代码，非 prompts 文件）。
- 与甲批分工：①②③ = 代码/测试面（本批）；AC 核验本身 = 甲批。

### 1.4 台账

- **#24**（在途 umbrella——乙 = 其中一环）。

### 1.6 父侧裁定（修正轮观察项处置——评审轮 2 核验面之外，另记）

| # | 观察项（修正轮自报） | 裁定 |
|---|---|---|
| 1 | `thincoder-vscode/test/run.mjs:22-25` 失败前缀仍 `✖ integration manifest check failed:`（自检①已扩两清单 ⇒ 名实不符） | **纳入实施轮**（同改动的直接导出项——消息随检查面走）：前缀改为覆盖两清单的表述 + 层名，unit 侧文案同族对齐 |
| 2 | `thincoder-vscode/test/files.mjs:43` 注释仍载裸节号 `ENGINEERING-MODE.md §2.22/§2.23`（实测活体面不可解析——该节号只存参照历史） | **纳入实施轮**（与评审发现 6 同族）：改自足表述（去裸节号） |

**落点**：两条均入实施轮任务书（本表为父侧裁定面；评审轮 2 的核验对象不包本表）。

## §2 批次任务与设计修订（eng-designer）

### 2.1 本批范围（回指 §1.1）

| 条目 | 内容 | 归属 |
|---|---|---|
| ① | M5 残修 · 描述句与实门矛盾（**含装配 enum 同一缺陷的第二面**——见 2.4） | 本批（A-MS1/2/5） |
| ② | M5 残修 · `ROUND_VALUES` 单源不实 | 本批（A-MS3/4） |
| ③ | VSC 测试登记死项（4 条） | 本批（A-MS7/8） |
| ④ | AC-M5 补验（AC-M5-1/2/5/6 机判） | **甲批**——不属本批，不在本次改动面内 |

**设计档（唯一权威源）**：`docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.23（①②）· `docs/core/design/TESTING.md` §10.1（③）。任务书与设计档同源；冲突以设计档为准并回报。
**轮次（round）**：`initial`。

### 2.2 受影响文件表（8 档 · 行数口径 = `wc -l` · as-of 2026-09-18）

| # | 文件 | 现 | Δ | 改动 |
|---|---|---|---|---|
| 1 | `thincoder-core/agent-tools/subagent.mjs` | 408 | +1 | 描述句 `:133` 换新句（行数不变）· 顶部加 `import { ROUND_VALUES } from "./spawn-gates.mjs"` · `:154` schema `enum: ROUND_VALUES` |
| 2 | `thincoder-core/agent-tools/spawn-gates.mjs` | 107 | +2 | `:50` 判据改 `!ROUND_VALUES.includes(a.round)`（文案逐字不变）· `:26` 注补「单源」句 |
| 3 | `thincoder-core/agent/family-tools.mjs` | 169 | ±0 | `:46` 工程模式 enum 去 `plan` |
| 4 | `thincoder-core/test/spawn-gates.test.mjs` | 141 | +8± | import `subagentTool`；`:81` 用例改「单源锁」 |
| 5 | `thincoder-core/test/family-tools.test.mjs` | 118 | ±0 | `:93` 工程模式 enum 期望值收正 |
| 6 | `thincoder-cli/test/eng-designer-role.test.mjs` | 269 | ±0 | T30 `:93` 描述句 regex 换新句 · `:96` 工程模式 enum 期望值收正 |
| 7 | `thincoder-vscode/test/files.mjs` | 83 | −2（净） | 删 4 条死项（`:49`/`:74`/`:75`/`:76`）+ 一条退役注（占 2 行） |
| 8 | `thincoder-vscode/test/run.mjs` | 52 | +2 | 清单自检 ① 由 integration 单清单改为**两清单同检**（多行嵌套：改前 `:28`–`:30` 三行 → 改后五行） |

**文件域（spawn `files`）**：以上 8 档逐条声明（**不含** `docs/**`——设计档已由设计轮落笔，实施轮零写文档）。

### 2.3 逐条改动（改前 → 改后 · 可直接照抄）

**①a `subagent.mjs:133`**（整行替换，`\n\n` 结尾保留）：
- 改前：`Mode filtering: normal mode exposes explore/plan/coder; engineering mode exposes explore/plan/eng-designer/eng-coder. The schema enum reflects the active mode.`
- 改后：`Mode filtering: normal mode exposes explore/plan/coder (eng-coder and eng-designer are refused); engineering mode exposes explore/eng-designer/eng-coder (plan and coder are refused — plan is a normal-mode role, coder is replaced by eng-coder). The role enum is filtered per mode at assembly, and the spawn gate refuses out-of-mode roles mechanically.`

**①b `family-tools.mjs:46`**：`enum: ["explore", "plan", "eng-designer", "eng-coder"],` → `enum: ["explore", "eng-designer", "eng-coder"],`
（`:51` 正常模式 `["explore", "plan", "coder"]` **零改**；`:48` suffix 句**零改**）

**② `spawn-gates.mjs`**：`export const ROUND_VALUES = ["initial", "fix"]` 保持 `.mjs` 唯一字面量处（注补一句「单源：schema/谓词同引用」）；谓词判据 `if (a.round !== "initial" && a.round !== "fix")` → `if (!ROUND_VALUES.includes(a.round))`。
**错误文案逐字不变**：缺参分支仍输出 `round (initial|fix) — the structured round parameter`；非法值分支仍输出 `round ∈ {initial, fix} (got …)`（用常量拼串，输出同形——T6/T6b 原样通过是判据）。

**② `subagent.mjs:154`**：`enum: ["initial", "fix"]` → `enum: ROUND_VALUES`（+ 顶部 import）。

**③-1 `files.mjs`**：删条目 `:49`（`test/doc-consistency.test.mjs`）· `:74`（`test/ledger-check.test.mjs`）· `:75`（`test/doc-anchors.test.mjs`）· `:76`（`test/reconcile-lookup.test.mjs`）——**连同各自的同行尾注**（注释依附于条目）。
**新增一条退役注（占 2 行）**（放在删除位附近，承 `:9-11` C1 先例形态——**自足表述、不给节号**）：写明「四档随 M8 机检重写批（`b9f439c9`）删除、条目随删除勾销」+「其中 `doc-consistency` 属 2026-09-11 第 5 批入册的五新档之一——该族计数以现值为准」。
（**节号已去**：原拟注文引 `§2.22.6`——实测该节号只存于参照历史 `thincoder-cli/docs/design/ENGINEERING-MODE.md:767`；VSC 树现档 `thincoder-vscode/docs/design/ENGINEERING-MODE.md` 已重写（`2.22` 零命中），`docs/vsc/design/` 无同名档 ⇒ 裸节号在活体面不可解析，且代码档在 `doc-check` 域外——评审轮 1 发现 6。）
**零改**：其余 60 条条目与其尾注、`:43-51` 批次分组注（「5 新档全入册」句指 `prompts-mirror-anchors` 档，不改）。

**③-2 `run.mjs`**：自检 ① 单源化为两清单同检——**落笔形态 = 多行嵌套（照抄如下）；改前 = 文件现有三行 `:28`–`:30`、改后 = 五行 ⇒ Δ = +2**：

```js
// 改前（`:28`–`:30`）
for (const f of integrationFiles) {
  if (!existsSync(join(root, f))) fail(`listed integration file does not exist: ${f}`)
}
```

```js
// 改后（五行——外层按 [层名, 清单] 遍历；层名进文案）
for (const [layer, files] of [["unit", unitFiles], ["integration", integrationFiles]]) {
  for (const f of files) {
    if (!existsSync(join(root, f))) fail(`listed ${layer} file does not exist: ${f}`)
  }
}
```

（integration 文案输出逐字不变；自检 ②③ 零改；`walk("test/integration")` 零改；`unitFiles` import 已在 `:18`——零新增 import）

### 2.4 为何 ① 含 enum（设计裁定，非扩域）

描述句与 **schema enum** 都是**模型可见的派单依据**：只改描述句 ⇒ 模型仍从 enum 读到 `plan`（同一误导换到 schema 面）。
门 `subagent.mjs:245` 的错误文案已自称「the engineering-mode enum is explore / eng-designer / eng-coder」——代码内部已自相矛盾；裁定源 = §6.22 F5「工程模式 enum = explore / eng-designer / eng-coder（`plan` 不入）」。
`plan` 留在 **ROLES 白名单与门文案**中（拒收要能指名）——**不是**「门不认识 plan」。

### 2.5 先红判据（改动的批前/批后状态——照抄判定）

| 改动 | 批前（实读） | 批后期望 |
|---|---|---|
| ①a 描述句 | CLI T30 `:93` 断言**旧句** ⇒ 描述句一改，该断言立刻红（**必须同批改**） | 新句 regex 通过 |
| ①b enum | `family-tools.test.mjs:93` / CLI T30 `:96` 期望**含 plan** ⇒ enum 一改，两处立刻红（**必须同批改**） | 期望 = `["explore","eng-designer","eng-coder"]` |
| ② 单源 | 新断言「schema enum **同一引用** `ROUND_VALUES`」批前**必红**（现为内联副本） | 引用同一性成立 |
| ③-2 自检 | 注入一条不存在的档 ⇒ 批前 `node test/run.mjs` **静默跳过、exit 0**（实测：混合清单中缺失项不报错） | 注入 ⇒ **exit 1** + `listed unit file does not exist: <注入值>` |

**基线读数（as-of 2026-09-18 · 并行线在途，读数会漂移）**：VSC `npm test` = 593 tests / 592 pass / **1 fail**——唯一红 = `T-V13`（`test/portability-vsc-advisor-context.test.mjs`「eng enter 文案逐字」），归因**并行线未提交改动** `thincoder-core/agent-tools/eng.mjs`（#41 先判后翻）——**非本批**，本批不得为它改断言。
（该红使 `TESTING.md` AC-M10-4「三包 npm test 全绿」当前不成立——属他线在途状态；本批判据 = **集合式**（失败集合 ⊆ 批前失败集合 {T-V13}），见 §2.7 A-MS6。）

### 2.6 用例表（正常 / 边界 / 错误）

| # | 类 | 输入 / 动作 | 期望 |
|---|---|---|---|
| U1 | 正常 | 读 `subagentTool.description` | 含新句；不含旧句 `engineering mode exposes explore/plan/eng-designer` |
| U2 | 正常 | `assembleFamilyTools({ depth: 0, engineering: true })` | role enum = `["explore","eng-designer","eng-coder"]` |
| U3 | 正常 | `assembleFamilyTools`（正常模式） | role enum = `["explore","plan","coder"]`（零回归） |
| U4 | 正常 | `subagentTool.parameters.properties.round.enum` | **=== `ROUND_VALUES`**（同一引用）且值 = `["initial","fix"]` |
| U5 | 边界 | `round` 遍历 `ROUND_VALUES` → `validateTaskBookFields` | 逐一放行 |
| U6 | 错误 | `round: "v2"` / 缺 `round` | 拒；文案逐字不变（`round ∈ {initial, fix}` / `round (initial\|fix)`） |
| U7 | 错误 | 工程模式 spawn `role="plan"` | throw，门文案含 `role='plan' is disabled` |
| U8 | 错误 | （注入）清单加一条不存在的档 → `node test/run.mjs` | exit 1 + 点名该档（**注入后必还原**） |

### 2.7 验收标准（逐条回指 §1.1 条目）

| # | 回指 | 判据（命令 ⇒ 期望） |
|---|---|---|
| A-MS1 | ①a | `cd thincoder-cli && node --test test/eng-designer-role.test.mjs` ⇒ exit 0；`grep -c "engineering mode exposes explore/plan/eng-designer" thincoder-core/agent-tools/subagent.mjs` ⇒ `0` |
| A-MS2 | ①b | `cd thincoder-core && node --test test/family-tools.test.mjs` ⇒ exit 0；CLI 侧 T30 ⇒ exit 0 |
| A-MS3 | ② | `cd thincoder-core && node --test test/spawn-gates.test.mjs` ⇒ exit 0（含引用同一性）；`grep -n 'enum: \["initial", "fix"\]' thincoder-core/agent-tools/subagent.mjs` ⇒ 零命中 |
| A-MS4 | ② | T6/T6b/T6c（拒收文案）+ T8 族（`rejectEngineeringFilePaths`）原样通过 |
| A-MS5 | ① | U7 用例通过（门行为零回归） |
| A-MS6 | ①② | `cd thincoder-core && npm test` ⇒ exit 0；`cd thincoder-cli && npm test` ⇒ exit 0；`cd thincoder-vscode && npm test` ⇒ **失败集合 ⊆ 批前失败集合（批前 = {T-V13}）**——等价口径「本批触碰面无新增红」（新红 + T-V13 转绿不得互相抵消——评审轮 1 #4） |
| A-MS7 | ③ | VSC 清单 60 条逐条在盘（`existsSync` 全真、零死项）、4 死项名零出现 |
| A-MS8 | ③ | 注入一条不存在档 ⇒ `cd thincoder-vscode && node test/run.mjs` **exit 1** 且文案 `listed unit file does not exist:`；还原后 `git status` 该档零差异 |

**机检**：`node scripts/doc-check.mjs`（域 = `docs`）——本批**零新增悬空锚**；文档行宽 ≤ 300（表格行豁免）。
（域外面如实报：③-1 的退役注落**代码档** `thincoder-vscode/test/files.mjs`——不在机检域内 ⇒ 注文按自足表述写（不给节号），见 §2.3 ③-1；评审轮 1 发现 6。）

### 2.8 报告格式（交付报告必带）

① 交付表（条目 ①/②/③ 逐条 Done/Simplified/Not done，**无 defer 列**）；
② 改动清单：`条 → file:line`（含 2.3 逐条改动的落点）；
③ 机检读数：A-MS1..A-MS8 的**命令原文 + 实际输出摘要**（含 ③-2 注入反证的前后两次 exit code）；
④ 零改面证明：**本批 8 档逐条列出**（`git status --porcelain` 逐行对照）+ **其余差异逐条归因**（他线在途改动 / 设计轮文档）——保留两项本意：**无注入残留**（U8 注入后必还原）、**无文档改写**（实施轮零写 `docs/**`——设计轮那 8 档之外的 docs 改动归设计轮，不计入实施面）。

### 2.9 边界（禁触）

- **禁触**：`scripts/**` · `thincoder-core/prompts/**` · `thincoder-core/agent-tools/eng.mjs`（并行线在写）· VSC `src/**`（并行线在写）· `docs/**`（设计轮已落笔，实施轮零写）· 冻结批档 / `_archive/**` / 参照树（`thincoder-cli/docs/**` · `thincoder-vscode/docs/**`）。
- **禁夹带**：不为 T-V13 红改断言；不做单元面反向自检（`TESTING.md` §10.1「不做」）；不删正常模式的 `plan`/`coder`；不改门文案与失败文案；不做 AC-M5 核验（甲批）。
- **并行线冲突面（如实报）**：`thincoder-vscode/test/**` 与 VSC `src/**` 有在途未提交改动（另有实例在写）——若 `files.mjs` / `run.mjs` 落笔时发生他线改动，**停止并回报**，不擅自合并。

### 2.10 设计评审修正轮 1 落修记录（2026-09-18 · eng-designer）

**对象** = §3 设计评审轮次 1（`changes-required`：🔴1 · 🟡3 · 🔵3）。**处置执行人 = 本席**（父侧逐条裁定接受；§3 `Suggestion` 列 = 处置建议）。**只点修**：未重开探索、未扩范围、无新语义。

| # | 发现（等级） | 落修 | 落点（改后实测行号） |
|---|---|---|---|
| 1 | 🔴 活档自身同句未收正（Document ownership） | `:19` plan 行模式列「普通 + 工程」→「普通」；`:24` 模式过滤句工程侧去 `plan`（角色互斥句同步为「工程禁 plan 与 coder」+ 回指 §6.22 F5）；`:26`-`:28` 邻域核过 = 无同类旧口径；补变更记录一行 | `docs/core/design/AGENT-LOOP-SUBAGENT.md:19` · `:24` · `:725` |
| 2 | 🟡 退役注行数口径不一 | 三面统一为「一条退役注（占 2 行）」（净 −2 / 83→81 对账口径不变） | `docs/core/design/TESTING.md:325` · `:335`；本档 `:53` · `:73` |
| 3 | 🟡 越 300 软线未登记 | §6.23.4 表后补**拆分计划（超档项）**块（候选拆分面 + 「未触碰」行 + 「本批只登记不执行」），形态对齐 §6.20.4 | `docs/core/design/AGENT-LOOP-SUBAGENT.md:678`–`:683` |
| 4 | 🟡 A-MS6 计数式判据可被抵消 | 改**集合式**「失败集合 ⊆ 批前失败集合（批前 = {T-V13}）」+ 等价口径「本批触碰面无新增红」；本档基线句同口径 | `docs/core/design/AGENT-LOOP-SUBAGENT.md:713`；本档 `:113` · `:137` |
| 5 | 🔵 run.mjs Δ 与「照抄」写法不自洽 | 钉死落笔形态 = **多行嵌套**（改前 `:28`–`:30` 三行 → 改后五行），Δ 收正 +3 → **+2**；照抄块改双 `js` 代码块（改前 / 改后各一段） | 本档 `:54` · `:77`–`:95`；`docs/core/design/TESTING.md:336` |
| 6 | 🔵 代码档注文含不可解析节指针 | 退役注改**自足表述**（去 `§2.22.6`）；实测该节号只存于参照历史 `thincoder-cli/docs/design/ENGINEERING-MODE.md:767`（VSC 树现档已重写——`2.22` 零命中；`docs/vsc/design/` 无同名档）⇒ 裸节号在活体面不可解析，且代码档在 `doc-check`（域 = docs）外 | 本档 `:73`–`:74` · `:142`；`docs/core/design/TESTING.md:325` |
| 7 | 🔵 零改面证明口径与工作区实况不相容 | 改「本批 8 档逐条列出 + 其余差异逐条归因（他线在途 / 设计轮文档）」，保留「无注入残留 / 无文档改写」两本意 | 本档 `:149` |

**机检读数（`node scripts/doc-check.mjs` · 域 = docs · 本席实跑两轮）**：
- 锚 = 悬空 **224**（与改前同数；逐条核过 = 本批触碰面零新增 ✗）：`AGENT-LOOP-SUBAGENT.md` 唯一 ✗ = `:414`（存量）；`TESTING.md` = `:351`/`:354`（存量，原文 `design/E2E-HARNESS.md`）。
- 行宽 = 超宽 **2 行**，均为 `docs/core/design/prompts/persona-engineering.md:137`/`:139`（本席未触碰档）——首轮实跑曾自引入 1 条超宽（`AGENT-LOOP-SUBAGENT.md:680`，349 字符）⇒ 当场折行，复跑清零。

**判据回证**：③ `AGENT-LOOP-SUBAGENT.md` 全档 grep「工程模式 explore / plan」= **零命中**（本席实跑）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**设计轮 1 初评**（评审面 = `docs/batches/2026-09-18-m-family-sweep.md` §2 · `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.23 · `docs/core/design/TESTING.md` §10.1；三档全文已读）
**限制**：① 未提供项目标准档 / 文档地图 ⇒ Document ownership 按判据约定 + 在档内容判；② 评审面仅上述三档（代码档不在面内）⇒ 代码侧坐标 / 行数 / 现文串未复核，涉代码的断言均标 unverified，受影响文件表数字只做档间一致性交叉核。
（out-of-scope note：母档 `docs/core/design/AGENT-LOOP.md` 与提示词面是否载同句未核——不在本次评审面。）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership | 🔴 | ①② 的收正只覆盖代码侧两处「工程模式含 plan」（`docs/core/design/AGENT-LOOP-SUBAGENT.md:660`/`:661`）；活体设计档自身仍留同缺陷表述两处：`:19`（plan 行模式列 = 「普通 + 工程」）· `:24`（「工程模式 explore / plan / eng-designer / eng-coder」）——与 `:612`（§6.22 F5「`plan` 不入——工程模式无 plan 角色」）及新落 `:638`-`:639`/`:642` 在同一机制上两处不同描述。§6.23.8 边界 `:713` 只枚举两处**参照历史**副本，未覆盖本活档副本 ⇒ 同一机制两处不同描述 = 🔴（Document ownership 判据 + R1/R7e 例外） | 同批把 `:19` 与 `:24` 收正到 F5 集（或显式登记为待修项并回指 §6.22 F5），使活档不再保留「工程模式含 plan」的表述；门文案 / ROLES 白名单 / 判据面零改。 |
| 2 | Clarity | 🟡 | 同一改动的行数描述不一致：`docs/core/design/TESTING.md:325` 为「+ **一行**退役注」，同档 `:335` 与 `docs/batches/2026-09-18-m-family-sweep.md:53`/`:73` 为「**2 行**退役注」（并据此给净 −2 / 83→81）；批档 `:40`「冲突以设计档为准」无法裁决——冲突在权威档内部 | 统一到同一值（按净 −2 / 81 行对账 = 2 行退役注），或改写为「一条退役注（占 2 行）」。 |
| 3 | Size annotations | 🟡 | 本批触碰的 `thincoder-core/agent-tools/subagent.mjs` 408 → 409 行越 300 软线；`AGENT-LOOP-SUBAGENT.md:671`（§6.23.4）只写「距 500 硬限充裕，无需拆分」，未按本档 R24a 先例（同档 `:445`-`:449` 拆分计划块；判据句 = 「越软线档在档内登记（含拆分计划）」）登记软线项 / 候选拆分面 | 在 §6.23.4 补一行软线登记（候选拆分面，或明写「本批只登记不执行」），与 §6.20.4 形态对齐。 |
| 4 | Acceptance criteria | 🟡 | `A-MS6`（`AGENT-LOOP-SUBAGENT.md:706` · 批档 `:121`）对 VSC 的判据 = 「fail 计数 ≤ 基线 1」：并行线（#41）在途 ⇒ T-V13 可能由红转绿——若同批引入一条新红而 T-V13 转绿，计数仍 = 1 ⇒ 判据误判通过（对失败**集合构成**不敏感） | 改为集合式判据——「失败集合 ⊆ 批前失败集合（T-V13）」或「本批触碰面无新增红」，使新红不能被计数抵消。 |
| 5 | Clarity | 🔵 | `thincoder-vscode/test/run.mjs` 的 Δ = +3（批档 `:54` · `TESTING.md:336`），但批档 `:77`-`:78` 给出的改前 / 改后均为 1 行单行写法（该节标题称「可直接照抄」）——照抄落笔则 Δ = 0；两处口径在档内不能自洽（文件真实排版未复核——unverified） | 指明改后落笔形态（多行缩进版）或把 Δ 改为与给定写法一致的值，使「照抄」指令与行数对账同口径。 |
| 6 | 引用卫生 | 🔵 | 新退役注落入**代码档** `thincoder-vscode/test/files.mjs`，注文含节指针「§2.22.6 五新档」（批档 `:73`）；批档 `:125` 的机检口径 `node scripts/doc-check.mjs`（**域 = docs**）不覆盖该指针，本次亦未核实 `§2.22.6` 存在性（评审面仅三档——unverified） | 落笔前确认该指针可解析，或把注文写成自足表述（不给节号），避免在代码档留下无人机检的悬空锚。 |
| 7 | Clarity | 🔵 | §2.8 ④「零改面证明 = `git status --porcelain`（仅 8 档改动）」（批档 `:132`）与同档 `:96`（并行线在途、读数漂移）· `:138`（VSC `test/**` / `src/**` 有在途未提交改动）登记的工作区实况按字面不相容 | 改口径为「本批 8 档逐条列出 + 其余差异逐条归因（他线 / 设计轮文档）」，保留「无注入残留 / 无文档改写」两项本意。 |

**计数**：🔴 1 · 🟡 3 · 🔵 3
VERDICT: changes-required

### 轮次 2（评审子代理）

**核验轮（修正轮 id=61 落位核验 · 轮 2）**——评审面 = 三档全文重读：`docs/batches/2026-09-18-m-family-sweep.md` · `docs/core/design/AGENT-LOOP-SUBAGENT.md` · `docs/core/design/TESTING.md`。**轮 1 发现 1–7 = 7/7 Fixed**；新发现 1 项（🟡，非阻断）。

**逐条核验（Orig#1–7）**

| Orig# | 判 | 证据（本轮实读行） |
|---|---|---|
| 1 🔴 | Fixed | `AGENT-LOOP-SUBAGENT.md:19` = plan 行「纯只读规划 / 普通」（原「普通 + 工程」）· `:24` 工程侧 = explore / eng-designer / eng-coder，含「工程禁 plan 与 coder」+「裁定源 = §6.22 F5」· `:725` 修正轮变更记录在位；全档清扫（`普通 + 工程` 与 `工程模式…plan` 两式）无同类旧口径残留 |
| 2 🟡 | Fixed | 退役注行数四面统一为「一条退役注（占 2 行）」：`TESTING.md:325` · `:335`；本档 `:53` · `:73` |
| 3 🟡 | Fixed | §6.23.4 补「拆分计划（超档项）」块 `:678`–`:683`（候选拆分面 + 「本批只登记不执行」；形态承 §6.20.4 `:445`–`:449`） |
| 4 🟡 | Fixed | A-MS6 改集合式：`AGENT-LOOP-SUBAGENT.md:713` · 本档 `:113`/`:137`（「失败集合 ⊆ 批前失败集合（批前 = {T-V13}）」+ 明记否决计数式） |
| 5 🔵 | Fixed | 落笔形态钉死多行嵌套（改前 3 行 → 改后 5 行 ⇒ Δ = +2）：本档 `:54` · `:77`–`:95`；`TESTING.md:336` |
| 6 🔵 | Fixed | 退役注自足化去节号：本档 `:73`–`:74` · `:142`；`TESTING.md:325`（「注文自足、不给节号」） |
| 7 🔵 | Fixed | §2.8 ④ 改「本批 8 档逐条列出 + 其余差异逐条归因」：本档 `:149` |

**剩余问题（新）**

| # | Orig# | File | Severity | Status | Notes |
|---|---|---|---|---|---|
| 1 | (new) | `docs/core/design/AGENT-LOOP-SUBAGENT.md:683` | 🟡 | New: 拆分计划块「未触碰」行把本批受触碰档 `spawn-gates.mjs` 列为未触碰 | 该行逐字 = 「- **未触碰**：`thincoder-core/agent-tools/subagent-async.mjs`（279）· `spawn-gates.mjs`（107 → 109）。」——`spawn-gates.mjs` 是本批**受影响档**（同档 `:672`：现 107 → Δ +2 → 109；批档 §2.2 行 2 同值）；§6.20.4 先例 `:449` 的「未触碰」= 本批**未触碰**档（单值行数、无 Δ）⇒ 该行与受影响档清单冲突。建议统一该行语义（对齐先例口径）。非阻断。 |

**计数**：🔴 0 · 🟡 1 · 🔵 0
VERDICT: pass

## §4 用户批准（主 agent）

**2026-09-18 02:28 用户裁定「M家族开」= 乙批批准**；设计评审：轮 1 = changes-required（🔴1 · 🟡3 · 🔵3）→ fix 轮（id=61）→ **轮 2 = PASS**（7/7 落位；新增 1 🟡 = 拆分块「未触碰」行误列受触碰档——父侧已就地收正 `AGENT-LOOP-SUBAGENT.md:683`）⇒ 实施轮派发（eng-coder · initial · 8 档）。

## §5 实施记录（eng-coder）

**状态行**：✅ 实施轮完成（initial · 8 档）；内部 explore 审计 1 轮 → 自修 1 处 → advisor 代码评审 1 轮（**VERDICT pass · 0🔴**）→ 评审后零改动。**终态 = `clean`**。

**交付摘要**：①a 描述句如实两向（`thincoder-core/agent-tools/subagent.mjs:134`，与设计 §6.23.3 改后句逐字一致）· ①b 工程模式装配 enum 收正为 F5 集（`thincoder-core/agent/family-tools.mjs:46`）· ② `ROUND_VALUES` 真单源（`spawn-gates.mjs:29` 唯一字面量 + `:52` 谓词 `!ROUND_VALUES.includes(...)` + `subagent.mjs:35` import + `:155` schema `enum: ROUND_VALUES`；两处拒收文案由常量拼出、输出逐字同形）· ③ VSC 四死项删除 + 两行退役注（`thincoder-vscode/test/files.mjs:49-50`）+ 自检① 两清单同检（`thincoder-vscode/test/run.mjs:28-32`）· ④ §1.6 裁定 1（前缀 `✖ test manifest check failed:` 覆盖两清单，层名进消息）· ⑤ §1.6 裁定 2（`files.mjs:43` 去裸节号）。

**决策透明表（偏离设计字面/超出估值的处置）**

| # | 项 | 处置 | 理由 |
|---|---|---|---|
| 1 | `thincoder-core/test/spawn-gates.test.mjs` 新增 U7 用例（设计 §6.23.4 估值「+8± → ~149」未计入） | **落**（净 +14 → 155 行） | 设计 §6.23.6 U7 + §2.7 A-MS5 要求该用例存在；批前无任何覆盖（批前核心日志仅载旧用例名，无门行为用例） |
| 2 | 同档头注同步（「纯谓词层」→「谓词层 + schema/门接线断言」+ U4/U7 行） | **落**（+1 行） | 本批已使该档 import `subagentTool` 并驱动 `execute`——注释须随代码（内部审计发现，已修） |
| 3 | `run.mjs:8` 头注「集成清单契约的机械面」→「两清单契约的机械面」 | **落**（行内） | §1.6 #1「消息随检查面走」的直接导出项：自检① 已扩两清单，原句名实不符 |
| 4 | `run.mjs:23` 前缀取「覆盖两清单 + 层名进消息」形态 | **落** | §1.6 #1 字面「覆盖两清单的表述 + 层名」；层名由 `:30` 的 `listed ${layer} file does not exist` 承载（与 `TESTING.md` §10.1 ③-2 逐字一致）；评审据此判「本批无 must-fix」 |
| 5 | `files.mjs:47`/`:48` 同族裸节号（`§2.22.5`/`§2.22.4`） | **未改**（如实报） | 设计 §2.3 ③-1 明文「其余 60 条条目与其尾注」= 零改面；advisor 判 🟡 可选、父侧裁定面 |
| 6 | 行数 vs 设计：`files.mjs` 82 行/61 条（设计 81/60） | **如实报**（外因） | 并行线已提交条目 `test/tool-display-sync.test.mjs`（`files.mjs:81`）；本批 Δ = −2 与设计一致 |

**先红→绿读数（实施前 ✖ → 实施后 ✔）**：核心 gates **15/16 → 16/16**（红 = `assert.equal(schema enum, ROUND_VALUES)` 引用同一性 strictEqual 失败）· 核心 family **4/5 → 5/5**（红 = actual `['explore','plan','eng-designer','eng-coder']` vs expected F5 集）· CLI T30 **9/10 → 10/10**（红 = Mode filtering 新句 regex 对旧句不匹配）。
**U8 注入反证**：批前 `node test/run.mjs`（单元清单注入不存在档）= 静默跳过、**exit 0**（599/599，假成员零痕迹）；批后同注入 = `✖ test manifest check failed: listed unit file does not exist: test/__inject-probe-missing.test.mjs`、**exit 1**（先于 `node --test`——fail-closed）；integration 侧注入另验（`listed integration file does not exist:` 逐字不变）；两探针均已还原（`integration/files.mjs` git status 零差异；单元档无注入残留）。

**三包全量（A-MS6 · 集合式）**：core **317/317** · cli **657/657** · vsc **599/599**——各 `ℹ fail 0`、exit 0 ⇒ **失败集合 ∅ ⊆ 批前集合 ∅**。批前基线（本席实跑）：core 316/316 · cli 657/657 · vsc 599/599——批档 §2.5 所记 `{T-V13}` 红已随并行线转绿（读数漂移，按 §6.23.7「以 coder 轮复跑为准」采信本轮）。

**审计与代码评审轮次**：内部 explore 审计 1 轮（read-only）——有效发现 1 条（`spawn-gates.test.mjs` 头注失同步 → 已修）、**不成立 1 条**（所报 `AGENT-LOOP-SUBAGENT.md:683` 仍列 `spawn-gates.mjs` 于「未触碰」行——本席实读该行 = 只有 `subagent-async.mjs`、全档 `107 → 109` 零命中、该档 mtime 03:01 已含父侧收正；审计所引文本出自批档 §3 的**引文**）、其余为报告项。advisor 代码评审 1 轮（`type=code`；面 = 8 档全文 + `AGENT-LOOP-SUBAGENT.md` §6.23 + `TESTING.md` §10.1 + 批档 §2）：**VERDICT pass** · 0🔴 / 2🟡（均「可选 · 不阻断」）/ 4🔵；评审后零改动 ⇒ 无需轮 2。

**零写/零改面**：`docs/**` 零写（实施轮）· `scripts/**` · `thincoder-core/prompts/**` · `agent-tools/eng.mjs` · VSC `src/**` 零触碰 · 无注入残留。**out-of-scope 观察（不动作）**：①b 同类残留仍在 VSC 装配面——`thincoder-vscode/src/agent/setup-tooltable.mjs:216`（`modeRoleField` 工程分支 enum 含 `plan`，该面由 `setup.mjs:277` 调用、VSC 测档 `test/eng-designer-role.test.mjs:89-94` 仅 `includes` 判据故不红）；`thincoder-cli/test/eng-designer-role.test.mjs:124` 注释指已删档；`spawn-gates.mjs`/`spawn-gates.test.mjs` 头注仍指已归档旁路档。

## §6 验证与收口（父代理）

**收口（2026-09-18）**：

- **验收**：8 档落位（逐条对 A-MS1–A-MS8）；父侧抽核 = `spawn-gates` + `family-tools` **21/21** · `eng-designer-role` **10/10** · 三包全绿（core 317 · cli 657 · vsc 599）；**A-MS8 实测 = 静默漏跑面当场闭合**（批前注入缺失档 ⇒ exit 0 零痕迹；批后 ⇒ exit 1 + 具名报错）。
- **提交**：`983bb3e1`（8 档 · +39 / −22）。
- **残留（已各归其位）**：① VSC 工具表装配面同族第三面（`setup-tooltable.mjs:216`）+ `files.mjs:47`/`:48` 裸节号 ⇒ **台账 #52**（与 VSC 面下一批同轮）；② 预存指针债三处 ⇒ 归 #42 死指针族；③ 设计档三处实施后漂移（§6.23.4 测试档估 ~149 → **实测 155**（U7 未计价）· `TESTING.md` §10.1 的 60/81 → **61/82**（外因 = 并行线已提交档计入）· §1.6 与 §2.3「`:43-51` 零改」字面交叠 ⇒ **取 §1.6（晚出且明确）为准**）——**本轮已就地收正**。
- **三账**：台账 #24 之「乙」环完成；批档冻结（后续改动另开批）；收口日期 2026-09-18。
