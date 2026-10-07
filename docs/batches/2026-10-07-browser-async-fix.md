# 2026-10-07 · browser 工具异步化 + 全动作硬超时（挂页不再吊死 agent）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-07 · 来源 = 用户 2026-10-07 19:41 投诉（浏览器工具同步阻塞/吊死 agent）+ 19:43 裁「修彻底」（满量先行——不做止血半量）。
> 台账 = #1045（core · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
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
- 可异步动作 = **全 17 动作统一**（零二次分类；对瞬时动作无意义但统一允许）。
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
| `thincoder-core/tool-docs/{wait_for,process}.md`（同上） | 24 / 15 | +2 / ±2 | 条件枚举 ∥ kill 靶面 |
| `docs/batches/2026-10-07-browser-async-fix.test.mjs`（新档） | 新档 | ≈320 | 机检单测（点名见 2.5——假传输 ∥ 假子进程事件 ∥ 零真实浏览器） |
| `docs/batches/2026-10-07-browser-async-fix.smoke.mjs`（新档） | 新档 | ≈180 | 真 Edge 冒烟：S1 硬超时（永不响应本地服务）∥ S2 关闭后自愈重开 ∥ S3 异步 ack+摘要 ∥ S4 kill |
| `docs/core/design/BROWSER-TOOL.md` | 434 | +≈120 ⇒ ≈555 | 本设计收编（§2.9–§2.11 新增 ∥ §5 家底收正 ∥ §6/§7/§8/§9/§10 随动） |
| `docs/core/requirements/BROWSER-TOOL.md` | 76 | +≈18 | **父侧笔**（建议文本见 2.8） |

拆分决定：`session.mjs`（355）若直纳队列+健康 ⇒ ≈500 压硬限 ⇒ **拆出 `browser/queue.mjs`**（域界 = 「调度策略（预算/控制器/步名）」∥「会话机制（生命周期/原语/健康）」）。`agent-tools/browser-async.mjs` 命名对齐族（bash-async/subagent-async/advisor-async）——见 2.7 上抛 3。

### 2.5 验收对照（回指 2.1 条目 —— 全机检点名）

| 条目 | 判据（机检） | 用例落点 |
|---|---|---|
| E1 | ① 挂死型假传输 ⇒ 全 17 动作各自在预算（注入 `timeoutMs:150`）内拒绝，错误句含 `timed out after` + `(stuck in `；② `ACTION_BUDGETS` 覆盖 `BROWSER_ACTIONS` 全体；③ `connectCdp`/`/json/new`/`cdp.call` 缺省帽各自有界（小值注入）；④ 旧两测试档全绿（回执文法零变 ∥ 队列序保持） | 单测 T1–T4 · 冒烟 S1 |
| E2 | ① 假 WS close ⇒ 在飞动作 ≤100ms 拒，错误句明示外部关闭 + 重试引导；② 假 child `exit` 事件 ⇒ 同判；③ 死会话后下一动作 ⇒ open 计数 +1（重开）+ 回执尾行注记；再下一动作 **无**注记；④ 探针三检各自短路路径 | 单测 T5–T7 · 冒烟 S2 · 走查 W1 |
| E3 | ① ack 即时返回（`browser#N started (running)`）且调用方未被动作阻塞；② 池 `_browserTasks` 含条目；③ 结算 ⇒ 出池 + `_pendingAsyncResults` + 摘要文法（ok ∥ failed）；④ kill：queued（执行计数 0）∥ running（≤200ms 展开）∥ 幂等；⑤ 第 5 条起跑显式拒；⑥ depth>0 运行期拒 + 子代 schema 无 `async` 参 | 单测 T8–T13 · 冒烟 S3/S4 |
| E4 | ① 超时错误句携在飞 CDP 方法名（如 `Runtime.evaluate`）∥ 显式阶段名（如 `waitForReady`）；② kill/Stop 终态有墓碑；③ 外部关闭在飞 ⇒ 摘要 `failed:` 必达 | 单测 T4 · T12 · T14/T15 |
| E5 | 描述档（`tool-docs/browser.md`）含「现实环境实践」段四小节（反爬墙/登录门 ∥ 节奏 ∥ 会话假设 ∥ 弃用转路）——对表 grep（prompt 面，落笔后生效） | 单测 T16（文本面 grep——落笔件） |

### 2.6 关键决策（KD-18–KD-24 —— 详版入设计档 §6）

| # | 决策 | 理由（一句话） | 否决备选 |
|---|---|---|---|
| KD-18 | 超时 = **单时钟动作预算**（表）+ 三层帽，非逐命令独立帽 | 组合动作（导航=命令+轮询+快照）逐命令帽拼不出总界；单时钟可解释、可机检、错误句能指名卡点 | 仅 CDP 层帽（轮询循环无帽）· 仅外层 Promise.race 不 abort（僵尸命令继续穿插） |
| KD-19 | 超时 ∥ 取消共用同一动作控制器 | 一个机制两个因由，错误句分形；abort 后调用快速失败 ⇒ 无僵尸命令 | 两套机制（分叉风险） |
| KD-20 | 外部关闭感知 = 进程事件 ∥ WS 事件 ∥ 入口探针（+空闲心跳），**不做常驻心跳定时器** | 延迟只在「在飞」有意义——在飞面已被事件 + 预算覆盖；常驻定时器只添唤醒成本 | 仅探针（在飞瞬间感知不到）· 仅事件（半死连接漏网）· 常驻心跳（成本零收益） |
| KD-21 | 外部关闭 ⇒ **显式失败 + 下一次自愈**，不做透明重试 | 页面态已丢——静默重放会掩盖事实；显式失败给了模型决策点 | 透明重试（语义歧义）· 会话保持「半死」（中毒——实录根因） |
| KD-22 | 异步 = **池化排队执行**（同一串行队列），独立域池 `_browserTasks` 帽 4 | 单页不引入并发（语义零变）；独立域池 ⇒ 帽/错误句/结算不与他族混 | 并入 `_bgTasks`（域混 ∥ 帽共享）· 真并发动作（单页交错——破坏性） |
| KD-23 | 取消 = queued 丢队 ∥ running abort（**不杀浏览器**） | 保持「杀 ⟺ 控制器已中止」不变式；浏览器重置是独立动作（`close`） | 杀浏览器（误伤 ∥ 缓不济急） |
| KD-24 | 全 17 动作统一可异步 + 门在起跑处 | 零二次分类；异步 ≠ 免审 | 白名单异步（多一套分类面） |

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

## §3 设计评审（评审子代理）
## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
