# Webview 输入面与消息渲染契约（WEBVIEW-INPUT）· 设计 — VSC 部分

> 部分 = **vsc**（`docs/vsc/`）；板块 = **webview 前端面**的**输入与渲染面**——用户输入进入（键盘语义 / 输入历史 / 首块说明）与助手输出渲染（markdown 内联契约）两个端点面。
> 同板块同层另两档 = `WEBVIEW.md`（结构与活动区）· `WEBVIEW-PROTOCOL.md`（消息协议 · 秩序 · 忙态 · 状态行）。**同一机制只详述一处**（D2）。
> 需求侧 = `requirements/WEBVIEW.md`（F-W1–F-W7 / N-W1–N-W6）；逐条回指见 §9。
> 来源 = `thincoder-vscode/docs/design/WEBVIEW.md`（VSC 产品树）——**原地一字未改，留作参照历史**（保留 ≠ 维护）。对应源节 = §9 · §10 · §11。
> 建档：2026-09-15（**B 式迁移轮 · VSC 第 2 批**）。坐标 = as-of 2026-09-15 实核（仓根相对路径 + `:行`）。

## 1. 输入面 Enter 语义

**契约（逐条）**：

| # | 契约点 | 规则 | 落点 |
|---|---|---|---|
| C-B2-1 | 组合期 Enter 归输入法 | `e.isComposing` → 直接返回——**不 preventDefault**（键归输入法）、不发送 / 不注入 / 不接受建议。三处 Enter 分支同规；**无模块状态**（只读事件字段——组合结束后语义即时恢复，不粘滞） | `thincoder-vscode/webview/input.js:42`（中断模态）· `:77`（常规发送）· `thincoder-vscode/webview/autocomplete.js:99`（接受建议） |
| C-B2-2 | @ 下拉与 send 的 Enter 协调 | 下拉打开时 Enter **只由 autocomplete 接受建议**（插入引用 + 关闭下拉），`input.js` 不发送——让位 = 提前 `return` 且**保留 preventDefault**（防 Enter 默认换行落入输入框）；下拉关闭时 Enter 照常 `send()`（正控）。**注册次序前提**：`input.js` 的 keydown 先于 `autocomplete.js` 注册 | `input.js:79-84` · `chat.js:35`（import）先于 `chat.js:48`（`initAutocomplete`） |
| C-B2-3 | 打开态判据硬化 | `isAtDropdownOpen()` = `!!el && el.style.display !== "none"`（**元素缺失 ≠ 打开**） | `input.js:135-138` |
| C-B2-5 | 无工作区拒发可见提示（2026-09-21 批） | `send()` 出口判 `S._workspaceRequired`（host `workspaceGuard` 消息置位）→ 拒发 + `showToast(t("workspace.required"))`（**先于** `addUser` / `setLoading`——无假气泡）；占位符第三态 = `t("workspace.requiredPlaceholder")`（守卫 > busy > 常态） | `thincoder-vscode/webview/send.js`（守卫出口）· `webview/loading.js` `applyBusyLock` · `webview/chat.js` `case "workspaceGuard"` · `locales/{en,zh}.json` +2 键；判据 / 守卫面 = `docs/vsc/design/PROJECT-SWITCHER.md` §4.1 |
| C-B2-6 | busy 排队注入（对称修 · busy-injection 批 2026-09-21 · busy-extend 批 2026-09-22 扩面） | busy 提交**一律排队**：判据 = `S._turnState === "running"`（`_suspended` 不再分流——挂起会话内与普通回合同判据）⇒ `addUser` 本地气泡 + `queuedUserMessage` postMessage（不 `setLoading` 不清面板）→ host 单槽（**单槽空时**——槽满 = 不提交，见细则①）。单槽载体两态：无会话 ⇒ `panel._busyQueued`；会话在飞（`panel._susp`）⇒ 会话单槽 `susp.pendingInput`（既有 `_chat` 分流——driver 步骤 1 优先消费）。**零改面**：纯挂起等待（`susp`）既有单槽零改；空输入 = 既有静默（`send()` 出口——`thincoder-vscode/webview/send.js:18`）；无工作区守卫（C-B2-5）零改。细则 · 送达 · 落点见下方列表；CLI 对位 = `docs/cli/design/TUI-INPUT-BOX.md` §4.1 |

- **C-B2-6 细则**：
  - ① 二次提交（单槽满）= 拒绝 + 提示 + 文本保留——host 侧：`routeUserTurn` busy 分支槽满 ⇒ 拒收 + 提示（`showWarningMessage`——外部入口兜底）；槽内既有消息不被覆盖。
    **webview 守卫**（判据 / 状态清除时机 / 提示形三面）：
    · 判据 = `S._turnState === "running" && S._busyQueuedPending` ⇒ 提交**不出泡 / 不清框** + toast（对位 CLI 槽满面 `thincoder-cli/src/tui/key-handler.mjs:306-309`）；
    · 判据源 = host 推送 `busyQueued { pending }`（权威 = **单槽实况**——两载体合计占用：`_busyQueued` ∪ `susp.pendingInput`；外部入口 Ask ThinCoder / retry 同面入槽，webview 不自持真值）；镜像 `S._busyQueuedPending` 于提交受理时本地先行置位，host 推送权威收敛；
    · 状态清除时机 = **消费即清**——三支消费点（driver 步骤 1 / 装载① 预填 splice / 装载② 归位 shift）后 host 推 `pending:false`；忙分支每次判决后 host 推实际占用；`webviewReady` 握手重推（Reload 冷启重同步——对位 C-B2-5 握手先例）；
    · 提示形 = toast（既有机制）+ 键 `input.slotFull`（zh/en 逐字 = `WEBVIEW-PROTOCOL.md` §6.3）；占位符零改。
  - ② **送达 = 三支（均既有通道）**——① **会话在飞入槽**：driver 步骤 1 输入优先消费（`thincoder-vscode/src/extension/suspension.mjs:285-300`——先于 digest 合并）开用户回合；
    ② **池 live 进会话（回合尾）**：`enterSuspensionTurn` 将 `panel._busyQueued` 残项预填 `susp.pendingInput`（同一 driver 消费点）；③ **池空 idle 归位分支**：`_busyQueued` 非空 ⇒ 直接以该消息续发回合（后清槽）。
    会话退出兜底 = `suspension.mjs` finally 残余直注入（零丢失）。送达侧气泡生命周期 = **与纯挂起既有 queued 路径同款**——送达时本地气泡即视为该消息 user 回声面，回合流式渲染不重复出气泡。
  - ③ 外部入口（Ask ThinCoder 命令 / retry）经 `routeUserTurn` busy 分支同面分流（同判据同槽）——会话在飞同入会话单槽；`chat-panel.mjs` `sendMessage` 的挂起会内 busy 拒收守卫随本批撤销（外部入口同面受理；用户气泡回显保留在 `sendMessage`）。
  - ④ **busy 面统一（digest 例外撤销）**：挂起会话内 digest 与普通回合 busy 同判据（`S._suspended` 只作会话在场指示，不参与受理分流）——CLI 侧同笔（`TUI-INPUT-BOX.md` §4.1 判据表挂起条撤销）。
  - ⑤ 落点 = `webview/send.js`（出口分流——**busy 拒发分支删**：`running` 一律排队；槽满守卫在队列分支内）· `webview/state.js`（`_busyQueuedPending` 镜像字段）· `webview/chat.js`（`case "busyQueued"`）
    · `panel-messages.mjs` `routeUserTurn`（分流 + 入槽守卫 + `pushBusyQueued` 推送 / 握手重推——`pending` 判据两载体合计）· `panel-turn-stages.mjs` `enterSuspensionTurn`（装载两分支 + 贴图降级接点）
    · `chat-panel.mjs`（`_busyQueued` 初始化 + `_chat` susp 分支入槽 / 来源标记参 + `sendMessage` 守卫撤销）· `image-handler.mjs`（F-1 降级判决函数）；协议登记 = `WEBVIEW-PROTOCOL.md` §3.2 行 16 / 行 17 + §12 行 + §6.3 键 `input.slotFull`；需求锚 = CLI 需求档 F16 对称句。
  - ⑥ **送达路由贴图降级对位**（与 idle 面同一判定——非直呼 `runChat` 旁路）：入槽项**两面同款携来源标记**（普通回合 busy 与会话在飞 busy）⇒ 送达时同过 F-1 判定——`images` 路径非空 ∧ `modelOverride` 在场 ∧ `specForModel(modelOverride).multimodal` 假 ⇒ 视觉渠道一次性子代理读图（成功 = 描述注入 text + images 清空；无渠道 / spawn 失败 / 超时 / 空返 ⇒ 原样兜底，不静默丢）。
    判决函数 = `image-handler.mjs` `downgradeNonVisionImages`（`visionReader` per-call 注入缝——缺省回落生产，形态同 idle 先例）。
    三调用点 = idle 面（原样——含 `_turnState !== "susp"` 门）/ 装载②（`panel-turn-stages.mjs:206-210` `deliverBusyQueued`——**先置 running 再 await**，同 F-1 idle 面忙锁不变量）
    / 装载① 与会话在飞（`panel-turn-stages.mjs:173-175` `runTurn` 闭包——入槽项带来源标记，仅该支降级；纯挂起既有路径零改）。
    A12/Stop 语义随迁（`panel._visionAbort` 定向中止；`_abortRequested` 置位序 = 呼叫 `runChat` 之后）；装载① 窗内 `_turnState` = susp（无 Stop 面——受读图 60s 超时约束）。

- **Shift+Enter** 既有形态零动（`input.js` 分支不处理——换行）。
- **零改面**：`_turnState` 生命周期 / 单广播 / 派生、录入面（录入不禁；提交面受理分流 = C-B2-6）、中断模态、下拉过滤 / 防抖 / seq、CSS、`index.html`。（`applyBusyLock` 占位符含**第三态**——守卫 > busy > 常态，见 C-B2-5。）
- **登记（未做）**：真机 IME 矩阵（mac / Safari 组合确认 Enter 的 `isComposing` 时序差异）未覆盖——`keyCode === 229` 兜底**不引入**（登记项）。

### 1.1 其他键位（同族既有语义）

| 键 | 语义 | 落点 |
|---|---|---|
| Ctrl+C（无选区） | running 中 → Stop（有选区仍走复制） | `input.js:54-61` |
| Ctrl+I | running 中 → 进入中断模态（Enter 提交 partial + 续跑同回合） | `input.js:63-67` |
| Ctrl+U | 清空输入行 | `input.js:69-74` |
| Enter（中断模态内） | 注入中断消息 | `input.js:40-46` |

## 2. 输入历史与多行竖移（↑/↓ 判定五态）

**判定顺序**（`thincoder-vscode/webview/input.js:92-110`；无 Shift / Alt / Ctrl / Meta）：

| # | 态 | 规则 |
|---|---|---|
| ① | IME 组合期（`e.isComposing \|\| e.keyCode === 229`） | 不处理、不 preventDefault（键归输入法） |
| ② | `isAtDropdownOpen()` | 不处理（下拉导航让位——不回归） |
| ③ | 历史态（`ctx._historyIdx !== -1`） | **恒历史**：↑ → 上溯、↓ → 回落——不看光标位置与单复数行 |
| ④ | 非历史态 · 单行（`!value.includes("\n")`） | ↑ → 载入最新条目（草稿 stash）；↓ → **吞键 + no-op**（非历史态无可回落） |
| ⑤ | 非历史态 · 多行 | **边界门**：↑ 仅 `selectionStart === 0`（首行行首）、↓ 仅 `selectionStart === value.length`（末行行末）触发；其余位置不处理、不 preventDefault（浏览器原生竖移保留） |

- **载入后光标/高度**：`navigateInputHistory`（`input.js:141-159`）——载入后游标 = 条目末（`setSelectionRange(len, len)`）+ 高度重算；草稿保护 / 历史指针语义零改。
- **状态模型**：`ctx._inputHistory` / `_historyIdx` / `_inputDraft` 零改；不引入列记忆状态；不跨出输入框（不滚动会话）。
- **登记（未做）**：折行（软换行）单行文本的视觉竖移不保（「单行」判定 = 逻辑行 `\n` 判定——textarea 无可靠折行 API）；历史态编辑丢弃（覆盖式草稿）为两端同族既有行为。

## 3. 首块说明行（新用户可理解）

| # | 契约点 | 规则 |
|---|---|---|
| C-MA13-1 | 首块说明行 | 每 webview 会话**首个**新建活动块插入说明行 `div.sub-desc`——位置 = `summary` 之后、`.advisor-content` 之前（details 直接子；`refreshBlock` 只重建 summary ⇒ 说明行不被擦） |
| C-MA13-2 | 一次性 | 状态字段 `S._subDescShown`（初始 `false`）置位后不再插；**不随 `resetActivity` 复位**（panel 会话生命周期内一次） |
| C-MA13-3 | 文案 | locale 键 `sub.desc`（zh / en 双档逐字——`thincoder-vscode/locales/{zh,en}.json`） |
| C-MA13-4 | 样式 | `.sub-desc`（`thincoder-vscode/webview/chat.css:329`）——仿 `.panel-desc` 族（`font-size: 10px; opacity: 0.5; padding: 2px 0;`），零改既有规则 |

- 落点：`thincoder-vscode/webview/activity.js:101-107`（插行 + 置位）· `thincoder-vscode/webview/state.js:42`（字段声明）。
- **射程核验**：`tailLines` 射程 = `.advisor-content` 的**子元素**（`activity-view.js:86-96`）——`.sub-desc` 与 `.advisor-content` 互为兄弟 ⇒ **不在射程内**（冻结 / 折叠后的 tail-3 不含说明行）。
- **既有面**：Task 面板（`panel.taskDesc`）与 Goal 面板（`panel.goalDesc`）的说明句**已在**（`thincoder-vscode/webview/panels.js`）——本项只补 Subagent 面（行面板已撤，现行 = 流内活动块）。

## 4. 消息渲染契约（Markdown 内联与转义）

**唯一内联引擎** = `inline()`（`thincoder-vscode/webview/md.js:34-64`）；`md()`（`:67`）第 5 步整体 `esc()`（`:104-106`）、第 7 步调 `inline()`（`:117`）；`mdInline(s) = inline(esc(s))`（`:146-147`）——**esc-first 架构**（调用方保证输入已转义）。

**次序契约**：「字面量保护通道」（反斜杠转义 → 代码段占位符，`md.js:37-45`）一律**先于**「Markdown 替换通道」（图片 / 链接 → 粗体 / 斜体 → 删除线，`:47-57`）。

| # | 契约点 | 规则 |
|---|---|---|
| R-1 | 代码段字面量 | 行内代码段捕获后置占位符，Markdown 替换通道**永不见**其内容 ⇒ 代码里的标记不被二次解释（`` `**x**` `` → `<code>**x**</code>`；`` `[a](http://b)` `` → `<code>[a](http://b)</code>`） |
| R-2 | 恢复序是硬约束 | 代码段**先**恢复、反斜杠字面量**后**恢复（`md.js:59-62`）——反向序会让落进代码段的占位符无人恢复（实证：`` `\*` `` 输出裸占位符） |
| R-3 | 转义契约 | 代码段内容一律来自调用方 `esc()`——**恢复点不得再次 esc**（双转义会产出 `&amp;lt;`） |
| R-4 | 代码范围外原始 HTML | **全转义 / 无 passthrough**（`md.js:106` `esc()`）——裸 `<script>` / `<img onerror=…>` 一律以文本呈现；链接 / 图片 URL 经 `safeUrl` 限流（`md.js:158-166`：仅 http / https / mailto，危险 scheme → `#`） |
| R-5 | 同步面 | `md()` 与 `mdInline()` 共用 `inline()` ⇒ 同一输入矩阵两条路径同契约（零额外改动） |

**登记（现状保持，非契约变更面）**：

- 代码内反斜杠折叠（`` `\*` `` → `<code>*</code>`）——非 CommonMark 形态，保持现状（如需 CommonMark 化，独立条目重开）。
- 多行代码段的 `<br>` 形态；未闭合反引号（不成代码段，全文转义文本）。
- **跨界配对族**（代码段内标记 ↔ 段外标记跨界配对型，如 `` `a **b` c** d ``）：两处标记**均字面**——修复前为 `<strong>` 跨 `<code>` 边界的畸形嵌套；该项差异**可外溢到 `<code>` 之外**（不在「非代码面逐字节不变」不变量覆盖内），按逐字字面量白名单机判。

**回归载体** = `thincoder-vscode/test/md-render-escape.test.mjs`（纯函数直驱，无需 happy-dom——渲染器零 DOM 依赖）。

## 5. 关键决策记录（含否决备选）

| # | 决策 | 否决备选 / 理由 |
|---|---|---|
| D-I1 | 组合守卫读**事件字段** `e.isComposing` | 否决复用 / 新增全局 `_composing` 标志（标志在 `compositionend` 丢失时成死键） |
| D-I2 | 三处 Enter 分支**统一**守卫 | 否决只修发送分支（组合 + 下拉打开的组合态会漏网） |
| D-I3 | @ 协调落 `input.js` **让位** | 否决 `autocomplete.js` 抢 `stopImmediatePropagation`（`input.js` 监听先注册先运行——让位是唯一有效侧） |
| D-I4 | busy 提示**复用既有 toast 与既有关键键** | 否决新增 locale 键（同源语义 = 同一句话）· 否决输入框闪动（无文案——「为何被拒」不可达，且形成两套瞬时反馈机制） |
| D-I5 | toast 机制**共享化**（`toast.js` 单写者） | 否决 `send.js` 内联复制（同元素双写者 / 双计时器漂移）· 否决由 `autocomplete` 导出（耦合方向不当） |
| D-I6 | toast 元素 id / class 维持 `paste-toast` | 零 CSS 触碰（命名债登记：机制已通用化，后续触达批可收口） |
| D-I7 | 「单行」判定 = **逻辑行**（`\n` 判定） | 否决视觉折行口径（textarea 无可靠折行 API；本端不实现竖移、无对齐诉求） |
| D-I8 | 非历史态 · 单行 ↓ = **吞键 + no-op** | 否决放行原生 ↓（同一单行内两分语义）；与 CLI「键已消费、无 fall-through」同源 |
| D-I9 | 历史修订在既有 `navigateInputHistory` **之上改门限**（零新状态） | 否决历史模块重构（无必要） |
| D-I10 | 内联次序 = 字面量保护先于 Markdown 替换；恢复序 = 代码段先、反斜杠后 | 否决「代码段提取置于最前」（越界改变代码内反斜杠语义）· 否决保持原实现（代码段内容被二次解释——语料实证） |
| D-I11 | 回归载体 = 新增测试档（纯函数直驱） | 否决并入既有渲染档（渲染契约无归属档）· 否决 happy-dom 驱动（渲染器零 DOM 依赖） |

## 6. 不并项与历史沿革

### 6.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-vscode/docs/design/WEBVIEW.md`（VSC 产品档）——**原地保留作参照历史**。下列内容**不并入本档**：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| §9.1 · §10.1 · §11.1.1 问题陈述与现场核实 | 各面缺陷的现场复现记录（Enter 双绑 / 组合期无守卫 / 下拉判据缺陷 / issue 对拍 R-1–R-5 / ↑↓ 门限断裂） | 一次性批次材料——**结论已在 §1–§2 契约**（修复已落地） |
| §9.3 · §10.2 · §11.1.3 方案选型与决策过程 | busy 可见化 2 候选 · 占位符-恢复形态 3 候选 · 原始 HTML 策略 3 候选 | 一次性批次材料——结论已入 §1 / §4 / §5（D-I4 · D-I10）；否决理由归旧档 |
| §9.5 · §10.5 · §11.1.4 · §11.2.3 受影响文件 | 各批施工面清单（文件行数 / 预计增量） | 一次性批次材料——行数随实现漂移，不具活档价值 |
| §9.6 · §10.6 · §11.1.5 · §11.2.4 用例表 | T-B2-* / T-H* / T-MA10-* / T-MA13-* 表与手法注 | 一次性批次材料——**测试资产归测试层**（`thincoder-vscode/test/`） |
| §9.7 · §10.7 · §11.1.6 · §11.2.5 验收标准 | 各批 AC 表 | 一次性批次材料——回指见 §9 |
| §9.8 · §10.8 · §11.1.7 · §11.2.6 边界 | 各批「不做」清单 | 一次性批次材料——**在册登记项**（IME 矩阵 / 折行竖移 / 代码内反斜杠折叠 / 跨界族）已按现行口径并入 §1–§4 |
| §10.3 逐字目标形态的 JS 代码块 | coder 照抄用的 `inline()` 全文 | 施工指令——**现态源码即权威**（`md.js:34-64`）；本档只留契约 |
| §10.1 修前 / 修后差异表 | 逐项对拍表 | 批次语境——差异边界（跨界配对族）已作登记写入 §4 |
| §11.2.1 现状核对表 | 「三面板」逐一复核 | 现状已收敛为一行（§3 尾注） |

### 6.2 迁移期登记（**非**不并项——随批收口）

| # | 事项 | 现状 | 收口点 |
|---|---|---|---|
| 1 | 需求侧对应条目（Enter / 输入历史 / 说明句 / 转义）在 `AGENT-LOOP（VSC 侧·需求）` §10 / §12 / §14 | 未迁入基准层（统一面）——引用保持迁移期口径 | 统一面批次并入 `docs/core/requirements/AGENT-LOOP.md` 后翻转 |
| 2 | 转义面历史修复（`webview/md.js` 的 esc-first 重写，2026-09-05） | 属既有实现史（git log 可查） | ——（已由 §4 现态契约取代） |

## 7. UI / 交互决策落档

| # | 决策 | 状态 |
|---|---|---|
| U-I1 | Enter：发送；组合期归输入法；@ 下拉打开时只接受建议 | 已定（§1） |
| U-I2 | busy 提交 = 排队（本地气泡 + 单槽——`running` 全面）；**唯一 busy 拒面 = 单槽满**（toast，2.6s 自动隐去 + 文本保留——对位 CLI 槽满面） | 已定（§1 · C-B2-6 · D-I4/D-I5） |
| U-I3 | ↑/↓ 五态判定（IME → 下拉 → 历史态 → 单行 → 多行边界门） | 已定（§2） |
| U-I4 | 首块说明行 = 一会话一次、纯文本（无新交互元素） | 已定（§3） |
| U-I5 | 行内代码内容一律字面；代码范围外原始 HTML 全转义 | 已定（§4 · D-I10） |
| U-I6 | 登记（未做，非 open）：真机 IME 矩阵 · 折行竖移 · 代码内反斜杠折叠 · 跨界配对族外溢 | 已定（§1–§4 逐条登记） |
| U-I7 | 无工作区拒发 = 保留文本 + 瞬时 toast（同 U-I2 形态）+ 占位符第三态；Send 按钮保持可见（点击即提示） | 已定（§1 C-B2-5 · `PROJECT-SWITCHER.md` §4.1） |
| U-I8 | busy 排队注入（busy 即排队面 = `S._turnState === "running"`——挂起会话内与普通回合同判据）= 本地气泡 + 单槽（载体两态：无会话 ⇒ `_busyQueued`；会话在飞 ⇒ 会话单槽 `susp.pendingInput`）+ 二次提交守卫（**两载体合计占用 ≥1** ⇒ 不出泡 / 不清框 / toast——对位 CLI 槽满面）；纯挂起等待（`susp`）既有单槽零改；送达 = 三支（driver 步骤 1 / 装载① 预填 / 装载② 归位——携贴图同过 F-1 降级判定） | 已定（§1 C-B2-6） |

## 9. 验收与需求回指

| # | 本档覆盖 | 回指 |
|---|---|---|
| 1 | 输入面 Enter 语义（组合守卫 · @ 协调 · busy 排队注入——唯一 busy 拒面 = 单槽满（C-B2-6 细则①）） | F-W5 |
| 2 | 输入历史与多行竖移（五态判定 · 草稿 stash · 不劫持原生竖移） | F-W6 · N-W8 |
| 3 | 首块说明行（一次性 · 文案 · 样式 · tail-3 射程核验） | F-W1 |
| 4 | 消息渲染契约（行内代码字面量 · 恢复序 · 全转义 · 跨界族登记） | F-W4 · N-W3 |
| 5 | 机检面（新增档 ≤500 行 · 无 >300 字符单行 · 文档锚零悬空） | N-M3 · N-M2 |

**用例面**：`thincoder-vscode/test/`（`webview-input-enter.test.mjs` · `webview-input-history.test.mjs` · `md-render-escape.test.mjs` · `activity-flow.test.mjs` · `busy-injection-vsc.test.mjs`（C-B2-6 面——含本批扩面行：会话在飞入槽 / 槽满跨载体 / 三支送达）· `chat-panel-messages.test.mjs`（busy 分流族））——用例表归测试层，本档不复制（D2）。

## 变更记录

- 2026-09-15（**B 式迁移轮 · VSC 第 2 批**）：建档——源档 §9 / §10 / §11 的内容重建入基准层（旧档一字未改、原地作参照历史）；坐标按 as-of 2026-09-15 实核改写（源档坐标漂移多处——如 `input.js` Enter / 下拉判据、`activity-view.js` tail 射程，均按现态改写）；批次材料（问题陈述 / 选型 / 受影响文件 / 用例表 / 验收标准 / 边界）入 §6.1。
- 2026-09-21（**无工作区守卫批 · 评审轮 1 修正轮 · eng-designer**——承批次档 §3 轮次 1 发现 6）：§1 零改面行改**纯现状表述**（去批次时点措辞——`applyBusyLock` 占位符含第三态（守卫 > busy > 常态））。**契约点 / 键面零变**。
- 2026-09-21（**busy-injection 批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-21-busy-injection.md` §2 · 需求授权 = CLI 需求档 F16 对称句）：
  §1 增 **C-B2-6**（busy 排队注入对称修——普通回合 busy 面（`running && !_suspended`）本地气泡 + `queuedUserMessage` → host `_busyQueued` 单槽；
  挂起会话内 busy / 纯挂起等待面零改；送达 = 回合尾装载两分支）；§7 增 U-I8；§9 行 1 补覆盖注记。**既有契约点 C-B2-1…5 / U-I2 / U-I7 零变**。
- 2026-09-21（**busy-injection 批 · 设计评审轮 1 修正** · eng-designer——承 `docs/batches/2026-09-21-busy-injection.md` §3 发现 7）：C-B2-6 细则①措辞收正（拒收 + toast 提示；槽内既有消息不被覆盖）；细则②补送达侧气泡生命周期（与纯挂起既有 queued 路径同款——送达时本地气泡即视为该消息 user 回声面，回合流式渲染不重复出气泡）。契约判别式 / 槽名零变。
- 2026-09-21（**无工作区守卫批**）：§1 增 C-B2-5（无工作区拒发可见提示 + 占位符第三态）；§1「零改面」行收正（`applyBusyLock` 出零改面）；§7 增 U-I7。**消息名 / 载荷字段零变**（新增 host → webview 消息 `workspaceGuard` 登记 = `WEBVIEW-PROTOCOL.md` §3.2 行 15）。

- 2026-09-21（**busy-injection 批 · 设计评审轮 2 修正** · eng-designer——承 `docs/batches/2026-09-21-busy-injection.md` §3 轮次 2 发现 3）：
  C-B2-4 规则句限定至收窄后仅存拒发面（挂起会话内 busy `running && _suspended`——拒发 + toast 不变）；U-I2 加同款限定注；
  普通回合 busy 面回指 C-B2-6 排队注入。**C-B2-6 本体 / 契约判别式零变**。
- 2026-09-22（**busy-injection 批 · 实施悬空裁定轮（fix round）· eng-designer**——承 `docs/batches/2026-09-21-busy-injection.md` §5 决策透明表 #5 / #6 + 父侧裁定）：
  C-B2-6 细则① 扩 **webview 二次提交守卫**（判据 / 状态清除时机 / 提示形三面 + 判据源 host 推送 `busyQueued`）；细则族补 **⑥ 送达路由贴图降级对位**（与 idle 面同一判定函数，三调用点）；
  细则⑤ 落点面同步；§7 U-I8 扩守卫与降级句；§9 用例面补 `busy-injection-vsc.test.mjs`。**判别式 / 槽名 / 既有契约点零变**（协议登记 = `WEBVIEW-PROTOCOL.md` §3.2 行 17 + §12 行 + §6.3 键 `input.slotFull`）。

- 2026-09-22（**busy-extend 批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-22-busy-extend.md` §1（E1 / E2））：**C-B2-4 删除**（busy 拒发 + `input.busyPlaceholder` toast——其唯一残面「挂起会话内 busy」本批回开为排队面 ⇒ 该契约点已无面）；
  C-B2-6 扩面为「busy 即排队面（`running`）+ 单槽载体两态」（细则① 判据源扩两载体合计 / ② 送达补会话在飞支 / ③ 外部入口守卫撤销 / ④ digest 例外撤销 / ⑤ 落点同步 / ⑥ 两面同款来源标记）；
  §7 U-I2 / U-I8 同步收正（U-I2 = 唯一 busy 拒面 = 单槽满；U-I8 = 排队面 `running` + 载体两态 + 三支送达）；§9 用例面行补本批档位。**C-B2-1/2/3/5 与 R-1…R-5 / U-I1/I3–I7 零变**（U-I2 · U-I8 本批收正——见上二处）。

- 2026-09-22（**busy-extend 批 · 设计评审轮 1 修正** · eng-designer——承 `docs/batches/2026-09-22-busy-extend.md` §3 轮次 1 发现 #2 / #3 / #11 / #12）：
  §7 U-I8 按 C-B2-6 收正（判据面 `running` 全面 / 载体两态 / 三支送达——「挂起会话内 busy 零改」与「回合尾装载两分支」两残留句退场）；
  §1 C-B2-6 零改面补「空输入 = 既有静默（`send()` 出口）」；§1 零改面行录入面括注改述（录入不禁；提交面受理分流 = C-B2-6）；§9 行 1 枚举收正（去「busy 拒发可见提示」→ C-B2-6 细则①）。**C-B2-1/2/3/5 与 R-1…R-5 / U-I1/I3–I7 零变**。
