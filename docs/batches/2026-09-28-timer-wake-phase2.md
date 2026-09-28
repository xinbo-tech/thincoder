# 2026-09-28 · timer-wake 阶段 2（VSC + 桌面）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-28 · 来源 = 用户 2026-09-28 13:57 裁定「分阶段实现：先 CLI 后 VSC」（原「不接/认账不排期」形态纠正）；承批 docs/batches/2026-09-27-timer-wake.md（阶段 1 已收口）；台账 #446 + #445。
> 台账 = #446 + #445（AGENT-LOOP · 归批）。前情 = docs/batches/2026-09-27-timer-wake.md §6（已收口 2026-09-27）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-28
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 来源与口径纠正（用户 2026-09-28 13:57）

用户裁定原话：「说好了是分阶段实现先做cli，后做vsc的，怎么就他妈的变成了不接了，还给自己立了理由」。

**纠正（父侧实读 · 两处相抵）**：批 `docs/batches/2026-09-27-timer-wake.md` §2 边界自述 =「VSC / 桌面的自唤醒与可见面接线 = **另批登记**」（分阶段本义）；而需求档 F-TW2 边界句被写成「headless / 桌面 / VSC = **不支持**」、台账 #446 登记为「**认账不排期**」——「后段」被写成「不做」，**以分阶段为准**。成本理由（核件缺 timer 面 / 需新宿主闩等）属实，但只应影响排期，不应改写「做不做」。

### 1.2 本批条目（拟 · 设计轮定形）

| # | 条目 | 说明（父侧已核实读） |
|---|---|---|
| B1 | **VSC 自唤醒 + 可见面** | 前置 = 端差 #445（每 run 清 `_pendingTimers` ⇒ 跨 run 静默丢——须对齐核语义，含 `CORE-UNIFICATION.md:2081` 分类冲突裁定）；+ 自有驱动 timer 兑现 + 空转面（设计定形）+ 可见面 |
| B2 | **桌面自唤醒 + 可见面** | 空闲 deadline 闩（形 = CLI `timer-watch.mjs`；核 `timers.mjs` 三件直消费）+ 窗内兑现（核件 `startSuspension` 可选 timer 面——opt-in 零回归）+ 触发落流小件（`⏰N` 段已在：`renderer/views/statusline.mjs:167-173`） |
| B3 | **口径收正（随批）** | 设计档 §6.30.5 / §6.30.9「不支持」叙事 ⇒ 分阶段；timer 工具描述端限定句（`thincoder-core/agent-tools/timer.mjs:24-25`）如涉修改 = 父侧逐字定稿 |

### 1.3 边界

timer 工具参数 schema 零改；不新增机械门；核件改动仅限 opt-in 面（现宿主不传 ⇒ 零行为变化）；headless = 结构性不支持（空转面不存在）不变；不碰在途批（desktop-idle-wake / align-2）的文件增量。

### 1.4 落点与链序

台账 = #446 + #445（已转「在途」）；需求档 §4.14 F-TW2 / N4 / 批指针收正 = 父侧（已落 · 可 revert）；设计 = eng-designer（本批派单）；授权口径 = 设计 → 评审（用户点火）→ 用户批准 → 实施（eng-coder）；实施面与在途批同片（desktop main/renderer · vscode）⇒ 排后串行。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（收尾轮 + 核件面 fix 轮 + VSC 收尾终锚轮（§6.30.11 两句 + §6.30.13 终表 + VSC-DEBT 同步；本舱两档机检净增 0 ∕ 0））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目（覆盖 = B1–B3 · 台账 #446 + #445）

口径 = §1.2 三件；**逐条机制 / 落点 / 判据 / 边界单源 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.30.10–§6.30.15**（本段只列条目、落点与验收对照，不复述机制）。

| # | 条目（§1.2 来源） | 设计落点（单源） | 验收判据（回指核档） | 边界 |
|---|---|---|---|---|
| B1 | **VSC 自唤醒 + 可见面**（前置 = 端差 #445：每 run 清 `_pendingTimers` ⇒ 跨 run 静默丢） | 核档 §6.30.11 VSC 块 + §6.30.10（端差裁定 = §6.30.1 / D-TW3） | A-TW8 / A-TW11；用例 T-TW22–T-TW26 | 复位行删 + 核三件改调；`docs/batches/2026-09-13-CORE-UNIFICATION.md:2081` 分类行 = 冻结批档历史面（不回改——A-TW8 判据句） |
| B2 | **桌面自唤醒 + 可见面**（空闲闩 + 窗内兑现 + `ev:timer` 触发落流 + `⏰N` 沿用） | 核档 §6.30.11 桌面块 + §6.30.10（核件 opt-in） | A-TW9 / A-TW10；用例 T-TW14–T-TW21 | 核件 opt-in 缺省零行为变化；D16 真机义务在册（E2E 行 `T-DSK44` 拟新增已落——验收由父侧真跑闭合） |
| B3 | **口径收正（随批）** | 核档 §6.30.3 端限定合同句 + §6.30.5 桌面 / VSC 行 + §6.30.9 边界 1 + `docs/core/design/TOOLS.md` §6.7 timer 行 | A-TW12 | timer 参数 schema 零变；合同句逐字 = 父侧定稿（§6.30.3 草稿位） |

**需求回指**：`docs/core/requirements/AGENT-LOOP.md` §4.14 F-TW2（桌面 / VSC = 阶段 2——父侧已落收正）/ N4（VSC 端差 = 本批对齐 · 台账 #445）。需求档笔权在父侧——本设计只报，不改需求档。

### 2.2 设计档落点（本批已落）

- `docs/core/design/AGENT-LOOP-ASYNC-POOL.md`：§6.30.10–§6.30.15（阶段 2 全节）+ §6.30.3 端限定合同句 + §6.30.5 桌面 / VSC 行 ✅ + §6.30.9 边界 1；本收尾轮随动 = 白名单计数重锚（16 ⇒ 17）+ §6.30.13 末块「已落」+ 清项（路径全形五处 / 行宽两处）；变更记录两笔。
- `docs/core/design/TOOLS.md`：§6.7 timer 契约行支持面句（变更记录在册）。
- 端面档七处（本收尾轮落，父侧让档——原「交父侧排期」句随落）：
  - `docs/desktop/design/UI.md:121`（段 12 计时行——触发落流 `ev:timer` + 新鲜度指针）；
  - `docs/desktop/design/IPC.md:29`（事件表增 `ev:timer` 行）+ 事件映射段 `:35` + 载荷键集段 `:38` / `:63` + 会话键面 `:67` / 订阅面 `:70`（计数 16 ⇒ 17）；
  - `docs/desktop/design/RENDERER.md:75`（流内触发行承载句——与消化行族同法）；
  - `docs/desktop/design/PROJECT.md` §10 **BE 行**（`:710` 计数随动）+ §4.2 本批行（`:461`–`:476`）+ **BJ** 行（`:716`）；
  - `docs/render-core/design/RENDER-CORE.md:370`（§10 F 行 ⇒ 已解）；
  - `docs/desktop/design/E2E-TESTING.md`（§4 `:143` + §6 **`T-DSK44`** `:182` + 按批读注 `:193`）；
  - `docs/vsc/design/WEBVIEW-PROTOCOL.md`（§3.2 行 18 / 19 `:100` / `:101` + §6.1 `:231` + §6.3 `:280` / `:297` + §7 D-P11 `:313`）。
- 各档变更记录 +1 笔（七档齐）。

### 2.3 机制设计指要（回指核档——勿复述）

- 核件 opt-in（§6.30.10）：`startSuspension` 三注入项（`timerFace` / `timer` / `clear`）+ 等待第四态 + 兑现支——**缺省零行为变化**。
- 端面接线（§6.30.11）：桌面（键面闩 / 装配三点 / 火面 / 透传 / `ev:timer` / 新鲜度）∥ VSC（端差消解 / 空闲闩 / 自有驱动第三兑现态 / 域文本 / 可见面）。
- 门三件沿用（§6.30.3 + §6.30.10）：唤醒源唯一写点 · 成本闸（合并 / 出列幂等 / 帽 / 撞帽不续跑）· 开关 `agent.timerWake` 默认开（实现 = 端面活读）。
- headless / CLI 零变化（§6.30.11 末段 + §6.30.15）。

### 2.4 受影响文件与测试面（承 §6.30.13）

- 面 = 核 2 档 + 桌面 12 档 + VSC 13 档 + 文档 3 档（核档 §6.30.13 表——行数 = as-of 2026-09-28 实测；实施轮按盘面重锚）。
- >300 档审视：VSC `thincoder-vscode/src/extension/suspension.mjs`（447 → ~472）**不拆**（无新模块职责 / 无新导出族；< 500 硬限；登记面 = `docs/vsc/design/VSC-DEBT.md`）；桌面三档与核档 ≤ 300；越线存量三档登记面 = 各端债务档。
- 测试面 = §6.30.12 末块（用例宿主逐组点名：核 `test/suspension.test.mjs` / 桌面新档 / VSC 原址改例 + 新档）+ D16 真机行（E2E-TESTING.md——拟新增态已落）；测试档随修随加（2026-09-27 裁定）。
- 桌面档面落点六处 + VSC 协议登记 = 本收尾轮已落（明细 = 上 §2.2）。

### 2.5 验收对照（承 §6.30.14 · A-TW8–A-TW13）

| 判据 | 覆盖 | 状态载体 |
|---|---|---|
| A-TW8 | 端差裁定（#445 + 分类冲突） | §6.30.1 裁定句 + §6.30.11 消解落点（复位行删除 / 核三件改调）；`CORE-UNIFICATION.md:2081` 冻结历史面不回改 |
| A-TW9 | 核件 opt-in（零行为变化） | §6.30.10 逐键在位；T-TW14 零回归（既有核测全绿 + 缺省零注册） |
| A-TW10 | 桌面自唤醒 + 可见面 | §6.30.11 桌面块逐条；T-TW17–T-TW21；D16 真机义务在册（E2E-TESTING.md `T-DSK44` 拟新增——父侧真跑闭合） |
| A-TW11 | VSC 自唤醒 + 可见面 | §6.30.11 VSC 块逐条；T-TW22–T-TW26；协议增量登记 = `WEBVIEW-PROTOCOL.md` §3.2（本批两行——已落） |
| A-TW12 | 口径收正（B3） | §6.30.5 表桌面 / VSC 行 ✅；§6.30.9 边界 1；`TOOLS.md` §6.7；合同句 = 父侧逐字定稿 |
| A-TW13 | 机检零新增 | `node scripts/doc-check.mjs --root .`——本收尾轮实测：悬空 **69 ⇒ 64**（净 −5——清项）/ 行宽 **38 ⇒ 35**（净 −3）；本批新行零悬空 / 零行宽超限 |

### 2.6 关键决策（本批）

1. **核件 opt-in 缺省零行为变化**——现宿主不传 ⇒ 逐字等价；被否 = 核件内建 timers 依赖（同机制两套语义）/ 桌面旁路自造第四份驱动（违 KD-34）（§6.30.10 被否备选）。
2. **VSC `suspension.mjs`（447 → ~472）本批不拆**——改动 = 既有等待原语 +1 兑现态 + 既有状态机 +1 判据支（无新模块职责 / 无新导出族）；< 500 硬限；拆分计划登记面 = `docs/vsc/design/VSC-DEBT.md`（§6.30.13 审视块）。
3. **桌面档面持有面处置**——原「行级改动交父侧排期」（在途批占档）经父侧让档后本收尾轮直接落位（六处 + VSC 协议登记）；实施面仍与在途批同片 ⇒ **排后串行**（§6.30.15 边界 4——语义不变，档面句随落）。
4. **`IPC.md` 计数基 = 盘面现值 +1**（父侧裁定）——16 ⇒ 17（含在途批 `ev:ledger` 位）；实施轮基线随各批落定重锚（15 ⇒ 16 ⇒ 17）。

### 2.7 上抛项（实施 / 评审前请父侧知悉）

1. **`T-DSK44` 用例号自铸披露**（E2E-TESTING.md §6 + PROJECT.md §10 **BJ**）——沿 T-DSK37–T-DSK43 先例；并号裁定权 = 父侧。
2. **E2E 行 = 拟新增态**（机检档 `thincoder-desktop/test/integration/timer-wake-face.test.mjs` 拟新增；离线不可产面 ⇒ 人工走查 + 父侧真跑闭合）；用例行随测试档修加（2026-09-27 裁定）。
3. **计数三档并存说明**（防误读）：代码面 `EVENT_CHANNELS` 现盘 = **15**（idle-wake 已落）；`IPC.md` 档面 = **17**（含在途批 `ev:ledger` 与本批 `ev:timer` 两处未落地）；实施轮基线 = 在途批落地后（16 ⇒ 17）。
4. **桌面档面落点已完成、实施面未动**——实施方案排后串行（在途批收口后）；本批零实现码改动。

### 2.8 核件面实施后修正（fix 轮 · eng-designer · 2026-09-28）

承 §5.7「待父侧处置」1–3 + 代码评审 🔵3（父侧裁定 = 修）。设计档三处落笔（单源 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md`；本舱只改设计档——零码面、零越域）：

| # | 项（来源） | 落点 | 结果 |
|---|---|---|---|
| 1 | timer 支 × `AbortError` 容纳句（§5.7 #1——镜像消化支既有语义，不新造） | 核档 §6.30.10 | ✅ 一句（含与消化支对称声明；镜像源 = `thincoder-core/agent/suspension.mjs:219-226`） |
| 2 | `deliver()` 契约钉句（评审 🔵3 / §5.4——B2 接线前钉死） | 核档 §6.30.10 | ✅ 一句（同步 · 严格布尔——判据 `=== true`；非布尔返值 ⇒ 静默零轮） |
| 3 | §6.30.13 两行实测重锚（§5.7 #2） | 核档 §6.30.13 | ✅ 两行收正（`agent/suspension.mjs` 240 ⇒ **273** · `test/suspension.test.mjs` 264 ⇒ **300**——该档抵 300 行门，补例须拆档 ∕ 登记） |

- 验收对照：① 三处落笔 ✅（§6.30.10 两句 + §6.30.13 两行）；② 变更记录 +1 ✅；③ 机检读数已报（下行）。
- 机检（`node scripts/doc-check.mjs --root .` · 2026-09-28 实测）：悬空 **64** · 行宽 **35**——与 §4 基线**持平**（净 0 / 0——本批新行零悬空、零超宽）；行数 = `wc -l` 口径实读（273 ∕ 300）。
- 边界：timer 轮中止容纳的**实现**（核件 catch 支）不在本舱——归实施舱随修（父侧口径）；本舱零码面改动。
- 表外报出（只报未改）：① 「settle/wake 先到 ⇒ 撤句柄」用例缺位仍开放（§5.7 #3——加例须拆档 ∕ 登记；前提句已随 §6.30.13 行注提记）；② timer 轮中止容纳句的对应用例同缺（同 300 行门约束）；③ 消化支「回合级中止」句在设计档本体无独立句——本轮镜像源 = 源码 `thincoder-core/agent/suspension.mjs:219-226` + §6.8 既有回合级停语义（未新增消化支句）。

### 2.9 VSC 收尾终锚（fix 轮 · eng-designer · 2026-09-28）

承 §5.15（含勘误）+ §5.9 转报（父侧裁「修」）；本舱 = 设计档点修两档（`docs/core/design/AGENT-LOOP-ASYNC-POOL.md` + `docs/vsc/design/VSC-DEBT.md`）——零码面、零越域：

| # | 项（来源） | 落点 | 结果 |
|---|---|---|---|
| 1 | VSC 开关生产者句（§5.15 表外报出 1 · 评审 🟡1） | 核档 §6.30.11 VSC 块 | ✅ 一句（本席实读链逐格在位：`setup.mjs:153` ∕ `:177` ∕ `:196` → 白名单消费位 `agent-state.mjs:100` → 读面 `timer-watch.mjs:34`） |
| 2 | 窗内容纳句（§5.15 表外报出 1 · 评审 🟡2） | 核档 §6.30.11 VSC 块 | ✅ 一句（`AbortError` ∧ 会话未停 ⇒ 容纳并重入——§6.30.10 句推广至端面自驱窗；实读 = `extension/suspension.mjs:381-393`） |
| 3 | §6.30.13 终表（§5.14 #3 + §5.15 表外报出 1 + §5.9.5 #1） | 核档 §6.30.13 | ✅ 补 `thincoder-vscode/src/agent/setup.mjs` 行 + 全表按**现盘实读**重锚（`wc -l` · 逐档实读；桌面若干档含并行批增量者两值并注） |
| 4 | VSC-DEBT 同步（§5.15 表外报出 2） | `docs/vsc/design/VSC-DEBT.md` §12.1 + §11 | ✅ 读数重锚（`setup.mjs` 421⇒427 · `suspension.mjs` 447⇒483）+ 测试档越线登记（`test/timer-wake.test.mjs` 396 首登） |

- 验收对照：① 四处落笔 ✅（§6.30.11 两句 + §6.30.13 终表 + VSC-DEBT 两处）；② 变更记录各 +1 ✅；③ 机检——本舱两档 **零新增悬空 ∕ 零新增超宽**（逐行集比对）。
- 机检读数（`node scripts/doc-check.mjs --root .`）：开测 **悬空 65 / 行宽 36** ⇒ 本舱改后两档净增 **0 ∕ 0**（总读数随他席并发波动——跑间 `docs/desktop/design/PROJECT.md` ∕ `RENDERER.md` 被他席改动，行号漂 + 行宽 +2——非本舱）。
- 行数实读（`wc -l` 口径 · 本舱末态）：核档 **741** · `docs/vsc/design/VSC-DEBT.md` **734**。
- 表外报出（只报未改）：① §6.30.12 用例表未登记 §5.15 修正轮三新例号码位与容纳句（§5.15 审计 🔵 在册——未在本轮派单，未动）；② 派单读数两则按实况落：`timer-watch.mjs` 110 ⇒ 实读 **117**（§5.15 勘误）；`agent-state.mjs 421⇒427` ⇒ 按 §5.15 实况 = **`setup.mjs` 421⇒427**（VSC-DEBT 无 `agent-state.mjs` 读数行）；③ 开测读数 vs 批档记载基线（64/35）**+1/+1**——系他舱先落（候选 = `WEBVIEW-PROTOCOL.md:421` §12 短形坐标 ∕ `RENDERER.md:76` 落文），只报未改。
- 边界：纯回填 + 读数重锚（机制 ∕ 语义零改）；核件 ∕ 桌面 ∕ VSC 码面零触碰；两档外零触碰。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**设计评审（timer-wake 阶段 2 · VSC + 桌面自唤醒 + 可见面）**——范围 = 声明的十档（批档 §2 · 核档 §6.30.10–§6.30.15 · TOOLS.md §6.7 · desktop 五档 · RENDER-CORE §10 · WEBVIEW-PROTOCOL §3.2/§6/§7）。
限制（如实）：源码面不在评审范围 ⇒ 设计档所引源码坐标与代码行读数未独立复核（unverified）；doc-check 读数（悬空 69⇒64 / 行宽 38⇒35）未复跑（只读评审）；行数标注仅做档内一致性核对。

| # | 类别 | 严重级 | 发现 | 建议 |
|---|------|--------|------|------|
| 1 | 受影响文件行数标注 | 🟡 | §6.30.13 表内 `store.mjs`（`AGENT-LOOP-ASYNC-POOL.md:627`）· `panel-callbacks.mjs`（`:637`）· `webview/state.js`（`:640`）三档「现行行数」列写 `—`（criterion 8 要求逐档现行行数 + 增量）；其中 `store.mjs` 现行值在 `docs/desktop/design/PROJECT.md:483` 已给（**307**） | 逐档回填现行行数（as-of 盘面：`store.mjs` = 307 等）；增量列保持 |
| 2 | 受影响文件（>300 档审视） | 🟡 | §6.30.13「>300 档审视（阶段 2 触及）」块（`:647-649`）只列 VSC 三档 + 桌面 `views/chat.mjs`；本批触碰且 >300 的 `thincoder-desktop/renderer/events.mjs`（`:624`：393 → ~403）与 `renderer/store.mjs`（`PROJECT.md:483`：307 ⇒ 308）未列——缺逐档「不拆 + 理由 / 登记面」句 | 补两档行（照既有式：本批不拆 + 理由 + 登记面 = 桌面债务档 `PROJECT.md` §4.2 / §4.1 越层段） |
| 3 | 文档状态（跨档计数滞后） | 🟡 | IPC.md §1 盘面现值 = **十八通道**（含 `ev:timer` 与在途批 `ev:queue`——`docs/desktop/design/IPC.md:40` / `:70` / `:73`），而核档 §6.30.11 / §6.30.13（`:579` / `:623` / `:626`）、批档 §2.7（`docs/batches/2026-09-28-timer-wake-phase2.md:97`）、`PROJECT.md:723`（BE 行）仍记 **16 ⇒ 17** | 实施轮以盘面实读重锚（档面现读 18 / 代码面现读 15 ⇒ 落地后同值 18）；三处字面同批收正（位序说明随正：15 ⇒ 16 ⇒ 17 ⇒ 18） |
| 4 | 文档状态（同档内失效指称） | 🟡 | §6.30.8 的 A-TW3（`:540`）/ A-TW4（`:541`）仍以「§6.30.5（桌面 / VSC **不接** + 理由 + 后续登记）」为判据句，而同档 §6.30.5（`:463-464`）桌面 / VSC 两行已改 **✅（阶段 2）**——同档两处读法相抵。判为**文档状态不一致**（🟡 报出即修）；机制面（§6.30.5 ∕ §6.30.10–§6.30.11 ∕ §6.30.15）彼此一致，非机制级描述冲突 | 照 §6.30.9 边界 1（`:548`）的处置，给 A-TW3 / A-TW4 补「阶段 2 已接线」限定句，或明标其为阶段 1 历史判据 |
| 5 | 批档坐标（as-of 漂移） | 🔵 | 批档 §2.2 七档落点坐标多处与盘面不符（在途批并行改档所致）：IPC.md `:35`→`:36` · `:38`/`:63`→`:40`/`:65` · `:67`/`:70`→`:70`/`:73`；RENDERER.md `:75`→`:76`；PROJECT.md `:461`–`:476`→`:470`–`:485` · BE `:710`→`:723` · BJ `:716`→`:729`；E2E-TESTING.md `:182`→`:183` · `:193`→`:195`；WEBVIEW-PROTOCOL.md `:297`→`:300` · `:313`→`:316`（其余 `:29` / `:100` / `:101` / `:121` / `:143` / `:231` / `:280` / `:370` 等命中） | 按盘面重锚（或改记档名 + 段落名，少用逐行号——并行批次下逐行号必漂） |
| 6 | 测试面口径（E2E 档三处不一） | 🟡 | T-DSK44 机检面三处指称不一：`E2E-TESTING.md:143`（§4）列集成档 `test/integration/timer-wake-face.test.mjs`（≈120）并标**全档**「离线不可产」；同档 `:183`（§6）把机检面指到单元档 `thincoder-desktop/test/timer-wake.test.mjs`（T-TW17–T-TW21）且只把 ③ 标离线不可产；批档 §2.7（`:96`）又以 `timer-wake-face.test.mjs` 为机检档 | 统一三处（机检面档名 + 逐条离线可产 ∕ 不可产标记）；若该集成档确无离线可产断言 ⇒ 明记「内容 = 离线不可产组 + 人工走查 / 真跑闭合」，免「行数预算已给、断言不可产」读法 |
| 7 | 可见面判据缺口（桌面 `ev:timer`） | 🟡 | `RENDERER.md:76` 自记「在场 / 退场路径 = **open**（随实施轮定形）」，核档 §6.30.11（`:579`）只说「流内触发行…与 `ev:digest` 行同族」并经 A-TW10（`:666`）验收——触发行退场判据（页读整置 / 次轮替换 / 常驻）无单源，且该 open 未进核档边界块 | 定退场判据（先例二选一：运行期痕「页读整置即失」= `[data-stopped]` 式 ∥ 消化行族式「`end` 摘除」）；或在 §6.30.11 ∕ §6.30.15 显式登记为 open 项并与 RENDERER.md 同指 |
| 8 | 协调项（逐字文本未到 · R5） | 🟡 | A-TW12（`:668`）判定取决于两处逐字文本（`TIMER_TURN_DOMAIN` 正文 + timer 工具描述端限定句——§6.30.3（`:425` / `:439-441`）只给合同与草稿位，正文待定稿）；批档 §1.2 B3（`:21`）该句写「**如涉修改**」（条件式），与设计侧「须补端限定句」定论不同强度 | 两句逐字文本落定后随批实施（或列为实施前置项在册）；B3 措辞对齐为「须补端限定句」 |
| 9 | 验收 / 用例回指 | 🔵 | A-TW9（`:665`）∕ A-TW10（`:666`）未点名 T-TW15 ∕ T-TW16（核件窗内兑现 ∕ 零交付——`:597-598` 用例表内在册）；VSC 侧无「开关关」例（桌面 T-TW17 含之） | A-TW9 补点名两例；VSC 补「开关关 ⇒ 零注册 / 撤闩」一例或明记覆盖边界 |

**已核通过面**（无发现）：B1–B3 逐条有机制落点与验收回指（§6.30.10–§6.30.15）；端面七档落点实读在位（UI.md `:121` · IPC.md `:29` · RENDERER.md `:76` · PROJECT.md §4.2 `:470-485` + §10 BE `:723` + BJ `:729` · RENDER-CORE.md `:370` · E2E-TESTING.md `:143` / `:183` / `:195` · WEBVIEW-PROTOCOL.md `:100` / `:101` / `:231` / `:280` / `:300` / `:316`）；各档变更记录 +1 笔齐九档；核件 opt-in 缺省零行为变化口径与 §6.30.15 headless 边界自洽；文档归属面（机制单源 = §6.30 / timer 契约单源 = TOOLS.md §6.7 / 端面只登记形态并回指）未见碎片化。
（文档地图未声明 ⇒ Document ownership 维度按各档自述单源句判定。）

**计数**：🔴 0 · 🟡 7 · 🔵 2 —— 无阻断项（🟡/🔵 不阻批准）。
VERDICT: pass

## §4 用户批准（主 agent）

### 4.1 评审与修正落定
- **设计评审轮 1 = pass**（0🔴 · 7🟡 · 2🔵——报告全文入 §3，评审员直写 · 2026-09-28 14:4x）。
- 修正落定（**父侧直接执行 · 可 revert**——九项逐条处置，明细见回执表）：核心落点 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md`（`:441-442` 合同句定稿 + `TIMER_TURN_DOMAIN` 复用句 · `:541-542` A-TW3/A-TW4 阶段 2 限定 · `:580-581` 计数 18 + 触发行生命期 · `:610`/`:613` T-TW27 + 宿主 · `:625-629`/`:639`/`:642` 行数三补 + 计数 · `:651-652` >300 两档 · `:655` 末块计数 · `:666`/`:668` A-TW9/A-TW11 · `:685-687` 变更记录）；`docs/desktop/design/E2E-TESTING.md:143`/`:183`/`:195`/`:258`（T-DSK44 机检面三处统一）；`docs/desktop/design/PROJECT.md:723`/`:949`（BE 行计数链 15 ⇒ 16 ⇒ 17 ⇒ 18）。
- 机检复核（`node scripts/doc-check.mjs --root .`）：**悬空 64 · 行宽 35**——＝设计收尾轮后基线，净增 **0 / 0**（修正引入的五处超宽已折行清）。
- **注记两则（记录面）**：① §2.2 坐标 = as-of 快照（并行批改档致漂）——**盘面实读为准**，记录段不回改（§3 轮次 1 发现 #5 处置）；② §1.2 B3 句「如涉修改」按设计侧定论读 = **须补端限定句**（§1 不回改，本注为准）。

### 4.2 批准（代签）
- 批准依据 = 用户全链自动授权（2026-09-28 12:23 / 12:29「后续自动跑完吧」）+ 设计评审 pass + 九项处置落定。
- **§4 = 已批准 2026-09-28（主 agent 代签）**。
- 实施口径：设计凭证在册（本会话持有）；**实施排期 = 对齐第三批三舱落地后**（同片文件串行——设计 §6.30.15 边界 4 在册）；D16 真机义务随实施轮（`T-DSK44` 人工走查 + 父侧真跑闭合）。

## §5 实施记录（eng-coder）

**状态行**：实施完成（核件面 + VSC 宿主面两舱 + VSC 宿主面修正轮（2026-09-28 · 见 5.15））

### 5.1 交付摘要（核件面 · B2 前置 · 承核档 §6.30.10 · 验收 A-TW9）

| # | 档 | 行数（wc 口径 · 241/264 ⇒ 实测） | 内容 |
|---|---|---|---|
| 1 | `thincoder-core/agent/suspension.mjs` | 240 ⇒ **273** | 三注入项（`timerFace` / `timer` / `clear`）+ 等待第四兑现态 `timer` + 循环兑现支；缺省不传 ⇒ 零注册、零新路径 |
| 2 | `thincoder-core/test/suspension.test.mjs` | 264 ⇒ **300** | 原址补例 T-TW14–T-TW16（三例各自独立 `test()`；rig 共用） |

落点（实施后实读行号）：契约头注 `agent/suspension.mjs:20-34`（runTurn 行补 timer 轮形 + timerFace ∕ timer ∕ clear 两行）；等待第四态 `:123-159`（`onTimer` `:148` · `cleanup` 摘句柄 `:131-135` · 注册 `:152-155`）；deadline 每轮现算 `:234-237`；兑现支 `:242-248`（`runTurn("", { autoTurn: true, timerTurn: true })` + `hooks.reclaim` + `hooks.onCounts` + `continue`）；用例 `test/suspension.test.mjs:266-300`（rig `:267-277` · T-TW14 `:279` · T-TW15 `:285` · T-TW16 `:292`）。

### 5.2 决策透明表

| 决策 | 取舍 / 依据 |
|---|---|
| 兑现支只发 `reclaim` + `onCounts`（不发 `onDigest` 边界） | 依 §6.30.10 括号枚举逐字；桌面宿主亦不注册 `onDigest`（零双帧） |
| 等待注册带 `unref` 尽力 + 负延迟夹 0 | 与 CLI 同原语先例同形（§6.30.11 形 = CLI）；审计判「增写 · 轻」（非四类偏差），已报父侧 |
| 三例共用紧写 rig | 测试档受核卫生门 ≤300 行约束（任务书：表外档零改）⇒ 用例紧凑但逐条独立 `test()`、断言完整 |
| `deliver()` 判据 = 严格恒等 `=== true` | 设计明写「返回布尔」⇒ 契约忠实；接线风险（非布尔返值 ⇒ 静默零轮）已报父侧（评审 🔵3） |

### 5.3 轮次段（分歧审计 ∕ 代码评审 ∕ 自修）与终态

- **分歧审计**（explore · 只读）：**clean —— 四类偏差均无**（PARTIAL / SILENT-SIMPLIFICATION / DOC-DRIFT / OUT-OF-LIST）；契约三键 + 第四态 + 兑现支 + 交付假支逐格在位，T-TW14–T-TW16 逐格覆盖；表外两条已转报。
- **代码评审**（advisor · code · 轮 1）：**pass —— 0 🔴 · 2 🟡（均未标 must-fix）· 3 🔵**。
- **自修轮**（轮 1）：零成本项收口（见 5.4）；无 must-fix 遗留 ⇒ **终态 = converged**。

### 5.4 fix round 明细

- 收口：`clear` 键折入 rig 与断言（T-TW14「零注册 ⇒ 零清理」· T-TW15「撤句柄恰一次」）；三处注释精度（等待面宿主不变式「到期即出列 ∕ 关即 null」· 兑现支「= `reclaim` + `onCounts` 两钩，不发 digest 边界」· 「交付面 = 同步 · 严格布尔」）。
- 不修（转父侧裁）：timer 支缺 `AbortError` 容纳（与消化支不对称——设计未覆盖该路径，涉 §6.30.10 语义）；「settle/wake 先到 ⇒ 撤句柄」用例缺位（加例需拆档 ∕ 登记——测试档已在 300 行门）。

### 5.5 验证读数（实施轮实测）

| 命令 | 读数 |
|---|---|
| `node --test test/suspension.test.mjs`（本面档） | **11/11 pass**（既有 8 例 + T-TW14–T-TW16） |
| `node test/run.mjs`（核套件 · 既有跑法；含核卫生门 T-C14/N8） | **770/770 pass · 0 fail** |
| `node --test test/agent-host-suspension.test.mjs`（桌面消费端档——`node_modules/@thincoder/core` junction → 本仓核件，实测真path 确认） | **11/11 pass** —— 缺省零行为变化实证 |

### 5.6 越域披露

- 改动集 = 任务书两档；`docs/**` 零改、桌面 ∕ VSC 面零触碰 ⇒ **零越域**。
- 表外发现（只报未改）：① 核档 §6.30.13 两行数标注需按实测重锚（核件 ~+25 ⇒ +33 · 测试 ~+30 ⇒ +36）；② 测试档已抵 300 行门（再增行须拆档或登记）；③ 评审 🔵3 契约句（`deliver()` 同步 · 严格布尔）建议 B2 接线前在 §6.30.10 显式化。

### 5.7 待父侧处置

1. **timer 支 × `AbortError` 容纳**（评审 🟡1 · 审计同面）：关内未覆盖——若要「回合级中止 ⇒ 重入」（与消化支同判），需**设计侧补句**后再实施（本舱未自铸）。
2. 核档 §6.30.13 行数重锚 + 测试档 300 行门处置（拆档 ∕ 登记）。
3. 「settle/wake 先到 ⇒ 撤句柄」用例缺位（评审 🟡2 残面）——随 ①∕② 一并定形。

**勘误（同段补记）**：5.1 表头「241/264」系笔误——核件现行行数 = **240**（承核档 §6.30.13）；其余读数以 5.5 实测为准。

### 5.8 修正轮（fix 第二轮 · 承 §5.7 三项父侧裁定「修」+ 补令；父侧点修派单 · 2026-09-28）

本舱 = 核三档点修（第三档 = 300 行门「登记」路载体，随域披露；designId 同前、零新增语义）。

| # | 项（来源） | 落点（实施后实读） | 结果 |
|---|---|---|---|
| 1 | timer 支 × `AbortError` 容纳（设计句 = 核档 §6.30.10:570——**先读新句后实施**） | `thincoder-core/agent/suspension.mjs:243-255`（timer 兑现支 try/catch 化：判据 `:249` 逐字镜像消化支 `:219-226`；`reclaim`/`onCounts` 留 try 成功路径 `:252-253`；`throw e` `:250`） | ✅ 句 → 码逐条 |
| 2a | 补例 ⓐ `clear` 先到先得臂（settle ∕ wake 先到 ⇒ 撤未触发句柄恰一次——评审 🟡2 余项） | `thincoder-core/test/suspension.test.mjs:302-316`（两臂同判；rig 加 `abortSignal` 注入缝 + `lastCleared` 句柄同一断言） | ✅ 独立 `test()` |
| 2b | 补例 ⓑ timer 轮中止容纳（`AbortError` ∧ 会话未停 ⇒ 容纳并重入） | 同上 `:318-336`（正臂 + 负臂①非 AbortError ∕ 负臂②会话停；rig 加 `onDigest` 记录面令「零边界」可机证） | ✅ 独立 `test()` |
| 3 | 测试档 300 行门处置（补例后 300 → **336**） | 采**登记**路：`thincoder-core/test/core-hygiene.test.mjs:128`（`SOFT_LINE_REGISTRY` 增 `test/suspension.test.mjs`）+ 注释段 `:108-115`（读数 336 ∕ 越线原因 ∕ 拆分方案 = timer 面用例组拆出邻档 `test/suspension-timer.test.mjs` ∕ 触发条件） | ✅ hygiene 门绿 |

**决策透明表（修正轮）**

| 决策 | 取舍 / 依据 |
|---|---|
| 300 行门 = 登记不拆（未拆档） | 核 hygiene 面既有机制（`SOFT_LINE_REGISTRY`——未登记新超线档 = 红，登记即合规）+ 测试档先例（`test/batch.test.mjs`（473）等「登记不拆——夹具同根 ⇒ 拆档 = 复制脚手架」）；设计档 §6.30.13:625 预裁「后续补例须拆档 ∕ 登记」。故无拆档产物、无两档外新增 |
| 负臂两桩并入 ⓑ | 设计句 :570 含「其余（非 `AbortError` ∨ 会话停）照旧上抛」——补例覆盖全句（含 `!abortSignal?.aborted` 合取面） |
| ⓐ 夹具 deadline 二返 null | 使「撤句柄恰一次」读数不被重入补注册淹没（与 T-TW16 同形）；审计提记在册（未覆盖「wake 先到 ∧ deadline 仍非空」共存面——非设计判据） |
| 零新增语义 | 码面 = 设计句逐条（无计数器 / 日志 / 旗标）；测试面仅注入缝（`abortSignal`）与记录面（`lastCleared` / `onDigest`）扩展 |

**轮次段（分歧审计 ∕ 代码评审 ∕ 自修）与终态**

- **分歧审计**（explore · 只读）：**clean——四类偏差均无**（PARTIAL / SILENT-SIMPLIFICATION / DOC-DRIFT / OUT-OF-LIST）；设计句→码十格逐条在位；两新例变异推演逐桩可抓（无空转断言 / 无造假）；挂账 5 条只报项（含 §6.30.13 重锚归设计侧）。
- **代码评审**（advisor · code · 轮 1）：**pass——0 🔴 · 1 🟡 · 2 🔵**。🟡 = 测试档 336 > 300 软线（已按设计预裁登记 ⇒ 非 must-fix、无需动作）；🔵 = 容纳谓词对「未注入 `abortSignal`」判「未停」（设计句逐字，非偏差；端面接线须实传信号）/ 新例沿用 `tick()` 真实等待（本档既有惯用法，非阻断）。
- **自修轮**：零 must-fix ⇒ **零自修轮**。另：实施前完成一次**变异核对**（临时令容纳支失效 ⇒ ⓑ 例转红 `AbortError: Aborted` 穿出 `suspension.mjs:245` ⇒ 复原复绿）——用例有效性实证。
- **终态 = converged（clean）**。

**验证读数（修正轮 · 最终盘面实测）**

| 命令 | 读数 |
|---|---|
| `node --test test/suspension.test.mjs`（本面档） | **13/13 pass**（既有 11 + 补例两桩） |
| `node test/run.mjs`（核套件全量 · 最终盘面） | **772/772 pass · 0 fail**（含 hygiene 门 T-C14/N8 ✔）——§5.5 基线 770 ⇒ +2 = 补例两桩 |
| 行数（wc-l 口径 · node 实测） | `agent/suspension.mjs` **280**（273 + 7）· `test/suspension.test.mjs` **336**（300 + 36）· `test/core-hygiene.test.mjs` **225**（216 + 9）——登记注释读数逐字相符 |
| 变异核对（一次性） | 容纳支临时失效 ⇒ `补例·timer 轮中止容纳` 转红 ⇒ 复原复绿（见上） |

**越域披露**：改动集 = 任务书两档 + **`thincoder-core/test/core-hygiene.test.mjs`**（第三档——300 行门「登记」路载体，父侧「拆档 ∕ 登记择一」口径；仅登记条目 + 注释段，判据零改）。`docs/**` 零改；桌面 ∕ VSC ∕ 其余核档零触碰。

**表外报出（只报未改）**：① 设计档 §6.30.13:624-625 两行读数（273 ∕ 300）待设计侧按新盘面重锚（280 ∕ 336）；② 设计档 §6.30.12 用例表未含补例两桩（号码位归设计侧）——hygiene 注释 `:115` 已自记「待设计侧随批收正」；③ 审计提记：ⓐ 未覆盖「wake 先到 ∧ deadline 仍非空」共存面（非设计判据）；④ 审计提记：补例随既有 T-TW14–16 仅跑 CLI 形夹具（timer 面机制对载体零预设，非偏差）。

### 5.8 桌面面（B2 · 本舱 · eng-coder · 承 §2.1 B2 / A-TW10 · 2026-09-28）

**交付矩阵**（行动表逐条；行数 = `rows()` 内容行口径实测）：

| # | 档 | 现状 ⇒ 终态 | 内容 |
|---|---|---|---|
| 1 | `src/main/timer-watch.mjs`（新） | — ⇒ **79** | 空闲 deadline 闩（**键面 = 会话键** · 一次性到点自撤 · `unref()` 尽力 · `timer` ∕ `clear` ∕ `now` 三注入缝）+ 交付面 `deliverExpiredTimers`（核三件 + `ev:timer` 逐条落流）+ 火面 `fireTimerWake`（`busy` ∥ `inWindow` ⇒ 零动作 · 在途表零触碰） |
| 2 | `src/main/suspension-drive.mjs` | 220 ⇒ **269** | 闩装配 + 窗内 `timerFace` 注入（`deadline` 每轮现算 ∥ `deliver` 严格布尔）+ 三武装点（`start` 未入窗 ⇒ 武装 ∕ 入窗 ⇒ 撤旧 ∥ `closeWindow` 非中止径 ⇒ 重武装 ∥ `abort` / `abortAll` ⇒ 撤闩清点）+ 火面包装（**轮后链尾接管** —— 见 5.8.3）+ `driveTurn` 转发 `timerTurn` |
| 3 | `src/main/agent-host.mjs` | 298 ⇒ **300**（恰线） | 两枚注入面：`busyOf`（在飞判据）+ `takeOver`（轮后接管 —— 复用宿主单点，零二份） |
| 4 | `src/main/turn-face.mjs` | 63 ⇒ **64** | `timerTurn` 透传（核 opts 四件 ⇒ 五件） |
| 5 | `src/preload/preload.cjs` | 58 ⇒ **58** | `EVENT_CHANNELS` 十六 ⇒ **十七**（`ev:timer` 居末位 —— 只增位，既有段定序零动） |
| 6 | `renderer/events.mjs` | 460 ⇒ **475** | `onTimer` 归约（`state.timerNotice[key]` 同键就地替换 · 空串 ∕ 非串零写 · 同值原引用）+ 分派支 |
| 7 | `renderer/views/chat.mjs` | 338 ⇒ **354** | `timerNoticeOf` 切片读面 + 模型 `timer` + 构树行组（非块节点） |
| 8 | `renderer/views/chat-chrome.mjs` | 258 ⇒ **297** | `timerGroupNode`（显示裁 ≤3 行 + `…` —— 逐行落子节点，样式面零改）+ `syncTimer`（幂等 ∕ 换代原位换 ∕ 缺席摘）+ 插点锚 + `blockAnchor` 入列 |
| 9 | `renderer/page-read.mjs` | 116 ⇒ **127** | 首屏页读 ⇒ `timerNotice` 清点（运行期痕 · 整置即失 —— 同 `stopMark` 族） |
| 10 | `renderer/store.mjs` | 307 ⇒ **310** | `timerNotice: {}` 初态 + 档头注 |
| 11 | `renderer/events-subscribe.mjs` | 74 ⇒ **75** | 订阅表十六 ⇒ **十七**（与桥面同集同序） |
| 12 | `renderer/app.mjs`（**清单外** —— 见越域披露） | 297 ⇒ **297** | `CHAT_KEYS` 增 `timerNotice`（帧触发切片表） |
| 13 | `test/timer-wake.test.mjs`（新） | — ⇒ **286** | T-TW17–T-TW21 + 驱动面两例（正常 ∕ 错误径）+ 渲染面一组（归约 ∕ 行组 ∕ 帧刷 ∕ 页读清点） |
| 14 | `test/agent-host.test.mjs` | 472 ⇒ **493** | T-TW21 驱动面（端到端：回合尾武装 ⇒ 空闲到点 ⇒ `ev:timer` + `{autoTurn,timerTurn}` + 零 `ev:digest` 帧） |
| 15 | `test/host-floor.test.mjs` | 349 ⇒ **351** | U76 计数 16 ⇒ 17 + 名单 + 档头注 + `fresh` 入册两新档（≤300 臂） |
| 16 | 计数随动四档（**清单外** · 锁式期望） | — | `test/files.mjs`（新用例档登记）· `test/events-reduce.test.mjs:158/:290`（17）· `test/store.test.mjs:252`（初态键锁）· `test/views-locks.test.mjs:73/:123`（导出面锁 + `CHAT_KEYS` 锁补 `timerNotice`） |

**越域披露（清单外七档，逐档报）**：`renderer/views/chat-chrome.mjs`（`[data-digest]` 同族机制所在 —— align-3 拆档后行组归属地）· `renderer/page-read.mjs`（「页读整置即失」= §6.30.11 明定生命期的落点）· `renderer/app.mjs`（代码评审 🔴 修复：帧触发切片表缺 `timerNotice` ⇒ 可见面不被自身事件触发；补齐 + 加锁）· `test/files.mjs` + 三锁档（新档登记与期望随动）——**`docs/**` 零改 · VSC 面 ∕ 核件零触碰**（核件 opt-in 面 = 前置舱已落，本舱只消费）。

**实现期设计前提修正（须父侧知悉 · 机制语义零变）**：核档 §6.30.13 记 `agent-host.mjs` **285 · ~+12**；盘面实读 **298**（`host-floor` U95 ≤300 臂 ⇒ 余 2 行）⇒ 「装配 + 武装点 + `dispose` ∕ 级联撤闩」无法落该档。按设计自述「装配点（`agent-host.mjs` / `suspension-drive.mjs`）」并名两档 ⇒ **装配 ∕ 三武装点 ∕ 撤闩全部落驱动档**（与窗状态同刻、单点持有），agent-host 只余两枚注入面 ⇒ **恰 300 行（含线上合规）**。§6.30.13 两行（285 ∕ 196 与增量）须父侧按盘面重锚。

**勘误（同段补记）**：上块标题「5.8」与核件舱「5.8 修正轮」重号 —— 上块读作 **§5.9 桌面面（B2）**（块内 `5.8.3` 读作 `5.9.3`）；本续块 = 同块续段。

**§5.9.1 轮次段（分歧审计 ∕ 代码评审 ∕ 自修）与终态**

- **分歧审计**（explore · 只读）：PARTIAL **0** · SILENT-SIMPLIFICATION **0** · DOC-DRIFT **1**（🟡 —— §6.30.13 两行「285 ∕ ~+12」「196 ∕ ~+18」与盘面不符 ⇒ 归文档侧重锚，机制无相抵）· OUT-OF-LIST **1**（🔵 —— 六档全自报、逐档有设计驱动；**未报项 = 零**）。审计另核：`ev:usage.timers` ⏰ 段零改 · T-TW17–T-TW21 逐格在位 · 行数臂（新档 79 ∕ 测试 286 ∕ `chat-chrome` 297 皆 ≤300）。
- **代码评审**（advisor · code · 轮 1）：**1 🔴 · 6 🟡 · 2 🔵**。🔴 = 帧触发切片表缺 `timerNotice`（`renderer/app.mjs:66` `CHAT_KEYS` ⇒ 可见面不被自身事件触发、交付当刻不可见）；🟡 = ① 火面 timer 轮链尾接管缺位 + `skipSession` 注释断言不实 ② timer 轮抛错径零重武装 ③ `RENDERER.md:76` 生命期仍记 open ④ 通道计数代码 17 ∕ 档面 18 并存 ⑤ 行数门未覆盖 `chat.mjs` ∕ `store.mjs` 两越层档 ⑥ `T-DSK44` 真机档未产（协调项）；🔵 = 两处族内序枚举缺项 + §6.30.13 行数漂移。
- **自修轮（轮 1 · 本舱）**：🔴 与 🟡①② 就地修复（5.9.2）· 🔵 枚举两处收口；🟡③④⑤⑥ 与 🔵 行数漂移 = **父侧项**（docs ∕ 门登记面 ∕ D16 真机面 —— 本舱 `docs/**` 零改边界内不可修）。
- **终态 = converged（本舱可修面清零）**：修复后全量套件 **250/250 绿** + 冒烟三值复跑（5.9.3）。

**§5.9.2 自修明细（fix round 1）**

| # | 项（来源） | 落点（实施后实读） | 结果 |
|---|---|---|---|
| 1 | 🔴 帧触发切片缺 `timerNotice`（评审 1） | `renderer/app.mjs:66`（`CHAT_KEYS` 增 `"timerNotice"` —— 与 `digest` ∕ `stopMark` ∕ `ledgerLines` 同族；**清单外档**）+ `test/views-locks.test.mjs:123`（源面锁补该键） | ✅ 可见面纳入帧触发；锁两向 |
| 2 | 🟡① 火面轮后接管 + `skipSession` 假句（评审 2） | `src/main/suspension-drive.mjs:57-67`（`fireIdle` 以 `ran` 旗标 + `finally` 走**轮后链尾接管**：`takeOver(key, agent)` 复用宿主单点 ∥ 缺省回落闩重同步）+ `:32`（`takeOver` 注入面）+ `src/main/agent-host.mjs:118`（透传 —— 函数声明提升，安全）+ `src/main/timer-watch.mjs:71-72`（注释按实况收正：本档只开轮、不接管） | ✅ 与 `send` 径两径同接管同判（池活 ⇒ 入窗消化） |
| 3 | 🟡② 抛错径零重武装（评审 3） | 同 `:57-67`（`finally` 收口 ⇒ 轮内抛错接管照走） | ✅ 补例「T-TW18（错误径）」 |
| 4 | 🔵 族内序枚举缺项（评审 8） | `renderer/views/chat.mjs:23-24 ∕ :204`（根子序补 [到期触发行组?]）+ `renderer/views/chat-chrome.mjs:187 ∕ :211-213 ∕ :255 ∕ :270`（族内序同拍） | ✅ 注释与实现同读 |
| 5 | 自检补例 | `test/timer-wake.test.mjs`（驱动面补「轮后接管恰一次 ∕ 零开轮零接管」+ 新增错误径例） | ✅ 250/250 |

**§5.9.3 决策透明表（本舱）**

| 决策 | 取舍 ∕ 依据 |
|---|---|
| 触发行切片 = **同键就地替换（最近一次交付）**（非行集累加） | 设计 = 「`state.timerNotice[key]` 切片」+「与 `ev:digest` 行同族（同键就地替换）」；`RENDERER.md:76` 生命期原为 open ⇒ 按 §6.30.11「照其现行判据同法（页读整置即失）」定形 = 首屏页读清点（`page-read.mjs`）+ 帧尾判据假即摘（`chat-chrome.mjs`） |
| 行组落 `chat-chrome.mjs`（非仅 `chat.mjs`） | align-3 拆档后 `[data-digest]` 同族机制（构树 ∕ 帧尾同刷 ∕ 插点锚）住该档；`chat.mjs` 只持切片读面 + 构树引调（与 digest 同分形）⇒ 族序 ∕ 锚单源不裂 |
| **装配 ∕ 三武装点 ∕ 撤闩落驱动档**（非 agent-host） | agent-host 盘面 298 ∕ U95 ≤300 臂 ⇒ 设计 285 前提失效；设计自述「装配点（`agent-host.mjs` / `suspension-drive.mjs`）」并名 ⇒ 单点持有（与窗状态同刻）+ 宿主两枚注入面 |
| **timer 轮不发 `ev:digest` 边界帧**（`boundary = autoTurn && !timerTurn`） | 核档 §6.30.10 明句「timer 轮不发 digest 边界」；timer 轮可见面 = `ev:timer` 落流（否则 digest 语汇冒充） |
| 火面非交付 ⇒ **零重武装** | 避「已到期未出列」0ms 重注册（核档 §6.30.10 宿主不变式同判）；重同步交轮后接管 ∕ 回合尾接管 |
| 显示裁在渲染面（≤3 行 + `…`）· 载荷携原文 | §6.30.11「载荷 = 交付原文；显示裁 = ≤3 行 + `…`（CLI 同规）」；逐行落子节点 ⇒ 样式档零改 |

**§5.9.4 验证读数（实施轮 · 末次复跑）**

| 命令 | 读数 |
|---|---|
| `cd thincoder-desktop && node test/run.mjs` | **250/250 pass · 0 fail**（对齐基线 241 ⇒ 新增 9 例：本舱新档 8 例 + `agent-host` 驱动面 1 例） |
| `npx electron . --smoke` | `window:true ∧ ok:true ∧ errors:[]`（`boot:"ok"`）✅ |
| 计数实读（验收 ④） | `preload.cjs` `EVENT_CHANNELS` = **17**（`ev:timer` 末位）∥ `events-subscribe.mjs` `CHANNELS` = **17**（同集同序）∥ `host-floor.test.mjs` U76 断言 17 ∥ `events-reduce.test.mjs` 两处断言 17；档面 `IPC.md` §1 = 18（含在途批 `ev:queue`，代码零命中）—— 三档并存说明承 §2.7 #3 |
| `node scripts/doc-check.mjs --root .` | 悬空 **64** ∕ 行宽 **35** = §4 基线（净增 **0 ∕ 0**；本舱 `docs/**` 零写） |

**§5.9.5 待父侧处置（本舱不可修面）**

1. **§6.30.13 行数重锚**（285 → 300 恰线 · 装配落点描述 · 增量列）+ §6.30.11 若判「轮后链尾接管」为设计欠句则补句 + `RENDERER.md:76`「open」收正。
2. **通道计数重锚**：在途批 `ev:queue` 落地后 17 ⇒ 18 同拍四处（两白名单码档 + `host-floor.test.mjs` + `events-reduce.test.mjs` 两处）。
3. **行数门登记面**：`renderer/views/chat.mjs`（354）· `renderer/store.mjs`（310）· `test/views-locks.test.mjs`（409）三档越 300 而未入 U95 `fresh` ∕ 例外面两清单 ⇒ 建议补入例外面（`{ rel, limit: 500 }`）。
4. **D16 真机义务**：`T-DSK44` 真机档 `test/integration/timer-wake-face.test.mjs`（`E2E-TESTING.md:143/:183/:195` 拟新增）未产 ⇒ 人工走查 + 真跑闭合（A-TW10 真机半）。
5. **表外发现（只报不改）**：`chat-chrome.mjs` `syncLedger` 的 `node._ledgerLines` 短路判据为**死检**（该属性全仓零写入 ⇒ 台账行组每帧恒重建；非本批引入）。

**§5.9.6 边界自证**：`docs/**` 零写 · VSC 面 ∕ 核件零触碰（工作树的他舱改动 = 前置核件舱 + 并行 VSC 舱，非本舱）· timer 参数 schema 零改 · 零新增机械门 · 渲染面零新增定时器（闩在主进程）。

### 5.8 VSC 宿主面（B1）实施记录（eng-coder · 2026-09-28 · 承 5.1–5.7 核件面 · 机制单源 = 核档 §6.30.10–§6.30.15）

**落点与行数**（行数 = `wc -l` 语义 · 盘面实读）：

| # | 项 | 档（全形） | 行数 | 内容 |
|---|---|---|---|---|
| 1 | 复位行删除（端差 #445） | `thincoder-vscode/src/agent/agent-state.mjs` | 159 ⇒ 158 | `resetRunState` 删 `agent._pendingTimers = []`；档头原位注「除外（跨 run 存活）」 |
| 2 | 内联块改调核三件 | `thincoder-vscode/src/agent.mjs` | 457 ⇒ 455 | 9 行内联过滤块 ⇒ `injectTimerReminders(agent, takeExpiredTimers(agent))` + 单源 import；`opts.timerTurn` 读点 + 域文本第三实参 |
| 3 | `timerTurn` 支 | `thincoder-vscode/src/agent/turn-domains.mjs` | 35 ⇒ 37 | 三级选择（`upstreamTurn` > `timerTurn` > digest / 模式——与核同序）；端侧零自持字面 |
| 4 | re-export 核常量 | `thincoder-vscode/src/agent/setup-reminders.mjs` | 140 ⇒ 141 | W15 转口表 + `TIMER_TURN_DOMAIN` |
| 5 | 空闲 deadline 闩（新档） | `thincoder-vscode/src/extension/timer-watch.mjs` | 110 | 一次性闩（单槽 · 到点自撤 · `unref` · 三注入缝）+ 送达（两路共用：出列幂等 → 注入 → 空闲路落盘）+ 火面（非空闲零动作）+ 装配（单例惰性建） |
| 6 | 第三兑现态 + 兑现支 | `thincoder-vscode/src/extension/suspension.mjs` | 447 ⇒ 473 | `waitForSettleOrWake` 增四参面（`deadline` / `timer` / `clear`）+ `onTimer` + cleanup 摘句柄；步骤 4 兑现支；退出 `finally` 武装 |
| 7 | 武装点 | `thincoder-vscode/src/extension/panel-turn-stages.mjs` | 236 ⇒ 240 | `finalizeTurn` 尾武装 + 窗内 `runTurn` 闭包转发 `timerTurn` |
| 8 | 撤闩四点 | `thincoder-vscode/src/extension/chat-panel.mjs` | 426 ⇒ 430 | `dispose` / view 销毁 / 工作区转空三处 + `thincoder-vscode/src/extension/panel-session.mjs`（切槽六路汇合处，322 ⇒ 325） |
| 9 | `usage` 载荷增 `timers` | `thincoder-vscode/src/extension/panel-callbacks.mjs` | 313 ⇒ 316 | `timers: { count, expired }`（核 `_pendingTimers` 活读投影——协议 §3.2 行 18） |
| 10 | 用例（新档 + 原址改例） | `thincoder-vscode/test/timer-wake.test.mjs`（224）· `thincoder-vscode/test/agent-lifecycle-singleton.test.mjs`（409 ⇒ 414） | — | T-TW23 / 23b / 24 / 25 / 26 / 27 六例（零真实等待）；T-TW22 原址改例（纯函数 + `hydrateRun` 两 run 直驱） |

**VSC 端面事实两则（CLI 闩直译不成立处——本档自有形）**：① 闩读**活体** `getAgent()`（顶层 agent 可销毁重建）；② 机读线**按回合自盘重建**（`panel-chat.mjs` `loadedLines = suspLines ?? panel._activeLines(...)`）⇒ 空闲路送达**落盘**（不落盘 = 下一次 run 读不到 = 静默丢）。

**旗标三跳（`timerTurn`）**：`panel-chat.mjs`（opts 解构 + deps）→ `panel-turn-loop.mjs`（ro 字面量 → 核 `runAgent`）→ `agent.mjs`（域文本读点）；窗内闭包 = `panel-turn-stages.mjs`。机检 = T-TW26 末段。

### 5.9 决策透明表（本舱）

| 决策 | 取舍 / 依据 |
|---|---|
| 空闲路送达 = 注入活动会话双线（`_activeLines`）后落盘 | CLI 的 `agent.history` 常驻载体在端侧不存在（机读线按回合自盘重建）；读盘面（权威）而非末 run 内存数组 |
| 闩参数 = `getAgent`（非捕获 agent 对象） | 顶层 agent 可销毁重建——捕获会把闩钉在死载体；活读 ⇒ sync 即对新载体重读 |
| 火面异常兜底 = 落账 + 忙态复位 + 重同步 | CLI `index.mjs` 同形；面板 `_chat` 保底 catch 覆盖不到闩路 |
| `timer` 消息（协议 §3.2 行 19）本舱不发射 | 发射即需 §12 表行（`protocol-coverage` T-5 未登记即红）+ webview 消费位——均属可见面舱域且 `docs/**` 本舱零改 ⇒ 随可见面舱一并落；载荷半（`usage.timers`）本舱已落 |
| `AbortError` 容纳未自铸 | 窗内 timer 支与同档消化支不对称（核档 §6.30.10 对称句未推广至端面自驱窗；CLI 镜像同缺）⇒ 报父侧裁定，本舱不自行加语义 |
| 开关关路径未补生产者 | VSC `agent.config.agent` 白名单整建无 `timerWake` ⇒ 判据恒开；补生产者 = 表外档 ⇒ 按父侧「表外发现只报不改」只报（见 5.14 待处置 1） |

### 5.10 轮次段（分歧审计 ∕ 代码评审 ∕ 自修）与终态

- **分歧审计**（explore · 只读）：**clean——四类偏差均无**；§6.30.11 VSC 块逐格在位；清单外 6 档必要性逐档复核通过。
- **代码评审**（advisor · code · 轮 1）：**pass——0 🔴 · 3 🟡（均未标 must-fix）· 3 🔵**。
- **自修轮**（轮 1）：两处 🔵 收口（见 5.11）；无 must-fix 遗留 ⇒ **终态 = converged**。

### 5.11 fix round 明细

- 收口：① `test/timer-wake.test.mjs` 去挂钟——闩侧注入假钟（延迟断言零容差）；窗内 deadline 断言改「> 0 ∧ ≤ 到期差」区间（同 CLI 用例口径）；② `chat-panel.mjs` view 销毁面补撤闩（与 dispose / 工作区转空 / 切槽三点同族，+1 行）。
- 不修（转父侧裁 / 报）：见 5.14 待处置 1–4。

### 5.12 验证读数（实施轮实测）

| 命令 | 读数 |
|---|---|
| `node --test test/timer-wake.test.mjs`（本舱新档） | **6/6 pass**（T-TW23 · 23b · 24 · 25 · 26 · 27） |
| `node test/run.mjs`（VSC 套件 · 既有跑法） | **1048/1048 pass · 0 fail**（开工基线 1042/1042——+6 本舱用例；复跑同值） |
| `node scripts/check-syntax.mjs`（本仓 lint） | **273 JS files OK** |

### 5.13 越域披露

- 改动集 = 任务书 11 档 + **清单外 6 档（交付必需，逐档理由）**：`thincoder-vscode/src/extension/panel-chat.mjs`（`timerTurn` 解构 + deps 传递——无此旗标永不到循环）· `thincoder-vscode/src/extension/panel-turn-loop.mjs`（deps + ro 字面量——同上）· `thincoder-vscode/src/extension/panel-session.mjs`（切槽销毁点撤闩——设计句点名）· `thincoder-vscode/src/agent/setup.mjs`（注释随正——零行为）· `thincoder-vscode/test/files.mjs`（用例登记——未登记即不跑）· `thincoder-vscode/test/upstream-parity.test.mjs`（域文本调用串结构锁随正——不改即红）。
- `docs/**` 零改（本段 = `batch` 工具写入）· webview ∕ locales ∕ 核件 ∕ 桌面面零触碰。

### 5.14 待父侧处置

1. **开关 `agent.timerWake` 在 VSC 端恒开**（评审 🟡1 · 设计面缺口）：读面在位，但 `agent.config.agent` 由白名单整建（`thincoder-vscode/src/agent/agent-state.mjs` + `thincoder-vscode/src/agent/setup.mjs`）⇒ `config.json` 关不掉（与 CLI / 桌面不一致）；T-TW27 直写桩字段掩盖。补生产者 = 表外档一行（与 `autoThink` 同形）⇒ 裁定：设计补行后随批实施 ∕ 登记为端差。
2. **窗内 timer 支缺 `AbortError` 容纳**（评审 🟡2）：与同档消化支不对称（CLI 镜像源同缺）⇒ 裁定：设计补句或授权同法容纳。
3. **设计 §6.30.13 行数重锚**：`agent.mjs`（表 456 / −5 ⇒ 盘面 457 ⇒ 实读 455）· 新档（表 ~95 ⇒ 实读 110）· 被改测试档现行值未入表；三档 >300 存量（登记面 = VSC-DEBT）随收口重锚。
4. **`timer` 消息（协议 §3.2 行 19）发射 + T-TW25 可见面半**（`⏰N` 段 / 警示 / `chat-messages.js` 流内行 / `status.timer` / §12 表行）随可见面舱——本舱已落载荷半。

### B3 · 口径收正舱（点修 · 两处文本）（eng-coder · 2026-09-28）

**交付摘要**（逐号 · 父侧逐字定稿落地）：

| # | 档 | 落点（实施后实读） | 内容 |
|---|---|---|---|
| 1 | `thincoder-core/agent-tools/timer.mjs` | `:24-25` | timer 工具 description 支持面句收正——原「the idle wake is available on the CLI foreground and suspension window only (other ends keep the step-boundary behavior). 」整句替换为三端前台句（父侧逐字定稿）；其余描述段零动 |
| 2 | `thincoder-core/agent/helpers.mjs` | `:454` | `TIMER_TURN_DOMAIN` 注释句收正：「the CLI latch」⇒「the end's latch」（端不限——零行为）；正文 `:460` 字符串按设计裁定保持逐字勿动 |

**落文逐字（实施后实读 · 机证 MATCH ×4）**：

- `timer.mjs:24` = `    "the idle wake is available on the CLI / VSC / desktop foregrounds and suspension windows " +`
- `timer.mjs:25` = `    "(headless is structurally unsupported); other paths keep the step-boundary behavior. " +`
- `helpers.mjs:454` = ` *  expired while the session was idle and the end's latch opened this turn automatically —`
- `helpers.mjs:460`（域文本正文 · 勿动）= 与阶段 1 复用句逐字相等（未动）

**决策透明表（本舱）**

| 决策 | 取舍 / 依据 |
|---|---|
| 只动两处、零行为改 | 任务书边界（只动两档两处 ∕ 零行为改 ∕ `docs/**` 零改）；发射面 / 语义 / 参数 schema 零触 |
| 🔵（注释框句载体枚举仅「空闲闩」）不修 | 该行 = 父侧逐字定稿（任务书②锁定「注释一句」）；扩写 = 越派单 ⇒ 转报父侧 |
| 🟡（核档 §6.30.3:442 引文 ∕ 落文措辞不一致）不修 | `docs/**` 零改 = 本舱禁区；核档自述「逐字文本 = 父侧定稿（内容权威）」（`:440`）⇒ 收正方向归父侧文档面 |

**轮次段（分歧审计 ∕ 代码评审 ∕ 自修）与终态**

- **分歧审计**（explore · 只读）：**clean——四类偏差均无**（PARTIAL / SILENT-SIMPLIFICATION / DOC-DRIFT / OUT-OF-LIST）。两处逐字实测一致；`helpers.mjs:460` 未动；两档无其他改动（含行为面）；端侧消费链（vscode ∕ desktop `node_modules/@thincoder/core` 解析链）同文——无旧文镜像；锁例零命中（描述 / 注释文本无任何测试锁）。表外两条只报（核档 `:442` 引文措辞 ∕ 核档指向 `timer.mjs` 行指针陈旧——阶段 1 描述面增长所致）。
- **代码评审**（advisor · code · 轮 1）：**pass——0 🔴 · 1 🟡（未标 must-fix）· 2 🔵**。🟡 = A-TW12 所挂「逐字定稿」载体（核档 §6.30.3:442 引文）与落文措辞不一致（内容面与 `TOOLS.md:236` §6.7 / 核档 §6.30.3:441 同判——三端前台 · headless 结构性不支持）⇒ 归父侧文档面收正；🔵 = 注释框句仅覆盖空闲闩载体（既有形态，B3 前已在）/ 批档 `:131` 坐标 as-of 漂移（§4.1 注① 政策）。
- **自修轮**：零 must-fix（🟡 为非 must-fix 文档面项；两 🔵 分别受「逐字锁定」与「docs 零改」边界约束 ⇒ 本舱不可修）⇒ **零自修轮**；终态 = **converged（clean）**。

**验证读数（实施轮实测）**

| 命令 | 读数 |
|---|---|
| `cd thincoder-core && node test/run.mjs` | **772/772 pass · 0 fail**（exit 0；与 §5.8 基线持平——文本面零回归、无锁例需随正） |
| 逐字机证（node 剧本 · 四锚 + 两负断言） | 四锚 MATCH（`:24` / `:25` / `:454` / 域文本 `:460` 未动）；「旧句零残留」PASS · 「三端面在场」PASS |
| 两档 diff（git · scoped 实读） | 恰两处目标行、零夹带：`timer.mjs`（−2/+2）· `helpers.mjs`（−1/+1） |

**越域披露（表外 · 只报未改）**

- 改动集 = 任务书两档两处 ⇒ **零越域**（`docs/**` 零改 · 其余档零触 · 参数 schema 零改 · 零行为改 · 零新增机械门）。
- 表外报出（父侧文档面 / 端面档）：① 核档 §6.30.3 `:442`「合同句（定稿 2026-09-28 · 对应段 = `thincoder-core/agent-tools/timer.mjs:24-25`）」引文与落文措辞不同——A-TW12 把验收挂在该引文上 ⇒ 建议随 §6 收口将 `:442` 引文收正为落文（或裁定反方向）；② 核档 `:435` / `:440` / `:387` / `:430` 指向 `timer.mjs` 的行指针陈旧（阶段 1 描述面增长所致——非本舱移动）；③ `thincoder-cli/README.md:152` `timerWake` 注释仍写 CLI 单端支持面（「CLI foreground / suspension window」——按 CLI 档自身语境不算错；若要求全端一致陈述则由父侧定）。

**本轮不做**：不碰其余档（设计档 ∕ 端面档 ∕ CLI README ∕ 其余核档）；零行为改；不做全量探索（点修）。

### 5.15 VSC 可见面（B1 续 · 2026-09-28）实施记录（eng-coder）——承 §5.14 待处置 4 余项

**范围与边界自证**：任务书 = 批档 §2（设计单源 = 核档 §6.30.11 VSC 块可见面半 + `WEBVIEW-PROTOCOL.md` §3.2 行 18/19 ∕ §6.1 ∕ §6.3）；改动面 = 声明 6 档。发射面（`src/extension/timer-watch.mjs:83`——`{type:"timer", status:"fired", text}`）与 §12 `timer` 行（`docs/vsc/design/WEBVIEW-PROTOCOL.md:421`）均他舱 ∕ 父侧落定，本舱只消费 ∕ 只核对。

**交付摘要（逐条）**

| # | 项 | 落点（实施后实读） | 内容 |
|---|---|---|---|
| 1 | `⏰N` 段（含过期项警示色） | `thincoder-vscode/webview/status-bar.js:62-67` | parts 尾（后台段后 = 状态段簇尾——CLI `render-frame.mjs:422` 对位）；零在途 ⇒ 段零节点；`_timerExpired > 0` ⇒ 警示色 span（同 ctx 段色变量） |
| 2 | `timer` 消息流内渲染 | `thincoder-vscode/webview/chat-messages.js:189-191`（分派）+ `:247-259`（`addTimerLine`） | `{status:"fired", text}` ⇒ `.timer-line` 追加 `ctx.messagesEl` + 跟滚；`text` 逐字落文本节点；显示裁 = ≤3 行 + `…`（CLI `REMINDER_CAP = 3` 同规）；逐行落子节点 = 免依赖样式面（同桌面 `timerGroupNode`）；未登记 status ∕ 非非空串 ⇒ 零动作（fail-closed） |
| 3 | 两计数槽 | `thincoder-vscode/webview/state.js:77-80`（槽）+ `status-bar.js:93-94`（`handleUsageMessage` 落槽） | `m.timers?.count ∕ .expired ?? 0`（旧 host 无字段 ⇒ 零段——后向兼容） |
| 4 | `status.timer` 键 | `thincoder-vscode/locales/zh.json:270` ∕ `en.json:270` | 两语同值 `⏰${n}`（端特有键——核容器零命中；消费 = `status-bar.js:66-67`） |
| 5 | 状态行面用例 | `thincoder-vscode/test/status-line.test.mjs:204`（T-TW25 · ④ 节 `:202`）+ `:54∕:59-60`（清场随新槽扩展） | 四判据（在途 2 ⇒ `⏰2` ∕ 含过期 ⇒ 警示形态 ∕ 空 ⇒ 零段 ∕ 消息 ⇒ 流内一行原文）+ 边界（旧 host 缺字段 · ≤3 行裁 · 空串 ∕ 未登记 status fail-closed） |

**决策透明表**

| 决策 | 取舍 ∕ 依据 |
|---|---|
| 段位 = parts 末位（后台段之后） | CLI「状态段簇尾」+ 协议 §6.1 表行序（后台段 → 计时器段）；VSC 无 ledger ∕ title ∕ enter 段，尾位 = 簇尾同判 |
| 警示形态 = 内联样式（同 `status-bar.js:38` ctx 段先例）而非新 CSS 类 | 本舱「6 档」边界内零 CSS 改动；CLI 用 `C.warn`（`render-frame.mjs:422`）——色变量取同一 `--vscode-editorWarning-foreground` |
| `.timer-line` 零样式规则（同桌面 `chat-timer` 先例——桌面 CSS 亦零命中） | 显示裁逐行落子节点 ⇒ 免依赖 `white-space` 样式面；类名留作后批样式锚 |
| `status !== "fired"` ∕ 空串 ⇒ 零动作 | fail-closed（未登记形态不渲染；禁假造空行——同桌面 `onTimer` 非非空串零写） |
| 两槽不随 `clearMessages` 复位 | 与 `_lastUsage` ∕ `_lastCtxPct` 先例同判（顶层 agent 单例跨 run ∕ 会话存活 ⇒ 与 `_pendingTimers` 真值同源，非陈旧） |

**轮次段（分歧审计 ∕ 代码评审 ∕ 自修）与终态**

- **分歧审计**（explore · 只读）：PARTIAL **0** ∕ SILENT-SIMPLIFICATION **0** ∕ OUT-OF-LIST **0**；DOC-DRIFT **4**（低 ∕ 信息级——全为档面项，归父侧收正面，见「待父侧处置」）。
- **代码评审**（advisor · code · 轮 1）：**pass——0 🔴 · 0 🟡 · 4 🔵**（`.timer-line` 零样式规则 ∕ 载荷无数值断言（与 `ctxPct` 先例同形） ∕ 测试清场与样式串绑定（R4 弱形） ∕ `clearMessages` 不重置两槽（先例一致、非缺陷））。
- **自修轮**（轮 1）：零成本项收口 = 清场补两槽（`test/status-line.test.mjs:59-60`）；其余三项 🔵 判不修（样式面 = 本舱边界内既定「零 CSS」口径（已在决策表记明）· 数值断言与先例同形 · `clearMessages` 先例一致）；零 must-fix ⇒ **终态 = converged（clean）**。
- （advisor 回执附注：其 host 引用核对器报 `locales/{zh,en}.json:270` ∕ `chat-messages.js:259` 三处「file unreadable」——评审侧相对路径解析问题；本席以绝对路径实读复核三处内容在位逐字。）

**验证读数（本舱末次复跑）**

| 命令 | 读数 |
|---|---|
| `cd thincoder-vscode && node --test test/status-line.test.mjs`（本面档） | **8/8 pass · 0 fail** |
| `cd thincoder-vscode && node test/run.mjs`（VSC 套件 · 既有跑法） | **1052/1052 pass · 0 fail** |
| `node --test test/protocol-coverage.test.mjs`（协议机检——§12 行落定后） | **4/4 pass**（`timer` 行 ④ = `活`） |
| `node --test test/timer-wake.test.mjs`（T-TW27 宿主档——在位且绿） | **9/9 pass** |
| `node scripts/check-syntax.mjs`（本仓 lint） | **273 JS files OK** |
| 键表核对（§6.3 表 ↔ 运行时合并器逐键 · 两语） | 表 **24 行** ∕ **24/24 逐字全等**（`status.timer` = `⏰${n}` 两语同值） |
| 变异核对（一次性 · 两桩；已复原） | ① 段条件置假 ⇒ T-TW25 转红（`在途 2 ⇒ ⏰2`）；② `addTimerLine` 早退 ⇒ 转红（`触发落流一行在场`）——复原复绿 |

**越域披露**：改动集 = 任务书 6 档（`git diff --stat` = **+80 ∕ −2**）；`docs/**` 零改（本段 = `batch` 工具写入）· `src/**`（宿主面）∕ 桌面 ∕ 核件零触碰 ⇒ **零越域**。表外发现只报未改（见下）。

**待父侧处置**

1. **§12 `timer` 行已落**（`WEBVIEW-PROTOCOL.md:421`——父侧 ∕ #42 窄授权落定；本舱零越域）——只记，无动作。
2. **DOC-DRIFT 四条（审计 ∕ 本席报出 · 只报）**：核档 `AGENT-LOOP-ASYNC-POOL.md:645-647` 三行增量估值偏小（`status-bar.js` 记 ~+5 ∕ `chat-messages.js` 记 +3 ∕ `state.js` 记 +2；实读 `chat-messages.js` 260 行 ⇒ 实增 ≈ +21）；协议 `WEBVIEW-PROTOCOL.md:231` §6.1 本端现状列「（拟新增——…）」标记滞后（实现已落、§12 已记 `活`）⇒ 归父侧 ∕ 设计侧重锚。
3. **`.timer-line` 样式决策在册**（本舱判零 CSS 改动——同桌面 `chat-timer` 先例）；若父侧要警示 ∕ dim 观感，归后批样式锚。
4. **T-TW27 宿主不变**（`test/timer-wake.test.mjs` 在位 · 套件绿）——任务书括注「T-TW25 状态行面 + T-TW27」按设计 §6.30.12 宿主行读：本舱只落 T-TW25 状态行面，未在其宿主重复铸号。

### 5.15 VSC 宿主面修正轮（承 §5.14 待处置 1–2 + 评审 🟡1/🟡2 · 父侧裁定「修」· eng-coder · 2026-09-28）

**交付矩阵**（逐号；行数 = 实读末行号）：

| # | 项（来源） | 落点（实施后实读） | 结果 |
|---|---|---|---|
| 1 | 开关 `agent.timerWake` 生产者（评审 🟡1——`agent.config.agent` 白名单整建漏键 ⇒ `config.json` 关不掉） | `thincoder-vscode/src/agent/setup.mjs:153`（`cfgTimerWake = DEFAULTS.agent?.timerWake !== false`）· `:177`（`raw.agent?.timerWake ?? cfgTimerWake` 显式键优先）· `:196`（`agentFields.timerWake`——与 `autoThink` 同形）→ 白名单消费位 `src/agent/agent-state.mjs:100` | ✅ 真链闭合：`config.json → loadRaw → cfgBag.agentFields → agent.config.agent` → 读面 `timer-watch.mjs:34` `!== false` |
| 2 | 窗内 timer 支 `AbortError` 容纳（评审 🟡2 · 口径 = 核档 §6.30.10 对称句推广至端面自驱窗） | `thincoder-vscode/src/extension/suspension.mjs:381-393`（try 体 `:382`；判据 `:388` 逐字 = `e?.name === "AbortError" && !susp.abort?.signal.aborted`；`reclaim` / `postSuspension` 留成功径） | ✅ 与同档消化支同判（口径 `:359`） |
| 3 | `timer` 消息发射（协议 §3.2 行 19——`{ status:"fired", text }` 原文逐字；显示裁在 webview 侧） | `thincoder-vscode/src/extension/timer-watch.mjs:83`（交付点逐条 `postMessage`——两路共用：空闲闩 fire ∥ 窗内第三兑现态）；`text` = `injectTimerReminders` 原文（本档零裁切、零文案） | ✅ 与消费面 `webview/chat-messages.js:191`（`case "timer": addTimerLine(ctx, m)`——`status === "fired"` ∧ 非空串校验、≤3 行 + `…` 裁在 webview）对接 |
| 4 | `protocol-coverage` 登记行（§12 以提取器为唯一权威） | `docs/vsc/design/WEBVIEW-PROTOCOL.md:421`（**仅 +1 行** · 父侧授权 docs 例外）：`timer` 行——② `src/extension/timer-watch.mjs:83` · ③ `webview/chat-messages.js:191` · ④ `活` | ✅ T-5 转绿（`--emit` 读数逐字） |
| 5 | 用例随补（开关真链 ∕ 中止容纳 ∕ 发射） | `thincoder-vscode/test/timer-wake.test.mjs`（225 ⇒ **396**）：新增三例（真链例走沙箱 `config.json` + `hydrateRun` 生产链） | ✅ 本档 9/9 绿 |

**同文件缺陷修复（发现即修 · 同一交付点）**：`thincoder-vscode/src/extension/timer-watch.mjs`

- 原状：`takeExpiredTimers(agent, now)`——`now` 缺省 = `Date.now`（**钟函数**），而核 `thincoder-core/agent/timers.mjs:32-34` 判据 = `t.expiresAt <= now`（**时点**）⇒ 比较恒假 ⇒ **窗内路（无 `now` 传参）与一切默认路径零交付**（空闲路因 `fireTimerWake` 恰传 `now()` 而可行）。
- 修复：`takeExpiredTimers(agent, now())`（`:78`）+ `fireTimerWake` 改传 `{ now }`（钟——`:96`），与桌面同形（调用方传钟 ∕ 本档取时点）。
- 证据：修复前 T-TW24 与「触发落流②」转红（零交付 / 零注入）；修复后转绿。非设计外语义（回设计本意：交付点两路共用）。

**变异核对（一次性 · 四桩——用例有效性实证）**

| 桩 | 变异 | 读数（复原后复绿） |
|---|---|---|
| ① 生产者 | `agentFields.timerWake` 注掉 | 真链例红（`actual: undefined, expected: false`） |
| ② 容纳支 | 谓词前置 `false &&` | 容纳例红（`rejected:AbortError` ≠ `null`） |
| ②b 容纳谓词 | 去掉会话停合取 | 负臂②红（`Missing expected rejection: 会话停不纳入`） |
| ③ 发射 | 发点置 `if (false)` | 触发落流例红（`[]` ≠ 一条） |

**轮次段（分歧审计 ∕ 代码评审 ∕ 自修）与终态**

- **分歧审计**（explore · 只读）：PARTIAL **0** · SILENT-SIMPLIFICATION **0** · OUT-OF-LIST **0** · DOC-DRIFT **2**（🟡 §6.30.13 无 `src/agent/setup.mjs` 行 + 核档变更记录缺本舱一笔；🔵 §6.30.11 VSC 块 ∕ §6.30.12 用例表未登记容纳句与三新例号码位——均归设计侧回填。审计限制如实：无执行面 ⇒ 套件 / 提取器读数未复跑，静态逐格核验）。
- **代码评审**（advisor · code · 轮 1）：**pass——0 🔴 · 5 🟡（无 must-fix）· 3 🔵**。🟡 = 设计档回填缺口（同上）+ 三档行数待重锚/登记（`suspension.mjs` 481 ∕ `setup.mjs` 427 ∕ 测试档 396 越 300 咨询线）+ 批档 §5 缺本轮记录段（本段即收口）；🔵 = §12 行短形坐标（重名档约定）+ 测试档头注「零真实等待」措辞 + 容纳支静默。
- **自修轮（轮 1 · 本舱）**：🔵 两项就地收口（测试档头注收正为「零真实**到期**等待」；固定 `sleep(20)` 断言门 ⇒ 条件轮询 `waitUntil(_asyncWaiters 在世)`）；容纳支静默 ⇒ 注释显写「刻意不加（无 digest 计数器可载），非漏写」；🔵 §12 短形坐标 = 父侧「提取器原样」口径 ⇒ 不修（转报）。🟡 五项全属档面 / 登记面（本舱 docs 零改边界内不可修）⇒ 父侧项。
- **终态 = converged（本舱可修面清零）**。

**验证读数（最终盘面实测）**

| 命令 | 读数 |
|---|---|
| `node --test test/timer-wake.test.mjs`（本舱面档） | **9/9 pass**（T-TW23 · 23b · 24 · 25 · 26 · 27 + 三新例） |
| `node test/run.mjs`（VSC 套件全量 · 最终盘面） | **1052/1052 pass · 0 fail**（开工基线 1048 ⇒ +4 = 本舱三例 + 可见面舱一例） |
| `node scripts/check-syntax.mjs`（本仓 lint） | **273 JS files OK** |
| `node test/protocol-coverage.test.mjs --emit --full` | `timer` 行 = `src/extension/timer-watch.mjs:83` ∥ `webview/chat-messages.js:191` ∥ `活`（= §12 新行逐字） |

**越域披露（清单外，逐处报）**

- `thincoder-vscode/src/extension/timer-watch.mjs`（`now` 钟/时点缺陷修复——本舱交付点直连；不修则窗内路与发射例均不可达）。
- `docs/vsc/design/WEBVIEW-PROTOCOL.md` §12 **+1 行**（**父侧授权** docs 例外：「仅 timer 消息相关行列读数落档 · 其余行列零动 · 可 revert」；本舱其余 docs 零改）。
- `thincoder-vscode/test/timer-wake.test.mjs` 头注 / 用例结构随补（任务书点名档）。

**表外报出（只报未改）**

1. 设计档回填（父侧已令「设计侧补句随回填记录」）：§6.30.11 VSC 块补生产者句 + 窗内容纳句；§6.30.13 补 `thincoder-vscode/src/agent/setup.mjs` 行 + 三档行数重锚（`suspension.mjs` 481 · `setup.mjs` 427 · 测试档 396）。
2. `docs/vsc/design/VSC-DEBT.md` 读数滞后：`setup.mjs` 421 ⇒ 427；`suspension.mjs` 447 ⇒ 481；新测试档越线登记缺位（先例 = `ledger.test.mjs` 324 首登）。
3. 批档 §5.9 决策行（`docs/batches/2026-09-28-timer-wake-phase2.md:351`）「`timer` 消息…本舱不发射」现与码面相抵——append-only：本段 §5.15 = 现行态，该行属历史面。
4. §12 新行 ② 列短形 `src/extension/timer-watch.mjs:83`（三端重名档；本档重名档约定 = 全限定——机检当前宽容（`scripts/doc-check-anchors.mjs:171`），仅人读歧义；按「提取器原样」未改）。
5. 可见面舱（#38）webview 消费面已落 ⇒ §12 该行处置 = `活`；若 #38 返工，该格须按提取器重读。

**勘误（同段补记 · 2026-09-28）**：上表 / 报出项 1 的三档行数系评审轮（自修前）读数——自修补注释两行后**现盘面实读** = `thincoder-vscode/src/extension/suspension.mjs` **483**（481 + 2 行注释）· `src/agent/setup.mjs` **427** · `test/timer-wake.test.mjs` **396** · 本舱新档 `src/extension/timer-watch.mjs` **117**；设计侧 / 债务档重锚请以本条读数为准。

## §6 验证与收口（父代理）

### 6.1 亲验（2026-09-28 17:5x · 父侧独立复跑——三套件 + 冒烟）
- 核 `cd thincoder-core && node test/run.mjs` = **772/772 pass · fail 0**；VSC `node test/run.mjs` = **1052/1052 · fail 0**；桌面 `node test/run.mjs` = **263/263 · fail 0**（含本批全部新档与集成域真 Electron）。
- 桌面冒烟 `npx electron . --smoke` = `window:true ∧ boot:"ok" ∧ errors:[] ∧ ok:true`。
- 机检 = 悬空 64 · 行宽 35（净 0/0）。
- 实施链 = 核件面（#35）→ 设计修正（#40）→ 实施修正（#41）→ 桌面面（#36）→ VSC 宿主面（#37）→ 可见面（#38）→ VSC 修正（#42）→ B3 口径（#43）→ 设计终锚（#45）；全舱终态 converged。

### 6.2 验收对照（A-TW8–A-TW13）
- 机检 ∕ 离线可产面全绿（T-TW14–T-TW27 各宿主在位——含修正轮补例；负控逐桩判红取证在各轮 §5 在案）。
- **人工走查登记（非阻断）**：T-DSK44 真机面（离线不可产——沿已裁二分）＋ 计时行真回合观感——待真机走查（父侧 ∕ 用户）。

### 6.3 未决 ∕ 移交（在册不丢）
- **回填轮 #511**：§6.30.12 修正轮补三桩注（非新号）· 17⇒18 四处同拍（`ev:queue` 落地）· 各档读数（#45 已落主表）。
- **拆档批 #510**：`agent-host.mjs` 374 ∕ `events.mjs` 497 ∕ 等。
- **CLI 镜像缺（`AbortError` 容纳）** = 台账 #513；**`thincoder-cli/README.md:152` 单端口径** = 台账 #514。
- 改动遗痕：`WEBVIEW-PROTOCOL.md:421` 行形态已收正（父侧）；§12 短形坐标口径 = 机检宽容（原样在案）。

### 6.4 收口同步清单（D7）
- 角色表 = 六段齐；状态行随本收口置；指针（§1 各款 ∕ §2.5–§2.9 ∕ §5.1–§5.15）全解析；变更记录 = 七档以上各 +1 笔；台账 = #446 待核销（随提交核销）+ #510–#514 在册。
- **前批遗留交叉核对**：align-2 ∕ idle-wake ∕ align-3 = 已收口冻结 ✓；无「条目已结而锚批档未闭」项。
- **本批 = 实施完成 + 三套件亲验通过 ⇒ 已收口 2026-09-28（记录冻结）。**
