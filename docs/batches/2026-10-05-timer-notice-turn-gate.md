# 2026-10-05 · timer 提醒行回合起跑门（会话内清除点补全）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-05 · 来源 = 用户 2026-10-05 21:42 现场报障（timer 注入行停在会话流最后不消失）+ 21:59「赶紧修了吧」= 本批点火（快车道）。
> 台账 = #952（desktop · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-05
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 讨论来源与授权

- 来源 = 用户 2026-10-05 21:42 现场报障（「刚才定时观察生成的 System reminder 一直停在会话流最后一直不消失」）+ 21:59「赶紧修了吧」= 本批点火（**快车道** · 单点全流程）。
- **机制（侦察 `#9` 在册）**：① **会话内零清除点**——timer 行（`[data-timer]`）退场唯一路径 = 首屏页读门（切会话 / 新建 / 恢复 / 重载 · `thincoder-desktop/renderer/page-read.mjs:206-213`）；回合起跑门（`msg:send` 出站即清 · `thincoder-desktop/renderer/store.mjs:251-268` `clearTurnTraces`）在 2026-10-04 批**显式排除**该族，且回归锁 T6 钉「出站后 `timerNotice` 引用必须不变」（`docs/batches/2026-10-04-row-traces-clear-at-turn.test.mjs:189-195`）。② **停在流末** = `blockAnchor` 首锚 = `[data-timer]`（`thincoder-desktop/renderer/views/chat-chrome.mjs:189-193`）——新块一律插其前 ⇒ 恒顶流尾。
- **裁定（用户口径在效）**：① timer 行**纳入回合起跑门**（沿 #919 用户裁定「下一回合开始即清」语义——`clearTurnTraces` 扩员，首屏门保留，T6 锁同步翻转）；② **贴尾锚保留**（闹钟在别处响过时 = 可见位；有回合门后「一直不消失」观感消除）；③ compress 行**不入本批**（用户 21:58 亲证「没观察到固化在尾部」——挂牌观察项，见 `2026-09-29-desktop-compress-row-pin.md` 已修其贴尾面）；④ VSC ∥ CLI 端差（同样不清但随流上浮 ∥ append-only 终端）交设计轮论证（CLI 天然 host-capability 候选）。
- 授权 = 全链跑（设计 → 代点火评审 → 代签 → 实施 → 收口）。
- **同族口径注**：本批系「流尾非块行」族第三笔（①/#919 帮助行 + 停止痕 ∥ ②/#913 台账尾行去面 ∥ ③ 本笔 timer 行）——族面清账后仅余 compress（观察项）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（2026-10-05——机制 = clearTurnTraces 扩员（timer 员并入回合起跑门）+ 首屏门保留 + 晚到照写照显；T6 断代重锚（父侧执行通道）；端差 VSC/CLI 零触；先红实读 3/3（T 族）+ 恒绿 3/3（S 族）+ 旧件基线 7/7；评审轮次 1 修正（fix 轮）逐号落位（AC-7 离线可产判由 + 人工走查腿 ∥ §2.6 四坐标收正 ∥ 行数账四行齐平）；doc-check 复跑 exit 0（悬空 0 · 行宽 0））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目与覆盖（台账 #952）

| # | 条目 | 需求回指（用户口径） | 本批处置 |
|---|---|---|---|
| 1 | timer 提醒行（`[data-timer]`）「停在流尾不消失」 | 用户 2026-10-05 21:42 现场报障（「一直停在会话流最后一直不消失」）+ 21:59「赶紧修了吧」点火（快车道） | 纳入回合起跑门（`clearTurnTraces` 扩员）；贴尾锚保留 |

**覆盖面** = 桌面端到期触发行族**清点时机**（会话内清除点补全）——形态 ∥ 落位 ∥ 词面 ∥ CSS ∥ 锚链零动。
**显式不入本批**：`compress` 观察项（用户 21:58 亲证「没观察到固化在尾部」——不入本批）∥ `digest` 维持（行出即留——2026-10-01 口径）∥ `onTimer` 写径语义 ∥ 贴尾锚链（`blockAnchor` 首锚）∥ 产品码零写（设计轮）∥ VSC ∥ CLI 零触（端差处置见 2.5）∥ 提示词面 ∥ 需求档零触（主 agent 笔面）。

### 2.2 机制设计（修形逐字）

**现状**（实读 2026-10-05）：timer 行会话内**零清除点**——`clearTurnTraces`（`thincoder-desktop/renderer/store.mjs:251-268`）显式排除 `timerNotice`（`:255` 注「三族零触」）；退场唯一路径 = 首屏页读门（`renderer/page-read.mjs:206-213` `clearTimerNotice`）；贴尾锚 = `blockAnchor` 首锚（`views/chat-chrome.mjs:189-193`）。
**终形** = 纳入回合起跑门（沿 #919 语义「下一回合开始即清」——KD-74 扩员）：

1. **`store.mjs` `clearTurnTraces` 扩员**（`:256-268` 整函数替换——逐字）：

```js
export function clearTurnTraces(state, key) {
  if (typeof key !== "string" || key === "") return state
  const help = state?.helpLines ?? {}
  const marks = state?.stopMark ?? {}
  const notices = state?.timerNotice ?? {}
  const holds = state?.stopHold ?? {}
  let nextHelp = help
  if (help[key] !== undefined) { nextHelp = { ...help }; delete nextHelp[key] }
  let nextMarks = marks
  if (marks[key] !== undefined) { nextMarks = { ...marks }; delete nextMarks[key] }
  let nextNotices = notices
  if (notices[key] !== undefined) { nextNotices = { ...notices }; delete nextNotices[key] }
  const nextHolds = holds[key] === true ? holds : { ...holds, [key]: true }
  if (nextHelp === help && nextMarks === marks && nextNotices === notices && nextHolds === holds) return state
  return { ...state, helpLines: nextHelp, stopMark: nextMarks, timerNotice: nextNotices, stopHold: nextHolds }
}
```

2. **JSDoc 收正**（`:251-255`）：头注「（纯动作 —— 行痕族消失时机批 · 2026-10-04 · 台账 #919；单源 = …KD-74）」⇒ 增「timer 员并入 · 2026-10-05 · 台账 #952」；①②③行 ⇒「① 摘本键 `helpLines`；② 摘本键 `stopMark`；③ 摘本键 `timerNotice`（晚到到达照写照显——留至下一回合门）；④ 置闩 `stopHold[key] = true`」；「两痕已空 ∧ 闩已在 ⇒ 原引用」⇒「三痕已空 ∧ 闩已在 ⇒ 原引用」；尾句「三族（`timerNotice` ∥ `compress` ∥ `digest`）零触（未裁零动 —— 批档 §2.9 边界②）。」⇒「`compress` ∥ `digest` 两族零触（未裁零动——`compress` 观察项）。」
3. **出站点零改**：`composer-wire.mjs:90` ∥ `:165` 两调用照旧（信号点恒 `msg:send` 出站前沿同笔——零重排、零新写点）。
4. **首屏门保留**：`page-read.mjs:264-277` 五清键集零动（`clearTimerNotice` 本体零改——仅注随动，见 2.6）。
5. **随动注五处（实施逐处——陈注不随动即文档-代码相抵）**：
   - `store.mjs:72-74`：「**行痕族两员清点时机 = 两门**（…）：`helpLines` ∥ `stopMark` 首屏门保留 + 新增回合起跑门（…）」⇒「**行痕族三员清点时机 = 两门**（行痕族消失时机批 · 2026-10-04 · 台账 #919；timer 员并入 · 2026-10-05 · 台账 #952）：`helpLines` ∥ `stopMark` ∥ `timerNotice` 首屏门保留 + 回合起跑门（…）」（`…` = 原位零改）。
   - `events-wake.mjs:94-97`：生命期句「（非落盘件 —— 首屏页读整置即失；同 `[data-stopped]` 族）」⇒「（非落盘件 —— 清点两门：首屏页读整置即失 + **回合起跑门** = `msg:send` 出站即清——timer 员 2026-10-05 · 台账 #952 并入；晚到到达照写照显 · 留至下一回合门；单源 = `docs/desktop/design/RENDERER.md` §1.6 KD-74）」。
   - `page-read.mjs:206-207`：补句（沿 `clearHelpLines` `:224-226` 形）——「；**本族清点 = 两门**——首屏门 + 回合起跑门（`msg:send` 出站即清——`clearTurnTraces`；timer 员 2026-10-05 · 台账 #952 并入；单源 = `docs/desktop/design/RENDERER.md` §1.6 KD-74）」。
   - `chat-model.mjs:89-91`：「…`timerNotice` 本身维持首屏单门；单源 = …」⇒「…清点两门：首屏页读整置即失 + 回合起跑门 = `msg:send` 出站即清——timer 员 2026-10-05 · 台账 #952 并入；单源 = …」。
   - `chat-model.mjs:78-80`：「行痕族两门 = `helpLines` ∥ `stopMark` 两员在册」⇒「行痕族两门 = `helpLines` ∥ `stopMark` ∥ `timerNotice` 三员在册」。

**两门关系**：幂等并集、可交换（三键摘动作 + 闩置——先后零差、重复零害）。**闩语义零改**（`stopHold` 只涉 `stopped` 痕——本批零触）。

### 2.3 晚到边角判据（必答）

**场景**：出站门后（如本键回合在飞 / 回合尾后）timer 到期 ⇒ `ev:timer` 到达。
**判据 = 照写照显（零丢弃机制——不设 timer 闩）**：
- `onTimer`（`renderer/events-wake.mjs:98-104`）照常写切片（写径语义零改）⇒ 行照显于流尾；
- 显示期 = [到达，**下一回合门**)——留至用户下一次发送时清除；期间另有 timer 到期 ⇒ 同键就地替换（最近一次交付——既有语义）；
- **与 `stopped` 晚到丢弃分道**（理由）：`stopped` = 上一回合终局回声（陈旧物——丢弃正当，KD-74 ④）；timer 到期 = **会话级独立事实**（「闹钟响过」——无「属上一回合」语义）⇒ 丢弃 = 失信息（用户漏看闹钟）。零新增机制（不设 timer 闩——零新切片、零 `events.mjs` 门）；
- **观感完备性**：本表后行不再「一直不消失」——恒在下一次发送时刻退场；无后续发送 ⇒ 与「发送前在场」同态（可见位——用户裁定 ②）。

### 2.4 T6 回归锁处置（断代重锚——择一给由）

**对象**：`docs/batches/2026-10-04-row-traces-clear-at-turn.test.mjs:188-196`（T6「三族零触」——出站后 `timerNotice` 引用须不变）。本批后该断言必红。
**处置择定 = 断代重锚（非「认账留红」）**。判由：① 期望滞后 ≠ 件失效（#777 先例）——该件余 6 腿（T1–T5 ∥ T7）恒绿、仍为 #919 机制在役回归锚；② 留红认账 = 该件复跑面废（「批内件直跑」锚失——#915 判由）；③ 沿 #894 ∥ #897 ∥ #910 ∥ #915 断代重锚先例（重锚后基线 6/7 红=待实施 → 实施后 7/7）。
**重锚逐字**（四处——全件其余零改；净 Δ = +1 行，205 ⇒ 206（执行轮现盘对表））：
- ① 头注（`:1` 后加一行，断代注独立成行——#894/#897 先例）：
  ` * 断代重锚（2026-10-05 · 批 2026-10-05-timer-notice-turn-gate · 台账 #952）：T6 timerNotice 臂随裁翻转（并入回合起跑门——clearTurnTraces 扩员）；余腿零改。`
- ② 腿表行（`:18`）：「T6（恒绿 · 三族零触）：出站清点后 `timerNotice` ∥ `compress` ∥ `digest` 三切片引用不变（零写）。」⇒「T6（断代重锚 2026-10-05 · 批 #952）：出站清点后 `timerNotice` 本键摘（原「引用不变」随裁翻转——并入回合起跑门）∥ `compress` ∥ `digest` 两族引用不变。」
- ③ 夹具行注（`:53`）：「对照三族（T6 断言零触）」⇒「对照族（T6：timerNotice 入闸本键摘 ∥ compress ∥ digest 零触）」。
- ④ T6 腿体（`:188-196`）⇒：

```js
// ─── T6（断代重锚 · timer 并入起跑门 ∥ compress ∥ digest 零触）─────────────────
test("T6（断代重锚）：出站清点后 timerNotice 本键摘（2026-10-05 并入回合起跑门）∥ compress ∥ digest 引用不变", () => {
  const s = stateWithTraces()
  const out = clearTurnTraces(s, KEY)
  assert.equal(out.timerNotice[KEY], undefined, "timerNotice 本键摘（断代重锚——原「引用不变」随裁翻转）")
  assert.equal(out.compress, s.compress, "compress 引用不变")
  assert.equal(out.digest, s.digest, "digest 引用不变")
  assert.equal(s.timerNotice[KEY].text, "到期行", "起场对照：本键行原在场")
})
```

**执行通道 = 父侧直接执行**（跨批伴随件不在批次档写门豁免面内——D-BR23 判据；工程角色直写必拒——沿 `2026-10-05-engine-tools-gaps.md` §2.5 注 ∥ `2026-10-05-review-gate-gaps.md` 同拍口径）。**该件不列入实施派发 files 面**。重锚后复跑基线 = 6/7（红 = T6——待实施）；实施后 = 7/7。

### 2.5 端差处置（VSC ∥ CLI——论证后零触）

| 端 | 载体（实读） | 生命周期 | 处置 |
|---|---|---|---|
| 桌面（本批后） | 流尾 chrome 行组 `[data-timer]`（切片 `timerNotice`——**尾组钉悬**：新块恒插其前） | 两门即清（首屏 ∥ 回合起跑） | 本批改 |
| VSC | `thincoder-vscode/webview/chat-messages.js:255-265` `addTimerLine`——`ctx.messagesEl.appendChild`（**流内 append 元素**，非尾组钉悬） | 随流上浮（新块 `newBlock` = `ui.js:117-124` `messagesEl.appendChild` 居其后——下一块起点即下移）；无显式清除；重建（切会话 / 重载）即失 | **零触**（载体系举证——同 #919 KD-74 ⑤ 口径） |
| CLI | `thincoder-cli/src/tui/timer-watch.mjs:34-37` `deliverExpiredTimers` ⇒ `pushLine`（滚回打印行） | 打印即沉入滚回、不可撤（append-only） | **零触**（host-capability——同 #919 CLI 观察口径） |

**VSC 判由（举证类别 = 不存在该观感）**：用户报障对象 = 「**停在流尾**不消失」（尾组钉悬形态）；VSC 无尾组钉悬——timer 行 = 流内 append（普通流序元素），后续内容恒落其后（`newBlock` append 语义实读 `ui.js:117-124`）⇒ 「恒顶流尾」不可达；且历史重建即失 ⇒ 无「永挂」形态。
**翻转条件在册**：若评审判「流内 append 元素与尾组钉悬行属同族、须同口径」⇒ 翻转为对齐（VSC 增退场钩——user 发送时点摘 `.timer-line`），扩端面须另裁，本批不自落。
**CLI**：滚回行 append-only = 宿主能力差，登记观察——三端同口径要求 ⇒ 另批。

### 2.6 受影响文件与行数（现行 = 实读 2026-10-05；本表数字不作实施边界——doc-check 行数面（报告态）即回填工单）

**产品码（实施轮落地 · 设计轮零写）**：

| 文件 | 现行行数 | 改动面 | 预期增量 |
|---|---|---|---|
| `thincoder-desktop/renderer/store.mjs` | 365（越 300 顾问线存量在册；本批 ≈+4 非结构性 ⇒ 不触发拆档评估） | `clearTurnTraces` 扩员（2.2①）+ JSDoc 收正（2.2②）+ 头注句收正（2.2⑤-1） | ≈ +4 |
| `thincoder-desktop/renderer/events-wake.mjs` | 104 | `onTimer` 注随动（2.2⑤-2） | +1± |
| `thincoder-desktop/renderer/page-read.mjs` | 285 | `clearTimerNotice` 注随动（2.2⑤-3） | +1 |
| `thincoder-desktop/renderer/views/chat-model.mjs` | 108 | 两注随动（2.2⑤-4 ∥ ⑤-5） | ±0~+1 |

**零动面（明书）**：`composer-wire.mjs`（出站点照旧——注文仍真，零触）∥ `views/chat-chrome.mjs`（锚链 ∥ 构树 ∥ 态刷零改）∥ `views/chat.mjs` ∥ `chat.css` ∥ `i18n*.mjs` ∥ `frame-dispatch.mjs`（`CHAT_KEYS` 零改）∥ `events.mjs`（闩 / 晚到口零改）∥ `page-read.mjs` 五清逻辑本体 ∥ VSC ∥ CLI ∥ 核包。
**设计档（本轮回笔——已落）**：`docs/desktop/design/RENDERER.md`（552——§1.1 到期触发行条清点句 ⇒ 两门（`:157-158`）∥ §1.6 **KD-74** 扩员（`:254`——三员 + ⑥ 晚到判据 + 被否候选收窄至 `compress`）∥ §1.6 注行（`:256`）∥ 变更记录（`:552`））∥ `docs/desktop/design/ACTIVITY.md`（475——§3 行痕族句 ⇒ 两门三员（`:116-117`）∥ 变更记录（`:475`））。
**测试面**：本批件新立 `docs/batches/2026-10-05-timer-notice-turn-gate.test.mjs`（159 行——见 2.7）∥ 旧件断代重锚（204 ⇒ 205——2.4 · 父侧直接执行）。
**行数账随动（实施轮回填轮）**：`CHAT.md:137` page-read 行（表 280 ⇒ 实读 285）∥ `CHAT.md:142` chat-model 行（表 106 ⇒ 实读 108）∥ `RENDERER.md:336` store.mjs 行（表 341 ⇒ 实读 365）∥ `ACTIVITY.md:141` events-wake 行（表 102 ⇒ 实读 104）——四行叠加本批增量后齐平。

### 2.7 测试面（批内件 · 先红后绿）

件名 = `docs/batches/2026-10-05-timer-notice-turn-gate.test.mjs`（**设计轮已立红**——2026-10-05）；跑法（仓根 `thincoder/`）：`node --test docs/batches/2026-10-05-timer-notice-turn-gate.test.mjs`；不入仓套件（批内件 · 随批留存）。

| 腿 | 面 | 断言 | 红绿（设计轮实读 2026-10-05） |
|---|---|---|---|
| T1 | 纯动作 | 三痕在场 ⇒ 三键摘 ∧ 闩置；他键零触；再调 ⇒ 原引用；键无效 ⇒ 原引用 | **✖ 红**（timerNotice 本键未摘） |
| T2 | 出站接线 | 直发 ∥ 队径两出站 ⇒ call 前沿 `timerNotice` 已摘（+ help/mark/hold 同门）；两出站点同笔调用源面锁 | **✖ 红**（direct 径 call 前沿键在） |
| T3 | 晚到照写照显 | 出站门后 `ev:timer` 到达 ⇒ 照写（零丢弃）；形不合 ⇒ 原引用；下一回合门 ⇒ 本键摘 | **✖ 红**（末臂——下一门未摘） |
| S1 | 首屏门保留 | `applyPage` `before == null` ⇒ `timerNotice` 仍清；`before` 非空 ⇒ 不清 | ✔ 恒绿 |
| S2 | 锚链零改 | `blockAnchor` 探针序首锚 = `[data-timer]`（新块恒插其前） | ✔ 恒绿 |
| S3 | 两族零触 | `clearTurnTraces` ⇒ `compress` ∥ `digest` 引用不变 | ✔ 恒绿 |

**先红读数 = 3 fail / 3 pass**（实跑 2026-10-05——T1/T2/T3 断言红点逐条落「timerNotice 本键未摘」族）；**后绿读数 = 实施轮**（§5 在册）。旧件基线（重锚前）= **7/7 恒绿**（实跑 2026-10-05——重锚后 = 6/7 红待实施，见 2.4）。

### 2.8 验收对照（AC · 回指用户口径）

| AC | 判据（机检可验） | 回指 |
|---|---|---|
| AC-1 | timer 行在场时出站 `msg:send` ⇒ 本键 `timerNotice` 键摘（`[data-timer]` 退场） | 21:42 报障 → 裁定并入 |
| AC-2 | 晚到 timer（出站后到期）⇒ 行照写照显 ∧ 下一回合门摘（零丢弃） | 2.3 判据 |
| AC-3 | 首屏页读（切走切回 / 重开）⇒ 本键仍清（五清零动） | 首屏门保留 |
| AC-4 | 出站后 `compress` ∥ `digest` 零变；锚链 ∥ 形态 ∥ 词面 ∥ CSS 零动 | §1 边界 |
| AC-5 | 批内件六腿先红后绿（两读入批档 §5）；旧件重锚后 = 7/7（实施后） | 测试面 |
| AC-6 | `node scripts/doc-check.mjs` = exit 0 · 悬空 0 · 行宽绿 | 交付验收④ |
| AC-7 | **真机面（D16 回退式）**：人工走查腿 = 到期 ⇒ 行在场 ⇒ 发送 ⇒ 行退场（父侧真跑闭合）；离线可产判由 = 行在场 ⟺ 本键切片在场（`views/chat.mjs:16`）∧ 机器链条在册（到期 ⇒ 照写 T3 ∥ 发送 ⇒ 本键摘 T2 ∥ 键摘 ⇒ 重绘零改 S2）；探针不可跑（到期半需真 timer——同面先例 `docs/desktop/design/E2E-TESTING.md:184`） | 21:42 报障（可见退场行为 · D16 义务） |

### 2.9 关键决策与备选否决

- **KD-74 扩员（单源在册——不新立 KD）**：timer 员并入回合起跑门（三员双门 + 晚到照写照显）；同机制不拆两行（D2 单源）。
- **备选否决**：① **晚到 timer 丢弃闩**（仿 `stopHold`）——误弃真闹钟（timer 无「属上一回合」语义；失信息）；② **timer 维持单门不动**——违用户裁定（「一直不消失」动机未消）；③ **首屏门吸收 / 换信号点**——沿 #919 已否族（违「发出」字面）；④ **贴尾锚改**（去首锚 ⇒ 行随流上浮）——用户裁定 ② 保留（闹钟可见位）+ 改锚 = 形态面越界；⑤ **VSC 同步改**——载体系举证 + 翻转条件在册。
- **旧件处置**：断代重锚（非认账留红）——判由见 2.4。

### 2.10 边界（本批不做）

① 贴尾锚链（`blockAnchor` 首锚 = `[data-timer]`）零改；② `onTimer` 写径语义零改（同键就地替换 ∥ 形不合零写）；③ `compress` ∥ `digest` ∥ `helpLines` ∥ `stopMark` 各族机制零触；④ 形态 ∥ 落位 ∥ 词面 ∥ CSS 零动；⑤ VSC ∥ CLI 零触（2.5）；⑥ 需求档 ∥ 提示词面零触；⑦ 产品码零写（设计轮）；⑧ 首屏门五清键集不减。

### 2.11 上抛与披露

1. **旧件断代重锚执行通道 = 父侧直接执行**（2.4——跨批伴随件；不列实施派发 files 面）。
2. **实施轮随动注五处**（store ∥ events-wake ∥ page-read ∥ chat-model ×2——逐处见 2.2⑤；陈注不随动 ⇒ 文档-代码相抵）。
3. **行数账回填**：`CHAT.md` §3.1 两行 ∥ `RENDERER.md` §5.1 store 行 ∥ `ACTIVITY.md` §4.1 events-wake 行（2.6 末段——doc-check 行数面报告态已示差；本批实施后增幅叠加——归回填轮）。
4. **一致性面（本笔已修）**：KD-74 ① 坐标 `page-read.mjs:259-268` ⇒ `:264-277`（漂移 5 行——现盘实读）；② `sendQueued` `:164` ⇒ `:165`（漂移 1 行）。**同笔注**：`RENDERER.md` 到期触发行条首版新句过宽 334 字符（doc-check 行宽闸命中）⇒ 就地折两行（`:157-158`——零语义）。
5. **披露（非阻）**：`views/chat.mjs:16` 注「到期触发行组…在场 ⟺ 本键切片在场」仍真（未涉清点面——零动判定）；`frame-dispatch.mjs` `CHAT_KEYS` 含 `timerNotice` 照旧（单变触发——键摘即重绘，零改）。

### 2.12 评审轮次 1 修正（fix 轮 · 2026-10-05 · eng-designer）——①🟡 ②🔵 ③🔵 逐号落位

**依据** = 本档 §3 轮次 1 发现表 + 父侧裁定（三项全采纳，逐号落修）；**范围** = §2 就地收正（2.6 ∥ 2.8 ∥ 2.11）+ 本块留痕；**机制语义零改 · 零新语义**（改动 = 三类面发现的直接导出：验收 ∥ 坐标 ∥ 行数账面）；产品码零触 ∥ 他档零写（两设计档的行数账回填 = 实施轮回填轮面，非本轮）。

**①（🟡 · 验收面）AC-7 补入——二择一择定 = b「离线可产判由 + 人工走查腿」（D16 回退式）**

- **判由**：到期半 = 真 timer ⇒ 真 provider，探针不可跑（同面先例 = `docs/desktop/design/E2E-TESTING.md:184`：T-DSK44「全组离线不可产 ⇒ 人工走查 + 父侧真跑闭合」）
  ⇒ 走 D16 回退条款（`docs/desktop/design/ACTIVITY.md:46` 尾句）；判据面 DOM 走查分界在册（`docs/desktop/design/RENDERER.md:104`「挂载函数不进自动面（DOM 面随人工走查）」）。
  两式对照：a 式「真机腿」无处安放（无夹具路可产真 timer——不可复跑的「腿」即空承诺）；b 式把可见链拆成机检半 + 真机半，两半各有归宿。
- **离线可产判由（机检半）**：行在场 ⟺ 本键切片在场（`views/chat.mjs:16`）∧ 机器链条在册——到期 ⇒ 照写（T3）∥ 发送 ⇒ 本键摘（T2）∥ 键摘 ⇒ 重绘零改（S2 ∥ S3）。
- **人工走查腿（真机半）**：到期 ⇒ 行在场 ⇒ 发送 ⇒ 行退场——父侧真跑闭合（D16 通道）。
- **落点** = §2.8 AC-7 行（表末）。

**②（🔵 · 引用一致性）§2.6 四坐标按现盘收正**：`:253` ⇒ `:254`（KD-74 行）· `:255` ⇒ `:256`（§1.6 注行）· `:551` ⇒ `:552`（变更记录）· `RENDERER.md:335` ⇒ `:336`（§5.1 store.mjs 行）。**落点** = §2.6 设计档行 ∥ 行数账行动。
- **偏移因由**（as-of 判断）= 首版 `:157-158` 折行（行宽收正 · 净 +1 行 · 零语义）后四坐标未回改——四坐标齐差 +1 与折行净增吻合。

**③（🔵 · 行数账）随动清单补第四行**：`ACTIVITY.md:141` events-wake 行（表 102 ⇒ 实读 104；实施后 ≈105）——三行 ⇒ **四行**齐平；§2.11-3 同拍。**落点** = §2.6 末段 ∥ §2.11-3。

**机检读数（本轮回笔复跑 · cwd = 仓根 · `node scripts/doc-check.mjs`）**：OK(锚) 悬空 0 · OK(行宽) 无 >300 字符单行（区带豁免在效）；行数面（报告态）含本批四行（`CHAT.md:137` ∥ `CHAT.md:142` ∥ `RENDERER.md:336` ∥ `ACTIVITY.md:141`）。
**read-back**：三项逐号在盘——§2.6 四坐标终值（`:254` ∥ `:256` ∥ `:552` ∥ `RENDERER.md:336`）∥ §2.8 AC-7 行 ∥ §2.6 + §2.11 四行清单（本块落笔后实读复核）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**发现表（设计评审轮 · 目标 = 批档 §2 + `RENDERER.md` + `ACTIVITY.md`）**

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 验收面 | 🟡 | AC 表（批档 §2.8）仅载机检腿（批内件六腿 ∥ 旧件基线 ∥ doc-check）；本批所改 = 用户报障的可见退场行为（`[data-timer]` 退场——AC-1），而判据面「挂载函数不进自动面（DOM 面随人工走查）」（`thincoder/docs/desktop/design/RENDERER.md:104`）；D16 义务在册：「凡改桌面可见面 ⇒ 验收须含一条真 Electron 使用面用例」（`thincoder/docs/desktop/design/ACTIVITY.md:46`）——AC 面 ∥ §2.7 测试面均未见真机腿（全档实读）。 | 补一条真机腿（到期 ⇒ 行在场 ⇒ 发送 ⇒ 行退场）或落「离线可产」判由 + 人工走查腿。 |
| 2 | 引用一致性 | 🔵 | 批档 §2.6 指 `RENDERER.md` 四处坐标各偏一行：KD-74 行现盘 `:254`（引 `:253`＝KD-63 行）∥ §1.6 注行现盘 `:256`（引 `:255`＝空行）∥ §5.1 store.mjs 行现盘 `:336`（引 `:335`＝view-state.mjs 行）∥ 本批变更记录现盘 `:552`（引 `:551`＝digest-accounting 行）；`ACTIVITY.md` 两处（`:116-117` ∥ `:475`）与现盘一致。 | 四坐标按现盘校正为 `:254` ∥ `:256` ∥ `:336` ∥ `:552`（疑为 `:157-158` 折行 +1 行后未回改）。 |
| 3 | 行数账 | 🔵 | `events-wake.mjs` 双源不一：批档 §2.6 现行 = 104（`:121`）vs `thincoder/docs/desktop/design/ACTIVITY.md:141` 表载 102（波 2a 届盘实读）；该行未入「行数账随动」回填清单（批档 `:128` ∥ `:170` 仅列 `CHAT.md` 两行 + `RENDERER.md` store 行）。 | 把 `ACTIVITY.md` §4.1 events-wake 行（表 102 ⇒ 实读 104，实施后约 105）补入行数账回填清单。 |

其它检查（无发现，登记）：文档落点 = 两份属主档原位（`RENDERER.md` §1.1 ∥ §1.6；`ACTIVITY.md` §3）——零新立设计档、两档间口径互洽（单源指针在册）；受影响文件行数注解齐（store.mjs 365 越 300 顾问线——拆分预案在册、本批 ≈+4 非结构性顺延；余三档 ≪300）；已披露读数漂移（341⇒365 ∥ 280⇒285 ∥ 106⇒108）已列回填轮。源件 ∥ 测试件不在评审面内——其坐标 ∥ 读数仅按档内证据转述（未核）。

计数：🔴 0 · 🟡 1 · 🔵 2。

VERDICT: pass

## §4 用户批准（主 agent）

**代签 · 2026-10-05**（自动跑授权在效 · 快车道）

- 评审轮 1 = **pass**（0🔴 · 1🟡 + 2🔵；父裁 = 三项全采纳）→ 修正轮 `#16` 落定（§2.12 · AC-7 = D16 回退式）→ **批准实施**（eng-coder 单舱；设计令牌持）。
- 实施面 = §2.2（扩员逐字 + 随动注五处）∥ §2.3（晚到判据）∥ §2.11-3 / §2.12③（行数账回填四行）；验收 = §2.8 AC-1–7（AC-7 真机半 = 父侧真跑闭合）。
- 旧件断代重锚（`2026-10-04-row-traces-clear-at-turn.test.mjs`）= **父侧直接执行通道**（§2.11-1）——实施舱落定后由父侧执行（避开在飞两舱的共享文件）。

## §5 实施记录（eng-coder）
**状态行**：实施完成 2026-10-05（两读 3 fail/3 pass → 6/6；门读数 exit 0；内部审计 1 轮 + 代码评审 1 轮 pass（0🔴——终态 clean））



### 5.1 交付摘要（写入面 → Δ）

| 文件 | 改动面 | 行数 |
|---|---|---|
| `thincoder-desktop/renderer/store.mjs` | `:74` 头注换文（两员 ⇒ 三员）∥ `:251-255` JSDoc 收正（timer 员并入 · ①–④ 重编 · 三痕 · 两族零触尾句）∥ `:256-271` `clearTurnTraces` 扩员（timerNotice 三键摘 + 闩置——逐字 = §2.2①） | 365 ⇒ **368**（Δ+3） |
| `thincoder-desktop/renderer/events-wake.mjs` | `:96-97` `onTimer` 注随动（清点两门 + 晚到句） | 104 ⇒ **105**（Δ+1） |
| `thincoder-desktop/renderer/page-read.mjs` | `:207-208` `clearTimerNotice` 注随动（本族清点 = 两门） | 285 ⇒ **286**（Δ+1） |
| `thincoder-desktop/renderer/views/chat-model.mjs` | `:80` compressOf 注（三员在册）∥ `:90-91` timerNoticeOf 注（清点两门） | 108（Δ0） |
| `docs/desktop/design/CHAT.md` | `:137` page-read 行（回填链 280 ⇒ 285 ⇒ 286）∥ `:142` chat-model 行（106 ⇒ 108） | — |
| `docs/desktop/design/RENDERER.md` | `:336` store 行（341 ⇒ 368——含设计轮收正 341 ⇒ 365 + 本舱 +3） | — |
| `docs/desktop/design/ACTIVITY.md` | `:141` events-wake 行（102 ⇒ 105） | — |

零触面（遵 §2.10）：`composer-wire.mjs` 出站点（`:90` ∥ `:165`）∥ 锚链 ∥ `onTimer` 写径 ∥ compress ∥ digest ∥ 形态/落位/词面/CSS ∥ VSC ∥ CLI ∥ 核包 ∥ 旧批件。

### 5.2 红绿两读（复跑：`cd thincoder && node --test docs/batches/2026-10-05-timer-notice-turn-gate.test.mjs`）

- **先红（实施前实跑）**：3 fail / 3 pass（T1 `:91` ∥ T2 `:113` ∥ T3 `:131` 红；S1–S3 绿）。
- **后绿（实施后实跑）**：`# pass 6 · # fail 0` ⇒ **6/6**。
- 旧件（父侧通道，本舱未触）：`2026-10-04-row-traces-clear-at-turn.test.mjs` = 6 pass / 1 fail（红 = T6——重锚前预期态；父侧重锚后 7/7）。

### 5.3 门读数

- `node --check` × 4 档 = exit 0。
- `node scripts/doc-check.mjs` = exit 0（OK(锚) 悬空 0 · OK(行宽) 绿）；行数面差异清单**不再含本批四行**（回填值 286 ∥ 108 ∥ 368 ∥ 105 与实读全等）。

### 5.4 决策透明表

| 项 | 判读 | 依据 |
|---|---|---|
| store.mjs 头注「新增」二字去留 | 去——定稿「首屏门保留 + 回合起跑门」 | §2.2⑤-1 ⇒ 侧逐字文本（门已非新增，留「新增」失真） |
| chat-model `:89-91` 替换跨面判读 | 以 ⇒ 侧新句为界整体替换原「`[data-timer]` 族同在册…单门」段（消重不消义） | 设计旧引号首尾含省略号——取唯一可成读：新句逐字 ∧ 无重句 |
| 注文折叠 | events-wake / page-read 各折 2 行（+1）∥ chat-model 三行（Δ0）∥ store JSDoc 五行（Δ0） | 与邻行宽一致；增量落 §2.6 预估带 |
| 增量差（预估 ≈+4 vs 实际 +3） | 如实报实际值，不追补 | §2.6「预期增量」非实施边界 |

### 5.5 审计与代码评审轮次与终态

- **内部 explore 分歧审计 ×1**：代码/逐字面零分歧；分歧 1（轻）= `RENDERER.md:254` KD-74 ① 坐标随本批 +1 行漂移（`page-read.mjs:264-277` ⇒ 现盘 `:265-278`）——设计档笔权，转父侧收正。
- **self-fix 轮**：0（无代码面分歧）。
- **advisor 代码评审 ×1**：**pass**（0🔴 · 3🟡 + 4🔵；🟡 = store 行数存量在册不复议 ∥ 旧件 T6 待父侧重锚 ∥ 本条 §5 补落；🔵 = `RENDERER.md:254` 坐标 ∥ 旧件 204/205 数字 ∥ 批内件 T2 实钟等待（建议 `setImmediate`——未改）∥ `store.mjs:15` & `chat-model.mjs:101` 两注口径完整度（设计清单外——零动））。
- **终态**：**clean（converged）**。

### 5.6 披露

- 旧件 T6 现红（6/7）＝设计预期（§2.4 断代重锚 × 父侧通道）；收口前须父侧执行重锚。
- 批档 §2.4「204 ⇒ 205」与现盘差 1（旧件现值 205 行 ⇒ 重锚后 206）——父侧执行以现盘读数为准。
- `designId` 字面值本舱未收到（spawn 未携）——设计授权 = 批档 §2 + §2.12 修正轮 `#16`（评审轮 1 pass）。

## §6 验证与收口（父代理）

**2026-10-05 22:4x · 收口**

**① 交付验证**：实施（`#17`）四码档 + 三档行数账 + 父侧重锚笔——**父侧亲跑**：旧件断代重锚后 **7/7**（`docs/batches/2026-10-04-row-traces-clear-at-turn.test.mjs`——T6 翻转型绿）∥ 本批件 **6/6**（先红 3/3 见 `#17` 面）∥ 合跑 **13/13** exit 0 ∥ `doc-check` **exit 0**。

| 面 | 终值 | 核验读数 |
|---|---|---|
| 产品码 | `clearTurnTraces` 三键扩员（`store.mjs` 365 → **368**）∥ `events-wake` 104 → **105** ∥ `page-read` 285 → **286** ∥ `chat-model` 108（±0） | 父侧亲跑 6/6 + 7/7 ✓ |
| 旧件重锚 | `2026-10-04-row-traces-clear-at-turn.test.mjs` 205 → **206**（四处逐字 = §2.4；**父侧直接执行 · D-BR23 通道 · 可 revert**） | **7/7** 复跑绿 ✓ |
| 行数账 | 四行回填齐（286 / 108 / 368 / 105——doc-check 行数面差异清单消） | `#17` 面实读 ✓ |
| 机械收正 | `RENDERER.md:254` KD-74 ① 坐标 `:264-277` ⇒ **`:265-278`**（本批 +1 行随漂）∥ 本档 §2.4「204 ⇒ 205」⇒「**205 ⇒ 206**」 | 父侧直接执行 · 可 revert ✓ |

**② 集成场景**：机检半已绿（T1–T3 ∥ S1–S3）；**真机走查腿（AC-7）= 候走**（到期 ⇒ 行在场 ⇒ 发送 ⇒ 行退场——随用户下一次实操自然闭合，D16 通道；机检半 + 判由在册）。
**③ 仓套件读数**：三端跑器空清单绿灯 ×3（父侧亲跑 exit 0——本波统一读数）。
**④ 收口清单核验**：角色表六段齐 ✓ ∥ 状态行 = 已收口（close 落）∥ 计数（四桌面码档 + 批内件 + 旧件重锚 + 三设计档行数账 + 两机械收正）∥ 指针（§2.2 ∥ KD-74 扩员 ∥ §2.12）✓ ∥ 变更记录（RENDERER ∥ ACTIVITY 各自）✓ ∥ 待办勾销 = `#952` ∥ 前批遗留跨核 = 无 ∥ 台账面 = 核销行。
**⑤ 暂缓批复核**：无（残余各自在册：`store.mjs:15` ∥ `chat-model.mjs:101` 两注口径收全 = 候选小笔；T2 实钟 5ms = 非阻）。
**⑥ 债务与备忘**：① 两注口径收全（上游注释面）+ T2 实钟等待 = 候选小笔（非阻）；② `compress` = 观察项（不入本批——用户 21:58 口径）；③ AC-7 真机半 = 候走（见 ②）。
**⑦ 收口判定**：验收全符（7/7 ∥ 6/6 ∥ 门全绿）⇒ 本批**收口**（记录冻结）。
