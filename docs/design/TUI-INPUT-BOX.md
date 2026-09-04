# TUI 输入框功能规格、回归记录与修复方案

> **本文档是输入框的唯一行为契约。任何对输入框/键处理的修改，先读这里，改完更新这里。**
> 基线：v0.11.1。当前 HEAD：0.12.3+。

## 1. 输入框功能契约（当前应有的完整行为）

### 1.1 状态模型（不可破坏的不变量）

1. `state.input` 是字符数组（`string[]`）；`state.cursor` 是整数，恒满足 `0 <= cursor <= input.length`
2. `state.history` 是已提交文本的字符串数组；`historyIndex === -1` 表示不在历史导航中
3. `submit()`：清空 input/cursor → `history.push(text)` → `historyIndex = -1` → `scroll = 0`
4. 模式栈互斥，优先级从高到低：`permission → question → search → picker 栈/wizard → interruptPrompt → 正常输入`（2026-09-03 §7 评审 #1 修正——picker 打开期间 Ctrl+I 不接收不处理——picker 吃掉按键——与 TUI.md §3 链一致——原链 interruptPrompt 在 picker 上是错误）。每个模式处理自己的键后必须 `return`
5. `layoutInput(chars, cursor, width)` 是纯函数：`(chars, cursor, width) → { lines, cursorLine, cursorCol }`，遇 `\n` 强制换行
6. 输入框渲染宽度 = `W - 4`；最多显示 `MAX_INPUT_LINES`（5）行，超出滚动（`inputOffset`）
7. 渲染层是 `renderRows`（row-diff）：每帧全量计算屏幕行 → 与上一帧 diff → 只重写变化行。输入框内容变化靠"行内容不同则重写"，无独立缓存
8. `state.question` **自由文本态**（无 options 或选中 Custom answer…）：`q.answer` 是 codepoint 数组（同 `state.input` 语义——emoji/代理对不劈半），`q.cursor` 是整数且恒满足 `0 <= cursor <= answer.length`（§7 契约）；options 态无 answer/cursor 字段（选择标记即反馈——不变量不适用）。提交时 `Array.join` 还原串

### 1.2 按键表（正常输入模式）

| 按键 | 行为 |
|------|------|
| 可打印字符 | 插入光标位置（`\r\n` 剥离、`\t` → 两空格） |
| Backspace / Delete | 删光标前/处字符 |
| ← → Home End | 光标移动 |
| Ctrl+U | 清空输入框 |
| Enter（`return`/`\r`） | 提交 |
| **Shift+Enter** | **插入换行（多行输入）** — 需终端键盘增强协议（见 1.5）；不支持时退化为提交 |
| Alt+Enter（`meta+return`） | 插入换行（后备多行键，所有终端可用） |
| Tab | 斜杠命令补全循环 |
| ↑ ↓ | 输入历史导航（见 1.3） |
| Ctrl+V | 粘贴剪贴板文本（保留 `\n`，支持多行粘贴） |
| Alt+V / Ctrl+Alt+V | 粘贴剪贴板图片 → 插入 `read_image <path>` 命令 |
| Ctrl+F | 进入搜索模式 |
| Ctrl+I / Tab(处理中) | 中断注入模式 |
| PgUp/PgDn | 会话区滚动 |

### 1.2a §17 挂起态输入契约（2026-09-02，评审 #3——输入框契约归属本档）

挂起会话期间（`state.suspended`，AGENT-LOOP.md §17 D-S2/D-S9）输入框放开：

- **不变量（F3 铁律）**：`state.input` **永不被后台事件读写**——settle/消化轮/注入全部经独立通道（token/`state.pendingInput`），后台代码零接触输入框；框内文本在后台事件前后逐字不变（T-S15 断言）
- **Enter（非 slash 文本，含 digest 运行中）**：不入 `state.queue`、不打断当前消化轮——消息入 **`state.pendingInput` 队列**（key-handler 分流 + 清框，与 submit 同款清理；history 照常收录），经 `state._suspWake?.()` 唤醒挂起会话循环；纯挂起期立即调度新回合，digest 运行中排队续发（D-S5 队列非空期间不触发新 auto-turn）
- **斜杠命令**：挂起分流不拦截——走 submit 正常路径（纯挂起期直接执行；digest 中 allowlist 直行/其余入 `state.queue`，会话循环排空）
- **Ctrl+C**：挂起/消化中 = 武装窗口两级中止（round2 偏差 #4，仿空闲态退出武装）——**未武装首次按下**：digest/会话内回合处理中仅中止当前回合（`state.controller.abort()`，会话与后台子代理不受影响，回挂起等待）；纯挂起等待期仅提示武装（含运行中数量，不清池）。**3s 窗口内再次按下**（`state.suspAbortArmed` + `ctx.suspArmTimer`）才彻底中止：abort 集合 = 链条内全部 controller（`agent._sessionAbortAll`，含旧 controller 下 children）+ `_suspAborted` + 唤醒 driver → 清池（§15 abort 语义）→ idle。中止后会话退出复位 `_suspAborted`（round2 #1——池再 live 可重新进入挂起态）；digest 期间排队的 pendingInput 残余转回 `state.queue` 由普通回合续发 + 提示行（round2 #2-CLI——不静默丢）
- **Ctrl+I**：仅 digest 处理中有效（`processing && controller`）——立即打断（interruptPrompt，插话语义保留，F7 双模式）；纯挂起等待期 Ctrl+I 无动作（Enter 即插话通道）
- 消化轮输出照常流式显示（assistant 标签 + 摘要进会话流）；状态行显示"后台 N 子代理运行中 · M 待消化"（processing 期由工具事件接管）

### 1.3 历史导航语义（FIX-5 已实现草稿保护）

- ↑：`historyIndex` 回退，加载历史条目；**首次进入导航前，未提交的输入存入 `state._draft`**
- ↓：`historyIndex` 前进；走到头时**从 `_draft` 恢复原来在打的字**（无草稿则回空白），恢复后清 `_draft`
- 空输入进入导航不存草稿；`submit()` 清 `_draft`
- 处理中（`processing`）：↑↓ 被屏蔽，输入排队进 `state.queue`

### 1.4 多行输入的真实能力（实测结论）

| 途径 | 状态 | 说明 |
|------|------|------|
| **粘贴多行文本** | ✅ 正常 | bracketed paste → `insertPastedText` 保留 `\n`；v0.11.1 就如此 |
| **Shift+Enter 插换行** | ✅ 现代终端可用 | 需终端键盘增强协议，见 §1.5；旧版控制台物理上不可能 |
| **Ctrl+J 插换行** | ✅ **所有终端可用（主后备）** | Ctrl+J 发送 `\n`（0x0A），Enter 发送 `\r`（0x0D），字节天然不同，不依赖任何协议；readline 解析为 `name:"enter"` |
| Alt+Enter 插换行 | ✅ 保留 | readline 对 `\x1b\r` 稳定解析为 `name:"return", meta:true`；但 Windows 旧版控制台把 Alt+Enter 截走切全屏（不可用） |

### 1.5 多行键实现方案（2026-08-03 用户拍板 Shift+Enter；2026-08-04 诊断后补 Ctrl+J 后备）

**问题**：多数终端默认对 Shift+Enter 发送裸 `\r`，与 Enter 字节级不可区分——监听 `key.shift` 是死路（`99fecb4` 的错误）。

**实测诊断（用户机器，key-probe.mjs）**：Shift+Enter 发裸 `\r`、Alt+Enter 触发全屏切换——两个现象共同证明终端是**旧版控制台（legacy conhost）**，两种键盘协议都不支持。参考 kimi-code（pi-tui/terminal.ts）确认：它也是键盘协议 + modifyOtherKeys 降级这同一条路，在旧版控制台上同样无解（pi-tui 的 win32 原生插件解决的是别的问题，且违反零依赖约束，不引）。

**方案：三层**
1. **Shift+Enter（现代终端）**：启动时同时启用两种协议（不支持的终端直接忽略）：
   - `\x1b[>1u` — kitty keyboard protocol push（Windows Terminal 1.19+、VS Code 终端、kitty、iTerm2）：Shift+Enter → `\x1b[13;2u`
   - `\x1b[>4;2m` — xterm modifyOtherKeys level 2（mintty/Git Bash）：Shift+Enter → `\x1b[27;2;13~`
   - stdin 层 `translateShiftEnter` 把两种序列翻译为 `\x1b\r` → readline 解析为 meta+return → 多行分支
   - 退出时 `\x1b[<u` + `\x1b[>4m` 复位
   - 教训：f035a29 首版只启用 kitty push 没启用 modifyOtherKeys，翻译写了协议没开
2. **Ctrl+J（所有终端，含旧版控制台）**：key-handler 的提交分支把 `name === "enter"`（即 `\n`）改为插换行。唯一风险：终端被配置成 Enter 发送 LF（极罕见；那样 Enter 与 Ctrl+J 同为 `\n`，无换行键）
3. **Alt+Enter（第三后备）**：保持 meta+return 分支不动；旧版控制台上被系统截走（切全屏），现代终端可用

**为什么走 stdin 翻译而不是在 key-handler 里处理 CSI-u**：Node readline 不认识 CSI-u 序列（实测解析为 `name:"undefined"` 或拆成垃圾字符），必须在进 readline 之前拦截。

**诊断工具**：`node scripts/key-probe.mjs`，按键看终端实际发的字节。

**网上流传的 "key.name==='enter' + key.shift" 教程不可用**：`key.shift` 只在协议启用时才有值；其代码真正触发的路径恰好是 Ctrl+J（`name:"enter"` ← `\n`），歪打正着验证了方案 2。

## 2. v0.11.1 → HEAD 变更与回归审计

| 提交 | 变更 | 判定 |
|------|------|------|
| `b0bcab4` | 删除权限 'a' 的 AUTO reminder 注入 | **回归 BUG-4** |
| `79fc3df` | Ctrl+F 搜索 + render-loop 重写 row-diff | **回归 BUG-1/2/3** |
| `99fecb4` | Shift+Enter 多行 | **回归 BUG-5**（实测不可用，还会污染输入） |
| `68a0620` / `e1f5bbf` | advisor 输出面板 / engineering 门禁 | 不影响输入框 |

## 2.5 多行渲染回归（用户报告，2026-08-04）

Ctrl+J 能插入 `\n` 后暴露 `layoutInput` 两个渲染 bug：

| Bug | 现象 | 根因 |
|-----|------|------|
| BUG-6 高度不展开 | 按 Ctrl+J 后输入框不随行数加高 | 输入以 `\n` 结尾时，末尾空行未 flush：`if (cur \|\| lines.length===0) flush()` 中 cur 为空且已有行，条件不成立，光标所在新行未物化，`lines` 少一行 |
| BUG-7 左侧不对齐 | 换行/折行的后续行文本比第一行靠左 2 列 | 第一行有提示符 `▸ `（2 列），后续行无前缀，起点偏左 |

**修法**（均在 `render.mjs` `layoutInput`）：
1. 结尾 flush 条件加 `endsWithNewline`：`chars[chars.length-1]==="\n"` 时也 flush 一个空行，保证光标所在行存在
2. 后续行前缀从 `""` 改为 `"  "`（2 空格，与 `▸ ` 等宽），使文本左侧对齐
3. `cursorCol` 两个分支统一为 `2 + col`（后续行加缩进后，光标列同样偏移 2）

### 2.6 图片粘贴死分支（用户报告 Alt+V/Ctrl+Alt+V 无反应，2026-08-04）

**BUG-8**：图片粘贴分支判断 `key.name === "v" && key.alt`，但 readline 对 ESC 前缀组合键（Alt+字符）一律报 **`key.meta = true`、`key.alt = false`**（key-probe 实测确认）。分支从未命中，按键掉到可打印字符分支又被 `!key.meta` 守卫吞掉——表现为"毫无反应"。连带问题：Ctrl+V 文本粘贴分支只排除 `key.alt`，会把 Ctrl+Alt+V（readline 报 ctrl+meta）截走。

**修法**：
1. 图片分支改判 `key.alt || key.meta`（兼容两种上报方式的终端）
2. Ctrl+V 文本分支增加 `!key.meta` 排除，让 Ctrl+Alt+V 落到图片分支
3. F1 帮助补 "Alt+V — Paste clipboard image" 条目

## 3. 已确认回归与修复方案（逐项，已全部修复 @ post-aac53d9）

### BUG-1（P0）搜索框打不出字母 n/p — **已修**
`key-handler.mjs` 搜索块：`key.name === "n"` 匹配普通按键（缺 `key.ctrl`），按 n 变成"下一个匹配"。
**修法**：导航改为 `key.ctrl && name === "n"/"p"`（Ctrl+G/Ctrl+R 兼容保留）；裸 n/p 作为 query 字符输入。

### BUG-2（P0）搜索模式按键穿透 — **已修**
搜索块末尾无兜底 `return`，↑↓←→/Tab/Delete/PgUp 等穿透到隐藏的 `state.input`。
**修法**：搜索块末尾加兜底 `return`（含 Esc 与 Ctrl+C 退出分支）。

### BUG-3（P2）F1 帮助写了 Ctrl+L 清屏但未实现 — **已修**
**修法**：F1 帮助删掉 Ctrl+L 一行，替换为 "Alt+Enter — Insert newline"（不新增快捷键，避免与终端自身 Ctrl+L 冲突）。

### BUG-4（P1）权限按 'a' 开 AUTO 后模型收不到提醒 — **已修**
`b0bcab4` 删了 `agent._pendingReminders.push(...)`。
**修法**：恢复 v0.11.1 的 2 行注入。测试断言 `_pendingReminders` 含 AUTO reminder。

### BUG-5（P0）Shift+Enter 多行不可用且污染输入 — **已修（Shift+Enter 恢复可用）**
`99fecb4` 的 `if (key.shift)` 分支在真实终端不触发或触发垃圾字符（见 §1.4/§1.5 实测）。
**修法**：删除 key-handler 里的 Shift 分支（死代码），改为 §1.5 的键盘协议方案：stdin 层启用 CSI-u 并把 Shift+Enter 序列翻译为 `\x1b\r`，命中 meta+return 分支插换行。不支持协议的终端退化：Shift+Enter = 普通提交，Alt+Enter 仍可换行。F1 帮助与输入框边框提示显示 "Shift+Enter newline"。

## 4. 新增需求（用户报告"↓ 回不到当前输入"）

### FIX-5（P1）历史导航草稿保护 — **已实现**
现状：正在打字时按 ↑，草稿被覆盖且无法找回。
**实现**（对齐常见 shell 行为）：
- 进入历史导航前（`historyIndex === -1` 且 `input.length > 0` 时首次按 ↑），当前 input 存入 `state._draft`
- ↓ 走到头时从 `_draft` 恢复（不再清空为空白），恢复后清 `_draft`
- 空输入进入历史不存草稿（↓ 到头仍回空白）
- `submit()` 时清除 `_draft`
- 改动：key-handler.mjs up/down 分支、index.mjs state 初始化 `_draft: null` + submit 清除

## 5. 测试要求（修复必须带测试，test/tui.test.mjs）

1. 搜索模式：输入 `n`/`p` 追加进 query（不触发导航）；未列出的键不改动 state.input
2. Alt+Enter（`key.meta` + return）插入 `\n`；普通 return 提交
3. 权限 'a'：`agent._pendingReminders` 含 AUTO reminder
4. 草稿保护：打字 → ↑ → ↓ 到头 → input 恢复为原草稿
5. translateShiftEnter：CSI-u `\x1b[13;2u` / modifyOtherKeys `\x1b[27;2;13~` → `\x1b\r`；裸 `\r` 与 Alt+Enter CSI-u（modifier≠2）不动
6. 全量 `npm test` 过（当前基线 369）

## 6. 修改文件清单

| 文件 | 改动 |
|------|------|
| `src/tui/key-handler.mjs` | BUG-1/2/4/5 修复 + FIX-5 草稿保护 + meta+return 多行分支 |
| `src/tui/index.mjs` | state 加 `_draft: null`；stdin 层 translateShiftEnter 接线；启动 keyboardPush / 退出 keyboardPop |
| `src/tui/ansi.mjs` | keyboardPush / keyboardPop 序列常量 |
| `src/tui/clipboard.mjs` | translateShiftEnter（CSI-u / modifyOtherKeys → `\x1b\r`） |
| `src/tui/render-frame.mjs` | 输入框边框提示 "Shift+Enter newline" |
| `test/tui.test.mjs` | §5 的测试 + translateShiftEnter/多行键测试 |


---

## 7. question 自由文本输入态：光标与编辑键（2026-09-03，用户报告"主输入框有光标但 question 没光标——不方便"）

> 状态：**已实现（2026-09-03/04——D-Q1：layoutAnswer（layout.mjs）+ key-handler 自由文本编辑键 + key-modes.mjs 拆分（D-S4）——T-Q1..Q11 全绿（test/tui.test.mjs）——父侧 L2 1359/1359 核销）**。

### 7.1 问题

用户实测：主输入框有光标（视觉反显 + 硬件定位双机制），question 自由文本输入框没有——盲输 + 仅回退。explore 一手查证差距链（2026-09-03）：

1. **渲染数据源**：`layout.mjs` question boxLines 分支——question 存在时 boxLines 被替换为 options 列表或 `["▸ " + (q.answer ?? "")]`（无光标列概念）；同文件 inputLayout 按 state.input 计算——question 模式下被弃用
2. **视觉光标压制**：`render-frame.mjs` hasOverlay 判定——含 question → curLine/curCol = -1 → renderInputBox 反显光标块整体跳过
3. **硬件光标压制**：`render-frame.mjs` cursorRow/Col 计算 + `render-loop.mjs` cursorSuffix 发射——question 时均跳过（连 hideCursor 都不发）
4. **编辑能力最弱**：`key-handler.mjs` question 自由文本分支只处理 Esc/Enter/backspace/字符追加/Ctrl+V——无 ←→/Home/End/Ctrl+U

### 7.2 设计（D-Q1 question 输入态纳入输入框契约）

**状态模型扩展**（§1.1 不变量同精神）：`state.question.cursor` 整数——question 处于**自由文本态**（无 options 或选中 Custom answer…）时恒满足 `0 <= cursor <= answer.length`——**answer 存 codepoint 数组**（同 state.input 语义——非 UTF-16 串——emoji/代理对不劈半——round2 #1 定稿）；options 态无 cursor 字段（选择标记即反馈——不变量不适用）。提交时 Array.join 还原串。

**渲染**：
- 自由文本态 question：boxLines = layoutAnswer(q.answer, q.cursor, width)——**与 layoutInput 同实现**（多行换行展开——`▸ ` 首行 + 续行 2 空格缩进——返回 {lines, cursorLine, cursorCol}——round2 #1 弃"单行简化"）；**行数上限复用主输入 cap（MAX_INPUT_LINES 5 + inputOffset 滚动）**（round2 #6——防长答案挤压会话面板到零行）——光标随行滚动
- hasOverlay 例外细化：permission/picker/wizard-provider/options 态维持无光标；**question 自由文本态保留视觉反显 + 硬件定位**（与主输入框同路径——cursorSuffix 正常发）
- options 态：无光标不变（▸ 标记即反馈）

**按键**（自由文本态补全编辑键——与主输入框对齐的最小集）：
| 键 | 行为 |
|---|---|
| ← / → | cursor 移动（0 边界停） |
| Home / End | 跳首/尾 |
| Ctrl+U | 清空 answer 与 cursor（同主输入框语义） |
| Backspace | 删 cursor 前字符（现状保留——cursor 位置感知） |
| 可打印字符 | 插入 cursor 位置（现状仅追加——改插入） |

（**Esc 语义 round2 #5 定稿**：有 options 时自由文本态 Esc = **回 options 态**（非中止——误触 Custom 有逃生口）；无 options 时 Esc = 中止 question。Enter 提交。Ctrl+V 粘贴落 cursor 位置——**粘贴含 \n → 替换为空格**（保文本——单行不变式硬守卫）。**Ctrl+J = no-op 吞**（不插换行——round2 #2 定稿）——未列键一律消费 return 无 fall-through）

**options 态**：↑↓/Enter/Esc 不变；选中后自由文本态（Custom answer…）自动进入上述光标态。

### 7.3 测试（§5 测试要求——test/tui.test.mjs + key-handler 测试）

- T-Q1 自由文本态光标渲染：answer 中段光标列 = 2 + 前缀后偏移（mock layout/渲染断言）
- T-Q2 ←→/Home/End 移动边界（0 与 len 停——不越界）
- T-Q3 中段插入 + backspace 位置正确（非仅尾删）
- T-Q4 Ctrl+U 清空（cursor 归 0）
- T-Q5 options 态无光标回归（选择标记不变）
- T-Q6 粘贴落 cursor 位置（clipboard 路径）
- T-Q7 Esc/Enter 语义回归（有 options 时 Esc 回 options 态——无 options 中止——round2 #5）
- T-Q8 粘贴含 \n → 空格（单行不变式硬守卫——round2 #2）
- T-Q9 Ctrl+J no-op 吞——不插换行无 fall-through（search 穿透教训回归）
- T-Q10 长答案超宽换行 + cap 滚动（光标随行——round2 #1/#6）
- T-Q11 emoji 中段移动/删除不劈代理对（codepoint——round2 #1）

### 7.4 受影响文件

| 文件 | 变更 |
|---|---|
| `src/tui/layout.mjs` | question 自由文本态 boxLines 光标计算（layoutAnswer——与 layoutInput 同实现：折行/光标 + MAX_INPUT_LINES cap + offset 滚动——输出 questionLayout/questionOffset 供渲染层） |
| `src/tui/render-frame.mjs` | hasOverlay 例外细化——question 自由文本态保留反显 + 硬件定位（box 布局随 questionLayout/questionOffset） |
| `src/tui/render-loop.mjs` | 同上——question 自由文本态 cursorSuffix 正常发 |
| `src/tui/key-modes.mjs`（2026-09-03 D-S4 拆分后 question 模态居此——key-handler 只分派） | 自由文本分支补 ←→/Home/End/Ctrl+U/Backspace 位置感知/中段插入；Esc 语义（Custom 回 options 态——`_backOptions` 备份；无 options 中止）；粘贴/可打印落 cursor（answer codepoint 数组） |
| `src/tui/clipboard.mjs` | insertPastedText question 自由文本分支：粘贴落 cursor + \n/\r 折叠为空格 + \t→2 空格（单行不变式硬守卫——Ctrl+V 与 bracketed paste 共用同一实现） |
| `src/tui/interaction.mjs`（askQuestion 装配——q.cursor 归属处） | q.cursor/answer 初始化（自由文本态进入时 answer=[]、cursor = answer.length——options→Custom 转换时同步初始化） |
| `test/tui.test.mjs` / `test/clipboard.test.mjs` | T-Q1..Q11（§7.3 全量） |
| 本文档 §1.1/§7 | 契约同步 |

（本文档为权威——TUI.md 仅模块地图行引用更新）

### 7.5 §7 round1 评审处置（2026-09-03——1🔴+9 refinement——修订注）

**🔴 #1（用户裁定——picker 期间不接收 Ctrl+I）**：§1.1(4) 模式链已修正（interruptPrompt 移至 picker 栈/wizard 后——TUI.md §3 一致）。

**refinement 处置**：
1. **answer 无 \n 不变式守卫**（#3）：自由文本态下 Ctrl+J/粘贴含 \n —— **strip/替换为空格**（answer 单行不变式硬守卫——layoutAnswer 不处理换行）；长答案超宽（>box 宽）—— **复用 layoutInput 完整换行语义**（弃"单行简化"——layoutAnswer 与 layoutInput 同实现——多行展开 box——光标随行）——T-Q 补长答案用例
2. **q.cursor 按 codepoint**（#9）：answer 存 codepoint 数组（同 state.input 语义——非 UTF-16 串）——emoji 不劈半——←→ 步进 codepoint——T-Q2 补 emoji 用例——提交时 Array.join 还原串
3. **未列键显式吞**（#10）：自由文本态未列键（含 Ctrl+J 等）一律消费 return——无 fall-through 到正常编辑（search 穿透 bug 教训——§3.2 BUG-2）
4. **interaction.mjs 定稿**（#10b）：q.cursor 归属 = askQuestion 装配处（interaction.mjs）——进入自由文本态初始化 cursor = answer.length——options→Custom 转换时同步初始化——移除"自查"占位
5. **行号改符号锚**（#5）：§7.1 差距链定位改符号（layout.mjs 的 question boxLines 分支/render-frame hasOverlay 判定/render-loop cursorSuffix/key-handler question 分支）
6. **key-handler 超限**（#4）：§7 增行使 key-handler（523 行基线）加深超限——记 TODO 拆分（与 index/render-conversation 拆分轮同批评估）
