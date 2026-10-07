# 2026-10-07 · browser 工具异步化 + 全动作硬超时（挂页不再吊死 agent）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-07 · 来源 = 用户 2026-10-07 19:41 投诉（浏览器工具同步阻塞/吊死 agent）+ 19:43 裁「修彻底」（满量先行——不做止血半量）。
> 台账 = #1045（core · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：进行中（设计评审 pass（🔴0）· 修复轮 11/11 落 · 已代签 · 实施 A 舱已交（9/9 绿 · 评审 clean）· B 舱接棒在跑 · 上抛 3 项待回填轮（session 493 余 7 ∥ 开启段句面））
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 来源与裁定（父侧 · 2026-10-07 19:4x）

**用户原话（逐字）**：「你他妈的那个浏览器工具咋做成同步的啊！你傻逼吗！我们这儿不都是异步的吗？一个出问题就把agent吊死了，你咋想得啊！」（19:41）∥「修彻底，我不需要你现止什么血。」（19:43）。

**裁定**：**满量形态**（承用户「满量先行」铁律）——不做止血半量：动作族全量硬超时 + 异步通道 + 挂起可诊断/可取消，一轮做透。

### 1.2 病证实录（钉子 · 会话文件实证）

- **挂死点**：2026-10-07 19:37:46 `navigate https://passport.jd.com/new/login.aspx`——**调用无返回**（该消息之后无任何 tool result；19:41 用户重启机器收场）。
- 同 URL 在 19:34:40 曾正常返回（≈2.2s）⇒ 触发条件在页面/网络侧（登录页存在挂起型在飞资源），**非必现**。
- 现场链条：JD 反爬连环（搜索风控墙 ∥ 移动版 403 ∥ 百度图形码）——其中 `wait` 的 12s 超时帽正常生效（工具本身其余动作返回正常）；**唯独末次 navigate 无界悬挂**。

### 1.3 代码侧初核（父侧实测 · file:line）

- `browser/actions.mjs:35-43`：navigate = `h.call("Page.navigate")` + `h.waitForReady()`——**无全局硬帽**。
- `browser/cdp.mjs:20-21,41,68`：`_abortAll` 仅在 WS close/error 时触发；**单条命令悬挂无超时**。
- 局部帽存在但只盖局部：`wait`（`actions.mjs:117-118`，30s/120s）∥ `launch.mjs:104` 启动帽 ∥ `session.mjs:291` `once()` 10s。
- **无异步逃生**：对比 `bash-async.mjs`（281 行——池/结算/杀单点 + ack/状态行注入）——浏览器全同步，一挂 = 整轮吊死。

### 1.4 边界（设计轮细化）

- 修面 = 浏览器工具（动作族超时 ∥ 异步通道 ∥ 诊断/取消）；**不**重选 CDP 机制 ∥ **不**动其他工具 ∥ 异步形态复用既有模式（bash async 池/结算），不自创第二套。
- 需求档增改（`docs/core/requirements/BROWSER-TOOL.md`）= 父侧笔——设计轮给建议文本，父侧落。

**设计轮已派**（eng-designer · 本批档即任务书）。

### 1.5 用户更正（19:46）——挂因重定 + 新增设计面

**用户原话（逐字）**：「那次是你开的浏览器有问题被我关了，你不能假定你开的就一直在。」

**更正**：§1.2 的「触发条件在页面/网络侧」推断**作废**——实际挂因 = **用户关闭了工具自启的浏览器窗口**（该窗口当时有问题，被用户关掉）；挂起中的调用仍按「会话仍在」假定等待 ⇒ 无界悬挂。**根因类别 = 外部关闭不可感知**（会话状态自愈缺口），非页面条件。

**新增设计面（必做）**：工具**不得假定自启浏览器常驻**——① 外部关闭/进程消失 ⇒ 即时探测（进程存活 ∥ CDP WS 心跳）；② 挂起调用遇外部关闭 ⇒ 即时显式失败（可重试），不悬挂；③ 会话状态自愈（下一次调用可干净重开）；④ 异步化后：外部关闭须能结算在飞动作（不吞、不呆等）。

### 1.6 认知面缺口（考题副产物 · 19:49）

**用户观察（逐字）**：「不过，我还试出来你似乎不太知道现在能用浏览器。」

**解读**：本次考题暴露的不止工具健壮性，还有**用法认知**——模型（本次执行者）对现实环境无预案：反爬墙/登录门当头一棒 ∥ 动作连环快敲（节奏失控）∥ 把工具自启会话当常驻（§1.5）——「有工具但不会用」。

**裁**：纳入本批设计面（文档面小件）——`tool-docs/browser.md`（全端共享描述单点）增「现实环境实践」段：反爬墙/登录门识别 ∥ 动作节奏 ∥ 会话假设（不假定常驻）∥ 何时弃用转其他路（fetch ∥ 生成链接 ∥ 请用户点）。若设计轮判超界 ⇒ 作上抛项报父侧另裁。

### 1.7 上抛处置与落地（主 agent · 2026-10-07 19:5x · 核验通过）

- **需求档增补（上抛 1）**：**已落笔**（父侧）——`docs/core/requirements/BROWSER-TOOL.md` 新增「健壮性轮」块 **F-BT16–F-BT19** + **N-BT10**（头注计数随动 F-BT1–19 / N-BT1–10；变更记录已追行）。文本 = §2.8 建议文本逐条采用。
- **prompt 面增改（上抛 2）**：认——**文本随实施轮父侧笔落**（骨架 = §2.8；`tool-docs/{browser,wait_for,process}.md`，落笔与核验在实施轮）。
- **命名（上抛 3）**：**认**——`agent-tools/browser-async.mjs` ∥ `browser/queue.mjs`（族名对齐；拆因成立）。
- **越批登记（上抛 4）**：**已落账**——台账 #1047（VSC 自持 async-discard 一致性评估 · trigger 条件）。
- **既有面发现（上抛 5）**：**已就地修**——`tool-docs/bash.md:15` 参数清单补 `async` 行（父侧直接执行 · 单笔可 revert）。
- 核验记录：设计档 §2.9–§2.11 与批档 §2 逐条吻合（抽读）；工作树 = 两设计档在盘、零产品码冒触。
- 停点：设计评审点火（评审子代理——两设计档 + 需求档 + 本档）。

### 1.8 修复轮核验 ∥ 附察处置 ∥ prompt 面文本（主 agent · 2026-10-07 20:2x）

**A. 修复轮核验（抽读实读——全在盘）**：动作数 16（设计 `:237` ∥ KD-24 `:402`；记录 `:140` ∥ `:184` ∥ `:200` 同族）∥ 用例续编 T27–T42 ∥ S19–S22（设计 §7 `:432–:436` ∥ §8 落点列；记录 `:173–:174`/`:184–:188`）∥ §7 五行去「建议编号」限定 ∥ 档头 `:4` 与 §7 标题 `:404` 计数 ∥ §5「>300 档位处置」段（`:367–:368`）∥ KD-20 详版改述（`:398`——「空闲 >5s 时含一次入口心跳」）∥ §2.9 开启段中止（`:212`）∥ 队列等待计入预算 + `queue wait` 步名（`:191` ∥ `:210`）∥ §2.11 与 bash 异句（`:237`）∥ 墙钟断言改确定性判据（记录 `:185`/`:186` ∥ 设计 `:433`/`:434`）∥ Δ 取 +1/±1（记录 `:172`）。**结论：11/11 成立、零新语义（抽读 12 处）。**

**B. 附察处置**：① 设计 §7 F-BT16 无「17」实例——属实零改；② 记录 §2.1「（建议）」×5 ∥ §2.7「（待裁）」= 设计轮残留标记——**效力终了**（需求档已落；处置以 §1.7/§1.8 为准），随实施后回填轮同拍清（设计面）；③ doc-check 他档余量（悬空 11 ∥ 行宽 28）——**已落账**（非本批面）。

**C. prompt 面文本（主 agent 笔——实施轮逐字落地 · 零改写）**：

〔1〕`tool-docs/browser.md`：参数段（`clipboard` 行后）+1 行：
> - async: run this action in the background (default false) — returns an ack at once (`browser#<N> started (running) — <action> <subject>`); the finished result arrives later as a system reminder summary. Use `wait_for "browser id:N done"` to wait; `process {action:"kill", id:N}` to cancel. Depth-0 only.

〔2〕`tool-docs/browser.md`：Notes 段（`Permission:` 行后）+2 行：
> - Timeouts are explicit: every action returns within a hard budget (navigate 45s; most actions 30s; type/snapshot 15s; wait = its `timeoutMs` + 15s overhead; `timeoutMs` overrides any action, cap 120s). A timeout reads `Error: <action> timed out after <ms>ms (stuck in <step>)` — retry, or run `close` to reset the session.
> - Session loss is explicit too: if the browser is closed externally while an action runs, it fails at once with `closed externally`; the next action opens a fresh session automatically (page state lost, profile/login kept — the receipt notes it). Do not assume the self-started browser stays alive between calls.

〔3〕`tool-docs/browser.md`：文末（`CLI, VS Code and desktop share…` 行**前**）新增段（≈9 行）：
> **Real-world practice** — this tool drives a fresh automated browser; real sites may fight back:
> - Anti-bot walls / login gates: some sites block or challenge automated browsers — expect missing content, CAPTCHAs, or login redirects. Don't hammer a wall: report what you saw (URL + wall type) instead of blind retries.
> - Pacing: after a click that navigates, `snapshot` again before the next action; space out actions on flaky pages; re-snapshot instead of reusing stale refs.
> - Session assumptions: the session may be closed externally or timed out — never assume it is alive; on `closed externally`, just run the action again (fresh session, login kept).
> - When not to use it: static page / API → `fetch`; a link needing no interaction → just produce the URL; a step needing a human (2FA, payment) → ask the user to do it in a headed session.

〔4〕`tool-docs/wait_for.md`：条件枚举（`bash id:N done` 行后）+1 行：
>   - `browser id:N done` — a background browser task N (the id from the ack, `browser#N`) has settled — finished, or already left the pool (nothing left to wait on)

〔5〕`tool-docs/process.md`：`id` 行改写（±1）：
> - id: (kill) background task id — a `bash#N` (bash async ack) or `browser#N` (browser async ack): bash ⇒ its process tree is terminated; browser ⇒ a queued task is dropped, a running one is aborted (the browser itself is not killed); either way the entry leaves the pool and no digest will arrive (a bash task's log so far stays readable).

Notes 行随动：「an unknown or already-finished **bash** task id」⇒ 去「bash」。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（eng-designer · 2026-10-07 · 硬超时+外部关闭自愈+异步通道+用法认知（E1–E5））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目（覆盖 —— 与需求档 / 设计档三联同源）

| # | 条目 | 对位（需求档增补 = 父侧笔；建议文本见 2.8） |
|---|---|---|
| E1 | **动作族全量硬超时**：任一动作（含会话自启 ∥ CDP 命令 ∥ 轮询等待 ∥ 关闭）在预算内返回；超时 = 显式失败（错误句携卡点步名）+ 可重试 | F-BT16（建议） |
| E2 | **外部关闭可感知 + 自愈**：不假定自启浏览器常驻——进程事件 ∥ 连接事件 ∥ 入口探针；在飞动作即时显式失败（不呆等）；下一次调用干净重开（注记可见）；会话不中毒 | F-BT17（建议） |
| E3 | **异步通道**：`async:true` ⇒ ack 即返 ⇒ 池化排队执行 ⇒ 摘要注入；`wait_for` 可等；`process` 可杀；终态必达（不吞） | F-BT18（建议） |
| E4 | **挂起可诊断/可取消**：错误句携卡点步名；异步任务终态必达摘要或显式取消确认 | N-BT10（建议） |
| E5 | **用法认知（用户 19:49 增补）**：描述面（`tool-docs/browser.md`）增「现实环境实践」段——反爬墙/登录门识别 ∥ 动作节奏（连击降速重取快照）∥ 会话假设（不假定常驻）∥ 何时弃用转其他路（fetch ∥ 生成链接 ∥ 请用户点） | F-BT19（建议） |

**不在本批**：不重选 CDP 机制 ∥ 不动其他工具 ∥ 不建第二套异步机制（复用 bash async 池/结算面）∥ 不改门/审批本体 ∥ VSC 端自持副本不动 ∥ **需求档与 prompt 面（tool-docs）由本设计给建议文本、不落笔**（内容权 = 主 agent——见 2.7 上抛项）。

### 2.2 现状定位表（挂点 ∥ 装配面 ∥ 异步先例整合点 —— 全 file:line）

**挂点（无界等待面——本批修面）**

| 面 | 坐标 | 现状 |
|---|---|---|
| navigate 无帽 | `browser/actions.mjs:35-43`（`Page.navigate` + `waitForReady`——`h.call`/`evalRaw` 无超时） | 挂死实录点（§1.2/§1.5） |
| CDP 单命令无超时 | `browser/cdp.mjs:47-55`（`call` 无帽）∥ `:20-21` ∥ `:41-44`（`_abortAll` 仅 WS close/error 触发） | 单条命令可无界在飞 |
| `Runtime.evaluate` 等待型表达式 | `browser/session.mjs:160-165`（`evalRaw`——`awaitPromise:true`） | 文档面已自述（`tool-docs/browser.md:14`：「a promise that never settles blocks the call」） |
| 会话开启面 | `browser/cdp.mjs:78-89`（`connectCdp` 无 open 超时）∥ `:92-101`（`/json/new` fetch 无超时）∥ `browser/launch.mjs:104-132`（12s 帽——已有，保留） | 半死浏览器挂在 connect/fetch |
| 会话态不复位（中毒） | `browser/session.mjs:97-117`（`ensureSession` 只查 `state.cdp` 非空即早返）∥ `:128-151`（`closeSession` 是唯一复位径） | 外部关闭后 `state.cdp` 仍在 ⇒ 其后每次动作都挂（19:37 实录的整轮吊死面） |
| 轮询循环 | `session.mjs:180-187`（`waitForReady` 10s 帽）∥ `:189-197`（`waitForUrlChange` 1s）∥ `actions.mjs:114-129`（`wait` 30s/120s）∥ `input-actions.mjs:77-88`（`settleScroll` 800ms） | 局部帽存在，但内层 `evalRaw` 无帽 ⇒ 帽失效 |
| 无异步逃生 | 浏览器全同步（对照 `agent-tools/bash-async.mjs:100-187` 池/结算/杀三件套） | 一挂 = 整轮吊死 |
| 外部关闭感知缺位 | `session.mjs:104-108`（只存 child 引用——无 exit 监听）∥ `cdp.mjs:20-21`（拒在飞命令但**不复位会话态**） | 挂因重定（§1.5）：外部关窗不可感知 |

**装配面**

| 面 | 坐标 |
|---|---|
| 工具面 | `thincoder-core/tools/browser.mjs`（schema `:89-128` · 校验 `:34-87` · execute `:137-145`） |
| 注册面 | `thincoder-core/tools/index.mjs`（`builtinTools` 静态表——本批零改） |
| 描述面（prompt——主 agent 权） | `thincoder-core/tool-docs/browser.md`（40 行）∥ `wait_for.md`（24）∥ `process.md`（15） |
| 引擎面 | `thincoder-core/browser/{actions,session,cdp,launch,snapshot,input-actions,clipboard,input}.mjs` |
| 审批面 | `thincoder-core/agent/dispatch-gates.mjs`（`isReadonlyAction` 钩子——本批零改：分类不随 `async` 变） |
| 子代面 | `thincoder-core/agent/helpers.mjs:381-389`（`excludeSubagentTools` 删参先例） |

**异步先例整合点（复用对象 = bg 族——逐点坐标）**

| 面 | bg 先例坐标 | 本批落点 |
|---|---|---|
| 池 accessor | `agent-tools/async-settle.mjs:118-122`（role → 字段） | +`role==="browser"` → `_browserTasks` |
| 停靠 ∥ 墓碑 ∥ 唤醒 | `:129-135`（`parkAsyncPending`）∥ `:74-84`（`writeTombstone`）∥ `:323-326`（`wakeAsyncWaiters`） | 同式复用（**恒停靠**——bg 同款） |
| 注入分发 | `agent-tools/subagent-async.mjs:367-370`（role `"bg"` → `injectBgResult`） | +role `"browser"` → `injectBrowserResult` |
| 取号 ∥ 令牌 ∥ 键守卫 | `agent-tools/subagent-scheduler.mjs:405-421`（扫描域含 `_bgTasks`）∥ `:431-434`（`consumeSubagentToken`） | +`_browserTasks` 入扫描域 |
| 中止收尾 | `agent-tools/async-discard.mjs:142-152`（`BG_SPEC`）∥ `:184-186`（导出）∥ 接线 `agent/run-stages.mjs:214-216` ∥ `agent/suspension.mjs:131-134` | +`BROWSER_SPEC`（dispose = abort 在飞）+ 两接线点 |
| 挂起活度 | `agent/suspension.mjs:63-70`（`poolLive` 含 `_bgTasks`） | +`_browserTasks`（在途 = live） |
| wait_for | `tools/ops.mjs:166-178`（条件解析）∥ `:266-273`（判据）∥ `:296`（描述枚举） | +`browser id:N done` |
| kill | `tools/ops.mjs:86-100`（`executeKill` id 靶） | id 路由：先 bg 后 browser（合并错误句） |
| 子代删参 | `agent/helpers.mjs:381-389`（`bash` 的 `async` 参删） | 条件扩至 `browser` |
| 帽值 | `agent-tools/bash-async.mjs:49`（`BG_TASK_MAX=4`） | `BROWSER_TASK_MAX=4`（同源对齐） |

### 2.3 机制设计（四块 —— 详版收编 `docs/core/design/BROWSER-TOOL.md` §2.9–§2.11 ∥ §6 KD-18–KD-24）

**① 硬超时 = 单时钟（每动作预算）+ 三层帽**

- 下降口 = 动作预算：入队即记 deadline；到点 ⇒ 动作控制器 `abort(超时因由)`。
- 工具面错误句：`Error: <action> timed out after <ms>ms (stuck in <步名>) — retry the action, or run \`close\` to reset the session`（可机检：含 `timed out after` + `(stuck in `）。
- 预算表（新档 `browser/queue.mjs` 导出常量——机检面）：`navigate` 45s ∥ `click`/`evaluate`/`screenshot`/`close`/`press`/`hover`/`wheel`/`mouse`/`drag`/`touch`/`insert`/`clipboard` 30s ∥ `type`/`snapshot` 15s ∥ `wait` = 谓词帽（既有 `timeoutMs`：缺省 30s · 上限 120s）+ 15s 余量；override = `timeoutMs` 参（各动作可调，硬上限 120s；wait 语义不变）。
- 三族等待全帽：**CDP 调用**（动作内 = 控制器信号，abort 即拒；动作外显式帽 = `Page/Runtime/Network.enable` 10s ∥ `Browser.close` 3s ∥ 健康探针 2s；兜底 = `cdp.call` 缺省帽 15s）∥ **会话开启/关闭路径**（`connectCdp` open 帽 10s ∥ `/json/new` fetch 帽 5s ∥ `launchBrowser` 12s 既有 ∥ `closeSession` 等待 3s + 杀树兜底）∥ **轮询循环**（既有局部帽保留；内层 `evalRaw`/`call` 随控制器 ⇒ 帽重新有效）。
- 取消与超时共用同一控制器（错误句分形：`cancelled` ∥ `timed out`）；**abort 后一切后续调用快速失败**（清理路径不得再起命令——防僵尸命令与下一动作交错）。

**② 会话健康与自愈（外部关闭不可感知 ⇒ 可感知）**

- 感知三源：① `state.child` 的 `exit`/`error` 事件（外部关窗/杀进程——即时，新增监听）② CDP WS `onclose`/`onerror`（连接断——即时；`cdp.mjs` 现有回调面补会话订阅，拒命令之外**复位会话态**）③ 动作入口探针（`ensureSession`：子进程存活 ∧ 连接未关，恒检（零成本）；距上次成功 CDP 活动 >5s 才做心跳 `Browser.getVersion`（帽 2s）——覆盖半死连接；不做常驻心跳定时器，理由 = 检测延迟只在「在飞」有意义，而「在飞」已由 ① ② + 预算覆盖）。
- 处置单点 `failSession(因由)`：拒在飞命令（同一因由实例）⇒ 态复位（cdp ∥ child ∥ 引用表 ∥ 网络计数）⇒ 释放 profile 锁（子进程仍活 ⇒ 杀树兜底）⇒ 置重开注记。不调 `Browser.close`、不等自退（连接 ∥ 进程已死）。
- 在飞动作：同因由拒绝 ⇒ 回执 `Error: the browser session was closed externally (<因由>) — run the action again to reopen a fresh session`（显式、可重试；**不做透明重试**——页面态已丢，静默重放会掩盖事实）。
- 自愈：下一次动作照常 `ensureSession` ⇒ 干净重开（同 profile ⇒ 登录态保留）；重开后**第一条回执**尾行注记 `[note: the previous browser session was closed externally — a fresh session was opened (page state lost; profile/login kept)]`（置位一次，发出即清）。
- 异步在飞遇关闭：同因由结算 ⇒ 摘要 `failed: …`（**不吞**）；队列中未启动条目 ⇒ 自愈重开后照跑（**不呆等**；其回执/摘要携注记）。

**③ 异步通道（复用 bash async 池/结算面——零第二套机制）**

- 形态：`async:true`（depth-0 专项，schema 删参 + 运行期第二道——bash 双线先例）⇒ ack `browser#<N> started (running) — <action> <subject>` ⇒ **池化排队执行**（后台动作仍走同一串行队列——单页不引入并发）⇒ 结算 ⇒ 摘要 `[System reminder: background browser#<N> finished — <action> <subject> (<ok> ∥ <failed: …>, <s>s)]` + 回执正文（escapeXml）；取消 ⇒ 无摘要（墓碑 + 杀点确认即凭据）。
- 池：`_browserTasks`（角色 `"browser"`；帽 `BROWSER_TASK_MAX=4`，第 5 条显式拒）；结算**恒停靠** `_pendingAsyncResults` + `wakeAsyncWaiters`（bg 同式——消化轮注入）。
- 可异步动作 = **全 16 动作统一**（零二次分类；对瞬时动作无意义但统一允许）。
- 门：审批门在**起跑调用**处照常（异步 ≠ 免审；planMode/批量语义零变）。
- 取消：`process action=kill id:N`（id 路由先 bg 后 browser）——queued ⇒ 丢队（从未运行）；running ⇒ abort（动作展开）⇒ 结算 cancelled（墓碑 `cancelled`）；重复幂等。**不杀浏览器**（重置会话经 `close`——保持「杀 ⟺ 控制器已中止」不变式）。
- 收尾：Stop ∥ 会话中止 ⇒ `discardAbortedBrowserTasks` 逐条 abort + 墓碑 `discarded` + 出池；Ctrl+I 豁免（池保留）。
- 等待：`wait_for "browser id:N done"`（池内 done ∥ 出池即 done——bg 同款判据）。

**④ 冻结窗与并发会话关系**

- 并发：单会话/进程（KD-5）不破——异步不新增浏览器实例、不新增并发页面动作；多 agent（主 ∥ 子代）共用同一会话与同一队列（语义零变）。
- D5 冻结窗：设计档本轮一次性收编，评审窗内零改（D5）。
- 空闲自动关（KD-8）与外部关闭同属「会话消失」——处置同 ②；空闲关（自方行为）**不**置重开注记（免噪音），外部关闭置注记。

### 2.4 受影响文件与测试面（现行行数 = 2026-10-07 实读）

| 文件 | 现行 | Δ 预估（⇒ ≈） | 说明 |
|---|---|---|---|
| `thincoder-core/browser/queue.mjs`（新档） | 新档 | ≈110 | 串行队列 ∥ 动作预算表 ∥ 动作控制器（超时/取消单点）∥ 步名跟踪 ∥ abort 快速失败 |
| `thincoder-core/browser/session.mjs` | 355 | +≈55 ⇒ ≈410 | 会话健康（探针 ∥ `failSession` ∥ 自愈注记）∥ 队列接线 ∥ 步名（<500 硬限内） |
| `thincoder-core/browser/cdp.mjs` | 102 | +≈35 ⇒ ≈137 | 命令缺省帽 15s ∥ 断连回调 ∥ `connectCdp` 帽 10s ∥ `/json/new` 帽 5s |
| `thincoder-core/browser/actions.mjs` | 161 | +≈12 ⇒ ≈173 | 步名标注 ∥ wait 余量口径 |
| `thincoder-core/browser/input-actions.mjs` | 197 | +≈6 ⇒ ≈203 | `settleScroll` / html5 拦截步名 |
| `thincoder-core/agent-tools/browser-async.mjs`（新档） | 新档 | ≈180 | 池 ∥ 起跑 ∥ 结算 ∥ 注入 ∥ 杀单点 ∥ wait 判据 ∥ subject 标签 |
| `thincoder-core/tools/browser.mjs` | 147 | +≈20 ⇒ ≈167 | `async` 参 ∥ `timeoutMs` 描述收正 ∥ depth 第二道 ∥ 起跑动态 import |
| `thincoder-core/tools/ops.mjs` | 331 | +≈18 ⇒ ≈349 | kill id 路由（bg→browser）∥ wait_for 条件 `browser id:N done` |
| `thincoder-core/agent/helpers.mjs` | 490 | +≈2 ⇒ ≈492 | `excludeSubagentTools` 删参面覆盖 `browser` |
| `thincoder-core/agent/suspension.mjs` | 349 | +≈5 ⇒ ≈354 | `poolLive` +`_browserTasks` ∥ 中止收尾调用 |
| `thincoder-core/agent/run-stages.mjs` | 294 | +≈2 ⇒ ≈296 | 回合尾收尾调用 |
| `thincoder-core/agent-tools/async-settle.mjs` | 327 | +≈2 ⇒ ≈329 | `getAsyncPool` role 分支 |
| `thincoder-core/agent-tools/async-discard.mjs` | 187 | +≈22 ⇒ ≈209 | `BROWSER_SPEC` ∥ 导出 |
| `thincoder-core/agent-tools/subagent-async.mjs` | 474 | +≈5 ⇒ ≈479 | 注入分发分支（压 500 硬限——零余量，**须保 ≤±5**） |
| `thincoder-core/agent-tools/subagent-scheduler.mjs` | 448 | +≈1 ⇒ ≈449 | 取号扫描 +池 |
| `thincoder-core/tool-docs/browser.md`（**prompt 面——建议文本入 2.8，落笔 = 主 agent/eng-coder**） | 40 | +≈14 ⇒ ≈54 | `async` ∥ 超时/外部关闭语义 ∥ **「现实环境实践」段（E5）** |
| `thincoder-core/tool-docs/{wait_for,process}.md`（同上） | 24 / 15 | +1 / ±1 | 条件枚举 ∥ kill 靶面 |
| `docs/batches/2026-10-07-browser-async-fix.test.mjs`（新档） | 新档 | ≈320 | 机检单测 T27–T42（点名见 2.5——假传输 ∥ 假子进程事件 ∥ 零真实浏览器） |
| `docs/batches/2026-10-07-browser-async-fix.smoke.mjs`（新档） | 新档 | ≈180 | 真 Edge 冒烟：S19 硬超时（永不响应本地服务）∥ S20 关闭后自愈重开 ∥ S21 异步 ack+摘要 ∥ S22 kill |
| `docs/core/design/BROWSER-TOOL.md` | 434 | +≈120 ⇒ ≈555 | 本设计收编（§2.9–§2.11 新增 ∥ §5 家底收正 ∥ §6/§7/§8/§9/§10 随动） |
| `docs/core/requirements/BROWSER-TOOL.md` | 76 | +≈18 | **父侧笔**（建议文本见 2.8） |

拆分决定：`session.mjs`（355）若直纳队列+健康 ⇒ ≈500 压硬限 ⇒ **拆出 `browser/queue.mjs`**（域界 = 「调度策略（预算/控制器/步名）」∥「会话机制（生命周期/原语/健康）」）。`agent-tools/browser-async.mjs` 命名对齐族（bash-async/subagent-async/advisor-async）——见 2.7 上抛 3。

### 2.5 验收对照（回指 2.1 条目 —— 全机检点名）

| 条目 | 判据（机检） | 用例落点 |
|---|---|---|
| E1 | ① 挂死型假传输 ⇒ 全 16 动作各自在预算（注入 `timeoutMs:150`）内拒绝，错误句含 `timed out after` + `(stuck in `；② `ACTION_BUDGETS` 覆盖 `BROWSER_ACTIONS` 全体；③ `connectCdp`/`/json/new`/`cdp.call` 缺省帽各自有界（小值注入）；④ 旧两测试档全绿（回执文法零变 ∥ 队列序保持） | 单测 T27–T30 · 冒烟 S19 |
| E2 | ① 假 WS close ⇒ 在飞动作即时拒（下一事件循环内——确定性判据，非墙钟界），错误句明示外部关闭 + 重试引导；② 假 child `exit` 事件 ⇒ 同判；③ 死会话后下一动作 ⇒ open 计数 +1（重开）+ 回执尾行注记；再下一动作 **无**注记；④ 探针三检各自短路路径 | 单测 T31–T33 · 冒烟 S20 · 走查 W1 |
| E3 | ① ack 即时返回（`browser#N started (running)`）且调用方未被动作阻塞；② 池 `_browserTasks` 含条目；③ 结算 ⇒ 出池 + `_pendingAsyncResults` + 摘要文法（ok ∥ failed）；④ kill：queued（执行计数 0）∥ running（即时展开——下一事件循环内，非墙钟界）∥ 幂等；⑤ 第 5 条起跑显式拒；⑥ depth>0 运行期拒 + 子代 schema 无 `async` 参 | 单测 T34–T39 · 冒烟 S21/S22 |
| E4 | ① 超时错误句携在飞 CDP 方法名（如 `Runtime.evaluate`）∥ 显式阶段名（如 `waitForReady`）；② kill/Stop 终态有墓碑；③ 外部关闭在飞 ⇒ 摘要 `failed:` 必达 | 单测 T30 · T38 · T40/T41 |
| E5 | 描述档（`tool-docs/browser.md`）含「现实环境实践」段四小节（反爬墙/登录门 ∥ 节奏 ∥ 会话假设 ∥ 弃用转路）——对表 grep（prompt 面，落笔后生效） | 单测 T42（文本面 grep——落笔件） |

### 2.6 关键决策（KD-18–KD-24 —— 详版入设计档 §6）

| # | 决策 | 理由（一句话） | 否决备选 |
|---|---|---|---|
| KD-18 | 超时 = **单时钟动作预算**（表）+ 三层帽，非逐命令独立帽 | 组合动作（导航=命令+轮询+快照）逐命令帽拼不出总界；单时钟可解释、可机检、错误句能指名卡点 | 仅 CDP 层帽（轮询循环无帽）· 仅外层 Promise.race 不 abort（僵尸命令继续穿插） |
| KD-19 | 超时 ∥ 取消共用同一动作控制器 | 一个机制两个因由，错误句分形；abort 后调用快速失败 ⇒ 无僵尸命令 | 两套机制（分叉风险） |
| KD-20 | 外部关闭感知 = 进程事件 ∥ WS 事件 ∥ 入口探针（+空闲心跳），**不做常驻心跳定时器** | 延迟只在「在飞」有意义——在飞面已被事件 + 预算覆盖；常驻定时器只添唤醒成本 | 仅探针（在飞瞬间感知不到）· 仅事件（半死连接漏网）· 常驻心跳（成本零收益） |
| KD-21 | 外部关闭 ⇒ **显式失败 + 下一次自愈**，不做透明重试 | 页面态已丢——静默重放会掩盖事实；显式失败给了模型决策点 | 透明重试（语义歧义）· 会话保持「半死」（中毒——实录根因） |
| KD-22 | 异步 = **池化排队执行**（同一串行队列），独立域池 `_browserTasks` 帽 4 | 单页不引入并发（语义零变）；独立域池 ⇒ 帽/错误句/结算不与他族混 | 并入 `_bgTasks`（域混 ∥ 帽共享）· 真并发动作（单页交错——破坏性） |
| KD-23 | 取消 = queued 丢队 ∥ running abort（**不杀浏览器**） | 保持「杀 ⟺ 控制器已中止」不变式；浏览器重置是独立动作（`close`） | 杀浏览器（误伤 ∥ 缓不济急） |
| KD-24 | 全 16 动作统一可异步 + 门在起跑处 | 零二次分类；异步 ≠ 免审 | 白名单异步（多一套分类面） |

### 2.7 上抛项

1. **需求档建议文本**（F-BT16/F-BT17/F-BT18/F-BT19 + N-BT10）——文本见 2.8，落笔 = 父侧（**待裁**）。
2. **prompt 面增改**（`tool-docs/browser.md` ∥ `wait_for.md` ∥ `process.md`）——内容权 = 主 agent（**待裁**：文本骨架见 2.8，落笔 = 主 agent/eng-coder）。
3. **命名待认**：`agent-tools/browser-async.mjs`（族名对齐 bash-async）∥ 新拆档 `browser/queue.mjs`——若另有偏好，语义不受影响（改名面小）。
4. **越批登记（不扩面）**：VSC 自持 `thincoder-vscode/src/agent-tools/async-discard.mjs` 未随 #9 bg 并入——browser 族按 **bg 先例**（核心收编）；VSC 侧一致性 = 越批，不在本批动。
5. **既有面发现（非本批，报告不修）**：`tool-docs/bash.md:11-14` 参数清单未列 `async`（schema 有该参——`tools/bash.mjs:248`）；prompt 面小缺口，父侧酌处。

### 2.8 建议文本（父侧笔 —— 需求档 + prompt 面）

**需求档增补（建议，逐条判定句）**

- **F-BT16** 动作硬超时（有界不悬挂）：任一动作调用（含会话自启 ∥ CDP 命令 ∥ 轮询等待 ∥ 关闭路径）在硬预算内返回；超时 = 显式失败回执（携动作名与卡点步名）+ 可重试；无任何动作路径可无界悬挂（判据：挂死型假传输下逐动作拒绝于预算内）。
- **F-BT17** 会话外部关闭可感知与自愈：自启浏览器被外部关闭（进程退出 ∥ 连接断开）⇒ 在飞动作即时显式失败（不呆等）；后续调用干净重开（页面态丢失、profile/登录态保留，重开注记可见）；会话不因外部关闭进入中毒态（后续调用不再挂）。
- **F-BT18** 异步通道（不阻塞回合）：动作可后台执行——起跑 ack 即时返回；结算摘要可达（完成 ∥ 失败 ∥ 被杀三终态必达或显式确认）；`wait_for` 可等（条件 `browser id:N done`）；可杀（`process` kill）。
- **F-BT19** 用法认知（描述面）：工具描述含「现实环境实践」——反爬墙/登录门识别 ∥ 动作节奏（连击降速、重取快照）∥ 会话假设（不假定自启浏览器常驻）∥ 弃用转路判据（静态面 ⇒ fetch；无需交互的链接 ⇒ 直接生成；需人工操作 ⇒ 请用户点）。
- **N-BT10** 挂起可诊断：超时失败回执含卡点步名；异步任务终态必达摘要（或显式取消确认）；无静默悬挂 ∥ 无静默丢失。

**prompt 面增改骨架（主 agent 笔）**：`tool-docs/browser.md` — 参数段 +`async`（depth-0 ∥ ack ∥ 摘要 ∥ `wait_for`/`process` 用法）+「Timeout & session loss」注（超时必返、外部关闭即失败、重开注记；勿假定常驻）+「现实环境实践」段（E5 四小节）；`wait_for.md` 条件枚举 +`browser id:N done`；`process.md` id 靶描述覆盖后台浏览器任务。

### 设计评审修轮 1 落盘（11 条发现 · 2026-10-07 · eng-designer）

**段位**：评审轮 1 = pass（🔴 0 / 🟡 7 / 🔵 4）——11 条经父侧裁定全部采纳；本轮 = 点修复轮（按号修、按号报）。落盘面 = `docs/core/design/BROWSER-TOOL.md`（就地）∥ 本档 §2 行级收正（#1/#2/#8/#11 所点行位——§2.3 `:140` · §2.4 `:172`–`:174` · §2.5 `:184`–`:188` · §2.6 `:200`）；设计档变更记录 +1 行。零新语义 ∥ 产品码零触 ∥ 需求档零触 ∥ §1/§3–§6 零触 ∥ `TOOLS.md` 零触。

**逐号落盘（号 → 改动）**：

1. 动作数收正 16——设计档 §2.11（`:234`）∥ KD-24（`:398`）∥ 本档 §2.3（`:140`）∥ §2.5 E1（`:184`）∥ **§2.6 KD-24 行（`:200`）——父侧清单外同族实例，一并收正**。
2. 用例编号跨批续编（避撞号）——新批 = 单测 **T27–T42** ∥ 冒烟 **S19–S22**（W1 保留）：设计档 §7 五行（`:428`–`:432`）∥ §8 U52–U60 落点列（`:489`–`:497`）∥ §8 尾注 +归属行（`:500`–`:501`）∥ §5 冒烟行（`:358`——父侧清单外同族）∥ 本档 §2.4（`:173`–`:174`）∥ §2.5 用例列（`:184`–`:188`）；设计档落点列标「（本批新档）」。
3. §7 五行删「建议编号」限定（`:428`–`:432`）——正式编号回指（需求档 F-BT16–19/N-BT10 已落）。
4. 设计档档头计数收正（`:4`）：F-BT1–F-BT19 ∥ N-BT1–N-BT10；§7 标题同族计数（`:400`）随正。
5. §5 补「>300 档位处置」段（`:364`——拆分决定段后）：`ops.mjs` ∥ `helpers.mjs`（余 8 行）∥ `suspension.mjs` ∥ `async-settle.mjs` ∥ `subagent-scheduler.mjs` ∥ `subagent-async.mjs`（指针）+ 批内件单测档（≈320——父侧清单外同族补入）：本批不拆 ∥ 触发条件 = 下次实质改动时核、越 500 即拆。
6. KD-20 括注改述（`:394`）：「（+ 空闲期心跳）⇒（空闲 >5s 时含一次入口心跳）」——与 §2.10 同形。
7. §2.9 补「开启段中止」处置句（`:209`——按 §2.10 同式复位 + 释放 profile 锁 + 置重开注记）；U52（`:489`）「不中毒」判据覆盖「预算落在开启段」一格。
8. 墙钟断言改确定性判据（下一事件循环内——非墙钟界）：设计档 §7 F-BT17/F-BT18（`:429`/`:430`）∥ §8 U55（`:492`）/U59（`:496`）∥ 本档 §2.5 E2①（`:185`）/E3④（`:186`）同拍。
9. §2.9 明写「队列等待计入预算（有意）」+ 终态回执形（`:188`——步名 `queue wait`）；步名枚举（`:207`）随动；U22（`:459`）补时序断言。
10. §2.11 补句（`:234`）：后台动作仍受 §2.9 动作预算、`timeoutMs` 可覆写——与 bash「async 起跑不收默认 120s」异（显式登记）。
11. Δ 预估取单一读数：本档 §2.4（`:172`）收正为「+1 / ±1」（与设计档 §5 `:356` 同拍）。

**选择项（择一法取法）**：#2 = 跨批续编（沿 T16+ / S8+ 先例；非前缀法）∥ #7 = §2.10 同式复位处置（非「探针兜住」声明）∥ #9 = 计入排队（非「起执行起算」）∥ #10 = 落设计档 §2.11（`TOOLS.md` 零触）∥ #11 = 取「+1 / ±1」（按一行枚举落笔口径）。

**附察（父侧清单外——报备，未动）**：① 设计档 §7 F-BT16 行零「17」实例（父侧清单所列坐标核过——实为 E1 判据文言面，零改）；② 本档 §2.1 对位列「（建议）」×5 ∥ §2.7 上抛 1「（待裁）」——同类滞后（需求档已落、§1.7 已处置）；未动（#3 坐标仅指设计档 §7）。

**守界**：产品码 / `scripts/**` / 提示词零触；§1/§3–§6 零动；需求档零动；批外档零动（`TOOLS.md` 未动）。设计档 §1/§3/§4/§9/§10 未动。

**上抛 / 未决**：无（11/11 落盘；附察 ② 待父侧酌处——「建议」类标记是否同收）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

审查对象 = 声明面（本档 §2 ∥ `docs/core/design/BROWSER-TOOL.md` §2.9–§2.11/§5–§10 ∥ `docs/core/design/TOOLS.md` 收编面 ∥ `docs/core/requirements/BROWSER-TOOL.md` F-BT16–F-BT19/N-BT10）；三档全文 + 本档 §1/§2 已通读。限制：无项目标准档 / 无文档地图声明 ⇒ methodology 与 ownership 两判据降级评定；按声明不读声明面外文件 ⇒ 受影响文件行数标注只核内部自洽与档位处置，未对盘 spot-check。

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Acceptance criteria | 🟡 | 动作总数两口径并存：`BROWSER-TOOL.md:13`「动作面十六（八基线 + 输入域八扩展」、`:47`「required（十六动作）」、`TOOLS.md:245`「十六动作 navigate/snapshot/click/type/evaluate/wait/screenshot/close」——而 `BROWSER-TOOL.md:230`「全 17 动作统一」、`BROWSER-TOOL.md:392`（KD-24）「全 17 动作统一可异步」、本档 `:140` ∥ `:184`（E1 判据①）同写 17；§2.2 表实有 16 行、§2.9 预算表恰列 16 动作 ⇒ E1「全 17 动作各自在预算内拒绝」不可机检成立 | 统一为 16（`BROWSER-TOOL.md` §2.11 ∥ KD-24 + 本档 §2.3 ∥ §2.5 四处）；若确含第 17 项动作 ⇒ 在 §2.1 schema ∥ §2.2 契约表补该动作行 |
| 2 | Clarity | 🟡 | 新批用例沿用 T1–T16 ∥ S1–S4，与前两批已占编号撞号（前批面 = `BROWSER-TOOL.md:494`「T16–T26 ∥ S8–S18」）：同一 §7 表内 T16 双义（`:412`「∥ T16（schema 面）」 vs `:425`「单测 T16（描述档四小节存在」）、S1 双义（`:398`「冒烟 S1：零预置条件下自启成功」 vs `:422`「冒烟 S1（永不响应服务）」）、S3/S4 双义（`:402`「冒烟 S3（wait selector 命中）、S4（wait 超时回执）」 vs `:424`「冒烟 S3 / S4」）；§8 U 表落点随带歧义（U5 与 U57 均引「冒烟 S3」） | 跨批续编序号（新用例 = T27+ ∥ S19–S22）或加批前缀（如 `AF-T1`），并在 §7/§8 落点列标明用例所属文件（旧两档 vs 本批新档） |
| 3 | Document ownership | 🟡 | §7 五行仍带「建议编号」限定（`:422`「动作硬超时（建议编号——需求档待父侧落）」、`:423`–`:426` 同族），而需求档已正式落条目（`requirements/BROWSER-TOOL.md:45`「动作硬超时（有界不悬挂——用户 19:41 投诉）」）、本档 §1.7 亦记「**已落笔**（父侧）」——设计档读数滞后 | 五行删「建议编号」限定，统一为正式编号回指 |
| 4 | Document ownership | 🟡 | 设计档头需求计数滞后：`BROWSER-TOOL.md:4`「（F-BT1–F-BT15 ∥ N-BT1–N-BT9——本档逐条回指，不复制）」 vs 需求档现态 `requirements/BROWSER-TOOL.md:4`「（F-BT1–F-BT19 / N-BT1–N-BT10 判定句）」——本批新增 F-BT16–19 / N-BT10 未回头计数 | 档头收正为 F-BT1–F-BT19 ∥ N-BT1–N-BT10（与 §7 新行口径一致） |
| 5 | Affected-file size annotations | 🟡 | §5 只对 `session.mjs` 给出拆分决定（`:358`「拆出新档 `browser/queue.mjs`」）+ 两行压力注（`:349`「压 500 硬限——零余量，须保 ≤±5」）；同为 >300 且本批有 Δ 的档位无处置句——`helpers.mjs` `:344`「490 | +≈2 ⇒ ≈492」距 500 硬限仅 8 行、比 `subagent-async.mjs`（479）更近硬限却零注；`tools/ops.mjs`（331⇒349）∥ `suspension.mjs`（349⇒354）∥ `async-settle.mjs`（327⇒329）∥ `subagent-scheduler.mjs`（448⇒449）同无 | 为 >300 且本批有 Δ 的档位各补一句处置（本批不拆 + 余量 + 触发条件 = 下次实质改动 / 越 500 即拆），至少覆盖 `helpers.mjs`（余 8 行） |
| 6 | Clarity | 🟡 | `BROWSER-TOOL.md:388`（KD-20）「入口探针（+ 空闲期心跳），**不做常驻心跳定时器**」与 `:213`（§2.10）「**不做常驻心跳定时器**（检测延迟只在「在飞」有意义」并置——括注「+ 空闲期心跳」可被读成后台/常驻心跳（KD-20 否决列含「常驻心跳（成本零收益）」），与 §2.10 三源定式（入口探针 >5s 条件心跳）不同读 | 括注改述为与 §2.10 同形（如「入口探针（空闲 >5s 时含一次入口心跳）」）或删括注，消自相矛盾读法 |
| 7 | Completeness | 🟡 | 预算到点落于会话自启序列「中途」时的会话态处置未定：`BROWSER-TOOL.md:182`「到点 ⇒ 动作控制器 `abort`（超时因由）」∥ `:201`「abort 后一切后续调用**快速失败**（清理路径不得再起命令——防僵尸命令与下一动作交错）」只覆盖在飞命令；navigate 预算 `:192`「含会话自启（12s 启动帽内）+ 导航 + 就绪轮询 + 快照」= 45s，而开启段内层帽之和可达 ≈57s（`:202`「`connectCdp` open 10s ∥ `/json/new` fetch 5s」+ 三个 `*.enable` 各 10s + 启动 12s）⇒ 半开态（cdp 已置 / enable 序列未完）可被外层预算留下；`:483`（U52）「其后动作可继续（工具不中毒）」只对「页面挂死」（健康会话）举证 | 明确该态处置（如：开启段失败/中止 ⇒ 按 §2.10 同式复位 + 释放 profile 锁 + 置重开注记；或声明入口探针兜住半开态），并把 U52「不中毒」判据覆盖「预算落在开启段」一格 |
| 8 | Acceptance criteria | 🔵 | 墙钟断言：本档 `:185`（E2①）「假 WS close ⇒ 在飞动作 ≤100ms 拒」、`:186`（E3④）「running（≤200ms 展开）」及设计 `:486`「（≤100ms）」 ∥ `:490`「≤200ms」——与机器负载相关，易 flaky | 改确定性判据（下一事件循环 / 结算入口即达）或放宽界并显式登记「经验界非契约值」（沿 `TOOLS.md:632`「**< 5s = 经验界**、与机器负载相关、非契约值」先例） |
| 9 | Clarity | 🔵 | 预算自入队起算（`BROWSER-TOOL.md:182`「每动作入队即记预算 deadline」）⇒ 串行队列排队期计入预算：排队中到点的动作报何步名未定（`:205` 步名枚举「`launch browser` / `connect CDP` / `waitForReady` / `wait poll` / `scroll settle`」无排队项），U22（并行调用串行）无时序断言 | 明写「队列等待计入预算（有意）」并补排队步名（如 `queue wait`）与终态回执形；或声明预算自「起执行」起算（二者取一） |
| 10 | Document ownership | 🔵 | 后台动作是否仍受动作预算未点明：`BROWSER-TOOL.md:197`「`timeoutMs` 参数 = 各动作预算 override（硬上限 120s；wait 语义不变）」对全动作成立，而 `TOOLS.md:1010` bash 条明写「async 起跑不收默认 120s（长任务 = 本形目的）」——两族并列易被读成族统一 | 在 `BROWSER-TOOL.md` §2.11 或 `TOOLS.md` §6.19 browser 段加一句：后台动作仍受 §2.9 动作预算、`timeoutMs` 可覆写（与 bash 异——显式登记） |
| 11 | Doc hygiene | 🔵 | 同一预估两读数：`BROWSER-TOOL.md:352`「+1 ∥ ±1」 vs 本档 `:172`「+2 / ±2」（`tool-docs/wait_for.md` ∥ `process.md` 的 Δ 预估） | 取单一读数（按一行枚举的实际落笔口径统一为 +1 或 +2） |

计数：🔴 0 · 🟡 7 · 🔵 4（共 11）
VERDICT: pass

## §4 用户批准（主 agent）

**代签（主 agent · 2026-10-07 20:2x · 自动跑授权内——用户 19:43「修彻底」）**

- 评审链：设计评审轮 1 = **pass**（🔴 0 ∥ 🟡 7（#1–#7）∥ 🔵 4（#8–#11）——发现表在 §3 轮次 1）；11 号修复轮逐号落盘（§2 修轮块 + 设计档就地）；父侧核验抽读 12 处全在盘（§1.8 A）。
- 附察处置：§2「（建议）/（待裁）」残留标记随回填轮清 ∥ doc-check 他档余量落账 ∥ 附察①零改（§1.8 B）。
- **准予实施**：两舱拆分——**舱 A**（核 + prompt 面 + 单测 A 腿：`browser/queue.mjs` 新档 ∥ `session` ∥ `cdp` ∥ `actions` ∥ `input-actions` ∥ 三 prompt 档 ∥ 单测档）∥ **舱 B**（agent 集成 + 异步通道 + B 腿 + 冒烟：`agent-tools/browser-async.mjs` 新档 ∥ 各单点接线 ∥ `tools/{browser,ops}` ∥ 单测追加 ∥ `…smoke.mjs`；dependsOn A）。
- prompt 面文本 = §1.8 C（主 agent 笔——实施轮逐字落地，零改写）。
- 令牌 = 运行时凭据（不入档）；实施舱随本签派发。

## §5 实施记录（eng-coder）
**状态行**：实施完成（舱 A（A 腿 9/9 ∥ 旧三档零回归；审计 1 + 代码评审 2 轮——终态 clean）∥ 舱 B（A 腿 9/9 + B 腿 10/10 ∥ 冒烟 S19–S22 4/4 真 Edge；审计 1 + 代码评审 2 轮——终态 clean））



### 交付摘要（舱 A：核 + prompt 面 + 单测 A 腿）

- **改动面**：`thincoder-core/browser/queue.mjs`（新增——调度策略：串行队列 ∥ `ACTION_BUDGETS` 预算表 ∥ `ActionController`（超时/取消单点）∥ 步名跟踪 ∥ abort 后快速失败）；`browser/session.mjs`（队列接线 ∥ 健康三源 ∥ `failSession` 单点 ∥ 自愈重开注记 ∥ 一切 CDP 命令单点 `cdpCall`）；`browser/cdp.mjs`（三层帽：`call` 缺省 15s ∥ `connectCdp` open 10s ∥ `/json/new` 5s + 断连订阅 `onDisconnect`）；`browser/actions.mjs`（wait 轮询帧 + 受控 sleep）；`browser/input-actions.mjs`（`scroll settle` 帧 + html5 拦截中止透传）；`thincoder-core/tool-docs/{browser,wait_for,process}.md`（§1.8 C 逐字）；`docs/batches/2026-10-07-browser-async-fix.test.mjs`（新增 · A 腿）。
- **实读行数（内容行）**：queue 168 ∥ session 493（≤500 硬限，余 7）∥ cdp 161 ∥ actions 163 ∥ input-actions 197 ∥ 单测 334 ∥ browser.md 48 ∥ wait_for.md 24 ∥ process.md 14。
- **验证读数**：`node --test docs/batches/2026-10-07-browser-async-fix.test.mjs` ⇒ **9/9 绿**（23.6s：T27 十六动作逐于预算内拒绝 · T27b 开启段中止 · T28 预算表逐格 · T29 三层帽小值注入 · T30 卡点步名三源 · T31 连接断 · T32 子进程退 · T33 自愈重开+探针三检 · T42 描述档）；旧三档复跑 ⇒ browser-tool **21/21** ∥ browser-input **7/7** ∥ browser-input.clipboard **4/4**（零回归）；`node --check` 六档全绿。**未跑仓级套件**（发布闸在父侧收口，本舱不跑）。
- **口径落点**：单时钟预算自**入队**起算（队列等待计入——有意）；三层帽 = 动作控制器（层一）∥ 显式帽（enables 10s · `Browser.close` 3s · 探针 2s · 关闭等待 3s）∥ `cdp.call` 兜底 15s；步名 = `queue wait` / `launch browser` / `connect CDP` / `waitForReady` / `wait poll` / `scroll settle` + CDP 方法名（无自创阶段名）；会话健康三源 = child exit/error ∥ WS 断连 ∥ 入口探针（存活∧未关恒检，距上次成功活动 >5s 才心跳 `Browser.getVersion` 2s 帽）；`failSession` = 拒在飞（同一因由实例）⇒ 态复位 ⇒ 杀树兜底 ⇒ 释放 profile 锁 ⇒ 置注记（不调 `Browser.close`）。

### 决策透明表（设计未定处的实现裁决——逐条披露）

| # | 裁决点 | 选择 | 依据 |
| 1 | 动作内未显式配帽的 CDP 调用兜底帽 | `max(15s, 剩余预算 + 1s)`——控制器恒先于兜底帽裁决 | §2.9「层一优先」；否则预算 >15s 时兜底帽会先于动作预算抛裸句（T27 wait 格曾红） |
| 2 | 排队期 abort 的调用方回执 | 排队期（未起执行）即时以 `queue wait` 拒；起执行后由任务自身守卫裁决——回执晚于动作收尾 | 否则在飞中止时调用方早于动作收尾拿到终态，残留 aborted 控制器污染后续 `closeSession`（T27/T30 曾因此红） |
| 3 | 开启段中止的注记文案与置位点 | 复用 §2.10 同款重开注记文本；置位收在 `ensureSession` 单点，`openBrowserReal` 只做半开态复位 | 设计只定「置重开注记」未另定文案；单点 ⇒ 真路径与替身同一置位语义（T27b 可机检） |
| 4 | 探针的子进程存活检查面 | 仅对具 `.on` 的真 ChildProcess 形态生效（无事件面的替身跳过该检） | 保旧 fixture 语义不回归（旧三档 fixture 无 `exitCode` 判据）；真实现恒有事件面 |
| 5 | cancel 句文案 | `<action> cancelled (stuck in <步名>)` | 设计只定「错误句分形」未定文案 |
| 6 | html5 拖放拦截的步名 | `Input.dragIntercepted`（`once` 帧 = CDP 方法名） | §2.9 步名枚举含「CDP 方法名」，未引入新阶段名 |
| 7 | 开启段中止落在「launch 未返回」窗口 | 留存自启 promise（`launching`），结算即补杀；`child` 已赋值路径不变 | 评审 must-fix：该窗口内杀树兜底无从执行（`child` 未赋值）⇒ 孤儿浏览器 + 锁提前释放（`launchBrowser` 无外部取消点，中止后仍轮询到成功） |

### 审计与代码评审轮次与终态

| 轮 | 形式 | 发现 | 处置 |
| 1 | 内部 explore 发散审计（只读） | 🟡×1（U52「预算落于开启段」一格缺机检）· 🔵×2（文档面：U53 落点指针 ∥ 设计 Δ 读数） | 补 **T27b**（开启段中止 ⇒ 干净重开 + 首回执注记）；补杀/置位收 `ensureSession` 单点；两蓝为文档面，报告上抛 |
| 2 | advisor 代码评审（第一轮全量） | **changes-required**：must-fix #1（launch 窗口孤儿）+ 🟡×3（档位/Δ ∥ 依赖图登记 ∥ prompt 先行承诺）+ 🔵×3（T27b 登记 ∥ 开启段裸句面 ∥ §5 空） | #1 已修（决策表 #7）；🟡/🔵 均为文档层/协同/记录面，报告上抛（不改码） |
| 3 | advisor 代码评审（第二轮——仅核销 #1 修复声明） | **pass**：must-fix 已 Fixed；无新发现 | 收敛，终态 = clean |

**fix round 计数**：3（① 实现内自纠：queue 排队期中止语义 + 动作内兜底帽余量；② 审计驱动：T27b + 注记单点；③ 评审驱动：launch 窗口补杀）。**终态 = clean（pass）**。

### 上抛（父侧/文档层处置——本舱不改码）

- **档位压力**：`session.mjs` 实读 493（设计/批档 Δ 估 ≈410，不符），未入设计 §5「>300 档位处置」清单——建议收口登记「本批不拆 + 触发条件 = 下次实质改动时核 ∥ 越 500 即拆」。
- **依赖图登记**：新增 `queue → actions`（wait 帽常量）未登记设计 §5 依赖行；`T27b` 未入 §7/§8 用例面。
- **prompt 先行承诺**：`browser.md` async 行 ∥ `wait_for "browser id:N done"` ∥ `process` kill id 行承诺舱 B 行为——同批同拍交付则无悬置。
- **开启段裸句面**：enables 10s 帽命中 ∥ 开启段内 WS 断连 ⇒ 回执为裸 CDP 句（无 `(stuck in …)`/动作名/重试引导）——或统一句面，或在 §2.9 登记例外。

### 舱 B 依赖的导出面（核层已就位）

- `session.mjs`：`runAction(action,args,ctx)`（队列入口——回执串 ∥ 拒绝）· `closeSession()` · `lastPageUrl()` · `hostAllowed(host,list)` · `_deps{openBrowser,killBrowser,saveShot}` · `IDLE_MS`；错误标记：`browserAbort` / `abortReason` / `sessionLost` / `pageReceipt`。
- `queue.mjs`：`ACTION_BUDGETS` · `budgetFor(action,args)` · `ActionController` · `createActionQueue()` · `BUDGET_FALLBACK_MS` · `BUDGET_MAX_MS` · `WAIT_MARGIN_MS` · `QUEUE_WAIT_STEP`。
- `cdp.mjs`：`DEFAULT_CALL_TIMEOUT_MS` · `CONNECT_TIMEOUT_MS` · `NEWTAB_TIMEOUT_MS` · `cdpTimeout` 错误标记。

### 交付摘要（舱 B：异步通道 + agent 集成 + 批内件两档 + 冒烟）

- **改动面（新档 1 + 接线 7 + 工具面 2 档 + tool-docs 1 + 批内件 3）**：
  - 新档 `thincoder-core/agent-tools/browser-async.mjs` —— 池 ∥ 起跑 ∥ 结算单点 ∥ 注入 ∥ 杀单点 ∥ `wait_for` 判据 ∥ subject 标签；导出 `BROWSER_TASK_MAX` / `launchBrowserTask` / `browserTaskEntry` / `browserTaskDone` / `killBrowserTask` / `injectBrowserResult` / `browserSubject`。
  - 接线：`agent-tools/async-settle.mjs`（`getAsyncPool` role `"browser"` → `_browserTasks`）∥ `agent-tools/subagent-scheduler.mjs`（取号扫描域 +`_browserTasks`；两处调用点注释收正）∥ `agent-tools/async-discard.mjs`（`BROWSER_SPEC` + `discardAbortedBrowserTasks`）∥ `agent/suspension.mjs`（`poolLive` 第四域；中止收尾调用）∥ `agent/run-stages.mjs`（回合尾中止第四域）∥ `agent/helpers.mjs`（`excludeSubagentTools` 删参面扩至 `browser` 的 `async`）∥ `agent-tools/subagent-async.mjs`（`injectAsyncResult` role 分发 + 静态 import）。
  - 工具面：`tools/browser.mjs`（`async` 参 schema ∥ `timeoutMs` 描述收正 ∥ depth 第二道 ∥ 起跑动态 import）∥ `tools/ops.mjs`（kill id 路由先 bg 后 browser + 合并错误句 ∥ `wait_for` 条件 `browser id:N done`（解析/判据/枚举）∥ `id`/`action` 描述收正）∥ `tool-docs/process.md`（去 bash 单族残留：首行 ∥ action 行；`id` 行合 §1.8 C〔5〕逐字）。
  - 批内件：单测档拆 a/b 两档（`…fix.test.mjs` = A 腿 ∥ `…fix.b.test.mjs` = B 腿）∥ 冒烟新档 `…fix.smoke.mjs`。
- **实读行数（内容行）**：`browser/queue.mjs` 171 ∥ `browser/session.mjs` 494 ∥ `agent-tools/browser-async.mjs` 200 ∥ `tools/browser.mjs` 161 ∥ `tools/ops.mjs` 346 ∥ `agent/helpers.mjs` 490 ∥ `agent/suspension.mjs` 351 ∥ `agent/run-stages.mjs` 295 ∥ `agent-tools/async-settle.mjs` 327 ∥ `agent-tools/async-discard.mjs` 220 ∥ `agent-tools/subagent-async.mjs` 477 ∥ `agent-tools/subagent-scheduler.mjs` 448 ∥ 单测 A 334 + B 390 ∥ 冒烟 173 ∥ `tool-docs/process.md` 14。全档 ≤500 ✓（拆档前单测档 578 > 500——评审轮 2 must-fix，已拆；`async-discard` 实读 220 vs 设计估 ≈209、`browser-async` 200 vs 估 ≈180 见上抛）。
- **验证读数**：
  - 单测 A 腿（T27 · T27b · T28–T33 · T42）**9/9 绿**（23.6s）∥ B 腿（T34–T41 · T43 · T44）**10/10 绿**（1.2s）。
  - 冒烟（真 Edge/Chrome 无头）**S19–S22 4/4 绿**：S19 6003ms → `Error: navigate timed out after 6000ms (stuck in Page.navigate) — retry the action, or run \`close\` to reset the session` + 其后动作照常 ∥ S20 真杀本工具自启浏览器进程树 → 自愈重开 + 注记（再下一动作无注记）∥ S21 ack `browser#1 started (running) — navigate http://127.0.0.1:<port>/` → 摘要 `[System reminder: background browser#1 finished — navigate http://127.0.0.1:<port>/ (ok, 0.1s)]` ∥ S22 `browser#2` 取消确认 + 无摘要 + 其后 navigate 照常（浏览器仍活）。
  - 旧三档复跑零回归：browser-tool **21/21** ∥ browser-input **7/7** ∥ browser-input.clipboard **4/4**；`node --check` 十四档零错。**未跑仓级套件**（发布闸 = 父侧收口；核 `thincoder-core/test/run.mjs` 收集面 = `test/*.test.mjs` 单层 glob——批内件不在收集面）。
  - **kill 腿真红→绿（父侧硬界㈢）**：两缝回退态 ⇒ T37 红 `1 !== 0`（queued 受害件真被执行）∥ T38 红 `false !== true`（running 未即时展开）；缝复位 ⇒ 绿。**F1 修复轮红→绿**：竞态窗降级支在场 ⇒ T43 红（`未及见 ≠ 墓碑`——实得 `{status:'cancelled',role:'browser'}`）；支删除 ⇒ 绿。
- **口径落点**：后台动作仍受 §2.9 动作预算（`timeoutMs` 可覆写——与 bash async 的「起跑不收默认 120s」异，§2.11 显式登记）；帽 `BROWSER_TASK_MAX=4`（对齐单域 4）；结算**恒停靠** `_pendingAsyncResults` + `wakeAsyncWaiters`；取消 = queued 丢队 ∥ running abort（**不杀浏览器**——KD-23）；`wait_for` 判据 = 池内 done ∥ **出池即 done**；depth 双线 = schema 删参（`helpers.mjs`）+ 运行期第二道（`tools/browser.mjs`）。

### 决策透明表（设计未定处的实现裁决——逐条披露）

| # | 裁决点 | 选择 | 依据 |
|---|---|---|---|
| 1 | ack subject 标签取法 | `navigate`=url；余按 ref/selector/url/key/op/from/networkIdle → 坐标 → expression（60 截）→ text（40 截）；全空 ⇒ 省略 | 设计只定 ack 形 `<action> <subject>`，未定 subject 面 |
| 2 | 摘要 ok/failed 判据 | reject 形（`entry.error`）∥ resolve 形失败回执（首行 `Error: …`）⇒ `failed: <首行去前缀>`；余 ⇒ ok | §2.11 文法 `(<ok> ∥ <failed: …>, <s>s)`；resolve 形失败不得报 ok（T40 机检） |
| 3 | 摘要状态词截断 | 200 字符 + `…` | 首行单行可读（T36 长因由 118 字符未截——实测） |
| 4 | 取消两态与 Stop 竞态窗 | `cancelled`/`discarded` ⇒ 只落终态 + `_settle`（无摘要——凭据 = 杀点确认 ∥ 收尾整批提醒）；其余（含中止竞态窗）⇒ 恒停靠 pending（**不**自落「仅墓碑」支——墓碑非模型可见凭据） | §2.11 取消无摘要 + N-BT10 零静默丢失；`bash-async` finalize 同式 |
| 5 | `killBrowserTask` 幂等判据 | 出池后凭墓碑：`cancelled`+role browser ⇒ 同确认；`consumed`/`failed` ⇒ 「已结束」错误句；空/`undefined`/`null` ⇒ 显式靶句 | §2.11「重复幂等」；ops id 路由需 browser 自辨靶错（bg 未命中才落此段） |
| 6 | 合并错误句文案 | `Error: unknown background task id: N — it has finished, was killed, or was never started (no live bash# or browser# task under this id)` | §2.2 kill 行「合并错误句」；id 族两义并列（不偏向任一族） |
| 7 | 帽错误句文案 | `browser task cap reached (4/4 running: browser#…) — wait for one to settle (wait_for "browser id:N done") or kill one (process action='kill' id:N)` | 对齐 bg 帽句形（携可行动作）；第 5 条显式拒、零静默丢 |
| 8 | depth 第二道文案 | `browser async is depth-0 only — a child agent has no background task pool (run the action synchronously)` | schema 主门在 `helpers.mjs`（删参）；第二道留显式可读句（不静默转同步） |
| 9 | 失败墓碑状态词 | 注入时按 `error`/`failed` 判 ⇒ 墓碑 `failed`/`consumed` | 墓碑族复用（D2）；与 bg 同形 |
| 10 | 批内件拆档 | 单测档拆 A/B 两档（A 334 + B 390），夹具块逐字复制（逐字核过；先例 `2026-10-04-issue-fix-round1.a/.b`） | 单档越 500 硬限（评审轮 2 must-fix）；文件名/行数入设计面 = 父侧收口轮 |

### 审计与代码评审轮次与终态（舱 B）

| 轮 | 形式 | 发现 | 处置 |
|---|---|---|---|
| 1 | 内部 explore 发散审计（只读） | 🟡×1（Stop 竞态窗降级为「仅墓碑」——零模型可见凭据，N-BT10 在此落空）· 🟡×1（Stop 面无机检落点，E4② Stop 半）· 🔵×3（`tools/ops.mjs` action 行残留 bash 单族 ∥ scheduler 两处调用点注释未随扩列 ∥ §5 舱 B 段待写） | 竞态窗降级支删除（改走 bg 族兜底：恒停靠——摘要即凭据）∥ 补 **T43**（Stop 收尾面：discard ⇒ 墓碑 `discarded`/出池/整批一次提醒 + 竞态窗兜底停靠）∥ `ops` action 行 + `tool-docs/process.md` 同拍去 bash 残留 ∥ scheduler 两处注释收正 |
| 2 | advisor 代码评审（第一轮全量） | **changes-required**：🔴 must-fix×1（批内件单测档 578 行破 500 硬限——METHODOLOGY F3-1「>500 必拆——硬限无例外」）· 🟡×3（§5 缺舱 B 记录 ∥ 设计「队列未启动条目 ⇒ 自愈重开后照跑」语义悬空无用例 ∥ >300 档位数值/登记差）· 🔵×4（T27b/T43 未入用例表 ∥ 中止「单点」注释与两处调用不符 ∥ 依赖图缺 `queue → actions` ∥ 计数面不含后台任务族） | ① 拆 a/b 两档（A 334 ∥ B 390——夹具块逐字核过）；② 本 §5 块即补；③ 补 **T44**（外部关闭遇排队条目：未启动件不呆等 ⇒ 自愈重开后照跑、回执携注记——§2.10 队列格机检）；④ 注释改述「同一机制两处调用」；余为文档面（设计 §5/§7/§8 数值与用例登记）与计数面决策——见上抛 |
| 3 | advisor 代码评审（第二轮——仅核销修复声明） | 待回执 | 待回执 |

**fix round 计数**：4（① 实现内自纠：T37/T38 红判定基准——挂死型假传输下页面表达式不可归因「起执行」，改 `Page.navigate` 唯一 url 计数 ∥ 冒烟 stall 服务 socket `'error'` 零接管轰进程（实测一次，已补接管）；② 审计驱动：F1 竞态窗降级支删除 + T43；③ 评审驱动：>500 拆档；④ 评审驱动：T44 + 注释收正）。

### 上抛与披露（父侧/文档面处置——本舱不改码）

- **最小增补两缝（父侧裁定 ①——授权内，逐条披露）**：`browser/queue.mjs` `enqueue(action, args, run, signal = null)`（aborted ⇒ `cancel()`；否则 abort 监听 `{once:true}`）∥ `browser/session.mjs` `runAction(action, args, ctx, { signal = null } = {})` 透传——合计 +4 行（queue 168→171 ∥ session 493→494），纯增量、单笔可 revert；`browser/*` 其余零触。设计 §2.4 文件表未列此两档 ⇒ **设计面登记归父侧收口轮**。
- **跨批件残留（工具门禁拒写——预期）**：`docs/batches/2026-09-29-tools-carryover.test.mjs:318` 断言 `^Error: unknown background bash task id: 9999`，本批合并错误句（§2.2 kill 行）使其失效（该格单跑实测红）；跨批写被门禁拒（正确行为）⇒ **请父侧收口轮一笔收正，或裁定改回 bg 前缀形**。
- **设计面读数与用例登记（文档面）**：① `session.mjs` 实读 494（设计/批档 Δ 估 ≈410——舱 A 已上抛）∥ `helpers.mjs` 余量实读 10 行（设计记「余 8 行」）；② `async-discard.mjs` 实读 220（设计估 ≈209）∥ `browser-async.mjs` 实读 200（估 ≈180）；③ 用例面 T27b/T43/T44 未入设计 §7/§8 与批档 §2.5；④ 依赖图行缺 `queue → actions`（舱 A 已上抛）；⑤ 批内件拆档后设计 §2.4/§5 的文件名与行数需随正（原「≈320」估失效）。
- **计数面（🔵 未改码）**：`agent/suspension.mjs` `backgroundCounts` 仍只扫 `_asyncSubagents`/`_asyncAdvisors`（bg 先例同形）⇒ 仅剩后台浏览器动作在飞时宿主状态行显示 0 而会话仍挂起；设计未要求覆盖，扩扫域超本批授权 ⇒ 报父侧酌处（扩扫域 ∥ 设计登记「计数面不含后台任务族」）。
- **越批（不扩面）**：VSC 自持 `thincoder-vscode/src/agent-tools/async-discard.mjs` 无 `BROWSER_SPEC`/`_browserTasks` 面——批档 §2.7 上抛 4 已落账 #1047；端壳残余注入面经 `injectAsyncResult` role 分发自动覆盖 `role="browser"`，无端侧缺口。

### 终态（评审轮 3 回执——轮 2 核销）

- **advisor 代码评审第二轮（仅核销修复声明）⇒ pass**：① 拆档 Fixed（A 334 ∥ B **387**——**读数收正：B 实读 387，上记 390 为写入时估值**；两档 ≤500；夹具块逐字同形；零悬引用）∥ ② §5 舱 B 块 Fixed ∥ ③ T44 Fixed ∥ ④ 中止注释改述 Fixed；轮 1 余项（>300 读数 ∥ 用例登记 ∥ 依赖图行 ∥ 计数面）按上抛记录 Accepted，理由成立；**新 🔴 = 0**。
- **残余小项（不阻塞——归父侧收口轮一笔随清）**：① 批档 `:363`/`:384` 所记 B 档 390 → **387**；② §5 状态行（`:312`）旧文仍仅述舱 A（本次 status 已随动）；③ 两档头注用例行未含 T44（批档 `:365` 已含）；④ 同一 must-fix 编号两处不一（档头「评审轮 1」vs 批档「评审轮 2」）。
- **fix round 计数**：5（① 实现内自纠：kill 腿判据基准 + 冒烟 socket 接管；② 审计驱动：F1 降级支删除 + T43；③ 评审驱动：>500 拆档；④ 评审驱动：T44 + 注释收正；⑤ 评审轮 2 核销——零新改码，仅本收正块）。**终态 = clean（pass）**。

### 读数终核（`readFileSync` 口径，与全批同法——收正上两块的写入估值）

`browser/queue.mjs` 171 ∥ `browser/session.mjs` 494 ∥ `agent-tools/browser-async.mjs` 198 ∥ `agent-tools/async-settle.mjs` 327 ∥ `agent-tools/async-discard.mjs` 220 ∥ `agent-tools/subagent-scheduler.mjs` **450**（上记 448——两处调用点注释收正 +2） ∥ `agent-tools/subagent-async.mjs` 477 ∥ `agent/suspension.mjs` 351 ∥ `agent/run-stages.mjs` 295 ∥ `agent/helpers.mjs` 490 ∥ `tools/browser.mjs` 161 ∥ `tools/ops.mjs` 346 ∥ `tool-docs/process.md` 14 ∥ 单测 A **334** ∥ 单测 B **386**（上修块记 387 = read 工具页脚口径，含尾行空段） ∥ 冒烟 173。全档 ≤500 ✓。

## §6 验证与收口（父代理）
