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
| Enter（`return` / `\r`） | 提交 |
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
  （第 1 / 3 条的历史分支吞——不进入、不切换；Tab / 提交吞等其余 busy 门禁不变）。

## 4. 挂起态输入契约（AGENT-LOOP §9）

> 挂起会话期间（`state.suspended`）输入框放开。挂起决策 / 队列机制权威 = `docs/core/design/AGENT-LOOP.md` §9；
> 本节只落输入框侧行为。

- **不变量**：`state.input` **永不被后台事件读写**——settle / 消化轮 / 注入全部经独立通道（token / `state.pendingInput`），
  后台代码零接触输入框；框内文本在后台事件前后逐字不变。
- **Enter（非 slash 文本，含 digest 运行中）**：不入 `state.queue`、不打断当前消化轮——消息入 **`state.pendingInput` 队列**
  （key-handler 分流 + 清框，与 submit 同款清理；history 照常收录），经 `state._suspWake?.()` 唤醒挂起会话循环；
  纯挂起期立即调度新回合，digest 运行中排队续发（队列非空期间不触发新 auto-turn）。
- **斜杠命令**：挂起分流不拦截——走 submit 正常路径（纯挂起期直接执行；digest 中 allowlist 直行 / 其余入 `state.queue`，会话循环排空）。
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
2. **Ctrl+J（所有终端，含旧版控制台）**：key-handler 的提交分支把 `name === "enter"`（即 `\n`）改为插换行。
   唯一风险：终端被配置成 Enter 发送 LF（极罕见——那样 Enter 与 Ctrl+J 同为 `\n`，无换行键）。
3. **Alt+Enter（第三后备）**：保持 meta+return 分支不动；旧版控制台上被系统截走（切全屏），现代终端可用。

**为什么走 stdin 翻译而不是在 key-handler 里处理 CSI-u**：Node readline 不认识 CSI-u 序列（实测解析为 `name:"undefined"`
或拆成垃圾字符），必须在进 readline 之前拦截。

**诊断工具**：`node thincoder-cli/scripts/key-probe.mjs`——按键看终端实际发的字节。

**网上流传的「`key.name === "enter"` + `key.shift`」教程不可用**：`key.shift` 只在协议启用时才有值；
其代码真正触发的路径恰好是 Ctrl+J（`name:"enter"` ← `\n`），歪打正着验证了方案 2。

## 6. 相关模块（输入框相关职责）

| 模块 | 职责 |
|---|---|
| `thincoder-cli/src/tui/key-handler.mjs` | 按键总分发：permission / question / search / picker / wizard / interruptPrompt / 输入编辑 + 挂起态输入；↑↓ 分流（竖移 / 历史——§3）；Inject 框创建（§8） |
| `thincoder-cli/src/tui/key-modes.mjs` | 模态层：permission / question / interruptPrompt 独占模态——激活即消费全部按键；question 自由文本态编辑键（§7）；Inject 框编辑键（§8） |
| `thincoder-cli/src/tui/render.mjs` | `layoutInput`（折行 / 光标行列 + `lineStarts`）/ `charWidth` 纯函数；`moveCursorVertical`（竖移定位——§3 规则 2） |
| `thincoder-cli/src/tui/layout.mjs` | `computeLayout` 面板布局（输入框 boxLines / cap / offset / 光标行列；question 自由文本态 `layoutAnswer` = `layoutInput` 复用）；`inputContentWidth`（输入框内容宽度单源——布局与竖移共用） |
| `thincoder-cli/src/tui/clipboard.mjs` | `translateShiftEnter`（CSI-u / modifyOtherKeys → `\x1b\r`）；`insertPastedText` 目标路由（主输入落 cursor / question 落 cursor + 单行守卫 / options 忽略 / 注入框落 cursor + 去换行——§8） |
| `thincoder-cli/src/tui/interaction.mjs` | `askQuestion` 装配：`q.answer` codepoint 数组 + `q.cursor`（options 态无） |
| `thincoder-cli/src/tui/render-frame.mjs` · `render-loop.mjs` | question 自由文本态光标例外（`hasOverlay` 细化 / `cursorSuffix` 正常发）；Inject 框标题提示与空态占位符（§8.3） |
| `thincoder-cli/src/tui/ansi.mjs` | `keyboardPush` / `keyboardPop` 序列常量 |
| `thincoder-cli/src/tui/index.mjs` | state 初始化（含 `_draft` / `interruptPrompt` 空态）；stdin 层 `translateShiftEnter` 接线；启动 `keyboardPush` / 退出 `keyboardPop` |
| `thincoder-cli/test/input-lock.test.mjs` · `thincoder-cli/test/arrow-editing.test.mjs` | 按键分发锁（含 busy 门禁）+ 方向键编辑用例 |

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
| 挂起决策 / 队列机制的正文 | 挂起状态机、settle 时序、池管理 | `docs/core/design/AGENT-LOOP.md` §9——本档只落输入框侧行为（§4） |
| question 工具协议面 | 提问工具契约、CUSTOM 哨兵定义 | `docs/core/design/TOOLS.md`（question 行）+ `docs/cli/design/TUI-COMMANDS.md` |
| VSC 端方向键编辑差异 | VSC webview 首行 ↑ 为浏览器默认 no-op（不回落历史） | `docs/vsc/design/WEBVIEW-INPUT.md`——**端差异如实登记**（登记 ≠ 默认保留；**登记面 = 记录已裁的保留项**，✗ 非未决差项兜底）；端差默认 = 消，保留须结构性不对称 + 证据 + 显式裁定（A9）；各端独立实现只述实现形态，✗ 不构成差异保留依据；**本项状态：待裁**（A9 三件未齐——消解路径 = 两端口径统一（↑ 回落语义对齐）∥ 补显式裁定；到期 = 台账 #185「已登记端差逐项 A9 复核」落定） |
| 输入层状态机的宿主实现细节 | `key-handler` / `key-modes` 内部结构 | 实现面——落点 `thincoder-cli/src/tui/key-handler.mjs` · `key-modes.mjs`（本档只留行为契约） |

## 变更记录

- 2026-09-15（**B 式迁移轮 · 第 6 批**）：建档——`thincoder-cli/docs/design/TUI-INPUT-BOX.md` 内容重建入基准层（旧档一字未改、原地作参照历史）。
  ① **二态混装收口**（台账 §3 注意项）：旧档「当前态 + 第 31 批目标态」按「设计已实现」折算为**单态现行契约**——目标态并入 §3 / §8；
  ② 坐标全量改**现状路径**并实核；③ 旧档批次材料（选型 / 受影响文件 / 用例 / AC / 决策记录 / 变更流水）入 §9.1 / §9.2（不并）；
  ④ 补 §10 体量节；⑤ 配对需求档指向 `docs/cli/requirements/TUI.md`（本板块不单起需求档——登记见该档 §1 注）。

- 2026-09-21（**端差纪律收正批（end-diff-doctrine）· 设计轮** · eng-designer——承 `docs/batches/2026-09-21-end-diff-doctrine.md` §1 裁定 + 需求层例外句（F7-3 / N4））：§9.2「VSC 端方向键编辑差异」行收正——去「互不追赶」作保留依据的读法（补端差默认 = 消 / 保留三件齐备（A9）/ 实现形态限定）；
  **语义源 = 需求层已定稿例外句——设计层落点、零新增口径**。

- 2026-09-21（**端差纪律收正批（end-diff-doctrine）· 设计评审修正轮（轮 1）** · eng-designer——承 `docs/batches/2026-09-21-end-diff-doctrine.md` §3 发现 #2 / #4）：§9.2「VSC 端方向键编辑差异」行补**登记面语义**（登记面 = 记录已裁的保留项，✗ 非未决兜底）+ **状态词**（待裁——A9 三件未齐；消解路径 / 到期见行内）；
  **零新语义（评审发现逐号落位）**。
