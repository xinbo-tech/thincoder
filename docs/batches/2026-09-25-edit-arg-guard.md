# 2026-09-25 · edit-arg-guard
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-25 · 来源 = 用户 2026-09-25 06:26 转报 VSC 端报错「args.edits.map is not a function」（Provider https://api.xiaomimimo.com/v1 · Model mimo-v2.6-flash）——edit 工具非数组 `edits` 入参 ⇒ 裸 TypeError 外泄。
> 台账 = #325（TOOLS.md · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-25
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 批件与授权（父侧 · 2026-09-25 06:2x · 台账 #325）

**来源**：用户 06:26 转报 VSC 端错误卡——「`args.edits.map is not a function`」· Provider = `https://api.xiaomimimo.com/v1` · Model = `mimo-v2.6-flash`。

**病灶（父侧实读 · as-of 06:27）**：`thincoder-core/tools/file.mjs:260-262`（edit 工具 `touchedPaths` 钩子）：

- `if (args.edits) { const out = args.edits.map((e) => e.path).filter(Boolean) … }`——**真值判断后裸点链**：`edits` 为非数组真值（字符串 / 对象 / 数字）⇒ `.map` 裸 TypeError **外泄**（模型读不懂、用户看懵）。
- **时序要点**：`touchedPaths` 在 `execute` 之前被消费 ⇒ `tools/edit-batch.mjs:29` 既有的成形守卫（`Array.isArray(args.edits)` ⇒ 「edits must be a non-empty array of …」）**根本没机会执行**——正确形态已在仓内，缺的只是时序上更早的同款守卫。
- **同点姊妹态**：`edits: [null]` ⇒ `.map((e) => e.path)` 在 `null.path` 处同型裸抛（`Cannot read properties of null`）。
- **同类扫描**（工具族「真值判断后点链」缺陷类）：`thincoder-core/tools/**` 全扫 = **仅此一处**（`:261-262`）；其余无可疑命中。

**影响**：弱模型常见入参形态（JSON 字符串化 / 对象包裹）⇒ 工具调用以裸 JS 错误终结（模型拿不到自纠线索）；VSC 端错误卡原样外泄内部实现（错误面质量缺口）。

**修复面（设计轮定形 · 候选）**：① `touchedPaths` 入参守卫（非数组 ⇒ 不点链——调用落到 `execute` 的既有成形错误；或就地抛同体例成形文案——设计轮择一并自证）；② 条目级防御（`[null]` / 非对象条目同族）；③ 用例（非数组三态 + null 条目 ⇒ 成形错误、零裸抛）；④ 同类扫描结论入档。

**边界（不做）**：其余工具语义零改 · edit schema / 描述面（除设计轮自证必要）· 批量应用语义（`applyEditBatch` 既有行为）零改 · 他批面零触。

**授权**：会话标准流（用户 06:26 报障为定向 + 05:05 全链授权沿用 + 06:24「钱不是门」口径）——设计 / 评审 / 代签 / 实施全链父侧接续。

### 1.9 评审（轮 1）裁定——6 条全收 + 投递异常备查（父侧 · 2026-09-25 07:2x）

**依据**：评审 **#110 = pass**（0🔴 / 4🟡 / 2🔵 = 6 条；§3 落档 `:194`–`:211` 在案）。

**投递异常备查**：本轮结论文摘未按常规投达（无 digest 消息、池内无痕）——父侧**现盘回收**：§3 表在档 ✓ · 设计 token 自会话槽（`engDesignTokens`）捞回 ✓（值不入档）。**已核**：评审确实完整跑完（对象/证据边界/发现表/计数/VERDICT 齐）。

**逐条裁定（全收 · 处置执行人 = 设计面）**：

1. **🟡 非数组回落的三处表述互不兼容**（`EDIT.md:65` ↔ §2.8 补记 4① `:188` ↔ fix 块 ① `:140`）→ 收正：两处相容化（限定 `EDIT.md:65` 适用范围 或 收紧 `:188` 表述）+ `:140` 同口径。
2. **🔵 `EDIT.md:65` 括注「（§8 D-7）」指空** → 改指承载位置 或 §8 补一行回落裁定条目。
3. **🟡 受影响表 >300 四档无拆分评估注记**（`edit-diff` / `bridge` / test 档 / `file.mjs`——唯 `file.mjs` 有既有态注记）→ 逐行补注（拆分点 / 借用面 / 「本批不动」既有债），与 `file.mjs` 注记同形。
4. **🟡 §2.5 用例 1/3「非数组三态」未限定真值**（假值走单形态面 ⇒ 假失败）→ 写明真值样本（如 `"[]"` / `{…}` / `42`）或补假值断言（视同缺席 ⇒ 单形态面）。
5. **🟡 AC4 未含 VSC 端**（报障面 = VSC；核钩子正是其消费面）→ AC4 增 `thincoder-vscode` 全量绿 或 写明零影响依据。
6. **🔵 AC3 机检计数未写扫描范围** → 补范围（`thincoder-core/tools/*.mjs` + `thincoder-cli/src/acp/bridge.mjs`）再列计数。

**派发**：修正轮 #112（eng-designer）；修后 → 核验 → §4 代签 → 实施（token 已备）。

### 1.10 投递补达备查（父侧 · 2026-09-25 07:17）

评审 **#110** 的结论文摘于 07:17 **延迟补达**（约 25 分钟）——内容与父侧 07:0x–07:1x 的**现盘回收**逐项一致：6 条发现（0🔴 / 4🟡 / 2🔵）· `VERDICT: pass` · §3 落档（轮次 1 · 2250 字）· 设计 token 一致 ✓。**回收动作有效**（§1.9 已记）：结论未因投递异常丢失，修正轮 #112 无需重派。其 host 核报的「3 处引证不匹配」= 评审员表内对 `EDIT.md:59`/`:60` 的引号形态漂移（`**…**` 星号与引号差异——非实质不符；父侧实读在案 ✓）。

## §2 批次任务与设计（eng-designer）
**状态行**：✅ 设计完成 · 2026-09-25（initial + fix 轮 + 评审轮 1 落地（fix 轮 2）· §2.1-§2.8 + 修正块两段 · 六条（#110 · pass）全落 · 上抛 1 同批收 / 上抛 2・3 不扩面）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 条目（覆盖 · 台账 #325）

| # | 条目 | 落点 |
|---|---|---|
| E1 | `touchedPaths` 容器守卫——`edits` 非数组（字符串 / 对象 / 数字等真值非数组）⇒ 不点链、零抛、零触达（返回 `[]`） | `thincoder-core/tools/file.mjs`（`touchedPaths`；现 :257-266） |
| E2 | `touchedPaths` 条目守卫——`[null]` / 非对象条目 ⇒ 零抛、按「缺 path」尽力提取（顶层 path 兜底口径不变） | 同上（`.map` / `.some` 两回调） |
| E3 | `applyEditBatch` 条目级守卫——非对象条目（`null` / 字符串 / 数字 / 数组）⇒ 条目级成形错误（含下标）、零裸抛 | `thincoder-core/tools/edit-batch.mjs`（条目循环前预扫） |
| E4 | 用例——非数组三态 + `[null]` / 非对象条目 ⇒ 成形错误、零裸抛（快层 5 例、零 fs） | `thincoder-cli/test/edit-tool-improvement.test.mjs` |
| E5 | 文档收正——EDIT.md 守卫语义 + 同类扫描结论 + 变更记录 | `docs/core/design/EDIT.md` |

### 2.2 设计裁定（dispatch 七条 → 逐条落点）

| 条 | 裁定 | 落点 / 自证 |
|---|---|---|
| 1 守卫择一 | **择 ①：`touchedPaths` 不点链、零抛 ⇒ 调用落到 `execute` 既有成形错误**（否决 ② 钩子内抛同文案） | 自证见 2.3；落点 `file.mjs` `touchedPaths` |
| 2 条目级防御 | 两侧分别定形：`touchedPaths` = 尽力提取（不抛）；`applyEditBatch` = 预扫即时 throw（含下标、不触盘） | `file.mjs` + `edit-batch.mjs` |
| 3 文案单源 | 容器文案 = 仓内既有单源（未动、未复制）；条目文案 = 新增单源（预扫唯一抛点）；桥面同文重复（`thincoder-cli/src/acp/bridge.mjs:148`）为既有第二源——本批不触，见 2.8 上抛 | `edit-batch.mjs:29`（容器）/ 预扫（条目） |
| 4 测试面 | 落 `thincoder-cli/test/edit-tool-improvement.test.mjs`（EDIT.md §7 权威落点）；**实读纠偏：`thincoder-core/test/` 无 `edit*.test.mjs` 族**——edit 测试族住 CLI 侧（并有 VSC 同名镜像档）；增 5 例（预算见 2.5） | 测试档 + EDIT.md §7（33 → 38） |
| 5 EDIT.md 收正 | §5 增「入参容器守卫 / 条目守卫」；§6 增「入参守卫（#325）」行；§7 测试面 33 → 38；§8 增 D-6；变更记录一行 | `docs/core/design/EDIT.md`（本设计轮已落，127 行） |
| 6 同类扫描 | `thincoder-core/tools/**`「真值判断后点链」全扫**仅 `file.mjs` 一处**（本批已卫）；其余触摸面（`read` / `insert_after` / `hashline_edit` 单参；`apply_patch` try/catch）无一命中——结论入档 | `docs/core/design/EDIT.md` §6 尾注 |
| 7 边界 | 见 2.7——其余工具语义 · edit schema / 描述面 · `applyEditBatch` 既有语义 · 他批面 零触 | — |

### 2.3 机制设计（实施定形）

**择 ① 的自证（三条判据）**

- **错误可见性阶段**：`touchedPaths` 在 `execute` 前被多处消费（实读 10 处调用式：核 6 · VSC 4），未守卫者过半（try/catch 兜底仅 4 处）——钩子内抛错（即便成形文案）会从**首个未守卫点**逸出；实测逸出 = VSC L3 前置查询 `thincoder-vscode/src/agent/execute-tools.mjs:188`（未守卫 `l3TouchedPaths` → `Promise.all` 批级拒绝、裸 TypeError 直达用户 = 用户 06:26 实报）。零抛 ⇒ 10 处消费行为一致，拒绝必然落 `execute`（工具错误正规通道、模型可自纠）。
- **与既有文案的单源关系**：唯一抛点 = `thincoder-core/tools/edit-batch.mjs:30`（既有容器守卫、文案零改）；空数组既已走此路 ⇒ 真值非数组与空数组**同一错误面**——不新增第二抛点、不跨档导常量。
- **是否两处同一错误面**：是（「`edits` 容器形态非法」）；条目级 = 同面伴生（同文件、同门、同批）。

**`file.mjs` `touchedPaths`（现 :257-266）改为**

```js
if (Array.isArray(args.edits)) {
  const out = args.edits.map((e) => e?.path).filter(Boolean)
  if (args.path && args.edits.some((e) => !e?.path)) out.push(args.path)
  return out
}
if (args.edits) return [] // 真值非数组：调用必被 execute 拒绝（成形错误）——零触达
return args.path ? [args.path] : []
```

（注释随改：本钩子零抛——形态拒绝归 `execute`（edit-batch 单源）。`e?.path` 覆盖 `[null]` / 非对象条目；真值非数组返回 `[]` 而非 `[args.path]`——不虚报，且免工程门以设计闸文案误拒该必败调用。）

**`edit-batch.mjs` `applyEditBatch`**：容器守卫（:29）与 `assertEditArgsExclusive`（:32）之后、条目循环（:39）之前插预扫：

```js
for (let i = 0; i < args.edits.length; i++) {
  const e = args.edits[i]
  if (e === null || typeof e !== "object" || Array.isArray(e)) {
    throw new Error(`edits[${i}] must be an object of {path, old_string | line/startLine+endLine, new_string}`)
  }
}
```

既有条目循环零改（预扫后 `const p = e.path || args.path` 不再可命中 null 条目）。语义顺序：容器守卫 → 互斥 → 条目预扫 → 条目循环。

### 2.4 受影响文件与行数预算

| 文件 | 现况（as-of 2026-09-25） | 预期 | 说明 |
|---|---|---|---|
| `thincoder-core/tools/file.mjs` | 465 行 | ~468（+3） | 钩子守卫 + 注释；< 500 硬限 ✅（超 300 建议线 = 既有态） |
| `thincoder-core/tools/edit-batch.mjs` | 204 行 | ~209（+5） | 条目预扫守卫；< 300 线 ✅ |
| `thincoder-cli/test/edit-tool-improvement.test.mjs` | 352 行 | ~390（+38） | 5 例守卫（快层、零 fs）；< 500 硬限 ✅ |
| `docs/core/design/EDIT.md` | 119 行 | 127 行（已落） | 设计轮已改（§5 / §6 行 + 尾注 / §7 / §8 D-6 / 变更记录） |

### 2.5 测试面（例数预算 5 例 · 快层零 fs）

`thincoder-cli/test/edit-tool-improvement.test.mjs`：33（29 快 + 4 slow）→ 38（34 快 + 4 slow）。

| # | 用例 | 断言 |
|---|---|---|
| 1 | `touchedPaths` 零抛：非数组三态（字符串 / 对象 / 数字） | 不抛；`deepEqual []`（带 / 不带顶层 path 两形） |
| 2 | `touchedPaths` 零抛：`null` / 非对象条目按「缺 path」计 | `[null]`→`[]`；`[null]+path`→`[path]`；`[null,{path}]`→`[{path}]`；`["foo",42]`→`[]` |
| 3 | 成形错误：非数组三态 + 空数组 ⇒ 既有容器文案（单源） | `assert.rejects(/edits must be a non-empty array of/)` |
| 4 | 成形错误：`null` 条目 ⇒ 条目级文案（含下标） | `/edits\[0\] must be an object/`、`/edits\[1\] must be an object/` |
| 5 | 成形错误：非对象条目（字符串 / 数字 / 数组）⇒ 同文案 | `/edits\[0\] must be an object/` |

（裸抛不可能通过——裸 TypeError 文案不匹配上述正则。）VSC 同名镜像档零改——守卫在核，端侧随核生效（EDIT.md §7 已记）。

### 2.6 验收标准（AC · 指向 2.1 条目）

- **AC1**（E1+E2）：`editTool.touchedPaths` 对 `edits` 非数组三态与 `[null]` / 非对象条目**零抛**、口径正确——用例 1 / 2 全绿。
- **AC2**（E3）：`editTool.execute` 对 `[null]` / 非对象条目 reject，文案含 `edits[i] must be an object of …`（下标精确）——用例 4 / 5 绿。
- **AC3**（E3）：容器文案**未新增副本**（`grep "non-empty array of" thincoder-core/tools/` = 1 处，仍在 `edit-batch.mjs:30`）。
- **AC4**（回归）：既有 33 例 + `thincoder-cli` / `thincoder-core` 全量测试绿。
- **AC5**（E5）：EDIT.md 收正在档 + `node scripts/doc-check.mjs` 触碰档零新增——设计轮已实测：候选 23071→23085（全解析）、悬空 6 / 注记豁免 43 / 拟新增 12 / 迁移期引文 221 / 行宽 11 恒定。

### 2.7 边界（不做）

其余工具语义零改 · edit schema / 描述面零改 · `applyEditBatch` 既有语义（原子 / 串行累积 / 校验序 / 全部既有文案）零改 · VSC 端档零改（随核）· 他批面零触。

### 2.8 上抛项（本批不触 · 父侧定夺）

1. **桥通道同族缺口（edit 通道族扩面发现）**：`thincoder-cli/src/acp/bridge.mjs:145-157`（ACP `editBatch`）——① `:155`（`const p = e.path ?? pathOf(args)`）对 `[null]` / 非对象条目裸 TypeError（与核 `edit-batch.mjs:42` 同型）；② `:148` 容器文案与核 `edit-batch.mjs:30` 同文重复（D2 双源——注释自认「同本地 edit-batch 措辞」）。建议：桥面条目守卫对齐 + 文案单源**同批**处置；本批文件面未含桥档（边界「他批面零触」）——是否另立台账 / 并入后续批请裁定。
2. **钩子守卫不对称（结构观察 · 非阻断）**：本批保「钩子零抛」这一源头（修因）；消费点未守卫者（VSC `execute-tools.mjs:188` / `:349` · `tool-gates.mjs:94` · `rules-face.mjs:101`；核 `dispatch.mjs:201` · `record-results.mjs:149`）对其他工具的同型抛错仍会逸出——上游结构面，本批不扩。
3. **`args = null` 边界（读码推演 · 触发未实证）**：`thincoder-core/agent/dispatch.mjs:154`（`JSON.parse(toolCall.arguments || "{}")`）对 `arguments:"null"` 产出 null args ⇒ `:201`（工程设计闸）`tool.touchedPaths(null)` 裸抛——非本批（同类扫描范围 = tools/** 真值判断后点链，已仅一处）；登记备查。

**§2.4 行数口径补记（as-of 2026-09-25 脚本实计 · `split("\n").length`）**：`file.mjs` = 465 ✅ / test 档 = 352 ✅；订正两处——`edit-batch.mjs` = **205 行**（原记 204；预期 ~210 不变）、`EDIT.md` = **120 → 127 行**（原记 119；git numstat = +8 / −1）。

**§2 修正块（fix 轮 · 2026-09-25 · 上抛 1 同批收）**

**E6（fix 轮增补 · 同批收）**：ACP 桥（`editBatch`）入参守卫对齐 + 跨档文案单源——`edits` 容器 / `[null]` / 非对象条目 ⇒ 与核同单源、同句成形错误；零裸抛、零跨档副本。落点 = `thincoder-cli/src/acp/bridge.mjs`（`editBatch`）+ `thincoder-core/tools/edit-diff.mjs`（守卫与文案单源——fix 轮新增单源面）。

**条 → 落点（父侧 fix 轮 dispatch 四条 · 逐条）**

| 条 | 裁定 / 落点 | 自证 |
|---|---|---|
| ① 桥面三态对齐（核口径 = 择①） | 桥 `editBatch` 与核同调用两守卫（`assertEditsContainer` / `assertEditEntries`——单源 `edit-diff.mjs`）；`[null]` / 非对象条目 ⇒ 含下标成形错误；`edits` 非数组不入桥批量分支（`toolRouter:313` 判据 `Array.isArray`）⇒ 落本地 `execute`（核 `file.mjs:270` `if (args.edits)` 真值判）、与核同错误面 | 实读桥消费链：`toolRouter("edit")` → `editBatch` 于 try/catch（`:314-319`）→ catch 渲染 `Error: <msg>` 工具结果 = **桥同有 execute 成形错误面**（既有容器守卫已走此面）——无需新面；原 `:155` 裸 TypeError（`[null]`）改走同面 |
| ② 文案单源（跨档） | 择一自证：**单源住 `edit-diff.mjs`**——① 核・桥已共同导入该档（`assertEditArgsExclusive` / `validateEditEntry` / `EMPTY_NEW_STRING_LINE` 先例——同类守卫同址）；② 桥不依赖本地应用实现模块（否决「core 导出自 `edit-batch.mjs`」）；③ 守卫为函数——条件与文案同时单源（否决仅导常量——条件仍可分叉）；④ 否决桥自持副本（D2 双源）。处置既有桥副本 4 处：容器（`:148`）/ 缺 path（`:156`）/ 条目校验前缀（`:157`）/ abort 前缀（`:109`）——删字面改引用 | **实读新发现**：上抛所列容器副本外，同族跨档副本另 3 处（`:156` / `:157` / `:109`；核侧对位 = `edit-batch.mjs:43` / `:45` / `:64`）——同属「文案单源（跨档）」委托面，随同批收（字面零改）；配套 = `edit-diff.mjs` 两处 JSDoc 引文改指常量 / 格式器名（`label` / `abortPrefix` 选项注——免字面复述）；否决备选见 EDIT.md §8 D-7 |
| ③ 表 / 测试 / AC | §2.4 增 2 行改计数（下表）；§2.5 桥 4 例（33 → 42）；§2.6 AC3 改写 / AC4 扩 / AC6 增 / AC5 复跑读数 | 见下方各补记 |
| ④ 上抛 2 / 3 裁定 | **不扩面**（本批不触）；台账 = 父侧已入册（tech_todo #327） | §2.8 补记 |

**与前节口径的关系（明示）**：§2.2 行 3「容器文案单源 = `edit-batch.mjs`（未动、未复制）」与 §2.3「不跨档导常量」为 initial 轮单档视角落点——桥面同批收后单源须在核・桥共同导入面（`edit-diff.mjs`）方可达 ⇒ 落点口径升级；**文案字面 / 判定条件 / `touchedPaths` 零抛裁定均零改**。

**实施形（fix 轮定形）**

- `edit-diff.mjs`：常量区（`EDIT_ARGS_MUTEX` 邻位）增 `EDITS_CONTAINER_ERROR` / `editsEntryError(i)` / `EDIT_ENTRY_NO_PATH` / `EDIT_ABORT_PREFIX` / `editEntryLabel(path)`；守卫区（`assertEditArgsExclusive` 邻位）增 `assertEditsContainer(edits)`（`!Array.isArray || length === 0` ⇒ throw 容器文案）/ `assertEditEntries(edits)`（逐条目 `null / typeof !== "object" / Array.isArray` ⇒ throw 条目文案含下标）。
- `edit-batch.mjs`：`applyEditBatch` 内——`:29-31` 字面守卫 → `assertEditsContainer(args.edits)`；`:32` 互斥后插 `assertEditEntries(args.edits)`；`:43` 缺 path 文案 → `EDIT_ENTRY_NO_PATH`；`:45` 标签 → `editEntryLabel(p)`；`:64` abort 前缀 → `EDIT_ABORT_PREFIX`（import 行随改）。
- `bridge.mjs`：import 行增 `assertEditsContainer` / `assertEditEntries` / `editEntryLabel` / `EDIT_ENTRY_NO_PATH` / `EDIT_ABORT_PREFIX`；`editBatch`——`:147-149` → `assertEditsContainer(edits)`，`:150`（互斥）后插 `assertEditEntries(edits)`；`:156` → `EDIT_ENTRY_NO_PATH`；`:157` → `editEntryLabel(p)`；`:109` 本地常量删、`:172` 用导入的 `EDIT_ABORT_PREFIX`；`:140-144` JSDoc 改写（守卫单源注——去「同本地 edit-batch 措辞」）。
- `edit-tool-improvement.test.mjs`：核 5 例（initial 预算）+ 桥 4 例（§2.5 表）；桥例 harness = `buildAcpCallbacks` 直驱 + 捕获式 `request`（零 fs）。

**§2.4 补记（fix 轮 · as-of 2026-09-25 脚本实计 · `split("\n").length`）**

| 文件 | 现况 | 预期 | 说明 |
|---|---|---|---|
| `thincoder-core/tools/edit-diff.mjs` | 389 行 | ~409（+20） | 两守卫 + 五文案；< 500 ✅ |
| `thincoder-cli/src/acp/bridge.mjs` | 397 行 | ~396（净 −1） | 容器守卫 3 行 → 1 行调用；条目守卫 +1；本地 abort 常量删；JSDoc 改写 |
| `thincoder-core/tools/edit-batch.mjs` | 205 行 | ~204（−1） | 容器 3 行 → 1 行调用；条目预扫 = 1 行调用（原 +5 预算随单源收敛） |
| `thincoder-cli/test/edit-tool-improvement.test.mjs` | 352 行 | ~440（+88） | 核 5（~40）+ 桥 4（~48——含 harness）；< 500 硬限 ✅ |
| `docs/core/design/EDIT.md` | 127 行 | 136 行（+9 · 已落） | §5 / §6 / §7 / §8 / 变更记录 |

（前表 `file.mjs` 465 → ~468（+3）不变。）

**§2.5 补记（fix 轮 · 桥 4 例）**

`thincoder-cli/test/edit-tool-improvement.test.mjs`：33（29 快 + 4 slow）→ **42（38 快 + 4 slow）**——核 5（initial 预算）+ 桥 4（fix 轮）。

| # | 用例（桥 · #325 · 直驱 `buildAcpCallbacks`） | 断言 |
|---|---|---|
| 6 | 容器：`edits: []` ⇒ 成形错误（单源同句）、零反向 RPC | `handled:true` + `/^Error: edits must be a non-empty array of/`；request 调用 0 |
| 7 | 条目：`[null]` ⇒ 含下标成形错误、零反向 RPC | `/^Error: edits\[0\] must be an object of/`；0 调用 |
| 8 | 条目：非对象（字符串 / 数字 / 数组）⇒ 同文案含下标（坏条目下标 1） | `/^Error: edits\[1\] must be an object of/`；0 调用 |
| 9 | 正向对照：合法批量经桥仍通（守卫零误拦） | `OK: edited a.txt via IDE`；请求 = [read, write] 各 1 |

（桥例零 fs——request 捕获式 mock；落点 = `edit-tool-improvement.test.mjs`——#325 声明测试面（EDIT.md §7 权威面）；`acp-contract.test.mjs` 462 行近 500 硬限，不入。）

**§2.6 补记（fix 轮 · AC 更新）**

- **AC3（改写 · 文案单源跨档）**：五文案——容器 / 条目 / 缺 path / abort 前缀 / 条目标签；`thincoder-cli/src/acp/bridge.mjs` 零字面（引用调用），核侧定义唯一副本在 `edit-diff.mjs`。机检（`node` 行扫描）：容器 1 · 条目 1 · 缺 path 1 · abort 1 · 标签 1——均 `edit-diff.mjs`；`edit-batch.mjs` / 桥副本清零。
- **AC4（扩）**：既有 33 例 + 核 5 + 桥 4 = 42 例全绿；`thincoder-cli` / `thincoder-core` 全量测试绿。
- **AC6（新增 · 桥面）**：`toolRouter("edit", …)` 对 `edits: []` / `[null]` / 非对象条目 ⇒ `{handled:true, result:"Error: …"}`（与核同句单源）、零 fs 反向 RPC、零裸 TypeError；合法批量仍通——桥 4 例绿。
- **AC5（复跑读数 · 补）**：fix 轮前基线（06:4x）= 候选 23085 · 悬空 6 · 注记豁免 43 · 拟新增 12 · 迁移期引文 221 · 行宽 10（设计轮记行宽 11——异动非本批面，登记读数差）；EDIT.md 落定后复跑 = 候选 23108（+23 全解析：路径 +4 · 宽符号 +19）· 悬空 6 恒定 · 行宽 10 恒定——**触碰档零新增悬空 / 零行宽超限**；新增宽符号报告行 8 条（EDIT.md:61/:77——未建符号，不入闸，实施后转定）。本档 = `docs/batches`——机检 exclude 声明面，不入扫描域。

**§2.8 补记（fix 轮）**

4. **形态选择分歧（同参两通道行为分歧 · 实读新发现 · 触发未实证 · 本批不触）**：① `edits` 为真值非数组且携带合法单形态参数时——桥 `toolRouter:313` 以 `Array.isArray` 判 ⇒ 走单形态通道；核 `file.mjs` `execute` 以 `if (args.edits)` 真值判 ⇒ 走批量容器错误（同一入参、两通道不同归宿）；② 条目 path 兜底判据微差——核 `e.path || args.path`（空串回落顶层）vs 桥 `e.path ?? pathOf(args)`（空串即报缺 path）。登记备查。

**父侧裁定（2026-09-25 · fix 轮）**：上抛 2 / 3 = **不扩面**——本批不触；台账 = 父侧已入册（tech_todo #327「工具钩子守卫不对称族 + `args=null` 边界」）；上抛 1 = **同批收**（E6，见上）。

**§2 修正块（评审轮 1 落地 · fix 轮 2 · 2026-09-25）**

**依据**：评审 #110（pass · 0🔴 / 4🟡 / 2🔵 = 6 条——§3「轮次 1」表逐字在档）· 父侧裁定 = §1.9（六条全收；`Suggestion` 列 = 处置建议，处置执行 = 设计面）。**先行实读复核（本轮 · 逐条对位）**：`file.mjs` `touchedPaths`:257-266 / `execute`:270 · `edit-batch.mjs` 容器守卫:29-31 / 条目循环:39-45 / abort 前缀:64 · `edit-diff.mjs` `assertEditArgsExclusive`:129 / `validateEditEntry`:143 · 桥 `EDIT_ABORT_PREFIX`:109 / `editBatch`:145-157 / `toolRouter`:313-320。行数实计（`split("\n").length`）= `edit-diff` 389 · `edit-batch` 205 · `file.mjs` 465 · 桥 397 · test 档 352 · `EDIT.md` 136（前轮读数相符）。

**号 → 落点（逐条）**

| 号 | 落点（as-of 本块落盘） | 处置 |
|---|---|---|
| 1 🟡 | `docs/core/design/EDIT.md:65`（§5 非数组容器回落条）+ 本块 §2.3 / §2.8 收正 | 限定适用范围：「`edits` 非数组不入桥批量分支——不可成单形态（或能力位缺失）⇒ 回落本地通道、与核同错误面（`execute` 真值判 ⇒ 容器错误）；携合法单形态参数 ⇒ 桥径单形态应用、核径容器错误（登记项，见 §8 D-8）」；旧修正块 ① 行（现 `:157`）「⇒ 落本地 `execute`…、与核同错误面」口径由本条取代 |
| 2 🔵 | `EDIT.md:65` 括注 · `EDIT.md:107`（§8 新行 D-8） | 指空括注「（§8 D-7）」改指 §8 D-8；§8 增 D-8 = 回落裁定 + 分歧登记（登记承载 = 批档 §2.8 项 4①〔现 `:205`〕· 台账 #327 项 ③） |
| 3 🟡 | 本块「§2.4 收正」四行表 | `edit-diff` / 桥 / test 档 / `file.mjs` 逐行一句拆分评估（拆分点 / 借用面 / 本批不动）——与 `file.mjs` 既有注记同形 |
| 4 🟡 | 本块「§2.5 收正」+ `EDIT.md:59` / `:63` / `:93` | 用例 1 / 3 真值限定（`"[]"` / `{…}` / `42`）；假值归宿写明（视同缺席 ⇒ 单形态面）；`EDIT.md` 同族三处补「真值」限定（同源面——见「附带收正」） |
| 5 🟡 | 本块「§2.6 收正」AC4 | AC4 增 `thincoder-vscode` 全量测试绿（报障面 = VSC；被改核钩子 = 其消费面） |
| 6 🔵 | 本块「§2.6 收正」AC3 | AC3 补扫描范围（`thincoder-core/tools/*.mjs` + `thincoder-cli/src/acp/bridge.mjs`）再列五计数 |

**§2.5 收正（fix 轮 2 · 用例 1 / 3 改写；2 / 4 / 5 不变）**

| # | 用例 | 断言 |
|---|---|---|
| 1 | `touchedPaths` 零抛：**真值**非数组三态（`"[]"` / `{…}` / `42`） | 不抛；`deepEqual []`（带 / 不带顶层 path 两形） |
| 3 | 成形错误：**真值**非数组三态（`"[]"` / `{…}` / `42`）+ 空数组 ⇒ 既有容器文案（单源） | `assert.rejects(/edits must be a non-empty array of/)` |

假值样本（`""` / `0` / `false` / `null`）归宿（写明 · 不入例）：视同缺席——`touchedPaths` 落顶层 `path` 分支（`[args.path]` / `[]`）；`execute` 落单形态面（不触容器守卫）。不入例之由 = 假值不触本批守卫（语义以 `EDIT.md` §5 条文承载）；如后续要覆盖，另立断言。

**§2.6 收正（fix 轮 2）**

- **AC3（收正 · 补扫描范围）**：五文案（容器 / 条目 / 缺 path / abort 前缀 / 条目标签）单源 = `edit-diff.mjs`；扫描范围 = `thincoder-core/tools/*.mjs` + `thincoder-cli/src/acp/bridge.mjs`；机检（`node` 行扫描）读数：容器 1 · 条目 1 · 缺 path 1 · abort 1 · 标签 1——均 `edit-diff.mjs`，`edit-batch.mjs` / 桥副本清零。
- **AC4（收正 · 增端侧）**：既有 33 例 + 核 5 + 桥 4 = 42 例全绿；`thincoder-cli` / `thincoder-core` / **`thincoder-vscode`** 全量测试绿——报障面 = VSC 端、被改核钩子（`touchedPaths`）正是其消费面 ⇒ 端侧回归入 AC（`EDIT.md` §7 记「端档零改、随核生效」——本 AC 即验证该声明）。
- AC5 / AC6 不变。

**§2.3 收正（fix 轮 2）**：两处 initial 轮单档视角口径随 E6 升级——①「唯一抛点 = `edit-batch.mjs:30`」→ 抛点单源 = `edit-diff.mjs`（`assertEditsContainer` / `assertEditEntries`），`edit-batch.mjs` / 桥为引用调用；② §2.3 代码注「（edit-batch 单源）」同义升级（与「与前节口径的关系」同向）。**判定条件 / 文案字面 / `touchedPaths` 零抛裁定零改。**

**§2.8 收正（fix 轮 2）**：项 4① 表述不变（本轮实读复核 ✓：桥 `toolRouter:313` 判据 `Array.isArray` · 核 `file.mjs:270` `if (args.edits)` 真值判 · 桥单形态分支条件 = `path` + `new_string` 串 +（`old_string` 串或行号））；相容化以 `EDIT.md` 侧限定完成；登记承载回指 = `EDIT.md` §8 D-8 · 台账 #327 项 ③；项 4②（path 兜底判据微差）不变。

**§2.4 收正（fix 轮 2 · 四行拆分评估 · 行数 as-of 本块）**

| 文件 | 现况 | 预期 | 拆分评估（本批不动） |
|---|---|---|---|
| `thincoder-core/tools/edit-diff.mjs` | 389 | ~409（+20） | 拆分候选三面 = 守卫/校验族（`assertEditArgsExclusive`:129 · `validateEditEntry`:143 · 本批两守卫 + 五文案）· diff 内核（`applyPatchLines`:76 · `lcsMerge`:92）· 执行体/回执（`runSingleEdit`:337 · `composeEditReceipt`:381）；借用面 = `edit-batch.mjs` / `file.mjs` / `bridge.mjs` / 测试档（导入族）；本批只 +20 守卫行，不触拆分（< 500 ✅） |
| `thincoder-cli/src/acp/bridge.mjs` | 397 | ~396（净 −1） | 拆分候选两面 = 桥 edit 路由族（`editSingle`:133 · `editBatch`:145 · `toolRouter`:295）与历史回放（`replayHistory`:337）；借用面 = `buildAcpCallbacks` / `replayHistory` 消费点；本批净 −1（文案改引用），不触拆分（< 500 ✅） |
| `thincoder-cli/test/edit-tool-improvement.test.mjs` | 352 | ~440 | 拆分候选 = 核例族 / 桥例族（桥 4 例自带 `buildAcpCallbacks` harness——天然切点 = `edit-bridge.test.mjs`）；借用面 = 无（测试档零被导入）；本批 +88 后仍 < 500 ✅（再增用例先拆） |
| `thincoder-core/tools/file.mjs` | 465 | ~468（+3） | 拆分候选 = 按工具族拆档（`read`:64 · `write`:192 · `edit`:224 · `insert_after`:280 · `hashline_edit`:380——`git-ext.mjs` 拆出先例）；借用面 = `tools/index.mjs` 注册面 + `edit-diff.mjs` 的 `appendWriteContext` 导入；超 300 建议线 = 既有态；本批 +3 于 edit 壳区，不触拆分（< 500 ✅） |

**附带收正（发现 4 同源面）**：`EDIT.md` §5 容器守卫条 / 零裸抛条与 §7 守卫 9 例原写「非数组」未限定真值——同 finding-4 前提（守卫只在真值触发）⇒ 三处补「真值」限定 + 假值归宿（视同缺席）。机制语义零改（与 E1「真值非数组」既有口径对齐）。

**结算读数（fix 轮 2 · `node scripts/doc-check.mjs` 复跑）**：基线（编辑前 · 07:2x）= 候选 23175 · 悬空 6 · 注记豁免 43 · 拟新增 12 · 迁移期引文 221 · 行宽 14；落定后 = 候选 23178（+3 · 全解析）· 悬空 6 恒定 · 注记豁免 43 · 拟新增 12 · 迁移期引文 221 · 行宽 14 恒定——**触碰档（`EDIT.md`）零新悬空 / 零新行宽**（EDIT.md 报告行 = 既有 2 迁移期引文 [:6 / :82] + 既有宽符号报告行 [:61 ×6 / :77 ×2 / :85]）。读数差说明：行宽 14 ≠ 前轮记 10（他档漂移，出本批面——本批零新增）。本档 = `docs/batches`——机检 exclude 声明面，不入扫描域。

**§2.4 补记（fix 轮 2 · `EDIT.md` 计数）**：本轮落定后实计（`split("\n").length`）`docs/core/design/EDIT.md` = **138 行** = §2.4 补记所记 136 + 2（§8 D-8 行 + 变更记录一行；§5 三处 / §7 一处为等行替换，不计）——`EDIT.md` 行数口径以本行为准。

**本修正块坐标收正（现盘重锚 · as-of 2026-09-25 07:2x）**：旧修正块 ① 行 = `:161` · §2.8 项 4① = `:209`（本块前文所引 `:157` / `:205` 取自 §1.10 落档前的读数——以本行为准）；其余坐标（`EDIT.md` / 运行期面）现读核验无误。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**对象** = `docs/core/design/EDIT.md`（§5 守卫条文 / §6 入参守卫行 + 同类扫描 / §7 测试面 / §8 D-6·D-7 / 变更记录）+ 批档 §2（§2.1-§2.8 + fix 轮修正块）。

**范围与证据边界**：运行期面（`thincoder-core/tools/**`、`thincoder-cli/src/acp/bridge.mjs`）按声明不在本轮 ⇒ 文内对运行期行号/判据（`file.mjs:270` 真值判、`toolRouter:313`、`buildAcpCallbacks`）均为设计自述，未独立核验（unverified）；无 Document Map ⇒ Document ownership 判据降级为按 Project Guide 核对落点（落点 = 既有 `EDIT.md` 就地修订 + 批档承载，未见碎片化建档）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership / 记录一致性 | 🟡 | `EDIT.md:65`（非数组容器回落：「落本地通道、与核同错误面」）与批档 §2.8 补记 4①（`docs/batches/2026-09-25-edit-arg-guard.md:188`：「桥走单形态通道 · 核走批量容器错误 · 同一入参两通道不同归宿」，另加「携带合法单形态参数」限定）对同一入参的归宿描述互不兼容；fix 块 ① 行（同档 `:140`）又与 `EDIT.md:65` 同口径 ⇒ 本批新增的规范表述与本批登记的例外未对齐（该项本体已裁定不扩面，此处只计措辞）。 | 让两处相容：限定 `EDIT.md:65` 的适用范围（如「未入桥批量分支后即由本地通道处置；携合法单形态参数时的归宿见登记项」），或收紧 `:188` 的表述使之与「同错误面」自洽。 |
| 2 | 文档卫生（交叉引用） | 🔵 | `EDIT.md:65` 括注「（§8 D-7）」指空——`EDIT.md:106` 的 D-7 内容为「跨档单源 = `edit-diff.mjs`」，不含非数组回落的裁定。 | 括注改指承载该回落裁定的位置（本批 §2.8 登记处），或于 §8 补一行回落裁定条目后回指。 |
| 3 | 受影响文件行数注记（结构档） | 🟡 | >300 建议带内本批触碰 4 档：`edit-diff.mjs` 389→~409（批档 `:158`）· `bridge.mjs` 397→~396（`:159`）· test 档 352→~440（`:161`）· `file.mjs` 465→~468（`:93`）——设计只给行数 + delta，无一份主动拆分复核说明；唯一注记 = `file.mjs` 的「超 300 建议线 = 既有态」（`:93`）。 | 在受影响文件表逐行补一句拆分评估（拆分点 / 借用面，或「本批不动」的既有债注记），与 `file.mjs` 注记同形。 |
| 4 | Clarity（测试面） | 🟡 | §2.5 用例 1/3（批档 `:104` / `:106`）写「非数组三态（字符串 / 对象 / 数字）」未限定真值，而守卫只在真值非数组时触发（§2.3 `if (args.edits) return []`，`:65-71`；E1 亦写「真值非数组」，`:36`）——若取 `""` / `0` / `false` / `null` 作样本：`touchedPaths` 带顶层 path 返回 `[args.path]`、execute 落单形态分支 ⇒ `deepEqual []` 与 `/edits must be a non-empty array of/` 双双不成立（假失败）。 | 用例文本写明真值样本（如 `"[]"` / `{…}` / `42`）；若要覆盖假值非数组，另立断言写明归宿（视同缺席 ⇒ 单形态校验面）。 |
| 5 | 验收标准（覆盖） | 🟡 | AC4（批档 `:182`）只跑 `thincoder-cli` / `thincoder-core`；本批报障面是 VSC 端、被改的核钩子正是其消费面——`EDIT.md:94` 记 VSC 镜像档「同引核面」，批档 `:110` 断言「端侧随核生效、端档零改」 ⇒ 端侧回归未入 AC。 | AC4 增一条 `thincoder-vscode` 全量测试绿；若判端侧零影响，写明依据（实读 / 复跑）以替代。 |
| 6 | 验收标准（可验证性） | 🔵 | AC3（批档 `:181`）机检读数（容器 1 · 条目 1 · 缺 path 1 · abort 1 · 标签 1）未写扫描范围（initial 轮曾限定 `thincoder-core/tools/`）⇒ 计数不可复核。 | 补扫描范围（如 `thincoder-core/tools/*.mjs` + `thincoder-cli/src/acp/bridge.mjs`）再列计数。 |

计数：🔴 0 · 🟡 4 · 🔵 2

VERDICT: pass

## §4 用户批准（主 agent）

### 4.1 批准与实施派发（父侧代签 · 2026-09-25 07:2x）

**依据**：会话标准流（用户 06:26 报障定向 + 05:05 全链授权沿用 + 06:24「钱不是门」口径）。评审 **#110 = pass**（0🔴 / 4🟡 / 2🔵；文摘延迟补达备查 §1.10）→ 逐条裁定全收（§1.9）→ 修正轮 **#112 = 6/6 落地 + 1 附带收正**（父侧抽验：`EDIT.md:65` 两形分述 ✓ · `:107` D-8 登记 ✓ · `:63` 真值限定 ✓）→ token 已签发（设计槽在）。

**批准**：设计面 = `EDIT.md` §5 守卫条文（七条）· §6 入参守卫行 + 同类扫描 · §7（42 例 = 38 快 + 4 slow）· §8 D-6 / D-7 / D-8 + 批档 §2（E1–E6 + 修正块轮 2）——**批准实施**。

**实施**：eng-coder（initial · token 消费）· 落点 = `thincoder-core/tools/file.mjs`（钩子守卫 + 条目 `e?.path`）· `thincoder-core/tools/edit-batch.mjs`（单源调用化：容器 / 条目预扫 / 缺 path / 标签 / abort 前缀）· `thincoder-core/tools/edit-diff.mjs`（两守卫 `assertEditsContainer` / `assertEditEntries` + 五文案常量 + 条目预扫）· `thincoder-cli/src/acp/bridge.mjs`（同调用两守卫 + 四副本引用化）· `thincoder-cli/test/edit-tool-improvement.test.mjs`（+9 例 = 核 5 + 桥 4）。红线：其余工具语义 / schema / 描述面 / `applyEditBatch` 既有应用语义零改 · VSC 端档零改（随核）· 他批面零触 · #327 登记项不触。

**验收**：AC1–AC6（AC4 三套全量 = cli + core + **vsc** 绿；AC3 五计数按范围；AC5 复跑读数；行数五档按批档 `:247`-`:254` 注记）。

## §5 实施记录（eng-coder）
**状态行**：✅ 实施完成 · 2026-09-25（五档落地 · 三套全量绿（cli 829 / core 625 / vsc 961）+ 本档 42 例 · 内部两轮收敛（偏离审计 2 条 / 代码级 pass 0🔴 · 终态 clean））



### 5.1 条 → 落点（五档 · as-of 2026-09-25 现盘实读）

| 条 | 落点（file:line） | 说明 |
|---|---|---|
| E1 / E2 | `thincoder-core/tools/file.mjs:257-270`（`touchedPaths`） | `:263` `Array.isArray(args.edits)` 先行；`:264` `.map((e) => e?.path)` · `:265` `.some((e) => !e?.path)`；`:268` 真值非数组 ⇒ `return []`（零触达）；`:269` 假值视同缺席 → 顶层 `path` 分支；`:271-279` `execute` 零改（`:274` `if (args.edits)` 真值判） |
| E3 | `thincoder-core/tools/edit-diff.mjs:149-153`（`assertEditsContainer`）· `:155-163`（`assertEditEntries`）；调用点 `edit-batch.mjs:29-31` | 判定序 容器(`:29`) → 互斥(`:30`) → 条目预扫(`:31`) → 条目循环(`:38`)；首个读盘在 `:48` ⇒ 预扫零 fs、零部分应用 |
| E4 | `thincoder-cli/test/edit-tool-improvement.test.mjs:279-372`（核 5 例 + 桥 4 例 + `bridgeHarness`） | 桥 harness = `buildAcpCallbacks` 直驱 + 捕获式 `request`（零 fs）；「零反向 RPC」断言 = `requests.length === 0` |
| E5 | `docs/core/design/EDIT.md` §5 / §6 / §7 / §8 D-6·D-7·D-8 / 变更记录 | 设计轮 + fix 轮 + fix 轮 2 已落；**实施轮零 doc 改动**（AC5 复跑读数见 5.3） |
| E6 | `thincoder-cli/src/acp/bridge.mjs:146-148`（同调用两守卫）· `:154`（`EDIT_ENTRY_NO_PATH`）· `:155`（`editEntryLabel`）· `:170`（`EDIT_ABORT_PREFIX`）· `:139-143`（JSDoc 改写）；原本地 abort 常量（旧 `:109`）删 | 四副本字面零改、改引用 |

**单源（AC3）**：两守卫 + 五文案 = `edit-diff.mjs`（`EDITS_CONTAINER_ERROR:50` · `editsEntryError:52` · `EDIT_ENTRY_NO_PATH:54` · `EDIT_ABORT_PREFIX:56` · `editEntryLabel:58` · `assertEditsContainer:149` · `assertEditEntries:155`）；核 `edit-batch.mjs` / 桥 `bridge.mjs` / `file.mjs` 零字面副本。

### 5.2 测试读数（实跑 · 2026-09-25 07:3x–07:4x）

| 套 | 命令 | 读数 |
|---|---|---|
| #325 档 | `cd thincoder-cli && node --test test/edit-tool-improvement.test.mjs` | **42 例 · pass 42 · fail 0**（33 既有 + 9 新 = 核 5 + 桥 4；构成 38 快 + 4 slow） |
| cli | `cd thincoder-cli && node test/run.mjs` | tests **829** · pass 829 · fail 0 · exit 0 |
| core | `cd thincoder-core && node test/run.mjs` | tests **625** · pass 625 · fail 0 · exit 0 |
| vsc | `cd thincoder-vscode && node test/run.mjs` | tests **961** · pass 961 · fail 0 · exit 0 |

### 5.3 行数实计（`split("\n").length`）+ doc-check 读数

| 文件 | 前态 | 实计 | §2.4 注记 | 判 |
|---|---|---|---|---|
| `thincoder-core/tools/file.mjs` | 465 | **469** | ~468（+3） | +4，< 500 ✅ |
| `thincoder-core/tools/edit-batch.mjs` | 205 | **204** | ~204（−1） | ✅ |
| `thincoder-core/tools/edit-diff.mjs` | 389 | **416** | ~409（+20） | +27（守卫 JSDoc 行），< 500 ✅ |
| `thincoder-cli/src/acp/bridge.mjs` | 397 | **395** | ~396（净 −1） | −2 ✅ |
| `thincoder-cli/test/edit-tool-improvement.test.mjs` | 352 | **447** | ~440（+88） | +95，< 500 ✅（近硬限——下批先拆） |

**AC3 机检（`node` 行扫描 · 范围 = `thincoder-core/tools/*.mjs` + `thincoder-cli/src/acp/bridge.mjs`）**：容器 1 · 条目 1 · 缺 path 1 · abort 1 · 标签 1——均 `edit-diff.mjs:50/52/54/56/58`；核 / 桥零副本。**模式精度注**：标签须用模板形态 `` `edit for ${` `` 作模式——宽松模式 `edit for ` 会误命中 `file.mjs:378` 既有英文注释「hashline_edit for hash-based matching」（非文案、非副本）。

**doc-check（`cd thincoder && node scripts/doc-check.mjs` · 实施后复跑）**：候选 **23178** · 悬空 **6** · 注记豁免 43 · 拟新增 12 · 迁移期引文 221 · 行宽 **14**——与 §2 修正块轮 2 落定读数**逐项相同**（本批零 doc 改动）⇒ 触碰档零新增（`EDIT.md` 报告行 = 既有 2 迁移期引文 + 既有宽符号行；本档 = `docs/batches` 机检 exclude 面）。

### 5.4 AC 对照（1–6）

| AC | 结论 | 依据 |
|---|---|---|
| AC1（E1+E2） | ✅ | 用例 1/2 绿（真值非数组三态零抛、`deepEqual []` 带/不带顶层 path 两形；`[null]`→`[]` · `+path`→`[path]` · `[null,{path}]`→`[{path}]` · 非对象条目→`[]`） |
| AC2（E3） | ✅ | 用例 4/5 绿（`/edits\[0\]…/`、`/edits\[1\]…/` 下标精确） |
| AC3 | ✅ | 五计数各 1、皆单源（见 5.3） |
| AC4 | ✅ | 42 例 + cli 829 / core 625 / vsc 961 全量绿；端档零改、随核生效（`thincoder-vscode/src/tools/index.mjs` 引核 `editTool`） |
| AC5 | ✅ | 设计档在档；doc-check 读数与基线逐项相同（零新增） |
| AC6（桥面） | ✅ | 桥 4 例绿：容器 / `[null]` / 非对象条目 ⇒ `{handled:true, result:"Error: …"}` 同句、零反向 RPC；合法批量正向对照 `OK: edited a.txt via IDE` + 请求序 [read, write] |

### 5.5 内部两轮 + 终态

| 轮 | 面 | 读数 | 处置 |
|---|---|---|---|
| 偏离审计（explore · 只读） | 设计 → 实现偏离 | 2 条：1 🟡（§5 未写入——本段即补）+ 1 🔵（`EDIT.md` §6 坐标漂移——见 5.6 项 3） | 无实施偏差 ⇒ 自修 0 轮 |
| 代码评审（advisor · type=code） | 五档 + 文案单源 + 判定序 + 红线 | **0🔴 / 4🟡 / 1🔵 · VERDICT pass**（无 must-fix） | 处置见 5.6 |

**终态 = converged（clean）**：代码与已批设计逐条一致、无未声明改动；上抛项均属设计/文档层（不在本批文件面）。

### 5.6 上抛（父侧定夺 · 本批不改码）

1. 🟡 **钩子 `[]` 口径 × 桥径单形态的「门禁作用域」后果（评审发现 1）**：`file.mjs:268` 返 `[]` 的设计前提是「该调用必败」；但同一入参另携完整单形态参数时桥径走 `editSingle`（`bridge.mjs:311` 路由第二支 → `:313` → `:136` 写盘）⇒ 以 `touchedPaths` 为判据的门禁（`thincoder-core/agent/dispatch.mjs:207`）与记账（`:127-132`）看到零路径。**实读推演、未执行复现**（触发未实证）；与 §2.8 项 4① / `EDIT.md` §8 D-8 同族（#327 邻域）。本批不改码（「返 `[]`」= §4 已批准文本）——建议父侧择一：① 登记（`EDIT.md` §5 / D-8 补一句）；② 若判门禁完整性优先 ⇒ 设计层改回落口径为 `args.path ? [args.path] : []`。
2. 🟡 **`EDIT.md:63`「零裸抛」未限定 `args` 自身（评审发现 2）**：`args = null` 时 `file.mjs:263` 仍裸抛（可达路径 `dispatch.mjs:154` → `:201`）——批档 §2.8 项 3 已登记（#327）、父侧裁定不扩面 ⇒ 代码面不属本批；建议文档面补限定或指路。
3. 🔵 **`EDIT.md` §6 坐标漂移（本批插入所致 · 审计与评审同报）**：`edit-diff.mjs` 七处（旧 76/253/129/143/55/49/63 → 实 **88/280/141/170/67/61/75**）、`edit-batch.mjs` 四处（旧 129/150/184/141 → 实 **128/149/183/140**）；同表 `file.mjs:257`（`touchedPaths`）与新增「入参守卫」行正确。设计档归 eng-designer——建议同轮重锚或标 as-of。
4. **行数偏差登记**：见 5.3（均远低于 500 硬限）；test 档 447/500 近硬限，下批动 edit 测试面先按 §2.4 收正所记切点（桥 harness 独立成档）拆分。

## §6 验证与收口（父代理）

### 6.1 交付与验收（父侧 · 2026-09-25 08:0x）

**交付面**（5 档 + 设计档 + 本档）：`thincoder-core/tools/file.mjs`（**469** · `touchedPaths` 零抛化 `:257-270`）· `edit-diff.mjs`（**416** · 两守卫 `:149-163` + 五文案 `:50/52/54/56/58`）· `edit-batch.mjs`（**204** · 容器 / 条目 / 缺 path / 标签 / abort 引用化）· `thincoder-cli/src/acp/bridge.mjs`（**395** · 同调用两守卫 `:146-148` + 三文案引用化 + JSDoc）· `thincoder-cli/test/edit-tool-improvement.test.mjs`（**447** · +9 例 `:279-372`）；`EDIT.md`（设计面随轮落 + **实现后坐标重锚 11 处**——父侧直接执行 · 可 revert）。

**验证读数**：本档 42/42（33 + 9 = 核 5 + 桥 4）· cli **829/829** · core **625/625** · vsc **961/961**（报障面）· AC3 机检五计数（范围 = `thincoder-core/tools/*.mjs` + `bridge.mjs`——均 `edit-diff.mjs`、核 / 桥零副本）· doc-check 零新增 · 行数五档全 < 500（偏差逐项登记：file +4 / edit-diff +27 / bridge −2 / test +95「下批先拆」在册）· 内部审计 2 条（§5 补 + 坐标漂移）+ 代码评审 **0🔴 / 4🟡 / 1🔵 pass** · 终态 converged。

**上抛处置**：① 钩子 `[]` × 桥径单形态的消费面后果 = **登记不扩面**（#327④ 入册——与 D-8 分歧同源；候选修形须走设计）；② `EDIT.md:63` args 自身限定 = #327⑤ 入册（该面修时一并）；③ 坐标漂移 = 本轮已重锚（11 处 · 父侧直接执行 · 可 revert）；④ 行数偏差 = 接受（全 < 500；test 档「下批先拆」）；⑤ `.thincoder/tmp/**` 旧文案快照 = AC3 扫描范围的显式排除面（记录备查——非缺陷）。

**D7 结算清单**：角色表齐（§1 / §4 / §6 父侧 · §2 designer · §3 评审 · §5 coder）✓ · 计数（5 档 + 设计档 + 本档 · 四套读数）✓ · 指针（需求档 F13 ↔ 设计档 §5 / §6 / §7 / §8 D-6·D-7·D-8 ↔ 本档 §2 / §5）闭 ✓ · 变更记录（EDIT.md 五条）✓ · 台账 **#325** → 已核销 · 前批遗留交叉核：前情 = 无（独立批）⇒ 无遗留 ✓ · 提交 id 回填。

**状态行**：✅ 已收口（2026-09-25）
