# TUI 界面核心（渲染 / 按键 / 折叠）· CLI 面 · 设计

> 板块 = **TUI（终端界面）**——CLI 终端界面的**界面骨架**：输入层 → 状态 → 渲染 → 按键。
> 配对需求档 = `docs/cli/requirements/TUI.md`（本板块**三档设计共用一份需求档**——层归属不对称，理由见该档 §1 注）。
> 本档 = 三档之一：**界面核心**（本档）· `docs/cli/design/TUI-COMMANDS.md`（命令层与选择面）·
> `docs/cli/design/TUI-SESSION-VIEW.md`（会话视图 / 回合驱动 / 显示层内存）。
> 另有输入框契约档 `docs/cli/design/TUI-INPUT-BOX.md` 与工具输出档 `docs/cli/design/TUI-TOOL-OUTPUT.md`。
> 对位档 = `docs/vsc/design/WEBVIEW*.md`（VSC webview 族——**非同机制**）——**已裁保留（A9 三件齐）**：
> ① 结构性不对称 = 渲染宿主不同（VSC webview DOM + 宿主↔面板消息协议 ∥ CLI 裸 ANSI 终端行内渲染；消息协议仅单侧存在）；
> ② 证据 = 两实现树（`thincoder-vscode/webview/**` + `docs/vsc/design/WEBVIEW-PROTOCOL.md` ∥ `thincoder-cli/src/tui/**`）；
> ③ 显式裁定 = 「逻辑 / 渲染分家」（同判据）。

## 1. 设计原则与模块地图

**设计原则**：**纯函数可测**（渲染 / 布局抽成无副作用纯函数）；**分层**（stdin 解码 / 状态 / 渲染 / 交互 / 命令各自独立）；
**零依赖**（裸 ANSI 转义 + `node:` 标准库，不用 ink / React、不用 termbox）。

> **模块地图口径**：本表是**结构性快照**——新增 / 改名 / 删除文件时同批回写。**行数列不并**（as-of 数值随实现漂移；档位以实测为准）。

### 核心管线（stdin → 状态 → 渲染 → 回合）

| 文件 | 职责 |
|---|---|
| `thincoder-cli/src/tui/index.mjs` | `startTUI` 入口（**装配序列**）：dims 采样 · state 工厂调用 · 输入面早挂载 · cleanup / exit 钩（F-XR1 退出释放）· render loop · `createLoadOlder` · heap-watch · resize · 命令层（`createSlashCommands` + `turnCtx.handleSlash` 回填）· 键盘 / 鼠标后置挂载调用 · 启动屏 / 台账面 / 后台索引 / 升级检查；`state._agent` ↔ `agent._tuiState` 双向挂载 |
| `thincoder-cli/src/tui/tui-state.mjs` | TUI state 工厂（`createTuiState({ cols, rows, agent })`——state 字面量单源：会话面字段 / dims 种子 / `tasks` 承接） |
| `thincoder-cli/src/tui/input-face.mjs` | 输入面（`createInputFace(ctx)`——**二段接口**）：早挂载 = keyStream + raw mode + 启动序列 + 解码器 + `process.stdin.on("data")` 整块（粘贴协议 / 鼠标剥离 / Shift+Enter 翻译）；后置挂载入口 = `mountKeys(deps)`（keypress 接线）/ `mountMouse(deps)`（鼠标 dispatch） |
| `thincoder-cli/src/tui/conversation-writer.mjs` | 对话写入面（`createConversationWriter`）：`pushLine`（行额度单点）/ `pushLabel`（消息标签 + 呼吸空行）/ `ensureAssistantLabel`（回合内单次位）+ 行缓冲裁剪与冻结锚点校正 |
| `thincoder-cli/src/tui/turn-face.mjs` | 回合面（`createTurnFace(ctx)`）：`submit` 门禁 / interaction 装配（权限 + 提问）/ 剪贴板图片粘贴 / `turnCtx` / `turn` |
| `thincoder-cli/src/tui/tui-lifecycle.mjs` | TUI 生命周期终端序列：`writeStartupSequence`（alt buffer + 光标 + 鼠标 / 粘贴 / 键盘增强 + **DECRST 7 禁环绕**）、`writeLoadingLine`（启动加载行——首帧渲染自然覆盖）、`writeCleanupSequence`、`RECOVERY_SEQUENCE`（异常退出恢复序列单源——见 `docs/cli/design/CRASH-REPORTS.md` §5）、`createExitCleanup`、`setTuiActive` |
| `thincoder-cli/src/tui/update-notice.mjs` | 后台升级提示（`upgradeFailureText` / `pendingNoticeReady` 纯函数 + `createUpdateNotice` 装配） |
| `thincoder-cli/src/tui/key-handler.mjs` | 按键分发**分派器**：attention 清位 + 三模态前置委派（permission / question / search）+ Ctrl+C 族委派 + F1 快捷键表 + Ctrl+I 入口 + interrupt 模态 + 五族顺序委派（委派守卫 = 原块入口条件）；`clearAttention` / `convMaxScroll` 导出 |
| `thincoder-cli/src/tui/key-handler-ctrlc.mjs` | Ctrl+C 族（picker 取消 / 武装窗口全停 / 挂起态两级中止 / 回合 interrupt / 空闲退出武装——五分支） |
| `thincoder-cli/src/tui/key-handler-modals.mjs` | picker 导航（含窗口高度同源）+ 首启 wizard 两步键处理
| `thincoder-cli/src/tui/secret-prompt.mjs` | SSH 凭据窗面体单源（模态族第四支）：载荷归一 · 步进 · 掩码判据 · 目标 / prompt / 标签行 · `secretPromptSubmit` / `secretPromptCancel` / `runSecretPrompt`（字段决议闭包——值只走返回路）· 无 UI 拒件 `refuseSecretInput` |
| `thincoder-cli/src/tui/key-handler-busy.mjs` | **busy 门禁**（Enter 队列受理（容量 8）+ 吞面四 / Tab 吞——`docs/cli/design/TUI-INPUT-BOX.md` §4.1） |
| `thincoder-cli/src/tui/key-handler-scroll.mjs` | 翻页（PgUp / PgDn + `loadOlder` 边界加载）/ ↑↓ 三规则 + 历史导航 / ←→ · Home · End 光标 |
| `thincoder-cli/src/tui/key-handler-edit.mjs` | 编辑族：Tab 补全 / Ctrl+U 清框 / 退格 · 删除 / Enter（多行换行 · 挂起空闲入队（容量 8） · `submit`）/ Ctrl+V 文本 · Alt+V 图片粘贴 / 可打印字符 |
| `thincoder-cli/src/tui/key-handler-search.mjs` | 搜索模式按键子处理（Ctrl+F 分支） |
| `thincoder-cli/src/tui/key-modes.mjs` | 按键模态层：permission / question / interruptPrompt 独占模态 handler（激活即消费全部按键） |
| `thincoder-cli/src/tui/render-frame.mjs` | 帧布局装配：header / conversation / subagent 面板 / todo / input / status 各面板；状态栏（含 attention 态——§7）；question 自由文本态光标例外 |
| `thincoder-cli/src/tui/render-conversation.mjs` | 对话面板行构建（纯函数）：三层缓存、搜索高亮、折叠装配、主输出前后空行、连续 dim 折叠；`convViewport` 视口数学单源导出 |
| `thincoder-cli/src/tui/render-segments.mjs` | 对话行三类特殊段渲染：tool 块 / frozenSubTask / frozenAdvisor（各带独立段缓存 WeakMap） |
| `thincoder-cli/src/tui/fold-block.mjs` | 公共折叠组件（§6）——`foldCapRows` / `isExpanded` / `toggleFoldBlock` / `renderFoldedHead` / `renderExpandedBlock` / `renderBlockTimeline` / `foldTailLines` / `scrollFoldBlock` |
| `thincoder-cli/src/tui/render.mjs` | 纯函数：字符宽度（CJK / emoji / 组合字符）、`wrap` / `slice`、markdown 表格对齐、`sanitize` |
| `thincoder-cli/src/tui/render-loop.mjs` | 渲染调度：整帧 recompute + 行 diff（只重绘变化行）+ 光标定位；`MIN_RENDER_INTERVAL_MS` 节流；每帧 write 包 `wrapOff` / `wrapOn` |
| `thincoder-cli/src/tui/layout.mjs` | 面板布局计算（行 / 列分配）；小终端压缩链；question 自由文本态 `boxLines = layoutAnswer` |
| `thincoder-cli/src/tui/dims.mjs` | 终端尺寸单源：`get()` 读缓存；`refresh()` 只在事件钩子（启动 seed / resize）；sane-gate（`cols >= 40` / `rows >= 10`）挡 falsy |

### 渲染内容层

| 文件 | 职责 |
|---|---|
| `thincoder-cli/src/tui/markdown.mjs` | 轻量行内 markdown → ANSI（粗体 / 下划线 / 删除线 / 标题）；code-span 不透明 |
| `thincoder-cli/src/tui/math.mjs` | LaTeX → Unicode 近似（表驱动子集转换器——零依赖、纯函数） |
| `thincoder-cli/src/tui/tool-summaries.mjs` | 工具完成行摘要（`formatToolSummary`——按工具特化 + 首行兜底） |

### 输入与交互（基础设施）

| 文件 | 职责 |
|---|---|
| `thincoder-cli/src/tui/mouse.mjs` | SGR 鼠标序列解析（滚轮 / 左键点击）；`handleWheel`（展开块内容行块内滚动 + 穿出语义）；点击命中（picker 选项 / 折叠块 toggle / 翻窗 / ⏹ 取消）；`createMouseDispatch` 装配簇 |
| `thincoder-cli/src/tui/clipboard.mjs` | 剪贴板文本 / 图像读写（Win powershell 强制 UTF-8 / macOS pbpaste / Linux xclip）+ `translateShiftEnter` + `insertPastedText` 目标路由 |
| `thincoder-cli/src/tui/ansi.mjs` | ANSI 色板 / 控制序列；键盘增强协议启停；`wrapOff` / `wrapOn`；attention 色对常量 |
| `thincoder-cli/src/tui/config-helpers.mjs` | `persistRaw`（写配置收口——mtime 门控 + 并发冲突 throw）/ `syncProviderField` / `maskKey` |
| `thincoder-cli/src/tui/display-budget.mjs` | 显示层字符额度常量与对账（单源）——机制面见 `docs/cli/design/TUI-SESSION-VIEW.md` §5 |

### 启动序（首帧前）

> 读数锚 = 需求档 `docs/cli/requirements/TUI.md` §3 **N12**（启动等待不随存量劣化）；机制单源 = `docs/core/design/SESSION.md` §6.17（会话 GC）· `docs/core/design/TRACES.md` §6.4（轨迹清理）。

- **序**：wrapped 父 spawn 子（`thincoder-cli/src/tui/wrapped-spawn.mjs:27`——父段先写 loading 行）→ 子进程 import → `resumeSlot`（`thincoder-cli/bin/thincoder.mjs:322`）→ 装配（同档 `:323`）
  → `writeStartupSequence`（alt buffer 接管；`thincoder-cli/src/tui/input-face.mjs:39`）+ `writeLoadingLine`（同档 `:45`）→ 首帧 render（全屏重绘自然覆盖 loading 行）。
- **纪律**：启动关键路径零同步 fs 阻塞（判据 ≤50ms）——会话 GC 与轨迹清理均为**异步非阻塞**面，且不在纯信息命令启动时执行（触发闸见 `docs/core/design/SESSION.md` §6.17 / `docs/core/design/TRACES.md` §6.4）。
- **目标**：启动到 TTY 门 **≤2s**。

**不在本档的三面**（各挂指针，D2）：命令层与选择面 → `docs/cli/design/TUI-COMMANDS.md` §1；
会话恢复 / 回合驱动 / 显示层内存 → `docs/cli/design/TUI-SESSION-VIEW.md` §1；输入框键契约 → `docs/cli/design/TUI-INPUT-BOX.md`。

## 2. stdin 输入层（`input-face.mjs`）

- **keyStream 双流**：`emitKeypressEvents(keyStream)`（`node:readline`）把原始字节转 keypress 事件；
  `keyStream` 是 `process.stdin` 的 PassThrough 副本——**粘贴多块数据先写入 keyStream 再交给 readline 解析**，
  保证按键与粘贴按序到达。鼠标序列先在 data 层拦截剥离，碎片不落输入框。
- **分块解码**：`utf8Decoder.decode(chunk, { stream: true })`——CJK 字符跨 chunk 边界时正确拼装；
  鼠标序列可能跨 chunk 截断：`mousePending` 保存不完整尾部，下个 chunk 拼接。
- **鼠标滚轮**：SGR 序列（上 3 行 / 下 3 行），坐标命中展开块内容行 → 块内滚动（§6）；未命中 → 会话滚动
  （到顶触发 loadOlder，回底恢复 `_followTail`）。
- **鼠标点击**：左键按下 → picker 选项点击选中（跳过标题行，按 `_row` 映射 filteredItems）；
  对话区 / 面板点击带 `_foldToggle` 的行折叠 / 展开切换、控制行翻窗、子 agent 面板头 ⏹ 标记列点击 = cancel。
  **消息行点击无动作**（终端拖选复制是原生能力）。坐标 1-based、col 在前；release / 滚轮不消费。
- **粘贴协议（bracketed paste）**：`\x1b[200~` 进入 pasteMode、`\x1b[201~` 退出；跨多 chunk 的粘贴先写前缀 + 累积，
  退出时一次性写入。粘贴文本**跳过按键分发**直接进输入缓冲（`insertPastedText`）。
- **Shift+Enter**：stdin 层 `translateShiftEnter` 把 CSI-u 的 Shift+Enter 序列翻译为 `\x1b\r` → `key-handler-edit.mjs` 插入 `\n`
  （多行键三层方案见 `docs/cli/design/TUI-INPUT-BOX.md` §5）。
- **state 对象**（渲染全部数据源）：`lines` / `streaming` / `reasoning` / `_advisorBlocks` / `input`（codepoint 数组）/
  `cursor` / `history` / `scroll` / `_foldScroll` / `_followTail` / `processing` / `controller` / `permission` / `question` / `secretPrompt`（SSH 凭据窗——模态族第四支） /
  `picker` + `pickerStack` / `wizard` / `tasks` / `dims` / `tokens` / `ctxCache` / `search` / `expandedBlocks` / `foldEnabled` /
  `exitArmed` / `suspAbortArmed` / `_lineIdCounter` / `subTasks` / `queue` / `interruptPrompt` / `pendingNotice` /
  `pendingInput` / `attentionAwaiting`（§7）/ `_history*` 等。
- **cleanup（退出路径统一）**：`saveSession` 同步写盘 → 关 MCP → 终端复位（alt buffer 退出、mouse / paste / keyboard /
  modifyOtherKeys off、wrapOn、主缓冲区、显示光标）。`process.on("exit", cleanup)` 注册一次；
  `/exit` 与 Ctrl+C 双确认最终都走 `process.exit`（`exitTimer` 延迟可注入防真退出）。
- **行缓冲裁剪**：`lines` 超 5000 时裁掉头部 1000 行并插入裁剪标记行（freeze 锚点整体前移——净位移校正，防冻结落点漂移）。
  字符维额度见 `docs/cli/design/TUI-SESSION-VIEW.md` §5。

## 3. 行语法与逐行对齐（`_kind` 单一事实源）

- **行语法单一事实源**：对话行有三个生产者——live（`tool-events.mjs` `flushStream`）、恢复（`startup.mjs` `historyToLines`）、
  注入（session / 命令 `pushLine`）——**全部产出带 `_kind` 类型标记的行**：`"thinking"`（思考）/ `"text"`（主文本）/
  `"tool"`（工具载体）/ 无标记 = 用户消息与标签行。`buildConvLines` 读标记判定折叠行为，不再从颜色猜
  （颜色降级为纯视觉属性；旧无标记行的颜色启发式仅作兼容兜底）。
  这是「恢复体验 = 执行体验」的结构保证。**新增生产者必须打 `_kind` 标记**。
- **逐行对齐契约**：同一回合在 live 与 restore 两种管道下渲染**逐行一致**（白名单：done 行 `❯ name — done (耗时)` 为 live 独有——
  历史不存耗时，恢复管道无此行，其完成态状态词回落 `"done"`）。为此统一的点：
  ① 工具标题行两态同格式 `❯ name <参数摘要>`（`describeToolArgs` 单源）；
  ② live `onToolCall` 落参数全量 JSON dim 行（= restore `toolArgsLines`）；
  ③ live `onToolResult` 落结果正文 dim 行（= restore 全文；`slimToolResultForDisplay` 两管道共享）；
  ④ live 不再有孤立的行数摘要行。
- **回归 guard**：工具载体的计时与中断清扫覆盖全部工具载体来源（`docs/cli/design/TUI-TOOL-OUTPUT.md` §5）。

## 4. 按键分发与中断

**状态优先级**（从高到低，每个状态独占处理并 `return`）：

```text
permission（y/n/a/esc；batch a/o/n；continue / retry y/n）
→ question（选项 ↑↓ / enter / esc，自由文本——key-modes）
→ search 模式（Ctrl+F 进入：Ctrl+N/P/G/R 导航、esc 退出、字符输入过滤）——**入场排除集 = 权限 ∥ 提问 ∥ 凭据窗 ∥ 团队问句面 ∥ 密码步**（掩码守卫——见下）
→ interruptPrompt（Ctrl+I 后输入注入消息——创建 / 模态分支先于 picker）
→ picker 栈 / wizard（↑↓ 选择、enter 确认、esc 取消）
→ 凭据窗（`secretPrompt`——Esc 整窗取消 ∥ Enter 提交（含 `enter` ∥ 裸 `\r` 变体）；↑↓ / PgUp·PgDn 归面并吞；可打印键落编辑族）
→ 正常输入编辑（字符 / 退格 / Ctrl+U / Ctrl+V / ↑↓ 竖移·历史 / 多行）
```

- **模态分支**（`key-modes.mjs`）：permission / question / interruptPrompt 激活时**消费全部按键**（含未匹配键——不落入下层编辑路径）；
  搜索模态另居 `key-handler-search.mjs`。
- **掩码守卫（反交错——裁 A）**：凭据窗 / 团队问句面 / 密码步在场 ⇒ Ctrl+F **不入场**（搜索框 = 明文面——旁路封口；单源 = `ask-steps.mjs` `askMaskActive`）；**掩码三面**（凭据窗 / 团队问句面 / 密码步）在场（含搜索框已开时弹出）⇒ 键路由归掩码面、明文不落搜索面（已开搜索支路 = **键路由每键重判**）。
  **显示面同归**：掩码三面在场（含搜索框已开时弹出）⇒ 输入框**显示面归掩码面**（框题 ∥ 内容 = 掩码面形；搜索面让位）——键归谁、面显谁
  （同判据单源 = `thincoder-cli/src/tui/ask-steps.mjs` `maskSurfacePresent`；消费点 = `thincoder-cli/src/tui/layout.mjs` 输入框内容式 ∥ `thincoder-cli/src/tui/render-frame.mjs` 框题式）。
  **先例**：键路由半先例 = 裁 A（设计档节 = `docs/core/design/TOOLS.md` §6.22 掩码守卫句）；本半 = 同判据（掩码面在场 ⇒ 让位）由键路由面延伸至显示面——对齐（单源同判据、零背向）；偏离 = 无。
- **busy 门禁**（`processing` 含 digest 单一判据）：**输入不禁**——打字照常进输入框回显（提交面受理分流 = `docs/cli/design/TUI-INPUT-BOX.md` §4.1；吞面不回滚字符）；
  **Enter 提交 = busy 队列受理（容量 8）**（非模态期——放行判据 = `docs/cli/design/TUI-INPUT-BOX.md` §4.1（含挂起两态）；
  二次提交语义同处，本档不重述——D2）；**斜杠命令同禁发**（`/exit` 也发不出——退出靠 Ctrl+C 终端层武装通道）；
  空 Enter 静默（text 非空才吞）；反馈面 = §7.5。
- **挂起空闲**（`docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.8——busy 之外）：Enter（非 slash）→ `pendingInput` 队列（**容量 8**）
  （满队（第 9 条）拒 + 提示 + 文本保留）+ 唤醒（`_suspWake`，不打断后台）；释放窗口期间同语义。
- **输入编辑键表与 ↑↓ 三规则** = `docs/cli/design/TUI-INPUT-BOX.md` §2 / §3（本档不重述——D2）。

### 4.1 Ctrl+C 分支（三态武装一致）

1. **picker 打开 → 取消当前 picker**（等同 Esc），不杀进程。
2. **武装窗口内二按**（状态路由前统一检查 `suspAbortArmed`——跨态桥接）→ **显式全停**：
   当前回合平 abort（无 interrupt——走回合收尾清池分支）+ abort 集合 = 链条内全部 controller（`agent._sessionAbortAll`）
   + **挂起态才置 `_suspAborted`** + 唤醒 driver（收尾清池）；**非挂起语境不置**（粘滞会阻塞未来挂起会话重入）。
   无目标可停（无 processing / 无 abort 集合 / 未挂起）→ 不吞键、落空放行到下方分支。
3. **挂起态**（`state.suspended`）→ 武装窗口两级中止：
   - 未武装 + 有回合在跑（digest / 会话内回合）：仅中止当前回合（`abort({ interrupt: true })` 无 message——
     interrupt 排除清池分支）——后台池保留，回挂起等待；
   - 未武装 + 纯挂起等待：仅提示不清池（提示含运行中数量）；
   - 武装 3s 窗口内再按 → 统一全停。
   提示：`[stopped current turn — press Ctrl+C again within 3s to abort all background subagents]` /
   `[abort] Press Ctrl+C again within 3s to abort all background subagents (N running)`。
4. **processing（非挂起）→ 武装窗口两级中止**：首按 = `abort({ interrupt: true })`（无 message——停当前回合不续跑）+ 提示
   + 武装 3s（`suspAbortArmed` + `suspArmTimer`，`ctx.exitArmDelay ?? 3000` 过期自动复位）；窗口内再按 → 统一全停。
   （无条件平 abort 会命中清池分支误杀全部后台子代理。）
5. **空闲态 → 双确认**：第一次只提示 `[exit] Press Ctrl+C again within 3s to exit` 并置 `exitArmed`
   （超时自动解除，可注入；回合启动即清除 `exitArmed` 防跨回合残留）；窗口内再按才走 cleanup + 延迟退出。

### 4.2 Ctrl+I 中断注入

- processing 时进入 `interruptPrompt` 状态；输入消息 Enter 提交 → `controller.abort({ interrupt: true, message })`
  → agent 循环把中断消息注入历史后**重开 controller 续跑**。
- **interrupt 区分**：**有 message**（Ctrl+I）= 重建 controller 续跑；**无 message**（Ctrl+C 首按停回合）= 不续跑 break
  ——回合层回滚无 message 注入产生的尾部垃圾（`agent` 侧零改动；partial 输出**不**回滚——interrupt 家族「提交部分输出」语义）。
- 注入框的键集 / 光标 / 提示 = `docs/cli/design/TUI-INPUT-BOX.md` §8。

### 4.3 provider 失败面（诊断上下文 + Retry · X8）

- **形态（X8）**：provider 失败面（`thincoder-cli/src/tui/agent-turn.mjs` 回合循环 catch 非中止分支）三件——
  ① **友好首行** `[error] <原文首行>`，URL 脱敏（`[endpoint]`）；② **诊断两行** `→ Provider: <baseURL>` / `→ Model: <model>`；③ **Retry 询问**（复用 `state.permission` 机制——`name: "retry"`）：同意 ⇒ 重建 controller + `resume` 重入（与 `ContinueError` 面同法）；拒绝 ⇒ 断回合（`[error]` 行保留）。
- **脱敏判据**：`PROVIDER_URL_RE = /https?:\/\/[^\s,)"]+/g` → `[endpoint]`——与 VSC 端（`thincoder-vscode/src/extension/panel-turn-loop.mjs`）**同式双写**（单源化 = 跨批结构面，登记）。
- **重入语义**：provider 抛错不写 history（核 `thincoder-core/agent.mjs` 仅 `AbortError` 分支注历史）+ `flushStream` 清 `state.streaming` / `state.reasoning` ⇒ resume 重跑不携半截 assistant 行、不重复推部分输出。
- **边界**：abort 分支 / `ContinueError` 面零改；不新增 TUI 组件（复用权限面板）；不改 provider 层重试策略；不动 CLI 硬编码 zh/EN 混排面。
- **框面（X8 跟进 ① · 用户裁定）**：重试询问与 `continue` 同形——**仅 `y` / `n`**（`a` 不属本框键面 ⇒ 零会话级 `autoApprove` 副作用）；框面 = 标题 ` Retry? (y/n) ` · 提示行 ` y: retry │ n: stop`。
  y/n 判据单源 = `isYesNoModal(name)`（`thincoder-cli/src/tui/interaction.mjs`——`key-modes.mjs` / `render-frame.mjs` 同引）；`[approved]` / `[denied]` 轨迹行仍只归 `continue` 豁免——`retry` 保留轨迹行。
- **原文余行 = log-only（X8 跟进 ②）**：失败原文除首行外的余行**不增 UI 行**（表面零膨胀）——入事件日志 `err:provider`（`err` = 脱敏首行 · `head` = 余行合单行；事件面见 `docs/core/design/LOGGING.md` §6.2）。

## 5. 渲染管线（帧装配 / 布局 / 对话行构建）

**帧装配（`render-frame.mjs`）**

```text
header（logo / 版本 / 模型 / think 徽章 / cwd）
对话面板（renderConversation）
子 agent 面板（运行中 / 排队 waiting 区块，会话与 todo 之间）
todo 面板（task 列表，≤5 行，全部 done 自动收起）
输入框（layoutInput：多行展开、光标定位、粘贴快捷键提示角标）
状态栏（模式 / 耗时 / token / 上下文利用率 / busy 提示 / 快捷键提示；attention 态见 §7）
```

- **布局分配**（`layout.mjs` `computeLayout`）：面板高度随内容伸缩；**运行中子 agent 活动为固定底部面板**——
  位于会话区与 todo 之间，高度完全自适应（= 全部运行中区块的渲染行数，会话区被挤小），不随会话滚动；
  完成后冻结进会话流（async 族 ⇒ 结算后驻留「done · awaiting digestion」、冻结落消费窗；`_frozenSubTask` 折叠块）；无驻留区块时面板不渲染（无悬空分隔线）。
- **小终端压缩链**：subagent 面板最先让位（可至 0 隐藏——数据保留在缓冲区）→ conversation → picker → permission →
  todo 分隔线（任务行永不压缩）。
- **对话行构建管道**（`render-conversation.mjs` `buildConvLines`，纯函数）：

```text
原始 text → highlightSearchMatches（搜索命中：当前项反白、其余黄下划线）
→ sanitizeDisplay（剥 ANSI / 控制字符，防网格污染）
→ renderMathInline + renderMathBlock + markdown（先 math 后 markdown——math 把 $…$ 视为不透明段）
→ formatTables（markdown 表格按显示宽度重排，CJK 对齐）
→ wrapText（按 stringWidth 换行，宽度 = cols − 1）
→ 折叠（判定与装配见 §6）
```

- **特殊段**（行对象载体分支互斥）：`_frozenSubTask` → frozenSubSeg、`_toolBlock` → toolSeg、
  `_frozenAdvisor` → frozenAdvSeg（`render-segments.mjs`）。工具块的完整语义以 `docs/cli/design/TUI-TOOL-OUTPUT.md` 为权威。

**关键约束**

- **markdown / math ANSI 在 wrap 之前插入**——插入的转义序列零显示宽度（`stringWidth` 剥离 ANSI），不参与宽度计算、不破坏对齐；
  渲染先于 wrap 保证跨 wrap 边界的公式 / 标记完整转换。窄作用域复位（`22`/`24`/`29` 而非 `0`）保证不冲掉行底色。
- **宽度补偿**：标记（`` ` `` / `**` / `~~`）渲染后消失，含标记的表格行会比 `formatTables` 计算的列宽短——
  `renderMarkdownPreservingWidth` 在行尾补空格恢复原宽（竖线对齐）。math 先于 `formatTables` 执行 → 表格列宽按转换后文本测量，无需补偿。
- **缓存**：`convCacheKey`（lines 长度 / 末行长度 / streaming / reasoning 长度 + `_advisorBlocks` 摘要 + frozen 载体签名 +
  工具块缓冲签名 + **colorSig** + foldEnabled / expandedBlocks 摘要 + cap 分量 + search 状态 + `_foldScroll` 分量）命中则跳过重建；
  运行中区块居固定面板——子 agent 活动不再失效会话缓存。
- **Ambiguous 宽度低估 + DECAWM 防线**：`—`（U+2014）· `│`（U+2502）· `●`（U+25CF）· `▸`（U+25B8）· `…`（U+2026）·
  `↑↓`（U+2191/2193）属东亚 Ambiguous 宽度——`charWidth` 按 1 格算，但中文 locale 终端实际渲染 2 格 → 行宽低估 → 物理 wrap + 清错行。
  **三层防御**：① 启动禁环绕（`writeStartupSequence` 的 DECRST 7）+ 每帧 write 包 `wrapOff` / `wrapOn`——超宽行硬截断在边距；
  退出 `writeCleanupSequence` 恢复 DECSET 7。② picker 行与标题行右边距留 8 格余量。③ 标签截断按显示宽度。
- **渲染调度**（`render-loop.mjs`）：`scheduleRender()`（setImmediate 合并 + 16ms 节流）+ 整帧 recompute 后行 diff
  （`rows[i] !== prevRows[i]` 只重绘变化行 + 光标定位），防闪烁。1s ticker 在回合驱动器（`docs/cli/design/TUI-SESSION-VIEW.md` §4）。
- **宽度数学**（`render.mjs`）：`charWidth`——CJK / emoji / 全角 2 列、组合字符 / 零宽 0、其余 1；`wrap` / `slice` / `pad` 全按显示宽度。

## 6. 折叠与区块交互

### 6.1 公共折叠组件（`fold-block.mjs`）

- **组件化**：折叠交互统一收敛到公共组件——任何「流式 / 超长输出要可折叠」的功能直接复用，不再复制渲染逻辑。
  API：`foldCapRows`（60% 封顶数学）/ `isExpanded` / `toggleFoldBlock`（收起时同步清 `_foldScroll` 残留）/
  `renderFoldedHead` / `renderExpandedBlock` / `renderBlockTimeline` / `foldTailLines`（tail-3 提取单源）/
  `scrollFoldBlock` / `blankLine` / `foldHintLine`。
- **接入面**：子 agent 区块（运行中固定面板 / 冻结流内）、advisor 块、工具块、长消息、连续 dim；鼠标点击 toggle 也走单源 `toggleFoldBlock`。
- **接入约定**：凡「超长输出想可折叠」用本组件拼装——封顶、可达性与统一形态只在组件里有。

### 6.2 统一折叠形态

**「所有折叠区块 = 默认三行 tail，展开封顶 60%」**：折叠态单源为
`renderFoldedHead` —— `▶ <身份标签> · N lines — click to expand` + 末 3 行（dim，去 gutter 后按 cols 截断）。
身份标签按内容分类：`thinking`（思考块）/ `tool output`（dim 行与连续 dim 块）/ `message`（其余可折叠长行兜底）；
子 agent、advisor 用各自既有的括号身份头。**折叠 / 收起标志始终在块头部同一位置**；控制行 = bold cyan `▶` / `▼`
+ 短语中 `click to expand/collapse` 下划线——**点击任意带 `_foldToggle` 的行即双向切换**。

### 6.3 展开封顶与窗口（含块内滚动）

- 展开态经 `renderExpandedBlock` 统一渲染，**区块总高 ≤ `floor(rows × 0.6)`**（`foldCapRows`；rows 未知 → 不封顶）；
  高度封顶保留，内容不一次性截断——超封顶正文渲染为**窗口**（`state._foldScroll` 记每块窗口起点；
  窗口可读行 = `cap − 5`，预留 blank + 顶部控制 + ▲ + ▼ + 底部收起开销）。
- 窗口上下渲染 **`▲ 上方还有 N 行（点击向上翻窗）`** / **`▼ 下方还有 N 行（点击向下翻窗）`** 控制行；点击翻窗 = 一整窗；
  越界 offset 渲染时 clamp 并写回（防滚轮 / 翻窗误判「未到边界」卡死）。
- **滚动读全文、60% 高度内、底部 ▼ 收起控制行永远在块尾**——触封顶时区块底部追加第二个控制行（唯一保证可达的收起入口）；
  整块 ≤ `cap − 5` 行时全量显示、无底部控制行。
- `convCacheKey` 含 `_foldScroll` 分量（翻窗必须重渲染）；`maxRows` 由调用链贯穿；`foldEnabled = false`（/fold off）时
  控制行与窗口一并消失（原样正文直出）。

### 6.4 滚轮块内滚动 + 穿出语义

- 滚轮事件带坐标 → `handleWheel` 命中展开块**内容行**（窗口行带 `_foldBlock` / `_foldWindow` / `_foldTotal` 标记——
  每行自描述所属块，无区间簿记）→ **块内 offset ±3 行**（与会话滚动节拍一致）；未命中块 → 走会话滚动。
- **穿出**：块顶滚上 / 块底滚下 → 返回 false 交还会话滚动（否则滚轮永远被块吃掉、会话顶懒加载不可达）；
  ▲ / ▼ 控制行点击翻窗保留为快速跳转。子 agent 面板行默认穿出滚会话；命中面板内展开块内容行才块内滚动。
- **视口数学单源 `convViewport(convLen, convH, scroll)`**（渲染 + 鼠标命中共用）。

### 6.5 流式跟随尾部

- `state._followTail` 默认 true——渲染前 `state.scroll = 0`（最新内容钉在视口底，tool 行 / pushLine 同样生效）；
  用户上滚（PgUp / 滚轮上）→ 暂停跟随；暂停期间**锚定补偿**（渲染帧按 convLen 增量补偿 scroll，视口顶保持绝对行——
  loadOlder 加载后同样补偿）；PgDn / 滚轮滚回底部或新提交消息 → 恢复跟随。
- **↑ / ↓ 键是输入框内语义，不执行会话滚动**——滚动入口 = PgUp / PgDn 与滚轮。

### 6.6 折叠对象与折叠决策

折叠对象（要求 `foldEnabled !== false` 且 key 不在 `expandedBlocks`）：

1. **长消息折叠**：思考（`C.reason`）**无条件折叠**（思考是过程内容，一律收进命名头）；
   工具摘要等 dim / 工具行 > 12 行折叠（`LONG_FOLD_LINES`）；key = `long-{_lineId ?? i}`。
2. **连续 dim 块折叠**：连续 dim 行 > 8（`FOLD_LINES`）→ 统一形态；key = `fold-{首行 _lineId ?? i}`（连续 dim 块首行即稳定锚）；
   块内含展开块行（`_skipDimFold` 标记）时不折叠（防套叠）。

- **主输出永不折叠**：`foldable = l.color !== C.text`（含用户消息）直接全量渲染——折叠会把真正的回答藏在点击之后；
  思考 / 工具摘要才是辅助流。判定以 `_kind` 为主（`thinking` / `tool` 显式标记即折叠），颜色仅对旧无标记行兜底。
- **折叠无例外**：思考块在 `flushStream` 完成**瞬间即折叠**（命名头 + tail 3）——与恢复路径完全同构；
  「完成瞬间保持展开、下一轮输入收起」形态（`_autoExpand` 簿记）**不得以任何形式写回**。
- **流式过程同框**：思考的 live 流式缓冲（`state.reasoning`）渲染为**同一只折叠框**（key = `thinking-live`）：
  默认 `▶ thinking · N lines` + tail 3，点击展开 = 60% 封顶的实时视图；flush 后块重挂到 `long-{idx}`，形态完全一致。
  live / 完成 / 恢复三态同构。
- **折叠 key 稳定化**：`_lineId`（state 自增计数器——live 工具载体 / 恢复 / 懒加载统一分配）派生，位置索引只作 `??` 回退：
  `tool-${_lineId}` / `long-${_lineId ?? i}` / `fold-{首行 _lineId ?? i}` / `advisor-done-${_lineId ?? i}`——
  loadOlder 头部 unshift 后展开态与 `_foldScroll` offset 不串位。子代理块键 `sub-${key}` 天然身份化（key = `role#id`）。
- **组件解耦**：`fold-block` 不 import 任何业务常量（advisor 占位符经 `strip: []` 参数注入）。
- **组件 `cols` 纪律（教训级）**：`renderExpandedBlock` / `renderFoldedHead` / `renderBlockTimeline` 的 `cols` 是**必传语义参数**
  （签名默认 80 只是测试兜底）——**漏传 = 全部生成行按 80 列 wrap，输入框却是全宽**（同帧宽度分裂）。
  任何新增组件调用**必须显式传 `cols`**；排障口诀：**同帧内 A 面板正常 B 面板异常 → 先查 A/B 的输入参数差异**。

### 6.7 空行分区与分隔线

- **主输出前后空行**：每个主输出段（`C.text` 行连续段）**前后各插一个空行**，与思考块 / 工具块 / 子 agent 块拉开距离。
  渲染期插入（不写 `state.lines`、不影响 `convCacheKey`）；相邻段共享一个空行；**streaming 分支同样适用**（两条渲染路径必须一致）。
- **任务面板顶部分隔线**与**子 agent 固定面板顶部边界线**：dim `─` 线；后者**仅当存在驻留区块时渲染**（无驻留区块 → 无面板、无悬空线）。
- **折叠控制行的空行规则**：控制行不缩进、与输出内容平齐；**空行分隔仅展开态使用**；折叠态 ▶ 头**不空行**。
  展开态每行加 `│ ` gutter 左框线（组件拥有 gutter：统一加、行宽硬切 `cols − 2`）。

### 6.8 子 agent 活动区块

区块数据层在 `subagent-blocks.mjs` / `subagent-children.mjs` / `subagent-freeze.mjs` / `subagent-panel.mjs`；
编排语义（settle 时序、async 生命周期、排队规则）以 `docs/core/design/AGENT-LOOP.md` 为权威。**显示层契约**：

- **运行中 = 固定底部面板**（`subagent-panel.mjs`，会话与 todo 之间）；**冻结 = 流内折叠块**（`render-segments.mjs` `frozenSubSeg`）。
  折叠键 `sub-${key}` 跨运行 / 冻结边界共用（折叠态无缝衔接）。
- **折叠头形态**（显式头标）：`[▶ eng-coder#2 · async · glm-5.3 · 45s · turn 12/100] bash — npm test`
  ——`[▶/⏸/✓ key · <mode/status 词> · model · elapsed · turn] state`；⏸ = 等待审批；✓ = 已完成。
  **sync / async 显式词**（真实 subagent 角色与 advisor 伪角色才标；async 由 spawn 实际启动时发的 `⟦ev⟧async` 标记置位，
  缺失 key 时缓冲 `_pendingAsyncKeys`）；**旧区块（无 async 字段）回退标 sync**。model 名先按显示宽度截断（≤ cols/3）——
  整行 ≤ cols 铁律。
- **⏹ 停止标记（门控）**：**仅 running ∪ queued/waiting 且属子代理角色族**的区块；
  sync 侧由 `state._agent._syncChildAborts` live 判据置位（注册即出现、注销即消失——钉与可中止一一对应；
  headless / 测试无 `_agent` → sync 不钉——零回归）；dim，钉在折叠头右缘**内收一列**；
  命中区 = `col >= _stopCol`，点击 = 定向 cancel（不经模型回合、不触发折叠翻转）；左邻 padding 与无 ⏹ 块右缘点击 = 折叠切换。
- **waiting / queued 块**：排队 spawn 返回即建面板块（不等子代理首 token）；状态词 = `waiting`（依赖未满足 / 域冲突——
  原因恒标；依赖取消 / 失败滞留恒标 `dependency cancelled`）或 `queued`（槽满等位——`queued · position N`）；
  **不标 sync / async**（未启动——标 sync 会误导）；**queued / waiting 块头即置取消 ⏹**；
   启动 → 清 waiting 标转正常 running 头（同 key 不重建）；取消 / 出队 → 移除块（不冻结）。**`⟦ev⟧cancelled` 发射源（按族 × 落点逐条列名）**：
   - **子代理族**：`executeCancelAction` 工具路径与 mouse ⏹ 直连路径（`thincoder-core/agent-tools/subagent-async.mjs` · `thincoder-cli/src/tui/mouse.mjs`）——两路互斥（同一事件只有其中一路在链上），通道分别是 `ctx.callbacks.onToken` 与 `routeSubToken` 就地路由。
   - **评审族**：核 `cancelAsyncAdvisor` queued 分支 = **唯一发射点**（工具路径 / mouse ⏹ / VSC ⏹ 三路各传本层通道、均不另发）——
      （机制细节见 `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.11 第 3 条）。
   **已移除块不复建（裁定落条文）**：`⟦ev⟧cancelled` 移除分支**同址落键级墓碑**——经**新增 helper** `tombstoneSubKey(state, key)`（定义于 `subagent-freeze.mjs`，与墓碑写点 `freezeSubTaskLines` 同址
   ⇒ **墓碑写入单一权威**保持〔§6.8.3.3〕；**只写** `_frozenSubKeys`、**不写** `_frozenSubTask` 载体行）⇒ 后续 `⟦ev⟧stopped` 经 `ensureSubTaskKey` 直接丢弃（零幻影块——探针实证的 `state.lines` 0 → 1 路径封死）；
   写入条件 = **与移除同一守卫**（`live && !live.done && live.async !== true`——命中即移除 + 写墓碑；无块可移除的 no-op 面不写，语义零扩）。
   **与墓碑存活闸（§6.8.3.2 P0-a）的交互**：写入时该条目已终态（`cancelled` + `done` + 出池）⇒ 存活判据 false ⇒ 维持丢弃（不再建块）；
   若同 key 条目仍存活（未来重启路径清终态位）⇒ 闸门摘墓碑 + 重建块（`ev:subagent-block-revived` 留痕）——**不构成永久失明**。
   同一幻影的**另一面已封死（c1）**：补位不启动终态条目（`docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.9）——「取消后仍被 settle」的燃料族无关消失。
- **冻结头**：`[✓ explore#1 · sync · model · done 45s]`——**图标三态互斥（M5）**：`⏸`（审批态）→ `⏹`（`stopped` ∪ `error`）→ `✓`（其余），与动词同源（三词 `stopped` / `error` / `done`；错误面注记 ` — <err>` 居括号外——跨端归一面；
  `thincoder-cli/src/tui/render-segments.mjs` `frozenSubTaskLines` 图标行；跨端标尺 = 核件 `thincoder-render-core/subblocks/activity-view.mjs` 冻结头——`error` 面与 stopped 面同形；运行中面板头无 `stopped` 分支 ⇒ 不并）；
  动词按状态（cancel 冻结 → `stopped`；interrupt 清场 → `interrupted` 标）；**已结算待消化中间态**（settle 一律 `⟦ev⟧settled`——挂起 ∥ 非挂起两态统一）——等待消化，面板显示 `done · awaiting digestion`。
- **advisor 块**：运行中 = 对话流内可折叠框（key = `advisor-blocks`，单实例；头 `[advisor · review] N lines` + tail 3；
  展开 = `renderBlockTimeline` 有序块时间线——think ↔ tool 交替按发射序）；完成 → 冻结 `_frozenAdvisor` 载体；
  async advisor ⏹ = 取消后台评审；压缩以同款面板块渲染（`docs/core/design/CONTEXT-COMPACTION.md` §8 权威）。

#### 6.8.1 活动块去加戏（既有决策）

- **报告 preview**：sync spawn 完成**不**往会话流塞 8 行 dim 摘要与 `... (N more lines)` 行——
  冻结块是子代理报告的**唯一显示载体**（全文在 history 供模型）。
- **`finishSubTask` 收窄为精确匹配校验**：`finishSubTask(state, roles, lastError)` 恒 no-op 返 null
  （否决「最早 started」启发式——宁可 no-op 不误冻）；`finishSubTaskKey`（dispatch `ctx._subagentKey` 精确 key）
  是**唯一完成路径**；无 key 窗口的块由回合尾 `freezeAllSubTasks` 兜底清场。
- **墓碑存活闸**：「回合尾 `freezeAllSubTasks` 兜底清场」的兜底面**收窄为仅非存活块**——
  池内仍存活的条目不得被冻结 / 写墓碑；墓碑生效点与复活语义见 **§6.8.3**（本节不重述）。
- **面板读时现算**：`computePanelBlocks(state)`（subTasks 活值纯推导）；
  `index.mjs` 反向挂载 `agent._tuiState = state`——**门控语义零动**（单账本）。
- **降级路径**：无 TUI 装配（headless / VSC / 子代理）→ 现算返 null → view 降级池视图 + freeze 报不可用。
- **已结算待消化态零动**：settled 三态机 / `_freezeAt` settle 锚 splice / `shiftFreezeAnchors` 头裁补偿 /
  降序 splice / `freezeReclaimDigestedBlocks` 逐条**兜底幂等**回收（主面 = 起跑窗——§6.9；consult 子块按会话消费判据） / `panelFreezeGate` 门控（同判据）全部保留。

#### 6.8.2 嵌套子代理：内层活动并入外层流

**机制**：内层 relay 前缀（如 eng-coder 内 explore）的活动行（工具 / 输出 / 文本 / 思考）**并入外层块活动流**
（`sub.blocks`）——与其他工具调用同款：折叠 tail 3 直达、展开全量时间线可达（任意 inner 深度）。
内层完成 / 终止信号照旧（供子块守护定格，不再有显示面）。

- **路由目标上移**：`routeSubToken` / `routeSubReasoning` / `routeSubToolCall` / `routeSubToolOutput` 的嵌套分支
  append 目标 = 外层块（与单层分支同函数）；kind 合并 / fresh 语义照旧；内层 `[model]` token 与 `⟦ev⟧done/stopped`
  定格照旧剥除（不进内容流）。
- **子块载体 = 守护元数据**（key / role / model / done / stopped / currentTool / children——无内容行）：职责收窄为
  ① done 后迟到 chunk 丢弃；② 外层冻结时未收尾子块不悬空（定格 stopped）；③ 内层工具 fresh 判别。
  正读者只有 `done` / `currentTool` / `children`。
- **渲染单流**：面板与冻结渲染只读 `sub.blocks`（折叠 = 头 + tail 3；
  展开 = `renderBlockTimeline` 60% 封顶窗口——既有组件零改）。折叠键只剩 `sub-${key}`。
- **行数额度单环**：内层内容就地计入外层 500 行环（树记账收窄为单载体记账）；
  trim 收窄为单载体最旧先行（否决「保留子块先丢」优先级遍历——收益不值；代价如实：内层批量输出与外层叙述同环最旧先行）。
- **省略计数真值**：`…（已省略 N 行）` 的 N 只随**内容移除**增长；标记自身不占额度、不计入 N；
  `countBlockLines` 口径 = **显示行**（块尾 `\n` 的空元素不计）。
- **已知失效前提（未来复核项）**：同一外层块若出现两个**并发**内层子块交错，内层输出会并入末块的他人工具头块
  （`pushBlock` 仅按 kind 合并）；当前不可达——`depth > 0` spawn 恒同步（下游对 `depth > 0` 拒 async），
  未来放开并行嵌套时须复核。
- **嵌套归属标（裁定：消）**：两端同形——嵌套活动行**无归属标**（VSC 侧行首 dim 子标渲染删除，对齐 CLI 形；`dataset.sub` 合并判据保留 = 机制面，与 CLI `fresh` 判别同族）。
  **裁定 = 「按推荐推进」（A9 ⇒ 按「端差默认 = 消」）**；消解落点 = `thincoder-vscode/webview/ui.js`；判据 = 可见面零「`<role>#<id> · `」前缀 ∧ 嵌套合并语义零回归（既有用例族）。

#### 6.8.3 异步子代理「零块」修复

> 范围：块生命周期的**墓碑存活闸**（显示面）+ 静默面留痕；**发射面零改**。

**6.8.3.1 修法落点与生效面**

⇒ 修法落在**墓碑生效点单一收口**，不逐触发源打补丁（D-ZB1）。

**① 行可达条件**：`agent-turn.mjs:310` 站点仅在 `!willSuspend && !inSessionTurn` 时执行
（`:232` / `:240`；`willSuspend = poolLive(agent)`）⇒ 执行时两池必空 ⇒ P0-b 对该站点恒 no-op（存活条目**不可达**）；
**P0-b 真实生效面 = `thincoder-cli/src/tui/suspension-drive.mjs:174`**（挂起会话退出：中止路径经 discard 只清已死条目 ⇒ 池内存活者在场）。

**6.8.3.2 设计与逐字契约**

**不变量**：**墓碑只能断言「此块已终」，不得对「仍在池中存活」的条目生效。**

```text
spawn 撞域 → ⟦ev⟧queued → routeSubToken → ensureSubTaskKey 建 waiting 块             [不变·E1 证无缺陷]
域释放   → maybeRefillAsync → entry.start() → ⟦ev⟧async + [model] → 同 key 转 running  [不变]
墓碑源   → freezeSubTaskLines（写 _frozenSubKeys）                                     [不变]
后续 token → ensureSubTaskKey：墓碑命中 → ★存活闸（新）
              存活   → 摘墓碑 + 重建块 + 摘旧冻结载体行 + 留痕（日志面一行 / 每次复活一条）                    [P0-a 复活]
              不存活（池外 / done / cancelled）→ 丢弃（现状——迟到 chunk 正常面，不留痕）               [不变]
回合尾清扫 freezeAllSubTasks → ★存活跳过（新）：池内存活条目保留 live（等待消化；已终态照旧冻结）                     [P0-b]
```

**P0-a 存活复活**（`subagent-blocks.mjs:80-99` `ensureSubTaskKey`）：墓碑命中时，先以 key（`role#id`）调
`livePoolHas(state, key)`（活池查询面与 key 映射见 §6.8.3.3）——**存活判据（逐字）**：**条目在池 ∧ `entry.done !== true` ∧ `entry.cancelled !== true`（running/queued）**〔判据先例 = `thincoder-core/agent-tools/async-discard.mjs:55`——零新谓词；仅「键在池内」会违 `subagent-blocks.mjs:81` 守卫原意〕；
命中存活 ⇒ ① `_frozenSubKeys.delete(key)`；② **摘旧冻结载体行**（见下）；③ 照常建块（model / async 由后续
`⟦ev⟧async` / `[model]` 重填）+ 留痕；**否则维持现状丢弃**。
**旧载体行处置（二选一取「摘除」）**：墓碑源已把 `_frozenSubTask` 行 splice 进 `state.lines`
（`subagent-freeze.mjs:88-92`）；不摘则一 key 两载体、折叠键 `sub-${key}` 两处共用
（`thincoder-cli/src/tui/render-segments.mjs:76` / `thincoder-cli/src/tui/subagent-panel.mjs:50`）⇒ 旧块永久留流。**取摘除**：`removeFrozenSubTaskLine(state, key)` = 摘该 key 全部
`_frozenSubTask` 载体行 + `releaseLine` 负向出账（增删均须过账——`display-budget.mjs:145-151`）+ 摘除位之后
`_freezeAt` 在途锚点 −1（`shiftFreezeAnchors` 同款语义）。
**helper 归址**：`livePoolHas` / `removeFrozenSubTaskLine` 定义于 `subagent-freeze.mjs`（与墓碑写点 `freezeSubTaskLines` 同址——
墓碑条件 / 墓碑写入 / 载体行增删单一权威）。import 方向 blocks → freeze 既存（`subagent-blocks.mjs:31`）⇒ **无环**。

**P0-b 清扫存活跳过**（`subagent-freeze.mjs:212-225` `freezeAllSubTasks`）：遍历时对**存活** key **跳过**（不置 done、
不 `freezeSubTaskLines`、不出 `subTasks`）——**存活判据（逐字）**：**条目在池 ∧ `entry.done !== true` ∧ `entry.cancelled !== true`（running/queued）**；
**已终态（含 done-in-pool——`entry.done` 置位 = `async-settle.mjs:203`，settle 后未收集条目仍留池：`async-settle.mjs:259` / `thincoder-core/agent-tools/async-discard.mjs:13-14`）照旧冻结清场**；
池外条目照旧冻结（中断 ghost 语义不变）。

**P1 禁静默留痕**：① 复活分支留痕——**走日志面** `logEvent("ev:subagent-block-revived")`；
**每次复活记一条（无去重状态）**——墓碑删后可再次命中复活，逐次留痕；若要「同 key 去重」须新增载体 = 第二份存活账，
否决（D-ZB3 同源）。② `refreshQueuedTokens` 的 `catch {}`（`subagent-scheduler.mjs:357-359`）保持不破坏池状态，
补 `logEvent("ev:queued-paint-failed")` 留痕。
**UI 决策（已定——不悬空）**：本档**不新增**会话流提示行与面板形态——用户的可见证据 = **块回归本身**
（活动流恢复跟随）；留痕只走日志面（机判可查）。

**降级**：`state._agent` 缺省（headless / 子代理内 / 测试夹具）⇒ 无存活信息 ⇒ 与批前**逐字等价**（丢弃），零回归。

**6.8.3.3 接口契约（读取面）**

| 面 | 形态 | 说明 |
|---|---|---|
| 池读取 | `state._agent?._asyncSubagents` / `_asyncAdvisors`（Map） | 存活单一事实源；键 `String(id)`；**存活判据（逐字）**：**条目在池 ∧ `entry.done !== true` ∧ `entry.cancelled !== true`（running/queued）**（done-in-pool 留池 = `async-settle.mjs:259` / `thincoder-core/agent-tools/async-discard.mjs:13-14`） |
| helper 归址 | `livePoolHas(state, key)` / `removeFrozenSubTaskLine(state, key)` 定义于 `subagent-freeze.mjs`，导出供 `subagent-blocks.mjs` import | import 方向 blocks → freeze 既存（`subagent-blocks.mjs:31`）——**无环** |
| key 匹配 | **写死映射**：最后 `#` 切分 → `role` + `id`；命中 = `pool.has(String(id))` ∧ `entry.role === role`；非池键（`compress#N` 等）= false | 池键 = `String(id)`（`subagent-run.mjs:202` / `advisor-async.mjs:441`）⇒ `pool.has(key)` 恒 miss；与 `_frozenSubKeys` / `subTasks` 同命名空间；存活判据（逐字）同 §6.8.3.2 P0-a |
| 挂载 | `index.mjs` 已挂 `state._agent`（§6.8.1 降级路径条） | 既有先例：`thincoder-cli/src/tui/subagent-panel.mjs:123` 读 `_syncChildAborts` |
| 降级 | `state._agent` 缺省 ⇒ 无存活信息 | 维持丢弃（零回归） |

**6.8.3.4 受影响文件**

| # | 档 | 文件 | 现况 | 本次动作（file:line） | 预计后 |
|---|---|---|---|---|---|
| 1 | CLI·源 | `thincoder-cli/src/tui/subagent-blocks.mjs` | 437 | `:31` import 面加 `livePoolHas` / `removeFrozenSubTaskLine` · `:80-99` `ensureSubTaskKey` 墓碑分支加存活复活 + 旧载体行摘除 + 留痕 | ~460 |
| 2 | CLI·源 | `thincoder-cli/src/tui/subagent-freeze.mjs` | 176 | `:142-154` `freezeAllSubTasks` 加存活跳过 + 新增导出 `livePoolHas(state, key)` / `removeFrozenSubTaskLine(state, key)`（与墓碑写点同址） | ~205 |
| 3 | 核·源 | `thincoder-core/agent-tools/subagent-scheduler.mjs` | 429 | `:340-342` catch 补 `logEvent`（+ 顶注 import 面 `:12-22` 补 `logEvent`——现未 import） | ~437 |
| 4 | CLI·测（**拟新增**） | `thincoder-cli/test/subagent-zero-block.test.mjs` | 新 | T-ZB1–T-ZB6（§6.8.3.6）；直驱 `routeSubToken` / `freezeAllSubTasks` / `refreshQueuedTokens`——零网络、零定时器 | ~120 |
| 5 | 设计档 | `docs/cli/design/TUI.md` | 737 | 本节（§6.8.3）+ §6.8.1 指针行 | 本档已落 |

**跨文件限**：三份源档预计后均 < 800 硬限（460 / 205 / 437）——**无拆分需要**。

**6.8.3.5 关键决策记录**

| # | 决定 | 理由 |
|---|---|---|
| D-ZB1 | 落点 = **墓碑生效点单一收口** | 触发源 ≥2 且会增；单点 = 存活性判据一处（单一权威源） |
| D-ZB2 | 存活 ⇒ **复活建块**（非仅留痕） | 块是子代理活动的唯一显示载体；复活让运行重新可见并继续跟随活动流 |
| D-ZB3 | 存活判据（逐字）= **条目在池 ∧ `entry.done !== true` ∧ `entry.cancelled !== true`（running/queued）**——取 `state._agent` 活池 | 池即存活单一事实源；**done-in-pool 常态留池**（`async-settle.mjs:259` / `thincoder-core/agent-tools/async-discard.mjs:13-14`）⇒ 仅「键在池内」会误判已终态为存活 |
| D-ZB4 | **发射面零改** | E1 复现已证 `⟦ev⟧async` / `[model]` 锚点无缺陷；by-design「queued 不发 `[model]`」保持 |
| D-ZB5 | 不存活 ⇒ 维持丢弃**且不留痕** | 迟到 chunk 是**正常高频面**（§6.8.1 定格丢弃）；留痕会刷屏 |

**6.8.3.6 用例表（正常 / 边界 / 错误）**

| # | 类 | 输入 | 期望输出 |
|---|---|---|---|
| T-ZB1 | 正常 | `⟦ev⟧queued` 建块 → 墓碑（`freezeSubTaskLines`）→ **池内该条目仍存活**（真实池键形 `set("2", entry)`；`done` / `cancelled` 非 true）→ `⟦ev⟧async` + `[model]` | 块复活：`subTasks[key]` 存在、`_frozenSubKeys` 无该 key、`async === true`、`model` 落位（`[model]` 面）；**旧 `_frozenSubTask` 载体行已摘除 + 账不飘** |
| T-ZB2 | 正常 | 接 T-ZB1 → 文本 + `⟦ev⟧turn` + 工具 token | 全部入块（活动流跟随；面板渲染 1 块） |
| T-ZB3 | 边界 | 墓碑命中 + **不存活两形**：① 池外真终态 ② 池内 done-in-pool（`entry.done === true`——settle 后未收集）→ 迟到 chunk | 维持丢弃（两形同判）：`_frozenSubKeys` 仍含该 key、`subTasks` 无该 key（不复活幽灵块） |
| T-ZB4 | 边界 | `freezeAllSubTasks`：池内存活块 + 池外已终块 + **池内 done-in-pool 块** | 存活块保留在 `subTasks`（未置 done、未写墓碑）；池外已终块与池内 done-in-pool 块照旧冻结进流（已终态不被跳过） |
| T-ZB5 | 错误 | `state._agent` 缺省（headless / 夹具）→ 墓碑命中 | 与批前逐字等价（丢弃）——零回归 |
| T-ZB6 | 错误 | `refreshQueuedTokens` 的 `onToken` 抛错 | 池状态不被破坏（现状）；留痕一条（新） |

**6.8.3.7 验收标准（逐条回指；每条可机判）**

| # | 验收标准 | 机判 | 回指 |
|---|---|---|---|
| AC-ZB1 | 墓碑命中且条目**存活** ⇒ 复活建块 | T-ZB1 / T-ZB2 | §6.8.3.5 D-ZB2 |
| AC-ZB2 | 墓碑命中且条目**不存活**（池外 / `entry.done === true`〔含 done-in-pool〕/ `entry.cancelled === true`）⇒ 维持丢弃（迟到 chunk 丢弃语义不回归） | T-ZB3 | by-design 面 |
| AC-ZB3 | `freezeAllSubTasks` 不冻存活条目；已终态（含 done-in-pool）照旧冻结 | T-ZB4 | 清扫面 |
| AC-ZB4 | 发射面零改：域释放补位仍发 `⟦ev⟧async` + `[model]`；queued 仍不发 `[model]` | 既有断言（`advisor-pool-queue.test.mjs:86/211`——**仅 async 面**）+ T-ZB1（**`[model]` 面**落位断言） | §6.8.1 发射面 |
| AC-ZB5 | 降级面（无 `state._agent`）行为与批前逐字一致 | T-ZB5 | §6.8.1 降级路径条 |
| AC-ZB6 | 留痕：复活分支与 relay 异常各留一条可观测痕（禁静默） | T-ZB6 | P1 禁静默留痕 |
| AC-ZB7 | 两端集成测试绿（`npm test`） | `npm test`（cli + core） | 常规门 |

**6.8.3.8 边界（不做）**

- **不改发射面**：`subagent-run.mjs:163-165` 两 token 锚点、`subagent-scheduler.mjs:331-344` queued 发射——E1 已证无缺陷。
- **不新增按族分支**：墓碑是共享单点，修复天然覆盖 subagent / escalate / advisor / consult / compress 五族，但**不新增任何按族代码**（非「扩族」）；**复活可达面** = 键可映射到 §6.8.3.3 两池条目者（subagent / escalate / advisor）；非池键（`compress#N` 等）判 false ⇒ 维持既有丢弃语义（零回归——非本面修面）。
- **不改**：`isAsyncSpawnResult` 判定面（`tool-display.mjs:119-126`）· `⟦ev⟧cancelled` 出队语义（`subagent-blocks.mjs:189-199`）· `awaitingDigest`（等待消化）与 `_freezeAt` 锚点（§6.8.1 已结算待消化驻留零动——用户裁定）· `computePanelBlocks` 现算面。
- **不引入**块落盘恢复；不改提示词 / 需求档 / `_archive/**`。
- **VSC 对位不在本次**（VSC `panel-callbacks.mjs` / `suspension.mjs` 为独立实现）——登记为观察项。

### 6.9 消化轮（digest auto-turn）可见面（X9）

- **起跑标签两档**：dim 行按因取键（**ask 因恒优先**）——ask ⇒ `digest.turnLabelAsk`（携 `from` / `msg`——核单点 `upstreamAskLabelVars`）/ digest ⇒ `digest.turnLabel`；**manual / AUTO 两档同判**；字面单源 = 核 i18n 容器（CLI 零自持字面；VSC 端对位见 `docs/vsc/design/WEBVIEW.md` §5.1）。
- **起跑数行**：标签行之后、`runAgentTurn` 之前 `pushLine(t("digest.start", { n: pend0 }), C.dim)`——规则 = **`pend0 > 0`**（`pend0 = pendingFamilyCount(agent)` 取数前置，与收尾行同源；ask-only 轮零此行）。
- **收尾行（X9）**：轮尾 `pushLine` 一行 dim（**到达序追加于当刻流末**——终态行；零就地换文 ∥ 不动原起跑行）——完成 ⇒ `digest.done`（`已消化 N 份后台报告（Xs）`）/ 中止与失败 ⇒ `digest.aborted`（`消化中断（Xs）`）；
  **`pend0 > 0` 守卫**（ask-only 轮零收尾行——done / aborted 两形态同判）；**文案单源 = 核 i18n 容器**（`t()` 取值——CLI 侧首个核 i18n 消费点）；**计数口径 = 起跑数**（与 VSC 端同源——消费数另计会引入双口径）；秒位 = `toFixed(1)`（与 VSC 同式）。
  **`unsettled` 残余行**：消化轮收尾后本轮仍有未销账条目（`_daFailures > 0` 的在途条目数 > 0）⇒ 终态行之后再落一行 dim（`t("digest.residue", { n })`——核字典新键，逐字 = 核容器）；**两行同屏口径**：终态行 N 仍按起跑数（不扣减）∥ 未销账数由残余行承载（两行各表其一）；
  零未销账 ⇒ 零此行（零噪音）；记录面 `digestEndRecord` 同携 `unsettled`（重建同调——`lifecycle-records.mjs`）。判据 / 机制单源 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.31。
- **边界**：`digest:start` / `digest:end` 日志事件零改（LOGGING 面）；消化轮机制 / 计数语义零改（编排面 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.8；可见面口径单源 = `docs/core/design/AGENT-LOOP-UPSTREAM.md` §6.27.12.13 ①–③——本节 = CLI 侧落地形态）。
- **行出即留（显示面）**：行 = 流内事件，**出即留**——起跑行 ∥ 计数行 ∥ cap 行 ∥ 终态行：**不改 ∥ 不删 ∥ 不退场**（零清理机器：无终态摘除 ∥ 无换代删旧 ∥ 无复列截点）；新轮起跑 = **追加**（旧轮行留置原位）；
  **重建复列 = 全量**（记录序 ≡ 恢复序——逐轮痕行按其记录位次出；未结轮照现（无 `end` 记录 ⇒ 起跑行 ∥ 计数行 ∥ cap 行照出——三端同判））；**记录面照留**（`digest` 记录全量——`lifecycle-records.mjs` ∥ 会话视图重建承接零动）；口径 = 用户裁定「CLI/VSC也跟。」。
- **固化块归档（起跑窗 ∥ 落位 = 当刻流末（起跑刻语义）——用户裁「A」（两端随正））**：消化起跑点（起跑行族落盘后）即对本轮将消费的驻留块（起跑快照 = 起跑刻在 pending 单容器的 awaitingDigest 块；consult 子块按会话消费判据）逐条**冻结入流**；
  **落位 = 当刻流末（起跑刻语义）**——起跑窗径 = 显式锚「起跑族尾」（行族落盘后——行族在流末时即「放族后」；终态行 = 到达序追加——其位可与其族本体不相邻）；`reclaim`（`thincoder-cli/src/tui/suspension-drive.mjs:212` → `freezeReclaimDigestedBlocks`）= **兜底幂等**（起跑窗漏口 ∥ 迟结算面）——**迟到面落位 = settle 锚位**（无显式锚 ⇒ `_freezeAt`（settle 刻流位置）∥ 无锚 ⇒ 流末；
  迟结算块 settle 位次在族输出区内——恒居本族之后）；退出 `freezeAllSubTasks` = 兜底同型（settle 锚 ∥ 无锚 ⇒ 流末）；重建镜式 = `subagent` 记录居其消费轮族之后（`startup.mjs` 读面随动）；机制面 = 行数组 splice（`thincoder-cli/src/tui/subagent-freeze.mjs` `freezeSubTaskLines`——锚 = 显式锚（起跑族尾）∥ `_freezeAt` ∥ 流末）；
  同形对位 = 桌面「起跑窗（`ev:digest start` 逐条补发 → 随到达入流——行族在流末时即「放族后」）」∥ VSC「起跑窗（宿主逐条补发 → `insertAfter` 边界行）」——三端同形同义。

## 7. 状态栏与用户介入提醒（attention 态）

> 本机制让「需要用户介入」在状态栏**可见**。

### 7.1 触发集合（裁决）

| 信号面 | 裁决 | 理由 |
|---|---|---|
| 审批卡挂起（`state.permission`） | **计**（blocked） | agent 阻塞——不回应则零进展 |
| 提问卡挂起（`state.question`） | **计**（blocked） | 同上 |
| 回合结束等待输入（顶层回合链尾） | **计**（awaiting）——**除外**：在途 timer ∧ 唤醒会武装（`agent.timerWake` 开） | agent 已停、无自动续跑——「不用反复切回来」的主用例；**除外理由** = 自动续跑在途（到期 ⇒ timer 轮——`docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.30）⇒ 不计 awaiting）；**周期项在途 ⇒ 除外恒生效——有意语义**（持续自动续跑在途——`docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.30.18） |
| picker / wizard / search / interruptPrompt | 不计 | 用户自己发起——在场已由发起动作证明 |
| pendingInput 队列（挂起 / busy 期；容量 8） | 不计 | 是**用户自己的**待交接输入，非 agent 需要用户 |
| 挂起会话（池 live） | 不计 | 自动续跑中——不需要用户动作 |
| design token 门 / 工具拒绝 | 不计 | 无独立 UI 态；其「需要用户」部分由上述三类承接 |

### 7.2 契约

- **派生（纯函数——`render-frame.mjs` 导出，供测试直驱）**：`attentionKind(state)` →
  `"blocked"`（`state.permission || state.question`）∥ `"awaiting"`（`state.attentionAwaiting && !processing && !suspended && !_suspPending`）∥ `null`。
- **提示语（chip——逐字；优先级 kind 内 blocked > awaiting；blocked 内 permission > question）**：
  `⚠ 等待你的审批` / `⚠ 等待你的回答` / `⚠ 等待你的输入`。
- **渲染契约（`renderStatus`）**：attention 非 null ⇒ 整行以注意力色对包裹——**背景 = ANSI 43（黄底）+ 前景 = ANSI 30（黑字）**；
  行首 = chip，其后 ` │ ` 分隔，再接既有内容——**内容零省略**。既有内容含内部 `ansi.reset`（banner / ctx 警示段）——
  实现须在每次内部复位后**重施加底色**（否决替代 = 剥离内部样式——会丢上下文警示色与 banner 色相）。
- **宽度预算**：`statusMax = cols − 1 − width(bannerPrefix) − width(chip + " │ ")`——整行仍 ≤ `cols − 1`（既有口径）。
- **稳态（不闪烁）**：attention 色随帧派生——**无空闲重绘定时器**。
- **负向锁（零侵入）**：attention 为 null ⇒ 输出与改动前**逐字节等价**（机判口径 = 零 `\x1b[43m` 序列 + strip-ANSI 文本无 chip）。
- **置位（1 点——回合链尾）**：`userNeededAtTurnEnd(state, agent, skipSession)`（`agent-turn.mjs` 导出纯函数，可直测）——
  排除 `skipSession` / 挂起两态 / 池 live / 队列非空 / processing / **在途 timer ∧ 唤醒会武装**（主 agent `_pendingTimers` 非空 ∧ `agent.timerWake` 开——§7.1 表 awaiting 行除外；唤醒会武装 ⇒ 自动续跑在途；**周期项在途 ⇒ 除外恒生效——有意语义**；机判 = T-TW13）；
  命中 ⇒ `state.attentionAwaiting = true` + `render()`。
  置位点 = 顶层链尾（**非回合末 finally**——finally 后还有队列续发与挂起会话，在那之后才真正「无人接手」）。
  中断结束与错误结束同样置位（agent 已停、等用户——语义一致）。
- **清位（2 点——输入即在场）**：**键盘** = `key-handler.mjs` `onKeypress` 入口（模态分派**之前**）清位 + 仅当原值为真时 `render()`；
  **鼠标** = `input-face.mjs` stdin `data` 处理器内（`:62`——滚轮分支与 `onMouseClick` 调用前；单点覆盖滚轮 / 点击）。
  blocked 两态无需清位（实时派生——提示消解即消失，零残留）。
- **state 字段**：`attentionAwaiting: false`（`tui-state.mjs` state 字面量——默认关；不落盘、不进会话）。
- **边界**：不做闪烁 / 系统级通知 / 终端标题改写 / 响铃；不引入空闲重绘定时器；不改状态栏既有信息面与既有按键 / 模态 / 挂起语义。
  **VSC 对位**：审批 / 提问挂起已有 waiting 态；回合结束等待输入与面板内 attention 态待建——**各端独立实现**，
  语义同源（不做 byte-identical），登记归 VSC 轮。

### 7.3 模式 banner（ENG / PLAN / AUTO / ADVISOR）——工具驱动变更的显示契约

- **位置**：`renderStatus` 行首 banner 段（`thincoder-cli/src/tui/render-frame.mjs:233-237`）——`AUTO│` / `PLAN│` / `ADVISOR│` / `ENG│` 四段，其中 PLAN / ENG 即**模式指示器**。
- **契约（每帧 recompute）**：banner 从**活对象**直读（`agent.planMode` / `agent.config.agent.engineering` / `agent.autoApprove` / `agent.config.advisor.guard`），**零缓存副本、零推送链**。
- **后果**：agent 经工具翻转模式（`eng` / `plan` 工具）⇒ banner 在帧内反映——回合中 1s ticker + 行 diff 重绘（`thincoder-cli/src/tui/agent-turn.mjs` 回合驱动器）⇒ **CLI 端无需任何联动改动**（CLI 半）。
- **参数面同款**：状态栏 turn / token / context 段与模型段同取**活对象 / TUI 状态**
  （`thincoder-cli/src/tui/render-frame.mjs` 的 `:376-392` 段——`agent._currentTurn` / `agent._maxTurns` / `agent.provider` / `state.tokens` / `state.ctxCache`）；
  **零 `config.json` 镜像链** ⇒ `settings` 工具驱动的参数变更在 CLI 侧**无端显示待联动项**（其生效点 = 装配期读盘，与模式面不同族）——参数面**零改**（结论同模式面）。
- **边界（负向锁）**：**不得**为模式再引入缓存副本（引入即须自建失效链——本面因此天然免维护）；本面**不入推送链**（VSC 端另有多文件推送链——单一权威源 = `docs/vsc/design/WEBVIEW-PROTOCOL.md` §3.3，本档不重述——D2）。
- **可机判**：`renderStatus(state, agent, cols, slashCommands)` 为纯函数（既有导出）——改 `agent.config.agent.engineering` / `agent.planMode` 后重调 ⇒ banner 段随变（同调用内零状态）。

### 7.4 会话标题段（常显 · D8）

- **落点**：`buildStatusLine`（`thincoder-cli/src/tui/render-frame.mjs`）**状态段簇尾**——`ledgerHint` 之后、键位组（` │ ${enterHint}`）之前；与「L1 台账常驻标记」同区（先例 = LEDGER-SURFACE，`:401-406`）。
- **取值 = 活对象单读**：`agent.title`（写点四处：载入 `applySession` / 新建 `resetSessionState` / 回合尾 `ensureSessionTitle` / `/rename`）。每帧 recompute——零缓存副本、零推送链（§7.3 同纪律）。
- **形态**：` │ <title>`；段宽 = `sliceByWidth` 截断至 **40 显示列**（超宽补 `…`）；**空值回退链**（`title` 空白 ⇒ 显回退值——`firstMessage` ≤40 截断 ∥ `"(empty)"`）；
- **单行化不变式（本档 §7.4 = 单源）**：标题与回退标题先过 `singleLineTitle` 再进宽预算。正则 `const TITLE_BREAK_RE = /[\r\n\t\v\f\u0085\u2028\u2029]/g`，命中字符替换为**一个**空格；一字符换一空格 ⇒ 宽度账逐个守恒（`\r\n` 连写 = 两字符 = 两空格）。理由：状态栏按行绝对定位差分重绘（`thincoder-cli/src/tui/render-loop.mjs:111`），标题里一个 LF 就是一次真实换行 ⇒ 滚屏 + 差分基准错位 ⇒ 旧行残留。
- **单行化应用点（三处）**：状态栏入口标题（`thincoder-cli/src/tui/status-line.mjs:172`）· 回退标题 `sessionTitleFallback`（同档 `:71-76`，`"(empty)"` 分支不处理）· status 行写出口 `put()`（下行 `thincoder-cli/src/tui/render-frame.mjs:265`）。
- **写出口兜底**：status 行 `put()`（`thincoder-cli/src/tui/render-frame.mjs:265`）。`singleLineTitle` 由 `status-line.mjs` 具名导出，`render-frame.mjs` 同目录直接 import。
- **宽度预算**：标题段入既有 `statusMax` 链（整行 ≤ `cols − 1` 口径不变）；宽度紧张时键位组先让位（标题在键位组之前 ⇒ 标题存活优先）。
- **可见态**：idle / processing 常态在行；模态提示态（question / permission / picker / wizard / slash 提示）状态行整行让位（既有形态，零改）。
- **VSC 对位**：顶栏常显（`#session-title`）保持、端侧零改；**列表面**（`/session` / VSC `pushSessions`）两端同字段（`title`）同回退链（`listSlots` 派生——VSC `panel-session.mjs:235-243`）；
  本段取值 = `agent.title` 活读 · 空值回退链（`sessionTitleFallback`——值同 VSC：`firstMessage` ≤40 截断 ∥ `"(empty)"`）；空窗差（生成前 / 失败期）= **消**（对位 `thincoder-vscode/src/extension/panel-session.mjs:235-243`）。
- **可机判**：`renderStatus` 纯函数直驱——`agent.title` 置值 / 清空两次调用，strip-ANSI 文本读「含 ` │ <title>` / 空值 ⇒ 含回退值（`"(empty)"` 形）」两段（用例 = 单元测试档 T-XL2）。单行化面同法机判：`agent.title = "a\nb"` ⇒ 该行含 `a b` 且字符数与替换前相等、行高不变；`"a\r\nb"` ⇒ `a  b`；41 列纯 ASCII ⇒ 截断结果与改动前逐字节相同。

### 7.5 queued 反馈面（F16 · 排队期可见）

> 机制面（放行判据 / 容量 / 合并消费 / 送达链路）= `docs/cli/design/TUI-INPUT-BOX.md` §4.1——本节只落**反馈形态**（三段：提交时 / 排队期 / 消费时）。
> F13 豁免对齐（需求判定句④）：pendingInput 不出 attention——本节反馈零注意力色对（非 43 底 + 30 字）、非 chip、
> 不进 `attentionKind` 触发集合（§7.1 表）——queued 反馈是**信息面**，非「需要用户介入」面（用户自己排的队，无需在场）。

**反馈形态（三段式）**：

| 段 | 载体 | 形态（逐字） | 清除时机 |
|---|---|---|---|
| 提交时 | 状态栏 | busy 提示段**四态分流**（逐字见下表）：队列非空 ⇒ ` │ 已排队 N 条消息`（C.dim 现有段样式）；队空 ⇒ 按 busy 面显示排队句（普通 / 挂起内两句）；非 busy ⇒ `Enter: send` | 队列被消费（driver 取批 / 队列 while 取批 / 中止转残余）⇒ queued 段消失（派生自 `pendingInput.length`——零簿记零定时器） |
| 排队期（核心） | 会话流**流尾** | **待发送块**（派生插槽——逐字 / 上限 / 合并见下）：标签行（单条 / 多条两形——逐字见下「待发送块」段）+ 逐条原文（`C.dim`，每条 ≤ 3 行 + 该条超限尾标记；多条带 `i. ` 编号） | 队列被按批取走（任一时机——见下「消费时机」段；中止转残余）⇒ 派生块随判据消失——零簿记 |
| 消费时 | 对话流 | dim 行 `[sending queued message]`（`C.tool`——对位既有 `[continuing…]`）在消费点按批推送（批 = 合并计划取数单位） | 不清除——即送达回执本身 |

**`enterHint` 四态（逐字——`thincoder-cli/src/tui/render-frame.mjs` `enterHint`；判据同源 = `TUI-INPUT-BOX.md` §4.1）**：

| # | 态（判据） | 段文本（逐字） | 依据 |
|---|---|---|---|
| 1 | `processing` ∧ 队列非空（N 条） | `已排队 N 条消息` | N 条（多槽）；`pendingInput.length` 现状派生，消费即消失 |
| 2 | `processing` ∧ 队列空 ∧ `!suspended && !_suspPending`（普通回合 busy——用户回合） | `主会话处理中 — Enter 排队（当前步骤结束后自动发送）` | 步边界消费（用户回合面） |
| 3 | `processing` ∧ 队列空 ∧（`suspended \|\| _suspPending`）∧ `agent._inAutoTurn !== true`（挂起内**用户回合**在飞） | `会话内回合处理中 — Enter 排队（当前步骤结束后自动发送）` | driver 用户回合同样步边界消费 |
| 4 | `processing` ∧ 队列空 ∧（`suspended \|\| _suspPending`）∧ `agent._inAutoTurn === true`（挂起内**系统轮**在飞 = digest / 上行唤醒轮） | `会话内回合处理中 — Enter 排队（本轮结束后优先发送）` | 系统轮消费点 = driver 步骤 1（轮末）；「优先」= driver 输入优先（先于 digest 合并——D-S5） |
| — | 非 `processing` | `Enter: send` | 零改 |

**排队期 · 待发送块（会话流尾派生插槽）**：

- **落位 = 会话流尾**（`thincoder-cli/src/tui/render-conversation.mjs` 的 `buildConvLines` 派生行；渲染序在 `state.streaming` 之后）：块上方的流式内容继续增长，块恒居会话区底 ⇒ 跟随开启时排队期全程可见（F1 跟随语义）。
- **载体 = 派生**：判据 = 队列 `state.pendingInput` 非空（渲染期现算）——零 `state.lines` 写入、零生命周期簿记（消费 / 中止随判据消失）；不入搜索面、不注册折叠键与点击命中（派生行无 `_lineId` / `_foldToggle`）。
- **形态（逐字——单条 / 多条两形）**：标签行单条 = `⏳ 待发送 · 不打断当前执行，自动发送`（`C.warn`）；多条 = `⏳ 待发送 · N 条消息（不打断当前执行，合并发送）`（N ≥ 2）。
  **标签行不声明时机**（面无关——用户回合 / 系统轮两面的精确时机 = 状态栏 `enterHint` 逐字：见下「消费时机」段）；正文 = 逐条直排（`C.dim`——`sanitizeDisplay` + `wrapText(text, cols - 1)`，与正文同口径）：多条带 `i. ` 编号首行 + 续行 2 空格缩进（**编号 = 模型将看到的合并形态预览**——§“合并消费”）；单条不加编号。块前空行（同主输出呼吸行约定）。
- **体行折叠豁免（`_skipDimFold`）**：原文行 / 尾标记行携 `_skipDimFold`（`thincoder-cli/src/tui/render-conversation.mjs:380` / `:383`）——连 dim 折叠 pass（`FOLD_LINES` = 8）命中任一带标记行 ⇒ 整块不折（`:398`；零新机制——复用既有豁免，先例 = 思考流 / advisor 收缩尾）；N ≥ 3 时 dim 连跑可过 8 ⇒「永不被折走」由显式豁免保证（N ≤ 2 连跑 ≤ 8，本在阈下）。
- **宽度口径**：折行宽 = `cols - 1`（`wrapText` 作用于逐条原文）；多条态编号首行**预扣除**——`wrapTextHead(text, width, firstDeduct)`（首行折宽 = `width − firstDeduct`，`firstDeduct` = 编号前缀显示宽；单条态 / 续行照 `wrapText`）；编号首行总显示宽 ≤ `cols − 1`。实位 = `thincoder-cli/src/tui/render-conversation.mjs:387`。
- **上限**：每条原文行至多 `QUEUED_ITEM_MAX_LINES`（3）；超限 ⇒ 该条尾标记行 `… [该条共 N 行——发送后完整显示]`（`C.dim`）。**队容量** = `QUEUED_MAX_ITEMS`（8——**常量单源** = `thincoder-core/queued.mjs`（核件；CLI 经转口档 `queued-merge.mjs` 导出，显示面 / 输入门禁同源 import；与合并批上限 `MAX_MERGE_ITEMS`（8）**同值不同名**——同住核件）；块超视口时条数可见性由状态栏段兜底。
- **缓存键参与**：`convCacheKey`（`thincoder-cli/src/tui/render-conversation.mjs:125-176`）增排队签名（条数 + 各条长度 + 首 8 字——同 `blocksSig` 口径）；漏挂 ⇒ 缓存命中出陈旧帧（块不现 / 不消）。
- **跟随（F4「新提交消息 → 恢复跟随」）**：入槽即 `state.scroll = 0` + `state._followTail = true`（`thincoder-cli/src/tui/turn-face.mjs:32-33` submit 同款两行；两条入槽路径同款——busy 门禁 / 挂起态 Enter）。
- **合并消费（R15 攒批恢复）**：消费点按同一计划 `planQueuedInput`（纯函数——核单源 `thincoder-core/queued.mjs`；CLI 经转口档 `thincoder-cli/src/tui/queued-merge.mjs`）取数：连续非 `/` 条目攒批**合并为一条消息、一次回合**
  （单批 ≤ `MAX_MERGE_ITEMS`（8）条 ∧ 合并文本 ≤ `MAX_MERGE_CHARS`（2000）字符；超限截批先行、余下下批；单条 > 2000 字符直发；`/cmd` 逐条保序）；形态逐字 = `你排队了 N 条消息：` + `1. …` + `——一次处理`。
- **消费时机（三时机——步边界为主）**：

  | 时机 | 判据 / 落点 | 行为 |
  |---|---|---|
  | ① **步边界（主）** | 用户回合在飞（`autoTurn === false`）——核 loop 循环头投递回调（`consumeQueuedInput`；CLI 闭包 = `thincoder-cli/src/tui/queued-pickup.mjs`） | 当前步（一次 LLM 调用 + 其工具执行段）做完即取批 ⇒ `pushReal` 一条 user 消息入 history（**下一步生效**）+ 回执行 + `❯ You:` + 合并文本落 `state.lines`；**不中断**（在飞工具 / signal 零触碰） |
  | ② 回合尾兜底（零改） | `thincoder-cli/src/tui/agent-turn.mjs:334-353` | 队列在**末步**填充（本 run 无后续边界）⇒ 转 `state.queue` 续发新回合 |
  | ③ 驱动级（零改） | `thincoder-cli/src/tui/suspension-drive.mjs:246-257` | 挂起面无在飞用户回合；**系统轮在飞时 = 唯一消费点**（轮末——输入优先） |

  **分流（系统轮不参与步边界）**：digest / 上行唤醒轮域文本 = 整理域，手动档机械门禁（无权限 handler ⇒ 写被拒；`_inAutoTurn && !autoApprove` ⇒ spawn 拒）会把用户指令降格 ⇒ 该两轮不传 pickup 回调（机制 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.8「步边界 pickup」）。
  **与 Ctrl+I 区分（逐字）**：Ctrl+I = 立即中断当前回合（在飞段立断）+ 注入 `[User interrupt: …]` + 续跑；本通道 = 零 abort / 零中断标记 + 步边界以普通 user 消息落历史（下一步生效）。
- **消费转正（单帧切换 + 合并成形）**：**三时机**（上「消费时机」表——步边界 pickup（`thincoder-cli/src/tui/queued-pickup.mjs`）/ `thincoder-cli/src/tui/agent-turn.mjs:334-353` 回合尾兜底转正 + 队列续发 / `thincoder-cli/src/tui/suspension-drive.mjs:246-257` driver 输入优先）按计划取批
  ⇒ 派生块随判据同帧消失；同一同步段内推回执 + `❯ You:` + **合并文本**落 `state.lines`（`thincoder-cli/src/tui/agent-turn.mjs:84-87`）
  ⇒ 渲染帧合并调度（`thincoder-cli/src/tui/render-loop.mjs:38-56`——nextTick + 16ms 节流）只出**一帧**：N 条待发送块 → 回执行 + 一条合并用户消息（零空窗 / 零重复；位置 = 同一流尾）。
- **边界**：中止残余（`thincoder-cli/src/tui/suspension-drive.mjs:198-201`——按合并计划转 `state.queue`）**不渲染待发送块**（既有提示行明示去向）；吞面四（模态 / 斜杠 / 空 / 队满）零入队 ⇒ 零渲染；F13 豁免（零注意力色对）不变。

**可机判**：`renderStatus` 纯函数直驱——四态各取一条状态字面量：队列非空（N = 2）⇒ strip-ANSI 含 `已排队 2 条消息`；队空 + 非挂起 ⇒ 含 `主会话处理中 — Enter 排队（当前步骤结束后自动发送）`；队空 + 挂起 + `agent._inAutoTurn` 假 ⇒ 含 `会话内回合处理中 — Enter 排队（当前步骤结束后自动发送）`；队空 + 挂起 + `agent._inAutoTurn` 真 ⇒ 含 `会话内回合处理中 — Enter 排队（本轮结束后优先发送）`；
四态全程零 `\x1b[43m`（F13 豁免）；非 `processing` ⇒ `Enter: send`。
**排队块面（单条 / 多条两形）**：`renderConversation` / `buildConvLines` 直驱——N = 1 ⇒ 含 `⏳ 待发送 · 不打断当前执行，自动发送` + 原文行；N = 2 ⇒ 含 `1. ` / `2. ` 编号行 ∧ 标签行逐字 = `⏳ 待发送 · 2 条消息（不打断当前执行，合并发送）`；每条超 3 行 ⇒ 含该条尾标记行；队列空 ⇒ 零该串 ∧ 逐字节等价；全程零 `\x1b[43m`。
**步边界 pickup 面**：`pickupQueuedAtStepBoundary`（`thincoder-cli/src/tui/queued-pickup.mjs`）直驱——桩 agent + 队列 2 条 ⇒ history 尾恰 +1 条 user 消息（内容 = R15 合并文本）∧ `state.lines` 含 `[sending queued message]` ∧ `❯ You:` ∧ 合并文本 ∧ `pendingInput` 空 ∧ 零 `[User interrupt:]`（非中断锁）；队列空 ⇒ 逐字节等价（零推送）。
**合并消费面**：`planQueuedInput` / `formatMergedMessages` 纯函数直驱——2 条短消息 ⇒ 单动作（`merged:true`，文本逐字 = 头 `你排队了 2 条消息：` + 编号 + 尾 `——一次处理`）∧ 跨 8 条 ⇒ 截批（首动作 count ≤ 8）∧ 单条 > 2000 字符 ⇒ `merged:false` 直发。

**VSC 对位**：**busy 即排队面**（`running`——挂起会话内与普通回合同判据；队列载体两态（容量 8）：会话在飞入会话队列 `susp.pendingInput` / 无会话入 `_busyQueued`）——
机制单源 = `docs/vsc/design/WEBVIEW-INPUT.md` §1 C-B2-6；webview 反馈 = 本地气泡（提交入槽即现 / 送达即 user 回声面——形态各端自落，语义同源）；
**排队期标记** = 各条气泡带 `pending` 标记 + 标签行 `⏳ 待发送 · …`（键 = `queued.pending`）；消费即除标记、**多条批就地合并为一条气泡**（单条批就地保留——回声面；细则⑦——同处 C-B2-6）；**步边界消费**（用户回合在飞——端壳循环头同址回调；同判据 = `docs/vsc/design/WEBVIEW-INPUT.md` §1 C-B2-6 细则②④）同走「消费成形」快照。

### 7.6 timer 可见面（三态 · 有才出声——FR24 同法）

> 机制面（到期件 / 自唤醒 / 开轮）= `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.30——本节只落**显示形态**（D2）。
> 语法来源 = FR24（台账提醒与可见面，`docs/core/requirements/ENGINEERING-MODE-V2.md` §13.3）「状态行极简标记 + 会话流明细行 + 有才出声零噪音」；
> F13 豁免对齐（同 §7.5 口径）：timer 面 = **信息面**（用户自己让 timer 在跑）——零注意力色对（非 43 底 + 30 字）、非 chip、不进 `attentionKind` 触发集合（**§7.1 表 awaiting 行除外限定**：在途 timer ∧ 唤醒会武装 ⇒ 不计 awaiting——§7.1 / §7.2；timer 面自身零新增 signal 面）。

**三态定义（逐字）**：

| 态 | 判据（活读） | 形态 |
|---|---|---|
| 已设 | `agent._pendingTimers` 非空 | 状态行段 `⏰N`（N = 在途数；常态 = 既有 dim 段样式） |
| 到期 | 任一在途项 `expiresAt <= now`（未送达） | 同段取**警示色**（`C.warn`——同 `ledgerHint` 警示段实现口径） |
| 触发 | 送达发生（历史注入 + 开轮） | 会话流一行 + timer 轮开跑 |

**落点与形态**：

- 状态行段落点 = `buildStatusLine` **状态段簇尾**——`ledgerHint` 之后、`titleHint` 之前（先例 = §7.4 标题段与 LEDGER-SURFACE 同区）；形态 = ` │ ⏰N`（warn 态 = `ansi.reset` + `C.warn` 包裹后复归 dim——同 ledgerHint 实现口径）。
- 取值 = `agent._pendingTimers` **活读**（每帧 recompute——零缓存副本 / 零推送链，同 §7.3 / §7.4 纪律）；**不显倒计时**（空闲无重绘定时器 = §7.2 既有负向锁；剩余时间只在 `/timers` 列表按需现算）。
  **到期态可达条件**：警示色需有帧窗口——以处理中 / 挂起期为主（空闲期零重绘 ⇒ 到期到送达间可能零帧）；`agent.timerWake` 关的空闲面 = 无闩、无空闲重绘 ⇒
  只在下一次偶发重绘（用户输入 / 回合起）可见——**不承诺空闲期即时可见**（§7.2 零空闲重绘定时器纪律）。
- **触发落流（一行）**：送达处推一行——逐字 = 既有系统提醒形态 `[System reminder: ⏰ timer — <message>]`（`C.warn`；三行 + 省略号上限同既有提醒镜像口径）。两路同形：
  ① 在飞回合 = 既有回合尾镜像（`thincoder-cli/src/tui/tool-events.mjs:434-441`——零改）；② 空闲 / 挂起窗唤醒 = 投递处直推（新增）。
- **`/timers`（只读列表——最薄）**：逐条 dim 行 `⏰<i> · <kind> · 剩余 <dur> · <message 首行（截断）>`（kind 段仅非一次性项插入：`每 <N>m`（`every` 整分）∕ `每 <N>s`（非整分——秒形）∥ `每天 <HH:MM>` ∥ `于 <YYYY-MM-DD HH:MM>`；`<dur>` = `<mm:ss>`（< 1h）∥ `<h:mm:ss>`（≥ 1h——与模型 `list` 的 `next` 同形）；一次性行逐字零变）；零在途 ⇒ 一行 `无在途 timer`。
  **取消 = 模型工具 `timer` 的 `cancel` 动作**（四端同得——核件在途表移除；`/timers` 保持只读；停轮 = Ctrl+C，停机制 = `agent.timerWake` 关）；机制 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.30.18。

**负向锁（可机判）**：

- 零在途 ⇒ 状态行**逐字节等价**（零 `⏰`、零新增色对）——同 §7.2 负向锁口径；
- 子代理（depth>0）自身 timer **不进本面**（读对象 = 主 agent 单对象——构造性零泄漏；其面板时间面零改）；
- 不新增空闲重绘定时器（§7.2 纪律）；`/timers` 零在途时仍可调（空态行——非模态）。

**可机判**：`renderStatus` 纯函数直驱——`_pendingTimers` 两态（在途 2 ⇒ strip-ANSI 含 `⏰2`；含过期项 ⇒ 含警示色序列；空 ⇒ 零该串 + 逐字节等价）；`/timers` handler 直驱（逐条行 / 空态行）。

**VSC / 桌面对位**：**已接线**（`docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.30.10–§6.30.11——核件 opt-in timer 面 ＋ 端面空闲闩 ∕ 窗内兑现 ∕ 可见面）；各端取本表同语义、各自实现（非 byte-identical）。

### 7.7 停滞轻显形（在飞回合静默读数 · 三端同口径 · 语义单源）

> 来源 = 用户裁定 **B（轻显形）**：「已静默 Xs」**纯读数**——回合中显示、到点自动跳秒；**不打断 ∕ 不动作 ∕ 零控件**；三端同口径（用户可见端差 = 缺陷口径）。
> 本节 = 三端同口径的**语义单源**；VSC ∕ 桌面实现面 = `docs/vsc/design/WEBVIEW.md` §4.7 ∕ `docs/desktop/design/UI.md` §1「批注（停滞轻显形）」（D2——不重述）。
> **零机制改**：不触既有三处相关机制（`thincoder-core/agent/post-turn.mjs:31` 工具签名去重〔模型面〕· `thincoder-core/agent-tools/consult.mjs:221-230` 会诊墙钟 · `thincoder-core/agent-tools/subagent-scheduler.mjs:197` `detectStall`〔池内部〕——均非用户面）；不引第二检测 runner ∕ 不加模型面逻辑——本读数 = 纯显示面新增。

**语义（单源 · 逐字）**

- **静默** = 距**最近一次可见输出事件**的时长；读数值 = `floor(静默毫秒 ∕ 1000)` 秒。
- **可见输出事件**（重置起算 · 三类）：① 流式增量（助手文本 ∕ 推理）；② 工具面（调用 ∕ 输出流 ∕ 结果）；③ 子代理面（块状态 ∕ 内容回显）。**回合起刻 = 初始锚**（回合起 ⇒ 起算归零）。
- **显示条件** = 回合在飞 ∧ 静默 ≥ **10s**；显示域 = 回合在飞（该端既有判据：CLI `state.processing` ∕ VSC `_turnState === "running"` ∕ 桌面位标含 `running`）。
- **跳秒** = 1s 步进（重绘由各端既有拍承担——见一致性表「跳秒」行；零新增定时器）；**终态消失** = 回合终态（`done` ∕ `stopped` ∕ `error`）⇒ 读数即刻退场。
- **句式（词面单源 = 核字典键）**：`status.quiet` = zh「已静默 ${s}s」∥ en「Quiet ${s}s」——各端经自身 `t()` 出词（零自铸字面）；**不引警示色**（纯读数不判「卡住」）。
- **负向锁**：非显示条件（未至阈值 ∕ 非在飞）⇒ 零注入（CLI ∕ VSC）∕ 段零节点（桌面）——各端逐字节等价。

**起算源定形（三候选裁）**

- 候选 = 末帧流式输出 ∕ 工具起跑 ∕ 回合始——**裁 = 末可见输出起算（三类并集；回合起 = 初始锚）**。给由：① 仅末帧流式 ⇒ 在跑工具（有输出流）被误读为「静默」；② 仅工具起跑 ⇒ 无工具的静默（模型调用挂起 ∕ 长压缩）不可见；③ 仅回合始 ⇒ 读数退化为既有耗时（`elapsed` 段），不承载「没有新东西」语义。并集 = 「距最近一次可见输出」= 用户感知「没动静了多久」的直译，且纯事实（不判「卡住」——零误报伤害）。

**三端口径一致性表（可机检 · 逐端）**

| 面 | CLI | VSC | 桌面 |
|---|---|---|---|
| 显示位 | 状态行处理簇 = `elapsed` 之后（`thincoder-cli/src/tui/render-frame.mjs:409` `statusText` 定义行） | 状态行 `#status-line` = 耗时之后（`thincoder-vscode/webview/status-bar.js:47` 邻位） | 状态行承载段 = `quiet`（序 = `elapsed` 之后——`thincoder-desktop/renderer/views/statusline.mjs:48-50` `STATUS_SEGMENTS`） |
| 起算锚（回合起刻） | `thincoder-cli/src/tui/agent-turn.mjs:144`（`state.lastOutputAt` 写点；字段声明 = `thincoder-cli/src/tui/tui-state.mjs:43`） | `thincoder-vscode/webview/input.js:97`（`_turnStart` 邻位——新增 `S._lastOutputAt`） | `thincoder-desktop/renderer/events.mjs` `onActivity` turn 形（`turnStarts` 邻位——新增切片 `lastOutputAt`） |
| 重置点 ①流式 | `thincoder-cli/src/tui/tool-events.mjs:104` ∕ `:113` | `thincoder-vscode/webview/chat-messages.js:59-60`（`token` ∕ `reasoning`） | `ev:token` ∕ `ev:reasoning`（`reduce` 单点） |
| 重置点 ②工具 | `thincoder-cli/src/tui/tool-events.mjs:132` ∕ `:185` ∕ `:333`（输出流写点） | `chat-messages.js:66-92`（`toolCall` ∕ `toolOutput` ∕ `toolResult`） | `ev:tool-call` ∕ `ev:tool-output` ∕ `ev:tool-result`（同单点） |
| 重置点 ③子代理 | `thincoder-cli/src/tui/subagent-blocks.mjs:114`（`ensureSubTaskKey` 单点）· 块状态 `:175` ∕ `:197` · 压缩面板填充 `:417` ∕ `:428` ∕ `:448` ∕ `:461` | `chat-messages.js:227` ∕ `:230` ∕ `:238`（`subagent` ∕ `subagentApproval` ∕ `toolPanel`（`sub:` 前缀）） | `ev:subagent` ∕ `ev:subchunk`（同单点） |
| 跳秒（1s 步进） | 既有 1s 拍（`agent-turn.mjs:172-174`——零改） | `thincoder-vscode/webview/panels.js:49-52` `_panelTimer` = **1000** | `thincoder-desktop/renderer/heartbeat.mjs:15` `HEARTBEAT_MS` = **1000** |
| 终态消失 | `state.processing` 落 ⇒ 零注入 | `_turnState` 离 `running`（回合尾——`thincoder-vscode/webview/streaming.js:148` 邻位同清） | 位标 `running` 摘（回合尾三径）⇒ 段零节点 |
| 阈值常量 | `QUIET_MS = 10000`（`render-frame.mjs`） | `QUIET_MS = 10000`（`status-bar.js`） | `QUIET_MS = 10000`（`statusline-segments.mjs`——沿 `USAGE_WARN` 先例） |

**可机判（单元测试档本地用例）**：`renderStatus` 纯函数直驱——桩 state（`processing` 真 ∧ `lastOutputAt` = 现刻 − 10s）⇒ strip-ANSI 含核键 `status.quiet` 现值串（en 缺省 = `Quiet 10s`）；`lastOutputAt` = 现刻 − 5s ⇒ 零该串 + 逐字节等价；`processing` 落 ⇒ 零注入。VSC ∕ 桌面判据 = 各端实现面节（同表）；真机 = 父侧真跑闭合（D16 义务）。

**观察（只报 · 父侧裁）**：① CLI 语言面现无 locale（未决——CLI 侧核键现渲缺省 en）⇒ 本读数 CLI 侧现为 en 值；键面已备（键面单源），CLI 多语言面落定即随动。② 「已提交未起跑（回执未现）」窗不在显示域——「发送回执超时」面未覆盖，如实登记（上抛项）。

**VSC ∕ 桌面对位**：逐端实现面 ∕ 显示位 ∕ 判据 = `docs/vsc/design/WEBVIEW.md` §4.7 · `docs/desktop/design/UI.md` §1「批注（停滞轻显形）」（同语义、各自实现——非 byte-identical；一致性表见上）。
### 7.8 团队登录态段（F20）

> 需求 = `docs/cli/requirements/TUI.md` F20（判定句 ∥ 范围边界点名）；语义单源 = `docs/core/design/TEAM.md` §2.5「常显面」行 ∥ §2.6（校验与吊销态）。VSC ∥ 桌面对位 = `docs/vsc/design/WEBVIEW.md` §4.12 ∥ `docs/desktop/design/UI.md` §1「批注（团队登录态段 · 登录面补全）」（同语义、各自实现）。

**形态（三态闭集）**

| 态 | 判据 | 段文 | 色 |
|---|---|---|---|
| 未登录 | `team.token` 缺席 | **零注入**（整行逐字节等价——负控 = F20 判定句） | — |
| 已登录 | token 在场 ∧ `verify ≠ invalid`（`unreachable` ∥ `null` 同判——离线容忍） | ` │ <成员>@<主机>`（成员 = `member.name ?? member.username`；主机 = `URL.host`——非默认端口才带端口；**不搬 URL 全串**） | dim 常色 |
| 已失效 | `verify === invalid` | ` │ 已失效——重新登录`（核字典键 `status.team.invalid`——词形单源） | 警示色 |

**段位（簇尾序定形）**：状态段簇尾**末位**——`ledgerHint` → `timerHint` → `titleHint` → **`teamHint`**（F15/F17 位例族内；落点 = `thincoder-cli/src/tui/render-frame.mjs` `buildStatusLine` return 行 `titleHint` 之后、`│ <enterHint>` 之前）。段位与 F15/F17 不冲突（三者在场序并列；宽度超限走既有 `statusMax` 截断——同簇尾口径）。

**数据源与刷新（触发点制——零新定时器）**：`state.team` 切片（新——`{ loggedIn, member, server, label, verify }`；落点 = `thincoder-cli/src/tui/tui-state.mjs` 状态初始化 + `thincoder-cli/src/tui/index.mjs` 装配）。
写者三处：① 启动读（核 `teamStatus()`——随装）；② `/team` 命令成/退 ⇒ 复读；③ 启动 `teamVerify()` 异步回填（token 在场时）+ `/team status` 活校验回填。**每帧 recompute（活读切片）· 零缓存副本**（沿 F15/F17 口径）。

**可机判**：`renderStatus` 纯函数直驱——已登录桩 ⇒ strip-ANSI 状态行含成员名与主机；未登录 ⇒ **零该段 + 整行逐字节等价**（负控）；`verify = "invalid"` ⇒ 含「已失效——重新登录」+ 警示色序列。

**边界**：不做团队面板（状态 = 本段；入口 = `/team` 命令族——`docs/cli/design/TUI-COMMANDS.md` §5.5）；不搬服务器 URL 全串（主机形）；零新定时器（校验触发点制——`docs/core/design/TEAM.md` §2.6）；CLI 语言面现缺省 en（未决——沿 §7.7 观察①同注）。
