# 2026-10-02 · 会话锚解析修复（多档并存支持）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-02 · 来源 = 用户 2026-10-02 22:26 裁定：「advisor 得先改——两个带档目录以后是常态，这都支持不了以后没法用了」+ 台账 #828（会话锚解析滞后四处——今日多仓实操实测）。
> 台账 = #828（多档解析 · 归批）。前情 = docs/batches/2026-09-21-manifest-resolution.md §1（已收口 2026-09-21——「参数按用点解析」之裁；本批 = 其未落全的三处收口）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-02
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**需求登记（用户 2026-10-02 22:26 裁定 · 父侧笔录）**：多档（PROJECT-MANIFEST）目录并存 = **常态**，工具族必须支持——现状 **advisor 评审门首当其衝**（设计评审对 10 份合法文档全拒：`criterion=scope-not-doc`）；「这都支持不了以后没法用了」⇒ **修码优先于 #827**（本批先落地，再回 #827 链）。

**实测四事实（2026-10-02 · 台账 #828）**：① **advisor 设计评审门**（`thincoder-core/agent-tools/advisor.mjs:114-124` → `agent/write-gate.mjs resolveReviewTargetPaths`）——按**会话锚** manifest 取 `docRoot` 合法根集；工作区锚下双档目录 ⇒ 解析歧义 ⇒ 回退到锚 ⇒ 根集错位 ⇒ 全拒；② **台账默认根**（`ledger_query/count` 缺省空——显式 `cwd` 即愈：34 行 ✓）；③ **批档默认基底**（`batch-paths.mjs declaredBases(cwd)`——相对建档落锚：**本批档自身即实例**：create 落 `d:\teamcode\docs\batches\` ⇒ 父侧迁回）；④ **文件工具相对路径**（会话 cwd 基准——标准行为，属误用面非缺陷候选）。

**裁定口径（用户）**：多档并存 = 常态 ⇒ **解析须支持**（「列出候选等显式」不止——**默认面也得工作**）；「参数按用点解析，会话不绑定项目」（2026-09-21 已裁）——本批 = 其**未落全处的收口**。

**范围**：以 advisor 门为首四族（②③含默认面；④评估性）；设计须复核 **#827 条款 ④⑤**（描述现行为为「正确」之两条——行为若变 ⇒ 条款随正；#827 未实施、可修正设计）。**边界**：安全语义不动（评审门仍须真校验——不得砍成放行）；不砖会话；产品码 = 设计后走 eng-coder。**授权**：按 #827 同口径**全自动跑**（代点火 ∥ 修正 ∥ 代签三条件 ∥ 实施 ∥ 收口）；新范围/口径裁决 = 停。**设计轮已派发。**

**轮七收尾链回执接入（2026-10-02 22:5x · 父侧）**：轻通道轮七（advisor 门多档解析）已收口（批档 = `docs/batches/2026-10-02-light-round-7.md` · **已冻结** · 提交 **`3ce17b57`**——双远端）——其形式化与观察面**并入本批范围（三项）**：① **互引勿重落**：形式化落位 = `MANIFEST.md:273-276`（§2.5 消费面登记）+ `:649`（变更记录）；② **`MANIFEST.md:284` 并注**：读面坐标失准（现文 `write-gate.mjs:47` ∥ `advisor.mjs:122` ⇒ 实点 = `write-gate.mjs:60` ∥ `advisor.mjs:120`/`:125`）+ **未登记逐文档所属项目第二读点**；同族时态注记 = `MANIFEST.md:491`（§2.9 A 消费面行）；③ **M4/M6 明细档两处随正**：`ENG-TOKEN-BINDING.md` §9 F3 ∥ `DESIGN-TOKEN-SETTLEMENT.md` F3 文面未含新导出 `resolveReviewRootsFor`。**判据语义零改**（皆为登记面/文面对账）。

**轮七 §4 时间戳勘误（父侧 · 2026-10-02 22:52）**：轮七档 §4 记时「23:0x」有笔误——实为 **22:5x**（钟面核对：其余各条记时无误）；另：其修正轮执行体报告于 §4 落笔后到达，与在盘核验一致（六项全 Done）——§4「报告未达·以产物为准」句为当时态、不动。

**#827 签入 errata（父侧 · 2026-10-02 23:0x）**：多仓提示词批（`docs/batches/2026-10-02-multi-repo-mechanism.md`）收口提交 = **`981992e0`**（十档，双远端——其档已冻结，哈希落此邻域）。

**#830 签入 errata（父侧 · 2026-10-02 23:4x）**：轻通道判据收口批（`docs/batches/2026-10-02-light-channel-simplification.md`）收口提交 = **`0c3c6c07`**（八档，双远端——其档已冻结，哈希落此邻域）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（会话锚解析修复（多档并存支持）· fix 轮（评审轮次 1 发现 1–8 · 8/8 采纳）逐号落地——MANIFEST ∥ LEDGER ∥ BATCH-RECORD 三档；微修正轮（#10 交付观察②③处置）落毕——§2.3 行 44–47 补全 ∥ §2.5 口径标注；微修正轮 2（#13 上抛两项处置）落毕——MANIFEST live 面三处指针收正 ∥ §2.3 行 47 坐标随正 · 2026-10-02）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**任务书** = spawn 派单（目标 / 已知事实 / 设计要点 / 验收 / 交付格式）+ 批档 §1（需求登记 ∥ 实测四事实 ∥ 范围边界）+ §1 轮七回执补充三项（互引勿重落 ∥ `:284` 并注 ∥ M4/M6 明细档两处随正——冲突时以补充为准）+ 台账 #828 ∥ #829（轮七 = 既收口族，互引不复做）。**轮次 = initial**。

**本席实探（2026-10-02 22:4x · 免再探项已复核）**：锚 = `d:\teamcode`（无 manifest ∧ 无 .git）——`discoverProjects` 实读 = `ambiguous`（候选 = `thincoder` ∥ `thincoder.com`，按名排序）· `resolveProjectRoot(锚)` = **null** · `owningProject(锚)` = null；台账键实读：锚键 `38478126a2c420a4` 库**在盘但 0 行**、thincoder 键 `02a338af07b1ba5c` = **830 行**（未决 34）——缺省读落锚 ⇒ 静默空读复现 ✓（与 §1 实测一致）。

**本批覆盖（§1 七项 + 补充三项 → 逐项落点）**：① 三族判定表（§2.1）② 歧义 / 无主档回退面专项（§2.2）③ #827 ④⑤ 随正建议（§2.3）④ 设计档落点（§2.4——含补充②③）⑤ 受影响文件与测试面（§2.5）⑥ 验收对照（§2.6）⑦ 机检 / 回归面（§2.7）⑧ 关键决策（§2.8）⑨ 上抛与观察（§2.9——含轮七回执项）。**零延期 ∥ 零未覆盖**。

**advisor 族（首族）= 已收口（轮七）**——形式化 = `docs/core/design/MANIFEST.md` §2.5（`:273-276`）+ 同档变更记录（`:649`）；本批**互引不复做**。

**本批边界**：产品码 = 设计纸面（实施 = eng-coder）∥ **冻结面零触**（#827 被审 7 档 + #827 批档——零写）∥ 他批档零触 ∥ **不做全仓改基**（新增判定单点 + 三消费面接线——最小改面）∥ 安全面只增不减（写门基底并集 = 覆盖增强）∥ 需求档零触（核对完——无缺口）。

**需求合规核对（五要素）**：需求基座 = §1 需求登记 + 裁定口径 + 台账 #828（含修向句「按目标路径最近 manifest（`owningProject` 已在库）」）——功能点 / 边界 / 验收 / 依赖俱在，可设计（本批设计即其导出）。**上抛需求项 = 0**。

### 2.1 三族判定表（族 → 现状 file:line → 新判定 → 理由）

| 族 | 现状（file:line · 实核） | 新判定 | 理由 |
|---|---|---|---|
| ① 台账缺省根 | 键式 `thincoder-core/ledger-db.mjs:50-53`（`resolveProjectRoot(cwd) ?? resolve(cwd)` 兜底）+ 入口 `:106-123`（`openLedger`）；工具缺省 cwd = `thincoder-core/ledger-tools.mjs:14`（`ctx.agent.cwd`） | **歧义锚 ⇒ `openLedger` 显式拒**（列候选 + 指明显式项目根；文案族「项目不可解析」）——读 / 写五工具面一处收（query ∥ count ∥ add ∥ update ∥ close） | 现状「静默回退到锚」= 最坏形态（双面症：缺省空读 + 错写落锚——锚键库实测在盘 0 行）；「显式优于猜测」；拒 = 可恢复（显式 cwd 重试即愈） |
| ② 批档默认基底 | `thincoder-core/agent-tools/batch-paths.mjs:26-28`（`batchProjectRoot` 兜底）∥ `:31-45`（`declaredBases` ∥ `batchDocBases`）∥ `:87-99`（读面）∥ `:124-142`（create 越基底判据） | **歧义锚**：create 按**目标所属项目**（∈ 候选集）落基底 / 无所属 ⇒ 显式拒（列候选 + 显式路径指引）；读面候选腿补候选项目形；在飞 ∥ 写门基底集 = 候选并集 | #828 修向逐字 = 按目标路径最近 manifest；两实例病根消（多仓档 ∥ 修复批档原落锚）；**#827 ⑤ 锚有项目面零改** |
| ③ 文件工具相对路径 | `thincoder-core/tools/shared.mjs:294-301`（`resolveInCwd` ≡ `resolveExternal` = `resolve(realCwd(ctx.cwd), p)`——`ctx.cwd` = 会话锚） | **零改 + 记明**（结语） | 会话 cwd 基准 = 标准行为（相对路径通用约定；「无锚相对串」本无归属信息可依）；多档纪律层承接 = #827 提示词面（显式目标 / 显式路径）；改写 = 反标准 + 无判据（评估性定论——§1 ④ 维持） |

### 2.2 歧义 / 无主档回退面专项（判定单点 + 拒绝语义 + 不砖会话）

**判定单点（新增）**：`projectRootView(cwd)`——`thincoder-core/manifest-discovery.mjs` 新导出（经 `thincoder-core/manifest.mjs` 转口）→ `{ state: "ok" | "ambiguous" | "none", root, candidates }`（「项目根解析」的**歧义直读形**）；`resolveProjectRoot` 改薄委托（`= projectRootView(cwd).root`——既有导出行为逐字零变，含覆盖位短路）。

**统一规则**：`ok` / `none` 两态照旧（none ⇒ `resolve(cwd)` 兜底 = 建档流语义——单值，无歧义）；**`ambiguous` ⇒ 禁止静默回退**——各消费面显式处置 = **列候选 + 显式目标指引**。

**逐面拒绝语义**：台账 = `openLedger` 拒（读 / 写同门——文案含候选全列 + 「台账按项目根键控——请显式给出项目根 cwd」）；批档 create = 无所属目标 ⇒ 拒（候选 + 显式目标路径例示）；批档读面 = 候选腿补齐后仍无可读 ⇒ 既有 null / 文案（零改）；**无主档（目标无所属）= 同拒**（不静默、不代选）。

**不砖会话三证**：① 拒 = 工具级可恢复错误（显式重试即愈——不涉会话生命周期）；② 通知面逐项目 try/catch（`thincoder-core/ledger-surface.mjs:23-26` ∥ VSC 对位 `:54-57` ∥ 桌面对位 `thincoder-desktop/src/main/project-info.mjs:94-97`；tick 面另具总闸 `:68`）——歧义条目转跳过、零崩；③ 发现面零改（`findProject` / `discoverFamily` 无新抛点）。

### 2.3 #827 条款集 ④⑤ 随正建议（族②行为已变——供 #827 侧后续落实；本批零触其批档）

**⑤ 现文**：「批档基根 = 会话锚项目声明（`docRoot.batches`）——跨仓 create 必拒 = 正确行为。」

**建议补线（就低——仅补缺，不改既有断语）**：「会话锚非项目（歧义多候选）⇒ 基底按**显式目标所属项目**解析（目标须属候选集内）；无所属 ⇒ **显式拒（列候选）**——不得静默落锚；跨仓 create 必拒（锚有项目面）维持 = 正确行为。」

**④ 现文**：「他仓享六段机制 = 锚在那仓的会话 + 该仓持 manifest。」

**建议补注**：「（工作区锚无仓——记录归属按**绑定 / 目标档所属项目**；④ 断语仍真。）」

**依据** = §2.1 族② ∥ `docs/core/design/BATCH-RECORD.md` §4.15 条 5（`:247-250`）。

### 2.4 设计档落点（读回 file:line——D6）

| # | 档 | 落点（读回） | 改动 |
|---|---|---|---|
| 1 | `docs/core/design/MANIFEST.md` | §2.5（`:277-284`） | 新条「多档解析消费面收口（#828 批）」——`projectRootView` 判定面 + 三族收口 + 依据 / 验收 / 边界 + 同批并注 |
| 2 | 同档 | §2.5 读面边界行（`:292`） | 坐标随动（`thincoder-core/agent/write-gate.mjs:60` ∥ `thincoder-core/agent-tools/advisor.mjs:120`）+ 逐文档所属项目第二读点 `:125` → `:129`（补充②） |
| 3 | 同档 | §2.9 A 消费面行（`:499`） | 改「收口现状」形（轮七 + 本批——原「本批零改」时态句退场） |
| 4 | 同档 | §4 变更记录（`:657`） | +1 行 |
| 5 | `docs/core/design/LEDGER.md` | §2.1（`:64`）∥ §6.1 口径 2（`:247-248`） | 新条「根解析面（歧义拒）」+ 补注（同源关系不变） |
| 6 | 同档 | §4 变更记录（`:479`） | +1 行 |
| 7 | `docs/core/design/BATCH-RECORD.md` | §4.15 条 5（`:247-250`）∥ 条 1 补注（`:242`）∥ 行为变更登记（`:252-254`）∥ §4.8（`:165-168`） | 歧义锚面定形 + BR-39–BR-42 |
| 8 | 同档 | §4 变更记录（`:437`） | +1 行 |
| 9 | `docs/core/design/ENG-TOKEN-BINDING.md` | §9 F3（`:146-147`）∥ 变更记录（`:169`） | 加 `resolveReviewRootsFor`（补充③） |
| 10 | `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` | §9 F3 行（`:150`）∥ 变更记录（`:168`） | 同（补充③） |
| — | 零触面 | #827 被审 7 档 ∥ #827 批档 ∥ `ENGINEERING-MODE-V2.md`（指针引——D2）∥ 需求档（核对完） | — |

### 2.5 受影响文件与测试面（产品码 = 实施轮笔域；行数 = 实读 as-of 2026-10-02）

| # | 档 | 现行 | 预计 Δ | 面 |
|---|---|---|---|---|
| 1 | `thincoder-core/manifest-discovery.mjs` | 120 | +≈14（`projectRootView`——单点判定） | 核 |
| 2 | `thincoder-core/manifest.mjs` | 250 | ±2（转口 + 薄委托） | 核 |
| 3 | `thincoder-core/ledger-db.mjs` | 127 | +≈10（`openLedger` 歧义拒 + 文案） | 核 |
| 4 | `thincoder-core/agent-tools/batch-paths.mjs` | 143 | +≈55（解析单点 + create / 读面分支 + 文案） | 核 |
| 5 | `thincoder-core/agent-tools/batch.mjs` | 314 | ±4（基底取解析单点——`:184` ∥ `:283`） | 核 |
| 6 | `thincoder-core/agent-tools/subagent-spawn.mjs` | 439 | ±2（`logBatchDocRefs` 基底腿随动——`:53`） | 核 |
| 7 | `thincoder-core/agent/write-gate.mjs` | 184 | ±4（`memoizedBatchBases` ← 解析单点——`:110-116`） | 核 |
| 8 | `docs/batches/2026-10-02-manifest-resolution-fix.test.mjs` | 新 | 新档（AC-1–AC-5） | 测试 |
| 9 | `docs/batches/2026-09-29-structure-split-2.test.mjs` | 220 | ±2（导出枚举 +`projectRootView`——`:110` ∥ `:112` ∥ `:122`） | 测试 |

**回归锚（复跑清单）**：`docs/batches/2026-09-29-batch-mechanics.test.mjs`（91——写门直调 + 端到端；单项目面零变）∥ `docs/batches/2026-09-30-core-tools-pairfix.test.mjs`（413——`batchDocBases` deepEqual none 面）∥ `docs/batches/2026-09-29-residuals-round2.test.mjs`（240——`ledger.mjs` 导出面零变）∥ `docs/batches/2026-10-02-light-round-7.test.mjs`（67——write-gate 同档异函数）。**仓套件 = 空清单制度**（核 `thincoder-core/test/run.mjs` 空清单守卫）；批内件 = 本批自持（不进仓套件）。

### 2.6 验收对照（多档实景——机检式；实施轮落批内件）

| # | 判据（§1 验收逐项） | 机检形 |
|---|---|---|
| AC-0 不砖会话 | 歧义锚任一面拒绝后会话照常；显式重试成功 | 实景：缺省 `ledger_count` 拒 → 显式 `cwd` 读数 = 34 ✓（同会话） |
| AC-1 台账缺省不静默错位 | 歧义锚 + 缺省 ⇒ **拒**（文案含两候选绝对路径 + `/项目不可解析/`）——零返回 0；none 夹具 ⇒ 兜底键零改 | 夹具（双带档子目录 tmp）+ 实景 `d:\teamcode` 双跑 |
| AC-2 批档 create 落正确基底或显式拒 | 歧义锚 + `thincoder/docs/batches/<x>.md` ⇒ 落 `thincoder/docs/batches/`；裸 `docs/batches/<x>.md` ⇒ 拒（含候选）；self 锚 + 他项目目标 ⇒ 拒（#827 ⑤ 零改） | 夹具三跑 + `batch-mechanics` 复跑 |
| AC-3 批档读面 | 歧义锚 + 在档相对串（候选基底内）⇒ 读面 / spawn 门解析成功 | 夹具 + `resolveBatchReadPath` 直调 |
| AC-4 写门覆盖（增强腿） | 歧义锚 + 绑定档在候选内 + 目标 = 他批 `.md`（同候选基底）⇒ **拒**（先红——旧码放行） | 夹具直调 `batchRecordWriteConflict` |
| AC-5 回归零变 | self ∥ none 两态既有行为全绿（BR-27–BR-35 ∥ `batchDocBases` 缺省值 ∥ 导出面） | 复跑清单全绿（§2.5） |

### 2.7 机检 / 回归面

**本席落地门（终读）**：`node scripts/doc-check.mjs --root .`（cwd = `thincoder/`）⇒ **悬空 0**（OK——阈值 0；候选 45097）∥ **行宽 OK**（无 >300 非表格行）∥ 行数面 = 差异 2 条（既有存量——`PACKAGING.md` / `E2E-TESTING.md`，非本批）。**首跑三宽四悬空（皆本席新增行）已收正**：`advisor.mjs` 同名两档歧义 ×3 + `tools/shared.mjs` 后缀歧义 ×1 ⇒ 全路径实点；`BATCH-RECORD.md` ∥ `ENG-TOKEN-BINDING.md` ∥ `LEDGER.md` 三处新增行超宽 ⇒ 拆行——**触碰五档零新增（复跑核）**。

**回归面（评估）**：M1（manifest 族——`structure-split-2` 导出枚举随动 = 唯一必改件）∥ M4（write-gate——同档异函数；回归锚 `light-round-7`）∥ 批机制族（`batch-mechanics` / `pairfix` 零变面）∥ 台账族（导出面零变）。**仓套件不跑**（空清单；父侧收口一次）——收口测试行照报。

### 2.8 关键决策（KD）

- **KD-1 判定单点** = `projectRootView`（新导出；`resolveProjectRoot` 薄委托）——否决：各面自判 `discoverProjects.kind`（判据双源）∥ 改 `resolveProjectRoot` 本体（破既有 null 语义 / 全仓改基）。
- **KD-2 台账拒绝面** = `openLedger`（存取入口单点）——否决：`ledgerDbPath` 抛（发现面 `findProject` 逐级走查连带砖）。
- **KD-3 批档歧义面** = 「目标所属项目落（∈候选集）」+「无所属显式拒」——否决：一律拒（工作区锚不可用——违「常态须支持」）∥ 无条件按目标所属（与 #827 ⑤ 锚有项目面跨仓拒相抵）。
- **KD-4 文件工具** = 零改 + 记明——否决：按项目归属改写相对路径语义（反标准约定；无锚相对串无归属信息）。
- **KD-5 写门基底并集** = 候选并集（安全面增强——多档锚原漏检 ⇒ 覆盖）——否决：随主基底照旧（fail-open 留口）。

### 2.9 上抛与观察（非阻断）

- **O1 发现 / 通知面语义零改**：`findProject` / `discoverFamily` 仍按「就近已注册台账根」（存在性判据）——多档锚下通知面维持现状（锚条目若在盘照显）；如改 = 三端可见面另议（#828 射程外登记）。
- **O2 桌面单读面**：`thincoder-desktop/src/main/project-info.mjs:41-51` 的 `ledgerRead` 无 try/catch——歧义 cwd 将冒泡 IPC 错误（诚实拒 vs 旧静默 0——呈现面微差）；端侧容错随桌面面触碰另议。
- **O3 `thincoder-core/ledger-migrate.mjs:96` ∥ `:257`** 同式子表达式兜底——歧义锚下迁移基准 = 锚键（未触；触发 = 迁移面触碰 ∥ 用户令）。
- **O4 存量锚键库**：`38478126a2c420a4.db`（0 行——历史误写遗留）留盘；本批不清理用户数据目录（处置 = 用户侧可选 / 另议）。
- **O5 #827 U7 观察补充**：其「双根均空」实读 = 缺省面空因「键控到锚空库」（非环境差）；本批收口后该面变为**显式拒**（症状面消）。
- **O6 轮七回执三项**：① 互引 ✓（§2.4 行 1 ∥ 本 §2 覆盖句）② `:284` 并注 ✓（§2.4 行 2——含第二读点登记；`:491` 同批 ✓ 行 3）③ M4/M6 明细档两处 ✓（§2.4 行 9/10）。**判据语义零改** ✓。

**变更记录（各档一行——已落）**：`docs/core/design/MANIFEST.md:657` ∥ `docs/core/design/LEDGER.md:479` ∥ `docs/core/design/BATCH-RECORD.md:437` ∥ `docs/core/design/ENG-TOKEN-BINDING.md:169` ∥ `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md:168`（另批档本段 = §2 自身）。

**§2.5 口径标注（微修正轮 · 2026-10-02 补记）**：「现行」列行数 = **split 形计数**（`split('\n').length`——较 `\n` 实读计数 +1；如 `manifest-discovery.mjs` 120 ∥ 119）；`MANIFEST.md` §2.3 = `\n` 实读计数——同档两形差 1。**数不动**。（同轮 `MANIFEST.md` 侧变动 = §2.3 + 行 44–47 ∥ 行组枚举随拍（行 39–47）∥ §4 变更记录 +1 行。）

**设计微修正轮 2（#13 代码评审上抛两项 · 父侧全采纳 · 2026-10-02 · eng-designer）**

- **① 悬空指针（🟡）落毕**：`docs/core/design/MANIFEST.md` live 面三处收正——§2.2 `projectRootView` 契约行（`:91-92`——行宽门拆两行）∥ 覆盖位定形注（`:101`，原 `:100`）∥ §3.1 AC-35（`:602`，原 `:601`）：原引「回归守卫 = `thincoder-core/test/manifest.test.mjs:297`」为悬空（该档不存在——仓套件空清单制）⇒ 均改指实守卫 = 批内件 `docs/batches/2026-10-02-manifest-resolution-fix.test.mjs`（基座三态 ∥ 覆盖位 ∥ 薄委托等价逐格）+ `docs/batches/2026-09-29-structure-split-2.test.mjs` 导出枚举探针（AC-35 处）。
- **② 坐标漂移（🔵）落毕**：`MANIFEST.md:204`（§2.3 行 47，原 `:203`）`memoizedBatchBases` 坐标 `:110-116` ⇒ **`:116-122`**（现盘实读：`write-gate.mjs:116` 函数头 ∥ `:122` 闭括号，逐行核）；本档 §2.5 行 7（同引 `:110-116`）同位勘误 = `:116-122`（§2 append-only——以本段为准）。
- **读回（D6）**：三处指针 ∥ 行 47 坐标逐处复读在位 ✓；`MANIFEST.md` §4 变更记录 +1 行（`:682`）✓；`doc-check` 复跑 = 悬空 **0** ✓；行宽面 FAIL 1 行 = 他档并行落笔（见下）。
- **零新语义**（指针 ∥ 坐标收正——判据不动）。
- **并注（范围外 · 报父侧）**：ⓐ `MANIFEST.md:591`（AC-24）同位悬空引尚在——带「机检豁免——用例退场登记」注记（前轮处置形）——本轮零触；ⓑ 全档余存命中分类 = `:682`（本轮变更记录 · 记录面）∥ `:741`（历史条目 · 记录面）∥ `:176`（带注记 · 历史行）∥ `:191`/`:217`（§2.3 历史快照行 · 注）；ⓒ `doc-check` 行宽 FAIL（`docs/core/requirements/PROMPT-SYSTEM.md:115`——395 字符）= 主 agent 23:47 并行落笔（#832 登记——需求面，非本批触碰）——本批面无超宽。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

会话锚解析修复批（多档并存支持）· 设计评审 —— 评审对象 = 三族判定 + 共同基座 `projectRootView(cwd)`（范围 = MANIFEST ∥ LEDGER ∥ BATCH-RECORD ∥ ENG-TOKEN-BINDING ∥ DESIGN-TOKEN-SETTLEMENT 五档；批档 `docs/batches/2026-10-02-manifest-resolution-fix.md` 不在册）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Clarity | 🟡 | 共同基座新导出 `projectRootView(cwd)` 仅一句落 §2.5（MANIFEST.md:277），该档导出契约权威位 §2.2 未收录（对照既有导出注册形——`resolveProjectRoot` 契约行 MANIFEST.md:86）；契约留白：`root`/`candidates` 在 `none`/`ambiguous` 态的空值、candidates 排序、覆盖位（`_setProjectRootForTest` 头部短路）是否含入「行为零变」等价句，均未明写；而 LEDGER.md:64 ∥ BATCH-RECORD.md:247 已把该符号按名作判定依赖。变更记录并称「本档机制条文零改」（MANIFEST.md:657）——机制注册面与批次设计面脱同步。 | 在 §2.2 补 `projectRootView` 契约行（state 枚举 / 空值与排序 / 覆盖位与薄委托等价句），§2.5 条与 §2.2 互指；「机制条文零改」口径按实际改动面收正。 |
| 2 | Affected-file size annotations | 🟡 | 受评五档内无本批代码触碰面的行数 / Δ 标注：`manifest-discovery.mjs`（现 **119**——MANIFEST.md:190 / :199）、`ledger-db.mjs`（openLedger 歧义拒）、`batch-paths.mjs`（条 5）及测试面均无「当前行数 + ≤±N」；MANIFEST §2.3 登记表未增本批行（最新 = 行 38 / MANIFEST.md:190）。若标注落于批档 §2（范围外），本档无指针可核。 | 按 §2.3 既有形补本批行（逐档当前行数 + Δ 上界 + >300 软线触线判定）；标注若落批档 §2，在本档挂指针以免双源。 |
| 3 | Acceptance criteria | 🟡 | 新机制面无验收条目：MANIFEST §3.1 / §3.2 无 `projectRootView` 条目；LEDGER §8 无「歧义拒」AC / 用例，且 §2.1 指针行仍为「验收 = §8 AC-M2-11」（LEDGER.md:73——键归一面，不覆盖新条）；对照 BATCH-RECORD 已补 BR-39–BR-42（:165-168）——三族验收覆盖不均；其余 = 结论式散文（MANIFEST.md:283）+ 批档 §2.7 转指。 | 给 M1 基座与台账拒面各补可机判条目（ok / none 回归 + 歧义拒（零写 + 列候选）+ 薄委托等价）；LEDGER.md:73 指针改指新验收条目。 |
| 4 | Clarity | 🟡 | 歧义锚读面「候选腿追加……仍取首个可读」（BATCH-RECORD.md:249 ∥ BR-41 :167）未钉候选腿之间次序——两候选各含同名可读档时「首个」胜者不定（与行 1 的 candidates 排序未明写同源），跨实现 / 跨端有确定性问题。 | 补一句次序单源（与 `discoverProjects` / `projectView` 的「按名排序」契约同源、并集保序），钉死「首个可读」的判读。 |
| 5 | Document ownership | 🔵 | 家族③（文件工具）以「零改 + 结语」收口（MANIFEST.md:281），但结语落点未声明：细节单源枚举只列 `LEDGER.md` §2.1 ∥ `BATCH-RECORD.md` §4.15 ∥ 批档 §2（MANIFEST.md:282）；§2.9 A「消费面（收口现状）」只列评审门 / 批档基底 / 台账 + 「等余面」（MANIFEST.md:499）。 | 声明家族③结语落点（归文件工具相关设计档或 §2.9 A 消费面行同列），三族枚举保持一致。 |
| 6 | Clarity | 🔵 | MANIFEST.md:284 自指坐标「本 §2.5 读面边界行（`:284` 邻域）」——`:284` 即该注记自身；读面边界行实居 :291（标题）–:292（坐标句），现盘点位不符。 | 坐标改指 :291 邻域，或按条名指谓（「§2.5『普通会话的读面边界』条」）免行号漂移。 |
| 7 | Clarity | 🔵 | BR-42 以 `self`（= `discoverProjects` 的 kind 值）指代「锚有项目」态（BATCH-RECORD.md:168；条 5 尾 :250 同族摘要）——`projectRootView` 态名 = ok/ambiguous/none；容器 + 恰一项目（`unique`——本工作区锚的形态）未具名，读者需自行映射。 | 三档（MANIFEST :277 ∥ BATCH :247-250）统一按 projectRootView 态名或 kind 全列（self/unique/none）措辞，消「self vs ok」混用。 |
| 8 | Acceptance criteria | 🔵 | 新拒面文案可断言性：台账侧有族锚（「项目不可解析」——LEDGER.md:64 ∥ MANIFEST.md:255）但无逐字形；批档侧条 5 / BR-40 拒面（BATCH-RECORD.md:248 / :166）连锚句亦无——与本族惯例（fail-closed 逐字 :256；台账失败文案逐字 :253-254）不一致，机检断言只能依据散文。 | 批档侧拒面补稳定锚句（或逐字文案）；台账侧沿用族锚则明写「按族锚断言」半句即可。 |

范围外注记（无 severity）：批档 §2 判定表 / §2.7 回归面 / §2.9 登记与代码档不在评审范围——本表多条（2 / 3 / 8）最终落点可能已在该档（unverified）；`API-CONTRACT.md` 检索样本未见 `projectRootView` 名面（出范围观察）；`TOOLS.md`（文件工具面）不在册未核；档内代码坐标（`write-gate.mjs:59`/`:60` ∥ `advisor.mjs:120`/`:125`/`:129` ∥ `ledger-db.mjs:51` ∥ `batch-paths.mjs:105`）未对源核验。

计数：🔴 0 · 🟡 4 · 🔵 4
VERDICT: pass

## §4 用户批准（主 agent）

**§4 用户批准（主 agent · 代签 · 2026-10-02 23:2x）**：**依据**（用户 22:05「#827/#828 全自动」+ 22:35「跟多仓机制相关的部分都自动跑到落地」）：① 评审轮 1 = **pass**（🔴 0 ∥ 🟡 4 ∥ 🔵 4——发现表 = §3；8/8 采纳）；② 修正轮 `#10`（8 条）+ 微修正轮 `#11`（观察②③ 全量补全）产物**逐条在盘核验**（MANIFEST `:89-92` ∥ `:195-203` ∥ `:237-241` ∥ `:595-596` ∥ `:666-667` ∥ `:294` ∥ `:297` ∥ LEDGER `:376` ∥ `:424-425` ∥ `:73` ∥ BATCH `:248`/`:252` ∥ `:166`/`:168` ∥ `:250`——父侧抽查在位；门复跑 = 悬空 0 · 行宽 OK）；③ **designToken 已签发**（轮 1 通过回执——值不落档）。**批准 = 实施轮准行**（射程 = §2.3 行 39–47 九档：七码档 + 两测试档）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（多档并存支持三族收口（#828）· 7 码档 + 2 测试档 · 批内件 7 腿全绿 · 回归锚 35 腿复跑全绿 · doc-check 悬空 0 · Δ 全在界）



**实施轮记录（eng-coder · 2026-10-02 23:2x–23:5x · 全自动授权链下执行）**：按 §2 设计面落「共同基座 + 三族收口」——7 码档 + 2 测试档（新批内件 + 结构件导出枚举）；族③（`tools/shared.mjs`）零触；设计档 ∥ #827 家族 ∥ 他批档零写。

**落地表（落点实读 × Δ —— Δ = `\n` 计数，批前 = `git show HEAD` 读数）**：

| # | 档 | 落点（实读） | Δ（设计上界） |
|---|---|---|---|
| 1 | `thincoder-core/manifest-discovery.mjs` | `projectRootView` = `:109-121`（新导出）；`resolveProjectRoot` 薄委托 = `:128-130` | +11（≤ +14） |
| 2 | `thincoder-core/manifest.mjs` | 转口 `projectRootView` = `:44`；契约速览 `:24-25` | +1（≤ ±2） |
| 3 | `thincoder-core/ledger-db.mjs` | `openLedger` 歧义拒 = `:111-115`（先于 `ledgerDbPath` / `mkdirSync` ⇒ 零写） | +8（≤ +10） |
| 4 | `thincoder-core/agent-tools/batch-paths.mjs` | 判定 / 腿 / 拒面 = `:26-35` ∥ `:56-65` ∥ `:99-113` ∥ `:131` ∥ `:161-186` | +44（≤ +55） |
| 5 | `thincoder-core/agent-tools/batch.mjs` | 两调用点注释随动 = `:184` ∥ `:283`（基底集取并集单源） | ±0（≤ ±4） |
| 6 | `thincoder-core/agent-tools/subagent-spawn.mjs` | `logBatchDocRefs` 基底腿注释随动 = `:53` | ±0（≤ ±2） |
| 7 | `thincoder-core/agent/write-gate.mjs` | `memoizedBatchBases` 注释随动 = `:105-107`（并集经 `batchDocBases` 解析单点） | +1（≤ ±4） |
| 8 | `docs/batches/2026-10-02-manifest-resolution-fix.test.mjs` | 新档（7 腿 = 基座 ∥ AC-1–AC-5 ∥ 实景腿） | 新（271） |
| 9 | `docs/batches/2026-09-29-structure-split-2.test.mjs` | 导出枚举 `:110` ∥ `:112` ∥ `:122` | ±0（≤ ±2） |

**红绿证据（先红 → 后绿）**：
- **红**（批前码实测 · tmp 夹具实读）：`projectRootView` 导出缺席（`typeof = undefined`）；`ledgerCount(歧义锚)` = **0**（静默空读）；create 裸串 ⇒ **静默落 `<锚>/docs/batches/`**、所属串 ⇒ **静默嵌套 `<锚>/docs/batches/alpha/docs/batches/…`**；读面候选腿 = `null`；写门他批 `.md` = `null`（漏检放行）；`batchDocBases(歧义锚)` = 单基（仅锚缺省基）。
- **绿**（`node --test docs/batches/2026-10-02-manifest-resolution-fix.test.mjs` ⇒ **7/7 pass**）：基座三态 + 覆盖位 + 薄委托等价；七入口同拒（query ∥ count ∥ add ∥ update ∥ close ∥ `openLedger` 读 / 写）+ **零写**（台账目录未建）+ none 兜底键零改；create 所属落基底 / 裸串拒（机检锚 `ambiguous session anchor` + 候选全列 + 锚下零写）；ok ∥ none 零改；读面候选腿命中；写门并集覆盖 + 三放行面零变；BR-27/28/29/30/31/32/34/35 抽样零变。
- **回归锚复跑**（复跑清单全绿）：`2026-09-29-batch-mechanics` 5/5 · `2026-09-30-core-tools-pairfix` 12/12 · `2026-09-29-residuals-round2` 12/12 · `2026-10-02-light-round-7` 6/6。
- **门（终读）**：`node scripts/doc-check.mjs --root .` ⇒ 悬空 **0**（OK · 阈值 0）· 行宽 OK · 行数面差异 2 条 = 既有存量（`PACKAGING.md` / `E2E-TESTING.md`——非本批）。
- **工具面实读（fresh 进程）**：缺省锚 ⇒ 拒（「项目不可解析」+ 两候选绝对路径全列）∥ 显式 `D:/teamcode/thincoder` ⇒ 读数 **36**。会话内进程为改动前模块图缓存（缺省面读数不体现新码——重启后生效）；fresh 进程口径见上，批内件实景腿同判（锚拒 + 显式根照常）。

**逐行核（读回）**：`projectRootView` 三态与 `MANIFEST.md:89-92` 契约逐条对（`ok` ⇒ root 非空 + 候选空 ∥ `ambiguous` ⇒ root null + 全列**按名排序** ∥ `none` ⇒ 双空；覆盖位 = 头部短路 ⇒ `ok` + 覆盖值）；`resolveProjectRoot ≡ projectRootView(cwd).root`（薄委托——行为逐字零变）；台账拒 = 族锚「项目不可解析」+ 候选全列（绝对路径）+ 显式根指引；create 拒面文案与 `BATCH-RECORD.md:252` 逐字对（占位实参化：`<raw>` 原值 / `<candidate>` = `candidates[0]`）；读面腿序 = 候选按名排序、并集保序（条 5 单序）；并集单点 = `batchDocBases`（在飞 ∥ 写门 ∥ spawn 三面同取）——未见第二实现、未见清单外改动。

**内审 ∥ 评审（轮次与终态）**：分歧审计（explore · 只读）= **轮 1**——产品码面 clean，唯一项 = 记录面「§5 未落」（本段即其落笔）；代码评审（advisor · code）= **轮 1** = **pass**（🟡 3 ∥ 🔵 2，无阻断项）——采纳并落地可选修 2 项（批内件夹具临时目录登记回收 ∥ 实景腿按观测态跳跑），复跑仍 7/7。

**报父侧（非本批码面 / 存量，未动）**：① `MANIFEST.md:91` ∥ `:601`（AC-35）的回归守卫指针 `thincoder-core/test/manifest.test.mjs:297` 为**悬空**（核 `test/` 仅 `run.mjs` / `slow.mjs`；`run.mjs:41-43` 空清单制）——本批真守卫 = 批内件基座腿；② `write-gate.mjs` 行 47 坐标（`:110-116`）实点 `:116-122`（漂移 ~6 行，行 45 ∥ 行 46 实点相符）；③ 存量越 300 建议线档：`subagent-spawn.mjs` 438 行 ∥ `batch.mjs` 313 行（本批零增长、未越 500 硬限）；④ 桌面 O2（`project-info.mjs:41-45` `buildScan` 无 try/catch——§2.9 O2 已登记）。

**§5 勘误（分歧审计轮 2 回执 · 2026-10-02 23:5x）**：本段落地表行 2 坐标收正——`manifest.mjs` 转口 `projectRootView` 实点 = `:43`（`:44` = schema 族转口行；行头契约速览 `:24-25` 与其余各档坐标经轮 2 复核实点相符）。轮 2 终态 = **clean**（🔵 2：本勘误项 + 批内件夹具构造序观察——均非四类偏差项，后者可不动作）。

**微修正轮 2 补记（码侧注释收正 · 2026-10-02 23:45）**：#13 代码评审 🟡① 码侧半落地——`thincoder-core/manifest-discovery.mjs:94` 回归守卫指针由悬空 `test/manifest.test.mjs`（该档不存在）收正为实守卫（本批批内件基座腿 `docs/batches/2026-10-02-manifest-resolution-fix.test.mjs` + `docs/batches/2026-09-29-structure-split-2.test.mjs` 导出枚举探针——与设计侧修订轮同措辞）；行为零改（纯注释）· `node --check` OK · 读回无残留 · 批内件复跑 7/7 全绿 · 他档零触。

**内审 ∥ 评审（微修正轮 2 回执）**：分歧审计（explore · 只读）= **clean**（四类偏差零——注释在位 ∥ 无残留 ∥ 被引守卫真实 ∥ 写面合规）；代码评审（advisor · code）= **pass**（🟡 2 ∥ 🔵 1——皆报告项·非必修：① 被引 split-2 件自declared「断代失效」（措辞面——待父侧与设计面同拍复核）∥ ② 同档 `:25` T54 死指针（写域外——登记指针清扫族）∥ 🔵 = `:100` 覆盖位断言唯一性注记）——细目见 coder 交付报告。

## §6 验证与收口（父代理）

**§6 验证与收口（2026-10-02 23:5x · 父侧）**

**核读**：① 码面抽查（父侧实读）——`manifest-discovery.mjs:109-121`（`projectRootView` 三态 + 覆盖位短路 + 薄委托注）∥ `:94-95`（注释指针收正——实守卫）∥ `ledger-db.mjs:110-115`（歧义显式拒 · 零写 · 列候选）∥ `write-gate.mjs:116-122`（`memoizedBatchBases` 实点，与 `MANIFEST.md:204` 坐标一致）；② 设计面——`MANIFEST.md:91-92`/`:101`/`:204`/`:602`/`:682`（微修正轮 2 五项）逐处在位；③ 批内件实跑 = **7/7 pass**（父侧亲跑）。

**门复读**：`doc-check --root .` ⇒ **悬空 0**（总候选 45170）∥ **行宽 OK** ∥ 行数面差异 2 条 = 既有存量报告态（`E2E-TESTING.md` ∥ `PACKAGING.md`，非本批）。

**过程如实**：① 设计（`#6`–`#8`）→ 修正轮（`#10` ∥ `#11`）→ 评审轮 1 = pass（🔴 0）→ §4 代签（23:18）→ 实施 `#13`（7 码 + 2 测试；批内件 7 腿红绿全绿；回归锚 35/35；内审 ×2 clean ∥ 代码评审 pass）→ 微修正轮 2 双面（`#17` 设计面 5 项 ∥ `#18` 码面注释 1 处——父侧裁决「上抛两项全采纳」）；② **竞态澄清**：`#18` 报告「设计面尚未落拍」为并行竞态误报（其检查发生在 `#17` 落笔前）——父侧核读确认设计面已在位；③ 残项上抛：live 面指针两处（`MANIFEST.md:591` AC-24 ∥ `structure-split-2.test.mjs:25` T54）→ 台账 `#833`（归批）。

**结算**：**收口（2026-10-02）**——记录冻结；台账 **#828 核销**（两段式）；提交 = 随收口签入（双远端；哈希以 errata 落邻域）。
