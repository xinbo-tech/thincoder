# Webview 输入面与消息渲染契约（WEBVIEW-INPUT）· 设计 — VSC 部分

> 部分 = **vsc**（`docs/vsc/`）；板块 = **webview 前端面**的**输入与渲染面**——用户输入进入（键盘语义 / 输入历史 / 首块说明）与助手输出渲染（markdown 内联契约）两个端点面。
> 同板块同层另两档 = `WEBVIEW.md`（结构与活动区）· `WEBVIEW-PROTOCOL.md`（消息协议 · 秩序 · 忙态 · 状态行）。**同一机制只详述一处**（D2）。
> 需求侧 = `docs/vsc/requirements/WEBVIEW.md`（F-W1–F-W7 · F-W22 / N-W1–N-W6）；逐条回指见 §9。

## 1. 输入面 Enter 语义

**契约（逐条）**：

| # | 契约点 | 规则 | 落点 |
|---|---|---|---|
| C-B2-1 | 组合期 Enter 归输入法 | `e.isComposing` → 直接返回——**不 preventDefault**（键归输入法）、不发送 / 不注入 / 不接受建议。三处 Enter 分支同规；**无模块状态**（只读事件字段——组合结束后语义即时恢复，不粘滞） | `thincoder-render-core/composer/panel.mjs:126-132`（中断模态——组合守卫 `:128`）· `:161-170`（常规发送——组合守卫 `:163`） |
| | | | · `thincoder-render-core/composer/atmenu.mjs:119-129`（接受建议——组合守卫 `:121`） |
| C-B2-2 | @ 下拉与 send 的 Enter 协调 | 下拉打开时 Enter **只由 autocomplete 接受建议**（插入引用 + 关闭下拉），composer 核件不发送——让位 = 提前 `return` 且**保留 preventDefault**（防 Enter 默认换行落入输入框）；下拉关闭时 Enter 照常 `send()`（正控）。**注册次序前提**：composer 核件的 keydown 先于 @ 面（atmenu）注册 |  |
| | | | `thincoder-render-core/composer/panel.mjs:123`（键位监听）先于 `:243`（`atMenu` 创建）——次序前提句 `:167-168` |
| C-B2-3 | 打开态判据硬化 | 打开态判据 = `isOpen()`：`dropdown.style.display !== "none"`（单判据——元素恒在 ∕ 工厂恒建，无缺失支） | `thincoder-render-core/composer/atmenu.mjs:86-88`；让位调用点 = `thincoder-render-core/composer/panel.mjs:169` ∕ `:180` |
| C-B2-5 | 无工作区拒发可见提示 | `send()` 出口判 `S._workspaceRequired`（host `workspaceGuard` 消息置位）→ 拒发 + `showToast(t("workspace.required"))`（**先于** `addUser` / `setLoading`——无假气泡）；占位符第三态 = `t("workspace.requiredPlaceholder")`（守卫 > busy > 常态） | |
| | |  | `thincoder-render-core/composer/panel.mjs` `send()`（守卫出口——`:291-293`）· `webview/loading.js` `applyBusyLock` · `webview/chat.js` `case "workspaceGuard"` · `locales/{en,zh}.json` +2 键；判据 / 守卫面 = `docs/vsc/design/PROJECT-SWITCHER.md` §4.1 |
| C-B2-6 | busy 排队注入 | busy 提交**一律排队**：判据 = `S._turnState === "running"`（`_suspended` 不分流——挂起会话内与普通回合同判据） |
| | | ⇒ **流内零气泡**（待发送带在输入区上沿——细则⑦）+ `queuedUserMessage` postMessage（不 `setLoading` 不清面板）→ host **队列**（**容量 8 条**；满队 = 不提交，见细则①）。队列载体两态：无会话 ⇒ `panel._busyQueued`；会话在飞（`panel._susp`）⇒ 会话队列 `susp.pendingInput`（既有 `_chat` 分流——driver 步骤 1 优先取批）。**步边界消费（主）= 用户回合在飞时核循环头投递回调** |
| | | （核 opts `consumeQueuedInput`——装配点 = `thincoder-vscode/src/extension/panel-turn-loop.mjs`；系统轮不传回调——同 CLI 判据）。**不动面**：纯挂起等待（`susp`）既有队列；空输入 = 既有静默（`send()` 出口——`thincoder-render-core/composer/panel.mjs:287`）；无工作区守卫（C-B2-5）。细则 · 送达 · 落点见下方列表； |
| | | CLI 对位 = `docs/cli/design/TUI-INPUT-BOX.md` §4.1 |

- **C-B2-6 细则**：
  - ① 满队再提交（容量 8）= 拒绝 + 提示 + 文本保留——host 侧：`routeUserTurn` busy 分支队满（`count >= QUEUED_MAX_ITEMS`）⇒ 拒收 + 提示（`showWarningMessage`——外部入口兜底）；队内既有消息不被覆盖。
    **webview 守卫**（判据 / 状态清除时机 / 提示形三面）：

    · 判据 = `S._turnState === "running" && S._busyQueuedCount >= QUEUED_MAX_ITEMS`（8——核单源常量）⇒ 提交**不出泡 / 不清框** + toast（对位 CLI 满队面 = `thincoder-cli/src/tui/key-handler-busy.mjs`）；

    · 判据源 = host 推送 `busyQueued { count }`（权威 = **队列实况**——两载体合计条数：`_busyQueued` ∪ `susp.pendingInput`；外部入口 Ask ThinCoder / retry 同面入队，webview 不自持真值）；镜像 `S._busyQueuedCount` = host 推送快照如实镜像（**端侧零本地增量**——提交受理时不改写；`S._busyQueuedPending` = `count > 0` 保留）；

    满队门 = 该镜像计数如实直读（同 tick 空窗以宿主权威兜底——host 满队拒收 + `showWarningMessage` 提示）；

    · 状态清除时机 = **消费即清**——五个消费点（成员 / 携 `merged` / 出块 / 带面逐点 = 细则⑦ 消费点表——**成员单源在该表**）后 host 推实况（`count` / `items` / `merged`）；忙分支每次判决后 host 推实际占用；`webviewReady` 握手重推（Reload 冷启重同步——对位 C-B2-5 握手先例）；

    · 提示形 = toast（既有机制）+ 键 `input.slotFull`（zh/en 逐字 = `WEBVIEW-PROTOCOL.md` §6.3——值改条数阈）；占位符零改。
  - ② **送达 = 四支（均既有通道）**——⓪ **步边界（主——用户回合在飞）**：核循环头投递回调（核 opts `consumeQueuedInput`）按计划取批

    ⇒ `pushReal` 入历史（**下一步生效——不中断**）+ 推 `busyQueued { pending:false, count, items, merged }`（webview 消费成形——**带项退场 + 流内恰一枚 user 块**；细则⑦）；系统轮（digest / 上行唤醒轮）不传回调（域 / 门禁降格——同 CLI 判据）；

    **⓪ 贴图批让位**：本回调为同步面（F-1 视觉降级 = 异步读图，不可达）⇒ 批内任一条目携 `images` 即**不消费**——留给既有送达路径（driver 步骤 1 / 装载② / 退出残余；同过 F-1 判定，不静默丢图；让位判据落点 = `thincoder-vscode/src/extension/queued-pickup.mjs:38`）。

    ① **会话在飞入槽**：driver 步骤 1 输入优先消费（核 `startSuspension` 步 1——端装配 = `thincoder-vscode/src/extension/suspension.mjs`；先于 digest 合并）开用户回合；

    ② **池 live 进会话（回合尾）**：`enterSuspensionTurn` 将 `panel._busyQueued` 残项预填 `susp.pendingInput`（同一 driver 消费点）；③ **池空 idle 归位分支**：`_busyQueued` 非空 ⇒ 直接以该消息续发回合（后清槽）。

    会话退出兜底 = 核 `done.residualInput` ⇒ 普通回合续发（`suspension.mjs` 外壳面——零丢失）。送达侧气泡生命周期 = **与纯挂起既有 queued 路径同款**——送达时本地气泡即视为该消息 user 回声面，回合流式渲染不重复出气泡。

    **载体面取批贴图批退化**：driver 步骤 1 / 装载② / 退出残余三处共用取批——批内任一条目携 `images` ⇒ `count = 1`（逐条取；图片随条目元数据走 F-1 降级面），无贴图 ⇒ 按计划合并（取项单源 = 核 `thincoder-core/queued.mjs` `takeQueuedBatchItem`——三调用点 = `panel-turn-stages.mjs` ∕ `suspension.mjs`）。
  - ③ 外部入口（Ask ThinCoder 命令 / retry）经 `routeUserTurn` busy 分支同面分流（同判据同队列）——会话在飞同入会话队列（容量 8）；`chat-panel.mjs` `sendMessage` 的挂起会内 busy 拒收守卫随本次撤销（外部入口同面受理；**回显只走真回合**——忙态零 post；回显面 = `WEBVIEW-PROTOCOL.md` §4.1；细则⑦）。
  - ④ **busy 面统一**：挂起会话内 digest 与普通回合 busy 同判据（`S._suspended` 只作会话在场指示，不参与受理分流）。
  - ⑤ 落点 = 核 `thincoder-render-core/composer/panel.mjs` `send()`（出口分流——`running` 一律排队；槽满守卫在队列分支内）· `webview/state.js`（`_busyQueuedPending` 镜像字段）· `webview/chat.js`（`case "busyQueued"`）
    · `panel-messages.mjs` `routeUserTurn`（分流 + 入槽守卫 + `pushBusyQueued` 推送 / 握手重推——`pending` 判据两载体合计）· `panel-turn-stages.mjs` `enterSuspensionTurn`（装载两分支 + 贴图降级接点）

    · `chat-panel.mjs`（`_busyQueued` 初始化 + `_chat` susp 分支入槽 / 来源标记参 + `sendMessage` 守卫）· `image-handler.mjs`（F-1 降级判决函数）；协议登记 = `WEBVIEW-PROTOCOL.md` §3.2 行 16 / 行 17 + §12 行 + §6.3 键 `input.slotFull`；需求锚 = CLI 需求档 F16 对称句。
  - ⑥ **送达路由贴图降级对位**（与 idle 面同一判定——非直呼 `runChat` 旁路）：入槽项**两面同款携来源标记**（普通回合 busy 与会话在飞 busy）⇒ 送达时同过 F-1 判定——`images` 路径非空 ∧ `modelOverride` 在场 ∧ `specForModel(modelOverride).multimodal` 假 ⇒ 视觉渠道一次性子代理读图（成功 = 描述注入 text + images 清空；无渠道 / spawn 失败 / 超时 / 空返 ⇒ 原样兜底，不静默丢）。
    判决函数 = 核 `attachments.mjs` `downgradeNonVisionImages`（VSC `image-handler.mjs` 薄壳转口；`visionReader` per-call 注入缝——缺省回落生产跑者 = 核 `vision-reader.mjs`，形态同 idle 先例）。

    三调用点 = idle 面（含 `_turnState !== "susp"` 门）/ 装载②（`panel-turn-stages.mjs:229/:233` `deliverBusyQueued`——**先置 running 再 await**，同 F-1 idle 面忙锁不变量）

    / 装载① 与会话在飞（`panel-turn-stages.mjs:193` `runTurn` 闭包——入槽项带来源标记，仅该支降级）。
    A12/Stop 语义随迁（`panel._visionAbort` 定向中止；`_abortRequested` 置位序 = 呼叫 `runChat` 之后）；装载① 窗内 `_turnState` = susp（无 Stop 面——受读图 60s 超时约束）。
  - ⑦ **忙态排队面 = 输入区上方待发送带（非流内 · 派生）**：排队项**不在会话流内出气泡**；可见面 = 输入区上沿一条待发送带——对齐桌面端 KD-31 ∥ KD-40（`docs/desktop/design/COMPOSER.md:15` / `:26` / `:34`；用户 2026-10-20 12:03 裁定「这是缺陷，要对齐桌面端」）。
    · **勘源证据**（本设计所查源档）：桌面 `docs/desktop/design/COMPOSER.md` KD-31 ∥ KD-40（**有相关**——带面语义源）· `thincoder-desktop/renderer/views/chat-pending.mjs`（**有相关**——DOM 装树 ∕ 超限量面坐标）·

      CLI `docs/cli/design/TUI-INPUT-BOX.md` §4.1（**有相关**——忙态受理对位）· `docs/cli/design/TUI.md` §7.5（**有相关**——待发送块语义）· `thincoder-render-core/flow/queued-mark.mjs`（**有相关**——共用件现状）；仓外参考仓 —— **无相关**（带面形态源全在仓内两侧）。

    · **先例行（桌面实现坐标 + 先例批）**：带面装树 = `thincoder-desktop/renderer/views/chat-pending.mjs` `pendingGroupNode`（`:27` 入口——判据空返 `null` ⇒ 零节点；`:47` 容器 `.chat-pending`）。

      逐条节点 = `:40-45`（`[data-pending-item][data-raw]` + `.chat-pending-body` + `[data-pending-more]` 初置 `hidden`）；超限量面 = `paintPendingOverflow`（`:52-65`——`scrollHeight ÷ lineHeight` 四舍五入 > `ITEM_MAX_LINES`（`:16` = 3）⇒ 摘 `hidden` 并填行数词）。

      截断判据 = CSS `-webkit-line-clamp: 3`（正文视觉裁）+ 量面行数判（尾标记）；标签两形键逐字同桌面（`thincoder-desktop/renderer/i18n-views.mjs:65-67` / `:256-258`）。**先例批** = 桌面「对齐第二批」（决策单源 = `docs/desktop/design/PROJECT.md` §2 KD-31 ∥ KD-40）；**该批批档号未勘得——明写，不臆造**。

    · **DOM 形态**（结构单源 = `webview/pending-band.js`）：`#pending-band` 装配期创建并 `insertBefore` 到输入行（`composer.inputEl.parentElement`）之前——落位 = `#toolbar` 内、输入行紧邻上沿（机检 `band.nextElementSibling === 输入行`）。

      非流内：不在 `#messages`、不携 `data-block-kind`、`#messages` 子节点数零变；判据空 ⇒ `hidden` 零高（带随 `#toolbar` 贴底——短会话不浮起）。

    · **子形**：`[data-pending-band]` 容器 · `.chat-pending-label` 标签行（单条 `chat.pending.single` ∥ 多条 `chat.pending.multi {count}`）。

      逐条 `.chat-pending-item[data-pending-item][data-raw=原文]`；正文节点 = `.chat-pending-body`（CSS `-webkit-line-clamp: 3`）。**编号载体 = `.chat-pending-body` 的文本前缀 `${index + 1}. `**（多条形专有；单条形零前缀）——机检选择器 `[data-pending-item] .chat-pending-body`，前缀逐字。

      超限尾标记 `.chat-pending-more[data-pending-more]`（逐条节点内、正文之后；初置 `hidden`）。

      **量面取值对象与判据**：`body` = 该条 `.chat-pending-body` 元素；`scrollHeight` = `body.scrollHeight`（正文折行总高，px）；`lineHeight` = `Number.parseFloat(getComputedStyle(body).lineHeight)`；行数 = `Math.max(1, Math.round(scrollHeight / lineHeight))`。

      行数 > 3 ⇒ 摘 `hidden` 并填 `chat.pending.more {lines}`（`lines` = 该行数）。**「零版式」判据** = `body.scrollHeight` ∕ `body.clientHeight` 非 number（平 node——非 HTMLElement 桩）∨ `lineHeight` 非有限正数 ⇒ **早返零写**（尾标记维持 `hidden`，不写文案）。同桌面量面（`thincoder-desktop/renderer/views/chat-pending.mjs:52-65`）。

    · **数据源** = host 快照 `busyQueued { pending, count, items, merged? }`（协议 = `WEBVIEW-PROTOCOL.md` §3.2 行 17）：`items` = 队列**剩余**项原文（两载体合计、按队列序——带面全量重绘源）；`count` = 剩余条数（二次提交守卫 `>= 8`）；`pending` = `count > 0`；`merged` = **本批消费文本**（仅消费推送携——单条 = 原文，多条 = 合并文本）。

    · **派生 · 零簿记**：带面 = `items` 的纯函数重绘——判据非空即在场，消费 ∕ 中止随判据消失；零块序写入、零生命周期簿记、零 DOM 气泡认领（旧「标记 / 清标 / 合泡 / 防悬空」四支整体退役）。

    · **消费时刻 = 带项退场 + 流内恰一枚**：`merged` 在场的快照 ⇒ ① 带面按 `items` 重绘（本批项退场，残项留守）；② **webview 追加恰一枚 user 块**（`addUser(ctx, merged)`；合并形态 = 核单源 `thincoder-core/queued.mjs`）。
      出块发起方 = **webview 依快照派生**（宿主不新增推送点、不发第二消息；`merged` 只在消费推送携 ⇒ 幂等重推零重复块）。

    · **五个消费点（成员单源 = 下表；携带 `merged` ⇔ 消费发生 ⇔ 出块）**：

      | # | 消费点 | 载体坐标 | 携 `merged` | 流内出块 | 带面 |
      |---|---|---|---|---|---|
      | ① | 步边界 pickup（主——用户回合在飞） | `queued-pickup.mjs:41` | 是（`action.text`） | 恰一枚 | 按 `items` 重绘（本批项退场） |
      | ② | driver 步骤 1（会话在飞输入优先消费） | `suspension.mjs:166` | 是 | 恰一枚 | 同上 |
      | ③ | 装载① 载体迁移（`_busyQueued` → `susp.pendingInput`） | `panel-turn-stages.mjs:206` | **否** | **零出块** | 原样（`items` 实况——项仍在队，只换载体）；**实现条件 = 迁移快照推送先于 `splice`**（推送读 `_busyQueued` 实况；`splice` 后 `panel._susp` 尚未建 ⇒ 两载体读空） |
      | ④ | 装载② 归位（池空 idle 续发） | `panel-turn-stages.mjs:242` | 是 | 恰一枚 | 同上 |
      | ⑤ | 会话退出残余直发循环 | `suspension.mjs:329` | 是 | 恰一枚 | 同上 |

      **术语对齐**：「窗内消费」= 上表 ②（挂起会话在飞时 driver 步骤 1 从 `susp.pendingInput` 取批）；需求档 F-W22 的「回合尾」= ③ + ④（装载两分支），「卸载直发」= ⑤。

      **装载① 不属消费送达**：它只把条目从无会话载体挪进会话载体，条目仍待 ② ∕ ④ 消费 ⇒ 出块恒由 ① ∕ ② ∕ ④ ∕ ⑤ 中实际取批的那一点发生，每批**恰一枚**（F-W22 ②）；③ 零出块是本表唯一例外，且不产生第二个块。

    · **推送点**（同现状）：受理（`routeUserTurn` 入口 / 入队后）· 五个消费点 · 忙分支判决 · `webviewReady` 握手重推（Reload 冷启按 `items` 重建带面——不带 `merged` ⇒ 零重块）；挂起窗受理后同推（`routeUserTurn` 在 `_chat` 后补一拍——窗内提交零流内块且带面可见）。

    · **刷新**：`clearMessages` ⇒ 带面镜像复位（空带），随握手 / 下一次快照重建。
    · **边界**：外部入口队满拒收 = 既有回执面零变；引用失效守卫随气泡认领整体退役（派生面结构性无悬空）；纯挂起窗输入同面（两载体合计同快照）。CLI 对位 = `docs/cli/design/TUI-INPUT-BOX.md` §4.1 + `docs/cli/design/TUI.md` §7.5（待发送块——语义同源、形态各端自落）。
  - ⑧ **统一消费语义（计划首动作即消费）**：取项 ∕ 步边界 ∕ 步边界缝三面同判——`slash` ⇒ 单条（原文 · 保序 · 不合并）；取项单源 = 核 `thincoder-core/queued.mjs` `takeQueuedBatchItem` ⇒ slash 首条不滞留队首；
    落点 = `thincoder-vscode/src/extension/queued-pickup.mjs` 步边界（消费点）· 取项三处 = `panel-turn-stages.mjs` ∕ `suspension.mjs`；slash 可达且就地消费。

- **Shift+Enter** 既有形态（核件键位面不处理——换行）。
- **不动面**：`_turnState` 生命周期 / 单广播 / 派生、录入面（录入不禁；提交面受理分流 = C-B2-6）、中断模态、下拉过滤 / 防抖 / seq、CSS、`index.html`。（`applyBusyLock` 占位符含**第三态**——守卫 > busy > 常态，见 C-B2-5。）
- **登记（未做）**：真机 IME 矩阵（mac / Safari 组合确认 Enter 的 `isComposing` 时序差异）未覆盖——`keyCode === 229` 兜底**不引入**（登记项）。

### 1.1 其他键位（同族既有语义）

| 键 | 语义 | 落点 |
|---|---|---|
| Ctrl+C（无选区） | running 中 → Stop（有选区仍走复制） | `thincoder-render-core/composer/panel.mjs:140-147` |
| Ctrl+I | running 中 → 进入中断模态（Enter 提交 partial + 续跑同回合） | `thincoder-render-core/composer/panel.mjs:149-153` |
| Ctrl+U | 清空输入行 | `thincoder-render-core/composer/panel.mjs:155-160` |
| Enter（中断模态内） | 注入中断消息 | `thincoder-render-core/composer/panel.mjs:126-132` |

## 2. 输入历史与多行竖移（↑/↓ 判定五态）

**判定顺序**（`thincoder-render-core/composer/panel.mjs:178-196`——顺序注 `:172-177`；无 Shift / Alt / Ctrl / Meta）：

| # | 态 | 规则 |
|---|---|---|
| ① | IME 组合期（`e.isComposing \|\| e.keyCode === 229`） | 不处理、不 preventDefault（键归输入法） |
| ② | `isAtDropdownOpen()` | 不处理（下拉导航让位——不回归） |
| ③ | 历史态（`ctx._historyIdx !== -1`） | **恒历史**：↑ → 上溯、↓ → 回落——不看光标位置与单复数行 |
| ④ | 非历史态 · 单行（`!value.includes("\n")`） | ↑ → 载入最新条目（草稿 stash）；↓ → **吞键 + no-op**（非历史态无可回落） |
| ⑤ | 非历史态 · 多行 | **边界门**：↑ 仅 `selectionStart === 0`（首行行首）、↓ 仅 `selectionStart === value.length`（末行行末）触发；其余位置不处理、不 preventDefault（浏览器原生竖移保留） |

- **载入后光标/高度**：`navigateInputHistory`（`thincoder-render-core/composer/panel.mjs:222-240`）——载入后游标 = 条目末（`setSelectionRange(len, len)`）+ 高度重算；草稿保护 / 历史指针语义零改。
- **状态模型**：`ctx._inputHistory` / `_historyIdx` / `_inputDraft` 零改；不引入列记忆状态；不跨出输入框（不滚动会话）。
- **登记（未做）**：折行（软换行）单行文本的视觉竖移不保（「单行」判定 = 逻辑行 `\n` 判定——textarea 无可靠折行 API）；历史态编辑丢弃（覆盖式草稿）为两端同族既有行为。

## 3. 首块说明行（新用户可理解）

| # | 契约点 | 规则 |
|---|---|---|
| C-MA13-1 | 首块说明行 | 每 webview 会话**首个**新建活动块插入说明行 `div.sub-desc`——位置 = `summary` 之后、`.advisor-content` 之前（details 直接子；`refreshBlock` 只重建 summary ⇒ 说明行不被擦） |
| C-MA13-2 | 一次性 | 状态字段 `S._subDescShown`（初始 `false`）置位后不再插；**不随 `resetActivity` 复位**（panel 会话生命周期内一次） |
| C-MA13-3 | 文案 | locale 键 `sub.desc`（zh / en 双档逐字——`thincoder-vscode/locales/{zh,en}.json`） |
| C-MA13-4 | 样式 | `.sub-desc`（`thincoder-vscode/webview/chat.css:329`）——仿 `.panel-desc` 族（`font-size: 10px; opacity: 0.5; padding: 2px 0;`），零改既有规则 |

- 落点：`thincoder-vscode/webview/activity.js:101-107`（插行 + 置位）· `thincoder-vscode/webview/state.js:42`（字段声明）。
- **射程核验**：`tailLines` 射程 = `.advisor-content` 的**子元素**（`thincoder-render-core/subblocks/activity-view.mjs:103-113`）——`.sub-desc` 与 `.advisor-content` 互为兄弟 ⇒ **不在射程内**（冻结 / 折叠后的 tail-3 不含说明行）。
- **既有面**：Task 面板（`panel.taskDesc`）与 Goal 面板（`panel.goalDesc`）的说明句**已在**（`thincoder-vscode/webview/panels.js`）——本项只补 Subagent 面（现行 = 流内活动块）。

## 4. 消息渲染契约（Markdown 内联与转义）

**唯一内联引擎** = `inline()`（`thincoder-render-core/md.mjs:34-64`）；`md()`（`:67`）第 5 步整体 `esc()`（`:104-106`）、第 7 步调 `inline()`（`:117`）；`mdInline(s) = inline(esc(s))`（`:146-147`）——**esc-first 架构**（调用方保证输入已转义）。

**次序契约**：「字面量保护通道」（反斜杠转义 → 代码段占位符，`thincoder-render-core/md.mjs:37-45`）一律**先于**「Markdown 替换通道」（图片 / 链接 → 粗体 / 斜体 → 删除线，`:47-57`）。

| # | 契约点 | 规则 |
|---|---|---|
| R-1 | 代码段字面量 | 行内代码段捕获后置占位符，Markdown 替换通道**永不见**其内容 ⇒ 代码里的标记不被二次解释（`` `**x**` `` → `<code>**x**</code>`；`` `[a](http://b)` `` → `<code>[a](http://b)</code>`） |
| R-2 | 恢复序是硬约束 | 代码段**先**恢复、反斜杠字面量**后**恢复（`thincoder-render-core/md.mjs:59-62`）——反向序会让落进代码段的占位符无人恢复（实证：`` `\*` `` 输出裸占位符） |
| R-3 | 转义契约 | 代码段内容一律来自调用方 `esc()`——**恢复点不得再次 esc**（双转义会产出 `&amp;lt;`） |
| R-4 | 代码范围外原始 HTML | **全转义 / 无 passthrough**（`thincoder-render-core/md.mjs:106` `esc()`）——裸 `<script>` / `<img onerror=…>` 一律以文本呈现；链接 / 图片 URL 经 `safeUrl` 限流（`thincoder-render-core/md.mjs:158-166`：仅 http / https / mailto，危险 scheme → `#`） |
| R-5 | 同步面 | `md()` 与 `mdInline()` 共用 `inline()` ⇒ 同一输入矩阵两条路径同契约（零额外改动） |

**登记（现状保持，非契约变更面）**：

- 代码内反斜杠折叠（`` `\*` `` → `<code>*</code>`）——非 CommonMark 形态，保持现状（如需 CommonMark 化，独立条目重开）。
- 多行代码段的 `<br>` 形态；未闭合反引号（不成代码段，全文转义文本）。
- **跨界配对族**（代码段内标记 ↔ 段外标记跨界配对型，如 `` `a **b` c** d ``）：两处标记**均字面**；该项差异**可外溢到 `<code>` 之外**（不在「非代码面逐字节不变」不变量覆盖内），按逐字字面量白名单机判。

## 5. 关键决策记录

| # | 决策 |
|---|---|
| D-I1 | 组合守卫读**事件字段** `e.isComposing` |
| D-I2 | 三处 Enter 分支**统一**守卫 |
| D-I3 | @ 协调落 `input.js` **让位** |
| D-I4 | busy 提示**复用既有 toast 与既有关键键** |
| D-I5 | toast 机制**共享化**（`toast.js` 单写者） |
| D-I6 | toast 元素 id / class 维持 `paste-toast`（零 CSS 触碰；命名债登记：机制已通用化，后续触达批可收口） |
| D-I7 | 「单行」判定 = **逻辑行**（`\n` 判定） |
| D-I8 | 非历史态 · 单行 ↓ = **吞键 + no-op**（与 CLI「键已消费、无 fall-through」同源） |
| D-I9 | 历史修订在既有 `navigateInputHistory` **之上改门限**（零新状态） |
| D-I10 | 内联次序 = 字面量保护先于 Markdown 替换；恢复序 = 代码段先、反斜杠后 |
| D-I11 | 回归载体 = 新增单元测试档（纯函数直驱） |

## 7. UI / 交互决策落档

| # | 决策 | 状态 |
|---|---|---|
| U-I1 | Enter：发送；组合期归输入法；@ 下拉打开时只接受建议 | 已定（§1） |
| U-I2 | busy 提交 = 排队（**流内零气泡**——待发送带 = 输入区上沿；队列容量 8——`running` 全面）；**唯一 busy 拒面 = 满队（第 9 条）**（toast，2.6s 自动隐去 + 文本保留——对位 CLI 满队面） | 已定（§1 · C-B2-6 · D-I4/D-I5） |
| U-I3 | ↑/↓ 五态判定（IME → 下拉 → 历史态 → 单行 → 多行边界门） | 已定（§2） |
| U-I4 | 首块说明行 = 一会话一次、纯文本（无新交互元素） | 已定（§3） |
| U-I5 | 行内代码内容一律字面；代码范围外原始 HTML 全转义 | 已定（§4 · D-I10） |
| U-I6 | 登记（未做，非 open）：真机 IME 矩阵 · 折行竖移 · 代码内反斜杠折叠 · 跨界配对族外溢 | 已定（§1–§4 逐条登记） |
| U-I7 | 无工作区拒发 = 保留文本 + 瞬时 toast（同 U-I2 形态）+ 占位符第三态；Send 按钮保持可见（点击即提示） | 已定（§1 C-B2-5 · `PROJECT-SWITCHER.md` §4.1） |
| U-I8 | busy 排队注入（busy 即排队面 = `S._turnState === "running"`——挂起会话内与普通回合同判据）= 流内零气泡（待发送带）+ 队列（**容量 8**；载体两态：无会话 ⇒ `_busyQueued`；会话在飞 ⇒ 队列 `susp.pendingInput`）+ 满队守卫（**两载体合计 ≥8** ⇒ 不出泡 / 不清框 / toast——对位 CLI 满队面）；纯挂起等待（`susp`）既有队列零改；送达 = 四支（**步边界（主——用户回合在飞：核循环头 `consumeQueuedInput` 回调）** | |
| |  / driver 步骤 1 / 装载① 预填 / 装载② 归位——携贴图同过 F-1 降级判定）+ **合并消费**；**待发送带**（输入区上沿派生带：标签两形 + 逐条原文 ≤3 行 + 超限尾标记 = 细则⑦） | 已定（§1 C-B2-6） |

## 9. 验收与需求回指

| # | 本档覆盖 | 回指 |
|---|---|---|
| 1 | 输入面 Enter 语义（组合守卫 · @ 协调 · busy 排队注入——唯一 busy 拒面 = 满队（第 9 条）（C-B2-6 细则①）· 忙态待发送带（细则⑦）） | F-W5 · F-W22 |
| 2 | 输入历史与多行竖移（五态判定 · 草稿 stash · 不劫持原生竖移） | F-W6 · N-W8 |
| 3 | 首块说明行（一次性 · 文案 · 样式 · tail-3 射程核验） | F-W1 |
| 4 | 消息渲染契约（行内代码字面量 · 恢复序 · 全转义 · 跨界族登记） | F-W4 · N-W3 |
| 5 | 机检（新增档 ≤500 行 · 无 >300 字符单行 · 文档锚零悬空） | N-M3 · N-M2 |

**用例载体（N-W5）**：`thincoder-vscode/test/2026-10-20-vsc-queue-band.test.mjs`（批次本地单元档，`node --test` 单入口；登记 = `thincoder-vscode/test/files.mjs` 清单追加一行）——用例表归测试层（D2）。

**缺口登记**：F-W22 为新增需求、无既有用例；消解路径 = 本批单元档自证（八用例：单条 / 多条 / 合并批 + 残项 / 装载① 迁移 / 满队 / 冷启重推 / 会话中止 / idle 直发）；

到期条件 = VSC 前端集成长出首个业务场景档时，F-W22 的两条业务可观测断言（忙态零块、消费恰一枚）并入该档，本行缺口随之收口。


