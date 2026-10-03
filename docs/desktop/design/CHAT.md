# 桌面设计 · 对话流域（CHAT）

> **域**：会话流的块面 / 工具卡 / 审批卡 / 提问卡 / 计划卡 / 目标卡 / 引导与空态 / 复制面 / 流内非块节点族——本域设计单源档。
> **导航**：`docs/desktop/design/PROJECT.md`（总览 · 共享决策）∥ `IPC.md`（通道与载荷）∥ `SHELL.md`（壳与树）∥ `UI.md`（壳面形态）∥ `RENDERER.md`（渲染工艺）∥ `CHAT.md`（本档）∥ `COMPOSER.md`（输入区）∥ `ACTIVITY.md`（活动池与消化面）∥ `SESSIONS.md` ∥ `SETTINGS.md` ∥ `MENU.md` ∥ `PACKAGING.md` ∥ `E2E-TESTING.md`（端到端测试基建）∥ `WEB-QUICKCHECK.md`
> **来源**：自 `docs/desktop/design/PROJECT.md` §2（KD-8 ∕ KD-14 ∕ KD-22 ∕ KD-23 ∕ KD-24 ∕ KD-37 ∕ KD-39）∥ `docs/desktop/design/UI.md` §1（本域批注块）迁入（as-of 2026-10-02）；原址各留一行指针。
> **迁移状态**：波 2a 迁入 = KD 行 + UI 块（钉死表逐项）；域内其余面（§4.1 族行 ∥ §4.2 批块 ∥ §6.1 / §7 / §10 域行）已随「2c 前置步 · 文件账分片轮（含切片 4 终篇）」迁入——见 §3/§4/§5/§6（记录在册）。
> **需求侧**：需求分卷（`docs/desktop/requirements/`）行号以现文为准；本档 D 号引用 = 需求卷条目号（查卷口 = `docs/desktop/requirements/PROJECT.md` §4 **D 表索引**；本域卷 = `docs/desktop/requirements/CHAT.md`）。

## 1. 关键决策（迁移自 PROJECT.md §2）

| 号 | 决策 | 依据 | 被否候选 |
|---|---|---|---|
| KD-8 | 审批面 = **流内卡片 + 本会话活动池计数 + 标签位**三处呈现，语义单一（同一待决项的三种视图） | 需求档 §3.2 时序裁定；核侧审批通道本就分两条（`onBatchPermissionRequest` 批审批门 ∥ `onPermissionRequest` 逐项门，实读 `thincoder-core/agent/dispatch.mjs:281-303`）⇒ 本端**两条都接**，批审批映射为「全部允许 / 全部拒绝 / 逐项」三按钮 | **只接逐项通道**（批审批退回逐项 = 与另两端行为分叉）· **只接批通道**（单工具待决无出口） |
| KD-14 | `question` 工具 = **同回合内真作答**（新通道 `question:respond`〔出站 + 回执 · 白名单末位〕+ 桥面 `onQuestion` 改**异步返 Promise** + **核外待决表**〔沿审批门挂起表先例 · `promptId` 同源同值〕+ 流内问题卡） | 需求 §3.5 验收句逐字「跑完一个**带提问的任务**」要求工具**真可用**（批档 §1.6 裁定 (a)）；卡退场判据 = **回执 `ok` 真**（零乐观写——失败 ⇒ 卡留在场可重试） | **可视化路**（只显示问题、工具不可真用 = 需求形状缩水）· **保持同步返信号串**（工具仍不可真用——`thincoder-desktop/src/main/agent-bridge.mjs:72-75` 现形）· **改核侧 `question` 工具为真异步**（改核机制——越本端边界） |
| KD-22 | **复制面 = 核件代码块 Copy 钮（唯一）**：复制出口 = 核件 `attachCopyButtons`（`pre.code-block` 内 `.code-copy-btn`；词键 `msg.copy` / `msg.copied` = 端供给面，值同 VSC）；桌面挂点 = `thincoder-desktop/renderer/views/chat.mjs` `attachCodeCopies`（重挂 / 帧尾两调用点） | 需求 **D13**（2026-09-29 收正——「代码块复制」单留）；裁定 = 用户 2026-09-29 02:51–03:03 走查（口径「跟 vsc 对齐」）；对位基准 = VSC 复制面穷尽 = 代码块 Copy 钮（`thincoder-vscode/webview/history.js:51` 注「code-block copy buttons only」）；自建两枚 ⧉ 控件退场——摘除物全清单 = 本档 §2「复制面对齐 VSC 批注」项 2 | 引剪贴板库（违仓级零第三方约）· 自建第二复制面（无 VSC 对位——本裁定撤）· 真代码块取文面端侧重实现（核件钮单源） |
| KD-23 | **用户块出泡时刻 = `msg:send` 回执 `ok` 真（受理即出）**（#458）：块文本 = 提交文本逐字；块形 = 回放同形 `{ kind: "user", text }`；写者 = 发送面（直发径本地先行）∥ 排队消费回执（`ev:queue.delivered`——**五时刻**：步边界 ∕ 回合尾续发 ∥ **窗步边界消费** ∕ 窗内消费 ∕ 残续发）；键门 = 回执键 = 现刻 `activeSession`；入队径 = **消费前流内零块**（受理 ⇒ 待发送件住**输入区上方带**——派生（`pending` 镜面非空判据）、非流内块；消费时刻恰一枚真块入流；本地先行块滞后径由回执**退流**——收正轮 B12 终态口径，本批扩挂起窗径） | 受理判据 = `msg:send` 回执（`bad-key` / `provider-invalid` ⇒ 回合未启 ⇒ 会话里没有该条——实读 `thincoder-desktop/src/main/agent-host.mjs:186-205`）⇒「活流块 ⟺ 该条已受理」使活流与 `history:page` 回放同源（#458 缺陷类 = 两面不一致）；有序性 = 回执先于该回合首个带块事件（`run(...)` 非 await 起跑后立即 `return { ok: true }`——同档 `:212-228`；带块事件必晚于一次 provider 往返）；**既有判据零缩水**：失败径仍「稿逐字留 + 零块」（T-DSK32 ⑩⑪ **原形不动**）——本地先行出泡之回滚面 = 回执判据**退流**（失败 ⇒ 本地块退流 + 零块；稿留输入历史 `↑` 可召回；挂起窗径同批收正）。**边界**：非视觉降级径 ⇒ 入会话文本 = 提交文本 + 说明行（主进程 `appendLine`）——活流显示键入串（三端同义：VSC `addUser(ctx, text)` = 键入串），回放含该行；消解路 = 回执携入会话文本（须动 IPC 回执形——另裁，登记 PROJECT.md §10 AB） | **直发径 = 提交即出（本地先行出泡 · VSC 形）∥ 入队径 = 消费前流内零块 + 输入区上方带（本端口径——用户 2026-09-28 20:5x–21:07 裁定；与 VSC 流内标记形相反）**：原否两条理由（无尽标记机制 / 队列未分键）已随「对齐第二批」项 2 消解；**被否：提交即出 + 回执假回滚**——回滚 = 新「撤回」语义 + 块面双写路径，且「活流块 ⟺ 已受理」收口面不成立；**被否：提交即出 + 失败留块**——违 T-DSK32 ⑪ 且造活流 / 回放不一致（本批正是修这一类） |
| KD-24 | **流式游标清点 = 两族**（#459）：① 回合尾三径（`done` / `stopped` ∨ `ev:error`）② 段界（`ev:tool-call` 入场）；清点落点 = 归约面块面（须产生块面引用变更 ⇒ `blocks` 键变 ⇒ 帧触发 ⇒ 就地更新摘 `data-streaming` 锚） | 游标语义 = **末块追加态**（`thincoder-desktop/renderer/chat.css:33-37` 自注）；只清回合尾会留下「工具运行期游标常驻于已收束文本段」同族缺陷；清点走块面引用 = 唯一既有刷新径（旁路态不触发帧 ⇒ DOM 锚无刷新路径——缺陷成因面） | **被否：只清回合尾**（半量——段界窗口期同病）· **被否：帧尾扫描 DOM 摘锚**（DOM 面旁路 ⇒ 与「模型 → 树」单源相抵） |
| KD-37 | **错误横幅 = 详情 + 重试；重试 = 端侧重发末 `user` 块**（对齐第三批） | 重试出口取「端侧经既有 `msg:send` 直发径重发末 `user` 块文本」——依据：① 零新通道（VSC 宿主侧重发 = 其宿主自有历史面；桌面块的页读面即含历史块）；② 与输入区直发单一实现（零副本）；③ `ok` 假 ∥ 无末 `user` 块 ⇒ 零钮（诚实面）。被否候选 = 新通道 `msg:retry`（宿主读 agent history 重发——VSC 形最近，但白名单 +1 与回合装配面重入复杂度不值，登记可换） |
| KD-39 | **文件链接 = 宿主验存链 + 核包裹 + `file:open`；打开能力 = 外部编辑器 CLI 探测（命中 ⇒ 行参施加）∕ `shell.openPath` 兜底**（对齐第三批；#627 消解） | 验存闸（盘上存在）为核值——宿主 `extractFileLinks` 同源实现（语义同源 = `thincoder-core/file-links.mjs`——R2 处理流批上提后核单源；两端薄壳 = 探针注入——**只述实现形态**）；包裹 = 核 `linkifyPaths` 直消费；出口 = 新通道 `file:open`——VSC 打开至行；桌面同目标（消解 = 外部编辑器 CLI 探测：`code` → `code-insiders` → `cursor` → `subl`；命中 ⇒ spawn 含行参；未命中 ∕ spawn 败 ⇒ `shell.openPath` 兜底恰一次——实现 = `thincoder-desktop/src/main/editor-open.mjs`）。被否候选 = 渲染面自析路径（无验存闸 ⇒ 假链接）；被否候选 = 端侧直读 fs（渲染面零 fs 律） |

## 2. 界面形态与交互（迁移自 UI.md §1 · 本域批注块）

**本批注（对齐第三批 · 小修族 24 + 相抵 2 · 2026-09-28）**：本注定形「小修族 24 条 + 两条相抵」的**对齐形**（用户 07:11 裁定：**不存在「用户的不做」——流程自划的例外一律按对齐办**；需求档 §3.1:51 / §5.1 已收正）；用户 07:13「剩下的你自动跑完吧」授权下立批。口径 = 需求档 §3.6（**「对齐」= VSC 的形 + 行为**）；交底 = 逐条「现状 → 对齐形 → 落点 → 判据」；条目全文与出处 = `docs/batches/2026-09-28-desktop-vsc-align-3.md` §1 / §2。
核面新消费件（`formatToolSummary` / `isToolFailure` / `diff.mjs` 三导出 / `linkifyPaths` / 核台账行产）单源 = `docs/render-core/design/RENDER-CORE.md` §4 / §5；本注只述端侧形态 / 落点 / 判据 / 边界；通道载荷增键与白名单收正 = `docs/desktop/design/IPC.md` §1 / §2。

**A. 对话流面（12 项——本域）**

1. **工具卡·结果摘要行**——现状：头行四段、零摘要（核件 `tool-summary.mjs` 未接）。对齐形：头行增**摘要段**（`data-seg="summary"`）——字面 = `→ ` + 核 `formatToolSummary(name, result)` 直取（read / write / grep / glob / bash / advisor / 默认七分派）；
   判据 = 摘要非空才落（缺 ⇒ 零段）。落点 = `thincoder-desktop/renderer/views/chat-tool.mjs`（`toolHead`）。判据：机检 = 视图用例（`bash` 末行摘 / `read` N lines / 无摘要零段）；真机 = 与 VSC 同刻对照。
2. **工具卡·失败判据（红绿）**——现状：宿主 `ok: !startsWith("Error:")` ⇒ `(exit code 1)` / 全角 `Error：` 误判。对齐形：`ok = !isToolFailure(result)`（核 `lib.mjs` 判据单源——半 / 全角 `Error[:：]` 头 · 独立成行 `(exit code N≠0)` / `(killed: …)` / `(spawn failed)`）；
   头行色 = **VSC 逐值（#38 裁定 · 2026-09-29——本句为准）**：`name` 段 = `color: var(--accent)`（VSC `.tool-call-name` 600 + accent）· `args` 段 = `color: var(--fg)`；
   **两态色（`error` ⇒ `#f14c4c` ∥ `"done"` ⇒ `#4ec9b0`）归 `status` 段内联**（`[data-status]` 整行两态色退场——「整行两态」不保留：非 VSC 形，若保留须过真端差三件齐并成文）；耗时段一行（11px ∕ .6）与此一并落（#25 裁①）；
   **码面落法** = `thincoder-desktop/renderer/chat.css`：头行容器去 `[data-status]` 两态色规则 → `[data-seg="name"] { color: var(--accent) }` + `[data-seg="args"] { color: var(--fg) }` + `[data-status="error"] [data-seg="status"] ⇒ #f14c4c` ∕ `[data-status="done"] [data-seg="status"] ⇒ #4ec9b0`（值源 = VSC 内联色）；
   失败默认展开（既有 `isExpanded` 判据含之——零动）。
   落点 = `thincoder-desktop/src/main/agent-bridge.mjs` + `thincoder-desktop/renderer/chat.css`。
3. **工具卡·运行期实时输出**——现状：`result` 只累不显（视图仅展开态落体）。对齐形：**运行期卡体在场 + 展开**——`result` 非空 ∧（显式 `expanded` ∨ `status === "running"` ∨ `"error"`）⇒ 体落；**chunk 到达清显式折叠旗**（运行期展开由增量驱动——与 VSC 同径）。
   落点 = `thincoder-desktop/renderer/events.mjs`（`onToolOutput`）+ `thincoder-desktop/renderer/views/chat-tool.mjs`（`isExpanded`）。判据：机检 = 归约 + 构树两例；真机 = 长命令边跑边见。
5. **中止·未结算卡清扫**——现状：停止后运行中卡永停「执行中…」。对齐形：`stopped` 终局（本键）⇒ 未结算工具块（`status === "running"`）就地改 `status: "interrupted"`（体 / 折叠态不动——VSC 同）；
   状态词 = **已中断**（闭枚举 **8 词**——词键 `tool.interrupted`，值逐字同 VSC locales）。落点 = `thincoder-desktop/renderer/events.mjs`（`onActivity` 尾支）
   + `thincoder-desktop/renderer/views/chat-tool.mjs`（`STATUS_WORD`）+ `thincoder-desktop/renderer/i18n.mjs`。**摘要段（端差清算批收正）**：`status === "interrupted"` ⇒ 摘要槽值 = 逐字 `(interrupted)`（值源 = VSC `thincoder-vscode/webview/streaming.js:111`；`→ ` 前缀由既有摘要段格式自带；覆盖 `formatToolSummary` 派生）。
6. **中止·流内 `[stopped]` 痕**——现状：零消费。对齐形：`stopped` 终局（本键）⇒ 流内**非块节点**停止痕 `div.chat-stopped[data-stopped]`（落点 = 块序列之后、卡序列之前——尾段族同侧；沿 `[data-digest]` 先例），词 = `status.stopped`（**核键直取**——两语逐字）；
   样式 = 提示色 + 斜体（值源 = `thincoder-vscode/webview/streaming.js:141`）；清点 = 页读整置（运行期痕——非落盘件）。落点 = `thincoder-desktop/renderer/events.mjs`（切片 `stopMark`）+ `thincoder-desktop/renderer/views/chat.mjs`（非块节点组构树）+ `thincoder-desktop/renderer/chat.css`（组样式——提示色 / 斜体）。
7. **流式·子回合边界 turnBreak**——现状：桥零该面、续写并块（推回段界丢失）。对齐形：宿主接**核 `onSubTurnBreak`**（端差清算批收正——窄义钩子）⇒ 出站 `ev:activity { event: "turnBreak" }`（无 `fields`）⇒ 归约 = **清游标**（尾块追加态收束 ⇒ 下片文本起新块——VSC `streaming.js:71-88` 复位语义）。
   落点 = `thincoder-desktop/src/main/agent-bridge.mjs` + `thincoder-desktop/renderer/events.mjs`。**消解（端差清算批 · 2026-09-29）**：核补窄义钩子 `callbacks.onSubTurnBreak`（`thincoder-core/agent/completion.mjs` 六推回点——工具批尾 ∕ 中断注入两支零触）⇒ 桌面桥改挂 ⇒ 中断注入不再产 `turnBreak`（与 VSC 同「不断块」）。
8. **恢复帧·推理 / 正文次序**——现状：`blockOfMessage` 序 = `[text, reasoning, tools]`。对齐形 = `[reasoning, assistant, ...tools]`（核 `thincoder-render-core/flow/block.mjs:97-105` 序）。
   落点 = `thincoder-desktop/renderer/page-read.mjs`。连带 = `T-DSK37` 块序收正（`user / assistant / reasoning` ⇒ `user / reasoning / assistant`——E2E 档 + 集成用例随动）。
9. **错误横幅（详情 + 重试）**——现状：纯文本块、零出口。对齐形：错误块 = 横幅 = `.error-text`（原样）+ [`.error-details`（`techInfo` 在场才落——`details > summary` + `pre` 原生折叠）] + **重试钮**（词键 `error.retry`——值同 VSC）；
   重试出口 = **重发末 `user` 块文本**（经输入区既有直发径——单一实现零副本 · **零新通道**）；钮在场判据 = 末 `user` 块在场（否则零钮——诚实面）；`techInfo` 载波 = `ev:error` 载荷增键（宿主 `err.stack`——缺 ⇒ 键缺席）。
   落点 = `thincoder-desktop/src/main/agent-host.mjs` + `thincoder-desktop/renderer/events.mjs` + `thincoder-desktop/renderer/views/chat.mjs` + `thincoder-desktop/renderer/i18n.mjs`。边界：重试失败 ⇒ `console.error`（零乐观写）。
12. **台账行 ledgerNotice**——现状：零（仅状态行台账段）。对齐形：流内**台账行**——核行产 `{ text, warn }` 逐字（类名面 = 核 `ledger-line` / `.warn` 同形）；通道 = **`ev:ledger`（新）**（载荷 `{ key, lines }`）；
   触发 = **启动拍 + 周期拍**（`REFRESH_MS` = 120s——R8 落；对位 VSC startup + 周期两拍）；落点 = 流尾非块节点组 `[data-ledger-line]`（逐行）；数值面 = 核 `runLedgerScan` 直取（端侧零行构造）（单源 = `docs/desktop/design/IPC.md` §1 `ev:ledger` 行）。
   落点 = 主侧（`thincoder-desktop/src/main/project-info.mjs` 扩 + `ipc.mjs` / `preload.cjs`）+ `thincoder-desktop/renderer/events.mjs` + `thincoder-desktop/renderer/views/chat.mjs`（组构树）+ `thincoder-desktop/renderer/chat.css`（组样式）+ `core.css`（核行类名映射）。
13. **滚动·发送后回底**——现状：停跟期间发消息原地不动。对齐形：`msg:send` 受理（用户块入流）与回底**并笔**（`appendBlock` + `returnToBottom`——`following: true` / `pendingNew: 0` ⇒ 帧尾 `stick` 贴底）；直发 ∕ 排队消费回执两径同判（「回合中插入」批收正）。落点 = `thincoder-desktop/renderer/mount-composer.mjs`。边界：入队径（忙态）不回底（受理面才回底——与 VSC 同）。
14. **工具卡·advisor 轮次标签**——现状：载荷无 round。对齐形：`ev:tool-call` 载荷增 `round` / `model`（仅 `advisor` 名；值 = 核 `agent._advisorRound` 活读 +1 / `agent.provider?.model`——宿主只读采样面注入桥）；
   视图 = 头行段 `round` = `(round N · model)`（格式串 = VSC `ui.js:104-107` 同式；缺 ⇒ 零段）。落点 = `agent-bridge.mjs` + `agent-host.mjs`（采样面）+ `thincoder-desktop/renderer/views/chat-tool.mjs`。
15. **空态·欢迎条**——现状：`no-message` 单行 hint。对齐形：`no-message` 帧增**欢迎条**（三行）= 抬头（`welcome.heading`）+ 文案（已配 ⇒ `welcome.textConfigured` ∥ 未配 ⇒ `welcome.text`——值逐字同 VSC）
   + 快捷键行（`welcome.shortcuts` = 本端键位）；**端差消解（@ 文件引用对齐批 · 2026-09-29）**：VSC 行含 `@` 文件引用段——本端同段已落（词值 ∕ 链 = 本档 §2「@ 文件引用对齐批注」）。
   落点 = `thincoder-desktop/renderer/views/chat-guide.mjs` + `thincoder-desktop/renderer/i18n-views.mjs`。边界：`no-project` / `no-session` 两帧零动。

**B. 外围面（本域三项——owner ∥ 提问二项；余项住他域）**

1. **审批卡·owner 归属**——现状：载荷无 owner。对齐形：载荷增 `owner`（核 `opts.owner.label` 原样——`coder#2` / `consult <model> #id` 形）；卡首行增段 `owner`（`<owner> · <tool>`——owner 在场才落）。
   落点 = `thincoder-desktop/src/main/agent-bridge.mjs`（接核 `onPermissionRequired` 缝）+ `suspensions.mjs`（载荷）+ `thincoder-desktop/renderer/events.mjs`（`APPROVAL_KEYS` 增 `owner`）+ `thincoder-desktop/renderer/views/approval.mjs`。前提：owner 只在**子代理门**在场（深度 0 ⇒ 缺席 = 既有形，零回归）。
2. **提问卡·Enter 提交**——现状：Enter = 换行。对齐形：Enter（非组字）∧ 输入非空白 ⇒ 提交（复用 `onAnswerDraft` 径——单一实现）；Shift+Enter ⇒ 换行；IME 组字期零动作（沿「交互」行判据）。
   落点 = `thincoder-desktop/renderer/views/question.mjs` + `mount-cards.mjs`。
3. **提问卡·聚焦两态**——对齐形：① 新卡插入入场 ⇒ `[data-input="answer"]` 聚焦；② 作答 / 取消回执 `ok` 真 ⇒ 回焦输入区 `[data-input="text"]`。落点 = `mount-cards.mjs`。边界：失败径零动（卡留场可重试）。

**C. 相抵两条（需求档 07:11 已收正——本批实现面）**

1. **审批卡·diff 预览（原「不做 diff」）**——对齐形：载荷增 `diff`（核 `diffInfo` 原样——两形 `{ patch }` ∥ `{ old, new, path }`）+ 卡面 **diff 节点**（`.diff-preview`：header + 行级差）——行面 = 核三导出直取（`patchLineType` / `lineDiff` / `renderDiff`——值源单源）；
   超阈（patch > 20 行 ∥ 改动 > 12 行）⇒ **只出摘要 + 计数**（桌面零外部查看器——同工具卡降级判；VSC「view in editor」钮不采）。
   落点 = `thincoder-desktop/src/main/agent-bridge.mjs` + `suspensions.mjs` + `thincoder-desktop/renderer/events.mjs`（`APPROVAL_KEYS` 增 `diff`）+ `thincoder-desktop/renderer/views/approval.mjs`；
   样式 = `thincoder-desktop/renderer/chat.css`（diff 类名映射——值源 = VSC `base.css:405-432`；新增变量 `--diff-add-bg` / `--diff-add-fg` / `--diff-del-fg`，`--diff-del-bg` 在册）。
2. **文件链接点开（原「文件打开暂缓」）**——对齐形：工具结果区**可点文件链接**——线 = `ev:tool-result` 载荷增 `links`（`[{ raw, path, line? }]`——宿主计算：路径 token + **盘上存在闸** + 去重 + 封顶；语义同源 = `thincoder-core/file-links.mjs`（R2 处理流批上提后核单源），两端薄壳 = 探针注入——**只述实现形态**）；
   行参面 = 探测径命中 ⇒ 含行；兜底径 = `shell.openPath`（无行参——宿主事实，单源 = 本档 KD-39）；
   视图 = 结果区挂核 `linkifyPaths`（`span.file-link` 核类名——帧尾着装幂等）＋ 着装面落 **`data-path` 锚**（值 = 该链接盘上绝对路径——核件不带 ⇒ 端侧着装时落；断言面 = T-DSK42 / T-DSK43）；出口 = 点按 / Enter 委托 ⇒ 通道 `file:open { path, line? }` ⇒ 主进程打开。
   落点 = 新档 `thincoder-desktop/src/main/file-links.mjs` + `agent-host.mjs` + `ipc.mjs` / `preload.cjs`（白名单）+ `thincoder-desktop/renderer/views/chat-tool.mjs`（着装）+ `mount-*.mjs`（委托单点）+ `core.css`（类名映射）。
   **消解（端差清算批 · 2026-09-29）**：桌面打开 = 外部编辑器 CLI 探测（`code` → `code-insiders` → `cursor` → `subl`——命中 ⇒ spawn 含行参 ⇒ 打开到行；未命中 ∕ spawn 败 ⇒ `shell.openPath` 兜底恰一次；实现 = `thincoder-desktop/src/main/editor-open.mjs`）。边界：历史卡（页读面）零链接（VSC 同径）；`file:open` 失败 ⇒ `console.error`。

**F. 出处重核输出（入本批两件之一——本域）**

- **审批卡·真置焦执行**（原 open 项：出处 = 流程自划「未落」）⇒ **入本批**：帧尾对 `[data-autofocus="1"]` 执行 `focus()`（VSC `permission.js:76` +50ms 先例——桌面取挂载后即焦）；落点 = `thincoder-desktop/renderer/views/chat.mjs` 帧尾着装 / `thincoder-desktop/renderer/views/approval.mjs`。
  判据：**机检** = 随批单元证据（卡内 `[data-autofocus="1"]` 恰一 ∧ 帧尾执行点——假 DOM 无焦点面 ⇒ 执行读数归真机）；**真机** = 人工走查 + 父侧真跑闭合（真 Electron：卡出现即 `document.activeElement` = 卡内焦点锚——T-DSK43 ⑥）。

**D. 计数（D3 · 本域分项）**：小修族对话流面 **12**（A 全）+ 相抵 **2**（C 全）+ 外围三项（B1 ∥ B2 ∥ B3）+ 出处重核 **1**（F-置焦）；状态词闭枚举 **8 词**（含新增「已中断」）；
   新通道 **2**（`ev:ledger` 事件——§1 十五 ⇒ 十六通道；`file:open` 请求——白名单 **28 ⇒ 29 项**）· 载荷增键（本域涉）= `ev:tool-call` `round` / `model` · `ev:approval` `owner` / `diff` · `ev:error` `techInfo` · `ev:tool-result` `links` · `ev:activity` `turnBreak`；
词键增（本域涉）≈ 多枚 × 2 语（`tool.interrupted` · `error.retry` · `welcome.*` 四 ——实施轮按盘面实读计，不以计数为门）；新档 **1**（`file-links.mjs`）；渲染面**首个定时器**（1s 拍——主段住 ACTIVITY）。

**本批注（R12 会话流 ⇒ VSC 对齐 · 2026-09-29）**：本注补本档「对话流」行的 **R12 会话流 ⇒ VSC 对齐**（该行已就地指针）；基准 = VSC `#messages` 消息面（`thincoder-vscode/webview/chat.css` + `thincoder-vscode/webview/history.js` 懒加载 ∕ `thincoder-vscode/webview/ui.js` 跟滚）；
批档 = `docs/batches/2026-09-28-desktop-flow-vsc-align.md`（R12 + R12 收口修复轮）；台账 #526。

1. **块壳 = 透明无卡壳**（无边框 ∕ 无底 ∕ 零内边距）；D24 保留面 **`.block` 移出**（本档 §2「外壳视觉降噪 · D24」注项 6 ∕ 项 7 同拍收正）。落点 = `thincoder-desktop/renderer/chat.css`。
2. **面宽 = 全型 100%**（有效值——VSC 基础行 90% 被 user ∕ assistant 两覆盖行落至 100%）· **块距**（现值 = 本档 §2「流内竖向间距批注」——块块相连 + 带签 ∥ 盒块（三型）两例外——上距 8px（轻通道轮四 2026-10-01 全族归一））。
3. **件级外边距（扁平块模型）**：件级层（VSC 件型各自 `margin`）由**块级块距**承担——三覆写随扁平化（2026-09-30）退场（间距单源 = 本档 §2「流内竖向间距批注」）；助手文本内边距 `8px 0`（user `0`——VSC 同值）不变。落点 = `thincoder-desktop/renderer/chat.css`。
4. **首块上距 = 14px**（骨架承担——`.flow` `padding-top: 14px`；左右 ∕ 下沿 = `--gap` 12px——与 VSC 同值）。落点 = `thincoder-desktop/renderer/chrome.css`（R12 收口修复轮落值）。
5. **滚动 ∕ 回填行为**（阈值 ∕ 判定 ∕ 补偿）单源 = `docs/desktop/design/RENDERER.md` §3 ∕ §4——本注不重述；证据 = 真机探针 **22 ∕ 22**（亮色 · `pageerror` 0——R12 探针留证）。

**本批注（流内竖向间距 · 2026-09-30）**：本注定形会话流**竖向间距**现值——承扁平化（用户 2026-09-30 走查：块块相连 ∥ 零分割线；框架留白保持原样）+ 轻通道两笔（台账 #715 消息前留距 ∥ #716 盒块间呼吸）+ 轻通道轮四**全族归一定档 8px**（台账 #759——16 ∥ 8 混用失衡 ⇒ 试 10 ∥ 5 ⇒ 定单值 8；用户「看上去反而间距不一样了」→ 复指仍不均匀）。

1. **块距 = 0**（默认）——块块相连；落点 = `thincoder-desktop/renderer/chat.css`（`.block + .block`）；**非块插层承接**——消化行族（行元素——无轮容器（#747））流内就地插于两块之间时 `+` 相邻选择器不命中，由两条承接规则命中（全族同值 8；落点 = 同档 `:47-52`）。
2. **带签消息块上距 = 8px**——凡带说话人标签的块（用户块恒带；助手族回合首块 = 推理 ∕ 工具 ∕ 文本 ∕ 错误 ∕ 归档任一型承载标签）；用户 2026-09-30「❯ You:/❯ ThinCoder: 前面留大一点间隔」（定 16px；**轻通道轮四 2026-10-01 归一定 8px**）；选择器 = `.block + .block:has(> .msg-label)`（按「凡带签」命中，不挑型）。
3. **盒块上距 = 8px（三型）**——思考 ∥ 错误 ∥ 归档（非带签者）间呼吸；**工具块零距相连**（轻通道轮二——用户「工具块之间的间距也没必要了」）；用户 2026-09-30 走查「工具和思考块之间都没间隔……你觉得呢」+ 父侧建议；CLI 参照 = `thincoder-cli/src/tui/render-conversation.mjs:375` 块前空行；选择器 = `.block + .block:is(.block-reasoning, .block-error, .block-subagent):not(:has(> .msg-label))`。
4. **首块上距 = 14px** 不变（`.flow` `padding-top`——R12 注项 4 同值）；**件级三覆写（工具 8 ∕ 错误 8 ∕ 推理 4）退场**——由本条 1–3 的块级模型通管。
5. **消化行上距 = 8px**——用户 2026-09-30「前面希望留点间距，不要跟上面的内容挨在一起」；落点 = `thincoder-desktop/renderer/chat.css`（**消化行族行元素**——无轮容器（#747），容器选择面随形收正）；**族内相邻行上距 0**（`.chat-digest + .chat-digest`）；**轮间 = 基规则 8px**（新轮标签行紧随前轮行 = 行出即留后常态 ⇒ `.chat-digest + .chat-digest[data-digest-label]` 回基值——自然形收正批 · 2026-10-01 补条）。
6. **验证**：真机 computed 实测（带签块 8 ∥ 盒块 8（三型）∥ 无签块 0——全族归一后同值；工具块头行距 = 行高（**随字号联动**——现 14px × 1.3 = 18.2px；笔 5 判据句「连续工具块文字距 = 内容行间」）+ 用户走查通过（2026-09-30「看着舒服」；2026-10-01「这个距离差不多了」）；测试面 = 桌面测试树空清单（2026-09-28 全清重置）——视觉面验证靠真机探针。
7. **轮四流形三件（2026-10-01 · 台账 #759——「向 CLI 看齐」）**：
   ① **工具头前导箭头**——两态 `▸`（折叠）∕ `▼`（展开；`.block-tool:has(> .tool-result)` 判）；仅带 toggle 接线的可开关头落箭头（`::before` 字形）；落点 = `thincoder-desktop/renderer/chat.css:166-168`。
   ② **展开体左流线**——`.tool-result` ∥ `.reasoning-content` 同形：`border-left: 2px solid var(--fg-muted)` ∥ 左移 13px ∥ 留白（工具结果 6px ∥ 推理内容 10px）；线心对箭头心（实测差 0.1px）；落点 = 同档 `:189-193` ∥ `renderer/core.css:83-84`。
   ③ **思考块底色撤 ∥ 摘要箭头自绘**——`.reasoning-block` 原 `background: var(--overlay)` 删（有竖线后底不需要）；箭头由原生 marker 改自绘两态（`list-style: none` + `::before` `▸` ∕ `[open]` `▼`——与工具头同几何）；落点 = `renderer/core.css:25-32` ∥ `:42-46`。

**本批注（复制面对齐 VSC · 2026-09-29）**：本注定形「右键编辑菜单补齐 + 自建复制面两控件摘除」（台账 #557 / #558；裁定 = 用户 2026-09-29 02:51–03:03 走查，口径「跟 vsc 对齐」）；需求 = 需求卷 **D27**（新增）+ **D13**（收正）；批档 = `docs/batches/2026-09-29-desktop-copy-vsc-align.md`；决策 = `docs/desktop/design/PROJECT.md` §2 **KD-43**（+ KD-22 收正）。

1. **右键编辑菜单（D27 · 宿主面）**——机制 = `win.webContents.on("context-menu", (event, params) => …)` 按 `params` 构模板 ⇒ `Menu.popup({ window })`（Electron 无默认右键菜单——零实现即零菜单）；
   **条目集**（纯函数 `contextMenuTemplate(params, labels)`；空 ⇒ 不 popup）：可编辑（`params.isEditable`）⇒ **剪切 ∕ 复制 ∕ 粘贴 ∕ 全选**（序 = cut → copy → paste → selectAll；`enabled` 取 `params.editFlags` 对应值——缺键不禁用）；
   非编辑 ∧ 选中（`selectionText` 非空）⇒ **复制 ∕ 全选**；非编辑 ∧ 空选 ⇒ **零菜单**（不出）。
   行为 = Chromium role 四件（`cut` / `copy` / `paste` / `selectAll`）；**沙箱判据句**：role 执行径 = 主进程 `webContents` 方法（实读 Electron v44.4.5 `lib/browser/api/menu-item-roles.ts` `webContentsMethod`）⇒ `contextIsolation:true · sandbox:true · nodeIntegration:false` 下可用性成立（与既有键盘面 Ctrl+C/V 同径——不经渲染面 Node ∕ 权限面）。
   **文案面** = **显式 `label` 取词表四键**（`menu.edit.cut` ∕ `menu.edit.copy` ∕ `menu.edit.paste` ∕ `menu.edit.selectAll`）——**持有面 = `thincoder-desktop/renderer/i18n.mjs` 宿主表 `HOST_DICT`**（两语；en = `Cut` / `Copy` / `Paste` / `Select All` ∥ zh = `剪切` / `复制` / `粘贴` / `全选`）；
   **读取径 = 主进程 `context-menu.mjs` `contextMenuLabels(locale)` 经 `HOST_DICT` 两语现读**（主进程引渲染面宿主表之既有先例 = `thincoder-desktop/src/main/attachments.mjs:27`；`locale` = `loadConfig().locale` 右键时刻现读——语言切换即时随动；读失败 ⇒ 回落 en + `console.error`；与 `notify.*` 主进程自持族的差异**有意**——勿统一）；
   **不采 role 默认文案**（同实读：默认文案 = 英文硬编码字面：`Copy` / `Cut` / `Paste` / `Select All` ⇒ 直采即 `#533` 式 en-only 债）。
   落点 = 新档 `thincoder-desktop/src/main/context-menu.mjs`（`contextMenuLabels(locale)` + `contextMenuTemplate(params, labels)` 两纯函数 · 零 `electron` ⇒ 平 node 直测）+ `thincoder-desktop/src/main/window.mjs`（`createWindow` 内落子 + `loadConfig` 现读）；
   与同档 `buildMenu()` **两事不混**（应用菜单 = `win.setMenu`；右键菜单 = 每弹独立模板；应用菜单 Edit 组 roles **零动**）。
   边界：零 IPC ∕ 零白名单项 ∕ 零新通道（主进程本地面）；链接 ∕ 图片类条目**不落**（D27 射程外——禁自造）。
2. **复制面两控件摘除（D13 收正）**——**当前复制面 = 核件代码块 Copy 钮（唯一）**：`pre.code-block` 内 `.code-copy-btn`（核件 `attachCopyButtons`；词键 `msg.copy` / `msg.copied` = 端供给面）；桌面挂点 = `thincoder-desktop/renderer/views/chat.mjs` `attachCodeCopies`（重挂 / 帧尾两调用点——零动）。
   自建面摘除物（**零残留为判据**）：`chat-copy.mjs`（整档删——`blockTextOf` 迁 `thincoder-desktop/renderer/views/chat-text.mjs`）· 块尾 ∕ 推理块尾 ∕ 错误块尾 `chat:copy-block` 控件 · 输入区尾 `chat:last` 控件 · `[data-composer-tail]` 挂件锚（槽形三件 ⇒ 两件）·
   `thincoder-desktop/renderer/chat-composer.css` 两控件族与 `⧉` 字形规则 · i18n 两键（`chat.action.copy` ∕ `chat.action.copyLast`）·
   `thincoder-desktop/renderer/app.mjs` `writeText` 单点供给（消费者归零随退）；`data-raw` 锚**保留**（就地更新判据面）。
3. **判据**——① **D27 真机**：选中文本 ⇒ 右键 ⇒ 菜单出「复制」⇒ 剪贴板往返（粘回可见）∥ 输入框 ⇒ 四件在场（粘贴可用）；
   ② **D13 真机零残留**（**判据域 = 代码树**：`thincoder-desktop/**` ∕ `thincoder-render-core/**`——排除 `docs/`）：`⧉` 零命中 ∧ `chat:copy-block` ∕ `chat:last` ∕ `chat.action.copy` 零命中 ∧ 代码块 Copy 钮仍在且点按可复制；
   ③ 机检面 = 两纯函数平 node 直测口径（`contextMenuTemplate` 三语境 + `editFlags` 启用径 + 两语词值）——**批档本地用例随批留存**（载体 = `docs/batches/2026-09-29-desktop-copy-vsc-align.test.mjs` · 不入仓套件——全清令：仓套件不写 ∕ 不改 ∕ 不跑）；真机走查 = 父侧真跑闭合（D16 义务）。
4. **计数（D3）**：摘除档 **1**（`chat-copy.mjs`）· 新档 **1** = `thincoder-desktop/src/main/context-menu.mjs`（已落 · 60）· 词键退 **2** × 2 语 + 增 **4** × 2 语（净 +2 键）· 通道 **0** · 白名单 **0** 改。

## 3. 文件账（本域）

### 3.1 本端文件清单与行数预算（本域族行 · 迁自 `PROJECT.md` §4.1）

| 文件 | 预估行数 | 说明 |
|---|---|---|
| `thincoder-desktop/renderer/views/chat-chrome.mjs` | **250**（届盘实读收正——表载 252 ⇒ 250；波 2a 迁移销项） | 会话流壳面（对话流槽 / 帧调度接线；自 `views/chat.mjs` 出档——structure-split-2 批） |
| `thincoder-desktop/renderer/page-read.mjs`（对齐第二批拆分产出） | **280**（实读 2026-10-03——无效渠道态逻辑归一批（#841）实施落盘（278 ⇒ 280——页读回执 `providerState` 落切片（与 `meta` 同写点））；前读 **278**（实读 2026-10-02——**#794 落盘后**（读面归一 + 接线——258 ⇒ 278）；前读 **258**（届盘实读收正——表载 237 ⇒ 258；波 2a 迁移销项））） | 页读径出档（`applyPage` / `blockOfMessage` / `seedPatch` / `metaOf`——自 `thincoder-desktop/renderer/events.mjs`） |
| `thincoder-desktop/renderer/chat.css` | **365**（实读 2026-10-01——扁平化随动收口批（#713）落盘后（366 ⇒ 365）；更前实读 2026-10-01——消化行自然形收正批（#768）后（361 ⇒ 366——轮间承接条）；更前实读 2026-10-01——**轻通道轮四码面笔后**（354 ⇒ 361〔门实读〕）；前读 = **354**〔实读 2026-09-30——**#747 落盘后**（轮间规则复归——**行元素面落（无轮容器）**：轮族相邻 ⇒ 轮间 0（#718 口径）；痕样式零改——见 `PROJECT.md` §4.2 本批行 9）〕；更前 = **350**·留档批（#719）：注释两处随动（「运行期块」表述 ⇒ 留档块——行 300 族注 ∥ 行 342 归档块注；348 ⇒ 350）；前史：工具头色批后 329（327 ⇒ 329）＋近批增量（含 +19——逐程归因随 #708）；**超 300 建议线**（< 500 硬限）⇒ 预案 = 新立 `chrome-denoise.css`） | 对话流块 / 工具卡 / 摘要块 / 药丸样式（形态单源 = `docs/desktop/design/UI.md` §1 对话流 / 工具卡行——分档理由 = `styles.css` 实读 284 贴 300 层） |
| `thincoder-desktop/renderer/questions.mjs`（残余批拆档产出） | **47**（实读 2026-10-01——桌面二择批实施后（44 ⇒ 47——`clearQuestion` 共享谓词）；前读 2026-09-29 = 44） | 提问 ∕ 计划切片面（`onQuestion` ∕ `onTask` ∕ `clearQuestion`；位标面经 `badges.mjs`） |
| `thincoder-desktop/renderer/views/chat.mjs` | **205**（实读 2026-10-01——**#768 落盘后**（204 ⇒ 205）；更前实读 2026-10-01——**#764 落盘后**（#765 228 ⇒ 204——结算式重写）；前读 **244**（#747 落盘后（`mountTail` 边界物插入 ∥ `settleFrame` 落位随动——见 `PROJECT.md` §4.2 本批行 5）；前读 = **234**·留档批（#719）构树面出档：`views/chat-tree.mjs`（**127**）——`chatTree` ∥ `blockNode` ∥ `pushFlow` 迁出；③′ ∥ ④′ 骨架（`pendingDigestSeats` ∥ `seatDigestRounds`）+ `_blockAt` 记账留存；**≤300 回线 ⇒ 越层除名**；更前 2026-09-30 = 305（E4-JS 支——299 ⇒ 305）；**#765 落盘 228 ⇒ #764 落盘 204（实读兑现）**） | 对话流三态 + 块六型（用户 / 助手 / 推理 / 工具 / 错误 / `subagent`——**六型全员页读域**（`subagent` = 留档块——留档批 · #719）；「对齐第二批」项 5）（形态单源 = `docs/desktop/design/UI.md` §1 对话流行）；审批卡**入流**（本批——卡面住 `thincoder-desktop/renderer/views/approval.mjs` 行，本档落槽位与帧尾随动）（流式 / 滚动 / 工具卡三面已分档——`chat-stream.mjs` / `chat-scroll.mjs` / `chat-tool.mjs` 三行）；批 A：卡三类入流序（待审批 → 提问 → 计划）+ 贴 300 层（拆分预案 = 卡构树拆出——卡面两档已单立）；**批 B**：逐块复制控件引调（构树原住 `chat-copy.mjs`——**复制面对齐批已删档**；本档现持 `attachCodeCopies` 挂点（核件 Copy 钮——重挂 / 帧尾两调用点））；**批 B 追加轮**：`chatModel` 增 `guide` 判据（`no-project` / `no-session` / `no-message` / `null`）+ 构树引调 `thincoder-desktop/renderer/views/chat-guide.mjs`（已落——空态构树外提）；**留档批**：构树面出档（`chat-tree.mjs`）+ 位次落位骨架（③′ ∥ ④′） |
| `thincoder-desktop/renderer/views/chat-tree.mjs`（消化面留档批拆分产 · 新档） | **147**（实读 2026-10-01——**#768 落盘后**（143 ⇒ 147）；更前实读 2026-10-01——**#765 落盘后**）；前读 **151**（#747 落盘后（`pushFlow` 座次复列 + 消费轮配对——见 `PROJECT.md` §4.2 本批行 6）；前读 = **128**（#738 链落盘后）；**#765 落盘 = 143（实读兑现）**） | 构树面出档（自 `thincoder-desktop/renderer/views/chat.mjs`——`chatTree` ∥ `blockNode` ∥ `errorNode` ∥ `turnHeadOf` ∥ `TURN_KINDS`（含 `pushFlow` 按记录位次复列）；缝 = `chatTree` 保名再出口——消费面零改；单源 = 批档 `docs/batches/2026-09-30-digest-persistence.md` §2 ∥ §5） |
| `thincoder-desktop/renderer/views/chat-model.mjs`（更新纪律收核批 · 拆分产出） | **117**（实读 2026-10-01——**#761 落盘后**（+`help` 字段 ∥ `helpLinesOf`）；前读 **104**（实读 2026-09-30——单值收形（旧标「104 ⇒ ≈106」为估）；**digest-parity 批**：`digestOf` 多轮判据；模型族七件出档——`chatModel` ∕ `retrySourceOf` ∕ `awaitingOf` ∕ `digestOf` ∕ `compressOf` ∕ `timerNoticeOf` ∕ `ledgerOf`；引调面 = `renderer/app.mjs` 单处） | 更新纪律收核批 |
| `thincoder-desktop/renderer/views/chat-pending.mjs`（对齐第二批新档） | **69**（实读 2026-09-29） | 带面构树（输入区上方带——非流内） |
| `thincoder-desktop/renderer/views/chat-subagent.mjs`（对齐第二批新档） | **106**（实读 2026-10-01——复核扫面收正批实施后（101 ⇒ 106——M11 helper）；更前实读 2026-09-30——**留档批（#719）**：留档块口径注释收正（「运行期块」表述退场——净 +1）；前读 2026-09-29 = 100（RF 波 2 后）） | 归档块构树（留档 `subagent` 块——尾追入流）；**让位修复批**：归档重建径 `initBlockFollow` 接线（防御性单源——冻结块零行为变更）；**留档批**：注释随动（留档块口径——页读有源 ∥ 计 `data-hidden` ∥ 可回填） |
| `thincoder-desktop/renderer/views/chat-stream.mjs` | **72**（实读 2026-10-01——**#764 落盘后**（重写兑现——判据族 ∥ 扫描族 ∥ 帧前判据全删）；前读 **101**（性能尾账批后）） | 流面结算纯件出档（`blockKey` 保名 + `flowStep`——账 + 作业 ⇒ 摘 ∥ 造 ∥ 刷；零 DOM ∥ 零 `node:`；平 node 直测） |
| `thincoder-desktop/renderer/views/chat-scroll.mjs` | **108**（实读 2026-10-01——**#764 落盘后**（残件-1 随动）；前读 **115**（E4-JS 支（`deps` 增 `onScrollTick` 缝 ＋ 档头注——112 ⇒ 115）后；前史：内容行数口径；RF 波 3 后）） | 滚动面三事——渲染窗口 / 回填 / 跟滚与药丸（常量与阈值单源 = `docs/desktop/design/RENDERER.md` §2 / §3）+ `guards{ hasOlder, inFlight }` 与 `onBackfill` 接线 |
| `thincoder-desktop/renderer/views/chat-tool.mjs` | **300**（实读 2026-09-29——align-3 小修族后） | 工具卡面：工具块构树三件（头行 / 改动摘要 / 结果区）+ 折叠纯函数 `toggleExpanded` + 接线两态原语（`wire` / `withKey`）+ **共享导出面**（批 7 追加：阈值常量 `DIFF_FILE_FLOOR` / `DIFF_LINE_FLOOR` · `changeTotals` · 改动摘要行构造〔越阈降级 = 只摘要行 ∧ 零 `[data-file]`〕——审批卡面复用零副本，阈值 / 摘要形单源）——拆分落形（`chat.mjs` 228 + 123 = 351 > 300 ⇒ 越层拆出；形态单源 = `docs/desktop/design/UI.md` §1 工具卡行） |
| `thincoder-desktop/renderer/views/approval.mjs` | **243**（实读 2026-09-29） | 审批卡面：两形键位（`verdictOfKey` 纯函数 ⇒ 表外零动作）+ **初始焦点目标** = 最安全键（标记锚 `data-autofocus="1"` + `chat.css` 高亮；**真置焦执行 = 本批落**——帧尾 `focus()`：`docs/desktop/design/UI.md` §1「本批注（对齐第三批 · 小修族）」F-置焦）+ 出口动作 `respondApproval` + **操作区描述符导出**（三出口锚 / 值映射 / 词键 = 单一 owner——池面待审批族消费零副本）（零 `store.mjs` import——出口经注入句柄；形态单源 = `docs/desktop/design/UI.md` §1 审批呈现行 · 通道 = `docs/desktop/design/IPC.md` §2） |
| `thincoder-desktop/renderer/views/question.mjs` | **58**（实读 2026-09-29） | 提问卡面（`question` 工具流内卡——纯描述符 + 薄挂载；子序 = 题干行 → [给答项操作区?] → 作答区；三出口锚 `question:<i>` / `question:answer` / `question:cancel`——零 `store.mjs` import；形态单源 = `docs/desktop/design/UI.md` §1 提问呈现行） |
| `thincoder-desktop/renderer/views/plan.mjs` | **34**（实读 2026-09-29） | 计划卡面（`ev:task` 消费——纯描述符；行 = 事项标题 + 状态词；空列表 ⇒ 卡不在场；形态单源 = `docs/desktop/design/UI.md` §1 计划面行） |
| `thincoder-desktop/renderer/views/goal.mjs`（R5 新档） | **63**（实读 2026-09-29——残余族清账批后） | 目标卡面（核 `renderGoalPanel` 直消费 + 端壳；纯呈现零出口） |
| `thincoder-desktop/renderer/mount-cards.mjs`（批 A 修正轮） | **164**（实读 2026-10-01——复核扫面收正批实施后（167 ⇒ 164——M1 失败臂删）；更前实读 2026-09-29——残余族清账批 ∕ RF 波 2 后） | 卡族挂载与出站（批 A 修正轮新档——提问卡出口落点点名）：`question:respond` 出站（作答 / 取消两向）+ 回执 `ok` 真 ⇒ 清本键 `questions` 切片（纯动作 `clearQuestion` 增导出 = `thincoder-desktop/renderer/events.mjs`）+ 清位标（**清码判据 = 两族皆清**——单源 = `docs/desktop/design/UI.md` §2 项 2）+ 卡挂载（计划卡零出口——纯呈现）；先例 = 审批出口 `respondApproval` 住 `thincoder-desktop/renderer/views/approval.mjs` ∥ 接线住 `thincoder-desktop/renderer/mount-pool.mjs`；形态单源 = `docs/desktop/design/UI.md` §1 提问呈现行 |
| `thincoder-desktop/renderer/views/chat-guide.mjs`（批 B 追加轮） | **81**（实读 2026-09-29——@ 文件引用对齐批后（登记句收正 + `@` 段注释）） | 首启引导节点构树（三值 `data-guide`：`no-project` / `no-session` / `no-message`——判据单源 = `thincoder-desktop/renderer/views/chat.mjs` 的 `chatModel.guide`）；**非块节点**（零 `data-block-id` · 不入块序）· 零 `store.mjs` import（句柄注入 `onOpenDir` / `onNewSession`）——流内非块节点构树先例；形态单源 = `docs/desktop/design/UI.md` §1 批 B 追加注 |
| `thincoder-desktop/renderer/views/chat-text.mjs`（R3c） | **127**（实读 2026-10-01——**#764 落盘后**（残件-2）；前值 126（E4-JS 波后零改复核）） | 文本面经核 `md` + 推理块壳 + 帧尾就地更新（`user` ⇒ `mdInline` ∥ 余型 ⇒ `md`）；**E4-JS 支（2026-09-30）**：分段窗不住本档（**零改**——落点收正 = 批档 §2.15） |
| `thincoder-desktop/renderer/views/chat-text-segments.mjs`（E4-JS 支） | **497**（实读 2026-09-30——E4-JS 波后；**越 300** ⇒ 越层在册——见 `PROJECT.md` §4.1 越层段；**距 500 硬限余 3 行**） | 巨块分段窗（段 = 12K 渲染字符 ∕ 窗 = 视口段 ±1 ∕ 每帧 ≤2 变更；`splitText` + `<span data-seg>` 包壳 ∥ `display:none` 切换 ∥ 段窗补偿 ∥ 测试缝 `setSegmentMount`）；机制 ∕ 参数单源 = `docs/batches/2026-09-30-desktop-heap-freeze.md` §2.15 |
| `thincoder-desktop/renderer/views/chat-cards.mjs`（R3c） | **50**（实读 2026-09-29） | 卡构树拆出（在册拆档预案落形——`thincoder-desktop/renderer/views/chat.mjs` 出档） |
| `thincoder-desktop/renderer/views/compress-status.mjs`（R4 新档） | **75**（实读 2026-09-30——前读 74） | 流内压缩状态行（单元素四态；核字典 `compress.*` 取词——零新键） |
| `thincoder-desktop/renderer/chat-cards.css`（「桌面处理流 · VSC 对齐」批拆档产出） | **155**（实读 2026-09-30——门回填；前读 152（实读 2026-09-29）） | 对话流卡族段（池面审批操作区 ∕ 审批卡 ∕ 提问卡 / 计划卡壳） |
| `thincoder-desktop/renderer/chat-fixes.css`（同批拆档产出） | **124**（实读 2026-10-01——**#761 落盘后**（帮助行族三行类）；前读 118（实读 2026-09-29）） | 「对齐第三批」小修族尾段（工具头两态色 ∥ 错误横幅 ∥ 停止痕 / 台账行 / diff 预览 / 文件链接 / 欢迎条 / 压缩状态行） |
| `thincoder-desktop/src/main/file-links.mjs`（对齐第三批新档；切片 3 判域迁入——KD-39 域；原址指针在册） | **34**（实读 2026-09-29） | 验存链接纯函数面（`extractFileLinks(cwd, text)`——路径 token + 盘上存在闸 + 去重 + 封顶；零 electron ⇒ 平 node 直测） |

**行数面机检**：本表迁出后，`checkConfig.lineCounts`（`PROJECT-MANIFEST.json`）读取面 = `docs/desktop/design/PROJECT.md` §4.1（运行根单读）——本表行按同值同步；后续本域新档由落盘批在本表补行（沿 §4.1 纪律）。
**原址指针**：本族各行在 `docs/desktop/design/PROJECT.md` §4.1 已改一行指针（as-of 2026-10-02）。

### 3.2 现有文件改动 · 批块（本域 · 迁自 `PROJECT.md` §4.2——逐字；块内「本档」类回指已按新落点改指）

**本批（desktop-digest-parity · E9 两差消解 · 设计轮 · 2026-09-29 · 台账 #670）行「现行 ⇒ 预期」**（实读 2026-09-29——内容行数口径；机制 ∕ 逐点对表单源 = 批档 `docs/batches/2026-09-29-desktop-digest-parity.md` §2）：

| # | 档 | 现行 ⇒ 预期 | 面 |
|---|---|---|---|
| 1 | `thincoder-desktop/renderer/events-wake.mjs` | **84 ⇒ ≈100**（`onDigest` 多轮化——`start` 追轮 ∕ `cap`·`end` 末轮） | #670 |
| 2 | `thincoder-desktop/renderer/views/chat-model.mjs` | **104 ⇒ ≈106**（`digestOf` 判据——非空轮集） | #670 |
| 3 | `thincoder-desktop/renderer/views/chat-chrome.mjs` | **335 ⇒ ≈350**（多轮行集 ∕ 逐轮原位同步；**与 structure-split-2 同面——串行避让**：先落者为准） | #670 |
| 4 | `thincoder-desktop/renderer/views/chat.mjs` | **299 ⇒ ≈299**（判据调用零改——句收正） | #670 |
| 5 | `thincoder-desktop/renderer/page-read.mjs` | **143 ⇒ ≈152**（`clearDigest` 第四清——终端整清 ∕ 未结末轮保） | #670 |
| 6 | `thincoder-desktop/renderer/chat.css` | **≈327 ⇒ ≈327**（在册句收正——值零改） | #670 |
| 7 | `thincoder-desktop/renderer/events.mjs` | **264 ⇒ 264**（注释级句处置——留存分述句） | #670 |
| 8 | 批内件 | `docs/batches/2026-09-29-desktop-digest-parity.test.mjs`（已建成 · 306 行——归约 ∕ 组树 ∕ 清点三面红→绿；随批留存 · 不进仓套件） | #670 |

**本批（复制面对齐 VSC · 2026-09-29）行「现行 ⇒ 预期」**（实读 2026-09-29——内容行数口径；机制 / 判据单源 = `docs/desktop/design/UI.md` §1「本批注（复制面对齐 VSC · 2026-09-29）」；决策 = `docs/desktop/design/SHELL.md` §1 **KD-43** + 本档 §1 KD-22 收正）：

| 文件 | 现行 ⇒ 预期（构成） | 批 |
|---|---|---|
| `thincoder-desktop/src/main/context-menu.mjs`（已落） | — ⇒ **60**（实读 2026-10-02）（`contextMenuLabels` + `contextMenuTemplate` 两纯函数；零 `electron`） | 本批 |
| `thincoder-desktop/src/main/window.mjs` | **191 ⇒ ≈214**（`context-menu` 落子（`Menu.buildFromTemplate(…).popup({ window })`）+ `loadConfig` 现读 + 档头注） | 本批 |
| `chat-copy.mjs` | **113 ⇒ 删档**（两控件族退场；`blockTextOf` 迁 `renderer/views/chat-text.mjs`） | 本批 |
| `thincoder-desktop/renderer/views/chat-text.mjs` | **126 ⇒ ≈131**（`blockTextOf` 迁入；`copyBlockNode` 两调用点摘除；`data-raw` 注释改述） | 本批 |
| `thincoder-desktop/renderer/views/chat.mjs` | **365 ⇒ ≈361**（`copyBlockNode` 引调三处摘除；**越 300 在册**（365 仍越线）⇒ 处置 = **续期说明**——本批不拆依据 = 摘除型小改（净减 ∕ 非结构改动，不构成拆分窗口）；消解窗口 = 下批触碰该档的批（= 本批之后首个触碰批；触碰时到期——执行拆分 ∕ 上抛二择） | 本批 |
| `thincoder-desktop/renderer/mount-composer.mjs` | **238 ⇒ ≈230**（尾锚 ∕ `writeText` ∕ `tailOf` 摘除——槽形三件 ⇒ 两件） | 本批 |
| `thincoder-desktop/renderer/composer-sync.mjs` | **210 ⇒ ≈188**（`syncLastCopy` 族摘除——`writeText` / `tailOf` deps 随退） | 本批 |
| `thincoder-desktop/renderer/app.mjs` | **276 ⇒ ≈268**（`writeText` 单点供给摘除——消费者归零） | 本批 |
| `thincoder-desktop/renderer/chat-composer.css` | **71 ⇒ ≈55**（两控件族 + `⧉` 字形 + 尾锚规则摘除） | 本批 |
| `thincoder-desktop/renderer/i18n.mjs` | **473 ⇒ ≈482**（实落 482——以盘为准〔实读 2026-09-29〕；净量复算 = 退两键 × 2 语 = −4 行 + 增四键 × 2 语 = +8 行 + 两语注释块 ∕ 链记录行 = +5——合计净 +9（473 ⇒ 482）；键数链随动 = HOST_DICT 合并表 **267 ⇒ 269**（净 +2 键）；**越 300 在册**（482 仍越线）⇒ 处置 = **续期说明**——本批不拆依据 = 键面 ∕ 注块 ∕ 链记录行改动（非结构改动，不构成拆分窗口）· 拆档第二 ∕ 三档已落（`thincoder-desktop/renderer/i18n-views.mjs` ∕ `thincoder-desktop/renderer/i18n-composer.mjs`）；消解窗口 = 下批触碰该档的批（= 本批之后首个触碰批；触碰时到期——执行拆分 ∕ 上抛二择） | 本批 |
| 测试面 | **零改**——全清令 2026-09-28 23:18：**仓套件不写 ∕ 不改 ∕ 不跑；批档本地用例随批留存（不入仓套件）**；验收 = 设计判据句 + 真机走查由父侧闭合 | 本批 |
| `docs/desktop/design/{UI,PROJECT,SHELL,RENDERER,IPC}.md` | 本批设计落定（UI 本批注 + 六处反转句收正；PROJECT.md KD-22 收正 / KD-43 · §4.1 · §4.2 · §6.1 · §7 · §9 · §10 · 变更记录；SHELL §1 树 / §2 行；RENDERER 先例指针重锚；五档档头 D1–D27） | 本批（已落） |

**余量**：零（§6.1 域行 ∥ §7 用例行 ∥ §10 上抛行 已随切片 4（终篇）迁入——见 §4/§5/§6）；`core.css` ∥ `core-markdown.css` 两行 = 切片 3 判入 `docs/desktop/design/UI.md` §4.1（判读在册——视觉映射族）；`file-links.mjs` 行已随切片 3 迁入本档 §3.1（原址指针在册）。

## 4. 验收回指（需求卷条目 → 本域面 · 判据全文——迁自 `PROJECT.md` §6.1 本域行 · as-of 2026-10-02）

| 需求 | 机检判据（点回需求卷） | 验证面 |
|---|---|---|
| **D3** | 发送后收到流式增量事件序列；中断后回合停止且历史保留；错误卡出现且含耗时；长会话渲染 / 回填 / 跟滚三面见 `docs/desktop/design/RENDERER.md` §2 / §3；批 A 落**输入区**（Enter 发送 / Shift+Enter 换行 · 忙态入队——「回合中插入」批收正：受理交宿主任判、消费两时刻 = 步边界注入 ∕ 回合尾续发、本地判忙与回合尾 flush 退场——单源 = 本档 §1 **KD-40**；`docs/desktop/design/UI.md` §1 输入区行）；**可见面修复批修（#458 / #459 / #457）**：用户消息块活流在场（受理即出——`docs/desktop/design/UI.md` §1「本批注（可见面修复 · 四件）」项 2）· 回合尾零流式游标（项 3）· 输入区样式落点与关键尺寸（项 1）；**对齐第三批**：恢复帧次序 / `[stopped]` 痕 / 错误横幅（详情 + 重试）/ turnBreak / 发送后回底——单源 = 本档 §2（对齐第三批 · A8 ∥ A6 ∥ A9 ∥ A7 ∥ A13） | T-DSK4 / T-DSK17 / T-DSK18 / T-DSK19 / T-DSK22 |
| **D5** | 审批三出口（once / always / reject）+ 批审批三按钮皆通；AUTO 与工程模式状态随会话槽往返不丢；**对齐第三批**：审批卡 owner 归属（子代理门）/ diff 预览（相抵①）/ 真置焦执行（F-置焦）——单源 = 本档 §2（对齐第三批 · B1 ∥ C1 ∥ F-置焦） | T-DSK6 / T-DSK21 |
| **D19** | 宿主无关渲染核在册（逐模块判定表 51 档 + 落点 / 加载形）= `docs/render-core/design/RENDER-CORE.md` §1/§3；逐机制对位表 **22 行**在册（§4）；桌面经核呈现（Markdown / 代码块复制 / 工具卡族 / 推理块 / 帧容器 / **文件链接（核 `linkifyPaths` + 宿主验存链 + `file:open`——单源 = 本档 §2（对齐第三批 · C2））**——KD-RC-4）；VSC 接核零回归（C2）；判据 C1–C8 = 核档 §7；**「对齐第二批」扩充消费面**（推理钉底画笔 / 队列标记两导出（`markPending` / `paintLabel`——`planBusyQueued` / `clearPending` 不消费，登记 = `docs/desktop/design/PROJECT.md` §10 **AZ**——留原址）/ 子 agent 块四件直消费——`setStrings` 接线；单源 = 核档 §5 消费面段） | T-DSK35 / T-DSK38 |

**跨档条目（本域半边）**：
- **D13**（复制面 = 核件 Copy 钮唯一（本档 §1 **KD-22** ∥ §2 复制面注项 2）；真机零残留三腿 = §2 复制面注项 3——单源 = `docs/desktop/design/COMPOSER.md` §4）
- **D27**（宿主面 `context-menu.mjs` 两纯函数 / 平 node 直测 + 真机往返——单源 = `docs/desktop/design/PROJECT.md` §6.1（SHELL 无接收节——留原址））
- **D4 / D20 / D28**（挂起 ∥ 消化 ∥ 留档——单源 = `docs/desktop/design/ACTIVITY.md` §5；本档不重载）。

（§6.1 本域行全三条已迁讫；跨档条目列上。）

## 5. 用例（本域 · 全文迁自 `PROJECT.md` §7 涉行 · as-of 2026-10-02）

| 用例 | 场景 | 输入 | 预期输出 | 机检面 / 落点 |
|---|---|---|---|---|
| T-DSK4 | 正常 · 流式与中断 | 发送一条消息 → 中途中断 | 收到增量事件序列；中断后回合停止、已产出内容保留在对话流 | — |
| T-DSK6 | 正常 · 审批三出口 | 触发需审批工具 → 分别回 once / always / reject | 首次执行 / 后续免问 / 拒绝；三态下活动池待审批计数与标签位同步变化 | — |
| T-DSK21 | 正常 · 审批键盘与大 patch | 待审批卡出现 → 键 1 / 2 / 3；另一例 patch 超阈 | 三键 = once / always / reject；初始焦点**目标** = 「拒绝」（**真置焦执行 = 本批落**——帧尾 `focus()` ⇒ `document.activeElement` = 卡内 `[data-autofocus="1"]`；「对齐第三批 · 小修族」F-置焦）；大 patch（核 `diffBig`）= 核卡 `.diff-preview` 全量渲染 + `.view-diff` 唯单径（`diff.path`）留钮走 `file:open`（`apply_patch` 形 ⇒ 钮退场——零死控；端差清算批 #629 收正） | — |
| T-DSK24 | 正常 · 提问作答与计划 | ① 核发 `ev:question` ⇒ 界面出现提问卡；选项 / 自由作答 / 取消各一例 ② 核发 `ev:task`（含 pending / in_progress / done 三态事项）；③ 待作答期按中断键（`msg:interrupt`） | ① 卡含题干 + 给答项 + 作答区；作答 ⇒ `question:respond` 往返 ⇒ **回执 ok 后**卡清除（失败 ⇒ 卡留 + `console.error`）；取消 ⇒ `answer: null`；**待作答期该会话位标含 `approval` 码**（跨会话可见面 = 「不静默等待」兑现），回执处置后清码（**清码判据 = 两族皆清**——单源 = `docs/desktop/design/ACTIVITY.md` §2（标签位集合与优先级）） ② 计划卡逐行 = 标题 + 状态词（排队中 / 运行中 / 完成）；空列表 ⇒ 卡不在场；③ 卡**零回执直摘**（中断 ⇒ 本键各门按取消结算 ⇒ `stopped` 终局 ⇒ 事件面摘本键提问项 + 按卡退场同判据清码；判据 = 终局事件面，非回执——单源 = `docs/desktop/design/RENDERER.md` §1.1 卡面在场与随动条） | — |
| T-DSK35 | 正常 / 边界 · 会话流经核（D19） | 助手块含围栏代码块 / 行内 md / 注入样本（`<script>` 字面）；用户块；推理 `ev:reasoning`；文件链接候选文本 | ① 围栏块 ⇒ `pre.code-block` 在场 + 代码块复制控件在场（点按 ⇒ `clipboard.writeText` 收代码文本）；② 注入样本 ⇒ 字面文本（转义闸）；③ 推理块 = 折叠块（块型 `reasoning`）；④ 文件链接**承载**（验存链 + 核 `linkifyPaths` + `file:open`；单源 = 本档 §2（对齐第三批 · C2）） | 新增用例族（名实施批定；真渲染视觉 = 人工走查 T-DSK21 面） |
| T-DSK37 | 正常 · 会话流经核 + 会话面板元数据（真 Electron） | fixture 家（`{"locale":"en"}` + 会话槽族四档——槽 1 回放历史：围栏块 / 注入样本 / 路径候选 / 推理块） | 块序 = `user/reasoning/assistant/user`（**对齐第三批收正**——恢复帧次序 = 推理 → 正文；单源 = 本档 §2（对齐第三批 · A8））；`pre.code-block` 恰一枚 + 复制钮点按 ⇒ 剪贴板收代码文本；注入样本 = 字面文本 ∧ 零 `script` 节点；推理块 = `details.reasoning-block`；路径候选零 `.file-link` 节点；行元数据段序 = `provider / msgs / updated` ∧ 含 `p1:m1` | 机检面 = 单元测试档惯例（原集成档 `chat-render.test.mjs` 随 2026-09-28 全清重置退场）；断言序单源 = `docs/desktop/design/E2E-TESTING.md` §6 |
| T-DSK42 | 正常 · 小修族（对话流面 · 对齐第三批） | fixture 家（`{"locale":"en"}` + 会话槽族档〔`cwd` = `PROJ`〕——沿 T-DSK32 夹具先例）——**离线可产断言**：工具卡族 / 错误横幅（文 + 重试钮）/ 空态欢迎条 · **离线不可产**（真回合面）：停止痕 · 文件链接 · `techInfo` 详情面 | ① 工具卡头 = 名称 / 参数 / 状态词 / 耗时 / **摘要段**（`read` ⇒ `N lines` 形）在场 ∧ 状态色 = `data-status` 两值（`error` ⇒ `#f14c4c`）；② 停止痕 `[data-stopped]` 在场（`msg:interrupt` ⇒ `stopped` 终局后）且词 = `[stopped]`（en）——**离线不可产**（真回合面）；③ 错误横幅 = 文 + 重试钮在场（末 `user` 块在场 ⇒ 钮在）；`details`（`techInfo`）面 = **离线不可产**（`ev:error` 活径）；④ `no-message` 帧欢迎条 = 抬头 / 文案 / 快捷键行三行 ∧ 文案含 `welcome.heading` 值；⑤ 工具结果含盘上真路径 ⇒ `.file-link[data-path]` 在场 ∧ 点按 ⇒ 零 `pageerror`——**离线不可产**；**离线不可产面 = 人工走查 + 父侧真跑闭合**（D16 义务——零 provider 夹具 ⇒ 真回合不可离线复现） | 机检面 = 单元测试档惯例（原集成档 `align3-face.test.mjs` 随 2026-09-28 全清重置退场——离线可产断言）；断言序单源 = `docs/desktop/design/E2E-TESTING.md` §6；用例号自铸披露 = `docs/desktop/design/PROJECT.md` §10 **BF**（留原址） |

（本域用例全文迁讫（T-DSK4 ∥ 6 ∥ 21 ∥ 24 ∥ 35 ∥ 37 ∥ 42）；T-DSK30 ∥ T-DSK43（附件 ∥ 复制 ∥ 外围混装）与 T-DSK17–19（工艺侧）为跨域 ∕ 他档条目，留 `docs/desktop/design/PROJECT.md` §7 原址。批内件（单元测试档）随批次档留存。）

## 6. 上抛（本域 · 迁自 `PROJECT.md` §10 涉行 · as-of 2026-10-02）

| 行 | 项 | 类型 | 处置建议 |
|---|---|---|---|
| **DD ①** | **桌面二择裁定批上抛（2026-10-01 · 台账 #780 ∥ #782 · 批 `docs/batches/2026-10-01-desktop-pair-decisions.md`）① 词面观察（#780）**——码词「待审批」覆盖提问门 = `docs/desktop/design/UI.md` §1 提问呈现行已声明有意形（同码同词）；如后续收词（如「待处理」）⇒ 需求面笔权（主 agent）另裁 | 上抛（需求档笔权 = 主 agent） | 单源 = 本档 §2 项 2（清码判据）∥ 批档 §2 六（上抛项） |

（§10 本域涉行 = DD①（已迁上；DD②住 `docs/desktop/design/ACTIVITY.md` §7）；余（BF ∥ BZ–CE 等）留 `docs/desktop/design/PROJECT.md` §10 原址。）

## 变更记录

- 2026-10-02：**建档（波 2a · 渲染族迁移）**——自 `docs/desktop/design/PROJECT.md` §2 迁入 **KD-8 ∥ KD-14 ∥ KD-22 ∥ KD-23 ∥ KD-24 ∥ KD-37 ∥ KD-39**（七行逐字；原址各留一行指针）+ 自 `docs/desktop/design/UI.md` §1 迁入本域批注块（「对齐第三批」A 十二项 ∥ B 三项 ∥ C 两项 ∥ F 一件 ∥ D 分项 ∥ R12 ∥ 流内竖向间距 ∥ 复制面对齐 VSC——逐项逐字；原址各留一行指针）+ §3.1 两条 `§4.1` 行随迁（值按届盘实读收正：`chat-chrome.mjs` **250** ∥ `page-read.mjs` **258**——两销项）。**余量未迁**（§2 五项 UI 块 ∥ §3.2 族行余量 ∥ §4/§5/§6 域行）——随「2c 前置步 · 文件账分片轮」承接（本批 §2 记录在册）。零新语义（搬迁 ∥ 值收正）。
- 2026-10-02（**波 2a 补轮 · eng-designer**）：**行宽回线**——本档 6 条超 300 字符行按语义边界折行（∥ 分隔处 ∥ 句读处）；零语义改。

- 2026-10-02（**文档体系重组批（DOC-MIGRATION）· 2c 前置步 · 文件账分片轮（续 · #35）· eng-designer**——承批档 `docs/batches/2026-10-02-doc-structure-reorg.md` §2 · 台账 #813）：**§3.1 扩行**（本域族行 **22** 行——自 `PROJECT.md` §4.1 逐字迁入，含 `question` / `plan` / `goal` 卡面三行 ∥ `chat.css` ∥ `mount-cards.mjs` 等；原址各改一行指针）∥ **§3.2 新立**：批块 **2 块**（desktop-digest-parity ∥ 复制面对齐 VSC——迁自 §4.2；块内「本档」类回指按新落点改指）。**零新语义**（迁移 ∥ 指针）。
- 2026-10-02（**文档体系重组批（DOC-MIGRATION）· 2c 前置步 · 文件账分片轮（切片 3 · 余量收尾）· eng-designer**——承批档 `docs/batches/2026-10-02-doc-structure-reorg.md` §2 · 台账 #813）：**§3.1 补行 1**（`file-links.mjs`——KD-39 域；自 `docs/desktop/design/PROJECT.md` §4.1 逐字迁入；原址改一行指针）；余量句随动（`core.css` ∥ `core-markdown.css` = 判入 `docs/desktop/design/UI.md` §4.1——判读在册）。**零新语义**（迁移 ∥ 指针）。
- 2026-10-02（**文档体系重组批（DOC-MIGRATION）· 2c 前置步 · 文件账分片轮（切片 4 · 终篇）· eng-designer**——承批档 `docs/batches/2026-10-02-doc-structure-reorg.md` §2 · 台账 #813）：**§4/§5/§6 域行全文迁讫**——§4 收 D3 ∥ D5 ∥ D19 三行全文（迁自 `docs/desktop/design/PROJECT.md` §6.1；原址各改一行指针）+ 跨档条目折叠列（D13 ∥ D27 ∥ D4/D20/D28——单源指向）∥ §5 收 T-DSK4 ∥ 6 ∥ 21 ∥ 24 ∥ 35 ∥ 37 ∥ 42 七行全文（迁自 §7；行内回指按本档落点改指）∥ §6 收 DD① 全文（迁自 §10）。**零新语义**（迁移 ∥ 指针）。
- 2026-10-02（**文档体系重组批（DOC-MIGRATION）· 波 3 · 终扫轮 · eng-designer**——承批档 `docs/batches/2026-10-02-doc-structure-reorg.md` §2 · 台账 #813）：需求侧活面指针收正（需求分卷后形态——「需求档 §4」类表述 ⇒「需求卷」（查卷口 = `docs/desktop/requirements/PROJECT.md` §4 **D 表索引**））；记录面 ∥ as-of 零追改。**零新语义**（指针）。
- 2026-10-03（**无效渠道态逻辑归一（provider-invalid-unify）批 · 实施后回填轮 · eng-designer**——承批档 `docs/batches/2026-10-03-provider-invalid-unify.md` §2 ∥ §5 · 台账 #841）：§3.1 `page-read.mjs` 行走读齐平（**278 ⇒ 280**——页读回执 `providerState` 落切片）。**零新语义**（读数）。明细 = 批档 §2 回填轮块。
- 2026-10-02（**记录形残项批（#794）· 文件账行数随动 · eng-designer**——承批档 `docs/batches/2026-10-02-record-shape-residuals.md` §2 随动表）：§3.1 `thincoder-desktop/renderer/page-read.mjs` 行数收正 **258 ⇒ 278**（#794 落盘后实读）。**零新语义**（行数随实读）。
- 2026-10-02（**文档清账轮 · 执行轮 4（render-core + 桌面轻段）· eng-designer**——承 `docs/batches/2026-10-02-doc-settlement-round.md` §2.3 · 台账 #806）：§3.1 预案名 R3 裸名化（`chrome-denoise.css`——未落预案，去目录段）。**零新语义**。