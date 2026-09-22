# 2026-09-22 · busy-extend
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-22 · 来源 = 用户 2026-09-22 08:26 实测（挂起会话内 busy 输入仍吞——工程会话日常面）→ 08:30「都点火」立批（台账 #224）。
> 台账 = #224（TUI · 归批）。前情 = docs/batches/2026-09-21-busy-injection.md（F16 原批 · 已收口 2026-09-22）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-22
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**本批条目**（来源 = 用户 2026-09-22 08:26 实测 + 08:30「都点火」立批；前情批 = F16 `2026-09-21-busy-injection.md`〔已收口〕——本批 = F16 扩面 + 一处判定复议）：

| # | 面 | 一句话 |
|---|---|---|
| E1 | 挂起内 busy 输入放行 | 吞条件去 `suspended || _suspPending`（两端）：CLI `key-handler.mjs:301` / VSC `send.js` 守卫（C-B2-4 收窄面回开）⇒ 挂起会话内 busy（含 digest）Enter = 单槽排队；**保留吞面 = 模态 / 斜杠 / 空 / 槽满** |
| E2 | 提示句分流 | CLI `render-frame.mjs:401-403` `enterHint` **三态分流**（普通 busy ⇒ 排队语义句 / 挂起内 busy ⇒ 排队语义句 / 槽满 ⇒ `已排队 1 条消息`——逐字 = 设计档 `docs/cli/design/TUI.md` §7.5 表）；VSC 对位文案面随设计核定 |
| E3 | 判定复议（承接） | 前批 T-V16-4「digest 期拒发零改」+ F16 批档 §6 相关判定——冻结档不回改，本批 §6 承接复议结论 |

**根因（父侧实读 · 台账 #224 证据行在册）**：① `suspension-drive.mjs:226/:290` `state.suspended` 会话期恒 true（仅池空退出清）；② 池 live 的用户回合只翻 `agent._suspended`（`:249`）⇒ 挂起会话内 = 工程会话日常面；③ `key-handler.mjs:301` 吞分支命中。**现场实证** = 截图 `.thincoder-paste-1790036927840.png`（红行 + 状态栏句 + 文本保留 + id=2 在飞，四点同帧）；同帧新观察 = `enterHint` 模式盲（见 E2）。

**修法边界**：机制零新造——入槽后走**既有**通道（普通回合 = 回合尾 drain；挂起内 = driver 输入优先消费 `suspension-drive.mjs:246`）；两端独立实现、语义同源；需求面 F16 扩面文字 = 父侧笔（设计轮给建议稿）。设计模型句「Enter 只可能落在挂起空闲/释放窗口」（`suspension-drive.mjs:242-245`）随本批收正。

**范围**：设计档 = 本批写域（`TUI-INPUT-BOX.md` / `TUI.md` / `WEBVIEW-INPUT.md`）；CLI 源 2 档（`key-handler.mjs` / `render-frame.mjs`）+ 测；VSC 源（`send.js` 等——设计轮钉）+ 测；需求档 = 父侧笔；实施随设计 → 评审 → 修轮。

**U1 钉口径（评审轮 1 发现 #6 收口 · 父侧 2026-09-22 08:46）**：采**设计读法**——挂起内 busy 提示句 = **排队语义句**（设计档 §7.5 第 3 行「会话内回合处理中 — Enter 排队（本轮结束后优先发送）」）；本 §1 E2 括注「挂起内 busy ⇒ 现状句」措辞**作废**（实际 = 假陈述收正）；需求面 F16 已同侧（`docs/cli/requirements/TUI.md:37`）。**评审 #7（VSC `input.busyPlaceholder`）裁 = Not an issue**——「提交受限」为中性措辞（单槽限义在两种受理结果下皆真；失效句「禁用」已于前批清除），零动作，§6 记录。**评审 #5 裁 = 记录接受**（`chat-panel-messages.test.mjs` >500 存量债 → 台账 #169；只改述不扩面）。**评审 #1 / #2（双 🔴）父侧实读复核成立**（残留句与 C-B2-6 收正后口径相抵）——修正轮按号收正。

**评审轮 1 修正收尾补漏 + 同族扩面裁定（2026-09-22 08:56 · 父侧）**：① 补漏一支已落（`TUI.md:125` 括注收正——「吞提交不吞字符」→ 受理分流指针；`:672` 变更记录在册；id=8）。② 修正轮实读报出**同族残留 9 处**（`TUI-SESSION-VIEW.md:81/:84` · `AGENT-LOOP-SUBAGENT.md:125/:135` · `AGENT-LOOP.md:91/:125/:416/:442` · `SESSION.md:336/:339`（另 `:556` D-SE30））——**裁定 = 并入本批收正**（F16 + 本批的直接导出面；散在多档的旧口径与 C-B2-6 相抵，正是本批目的面）。其中 **#9（标题窗口语义）** = 设计面待钉：会话标题生成窗口若在 `running` 内 ⇒ `SESSION.md`「标题期拒收」与 C-B2-6「`running` 一律排队」两读法并存——由设计席实读后**择一并给理由**（SESSION.md 收正 ∥ C-B2-6 补例外），随修正块落。

**同族扩面轮（id=9）观察项逐条裁定（2026-09-22 09:0x · 父侧）**：① 观察 1（记录面三处）= 日期化历史，保留零动作。② 观察 2（`TUI-INPUT-BOX.md:118`「替换「提交吞 + busy 提示」分支」· `WEBVIEW-INPUT.md:31`「随本批撤销」）= **合法前向变更指令**（设计档对实施轮的正向施工面描述，非失效表达）——零动作；若他日读作残留，归 #225 族。③ 观察 3（悬空节号两处）= **已就地收正（父侧直接执行 · 指针收正 · 零语义 · 可 revert）**：`TUI-SESSION-VIEW.md:83` · `TUI-INPUT-BOX.md:71`/`:73` 的「`AGENT-LOOP.md` §9」→「`AGENT-LOOP-SUBAGENT.md` §6.8」——依据 = 父侧实读双核：`AGENT-LOOP.md` 节号止于 §8（无 §9）；挂起状态机表实位 = `AGENT-LOOP-SUBAGENT.md:129-131`（§6.8）。④ 观察 4（源码注释面旧口径：`panel-turn-stages.mjs:113/:123/:161` · `panel-messages.mjs:117-122`）= **归实施轮施工面**（两档在本批受影响表内——任务书列「注释随改」项）。⑤ 观察 5（CLI / VSC 标题窗并发面差）= **裁定：记录不修（结构性不对称）**——CLI 标题窗在回合外（`processing=false`）⇒ Enter 自然开新回合；VSC 标题窗在 `running` 内 ⇒ 入槽（#9 择 a 后）；两者皆受理零丢失，差异性质 = 管道结构（非机制面收窄）⇒ 不入「端差默认 = 消」射程；若后续 VSC 侧批再议——§6 记录。

**评审轮 2 裁决（pass · 🔴0 🟡4 🔵5——2026-09-22 09:1x · 父侧）**：① 发现 #1（§1 E2 残留）= **Fixed**（父侧直接执行 · 可 revert——E2 行改纯现态句，失效括注删除；同 09:1x 就地落）。② #2–#9 = **Dispatched**（设计席修正轮 id=11）。③ **域外注（`WEBVIEW-PROTOCOL.md:142`/`:144` 旧口径）= 裁定并入本批**（同族收正——本批机制面直接导出；写域扩展一档 `WEBVIEW-PROTOCOL.md`；§2「本批零触」声明句随之收正为「零协议变更 + 旧口径行收正」；该档 busy 相关活面旧口径一并扫）。④ U1 / U2 维持既有裁定。⑤ §2 本体规范行的**就地收正授权**（AC-6 判据句 · 状态行计数 · 边界句 · 协议零触句——本节在册 normative 行；修正块只记「本体行收正」不留旧形尸体，承 2026-09-18 失效表达裁定；§6 将以收正后 AC 对账）。

**评审轮 2 裁决落地（id=11）父侧抽核 + 债务处置（2026-09-22 09:1x）**：⑥ 抽核 = AC-6 本体句（§2 `:115`）✓ · 协议档 `:142-144`（一律排队受理 + 载体两态 + 三支送达）✓ · 悬空族五处改指 ✓（grep 复扫：活面仅余 `TUI-COMMANDS.md:44` 一处——**父侧就地收正**（指针收正 · 零语义 · 可 revert）：→ `AGENT-LOOP-SUBAGENT.md` §6.8，实读确认所指 = 挂起 digest 无人值守语义；记录面历史行（批档 / TODO-archive / 变更记录旧→新形）与 VSC 侧异档同形引均保留）；机检读数 = 悬空 16 / 行宽 12 基线（设计席自报，父侧未复跑）。⑦ 债务处置：#159 坐标收正（`:77`–`:493` ≈417 行）· `createKeyHandler`（`:38`–`:496` ≈459 行）**新入册**（函数档债 · 归批）· #169 口径差 1（521 vs 记 522）另记。⑧ 设计席观察 4（§2 内两处「三档」= 各轮准确陈述）= 接受（记录面保留）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（处置计数：轮 1 十二发现 = 9 收正 / 3 零动作；同族扩面轮九处旧口径收正 · #9 裁 a＝标题窗口 = running 排队面；轮 2 八发现 + 域外并入一项 = 九项逐号收正；八档变更记录 + §2 三修正块在册）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**本批条目（覆盖）**——承 §1（E1 / E2 / E3），逐条落点与判据：

| # | 面 | 设计落点（本批已写） | 判据（机检口径） |
|---|---|---|---|
| E1 | 挂起内 busy 输入放行 | `docs/cli/design/TUI-INPUT-BOX.md` §4.1（判据表六条 → 五条 · 吞面收敛四）+ §4 两条 busy 句；`docs/vsc/design/WEBVIEW-INPUT.md` §1 C-B2-6（判据 `running` · 单槽载体两态） | 三档读回：§4.1 判据表 5 行且挂起条零残留；§4 无「先经 busy 门禁吞」句；C-B2-6 行含 `S._turnState === "running"` 且 `_suspended` 分流句零残留 |
| E2 | 提示句分流 | `docs/cli/design/TUI.md` §7.5（`enterHint` 三态逐字表 + 提交时行 + 可机判行 + VSC 对位行） | §7.5 三态表三行逐字在位（含 `已排队 1 条消息` 零改行）；§4.1 回指 §7.5 |
| E3 | 判定复议（承接） | 本 §2「上抛项 U5」（前批 §6 判定「T-V16-4 digest 期拒发零改」被本批推翻——冻结档不回改，结论落本批 §6，父侧） | 复议结论在 §2 在案；前批批档零触碰 |

**设计定稿（逐字契约面——三档正文即权威，此处只列会写进实现轮的关键钉）**：

1. **CLI 判据（`key-handler.mjs` busy 门禁）**：放行 = ① `state.processing`（含 digest）∧ ② `state.permission == null && state.question == null` ∧ ③ 非 slash ∧ ④ 文本非空 ∧ ⑤ `state.pendingInput.length === 0`。
   吞面四 = **模态 / 斜杠 / 空 / 槽满**（挂起两态 `suspended` / `_suspPending` 去出吞条件——`key-handler.mjs:301` 现含 `state.suspended || state._suspPending`，本批删两操作数）。
   入槽清理与挂起态分支同款（清框 / `history.push` / `historyIndex=-1` / `_draft=null` / `pendingInput.push`）；挂起面入槽后调 `state._suspWake?.()`（§4 既有分支同款；busy 期该槽为 null ⇒ 零动作），普通 busy 面零唤醒（现状零改）。
2. **CLI 提示三态（逐字 · `render-frame.mjs` `enterHint`）**：① `processing` ∧ 槽非空 ⇒ `已排队 1 条消息`（**零改**）；
   ② `processing` ∧ 槽空 ∧ `!suspended && !_suspPending` ⇒ `主会话处理中 — Enter 排队（回合结束后自动发送）`；
   ③ `processing` ∧ 槽空 ∧（`suspended || _suspPending`）⇒ `会话内回合处理中 — Enter 排队（本轮结束后优先发送）`；非 `processing` ⇒ `Enter: send`（零改）。
3. **VSC 判据（`webview/send.js`）**：busy 即排队面 = `S._turnState === "running"`（`_suspended` 去出分流）；槽满守卫 = `S._busyQueuedPending` ⇒ toast `input.slotFull` + 文本保留 + 不出泡（零改）；
   **C-B2-4 拒发分支删**（`send.js:55-62`）——其唯一残面（挂起会话内 busy）本批回开为排队面 ⇒ 该契约点无面（契约表行删，记录面落 changelog）。
4. **VSC 单槽载体两态（`panel-messages.mjs` `routeUserTurn`）**：无会话 ⇒ `panel._busyQueued`（既有）；**会话在飞（`panel._susp`）⇒ 走既有 `_chat` susp 分支入 `susp.pendingInput`**（槽满守卫 / 唤醒同款——机制零新造）；
   送达三支 = ① 会话在飞：driver 步骤 1 输入优先消费（`thincoder-vscode/src/extension/suspension.mjs:285-300`）② 池 live 进会话：`enterSuspensionTurn` 预填（`panel-turn-stages.mjs:194` splice）③ 池空归位：`deliverBusyQueued` 续发（`:226-233`）；会话退出兜底 = `suspension.mjs` finally 残余直注入（零丢失）。
5. **VSC 镜像判据源扩（`pushBusyQueued`，`panel-messages.mjs:100-102`）**：`pending` = **两载体合计占用**（`_busyQueued` ∪ `susp.pendingInput`）——协议名 / 载荷零变（webview 二次提交守卫跨两面同判）。
6. **VSC 外部入口（`chat-panel.mjs` `sendMessage:265-268`）**：挂起会内 busy 拒收守卫**撤销**（同面受理——消息入会话单槽，回显保留）；`_chat` susp 分支（`:437-449`）入槽项**携来源标记**（`fromBusyQueue` + `visionReader` per-call 缝）⇒ 送达前过 F-1 降级判定（细则⑥ 同一判决函数；`panel-turn-stages.mjs:173-192` `runTurn` 闭包既有支）。

**受影响文件与测试面**（现况行 = 本刻实核；「动作」列 = 实施轮施工面）：

| 档 | 文件 | 现况行 | 动作 | 预计后 |
|---|---|---|---|---|
| CLI 源 | `thincoder-cli/src/tui/key-handler.mjs` | 496 | 吞条件删两操作数（同行长改）+ 挂起面唤醒一行 + 注释随判据收正 | ~498（≤500 触顶在案——**净增 ≤2 行**） |
| CLI 源 | `thincoder-cli/src/tui/render-frame.mjs` | 415 | `enterHint` 二态 → 三态（普通 / 挂起内 / 槽满；非 processing 零改） | ~418 |
| CLI 源 | `thincoder-cli/src/tui/suspension-drive.mjs` | 334 | `:242-245` 模型句收正（「Enter 只可能落在挂起空闲 / 释放窗口」→「busy 期提交亦入本槽（§4.1）」）——注释面，机制零改 | 334（净零） |
| CLI 源 | `thincoder-cli/src/tui/index.mjs` | 499 | submit 双保险注释面收正（**净零行**——499 触顶，禁加行；可零触） | 499 |
| CLI 测 | `thincoder-cli/test/busy-injection.test.mjs` | 219 | T-F16-4 ②形改述（挂起内 digest：吞 → 入槽）+ 新增行（见用例面）+ T-F16-6 扩三态 | ~245 |
| CLI 测 | `thincoder-cli/test/input-lock.test.mjs` | 388 | T-F16-7 第二块（digest 期吞）改述 + 新增挂起内排队格 | ~395 |
| VSC 源 | `thincoder-vscode/webview/send.js` | 93 | busy 分支条件放宽（去 `&& !S._suspended`）+ C-B2-4 拒发分支删（`:55-62`） | ~85 |
| VSC 源 | `thincoder-vscode/src/extension/panel-messages.mjs` | 324 | `routeUserTurn` busy 分支：会话在飞 ⇒ `_chat`（槽满守卫保留）+ `pushBusyQueued` 判据扩两载体 | ~330 |
| VSC 源 | `thincoder-vscode/src/extension/panel-turn-stages.mjs` | 233 | 注释面三处收正（`:113` / `:123` / `:161`——「routeUserTurn 拒收 / 禁排队」口径随本批改为单槽受理 + C-B2-6 指针；注释随改，机制零改） | 233（净零——<300 非存量债 · 无需拆分） |
| VSC 源 | `thincoder-vscode/src/extension/chat-panel.mjs` | 493 | `sendMessage` 拒收守卫撤销（`:265-268`）+ `_chat` susp 分支携来源标记参 | ~492 |
| VSC 测 | `thincoder-vscode/test/busy-injection-vsc.test.mjs` | 350 | T-V16-4a 改述 + 新增行（见用例面） | ~400 |
| VSC 测 | `thincoder-vscode/test/chat-panel-messages.test.mjs` | 521 | ①（`:63`）/⑧（`:279`）挂起会内 busy 拒收断言改述（**存量 >500**——台账 #169 拆档债在案） | ~526 |
| VSC 测 | `thincoder-vscode/test/webview-input-enter.test.mjs` | 206 | T-B2-5（busy 拒发）改述至排队面 | ~210 |
| 设计档 | `docs/cli/design/TUI-INPUT-BOX.md` | 349 | **本批已改**（§4.1 + §4 + §9.2 去向行 + 变更记录） | — |
| 设计档 | `docs/cli/design/TUI.md` | 726 | **本批已改**（§7.5 + §4 门禁括注 + §4 挂起空闲行 + §6.9 边界行 + 变更记录） | — |
| 设计档 | `docs/vsc/design/WEBVIEW-INPUT.md` | 195 | **本批已改**（§1 C-B2-6 + 细则 + §7 U-I2 / U-I8 + §9 行 1 + 变更记录） | — |
| 设计档 | `docs/cli/design/TUI-SESSION-VIEW.md` | 227 | **本批已改**（§1 模块地图行 + §4 两处 + §6.2 去向行 + 变更记录） | — |
| 设计档 | `docs/core/design/AGENT-LOOP-SUBAGENT.md` | 2238 | **本批已改**（§6.8 busy 条 + 状态机两行 + 变更记录） | — |
| 设计档 | `docs/core/design/AGENT-LOOP.md` | 573 | **本批已改**（§2.3 / §6.8 / §6.18 / §7 D-AL9 + 变更记录） | — |
| 设计档 | `docs/core/design/SESSION.md` | 655 | **本批已改**（标题窗口三处 + 变更记录） | — |
| 设计档 | `docs/vsc/design/WEBVIEW-PROTOCOL.md` | 586 | **本批已改**（§4.1 + §3.2 行 16/17 + §12 两行 + 变更记录——协议零变） | — |

（上八行 = **已改档**（非待改）：现况行 = 本批落笔后 **as-of 2026-09-22 09:1x 本刻实读**（换行符计数 · `.md` 豁免行数标注）——「预计后」列不适用（—）；`.md` 读数随他流写入漂移，本表不追值。）

**协议 / 机制零变声明**：不新增协议消息、不改载荷字段、不新增状态位（`busyQueued { pending }` 语义只在 host 侧扩判据源）；`WEBVIEW-PROTOCOL.md` 本批零**协议**变更（busy 面旧口径行收正——见修正块 3）；`locales/*.json` 零触。

**用例面**（改述行 = 存量用例随本批语义翻转；新增行 = 本批扩面锁；宿主与断言如下——用例表归测试层，设计档只留可机判指针）：

| 用例 | 类 | 输入 / 手法 | 期望 | 宿主 |
|---|---|---|---|---|
| **T-F16-4（改述）** | 边界 | ① 审批卡（`processing ∧ permission`）② **挂起会话内 busy（`processing ∧ suspended`）** ③ 斜杠 busy ④ 空 Enter | ①③ 吞 + 文本保留（模态静默 / 斜杠 busy 提示）∧ ④ 静默零入槽 ∧ **② 改述：入槽 + 清框 + 唤醒**（原「四形全吞」不再成立） | `test/busy-injection.test.mjs` |
| **T-F16-8（新增）** | 正常 | `processing ∧ suspended ∧ 槽空` + Enter；另起槽满形（`pendingInput` 已占一条）同判 | 入槽（`pendingInput=[text]` + 清框 + history + `wakes===1` + 零对话提示行）；槽满 ⇒ 吞——**可区分判据** = 清框不发生（输入框段文本逐字不变）+ 槽内既有项不被覆盖（`pendingInput` 长度 1 且 `[0]` 逐字不变）+ 零入槽；提示段 = 单槽非空恒显 dim 段（零新增提示串——`TUI-INPUT-BOX.md` §4.1 槽满钉串） | 同上 |
| **T-F16-9（新增）** | 正常 | driver rig：会话内回合执行期向 `pendingInput` 投一条（`runAgent` 桩内投），轮末回 driver | 步骤 1 消费该文本开新回合（首条 = 该文本）∧ 回执 `[sending queued message]` 在位（先于 digest 合并） | 同上（`suspensionSession` 直驱——T-F16-5 同 rig） |
| **T-F16-6（扩述）** | 机判 | `renderStatus` 纯函数三态字面量 | 三态逐字命中（§7.5 表）+ 全程零 `\x1b[43m` + 非 processing ⇒ `Enter: send` | 同上 |
| **T-F16-7（改述）** | 回归 | `input-lock.test.mjs`：digest 块（原 `:73-80` 吞断言）改述为入槽；既有 AC-2 / 槽满 / 斜杠吞 / 空静默零回归 | 全绿 | `test/input-lock.test.mjs` |
| T-F16-1…3 / 5 | 回归 | 普通 busy 入槽 / 回合尾送达+回执 / 槽满 / driver 消费 | 零改全绿 | `test/busy-injection.test.mjs` |
| **T-V16-4a（改述）** | 边界 | webview：`running ∧ _suspended` + `send()` | **排队**（本地气泡 + `queuedUserMessage` + 清框）∧ 零 toast ∧ 零 `userMessage`（原「拒发 + toast + 文本保留」改述） | `test/busy-injection-vsc.test.mjs` |
| **T-V16-7（新增）** | 边界 | host：`routeUserTurn` 于 `running ∧ _susp`（槽空 / 槽满两形） | 槽空 ⇒ 入 `susp.pendingInput` + 推 `busyQueued{pending:true}` + 零警告 + 零 `_chat` 直呼；槽满 ⇒ 拒收 + 警告 + 不覆盖 | 同上（vscode-mock 桩面板） |
| **T-V16-8（新增）** | 边界 | webview 二次提交跨载体（host 推 `pending:true` 而 `_busyQueued` 空、会话槽占用） | 不出泡 / 不清框 / toast `input.slotFull`（守卫判据源扩两载体生效） | 同上 |
| **T-V16-9（新增）** | 边界 | `chat-panel.sendMessage` 于 `running ∧ _susp` | 受理（回显 + 入会话单槽——拒收守卫撤销面；槽满 ⇒ 警告零入槽） | `test/chat-panel-messages.test.mjs`（①/⑧ 改述同档） |
| **T-V16-10（新增）** | 正常/边界 | 会话在飞入槽项携来源标记 + `visionReader` mock（成功 / null 两形） | 送达前过 F-1 判定（成功 ⇒ 描述注入 + images 清空；null ⇒ 原样兜底——不静默丢） | `test/busy-injection-vsc.test.mjs` |
| T-V16-1…3 / 5 / 5b / 6 | 回归 | 普通 busy 入槽 / 装载两分支 / 二次提交守卫 / 贴图降级 | 零改全绿 | 同上 |
| **T-B2-5（改述）** | 回归 | `webview-input-enter.test.mjs`：busy 面（原「拒发 + toast」） | 改述至排队语义（零 toast / 零清框异常） | `test/webview-input-enter.test.mjs` |

**验收对照（本批设计面——AC 逐条回指 §1 条目）**：

| AC | 判据（机检） | 回指 |
|---|---|---|
| AC-1 | 挂起内 busy Enter ⇒ `pendingInput` 单槽填充 ∧ 清框 ∧（挂起面）唤醒——CLI 与 VSC 两端口径一致 | E1 · 需求 F16 判定句（扩面后） |
| AC-2 | 吞面四零回归：模态 / 斜杠 / 空 / 槽满 四形逐条仍吞（CLI `key-handler` / VSC `send.js` + host） | E1 · 需求 F16 范围边界「斜杠 busy 仍禁发」 |
| AC-3 | 状态栏提示三态逐字（§7.5 表）+ 零注意力色对；`已排队 1 条消息` 逐字零改 | E2 · 需求 F16 反馈面 |
| AC-4 | 前批「digest 期拒发零改」复议结论落 §6（冻结档不回改）；本批两档改述到位 | E3 |
| AC-5 | 红线零触碰：Ctrl+I 面 / 攒批 / 斜杠 busy 禁发 / 空闲与挂起空闲 Enter / 不打断 / 协议与 locale | §1 修法边界 |
| AC-6 | **本批新增超宽行 = 0（存量 12 为基线）** ∧ **锚零新增（悬空基线 16）**——判据 = `node scripts/doc-check.mjs --root .` 两读数不因本批上升（写域设计档逐行 ≤300——表格行按机检 `isTableRow` 豁免口径） | N 类机检面 |

**关键决策（含否决）**：

| # | 决策 | 否决备选 / 理由 |
|---|---|---|
| D-BE1 | 挂起内 busy 与普通 busy **同判据 · 同单槽 · 同反馈**（CLI 一个 `state.pendingInput`；VSC 单槽载体两态） | 否决「挂起内另起槽 / 另设分流」——两槽破单槽不变量、且 driver 消费点（`suspension-drive.mjs:246`）与装载点各自为政 ⇒ 机制新造 |
| D-BE2 | 提示句改**排队语义**（普通 busy / 挂起内 busy 两句并列），槽满行零改 | 否决保留「Enter 提交禁用」句——E1 落地后为**假陈述**（失效表达不得留规范面，2026-09-18 用户裁）；否决「两面同句」——两面送达通道不同（回合尾 drain ∥ driver 输入优先），逐字分流可核（§7.5 表） |
| D-BE3 | VSC 会话在飞入槽 = **走既有 `_chat` susp 分支**（`susp.pendingInput`） | 否决「统一入 `_busyQueued` 再加会话内 drain」——会话循环不读该槽 ⇒ 须新加消费点（机制新造）；否决「会话内仍拒发」——E1 未落 |
| D-BE4 | 镜像判据源 = **两载体合计占用**（`pushBusyQueued` 一处表达式扩） | 否决「webview 自持真值」——违「host 权威收敛」不变式（细则① 既有）；协议名 / 载荷零变 ⇒ 零登记义务 |
| D-BE5 | 会话在飞入槽项**同款携来源标记**（`fromBusyQueue` + `visionReader`） | 否决「随纯挂起项形态不降级」——细则⑥ 既有原则（入槽项不得旁路 F-1 判定）；本批两面同款（判决函数 / 调用点均既有） |
| D-BE6 | `WEBVIEW-INPUT.md` **C-B2-4 契约行删除**（busy 拒发面消失） | 否决「留空壳行加限定」——契约点已无面；记录面（变更记录 + 本 §2）承载历史 ⇒ 规范面零尸体 |

**三档读回核验（D6——本刻实读）**：① `TUI-INPUT-BOX.md` §4.1 判据表 5 行 + 吞面四逐字 + 执行序含挂起面唤醒 + 送达链路三支 + 模型句收正句（回读 :94-154）；② `TUI.md` §7.5 三态表逐字在位（回读 :589-619）；③ `WEBVIEW-INPUT.md` §1 C-B2-4 行已删 / C-B2-6 行与细则①–⑥ 收正 / §7 U-I2 / §9 用例面（回读 :13-40 · :152 · :170）。
机检反证：`node scripts/doc-check.mjs --root .` ⇒ 悬空 17 → **16**（本席新引一处 `WEBVIEW-INPUT.md:28 suspension.mjs:285-300` 已按全路径改回，回到基线）、行宽 **12 行超限（全存量，本批新增 0）**；`grep C-B2-4` ⇒ 活体面零残留（仅批档记录面在档）。

**上抛项（逐条——父侧 / 评审裁定面）**：

| # | 事项 | 处置建议 |
|---|---|---|
| U1 | **§1 E2 括注「挂起内 busy ⇒ 现状句」字面读法与 E1 相抵**：E1 令挂起内 busy 受理排队 ⇒ 现句「Enter 提交禁用（字符可输入，回合结束请重按 Enter）」成假陈述。本设计按「**句形保留**（`…处理中 — …（…）` 与 `—` 分隔符）+ **假陈述收正**（改排队语义）」落实（§7.5 表第 3 行逐字） | 若父侧本意另有他指（如要求逐字保留旧句）⇒ 请裁；改动面 = §7.5 表第 3 行一行 + §4.1 回指句，实施轮前可零成本改 |
| U2 | VSC 占位符 `input.busyPlaceholder` 值（「主会话处理中——Enter 提交受限——可继续输入」/ en）在受理面回开后语义是否有偏（「受限」≠「排队」） | **本批零改**（locale 值 + `WEBVIEW-PROTOCOL.md` §6.3 逐字表 = 本席写域外）；建议随批裁（若改 ⇒ 须动两档 locale + 协议 §6.3，另笔） |
| U3 | 需求面 F16 扩面 = **父侧笔**（建议稿见下） | 逐字候选可直接落；落定后 F16 判定句与本 §2 AC-1/AC-3 同源 |
| U4 | 测试改述面容易漏（只改源不改测 ⇒ 红）：`webview-input-enter.test.mjs` T-B2-5 · `chat-panel-messages.test.mjs` ①（`:63`）/⑧（`:279`）· `input-lock.test.mjs` T-F16-7 第二块 | 实施轮同笔（列本表 + 用例面已点名） |
| U5 | **E3 承接**：前批 `docs/batches/2026-09-21-busy-injection.md` §6 判定「T-V16-4 digest 期拒发零改」与同 §6 相关口径被本批推翻 | 冻结档**不回改**；复议结论落本批 §6（父侧）——本 §2 只列承接关系 |
| U6 | 行数触顶双档：`key-handler.mjs` 496 · `index.mjs` 499（≤500 硬限） | 实施轮净增约束：前者 ≤2 行、后者净零行（本表已钉） |
| U7 | `chat-panel-messages.test.mjs` 521 行 >500 存量债（台账 #169——非本批引入） | 本批只改述（仍 >500）；拆档仍归 #169，不在本批扩面 |

**需求面 F16 扩面建议稿（父侧笔——逐字候选，可直接落 `docs/cli/requirements/TUI.md` F16 行）**：

① 条目句（现文「回合运行中（busy = processing 含 digest）用户 Enter 提交**不再被吞**——文本入 `pendingInput` 单槽 + 可见 queued 反馈行（形态设计档钉死）；回合自然结束后消息经既有回合尾 drain（`agent-turn.mjs` 队列续发）自动送达新回合。」）建议改为：

> 回合运行中（busy = processing 含 digest——**普通回合与会话内回合同判据**）用户 Enter 提交**不再被吞**——文本入 `pendingInput` 单槽（普通 / 挂起两面**同一槽**）+ 可见 queued 反馈（形态设计档钉死）；送达经既有通道自动完成（普通回合 = 回合尾兜底转正 + 队列续发；挂起会话内 = driver 输入优先消费）。

② 判定句（现文「判定句：脚本驱动 busy 回合 + 提交文本 → `pendingInput` 单槽填充 ∧ queued 反馈可见；回合结束后新回合首条 user 消息 = 该文本；**单槽语义**（至多一条待交接——既有口径不变；busy 期二次提交行为 = 设计裁定项）。」）建议补一句：

> **挂起会话内 busy**（池 live 会话期 `state.suspended` 恒 true）提交 ⇒ 同判据入槽（不再吞）；**吞面收敛四**（模态 / 斜杠 / 空 / 槽满——逐条见设计档 `docs/cli/design/TUI-INPUT-BOX.md` §4.1）；状态栏提示三态逐字（普通 busy / 挂起内 busy / 槽满——设计档 `docs/cli/design/TUI.md` §7.5）。

③ 范围边界句（现文「…挂起面零改：挂起会话内 busy（digest 期 `running && _suspended`）仍拒发 + toast、纯挂起等待既有单槽零改…」）建议改为：

> VSC 对位 = **busy 即排队面**（`S._turnState === "running"`——挂起会话内与普通回合同判据；无会话入 `panel._busyQueued` 单槽、会话在飞入会话单槽 `susp.pendingInput`）；受理面拒面收敛四（空 / 槽满 / 组合期与中断模态 / 无工作区守卫另面）；**纯挂起等待既有单槽零改**；契约 = `docs/vsc/design/WEBVIEW-INPUT.md` §1 C-B2-6。

④ 设计回指句（现文「设计 = `docs/cli/design/TUI-INPUT-BOX.md` §4.1（busy 输入路径）+ `docs/cli/design/TUI.md` §7.5（反馈面）」）建议补：提示三态表落点 = 同处 §7.5；VSC 契约 = `WEBVIEW-INPUT.md` §1 C-B2-6（细则 ①–⑥）。

**边界确认（本席）**：源码 / 测试零触碰（写域 = 设计档 **8 档**——`TUI-INPUT-BOX.md` / `TUI.md` / `WEBVIEW-INPUT.md` / `TUI-SESSION-VIEW.md` / `AGENT-LOOP-SUBAGENT.md` / `AGENT-LOOP.md` / `SESSION.md` / `WEBVIEW-PROTOCOL.md` + 本档 §2）；`_archive/**` / 冻结批档 / 既有变更记录行零动；不新增协议消息 / 状态位 / 机制（`WEBVIEW-PROTOCOL.md` 零协议变更——旧口径行收正）；行宽 ≤300（本批新增 0 超限）；Ctrl+I 面（`.mjs` 代码 + §2 表行 + §8）零触。

**修正块（设计评审轮 1 · 按号收正 · 2026-09-22 · eng-designer）** —— 承 §3 轮次 1 发现表（🔴2 · 🟡5 · 🔵5 = 12 条；父侧裁定：#1/#2/#3/#4/#8/#9/#10/#11/#12 归本席逐条接受并落位；#5 = 记录接受（零动作——台账 #169 在案）、#6 = 采设计读法（§1 U1 已钉）、#7 = Not an issue（零动作））。

**逐号落位**（号 → 改动 `file:line`；行号 = 本刻实读）：

| # | 改后形态（`file:line`） |
|---|---|
| 1 | `docs/cli/design/TUI.md:126-127` busy 门禁条括注收正——「非挂起非模态期」→「**非模态期**——放行判据 = `TUI-INPUT-BOX.md` §4.1（**挂起两态不再排除**）；二次提交语义同处」（变更记录 `:670` 一行随落） |
| 2 | `docs/vsc/design/WEBVIEW-INPUT.md:158` U-I8 按 C-B2-6 三面收正（判据面 `S._turnState === "running"` 全面 / 载体两态 `_busyQueued` ∥ `susp.pendingInput` / 送达三支）；`:191` 本批变更记录句随改（「U-I1/I3–I8 零变」→「U-I1/I3–I7 零变」+ U-I2 · U-I8 收正在册） |
| 3 | `WEBVIEW-INPUT.md:43` 零改面录入面括注改述——「录入不禁；提交面受理分流 = C-B2-6」 |
| 4 | 本块下方「受影响文件 >300 档审视结论」（8 档逐行）＋ 增量上限记法（`现况 → ≤上限` 形——替代单 `~N` 目标值） |
| 8 | `TUI-INPUT-BOX.md:120` 槽满句钉提示形态 = `TUI.md` §7.5 表第 1 行逐字（`已排队 1 条消息`）；先例坐标收正 `:417-422` → `key-handler.mjs:440-444`（本刻实读——原记系漂移，一致性面即修并披露） |
| 9 | `TUI-INPUT-BOX.md:123-125` 唤醒句补证据行（`suspension-drive.mjs:122` 等待结束清理置 null · `:137` 仅 `waitForSettleOrWake` 等待窗口注入 · 唯一调用点 `:279` ⇒ busy 期恒 null、零动作）；期望注改**描述式**引用（批档 §2 用例面「挂起内入槽」格 `wakes` 计数 = 呼叫点断言 · 桩注入 spy） |
| 10 | AC-6 判据句改述 = **本批新增超宽行 = 0（存量 12 为基线）**；锚面 = 悬空零新增（基线 16） |
| 11 | `WEBVIEW-INPUT.md:19` C-B2-6 零改面补「空输入 = 既有静默（`send()` 出口——`thincoder-vscode/webview/send.js:18`）」 |
| 12 | `WEBVIEW-INPUT.md:164` §9 行 1 枚举收正（去「busy 拒发可见提示」→「唯一 busy 拒面 = 单槽满（C-B2-6 细则①）」）；`TUI-INPUT-BOX.md:204` 用例宿主范围收正（T-F16-1…6 → **T-F16-1…9**） |

**受影响文件 >300 档审视结论**（承 §3 发现 #4 · 形制先例 = `TUI.md` §6.8.3.4）——增量上限记法 = `现况 → ≤上限`（括号内 `Δ ≤+N` = 至多净增 N 行；`Δ ≤0` = 禁净增）；行数 = 换行符计数 · as-of 2026-09-22 本刻实读（8 档）：

| 档 | 现况 → 上限 | 改动面 | 是否需拆 | 存量债 |
|---|---|---|---|---|
| `thincoder-cli/src/tui/key-handler.mjs` | 496 → ≤498（Δ ≤+2） | busy 门禁吞条件删两操作数（同行长改）+ 挂起面唤醒一行 + 注释随判据收正 | **无需拆分**（既有臂内小改——未新增函数 / 职责） | 距 500 硬限余量 ≤4 行（U6 钉净增 ≤2） |
| `thincoder-cli/src/tui/index.mjs` | 499 → ≤499（Δ ≤0） | submit 双保险注释面收正（净零行——可零触） | **无需拆分** | 距 500 硬限余量 1 行（U6 钉净零） |
| `thincoder-vscode/src/extension/chat-panel.mjs` | 493 → ≤493（Δ ≤0——预计 −1） | 拒收守卫撤销（`:265-268`）+ `_chat` susp 分支携来源标记参 | **无需拆分** | 距 500 硬限余量 7 行（净减档） |
| `thincoder-cli/src/tui/render-frame.mjs` | 415 → ≤418（Δ ≤+3） | 既有 `enterHint` 二态扩三态（字面量分支） | **无需拆分** | >300 为存量（距 500 余量 ≥82 行） |
| `thincoder-cli/test/input-lock.test.mjs` | 388 → ≤395（Δ ≤+7） | T-F16-7 改述 + 新增挂起内排队格（用例追加） | **无需拆分**（测试档） | >300 为存量 |
| `thincoder-vscode/test/busy-injection-vsc.test.mjs` | 350 → ≤400（Δ ≤+50） | T-V16-4a 改述 + T-V16-7/8/10 三组新增（用例追加） | **无需拆分**（测试档） | >300 为存量（+50 后距 500 余量 ≥100） |
| `thincoder-vscode/test/chat-panel-messages.test.mjs` | 521 → ≤526（Δ ≤+5） | ①（`:63`）/⑧（`:279`）挂起会内 busy 拒收断言改述（同档② 行） | **本批只改述不扩面**（拆档归台账 #169） | **存量 >500 硬限债**（台账 #169 在案——非本批引入；本批后仍 >500） |
| `thincoder-cli/src/tui/suspension-drive.mjs` | 334 → ≤334（Δ ≤0） | `:242-245` 模型句注释改述（机制零改） | **无需拆分** | >300 为存量（注释面） |
| `thincoder-vscode/src/extension/panel-messages.mjs` | 324 → ≤330（Δ ≤+6） | `routeUserTurn` busy 分支内改 + `pushBusyQueued` 判据表达式扩 | **无需拆分** | >300 为存量 |

**函数维读数（承 §3 轮次 2 发现 #9 · 本刻实读 · 判据 = `docs/core/requirements/METHODOLOGY.md` F3-1「函数 ≥300 必拆骨干」）**：
① `thincoder-cli/src/tui/key-handler.mjs` 最长函数 = `createKeyHandler`（`:38`–`:496` ≈ **459 行**）——**函数档 >300 存量债**（非本批引入）；本批改动 = 该函数内既有 busy 门禁臂（同行长改 + ≤1 行唤醒调用）⇒ 零新增函数 / 零新增分支层级，**本批不拆**；
② `thincoder-cli/src/tui/index.mjs` 最长函数 = `startTUI`（`:77`–`:493` ≈ **417 行**）——同存量债（台账 **#159** 在案：`startTUI` ≈411 行；本刻实读坐标 `:77`–`:493` = 台账记 `:74`–`:484` 之漂移）；本批 = submit 双保险注释面（净零行）⇒ 函数行数不变，**本批不拆**。
拆分触发条件：`key-handler.mjs` 距 500 硬限余量 ≤4 行——该档下次**实质改动**（结构面）时随批拆骨干；`index.mjs` 同式（触发 = 下次实质触碰 `startTUI` 的批）。`key-handler.mjs` 函数档债登记归父侧（本席不写台账）。

**上抛项 U1 状态收正**：§2 状态行原「上抛 7 项（U1 提示句口径请裁）」随父侧 §1 裁定（2026-09-22 08:46）结清——U1 采设计读法（§7.5 第 3 行排队句为本）、U2 = #7 Not an issue、U5（E3 承接）、U6 / U7 照旧在案；状态行已同步（见本段末）。

**读数与边界（本修正轮）**：写域 = 三档设计文档（TUI.md / WEBVIEW-INPUT.md / TUI-INPUT-BOX.md）+ 本 §2；源码 / 测试 / 需求档 / locales / `_archive/**` / 冻结批档 / 批档 §1 · §4–§6 零触碰；不新增机制 / 协议 / 状态位；不改已落语义（只收正残留 + 补注）。
机检：`node scripts/doc-check.mjs --root .` 终态 = **悬空 16（基线）+ 行宽 12（基线，全存量——本批新增 0）**；三档改写行逐行 ≤300（表格行按机检 `isTableRow` 豁免口径）。
**首落笔披露**：首版曾引入 2 条用例号悬空（`TUI-INPUT-BOX.md` 内两处点名 planned 用例 `T-F16-8`——`docs/batches/` 不在锚扫描域（`checkConfig.anchors.exclude`）⇒ 未实施用例号无在册面）与 1 行 330 字符；本轮内已收正为**描述式引用**（「批档 §2 用例面『挂起内入槽』格」）与断行——终态回基线。

**修正块（同族扩面轮 · 2026-09-22 · eng-designer）** —— 承 §1 收尾裁定（2026-09-22 08:56 · 父侧：修正轮实读报出同族残留 9 处 ⇒ 并入本批收正）。域 = 旧口径 blanket 句（busy 提交吞 / busy 拒收）之设计档收正；机制单源 = `TUI-INPUT-BOX.md` §4.1 ∥ `TUI.md` §7.5 ∥ `WEBVIEW-INPUT.md` §1 C-B2-6。

**逐号落位**（号 → 改动 `file:line`；行号 = 本刻读回）：

| # | 改后形态（`file:line`） |
|---|---|
| 1 | `docs/cli/design/TUI-SESSION-VIEW.md:81` 第 6 条「busy 提交吞 + 攒批删」→ **busy 提交入单槽（受理判据 = `TUI-INPUT-BOX.md` §4.1——吞面收敛四）+ 攒批删** |
| 2 | `TUI-SESSION-VIEW.md:84` 第 7 条「进入挂起态——busy 提交吞；挂起空闲输入开放」→ **挂起内 busy 与普通 busy 同判据入槽**（键面契约回指同处 §4） |
| 3 | `docs/core/design/AGENT-LOOP-SUBAGENT.md:125-127`「主会话 busy 提交禁发（Enter 与斜杠同吞）」→ **busy 提交 = 入单槽**（判据句 + 吞面收敛四 + 三档回指）；`state.queue` 残项单容器保留 |
| 4 | `AGENT-LOOP-SUBAGENT.md:137` 状态机行「digest 在跑 ⇒ 提交吞 + busy 提示」→ **入 `pendingInput` 单槽（槽满 ⇒ 吞 + 提示）**；出口改「该输入由 driver 步骤 1 优先消费开用户回合」 |
| 5 | `docs/core/design/AGENT-LOOP.md:91` §2.3 唤醒 / 入槽行 VSC 列「`routeUserTurn` 拒收 busy」→ **busy ⇒ 单槽受理**（会话在飞 = `_chat` 单槽 ∥ 无会话 = `_busyQueued`） |
| 6 | `AGENT-LOOP.md:125` §6.8 端特有面 VSC 行「busy 拒收 + loading 锁」→ **busy 单槽受理**（吞面收敛四——C-B2-6 指针） |
| 7 | `AGENT-LOOP.md:416` §6.18 挂起回合 digest 行「busy 拒收（可录入禁发、Enter 拒发不排队）」→ **busy 单槽受理**（C-B2-6 指针） |
| 8 | `AGENT-LOOP.md:442` §7 **D-AL9** 就地修订（同表 D-AL11 先例形）——决策列 = busy 提交入单槽（吞面收敛四）+ 括注「2026-09-22 busy-extend 批修订——原「提交禁发 + 排队机制整批废弃」撤销」；理由列 = 入槽 + 反馈三态 / 单槽不变量 / `state.queue` 残项单容器 |
| 9 | `docs/core/design/SESSION.md:336` + `:339` + `:556`（D-SE30）——标题窗口（`_turnState` 仍 running）= **busy 单槽受理面**（路由守卫 running ⇒ 入槽；新回合恒在标题调用之后开）；裁定与理由见下 |

**#9 裁定（择 a · 实读后钉死）**：**落 a——`SESSION.md` 收正（标题窗口 = `running` 排队面）**；`WEBVIEW-INPUT.md` C-B2-6 与需求句**零改**。理由四条（均本刻实读）：

1. **判据面单源不再分叉**：C-B2-6 受理判据 = `S._turnState === "running"`（单一判据——`WEBVIEW-INPUT.md:19`）；标题窗口在 `running` 内（`panel-turn-stages.mjs:128` 标题 await 先于 `_turnState` 归位）。**落 b 须新增标题窗口标志位**（host 新状态 + webview 镜像字段 + 协议面）⇒ 破「不新增状态位」与本批「机制零新造」；落 a **零新增代码面**。
2. **落 b 反损语义（拒收 = 丢文本）**：拒收面 = 无排队无回执、文本保留待重发；而标题窗口上界仅 10s（标题 LLM 超时）——「窗口短」不能抵重按 Enter 的代价。落 a 下该输入入单槽并由**既有送达三支**送出：普通回合 ⇒ `_busyQueued` → idle 归位续发 ∥ 会话在飞 ⇒ `susp.pendingInput` → driver 步骤 1 消费 ⇒ **零丢失 · 零新机制**。
3. **防赛跑目的由排队同样达成（且更优）**：原拒收之用意 = 防「窗口内新消息直开并发回合与标题 LLM 调用赛跑」；排队式下新回合**恒在 `finalizeTurn` 内标题 await 返回之后**由 `enterSuspensionTurn` 装载分支开出（归位 `:145-151` 先于装载 `:216-218`）⇒ 赛跑无面且不丢文本。
4. **两端同向**：CLI 侧标题窗口在 `state.processing = false`（`agent-turn.mjs:257`）之后、`ensureSessionTitle`（`:308`）之前——命中释放窗口（`_suspPending`）/非 busy 分流 ⇒ `TUI-INPUT-BOX.md` §4 既有面**受理不吞**；VSC 收正后两端同为「受理」而无一端拒收（与「端差默认消」口径同向）。

**#9 读回**：`SESSION.md:336`（路由守卫 running ⇒ 单槽受理 + C-B2-6 指针）· `:339`（标题期消息受理——唯一拒面 = 单槽满 + 警告；送达 = 既有三支）· `:556`（D-SE30 理由列「路由守卫入单槽」）。
**需求面**：`docs/cli/requirements/TUI.md` F16 **无标题窗口条款**（`running` 判据已覆盖）⇒ 落 a 无需需求笔；**未落需求档**（遵令）。

**机检与边界（本修正块）**：`node scripts/doc-check.mjs --root .` 终态 = **悬空 16（基线）· 行宽 12（基线）**——本批新增 0。
（首落笔披露：两条新变更记录首版超宽（331 / 301 字符）——本刻当场折行收正后回基线。）
四档变更记录各 +1 行：`TUI-SESSION-VIEW.md:206` · `AGENT-LOOP-SUBAGENT.md:2103` · `AGENT-LOOP.md:497` · `SESSION.md:655`。
写域 = 上述四档设计文档 + 本 §2；源码 / 测试 / 需求档 / locales / `_archive/**` / 冻结批档 / 已定稿面（`TUI-INPUT-BOX.md` §4.1 · `TUI.md` §7.5 + `:125-127` · `WEBVIEW-INPUT.md` C-B2-6）零触碰；不扩扫新族（以 9 处为界）。

**同轮观察（不动作 · 上报）**：

- ① **记录面命中三处**（日期化历史，按纪律保留零动作）：`docs/batches/2026-09-21-busy-injection.md`（前批档）· `WEBVIEW-PROTOCOL.md:489`（变更记录——busy-injection 批次条目）· `docs/cli/requirements/TUI.md:93`（变更记录——2026-09-21 条）。
- ② **`TUI-INPUT-BOX.md:118`**（§4.1 执行序括注「替换「提交吞 + busy 提示」分支」）与 **`WEBVIEW-INPUT.md:31`**（C-B2-6 细则 ③「随本批撤销」）为修订式措辞——均属本批**已定稿面**（本轮禁触）；是否随实施轮 / 另轮收正请父侧裁。
- ③ **悬空节号嫌疑两处**：`TUI-SESSION-VIEW.md:83`（「状态机行表以 `AGENT-LOOP.md` §9 为权威」）与 `TUI-INPUT-BOX.md:71`（节题括注「AGENT-LOOP §9」）——`docs/core/design/AGENT-LOOP.md` 节号止于 §8，挂起状态机表现住 `AGENT-LOOP-SUBAGENT.md` §6.8（机检未报：`§N` 面不在其判据内）。非本轮 9 处，请父侧定夺。
- ④ **源码注释面（产品代码面 · 非本席写域）**：`panel-turn-stages.mjs:113` / `:123` / `:161` 与 `panel-messages.mjs:117-122` 现读「routeUserTurn 拒收——禁排队 / 挂起会话内 busy 拒收」——本批实现轮落地后成旧口径，建议列入实施轮施工面（该两档本批文件表在册）。
- ⑤ **CLI 标题窗口池空形（新察 · 非本轮面）**：CLI 侧池空回合的标题窗口 = 非 busy 面（`processing=false` 已清且 `_suspPending` 假）⇒ 窗内 Enter 直开新回合、与标题 LLM 调用并发（既有行为）；VSC 侧经本裁定为入槽 ⇒ 两端在「窗内并发」面上不一致——是否收正请父侧裁（改动面 = 标题调用时点 / 窗口守卫，属新面）。

**修正块（设计评审轮 2 · 按号收正 · 2026-09-22 · eng-designer）** —— 承 §3 轮次 2 发现表（🔴0 · 🟡4 · 🔵5 = 9 条）+ 域外注 1 条 + 父侧裁定：**#1 = 父侧就地落（本席零触·勿动 §1）；#2–#9 归本席逐号收正；域外注（`WEBVIEW-PROTOCOL.md` 旧口径）= 并入本批同族收正**。

**逐号落位**（号 → 改动 `file:line`；行号 = 本刻读回）：

| # | 改后形态（`file:line`） |
|---|---|
| 2 | **§2 本体行就地收正**（承父侧 §1 ⑤授权 · 不留旧形）——AC-6 判据句 `docs/batches/2026-09-22-busy-extend.md:115` = 「**本批新增超宽行 = 0（存量 12 为基线）** ∧ **锚零新增（悬空基线 16）**」（原「三档行宽 ≤300」与同行读数相抵的写法退场——轮 1 发现 #10 之本体补落）；**状态行**（本节首 · `batch` 工具 `status` 落）= 三轮处置计数按实际落位 |
| 3 | 悬空节号五处改指 **`AGENT-LOOP-SUBAGENT.md` §6.8**（`AGENT-LOOP.md` 节号止于 §8——本刻复核其 `## 1`–`## 8`）：`docs/cli/design/TUI-INPUT-BOX.md:303` · `docs/cli/design/TUI-SESSION-VIEW.md:20` · `:199` · `docs/cli/design/TUI.md:129` · `:525`（三档各 +1 变更记录行：`TUI-INPUT-BOX.md:347-349` · `TUI-SESSION-VIEW.md:208-209` · `TUI.md:674-675`） |
| 4 | 受影响文件表补一行 `:70`——`thincoder-vscode/src/extension/panel-turn-stages.mjs`：现况 **233**（本刻实读）/ 增量净零 / <300 非存量债 · 无需拆分；注释面 `:113` / `:123` / `:161` 归实施轮施工面 |
| 5 | >300 档审视表补一行 `:187`——`thincoder-vscode/test/chat-panel-messages.test.mjs`（521 → ≤526 · 本批只改述不扩面 · 拆档归台账 #169）⇒ 存量 >500 硬限债在表内可见 |
| 6 | 用例面 T-F16-8 槽满形期望补**可区分判据** `:93`（清框不发生（段文本逐字不变）+ 槽内既有项不被覆盖（长度 1 且 `[0]` 逐字不变）+ 零入槽；提示段 = 单槽非空恒显 dim 段——零新增提示串） |
| 7 | `docs/cli/design/TUI-INPUT-BOX.md:78` 容器名收正（「`state.pendingInput` 队列」→ **单槽（至多一条——见 §4.1）**） |
| 8 | 受影响文件表设计档行改为**逐档八行** `:75-82`（本批写域 8 档 · 行数 = 本刻实读 **349 / 726 / 195 / 227 / 2238 / 573 / 655 / 586**——as-of 读数 · 不追值；表下补读数口径注）＋ §2「边界确认」本体句收正 `:159`（「写域 = 三档设计文档」→「**设计档 8 档**」+ 逐档点名） |
| 9 | >300 表后补**函数维读数段** `:191-194`——`key-handler.mjs` 最长函数 `createKeyHandler`（`:38`–`:496` ≈ **459 行**）· `index.mjs` 最长函数 `startTUI`（`:77`–`:493` ≈ **417 行**）：均**函数档 >300 存量债**（判据 = `docs/core/requirements/METHODOLOGY.md` F3-1「函数 ≥300 必拆骨干」）；本批改动 = 既有 busy 门禁臂内（同行长改 + ≤1 行唤醒调用）∥ 注释面（净零行）⇒ 零新增函数 **· 两档本批不拆** + 触发条件在册（前者距 500 硬限余 ≤4 行） |
| 10 | **域外并入**（父侧裁定 · 同族收正）`docs/vsc/design/WEBVIEW-PROTOCOL.md` 六处 + 变更记录 +1 行：`:142`（按面分流 → **一律排队受理**：单槽载体两态 + 送达三支）· `:146`（回显条 = busy 面回显即排队气泡面——「拒收先于回显」面退场）· `:98` §3.2 行 16（busy 即排队面 + 载体两态）· `:99` §3.2 行 17（`pending` 判据 = 两载体合计）· `:367` §12 `busyQueued` 行 · `:457` §12 `queuedUserMessage` 行 · 变更记录 `:489-492`；**协议零变**（消息名 / 载荷字段 / §3.2 十七项 / §7 D-P11 / §6.3 20 键 / §12 · §13 表体零改）；§6.3 键登记面**实扫零相抵**（`input.slotFull` 判据回指 C-B2-6 ① 在位；`input.busyPlaceholder` 无登记义务——前批裁定在册）⇒ §2「协议零变声明」本体句收正 `:86`（「本批零触」→「零协议变更 + busy 面旧口径行收正」） |

**§2 本体行就地收正清单**（承父侧 §1 ⑤授权 · 本节在册 normative 行 · 逐处不留旧形）：AC-6 判据句 `:115` · 状态行（本节首）· 协议零变声明句 `:86` · 边界确认句 `:159`。历史归记录面（本块 + 各档变更记录行）。

**机检与边界（本修正块）**：`node scripts/doc-check.mjs --root .` 终态 = **悬空 16（基线）· 行宽 12（基线）**——本批新增 **0**（首落笔曾引入 `WEBVIEW-PROTOCOL.md:142` 一条 344 字符超宽行——本刻当场折行收正、复跑回基线；披露在案）。
写域 = 设计档 8 档 + 本档 §2；源码 / 测试 / 需求档 / locales / `_archive/**` / 冻结批档 / 批档 §1 · §3–§6 零触碰；不改已定稿机制面（C-B2-6 / §4.1 判据表 / §7.5 三态表 / 需求 F16 = **语义零改**——本轮只做表 / 句 / 指针级收正）；不扩扫新族（以 10 项为界）。

**同轮观察（不动作 · 上报）**：

- ① **同族悬空节号第 6 处** `docs/cli/design/TUI-COMMANDS.md:44`（「挂起 digest 无人值守语义，见 `docs/core/design/AGENT-LOOP.md` §9」）——同族同类（该档无 §9）；**未动**（不在本轮五处清单内，且该句所指内容是否 = §6.8 未实读确认）⇒ 请父侧定夺。
- ② **函数档债坐标漂移**：台账 **#159** 记 `startTUI` `:74`–`:484` ≈411 行；本刻实读 **`:77`–`:493` ≈417 行**（+3 / +9 位移）——台账行本体归父侧。
- ③ **#169 行数口径差 1**：台账记 `chat-panel-messages.test.mjs` = **522**；本刻实读（换行符计数）= **521**（两者皆 >500 ⇒ 结论不变）。
- ④ **§2 内两处「三档」表述 = 记录面历史**（修正块 1「读数与边界（本修正轮）」+ 扩面轮「写域 = 上述四档设计文档」）——各为其轮的准确陈述，按记录面保留零动作（本体句已收正，见 #8）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**结论：changes-required**（🔴 2 · 🟡 5 · 🔵 5，共 12；评审域 = 批档 §2 + 三档设计档 + 需求 F16 回指面）

| # | 类别 | 级别 | 问题 | 建议 |
|---|---|---|---|---|
| 1 | Document ownership | 🔴 | `docs/cli/design/TUI.md:126` busy 门禁条仍写「**Enter 提交 = busy 单槽注入**（**非挂起**非模态期——放行判据…= §4.1）」——与同批改写的 `docs/cli/design/TUI-INPUT-BOX.md` §4.1（`:115-116`：挂起两态不再是吞面；挂起会话内 busy 与普通 busy 同判据入槽）同一机制两处不同述 | 该括注收正为「非模态期（放行判据 = §4.1——挂起两态不再排除）」或删除限定语 |
| 2 | Document ownership | 🔴 | `docs/vsc/design/WEBVIEW-INPUT.md:158` U-I8 行仍写「挂起会话内 busy / 纯挂起等待面**零改**」+ 单槽 `_busyQueued` + 送达「回合尾装载**两分支**」，与同档 `:19` / `:28-31` C-B2-6（`running` 全面 + 载体两态 + 三支送达）相抵；且 `WEBVIEW-INPUT.md:191` 变更记录自称「U-I1/I3–I8 零变」⇒ 该残留被显式声明为不变更 | U-I8 按 C-B2-6 口径收正（判据面 / 载体两态 / 三支送达），或标记为历史条目并指向 C-B2-6 |
| 3 | Document ownership | 🟡 | `docs/vsc/design/WEBVIEW-INPUT.md:43` 零改面行括注「录入面（busy 期**只禁提交**不禁录入——受理分流见 C-B2-6）」——本批后 busy 期提交 = 排队受理（吞面仅四），「只禁提交」为旧口径 | 括注改述为「录入不禁；提交面受理分流 = C-B2-6」 |
| 4 | Affected-file size annotations | 🟡 | 批档受影响文件表（`:52-66`）行数 / 动作 / 预计后齐备，但 8 档 >300 行档**无拆分审视结论**（`key-handler.mjs` 496→~498 · `index.mjs` 499→499 · `chat-panel.mjs` 493→~492 · `render-frame.mjs` 415→~418 · `input-lock.test.mjs` 388→~395 · `busy-injection-vsc.test.mjs` 350→~400 · `suspension-drive.mjs` 334 · `panel-messages.mjs` 324→~330；先例 = `TUI.md` §6.8.3.4「>300 advisory 档审视结论」）；且增量多以「~N」目标值记，未给上限记法（仅两档触顶注 U6 有） | 补逐档一行审视结论（改动面 / 是否需拆 / 存量债）+ 增量上限记法 |
| 5 | Affected-file size annotations | 🔵 | `chat-panel-messages.test.mjs` 521（>500 硬限）本批仍被改述并 +~5（自报），仅台账 #169 指针（U7） | 维持「只改述不扩面」并同步 #169 记录（存量债不复审） |
| 6 | Scope（coordination） | 🟡 | U1（`:117`）未裁：§1 E2 括注「挂起内 busy ⇒ 现状句」与 `TUI.md:608` §7.5 第 3 行（排队句收正）两读法并存；需求 F16（`requirements/TUI.md:37`，已落）与设计同侧但未明裁 | 钉口径：采设计读法则把 §1 E2 括注同步收正；若须逐字保留旧句 ⇒ 改 §7.5 第 3 行 + §4.1 回指句 + 需求判定句 |
| 7 | Scope（coordination） | 🟡 | U2（`:118`）VSC `input.busyPlaceholder`（「Enter 提交受限」）本批零改——受理面回开后成用户可见假陈述 | 两档 locale 值（+ `WEBVIEW-PROTOCOL.md` §6.3 逐字表）随批收正，或显式登记另笔并钉到期 |
| 8 | Clarity | 🔵 | `TUI-INPUT-BOX.md:120` 「**槽满提示**」只以「先例 = `key-handler.mjs:417-422` 逐字同构」引，与 `TUI.md:599` / §7.5 表第 1 行（`已排队 1 条消息`）是否同串未明说（用例 T-F16-8 依赖该形） | 槽满句补「提示形态 = §7.5 表第 1 行（逐字）」或钉串 |
| 9 | Feasibility | 🔵 | `TUI-INPUT-BOX.md:123-124` 唤醒句前提「busy 期该槽（`_suspWake`）为 null ⇒ 零动作」无证据行；T-F16-8 断言 `wakes===1`——前提不成立即为运行期副作用（且占 496 档 +2 预算内一行） | 补 `file:line` 证据或改条件调用 + 同步用例期望 |
| 10 | Acceptance criteria | 🔵 | 批档 AC-6（`:97`）判据句「三档行宽 ≤300」与同行读数（行宽 12 超限 · 全存量）自相抵 | 改述为「本批新增超宽行 = 0（存量 12 为基线）」 |
| 11 | Requirements | 🔵 | 需求 F16 范围边界句列 VSC「拒面收敛四（**空** / 槽满 / 组合期与中断模态 / 无工作区守卫另面）」，其中「空」在 `WEBVIEW-INPUT.md` 设计面无对位陈述（其余三面 = 细则① / C-B2-1 / 零改面行 + C-B2-5） | C-B2-6 零改面补「空输入 = 既有静默」一句，或需求句改回指既有面 |
| 12 | Clarity | 🔵 | 回指枚举漂移两处：`WEBVIEW-INPUT.md:164` §9 行 1 仍列「busy 拒发可见提示」（C-B2-4 已删，唯一 busy 拒面 = 单槽满）；`TUI-INPUT-BOX.md:203` 用例范围仍写「T-F16-1…6」（本批新增 T-F16-8/9、T-F16-6 扩述） | 两处枚举随本批收正（§9 → C-B2-6 细则①；用例范围 → T-F16-1…9 或指向批档 §2） |

**计数**：🔴 2 · 🟡 5 · 🔵 5（共 12）
**已核读回（与 §2 声明一致）**：§4.1 判据表 5 行（`TUI-INPUT-BOX.md:109-113`）+ 吞面收敛四（`:115`）+ 执行序唤醒（`:123-124`）+ 送达三支（`:138-141`）；§7.5 三态表（`TUI.md:604-609`）；C-B2-4 已删 / C-B2-6 + 细则①–⑥（`WEBVIEW-INPUT.md:19-40`）· U-I2（`:152`）；需求 F16 四笔扩面（`requirements/TUI.md:37`）；设计档行数实核 341 / 720 / 192（= 表报「预计后」）。
**评审限制**：无文档地图 / 无项目标准档（ownership 按档内-档间一致性判）；源 / 测文件不在评审域 ⇒ 源侧现况行数未核（自报值）。

VERDICT: changes-required

### 轮次 2（评审子代理）

**结论：pass**（🔴 0 · 🟡 4 · 🔵 5，共 9；评审域 = 批档 + 七档设计档 + 需求 F16 回指面）

| # | 类别 | 级别 | 问题 | 建议 |
|---|---|---|---|---|
| 1 | Doc hygiene | 🟡 | 批档 §1「本批条目」E2 行（`2026-09-22-busy-extend.md:14`）仍留「挂起内 busy ⇒ 现状句」，而同 §1 U1 段（`:23`）已声明该括注**作废**、设计档 `docs/cli/design/TUI.md:608` 第 3 行 = 排队句 ⇒ 失效表达留在条目面（2026-09-18 用户裁：失效表达须删，历史归记录面） | 删该括注、表行改纯现态（挂起内 busy ⇒ 排队语义句）；历史留记录面 |
| 2 | Acceptance criteria | 🟡 | 修正块 #10（`:161`）称 AC-6 判据句已改述为「本批新增超宽行 = 0（存量 12 为基线）」，但 AC 行本体（`:103`）仍是「三档行宽 ≤300 且锚零新增：…= 悬空 16 + 行宽 12」——判据句与同行读数相抵（字面读法恒不可过）；`:30` 状态行「9 收正」计数随之失真 | AC-6 判据句替换为修正块口径；状态行计数按实际落位收正 |
| 3 | Clarity | 🟡 | 悬空节号同族未穷尽：`docs/cli/design/TUI-INPUT-BOX.md:303` · `docs/cli/design/TUI-SESSION-VIEW.md:20` / `:199` · `docs/cli/design/TUI.md:129` / `:525` 仍指 `docs/core/design/AGENT-LOOP.md` §9——该档节号止于 §8（本批已据同一实读收正同族 3 处：`:27` 观察③），真位 = `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.8 | 同式改指 `AGENT-LOOP-SUBAGENT.md` §6.8（或登记到期） |
| 4 | Affected-file annotations | 🟡 | 受影响文件表（`:58-72`）无 `thincoder-vscode/src/extension/panel-turn-stages.mjs` 行（无现况行数 / 增量），而 §1 观察④（`:220`）把该档注释面（`:113/:123/:161`）列为实施轮施工面并称「该两档本批文件表在册」（表内实有 `panel-messages.mjs` 一行）⇒ 按表施工即漏落注释收正（本批目的面 = 清旧口径） | 表内补该档一行（现况行数 / 增量上限 / 存量债 / 拆分结论） |
| 5 | Affected-file annotations | 🔵 | >500 存量档 `chat-panel-messages.test.mjs`（521 → ~526）缺席「>300 档审视结论」表（`:165-176` 8 行）——债本体已由 §1（`:23` U1 段）裁「记录接受（台账 #169）」**不复议**；仅为该档在表内不可见（读者看不到已越 500 硬限） | 表中补一行存档结论（存量 >500 · 本批只改述 · 拆档归 #169） |
| 6 | Acceptance criteria | 🔵 | T-F16-8 槽满形期望「吞 + 槽满提示」，而设计已钉提示形态 = `TUI.md` §7.5 表第 1 行（`已排队 1 条消息`）「单槽非空恒显、吞判不新增提示串」（`TUI-INPUT-BOX.md:120`）⇒ 该断言按键前后同真，证不了「吞判有反馈」 | 断言补可区分判据（清框不发生 / 槽内容不被覆盖 / 文本保留 + 段文本逐字不变） |
| 7 | Clarity | 🔵 | 同一容器两称：`TUI-INPUT-BOX.md:78` 称「`state.pendingInput` 队列」，而 §4.1（`:113`）/ `TUI.md:129-130` / 需求 F16（`docs/cli/requirements/TUI.md:37`）称「单槽（至多一条待交接）」——单读 §4 会取多条语义 | §4 该句改「单槽（至多一条——见 §4.1）」 |
| 8 | Affected-file annotations | 🔵 | 表内 3 档设计档「现况 / 预计后」328 / 707 / 186 → 341 / 720 / 192 已漂移（本刻读回 ≈345 / 723 / 195）；同族扩面轮另触 4 档 .md（`TUI-SESSION-VIEW` / `AGENT-LOOP-SUBAGENT` / `AGENT-LOOP` / `SESSION`）未入表；§2 旧「边界确认」句仍写「写域 = 三档设计文档」（`:147`） | 表按本刻读数回填（或标 as-of 不追值）+ 补四档 + 边界句收正（纯 .md 豁免行数标注，但任务书面应自洽） |
| 9 | Affected-file annotations | 🔵 | >300 表只落**文件维**结论（未新增函数 / 职责），未列**函数维**（≤500 行档若含 300+ 行单函数仍不合规；`key-handler.mjs` 距 500 硬限余量 ≤4 行）——源档不在评审域 ⇒ unverified | 两触顶档（`key-handler.mjs` / `index.mjs`）审视行补一句函数维结论（现况最长函数 / 新增分支是否越线） |

**计数**：🔴 0 · 🟡 4 · 🔵 5（共 9）——无 🔴 ⇒ pass（🟡/🔵 不阻approval）
**域外注（无级别 · 不入判定 · 不入计数）**：`docs/vsc/design/WEBVIEW-PROTOCOL.md:142`（「**挂起会话内 busy**（`running && _suspended`）→ 拒收（警告明示，不静默丢）」，同句自称「契约单源 = `WEBVIEW-INPUT.md` §1 C-B2-6」）与 `:144`（「挂起会话内 busy 的拒收先于回显」）现读旧口径，与本批 C-B2-6（`docs/vsc/design/WEBVIEW-INPUT.md:19` 一律排队）相抵；该档不在本评审域（本批声明「本批零触」）——是否并入本批同族收正由父侧定。
**已核读回（与 §2 声明一致）**：`TUI-INPUT-BOX.md` §4.1 判据表 5 行（`:109-113`）+ 吞面收敛四（`:116`）+ 执行序槽满钉串（`:120`）+ 唤醒证据行（`:123-125`）+ 送达三支（`:139-142`）；`TUI.md` §7.5 三态表（`:606-608`）+ §4 门禁括注（`:125-127`）；`WEBVIEW-INPUT.md` C-B2-6 + 细则①–⑥（`:19-40`）· 零改面（`:43`）· U-I2 / U-I8（`:152` / `:158`）· §9 行 1（`:164`）；同族扩面 9 处逐处命中（`TUI-SESSION-VIEW.md:81` / `:84` · `AGENT-LOOP-SUBAGENT.md:125-127` / `:137` · `AGENT-LOOP.md:91` / `:125` / `:416` / `:442` · `SESSION.md:336` / `:339` / `:556`）+ 四档变更记录行（`:206` / `:2103` / `:497` / `:655`）；需求 F16 四笔扩面（`requirements/TUI.md:37`）与设计同侧。
**评审限制**：无文档地图 / 无项目标准档（ownership 按档内-档间一致性判）；源 / 测文件不在域 ⇒ 受影响表源侧行数与 `file:line`（`suspension-drive.mjs:122/:137/:279` · `key-handler.mjs:440-444` · `panel-turn-stages.mjs:113/:123/:161` 等）未核（自报值，unverified）；`doc-check.mjs` 读数（悬空 16 / 行宽 12）未复跑（引擎不在域，自报值）。

VERDICT: pass

## §4 用户批准（主 agent）

**2026-09-22 09:15 用户批准**——用户原话「批准」（会话面，承 09:1x 请求）。

**三条件核验**：① 设计评审 pass（轮 1 changes-required → 修正全落 → **轮 2 pass**（🔴0 🟡4 🔵5——逐条裁决并落位）；域外并入 1 项（`WEBVIEW-PROTOCOL.md` 旧口径）亦收正）；② 修正 / 补漏 / 同族扩面 / 裁决落地四轮（id=7 / 8 / 9 / 11）全交货并经父侧抽核；③ token 已签发（值不落档——运行时凭证）。

**批准范围** = 本批全量：CLI 2 档（`key-handler.mjs` / `render-frame.mjs`）+ VSC 3 档（`webview/send.js` / `panel-messages.mjs` / `chat-panel.mjs`）+ 注释随改档（`panel-turn-stages.mjs`）+ 测试面 5 档（改述 / 新增 / 扩述）；需求面 F16 扩面已落（父侧笔）。

**批准后动作** = 实施轮派发（eng-coder · 携本批 designToken / designId）→ 交付审计 → 收口（§5 / §6）→ 提交推送 → 台账 #224 核销 → design 槽消费。

## §5 实施记录（eng-coder）

**状态行**：实施完成（两轨全绿 CLI 787/787 · VSC 926/926；审计 1 轮 + 代码评审 1 轮（pass）→ 自修 consolid；15 档施工 = 表内 13 + 表外 2 在案；提请项 5 条见段末）

**交付摘要**：

- **CLI（E1 / E2）**：`key-handler.mjs` busy 门禁吞条件去 `state.suspended || state._suspPending`（判据六条 → 五条）+ 挂起面入槽同款唤醒（`state._suspWake?.()` 呼叫点）；`render-frame.mjs` `enterHint` 二态 → 三态（槽满 / 普通 busy / 挂起内 busy；`已排队 1 条消息` 逐字零改）；`suspension-drive.mjs` · `index.mjs` 注释随判据收正（机制零改）。
- **VSC（E1 / E2 对位）**：`webview/send.js` busy 判据回开为 `S._turnState === "running"` 全面 + C-B2-4 拒发分支删（−8 行）；`panel-messages.mjs` `routeUserTurn` 载体两态（会话在飞 ⇒ 既有 `_chat` susp 分支入 `susp.pendingInput`；槽满守卫/唤醒同款）+ `pushBusyQueued` 判据源扩两载体；`chat-panel.mjs` `sendMessage` 拒收守卫撤销 + `_chat` 携来源标记（`fromBusyQueue` + `visionReader` per-call 缝）；`panel-turn-stages.mjs` 注释面三处收正。
- **测试面**：CLI = T-F16-4 ②改述 · T-F16-8 / T-F16-9 新增 · T-F16-6 扩三态 · T-F16-7 改述 + 释放窗口入槽格新增；VSC = T-V16-4a 改述 · T-V16-2 ③ 改述 · T-V16-7 / T-V16-8 / T-V16-10 新增 · T-B2-5 改述；表外档 T-D10 改述。

**决策透明表**：

| # | 决策 | 依据 / 理由 |
|---|---|---|
| I-1 | **会话在飞受理 = 走既有 `_chat` susp 分支**（`routeUserTurn` 委派，7 参） | §2 设计定稿 4 + C-B2-6 本体/细则⑤（落点含 `chat-panel.mjs` `_chat` 来源标记参）；按 §2 自陈「三档正文即权威」取读。**与 §2 用例面 T-V16-7 措辞「零 `_chat` 直呼」相抵**——按设计档读作「零即时回合」（`_chat` susp 分支 return，不开新回合）；交付断言 = 入槽 + 两载体镜像推送 + 唤醒一次 + 零警告 + `_turnState` 不变。提请 §6 以「零即时回合」收正该格措辞。 |
| I-2 | **补 `suspension.mjs` driver 消费点推 `busyQueued`**（表外档） | C-B2-6 细则①「三支消费点（driver 步骤 1 / 装载① 预填 splice / 装载② 归位 shift）后 host 推 `pending:false`」；本批新开「会话在飞」载体后该支成载荷点（不补 ⇒ webview 镜像黏滞 true ⇒ 下一次合法提交被误拒）。实现用动态 import（零新增静态边——`panel-messages` ↔ `suspension` 反向静态边不上岸；同档既有 `parkAsyncPending` 先例）。T-V16-3 加一条消费点推送锁。 |
| I-3 | **表外档 `async-parity.test.mjs`（T-D10）改述** | 旧断言编码被本批推翻的「挂起会内 busy 拒收」；不改则 AC-②（VSC 全绿）不可达。仅改述 + 注，不扩面。 |
| I-4 | 注释随改面按「档内全量」口径收正（`chat-panel.mjs:60-62`/`:446` · `panel-messages.mjs:232-233` · `suspension-drive.mjs:9`/`:38`/`:208` · `suspension.mjs` 四处 · `send.js:14-17`） | 本批目的面 = 清旧 blanket 口径；同档内描述本机制的失效句一并收正（超出表内点名行号者逐处可 revert）。 |
| I-5 | locale / 协议 / Ctrl+I / 攒批 **零触** | §2 边界（U2 已裁 Not an issue）；`busyQueued { pending }` 协议名与载荷零变。 |

**审计与代码评审轮次与终态**：

| 轮 | 面 | 结论 | 处置 |
|---|---|---|---|
| 内部偏差审计（explore · 只读） | 设计定稿 1–6 + 用例面 13 格 + 表外改动 + 注释漂移 + 断言可失败性 | DEVIATIONS（部分实现 1 · 表外 1 · 注释面 3 · 行数疑读数 1） | 部分实现 = driver 消费点推 `busyQueued` ⇒ 按设计补（I-2）；表外 = `async-parity.test.mjs`（I-3）；注释面 = 逐处收正（I-4）；行数「疑超」= 计数口径差（读工具含尾段）⇒ 以换行符计数复核，全部达标（见读数） |
| 内部代码评审（advisor · code） | 6 档源 + 6 档测 + 批档 §2 + 三档设计档 | **pass**（🔴 0 · 🟡 1 · 🔵 6） | 🟡 = 批档受影响表缺两档（`suspension.mjs` / `async-parity.test.mjs`）⇒ 归 §6 补记（代码零动作）；🔵 两处当场收正（`busy-injection.test.mjs` 条件编号 · `index.mjs:386` 斜杠限定），余四处为报告面（行数标注漂移 · 循环内动态 import · 回显先于受理判决窗 · 释放窗口防御拒面枚举） |
| 自修（终态 = clean） | 审计 + 评审发现 | 全落 | I-2 / I-3 / I-4 + 条件编号与 blanket 注释收正；自修后两轨复跑全绿 |

**读数（换行符计数 · 实施轮终态）**：

- 表内 13 档：`key-handler.mjs` 496 → **498**（净 +2 ≤2 ✓）· `render-frame.mjs` 415 → **417**（≤418 ✓）· `index.mjs` 499 → **499**（净零 ✓）· `suspension-drive.mjs` 334 → **334**（净零 ✓）· `busy-injection.test.mjs` 219 → **281**（超「~245」预计——归 §6 回填）· `input-lock.test.mjs` 388 → **395**（≤395 ✓）· `send.js` 93 → **86**（~85 ✓）· `panel-messages.mjs` 324 → **330**（≤330 ✓）· `panel-turn-stages.mjs` 233 → **233**（净零 ✓）· `chat-panel.mjs` 493 → **486**（≤493 ✓）· `busy-injection-vsc.test.mjs` 350 → **453**（超「≤400」且原注「距 500 余量 ≥100」失真——归 §6 回填；<500 ✓）· `chat-panel-messages.test.mjs` 521 → **524**（≤526 ✓；>500 存量债 #169——只改述不扩面）· `webview-input-enter.test.mjs` 206 → **208**（~210 ✓）。
- 表外 2 档：`suspension.mjs` 436 → **439**（<500）· `async-parity.test.mjs` 495 → **492**（<500）。
- 验收读数：CLI `node test/run.mjs` = **787 pass / 0 fail**；VSC `node test/run.mjs` = **926 pass / 0 fail**；`node scripts/doc-check.mjs --root .` = 悬空 **16**（基线 16）· 行宽 **12**（基线 12）——本批新增 0。
- AC-3 逐字核验：两条新提示句对设计档 §7.5 `:607`/`:608` 做 literal 双命中（源码 + 测试同串）；`已排队 1 条消息` 零改。

**提请父侧（§6 面）**：① T-V16-7 格措辞「零 `_chat` 直呼」→「零即时回合」（I-1）；② 受影响表补 `suspension.mjs` + `async-parity.test.mjs` 两档、§4「测试面 5 档」→ 6 档；③ 行数标注回填两处（见读数）；④ 表外档同族旧口径注释未触（`panel-chat.mjs:5-9` · `webview/loading.js:19-21`/`:63` · `test/files.mjs:57`）——零动作上报；⑤ U2（`input.busyPlaceholder`）维持零改。

## §6 验证与收口（父代理）

### 收口记录（父代理 · 2026-09-22 09:4x）

**验收读数（父侧独立复跑——日志落盘 `.thincoder/tmp/`）**
- CLI：`node test/run.mjs` = **787 pass / 0 fail**（`bi-cli-verify.log`）——与 §5 自报逐数一致。
- VSC：`node test/run.mjs` = **926 pass / 0 fail**（`bi-vsc-verify.log`）——同上。
- 机检：悬空 16 / 行宽 12 = 基线同集（本批新增 0）。
- 抽读核验：`key-handler.mjs:317`（唤醒呼叫点）· `:440`（挂起面入槽门 + 新注释）· `render-frame.mjs:402-404`（enterHint 三态逐字；`已排队 1 条消息` 零改）· `webview/send.js`（`running` 全面受理 + 二次提交守卫 + C-B2-4 拒发分支确删）——四处与设计单源一致。
- 测试锚：T-F16-7（挂起内 busy 同判据入槽 + 唤醒 · 斜杠同吞 · 空静默）复跑实过 ✓。

**§5 提请项处置（5 条）**
- ① T-V16-7 格措辞「零 `_chat` 直呼」→ **以「零即时回合」为权威读法**（I-1：会话在飞走既有 `_chat` susp 分支 return，不开新回合）；§2 该格措辞以此读（记录面不回改）。
- ② 受影响面补 **2 档**（`suspension.mjs` 439 · `async-parity.test.mjs` 492——表外施工，终态读数以 §5/§6 为准）；测试面 5 档 → **6 档**。
- ③ 行数回填两处：`busy-injection.test.mjs` 219 → **281**（超 ~245 预计）· `busy-injection-vsc.test.mjs` 350 → **453**（超 ≤400 且原「余量 ≥100」注失真——**<500 硬限 ✓**；均测试档，无拆分义务）。
- ④ 表外同族旧口径注释未触（`panel-chat.mjs:5-9` · `webview/loading.js:19-21`/`:63` · `test/files.mjs:57`）= 零动作 → **入册**（台账新条目）。
- ⑤ U2（`input.busyPlaceholder`）维持零改 ✓。

**D7 结算同步清单**
- 角色表 / 状态行：§1–§6 全段在档；§5 = 实施完成 ✓；本档即冻结。
- 条目覆盖：E1–E3 全落；设计单源（§4.1 / §7.5 / C-B2-6 / 协议档）收正 ✓；8 档设计文档 + 协议档 + 需求 F16 变更记录在档（前轮已录）。
- **提交面**：本提交 = CLI/VSC 源 + 测试 15 档 + busy 独家设计/需求/协议档 + 本档；**两档共写文件延后**（`docs/core/design/AGENT-LOOP-SUBAGENT.md` · `docs/core/design/SESSION.md`——其内容含 triage/session-index 批的在飞共写，随该两批收口提交，届时注明携 busy-extend 同族收正）。
- 台账：**#224** 在途 → 待核销 → 已核销（结算依据 = §5 + 本 §6 + 提交）；连带 #226（`createKeyHandler` 债）· #169 口径 · 新条目（表外注释族④）已另册。
- design 槽：收口后消费。

**结算依据**：§5（实施 + 审计 / 评审 / 自修）+ 本 §6（父侧独立复跑绿 + 抽读核验）+ 提交（推 `origin/main`）+ 台账 #224。
