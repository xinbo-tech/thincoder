# 2026-10-02 · record-shape-residuals
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-02 · 来源 = 用户 2026-10-02 17:44「需求和待办赶紧开批」+ 台账 #794 ∥ #795（记录形残项——桌面重建面 label/id 归一 ∥ CLI status 词表归一）。
> 台账 = #794 ∥ #795（desktop ∥ cli · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-02
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**来源**：用户 2026-10-02 17:44「需求和待办赶紧开批」+ 台账 #794 ∥ #795（记录形残项——桌面重建面 label/id 归一 ∥ CLI status 词表归一）。设计轮 = eng-designer（initial）。

**设计轮落定核读（2026-10-02 17:5x · 父侧）**：两件定形✓（#794 = `page-read.mjs` `blockOfMessage` subagent 支 + `normSubagentMeta` 归一 helper；#795 = `lifecycle-records.mjs:144` 停面扩 `stopped ∥ cancelled ∥ terminated`）；量级 = 产品码 2 档 ≈ +18~24 行；批内件拟六腿（`docs/batches/2026-10-02-record-shape-residuals.test.mjs`）。档头占位由设计轮机械补填（`:4` = `#794 ∥ #795（desktop ∥ cli · 归批）`——值源 = 派发文 + 台账，**接受**）。**上抛处置**：U1（`[✓ undefined…]` 实链收正 = `[▶ undefined…] 思考中…`——并入 #794 归一集）接受；**U2（同一 error 记录 CLI `✓ … — err` ∥ VSC·桌面 `⏹ …` 显示面差）= 裁「在册」**（非本批射程——端差面新行在册，见台账）；U3（坐标收正 `:137⇒:144` ∥ `:58-63⇒:58-67`）已落台账两行；U4（§1 补）= 本段。**候用户点火评审**。

**授权（2026-10-02 19:30 · 用户「全自动」）**：本批转**全链自动**（代点火 ∥ 修正派发 ∥ §4 代签 ∥ 实施派发 ∥ 收口核销——自缚三条：① 代签仅当三条件齐备；② 新范围 ∥ 口径裁决 ⇒ 停；③ 破坏性/不可逆 ⇒ 停）。**设计评审代点火中**（报告到达 ⇒ 裁定 → 修正（如有）→ 代签 → 实施 → 核验 → 收口）。

**评审 #20（轮 1）= pass**（🔴0 ∥ 🟡2 ∥ 🔵3——§3 在册）；**处置**：发现 1–4 修法 = **修正轮 #23 派发（eng-designer——跑中）**（§2 三处措辞点修 :135/:57/:50 + 落笔验收面入档）；发现 5 = 披露项（无动作）。**§4 = 修正落地核验后**（三条件序）；实施 = 修正落地后派 eng-coder（2 档 + 批内件）。

**实施轮核读（父侧 · 2026-10-02 20:0x）**：两档落笔实读相符——`page-read.mjs` = **278**（`normSubagentMeta` `:81-96` + `blockOfMessage` 接线 `:116-120`）∥ `lifecycle-records.mjs` = **199**（停止面三词 `:144-146`）；批内件六腿 **6/6**（先红 = 5 红 1 绿在案）；回归 = **6/6** ∥ **19/20**（V4 先行红——#824 在册；另两件附加复跑 3/9 ∥ 1/7 同族=受控实验同红同值——**已并入 #824 行**）；`node --check` OK；门 = 锚/宽零新增（行数面 1 行 = `CHAT.md:139` 随动面——挂落笔轮）。**裁定**：交付**接受**；代码评审 pass（fix 轮 1 = 🔵3 采纳后复跑绿）∥ 审计 CLEAN ∥ 终态 clean。**设计档四行落笔轮 = 候轮 3 收口即派**（`docs/cli/design/TUI-SESSION-VIEW.md` 单写者窗——与清账轮 3 串行；其余三行同舱同轮）；**§6 = 落笔轮核验后**。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（两件逐件定形落位（归一形 ∥ 词面判据 ∥ 对位表 ∥ 验收）；落点届盘读讫；产品码零触（设计轮）· 2026-10-02）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**一、本批条目（覆盖）**

- 台账 **#794**（tech_todo · desktop · 归批）：**桌面读面他端记录归一**——现读 = 桌面页读径把他端（CLI ∥ VSC 写）记录 `meta` **原样直传**核件（零字段归一）⇒ 形损三面：① `label` 缺位 ⇒ 头文直插 `undefined`；② `id` 缺位 ⇒ `dataset.subid` 缺席（核件门 `model?.id != null`）；③ `frozen` 缺位 ⇒ 头走活样式支（▶ ∕ 「思考中…」 ∕ 计时走表——frozen 判定缺位）；另 CLI 停止词 `stopped` 无词面归一（与 #795 同判据面）。**归一集 = §三.1**。
- 台账 **#795**（tech_todo · cli · 归批）：**CLI 读面 `status` 词表窄于写词表**——现读 `lifecycle-records.mjs:144` 停止面仅收 `"stopped"`（台账载 `:137` = #790 前 as-of——**坐标收正**）；VSC/桌面写 `"cancelled"` ⇒ CLI 误标 `✓ done`。**判据与修 = §三.2**。
- 单源 = core `docs/core/design/SESSION.md` §6.26（记录形 ∥ 读缝契约 ∥ 端侧重建义务——读面容旧形义务既有 `:977-978`）；实现现读 = 桌面 `page-read.mjs` ∥ `views/chat-subagent.mjs` ∥ 核件 `subblocks/{block,activity-view,channel}.mjs` ∥ CLI `lifecycle-records.mjs` ∥ VSC `record-restore.js`。
- 本批性质 = **设计轮**（产品码零触 ∥ 既有实现零改 ∥ 写入面 = 本 §2）；实施 = 批准后另轮。
- **不在本批**：实施轮；两件之外的机制面；#790 已裁面（`pool`/`queued` 字段 ∥ key 文法）零动。**#771 已核销（2026-10-01）** ⇒「可分可并」之并单面不存在——本件独立处置。

**二、证据底盘（file:line = 现读实核 · as-of 2026-10-02）**

| # | 事实 | 证据 |
|---|---|---|
| 1 | 写词三端 · CLI = `stopped` ∥ `error` ∥ `done` | `thincoder-cli/src/tui/lifecycle-records.mjs:53` |
| 2 | 写词三端 · VSC = `cancelled` ∥ `error` ∥ `done`（归档时点模型词） | `thincoder-vscode/webview/activity.js:182` + 词源态机 `thincoder-render-core/subblocks/state.mjs:48` |
| 3 | 写词三端 · 桌面 = 全模型落载（同词源；`rows` 除外） | `thincoder-desktop/renderer/subagent-reduce.mjs:166-168`（`const { rows, ...meta } = block`） |
| 4 | §6.26 记录形字段表：`status?` 未钉词表（`pool`/`queued`/`key` 已裁） | `docs/core/design/SESSION.md:971`（字段表）∥ `:977-978`（key 义务）；词表未钉在册披露 = `thincoder-vscode/webview/record-restore.js:100-102` |
| 5 | CLI 读面窄：停止面仅 `"stopped"` | `thincoder-cli/src/tui/lifecycle-records.mjs:144`（现读；台账 as-of `:137`） |
| 6 | VSC 读面已宽（三面归并） | `thincoder-vscode/webview/record-restore.js:126-130`（`subStatusOf`） |
| 7 | 桌面读面零归一：`blockOfMessage` 原样携 `meta` | `thincoder-desktop/renderer/page-read.mjs:97-99` |
| 8 | 桌面回显直传至核件（无归一） | `thincoder-desktop/renderer/views/chat-subagent.mjs:58-67`（`echoOf`：`meta` → `renderSubBlock`） |
| 9 | 核件消费面：`label` 直插 ∥ `id` 门控 ∥ frozen 分支 | `thincoder-render-core/subblocks/activity-view.mjs:50/:67` ∥ `subblocks/block.mjs:28/:32` ∥ `activity-view.mjs:59-66` ∥ `:135`（态词追加门） |
| 10 | 现形态（码读全链追踪）：他端记录 ⇒ 活样式形 `[▶ undefined · <模式词> · …] 思考中…`（frozen 缺位 ⇒ 走 `:52-58` 活支 + `:135` 追加态词）——F-1 所记 `[✓ undefined …]` = frozen 在场假定形（收正 = §九 U1） | 链路 = #7 ∥ #8 ∥ #9 |
| 11 | 桌面自记携全模型 ⇒ 自读零损（归一负控面） | #3（`label`/`id`/`frozen` 均在野） |
| 12 | 桌面键面 = 位置键（`meta.key` 非 DOM 键）∥ `dataset.subname/subrole/subid` 读 meta | `thincoder-desktop/renderer/views/chat-stream.mjs:13-15` ∥ `chat-tree.mjs:67/:71` ∥ `subblocks/block.mjs:30-32` |

**三、逐件定形**

**三.1 #794 归一形**（落点 = `thincoder-desktop/renderer/page-read.mjs` `blockOfMessage` subagent 支——helper `normSubagentMeta(meta)`，本档私有）

判由（落点择定 = KD-1）：本档 = 桌面「记录 ⇒ 块」唯一入口（首屏 ∥ 回填两径同经）；档头既有不变式句「`subagent` 记录 ⇒ 留档块（`blockOfMessage` 同形——与活流归档同一形状）」——本归一 = 使该句对**他端记录**成立（活流归档 meta = 全模型，天然同形）。**产物 = 读面新 meta 对象**（记录 ∥ 存储零写）。

| 字段 | 规则（派生 ∥ 补缺 ∥ 恒值 ∥ 重归一——逐行如列） | 判由 ∥ 先例 |
|---|---|---|
| `key` | 非空且无 `sub:` 前缀 ⇒ 补前缀 | §6.26 `:978`「读面必容旧形」义务；VSC 先例 `record-restore.js:107` |
| `label` | `parseChannel(key).label` | 头文载体（核件直插 `:67`）；VSC 先例 `:112` |
| `role` | `parseChannel(key).role ?? meta.role` | 头词族判据（`FAMILY_ROLES` `activity-view.mjs:69`）；VSC 先例 `:113` |
| `id` | `parseChannel(key).id` | `dataset.subid` 门（`block.mjs:32`）；VSC 先例 `:113` |
| `frozen` | 恒 `true` | 记录 = 归档快照（§6.26 `:969-971`）；VSC 重建步同事实（`record-restore.js:89` `model.frozen = true`） |
| `status` | 词面归一 ⇒ 桌面模型词（停止面 ⇒ `cancelled` ∥ 错误面 ⇒ `error` ∥ done 面 ⇒ `done`；判据 = §三.2） | 头词三面（核件 `activity-view.mjs:59-66`） |
| `startedAt` | 有限数 ⇒ 原值；缺 ⇒ `doneAt ?? 0` | 冻结耗时算式（核件 `:52`）；VSC 先例 `:110` |
| `doneAt` | 有限数 ⇒ 原值；缺 ⇒ `startedAt` | 冻结耗时稳定（防计时走表）；VSC 先例 `:110` |
| 其余（`pool`/`queued`/`note`/`error`/`model`/`turn`/`maxTurns`/未知键） | 原样透传 | §6.26 `:971`「未知字段原样携带」 |

**链检（归一后 = 活流归档同形）**：CLI 写 `stopped` 记录 ⇒ 桌面重建 ⇒ `[⏹ eng-coder#5 · sync · <model> · stopped Ns · turn t/m]` + tail-3（核件冻结支全径）；`dataset` 三值（`subname=sub:eng-coder#5` ∥ `subrole` ∥ `subid=5`）在场。**现形态**（收正后）= §二 #10。

**三.2 #795 词面归一判据**（单源将落 core §6.26——**写面零动** ∥ 读面容多写词）

| 面 | 词集 | 呈现 |
|---|---|---|
| 停止面 | `stopped` ∥ `cancelled` ∥ `terminated` | ⏹ + stopped |
| 错误面 | `error` ∥ `failed` | ⏹ + error（+ 文本注记） |
| done 面 | `done` ∥ `settled` ∥ `answered` ∥ 缺省 ∥ 未知 | ✓ + done |

- 面源 = 核 `terminalKindOf`（`channel.mjs:40-48`）三面 ∥ 词集并 CLI 写词 `stopped`（记录面词——核词表外独有，写面现状）；**写词表不动**（CLI 仍写 `stopped`；VSC/桌面仍写 `cancelled`）。
- 各端读面义务（实现各端——沿 §6.26「各端自做」总则）：
  - **CLI**【修】：`synthSubTask` 停止面判据 `meta.status === "stopped"` ⇒ 三词集全收（`lifecycle-records.mjs:144`，+2 行）；error/done 读法照旧（`lastError = meta.error` 文本载）。
  - **VSC**【锁】：`subStatusOf`（`record-restore.js:126-130`）现即合规（本批以之定判据基准）；零产品码改。
  - **桌面**【修】：由 §三.1 `status` 归一提供（⇒ 模型词）。
- **CLI error 面 = 文本载**：`error|failed` 且无文本 ⇒ 与 done 同显（**在册容差**——CLI 冻结头设计明文 `render-segments.mjs:88-92`「done 头 + `— err`」；写面不变式「error 词随文本走」：CLI `:53` 以 `lastError` 在场写 error）＋显示面差上抛 = §九 U2。

**三.3 跨端写读对位表**（判据机检形——实施轮批内件按表驱动）

| # | 样例（写端 · 事实） | 写词 | CLI 读（折叠头） | VSC 读（块头） | 桌面读（归一 ⇒ 核件头） |
|---|---|---|---|---|---|
| T1 | CLI · done | `done` | ✓ done | ✓ done | ✓ done |
| T2 | CLI · stopped | `stopped` | **⏹ stopped**【修】 | ⏹ stopped（既容纳） | **⏹ stopped**【修】 |
| T3 | CLI · error（+文本） | `error` | ✓ + `— <text>`（文本载【在册】） | ⏹ error + 注记 | ⏹ error + 注记【修】 |
| T4 | VSC · cancelled | `cancelled` | **⏹ stopped**【修】 | ⏹ stopped | **⏹ stopped**【修】 |
| T5 | VSC · error（+文本） | `error` | ✓ + `— <text>` | ⏹ error | ⏹ error【修】 |
| T6 | VSC · done | `done` | ✓ done | ✓ done | ✓ done【修】 |
| T7 | 桌面 · 三词 | `cancelled`/`error`/`done` | 同 T4–T6 | 同 T4–T6 | 同 T4–T6（自记：归一逐值等变） |
| T8 | 旧形 key（无前缀） | — | 剥离前缀（既容纳） | 补前缀（既容纳） | **补前缀 + 派生 label/id**【修】 |
| T9 | 他端共性缺位（label ∥ id ∥ frozen） | — | n/a（CLI 无 label 面） | n/a（synth 按键派生） | **派生 + frozen 恒真**【修】 |

**表判据**：同一记录 ⇒ 三读面**面类一致**（停止 ∥ 错误 ∥ done）；唯一在册面差 = T3/T5 的 CLI error 呈现（文本载——§九 U2 上抛）。【修】= 本批待落。

**四、落点与量级（对账表——现行 = 现读内容行数 · 文末换行不计 · 2026-10-02；落点 = 届盘实读钉定）**

产品码：

| 面 | 档 | 现行 ⇒ 预期 | 改点 |
|---|---|---|---|
| 桌面 | `thincoder-desktop/renderer/page-read.mjs` | **258 ⇒ ≈278**（+16~22） | `parseChannel` import（+1；`/rc/subblocks/channel.mjs:12-23`）∥ `normSubagentMeta` helper（≈+13~19 含注释）∥ `blockOfMessage` subagent 支接线（+1~2） |
| CLI | `thincoder-cli/src/tui/lifecycle-records.mjs` | **197 ⇒ ≈199**（+2） | 停止面词集一行 + 注释——`synthSubTask` |
| — | 零触面 | — | `views/chat-subagent.mjs`（106）∥ `subagent-reduce.mjs`（258）∥ VSC 全树 ∥ core 产品码 ∥ 记录形 ∥ 写面 ∥ `rows` ∥ 落盘 ∥ 机器线 |

设计档（**随动时机 = 裁定后（实施轮同拍）——沿 #790 KD-6 先例**；本设计轮写入面 = 本 §2）：

| 落点 | 现读坐标 | 随动 |
|---|---|---|
| core `docs/core/design/SESSION.md` §6.26 | `:964-1007`（字段表 `:971` ∥ key 义务 `:977-978` ∥ 桌面重建义务 `:1001` ∥ 容差 `:1002-1005`） | **词面判据三条 + 读面归一义务（含字段级——沿 `:977-978` key 读义务先例）**（≈+5~8 行——判据单源） |
| 桌面 `docs/desktop/design/RENDERER.md` §1.1「留档记录」条 | `:92-96` | 承接句（记录 ⇒ 留档块归一——落点 `page-read.mjs`；≈+1~2 行）+ 变更记录一行 |
| 桌面 `docs/desktop/design/CHAT.md`（文件账——`page-read.mjs` 行） | `:139`（现读 **258**） | 行数收正（实施轮实读） |
| CLI `docs/cli/design/TUI-SESSION-VIEW.md` §6 | `:179-198`（合成件句 `:194`） | `stopped` 判据句（词面 = §6.26 义务；≈+1 行）+ 变更记录一行 |
| VSC | — | 零改（读面现即合规——判据基准） |
| 批内件 | `docs/batches/2026-10-02-record-shape-residuals.test.mjs`（新档） | ≈200~240 行 · 六腿（L1–L6） |

**落笔验收（实施轮）**：随动表四行——core §6.26 ∥ RENDERER §1.1 ∥ CHAT 行数 ∥ TUI-SESSION-VIEW §6——显式列为实施轮落笔验收项（防批档成长期唯一承载）。

**量级结论**：产品码 **2 档 · ≈ +18~24 行**；零新字段 ∥ 零版本 ∥ 零迁移 ∥ 零通道 ∥ 零存储面；三端写面零动。

**五、验收对照（回指两件——逐条机检）**

- **AC-1（对 #794·归一形）**：桌面他端记录读面归一——CLI/VSC 记录（缺 `label`/`id`/`frozen`）⇒ 重建块 = 活流归档同形：`label` 由 key 派生（头文零 `undefined`）∥ `dataset.subid` 在场 ∥ 冻结头三态（⏹ / ⏹error / ✓）∥ 耗时 = 冻结值（不走表）。
- **AC-2（对 #795·词面）**：CLI 停止面全词集——`stopped` ∥ `cancelled` ∥ `terminated` ⇒ `⏹ … stopped Ns`；`done`/error 读法逐字等价（负控）。
- **AC-3（判据 = 对位表）**：§三.3 全行过——三读面对同一记录面类一致（唯一在册面差 = CLI error 文本载——明示给由）。
- **AC-4（负控）**：桌面自记（全模型）过归一逐值等变 ∥ 记录形 ∥ 写面 ∥ `rows` ∥ 落盘节律 ∥ 机器线零触 ∥ VSC 产品码零触 ∥ #790 字段（`pool`/`queued`）零动。
- **AC-5（量级）**：产品码 ≤ 2 档 · 净增 ≤ ≈24 行；零新字段 ∥ 零版本 ∥ 零迁移；设计档落点表与 §四一致。

**六、验证法（实施轮判据腿——批内件六腿 + 回归）**

- **L1 桌面归一·字段**（平 node 直测）：`blockOfMessage` 喂 CLI/VSC/桌面三形记录 ⇒ meta 逐字段断言（key 补全 ∥ label/role/id 派生 ∥ `frozen=true` ∥ status 词映射 ∥ 两时间戳回填 ∥ 未知键透传）。
- **L2 桌面归一·成品形**（happy-dom 直驱——沿 #790 批内件 V 舱先例）：`fillSubagentEcho`（真链：壳 + 核件）⇒ `.sub-hdr` 文本 `[⏹ … stopped Ns]` 形；`dataset.subid/subname` 值；负控 = 头文零 `undefined`。
- **L3 CLI 重放**：`synthSubTask` 三面断言 + `historyToLines` + `frozenSubSeg` 折叠头（`cancelled` 记录 ⇒ `⏹` + `stopped`；`done`/error 负控逐字）。
- **L4 VSC 锁**：`restoreRecordEls` 同形记录三词——头面不变（零码改证明件）。
- **L5 对位表驱动**：§三.3 表逐行（写端样例 × 三读面）——面类一致断言。
- **L6 负控族**：桌面自记全模型记录过链 ⇒ 值与改前逐值等变；缺 `status` ⇒ done 面（回退登记）。
- **回归**：复跑 `docs/batches/2026-10-01-record-shape-contract.test.mjs`（6/6）+ `docs/batches/2026-09-30-cross-end-digest-recovery.test.mjs`（20/20）。
- **真机项（候用户）**：双向具形——① CLI 侧停子代理 ⇒ `stopped` 记录 ⇒ 桌面重开 ⇒ 归档块头 ⏹ stopped（T2 腿）∥ ② 桌面 ∕ VSC 侧产 `cancelled` 记录 ⇒ CLI 重开 ⇒ 折叠头 ⏹ stopped（T4 腿）——跨端实走。
- 跑法（仓根 `thincoder/`）：`node --test docs/batches/2026-10-02-record-shape-residuals.test.mjs`；批内件随批留存 · 不进仓套件。

**七、关键决策（含否决）**

- **KD-1 桌面归一落点 = `page-read.mjs` `blockOfMessage`**（读面入口单点）。否决：① `chat-subagent.mjs` `echoOf` 处归一——两产者覆盖但流块形不变式（`blockOfMessage` 出块 ≡ 活流归档块）失主、壳面职责混入记录语义；② 核件（render-core）加兼容——三端共用核件、改面最大且越两件。
- **KD-2 归一集 = 派生 ∥ 补缺 ∥ 恒值 ∥ 重归一（逐行如列——§三.1 表）**；**记录形零扩**——#790 已裁「不增 `label`/`id` 跨端义务」，本件全在**读面**解决（写面零动）。
- **KD-3 词面判据 = 三面词集**（§三.2）；单源 = core §6.26；各端各实现。否决：① 写词表钉定（三端写面齐改——改面 > 读面）；② 只改 CLI（桌面同面缺陷留着——违「可省二次触碰」）；③ 未知词原词透传（读面留有损面）。
- **KD-4 CLI 修法 = `synthSubTask` 停止面扩词一行**。否决：全词表结构件（单点两语值无收益）；直引核 `terminalKindOf`（核词表不含 `stopped`——引核反漏 CLI 写词）。
- **KD-5 CLI error 面维持文本载**（`✓ + — err`）——不扩 CLI 显示面（面差在册 + §九 U2 上抛）；桌面/VSC error 面 = ⏹（词面归一直达）。否决：CLI 增 ⏹ error 分支（显示面新语义 ⇒ 越两件）。
- **KD-6 设计档落笔时机 = 裁定后（实施轮同拍）**——沿 #790 KD-6 先例；本设计轮写入面 = 本 §2。

**八、边界（不做）**

- 写面任何改动（三端写词 ∥ 写时点 ∥ 归一形保持）；记录形字段增补（#790 已裁面零动）；`digest` 族 ∥ `rows` ∥ 保尾 ∥ 记录存储 ∥ `version` ∥ 落盘节律 ∥ 机器线——零触。
- CLI error 显示面统一（§九 U2 另裁）；跨页 ∥ 容差 ∥ 重放口径面（#771 已收口）零动。
- VSC 产品码 ∥ 核件（render-core）产品码改动；桌面 `chat-subagent.mjs` ∥ `subagent-reduce.mjs` 改动。
- 本轮零写：设计档三档 ∥ 产品码 ∥ 批内件（均归实施轮）；越两件扩改禁止。

**九、上抛 / 发现（报告——不夹带）**

- **U1（形态收正 · 记录面）**：#790 批档 §十 F-1 所记现形 `[✓ undefined …]` 不准——实链（frozen 缺位）⇒ 活样式形 `[▶ undefined …] 思考中…`（码读全链追踪；两记皆码读推证，以本 §2 为准）。F-1「形损」判定成立且面更大（frozen 为主项）——已并入 #794 归一集。
- **U2（显示面差 · 请父侧裁）**：同一 error 记录三端呈现 = CLI `✓ … — <text>`（文本载）∥ VSC·桌面 `⏹ … — <text>`（词面）。两案：① 在册（CLI 冻结头设计 D-M7b ② 明文）；② 按「跨端显示面 = 缺陷」收正（CLI 增 ⏹ error 分支 = 显示面新语义）。本席倾向 = ①在册（非本批射程）；请父侧裁。
- **U3（坐标收正）**：台账 #795 载 `lifecycle-records.mjs:137` ⇒ 现读 `:144`（#790 实施位移）；台账 #794 载 `chat-subagent.mjs:58-63` ⇒ 现读（`echoOf` 全段 `:58-67`）；本 §2 全按现读。
- **U4（批档面）**：§1 现为模板占位（本批任务依据 = 派发文 + 台账两行——已执行）；请父侧同拍补 §1。
- **对账零出入**：两件与两舱上抛原文（#790 §2 F-1/F-2）、台账两行、现盘实读四方一致（§二表逐条实核；唯 U1 形态一处收正）。

**读回注记（落笔同轮 · D6 · 2026-10-02）**：§2 已读回核讫（落点 = 本段）。产品码触面 = **2 档** ≈ +18~24 行（桌面 `page-read.mjs` ∥ CLI `lifecycle-records.mjs`）；设计档随动三档 + 批内件一档。

**设计档随动轮（2026-10-02 · eng-designer——承本 §2 随动表 ∥ 「落笔验收」项）**：四行全落 + 逐档读回（D6）——

- ① core `docs/core/design/SESSION.md` §6.26：新 4 行 **`:980-983`**（词面判据三条 `:980-981` ∥ 读面归一义务（字段级——沿上 `key` 读义务先例）`:982-983`）；
- ② 桌面 `docs/desktop/design/RENDERER.md` §1.1 留档记录条：新 1 行 **`:95`**（承接句——他端记录读面归一；落点 = `thincoder-desktop/renderer/page-read.mjs`）；
- ③ 桌面 `docs/desktop/design/CHAT.md` §3.1：`page-read.mjs` 行数 **258 ⇒ 278**（`:139`——实读对盘：278 = 278）；
- ④ CLI `docs/cli/design/TUI-SESSION-VIEW.md` §6：新 1 行 **`:198`**（停面词判据句——词面判据单源 = §6.26）；
- 变更记录 **4/4**：SESSION `:1124` ∥ RENDERER `:471` ∥ CHAT `:247` ∥ TUI `:233`（各一行）。

机检核读（`node scripts/doc-check.mjs` · 仓根）：四档 **锚/宽零新增**（悬空 ∥ 宽 ∥ 拟新增 ∥ 引文四面本批零贡献）；行数面差异 **8 ⇒ 0**（本批贡献 = ③ 对盘清零；余 = 他批回填同拍）；悬空 70 ⇒ 71 = **他批（#697 桌面 UX 收尾批 · 回填轮）** `docs/desktop/design/SETTINGS.md:338` 变更行——第二处同锚（`src/main/settings.mjs`），非本批面。产品码零触 ∥ 越四档零 ∥ 他批档零触。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

评审对象 = 记录形残项批（#794 ∥ #795）设计（定形承载 = 批档 §2）。评审范围 = 四档（`docs/core/design/SESSION.md` ∥ `docs/desktop/design/RENDERER.md` ∥ `docs/desktop/design/CHAT.md` ∥ `docs/cli/design/TUI-SESSION-VIEW.md`）。

评审基础（证据）：① 四档全文读讫 + 定向检索（`normSubagentMeta` ∥ `terminated` ∥ `#794` ∥ `#795` ∥ 三词——四档零命中；四档变更记录最新条目 = 2026-10-02 文档体系重组批（RENDERER ∥ CHAT）∥ 2026-10-01 各批（SESSION ∥ TUI-SESSION-VIEW）——均无本批条目）。② 届盘抽核全过：`thincoder/thincoder-desktop/renderer/page-read.mjs` = 258 行 ∥ `:97-99` 原样携 `meta`（无归一）✓；`thincoder/thincoder-cli/src/tui/lifecycle-records.mjs` = 197 行 ∥ `:53` 写词三值（`stopped`/`error`/`done`）✓ ∥ `:144` 停止面仅 `"stopped"` ✓；`thincoder-render-core/subblocks/channel.mjs:12-23` `parseChannel`（label/role/id 齐备）✓ ∥ `:40-48` `terminalKindOf` 三面词集（含 `terminated`/`failed`/`settled`/`answered`——与 §三.2 逐值一致）✓；`thincoder-vscode/webview/record-restore.js:103-123` `synthSubModel` + `:126-130` `subStatusOf`（与 §三.1 逐行同式——桌面归一 = VSC 先例移植，可行性实证）✓；核件 `activity-view.mjs:50/:59-66/:67/:135` ∥ `subblocks/block.mjs:28/:32` ∥ `chat-subagent.mjs:58-67`（echoOf 直传）✓；批档 §四 落点坐标逐条对盘（SESSION.md `:964-1007`/`:971`/`:977-978`/`:1001`/`:1002-1005` · RENDERER.md `:92-96` · CHAT.md `:139`（258 ✓）· TUI-SESSION-VIEW.md `:179-198`/`:194`）✓；回归两档在盘 ✓（`docs/batches/2026-10-01-record-shape-contract.test.mjs` ∥ `docs/batches/2026-09-30-cross-end-digest-recovery.test.mjs`）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Methodology / Document ownership | 🟡 | 设计档落笔整体延后（KD-6——批档 `:145`「设计档落笔时机 = 裁定后（实施轮同拍）」）：评审时点四档现文对 `normSubagentMeta` / 词面三面 / 停面三词零痕（全文读讫 + 定向检索零命中），批准时点设计权威 = 批档 §2 单点（批档 = 一次性材料体例——`docs/core/design/SESSION.md:73` 自身即如此标注）；跨端单源「词面判据三条」（批档 `:64-72` 声明将落 §6.26）在落笔前悬空 | 随动表四行（批档 `:105-114`）作为显式落笔验收项（可选：批准前提前落笔）；§6.26 落笔须含词面判据三条 + 读面归一义务（含字段级——沿 `docs/core/design/SESSION.md:977-978` key 读义务先例），防批档成长期唯一承载 |
| 2 | Acceptance criteria / Clarity | 🟡 | §六 真机项（批档 `:135`）「CLI 侧制造 `cancelled` 记录（停子代理）」与 §二#1（批档 `:31`）∥ §三.2（批档 `:68`）自相抵——CLI 写词 = `stopped` ∥ `error` ∥ `done`（`thincoder/thincoder-cli/src/tui/lifecycle-records.mjs:53`），现写面无 `cancelled` 产者 ⇒ 该腿按字面不可执行（CLI 侧「停子代理」实产 `stopped` 记录） | 改述为双向具形：CLI 侧停子代理 ⇒ `stopped` 记录 ⇒ 桌面重开 ⇒ ⏹（T2 腿）∥ 桌面 ∕ VSC 侧产 `cancelled` 记录 ⇒ CLI 重开 ⇒ ⏹ stopped（T4 腿）；或点名 CLI 产 `cancelled` 的产者 |
| 3 | Clarity | 🔵 | §三.1 `status` 行只写「词面归一 ⇒ 桌面模型词（判据 = §三.2）」（批档 `:57`）——目标词未逐值钉定（停止面 ⇒ `cancelled` ∥ 错误面 ⇒ `error` ∥ done 面 ⇒ `done`；可由 VSC 先例 `record-restore.js:126-130` 与 §三.3 对位表推得） | 加一处括号逐值钉定（一行，零行为差） |
| 4 | Clarity | 🔵 | §三.1 表头原则「只补缺 ∥ 已值优先」（批档 `:50`）与逐行规则表述张力：`label`/`id` 无条件派生 ∥ `frozen` 恒 `true` ∥ `status` 重归一——非同式；行为面无风险（AC-4 ∥ L6 负控兜底） | 表头改述为「派生 ∥ 补缺（逐行如列）」或逐行标注适用式 |
| 5 | 评审限制披露 | 🔵 | 本评审环境无文档地图 ∥ 无独立项目标准档——文档归属判读按四档自身单源指针 + 变更记录体例进行（设计本身对四档归属正确：§6.26 跨端单源 ∥ RENDERER §1.1 桌面承接 ∥ TUI-SESSION-VIEW §6 CLI 承接 ∥ CHAT §3.1 行数账——均命中各档既有 owner） | 不构成设计问题（披露项） |

VERDICT: pass
计数：🔴 0 ∥ 🟡 2 ∥ 🔵 3（共 5 条）

## §4 用户批准（主 agent）

**§4 用户批准（主 agent 代签）**：**代签成立（2026-10-02 19:5x · 自动链授权内——用户 19:30「全自动」）**——三条件核：① **设计评审 pass** ✓（评审 #20 · 轮次 1：🔴0 ∥ 🟡2 ∥ 🔵3——§3 逐字在册）；② **修正落地并逐条核验** ✓（修正轮 #23：发现 1–4 全落——`§三.1` 表头 + `:59` 逐值 ∥ `§三.2` 词集 ∥ `§四` `:107-118`（落笔验收入档）∥ `:139` 双向具形 ∥ `:145` 派生点；父侧读回在案）；③ **token 已签发** ✓（凭据值不落档）。**实施派发** = eng-coder（2 产品档 + 批内件六腿 + 回归两件）；设计档四行（随动表）= coder 交付后同拍落（设计舱——CHAT 行数随实读）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（两产品档 + 批内件六腿；审计 1 轮（零偏差）+ 代码评审 1 轮（pass）；fix 1 轮（哨兵 +1 行）；复跑 6/6 ∥ 6/6 ∥ 19/20（V4 先行红在册）∥ 门锚/宽零新增）


**实施轮（2026-10-02）· 交付**

**一、交付摘要**（两产品档 + 批内件六腿；写入面 = 3 档 + 本段）

① 桌面重建面字段归一 —— `thincoder-desktop/renderer/page-read.mjs`（258 ⇒ **278** 内容行）：`parseChannel` 导入（`:31-32`）∥ 本档私有 `normSubagentMeta(meta)`（`:81-96`——key 非空且无前缀 ⇒ 补 `sub:` ∥ label/role/id 由 `parseChannel` 派生 ∥ `frozen` 恒真 ∥ status 词面归一（stopped/cancelled/terminated ⇒ cancelled ∥ error/failed ⇒ error ∥ 余含缺省 ⇒ done）∥ 两时间戳互填 ∥ 其余键原样透传；产物 = 读面新 meta，记录/存储零写）∥ `blockOfMessage` subagent 支接线（`:116-120`）。

② CLI 停止面词集 —— `thincoder-cli/src/tui/lifecycle-records.mjs`（197 ⇒ **199** 内容行）：`synthSubTask` 停面判据扩三词（`:144-146`）。

③ 批内件新档 `docs/batches/2026-10-02-record-shape-residuals.test.mjs`（**284** 行 · 六腿 L1–L6；跑法 = 仓根 `node --test docs/batches/2026-10-02-record-shape-residuals.test.mjs`）。

**二、读数（先红 → 绿 → 终态）**

- 先红（产品码零点接入）：**5 红 1 绿**——L1（非新对象/零归一）∥ L2（`dataset.subid` 缺席）∥ L3（`cancelled` ⇒ `stopped:false`）∥ L5（T1 桌面面类 `live` ≠ `done`）∥ L6b（缺 `status` ⇒ 非 done 面）；L4 = VSC 锁（设计上两跑皆绿）。首跑另暴露两处**测试件自身产物**（i18n 实例注入点——沿 #790 先例改用 VSC shim；happy-dom 垫片）——修正后复得上述红读数，再落产品码。
- 终态：批内件 **6/6 绿**；回归 `…record-shape-contract.test.mjs` **6/6**；`…cross-end-digest-recovery.test.mjs` **19/20**（V4 先行红，见三）；`node --check` 两档 OK；门 `node scripts/doc-check.mjs` = **锚/宽零新增**（本批 3 档均不入 `.md` 扫描域；唯一随动 = 行数面报告行 `CHAT.md:139` page-read 258 ⇒ 278，Δ+20——报告态，归设计舱随动表）。

**三、先行红（单列 · 父侧裁定 ①＋在册）**

- **V4**（`…cross-end-digest-recovery.test.mjs:851`「半轮零元素」actual 2 ≠ 0）：受控实验 = 撤销本批 `lifecycle-records.mjs` 改动后**同红同值** ⇒ 与本批无关。归因判读 = V4 期望「start 缺 end ⇒ 零元素」与现机制「未结轮照现」（`record-restore.js` `scanPageRounds` `tail=true` 时 start-only 轮产 label+count 两元素）相抵——#768/#771 族落地后该回归件未复跑（批内件 mtime 2026-10-01 09:24 < `record-restore.js` 09:49）。处置 = 不修（#798 族同轨）。
- **附加复跑两件**（评审建议，非任务书回归集）：`2026-09-30-digest-persistence.test.mjs` **3/9** ∥ `2026-10-01-desktop-digest-teardown.test.mjs` **1/7**——**受控实验同读**（两产品档全撤后逐腿同红同值）⇒ 先行陈旧红：失败签名全为 #747/#765/#768/#771 前的旧期望与改名 API（终态就地换文 ∥ 复列只产末条 ∥ `chatStream.alignPlan`/`paintPlan` ∥ VSC 读面未开直通断言等），与本批零关。

**四、决策透明表**

| 决策 | 由 |
|---|---|
| 归一落点 = `page-read.mjs` `blockOfMessage`（KD-1）；helper 本档私有；产物 = 新 meta 对象 | 设计档 §2 §三.1 |
| `role` 尾接 `?? null`（= 设计行 `?? meta.role` 的 null 兜底，零可观察差；与 VSC 先例 `record-restore.js:113` 同式） | 评审备忘 1 |
| status 未知/缺省 ⇒ `done`（含 `queued` 等活词——记录 = 终态快照） | 设计 §三.2 done 面表 |
| CLI error 面维持文本载（不扩 ⏹） | KD-5 ∥ U2 在册 |
| 红跑一次修正测试件自身产物（i18n 注入点）后重跑 | 测试健壮性（沿 #790 先例） |
| 评审后 +1 行哨兵断言（`wi18n.t("sub.stopped") === "STOPPED"`，锁注入缝） | 评审轮 1 🔵3（采纳） |
| 不修 V4 ∥ 不修附加两件 | 父侧裁定 ①＋在册（2026-10-02 19:5x） |

**五、审计与代码评审轮次与终态**

- 内部探索审计（divergence audit）= 轮 1：**四类偏差零**（§三.1 逐行 ∥ §三.2 词集 ∥ §六 六腿覆盖逐腿 ∥ 越范围面——写入面恰 3 档；两备忘（`?? null` 尾 ∥ 三形真驱动由 L2/L5/L6 承担）均结讫）。
- 代码评审（advisor · code）= 轮 1：**pass**（🔴0 ∥ 🟡0（must-fix 零）∥ 🔵5——1/2 记录、3 采纳（+哨兵）、4 采纳（附加两件复跑）、5 本轮落笔）。
- **fix 轮 = 1**（哨兵断言 +1 行；复跑绿）。**终态 = clean**。

## §6 验证与收口（父代理）

**§6 验证与收口（2026-10-02 20:3x · 父侧）**

**核读**：两产品档——`page-read.mjs` **278**（`normSubagentMeta` `:81-96` + `blockOfMessage` 接线 `:116-120`）∥ `lifecycle-records.mjs` **199**（停止面三词 `:144-146`）；设计档四行——`SESSION.md:980-983`（词面判据三条 + 写面词表零动 + 读面归一义务·字段级）∥ `RENDERER.md:95`（承接句）∥ `CHAT.md:139`（= **278** 对盘）∥ `TUI-SESSION-VIEW.md:198`（承接句）——**逐处父侧实读 ✓**；解悬空引注（`page-read.mjs:84` ∥ `lifecycle-records.mjs:144` 引 §6.26 现均解析到实文）✓。

**复跑**：批内件 **6/6**（父侧亲跑——先红 5 红 1 绿在案）；回归两件 = **6/6** ∥ **19/20**（V4 先行红——**#824** 在册）；**同族附加两件**（`digest-persistence` **3/9** ∥ `desktop-digest-teardown` **1/7**——受控实验同红同值——已并 #824）；`node --check` OK；门 = 本批面锚/宽**零新增**（行数面本批行清零）。

**评审处置**：设计评审 #20（🔴0 ∥ 🟡2 ∥ 🔵3——发现 1–4 全修于修正轮 #23）∥ 代码评审 pass（fix 轮 1 = 🔵3 采纳后复跑绿）∥ 审计 CLEAN ∥ 终态 **clean**。

**结算**：**收口（2026-10-02）**——记录冻结；台账 **#794 ∥ #795 核销**；**凭证链终态消费 ✓**（designId 值不落档）。真机面 = 无新增（读面归一 + 词集——平 node 直测即行为面；用户面核 = 桌面 ∥ CLI 重开自然视检）。
