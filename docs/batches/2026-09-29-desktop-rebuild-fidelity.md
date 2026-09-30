# 2026-09-29 · desktop-rebuild-fidelity（桌面重建保真 + 留端清算族）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-29 · 来源 = 挂账族集中处置（用户 2026-09-29 16:52 令）——桌面重建保真 ∕ 留端族载体：台账 #604 ∕ #605 ∕ #606 ∕ #607 ∕ #608（+#581 候选）。
> 台账 = #604 ∕ #605 ∕ #606 ∕ #607 ∕ #608（桌面 · 归批；#581 候选）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-29
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 本批（父侧 · 2026-09-29 16:5x）

- **来源** = 挂账族集中处置令（用户 16:52）；授权 = 13:52 全权（代点火 + 代批准）。上游 = 09-29 两轮清点审计（#187 全树清点 ∕ #188 留端审计——逐条在册含 file:line）。
- **条目（五行 + 一候选）**：
  - **#604** 设置面 ∕ 向导整树重建 ⇒ 未提交草稿可被后台读数清掉（VSC 有明文禁止同形：`settings.js:126-138`）——判据 = 任一 settings 切片写落地不得清未提交草稿（分段就地更新 ∕ 草稿保真）；
  - **#605** 工具卡每 chunk 重建 ⇒ `.tool-result` 自滚位 ∕ 选区逐帧归零（对位 = VSC 持久元素 `textContent +=` 形）；
  - **#606** 重建面位 ∕ 焦点保真族（会话条 `mount-sessions.mjs:104-118` ∕ 会话头 `chrome.mjs:191-198` ∕ 池两族 `activity.mjs:132-153 ∕ :178-185` ∕ locale 重挂 `app.mjs:260-271` 等六面）；
  - **#607** 留端清算·滚动策略族：抽核件 pin 工厂（四载体 = 块内容区 ∕ 活动区 ∕ 池列 ∕ 对话流——一处实现 + 对拍腿；KD-RC-8 ③ 帧模型不收核，不破定性边界）；
  - **#608** 留端未接四项（痕迹 ∕ 丢弃痕迹 ∕ `resetActivity` ∕ 说明行插入点）+ 效果执行两法择一（VSC 按序 ∥ 桌面幂等派生）；
  - **#581**（候选：段 14「窗内提示态」未落——statusline 面；设计轮裁「并入本批 ∕ 另轮」）。
- **边界**：#613（composer `lastEcho` 竞态）· #599（relay 边界差）· #615 ∕ #617（设置面两裁）**不纳入**（另轮）；#614（i18n 拆分批）独立在册。
- **判据口径**（#603 教训推广）：统一真机探针 = 「重建前后同一元素 `scrollTop` ∕ 焦点 ∕ 选区保真」+ 各条自有判据（各行在册）。
- **授权口径**：设计 = eng-designer（本批 §2）；实施 = eng-coder（评审 + 代签 §4 + token 后）；真机腿 = 父侧探针（Playwright 基建在位）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（覆盖 #604–#608 + #581（并入裁定）；写域 = 本档 §2（设计轮零产品码 ∕ 零设计档写入）；上抛 U1–U4 在册；§3 轮次 1 九发现修正轮落毕（2026-09-29））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 批次任务（覆盖 · 逐条）

**覆盖 = 五行 + 一候选**（逐条「机制 → 落点 → 判据 → 真机探针腿」见 §2.3；本轮 = 设计轮，零产品码 ∕ 零设计档写入——写域仅本 §2）：

| 台账 | 题 | 本批裁 |
|---|---|---|
| #604 | 设置面 ∕ 向导整树重建 ⇒ 未提交草稿被后台读数清掉 | 设计（修 = 草稿保真总闸） |
| #605 | 工具卡每 chunk 重建 ⇒ `.tool-result` 自滚位 ∕ 选区逐帧归零 | **已消（#609 批 · KD-RC-9）**——本批 = 复核闭档（不重做） |
| #606 | 重建面位 ∕ 焦点保真族（六面） | 设计（修 = 身份保真「键控差分」+ 位置保真「快照复填」二分） |
| #607 | 留端清算·滚动策略族 pin 工厂（四载体） | 设计（修 = 抽核件 `scroll.mjs` 四件 + 对拍腿升级） |
| #608 | 留端未接四项 + 效果执行两法择一 | 设计（修 = 说明行实修；痕迹族 ∕ `resetActivity` = 给由收正；效果执行 = 语义准 + 等价对拍腿） |
| #581 | 段 14「窗内提示态」未落 | **裁定 = 并入本批**（statusline 面小件；词键零增） |

**不在本批**（沿 §1 边界，零触）：#613（composer-wire `lastEcho` 竞态）· #599（relay 边界差）· #615 ∕ #617（设置面两裁）——另轮；#614（i18n 拆分批）独立在册。
**i18n.mjs 零触**（500 顶格）：本批零新词键（#581 复用在册键 `status.queue.enter`；#604–#608 全为机制面，零文案增删）。

**归因订正（设计轮实读 · 报告项）**：#605 所指「增量刷新路径』的核 `appendToolOutput` 实为 **#609 批（KD-RC-9）**落地件（非 #603 批）；本 §2 按届盘实读记述，与 #609 §6 结算一致。

**设计档随动清单（写权 = 设计面；本轮按父侧令未落——落点与落手见 §2.8 U2〔已裁为实施前硬前置〕）**：`docs/render-core/design/RENDER-CORE.md`（KD-RC-8 ④ 消费面收正 + §5 增滚动族导出面 + §6 行数账 + 变更行）· `docs/desktop/design/RENDERER.md`（§1.1 重建保真族 + §3 滚动族消费）· `docs/desktop/design/UI.md`（本批注 + 段 14 行收正）· `docs/desktop/design/PROJECT.md`（§4.2 文件行 + §10 行）· `docs/vsc/design/WEBVIEW.md`（§5.5 滚动族 VSC 消费收正）· 核两档档头留端清单收正（`subblocks/state.mjs` / `subblocks/block.mjs`）。

### 2.2 机制设计 · #604（设置面 ∕ 向导 · 草稿保真总闸）

**机制（二件）**：
1. **快照复填总闸**——任一 `settings` 切片写 ⇒ `mount-settings.mjs:123-128` 订阅（`SETTINGS_KEYS = ["settings","locale"]`，`mount-settings.mjs:36`）⇒ `paintSettings`（`:111-114`——两树唯一重绘点）⇒ 设置树 = `views/settings.mjs:326-334` `mountSettings`（`:331` clear + 整树重建）／向导径 = `views/onboarding.mjs:153-161`（`:158` clear）。
  修 = **挂闸于重绘单点 `paintSettings`**（`:111-114`）：挂载前**捕获草稿**、重建后**复填**（值 ∕ `checked` ∕ 焦点 ∕ 光标区间 ∕ 根 scrollTop）；两树一闸 ⇒ `views/settings.mjs` ∕ `views/onboarding.mjs` 零增行（越线档零增——见 §2.9 越线句）。捕获域 = 显式申报：表单可输入控件携 `[data-draft]` 标记（新增标记面），键 = 控件 `id`（现制 `id` = `name`，`settings-controls.mjs:23-28` `fieldPair`；无 `id` 控件 ⇒ 标记取值作显式键）；复填仅及捕获域 ⇒ 即改即存控件不被旧值回写（负向锁）。
2. **不动面（明确不做）**：不引「全模型差分门」（settings 模型比较件成本 ≫ 收益，低频繁面）；不引「逐段就地重渲」（见 §2.7 D1 被否）。

**现状与对位（实读）**：桌面局部草稿先例已有两处、皆绑特定触发——探果径 `providers.draft`（`mount-settings-segments-providers.mjs:95-120`）· MCP 类型切换 `form.draft`（`mount-settings-segments.mjs:229-250`）；回填口 = `views/settings-controls.mjs:74-76`。其余表单（渠道新增 ∕ MCP 新增 ∕ 工具 key ∕ env shell ∕ 向导姓名+key）零保护。VSC 对位 = **逐卡就地重渲**且明文禁整树重建（`thincoder-vscode/webview/settings-providers.js:248-255`「A full buildSettings() rebuild would clobber in-progress edits in the other cards — forbidden by design」；同族 `settings-models.js:11`）。
**存量两专用快照保留**（零行为变更——总闸为网、专用为先）；「总闸落定后专用面收编」= 非阻塞观察（§2.8 报告 4）。

**落点（逐档）**：
- `thincoder-desktop/renderer/view-state.mjs`（**新档**）——快照族：`captureView(root)` ∕ `restoreView(root, snap)`（`snap = { scrolls, drafts, focus }`；scrolls 捕根 + `[data-view-scroll]` 标记件；drafts 逐控件 `{ value, checked, selectionStart, selectionEnd }`〔复选以 `checked` 纳域〕；focus = 域内 `activeElement` 按键回退链〔`id` → `data-field` → `data-action`（同键多例 ⇒ 以 `data-slot` 祖先限定）→ 结构路径兜底〕——相关件多无 `id`，真机面见 P2）。
- `thincoder-desktop/renderer/mount-settings.mjs`（**挂闸落点**——捕获 ∕ 复填包裹 `paintSettings` `:111-114`；`:105` 迟绑定穿透同门；两树一闸 ⇒ `views/settings.mjs` ∕ `views/onboarding.mjs` 零改）。
- 标记面（逐控件补 `[data-draft]`）：`views/settings-controls.mjs`（`fieldPair` :23-28 + 自定形 `name` 文本 :79 + 两 select :86-91 ∕ :92-97 + `active` 复选 :101-104）· `views/settings-sections-mcp.mjs`（表单字段组）· `views/settings-sections-tools.mjs`（工具 key 输入）· `views/settings-sections-env.mjs`（env shell 输入）——**后两档的具体控件行 = 实施轮届盘实读定位**（设计轮已核其段存在于 `settings.mjs:241-249` 段分派表）。

**判据（机检优先）**：
- M-604a：假 DOM 两轮重绘（`paintSettings` 径）——首轮于 `[data-draft]` 控件填值 + 勾选 ∕ 置焦 + 设光标 ⇒ 次轮（模型有变）重建 ⇒ 断言：同键控件值 ∕ `checked` ∕ 焦点 ∕ 光标区间 ∕ 根 scrollTop 保真。
- M-604b（负向锁）：非 `[data-draft]` 控件 ⇒ 重建后取**新模型值**（旧值零回写）。
- M-604c：捕获域断言——申报域（= 上列标记面清单）逐控件携 `[data-draft]`（源面扫描 ∕ 树面断言；写触发控件〔如 MCP 类型 select——改即写切片〕不在域，归 M-604b 负向锁面）。

**真机探针腿（P1）**：真 Electron——开设置面 ⇒ 渠道表单输入（含光标定位）⇒ 触发后台读数落地（`refreshSettings` 径，《`mount-settings.mjs:138-147`》）⇒ 读回值 ∕ 焦点 ∕ 光标 ∕ 根 scrollTop；向导同形（步骤 2 输入 ⇒ `loadModels` 落地 ⇒ 保真）。

### 2.3 机制设计 · #605（工具卡重建 · 复核闭档）

**机制 = 已消（不重做）**：#609 批（KD-RC-9）已落就地更新路径——`views/chat-tool.mjs:196-243` `patchToolCard`（头行分段刷 ∕ 结果区 `appendToolOutput` O(1) 追加；**节点身份不变**）；尾块分派 = `views/chat.mjs:229-231`（`kind==="tool"` ⇒ `patchToolCard`，不再整卡 `replaceWith`；余 replaceWith 仅限块型变 `:223-227`）。
**复用关系（注明）**：结果区增量 = 核件 `flow/stream.mjs` `appendToolOutput`（RENDER-CORE.md:75 KD-RC-9 / :211 导出面）——**直接复用，零第二实现**；本批不新建追加器。
**判据 = R-3（#609 在册 · 探针已 ✓）**：跨 chunk `.tool-result` scrollTop ∕ 选区保真 ∧ 节点身份不变；#609 §6 结算 = 探针亲跑 R-3 ✓（含「settleFrame 未传 mounted」实修一例，#609 §5.5-1）。
**本批动作 = 两件**：① 复核腿并入统一探针（P7，与 #609 探针同判据——防回归，非重测）；② 台账 #605 建议本批 §6 收口核销（判定 = 已消，见 §2.8 U3）。

### 2.4 机制设计 · #606（重建面位 ∕ 焦点保真族 · 六面）

**总修形（二分）**：**身份保真 = 键控差分**（同一元素跨帧复用——治「跨帧点按丢击 ∕ 原生控件开态被销毁 ∕ 身份不保」）；**位置 ∕ 状态保真 = 快照复填**（scrollTop ∕ 焦点 ∕ 光标 ∕ 展开集——治「重挂归零」）。逐面取法按可行性（下逐条）。

① **会话控制条**（`mount-sessions.mjs:104-118`——`:109` clear + 整条重建；条目锚 `views/session-control.mjs:147-152` `data-slot` = 会话键；下拉自滚 = `chrome.css:144` max-height 280px；触发 = `SESSION_KEYS` 含 `tabBadges`，`frame-dispatch.mjs:17`）。
修 = **条目键控差分 + 壳原位**：`mountSessionBar` 改「同键条目复用（标题 ∕ 元数据 ∕ 位标 ∕ 活动态 ∕ 行内钮原位更新）、增删差分、下拉壳不摘」；下拉（`.session-dropdown`——`chrome.css:137-145`）scrollTop 因壳不重建而自保。改名草稿复填保留（现制 `readDraft` ∕ `restoreDraft`，`:82-101`）。效果 = 开着下拉时位标变 ⇒ 条目节点身份不变 ⇒ scrollTop 保 + 悬停保 + 跨帧点按不丢。
② **会话头三控件**（`views/chrome.mjs:191-198` `mountHead` clear + 重建；select = `pickNode` `:130-146`；忙门 `:132-135`）。
修 = **键控就地更新**：`[data-field]` 节点同字段名复用；选项集差分（候选变才换 `option` 集）；busy 翻转只刷 `disabled` ∕ `aria-disabled`（不重建节点）⇒ 原生 select 开态不销毁。
③ **池两族**（`views/activity.mjs:55-89` `adoptPool`——审批 ∕ 队列族 `replaceWith` 原位重建；条目 `views/pool-tree.mjs:112-122` `data-prompt-id` ∕ `:126-133`）。
修 = **审批族键控差分**（键 = `promptId`，锚已在位）+ **队列族同形**（键 = 条目 `title`；注：队列族现「零写者 —— 族空恒不在场」，`pool-tree.mjs:124-125`——差分按将来态同形落）。
④ **locale 重挂六面**（`app.mjs:289-293` `applyFrame` locale 分支 + 分派六面；对话流重挂键 = `activeSession` ∕ `locale`（`app.mjs:10`）⇒ `views/chat.mjs:178-194` `mountChat` 清树重建；**重挂径零写回 ⇒ 流位归零**（`app.mjs:179-182` 重挂分支无贴底 ∕ 复原写））。
修 = **快照复填闸**：① 对话流——`mountChat` 前捕 `root.scrollTop` + 归档块展开集（`[data-block-id]` 键），重建后：`following` 真 ⇒ `stickToBottom(root)`；假 ⇒ 复原 scrollTop + 展开集（`open` 回真，不强制关闭）；② 其余五面——各挂载点以 `captureView` ∕ `restoreView` 包重建（滚位 ∕ 域内焦点）。实施落点 = 各挂载档（`mount-sessions.mjs` ∕ `views/chrome.mjs` ∕ `mount-status.mjs` ∕ `views/chat.mjs` ∕ `mount-pool.mjs` ∕ `mount-cards.mjs`——容器缺位零动作沿现制）。
⑤ **弱项两件**：**归档块重放**（`views/chat-subagent.mjs:46-63` `echoOf` 重建 = 展开态随重建归零）——由 ④ 展开集复填覆盖（`fillSubagentEcho` 幂等保持，`:62-66`）；**提示带重建**（`composer-sync.mjs:122-136` `paintNotices` 每同步 clear + 重建）——修 = **行集等价零写门**（行签名同 ⇒ 零写；变 ⇒ 原位改文本 ∕ 最小重建）。

**判据（机检优先）**：M-606a：逐面假 DOM 身份断言（tabBadges 翻转 ⇒ 会话条目 `data-slot` 节点引用不变；busy 翻转 ⇒ `[data-field]` select 引用不变；读数变 ⇒ 审批条目 `data-prompt-id` 引用不变）。M-606b：快照复填单测（scrollTop ∕ 焦点 ∕ open 集——含 `following` 两支）。M-606c：提示带签名门（同签名 ⇒ 零 DOM 写）。
**真机探针腿**：P2（会话条：开下拉 + 帧写 ⇒ scrollTop ∕ 节点身份 ∕ pointerdown→帧→pointerup 的 click 仍达 ∕ 焦点保真——条目置焦 ⇒ 帧写 ⇒ 焦点落回同键条目〔键回退链真机面〕）· P3（会话头：busy 翻转前后 select 节点引用不变）· P4（池：审批条目跨帧身份）· P5（对话流：following=false 滚中位 ⇒ 切 locale ⇒ scrollTop 守恒；归档块展开 ⇒ 切 locale ⇒ open 保持）。

### 2.5 机制设计 · #607（滚动策略族 · 抽核件 pin 工厂）

**机制 = 抽核件 `thincoder-render-core/scroll.mjs`（新档 · 一处实现四件）**；端只留帧调用点 ∕ 计数呈现 ∕ 钮形（KD-RC-8 ③ 帧模型不收核——不破定性边界）。四载体现状（实读）：
- 块内容区 = 核 `subblocks/block.mjs:91-121`（`initBlockFollow` ∕ `maybeScrollBlock`；阈 `NEAR_BOTTOM_PX` `:59`；让位三律 + 出口钮已收正）；
- 活动区（VSC）= `thincoder-vscode/webview/ui.js:178-193`（`scrollDown` ∕ `maybeScrollDown` ∕ `maybeScrollActivity`）+ `:208-221`（`initScrollFollow`——`< 24` 字面在 `:215`）；
- 池列（桌面）= `views/activity-new.mjs:29-40`（`nearBottom` ∕ `maybePinPool`）+ `:104-107`（scroll 订阅）；阈引 `FOLLOW_PX`（`views/chat-scroll.mjs:15`）；
- 对话流（桌面）= `views/chat-scroll.mjs:15-36`（`FOLLOW_PX` ∕ `scrollAction`）+ `:56-70`（`tailAction` ∕ `stickToBottom`）+ `:83-103`（`attachScroll`）；消费 `views/chat.mjs:277-278`。

**导出面（四件）**：
1. `NEAR_BOTTOM_PX = 24`（**唯一数值源**；`subblocks/block.mjs` 改再出口保名——沿「同名 re-export 消费面零改」先例；`views/chat-scroll.mjs` `FOLLOW_PX` 同改再出口）；
2. `nearBottom(el)`（三读数归一 + 严格小于——判据逐字同式）；
3. `applyPin(el, gate)`（**旗标门 `!== false` ⇒ 写 `scrollTop = MAX` 超值不读 `scrollHeight`**——写口单源）；
4. `createPinWatch(el, { holder = el, flagKey, gestureGateMs, onNearBottom, onGesture })` → `{ read, set, attach, detach }`（**旗标宿主 = `holder`**〔缺省 = `el`；VSC 面 = `ctx`〕——旗标维护单源 = `holder[flagKey]`：近底 ⇒ 无条件翻真（自愈）＋ `onNearBottom` 回调（近底清账路）；远离底 ⇒ `gestureGateMs` 内手势翻假（块 = 600 沿 KD-RC-8 让位三律）∥ `gestureGateMs = 0` ⇒ 滚动事件按近底直写（活动区 ∕ 池列 ∕ 对话流现行语义——**零行为变更**）；非手势位移不改旗标）+ `createUnreadCounter(el, { countKey })`（计数簿记 `bump` ∕ `clear` ∕ `read`——清账三路：钮点击 ∕ 近底（watch 回调）∕ 换代（随元素灭 + 挂载点复位））。

**端调用点（逐端置换——全部零行为变更，纯同语义置换）**：核块载体改调工厂（删本地实现，`block.mjs:91-121` 缩为薄包）+ 出口钮自持面保留；VSC `ui.js` 四函数改工厂调用（`initScrollFollow` ∕ `scrollDown` ∕ `maybeScrollDown` ∕ `maybeScrollActivity`——旗标宿主 `holder = ctx`：`_pinBottom` ∕ `_pinActivity` 两键名与跨档共读面保持；事件集保持 `wheel` ∕ `touchmove` ∕ `scroll`〔`:217`〕）;桌面 `activity-new.mjs` `maybePinPool` ∕ `nearBottom` 改工厂（`_poolPin` 保持）；桌面 `chat-scroll.mjs` `stickToBottom` → `applyPin`、`scrollAction` 跟随判据 → `nearBottom`。
**手势门收编（其余三载体是否随收 KD-RC-8 让位三律）= 上抛 U1**（预置 = 键盘径残余真机核——KD-RC-8 在册；见 §2.8）。

**余两实读项（同族清算）**：
- **落位不变式**（出生位 ∕ 归档入流「不变式缺」——`subblocks/state.mjs:10` 留端句）：设计落 = 核档 §5 增两条不变式（出生位 = 活动区区尾 append；归档入流 = 消化边界前插入、边界失效 ⇒ 尾追）+ 端实现锚（VSC `activity.js:60` ∕ `:104-110`；桌面 `pool-subagents.mjs:85-95` ∕ `subagent-reduce.mjs:93-112`）。
- **窗限数值差 150 ∥ 200**（`RENDER-CORE.md:158` 行 13）：**判定 = 非同判据**（桌面 `MAX_RENDER_BLOCKS`（`chat-scroll.mjs:19`）= **初始渲染窗**（`nextWindow` 只增——backfill 增窗）；VSC `MAX_MESSAGE_BLOCKS`（`ui.js:198`）= **DOM 裁剪帽**——参数化对象不同）⇒ 登记句就地收正为给由（零行为改；见 §2.7 D5）。

**判据（机检优先）**：M-607a：工厂平 node 单测（`nearBottom` 边界 23 ∕ 24 ∕ 25；`applyPin` 两向；`createPinWatch` 三律（假钟 ∕ 假事件）+ `count` 清账单测）。M-607b：**零本地判据副本源扫描**——四载体档内零 `scrollHeight - ` 判据表达式 ∕ 零 `24` 字面（除工厂）；载体皆引工厂导出。M-607c：对拍腿升级——#603 批件（`docs/batches/2026-09-29-subblock-follow-resume.test.mjs:629-688` ⑥A11 源面断言）升级为「工厂单源 + 消费面断言」（判据漂移 = 缺陷）。
**真机探针腿（P6 · 四载体）**：真 Electron 块内容区 ∕ 池列 ∕ 对话流三载体（真滚轮上滚 ⇒ 旗标假 ⇒ 新内容帧零写；近底 ⇒ 复钉；出口钮 ∕ 计数钮清账）+ VSC 面零回归（批内件对拍 + 结构判据——改指零行为变更；VSC 套件零触）。

### 2.6 机制设计 · #608 ∕ #581（留端未接族 + 段 14）

**#608 四项 + 效果执行（逐项）**：
① **痕迹** ∕ ② **丢弃痕迹**——**判定 = 不接（给由）**：核状态机痕迹钩 = deps 可选缺省 no-op（`subblocks/state.mjs:91` ∕ `:328`）；VSC 面绑定 = `webview/activity.js:36-43`（trace ∕ onChannelReset）+ 内容面丢弃痕 `streaming.js:171-179`（`drop-frozen` ∕ `drop-tombstone`，去重版）；桌面零注入（`subagent-reduce.mjs:128` deps 仅 `{ now }`；丢弃径 `:149-150` 静默 return）。**给由**：痕迹族 = 端观测面（VSC `activity-diag.js` 判定 = 端——`RENDER-CORE.md:84` 行 1），桌面无诊断上行面；不接 = 零行为差异（缺省 no-op）。落点 = `subblocks/state.mjs` 档头痕迹钩分面句 + `subblocks/block.mjs:5-11` 留端清单句就地收正（「痕迹 = 端观测面——桌面无上行面 ⇒ 不接（给由）」）+ RENDER-CORE.md 判定句。到期 = 桌面诊断面需求出现（届时随该面一并接）。
③ **`resetActivity`**——**判定 = 已在位（文件面收正）**：桌面 `resetSubBlocks`（`subagent-reduce.mjs:157-168`，件头自载「`resetActivity` 语义接（R5 · #522① —— VSC `activity.js:180-189` 同义）」）；VSC 现址 `activity.js:163-173`。落点 = `subblocks/state.mjs:12` 留端句收正为「端复位面（VSC `resetActivity` ∕ 桌面 `resetSubBlocks`）」；零行为改。
④ **说明行判重 ∕ 插入点**（逐项核 + 修）：插入点 = 桌面 ∕ VSC 同形（`pool-subagents.mjs:88` `insertBefore(desc, .advisor-content)` ∥ VSC `activity.js:58`）——**保持**；判重 = 现行偏差——桌面 DOM 判据（`pool-subagents.mjs:87`：族内零块 ∧ 无 `.sub-desc`）在「首块移除（queued 取消）后再出生」边角会**重插**，VSC 会话级旗标（`S._subDescShown`——`activity.js:53-54`；`state.js:42`）**不重插**。修 = **会话级 ∕ 池代级旗标**（池宿主 `root._subDescShown`，换代点复位——`views/activity.mjs:105-112` 既有换代清账点）；判据 = 与 VSC 同判（一次说明）。
**效果执行两法择一**——**择一 = 语义准（核 effects：有序 + 执行时解析，`subblocks/state.mjs:28-30`）**；实现法 = 端内自持（VSC 按序执行 `activity.js:69-97`；桌面幂等派生 `subagent-reduce.mjs:82-112` ∕ `pool-subagents.mjs:99-118`）；**对拍腿 = 本批新增平 node 等价件**（同 reducer 输出 ⇒ 桌面派生动作集 ≡ 核 effects 语义集；逐迁 born ∕ takeover ∕ fold ∕ awaiting ∕ archive ∕ remove）。被否见 §2.7 D6。

**判据（机检优先）**：M-608a：对拍件（逐迁等价表）；M-608b：说明行两例（首出生 ⇒ desc 在场；首块移除后再出生 ⇒ **不再插**）；M-608c：文档面机检（核两档留端句收正在位——给定词组零残留）。**真机 P9**：子代理 queued 取消 ⇒ 再出生 ⇒ 无第二说明行。

**#581（段 14 · 窗内提示态 · 并入本批）**：
**机制 = 第二支判据扩 `susp`**：`enterSegment` 现行三判（队 ≥1 ⇒ 条数句；忙（`running`）∧ 队空 ⇒ 排队句；静 ⇒ `Enter: send`）——窗在场 ∧ 队空 ∧ 非忙 ⇒ 现仍出 send 句（与「窗内 Enter = 入队」不符——同族「显示说谎」残留）。修 = 第二支判据 `codes.includes("running") || suspActive` ⇒ 排队句。
**落点**：`views/statusline-segments.mjs:215-224`（`enterSegment` 判据扩）+ `views/statusline.mjs:72-87`（装配传 `suspend`——`:68` 已取值，零新切片）；判据单源 = `views/chrome.mjs:76-78` `suspActiveOf`；`STATUS_KEYS` 已含 `susp`（`mount-status.mjs:22`）⇒ 零键增；词键复用 `status.queue.enter`（**零新键 ⇒ i18n.mjs 零触**）。
**判据**：M-581：`enterSegment` 直测四态（队>0 ⇒ 计数句；忙 ⇒ 排队句；**窗 ∧ 非忙 ⇒ 排队句**；静 ⇒ send 句）。**真机 P8**：后台子代理 running ⇒ 主回合收（窗在场）⇒ 段 14 = 排队句 ⇒ 提交 ⇒ 段 14 = 计数句（N=1）∧ 流内零块。
**边界**：段 14 形态 ∕ 其余 16 段零改；UI.md 段 14 行措辞随动（「三态」⇒ 判据四路）。

### 2.7 关键决策（D1–D8 · 被否候选在册）

- **D1（#604 修法）= 草稿保真总闸（快照复填）**。被否：**分段就地更新**（全树逐段差分——面大 · 低频繁面收益不足；VSC 逐卡重渲 = 端内形态不移植）；被否：**全模型差分门**（settings 模型比较件成本 ≫ 收益——低频繁面不做）。
- **D2（#606①–③）= 身份保真取键控差分**。被否：**快照复填 alone**（元素身份不保——跨帧点按丢击 ∕ 原生 select 开态不可快照）；被否：**抑制重挂**（状态陈旧）。
- **D3（#606④）= 位置 ∕ 状态保真取快照复填**。被否：**locale 免重挂**（文案就地更新面大）；被否：**接受归零**（无由 · 用户可辨）。
- **D4（#607）= 工厂落核 `thincoder-render-core/scroll.mjs`（判据 ∕ 写门 ∕ 旗标维护 ∕ 计数簿记四件）**；端只留帧调用点 ∕ 计数呈现 ∕ 钮形。被否：**只抽判据**（旗标维护仍四份——漏面未清）；被否：**工厂住端内共享件**（非核 = 双端第二实现）；**手势门全族统一 = 本期不采**（见 §2.8 U1）。
- **D5（窗限数值差 150 ∥ 200）= 判定非同判据**（初始渲染窗 ∥ DOM 裁剪帽——参数化对象不同）⇒ `RENDER-CORE.md:158` 行 13 登记句收正为给由（零行为改）。被否：**数值对齐**（参数语义不同 ⇒ 假统一；两值皆无用户可辨差）。
- **D6（效果执行）= 语义准 = 核 effects；实现法端内自持 + 等价对拍腿**。被否：**全端统一派生**（VSC webview 重写——无用户收益）；被否：**全端统一执行**（桌面反架构——reducer 零 DOM）。
- **D7（#581）= 并入本批**。被否：**另轮**（无载体优势——本轮即其建议载体「下一桌面码面轮」；挂账延续）。先例说明：statusline-cli-gap 批「不并轨」依据 = 该批「只动两段」面收窄——本批无该约束，不构成抵。
- **D8（#605）= 不重做**（#609 已消 + R-3 探针 ✓）。被否：重做 ∕ 第二实现（重复面）。

### 2.8 上抛项 ∕ 报告项

- **U1 · 手势门收编裁定**：#607 后其余三载体是否随收 KD-RC-8 让位三律（手势门 600ms）？前置 = 键盘径残余真机核（KD-RC-8 在册未决）；建议 = 随该残余一并裁（另小修），本批不随收（D4 被否项）。若父侧即裁随收 ⇒ 波 3 加参数即可（工厂已参数化）。
- **U2 · 设计档随动（实施前硬前置 · 已裁）**：六档（清单 = §2.1）写权 = 设计面（单一落手）；本轮写域仅本 §2 ⇒ 未落。定为实施前硬前置：落定后方可开实施波（全波共同门——§2.10）；未落定前 §2.5 工厂面与核档在册描述不一致（`RENDER-CORE.md:171` 核不夺句 ∕ `:74` KD-RC-8 ④）仍在——落定即消。
- **U3 · 台账闭档建议**：#605（复核闭档）· #608①②③（给由收正即闭）——建议随 §6 收口核销；#604 ∕ #606 ∕ #607 ∕ #581 待实施核销。
- **U4 · `mount-sessions.mjs` 双写者（跨批 · 定序已裁）**：兄弟批 `structure-split-round` 拆 ∕ 本批 #606①（`:104-118`）同档 ⇒ 须串行；定序 = 该批拆先落（该批 §2.9① 父侧裁定 · 2026-09-29）⇒ 拆分先落 ⇒ 本批行基与差分区段届盘重钉（§2.9 避让注 ∕ §2.10 波 2 依赖同拍）。在册备查——无待裁。
- **报告 1**：归因订正——#605 所述核 `appendToolOutput` = #609 批落地（§2.1）。
- **报告 2**：#606③ 队列族实读「零写者 ⇒ 族恒空」（`pool-tree.mjs:124-125`）——差分按将来态同形落，当前无可见面。
- **报告 3**：需求档零改判定——本批条目 = 台账在册缺陷的修复面（对齐口径需求行已在位）；如需求面需补行（如设置面草稿保真入需求档），父侧另判。
- **报告 4**（非阻塞观察）：#604 存量两专用草稿快照（`providers.draft` ∕ `mcp.form.draft`）保留；「总闸落定后专用面收编」= 后续可选（另轮）。

### 2.9 受影响文件表（现行 ⇒ 预期 · 设计轮实读）

行数 = 设计轮实读 ＋ 修正轮届盘复读（2026-09-29——五档空注已补齐，无「届盘实读」余档；实施轮前逐档复核；行宽核 = ≤300 顾问线 ∕ ≤500 硬线，临线档见注）。

| # | 档 | 现行 ⇒ 预期 | 面 |
|---|---|---|---|
| 1 | `thincoder-desktop/renderer/view-state.mjs`（**新**） | 新 ≈90（快照族：captureView ∕ restoreView） | #604 ∕ #606④⑤ |
| 2 | `renderer/mount-settings.mjs`（挂闸落点——`views/settings.mjs` 零改） | 153 ⇒ ≈166（`paintSettings` 单闸两树——捕获 ∕ 复填） | #604 |
| 3 | `renderer/views/onboarding.mjs` | ≈162 ⇒ ≈162（零改——向导经同闸） | #604 |
| 4 | `renderer/views/settings-controls.mjs` | 131 ⇒ ≈140（标记面四组：`fieldPair` + 自定形 `name` + 两 select + `active` 复选） | #604 |
| 5 | `renderer/views/settings-sections-mcp.mjs` | 179 ⇒ ≈181（表单字段组标记） | #604 |
| 6 | `renderer/views/settings-sections-tools.mjs` | 162 ⇒ ≈164（工具 key 输入标记） | #604 |
| 7 | `renderer/views/settings-sections-env.mjs` | 135 ⇒ ≈137（env shell 输入标记） | #604 |
| 8 | `renderer/mount-sessions.mjs` | 407 ⇒ ≈430（条目差分 + 快照；**跨批避让**——拆分先落 ∕ 届盘重钉，见下注） | #606① |
| 9 | `renderer/views/session-control.mjs` | 225 ⇒ ≈240（差分辅助 ∕ 条目构建） | #606① |
| 10 | `renderer/views/chrome.mjs` | 199 ⇒ ≈215（syncHead 就地更新） | #606② |
| 11 | `renderer/views/activity.mjs` | ≈154 ⇒ ≈175（两族差分） | #606③ |
| 12 | `renderer/views/chat.mjs` | 284 ⇒ ≈292（重挂径位 ∕ 展开集复填） | #606④ |
| 13 | `renderer/views/chat-subagent.mjs` | ≈78 ⇒ ≈80（展开集协作） | #606⑤ |
| 14 | `renderer/composer-sync.mjs` | 283 ⇒ ≈290（提示带签名门） | #606⑤ |
| 15 | 核 `thincoder-render-core/scroll.mjs`（**新**） | 新 ≈120（四件） | #607 |
| 16 | 核 `subblocks/block.mjs` | 121 ⇒ ≈100（改薄包 + 再出口保名） | #607 |
| 17 | `renderer/views/activity-new.mjs` | ≈109 ⇒ ≈105（改工厂消费） | #607 |
| 18 | `renderer/views/chat-scroll.mjs` | ≈103 ⇒ ≈105（改工厂消费 ∕ 再出口保名） | #607 |
| 19 | VSC `webview/ui.js` | 221 ⇒ 约 201（四函数改工厂调用——零行为变更） | #607 |
| 20 | `renderer/views/pool-subagents.mjs` | ≈127 ⇒ ≈135（说明行旗标） | #608④ |
| 21 | 核 `subblocks/state.mjs` | ≈330 ⇒ 零码改（档头留端句收正 ×2） | #608①–③ |
| 22 | `renderer/views/statusline-segments.mjs` | ≈225 ⇒ ≈228（enterSegment 判据扩） | #581 |
| 23 | `renderer/views/statusline.mjs` | 205 ⇒ ≈208（装配传 suspend） | #581 |
| 24 | 批内件（**新**）：`docs/batches/2026-09-29-desktop-rebuild-fidelity.test.mjs` · `…-probe.mjs` | 随实施波落 | 全批 |

**临线注**：`app.mjs`（299）· `chat-tool.mjs`（299）本批**零改**（调用点收在挂载档内）；核 `subblocks/state.mjs` ≈330 已越顾问线（既有，本批零码增——仅档头句）；`views/chat.mjs` 284 ⇒ ≈292 仍在 300 内（越线则禁增 ⇒ 计划面出档，沿先例）。

**越线句（两档 · 修正轮补）**：
- **`views/settings.mjs`**（334）：在册预案 = `PROJECT.md:240/:294`（段体续拆）——续期窗口 = 设置面族在飞批落定（本批落定后重评；本批 #604 即其重建形态变更）；**本批零增行**（挂闸落 `mount-settings.mjs`——行 2）⇒ 不改变消解窗口。
- **`mount-sessions.mjs`**（407）：在册预案 = `PROJECT.md:219/:292`（拆 ⇒ ≈245 ∕ 新档 `session-wire.mjs`，承接批 = `structure-split-round`〔在飞〕）；本批增行不改变消解窗口——拆分先落、本批增行落于拆后基（≈245 + ≈23 ⇒ ≈268——300 内）；届盘重钉见下行。

**跨批避让注（行 8）**：`mount-sessions.mjs` 双写者——兄弟批 `structure-split-round`（迁 `:244-406`）与本批 #606①（动 `:104-118`）同档 ⇒ 须串行；**定序已裁 = 拆分先落**（该批 §2.9① 父侧裁定）⇒ 拆分先落 ⇒ 本批行基与差分区段届盘重钉（行数 ∕ `:104-118` 按拆后实读复核；见 §2.8 U4）。
**文档面（随动六档 + 核两档档头）= §2.1 清单**；写权与落手 = §2.8 U2。

### 2.10 实施分批建议（五波 · 每波 ≤15 档 · 跨面拆批）

| 波 | 面 | 档集（编号 = 上表） | 批内件 | 依赖 |
|---|---|---|---|---|
| 波 1 | #604 设置 ∕ 向导 | 1–7 | M-604 a/b/c + P1 | **U2（全波共同门）**＋无其他（先落——闸件为波 2 复用） |
| 波 2 | #606 重建保真族 | 8–14（+1 复用） | M-606 a/b/c + P2–P5 | 波 1（view-state.mjs）＋ **`structure-split-round` 拆先落**（跨批串行——`mount-sessions.mjs` 双写者：拆分先落 ⇒ 本批行基与差分区段届盘重钉；见 §2.9 避让注 ∕ U4） |
| 波 3 | #607 滚动策略族（**核 ∕ 桌面 ∕ VSC 三面文件互斥——可并行**） | 15–19 | M-607 a/b/c + P6 | 无（与波 1 ∕ 2 文件互斥） |
| 波 4 | #608 留端未接 | 20–21 + 核档句 | M-608 a/b/c + P9 | 波 2（#606③ 同档邻位——pool-subagents） |
| 波 5 | #581 段 14 | 22–23 | M-581 + P8 | 无 |

纪律：**全波共同门 = U2（设计档随动落定——实施前硬前置；落定前零波开工）**；每波 = 批内件随批留存（仓套件不写 ∕ 不改 ∕ 不跑——全清令）；真机腿 = 统一探针件（P1–P9 —— 真 Electron + 真交互驱动，父侧亲跑闭合）；VSC 面改动只限波 3（`ui.js`——改指零行为变更（批内件对拍）；VSC 套件零触）。

### 2.11 验收对照（AC · 逐条回指台账判据）

| AC | 判据（机检 · 批内件优先） | 真机腿 |
|---|---|---|
| AC-1（#604） | 任一 settings 切片写落地不得清未提交草稿——M-604a（保真）· M-604b（非 draft 控件负向锁）· M-604c（捕获域） | P1（设置 + 向导两径） |
| AC-2（#605） | 重建前后 `.tool-result` scrollTop ∕ 选区保真 + 节点身份不变（#609 R-3 判据在册——本批复核） | P7（防回归，非重测） |
| AC-3（#606） | 同一元素身份 ∕ 位 ∕ 焦 ∕ 选 ∕ 展开集保真——M-606a（三面身份）· M-606b（快照复填）· M-606c（提示带零写门） | P2–P5 |
| AC-4（#607） | 四载体判据同源（工厂单源 ∕ 零本地副本）且行为零变更——M-607a（工厂）· M-607b（源扫描）· M-607c（对拍腿升级） | P6（四载体） |
| AC-5（#608） | 四项逐项收口（痕迹 ∕ 丢弃痕 ∕ resetActivity = 给由收正；说明行 = 修）——M-608a（效果等价）· M-608b（说明行两例）· M-608c（文档面） | P9 |
| AC-6（#581） | 窗在场 ∧ 队空 ∧ 非忙 ⇒ 段文 = 排队句——M-581（四态直测） | P8 |
| AC-7（族面） | i18n.mjs 零触（零新键零退键——`views/i18n*` 计数链如被机检触碰则须 Δ=0）；VSC 面零行为变更（波 3 结构性判据）；批内件随批留存 | — |

**补记（设计轮读回 · 节号勘误）**：§2.1 文内「逐条…见 §2.3」应读作 **见 §2.2–§2.6**（逐行机制设计节：#604 = §2.2 · #605 = §2.3 · #606 = §2.4 · #607 = §2.5 · #608 ∕ #581 = §2.6）；另两处排版笔误（§2.1「增量刷新路径』」引号混用 · §2.2 一处《》包引）——不影响语义，沿 append-only 纪律不就地改写。

### §2 修正块（评审修正轮 · §3 轮次 1 九发现 · 2026-09-29 · eng-designer）

**轮次**：§3 轮次 1（设计评审 · pass · 🔴0 ∕ 🟡8 ∕ 🔵1）——九发现经父侧逐条裁定**全数受理**；本块 = 逐条落修记录。**就地修正 = 本作者段内**（修正点已直接落 §2 对应行；原行可由 git 历史逐字复核）；零产品码 ∕ 他档零改（六档设计面随动仍待 U2）∕ §3 零改；仓套件零触；未 commit；未碰台账；未发起评审。

| # | 处置 | 落点（§2 内 · 修正后行位） |
|---|---|---|
| 1 | 避让-串行句（含「拆分先落 ⇒ 行基与差分区段届盘重钉」）+ 双写者定序立 U4 | §2.9 行 8（L168）· 越线句 ∕ 跨批避让注（L188-192）· §2.10 波 2 依赖（L200）· §2.8 U4（L149） |
| 2 | 五档补现读行数 + Δ | §2.9 行 5 ∕ 6 ∕ 7 ∕ 9 ∕ 19（L165-167 ∕ L169 ∕ L179）——179 ⇒ ≈181 ∕ 162 ⇒ ≈164 ∕ 135 ⇒ ≈137 ∕ 225 ⇒ ≈240 ∕ 221 ⇒ 约 201 |
| 3 | 越线两档择一（给由）：`views/settings.mjs` = 挂闸上收 `mount-settings.mjs`（零增行）∥ `mount-sessions.mjs` = 越线句（拆先落 ⇒ 增行落于拆后基） | §2.2（L50-51 ∕ L59）· §2.9 行 2 ∕ 3（L162-163）· 越线句（L188-190） |
| 4 | 导出面增旗标宿主 `holder`（缺省 = `el`；VSC = `ctx`）+ 端调用点四函数 ∕ 事件集写明 | §2.5 件 4（L105）· 端调用点（L107） |
| 5 | 枚举补 `settings-controls.mjs:79` ∕ `:101-104` + schema 增 `checked` + M-604c 收窄为申报域 | §2.2 标记面（L60）· schema（L58）· M-604a ∕ M-604c（L63 ∕ L65）· §2.9 行 4（L164） |
| 6 | 焦点键回退链（`id` → `data-field` → `data-action` → 结构路径）+ 焦点断言入 P2 | §2.2 view-state（L58）· §2.4 P2（L91） |
| 7 | 纪律行改述（改指零行为变更〔批内件对拍〕+ VSC 套件零触） | §2.10 纪律（L205）· §2.5 P6（L115） |
| 8 | U2 定为实施前硬前置 + 并入波次依赖（全波共同门） | §2.8 U2（L147）· §2.10 波 1 依赖（L199）∕ 纪律（L205）· §2.1 随动清单注（L45） |
| 9 | 引注收正两处 | §2.6②（L120）· §2.4①（L81） |

**决策披露（均在发现射程内）**：① 越线两档取「挂闸上收」——由 = `paintSettings`（`mount-settings.mjs:111-114`）为两树唯一重绘点（`:105` 迟绑定 ∕ `:123-128` 订阅 ∕ `:130` 初绘三径全覆盖；盘上 `mountSettings` ∕ `mountWizard` 调用点唯此一处）＋ 越线档零增行；② 旗标宿主取「`holder` 参数」式（保持旗标维护单源——非 VSC 自持副本）；③ `[data-draft]` 取值作无 `id` 控件显式键；④ 复选以 `checked` 纳捕获域；⑤ M-604c 收窄为「申报域逐控件」（写触发控件归 M-604b 负向锁面）。

**行数口径**：五档 = 届盘复读 2026-09-29（±1 口径内与评审抽核一致）；§2.9 表头注同拍。**联动**：状态行上抛计数 U1–U3 ⇒ **U1–U4**；§2.1 随动清单注同步（U2 = 硬前置）。

**射程外披露（不入本轮落修 · 报告父侧）**：① `docs/desktop/design/PROJECT.md:237` 记 `renderer/views/activity.mjs` **262**（实读 2026-09-29 · 重锚口）——盘上实读 **154**（与 §2.9 行 11 ∕ §3 抽核一致）⇒ 差异备查，建议随 U2 六档随动时收正（他档——本轮零改）；② §1 行 15 `activity.mjs:178-185` 盘上不存在（§3 射程外注记同拍；§1 非本作者段）。

### §2 追加块（U2 设计档随动 · 全波共同门落定 · 2026-09-29 · eng-designer）

**落定 = 消不一致**：§2.5 工厂面与核档在册描述的不一致（`docs/render-core/design/RENDER-CORE.md`「核不夺句」∕ KD-RC-8 ④——评审 §3 轮次 1 发现 8 所指）已消——④ 收正为「滚动策略族 = 核抽核件」（判据 ∕ 写门 ∕ 旗标维护 ∕ 计数簿记四件入核 `thincoder-render-core/scroll.mjs`；端 = 工厂消费）；「核不夺」口径限定段随拍（行 13 ∕ 行 14 实现各端自持；行 15 随族同源）。**U2（实施前硬前置）落定 ⇒ §2.10 全波共同门满足（实施波可开）**——五档已落；核两档档头（`subblocks/state.mjs` ∕ `block.mjs`）= 代码面，随代码波同笔。

**逐处表（档 → 落点 → 落值）**：

| # | 档 | 落点（终态行位） | 落值 |
|---|---|---|---|
| 1 | `RENDER-CORE.md` | §2 KD-RC-8 ④（L74） | 「端实现 = 契约适配器」⇒ **核抽核件**（四件入核；端 = 工厂消费——帧调用点 ∕ 计数呈现 ∕ 钮形；对拍腿升级 = 工厂单源 + 消费面断言） |
| 2 | 同 | §4 口径限定段（L172-173） | 核不夺 = **行 13 ∕ 行 14**；族实现 = 核抽核件（与 ④ 自洽——落定即消） |
| 3 | 同 | §4 行 13（L159，窗限数值差） | 「数值差登记」⇒ **判定 = 非同判据（给由）**（初始渲染窗 ∥ DOM 裁剪帽） |
| 4 | 同 | §3 行 1（L85，activity-diag） | 补**痕迹族给由句**（端观测面 ⇒ 桌面不接——无诊断上行面；缺省 no-op ⇒ 零行为差异——#608①） |
| 5 | 同 | §5（L177 ∕ L221-225） | 增**滚动策略族**导出面（「四族 ⇒ 五族」——NEAR_BOTTOM_PX ∕ nearBottom ∕ applyPin ∕ createPinWatch ∕ createUnreadCounter）+ **落位不变式两条**（L209-210——出生位 ∕ 归档入流，端实现锚在册） |
| 6 | 同 | §6（L348-351） | 增本批随动段（核 scroll.mjs 拟新增 ≈120 ∕ block 121 ⇒ ≈100 ∕ state ≈330 零码改；VSC ui.js 221 ⇒ 约 201；桌面指 PROJECT §4.2） |
| 7 | 同 | 变更记录（L470-471） | 一行（同笔） |
| 8 | `RENDERER.md` | §1.1（L102-107） | 增**重建保真族**条（二分修形 ∕ 快照族 `view-state.mjs` ∕ 草稿保真闸 ∕ 弱项两件） |
| 9 | 同 | §3（L136-137 ∕ L150-152 ∕ L155-156） | 跟滚判据 → 核工厂 `nearBottom`；池区旗标维护改工厂 ∕「端 = 契约适配器」收正；增**滚动策略族工厂化**条（两档改工厂消费） |
| 10 | 同 | 变更记录（尾） | 一行 |
| 11 | `UI.md` | §1（L563-571） | 增**本批注（桌面重建保真 + 留端清算族 · 2026-09-29）**六项（#604 ∕ #606 ∕ #607 ∕ #608 ∕ #581 ∕ D3 计数） |
| 12 | 同 | 表行 14（L118）∕「屏面为准」注项 4（L203）∕「挂起窗径」注项 5（L511） | 「三态」⇒ **判据四路**（收正三处——窗在场 ∧ 非忙 ⇒ 排队句） |
| 13 | 同 | 变更记录（尾） | 一行 |
| 14 | `PROJECT.md` | §4.2（L750-776） | 增本批「现行 ⇒ 预期」块（二十四行；跨批避让注在册） |
| 15 | 同 | §10（L1092） | 增 **CN** 行（U1 手势门收编 ∕ U3 台账闭档建议 ∕ U4 双写者定序 ∕ 报告三项） |
| 16 | 同 | 变更记录（尾） | 一行 |
| 17 | `WEBVIEW.md` | §5.5（L414-416） | 增**滚动策略族工厂化条**（VSC 消费收正——四函数改工厂 ∕ 旗标宿主 `ctx` ∕ 事件集保持；零行为变更） |
| 18 | 同 | 变更记录（尾） | 一行 |

**读回核实（D6）**：18 处逐处读回在位（RENDER-CORE §5 条目序 = 4 → 5 → 端注入面 ✓；UI 本批注六项序 ✓；PROJECT §4.2 块位于 i18n 块后 ∕ §5 前 ✓；CN 行在 CM 后 ✓）。
**机检对拍（`node scripts/doc-check.mjs` · 前基准 + 三跑）**：**本批写域零新增入闸红**——悬空 161 ⇒ 161（同值）；新增 13 条 = 全部「拟新增——列报 · 不入闸」（`scroll.mjs` ∕ `view-state.mjs` 前向引用）；行宽 82 ⇒ 81（净 −1——触行修净一处、新增零）。
**披露**：① 随动中途曾新增 1 处入闸红（WEBVIEW 变更行漏「拟新增」标记）+ 8 处新增行超 300 字符——终跑前逐处点修（现盘已净）；② UI.md 两处注项「三态」残句 = 一致性面就地收正（与表行 14 同句域——报告）；③ 核两档档头句不在本轮——随代码波；④ 诊断件落 `.thincoder/tmp/u2-check-*.txt` ∕ `u2-scratch/`（临时面，不入档）。
**零触**：产品码零触 · §1 ∕ §3 零改 · 台账零写 · 不发起评审（父侧门）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

| # | 类别 | 级别 | 问题 | 建议 |
|---|------|------|------|------|
| 1 | Scope·跨批协调 | 🟡 | `mount-sessions.mjs` 双写者未随设计在册：sibling 批 `docs/batches/2026-09-29-structure-split-round.md:82` 已列本批为同档冲突（该批迁 `:244-406` ∕ 本批动 `:104-118`）⇒「须串行」，`:111` 上抛①（请定序），`:122` 建议该批拆先落（rebuild-fidelity #606 其后届盘重读）；`docs/desktop/design/PROJECT.md:219/:292` 载 406 ⇒ ≈245 拆分计划；本设计 §2.9 行 8（407 ⇒ ≈430）与 §2.10 各波依赖全无该避让/串行句 | §2.9 行 8 与 §2.10 补避让-串行句（含「拆分先落 ⇒ 行基与差分区段届盘重钉」），并把「双写者定序」立为在册上抛项 |
| 2 | 受影响文件行注 | 🟡 | 五档缺现读行数（标「届盘实读」）：行 5 `views/settings-sections-mcp.mjs` · 行 6 `views/settings-sections-tools.mjs` · 行 7 `views/settings-sections-env.mjs` · 行 9 `views/session-control.mjs` · 行 19 VSC `webview/ui.js`；抽核实读 = 179 ∕ 162 ∕ 135 ∕ 225 ∕ 221（皆远低 300 线——风险低，但按行注判据须补） | 补现读行数 + Δ（或统一注「≤300 核：实读 N 行，无越层」） |
| 3 | 受影响文件行注 | 🟡 | 已越 300 顾问线且被本批增行两档无越线/拆分句：`views/settings.mjs` 334 ⇒ ≈340（行 2）· `renderer/mount-sessions.mjs` 407 ⇒ ≈430（行 8）；临线注只谈 app.mjs ∕ chat-tool.mjs ∕ state.mjs ∕ chat.mjs（且自设「越线则禁增 ⇒ 计划面出档」惯例）；在册预案 = `PROJECT.md:240/:294`（settings 段体续拆）· `:219/:292`（mount-sessions 拆 ⇒ ≈245） | 两行补越线句（引在册预案 + 本批增行是否改变消解窗口），或把挂闸改落未越线档（如 `mount-settings.mjs` 调用点）以免增行 |
| 4 | Clarity·可行性（#607） | 🟡 | 工厂签名 `createPinWatch(el, { flagKey, … })` 只能表「旗标挂 el」；VSC 旗标挂 `ctx`（`ui.js:181/:185/:191/:212-213/:219-220`，跨档共读 `activity-new.js:64/:68` · `activity.js:62`）⇒ 按现签名 VSC「零行为变更」不成立；端调用点亦未点 `initScrollFollow` 与现三事件集（wheel/touchmove/scroll，`ui.js:217`）是否随收 | 导出面增旗标宿主参数（`holder`，缺省 = el）或点明 VSC 适配层自持 ctx 旗标；端调用点节写明改造函数集与事件集 |
| 5 | 需求覆盖·#604 | 🟡 | 标记面枚举与自身判据 M-604c「各表单控件皆携 `[data-draft]`」相抵：`views/settings-controls.mjs` 只列 `fieldPair:23-28` + 两 select（`:86-91 ∕ :92-97`），未列自定形 `name` 文本输入（`:79`——非经 fieldPair 建）与 `active` 复选（`:101-104`）⇒ 按枚举实施则渠道名草稿仍被清 ∕ M-604c 不达；且快照 schema（值 ∕ 焦 ∕ 光标区间）无 `checked` 栏 | 枚举补 `:79` 与 `:101-104`（或收窄 M-604c 为「申报域逐控件」）；schema 增 `checked` 或明示复选不纳捕获域 |
| 6 | 验收可核性（#606·焦） | 🟡 | 焦点捕获「按 id 键」（§2.2 行 58）而相关可聚焦件多无 id：`views/chrome.mjs` 全档零 `id:`（`pickNode:130-146` 无 id）· `views/session-control.mjs:123-135` 选择器无 id · 工具卡切换钮唯 `data-action`；重建径（对话流 ∕ 池列 ∕ 卡面）焦点保真将落空；M-606b 单测可自造 id（「单测绿 · 真机失焦」盲区）、P2–P5 无焦点断言腿 | 补键回退（`data-action` ∕ `data-field` ∕ 结构路径）或给相关件补 id，并把焦点断言并入 P2–P5 之一 |
| 7 | 方法论·纪律行 | 🟡 | 同段自相抵：§2.10 纪律句「仓套件不写 ∕ 不改 ∕ 不跑——全清令」与同句尾「套件回归如需」；§2.5 P6 又写「VSC 面零回归（`webview` 套件 + 结构判据）」——全清令单源 = `docs/batches/2026-09-29-render-perf.md:164`（「不写 ∕ 不改 ∕ 不跑；无例外」）+ 该批收口处置「VSC 套件零触」 | 按先例改述为「改指零行为变更（批内件对拍）+ VSC 套件零触」，删「套件回归」径 |
| 8 | 协调项（U2·R7a） | 🟡 | 六档设计面随动本轮未落（U2）⇒ 落定前本设计 §2.5 与在册核档机制描述不同：`docs/render-core/design/RENDER-CORE.md:171`「核不夺 = 实现载体不夺（行 13–15 实现各端自持）」+ `:74` KD-RC-8 ④「端实现 = 契约适配器」vs 工厂落核（判据 ∕ 旗标维护 ∕ 计数簿记入核） | 把 U2 定为实施前硬前置（单一落手 + 落点 = §2.1 六档清单），并在 §2.10 波次依赖中体现 |
| 9 | 引注精度 | 🔵 | （a）`subblocks/state.mjs` 痕迹钩缺省 no-op 引 `:90`——实读 `:91`（`const trace = deps.trace ?? (() => {})`；`:90` = `connOf`）；（b）§2.4① 括注「下拉（`.session-selector`）」——可滚件实为 `.session-dropdown`（`chrome.css:137-145`；`.session-selector` = 触发钮，`chrome.css:100-118`） | 两处引名 ∕ 引行收正 |

**抽核记录（正向）**：`settings.mjs:326-334`（clear `:331`）· `mount-settings.mjs:36/:123-128/:138-147` · `onboarding.mjs:153-161`（clear `:158`）· `mount-sessions.mjs:82-101/:104-118`（407 行）· `session-control.mjs:147-152` · `chrome.mjs:76-78/:130-146/:191-198`（199 行）· `frame-dispatch.mjs:17` · `chrome.css:144` · `activity.mjs:55-89/:105-112`（154 行）· `pool-tree.mjs:112-122/:124-133` · `app.mjs:10/:179-182/:289-293` · `views/chat.mjs:178-194/:229-231/:277-278` · `chat-subagent.mjs:46-66` · `composer-sync.mjs:122-136` · `activity-new.mjs:29-40/:104-107` · `chat-scroll.mjs:15-36/:56-70/:83-103` · `pool-subagents.mjs:85-95` · `subagent-reduce.mjs:93-112/:128/:149-150/:157-168` · `statusline-segments.mjs:215-224` · `statusline.mjs:68/:72-87` · `mount-status.mjs:22` · 核 `block.mjs:59/:91-121`（121 行）· 核 `state.mjs:91/:328` · VSC `ui.js:178-193/:198/:208-221/:215` · VSC `activity.js:36-43/:53-54/:58/:60/:69-97/:104-110/:163-173` · VSC `streaming.js:171-179` · VSC `settings-providers.js:248-255` · `settings-models.js:11` · `chat-tool.mjs:196-243` · `flow/stream.mjs:40` · `RENDER-CORE.md:75/:84/:158/:171/:211` · `2026-09-29-subblock-follow-resume.test.mjs:629-688` · 探针基建（`package.json:21` playwright-core）皆与设计记述一致；i18n.mjs 500 行顶格 + `status.queue.enter` 两语在位；新档 `view-state.mjs` ∕ 核 `scroll.mjs` 盘上未在（符合「新档」）；行数抽核与项目「内容行数口径」一致（±1 内）。

VERDICT: pass

计数：🔴 0 · 🟡 8 · 🔵 1（另射程外注记 1 条：§1 行 15 `activity.mjs:178-185` 盘上不存在——该档实读 154 行；§1 非本轮靶）。

## §4 用户批准（主 agent）

**用户批准（父侧代签 · 2026-09-29）**

- **依据** = 用户 2026-09-29 13:52「别等我了，自己跑完」+ 17:02「尽可能消除」令（代点火 + 代批准授权——本批经此授权点火评审 #16）。
- **三条件核检**：① **评审 pass**——#16（0🔴 · 8🟡 · 1🔵 · pass；§3 在册）② **修正轮落地并经父侧核验**——九发现全受理（§2 修正块在册；#27 ∕ #44 落毕）③ **凭证**——评审 #16 已通过（token 在手）。
- **批准射程** = 本批 §2 全量（#604–#608 + #581 并入（附 A 裁定：唯一载体 = 本批）；**U2 六档随动 = 实施前硬前置**——全波共同门）；**不扩面**。
- 〔父侧代签 · 记录在案 · 可 revert〕

## §5 实施记录（eng-coder）
**状态行**：实施完成（波 2（#606 重建面位 ∕ 焦点保真族 · 六面）——十产品档 + 批内件两档落地；M-606 5/5 绿 · P2–P5 真机 23/23 全过 · 负向对照 5/5 红（还原全绿）· 审计 1 + 代码评审 R1–R2（终态 clean）；前述波 3 ∕ 波 5 ∕ 波 1 各节在册（本节新增波 2 段））


### 5.1 波 5 · #581（段 14 窗内提示态）· 2026-09-29

**交付摘要**：按批档 §2.6 ∕ §2.10 波 5 ∕ AC-6 落两档产品码——① `views/statusline-segments.mjs` `enterSegment` 增第四参 `suspend`，第二支判据扩为 `codes.includes("running") || suspend?.active === true`（严格真——与 `views/chrome.mjs` `suspActiveOf` 同式）；② `views/statusline.mjs` 段装配传既有取值 `suspend`（:69——零新切片 ∕ `STATUS_KEYS` 零键增 ∕ 词键复用 `status.queue.enter` ∕ i18n.mjs 零触）。段 14 形态 ∕ 其余 16 段零改。

**逐处表**：

| # | 档 | 处 | 落值 |
|---|---|---|---|
| 1 | `thincoder-desktop/renderer/views/statusline-segments.mjs` | :215-221 档注 ∕ :222 签名 ∕ :225 判据 | 判据四路收正（队 ≥ 1 ⇒ 条数句 · 忙 ∨ 窗 ∧ 队空 ⇒ 排队句 · 静 ⇒ send 句）；第四参 `suspend`；`|| suspend?.active === true`（+3 行） |
| 2 | `thincoder-desktop/renderer/views/statusline.mjs` | :67-68 注 ∕ :87 调用点 | 装配传 `suspend`（+1 行） |
| 3 | `.thincoder/tmp/2026-09-29-desktop-rebuild-fidelity-m581.test.mjs`（新 · 批内件） | 全档 4 测 | M-581：T1 四态直测（含「窗 ∧ 非忙 ⇒ 排队句」收正位 ∕ ③④互异判别力）· T2 六例负向锁 · T3 优先序 · T4 接线结构核 |
| 4 | `.thincoder/tmp/2026-09-29-desktop-rebuild-fidelity-p8.probe.mjs`（新 · 批内件） | 全档 8 断 | 真机 P8（真 Electron + 桩模型 + 真后台子代理 + 真挂起窗 + 真输入区 Enter 提交）；读数件 = `.thincoder/tmp/p8-readings.json` ∕ 截图 `p8-queue-window.png`（读数落 `.thincoder/tmp/`——转正后同） |

**腿读数**：

- ① **M-581**：`node --test .thincoder/tmp/2026-09-29-desktop-rebuild-fidelity-m581.test.mjs` ⇒ **4/4 pass**（T1–T4）。判别力自证 = 旧三参判据复刻对「窗 ∧ 非忙」态出 `Enter: send`（修复前必红核过）。
- ② **`node --check`**：两档全绿（lint 面）。
- ③ **`node scripts/doc-check.mjs`**（仓根）：闸面 = 悬空 161 ∕ 行宽 81（与批档 U2 基线同值——本批写域零新增入闸红；写域 = 两码档 + tmp，均在 `docs` 扫描域外）；行数**报告面**（非入闸）= 两档 Δ+1 ∕ Δ+3（设计表 ≈228 ∕ ≈208 预估内）。读数日志 = `.thincoder/tmp/rf-w5-doccheck-after.txt`。
- ④ **P8 真机**（本舱已亲跑留证 ∕ 父侧可复核复跑）：**8/8 pass**——前置：窗 `{active:true, running:1, queued:0, pending:0, done:0}` ∧ 队空 ∧ 非忙；**A** 段 14 = `Enter to queue`（窗 ∧ 静；修复前该角出 `Enter: send`）；**B** 受理帧 `items:["P8-Q1 窗内提交"]` ∧ 受理刻该条零流内块（blocks 5→5，文本面无该条）；消费帧 `delivered` ⇒ 恰一枚入流（5→6）；**C** 提交 ⇒ 队留存 N=1 ∧ 段 14 = `1 queued message(s)`；**D** 该条零流内块。读数件在盘（`p8-readings.json`）。

**披露项**：

1. **P8 计数句锚定面**：设计句「提交 ⇒ 段 14 = 计数句（N=1）」——提交 #1 的 N=1 真机存续于 accept→consume 同帧窗（<1 帧 · DOM 未及出画——timeline 在册），计数句断言以**提交 #2**（窗内用户回合在飞 ⇒ 队留存）锚定——同为真机实时窗内队列态，非人造；探针件头已披露。
2. **判据措辞面**（评审 🔵#1 · 给由）：批档 §2.6 ∕ UI.md 表行 14 以「判据单源 = `suspActiveOf`」措辞；实现为**同式内联**（语义逐字等价）——字面复用会成环（`views/chrome.mjs:37` 再出口 `statusline.mjs`；`segments` 引 `chrome` ⇒ 环，违该档「依赖单向」句）；房内先例 = `chrome.mjs:66-67`（两面具同形判据）+ 档注自陈「同式」。doc 措辞收正 = 非本波写域（报父侧）。
3. **双批重叠**：`docs/batches/2026-09-29-desktop-residuals-round3.md:74-83 ∕ :461`（及波 B :226）亦列 #581 同两档（其形 = 第四参布尔——与本形行为等价）；RF §4 载「唯一载体 = 本批」⇒ 已向父侧发 note（建议从其波次剔除，防同两档二次改）。
4. **暂存落位**：批内件两件住 `.thincoder/tmp/`（父侧收口转正；终位候选 = `docs/batches/2026-09-29-desktop-rebuild-fidelity.test.mjs` ∕ `…-probe.mjs`）。
5. 一次性自检件 `p8-envcheck.mjs` 建后即删（非交付物）。

**审计与代码评审轮次 · 终态**：

- **内部 explore 分歧审计（轮 1）**：四类偏差（半实现 ∕ 静默简化 ∕ 文档漂移 ∕ 越面）**零发现**；🔵2（一次性件已删 ∕ 判据同式——给由）+ 🟡1（= §5 未写——本段落字即消解）。
- **内部代码评审（advisor · type=code）轮 1**：**pass**（0🔴 ∕ 0🟡 ∕ 4🔵——皆可选）。
- **fix 轮（实到 1 轮 · 2 处落）**：🔵#2 读数 ∕ 截图落面改 `OUT = <仓根>/.thincoder/tmp`；🔵#3 固定墙钟改有界谓词等待（`waitForFunction(…, {timeout:5000}).catch(()=>{})` 后照断言——判别力保留）。修后复跑探针 **8/8 pass**。
- **轮 2（严格复核 fix 声明）**：两条 fix 声明逐字兑现（Fixed）；新增面零；**pass**。
- **终态 = `clean`**（单轮收敛）。

**响应表（评审 4🔵 逐条）**：

| 🔵 | 项 | 处置 |
|---|---|---|
| 1 | 判据「同式」vs doc 点名（字面复用） | **给由**（环约束 + 房内先例 + 档注自陈；doc 面报父侧——非本波写域） |
| 2 | 读数 ∕ 截图落面（转正后入 docs/） | **落（修）**——改 `OUT = <仓根>/.thincoder/tmp`；复跑 8/8 |
| 3 | 固定墙钟等待（假红风险） | **落（修）**——改有界谓词等待；复跑 8/8 |
| 4 | 暂存件名小写 m581 惯例差 | **给由**（收口转正按终位命名归并即消解） |

**未跑面（如实）**：仓套件零跑（全清令）；真机 P8 由本舱亲跑留证（父侧可复核复跑）；`doc-check` 读数日志在盘。

### 5.2 波 1 · #604（设置 ∕ 向导 · 草稿保真总闸）· 2026-09-29

**交付摘要**：按批档 §2.2（现行版 = 含 §2 修正块；U2 硬前置已在册）落 —— ① 新档 `renderer/view-state.mjs`（快照族 `captureView` ∕ `restoreView`，附 `mergeViewSnaps`）；
② 挂闸于两树唯一重绘点 `mount-settings.mjs` `paintSettings`（迟绑定 `:106` ∕ 订阅 `:143-147` ∕ 初绘 `:149` 三径同门；`views/settings.mjs` ∕ `views/onboarding.mjs` **零改** ⇒ 两树一闸）；
③ 标记面四档（`settings-controls.mjs` 四组 + `settings-sections-mcp.mjs` 字段组 + `settings-sections-tools.mjs` 工具 key + `settings-sections-env.mjs` shell 输入）。
零 i18n 触（`i18n.mjs` 及四档词表零键增删）；仓套件零写 ∕ 零改 ∕ 零跑；`providers.draft` ∕ `form.draft` 两专用快照零动（总闸为网、专用为先）。

**逐处表**：

| # | 档 | 处 | 落值 |
|---|---|---|---|
| 1 | `renderer/view-state.mjs`（新 · 290 行） | 全档 | 快照 `{ scrolls, drafts, focus }`；drafts 逐件 `{ value, checked, selectionStart, selectionEnd }`；focus = 键回退链（`id` → `data-field` → `data-action`〔同键多例 ⇒ `data-slot` 祖先限定〕→ 结构路径兜底）；复填序 = 焦点 → 草稿 → 滚位末写 |
| 2 | `renderer/mount-settings.mjs`（153 ⇒ 172） | `:26` import ∕ `:111-133` 闸体 | 捕获 → 并合（残件携带 ∕ `trust`）→ 两树挂载 → 复填 → 残件承接（树在途留待 ∕ 树定型弃） |
| 3 | `renderer/views/settings-controls.mjs`（131 ⇒ 134） | `:29` `fieldPair` ∕ `:83` 自定形名 ∕ `:93` 自定形 `format` select ∕ `:99` 预设名 select ∕ `:107` `active` 复选 | 五处携 `data-draft: ""`（键取 `id`） |
| 4 | `renderer/views/settings-sections-mcp.mjs`（179 ⇒ 183） | `:107` `fieldNode` ∕ `:167` 表单根 | 可编辑字段携 `data-draft`（readOnly 名不申报）；表单根增 `data-draft-scope`（`add` ∕ `edit:<名>`） |
| 5 | `renderer/views/settings-sections-tools.mjs`（162 ⇒ 163） | `:94` 编辑态密钥输入 | `data-draft: kind`（无 `id` ⇒ 标记取值作显式键） |
| 6 | `renderer/views/settings-sections-env.mjs`（135 ⇒ 137） | `:133` shell 自定义路径输入 | `data-draft: ""`（proxy 族 ∕ shell `select` = 即改即存 ⇒ 不入域） |
| 7 | `.thincoder/tmp/2026-09-29-desktop-rebuild-fidelity-M604.test.mjs`（新 · 批内件） | 全档 8 测 | M-604a（设置树 ∕ 向导树两径 + 在途窗携带 + 缺位面 + 闸落点结构）· M-604b（负向锁 + 作用域锁）· M-604c（树面 15 件全清单 + 源面四档计数 5/1/1/1） |
| 8 | `.thincoder/tmp/2026-09-29-desktop-rebuild-fidelity-P1.probe.mjs`（新 · 批内件） | 全档 16 断 | P1 两径（向导 ∕ 设置）；重建痕断言防空过；读数件 = `.thincoder/tmp/2026-09-29-rebuild-fidelity-p1-readings.json` |

**腿读数**：

- ① **M-604a/b/c**：`node --test .thincoder/tmp/2026-09-29-desktop-rebuild-fidelity-M604.test.mjs` ⇒ **8/8 pass**。判别力自证（负向对照三跑，跑毕还原复跑 8/8）：复填断电 ⇒ M-604a 两径 + 结构断言红（3 红）；残件携带断电 ⇒ 在途窗用例 + 结构断言红（2 红）；作用域键断电 ⇒ 作用域锁用例红（1 红）。
- ② **`node --check`**：八档全绿（六产品 + 两批内件）。
- ③ **`node scripts/doc-check.mjs`**（仓根）：闸面 = 悬空 161 ∕ 行宽 81（与基线同值 —— 本批写域零新增入闸红；写域 = 六产品码 + tmp + 本档 §5）。前后读数日志 = `.thincoder/tmp/2026-09-29-rebuild-fidelity-w1-doccheck-before.txt` ∕ `…-after.txt`。
- ④ **P1 真机**（本舱亲跑两跑留证；父侧可复核复跑）：**16/16 pass**（两径 × 值 ∕ `checked` ∕ 光标 ∕ 焦点 ∕ 根 `scrollTop` + 重建痕 + 面在场）。关键读数 = 设置径 `name="p1-draft-name"` ∕ 光标 `[2,7]` ∕ 焦点在件 ∕ `format="anthropic"` ∕ `active=true` ∕ 根 `scrollTop=150`（`scrollMax=3369`，非退化）跨 `refreshSettings` 七读窗全程保真。读数件在盘。

**披露项**：

1. **机制扩展三件（设计未载 —— 实施轮发现并落，报父侧文档层）**：设计 §2.2 只写「挂载前捕获 ∕ 重建后复填」单轮。实读 `providersBody`（`:158-164`）∕ `mcpBody`（`:177`）∕ env 段体（`views/settings.mjs:246`）：
   读 → `loading` → 结的**两个重绘**中 `loading` 面零表单 ⇒ 单轮捕获 ∕ 复填达不了底（AC-1 在 `refreshSettings` 径上必红）⇒ 落三件：
   ① 未落件（残件）跨**在途**重绘携带（树定型即弃 —— 免陈值复活）② 草稿作用域 `data-draft-scope`（MCP 表单身份换 ⇒ 旧草稿不复填，免 add→edit 串值）
   ③ 同键多例捕获位序 `nth` 消歧（设置树两表单皆 `id="name"/"key"/"active"` 重复）。三件皆加法、皆在同一重绘单点内，无新重绘径。
2. **P1 向导径根滚位退化**：向导内容短 ⇒ 两跑 `scrollMax=0`（`0===0` 空判；件内标 `degenerate:true`）；非退化滚位判据由设置径（`150 ∕ 3369`）+ 批内件在途窗用例（截断场景）承载。
3. **批内件暂存落位**：两件住 `.thincoder/tmp/`（父侧收口转正；终位候选 = `docs/batches/2026-09-29-desktop-rebuild-fidelity.test.mjs` ∕ `…-probe.mjs`）；一次性自检件 `m604-debug.mjs` 建后即删（非交付物）。
4. **行数账**：`view-state.mjs` 实读 290 行（设计 §2.9 行 1 预估 ≈90——3.2×；≤300 顾问线内，无越线句需求）；`mount-settings.mjs` 172（预估 ≈166）；余四档 134 ∕ 183 ∕ 163 ∕ 137（预估带内）。§2.9 数字重钉 = 父侧文档层。
5. **报父侧裁三项**（代码评审轮 1 出，非本波修复面）：① 提交成功后申报控件被旧值回填（模型侧复位被总闸覆盖 —— 设计未载的行为德塔，含口令件留驻 ∕ 再点重提两面；`mount-settings-exits.mjs` 零改）；② AC-1 字面 vs 申报域收窄（渠道钥编辑行 `settings-sections.mjs:102` 等仍无总闸保护 —— 扩标记面 ∕ 收正措辞二择一）；③ §2.2 随动补句（机制扩展三件与 readOnly 收窄）。

**审计与代码评审轮次 · 终态**：

- **内部 explore 分歧审计（轮 1）**：四类偏差（半实现 ∕ 静默简化 ∕ 文档漂移 ∕ 越面）**零发现**；观察 5 条（§5 未写——本段落字即消解；滚位判别力偏弱——已补在途截断断言；向导滚位退化——披露；行数账——披露；一次性件已删）。
- **内部代码评审（advisor · type=code）轮 1**：**pass**（0🔴；5🟡 ∕ 5🔵——无 must-fix）。
- **fix 轮（实到 1 轮 · 4 处落）**：🟡#1 复填序对自陈（焦点 → 草稿 → 滚位末写已落正）；🟡#5 P1 重建痕断言补（防保真断言空过）；🔵#6 触发面改有界谓词等待 + 读数落盘；🔵#7 `REPO` 改档位推导（析出绝对路径）。修后复跑：M-604 8/8 · P1 16/16。
- **轮 2（严格复核 fix 声明）**：四条声明逐字兑现（Fixed）；新增面零；**pass**。
- **终态 = `clean`**（单轮收敛）。

**响应表（评审 5🟡 ∕ 5🔵 逐条）**：

| 评 | 项 | 处置 |
|---|---|---|
| 🟡1 | 复填序与档注相抵（滚位未末写） | **落（修）**——`restoreView` 改焦点 → 草稿 → 滚位序（与档注同）；复跑 8/8 · 16/16 |
| 🟡2 | 提交后申报控件被旧值回填（模型侧复位被覆盖） | **报父侧裁**（设计外行为德塔；涉 `mount-settings-exits.mjs` = 本波写域外） |
| 🟡3 | AC-1 字面 vs 申报域（钥编辑行等零保护） | **报父侧裁**（扩面 ∕ 收正措辞二择一 —— 设计层） |
| 🟡4 | 文档状态滞后（三处机制未载 §2.2） | **报父侧文档层**（§2.2 随动补句；R7e 不阻 pass） |
| 🟡5 | P1 无重建证明（可空过） | **落（修）**——两径打重建痕 + 断言；复跑 16/16 |
| 🔵6 | 固定墙钟等待 ∕ 读数未落盘 | **落（修）**——有界谓词等待 + 读数落 `.thincoder/tmp`；残留收尾睡为余读落定期尾（判别力由痕断言兜） |
| 🔵7 | `REPO` 硬编码绝对路径 | **落（修）**——档位推导（`join(HERE, "..", "..")`；转正后同式可跑） |
| 🔵8 | P1 向导腿路由 ≠ 设计点名（步骤 2 ∕ `loadModels`） | **给由 + 报文档层**（步 2 无申报件 —— 交付形态更可判；§2.2 ∕ §5 收句） |
| 🔵9 | §2.9 行数标注漂移 | **报父侧文档层**（收口重钉；本段披露项 4） |
| 🔵10 | §5 波 1 记录缺位 | **落**——本段落字即消解 |

**未跑面（如实）**：仓套件零跑（全清令）；`doc-check` 前后读数日志在盘；P1 真机由本舱亲跑留证（父侧可复核复跑）。

### 波 3（#607 滚动策略族 · 抽核件 pin 工厂）

**射程**：§2.5（现行版，含评审修正的 `holder` 参数）逐处落；AC-4（M-607a/b/c + P6）；五产品档 + 批内件两档。**U2 门已过**（§2 追加块落定）。VSC 面改动只限 `ui.js`（§2.10 纪律）。

#### 5-波3.1 落点（逐处 · 实际行数 = 内容行数口径）

| # | 档 | 预期 ⇒ 实际 | 内容 |
|---|---|---|---|
| 1 | 核 `thincoder-render-core/scroll.mjs`（**新**） | 拟新增 ≈120 ⇒ **122** | 四件导出：`NEAR_BOTTOM_PX = 24`（唯一数值源）· `nearBottom(el)`（三读数归一 + 严格小于）· `applyPin(el, gate)`（门 `!== false` ⇒ 写 `scrollTop = MAX`，超值不读 `scrollHeight`）· `createPinWatch(el, { holder = el, flagKey, gestureGateMs, onNearBottom, onGesture }) → { read, set, attach, detach }`（门控模式 = 手势三标记 + `scroll` 更新点；直写模式 = `wheel`/`touchmove`/`scroll` 同径；近底无条件翻真 + 回调；非手势位移不改旗标）· `createUnreadCounter(el, { countKey })`（bump/clear/read；缺件零抛） |
| 2 | 核 `thincoder-render-core/subblocks/block.mjs` | 121 ⇒ ≈100 ⇒ **114** | 本地实现删、改薄包直消费工厂；`NEAR_BOTTOM_PX` 同名再出口保名；`GESTURE_GATE_MS = 600` 传参；出口钮自持面保留（三态两态 ∕ 点击回底清账）；两导出（`initBlockFollow`/`maybeScrollBlock`）保名 |
| 3 | 桌面 `renderer/views/activity-new.mjs` | ≈109 ⇒ ≈105 ⇒ **112** | `maybePinPool` → `applyPin`；旗标维护 → `createPinWatch`（`gestureGateMs: 0`，宿主 = 池宿主）；计数簿记 → `createUnreadCounter`；`_poolPin`/`_poolNew` 键面、清账三路、钮形零改 |
| 4 | 桌面 `renderer/views/chat-scroll.mjs` | ≈103 ⇒ ≈105 ⇒ **110** | `FOLLOW_PX` = 工厂 `NEAR_BOTTOM_PX` 再出口保名；`scrollAction` 跟随判据 → `nearBottom`；`stickToBottom` → `applyPin`；`STICK_TOP` 与其余纯件导出保名 |
| 5 | VSC `webview/ui.js` | 221 ⇒ 约 201 ⇒ **222** | 四函数（`scrollDown`/`maybeScrollDown`/`maybeScrollActivity`/`initScrollFollow`）改工厂调用；旗标宿主 `ctx`（`_pinBottom`/`_pinActivity` 键面保持）；事件集 `wheel`/`touchmove`/`scroll` 保持；零行为变更 |
| 6 | 批内件 `.thincoder/tmp/2026-09-29-desktop-rebuild-fidelity-M607.test.mjs`（**新** · 暂存 ⇒ 父侧并入终位） | —（本波须新增） | **484 行 · 14 案**：M-607a 工厂单测（边界 23/24/25 + 归一 ∕ applyPin 两向 ∕ 三律假钟假事件 ∕ 直写模式 ∕ `holder` 宿主 ∕ handle 幂等/缺件 ∕ counter 簿记）· M-607b 源扫描（四载体零判据副本 ∕ 零 `24` 字面 ∕ 皆引工厂 + **反证自检防假绿**）· M-607c 对拍腿升级（工厂单源 + 四载体消费面断言） |
| 7 | 批内件 `.thincoder/tmp/2026-09-29-desktop-rebuild-fidelity-M607.probe.mjs`（**新** · P6 · 父侧亲跑） | — | 真 Electron 三腿（块内容区 ∕ 池列 ∕ 对话流：真滚轮 ∕ 真点击）+ `checks` 九判自述 + 读数落盘 `.thincoder/tmp/2026-09-29-desktop-rebuild-fidelity-M607.p6-readings.json` |

#### 5-波3.2 验证读数（本舱）

- **M-607 机检腿 14 ∕ 14 绿**（复跑 = `node --test .thincoder/tmp/2026-09-29-desktop-rebuild-fidelity-M607.test.mjs`）。
- **P6 探针**（本舱预跑一次作证；设计口径 = 父侧亲跑闭合）：三腿九判全真 —— 块：真滚轮上滚 ⇒ `_pinFollow` 假（68→0）⇒ 新内容零写 + 钮两态（`↓ Back to latest` ⇒ `↓ New output`）⇒ 真点击 ⇒ gap 0 + 复跟 + 钮退场；池：真滚轮 ⇒ `_poolPin` 假（4966→4726）⇒ 新 chunk 零写（4726 不变）+ `↓ 1 new block(s)` ⇒ 真点击 ⇒ 5058 = max + 复跟 + 计数 0 + 钮退场；流：真滚轮 ⇒ `following` 假（gap 339）⇒ 追加零写（9903→9903）⇒ 回底 ⇒ `following` 真 + gap 0 ⇒ 再追加 gap 0（贴底）。
- `node --check`：7 档全绿（5 载体 + 2 批内件）。
- 既有批次腿回归（本波写域相关）：waveB 7/7 · render-perf 17/17 · enddiff-clearance 13/13 · parity-b10-ui-w1w4 11/11 · stall-indicator-b 20/20 绿；两处预存红（非本波肇因，见 5-波3.4②③）。
- `node scripts/doc-check.mjs`：悬空 **161 ⇒ 161**（本批写域零新增红）· 拟新增 **40 ⇒ 27**（13 条 = `scroll.mjs` 前向引用落定）· 行宽 **81 ⇒ 81**（同值）。
- **not repo-suite verified**（全清令 ∕ 仓套件不写不改不跑；收口跑 = 父侧唯一跑点）。

#### 5-波3.3 决策透明表（实施轮）

| # | 决策 | 由 | 披露 |
|---|---|---|---|
| 1 | 直写模式事件集 = 三事件同径（`wheel`/`touchmove`/`scroll`）；门控模式 = 手势三标记 + `scroll` | 设计 §2.5（`gestureGateMs = 0` ⇒ 滚动事件按近底直写）+ VSC 事件集保持硬约束 | 池载体原为 `scroll` 单订阅（设计载荷句所记 pre-change 形）⇒ 扩容为三事件；语义幂等（同几何重判 / 清账幂等 / 旗标假零写）⇒ 无用户可辨差（评审 R1 🔵③ 在册） |
| 2 | 显式动作旗标写 = 载体直写（块钮 ∕ `scrollDown`）；滚动驱动维护 = 工厂 | 无 watch 语境（钮可先于 `initBlockFollow` 建、`scrollDown` 在 `initScrollFollow` 之前可调）；写口（`scrollTop`）= 工厂 `applyPin` 单源 | 键面（`_pinFollow`/`_pinBottom`）保持；R1/R2 未列为缺陷 |
| 3 | 工厂附加细节面（`applyPin`/`attach`/`detach`/`read`/`set` 回值、缺件守门） | 设计导出面只定行为、未定回值/守卫 | 对拍件已固化（M-607a）；无副作用 |
| 4 | 计数 `bump`/`clear` 缺件零写回 0（fix round 2 补） | 与工厂另三件「缺件零抛」对齐（R2 复核 🔵④） | M-607a 缺件断言在册 |
| 5 | 手势门收编 = **不采**（池 ∕ 活动区 ∕ 对话流维持直写） | 上抛 U1（父侧裁定） | 零参数化外露、零行为变更 |

#### 5-波3.4 审计与代码评审（轮次与终态）

- **发散审计**（explore · 只读）：DEVIATIONS —— PARTIAL ×1（§5 未落，本舱本节点即其落定）· DOC-DRIFT ×1（设计 ∕ 项目面后置随动 = 父侧收位轮）· SILENT-SIMPLIFICATION 0 · OUT-OF-LIST 0（产品码恰 5 档，无清单外产品档）。
- **代码评审 R1**（advisor · 全量）：**pass**（1🟡 可选〔批内件 484 行超 300 顾问线 · 非阻断〕+ 4🔵）。
- **fix round 1**：🔵④ 已修（计数缺件守门 + 断言）· 🔵② 已修（探针读数落盘 + `checks` 九判自述）· 🔵⑤ 改修（判据正则跨行字符类）· 🟡① 维持（非阻断）· 🔵③ 维持（非缺陷 · 口径观察）。
- **代码评审 R2**（仅复核修复主张）：主张 ①（缺件守门）②（读数落盘）**核实落实**；③「跨行容忍」判**未生效**（正则已改但扫描逐行）。
- **fix round 2**：M-607b 判据扫改**相邻两行窗口**（跨行容忍落地）+ 新增**反证自检**（单行 ∕ 减号后断行 ∕ 减号前断行三形态 + `24` 字面皆可判红——防假绿）；四载体假红静态核（9 处 `scrollHeight` 出现点皆不构成跨行判据）。
- **代码评审 R3**（fix-claims only）：**pass**（窗口扫与自检核实落地）。
- **终态：clean**（本舱射程）；**携父侧待办 1**（5-波3.5①）+ 披露 3。

#### 5-波3.5 披露 ∕ 父侧待办

① **跨批随动（父侧待办 · 本舱写门禁他批批次件）**：#603 批件 `docs/batches/2026-09-29-subblock-follow-resume.test.mjs`（及 `.thincoder/tmp/` 镜像）**⑥A10 档头条款组**（「原语 ∕ 旗标 ∕ 出口钮 ∕ 核应用器住本档」与「滚动策略族契约句」两条款 = 抽核后失效）**+ ⑥A11 四载体源面逐字断言**（例：`:636` `/NEAR_BOTTOM_PX = 24/` ∕ `:650` `/< 24/` ∕ `:651` `_pinBottom !== false` ∕ `:663` `_poolPin === false` ∕ `:673` `FOLLOW_PX = 24`）= **陈旧红**；**置换件 = 本批 M-607b ∕ M-607c**（升级后「工厂单源 + 消费面断言」——即 §2.5 M-607c 的现成内容，父侧移植后摘除旧腿）。另 `docs/batches/2026-09-28-desktop-subblock-follow.test.mjs` 两处红 = **改前即红**（#603 让位三律换代后语义失配；证据 = 该件 `:182` 三监听断言 ∕ `:251-260` 裸 wheel 决断期望 vs 现行四监听 + `scroll` 决断；非本波肇因）。
② **行数估算 vs 实读**：`scroll.mjs` 122（≈120 ✓）· `block.mjs` 114（≈100）· `activity-new.mjs` 112（≈105）· `chat-scroll.mjs` 110（≈105）· `ui.js` 222（约 201）——四档皆远低 300 顾问线；建议收位轮设计 ∕ 项目面行数账随实读收正。
③ **设计面「（拟新增）」标记随落盘转正**：doc-check 拟新增 40 ⇒ 27 已映（13 条 = `scroll.mjs` 前向引用）；设计 ∕ 项目面标记收正（RENDER-CORE §5 ∕ RENDERER §3 ∕ WEBVIEW §5.5 等）= 父侧收位轮。
④ **池头叠层观察**（预存 · #603 在册 · 非本波引入 · 非阻断）：滚动态下块卡（positioned）叠于池头粘性带 ⇒ 计数钮命中面不可达（P6 清账腿须先真滚轮至池顶再点）；候选 = 池头 `z-index` 显式（另轮）。
⑤ **P6 读数件在盘**：`.thincoder/tmp/2026-09-29-desktop-rebuild-fidelity-M607.p6-readings.json`（本舱预跑一次）；设计口径 = 父侧亲跑签收。
⑥ **批内件未转正**：两档暂存 `.thincoder/tmp/`（父侧收位并入 `docs/batches/2026-09-29-desktop-rebuild-fidelity.{test,probe}.mjs` 终位时，M-607b/c 亦可按 §2.5 M-607c 移植他批）。

### 波 2（#606 重建面位 ∕ 焦点保真族 · 六面）· 2026-09-29

**射程**：§2.4（现行版，含 §2 修正块）逐面落；AC-3（M-606a/b/c + 真机 P2–P5）；**十产品档 + 批内件两档**。U2 门已过；**跨批串行已解**（structure-split 拆落定 ⇒ 届盘重钉：拆后基 `mount-sessions.mjs` 235 行实测 ⇒ 本波增行落于拆后基）。VSC 面零触；仓套件零写 ∕ 零改 ∕ 零跑；i18n.mjs 零触（零新词键）。

#### 5-波2.1 落点（逐处 · 实读行数）

| # | 档 | 预期 ⇒ 实际 | 内容 |
|---|---|---|---|
| 1 | `renderer/mount-sessions.mjs` | ≈268 ⇒ **299** | 键控差分（壳原位 · 条目复用 · 下拉 scrollTop 自保 · 注记 ∕ 空态行对账 · 词面随 `locale` 原位刷）+ 换形两向 = 换件 + `ITEM_SLOTS` 槽对账 + #606④ 快照包络（captureView/restoreView）；原 `readDraft` ∕ `restoreDraft` 随退役（行为面 = 输入节点跨帧存续承之——见披露 1） |
| 2 | `renderer/views/session-control.mjs` | ≈240 ⇒ **235** | 差分辅助导出面：`ITEM_SLOTS`（槽序单源）· `emptyRowNode` · `itemNode` ∕ `ledgerNoticeNode` 导出（`badgeNode` 保持私有——经 `itemNode` 子件间接同建法） |
| 3 | `renderer/views/chrome.mjs` | ≈215 ⇒ **252** | `syncHead` 就地更新（同字段名复用 · 选项集差分（候选 ∕ 现值 ∕ 词面变才换 option 集）· busy 只刷 disabled ∕ aria-disabled）+ `fieldNode` 构树 ∕ 就地同源 + 快照包络 |
| 4 | `renderer/views/activity.mjs` | ≈175 ⇒ **181** | 两族键控差分 `syncFamily`（键 = `promptId` ∕ 标题；删差额 · 逆序定位 · 内容异原位换子件）+ `bindFamilyLabel` 等值零写 |
| 5 | `renderer/views/chat.mjs` | ≈292 ⇒ **299** | 重挂径：#606④ 快照复填 + 归档块展开集捕获 ∕ 复填（`echoOpenSet`/`applyEchoOpen`，置于滚位复填之前）+ `following` 真 ⇒ `stickToBottom` 覆盖 |
| 6 | `renderer/views/chat-subagent.mjs` | ≈80 ⇒ **100** | 展开集协作两件导出（`echoOpenSet` ∕ `applyEchoOpen` —— 不强制关闭；缺件零动作） |
| 7 | `renderer/composer-sync.mjs` | ≈290 ⇒ **297** | 提示带行集等价零写门（`noticeSig` 行签名；同签名 ∧ 现件仍在锚 ⇒ 零 DOM 写；变 ⇒ 最小重建（同签名位序复用现件）；锚换代 ⇒ 强制重建） |
| 8 | `renderer/mount-pool.mjs` · `mount-status.mjs` · `mount-cards.mjs` | §2.9 未列（§2.4④ 点名）⇒ **101 ∕ 43 ∕ 167** | #606④ 快照包络（pool：滚位仅未跟底（`_poolPin === false`）时复填；cards：仅焦点 ∕ 草稿——滚位归对话流共享容器；status：全幅） |
| 9 | 批内件 `.thincoder/tmp/2026-09-29-desktop-rebuild-fidelity-M606.test.mjs`（新） | — | 5 测：M-606a①（会话条：位标翻转身份 ∕ 下拉壳 ∕ scrollTop ∕ 跨帧点按 ∕ 焦点 ∕ 改名草稿存续 ∕ locale 词面刷 ∕ 形内点按回归腿）· M-606a②（会话头：select ∕ option 引用 + busy 只刷 disabled）· M-606a③（池两族：读数帧身份 + 增删差分 + 唯一性）· M-606b（chat 重挂：滚动 ∕ 焦点 ∕ following 两支 ∕ 展开集）· M-606c（提示带签名门 + 锚换代）；`fire` = 真 DOM 冒泡同径（含 `stopPropagation` 真桩） |
| 10 | 批内件 `.thincoder/tmp/2026-09-29-desktop-rebuild-fidelity-P2P5.probe.mjs`（新 · P2–P5 · 父侧亲跑） | — | 真 Electron 四腿 **23 断**（含 P5 重挂痕 ∕ P2 改名形点按腿）；读数落 `.thincoder/tmp/2026-09-29-desktop-rebuild-fidelity-P2P5-readings.json`（+ 截图 `…-p2p5.png`） |

#### 5-波2.2 验证读数（本舱）

- **M-606 机检腿 5/5 绿**：`node --test .thincoder/tmp/2026-09-29-desktop-rebuild-fidelity-M606.test.mjs`（日志 `.thincoder/tmp/m606-run6.txt`）。
- **判别力自证（负向对照五腿 · 一次性件建后即删）**：会话条键控差分 ∕ 会话头就地更新 ∕ 池条目键控复用 ∕ chat 快照复填 ∕ 提示带零写门——逐腿反向断连 ⇒ 对应测必红（**5/5 红**）+ **还原复跑全绿**（读数 `.thincoder/tmp/m606-neg5.txt`）。
- **P2–P5 真机**（本舱预跑作证 ∕ 父侧亲跑闭合）：**23/23 pass**——P2 六断（下拉开 ∧ scrollTop=40 就位 ∕ 壳引用 ∕ 条目引用 ∕ scrollTop 保 ∕ 焦点落回 ∕ 位标随帧）+ 跨帧点按（pointerdown → 帧写 → pointerup ⇒ click 达）+ **改名形点按不误触选择出口**；P3 四断（select 引用 ∕ disabled ∕ option 集 ∕ 复真）；P4 四断（读数变帧条目引用 ∕ 族容器 ∕ 唯一不重插 ∕ 读数随帧）；P5 四断（回显在场 ∧ 展开 ∕ **重挂痕（回显重建）** ∕ scrollTop 守恒（120） ∕ open 保持）。**探针捕获一产品缺陷**：`syncDropdown` 写 `data-open="true"` 而 CSS 锚 = `"1"` ⇒ 帧写后下拉转 `display:none`（机检件未覆——真机腿价值实证）；落修后双绿。
- **`node --check`**：十产品档 + 两批内件全绿。
- **写域相关既有批次腿**（`--import rc-resolve` 跑法）：structure-split 7/7 · subblock-follow-resume 24/24 · residuals-sweep-wave-a 7/7 · perf-residuals 27/27 · enddiff-clearance 13/13 · render-perf 17/17 · statusline-cli-gap 17/17 · model-menu-parity 9/9；**两处预存红（非本波肇因）**：`2026-09-28-desktop-subblock-follow.test.mjs` 2 红（#603 让位三律换代语义失配——波 3 披露同拍）· `2026-09-28-tech-debt-closeout-r7.test.mjs` 2 红（`model:catalog` 早于本波在 HEAD；事件面引用测——两者皆非本波写域）。
- **`node scripts/doc-check.mjs`**：本波写域（十码档 + tmp）全在 docs 扫描域外 ⇒ **零新增入闸红结构性成立**；读数 = 悬空 30 ∕ 行宽 65 ∕ 拟新增 27（当前工具版；与批档波 1/3/5 记录数 161 ∕ 81 **不可比**——工具面随 doc-check-face 批演进了）；日志 `.thincoder/tmp/rf-w2-doccheck-after.txt`。
- **not repo-suite verified**（全清令 ∕ 仓套件不写不改不跑；收口跑 = 父侧唯一跑点）。

#### 5-波2.3 披露项

1. **改名草稿机制替换（设计句点名项）**：`readDraft` ∕ `restoreDraft` 两函数退役——行为面 = 键控差分下改名输入节点跨帧存续（值 ∕ 光标 ∕ 焦点 ∕ 草稿四项皆保，强于旧制重建复填）；旧制两函数在差分歧径下成死重。设计 §2.4① 句收正 = 文档层（报父侧）。
2. **两处滚位例外的机制冲突处置**（§2.4④ 字面未载，代码注自陈）：`mount-pool.mjs` 滚位复填仅未跟底（`_poolPin === false`）——跟底帧尾钉底已写位，复填会夺位（R10 E6 不反）；`mount-cards.mjs` 滚位不复填——挂载根 = 对话流共享滚动容器（滚位归 chat 面帧尾律；复填会夺新卡置焦滚入）。二者皆加法条件、零行为回归；设计 §2.4④ 例外句收正 = 文档层。
3. **③ 面差分适用配置边界（报父侧裁）**：审批 ∕ 队列族键控差分住 adopt 径（门含 `model.blocks.length > 0`——KD-47 既有三径之③）⇒「审批在场 ∧ 零子 agent 块」帧仍走全建径（配置可达：主回合 `ev:approval` 亦写 `pool.approvals`）。二择一：放宽门 ∕ 入册边界；本波按设计字面落 adoptPool 面，机检 ∕ 真机两腿皆以子 agent 块在场为前提（探针头自陈）。
4. **队列族键 = 标题**（设计 §2.4③ 同口径）：同题两条折叠为一条 —— 休眠项（队列族现行零写者 ⇒ 族空恒不在场）；写者出现前改稳键。另：队列条目级 `data-status` 在复用径不重写（子件状态词照刷）——当前不可见。
5. **行数账**：`mount-sessions.mjs` **299**（≈268）· `views/chat.mjs` **299**（≈292）· `composer-sync.mjs` **297**（≈290）· `views/chrome.mjs` **252**（≈215）· `views/session-control.mjs` **235**（≈240）· `views/activity.mjs` **181**（≈175）· `views/chat-subagent.mjs` **100**（≈80）· `mount-pool.mjs` 101 · `mount-status.mjs` 43 · `mount-cards.mjs` 167——**全 ≤300 顾问线**；三档近顶（后续增行即触「越线则禁增 ⇒ 计划面出档」）。§2.9 重钉 = 父侧文档层。
6. **探针 ∕ 件暂存位**：两批内件住 `.thincoder/tmp/`（父侧收口转正；终位候选 = `docs/batches/2026-09-29-desktop-rebuild-fidelity.{test,probe}.mjs`）；一次性自检件 `m606-negative-check.mjs` ∕ `p2p5-diag.mjs` 建后即删（非交付物）。
7. **射程外发现（报父侧 · 建议入账）**：改名形内键入 **空格 ∕ Enter** 冒泡至 `.session-selector` 的 `onKeydown`（Enter ∕ Space ⇒ `preventDefault` + `onToggle`）⇒ 空格不可键入 ∧ 形关闭草稿丢。属**修复前既有**（selector 级键位 handler 与形件同构早于本波）；本波未列修（设计未及）；建议父侧登记并随下一小轮修（判据 = 形内键入空格 ∕ Enter ⇒ 形仍在场 ∧ 空格入值）。

#### 5-波2.4 审计与代码评审（轮次与终态）

- **内部 explore 分歧审计（轮 1）**：DEVIATIONS —— PARTIAL ×1（§5 本段未落——本段即其消解）· DOC-DRIFT ×3（草稿机制句 ∕ 两滚位例外 ∕ `badgeNode` 注释）· SILENT-SIMPLIFICATION ×1（locale 词面刷缺口：选择器 ∕ 下拉 `aria-label` + 空态行文 + 项目钮 ∕ 新建钮）· OUT-OF-LIST ×0（产品码恰十档；三档 §2.9 未列 = §2.4④ 点名档）。
- **fix 轮（审计后 · 实到 1 轮）**：① `badgeNode` 注释收正 + 降回私有（消 DOC-DRIFT）；② locale 词面刷面补齐（消 SILENT-SIMPLIFICATION 主面）；③ 机检件补 locale 子段断言。
- **内部代码评审（advisor · type=code）轮 1**：**changes-required**（🔴1 ∕ 🟡3 ∕ 🔵6）——🔴 = 键控复用未撤条目级 `onSelect` 监听：形内点按冒泡 ⇒ 关形 + 切会话（**本波新引入**的行为回退；两腿漏——机检 `fire` 只派发目标节点 ∕ 真机不触改名形）。
- **fix 轮（评审 R1 后）**：① **换形两向 = 换件**（`patchItemNode` 返新件、`syncDropdown` 用回值定位——旧件监听随灭）；② 机检件 `fire` 改真 DOM 冒泡同径 + 形内点按零切换断言；③ 真机补「点入改名输入框 ⇒ 形在场 ∕ 下拉仍开」腿；④ P5 补重挂痕断言（消 🟡4）；⑤ 置焦加「现焦在形内 ⇒ 零动作」判据（消 🔵6）；⑥ `.session-new` 并入词面刷 loop（消 🔵7）。修后复跑：**M-606 5/5 · 负向对照 5/5 红（还原全绿）· P2–P5 23/23**。
- **代码评审 R2（仅复核修复主张）**：**pass**——🔴 ∕ 🟡4 ∕ 🔵6 ∕ 🔵7 ∕ 🔵9 逐条核实落实；未修复项（🟡2 ∕ 🟡3 = 非 must-fix 报告项；🔵5 ∕ 🔵8 ∕ 🔵10 = 顾问 ∕ 休眠 ∕ doc-state）不阻；修复引入新面 = 零；射程外注记 1（键位径 —— 见披露 7）。
- **终态 = `clean`**（两轮收敛：R1 changes-required ⇒ 修复 ⇒ R2 pass）。

**响应表（R1 逐条）**：

| 评 | 项 | 处置 |
|---|---|---|
| 🔴1 | 形内点按冒泡触选择出口（新引入） | **落（修）**——换形两向 = 换件 + 两腿补齐；复跑 M-606 5/5 · P2–P5 23/23 |
| 🟡2 | adopt 门配置边界（审批 ∧ 零块 ⇒ 身份不保） | **报父侧裁**（设计层二择一；本波按设计字面落 adoptPool 面——披露 3） |
| 🟡3 | 卡面滚位不进包络 vs §2.4④ 字面 | **给由 + 报文档层**（共享容器冲突；按字面回改会夺新卡置焦滚入——披露 2） |
| 🟡4 | P5 空过风险（重挂无独立证据） | **落（修）**——回显重建痕断言（P1 先例同径） |
| 🔵5 | 三档顶 300 顾问线 | **报父侧文档层**（§2.9 重钉 ∕ 出档预案——披露 5） |
| 🔵6 | 形内强制置焦覆盖快照复填 | **落（修）**——现焦在形内 ⇒ 零动作 |
| 🔵7 | `.session-new` 词面不随 locale | **落（修）**——并入词面刷 loop + 机检断言 |
| 🔵8 | 队列族键 = 标题（同题折叠） | **给由**（设计同口径 · 零写者休眠；登记备改——披露 4） |
| 🔵9 | 机检 `fire` 不冒泡（可假绿） | **落（修）**——冒泡同径 + 形内回归腿 |
| 🔵10 | §5 波 2 段缺位 ∕ §2.9 未重钉 | **落**——本段落字消解（§2.9 重钉归文档层） |

**射程外发现（报父侧 · 见披露 7）**：改名形键位径（空格 ∕ Enter 冒泡）——修复前既有；建议登记随小轮修。

**未跑面（如实）**：仓套件零跑（全清令）；真机 P2–P5 由本舱预跑留证（父侧可复核复跑）；doc-check 读数日志在盘。

### 波 4（#608 留端未接 + 效果执行等价）· 2026-09-29

**射程**：§2.6 现行版逐处落；AC-5（M-608a/b/c + 真机 P9）；**U2 门已过**。**父裁 A（2026-09-29 · 说明行旗标）**：说明行判重 = 盘上 #630 现态（挂载根旗标 `root._subDescShown` 一次置位不重置）——**零码改**；§2.6④「换代点复位」句收正归父侧收口轮（#661 射程）。四件 = ①说明行判重（零码改 · 在位复核）②核 `subblocks/state.mjs` 档头句收正（零逻辑）③核 `subblocks/block.mjs` 留端清单句收正（零逻辑）④效果执行等价对拍件（M-608a）+ P9 探针。

**交付摘要**：两核档档头句收正（state.mjs 两处：痕迹给由 ∕ 端复位面；block.mjs 一处：痕迹给由——**零行数变化**（330 ∕ 114）· 逻辑码零改）；池面 #630 旗标零改（在位复核）；批内件两档（M-608 机检件 · P9 探针）+ 负向对照两跑（跑毕还原复绿）。零 i18n 触；仓套件零写 ∕ 零改 ∕ 零跑。

**逐处表**：

| # | 档 | 处 | 落值 |
|---|---|---|---|
| 1 | 核 `thincoder-render-core/subblocks/state.mjs`（330 行·不变） | :11-12 留端清单 ∕ :36-39 痕迹钩分面句 | ① 痕迹项 ⇒「端观测面——桌面无上行面 ⇒ 不接（给由）；VSC = `activity-diag.js`」；② 痕迹钩分面句补桌面接线给由（`subagent-reduce.mjs` deps 仅 `{ now }`——丢弃径静默 return；缺省 no-op ⇒ 零行为差异；到期 = 桌面诊断面需求出现）；③ `resetActivity` ⇒「端复位面（VSC `resetActivity` ∕ 桌面 `resetSubBlocks`）」 |
| 2 | 核 `thincoder-render-core/subblocks/block.mjs`（114 行·不变） | :14 留端清单 ③ 项 | 痕迹 ⇒「端观测面——桌面无上行面 ⇒ 不接（给由）：缺省 no-op ⇒ 零行为差异」（与 state.mjs 同判短语） |
| 3 | 桌面 `renderer/views/pool-subagents.mjs`（130 行·零改） | :82-98 #630 旗标（前置批已在位） | **零码改**——父裁 A：判据 = 挂载根旗标 `root._subDescShown`（一次置位不重置）；M-608b ∕ P9 两判据复核在位 |
| 4 | 批内件 `.thincoder/tmp/2026-09-29-desktop-rebuild-fidelity-M608.test.mjs`（新 · 422 行） | 3 测 | M-608a 逐迁等价对拍（10 行 + `error` 边界 + 控制臂 + 反证自检）· M-608b 说明行两例（+ #630 语义钉：跨会话 ∕ 新 root）· M-608c 文档面句收正（五句在位 ∧ 三旧形零残留）+ 桌面零注入源面核 |
| 5 | 批内件 `.thincoder/tmp/2026-09-29-desktop-rebuild-fidelity-P9.probe.mjs`（新 · 116 行 · 父侧亲跑） | 单腿三帧六判 | 真 Electron：A 首出生 desc 恰一 + 插入点；B queued 取消 ⇒ 弃账重建痕；C 再出生 ⇒ 零重插 + 族容器换代；有界谓词等待 + 失败信号（failed ∕ verdict ∕ 非零退出码） |

**腿读数**：

- ① **M-608a/b/c**：`node --test .thincoder/tmp/2026-09-29-desktop-rebuild-fidelity-M608.test.mjs` ⇒ **3/3 pass**。M-608a 覆盖逐迁 born（queued ∕ started）· takeover（已归档旧代 ∕ awaiting 旧代先归档）· fold+archive · fold+awaiting · archive（驻留回收）· remove + 终态补桩（never-born done）+ `error` 表外码边界（零写）+ 控制臂（零迁 ⇒ 零派生）+ 反证自检。**判别力自证（负向对照两跑 · 跑毕还原复跑全绿）**：M-608b 侧——旧族 DOM 探针形复发 ⇒「首块移除后再出生 ⇒ 不再插」必红；M-608a 侧——归档入流派生断连 ⇒「fold+archive·done」必红（actual frozen ∕ 0 vs expected tombstone ∕ 1）。还原后 3/3 复绿（`subagent-reduce.mjs` 经 git 复净；`pool-subagents.mjs` diff = #630 形原样）。
- ② **`node --check`**：四档全绿（核两档 + 批内件两档）。
- ③ **`node scripts/doc-check.mjs`**（仓根）：本波起点读数 = 悬空 30 ∕ 拟新增 27 ∕ 行宽 65 ∕ 迁移期引文 298（与波 2 基线同值；日志 = `.thincoder/tmp/2026-09-29-rebuild-fidelity-w4-doccheck-before.txt`）；§5 落定后复跑读数与日志见本条下方「收口补记」——本批写域零新增入闸红（结构面：写域 = 两核档（docs 扫描域外）+ 批内件（tmp）+ 本段（`docs/batches` = 锚 ∕ 行宽扫描排除域））。
- ④ **P9 真机**（本舱亲跑一次作证 ∕ 父侧亲跑闭合）：**6/6 判真** —— boot ok；A：descCount=1 ∧ 插入点（块内 `.advisor-content` 之前）；B：块表空 ⇒ 族容器 ∕ 说明行同灭（弃账重建痕）；C：再出生 ⇒ blockCount=1 ∧ `.sub-desc`=0（DOM 全域）∧ 族容器换代（≠ A 帧引用）。读数件 = `.thincoder/tmp/2026-09-29-desktop-rebuild-fidelity-P9-readings.json`（checks 六判全真 · failed:[] · verdict:true · exit 0）。
- ⑤ **写域相关既有批次腿回归**（全绿）：M-604 8/8 · M-606 5/5 · M-607 14/14 · m581 4/4 · enddiff-clearance 13/13（含 #630 B4 `.sub-desc` 四臂——父裁 A 载体件复核）。
- **not repo-suite verified**（全清令 ∕ 仓套件不写不改不跑；收口跑 = 父侧唯一跑点）。

**决策透明表（本波）**：

| # | 决策 | 由 | 披露 |
|---|---|---|---|
| 1 | ①（说明行判重）= 零码改（已在位） | 前置批 #630 已消「族内 DOM 探针」偏差；§2.6④「换代点复位」与 #630「一次置位不重置」互斥（两文同机制异述）⇒ 上抛父侧；**父裁 A = 沿 #630**（说明行旗标语义按盘上现态） | §2.6④ 设计句收正归父侧收口轮（#661 射程）——见披露 1 |
| 2 | M-608a 等价表以「准入谱」状态断言，`error` 作边界钉 | 桌面 `SUB_STATUS` 有意不收 `error`（核 relay 谱无错误 token——单源 RENDER-CORE §5）⇒ error 逐迁端面不可达；以「零写」边界钉之（非缺陷） | 披露 2 |
| 3 | M-608c 增桌面源面核（评审轮 1 🔵 建议落修） | 「零注入」给由原仅锁文本 ⇒ 加源面断言（deps 仅 `{ now }` ∧ 零 `trace:`）令给由可机检 | 披露 3 |
| 4 | M-608a 投影射程显式化（评审轮 1 🔵 建议落修） | 等价投影 = 条目类 ∕ 归档代计数 ∕ 触碰；`atBoundary` ∕ `clearAwaiting` ∕ `kind` 不入投影（端面动作由模型态幂等派生——单源 `subagent-reduce.mjs` 档注） | 件头已注（非缺陷面收窄） |

**披露项**：

1. **设计句收正建议（父侧收口轮 · 不自行改设计）**：§2.6④ 句「修 = 会话级 ∕ 池代级旗标（池宿主 `root._subDescShown`，换代点复位——`views/activity.mjs:105-112` 既有换代清账点）」⇒ 建议收正为「判据 = 挂载根旗标（`root._subDescShown`）一次置位不重置——沿 #630 KD-EC-4，与 VSC 同判（root 跨会话 ∕ 跨族重建恒在；app 重载归零 = VSC webview 重载同判）」。**同轮可并三项句面**：`subblocks/block.mjs:40` 旧名句（`S._subDescShown` ⇒ 两端名并陈）· `views/activity.mjs:130` 会话换代注（「旧 `.sub-desc` 判据」措辞随 #630 读回）· `RENDER-CORE.md:350`「档头留端句收正 ×2」计数（实到三处：痕迹给由 ∕ 丢弃痕零注入 ∕ 端复位面）。
2. **M-608a 边界项（有意收窄 · 在册）**：`error` = 桌面表外码 ⇒ 桌面零写；核 relay 谱无错误 token（错误径归宿 = `⟦ev⟧stopped` ∕ `⟦ev⟧done`——单源 RENDER-CORE §5）；等价表以准入谱内状态断言，error 例作边界钉。
3. **M-608c 形态说明（按批档 §2.6 判据落）**：核两档档头句「给定词组在位 ∧ 旧形零残留」机检 + 桌面源面核——断言为判据令牌级子串（非长句逐字锁）；目标 = 代码档头 ∕ 桌面源档（非文档档）。
4. **行数账**：state.mjs **330**（零行数变化——设计承诺兑现）· block.mjs **114**（不变）· pool-subagents.mjs 130（零改）· 批内件 M-608 测试 422 行 · P9 探针 116 行。§2.9 行 20-21 数字重钉 = 父侧文档层（本波未改设计档）。
5. **批内件暂存落位**：两件住 `.thincoder/tmp/`（父侧收口转正；终位候选 = `docs/batches/2026-09-29-desktop-rebuild-fidelity.{test,probe}.mjs` 族）；负向对照两跑 = 临时改（跑毕还原：`subagent-reduce.mjs` git 面复净、`pool-subagents.mjs` diff = #630 形原样）。

**审计与代码评审轮次 · 终态**：

- **内部 explore 分歧审计（轮 1）**：四类偏差（半实现 ∕ 静默简化 ∕ 文档漂移 ∕ 越面）**零发现**；正向抽核逐处相符（档头句落位 ∕ M-608a 非空过 ∕ 旧形零残留 ∕ 行数承诺 ∕ 零临时物残留）。
- **内部代码评审（advisor · type=code）轮 1**：**pass**（0🔴；🟡4 ∕ 🔵5——皆非 must-fix）。发现面：探针失败信号缺位（🟡）· 核两档 ∕ 批内件行数超顾问线（🟡 · 既有/在册）· `block.mjs:40` 旧名句（🟡 报告项）· P9 固定墙钟（🔵）· M-608c 文本锁（🔵）· 投影射程声明（🔵）· 批档 §5 波 4 段缺位（🔵）· `RENDER-CORE.md:350` 计数（🔵）· `activity.mjs:130` 措辞（射程外注记）。
- **fix 轮（实到 1 轮 · 3 处落）**：① P9 探针帧落判面改**有界谓词等待**（`waitForFunction` 5s + 兜底 `catch` 后照断言）+ 失败信号 `failed ∕ verdict` + 非零退出码（`process.exit` 落 `app.close` 后）；② M-608c 增**桌面源面核**（deps 仅 `{ now }` ∧ 零 `trace:`）；③ 件头补**投影射程声明**。修后复跑：M-608 **3/3** · P9 **6/6**（failed:[] ∕ verdict:true ∕ exit 0）。
- **轮 2（严格复核 fix 声明）**：三条主张逐字核实兑现（Fixed）；新增面零；**pass**。
- **终态 = `clean`**（R1 pass ⇒ 修复轮 ⇒ R2 pass 收敛）。

**响应表（评审轮 1 逐条）**：

| 评 | 项 | 处置 |
|---|---|---|
| 🟡 | 探针失败信号缺位（P9 无退出码 ∕ 无断言） | **落（修）**——failed ∕ verdict + `process.exit`（落 `app.close` 后）；复跑 6/6（exit 0） |
| 🟡 | 核两档 ∕ 批内件行数超 300 顾问线 | **给由 + 报父侧文档层**（既有/在册：state.mjs 临线注在册；批内件非产品档先例行） |
| 🟡 | `block.mjs:40` 旧名句（`S._subDescShown`）未随 #630 ∕ #608④ 收正 | **报父侧收口轮**（设计句收正建议包——披露 1；本轮不越父裁射程自改） |
| 🔵 | P9 固定墙钟等待（假红风险） | **落（修）**——有界谓词等待（沿波 5 先例） |
| 🔵 | M-608c「零注入」给由仅锁文本 | **落（修）**——增桌面源面核（deps 形 + 零 `trace:`） |
| 🔵 | M-608a 投影射程未在件头注明 | **落（修）**——件头补投影射程声明 |
| 🔵 | 批档 §5 缺波 4 段 | **落**——本段落字即消解 |
| 🔵 | `RENDER-CORE.md:350`「×2」计数与实到三处不符 | **报父侧文档层**（同轮收正——披露 1） |
| 🔵 | `activity.mjs:130` 会话换代注措辞滞后 | **报父侧收口轮**（披露 1 包） |

**未跑面（如实）**：仓套件零跑（全清令）；真机 P9 由本舱预跑作证（父侧可复核复跑）；doc-check 前后读数日志在盘。

**收口补记（doc-check after · 本舱）**：`node scripts/doc-check.mjs` 复跑 = 悬空 **30 ⇒ 30**（同值）· 拟新增 **27 ⇒ 27**（同值）· 迁移期引文 **298 ⇒ 298**（同值）· 行宽 **65 ⇒ 67** —— **本批写域零新增红**（本批档 `batches/2026-09-29-desktop-rebuild-fidelity*` 在行宽 ∕ 锚面零命中；`batches` = 锚 ∕ 行宽扫描声明排除域）。+2 行宽 = **他批并发写入面**（`docs/core/design/CONFIG.md:231` ∕ `docs/core/design/PROVIDER.md:489` 新增 ∕ `PROJECT.md` 段行号整体 +2 移位——非本波肇因，留父侧收口核）。after 日志 = `.thincoder/tmp/2026-09-29-rebuild-fidelity-w4-doccheck-after.txt`（before 日志同目录）。

## §6 验证与收口（父代理）

**状态行**：✅ 已收口 2026-09-29

- **交付物全落（五波）**：波 1 设置 ∕ 向导（#604——M-604a/b/c + P1）∥ 波 2 重建保真族（#606——M-606a/b/c + P2–P5）∥ 波 3 滚动策略族（#607——抽核件 pin 工厂 + M-607a/b/c + P6）∥ 波 4 留端未接（#608——M-608a/b/c + P9；父裁 A 在册）∥ 波 5 段 14（#581——M-581 + P8）。各波 §5 实录在册（含审计 ∥ 内评轮次 ∥ 终态 clean）。
- **批内件收位（父侧转正）**：`docs/batches/2026-09-29-desktop-rebuild-fidelity-{M604 ∥ M606 ∥ M607 ∥ M608 ∥ m581}.test.mjs` + `{P1 ∥ P2P5 ∥ M607(P6) ∥ p8 ∥ P9}.probe.mjs`（十件在盘；读数 JSON 住 tmp——§5 引路径为准）。
- **验证（父侧亲跑）**：① 终位机检 = `node --test`（五件）⇒ **34 ∕ 34 pass · 0 fail**（573.8ms）；② 真机五探针终位亲跑 ⇒ **exit 0 链全过**（P1 ∕ P2P5 ∕ P9 `verdict: true` 在屏 ∥ P9 `failed: []`；页噪声两条 = 非判面）；③ doc-check 收口核 = 悬空 30 ⇒ 30 ∥ 拟新增 27 ⇒ 27 ∥ 引文 298 ⇒ 298 ∥ 行宽 65 ⇒ 67（+2 = 他批并发面——`CONFIG.md:231` ∕ `PROVIDER.md:489`，归 #664）；④ 负向对照两跑在册（波 4——跑毕还原复绿）。
- **收口测试行**：① 本批单元档 = 上述十件（随档留存；复跑 = 终位直接跑）；② 集成影响 = 无（全清令窗口）。
- **台账**：#604 ∕ #605 ∕ #606 ∕ #607 ∕ #608 ∕ #581 → 已核销（六条）。
- **遗留（显式）**：① 设计句收正族 = #661（含 §2.6④ 旗标句 ∥ `block.mjs:40` 旧名 ∥ `activity.mjs:130` 措辞 ∥ `RENDER-CORE.md:350` 计数 ∥ doc-sync 留项 `activity.mjs` 行数账）；② 两处预存红 = 他域归因在册（非本波肇因）；③ #652 两项 + #656 ∕ #659 ∕ #660 = desktop-carryover 批承运（§4 代签在册——实施门 = 本收口，已开）。
- **收口对账（D7）**：角色表 = §1 ∕ §2 ∕ §3 ∕ §4 ∕ §5（五波）∕ §6 ✓；状态行 ✓；计数 = 台账六条核销；指针 = 批内件十件终位实读；前批遗留交叉核 = doc-sync 留项 → #661 转承运 ✓。
- **收口结论**：本批终止。
