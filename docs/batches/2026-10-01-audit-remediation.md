# 2026-10-01 · 复核扫面收正（M1–M22 处置）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-01 · 来源 = 用户 2026-10-01 08:05 令 + 08:19「其他的都处理吧」（台账 #769）。
> 台账 = #769（desktop · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-01
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**本批性质**：复核扫面处置批——用户 2026-10-01 08:05 令（「看看自己的代码，还有那些类似的稀奇古怪的『机制』，我们都复核一下。」）+ 08:19 授权（「其他的都处理吧」）。

**授权与范围**
- 处置范围 = 三路只读扫面合并候选表 **M1–M22** 全部可动条目（甲 5 · 乙 6 · 丙 10 · 丁 1）；**戊 2 条（S2-C4=#711① ∥ S2-C5=#563）已在册收口，零新动作**。
- 处置去向 = 修 ∥ 删 ∥ 简化 ∥ 查证后定 ∥ 记账（零码面只记账、不进实施）。
- 候选表全文 = `.thincoder/tmp/audit-2026-10-01.md`（file:line 逐条在盘）；台账 #769。

**方法（走到哪一步）**
1. 三路只读扫面 ✓（23 原始 → 22 合并）；2. 核实轮 V1–V3 在跑（M2/M4/M5/M10 查证件 + M12–M21 丙族逐条核「事实 / 单源 / 判决 + 一行修法」）；3. 处置表 v2（V 到齐收正，入本 §1 续笔）→ 设计轮派发 → 用户点火评审 → 实施。

**关键判据（复核纪律）**
- 命名纪律：缺陷只准缺陷命名——不得以「机制/语义/设计」为缺陷之名；只有「有设计单源 + 判据 + 明确用户价值」的活件才判「正当保留」。
- 处置判据：无单源（仅代码注自陈）或用户价值空 ⇒ 残件删 ∥ 过度宜简化；用户可见缺陷优先。
- 设计先于码：本批全部条目经设计轮落「修法表 + 落点」后再动码（工程模式零裁量——含删除类）。

**待续**：V1–V3 判決（约 08:2x 到）→ 处置表 v2 续笔本 §1。

**处置表 v2（终版 · V1–V3 判毕 · 2026-10-01 08:2x）**

**一、进修复批（产品码动作 · 设计轮定形）**
- **M1** 提问卡双退场权（修：退场权收单源；真机腿）∥ **M2** 草稿三套并行（修：成功径同清专件 `draft:null` + #671 复位点表同拍）∥ **M3** 位标双键源（修：条目携起源键、清位按起源键）∥ **M4** 池头整节点换代（修：逐件就地差分、补挂退化幂等；真机腿）∥ **M6** 撤回臂不可达（删；设计轮先复核可达性）∥ **M7** projectInfo 零消费（删；调用链+切片+STATUS_KEYS+D10 行同拍）∥ **M10** 记录腿不查墓碑（修：`emitDigestEnd` 先判 `revokedTurn`；设计句收正）∥ **M11** frozen 穿闸双份无 finally（修：`withThawedSubMeta` 单源 helper）∥ **M12** 卡面双径重挂（修：帧内一次性门；KD-48② 复归全真）∥ **M16** 键零命中直写（修：返回 `null`、结构路径留焦点链；真机腿）。

**二、文档收正簇（零码面）**：M22 四清⇒五清 ∥ M19 补 UI.md goal 行 + `goal.mjs:2` 悬空引用 ∥ M20 卡三类⇒四类 ∥ `RENDERER.md:97` 表述收窄 ∥ M18 半句 ∥ M21 核侧导出判据 or 披露句（二择）。

**三、撤单（核实判正当 · 零动作）**：M5 ∥ M13 ∥ M14 ∥ M15 ∥ M17。

**四、记账（本轮不动）**：M8 ∥ M9；携评项 = `chat-text-segments.mjs:493` 第三写点（供设计轮评估）。

**五、核实纠偏在册**：V1×5 ∥ V2×4 ∥ V3×3。

**冻结注**：桌面设计四档 + 桌面需求档正处 #768 评审冷冻窗——簇二内涉该档之句 = 设计轮出「待落清单」，解冻后由父侧小轮落地。**全表** = `.thincoder/tmp/audit-2026-10-01.md`（M1–M22 逐条 + V1–V3 判决全文）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（修复轮 1 已落——发现 1–7 逐号（2026-10-01））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**编制**：eng-designer · 2026-10-01 · 轮次 = initial（修复设计）· 依据 = §1 处置表 v2 + 全表 `.thincoder/tmp/audit-2026-10-01.md`（M1–M22 + V1–V3 判决）。

**本批条目（覆盖）**
- 修/删（10 · 产品码动作）：M1 ∥ M2 ∥ M3 ∥ M4 ∥ M6（删）∥ M7（删）∥ M10 ∥ M11 ∥ M12 ∥ M16。
- 文档收正簇（6 处 · 零码面）：M22 ∥ M19 ∥ M20 ∥ `RENDERER.md:97` ∥ M18 ∥ M21（二择 = 披露句——决策 D6）。
- 携评项（1）：`chat-text-segments.mjs:493` 第三写点评估（见「携评项」段）。
- 撤单（5 · 零动作）：M5 ∥ M13 ∥ M14 ∥ M15 ∥ M17。
- 记账（2 · 本轮不动）：M8 ∥ M9。

**修法表（条目 → 修法 → 落点 file:line → 期望行为 → 机检腿）**

**M1 · 提问卡双退场权 → 退场权收单源（切片驱动退场）**
- 修法：① 核卡 `answer()` 删 `el.remove()`——卡不自摘（自摘 = 乐观退场，与端「零乐观摘除」已判口径相抵）；② 端 `attachCards` 失败臂删 `paintCards()` 重挂（核不自摘 ⇒ 卡恒在场可重试，重挂臂成死路）；③ 两处注面同拍。
- 落点：`thincoder-render-core/cards/question.mjs:29-35`（删 `:30` `el.remove()` + 档注「卡自移除」句收正）· `thincoder-desktop/renderer/mount-cards.mjs:151-155`（`onAnswer` 收敛为 `void submitAnswer({ store, host }, promptId, answer)`——失败径零 DOM 写）+ `:56-57` ∥ `:10-13` 注收正。
- 期望行为：点击 ⇒ 卡留场至回执 `ok` ⇒ `clearQuestion` 清切片 ⇒ 帧挂载摘卡（恰一次）；失败 ⇒ 零 DOM 写（作答框 ∥ 键入 ∥ 焦点零扰动）；零新节点 ∥ 零复现。
- 机检腿：M1a 假 DOM 点击选项后卡节点仍在文档（核不自摘）；M1b 回执非 ok ⇒ 零重挂（零 `mountCards` 调 ∥ 节点换代零发生）；M1c 回执 ok ⇒ `clearQuestion` ⇒ 下帧挂载摘卡恰一次。
- 真机腿：见「真机腿」段。

**M2 · 草稿专件不自清 → 成功径同清 + #671 复位点表补记**
- 修法：`submitChannel` 成功径复位写扩 `providers.draft: null`（专件清——现径只清 `verify`，`providers.draft` 存留 ⇒ 重挂经种子回填旧值含钥）；#671 复位点表补「提交成功径」第五点（载体 = 收口批档 §2.2.3 ⇒ 冻结零回改 ⇒ 转写 = 现役注面 + 本批在册）。
- 落点：`renderer/mount-settings-exits.mjs:78-80`（`:80` `setSettings({ verify: null })` ⇒ 并拍 `providers: { ...held, draft: null }` + 注）· `renderer/mount-settings-segments-providers.mjs:10-12` 注（复位点句按第五点收正）。
- 期望行为：拉取模型 → 改值 → 提交成功 ⇒ `providers.draft === null` ⇒ 重挂后表单零旧值回填（含钥）；未拉取径 ⇒ 两态一致（皆零回填）；失败径 ⇒ 零清（草稿保真）。
- 机检腿：M2a 假 DOM 表单 + 假 `ask` ⇒ 成功径后 `draft === null` ∧ `verify === null`；M2b 失败径 ⇒ `draft` 保持；M2c 负控（`2026-09-30-desktop-residuals.test.mjs` M-671 族复跑——若复位点全集被断言 ⇒ 随修加第五点）。

**M3 · 待审批位标双键源 → 条目携起源键、清位按起源键**
- 修法：① `onApproval` 归约内给条目补写起源键（`item.key = ev.key ?? null`——内部簿记，载荷白名单 `APPROVAL_KEYS` 零改 ∥ 消费面读取集零扩）；② `clearApproval` 改判：查被摘条目 ⇒ 剩余条目中该起源键已无项 ⇒ **按起源键清位**（有项才亮）；现「列表清空 ⇒ 清 `activeSession` 位」句删除。
- 落点：`renderer/events.mjs:103-112`（`:110` 区补 `item.key` + `:102` 注收正）· `renderer/events.mjs:257-265`（`:263` 清位改按 `hit.key`；`:255` 注「不同源·缺口」句收正）。
- 期望行为：A 会话条目在 B 会话（活动）应答 ⇒ 清 **A** 位标（非 B）；多键并存 ⇒ 各键按自身剩余项亮灭；零残留 ∥ 零误清。
- 机检腿：M3a 置位按事件键 ∧ 条目携键；M3b 跨会话清位按起源键（B 位零动）；M3c 多键逐清（A 清尽 ⇒ A 位灭、B 位在）；M3d 重复回执幂等（原引用零写）。

**M4 · 池头整节点换代 → 逐件就地差分 + 补挂退化幂等**
- 修法：① `adoptPool` 头分支：`head.replaceWith(build(headNode(...)))` ⇒ `syncHead` 就地差分——按 `[data-read]`/标题/折叠控件逐件匹配（就地更新文本 ∥ `aria-*`；等值零写；缺件按件位补插；**表外件（`.activity-new-btn` 计数钮）零触 ⇒ 身份存续**）；② `syncActivityNew` 补挂臂保留为幂等兜底（钮在场 ⇒ 零动作——不再有「换代毁钮 ⇒ 补挂」补偿径）。
- 落点：`renderer/views/activity.mjs:90-91`（头分支改调 `syncHead`——helper 住本档 ≈+15 行；件面构造仍经 `headNode` 描述符）· `renderer/views/activity-new.mjs:73-90` 注（补挂 = 幂等零动作语义）。
- 期望行为：帧间头节点对象存续；↓N 钮跨帧同一元素（零换代 ∥ 零补挂动作）；读数 ∥ 折叠态就地随动（零整头建树）。
- 机检腿：M4a 假 DOM 两帧 `adoptPool` ⇒ 头元素 ∥ 预置 `.activity-new-btn` 同引用；M4b 读数值变 ⇒ 就地换文（零新节点）；M4c 读数 `null` ⇒ 摘该读数节点；M4d 负控（表外件不因差分被摘）。
- 真机腿：见「真机腿」段。

**M6 · 撤回臂不可达 → 删（连带载体 ∥ 注入面 ∥ 批内件锁点）**
- 设计轮复核（可达性 · 复核结论 = 不可达成立）：`capQueued` 登记只生于 `interrupt` 入口预检（`capPending` 在场 = cap 待答窗）；该窗内 kernel `run` 已 rejected（`ContinueError` 已抛、流停在 `await consentOf`）⇒ abort 只能命中「询问按取消结算」径（`onCapCancelled` 消费后收口），而**撤回臂（唯一消费点）要求 run 在飞 ∧ `signal.reason` 携 `interrupt`+`message`** ⇒ 两窗互斥 ⇒ 恒不达；`capQueued` 唯读方 = 撤回臂（读侧零第二消费）⇒ 载体随删。
- 修法（删）：① `src/main/turn-driver.mjs`：`capQueued` 表 `:96-98` ∥ `withdrawCapEntry` `:119-127` ∥ 注入 `:139` ∥ 三处清点 `:116`（`onCapCancelled`）∥ `:222`（`dispose`）∥ `:242`（`abortSuspensions`）∥ 注 `:21`/`:170`/`:172`；② `src/main/turn-face.mjs`：参数注 `:58` ∥ 形参 `:61` ∥ 消费块 `:129-131` ∥ 档头句 `:32-33`；③ `src/main/turn-input.mjs`：形参 `:16` ∥ 登记块 `:108-111`（`queued.add` **保留**，仅删 `capQueued.set` 行与注）∥ 注 `:8-9`；④ `src/main/queued-input.mjs`：`remove(key, entry)` `:76-86` + 档头句 `:17`——**零第二调用点**（唯一消费 = 撤回臂，实施舱 grep 复核）；⑤ 批内件 `docs/batches/2026-09-29-desktop-carryover-c3.test.mjs`：锁点 `:25`/`:27`/`:227`/`:240`/`:242` 及 ④ 块 `:244-256` 删（`:239` queue-full 单点断言保留）。
- 期望行为：cap 待答 ∧ 携文 ⇒ 入队 + 回执（满 ⇒ `queue-full` 零中止）**行为零变**；全仓 `capQueued|withdrawCapEntry|撤回臂` 零残留。
- 机检腿：M6a 源面零残留（src + c3 批内件 grep 断言）；M6b 行为保真（c3 批内件随动后复跑绿：入队 ∥ 回执第三 reason ∥ 其余腿）；M6c `queued.remove` 零调用点（源面）。
- ※ 文档面连带（冻结待落）：见「连带文档面」段。

**M7 · projectInfo 零消费 → 删（调用链 + 切片 + STATUS_KEYS + D10 行同拍）**
- 修法（删 · 全链）：① `renderer/mount-info.mjs` 整档删（建删——归档件零留）；② `renderer/mount-settings.mjs`：装配 `:118` ∥ 向导注入 `:151` ∥ 初读 `:163` ∥ 返回面 `:181` ∥ 注 `:13`/`:46-47`；③ `renderer/mount-onboarding.mjs`：deps 位 `:33` ∥ 步 3 调用 `:45` ∥ 注 `:30`；④ `renderer/app.mjs`：`openDir` 链 `:96` + 注 `:59-60`/`:88-90`；⑤ `renderer/mount-status.mjs`：`STATUS_KEYS` 去 `"projectInfo"` `:22`；⑥ `renderer/store.mjs`：初值切片 `:128` + 注 `:9`；⑦ `renderer/views/statusline.mjs`：形参 ∥ 透传 `:57` 注/`:60`/`:193`（段 11 已改锚 `ev:ledger` `marker`——该透传零消费面）。
- 期望行为：生产码 `projectInfo|refreshInfo|createInfoFace` 零命中；开项目成功链 = `refreshRail` 后零第二调用；`STATUS_KEYS` 无该键（帧分派零空转键）。
- 机检腿：M7a 源面零残留（生产码 grep；排除历史/冻结档）；M7b 假 host 开项目 ⇒ 调用面 = `refreshRail`（零 `refreshInfo` 调用）；M7c `STATUS_KEYS` 闭集断言（无 `projectInfo`）；M7d D10 行 = 父侧笔（建议句在「上抛」段）。
- ※ 文档面连带（冻结待落 + 非冻结档）：见「连带文档面」段。

**M10 · 记录腿不查墓碑 → `emitDigestEnd` 先判 `revokedTurn`**
- 修法：`emitDigestEnd` 顶部增墓碑查位——`revokedTurn(key, agent)` 真 ⇒ 零帧零记录（`endEmitted` 不置）；非真 ⇒ 原序（恰一次守卫 ∥ `ms` 单算式零改）。注 `:166-168` 收正（现句「不查回合墓碑…由 `settleTurn` 门守」⇒「**查**——记录腿不经 `settleTurn` 门（`end` 先于结算落盘）⇒ 自带门」）；设计句转写 = `PROJECT.md` §2.2 墓碑段三查位 ⇒ 四查位（见「连带文档面」段；出处 = 批档 `2026-09-30-digest-persistence.md:339` 决策表④——该档已收口 ⇒ 冻结零回改）。
- 落点：`src/main/turn-face.mjs:170-176`（查位 + 注）∥ `:179`/`:184` 调用点零改。
- 期望行为：已撤销 ∥ 已删会话（`dispose` ∥ 切项目级联）⇒ 边界轮 `end` 零 `ev:digest` 帧 ∥ 零 `appendRecord`（已删 `.d/` 不再经 `mkdirSync` 重建 ∥ 零追加行）；活会话 ⇒ 恰一次 `end`（帧 ∥ 记录同值）零变。
- 机检腿：M10a `revokedTurn` 恒真（turnGate 替身）⇒ 零帧 ∧ `appendRecord` 零调用；M10b 非真 ⇒ 边界轮恰一次 `end`（成功 ∥ 失败两径 ∥ 帧记录同值）；M10c 非边界轮 ∥ timer 轮双负控（零帧零记录零变）。

**M11 · frozen 穿闸双份无 finally → `withThawedSubMeta` 单源 helper**
- 修法：抽单源 helper `withThawedSubMeta(element, meta, run)`——`meta?.frozen === true` ⇒ 临时换 `{ ...meta, frozen: false }`，`try { return run() } finally { element._subMeta = meta }`（还原万全：正常 ∥ 异常两径）；两处改消费；落点 = **端侧视图面共享**（不扩核件面——决策 D7）。
- 落点：`renderer/views/chat-subagent.mjs:51-62`（`echoOf` 三行组 ⇒ helper 调用；helper 定义住本档导出 ≈+6 行）· `renderer/views/pool-subagents.mjs:37-49`（`replayRows` 同改消费——单向引 `chat-subagent.mjs`，无环 ∥ 若实施舱实读发现环 ⇒ 落 `pool-subagents.mjs` 反向引，同判据）。
- 期望行为：`renderSubagentChunk` 抛 ⇒ `_subMeta` 还原原值（两站——现异常径留未冻态）；正常径与现形逐值同（`_rowsDone` 语义零改）；单实现（两处零副本）。
- 机检腿：M11a 抛 ⇒ `frozen` 还原（两站各一臂）；M11b 正常径零行为变（既有批内件复跑绿）；M11c 单源（两档同引面断言）。

**M12 · 卡面双径重挂 → 帧内一次性门**
- 修法：① `app.mjs` 增帧作用域门 `cardsDrawn`——`applyFrame` 起帧复位 `false`；② `paintCardsOnce(state)`（真 ⇒ 早退；假 ⇒ 置真 + `paintCards(state)`）；③ `paintChat` 两处内联调用（`:174` 构造径 ∥ `:176` 结算径——先于结算的次序 = 设计，保留）改 `paintCardsOnce`；④ `faces.cards = paintCardsOnce`（`:282`）；⑤ 帧外直呼径 `onCardRefresh`（`:167`）调用前置门复位（语义 = 独立一次卡面重挂——保原行为）。
- 落点：`renderer/app.mjs:167`/`:174`/`:176`/`:282-293`（净 +≈8 行——该档现读 ≈300 顶格 ⇒ 越 300 顾问线在册，拆预案见「受影响文件」段）。
- 期望行为：chat ∧ cards 同帧 ⇒ 卡面恰一次（**KD-48②「每面每帧至多一次」复归字面全真**）；仅 cards 键 ⇒ 恰一次；卡树构建减半；先于结算的次序零变。
- 机检腿：M12a 源面（门在位 ∥ `applyFrame` 复位 ∥ 两内联点与 `faces.cards` 皆用 wrapper）；M12b `onCardRefresh` 径前置复位（源面）；M12c 既有帧分派 ∥ 卡面批内件复跑绿（零回归）。

**M16 · 键零命中直写 → 返回 `null`、结构路径留焦点链**
- 修法：① `resolveTarget` 删结构路径兜底（`:127-132`）——键零命中 ⇒ `null`（残件，零域外写）；② 头注 `:12-14` ∥ `resolveTarget` 注 `:124` ∥ `draftLoc` 注 `:173-179` 收正（「键零命中 ⇒ 结构路径兜底 ∥ 复填走结构路径」句删——键缺席 ⇒ 不复填）；③ 焦点链末环结构路径兜底**保留**（`restoreFocus` `:251` 零改——「结构路径只留给焦点链末环」）。
- 落点：`renderer/view-state.mjs:124-133` ∥ `:173-179` ∥ `:12-14`。
- 期望行为：键零命中 ⇒ 零写（值不灌邻件——MCP 切型异构键串值不再入 `command/args`）+ 入残件；同键多例 ∥ 位序不达 ⇒ 键集内结构就近消歧（零改）；作用域不符 ⇒ 零取（零改）；焦点复填末环兜底零改。
- 机检腿：M16a 换位异构键 ⇒ 零写 + 残件返；M16b 同键换位 ⇒ 键命中落原件；M16c 焦点末环 `byPath` 兜底仍在（键零命中亦可置焦）；M16d 作用域不符零取（锁）。
- 真机腿：见下行段。

**真机腿（3 条 · 复现法在册）**
- **M1**：慢回执窗复现（修前）：提问卡在场 → 键入短文本 → 作答 ⇒ 卡点击即消失（核自摘 = 乐观）；回执跨帧 ∥ 失败 ⇒ 卡以**新节点**复现（作答框空 ∥ 键入丢 ∥ 置焦）；加剧形 = 会话中止窗内作答（回执拒收）。修后读数：点击 ⇒ 卡留场至 `ok` 帧 ⇒ 恰一次退场；键入 ∥ 焦点零扰动；零复现。
- **M4**：活流 + 未跟底 ⇒ 按住 ↓N 钮 ~1s 松开 ⇒ 观回底（钮零换代 ∥ click 送达）；或脚本 mousedown → 触发帧 → mouseup 读 click 送达。
- **M16**：设置面 MCP 段 ⇒ 增 ∥ 编辑服务器切型 http ↔ stdio（同组同位异构键）⇒ 观 `command/args` 零出现 url/token/headers 值（值不灌别件）；对照 = 修前 url/token 值入 `command/args`。

**携评项 · `chat-text-segments.mjs:493` 第三写点评估（一句话结论 + 依据）**
结论：**正当（已单源在册——非未归并第三写点）**，零动作。依据：`docs/desktop/design/RENDERER.md:197-199`（§3「巨块段窗滚动作」条 = 帧尾第 ⑦ 步独立补偿 ∥ 「单权源 `overflow-anchor: none` 不动」句 ∥ :199 边界句点名「…帧尾三写 ＋ **巨块段窗滚动作**〔2026-09-30 增〕」）· `renderer/views/chat-text-segments.mjs:444-497`（先读后卸 ∥ 跟滚零读 ∥ 与 [t0,t1] 区间互不叠算）；「与 §3 写口归并声明未见同拍」不成立（:199 即该归并点名句）。

**关键决策记录（含被否备选）**
- D1 M1 退场权单源 = **切片驱动**（核不自摘 + 端零重挂）。被否：核自摘保留 + 端失败径免重挂（自摘 = 乐观退场——与已判「零乐观摘除」口径相抵）。
- D2 M2 复位点扩充 = 成功径清专件。被否：专件不动仅靠 view-state 失效集（旧值含钥经种子复活 = 缺陷本体未消）。
- D3 M6 删面 = 臂 + 载体（`capQueued`）+ 原语（`queued.remove`）+ 锁点全删。被否：仅删臂留载体/原语（零读者残件——违本批残件处置）。
- D4 M7 删面 = 全链 + 切片 + 状态行透传 + 注。被否：仅删装配留切片（「退役只停在注释」本体未消）。
- D5 M12 门住 `app.mjs`（帧作用域）+ 直呼径显式复位。被否：门住 `mount-cards.mjs`（该档不知帧界）；去内联卡面调用（先于结算之次序 = 设计）。
- D6 M21 二择 = **披露句**（`RENDERER.md` 段窗条补披露）。被否：核侧导出判据（`hotSetOf`/`isHot`）+ 端改消费——本次取零码面 ∥ 核边界面不动；日后核边界纪律升级可另立小项（非本批）。
- D7 M11 helper 落点 = 端侧视图面（`chat-subagent.mjs` 导出、`pool-subagents.mjs` 单向引）。被否：核件面增导出（本次核件面已因 M1 收窄，不另扩）。
- D8 M16 = 结构路径兜底全删（草稿 ∥ 滚位两消费面同函数）。被否：仅草稿面删（同函数分叉 = 第二判据）。

**簇二收正句定稿（6 处）**
标记：□ = 冻结待落（桌面设计四档 PROJECT ∥ RENDERER ∥ UI ∥ IPC + 需求档正处 #768 评审冷冻窗——本批零写；解冻后父侧小轮落地）；■ = 注释面句处置（代码面 · 随修复批实施舱——先例 = digest-parity 批 F7 句处置）。

1. **M22 四清 ⇒ 五清**
   □ `docs/desktop/design/PROJECT.md:125`：句「四清家族 = `stopMark` ∥ `timerNotice` ∥ `compress` ∥ `digest`」⇒「**五清家族** = `stopMark` ∥ `timerNotice` ∥ `compress` ∥ `digest` ∥ `helpLines`」（余句零改；`PROJECT.md:1159` ∥ `RENDERER.md:89` 已五清——零动作）。
   ■ 注释面四处：`renderer/events.mjs:38`「随首屏页读四清」⇒「随首屏页读五清」∥ `renderer/page-read.mjs:23`「运行期痕**四清**之四」⇒「**五清**之四」∥ `renderer/views/chat-digest-rows.mjs:15`「运行期痕四清之四」⇒「五清之四」∥ 同档 `:209` 同。（`:192-194` 已五清——零动作。）

2. **M19 补 UI.md 目标面板行 + `goal.mjs:2` 悬空引用**
   □ `docs/desktop/design/UI.md` §1 表增行「**目标面板**」（插位 = 「计划面」行邻后）——定稿句：
   「| 目标面板 | 流内卡片（R5 · `goal` 切片——写者 = 归约面 `ev:goal`）；**核件直消费**（`renderGoalPanel`——端壳 = `thincoder-desktop/renderer/views/goal.mjs`：卡根 `div.goal-card[data-card="goal"]` = 端壳装饰，核体 = `DocumentFragment`）；**默认合**（`hidden`——#554②）；开合 = 状态行 🎯 徽标点按 ⇒ 本地开合翻转 + 就地施用活卡（`toggleGoalPanel`——零新通道 ∥ 零 store 切片 ∥ 零重挂）；🎯 徽标 = 状态行**非段位元素**（不入 `STATUS_SEGMENTS`）——在场判据 = 核 `goalPanelVisible` ∧ `status === "active"`（非载体 ∥ 他态 ⇒ 零节点——禁假造）；卡序 = 尾位（待审批 → 提问 → 计划 → 目标——单源 = `thincoder-desktop/renderer/mount-cards.mjs` `CARD_ORDER`）；**开合态 = 视图档模块级单值**（构树重挂换节点不丢态——不随会话键 ∥ 不入 store——在册口径）|」
   说明：`renderer/views/goal.mjs:2` 引用「UI.md §1 状态栏行 ∕ 目标面板行」随行落地**自解**——核外码零改。

3. **M20 卡三类 ⇒ 卡四类**
   □ `docs/desktop/design/RENDERER.md:79`：「卡三类 = `[data-card="approval"]` / `[data-card="question"]` / `[data-card="task"]`，卡间 DOM 次序固定 = 待审批 → 提问 → 计划（缺者跳过）」⇒「**卡四类** = `[data-card="approval"]` / `[data-card="question"]` / `[data-card="task"]` / `[data-card="goal"]`，卡间 DOM 次序固定 = 待审批 → 提问 → 计划 → **目标**（缺者跳过）」；同拍 `:87`「三卡皆**非块节点**」⇒「**四卡**皆**非块节点**」（同枚举漂移一句——随笔收正）。

4. **`RENDERER.md:97` 表述收窄**
   □ 句「③ **壳在位 ∧ `pool` ⇒ 原位领用**——头 ∕ 待审批族 ∥ 队列族 = **原位重建**（节点内零滚动件——重建零损失）」⇒ 收窄为「③ **壳在位 ∧ `pool` ⇒ 原位领用**——**头 = 逐件就地差分**（件面 = 标题 ∥ `[data-read]` 读数 ∥ 折叠控件——就地更新；旁挂计数钮 `.activity-new-btn` **身份存续**）；待审批族 ∥ 队列族 = **键控差分**（条目按 `promptId` ∥ 标题复用——#606③）」。

5. **M18 半句**
   □ `docs/desktop/design/RENDERER.md:19`：R13 句「会话开合 ∕ 换形态归 `thincoder-desktop/renderer/mount-sessions.mjs` 面内记账（活动会话单源 = `activeSession`）」⇒ 补半句「＋ **面内态变更 ⇒ 即时手动重挂（先于帧径数据刷——反馈不候帧）**」。

6. **M21 二择 = 披露句**（决策 D6）
   □ `docs/desktop/design/RENDERER.md` §2 巨块分段窗条（`:169-171`）补句：「换代件判据 = **核画件热区桶 `_liveMd.hot`**（端**只读**——核侧零公开读面；跨核边界读私有 = 在册披露）：热件不切（换代节点自然隔断）。」

**连带文档面（派生自 M6 ∥ M7 ∥ M10——冻结待落，随解冻小轮）**
- M6 派生：`PROJECT.md:95`（KD-52 ④ 句「非 cap 结算径撤回臂（按条目引用 · 幂等——防御）」**删**——对象已删，不留修订式痕迹）∥ `:188` ∥ `:863` ∥ `:866`（撤回臂描述成分收正 + 值列届盘实读对表）。
- M7 派生：`PROJECT.md:282`（mount-info 行 ⇒ 整行退场）∥ `UI.md:28`（项目级读数行 ⇒ 整行退场——功能面已删）∥ `IPC.md` §2 项目级读数族注（呈句收正 ∥ 退场——届盘实读）；非冻结档：`WEB-QUICKCHECK.md:76-81`（§3.2 表两行 + 装配链注——**非冻结** ⇒ 建议随修复批实施舱收正 ∥ 父侧小轮）∥ `API-CONTRACT.md:1776`（生成区——删除后重生成 `node scripts/api-contract.mjs --write`——父侧工程面）。
- M10 派生：`PROJECT.md:134-136`（§2.2 中止墓碑段）：**三查位 ⇒ 四查位**——新增「④ **边界轮 `end` 帧 ∥ 记录零写**（`emitDigestEnd` 墓碑查位——已撤销 ∥ 已删会话零帧零记录）」+ `:136`「三查位」计数同拍；坐标按符号（行号届盘实读）。出处 = 批档 `2026-09-30-digest-persistence.md:339` 决策表④（收口档零回改 ⇒ 转写）。

**上抛（父侧笔 ∥ 父侧裁）**
- U1 **D10 行建议句**（M7 同拍 · 需求档父侧笔）：现文「台账与批次面 | 台账行、批次状态可见（对齐另两端既有面）」⇒ 建议收窄为「台账与批次面 | **台账行**（`ev:ledger` 供给链）；**批次状态可见**——2026-10-01 复核：读数链（`batch:status` → `projectInfo`）零渲染消费随批复核退役 ⇒ 该子项收窄 ∥ 如需保留另行立设计项」。
- U2 **D28 行建议句**（M10 口径补齐 · 需求档父侧笔）：② 记录面句补限定半句「（已撤销 ∥ 已删会话除外——回合代次门，2026-10-01 复核批）」。靶点假设 = 记录腿墓碑门；若父侧所指为另项，请裁。
- U3 冻结待落清单（「簇二收正句定稿」全部 □ 项 + 「连带文档面」）落地窗 = 解冻后父侧小轮；本批零写核讫（PROJECT ∥ RENDERER ∥ UI ∥ IPC + 需求档均零触）。
- U4 M7 连带择径：`WEB-QUICKCHECK.md` 收正（随修复批 ∥ 父侧小轮）；`API-CONTRACT.md` 重生成窗。

**受影响文件（按面分组；行数 = 本席实读 2026-10-01，未读档标「届盘」；预期 = 实施舱届盘实读对表）**
- 面 A · 渲染器设置面：`renderer/mount-settings-exits.mjs` 239 ⇒ ≈241（M2）· `renderer/mount-settings-segments-providers.mjs` 148 ⇒ ≈150（M2 注）· `renderer/mount-info.mjs` 40 ⇒ **删**（M7）· `renderer/mount-settings.mjs` 185 ⇒ ≈179（M7）· `renderer/mount-onboarding.mjs` 届盘 ⇒ ≈−3（M7）· `renderer/mount-status.mjs` 44 ⇒ ≈43（M7）· `renderer/store.mjs` 届盘 ⇒ ≈−1（M7）· `renderer/views/statusline.mjs` 届盘 ⇒ ≈−1（M7）。
- 面 B · 渲染器池/卡面（含核件）：`renderer/mount-cards.mjs` 168 ⇒ ≈163（M1）· `thincoder-render-core/cards/question.mjs` 93 ⇒ ≈91（M1）· `renderer/events.mjs` 266 ⇒ ≈270（M3 + M22 注）· `renderer/views/activity.mjs` 195 ⇒ ≈208（M4）· `renderer/views/activity-new.mjs` 113 ⇒ ≈114（M4 注）· `renderer/views/chat-subagent.mjs` 102 ⇒ ≈104（M11 helper）· `renderer/views/pool-subagents.mjs` 133 ⇒ ≈128（M11）· `renderer/view-state.mjs` 300 ⇒ ≈294（M16）· `renderer/page-read.mjs` 届盘 ⇒ ±1（M22 注）· `renderer/views/chat-digest-rows.mjs` 届盘 ⇒ ±1（M22 注）。
- 面 C · 宿主面：`src/main/turn-face.mjs` 197 ⇒ ≈194（M6 −5 ∥ M10 +3）· `src/main/turn-driver.mjs` 253 ⇒ ≈241（M6）· `src/main/turn-input.mjs` 121 ⇒ ≈117（M6）· `src/main/queued-input.mjs` 91 ⇒ ≈79（M6）。
- 面 D · 帧门/装配：`renderer/app.mjs` ≈300 ⇒ ≈305（M12 +≈8 ∥ M7 −3；**越 300 顾问线 ⇒ 在册 + 拆预案**：帧门整段可出档 `renderer/frame-gate.mjs`——触发 = 该档下次结构性触碰；≤500 硬限不越）。
- 测试面：`docs/batches/2026-09-29-desktop-carryover-c3.test.mjs`（M6 锁点随动）；**新批内件** `docs/batches/2026-10-01-audit-remediation.test.mjs`（拟新增——M1–M16 机检腿 + M22 注面 + M6 负控）；复跑对表 = `docs/batches/2026-09-30-desktop-residuals.test.mjs`（M-671 族）。
- 文档面：见「簇二收正句定稿」+「连带文档面」——冻结档零实施（本轮）；非冻结档两条（U4）。

**拆派预案（实现 >15 文件 ⇒ 按面拆派——同文件不跨派）**
- 派 A（设置面）：`mount-settings-exits.mjs` ∥ `mount-settings-segments-providers.mjs` ∥ `mount-info.mjs`（删）∥ `mount-settings.mjs` ∥ `mount-onboarding.mjs` ∥ `mount-status.mjs` ∥ `store.mjs` ∥ `statusline.mjs`。
- 派 B（池/卡面）：`mount-cards.mjs` ∥ `render-core/cards/question.mjs` ∥ `events.mjs` ∥ `views/activity.mjs` ∥ `views/activity-new.mjs` ∥ `views/chat-subagent.mjs` ∥ `views/pool-subagents.mjs` ∥ `view-state.mjs`。
- 派 C（宿主面）：`turn-face.mjs` ∥ `turn-driver.mjs` ∥ `turn-input.mjs` ∥ `queued-input.mjs` ∥ `c3.test.mjs`。
- 派 D（帧门 + 句处置）：`app.mjs` ∥ `page-read.mjs` ∥ `views/chat-digest-rows.mjs`。
- 批内件：按派分段（单档多段），各派机检腿并拍复跑；四派无同文件交集。

**验收对照（逐条）**
1. 「10 条修法逐条可直接照做」→ 修法表逐条 = 落点 `file:line` + 期望行为 + 机检腿（M1–M16 十条齐）。
2. 「真机腿 3 条复现法在册」→ M1（慢回执窗 ∥ 会话中止窗加剧形）· M4（按住 ↓N 钮 ~1s ∥ 脚本 mousedown→帧→mouseup）· M16（MCP 切型串值检查）。
3. 「簇二 6 处收正句定稿（含冻结待落标记）」→ 六处齐（□/■ 标记在位）+ 连带文档面。
4. 「§2 读回核讫」→ 写入后读回（见 §5 实施前核读）。
5. 「零新词」→ 全文用词逐条源自 §1 处置表 / 全表 V 判决 / 既在册术语（「退场权收单源」「起源键」「逐件就地差分」「帧内一次性门」「withThawedSubMeta」皆判词原文）。

**边界（本批不做）**
- 不改撤单 5 条（M5 ∥ M13 ∥ M14 ∥ M15 ∥ M17）· 不动记账 2 条（M8 ∥ M9）· 不触冻结档（零写）· 不新增机制 ∥ 通道 ∥ 切片 ∥ 词键 · 核件面只收 M1 一处（不另扩）。

**读回核讫（回执 · 2026-10-01 · eng-designer）**：本节全部写入后已全文读回（3 批累计 ≈15.7k 字），与设计对象逐段一致。附注两条：① 上文「验收对照」第 4 条括注「见 §5 实施前核读」为误记——读回 = 设计轮动作，本回执即其证据（§5 = 实施记录，无关）；② 「受影响文件」行数值 = 设计席速读值，±1 级微差以实施舱届盘实读为终值（对表口径 = §1 既有约定）。

**§2 续 · 修复轮 1（评审发现 1–7 逐号处置 · 2026-10-01 · eng-designer）**

处置基准 = §3 轮次 1 发现 1–7 全表 + 父侧逐条受理口径。本块各条 = **终值语句**；本块与本节先行文不一致处（M1 修法 ∥ 拆预案触发句 ∥ M22 注面坐标 ∥ 批内件写序 ∥ 届盘行数值 ∥ c3 指令 ∥ 读回口径注）以本块为准——§2 追加制：先行文不改写，裁决住本块。行数口径 = `read` 工具总数（`split("\n")` 计法）；数值 = 本席实读 2026-10-01，±1 级口径差以实施舱届盘实读为终值。

**发现 1（🔴）· M1 退场权收单源——跨端定形：择 ㈡「端壳受理径移除」**

- 定形：核卡**零摘除**（单一行为——退场权全归端侧）∥ **VSC 端壳增退场径**（作答回调径摘卡）∥ 桌面 = 切片驱动退场（回执 `ok` 真 ⇒ `clearQuestion` ⇒ 帧挂载摘卡恰一次）。
- 被否：㈠「核卡去留协议化」（核件 deps 开关——默认保 VSC 原行为）——核件新增协议旋钮且核仍持退场分支（两行为面），与「退场权收端侧、核零摘除」单源相抵；两消费者（VSC ∥ 桌面）皆有明确端壳可挂 ⇒ 无需旋钮。**决策 D9 在册（见尾）**。
- 四处同拍 = ① 修法表（本条）∥ ② 落点（下行三面）∥ ③ 受影响文件表（后方追加段）∥ ④ 腿（后方）。
- 落点 · 核件：`thincoder-render-core/cards/question.mjs` **删 `:30` `el.remove()`**；函数注 `:10-12` 收正为「作答（选项 / 自由文本 / 取消）⇒ `emit("questionResponse", …)` + `deps.onAnswered(value)`；**卡去留 = 端侧**——核零摘除」。
- 落点 · 桌面端壳：M1 原修法照旧——`thincoder-desktop/renderer/mount-cards.mjs:151-155` 失败臂删 `paintCards()` 重挂（`onAnswer` 收敛 `void submitAnswer({ store, host }, promptId, answer)`）∥ `:10-13` ∥ `:56-57` 注收正；**补一处** `thincoder-desktop/renderer/views/question.mjs:6-8` 注收正（「核卡点按即摘 + 失败径挂载面重挂 ⇒ 卡复现可重试」⇒「核零摘除 ∥ 回执 `ok` 真 ⇒ 清切片 ⇒ 帧挂载摘卡；失败 ⇒ 零 DOM 写（卡恒在场可重试）」）。
- 落点 · VSC 面（发现 1 新增）：`thincoder-vscode/webview/question.js:19` `onAnswered` 收正为 `() => { el.remove(); ctx.inputEl.focus() }`（端壳作答径摘卡 + 回焦——选项 / 提交 / 取消三径同路；与核原自摘**同点同果**）；档头 `:2-6` 留端句 ∥ `:10-11` 函数注收正（「卡自移除」⇒「端壳作答径摘卡」）∥ `thincoder-vscode/webview/chat-messages.js:180` 注句「已随 questionResponse 自行移除」⇒「已随作答径端壳移除（`question.js`）」（句义同步；`questionCancelled` case 判据零变——host 取消径零回归）。
- VSC 零回归成立性：作答（含取消）⇒ 摘卡 + 回焦 ∥ 单帧 `questionResponse` 零变；`questionCancelled` ∥ 中止扫卡 ∥ `clearMessages` 三既有径零触 ⇒ D19 面零差。
- D19 对位：`docs/desktop/requirements/PROJECT.md:164`（D19「VSC 接核后行为零回归（全绿）」）——由「同点同果」机制句 + VSC 格腿承接（下行）。
- VSC 文档面实检（只读——`docs/vsc/**` 本轮零写）：全树无句涉卡退场径（命中二处 = attention chip 语境）⇒ **零待落**；VSC 侧合入项 = 上述两档代码注面（随实施批落）。
- 腿（④）：桌面对位腿 = M1a–c（既有三格零改）∥ **VSC 零回归腿 = 批内件 VSC 格（新增）**——桩法 = 先例 `docs/batches/2026-09-29-residuals-round2-vsc.test.mjs:94`（`globalThis.acquireVsCodeApi` 桩）+ `docs/batches/2026-09-30-crossline-clearance-vsc.test.mjs:60-65`（`registerHooks` `vscode` 短接）+ mini 假 DOM（扩件面最小集）；直取真 `thincoder-vscode/webview/question.js` + 真核卡（`thincoder-vscode/node_modules/@thincoder/render-core` 软链直通）⇒ 断言：① 点选项 ⇒ `postMessage` 帧 `{ type:"questionResponse", answer, promptId }` 恰一；② 卡离容器；③ `#input` 回焦；④ 取消径（`answer:null`）同①②③。
- 「VSC 零回归复跑」口径：VSC 存量单测面 = 空（`thincoder-vscode/test/files.mjs` = `[]`——2026-09-28 全清令）⇒ 复跑面 = 本批 VSC 格（唯一可跑面；实施舱届盘重跑该格即兑现）。

**发现 2（🟡）· 届盘 5 项 + c3 行数/差分（本席实读补标）**

- `thincoder-desktop/renderer/mount-onboarding.mjs` **91 ⇒ ≈90**（M7 −1：`:45` 调用行）∥ `thincoder-desktop/renderer/store.mjs` **333 ⇒ ≈332**（M7 −1：`:128` 切片行）∥ `thincoder-desktop/renderer/views/statusline.mjs` **207 ⇒ ≈206**（M7 −1：`:193` 透传行；评审席记 206——±1 口径差）∥ `thincoder-desktop/renderer/page-read.mjs` **238 ⇒ 238**（M22 注面同位换字）∥ `thincoder-desktop/renderer/views/chat-digest-rows.mjs` **≈234 ⇒ ≈234**（M22 两处注面 ±0；**在途活写**——本席两拍实读 233 → 234，届盘实读为终值）。
- c3 测试档 `docs/batches/2026-09-29-desktop-carryover-c3.test.mjs` **258 ⇒ ≈241**（M6 −17：锁点行 4 + ④ 块 13；全集见发现 7）。
- 越线档在册：**store.mjs 333 > 300 顾问线**——拆点 = 初态字面段（`initialState` `:75-130` ≈56 行）可出档 `renderer/store-initial.mjs`；触发 = 届盘实读 > 500（判据同发现 3）。

**发现 3（🟡）· app.mjs 拆预案：本批不随拆 + 触发句收正（不回环）**

- 本批不随拆理由：① 拆出区（帧门段 `:280-299`）即 M12 ∥ M7 本批改动区——修复收正与结构出档同区混批，回归定位面叠乘、回滚粒度变差；② M12 落点 ∥ 机检腿 ∥ faces 表已两轮定形——出档 = 落点全数重开，越本修复轮「定向修复」边界。
- 触发句收正：**触发 = 届盘实读 > 500**（项目判据 = `docs/core/design/ADVISOR-CONVERGENCE.md:274`「文件档 >300 主动审视 / >500 必须拆——封口语义，无豁免通道」；同处理先例 = `docs/batches/2026-09-25-hygiene-items.md:281`）。本批后 ≈305 ⇒ 未触；拆点 `renderer/frame-gate.mjs`（帧门段整段可出档）在册开放——任一后续批可择机执行。

**发现 4（🟡）· M22 注释面坐标收正（两处 + 一句删）**

- `thincoder-desktop/renderer/page-read.mjs`：`:23 ⇒ :25`；「已五清」句 = 同档 `:194`（该处零动作）。
- `thincoder-desktop/renderer/views/chat-digest-rows.mjs`：第一处 `:15`（原文对）；第二处 `:209 ⇒ :220`（**按符号定位**——`clearDigest` 函数注「首屏页读清点（运行期痕四清之四…」；本席实读现值 `:220`；该档在途活写 ⇒ 实施舱届盘按符号复核）。
- 「（`:192-194` 已五清——零动作）」句**删**（原括注跨档误置）。
- 收正后 M22 注释面全集（两档四处——皆修）：`thincoder-desktop/renderer/events.mjs:38` ∥ `thincoder-desktop/renderer/page-read.mjs:25` ∥ `thincoder-desktop/renderer/views/chat-digest-rows.mjs:15` ∥ 同档 `:220`（按符号）。

**发现 5（🟡）· 批内件写序 + 交集句限定**

- 批内件（单档多段）**写入时序 = 各派串行落段**：派序 A ⇒ B ⇒ C ⇒ D ⇒ **E**（E = 发现 1 新增）；禁并发 append；「并拍复跑」= 各派段定稿后段内自跑。
- 「无同文件交集」**限定为生产码面**（四 + E 派生产码零交集）；批内件 = 各派共享面——按上时序写入。

**发现 6（🔵）· 「对表口径」出处——改述为设计自定**

- 出处实检：§1 正文 ∥ 全表（`.thincoder/tmp/audit-2026-10-01.md`）均无该约定条款（`届盘|对表|微差` 零命中）⇒ 改述为**本设计自定口径**：「行数值 = 设计席实读（`read` 工具总数口径）；±1 级口径差以实施舱届盘实读为终值」。

**发现 7（🔵）· c3 指令收正（可执行全集）**

- `docs/batches/2026-09-29-desktop-carryover-c3.test.mjs`：`:24` ∥ `:225` 题头 ∕ 段条「撤回原语」收正；`:25` 整行删；`:27` 半句删（保留「归父侧探针闭合。」）；**`:227` = 改题（非删行）**——删「撤回原语：」与「· 撤回臂在位 · `queued.remove` 纯动作」两截语；`:238`「撤回臂」语收正；`:240` ∥ `:242` 删；`:241` `const driver` 清理（`:242` 删后零消费者）；④ 块 `:244-256` 删；`:49` `queuedMod` 导入清理（唯一使用 `:245` 已去）；`:239` queue-full 单点断言保留（零改）。

**受影响文件表（追加/收正——发现 1/2/7 同拍）**

- `thincoder-render-core/cards/question.mjs` **94 ⇒ ≈93**（M1：删自摘行 + 注收正）∥ `thincoder-desktop/renderer/views/question.mjs` **59 ⇒ ≈59**（M1 注收正 ±0）。
- `thincoder-vscode/webview/question.js` **26 ⇒ ≈26**（M1：`onAnswered` 行内改 + 注收正 ±0）∥ `thincoder-vscode/webview/chat-messages.js` **265 ⇒ ≈265**（M1 注句 ±0）。
- 五届盘项行数值 + c3 值 = 见发现 2（替换先行文「届盘」标注）。

**拆派预案（续——发现 1/5）**

- **派 E（VSC 面）**：`thincoder-vscode/webview/question.js` ∥ `thincoder-vscode/webview/chat-messages.js` ∥ 批内件 VSC 格——与派 A–D 生产码零交集。

**验收对照（续）**

- 6. 「VSC 零回归（D19 对位）」→ 机制句（VSC 端壳 `onAnswered` 摘卡——同点同果）+ VSC 格腿（发现 1）——`docs/desktop/requirements/PROJECT.md:164` 可对。
- 7. 「发现 1–7 逐条落点 + 读回值」→ 本块逐条。

**决策记录（续）**

- D9 · M1 跨端定形 = **㈡ 端壳受理径移除**（核零摘除 ∥ VSC 端壳作答径摘卡 ∥ 桌面切片驱动）；被否 = ㈠ 核卡去留协议化（见发现 1）。

**读回核讫（修复轮 1 · 2026-10-01 · eng-designer）**：修复轮 1 块（`:200-266`）写入后全文读回，与写入对象逐条一致——发现 1–7 处置 ∥ 发现 1 四处同拍（修法表 ∥ 落点 ∥ 受影响文件 ∥ 腿）∥ 行数值五 + c3 ∥ 派 E ∥ D9。

**§2 续 · 文档簇落地（小轮 · 2026-10-01 · eng-designer）**

依据 = §4 代签（解冻已解）；落法 = §2「簇二收正句定稿」全部 □ 项 + 「连带文档面」+ U4 非冻结档（**逐条按 §2 原文落——零新语义**）。届盘实读时点 = 2026-10-01 09:2x：派 A（M7）已落盘（`mount-info.mjs` 删 ∥ `mount-settings.mjs` **179**）；派 C（M6）未落（`capQueued` ∥ `withdrawCapEntry` 仍在盘）。

**落点（读回值）**
- 簇二 ① `PROJECT.md:125`：**五清家族** = `stopMark` ∕ `timerNotice` ∕ `compress` ∕ `digest` ∕ `helpLines`（读回在盘；`:1159` ∥ `RENDERER.md` 无四清——零动作核讫）。
- 簇二 ② `UI.md:24`（计划面行邻后）：「目标面板」行整行落位（定稿句逐字；`goal.mjs:2` 悬空引用随行自解——核外码零触）。
- 簇二 ③ `RENDERER.md:79`：**卡四类** + `[data-card="goal"]` + 卡序「… → 计划 → **目标**」；`:87`：**四卡**皆**非块节点**（两处同拍）。
- 簇二 ④ `RENDERER.md:97`：③ 径句收窄（头 = 逐件就地差分 ∥ 待审批族 ∥ 队列族 = 键控差分——定稿句逐字）。
- 簇二 ⑤ `RENDERER.md:19`：R13 句补「＋ **面内态变更 ⇒ 即时手动重挂（先于帧径数据刷——反馈不候帧）**」。
- 簇二 ⑥ `RENDERER.md:171`（巨块分段窗条末）：补「**换代件判据 = 核画件热区桶 `_liveMd.hot`**（端只读——核侧零公开读面；跨核边界读私有 = 在册披露）：热件不切（换代节点自然隔断）。」
- M6 派生：`PROJECT.md:95` ④ 句「；非 cap 结算径撤回臂（按条目引用 · 幂等——防御）」**删**（余句零改）；`:188` ∥ `:863` ∥ `:866` 撤回臂描述成分收正（机制名全消——`withdrawCapEntry` ∥ 「撤回臂载体」语零留）。**值列届盘实读对表**（验证口）：`turn-face.mjs` **197** ∥ `turn-driver.mjs` **252** ∥ `turn-input.mjs` **120** ∥ `queued-input.mjs` **90**——与文档链端现值同值，零改；M6 落盘后新值由实施舱回填。
- M7 派生：`PROJECT.md` §4.1 `mount-info.mjs` 行**整行退场**（删）；`UI.md` 项目级读数行**整行退场**（删）；`IPC.md` 设置族与项目级信息族注项 3 **收正支**（补「**渲染面消费（2026-10-01 复核收正批）**：项目级读数两通道渲染面零消费——复读面 `mount-info.mjs` 整档退场；通道本体 ∥ 主进程处理（`thincoder-desktop/src/main/project-info.mjs`）保留」——不采「退场」支：通道本体在盘，删合约行失真）；`WEB-QUICKCHECK.md` §3.2 stub 表 `ledger:read` ∥ `batch:status` **两行退场** + 来源注 **7 通道 ⇒ 5 通道**（三处：KD-W4 ∥ §3.2 表引 ∥ 来源注 + §6 验收面一处同拍）+ 装配链注届盘实读收正（`app.mjs:219 ⇒ :213` ∥ `mount-settings.mjs:162 ⇒ :158`——届盘读值）。
- M10 派生：`PROJECT.md:135` **三查位 ⇒ 四查位** + 新增 ④「**边界轮 `end` 帧 ∥ 记录零写**（`emitDigestEnd` 墓碑查位——已撤销 ∥ 已删会话零帧零记录）」；`:136` 计数同拍（四查位）。
- 变更记录同拍一行：`PROJECT.md:2032` ∥ `RENDERER.md:339` ∥ `UI.md:896` ∥ `IPC.md:465` ∥ `WEB-QUICKCHECK.md:174`（五档各一行——沿各档既有格式）。

**doc-check 读数（`node scripts/doc-check.mjs`）**：悬空 **114 ⇒ 109**（Δ−5——mount-info 系引用五处退场所致；闸态阈值 0 未变——既有红在册）；行宽 **263 ⇒ 263**（**不变**——新增/改行均未越线：新 changelog 各 ≤300；表行 ∥ 既越行沿旧）；行数面 **14 ⇒ 13** 条（报告态回填工单——余 13 为在途实施落盘差（M7 已落值待回填 ∥ `chat-digest*.mjs` 盘无档等），非本小轮射程）。

**零触面**：产品码 ∥ 需求档（父侧笔）∥ `API-CONTRACT.md`（父侧重生成）∥ 其他批档 ∥ `PROJECT.md:95` 余句 ∥ 既有越线债。

**发现（上报——本小轮范围外，零动）**：① `UI.md:90`（#461 批注）尚引 `refreshInfo` ∥ `paintInfo` 导出句（M7 已删——批注面残引）；② `UI.md:553`（D17/D19 批注）尚引「`mount-info` 复读面零改」；③ `PROJECT.md:254`（store.mjs 行）历史句尚列「批 9 增两切片…`projectInfo`」（史实句——观察）；④ 产品码注：`renderer/settings.css:9` 尚引 `renderer/mount-info.mjs`（信息行）——M7 零残留期望未覆盖此注（码面——随实施批处置）；⑤ `RENDERER.md:85` 卡节点三枚举 + 形态单源「三行」未随 M20 同拍（M20 定稿射程 = `:79` + `:87`——该处是否随改/目标卡是否同帧刷待父侧裁；本席不新拟）。

**读回核讫（小轮 · 2026-10-01 · eng-designer）**：上列全部落点写入后逐处读回（grep + read），与 §2 定稿句逐条一致；五档 changelog 在盘；doc-check 前后对表如上。

**§2 续 · 文档簇补收（小轮 · 2026-10-01 · eng-designer）**

依据 = 父侧受理（上块「发现」①–③⑤ 定向项 + ① 连带）；落法 = 最小同步（零新语义 ∥ 零新机制 ∥ 不改历史面）；处置支 = ①「删」∥ ②「去引」∥ ③「随拍」∥ ④「留」。

**落点（读回值 · 2026-10-01 09:3x）**
- ① `UI.md:90-91` **整对退场**（#461 项 5 + 判据）——对象链全随 M7 删（`openDir` 复读步 ∥ `refreshInfo` 句柄 ∥ 向导步 3 调用 ∥ `[data-slot="info"]` 判据面）⇒ 按批注读义取「删」支：无可收正之活体（沿 M6「对象已删不留修订式痕迹」先例）。读回 = `:89` 判据 ⇒ `:90` 空行 ⇒ `:91` 下块题头；本档 `mount-info|refreshInfo|paintInfo` 零命中（余两处 = 记录面 `:738` ∥ `:895`）。
- ② `UI.md:551`（原 `:553`）——边界句「`mount-info` 复读面零改（R13 遗留面另账）；」整截退场（对象整档删；余句零改；`len 199 ⇒ 169`）。
- ③ `RENDERER.md:85`——枚举**四类**（+`[data-card="goal"]`）+ 形态单源「审批呈现 / 提问呈现 / 计划面 / 目标面板**四行**」。盘核（语义同 ⇒ 措辞随动）：目标卡与三卡同走帧内判据刷——`mount-cards.mjs:32`（`CARDS_KEYS` 含 `"goal"`）∥ `:116` 目标支 ∥ `:135` 签名差换；帧分派 = `frame-dispatch.mjs:32`。读回 = 四类齐（`len 256 ⇒ 286`——未越 300）。
- ④ `PROJECT.md:254`（store.mjs 行）**判：历史面 ⇒ 留（零动）**——「批 9 增两切片…」= 事件链记录（同链在案先例 = 「会话模型轮 R13……族退场」事件；行内无「现存切片集」断言）；沿本小轮「不改历史」边界。
- ① 连带（跨档悬指消解）：`PROJECT.md:1248` §6.1 **D10 行**「**可见面修复批修（#461）**：开项目 ⇒ 信息行复读（…项 5）」从句退场——① 删项后成悬指；行内余部 ∥ D10 收窄归父侧 U1（未动）。读回 = `len 301 ⇒ 198`。

**变更记录同拍**：`UI.md:895` ∥ `RENDERER.md:340` ∥ `PROJECT.md:2033`——三档各一行（沿各档格式；均 ≤300）。

**doc-check（`node scripts/doc-check.mjs` · 前后对表）**：悬空 **108 ⇒ 108**（≤109 ✓）∥ 行宽 **263 ⇒ 263**（≤263 ✓）∥ 行数面 **13 条**（报告态——与上轮同值，非本小轮射程）。

**零触面**：产品码 ∥ 需求档（父侧笔）∥ `API-CONTRACT.md`（父侧重生成）∥ 其他批档 ∥ 块题「五件」与注首句等报告面。

**发现（上报——零动）**：
- A `UI.md:66` 注首句残引 + 计数（「…/「项目级信息」六行（各行已就地指针）」——M7 行删派生；且「审批呈现」指针本缺 ⇒ 非现行准确映射）；
- B `UI.md:3` 档头板块列「项目级读数」（行已删）；
- C `UI.md:596` 排版统一注面列「信息行」（该面已退——残列）；
- D `PROJECT.md:1346` §7 **T-DSK11** 尚含「项目级读数行（`[data-slot="info"]`）」死面腿（入列 = flat-followups 批「去死面腿」——盘面未落）+ `:1422` 测试面行同引；
- E 产品码注 `settings.css:9` 引 `mount-info.mjs`（随实施批处置）；
- F 实施在途：派 A（M7）已落（`mount-info.mjs` 盘无档）∥ 派 D 未落（`app.mjs:60/:90/:96` `refreshInfo` 仍在盘——M7 ④ 面）。

**读回核讫（小轮 · eng-designer）**：全部落点写入后逐处读回（read ∥ grep ∥ 行宽实测），与定稿句一致；三档 changelog 在盘；doc-check 前后对表如上。

**§2 续 · 实施后文档随动轮（值面回填 + 残句收正 · 2026-10-01 · eng-designer）**

依据 = 父侧工单（§5 五段落值清单 + 回填工单余项）。落法 = 值 ∕ 句收正——**零新语义 ∥ 零正文改写**（射程外零触）。

**落点（读回 file:line——现盘号）**
- `docs/desktop/design/PROJECT.md` §4.1 值列 **23 处**按届盘实读回填（口径 = 内容行数 = doc-check 实读；前读链格式 = 「；更前实读 <旧日>」）：`:182` turn-driver **236** ∥ `:188` turn-face **194** ∥ `:190` queued-input **78** ∥ `:225` chat.css **366** ∥ `:227` app.mjs **305** ∥ `:228` events **269** ∥ `:236` page-read **237** ∥ `:249` view-state **294** ∥ `:254` store **330** ∥ `:255` views/chat.mjs **205** ∥ `:256` chat-tree **147** ∥ `:260` chat-digest-rows **239** ∥ `:262` chat-subagent **106** ∥ `:268` activity **210** ∥ `:269` pool-subagents **130** ∥ `:270` activity-new **113** ∥ `:272` views/settings.mjs **364** ∥ `:284` mount-settings **179** ∥ `:286` mount-settings-exits **242** ∥ `:289` segments-providers **150** ∥ `:292` mount-onboarding **89** ∥ `:296` mount-cards **164** ∥ `:299` statusline **204**。
- **逐派对照（§5 落值 → 本档钉定）**：A = mount-settings **179** ∥ exits **242** ∥ segments-providers **150** ∥ onboarding **89** ∥ mount-status **43**（零差）∥ store **330** ∥ statusline **204** ∥ views/settings.mjs **364**；B = cards **164** ∥ events **269** ∥ activity **210** ∥ activity-new **113** ∥ chat-subagent **106** ∥ pool-subagents **130** ∥ view-state **294**；C = turn-driver **236** ∥ turn-face **194** ∥ queued-input **78**；D = app.mjs **305** ∥ page-read **237** ∥ chat-digest-rows **239**；E = VSC 两档（本档域外——零触）。
- 删档行退场：`views/chat-digest.mjs` 行去（#765 删档——「盘无档」项消；先例 = `mount-head.mjs` ∕ `mount-info.mjs`）。
- 越层段：**十三 ⇒ 十四档**（`:343` app.mjs **305** 回越——拆点 `renderer/frame-gate.mjs` 登记；`:336` store.mjs 拆点 = 初始字面段出档 `renderer/store-initial.mjs` 登记）+ 读数随盘（`:325` 计数 ∥ `:330` settings **364** ∥ `:334` chat.css **366** ∥ `:335` store **330**）+ `:344` 贴层段 app 段收正（→「越层在册——见上行越层段」）。
- 残句：`:190` ∥ `:866`（§4.2 #656 块行）queued-input `remove(key, entry)` 残述收正——按句读义判 = **名退场 + 值链对表**（原语随 M6 删；`:866` 值链 = 78 ⇒ 90 ⇒ 78）。
- 变更记录：`:2036` 一行同拍。

**doc-check（`node scripts/doc-check.mjs` · 前后对表）**：悬空 **108 ⇒ 107** ∥ 行宽 **262 ⇒ 261** ∥ **行数面 24 ⇒ 0 条**（「差异 0 条（比对 143 行 · 跳过 11 行）」——回填工单清零）。**三维不劣化 ✓**（悬空 ∕ 行宽两态 = 仓内既存态，非本批所生）。

**零触面**：产品码 ∥ 需求档 ∥ 本批其余档 ∥ `docs/vsc/design/WEBVIEW-PROTOCOL.md`（复核在盘——无涉卡退场述句；`questionResponse` 行 `:486` 零漂）∥ `streaming.js` 注（另账 #783 零触）。

**发现（上报——零动）**：① 值口径差 1——§5 落值首数 = read 总数（含末行）vs §4.1 口径 = 内容行数；示例：turn-driver 237 ⇒ **236** ∥ app.mjs 306 ⇒ **305** ∥ chat-digest-rows 240 ⇒ **239**（本席按 §4.1 表头口径钉定——逐档差在盘）；② `:344` 贴层段 `views/chat-digest.mjs` 残述（#765 删档——未入本工单射程，留观）；③ `:346` #D33 行「#764 ⇒ **299** 回线 ✓」与现值 **305** 已成历史帧（批次记录口吻——留）；④ `:1216` #768 块 `chat.css` 行标「+2」而值链 361 ⇒ 366（值本体 = 实读 **366** ✓）。

**口径说明（读回义务）**：23 处值为**逐处读回**所得（doc-check 行数面复读 **差异 0 条** = 全部同值）；值 ∥ 前读链 ∥ 越层登记 ∥ 变更记录 = 四处同笔同窗。**§6 收口输入就绪**（值面 ∥ 工单 ∥ 读数三维在盘）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

评审对象 = §2（修法表 ∥ 落点 ∥ 拆派预案 ∥ 验收腿 ∥ 簇二定稿句 ∥ 决策记录 ∥ 受影响文件）；依据 = 两档全文实读（批档 ∥ 桌面需求档）+ 所引代码档抽核（本席实读 20+ 档，逐条对表）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 需求覆盖 · 跨端 | 🔴 | M1 删核卡自摘（`thincoder-render-core/cards/question.mjs:30`，修法见批档 `:57`）波及 **VSC 端**且无退场径：该核档为两端生产共享件（VSC `thincoder-vscode/webview/question.js:8` · 桌面 `renderer/views/question.mjs:17`）。VSC 已答卡的**唯一**移除路径即核卡自摘（`webview/chat-messages.js:179-180` 明注「answer null 已随 questionResponse 自行移除——这里管 extension 主动取消的卡」；`webview/streaming.js:127` 仅中止径扫卡；宿主 `src/extension/panel-messages-turn.mjs:157-170` 受理后零回发；消息面仅 `clearMessages` 重建 `chat-messages.js:119-120`）⇒ 删自摘后 VSC 已答提问卡滞留（可点但宿主按 id 查无 = no-op）直至会话切换——落 D19「VSC 接核后行为零回归」（需求档 `PROJECT.md:164`）。设计文本全无 VSC 面（受影响文件 `:173-179` 无 VSC 档；边界句「核件面只收 M1 一处」`:196`；机检腿 ∥ 真机腿皆桌面面）。 | 评估 VSC 侧影响并给出对位退场径（端壳受理径移除 ∥ 核卡去留协议化〔deps 开关，默认保 VSC 原行为〕），或将该可见面差异登记在册并取得裁定；验收面补 VSC 侧复跑 ∥ 腿。 |
| 2 | 受影响文件标注 | 🟡 | 「届盘」5 项未给现行行数（`:174-175`：mount-onboarding ∥ store ∥ statusline ∥ page-read ∥ chat-digest-rows），测试档 c3（`:178`）亦无行数/差分——criterion 8 要求逐件现行行数 + 预期差分。抽核（本席实读）：**store.mjs = 333 行（已越 300 顾问线）而全表零拆点说明**；其余 = mount-onboarding 91 ∥ statusline 206 ∥ page-read 238 ∥ chat-digest-rows 199（均 <300）。已给数值各档抽核全中（app 300 ∥ view-state 300 ∥ mount-cards 168 ∥ events 266 ∥ activity 195 ∥ turn-face 197 ∥ turn-driver 253 ∥ mount-info 40 ∥ mount-settings-exits 239 ∥ segments-providers 148 ∥ question 93）。 | 补读补标现行行数与预期差分（含 c3 测试档）；对越线档（store.mjs）参照 app.mjs 先例补在册说明 ∥ 拆点判据。 |
| 3 | 结构分层 | 🟡 | app.mjs 拆预案触发句「触发 = 该档下次结构性触碰」（`:177`）与本批 M12 自身相抵——M12 即对 app.mjs 的帧门结构性改动（该档 ≈300 ⇒ ≈305，`:109`/`:177`）；按现文触发条件已被本批满足，设计未说明为何仍不随拆。 | 明确本批不随拆的理由，或随派 D 出档 `renderer/frame-gate.mjs`；触发句改写为不回环判据。 |
| 4 | 落点坐标 | 🟡 | M22 注释面两处坐标失真（`:143`）：`page-read.mjs:23` 实为 **:25**；`chat-digest-rows.mjs:209` 该档实长 199 行（第二处「运行期痕四清之四」实为 **:185**），且「（`:192-194` 已五清——零动作）」在该档不成立（「已五清」句实为 `page-read.mjs:194`）。按现坐标实施易漏修 :185 一处。 | 按符号重定位收正两处坐标；明示 chat-digest-rows 两处（:15 ∥ :185）皆修。 |
| 5 | 拆派协调 | 🟡 | 批内件「按派分段（单档多段）」（`:186`）与「四派无同文件交集」句张力——四派共写同一测试档需写入时序（并发落段有冲突风险）。 | 明确写入时序（各派串行落段）或按派分档；交集句限定为生产码面。 |
| 6 | 引证 | 🔵 | 「对表口径 = §1 既有约定」（`:198`）在 §1 正文（`:5-39`）未见该约定（或居全表 `.thincoder/tmp/audit-2026-10-01.md`——未核，unverified）。 | 明示该约定出处或改述为设计自定口径。 |
| 7 | 实施指令 | 🔵 | c3 批内件锁点指令（`:84`）：`:227` 为用例声明行（按「删」字面不可执行，应为改题）；④ 块（`:244-256`）删后 `queuedMod` 导入（c3 `:49` → 唯一使用 `:245`）成悬空导入。 | 将 `:227` 按「改题」表述；注明 ④ 块删除后同拍清理遗留（含导入句）。 |

计数：🔴 × 1 · 🟡 × 4 · 🔵 × 2
VERDICT: changes-required

### 轮次 2（评审子代理）

复核（轮次 2）对象 = §2 修复轮 1 块（`:200-268`：M1 跨端定形 D9 ∥ 行数补标 ∥ 拆预案触发句 ∥ M22 坐标 ∥ 写序 ∥ c3 全集）；依据 = 批档 + 桌面需求档 + 所引代码/测试档盘面复读抽核。发现 1–7 逐条核讫 + 新增 1 条：

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | `docs/batches/2026-10-01-audit-remediation.md:204-216` | 🔴 | ✅ Fixed（核讫） | 择 ㈡「端壳受理径移除」：核卡零摘除（删 `render-core/cards/question.mjs:30` `el.remove()`）∥ VSC 端壳 `question.js:19` `onAnswered` 收正为 `() => { el.remove(); ctx.inputEl.focus() }`（选项/提交/取消三径同路）∥ 桌面切片驱动。四处同拍核讫：修法 ∥ 落点三面（`:209-211`）∥ 受影响文件表（`:251-252`）∥ 腿（`:215-216`）；D9 在册（`:264-266`）。盘面抽核：`question.js:19` 现读 `onAnswered: () => ctx.inputEl.focus(),`（修后目标可达——`el` 闭包在作答回调时已初始化）；`chat-messages.js:180` 注句「questionResponse 自行移除——这里管 extension 主动取消的卡」在位；三既有径零触核讫（`streaming.js:127` 扫卡 ∥ `chat-messages.js:177-187` `questionCancelled` ∥ `:119-121` `clearMessages`）；桩先例两处核讫（`2026-09-29-residuals-round2-vsc.test.mjs:94` ∥ `2026-09-30-crossline-clearance-vsc.test.mjs:60-65`）；VSC 存量单测面空核讫（`files.mjs` = `export default []`）。 |
| 2 | 2 | `…:218-222` | 🟡 | ✅ Fixed（核讫） | 五届盘项 + c3 数值补标，逐档盘面抽核相符（±0/1）：`mount-onboarding.mjs` 91⇒≈90（`:45` `await refreshInfo()` 在位）∥ `store.mjs` 333⇒≈332（`:128` `projectInfo: { counts: null, … }` 行在位）∥ `statusline.mjs` 207⇒≈206（`:193` `projectInfo: state?.projectInfo ?? null,` 在位；评审席 206 差已在册）∥ `page-read.mjs` 238⇒238 ∥ `chat-digest-rows.mjs` ≈234⇒≈234 ∥ c3 `258 ⇒ ≈241`。越线档在册（`:222`）+ 拆点抽核：`store.mjs:75` `export function initialState() {` … `:130` `}` ≈56 行 ✓。 |
| 3 | 3 | `…:224-227` | 🟡 | ✅ Fixed（核讫） | 本批不随拆理由 ①② 在册；触发句收正为不回环判据（触发 = 届盘实读 > 500）。引证核讫：`docs/core/design/ADVISOR-CONVERGENCE.md:274`「文件档 >300 主动审视 / >500 必须拆——封口语义，无豁免通道」逐字 ✓；先例 `docs/batches/2026-09-25-hygiene-items.md:281`（turnstate 档 339 行「主动审视结论 = 结构不变（不拆）…339 < 500 硬顶」）✓；拆出区 `app.mjs:280-299` 抽核（`:280` 帧分派面表 ∥ `:286` `function applyFrame(dirtyKeys) {` ∥ `:296` 帧合并件 ∥ `:299` 订阅）✓；本批后 ≈305 < 500 ⇒ 未触 ✓。 |
| 4 | 4 | `…:229-234` | 🟡 | ✅ Fixed（核讫） | 坐标收正核讫：`page-read.mjs:25` = 「// 消化轮集清点（运行期痕**四清**之四 —— …」✓；同档 `:194` = 「…+ **运行期痕五清**」✓；`chat-digest-rows.mjs:15` = 「首屏清点 `clearDigest`（运行期痕四清之四 —— …」✓；第二处按符号定位 + 「在途活写 ⇒ 届盘按符号复核」声明在册（本席复读现值 `:226`，与设计席实读 `:220` 漂移 6 行——符号（`clearDigest` 函数注）仍精确命中，处理得当）；误置括注已删（`:233`）。 |
| 5 | 5 | `…:236-239` | 🟡 | ✅ Fixed（核讫） | 写入时序 = 串行落段（A⇒B⇒C⇒D⇒E）+ 禁并发 append ∥ 「无同文件交集」限定为生产码面——两条皆落；与派 E 增列（`:257`）一致；抽核 E 档（`question.js` ∥ `chat-messages.js`）不在 A–D 生产码表内 ⇒ 零交集成立。 |
| 6 | 6 | `…:241-243` | 🔵 | ✅ Fixed（核讫） | 改述为「本设计自定口径」；复跑实检核讫——`.thincoder/tmp/audit-2026-10-01.md` 对 `届盘|对表|微差` 零命中 ✓；§1 正文无该约定 ✓（§2 `:198` 原句已被本块优先条款覆盖）。 |
| 7 | 7 | `…:245-247` | 🔵 | ✅ Fixed（核讫） | c3「可执行全集」逐条对盘核讫：`:25` 整行删 ✓；`:27` 半句（保留「归父侧探针闭合。」）✓；`:227` = 改题（非删行，删两截语）✓；`:238` 语收正 ✓；`:240`∥`:241`∥`:242` 删/清（`:241` `const driver` 零消费者成立）✓；④ 块 `:244-256` ✓；`:49` `queuedMod` 导入清理（唯一使用 `:245`）✓；`:239` 保留 ✓。 |
| 8 | (new) | `docs/batches/2026-10-01-audit-remediation.md:234` | 🔵 | New：计数词与枚举不符 | 现读：「收正后 M22 注释面全集（两档四处——皆修）：`thincoder-desktop/renderer/events.mjs:38` ∥ `thincoder-desktop/renderer/page-read.mjs:25` ∥ `thincoder-desktop/renderer/views/chat-digest-rows.mjs:15` ∥ 同档 `:220`（按符号）。」——枚举 = **3 文件 4 处**，与「两档」不符 ⇒ 疑似笔误（应为「三档四处」）；枚举本体逐处对盘准确，不阻实施（建议实施舱随笔收正）。 |

计数：🔴 × 0 · 🟡 × 0 · 🔵 × 1（新；不阻）
VERDICT: pass

## §4 用户批准（主 agent）

**代签（2026-10-01 · 承用户 08:05 令 + 08:19「其他的都处理吧」+ 08:26 ∥ 08:29 全链授权——代签 ∥ 代派）**

**三条件齐备 ✓**：
1. **设计评审 pass** ✓（§3 轮次 1 = 0🔴 / 4🟡 / 6🔵；修复轮（发现 1–7）全落；**§3 轮次 2 = 0🔴 / 0🟡 / 1🔵（新）· VERDICT pass**）；
2. **修复轮已落地并核验** ✓（#19 七条全落；§3 轮次 2 逐号对盘核讫全数 Fixed——含 **M1 跨端定形 D9**（核零摘除 ∥ VSC 端壳作答径摘卡 ∥ 桌面切片驱动）四处同拍）；轮次 2 新 🔵（§2:234「两档四处」应为「三档四处」——枚举本体准确）= **在册，实施按「三档四处」为准**（记录面追加制——不改行，登记为准）；
3. **设计令牌已签发** ✓（**凭据值不落档**——沿纪律）。

**授权依据** = 用户 2026-10-01 08:05 + 08:19 + 08:26 ∥ 08:29 全链授权；**三自缚在册**（真分叉停 ∥ 新范围停 ∥ 破坏性停）。

**实施面** = 五派 A–E（生产码零交集；批内件单档多段 · **串行落段 A ⇒ B ⇒ C ⇒ D ⇒ E**）+ 批内件 `docs/batches/2026-10-01-audit-remediation.test.mjs` + c3 锁点随动（**父侧代改**——跨批写闸）+ 文档簇（**设计小轮**——簇二 6 处 □ + 连带文档面 + WEB-QUICKCHECK）+ 需求档三笔（**父侧笔**——D4 回指 ∥ U1 D10 ∥ U2 D28）+ `API-CONTRACT.md` 重生成（**父侧工程面**——M7 落盘后）。**代签即派**（五派先行；令牌入槽）。

## §5 实施记录（eng-coder）

### 派 A 段（设置面 · M2 ∥ M7 面 A · eng-coder · 2026-10-01）

**范围**：M2（草稿专件成功径同清 + #671 复位点表第五点转写）∥ M7 面 A（projectInfo 零消费全链删：六档 + `mount-info.mjs` 整档删）；派序 = **首派**（批内件由本段新建；单档多段 · A ⇒ B ⇒ C ⇒ D ⇒ E 串行落段）。

**落点（逐文件）**
- `thincoder-desktop/renderer/mount-settings-exits.mjs:78-84`（M2 核心）：`submitChannel` 成功径 `setSettings({ verify: null, providers: { ...held, draft: null } })`（失败径 return 前零改；档头 `:23-24` 补 M2 句）。
- `thincoder-desktop/renderer/mount-settings-segments-providers.mjs:10 ∥ :13-15`：档头注补「第五点 = 提交成功径」+ `probe ∕ draft` 复位点全集；「复位四点」句加 `keyDraft` 族限定（评审后收窄）。
- `thincoder-desktop/renderer/mount-info.mjs`：**整档删**（无归档件；`git status` = `D`）。
- `thincoder-desktop/renderer/mount-settings.mjs`：两族装配（`:3 ∥ :14 ∥ :42`）∥ 向导注入去 `refreshInfo`（`:144-148`）∥ 初读去（`:157-158`）∥ 返回面去（`:175-178`）∥ 注 `:8 ∥ :13 ∥ :20-21 ∥ :45-46`。
- `thincoder-desktop/renderer/mount-onboarding.mjs`：deps 去 `refreshInfo`（`:29-30 ∥ :33`）∥ 步 3 调用去（`:43-45`）∥ 注 `:6 ∥ :8-9 ∥ :36`。
- `thincoder-desktop/renderer/mount-status.mjs:22`：`STATUS_KEYS` 去 `"projectInfo"`。
- `thincoder-desktop/renderer/store.mjs`：初态切片删（原 `:128`）∥ 注 `:4 ∥ :8-9`。
- `thincoder-desktop/renderer/views/statusline.mjs`：形参去（`:59`）∥ 透传去（原 `:193`）∥ 注 `:23 ∥ :56`。
- **越表两件（如实披露）**：`thincoder-desktop/renderer/views/settings.mjs:15 ∥ :344`（两处 `mount-info` 悬引收正——删档后即悬空；M7a 腿覆盖）∥ `thincoder-desktop/renderer/settings.css:9`（父侧追加面：`mount-info.mjs` 悬引摘除）。
- 批内件（新建 · 首派）：`docs/batches/2026-10-01-audit-remediation.test.mjs`（单档多段 · 本段 = 派 A 六腿 M2a–c ∥ M7a–c；段头注在档）。

**验收读数（实跑 · 全绿）**
- ① 本派腿：`node --test docs/batches/2026-10-01-audit-remediation.test.mjs` ⇒ **6/6 绿**。
- ② M-671 族复跑：`node --test --test-name-pattern M-671 docs/batches/2026-09-30-desktop-residuals.test.mjs` ⇒ **4/4 绿**；M-671d 射程 = 开 ∕ 关 ∕ 取消三径（实读，非复位点全集）⇒ **第五点无需随修**（设计 M2c 条件未触）。同档整跑 13/15——另两红（M-685b 白名单 46≠45 ∥ M-689a chat 尾组句）经核 = 他批既有漂移（断言读面 `src/main/ipc.mjs` ∥ `views/chat.mjs`，与本派 diff 零交集；chat 尾组句随提交 #-747 改写）⇒ 非本派面。
- ③ 行数对账（口径 = `read` 总数；**全 ±3 内**）：`mount-settings-exits` 243（设计 ≈241，+2）· `mount-settings-segments-providers` 151（≈150，+1）· `mount-info` 已删（设计 40）· `mount-settings` 180（≈179，+1）· `mount-onboarding` 90（≈90，0）· `mount-status` 44（≈43，+1）· `store` 331（≈332，−1）· `views/statusline` 205（≈206，−1）。
- ④ 源面零残留：`renderer/**`（`.mjs` ∕ `.css` ∥ `.html`）grep `projectInfo|refreshInfo|createInfoFace|mount-info` 除 `app.mjs`（派 D 面）**零命中**（M7a 腿机检在案）；全生产码余量 = `app.mjs:60/90/96`（派 D 中间态）+ `.thincoder/tmp/**` 历史副本（排除类）。

**审计 ∥ 评审轮次与终态**
- 内部 explore 背离审计（**1 轮**）：**clean**——四类零命中；三条附报后两条本段兑现（§5 空载 → 本段；`settings.css` 悬引 → 随追加面摘除），余一条在册（`settings.css` 死面语义残句 = 台账 #713 出清范围）。
- advisor 代码评审（type=code · **1 轮** · 同步）：**pass**（0🔴 · 4🟡〔2 在册越线档 + 1 协调 + 1 非必须修〕· 1🔵）；越线档两件 `store.mjs`（331 ∥ `PROJECT.md:254` 在册 332）∥ `views/settings.mjs`（365 ∥ `PROJECT.md:273` 在册 365）皆按在册口径窗口顺延，零动作。
- **fix round：1 轮**（🔵 注文收窄：`本点只及 draft 一件，probe 探果保留` + 「复位四点（`keyDraft` 族）」限定）→ 复跑 6/6 绿；另追加面 1 件（`settings.css:9` 悬引摘除 + M7a 扫描面扩 `.css`/`.html`）。
- **终态 = clean**。

**决策透明 ∥ 边界**：M2 第五点注面 = 新起一句（保留 #615② 四点句原样——该句对 `keyDraft` 仍真）+ 评审后收窄；M2 只清 `draft`（`probe` 按设计保留）；M7a 扫描面 = `.mjs`/`.css`/`.html`（追加面后扩）；`app.mjs` 不触（派 D 落点，禁面）——其 `:96` 调用在本派落盘后暂抛（`openDir` try 捕获 ⇒ 「点开即可续」悬置至派 D），**已知中间态、跨派序在册**。

### 派 B 段（池 ∕ 卡面 · M1 桌面面 ∥ M3 ∥ M4 ∥ M11 ∥ M16 ∥ M22 注面 · eng-coder · 2026-10-01）

**范围**：M1 桌面侧（核卡零摘除 ∥ 端失败径零 DOM 写 ∥ 三处注面收正）∥ M3（条目携起源键 · 清位按起源键）∥ M4（池头逐件就地差分 + 补挂幂等注）∥ M11（`withThawedSubMeta` 单源 helper）∥ M16（键零命中 ⇒ `null`；焦点末环保留）∥ M22 注面一处（`events.mjs:38` 四清⇒五清）。派序 = 第二派（派 A 落定后开跑；生产码与派 A／C／D 零交集）。

**落点（逐文件）**

- `thincoder-render-core/cards/question.mjs`：删 `answer()` 内 `el.remove()`（核卡零摘除）∥ 函数注 `:10-12` 收正（「卡去留 = 端侧——核零摘除」）。
- `thincoder-desktop/renderer/mount-cards.mjs`：失败臂删 `paintCards()` 重挂 ⇒ `onAnswer = (promptId, answer) => { void submitAnswer({ store, host }, promptId, answer) }` ∥ 注 `:10-13`／`:56-57`／`:147-148` 收正（失败径零 DOM 写）。
- `thincoder-desktop/renderer/views/question.mjs`：注 `:6-8` 收正（核零摘除 ∥ 帧挂载摘卡 ∥ 失败零 DOM 写）。
- `thincoder-desktop/renderer/events.mjs`：`onApproval` 补 `item.key = ev.key ?? null`（内部簿记；`APPROVAL_KEYS` 零改 ∥ 消费面读取集零扩）∥ `clearApproval` 改按起源键清位（无起源键 ∥ 同键尚余项 ⇒ 零位标写；未命中 ⇒ 原引用）∥ 两处注收正 ∥ M22 `:38` 四清⇒五清。
- `thincoder-desktop/renderer/views/activity.mjs`：`adoptPool` 头分支 `head.replaceWith(build(headNode(...)))` ⇒ `syncHead`（+`HEAD_PIECES`）逐件就地差分——就地更新文本 ∥ `aria-*`（等值零写）、读数缺席 ⇒ 摘该件、缺件按件位补插、表外件（`.activity-new-btn`）零触 ∥ 头注 ∥ `adoptPool` 注收正。
- `thincoder-desktop/renderer/views/activity-new.mjs`：`syncActivityNew` 注收正（补挂 = 幂等兜底）。
- `thincoder-desktop/renderer/views/chat-subagent.mjs`：导出 `withThawedSubMeta`（单源；`finally` 还原本相——正常 ∥ 异常两径）∥ `echoOf` 三行组改消费。
- `thincoder-desktop/renderer/views/pool-subagents.mjs`：`replayRows` 同改消费（单向引 `./chat-subagent.mjs`——实读依赖链无环）∥ 依赖注同拍。
- `thincoder-desktop/renderer/view-state.mjs`：`resolveTarget` 删结构路径兜底（键零命中 ⇒ `null`）∥ 头注 ∕ `draftLoc` ∥ `restoreDrafts` 注收正 ∥ `restoreFocus` 焦点链末环 `byPath` 兜底**保留**。
- 批内件：`docs/batches/2026-10-01-audit-remediation.test.mjs` B 段（单档多段第二段；档头「现载」句同拍）。

**验收读数（实跑）**

- ① 本派腿：`node --test docs/batches/2026-10-01-audit-remediation.test.mjs` ⇒ **23/23 绿**（A 段 6 + B 段 17：M1a-c ∥ M3a-d ∥ M4a-d + 补挂退化 ∥ M11a-c ∥ M16a-d ∥ M22）。
- ② M11b 既有批内件复跑（相关卡面 ∕ 池面件）：`2026-09-29-subblock-follow-resume` **24/24**（改前 24/24）∥ `2026-09-29-desktop-rebuild-fidelity-M604` **8/8**（改前 8/8）∥ `2026-09-28-desktop-subblock-follow` **10/13**（改前 10/13，三红逐条同——非本派面）∥ `2026-09-30-desktop-residuals` **13/15**（派 A 同读数，两红非本派面）。
- ③ 行数对账（口径 = `read` 总数；全 ±3 内）：`question.mjs` 94⇒93（≈93，0）· `mount-cards` 168⇒165（≈163，+2）· `views/question` 59（≈59，0）· `events` 266⇒270（≈270，0）· `activity` 195⇒211（≈208，+3）· `activity-new` 113⇒114（≈114，0）· `chat-subagent` 102⇒107（≈104，+3）· `pool-subagents` 133⇒131（≈128，+3）· `view-state` 300⇒295（≈294，+1）。
- ④ 源面：核卡 `remove` 零命中 ∥ fork 判据句收正（`mount-cards.mjs` ∥ `views/question.mjs` 两档「点按即摘 ∕ 失败重挂」零残留）；审批卡面（`cards/permission.mjs` 仍自摘）＝本派排除面，其注面零触。
- ⑤ 跨批相抵（发现 · **须父侧处置**）：`docs/batches/2026-09-29-desktop-carryover-c2.test.mjs:216` 现读 `assert.notEqual(head2, head0, "头原位重建（引用换新）")`——以「整头换代」为真，与 M4 相抵；实跑 c2 档 **5/6**，唯一红 = M-660a。批档「测试面」行未列 c2 ⇒ 无承接派；按 §4「跨批写闸 = 父侧代改」口径未在本派出手（建议父侧小轮：`:216` 改判「头同引用存续（逐件就地差分）」+ `:215` 括注同拍）。

**审计 ∥ 代码评审轮次与终态**

- 内部 explore 背离审计（**1 轮**）：**clean**——四类零命中（部分实施 ∥ 静默简化 ∥ 设计漂移 ∥ 越界）；三条观察：①批内件档头「现载本段」句 → 本段已兑现；②`events.mjs:43` 池会话键口径句 = 现行真值（留）；③`app.mjs:167` 审批卡注与 M1 无涉（留）。
- advisor 代码评审（type=code · **1 轮** · 同步）：**changes-required**（0🔴 · 1🟡〔c2 锁点相抵——跨批协调项〕· 1🟡-optional〔批内件 743 行越评审机械线——设计令单档多段，先例在盘〕· 3🔵〔`wire` 的 `disabled` ∕ `onClick` 不入差分面（`onTogglePool` 恒在场，生产不可达）；`HEAD_PIECES` ∥ `headNode` 件序双写；`approval` 位标码审批族 ∥ 提问族共用致清位跨族误清（既有模型缺口）〕）。
- **fix round：1 轮**（两条 🔵 注面真理收正：`HEAD_PIECES` 注改「与 `headNode` 逐位同拍」∥ `syncHead` 注补「件身份 props ∥ `onClick`/`disabled` 由建壳帧定——`onTogglePool` 恒在场」；行数零变）→ 复跑 23/23 绿。
- **终态 = clean（本派实施面）**；1 项跨批相抵（c2 锁点）已上报父侧（`notify_parent` note 在途）——超出本派授权面（跨批写闸 = 父侧）。

### 派 C 段（宿主面 · M6 ∥ M10 · eng-coder · 2026-10-01）

**范围**：M6（撤回臂不可达 ⇒ 臂 `withdrawCapEntry` + 载体 `capQueued` + 原语 `queued.remove` + 三清点 + 注入 + 注面全删）∥ M10（`emitDigestEnd` 顶部墓碑查位 + 注面收正）；派序 = 第三派（A ⇒ B ⇒ **C** ⇒ D ⇒ E；批内件单档多段第三段）；**c3 锁点 = 父侧代改**——届盘实读：242 行、`撤回臂|capQueued|withdrawCapEntry` 零命中（已随动）⇒ M6b 全量复跑成立。

**落点（逐文件 · 行号 = 落盘后现读）**
- `thincoder-desktop/src/main/turn-driver.mjs`：`capQueued` 表删 ∥ `withdrawCapEntry` 全臂删 ∥ `createTurnFace` 注入删 ∥ 三清点删（`onCapCancelled` ∥ `dispose` ∥ `abortSuspensions`）∥ 注面收正五处（档头 #656 句 ∥ 结算通知句「预入队条目引用消费」⇒「消费 = 下一回合边界」∥ 输入面装配注 ∥ 参数列 ∥ 「cap 态两表」⇒「cap 态登记表」×2）。
- `thincoder-desktop/src/main/turn-face.mjs`：参数注删 ∥ 形参去 `withdrawCapEntry` ∥ 消费块删（中断续跑径三行）∥ 档头句收正 ∥ **M10**：`emitDigestEnd` 顶部增墓碑查位（现 `:168` —— 先于 `endEmitted` 置位与两写 ⇒ 零帧零记录；`:176`/`:181` 调用点零改）＋ 注面收正（「不查回合墓碑…由 `settleTurn` 门守」⇒「**查** —— 记录腿不经 `settleTurn` 门（`end` 先于结算落盘）⇒ 自带门」）。
- `thincoder-desktop/src/main/turn-input.mjs`：形参去 `capQueued` ∥ 登记块删 `capQueued.set` 行与注（`queued.add` 权威判保留）∥ 档头注「cap 两表」⇒「cap 登记表」。
- `thincoder-desktop/src/main/queued-input.mjs`：`remove(key, entry)` 原语删 ∥ 档头句删。
- 批内件 `docs/batches/2026-10-01-audit-remediation.test.mjs`：C 段七腿（M6a ∥ M6b-1/-2 ∥ M6c ∥ M10a/b/c）+ 档头「现载」句同拍。

**验收读数（实跑）**
- ① 本派腿：`node --test docs/batches/2026-10-01-audit-remediation.test.mjs` ⇒ **30/30 绿**（A 6 + B 17 + C 7）。
- ② M6b：`node --test docs/batches/2026-09-29-desktop-carryover-c3.test.mjs` ⇒ **6/6 绿**（改前基线同 6/6 ⇒ 行为零变）。
- ③ 源面：`thincoder-desktop/src/**` grep `capQueued|withdrawCapEntry|撤回臂` ⇒ 零命中；`queued.remove` 零第二调用点（全仓唯一消费 = 已删撤回臂）。
- ④ 行数对账（read 总数 ∕ 内容行；设计 = §2 面 C）：turn-face 197 ⇒ **195/194**（≈194，±0）· turn-driver 253 ⇒ **237/236**（≈241，−4 —— 设计估数只计表 3 + 臂 9 = 12 行，其同列明示之注入 1 + 三清点 3 未计；16 行逐项对账）· turn-input 121 ⇒ **120/119**（≈117，+3 上缘）· queued-input 91 ⇒ **79/78**（≈79，±0）。
- ⑤ 行为保真：cap 待答 ∧ 携文 ⇒ 入队 + 受理回执（满 ⇒ `queue-full` 零中止）零变（M6b-1/-2 真 driver 复演 + c3 全腿）。

**审计 ∥ 代码评审轮次与终态**
- 内部 explore 背离审计（**1 轮**）：**DEVIATIONS(2 · 均低危)** —— ① turn-driver 行数 237 vs ≈241（根因 = 设计估数，逐行对账非删过头）；② §5 派 C 段未写（= 本段兑现）。机制 ∥ 行为 ∥ 越界 ∥ 残件面零背离。
- advisor 代码评审（type=code · **1 轮** · 同步）：**pass** —— 无必修；非阻塞项四条（三查位注面滞后 ∥ cap 腿同类残留〔可达性未证〕∥ 批内件 908 行越机械线〔设计令单档多段 + 同形先例 + 派 B 轮同题已判〕∥ turn-face 缩进失形〔#719 遗留〕）+ 范围外四注（值列回填 ∥ 「全仓零残留」口径 ∥ D3 可达性独立复核 ∥ 评审席未执行套件）。
- **fix round：0 轮**（无必修项；非阻塞项处置 = 出范围上报 ∥ 在册 ∥ 本段兑现）。
- **终态 = clean**。

**未决 ∥ 出范围（上报父侧）**
- 注面计数（M10 派生连带）：`turn-driver.mjs:53 ∥ :117` 仍读「三查位」（枚举三处）vs `PROJECT.md:135` 已升「四查位」（+④ `emitDigestEnd` 查位）—— 不在 §2 锁点 ⇒ 未动；建议父侧小轮与值列回填同窗收正。
- cap 腿同类残留（可达性未证）：`turn-face.mjs:136-139` cap 帧 ∥ cap 记录无墓碑查位（M10 落点之外）—— 供父侧裁（同拍扩门 ∨ 在册）。
- 缩进失形（非本轮引入）：`turn-face.mjs:161-173` 块 2 空格（函数体 4 空格）—— 格式项在册。
- 文档面回填（父侧笔 ∕ 小轮）：`PROJECT.md:190/:865` 仍述 `remove(key, entry)`（对象已删）+ §2 值列「M6 落盘后新值由实施舱回填」（新值 = 本节 ④）。
- 排除类残件（零动作）：`.thincoder/tmp/S4-turn-driver.baseline.mjs` 历史副本 ∥ `2026-09-29-structure-split-2.test.mjs:213` 死夹具键 `capQueued: new Map()`（该档自标断代失效，实读无害）。

### 派 D 段（帧门 + 句处置 · M12 ∥ M7 ④ 收口 ∥ M22 注面两档 · eng-coder · 2026-10-01）

**范围**：M12（帧内一次性门：`cardsDrawn` + `paintCardsOnce` ∥ `applyFrame` 起帧复位 ∥ `paintChat` 两内联点改 wrapper ∥ `faces.cards` ∥ `onCardRefresh` 前置复位）∥ M7 ④（`app.mjs` `openDir` 链去 `refreshInfo` + 注收正 —— 派 A §5 在册的中间态收口）∥ M22 注面两档三处（`page-read.mjs:25` ∥ `chat-digest-rows.mjs:15` ∥ `:226`，按符号定位）；派序 = 第四派（A ⇒ B ⇒ C ⇒ **D** ⇒ E；批内件单档多段第四段）。

**落点（逐文件 · 行号 = 落盘后现读）**
- `thincoder-desktop/renderer/app.mjs`：门 + wrapper（`:116-123`）∥ `applyFrame` 起帧复位（`:292`，先于 `dispatchFrame`）∥ 两内联点 `:179`（构造径）/`:181`（结算径，先于结算次序保留）改 `paintCardsOnce` ∥ `faces.cards = paintCardsOnce`（`:287`）∥ `onCardRefresh` 前置复位 + 指称收窄为「审批卡」（`:172`；父侧加注 1——referent = `views/approval.mjs:19-20` 端壳适配 d + `:184-185` 回执失败径）∥ M7 ④：`openDir` 链去 `await settingsFace.refreshInfo()`（`:89-98` 现为 `refreshRail` ⇒ `opened()` ⇒ `resumeOpened()`——「点开即续」复位）∥ 注 `:59`/`:87-88` 收正。
- `thincoder-desktop/renderer/page-read.mjs:25`：四清 ⇒ 五清（同位换字，±0 行）。
- `thincoder-desktop/renderer/views/chat-digest-rows.mjs`：`:15` ∥ `:226`（`clearDigest` 函数注——按符号定位；设计预判 `:220`，届盘漂至 `:226`，按设计预案「按符号复核」处理）四清 ⇒ 五清。
- 批内件 `docs/batches/2026-10-01-audit-remediation.test.mjs`：D 段五腿（M12a ∥ M12b ∥ M12c ∥ M7-④自证 ∥ M22-D）+ 档头「现载」句同拍。

**验收读数（实跑）**
- ① 本派腿：`node --test docs/batches/2026-10-01-audit-remediation.test.mjs` ⇒ **35/35 绿**（A 6 + B 17 + C 7 + D 5；fix round 后复跑同值）。
- ② M12c 复跑电池（改前基线 ⇒ 改后，逐档同值——零回归）：`2026-09-29-render-perf` **14/17 ⇒ 14/17**（存量红 ×3：AC-2 T1 六面口径〔head 面退役〕∥ AC-5 T1/T2 计划面导出更名——靶点非本派文件）· `2026-09-29-desktop-head-toolcolor` **3/5 ⇒ 3/5**（存量红 ×2：T3 词键计数 ∥ T5 行色规则）· `2026-09-29-desktop-carryover-c2` **6/6 ⇒ 6/6** · `2026-10-01-desktop-flow-reconcile` **6/6 ⇒ 6/6** · `2026-09-30-desktop-residuals` **13/15 ⇒ 13/15**（存量红 ×2：M-685b ∥ M-689a）。
- ③ 行数对账（口径 = `read` 总数 ∕ `split("\n")`）：app.mjs 300 ⇒ **306**（设计 ≈305，+1；越 300 顾问线在册，拆点 `renderer/frame-gate.mjs`，触发 = 届盘 >500）· page-read 238 ⇒ **238**（±0）· chat-digest-rows 设计值 ≈234 ⇒ **240**（±0 于本派——漂移 +6 归他批在途活写，设计明示「届盘实读为终值」）· 批内件 908 ⇒ **974**（D 段 5 腿 + 档头句；fix round 净 −2）。
- ④ 源面：app.mjs `refreshInfo|projectInfo|createInfoFace|mount-info` 零命中（M7-④自证腿）∥ 两档 `四清` 零命中（M22-D 腿；page-read 五清句 = `**五清**之四` ∥ rows 两处 = `五清之四`）。

**审计 ∥ 代码评审轮次与终态**
- 内部 explore 背离审计（**1 轮**）：**clean** —— 四类零命中；附报两条兑现（§5 本段；`composer-wire.mjs`「四清位」= 同形异义已定性）。
- advisor 代码评审（type=code · **1 轮** · 同步）：**pass**（0🔴 · 2🟡 在册〔app.mjs 306 > 300 顾问线 ∥ 批内件 974 行越机械线——设计令单档多段、两轮先例同判〕· 5🔵；七条已本席逐条实读复核）。
- **fix round：1 轮**（三条 🔵 处置：腿名 `M7d` ⇒ `M7-④自证`〔避与 §2 之 M7d〔D10 行 · 父侧笔〕同名两义〕∥ M12c 切片锚改唯一符号面〔去「首个 `} else {`」脆性锚〕∥ M22-D 断言去排版标记绑定）→ 复跑 **35/35 绿**；余 🔵 两条处置 = 门本体行为腿缺位（app.mjs 模块级全装 wire、不可导入 ⇒ 真行为腿需整装桩，设计腿集取源面 + 复跑——**拒绝，理由在册**）∥ 数字漂移（随 ③ 登记）。
- **终态 = clean**。

**未决 ∥ 出范围（上报父侧）**
- 批外观察（零动）：`renderer/composer-wire.mjs:70/:100`「四清位」= 直发径失败位标概念（同形异义，非 M22 族）∥ 旧批档 `2026-09-29-desktop-digest-parity.test.mjs` W10 测试名仍读「四清」（历史批档，收口档零回改）∥ `.thincoder/tmp/**` 历史副本含旧文（排除类）。
- 文件链（未动，供父侧裁）：`app.mjs` 越 300 顾问线在册（306）——拆点 `renderer/frame-gate.mjs`，触发 = 届盘 >500；本批不随拆理由见 §2 发现 3。

### 派 E 段（VSC 面 · M1 跨端定形〔D9 = 端壳受理径移除〕· eng-coder · 2026-10-01）

**范围**：M1 跨端定形之 VSC 侧（决策 D9）——`question.js` 端壳作答径摘卡 + 回焦（与核原自摘同点同果）∥ 档头留端句 ∥ 函数注收正 ∥ `chat-messages.js:180` 注句收正 ∥ 批内件 VSC 格（E 段——四断言 + 提交径补强 + 源面锁）；派序 = **末派**（A ⇒ B ⇒ C ⇒ D ⇒ **E**；批内件单档多段第五段——本段落定后档头「五段齐讫」）。

**落点（逐文件 · 行号 = 落盘后现读）**
- `thincoder-vscode/webview/question.js`：`:19` `onAnswered` 收正为 `() => { el.remove(); ctx.inputEl.focus() }`（端壳作答径摘卡 + 回焦——选项 ∥ 提交 ∥ 取消三径同路）∥ 档头 `:4` 留端句补「作答径摘卡（核零摘除——卡去留归端侧）」∥ 函数注 `:10` 「卡自移除」⇒「端壳作答径摘卡」。行数 **26**（设计 26 ⇒ ≈26，±0）。
- `thincoder-vscode/webview/chat-messages.js`：`:180` 注句「已随 questionResponse 自行移除」⇒「已随作答径端壳移除（`question.js`）」（句义同步）；`questionCancelled` case 判据（`:182-185`）零变。行数 **265**（设计 265 ⇒ ≈265，±0）。
- 批内件 `docs/batches/2026-10-01-audit-remediation.test.mjs`：E 段四腿（M1-VSCa 选项径 ①②③ ∥ M1-VSCb 取消径 ④ ∥ **M1-VSCb2 提交径**〔补强腿——设计腿集①–④外，已披露〕∥ M1-VSCc 源面锁 + 三既有径零触 + 核单门跨面复核）+ 档头「现载」句同拍（`:6`）。

**验收读数（实跑）**
- ① 本派腿：`node --test docs/batches/2026-10-01-audit-remediation.test.mjs` ⇒ **39/39 绿**（A 6 + B 17 + C 7 + D 5 + E 4；fix round 后复跑同值）。
- ② 行数对账（口径 = read 总数 ∕ `split("\n")`）：`question.js` 26（设计 26 ⇒ ≈26，±0）∥ `chat-messages.js` 265（设计 265 ⇒ ≈265，±0）。
- ③ 源面：`onAnswered` 含 `el.remove()`（`:19` 逐字）∥ 三径同路 = 核 `answer()` 单门（`deps.onAnswered?.\(` 唯一命中于核 `cards/question.mjs:33`；三径调用点 = 核 `:49`（Enter）∥ `:55`（提交钮）∥ `:75`（选项钮）∥ `:88`（取消钮））。
- ④ 三既有径零触（只读复核）：`questionCancelled` 扫卡判据（`chat-messages.js:182-185`）∥ 中止扫卡（`streaming.js:127`）∥ `clearMessages` 重建（`chat-messages.js:120`）——盘面逐字符在位、与本派 diff 零交集 ⇒ D19 面零差。
- ⑤ 附核：`thincoder-vscode` 全树 `自行移除|自移除` 零命中（旧句零残留）∥ `node_modules/@thincoder/render-core` 软链直通核件现行内容（`cards/question.mjs:12`「**卡去留 = 端侧**——核零摘除」）∥ VSC 存量单测面 = 空（`thincoder-vscode/test/files.mjs` = `[]`）⇒ 复跑面 = 本批 VSC 格（唯一可跑面）∥ `docs/vsc/**` 零写——`WEBVIEW-PROTOCOL.md:486` 锚点（`webview/question.js:15` ∥ `:16`）仍在位零漂。

**审计 ∥ 代码评审轮次与终态**
- 内部 explore 背离审计（**1 轮**）：**DEVIATIONS(1 · 低危)** —— 唯一项 = 本段（§5 派 E 段）未写（记录面缺口，本段兑现）；生产码 ∥ 批内件面四类（部分实施 ∥ 静默简化 ∥ 设计漂移 ∥ 越界）零命中。附核三项：断言无掩盖（「卡离容器」只可能由端壳摘卡兑现——核零摘除核讫）∥ 假 DOM 不掩盖（`state.js` 真档随真 `question.js` 装载，仅全局桩）∥ 禁面未触（恰三档 = 授权清单）。
- advisor 代码评审（type=code · **1 轮** · 同步）：**pass**（0🔴 · 0🟡 · 4🔵）。
- **fix round：1 轮**（三条 🔵 处置：① 注面断言去「跨注释换行窗口 ≤32」脆性 ⇒ 折行归一化后直串 ∥ ② E 段头补「E = 末段 · 全局桩不入还原面」句 ∥ ③ 补提交径补强腿 M1-VSCb2）→ 复跑 **39/39 绿**；余 🔵 一条（§5 派 E 段）= 本段兑现。
- **终态 = clean**。

**未决 ∥ 出范围（上报父侧）**
- `thincoder-vscode/webview/streaming.js:125-126` 英文注「a completed turn answers via questionResponse which removes its own card」——D9 后摘卡归端壳（`question.js`）「removes its **own** card」归属语义陈旧；该档不在本派落点（批档锁「中止扫卡」行为行 `:127` 零改）⇒ 零动，供父侧后续小轮裁。
- 行数对账基线注：`.thincoder/tmp/head/**` 为更早版本快照（实读 = R2 核化前，89 行），**不可**作前态基线；② 判定以「设计表先前值 = 现读值（26 ∥ 265 口径）」为据。

## §6 验证与收口（父代理）

**验证与收口（主 agent · 2026-10-01）**

**批内件（本批单元证据）**：`docs/batches/2026-10-01-audit-remediation.test.mjs`（单档五段 A–E）——**39/39 绿**（父侧多轮复跑实读）：A 6（M2a–c ∥ M7a–c）∥ B 17（M1a–c ∥ M3a–d ∥ M4a–d+补挂 ∥ M11a–c ∥ M16a–d ∥ M22）∥ C 7（M6a ∥ M6b-1/2 ∥ M6c ∥ M10a–c）∥ D 5（M12a–c ∥ M7-④自证 ∥ M22-D）∥ E 4（M1-VSCa/b/b2/c）。

**跨批复跑（核读）**：c3 **6/6**（M6 相抵锁点随动——父侧代改 ∥ `撤回臂`零命中）∥ c2 **6/6**（M4 相抵锁点随动——父侧代改：`:215/:216` 头引用存续翻判）∥ M-671 族 **4/4** ∥ render-perf **14/17** ∥ head-toolcolor **3/5** ∥ flow-reconcile **6/6** ∥ subblock-follow-resume **24/24** ∥ M604 **8/8** ∥ subblock-follow **10/13** ∥ residuals **13/15**——逐档与改前基线同值（存量红均既有漂移、先于本批、靶点非本批文件——#777 在册）。

**工程面**：`docs/core/design/API-CONTRACT.md` 重生成——**OK**（2760 条 · 骨架零漂移——M7 删档登记行消解）。

**文档面**：文档簇落地轮（#28）∥ 补收小轮（#29——M7 派生残引清）∥ 实施后随动轮（#31——§4.1 值列 **23 处**回填 ∥ `:190/:866` `remove` 句收正 ∥ doc-check 行数面 **24 ⇒ 0**）∥ 父侧小笔（UI.md 三处 ∥ PROJECT.md T-DSK11 ∥ 需求档 M7/D10 收窄）——逐处在册。值口径 = §4.1 表头（内容行数）为准（read 总数值差 1 判由在册）。

**设计评审**：§3 在册（轮次 pass）；§4 = 全链自动授权（用户 2026-10-01 令——代签在册）。

**零触面确认**：源面锁（M6a ∥ M7a/④ 零残留 ∥ 四清/五清零残留 ∥ 核卡零摘除）∥ 核件只收 M1 单门一处 ∥ 仓套件零跑（父侧收口唯一跑）。

**收口测试线**：① 本批单元件 = 批内件（随本记录留存——零处置）；② 集成面 = 无新增 ∥ 无修订（真机观测 = 用户侧观察）。

**遗留（另账在册）**：#775 已废弃（前提不成立——撤回）∥ #776（settings.css 死面）∥ #777（residuals 两红）∥ #778（批 9 注残引）∥ #779（行宽红）∥ #780（位标跨族）∥ #781（宿主面两小件）∥ #782（cap 腿墓碑覆盖——**待用户裁**）∥ #783（`streaming.js` 注）。跨批中间态披露（app.mjs 段间窗）= 随五派落盘已闭。

**状态行** → 已收口（本记录冻结）。
