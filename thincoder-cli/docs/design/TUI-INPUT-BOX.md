# TUI 输入框行为契约

> **本文档是输入框的唯一行为契约。任何对输入框/键处理的修改，先读这里，改完更新这里。**
> 状态：已实现（含 question 自由文本态扩展 2026-09-03/04）。基线 v0.11.1；现文档为当前态，无逐批流水。
> **第 31 批（2026-09-11 方向键编辑）**：§1/§2/§3/§6/§8 为目标态（**设计已落档、实现待批准**）——设计与测试全文见 §9，
> 批次档 `../batches/2026-09-11-ARROW-EDITING.md`；`TUI.md`（本仓）更新面已随交付后刷新轮回写（见 §9.5 末注）。
> 模块地图（各模块行数/职责）权威 = `TUI.md`；此处只落输入框行为与键处理语义。

## 1. 状态模型（不可破坏的不变量）

1. `state.input` 是字符数组（`string[]`）；`state.cursor` 是整数，恒满足 `0 <= cursor <= input.length`
2. `state.history` 是已提交文本的字符串数组；`historyIndex === -1` 表示不在历史导航中
3. `submit()`：清空 input/cursor → `history.push(text)` → `historyIndex = -1` → `scroll = 0`
4. 模式栈互斥，优先级从高到低：`permission → question → search → interruptPrompt → picker 栈/wizard → 正常输入`。picker 打开期间 Ctrl+I 不受阻——processing 时照常打开注入框（Ctrl+I 创建与 interruptPrompt 模态分支先于 picker 分支——Esc 关框后 picker 原样保留），非 processing 时零动作；picker 其余按键由 picker 独占消费。每个模式处理自己的键后必须 `return`
5. `layoutInput(chars, cursor, width)` 是纯函数：`(chars, cursor, width) → { lines, cursorLine, cursorCol, lineStarts }`，遇 `\n` 强制换行；`lineStarts[k]` = 第 k 个可视行行首下标；行 k 区间 = `[lineStarts[k], lineStarts[k+1])`（含行尾 `\n`）；末项哨兵 = `chars.length`（上界、不指向行）——竖移定位用（第 31 批 additive）；cursor 落 `\n` 时属前行行尾（T-A2 口径）
6. 输入框渲染宽度 = `W - 4`；最多显示 `MAX_INPUT_LINES`（5）行，超出滚动（`inputOffset`）
7. 渲染层是 `renderRows`（row-diff）：每帧全量计算屏幕行 → 与上一帧 diff → 只重写变化行。输入框内容变化靠"行内容不同则重写"，无独立缓存
8. `state.question` **自由文本态**（无 options 或选中 Custom answer…）：`q.answer` 是 codepoint 数组（同 `state.input` 语义——emoji/代理对不劈半），`q.cursor` 是整数且恒满足 `0 <= cursor <= answer.length`（§7.2 契约）；options 态无 answer/cursor 字段（选择标记即反馈——不变量不适用）。提交时 `Array.join` 还原串
9. `state.interruptPrompt`（Ctrl+I 注入框）为 `{ chars: string[], cursor: number }` 或 `null`——`chars` 同 `state.input` codepoint 数组语义且**无 `\n`**（单行不变式）；`0 <= cursor <= chars.length`；空态 = `{ chars: [], cursor: 0 }`（第 31 批；此前为裸 `{ text }`——契约见 §8）

## 2. 正常输入模式按键表

| 按键 | 行为 |
|------|------|
| 可打印字符 | 插入光标位置（`\r\n` 剥离、`\t` → 两空格） |
| Backspace / Delete | 删光标前/处字符 |
| ← → Home End | 光标移动 |
| Ctrl+U | 清空输入框 |
| Enter（`return`/`\r`） | 提交 |
| **Shift+Enter** | **插入换行（多行输入）** — 需终端键盘增强协议（见 §5）；不支持时退化为提交 |
| Alt+Enter（`meta+return`） | 插入换行（后备多行键，所有终端可用） |
| Tab | 斜杠命令补全循环 |
| ↑ ↓ | 多行（可视行——折行与 `\n` 同权）：框内竖直移动（显示列保持 + 短行端钳制）；不可移时 ↑ 回落历史、↓ 无动作；翻历史中恒历史导航（三规则见 §3）**（第 31 批）** |
| Ctrl+V | 粘贴剪贴板文本（保留 `\n`，支持多行粘贴） |
| Alt+V / Ctrl+Alt+V | 粘贴剪贴板图片 → 插入 `read_image <path>` 命令 |
| Ctrl+F | 进入搜索模式 |
| Ctrl+I / Tab(处理中) | 中断注入模式 |
| PgUp/PgDn | 会话区滚动 |

## 3. 输入历史导航语义（↑↓ 三规则 + 草稿保护）

**↑↓ 三规则（第 31 批——设计已落档、实现待批准）**：

1. **翻历史中恒历史**：`historyIndex !== -1` 时 ↑/↓ 恒为历史导航（即便当前条目为多行——不竖移）
2. **竖移优先**：`historyIndex === -1` 且光标所在可视行在对应方向存在邻行 → 光标竖移——目标行显示列 =
   当前光标显示列（**显示列保持**），目标行更短则钳制到行尾；折行与 `\n` 同口径（按可视行）
3. **边界回落**：无可移邻行时——↑ 回落历史导航（草稿保护见下）；↓ 无动作

- ↑：`historyIndex` 回退，加载历史条目；**首次进入导航前，未提交的输入存入 `state._draft`**
- ↓：`historyIndex` 前进；走到头时**从 `_draft` 恢复原来在打的字**（无草稿则回空白），恢复后清 `_draft`
- 空输入进入导航不存草稿；`submit()` 清 `_draft`
- 竖移不改草稿（仅发生在 `historyIndex === -1`——草稿面零涉，不变量 2/3 零改）
- 处理中（`processing`，含 digest）：**竖移放行**（纯编辑——与字符/退格/←→ 同权）、**历史导航禁**
  （第 1/3 条的历史分支吞——不进入、不切换；Tab/提交吞等其余 busy 门禁不变）

## 4. 挂起态输入契约（§17）

> 挂起会话期间（`state.suspended`，AGENT-LOOP.md §17 D-S2/D-S9）输入框放开。挂起决策/队列机制权威 = AGENT-LOOP §17；此处只落输入框侧行为。

- **不变量（F3 铁律）**：`state.input` **永不被后台事件读写**——settle/消化轮/注入全部经独立通道（token/`state.pendingInput`），后台代码零接触输入框；框内文本在后台事件前后逐字不变
- **Enter（非 slash 文本，含 digest 运行中）**：不入 `state.queue`、不打断当前消化轮——消息入 **`state.pendingInput` 队列**（key-handler 分流 + 清框，与 submit 同款清理；history 照常收录），经 `state._suspWake?.()` 唤醒挂起会话循环；纯挂起期立即调度新回合，digest 运行中排队续发（队列非空期间不触发新 auto-turn）
- **斜杠命令**：挂起分流不拦截——走 submit 正常路径（纯挂起期直接执行；digest 中 allowlist 直行/其余入 `state.queue`，会话循环排空）
- **Ctrl+C**：挂起/消化中 = 武装窗口两级中止。语义分两支：
  - **未武装首次按下**：digest/会话内回合处理中仅中止当前回合（`state.controller.abort()`，会话与后台子代理不受影响，回挂起等待）；纯挂起等待期仅提示武装（含运行中数量，不清池）
  - **3s 窗口内再次按下**（`state.suspAbortArmed` + `ctx.suspArmTimer`）才彻底中止：abort 集合 = 链条内全部 controller（`agent._sessionAbortAll`，含旧 controller 下 children）+ `_suspAborted` + 唤醒 driver → 清池 → idle
  - 中止后会话退出复位 `_suspAborted`（池再 live 可重新进入挂起态）；digest 期间排队的 pendingInput 残余转回 `state.queue` 由普通回合续发 + 提示行（不静默丢）
  - **Ctrl+I**：仅 digest 处理中有效（`processing && controller`）——立即打断（interruptPrompt，插话语义保留）；框内光标与编辑键（含四方向键）见 §8；纯挂起等待期 Ctrl+I 无动作（Enter 即插话通道）
- 消化轮输出照常流式显示（assistant 标签 + 摘要进会话流）；状态行显示"后台 N 子代理运行中 · M 待消化"（processing 期由工具事件接管）

## 5. 多行输入（能力 + 键实现）

### 5.1 真实能力（实测）

| 途径 | 状态 | 说明 |
|------|------|------|
| **粘贴多行文本** | ✅ 正常 | bracketed paste → `insertPastedText` 保留 `\n` |
| **Shift+Enter 插换行** | ✅ 现代终端可用 | 需终端键盘增强协议，见 §5.2；旧版控制台物理上不可能 |
| **Ctrl+J 插换行** | ✅ **所有终端可用（主后备）** | Ctrl+J 发送 `\n`（0x0A），Enter 发送 `\r`（0x0D），字节天然不同，不依赖任何协议；readline 解析为 `name:"enter"` |
| Alt+Enter 插换行 | ✅ 保留 | readline 对 `\x1b\r` 稳定解析为 `name:"return", meta:true`；但 Windows 旧版控制台把 Alt+Enter 截走切全屏（不可用） |

### 5.2 多行键实现方案（三层）

> 判定：Shift+Enter（现代终端）+ Ctrl+J（所有终端后备）+ Alt+Enter（第三后备）。多数终端默认对 Shift+Enter 发送裸 `\r`，与 Enter 字节级不可区分——监听 `key.shift` 是死路。

1. **Shift+Enter（现代终端）**：启动时同时启用两种协议（不支持的终端直接忽略）：
   - `\x1b[>1u` — kitty keyboard protocol push（Windows Terminal 1.19+、VS Code 终端、kitty、iTerm2）：Shift+Enter → `\x1b[13;2u`
   - `\x1b[>4;2m` — xterm modifyOtherKeys level 2（mintty/Git Bash）：Shift+Enter → `\x1b[27;2;13~`
   - stdin 层 `translateShiftEnter` 把两种序列翻译为 `\x1b\r` → readline 解析为 meta+return → 多行分支
   - 退出时 `\x1b[<u` + `\x1b[>4m` 复位
2. **Ctrl+J（所有终端，含旧版控制台）**：key-handler 的提交分支把 `name === "enter"`（即 `\n`）改为插换行。唯一风险：终端被配置成 Enter 发送 LF（极罕见；那样 Enter 与 Ctrl+J 同为 `\n`，无换行键）
3. **Alt+Enter（第三后备）**：保持 meta+return 分支不动；旧版控制台上被系统截走（切全屏），现代终端可用

**为什么走 stdin 翻译而不是在 key-handler 里处理 CSI-u**：Node readline 不认识 CSI-u 序列（实测解析为 `name:"undefined"` 或拆成垃圾字符），必须在进 readline 之前拦截。

**诊断工具**：`node scripts/key-probe.mjs`，按键看终端实际发的字节。

**网上流传的 "key.name==='enter' + key.shift" 教程不可用**：`key.shift` 只在协议启用时才有值；其代码真正触发的路径恰好是 Ctrl+J（`name:"enter"` ← `\n`），歪打正着验证了方案 2。

## 6. 相关模块

| 模块 | 职责（输入框相关） |
|---|---|
| `src/tui/key-handler.mjs` | 按键总分发：permission/question/search/picker/wizard/interruptPrompt/输入编辑 + §17 挂起态输入；↑↓ 分流（竖移/历史——§3）；Inject 框创建（§8） |
| `src/tui/key-modes.mjs` | 模态层（D-S4 自 key-handler 拆出）：permission / question / interruptPrompt 独占模态——激活即消费全部按键；question 自由文本态编辑键（§7）；Inject 框编辑键（§8） |
| `src/tui/render.mjs` | `layoutInput`（折行/光标行列 + `lineStarts`）/ `charWidth` 纯函数；`moveCursorVertical`（竖移定位——§3 规则 2） |
| `src/tui/layout.mjs` | `computeLayout` 面板布局（输入框 boxLines / cap / offset / 光标行列；question 自由文本态 layoutAnswer = layoutInput 复用）；`inputContentWidth`（输入框内容宽度单源——布局与竖移共用） |
| `src/tui/clipboard.mjs` | translateShiftEnter（CSI-u / modifyOtherKeys → `\x1b\r`）；insertPastedText 目标路由（主输入落 cursor / question 落 cursor + 单行守卫 / options 忽略 / 注入框落 cursor + 去换行——§8） |
| `src/tui/interaction.mjs` | askQuestion 装配：q.answer codepoint 数组 + q.cursor（options 态无） |
| `src/tui/render-frame.mjs` / `render-loop.mjs` | question 自由文本态光标例外（hasOverlay 细化 / cursorSuffix 正常发）；Inject 框标题提示与空态占位符（§8.3） |
| `src/tui/ansi.mjs` | keyboardPush / keyboardPop 序列常量 |
| `src/tui/index.mjs` | state 初始化（含 `_draft` / `interruptPrompt` 空态）；stdin 层 translateShiftEnter 接线；启动 keyboardPush / 退出 keyboardPop |
| `test/input-lock.test.mjs` + `test/arrow-editing.test.mjs` | 按键分发锁（含 busy 门禁）+ 方向键编辑用例（§9.6——新档；原表 `test/tui.test.mjs` / `test/clipboard.test.mjs` 已删（存量测试清零批）——第 31 批更正） |

## 7. question 自由文本输入态：光标与编辑键

> 状态：已实现（D-Q1：`layout.mjs` layoutAnswer + 自由文本编辑键 + `key-modes.mjs` 拆分 D-S4）。主输入框与 question 自由文本框均有光标（视觉反显 + 硬件定位双机制）；question 其余文本面无缺口（wizard 复用 state.input、picker filter 行内输入已有光标）。
> **Inject 框（Ctrl+I）为另一独立面——键集 = 本节最小集 + 四方向键，见 §8。**

### 7.1 渲染

- **渲染数据源**：`layout.mjs` question boxLines 分支——question 存在时 boxLines 为 options 列表或自由文本态的光标行；question 自由文本态 `boxLines = layoutAnswer(q.answer, q.cursor, width)`——**与 layoutInput 同实现**（多行换行展开——`▸ ` 首行 + 续行 2 空格缩进——返回 `{lines, cursorLine, cursorCol}`）。
- **行数上限**：复用主输入 cap（MAX_INPUT_LINES 5 + inputOffset 滚动）——光标随行滚动。
- **渲染例外（hasOverlay 细化）**：permission / picker / wizard-provider / options 态维持无光标；**question 自由文本态保留视觉反显 + 硬件定位**（与主输入框同路径——cursorSuffix 正常发）。options 态无光标（▸ 标记即反馈）。

### 7.2 契约（状态模型扩展 + 编辑键）

**状态模型扩展**（§1 不变量 8）：`state.question.cursor` 整数——question 处于**自由文本态**（无 options 或选中 Custom answer…）时恒满足 `0 <= cursor <= answer.length`——answer 存 codepoint 数组；options 态无 cursor 字段。进入自由文本态时初始化 `answer=[]`、`cursor = answer.length`；options→Custom 转换时同步初始化。提交时 `Array.join` 还原串。

**自由文本态按键表**（与主输入框对齐的最小集）：

| 键 | 行为 |
|---|---|
| ← / → | cursor 移动（0 边界停） |
| Home / End | 跳首/尾 |
| Ctrl+U | 清空 answer 与 cursor（同主输入框语义） |
| Backspace | 删 cursor 前字符（cursor 位置感知） |
| 可打印字符 | 插入 cursor 位置 |

**语义（定稿）**：
- **Esc**：有 options 时自由文本态 Esc = **回 options 态**（非中止——误触 Custom 有逃生口）；无 options 时 Esc = 中止 question
- Enter 提交；Ctrl+V 粘贴落 cursor 位置——**粘贴含 `\n` → 替换为空格**（保文本——单行不变式硬守卫）
- **Ctrl+J = no-op 吞**（不插换行）；未列键一律消费 return，无 fall-through
- **options 态**：↑↓/Enter/Esc 不变；选中后自由文本态（Custom answer…）自动进入上述光标态
- Ctrl+V 与 bracketed paste 共用同一实现（`clipboard.mjs insertPastedText` question 分支）：落 cursor + `\n`/`\r` 折叠为空格 + `\t` → 2 空格

## 8. Inject 框（Ctrl+I）：光标与编辑键（第 31 批——设计已落档、实现待批准）

> 状态模型见 §1 不变量 9。渲染 = 复用主输入框面板（目标态）：`layout.mjs` 把 `interruptPrompt.chars` 走
> `layoutInput`（`MAX_INPUT_LINES` cap + offset 滚动同款）；光标反显 + 硬件定位与主输入框同路径
> （`hasOverlay` 不含 interruptPrompt）。

### 8.1 按键表

| 键 | 行为 |
|---|---|
| ← / → | cursor 移动（0 边界停） |
| ↑ / ↓ | 折行竖移（显示列保持 + 短行端钳制；无邻行时吞——**无历史回落**、零副作用） |
| Home / End | 跳首/尾 |
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
  ① 四方向键 ↑↓（上文）；② 粘贴换行清洗——本面 `\n`/`\r` **去除**（§8.1 键表），§7.2 面 `\n`/`\r` **折叠为空格**（§7.2 语义）。
- 单行不变式同款（无换行键）；Esc / Enter 语义各自既有（取消注入 / 答问提交）。
- 注入框**无历史回落**：↑↓ 边界 = 吞（不牵动主输入框 `state.history`）。

### 8.3 渲染与提示

- 光标：与主输入框同路径（反显 + 硬件定位）；`chars` 为空时显示既有空态占位符
  （`Type message to inject (Enter send, Esc cancel)`）。
- **标题提示（`render-frame.mjs` 更新——第 31 批）**：` Inject Message ` 面提示改为
  `" Enter send, Esc cancel │ ←→↑↓ Home/End move │ Ctrl+V paste "`；现行共用段中
  `Shift+Enter / Ctrl+J newline` 与 `Ctrl+I inject` 在本面移除（单行框无换行键；框内 Ctrl+I 被模态吞）。
  共用段条件由 `title !== " Question "` 收窄为 `title === " Input " || title === " Processing... "`。

## 9. 第 31 批设计：方向键编辑（2026-09-11——设计 + 测试层）

> 需求回指 = `../requirements/TUI.md` §2 F11 + §3 N8；批次档 = `../batches/2026-09-11-ARROW-EDITING.md`
> （§1 条目 E1 + 用户裁定）。验收与用例以本节为准；§2/§3/§8 已按目标态就地更新（变更索引见 §9.3）。

### 9.1 问题陈述

主输入框 ↑↓ 现为**无条件**历史导航（`key-handler.mjs:296-325`）——多行输入（含折行）无竖直移动；
Inject 框（Ctrl+I）`state.interruptPrompt` 为裸 `{ text }`、无 cursor——四方向键结构性无响应
（`key-modes.mjs:210-238` 末尾吞键）。用户裁定（2026-09-11 13:36）：**↑↓ = 多行时竖直移动、
单行时回落历史；正在翻历史（`historyIndex ≠ -1`）时恒为历史导航**。

### 9.2 方案选型对比

**A. 主框竖移实现形态**：

| # | 候选方案 | 判据逐项评估 | 取舍（选定代价/权衡） | 结论 |
|---|---|---|---|---|
| A1 | 纯函数 `moveCursorVertical`（基于 `layoutInput` 行列 + `lineStarts`）+ key-handler 分流 | 与渲染同源（折行/前缀/CJK 宽度零漂移）；可单测；状态零增 | `layoutInput` 增 additive 字段（兼容）；key-handler ↑↓ 块重排 | **选定** |
| A2 | key-handler 内自行按 `\n` 分行算行列（不复用布局） | 不动 render.mjs | 折行/前缀/宽度双实现（必漂移）；只能端到端测 | 否决 |
| A3 | 列记忆（sticky column——zsh zle 式往返还原） | 长行↔短行往返列还原 | 新持久状态（不变量 +1）+ 边界多；非本批诉求 | 否决（如需另案） |

**B. 「多行」判定口径**：

| # | 候选方案 | 判据逐项评估 | 取舍 | 结论 |
|---|---|---|---|---|
| B1 | 可视行口径（折行 + `\n` 同权） | 与 zsh/readline 惯例 + VSC webview 同款一致；长粘贴文本可竖移 | 长折行单行输入 ↑ 不再一步进历史（须移至顶行） | **选定** |
| B2 | 逻辑行口径（仅 `\n`） | 「多行」= 显式换行；单行 ↑ 直接进历史 | 与两类形态不符；折行文本内无法竖移 | 否决 |

**C. processing 期屏蔽（`key-handler.mjs:271`）**：

| # | 候选方案 | 判据逐项评估 | 取舍 | 结论 |
|---|---|---|---|---|
| C1 | 竖移放行 + 历史禁 | 与 busy 门禁「吞提交不吞编辑」一致（字符/退格/←→ 已放行）；多行编辑可用 | 语义微扩（契约同步落 §3）；`:271` 行改（tab 子句保留——死条件在案，见 D-31.3） | **选定** |
| C2 | 全屏蔽（现状） | 零改 | processing 期多行编辑无竖移（与字符放行不一致） | 否决 |

**D. Inject 框升级形态**：

| # | 候选方案 | 判据逐项评估 | 取舍 | 结论 |
|---|---|---|---|---|
| D1 | `{ chars, cursor }` + 复用 `layoutInput` 渲染 + 最小集 + 四方向键 | 与主框/question 同源（codepoint 数组语义）；可单测 | 触碰 5 源文件；state 注释同步 | **选定** |
| D2 | 保留 `{ text }` 加 `cursor` 整数 | 改动范围 = 单字段扩展 | text/cursor 双源（切字正确性靠约定——emoji 代理对风险）；与既有 codepoint 口径分叉 | 否决 |
| D3 | 多行 Inject（支持换行） | 可写长插话 | 提交/渲染/单行守卫全改——语义扩，非本批诉求 | 否决（后续候选） |

### 9.3 接口契约（契约变更清单——语义正文 = §1/§2/§3/§8）

| # | 契约点 | 前 → 后 | 落点 |
|---|---|---|---|
| 1 | `layoutInput` 返回 | `{lines, cursorLine, cursorCol}` → 增 `lineStarts`（additive） | §1 不变量 5 |
| 2 | 新增纯函数 | `moveCursorVertical(chars, cursor, width, dir) → number \| null`（render.mjs；`null` = 该方向无邻行） | §1 不变量 5 / §9.5 |
| 3 | 新增纯函数 | `inputContentWidth(cols) = max(20, cols − 1) − 4`（layout.mjs；布局与竖移共用宽度单源） | §6 表 |
| 4 | 按键表 `↑ ↓` 行 | 「输入历史导航」→ 三规则（竖移优先 / 边界回落 / 翻历史恒历史） | §2 / §3 |
| 5 | processing 期 | 「↑↓ 屏蔽 + 输入排队」→ 「竖移放行 + 历史导航禁」 | §3 |
| 6 | Inject 状态模型 | `{ text: string }` → `{ chars: string[], cursor: number }`（单行不变式） | §1 不变量 9 / §8.1 |
| 7 | Inject 键集 | Esc/Enter/Backspace/可打印 → 最小集 + 四方向键 | §8.1 |
| 8 | Inject 标题提示 | 含「Shift+Enter / Ctrl+J newline」「Ctrl+I inject」不成立提示 → `Enter send, Esc cancel │ ←→↑↓ Home/End move │ Ctrl+V paste` | §8.3 / §9.5（render-frame 行） |

> D2 单一权威源：语义正文只在「落点」各节——本节只作变更索引、不重述。

### 9.4 关键决策记录（含否决备选）

| # | 决策 | 理由 | 否决备选 |
|---|---|---|---|
| D-31.1 | 「多行」= 可视行（折行与 `\n` 同权） | zsh/readline 惯例 + VSC 同款；长粘贴可竖移 | 逻辑行口径（§9.2 B2） |
| D-31.2 | 列保持**逐键现算**（不记忆） | 状态零增；行为可预测 | sticky 列记忆（§9.2 A3） |
| D-31.3 | processing 期：竖移放行 / 历史禁 | 与「吞提交不吞编辑」一致 | 全屏蔽（§9.2 C2）；`:271` tab 死条件在案（TODO 待讨论）——本批不删、原样保留 |
| D-31.4 | Inject 去 `text` 改 `chars/cursor`（单行不变式保留） | 与主框/question codepoint 语义同源；四方向键可机验 | 双源 text+cursor；多行 Inject（§9.2 D2/D3） |
| D-31.5 | 历史中恒历史（多行条目不竖移）逐字落裁定 | 用户裁定 2026-09-11；可预期 | 历史条目内竖移（否决——违裁定） |
| D-31.6 | 竖移不触碰草稿/历史指针 | 仅 `historyIndex === -1` 时发生 | —（无备选） |
| D-31.7 | 承载 = 本档（§2/§3/§8 就地更新 + §9 批设计）；`TUI.md` 更新面报告父侧（本批未写——超会话声明面） | 本档自述「改完更新这里」（D1：契约档 = design 面） | 写入 `TUI.md` §13（父侧可否决重定向） |
| D-31.8 | 测试新档 `test/arrow-editing.test.mjs` + 既有锁档零改 | 避免与 input-lock 语义混杂；既有锁面不动 | 扩写 `test/input-lock.test.mjs` |

### 9.5 受影响文件（as-of 2026-09-11 实测；口径 `split("\n").length` 含末行）

| 文件 | 性质 | as-of 行数 | 预计增量 | 档位与拆分结论 |
|---|---|---|---|---|
| `src/tui/render.mjs` | 改 | 253 | +30 ± 10（`lineStarts` + `moveCursorVertical`） | ≤300——不拆（单函数新增） |
| `src/tui/layout.mjs` | 改 | 227 | +8 ± 3（inject 字段读取 + `inputContentWidth`） | ≤300——不拆 |
| `src/tui/key-handler.mjs` | 改 | 440 | +15 / −10 | >300（≤500 硬限内）——**不拆**：↑↓ 分流块重排 + 创建点 1 行，无新函数；再增厚触发拆分评估 |
| `src/tui/key-modes.mjs` | 改 | 239 | +20 ± 6（handleInterruptMode 编辑键） | ≤300（→ ~259）——不拆 |
| `src/tui/clipboard.mjs` | 改 | 175 | +6 / −2（注入框落 cursor） | ≤300——不拆 |
| `src/tui/render-frame.mjs` | 改 | 377 | ±4（Inject 标题提示 + 占位符判定） | >300——**不拆**：两处单点 |
| `src/tui/index.mjs` | 改（注释） | 450 | ±1（state 注释形态） | >300——**不拆**（仅注释） |
| `test/arrow-editing.test.mjs` | 新增 | — | +170 ± 40 | 新档（用例 11 条——§9.6） |
| `test/input-lock.test.mjs` | 零改（回归） | 205 | 0 | 不适用 |

> `docs/design/TUI.md` 更新面（**已随交付后刷新轮回写**）：§1 模块地图触行行数（第 20/28/31 批面）、§4 状态优先级行序 +
> 「正常输入编辑」括注、§2 state 列表 `interruptPrompt` 形态注。

### 9.6 测试层——用例表（新档 `test/arrow-editing.test.mjs`；正常/边界/错误）

| 用例 | 类型 | 输入 | 预期输出 |
|---|---|---|---|
| T-A1 | 正常 | `input=[..."aaa\nbbb\nccc"]`，cursor=9（第 3 行 col1） | ↑ → cursor=5（第 2 行 col1）；再 ↓ → cursor=9 |
| T-A2 | 边界 | `input=[..."aa\nb"]`，cursor=2（第 1 行行尾） | ↓ → cursor=4（短行钳制行尾）；再 ↑ → cursor=1 |
| T-A3 | 边界 | `input=["中","文","\n","a","b"]`，cursor=5 | ↑ → cursor=1（显示列 2——非 codepoint 计数） |
| T-A4 | 正常 | `input=[..."hello"]`，`history=["prev"]` | ↑ → historyIndex=0、input=[..."prev"]、`_draft`=[..."hello"]；↓ → 还原草稿、historyIndex=−1 |
| T-A5 | 边界 | `input=[..."aa\nbb"]`：cursor=1（第 1 行）→ ↑；cursor=5（末行）→ ↓ | ↑ → 历史导航（historyIndex 变、草稿入 `_draft`）；↓ → 零变化 |
| T-A6 | 边界 | `history=["older","x\ny"]`（index0=older / index1 最新——push 序），先 ↑ 进入历史（historyIndex=1，input=[..."x\ny"]，cursor=3） | 再 ↑ → historyIndex=0、input=[..."older"]、cursor=5（条目末——历史加载语义；**未竖移** = historyIndex 递减 + input 被换）；↓ → historyIndex=1、input=[..."x\ny"]、cursor=3 |
| T-A7 | 边界 | `processing=true` + `history=["prev"]`（非空夹具）；多行 `input=[..."aa\nbbbb"]`，cursor=5（末行 col2）/ 单行 `input=[..."solo"]` | 多行 ↑ → cursor=2、input 与 historyIndex 不变（历史禁——不载入 `"prev"`）；单行 ↑ → 零变化（历史禁——不载入 `"prev"`）；末行 ↓ → 零变化 |
| T-A8 | 正常 | Inject `{chars: "a"×60, cursor: 30}`，cols=40（内容宽 35 → 折 2 行：行 1 = 33 字符 / 行 2 = 27 字符——含 2 列行前缀，显示宽 35 / 29） | ↓ → cursor=60（行 2 短行钳制行尾）；↑ → cursor=27（列保持——逐键现算，不回 30）；↓ → cursor=60；末行 ↓ → 零变化；← → cursor=59；Home → cursor=0；End → cursor=60；Ctrl+U → chars 空、cursor=0 |
| T-A9 | 错误/回归 | Inject Enter（非空且 `processing`）；空（trim 后）Enter；Esc | abort({interrupt:true,message}) 被调 + `[inject]` 提示；空 → 不 abort；Esc → 置 `null` |
| T-A10 | 正常 | `insertPastedText(state, "ab\ncd\t e")`（interruptPrompt 活跃） | chars 落 cursor 处、无 `\n`、`\t` → 两空格 |
| T-A11 | 回归 | 空 input + 空 history ↑；单行 input 非历史 ↓ | 均零副作用（无异常、无状态变化） |

### 9.7 验收标准（逐条回指需求；每条有可核验手段——机跑用例或检视证据）

| AC | 内容 | 回指 | 机验手段 |
|---|---|---|---|
| AC-E1-1 | 多行竖移 + 显示列保持 + 短行钳制 | F11 | T-A1 / T-A2 |
| AC-E1-2 | 单行输入 ↑ 回落历史（草稿保护） | F11 | T-A4 |
| AC-E1-3 | 多行顶行 ↑ 回落历史；末行 ↓ 无动作 | F11 | T-A5 |
| AC-E1-4 | 翻历史中恒历史（多行条目也不竖移） | F11 | T-A6 |
| AC-E1-5 | processing 期：竖移放行 + 历史导航禁 | F11 | T-A7 |
| AC-E1-6 | Inject 四方向键（折行竖移 + 边界吞 + ←→/Home/End） | F11 | T-A8 |
| AC-E1-7 | Inject 契约（`{chars,cursor}` 模型 / 提交回归 / 粘贴落光标） | F11 | T-A9 / T-A10 |
| AC-E1-8 | 单行/空输入语义零回归 | N8② | T-A11 + `test/input-lock.test.mjs` |
| AC-E1-9 | 显示列口径（CJK）+ 既有锁零伤 | N8① | T-A3 + `node --test test/arrow-editing.test.mjs test/input-lock.test.mjs` |
| AC-E1-10 | 实现面约束（状态对象零增 / 零新依赖） | N8③ / N8④ | 检视验证（交付证据）：纯函数签名无 state 入参（`moveCursorVertical`/`layoutInput`——`render.mjs`）；交付 diff 零新 state 字段；`package.json` 与 import 面零增 |

### 9.8 边界（本批不做）

- 不做 VSC 端改动（其 webview 已有同款；差异仅报告：VSC 在文本框首行 col>0 时 ↑ 为浏览器
  默认 no-op——不回落历史；CLI 按裁定回落历史）。
- 不改 question 自由文本态（§7 键集零动）；不给 Inject 引入 Delete / 多行 / 历史回落。
- 不引入列记忆状态；不动 search / picker / wizard / permission 键语义；不动 `:271` tab 死条件（TODO 在案）。
- 不新建档；不 commit；`TUI.md` 更新面由父侧排程（本批不写）。

## 变更记录

- 2026-09-11（第 31 批——设计已落档、实现待批准）：↑↓ 三规则（§3）+ processing 期语义（§3）；Inject 框 `{chars,cursor}` 与四方向键（§8）；契约 §1/§2/§6 同步；批设计/用例/AC = §9；§6 测试行更正（原 `test/tui.test.mjs` / `test/clipboard.test.mjs` 已删（存量测试清零批），改指实档）。
- 2026-09-11（第 31 批修正轮——设计评审轮次 1 后）：评审 #1/#2/#6 用例复算修正（T-A6 数组序 / T-A7 夹具 / T-A8 几何）；#3 AC-E1-9 回指收窄 + 新增 AC-E1-10（检视口径）；#5 档头枚举 + §8 引言目标态措辞；#6/#7 不变量 5 哨兵与 cursor 落 `\n` 归属；#8 §8.2 差异两项。语义零改。
- 2026-09-11（第 31 批交付后刷新）：§9.6 T-A8 括注几何修正（行 1 / 行 2 = 33 / 27 字符——含 2 列行前缀、显示宽 35 / 29；「↑」列保持 → cursor=27——按 §9.3 #3 单源 + `render.mjs` 行前缀语义实测、与测试档断言对齐）；§1 不变量 4 分发序归位（interruptPrompt 先于 picker——原「picker 吃掉按键」口径与实现不符）；档头/§9.5 末注更新（`TUI.md` 更新面已回写）。
- 2026-09-07：格式债清理——批量档案重写为当前态契约文档；历史回归批（BUG-1..8、v0.11.1→HEAD 逐提交审计、多行渲染/图片粘贴诊断、各 fix 修改文件清单、§7 round1 评审处置）折叠为一条注记，现行语义以本文档契约为准，均已实现并测试通过。
- 2026-09-03/04：question 自由文本态光标与编辑键落地（D-Q1 + key-modes 拆分 D-S4）。
- 2026-09-02：§17 挂起态输入契约归属本文档。
- 2026-08-04：多行渲染（BUG-6/7）与图片粘贴死分支（BUG-8）修复。
- 2026-08-03：Shift+Enter 多行拍板；08-04 补 Ctrl+J 后备。
- 历史修复要点（现行态已含于上文 §2-§5）：Ctrl+F 搜索无穿透（兜底 return）、权限 'a' AUTO reminder 注入恢复、Shift+Enter 改键盘协议方案（删 `key.shift` 死分支）、草稿保护（§3）。
