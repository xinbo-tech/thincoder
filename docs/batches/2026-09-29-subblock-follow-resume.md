# 2026-09-29 · subblock-follow-resume
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-29 · 来源 = 用户走查复报「子agent输出不滚动」（第三次）+ 父侧真机探针实锤（`thincoder/.thincoder/tmp/scroll-probe{,2}.mjs`）：跟滚链在真机通，但「让位」旗标 `_pinFollow=false` 后无任何出路 = 可见窗永久停摆。
> 台账 = #603（desktop · 立批）。前情 = #518 批（已收口 2026-09-29）+ 真机探针实锤。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-29

### 1.1 报障与真机实锤（父侧 · 2026-09-29）

用户三次复报「子agent输出不滚动」（09-28 18:15 ∕ 09-29 03:10 ∕ 09-29 13:16）。**#518 修复（今晨 03:5x 收口）未解决症状**——用户实例（12:14 启动）已载修复后代码（探针实证）。

**探针实锤（`thincoder/.thincoder/tmp/scroll-probe{,2}.mjs` · 真 Electron + 真滚轮 · 逐帧读数）**：
1. 跟滚链在真机**通**：流式 1→20 行，`gap` 恒 0、逐帧追底 ✓；
2. **一记真滚轮（-120px；内容窗仅 60px 高一滚到顶）⇒ `_pinFollow=false`** ⇒ 新行照收（128→144px）而 `scrollTop` 纹丝不动（gap 68→84）——**可见窗永久停摆、零提示、零自动恢复**；
3. 复跟路径存在但**不可发现**（把那 60px 小窗滚回近底才恢复——探针④⑤实证）；
4. 触发几乎不可避免：滚池列时指针悬任一块内容区 ⇒ 滚轮被内容窗吃掉并踩翻旗标；
5. **假 DOM 用例不发真实 scroll 事件 ⇒ 13/13 全绿而真机坏**（#518「测试全绿真机仍坏」的结构原因）。

### 1.2 修法方向（父侧预钉 · 设计轮裁形给由）

- **死状态必须有可见出路（主体）**：内容区补「↓ 新内容∕回底」出口（池列已有同款 ↓N 钮——块内容区缺此对位；形态 ∕ 锚位 ∕ 交互设计轮定形）；
- **近底自动复跟**（已有——保留并纳入验收）；
- **降低无辜触发**（让位判据收窄——设计轮给由：如"已钉底时向下滚轮不得踩翻"∕"程序性滚动事件不入判据"等候选）；
- **核心两原语在核（`thincoder-render-core/subblocks/block.mjs`）两端共用** ⇒ 修法落核 ∕ 端适配 —— VSC 同族面（同旗标同陷阱）是否同修 = 设计轮对位裁（多实现面纪律）。
- **验收 = 真机探针入批**（父侧探针扩面；此类"假 DOM 测不出"的毛病以真滚轮验收为准）。

### 1.3 边界与串行

核 `subblocks/block.mjs` ∕ 桌面 `views/pool-subagents.mjs` ∕ `views/activity-new.mjs` ∕ 可能 VSC `webview/activity.js` —— 与在途批的桌面面文件清单对照后给串行建议；零新控件面（出口 ∕ 钮 = 阅读辅助面，非新功能）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成 · 2026-09-29（四轴定形 + 逐档落点 + 验收对照（真机探针入批）+ 核／端分层裁 + 冲突面串行建议 + 留端边界裁定（§2.13 · 档面清算同笔）+ 评审轮次 2 修正轮六项落定（§2.14）在册）

### 2.1 本批条目（覆盖）与回指

- **台账 #603**（desktop · 立批）；需求回指 = **D4**（活动与后台：「内容区跟滚（流式最新保持可见 · 用户上滚不抢 · 回近底复跟）」）· **D20**（右列子 agent 面板：「流式期近底保持」）——判据句 2026-09-29 已由父侧补落（两行在册）；**零新 D 行**。
- 批档 §1.2 三轴（可见出口 ∕ 近底复跟保留 ∕ 无辜触发收窄）+ 父侧补料四轴（A 根因消 churn ∕ B 帧尾覆盖 ∕ C 旗标卫生 ∕ D 可见出口 + 归档径接线）——本设计逐轴定形。
- 需求五要素核对：D4 ∕ D20 两行「模块目标 ∕ 功能点 ∕ 边界 ∕ 验收 ∕ 依赖」齐备（功能点 = 跟滚三句判据；验收 = 真机走查面 + 本批探针入批）。**判据缺口一处**（停跟态可见出路未入判据句）⇒ 上抛 §2.10。

### 2.2 缺陷链（现读实锁 · 探针三件在册）

`thincoder/.thincoder/tmp/scroll-probe{,2,3}.mjs`（真 Electron + 真滚轮）实锤六环：

1. 桌面**每 chunk 的 `mountPool`** 把子 agent 族容器 detach/reattach（`views/activity.mjs:236-238` `live.remove()` → `:252` `shell.replaceWith(family)`）⇒ 子树内可滚动件 `scrollTop` **归零**（探针③实测同元素 68→0；同任务内摘离亦归零——浏览器语义：盒子重建即失位）；
2. 复位被**复钉写**掩盖（旗标 `!== false` ⇒ 每帧写 MAX ⇒ gap 恒 0——探针① ✓，「正常时看似在工作」）；
3. **一记真滚轮**（-120px，内容窗仅 60px 高一滚到顶）⇒ `_pinFollow=false`（探针②）；
4. 此后每帧：复位到 0 + 零写 ⇒ **可见窗钉死内容顶、新输出全在折叠线下、手动滚随时被揪回**（探针②③合成）；
5. 恢复 = 滚回近底（不可发现——探针④⑤）；
6. **VSC 无 churn**（块出生即区尾 append，跨帧零摘离）⇒ 不出现 = 「VSC 好桌面坏」全解。

**辅因四缺口（父侧独立诊断 · 一并入设计面）**：① 每帧 churn（桌面独有；**含池区自身**——`clear(root)` 重建挂载时 `_poolPin=false` 路径无护位写）；② 无帧尾逐块复钉（VSC `streaming.js:31` rAF 脏集 ≤50ms 自愈；桌面只有 4 个 append 时刻写点）；③ 归档重建径（`views/chat-subagent.mjs:46-56` `echoOf`）零 `initBlockFollow` 接线；④ `scroll` 监听由几何算旗标 ⇒ 非用户位移（复位回波）也打死跟随（核 `subblocks/block.mjs:54-61`）。

### 2.3 设计（四轴定形 · 逐案给由）

**A 根因 = 池壳原位领用（消 churn）**

- **不变式（本批契约）**：子 agent 族容器的祖先链（host → `[data-pool-body]` → family → block → `.advisor-content`）跨帧**不得摘离 ∕ 重建**——位面保真由链稳定承担，不靠回写复原。
- **三径**（`mountPool`，落点 `views/activity.mjs:213-262`）：① `none` ∕ `empty` ⇒ `clear` + 零节点（既有——此时零块，无滚动件）；② 壳缺位（首挂 ∕ 会话换代后 ∕ 无壳态）⇒ 建树全挂（既有路径）；③ **壳在位 ∧ `pool` ⇒ 原位领用**：头 ∕ 审批族 ∕ 队列族 = **原位重建**（节点内零滚动件——重建零损失）；**子 agent 族容器与其项元素 = 原位领用**（零摘离、零移动）。
- **位置对账**：族序固定（审批 → 子 agent → 队列）——审批 ∕ 队列节点在族容器**两侧**原位增删（`insertBefore` 只动无滚动件者）；族容器自身零移动；折叠态 ⇒ 三族摘离（族容器存 `_poolSub`——用户手势触发，复位可接受 · 登记）；展开 ⇒ 复用 `_poolSub` 重插。
- **会话换代 ∕ 弃容器两径语义不变**（零块 ⇒ 弃 `_poolSub` + 计数清；换代 ⇒ 同上 + `_poolPin` 复位）——换代为跨会话，位面不复用（有意）。
- **被否**：a) **存位回填**（摘离前记 `scrollTop`、重挂后回写）——掩蔽非根因（摘离仍毁选区 ∕ 焦点 ∕ 嵌套滚动件位）+ 双机具 + 与复钉写竞态；b) 只护族容器（body 仍 `clear`）——祖先链断 ⇒ 位仍失（探针③口径即链级）；c) 全壳字段级就地 diff（头读数逐段更新）——与既有「壳照帧刷」形分叉、维护面反增（头节点无滚动件 ⇒ 原位重建已足）。

**B 覆盖 = 帧尾逐块复钉（VSC `streaming.js:31` 对位）**

- `mountPool` 尾（族在场）逐 `.sub-block` 应用 `maybeScrollBlock`——**任何位面被抹 ⇒ 下一帧自愈**（旗标真者复钉 MAX；旗标假者零写）。
- 落点：`views/pool-subagents.mjs` 新导出 `applySubBlockFollow(family)`（族级扫描）；`views/activity.mjs` 挂载尾调用（`syncSubBlocks` 之后）。
- 边界：只扫**池族** `.sub-block`（归档流内块 = 冻结静态——不扫、不写）。

**C 旗标卫生 = 让位仅凭用户手势 + 近底无条件自愈**

- 语义三条（核 `initBlockFollow` 重写）：① 近底（gap < 24px）⇒ `_pinFollow = true`（**无条件**——吸收程序性 ∕ 非手势位移回波）；② 远离底 ⇒ **仅当近期用户手势**（`wheel` ∕ `touchmove` ∕ `pointerdown` 起算 `GESTURE_GATE_MS = 600` 门内）才允许置 `false`（让位）；③ 其余（非手势位移：复位 ∕ 程序写 ∕ 布局回波）**不改旗标**——旗标真者由下一帧复钉写自愈。
- 监听集 = `wheel` ∕ `touchmove` ∕ `pointerdown`（手势标记）+ `scroll`（更新点）；全 `{ passive: true }`。手势集含 `pointerdown` 的理由 = **拖条让位保真**（拖条无 wheel；门控后 scroll 回波计入手势期）；`scroll` 保留的理由 = 近底自愈与键盘 ∕ 拖条 ∕ 程序写入三覆盖（#563① 不回收）。
- **被否**：a) `scroll` 只许翻真不许翻假（极简形）——拖条上滚「不抢」丢失（下一帧夺回阅读位）；b) 逐事件溯源（摘离标记 ∕ MutationObserver）——重机具、跨端不可移植；c) 撤 `scroll` 监听回退 #563①——三覆盖丢失；d) 「已钉底时向下滚轮不得踩翻」单列规则——C①② 已蕴含（钉底 + 向下 = 几何仍近底 ⇒ 真），不另设规则（**零冗余**）。

**D 可见出口（主体交付）= 内容窗「↓ 新内容 ∕ 回到最新」**

- **形**：`button.sub-follow-btn`（核件创建 ∕ 持有——`block.appendChild`；`position: absolute` 右下 overlay，同 `.sub-stop-btn` 家族先例；**不置于 `.advisor-content` 内**——避与行合并判据（`content.lastElementChild` 读点）相扰）。
- **在场判据**：`block.open ∧ 非冻结 ∧ _pinFollow === false ∧ 内容可滚（scrollHeight > clientHeight）`；折叠态 CSS 兜底 `.advisor-block.sub-block:not([open]) .sub-follow-btn { display: none }`（灭 1 帧残位）。
- **两态文案**：让位期间有新行到达（`_subFollowNew`——`renderSubagentChunk` 追加时若旗标假 ⇒ 置真）⇒ `sub.follow.new`；否则 ⇒ `sub.follow.bottom`。
- **交互**：点击 ⇒ `scrollTop = MAX` + `_pinFollow = true` + 清 `_subFollowNew` + 同步（钮退场）；无新通道 ∕ 无 IPC（核件本地面）。
- **清账路**：点击 ∕ 近底复跟（旗标翻真 ⇒ 同步退场）∕ 元素重建（随元素灭）——同池钮三清账路对位。
- **同步点**：`maybeScrollBlock`（应用四点 + 帧尾扫）· 手势处理器（旗标翻转后）· 钮点击——幂等。
- **被否**：a) `↓ N 新行` 计数（池钮 `↓ N 新块` 直搬）——行合并（text 续写 ∕ toolOutput RAW 拼接）致 N 语义不闭合 + 噪声；b) 块头行内钮（summary）——与 tail-3 折叠面争位、可发现性低；c) 钮置内容区首（VSC 池钮 sticky 形）——60px 窗首行即正文顶，遮内容；d) 端侧各建——双实现面（违单源）；e) 常驻显形（不设在场判据）——静息噪声（池钮同样按需建 ∕ 删）。

**E 归档径接线（父侧缺口③）**

- `views/chat-subagent.mjs` `echoOf`（`:46-56`）尾接 `initBlockFollow(element)`——**接线一致性**（出生 ∕ 接管 ∕ 重放三径同件）；冻结块零行为变更（出口钮不建、零写）。
- 说明：**非现象面来源**（冻结块无跟滚语义）——防御性单源接线；归档块展开位（顶部起）零改（两端同形，非端差）。

### 2.4 核 ∕ 端分层裁（多实现面纪律）

| 面 | 归属 | 内容 | 由 |
|---|---|---|---|
| 核 `thincoder-render-core/subblocks/block.mjs` | 入核 | **C 旗标卫生** + **D 出口**（创建 ∕ 两态 ∕ 点击 ∕ 同步） | 两原语本就在核、两端共用 ⇒ 同族面**默认同修**（跨端可见差消除）；纯 DOM 零调度依赖（KD-RC-8 定性不破） |
| 桌面端 | 端侧 | **A**（池壳领用）· **B**（帧尾扫）· **E**（归档径接线） | churn 为桌面独有缺陷面（VSC 无）；应用时机契约在核 ∕ 触发源在端（帧合并 ∕ 更新纪律已收核——KD-RC-8③ · KD-RC-9） |
| VSC 端 | 端侧（两条落点） | **零代码逻辑改**——随核自动获 C+D；仅：`locales/{en,zh}.json` 两键（加键批同轮登记）+ `base.css` 钮样式 | VSC 同旗标同陷阱（死开关成立、严重度低：无 churn ⇒ 手动滚位稳定、滚回近底即复跟）——不开第二条出口形；A ∕ B 桌面专属，VSC 无需 |

### 2.5 逐档落点（现行 ⇒ 预期 · 越层核）

| # | 档 | 现行（实读 2026-09-29 · 内容行数） | 预期 | 越层核 |
|---|---|---|---|---|
| P1 | `thincoder-render-core/subblocks/block.mjs` | **71** | ≈**120**（+≤50：C 手势门 + D 钮三件 + 档注随改） | 未越 300 ✓ |
| P2 | `thincoder-desktop/renderer/views/activity.mjs` | **262** | ≈**292–312**（领用对账 + 帧尾扫调用 + 头/族原位重建；注释面重写） | **贴线风险**：>300 ⇒ 执行预案 = 纯构树族出档 `renderer/views/pool-tree.mjs`（`poolModel` ∕ `poolTree` ∕ 节点族；本档留挂载编排——沿「纯构树 / 薄挂载」两层分家） |
| P3 | `thincoder-desktop/renderer/views/pool-subagents.mjs` | **115** | ≈**128**（+新导出 `applySubBlockFollow`） | 未越 ✓ |
| P4 | `thincoder-desktop/renderer/views/chat-subagent.mjs` | **75** | ≈**78**（+import + 一调） | 未越 ✓ |
| P5 | `thincoder-desktop/renderer/core.css` | **287** | ≈**295**（+`.sub-follow-btn` 规则 + `:not([open])` 兜底 + 值源行） | **贴线**（<300 预算内——实施超 300 即停手上抛） |
| P6 | `thincoder-desktop/renderer/i18n.mjs` | **480** | ≈**488**（+两键 × 两语 + 链记录行；键数链 `HOST_DICT` **269 ⇒ 271**） | 越 300 在册（键行改动 = **非结构性触碰** ⇒ 续期登记；窗口 = 键面族下次结构性触碰） |
| P7 | `thincoder-vscode/locales/en.json` ∕ `zh.json` | **270 ∕ 270** | ≈**272 ∕ 272**（+两键，两语同拍） | 未越 ✓ |
| P8 | `thincoder-vscode/webview/base.css` | **476** | ≈**483**（+`.sub-follow-btn` 规则——`.activity-new-btn` 邻位） | 未越 500 ✓（**避让 `chat.css`**：该档实读 **511** 已越 500 硬限 ⇒ 不加剧；域外观察 = §2.10-2） |
| P9 | 批次本地件（机检腿） | — | 新 `docs/batches/2026-09-29-subblock-follow-resume.test.mjs`（暂存 `.thincoder/tmp/` ⇒ 父侧 copy 终位——#545 立即形） | — |
| P10 | 批次本地件（真机探针 · 验收必需腿） | — | 新 `docs/batches/2026-09-29-subblock-follow-resume.probe.mjs`（父侧三件扩面；暂存 ⇒ 父侧 copy 收位） | — |
| P11 | 文档面 | — | `docs/render-core/design/RENDER-CORE.md`（KD-RC-8 收正 + 构件行 + 文件行 + 变更行）· `docs/desktop/design/UI.md`（新本批注 + #518 本批注条目收正）· `docs/desktop/design/RENDERER.md`（§1.1 池挂载条 + §3 三条）· `docs/desktop/design/PROJECT.md`（§4.1 三行 + §4.2 本批块 + KD-47 + §10 行 + 变更行）· `docs/vsc/design/WEBVIEW.md`（§5.5 两条）· `docs/vsc/design/WEBVIEW-PROTOCOL.md`（§6.3 两键 + 计数 24 ⇒ 26） | — |

**零触面（实施轮判据 = 零 diff）**：会话流主跟滚面（`views/chat-scroll.mjs` ∕ `views/chat.mjs` 帧尾三写 ∕ 药丸 ∕ 回填面）· `views/activity-new.mjs`（池旗标 ∕ 计数贴语义零改——#563② 有界自纠结论保持）· VSC `webview/activity.js` ∕ `streaming.js` ∕ `chat.css` · 核 `subblocks/activity-view.mjs` ∕ `subblocks/state.mjs` ∕ `flow/*` · 全部 `src/main/*` ∕ preload ∕ IPC 通道面 · 全树零新文件（除 P9 ∕ P10 批内件与 P2 预案档）。

### 2.6 验收对照（需求回指 + 逐条判据）

需求回指：**D4**（三句判据 + 本批补出口句 · 上抛）· **D20**（流式期近底保持）。判据载体两类：**机检腿**（批次本地件 · 假 DOM + 静态读面）+ **真机探针**（验收必需腿——「假 DOM 测不出」类以真滚轮读数为准）。

| # | 验收条目 | 判据（机检 ∕ 真机探针） | 回指 |
|---|---|---|---|
| A1 | **停跟有可见出路**：真滚轮上滚 ⇒ 出口钮在场（新内容态文案）；点击 ⇒ 回底 + 复跟（gap 0）+ 钮退场 | 真机 P3 | D4/D20 + 出口句（上抛） |
| A2 | **停跟 ≠ 死状态（复位消）**：让位后新行到达 ⇒ 内容区 `scrollTop` 不再被复位（保用户位）；新输出自用户位之下继续 | 真机 P3 + 机检（假 DOM churn 模型：摘离 ⇒ 子树位归零；领用径两连挂 ⇒ 保真） | D4 |
| A3 | **近底复跟保留**：滚回近底（< 24px）⇒ 旗标复真 + 下一帧复钉（gap 0） | 真机 P4 + 机检（几何双向） | D4 |
| A4 | **无辜触发收窄**：① 非手势位移（脚本写 `scrollTop`）不改旗标（不打死跟随）② 已钉底 + 向下滚轮不踩翻 ③ 拖条上滚让位仍成立（`pointerdown` 手势集） | 机检三例 + 真机 P5 | §1.2 第三轴 |
| A5 | **流式跟滚不回归**：1→20 行 gap 恒 0、逐帧追底 | 真机 P1（既有径）+ 机检 | D4/D20 |
| A6 | **池区 churn 消**：`_poolPin=false`（上滚池）+ 新 chunk ⇒ 池 `scrollTop` 不动；↓N 钮在场；点钮 ⇒ 回底 | 真机 P6 + 机检（领用径池位保真） | D20 |
| A7 | **归档径接线在场**（冻结零出口）：`echoOf` 后内容区监听在场；展开无异常、零钮 | 机检（监听在场断言）+ 真机 P7 | §2.3 E |
| A8 | **键面 ∕ 值面**：`sub.follow.new` ∕ `sub.follow.bottom` 两键两语在场（桌面 ∕ VSC 对拍逐字）；钮样式规则在场（两档） | 机检（键哨兵 + 值锁） | D4 |
| A9 | **结构等价**：同模型下领用径 DOM ≡ 重建径 DOM（tag ∕ 属性 ∕ 文本 ∕ 子序） | 机检 | §2.3 A |
| A10 | **留端清算**：六档（RENDER-CORE ∕ desktop UI ∕ RENDERER ∕ PROJECT ∕ WEBVIEW ∕ WEBVIEW-PROTOCOL）规范面 grep `调用时机留端` 零命中（记录面豁免）+ 实施后核件档头留端清单按 KD-RC-9 读回在册 | 机检（grep 腿 + 档头读回） | §2.13 · KD-RC-9 |
| A11 | **滚动策略族契约对拍腿**：四载体（块内容区 ∕ 活动区 ∕ 池列 ∕ 对话流）契约判据逐字同式（近底 24px ∕ 旗标门 ∕ 清账三路；判据漂移 = 缺陷） | 机检（批次本地机检件） | §2.13 项 4 |

**真机探针条目（探针件 = 父侧三件扩面 · `docs/batches/2026-09-29-subblock-follow-resume.probe.mjs`）**：P1 流式 1→20 行逐帧（gap 恒 0）· P2 同态重挂 churn（内容区位 ∕ 池区位保真）· P3 真滚轮上滚 ⇒ 让位 ⇒ 新行 ⇒ 位保真 + 钮在场 ⇒ 点钮回底 · P4 滚回近底复跟 · P5 非手势位移不踩旗标 + 钉底向下滚轮不踩翻 · P6 池区（60 块撑池 · `_poolPin=false` · 新 chunk 池位不动 + ↓N 钮）· P7 归档展开（零报错）。探针读数逐帧落盘为验收证据。

### 2.7 测试面（批次本地）

- **机检腿**（`docs/batches/2026-09-29-subblock-follow-resume.test.mjs`——harness 沿 #518 件：`../../thincoder-desktop/test/rc-resolve.mjs` + mini 假 DOM）：
  1. 核 C：默认钉底写 ∕ 近底无条件翻真 ∕ 手势上滚翻假 ∕ **非手势 scroll 不改旗标** ∕ 钉底 + 向下滚轮不踩翻 ∕ 手势门外 scroll 不改旗标；
  2. 核 D：钮出生判据三态（让位 ∧ 可滚 ∧ 展开 / 旗标真 ⇒ 不建 / 折叠 ⇒ 不建）· 两态文案切换 · 点击回底 + 复跟 + 钮退场 · `renderSubagentChunk` 让位期置 `_subFollowNew`；
  3. 桌面 A：churn 模型（假 DOM：摘离 ⇒ 子树 `.advisor-content` 位归零）下——**领用径两连挂 ⇒ 位保真**；结构等价（领用径 ≡ 重建径）；折叠 ∕ 展开 ∕ 换代语义不回归；
  4. 桌面 B：`applySubBlockFollow` 旗标双向（真 ⇒ 写 MAX；假 ⇒ 零写）+ `mountPool` 尾接线在场；
  5. 桌面 E：`echoOf` 产物监听在场（防御接线）+ 冻结零钮；
  6. 键 ∕ 值面：两键两语逐字（桌面 vs VSC 对拍）+ 两档样式规则在场。
- **真机探针**：§2.6 P1–P7（验收必需腿 · 真 Electron + 真滚轮）。
- **复跑**：`node --test docs/batches/2026-09-29-subblock-follow-resume.test.mjs`；探针 = `node docs/batches/2026-09-29-subblock-follow-resume.probe.mjs`（Electron 环境——父侧亲跑）。
- **仓套件**：不涉（零集成面变更；全清令口径保持——不写 ∕ 不改 ∕ 不跑）。

### 2.8 关键决策记录（含被否）

- **新增 KD-47**（`docs/desktop/design/PROJECT.md` §2 · 届盘 `:89`）「子 agent 块跟滚让位修复 = 链稳定（原位领用） + 帧尾复钉 + 旗标手势门 + 核件出口钮」；**KD-RC-8 收正**（核件语义：旗标 = 手势门控让位 + 无条件近底自愈 + 出口钮 = 原语自持面）。
- 被否候选（四轴）：A-存位回填 ∕ A-只护族容器 ∕ A-全壳字段 diff；B-无（帧尾扫为直搬对位——唯一形）；C-单边翻真 ∕ C-事件溯源 ∕ C-撤 scroll ∕ C-钉底向下单列；D-计数钮 ∕ D-头行钮 ∕ D-区首钮 ∕ D-端侧各建 ∕ D-常驻显形；E-不接线（防御单源成立）。逐条由 = §2.3 各轴「被否」。
- **本批不发明**：出口钮计数语义 ∕ 归档展开位 ∕ 池旗标语义 ∕ 会话流药丸面——均零改（边界 = §2.9）。

### 2.9 边界（本批不做）

- 会话流主跟滚面（药丸 ∕ 回填 ∕ 帧尾三写 ∕ 平滑窗）**零触**（R12 既落在册）。
- 池折叠态切换 ∕ 会话换代的位面复位**不消除**（用户手势 ∕ 跨会话——可接受；登记）。
- `_poolPin` 旗标语义零改（#563②「有界自纠」结论保持）；池钮三清账路零改。
- 出口钮无计数、无动画、无快捷键（禁自造）；零新通道 ∕ 零新 IPC ∕ 零新依赖 ∕ 零 build。
- 核件其余留端项（出生位 ∕ 说明行判重 ∕ 痕迹 ∕ 帧调度）不属本批。

### 2.10 上抛项（归父侧）

1. **需求档判据句补**（笔权 = 主 agent）：D4 ∕ D20 建议补「停跟态有**可见出路**（↓ 新内容 ∕ 回到最新）」句（建议文本供采）；VSC `docs/vsc/requirements/WEBVIEW.md` F-W2（「活动区块内容区独立跟滚」）同族建议补出路句。
2. **VSC `chat.css` 越 500 硬限**（实读 511 · 2026-09-29）：域外观察——本批避让（样式落 `base.css`）；该档处置（拆分预案 ∕ 例外登记）归父侧裁。
3. **探针件收位**：`.thincoder/tmp/scroll-probe{,2,3}.mjs` ⇒ 批内件终位 `docs/batches/2026-09-29-subblock-follow-resume.probe.mjs`（父侧 copy；本设计以父侧三件为扩面基座）。
4. **读数收正**（本批就地落 · 零语义）：`PROJECT.md:221` i18n 行值按盘收正为 **480**（同拍 = 本档 §2.5 P6 · `PROJECT.md:644`；原引指针 `:219` 随正）。

### 2.11 冲突面核与串行建议（与在途批对照 · 实读 2026-09-29 13:xx）

在途批（§1 状态非已收口）涉桌面渲染面者：`parity-b10-ui`（W1 父侧直执行 + W2 在飞）· `desktop-statusline-cli-gap`（设计轮在飞）· `send-busy-timing`（设计完成待实施）· `desktop-susp-queue`（修正轮在跑）· `model-menu-parity`（实施完成待收口）· `parity-b7-minor` ∕ `parity-b8-ipc`（实施完成待收口）· `core-hygiene`（核面）。

| 同档 | 在途写者 | 处置 |
|---|---|---|
| `renderer/i18n.mjs` | parity-b10-ui（I2–I5 改 ∕ 并 W2 键增）· desktop-statusline-cli-gap（两值改 + 一键退 + 链行）· **本批（+2 键 ×2 语 + 链行）** | **串行**：本批键行落笔置于两者落定之后（同档禁并发写；后落者届盘重读再落——届盘重读纪律） |
| `thincoder-vscode/locales/{en,zh}.json` | parity-b10-ui（zh 一值） | 同上（串行；本批 +2 键为纯增，冲突面最小） |
| `docs/desktop/design/UI.md` | desktop-statusline-cli-gap（行 9/11 设计落）· desktop-susp-queue（输入区行收正） | 本批 = 新本批注 + #518 本批注两条目收正（异节位）——**仍按串行纪律**（后落者届盘重读） |
| `docs/desktop/design/IPC.md` | desktop-statusline-cli-gap（`ev:usage` ∕ `ev:ledger` 载荷注） | 本批零触 IPC.md ✓ |
| 核 `thincoder-render-core/subblocks/block.mjs` | **无**（residuals-sweep 已收口——#563① 已落） | 本批为唯一写者 ✓ |
| 桌面 `views/activity.mjs` ∕ `pool-subagents.mjs` ∕ `chat-subagent.mjs` ∕ `core.css` ∕ `pool.css` · VSC `base.css` ∕ `activity.js` | **无在途写者**（实读范围内） | 本批直落 ✓ |
| `docs/render-core/design/RENDER-CORE.md` ∕ `docs/vsc/design/{WEBVIEW,WEBVIEW-PROTOCOL}.md` | **无在途写者** | 本批直落 ✓ |
| `docs/desktop/design/RENDERER.md` ∕ `PROJECT.md` | 无在途写者（实读范围内） | 本批直落 ✓（落笔前届盘重读） |

**串行建议（一句）**：本批**实施**轮排于 `parity-b10-ui` 与 `desktop-statusline-cli-gap` 两批**落定之后**（仅 i18n ∕ locales ∕ UI.md 三档相关；其余档可并行）——或由父侧按批序统一裁。

### 2.12 评审范围清单（供 §3 评审子代理）

- **核语义**：`subblocks/block.mjs` C（手势门 ∕ 门值 ∕ 无条件近底自愈 ∕ 非手势位移零改）· D（钮在场判据 ∕ 两态 ∕ 点击 ∕ 同步点 ∕ 折叠兜底）；KD-RC-8 收正与实现同拍。
- **桌面面**：A（领用不变式 ∕ 三径 ∕ 位面保真 ∕ 结构等价 ∕ 换代语义）· B（帧尾扫覆盖 ∕ 零写边界）· E（归档径接线 ∕ 冻结零钮）· P2 越层预案（>300 触发口径）。
- **VSC 面**：两键两语逐字 ∕ 登记（§6.3 计数 24 ⇒ 26）· `base.css` 样式 ∕ 无逻辑改判据。
- **验收面**：A1–A11 逐条判据可机检性（含 A10 留端清算 ∕ A11 族契约对拍腿）+ 真机探针 P1–P7 条目与父侧三件扩面关系；键 ∕ 值锁；批次本地件暂存 ⇒ 终位路径。
- **文档面**：六档落点（§2.5 P11）与「零触面」清单一致性；上抛四项。

### 2.13 留端边界裁定与档面清算（用户裁定 · 同笔落 · 2026-09-29）

**裁定（用户原话）：设计文档须把「留端」这条失败边界写死**——「该机制两半归谁写死：谁持原语、谁持时机、时机面是否也应收进核 ∕ 统一——给由裁」；**判据 = 档面不得再出现「同机制两半分立而无人统一」的表述**。

**两半归属（定死）**：

1. **原语 ∕ 旗标语义 ∕ 出口钮 = 核**（`subblocks/block.mjs`——单源）。
2. **应用时机契约 = 核**：应用点清单（追加后 · 挂载后 · 帧尾复核）= 核档 §5 单源；端只在宿主时刻按清单调用核应用器（核 = `maybeScrollBlock`；端侧族扫 = `views/pool-subagents.mjs` 的 `applySubBlockFollow`）；**端侧遗漏应用点 = 违约缺陷**（机检腿逐端在册；#518 四点、#603 帧尾、归档径三漏即契约缺位所致）。
3. **触发源 = 端**（VSC 流式装配 ∕ 桌面 store 变更 ⇒ 调核帧合并件 `mark`）——**帧合并 ∕ 更新纪律已收核**（rAF 属浏览器原生面——核 §1.2 定性内；单源 = `RENDER-CORE.md` §2 KD-RC-9）；给由 = 触发源属宿主（核不持宿主句柄——§1.2 四条）。
4. **滚动策略族契约同源**（块内容区 ∕ 活动区 ∕ 池列 ∕ 对话流四载体**一句契约**：近底 24px 判据 ∕ 旗标门 `!== false` ⇒ 写 `scrollTop = MAX` ∕ 不夺阅读位 ∕ 清账三路）——端实现 = 契约**适配器**（判据逐字同式 · 对拍机检腿）；**判据漂移 = 缺陷**。

**档面清算逐处（已落 · 实读）**：

- `docs/render-core/design/RENDER-CORE.md`：**KD-RC-8 决策栏**收正（两半归属四条——同上，与 KD-RC-9 同拍）＋§3 行 4（`activity.js`）「应用时机契约在核 ∕ 触发源在端（帧合并 ∕ 更新纪律收核）」＋§5 构件族行同拍；变更行随动。
- `docs/desktop/design/RENDERER.md` §3：块内容区跟滚条补「应用时机契约在核（应用点清单）· 触发源在端 · 端侧遗漏 = 违约缺陷」；池区帧尾钉底条补滚动策略族契约句；变更行随动。
- `docs/desktop/design/UI.md` §1 本批注：增**项 6「边界归属（留端清算）」**；变更行随动（五项 ⇒ 六项）。
- `docs/desktop/design/PROJECT.md` §10：增 **CD** 行（裁定落记录——两半归属定死 ∕ 判据在册）；变更行随动。
- `docs/vsc/design/WEBVIEW.md` §5.5 ∕ `WEBVIEW-PROTOCOL.md` §6.3：VSC 面随拍（VSC 语义随核同收 = 该契约的 VSC 侧引用；无「留端」表述残留）。

**实施面义务（同笔入 P1）**：核 `thincoder-render-core/subblocks/block.mjs` **档头「留端清单」重写**（重写结果须与 KD-RC-9 一致——该档头 = A10 实施后读回面）——「块级跟滚」项 ⇒ 「原语 ∕ 旗标 ∕ 出口钮 ∕ 核应用器住本档；应用点契约住核档；触发源在端（帧合并 ∕ 更新纪律已收核）」；「区钉底」项 ⇒ 滚动策略族契约句（判据 ∕ 清账路 = 契约；载体与帧调用点 = 宿主适配）。

**机检判据（并入验收 A10）**：六档（RENDER-CORE ∕ desktop UI ∕ RENDERER ∕ PROJECT ∕ WEBVIEW ∕ WEBVIEW-PROTOCOL）grep `调用时机留端` **零命中**（涉块跟滚条目）；实施后核件档头留端清单按新裁定读回在册。

**§2.13 补注（A10 口径）**：A10 的「grep 零命中」限**规范面**——变更记录 ∕ 历史行不在判据面（`RENDER-CORE.md:434` ∕ `:438` 与 `2026-09-28-desktop-subblock-follow.md` 两处为**记录面**（日期明示的历史行 —— 记录面不回改））。规范面实测：六档规范条文与 §5 构件行「调用时机留端」**零命中** ✓。

**§2.13 注记（2026-09-29 · KD-RC-9 随拍）**：§2.13 原「宿主帧模型 = 端」句与 KD-RC-9 不同步——修正轮已按 KD-RC-9 收正（见 §2.14）；单源 = `RENDER-CORE.md` §2 KD-RC-9；实施轮按 KD-RC-9 执行（帧合并批在办）。

### 2.14 修正轮记录（评审轮次 2 发现处置 · 2026-09-29）

**射程 = §3 轮次 2 六项逐号处置（父侧全数接受 1..6）**；改动面 = 本 §2（就地 · 按 KD-RC-9 现行口径改述 ∕ 失效句删除）+ `docs/desktop/design/PROJECT.md` 读数 ∕ 指针同拍（零语义）；零产品码 ∕ 零测试件 ∕ 零新语义。

| # | 处置 | 落点（改后实读） |
|---|---|---|
| 1 | 留端口径按 KD-RC-9 收正（「触发源 = 端 · 帧合并 ∕ 更新纪律已收核」现行句；失效句删除——沿革 = §2.13 注记（`:220`）∥ §3 轮次 2）；核件档头重写指引同步改（+「重写结果须与 KD-RC-9 一致 · 该档头 = A10 读回面」句） | 本档 `:95` · `:203` · `:214`；同笔清残余 = `:199`（标题括注）· `:208` ∕ `:209` ∕ `:211`（档面清算逐处中间态引文收正）· `:218`（补注内旧措辞句）· `:220`（注记补收正收束） |
| 2 | §2.6 补 **A10**（六档 grep 零命中 + 核档头留端清单读回）+ **A11**（滚动策略族契约对拍腿——载体 = 批次本地机检件）；§2.12 验收面句同拍 | 本档 `:131-132` · `:192` |
| 3 | 决策号改指 **KD-47**（届盘 = `docs/desktop/design/PROJECT.md:89`） | 本档 `:112` · `:151` |
| 4 | i18n 读数回填 **480**（预期 ≈488 随动）；指针收正 `:219 ⇒ :221`（届盘实读） | 本档 `:107` · `:168`；`PROJECT.md:221` ∕ `:644` + `:285` ∕ `:287`（同读数——见注①） |
| 5 | §2.13 项 2 括注归属点名（核 = `maybeScrollBlock`；端侧族扫 = `views/pool-subagents.mjs` 的 `applySubBlockFollow`） | 本档 `:202` |
| 6 | §2.13 补注行号收正（`RENDER-CORE.md:419` ⇒ `:434` ∕ `:438`；记录面分类不变） | 本档 `:218` |

**注（发现 · 报父侧）**：

① 发现 4 射程枚举「三处」不完整——`PROJECT.md` 另有 `:285` ∕ `:287` 两处同读数（§4.1 在册段），已同拍收正（零语义）；`PROJECT.md:582`（复制面对齐批块）· `:1242` ∕ `:1251`（变更记录）载 482 旧读数 = 记录面（未动）。

② `PROJECT.md:973`（§10 CE③ · 他批上抛行）引「#603 批档 §2.13 不同步」——前提随本轮收正消解；同笔收正与否归父侧（未动）。

③ 残留 grep 命中面（全树实读 2026-09-29 · 两短语）——本档规范面（`:95` ∕ `:203` ∕ `:214`）**零命中**；遗留全为记录面 ∕ 判据面，清单见④。

④ 记录面 ∕ 判据面清单：本档 `:131`（A10 判据引文）· `:216` ∕ `:218`（判据 ∕ 口径引文）· `:220`（注记）· §3 轮次引用；六档记录面 = `RENDER-CORE.md:434` ∕ `:438` ∕ `:439` · `RENDERER.md:217` · `PROJECT.md:1252`（`:973` 见②）；他批批档记录 = `2026-09-28-desktop-subblock-follow.md:120` ∕ `:243` · `2026-09-29-render-perf.md:18` ∕ `:30` ∕ `:150` ∕ `:178`。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**设计评审 · 射程 = 八档**（RENDER-CORE ∕ desktop {RENDERER,UI,PROJECT} ∕ vsc {WEBVIEW,WEBVIEW-PROTOCOL} ∕ desktop-req PROJECT ∕ vsc-req WEBVIEW）；行数实读已抽核（block.mjs 71 · activity.mjs 262 · pool-subagents.mjs 115 · chat-subagent.mjs 75 · core.css 287 · i18n.mjs 482 · base.css 476 · locales 270 · chat.css 511——全部对齐）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements | 🟡 | 让位三律的手势门只枚举 `wheel` ∕ `touchmove` ∕ `pointerdown`（`docs/desktop/design/RENDERER.md:124` · `docs/vsc/design/WEBVIEW.md:409` · `docs/render-core/design/RENDER-CORE.md:74`）——键盘位移既不属手势，也不属③「非手势位移（复位回波 ∕ 程序写 ∕ 布局）」，分类无槽；而现行核件监听集保留 `scroll` 的理由正是「键盘 ∕ 拖条 ∕ 程序写入全覆盖」（实读证据 = `thincoder-render-core/subblocks/block.mjs:50-53`）⇒ 新判据下键盘上滚不再置假、下一帧复钉夺回阅读位，与需求「用户上滚不抢 ∕ 上滚解钉」句相抵（`docs/desktop/requirements/PROJECT.md:149` D4 · `:165` D20 · `docs/vsc/requirements/WEBVIEW.md:21` F-W2 判定句）；`docs/desktop/design/UI.md:489` 边界节未登记该径（键盘径可达性 unverified——需真机核）。 | 给键盘位移一个归宿（纳入让位判据或另立判据），或在边界节按既有口径补「键盘径 = 残余 ∕ 归属」句——取一即消悬空。 |
| 2 | Affected-file annotations | 🟡 | `thincoder-vscode/webview/base.css` 现行 **476**（>300 顾问层）本批再增（**≈483**）——文件表（`docs/desktop/design/PROJECT.md:643`）只给「现行 ⇒ 预期」，**无越层在册 ∕ 拆分预案**；同表他档皆有（`views/activity.mjs` **262 ⇒ ≈292–312** 带预案 `:637` · `renderer/i18n.mjs` **482 ⇒ ≈490**「越 300 在册」`:641` · 桌面 `chat.css` 312 带预案 `:199`）。 | 按同表口径给该行补「越 300 在册 + 预案 ∕ 续期」句，与 `chat.css` 的域外上抛句（`:949` CC②）分列。 |
| 3 | Acceptance | 🟡 | 机检腿载体悬空：`docs/desktop/design/PROJECT.md:644` ∕ `docs/desktop/design/UI.md:488` 记机检腿 = 「批次本地件 `docs/batches/2026-09-29-subblock-follow-resume.test.mjs`（暂存 ⇒ 父侧 copy）」，但全树 `**/*subblock-follow*` 实读 = 批档 .md + 探针三件（`…-probe.mjs` ∕ `-probe2.mjs` ∕ `-probe3.mjs`），**无 `.test.mjs` 件**、暂存位未点名；另 ④ 族契约句的「机检对拍腿」（`docs/render-core/design/RENDER-CORE.md:74` · `docs/desktop/design/RENDERER.md:125`）载体亦未在六档点名。 | 点名机检件现位（或改述为「本批须新增」）+ 对拍腿载体给单源指针，使机检腿与真机腿（探针三件在盘）同为可核对载体。 |
| 4 | Doc-state | 🔵 | 同档对探针件终位两名：`docs/desktop/design/PROJECT.md:644` 作 `-probe.mjs`，`:949`（CC③）作 `…resume.probe.mjs`；盘面实读为三件 hyphen 名。 | 收正为单值（或写明「三件扩面」的命名 ∕ 落位），消同档两名。 |
| 5 | Doc-state | 🔵 | `docs/render-core/design/RENDER-CORE.md:313` ∕ `:315`（#518 随动行）预测值未按实读回填（`block.mjs` 45 ⇒ ≈66 vs 本批现行 **71**（`:318`）；桌面 `pool-subagents.mjs` 108 ⇒ ≈118 vs 实读 **115**（`docs/desktop/design/PROJECT.md:638`））——该档回填口径句只覆盖 R1 ∕ R2（`:280`），两值与现值并载易生歧义。 | 随本批以「实读 N」旁注回填两行（或注明差值来源批）。 |
| 6 | Clarity | 🔵 | 三律③的保证在手势窗内退化：② = 「远离底 ∧ 手势门 600ms 内 ⇒ 翻假」、③ = 「其余不改」——窗内落进的非手势位移（布局回波等）按②计为让位，档面未写该窗内归因取舍（`docs/desktop/design/RENDERER.md:124` · `docs/vsc/design/WEBVIEW.md:409`）。 | 补一句窗口内归因取舍（窗口内以何者为准），或标明该窗内为有意取舍。 |
| 7 | Requirements | 🔵 | 需求 D16 义务句「凡改桌面可见面 ⇒ 验收须含一条真 Electron 使用面用例」（`docs/desktop/requirements/PROJECT.md:161`）在本批设计面未点名承载——真机腿 = 渲染链探针件（`docs/desktop/design/UI.md:488`），非使用面用例（T-DSK 族）。 | 明确探针是否计入该义务，或补一条真 Electron 使用面用例落点句。 |
| 8 | Document ownership | 🔵 | 评审上下文无文档地图 ∕ 方针档（口径限度披露）：按 Project Guide + 档内单源指针核对——机制单源 = 核档 KD-RC-8、端面形态 ∕ 工艺 ∕ 键表各归其档；未见新立文件承载既有节面 ∕ 同机制两说相抵；「调用时机留端」六档规范面零命中（留痕仅变更记录 ∕ 历史行 = 记录面）。 | 无动作（口径限度披露）。 |

**计数**：🔴 **0** · 🟡 **3** · 🔵 **5**（合计 8 行）。**射程外注记（无严重度）**：出口钮挂点（`block.appendChild` ∕ 不入 `.advisor-content`）· `_subFollowNew` 置 ∕ 清点 · `GESTURE_GATE_MS = 600` 值等细目住批档 §2（审外，未纳入核验）；批档对 `scroll` 保留理由的「键盘覆盖」字样与本表 #1 同源，归父侧判。

**VERDICT: pass**

### 轮次 2（评审子代理）

**复核射程**：批档 §2（四轴 A–E + §2.13 留端清算）· 六档设计面（RENDER-CORE ∕ desktop {RENDERER,UI,PROJECT} ∕ vsc {WEBVIEW,WEBVIEW-PROTOCOL}）全量复评。修正轮八项 + 增补 A/B 落定抽核**皆在盘**：① 键盘位移归属（`RENDER-CORE.md:74` · `RENDERER.md:136` · `UI.md:490` · `WEBVIEW.md:411`）② `base.css` 越层在册 + 续期（`PROJECT.md:646`）③ 机检腿改述 + 对拍腿载体单源（`PROJECT.md:647` · `RENDER-CORE.md:74` ④ · `RENDERER.md:138` · `UI.md:488`）④ 探针三件名收正（`PROJECT.md:647` · `UI.md:488`）⑤ RENDER-CORE 实读旁注回填（`:320-322` + 口径行 `:287`）⑥ 手势窗内归因取舍句（`RENDERER.md:136` · `WEBVIEW.md:411`）⑦ D16 承载句（`UI.md:489`）⑧ 文档地图限度披露（上轮）；增补 A = `WEBVIEW.md:410` 应用时机契约引用句；增补 B = `RENDER-CORE.md:74` ④ 载体指针 + `:171`「核不夺 = 实现载体」限定句。行数抽核九档（内容行数口径）：`block.mjs` 71 · `activity.mjs` 262 · `pool-subagents.mjs` 115 · `chat-subagent.mjs` 75 · `core.css` 287 · `base.css` 476 · `chat.css` 511 · `locales/en.json` 270 全合 · `i18n.mjs` 实读 **480**（标 482 ⇒ #4）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership ∕ Doc hygiene | 🟡 | 批档 §2.13 项 3（`:201`）与「实施面义务」（`:212`）仍以现行语气作「宿主帧模型 = 端 ∕ 时机面不收进核」，§2.4 表（`:95`）仍留「调用时机留端（KD-RC-8 分界）」——与唯一权威（`RENDER-CORE.md:74` KD-RC-8③「触发源 = 端 · 帧合并 ∕ 更新纪律已收核」· `:75` KD-RC-9）相抵。批档自注（`:218`）与 `PROJECT.md:973`（§10 CE③）已登记该不同步并指明「实施轮按 KD-RC-9 执行」⇒ 非未裁机制冲突（不入 🔴）；但失效表述仍留规范面，且 `:212` 实施义务句直接决定核件档头「留端清单」重写结果（现盘 `thincoder-render-core/subblocks/block.mjs:7` ∕ `:65` 仍持旧语，A10 于实施后读回）——照句落笔即产出与 KD-RC-9 相抵的档头。 | 三处（`:95` ∕ `:201` ∕ `:212`）按 KD-RC-9 现行口径改述、失效句删除，沿革移入记录面（沿用户 2026-09-18「失效表达须删除」裁定）。 |
| 2 | Acceptance | 🟡 | A10 无表行：§2.13（`:214` ∕ `:216`）声明「机检判据（并入验收 A10）」，但 §2.6 验收表只列 A1–A9（`:122-130`）、§2.12 评审范围亦只列 A1–A9（`:190`）；同源「滚动策略族契约对拍腿」（`RENDER-CORE.md:74` ④ · `RENDERER.md:138`——载体 = 批次本地机检件）亦无验收行落点。 | §2.6 补 A10 行（六档 grep 零命中 + 核档头留端清单读回）与对拍腿行（或并入既有行），使验收集可数且与 §2.13 自洽。 |
| 3 | Doc-state | 🟡 | 决策号跨档滞后：批档 §2.5 P11（`:112`）· §2.8（`:149`）称本批新增决策为 **KD-44**，届盘承载该决策的条目 = `docs/desktop/design/PROJECT.md:89` **KD-47**（KD-44 = 模型菜单一级扇出面——他批已占；该档变更行 `:1250` 亦作 KD-47）。 | 改指 KD-47（或加「号面以届盘为准」注），消指针对不上。 |
| 4 | Affected-file annotations | 🔵 | `thincoder-desktop/renderer/i18n.mjs` 三处标 **482**（批档 §2.5 P6 `:107` · `PROJECT.md:221` · `:644`；另 §2.10-4 引「`:219`」现为会话控制面行），盘面实读 = **480** 内容行（read 读数 481 行含文末空行，`:470-481` 尾段复核；同口径抽核八档皆合）。层界无影响（480 ∕ 482 皆 >300，已在册续期）。 | 按盘回填 480（预期列随动 ≈488）；`:219` 指针改 `:221`。 |
| 5 | Clarity | 🔵 | §2.13 项 2（`:200`）把「族级 `applySubBlockFollow`」并入「核应用器」括注，而 §2.3-B（`:66`）· `RENDERER.md:134` · `PROJECT.md:237` 三处均定该导出住端侧 `views/pool-subagents.mjs`（族扫 → 逐块调核 `maybeScrollBlock`；实读 `pool-subagents.mjs:96` `syncSubBlocks` 同档）。 | 括注内点名归属（核应用器 = `maybeScrollBlock`；端侧族扫 = `applySubBlockFollow`）。 |
| 6 | Doc-state | 🔵 | §2.13 补注（`:216`）点名 `RENDER-CORE.md:419` 为「调用时机留端」记录面落点之一，该行实不含此语（全树 grep 实读记录面 = `RENDER-CORE.md:434` ∕ `:438`；六档规范面零命中成立）。 | 行号收正 `:434` ∕ `:438`（A10 射程陈述随正），记录面分类不变。 |

**计数**：🔴 **0** · 🟡 **3** · 🔵 **3**（合计 6 行）。**射程外注记（无严重度）**：需求档（desktop D4 ∕ D20 · vsc F-W2）不在本轮声明射程，仅按设计回指抽核「停跟态可见出路」句在册（`docs/desktop/requirements/PROJECT.md:149` ∕ `:165` · `docs/vsc/requirements/WEBVIEW.md:21`）——与设计一致，不作发现项；评审上下文无文档地图 ∕ 方针档（Document ownership 判据为降级核对，沿轮次 1 口径）。

**VERDICT: pass**

## §4 用户批准（主 agent）

**父侧代签（用户 2026-09-29 13:52「别等我了，自己跑完」授权——自缚三条件核验）：**

① **评审 pass**：§3 轮次 2 = 通过（🔴0 · 🟡3 · 🔵3——重评审 #213；轮 1 #189 在其上）；
② **修正轮落定**：两轮修正全落（§2.10 ∕ §2.13 ∕ §2.14 在册；父侧抽验：`:95`（KD-RC-9 单口径）· `:131-132`（A10 ∕ A11 补位）· `:202-203`（归属点名 + 触发源句）· `:214`（实施义务含档头读回面）· `:220`（注记收束）——逐处现读一致；规范面「调用时机留端」零命中 ✓）；
③ **token 在位**（评审 #213 签发——值不落档）。

**准予进入实施（§5）。** 单实施舱（P1–P8 码面 + P9 机检件；P10 真机探针 = 父侧、P11 文档面已随设计轮落定）。实施轮按 §2.13 ∕ KD-RC-9 执行（核档头「留端清单」重写 = A10 读回面）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（P1–P9 落位 · 机检腿 24∕24 绿 · 审计收敛 · 评审 R1∕R2 修复主张均核实 · 携父侧待办 2（i18n 越 500 处置 ∕ waveB 取代披露））



### 5.1 交付摘要（逐档落点 P1–P9 · 行数 = 内容行数口径 · 实读 2026-09-29）

| 档 | 设计预期 | 实读 | 说明 |
|---|---|---|---|
| P1 `thincoder-render-core/subblocks/block.mjs` | 71 ⇒ ≈120 | **71 ⇒ 121**（+50） | C 让位三律（近底无条件翻真 ∕ 手势门 600ms 翻假 ∕ 非手势位移不改旗标；监听集 wheel/touchmove/pointerdown + scroll 全 passive）+ D 出口钮（`sub-follow-btn` 建 ∕ 更 ∕ 删 + 两态 `sub.follow.*` + 点击回底复跟；`renderSubagentChunk` 让位期置 `_subFollowNew`）+ **档头留端清单重写**（A10 读回面：原语 ∕ 旗标 ∕ 出口钮 ∕ 核应用器住本档 · 应用点契约住核档 · 触发源在端〔帧合并 ∕ 更新纪律已收核〕· 区钉底 = 滚动策略族契约句） |
| P2 `thincoder-desktop/renderer/views/activity.mjs` | 262 ⇒ ≈292–312（>300 ⇒ 预案） | **262 ⇒ 154** | **预案执行**（未拆自然落点 >300）⇒ 纯构树族出档 `pool-tree.mjs`。本档 = 挂载编排**三径**（① none ∕ empty ⇒ clear + 零节点 ② 壳缺位 ⇒ 建树全挂 ③ 壳在位 ∧ pool ⇒ `adoptPool` 原位领用——头 ∕ 审批族 ∕ 队列族原位重建；子 agent 族祖先链零摘离 ∕ 零移动）+ 尾接帧尾复核扫 + **兼容面** re-export（`export { poolModel, poolTree } from "./pool-tree.mjs"`——「原路径同名 re-export 保名面」，消评审 R1 🟡2 断点） |
| P2 预案档 `thincoder-desktop/renderer/views/pool-tree.mjs`（新） | —（预案） | **174** | 纯构树族：`poolModel` ∕ `poolTree` ∕ 节点族（头 ∕ 读数 ∕ 折叠控件 ∕ 三族条目；零 DOM ∕ 零 node: ∕ 零裸包） |
| P3 `thincoder-desktop/renderer/views/pool-subagents.mjs` | 115 ⇒ ≈128 | **115 ⇒ 127** | +`applySubBlockFollow(family)`（帧尾复核扫——族级逐块 `maybeScrollBlock`；`syncSubBlocks` 之后调用） |
| P4 `thincoder-desktop/renderer/views/chat-subagent.mjs` | 75 ⇒ ≈78 | **75 ⇒ 78** | `echoOf` 尾接 `initBlockFollow`（归档重建径接线一致性——冻结块零行为变更：出口钮不建、零写） |
| P5 `thincoder-desktop/renderer/core.css` | 287 ⇒ ≈295（>300 停手上抛） | **287 ⇒ 299** | +`.sub-follow-btn`（右下 overlay）+ `:not([open])` 折叠兜底 + `.sub-frozen` 冻结兜底（见 5.2-③）；**未触 >300** |
| P6 `thincoder-desktop/renderer/i18n.mjs` | 480 ⇒ ≈488（越 300 在册 · 续期） | **499 ⇒ 507** | 届盘重读：B10 W2 落定后实读合并表 279 ⇒ **281**（+2 键 ×2 语 + 链记录行；本批增量 ≈ +11 行）；**越 500 硬限事实与归属 = 5.3-① 上抛**（本批增量在限内） |
| P7 `thincoder-vscode/locales/{en,zh}.json` | 270 ⇒ ≈272（两语同拍） | **270 ⇒ 272 ∕ 272** | +`sub.follow.new`（en `↓ New output` ∕ zh `↓ 新内容`）· `sub.follow.bottom`（en `↓ Back to latest` ∕ zh `↓ 回到最新`）——值逐字对拍 |
| P8 `thincoder-vscode/webview/base.css` | 476 ⇒ ≈483 | **476 ⇒ 487** | +`.sub-follow-btn` + 两兜底（`.activity-new-btn` 邻位）；<500 ✓（VSC `chat.css` 零触） |
| P9 批内机检件（暂存 `.thincoder/tmp/2026-09-29-subblock-follow-resume.test.mjs`） | —（本批须新增） | **688 行 · 24 用例** | A1–A11 机检腿在件：核 C（三律六例）· 核 D（在场判据三态 ∕ 两态 ∕ 点击 ∕ 让位期新行 ∕ 复跟复位）· 桌面 A（churn 模型 + 位保真 ∕ 帧尾自愈 ∕ 结构等价 ∕ 折叠展开 ∕ 换代零块 ∕ 流式 1→20 ∕ 兼容面）· 桌面 B（帧尾扫双向 + 尾接线）· 桌面 E（监听在场 + 冻结零钮 ∕ 零写）· 键 ∕ 值面（A8）· A10 两腿（六档 grep + 档头读回）· A11（四载体对拍 + `NEAR_BOTTOM_PX === FOLLOW_PX`）。复跑 = `node --test .thincoder/tmp/2026-09-29-subblock-follow-resume.test.mjs`（终位 = `docs/batches/…`——父侧 copy） |

**验证读数**：机检腿 **24 ∕ 24 绿**；全档 `node --check` 绿（6 码档 + 批内件）；JSON 两档解析绿；**not repo-suite verified**（仓套件 = 父侧收口跑）。

### 5.2 决策透明表（实施轮）

| # | 决策 | 由 | 披露 |
|---|---|---|---|
| ① | **P2 预案拆档执行** | 领用 + 帧尾扫 + 头 ∕ 两族原位重建入档后自然落点 >300 顾问线 ⇒ 按 P2 在册预案「纯构树族出档」 | `activity.mjs` 154（原 262）／新档 `pool-tree.mjs` 174；定义单源 = 新档；旧取件路径经 re-export 保名（评审 R1 🟡2 落修） |
| ② | `_subFollowNew` 于**近底复跟时同清** | 两态语义（「让位期间有新行」）自洽——复跟即让位期结束；设计只点名点击清 | 机检腿「让位期两态复位」用例显式断言 |
| ③ | 两档 CSS 各补 **`.sub-frozen` 冻结兜底一行** | 在场判据含「非冻结」；VSC 归档块为**同枚元素**（折叠期隐藏、展开后若无手势则残钮）——CSS 灭残位（同折叠兜底机制） | 设计面只列 `:not([open])` ⇒ 文档面登记归父侧（5.3-④） |
| ④ | 领用门槛 = `state pool ∧ 族在场（blocks>0）∧ 同会话 ∧ body 在树` | 「壳在位」实现判据；零块帧保持 R5 弃账语义（零块帧不产族壳 ⇒ 建树径） | 机检腿「会话换代 ∕ 零块」用例锁语义 |
| ⑤ | 收口轮补：假钟确定性（`withFrozenClock` + 过期用例改确定性推进） | 代码评审 R1 🔵5 + R2 同族残余 | 见 5.4 轮次表 |

### 5.3 上抛（归父侧——细目见交付报告「射程外注记」）

① **`i18n.mjs` 越 500 硬限**（届盘实读 **507** 行；`PROJECT.md:285` 在册读数 480 ∕「在册例外：零」未随动）：本批增量 ≈ +11 行（限内）——越限为窗口级累计（含并行舱键增）；按仓内先例口径「实施实读越 500 ⇒ 停手上抛」处置：拆分键面族 ∕ 裁定登记（本批禁新文件 ⇒ 非本舱可闭）。
② **waveB 腿取代披露**（评审 R1 🟡3）：`docs/batches/2026-09-29-desktop-residuals-sweep-waveB.test.mjs:34 ∕ :38` 两断言被本批语义收正取代（监听集 + `pointerdown`；非手势位移不改旗标）——需 §6 收口披露登记（先例 = residuals-sweep 批 §2 披露）。
③ **链读数复核**：i18n 链行「281」与并行舱增键后实值（窗口内 281 → 295）——收口复读同笔收正。
④ **冻结兜底 CSS 一行的文档面登记**（实现三条兜底 vs 设计面两条）。

### 5.4 审计与代码评审轮次 · fix round · 终态

- **内部偏离审计**（explore · 只读 · 阻塞）：**收敛**——四类偏差（部分实现 ∕ 静默简化 ∕ 文档漂移 ∕ 表外改动）**零命中**；三项 🔵 观察（5.2-② ③ + 归档件 import 面）。
- **代码评审 R1**（advisor · code）：**changes-required**（1🔴 + 4🟡〔其中 2 笔 must-fix〕+ 3🔵）。
- **fix round 1**：🟡2 已修（兼容面 re-export 两行 + 机检腿加兼容面断言）· 🔵5 已修（`withFrozenClock` 假钟包裹两处手势门用例）。
- **代码评审 R2**（advisor · code · 仅复核修复主张）：**两笔修复均核实落实**；新发现 1🔵（同族残余——过期用例尾段真墙钟）⇒ **收口轮同笔修复**（改确定性推进）；**verdict = changes-required**——唯一阻塞 = 前轮 1🔴（i18n >500）+ 1🟡（waveB 披露）未消解，两笔全归父侧（R2 声明已排除出代码修复对象）。
- **终态**：本舱射程（P1–P9 码面 ∕ 批内件）**clean**（机检腿 24 ∕ 24 绿 + 全档 `node --check` 绿 + 审计收敛）；**携父侧待办 2**（5.3-①②）、披露 2（5.3-③④）。**not repo-suite verified**（父侧收口跑 = 唯一仓套件跑点）。

**5.5 父侧裁定随记（2026-09-29 · 实施收尾窗 · 父侧知情已核）**：`i18n.mjs` **终读 = 507 内容行 > 500 硬限**——归因 = **基线漂移**（设计轮读数 480；实施期实测 498；本批键行 +9 净落其上），**非本舱违规**；处置 = **拆分批父侧另立（排于 #222 之后走设计轮）**；**本舱不再触该档**。并发写者（W3 舱）与本舱**互不覆盖**（本批四键 + 注在盘：en `:147-148` ∕ zh `:312-313` ∕ 注 `:57-59`，父侧已核 ✓）。5.3-① 按此裁定归档（越限处置 = 父侧另批）；5.3-③ 链读数复核仍归收口面。

（口径注：5.1 P6 行「本批增量 ≈ +11 行」= 含链记录行 ∕ 注行的粗计；5.5 裁定「键行 +9 净」= 净计——**以 5.5 为准**。）

## §6 验证与收口（父代理）

**收口记录（父代理 · 2026-09-29）**

**波面（全落）**：单实施舱 #221（P1–P9 + P2 预案拆档 `pool-tree.mjs` + 批内件 688 行 ∕ 24 案；block 71⇒**121** · activity 262⇒**154**+pool-tree **174** · pool-subagents 127 · chat-subagent 78 · core.css **299** · VSC locales 272 ∕ 272 · base.css **487**）+ **父侧真机腿**（探针件 4 件：probe ∕ probe2 ∕ probe3 ∕ probe4〔父侧续写〕）+ 父侧随动（批内件转正 `docs/batches/2026-09-29-subblock-follow-resume.test.mjs` · waveB 件两断言收正 + #555⑤ 拆分后重锚 · i18n 链读数复读 · PROJECT 两行兜底登记）。

**验证（父侧）**：① 机检腿 **24 ∕ 24 绿**（父侧亲跑——含 A10 两腿（六档 grep + 档头读回）· A11 四载体对拍）；② **真机真 Electron 读数**（playwright-core 驱动，真滚轮 ∕ 真点击）：
- **A1 出口钮**：真滚轮上滚 ⇒ 钮在场 `↓ Back to latest` ⇒ 新行 ⇒ 位保真（`scrollTop` 不动）+ 钮升级 `↓ New output` ⇒ **真点击 ⇒ 回底 gap 0 + 复跟 + 钮退场**；
- **A2 ∕ A5**：流式 1→20 逐帧 gap 恒 0；让位后新 chunk ⇒ 内容位保真（68 保真 ∕ sameEl true——领用径）；
- **A3**：真滚轮回底 ⇒ gap 0 + 复跟 ⇒ 再流持续跟；
- **A4**：非手势位移不改旗标 ∕ 钉底向下滚不踩翻；
- **A6**：池位保真（`_poolPin=false` + 新块 ⇒ `scrollTop 500` 不动 + `↓ 1 new block(s)` 在场 ⇒ 拟 `paintPool` 接线后 **真点击 ⇒ 回底 + re-pin + 清账**〔探针直调 `mountPool` 绕过装配层 ⇒ 该腿需拟接线，已在件中注明〕）；
- 叠层观察（池头 `z-index:auto` ∕ `elementFromPoint` 单帧瞬态 = 文本元素）——**非阻断**（locator 真点击实证通过；如后续走查遇钮难点 ⇒ 候选 = 池头 z-index 显式）。
③ 舱内：审计收敛 + 代码评审 R1→fix→R2 收敛（终态 clean（本舱射程））；**not repo-suite verified**（收口跑 = 父侧终局轮）。

**上抛处置（§5.3 四条全闭）**：① i18n 507 越 500 硬限 = 基线漂移（5.5 裁）——**拆分批已排**（#614；待 #222 后走设计轮）；② waveB 两断言被取代 ⇒ **已随动收正**（含 #555⑤ 因 core-hygiene 拆分而重锚 `agent/turn-loop.mjs:77`）——**7 ∕ 7 绿**；③ 链读数 ⇒ **已复读收正**（`HOST_DICT` **295** ∕ `VIEWS_DICT` **124** ∕ `COMPOSER_DICT` **28**——i18n.mjs 链行 §收口复读 在册）；④ 兜底三 vs 二 ⇒ **已登记**（PROJECT.md §4.2 两行同笔）。

**边界**：设计档 ∕ 需求档 ∕ 未列码面零触；`chat.css`（511 越 500）避让记录在册；记录面残留未回改（沿纪律）。

**结算（D7）**：**#603 → 已核销**（依据本节 + §5 + 真机读数）。**状态行**：已收口 2026-09-29。
