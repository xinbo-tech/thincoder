# 2026-10-04 · 模型切换解锁（忙态门放开——随时可切 · 下一回合生效）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-04 · 来源 = 用户 2026-10-04 17:02 走查「桌面版对话面板上的模型选择器总是被锁着，到底什么时候能允许换模型啊？」。
> 台账 = #918（requirement——升级为批）。前情 = 无（独立批；承 #883（CLI∥VSC 会话选定写回——回声门先例）∥ 忙态门收正轮（F-W14·D-W16））。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-05
**开批登记（2026-10-04 17:0x · 主 agent）**：**来源** = 用户 17:02 走查（「桌面版对话面板上的模型选择器总是被锁着，到底什么时候能允许换模型啊？」）。**父侧实核（锁机制 · 实读）**：① 锁点 = `thincoder-render-core/composer/panel.mjs:400-418`——`modelSwitchBlocked = busyState() !== "idle"` ⇒ 模型 ∥ 推理两钮 `disabled` + `aria-disabled`（进忙态兼关已弹浮层）；② 三值域来源 = 桌面 `composer-sync.mjs:124-133`——`running`（tabBadges 含 running——回合 ∥ 消化 ∥ 标题窗）∥ `susp`（`ev:susp` 置位标——挂起窗活跃）⇒ 挡；余 `idle` ⇒ 可点；同域 = VSC `chat-panel.mjs:55-59` `_turnState`（门住共享核——跨端生效）；③ **根因 = 非缺陷，门太窄**：真 idle 窗口在活跃使用中罕见（回合后有消化/标题/挂起窗接力）——「总是被锁着」体验与设计意图（防旧快照覆写槽位——`model-menu.mjs:414-418` 忙态零回写）错位；④ 选择语义 = 下一回合生效（槽位读点 = 回合起跑）——即「忙期切换」在语义上无害；⑤ 先例 = #883（CLI∥VSC 会话选定写回——回声门 `lastPushedPrefs` 机制已落）——写面保护可替代「硬挡」。**交付目标** = 解锁策略（哪些窗放开/保留——取向待设计论证）∥ 写面保护（防旧快照覆写的替代机制）∥ 两端同域处置 ∥ 视觉/aria 随正。**边界** = 不改模型菜单内容/候选面 ∥ 不改选择语义（下一回合生效保持）∥ 不扩 ACP 面。**授权口径** = 全链（用户 12:18「都自动跑吧」在效）。
## §2 批次任务与设计（eng-designer）
**状态行**：设计完成
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**§2 批次任务与设计（eng-designer · 2026-10-04 · initial 轮）**

**本批条目（覆盖 · 台账 #918 · 用户 2026-10-04 17:02 走查；授权口径 = 全链）**
- **R1 · 解锁（共享核——两端同件）**：模型 ∥ 推理两钮**全放开**——任意忙态（`running` / `susp`）可点、可开菜单、可选定；`disabled` / `aria-disabled` 派生退场；进忙态不再关已弹浮层；`/model` 斜径同钮同门 ⇒ 忙态恒受理（`slash.busy` 拒退场）。
- **R2 · 写面保护（替代硬挡）——偏好键单写者**：会话级偏好三键（`provider` / `model` / `effort`）的唯一写者 = **显式选定** + **首播种**（槽缺）；**回合关联落盘一律不携三键**——槽在场 ⇒ 槽值赢 ∥ 缺 ⇒ 携记忆值播种。忙期选定不被旧快照覆写。
- **R3 · 桌面宿主 `session:prefs` 忙态拒收退场**：在飞期选定**受理（写盘 + 回执）**、**施加顺延**（回合尾 `settleTurn` 落盘之后 `loadAgentSlot`）——回合一致性保持（在飞回合不换模型）+ 下一回合生效兑现。
- **R4 · VSC 同域**：共享核解锁随件生效；VSC 四处回合落盘（`slotStamp` 四处）改**播种印章**（seed-only）——忙期选定不被回合尾印章覆写。
- **R5 · 回写门保留（判据收窄）**：`models` 推送自动回写（系统回声径）忙态零回写**保留**（F-W14 原判据收窄为回写门——用户径放开 ∥ 系统径保留；防陈旧推送回声覆写新选定）。
- **R6 · 跨端明书**：CLI 无此钮（零触——明书）；共享核改动不触 CLI 面。
- **R7 · 文档收正 + 验收机检**（设计档逐处见「设计档落点」；机检/真机见「验收对照」）。

**解锁策略论证（①）**

取向 = **(a) 全放开 + 写面保护**。逐候选：

| 候选 | 处置 | 理由 |
|---|---|---|
| a) 全放开（任意时刻可点；下一回合生效） | **取** | 语义无害（槽读点 = 回合起跑——桌面：选定写盘 + 回合尾施加；VSC：回合入口 `_activeData` 恒读槽 ⇒ 下一回合自取新值）；「总是被锁着」体验直消；写面保护立起后无剩余硬挡理由 |
| b) 仅放开 `susp`（保留 running 挡） | 否 | 目标未达（`running` = 最常态锁定窗）；且 `susp` 与 `running` 在写面风险上**同类**（同属「回合关联落盘携起跑快照」风险面）——只放 `susp` 不消风险、反留半状态 |
| c) 仅放开 `running`（保留 susp 挡） | 否 | `susp` 窗（后台消化长窗）恰是最想改模型的时段；保留 ⇒ 「常常被锁着」 |
| d) 全放开但忙期点击仅开菜单、提交延后 | 否 | 同钮两套行为（交互分叉——用户不可预期）；「可选而不生效」仍是假 affordance；写面保护立起后「延后」只剩**施加**需延迟（选择即时写盘）——d 的延后提交诉求由延迟施加吸收 |

**「susp 窗旧快照覆写槽位」风险的替代解法评估（① 尾）**（逐候选）：
- **保留 `susp` 硬挡**：被否——体验目标相抵（候选 b），且只覆盖 `susp`，`running` 窗同险（回合尾落盘同为起跑快照——`panel-turn-stages.mjs:87-89` 印章面）。
- **`susp` 落盘面单点特判**（只治 susp 快照）：被否——同险在 `running` 窗口的回合尾落盘与在飞蒸馏落盘面俱在；特判 = 半量修复（残余覆写面仍在）。
- **全落盘面「偏好键不携」（播种除外）**：**取**——根源消（见 ②；键面判据单源、两端口径同形）。

**写面保护设计（② · 取候选 c 的推广形——「根源消」）**

**判据（单源）**：会话级偏好三键（`provider` / `model` / `effort`）**单写者**——① 显式选定（桌面 `setSlotPrefs`/`writeSlotPrefs` 径 ∥ VSC `selectModel` case 的 `_saveLines` 显式写位）② 首播种（槽缺）。**回合关联落盘不携三键**——在场判据 = `provider` 非空串 ∧ `model` 真值（`effort` 为键在场——`null` 是合法档位值）；在场 ⇒ 槽值赢 ∥ 缺 ⇒ 携记忆值播种。

**机制（why）**：落盘面的模型键现值 = **回合起跑快照**（桌面 `saveSession` 写 `agent.activeProvider/activeModel`（`session.mjs:131-132`——内存态，回合中不随选定更新，且 `agent.provider` 为请求面活读 `agent/chat-call.mjs:27` ⇒ 回合中改内存 = 回合内混模型，禁）；VSC 写回合起跑 `slotStamp`（`panel-turn-stages.mjs:87-89`）——四处落盘 spread 覆写（`panel-turn-loop.mjs:272` ∥ `panel-turn-stages.mjs:134` ∥ `panel-callbacks.mjs:238` ∥ `:253`））⇒ 忙期选定写入槽后被起跑快照覆写 = F-W14 原型。同族先例 = `effort` 键的「携带防抹除」判据（`SESSION.md` §6.21 判据句 5——同一缺陷面，既有解法；本批把同判据推广到三键）。

**实现落形（逐端）**：
- **VSC**：`saveLines`（`panel-session-write.mjs:37`）增**播种通道**——四处落盘点把 `{ ...slotStamp }` 改 `{ seed: slotStamp }`；`saveLines` 三键取值 = 显式写位（`extra.activeProvider/activeModel`）> 槽在场值 > seed > 现行兜底。（`suspension.mjs:306` ∥ `timer-watch.mjs:36` 已传 `{}`——槽在场值天然保留，零改。）
- **桌面**：核 `saveSession`（`session.mjs:110`）增**加性选项** `prefsSeedOnly`（仅桌面两落盘点传——`session-io.mjs` `saveAgentSlot` ∥ `saveDistilledSlot`；CLI / VSC 零传 ⇒ 零变）：三键写面 = 槽在场值优先（`provider`/`model` 非空复合在场 ∥ `effort` 键在场）；缺 ⇒ 记忆值播种（`effort` 缺键 ⇒ 不落键——禁回填语义保持）。`token-ttl.mjs` `persistEngTokens` 无需改——既有文件径 = 读-改-写只动 token 字段（不覆写）；全新文件径 = 槽缺 ⇒ 播种面（判据自洽）。
- **被否**（写面保护候选）：**a) 回声门延伸（#883 机器）**——回声门（`lastPushedPrefs` + 播种回声门）治的是「自身推送回声回写」面，**不治回合落盘覆写**（覆写者 = 回合起跑快照，非推送回声）；单用 ≠ 闭合。**b) `seq` 复合仲裁（旧快照低序拒）**——须给三键引入序号载体（槽字段 + 两端落盘/推送全链透传）= 新协议面 + 存量槽兼容面；而本缺陷「新/旧」判据可由**在位判据**（槽在场）结构性给出（无时序竞态面——落盘与选定皆单线程串行），序号 = 过度面。**d) 写后复读确认**——补偿控制（覆写与治愈之间存在分叉窗：页读 ∥ 跨端读可读旧复合），且须覆盖全部落盘径（含核内径）；不取为**主机制**（若评审裁作辅件，可叠加，非必需）。

**逐径时序表（② 尾 · 两端全径）**

| # | 端 | 径 | 时序（解锁后） | 保护点 |
|---|---|---|---|---|
| D-A | 桌面 | 空闲点击 | 点选 ⇒ `selectModel` ⇒ `session:prefs` ⇒ 写盘 + 立即施加（`loadAgentSlot`）+ 选定写回（`defaultModel`——#880 零改） | 零改（现行） |
| D-B | 桌面 | 在飞点击（`running` / 窗内回合 / 蒸馏在飞） | 点选 ⇒ 写盘（**受理**——回执 `meta` 即时刷面）+ **不施加** + 记 `_pendingPrefsApply`；回合尾：落盘（`prefsSeedOnly` ⇒ 槽三键不被起跑快照覆写）⇒ 施加（`loadAgentSlot`——内存=盘，取槽新值）⇒ 清位；**中止径（`dispose` ∕ 切项目 ∥ 装配期 `aborted`）⇒ 位随 agent 丢弃**（零施加 ∥ 零残留——位住 agent 对象，无独立清理面） | R2 + R3 |
| D-C | 桌面 | `susp` 窗间隙点击（无在飞回合） | 同 D-A（在飞判据假 ⇒ 即时施加；窗内下一轮起跑前 `reloadSlot` 读槽同值——零双写） | 零改（现行） |
| D-D | 桌面 | 在飞蒸馏落盘（`saveDistilledSlot`） | 落盘时槽三键在场 ⇒ 零改写 | R2 |
| D-E | 桌面 | 回合尾落盘（`saveAgentSlot`——done/stopped/error 三径同点） | 同上 | R2 |
| D-F | 桌面 | `models` 推送自动回写（系统回声） | 忙（非 `idle`）⇒ **零回写**；idle ⇒ 照发（同值回声——`changed:false` 零配置写） | R5（保留） |
| D-G | 桌面 | 播种（新会话/空槽首回合） | 槽三键缺 ⇒ 落盘携运行复合 = 槽播种 | 零改（语义保持） |
| V-A | VSC | 在飞点击 | 点选 ⇒ `selectModel` case ⇒ 写槽 + 选定写回 + `_pushSessions`（宿主无忙态门——零改）；**下一回合**入口 `_activeData` 读槽 ⇒ 生效；在飞回合持起跑 `p` ⇒ 回合内零变 | R1 |
| V-B | VSC | 回合落盘四径（`finalizeTurn` ∥ `onComplete` ∥ `onDistilled` ∥ turn-loop） | `seed` 印章 ⇒ 槽三键在场零改写；缺 ⇒ 播种；`effort` 经 `...existing` 天然保留（零改） | R4 |
| V-C | VSC | `models` 推送自动回写 | 同 D-F（共享核同件） | R5 |
| C-A | CLI | 无此钮 | 零触（明书：无模型/推理钮；`/model` 忙期由输入面斜杠门禁吞——既有面，非本批） | — |

**③ 两钮同域 + 门族逐点退场清单（消费点清点 · 实读）**

| 落点 | 现行 | 处置 |
|---|---|---|
| `composer/panel.mjs:400-402` `modelSwitchBlocked()` | `busyState() !== "idle"` ⇒ 两钮禁用判据 | **判据收窄 + 更名** `writebackBlocked()`——只作回写门（R5）；钮面判据退场 |
| `composer/panel.mjs:409-419` `applyModelSwitchGate()` | `disabled` + `aria-disabled` + 进忙态关两浮层 | **整件退场**；`applyBusyLock`（`:433`）删调用行（占位符三态零改） |
| `composer/panel.mjs:269` `blocked: () => modelSwitchBlocked()` | 注入 model-menu | 保留注入（指向更名判据 `writebackBlocked`） |
| `composer/model-menu.mjs:298` `open()` 入口守卫 | 忙态返 false（零浮层、零写槽） | **退场**（恒受理；斜径契约返值形保持——恒 `true`） |
| `composer/model-menu.mjs:320` 推理钮点击守卫 | 忙态 return | **退场** |
| `composer/model-menu.mjs:415` `applyModels` 回写门 | `if (!blocked())` | **保留**（读更名判据——R5） |
| `renderer/slash-commands.mjs:32` `/model` `rejectKey: "slash.busy"` | 忙态门同钮同门 | **退场**（无门可达假径——`slash.busy` 键随之退役：`renderer/i18n-views.mjs` 两语表；核 `i18n.mjs:76` 批注为历史注记保留） |
| `panel.mjs` 件头注释 / `model-menu.mjs:22,258,294` 注文 | F-W14 判据描述 | 逐处收正（判据二分：用户径零门 ∥ 回写门保留） |
| 样式面 `composer.css` `.ctrl-btn:disabled` | 两钮可见禁用态 | **保留**——仍有消费者（`/plan` ENG 态 `controls.mjs:88`）；零改 |

**④ 视觉 / aria / 浮层（正形）**：去 `disabled` 与 `aria-disabled` ∥ 忙期点击 = 正常开菜单（同 idle 面）∥ 进忙态**不再** `close()` / `closeReasoning()`（选择可跨状态继续；「假 affordance」前提已消）∥ 信息钮**保位不隐藏**（既有判据保持——`D-P9` 分工面零改）。

**⑤ 跨端处置表**

| 端 | 面 | 处置 | 明细 |
|---|---|---|---|
| 桌面 | 钮（核件工厂）+ 宿主写面 + 落盘面 | **放开**（本批主面） | R1（核）+ R3（宿主）+ R2（落盘） |
| VSC | 钮（共享核同件）+ 落盘面 | **同批放开**（同域——共享核不可分；核改 = 两端同变） | R1（核同件）+ R4（落盘 seed 印章） |
| CLI | 无此钮 | **零触 · 明书** | 无模型/推理钮面；`/model` 忙期斜杠门禁 = 既有面（不在本批射程） |

**设计档落点（本批已收正 · 机制面逐处）**：
- `docs/render-core/design/RENDER-CORE.md`：§5 条 6 补解锁批注（钮面门退场 ∥ 回写门保留 ∥ 写面保护指针）+ 斜径 `slash.busy` 句收正 + 变更记录一行。
- `docs/desktop/design/COMPOSER.md`：**KD-19** 收正（在飞受理 + 延迟施加 + 落盘不携三键）∥ §2 斜径注项 4 收正（`/model` 忙态放开）∥ D6 行「在飞拒 `busy` 零写」句收正 ∥ 变更记录一行。
- `docs/desktop/design/IPC.md`：「会话级偏好注」项 4（施加面——在飞受理 ∥ 施加顺延）∥ 项 7（reason 闭集 五 ⇒ 四档——`busy` 退役）∥ §2 `session:prefs` 行「五档」随正 ∥ 变更记录一行。
- `docs/desktop/design/UI.md`：§1 输入区行「忙态写门 = 模型 ∕ 推理钮 `disabled`」句收正（全放开 + 指针）。
- `docs/vsc/design/WEBVIEW.md`：§4.2 整节重写（F-W14 收正——钮面零门 ∥ 落盘保护 ∥ 回写门）∥ §6 **D-W16** 收正 ∥ §8 **U-W9** 收正 ∥ §10 回指行收正 ∥ 变更记录一行。
- `docs/vsc/design/WEBVIEW-PROTOCOL.md`：§13 `selectModel` / `selectReasoning` 两行注列收正 ∥ §4.4 忙态派生消费者行收正（修正轮）。
- `docs/desktop/design/E2E-TESTING.md` ∥ `docs/desktop/design/PROJECT.md`：**T-DSK43 ③** 句收正（「回合在飞 ⇒ 两钮 `disabled`」⇒ 可点/菜单开/选定入槽；unlock 用例面归本批批内件）。

**受影响文件表（file:line 级 + 行数预算——口径 = read 工具行号实读 as-of 2026-10-04 设计轮；「预期」= 设计预算，实施轮按盘回填）**

| # | 文件 | 现行 ⇒ 预期 | 改动点 |
|---|---|---|---|
| 1 | `thincoder-render-core/composer/panel.mjs` | **485 ⇒ ≈478**（净 −7）——**越 300 在册**；本批 = **结构性触碰**（整件删——逻辑删改）⇒ 处置 = **续期**（距 500 硬限余 15）；**拆分预案** = 提交 ∥ 斜径拦截段出档（拟新增 `thincoder-render-core/composer/panel-submit.mjs`）；**消解窗口** = 下次结构性触碰的批 | `modelSwitchBlocked` ⇒ `writebackBlocked`（更名 + 注文收正）· `applyModelSwitchGate` 整件删 · `applyBusyLock` 删调用行 · 注入行随正 · 件头注收正 |
| 2 | `thincoder-render-core/composer/model-menu.mjs` | **456 ⇒ ≈450**（净 −6）——**越 300 在册**（在册 = `docs/render-core/design/RENDER-CORE.md` §6 斜径段）；本批 = **结构性触碰**（两守卫删）⇒ 处置 = **续期**（距 500 硬限余 44）；**拆分预案** = 菜单族按段出档；**消解窗口** = 下次结构性触碰的批 | `open()` / 推理钮两守卫删 · 回写门注文收正 · 件头 / 工厂注收正 |
| 3 | `thincoder-desktop/renderer/slash-commands.mjs` | **65 ⇒ ≈64** | `/model` 条目 `rejectKey` 删 + 注文收正 |
| 4 | `thincoder-desktop/renderer/i18n-views.mjs` | **386 ⇒ ≈384**（净 −2；按盘复核 2026-10-04）——**越 300**（在册 = `docs/desktop/design/PROJECT.md` §4.1；本批 = 键行删 ⇒ **续期**） | `slash.busy` 两语键退役（en ∥ zh；实施轮核 i18n 机检面无键断言——现盘实读零命中） |
| 5 | `thincoder-desktop/src/main/agent-host.mjs` | **327 ⇒ ≈331**（净 +4；按盘复核 2026-10-04）——**越 300**（在册 = `docs/desktop/design/PROJECT.md` §4.1（306 ⇒ 327 同笔）；本批 = 支改 + 记位 ⇒ **续期**） | `setPrefs` 忙态拒删（`:239`）⇒ 在飞支：写盘受理 + `_pendingPrefsApply` 记位（不施加）；注收正（`:225-233`） |
| 6 | `thincoder-desktop/src/main/session-io.mjs` | **65 ⇒ ≈76** | `saveAgentSlot` / `saveDistilledSlot` 带 `prefsSeedOnly` 选项（`saveSession(agent, { prefsSeedOnly: true })`）+ 新导出 `applyPendingPrefs(agent)`（封 `_pendingPrefsApply` 位 + `loadAgentSlot`）+ 注 |
| 7 | `thincoder-desktop/src/main/turn-face.mjs` | **197 ⇒ ≈203** | `settleTurn` 落盘后调 `applyPendingPrefs(agent)`（`:69-74`）+ 注 |
| 8 | `thincoder-core/session.mjs` | **265 ⇒ ≈272** | `saveSession(agent, opts)` 加性选项 `prefsSeedOnly`——三键「槽在场赢 / 缺播种」（写前读槽 + `effort` 键在场判据）+ 注 |
| 9 | `thincoder-vscode/src/extension/panel-session-write.mjs` | **145 ⇒ ≈152** | `saveLines` 三键取值链（显式写位 > 槽在场 > `extra.seed` > 兜底）+ 注 |
| 10 | `thincoder-vscode/src/extension/panel-turn-stages.mjs` | **247 ⇒ ≈247** | `finalizeTurn` 落盘改 `{ seed: slotStamp, … }`（`:134`）+ 注一行 |
| 11 | `thincoder-vscode/src/extension/panel-callbacks.mjs` | **325 ⇒ ≈325**（±0；按盘复核 2026-10-04）——**越 300**（本批 = 行级形改 ⇒ **续期**；拆分预案 = `docs/vsc/design/VSC-DEBT.md` §12.2） | 两落盘改 `{ seed: slotStamp, … }`（`:238` ∥ `:253`）+ 注一行 |
| 12 | `thincoder-vscode/src/extension/panel-turn-loop.mjs` | **303 ⇒ ≈303**（±0；内容行数口径 · 按盘复核 2026-10-04）——**越 300**（在册 = `docs/vsc/design/VSC-DEBT.md` §12.1；本批 = 行级形改 ⇒ **续期**；消解窗口 = 下次结构性触碰的批） | 落盘改 `{ seed: slotStamp }`（`:272`） |
| 13 | `docs/batches/2026-10-04-desktop-model-switch-unlock.test.mjs` | — ⇒ **新档 ≈180** | 批内件（用例见下——随批留存 ∥ 不进仓套件） |
| 14 | 设计档八档（见「设计档落点」——末条含 `E2E-TESTING.md` ∥ `PROJECT.md` 两档） | 本批已收正（读回在报告） | 机制面逐处 |

**测试面（批内件 · 可机判 · 先红后绿）**：
- **T1 钮面解锁（核 · 假 DOM 直驱）**：`turnState` = `running` / `susp` 两态 ⇒ 两钮 `disabled === false` ∧ `aria-disabled` 缺席 ∧ 点击模型钮 ⇒ `.mm-overlay` 在场；`/model` 斜径同态 ⇒ `run` 返真 ∧ 零 toast。**改前红**（现态 `disabled === true`）。
- **T2 回写门保留（核 · 假 DOM）**：忙态 `models` 推送（prefs 命中）⇒ 零 `selectModel` / `selectReasoning` post；idle ⇒ 照发。改前绿（负控在案）。
- **T3 源判据（核 · 结构机检）**：`panel.mjs` ∥ `model-menu.mjs` 零 `modelSwitchBlocked` ∥ 零 `applyModelSwitchGate` ∥ 零 `aria-disabled`（整档负扫成立——现盘 `aria-disabled` 唯两处：`panel.mjs:405`（注）∥ `:413`（`setAttribute`），皆 `applyModelSwitchGate` 本体 ⇒ 整件删后恒零；`model-menu.mjs` 零命中）；`writebackBlocked` 在位。**改前红**。
- **T4 落盘保护（核 `saveSession` 直测）**：临时槽 + 假 agent——槽复合在场（M2）⇒ `prefsSeedOnly` 保存后复合仍 M2 ∧ 无选项 ⇒ 记忆值覆写（现行形对照）；空槽 ⇒ 播种；`effort` 键在场 ⇒ 槽值保留。**改前红**（无该选项）。
- **T5 桌面宿主源判据（结构机检）**：`agent-host.mjs` 零 `fail("busy")` ∧ 含 `_pendingPrefsApply`（位 = agent 对象字段——中止径随弃 ∥ 零模块级位表）；`session-io.mjs` 两落盘点带 `prefsSeedOnly` ∧ `applyPendingPrefs` 导出；`turn-face.mjs` 结算尾调用在盘。**改前红**。
- **T6 VSC 落盘源判据（结构机检）**：四处落盘点含 `seed:` 印章（逐处）∧ `saveLines` 三键判据句在盘；`slash.busy` 两语键退场（负扫）。**改前红**。
- **回归面**：核 ∥ 桌面 ∥ VSC 三端既有测试树扫该面（实读零命中——`modelSwitchBlocked` 仅住两核档）；批内件自体 = 唯一机检件；复跑 = `node --test docs/batches/2026-10-04-desktop-model-switch-unlock.test.mjs`（仓根）。

**验收对照（回指批单验收 + 机检/真机两面）**：
- **AC-1（R1）**：忙态（`running` ∥ `susp`）两钮可点 ∥ 菜单开出 ∥ `/model` 忙态受理 —— 机检 T1；**真机**：桌面真 Electron 三态（idle / running / susp）各一次走查。
- **AC-2（R5）**：忙态 `models` 推送零回写 —— 机检 T2。
- **AC-3（R2/R3/R4）**：忙期选定 ⇒ 槽实变 ∧ 回合尾落盘后槽三键不变 ∧ 内存背施加（下一回合起跑取新值）—— 机检 T4 ∥ T5 ∥ T6；**真机（父侧闭合）**：桌面 busy 期切模型 ⇒ 当前回合模型不变（`ev:usage` ∥ 日志面）⇒ 回合结束后再发 ⇒ 新模型起跑；VSC 同径；**中止径腿**：装配期 `aborted` ∥ `dispose` ∕ 切项目 ⇒ 位随 agent 丢弃（零施加 ∥ 零残留——机检 = T5 位形句）。
- **AC-4（R6）**：CLI 零触（源扫无该面改动）—— 明书句在档。
- **AC-5（R7）**：批档 §2 齐备（条目 ∥ 策略论证 ∥ 时序表 ∥ 跨端表 ∥ 门族清单 ∥ 受影响表 ∥ 验收 ∥ KD ∥ 边界 ∥ 上抛）—— 读回在报告。
- **AC-6（R7）**：设计档八档收正落盘（逐处读回）∧ `node scripts/doc-check.mjs` exit 0 · 零悬空 —— 报告面读数。

**关键决策（KD-U1–U6）**
- **KD-U1 解锁取向 = 全放开 + 写面保护**（候选 a；被否 b/c/d 逐条见 §2 策略论证）。
- **KD-U2 写面保护 = 根源消（偏好键单写者 · 落盘不携三键 · 播种除外）**（候选 c 推广形；被否 a 回声门（不治落盘覆写）· b `seq` 仲裁（过度面——槽在场判据结构性给出）· d 写后复读（补偿控制，非主机制））。
- **KD-U3 桌面施加延迟 = 写盘即时 + 回合尾施加**：在飞期**不重施**（`agent.provider` 为请求面活读——`chat-call.mjs:27`——回合中重施 = 回合内混模型，破 KD-19 回合一致性）；回合尾 `settleTurn` 落盘后重施（彼刻内存=盘，全量 `applySession` 安全）⇒ 下一回合生效兑现。**被否**：立即重施（混模型）· 不施加（下一回合不生效——空诺）。
- **KD-U4 回写门保留 = 用户径 ∥ 系统径分治**：用户径零门（全放开）∥ 系统回声径（`models` 推送自动回写）忙态零回写保留——防陈旧推送回声覆写新选定（F-W14 原判据的正当面）。**被否**：两径同退（陈旧回声可覆写——静默回退复活）· 回写门扩至 idle（无风险面仍缩——过度）。
- **KD-U5 跨端同批**：VSC 隨共享核解锁（同件不可分——核改 = 两端同变）；差异登记 = 无（两端同取向同判据）；CLI 明书零触。**被否**：仅桌面放开（须另造桌面专用门 = 第二实现 / 分叉核件）。
- **KD-U6 落盘保护实现面**：桌面 = 核 `saveSession` **加性选项**（唯一传者 = 桌面两落盘点——CLI / VSC 零传 ⇒ 零变；`token-ttl` 既有形自洽零改）；VSC = `saveLines` **seed 通道**（沿用既有「existing 保留 / extra 覆写」契约）。**被否**：核全域翻转（CLI `/model` 选定赖 `saveSession` 落槽——全域反转即破 CLI 选定）· VSC 落盘改独立函数（旁路既有 full-overwrite 契约）。

**边界（不做）**：不改模型菜单内容/候选面 ∥ 不改选择语义（下一回合生效保持）∥ 不改 `ev:susp` 协议帧 ∥ 不扩 ACP ∥ 需求 / 提示词面零触 ∥ 他批面零触（CLI 面零触）∥ 不做：VSC 试运行语义（`turn-model.mjs`）零改 ∥ 不做：`_saveLines` / `_activeData` 契约形改 ∥ 不做：`queuedUserMessage` 载荷面改（队内消息随该回合模型——登记见上抛）。

**上抛项**
- **U1 · 需求面核对（主 agent 笔权）**：① VSC 需求 **F-W14**（`docs/vsc/requirements/WEBVIEW.md:39`）原文含「（选择持久，或按钮显式忙态禁用——二选一）」——本取向 = **前者**，需求文本零触即合规；② 桌面需求 **D6**（`docs/desktop/requirements/COMPOSER.md:12`）实读零 `busy` 措辞 ⇒ 零触；③ 若主 agent 认为需求面需补「随时可切」判据句（验收面），请裁（本批零触需求档）。
- **U2 · i18n 键退役**：`slash.busy` 两语键随 `/model` 拒径退役（消费面实读 = 仅 `/model` 条目；批内件 / 基线 json / dist 旧包为记录面 / 构建物——零触）。若实施轮核出机检键集断言（现盘实读零命中），随批同正或键保留为惰性键并登记——请实施轮按实读定。
- **U3 · 台账 #918**：批档已锚；状态流转 = 主 agent。
- **U4 · 观察（非阻断 · 留观）**：`applyModels` 自动回写的 **idle 面极窄竞态窗**（推送-写回 与 用户选定 IPC 往返交错 ⇒ 同值回声后到可覆写新选定）——本批以忙态门覆盖主要面（忙期 = 该窗主现时段）；idle 窗（毫秒级）登记留观，再现 ⇒ 另批给 `seq` / 回声簿记补口。
- **U5 · 观察（语义边界登记）**：忙期选定后，**回合内**步边界注入的排队消息随该回合模型（不混模型——KD-40「下一步生效」= 消息面；模型面仍「下一回合生效」）；`queuedUserMessage` 载荷携 `model`/`reasoning`（核件面板给）但桌面写面不消费——**有意**（不混模型优先），零改。

**设计轮收笔读数（2026-10-04 · 报告面）**：`node scripts/doc-check.mjs` —— **exit 0** · **OK(锚)：0 条悬空** · OK(行宽)（首跑曾因本批三处收正行超 300 字符 ⇒ 已折行复跑绿）；列报面 = 存量「迁移期引文 ∕ 拟新增」条目 + 行数面差异 10 条——均报告态 · 不入闸 · 非本批引入。设计档八档收正已落盘（edit 逐处读回）；产品码零触（设计轮）。

**§2 修正块（修正轮 · 评审 #53 · 发现 #1–#10 逐号 · 父侧裁 = 全采纳 · eng-designer · 2026-10-04）**

**逐号落位**：

- **#1（🔴 → 落）**：`COMPOSER.md:262`（T-DSK28 ④）⇒「④ 在飞 ⇒ 受理（写盘 + 回执携 `meta`）· 槽不可读 ⇒ 拒 `slot-missing` · 键不合法 ⇒ 拒 `bad-key`——拒径两档皆**零写**且失败缺 `meta` 键」；`PROJECT.md:1195`（批 B 注 · T-DSK28 机检面）「在飞拒 `busy` 零写」⇒「在飞受理（写盘 + 回执携 `meta`）」；**同机制残句扫（评审未列 · 逐处披露）**：`COMPOSER.md:133`（#880 批注项 2「在飞拒 `busy` 照旧零写」删——条件随 `busy` 径退场不可达）∥ `SHELL.md:187`（`agent-assemble.mjs` 行「在飞 ⇒ 拒 `busy` 零写——KD-19」⇒「在飞 ⇒ 写盘受理 ∥ 施加顺延」）。
- **#2（🔴 → 落）**：`COMPOSER.md:99`（§2 项 6 真机腿）∥ `:264`（T-DSK56 ⑤）两腿句 ⇒「忙态 `/model` ⇒ 菜单开出 ∧ 零 toast ∧ 文本清空」；`:95` 词键表去 `slash.busy`（`:94` 计数「三键 ⇒ 两键」同拍）；`RENDER-CORE.md:78`（KD-RC-12）「反馈三键」⇒「反馈两键（`slash.unknown` ∥ `slash.args`）」。
- **#3（🔴 → 落）**：`WEBVIEW-PROTOCOL.md:188`（§4.4）择**收正**（不取整行删——§4.4 忙态面权威锚保持）⇒「**Send ∥ Stop 两组**（`running` 期——Send 隐藏 ∥ Stop 常显；判据 = `S._turnState`）；模型 / 推理按钮**零忙态门**（随处可切——单源 = `WEBVIEW.md` §4.2；本档不复述（D2））」；批档「设计档落点」该档行同拍补 §4.4。
- **#4（🔴 → 落）**：受影响表 #1 ∥ #2 两核档行补三件（越 300 在册 ∥ 拆分预案 ∥ 消解窗口——两档 = **结构性触碰** ⇒ 处置 = **续期**〔纯删改零新增面；距 500 硬限余 15 ∥ 44〕）；#4 ∥ #5 ∥ #11 三档补续期句（非结构性）；`RENDER-CORE.md` §6 增「模型切换解锁批随动」段（两核档现行 ⇒ 预期 + 越层处置句）。
- **#5（🟡 → 落）**：表 #12 行现值 = **303**（read 实读 · 内容行数口径）· 预期 ≈303（±0——`{ seed: slotStamp }` 形改 + 注）· 300 层判定 = **越 300 ⇒ 续期**（在册 = `docs/vsc/design/VSC-DEBT.md` §12.1）。
- **#6（🟡 → 落）**：按盘钉定——`panel.mjs` **485**（批档 ✓；`RENDER-CORE.md:403` 489 ⇒ 485——#911 落盘后；硬限余 15 同笔）∥ `agent-host.mjs` **327**（批档 328 ⇒ 327；`PROJECT.md:412` 306 ⇒ 327；`SHELL.md:182` 306 ⇒ 327 同笔——doc-check 行数面 Δ 消）∥ `i18n-views.mjs` **386**（批档 ≈380 ⇒ 386；`PROJECT.md:394` 386 ✓）；同口径复核另得 `panel-callbacks.mjs` **325**（批档 326 ⇒ 325——随 #4 行同笔）。
- **#7（🟡 → 落）**：① 面名「忙态写门」⇒「忙态两钮可点」（`E2E-TESTING.md:142` ∥ `PROJECT.md:988` ∥ `PROJECT.md:1108` 输入列——三处）；② 判据行去沿革从句（`E2E-TESTING.md:183` ∥ `PROJECT.md:1108`——新态直陈；沿革留各档变更记录〔两档已在册〕）；同句中断键句按核件两态收正（非在飞 ⇒ 键隐——`E2E-TESTING.md:183`）。
- **#8（🔵 → 落）**：§2 时序表 D-B 行补中止边界句 + AC-3 补中止径腿 + T5 位形句；裁 = **位随 agent 丢弃**（零独立清理面）。
- **#9（🔵 → 落）**：T3 保留整档负扫 + 列明实读依据（现盘 `aria-disabled` 唯两处 = `panel.mjs:405` ∥ `:413`，皆 `applyModelSwitchGate` 本体 ⇒ 整件删后恒零；`model-menu.mjs` 零命中）。
- **#10（🔵 → 落）**：「设计档七件」⇒「**八档**」（表 #14 行 ∥ AC-6 两处）。

**计数**：发现 **10**（🔴4 ∥ 🟡3 ∥ 🔵3）全落；同机制残句扫 **+2 处**（`COMPOSER.md:133` ∥ `SHELL.md:187`——评审未列 · 已披露）；受影响表值修正/填充 **4 行**（#4 i18n-views ∥ #5 agent-host ∥ #11 panel-callbacks ∥ #12 panel-turn-loop）；`RENDER-CORE.md` §6 新增随动段 **1**；owning 档读数同笔 **3 处**（`RENDER-CORE.md:403` ∥ `PROJECT.md:412` ∥ `SHELL.md:182`）。

**本轮读数（2026-10-04 · 修正轮）**：`node scripts/doc-check.mjs` —— **exit 0** · **OK(锚)：0 条悬空**（闸态——阈值 0）· **OK(行宽)** 绿 · 无闸态失败（X 未入闸 = 0）；行数面差异 **10 ⇒ 9 条**（SHELL `agent-host` 一处随本笔消——余 9 = 存量报告态 · 不入闸 · 非本批引入）。变更记录逐档一行（COMPOSER ∥ RENDER-CORE ∥ WEBVIEW-PROTOCOL ∥ PROJECT ∥ E2E-TESTING ∥ SHELL）。产品码零触（修正轮）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**射程限制（明书）**：文档地图未声明 ⇒ Document ownership 按 Project Guide（AGENTS.md）与射程内单源指针判；项目标准档未声明 ⇒ 方法论按 AGENTS.md（讨论→文档即时 ∥ 行数纪律 300/500 ∥ 无构建）+ 射程内档内纪律判；**产品码行数未 spot-check**（评审射程 = 仅射程内八档文档——受影响表现值未逐档盘面复核，只做射程内跨档对读）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 文档归属 / 验收面 | 🔴 | `session:prefs` 在飞行为同机制两处异述：验收行 `docs/desktop/design/COMPOSER.md:262`「④ 在飞 ⇒ 拒 `busy` · 槽不可读 ⇒ 拒 `slot-missing` · 键不合法 ⇒ 拒 `bad-key`——三径皆**零写**且失败缺 `meta` 键」+ T-DSK28 机检面枚举 `docs/desktop/design/PROJECT.md:1195`「通道往返 / 键闭集 / 在飞拒 `busy` 零写 / 表外档位字面串归一 `null` / 老槽零回填 / 失败径三档：`model-required` / `slot-missing` / `bad-key`」——与同批已收正句 `COMPOSER.md:15`「在飞（`flights.has(key)`）⇒ **写盘受理 ∥ 施加顺延**」· `docs/desktop/design/IPC.md:207`「**四档**（`busy` 随 2026-10-04 解锁批退役：在飞选定受理）」相抵 | 两处句收正为「在飞 ⇒ 受理（写盘 + 回执携 `meta`）」并去 `busy` 档；T-DSK28 机检面枚举（「在飞拒 `busy` 零写」腿）随正为「在飞受理」腿 |
| 2 | 文档归属 / 验收面 | 🔴 | `/model` 忙态拒径残述（两腿句 + 键面）：`COMPOSER.md:99`「忙态 `/model` ⇒ 拒 ∧ 文本留」· `COMPOSER.md:264`「⑤ 忙态 `/model` ⇒ `slash.busy` 拒（文本保留），忙态 `/plan` ⇒ 钮态翻转（同钮门）」· `COMPOSER.md:95` 词键表「`slash.busy`（en `Unavailable while the turn is running — try again when it finishes`；zh `回合运行中不可用——请等回合结束后重试`）」· `docs/render-core/design/RENDER-CORE.md:78`「反馈三键（`slash.unknown` ∥ `slash.busy` ∥ `slash.args`）经端注册面供给（先例 = `input.slotFull`）」——与 `COMPOSER.md:93`「`/model` **恒受理**（模型钮忙态门已放开——随处可切；`slash.busy` 键退役）」· `RENDER-CORE.md:245`「`slash.busy` = **已退役**（模型钮忙态门随 2026-10-04 解锁批放开——`/model` 恒受理、条目零 `rejectKey`；端两语键随退役）」相抵 | 两腿句收正（忙态 `/model` ⇒ 菜单开出 ∧ 零 toast ∧ 文本清）；`COMPOSER.md:95` 词键表去该键（三键 ⇒ 两键）∥ `RENDER-CORE.md:78` 反馈键枚举随正（三键 ⇒ 两键）；与受影响表 #4（i18n 两语键退役）同拍 |
| 3 | 文档归属 | 🔴 | `docs/vsc/design/WEBVIEW-PROTOCOL.md:188`（§4.4 · 权威锚）以现在时声明钮面忙态门：「模型 / 推理按钮的忙态门（禁用派生 · 两处入口守卫 · 与 D-P9 的分工）单源 = `WEBVIEW.md` §4.2——本档不复述（D2）」——其指为单源的 `docs/vsc/design/WEBVIEW.md:109` 已收正为「**钮面零忙态门**（用户 2026-10-04 17:02 走查裁——「总是被锁着」）：模型 / 推理按钮**任意忙态可点**」；本批对该档落点仅列 §13 两行（批档 `:96`），§4.4 未及 | 该行收正（忙态派生消费者改记 Send ∥ Stop 两组；模型 ∥ 推理钮退出门族——单源仍指 `WEBVIEW.md` §4.2）或整行删并留指针 |
| 4 | 受影响文件行数注解 / 越层处置 | 🔴 | 受影响表五档现值越 300 层（批档 `:103` `panel.mjs` 485 · `:104` `model-menu.mjs` 456 · `:106` `i18n-views.mjs` ≈380 · `:107` `agent-host.mjs` 328 · `:113` `panel-callbacks.mjs` 326）而全表无越层在册句 ∥ 拆分预案 ∥ 消解窗口判定；其中 `panel.mjs`（`applyModelSwitchGate` 整件删）∥ `model-menu.mjs`（两守卫删）属逻辑删改 = **结构性触碰**——按在册规则（「消解窗口 = 该档下次**结构性**触碰的批」；先例实读 `RENDER-CORE.md:400`「**越 300 在册** ⇒ 处置 = **续期说明**：本批 = 提取 + 导出（≈+12 · 机械提取零新面 ⇒ 非结构性触碰、不构成拆分窗口）；**拆分预案** = 菜单族按段出档」）须给处置；且 `RENDER-CORE.md` §6 无本批随动段（该档逐批惯例——最近例 `:398`） | 受影响表两核档行补「越层在册 + 拆分预案 + 消解窗口（结构性触碰 ⇒ 执行拆分 ∥ 续期）」三件；余三越层档补续期句；`RENDER-CORE.md` §6 补本批随动段（两核档现行 ⇒ 预期 + 越层处置句） |
| 5 | 受影响文件行数注解 | 🟡 | 受影响表 #12（批档 `:114`）`thincoder-vscode/src/extension/panel-turn-loop.mjs` 现值/预期 = 「（实施轮回填）」——本批唯一无现值与增量行（口径自述 = read 实读 as-of 2026-10-04）；该档同时是四处 `seed` 印章落点之一（`WEBVIEW.md:110`） | 补现值（read 实读 · 内容行数口径）+ 预期增量形（`≤±N` 或「结构不变」）+ 300 层判定 |
| 6 | 读数对盘 | 🟡 | 三处现值未对盘：批档 `:103` **485** ∥ `RENDER-CORE.md:403`「核 `thincoder-render-core/composer/panel.mjs` **489（零触**——打印口 = 端侧闭包注入」；批档 `:107` **328** ∥ `docs/desktop/design/PROJECT.md:412`「`thincoder-desktop/src/main/agent-host.mjs` **306**（**新入册**——由 = 首跑渠道提示修复批（#840）实施落盘（298 ⇒ 306」；批档 `:106` **≈380** ∥ `PROJECT.md:394`「`thincoder-desktop/renderer/i18n-views.mjs` **386**（实读 2026-10-03——轻通道轮八（380 ⇒ 386」 | 三值按盘实读钉定（口径 = read 内容行数），同笔收正 owning 档读数（沿「读数 ∥ 坐标」惯例） |
| 7 | 文档卫生 / 验收面 | 🟡 | 规范面残迹两式：① 旧机制面名仍在验收面——`docs/desktop/design/E2E-TESTING.md:142`「**离线不可产面**（停止痕 / 文件链接 / 子代理门审批卡 / 提问卡键焦 / 忙态写门 / 审批卡真置焦）」∥ `PROJECT.md:988` 同串（T-DSK43 ③ 已收正为「可点」）；② 沿革从句留在判据行——`PROJECT.md:1108`「③ 回合在飞 ⇒ 输入区模型 ∥ 推理钮**可点**（2026-10-04 解锁批收正——原 `disabled` 形退场；落盘保护 ∥ 回写门 = 解锁批批内件）」∥ `E2E-TESTING.md:183` 同句（文档卫生裁：AC ∥ 判据行不载「原 X 形退场」式残句；若判为既定负向规格形 ⇒ 该条销） | ① 面名收正（如「忙态两钮可点」）；② 判据行去沿革从句（新态直陈）；沿革留各档变更记录行 |
| 8 | 边界 / 错误径 | 🔵 | 中止 ∥ 装配失败径的 `_pendingPrefsApply` 清理面未书：时序表 D-B（批档 `:55`）只列「回合尾：落盘（`prefsSeedOnly` ⇒ 槽三键不被起跑快照覆写）⇒ 施加（`loadAgentSlot`——内存=盘，取槽新值）⇒ 清位」；会话中止（`dispose` ∕ 切项目 ∥ 装配期 `aborted` 拒径——`IPC.md:122`）下该位随 agent 丢弃 ∥ 需清，未明 | 补边界句（中止径 ⇒ 位随 agent 丢弃 ∥ 显式清，二择一）；AC-3 补该径腿或明书「不覆盖」 |
| 9 | 判据可机检性 | 🔵 | T3（批档 `:121`）源判据含「零 `aria-disabled`」整档负扫——同档他控件若仍有 `aria-disabled` 用法即假红（**unverified**：设计轮未列同档其他 `aria-disabled` 消费点的零命中依据） | 收窄为两钮锚负扫，或列明整档零命中的实读依据 |
| 10 | 计数 | 🔵 | 设计档落点列 7 条（末条含 `E2E-TESTING.md` ∥ `PROJECT.md` 两档）而涉档为 **8**（评审射程同列 8）：受影响表 #14（批档 `:116`）∥ AC-6（`:133`）皆书「设计档七件」 | 计数与列表同改（「七件」⇒「八档」，或列明括注之二档） |

计数：🔴 4 · 🟡 3 · 🔵 3（共 10 行）。

VERDICT: changes-required

### 轮次 2（评审子代理）

**修正轮复评（前表 #1–#10 逐项核验 · 2026-10-04 · 全 Fixed · 新增 🔵 1）**

**射程限制（明书）**：本轮按评审物件声明（模型切换解锁设计 · 修正轮 #54 复评 = 核验前表逐项）核验；指令条 1 所列六档（`docs/batches/2026-10-04-acp-user-docs.test.mjs` ∥ `docs/cli/design/ACP-CLIENT.md` ∥ `thincoder.com/docs/batches/2026-10-04-acp-guide-expansion.md` ∥ `docs/core/requirements/ENGINEERING-MODE-V2.md` ∥ `docs/core/design/prompts/discipline-engineering.md` ∥ `docs/core/design/DOC-DISCIPLINE.md`）属 ACP 用户文档链路——非本物件（范围外注记）；**产品码盘面未实读**（本批「按盘复核」读数为声明值，未逐档实读产品码——文档面一致性核验为限）。

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | #1 | `docs/desktop/design/COMPOSER.md` ∥ `docs/desktop/design/PROJECT.md` | 🔴 | Fixed | `COMPOSER.md:262`「④ 在飞 ⇒ 受理（写盘 + 回执携 `meta`）· 槽不可读 ⇒ 拒 `slot-missing` · 键不合法 ⇒ 拒 `bad-key`——拒径两档皆**零写**且失败缺 `meta` 键」；`PROJECT.md:1195`「通道往返 / 键闭集 / 在飞受理（写盘 + 回执携 `meta`）/ 表外档位字面串归一 `null` / 老槽零回填 / 失败径三档：`model-required` / `slot-missing` / `bad-key`」；`COMPOSER.md:133` 同机制残句已删（同扫 +1）；与 `COMPOSER.md:15`「在飞（`flights.has(key)`）⇒ **写盘受理 ∥ 施加顺延**」∥ `IPC.md:207`「**四档**（`busy` 随 2026-10-04 解锁批退役：在飞选定受理）」齐平 |
| 2 | #2 | `docs/desktop/design/COMPOSER.md` ∥ `docs/render-core/design/RENDER-CORE.md` | 🔴 | Fixed | `COMPOSER.md:99`「忙态 `/model` ⇒ 菜单开出 ∧ 零 toast ∧ 文本清空」· `:264`「⑤ 忙态 `/model` ⇒ 菜单开出 ∧ 零 toast ∧ 文本清空，忙态 `/plan` ⇒ 钮态翻转（同钮门）」· `:94`「两键 + 增量六键 × 2 语」· `:95` 词键表已无 `slash.busy`（余「`slash.args`（en `This command does not take arguments here`；zh `此命令在此不接受参数`）」）；`RENDER-CORE.md:78`「反馈两键（`slash.unknown` ∥ `slash.args`）经端注册面供给（先例 = `input.slotFull`）」；与 `RENDER-CORE.md:245`「`slash.busy` = **已退役**」齐平 |
| 3 | #3 | `docs/vsc/design/WEBVIEW-PROTOCOL.md` | 🔴 | Fixed | `:188`「**Send ∥ Stop 两组**（`running` 期——Send 隐藏 ∥ Stop 常显；判据 = `S._turnState`）；模型 / 推理按钮**零忙态门**（随处可切——单源 = `WEBVIEW.md` §4.2；本档不复述（D2））」；与 `WEBVIEW.md:109`「**钮面零忙态门**（用户 2026-10-04 17:02 走查裁——「总是被锁着」）：模型 / 推理按钮**任意忙态可点**」齐平；批档落点行（`:96`「§13 `selectModel` / `selectReasoning` 两行注列收正 ∥ §4.4 忙态派生消费者行收正（修正轮）。」）已补 §4.4 |
| 4 | #4 | 批档 §2 受影响表 ∥ `docs/render-core/design/RENDER-CORE.md` §6 | 🔴 | Fixed | 表 `:103` ∥ `:104` 两核档带三件（「**越 300 在册**；本批 = **结构性触碰**（整件删——逻辑删改）⇒ 处置 = **续期**（距 500 硬限余 15）；**拆分预案** = 提交 ∥ 斜径拦截段出档（拟新增 `thincoder-render-core/composer/panel-submit.mjs`）；**消解窗口** = 下次结构性触碰的批」∥ 同形）；`:106` ∥ `:107` ∥ `:113` 三档补续期句；`RENDER-CORE.md:408`「**模型切换解锁批随动（2026-10-04 · 批 `docs/batches/2026-10-04-desktop-model-switch-unlock.md` · 台账 #918 · 修正轮复核）**：核 `thincoder-render-core/composer/panel.mjs` **485 ⇒ ≈478**」随动段落位 |
| 5 | #5 | 批档 §2 受影响表 #12 | 🟡 | Fixed | `:114`「**303 ⇒ ≈303**（±0；内容行数口径 · 按盘复核 2026-10-04）——**越 300**（在册 = `docs/vsc/design/VSC-DEBT.md` §12.1；本批 = 行级形改 ⇒ **续期**；消解窗口 = 下次结构性触碰的批）」 |
| 6 | #6 | 批档 ∥ `RENDER-CORE.md:403` ∥ `PROJECT.md:412` ∥ `:394` | 🟡 | Fixed | 三值按盘钉定 + owning 档同笔：`panel.mjs`「**485**（实读 2026-10-04——修正轮按盘收正（489 ⇒ 485」∥ `agent-host.mjs`「**327**（实读 2026-10-04——修正轮按盘收正（306 ⇒ 327」∥ `i18n-views.mjs`「**386**（实读 2026-10-03」（批档 `:106`「386 ⇒ ≈384」） |
| 7 | #7 | `docs/desktop/design/E2E-TESTING.md` ∥ `PROJECT.md` | 🟡 | Fixed | 面名三处「忙态两钮可点」（`E2E-TESTING.md:142` ∥ `PROJECT.md:988` ∥ `:1108` 输入列）；沿革从句删净——`E2E-TESTING.md:183` ∥ `PROJECT.md:1108` ③「③ 回合在飞 ⇒ 输入区模型 ∥ 推理钮**可点** ∧ 中断键可点（**非在飞 ⇒ 键隐**——核件两态 = 显 ∕ 隐）——**离线不可产**」 |
| 8 | #8 | 批档 §2（D-B ∥ AC-3 ∥ T5） | 🔵 | Fixed | `:55`「**中止径（`dispose` ∕ 切项目 ∥ 装配期 `aborted`）⇒ 位随 agent 丢弃**（零施加 ∥ 零残留——位住 agent 对象，无独立清理面）」；AC-3（`:130`）「**中止径腿**：装配期 `aborted` ∥ `dispose` ∕ 切项目 ⇒ 位随 agent 丢弃（零施加 ∥ 零残留——机检 = T5 位形句）」；T5（`:123`）「位 = agent 对象字段——中止径随弃 ∥ 零模块级位表」 |
| 9 | #9 | 批档 §2 T3 | 🔵 | Fixed | `:121` 补实读依据：「整档负扫成立——现盘 `aria-disabled` 唯两处：`panel.mjs:405`（注）∥ `:413`（`setAttribute`），皆 `applyModelSwitchGate` 本体 ⇒ 整件删后恒零；`model-menu.mjs` 零命中」 |
| 10 | #10 | 批档 §2（`:116` ∥ `:133`） | 🔵 | Fixed | 两处已改「设计档八档（见「设计档落点」——末条含 `E2E-TESTING.md` ∥ `PROJECT.md` 两档）」∥「设计档八档收正落盘（逐处读回）∧ `node scripts/doc-check.mjs` exit 0 · 零悬空 —— 报告面读数。」 |
| 11 | (new) | 批档 §2（`:152`） | 🔵 | New | 收笔读数行仍书「设计档七件收正已落盘（edit 逐处读回）；产品码零触（设计轮）。」——与同段修正块 #10 的「八档」相抵（D3 计数与列表同改残项；非阻断） |

计数：原表 **#1–#10 全 Fixed**（各带本轮实读引文）；**新增 🔵 1**（#11）；未决 🔴 **0**。

VERDICT: pass

## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）

**§5 实施记录（eng-coder · 2026-10-04 · initial 轮）**

**状态行**：实施完成

**交付摘要**：受影响表 12 档产品码 + 批内件（新档 `docs/batches/2026-10-04-desktop-model-switch-unlock.test.mjs`，T1–T6 六腿）逐行落地——R1 钮面全放开（核 `writebackBlocked` 更名保留 ∥ `applyModelSwitchGate` 整件退场）· R2 写面保护（核 `saveSession` 加性 `prefsSeedOnly`，桌面两落盘点传者）· R3 在飞受理 + 施加顺延（`_pendingPrefsApply` 记位 · `settleTurn` 落盘后 `applyPendingPrefs`）· R4 VSC `saveLines` 三键取值链 + 四处 `seed: slotStamp` 印章 · R5 回写门保留；`/model` `rejectKey` 与 `slash.busy` 两语键退役。零越表改动；需求 ∥ 提示词面 ∥ 设计档八档 ∥ CLI 面均零触。

**机检读数（先红后绿 · 逐腿）**：跑法 = `node --test docs/batches/2026-10-04-desktop-model-switch-unlock.test.mjs`（cwd = thincoder/）
- **改前（红）**：T1 ✖（`running · 模型钮可点（零 disabled 派生）`：true !== false）· T2 ✔（负控在案）· T3 ✖（`零 modelSwitchBlocked`：true !== false）· T4 ✖（`槽复合在场 ⇒ provider 零改写`：'p1' !== 'p2'）· T5 ✖（`零 fail("busy")`：true !== false）· T6 ✖（`finalizeTurn 两分支皆携 seed 印章`：0 !== 2）——tests 6 / pass 1 / fail 5。
- **改后（绿）**：T1–T6 全绿——tests 6 / pass 6 / fail 0（复跑两次一致）；13 档逐档 `node --check` 全过。

**逐档改动与读回（行数 = 内容行数口径）**：
| # | 文件 | 行数（改前 ⇒ 改后） | 改动点（读回坐标） |
|---|---|---|---|
| 1 | `thincoder-render-core/composer/panel.mjs` | 485 ⇒ 466 | `writebackBlocked` 更名 + 注收正（:394-401）· `applyModelSwitchGate` 整件删 · `applyBusyLock` 删调用行（:414-415）· 注入行（:269）· 件头注（:10 ∥ :12 ∥ :38-40 ∥ :263） |
| 2 | `thincoder-render-core/composer/model-menu.mjs` | 456 ⇒ 455 | `open()` 守卫删（:298-317 恒返 true）· 推理钮守卫删（:319-321）· 回写门注（:413）· 件头/工厂注（:14 ∥ :22-23 ∥ :258-262） |
| 3 | `thincoder-desktop/renderer/slash-commands.mjs` | 65 ⇒ 64 | `/model` 条目 `rejectKey` 删（:31-32）· 注文收正（:13-14） |
| 4 | `thincoder-desktop/renderer/i18n-views.mjs` | 386 ⇒ 384 | `slash.busy` 两语键退役（en ∥ zh；各 −1）· ⑬ 组计数收正（:43-45 ∥ :374） |
| 5 | `thincoder-desktop/src/main/agent-host.mjs` | 327 ⇒ 333 | `setPrefs` 忙态拒删（:239）· 在飞支记位（:254-260）· 注收正（:8 ∥ :225-230） |
| 6 | `thincoder-desktop/src/main/session-io.mjs` | 65 ⇒ 77 | 两落盘点带 `prefsSeedOnly`（:40 ∥ :51-53）· 新导出 `applyPendingPrefs`（:55-62） |
| 7 | `thincoder-desktop/src/main/turn-face.mjs` | 196 ⇒ 200 | import（:41）· `settleTurn` 落盘后调用（:74-77）· 注（:8 ∥ :67-69） |
| 8 | `thincoder-core/session.mjs` | 264 ⇒ 275 | `saveSession(agent, opts)`（:113）+ 加性块（:174-181；写前读槽 + 复合在场 ∥ `effort` 键在场） |
| 9 | `thincoder-vscode/src/extension/panel-session-write.mjs` | 144 ⇒ 150 | 三键取值链（:65-70 ∥ :78 ∥ :121；显式 > 槽在场 > seed > 兜底） |
| 10 | `thincoder-vscode/src/extension/panel-turn-stages.mjs` | 246 ⇒ 246 | `finalizeTurn` 两分支改 `{ seed: slotStamp, … }`（:134）· 注（:132） |
| 11 | `thincoder-vscode/src/extension/panel-callbacks.mjs` | 325 ⇒ 325 | 两落盘改 `{ seed: slotStamp, … }`（:238 ∥ :253）· 注（:131-132） |
| 12 | `thincoder-vscode/src/extension/panel-turn-loop.mjs` | 303 ⇒ 303 | 落盘改 `{ seed: slotStamp }`（:272）· 注（:270） |
| 13 | `docs/batches/2026-10-04-desktop-model-switch-unlock.test.mjs` | — ⇒ 333 行（新档） | T1–T6 六腿（T3 带整档负扫实读依据句） |

**行数差异披露（vs 设计预算）**：`panel.mjs` 实读 466（≈478——整件删实量大于预算，净 −19）· `model-menu.mjs` 455（≈450）· `agent-host.mjs` 333（≈331）· `session-io.mjs` 77（≈76）· `turn-face.mjs` 200（≈203）· `session.mjs` 275（≈272）· `panel-session-write.mjs` 150（≈152）· 余档 ±1 内。均 < 500 硬限；>300 档在册（续期 + 拆分预案）保持。**注**：设计表 4 档「现行」值（turn-face 197 ∥ session 265 ∥ panel-session-write 145 ∥ stages 247）为「末换行计一行」口径（raw），与设计修正块 #5/#6 自述「内容行数口径」（turn-face 196 ∥ session 264 ∥ …）差 1——本报告统一按内容行数口径。

**决策透明表**：
| 决策 | 取值 | 依据 |
|---|---|---|
| 「在飞」判据 | `turnDriver.busyOf(key)`（= `flights.has(key)`，唯一） | D-B / D-C（挂起窗无在飞回合 ⇒ 即时施加；窗内下一轮起跑前 `reloadSlot` 读槽同值） |
| 施加顺延位 | `agent._pendingPrefsApply`（对象字段；零模块级位表） | §2 修正块 #8（中止径随弃，零独立清理面） |
| 核侧「写前读槽」位 | `guardForeignSlotFile` 之后（轮转现场不参与三键判据） | §2 KD-U2「写前读槽」的实现位 |
| VSC 显式写位 | 链首保持 `extra.activeProvider/activeModel` | R4（选定回写径不被降级；`panel-messages.mjs:250` 消费面实读） |
| `effort` 判据 | 键在场（值可 `null`） | §2 KD-U2（`null` 是合法档位值） |
| 越表改动 | 零（受影响表 12 + 1 全等） | 明确规定 |

**审计与代码评审轮次与终态**：
- **偏差审计（explore · read-only）**：1 项 🔵——`panel.mjs:12`「反馈键三键」计数未随退役键收正（同族句设计轮已在文档面收正为两键）；**已修**（⇒「反馈键两键（`slash.unknown` ∥ `slash.args`）」）。其余四类（未落实 / 静默简化 / 越表未披露 / 漂移）零发现；过程面 2 项（§5 空 = 本轮补写 ∥ 主进程+VSC 7 档 `node --check` = 已跑全绿）闭合。
- **代码评审（advisor · type=code）**：**VERDICT: pass**（无 🔴、无 must-fix）——🟡 2（keyless 槽自愈径随「槽在场值赢」关闭〔设计两意图相抵〕∥ settle 尾全量 `applySession` 侧效应超出三键面〔KD-U3 近似前提〕）+ 🔵 3（受影响表「预期」未按盘回填 ∥ 批内件 toast 清计时器依赖 `showToast._t` 内部字段 ∥ 每回合多一次整档解析）。
- **fix round**：1（审计轮 🔵 一处）；评审轮 findings 均非 must-fix ⇒ 零代码改动，逐条上抛（A1–A4）。
- **终态：clean**（审计 🔵 已修；评审 pass）。

**上抛项（父侧裁）**：
- **A1（🟡 · 设计面裁）**：keyless 槽复合的「回合落盘自愈」被 R2/R4 取值链关闭（`panel-session-write.mjs:78` ∥ `session.mjs:178` vs `panel-turn-stages.mjs:50` 既有判据注「keyless 槽不参与复合（运行/播种都自愈到实际渠道）」）⇒ 会话可长期**显示**不可运行渠道而**实跑**回退渠道——登记变更 ∥ 保留自愈支（判据源 = 核 `resolveProviderPlan`），二择一。
- **A2（🟡 · 设计面裁）**：`applyPendingPrefs` 全量 `applySession` 侧效应（`_envResumed` 重武装 ∥ 机读线以盘重建）；KD-U3「内存=盘 ⇒ 全量 `applySession` 安全」为近似前提（同名调用在 idle `setPrefs` 径早已存在——风险有界）。
- **A3（🔵 · 父侧/设计侧）**：受影响表「预期」列按盘回填 + `RENDER-CORE.md` §6 随动段读数（485 ⇒ 466 ∥ 456 ⇒ 455 等）待收正（实施轮不改设计档）。
- **A4（范围外 · 只报不改）**：`ipc.mjs:188`「`reason` 五档」（今四档）· `turn-driver.mjs:12-13/:233`「忙态门」· `webview/loading.js:7`「`modelSwitchBlocked`」三处注释滞后（均不在受影响表）；`session-flags.mjs:82` 模式位写零在飞判据（「在飞不重施」只对偏好径成立）；`renderer/i18n.mjs` 键数链未续 −1 笔。

**边界核验**：需求 ∥ 提示词面零触 ✓ · 设计档八档零触（实施轮）✓ · 他批面零触 ✓ · 批内件不进仓套件 ✓ · 不打包不部署 ✓ · 零网络 ✓。

## §6 验证与收口（父代理）

**收口判词：已收口 2026-10-04**（设计 → 评审 → 修正 → 复评 pass → 实施 12 档 + 批内件 → 父侧核读 → 收口笔；本档冻结）

- **判据链**：用户 17:02 走查 → 设计 #51 → 评审 #53 **changes-required**（🔴4 · 🟡3 · 🔵3——全在文档一致性面）→ 修正轮 #54（#1–#10 全落 + 同族残句扫 2）→ 复评 #55 **pass**（前表全 Fixed；唯一 🔵＝`:152` 计数残项——收口轮清）→ **designToken 签发** → 实施 #56（12 档 + 批内件 333 行）→ 父侧核读（批内件亲跑 · panel ∥ agent-host 核点实读）→ 收口笔（A3 读数回填 ∥ A4 注释滞后三处）。
- **复读（父侧亲跑）**：① 批内件 `node --test docs/batches/2026-10-04-desktop-model-switch-unlock.test.mjs` = **6/6 绿**（改前 1/6——先红后绿成立）；② `node scripts/doc-check.mjs` = **exit 0 · 0 悬空 · 行宽绿**；③ 仓套件（`thincoder-cli` `npm test`）= **空清单零测 = 绿**（2026-09-28 全清重置后）；④ 核点实读：`panel.mjs` `writebackBlocked` 在位 ∥ 零 `modelSwitchBlocked`/`applyModelSwitchGate`/`aria-disabled`；`agent-host.setPrefs` 零 `fail("busy")` ∥ `_pendingPrefsApply` 记位在（`:258`）。
- **上抛裁定（#56 报告 A1–A4）**：**A1**（keyless 槽自愈支关闭）⇒ **登记不改**（设计已载「老槽零回填」——T-DSK28 ⑥ ∥ IPC 项 7；显示-实跑分叉 = 该决策已知面）；**A2**（`applyPendingPrefs` 全量 `applySession` 侧效应）⇒ **登记不改**（同调用 idle 径早已存在——风险有界）；**A3** ⇒ **已落**（父侧机械笔：`RENDER-CORE.md` §6「实施后实读」段 ∥ `PROJECT.md` §4.1 册值 333 ∥ 双档变更记录行；批档 §2「预期」列＝设计期预估保留）；**A4** ⇒ **已落**（轻通道笔：`ipc.mjs:188` ∥ `turn-driver.mjs:12/:233` ∥ `loading.js:7/:12` 三档五处注释滞后收正）+ 余二项在册。
- **在册（非阻断）**：① A4 余二项（`session-flags.mjs:82` 模式位注 ∥ `renderer/i18n.mjs` 键数链 −1 笔——随档触碰随正）；② 设计期预估 vs 实施实读（panel ≈478 vs **466** 等——读数单源 = `RENDER-CORE.md` §6「实施后实读」段 ∥ 本 §6）；③ U4（`applyModels` idle 面毫秒级竞态窗——留观，再现 ⇒ 另批）∥ U5（忙期选定后回合内排队消息随该回合模型——有意 · 零改）；④ `docs/batches/2026-10-01-desktop-slash-commands.test.mjs` 存量红两腿（记录面事实——非本批引入）。
- **结算**：台账 #918 核销；提交 = 本仓一笔（12 档产品码 + 批内件 + 设计档八档 + 三档注释笔 + 本档）；**consume-design**（链终）。
- **用户面**：模型 ∥ 推理两钮**任意忙态可点**——选择**下一回合生效**；`/model` 斜径同放；保护 = 三键单写者（不再靠禁用挡）。**重打包后自见**。
