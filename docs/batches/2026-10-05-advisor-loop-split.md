# 2026-10-05 · advisor/loop.mjs 拆分（时间线/压缩协作面外提）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-05 · 来源 = 用户 2026-10-05 21:28「找几条技术待办刷几个真实任务试一下」（承台账 #951——轻通道轮收口评审 #41 发现 4）。
> 台账 = #951（core · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-05
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 讨论来源与授权

- 来源 = 台账 **#951**（承轻通道轮收口评审 `#41` 发现 4）+ 用户 21:28「找几条技术待办刷几个真实任务试一下」= 本批点火。
- 现状（实读在册）：`thincoder-core/advisor/loop.mjs` 311 行（内容行 310）> 300 咨询档；函数 `runAdvisorToolLoop`（`:63-307`）≈245 行未越函数层线。
- 方向（本席初判——设计轮勘定）：拆分边界 = 时间线 / 压缩协作面 ∥ 主循环；沿 `CORE-UNIFICATION.md` 先例（re-export 保既有 import 面）。
- 授权 = 全链跑（设计 → 代点火评审 → 代签 → 实施 → 收口）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（2.0–2.10 全落（两切两落 · 逐字迁移规格 · 行为对拍双相位 · L7 复核 1≤2）；§2.8.1 行 26 已落；评审轮次 1 修正九项全落（fix 块在册；doc-check exit 0））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.0 口径与范围（承 §1）

- 条目 = 台账 **#951**（`thincoder-core/advisor/loop.mjs` 310 > 300 咨询档——存量拆分候选；拆分边界 = 时间线 / 压缩协作面 ∥ 主循环）；本设计轮**实读勘定**为两切点、两落点。
- 口径 = 届盘实读为准（本设计轮 2026-10-05 全量实读）；拆分 = **结构零语义**（纯搬——切点 ∥ 落点 ∥ import 面零改 ∥ 拆后批件锁复跑）。
- 禁止面（遵守）：产品码零触（本段 = 设计轮）· 不触 `advisor-async.mjs`（499——距 500 硬帽 1 行，守限）· 他批面零触（`review-face-gaps` ∥ `batch-closeout-sweep` 在飞——本批面零交）· 拆分实施归实施轮 · 不发起评审（门 = 父侧）。
- 缝制式 = **工厂 + 归位**（先例 = `advisor-runs.mjs` 式外提 + re-export 保面；本批 = **对外导出面本就零动**——两切点均为函数内部面，见 §2.3 零改表）。
- 设计档落点 = 本段 + `docs/core/design/CORE-UNIFICATION.md` §2.8.1（**补登子表行 26 + 计数句同改**——本设计轮已落；as-built 回填 = 实施轮）。
- L7 取数面（§2.5 模块列 + 复核行）已落；复核 = 1（M6）≤ 2 ✓。

### 2.1 届盘实读（as-of 2026-10-05 · `wc -l` 口径）

| # | 档 | 登记读数 | 届盘实读 | 备注 |
|---|---|---|---|---|
| 1 | `thincoder-core/advisor/loop.mjs` | 310（#951） | **310** | 内容行 310（编辑器显示 311 = 文末换行位）；函数 `runAdvisorToolLoop` `:63-307` ≈245 行未越函数层线 |
| 2 | `thincoder-core/advisor/compaction.mjs` | — | **175** | 压缩 / 守卫 / 装配三族（落点二档） |
| 3 | `thincoder-core/advisor/timeline.mjs` | — | **不在盘** | 新档名实核无冲突（`advisor/` 现有 11 档——`timeline.mjs` 自由） |
| 4 | `thincoder-core/advisor/run.mjs` | 204 | **204** | 转口面（零改——本批对照行） |
| 5 | `thincoder-core/agent-tools/advisor-async.mjs` | 499 | **499** | 守限对照行（零触） |

- 工作树为基（loop.mjs 最近笔 = review-cross-talk 批 `:142` 注释行——已提交态；设计实读含该态）。

### 2.2 拆分边界与理由（逐函数归属）

**边界总式** =「时间线记录面 + 压缩协作面」∥「主循环（守卫 / 模型调用 / 工具执行 + 对外导出）」——与 #951 登记同式；实读勘定为**函数内部两切点**（顶层三函数 `advisorCodeSearchTool` / `advisorToolsFor` / `runAdvisorToolLoop` 全留）：

| 段（现 `loop.mjs`） | 行 | 内容 | 归属 | 由 |
|---|---|---|---|---|
| 时间线记录面 | `:71-85` | `timeline` 数组 + `record` 同类合并器 + `emit` 三 kind 包装器（`onThink` / `onText` / `onTool`） | **迁出 → `timeline.mjs`**（新档） | 族自洽（记录序 / 合流规则 / 三 kind 一体）；下游消费 = `renderTimeline`（compaction.mjs 装配族——recorder 为其数据源） |
| 压缩协作面 | `:146-156` | 压缩检查点（超 `compactAt` ⇒ 通知 + `compactMessages` 重写；重写后仍超 `limit` ⇒ 上下文超限尾） | **归位 → `compaction.mjs`**（既有压缩族——新增 `compactContextIfNeeded`） | 依赖面全在本档（`estimateTokens` / `compactMessages`）+ 尾族单源（`context_limit` 判定前缀本档 `:92-99`）+ **零新 import 边** |
| 主循环（留） | 其余全部 | 守卫族（中断 / 墙钟 / 0.75 提示 / 轮帽 / stall 看门狗）· chat 调用 + 墙判定两形态 · assistant 消息推入 · 工具解析 / 并行执行 / 回填 · `renderTimeline` 收尾 9 处 · 顶层三函数 | 留 | 守卫与工具执行 = 循环本体；顶层函数 = 对外面（§2.3） |

- **显式不拆面**：`:158-166` 思考占位发射（`onOutput` 单点直发——非记录面，不入 recorder）· `:93-106` 计数器 / 预算派生 / 动态 import · 工具执行族 `:241-305`（并行 / 超时 / 截断）。
- **行数账**：迁出 26 行（15 + 11）⇒ 主档 310 −26 +3（替换行净）+1（import 行）+1（头注）= **≈289–290**（≤300——余量 ≥10）；`timeline.mjs` ≈27（15 + 头注 + 壳）；`compaction.mjs` 175 +≈20 = **≈195**。三档全 ≤300。

### 2.3 新档落点与接口面逐字（导出 / re-export 表）

**落点一 —— `thincoder-core/advisor/timeline.mjs`（拟新增——时间线记录外提产物）**：

- 全文骨架（结构 / 标识符 / 语义钉死；仅头注与 jsdoc 措辞可微调）：

```js
/** advisor/timeline.mjs — 评审环路的有序时间线记录器（自 advisor/loop.mjs 迁出——advisor-loop-split 批）：
 *  记录序 / 同类合流 / 三 kind 包装一体；下游消费 = renderTimeline（compaction.mjs）。
 *  @param {Function} [onOutput] — 实时 chunk 出口；缺省 ⇒ 只记录不出口。 */
export function createTimelineRecorder(onOutput) {
  // [切点 A 注释 5 行 —— 逐字]
  const timeline = []
  // [切点 A `:76-85` —— 逐字（同缩进）]
  return { timeline, onThink, onText, onTool }
}
```

- 导出面 = **`createTimelineRecorder` 1 名**（唯一导出；无外部消费者 ⇒ 无 re-export 义务）；import 面 = **零**（零依赖叶——对照 `agent/relay-prefix.mjs` 先例家族）。

**落点二 —— `thincoder-core/advisor/compaction.mjs`（既有档 · 压缩族归位）**：

- 插入点 = 现 `:83`（`compactMessages` 收括号）与 `:85`（「不完整判定族」分隔线）之间（占用现 `:84` 空行位）。
- 新增导出 = **`compactContextIfNeeded(messages, budget, pinned, onText)` → `string | null`**——语义：超 `budget.compactAt` ⇒ `onText` 通知 + `compactMessages(messages, pinned)` 原地重写；重写后仍超 `budget.limit` ⇒ 返回上下文超限尾串（逐字 = 原 `:154` 尾）；否则 `null`。
- 既有导出面零改；两处注记随动：档头注（+拆分句）· `:91`（尾族注——「其余五条」⇒ 四条，`context_limit` 生成点改本档）。

**loop.mjs 对外接口面（逐字零改表）**：

| 面 | 现形态 | 拆后 | 判定 |
|---|---|---|---|
| `loop.mjs` 导出① | `export { advisorToolsFor, advisorToolsFor as _advisorToolsFor }`（`:49`） | 同行文本（行位随动） | 零改 |
| `loop.mjs` 导出② | `export { runAdvisorToolLoop, runAdvisorToolLoop as _runAdvisorToolLoop }`（`:310`） | 同行文本（行位随动 → ≈`:290`） | 零改 |
| `run.mjs` 转口 | `:11` import + `:17` / `:18` re-export | 逐字零改（本批不触 `run.mjs`） | 零改 |
| 消费面 | `advisor-async.mjs`（经 run.mjs）· 批件 `docs/batches/2026-10-05-subagent-zero-write-watchdog.test.mjs:36` / `:269`（直取 `_runAdvisorToolLoop`） | 零改 | 零改 |
| 新增面 | — | `timeline.mjs` `createTimelineRecorder` · `compaction.mjs` `compactContextIfNeeded`（供 loop 内部消费；无外部 re-export / 无外部消费者） | 新增 |

- **identity 断言面**（批内件 S 腿钉）：`_advisorToolsFor === advisorToolsFor` · `_runAdvisorToolLoop === runAdvisorToolLoop`。

### 2.4 逐字迁移规格（切点 / 替换行——实施者零开放结构决定）

**切点 A（`:71-85` · 15 行）→ `timeline.mjs`**：整段**逐字**（缩进位不变——工厂体同为 2 空格）；`:83-85` 三行 `const` 原样保留，其后 +`return { timeline, onThink, onText, onTool }`。
loop.mjs 侧替换 = **1 行**（原位）：

```js
  const { timeline, onThink, onText, onTool } = createTimelineRecorder(onOutput)
```

**切点 B（`:146-156` · 11 行）→ `compaction.mjs`**：去缩进两级（4/6/8 ⇒ 2/4/6 空格）；`:154` 尾**去 `renderTimeline(timeline, …)` 包装**（`return renderTimeline(timeline, \`<尾>\`)` ⇒ `return \`<尾>\``——唯一形式转换；尾串逐字）。
loop.mjs 侧替换 = **3 行**（原位）：

```js
    // 压缩协作（迁出 compaction.mjs `compactContextIfNeeded`）：超限尾 ⇒ 收尾
    const contextTail = compactContextIfNeeded(messages, budget, pinned, onText)
    if (contextTail) return renderTimeline(timeline, contextTail)
```

**import 面改动（loop.mjs）**：`:16` 去 `estimateTokens, compactMessages` 两名（`:15-19` 块重排后仍 ≤5 行）；`:19` 后 +1 行 `import { createTimelineRecorder } from "./timeline.mjs"`。

**头注**：loop.mjs 头注 +1 行（拆分句：时间线面 → `timeline.mjs` ∥ 压缩协作面 → `compaction.mjs`）；compaction.mjs 头注 +1 句；`timeline.mjs` 新建头注。

**行为等价清单（形式转换全枚举——共 3 处）**：① recorder 三 `const` ⇒ return 对象（名序 `onThink` / `onText` / `onTool`）；② 超限尾的 `renderTimeline` 包装去（helper 内）/ 加（调用点）——尾串与装配序逐字；③ 缩进级调整（切点 B）。**其余逐字**。

### 2.5 受影响文件表（行数 + Δ + 模块列 + L7 复核）

| # | 档 | 现读 → 预期 | Δ | 模块 | 面 |
|---|---|---|---|---|---|
| 1 | `thincoder-core/advisor/loop.mjs` | 310 → **≈290**（±2） | −20 | M6 | 宿主（两切点迁出 + import 重排 + 头注） |
| 2 | `thincoder-core/advisor/timeline.mjs` | 不在盘 → **≈27** | 新 | M6 | 新档（拟新增——recorder 外提产物） |
| 3 | `thincoder-core/advisor/compaction.mjs` | 175 → **≈195** | +20 | M6 | 归位（`compactContextIfNeeded` + 两注） |
| 4 | `thincoder-core/advisor/run.mjs` | 204 → **204** | 0 | M6 | 转口面零改（对照行） |
| 5 | `thincoder-core/agent-tools/advisor-async.mjs` | 499 → **499** | 0 | M6 | 守限对照行（零触） |
| 6 | `docs/core/design/CORE-UNIFICATION.md` | §2.8.1 行 26 + 计数句 | +3±1 | — | 设计轮已落（本批登记面；as-built = 实施轮回填） |
| 7 | `docs/batches/2026-10-05-advisor-loop-split.test.mjs` | 不在盘 → ≈200–320 | 新 | — | 批内件（§2.6——行数随批档留存口径，>300 记录接受，先例 342 / 319 行同判） |
| 8 | 文档坐标收正面（9 档 + 代码注释 1 + API-CONTRACT 生成区） | 行内 | ±0 | — | 实施轮同笔（清单见下） |

**模块列口径**：M6 = 评审凭证（advisor）族面（`ENGINEERING-MODE-V2.md` §2.2 M6 行域）。**L7 复核（判定时点②——本表落表后）：去重 = 1（M6）≤ 2 ✓ 达标**（设计档行 / 批档行非 M 族记 `—`、不计）。备选口径（§2.9 上抛②）：按「§2.2 点名单文件」严格口径三档记 `—`（计数 0）——两口径皆 ≤2、无动作分歧。

**文档坐标收正面（届盘实读枚举 2026-10-05——grep `advisor/loop.mjs` 全仓；实施轮按 as-built 重锚）**：

- 生成点坐标（随拆动，须重锚）：`docs/core/design/ADVISOR-GUARDS.md` §1 表 `:16`（`loop.mjs:132`）· `:17`（`:121`）· `:19`（`:195`）· `:20`（`:100` / `:184`）；`docs/core/design/ADVISOR-CONVERGENCE.md` `:414` / `:447`（`:205-215`）；`docs/core/design/AGENT-PARAMS.md` `:23` / `:57` / `:70`（`:106`）；`docs/core/design/CONTEXT-COMPACTION.md` `:167` / `:698`（`:199-204` / `:205-215`）；`docs/core/design/TOOL-OUTPUT-LIMITS.md` `:65` / `:94`（`:290`）；`docs/core/design/AGENT-LOOP-SUBAGENT.md` `:562`（`:128`）· `:707`（`:45`）；`docs/core/design/DOC-DISCIPLINE.md` `:466`（`:217`）；`docs/core/design/CORE-UNIFICATION.md` `:1320`（`:67`）· `:1497`（`:46`）；`docs/core/design/AGENT-LOOP-UPSTREAM.md` `:1029`（`:120` / `:91` / `:158`）· `:1050`（`:26`）；代码注释 `thincoder-vscode/src/extension/panel-callbacks.mjs:229`（`loop.mjs:82`——随迁）。
- 零改面（点名无行号 / 史值记录）：`model-specs.mjs:341` · `tool-args.mjs:7` · `tools/shared.mjs:167` · `zero-write-watch.mjs:7` · 各批档（记录面）。
- 生成区面：`API-CONTRACT.md:440` / `:441`（`--write` 重生成即随——实施轮）。

### 2.6 验收（行为零回归——批内件对拍 · 红绿对 · AC 逐条机检）

**批内件** = `docs/batches/2026-10-05-advisor-loop-split.test.mjs`（沿同族先例——watchdog / cross-talk 批件形；复跑 = `node --test` 直跑）。
**双相位对拍协议（红绿对）**：Phase A（拆分前——实施轮第一步）跑全件 = 行为腿（B 族）绿 ⇒ 读数（return 串 / onOutput 序列 / messages 形态）落 §5 基线；结构腿（S 族）红（新档不在盘 / 主档 310）。Phase B（拆分后）复跑 = S 族转绿 ∧ B 族读数与 §5 基线**逐字相等**（对拍判据）。B 腿期望值 = Phase A 捕获后冻结入件（此后自锁；复跑不变）。

| # | 判据 | 通过条件（可机检） | 反证面 |
|---|---|---|---|
| AC-1 | 行数面 | `wc -l`：loop ≤300（≈290）· timeline ≤300（≈27）· compaction ≤300（≈195） | 越线 ⇒ 转红 |
| AC-2 | 逐字面 | 切点 A（15 行）⊆ timeline.mjs 逐字；切点 B（11 行——去缩进 2 级、`:154` 尾形式转换显式）⊆ compaction.mjs 逐字；loop 替换行 = §2.4 逐字 | 漂字 ⇒ 转红（批内件字符串断言 + Phase A 前像切片对拍） |
| AC-3 | 接口面 | `loop.mjs` 导出键集 = 恰 {`advisorToolsFor`,`_advisorToolsFor`,`runAdvisorToolLoop`,`_runAdvisorToolLoop`} · 两 `_` 别名 identity 相等 · `run.mjs` 转口四名可解析 | 缺名 / 别名断 ⇒ 转红 |
| AC-4 | 行为对拍（B 族） | B1 多轮工具回路（并行两工具 + 未知工具 + 坏参 JSON ⇒ 收尾文本）· B2 空响应回落 · B3 中断（预中止 signal）· B4 墙钟（`seams.now` 推过 deadline ⇒ 结构化超时尾）· B5 压缩两分支（通知行 + 超限尾——重消息构造 ∥ 小窗模型 provider，实施轮按成本择一）· B6 0.75 预算提示恰一次 —— 各腿读数与基线逐字相等 | 任一腿漂移 ⇒ 转红（= 行为回归） |
| AC-5 | 既有批件锁复跑 | `2026-10-05-subagent-zero-write-watchdog.test.mjs`（U-ZW7 / U-ZW8 真环路 stall 两腿）绿 · `2026-10-05-review-cross-talk.test.mjs` 绿（其 `../provider/core.mjs` resolve 钩子按 `parentURL=…/advisor/loop.mjs` 绑定——chat 导入留存 ⇒ 仍生效） | 锁红 ⇒ 转红 |
| AC-6 | 零环面 | `timeline.mjs` 零 import；`compaction.mjs` 新增函数零新 import；依赖单向（loop → {compaction, timeline}；新档不 import 宿主） | 环 / 反向 ⇒ 转红（批内件源扫） |
| AC-7 | 文档机检面 | `node scripts/doc-check.mjs --root .` **exit 0**（悬空 0 · 行宽 0——设计轮已实跑在读；实施轮复跑）· `node scripts/api-contract.mjs --write` 后 `--check` 零漂移（新导出两行 + loop 两行坐标随动） | 悬空 / 漂移 ⇒ 转红 |
| AC-8 | 登记面 | `CORE-UNIFICATION.md` §2.8.1 行 26 + 计数句在场（设计轮已落）；实施轮回填 as-built 读数（行 26 兑现收正） | 缺登记 ⇒ 转红 |

- 行数 / 逐字面 = 源审级证据（`git diff` 对拍 + 前像切片）；行为面 = 批内件 + 两批件锁；**核内套件 = 空清单常态**（2026-09-28 全清——非可红判据）。

### 2.7 关键决策（KD——含备选否决）

- **KD-1 两切两落**（`timeline.mjs` 新档 + `compaction.mjs` 归位）而非单新档伞形（`loop-faces` / `loop-support` 式）：由 = 各归语义家（recorder ↔ renderTimeline 数据源；压缩检查点 ↔ `compactMessages` / `estimateTokens` / `context_limit` 尾族）；避免造第三个概念名。被否 = 单伞档（命名无定义承载 + 压缩族仍错位）∥ 两新档（多一面，不必要）。
- **KD-2 压缩协作面落 `compaction.mjs`（既有）**：由 = 依赖面全在本档 + 尾族单源 `context_limit`（判定前缀本档 `:92-99`）+ 零新 import 边。被否 = 独立 `loop-compaction.mjs` 新档（双压缩面 + 新 import 边）。
- **KD-3 缝形 = 工厂 + 调用点解构保名（时间线）· 尾串返回制（压缩）**：由 = 循环体其余零改（8 处 `renderTimeline` 收尾点 / 全量名面不动）。被否 = `rec.timeline` 显式接点（8 处改点）∥ 回调式压缩（控制流外移——面过大）。
- **KD-4 守限面**：不触 `advisor-async.mjs`（499）· 不触 `run.mjs`（转口零改 = 零回归）· `messages.mjs` Δ0（300 贴线）。
- **KD-5 批内件 = 行为对拍 + 结构腿（双相位）**：先例 = watchdog / cross-talk 批件；行数口径随批档留存（记录接受）。

### 2.8 实施轮义务（拆落盘后）

- 双相位跑批内件（**A 相先跑**——基线留 §5）→ 三档拆落盘 → B 相复跑（S 绿 + 对拍相等）+ 两批件锁复跑 + `node --check` 三档 + 批内件。
- `node scripts/doc-check.mjs --root .` 复跑（exit 0）· `node scripts/api-contract.mjs --write` 后 `--check` 零漂移。
- §2.5 文档坐标收正面 as-built 重锚（9 档 + 代码注释 1 处——生成点坐标）。
- `CORE-UNIFICATION.md` §2.8.1 行 26 as-built 兑现回填（310 ⇒ ≈290 + 产物行——落笔 = 设计档写权面）。

### 2.9 上抛项（父侧裁——均非阻塞）

1. **§1 引据勘正**：§1「同档 §2.8.1 行的拆分义务已挂在案」——实读 = 义务挂点 = `AGENT-LOOP-UPSTREAM.md` §6.32.7 行 4（「拆分预案随该档下次结构性触碰登记」，watchdog 批）+ 台账 #951；§2.8.1 原**无** loop.mjs 行。本设计轮按义务**补登子表行 26**（缺口已消解）。请父侧知悉（口径更正，零动作分歧）。
2. **L7 模块归属口径**：三 advisor 档记 M6（族面口径——本批零改 M6 机制语义）。若按「§2.2 点名单文件」严格口径 ⇒ `—`（计数 0）。两口径皆 ≤2；本设计采 M6 口径（§2.5 备注在档）。
3. **坐标漂移面**（报·归实施轮）：§2.5 清单（9 档 + 代码注释 1 + API-CONTRACT 生成区）——按 as-built 重锚；非设计轮前置。

### 2.10 边界（本批不做）

- 三档以外零结构 / 语义改动；注释级随动仅限 §2.4 / §2.5 枚举；产品码本段零触（设计轮）；不实施（归实施轮）；不发起评审。
- 不做续拆（拆后 ≈290 余量健康）；不并他档；不触 `advisor-async.mjs` / `messages.mjs` / `run.mjs`。

**设计评审轮 1 修正（fix 轮 · eng-designer · 2026-10-05）**——承 §3 轮次 1（四项 🟡 ＋ 五项 🔵 全采纳·逐号落修；#10 / #11 = 评审上下文受限说明——零动作，回执 = 本块在册）。**§2 内逐号正文以本块相应条目为准**（本档 append-only——上文语句由本块修正 ∥ 取代）；机制语义零改（仅计数 / 标注 / 描述 / 引据面；产品码零触；他批在飞面零触；他段零触）：

1. 🟡（#1 · 读数互斥）`advisor-async.mjs` 复读 = **499**（`wc -l` 实读 2026-10-05——批后终态）；`CORE-UNIFICATION.md:1135` 的 497 收正为 **499**（口径注：497 = review-cross-talk 批中基线〔该批实施轮守限基准〕——两值之别 = 批次时点；**距 500 硬帽 1 行**随正）。本档 `:24` / `:37` / `:124` / `:160` 四处 499 = 同一读数（守限基准唯一）。
2. 🟡（#2 · 行数标注）§2.5 行 8 拆分收正 = **`thincoder-vscode/src/extension/panel-callbacks.mjs` 单列一行**：现读 **325** → 预期 **325**（±0 · 结构未变；面 = 代码注释 1 处随迁——`:229` 的 `advisor/loop.mjs:82` 改指，注释级）；**触评 = Δ0 注释级不构成「下次实质改动」触发**（先例句式 = `CORE-UNIFICATION.md:1135` 批·五触评行）。原行 8（文档坐标收正面）顺延为行 9——「代码注释 1」并入新行 8，行 9 面 = 9 档 `.md` ＋ API-CONTRACT 生成区（表共 9 行）。
3. 🟡（#3 · 档位面）§2.5 行 7 收正 = **有界（≤300）**：批内件 不在盘 → **≤300**；件内按腿族分组（**B 腿对拍族 ∥ S 腿结构族**）；**越线兜底 = 预点拆点已在册**（同两腿族边界拆 B / S 两档——不预授权越线；行数随批档留存口径同判）。
4. 🟡（#4 · 引据）§2.9-1 收正 = **义务挂点 = `AGENT-LOOP-UPSTREAM.md` §6.32.7 行 4（「拆分预案随该档下次结构性触碰登记」，watchdog 批）＋ 台账 #951**；§2.8.1 本批前无 loop.mjs 行——本设计轮按义务补登子表行 26（缺口已消解）。请父侧知悉（口径更正，零动作分歧）。
5. 🔵（#5 · 计数）行数账单一算式收正 = **310 − 26 + 4 + 1 + 1 = 290**（替换行 = 4：切点 A 1 行〔`:95`〕＋切点 B 3 行〔`:102`〕；§2.4 逐字）；9 / 8 关系句补 = `renderTimeline` 收尾点 **9 处**（§2.2 行 3）= **8 处不动**（`:110` / `:121` / `:131` / `:202` / `:206` / `:210` / `:217` / `:218`）**＋ 1 处随切点 B 挪至调用点**（现 `:154` ⇒ §2.4 替换行第 3 行——KD-3 同源）。
6. 🔵（#6 · 坐标）§2.5 坐标清单 `CORE-UNIFICATION.md` 两条随现盘收正 = **`:1320` ⇒ `:1323`（`:67`）· `:1497` ⇒ `:1500`（`:46`）**（现盘复读——对落笔口径差 3 = 本批 §2.8.1 补登 +2〔评审勘定〕＋ 本修正轮续行 +1）；抬头口径句同步 = 「届盘实读枚举 2026-10-05——CORE-UNIFICATION.md 两条 = 收正后现位；实施轮按 as-built 重锚」。
7. 🔵（#7 · 规格完备）import 面规格（`:110`）补全 = `:16` 行收正为「去 `estimateTokens` / `compactMessages`，**增 `compactContextIfNeeded`**（自 `compaction.mjs`——同名行追加，**行数不变**；`:15-19` 块重排后仍 ≤5 行）」；另 `:19` 后 ＋1 行 `import { createTimelineRecorder } from "./timeline.mjs"`（不变）⇒ loop 侧全部裸名在 import 面写死（「实施者零开放结构决定」成立）。
8. 🔵（#8 · 基数）§2.5 行 6 前提勘定 = **`loop.mjs` 未在 `SOFT_LINE_REGISTRY` 在册基数内**（该表冻结于 2026-09-29〔在册 47〕时 `loop.mjs` = 288 < 300；越线时点 = watchdog 批 2026-10-05：288 → 310——依据 = `AGENT-LOOP-UPSTREAM.md` §6.32.7 行 4）⇒ 按 3 / 1 / 2 档同式**补一档句 ＋ 同改基数计数**：`CORE-UNIFICATION.md:1111` 行末续新行（**:1112** 现位）=「＋ **advisor-loop-split 批登记义务 1 档**（`thincoder-core/advisor/loop.mjs`——子表行 26；随测试体系重建恢复时落册）」；`:1117`「其余 26 档待补」⇒ **27**（算式收正 = 29 − 2 − 1 ⇒ 26 ＋ 本批 1 档 ⇒ 27）；同书面同步 `:1106`「其余 28 档待补」⇒ **27**（旧滞后读数——连查项）。基数勾稽 = 47 ＋ 7 义务（3＋1＋2＋1）= 54 = 已登 27 ＋ 待补 27（机判自洽）。
9. 🔵（#9 · 口径）§2.1 行 3 基准补注 = `advisor/` **目录内现有 11 档**（**不含根档 `advisor.mjs`**——含根档 = 12）；`CORE-UNIFICATION.md:512`「全族（10 档 + `advisor.mjs`）」收正为「**全族（11 档 + `advisor.mjs`）**」（现盘复读——对落笔口径差 1）。`timeline.mjs` 新档名自由判定不受影响。

**产出读数**：`node scripts/doc-check.mjs`（cwd = 仓根）= **exit 0**（悬空 0 · 行宽 0；首跑曾因 `:1111` 行宽 381 字符 FAIL——已按续行拆分收正后复跑通过）。**本轮触碰** = `CORE-UNIFICATION.md`（5 处：`:512` / `:1106` / `:1111`＋续行 / `:1117` / `:1135`——净 +1 行〔续行拆分〕）＋ 本档 §2（本块）。
**连查（随 ⑨ 报备）**：`CORE-UNIFICATION.md:674`「`advisor/` 余 7 档」= 族 1 期历史计数（10 − 3）——现盘口径余数应为 **8**（11 − 族 1 三档）；系 S2 族 1 边界句（迁移期记录位）、越 ⑨ 明列面——**未触**，报父侧定夺。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**发现表（轮次 1——设计评审 · 范围 = 批档 §2 全段 + `CORE-UNIFICATION.md` §2.8.1/§2.5 相关行）**

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Doc-state 一致性 | 🟡 | `advisor-async.mjs` 同日读数两档互斥——本设计（batch:37）记「499 → **499**」，batch:24 记「不触 `advisor-async.mjs`（499——距 500 硬帽 1 行，守限）」；`CORE-UNIFICATION.md:1134` 同日（2026-10-05）记「`advisor-async.mjs` 现读 = **497**（≤500 硬帽在位——review-cross-talk 实施轮守限基准）」。守限余量（1 行 / 3 行）随之不可机判。 | 复读一次并把两档收正到同一读数，并标注该值口径（批次中基线 vs 批后终态），使守限基准唯一。 |
| 2 | Affected-file 行数标注 | 🟡 | §2.5 行 8（batch:127）把 9 档 `.md`（免档位判定）与唯一一个源代码档混为一行：该行点名「文档坐标收正面（9 档 + 代码注释 1 + API-CONTRACT 生成区）」，而其一为将随批修改的产品码档（batch:133「代码注释 `thincoder-vscode/src/extension/panel-callbacks.mjs:229`（`loop.mjs:82`——随迁）」）——缺「当前行数 + Δ」标注（本档自持口径 = `CORE-UNIFICATION.md:1702`「受影响文件清单（R24a 口径：当前行数 + 预计增量）」）。 | 把该源代码档单列一行，补「现读行数 → 预期（≤±N / 结构未变）」+ 触评（Δ0 注释级是否构成「下次实质改动」触发——先例句式见 `CORE-UNIFICATION.md:1134`「不构成「下次实质改动」触发」）。 |
| 3 | Affected-file 行数标注 · 档位面 | 🟡 | §2.5 行 7（batch:126）新建测试档预估「不在盘 → ≈200–320」横跨 300 行档位线，并以「>300 记录接受，先例 342 / 319 行同判」预授权越线——未给拆分计划 / 拆点，且预估跨度 120 行，档位判定无唯一结论。 | 收窄为有界预估（≤300）并在件内按腿族分组；或预点拆点（如 B 腿对拍族 ∥ S 腿结构族分档），使越线时拆分计划已在册。 |
| 4 | Doc-state 一致性 | 🟡 | §2.9-1（batch:172）所引「§1「同档 §2.8.1 行的拆分义务已挂在案」」在本档 §1 现存文本（batch:5–14）中不存在（§1 现状行 = batch:12「现状（实读在册）：`thincoder-core/advisor/loop.mjs` 311 行（内容行 310）> 300 咨询档」，§1 全文无 §2.8.1 字样）⇒ 引据不可回溯；其实质结论（§2.8.1 原缺 loop.mjs 行 + 本批补登行 26）独立成立。 | 把引句改为 §1 实际在册文本，或直接点名两处义务挂点（`AGENT-LOOP-UPSTREAM.md` §6.32.7 行 4 + 台账 #951），去掉不可回溯的引号内容。 |
| 5 | Clarity · 计数一致性 | 🔵 | 两处计数与逐字规格不合：① batch:52「310 −26 +3（替换行净）+1（import 行）+1（头注）」——§2.4 替换行为 1 行（batch:95「loop.mjs 侧替换 = **1 行**（原位）」）+ 3 行（batch:102「loop.mjs 侧替换 = **3 行**（原位）」）= 4 行，按「+3」得 289、按 4 行得 290（§2.5 行 1 Δ −20 与后者一致）；② batch:49「`renderTimeline` 收尾 9 处」对 batch:159「循环体其余零改（8 处 `renderTimeline` 收尾点」——两值可解（9 = 8 处不动 + 1 处随切点 B 挪至调用点）但未写。 | 用单一算式收正（310 − 26 + 4 + 1 + 1 = 290），并补一句 9 / 8 的关系，使行数账与 KD-3 同源。 |
| 6 | Doc-state · 坐标 | 🔵 | §2.5 坐标清单对 `CORE-UNIFICATION.md` 的两条与现盘差 2 行——清单（batch:133）「`docs/core/design/CORE-UNIFICATION.md` `:1320`（`:67`）· `:1497`（`:46`）」，现盘两条分别在 `CORE-UNIFICATION.md:1322`（含「`advisor/loop.mjs:67`」）与 `:1499`（含「`advisor/loop.mjs:46`」）——差 2 行 = 本批 §2.8.1 补登（行 26 + 计数句）下推该档行号；清单抬头虽称「届盘实读枚举 2026-10-05」，此两条实为落笔前读数。 | 该两条随 as-built 重锚按现盘复读；或在清单抬头注明「行号 = 落笔前口径」，免得与「届盘实读」相抵。 |
| 7 | Clarity · 迁移规格完备性 | 🔵 | §2.4 的 import 面规格只写「去」两名 + 新增 `timeline.mjs` 一行（batch:110「`:16` 去 `estimateTokens, compactMessages` 两名」），未写 `compactContextIfNeeded` 自 `compaction.mjs` 的 import 落点——而调用点用裸名（batch:106「const contextTail = compactContextIfNeeded(messages, budget, pinned, onText)」），与本节自称「实施者零开放结构决定」（batch:92）不符（缺该名 ⇒ 行为腿 ReferenceError 兜住，属可写死而未写死的一处）。 | 在 import 面规格中把该名写死（追加到既有 `compaction.mjs` import 行、行数不变），使「零开放结构决定」成立。 |
| 8 | Doc-state · 计数基数 | 🔵 | §2.5 行 6（batch:125）改动集只列「§2.8.1 行 26 + 计数句」；而 §2.8.1 的登记句式为「在册 **47 档**」（`CORE-UNIFICATION.md:1110`）＋ 各批「登记义务」句（:1111「＋ **tools-carryover 批登记义务 3 档**」式）。本批改后「拆分计划已登 **27 档**」（:1112）与「后 **26** 档见下子表」（:1115）只在 `loop.mjs` 已含于该基数时自洽（53 − 27 = 26，与 :1116「**其余 26 档待补**」相符），但该前提未写、是否需新增一档「登记义务」句亦未写。 | 在行 6 补一句前提（`loop.mjs` 已在 `SOFT_LINE_REGISTRY` 在册基数内 ⇒ 免新增登记义务句；否则按 3 档 / 1 档 / 2 档同式补一档句并同改基数计数），使计数可机判。 |
| 9 | Doc-state · 档数口径 | 🔵 | `advisor/` 档数两处口径不一——batch:35「（`advisor/` 现有 11 档——`timeline.mjs` 自由）」对 `CORE-UNIFICATION.md:512`「`advisor/` 全族（10 档 + `advisor.mjs`）」；或为计数基准不同（目录内 vs 含根档 `advisor.mjs`），或一处已过期。新档名无冲突结论不受影响。 | 把计数基准写死（目录内档数 / 含根档）并收正过期一侧。 |
| 10 | Methodology（评审受限说明） | 🔵 | 评审上下文未声明项目标准档 ⇒ 方法学合规按 Project Guide（AGENTS.md：ESM `.mjs` · ≤300 咨询 / ≤500 硬限 · 讨论即落档 · 每改须实跑）判读；设计四项自洽（三档全 ≤300、登记已落、批内件 + 两批件锁 + doc-check 实跑面齐）。降级说明，非设计缺陷。 | — |
| 11 | Document ownership（评审受限说明） | 🔵 | 评审上下文无项目文档地图 ⇒ Document ownership 判据降级；按在册文档自述口径核（`CORE-UNIFICATION.md:1087`「设计侧现行登记面 = 本小节子表」）：本设计改该子表 + 同档既有行，未为既有章节新开档；批档 §2 与 §2.8.1 行 26 逐项相符（310 / ≈290 / ≈27 / `:71-85` / `:146-156` / 转口零改），无机制级相抵、无重复描述。 | — |

**计数**：🔴 0 · 🟡 4 · 🔵 7（含 2 条评审上下文受限说明）

VERDICT: pass

## §4 用户批准（主 agent）

**代签 · 2026-10-05**（自动跑授权在效）

- 评审轮 1 = **pass**（0🔴 · 4🟡 + 7🔵；父裁 = 九项采纳修正、两项登记）→ 修正轮 `#11` 落定（fix 块 `:181-194` · 以本块为准）→ **批准实施**（eng-coder 单舱；设计令牌持）。
- 实施面 = 设计终值 §2 ∥ §2.4（逐字迁移规格）∥ fix 块（计数 / 坐标 / 规格收正）；验收 = §2.6 AC ＋ fix 块 ③（批内件有界 ≤300 ＋ 预点拆点）∥ 行位守限三档 ≤300。
- 连查项（fix 块 ⑨ 报备）：`CORE-UNIFICATION.md:674`「`advisor/` 余 7 档」历史计数 = 现盘口径 8——**本批不触**（越明列面；如判须修 = 另裁）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（三档 310→290 ∥ 26 ∥ 175→194 全 ≤300；批内件 11/11；既有锁 9/9 ∥ 6/6；六门全绿；审计 1 轮零分歧 · 评审 1 轮 pass · 修复 1 轮；终态 clean）



### 5.1 交付摘要（实施轮 · eng-coder · 2026-10-05）

- 三档：`thincoder-core/advisor/loop.mjs` **310 → 290** ∥ 新档 `thincoder-core/advisor/timeline.mjs` **26** ∥ `thincoder-core/advisor/compaction.mjs` **175 → 194**（三档全 ≤300）；纯结构零行为语义——切点 A/B 逐字迁出，形式转换 = §2.4 全枚举 3 处（recorder 返回对象 / 超限尾包装去·加 / 缩进），无第 4 处。
- 接口面零改：loop 导出 4 名（`advisorToolsFor` / `_advisorToolsFor` / `runAdvisorToolLoop` / `_runAdvisorToolLoop`）＋ `run.mjs` 转口逐字零改；零触 = `advisor-async.mjs`（499 未动）∥ `messages.mjs` ∥ `run.mjs` ∥ 他批在飞面。
- 批内件 = `docs/batches/2026-10-05-advisor-loop-split.test.mjs`（**255** 行 ≤300；B 腿 B1–B6 行为对拍 ∥ S 腿 S1–S4 结构 / 逐字 / 接口锁 / 零环面）。
- 文档坐标面：9 档 as-built 重锚 ＋ `panel-callbacks.mjs:229` 注释改指（`advisor/timeline.mjs:21`）＋ `API-CONTRACT.md` 生成区 `--write` 重生成（新导出两行 `compaction.mjs:89` / `timeline.mjs:9` ＋ loop 两行 `:51` / `:290`；同区吸收他批在盘未提交 desktop renderer 7 行坐标随动——见 §5.6）。

### 5.2 红绿两读（双相位对拍 · AC-①）

- **Phase A（拆分前）**：`node --test docs/batches/2026-10-05-advisor-loop-split.test.mjs` = **tests 11 · pass 8 · fail 3**——B1–B6 全绿（冻结入件）＋ S3 绿（接口零改锁）∥ S1 / S2 / S4 红（新档不在盘：ENOENT / 断言红）。基线读数（冻结值）：
  - B1 `"→ probe_a\n\n→ nope\n\nDONE — review complete."` · chunks = think 占位 / tool→probe_a / tool→nope / think 占位 / text（坏参 JSON 无进度行）· 三结果回填 = A-OK ∥ invalid JSON ∥ unknown tool。
  - B2 `"Advisor: empty response — review was inconclusive"`。
  - B3 `"Advisor: interrupted."`（chatCalls 0）。
  - B4 `"Advisor: review timeout after 1s. …"`（结构化超时尾三段）。
  - B5a `"[Context compacted: 750 tokens → reducing to fit window]\nB5A done."`。
  - B5b `"[Context compacted: 1585 tokens → reducing to fit window]\n\nAdvisor: context window limit reached (1340 tokens). …"` ＋ 重写形态 23 条（system ∥ 压缩注 ∥ pinned ∥ 末 20）。
  - B6 提示恰 1 条（`~90% consumed (0.9s of 1s)`）＋ 返回串基线。
- **Phase B（拆分后）**：同件复跑 = **11/11 绿**；B 腿读数与 Phase A **逐字相等**（对拍判据成立——行为零回归）。
- S1 行数实读：loop **290** ∥ timeline **26** ∥ compaction **194**。

### 5.3 门读数（仓根 = thincoder/ · 全实跑）

| 门 | 命令 | 读数 |
|---|---|---|
| 语法 | `node --check` ×4（loop / timeline / compaction / 批内件） | 全 exit 0 |
| 批内件 | `node --test docs/batches/2026-10-05-advisor-loop-split.test.mjs` | 11/11 · fail 0 |
| 既有锁① | `node --test docs/batches/2026-10-05-subagent-zero-write-watchdog.test.mjs` | 9/9 · fail 0 |
| 既有锁② | `node --test docs/batches/2026-10-05-review-cross-talk.test.mjs` | 6/6 · fail 0（含 S2 四档回归子跑） |
| 锚 / 行宽 | `node scripts/doc-check.mjs --root .` | **exit 0**（悬空 0 · 行宽 0） |
| 接口骨架 | `node scripts/api-contract.mjs --root . --write` 后 `--check` | 零漂移（2914 条 · 642 档） |
| 提示词面引用 | `node scripts/prompt-refs-check.mjs` | J1/J2/J3 零命中 |

- 行数守限实读：loop 290 ∥ timeline 26 ∥ compaction 194 ∥ 批内件 255（全 ≤300）；`advisor-async.mjs` 499 零触 ∥ `run.mjs` 204 零改。

### 5.4 决策透明表（实施轮决断——全披露）

| # | 决断 | 依据 / 说明 |
|---|---|---|
| 1 | import 面「同名行追加」取行尾追加：`…, renderTimeline, compactContextIfNeeded,` | fix 块 ⑦ 只钉「同名行追加 + 行数不变」；取行尾为最简，块仍 5 行 |
| 2 | timeline.mjs 头注取 8 行形态（含 `@returns`）；实读 26 ≈ 设计估 ≈27（±1） | §2.3 骨架「仅头注与 jsdoc 措辞可微调」授权 |
| 3 | **枚举外坐标修复**：AGENT-PARAMS `:22` / `:31` / `:69` / `:89`（compaction.mjs:36 ⇒ :37） | 本批 compaction.mjs 头注 +1 行使该四行 compaction 侧坐标失真——属「随拆动须重锚」同性质；设计枚举按 loop.mjs grep 产出致结构性漏列；如实披露 |
| 4 | AGENT-LOOP-SUBAGENT `:562` 调用点「loop.mjs:128 ⇒ compaction.mjs:94」（compaction.mjs:55-83 ⇒ :56-84 同步） | `compactMessages` 调用点随切点 B 迁入 compaction.mjs——按 as-built 事实改指 |
| 5 | ADVISOR-GUARDS `:16` context_limit 生成点「loop.mjs:132 ⇒ compaction.mjs:98」＋ 表头注记四行重锚（as-of 2026-10-05） | fix 块 ⑧ 自身注「context_limit 生成点改本档」⇒ 表指向本档为设计内 |
| 6 | CORE-UNIFICATION 计数面 as-built 重算：`:1112` 落册义务消解注 ＋ `:1117` / `:1106` 待补 27 ⇒ **26**（拆后 290 <300 ⇒ 该档移出登记 ∕ 待补面） | §2.5 行 6「§2.8.1 行 26 ＋ 计数句——as-built = 实施轮回填」授权面内；依据 = 拆后读数 ＋ fix 块 ⑧ 基数勾稽式；若口径另裁 = 三处单点回退 |
| 7 | DOC-DISCIPLINE.md:466 **未触** | 登记面重锚标的不在盘（loop.mjs 全文 `§18` 零命中——更早批次已处置的残留）；见 §5.6 ③ |
| 8 | 批内件 B5 两腿用小窗 provider（`context: 1`）而非重消息构造 | §2.6 AC-4 明示「实施轮按成本择一」 |
| 9 | Phase A 读数探针件留 `.thincoder/tmp/` | 诊断件 · 工作树外豁免区（同区先例在盘）；不进仓 |

### 5.5 审计与代码评审轮次与终态

- **内部分歧审计（explore 子代理 · 1 轮 · 只读）**：代码 / 逐字 / 接口 / 行数面**零分歧**；2 项报告 = ① §5 未写（本节消解）；② DOC-DISCIPLINE:466 需父裁。附报「AGENT-PARAMS run.mjs re-export 谓词疑失真」= 既存（run.mjs 本批零改）→ 父侧路由。
- **内部代码评审（advisor · 轮 1 · 判定 pass）**：🔴 0 / 🟡 1 / 🔵 2——🟡 = 批内件 §5 引据悬空（本节消解）；🔵 = ① `compaction.mjs:13` 指针 `loop.mjs:11` 失位（本批头注 +1 所致——**已修** ⇒ `:12`）② `compaction.mjs:174-180` 悬空 jsdoc（存量、非本批引入——留待下次触碰）。
- **修复轮（1 轮）**：§5 落盘 ＋ `compaction.mjs:13` 指针修复；修复后复跑六门全绿（§5.3 读数为修复后终值）。
- **终态 = clean**（🔴 0 · must-fix 0；余项 = 报告面登记）。

### 5.6 披露（含范围外上报）

1. **枚举外改动**：AGENT-PARAMS 四行（§5.4 #3）；`API-CONTRACT.md` 生成区重生成吸收他批在盘未提交 desktop renderer 7 行坐标随动（生成器「整区替换」语义所致、非本批面改动）——报告父侧。
2. **批内件行数口径**：255 行（编辑器显示 256）——≤300 有界达成。
3. **DOC-DISCIPLINE.md:466**（`| thincoder-core/advisor/loop.mjs | 1 | :217 §18.7 |`）：本批 §2.5 坐标清单点名，但 loop.mjs 现全文 `§18` 零命中（grep 实读）⇒ 重锚标的不在盘（更早批次处置后登记面滞后）；**未触**，请父侧裁定（核销 ∕ 另路由）。（范围外）
4. **AGENT-PARAMS `:22` / `:89`「由 run.mjs:20 / :19 re-export」谓词疑失真**（run.mjs 现转口名单不含 `REVIEW_TIMEOUT_MS`；run.mjs 本批零改——既存面）：未触，父侧路由。（范围外）
5. **CORE-UNIFICATION 计数句 27 ⇒ 26**：依据 = 拆后 290 <300 ⇒ 该档移出「登记义务 ∕ 待补」面；回退面 = `:1106` / `:1112` / `:1117` 三处单点。

## §6 验证与收口（父代理）

**2026-10-05 22:5x · 收口**

**① 交付验证**：实施（`#13`）拆分 + 文档坐标面——**父侧亲跑**：批内件 **11/11**（双相位：Phase A 8/3 红=结构腿 → Phase B 11/11，B 腿读数逐字相等）∥ 既有锁两件 9/9 + 6/6 ∥ 合跑 **26/26** exit 0 ∥ `doc-check` **exit 0** ∥ `api-contract --write → --check` **零漂移（2914 条 · 642 档）**；实读抽核 = `loop.mjs:73`（切点 A 替换行）∥ 导入面（`:16-21`）∥ 三档行数（290 ∥ 26 ∥ 194）与设计终值逐条相符。

| 面 | 终值 | 核验读数 |
|---|---|---|
| 代码面 | `timeline.mjs` 新 26 ∥ `compaction.mjs` 175 → **194**（+`compactContextIfNeeded`）∥ `loop.mjs` **310 → 290** ∥ `panel-callbacks.mjs:229` 注释随迁（Δ0） | 父侧亲跑 11/11 ✓ |
| 批内件 | `docs/batches/2026-10-05-advisor-loop-split.test.mjs`（255 行 · B1–B6 ∥ S1–S4） | 双相位对拍（先红 8/3 → 绿 11/11）✓ |
| 文档坐标 | 9 档 as-built 重锚（21 处实读对内容全符）+ `API-CONTRACT.md` 重生成（2914 条零漂） | 实跑 ✓ |
| 守限 | 三档 ≤300（290 ∥ 26 ∥ 194）∥ `advisor-async.mjs` 499 零触 ∥ `run.mjs` 204 零改 | 实读 ✓ |

**② 集成场景**：零涉（advisor 内部结构面）。
**③ 仓套件读数**：三端跑器空清单绿灯 ×3（父侧亲跑 exit 0——本波统一读数）。
**④ 收口清单核验**：角色表六段齐 ✓ ∥ 状态行 = 已收口（close 落）∥ 计数（3 代码档 + 批内件 + 9 设计档 + `panel-callbacks` + `API-CONTRACT`）∥ 指针（§2.4 ∥ 子表行 26 ∥ KD 族）✓ ∥ 变更记录（各档随笔）✓ ∥ 待办勾销 = `#951` ∥ 前批遗留跨核 = 无 ∥ 台账面 = 核销行。
**⑤ 暂缓批复核**：无（两项范围外上报随 ⑥ 路由）。
**⑥ 债务与备忘**：① `DOC-DISCIPLINE.md:466` loop.mjs 登记行失位（更早批次滞后——无有效 as-built 锚；未触）+ ② `AGENT-PARAMS :22/:89`「run.mjs re-export」谓词疑失真 = **新账入册**（父侧路由：入册 / 就地收）；③ `compaction.mjs:174-180` 悬空 jsdoc = 存量 Accepted（下次触碰收）；④ 枚举外改动（AGENT-PARAMS 四行修复 + `API-CONTRACT.md` 生成区吸收他批在盘读数）= 如实披露在册。
**⑦ 收口判定**：验收全符（11/11 ∥ 26/26 ∥ 门全绿 ∥ 零漂）⇒ 本批**收口**（记录冻结）。
