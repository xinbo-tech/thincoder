# TUI 输入框行为契约

> **本文档是输入框的唯一行为契约。任何对输入框/键处理的修改，先读这里，改完更新这里。**
> 状态：已实现（含 question 自由文本态扩展 2026-09-03/04）。基线 v0.11.1；现文档为当前态，无逐批流水。
> 模块地图（各模块行数/职责）权威 = `TUI.md`；此处只落输入框行为与键处理语义。

## 1. 状态模型（不可破坏的不变量）

1. `state.input` 是字符数组（`string[]`）；`state.cursor` 是整数，恒满足 `0 <= cursor <= input.length`
2. `state.history` 是已提交文本的字符串数组；`historyIndex === -1` 表示不在历史导航中
3. `submit()`：清空 input/cursor → `history.push(text)` → `historyIndex = -1` → `scroll = 0`
4. 模式栈互斥，优先级从高到低：`permission → question → search → picker 栈/wizard → interruptPrompt → 正常输入`。picker 打开期间 Ctrl+I 不接收不处理——picker 吃掉按键（interruptPrompt 在 picker 后）。每个模式处理自己的键后必须 `return`
5. `layoutInput(chars, cursor, width)` 是纯函数：`(chars, cursor, width) → { lines, cursorLine, cursorCol }`，遇 `\n` 强制换行
6. 输入框渲染宽度 = `W - 4`；最多显示 `MAX_INPUT_LINES`（5）行，超出滚动（`inputOffset`）
7. 渲染层是 `renderRows`（row-diff）：每帧全量计算屏幕行 → 与上一帧 diff → 只重写变化行。输入框内容变化靠"行内容不同则重写"，无独立缓存
8. `state.question` **自由文本态**（无 options 或选中 Custom answer…）：`q.answer` 是 codepoint 数组（同 `state.input` 语义——emoji/代理对不劈半），`q.cursor` 是整数且恒满足 `0 <= cursor <= answer.length`（§7.2 契约）；options 态无 answer/cursor 字段（选择标记即反馈——不变量不适用）。提交时 `Array.join` 还原串

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
| ↑ ↓ | 输入历史导航（见 §3） |
| Ctrl+V | 粘贴剪贴板文本（保留 `\n`，支持多行粘贴） |
| Alt+V / Ctrl+Alt+V | 粘贴剪贴板图片 → 插入 `read_image <path>` 命令 |
| Ctrl+F | 进入搜索模式 |
| Ctrl+I / Tab(处理中) | 中断注入模式 |
| PgUp/PgDn | 会话区滚动 |

## 3. 输入历史导航语义（含草稿保护）

- ↑：`historyIndex` 回退，加载历史条目；**首次进入导航前，未提交的输入存入 `state._draft`**
- ↓：`historyIndex` 前进；走到头时**从 `_draft` 恢复原来在打的字**（无草稿则回空白），恢复后清 `_draft`
- 空输入进入导航不存草稿；`submit()` 清 `_draft`
- 处理中（`processing`）：↑↓ 被屏蔽，输入排队进 `state.queue`

## 4. 挂起态输入契约（§17）

> 挂起会话期间（`state.suspended`，AGENT-LOOP.md §17 D-S2/D-S9）输入框放开。挂起决策/队列机制权威 = AGENT-LOOP §17；此处只落输入框侧行为。

- **不变量（F3 铁律）**：`state.input` **永不被后台事件读写**——settle/消化轮/注入全部经独立通道（token/`state.pendingInput`），后台代码零接触输入框；框内文本在后台事件前后逐字不变
- **Enter（非 slash 文本，含 digest 运行中）**：不入 `state.queue`、不打断当前消化轮——消息入 **`state.pendingInput` 队列**（key-handler 分流 + 清框，与 submit 同款清理；history 照常收录），经 `state._suspWake?.()` 唤醒挂起会话循环；纯挂起期立即调度新回合，digest 运行中排队续发（队列非空期间不触发新 auto-turn）
- **斜杠命令**：挂起分流不拦截——走 submit 正常路径（纯挂起期直接执行；digest 中 allowlist 直行/其余入 `state.queue`，会话循环排空）
- **Ctrl+C**：挂起/消化中 = 武装窗口两级中止。语义分两支：
  - **未武装首次按下**：digest/会话内回合处理中仅中止当前回合（`state.controller.abort()`，会话与后台子代理不受影响，回挂起等待）；纯挂起等待期仅提示武装（含运行中数量，不清池）
  - **3s 窗口内再次按下**（`state.suspAbortArmed` + `ctx.suspArmTimer`）才彻底中止：abort 集合 = 链条内全部 controller（`agent._sessionAbortAll`，含旧 controller 下 children）+ `_suspAborted` + 唤醒 driver → 清池 → idle
  - 中止后会话退出复位 `_suspAborted`（池再 live 可重新进入挂起态）；digest 期间排队的 pendingInput 残余转回 `state.queue` 由普通回合续发 + 提示行（不静默丢）
- **Ctrl+I**：仅 digest 处理中有效（`processing && controller`）——立即打断（interruptPrompt，插话语义保留）；纯挂起等待期 Ctrl+I 无动作（Enter 即插话通道）
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
| `src/tui/key-handler.mjs` | 按键总分发：permission/question/search/picker/wizard/interruptPrompt/输入编辑 + §17 挂起态输入 |
| `src/tui/key-modes.mjs` | 模态层（D-S4 自 key-handler 拆出）：permission / question / interruptPrompt 独占模态——激活即消费全部按键；question 自由文本态编辑键（§7） |
| `src/tui/layout.mjs` | layoutInput / layoutAnswer（自由文本态光标行，MAX_INPUT_LINES cap + offset 滚动） |
| `src/tui/clipboard.mjs` | translateShiftEnter（CSI-u / modifyOtherKeys → `\x1b\r`）；insertPastedText 目标路由（主输入 splice / question 落 cursor + 单行守卫 / options 忽略 / 注入框去换行） |
| `src/tui/interaction.mjs` | askQuestion 装配：q.answer codepoint 数组 + q.cursor（options 态无） |
| `src/tui/render-frame.mjs` / `render-loop.mjs` | question 自由文本态光标例外（hasOverlay 细化 / cursorSuffix 正常发） |
| `src/tui/ansi.mjs` | keyboardPush / keyboardPop 序列常量 |
| `src/tui/index.mjs` | state 初始化（含 `_draft`）；stdin 层 translateShiftEnter 接线；启动 keyboardPush / 退出 keyboardPop |
| `test/tui.test.mjs` / `test/clipboard.test.mjs` | 输入框/挂起态/自由文本态测试 |

## 7. question 自由文本输入态：光标与编辑键

> 状态：已实现（D-Q1：`layout.mjs` layoutAnswer + 自由文本编辑键 + `key-modes.mjs` 拆分 D-S4）。主输入框与 question 自由文本框均有光标（视觉反显 + 硬件定位双机制）；question 其余文本面无缺口（wizard 复用 state.input、picker filter 行内输入已有光标）。

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

## 变更记录

- 2026-09-07：格式债清理——批量档案重写为当前态契约文档；历史回归批（BUG-1..8、v0.11.1→HEAD 逐提交审计、多行渲染/图片粘贴诊断、各 fix 修改文件清单、§7 round1 评审处置）折叠为一条注记，现行语义以本文档契约为准，均已实现并测试通过。
- 2026-09-03/04：question 自由文本态光标与编辑键落地（D-Q1 + key-modes 拆分 D-S4）。
- 2026-09-02：§17 挂起态输入契约归属本文档。
- 2026-08-04：多行渲染（BUG-6/7）与图片粘贴死分支（BUG-8）修复。
- 2026-08-03：Shift+Enter 多行拍板；08-04 补 Ctrl+J 后备。
- 历史修复要点（现行态已含于上文 §2-§5）：Ctrl+F 搜索无穿透（兜底 return）、权限 'a' AUTO reminder 注入恢复、Shift+Enter 改键盘协议方案（删 `key.shift` 死分支）、草稿保护（§3）。
