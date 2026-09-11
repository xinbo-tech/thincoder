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


> 需求层（2026-09-10 拆分批）：本板块需求见 `../requirements/TUI.md`——本档保留设计与测试细节。

## 1. 模块地图（结构性快照）

纪律（2026-08-30）：本表是**结构性快照**，随实现同步回写——交付新增/改名/删除文件时同批
更新本节（eng-coder 交付自查第 6 项）。**行数列 = 2026-09-11 全表实测回写**（第 14 批收尾批；口径沿用既往：
`split("\n").length` 含末行——仅作量级参考，会漂）；同日**交付后刷新轮**按实测回写触行（第 20/28/31 批面——见变更记录）。**同批如实注（超出范围项——只注不补）**：
① `model-picker.mjs`（496）/ `model-catalog.mjs`（90）/ `wrapped-spawn.mjs`（39）三档未收本表（补登随后续 TUI 文档维护批）；
② `pickers.mjs` 行文字未随 MODEL-MERGE-SESSION 拆分重写（模型两级面 + `/provider` 管理已迁 `model-picker.mjs`）——行内已注。

### 核心管线（stdin → 状态 → 渲染 → 回合）

| 文件 | 行数 | 职责 |
|---|---|---|
| `index.mjs` | 450 | startTUI 入口：raw mode、keyStream + readline、分块解码（utf8Decoder stream:true + mousePending）、粘贴协议、Shift+Enter 翻译、resize、state 对象、pushLine/pushLabel、提交（busy 吞防御——busy 全拒——白名单已删——INPUT-LOCK-BEHAVIOR-REVISED）、行缓冲裁剪；装配归位（D-S1）：createMouseDispatch / createLoadOlder / update-notice（re-export）；`state._agent` + `agent._tuiState` 双向挂载（DEBLOAT F-3） |
| `tui-lifecycle.mjs` | 88 | TUI 生命周期终端序列（2026-08-31 自 index 拆出）：writeStartupSequence（alt buffer + 光标 + 鼠标/粘贴/键盘增强 + **DECRST 7 禁环绕**）、writeCleanupSequence（恢复 DECSET 7 等）、createExitCleanup（退出闭包）、setTuiActive |
| `update-notice.mjs` | 77 | 后台升级提示（2026-09-03 D-S1c 自 index 拆出）：upgradeFailureText / pendingNoticeReady 纯函数（index re-export）+ createUpdateNotice（提示 picker + 启动检查装配） |
| `key-handler.mjs` | 461 | 按键分发：模态入口（permission/question/search/picker/wizard/interruptPrompt）+ 输入编辑；**busy 门禁**（INPUT-LOCK——提交吞——斜杠同禁发——空 Enter 静默）；挂起空闲 Enter → pendingInput 单槽+唤醒（槽满吞）；Ctrl+C 分支（picker 取消/武装/挂起两级/首按停回合/空闲双确认）；convMaxScroll 导出 |
| `key-handler-search.mjs` | 114 | 搜索模式按键子处理（Ctrl+F 分支，2026-08-30 拆出） |
| `key-modes.mjs` | 294 | 按键模态层（2026-09-03 D-S4 自 key-handler 拆出）：permission / question / interruptPrompt 独占模态 handler——模态激活即消费全部按键（返回 true，未激活 false）；ctx 注入 state/agent/pushLine/render |
| `agent-turn.mjs` | 324 | runAgentTurn（`{ autoTurn, skipSession }`）回合驱动器：状态复位 / runAgent 循环（flushStream、AbortError 中断区分、ContinueError）/ finally 收尾（冻结决策、sweep、标题、落盘）/ 交接消息单条续发（state.queue 残项单容器——INPUT-LOCK）；LOGGING turn 包装；挂起会话段迁 suspension-drive.mjs（函数级静态环互相 import——回合尾进入驱动器、驱动器内回合递归本文件） |
| `suspension-drive.mjs` | 298 | 挂起会话驱动器（2026-09-05 split：agent-turn 535>500——driver 族 verbatim 迁入；2026-09-09 INPUT-LOCK：R15 攒批删+单槽消费+残余单消息化——净减）——状态机行表见 AGENT-LOOP.md §9.2 |
| `tool-events.mjs` | 406 | 工具事件 → TUI 状态：buildToolCallbacks + flushStream、`_toolBlock` 载体生命周期（onToolCall 开 / onToolResult 定态 / onToolOutput 追加 + advisor 有序块）、onCompress*/onTaskUpdate/onTurnEnd 落盘；权限/批权限/问答按 ctx 条件接线（auto-turn null → denied）；finishSubTaskKey；slimToolResultForDisplay |
| `tool-display.mjs` | 144 | 工具块显示/计时/清扫 helper 族（2026-09-05 module-split：tool-events 537 > 500——_toolTicks/_subActions 计时表、sweepToolBlocks、settle/slim/async 探测/find 等 verbatim 迁入；模块级可变对象导出 + re-export sweepToolBlocks 保 agent-turn 消费面；DEBLOAT F-1：报告 preview 常量已删） |
| `subagent-blocks.mjs` | 454 | 子 agent 区块数据层：SUB_EVENT_RE 路由（settled/stopped/queued/cancelled + ⟦ev⟧async 置位与 _pendingAsyncKeys 兜底）、finishSubTask/Key、SUB_RELAY_THROTTLE_MS=250、SUBAGENT_ROLES、parseRelayPath（SUBAGENT-TAIL 嵌套路由源——内层内容行并入外层 `blocks`）；N2 单环 500 显示行（appendSubBlock 口径——见 subagent-children 行）；冻结族迁 subagent-freeze.mjs |
| `subagent-freeze.mjs` | 170 | 子 agent 完成/冻结族（2026-09-05 split：subagent-blocks 625 > 500）：freezeSubTaskLines/freezeDoneSubTasks/freezeAllSubTasks/freezeReclaimDigestedBlocks + computePanelBlocks（§19.6 面板**读时现算**——DEBLOAT F-3 手工镜像退役）——re-export |
| `subagent-children.mjs` | 163 | 嵌套子代理数据层（SUBAGENT-TAIL）：守护载体 ensureSubChild/descendSubChild（任意 inner 深度——只存守护元数据，无内容行）、closeSubChild、closeOpenSubChildren（外层冻结定格 stopped——类目 A 写路径）；SUB_BLOCK_LINE_LIMIT/appendSubBlock（re-export 保 import 面）；单环 500 显示行 trim（trimSubCarrier——单载体最旧先行）+ 省略计数真值（dropCarrierLines——N6：标记不占额度/不计 N/无幽灵行） |
| `render-frame.mjs` | 377 | 帧布局装配：header / conversation / subagent 面板 / todo / input / status 各面板（行由 layout 预计算直接 put）；renderHeader（logo+版本+模型+think 徽章+cwd）；状态栏 busy 文案（INPUT-LOCK——主会话处理中——queue 提示已撤）；question 自由文本态光标例外（TUI-INPUT-BOX.md §7.2） |
| `render-conversation.mjs` | 425 | 对话面板行构建（纯函数）：三层缓存（convCacheKey 全量 / 行级 wrapRowsCached / 段级 _lineSegCache——2026-09-03 D-S2 后只管普通源行段，tool/frozenSub/frozenAdvisor 三段随实现迁 render-segments.mjs 各带独立 WeakMap）；搜索高亮、折叠装配（六处折叠点）、主输出前后空行、连续 dim 折叠；convViewport 视口数学单源导出 |
| `render-segments.mjs` | 169 | 对话行三类特殊段渲染（2026-09-03 D-S2 自 render-conversation 拆出）：tool 块 / frozenSubTask / frozenAdvisor——段渲染 + sig 分支 + 独立 WeakMap 段缓存三段合一（toolSeg/frozenSubSeg/frozenAdvSeg）；buildConvLines 主循环只留 ~3 行分支调用；SUBAGENT-TAIL：冻结载体段单流渲染（子块段调用与子块树签名已删） |
| `fold-block.mjs` | 257 | 公共折叠组件（2026-08-30）：foldCapRows（60%）、isExpanded/toggleFoldBlock、renderFoldedHead、renderExpandedBlock（窗口 + 底部收起）、renderBlockTimeline、foldTailLines、scrollFoldBlock、renderMathAndMarkdown——消费方：长消息/连续 dim/子 agent/advisor/工具块 |
| `subagent-panel.mjs` | 150 | 运行中子 agent 固定底部面板渲染（中立模块——layout 预计算高度与 render-frame put 共用，避免循环依赖）：renderSubagentPanel 纯函数（顶部分隔线 + 驻留区块折叠头 + tail 3 / 展开窗口）；SUBAGENT-TAIL：单流渲染只读 `sub.blocks`（子块段三函数与子块折叠键已删） |
| `tool-args.mjs` | 82 | 工具参数可读展示（2026-08-30，对齐 vscode 卡片头）：describeToolArgs 按工具挑关键参数单行摘要——live 标题行（tool-events）与恢复标题行（startup historyToLines）共用；toolArgsLines 全量 JSON dim 行（恢复路径） |
| `render.mjs` | 285 | 纯函数：字符宽度（CJK/emoji/组合字符）、wrap、slice、markdown 表格对齐、sanitize |
| `render-loop.mjs` | 131 | 渲染调度：整帧 recompute + 行 diff（只重绘变化行）+ 光标定位，防闪烁；MIN_RENDER_INTERVAL_MS 16ms 节流；每帧 write 包 wrapOff/wrapOn（Ambiguous 防线②）——1s ticker 在 agent-turn.mjs（含 subRunning() 驱动面板 elapsed 走秒） |
| `layout.mjs` | 237 | 面板布局计算（行/列分配；运行中区块 → panels.subagent 槽 + subagentLines 预计算）；小终端压缩链（subagent 面板最先让位 → conversation → picker → permission → todo 分隔线）；question 自由文本态 boxLines = layoutAnswer（layoutInput 同实现 + MAX_INPUT_LINES cap + offset 滚动）；queue 面板槽已撤（INPUT-LOCK F-7） |
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
| `mouse.mjs` | 250 | SGR 鼠标序列解析（滚轮/左键点击）；handleWheel（展开块内容行块内滚动 ±3 + 穿出语义）；点击命中（picker 选项/折叠块 toggle/展开窗 ▲▼ 翻窗/⏹ 列级 cancel）；convGlobalIndex 与渲染同式；**createMouseDispatch 装配簇（2026-09-03 D-S1a 自 index 迁入：cancelSubagent/onMouseClick/mouseCtx——依赖 cancelAsyncSubagent/cancelAsyncAdvisor，tui→core 无环）** |
| `clipboard.mjs` | 181 | 剪贴板文本/图像读写（Win powershell 强制 UTF-8 / macOS pbpaste / Linux xclip）+ translateShiftEnter（CSI-u → meta+return）+ stripKeyboardProtocol；insertPastedText 目标路由（question 自由文本落 cursor + \r\n→空格单行守卫、options 忽略、注入框去换行、主输入光标 splice——TUI-INPUT-BOX.md §7.2） |
| `interaction.mjs` | 134 | 权限确认（y/n/a；batch a/o/n；continue y/n）、自由提问（question 工具：选项 ↑↓ / Esc 转自由文本——QUESTION_CUSTOM sentinel）；askQuestion 装配 q.answer codepoint 数组 + q.cursor；permission 内容预览（bash 危险命令 ⚠️ 标注、write/edit 内容预览） |
| `pickers.mjs` | 118 | 通用列表选择器（标题/条目/filter/栈式嵌套）+ 模型两级选择器（provider → model，可 fetch /models、失败回退预设）+ /provider Add/Remove/key 流程（Custom API format 走 picker 枚举——openai/anthropic/google 默认 0——D-C1）+ pickModelForSlot（子模型槽位）——**注：模型两级面 + `/provider` 管理已迁 `model-picker.mjs`**（MODEL-MERGE-SESSION 拆分；本行文字未随拆重写） |
| `wizard.mjs` | 242 | 首启配置向导：provider 菜单（existing/preset/custom）——preset 声明字段（format/thinking/reasoningEffort/maxTokens/chatPath）随 item 直达落盘（无 format 提问步但字段不丢——与 picker preset 路径同构）；Custom 文本步 name→baseURL→model→**format（D-C2，默认 openai）**→key→embedkey → 落盘 → 模型选择；Esc 全步可跳无半配置 |
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
| `cmd-config.mjs` | 464 | /config（embedding 三件套落盘——引用 DEFAULTS.embedding 不硬编码；代理/轮次/阈值等菜单循环） |
| `cmd-mcp.mjs` | 395 | /mcp（MCP.md §5/§8 权威：edit/test 子命令、token 一等字段、探活确认环）——字段表单在 `cmd-mcp-form.mjs` |
| `cmd-mcp-form.mjs` | 198 | MCP edit/add 统一字段 picker 表单机制（MCP.md §8.3：fieldPicker 循环——字段行 + `✓ Save & test` 末行；`k=` 删除语义合并入 mergeKeyValuePairs；maskToken 迁移落点） |
| `cmd-advisor.mjs` | 256 | /advisor（评审模型/思考配置 + guard 开关，交互菜单循环） |
| `cmd-submodel.mjs` | 155 | /submodel（子 agent 模型槽位，§9） |
| `cmd-think.mjs` | 139 | /think（思考模式/effort 枚举——specForModel 动态枚举，不硬编码） |
| `cmd-shell.mjs` | 105 | /shell（shell 配置，§9） |
| `cmd-session.mjs` | 103 | /session 列表/切换 + /rename |
| 其余单命令小件 | 各 8–95 | /auto /clear /copy /eng(95) /exit /extract /fold /goal /help /init /model /new /plan /reindex /restore /skills /undo /upgrade；`distill-cmd.mjs`（47 行）蒸馏交互引擎（/extract 入口调用 runDistill） |

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
  subTasks / queue / interruptPrompt（第 31 批：`{ chars, cursor }` 单行态——契约见 TUI-INPUT-BOX.md §1 不变量 9/§8）/ pendingNotice / pendingInput / _history* 等。
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
→ interruptPrompt（Ctrl+I 后输入注入消息——创建/模态分支先于 picker，见 TUI-INPUT-BOX.md §1 不变量 4）
→ picker 栈 / wizard（↑↓ 选择、enter 确认、esc 取消）
→ 正常输入编辑（字符/退格/Ctrl+U/Ctrl+V/↑↓（竖移/历史——第 31 批三规则，TUI-INPUT-BOX.md §3）/多行）
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
——事件 token 路由、⟦ev⟧async 置位、N2 单环 500 显示行、SUBAGENT-TAIL 守护载体、冻结族、面板现算 computePanelBlocks）；
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
- **嵌套子代理（SUBAGENT-TAIL——2026-09-11 批；R23 子块小节与更早的子标行方案均已退役）**：内层
  relay 前缀（eng-coder 内 explore）的活动行（工具行/输出/文本/思考）**并入外层块活动流**
  （sub.blocks）——与其他工具调用同款：折叠 tail 3 直达、展开全量时间线可达（任意 inner 深度）；
  内层完成/终止信号（生成侧补发射 ⟦ev⟧done/stopped）照旧——供子块守护定格（不再有显示面）；
  子块载体退居**守护元数据**（done 后迟到丢弃 / 外层冻结定格 stopped / 内层工具 fresh 判别——
  不再承载内容行）；**渲染层无任何子块段与子块折叠键**（只读单流）。方案选型/契约/用例见下文
  「内层活动并入外层流（SUBAGENT-TAIL）」节。
- **advisor 块**：运行中 = 对话流内可折叠框（key=`advisor-blocks`，单实例；头
  `[advisor · review] N lines` + tail 3；展开 = renderBlockTimeline 有序块时间线——think↔tool 交
  替按发射序、占位标记全视图剥离）；完成 → 冻结 `_frozenAdvisor` 载体（key=`advisor-done-{_lineId
  ?? i}`，头 `▶ [advisor · review done] … click to expand`）；advisor 状态行
  `advisor review (round N · model)`（resolveAdvisorProvider 解析一次，onToolCall 时）；async
  advisor ⏹ = 取消后台评审（async advisor 池定向取消——AGENT-LOOP §11.2）；压缩（compress 伪角色）以同款面板块渲染——
  CONTEXT-COMPACTION.md §8/§8.3 权威。

#### 活动块去加戏（CLI-ACTIVITY-DEBLOAT——2026-09-10 批，施工册要点并档）

- **报告 preview 已删（F-1）**：sync spawn 完成不再往会话流塞 8 行 dim 摘要与
  `... (N more lines)` 行（tool-events onToolResult / tool-display 两常量随删）——冻结块是
  子代理报告的**唯一显示载体**（全文在 history 供模型；escalate#N 无 preview 注释面不变）。
- **finishSubTask 收窄为精确匹配校验（F-2）**：`finishSubTask(state, roles, lastError)`
  恒 no-op 返 null（"最早 started"启发式支路删除——7.2.3.1 实测误冻源归零；宁可 no-op 不误
  冻）；`finishSubTaskKey`（dispatch ctx._subagentKey 精确 key）是**唯一完成路径**；无 key
  窗口的块由回合尾 freezeAllSubTasks 兜底清场。finishSubTasksByRole（consult 残项整组 settle）
  不受影响。
- **面板手工镜像退役——读时现算（F-3）**：`computePanelBlocks(state)`（subagent-freeze.mjs
  ——subTasks 活值纯推导：key/role/status 三态映射/startedAt——与原 syncPanelSnapshot 输出
  形状一致）；`agent._panelSnapshot` 读写全删，`index.mjs` 反向挂载 `agent._tuiState = state`，
  subagent.mjs panel 分流接线 `ctx.state`；subagent-panel.mjs 的 panelFreezeGate/view 面改经
  ctx.state 现算——**门控语义零动**（awaitingDigest 限定/池归属查/pending 查）。状态变更点
  不再手动刷镜（subagent-freeze/subagent-blocks 调用点全清——单账本）。`state._agent` 挂载保留
  （SYNC-CANCEL ⏹ 门控 `state._agent._syncChildAborts` 依赖）。
- **降级路径不变（T-P5）**：无 TUI 装配（headless/VSC/子代理——`agent._tuiState` 缺省）→
  现算返 null → view 降级池视图 + freeze 报不可用照旧。
- **④ awaitingDigest 驻留零动（用户裁定）**：settled 三态机/_freezeAt settle 锚 splice/
  shiftFreezeAnchors 头裁补偿/降序 splice/freezeReclaimDigestedBlocks 逐条回收/
  panelFreezeGate 门控——全部保留（§17.5.5 有意决策；用户可见变化仅 F-1 少 8 行重复摘要与
  F-2 误冻消除——生产路径本走精确 key）。不引入块落盘恢复；协议零改。
- 测试：`test/activity-debloat.test.mjs`（用例表 1:1——preview 删/精确 key 命中与无块/
  现算正常与空态/降级路径/门控等价/驻留回收/锚点不回归）。

#### 内层活动并入外层流（SUBAGENT-TAIL——2026-09-11 批，设计与测试并档）

**需求回指**：需求 `../requirements/TUI.md` F8（子代理内嵌套活动的显示同款——用户口径 C）·
N5（防刷屏与行额度）· N6（省略计数真值）。

**问题陈述**：子代理块内嵌套 spawn（eng-coder 内 explore）此前渲染为「子块小节」——独立头行
（`❯ explore#1 · model · elapsed`）+ 独立折叠体（tail 2）+ 每层独立折叠键，内容存于子块载体
`children[].blocks`。折叠态父块 tail 只含外层自身活动——嵌套活动被藏在小节里（只露 2 行且需
展开），与普通工具调用「最近活动直接进父块 tail」不同款（用户口径 C）。附带缺陷：子块
「已省略 N 行」计数虚高（≈ 真实 ×2——标记自重 + 幽灵行 + 块尾空行口径；N6）。

**方案选型对比**

① 实现面（内层行落外层 tail）：

| # | 候选 | 判据逐项评估 | 取舍（选定代价/权衡） | 结论 |
|---|---|---|---|---|
| 1 | **数据流合并**——内层 relay 行 append 到外层块 `blocks` | 时序天然精确（append 顺序 = relay 发生顺序；嵌套 spawn 恒 sync、父块在子跑期间不产行）；单存储单账本（配额/计数/渲染同一数组）；渲染层净删 | 路由层四处 append 目标上移；子块载体降为守护元数据；「每层独立折叠键」退役 | **选定** |
| 2 | 渲染期合并——数据不动，渲染时拼内层/外层合并流 | 时序重建需每子块的插入锚——外层环 trim 丢旧行使索引锚漂移 → 需序号簿记 + 双存储对账；收益仅「路由零改」（而路由本就要为「内容去哪」改） | 复杂度更高 + 新增双存储一致性面 | 否决 |
| 3 | 并存（合并 tail + 保留小节渲染） | 合并 tail 的末几行 = 子块 tail 的内容——同一活动两处显示；面板空间敏感（防刷屏 D1） | 与「与其他工具同款」口径冲突 | 否决 |

② 小节形态：

| # | 候选 | 判据逐项评估 | 取舍（选定代价/权衡） | 结论 |
|---|---|---|---|---|
| 1 | **取代小节** | 与普通工具完全同款（对照面无小节）；有嵌套时折叠态每块 7 行 → 4 行；无重复承载；子块级省略标记自然消失 | 子块头（model/耗时/定格词）与每层独立折叠键退役——R23d 承诺按**内容可达性**承接（任意深度内容随外层展开可达——用例 3/9、AC3 钉死） | **选定** |
| 2 | 并存（小节保留 + tail 合并） | 保留子块身份与独立展开 | 同一内容两处重复；面板行数不减（≥7 行/块）；「已省略」标记与折叠键族保留（点 2 修复面保留） | 否决 |

**数据流与渲染契约（本批后现状）**

- **路由目标上移**：`routeSubToken` / `routeSubReasoning` / `routeSubToolCall` / `routeSubToolOutput`
  的嵌套分支 append 目标 = 外层块（`appendSubBlock(sub, …)`——与单层分支同函数）。kind 合并 /
  fresh 语义照旧（工具调用 fresh=true 起新块；输出按 `leaf.currentTool` 判别续接）。内层
  `[model]` token、内层 `⟦ev⟧done/stopped` 定格、其余内层事件剥除——**照旧**（守护元数据/丢弃，
  不进内容流）。
- **已知失效前提（本批不处理——未来复核项）**：同一外层块若出现两个**并发**内层子块交错，内层输出会
  并入末块的他人工具头块（`pushBlock` 仅按 kind 合并——`subagent-children.mjs:79`）；当前不可达
  ——depth>0 spawn 恒同步（`src/agent-tools/subagent.mjs` `wantAsync` 缺省门控，as-of :215-220；下游
  `src/agent-tools/subagent-run.mjs` `executeAsyncSpawn` 对 depth>0 拒 async，as-of :47-48；工程子代
  通道 `src/agent/spawn-child.mjs` `gateEngCoderSpawn` 限 sync explore，as-of :48-56），未来放开
  并行嵌套时须复核。
- **子块载体 = 守护元数据**（key/role/model/done/stopped/currentTool/children——字段全集、类目划分见
  下条，无内容行）：职责收窄为 ① done 后迟到 chunk 丢弃（F2 语义不回退）② 外层冻结时未收尾子块
  不悬空（closeOpenSubChildren 定格 stopped——② 的写路径保留、无读者，见下条类目 A）③ 内层工具 fresh 判别。
- **守护字段最小形状与②注（评审 #1 落档——防反向补实现/补断言）**：正读者只有 `done`（迟到丢弃守卫）/
  `currentTool`（fresh 判别）/ `children`（收尾遍历）——载体查找键 `key` 为结构基础。其余字段分两类：
  **A 保留写路径（无读者、不设断言）** = `stopped`——定格族写点保留（`closeOpenSubChildren` 冻结定格
  = ②；`closeSubChild` 内层 stopped 定格）；**B 可留可删字面量** = `model`/`started`/`doneAt`/`blocks`/
  `toolArgs`/`approval` 等（原读者 `subChildHeadRow`/子块树签名随批删除——不得为其补渲染或补断言）。
  **② = 防御性保留**（无可见语义、不必设断言）：冻结后迟到 relay 由 tombstone 独立丢弃
  （`subagent-blocks.mjs` `ensureSubTaskKey` tombstone 守卫，as-of :96-97；`routeSubReasoning` /
  `routeSubToolCall` / `routeSubToolOutput` 的 tombstone 分支，as-of :307-308 / :326-327 / :356-357），
  AC8 不含②。
- **渲染单流**：`renderSubChildSections` / `subChildHeadRow` / `subChildFoldKey` 删除——面板与冻结
  渲染只读 `sub.blocks`（折叠 = 头 + `foldTailLines(sub.blocks)` tail 3；展开 = `renderBlockTimeline(sub.blocks)`
  60% 封顶窗口——既有组件零改）。折叠键只剩 `sub-${key}`（面板 ↔ 冻结同键——D5 无缝衔接不变）。
- **行数额度单环**：内层内容就地计入外层 500 行环（`SUB_BLOCK_LINE_LIMIT` 口径不变 = 500 显示行）；
  树级 trim（trimSubTree 后序/子块先丢/done 豁免）随子块内容层退役——trim 收窄为单载体最旧先行。
- **省略计数真值**：`…（已省略 N 行）` 的 N 只随**内容移除**增长；标记自身不占额度、不计入 N；
  `countBlockLines` 口径修订为**显示行**（块尾 `\n` 的空元素不计）。

**关键决策记录（含否决备选）**

- **D-ST1 合并点 = 数据流**（否决渲染期合并、并存——见选型表①②）。
- **D-ST2 小节取代**（否决并存）；R23d「任意深度可展开」按内容可达性承接——承诺面变化显式记录：
  任意深度内层内容**可达**保留；**每层独立折叠键退役**（其前提 = 每层独立渲染载体，内容并入后不存在）。
- **D-ST3 tail 预算 = 3 行不变**（否决「3+2 并为 5 行」：用户口径是「同款」非「更多」；扩行增加面板
  常驻高度、与 D1 防刷屏相悖）。
- **D-ST4 丢行语义 = 单环最旧先行**（否决「保留子块先丢」优先级——需按行打源标 + 优先级遍历；收益
  仅「外层较早叙述行更晚被丢」——值不当；且与「同款单流」语义一致）。代价如实列明：内层批量输出与
  外层叙述同环最旧先行——外层较早叙述行可能先被丢弃。
- **D-ST5 点 2 裁决**：子块级「已省略」标记随取代消失；**块级省略标记仍在**（流首 meta 行）→ 按用户
  裁定「仍保留省略标记 → 计数真值必须一并修」分支执行：dropCarrierLines 三缺陷（标记自重 / 幽灵行 /
  块尾空行口径）随本批修正（N6）。
- **D-ST6 陈旧指针随批修订**：本批所触文件注释中引用的 AGENT-LOOP 旧节号（§27 / §19.5 / D-R23*——
  文档重组后已不存在，显示契约实际在本文件 §6）——注释改指本文件对应节；只改所触文件，不做全库清理。
  **交付实测口径（2026-09-11——防后续误读）**：注释修订按「**改动区域** + 显示契约指针」落地——改动区域
  （模块头 / 改动函数 / 删除面）已改指本文件 §6 并档节；**未改动区域**的旧节号（§19.5 / §19.6 / §20 / §24 / §27）
  为**存量全库性文档债，不随批迁移**——读者遇旧节号按本口径对照本文件 §6，勿按旧节号检索。

**与既有纪律的冲突点核对**

- **D1 防刷屏**（`tool-events.mjs` 注释「事件 token 只进头部——不进 blocks/主流」）：事件路由零改，
  照旧只更新头部；本批合并的是**内容行**（工具/文本/思考——本就属于块内容，非事件）。面板折叠态
  行数净减（有嵌套时 7 → 4 行/块）。
- **R23 递归承诺**：见 D-ST2（内容可达性保留 + 每层独立键退役——用例 3/9、AC3 钉死可达性）。
- **折叠键族**：`sub-${key}` 单键不变（面板/冻结共用）；`sub-${key}/${path}` 子块键从渲染面消失；
  `mouse.mjs` 零改动（`_foldToggle` / `_stopCol` / `_foldScroll` 通道均不依赖子块键——核对项）。
- **500 行环**：单环 500 显示行（总预算不变——原「子块计入外层配额」树记账收窄为单载体记账）。
- **60% 封顶与展开窗口**：零动（既有组件）。
- **VSC 对位面**：**无子块小节形态**（另有子标形态——VSC 嵌套活动有对位显示：chunk `sub` 行首 dim 子标，
  `thincoder-vscode/src/agent-tools/subagent-run.mjs` `runChild`·`forward`（子标挂载，as-of :26-37）、
  `webview/ui.js` `appendAdvisorChunk`（`.advisor-sub` 行首 dim 子标，as-of :41-94））；**本批后两端不再同构**
  （CLI 内层行无归属标 vs VSC 保留子标）——端差异由 AGENT-LOOP 未决行承接（镜像评估待独立批次）；
  本批 CLI-only，VSC 不动。

**受影响文件清单**（当前行数 as-of 2026-09-11 实测；文档写域另列）

| 文件 | 当前行数 | 预计增量 | 变更点 |
|---|---|---|---|
| `src/tui/subagent-blocks.mjs` | 451 | −5 ± 10 | 四处嵌套分支 append 上移；注释与陈旧指针修订 |
| `src/tui/subagent-children.mjs` | 177 | −35 ± 15 | 单环 trim 收窄；dropCarrierLines 计数真值修复；appendSubChild / trimSubTree / carrierTreeLines 删除；守护族保留 |
| `src/tui/subagent-panel.mjs` | 205 | −40 ± 10 | 子块段渲染删除（subChildHeadRow / renderSubChildSections / subChildFoldKey + 调用点） |
| `src/tui/render-segments.mjs` | 183 | −15 ± 5 | frozenSubSeg 子块树签名与子块段调用删除 |
| `src/tui/subagent-freeze.mjs` | 169 | ±5 | closeOpenSubChildren 语义保留；注释随批修订 |
| `src/tui/index.mjs` | 450 | ±2 | state.subTasks 注释修订 |
| `src/tui/mouse.mjs` | 250 | 0 | 零改（核对项） |
| `test/subagent-tail-merge.test.mjs` | 0（新增） | +140 ± 40 | 用例表 1:1（新档） |
| `../requirements/TUI.md`、本文件 | — | — | 文档写域（设计者；实现外收口项见批次档 §2） |

**测试层——用例表**

| # | 类型 | 输入 | 预期输出 | 需求回指 |
|---|---|---|---|---|
| 1 | 正常 | routeSubToolCall / Output / Token / Reasoning 直驱：`eng-coder#2/subagent` → `eng-coder#2/explore#1/read` → 输出 → 文本片 | `state.subTasks["eng-coder#2"].blocks` 依 relay 顺序含全部行；子块载体无内容增量 | F8 |
| 2 | 正常 | 上述块（≥5 行）→ renderSubagentPanel(cols) | 头行 + 3 行 tail（= 合并流末 3 非空行，含内层行文本）；无 `❯ explore#1` 子块头行、无子块折叠键；**负断言：tail 行文本不含 `explore#N` 式归属前缀**（取代决定可见后果——内层行与普通工具行同款无标） | F8 / N5 |
| 3 | 正常 | expandedBlocks 含 `sub-eng-coder#2` → 展开渲染 | 全量时间线含内层行；窗口封顶（foldCapRows）内、控制行齐备 | F8 |
| 4 | 正常 | 冻结载体（`_frozenSubTask`）渲染 | 折叠 tail 3 含内层行；`sub-` 键跨运行/冻结同键可 toggle | F8 |
| 5 | 边界 | 无嵌套块（仅外层自身行）全路径直驱 | 与改前同款（tail 3 / 展开时间线 / 头行字段零变化——零回归） | F8 |
| 6 | 边界 | 追加超限（>500 显示行——序列混入内层前缀行） | 单环 ≤500 显示行（**内层行与外层行同环计数**）；流首恰 1 条省略标记；继续追加持续守恒 | N5 |
| 7 | 边界 | 稳态追加 K 行（每行触发 trim） | 省略标记 N 恰 +K（无幽灵增量——计数真值） | N6 |
| 8 | 边界 | 连续多轮 trim（含标记已存在场景） | 标记恰 1 条且不重复 unshift；N 只随内容移除增长 | N6 |
| 9 | 边界 | 两层以上嵌套路径（`eng-coder#2/explore#1/…` 更深孙路径形态构造） | 任意深度内层行并入同一流、展开可达（R23d 内容可达性） | F8 |
| 10 | 错误 | 子块 done 后迟到 chunk（tool/text/think/model） | 丢弃——不产生新行（F2 语义不回退） | F8（纪律保全） |
| 11 | 错误 | 外层冻结 tombstone 后迟到 token | 丢弃——不复活块 | F8（纪律保全） |
| 12 | 错误 | 内层非完成事件（⟦ev⟧turn/approval 等） | 剥除不路由——不污染父块头与内容流 | F8（D1 保全） |

**验收标准（逐条回指需求；每条可机器验证）**

| AC | 判据 | 断言手段 | 回指 |
|---|---|---|---|
| AC1 | 内层行落外层 blocks 且顺序 = relay 顺序 | 直驱 routeSub* → blocks 文本/kind 序列断言 | F8 |
| AC2 | 折叠态渲染 = 头 + ≤3 行 tail（含内层最新活动）；无子块头/子块段 | renderSubagentPanel / 冻结段渲染输出断言 | F8 / N5 |
| AC3 | 展开态 = 合并流全量（任意深度可达）+ 60% 封顶零动 | 展开渲染行数与文本断言 | F8 |
| AC4 | 渲染输出零子块折叠键（`sub-*/…`）与零子块头行 | 渲染行 `_foldToggle` 集合 + 文本断言 | F8 |
| AC5 | 折叠态每块 ≤ 4 行（头 1 + tail ≤3） | 面板行数分块断言 | N5 |
| AC6 | 单环 ≤500 显示行 + 省略标记恰 1 条 | 超限直驱 → 行数/标记断言 | N5 |
| AC7 | 计数真值：稳态追加 K → N 恰 +K；多轮 trim 无幽灵增量 | dropped 值/标记文本断言 | N6 |
| AC8 | 守护不回退：done 子块迟到丢弃 / tombstone 丢弃 / 内层非完成事件剥除 | 直驱断言 | F8 |
| AC9 | 无嵌套零回归 + `sub-${key}` 键族 toggle 不变 | 既有路径断言 | F8 |

**真机 smoke（用户可见面验收步骤——2026-09-11 评审 #4 采纳；非机器判据）**：实现落盘后**新起一个 CLI
会话**（模块缓存——当次会话不生效），触发一次嵌套 explore（spawn 一个 eng-coder——其内部探索即走嵌套
路径），目视三查：① 外层块 tail 出现内层活动行；② 无 `❯ explore#N` 小节头行；③ 面板高度较批前下降
（有嵌套时折叠态 7 → 4 行/块）。执行者 = 主 agent / 用户（coder 无 TTY，不承担该步）；任一项不符 →
报父侧开修正轮（同链 docs FIRST）。依据：本批为用户可见显示面变更——项目先例「真机手感是唯一判据」
（§11 2026-08-31 性能行）+ 折叠阈值曾两轮死于真机（§10 折叠决策行）。单测（AC1..AC9）仍为机器
可验证基线。

**交付核验（2026-09-11——批次档 §5/§6）**：AC1–AC9 机器判据 = 新档 `test/subagent-tail-merge.test.mjs`
12 用例全绿（全量 363/352/0——同窗并行批次计数波动见批次档 §5）；真机 smoke 三查通过（tail 含内层行 /
无 `❯ explore#N` 小节头 / 折叠态 ≤4 行）；交付终态 clean（内部偏差审计 clean + 代码评审 pass）。

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
  （2026-08-30 判例）。子代理块键 `sub-${key}` 天然身份化（key 为 `role#id`，与行位置无关）；R23 子块键
  （`sub-${key}/${innerPath}`）已随 SUBAGENT-TAIL 批退役——折叠键只剩 `sub-${key}`（见 §6 并档节）。
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
行 `… N more earlier messages …` 维护）。**2026-09-11 修订（TUI-OOM-ROOTCAUSE 批）：分页数据源 =
会话记录存储（磁盘）——绝对序号锚定；内存层不再驻留全量（机制契约 = `SESSION.md` §14.3.6，本节
交互语义不变——见 §15）。****性能根治——三层缓存**：convCacheKey 全量 / 行级
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
  程——与手输非法 abort 同语义：无半配置落盘——D-C1）；**条目附注（note）渲染与三选择面契约见 §12**。
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
| 嵌套子代理 = 子块载体（R23） | 内层 relay 前缀 parseRelayPath 归属子块——工具式头 + 独立折叠键 + 生成侧补发射定格（supersede D-M8 子标行方案，2026-09；**本行已被 SUBAGENT-TAIL 批 supersede**——内层行并入外层流、子块小节与独立折叠键退役——现行态见 §6 并档节） |
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
| 2026-09-11 | 子代理内嵌活动并入外层流（SUBAGENT-TAIL）——四处 `routeSub*` 嵌套分支 append 上移外层 `sub.blocks`（数据流合并 D-ST1）；子块载体退居守护元数据；渲染面净删（子块段/子块头/每层折叠键）；单环 500 显示行 trim（D-ST4）；省略计数真值修复（N6） | 已实现（§6 并档节；test/subagent-tail-merge.test.mjs——12 用例；真机 smoke 过 2026-09-11） |

> **未决/待办承接（来自 2026-09-03 picker 化评审旁支）**：① picker item.note 渲染丢弃——**已收口**
> （第 20 批 §12：条目附注渲染 + 渠道警示面收口——text 内恒显）；② question options / wizard provider
> 与 picker 并行实现——**已裁定**（第 20 批 §12：分工保留 + 契约对齐——不合并三面）；（③ /config
> 数值项档位预设——已裁定不做）。

## 12. 选择面收口（第 20 批——2026-09-11）

> 本批 = 跨板块收口：**A1/A4 = TUI 面**（本节全量承载）· **A2 = 描述面**（机制落点
> `ENGINEERING-MODE.md` §2.15 D5）· **A3 = 测试面**（机制落点 `TESTING.md` §1.2）——批级 AC 表见本节末。
> 需求回指：`../requirements/TUI.md` F9（picker 附注渲染）· F10（选择面分工与契约）· N7（选择面行宽预算）。
> 批次档：`../batches/2026-09-11-TUI-SELECTION.md`。

### 12.1 问题陈述

- **A1（item.note 渲染丢弃）**：`pickers.mjs` 的 `rebuildLines` 只在 header 分支消费 `e.note`
  （as-of :66），item 分支仅渲染 `text` + `marker`（as-of :72）——`model-picker.mjs`
  `buildProviderEntries`（as-of :109-127）写在 `item.note` 的 baseURL / `(no key)` / `(不可用)`、
  `cmd-advisor.mjs` 主菜单（as-of :134）的 Provider 注记（`Provider: …`——**不含渠道警示**）
  **实际不显示**。**面归属（修正轮 #5）**：cmd-advisor 渠道警示载体 = `buildModelEntries` 渠道列表
  的 **header** note（as-of :203-207——`(no key)` / `(fetch failed: …)`）——header 分支既有消费
  （`pickers.mjs:66`）已渲染，非本批 A1 收口面（A1 只收口 `item.note` 消费；「不再最先牺牲」口径针对 item 行）。
  item 行宽 = 选择器布局约束（renderPicker 8 格余量 + 右截断）——附注渲染必须一并处理宽度预算
  （否则警示尾部被截 = 修了但看不见）。
- **A4（三套选择 UI 并存）**：picker（`pickers.mjs` / `model-picker.mjs`）· wizard provider 步
  （`wizard.mjs`——经同一 renderPicker 渲染、键位自持）· question options（`interaction.mjs` +
  `key-modes.mjs` + `layout.mjs` 输入框内嵌窗）——渲染与交互各自实现，行为差异未落档。

### 12.2 三面现状（as-of 2026-09-11 实测）

| 面 | 载体 | 渲染 | 键位 | 面特有 |
|---|---|---|---|---|
| picker | `state.picker` + `pickerStack` | renderPicker 覆盖面板（标题 + 过滤提示 + `n/m` 位置指示 + `↑ more`/`↓ more`） | ↑↓ **环绕** · PgUp/PgDn/Home/End · 输入过滤 · Enter 选 · Esc pop · Ctrl+C 取消栈顶 · 鼠标点击 | 过滤 / 鼠标 / 栈式嵌套 |
| wizard provider 步 | `state.wizard`（step="provider"） | 同一 renderPicker（`layout.mjs` overlay = picker ?? wizard；无过滤提示 / 无 `n/m`） | ↑↓ **环绕** · Enter 选 · Esc 取消整向导；**选中项无自动滚动**（`w.scroll` 恒 0） | 无过滤 / 无鼠标 / 无 PgUp 族 |
| question options | `state.question`（options 态） | 输入框内嵌窗（QWIN=5，`▸ ` 前缀；Custom 哨兵 → `✍ Custom answer…`） | ↑↓ **钳位** · Enter 确认 · Esc 取消/回选项态 | 无过滤 / 无鼠标 / 无独立面板 |

键位证据（as-of）：picker 环绕 = `key-handler.mjs:187-192`（取模）；wizard 环绕 = `key-handler.mjs:226-231`；
question 钳位 = `key-modes.mjs:93-97`（`Math.max/min` 夹取）；wizard 无滚动 = `wizard.mjs:77`（`scroll: 0` 初始化后无写点）。

### 12.3 A4 方案选型对比（本批设计主体）

| # | 候选 | 判据逐项评估 | 取舍（选定代价/权衡） | 结论 |
|---|---|---|---|---|
| 1 | **全面统一**——三面归一到 picker 组件 | question 选项面并入覆盖面板（改变提问工具交互形态 + 输入框足迹 + 自由文本逃生口路径）；wizard 流程重构（文本步 / 全跳语义重接）——触及 question 协议面、向导流程与全部相关测试 | 单一实现（长期维护收益）；代价 = 三面交互语义大改，与「不改既有交互语义」边界冲突面最大 | 否决 |
| 2 | **分工保留 + 契约对齐**（选定） | 三面职责本就不同（全功能菜单 / 首启向导 / 提问工具）；真实不一致仅 2 处（↑↓ 环绕 vs 钳位；wizard 选中项越窗不可见）；其余差异可归面特有豁免 | 成本小（2 文件小改 + 契约表落档）；用户可见不一致清零；豁免显式化（不再隐含） | **选定** |
| 3 | 仅落档（登记现状，零代码） | 差异仍在——用户已裁「两项都做」（TODO 第 20 批来源条目），登记不构成收口 | 最低成本、零行为收益 | 否决 |

### 12.4 选择面契约（本批后现行——三面同表）

| 项 | picker | wizard provider 步 | question options | 判定 |
|---|---|---|---|---|
| 职责（分工） | 全功能菜单面（配置/模型/会话等命令入口） | 首启向导面（流程 > 列表） | 提问工具面（选项 + 自由文本逃生口） | 分工保留——不合并 |
| ↑↓ 语义 | 环绕（既有） | 环绕（既有） | **环绕（本批对齐——原钳位）** | 同义键同形 |
| 选中项可见性 | 自动滚动（既有） | **自动滚动（本批补）** | 窗随选中（既有） | 选中项恒在可视窗内 |
| Enter / Esc | 选 / pop 当前层 | 选 / 取消整向导 | 确认 / 取消或回选项态 | 按面语义（共同点 = Esc 恒有效） |
| 过滤 / 鼠标 / 层级栈 | 有 | 豁免（短列表 + 键盘驱动首启） | 豁免（短列表 + 协议绑定） | 面特有豁免 |
| 位置指示（`n/m`） | 有 | 豁免（无过滤面——指示归 picker） | 豁免（输入框足迹） | 面特有豁免 |

**面特有键豁免理由（落档——防后续误判为缺陷）**：过滤/鼠标/栈为 picker 行数规模（模型清单/会话清单可长）与
操作频度（命令入口）所需；wizard 候选 ≤ 十余项且为首启一次性流程；question 选项 = 模型给的少量候选项 + 输入框足迹。
**Esc 按面语义**：picker「取消当前层」（多层面有上一步）、wizard「取消整个向导」（无上一步——全跳是既有语义）、
question「取消提问 / 回选项态」——三条语义由各自流程上下文决定，不可互换；契约只锁「Esc 恒有效」。

**未定项**：无（三面交互决策全落档；豁免项已列理由——§12.6 D-SS4/D-SS5）。

### 12.5 A1 设计（附注渲染 + 宽度预算）

**逐字渲染形态（item 行——本批后）**：`{prefix}{text}{marker}{note}`——

- prefix = `" ▸ "`（选中）/ `"   "`（未选中）——既有；
- marker = `"  " + marker`（有 marker 时）——既有（`●` = 当前会话渠道）；
- note = `"  " + note`（有 note 时）——**本批新增消费**；无 note 零追加（不产生尾随空格）。

例（cols=100，未选中、无 key 渠道）：

```
   deepseek     deepseek-chat (ctx 128K) (no key)  https://api.deepseek.com
```

**宽度预算（N7）**：行渲染宽 ≤ `cols − 8 − width(指示位)`（8 格余量 + 首/末行 `↑ more`/`↓ more`——
8 格余量口径见 §5 Ambiguous 防线；右截断 = renderPicker 既有 `sliceByWidth(text, maxW−1) + "…"`，
as-of `render-frame.mjs:106-110`）。**判定式为准（修正轮 #6）**：任意渲染行 ≤ `cols − 8`（含指示行——
指示位宽在 8 格外另扣、以 pad 补齐，行总宽仍落 8 格界内；用例 4 锚此界）。**保序 = prefix → text →
marker → note；截断从行尾开始——note（附注段）最先牺牲**；text 内警示与 `(ctx …)` / `← session`
同权（text 截断 = 既有语义）。

**产出面收口（`model-picker.mjs` `buildProviderEntries`）**：`(no key)` / `(不可用)` 自 note **上移进
`text`**——与既有状态标同簇（`(ctx …)` / `← session`；先例 = 同文件 `setKeyFlow`（as-of :398）与
wizard 的 `(added, no key)`——渠道警示本就属 text 面，model-picker 是唯一把警示放 note 的面）；
`note` 收窄为 baseURL（补充信息——预算内显示、超宽右截断可接受）。**警示不再位于最先牺牲段**（修正轮 #4——
与 text 内既有状态标同权；极端长条目 + 极窄列下随 text 尾部既有右截断语义，80 列真实条目由 AC-A1-2 锚定）。

逐字草案（`buildProviderEntries` 条目构造）——

```js
text: `${p.name.padEnd(12)} ${shown}${ctxTag}${keyStatus}${unavailable}${sessionNote}`,
marker,
note: p.baseURL,
```

（`sessionNote` = 既有 `" ← session"`；字段顺序 = 名 → 模型 → ctx → 警示 → 会话标。）

### 12.6 关键决策记录（含否决备选）

- **D-SS1 分工保留（否决全面统一）**——见 §12.3 候选 ①；合并只买来「单一实现」，却改变 question 协议面与向导流程，改动面/风险与收益不匹配。
- **D-SS2 警示上移 text（否决「新增 `flag` 字段 + 渲染层保位」）**——保位方案为 picker 通用面新增专用概念（仅 1 个消费点）、与既有状态标形成两套机制；上移方案复用既有 text 状态标惯例、零新概念，且为结构保位（不依赖宽度余量）。
- **D-SS3 question ↑↓ 对齐为环绕（否决「picker/wizard 改钳位」）**——环绕是三面中 2 面的既有行为 + 菜单循环（键按到底回起点）比死头体验自然；改动面 = 1 面 2 行。
- **D-SS4 面特有键豁免落档（否决「补齐 wizard/question 的 PgUp 族与鼠标」）**——两面的列表规模与足迹不需要；补齐属加戏（见 §12.4 豁免理由）。
- **D-SS5 Esc 语义按面保留（否决「统一 Esc 语义」）**——三个「取消」由各自流程上下文决定（见 §12.4）；契约只锁「Esc 恒有效」。
- **D-SS6 wizard 滚动改进落点 = `renderWizard`（否决「在 key-handler 里逐键调整」）**——`renderWizard` 是索引变化的单一路径（按键与初始渲染都经它）；滚动调整与选中行产出于同处可保证「产出即一致」。winH 走 `computeLayout`（同 `pickers.mjs` 口径）+ try/catch 兜底 8（无 dims/测试环境不崩）。
- **D-SS7 A1 渲染落点 = `rebuildLines`（否决「renderPicker 预算感知拼装」）**——header 分支的 note 消费就在 `rebuildLines`（既有单源）；item 分支同处补齐 = 两分支同形态、渲染层零改（截断/余量既有）；note 作为补充信息随行右截断的语义与 text 一致。

### 12.7 受影响文件（当前行数 as-of 2026-09-11 实测——口径 `split("\n").length` 含末行）

| 文件 | 当前行数 | 预计增量 | 变更点 |
|---|---|---|---|
| `src/tui/pickers.mjs` | 107 | +3 ± 2 | `rebuildLines` item 分支渲染 note（`  ` 分隔） |
| `src/tui/model-picker.mjs` | 496 | ±4 | `buildProviderEntries`：警示上移 text、note 收窄为 baseURL |
| `src/tui/key-modes.mjs` | 239 | ±4 | question options ↑↓ 环绕（上/下两分支） |
| `src/tui/wizard.mjs` | 228 | +8 ± 4 | `renderWizard`：选中行自动滚入可视窗（winH 走 `computeLayout` + try/catch 兜底） |
| `src/tui/layout.mjs` | 227 | 0 | 零改（overlay 合流既有——核对项） |
| `src/tui/render-frame.mjs` | 377 | 0 | 零改（8 格余量 + 右截断既有——核对项） |
| `src/agent/setup.mjs` | 355 | ±3 | A2：受限变体 3 个文案面同步（见 `ENGINEERING-MODE.md` §2.15 D5） |
| `test/eng-designer-role.test.mjs` | 316 | ±6 | A3：T30 自 `test(` 改 `slow(` + import；A2：T32b 扩两处 description 断言 |
| `test/tui-selection-surfaces.test.mjs` | 0（新增） | +145 ± 40 | A1/A4 用例表 1:1（新档；用例 10 = 文档面断言——修正轮 #2） |

> 文档写域（设计者）：`../requirements/TUI.md` · 本文件 · `../requirements/ENGINEERING-MODE.md` ·
> `ENGINEERING-MODE.md` §2.15 D5 · `../requirements/TESTING.md` · `TESTING.md` §1.2 · `docs/TODO.md`（状态推进）。
> **拆分评审**：`model-picker.mjs`（496——>300 advisory、≤500 硬限）本批**不拆**（±4 单点改动；再增厚即触发拆分评估）；
> `setup.mjs`（355）±3 单点文案——不拆；`test/eng-designer-role.test.mjs`（316±6——修正轮 #7）单点断言扩写（T30 归册 + T32b 扩断言）——不拆；其余档 ≤300 或无增。
> **交付自查项（修正轮 #1——时序归位）**：coder 交付时**报告** §1 模块地图所触 4 个源文件（pickers / model-picker / key-modes / wizard）**实测行数**（口径同表头注；入交付报告——**不回写文档**）；§1 地图 4 行由**设计者在收口阶段回写**（写权 = 上方「文档写域（设计者）」句、**无例外**；`ENGINEERING-MODE.md` §2.15 A2 口径不改）；新测试档入 `test/` 不入地图（地图只含 `src/tui`）。

### 12.8 测试层——用例表

> 新档 `test/tui-selection-surfaces.test.mjs`（直驱 `createPickers` / `handleQuestionMode` / `renderWizard` +
> `renderPicker` 纯函数面；构造手法照 `model-ref.test.mjs`（脚本化 showPicker）与 `mouse-sane-gate.test.mjs`（最小 state + computeLayout）；
> 用例 10 = 文档面断言——读本文件 §12.4，修正轮 #2）。
> A2 断言 = 扩既有 T32b（designer / eng-coder 双端 `prepareRun` 装配既有——零新增装配调用，规避慢门）；A3 = 该档 T30 归册自身。

| # | 类型 | 输入 | 预期输出 | 回指 |
|---|---|---|---|---|
| 1 | 正常 | `showPicker("t", [{type:"item",text:"a",note:"N1"},{type:"item",text:"b"}])` 直驱 | `state.picker.lines[0].text === " ▸ a  N1"`；`lines[1].text === "   b"`（无 note 零尾随） | F9 |
| 2 | 正常 | header 行带 note（既有消费面） | header 行文本 = ` H  h1`（零回归） | F9 |
| 3 | 正常 | 真实 `buildProviderEntries`（createModelPicker + 脚本化 showPicker 捕获）：无 key 渠道 / `_unavailable` 渠道 | 条目 `text` 含 `(no key)` / `(不可用)`；条目 `note` === baseURL | F9 |
| 4 | 边界 | `renderPicker(state, 80, panel, overlay)` 渲染超长 note 行 + 指示行 | 每行 `stringWidth ≤ 72`（cols−8）；超宽行尾 `…`；prefix + text 段保全 | F9 / N7 |
| 5 | 边界 | question options 末项按 ↓ / 首项按 ↑（`handleQuestionMode` 直驱） | selected 环绕（末→0；首→末） | F10 |
| 6 | 边界 | wizard provider 列表超窗 + index 越窗（`renderWizard` + dims 注入） | `w.scroll` 调整——选中行落 `[scroll, scroll+winH)` 内 | F10 |
| 7 | 边界 | question 自由文本态（无 options）与 Custom 哨兵项 | 自由文本态零回归；哨兵项渲染 `✍ Custom answer…` 并参与环绕 | F10 |
| 8 | 错误 | dims 缺失 / `computeLayout` 抛错（wizard 滚动计算） | winH 兜底 8——渲染不崩（同 `pickers.mjs` 兜底口径） | F10 |
| 9 | 错误 | 零回归对照：picker ↑↓ 环绕 / PgUp 钳位 / Esc pop；wizard Esc = 整向导取消；question Esc = 取消或回选项态 | 行为逐条不变 | F10 |
| 10 | 正常（文档面） | 读 `docs/design/TUI.md` §12.4 节文本（修正轮 #2） | 含表头「### 12.4 选择面契约」+ 三面列名（`picker` / `wizard provider 步` / `question options`）+ 关键行名（`↑↓ 语义` / `选中项可见性` / `面特有豁免`） | F10 |

### 12.9 验收标准（逐条回指需求；每条可机器验证）

| AC | 判据 | 断言手段 | 回指 |
|---|---|---|---|
| AC-A1-1 | item note 渲染：含 note 条目行尾 = `  ` + note；无 note 条目行形态不变 | `rebuildLines` 输出行文本断言（用例 1/2） | F9 |
| AC-A1-2 | 警示恒显：80 列渲染 provider 条目行含 `(no key)`（无 key）/ `(不可用)`（探不通） | 用例 3 + `renderPicker` 输出断言 | F9 |
| AC-A1-3 | 行宽预算：任意渲染行 ≤ `cols − 8`；超宽右截断带 `…` | 用例 4 的 `stringWidth` 断言 | N7 |
| AC-A4-1 | 契约表落档（三面 × 职责/键位/豁免——§12.4 本表） | 用例 10（读本文件 §12.4——表头 + 三面列名 + 关键行名子串断言） | F10 |
| AC-A4-2 | question ↑↓ 环绕（末项 down → 0；首项 up → 末项） | 用例 5 直驱断言 | F10 |
| AC-A4-3 | wizard provider 选中项恒在可视窗（越窗后 scroll 调整） | 用例 6 断言 | F10 |
| AC-A4-4 | 三面零回归（picker 键位 / wizard 文本步 / question Esc·Enter 语义） | 用例 7/9 + 既有 TUI 测试面 | F10 |
| AC-A2-1 | 受限变体描述同步（门清单全部拒绝动作名、无 `check`） | T32b 扩断言（双端 description）——见 `ENGINEERING-MODE.md` §2.15 D5 | A2 |
| AC-A3-1 | T30 归册（`slow(` 注册——快层 skip / 全量跑）+ 快层零超阈拦截 | 源码断言 + 快层/全量运行——见 `TESTING.md` §1.2 | A3 |

### 12.10 边界（本批不做）

- 不合并三面实现（D-SS1）；不给 wizard/question 补过滤、鼠标、层级栈（D-SS4）；不统一 Esc 语义（D-SS5）。
- 不改 picker 的过滤/鼠标/栈/键盘既有语义（本批只加 note 消费）；不改 question 自由文本态
  （TUI-INPUT-BOX（本仓）§7 权威面零改）；不改 wizard 文本步与 Esc 全跳语义。
- 不动 VSC 端（webview 无 picker/wizard 面；描述面对位见 A2 注——镜像评估归父侧）。
- 不预判其它用例的 slow 归册（A3 判据 = 快层慢门实测点名——不预判）。

## 13. 输入面小修·B1——/advisor Thinking 子菜单与 picker entries 契约（第 28 批——2026-09-11）

> 需求回指：`../requirements/TUI.md` F12（/advisor 子菜单可开 + picker entries 契约）。
> 批次档 `../batches/2026-09-11-INPUT-FIXES-SMALL.md` §1 条目 B1（Gitee #IKEZ1C）。
> 同批 B2（VSC webview Enter 语义）为 VSC 面——设计见 `WEBVIEW（VSC 仓）§9`；本板块只承载 CLI 面。

### 13.1 问题陈述（as-of 2026-09-11 逐条现场核实）

- 根因：`src/tui/cmd-advisor.mjs:89` 调 `buildThinkingEntries(agent, cfg)`——该函数 `async`（定义 :225，
  内部 `await import("../config.mjs")`）——**漏 `await`** → Promise 传入 `showPicker` → `src/tui/pickers.mjs:46`
  的 `entries.filter` 抛 `TypeError: entries.filter is not a function` → 被 `src/tui/slash-commands.mjs:120-123`
  既有拦截器落为 `[error]` 行（TUI 主循环存活——但 Thinking 子菜单**必炸**、用户不可用）。
- 对照面：Model 子面正常（`buildModelEntries` 同步——`cmd-advisor.mjs:196`）；全仓 `showPicker(` 调用点
  39 处（`src/tui` 全量 grep——2026-09-11；含 `key-handler.mjs:143` fire-and-forget 面）仅此一处漏 `await`。
- 同族陷阱：`showPicker` 入口对 `entries` 无契约校验——任何漏 `await`/错误类型都表现为下游裸抛，
  错误信息不指向调用点（诊断面缺失）。

### 13.2 B1 守卫形态裁定（2 候选——含否决理由）

| # | 候选 | 判据逐项评估 | 取舍（选定代价/权衡） | 结论 |
|---|---|---|---|---|
| 1 | **显式 TypeError**（入口首行；Promise 输入附 `await` 提示） | 把同族陷阱变显式错误（批次 §1 建议方向）；错误信息指向调用点标题；`handleSlash` 既有 try/catch 兜底为 `[error]` 行——TUI 存活面零改；39 处既有调用点全部传数组——零触达 | 代价 = 新测试锁错误形态；收益 = 同族错误一次可判（不再从 `entries.filter` 反推） | **选定** |
| 2 | 空集返回（`resolve(null)`——静默不打开） | 与 0-item 保护同形、不抛 | **静默吞掉编程错误**——菜单「打不开」无诊断（正是本 issue 的体验）；掩盖漏 `await` 类缺陷 | 否决 |

### 13.3 设计（逐字契约）

- **C-B1-1 调用点修复**（`cmd-advisor.mjs:89`）：`const entries = await buildThinkingEntries(agent, cfg)`
  （只加 `await`——`buildThinkingEntries` 语义零改）。
- **C-B1-2 入口守卫**（`pickers.mjs` `showPicker` 首行——**在 `closePicker()` 之前**：
  参数校验先行，非法输入不改变 picker 栈状态）：

```js
function showPicker(title, entries, { defaultIndex = 0 } = {}) {
  if (!Array.isArray(entries)) {
    const got = entries && typeof entries.then === "function"
      ? "a Promise (missing `await`?)"
      : `a ${entries === null ? "null" : typeof entries}`
    throw new TypeError(`showPicker("${title}"): entries must be an array — got ${got}`)
  }
  closePicker()
  ...（以下零改）
```

- **契约面**：`entries: Array` 为调用方义务（异步来源 = 调用方 `await` 后再传）；非法输入 = 同步
  `TypeError`（不静默、不裸抛；Promise 输入附 `await` 提示）；`handleSlash` 既有错误拦截语义零改。
- **零改核对**：39 处调用点全部传数组字面量/数组变量（含 `model-picker.mjs` 9 处、`cmd-config.mjs` 8 处）
  ——守卫零触达；0-item 保护（`pickers.mjs:48`）与 picker 渲染/导航语义零改。

### 13.4 关键决策记录（含否决备选）

- **D-B1-1 守卫形态 = 显式 TypeError（否决空集返回）**——见 §13.2。
- **D-B1-2 守卫落点 = `showPicker` 入口首行（否决「各调用点自检」/「`rebuildLines` 内事后防御」）**——
  入口是全部 picker 调用的单一收口；事后防御的错误信息不指向调用点，诊断价值归零。
- **D-B1-3 不做静态源码断言锁（否决「grep `await buildThinkingEntries`」形态）**——行为锁已足
  （T-B1-1 修前红/修后绿）；内部实现锁属过度测试（测试清零政策口径）。

### 13.5 受影响文件（as-of 2026-09-11 实测；口径 `split("\n").length` 含末行）

| 文件 | 当前行数 | 预计增量 | 变更点 |
|---|---|---|---|
| `src/tui/cmd-advisor.mjs` | 256 | +0 ±1 | :89 补 `await`（C-B1-1） |
| `src/tui/pickers.mjs` | 107 | +5 ±2 | `showPicker` 入口 Array.isArray 守卫（C-B1-2） |
| `test/advisor-thinking-picker.test.mjs` | 0（新增） | +90 ± 30 | 用例表 1:1（T-B1-1~T-B1-3） |

> **§1 模块地图回写**：`cmd-advisor.mjs` / `pickers.mjs` 两行行数由**设计者在收口阶段回写**
> （同 §12.7 先例：coder 交付时报告实测行数、不回写文档；写权 = 设计者、无例外）。

### 13.6 测试层——用例表（新档 `test/advisor-thinking-picker.test.mjs`；直驱、零网络、零定时器）

> 手法：脚本化 `showPicker` 驱真 `handleAdvisorCommand`（同 `provider-admission.test.mjs` 模式）+
> 真 `createPickers` 最小 ctx（同 `model-ref.test.mjs` 的最小 state 模式）；快层直跑（<800ms）。

| # | 类型 | 输入 | 预期输出 | 回指 |
|---|---|---|---|---|
| T-B1-1 | 正常（回归锁——修前红） | 脚本化 showPicker 记录调用：第一次（"Advisor"）返回 `{action:"thinking"}` 条目；第二次（"Advisor Thinking"）返回 null（Esc）；第三次返回 null | 第二次调用的 `entries` 为真数组（`Array.isArray`）、含 `action:"inherit"` 与 `effort_*` 条目；全程无异常；pushLine 收集无 `[error]` 开头行 | F12 |
| T-B1-2 | 错误 | 真 `createPickers`（最小 ctx）+ `showPicker("t", Promise.resolve([]))` | 同步抛 `TypeError`——message 含子串 `entries must be an array` 与 `await` | F12 |
| T-B1-3 | 边界（正控） | 真 `createPickers`：① `showPicker("t", [item])` → 打开；② `showPicker("t", [header-only])` → 0 item | ① `state.picker.title === "t"`（入栈）——`closePicker()` 收尾；② 立即 `resolve(null)`、不入栈（0-item 保护零回归） | F12 |

### 13.7 验收标准（逐条回指需求；每条可机器验证）

| AC | 判据 | 断言手段 | 回指 |
|---|---|---|---|
| AC-B1-1 | Thinking 子菜单可开：entries 为真数组、含条目、全程无 `[error]` | T-B1-1 | F12 |
| AC-B1-2 | 非数组 entries → 显式 TypeError（子串 `entries must be an array`；Promise 分支含 `await` 提示） | T-B1-2 | F12 |
| AC-B1-3 | 正控与 0-item 保护零回归（真数组照常打开；zero-item 不打开） | T-B1-3 | F12 |
| AC-B1-4 | 零回归：CLI 快层不新增红（基线 as-of 2026-09-11：471/458/1/12——1 红 = doc-consistency 他批档面，非本批）；39 处调用点零触达 | 快层运行 + grep 核对 | F12 |

### 13.8 边界（本批不做）

- 不改 picker 渲染/过滤/导航/栈/键位语义（TUI-INPUT-BOX（本仓）§7 权威面零改）；
- 不做异步 entries 支持（契约 = 调用方 `await`；不为 Promise 输入自动消化）；
- 不改 `handleSlash` 错误拦截语义；不重构 cmd-advisor 其余子面（Model/Guard/View 零改）；
- 不动 VSC 端（同批 B2 属 VSC 面——各端独立实现）；不新增文档档。

## 14. 用户介入提醒（attention 态——第 33 批 2026-09-11）

> 需求 = `../requirements/TUI.md` §2 F13 + §3 N9；批次档 = `../batches/2026-09-11-REVIEW-ATTENTION.md` §1 条目 G2
> （用户原话（#IKDCVV）：「对于出现需要用户介入的情况进行一个底部任务栏的变色提醒，这样就不用反复切回来」；
> 2026-09-11 13:36 批准立项 = CLI 状态栏变色 + VSC 面板/状态栏 attention 态）。
> **冻结窗口（D5）**：本节为**新增节**——§1–§13 零碰；变更记录追加一行。
> 范围：**CLI 单端设计**（VSC 对位 = 语义同源、各端独立实现——登记与所需档见 §14.9）。

### 14.1 问题陈述（现场复核——as-of 2026-09-11）

- **现状**：状态栏 = `renderStatus`（`src/tui/render-frame.mjs:208-218`）+ `buildStatusLine`（:320-376）——
  模式 / 耗时 / token / 上下文利用率 / busy（INPUT-LOCK）/ 快捷键；**无「需要用户介入」可视态**
  （全 docs 检索 `任务栏` / `attention` 零命中——本批首建）。
- **用户场景**：Agent 跑长任务或弹审批 / 提问时，用户切去别处 → 需要反复切回来查看（issue 原话）。

**既有信号面清点（全清单 + 裁决——「哪些算需要用户介入」）**：

| 信号面 | 载体（file:line as-of） | 裁决 | 理由 |
|---|---|---|---|
| 审批卡挂起 | `state.permission`（`interaction.mjs:58-99`） | **计**（blocked） | agent 阻塞——不回应则零进展 |
| 提问卡挂起 | `state.question`（`interaction.mjs:101-130`） | **计**（blocked） | 同上 |
| 回合结束等待输入 | `runAgentTurn` 顶层链尾（`agent-turn.mjs:212-323`） | **计**（awaiting） | agent 已停、无自动续跑——「不用反复切回来」的主用例 |
| picker / wizard / search / interruptPrompt | `state.picker` / `wizard` / `search` / `interruptPrompt` | 不计 | 用户自己发起——在场已由发起动作证明（提醒无意义） |
| pendingInput（挂起期输入单槽） | `suspension-drive.mjs:177-216` | 不计 | 是**用户自己的**待交接输入，非 agent 需要用户 |
| 挂起会话（池 live） | `state.suspended` / `state._suspPending` | 不计 | 自动续跑中（settle → digest 驱动）——不需要用户动作 |
| design token 门 / 工具拒绝 | 工具返回值（对话内可见） | 不计 | 无独立 UI 态；其「需要用户」部分由上述三类承接（父代理回合结束 → awaiting） |

### 14.2 方案选型对比

**表 1——触发集合**（判据来自需求层：可见提醒的语义正确性 / 噪声 / 可机械判定）

| # | 候选 | 判据逐项评估 | 取舍（选定代价/权衡） | 结论 |
|---|---|---|---|---|
| 1 | 仅阻塞两态（审批 / 提问） | 语义最纯（agent 真阻塞）；但漏掉「长任务跑完等你」主用例——恰是「不用反复切回来」指向的场景 | 覆盖不足 | 否决 |
| 2 | **阻塞两态 + 回合结束等待输入** | 覆盖「agent 阻塞 or 已停、无自动续跑」的完整集合（= 需要用户介入的本质）；两者均可机械判定 | awaiting 在空闲期常态可见——如实义（「agent 在等你」）；文案区分三态 | **选定** |
| 3 | 再扩到 picker / wizard / search | 用户自发面也提醒；但用户刚按了键——提醒 = 噪声，且语义非「agent 需要你」 | 语义错位 | 否决 |

**表 2——CLI 形态**（判据：贴合「任务栏变色」/ 实现面 / 主题兼容 / 静帧可判）

| # | 候选 | 判据逐项评估 | 取舍（选定代价/权衡） | 结论 |
|---|---|---|---|---|
| 1 | **整行注意力底色 + 提示语前缀（稳态）** | 「变色」直译——整行可扫视；单一渲染点（`renderStatus`）；稳态可静帧断言；与 VSC `statusBarItem.warningBackground` 同色系（跨端观感一致） | 需处理内部样式复位（底色重施加——实现要点见 §14.3） | **选定** |
| 2 | 仅加文案前缀（不上色） | 实现最简；但不是「变色」——不满足用户原话 | — | 否决 |
| 3 | 闪烁 / 频闪 | 更抓眼；但需**空闲重绘定时器**（现仅 processing / 子代理期有 1s ticker）——新定时器 + 耗电 + 闪屏；违「零新定时器」取向（N9②） | — | 否决 |
| 4 | 输入框边框变色 | 有 permission 先例（`inputBoxStyle` warn 边框）；但输入框在屏上可见度低于整行状态栏，且 question 态边框现为 tool 色（改动波及面大） | 提醒强度不足 + 波及 question 观感 | 否决 |

**表 3——消除条件**（判据：「查看后复位」的可判定近似 / 复位及时性 / 无新交互契约）

| # | 候选 | 判据逐项评估 | 取舍（选定代价/权衡） | 结论 |
|---|---|---|---|---|
| 1 | **任意用户输入（键盘 / 鼠标）即复位** | CLI 无焦点事件——「查看」的唯一可判定近似（人一按键即在场）；blocked 两态实时派生（提示消解即消失，零残留） | 阅读不回键时 awaiting 保持（如实义——color 在 = agent 在等） | **选定** |
| 2 | 仅下一回合开始复位 | 零新入口；但「读了不回」时长亮——复位语义弱（无法表达已读） | — | 否决 |
| 3 | 显式确认键（如 Esc / Ctrl+G） | 可精确表达已读；但引入新交互契约（用户习惯外）+ 需提示教学 | — | 否决 |

### 14.3 设计（逐字契约）

**（a）派生（纯函数——`render-frame.mjs` 导出，供测试直驱）**：

```js
// attentionKind(state): "blocked" | "awaiting" | null —— 渲染层派生（无副作用）
export function attentionKind(state) {
  if (state.permission || state.question) return "blocked"
  if (state.attentionAwaiting && !state.processing && !state.suspended && !state._suspPending) return "awaiting"
  return null
}
```

**（b）提示语（chip——逐字；kind 内优先级：blocked > awaiting；blocked 内 permission > question——与按键分发优先级同序）**：

| kind | 条件细分 | chip（逐字） |
|---|---|---|
| blocked | `state.permission` 非空 | `⚠ 等待你的审批` |
| blocked | `state.question` 非空 | `⚠ 等待你的回答` |
| awaiting | — | `⚠ 等待你的输入` |

**（c）渲染契约（`renderStatus`）**：

- attention 非 null ⇒ 整行以注意力色对包裹：**背景 = ANSI 43（黄底）+ 前景 = ANSI 30（黑字）**；
  行首 = chip，其后 ` │ ` 分隔，再接既有内容（banner 前缀 + `buildStatusLine`）——**内容零省略**。
- **底色存活**：既有内容含内部 `ansi.reset`（banner / ctx 警示段）——实现须在每次内部复位后**重施加底色**
  （建议实现：`(chip + " │ " + banners + statusLine).replaceAll(ansi.reset, ansi.reset + ATT)` 后整体 `ATT … reset` 包裹）。
  否决替代 = 剥离内部样式（会丢 ≥80% 上下文警示色与 banner 色相）。
- **宽度预算**：`statusMax = cols − 1 − width(bannerPrefix) − width(chip + " │ ")`——整行仍 ≤ `cols − 1`（既有口径；N9④）。
- **稳态（不闪烁）**：attention 色随帧派生——无空闲重绘定时器（N9②）。
- **负向（零侵入锁）**：attention 为 null ⇒ 输出与改动前**逐字节等价**（实现约束 = 平态不经注意力包裹路径、字节面零注入；机判口径 = 零注意力序列（`\x1b[43m` 零出现）+ strip-ANSI 文本无 chip——与 N9 / T-AT2 同口径）。

**（d）置位（1 点——回合链尾）**：`agent-turn.mjs` 顶层链尾（队列续发循环与挂起会话退出**之后**、函数自然结束前），
谓词 = 导出纯函数（可直测）：

```js
export function userNeededAtTurnEnd(state, agent, skipSession) {
  return !skipSession && !state.suspended && !state._suspPending && !poolLive(agent)
      && state.queue.length === 0 && !state.processing
}
// 命中 ⇒ state.attentionAwaiting = true; render()
```

- 排除项语义：`skipSession`（digest / 会话内回合——由外层链尾统一置位）· 挂起两态 / 池 live / 队列非空
  （自动续跑中——不由用户接手）。
- 中断结束（Ctrl+C 停回合）与错误结束同样置位（agent 已停、等用户——语义一致）。

**（e）清位（2 点——输入即在场）**：

- 键盘：`key-handler.mjs` `onKeypress` 入口（模态分派**之前**）——清位 + 仅当原值为真时 `render()`。
- 鼠标：`index.mjs` stdin `data` 处理器内——滚轮分支与 `onMouseClick` 调用前（单点覆盖滚轮 / 点击）。
- blocked 两态无需清位（实时派生——提示消解即消失；零残留）。

**（f）state 字段**：`attentionAwaiting: false`（`index.mjs` state 字面量——默认关；不落盘、不进会话）。

### 14.4 受影响文件全清单（as-of 2026-09-11 实测——含修正轮复核；行数口径 = `N lines total`）

**实施域（eng-coder 写域——5 改 + 1 新）**

| # | 文件 | 当前行数 | 动作 | 预计增量 | 档位结论 |
|---|---|---|---|---|---|
| 1 | `src/tui/render-frame.mjs` | 377 | 改（`attentionKind` 派生 + chip + 底色包裹 + 宽度预算） | +~32 | >300 advisory（存量 377 → 交付 ~409；拆分评估见 §14.9 #4） |
| 2 | `src/tui/ansi.mjs` | 49 | 改（`bg` 序列 + 注意力色对常量） | +~5 | ✓（≤300） |
| 3 | `src/tui/agent-turn.mjs` | 324 | 改（`userNeededAtTurnEnd` 谓词 + 链尾置位） | +~12 | >300 advisory（交付 ~336；净增小，沿存量先例） |
| 4 | `src/tui/key-handler.mjs` | 441 | 改（`onKeypress` 入口清位） | +~5 | >300 advisory（交付 ~446 < 500 ✓） |
| 5 | `src/tui/index.mjs` | 450 | 改（state 字段 + 鼠标输入路径清位） | +~8 | >300 advisory（交付 ~458 < 500 ✓） |
| 6 | `test/attention-state.test.mjs` | 新 | 新增（T-AT1–T-AT8） | ~200 | 新档 ≤500 ✓ |

**文档域（eng-designer 写域——本设计者已落）**

| 文件 | 行数注记（批次前 → 落档后） | 变更 |
|---|---|---|
| `docs/requirements/TUI.md` | 68 → 76 | §2 F13 + §3 N9 + §4 边界行 + header 批次注 + 变更记录（含修正轮行）——**已落** |
| `docs/design/TUI.md` | 1125 → 1344 | §14 + 变更记录（含修正轮行；计数含末行 EOL 归一 +1）——**已落** |

测试基建：CLI 无注册清单档——`test/*.test.mjs` glob 自动发现；`input-lock.test.mjs` 的桩手法可复用
（`createKeyHandler` 桩 ctx 直驱按键 / `renderStatus` 直调）——零 TTY、零定时器悬挂、微秒级。

### 14.5 关键决策记录（含否决备选）

| # | 决策 | 理由 / 否决备选 |
|---|---|---|
| D-AT1 | **触发集合 = 阻塞两态 + 回合结束等待输入** | 表 1——「agent 阻塞或已停、无自动续跑」完整集合。否决：仅阻塞两态（漏主用例）· 扩到用户自发面（语义错位） |
| D-AT2 | **CLI 形态 = 整行注意力底色 + chip（稳态）** | 表 2——「变色」直译 + 单一渲染点 + 静帧可判。否决：仅文案（非变色）· 闪烁（需新定时器）· 边框（强度不足） |
| D-AT3 | **色对 = 黄底黑字（ANSI 43 / 30）** | 与 VSC warningBackground 同色系（双端观感一致——语义同源）；黄底黑字不依赖终端主题配色（浅深色终端均可见）；沿用既有 C.warn 语族 |
| D-AT4 | **消除 = 任意用户输入（键 / 鼠）+ blocked 实时派生** | 表 3——「查看」的可判定近似；零新交互契约 |
| D-AT5 | **稳态不闪烁 / 零新定时器** | 频闪需空闲重绘（现无此定时器）；稳态色已满足「扫一眼即知」（N9②） |
| D-AT6 | **置位点 = 顶层链尾（非回合末 finally）** | finally 后还有队列续发 / 挂起会话（digest 自动消费）——在那之后才真正「无人接手」；避免 digest 间歇误报 |
| D-AT7 | **chip 中文（与 busy 提示同语族）** | TUI 现状混排（busy 提示中文 / 键位提示英文）；用户面向提示用中文与「主会话处理中」同族 |
| D-AT8 | **CLI 单端本批**；VSC 对位登记（§14.9 #1/#2） | 各端独立实现纪律；VSC 同构面（status bar waiting 态已存 / 面板 attention 待建）如实登记 |

### 14.6 与既有纪律的冲突点核对

| 纪律 / 既有节 | 核对结论 |
|---|---|
| **§4 按键分发** | 清位点在模态分派**之前**——只复位渲染态字段，**不改变任何按键语义**（模态判定 / busy 门禁 / 编辑路径零改）；blocked 态下首个按键照常被模态消费 |
| **§8 回合驱动** | 置位点 = 顶层链尾（队列续发 / 挂起退出之后）——挂起状态机（`suspensionSession`）语义零改；digest 回合（skipSession）不置位 |
| **§5 渲染管线 / 宽度纪律** | 状态行仍 ≤ `cols − 1`（chip 宽度计入预算）；不新增面板 / 不新增行 |
| **INPUT-LOCK（busy 提示）** | 零改——processing 期 attention 派生为 null（blocked 除外——审批 / 提问可发生于回合中，属正确提醒） |
| **TUI-INPUT-BOX §7.2（question 自由文本态）** | 零改（不改 question 键集 / 光标 / 布局） |
| **D2 单一权威源** | 触发 / 形态 / 消除只在本节详述；需求 F13 引用不重述逐字文案 |
| **D3 计数·枚举** | 用例 8（T-AT1–T-AT8）· AC 6（AC-AT1–AC-AT6）· 实施域 6 项（5 改 + 1 新）· 文档域 2 档——声明与列表逐条一致（本节计数行同表） |
| **D4 指针纪律** | 指针 = `文档:节`；代码锚 file:line 标 as-of |
| **D5 冻结窗口** | 本节只**新增节** + 变更记录一行——§1–§13 零碰 |
| **D6 回读核对** | 需求 F13 与本节落笔后回读核实；实施面验收含静态锚（AC-AT6） |
| **D7 变更留痕** | 本档变更记录追加一行；需求档加 header 批次注 + 变更记录行 |
| **零新依赖 / 零新定时器** | 色对 = 裸 ANSI 序列（`ansi.bg`——零依赖）；无常驻定时器新增（N9②） |
| **多实现面纪律（双端）** | CLI 单端本批；VSC 登记（§14.9 #1/#2——不静默、不跨端追赶） |

### 14.7 测试层：用例表（正常 / 边界 / 错误）

| 用例 | 类别 | 输入 | 预期输出（断言） | 映射 |
|---|---|---|---|---|
| T-AT1 | 正常 | `attentionKind(state)` 矩阵：permission / question / awaiting（条件齐备）/ permission+processing 同真 / 平态 | `"blocked"` / `"blocked"` / `"awaiting"` / `"blocked"`（processing 豁免仅及 awaiting——F13④ 消歧锁）/ `null`（纯函数直测） | F13 |
| T-AT2 | 正常 | `renderStatus` 两态（80 列）：awaiting vs 平态 | awaiting 输出含 `\x1b[43m` 与 `⚠ 等待你的输入`；strip-ANSI 后以 chip 开头且含常态字段；平态输出 **不含** `\x1b[43m` 且 strip-ANSI 文本无 chip（负向锁——与 N9 判定句同口径） | F13 / N9 |
| T-AT3 | 正常 | blocked 优先级：permission 单真 / question 单真 / permission+awaiting 同真 | `⚠ 等待你的审批` / `⚠ 等待你的回答`；blocked 胜 awaiting（优先级锁） | F13 |
| T-AT4 | 边界 | `createKeyHandler` 桩直驱：置位 awaiting → 字符键 / 方向键 / Esc | `attentionAwaiting === false` 且 render 被调（清位一次） | F13 判定句② |
| T-AT5 | 边界 | 鼠标路径直驱（滚轮 / 点击桩）：置位 awaiting → 事件 | 清位 + render | F13 判定句② |
| T-AT6 | 边界 | `userNeededAtTurnEnd(state, agent, skipSession)` 矩阵：正常空闲 / skipSession / suspended / _suspPending / 池 live / queue 非空 / processing | `true` / `false`×6（逐条件） | F13（置位条件） |
| T-AT7 | 错误 | 非触发态渲染：picker / wizard / search / interruptPrompt / processing（无审批/提问） / suspended（awaiting=false） | `attentionKind → null`；渲染零注意力序列 | F13 判定句④ |
| T-AT8 | 边界 | 静态锚：`src/tui/render-frame.mjs` / `agent-turn.mjs` 源文本 | 零新增 `setInterval`（N9②）；`attentionKind` / `userNeededAtTurnEnd` 导出在位；**置位接线锚**：`agent-turn.mjs` 含 `userNeededAtTurnEnd` 调用 + `attentionAwaiting = true` 置位（D-AT6 顶层链尾接线——机判） | N9 · D-AT6 |

> 测试基建：`createKeyHandler` 桩 ctx（同 `input-lock.test.mjs` 手法）+ `renderStatus` / 纯函数直调——零 TTY、
> 零定时器悬挂、微秒级；新档由 glob 自动发现。

### 14.8 验收标准（逐条回指需求——每条可机器验证）

| AC | 验收内容（机判） | 回指 |
|---|---|---|
| AC-AT1 | 派生确定：T-AT1 / T-AT7 绿；`attentionKind` 纯函数（无 I/O、无状态） | F13 / N9 |
| AC-AT2 | 变色 + 文案：T-AT2 绿（色序列 + chip 逐字 + 平态负向锁：零序列 / 无 chip） | F13 / N9 |
| AC-AT3 | 三态优先级：T-AT3 绿（blocked > awaiting；permission > question） | F13 |
| AC-AT4 | 消除：T-AT4 / T-AT5 绿（键 / 鼠标清位 + 重绘） | F13 判定句② |
| AC-AT5 | 置位条件：T-AT6 绿（七条件矩阵——skipSession / 挂起两态 / 池 live / 队列 / processing 全排除） | F13（置位） |
| AC-AT6 | 零侵入 + 零回归 + 档位：T-AT8 绿（零新定时器 / 导出在位 / 置位接线锚）；`cd thincoder && node test/run-fast.mjs` 全绿（含 `input-lock.test.mjs` 既有锁档）；受影响文件 ≤ 档位帽（实测对表）；`node scripts/check-doc-width.mjs` 新增违规 0；VSC 仓零改动 | N9 |

### 14.9 边界（本批不做）+ 登记（VSC 对位）

**本批不做**：

- 不改状态栏既有信息面与既有按键 / 模态 / 挂起语义；不做闪烁 / 系统级通知 / 终端标题改写 / 响铃
- 不引入空闲重绘定时器；不落盘（attention 为呈现态）；不做「已读回执」持久化
- 不做 VSC 端实现与 VSC 文档（登记见下——各端独立实现纪律）；不碰提示词 / 评审链 / 其它板块

**登记（VSC 对位——后续批建议，父侧排程）**：

1. **VSC 端 attention 态**：现状盘点（as-of）——`thincoder-vscode/src/extension/chat-panel.mjs:152-177`（`_setStatus` 三态：
   idle / running / waiting）+ `:202-206`（`_refreshStatus`——权限 / question 队列非空 = waiting 优先）；
   `permission-gate.mjs:28/58` 与 `panel-callbacks.mjs:67` 的 waiting 设置点；webview 侧状态行 = `webview/status-bar.js`
   （`#status-line` 单 writer）。**已覆盖面**：审批 / 提问挂起已有 waiting 态（`statusBarItem.warningBackground`）——
   与 CLI blocked 类同义。**待建面**：回合结束等待输入（idle 态细分）+ 面板内 attention 态（webview 可见形态）。
2. **VSC 所需档 + 最小改动面（父侧排程输入）**：设计档 = `WEBVIEW（VSC 仓）`（§8.4 忙态收敛 / 状态栏——现状权威）
   新增 attention 语义节 + 变更记录；需求面登记 = `REQUIREMENTS（VSC 仓）`；实现面（改动预估）= `chat-panel.mjs`
   （`_setStatus` / `_refreshStatus` 增态——回合结束注意力判据）、`webview/status-bar.js` + `webview/*.css`
   （面板 attention 渲染）、`locales/{en,zh}.json`（词键——VSC 端 i18n 硬项）、新测试档须注册 `test/files.mjs`（VSC 显式清单）。
3. **跨端语义同源锚**：三触发态语义 / 消除语义（用户输入或提示消解）与本端一致——各端原文自持，不做 byte-identical。
4. **`render-frame.mjs` 拆分的后续评估**：本节交付 ~409 行（>300 advisory 存量先例）；若状态栏渲染继续增厚
   → 按 §12.7 先例评估拆出独立 `status.mjs`（本批不拆——净增 ~32 行、职责未变）。

**计数（D3）**：用例 **8**（T-AT1–T-AT8）· AC **6**（AC-AT1–AC-AT6）· 实施域 **6 项**（5 改 + 1 新）· 文档域 **2 档**；需求 = F13 + N9。

---

## 15. 长会话内存有界：分页源下沉 + 显示层额度（TUI-OOM-ROOTCAUSE 批——2026-09-11）

> 需求：`../requirements/TUI.md` F6（修订）+ N10。来源：批次档
> `../batches/2026-09-11-TUI-OOM-ROOTCAUSE.md` §1（勘察 C3：行数上限 ≠ 内容上限、多路径绕过裁剪）。
> 本批两块：**15.A 分页源下沉**（机制契约在 `SESSION.md` §14.3.6——本节只落 TUI 面落点）；
> **15.B 显示层额度**（本节主体）。

### 15.1 问题陈述（证据 as-of 2026-09-11——实读）

| # | 事实 | 证据（file:line） |
|---|---|---|
| 1 | `state.lines` 十条写入路径中**只有 pushLine 有环**（5000 行 → splice 1000）——工具块 / 冻结子代理块 / 冻结评审行 / 恢复与翻页行全部绕过 | `src/tui/index.mjs:278-289`（唯一裁剪）· `:292-296`（pushLabel 裸推）· `tool-events.mjs:128-141` · `:264-268` · `subagent-freeze.mjs:86-89` · `startup.mjs:129/134/155-163` |
| 2 | 工具块：`output` 环按**条目数**（200）计——无 `\n` 的巨 chunk = 1 条任意大；`result` 只按行数（400）——单行任意大；`argsJson` **完全无上限**（`write`/`apply_patch` 整文件内容进显示层） | `tool-display.mjs:21/77-87` · `tool-events.mjs:313-319` · `tool-args.mjs:78-81`（`JSON.stringify(args, null, 2).split("\n")`） |
| 3 | 子代理块：500 行环按 `\n` 计数——无换行 chunk 净增 0 行 → 500 环永不触发、文本无界；`_lineCount` 合并追加只记行数 | `subagent-children.mjs:19/22-25/68-80` · `subagent-blocks.mjs:338-356`（raw 直灌） |
| 4 | 评审载体：`_advisorBlocks` 流式累积与 `_frozenAdvisor` 冻结文本均无任何上限 | `tool-events.mjs:301-305` · `:256-269` |
| 5 | 主流缓冲 `state.streaming`/`state.reasoning` 逐 token 无界累积、flush 成**单行**——5000 行环对此无效 | `tool-events.mjs:72/80` · `:52-60` |
| 6 | 恢复/翻页行 unshift 进 `state.lines` 且**无淘汰**——翻页到底 ⇒ 全会话常驻 | `startup.mjs:119-136/142-170` |
| 7 | 同内容同时驻留 3–4 份：历史对象 1 份 + 块 result 行数组 + output 流式环 + 渲染 `_convCache` 整屏行 | `render-conversation.mjs:26/394`（`_convCache`）· 三载体见上 |
| 8 | 次要无界：搜索匹配按出现次数累积（`state.search.matches`） | `key-handler-search.mjs:11-22` |

### 15.2 方案选型对比

**表 1：额度计量口径**

| # | 候选 | 评估 | 结论 |
|---|---|---|---|
| 1 | **UTF-16 码元（`text.length`）** | 与 JS 字符串内存近似（2B/码元）；确定性、零平台差异、O(1) 计长；显示宽度另由 stringWidth 管 | **选定** |
| 2 | UTF-8 字节（`Buffer.byteLength`） | 更贴 I/O 口径；每次计长 O(n)（大文本反复计数成本） | 否决（无 I/O 需求面） |
| 3 | 显示列宽（stringWidth） | 与终端表现贴；CJK 计数贵、折叠/截断语义耦合渲染 | 否决 |

**表 2：执行点（在哪里裁）**

| # | 候选 | 评估 | 结论 |
|---|---|---|---|
| 1 | **单点包装 + 载体自记账**：文本入载体前过 `capText`；块/环载体按双维（行数 + 字符）记账；`state.lines` 加总量字符账 | 覆盖全部十条路径；裁剪点靠近来源；与既有行数环同构（扩展非替代） | **选定** |
| 2 | 渲染期裁剪（buildConvLines 前统一裁） | 存储已无界（迟到）——内存峰值仍在 | 否决 |
| 3 | 只堵最大的（argsJson/子代理块） | 漏评审载体与流式缓冲；不满足 N10 全覆盖 | 否决 |

**表 3：超限处置形态**

| # | 候选 | 评估 | 结论 |
|---|---|---|---|
| 1 | **截断 + 标记行**（头保 + 尾标记；块级 = 裁最旧 + 既有「已省略 N 行」标记） | 与既有省略标记族（N5/N6）同语义；用户可感知；全文在会话记录 | **选定** |
| 2 | 静默截断 | 违背「省略计数真值」精神（用户看不见被裁） | 否决 |
| 3 | 落盘 + 指针行 | 显示层无按需回读交互面（另案）；降级复杂 | 否决（登记） |

### 15.3 契约（实现对象）

**15.3.1 常量（单源 = `src/tui/display-budget.mjs`——新模块）**

| 常量 | 值（UTF-16 码元） | 作用面 |
|---|---|---|
| `LINE_MAX_CHARS` | 64_000 | pushLine / pushLabel / 恢复行 / 流式 flush 行——超限截断加尾标记 |
| `ARGS_JSON_MAX_CHARS` | 24_000 | `_toolBlock.argsJson` 总量（超出：尾截断 + 标记；首行保真） |
| `TOOL_RESULT_MAX_CHARS` | 64_000 | `_toolBlock.result` 行数组总量（与既有 400 行双维；尾行加标记） |
| `TOOL_OUTPUT_ENTRY_MAX_CHARS` | 8_000 | 输出环单条目（超出：尾截断 + 标记） |
| `TOOL_OUTPUT_TOTAL_MAX_CHARS` | 128_000 | 输出环总量（超出：与既有 200 条目环同款丢最旧） |
| `SUB_BLOCK_CHAR_LIMIT` | 128_000 | 子代理块单环（与 500 显示行双维；裁最旧——省略标记 N6 语义不变，行数照记） |
| `ADVISOR_TEXT_MAX_CHARS` | 128_000 | `_advisorBlocks` 累积 + `_frozenAdvisor`（头 32K + 尾 96K 保裁决尾部 + 中段标记） |
| `STREAM_MAX_CHARS` | 256_000 | `state.streaming` / `state.reasoning` 累积（头尾保真；flush 行再受 `LINE_MAX_CHARS`） |
| `LINES_CHAR_BUDGET` | 2_000_000 | `state.lines` 全部行与载体文本总量（超出：与 5000 行环同款裁头 1000 行 + `shiftFreezeAnchors` + 收据行） |
| `SEARCH_MATCH_CAP` | 10_000 | 搜索匹配计数（超出截断 + 提示行） |

**15.3.2 辅助 API（`display-budget.mjs`）**

```
capText(text, { max, keepHead, keepTail, marker })   // 头尾保真 + 中段标记；≤max 时零拷贝返回
appendCapped(prev, add, opts)                        // 流式累积（滞后水位：超 hard 裁至 keep——摊还 O(1)）
lineChars(l)                                         // 一行 + 其 _toolBlock/_frozenSubTask/_frozenAdvisor 字段计长
syncLineBudget(state, { pushLineLike })              // state.lines 总量对账（超限裁头——复用 5000 环机制）
```

> 纯函数本体（`capText` / `appendCappedText`）住 `src/text-budget.mjs`（零依赖）——与 agent 侧
> 捕获共用（`AGENT-LOOP.md` §23.3.1，单一来源）；本模块只承载 TUI 面常量与 `lineChars`/
> `syncLineBudget` 对账。

- 标记形态（逐字——进测试断言）：行截断 `… [line truncated: N chars omitted]`；子块沿用
  `…（已省略 N 行）`（N6 口径不变）；评审/流式 `… [middle truncated: N chars omitted]`。
- 状态对象零新增语义字段于 agent；`state._linesChars`（TUI state 内部账）为唯一新增状态位。

**15.3.3 落点（十条路径逐一）**

| 路径 | 落点改动 |
|---|---|
| pushLine / pushLabel | 入口 `capText(LINE_MAX_CHARS)` + `syncLineBudget` |
| 工具块载体 | `tool-events.mjs` 建块/落结果处按 ARGS/RESULT/OUTPUT 常量裁；`tool-display.mjs` 辅助 |
| 子代理块 | `subagent-children.mjs` `pushBlock`/`dropCarrierLines` 加字符维（`carrier._charCount`） |
| 评审块 | `tool-events.mjs` 累积与冻结两处 `appendCapped`/`capText` |
| 流式缓冲 | `tool-events.mjs` onToken/onReasoning `appendCapped` |
| 恢复/翻页 | `startup.mjs` 行构造后过 `capText`；总量的裁头由 `syncLineBudget` 兜（翻页页内不裁头——保锚定） |
| 搜索匹配 | `key-handler-search.mjs` 计数上限 |
| 冻结子代理 splce 插入 | 经 `syncLineBudget`（splice 路径同款对账） |

**15.3.4 双维记账不变式**

- 每个环/块：行数维与字符维**同时**满足（先到先裁）；被裁内容计入既有省略 N（行）——
  字符维裁剪时按被裁文本行数折算 N（无幽灵计数——N6）。
- `state.lines` 总量 = Σ `lineChars(l)`——在 push/splice/unshift 后对账（增量维护：
  push 加分、裁头减分；测试直算对照）。

### 15.4 关键决策记录（含否决备选）

- **D-TB1 口径 = UTF-16 码元**（表 1）；需求所称「字节维度」的实现口径即此（内存近似）。
- **D-TB2 执行点 = 单点包装 + 载体自记账**（表 2）；不引入渲染期裁剪（迟到）。
- **D-TB3 处置 = 截断 + 标记**（表 3）；落盘指针行登记为后续项（显示层无回读交互）。
- **D-TB4 常量集中 `display-budget.mjs`**（D2 单源）：数值改动一处生效；测试导入常量断言。
- **D-TB5 不碰行数口径**：5000 行环 / 500 行块环 / 200 条目环原样保留，字符维为第二维——
  既有 N5/N6 语义与既有测试锁逐字不动。
- **D-TB6 分页源下沉不在本节重述**（机制契约 = `SESSION.md` §14.3.6）；本节只保证
  「翻页行过额度包装 + 总量对账」。

### 15.5 受影响文件（as-of 2026-09-11 实测；口径 `split("\n").length` 含末行；「实现后同步」两行 = 2026-09-12 实测）

| 文件 | 当前行数 | 预计增量 | 变更点 |
|---|---|---|---|
| `src/tui/display-budget.mjs` | 新 | +120 ± 30 | 常量 + capText/appendCapped + 对账 |
| `src/tui/index.mjs` | 455 | +10 | pushLine/pushLabel 过额度；state 账初始化 |
| `src/tui/tool-events.mjs` | 408 | +18 | 载体额度（args/result/output）+ 评审/流式 |
| `src/tui/tool-display.mjs` | 144 | +6 | result 总量裁剪接入 |
| `src/tui/tool-args.mjs` | 81 | +8 | `toolArgsLines` 总量额度 |
| `src/tui/subagent-children.mjs` | 163 | +26 | `_charCount` 双维记账 + 裁行折算 |
| `src/tui/subagent-blocks.mjs` | 436 | +6 | 冻结/压缩面板路径过账 |
| `src/tui/startup.mjs` | 266 | +10（含 15.A） | 恢复/翻页行过 `capText`；总量对账接入 |
| `src/tui/key-handler-search.mjs` | 114 | +6 | 匹配计数上限（行数修正轮 #12 刷新） |
| `src/tui/subagent-freeze.mjs` | 170 → 176（实测） | +6 | 冻结子代理 splice 行经 `accountLine` 入 `state.lines` 总量账（§15.3.3 落点表末行）——**实现后同步（2026-09-12）**；声明外触碰补行（coder 披露） |
| `src/tui/cmd-clear.mjs` | 21 → 23（实测） | +2 | 清屏行集清空时 `_linesChars` 同步归零（§15.3.2 唯一新增状态位）——**实现后同步（2026-09-12）**；声明外触碰补行（coder 披露） |
| `test/tui-memory-budget.test.mjs` | 新 | +190 ± 40 | 用例表 1:1（快层——直驱、零定时器） |

> 拆分结论（含实现后同步 2026-09-12 补行）：全部 ≤500；`subagent-blocks.mjs`（436+6）与
> `tool-events.mjs`（408+18）不越限；`tool-args.mjs`（81）单点扩展、不拆。表内两条「实现后同步」
> 行为**声明外触碰**补行（coder 披露——`subagent-freeze` 系 §15.3.3 落点表末行已要求、`cmd-clear`
> 系字符账归零联动），均单点接入、不拆。

### 15.6 用例表（正常 / 边界 / 错误）

| # | 层 | 场景 | 输入 | 预期输出 | 回指 |
|---|---|---|---|---|---|
| T-TB1 | 快层 unit | 单行巨内容（pushLine） | 10MB 无换行文本 | 行文本长 ≤ `LINE_MAX_CHARS`+标记；标记串逐字 | N10① |
| T-TB2 | 快层 unit | 工具参数额度 | `write` 大 content 的 argsJson | 总量 ≤ `ARGS_JSON_MAX_CHARS`+标记；首行完整 | N10② |
| T-TB3 | 快层 unit | 工具结果单行巨量 | 400 行内单行 5MB | 结果总量 ≤ `TOOL_RESULT_MAX_CHARS`+标记 | N10② |
| T-TB4 | 快层 unit | 输出环双维 | 300 条 × 大 chunk（含无 `\n` 巨块） | 条目 ≤200、单项 ≤8K、总量 ≤128K；丢最旧 | N10② |
| T-TB5 | 快层 unit | 子代理块无换行巨 chunk | 1MB 无 `\n` chunk × 多次 | `_charCount` ≤ `SUB_BLOCK_CHAR_LIMIT`；省略标记 N 单调、无幽灵 | N10②/N6 |
| T-TB6 | 快层 unit | 评审块 | 流式 1MB think + 冻结 | 累积 ≤128K（头 32K/尾 96K）；冻结文本 ≤128K；尾（Verdict）保留 | N10② |
| T-TB7 | 快层 unit | 流式缓冲 | onToken 累积 5MB | `state.streaming` ≤256K；flush 行再 ≤ `LINE_MAX_CHARS` | N10② |
| T-TB8 | 快层 unit | `state.lines` 总量 | 各路径混合塞入至超 2M | 裁头生效（含冻结锚点平移）；总量 ≤ 预算+在途单行 | N10③ |
| T-TB9 | 快层 unit | 翻页不无界 | 翻页 50 页（模拟 1000 条） | 总量 ≤ 预算；锚定滚动补偿不破 | N10④/F6 |
| T-TB10 | 快层 unit | 搜索匹配上限 | 单字符查询 × 超长行 | 匹配数 ≤ `SEARCH_MATCH_CAP`；提示行出现 | N10（次要面） |

### 15.7 验收标准（逐条回指需求——每条可机器验证）

| AC | 回指 | 判据（机验） |
|---|---|---|
| AC-TB1 | N10① | T-TB1 绿；grep：pushLine/pushLabel 入口经 `capText`（单点） |
| AC-TB2 | N10② | T-TB2/3/4/5/6/7 绿；常量单源（值从 `display-budget.mjs` 导入断言） |
| AC-TB3 | N10③ | T-TB8 绿（对账直算 = 增量账，双算法对照） |
| AC-TB4 | N10④/F6 | T-TB9 绿；`startup.mjs` 翻页路径无 `full.length − loaded` 旧式（grep 零命中） |
| AC-TB5 | N5/N6 零回归 | 既有族全绿：`test/tui-selection-surfaces.test.mjs`、`test/arrow-editing.test.mjs`、`test/attention-state.test.mjs`、`test/input-lock.test.mjs`、`test/tui-exit-cleanup.test.mjs`；行数环既有断言逐字不动 |
| AC-TB6 | 行数纪律 | 触碰档 ≤500；`node scripts/check-doc-width.mjs` 本批新增违规 0 |

### 15.8 边界（本批不做）

- 不做显示层按需回读交互（截断全文在会话记录——回读面另案）；
- 不做渲染期裁剪 / 虚拟滚动（改动面另案）；不改折叠/展开/锚定既有语义；
- 不改 `_convCache` 结构（其特征为「随 state.lines 有界化自然有界」——本节可证：缓存键含行数/文本引用，
  裁剪后旧行随 WeakMap/键失效释放）；
- VSC webview 面零改动（其历史窗口显示面独立）。

## 变更记录

- 2026-09-12（TUI-OOM-ROOTCAUSE 批·实现后同步）：§15.5 补两行——`subagent-freeze.mjs` 170 → 176
  （冻结 splice 行经 `accountLine` 入 `state.lines` 总量账〔§15.3.3 落点表末行〕）· `cmd-clear.mjs`
  21 → 23（清屏行集清空时 `_linesChars` 归零〔§15.3.2〕）；均为**声明外触碰**的实现后补行（coder 披露）。
  纯实现态对齐、零语义变更。
- 2026-09-11（TUI-OOM-ROOTCAUSE 批）：新增 §15（分页源下沉 TUI 落点 + 显示层额度：常量表 /
  辅助 API / 十条路径落点 / 决策 D-TB1–D-TB6 / 用例 T-TB1–T-TB10 / AC-TB1–AC-TB6）；需求 =
  `../requirements/TUI.md` F6 修订 + N10；机制契约（分页）指 `SESSION.md` §14.3.6；批次档
  `../batches/2026-09-11-TUI-OOM-ROOTCAUSE.md`。
- 2026-09-11（TUI-OOM-ROOTCAUSE 批·设计评审轮次 1 修正轮）：§15.5 行数实测刷新
  （`key-handler-search.mjs` 114——修正轮 #12）；页沿 ±1 / 恢复描述符 `total` 口径的契约修正在
  `SESSION.md` §14.3.6（修正轮 #4——本档 15.A 不重述，D-TB6）。
- 2026-09-11（交付后设计刷新——第 20/28/31 批面触行）：§1 模块地图行数回写（key-handler 461 · key-modes 294 · render 285 · layout 237 · clipboard 181 · pickers 118 · wizard 242）；§2 `interruptPrompt` 形态注；§4 状态优先级行序修正（interruptPrompt 先于 picker 栈/wizard）+ 「正常输入编辑」括注补竖移/历史（第 31 批）。纯登记/措辞、零语义。
- 2026-09-11（第 33 批·修正轮——设计评审轮次 1 后）：§14.3 负向锁补机判口径（零序列 + strip-ANSI 无 chip）· T-AT1 补「permission+processing 同真 → blocked」矩阵行 · T-AT2 / AC-AT2 负向锁同口径 · T-AT7 输入行收紧 · T-AT8 补置位接线锚（D-AT6 机判）· §14.4 行数复核（key-handler 440 → 441）。消歧与静态锚、零新语义。
- 2026-09-11（第 28 批·修正轮——设计评审轮次 1 后）：§13.3 契约面 await 提示措辞对齐（「Promise 输入附 `await` 提示」——与 §13.2 / AC-B1-2 同款；需求档 F12 同改）。纯措辞、零语义。
- 2026-09-11（第 33 批）：§14 新增——用户介入提醒（attention 态：触发集合清点与裁决 / CLI 整行变色 + chip 逐字 / 置位·清位契约 / 用例 T-AT1–T-AT8 / AC-AT1–AC-AT6；VSC 对位登记 §14.9）；需求 = `../requirements/TUI.md` F13 + N9；批次档 `../batches/2026-09-11-REVIEW-ATTENTION.md`。

- 2026-09-11（第 28 批·输入面小修 B1——设计落档）：新增 §13（/advisor Thinking 子菜单 + `showPicker` entries 契约：根因/守卫选型/逐字契约/受影响文件/用例 T-B1-1~3/AC-B1-1~4）；需求 = `../requirements/TUI.md` F12；批次档 `../batches/2026-09-11-INPUT-FIXES-SMALL.md`。

- 2026-09-11（第 20 批·修正轮——设计评审轮次 1 后）：#1–#7 逐条落档（#8 = 非缺陷，随交付链）——#1 交付自查时序归位（coder 报实测行数 / 设计者收口回写 §1 地图——§12.7 改写）·
  #2 AC-A4-1 落显式用例 10（文档面断言——§12.8 / §12.9）· #4 警示口径收窄（不再最先牺牲——§12.5）· #5 `cmd-advisor.mjs` 面归属澄清（§12.1）·
  #6 宽度预算判定式为准（§12.5——需求档 N7 同改）· #7 拆分评审补 `test/eng-designer-role.test.mjs` 半行（§12.7）；#3 = 父侧确认（零动作）。

- 2026-09-11（第 20 批·TUI 面收口）：**设计落档**——§12 新增（picker 附注渲染 + 三选择面分工契约；
  设计与测试并档）+ §9 指针 + §11 未决承接更新（①② 收口/裁定）；批次档 `../batches/2026-09-11-TUI-SELECTION.md`。

- 2026-09-11（第 14 批·设计落档）：收尾批——§1 模块地图**全表行数回写**（2026-09-11 实测；口径与既往一致）
  + 表头口径注 + 未入表三档如实注 + `pickers.mjs` 行迁移注；配套（T75/T76 宿主 + 行号指针修正）见
  `ENGINEERING-MODE.md` §2.27（T75/T76 后改号 T111/T112——见 §2.27.4）。

- 2026-09-11：SUBAGENT-TAIL 批（子代理内嵌活动并入外层流——数据流合并 / 取代 R23 子块小节 /
  单环 trim / 省略计数真值修复）——**已交付并验收**（6 源 + 新测试档 12 用例全绿、全量 fail 0、
  真机 smoke 过）；§1 模块地图其所触六文件行回写 + §6 重写嵌套子代理段并新增并档节（设计与测试）+ §11 完成史行。

- 2026-09-10：CLI-ACTIVITY-DEBLOAT 批（活动块去加戏：F-1 报告 preview 删 / F-2 finishSubTask 收窄精确匹配 / F-3 面板镜像改读时现算 computePanelBlocks——agent._tuiState 反向挂载；④ awaitingDigest 驻留零动）——§6.4 补充节 + §1 模块地图行数回写。
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
