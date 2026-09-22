# TUI 输入框行为契约 · CLI 面 · 设计

> 板块 = **TUI 输入框**（主输入框 / question 自由文本态 / Ctrl+I 注入框的按键与状态契约）。
> 配对需求档 = `docs/cli/requirements/TUI.md`（F11 / N8 等输入面条目住该档——本板块不单起需求档）。
> 对位档 = `docs/vsc/design/WEBVIEW-INPUT.md`（VSC webview 输入面——语义同源、各端独立实现；差异登记见 §9.2）。
> **本档是输入框的唯一行为契约：任何对输入框 / 键处理的修改，先读这里，改完更新这里。**
> 建档：2026-09-15（**B 式迁移轮 · 第 6 批**——`thincoder-cli/docs/design/TUI-INPUT-BOX.md` 内容重建；
> 旧档**二态混装**（当前态 + 第 31 批目标态）已按「第 31 批设计已实现」收口为单态现行契约——见 §9.1）。
> 本档坐标与行数 = **as-of 2026-09-15 实核**（仓根 = `thincoder/`）。
> 模块地图（各模块职责）= `docs/cli/design/TUI.md` §1；本档只落输入框行为与键处理语义。

## 1. 状态模型（不可破坏的不变量）

1. `state.input` 是字符数组（`string[]`）；`state.cursor` 是整数，恒满足 `0 <= cursor <= input.length`。
2. `state.history` 是已提交文本的字符串数组；`historyIndex === -1` 表示不在历史导航中。
3. `submit()`：清空 input/cursor → `history.push(text)` → `historyIndex = -1` → `scroll = 0`。
4. **模式栈互斥**，优先级从高到低：`permission → question → search → interruptPrompt → picker 栈 / wizard → 正常输入`。
   每个模式处理自己的键后必须 `return`。picker 打开期间 Ctrl+I 不受阻——processing 时照常打开注入框
   （Ctrl+I 创建与 interruptPrompt 模态分支先于 picker 分支——Esc 关框后 picker 原样保留），非 processing 时零动作；
   picker 其余按键由 picker 独占消费。
5. `layoutInput(chars, cursor, width)` 是纯函数：`(chars, cursor, width) → { lines, cursorLine, cursorCol, lineStarts }`，
   遇 `\n` 强制换行；`lineStarts[k]` = 第 k 个可视行行首下标；行 k 区间 = `[lineStarts[k], lineStarts[k+1])`（含行尾 `\n`）；
   末项哨兵 = `chars.length`（上界、不指向行）——竖移定位用；cursor 落 `\n` 时属前行行尾。
6. 输入框渲染宽度 = `W - 4`；最多显示 `MAX_INPUT_LINES`（5）行，超出滚动（`inputOffset`）。
7. 渲染层是 `renderRows`（row-diff）：每帧全量计算屏幕行 → 与上一帧 diff → 只重写变化行；
   输入框内容变化靠「行内容不同则重写」，无独立缓存。
8. `state.question` **自由文本态**（无 options 或选中 `Custom answer…`）：`q.answer` 是 codepoint 数组
   （同 `state.input` 语义——emoji / 代理对不劈半），`q.cursor` 是整数且恒满足 `0 <= cursor <= answer.length`（§7.2）；
   options 态无 answer / cursor 字段（选择标记即反馈——不变量不适用）。提交时 `Array.join` 还原串。
9. `state.interruptPrompt`（Ctrl+I 注入框）为 `{ chars: string[], cursor: number }` 或 `null`——
   `chars` 同 `state.input` 的 codepoint 数组语义且**无 `\n`**（单行不变式）；`0 <= cursor <= chars.length`；
   空态 = `{ chars: [], cursor: 0 }`（契约见 §8）。

## 2. 正常输入模式按键表

| 按键 | 行为 |
|---|---|
| 可打印字符 | 插入光标位置（`\r\n` 剥离、`\t` → 两空格） |
| Backspace / Delete | 删光标前 / 处字符 |
| ← → Home End | 光标移动 |
| Ctrl+U | 清空输入框 |
| Enter（`return` / `\r`） | 提交（busy 期 = §4.1 单槽注入） |
| **Shift+Enter** | **插入换行（多行输入）**——需终端键盘增强协议（§5）；不支持时退化为提交 |
| Alt+Enter（`meta+return`） | 插入换行（后备多行键，所有终端可用） |
| Tab | 斜杠命令补全循环 |
| ↑ ↓ | 多行（可视行——折行与 `\n` 同权）时框内竖直移动（显示列保持 + 短行端钳制）；不可移时 ↑ 回落历史、↓ 无动作；翻历史中恒历史导航（三规则见 §3） |
| Ctrl+V | 粘贴剪贴板文本（保留 `\n`，支持多行粘贴） |
| Alt+V / Ctrl+Alt+V | 粘贴剪贴板图片 → 插入 `read_image <path>` 命令 |
| Ctrl+F | 进入搜索模式 |
| Ctrl+I / Tab（处理中） | 中断注入模式 |
| PgUp / PgDn | 会话区滚动 |

## 3. 输入历史导航语义（↑↓ 三规则 + 草稿保护）

**↑↓ 三规则**：

1. **翻历史中恒历史**：`historyIndex !== -1` 时 ↑/↓ 恒为历史导航（即便当前条目为多行——不竖移）。
2. **竖移优先**：`historyIndex === -1` 且光标所在可视行在对应方向存在邻行 → 光标竖移——目标行显示列 =
   当前光标显示列（**显示列保持**），目标行更短则钳制到行尾；折行与 `\n` 同口径（按可视行）。
3. **边界回落**：无可移邻行时——↑ 回落历史导航（草稿保护见下）；↓ 无动作。

**草稿保护**：

- ↑：`historyIndex` 回退，加载历史条目；**首次进入导航前，未提交的输入存入 `state._draft`**。
- ↓：`historyIndex` 前进；走到头时**从 `_draft` 恢复原来在打的字**（无草稿则回空白），恢复后清 `_draft`。
- 空输入进入导航不存草稿；`submit()` 清 `_draft`。
- 竖移不改草稿（仅发生在 `historyIndex === -1`——草稿面零涉，不变量 2 / 3 零改）。
- **处理中**（`processing`，含 digest）：**竖移放行**（纯编辑——与字符 / 退格 / ←→ 同权）、**历史导航禁**
  （第 1 / 3 条的历史分支吞——不进入、不切换；Tab 吞等其余 busy 门禁不变；提交面 busy 期分流 = §4.1）。

## 4. 挂起态输入契约（AGENT-LOOP-ASYNC-POOL §6.8）

> 挂起会话期间（`state.suspended`）输入框放开。挂起决策 / 队列机制权威 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.8；
> 本节只落输入框侧行为。

- **不变量**：`state.input` **永不被后台事件读写**——settle / 消化轮 / 注入全部经独立通道（token / `state.pendingInput`），
  后台代码零接触输入框；框内文本在后台事件前后逐字不变。
- **Enter（非 slash 文本）**：不入 `state.queue`、不打断后台——消息入 **`state.pendingInput` 单槽**
  （**至多一条待交接——见 §4.1**；`key-handler-edit.mjs` 分流 + 清框，与 submit 同款清理；history 照常收录），经 `state._suspWake?.()` 唤醒挂起会话循环；
  driver 消费清槽即以该消息开新回合（输入优先——不触发新 digest；见 §4.1 送达链路）。
  **busy 期（`state.processing` 含 digest）提交走 busy 门禁入槽——本分支不触达**（本分支只接挂起空闲 / 释放窗口；两分支同槽同款清理——§4.1）。
- **斜杠命令**：挂起分流不拦截——走 submit 正常路径（纯挂起期直接执行）；busy 期（`state.processing` 含 digest）经 busy 门禁同吞——不直行 / 不排队 / 不入槽，文本保留在输入框（斜杠 busy 禁发不变——§4.1 条件 3）。
- **Ctrl+C**（挂起 / 消化中 = 武装窗口两级中止）：
  - **未武装首次按下**：digest / 会话内回合处理中仅中止当前回合（`state.controller.abort()`，会话与后台子代理不受影响，回挂起等待）；
    纯挂起等待期仅提示武装（含运行中数量，不清池）。
  - **3s 窗口内再次按下**（`state.suspAbortArmed` + `ctx.suspArmTimer`）才彻底中止：abort 集合 = 链条内全部 controller
    + `_suspAborted` + 唤醒 driver → 清池 → idle。
  - 中止后会话退出复位 `_suspAborted`（池再 live 可重新进入挂起态）；digest 期间排队的 pendingInput 残余转回 `state.queue`
    由普通回合续发 + 提示行（不静默丢）。
  - **Ctrl+I**：仅 digest 处理中有效（`processing && controller`）——立即打断（interruptPrompt，插话语义保留）；
    纯挂起等待期 Ctrl+I 无动作（Enter 即插话通道）。
- 消化轮输出照常流式显示；状态行显示「后台 N 子代理运行中 · M 待消化」（processing 期由工具事件接管）。

### 4.1 busy 期输入注入（F16 · busy-injection 批 2026-09-21 · busy-extend 批 2026-09-22 扩面）

> 需求锚 = `docs/cli/requirements/TUI.md` **F16**（台账 #213 · 扩面 = 台账 #224）；语义对位 = 子代理 `send`（回合边界注入，非打断）。
> 动机 = busy 期 Enter 提交被吞（INPUT-LOCK 2026-09-09 有意收窄的有意识部分重开——形态单槽非攒批）；
> Ctrl+I 中断注入**保留并存**（打断 vs 排队两语义——用户 2026-09-21 22:38 裁定，本批零触碰 Ctrl+I）。
> **扩面（2026-09-22 · 台账 #224）**：前批只开「普通回合 busy（池空）」一格——而池 live 会话期 `state.suspended` 恒 true
> （`suspension-drive.mjs:226/:290`），池 live 的用户回合（`:246-250`，只翻 `agent._suspended`）与 digest 均属「挂起会话内」
> ⇒ 工程模式（子代理常年在飞）的日常面仍吞。本批吞面去 `state.suspended || state._suspPending`——两面同判据、同单槽、同反馈。
> 送达链路 = 既有回合尾 drain（`thincoder-cli/src/tui/agent-turn.mjs:333-350` 队列续发 + `suspension-drive.mjs:246-257`
> driver 消费——取数谓词零改）；消费回执两处新增 dim 行（见消费回执段）；反馈面（dim 行 / 状态栏段 / 提示三态）= `docs/cli/design/TUI.md` §7.5。

**放行判据（busy Enter → 单槽注入，全部满足）**：

| # | 条件 | 理由 |
|---|---|---|
| 1 | `state.processing === true`（含 digest——单一判据既有） | 本批开的面——非 busy 期走既有 submit / 挂起分流，零改 |
| 2 | `state.permission == null && state.question == null` | 审批 / 提问卡挂起期**仍吞**——模态卡是回合阻塞面（等用户裁决），Enter 的用户意图 = 回应卡；排队文本会串进裁决流。F16「回合运行中」的排除项 |
| 3 | 非 slash（`text.startsWith("/")` 为假） | 斜杠 busy 禁发不变（INPUT-LOCK 斜杠面） |
| 4 | `text` 非空 | 空 Enter 静默（既有） |
| 5 | `state.pendingInput.length === 0` | 单槽不变量（至多一条待交接——R15 撤销攒批不翻；普通 / 挂起两面共用同一槽） |

**吞面收敛四**（判据表否面——本批放行面之外的全部吞形）：**模态**（条件 2）· **斜杠**（条件 3）· **空**（条件 4）· **槽满**（条件 5）。
挂起两态（`state.suspended` / `state._suspPending`）**不再是吞面**——挂起内 busy 与普通 busy 入槽判据统一（前批「挂起内 digest 期仍吞」随本批撤销）。

**执行序（`key-handler-busy.mjs` busy 门禁——替换「提交吞 + busy 提示」分支）**：
斜杠 → 吞 + busy 提示（文本保留，既有）；空 → 静默（既有）；条件 2 不满足 → 吞 + busy 提示（文本保留，既有）；
**单槽满（条件 5）→ 吞 + 槽满提示 + 文本保留**（先例 = 挂起态槽满分支 `key-handler-edit.mjs:60-64` 同构——吞 + 提示 + 文本保留；**槽满提示形态 = `docs/cli/design/TUI.md` §7.5 表第 1 行逐字**（`已排队 1 条消息`——单槽非空恒显 dim 段，吞判不新增提示串））；
**其余（1∧2∧3∧4∧5）→ 入槽**：清框 + `history.push` + `historyIndex = -1` + `_draft = null` + `pendingInput.push(text)`
（与挂起态入槽分支同款清理——`state.input` 永不被后台事件读写的不变量（§4）保持：入槽是**前台**按键路径写自己的槽）。
**挂起面入槽后同款唤醒**：`state.suspended || state._suspPending` ⇒ `state._suspWake?.()`（§4 既有挂起分支同款）；
busy 期该槽恒 null ⇒ 零动作——证据 = `suspension-drive.mjs:122`（等待结束清理即置 null）· `:137`（仅在 `waitForSettleOrWake` 等待窗口注入；唯一调用点 `:279`）
⇒ 轮末 driver 步骤 1 恒接走；普通 busy 面零唤醒（现状零改）。批档 §2 用例面「挂起内入槽」格断言 `wakes` 计数（= 呼叫点执行——桩注入 spy；生产 busy 期零副作用）。

**二次提交（单槽满）= 拒绝 + 提示 + 文本保留**：单槽至多一条 = 需求判定句钉死；覆盖 = 在 busy 不可见窗口静默丢用户文本
（违背「不静默丢」纪律——先例 `suspension-drive.mjs:306` 中止残余转正注释）；拒绝 + 提示与既有槽满语义同构零新机制。

**submit 双保险同步**（`turn-face.mjs` submit busy 拒分支——`:21-25`）：防御语义保持「busy 期拒绝 + 不清框」——直呼路径不因本批开裂；
本批正常流量的 Enter 在 key-handler 族（`key-handler-busy.mjs` 门禁 · `key-handler-edit.mjs` 入槽）已分流，submit busy 分支仍只服务直呼防御（注释随判据收正同步更新）。

**消费回执（送达链路侧——两处各一行 dim 行）**：`[sending queued message]` 在**消费时**推送——
① 回合尾兜底转正点（`agent-turn.mjs` 队列 while shift 后）；② 挂起 driver 消费点（`suspension-drive.mjs` pendingInput shift 后）。
形态对位既有 `[continuing…]`（`agent-turn.mjs:220`，`C.tool`）——消费事实的可见锚，回执在则顺序自然
（queued dim 行 → 回合尾 → `❯ You:` 标签 + 消息行）。**否决气泡行编辑**（改写 queued 行为送达态）：
生命周期簿记两处编辑点 + 行 diff 键漂移风险，消费回执行零簿记同效。

**送达链路（零改声明）**：① 普通回合 busy 入槽 → 回合自然结束：顶层兜底转正（`agent-turn.mjs:333-335`：`!poolLive` 时
pendingInput → `state.queue` → 队列 while 续发新回合）；② 挂起会话内 busy 入槽 → 池 live ⇒ driver 步骤 1 输入优先消费
（`suspension-drive.mjs:246-249`——以该消息开新回合，先于 digest 合并）；③ 池空 + 会话退出 ⇒ 退出前残余直注入兜底
（`suspension-drive.mjs` 退出段——零丢失）。三条既有链路的取数谓词零改——本批只是让单槽**在挂起会话内 busy 期亦可达**。
**模型句收正**：`suspension-drive.mjs:242-245` 现注「Enter 只可能落在挂起空闲 / 释放窗口」在池 live 会话中不成立——
随本批收正为「busy 期提交亦入本槽（本档 §4.1）」（注释面同笔，机制零改）。

**VSC 对位（对称修——本批扩面，射程内）**：`webview/send.js` 出口守卫原分两态（`running && !_suspended` 排队 ∥
`running && _suspended` 拒发 + toast）⇒ 本批**收窄面回开**：**busy 即排队面 = `S._turnState === "running"`**
（`_suspended` 不再参与分流）；单槽载体两态（无会话 = `panel._busyQueued`；会话在飞 = 会话单槽 `susp.pendingInput`，
既有 `_chat` 分流——driver 步骤 1 优先消费）。契约单源 = `docs/vsc/design/WEBVIEW-INPUT.md` §1 **C-B2-6**（分流 / 单槽 /
镜像判据源 / 送达 / 贴图降级细则 = 同处 ①–⑥——D2 不重述）。

**边界**：不引入攒批（单槽语义不变——两面共用同一槽）；不触碰 Ctrl+I 代码与文档条目（`key-handler.mjs:81-88` /
`key-modes.mjs handleInterruptMode` / 本档 §2 表 Ctrl+I 行 / §8——两语义并存）；`_pasting` 锁零触；
非 busy 期（空闲 / 挂起空闲 / 释放窗口）Enter 语义零改（§4 分流原样）；斜杠 busy 禁发零改；
F13 attention 判据不破（queued 反馈零注意力色对——`docs/cli/design/TUI.md` §7.5）。

## 5. 多行输入（能力 + 键实现）

### 5.1 真实能力（实测）

| 途径 | 状态 | 说明 |
|---|---|---|
| **粘贴多行文本** | ✅ 正常 | bracketed paste → `insertPastedText` 保留 `\n` |
| **Shift+Enter 插换行** | ✅ 现代终端可用 | 需终端键盘增强协议（§5.2）；旧版控制台物理上不可能 |
| **Ctrl+J 插换行** | ✅ **所有终端可用（主后备）** | Ctrl+J 发 `\n`（0x0A）、Enter 发 `\r`（0x0D），字节天然不同，不依赖任何协议；readline 解析为 `name:"enter"` |
| Alt+Enter 插换行 | ✅ 保留 | readline 对 `\x1b\r` 稳定解析为 `name:"return", meta:true`；Windows 旧版控制台把 Alt+Enter 截走切全屏（不可用） |

### 5.2 多行键实现方案（三层）

> 判定：Shift+Enter（现代终端）+ Ctrl+J（所有终端后备）+ Alt+Enter（第三后备）。多数终端默认对 Shift+Enter 发送裸 `\r`，
> 与 Enter 字节级不可区分——监听 `key.shift` 是死路。

1. **Shift+Enter（现代终端）**：启动时同时启用两种协议（不支持的终端直接忽略）：
   - `\x1b[>1u`——kitty keyboard protocol push（Windows Terminal 1.19+ / VS Code 终端 / kitty / iTerm2）：Shift+Enter → `\x1b[13;2u`；
   - `\x1b[>4;2m`——xterm modifyOtherKeys level 2（mintty / Git Bash）：Shift+Enter → `\x1b[27;2;13~`；
   - stdin 层 `translateShiftEnter` 把两种序列翻译为 `\x1b\r` → readline 解析为 meta+return → 多行分支；
   - 退出时 `\x1b[<u` + `\x1b[>4m` 复位。
2. **Ctrl+J（所有终端，含旧版控制台）**：`key-handler-edit.mjs` 的提交分支把 `name === "enter"`（即 `\n`）改为插换行。
   唯一风险：终端被配置成 Enter 发送 LF（极罕见——那样 Enter 与 Ctrl+J 同为 `\n`，无换行键）。
3. **Alt+Enter（第三后备）**：保持 meta+return 分支不动；旧版控制台上被系统截走（切全屏），现代终端可用。

**为什么走 stdin 翻译而不是在 `key-handler-edit.mjs` 里处理 CSI-u**：Node readline 不认识 CSI-u 序列（实测解析为 `name:"undefined"`
或拆成垃圾字符），必须在进 readline 之前拦截。

**诊断工具**：`node thincoder-cli/scripts/key-probe.mjs`——按键看终端实际发的字节。

**网上流传的「`key.name === "enter"` + `key.shift`」教程不可用**：`key.shift` 只在协议启用时才有值；
其代码真正触发的路径恰好是 Ctrl+J（`name:"enter"` ← `\n`），歪打正着验证了方案 2。

## 6. 相关模块（输入框相关职责）

| 模块 | 职责 |
|---|---|
| `thincoder-cli/src/tui/key-handler.mjs` | 按键分发**分派器**（#226 拆分后留守）：attention 清位 + 三模态前置委派 + F1 表 + Ctrl+I 入口（§8）+ interrupt 模态 + 五族顺序委派（守卫 = 原块入口条件） |
| `thincoder-cli/src/tui/key-handler-edit.mjs` | 编辑族：输入编辑（退格 / 删除 / Ctrl+U / Tab 补全）+ Enter（多行 / 挂起态入槽——§4）+ 剪贴板文本 / 图片粘贴 |
| `thincoder-cli/src/tui/key-handler-busy.mjs` | busy 期单槽注入门禁（§4.1——`pendingInput` 单槽可达化；吞面四 / 入槽五条件） |
| `thincoder-cli/src/tui/key-handler-scroll.mjs` | ↑↓ 分流（竖移 / 历史——§3）+ ←→ · Home · End + PgUp / PgDn |
| `thincoder-cli/src/tui/key-handler-modals.mjs` | picker / wizard 键处理（模态面，输入框让位） |
| `thincoder-cli/src/tui/key-handler-ctrlc.mjs` | Ctrl+C 五分支族（含挂起态两级中止——§4） |
| `thincoder-cli/src/tui/key-modes.mjs` | 模态层：permission / question / interruptPrompt 独占模态——激活即消费全部按键；question 自由文本态编辑键（§7）；Inject 框编辑键（§8） |
| `thincoder-cli/src/tui/render.mjs` | `layoutInput`（折行 / 光标行列 + `lineStarts`）/ `charWidth` 纯函数；`moveCursorVertical`（竖移定位——§3 规则 2） |
| `thincoder-cli/src/tui/layout.mjs` | `computeLayout` 面板布局（输入框 boxLines / cap / offset / 光标行列；question 自由文本态 `layoutAnswer` = `layoutInput` 复用）；`inputContentWidth`（输入框内容宽度单源——布局与竖移共用） |
| `thincoder-cli/src/tui/clipboard.mjs` | `translateShiftEnter`（CSI-u / modifyOtherKeys → `\x1b\r`）；`insertPastedText` 目标路由（主输入落 cursor / question 落 cursor + 单行守卫 / options 忽略 / 注入框落 cursor + 去换行——§8） |
| `thincoder-cli/src/tui/interaction.mjs` | `askQuestion` 装配：`q.answer` codepoint 数组 + `q.cursor`（options 态无） |
| `thincoder-cli/src/tui/render-frame.mjs` · `render-loop.mjs` | question 自由文本态光标例外（`hasOverlay` 细化 / `cursorSuffix` 正常发）；Inject 框标题提示与空态占位符（§8.3） |
| `thincoder-cli/src/tui/ansi.mjs` | `keyboardPush` / `keyboardPop` 序列常量 |
| `thincoder-cli/src/tui/tui-state.mjs` | state 初始化单源（`createTuiState`——含 `_draft` / `interruptPrompt` 空态） |
| `thincoder-cli/src/tui/input-face.mjs` | stdin 层 `translateShiftEnter` 接线（`:151`）+ 键盘 / 鼠标后置挂载入口（`mountKeys` / `mountMouse`） |
| `thincoder-cli/src/tui/index.mjs` | `startTUI` 装配序列（命令层 / 启动屏 / resize / render loop）；启动 `keyboardPush` / 退出 `keyboardPop`（序列体 = `tui-lifecycle.mjs`——启动调用点 = `input-face.mjs:39`） |
| `thincoder-cli/test/input-lock.test.mjs` · `thincoder-cli/test/arrow-editing.test.mjs` | 按键分发锁（含 busy 门禁）+ 方向键编辑用例 |
| `thincoder-cli/test/busy-injection.test.mjs` | F16 用例宿主（T-F16-1…9——放行 / 回合尾送达 / 槽满 / 排除面 / driver 消费 / 状态栏段 / 挂起内入槽 / 消费回执；T-F16-7 = `input-lock.test.mjs` 侧；本批扩面行见批档 §2） |

## 7. question 自由文本输入态：光标与编辑键

> 主输入框与 question 自由文本框均有光标（视觉反显 + 硬件定位双机制）；question 其余文本面无缺口
> （wizard 复用 `state.input`、picker filter 行内输入已有光标）。
> **Inject 框（Ctrl+I）为另一独立面——键集 = 本节最小集 + 四方向键，见 §8。**

### 7.1 渲染

- **渲染数据源**：`layout.mjs` question boxLines 分支——question 存在时 boxLines 为 options 列表或自由文本态的光标行；
  自由文本态 `boxLines = layoutAnswer(q.answer, q.cursor, width)`——**与 `layoutInput` 同实现**
  （多行换行展开——`▸ ` 首行 + 续行 2 空格缩进——返回 `{ lines, cursorLine, cursorCol }`）。
- **行数上限**：复用主输入 cap（`MAX_INPUT_LINES` 5 + `inputOffset` 滚动）——光标随行滚动。
- **渲染例外（`hasOverlay` 细化）**：permission / picker / wizard-provider / options 态维持无光标；
  **question 自由文本态保留视觉反显 + 硬件定位**（与主输入框同路径——`cursorSuffix` 正常发）。options 态无光标（`▸` 标记即反馈）。

### 7.2 契约（状态模型扩展 + 编辑键）

**状态模型扩展**（§1 不变量 8）：`state.question.cursor` 整数——处于**自由文本态**（无 options 或选中 `Custom answer…`）时
恒满足 `0 <= cursor <= answer.length`——answer 存 codepoint 数组；options 态无 cursor 字段。进入自由文本态时初始化
`answer = []`、`cursor = answer.length`；options → Custom 转换时同步初始化。提交时 `Array.join` 还原串。

**自由文本态按键表**（与主输入框对齐的最小集）：

| 键 | 行为 |
|---|---|
| ← / → | cursor 移动（0 边界停） |
| Home / End | 跳首 / 尾 |
| Ctrl+U | 清空 answer 与 cursor（同主输入框语义） |
| Backspace | 删 cursor 前字符（cursor 位置感知） |
| 可打印字符 | 插入 cursor 位置 |

**语义（定稿）**：

- **Esc**：有 options 时自由文本态 Esc = **回 options 态**（非中止——误触 Custom 有逃生口）；无 options 时 Esc = 中止 question。
- Enter 提交；Ctrl+V 粘贴落 cursor 位置——**粘贴含 `\n` → 替换为空格**（保文本——单行不变式硬守卫）。
- **Ctrl+J = no-op 吞**（不插换行）；未列键一律消费 `return`，无 fall-through。
- **options 态**：↑↓ / Enter / Esc 不变；选中后自由文本态（`Custom answer…`）自动进入上述光标态；↑↓ 语义 = **环绕**（末项 down → 第 0 项；首项 up → 末项——三选择面契约见 `docs/cli/design/TUI-COMMANDS.md` §3）。
- Ctrl+V 与 bracketed paste 共用同一实现（`clipboard.mjs insertPastedText` question 分支）：落 cursor + `\n`/`\r` 折叠为空格 + `\t` → 2 空格。

## 8. Inject 框（Ctrl+I）：光标与编辑键

> 状态模型见 §1 不变量 9。渲染 = 复用主输入框面板：`layout.mjs` 把 `interruptPrompt.chars` 走 `layoutInput`
> （`MAX_INPUT_LINES` cap + `offset` 滚动同款）；光标反显 + 硬件定位与主输入框同路径（`hasOverlay` 不含 interruptPrompt）。

### 8.1 按键表

| 键 | 行为 |
|---|---|
| ← / → | cursor 移动（0 边界停） |
| ↑ / ↓ | 折行竖移（显示列保持 + 短行端钳制；无邻行时吞——**无历史回落**、零副作用） |
| Home / End | 跳首 / 尾 |
| Ctrl+U | 清空 chars 与 cursor |
| Backspace | 删 cursor 前字符（cursor 位置感知） |
| Delete | 吞（不引入——与 §7.2 最小集对齐） |
| 可打印字符 | 插入 cursor 位置（`\r\n` 剥离、`\t` → 两空格） |
| Ctrl+J（`enter`） | no-op 吞（不插换行——单行不变式） |
| Enter | 提交：`chars.join("").trim()` → `controller.abort({ interrupt: true, message })`（回合已结束 → 排队提示语义不变） |
| Esc | 取消（置 `null`） |
| Ctrl+V / 粘贴 | 落 cursor 位置；`\n`/`\r` 去除、`\t` → 两空格（单行不变式） |
| 未列键 | 一律 consume（模态独占——无 fall-through） |

### 8.2 与 §7.2（question 自由文本态）的关系

- **键集同源**：= §7.2 最小集 + **四方向键**（§7.2 面 ↑↓ 吞；本面 ↑↓ 折行竖移）。与 §7.2 的差异共两项：
  ① 四方向键 ↑↓；② 粘贴换行清洗——本面 `\n`/`\r` **去除**（§8.1 键表），§7.2 面 `\n`/`\r` **折叠为空格**（§7.2 语义）。
- 单行不变式同款（无换行键）；Esc / Enter 语义各自既有（取消注入 / 答问提交）。
- 注入框**无历史回落**：↑↓ 边界 = 吞（不牵动主输入框 `state.history`）。

### 8.3 渲染与提示

- 光标：与主输入框同路径（反显 + 硬件定位）；`chars` 为空时显示空态占位符
  （`Type message to inject (Enter send, Esc cancel)`）。
- **标题提示**（`render-frame.mjs`）：` Inject Message ` 面提示 = `" Enter send, Esc cancel │ ←→↑↓ Home/End move │ Ctrl+V paste "`；
  现行共用段中 `Shift+Enter / Ctrl+J newline` 与 `Ctrl+I inject` 在本面移除（单行框无换行键；框内 Ctrl+I 被模态吞）。
  共用段条件由 `title !== " Question "` 收窄为 `title === " Input " || title === " Processing... "`。

## 9. 不并项与历史沿革

### 9.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-cli/docs/design/TUI-INPUT-BOX.md`——**原地保留作参照历史**（保留 ≠ 维护）。
> **二态混装收口**：旧档为「当前态 + §9 第 31 批目标态」两态并置；第 31 批（方向键编辑）**已实现**
> （`state.interruptPrompt = { chars, cursor }` 与 `test/arrow-editing.test.mjs` 均在位——as-of 2026-09-15 实核）。
> ⇒ 本档按**单态现行契约**重建：目标态已并入 §3 / §8 正文。下列内容不并入本档：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 旧档 §9 第 31 批设计节 | 问题陈述 / 方案选型对比（A / B / C / D 四族候选）/ 契约变更清单 / 决策记录 D-31.1–D-31.8 | 一次性批次设计材料——机制结论已入本档 §3 / §8 正文 |
| 旧档 §9.5 受影响文件表 | as-of 2026-09-11 行数与增量快照 | 时点快照（实装后已漂移）——现行档位以实测为准 |
| 旧档 §9.6 用例表（T-A1–T-A11）· §9.7 验收标准（AC-E1-1–AC-E1-10） | 批次验收材料 | 验收已完成——不变量已入正文；用例宿主 = `thincoder-cli/test/arrow-editing.test.mjs` |
| 旧档 §9.8 边界 + 档头「设计已落档、实现待批准」状态行 | 批次边界与在途状态 | 批次语境——实现已落地，边界语义已入 §1–§8 |
| 旧档 §变更记录 | 逐批流水（2026-08-03/04 多行键 / 09-02 挂起态归属 / 09-03·04 question 光标 / 09-07 格式债 / 09-11 第 31 批及修正·刷新轮） | 历史叙述——本档自有变更记录 |

### 9.2 不并项登记（跨板块 / 一次性材料——**不并**，逐项登记）

| 旧档面 | 内容 | 何故不并（去向 / 触发） |
|---|---|---|
| 挂起决策 / 队列机制的正文 | 挂起状态机、settle 时序、池管理 | `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.8——本档只落输入框侧行为（§4） |
| question 工具协议面 | 提问工具契约、CUSTOM 哨兵定义 | `docs/core/design/TOOLS.md`（question 行）+ `docs/cli/design/TUI-COMMANDS.md` |
| VSC 端方向键编辑差异 | VSC webview 首行 ↑ 为浏览器默认 no-op（不回落历史） | `docs/vsc/design/WEBVIEW-INPUT.md`——**端差异如实登记**（登记 ≠ 默认保留；**登记面 = 记录已裁的保留项**，✗ 非未决差项兜底）；端差默认 = 消，保留须结构性不对称 + 证据 + 显式裁定（A9）；各端独立实现只述实现形态，✗ 不构成差异保留依据；**本项状态：待裁**（A9 三件未齐——消解路径 = 两端口径统一（↑ 回落语义对齐）∥ 补显式裁定；到期 = 台账 #185「已登记端差逐项 A9 复核」落定） |
| 输入层状态机的宿主实现细节 | `key-handler` 族 / `key-modes` 内部结构 | 实现面——落点 `thincoder-cli/src/tui/key-handler.mjs` + 五族 `key-handler-{ctrlc,modals,scroll,busy,edit}.mjs` · `key-modes.mjs`（本档只留行为契约） |

## 变更记录

- 2026-09-15（**B 式迁移轮 · 第 6 批**）：建档——`thincoder-cli/docs/design/TUI-INPUT-BOX.md` 内容重建入基准层（旧档一字未改、原地作参照历史）。
  ① **二态混装收口**（台账 §3 注意项）：旧档「当前态 + 第 31 批目标态」按「设计已实现」折算为**单态现行契约**——目标态并入 §3 / §8；
  ② 坐标全量改**现状路径**并实核；③ 旧档批次材料（选型 / 受影响文件 / 用例 / AC / 决策记录 / 变更流水）入 §9.1 / §9.2（不并）；
  ④ 补 §10 体量节；⑤ 配对需求档指向 `docs/cli/requirements/TUI.md`（本板块不单起需求档——登记见该档 §1 注）。

- 2026-09-21（**端差纪律收正批（end-diff-doctrine）· 设计轮** · eng-designer——承 `docs/batches/2026-09-21-end-diff-doctrine.md` §1 裁定 + 需求层例外句（F7-3 / N4））：§9.2「VSC 端方向键编辑差异」行收正——去「互不追赶」作保留依据的读法（补端差默认 = 消 / 保留三件齐备（A9）/ 实现形态限定）；
  **语义源 = 需求层已定稿例外句——设计层落点、零新增口径**。

- 2026-09-21（**端差纪律收正批（end-diff-doctrine）· 设计评审修正轮（轮 1）** · eng-designer——承 `docs/batches/2026-09-21-end-diff-doctrine.md` §3 发现 #2 / #4）：§9.2「VSC 端方向键编辑差异」行补**登记面语义**（登记面 = 记录已裁的保留项，✗ 非未决兜底）+ **状态词**（待裁——A9 三件未齐；消解路径 / 到期见行内）；
  **零新语义（评审发现逐号落位）**。

- 2026-09-21（**busy-injection 批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-21-busy-injection.md` §1）：新增 **§4.1 busy 期输入注入**（F16）——
  busy（processing 含 digest）非挂起非模态期 Enter 提交入 `pendingInput` 单槽（放行判据六条 · 二次提交 = 拒绝 + 提示 · 消费回执行）；
  送达链路零改声明（回合尾 drain + driver 消费两条既有链路取数谓词零改）；VSC 对称修面（queuedUserMessage）回指 `WEBVIEW-INPUT.md` §1 C-B2-6。Ctrl+I 两语义并存零触碰。

- 2026-09-21（**busy-injection 批 · 设计评审轮 1 修正** · eng-designer——承 `docs/batches/2026-09-21-busy-injection.md` §3 发现 1/2/3/5/8
  · 语义源 = 父侧裁定（C-B2-6 ∪ CLI 条件 3））：§4.1 VSC 对位段收正——queue = 普通回合 busy（`running && !_suspended`）/
  reject = 挂起会话内 busy 仍拒发 + toast / 纯挂起等待零改（判别式与 C-B2-6 三面同构），槽名收正 `panel._busyQueued`，
  去 F16 伪引改述实句；射程句收窄（取数谓词零改 + 消费回执两处新增 dim 行）；§2 Enter 行补 §4.1 指针。判据表 / 执行序 / 边界段零变。

- 2026-09-21（**busy-injection 批 · 设计评审轮 2 修正** · eng-designer——承 `docs/batches/2026-09-21-busy-injection.md` §3 轮次 2 发现 1 / 2
  · 语义源 = 已落地实现 + 测试锁（旧 D-S5 入队已废））：§4 Enter 条目收正至真实触达窗——删「含 digest 运行中」限定与「digest 运行中排队续发」句，
  补 busy（含 digest）期先经门禁吞、本分支不触达（触达窗 = 挂起空闲 / 释放窗口）；§3「处理中」行去无限定「提交吞…不变」（提交面分流指针 = §4.1）。
  判据表 / 执行序 / VSC 段零变。

- 2026-09-22（**busy-injection 批 · 实施悬空裁定轮（fix round）· eng-designer**——承批档 §5 决策透明表 #5 / #6 + 父侧裁定）：§4.1 VSC 对位段补两行——**二次提交守卫**（未消费排队 ≥1 ⇒ 不出泡 / 不清框 / 提示；判据源 = host 推送 `busyQueued`）与**携贴图送达降级对位**（同 idle 面判决函数）；细则回指 C-B2-6 ①⑥。
  判据表 / 执行序 / 消费回执 / 送达零改声明零变。

- 2026-09-22（**busy-extend 批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-22-busy-extend.md` §1（E1 / E2））：§4.1 **扩面**——
  **吞面收敛四**（模态 / 斜杠 / 空 / 槽满）：判据表去「挂起两态」条（六条 → 五条 · 条件重编号）、执行序补挂起面入槽后 `state._suspWake?.()`、
  送达链路补「挂起会话内 busy 入槽 ⇒ driver 步骤 1 输入优先消费」并收正 `suspension-drive.mjs:242-245` 模型句；
  VSC 对位段收正为「busy 即排队面（`running`）+ 单槽载体两态」，细则单源回指 `WEBVIEW-INPUT.md` §1 C-B2-6。§4 Enter / 斜杠两条 busy 句同步收正（去「先经门禁吞」口径）。

- 2026-09-22（**busy-extend 批 · 设计评审轮 1 修正** · eng-designer——承 `docs/batches/2026-09-22-busy-extend.md` §3 轮次 1 发现 #8 / #9 / #12）：
  §4.1 执行序槽满句钉提示形态（= `TUI.md` §7.5 表第 1 行逐字 `已排队 1 条消息`）+ 先例坐标收正（`key-handler.mjs:440-444`）；
  挂起面唤醒句补证据行（`suspension-drive.mjs:122` / `:137` / `:279`）+ 批档 §2 用例面「挂起内入槽」格期望注；§6 用例宿主范围收正（T-F16-1…9）。**判据表 / 语义零变**。

- 2026-09-22（**busy-extend 批 · 设计评审轮 2 修正** · eng-designer——承 `docs/batches/2026-09-22-busy-extend.md` §3 轮次 2 发现 #3 / #7）：
  §4 Enter 条容器名收正（「`state.pendingInput` 队列」→ **单槽（至多一条——见 §4.1）**）；§9.2「挂起决策 / 队列机制的正文」去向行的节号收正
  （`docs/core/design/AGENT-LOOP.md` §9 → **`docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.8**）。**判据表 / 语义零变**。

- 2026-09-22（**structure-debt 批 · 档面车道（#226 / #159 尾账）· eng-designer**——承 `docs/batches/2026-09-22-structure-debt.md` §2.1 / §2.2 / §2.6 档面行 + 父侧派单）：
  §4 / §4.1 执行序与先例坐标改指新档（busy 门禁 → `key-handler-busy.mjs`；挂起态槽满先例 `:440-444` → `key-handler-edit.mjs:60-64`；submit 拒分支 → `turn-face.mjs:21-25`）；
  §5.2 两处 key-handler 指称改指 `key-handler-edit.mjs`；§4.1 边界 Ctrl+I 坐标 `:176-183` → **`:81-88`**；§6 相关模块表按新档清单收正（补五族 + `tui-state.mjs` / `input-face.mjs` 行，`index.mjs` 行收窄为装配序列）。**零语义**：判据表 / 键语义零变。
