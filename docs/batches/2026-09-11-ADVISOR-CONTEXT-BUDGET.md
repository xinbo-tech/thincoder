# 评审上下文预算跟随模型窗口（120K 硬编码修复）· 批次记录（2026-09-11）

> 六段 append-only，**一段一作者**：§1 讨论（主 agent）· §2 批次任务（eng-designer）·
> §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder 自写）· §6 验证与收口（父代理）。
> 编制：主 agent（工程模式）· 2026-09-11 13:20 · 来源 = 用户 13:18「**上下文窗口 120K 那个是 bug，应该是模型参数匹配错了，理论上现在用的模型都是 1M 的，你检查一下**」——快车道（用户报告 bug）。

---

## §1 讨论（主 agent 记）

### 需求来源

- 实况：第 15 批轮次 2 评审实例死于 `Advisor: context window limit reached (120225 tokens). Review incomplete — too many tool calls.`
- 用户 13:18 判定 = **模型参数匹配 bug**（现行模型均 1M 窗口）；父侧已检查并确认根因（见下）；
- 快车道开批（紧急 bug，单点全链不跳步）。

### 根因（父侧已实证）

| 面 | 事实 |
|---|---|
| 守卫 | `src/advisor/loop.mjs:117-124`——`currentTokens > MAX_CONTEXT_TOKENS * 0.8` → 压缩；压缩后仍 `> MAX_CONTEXT_TOKENS` → **判死**（`context window limit reached`） |
| 常量 | `src/advisor/compaction.mjs:19`——`export const MAX_CONTEXT_TOKENS = 120_000 // Reserve headroom to avoid OOM` |
| 模型 spec | `src/model-specs.mjs:33`——`deepseek-flash { context: 1_000_000 }`（1M ✓）；DEFAULT_SPEC = 128_000 |
| 吻合度 | 120225 > 120000 ✓ 与死亡文案逐字吻合——**120K 帽 = 128K 时代遗留**，1M 模型被限死 |
| 双端 | VSC 仓 batch 11 已拆出 `advisor/loop.mjs` + `advisor/compaction.mjs` 副本——**同款常量需核+同步**（双端纪律） |

### 本批条目（1 条——三方一致锚）

| # | 条目 | 内容 |
|---|---|---|
| **E1** | **评审上下文预算由模型窗口派生** | `MAX_CONTEXT_TOKENS` 硬编码 120K → **按模型 spec.context 派生**（含 headroom 策略：压缩阈值 / 判死线 / 未知模型回退 / OOM 论证）；双端（CLI + VSC）对齐 |

### 已核事实（供 designer 免重复勘察）

- 守卫链：`:117` 估算 → `:118` 压缩阈值（×0.8）→ `:120` `compactMessages` → `:121` 判死 → `:124` 文案（判定族前缀 `:76` = `context_limit`——**结算文案族消费面**）；
- 预算相关常量同族：`MAX_ADVISOR_TURNS` / `REVIEW_TIMEOUT_MS`（600s）/ `MAX_RESULT_CHARS`（`compaction.mjs:19-21` 一带——**只在 E1 范围内动 context 一项**）；
- 消费面：`estimateTokens` / `compactMessages`（`compaction.mjs`）——派生值须在同一模块内可达模型 spec（`model-specs.mjs` 的 `specFor`/`providerSpec`——勘察定接线面）；
- 注释「Reserve headroom to avoid OOM」= 设计动机——**新策略须正面回应**（1M 窗口下的内存/延迟代价论证）；
- 双端：VSC 副本是否存在同款常量——勘察逐处核。

### 范围边界（明确不做）

- 不动评审机制本体（轮次/超时/判定族语义零改）；不改模型 spec 数据（除必要新字段——须给理由）；
- 不碰他链在途档；**不得自行新建档**（必须新建 → 停下打回主 agent）。

### 待设计裁定

1. **派生策略选型**（≥2 候选）：`spec.context × 因子` vs `spec.context − 绝对预留` vs 混合——含**压缩阈值/判死线两档**、未知模型回退（DEFAULT_SPEC 128K）、**OOM 正面论证**；
2. 接线面（派生值从哪取：agent 配置 / providerSpec / 循环入口注入——选一给理由）；
3. **双端对位**（VSC 副本裁定：同源语义 / 各自实现）；
4. 受影响文件全清单（行数/增量）+ 用例/AC（逐条回指 E1——含「1M 模型不再于 120K 判死」的机验判据）；
5. 纪律核对（双端独立实现纪律 · 既有判定族测试锁零伤）。

### 状态

**已收口 2026-09-11**（用户 bug 报告 + 父侧实证）。下一步 = **设计**（spawn eng-designer）。

---

## §2 批次任务（eng-designer 自写）


**状态：任务书就绪**（2026-09-11——需求 §10 / 设计 §16 / 测试层已落档，待设计评审）。实施者 = eng-coder（设计 token 门）。本 §2 = coder 任务书本体（不另写副本）。

**落档位置**：需求 = `docs/requirements/ADVISOR-CONVERGENCE.md` §10（F27 / N19 + 边界与登记面）· 设计 = `docs/design/ADVISOR-CONVERGENCE.md` §16（16.1 问题陈述 / 16.2 选型对比 / 16.3 契约 / 16.4 OOM 论证 / 16.5 受影响文件 / 16.6 决策记录 / 16.7 纪律核对 / 16.8 登记项 / 16.9 用例表 / 16.10 验收标准 / 16.11 边界）· 来源 = 本档 §1（条目 E1）。

### 本批条目（三方一致锚：§2 本批条目 = 设计 AC 回指 = 需求条目）

| # | 条目（= §1 E1） | 需求 | 设计契约 | AC |
|---|---|---|---|---|
| E1 | 评审上下文预算由模型窗口派生（120K 硬编码退场） | F27（+ N19 零回归） | §16.3：`CONTEXT_LIMIT_RATIO = 0.8`；`advisorContextBudget(provider)` → `{ limit: floor(窗口 × 0.8), compactAt: floor(limit × 0.8) }`；窗口 = `providerSpec` | AC-CB1–AC-CB5 |

### 五问裁定（§1 待设计裁定逐条）

1. **派生策略** = **比例式**（判死线 = 窗口 × 0.8；压缩触发 = 判死线 × 0.8——两档分开命名、关系保持）；未知模型回退 `DEFAULT_SPEC`（128K → 判死线 102_400 / 触发 81_920）；**OOM 正面论证**见设计 §16.4（内存量级 ≲ 20-30MB 非约束；真内存边界 = `MAX_RESULT_CHARS` + 压缩后「最近 20 条」有界集；头寸真实用途 = `chars/4` 估算误差（CJK 低估 3-4×）+ 响应/协议空间；服务端窗口仍是最终兜底）。选定理由与否决项见 §16.2 表 1。
2. **接线面** = `providerSpec(provider)`（循环内派生）——循环已持 provider（即评审真实 provider）且已有同源消费点（`loop.mjs:204`）；自动跟随 provider 级 `context` 覆盖。否决：agent 配置项（与 `providers[].context` 双源 footgun）· 入口注入（重复派生 + 签名扰动）——§16.2 表 2。
3. **双端对位** = 语义同源、各端独立实现、不做 byte-identical；**CLI 本批交付**，VSC 镜像**父侧排程**（同款缺陷实测确认存在：`thincoder-vscode/src/advisor/compaction.mjs:18` + `loop.mjs:22/116/121`；VSC 档不在本设计者写域——见下「需父侧排程」）。
4. **受影响文件 + 用例/AC** = 设计 §16.5 / §16.9 / §16.10；核心机验判据 = T-CB2（1M 模型 ~175K tokens **不再**以 `context_limit` 收尾）+ T-CB3（128K / 未知模型同量上下文仍以截断尾收尾）+ T-CB4（provider 级 `context` 覆盖双向翻转判定）。
5. **纪律核对** = 设计 §16.7（判定族六 kind / 六条尾文案 / 提示词零改；既有 `advisor-chain-guards` 21 例 + `advisor-sync-accounting` 6 例锁零伤；D2：窗口语义只引用 `PROVIDER.md` §15 不重述）。

### 实施面（eng-coder 写域——3 项：2 改 + 1 新）

| # | 文件 | 当前行数 | 动作 | 预计增量 | 档位 |
|---|---|---|---|---|---|
| 1 | `src/advisor/compaction.mjs` | 158 | 改：`MAX_CONTEXT_TOKENS` 退场 + `CONTEXT_LIMIT_RATIO` / `COMPACT_TRIGGER_RATIO` + `advisorContextBudget` 纯函数 + `providerSpec` 导入 | +~15 | 交付 ~173 ≤300 |
| 2 | `src/advisor/loop.mjs` | 291 | 改：导入换名 + 循环体外一次性 `const budget = advisorContextBudget(provider)` + 两处消费 `budget.compactAt` / `budget.limit` | +1~3 | 交付 ~294 ≤300（贴线——越 300 按设计 §16.5 注记处置，不硬压行） |
| 3 | `test/advisor-context-budget.test.mjs` | 新 | 新增（T-CB1–T-CB6；CLI `test/*.test.mjs` glob 自动发现——零注册） | ~130 | 新档 ≤500 |

**零改面（逐字保全——验收拒收项）**：判定族六 kind 与六条尾文案（`compaction.mjs:75-99` 族表 + `loop.mjs:103/113/124/176/187` 生成点）/ `compactMessages` 裁剪规则 / `estimateTokens` 估算式 / `MAX_RESULT_CHARS` / `agent.advisor.timeoutMs` 语义 / 提示词与 VSC 仓（`git status` 判据）。

### 验收标准（机判——设计 §16.10 逐条）

- AC-CB1 派生与两档（T-CB1 五组 `{limit, compactAt}` 数对逐断言）
- AC-CB2 核心缺陷闭合（T-CB2 + T-CB3——「1M 不再于 ~120K 判死」的机验判据 + 机械线不失效对照）
- AC-CB3 接线面 = `providerSpec`（T-CB4——provider 级覆盖双向生效）
- AC-CB4 零回归（T-CB5 + 既有两档全绿 + `node test/run-fast.mjs` 全绿；`src/prompts/**` 与 VSC 仓零改动）
- AC-CB5 文档-实现一致（T-CB6 静态锚 + `node scripts/check-doc-width.mjs` 新增违规 0）

### 明确出批（本批不做）

- 不改服务端窗口 / tpm 闸门；不改 `estimateTokens` 估算器（CJK 低估——登记设计 §16.8 #2，另批）
- 不新增 advisor 专用配置项（设计 D-CB3）；不改 `AGENT-PARAMS.md` / `CONTEXT-COMPACTION.md` / `PROVIDER.md`
- 不为 VSC 端写实现或文档（登记——见下）；不碰 `docs/TODO.md` / README / CHANGELOG（父侧写域）；不碰他链在途档
- 零 UI 面（无 TUI / VSC 显示改动；无 `open` 项）

### 需父侧排程（本设计者写域外——未写）

| # | 所需档 / 面 | 用途 | 最小改动面 |
|---|---|---|---|
| 1 | VSC 仓 `src/advisor/compaction.mjs` | VSC 镜像：同款常量退场 + 派生纯函数 | 同本端（+~15 行；`providerSpec` 经 `src/specs.mjs` 现成） |
| 2 | VSC 仓 `src/advisor/loop.mjs` | VSC 镜像：导入换名 + 两处守卫改消费派生值 | +1~3 行（:116 / :121） |
| 3 | VSC 仓 `test/`（新用例档 + `test/files.mjs` 登记） | VSC 对位用例（T-CB1–T-CB6 同型） | 新档 + 清单 1 行（VSC 为显式清单，非 glob） |
| 4 | VSC 仓 `docs/design/ADVISOR-CONVERGENCE.md` §15（新增节） | VSC 设计档落档（三层 + 变更记录 1 行） | 新节——VSC 档不在本设计者写域 |
| 5 | `docs/TODO.md` 需求池行 | 本批来源 = 用户 bug 报告——池台账登记 + 状态推进 | 1 行指针（`ENGINEERING-MODE.md` §1.13 形态） |

### 未确认面（如实登记）

- §14.3 表中 `context_limit` 生成点行号（`loop.mjs:124`）随本批落笔可能 +1~3 位移——行号 = as-of 参考（D4），节内容零改、父侧收口并入（设计 §16.8 #3）
- 128K 档线位自 120K 降至 102.4K（比例式的必然结果——设计 D-CB6 已论证采纳：现状 93.75% 窗占比对估算误差/响应空间无头寸）；如用户不接受小窗线位下降，是**唯一需用户裁定**的点（其余均为比例式的直接后果）

### 修正轮同步（2026-09-11——设计评审轮次 1 后；本追加与上文本冲突时以本追加为准）

**背景**：设计评审（轮次 1）**pass**（🔴 0 · 🟡 0 · 🔵 6——发现表见 §3）。父侧裁定：本设计者面只落 **3 条** 🔵——**#1 行数口径 · #2 T-CB2 数字 · #4 措辞消歧**；#3 归父侧 §4 面、#5/#6 归 coder 交付面——本修正轮均不碰。本轮 = **修正轮**（只改文档、不碰实现）。

**映射表（评审 # → 落点）**

| 评审 # | 级别 | 处置 | 落点 |
|---|---|---|---|
| #1 | 🔵 | Fixed——文档域行数改「批次前 → 落档后」双值（239 → **279** / 1045 → **1242**——设计档含本修正轮 +1 行） | 设计档 §16.5 文档域表 |
| #2 | 🔵 | Fixed——T-CB2 按夹具算术落定 **~197K**（64K = 64 × 1024 = `MAX_RESULT_CHARS`；`chars/4` ⇒ 12 × 64K ÷ 4 = 196,608）；T-CB5 同步 **~737K**（45 × 64K ÷ 4 = 737,280——原 720K 系 64,000 口径残值） | 设计档 §16.9（T-CB2 / T-CB5）· §16.10（AC-CB2）· 需求档 §10 F27 判定句（同短语残留点） |
| #4 | 🔵 | Fixed——统一为「loop.mjs 函数体内、while 轮次外一次性派生（与「循环入口注入」对举）」 | 设计档 §16.2 表 2 #1 · D-CB2（同短语残留点）· 本档上文两处（见下） |

> **数字口径（#2——「二选一」裁定）**：取 **64 × 1024 = 65,536** 口径（= `MAX_RESULT_CHARS` 代码常量；夹具按满长截断工具结果计）。
> 复算：12 × 64K ÷ 4 = 196,608 ≈ **~197K**；45 × 64K ÷ 4 = 737,280 ≈ **~737K**。
> 跨端一致：VSC 镜像档（`thincoder-vscode/docs/design/ADVISOR-CONVERGENCE.md` :1124 / :1127 / :1138）记 ~19.7 万 / ~73.7 万——同值，本端与之对齐（VSC 批档 `2026-09-11-ADVISOR-BUDGET-VSC-MIRROR.md` 一致性对照项：「VSC 侧复算自洽」「父侧修正落后侧标签」）。
> **197K 仍 > 旧帽 120K、< 新触发 640K——叙述零改。**
>
> **行数说明（#1）**：设计档 1241 = 修正轮落笔前实测；本修正轮变更记录 +1 行 → 落档后终值 **1242**（§14.7 / §13.6 先例：「现态」= 修正轮落地后实测）。
> 需求档 **279** = §10 落档时总行数（新增 40 行；其后 §11 属第 23 批——现总 294——本行只记本批 §10 口径）。

**本档上文本同步声明**（与上文本冲突时以本块为准）：

- 五问 #2（上文）「`providerSpec(provider)`（循环内派生）」→ 统一措辞「loop.mjs 函数体内、while 轮次外一次性派生（与「循环入口注入」对举）」；
- 实施面 #2（上文）「循环体外一次性 `const budget = …`」→ 同上统一措辞（loop.mjs 函数体内、while 轮次外一次性派生）；
- 验收标准节（上文）「核心机验判据 = T-CB2（1M 模型 ~175K tokens…）」→ **~197K**（#2 同口径）。

## §3 设计评审（评审子代理自写）

_（待写——评审子代理）_

### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 受影响文件标注（行数口径） | 🔵 | §16.5 文档域两行标「当前行数」= 239 / 1045 且变更栏注「**已落**」——实为落档前基线：现盘需求档正文至 L279（§10 = L240–279 共 40 行，239+40=279）；设计档工具读数 `1241 lines total`（1045 + §16 全节 195 行 + 变更记录 1 行 = 1241）。与 §14.7「批次前 → 交付态」先例口径不一致，易被读成现状（`thincoder/docs/design/ADVISOR-CONVERGENCE.md:1142-1143`）。 | 按 §14.7 口径改为「批次前 → 落档后」双值（239→279 / 1045→1241）或直接刷新为落档后值；纯 .md 豁免标注要求，此项属数字漂移口径自洽（R7c），非阻断。 |
| 2 | 验收/用例数字口径 | 🔵 | T-CB2 标「~175K tokens（12 × 64K 字符工具结果）」——按 §16.4 #4 自载 `chars/4` 口径复算 = ~192K（64K=64_000）/ ~197K（64K=65_536）；同口径下 T-CB5「~720K（45 × 64K）」恰合 720K——两处口径不一致，「~175K」无夹具算术支撑（差 ~9–11%）。不影响回归锁性质（192K 仍 > 旧帽 120K、< 新触发 640K），但机验叙事带悬空数（`:1200` / `:1203` / `:1120`）。 | T-CB2 按夹具算术落定标注（~192K）或调整夹具条数使描述自洽；两处统一 64K 字符口径说明。 |
| 3 | 决策记录 / 用户告知面 | 🔵 | D-CB6（128K 线位 120K → 102.4K）**无异议**——论证成立（93.75% 窗占比无头寸）。告知面建议补全：比例式**两档联动**下移——触发 96K（= 120K×0.8，旧比较式）→ 81.92K、判死 120K → 102.4K；「消息数 ≤20、裁剪无可回收」形态下估算落在 (102.4K, 120K] 的 128K 评审由旧制存活翻为判死。批次 §2 未确认面已如实登记、拟 §4 告知——无异议，仅建议告知含触发档与翻转带（`:1157` / `:1040` / `:1097`；批次档 `:119`）。 | §4 告知补一句「压缩触发时点同步下移（96K→81.92K）」与翻转带范围；其余维持。 |
| 4 | 清晰度（术语） | 🔵 | 同一落点两处措辞并存：「循环内派生」（§16.2 表 2 #1 `:1071`；批次 §2 五问 #2 `:76`）vs「循环体外一次性」（§16.3 `:1108`；批次 §2 实施面 #2 `:86`）——实施者可读成 per-turn 与一次性两种落点（功能等价但易误读；「循环内」实为与「入口注入」对举之义）。 | 统一为「loop.mjs 函数体内、while 轮次外一次性派生」（§16.2 #1 加一词消歧；批次 §2 两处同步）。 |
| 5 | 证据边界（非缺陷） | 🔵 | 本轮按对象声明受限阅读：设计引用的源码/测试事实——`providerSpec` 位置与 `../config.mjs` 同源导入（`:1077`）、`loop.mjs:204` 同源消费点（`:1052-1053`）、`seams.chat` 既有测试缝（`:1145-1146`）、既有 21+6 锁用例计数（`:1213`）、源码行数 158/291（`:1134-1135`）——未独立复核（unverified）。设计文本内部与需求 §10 / 批次 §2 三处交叉一致；机验兜底 = AC-CB1–AC-CB5。 | 无需设计变更；父侧如需更高置信可在写域内抽查 2–3 个 as-of file:line，或留待实施面首跑验证。 |
| 6 | 零回归证据（实施顺序） | 🔵 | 「既有锁零伤」目前为预期而非实测：既有 21+6 用例夹具量级未逐例对照**移动带**（触发 96K→81.92K / 判死 120K→102.4K）——若含贴旧线的边界夹具（如 128K 模型在 ~110K 估算下断言存活），期望将翻转；AC-CB4「全绿」（`:1213`）是唯一机验兜底，节内未声明「零用例修改」约束（§16.7 仅登记行号指针漂移，`:1171`）。 | §5 实施记录显式附既有两档**原样**全绿输出（零用例修改）为零伤证据；若确需改既有用例，先上报父侧裁定（防静默改锁）。 |

（引用路径：`thincoder/docs/design/ADVISOR-CONVERGENCE.md` 与 `thincoder/docs/batches/2026-09-11-ADVISOR-CONTEXT-BUDGET.md` 的行号缩写。）

计数：🔴 0 · 🟡 0 · 🔵 6

VERDICT: pass

## §4 用户批准（主 agent 记）

**2026-09-11 18:25 父侧代签**——用户 12:48 授权（13:38 延展至排空）；三条件齐备：轮次 1 **pass**（🔴0 · 🟡0 · 🔵6）→ 修正轮（🔵 #1/#2/#4 + 两处枚举外落点）落地经父侧实文核验 ✓（行数双值 239→279 / 1045→1242 · T-CB2 **~197K** / T-CB5 **~737K**（64×1024 口径——**与 VSC 跨端一致**，父侧认）· 措辞消歧）→ **token 已签发**（值不落档）。

**批准范围**：3 档（`src/advisor/compaction.mjs` · `src/advisor/loop.mjs` · 新测档 `test/advisor-context-budget.test.mjs`）。

**遗留（批准时登记）**：① **128K 档线位 120K → 102.4K**（比例式必然——§4 告知：**含触发档同步下移 96K→81.92K + 翻转带 (102.4K, 120K]**）；② 源码 as-of 未独立复核（🔵 #5）与既有 21+6 锁零伤证据（🔵 #6）——**入 coder 交付面**（原样全绿输出；需改先报）；③ commit 待父侧。

## §5 实施记录（eng-coder 自写）

_（待写——eng-coder）_

**状态：交付完成——终态 `clean`**（2026-09-11；实施者 = eng-coder；内部协议 = explore 偏差审计 1 轮 clean + advisor 代码评审 1 轮 pass；fix round 0/5）。

### 交付摘要（写域 = 批准范围，零外溢）

| # | 文件 | 批次前 → 交付（实测） | 动作 |
|---|---|---|---|
| 1 | `src/advisor/compaction.mjs` | 158 → **171** | `MAX_CONTEXT_TOKENS` 退场 + `CONTEXT_LIMIT_RATIO`（导出）/ `COMPACT_TRIGGER_RATIO`（私有）+ `advisorContextBudget(provider)` 纯函数 + `providerSpec` 自 `../config.mjs` 导入 |
| 2 | `src/advisor/loop.mjs` | 291 → **294** | 导入换名（`MAX_CONTEXT_TOKENS` → `advisorContextBudget`）+ 函数体内 while 轮次外一次性 `const budget = advisorContextBudget(provider)` + 两处消费（`budget.compactAt` / `budget.limit`） |
| 3 | `test/advisor-context-budget.test.mjs` | 新 → **101** | T-CB1–T-CB6 |

**零改面逐字保全（回读核对 + diff 核对）**：判定族六 kind 与六条尾文案 / `compactMessages` 裁剪规则 / `estimateTokens` 估算式 / `MAX_RESULT_CHARS` / `MAX_ADVISOR_TURNS` / `agent.advisor.timeoutMs` 语义 / 提示词面与 VSC 仓（零改动）。

### 决策透明表（AC-CB1–AC-CB5）

| AC | 状态 | 机验证据 |
|---|---|---|
| AC-CB1 派生与两档 | ✅ | T-CB1：五组 `{limit, compactAt}` 逐断言（1M → 800_000/640_000 · 128K → 102_400/81_920 · 未知 → 同回退值 · `context:64` → 52_428/41_942 · `null` → 回退不抛）；纯函数面 = 重复调用同值 + 入参零突变 |
| AC-CB2 核心缺陷闭合 | ✅ | T-CB2（1M + 196_608 tokens 不判死 + 终稿在位 + marker null）+ T-CB3（128K / 未知模型同量 → 尾块 `Advisor: context window limit reached (196608 tokens)` + marker `context_limit`）+ 反向控制（HEAD 版同夹具实测判死——见下） |
| AC-CB3 接线面 = providerSpec | ✅ | T-CB4：同量上下文 × `context:64`（收紧）→ 判死；× `context:1024`（放宽）→ 不判死——双向翻转，证 provider 级覆盖生效（而非模型名单源） |
| AC-CB4 零回归 | ✅（附存量说明） | T-CB5 绿；既有 `advisor-chain-guards` 21/21 + `advisor-sync-accounting` 6/6 **原样全绿（零用例修改）**；快层 `npm test` 469 例 = pass 455 / fail 2（两失败为他批在途——见「偏差」）；`src/prompts/**` 与 VSC 仓零改动 |
| AC-CB5 文档-实现一致 | ✅ | T-CB6：旧 OOM 注释零残留 + `MAX_CONTEXT_TOKENS` 在 `src/` 递归扫描零命中 + 循环三串消费在位；`check-doc-width` 本批新增违规 0（宽度与一致性存量全属他批） |

### 测试实测值

- 新档：`node --test test/advisor-context-budget.test.mjs` → **tests 6 / pass 6 / fail 0**（最重者 T-CB6 65ms；整档 298ms——无 slow 归册需求）。
- 既有锁档（原样跑，零用例修改）：`advisor-chain-guards` → tests 21 / pass 21 / fail 0；`advisor-sync-accounting` → tests 6 / pass 6 / fail 0。
- 快层：`npm test` → tests 469 / pass 455 / fail 2 / skipped 12；两失败 = `doc-consistency` T41①（新增 V1/V2 违规落在 `docs/batches/2026-09-11-PORTABILITY.md`、`docs/batches/2026-09-11-TUI-SELECTION.md`）与 `eng-designer-role` T40（ENGINEERING-MODE.md 文案锚）——他批在途所致，与本批零因果（本批未碰 docs / prompts）。
- 反向控制（fail-when-unfixed 实证）：临时恢复 HEAD 版两源档后以同夹具（1M 模型 + 196_608 tokens）跑循环 → 实测 `判死=true · marker=context_limit · Advisor: context window limit reached (196608 tokens)`；恢复交付版后新档复跑全绿。

### 审计与代码评审（内部交付协议）

- explore 偏差审计：1 轮 → **clean**（四类偏差零命中：契约逐字、六用例 1:1、零改面、零清单外改动均证）。
- 内部 advisor 代码评审：1 轮 → **pass**（🔴 0 · 🟡 0 · 🔵 2，两条均标「无需动作/非缺陷」）。
- fix round：0/5（无待修发现）；终态 = **clean**。

### 偏差与如实登记

- 行数估算差（非削减）：设计 §16.5 预计 compaction ~173 / 新测档 ~130；实测 171 / 101——六用例与全部列明断言齐备，差在估算口径。
- as-of 指针漂移（设计 §16.8 #3 已预先指派父侧）：`context_limit` 生成点现为 `loop.mjs:127`（设计 §14.3 表引 :124）；前缀表 `context_limit` 条目现为 `compaction.mjs:89`（设计 §16.1 引 :76）——节内容零改，仅行号 as-of 口径。
- 临时物：实施中创建的备份 / 日志文件（`tmp-cb-*.new`、`logs-*.txt`）已全部删除；`git status` 中其余改动为他批在途产物，非本批。
- 128K 档线位下移（判死 120K → 102.4K，触发 96K → 81.92K）为比例式必然结果，已在设计 D-CB6 与批次档 §4 告知范围（含翻转带 (102.4K, 120K]）。

## §6 验证与收口（父代理自写）

**2026-09-11 20:15 父侧收口**（用户授权窗口 12:48→排空）。

### 父侧验证

- **新档 6/6 绿**；既有两锁**原样全绿**（chain-guards 21/21 · sync-accounting 6/6——零用例修改）；快层 **469/455/12skip/2 fail**（2 fail = 他批在途——本批零因果）；
- **父侧抽核**：`compaction.mjs` 170 行/常量零残留/系数导出 ✓ · `loop.mjs` 293/budget 两处消费 ✓ · 测档 100 行/6 例 ✓；
- **反向控制**（fail-when-unfixed）已验：HEAD 版同夹具实测判死 ✓——判定族/尾文案/压缩本体/`timeoutMs` 零改（git diff 仅 3 档）。

### 逐条验收结论

- **AC-CB1–AC-CB5 全过**（含 T-CB6 零残留/三串消费）+ 反向控制证据；**Simplified 零 · Not done 零**；
- 偏差 4 条如实（行数差非削减 · as-of 指针漂移（已指派父侧）· 临时物已清 · 未 commit）。

### 需求池核销

- 无池行（本批为设计/镜像面自行排程）✓。

### 核销同步清单

- 角色表：无 ✓ · 状态行：§5 终态 clean ✓ · 计数：行数/用例数对表（差为预估偏差）✓ · 指针：需求 ↔ 设计 §16 ↔ 用例 ✓ · 变更记录：各档 ✓ · 待办：两处 as-of 指针漂移登记 ✓

### 遗留项

1. **两处 as-of 指针漂移**（设计档 §14.3 引 :124 → 实 :127 · §16.1 引 :76 → 实 :89）——登记设计者文档任务（下一次文档轮随批）；
2. 快层 2 fail（T40/T41——他链）与残留项归其批；
3. **设计 token 已消费（链终）**；commit 待父侧随批提交。
