# TUI 设计（thincoder/src/tui/）

> 状态：2026-08 回补。零依赖裸 ANSI 终端界面——不用 ink/React，不用 termbox，直接对 raw-mode stdin 和 ANSI 转义序列编程。
> 设计原则：**纯函数可测**（渲染/布局全部抽成无副作用的纯函数，`test/tui.test.mjs` 直接单测）；**分层**（stdin 解码 / 状态 / 渲染 / 交互 / 命令各自独立模块）。

## 1. 模块地图

> 纪律（2026-08-30）：本表是结构性快照，随实现同步回写——交付新增/改名/删除文件时同批更新本节（eng-coder 交付自查第 6 项）。行数会漂，以下为 2026-08-30 快照，仅供量级参考。

**核心管线**（stdin → 状态 → 渲染 → 回合）：

| 文件 | 行数 | 职责 |
|---|---|---|
| `index.mjs` | 490 | startTUI 入口：raw mode、stdin 分块解码、状态对象（含 subTasks）、cleanup、paste 协议、Shift+Enter 翻译 |
| `key-handler.mjs` | 464 | 按键分发：permission/question/search/picker/wizard/interruptPrompt/输入编辑 |
| `key-handler-search.mjs` | 114 | 搜索模式按键子处理（Ctrl+F 分支拆出） |
| `agent-turn.mjs` | 174 | runAgentTurn：回合驱动（状态复位/runAgent 循环/ContinueError 续跑/中断处理/finally 收尾/队列）；callbacks 装配在 tool-events.mjs |
| `tool-events.mjs` | 344 | 工具事件 → TUI 状态：callbacks 构造 + flushStream（onToolCall 状态栏与标题行、onToolResult done 行与子agent 完成冻结、onToolOutput `_live` 滚动预览/advisor 有序块、onTurnEnd 增量落盘）——2026-08-30 自 agent-turn 拆出满足 500 行硬限 |
| `subagent-blocks.mjs` | 253 | 子agent 活动区块数据层（§7.2 D4 消费端）：前缀/事件 token 正则、`state.subTasks` blocks 缓冲（N2 环形上限 500）、渲染节流（N1，`SUB_RELAY_THROTTLE_MS` 250ms）、`[model]` 元数据记录、routeSub* 路由、finishSubTask + 完成冻结（freezeSubTaskLines/freezeDoneSubTasks/freezeAllSubTasks，2026-08-30 自 agent-turn 归位） |
| `render-frame.mjs` | 333 | 帧布局：header / todo / conversation / input / status 各面板装配 |
| `render-conversation.mjs` | 430 | 对话面板行构建：缓存（含 cap/colorSig 分量）、搜索高亮、表格、折叠装配（六处折叠点的展开态委托 fold-block.mjs，60% 封顶；折叠态委托 renderFoldedHead——统一命名头+tail3；思考阈值 3 行/其他 12 行按颜色分流）、子agent/advisor 折叠块渲染（§7.2 D4）、主输出永不折叠（2026-08-30） |
| `fold-block.mjs` | 168 | 公共折叠组件（2026-08-30 抽出，TUI.md §5 契约）：foldCapRows 60% 封顶、renderExpandedBlock 展开态+底部可达控制行、renderFoldedHead 统一折叠态、renderBlockTimeline、toggleFoldBlock |
| `tool-args.mjs` | 65 | 工具参数可读展示（2026-08-30，对齐 vscode 卡片头）：describeToolArgs 按工具挑关键参数单行摘要——live 标题行（tool-events）与恢复标题行（startup historyToLines）共用；toolArgsLines 全量 JSON dim 行（恢复路径） |
| `fold-block.mjs` | 147 | **公共可折叠区块组件**（2026-08-30）：60% 屏幕展开封顶 + 底部可达折叠控制行、`renderExpandedBlock`/`renderBlockTimeline`/`toggleFoldBlock`/`foldCapRows`——子agent/advisor/长消息/连续 dim 共用；新功能接可折叠输出走此组件（TUI.md §5 约定） |
| `render.mjs` | 242 | 纯函数：字符宽度（CJK/emoji）、wrap、slice、markdown 表格对齐、sanitize |
| `render-loop.mjs` | 110 | 渲染调度：增量重绘、1s ticker、光标/滚动维护 |
| `layout.mjs` | 145 | 面板布局计算（行/列分配，todo 面板含顶部分隔线高度；小终端压缩链：conversation→picker→permission→todo 分隔线；子代理窄带槽与 output 面板槽已随 §7.2 D4/D6 退役） |
| `dims.mjs` | 98 | 终端尺寸单源（2026-08-30，2026-08-31 补 trusted 缩放 settle）：makeDimsState 采样-保持缓存——Windows ConPTY 的 columns/rows 不稳定（启动 falsy、输出活动期报 stale 小值），所有消费方读缓存，采样只发生在事件钩子（启动收敛重试/resize/空闲看门狗/turn-start/turn-finally）；非对称接受：变大立即提交、变小需连续两次确认。**trusted 缩放（`refresh(true)`，resize 事件源）**：缩小 sighting 后 400ms 稳定窗口内值未变即提交——拖拽缩放结束只发一次最终事件，"两连确认"永不满足 → 旧宽度卡住（超宽行软折开面板）；非 resize 采样源维持双确认（ConPTY stale 防御原样保留） |

**渲染内容层**（纯函数）：

| 文件 | 行数 | 职责 |
|---|---|---|
| `markdown.mjs` | 71 | 轻量行内 markdown → ANSI（粗体/下划线/删除线/标题） |
| `math.mjs` | 310 | LaTeX → Unicode 近似（表驱动子集，IK9IXD；单测 `test/math.test.mjs`） |
| `tool-summaries.mjs` | 114 | 工具完成行摘要（done 行首行提取，自 agent-turn 拆出） |

**输入与交互**：

| 文件 | 行数 | 职责 |
|---|---|---|
| `mouse.mjs` | 86 | 鼠标序列解析（SGR 滚轮/点击 → picker 选中、折叠块点击切换） |
| `clipboard.mjs` | 162 | 剪贴板文本/图像读写（Win powershell 强制 UTF-8 / macOS pbpaste）+ `translateShiftEnter` CSI-u→meta+return 翻译 |
| `interaction.mjs` | 96 | 权限确认（y/n/a）、自由提问（question 工具） |
| `pickers.mjs` | 416 | 通用列表选择器（filter/滚动/栈）+ 模型两级选择器 + /provider 流程 |
| `wizard.mjs` | 172 | 首启配置向导（provider → key → embedding → model） |
| `startup.mjs` | 171 | 启动屏 + 会话恢复渲染（historyToLines 从 history 重建——display 快照已废弃，恢复唯一路径；行形态复刻 live：工具参数摘要+全量 JSON、思考单条 C.reason）+ 懒加载历史窗口 + 后台索引 |

**基础设施**：

| 文件 | 行数 | 职责 |
|---|---|---|
| `ansi.mjs` | 47 | ANSI 色板/控制序列；键盘增强协议启停（`keyboardPush`/`keyboardPop`，kitty + modifyOtherKeys） |
| `config-helpers.mjs` | 35 | persistRaw / syncProviderField / maskKey |

**命令层**（`slash-commands.mjs` 187 行：/命令表、别名（/h /x /m /p /t /c /n）、补全、Tab 循环、HANDLERS 分派——每个命令实现独立成 `cmd-*.mjs`）：

| 文件 | 行数 | 职责 |
|---|---|---|
| `cmd-config.mjs` | 332 | /config（含 embedding 三件套落盘，§10.3D） |
| `cmd-advisor.mjs` | 255 | /advisor（评审模型/思考配置 + guard 开关，交互菜单循环） |
| `cmd-mcp.mjs` | 239 | /mcp |
| `cmd-submodel.mjs` | 152 | /submodel（子agent 模型槽位，§8） |
| `cmd-think.mjs` | 139 | /think |
| `cmd-shell.mjs` | 105 | /shell（shell 配置，§8） |
| 其余 cmd-* 与 distill-cmd | <100 | /auto /clear /copy /eng /exit /extract /fold /goal /help /init /model /new /plan /reindex /restore /session /skills /undo /upgrade /distill（distill-cmd.mjs 蒸馏交互引擎） |

## 2. stdin 输入层（index.mjs）

> **行语法单一事实源（2026-08-30，三管道合一）**：对话行有三个生产者——live（`tool-events.mjs` flushStream）、恢复（`startup.mjs` historyToLines）、注入（session/命令）——**全部产出带 `_kind` 类型标记的行**（`"thinking"` / `"text"` / `"tool"` / 无标记=用户消息）。`buildConvLines` 读标记判定折叠行为，不再从颜色猜（颜色降级为纯视觉属性）。这是"恢复体验 = 执行体验"的结构保证：生产端同构后，任何一类内容在三种时刻的形态由同一份判定代码决定，不存在人肉对齐。新增生产者必须打 `_kind` 标记（eng-coder 自查项）。
>
> **逐行对齐契约（2026-08-30 用户 diff 报告驱动）**：同一回合在 live 与 restore 两种管道下渲染**逐行一致**（白名单：done 行 `❯ name — done (耗时)` 为 live 独有——历史不存耗时）。为此统一的点：①工具标题行两态同格式 `❯ name <参数摘要>`；②live onToolCall 落参数全量 JSON dim 行（= restore toolArgsLines）；③live onToolResult 落结果正文 dim 行（= restore 全文）；④live 不再有孤立的行数摘要行。回归 guard：`_live` 滚动行清理必须覆盖全部 `_live` 标记来源。

- `emitKeypressEvents(keyStream)`（node:readline）把原始字节转成 keypress 事件；`keyStream` 是 `process.stdin` 的 PassThrough 副本——**paste 多块数据先写入 keyStream 再交给 readline 解析**，保证按键与粘贴按序到达。
- **分块解码**：`utf8Decoder.decode(chunk, { stream: true })`——CJK 字符跨 chunk 边界时正确拼装（有专门测试）。鼠标序列可能跨 chunk 截断：`mousePending` 保存不完整尾部，下个 chunk 拼接。
- **鼠标滚轮**：SGR 序列 `\x1b[<64;…M`（上 3 行）/`<65`（下 3 行），处理后剥离。
- **鼠标点击**（`mouse.mjs`）：左键按下 `\x1b[<0;col;rowM` → picker 选项点击选中（跳过标题行，按 `_row` 映射 filteredItems）；对话区点击带 `_foldToggle` 的行**折叠/收起切换**（`expandedBlocks` toggle）。消息行点击无动作——行菜单已移除（终端拖选复制是原生能力，菜单是多余中间层）。坐标 1-based、col 在前；release/滚轮不消费。点击映射与渲染共用同一套布局数学（`convGlobalIndex` 与 renderConversation 同式）。
- **粘贴协议**（bracketed paste）：`\x1b[200~` 进入 pasteMode，`\x1b[201~` 退出；跨多 chunk 的粘贴先写前缀 + 进入 paste 模式累积，退出时一次性写入。粘贴文本**跳过按键分发**直接进输入缓冲（`insertPastedText`）。
- **Shift+Enter**（多行输入第一协议，键盘增强终端）：stdin 层 `translateShiftEnter` 把 CSI-u 的 Shift+Enter 序列翻译为 `\x1b\r`（meta+return）→ key-handler 的 `key.alt && key.name === "return"` 分支插入 `\n`。Ctrl+J（`\n` 字节）是第二协议（全终端兜底）；Alt+Enter 是后备（旧控制台可能被系统截走）。
- **state 对象**（渲染全部数据源）：lines / streaming / reasoning / advisorStreaming / input（codepoint 数组）/ cursor / history / scroll / processing / controller / permission / question / picker + pickerStack / wizard / tasks / tokens / search / expandedBlocks / foldEnabled / **exitArmed（Ctrl+C 双确认，IK61BI）** 等。
- **cleanup**（退出路径统一）：saveSession 同步写盘 → closeAllMcp → 终端复位（清屏、mouse/paste/keyboard/modifyOtherKeys off、主缓冲区、显示光标）。`process.on("exit", cleanup)` 注册一次；`/exit` 与 Ctrl+C 最终都走 `process.exit`。

## 3. 按键分发（key-handler.mjs）

**状态优先级**（从高到低，每个状态独占处理并 return）：

```
permission（y/n/a/esc）
  → question（选项 ↑↓/enter/esc，自由文本）
  → search 模式（Ctrl+F 进入：Ctrl+N/P/G/R 导航、esc 退出、字符输入过滤）
  → picker 栈 / wizard（↑↓ 选择、enter 确认、esc 取消）
  → interruptPrompt（Ctrl+I 后输入注入消息）
  → 正常输入编辑（字符/退格/Ctrl+U/Ctrl+V/↑↓历史/多行）
```

**Ctrl+C 三态**（IK61BI）：
1. picker 打开 → 取消当前 picker（等同 Esc），不杀进程
2. processing 且有 controller → `abort()` + "[Aborting…]" 提示，不退出
3. 空闲态 → **双确认**：第一次只提示"Press Ctrl+C again within 3s to exit"并置 `exitArmed`（超时自动解除，可注入 `exitArmDelay`）；窗口内再按才走 cleanup + 延迟退出（`exitTimer`，测试注入大延迟防真退出）

**Ctrl+I 中断注入**：processing 时进入 interruptPrompt 状态，输入消息 Enter 提交 → `controller.abort({ interrupt: true, message })` → agent 循环把 `[User interrupt: …]` 注入历史后重开 controller 续跑（见 AGENT-LOOP.md §中断语义）。

**F1 帮助**、`/` 命令补全提示（status bar live hints）由 slash-commands 提供。

## 4. 渲染管线

**帧装配**（render-frame.mjs `renderFrame`）：
```
header（logo/模型/think 徽章/目录）
todo 面板（task 列表，≤5 行，全部 done 自动收起）
对话面板（renderConversation）
输入框（layoutInput：多行展开、光标定位、粘贴快捷键提示角标）
状态栏（status：模式/耗时/token/上下文利用率/队列/快捷键提示）
```
布局分配见 `layout.mjs computeLayout`（面板高度随内容伸缩；子代理活动现为会话流内可折叠区块——AGENT-LOOP.md §7.2 D4，数据层 `subagent-blocks.mjs`、渲染层 render-conversation.mjs 折叠块段，旧窄带 ≤4 行已退役）。

**对话行构建**（render-conversation.mjs，纯函数）：
```
原始 text
  → highlightSearchMatches（搜索命中：当前项反白、其余黄下划线）
  → sanitizeDisplay（剥 ANSI/控制字符，防网格污染）
  → renderMathInline + renderMarkdownPreservingWidth（数学 Unicode 近似 + **粗体**/`下划线代码`/~~删除线~~/标题，IK5VW3；先 math 后 markdown，§9.1D）
  → formatTables（markdown 表格按显示宽度重排，CJK 对齐）
  → wrapText（按 stringWidth 换行，宽度 = cols-1）
  → 折叠（连续 dim 行 >8 折成 "… N more lines — click to expand"）
```
关键约束：**markdown/math ANSI 在 wrap 之前插入**——但插入的转义序列零显示宽度（`stringWidth` 剥离 ANSI），不参与宽度计算，不破坏对齐。**宽度补偿**：标记（`` ` ``/`**`/`~~`/`$…$`）渲染后消失，含标记的表格行会比 formatTables 计算的列宽短——`renderMarkdownPreservingWidth` 在行尾补空格恢复原宽（竖线对齐）。渲染先于 wrap 执行保证跨 wrap 边界的公式/标记完整转换。窄作用域复位（`22`/`24`/`29` 而非 `0`）保证不冲掉行底色。缓存：`convCacheKey`（lines 长度/最后一行长度/streaming/reasoning 长度 + expandedBlocks 摘要）命中则跳过重建。

## 5. 折叠交互（双向：展开 ↔ 收起）——公共组件 fold-block.mjs

> **组件化（2026-08-30）**：折叠交互统一收敛到公共组件 `src/tui/fold-block.mjs`——任何"流式/超长输出要可折叠"的功能直接复用，不再复制渲染逻辑。API：`foldCapRows`（60% 封顶数学）、`isExpanded`/`toggleFoldBlock`（折叠态读写与双向切换）、`foldHintLine`/`blankLine`（控制行）、`renderExpandedBlock`（展开态渲染 + 封顶 + 底部可达控制行）、`renderFoldedHead`（折叠态渲染：命名头 + tail）、`renderBlockTimeline`（blocks[]→kind 着色时间线，think=C.reason/tool=C.tool/text=C.text/meta=C.dim，`_skipDimFold` 防套叠）。已接入：子agent 区块（运行中/冻结）、advisor 评审块（运行中/冻结）、长消息、连续 dim；鼠标点击 toggle 也走 `toggleFoldBlock` 单源。

**统一折叠形态（2026-08-30 用户裁定："所有折叠区块 = 默认三行 tail，展开封顶 60%"）**：此前折叠态有两套并存——子agent/advisor 用「头部摘要 + tail 3」，长消息/连续 dim 用老的 `[前 4 行, 匿名 ▶, 末 1 行]`；匿名的 `▶ … N more lines` 头在滚动历史里读起来像孤立碎片（用户报告"很多孤立的 ... xx more lines 段"）。现已全部统一为 `renderFoldedHead` 单源：**`▶ <身份标签> · N lines — click to expand` + 末 3 行（dim）**。身份标签按内容分类：`thinking`（思考块）/ `tool output`（dim 与连续 dim）/ 子agent、advisor 用各自既有的括号身份头。旧形态（前 4 行 + 中置 ▶）废弃，FOLD_KEEP 常量已删。

**展开封顶（60% 屏幕，2026-08-30 用户报告驱动）**：此前展开后长度不受限——超长区块展开时折叠控制行被挤出屏幕，点不到、收不回。现在展开态经 `renderExpandedBlock` 统一渲染，**区块总高 ≤ `floor(rows × 0.6)`**（`foldCapRows`）；触顶时截断内容并渲染封顶提示行 `… N more lines — expansion capped at 60% of screen` + **区块底部的第二个 ▼ 控制行**——区块最高只占屏 60%，底部控件必落在视口内，**展开永远可逆**。`maxRows` 由调用链贯穿（render-frame → renderConversation → buildConvLines → 组件；render-loop/key-handler/index 历史分页/mouse 同步传入），省略 = 不封顶（单测/无终端环境）。`convCacheKey` 含 cap 分量——终端 resize 改变封顶行数必须踢缓存。`foldEnabled=false`（/fold off）时控制行与封顶一并消失（toggle 无效时提示会撒谎，索性不渲染）。

**折叠对象**（要求 `foldEnabled !== false` 且 key 不在 `expandedBlocks`；**2026-08-30 用户裁定：主输出永不折叠**——会话核心内容由滚动阅读，折叠会把真正的回答藏在点击之后；思考/工具摘要才是辅助流，保留折叠）：
1. **长消息折叠**：思考（C.reason）**无条件折叠**（2026-08-30 最终裁定：行数阈值两轮死于真机——80 列下真实中文思考 wrap 5~10 行够不着 12；宽屏 200 列下只 wrap 1~3 行够不着 3；字符阈值也漏掉典型句——**"阈值"思路整体废弃，思考是过程内容，一律收进命名头**）；工具摘要（C.dim）等 >12 行折叠（`LONG_FOLD_LINES`）；key = `long-{lines 索引}`。**主输出（C.text）与用户消息不参与**——`foldable = l.color !== C.text` 直接全量渲染
2. **连续 dim 块折叠**：连续 dim 行 >8 → 同样折叠为统一形态；key = `fold-{n}`

**标志（哪里可折叠一眼可见）**：
- 折叠控制行**不缩进、与输出内容平齐**；**空行分隔仅展开态使用**（▼ 控制行位于块头，**行前空一行**与其他内容区分；折叠态 ▶ 头**不空行**——fold-block.mjs `blankLine` 注释）
- **折叠态（全类型统一）**：**头部身份行 + 末 3 行**——`▶ <身份> · N lines — click to expand`（bold cyan + `▶` + "click to expand" 下划线）+ dim 的 tail 3 行（`renderFoldedHead` 单源；子agent/advisor 头部各自带状态摘要：`[✓ coder#1 · model · done 45s]`、`[advisor · review done]`）
- **展开态**：**同一位置**（块头部、内容之前）换成 `▼ … N lines — click to collapse`（bold cyan + `▼` 图标 + "click to collapse" 下划线）——收起标志贴着内容开头，不沉到尾部；**触 60% 封顶时区块底部追加第二个控制行**（唯一保证可达的收起入口）

**动作（点击即切换）**：点击任意带 `_foldToggle` 的行（头部 ▶/▼ 提示）→ `toggleFoldBlock`（expandedBlocks **toggle**：有则删=收起、无则加=展开）→ 重渲染。折叠/收起标志**始终在块头部同一位置**——状态切换点稳定，`▶`/`▼` + 下划线文案给出"可点击"的视觉暗示。

**折叠无例外（2026-08-30 用户裁定，废除"完成自动展开"）**：思考块在 flushStream 完成**瞬间即折叠**（命名头 + tail 3，点击展开 ≤60%）——与恢复路径完全同构。旧设计"完成瞬间保持展开、下一轮输入收起"（`_autoExpand` 簿记）是被否掉的预折叠方案的遗留，主输出免折叠后已无存在理由，连根删除（flushStream 簿记 + runAgentTurn 清理 + state 字段）。主输出永不折叠、无需簿记。

**流式过程同框（2026-08-30 用户裁定："思考过程中为什么不是直接进这个框"）**：思考的 **live 流式缓冲**（`state.reasoning`）不再平铺全屏刷——渲染为**同一只折叠框**（key=`thinking-live`）：默认 `▶ thinking · N lines` + tail 3，点击展开 = 60% 封顶的实时视图（token 持续进入时框内内容实时增长，`convCacheKey` 的 `state.reasoning.length` 分量驱动实时重绘）；flush 后块重挂到 `long-{idx}`，形态完全一致、无缝衔接。live 与完成态与恢复态三态同构，无一例外。

**空行分区（2026-08-30 追加，两处规则并存）**：
- **主输出前后空行**（§5 之外的独立规则，render-conversation `buildConvLines` 行循环 + streaming 分支）：每个主输出段（C.text 行连续段）**前后各插一个空行**，与思考块/工具块/子agent 块拉开距离。渲染期插入（不写 `state.lines`、不影响 convCacheKey）；相邻段共享一个空行（无双重插入）；**streaming 分支同样适用**（两条渲染路径必须一致——首版只改行循环漏了 streaming，用户实测"生成时不空、落盘后才空"）
- **任务面板顶部分隔线**（renderTodo 首行 `─` × cols-1，dim）：todo 面板与上方会话区域切分；小终端压缩链中**分隔线先让位**（面板高度压回任务行数，任务行永不压缩——put 按面板高度截断自动丢弃分隔线）
- **子agent 运行区块段首分隔线**（render-conversation subagent blocks 段首，同款 dim `─` 线，2026-08-30 用户要求）：与会话区切分；仅当存在**运行中**区块时出现（done 块已冻结进会话流，空段不留悬空线）。与主输出空行的边界：主输出段末空行是呼吸空间，分隔线是段边界——**两者并存**（线无条件，仅防重复画线）

**约束**：
- 展开的块行带 `_skipDimFold` 标记，不再参与连续 dim 折叠（防折叠套折叠——0.12.7 回归修复；renderBlockTimeline 统一携带）
- **历史上"主输出/思考永不折叠"的约束的完整演进**：0.12.7 曾以"仅 dim 可折叠"临时修复单向折叠时代的问题；双向折叠落地后曾重新放开主输出折叠（"主输出/思考是折叠主力"）；**2026-08-30 用户裁定主输出永久免折叠**（辅助流保留）——最终形态：思考/dim 双向折叠 + 主输出始终全量渲染。缓存键相应增加颜色类别签名（colorSig）：折叠决策按颜色分类，仅颜色不同的两个状态不得共享缓存条目
- `/fold off` 时两类折叠与全部提示行不出现；`/fold on` 恢复
- 展开态与折叠态切换由 `convCacheKey` 的 expandedBlocks 摘要 + cap 分量 + **颜色类别签名（colorSig）** 驱动缓存失效
- **新功能接入约定**：凡是"超长输出想可折叠"，用 fold-block.mjs 的组件拼装（renderBlockTimeline + renderFoldedHead + renderExpandedBlock + toggleFoldBlock），不要自带展开/折叠渲染——封顶、可达性与统一形态保证只在组件里有

**组件 cols 纪律（2026-08-30 窄屏事故，教训级）**：`renderExpandedBlock`/`renderFoldedHead`/`renderBlockTimeline` 的 `cols` 是**必传语义参数**（签名默认 80 只是测试兜底）——**漏传 = 全部生成行按 80 列 wrap，输入框却是全宽**（同帧宽度分裂，280 列终端上表现为"生成中左边一小块"）。已发生 3 处漏传（工具块展开/折叠、thinking 折叠）。任何新增组件调用**必须显式传 cols**；排障口诀：**同帧内 A 面板正常 B 面板异常 → 先查 A/B 的输入参数差异，别先怀疑 B 的内部逻辑或环境**。

**折叠 key 稳定化（2026-08-30）**：工具块的 fold key 用行级 `_lineId`（state 自增计数器，pushLine/historyToLines/loadOlder 统一分配）派生（`tool-{lineId}`）——`loadOlder` 头部 unshift 会使位置键 `tool-{i}` 整体平移，已展开状态会错绑到别的块。

**组件解耦**：fold-block 不 import 任何业务常量（advisor 占位符经 `strip: []` 参数注入）；tail-3 提取单源 `foldTailLines(blocks, n, {strip})`（原 render-conversation 三份手写拷贝收编）。

**渲染调度**（render-loop.mjs）：`scheduleRender()`（setImmediate 合并）+ 处理中 1s ticker（耗时刷新）+ `write()` 增量写（比较上一帧，只重绘变化行 + 光标定位），防闪烁。

**宽度数学**（render.mjs）：charWidth——CJK/emoji/全角 2 列、组合字符/零宽 0、其余 1；wrap/slice/pad 全部按显示宽度而非字符数。

## 6. 会话恢复（startup.mjs）

优先级：`display` 快照（WYSIWYG，恢复原样）> `history` 重建（user/assistant 逐条渲染，工具结果只显示首行摘要）。**恢复渲染过滤 `[System reminder:` 前缀的机读消息**（人读线本来就不含，过滤是纵深防御）；markdown 表格/行内渲染同样生效。恢复后提示 `/new` 开新会话；多槽位提示 `/session`。

## 7. 回合驱动（agent-turn.mjs）

`runAgentTurn(ctx, text)`：
1. pushLabel "❯ You:" + 输入文本
2. 置 processing、新建 AbortController、1s ticker
3. callbacks 构造（`tool-events.mjs buildToolCallbacks`：onToken/onReasoning 流式进 streaming/reasoning 缓冲；子代理 `role#id/` 前缀分流到子 agent 活动区块 `state.subTasks`（§7.2 D4 会话流内可折叠块）；onToolCall/onToolResult 工具摘要行；onUsage 累计 token；onCompress 提示 "[context] Context too long, auto-compacted"）
4. runAgent 循环：正常完成 → flushStream；AbortError（Ctrl+I）→ 重开 controller 续跑；ContinueError → permission 询问 "Continue after N turns?"；其他错误 → "[error] …" 一行
5. finally：停 ticker、清 processing、**自动生成会话标题**（首条真实 user 消息 → generateTitle）、saveSession 增量落盘
6. 队列：processing 期间输入的消息进 `state.queue`，回合结束自动逐条处理（斜杠命令直接执行）

## 8. 交互层与命令层

- **interaction.mjs**：`askPermission(name, args)`（y/n/a；a = 批准并开启 AUTO）、`askQuestion(text, options)`（选项列表 ↑↓ 或自由文本）——agent 工具（permission/question）与 TUI 的桥。
- **slash-commands.mjs**：`SLASH_COMMANDS` 表 + `SLASH_ALIASES`（/h /x /m /p /t /c /n）+ `HANDLERS` 分派；`completions(input)` 按命令/参数补全；Tab 循环候选。命令分两类：**即时反馈**（/plan /auto /fold 等本地状态切换）与 **菜单循环**（/config /think /mcp /provider 等 picker 驱动）。
- **/submodel 命令**（cmd-submodel.mjs）：子 agent 模型设置入口——与 `/model`（主会话模型）对称。**按类型分别配置**：4 种子 agent 类型（explore / plan / coder / eng-coder）各有独立配置项。**picker 菜单导航**（无参时）：菜单列出全局 + 4 类型共 5 个槽位（各显示当前生效值与继承来源）——选中槽位进入二级选择：provider 列表 → 模型列表（复用两级模型选择器，选中写入该槽位而非主会话），另提供快捷项（设为父模型 / 清除该槽位 / 全部清除）。**参数直设快捷路径**保留：`/submodel <type> <value>` / `/submodel <value>`（全局）/ `/submodel <type>`（查看）/ `/submodel reset [type]`；参数三态与 subagent 工具 `model` 参数同构：`provider:model`（跨 provider）/ `provider` 名（其配置模型）/ `model` 名（父 provider 换模型）。持久化到 `config.agent.subagentModel`（全局）与 `config.agent.subagentModels[role]`（类型级），立即生效。**优先级链**：subagent 工具 `model` 参数 > 类型级 `subagentModels[role]` > 全局 `subagentModel` > 继承父 provider（`resolveChildProvider` 单一解析源）。Tab 补全 provider 名 + 类型名。实现注记：`openModelPicker` 绑定主会话状态不可直接复用——pickers 需新增"选中写入指定槽位"的参数化变体（复用 provider/模型列表构建与两级交互）。设计决策：**独立命令而非扩展 /model**——/model 语义是主会话 provider 切换，混入子模型会混淆；子 agent 模型是高频习惯性操作，picker 与直参双通道（图形导航 + 快捷输入）。
- **/shell 命令**（cmd-shell.mjs）：bash 工具 shell 配置入口。**配置字段**：`config.shell`（字符串路径/命令名，null = 系统默认——Windows 用 cmd、其他平台 /bin/sh）。**Windows 编码策略**：未配置 shell（cmd）时每条命令自动前缀 `chcp 65001 >nul && `——子进程独立无副作用，cmd 的 GBK 输出不再乱码（UTF-8 解码器 + chcp 强制 UTF-8 代码页）；配置了 shell（git-bash/pwsh）时其原生输出即 UTF-8，无需前缀。**picker 菜单导航**（无参时）：按平台给出常用选项 + **可用性检测**（检测不到的自动隐藏）——Windows：System default(cmd+UTF-8) / pwsh / Git Bash（existsSync 常见安装路径）/ WSL bash / Custom path…；Linux 与 macOS：System default(/bin/sh) / bash / zsh / fish / Custom path…（同一候选集，检测后按实际安装显示）。检测方式：`spawnSync` 跑 `where <name>`（win）/ `command -v <name>`（posix），非零退出即隐藏（静默）。Custom path… 走 askQuestion 输入任意路径。**直参快捷路径保留**：`/shell <path|name>`（设置，引号自动剥离）/ `/shell reset`（恢复默认，大小写不敏感）。**生效**：立即生效（bash 工具每次调用实时读 `agent.config.shell`），`persistRaw` 持久化。VS Code 扩展共享同一 config.json 字段。**决策**：平台感知 picker——用户按平台选常用 shell 免记路径（修正早期"不做 picker"决策：shell 虽多为路径，但常用候选有限且平台差异大，检测后选择比记忆路径可靠）；直参与 custom 保留任意路径灵活性。

- **wizard.mjs**：首启无 key 时进入——provider 选择（含自定义端点）→ API key → embedding key（可跳过）→ 模型；Esc 可随时跳过。
- **pickers.mjs**：通用选择器（标题/条目/filter 输入/位置指示/↑ more ↓ more/栈式嵌套）；模型选择器两级（provider → model，可 fetch `/models` 拉取真实列表，失败回退预设）；`/provider` 添加/删除/设 key 的问答流程。

## 9. 关键设计决策

| 决策 | 理由 |
|---|---|
| 纯函数渲染 | 无终端也能全量单测（tui.test.mjs 1470 行 + math/subagent-blocks 等专项测试） |
| stdin 双层（keyStream + paste 累积） | 粘贴与按键保序，bracketed paste 大文本不丢 |
| Ctrl+C 永不直接杀进程 | 防误触（双确认）+ picker/生成语义分层（IK61BI） |
| markdown/math 渲染在 wrap 之前、宽度补偿保对齐 | ANSI 零显示宽度不干扰宽度数学；行尾补空格恢复原宽；跨 wrap 边界的标记/公式完整转换；窄复位不清行色（IK5VW3） |
| /submodel 独立命令而非扩展现有 /model | /model 语义是主会话 provider 切换；子 agent 模型是高频操作，picker 导航 + 参数直设双通道 |
| 子 agent 模型按类型分别配置（subagentModels[role]） | 4 种 role（explore/plan/coder/eng-coder）用途差异大——搜索用便宜模型、规划/实现用好模型；全局 subagentModel 保留为兜底（向后兼容）；优先级：工具参数 > 类型级 > 全局 > 继承父 |
| /submodel picker 选中写入槽位（不复用 openModelPicker） | openModelPicker 绑定主会话状态（改 activeProvider/activeModel）；子模型选择需"选中即写指定槽位"的参数化变体——复用 provider/模型列表构建与两级交互，仅回调目标不同 |
| /shell 平台感知 picker（按平台列常用选项 + 可用性检测） | 用户按平台选常用 shell 免记路径（修正早期"不做 picker"决策）；常用候选有限、平台差异大，检测后选择比记忆路径可靠；直参与 Custom path 保留任意路径灵活性 |
| 恢复优先 display 快照 | WYSIWYG 保真；history 重建是降级路径 |
| 恢复过滤 [System reminder: | 机读消息不显示（与 VS Code 渲染契约一致） |
| 增量渲染 + 缓存键 | 1M 行会话不卡：只重绘变化行 |
| 子代理流 `role#id/` 前缀 | 主/子流共用一套回调，按前缀分流到子 agent 活动区块（§7.2 D4：会话流内可折叠块；数据层独立为 subagent-blocks.mjs） |


## 10. Issue 变更段（2026-08-22 · 需求层）

> 来源：Gitee #IK9IXD / #IK9UWM、GitHub thincoder#1。三层面按板块同文档：需求层 + 设计层 + 测试层齐备。

### 10.1 IK9IXD · 数学公式渲染（Unicode 近似）

**总体需求**：CLI TUI 显示模型回答中的数学公式时，把 LaTeX 源码（行内 `$...$`、块级 `$$...$$`）转换为 Unicode 近似可读形式，消除 `\frac`/`\sum` 源码噪声——覆盖工程数学常见子集（issue 截图为 WLS 数据整定公式，行内+块级混合）。

**功能性需求**：
- F1 行内公式近似显示：`$x_i$`→xᵢ、`$\hat{x}_i$`→x̂ᵢ、`$\sigma_i$`→σᵢ，中文解释段落中的变量引用直接可读。
- F2 块级公式近似显示：`\min_{\hat{x}} \sum_i \left(\frac{\hat{x}_i-x_i}{\sigma_i}\right)^2 \ \text{s.t.} \ f(\hat{x})=0` 类公式转换后整体可读（不再显示原始 `\frac{...}{...}`）；无 `\\` 的块级输出单行近似，含 `\\` 的按行近似保留多行。
- F3 转换子集（设计层给 token 表）：`\frac{a}{b}`→(a)/(b)、`\sum_i`→∑ᵢ、`\prod`→∏、`\hat{x}`→x̂、`\bar{x}`→x̄、`\sqrt{x}`→√(x)、希腊字母直映、`_x`→ₓ、`^2`→²、`\min`/`\max`/`\text{}`→对应文本、`\left(`/`\right)`→()、`\quad`→空格、`\pm`/`\times`/`\cdot`/`\le`/`\ge`/`\ne`/`\approx`/`\in` 等常见算符直映。
- **范围边界**：仅显示层转换、不改语义；不认识的 LaTeX 结构**原样显示**；不做多行 unicodeart 排版（路线 B 已否决）；扩展端（webview/katex）不在本轮。

**非功能性需求**：
- NF1 流式安全：未闭合的 `$` 保持原样（与 markdown.mjs 现有策略一致），只转换完整闭合的公式。
- NF2 性能：行级渲染热路径 O(n) 单遍；无正则回溯爆炸；`convCacheKey` 缓存语义不变。
- NF3 零依赖：自写表驱动转换器，不引第三方 LaTeX 库。
- NF4 宽度正确：转换结果按显示宽度参与计算；组合字符（x̂ = x + U+0302）宽计 1——若 `stringWidth` 对组合字符计算有误需一并修正；表格对齐不破坏。

### 10.2 IK9UWM · Windows 中文粘贴乱码

**总体需求**：Windows 下 Ctrl+V 粘贴中文正确显示。根因已实测验证：`readClipboardText` 调 `powershell Get-Clipboard`，PowerShell 按 `[Console]::OutputEncoding`（中文系统 GBK/936）编码 stdout、node 按 UTF-8 解码 → 乱码。本机 65001 代码页读测正常，反证机制在代码页边界。

**功能性需求**：
- F1 Windows 中文用户 Ctrl+V 粘贴的中文在输入框正确显示。
- F2 修复：Windows 分支强制 UTF-8 输出——`powershell -NoProfile -Command "[Console]::OutputEncoding=[Text.Encoding]::UTF8; Get-Clipboard"`。
- **范围边界**：仅修 Ctrl+V 文本读取路径；bracketed paste（终端直传 UTF-8）、macOS/Linux 分支、剪贴板图片路径均不动。

**非功能性需求**：
- NF1 兼容：任意系统代码页（936/65001）输出稳定 UTF-8；65001 系统行为不变。
- NF2 无额外进程开销（同一 powershell 调用内完成）；失败仍返回空串（现状语义不变）。

### 10.3 GitHub thincoder#1 · embedding 配置三件套落盘

**总体需求**：CLI `/config` 保存 embedding key 时 baseURL/model 一并落盘，两端读同一 config.json 判定一致。现状：CLI 只落 apiKey（`cmd-config.mjs` setEmbedKey），baseURL/model 靠 `DEFAULTS.embedding` 内存兜底；扩展 `embed-config.mjs` 要求文件里三件套齐全 → 扩展判定"未配置"，用户需两端各配一遍。

**功能性需求**：
- F1 用户在 CLI 配置 embedding key 后，VS Code 扩展读同一 config.json 即启用向量检索，不重复配置。
- F2 修复：`setEmbedKey` 的 persistRaw 补写 baseURL/model——已有值保留；缺省时取自 `config.mjs` 的 `DEFAULTS.embedding`（**引用，不硬编码字面量**）。
- F3 存量兼容：config.json 仅含 apiKey 的存量配置，用户在 CLI 再次保存 embedding 设置时自动补齐（本次不动扩展端读取判定）。
- **范围边界**：仅改 CLI 落盘逻辑；扩展端三件套判定保留不动。

**非功能性需求**：
- NF1 默认值单一来源（`DEFAULTS.embedding`），杜绝两端字面量漂移。

### 10.1D · 设计层（公式渲染）

**方案选型**：自写表驱动 Unicode 转换器，挂现有 markdown 渲染管线（路线 A）。否决项：完整 LaTeX 解析器（零依赖约束冲突 + 范围失控）、多行 unicodeart 排版（路线 B：与行式渲染模型冲突，render.mjs 按行做宽度数学，多行公式块需新块类型，收益边际）。

**架构与接口**：
- 新增 `src/tui/math.mjs`（纯函数、零依赖、无 ANSI 输出）：
  - `renderMathInline(line)`：转换单行内**闭合**的 `$...$` 段（不跨行）
  - `renderMathBlock(text)`：转换**闭合**的 `$$...$$` 段（无 `\\` → 单行近似输出；含 `\\` → 每行独立近似、保留多行）
  - `convertFormula(src)`：token 表驱动的子集转换器（导出供单测）
- 管线挂钩（单一挂钩点，与 `renderMarkdownPreservingWidth` 同层、位于 `formatTables`/`wrapText` **之前**）：`render-conversation.mjs` 的 `renderMarkdownPreservingWidth(sanitizeDisplay(text))` 改为 `renderMarkdownPreservingWidth(renderMathInline(renderMathBlock(sanitizeDisplay(text))))`——**行内与块级都在此一处调用**（renderMathBlock 处理跨行闭合的 `$$...$$`，renderMathInline 只匹配不成对 `$$` 的单 `$`）。**先 math 后 markdown**——math 把 `$...$`/`$$...$$` 视为不透明段（内部不跑 markdown，避免 `x**2` 被误判粗体），转换输出为纯 Unicode；未转换的原样段继续走 markdown。math 先于 wrap 执行保证跨 wrap 边界的公式也能完整转换。
- 行内代码段规则：**反引号内不做数学转换**（代码是字面量）——与 markdown.mjs 的 code-span 不透明策略一致（先按反引号切段，奇数段为代码原样跳过）。
- 流式安全：未闭合的 `$`/`$$` 原样保留（与 markdown.mjs 未闭合标记策略一致）；只转换完整闭合对。
- 宽度：转换输出（x̂ = x+U+0302 等组合字符）由现有 `charWidth` 正确计宽（U+0300-036F 已计 0，NF4 满足，render.mjs 无需改动）；转换后文本再进 `formatTables`/`wrapText` 按显示宽度测量。**T12 机制**：math 先于 formatTables 执行 → 表格列宽按转换后文本测量，无需补偿；`renderMarkdownPreservingWidth` 的行尾补空格只针对 markdown 标记（`` ` ``/`**`/`~~`），与 math 无关。

**token 表**（`convertFormula` 子集，表驱动、按序匹配）：
- 二参数：`\frac{a}{b}`→`(a)/(b)`；一参数：`\sqrt{x}`→`√(x)`、`\text{...}`→内容原样、`\hat{x}`→`x̂`（追加 U+0302）、`\bar{x}`→`x̄`（U+0304）、`\vec{x}`→`x⃗`（U+20D7）
- 命令直映：`\sum`→∑、`\prod`→∏、`\int`→∫、`\min`/`\max`/`\log`/`\ln`/`\exp`/`\lim`→同文本、`\left(`/`\right)`→()、`\quad`→两空格、`\qquad`→四空格、`\,`/`\;`→空格
- 算符直映：`\pm`→±、`\mp`→∓、`\times`→×、`\cdot`→·、`\div`→÷、`\le`→≤、`\ge`→≥、`\ne`→≠、`\approx`→≈、`\equiv`→≡、`\propto`→∝、`\in`→∈、`\notin`→∉、`\infty`→∞、`\to`/`\rightarrow`→→、`\partial`→∂、`\nabla`→∇、`\forall`→∀、`\exists`→∃、`\cdots`→⋯、`\ldots`→…
- 希腊字母：`\alpha`…`\omega`（小写+大写）直映
- 上下标：`_x`→ₓ、`^2`→²（单字符用 Unicode 上下标字符；多字符 `_{ab}`→`_(ab)`、`^{ab}`→`^(ab)`；无对应 Unicode 字符的保留括号形式）
- `\\`（块级内）→保留换行语义（块级近似输出按 `\\` 分行，每行独立近似后保留为多行——仅块级）
- **不认识的命令原样保留**（含反斜杠与参数）

**受影响文件**：新增 `src/tui/math.mjs`、新增 `test/math.test.mjs`、修改 `src/tui/render-conversation.mjs`（挂钩点一处）。

**关键决策**：路线 A（否决 B）；先 math 后 markdown；子集表驱动（新 token 不碰管线）；块级 `\\` 保留多行（不做整块压成一行——多约束方程组逐行近似可读性更高）。

**测试用例表**（映射 F1/F2/F3 + NF1/NF4）：

| # | 输入 | 预期输出 | 对应需求 |
|---|---|---|---|
| T1 | `$x_i$` | `xᵢ` | F1 |
| T2 | `$\hat{x}_i$` | `x̂ᵢ` | F1 |
| T3 | `$\sigma_i$` | `σᵢ` | F1 |
| T4 | `$$\min_{\hat{x}} \sum_i \left(\frac{\hat{x}_i-x_i}{\sigma_i}\right)^2$$` | `min_(x̂) ∑ᵢ ((x̂ᵢ-xᵢ)/(σᵢ))²` | F2 |
| T5 | `\text{s.t.} \quad f(\hat{x})=0` | `s.t.  f(x̂)=0` | F3 |
| T6 | 未闭合 `$x_i`（流式中途） | 原样 `$x_i` | NF1 |
| T7 | `$$` 只有开头无结尾 | 原样 | NF1 |
| T8 | `\begin{matrix}…\end{matrix}` | 原样 | F3 边界 |
| T9 | `\frac{\frac{a}{b}}{c}`（嵌套） | `((a)/(b))/(c)` | F3 |
| T10 | 空串 / 只有 `$$$` | 空串 / 原样 | 错误条件 |
| T11 | `stringWidth(转换结果)` | 与显示宽度一致（x̂ᵢ=2、σᵢ=2） | NF4 |
| T12 | 表格内行含 `$x_i$` | 转换后 formatTables 对齐不破（列宽按转换后文本测量，见 9.1D 宽度条） | NF4 |
| T13 | 块级含 `\\`：`$$\min_{\hat{x}} \sum_i (…) \\ \text{s.t.} \ f(\hat{x})=0$$` | 输出两行近似（`\\` 处分行，每行独立近似） | F2 |
| T14 | 反引号代码段 `` `$x_i$` `` 内的公式 | 不转换，原样保留（code-span 不透明） | 边界 |

### 10.2D · 设计层（中文粘贴乱码）

**方案**：Windows 分支 PowerShell 命令强制 UTF-8 输出，命令构造抽为纯函数便于单测。GBK(936) 机器是本 bug 的唯一复现环境（本机 65001 无法复现），故修复正确性由**命令级单测锁定**（断言 UTF-8 前缀存在）+ 本机行为不变回归验证。

**接口**：
- `clipboard.mjs` 新增导出 `buildWindowsClipboardCommand()` → `["-NoProfile", "-Command", "[Console]::OutputEncoding=[Text.Encoding]::UTF8; Get-Clipboard"]`
- `readClipboardText` Windows 分支改为 `execFile("powershell", buildWindowsClipboardCommand(), { timeout: 5000 }, …)`——execFile 默认 utf8 解码不变，管道输出现在恒为 UTF-8 字节；返回值统一 strip 前导 `\uFEFF`（PowerShell 输出 BOM 防御，936 机器首次冒烟时验证）

**受影响文件**：修改 `src/tui/clipboard.mjs`、`test/tui.test.mjs`（追加 describe）。

**关键决策**：命令前缀而非 `-EncodedCommand`/WScript 等重实现——最小 diff、同一次进程调用、PowerShell 2.0 起 `OutputEncoding` 赋值均可用。

**测试用例表**：

| # | 输入 | 预期输出 | 对应需求 |
|---|---|---|---|
| T1 | 调用 `buildWindowsClipboardCommand()` | 数组含 `[Console]::OutputEncoding=[Text.Encoding]::UTF8; Get-Clipboard` 完整命令 | F2 |
| T2 | 现有 `insertPastedText` 单测全过 | 回归无破坏 | 范围边界 |
| T3 | 本机（65001）手动 Ctrl+V 粘贴中文 | 输入框显示正确（行为不变验证） | NF1 |
| T4 | mock execFile 失败（powershell 不存在/非零退出） | `readClipboardText` 返回 `""`，不抛出 | NF2 |

### 10.3D · 设计层（embedding 三件套落盘）

**方案**：
- `config.mjs`：`const DEFAULTS`（line 39）→ `export const DEFAULTS`
- `cmd-config.mjs` `setEmbedKey` 的 persistRaw 改为：
  ```js
  const { DEFAULTS } = await import("../config.mjs")
  raw.embedding = {
    ...(raw.embedding ?? {}),
    apiKey: embKey,
    baseURL: raw.embedding?.baseURL ?? DEFAULTS.embedding.baseURL,
    model: raw.embedding?.model ?? DEFAULTS.embedding.model,
  }
  ```
- 运行时内存侧 `agent.config.embedding` 已由 `loadConfig` 的 `{...DEFAULTS.embedding, ...config.embedding}` 兜底补齐，无需改动；扩展端 `embed-config.mjs` 判定不动（F3 存量：用户在 CLI 再次保存即补齐三件套）。

**受影响文件**：修改 `src/config.mjs`（export 一词）、`src/tui/cmd-config.mjs`（persistRaw 块）。

**关键决策**：引用 `DEFAULTS.embedding` 而非字面量（NF1 单一来源）；保留已有自定义值（Ollama/本地 embedding 用户不受影响）；不动扩展端（最小变更面）。

**测试用例表**：

| # | 输入 | 预期输出 | 对应需求 |
|---|---|---|---|
| T1 | 空 config：保存 key "K" | raw.embedding = { apiKey:"K", baseURL: DEFAULTS 值, model: DEFAULTS 值 } | F2 |
| T2 | 已有自定义 baseURL/model（Ollama）再保存 key | 原 baseURL/model 保留，apiKey 更新 | F2 |
| T3 | raw.embedding 为 undefined | 三件套齐（与 T1 同） | F2 |
| T4 | 仅 apiKey 的存量 config 再保存 | 补齐 baseURL/model | F3 |
| T5 | 回归：现有 /config 相关测试全过 | 无破坏 | 范围边界 |
### 10.4 · 子agent/advisor 显示使用的模型（2026-08-26 · 需求层）

**总体需求**：TUI 会话界面展示子 agent（subagent/escalate/consult）与 advisor 实际使用的模型——两端对称交付（2026-08-23：CLI CHANGELOG 0.12.41 / vscode CHANGELOG 0.1.46）。CLI 侧已实现；本文档补记（此功能此前仅记于 CHANGELOG 与 commit，未入文档地图——2026-08-26 审计补录欠账）。

**功能性需求**：
- F1 子 agent 块 header 显示 `[role · model]`（`render-frame.mjs`）。
- F2 advisor 状态栏 `advisor review (round N · model)` 与工具标题 `(round N · model)` 显示实际模型（`agent-turn.mjs`）。
- **范围边界**：仅显示层；模型解析单一来源（`resolveAdvisorProvider` / `resolveChildProvider`）不改。

**非功能性需求**：
- NF1 `[model]` 元数据 token 解析后剥离，不得污染内容流（`agent-turn.mjs`）。
- NF2 无模型时优雅降级——header 显示 `[role]`，无 `· model` 后缀。

### 10.4D · 设计层（子agent/advisor 模型显示）

**机制**（已实现，验收勾销 2026-08-23；机制定位随 §7.2 D4 实现拆分更新 2026-08-30）：
- **发射**：`spawn-child.mjs` `makeRelay`（subagent/escalate/consult 共用生成管线）在子流首 token 附带 `[model]<name>` 前缀（仅当实际模型非 undefined 时），配 relay 前缀 `role#id/`。
- **解析**：`subagent-blocks.mjs` `SUB_PREFIX_RE`（`^([\w-]+)#(\d+)/`）分割子流；`[model]` 前缀由 `routeSubToken` 存入 `state.subTasks[key].model` 并从内容剥离（NF1）。§7.2 D4 前解析在 agent-turn.mjs 内联，窄带退役时随实现拆出。
- **渲染**：`render-conversation.mjs` 子agent 折叠块头部拼接 `[role · model]`（运行态与冻结态同 key）；advisor 不走 token——TUI 直接 `resolveAdvisorProvider(agent).model`（`tool-events.mjs` `onToolCall` 时解析一次，状态栏与内联标题共用）。§7.2 D4 前在 render-frame.mjs `renderSubagent`（已随窄带退役删除）。
- **ACP 例外**：`acp/bridge.mjs` onToken 剥离 `[model]` token（`[\w-]+#\d+/\[model\]` 正则，同行亦剥 `⟦ev⟧` 事件 token）——ACP 会话不承载 TUI 展示，属 ACP 线契约。

**关键决策**：vscode 走结构化消息字段（`toolPanel.model`），CLI 走 `[model]` token——两端渲染架构不同（TUI 可直访 agent 对象，webview 仅收 postMessage），各取所需；决策统一记录在 vscode `ARCHITECTURE.md` 变更段（本文件不复制）。

**测试现状**（更新于 2026-08-30）：`[model]` 解析剥离已有自动化测试锁定——`test/subagent-blocks.test.mjs`（[model] 只记录一次、后续 [model] 开头内容不吞）+ `test/agent-turn.test.mjs` 端到端多处；原 2026-08-26 审计发现的零锁定遗留项已在 docs/TODO.md 销账。

**测试用例表**（本次补记不新增代码；若后续补测试按此契约）：

| # | 输入 | 预期输出 | 对应需求 |
|---|---|---|---|
| T1 | 子流首 token `role#1/[model]deepseek-v4 内容` | `state.subTasks[key].model === "deepseek-v4"`，内容无 `[model]` 前缀 | F1 / NF1 |
| T2 | 子流无 `[model]` token | `model` 为 undefined，header 显示 `[role]` | F2 / NF2 |
| T3 | advisor 调用进行中 | 状态栏显示 `advisor review (round N · 实际模型)` | F2 |