# 2026-09-29 · desktop-carryover
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-29 · 来源 = 用户 2026-09-29 20:42 直令「待设计待讨论的那些你就这么不想干吗？」——池面转批：桌面收尾族（#406 ∕ #649 ∕ #652 ∕ #656 ∕ #659 ∕ #660）。
> 台账 = #406 ∕ #649 ∕ #652 ∕ #656 ∕ #659 ∕ #660（桌面收尾族 · 归批）。前情 = 承 RF（desktop-rebuild-fidelity）各波发现——实施排 RF 收口后（文件避让）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-29
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**状态行**：🔄 进行中（2026-09-29 20:44 · 立批——设计轮已派）

- **来源** = 用户 20:42 直令；触发 = 池面转批——桌面收尾族六条（判据与证据在台账行）。
- **条目**：**#406**（`resumeSlot` 走核裸版无 `scheduleSessionGC`——三择一待裁）· **#649**（性能余账：R-7 密文 md p95 16.6ms ∥ R-8 帧成本 33.2ms——布局成本续账）· **#652**（旧值回填实缺陷 + AC-1 域收窄二择一）· **#656**（队满静默丢可见形待裁）· **#659**（改名形空格/Enter 冒泡——修向：形内判源 ∕ 停止传播）· **#660**（KD-47 门放宽：「审批 ∧ 零块」帧差分——父侧倾向放宽，设计核可达性）。
- **实施避让**：本批实施排 **RF（desktop-rebuild-fidelity）收口后**（#652/#659/#660 触 RF 写域文件——届时逐文件 deconflict）。
- **口径**：设计轮先行（四条待裁 + 两条修向已定）；真机判据按探针先例（#603 教训：重建前后 scrollTop ∕ 焦点 ∕ 选区保真）。
- **边界**：不动 RF 在写文件（设计期零产品码）；KD-47 修订 = 设计面。
- **授权** = 13:52 ∕ 17:02 全权。

**U1–U3 父侧裁定（2026-09-29 21:17）**：
- **U1** #652（b）= **确认「扩标记面」**（由：总闸自身口径 ∥ `keyDraft` 只覆盖失败面 ∥ 成功后节点收形天然闭合）——设计不回改。
- **U2** #406 = **核销**（前提不成立——KD-T4 已裁 + 双点点火实现在盘，实核在册；台账已核销）；设计档补登 = 不单列（KD-T4 批档可溯）。
- **U3** RF 批档随动两处（§2.2 波 1 披露①三句 + M-604c 域句）= **并 #661**（RF 收口轮承运）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（覆盖 #406–#660 六条逐条四件；§3 轮次 1 九发现修正轮落毕（2026-09-29）；射程外③ 落修——`docs/desktop/design/IPC.md:113` 第三 reason `queue-full`（2026-09-29）；KD-47 ⑤ ∕ KD-52 设计档已落；实施排 RF 收口后（三舱互斥——门已开 ∕ 行基届盘重钉）；上抛 U1–U3；零产品码）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 批次任务（覆盖 · 逐条）

**覆盖 = 六条**（桌面收尾族 · 归批 #406 ∕ #649 ∕ #652 ∕ #656 ∕ #659 ∕ #660）。本轮 = **设计轮**：零产品码 ∕ 零 RF 在写文件触；设计档落点 = KD-47 修订 + KD-52 新增（两处已落——§2.8）；实施排 **RF（desktop-rebuild-fidelity）收口后**（§2.9 避让）。

| 台账 | 题 | 本批裁 |
|---|---|---|
| #406 | `resumeSlot` 走核裸版无 `scheduleSessionGC`——三择一待裁 | 判②**已落**（KD-T4）——零实施，建议核销（§2.2） |
| #649 | 性能余账：R-7 密文 md p95 16.6ms ∥ R-8 帧成本 33.2ms | 设计 = 诊断先行 + 对靶优化（下个性能面轮实施——§2.3） |
| #652 | 旧值回填实缺陷 + AC-1 域收窄二择一 | 设计 = 成功径草稿失效 + **扩标记面**（§2.4） |
| #656 | 队满静默丢可见形待裁 | 设计 = 入口预检回执 + toast + 文本不吞（§2.5） |
| #659 | 改名形空格 ∕ Enter 冒泡 | 设计 = 形内判源（§2.6） |
| #660 | KD-47 门放宽（审批 ∧ 零块帧） | 设计 = 放宽（KD-47 ⑤ 已落——§2.7） |

### 2.2 #406 · 会话残留 GC 面（判②已落 · 零实施 · 建议核销）

**现状实读（本轮亲核）**：

- ① 桌面恢复径 = 核**裸版** `thincoder-core/session-slots.mjs:299`（`resumeSlot` 无 GC）+ 端壳绑定 `thincoder-desktop/src/main/session-slots.mjs:97`——**有意选择**（端壳档头 `:215-217`「桌面恢复径有意走核裸版（避认领竞争）」）。
- ② **端层显式点火已在盘两处**——恢复入口 = `thincoder-desktop/src/main/ipc.mjs:174`（`sessionResume` 成功径 `scheduleSessionGC(receipt.cwd)`；注句明载「R1 · #406 · KD-T4②」）；启动拍 = `main.mjs:116`（`scheduleSessionMaintenancePasses({ cwd })` → `session-maintenance.mjs:106`）。
- ③ 去重 = 核内每进程每前缀（`scheduledPrefixes`）——双点火零副作用（端壳档头在册）。

**裁（三择一收口）= ②「端层显式点火」**——依据 = `docs/batches/2026-09-28-desktop-feature-parity.md:487` **KD-T4**（已裁：采②；否决①改走包装版〔引入认领竞争〕· 否决③ GC 归 CLI 单点〔违对齐判据〕）。原条「残留槽文件无人清」**前提不成立**（决策与实现皆在盘）。**残余跨端差 = 零**（点火时点差 = 恢复入口 ∥ 启动拍 vs CLI 单处——核内延迟拍 + 去重 ⇒ 清理面等价；非阻塞原判沿用）。

**受影响文件 = 零**（本轮）。**验收判据** = 源面三处在位机检（`ipc.mjs:174` ∕ `main.mjs:116` ∕ `session-maintenance.mjs:106` 三命中）。**消解** = 建议父侧核销 #406。**登记缺口（披露）** = 「裸版 + 双点点火」安排现只住代码注 + 批档，设计档未载——补登与否 ∕ 落点（候选 = `SHELL.md` §4）请父侧裁（§2.11 U2）。

### 2.3 #649 · 性能余账（R-7 密文 md ∥ R-8 帧成本）

**现状实读**：R-6a ✓（80KB 基线帧 p95 **1.70ms** ≤8ms——前批落地）；R-7 ✗（密文段 p95 **16.6ms**，比 5.72；基线 31.8ms——−48%）；R-8 ✗（边界帧成本 **33.2ms**；r8b ∕ r8c 结构判据 ✓✓ = 零重挂 + 块数 +1）；判据在册 = `docs/render-core/design/RENDER-CORE.md:369` §7 **C10**（帧成本 p95 ≤8ms@80KB 基线段 ∕ 密文段同判 + 平坦比 ≤2）；诊断在册 = 前批设计 §2.9-4③「单段超长 + 高频帧的浏览器内部布局成本（段重排 ∝ 段长）为**机制外下限**——R-6 帧成本平坦比即其测面（若不达 ⇒ 父侧按实测裁）」；父侧裁 = 报告态 + 续账。

**方案（候选择一给由）**：

- **候 A（取）= 诊断先行 + 对靶优化（两腿）**：① **诊断腿**——探针扩 **R-7d** 三面分解读数（同一帧内 `paintLiveMd` 段记时〔md 解析 + DOM 写〕+ 强制布局读 `scrollHeight` 记时〔布局面〕——两段归因，分离「md 热区成本」与「浏览器布局成本」）；② **对靶腿**——布局主导 ⇒ CSS `contain` 面试验（尾块容器 ∕ 流节点小样探针，先证零语义改再定）；md 热区主导 ⇒ `liveCut` 密文形保守度核（热区上界 ∕ 冻结推进——`docs/render-core/design/RENDER-CORE.md` §7 **C12** 恒等式门禁不动）；③ **判据** = R-7 ∥ R-8 原腿复跑 ≤8ms；不达 ⇒ 携 R-7d 读数上抛**阈值收正提案**（语义面 = 父侧 ∕ 用户裁）。
- 候 B（否）= 直接阈值收正：平坦比 5.72 表明成本 ∝ 段长——未诊断即收正 = 放弃可优化面（与 #649 题面「超长单段布局优化」相抵）。
- 候 C（否）= md 移 worker ∕ 段内虚拟化：前批已否在册（被否列单源 = `docs/render-core/design/RENDER-CORE.md` §2 **KD-RC-10**）——沿用。

**受影响文件（下个性能面轮 · file 级）**：`docs/batches/2026-09-29-perf-residuals.probe.mjs`（扩 R-7d 腿）；按诊断分支 = `thincoder-render-core/flow/live-md.mjs` ∕ `flow/live-scan.mjs`（md 热区支）或桌面流样式档（contain 支——届盘实读定位）；`docs/render-core/design/RENDER-CORE.md` §7 C10（收正提案——父侧裁后落）。

**验收判据**：机检 = R-7d 三面分解读数落盘（可复跑）；真机腿 = 真 Electron 探针 R-7 ∥ R-8 原腿复跑（读数对前批）——达标 ∥ 或携读数上抛阈值提案。**边界**：不重开 KD-50 已裁面；不动 `md.mjs` 单源。

### 2.4 #652 · 旧值回填实缺陷 + AC-1 域收窄二择一

**现状实读（届盘实读 2026-09-29——RF 收口后 ∕ 内容行数口径；`mount-settings.mjs` 172 行）**：总闸 = `mount-settings.mjs:125-133`（`paintSettings`：`captureView` → 重建（`mountSettings` 整树 clear 重建）→ `restoreView`）；申报域 = `[data-draft]`。**缺陷（a）链** = 写成功径模型侧复位（`setSettings` 清 `edit` ∕ `draft` ∕ `keyDraft` + `clearReport`）触发重绘 ⇒ 捕获点读**旧 DOM**（键入值仍在）⇒ 复填把旧值灌回 ⇒ **模型侧复位被总闸覆盖**——口令件（`settings-controls.mjs:103` `fieldPair("key","password",…,"data-draft"…)`）留驻 ⇒「再点重提」。**（b）** = 渠道钥编辑行 `views/settings-sections.mjs:95-115`（`data-provider-key-input` 密码件）**无 `[data-draft]`**——现仅失败径 `keyDraft` 种子（#615②）；背景读数重挂径无保护。AC-1 字面 vs 申报域 = RF 波 1 评审在册（`desktop-rebuild-fidelity` §5 波 1 披露 3）。

**方案（二择一裁 + 修形）**：

- **（a）修 = 成功径草稿失效（写成功 ⇒ 草稿作废）**：`createExits` 增注入面 `invalidateDrafts(scope)`（一次性失效集；`paintSettings` 捕获后按集过滤 `snap.drafts`（并合残件同滤），集消费即清）；各成功径（模型侧复位该表单者——provider 两形 ∕ 钥存 ∕ MCP ∕ env ∕ tools ∕ agent）在 `setSettings` 前声明作用域。**失败径零声明**（草稿保真——#615② 语义不动）。
- **（b）裁 = 扩标记面（取）**：渠道钥编辑行密码件补 `[data-draft]`（键缺 `id` ⇒ 标记取值作显式键——`view-state.mjs` RF 落形后现制；依赖 = RF 批落盘后按届盘核该机制）——**由**：① 背景读数落地不得清未提交草稿 = 本批总闸自身口径（#604 缺陷类——钥行非例外）；② 失败径种子（`keyDraft`）只覆盖失败一面；③ 成功后节点收形（`edit:null` ⇒ 输入节点离场）⇒「留驻」路径天然闭合。**被否 = 收正措辞**（半量：背景重挂径键入仍丢——#615② 同族缺陷留根）。
- 作用域粒度 = `[data-draft-scope]` 取值面（先例在盘 = `settings-sections-mcp.mjs:167`「add ∕ edit:<name>」；provider 两形与其余段实施轮按盘枚举逐径点校）。

**受影响文件（file 级 · 行数 = 实读落值——舱 1 实施后；前文「预期」括注由本行取代）**：`thincoder-desktop/renderer/mount-settings.mjs`（172 ⇒ **184**——失效集 ∕ 捕获后过滤调用）· `thincoder-desktop/renderer/mount-settings-exits.mjs`（224 ⇒ **227**——成功径声明缝 + `invalidateDrafts` 注入）· `thincoder-desktop/renderer/mount-settings-segments-providers.mjs`（138 ⇒ **147**——钥存 ∕ 两形提交 ∕ 取消径声明）· `thincoder-desktop/renderer/views/settings-sections.mjs`（300 ⇒ **302**——钥行补标记；**越线入越层段**）· `thincoder-desktop/renderer/views/settings-controls.mjs`（134 ⇒ **137**——**第六档 · 实施披露**：两形 `data-draft-scope` 作用域取值面）· `thincoder-desktop/renderer/view-state.mjs`（290 ⇒ **299**——过滤纯函数）· 批内件（平 node + 假 DOM——`docs/batches/2026-09-29-desktop-carryover-c1.test.mjs` · **661**）。

**验收判据**：机检 = M-652a（成功径 ⇒ 件取模型面新值——口令件分腿：清空 ∕ 收形）· M-652b（失败径 ⇒ 草稿保真——负向）· M-652c（后台读数径 ⇒ 不误伤）· M-652d（钥行携标记 + 背景重挂 ⇒ 键入 ∕ 光标保真）。真机腿 = 真 Electron——渠表单键入（含 key）⇒ 提交成功 ⇒ 口令件旧值零留驻 ∧ 再点提交零重提；钥编辑中触 `refreshSettings` 复读 ⇒ 键入保真。**文档面随动** = RF 批档 §2.2 M-604c 域句（父侧笔——RF 收口轮；报 §2.11 U3）。

### 2.5 #656 · 队满静默丢可见形

**现状实读**：携文入队单点 = `turn-driver.mjs:99-102`（`onCapCancelled`：`queued.add(...).ok !== true` ⇒ **静默 return**——零入队 ∕ 零帧）；触发链 = `turn-face.mjs:134-136`（cap 拒结算读 `signal.reason` 携文）→ 该缝；容量 = `queued-input.mjs:33-37`（`QUEUED_MAX_ITEMS` 按键判，满 ⇒ `{ok:false}`）；可见形先例 = 忙态径 `thincoder-render-core/composer/panel.mjs:304-306`（满 ⇒ `showToast(t("input.slotFull"))` + 文本保留）；端侧 `composer-wire.mjs:156-160`（`abortTurn` 失败径仅 `console.error`——无可见形）。判据 = 台账 #656（补遗轮 #91 评审 🟡② 上抛）。

**方案（候选择一给由）**：

- **候 A（取）= 入口预检回执 + 端侧可见形（toast + 文本不吞）**：① 主侧 `interrupt` 入口（cap 询问待答 ∧ `message` 非空——cap 态经 `askContinue` 包装登记，落点 = `turn-driver.mjs:92-94`）**先执 `queued.add` 权威判**；满 ⇒ 整调用回 `{ ok:false, reason:"queue-full" }`——**零中止**（询问在场 ∕ 回合照旧 ∕ 零丢失）；成功 ⇒ 该条即本代入队（**入队单点前移**——`onCapCancelled` 退为核结算通知，零二次入队；非 cap 结算径撤回臂按条目引用 · 幂等——防御）。② 端侧 = `abortTurn` 收 `queue-full` ⇒ `showToast(t("input.slotFull"))`（词键复用——**i18n 零增**）+ 文本回注输入框（回注缝 = 挂载面注入小口；先例 = VSC 无工作区拒发面「保留文本 + 瞬时 toast」——`docs/vsc/design/WEBVIEW-INPUT.md` §1 C-B2-5 ∕ §7 U-I7；对应 #543 文本零丢口径）。
- 候 B（否）= 维持静默：违 #543「用户输入零丢失」口径（静默丢 = 缺陷面）。
- 候 C（否）= 出帧面（新 `ev:*` ∕ `ev:queue` 加标记）：协议面增量——主侧本有**同步回执位**（`msg:interrupt` 回执）可承载。
- 候 D（否）= 溢出放行 ∕ 拒收只提示不保留：前者容量档失守；后者半量（文本仍丢）。

**受影响文件（file 级 · 行数 = 实读落值——舱 3 实施后；前文「预期」括注由本行取代）**：`thincoder-desktop/src/main/turn-driver.mjs`（入口预检 + cap 态登记 + `interrupt` 回执第三 reason；**行数值留待 structure-split-2 收口轮**——该档拆分正在落，避分钟级陈旧）· `thincoder-desktop/src/main/turn-face.mjs`（165 ⇒ **173**——撤回臂 `withdrawCapEntry` 注入 + 注面）· `thincoder-desktop/renderer/composer-wire.mjs`（242 ⇒ **254**——`queue-full` 可见形 + 回注调用）· `thincoder-desktop/renderer/mount-composer.mjs`（244 ⇒ **261**——回注缝 `slotFullNotice`）· `thincoder-desktop/src/main/queued-input.mjs`（78 ⇒ **90**——**越声明（父侧授权）**：撤回臂载体 `remove` 按引用摘回）· `thincoder-desktop/src/main/ipc.mjs`（330 ⇒ **331**——**越声明（父裁「纯注释、零行为」）**：`msg:interrupt` 文档注补第三 reason）· 批内件（turn-driver 平 node 直测——`docs/batches/2026-09-29-desktop-carryover-c3.test.mjs` · **257**）。

**验收判据**：机检 = cap 待答 ∧ 队满 ∧ 携文 ⇒ 回执 `{ok:false, reason:"queue-full"}` ∧ 队零变 ∧ 回合未中止；照常径（队未满）⇒ 入队恰一条（单点）∧ 通知零二次入队；非 cap 态携文 ⇒ 核注入径零回归。真机腿 = 真 Electron——询问在场 ∥ 队满 8 ⇒ Ctrl+I 携文 ⇒ toast 在场 ∧ 询问仍在场 ∧ 输入框已回注 ∧ 队数不变；队空 ⇒ 携文入队（#543 原腿零回归）。

### 2.6 #659 · 改名形空格 ∕ Enter 冒泡

**现状实读**：`.session-selector` `onKeydown`（`views/session-control.mjs:129-133`）：`Enter ∕ " "` ⇒ `preventDefault` + `onToggle`——**无源判**；改名形（`renameForm` `:201-213`）文本控件住 `.session-selector` 子树内 ⇒ 键冒泡命中 ⇒ 空格不可键入 ∧ Enter 关形（`onToggle` 清 `form`）草稿丢。修复前既有（RF 波 2 披露 6 在册）。

**方案（修向已定 · 择一给由）**：取 = **形内判源**——selector `onKeydown` 首行加源判（`event.target.closest('[data-form="rename"]') !== null` ⇒ 让行：零 `preventDefault` ∕ 零 `onToggle`）；**否 `stopPropagation`**（面外副作用：形内一切按键不再冒泡——文档级键位面潜在受扰 + 语义过宽）。Enter 不另接确认（最小修——真机判据只要求「形仍在场」。

**受影响文件（file 级 · 行数 = 实读落值）**：`thincoder-desktop/renderer/views/session-control.mjs`（235 ⇒ **238**——源判一处）· 批内件（平测：spy `onToggle` 两向——`docs/batches/2026-09-29-desktop-carryover-c1.test.mjs` · **661**）。

**验收判据**：机检 = 形内 target 键入 `" "` ∕ `Enter` ⇒ `onToggle` 零调用 ∕ `preventDefault` 零调用；selector 自身 target `Enter` ⇒ toggle 照常（零回归）。真机腿 = 真 Electron——开形 ⇒ 键入含空格串 ⇒ 值含空格 ∧ 形仍在场；键入 Enter ⇒ 形仍在场；确认 ⇒ 改名成功。

### 2.7 #660 · KD-47 门放宽（审批 ∧ 零块帧）

**现状实读（帧可达性核实 · 本轮——届盘实读 2026-09-29 ∕ RF 收口后；`activity.mjs` 181 行）**：`adopt` 门 = `views/activity.mjs:154`（`body ∧ model.blocks.length > 0 ∧ _poolSubSession === model.key`）；零块帧弃账 = `:142-146`（`blocks.length === 0` ⇒ `_poolSub = null; _poolSubSession = null; clearActivityNew`）⇒ 门必假 ⇒ **全建径**（`:157-176`：`build(poolTree) + clear(root) + append`——审批 ∕ 队列条目 DOM 每帧重建）；**可达性实证** = 零块 ∧ 审批在场 ⇒ `poolModel`（`pool-tree.mjs:42-62`）`empty` 判据含 `approvals.length` ⇒ 态 = `pool`（过 `:147` 早退）⇒ 全建逐帧发生；触发配置 = **首回合首个工具审批**（主回合 `ev:approval` 写 `pool.approvals`，子 agent 块尚未出生——常态）。**零块弃账语义**（#522①；承接行 = `docs/batches/2026-09-29-subblock-follow-resume.md` §2 表行④）= 零块 ⇒ 弃容器（下次出生全新建元素）——须保持。

**方案（放宽 · 取）**：① 门撤 `blocks > 0` 一判——`adopt = body ∧ _poolSubSession === model.key`；② 零块弃账收窄：`_poolSub = null` + `clearActivityNew` 保留，**`_poolSubSession` 保留**（会话账不毁——换代清账判据不破）；③ `adoptPool` 增**空族支**：`blocks.length === 0` ⇒ 子 agent 族壳摘离（族空零节点律）+ `_poolSub = null` + 零 `syncSubBlocks` 调用（防 null 族引用）；审批 ∕ 队列族键控差分照常（本修主受益面）；④ 下次出生：`_poolSub` 为 null ⇒ 全新建元素（零块弃账语义保持——承接行 = `docs/batches/2026-09-29-subblock-follow-resume.md` §2 表行④；现有 `live ?? build(subFamilyNode(model))` 支路承载）。**被否 = 入册边界（冻在册）**：良态高频（首个审批）每帧全建 = 审批钮身份 ∕ hover ∕ focus 丢——RF #606③ 修复面被门吃掉的半幅；父侧倾向（放宽）与设计核一致。

**受影响文件（file 级 · 行数 = 实读落值——舱 2 实施后）**：`thincoder-desktop/renderer/views/activity.mjs`（181 ⇒ **194**——门 ∕ 弃账收窄 ∕ adoptPool 空族支）· `thincoder-desktop/renderer/views/pool-subagents.mjs`（130 ⇒ **132**——空族守卫；调用面 ∥ 池件防御两案并落）· 批内件 `docs/batches/2026-09-29-desktop-carryover-c2.test.mjs`（**313**）+ 探针件 `docs/batches/2026-09-29-desktop-carryover-P10.probe.mjs`（**228**——真机两腿 23 判 `verdict:true`）+ 读数档 `docs/batches/2026-09-29-desktop-carryover-P10-readings.json`（23 判自述）。**设计档** = `PROJECT.md` §2 KD-47 **⑤ 已落**（§2.8——回填轮补焦点腿射程限定）。

**验收判据**：机检 = M-660a（零块 ∧ 审批在场帧连发 ⇒ 审批条目节点引用不变 + 头原位 + 零块帧不产族壳）· M-660b（零块 → 出生 ⇒ 族容器全新建元素 + 会话账存续）· M-660c（`none` ∕ `empty` 零节点语义不动——零回归）。真机腿 = 真 Electron——首回合首个审批在场 ⇒ 帧连发 ⇒ 审批钮 hover ∕ 焦点 ∕ 跨帧点按保真；子 agent 随后出生 ⇒ 族壳新建 + 块正常。

### 2.8 KD 修订（设计档落点 · 已落 · 读回在册）

| 号 | 档 → 处 | 落值 |
|---|---|---|
| 1 | `docs/desktop/design/PROJECT.md` §2 **KD-47** | 增 **⑤ 零块帧领用门放宽**（门判据 ∕ 弃账收窄 ∕ 族空摘离 ∕ R5 语义保持 ∕ 帧可达实证） |
| 2 | 同档 §2 增 **KD-52**（KD-51 后） | **#543 携文容量档 = 忙态队同档；队满拒收可见形 = 入口预检回执 + toast + 文本不吞**（①②③④ + 被否四项） |

**读回核实（D6）**：两处逐处读回在位（KD-47 行尾 ⑤ 与 KD-52 行上下文核过——读回片段在盘）；改行 ∕ 新行皆单行表行（与 KD 族现制同形）。

### 2.9 实施分批建议（RF 收口后 · 三舱 · 文件互斥）

| 舱 | 条目 | 主要文件 | 依赖 |
|---|---|---|---|
| 1 | #659 + #652 | `views/session-control.mjs` ∕ `mount-settings*.mjs` 族 ∕ `views/settings-sections.mjs` ∕ `view-state.mjs` | **RF 收口后**（#652 触 RF 波 1 写域） |
| 2 | #660 | `views/activity.mjs` ∕ `views/pool-subagents.mjs` | **RF 收口后**（RF 波 2 写域） |
| 3 | #656 | `src/main/turn-driver.mjs` ∕ `turn-face.mjs` ∕ `renderer/composer-wire.mjs` | **RF 收口后**（`turn-*` 在 RF 避让清单） |
| — | #406 | 零实施（建议核销） | — |
| — | #649 | 下个性能面轮（诊断件先行） | 性能面轮立批 |

三舱文件集互斥 ⇒ 可并行；**共同门 = RF（`docs/batches/2026-09-29-desktop-rebuild-fidelity.md`）收口**（`renderer/**` ∕ `src/main/turn-*.mjs` 写域避让）。

### 2.10 验收对照（三条链同源）

| 台账 | §2 条目 | 设计档落点 | 判据 |
|---|---|---|---|
| #406 | §2.2 | 批档 KD-T4（feature-parity:487）——设计档登记 = U2 | 三处点火源面 grep |
| #649 | §2.3 | RENDER-CORE.md §7 C10（现状判据）+ 收正提案面 | R-7d + R-7 ∕ R-8 复跑 |
| #652 | §2.4 | RF §2.2 M-604c 域句随动（U3） | M-652a–d + 真机两腿 |
| #656 | §2.5 | **KD-52（已落）** + `docs/desktop/design/UI.md` §1 输入区行（第三面登记——本批补） | 机检三向 + 真机两腿 |
| #659 | §2.6 | `docs/desktop/design/UI.md` §1 会话控制面行（形内让行——本批补） | 平测两向 + 真机三断 |
| #660 | §2.7 | **KD-47 ⑤（已落）** | M-660a–c + 真机两腿 |

### 2.11 披露 ∕ 上抛

- **U1（父侧裁 · 择项收口）**：#652（b）**二择一 = 扩标记面**（由在 §2.4）——请 §4 确认；若取「收正措辞」⇒ 设计须回改（申报域句 + M-604c 随动同笔）。
- **U2（父侧裁 · 登记）**：#406 跨端安排（裸版 + 双点点火）设计档未载——补登与否 ∕ 落点（候选 = `SHELL.md` §4）。
- **U3（父侧笔 · 文档随动）**：RF 批档 §2.2 随动三句（波 1 披露①）+ M-604c 域句——归 RF 收口轮（本批零触）。
- **披露**：① #649 诊断腿前的优化分支 = 预置候选（未证）——以 R-7d 读数为准；② #660 空族支与 `pool-subagents` 守卫落点 = 实施定形（两案等价，零语义差）；③ #656 撤回臂 = 防御设计（实际不可达时零成本）。

**零触**：产品码零触 · RF 在写文件零触 · 需求档零触 · §1 ∕ §3 零改 · 台账零写 · 不发起评审（父侧门）。

### 2.12 读回与机检（交付前 · 单次）

**读回核实（D6）**：§2 全文读回在盘（2.1–2.11 逐节核过）；设计档两处读回在盘（`PROJECT.md` KD-47 行 ⑤ 尾接 · KD-52 新行位 KD-51 后 · 单行表行）。

**机检（`node scripts/doc-check.mjs` · 仓根 · 交付前亲跑 + 收正后复核）**：**本批两行零 flag**——首跑 KD-52 新行两条简写引用（`composer/panel.mjs:304-306` ∕ `panel.mjs:304-306`）入悬空 ⇒ 就地收正为全路径（`thincoder-render-core/composer/panel.mjs:304-306`；CLI 侧补全路径）⇒ 复跑 `PROJECT.md:89 ∕ :95` 零 flag；读数 = 首跑 悬空 **32** ⇒ 复核 悬空 **30** · 行宽 67（本批新 ∕ 改行不在超宽列表——KD 表行同现制；余 30 ∕ 67 = 他批在写体，读数含并发漂移）。日志 = `.thincoder/tmp/carryover-doccheck{,2}.txt`。

**笔误登记（append-only 不就地改写——沿先例）**：§2.6 一行句尾缺闭括号（「形仍在场」后）——语义无涉，登记不修。

### §2 修正块（评审修正轮 · §3 轮次 1 九发现 · 2026-09-29 · eng-designer）

**轮次**：§3 轮次 1（设计评审 · pass · 🔴0 ∕ 🟡5 ∕ 🔵4）——九发现经父侧逐条裁定**全数受理**；本块 = 逐条落修记录。**就地修正 = 本作者段内**（修正点已直接落 §2 对应行；原行可由 git 历史逐字复核）；设计档随动 = `docs/desktop/design/PROJECT.md` ∕ `docs/desktop/design/UI.md`。零产品码 ∕ 需求档零触 ∕ §1 ∕ §3 零改 ∕ 台账零写 ∕ 未发起评审（父侧门）。

| # | 处置 | 落点 |
|---|---|---|
| 1 | §4.2 补本批「现行 ⇒ 预期」块（18 行 · 逐档构成） | `docs/desktop/design/PROJECT.md` §4.2（L797-818——RF 块后 ∕ §5 前） |
| 2 | 越线两档处置句（`turn-driver` = structure-split-2 拆预案 + 只增量窗口；`live-scan` = 件出批给由 + 只增量窗口） | 同块行（L809 ∕ L813） |
| 3 | 主改档坐标届盘重锚 + 「现状实读」补 as-of ∕ 行数口径；§4.1 陈旧值收正 | 批档 §2.4（L68——`mount-settings.mjs` 172 行 · `paintSettings:125-133` 核在）· §2.7（L107——`activity.mjs` 181 行 · `:142-146` ∕ `:147` ∕ `:154` ∕ `:157-176` 核在）；`PROJECT.md` §4.1 activity 行（L246——**154 ⇒ 181**）；`UI.md` §1「本批注（桌面重建保真）」项 1（L567——`:111-114` ⇒ `:125-133`） |
| 4 | 输入区行登记第三面 + 通道范围；「无工作区」先例补落点指针 | `UI.md` §1 输入区行（L20——**两面 ⇒ 三面**；① ② 补 `msg:send` 径限定；③ = cap 待答径）·「本批注（挂起窗径…）」项 3（L509——补 `msg:send` 忙态直发径；cap 待答径另立）；先例指针 = `docs/vsc/design/WEBVIEW-INPUT.md` §1 C-B2-5 ∕ §7 U-I7——落 `PROJECT.md` KD-52 ③（L95）+ 批档 §2.5（L86） |
| 5 | 两处未限定标识符改全名引用 | 批档 §2.3（L58——`AC-2` ⇒ `docs/render-core/design/RENDER-CORE.md` §7 **C12**）· §2.7（L107 ∕ L109——`R5` ⇒ 跟滚批档 §2 表行④）；同句收正 = `PROJECT.md` KD-47 ⑤（L89） |
| 6 | 候 C 否决指针改指 `KD-RC-10` | 批档 §2.3（L60） |
| 7 | `view-state.mjs`「现制」⇒「RF 落形后现制」+ 依赖注 | 批档 §2.4（L73） |
| 8 | #659 设计档落点落句（形内让行）+ §2.10 落点列随动（`:17` 判定 = 既有单源指针句随挂让行限定，无需另立小节） | `UI.md` §1 会话控制面行（L28）+ 交互行（L17）；批档 §2.10（L144 #659 ∕ L143 #656） |
| 9 | BB 行补队满限定句 | `PROJECT.md` §10 BB 行（L1093——评审 as-of `:1062`） |

**读回核实（D6）**：批档 §2 改行逐行读回在盘（L58 ∕ L60 ∕ L68 ∕ L73 ∕ L86 ∕ L107 ∕ L109 ∕ L143-145）；设计档改点逐处读回在盘（`PROJECT.md` L89 ∕ L95 ∕ L246 ∕ L797-818 ∕ L1093 ∕ L1456-1457；`UI.md` L17 ∕ L20 ∕ L28 ∕ L509 ∕ L567 ∕ L745-746）。

**机检（`node scripts/doc-check.mjs` · 交付前亲跑 + 收正后复核）**：本批改行**零入闸红**——首跑发现本批唯一新增超宽 = `PROJECT.md:1456`（356 字符）⇒ 就地收正为两行；复核 悬空 **39**（≡ 首跑）· 行宽 **76**（77 ⇒ 76——本批改行不在超宽列表）；`PROJECT.md:809` 拟新增引用（`turn-input.mjs`）= **列报 · 不入闸**（分类正确）；行数面 差异 **0** 条。日志 = `.thincoder/tmp/carryover-doccheck{3,4}.txt`。

**射程外披露（不入本轮落修 · 报告父侧）**：① `docs/desktop/design/PROJECT.md` §4.2 RF 块（L768 起）表头仍记「零实施——设计轮」且 `view-state.mjs` 行记「（拟新增）— ⇒ ≈90」——RF 批已收口（批档 `docs/batches/2026-09-29-desktop-rebuild-fidelity.md` L6「已收口 2026-09-29」）且该档盘上 **290 行**（本批亲读）⇒ 属 RF 收口随动面（建议归 #661 ∕ RF 随动轮）；② 同档 §4.1 未见 `view-state.mjs` 行（§4.1 头句「新档落盘随批登记」——RF 收口登记缺口，同 ①）；③ `docs/desktop/design/IPC.md:113` `msg:interrupt` 回执行未列第三 reason `queue-full`（批档 §2.5 已裁 · §2 受影响文件未列 IPC.md）——通道契约登记缺口，建议父侧裁（补登记 ∕ 并入实施轮）；④ 悬空读数含他批在写体（如 structure-split-2 落于 §4.1 ∕ §4.2 的 `turn-input.mjs` ∕ `chat-digest.mjs` 引用未标「拟新增」——非本批；现读 L168 ∕ L238 ∕ L312 ∕ L313 ∕ L1455）；⑤ 本批 §2.12 旧读数（悬空 30 ∕ 行宽 67）与本轮（39 ∕ 76）之差 = 并发漂移 + ①–④ 面。

**零触**：产品码零触 · 需求档零触 · §1 ∕ §3 零改 · 台账零写 · 不发起评审（父侧门）。

### §2 修正块（射程外③ 落修 · `IPC.md:113` 第三 reason · 2026-09-29 · eng-designer）

**轮次**：修正轮（定点 1 条——承上一修正块「射程外披露③」；§4 批准「文档面随动 = `IPC.md:113` `msg:interrupt` 行补第三 reason `queue-full`（并入实施轮文档面）」）。**改动 = 单行单点**。

- **发现③ → 改动**：`docs/desktop/design/IPC.md:113`（`msg:send` / `msg:interrupt` 行）——`msg:interrupt` 回执**增第三 reason `queue-full`**：新增句 = 「`∥ { ok: false, reason: "queue-full" }`（cap 询问待答 ∧ `message` 非空 ∧ 队满 ⇒ 整调用拒——**零中止**（询问在场 ∕ 回合照旧 ∕ 零丢失）；决策单源 = `docs/desktop/design/PROJECT.md` §2 **KD-52 ②**）」；同笔载荷签名 `{ key }` ⇒ `{ key, message? }`（第三 reason 判据的携带面——口径 = KD-52 ② ∕ 实读 `thincoder-desktop/src/main/ipc.mjs:209`）。
- **读回核实（D6）**：`IPC.md:113` 读回在盘（新增句逐字核过；总行数 423 不变）；`PROJECT.md:95` KD-52 行在读（② 条件 ∕ 零中止 ∕ 零丢失三要素对位一致）；`UI.md:20` 第三面句（cap 询待答径）同口径。
- **机检（`node scripts/doc-check.mjs` · 仓根 · 亲跑）**：本改**零新增 flag**——跑前 ∕ 跑后锚面 ∕ 行宽面读数 ≡：悬空 **40** · 行宽 **73**（`IPC.md:113` 表格行豁免保持——不入行宽表；无新锚行；候选 +1、悬空 ±0 = 新引用解析成立）。行数面：本改前后两跑皆 **0 条**；复核跑 **2 条**——两差异项 = `PROJECT.md:246` `activity.mjs`（表 181 ⇒ 实读 194）∕ `:247` `pool-subagents.mjs`（表 130 ⇒ 实读 132）= **舱 2（#660）实施在写体**（并发漂移，与本改无涉）。日志 = `.thincoder/tmp/carryover-doccheck5.txt`。
- **零触**：`IPC.md` 其余行零触 · `PROJECT.md` ∕ `UI.md` 零触 · 产品码零触 · §1 ∕ §3 ∕ §4 零改 · 台账零写 · 不发起评审（父侧门）。
- **披露**：① §2.10 #656 行「设计档落点」列未随动（append-only 不改前文）——第三落点（本档 `IPC.md` §2 `msg:interrupt` 行）以本块在册；② 载荷 `message?` 系同笔一致性补齐（原 `{ key }` 与 KD-52 ② 判据面 `message` 不相接）——若判越「补第三 reason」最小集，一行可回退；③ `message` 常规径语义（同上下文续跑）未加（非本射程；#543 入队面已在 §1 `ev:queue` 推送点册）；④ `IPC.md` 档内含他批未提交笔（端差清算 ∕ residuals ∕ config-read 等随动）——本改 = `msg:send` / `msg:interrupt` 行一 hunk（git diff 可辨）。

### §2 修正块（文档面回填轮 · 三舱实读落值 · 2026-09-29 · eng-designer）

**轮次**：fix 轮（定点回填——父侧派单五项：① 行数账按实读回填 ∥ ② 第六档 `settings-controls.mjs` 补登记 ∥ ③ `settings-sections.mjs` **302** 越线 ⇒ 入越层段 ∥ ④ `PROJECT.md:89` KD-47 ⑤ 补焦点腿射程限定 + #606③ 句随动 ∥ ⑤ P10 探针件名 ∕ 读数档登记）。**零产品码 ∥ 需求档零触 ∥ §1 ∕ §3 零改 ∥ 台账零写 ∥ 未发起评审（父侧门）。**

**上抛与父裁（前提冲突·本轮）**：派单已知事实 `src/main/turn-driver.mjs` = **347** 与现盘冲突——**现盘实读 252**（`turn-input.mjs` 已出档、`views/chat-digest.mjs` 已在 ⇒ structure-split-2 实施正在落，turn-driver.mjs mtime = 22:08）。上抛后**父裁 = (b′) 结构化留待**：本轮除该档相关单元格全落；`turn-driver` **四处**（§4.1 `:168` 行 ∥ §4.1 越层段条目 ∥ 越层段计数「十二档」 ∥ §4.2 行）**留待 structure-split-2 收口轮统一定**——由 = 避双写 ∥ 避分钟级陈旧（终值 ∥ 除名 ∥ 计数由该批收口轮一并落）。

**A. 落点一（`docs/desktop/design/PROJECT.md`）**

- **§4.1 值列 14 行**（逐档「现行 ⇒ 实读」，各带「桌面收尾批（#号）」由句）：session-control **238**（`:228`）· mount-settings **184**（`:263`）· mount-settings-exits **227**（`:265`）· segments-providers **147**（`:268` ∥ 描述列补「取消径」一句）· **settings-controls 137**（`:253`——第六档补登记）· view-state **299**（§4.1 无该档行——RF 收口登记缺口，归 #661，本轮零触）· activity **194**（`:246`）· pool-subagents **132**（`:247`）· turn-face **173**（`:173`）· queued-input **90**（`:175`）· composer-wire **254**（`:273`）· mount-composer **261**（`:272`）· ipc **331**（`:166`）· settings-sections **302**（`:251`）。
- **§4.1 越层段**：新入册一档 `thincoder-desktop/renderer/views/settings-sections.mjs` **302**（由 = #652 钥行补 `[data-draft]` 标记 · 属性级；预案 = 段体续拆 · 消解窗口 = 该档下次**结构性**触碰的批）；**贴层段同拍除名**（原五档 ⇒ 余四档）。
- **§4.2 本批块**：标题「现行 ⇒ 预期」⇒「**现行 ⇒ 实读落值**」+ 表头同拍；**十二行改值**（235 ⇒ 238 ∕ 172 ⇒ 184 ∥ 224 ⇒ 227 ∥ 138 ⇒ 147 ∥ 300 ⇒ 302 ∥ 290 ⇒ 299 ∥ 181 ⇒ 194 ∥ 130 ⇒ 132 ∥ 165 ⇒ 173 ∥ 242 ⇒ 254 ∥ 244 ⇒ 261）+ **新增三行**（`queued-input.mjs` 78 ⇒ **90** · `ipc.mjs` 330 ⇒ **331** · `views/settings-controls.mjs` 134 ⇒ **137** 第六档）+ 测试 ∕ 探针面行转实件名（批内件三档 `…-{c1,c2,c3}.test.mjs` **661 ∕ 313 ∕ 257** · 探针件 `…-P10.probe.mjs` **228** · 读数档 `…-P10-readings.json`）。
- **§2 KD-47**：① 句收正（「头 ∕ 审批 ∕ 队列族原位重建」⇒「头原位重建；审批 ∕ 队列族 = **键控差分**（同键条目跨帧身份存续——RF #606③ 落形；键 = `promptId` ∕ 队列标题）」——实据 = `thincoder-desktop/renderer/views/activity.mjs:26-27 ∕ :55-58 ∕ :91`）；⑤ 补**焦点保真射程限定**（池键帧（`subBlocks` 键）下同帧帧尾对话流审批卡 F-置焦自动锚（`thincoder-desktop/renderer/app.mjs:195`）夺焦 = **独立机制**（本批零干涉）⇒ 判据按池面独帧采，探针腿 `aFocusKeptPoolOnly` 自陈射程 ∥ 探针 ∕ 读数两件名登记）。
- **变更记录**：文件末增本轮回填一行（十四行 ∥ 越层段 ∥ §4.2 ∥ KD 两处）。

**B. 落点二（本档 §2 各受影响列 · 逐条实读换写）**

- §2.4（`:76`）：四档 + **第六档**（`views/settings-controls.mjs` 134 ⇒ **137**——失效集按作用域键控的取值面）+ view-state 290 ⇒ **299** + 批内件 c1（661）。
- §2.5（`:91`）：turn-face 165 ⇒ **173** ∥ composer-wire 242 ⇒ **254** ∥ mount-composer 244 ⇒ **261** + **两越声明档**（`queued-input.mjs` 78 ⇒ **90** ∥ `ipc.mjs` 330 ⇒ **331**）+ 批内件 c3（257）；**turn-driver 行数值 = 留待（父裁 (b′) 在行内明记）**。
- §2.6（`:101`）：session-control 235 ⇒ **238** + 批内件 c1（661）。
- §2.7（`:111`）：activity 181 ⇒ **194** ∥ pool-subagents 130 ⇒ **132** + 批内件 c2（313）+ **P10 探针件 ∕ 读数档两件名**（父侧已收位至 `docs/batches/`——本轮按终位登记）。

**C. 机检（`node scripts/doc-check.mjs` · 仓根 · 交付前亲跑 + 收正后复核）**

- 首跑（日志 = `.thincoder/tmp/carryover-doccheck6.txt`）：**悬空 35**（前值 40 ⇒ 降 5——本批新引件名 ∕ 坐标零入 ✗ 列）· **行宽 82**——**本改新越线 1 行 = `PROJECT.md:809`（397 字符）⇒ 就地折两行**；**行数面：本批 19 档零差异**（唯一真差异 = `turn-driver` 表 310 ⇒ 实读 252 = 留待项）。
- 复核跑（日志 = `.thincoder/tmp/carryover-doccheck7.txt`）：**悬空 35 ≡ · 行宽 81**（`:809` 除名）· 行数面 差异 **1 条**（= `turn-driver` 留待）。
- **D6 读回**：PROJECT.md 改点逐处读回在盘（`:89` ∥ `:166-175` ∥ `:246-253` ∥ `:263-273` ∥ `:311-314` ∥ `:809-833` ∥ `:1494-1499`）；本档四条受影响列逐行读回在盘（`:76` ∥ `:91` ∥ `:101` ∥ `:111`）。

**披露（报父侧，本轮零触）**

1. **非本批写域一处**：`PROJECT.md:271` `renderer/mount-onboarding.mjs`（表 **88** ⇒ 实读 **90**，Δ+2）= 他批漂移候选（非本批派单集）——请父侧裁（并入 #661 ∕ 另轮）。
2. **行宽表余项**含他批在写体：`:112`（335 字符 = digest-parity 批 §2.2 句）· `:311`（341 字符 = 同批越层段 chat-chrome 并注）· `:1492`（490 字符 = 撤会话头批 changelog）——本批零新增在册（本批改行皆不入行宽表或已折行）。
3. **并发披露**：本轮回填期 `PROJECT.md` 有他实例活主张（peer intent claim，desktop pid 22264）；本轮全部改动 = 定点点改（零全文重写），改点已逐处读回在盘；若他批后续对该档全文重写，须复核本块落点。
4. **未落项（明确登记）**：§2.4 真机腿「providers 背景读」适用范围收窄措辞（舱 1 披露 3——`M-652d` 按可达腿落）本轮未落——不在五项派单内，请父侧裁（并入 #661 ∕ 另轮）。

**零触**：产品码零触 ∥ 需求档零触 ∥ §1 ∕ §3 ∕ §4 零改 ∥ 台账零写 ∥ 不发起评审 ∥ 仓套件零写 ∕ 零改 ∕ 零跑。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Affected-file size annotations | 🟡 | 本批 §2 逐条「受影响文件（file 级）」列（`docs/batches/2026-09-29-desktop-carryover.md:50` ∕ `:62` ∕ `:76` ∕ `:91` ∕ `:101` ∕ `:111`）与 §2.9 分批表（`:128-130`）只给文件名与职责，**无现行行数、无预期增量**（`≤±N` ∕ 「结构不变」）；本批亦未登记 `docs/desktop/design/PROJECT.md` §4.2「现行 ⇒ 预期」块（本批设计档落点仅 §2 两行 KD——`:119-120`），而同仓设计轮批例皆就地给数（对照 `PROJECT.md:760` RF 批「零实施——设计轮」块 ∕ `PROJECT.md:736` 性能尾账批块） | 按仓例在 `PROJECT.md` §4.2 补本批块（逐档「现行 ⇒ 预期（构成）」；现行值取 §4.1，实施排 RF 收口后行基须届盘重钉），或在 §2 各受影响文件后直接给「现行 ⇒ 预期」 |
| 2 | Affected-file size annotations | 🟡 | 受影响文件含越 300 顾问线档而无拆分预案 ∕ 拆分复核句：#656 主写档 `thincoder-desktop/src/main/turn-driver.mjs`（`PROJECT.md:168` = **310** 实读，行内自注「越 300 顾问线——越层段入列 ∕ 拆分预案**待裁**」）与 #649 诊断分支候选档 `thincoder-render-core/flow/live-scan.mjs`（**351**——`PROJECT.md:740` ∕ `docs/render-core/design/RENDER-CORE.md:220`） | 两档随 §4.2 块各带处置句（拆分预案 ∕ 或「本轮只增量、结构不变、拆分窗口 = 下次结构性触碰的批」），使 >300 档位在实施前有结论（≤500 硬限未触，非阻断） |
| 3 | Clarity | 🟡 | #660 现状实读（`:107`）引 `views/activity.mjs:154`（领用门）∕ `:142-146` ∕ `:147` ∕ `:157-176`（全建径），但 `PROJECT.md:246` 记该档 **154** 行（内容行数 · 未越 300）、`PROJECT.md:773` 记 ≈154 ⇒ ≈175（RF 波 4 待收口；同族 `:1419`）——`:157-176` 超行数 ⇒ 两处在册档不一致（坐标与行数其一陈旧）。同类：`paintSettings` 坐标 `UI.md:567` 记 `mount-settings.mjs:111-114` ∕ 本批 `:68` 记 `:125-133`（§4.1 现值 `PROJECT.md:263` = **172**） | 实施前按届盘重锚 #660 ∕ #652 主改档的源坐标；「现状实读」行补 as-of 与行数口径，避免与 §4.1 值出自不同版本 |
| 4 | Document ownership | 🟡 | #656 新端侧可见形（`{ok:false, reason:"queue-full"}` ⇒ 核件 toast `input.slotFull` + **文本回注输入框**）只落 `PROJECT.md:95` KD-52 ③（本批 `:86`），而该题面属主 `UI.md:20`（输入区行：「满队**两面**（各判据单源）」）未随动 ∕ 未加指针；同一条 `queue-full` 回执在另两处（`UI.md:20` 面② ∕ `UI.md:509`）记「失败行（`composer.send.failed`）+ 本地块退流 + 稿留输入历史」——两档写同一回执的处置而未作通道限定；旁证：「沿『无工作区』文本保留先例」在四档内仅 `:86` ∕ `PROJECT.md:95` 出现，先例本体未在册（unverified） | 在 `UI.md` §1 输入区行登记第三面并写明通道范围（`msg:interrupt` ∕ cap 待答径 vs `msg:send` 忙态径），或两径统一为一形；同处把「无工作区」先例改述为自证形或补落点指针 |
| 5 | Clarity | 🟡 | 两处未限定标识符在册不可解：`:58`「**AC-2** 恒等式门禁不动」——四档零定义（增量 md 语义判据在册编号 = `RENDER-CORE.md:371` §7 **C12**）；`:107` ∕ `:109`「**R5** 语义 = 零块 ⇒ 弃容器」（已随 KD-47 ⑤ 落 `PROJECT.md:89`）——在册 `R5` 另有所指（`PROJECT.md:934` 模型菜单真机条目 · `UI.md:244` D24 标签活动态） | 两处改按落点全名引用（如 `RENDER-CORE.md` §7 C12 ∕ 跟滚批档对应行）；KD-47 ⑤ 同句一并收正，避免读者面分叉 |
| 6 | Document ownership | 🔵 | #649 候 C 否决依据（`:60`）记「前批已否在册（**KD-50 被否列**）」，但 `PROJECT.md:92` KD-50 被否列不含「md 移 worker」「段内虚拟化」——两候选实住 `RENDER-CORE.md:76`（KD-RC-10 被否列） | 指针改指 KD-RC-10，保持「被否候选 = 单源」 |
| 7 | Clarity | 🔵 | `:73`（#652（b））记「键缺 `id` ⇒ 标记取值作显式键——`view-state.mjs` **现制**」，但 `view-state.mjs` 在册为**拟新增**（`PROJECT.md:764` · `UI.md:568` ∕ `:573`；RF 批未实施） | 改述为「RF 落形后现制」并注明依赖（实施须在 RF 的 `view-state.mjs` 落盘后按届盘核该机制） |
| 8 | Document ownership | 🔵 | #659 修向（形内判源）的「设计档落点」= 「—」（`:144`）——键语义属主 `UI.md:17`（交互行「选择器 Enter ∕ Space 开合」）∕ `UI.md:28` 无随动句，「形内键面让行」将只在码面可见 | 随实施在 `UI.md` 该两行补一句（或明示「既有句已覆盖、无需落档」的判定） |
| 9 | Methodology compliance | 🔵 | #656「满 ⇒ **零中止**」改写 #543 已落行为的一个角落：`PROJECT.md:1062`（BB 行）记「待答期 ↑Ctrl+I 携消息 ⇒ 入队 + 回合判 `stopped`」，未限定队满；本批裁 = 队满时零入队且不中止（KD-52 ② 已载） | BB 行补队满限定句（或指向 KD-52 ②），免同机制两档读者面分叉 |

**计数**：🔴 **0** · 🟡 **5** · 🔵 **4**。

**局限声明**：本项目未声明 standards 档与 document map（ownership 判据降级：按 Project Guide 与在册文档互证）；源面代码不在评审射程（四个文档为准），故本批引用的源坐标只做「文档间一致性」抽查（行号越界 ∕ 同档两值冲突），未对盘复核；`KD-T4`（feature-parity:487）、RF 批档、性能尾账批档、跟滚批档等射程外引用 = unverified。

VERDICT: pass

## §4 用户批准（主 agent）

**批准（代签）· 2026-09-29 21:36**——依据 = 用户 13:52 ∕ 17:02 全权（代点火 + 代批 + 代签）。

- **评审状态**：**评审通过**（§3 轮次 1——9 项全数落地复核成立；零 🔴）。
- **批准范围** = §2 设计（#659 形内判源 ∥ #652 扩标记面 ∥ #660 放宽门 ∥ #656 入口预检回执 ∥ #649 诊断先行续账 ∥ #406 已核销）。
- **实施切分** = 三舱并行：**舱 1**（#659+#652——settings ∕ 会话面）∥ **舱 2**（#660——池面，含 RF 探针 P10 腿）∥ **舱 3**（#656——队列面）；文档面随动 = `IPC.md:113` `msg:interrupt` 行补第三 reason `queue-full`（并入实施轮文档面）。
- **射程外归口**：§4.2 RF 块表头 ∥ §4.1 `view-state.mjs` 登记 → #661；他批在写体（④）不触。
- **验收** = 各条 AC（M-652a–d ∥ M-660a–c ∥ 机检三向 + 真机两腿）+ 批内件直跑 ∥ doc-check 复核。

## §5 实施记录（eng-coder）

**状态行**：实施完成（#656 真机腿补探针——A/B 两腿 25 判全过（净跑 7 轮 ∥ 突变对照 7 判红已还原）；前舱 #660 ∥ #656 机检在册；两件待父侧收位（2026-09-29））

### 5.1 交付摘要（#656 · 舱 3 · 2026-09-29）

**轮次 = initial**（同 designId 链；§4 代签在册 21:36）；**设计单源** = 本档 §2.5 + `docs/desktop/design/PROJECT.md:95`（KD-52）+（UI §1 输入区第三面已由设计轮落）。**落点 = 产品码 6 档 + 批内件 1 档**；文档面零触（`IPC.md:113` 第三 reason 登记归独立文档舱 #138 —— 父裁①）；需求档零触。
**designId 回显**：本舱 spawn 载荷未携显式值 —— 写授权经 token 门在写时核验（凭据值不落档，沿先例）。

**逐项改动表（号 → file:line · 实读落点；行数 = 内容行数口径）**：

| # | 档 | 改动点 | 行数（前 ⇒ 后） |
|---|---|---|---|
| 1 | `thincoder-desktop/src/main/turn-driver.mjs` | ① 档头 #543 段随正 + #656 四句 ② `capPending` 待答登记表 `:94` ③ `capQueued` 预入队引用表 `:97` ④ `askContinue` 包装登记 + `.finally` 令牌守卫清位 `:101-109` ⑤ `onCapCancelled` 退为核结算通知（`capQueued.delete` + `chain.postQueue` —— 零二次入队）`:114-117` ⑥ `withdrawCapEntry` 撤回臂（按引用 · 幂等）`:121-126` ⑦ `createTurnFace` 注入该缝 `:138` ⑧ `interrupt` 入口预检（cap 待答 ∧ 携文 ⇒ `queued.add` 权威判；满 ⇒ `{ok:false,reason:"queue-full"}` 零中止；成功 ⇒ 预入队 + 引用登记）`:293-296` ⑨ 自修轮：`dispose` ∕ `abortSuspensions` 增 cap 态两表清点 `:316-317` ∕ `:336-337` | 310 ⇒ **347**（估 ≈325 —— 超估 = 机制注面实量；越 300 在册 · 拆预案 = structure-split-2（他批）） |
| 2 | `thincoder-desktop/src/main/turn-face.mjs` | ① 档头 #543 ∕ #656 段随正 ② 工厂注入面增 `withdrawCapEntry`（文档 + 形参）`:53-58` ③ 中断续跑径（非 cap 结算径）撤回臂调用 `:121-123` ④ cap 拒结算径注句随正（通知语义 · 零二次入队）`:138-141` | 165 ⇒ **173**（估 ≈160「净减」—— 实为 +8：入队臂在盘本住 driver，本档增 = 撤回臂调用 + 注面） |
| 3 | `thincoder-desktop/src/main/queued-input.mjs` | **越声明（父侧授权 · 撤回臂载体）**：增 `remove(key, entry)` 按引用摘回（幂等；未命中零动作）`:76-86` + 档头注 `:17` | 79 ⇒ **90** |
| 4 | `thincoder-desktop/renderer/composer-wire.mjs` | ① 档头注入面 + #656 段 ② deps `slotFullNotice = null` 缝 `:50` ③ `abortTurn` 收 `queue-full` ⇒ 单点消费可见形缝 `:169`（其余失败因照旧诊断 `:170`） | 242 ⇒ **254**（估 ≈250） |
| 5 | `thincoder-desktop/renderer/mount-composer.mjs` | ① 引 `showToast` `:50` ∕ `t` `:53` ② 回注缝 `slotFullNotice(text)` `:134-141`（toast 词键复用 + 文本回注：空框直置 ∕ 非空尾并换行；回注后 `dispatchEvent(new Event("input"))` —— 高度写面单源 = 核件（自修轮））③ 缝注入写面 `:150` | 244 ⇒ **261**（估 ≈248） |
| 6 | `thincoder-desktop/src/main/ipc.mjs` | **越声明（父裁明示「纯注释、零行为」）**：`msg:interrupt` 文档注补第三 reason `queue-full` `:209-211`（函数体 `:212` 零改） | 330 ⇒ **331** |
| 7 | 批内件 `.thincoder/tmp/2026-09-29-desktop-carryover-c3.test.mjs` | 机检三向 + 端侧可见形 + 结构核 ∕ 词键 ∕ 撤回原语（M1 ∕ M1b ∕ M2 ∕ M3 ∕ M4 ∕ M5） | 新增 **257**（暂存位 —— 写门拒跨批终位 ⇒ 父侧收位） |

### 5.2 读数（测试 ∥ 行数账）

- **批内件直跑**（`node --test .thincoder/tmp/2026-09-29-desktop-carryover-c3.test.mjs` · 仓根）：**6 ∕ 6 全绿**（M1 ∕ M1b ∕ M2 ∕ M3 ∕ M4 ∕ M5）。**判别力自证**：临时突变 `interrupt` 预检条件（`capPending.has` 置假）重跑 = **4 绿 ∕ 2 红**（M1 ∕ M2 落红）⇒ 复原 + 复跑 6 ∕ 6（突变零残留，`git diff` 复核）。
- **`node --check`**：六产品码 + 批内件 **7 ∕ 7 绿**。
- **not repo-suite verified**（全清令：仓套件不写 ∕ 不改 ∕ 不跑 —— 父侧收口轮为唯一套件口径）。
- **行数账（内容行数 · 本舱实读）**：见 5.1 末列。设计 §4.2 本批块涉本舱三行为预测值（turn-driver ≈325 ∕ turn-face ≈160 ∕ composer-wire ≈250），实读 **347 ∕ 173 ∕ 254** —— 三档 ≤500 硬限；turn-driver 越 300 在册（拆预案 = 他批）。回填请按实读（父侧 ∕ 设计面）。
- **系统级读数**：批内件跑批日志含 `[agent-host] session save failed: …` 行（假 agent 无 cwd ⇒ `saveAgentSlot` 落盘拒 —— 夹具噪声，零断言面；同族批件先例）。

### 5.3 内部审计与代码评审（轮次与终态）

- **内部 explore 偏差审计（只读 · 阻塞）**：**CLEAN —— 四类偏差零命中**（半量实现 ∕ 静默增量 ∕ 验收不可达 ∕ 越声明未披露 全无）；KD-52 ①–④ 逐款落点核过。局限（审计自声明）：审计面不可执行批内件（无 execute 面）—— 以逐断言对读 + 语法绿复核。
- **内部 advisor 代码评审 · 轮次 1（type=code · 同步）**：**VERDICT: pass**（0 🔴 · 🟡×5 非阻断 · 🔵×4）。🟡 = 越 300 两档（turn-driver 343 ∕ ipc.mjs 331 —— 皆在册债 · 非 must-fix）· 登记面滞后（§2.5 受影响文件列 ∕ §4.2 本批块未列 `queued-input` ∥ `mount-composer` ∥ `ipc` —— report-only）· 真机腿 ∕ 批内件收位（父侧协调）· §5 披露义务（本段即兑现）。🔵 = 行数漂移 vs 登记估值 · 回注直写高度越核件缓存 ∕ cap 两表无清点面 · 测试面墙钟界 + 源锁单侧。
- **自修轮 1（采纳 🔵×2）**：① 回注改走核件自适应单源（`dispatchEvent(new Event("input"))` 取代直写 `style.height`）—— `mount-composer.mjs:139`；② `dispose` ∕ `abortSuspensions` 增 cap 态两表清点 —— `turn-driver.mjs:316-317` ∕ `:336-337`。复核 = 批内件复跑 6 ∕ 6 + M5 锁随动（`:236`）。
- **内部 advisor 代码评审 · 轮次 2（复修核验 · 同步）**：**VERDICT: pass**（两采纳项逐形核验 Fixed ✔ ∕ 前提成立；无新 🔴；残余 1 条 🔵 观察 —— 不作阻断）。注：该轮评审输出机械引用核验 0 ∕ 25（引用路径未含仓根前缀 ⇒ 核不可读）—— 引用面以本档实读坐标为准，评审结论不受影响。
- **终态 = converged / clean**：0 must-fix；开放项见 5.4。

### 5.4 未决 ∕ 边界诚实项（父侧裁）

1. **真机腿**（§2.5 验收：询问在场 ∥ 队满 8 ⇒ Ctrl+I 携文 ⇒ toast 在场 ∧ 询问仍在场 ∧ 输入框已回注 ∧ 队数不变；队空 ⇒ 携文入队）—— 归父侧探针闭合（本舱无真机面）。
2. **批内件终位**：现住 `.thincoder/tmp/2026-09-29-desktop-carryover-c3.test.mjs`（子代理对 `docs/batches/**` 终位写入被批档写门 fail-closed 拒 —— 先例 = `2026-09-29-core-env-residuals.md:174`）⇒ 请父侧收位至 `docs/batches/2026-09-29-desktop-carryover-c3.test.mjs`。
3. **登记面回填**（评审 🟡）：§2.5 受影响文件列 + §4.2 本批块（本舱实触 6 档 —— 增 `queued-input.mjs` ∕ `mount-composer.mjs` ∕ `ipc.mjs`）请设计面 ∕ 父侧按实读回填；`IPC.md:113` 第三 reason 登记 = 独立文档舱 #138（父裁①）。
4. **撤回臂（KD-52 ④）** = 防御设计（§2.11 披露③：实际不可达）—— 本舱落形 + 载体（`queued.remove`）机检在位；其「零双投」语义 = 中断续跑径（消息经核注入落历史 ⇒ 摘回预入队条目）。
5. **残余观察（轮 2 🔵）**：回注经核缓存跳过门（`thincoder-render-core/composer/panel.mjs:208`）—— 窄径（`exitInterruptMode` 清框后同文回注）可见框高停留单行；零数据面；根治在核侧（清位同步 `_lastInputHeight`），出本舱射程。

**零触面实测**：`msg:send` 忙态径零改（M1 亦以行为断言锁其零回归）；设计档 ∕ 需求档 ∕ 核件 ∕ 他舱写域零笔；本段为实施轮唯一批档写入（§5 追加）。

### 5-c1 实施舱 1 · #659（形内让行）∥ #652（成功径草稿失效 + 扩标记面）· 2026-09-29

**交付摘要**：按批档 §2.6（#659）∥ §2.4（#652）落 —— ① #659 判源一处（selector `onKeydown` 首行 `event?.target?.closest?.('[data-form="rename"]') != null` ⇒ 让行；否 `stopPropagation`，语义零扩）；② #652(a) 一次性失效集（`dropDrafts` 过滤纯函数 + `paintSettings` 捕获后 ∕ 并合残件同滤 + 集消费即清 + `invalidateDrafts(scope)` 注入缝）+ 成功径声明两处（渠两形提交 ∕ 钥存 —— 作用域自件自携读回，单源在视图档）；③ #652(b) 扩标记面（钥行输入 `data-draft` = 行名 + `data-draft-scope` = `key:<名>`）；④ 评审轮 1 🟡#1 随修 = 取消径同拍声明（「取消 = 弃输入」在途窗内不复活）；⑤ 批内件 9 测。**零触**：设计档 · 需求档 · §1 ∕ §3 · 台账 · 他批批次件。

**逐处表（file:line → 落值 · 届盘实读）**

| # | 档（现行 ⇒ 实到） | 处 | 落值 |
|---|---|---|---|
| 1 | `thincoder-desktop/renderer/views/session-control.mjs`（235 ⇒ **238**） | `:120-122`（面注）· `:132` | #659 形内判源：键源住 `[data-form="rename"]` 子树 ⇒ 零 `preventDefault` ∕ 零 `onToggle` |
| 2 | `thincoder-desktop/renderer/view-state.mjs`（290 ⇒ **299**） | `:156-163` | `dropDrafts(snap, scopes)` —— `loc.scope` 命中集者摘除（空集 ∕ 容器缺位 ⇒ 原样；零作用域件不受波及） |
| 3 | `thincoder-desktop/renderer/mount-settings.mjs`（172 ⇒ **184**） | `:25-26` · `:104-110` · `:114` · `:131-133` · `:138-140` | import + 失效集 ∕ 注入面（非空串入集，缺作用域 fail-loud）+ 注入 + 面注 + 捕获后过滤（并合残件同滤、消费即清） |
| 4 | `thincoder-desktop/renderer/mount-settings-exits.mjs`（224 ⇒ **227**） | `:19-21` · `:50` · `:74-75` · `:158` | #652 语义锚 + 解构 + 两形提交成功径声明（作用域 = 表单自携 `data-draft-scope`；失败径零声明）+ 注入 providers 族 |
| 5 | `thincoder-desktop/renderer/mount-settings-segments-providers.mjs`（138 ⇒ **147**） | `:9-12` · `:33` · `:43-49` · `:62-63` | 头注 + 解构 + **取消径同拍声明**（`:43-49` —— 评审轮 1 🟡#1 采纳随修）+ 钥存成功径声明（`:62-63`）；失败径零声明（`keyDraft` 种子语义不动） |
| 6 | `thincoder-desktop/renderer/views/settings-sections.mjs`（300 ⇒ **302**） | `:93-95` · `:103-104` | #652(b)：编辑态输入携 `[data-draft]`（无 `id` ⇒ 显式键 = 行名）+ `data-draft-scope` = `key:<名>` |
| 7 | `thincoder-desktop/renderer/views/settings-controls.mjs`（134 ⇒ **137**）【**在列五档外 —— 第六档 · 披露**】 | `:11-14` · `:120-121` | 渠两形表单 `data-draft-scope` = `add:preset` ∕ `add:custom`。**由**：失效集按作用域键控 —— 无作用域取值面则声明无可瞄准；`null` 级联会误伤他表单草稿（设计「作用域粒度 = `[data-draft-scope]` 取值面；provider 两形与其余段实施轮按盘枚举逐径点校」承载）。设计 §4.2 表 ∕ §2.4 文件列待父侧补行 |
| 8 | `.thincoder/tmp/2026-09-29-desktop-carryover-c1.test.mjs`（新 · 661 行）【写门拒 `docs/batches` 直落 ⇒ 暂存位（件头自陈）；父侧收口转正】 | 9 测 | T-659a（平测两向）· T-659b（假 DOM 真结构：形内空格可键入 ∕ Enter 不关形）· M-652a 三腿（清空 ∕ 收形 ∕ 取消）· M-652b（失败径负向两腿）· M-652c（后台读不误伤）· M-652d（标记 + 重挂键入 ∕ 焦点 ∕ 光标保真）· M-652e（源面扫描） |

**读数（机检 ∥ 回归 ∥ 行数账）**

- 批内件 **9/9 绿**。**判别力实证**（临时断线复跑后还原 · FALSIFY 标记零残留）：断两处成功径声明 ⇒ M-652a 清空 ∕ 收形两腿红（`'sk-typed' !== ''` ∕ `'sk-row-typed' !== ''` —— 旧值复活）；断钥行 `data-draft` ⇒ M-652c ∕ M-652d 红（重挂丢键入）；断取消径声明 ⇒ M-652a 取消腿红。⇒ 三处落点皆承重。
- 回归面复跑（批内件）：`2026-09-29-desktop-rebuild-fidelity-M604.test.mjs` **7/8**（1 红 = 导入 ∕ 捕获两断言陈旧 —— 见披露 4）· `…-parity-b10-ui-w2` **13/13** · `…-parity-b10-ui-w3` **19/19** · `…-desktop-residuals-round3` **17/17**。
- `node --check`：7 产品档 + 批内件 **全绿**（8/8）。
- 行数账（设计 §4.2 预期括注）：session-control 235⇒238（≈238）· view-state 290⇒299（≈294）· mount-settings 172⇒184（≈182）· exits 224⇒227（≈231）· props-segments 138⇒147（≈144）· settings-sections 300⇒302（≈301 · **越 300 ⇒ 设计「越线即入越层段」触发句活**）· settings-controls 134⇒137（**表外**）。
- 读回（D6）：7 产品档改点 + 件面逐处回读在盘；探针件（`carryover-c1-probe.mjs` —— providers 读面缺口实测）建后即删（非交付物，读数见披露 3）。

**审计与内评（轮次与终态）**

- **内部 explore 分歧审计（轮 1 · 只读）**：**DEVIATIONS**（0 🔴 · 4 行）——① 其余段成功径（MCP ∕ tools ∕ env）零声明（本轮披露 · 见披露 2）② OUT-OF-LIST：第六档（已披露；审计建议保留 + 设计表补行）③ DOC-DRIFT：`PROJECT.md` §4.2 行数块「实施轮按盘重钉」未办（→ 父侧文档层 · 见读数）④ PARTIAL：providers 读面缺口（已披露 · 父裁①归账）。审计核过：本批标记恰落 6+1 档 ∕ 无第七档 ∕ `invalidateDrafts` 仅住 3 档 ∕ FALSIFY 零残留。
- **内部代码评审（advisor · type=code）轮 1**：**pass**（0 🔴）。🟡#1 = 取消径在途窗内可经残件复活（本批新标记引入）⇒ **采纳随修**；余 🟡 ∕ 🔵 = 文档面 ∕ 数值面 ∕ 登记面（报告级）。
- **fix 轮（实到 1 轮 · 1 处落）**：`cancelKeyEdit` 同拍声明（`mount-settings-segments-providers.mjs:43-49`）+ 件面取消腿（`:522-543`）+ 源面断言（`:656`）。
- **内评轮 2（fix 复核）**：**pass** —— fix 三条声明逐条兑现（声明先于复位写 · 无 `await` 间隔 · 作用域自输入件自携 · 捕获 ∕ 残件同滤）；窗口机制实核（`views/settings.mjs:223` 段壳携 `data-state`）；零新 🔴 ∕ 零新 🟡。
- **终态 = `clean`**（单轮 fix 收敛）。

**披露 ∕ 范围外（报父侧）**

1. **第六档**（上表 #7）：`renderer/views/settings-controls.mjs` 在列五档外 —— 由 = 作用域取值面按盘缺失（见该行）；设计 §4.2 表 ∕ §2.4 文件列补行归父侧文档层。
2. **其余段同缺陷类未落**：设计 §2.4(a) 机制句点名六径，本批落二径（provider 两形 ∕ 钥存）；MCP 增 ∕ 改（`mount-settings-segments.mjs:208 ∕ :270`）· tools 钥存（`:154`）同缺陷类在册（env 暴露低 · agent 零申报件）；且失效集按作用域键控 ⇒ tools ∕ env 无作用域件须先补作用域面。文件在在列域外（父裁①口径）⇒ 建议父侧登账 ∕ 另轮。
3. **providers 读面缺口**（父裁①已立账）：`mount-settings-reads.mjs:60-65` ready 写整体替换切片（不并持 `edit` ∕ `keyDraft` ∕ `probe` ∕ `draft`）⇒ 钥编辑中触 `refreshSettings` 复读 ⇒ 编辑态收、键入丢（探针实测在盘：edit → undefined）。M-652d 按可达腿（非 providers 背景读）落 —— 该真机腿适用范围须同笔收窄措辞。
4. **跨批陈旧红 1 条**：`docs/batches/2026-09-29-desktop-rebuild-fidelity-M604.test.mjs` 同腿**两条**断言（`:347` 导入行 · `:348` `const fresh = captureView(root)` 捕获行）因本批 import ∕ 闸体变化陈旧（先抛 `:347`）—— 跨批随动归父侧收位（RF 批先例：批件随动归父侧）；置换断言在册 = 本批件 M-652e。
5. **序列外读数**：`…-i18n-split` A2 ∕ A6 与 `…-desktop-config-read-receipt` 腿 1 ∥ 2 = 改前即红（他批在飞 ∕ 自陈修前红）——非本批肇因。
6. **行数账**：见读数（view-state 299 距 300 顾问线 1 行；settings-sections 302 越线；设计 §4.2 四行待重钉 + providers 行描述补「取消径」一句）。

**未跑面（如实）**：仓套件零跑 ∕ 零改（全清令口径）；`not repo-suite verified — the parent-side closeout run is the only repo-suite run.` 真机腿（真 Electron）零跑（本舱无电子环境）—— 归父侧探针面。

### 5.#660 舱 2 实施记录（eng-coder · 2026-09-29）

**交付摘要**：**#660（KD-47 ⑤ 零块帧领用门放宽）三件全落**——① 门撤 `blocks > 0`（`activity.mjs:167` `const adopt = body !== null && body !== undefined && root._poolSubSession === model.key`——零块 ∧ 审批在场帧同走 `adoptPool`，两族键控差分生效）；② 零块弃账收窄（`:155-158` 仅 `_poolSub = null` + `clearActivityNew`，`_poolSubSession` 保留——会话账存续）；③ `adoptPool` 空族支（`:104-110` 族壳摘离 + 弃容器账 + 零 `syncSubBlocks` 调用）；④ R5 保持（下次出生 `live ?? build(subFamilyNode(model))` 全新建，`:112`）；⑤ 空族守卫（`pool-subagents.mjs:104` `if (!family || typeof family.querySelectorAll !== "function") return`——调用面 ∥ 守卫两案并落，设计「两案等价 · 实施定形」在册）。判据外语义零改 ∥ 设计档零触 ∥ 需求档零触。终态 **clean**。

**逐处表（file:line）**

| # | 处 | 动作 | 设计判据（承 §2.7 / KD-47 ⑤） |
|---|---|---|---|
| 1 | `thincoder-desktop/renderer/views/activity.mjs:167` | 领用门 = `body ∧ _poolSubSession === model.key`（撤 `blocks > 0`） | ① 门撤一判（逐字同形） |
| 2 | `activity.mjs:155-158` | 零块帧弃账收窄（容器账弃 ∕ 会话账留） | ② 弃账收窄 |
| 3 | `activity.mjs:104-110` | `adoptPool` 空族支（摘壳 + `_poolSub = null` + 会话账落 + `syncActivityNew` + `return`） | ③ 空族支 |
| 4 | `activity.mjs:112` | `live ?? build(subFamilyNode(model))`（出生全新建） | ④ R5 零块弃账语义保持 |
| 5 | `activity.mjs:25-29 ∕ 83-88 ∕ 129-135 ∕ 164-165 ∕ 152-154` | 档注随动（模块头三径 ∕ adoptPool ∥ mountPool 档注 ∕ 门 ∥ 弃账注释） | D6 注释 ↔ 代码一致 |
| 6 | `thincoder-desktop/renderer/views/pool-subagents.mjs:104`（档注 `:100-102`） | 空族守卫（防御面——调用面空族支已断） | ⑤ 空族调用守卫（或调用面守卫） |
| 7 | `.thincoder/tmp/2026-09-29-desktop-carryover-c2.test.mjs`（终位 = `docs/batches/` 同名件——待父侧转正） | 批内件：M-660a（`:187`）· M-660b（`:227`）· M-660c（`:252`）· 空族支 × 折叠（`:275`）· 空族支 × 墓碑（`:293`）· 空族守卫（`:310`） | §2.7 验收判据（M-660a–c 全覆 + 边界补足） |
| 8 | `.thincoder/tmp/2026-09-29-desktop-carryover-P10.probe.mjs`（终位同上） | 真机两腿：A 审批钮身份 ∕ hover ∕ focus ∥ 跨帧点按（`:89-159`）· B 出生 ⇒ 族壳新建 ∥ 出表摘壳 ∥ 再出生换代（`:161-183`）+ `failed ∕ verdict` + 非零退出码（`:215-221`） | §2.7 真机腿 |
| 9 | `.thincoder/tmp/2026-09-29-desktop-carryover-P10-readings.json` | 探针读数档（23 判自述） | 判面留痕 |

**决策透明表（实施定形 · 设计已授权「两案等价」或「件名实施轮定」处）**

| # | 选择 | 依据 / 被否 |
|---|---|---|
| 1 | 空族守卫**两案并落**：调用面空族支（`activity.mjs:104-110` 零 `syncSubBlocks` 调用）+ 池件防御守卫（`pool-subagents.mjs:104`） | §2.7 ③ 字面（零调用）∥ §2.11 披露②「空族调用守卫——或调用面守卫，实施定形，两案等价」——并落 = 两案合取，零语义差 |
| 2 | P10 = **新建单件**（非 RF 探针扩腿） | 任务书点名单件路径 ∥ §4.2「探针件（批族——件名实施轮定）」；RF 在册探针无 P10 可扩（件名归属请父侧收位定） |
| 3 | 焦点保真腿改**池面独帧**（`subBlocks` 键——不入对话流面键集）采 | 池键帧帧尾对话流审批卡 F-置焦自动锚（`app.mjs:195`）夺焦于流内安全出口（独立机制·本批零干涉）——该配置下焦点实际落点另注 `notes` ∕ 不入断言（腿名 `aFocusKeptPoolOnly` 自陈射程） |
| 4 | 帧源 = 合成 `pool.running` 自增 + 一条 `ev:approval` 同件复现**真事件链帧** | 合成帧驱动沿 P2 ∕ P4 ∕ P9 先例；事件帧补生产帧源可达性（`aEventFrameKept`） |
| 5 | 批内件假 DOM 收正（`insertBefore` ∕ `appendChild` ∕ `replaceWith` 先摘后插） | 族键控差分重排所需（非此则假 DOM 复现条目）；局限（`isConnected` 恒真）已登记件头 |

**读数（本舱亲跑）**

- **批内件**：`node --test .thincoder/tmp/2026-09-29-desktop-carryover-c2.test.mjs` ⇒ **6 ∕ 6 pass**（M-660a–c + 两边界 + 空族守卫）。
- **负向对照（判别力自证 · 跑毕还原复绿）**：门回撤（加回 `blocks > 0`）⇒ M-660a 红；弃账回撤（`_poolSubSession = null` 归位）⇒ M-660a 红；空族支回撤（摘壳调用注释）⇒ M-660b 红。真机侧：门回撤 ⇒ P10 `verdict:false`（8 判红：`aEntrySame ∕ aBtnSame ∕ aFamilySame ∕ aFocusKeptPoolOnly ∕ aClickSameBtn ∕ bBornEntryKept ∕ bClearEntryKept ∥ bRebornEntryKept`）；三轮均还原复绿。
- **P10 探针（真 Electron）**：`node .thincoder/tmp/2026-09-29-desktop-carryover-P10.probe.mjs` ⇒ **23 判全 true · `failed:[]` · `verdict:true` · exit 0**；读数档在盘（`.thincoder/tmp/2026-09-29-desktop-carryover-P10-readings.json`；关键读数：`entrySame ∕ btnSame ∕ familySame ∕ hoverSameBtn ∕ click.sameBtn ∕ aEventFrameKept = true` ∥ `familyFresh` 两处 true）。**披露**：池键帧下焦点实际落点 = 对话流安全出口（`frames.activeDesc:"BUTTON.deny"`——F-置焦独立机制），焦点保真腿按池面独帧采（腿名自陈）。
- **`node --check`**：两源档 Syntax OK。
- **行数账（内容行口径）**：`activity.mjs` **181 ⇒ 194**（+13：空族支本体 9 ∕ 注释 4；vs §4.2 预测 ≈186 = +8 差额 = D6 档注预算）· `pool-subagents.mjs` **130 ⇒ 132**（+2；预测 ≈133 = −1）——两档均**未越 300**。`c2.test.mjs` 313 行 · `P10.probe.mjs` 228 行。

**暂存位（写门事实 · 请父侧收口转正）**：两交付件本应落 `docs/batches/2026-09-29-desktop-carryover-c2.test.mjs` ∥ `…-P10.probe.mjs`——子代理写门（「cross-batch batch-record write」）拒批内伴随件（`-c2` ∕ `-P10` ∕ `-M660` ∕ 点形四名皆拒，实测）⇒ 按 RF 批 §5「件暂存位」先例暂存 `.thincoder/tmp/` 同名（两层深 ⇒ 相对 import ∥ REPO 计算与终位一致）。件名 ∕ 收位 = 父侧动作；一次性诊断件 `p10-diag.mjs` 建后即删（非交付物）。

**审计与代码评审轮次（终态 clean）**

- **内部 divergence 审计（explore · 只读）轮 1**：**四类偏差均未发现**（partial ∕ silent-simplification ∕ doc-drift ∕ out-of-list）——三项设计要点 + R5 + 守卫全落；表外产品码零；档注 ↔ 代码一致。
- **内部代码评审（advisor · type=code）轮 1**：**pass**（0🔴 · 3🟡 ∕ 5🔵——皆非 must-fix）。发现面：焦点腿射程登记 ∕ KD-47 ①句与 ⑤句两述（doc 面）· 暂存位 ∕ §5 协调项 · 合成帧源 ∕ 行数漂移 ∕ 假 DOM 局限 ∕ 边界覆盖 ∕ 件名归属。
- **fix 轮（实到 1 轮 · 4 处落）**：① 焦点腿改名 `aFocusKeptPoolOnly` + 件头自陈射程；② 补 `ev:approval` 真事件链帧 + `aEventFrameKept` 判面；③ 批内件补「空族支 × 折叠」∥「空族支 × 墓碑帧」两用例 + 假 DOM `isConnected` 恒真局限登记；④ 行数账回填（194 ∥ 132）。
- **内部代码评审轮 2（核加固篇）**：**pass**（0🔴；加固面逐件在盘；残留 = 文档面 ∕ 协调面）。
- **终态 = clean**（修正轮 ≤5，实到 1）。

**评审残留（归属父侧 · 非本舱实施面）**：① 批档 §2.7 `:113` 验收句 ∕ `docs/desktop/design/PROJECT.md:89` KD-47 ⑤ 句 → 焦点腿射程限定登记（或另立台账项「池键帧下对话流置焦夺焦」）；② 同档 `:89` KD-47 ①句「头 ∕ 审批 ∕ 队列族原位重建」随 #606③ 收正（代码合 ⑤）；③ 同档 `:246 ∕ :247 ∕ :806` 行数回填（194 ∥ 132）；④ 两交付件转正 + P10 件名归属。

**零触**：设计档零触 ∥ 需求档零触 ∥ §1–§4 零改 ∥ 台账零写 ∥ 判据外语义零改 ∥ 仓套件零写 ∕ 零改 ∕ 零跑；表外改动 = 仅 `.thincoder/tmp/` 本舱件（两交付件 + readings + 一次性诊断件〔已删〕）。

### 5-c3-probe 探针舱 · #656 真机腿（A/B 两腿 · 真 Electron）· 2026-09-29

**交付摘要**：补 #656 真机腿（§2.5 验收末句；§5.4 未决项 1 归父侧项）——新档 `.thincoder/tmp/2026-09-29-desktop-carryover-c3.probe.mjs`（终位同名 `docs/batches/…` —— 任务书指定暂存位 → 父侧收位，写门先例）+ 读数档 `…-c3-readings.json`（同制）。**状态构造 = 真链路**（非注入）：桩模型服务（OpenAI 兼容 SSE · 每轮回一枚 `read` 工具调用）+ `agent.maxTurns=2` ⇒ 每段回合 2 轮撞帽 ⇒ `ContinueError` ⇒ cap 询问门（`turn-face.mjs` `askContinue` ⇒ `suspensions.mjs` ⇒ `ev:question`）⇒ 询问卡在流内显形 = **cap 待答态**；队列填充 = 真提交 ×8（busy 径：键入 + Enter）；Ctrl+I 携文 = 真键位（`Control+i` ⇒ 中断模态 ⇒ Enter）；队数读数 = 宿主权威（`history:page` 回执 `queue` 键）+ 渲染镜面（`pending` 切片）。

**判面（25 判 · 逐判具名；`EXPECTED_CHECKS = 25` 计数门 —— 录制数 ≠ 25 ⇒ verdict 假，零「全绿」空条款）**

| 组 | 判名 |
|---|---|
| 夹具 | fBootOk · fProjectOpened · fSessionActive |
| 腿 B（队空 ⇒ 受理径） | bCapQuestion1 · fQueueEmptyAtStart · bInterruptModeEntered · bNoToastAccepted · bNoRejectLog · bQuestionSettled · bNextCapQuestion2 · bDeliveredUserBlock · bQueueConsumed · bInputNoReinject |
| 腿 A（队满 8 ⇒ 拒收径） | aQueueFilled8 · aPreNoToast · aPreQuestionPending · aInterruptModeEntered · aToast · aRejectLog · aInputReinjected · aQuestionKept · aQueueUnchanged · aPendingUnchanged · aStillRunning · aNoNewModelCall |

**读数（本舱亲跑）**

- **净跑**（run1/3/5/6/7/9/11 —— 首净 + 各修订轮复核）：`verdict:true` · `failed:[]` · **25/25** · **exit 0**。关键读数：腿 B —— `userTexts` 恰含一枚「B 携文」（`matches 1` ∥ 队清空 ∥ 零 toast（窗 + 末态双读）∥ 输入 `""` ∥ 询问 q1Gone + 新 promptId 显形 ⇒ 携文回合再撞帽）；腿 A —— toast 文本 === `t("input.slotFull")` 逐字 ∥ `queue` 8 条逐字同 ∥ 携文零入队 ∥ 询问同 promptId 在场 ∥ 输入逐字回注 ∥ `running` 位标存续 ∥ `stubChatCalls` 4→4（静默窗零新模型调用）。
- **判别力对照（负向 · 临时突变 ⇒ 已还原）**：断 `thincoder-desktop/src/main/turn-input.mjs` 入口预检（`:110` 加 `&& false`）⇒ **7 判转红**（`aToast` ∥ `aRejectLog` ∥ `aInputReinjected` ∥ `aQuestionKept` ∥ `aQueueUnchanged` ∥ `aPendingUnchanged` ∥ `aNoNewModelCall`）· 腿 B 全绿 · **exit 1**；还原（行哈希基准 `c282e319c13a` 前后一致）后复跑 25/25 · exit 0（run10 突变 ∥ run11 净跑 = 终版）。证据 = `.thincoder/tmp/…-c3-readings.mutation.json`（`verdict:false` + 7 红 + `probeHash`）∥ run{2,4,8,10} 突变日志。
- 有界谓词等待（`waitForFunction` + 兜底 `catch` 后照断言）∥ 非零退出码（exit 1 ∥ 0 双证）∥ 读数档落盘 + **版本绑**（`ts` ∥ `probeHash` = 探针件 SHA1 `acf00b0e…`，certutil 实核一致）。
- **not repo-suite verified**（全清令：仓套件零跑 —— 父侧收口轮为唯一套件口径）。

**审计与代码评审（轮次与终态）**

- **内部 explore 偏差审计（只读 · 阻塞）轮 1**：**CLEAN** —— 四类偏差零命中（半量 ∥ 静默简化 ∥ 文档漂移 ∥ 越声明未披露）；§2.5 真机腿句素 → 25 判一一对位（审计局限自陈：exit code 由日志 + `process.exit` 三元机械推出；D6 读回为过程动作）。
- **内部 advisor 代码评审（type=code · 同步）轮 1**：**VERDICT: pass**（0 🔴 · 🟡×2 非 must-fix · 🔵×6）。🟡 = 探针 304 行越 300 顾问线（在册债口径 · 未越 500）∥ 父侧收位未落（协调项）。🔵 = `connected` 恒真判 ∥ 腿 B 缺席判有界窗 ∥ 档头声明 ∥ 判面刻度（「可作答」∥「零终局」）∥ 读数档零版本绑 ∥ 辅助证据件未登记 ∥ 夹具哈希复刻单源。
- **fix 轮（实到 1 轮 · 4 处采纳）**：① 删 `connected` 恒真判（`bCapQuestion1` 收正）；② 腿 B 补末态 toast 重读（`postB.toastLate` 并入 `bNoToastAccepted`）；③ 读数档增 `ts` ∥ `probeHash` 版本绑；④ 档头登记判别力证据两件 + 「可作答」措辞收正（「作答控件在场：选项 ≥2」）+ 「零终局」标注代言关系 + 夹具哈希注「漂移即红」。**复核 = 突变（exit 1 · 同 7 红）⇒ 还原（行哈希核）⇒ 净跑（25/25 · exit 0）**。
- **终态 = `clean`**（单轮 fix 收敛；未开评审轮 2 —— fix 全 🔵 级且以机械复跑复核；轮 2 与否 = 父侧门）。

**披露**

1. **暂存位**（任务书指定 · 写门先例）：两交付件住 `.thincoder/tmp/` ⇒ 请父侧收位转正 `docs/batches/`（连同证据两件：`…-c3-readings.clean1.json` ∥ `…-c3-readings.mutation.json`）。
2. **探针 304 行**（越 300 顾问线；未越 500）——判面 ∥ 夹具 ∥ 头注三面挤在一件（件名单一 = 任务书指定）；拆分 = 新件（超出本舱件单）⇒ 请父侧裁。
3. **过程留痕**：run1–run11 日志 ∥ 首净副本 ∥ 突变副本两读数件（暂存位；档头已登记）。
4. **首跑即绿**（run1）：机制（cap 待答态 ∥ 队满 ∥ 拒收 ∥ 可见形）真机一次到位；零页错（`pageErrors: []`）。
5. **零产品码净改**：唯一触档 = `turn-input.mjs` 临时突变两番（行哈希基准前后一致 · git 核）；设计档 ∥ 需求档零触。
6. **读数档内保留**：`consoleTail` 两条启动相位噪声（`ledger:read failed: no-project` ∥ `batch:status failed: missing`——开项目前相位，非 #656 面）——如实留痕不修。

**零触**：设计档零触 ∥ 需求档零触 ∥ §1–§4 零改 ∥ 台账零写 ∥ 判据外语义零改 ∥ 仓套件零写 ∕ 零改 ∕ 零跑。

## §6 验证与收口（父代理）

**§6 验证与收口（主 agent）· 2026-09-29**

- **交付核验**：三舱（#135 ∥ #136 ∥ #137）+ 文档面回填（#151）+ c3 真机探针（#152）逐处抽核在盘；批内件三件亲跑——c1 **9/9** ∥ c2 **6/6** ∥ c3 **6/6**（终位 `docs/batches/2026-09-29-desktop-carryover-{c1,c2,c3}.test.mjs`）；真机探针两件——P10 **23/23 `verdict:true`**（审批钮身份 ∥ 族壳新建）∥ c3 **25/25 `verdict:true`**（队满拒收径 ∥ 队空受理径——突变 7 判红判别力已证）。
- **c3 探针 304 行越顾问线 = 接受**（单件 ∥ 未越 500 ∥ 拆分无增益——父侧裁在册）。
- **台账**：#659 ∥ #652 ∥ #660 ∥ #656 → 核销；#649 → 续账（实施 = 下个性能面轮）；遗留：#671（读面缺口）∥ #678（M604 断言）∥ #679（四径）∥ #683（mount-onboarding ∥ 真机腿措辞）。
- **turn-driver 终值**（347 ⇒ 252）归 structure-split-2 收口轮统一（#151 留待项 ∥ #154 执行中）。
- **状态**：本批收口。
