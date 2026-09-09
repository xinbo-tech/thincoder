# TUI 设计（thincoder/src/tui/）

> 板块：TUI（权威源——渲染/折叠/输入/恢复/回合驱动/命令层的 CLI 终端界面设计）。
> 状态：**当前态**（2026-09-07 格式债批 A 重写为人类可读；零依赖裸 ANSI 终端界面——不用
> ink/React、不用 termbox，直接对 raw-mode stdin 与 ANSI 转义序列编程）。
> 设计原则：**纯函数可测**（渲染/布局全部抽成无副作用的纯函数）；**分层**（stdin 解码 / 状态 /
> 渲染 / 交互 / 命令各自独立模块）。

> 关联文档：`AGENT-LOOP.md`（子代理工具族 §7.2、async 生命周期 §7.3、挂起会话 §9、任务调度
> 与排队 §10/§10.3、async advisor §11.2；权威源接管点 §17——显示层/区块/折叠语义归本文件）、
> `TUI-INPUT-BOX.md`（question 自由文本态 §7 权威）、
> `TUI-TOOL-OUTPUT.md`（普通工具行间区块权威）、`SESSION.md`（会话/恢复契约）、`MCP.md` §5/§8
> （/mcp 字段表单）、`CONTEXT-COMPACTION.md` §8/§8.3（TUI 压缩面板）。本文档不复制上述权威内容，只做显示层
> 机制与指针。

## 1. 模块地图（结构性快照）

纪律（2026-08-30）：本表是**结构性快照**，随实现同步回写——交付新增/改名/删除文件时同批
更新本节（eng-coder 交付自查第 6 项）。行数列为 2026-09-09 实测（INPUT-LOCK-ASYNC 批回写 + INPUT-LOCK-BEHAVIOR-REVISED 批回写），
仅供量级参考（会漂）。

### 核心管线（stdin → 状态 → 渲染 → 回合）

| 文件 | 行数 | 职责 |
|---|---|---|
| `index.mjs` | 448 | startTUI 入口：raw mode、keyStream + readline、分块解码（utf8Decoder stream:true + mousePending）、粘贴协议、Shift+Enter 翻译、resize、state 对象、pushLine/pushLabel、提交（busy 吞防御——busy 全拒——白名单已删——INPUT-LOCK-BEHAVIOR-REVISED）、行缓冲裁剪；装配归位（D-S1）：createMouseDispatch / createLoadOlder / update-notice（re-export） |
| `tui-lifecycle.mjs` | 75 | TUI 生命周期终端序列（2026-08-31 自 index 拆出）：writeStartupSequence（alt buffer + 光标 + 鼠标/粘贴/键盘增强 + **DECRST 7 禁环绕**）、writeCleanupSequence（恢复 DECSET 7 等）、createExitCleanup（退出闭包）、setTuiActive |
| `update-notice.mjs` | 77 | 后台升级提示（2026-09-03 D-S1c 自 index 拆出）：upgradeFailureText / pendingNoticeReady 纯函数（index re-export）+ createUpdateNotice（提示 picker + 启动检查装配） |
| `key-handler.mjs` | 440 | 按键分发：模态入口（permission/question/search/picker/wizard/interruptPrompt）+ 输入编辑；**busy 门禁**（INPUT-LOCK——提交吞——斜杠同禁发——空 Enter 静默）；挂起空闲 Enter → pendingInput 单槽+唤醒（槽满吞）；Ctrl+C 分支（picker 取消/武装/挂起两级/首按停回合/空闲双确认）；convMaxScroll 导出 |
| `key-handler-search.mjs` | 114 | 搜索模式按键子处理（Ctrl+F 分支，2026-08-30 拆出） |
| `key-modes.mjs` | 216 | 按键模态层（2026-09-03 D-S4 自 key-handler 拆出）：permission / question / interruptPrompt 独占模态 handler——模态激活即消费全部按键（返回 true，未激活 false）；ctx 注入 state/agent/pushLine/render |
| `agent-turn.mjs` | 323 | runAgentTurn（`{ autoTurn, skipSession }`）回合驱动器：状态复位 / runAgent 循环（flushStream、AbortError 中断区分、ContinueError）/ finally 收尾（冻结决策、sweep、标题、落盘）/ 交接消息单条续发（state.queue 残项单容器——INPUT-LOCK）；LOGGING turn 包装；挂起会话段迁 suspension-drive.mjs（函数级静态环互相 import——回合尾进入驱动器、驱动器内回合递归本文件） |
| `suspension-drive.mjs` | 297 | 挂起会话驱动器（2026-09-05 split：agent-turn 535>500——driver 族 verbatim 迁入；2026-09-09 INPUT-LOCK：R15 攒批删+单槽消费+残余单消息化——净减）——状态机行表见 AGENT-LOOP.md §9.2 |
| `tool-events.mjs` | 401 | 工具事件 → TUI 状态：buildToolCallbacks + flushStream、`_toolBlock` 载体生命周期（onToolCall 开 / onToolResult 定态 / onToolOutput 追加 + advisor 有序块）、onCompress*/onTaskUpdate/onTurnEnd 落盘；权限/批权限/问答按 ctx 条件接线（auto-turn null → denied）；finishSubTaskKey；slimToolResultForDisplay |
| `tool-display.mjs` | 143 | 工具块显示/计时/清扫 helper 族（2026-09-05 module-split：tool-events 537 > 500——_toolTicks/_subActions 计时表、sweepToolBlocks、settle/slim/async 探测/find 等 verbatim 迁入；模块级可变对象导出 + re-export sweepToolBlocks 保 agent-turn 消费面） |
| `subagent-blocks.mjs` | 457 | 子 agent 区块数据层：SUB_EVENT_RE 路由（settled/stopped/queued/cancelled + ⟦ev⟧async 置位与 _pendingAsyncKeys 兜底）、finishSubTask/Key、trimSubTree（N2 树级环）、SUB_RELAY_THROTTLE_MS=250、SUBAGENT_ROLES、parseRelayPath（R23）；冻结族迁 subagent-freeze.mjs |
| `subagent-freeze.mjs` | 173 | 子 agent 完成/冻结族（2026-09-05 split：subagent-blocks 625 > 500）：freezeSubTaskLines/freezeDoneSubTasks/freezeAllSubTasks/freezeReclaimDigestedBlocks + syncPanelSnapshot（§19.6 D-P1 面板镜像——刷 agent._panelSnapshot 供 action:"panel" 读）——verbatim 迁入 + re-export |
| `subagent-children.mjs` | 177 | 嵌套子代理子块载体数据层（R23 嵌套子代理子块方案）：ensureSubChild/descendSubChild/appendSubChild（任意 inner 深度）、树级 trim（trimSubTree 后序丢行——子块输出先丢、外层叙述保留）、closeSubChild、closeOpenSubChildren（外层冻结定格 stopped）、SUB_BLOCK_LINE_LIMIT/appendSubBlock 迁移至此（re-export 保 import 面） |
| `render-frame.mjs` | 376 | 帧布局装配：header / conversation / subagent 面板 / todo / input / status 各面板（行由 layout 预计算直接 put）；renderHeader（logo+版本+模型+think 徽章+cwd）；状态栏 busy 文案（INPUT-LOCK——主会话处理中——queue 提示已撤）；question 自由文本态光标例外（TUI-INPUT-BOX.md §7.2） |
| `render-conversation.mjs` | 425 | 对话面板行构建（纯函数）：三层缓存（convCacheKey 全量 / 行级 wrapRowsCached / 段级 _lineSegCache——2026-09-03 D-S2 后只管普通源行段，tool/frozenSub/frozenAdvisor 三段随实现迁 render-segments.mjs 各带独立 WeakMap）；搜索高亮、折叠装配（六处折叠点）、主输出前后空行、连续 dim 折叠；convViewport 视口数学单源导出 |
| `render-segments.mjs` | 183 | 对话行三类特殊段渲染（2026-09-03 D-S2 自 render-conversation 拆出）：tool 块 / frozenSubTask / frozenAdvisor——段渲染 + sig 分支 + 独立 WeakMap 段缓存三段合一（toolSeg/frozenSubSeg/frozenAdvSeg）；buildConvLines 主循环只留 ~3 行分支调用；R23 冻结载体尾部挂 renderSubChildSections |
| `fold-block.mjs` | 257 | 公共折叠组件（2026-08-30）：foldCapRows（60%）、isExpanded/toggleFoldBlock、renderFoldedHead、renderExpandedBlock（窗口 + 底部收起）、renderBlockTimeline、foldTailLines、scrollFoldBlock、renderMathAndMarkdown——消费方：长消息/连续 dim/子 agent/advisor/工具块 |
| `subagent-panel.mjs` | 195 | 运行中子 agent 固定底部面板渲染（中立模块——layout 预计算高度与 render-frame put 共用，避免循环依赖）：renderSubagentPanel 纯函数（顶部分隔线 + 驻留区块折叠头 + tail 3 / 展开窗口）；renderSubChildSections/subChildFoldKey（R23 子块段——面板与冻结渲染共用导出） |
| `tool-args.mjs` | 80 | 工具参数可读展示（2026-08-30，对齐 vscode 卡片头）：describeToolArgs 按工具挑关键参数单行摘要——live 标题行（tool-events）与恢复标题行（startup historyToLines）共用；toolArgsLines 全量 JSON dim 行（恢复路径） |
| `render.mjs` | 253 | 纯函数：字符宽度（CJK/emoji/组合字符）、wrap、slice、markdown 表格对齐、sanitize |
| `render-loop.mjs` | 129 | 渲染调度：整帧 recompute + 行 diff（只重绘变化行）+ 光标定位，防闪烁；MIN_RENDER_INTERVAL_MS 16ms 节流；每帧 write 包 wrapOff/wrapOn（Ambiguous 防线②）——1s ticker 在 agent-turn.mjs（含 subRunning() 驱动面板 elapsed 走秒） |
| `layout.mjs` | 226 | 面板布局计算（行/列分配；运行中区块 → panels.subagent 槽 + subagentLines 预计算）；小终端压缩链（subagent 面板最先让位 → conversation → picker → permission → todo 分隔线）；question 自由文本态 boxLines = layoutAnswer（layoutInput 同实现 + MAX_INPUT_LINES cap + offset 滚动）；queue 面板槽已撤（INPUT-LOCK F-7） |
| `dims.mjs` | 47 | 终端尺寸单源：get() 读缓存；refresh() 只在事件钩子（启动 seed/resize），sane-gate（cols≥40/rows≥10）挡 falsy（headless/无 TTY），任何 sane 采样（含缩小）立即提交；2026-08-31 简化——ConPTY stale 假说防御（双确认/trusted settle/看门狗）整体移除：误诊根因是 fold-block 组件漏传 cols=80，且双确认反而卡死真实拖拽缩小 |

### 渲染内容层

| 文件 | 行数 | 职责 |
|---|---|---|
| `markdown.mjs` | 71 | 轻量行内 markdown → ANSI（粗体/下划线/删除线/标题）；code-span 不透明（反引号段原样） |
| `math.mjs` | 310 | LaTeX → Unicode 近似（表驱动子集转换器 convertFormula/renderMathInline/renderMathBlock——零依赖零 ANSI，纯函数导出供单测） |
| `tool-summaries.mjs` | 114 | 工具完成行摘要（formatToolSummary——verify/bash/advisor/read/write/grep/glob 特化 + 首行兜底，自 agent-turn 拆出） |

### 输入与交互

| 文件 | 行数 | 职责 |
|---|---|---|
| `mouse.mjs` | 213 | SGR 鼠标序列解析（滚轮/左键点击）；handleWheel（展开块内容行块内滚动 ±3 + 穿出语义）；点击命中（picker 选项/折叠块 toggle/展开窗 ▲▼ 翻窗/⏹ 列级 cancel）；convGlobalIndex 与渲染同式；**createMouseDispatch 装配簇（2026-09-03 D-S1a 自 index 迁入：cancelSubagent/onMouseClick/mouseCtx——依赖 cancelAsyncSubagent/cancelAsyncAdvisor，tui→core 无环）** |
| `clipboard.mjs` | 175 | 剪贴板文本/图像读写（Win powershell 强制 UTF-8 / macOS pbpaste / Linux xclip）+ translateShiftEnter（CSI-u → meta+return）+ stripKeyboardProtocol；insertPastedText 目标路由（question 自由文本落 cursor + \r\n→空格单行守卫、options 忽略、注入框去换行、主输入光标 splice——TUI-INPUT-BOX.md §7.2） |
| `interaction.mjs` | 134 | 权限确认（y/n/a；batch a/o/n；continue y/n）、自由提问（question 工具：选项 ↑↓ / Esc 转自由文本——QUESTION_CUSTOM sentinel）；askQuestion 装配 q.answer codepoint 数组 + q.cursor；permission 内容预览（bash 危险命令 ⚠️ 标注、write/edit 内容预览） |
| `pickers.mjs` | 500 | 通用列表选择器（标题/条目/filter/栈式嵌套）+ 模型两级选择器（provider → model，可 fetch /models、失败回退预设）+ /provider Add/Remove/key 流程（Custom API format 走 picker 枚举——openai/anthropic/google 默认 0——D-C1）+ pickModelForSlot（子模型槽位） |
| `wizard.mjs` | 208 | 首启配置向导：provider 菜单（existing/preset/custom）——preset 声明字段（format/thinking/reasoningEffort/maxTokens/chatPath）随 item 直达落盘（无 format 提问步但字段不丢——与 picker preset 路径同构）；Custom 文本步 name→baseURL→model→**format（D-C2，默认 openai）**→key→embedkey → 落盘 → 模型选择；Esc 全步可跳无半配置 |
| `startup.mjs` | 266 | 启动屏 + 会话恢复（historyToLines 从 history 重建——**display 快照已废弃，恢复唯一路径**；行形态复刻 live：工具参数摘要 + 全量 JSON dim 行 + 思考单条 C.reason）+ 懒加载历史窗口（restoreLines / createLoadOlder——2026-09-03 D-S1b 归属修复，index 只留调用）+ 后台索引 backgroundIndex + 崩溃提示（R25 crashNotice） |

### 基础设施

| 文件 | 行数 | 职责 |
|---|---|---|
| `ansi.mjs` | 49 | ANSI 色板/控制序列；键盘增强协议启停（keyboardPush/keyboardPop——kitty + modifyOtherKeys）；DECRST/DECSET 7（wrapOff/wrapOn）等 |
| `config-helpers.mjs` | 47 | persistRaw（writeConfigAtomic 收口——mtime 门控 + 并发冲突 throw）/ syncProviderField（磁盘单字段补丁 + 内存镜像）/ maskKey |

### 命令层

`slash-commands.mjs`（187 行）：SLASH_COMMANDS 表 + SLASH_ALIASES（/h /x /m /p /t /c /n）+ HANDLERS 分派（handler 异常统一拦截成 [error] 行）+ completions/Tab 循环。每个命令实现独立成 `cmd-*.mjs`：

| 文件 | 行数 | 职责 |
|---|---|---|
| `cmd-config.mjs` | 393 | /config（embedding 三件套落盘——引用 DEFAULTS.embedding 不硬编码；代理/轮次/阈值等菜单循环） |
| `cmd-mcp.mjs` | 395 | /mcp（MCP.md §5/§8 权威：edit/test 子命令、token 一等字段、探活确认环）——字段表单在 `cmd-mcp-form.mjs` |
| `cmd-mcp-form.mjs` | 198 | MCP edit/add 统一字段 picker 表单机制（MCP.md §8.3：fieldPicker 循环——字段行 + `✓ Save & test` 末行；`k=` 删除语义合并入 mergeKeyValuePairs；maskToken 迁移落点） |
| `cmd-advisor.mjs` | 255 | /advisor（评审模型/思考配置 + guard 开关，交互菜单循环） |
| `cmd-submodel.mjs` | 152 | /submodel（子 agent 模型槽位，§9） |
| `cmd-think.mjs` | 139 | /think（思考模式/effort 枚举——specForModel 动态枚举，不硬编码） |
| `cmd-shell.mjs` | 105 | /shell（shell 配置，§9） |
| `cmd-session.mjs` | 103 | /session 列表/切换 + /rename |
| 其余单命令小件 | 各 10–101 | /auto /clear /copy /eng(101) /exit /extract /fold /goal /help /init /model /new /plan /reindex /restore /skills /undo /upgrade；`distill-cmd.mjs`（47 行）蒸馏交互引擎（/extract 入口调用 runDistill） |

## 2. stdin 输入层（index.mjs）

- **keyStream 双流**：`emitKeypressEvents(keyStream)`（node:readline）把原始字节转 keypress 事件；
  `keyStream` 是 `process.stdin` 的 PassThrough 副本——**paste 多块数据先写入 keyStream 再交给
  readline 解析**，保证按键与粘贴按序到达。鼠标序列先在 data 层拦截剥离，碎片不落输入框。
- **分块解码**：`utf8Decoder.decode(chunk, { stream: true })`——CJK 字符跨 chunk 边界时正确拼装。
  鼠标序列可能跨 chunk 截断：`mousePending` 保存不完整尾部，下个 chunk 拼接。
- **鼠标滚轮**：SGR 序列 `\x1b[<64;…M`（上 3 行）/`<65`（下 3 行），坐标命中展开块内容行 →
  块内滚动（handleWheel，§6）；未命中 → 会话滚动（scroll ±3，到顶触发 loadOlder，回底恢复
  _followTail）。点击序列解析见 mouse.mjs。
- **鼠标点击**：左键按下 `\x1b[<0;col;rowM` → picker 选项点击选中（跳过标题行，按 `_row` 映射
  filteredItems）；对话区/面板点击带 `_foldToggle` 的行折叠/展开切换、▲▼ 控制行翻窗、子 agent
  面板头 ⏹ 标记列点击 = cancel（§6）。消息行点击无动作——**行菜单已移除**（终端拖选复制是原生
  能力，菜单是多余中间层）。坐标 1-based、col 在前；release/滚轮不消费。点击映射与渲染共用同一
  套布局数学（convGlobalIndex 与 renderConversation 同式 + convViewport）。
- **粘贴协议**（bracketed paste）：`\x1b[200~` 进入 pasteMode，`\x1b[201~` 退出；跨多 chunk 的
  粘贴先写前缀 + 累积，退出时一次性写入。粘贴文本**跳过按键分发**直接进输入缓冲
  （`insertPastedText`）。
- **Shift+Enter**（多行输入第一协议，键盘增强终端）：stdin 层 `translateShiftEnter` 把 CSI-u
  的 Shift+Enter 序列翻译为 `\x1b\r`（meta+return）→ key-handler 的 `key.alt && key.name ===
  "return"` 分支插入 `\n`。启动同时启用双协议（kitty push `\x1b[>1u` + modifyOtherKeys lvl 2
  `\x1b[>4;2m`——不支持的终端自动忽略）；Ctrl+J（`\n` 字节）是第二协议（全终端兜底）；Alt+Enter
  是后备（旧控制台可能被系统截走）。
- **state 对象**（渲染全部数据源）：lines / streaming / reasoning / _advisorBlocks / input
  （codepoint 数组）/ cursor / history / scroll / _foldScroll / _followTail / processing /
  controller / permission / question / picker + pickerStack / wizard / tasks / dims / tokens /
  ctxCache / search / expandedBlocks / foldEnabled / exitArmed / suspAbortArmed / _lineIdCounter /
  subTasks / queue / interruptPrompt / pendingNotice / pendingInput / _history* 等。
- **cleanup**（退出路径统一）：saveSession 同步写盘 → closeAllMcp → 终端复位（alt buffer 退出、
  mouse/paste/keyboard/modifyOtherKeys off、wrapOn、主缓冲区、显示光标）。`process.on("exit",
  cleanup)` 注册一次；`/exit` 与 Ctrl+C 双确认最终都走 `process.exit`（exitTimer 延迟可注入防真
  退出）。
- **行缓冲裁剪**：lines 超 5000 时裁掉头部 1000 行并插入裁剪标记行（freeze 锚点
  shiftFreezeAnchors 整体前移——净位移校正，防池空补发冻结落点漂移）。

## 3. 行语法与逐行对齐（_kind 单一事实源）

**行语法单一事实源（2026-08-30，三管道合一）**：对话行有三个生产者——live（`tool-events.mjs`
flushStream）、恢复（`startup.mjs` historyToLines）、注入（session/命令 pushLine）——**全部产出
带 `_kind` 类型标记的行**：`"thinking"`（思考）/ `"text"`（主文本）/ `"tool"`（工具载体）/ 无
标记 = 用户消息与标签行。`buildConvLines` 读标记判定折叠行为，不再从颜色猜（颜色降级为纯视觉
属性；旧无标记行的颜色启发式仅作兼容兜底路径保留）。这是"恢复体验 = 执行体验"的结构保证：生产
端同构后，任何一类内容在三种时刻的形态由同一份判定代码决定，不存在人肉对齐。**新增生产者必须
打 `_kind` 标记**（eng-coder 自查项）。

**逐行对齐契约（2026-08-30 用户 diff 报告驱动）**：同一回合在 live 与 restore 两种管道下渲染
**逐行一致**（白名单：done 行 `❯ name — done (耗时)` 为 live 独有——历史不存耗时——恢复管道
无此行，其完成态状态词回落 "done"）。为此统一的点：

1. 工具标题行两态同格式 `❯ name <参数摘要>`（describeToolArgs 单源；工具载体同字段 →
   同一渲染路径——line-level parity by construction）；
2. live onToolCall 落参数全量 JSON dim 行（= restore toolArgsLines）；
3. live onToolResult 落结果正文 dim 行（= restore 全文；slimToolResultForDisplay 两管道共享）；
4. live 不再有孤立的行数摘要行。

回归 guard：工具载体的计时（_toolTicks/_subActions，tool-display.mjs）与中断清扫
（sweepToolBlocks）覆盖全部工具载体来源。

flushStream（live 生产者）：思考/流式正文在工具调用前或回合收尾 flush 成行——思考推
`pushLine(text, C.reason, "thinking")`、正文推 `pushLine(text, C.text, "text")`；思考块**flush
完成瞬间即折叠**（§6 折叠无例外）。恢复生产者：思考单条 C.reason 行、用户文本 `_kind:"text"`、
工具调用重建 `_kind:"tool"` 的 `_toolBlock` 载体（参数摘要 + argsJson + 结果全文 + done:true）。

## 4. 按键分发与中断（key-handler.mjs / key-modes.mjs）

**状态优先级**（从高到低，每个状态独占处理并 return）：

```
permission（y/n/a/esc；batch a/o/n；continue y/n）
→ question（选项 ↑↓/enter/esc，自由文本——key-modes）
→ search 模式（Ctrl+F 进入：Ctrl+N/P/G/R 导航、esc 退出、字符输入过滤）
→ picker 栈 / wizard（↑↓ 选择、enter 确认、esc 取消）
→ interruptPrompt（Ctrl+I 后输入注入消息）
→ 正常输入编辑（字符/退格/Ctrl+U/Ctrl+V/↑↓历史/多行）
```

模态分支（key-modes.mjs）：permission/question/interruptPrompt 激活时**消费全部按键**（含未匹
配键——不落入下层编辑路径）；搜索模态另居 key-handler-search.mjs。**busy 门禁**（INPUT-LOCK-ASYNC
C'——2026-09-09 + INPUT-LOCK-BEHAVIOR-REVISED——2026-09-09 修订：processing 含 digest 单一判
据）：输入不禁——打字照常进输入框回显（吞提交不吞字符——评审 #2 (i)）；Enter 提交吞 + busy
提示（"主会话处理中"——状态栏/提示行）——**斜杠命令同禁发**（白名单机制已删——/exit 也发不
出——退出靠 Ctrl+C 终端层武装通道——门禁前不误伤）；空 Enter 静默（text 非空才吞——不刷屏）。
Ctrl+D 与排队面板随机制废弃删除。**挂起空闲**（AGENT-LOOP §9——busy 之外）Enter（非 slash）→
pendingInput **单槽**（至多一条待交接——
槽满吞 + 提示）+ 唤醒（`_suspWake`，不打断后台——输入框零干扰 F3）；释放窗口（`_suspPending`）
期间同语义。F1 帮助与 `/` 补全提示（status bar live hints）由 slash-commands 提供。

### Ctrl+C 分支（IK61BI + 挂起态 + processing 武装化——三态武装一致）

1. **picker 打开 → 取消当前 picker**（等同 Esc，popPicker），不杀进程（武装窗口让位——3s 窗内
   再开 picker 的场景极窄）。
2. **武装窗口内二按（状态路由前统一检查 `suspAbortArmed`——跨态桥接）→ 显式全停（D-C4 /abort
   语义）**：两次按下之间状态会迁移（首按停回合 → 释放窗口/挂起会话启动），只查挂起分支会让
   非挂起 processing 首按后的二按落入空闲退出分支。全停 = 当前回合平 abort（无 interrupt——走
   agent.mjs 回合收尾清池分支）+ abort 集合 = 链条内全部 controller（`agent._sessionAbortAll`，
   含 Ctrl+I/ContinueError 重建的旧 controller——children 不逃逸）+ **挂起态才置 `_suspAborted`**
   + 唤醒 driver（收尾清池）；**非挂起语境不置**（粘滞会阻塞未来挂起会话重入）。无目标可停
   （无 processing/无 abort 集合/未挂起）→ 不吞键、落空放行到下方分支（防误导文案——停回合后
   连按退出的第二次按下不被空转吞掉，退出保持 3 按）。
3. **挂起态（`state.suspended`）→ 武装窗口两级中止**：
   - 未武装 + 有回合在跑（digest/会话内回合）：仅中止当前回合 `abort({ interrupt: true })`（无
     message）——interrupt 排除 agent.mjs 清池分支（aborted && !interrupt → 无条件清空
     `_asyncSubagents`）——后台池保留，回挂起等待；
   - 未武装 + 纯挂起等待：仅提示不清池（提示含运行中数量）；
   - 武装 3s 窗口内再按 → 上方统一全停（二按语义不变）。
   提示：`[stopped current turn — press Ctrl+C again within 3s to abort all background
   subagents]` / `[abort] Press Ctrl+C again within 3s to abort all background subagents (N
   running)`。
4. **processing（非挂起）→ 武装窗口两级中止（2026-09-03 紧急修复）**：曾无武装窗口、
   首按直接平 abort → 命中 agent.mjs 清池分支一次误杀全部后台子代理（用户两次实测被坑）。
   现首按 = `abort({ interrupt: true })`（无 message——停当前回合不续跑）+ 提示（同上）+ 武装 3s
   （`suspAbortArmed` + `suspArmTimer`，`ctx.exitArmDelay ?? 3000` 过期自动复位）；窗口内再按 →
   上方统一全停。
5. **空闲态 → 双确认**：第一次只提示 `[exit] Press Ctrl+C again within 3s to exit` 并置
   `exitArmed`（超时自动解除，可注入 exitArmDelay；回合启动即清除 exitArmed 防跨回合残留）；
   窗口内再按才走 cleanup + 延迟退出（exitTimer，测试注入大延迟防真退出）。

### Ctrl+I 中断注入

processing 时进入 interruptPrompt 状态，输入消息 Enter 提交 → `controller.abort({ interrupt:
true, message })` → agent 循环把 `[User interrupt: …]` 注入历史后**重开 controller 续跑**（见
AGENT-LOOP.md 中断语义）。**interrupt 区分（agent-turn.mjs）**：有 message（Ctrl+I）= 重建
controller 续跑；**无 message（Ctrl+C 首按停回合）= 不续跑 break**——agent.mjs 中断三段对
message 存在性无守卫（无 message 会落 "[User interrupt: undefined]" 垃圾上下文）——回合层回滚
尾部垃圾（D-C2——agent.mjs 零改动；partial 输出不回滚——interrupt 家族"提交部分输出"语义）。

## 5. 渲染管线（帧装配 / 布局 / 对话行构建）

**帧装配**（render-frame.mjs）：

```
header（logo/版本/模型/think 徽章/cwd）
对话面板（renderConversation）
子 agent 面板（运行中/排队 waiting 区块，会话与 todo 之间——AGENT-LOOP §10/§10.3：running ∪ queued 非空即渲染）
todo 面板（task 列表，≤5 行，全部 done 自动收起）
输入框（layoutInput：多行展开、光标定位、粘贴快捷键提示角标）
状态栏（模式/耗时/token/上下文利用率/busy 提示（INPUT-LOCK——主会话处理中）/快捷键提示）
```

布局分配见 `layout.mjs computeLayout`：面板高度随内容伸缩；**运行中子 agent 活动为固定底部
面板**——位于会话区与 todo 之间，高度完全自适应（= 全部运行中区块的渲染行数，会话区被挤小），
不随会话滚动（滚轮/PgUp/流式均不影响面板位置）；完成后立即冻结进会话流（`_frozenSubTask` 折叠
块，历史可读）；无驻留区块时面板不渲染（无悬空分隔线）。**小终端压缩链**：subagent 面板最先让
位（可至 0 隐藏——数据保留在缓冲区）→ conversation → picker → permission → todo 分隔线
（任务行永不压缩）。

**对话行构建管道**（render-conversation.mjs buildConvLines，纯函数）：

```
原始 text → highlightSearchMatches（搜索命中：当前项反白、其余黄下划线）
→ sanitizeDisplay（剥 ANSI/控制字符，防网格污染）
→ renderMathInline + renderMathBlock + markdown（renderMathAndMarkdown——数学 Unicode 近似 +
   粗体/下划线代码/删除线/标题；先 math 后 markdown——math 把 $…$ 视为不透明段、转换输出纯
   Unicode 不喂给 markdown）
→ formatTables（markdown 表格按显示宽度重排，CJK 对齐）
→ wrapText（按 stringWidth 换行，宽度 = cols-1）
→ 折叠（判定与装配见 §6）
```

特殊段（行对象载体分支互斥 if）：`_frozenSubTask` → frozenSubSeg、`_toolBlock` → toolSeg、
`_frozenAdvisor` → frozenAdvSeg（render-segments.mjs）——工具块"一次调用一个载体"（2026-08-30
用户裁定）：头 = 工具名+参数摘要+状态（running / 耗时·摘要 / done），体 = 参数 JSON + 输出 +
结果全文；普通工具行间区块的完整语义以 `TUI-TOOL-OUTPUT.md` 为权威，本文件不复制。

关键约束：

- **markdown/math ANSI 在 wrap 之前插入**——插入的转义序列零显示宽度（stringWidth 剥离 ANSI），
  不参与宽度计算，不破坏对齐。
- **宽度补偿**：标记（`` ` ``/`**`/`~~`）渲染后消失，含标记的表格行会比 formatTables 计算的
  列宽短——`renderMarkdownPreservingWidth` 在行尾补空格恢复原宽（竖线对齐）。math 先于
  formatTables 执行 → 表格列宽按转换后文本测量，无需补偿（T12）。
- 渲染先于 wrap 执行保证跨 wrap 边界的公式/标记完整转换。窄作用域复位（`22`/`24`/`29` 而非
  `0`）保证不冲掉行底色。
- 缓存：`convCacheKey`（lines 长度/末行长度/streaming/reasoning 长度 + _advisorBlocks 摘要 +
  frozen 载体签名 + 工具块缓冲签名 + **colorSig** + foldEnabled/expandedBlocks 摘要 + cap 分量 +
  search 状态 + _foldScroll 分量）命中则跳过重建；运行中区块已迁固定面板——子 agent 活动不再
  失效会话缓存（每子 token 重建正是懒加载优化要消灭的）。
- **Ambiguous 宽度低估 + DECAWM 防线（2026-08-31 会诊）**：`—`(U+2014)、`│`(U+2502)、`●`(U+25CF)、
  `▸`(U+25B8)、`…`(U+2026)、`↑↓`(U+2191/2193) 属东亚 Ambiguous 宽度——charWidth 按 1 格算，但
  中文 locale 终端实际渲染 2 格 → 行宽低估 → 行实际超宽 → 物理 wrap 污染下一行 + `\x1b[K` 清错
  行 → picker 残影。**三层防御**：① 启动禁环绕（tui-lifecycle writeStartupSequence 的 DECRST 7）
  + 每帧 write 包 wrapOff/wrapOn（render-loop）——超宽行硬截断在边距，物理 wrap 不可能发生；退出
  writeCleanupSequence 恢复 DECSET 7。② renderPicker 行与标题行右边距留 8 格余量。③ cmd-session
  的标签截断改显示宽度（原按 UTF-16 length 截 40 = 中文 80 格，顶到边距）。
- **渲染调度**（render-loop.mjs）：`scheduleRender()`（setImmediate 合并 + 16ms 节流）+ 整帧
  recompute 后行 diff（`rows[i] !== prevRows[i]` 只重绘变化行 + 光标定位），防闪烁。1s ticker 在
  agent-turn.mjs（处理中耗时刷新，含 `subRunning()` 条件驱动子 agent 面板 elapsed 走秒）。
- **宽度数学**（render.mjs）：charWidth——CJK/emoji/全角 2 列、组合字符/零宽 0、其余 1；
  wrap/slice/pad 全部按显示宽度而非字符数。

## 6. 折叠与区块交互（fold-block.mjs / 子 agent 面板）

**组件化（2026-08-30）**：折叠交互统一收敛到公共组件 `src/tui/fold-block.mjs`——任何"流式/超长
输出要可折叠"的功能直接复用，不再复制渲染逻辑。API：`foldCapRows`（60% 封顶数学）、
`isExpanded`/`toggleFoldBlock`（折叠态读写与双向切换——收起时同步清 `_foldScroll` 残留）、
`foldHintLine`/`blankLine`（控制行）、`renderExpandedBlock`（展开态渲染 + 封顶窗口 + 底部可达
控制行）、`renderFoldedHead`（折叠态渲染：命名头 + tail）、`renderBlockTimeline`（blocks[]→kind
着色时间线：think=C.reason/tool=C.tool/text=C.text/meta=C.dim——`_skipDimFold` 防套叠）、
`foldTailLines`（tail-3 提取单源——原 render-conversation 三份手写拷贝收编）、
`scrollFoldBlock`/`foldScrollOffset`（块内滚动）。已接入：子 agent 区块（运行中固定面板 /
冻结流内）、advisor 块（运行中/冻结）、工具块、长消息、连续 dim；鼠标点击 toggle 也走
`toggleFoldBlock` 单源。**新功能接入约定**：凡是"超长输出想可折叠"，用 fold-block 组件拼装
（renderBlockTimeline + renderFoldedHead + renderExpandedBlock + toggleFoldBlock），不要自带
展开/折叠渲染——封顶、可达性与统一形态保证只在组件里有。

**统一折叠形态（2026-08-30 用户裁定："所有折叠区块 = 默认三行 tail，展开封顶 60%"）**：此前折叠
态有两套并存（子 agent/advisor 头部摘要 + tail 3，长消息/连续 dim 用老的前 4 行 + 中置 ▶ + 末 1
行）；匿名 `▶ … N more lines` 头在滚动历史里读起来像孤立碎片（用户报告）。现已全部统一为
`renderFoldedHead` 单源：**`▶ <身份标签> · N lines — click to expand` + 末 3 行（dim，去 gutter
后按 cols 截断、带 `_skipDimFold`）**。身份标签按内容分类：`thinking`（思考块）/ `tool output`
（dim 行与连续 dim 块）/ `message`（其余可折叠长行——兼容兜底标签）；子 agent、advisor 用各自
既有的括号身份头。旧形态废弃，FOLD_KEEP 常量已删。折叠/收起标志**始终在块头部同一位置**——
状态切换点稳定；控制行 = bold cyan `▶`/`▼` + 短语中 "click to expand/collapse" 下划线
（foldHintLine）——可点击视觉暗示，**点击任意带 `_foldToggle` 的行即双向切换**
（toggleFoldBlock：有则删=收起、无则加=展开 → 重渲染）。

**展开封顶与窗口（2026-08-30 用户报告驱动；2026-08-31 增补块内滚动）**：展开态经
`renderExpandedBlock` 统一渲染，**区块总高 ≤ `floor(rows × 0.6)`**（`foldCapRows`；rows 未知 →
不封顶——单测/无终端环境）；高度封顶保留，但内容不再一次性截断——超过封顶的正文渲染为**窗口**
（`state._foldScroll: Map<foldKey, offset>` 记每块窗口起点；窗口可读行 = `cap − 5`，预留
blank+顶部控制+▲+▼+底部收起开销），窗口上下渲染 **`▲ 上方还有 N 行（点击向上翻窗）` /
`▼ 下方还有 N 行（点击向下翻窗）`** 控制行（带 `_foldScrollUp/_foldScrollDown` + `_foldWindow` +
`_foldTotal` 标记，点击翻窗 = 一整窗）；越界 offset 渲染时 clamp 并写回状态（防滚轮/翻窗误判
"未到边界"卡死在块内）。**滚动读全文、60% 高度内、底部 ▼ 收起控制行永远在块尾**——触 60% 封顶
时区块底部追加第二个控制行（唯一保证可达的收起入口；整块 ≤ cap−5 行时全量显示、无底部控制行）。
翻窗经 `scrollFoldBlock(state, foldKey, dir, step, upper)` 单源；`convCacheKey` 含 `_foldScroll`
分量（翻窗必须重渲染，防缓存旧窗口）。`maxRows` 由调用链贯穿（render-frame → renderConversation
→ buildConvLines → 组件；render-loop/key-handler/index 历史分页/mouse 同步传入），省略 = 不封顶。
`foldEnabled=false`（/fold off）时控制行与窗口一并消失（toggle 无效时提示会撒谎，索性不渲染——
原样正文直出）。

**滚轮块内滚动 + 穿出语义（2026-08-31 用户约定"展开后页面能滚动阅读全文"）**：滚轮事件带坐标 →
`handleWheel`（mouse.mjs）命中展开块**内容行**（窗口行带 `_foldBlock/_foldWindow/_foldTotal`
标记——每行自描述所属块，无区间簿记）→ **块内 offset ±3 行**（与外部会话滚动节拍一致）；未命中
块 → 走原有会话滚动。**穿出**：块顶滚上 / 块底滚下 → 返回 false 交还会话滚动（否则滚轮永远被块
吃掉、会话顶懒加载不可达——"经过展开块滚不到顶"的真实缺陷）；▲/▼ 控制行点击翻窗保留为快速跳转
（step=winH）。子 agent 面板行默认穿出滚会话；命中面板内展开块内容行才块内滚动（映射经
subagentLineIndex——与 render-frame 同一几何契约）。**视口数学单源 `convViewport(convLen,
convH, scroll)`**（render-conversation 导出，渲染+鼠标命中共用）——短会话顶部补 pad 空行后命中
整体偏移的存量 bug（convGlobalIndex 未减 pad）随此修复。

**流式跟随尾部（2026-08-31 用户需求）**：`state._followTail` 默认 true——渲染前 `state.scroll =
0`（最新内容钉在视口底，tool 行/pushLine 同样生效，无跟随空洞）；用户上滚（PgUp/滚轮上）→ 暂停
跟随；暂停期间**锚定补偿**（会诊共识：scroll 是距底偏移，内容增长会把用户读的行顶走——渲染帧
按 convLen 增量补偿 scroll，视口顶保持绝对行——loadOlder 加载后同样补偿）；PgDn/滚轮滚回底部或
新提交消息 → 恢复跟随。（注：↑/↓ 键是输入框历史导航，不执行会话滚动——滚动入口 = PgUp/PgDn
与滚轮。）

### 折叠对象与折叠决策

折叠对象（要求 `foldEnabled !== false` 且 key 不在 `expandedBlocks`）：

1. **长消息折叠**：思考（C.reason）**无条件折叠**（2026-08-30 最终裁定——行数阈值两轮死于真机：
   80 列下真实中文思考 wrap 5~10 行够不着 12、宽屏 200 列下只 wrap 1~3 行够不着 3，字符阈值也漏
   掉典型句——**"阈值"思路整体废弃**，思考是过程内容，一律收进命名头）；工具摘要等 dim/工具行
   >12 行折叠（`LONG_FOLD_LINES=12`）；key = `long-{_lineId ?? i}`。
2. **连续 dim 块折叠**：连续 dim 行 >8（`FOLD_LINES=8`）→ 统一形态；key = `fold-{首行 _lineId ??
   i}`（连续 dim 块首行即稳定锚）；块内含展开块行（`_skipDimFold` 标记）时不折叠（防套叠）。

**主输出永不折叠**（2026-08-30 用户裁定）：会话核心内容由滚动阅读，折叠会把真正的回答藏在点击
之后——`foldable = l.color !== C.text`（含用户消息）直接全量渲染；思考/工具摘要才是辅助流，保留
折叠。判定以 `_kind` 为主（thinking/tool 显式标记即折叠），颜色仅对旧无标记行兜底。

**折叠无例外（2026-08-30 用户裁定，废除"完成自动展开"）**：思考块在 flushStream 完成**瞬间即
折叠**（命名头 + tail 3，点击展开 ≤60%）——与恢复路径完全同构。旧设计"完成瞬间保持展开、下一轮
输入收起"（`_autoExpand` 簿记）是被否掉的预折叠方案的遗留——主输出免折叠后已无存在理由，连根删
除（flushStream 簿记 + runAgentTurn 清理 + state 字段，不得以任何形式写回）。主输出永不折叠、
无需簿记。

**流式过程同框（2026-08-30 用户裁定："思考过程中为什么不是直接进这个框"）**：思考的 live 流式
缓冲（`state.reasoning`）渲染为**同一只折叠框**（key=`thinking-live`）：默认 `▶ thinking · N
lines` + tail 3，点击展开 = 60% 封顶的实时视图（token 持续进入时框内内容实时增长，
`convCacheKey` 的 `state.reasoning.length` 分量驱动实时重绘）；flush 后块重挂到 `long-{idx}`，
形态完全一致、无缝衔接。live 与完成态与恢复态三态同构，无一例外。

### 空行分区与分隔线

- **主输出前后空行**（render-conversation buildConvLines 行循环 + streaming 分支）：每个主输出
  段（C.text 行连续段）**前后各插一个空行**，与思考块/工具块/子 agent 块拉开距离。渲染期插入
  （不写 `state.lines`、不影响 convCacheKey）；相邻段共享一个空行（无双重插入）；**streaming
  分支同样适用**（首版只改行循环漏了 streaming——生成时不空、落盘后才空，两条渲染路径必须一致）。
- **任务面板顶部分隔线**（renderTodo 首行 `─` × cols-1，dim）：与上方会话区域切分；小终端压缩链
  中**分隔线先让位**（面板高度压回任务行数，任务行永不压缩）。
- **子 agent 固定面板顶部边界线**（subagent-panel renderSubagentPanel 段首，同款 dim `─` 线）：
  与上方会话区切分；**仅当存在驻留区块（running ∪ queued/waiting——面板存在条件，
  AGENT-LOOP §10/§10.3）时面板渲染**（无驻留区块 → 无面板、无悬空线）。与主输出空行的边界：
  主输出段末空行是呼吸空间，分隔线是段边界——两者并存。
- **折叠控制行的空行规则**（fold-block `blankLine`）：控制行不缩进、与输出内容平齐；**空行分隔仅
  展开态使用**（▼ 控制行位于块头，行前空一行与其他内容区分）；折叠态 ▶ 头**不空行**。展开态每
  行加 `│ ` gutter 左框线（renderExpandedBlock 拥有 gutter：去调用方既有 gutter/缩进后统一加、
  行宽硬切 cols−2——杜绝"超出边距一列"与双 gutter）。

### 子 agent 活动区块（数据层指针 + 面板/冻结渲染）

区块数据层在 `subagent-blocks.mjs` / `subagent-children.mjs` / `subagent-freeze.mjs`（§1 地图行
——事件 token 路由、⟦ev⟧async 置位、N2 环、R23 子块载体、冻结族、面板镜像 syncPanelSnapshot）；
编排语义（settle 时序、async 生命周期、排队规则）以 AGENT-LOOP.md（子代理工具族 §7.2、async
§7.3、挂起 §9、调度与排队 §10、async advisor §11.2；权威源接管点 §17）为权威。显示层契约：

- **运行中 = 固定底部面板**（subagent-panel.mjs，会话与 todo 之间）；**冻结 = 流内折叠块**
  （render-segments frozenSubSeg）。折叠键 `sub-${key}` 跨运行/冻结边界共用（D5——折叠态无缝
  衔接）。
- **折叠头形态（B 形态——显式头标，不靠"没标推断"）**：`[▶ eng-coder#2 · async · glm-5.3 · 45s
  · turn 12/100] bash — npm test`——`[▶/⏸/✓ key · <mode/status 词> · model · elapsed · turn]
  state`；⏸ = 等待审批（sub.approval 非空）；✓ = 已完成。**sync/async 显式词**（dim，key 后模型
  前——颜色后置注入，截断在词内则保持纯文本不泄漏 dim）：真实 subagent 角色（SUBAGENT_ROLES——
  escalate/consult/compress 等非 spawn 角色豁免）与 advisor 伪角色才标；async 由 async spawn 实际
  启动时发的 `⟦ev⟧async` 标记置位（live 直接置位；缺失 key——块未建的排队补位时序窗口——缓冲
  `_pendingAsyncKeys`，ensureSubTaskKey 块创建时应用）；sync 区块无标记显式标 sync；冻结后保留
  （与 model 标识同生命周期）；**旧区块（无 async 字段）回退标 sync**（数据无法区分历史 async——
  显示层已知回退）。model 名先按显示宽度截断（≤cols/3——防模型名撑破括号宽度预算），状态区按
  剩余宽度截断——整行 ≤ cols 铁律。
- **⏹ 停止标记（门控）**：**仅 running && SUBAGENT_ROLES/advisor &&（sub.async === true
  ∪ sync registry live）的区块**——async 由 `⟦ev⟧async` 置位；**sync 由
  `state._agent._syncChildAborts` live 判据（SYNC-CANCEL——2026-09-09：阻塞 spawn 运行期
  注册 {ctrl, stopped}——成功/折叠/整回合停 finally 注销——⏹ 随注册出现随注销消失）**——
  钉与可中止一一对应（杜绝"可见但不可中止"误导；headless/测试无 _agent → sync 不钉——
  零回归）；dim，钉在折叠头右缘**内收一列**（glyph 在 cols−1、最右列留 margin——终端最末
  列点击不可靠/全角字形顶格被裁）；命中区 = col ≥ _stopCol（cols−1），点击 = 定向 cancel
  （ctx.cancelSubagent → cancelAsyncSubagent/cancelAsyncAdvisor（池条目定向 abort）/sync
  registry 经 cancelSyncChild（⏹ 顺带 deny 该 child 的 pending 权限/continue 模态——v2 模态
  deny 解绕）——不经模型回合——不触发折叠翻转），左邻 padding 与无 ⏹ 块右缘点击 = 折叠切换；
  sync ⏹ 中止 = 折叠 stopped partial 报告（merge + STOPPED_MARK + partial 警示——块冻结标
  stopped 而非 done——父回合继续拿报告）——机制正文见 AGENT-LOOP.md §7.2 cancel 边界注。
- **waiting/queued 块（排队面板 UX——AGENT-LOOP §10/§10.3）**：排队 spawn 返回即建面板块（不等子代理首 token）；括号状态
  词 = `waiting`（依赖未满足/域冲突——状态区 `waiting for: …` 原因恒标；依赖取消/失败滞留恒标
  `dependency cancelled`——不静默）或 `queued`（槽满等位——`queued · position N（槽满等位）`）；
  **不标 sync/async**（未启动——sync 词会误导：async spawn 排队的块不是 sync；⏹ 随启动后
  ⟦ev⟧async 置位才出现）；启动 → 清 waiting 标转正常 running 头（同 key 不重建）；取消/出队 →
  ⟦ev⟧cancelled 移除块（不冻结）。面板存在条件 = running ∪ queued/waiting 非空（queued-only 也
  渲染——无悬空线语义随区块存在边界迁移）。
- **冻结头**：`[✓ explore#1 · sync · model · done 45s]`——✓/stopped 动词按状态（cancel 冻结 →
  stopped；interrupt 清场 → interrupted 标）；挂起期**已结算待消化中间态**（sub.done &&
  awaitingDigest）驻留面板显示 `done · awaiting digestion`（T-S14），池空补发冻结后移除；折叠态头
  行 `▶ [✓ …] … subagent activity — click to expand`。
- **嵌套子代理（R23 方案——旧子标行方案已废弃）**：内层 relay 前缀（eng-coder 内 explore）显示
  为**子块载体**——`❯ explore#1 · model · elapsed` 工具式头（dim ❯ + role#N 亮 + model/elapsed
  dim；done/stopped 定格动词）+ **独立折叠键** `sub-{outerKey}/{innerPath}`（fold-block 通用通道
  ——鼠标点击零扩展）；折叠 tail 2、展开 60% 封顶窗口；递归孙块（任意 inner 深度，每层独立折叠
  键）；内层完成/终止 = 生成侧补发射 ⟦ev⟧done/stopped → 子块定格（不落 preview）；外层 abort 冻结
  时开子块随冻结定格 stopped（closeOpenSubChildren）；行数计入外层树配额（N2 trim 后序丢行）。
  冻结载体渲染含子块段（frozenSubTaskLines 尾部挂 renderSubChildSections——子块折叠态/滚动/行数
  进段缓存签名）。
- **advisor 块**：运行中 = 对话流内可折叠框（key=`advisor-blocks`，单实例；头
  `[advisor · review] N lines` + tail 3；展开 = renderBlockTimeline 有序块时间线——think↔tool 交
  替按发射序、占位标记全视图剥离）；完成 → 冻结 `_frozenAdvisor` 载体（key=`advisor-done-{_lineId
  ?? i}`，头 `▶ [advisor · review done] … click to expand`）；advisor 状态行
  `advisor review (round N · model)`（resolveAdvisorProvider 解析一次，onToolCall 时）；async
  advisor ⏹ = 取消后台评审（async advisor 池定向取消——AGENT-LOOP §11.2）；压缩（compress 伪角色）以同款面板块渲染——
  CONTEXT-COMPACTION.md §8/§8.3 权威。

### 约束

- 展开块行带 `_skipDimFold` 标记，不再参与连续 dim 折叠（防折叠套折叠——0.12.7 回归修复；
  renderBlockTimeline 统一携带）。
- 缓存键含颜色类别签名（colorSig）：折叠决策按颜色类别分类（思考/主输出/其余），仅颜色不同的两
  个状态不得共享缓存条目。
- `/fold off` 时两类折叠与全部提示行不出现；`/fold on` 恢复。
- 展开/折叠切换由 convCacheKey 的 expandedBlocks 摘要 + cap 分量 + colorSig 驱动缓存失效；toggle
  只失效该块段（段级缓存粒度）。
- **组件 cols 纪律（2026-08-30 窄屏事故，教训级）**：`renderExpandedBlock` / `renderFoldedHead` /
  `renderBlockTimeline` 的 `cols` 是**必传语义参数**（签名默认 80 只是测试兜底）——**漏传 = 全部
  生成行按 80 列 wrap，输入框却是全宽**（同帧宽度分裂，280 列终端上表现为"生成中左边一小块"）。
  已发生 3 处漏传（工具块展开/折叠、thinking 折叠）。任何新增组件调用**必须显式传 cols**；排障口
  诀：**同帧内 A 面板正常 B 面板异常 → 先查 A/B 的输入参数差异，别先怀疑 B 的内部逻辑或环境**。
- **折叠 key 稳定化（2026-08-30；2026-08-31 会诊三家共识扩展到全部折叠类型）**：`_lineId`（state
  自增计数器——live 工具载体/恢复 restoreLines/懒加载 loadOlder 统一分配）派生，位置索引只作
  `??` 回退：`tool-${_lineId}`、`long-${_lineId ?? i}`、`fold-${首行 _lineId ?? i}`、
  `advisor-done-${_lineId ?? i}`——loadOlder 头部 unshift 后展开态与 _foldScroll offset 不串位
  （2026-08-30 判例）。子块/区块键天然身份化（sub.key / innerPath），与行位置无关。
- **组件解耦**：fold-block 不 import 任何业务常量（advisor 占位符经 `strip: []` 参数注入）。

## 7. 会话恢复与懒加载（startup.mjs）

**恢复唯一路径 = `history` 重建**（startup.mjs historyToLines——`display` 快照已废弃：曾 WYSIWYG
原样恢复，与 VS Code 写历史漂移出同步；不得再写回 display 快照路径）：user/assistant/tool 逐条
渲染，行形态复刻 live（工具参数摘要 + 全量 JSON dim 行 + 结果全文、思考单条 C.reason、`_kind`
标记同 live——同一判定代码）。跨页回合态保持：页首前一条是 assistant/tool 则页内不再发
`❯ ThinCoder:` 标签（一个回合只一个标签——"为什么那么多 ❯ ThinCoder:" 修复）；多模态 user 消息
（read_image 注入后无文本）渲染无标签无内容（无内容标签是噪音）。**恢复渲染过滤 `[System
reminder:` 前缀的机读消息**（人读线本来就不含，过滤是纵深防御）；markdown 表格/行内渲染同样
生效。恢复后提示 `/new` 开新会话；多槽位提示 `/session`。

**懒加载契约（2026-08-31 用户需求 + 卡顿根治）**：恢复只加载最近 `INITIAL_HISTORY_MESSAGES=200`
条；向上滚动到会话顶部（`scroll >= convMaxScroll` 且 `_hasOlder`）→ **自动加载更早一页**
（`createLoadOlder`，`HISTORY_PAGE_MESSAGES=20`——vscode HISTORY_PAGE_SIZE parity；滚轮/PgUp 双
入口同一判别式，convMaxScroll 从 key-handler 导出复用；加载后 scroll 补偿保持锚定；头部分页标记
行 `… N more earlier messages …` 维护）。**性能根治——三层缓存**：convCacheKey 全量 / 行级
`wrapRowsCached`（行对象 + cols + 加工后 text + 颜色为键） / 段级 `_lineSegCache` 行体缓存
（行对象 WeakMap→conv 行数组，签名 = textRef 引用比较 + 短字段拼接——普通行在 render-conversation、
tool/frozen 三段在 render-segments 各自独立 WeakMap）——`buildConvLines` 全量重建 O(总行数) 是卡
顿真凶（真实 200 条历史 → 987 conv 行 94ms、loadOlder 后缓存失效 111ms）：三层缓存后 loadOlder
只算新增行，rebuild **111 → 25.7ms（行缓存）→ 5-8ms 平坦**（段缓存，不随已加载历史增长）；
toggle/翻窗/流式 append 只失效该块段。行级 _lineId 在恢复/加载时统一分配（折叠键稳定）。

**工具参数可见性**：恢复路径参数全量落 dim 行（TUI 无悬停——全量必须落行；超长由连续 dim 折叠
收纳）；畸形 args JSON 降级为原始串 dim 行（截 120），不崩。

## 8. 回合驱动与挂起会话（agent-turn.mjs / suspension-drive.mjs）

`runAgentTurn(ctx, text, { autoTurn = false, skipSession = false })`（LOGGING turn:start/end 包装
外层）：

1. pushLabel "❯ You:" + 输入文本（autoTurn 消化轮跳过——系统驱动回合无用户消息）。
2. 置 processing、state.exitArmed 清空（跨回合残留会让停回合后的武装穿透成即时退出）、新建
   AbortController（**回合链登记** `_turnControllers`——链头清旧链条残留句柄；Ctrl+I/ContinueError
   重建的 controller 持续入链）、1s ticker（`state.processing || subRunning()` 驱动重绘）。
3. callbacks 构造（tool-events.mjs buildToolCallbacks：onToken/onReasoning 流式进
   streaming/reasoning 缓冲；`role#id/` 前缀分流到子 agent 活动区块；onToolCall/onToolResult 工具
   载体与 settle；onUsage 累计 token；onCompress 压缩提示；onTaskUpdate 任务行；onTurnEnd 增量落
   盘；**权限/批权限/问答 handler 按 ctx 提供与否条件接线**——手动档 auto-turn 传 null → denied
   不弹面板、question 报错不挂起（挂起 digest 无人值守语义——AGENT-LOOP §9）。
4. runAgent 循环：正常完成 → flushStream；AbortError → **interrupt 区分**——`reason.interrupt &&
   message`（Ctrl+I）= 重建 controller 续跑；`reason.interrupt` 无 message（Ctrl+C 首按停回合）=
   break 不续跑 + 回滚 agent.mjs 无 message 注入的 "[User interrupt: undefined]" 尾部垃圾（D-C2
   agent.mjs 零改动）+ "[stopped]" 行；ContinueError → permission 询问 "Continue after N turns?"
   （**autoTurn 消化轮例外：无面板——AUTO 档自动 resume、手动档静默拒绝**，部分消化留在历史不丢）；
   其他错误 → "[error] …" 一行。
5. finally：停 ticker、清 processing、**挂起决策（AGENT-LOOP §9 语义）**——回合正常结束且后台池仍 live（poolLive：
   running/queued 子代理或 `_pendingAsyncResults` 非空）→ 子 agent 区块**不冻结**（各 settle 事件
   自行处理），本次回合 controller 记为 `agent._sessionAbort` 句柄 + abort 集合快照
   `_sessionAbortAll`（= 链条内全部 controller——children 不逃逸）；池空/中断/错误 → `freezeAllSubTasks`
   （中断态块标 interrupted）；挂起会话内回合（skipSession && suspended）由会话层
   freezeReclaimDigestedBlocks 逐条回收（不在此冻结——防回收时序被抢占）；**释放窗口守卫
   `_suspPending`**（willSuspend 判定后、suspensionSession 启动前——期间 processing=false 且
   suspended 未置位，无守卫会并发开第二个 runAgentTurn——双驱动器竞态）；sweepToolBlocks（未 done
   工具载体标 interrupted + 清计时）；ensureSessionTitle（首条真实 user 消息自动生成标题）→
   distill flush 有界等待（DISTILL_FLUSH_TIMEOUT_MS 5000，退出路径不挂死）→ saveSession 增量落盘。
6. 交接消息单条续发（INPUT-LOCK-ASYNC C'——2026-09-09）：busy 提交吞 + R15 攒批删——`state.queue`
   缩为**残项单容器**（释放窗口兜底 `_suspPending` 池空转正 / 挂起中止残余——各至多一条——零丢失）
   ——回合尾单条直发（slash 直接执行——保序）；释放窗口期入 pendingInput 的消息在池已空时转回队列。
7. **挂起会话**（suspension-drive.mjs `suspensionSession`——状态机行表以 AGENT-LOOP.md §9.2
   为权威，本文件不复制）：队列清空后池仍 live 且非 skipSession 且未 `_suspAborted` → 进入
   挂起态——**busy（processing 含 digest）提交吞；挂起空闲输入开放**（Enter 走 pendingInput 单槽，
   §4）、settle 事件驱动 auto-turn 消化轮（digestTurn → runAgentTurn("", { autoTurn: true })）、状态行
   "后台 N 子代理运行中 · M 待消化"、池空 + 无待处理输入 → 补发 done 冻结自然退出；彻底中止（Ctrl+C
   统一全停）后会话退出**复位 `_suspAborted`**（防粘滞——不清则中止后池再 live 永不重新进入挂起态）
   并把残余 pendingInput 单消息转回 state.queue（不静默丢）。

## 9. 交互层与命令层

- **interaction.mjs**：`askPermission(name, args)`（y/n/a；a = 批准并开启 AUTO）、
  `askBatchPermission(req)`（§16 D-B1 批量确认——a = approveAll（批范围，非持久 AUTO 标志）/
  o = oneByOne / n = deny / Esc = deny）、`askQuestion(text, options)`（选项列表 ↑↓ 或自由文本——
  选项尾部 QUESTION_CUSTOM 哨兵项转自由文本；Esc = 回 options（_backOptions）或无 options 中止）——
  agent 工具（permission/question）与 TUI 的桥。权限内容预览：bash 危险命令 ⚠️ 标注（只提示不拦
  截）、write/edit 落盘内容预览（cap 3000）。
- **question 自由文本态编辑**（q.answer codepoint 数组 + q.cursor；←→/Home/End/Ctrl+U/Backspace
  位置感知/可打印中段插入/粘贴落 cursor——Ctrl+J no-op/未列键吞；渲染布局/光标
  questionLayout/questionOffset）——**权威 = TUI-INPUT-BOX.md §7**，本文件不复制。
- **slash-commands.mjs**：SLASH_COMMANDS 表 + SLASH_ALIASES（/h /x /m /p /t /c /n）+ HANDLERS 分派
  （handler 异常统一拦截成 [error] 行——不击穿 TUI 主循环）；completions(input) 按命令/参数补全；
  Tab 循环候选。命令分两类：**即时反馈**（/plan /auto /fold 等本地状态切换）与**菜单循环**
  （/config /think /mcp /provider 等 picker 驱动）。busy（processing）期命令全部禁发——Enter
  提交吞（白名单已删——斜杠同禁——INPUT-LOCK-BEHAVIOR-REVISED 2026-09-09）；非 busy 期（含挂
  起空闲）经 submit 直执行（handleSlash——控制通道不排队）。
- **/submodel 命令**（cmd-submodel.mjs）：子 agent 模型设置入口——与 /model（主会话模型）对称。
  按类型分别配置：4 种子 agent 类型（explore/plan/coder/eng-coder）各有独立配置项。picker 菜单导航
  （无参时）：菜单列出全局 + 4 类型共 5 个槽位（各显示当前生效值与继承来源）→ 二级选择：
  provider 列表 → 模型列表（复用两级模型选择器，pickModelForSlot 选中写入该槽位而非主会话），另
  提供快捷项（设为父模型/清除该槽位/全部清除）。参数直设快捷路径保留：`/submodel <type> <value>`
  / `/submodel <value>`（全局）/ `/submodel <type>`（查看）/ `/submodel reset [type]`。参数三态与
  subagent 工具 model 参数同构：`provider:model`（跨 provider）/ provider 名（其配置模型）/ model
  名（父 provider 换模型）。持久化到 config.agent.subagentModel（全局）与
  config.agent.subagentModels[role]（类型级），立即生效。**优先级链：subagent 工具 `model` 参数 >
  类型级 `subagentModels[role]` > 全局 `subagentModel` > 继承父 provider**（resolveChildProvider
  单一解析源）。Tab 补全 provider 名 + 类型名。设计决策：**独立命令而非扩展 /model**——model 语义
  是主会话 provider 切换，混入子模型会混淆；picker 与直参双通道（图形导航 + 快捷输入）。
- **/shell 命令**（cmd-shell.mjs）：bash 工具 shell 配置入口。配置字段：`config.shell`（字符串路
  径/命令名，null = 系统默认——Windows 用 cmd、其他平台 /bin/sh）。**Windows 编码策略**：未配置
  shell（cmd）时 bash 工具对每条命令自动前缀 `chcp 65001 >nul && `——子进程独立无副作用，cmd 的
  GBK 输出不再乱码（UTF-8 解码器 + chcp 强制 UTF-8 代码页）；配置了 shell（git-bash/pwsh）时其原
  生输出即 UTF-8，无需前缀。picker 菜单导航（无参时）：按平台给出常用选项 + **可用性检测**（检
  测不到的自动隐藏）——Windows：System default(cmd+UTF-8) / pwsh / Git Bash（existsSync 常见安装
  路径）/ WSL bash / Custom path…；Linux 与 macOS：System default(/bin/sh) / bash / zsh / fish /
  Custom path…。检测方式：spawnSync 跑 `where <name>`（win）/ `command -v <name>`（posix），非零退
  出即隐藏（静默）。Custom path… 走 askQuestion 输入任意路径。直参快捷路径保留：`/shell
  <path|name>`（设置，引号自动剥离）/ `/shell reset`（恢复默认，大小写不敏感）。生效：立即生效
  （bash 工具每次调用实时读 agent.config.shell），persistRaw 持久化；VS Code 扩展共享同一
  config.json 字段。决策：平台感知 picker——免记路径（修正早期"不做 picker"决策）；直参与
  custom 保留任意路径灵活性。
- **wizard.mjs**：首启无 key 时进入——provider 菜单（已有 providers 可选中恢复 F3）→ preset 直达
  key（预设声明字段 format/thinking/reasoningEffort/maxTokens/chatPath 随 item 直达落盘——与
  pickers preset 路径同构）或 Custom 文本步 name→baseURL→model→**format（API format 步——endpoint
  后 key 前，D-C2——默认 openai，Esc 沿用"全步可跳"语义）**→key→embedkey（可跳过）→ 落盘 → 模型
  选择；Esc 可随时跳过（全步可跳——无半配置落盘）。
- **pickers.mjs**：通用选择器（标题/条目/filter 输入/位置指示/↑ more ↓ more/栈式嵌套——picker
  打开时新 picker 入栈，关闭返回上层）；模型选择器两级（provider → model，可 fetch /models 拉取
  真实列表，失败回退预设）；/provider Add/Remove/设 key 问答流程；**Add Provider → Custom 的 API
  format 为 picker 枚举**（openai/anthropic/google——默认 index=0 openai；Esc/取消 = 中止整个流
  程——与手输非法 abort 同语义：无半配置落盘——D-C1）。
- **/config 命令**（cmd-config.mjs）：embedding 三件套落盘（setEmbedKey 补写 baseURL/model——已有
  值保留、缺省取 config.mjs `DEFAULTS.embedding`——**引用，不硬编码字面量**；存量仅 apiKey 的配置
  再次保存自动补齐——F3 存量兼容）；/config 数值项手输（consultTurns/阈值等）非枚举属合理自由文
  本。
- **/mcp 命令**（cmd-mcp.mjs + cmd-mcp-form.mjs）：MCP 服务器管理（add/remove/connect/list/edit/
  test、token 一等字段、headers/env 键值对合并/删除 `k=` 语义、`✓ Save & test` 探活确认环、失败回
  同一表单）——**MCP.md §5/§8 权威**，本文件不复制。
- **其余命令**：/auto /clear /copy（末段回答到剪贴板）/eng /exit /extract（蒸馏——distill-cmd.mjs
  交互引擎）/fold /goal /help /init /model /new /plan /reindex /restore /rename /session /skills
  /think /undo /upgrade——各自 cmd-*.mjs，菜单循环类命令的 picker/问答细节见实现文件头注释。

## 10. 关键设计决策（as-of）

> 下表为 2026-08~09 各时点的设计决策与理由（当前态机制见上文正文；as-of 快照不随代码演进更新，
> 语义已被后续章节 supersede 的以正文为准）。

| 决策 | 理由 |
|---|---|
| 纯函数渲染 | 无终端也能全量单测；渲染/布局抽成纯函数后与状态变更解耦（2026-08-30 起） |
| stdin 双层（keyStream + paste 累积） | 粘贴与按键保序，bracketed paste 大文本不丢 |
| Ctrl+C 永不直接杀进程 | 防误触（双确认）+ picker/生成语义分层（IK61BI；§17.6 起三态武装一致） |
| markdown/math 渲染在 wrap 之前、宽度补偿保对齐 | ANSI 零显示宽度不干扰宽度数学；行尾补空格恢复原宽；跨 wrap 边界的标记/公式完整转换；窄复位不清行色（IK5VW3） |
| math 先于 markdown（$…$ 不透明段） | `x**2` 不被误判粗体；转换输出纯 Unicode，未转换原样段继续走 markdown（T12 表格列宽按转换后测量） |
| 折叠组件统一收敛 fold-block.mjs | 封顶、可达性与统一形态只在组件里有——任何折叠功能复用，不复制渲染逻辑（2026-08-30） |
| 主输出永不折叠、思考无条件折叠 | 折叠会把真正回答藏在点击之后；思考是过程内容收进命名头（2026-08-30 裁定——阈值思路两轮真机死亡后废弃） |
| 思考流式同框渲染（thinking-live） | "思考过程中为什么不是直接进这个框"——live/完成/恢复三态同构（2026-08-30） |
| 恢复唯一路径 = history 重建（display 快照废弃） | display 快照与 VS Code 写历史漂移出同步（2026-08-30 用户 diff 报告）；historyToLines 与 live 同构（同 _kind 标记 + 同渲染判定）——单一生产路径、无第二份同步面 |
| 恢复过滤 [System reminder: | 机读消息不显示（与 VS Code 渲染契约一致） |
| 运行中子 agent 为固定底部面板（§7.2.1） | 活动不随会话滚动、elapsed 可见；完成后冻结进会话流历史可读（2026-08-30） |
| 子代理流 `role#id/` 前缀 + ⟦ev⟧ 事件 token | 主/子流共用一套回调，按前缀分流到区块（数据层 subagent-blocks.mjs）；事件 token 只改头部状态——不污染区块内容与主流（D1） |
| 嵌套子代理 = 子块载体（R23） | 内层 relay 前缀 parseRelayPath 归属子块——工具式头 + 独立折叠键 + 生成侧补发射定格（supersede D-M8 子标行方案，2026-09） |
| /submodel 独立命令而非扩展现有 /model | /model 语义是主会话 provider 切换；子 agent 模型是高频操作——picker 导航 + 参数直设双通道 |
| 子 agent 模型按类型分别配置（subagentModels[role]） | 4 种 role 用途差异大——搜索用便宜模型、规划/实现用好模型；全局 subagentModel 兜底（向后兼容）；优先级：工具参数 > 类型级 > 全局 > 继承父 |
| /submodel picker 选中写入槽位（不复用 openModelPicker） | openModelPicker 绑定主会话状态（改 activeProvider/activeModel）；子模型选择需"选中即写指定槽位"的参数化变体——仅回调目标不同 |
| /shell 平台感知 picker（按平台列常用选项 + 可用性检测） | 常用候选有限、平台差异大，检测后选择比记忆路径可靠（修正早期"不做 picker"决策）；直参与 Custom path 保留任意路径灵活性 |
| Windows 粘贴强制 UTF-8（buildWindowsClipboardCommand） | PowerShell 按 [Console]::OutputEncoding（GBK/936）编码 stdout、node 按 UTF-8 解码 → 乱码；命令级单测锁定修复（IK9UWM） |
| 渲染调度整帧 recompute + 行 diff | 行内容即缓存键——若行该变就重写，否则不动；消灭旧双路径（全量重绘 vs 面板增量）的手工失效源（2026-08-31） |
| 懒加载 + 三层缓存 | loadOlder 全量重建 O(总行数) 是卡顿真凶（111ms）；段缓存后 5-8ms 平坦（2026-08-31） |

## 11. 专题完成史（折叠）

> 历史 Issue/批次的机制已落入上文对应章节（照抄级契约保留在正文），此处只留一行状态注，供追溯
> 原始决策来源。

| 日期 | 专题 | 现状 |
|---|---|---|
| 2026-08-22 | 数学公式渲染（IK9IXD）——表驱动子集转换器（math.mjs，零依赖），先 math 后 markdown，反引号内不转换，未闭合原样保留，块级 `\\` 保多行，token 表驱动按序匹配 | 已实现（见 §5 管线 + §10 as-of） |
| 2026-08-22 | Windows 中文粘贴乱码（IK9UWM）——`buildWindowsClipboardCommand()` 输出恒 UTF-8（`[Console]::OutputEncoding=[Text.Encoding]::UTF8; Get-Clipboard`），execFile 默认 utf8 解码不变，统一 strip 前导 \uFEFF（BOM 防御） | 已实现（clipboard.mjs；决策理由见 §10 as-of） |
| 2026-08-26 | GitHub thincoder#1 embedding 配置三件套落盘——setEmbedKey 的 persistRaw 补写 baseURL/model，缺省引用 `DEFAULTS.embedding`（不硬编码字面量），存量配置再次保存自动补齐，扩展端判定不动 | 已实现（cmd-config.mjs——见 §9） |
| 2026-08-26 | 子 agent/advisor 显示使用模型——[model] token 随子流首 token 发射（spawn-child makeRelay），routeSubToken 解析入 `state.subTasks[key].model` 并剥离（NF1），块头/状态栏显示 `· model`，无模型优雅降级 `[role]`；ACP 线桥接层同正则剥离 | 已实现（§6 折叠头形态 + §1 地图行） |
| 2026-08-31 | TUI 性能分析——懒加载卡顿根治后无热点；实测（3247 条存档/120×40）：冷启动 buildConvLines 100.8ms（启动一次性可接受）、流式帧 1.6ms/均 0.6ms、renderRows 全帧 2.2ms、loadOlder 后 rebuild 5-8ms 平坦；剩余空间（冷启动/convCacheKey/diff）均"不值得做" | 结论有效；**监控建议**：真机手感是唯一判据——若再报卡顿先测 buildConvLines rebuild 时间（段缓存命中应 5-8ms；>20ms = 缓存失效或新热点） |
| 2026-09-03/04 | 配置界面 picker 化 + question 光标——全 CLI 仅一处"固定枚举手输"违约（Add Provider Custom 的 API format）改 picker 枚举（D-C1）；wizard Custom 同步加 format 步（D-C2，endpoint 后 key 前）；question 自由文本态光标（TUI-INPUT-BOX.md §7 权威——本文件不复制） | 已实现（pickers/wizard——见 §9） |
| 2026-09-03 | 行数债拆分批（index/render-conversation/key-handler→key-modes/tool-events/subagent-blocks/agent-turn/cmd-mcp）——re-export 保导出面，模块地图同批回写 | 已实现（§1 地图呈现现状；2026-09-05 续拆 suspension-drive/subagent-freeze/tool-display/tui-lifecycle/cmd-mcp-form） |
| 2026-09-09 | 主会话输入禁排队（INPUT-LOCK-ASYNC C'——专题 INPUT-LOCK-ASYNC.md——机制正文落 AGENT-LOOP §9/§11.3）：busy（processing 含 digest）提交吞 + 白名单直执行——queue 面板/提示/Ctrl+D/攒批全撤——pendingInput 单槽 + 交接残项单容器（模块地图行数同批回写——净减 60 行） | 已实现（§4 门禁 + §8 交接续发；测试 test/input-lock.test.mjs） |
| 2026-09-09 | busy 行为修订（INPUT-LOCK-BEHAVIOR-REVISED——评审通过——专题 INPUT-LOCK-BEHAVIOR-REVISED.md）：VSC readOnly 锁移除（busy 不禁录入——打字回显——send 禁由 send.js 出口守卫兜——占位符文案更新）+ CLI 斜杠白名单删（busy 斜杠同禁发——/exit 也发不出——退出靠 Ctrl+C 终端层通道）——门禁判据（processing/_turnState running）零动 | 已实现（§4 门禁去白名单 + §1 行数回写；双端 INPUT-LOCK 测试更新） |

> **未决/待办承接（来自 2026-09-03 picker 化评审旁支——开放项不折叠）**：① picker item.note 渲染丢弃
> （pickers.mjs 只消费 header.note——buildProviderEntries 的 baseURL/无 key 提示与 cmd-advisor
> 主菜单 Provider 注记写在 item.note 实际不显示——信息缺失疑似 bug——另案（未登记，待父侧
> 立项））；② question options / wizard provider 与 picker 并行实现（第二/三套选择 UI——统一属
> 架构决策——待登记 docs/TODO.md）；（③ /config 数值项档位预设——已裁定不做）。

## 变更记录

- 2026-09-09：INPUT-LOCK-BEHAVIOR-REVISED 批（busy 行为修订——VSC 不禁录入只禁 send——CLI 白名单删、忙时斜杠同吞）——§4 门禁描述去白名单、§9 slash 命令节同步、§1 模块地图行数回写（见 §11 完成史行）。
- 2026-09-09：INPUT-LOCK-ASYNC 批（C'——busy 提交吞/白名单/单槽化/queue UI 撤）——§4 门禁、§8 交接续发、§1 模块地图行数回写（见 §11 完成史行）。
- 2026-09-07：格式债批 A——本文件由逐批变更档案重写为人类可读当前态（DOC-REWRITE.md +
  DOC-REWRITE-LARGE.md §4）。按机制主题重组；历史流水折叠入 §11 专题完成史与本文档底部；模块地图
  按现文件结构回写（2026-09-05 拆分文件 suspension-drive/subagent-freeze/tool-display/
  tui-lifecycle/cmd-mcp-form 入图 + 行数实测 2026-09-07）；display 快照废弃/`_autoExpand` 删除等
  漂移点不再声称。
- 2026-09-03：§10.6/§10.6D 配置界面 picker 化（D-C1/D-C2）+ §10.7 行数债拆分批（D-S1a/b/c +
  D-S2 + D-S4）——内容并入本文档对应章节。
- 2026-08-31：折叠展开窗口/块内滚动/穿出语义、_followTail、懒加载三层缓存、Ambiguous 防御、dims
  简化、question 光标系列（TUI-INPUT-BOX.md §7 权威）。
- 2026-08-30：折叠组件化与统一形态、60% 封顶、主输出永不折叠、_kind 行语法、逐行对齐契约、行间
  区块单框化、懒加载窗口与折叠 key 稳定化、子 agent 固定面板（§7.2.1）——内容并入本文档对应章
  节。
