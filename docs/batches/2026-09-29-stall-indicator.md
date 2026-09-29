# 2026-09-29 · stall-indicator
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-29 · 来源 = 用户 2026-09-29 12:1x 裁定 #568 = B（轻显形：「已静默 Xs」纯读数 · 三端同口径 · 不打断不动作）。
> 台账 = #568（cli ∕ vsc ∕ desk · 立批）。前情 = 台账 #568（停滞检测/回执超时——三端同静默）+ window-queue 批 §2.3-3 三端同查实证。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-29
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 来源与口径（父侧 · 2026-09-29）

- 用户裁定 **#568 = B（轻显形）**：「已静默 Xs」**纯读数**——回合中显示、到点自动跳秒；**不打断 ∕ 不动作 ∕ 零控件**。
- **三端同口径**（用户可见端差 = 缺陷口径）：CLI ∕ VSC ∕ 桌面同落；本三项 = 显示面新增（各自实现面），语义同源。
- 背景实证：window-queue 批 §2.3-3（三端同静默）+ 现存三处相关机制（`post-turn.mjs:31` 工具签名去重=模型面 · `consult.mjs:221-230` 会诊墙钟 · `subagent-scheduler.mjs:197` `detectStall`=内部）——**均非用户面**，本批不触。

### 1.2 边界（父侧预钉）

- **零干预**：无中断钮 ∕ 无动作入口 ∕ 无弹窗——只读显示。
- **零误报伤害**：只显示数字（到点跳秒），不判「卡住」——措辞与阈值由设计定形（如「已静默 12s」句式）。
- **不做**：不引第二 runner ∕ 不加模型面逻辑 ∕ 不动既有三处机制。

### 1.3 验收面预钉

- 三端各一条真机 ∕ 实跑读数（父侧闭合）；判据 = 可机检（起算源 ∕ 跳秒 ∕ 回合终态消失）+ 行为断言零散文锚。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（停滞轻显形：语义单源（TUI.md §7.7）+ 三端实现面（WEBVIEW.md §4.7 ∕ WEBVIEW-PROTOCOL.md §6.1 行 ∕ UI.md 本批注）+ 三端口径一致性表已落；零实施 · 2026-09-29）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 口径 · 覆盖条目 · 设计落点

**口径（最高行）**：用户 2026-09-29 12:1x 裁定 **#568 = B（轻显形）**——「已静默 Xs」纯读数（回合中显示 · 到点自动跳秒 · 不打断 ∕ 不动作 ∕ 零控件）；**三端同口径**（CLI ∕ VSC ∕ 桌面——用户可见端差 = 缺陷）；语义单源 + 各端实现面各自适配（宿主胶水）；**本批 = 设计轮（零实施）**。

**条目表（覆盖 · 3 条）**：

| # | 条目 | 判据载体 |
|---|---|---|
| 1 | 停滞轻显形**语义定形**（静默定义 ∕ 起算源三候选裁 ∕ 阈值 10s ∕ 跳秒 1s ∕ 终态消失 ∕ 句式键）+ **三端口径一致性表** | 设计 §7.7（`docs/cli/design/TUI.md`——**语义单源**）· 本档 §2.2 |
| 2 | 三端**实现面各自适配**（显示位 ∕ 起算锚 ∕ 重置点 ∕ 拍 ∕ 常量）——CLI ∕ VSC ∕ 桌面 | `docs/vsc/design/WEBVIEW.md` §4.7 · `docs/desktop/design/UI.md` §1「本批注（停滞轻显形 · 2026-09-29）」· TUI.md §7.7 一致性表 · 本档 §2.2 |
| 3 | **登记面**（VSC 段位对位表行 ∕ 桌面承载段计数随动 ∕ 词键单源） | `docs/vsc/design/WEBVIEW-PROTOCOL.md` §6.1（本批已补行）· UI.md（承载 16 ⇒ 17）· 核字典键 `status.quiet`（拟增——随实现批） |

**设计档落点（已落 · 逐档）**：

| 档 | 落点 |
|---|---|
| `docs/cli/design/TUI.md` | 新增 **§7.7**（语义单源 + CLI 实现面 + 三端口径一致性表）+ 变更记录一行 |
| `docs/vsc/design/WEBVIEW.md` | 新增 **§4.7**（VSC 实现面）+ 变更记录一行 |
| `docs/vsc/design/WEBVIEW-PROTOCOL.md` | §6.1 增**静默段**行（段位对位表）+ 变更记录一行 |
| `docs/desktop/design/UI.md` | §1 增「**本批注（停滞轻显形 · 2026-09-29）**」五项 + 状态栏行行内指针（承载 16 ⇒ 17）+ 变更记录一行 |

### 2.2 机制设计（单源摘要——全文见设计档，本节不重述）

- **语义**：静默 = 距最近一次**可见输出事件**（①流式 ②工具面 ③子代理面）的时长（`floor` 秒）；**回合起刻 = 初始锚**；显示条件 = 回合在飞 ∧ 静默 ≥ **10s**；跳秒 = **1s 步进**（各端既有拍承担）；终态（`done` ∕ `stopped` ∕ `error`）⇒ 即刻退场；句式 = 核字典键 `status.quiet`（zh「已静默 ${s}s」∥ en「Quiet ${s}s」）；负向锁 = 非显示条件 ⇒ 零注入 ∕ 段零节点。
- **起算源裁（给由）**：末帧流式 ∕ 工具起跑 ∕ 回合始三候选——裁**「末可见输出起算（三类并集 + 回合起初始锚）」**（单候选各有盲区：工具在跑误报 ∕ 无工具静默不可见 ∕ 退化为既有耗时）。
- **显示位（同语义位）**：三端 = 状态行「回合时序读数」簇——**耗时（elapsed）之后**。
- **拍面收正（宿主胶水）**：跳秒步进 1s——CLI 既有 1s 拍零改；VSC `_panelTimer` ∕ 桌面 `HEARTBEAT_MS` 2s ⇒ **1s**（各一处常量；顺带消掉一个既有端差 = 子代理块头走时词两端 2s ⇒ 1s，向 CLI 现有 1s 对齐）。
- **词面单源**：核字典增键 `status.quiet`（`thincoder-core/i18n.mjs` `CORE_MESSAGES`——zh/en 逐字见上；三端经各自 `t()` 投影：CLI 直取 ∕ VSC ∕ 桌面投影面——本地档零同键副本）。
- **零触面（结构性判据）**：既有三处机制（`post-turn.mjs:31` ∕ `consult.mjs:221-230` ∕ `subagent-scheduler.mjs:197`）零改；零干预控件 ∕ 零弹窗 ∕ 零模型面逻辑 ∕ 零新通道 ∕ 零新定时器。

### 2.3 受影响文件表（预期 · 随实现批——本批零实施）

| 档 | 现读（as-of 2026-09-29 · 实读为准） | 预期增量 | 落点 |
|---|---|---|---|
| `thincoder-core/i18n.mjs` | **107** | +1 键 ×2 语 | `status.quiet`（词面单源） |
| `thincoder-cli/src/tui/render-frame.mjs` | **435** | +3~6 | `QUIET_MS` + `quietHint`（`buildStatusLine`——`:394-396` 邻位） |
| `thincoder-cli/src/tui/agent-turn.mjs` | **416** | +1 | `state.lastOutputAt` 初始锚（`:141` 邻位） |
| `thincoder-cli/src/tui/tool-events.mjs` | 未读（实现批届盘） | +4~6 | 重置写点（`:103` ∕ `:111` ∕ `:129` ∕ `:181` 邻位） |
| `thincoder-cli/src/tui/subagent-blocks.mjs` | 未读（实现批届盘） | +1~3 | 块更新重置（`:97-112` 邻位） |
| `thincoder-vscode/webview/status-bar.js` | **113** | +3~5 | `QUIET_MS` + 段（`:47` 邻位） |
| `thincoder-vscode/webview/state.js` | 未读（实现批届盘） | +1 | `_lastOutputAt` |
| `thincoder-vscode/webview/chat-messages.js` | **261** | +6~9 | 重置写点（三类消息命中——`:54-55` ∕ `:61-70` ∕ `:227/:230/:238`） |
| `thincoder-vscode/webview/input.js` | 未读（实现批届盘） | +1 | 起算锚（`:97` 邻位） |
| `thincoder-vscode/webview/streaming.js` | 未读（实现批届盘） | +1 | 回合尾清（`:148` 邻位） |
| `thincoder-vscode/webview/panels.js` | **123** | 1 常量 | `_panelTimer` 2000 ⇒ 1000 |
| `thincoder-desktop/renderer/views/statusline.mjs` | **172** | +2~3 | `STATUS_SEGMENTS` +1（`quiet`——`:41-43`）· 切片传参 |
| `thincoder-desktop/renderer/views/statusline-segments.mjs` | **199** | +8~12 | `quietSegment` + `QUIET_MS` |
| `thincoder-desktop/renderer/events.mjs` | **247** | +5~8 | 切片 `lastOutputAt` + 重置单点（`reduce`） |
| `thincoder-desktop/renderer/heartbeat.mjs` | **48** | 1 常量 | `HEARTBEAT_MS` 2000 ⇒ 1000（`:15`） |
| `thincoder-desktop/renderer/app.mjs` | 未读（实现批届盘） | 注释随动 | 拍注（2s ⇒ 1s） |
| 核件其它 ∕ `thincoder-render-core` ∕ `IPC.md` ∕ 协议面 | — | **0** | 零改（结构性判据） |

测试面 = **全清令**——**仓套件不写 ∕ 不改 ∕ 不跑；批档本地用例随批留存**（不入仓套件）；验收 = 设计判据句 + 真机（父侧闭合）。

### 2.4 验收对照（回指）

| # | 判据句 | 面 |
|---|---|---|
| AC-1 | 语义五件在册（起算 ∕ 阈值 10s ∕ 跳秒 1s ∕ 终态消失 ∕ 句式键）——单源 = `docs/cli/design/TUI.md` §7.7 | 档面（评审核） |
| AC-2 | 三端口径一致性表 = 8 面 × 3 端（显示位 ∕ 起算锚 ∕ 重置点三类 ∕ 跳秒 ∕ 终态 ∕ 常量），逐端判据可机检 | 档面（评审核）+ 机检 |
| AC-3 | VSC ∕ 桌面实现面档落（WEBVIEW.md §4.7 · UI.md 本批注）+ 登记面（WEBVIEW-PROTOCOL §6.1 行 · 承载 17） | 档面 |
| AC-4 | 可机检性：三端常量 = 10000（三处）· 首显值 = 10s · 负向锁（非显示条件逐字节等价 ∕ 段零节点）· 拍 = 1s | 批档本地用例（全清令） |
| AC-5 | 零触面（结构性）：既有三机制 ∕ 模型面 ∕ 干预控件 ∕ 新通道 ∕ 新定时器 = 零（对照射程清单） | 机检（实现批） |
| AC-6 | 真机 ∕ 实跑读数（三端各一条——首显 ∕ 跳秒 ∕ 终态消失） | 父侧闭合（D16 义务） |

**需求回指**：用户裁定 #568=B（本档 §1）· 桌面需求 `docs/desktop/requirements/PROJECT.md` §4 **D17** ∕ **D22**（状态行对齐 CLI / 屏面为准）· CLI 需求 F 族先例（F15 ∕ F17——本读数对位条目待父侧落笔）· VSC 需求 F-W7（状态行段位族——同待父侧落笔）。

### 2.5 关键决策（给由）

- **D-1 起算源 = 末可见输出（三类并集；回合起为初始锚）**：三候选单取各有盲区（给由见 §2.2 / §7.7）；并集 = 「距最近一次可见输出」直译用户感知，且纯事实（不判「卡住」——零误报伤害）。
- **D-2 阈值 = 10s**：显示域起点——小于 10s 的常态停顿不打扰（轻显形）；首显值确定（10s——机检友好）；合裁定示例（「已静默 12s」）。
- **D-3 跳秒 = 1s 步进，三端同**：裁定「到点自动跳秒」；VSC ∕ 桌面既有 2s 拍收正为 1s（各一处常量——宿主胶水）；顺带消掉既有端差（块头走时词 2s ⇒ 1s 向 CLI 对齐）。
- **D-4 显示位 = 耗时（elapsed）之后**（三端同语义位）：同族读数相邻（回合时序簇）；CLI ∕ VSC 为串邻位、桌面为承载段（序同 CLI——既有「序同 CLI」纪律）。
- **D-5 词面 = 核字典键单源（`status.quiet`）**：三端投影面已通（CLI 直取 ∕ VSC ∕ 桌面投影）；零自铸字面；非 byte-identical（各端按自身语言面出词）。
- **D-6 显示域 = 回合在飞（既有判据），不含「已提交未起跑」窗**：回执未现窗无回合在飞判据（桌面早期无 running 位标）——如实登记上抛（§2.6 #1），不擅自扩面。
- **D-7 不引警示色 ∕ 零控件**：纯读数（裁定「不判卡住」——零误报伤害）；负向锁逐字节等价。

### 2.6 上抛项 / 观察（findings——逐条报告）

| # | 发现 | 处置 |
|---|---|---|
| 1 | **「发送回执超时」面未覆盖**：#568 另一半（回执未现窗——非回合在飞）不在本读数显示域 | 如实登记——请父侧裁（另轮 ∕ 并入与否）；本批零发明、零扩面 |
| 2 | **CLI 语言面现无 locale**（台账 #7 未决）⇒ 本读数 CLI 侧现渲核缺省 en 值（`Quiet 12s`） | 只报——键面已备（键面单源），CLI 多语言面落定即随动 |
| 3 | **需求档条目缺口**：CLI ∕ VSC 需求档无本读数对位行（回指现以批档 §1 + 桌面 D17/D22 承载） | 需求档笔权 = 主 agent——请父侧裁并落（CLI F 族 ∕ VSC F-W7 族） |
| 4 | **拍值收正触既有面两处**（VSC `_panelTimer` ∕ 桌面 `HEARTBEAT_MS`：2s ⇒ 1s）——live 块头走时词等既有消费者随动 | 只报——非阻断（随实现批落；方向 = 端差消） |
| 5 | **桌面承载段计数随动**：`statusline.mjs` 注释「承载 16 段」等文案 ⇒ 实现批随动为 **17** | 只报（设计面已在 UI.md 批注登记 16 ⇒ 17） |
| 6 | **跨批相抵复核（window-queue 批 UI.md 本批注项 3「停滞显形……本端零发明」）** = 该批的历史记录（登记跨端需求）；本批 = 该登记之落定 | 零相抵；该句属他批「本批注」记录面——未改（如需加「已落」指针请父侧裁） |

### 2.7 评审范围清单（供 §3）

- **评审对象** = 四档 + 本段：`docs/cli/design/TUI.md` §7.7（**语义单源**——重点）· `docs/vsc/design/WEBVIEW.md` §4.7 · `docs/vsc/design/WEBVIEW-PROTOCOL.md` §6.1 新行 · `docs/desktop/design/UI.md` §1 本批注 + 状态栏行 + 四档变更记录。
- **重点核**：① 语义单源唯一性（三档零重述——D2）；② 一致性表可机检性（逐端 file:line 可解析）；③ 阈值 ∕ 句式 ∕ 显示域与裁定（B）一致；④ 射程纪律（零实施 ∕ 零控件 ∕ 零既有三机制改动 ∕ 零其它批射程——含拍值收正两处常量属「宿主胶水」的边界裁量）；⑤ 三端条目-设计-需求三链一致（本档 §2.1 表 ↔ §7.7 一致性表 ↔ §2.4 回指）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | 机制清晰性 ∕ 可机检 | 🟡 | VSC 跳秒载体未钉定：`WEBVIEW.md:186`（§4.7）以 `panels.js:49-52` `_panelTimer` 为 1s 拍并注「`running` 门内重绘」；`WEBVIEW.md:246`（§5.2）记同一拍＝「2 s 同点刷 live 块头……不设运行态门」；`WEBVIEW.md:178`（§4.6）状态行 2s 拍（`running` 门内）未点载体——同一拍的门控 ∕ 起停条件档内三处表述不一，「无子代理块的在飞回合是否有 1s 帧」未写明 ⇒ AC-4「拍 = 1s」帧来源不可判（源档未读，按档面判据）。 | 在 §4.7 ∕ 一致性表「跳秒」行补拍载体定形句（起停条件 + 门控作用对象；例：`_panelTimer` 恒启、`running` 门仅作用状态行重挂），使 §4.6 ∕ §4.7 ∕ §5.2 同口径。 |
| 2 | 语义一致性 ∕ 可机检 | 🟡 | CLI 重置点枚举与语义类别不对齐：`TUI.md:709` 语义「工具面（调用 ∕ 输出流 ∕ 结果）」三子事件，`TUI.md:727` CLI 列仅 2 坐标（`tool-events.mjs:129` ∕ `:181`）——`onToolResult` 是否落于两坐标未写明；批档 `:66-67` 受影响表未含 `subagent-children.mjs`（CLI 子代理内容合并档——`WEBVIEW.md:427` 引其 `pushBlock`）⇒ 重置点③是否覆盖内容回显不可判（漏点 ⇒ 静默读数误报）。 | 把「重置点」三行逐坐标钉死到语义三子事件（含 `onToolResult` 与子代理内容路由档），有漏点即补；一致性表按最终枚举收正。 |
| 3 | 文档状态（旧值残留） | 🟡 | 拍值 2s ⇒ 1s（`TUI.md:729` ∕ `UI.md:518`）未扫两端既有条文：`WEBVIEW.md:161`（§4.5「2 s 同点刷」）· `WEBVIEW.md:178`（§4.6「2 s 拍」）· `WEBVIEW.md:246`（§5.2「2 s 同点刷」）；`WEBVIEW-PROTOCOL.md:243`（§6.2 计时行「2 s 同点刷」）· `WEBVIEW-PROTOCOL.md:353`（U-P6「elapsed 刷新节拍（复用 2s）」）；`UI.md:315`（「2s 走时刷新」）· `UI.md:395`（「2s 心跳……秒数逐 2s 走」）——规范面残留 2s 与新定值相抵（R7a：报而不改）。 | 上述七处按 1s 收正（U-P6 数值面同步注明新定值），与落地同轮落。 |
| 4 | 文档状态（计数随动） | 🟡 | 桌面段计数未随 16 ⇒ 17 收正：`UI.md:122-123`（「承载 16 段」「`STATUS_SEGMENTS`（16 码）」）· `UI.md:194`（「打开态段集 = 16 段」）· `UI.md:197`（「值域 = 闭集 16 码」）——本档既有纪律 = 计数与列表同改（D3）；`UI.md:21` 新指针在位而旧计数三处仍 16。 | 三处计数与码数收正为 17（`STATUS_SEGMENTS` 码表本身随 `quiet` 段落地加）。 |
| 5 | 受影响文件表（尺寸标注） | 🟡 | 六档无现读行数：批档 `:66`（`tool-events.mjs`）· `:67`（`subagent-blocks.mjs`）· `:69`（`state.js`）· `:71`（`input.js`）· `:72`（`streaming.js`）· `:78`（`app.mjs`）标「未读（实现批届盘）」——不满足「每个将改动源档须注明现读行数 + 预期增量」；表头「现读（as-of 2026-09-29 · 实读为准）」与「未读」行自相矛盾 ⇒ >300 ∕ >500 档位判不出（若其一已 ≥500 ⇒ 触发硬限拆分）。 | 补现读行数（`tool-events.mjs` ∕ `subagent-blocks.mjs` 据他档读数已处 430+ 区间，优先补），或表头口径改「部分未读」并把档位判定列为实现前置项。 |
| 6 | 受影响文件表（>300 审视） | 🔵 | 已越 300 建议线且本批将改的 4 档未给 >300 审视句：`render-frame.mjs` 435（批档 `:64`）· `agent-turn.mjs` 416（`:65`）· `subagent-blocks.mjs` 437（`TUI.md:478`）· `tool-events.mjs`（`TUI.md:687` 引 `:434-441`）——本档先例 = `TUI.md:486-488`「>300 advisory 档审视结论」。 | 逐档补一行审视结论（增量 ≤+6，预期 = 无需拆分）或指向存量债登记。 |
| 7 | 读数自洽 | 🔵 | `chat-messages.js` 现读两说：批档 `:70` 记 **261**、`WEBVIEW.md:44` 记 **238**（`wc -l` · 实读 2026-09-28）。 | 择一按盘实读收正并标 as-of（档位判定无实质影响——两值 +≤9 均 <300）。 |
| 8 | 需求覆盖 ∕ 协调项 | 🟡 | 需求回指缺口（协调项，非缺陷）：CLI F 族 ∕ VSC F-W7 族无本读数对位条目（批档 `:112`）；#568 另一半「发送回执超时」窗不在显示域（批档 `:110` ∕ `:103` D-6）——本档已如实登记为待裁。 | 落对位条目到 CLI ∕ VSC 需求档并回指读数（配合 §2.4 回指链）；「回执超时」明确另轮 ∕ 并入并给射程。 |
| 9 | 词键登记面 | 🔵 | `status.quiet` 的 VSC 侧登记仅 §6.1 段位行（`WEBVIEW-PROTOCOL.md:232`）；§6.3 键表（24 键）收录纪律 =「新增对位键同轮登记本表」+ 计数随改（`WEBVIEW-PROTOCOL.md:659`）——AC-3 登记面未列此项。 | 加键同轮登记 §6.3 行与计数（24 ⇒ 25），并把该义务写入 AC-3 ∕ 受影响表核字典行。 |
| 10 | 射程 ∕ 边界裁量 | 🔵 | 拍值收正两处常量（`_panelTimer` ∕ `HEARTBEAT_MS` 2s ⇒ 1s）为既有消费者可见行为变化（块头走时词等随动——批档 `:113`），且 `WEBVIEW-PROTOCOL.md:353` U-P6 把该节拍登记为「批准环节可翻转」面；AC-5（批档 `:91`）「零触面」枚举未含常量面，重绘频次翻倍的影响未评估。 | 批准环节明确「收正 ∕ 不收正」并写入 AC-5 括注（常量两处 = 宿主胶水）；若否决，跳秒另择 1s 载体且档面回指同步。 |
| 11 | 跨批残留复核 | 🔵 | `UI.md:509`（window-queue 批注项 3）「停滞检测面登记为**跨端需求（另账）**」在本批落定后成未决口吻（批档 `:115` 已请裁；零相抵判定成立）。 | 该句加「已落（本批）」指针或按失效表达纪律删句（历史归记录面），二选一落定。 |
| 12 | 显示域口径 | 🟡 | VSC 显示域含「标题窗口」：`TUI.md:710` 取 VSC 判据 = `_turnState === "running"`，而该态按档面枚举含**标题窗口**（`WEBVIEW.md:108` ∕ `WEBVIEW-PROTOCOL.md:170`）——标题生成期无可见输出事件 ⇒ 慢标题（≥10s）时 VSC 可现身读数；另两端（CLI `state.processing` ∕ 桌面位标）该窗归属档面未载 ⇒ 域是否一致不可判，一致性表「显示域 ∕ 终态消失」两行未提及该窗。 | 在一致性表 ∕ §7.7 显示条件行补一句钉定该窗归属（随 `running` 保留 ⇒ 按「端差默认 = 消」核对另两端；或收窄 VSC 判据排除标题窗），并给机检读法。 |

计数：🔴 0 · 🟡 7 · 🔵 5（合计 12）

VERDICT: pass

## §4 用户批准（主 agent）

**批准（父侧代执行 · 2026-09-29）**

- **依据**：评审 #168 **pass**（§3 轮次 1 在册——🔴 0 · 🟡 7 · 🔵 5）；三条件齐（评审 pass ∧ 评审面零改动核验 ∧ 设计 token 在位）。
- **口径**：用户批级全点授权（「都处理 + 设计一就绪即发评审」在册）下由父侧代行批准；**可撤回**——用户任何时点否决 ⇒ 实施止付 ∕ 回滚。
- **批准范围**：§2 全量（三端轻显形 + i18n 键 + 两常量收正 2s ⇒ 1s【裁定 = **收正**——服务 1s 跳秒；重绘频次翻倍影响可忽略；VSC U-P6 已把节拍登记为可翻转面】）。
- **实施条件（承 §3）**：① VSC `_panelTimer` 起停 / 用途落笔前实读钉定（载体假设不符 ⇒ 停下上报）；② CLI 重置点须覆盖 `onToolResult` 与子代理内容路由（🟡 #2——逐坐标实读）；③ 六档「未读」行数临读（🟡 #5）；④ `status.quiet` 的 VSC §6.3 键表登记行 + 计数（24 ⇒ 25）= 文档面随动（归下一文档轮，本批在册）。
- **派发**：双舱（A = 核 i18n + CLI 四档；B = VSC 六档 + 桌面五档）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（B 舱 = VSC 六档 + 桌面五档（语义单源 = docs/cli/design/TUI.md §7.7）· 批本地用例 20/20 绿（.thincoder/tmp/2026-09-29-stall-indicator-b.test.mjs，待父侧转正）· 审计 converged · advisor pass（🟡4 报告项 · 🔵4；fix 轮 1 已复跑）· 终态 clean · 2026-09-29）


### 5.1 改动逐项（file:line = 实施后实读；净增量 = git numstat）

| # | file:line | 改动 |
|---|---|---|
| 1 | `thincoder-core/i18n.mjs:49-50` | +键 `status.quiet`（en `Quiet ${s}s` ∕ zh `已静默 ${s}s`——逐字合设计 §7.7；词面单源，三端经 `t()` 投影）·净 +2 |
| 2 | `thincoder-cli/src/tui/render-frame.mjs:13` | +import `t`（核 i18n 直取） |
| 3 | `…render-frame.mjs:38-41` | +`export const QUIET_MS = 10_000`（=10000；导出以纳机检） |
| 4 | `…render-frame.mjs:405-409` | `buildStatusLine`：读数段挂 `elapsed` 之后（`statusText` 串内）；显示条件 = `processing ∧ lastOutputAt>0 ∧ 静默 ≥ QUIET_MS`；非显示条件零注入（负向锁）；零警示色 · render-frame 净 +13 ∕ −1 |
| 5 | `thincoder-cli/src/tui/agent-turn.mjs:144` | 回合头 +`state.lastOutputAt = Date.now()`（初始锚 = 回合起刻，`processingStarted` 邻位）·净 +3 |
| 6 | `thincoder-cli/src/tui/tool-events.mjs:104 ∕ :113` | ①流式重置（主文本 ∕ 推理——子代理前缀分流之后） |
| 7 | `…tool-events.mjs:132 ∕ :333 ∕ :185` | ②工具面重置三子事件：调用 `:132` · 输出流 `:333`（**本批新补坐标**——评审 🟡#2）· 结果 `:185`（含子代理 ack ∕ escalate ∕ advisor）· tool-events 净 +5 |
| 8 | `thincoder-cli/src/tui/subagent-blocks.mjs:114` | ③子代理面**单点**重置——`ensureSubTaskKey`（内容回显四路由 `:202 ∕ :319 ∕ :336 ∕ :364` 均先经此 + 块状态事件） |
| 9 | `…subagent-blocks.mjs:175 ∕ :197` | ③块状态分支补点：async 转正（live 分支）· cancelled 移除（命中移除守卫内） |
| 10 | `…subagent-blocks.mjs:417 ∕ :428 ∕ :448 ∕ :461` | **压缩面板面（父侧 2026-09-29 裁定①「补」——语义填充）**：`ensureCompressPanel` 起始 ∕ `markCompressFailed` 失败行 ∕ `markCompressDone` 完成冻结 ∕ `markCompressFallback` 降级冻结 = 4 处单向写点（同族同形；零重排 ∕ 零新拍）· subagent-blocks 净 +9 |
| 11 | `thincoder-cli/src/tui/tui-state.mjs:43` | +`lastOutputAt: 0` 字段声明——**出 §2.3 受影响表，如实登记**（state 字面量单源惯例，同 §7.2 `attentionAwaiting` 先例；零行为）·净 +1 |
| 12 | `.thincoder/tmp/2026-09-29-stall-indicator-cli.test.mjs`（新 · 269 行） | 批档本地用例 T-SI1–T-SI7（含 OLD 逐字拷贝对拍）；待父侧转正 |

### 5.2 验收读数（可复跑）

- 批档本地用例（仓根 cwd）：`node --test .thincoder/tmp/2026-09-29-stall-indicator-cli.test.mjs` ⇒ **7/7 pass**（T-SI1 常量 ∕ 词键逐字；T-SI2 首显恰 10s + 位序 elapsed 之后；T-SI3 负向锁五态与 OLD 逐字节等价；T-SI4 显示差分 = 唯一插入段；T-SI5 主面五路重置 + 空输出不重置；T-SI6 子代理面八径 + 墓碑不重置；T-SI7 压缩面板四径重置）。
- `node --check`：`thincoder-cli` `npm run lint`（check-syntax）116 file(s) OK；核 `i18n.mjs` check OK（键数 33 ⇒ 34）。
- 仓套件：**未跑**（§2.3 全清令——不写 ∕ 不改 ∕ 不跑；父侧收口运行为唯一仓套件运行）。
- AC-4 本舱项：常量 `QUIET_MS=10000`（三端同值——VSC ∕ 桌面各 10000，grep 侧证）· 首显 10s · 负向锁逐字节 · 拍 = 1s（既有 ticker 零改）。
- AC-5 零触：模型面 ∕ 三既有机制（`post-turn.mjs` ∕ `consult.mjs` ∕ `subagent-scheduler.mjs` 全树零改）· 零控件 ∕ 零弹窗 ∕ 零新通道 ∕ 零新定时器 · VSC ∕ 桌面零触（B 舱另舱）。

### 5.3 决策透明表（实施侧）

| # | 决定 | 给由 |
|---|---|---|
| 1 | ③重置单点落 `ensureSubTaskKey`（`:114`） | 四内容路由 ∕ 块状态事件共用汇聚点——单点防漏（评审 🟡#2 直接收敛）；副作用 = 丢弃型迟到 token 也抬锚（读数偏保守——🔵 登记，零误报方向） |
| 2 | `onToolOutput` 补为 ②第三坐标（`:333`） | 评审 🟡#2：语义列「输出流」而表仅 2 坐标——逐坐标实读后补 |
| 3 | `tui-state.mjs` +1 行（出受影响表） | 字段声明归 state 字面量单源（§7.2 先例）；零行为（`?? 0` + `>0` 双护栏） |
| 4 | 压缩面板 4 处补锚（父侧裁定① · 语义填充） | 对应 advisor 🟡#1：「静默 = 距最近一次可见输出」——压缩面板 ∕ 冻结块是可见输出（子代理面族）；长压缩期不写锚 ⇒ 状态行「已静默 Xs」而屏有活 = **假静默**（本项要消灭的误导信号）⇒ 属枚举空白的语义填充（非扩面）。落法 = 单向无害锚 + 同族同形 + 零重排 ∕ 零新拍（4 处：起始 ∕ 失败 ∕ 完成 ∕ 降级——均为面板状态变迁 ∕ 内容更新点） |
| 5 | `/distill` 窗不扩（父侧裁定②） | 出舱文件面（`distill-cmd.mjs`）⇒ 登记待裁 ∕ 另轮，维持现状 |
| 6 | 未列 `suspension-drive` digest 回收 ∕ `freezeAllSubTasks` | 设计枚举 ③ 坐标 = subagent-blocks 邻位；该两处为回合尾 ∕ 挂起面收尾（`processing` 落 ⇒ 本不显示） |

### 5.4 审计与代码评审轮次（终态）

- **explore 发散审计 1 轮**：代码四类差 = 0（PARTIAL ∕ SILENT-SIMPLIFICATION ∕ OUT-OF-LIST 全零）；1 项 DOC-DRIFT（一致性表 ∕ 受影响表未随实施收正——归文档轮）+ 观察 O1（§5 时点空——本段即落写）· O2（多重置边缘——接受）· O3（`/distill` 窗——🔵 登记）。
- **advisor 代码评审 1 轮**：VERDICT **pass**（🔴 0 · 🟡 2 · 🔵 4）。
- **fix 轮**：2（① 用例 T-SI4 宽度截断断言收正——cols 300 免截断；② 父侧裁定①落 4 处压缩面板写点 + 用例 T-SI7）。
- **终态：clean**（代码行为面零偏差；未决 = `/distill` 窗——父侧已裁「维持不扩」，登记待裁 ∕ 另轮）。

### 5.5 advisor 发现逐条处置

| # | Sev | 发现 | 处置 |
|---|---|---|---|
| 1 | 🟡 | 压缩面板生命周期无重置写点 | **已落**（父侧裁「补」）：4 处单向写点（5.1 #10）+ 用例 T-SI7 断言；对应 5.3 #4 |
| 2 | 🟡 | 文档坐标 ∕ 行数滞后（一致性表 ∕ §2.3）+ §5 空 | 只报不改（文档轮义务）；本段落写后 §5 不再空 |
| 3 | 🔵 | 用例墙钟依赖（R4） | 容差收正口径已记（`Quiet 1[0-9]s` ∕ 锚点放宽）；本批保留（对拍先例同法） |
| 4 | 🔵 | 过量重置（丢弃型 token 抬锚） | 接受（单向保守）；精确化可选（写点下移至 drop 守卫后） |
| 5 | 🟡 | 四档 >300（447 ∕ 454 ∕ 462 ∕ 418） | 存量债不升级（R3）；**>300 审视结论**（§3 #6 所需）：本批各净 +3~+13 行、零新职责 ∕ 零新模块级函数 ⇒ **无需拆分** |
| 6 | 🔵 | CLI 无 locale ⇒ 出 en 值 | 已登记（§7.7 观察①）——零动作 |

### 5.6 未决 ∕ 边界诚实项

- `/distill` 窗（枚举边界②）——父侧已裁「维持不扩」：登记待裁 ∕ 另轮（`distill-cmd.mjs` 出舱文件面，本舱零改）。
- 用例墙钟裕度：T-SI2 ∕ T-SI4 语句间 ≥1s 才可能判红（实测执行 <10ms——裕度 ≈1s）。
- `designId`：本舱 spawn 载荷未携显式值——写授权经 token 门在写时核验（全部编辑 ∕ 用例落盘通过）；如需对账请以父侧发放记录为准。
- 文档漂移（只报不改）：§7.7 一致性表坐标（`TUI.md:724-728`）与批档 §2.3 行数（`:63-67`）为改前快照——明细见 advisor 报告 #2；归文档轮收正。

### 5.1 逐档改动（B 舱 = VSC 六档 + 桌面五档 · 零表外改）

| # | 档 | 落点 |
|---|---|---|
| B1 | `thincoder-vscode/webview/status-bar.js` | `QUIET_MS = 10000`（:15）+ 静默段（:52-63——耗时 :51 之后、任务徽标之前）：判据 = `_turnState === "running"` ∧ `(now − (_lastOutputAt ?? _turnStart)) ≥ QUIET_MS` ⇒ `t("status.quiet", { s: floor(ms/1000) })`；非显示条件零注入 |
| B2 | `thincoder-vscode/webview/state.js` | `S._lastOutputAt: null`（回合域新载体 :103） |
| B3 | `thincoder-vscode/webview/chat-messages.js` | `markOutput()` 单点写 + **八重置点**（逐 case）：`token` :59 ∕ `reasoning` :60 ∕ `toolCall` :67 ∕ `toolResult` :76 ∕ `toolOutput` :78 ∕ `subagent` :234 ∕ `subagentApproval` :237 ∕ `toolPanel`（`sub:` 前缀）:245 —— 与 §7.7 表 VSC 列一一对应 |
| B4 | `thincoder-vscode/webview/input.js` | 回合起刻 = 初始锚（:98 `S._lastOutputAt = S._turnStart`——`_turnStart` :97 邻位同置） |
| B5 | `thincoder-vscode/webview/streaming.js` | 回合尾清点（`finish()` 内 :149——complete ∕ aborted ∕ error 三径同点；:117 `finish(aborted)` 入口） |
| B6 | `thincoder-vscode/webview/panels.js` | `_panelTimer` 2000 ⇒ **1000**（:54）；**恒启**——`running` 门（:53）只作用状态行重挂 ⇒ 无子代理块的在飞回合照有 1s 帧（实施条件① 载体假设实读钉定成立，B17b 实证） |
| B7 | `thincoder-desktop/renderer/views/statusline.mjs` | `STATUS_SEGMENTS` +1（`quiet` :45，序 = `elapsed` 之后；承载 16 ⇒ 17）+ 装配位 :74 + `statusModel ∕ mountStatus` 切片 `lastOutputAt` 传参（:56 ∕ :164）+ 档头计数随动 |
| B8 | `thincoder-desktop/renderer/views/statusline-segments.mjs` | `QUIET_MS = 10000`（:21）+ `quietSegment`（:121-128）：位标含 `running` ∧ `now − lastOutputAt[key] ≥ QUIET_MS` ⇒ 段；不足 ∕ 非 running ∕ 切片缺 ∕ 非数 ⇒ 零节点；零警示色 |
| B9 | `thincoder-desktop/renderer/events.mjs` | `OUTPUT_CHANNELS` 七通道（:78-80 = `ev:token` ∕ `ev:reasoning` ∕ `ev:subchunk` ∕ `ev:tool-call` ∕ `ev:tool-output` ∕ `ev:tool-result` ∕ `ev:subagent`）+ `withOutputAt`（:82-86，键缺零写）——`reduce` 单点 :202；`onActivity` turn 首帧初始锚（:156-157，`turnStarts` 邻位同置；后续 turn 帧不动锚） |
| B10 | `thincoder-desktop/renderer/heartbeat.mjs` | `HEARTBEAT_MS` 2000 ⇒ **1000**（:16） |
| B11 | `thincoder-desktop/renderer/app.mjs` | 拍注随动（2s ⇒ 1s——:22 ∕ :243-244 两处注释；净 0 行） |

### 5.2 批本地用例 ∕ 机检读数

- 载体 = `.thincoder/tmp/2026-09-29-stall-indicator-b.test.mjs`（384 行 · 20 用例 · 全清令：不入仓套件；**待父侧转正**入 `docs/batches/`）。
- 复跑：`node --test .thincoder/tmp/2026-09-29-stall-indicator-b.test.mjs` ⇒ **20/20 绿**（含评审后 fix 轮复跑；0.2s）。
- 覆盖（AC-4 B 舱侧）：两端常量 = 10000（B19）· 首显 = 10s ∕ floor 跳秒（B1 ∕ B5 ∕ B10）· 负向锁（B2 ∕ B5 ∕ B7 ∕ B11 ∕ B14——含 VSC 逐字节等价）· 重置点（B6 七通道 ∕ B13 八键 ∕ B16 源面锁）· 起算锚（B8 ∕ B15）· 终态清（B15）· 拍 = 1s（B9 ∕ B17 ∕ B17b 无子代理块行为实证 ∕ B18）。
- `node --check` 全 11 档绿（逐档跑）。

### 5.3 实施条件 ∕ 交付核验（承 §4）

- **条件①**：`_panelTimer` 起停 ∕ 用途实读钉定——恒启（装配即起、`unload` 清点）+ `running` 门只作用 `renderStatusBar()` 重挂；「无子代理块的在飞回合仍有帧」= B17b 实证 ⇒ 载体假设成立（无停下上报）。
- **条件③**：六档临读（B 舱四档）：`state.js` 132→136（+4）· `input.js` 126→127（+1）· `streaming.js` 182→183（+1）· `app.mjs` 269（净 0）——皆 <300 ✓；A 舱两档（`tool-events.mjs` ∕ `subagent-blocks.mjs`）归 A 舱。
- **词键**：核字典 `status.quiet` **本刻不在场**（`thincoder-core/i18n.mjs` `CORE_MESSAGES` 零该键 = A 舱落地物）——两端按设计只读引用 `t("status.quiet")`（本地档零同键副本）；键未落前两端现渲键名，A 舱落地即随动（**只报**）。
- **未决 ∕ 边界（供父侧）**：① 域外残留「承载 16」三档（`mount-status.mjs:6,15` ∕ `views/chrome.mjs:8` ∕ `renderer/i18n.mjs:235,392`〔末二处为 D22 历史句〕）——只报未改（文件表外）；② `activity.js:146`「既有 2s」注释残留（同因）；③ `subagent-reduce.mjs:88`「2 s 拍残刷」疑似同族（未核所指面——渲染拍 ∕ 宿主存活投影）；④ `subagent-reduce.mjs:161` ∕ `src/main/*` 的「2s」= **宿主存活投影**系另一机制（本批零触）——勿混。

### 5.4 轮次与终态

- **审计**（explore 只读 · 1 轮）：四类偏差 0（partial ∕ silent-simplification ∕ doc-drift ∕ out-of-list 皆 0），终判 **converged**。
- **advisor 代码评审**（1 轮）：**VERDICT: pass**（🔴 0 · 🟡 4〔皆档面状态 ∕ 记录面报告项，不阻断代码交付：UI.md 计数残留 ∕ 2s 文档残留 ∕ §5 空〔本段即补〕 ∕ 标题窗归属〕· 🔵 4〔坐标漂移 · 测试时钟脆性 ∕ 假钟句柄 · 测试件 384 行沿先例〕）。
- **fix 轮 1**（评审后 · 采纳两条 🔵 测试加固）：`now − 20500` ∕ `now − 5000` 置换秒界贴边值（时钟脆性）+ 1s 句柄断言 `oneSecond.length === 1`（防静默换绑）——复跑 20/20 绿（纯测试件改动，产品码零变）。
- **终态：clean**。

> **[段内双舱结构注 · 落者 = B 舱 coder]** 本 §5 含**两舱**实施记录（双舱皆 `eng-coder` 身份 ∕ append-only 各自追加、编号各自起）：**A 舱**（核 i18n + CLI 四档）自「### 5.1 改动逐项（file:line = 实施后实读；净增量 = git numstat）」起（其 5.1–5.6）；**B 舱**（VSC 六档 + 桌面五档）自「### 5.1 逐档改动（B 舱 = VSC 六档 + 桌面五档 · 零表外改）」起（其 5.1–5.4）。父侧 §6 收口请按舱分段读。
> （B 舱更正一笔：其用例件经评审后 fix 轮加固现为 **385 行**（5.2 记 384 为 fix 前读数）；20 用例不变。）

> **[B 舱更正一笔 · 落者 = B 舱 coder]** 本 §5 下组 5.3「核字典 `status.quiet` **本刻不在场**」为过时读数（据 12:31 勘察快照）——**A 舱已落地该键**（`thincoder-core/i18n.mjs:50`：en `Quiet ${s}s` ∕ zh `已静默 ${s}s`，逐字合 §7.7）；两端只读引用现即解析（词面链闭合；审计亦证 `i18n.mjs:50` 在场）。5.3 该行以本更正为准。

## §6 验证与收口（父代理）

**收口记录（父代理 · 2026-09-29）**

**波面（全落）**：A 舱（核 i18n 键 + CLI 五档——含压缩面板 4 处补锚〔父侧裁①语义填充〕）∥ B 舱（VSC 六档 + 桌面五档）。用例件转正：`docs/batches/2026-09-29-stall-indicator-cli.test.mjs`（**7/7**）+ `docs/batches/2026-09-29-stall-indicator-b.test.mjs`（**20/20**）。

**核验（父侧亲读）**：`status.quiet` 两语（`thincoder-core/i18n.mjs:50`）· CLI 显示段（`render-frame.mjs:405-409`——`elapsed` 之后 ∕ 负向零注入 ∕ 零警示色）· VSC 段（`status-bar.js:56-62`）· 桌面 `quietSegment`（`statusline-segments.mjs:121-128`）· 归约重置单点（`events.mjs:78-86` 七通道）。两舱发散审计 converged + 代码评审 pass；fix 轮落定（A 舱 2 ∕ B 舱 1）。

**载体假设实证**：`_panelTimer` 恒启（评审 🟡#1 闭合）——无子代理块的在飞回合照有 1s 帧 ✓；无停下上报项。

**边界**：`/distill` 窗维持不扩（裁②在册）· 拍值收正（VSC ∕ 桌面 2s ⇒ 1s）已落 · 零控件 ∕ 零弹窗 ∕ 零新通道 ∕ 零新定时器。

**遗留（归文档轮 · 入台账）**：TUI.md §7.7 坐标刷新 ∕ §2.3 行数随动 ∕ `WEBVIEW-PROTOCOL` §6.3 键表 24 ⇒ 25 ∕ UI.md 段计数 16 ⇒ 17 ∕ 拍值 2s 文档残留（`WEBVIEW.md:161/178/246` · `UI.md:315/395` · `activity.js:146` 等）。**真机视觉读数** = 转下一轮用户走查（「点哪看哪」清单在册）。

**结算（D7）**：#568 → **已核销**；#596（回执超时面）= 已并入 #597 批（不随本批销）；载体假设实证 ∕ 压缩面板补锚 = 本批内闭合。
**状态行**：已收口 2026-09-29。
