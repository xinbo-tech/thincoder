# 2026-10-01 · 记录形跨端契约勘定（#790——async/queued/pool + key 文法）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-01 · 来源 = 用户 2026-10-01 16:49「上点量」令——台账 #790（记录形跨端契约勘定）。
> 台账 = #790（core · 归批）。前情 = docs/batches/2026-09-30-cross-end-digest-recovery.md §6（已收口 2026-10-01）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-01
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**任务（父侧选批 · 用户 2026-10-01 16:49「上点量」令）**：

- **#790 记录形跨端契约勘定**——来源 = 跨端批两舱上抛：① 重建面缺 `async` ∥ `queued` 事实 ⇒ 恢复块头恒书 ` · sync`；② 记录 `meta` 缺 `pool` ⇒ 重建块头恒缺「· async」段；③ 跨端记录条目 `key` 文法未钉。

**二择（设计轮出建议）**：① **记录形扩字段**（`async`/`queued`/`pool` + `key` 文法——设计 → 评审 → 实施）；② **认账**（恢复块 sync 恒定 + key 现文法——文档化登记）。量级对账须前置（「小功能不许配大机器」纪律）。
**单源**：core `SESSION.md` §4.4 F-S7 ∥ 跨端批 `docs/batches/2026-09-30-cross-end-digest-recovery.md` §5「七」。
**链**：设计（分析两路 + 建议）→ 评审 → 批准 → 实施 → 收口。

**【收正 · 父侧笔】**：本节所引核档层标注收正——`SESSION.md` ⇒ **`docs/core/requirements/SESSION.md` §4.4 F-S7**（需求面）；机制面单源 = `docs/core/design/SESSION.md` §6.26（与 §2 修正 #2 同拍）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（勘定（二择 + 建议 ①）+ 评审轮 1（pass）六条 fix 逐号落位（2026-10-01 · §2 就地修正 + 修正块在册）；文档随动 = 裁定后同拍（KD-6））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**一、本批条目（覆盖）**
- 台账 **#790**（tech_todo · core · 归批）：**记录形跨端契约勘定**——三缺（两舱上抛 · 逐条实核见 §二；来源原文 = 跨端批 `docs/batches/2026-09-30-cross-end-digest-recovery.md:400` ∥ `:484`）：
  - **A1**（核+CLI 舱评审发现 1）：重建面缺 `async` ∥ `queued` 事实 ⇒ CLI 恢复块头恒书 ` · sync`（async 块误标）；
  - **A2**（VSC 舱评审 🟡②）：记录 `meta` 缺 `pool` ⇒ VSC 重建块头恒缺「· async/sync」段；
  - **A3**（VSC 舱评审 🟡③）：跨端记录条目 `key` 文法未钉 ⇒「CLI 写、VSC 读」时重建块 `role/id` 双双 null。
- 单源 = core `docs/core/requirements/SESSION.md` §4.4 F-S7（需求）∥ `docs/core/design/SESSION.md` §6.26（机制）；实现现读 = CLI `lifecycle-records.mjs` ∥ VSC `record-restore.js`/`activity.js` ∥ 桌面 `subagent-reduce.mjs` ∥ 核件 `activity-view.mjs`/`state.mjs`/`channel.mjs`。
- 本批性质 = **设计轮**（二择分析 + 建议 + 落点/量级 + 验证法）——**产品码零触 ∥ 既有实现零改 ∥ 写入面 = 本 §2**。
- **不在本批**：实施（批准后另轮）；三缺之外的发现（F-1 ∥ F-2 = §十报告面，不径入）。

**二、证据底盘（file:line = 现读实核）**

| # | 事实 | 证据 |
|---|---|---|
| 1 | CLI 活模型**持两全事实**：`sub.async === true`（async 池 spawn ∥ 无 = sync）∥ `sub.queued`（排队未启动，启动即清） | `thincoder-cli/src/tui/subagent-blocks.mjs:109` ∥ `:166-169` ∥ `:231`；渲染消费 = `subagent-panel.mjs:74` |
| 2 | CLI 记录生产**丢两事实**：meta 子集 = `key/role/model/startedAt/doneAt/turn/maxTurns/status[/error]` | `thincoder-cli/src/tui/lifecycle-records.mjs:42-55` |
| 3 | CLI 重建合成件**无两事实** ⇒ 渲染恒「sync」（async 缺位 ⇒ 三元式末支） | `lifecycle-records.mjs:122-142`（`synthSubTask`）→ `render-segments.mjs:83-84` |
| 4 | VSC 活模型**持两事实**：`pool`（`true`=async ∥ `false`=sync ∥ `null`=未启动）∥ `queued` | `thincoder-render-core/subblocks/state.mjs:64` ∥ `:66` ∥ `:175` ∥ `:177-178` |
| 5 | VSC 记录生产**丢两事实**：快照子集不含 `pool`/`queued` | `thincoder-vscode/webview/activity.js:174-186`（`subagentSnapshotOf`） |
| 6 | VSC 重建合成件**硬编码** ⇒ 模式词段恒缺（门 = `pool != null`） | `thincoder-vscode/webview/record-restore.js:101` → `thincoder-render-core/subblocks/activity-view.mjs:69` |
| 7 | **桌面记录已在野携 `pool`/`queued`**（记录 = 全模型落载、`rows` 除外）——字段文法先例 | `thincoder-desktop/renderer/subagent-reduce.mjs:163-169` |
| 8 | key 文法两端分形：VSC ∥ 桌面 = `sub:<role>#<id>`；CLI = `<role>#<id>`（原样写） | `state.mjs:105` ∥ `thincoder-cli/src/tui/subagent-freeze.mjs:128` ∥ `lifecycle-records.mjs:44` |
| 9 | VSC 读 CLI 记录 ⇒ `role/id` null（`parseChannel` 通用支要求 `sub:` 前缀） | `record-restore.js:94` ∥ `thincoder-render-core/subblocks/channel.mjs:12-23` |
| 10 | CLI 记录另有非族键路径（压缩面板 `compress#N` 同点冻结） | `subagent-blocks.mjs:393-406` ∥ `:431-434` |

**三、二择分析（代价 ∥ 收益 ∥ 量级）**

**路 ① 记录形扩字段（`pool`/`queued` + key 文法钉）**
- 内容（最小面 · 全设计 = §五）：记录 `meta` 增**可选** `pool?: boolean` + `queued?: boolean`；`key` 钉规范形 `sub:<role>#<id>` + 读面容旧形（存量不可迁移）。
- 代价（量级对账 · 明细 = §六）：产品码 **4 档 ≈ +10~14 行**（CLI 2 档 ∥ VSC 2 档——其中 startup 0~1）；**桌面 0 行**；core §6.26 字段表 + 义务句（批准后随动）≈ +6~10 行；CLI/VSC 承接档枚举句 ≈ 2~3 行；批内件 1 档 ≈ 6~8 腿。
- 收益：三缺全消——重建块头模式词与活流同形（async ⇒ ` · async` ∥ 排队 ⇒ ` · waiting`）∥ key 跨端复原（CLI 写 ⇒ VSC 读 `role/id` 在场；反读显示无前缀形）；#726「与活流归档同一形状」兑现；桌面**自动受益**（其产/读已合规——零改动）。
- 剩余（在册预期）：**存量记录**（本批前写入）无新字段 ⇒ 回退 = 今天的显示（append-only 不可迁移；非缺陷）。

**路 ② 认账（文档化登记 + 已知限制）**
- 内容：§6.26 增登记条——「重建块头模式词不可复原：CLI 恒 ` · sync`（async 块**误标**）∥ VSC 段恒缺」+「key 文法端分形：跨端读恒 `role/id` null ∥ 前缀形直显」；CLI/VSC 承接档同拍。
- 代价：产品码 **0** ∥ 测试 0（负控复跑）；文档 ≈ +10~15 行。
- 收益：零风险 ∥ 零动面。
- 实质代价：**留错误标注**（CLI 重建头对 async 块恒书 `sync`——「缺」之上更重 = 「假」）；与「冻结头**保留**模式词（done 头含历史语义）」既有明文（`render-segments.mjs:78-79` D-M7b ②）相抵；触发面高频（async 池 = 子代理主路径；重启 ∥ 重开 ∥ reload 即显形）⇒ 重开概率高——本勘定本身即由评审发现催生。

**量级对账前置（「小功能不许配大机器」落句）**：本二择的「机器」= 记录形契约面（3 端产读 + core 单源 + 测试）。①的改动 = **补记录复制步的两处漏**（事实已在各端活模型；桌面已在野）——不新增机制面（零版本 ∥ 零迁移 ∥ 零新通道 ∥ 桌面零改 ⇒ 落「小修」档）；②的「机器」= 永久登记一条**可知可修**的显示缺陷 ⇒ 与其登记成本 ∥ 重开概率不相称。

**四、建议（三行）**
- **择路**：① **记录形扩字段（最小面）**——`pool`/`queued` 两可选字段 + key 文法钉定（规范形 `sub:<role>#<id>` + 读面容旧）。
- **判由**：三缺皆「事实在活模型、记录复制步丢」——桌面记录已在野携 `pool`/`queued`（消费面零改即受益，字段名沿先例）；②留错误标注 + 跨端 null 恒存，悖 #726 明文与「冻结头保留模式词」的既有裁定；①成本 4 档 ≈10~14 行 + 批内件，零新机制面。
- **量级**：产品 **4 档 ≈ +10~14 行**（桌面 0）；core §6.26 + 承接句（裁定后随动）；批内件 ≈6~8 腿；无版本标记 ∥ 无迁移 ∥ 零通道改。

**五、路 ① 设计（若批准）**

**5.1 字段文法（记录 `meta` 增补——可选、缺省 = 现行行为）**
- `pool?: boolean`——spawn 模式事实：`true` = async 池 spawn；`false` = sync（已启动确证）；**缺省/null = 未知**（未启动等）。定名判由 = KD-2。
- `queued?: boolean`——冻结时**未启动**（排队中）：`true` 在场；缺省 = 非排队。CLI 本地 `sub.queued`（对象）⇒ 写布尔 `true`（位置/原因等详情 = 瞬态显示面，不扩记录——重建只需「waiting」标注）。
- **命名映射（显式）**：CLI 本地 `async` ⇄ 记录 `pool`（同真值：`true` ⇒ async）；VSC/桌面本地 `pool` 直读。`async` **不设独立字段**（双载体会破单源——KD-2）。

**5.2 key 文法（钉定）**
- **规范形 = `sub:<role>#<id>`**（`[\w-]+#\d+` 词形——`parseChannel` 既有通用支）。
- **读面必容旧形**（存量 = CLI 无前缀形，append-only 不可迁移）：VSC 读面归一（无前缀 ⇒ 补 `sub:` 再 parse）；CLI 读面剥离前缀（显示 ∥ 折叠键 = 本地无前缀形）。
- 生产面对齐：CLI 写面前缀归一（含 `compress#N` 边角 ⇒ `sub:compress#N`，读面照常）；VSC ∥ 桌面 = 已规范（零改）。

**5.3 逐面改动（全量——落点行数 = §六）**
- **CLI 产**（`lifecycle-records.mjs` `subagentRecord`）：非排队 ⇒ `pool = sub.async === true`（true/false **显式两写**——VSC 头段在场性判据 = `pool != null`，缺省会藏段）；排队 ⇒ `queued = true`（`pool` 不写——未知）；key 前缀归一。
- **CLI 读**（`synthSubTask`）：回填 `async = meta.pool === true` ∥ `queued = meta.queued === true`；key 剥离；行文取值同源（**`startup.mjs:126` 行文 `text:` 取值改自合成件 `key`**——显示 = 本地无前缀形；一处）。
- **VSC 产**（`activity.js` `subagentSnapshotOf`）：`pool`（boolean 在场即写）∥ `queued === true` 时写（本端排队冻结面现无产者——前向一致写入，零行为影响）。
- **VSC 读**（`record-restore.js` `synthSubModel`）：`pool = typeof m.pool === "boolean" ? m.pool : null` ∥ `queued = m.queued === true`；key 归一。
- **桌面：零改**（判由 = KD-5）。
- **核：零产品码改**；§6.26 随动（裁定后——KD-6）。

**5.4 记录形版本策略（裁定）**：**零版本机**——增补可选字段 ∥ 三端读面皆字段式容缺省（未知字段容读 = §6.26 既有纪律）∥ 存量不可迁移 ⇒ 旧记录回退 = 今天显示（在册预期）∥ 三端任意先后；零版本标记 ∥ 零迁移 ∥ 零回填。

**5.5 边界（不做）**：`digest` 族字段零动；`status` 词表现状保持（跨端容读差 = F-2 报告面，不径入）；不增 `label`/`id` 等桌面全模型独有字段的跨端义务（F-1 报告面）；记录存储 ∥ 槽 JSON ∥ `rows` 面零触。

**六、落点与量级（对账表——现行 = 现读内容行数 · 文末换行不计 · 2026-10-01）**

| 面 | 档 | 现行 ⇒ 预期 | 改点 |
|---|---|---|---|
| CLI | `thincoder-cli/src/tui/lifecycle-records.mjs` | **190 ⇒ ≈196~198** | 产 +2~3（pool/queued + key 前缀）∥ 读 +3~4（回填 + 剥离） |
| CLI | `thincoder-cli/src/tui/startup.mjs` | **321 ⇒ 321~322** | 行文取值同源（0~1——`:127` 行文 `text:` 取值改自合成件 `key`）；**>300 承既有形态**（登记 = `docs/core/design/SESSION.md:955`：拆点候选 = 启动屏族 ∥ 后台索引族外提 · 触发条件 = 越 500 硬限 ∥ 该档下次实质改动）；**本次 0~1 行 = 值源收正 ⇒ 不构成「实质改动」**（拆档审视不触发） |
| VSC | `thincoder-vscode/webview/activity.js` | **261 ⇒ ≈263~264** | 快照 +2 |
| VSC | `thincoder-vscode/webview/record-restore.js` | **116 ⇒ ≈119~120** | 合成件 +2~3 |
| 桌面 | 零改 | — | 产/读/key 皆已合规（在野先例） |
| core | `docs/core/design/SESSION.md` §6.26 | 字段表 + 义务句 ≈ +6~10 行 | 单源（裁定后随动） |
| CLI ∥ VSC 承接档 | `docs/cli/design/TUI-SESSION-VIEW.md:187/:194` ∥ `docs/vsc/design/WEBVIEW.md:468` | 枚举随动 ≈ 2~3 行 | 登记 |
| 测试 | `docs/batches/2026-10-01-record-shape-contract.test.mjs`（新档） | ≈150~200 行 · 6~8 腿 | 批内件 |
| **合计（产品码）** | **4 档 · ≈ +10~14 行；桌面 0；零新机制面** | | |

**七、验收对照（回指 #790 三缺——逐条机检）**
- **AC-1（对 A1）**：CLI 产读闭环——async 块记录携 `pool:true` ⇒ 重建头 ` · async`；排队冻结 ⇒ `queued:true` ⇒ ` · waiting`；sync ⇒ `pool:false` ⇒ ` · sync`（对位活流同形）。
- **AC-2（对 A2）**：VSC 产读闭环——快照携 `pool`/`queued` ⇒ 合成件回填 ⇒ 头模式词段在场（async ⇒ ` · async`）。
- **AC-3（对 A3）**：key 跨读——CLI 写规范形 ⇒ VSC `parseChannel` `role/id` 在场；存量旧形 ⇒ 容读同判；VSC/桌面写 ⇒ CLI 读显示无前缀形（与活流同形）。
- **AC-4（负控）**：旧记录（无新字段）读取行为与改前**逐字等价**；`digest` 族零动；机器线零触。
- **AC-5（量级）**：产品码 ≤ 4 档 · 净增 ≈ ≤14 行；桌面零改；grep 核零版本标记 ∥ 零迁移 ∥ 零回填 ∥ 零通道改。

**八、验证法（实施轮判据腿）**
- **批内件**（新档 · 实施者自跑——批内件纪律）：L1 CLI 产（三态字段在场性/值）∥ L2 CLI 读重放（折叠头文案三态 + 旧记录回退负控）∥ L3 VSC 产（快照 `pool` true/false + `queued`）∥ L4 VSC 读重放（头文三态 + 回退负控）∥ L5 key 跨读双向（新形 + 存量旧形 + `compress#N` 边角——写形归一 `sub:compress#N` ∥ 跨端读形同值；`compress` 非族员 ⇒ 读面中性）∥ L6 桌面合规锁（其产面现行为携字段——防回退；零代码改的证明件）。
- **回归**：复跑 `docs/batches/2026-09-30-cross-end-digest-recovery.test.mjs`（K/C/V 段）全绿；digest-rows 族定向抽跑。
- **读回**：实施轮写后读回（D6）；本 §2 落档读回 = 落笔同轮（见交付回执）。
- **仓套件**：不做（收口轮父侧唯一一次——现状 = 空清单，台账 #792 在册）。

**九、关键决策（含否决）**
- **KD-1 路择 = ①**（否决 ②——判由 = §四）。
- **KD-2 字段命名 = `pool` + `queued`**。否决：`async` 名（render-core 消费门 `pool != null` 直读 + 桌面在野记录已携 `pool`——改名须 render-core/桌面加映射 ⇒ 改面更大）· `mode:"async"|"sync"` 字符串（新词汇/无先例）· `async`+`pool` 双写（双载体 ⇒ 单源破）。
- **KD-3 key 规范形 = `sub:<role>#<id>`**。否决：无前缀形（VSC/桌面两生产面 + `parseChannel` 主文法皆前缀形——改方 2 档 > 1 档）· 「仅读面容两形、不钉写面」（无常量收敛面）。
- **KD-4 版本策略 = 零版本机**（判由 = §5.4；否决版本标记/迁移/回填）。
- **KD-5 桌面零改**（证据：全模型落记录已在野携 `pool`/`queued` ∥ 消费直传核件已读 ∥ key 已规范形）。
- **KD-6 设计档落笔时机**：本勘定轮 = §2 建议面；**设计档随动（core §6.26 + CLI/VSC 承接句）随裁定后同拍**（取 ① ⇒ 字段表/义务句；取 ② ⇒ 登记句）；**随动增一行**（两载体互查面）：`from`（显示形域 = `role#id`）∥ `key` 规范形（`sub:<role>#<id>`）值域并列 + 读面义务「按键互查须前缀归一」（现盘未见此类消费面——未核；预防性义务）。

**十、上抛 / 发现（报告——不夹带）**
- **F-1（外发现 · 报父侧裁账——建议另立台账行）**：桌面重建面**他端记录零字段归一**——`echoOf` 直传记录 `meta` 至核件（`chat-subagent.mjs:58-63`）；`label` 非 §6.26 已知字段（CLI/VSC 生产者不写；桌面全模型自理）⇒ 桌面读他端记录时块头 `meta.label` 缺位（`activity-view.mjs:67` 直插 ⇒ `[✓ undefined …]` 形——**码读推证**，桌面跨端读径未走查）；`id`/`dataset.subid` 同族缺位（`block.mjs:32`）。与本批三缺同族但非其射程。
- **F-2（外发现 · 报父侧裁账）**：CLI 读面 `status` 容读窄于 VSC 写词表——CLI `synthSubTask` 只收 `"stopped"`（`lifecycle-records.mjs:137`）；VSC 写本端词 `done/cancelled/error`（`record-restore.js:91` 注释在册）⇒「VSC 写 ⇒ CLI 读」`cancelled` 块误标 `✓ done`（码读）。建议另立行 ∥ 随本族下次触碰。
- **对账零出入**：§1 所述三缺与两舱上抛原文、现盘实读三方一致（§二表逐条实核；无出入项）。

**读回注记（落笔同轮 · D6 · 2026-10-01）**：§2 已读回核讫（落点 = 本段）。产品码触面 = **4 档** ≈ +10~14 行（桌面 0）（CLI 2 档：`lifecycle-records.mjs` ∥ `startup.mjs`（触 0~1 行）；VSC 2 档：`activity.js` ∥ `record-restore.js`）。

### §2 修正块（fix 轮 · 评审轮 1 六条逐号 · 就地修正 + 打标 · 2026-10-01 · eng-designer）

**轮次依据** = 本档 §3 轮次 1（pass · 🔴0 / 🟡3 / 🔵3 = 六条；父侧裁定 = **全数采纳**）。**落笔方式** = 就地修正（`batch` 工具 append-only ⇒ 就地修正经文件编辑落地——符本仓「§2 就地修正 · 打标 · 原行可由 git 历史逐字复核」先例）+ 本块（追加制处置记录）；§2 状态行经 `batch status` 同拍。**零新语义 / 零扩面**：产品码 ∥ 测试面 ∥ §1 ∥ §3–§6 ∥ 本档之外零触。

| # | 处置 | 落点（改后 · 读回） |
|---|---|---|
| 1 | 量级单值化——全档单值 **4 档**：`:49` ∥ `:64`（原「3 档」）+ `:63`（原「3~4 档」——同族残点，如实报告）收正；`:130` 读回注记内失效对照残句（「自误勘正」句 +「以本条为准」指向）删净——留 D6 核讫句 + 值档直陈 | `:49` ∥ `:63` ∥ `:64` ∥ `:130`——读回 = 全档「4 档」单值（「3 档 / 3~4 档」零命中） |
| 2 | 需求单源路径收正 + 层标注：§4.4 F-S7 档位 ⇒ `docs/core/requirements/SESSION.md`（原误书 design 档）；`∥ §6.26` 补层标注 ⇒ `docs/core/design/SESSION.md` | `:26`——读回 = `core docs/core/requirements/SESSION.md §4.4 F-S7（需求）∥ docs/core/design/SESSION.md §6.26（机制）` |
| 3 | `startup.mjs` 行补 >300 承登记（引 `docs/core/design/SESSION.md:953`：拆点候选 = 启动屏族 ∥ 后台索引族外提 · 触发条件 = 越 500 硬限 ∥ 该档下次实质改动）+ 判句 = 本次 0~1 行「行文取值同源」**不构成实质改动**（值源收正——零结构新增 ⇒ 拆档审视不触发） | `:95` 行内——读回 = 「>300 承既有形态」+ 登记引 + 判句在册 |
| 4 | `from` ∥ `key` 两形关系——KD-6 随动内容增一行（值域并列 + 读面义务「按键互查须前缀归一」；现盘未见此类消费面——未核，预防性义务）；`docs/core/design/SESSION.md` §6.26 落笔 = 裁定后同拍（本档之外零写） | `:123` 行内——读回 = 「随动增一行（两载体互查面）」在册 |
| 5 | L5 补 `compress#N` 边角腿（写形归一 `sub:compress#N` ∥ 跨端读形同值；`compress` 非族员 ⇒ 读面中性） | `:112` 行内——读回 = L5 段含 `compress#N` 边角 |
| 6 | `startup.mjs` 改点表达式点名 = `:126` 行文 `text:` 取值改自合成件 `key`（显示 = 本地无前缀形）——§5.3 ∥ §六两处同拍 | `:80` ∥ `:95` 行内——读回 = 两处均含 `:126` 点名 |

**报请（父侧笔面 · 本席零触）**：§1 `:14` 单源句同款（裸 `SESSION.md` 未标层——与 `design/SESSION.md` 相混）⇒ 提请父侧同拍标层为 `docs/core/requirements/SESSION.md` §4.4 F-S7。
**残留 / 同族**：无未清项（六条全落；`:94`「读 +3~4」= 行数增量口径，非本族零动）。

**补正披露（同轮 · 2026-10-01 · eng-designer）**：① 上块 #1 行读回值「『3 档 / 3~4 档』零命中」口径 = **§2 正文面**（全档 grep 余存两行，皆记录面历史：上块 #1 行自身之变更留痕 ∥ §3 轮次 1 表）——载此防字面误读。② **git 腿披露**：查证 = HEAD 无此档（未提交过）⇒ 上块所引先例之「原行可由 git 历史逐字复核」腿本次不可依；原行逐字复核面 = 本轮回话记录（落笔前全文读 + 逐处回读）；逐处「原值 ⇒ 新值」已载上块。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**设计评审（记录形跨端契约勘定 #790 · 轮次 1）**

口径与限制：评审面 = 本批档 §2 + `docs/core/design/SESSION.md`（§6.26 机制单源）；代码坐标仅按评审准则第 8 条（尺寸标注抽查）与关键证据行做了定点实核，未核项已就地标「未核」。文档归属无项目文档图可依，按 AGENTS.md + §6.26 单源指针判；尺寸按 300 顾问线 / 500 硬线 + 本档 §6.25 房规（`SESSION.md:950`）判。

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Doc hygiene | 🟡 | 同一量级两值并存：§三 `2026-10-01-record-shape-contract.md:49` ∥ §四 `:64` 书「产品码 **3 档**」，§六 合计 `:102` ∥ AC-5 `:109` ∥ 读回注记 `:130` 书「4 档」（现读实测 = CLI 2 档 + VSC 2 档 = 4 档）；现行处置 = 注记「以本条为准」指向，而非删除失效表述——读者须跨节对账方知活值 | 删除/改写 `:49` ∥ `:64` 的「3 档」使全档单值 4 档；读回注记留作记录面即可（无须保留失效首述） |
| 2 | Clarity | 🟡 | 需求单源路径不落 F-S7 所在档：`:26` 书「core `docs/core/design/SESSION.md` §4.4 F-S7（需求）」——`docs/core/design/SESSION.md` 无 §4.4（该档 §4 = 对外契约影响 `:52-58` 三行表）；F-S7 实住 `docs/core/requirements/SESSION.md` §4.4（`:130` 节头 ∥ `:140` F-S7 条）——按路径查无此节，追踪链断 | 路径改指 `docs/core/requirements/SESSION.md` §4.4 F-S7（§1 `:14` 的裸 `SESSION.md` 同拍标层，免与 design/SESSION.md 相混） |
| 3 | Affected-file size | 🟡 | `startup.mjs` 行（本批 `:95`）仅注「321 ⇒ 321~322」（实读 321 ✓）：该档已越 300 顾问线，而 `docs/core/design/SESSION.md:953` 载其拆点候选 + 触发条件（「越 500 硬限 ∥ 该档下次实质改动」——登记时读数 ≈300/未越线）；本批命中该档却无 >300 承登记 ∥ 拆档处置句（对位本档房规 = `SESSION.md:950`「>300 承既有形态——登记在册」） | 该行补同款标注（引 `SESSION.md:953` 登记）并明示本次 0~1 行「行文取值同源」是否构成「实质改动」（构成 ⇒ 拆档审视；不构成 ⇒ 置否一句） |
| 4 | Clarity | 🔵 | digest `ask` 的 `from`（= 提问者 `role#id`——`docs/core/design/SESSION.md:968`）与本批钉定的 `meta.key` 规范形 `sub:<role>#<id>`（本批 `:74`）同轴两形；§5.5 边界（`:88`）「digest 族字段零动」⇒ 范式收敛只落 `key`——若任一消费面按 `from` 查块 ∥ 按 `key` 匹配提问者，须做前缀归一（**现盘未见此类消费面——未核**） | §6.26 随动（KD-6）时补一行登记：两形各自值域 + 「按键互查须前缀归一」的读面义务；或明示两形不相交（无互查消费面） |
| 5 | Acceptance | 🔵 | AC-1–5 ∥ L1–L6（本批 `:104-112`）未覆盖 `compress#N` 边角——§5.2（`:76`）写形归一「⇒ `sub:compress#N`」为本批唯一非族键改写路径（定点核：键面 = `subagent-blocks.mjs:398`「compress#N」· 读面门 = `activity-view.mjs:14` FAMILY_ROLES 六员不含 compress ⇒ 读面中性） | L5 补一腿（compress 记录写形 + 跨端读形逐字不变），或明示不测判由（已由新形腿覆盖） |
| 6 | Clarity | 🔵 | §5.3（本批 `:80`）∥ §六（`:95`）`startup.mjs` 改点仅书「行文取值同源（0~1）」——未指名所改表达式（现文 = `startup.mjs:126` 行文 `text: \`subagent activity: ${m.meta?.key ?? ""}\``——与 §5.2「显示 = 本地无前缀形」直接相关） | 指名该行/表达式（行文取值改自合成件 key），实施者免在 0~1 行范围内猜点 |

**已核无出入项（抽核）**：证据底盘 #1–#6 ∥ #8–#10 定点实读一致（`render-segments.mjs:83-84` 三元式 ⇒ AC-1「waiting ∥ async ∥ sync」可达成 · `channel.mjs:12-22` 通用支要求 `sub:` 前缀 ⇒ 旧形 `role/id` null ✓ · `record-restore.js:101` 硬编码 `pool: null` + `activity-view.mjs:69` 门 `pool != null` ✓ · `state.mjs:64/66/175/177-178` 活模型两事实 ✓ · 桌面 `subagent-reduce.mjs:163-169` 全模型落记录 ✓）；落点行数抽查一致（190 / 321 / 261 / 116，口径含「文末换行不计」）；承接档落点 `TUI-SESSION-VIEW.md:187/:194` ∥ `WEBVIEW.md:468` 三处均实核为该面枚举行。

**计数**：🔴 0 · 🟡 3 · 🔵 3 —— 🔴 无（三缺 A1/A2/A3 全覆盖有 AC 回指；可行性 ∥ 量级 ∥ 归属 ∥ 尺寸四项过账；限内可实施）。

**VERDICT: pass**

## §4 用户批准（主 agent）

**代签（父侧 · 2026-10-01）**：依据 = 用户全链自动授权 + **评审 pass**（0🔴 ∥ 3🟡 ∥ 3🔵——六条全采纳）+ **修复轮（#25）落定经核**（§2 就地修正 9 处 + 修正块 `:132-146` + 补正披露 `:148` 读回核讫；含单值化 4 档 ∥ F-S7 路径收正 ∥ `startup.mjs` >300 登记句 ∥ key/from 值域注 ∥ L5 compress 腿 ∥ `startup.mjs:126` 点名）。**批准范围** = §2 全（以修正块覆盖面）：三端记录形扩字段（`pool`/`queued` + key 规范形）+ 文档随动（core SESSION.md §6.26 ∥ TUI-SESSION-VIEW ∥ WEBVIEW）+ 批内件（≈150–200 行 · 6~8 腿）。产品码 4 档 ≈+10~14 行 ∥ 桌面零改。实施 = eng-coder 单舱。

## §5 实施记录（eng-coder）
**状态行**：实施完成（收尾补全舱——前置实例中断后补写；审计 1 轮 + 顾问 1 轮 = clean；fix 轮 0；终验复跑 6/6 ∥ 20/20 ∥ 11/11 ∥ check 全绿；行数 197/322/263/120）


**交付摘要（收尾补全舱 · 2026-10-01 · eng-coder）**：本舱 = 前置实施实例中断后的补全舱——前置已落 = 四产品档 + 三文档随动 + 批内件；本舱 = 内部收敛补跑 + 终验复跑 + 本节补写（零新功能 · 零产品码改动）。批 = 台账 #790「记录形跨端契约勘定」（路 ①：记录 `meta` 扩 `pool`/`queued` 两可选字段 + key 规范形 `sub:<role>#<id>`；三端产读 + 桌面零改）。

**落点（file:line · as-of 2026-10-01 · 本舱读回）**

| 面 | 落点 | 内容 |
|---|---|---|
| CLI 产 | `thincoder-cli/src/tui/lifecycle-records.mjs:44-56` | key 写面归一（`:46`）∥ 排队 ⇒ `queued:true` 且 `pool` 不写（`:55`）∥ 非排队 ⇒ `pool = sub.async === true` 显式两写（`:56`） |
| CLI 读 | `lifecycle-records.mjs:127-149` | key 剥离（`:134`——显示 = 本地无前缀形）∥ `async = meta.pool === true`（`:142`）∥ `queued = meta.queued === true`（`:143`）；行文取值同源 = `startup.mjs:126-127`（自合成件 `frozen.key`） |
| VSC 产 | `thincoder-vscode/webview/activity.js:183-184` | `typeof meta.pool === "boolean"` 即写 ∥ `meta.queued === true` 即写 |
| VSC 读 | `thincoder-vscode/webview/record-restore.js:97 ∥ :105 ∥ :111` | 旧键补 `sub:` 前缀再 parse（`:97`）∥ `pool` 回填（`:105`）∥ `queued === true`（`:111`） |
| 桌面 | 零改 | 产/读/key 已在野合规（先例 `thincoder-desktop/renderer/subagent-reduce.mjs:163-169`）——L6 锁证 |
| 文档随动 | `docs/core/design/SESSION.md:971-979` ∥ `docs/cli/design/TUI-SESSION-VIEW.md:187/:194` ∥ `docs/vsc/design/WEBVIEW.md:468` | 字段表 + 命名映射 + 零版本机 + key 规范形/容旧 + 两形值域互查行 |
| 批内件 | `docs/batches/2026-10-01-record-shape-contract.test.mjs`（195 行 · L1–L6） | 六腿（CLI 产 ∥ CLI 读 ∥ VSC 产 ∥ VSC 读 ∥ key 跨读 ∥ 桌面锁） |

**行数对账（内容行）**：190 ⇒ **197**（+7）∥ 321 ⇒ **322**（+1）∥ 261 ⇒ **263**（+2）∥ 116 ⇒ **120**（+4）——净增 **+14**（AC-5 上限内压线）；桌面 0 行；批内件 195 行（设计预算 150–200）。

**命令与读数（红先转绿 ∥ 本舱终验复跑）**

- 红先 ⇒ 绿：批内件红先 **5 红**（前置实例在册）⇒ 全绿 = `node --test docs/batches/2026-10-01-record-shape-contract.test.mjs` ⇒ **tests 6 ∥ pass 6 ∥ fail 0 ∥ cancelled 0**。
- 跨批回归①：`node --test docs/batches/2026-09-30-cross-end-digest-recovery.test.mjs` ⇒ **tests 20 ∥ pass 20 ∥ fail 0 ∥ cancelled 0**。
- 跨批回归②：`node --test docs/batches/2026-10-01-digest-rows-natural-form-cli-vsc.test.mjs` ⇒ **tests 11 ∥ pass 11 ∥ fail 0 ∥ cancelled 0**。
- 语法：`node --check` 四档 ⇒ **ALL-CHECKS-PASS**；行数复读 ⇒ **197 / 322 / 263 / 120**（批内件 195）。

**披露（逐条）**

1. **四处他批旧钉随动 = 父侧笔**（今轮 · 未越跨批写门 · 可 revert）：`docs/batches/2026-09-30-cross-end-digest-recovery.test.mjs:410-412/:605/:743` ∥ `docs/batches/2026-10-01-digest-rows-natural-form-cli-vsc.test.mjs:354`——内容 = key 前缀化（`sub:coder#1`）+ meta 键表加 `pool`（扩字段后精确形钉适配）；本舱零触；审计实核 = 与盘面一致、非静默、无残余旧钉。
2. **桌面零改 = L6 锁证**：真归约 ⇒ 归档记录 meta 携 `pool`/`queued` ∥ key 已规范形（`2026-10-01-record-shape-contract.test.mjs:177-195`）。
3. **冻结窗零拒**：本批写入零被拒——四产品档 ∥ 三文档随动 ∥ 批内件 ∥ 本 §5 全部落盘在册（无被拒递补项）。
4. **观察 · 量级贴顶**：净增 +14 恰达 AC-5 上限（`record-restore` +4 略超 §六注记 +2~3；总数合 AC）。
5. **观察 · 记录面坐标 as-of**：`startup.mjs` 行文表达式现读 `:127`（§2 点名句书 `:126`）；`SESSION.md` 拆档登记句现读 `:955`（§2 修正块引 `:953`）——报告面 · 零语义。
6. **外发现 · 生成区坐标**：`docs/core/design/API-CONTRACT.md`（生成区 · 勿手改）该档行号随本批位移（`subagentRecord :42⇒:43` ∥ `synthSubTask :122⇒:127`）——刷新 = 收口轮跑 `node scripts/api-contract.mjs --write`（本批批准范围未含该档）。

**内部收敛结论**

- **偏离审计**（explore · 只读 · **1 轮**）：**clean**——四类偏差（部分实现 ∥ 静默简化 ∥ 文档漂移 ∥ 越表）全 0；AC-1–AC-5 逐条实核兑现；3 🔵 记录面观察（见披露 4–6）。
- **顾问代码评审**（advisor · code · **1 轮**）：**pass**——🔴 0 ∥ 🟡 1（advisory · 非必修：`startup.mjs` 322 > 300 顾问线——承既有登记，不重开）∥ 🔵 4（compress 记录 `pool:false` 语义残余 ∥ VSC 重建 queued 块零 waiting = 设计面残余 · 核件零改明文 ∥ 批档引 `SESSION.md:953` 行号漂移 ∥ 批内件助手失败面质量——均可选/报告面，零码改处置）。
- **fix 轮 = 0**（两轮均无必修项）；**终态 = clean**。

**越表面**：本舱写入 = 本 §5（batch append）+ 终验命令（零写）；产品码 ∥ 批内件 ∥ 文档随动 ∥ 本档 §1/§3/§4/§6 零触。

## §6 验证与收口（父代理）

**收口轮（父侧 · 2026-10-01）**

① **父侧亲跑验证**：批内件 ⇒ **6/6**（红先 5 红 ⇒ 全绿）∥ 跨批复跑 **20/20**（cross-end）∥ **11/11**（cli-vsc）——四处旧钉随动后转绿 ∥ `node --check` 四档 ✓ ∥ 行数 **197/322/263/120**（设计区间全落）。
② **§2 as-of 收正**（父侧直执行 · 机械 · 可 revert）：`:97` `:126` ⇒ `:127`（行文式现读）∥ `:953` ⇒ `:955`（SESSION.md 登记句现读）。
③ **下游随动闭合**：`node scripts/api-contract.mjs --write` ⇒ `WROTE（2773 条）` ∥ `--check` = **OK（骨架零漂移 · 2773 条 · 621 档）**——生成区坐标随本批位移（`subagentRecord :42⇒:43` ∥ `synthSubTask :122⇒:127`）已随。
④ **内部收敛**（#36 收尾补全舱）：偏离审计 1 轮 = clean ∥ 顾问 code 评审 1 轮 = pass（0🔴 ∥ 1🟡 advisory——`startup.mjs` 322 行承既有登记不再开 ∥ 4🔵 报告面）∥ fix 轮 0 ∥ **终态 clean**。
⑤ **四处他批旧钉**：父侧直执行随动（今轮 · 跨批写门不越 · 可 revert）——如实记（key 前缀化 + `pool` 键表补）。
⑥ **披露销**：`SESSION.md:955` 坐标漂移（原 `:953`）= 已收正；「记录面 as-of」两句 = 均落。
⑦ **台账结算**：#790 → 已核销（经 待核销）。

**收口完成 ⇒ 冻结。**
