# 2026-10-10 · agent-loop-allotment
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-10 · 来源 = 用户 2026-10-10 03:49「不认自设条件——等条件的一起拿出来清理」+ 清账二遍 = 核·agent-loop/台账面 2 条（#1100 声明源保底名额 ∥ #1106 manifest 写盘通道）。
> 台账 = #1100（core · 归批）。前情 = docs/batches/2026-10-10-ledger-full-triage.md（已收口 2026-10-10 · 清账二遍）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-10
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**状态行**：🔄 进行中（设计轮已发）

**直令**：用户 2026-10-10 03:49 清账二遍令——本批 = 核·agent-loop/台账面 2 条；授权 = 会话全自动沿用。

**条目（2）**：
- `#1100`：文档注入·声明源保底名额（用户 2026-10-08 16:17 原话在册）——需求已落档 `docs/core/requirements/AGENT-LOOP.md` §4.17（F-DI1–F-DI3 / N1–N3：本仓 5 保持 + 声明源 +5；无声明源逐字零变化）；设计 → 实施。
- `#1106`：`agent-tools/manifest.mjs` 经 `writeManifest` 直写不入 mutation 通道（`FILE_MUTATORS`/`_touchedFiles`/mutation-seq/peer 写重叠面）——「登记通道 ∥ 明文豁免」裁定 + 落地。

**边界**：`thincoder-core/agent/**` ∥ `agent-tools/**` ∥ `agent/setup.mjs` ∥ 对应设计/需求档行；不触他批。

**授权口径**：会话全自动（03:07「全自动」+ 03:49 清账二遍令）——设计 → 评审（用户点火）→ 批准 → 实施。

**父侧办结（2026-10-10）**：① 裁定两枚 ✓（#1100 = `origins` 参 + 双腿分取；#1106 = 明文豁免——依据逐条在 §2）；② 设计档落笔（R1-4/R2-1：`AGENT-LOOP.md:263` + D-AL27 ∥ `MEMORY.md:737` ∥ `MANIFEST.md` §2.10 + KD-M1-41）= 随实施臂同拍（回填轮先例）；③ 上抛①（`manifest read`/`settings list|get` readonly:false → verify 失效链）→ 登记台账 `#1178`；④ 上抛② 零动 ✓（F-DI3 明示保持）。

**父裁（2026-10-10 · 评审 #80 pass 回执）**：2 🟡 ∥ 4 🔵 逐条——F1（T 表缺失/T4 无期望句、AC 未映射）⇒ 补 T 表 + T4 挂验收对照；T2 补 `origins` 三态格（缺省/单元素/空数组）∥ F2（设计档落笔待派单 vs §1 随实施臂同拍）⇒ **R1-4/R2-1 随本轮回填**（落笔先于或同拍产品码）∥ F3（F-DI3 解读未确认）⇒ 括注即确认（「路径已在块形内——保持」= 需求自述；落档一句引用）∥ F4 墙钟改述 ∥ F5 坐标补全路径 ∥ F6 解除条件③具名实例（`manifest write` 改 `index.publicRepos`/`codePaths` ⇒ 直改 #1100 origin 集）各随正。**实施派工 = eng-coder #88**；产物回后进 §6。

## §2 批次任务与设计（eng-designer）
**状态行**：✅ 设计完成 2026-10-10（2 条全覆；设计档落笔待派单——本轮明令零触）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**本批条目（覆盖 2/2 —— `#1100` ∥ `#1106`）**

| # | 条目 | 类 | 需求锚（本席核讫） | 落地形态 |
|---|---|---|---|---|
| #1100 | 文档注入·声明源保底名额（本仓 5 保持 + 声明源 +5） | requirement | `docs/core/requirements/AGENT-LOOP.md` §4.17（`:326-338`——F-DI1–F-DI3 / N1–N3 已落档） | 核码两档（注入点分腿 ∥ 检索接口可选参）+ 设计档落笔 |
| #1106 | manifest 写盘不入 mutation 台账通道（登记或豁免二择一） | tech_todo | `docs/core/design/MANIFEST.md` §2.10（`:585-628`——工具面在册；上抛原文 = `docs/batches/2026-10-08-manifest-agent-tool.md:156`） | 裁定 = **明文豁免** ⇒ 设计档落笔（零码面） |

**需求合规核对（本席核讫——需求档笔归主 agent，本席零写）**：§4.17 五要素齐（总体需求句 ∥ F-DI1–F-DI3 ∥ 边界 ∥ N1–N3 ∥ 依赖在上述行内）；判据句均可机判、可直接设计；`#1106` 为技术待办（判据 = 二择一裁定 + 落地；解除窗口随裁定落档）。**无缺口 · 无矛盾 ⇒ 无驳回项**。

**关键裁定 ①（`#1100` 配额实现式）= 检索接口增可选 `origins` 覆盖参 + 注入点双腿分取（本仓腿在先 ∥ 声明腿补位）**

- 现行（现读）：`thincoder-core/agent/setup.mjs:112-133` 单调用 `docSearch(memory, input, { limit: DOC_SEARCH_LIMIT })`（`:113`；常量 `:27` = 5）；检索内部 origin 集 = `searchOrigins(memory)` = 项目 origin ∪ 声明公共仓 origin（`memory/code-search.mjs:19-24`）——**全局 top-5 无来源配额**（需求病灶本体）。
- 选形：① `docSearch` 增可选参 `origins`（缺省 `null` ⇒ 现行为 `searchOrigins(memory)` 逐字；给定 ⇒ 以其为 origin 集；空数组 ⇒ 保持现「不过滤」语义——本设计调用方不产此形）；② 注入点：`searchOrigins` 结果 `length <= 1`（无声明源）⇒ **原单调用路径逐字保留**；`> 1` ⇒ 双腿——本仓腿 `origins: [normalizeOrigin(memory.codeOrigin)]` ∥ 声明腿 `origins: 集 − 本仓`，各用 `DOC_SEARCH_LIMIT`（5），`Promise.all` 并行；合并序 = 本仓 ≤5 在前 + 声明 ≤5 补位（两腿 origin 集互斥 ⇒ 行不可能重复，无需去重）。
- 理由：a) **保底语义可达**——任何单次调用的全局排序在**有界候选池**下都不能保证「任一侧 top-5 齐」（池全被一侧占据即另一侧不可达——`memory/docs.mjs:122`/`:145` 候选池 `max(limit*4,20)` 有界）；两腿 = 各自独立 top-5，语义直配 F-DI1。b) **边界零越**（F-DI2 逐字「不改检索排序 / origin 归一 / 声明解析」）：三处均零改——受限集仍走既有 SQL 形（单 origin 等值 ∥ 多 origin `IN(…)` 分趟——`memory/docs.mjs:113-115`/`:146-153`），无新排序面；`declaredPublicRoots` 经 `searchOrigins` 复用（`code-search.mjs:22`）。c) 无配置开关（F-DI1 边界）。d) 并行 ⇒ 墙钟 ≈ 两腿之 max（分块物化——跨 await 无未决游标，`memory/scan.mjs:159-175`；`_docEmbedLock` 单飞保 ensure 面不重复，`docs.mjs:178-183`）。
- 被否候选：◎**单次调用后客户端按 origin 切分**——`docSearch` 返回行不含 origin 字段且路径为相对形可重名（`docs.mjs:161-174`），不可判源；且全局 top-N 不保任一侧 5 项齐（保底不可达）。◎**配额下沉进 `docSearch`（内部分腿返回分组）**——注入块策略混入记忆层机制面，且工具面语义连带风险（F-DI3 边界）。◎**加大候选池单调用后分组取 5+5**——池有界，需求「任一侧 5」在库规模下无上界保证。◎**共享查询向量形（`docSearch` 另收 queryVec）**——为省一次短文本嵌入新增持久接口面；先按 R1-3 登记成本，复测越线再另裁。
- 成本披露（登记面——R1-3 落档）：声明源会话每回合查询向量计算 1 ⇒ 2 次（两腿各一；并行 ⇒ 墙钟近 1 次量级）。

**关键裁定 ②（`#1106` 二择一）= 明文豁免（写进设计档 `MANIFEST.md` §2.10 邻）——不登记通道**

- 裁定判据 = 一致性 vs 成本。
- 成本面（登记通道不可行——三形逐否）：a) **裸加名**（`manifest` 进 `FILE_MUTATORS`，`agent/helpers.mjs:86`）——该集判据 = 工具名 + **args 取路径**（`toolTouchPaths` 无钩子 ⇒ `[args.path]`——`:104-117`）；manifest 写目标 ≠ args（目标 = `<项目根>/PROJECT-MANIFEST.json`，解析在 execute 内——`agent-tools/manifest.mjs:137-161`）⇒ 路径取出 `[undefined]` ⇒ 工程模式父门对「非字符串目标」**保守拒**（`agent/dispatch.mjs:110-111`）——**每个 manifest 调用（含 read）在无活设计槽时被拒** = 行为回归，非修复。b) **加 `touchedPaths` 钩子**——钩子契约只收 `args`、无 ctx（`helpers.mjs:104-117`）；相对目标解析基（`ctx.agent.cwd ?? ctx.cwd ?? process.cwd()`）与 `projectRootView` 落点分支（`agent-tools/manifest.mjs:137-144`/`:157-161`）钩子拿不到 ⇒ 要么猜错基（VSC/桌面进程 cwd ≠ 会话锚），要么复刻 KD-M1-39 落点判据（判据双源——模块铁律本身禁止）；且改钩子契约 = 动四消费面（门禁 ∥ 记账 ∥ L3 ∥ 作用域规则）公共谓词（`docs/core/design/TOOLS.md` §6.17 十点表）——单工具收益换通道级变更。c) **工具内自记账**（execute 成功后直写 `_touchedFiles` / 调 `noteMutations`）——违反「唯一记账点」纪律（`agent/dispatch-gates.mjs:136-148`）；peer 面按 (tool, args) 取路径（`peer-domains.mjs:79-91`），工具侧同样接不上。另：即便补钩子，还需先裁定 `PROJECT-MANIFEST.json` 自身的门禁分类（现盘未定）——又一面。
- 一致性面（豁免成立）：通道语义以**代码变更为轴**（`advisor/repos.mjs:113` 注「工具表外之变更按代码保守」；`record-results.mjs:80-90` 失效链），成员历来**枚举制**（L3 = `FILE_MUTATORS ∪ file_ops`——`peer-domains.mjs:42`）；`manifest` 与 `settings` / `memory` / `ledger` / `batch` 同类（非文件编辑工具；batch 另有端注入缝先例——`agent-tools/batch.mjs:25-27`/`:57-62`）——「不在通道」非缺陷，缺的只是一行**显式在档**（防下轮再次当缺陷发现）。
- 落地 = R2-1（§2.10 新增「变更记账面（KD-M1-41——豁免）」段：四面点名 + 理由 + **解除条件**：多实例并发改同一 manifest 实证 ∥ 审计清单完备性成为验收项 ∥ 该面触碰需求出现 ⇒ 另批走通道级扩展——先扩谓词契约、禁裸加名）。**零码面**（R2-2）。
- 被否备选 = 登记通道三形（见上成本面 a/b/c）；如 §3 评审 ∥ §4 改判为登记 ⇒ 本席出修正轮（目标面 = 谓词契约扩展 + 四项登记面逐一裁定——成本清单即上文）。

**逐条落地表 ①（`#1100`）**

| # | 动作 | 目标（现读 file:line） | 期望 | 机检法 |
|---|---|---|---|---|
| R1-1 | `docSearch` 增可选参 `origins` | `thincoder-core/memory/docs.mjs:108`（签名）· 取值点 `:113-115` | 缺省 `null` ⇒ 现行为逐字；给定 ⇒ 结果限该集（复用既有单/多 origin SQL 形）；空数组 ⇒ 现「不过滤」语义 | T2（双 origin 差分：`origins:[A]` 只出 A 行）；SQL spy 断言过滤形（spy 先例 = `docs/batches/2026-10-02-public-repo-read.test.mjs:95-100`） |
| R1-2 | 注入点分腿 | `thincoder-core/agent/setup.mjs:112-133`（现 268 行；`normalizeOrigin` / `searchOrigins` import 已在位 `:22-23`） | 声明源会话块 ≤10 项（本仓 ≤5 零减 + 声明 ≤5 保底「有命中即占位」）；块形（`[Relevant documentation…]` ∥ `<untrusted_doc_chunk>` 包裹 ∥ 300 字符预览 ∥ `more` 计数行口径）逐字不变；无声明源 = 逐字节现行为 | T1 golden 逐字节 ∥ T3 配额构成 ∥ T4 声明零命中 ∥ T5 上限 ≤10 ∥ T6 降级；驱动 = `prepareRun(depth 0)` + 假 agent + memory 句柄（先例 `docs/batches/2026-09-30-memory-db-family.test.mjs:493-499`） |
| R1-3 | 成本登记（2 次查询向量计算——声明源会话） | 设计档落笔行（见 R1-4） | 在档披露 + 升级条件（单回合召回墙钟复测越线——L-②-5 口径 ⇒ 另裁共享查询向量形） | 人工核（设计档文本）；实测读数归实施轮 |
| R1-4 | 设计档落笔（本轮零触——待派单） | `docs/core/design/AGENT-LOOP.md`（现 643 行）§6.3 条目 5（`:263`）扩写 + 配额段 · §7 决策行 **D-AL27**（现盘末号 D-AL26）· §5 批指针行（`:171-175` 族）· 变更记录；`docs/core/design/MEMORY.md`（现 921 行）§6.15 机制 2（`:737`）分腿使用句 + `origins` 参登记 · 变更记录 | 单源分置：配额策略 = AGENT-LOOP.md ∥ origin 机制与参契约 = MEMORY.md（D2——不复述） | doc-check EXIT 0（涉档零悬空） |
| R1-5 | 需求档零改（判据已齐） | `docs/core/requirements/AGENT-LOOP.md:326-338` | 零增删 | 本批需求档 diff 为空 |

**逐条落地表 ②（`#1106`）**

| # | 动作 | 目标（现读 file:line） | 期望 | 机检法 |
|---|---|---|---|---|
| R2-1 | 豁免段落笔（本轮零触——待派单） | `docs/core/design/MANIFEST.md`（现 1004 行）§2.10 插入点 = `:622`（KD-M1-40 段）与 `:624`（边界）之间；§2.4 KD 表新增 **KD-M1-41**（现盘末号 KD-M1-40）；§4 变更记录一行 | 四面点名 + 理由 + 解除条件在档；他档零复述（L3 集定义仍归 `docs/core/design/MULTI-INSTANCE-COLLAB.md` 族——零触） | doc-check EXIT 0；段内四点名 + 解除条件行在场（grep 机械核） |
| R2-2 | 零码面（豁免 ⇒ 不触 helpers ∥ dispatch ∥ peer-domains ∥ manifest 工具档） | — | 产品码 diff 为空 | 实施轮 `git diff --name-only` 白名单（= 设计档集） |

**受影响文件与测试面**

| 文件 | 现读行数（`\n` 计数） | 预计 Δ | 面 |
|---|---|---|---|
| `thincoder-core/agent/setup.mjs` | 268 | +10~16 | R1-2 |
| `thincoder-core/memory/docs.mjs` | 234 | +2~4（另文档注释） | R1-1 |
| `docs/core/design/AGENT-LOOP.md` | 643 | +15~25 | R1-4 |
| `docs/core/design/MEMORY.md` | 921 | +2~6 | R1-4 |
| `docs/core/design/MANIFEST.md` | 1004 | +10~14 | R2-1 |
| `docs/batches/2026-10-10-agent-loop-allotment.test.mjs` | 新档 | ≈250–350 | 批内件 T1–T6 |

测试面：① 批内件 = 上表新档（名随批档 · 住批次目录 · 不进仓套件 · 复跑 = `node --test docs/batches/2026-10-10-agent-loop-allotment.test.mjs`）；② 夹具 = tmpdir 双 origin 树 + `createMemory` ∥ embedding 桩 ∥ `index.publicRepos` 声明（先例 `docs/batches/2026-10-02-public-repo-read.test.mjs:33-49` ∥ `:89-92`）；③ 仓套件 = 空清单（零用例 = 绿——`thincoder-core/test/run.mjs:43-47` 口径；收口跑归父侧）；④ 集成面零涉（无用户可见业务流变化——注入块构成面归批内件）。

**验收对照（回指需求逐条 —— 三链同源：本表 = 需求 §4.17 = 设计档落笔）**

| 回指 | 验收（可机判） |
|---|---|
| F-DI1（本仓 5 零减 + 声明源 +5；无配置开关） | T3 ∥ T5（本仓 top5 全在 + 声明补位 + 总 ≤10）；全 diff 零新增配置键 |
| F-DI2（无声明源逐字零变；不改排序 / 归一 / 解析） | T1（golden 逐字节）；R1-1 缺省路径断言（单调用、无 `origins` 参）；`searchOrigins` / `declaredPublicRoots` / `normalizeOrigin` diff 空 |
| F-DI3（生效面 = 逐回合块；来源可辨保持；工具面 / 300 字符 / depth-0 门零改） | T1/T3 块在 `!resume` 路径 push；`doc_search` 工具面（`memory/docs.mjs:221-227`）diff 空；preview ≤300 字符断言；depth-0 门 diff 空 |
| N1（有 / 无声明源两对照构成断言） | T1 ∥ T3（同夹具两态——差分仅由声明源引入） |
| N2（零回归；注入失败静默 = 现状） | T1；T6 降级腿（embed 失配 ⇒ 每腿 FTS-only 仍出块） |
| T4 挂账（§3 轮 1 发现 1 · 父侧补映射 2026-10-10） | T4（声明源在册而零命中 ⇒ 本仓 ≤5 照常占据 ∥ 零补位（无空行 ∥ 无占位符）∥ 计数行 = 本仓 2 项；两腿各 1 条 SQL——零命中不塌） |
| T2 三态格（§3 轮 1 发现 1 · 父侧补映射 2026-10-10） | T2（① 缺省 = `searchOrigins` 集 ∥ ② 单元素 = 限定（单 origin 等值形）∥ ③ 空数组 = 不过滤（无 origin 谓词）∥ ④ 多元素 = `IN (?, ?)` 形） |
| N3（300 字符口径不变；总块数 ≤10） | T3/T5 |
| `#1106`（二择一裁定 + 落地） | R2-1 段在档（四面点名 + 解除条件）；doc-check EXIT 0；零码面（R2-2 diff 白名单） |

**上抛项**

- `[上抛·知会]` 邻面观察（非本批——供父侧裁是否入册）：`manifest` 的**读动作**也走 verify 失效链——判据 = 工具级 `readonly: false`（`agent-tools/manifest.mjs:126`）× `agent/record-results.mjs:91`；同形先例 = `settings`（`agent-tools/settings.mjs:245`）。后果 = `manifest read` / `settings list|get` 令 `_verifiedThisRun` 失效（保守面——非破坏性）。本批零动。
- `[上抛·知会]` 注入块声明源命中行 = **相对路径**——与本仓同名档（如 `README.md`）在块内不可辨；需求 F-DI3 已明示「路径已在块形内——保持」⇒ 本批零动；增强形（根名前缀）超边界。
- `[上抛·知会]` 设计档三档（AGENT-LOOP ∥ MEMORY ∥ MANIFEST）落笔本轮**未执行**（派单明令「只写 §2」）——清单已在 R1-4 / R2-1 列明，待父侧派单（评审通过后 ∥ 直接派修正轮）。

**零触确认（本轮）**：本席仅写本档 §2（`batch` 工具 append + 状态行）；产品码 · 设计档 · 需求档 · 台账 · 他批 · 他档全部零触。

**坐标现读（as-of 2026-10-10 · 逐点实读 · 本席亲读）**：`agent/setup.mjs:27`/`:112-133` · `memory/docs.mjs:108`/`:113-115`/`:146-153`/`:161-174`/`:178-183`/`:221-227` · `memory/code-search.mjs:19-24` · `agent/helpers.mjs:86`/`:104-117` · `agent/dispatch-gates.mjs:136-148` · `agent/dispatch.mjs:98-131`/`:141-163` · `thincoder-core/peer-domains.mjs:42`/`:79-91` · `agent/record-results.mjs:80-90`/`:91`/`:154-175` · `thincoder-core/manifest.mjs:252-262` · `agent-tools/manifest.mjs:126`/`:137-161`/`:149`/`:187` · `docs/core/design/MANIFEST.md:585-628`/`:622`/`:624` · `docs/core/design/MEMORY.md:736-737` · `docs/core/design/AGENT-LOOP.md:263`/`:171-175` · 需求 `requirements/AGENT-LOOP.md:326-338`。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象**：`docs/batches/2026-10-10-agent-loop-allotment.md` §2（设计 · 2 条 #1100 ∥ #1106）· 对象态 = 待评审 · 触发 = 用户全自动授权下代点火。

**核讫（逐点实读现盘，引文与行号全对表）**：`thincoder-core/agent/setup.mjs:27`（`DOC_SEARCH_LIMIT = 5`）/`:112-133`（单调用注入块）/`:22-23`（`normalizeOrigin` ∥ `searchOrigins` import 在位）· `thincoder-core/memory/docs.mjs:108`（签名）/`:113-115`/`:117-122`（同步 FTS `.all()`）/`:124-139`（FTS-only 降级）/`:146-153`/`:161-163`（fetchChunk 无 origin 列）/`:178-183`（`_docEmbedLock` 单飞）/`:221-227`（`doc_search` 工具面）· `thincoder-core/memory/code-search.mjs:19-24`（`searchOrigins` 项目 ∪ 声明、无项目 ⇒ 空集）/`:20-21` · `thincoder-core/memory/scan.mjs:159-175` · `thincoder-core/agent/helpers.mjs:86` / `:104-117`（钩子只收 `args`）· `thincoder-core/agent/dispatch-gates.mjs:136-148`（唯一记账点）· `thincoder-core/agent/dispatch.mjs:98-131`（`:110-111` 非串目标保守拒 ∥ `:141-163` 冻结窗）· `thincoder-core/peer-domains.mjs:42` / `:79-91` · `thincoder-core/agent/record-results.mjs:80-90` / `:91` / `:154-175` · `thincoder-core/agent-tools/manifest.mjs:126`（`readonly: false`）/ `:44`（解析基）/`:137-161` /`:149` /`:187` · `thincoder-core/manifest.mjs:252-262`（writeManifest）· `thincoder-core/agent-tools/settings.mjs:245` · `thincoder-core/agent/assemble.mjs:84`（生产径 `memory.codeOrigin = cwd` 恒设）· `thincoder-core/agent-tools/batch.mjs:25-27`/`:57-62` · `thincoder-core/test/run.mjs:41-45` · `thincoder-core/declaration.mjs:130-140` · `docs/core/design/TOOLS.md:907` + 十点表 · `docs/core/design/MANIFEST.md:585`（§2.10 起）/`:622`/`:624`/`:309`（KD-M1-39）/`:310`（KD-M1-40 = §2.4 末号，全档 grep `KD-M1-4[0-9]` 无 41）/`:1005` 行；全档 grep `FILE_MUTATORS|变更记账|_touchedFiles|mutation` 零命中（= 「缺一行显式在档」成立）· `docs/core/design/MEMORY.md:736-737`（§6.15 机制 2）· `docs/core/design/AGENT-LOOP.md:263`（§6.3 条目 5）/`:171-175`（批指针行族）/`:497`（D-AL26 末号）/`:643` · `docs/core/requirements/AGENT-LOOP.md:326-340`（§4.17 五要素：F-DI1–F-DI3 / N1–N3 / 设计侧待落）· 先例 `docs/batches/2026-10-02-public-repo-read.test.mjs:33-49`/`:89-92`/`:95-100` · `docs/batches/2026-09-30-memory-db-family.test.mjs:493-499` · `docs/batches/2026-10-08-manifest-agent-tool.md:156`。行数标注抽检：`setup.mjs` 268 = 实读逐字；`docs.mjs` 234（`\n` 计数）= 实读相符；两档均远低 500 档线（无拆分计划义务）；新增测试档 ≈250–350 < 500。**无 🔴**。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Acceptance | 🟡 | T1–T6 只在机检法列以短名出现（`:57` 起「T4 声明零命中」等），§2 无「用例 → 夹具 → 断言」表；T4（声明源在册而零命中 = F-DI1「有命中即占位」的补集）全文无期望结果句，验收对照表（`:84-92`）亦无需求行映射到 T4（N1 → T1 ∥ T3）——该边界不可机判；T2 亦未覆盖 `origins` 空集格（`:39` 契约「空数组 ⇒ 保持现「不过滤」语义」） | 补一张 T 表（用例 → 夹具 → 断言）并把 T4 挂进验收对照；T2 建议补 `origins` 三态对照格（缺省 = `searchOrigins` ∥ 单元素 = 限定 ∥ 空数组 = 不过滤） |
| 2 | Methodology / coordination | 🟡 | R1-4/R2-1 设计档落笔本轮未执行（`:59`「（本轮零触——待派单）」· `:98`「待父侧派单」），而 §1 记「随实施臂同拍（回填轮先例）」（`:21`）——批准时点存在「三档设计单源未落笔 ∥ 产品码已排队」的先后序未钉死 | 把 R1-4/R2-1 落笔排进审批通过后的首批动作、与实施臂同拍，并在 §4 批准行显式确认「设计档落笔 ≤ 产品码落地」的先后序（对齐 `AGENT-LOOP.md:171-175` 落点表惯例） |
| 3 | Requirements | 🔵 | F-DI3「声明源命中来源可辨（路径已在块形内——保持）」（需求 `:336`）被读作「现状即满足」⇒ 本批零动（`:97`，上抛·知会②）；该解读无落档确认，而声明源相对路径与本仓同名档在块内不可辨（设计自认） | 在 §4 批准轮点名确认该解读（或把增强形登记为具名后续面），使「可辨」验收不留解释分叉 |
| 4 | Clarity | 🔵 | 并行墙钟论证过宽：`:40`「并行 ⇒ 墙钟 ≈ 两腿之 max」与 `:42`「并行 ⇒ 墙钟近 1 次量级」仅对嵌入 I/O 成立——FTS 查询为同步 `.all()`（`docs.mjs:117-122`）、向量扫描行处理在单事件循环内串行（`scan.mjs:159-175`），两腿本地工作量相加 | 改述为「嵌入 I/O 重叠（≈1 次嵌入量级）+ 本地 FTS ∕ 扫描 ×2」，并把两腿分形读数纳入 L-②-5 实测对照基线 |
| 5 | Clarity | 🔵 | 坐标现读表（`:102`）两处 basename 未限定树：`peer-domains.mjs`（真档 = `thincoder-core/peer-domains.mjs`，VSC 树另有同名档 `thincoder-vscode/src/extension/peer-domains.mjs`）· `manifest.mjs:252-262`（= 引擎档，与同子系统 `agent-tools/manifest.mjs` 同名） | 坐标表两处补全路径（`thincoder-core/peer-domains.mjs` ∥ `thincoder-core/manifest.mjs`），与同表他条口径一致 |
| 6 | Register | 🔵 | 豁免解除条件③「该面触碰需求出现」（`:49`）已有首个具名实例未被点名：`manifest write` 可改 `index.publicRepos` / `codePaths`（`agent-tools/manifest.mjs:121`/`:166`）⇒ 直接改 #1100 的 origin 集（`declaration.mjs:130-140` → `code-search.mjs:22`）与写门分类，且该改动作零入四面（门禁 ∥ 记账 ∥ L3 ∥ 作用域规则） | 把该实例写进 R2-1 段落的解除条件③（作为「该面触碰需求」的具名触发），使豁免段自带可复查边界 |

**限制声明（两条）**：① 无项目标准档声明 ⇒ 方法合规按 AGENTS.md（六段批档惯例 / 文档即时落档 / 禁把代码当事实源）+ 本档 §2 模板判；② 无文档地图 ⇒ Document ownership 按既有档主自识别判：三条落点（`AGENT-LOOP.md` §6.3/§7 ∥ `MEMORY.md` §6.15 ∥ `MANIFEST.md` §2.10 + §2.4）均落在既有主题档内、未见新建档分身或跨档复述（R1-4 自述 D2 单源分置）。

**计数**：0🔴 · 2🟡 · 4🔵。

VERDICT: pass

## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
**状态行**：实施完成（2026-10-10 · 交付 6 档 · 审计 1 轮 + fix 1 轮 + 评审 1 轮（pass）· 终态 clean）



### 交付摘要（2026-10-10 · 实施轮 · eng-coder · 承 §2 逐条落地表 ①②）

**交付件（产品码 2 档 + 设计档 3 档 + 批内件 1 档）**

- `thincoder-core/memory/docs.mjs`（R1-1）：`docSearch` 增可选参 `origins: originsOverride = null`——缺省 = `searchOrigins(memory)` 逐字（现行为零变）∥ 给定 = 以其为 origin 集（复用既有单/多 origin SQL 形）∥ `[]` = 现「不过滤」语义。
- `thincoder-core/agent/setup.mjs`（R1-2）：注入点双腿分取——`originSet.length > 1` ⇒ `Promise.all`（本仓腿 `origins:[normalizeOrigin(memory.codeOrigin)]` ∥ 声明腿 `集 − 本仓`，各 `DOC_SEARCH_LIMIT`，合并本仓在前，上限 10）；`≤1` ⇒ 原单调用路径逐字保留。
- `docs/core/design/AGENT-LOOP.md`（R1-4）：§6.3 条目 5（现 `:264`）扩写 + 新增「文档注入·声明源保底名额」段（`:269-277`——含成本披露与升级条件）· §7 新增 **D-AL27**（`:509`）· §5 批指针行（`:176`）· 变更记录（`:548`）。
- `docs/core/design/MEMORY.md`（R1-4）：§6.15 机制 2 补 `docSearch` 可选 `origins` 参三态句 + 注入块按腿分取句（`:738`）· 变更记录（`:843`）。
- `docs/core/design/MANIFEST.md`（R2-1）：§2.10 新增「变更记账面（KD-M1-41——豁免）」段（`:625-632`——四面点名 ∥ 判据 ∥ 解除条件三式含具名实例）· §2.4 补 **KD-M1-41**（`:311`）· §4 变更记录（`:811`）。
- `docs/batches/2026-10-10-agent-loop-allotment.test.mjs`（新 · 批内件）：T1–T6（表头 T 表 = `:6-33`）。

**父裁回执**：① T 表 + T2 三态格 + T4 期望句 → 落批内件表头（`test.mjs:6-33`）+ 本 §5 T 表；§2 验收对照表的 T2/T4 行非本席写域（eng-designer 段，本席白名单仅 §5——见「待父侧处置」）。② 设计档与产品码**同拍**（本轮同落）✓。③ F4 墙钟改述 ✓（`AGENT-LOOP.md:275-276`「嵌入 I/O 重叠（≈1 次嵌入量级）+ 本地 FTS ∕ 扫描 ×2」）。④ F5 全路径口径 ✓（本 §5 及各档落笔全路径）。⑤ F6 解除条件③具名实例 ✓（`MANIFEST.md:632`：`manifest write` 改 `index.publicRepos` / `codePaths`）。⑥ F-DI3「来源可辨」按需求括注确认 ✓（`AGENT-LOOP.md:277`）。

### T 表（用例 → 夹具 → 断言 → 回指；期望结果句逐条在断言内）

| 用例 | 夹具 | 断言（期望结果） | 回指 |
|---|---|---|---|
| T1 无声明源 golden | proj 单 origin（变体 A：manifest 在盘 + `index.publicRepos: []`；变体 B：无 manifest；变体 C：超长正文） | 注入块逐字节 === golden（6 计数行 + a–e 五行）∥ A ≡ B 等值 ∥ 变体 C：preview = 正文前 300 字元（上界断言）∥ SQL spy：恰 1 条 FTS 查询且单 origin 等值形（非 IN） | F-DI2 ∥ F-DI3（preview 口径）∥ N1 ∥ N2 |
| T2 `origins` 三态格 | 三 origin（proj=A 在盘声明 ∥ docs-repo=B 被声明 ∥ other=C 未声明） | ① 缺省（无参）= `searchOrigins` 集（A+B——C 不出）∥ ② `[B]` = 限定 B（单 origin 等值形）∥ ③ `[]` = 不过滤（A+B+C；FTS ∥ 向量 SQL 皆无 origin 谓词）∥ ④ `[A,B]` = 多 origin `IN (?, ?)` 形 | R1-1 契约（§2 `:58`）∥ §3 轮 1 发现 1（T2 补格） |
| T3 配额构成 | proj + 声明 `../docs-repo`；本仓 5 枚弱命中（needle×1）× 声明 8 枚强命中（needle×5） | 块恰 10 行（本仓 5 在前 = 本仓腿独立 top-5 ∥ 声明 5 补位）∥ 计数行 = 13（全 origin 集）∥ SQL spy：恰 2 条 FTS（= 两腿）∥ **负对照**：单调用全局 top-5 不含全部本仓 5 枚 | F-DI1 ∥ N1 ∥ N3 |
| T4 声明零命中 | proj + 声明；本仓 2 枚命中 × 声明 3 枚零命中（FTS-only 夹具：无 embedder ⇒ 零命中即零行） | 本仓 ≤5 照常占据；声明侧零命中 ⇒ **零补位**（无空行 ∥ 无占位符）；块 = 仅本仓 2 项；计数行 = 5 在场 ∥ SQL spy：两腿各 1 条（声明腿照跑、零命中不塌） | F-DI1「有命中即占位」的**补集** ∥ N1 ∥ §3 轮 1 发现 1（T4 挂账） |
| T5 上限 ≤10 | proj + 两声明仓（`../docs-repo-a` ∥ `../docs-repo-b`）；本仓 6 × A 4 × B 4 | 块恰 10（两腿皆饱和）∥ 本仓 5 在前 ∥ 声明 5 = **单次**声明腿（两仓同集 `IN (?, ?)`）∥ 路径零重复 | F-DI1 ∥ N3（总块数 ≤10） |
| T6 降级腿 | 同 T3 形 + `doc_embedding_model` 失配 | 每腿 FTS-only 仍出块（本仓 ∥ 声明各行皆出）∥ 降级行可见 ∥ SQL spy：零向量扫描查询 | N2（注入失败静默 = 现状的反面） |

**复跑读数**（本席实跑 · 收笔轮）：`node --test docs/batches/2026-10-10-agent-loop-allotment.test.mjs` ⇒ **pass 6 / fail 0**（≈7.5s；T6 触发 `[docs] embedding model changed` 降级行两行 = 声明源会话逐腿各一，与代码形相符）。

### 实测读数（R1-3「实测读数归实施轮」—— advisor 🟡 采纳落地）

夹具尺度（tmpdir · 400 chunk ∥ 两 origin 各 200 档 × 8 行 · 嵌入**即时桩** ⇒ 远程嵌入往返未计）：同库上
- 基线（单调用 · `origins:[proj, decl]`）：中位 **2.499 ms**
- 新形（两腿 `Promise.all`）：中位 **2.837 ms**（**1.14×** 基线）
- 两腿串行（对照）：中位 **3.244 ms**（1.30× 基线）

方法 = 暖跑 3 次 + 15 次取中位（`process.hrtime.bigint`）；一次性执行、不落档、真库（`~/.thincoder/`）零触碰。
口径限制：**夹具尺度 ∥ 即时桩 ⇒ 生产读数（真库 / 真实嵌入往返）不在本轮**——升级条件的「单回合召回墙钟复测越线」仍按 `docs/core/design/MEMORY.md` §6.14 L-②-5 口径另测（越线 ⇒ 另裁共享查询向量形）。

### 决策透明表

| # | 决定 | 理由 |
|---|---|---|
| D1 | 分腿门 = `originSet.length > 1`（不按「声明表非空」判） | 复用读面集单点语义（声明根缺位已有回退链）⇒ 零第二判定源 |
| D2 | 声明腿 origins = `originSet.filter((o) => o !== project)`（不重算声明根） | 集已归一 ∥ 去重 ∥ 排序（`thincoder-core/memory/code-search.mjs:20-23`）⇒ 两腿互斥、无重复行、零去重代码 |
| D3 | `origins: []` 语义 = 现「不过滤」（非「零结果」） | 契约已裁（§2 `:58`）；调用方不产此形（过滤后 ≥1）——T2 ③ 格钉住 |
| D4 | 计数行仍用全 origin 集；`searchOrigins` 调用上提为每回合一次 | 口径逐字不变（F-DI3）；输出零变、省一次块内重复调用 |
| D5 | 批内件 T1 增变体 C（preview 300 上界断言） | 审计轮 1 发现（验收对照 F-DI3 行「preview ≤300 字符断言」无覆盖）⇒ 补齐（fix 轮 1） |
| D6 | advisor 🔵 ×2 **不修**（降级日志逐腿两行 ∥ T3 负对照强度） | 属观感 / 测试强度面，advisor 自判「现状可接受」；修法出本轮设计范围 ⇒ 记录在案、不动码 |
| D7 | 批内件 = 399 行（§2 预估 ≈250–350） | 增量为 T 全表头注 + T4/T6 夹具与负对照；< 500 档线、批内件不进仓套件 ⇒ 不拆 |

### 审计与代码评审轮次与终态

| 轮次 | 类型 | 结果 | 处置 |
|---|---|---|---|
| 审计轮 1 | explore 分歧审计（只读 · 对 §2 逐条） | 1 项 🟡：T1–T6 无 preview ≤300 上界断言（验收对照 F-DI3 行要求）；其余（R1-1 ∥ R1-2 ∥ 落笔 ∥ 零改面 ∥ 清单内）全相符 | fix 轮 1：T1 增变体 C（超长正文 ⇒ preview = 前 300 字元）→ 复跑全绿 |
| fix 轮 1 | 批内件补强 | `docs/batches/2026-10-10-agent-loop-allotment.test.mjs`：变体 C + 表头 T 表随动（另去 1 条未用 import） | 复跑 pass 6 / fail 0 |
| 代码评审轮 1 | advisor（`type=code` · 全量） | **pass**（0🔴 · 1🟡 可选 · 2🔵）：🟡 = R1-3 实测读数缺（非阻塞）∥ 🔵 = 声明源会话降级日志逐腿两行 ∥ 🔵 = T3 负对照强度依赖三层稳定契约（scan PK 序 → createTopK 先到先留 → `Array#sort` 稳定） | 🟡 = 本 §5「实测读数」段补（采纳）；🔵 ×2 = D6 记录不修（可接受面） |
| **终态** | — | **clean**（评审后**零代码/文档变更**——评审后仅落 §5 记录与实测证据；评审对象即交付终态） | — |

**机检读数（本席实跑）**：`node scripts/doc-check.mjs` ⇒ **EXIT 0**（悬空 0 · 行宽 OK——含我两处新增行拆行修复后的复跑）；`node --check` 三档（`setup.mjs` ∥ `docs.mjs` ∥ 批内件）全 OK。

### 零触确认（本轮）

需求档 `docs/core/requirements/AGENT-LOOP.md` 零触（内容与轮首实读一致——§4.17 原样、`:340`「设计侧 = 待落」行仍在）· 仓套件零触（批内件不进 `test/`）· `thincoder-core/memory/code-search.mjs` ∥ `thincoder-core/declaration.mjs` ∥ `thincoder-core/memory/origin.mjs` ∥ `thincoder-core/agent/dispatch.mjs` ∥ `thincoder-core/agent/dispatch-gates.mjs` ∥ `thincoder-core/peer-domains.mjs` ∥ `thincoder-core/agent-tools/manifest.mjs` 全部零触（R2-2 零码面）· 台账 / 他批 / 他档零触 · 集成面零涉（无用户可见业务流变化）。

### 待父侧处置 / 上抛

- `[上抛·待裁]` **§2 验收对照表**的 T2/T4 行（§3 轮 1 发现 1 的 §2 载荷面）与 **§2 坐标现读表**两处 basename 补全（发现 5）——均 §2（eng-designer 段）；本席白名单仅 §5，实质已落批内件表头 + 本 §5 T 表 ⇒ 请父侧派单或代落。
- `[上抛·知会]` 需求档 §4.17 尾行「设计侧 = 待落」已滞后于本轮设计落笔（R1-5 明令本批零改 ⇒ 其笔归主 agent）。
- `[上抛·知会]` advisor 🔵 ×2（降级日志逐腿两行 ∥ T3 负对照强度）现状可接受、记录在案（D6）。

## §6 验证与收口（父代理）

**交付物**：产品码两档（`memory/docs.mjs` `origins` 参 ∥ `agent/setup.mjs` 双腿分取）+ 设计档三档（`AGENT-LOOP.md` §6.3 条目 5/§7 D-AL27 ∥ `MEMORY.md` §6.15 ∥ `MANIFEST.md` §2.10 + KD-M1-41）+ 批内件六腿——§5 全 8 条 ✅（eng-coder #88）。

**父侧验证读数**：`node --test docs/batches/2026-10-10-agent-loop-allotment.test.mjs` = **6/6 绿**（父侧实跑 · 10195ms）∥ `node scripts/doc-check.mjs` = EXIT 0（coder 读数）∥ `node --check` ×3 = OK。

**父侧载荷落讫（可 revert）**：① §2 验收对照补「T4 挂账 ∥ T2 三态格」两行（`:93-94`）∥ ② §2 坐标现读两处 basename 补全（`thincoder-core/peer-domains.mjs` ∥ `thincoder-core/manifest.mjs`，`:106`）∥ ③ 需求档 §4.17「设计侧 = 待落」⇒ 三档指针落位（`docs/core/requirements/AGENT-LOOP.md:340`）。

**审计与评审终态**：审计轮 1（1🟡 ⇒ fix 轮 1 补齐）+ 代码评审轮 1 = **pass**（0🔴 · 1🟡 已采纳 · 2🔵 记录不修）；评审后零代码变更。

**结算**：#1100 ∥ #1106 ⇒ 核销（evidence = 本档 + 批内件 6/6 读数）。**待办**：波尾 scoped commit；无未决项。
