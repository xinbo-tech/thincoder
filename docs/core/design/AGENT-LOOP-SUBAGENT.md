# 子代理工具契约与装配面（AGENT-LOOP-SUBAGENT）· 核心统一子系统档（拆分面）

> 归属 = `docs/core/design/AGENT-LOOP.md` 的**机制族拆分面**——「子代理工具契约与装配面」族（2026-09-15 迁移批第 5 批自母档 §6.7–§6.12 拆出）。
> **三分（2026-09-22 structure-debt 批 · 台账 #67）**——自本档迁出：后台异步池 / 挂起回合与 digest / 评审实例面 ⇒ `docs/core/design/AGENT-LOOP-ASYNC-POOL.md`（§6.8 · §6.10 · §6.11 · §6.18 · §6.19 · §6.20）；子 → 父上行与唤醒面 ⇒ `docs/core/design/AGENT-LOOP-UPSTREAM.md`（§6.27 全族）。
> **v2 就地更新**（2026-09-17 退役批）：M5 模块设计语义融入（委派与 spawn 门——见 §6.22；原旁路档 `_archive/modules/ENGINEERING-MODE-V2-MODULE-DELEGATION.md` 已归档 `_archive/modules/`）。
> **节号沿用母档全局编号**（本档承接 §6.7 · §6.9 · §6.12 · §6.21–§6.26 · §6.28）——全仓既有指针**只改档名、不改节号**；母档续 §6.1–§6.6 + §6.13–§6.17。
> 母档 = `docs/core/design/AGENT-LOOP.md`（归属与范围 / 核模块裁决行 / 须用户裁条目 / 对外契约 / 受影响文件 / 主循环机制面 §6.1–§6.6 / 诊断与预算面 §6.13–§6.16 / 关键决策 / 沿革）。
> 工作流档 = `docs/core/design/CORE-UNIFICATION.md`；需求层 = `docs/core/requirements/AGENT-LOOP.md`（含 §4 需求条目面）。
> 建档 = 2026-09-15（拆分 + 并入批次）：**段零改动、只修引用**（拆分纪律）；并入面 = 评审对象锚（旧档 §12.1）· 判定铁律 R1–R7（旧档 §12.2）——来源 = `thincoder-cli/docs/design/AGENT-LOOP.md`（旧档一字未改，留参照历史）。

## 6.7 子代理（`subagent` 工具）

**综述**：子代理 = `depth > 0` 的独立 agent 对象 + 丢弃式局部双线；role 决定工具集（只读过滤）与 overlay prompt。

### 6.7.1 角色与委派

| 角色 | 能力 | 模式 |
|---|---|---|
| explore | 只读查询族 / **零 git**（§6.7.4）/ 报告须列未找到项 / thoroughness 三档 | 普通 + 工程 |
| plan | 纯只读规划 | 普通 |
| coder | 父全量读写执行 + verify / advisor 自评 + 强制交付表 | 普通 |
| eng-coder | 工程模式替换 coder + 设计驱动 overlay + 必带 `designToken` + explore 受限审计 | 工程 |
| eng-designer | 工程模式写稿面唯一作者（需求档 / 设计档 / 批次档 §2，含修订）+ **无 designToken**（授权 = 需求已确认）+ 必带 `batchDoc` + explore 受限勘察 | 工程 |

**模式过滤**：普通模式 explore / plan / coder；工程模式 explore / eng-designer / eng-coder——schema enum 反映现行模式（角色互斥：工程禁 plan 与 coder、普通禁 eng-coder 与 eng-designer；schema 枚举 + 运行期硬门禁双保险；裁定源 = §6.22 F5）。

**委派动机**：隔离上下文（子 agent 全部读写调用不进父窗口）+ 单任务专注 + 并行省时 + coder / eng-coder 自带 verify / advisor 自评。thoroughness 三档 = quick（单点定向）/ medium（默认，适度并行）/ thorough（多位置全面分析，报告列搜索过什么 / 没找到什么）——提示词约定形态，不加工具参数。

**报告契约**：<200 字符视为交接不完整，打回扩写一次（`MIN_REPORT_CHARS`）；超长报告落盘全量保留。

**权限**：手动模式下子代理非只读工具透传到父 agent 权限审批（人在回路）；**eng-coder 例外 = spawn 时任务域授权**（已批准设计 + 任务书即授权——内部写豁免逐写审批）；非 eng-coder 子代理手动档语义不变。

### 6.7.2 单工具动作面（七动作）

`spawn / status / observe / send / escalate / cancel / panel`（`check` 已删——§6.7.5）；`action` 缺省 = `spawn`——既有 subagent 调用（无 action）零迁移。**eng-coder role 覆盖**照旧（role 参数不影响工程协议）。

| action | 参数 | 返回 | 阻塞 |
|---|---|---|---|
| spawn（缺省） | task / role / designToken / designId + `files?` / `dependsOn?` | `{ id, role, status, position?, waiting?, reason? }` | 同步 role 等完成；async 立即返回 |
| status | id?（省 = 全部概览） | `{ running / queued / done }` 结构化数组（running 带 model / elapsedSec / turn / maxTurns / touched 摘要） | 不阻塞 |
| observe | id（必填）+ recent?（默认 5） | `{ id, role, status, turn, maxTurns, touched…, currentTool?, recentTurns, done? }` | 不阻塞 |
| send | id + message（均必填） | `{ id, status: "delivered", queued }` | 立即（入队） |
| escalate | task / model? | 术后报告（缺省 async——settle 三分类 → digest） | 缺省 async |
| cancel | id（必填——防误全停） | `{ id, status: "cancelled" }` | 立即（定向 abort） |
| panel | `{ view?, freeze? }`（互斥） | 镜像快照 / 冻结回收确认 | 同步 |

**depth 可用性（本表 = 锚 `§6.7.2` 的规则住所）**：`status` 与 `observe` / `send` / `escalate` / `cancel` / `panel freeze` **同为 depth 0 专有**——子代（`depth>0`）调用 ⇒ 显式拒（子代无自有异步池）；
`spawn` **例外**（depth>0 合法——子代 spawn 恒同步）。拒收文案族与返回形（JSON `status:"error"` 对象形）= §6.25 ①/A1b。

**observe 契约**（readonly——摘要不灌全量）：目标 = 父自身 spawn 的异步子代理池条目（`_asyncSubagents`，非 advisor / escalate）；数据源 = `entry.childAgent`（`_fullHistory` 最近 N 条回合摘要 + `_touchedFiles` + dispatch in-flight `_inflightTools` 当前工具 + turn / maxTurns）；**不读写 token / designId**。

**send 契约**（控制类豁免——父回合内显式调用即授权）：仅**运行中异步子代理**可注入——消息 push 进 `entry._injected`，子回合边界消费 → `pushReal` 成 user 回合进子历史 → 子代理按**普通用户指令**处理（注入不等同偏离豁免——子收敛 / 审计纪律不变）。sync / queued / settled / cancel / 未知 id → 明确错误。**send→settle 竞态**：入队后子代理在下一回合边界前 settle → 消息未投递，settle 收尾附「undelivered」提示（防父误以为引导已落地）。

**cancel 判断纪律（逐字锚）**——`subagent` 工具 cancel 描述尾句：

> Cancel is a last resort: verify alarming signals with reliable checks (git/node — not guesses) first;
> prefer scoped recovery (restore a single affected file) over killing the child — a running child's
> in-flight work dies with it, partial changes stay unmerged and unaudited.

**sync 定向中止（SYNC-CANCEL）**：

- **面**：CLI TUI **顶层 sync 块**运行中 ⏹ 可点——定向中止（只停子代理，父回合继续拿 stopped 报告）；嵌套层无独立 ⏹ 面；
  VSC webview 同步 spawn 块 ⏹ = 按 `syncLive` 门控（宿主只读采样核 `_syncChildAborts` registry——X10 甲案；
  **判据 / 门控 / 路由三条已落，产者侧序缺陷致运行期未达 ⇒ 降级登记**——见 `WEBVIEW.md` §5.2 与批档 `docs/batches/2026-09-20-display-parity-batch.md` §5.18-1）——
  点击 ⇒ 宿主 sync 分支（`thincoder-vscode/src/extension/panel-messages-turn.mjs` `handleCancelSubagent`）经核 `cancelSyncChild` 单源直连（与 CLI 同法）；`action:"cancel"` 只对 async 池 / advisor 池。
- **信号链**：`armSyncChildAbort` 建**自属** `AbortController` 并链到基信号 `buildChildSignal`（`_sessionSignal ?? ctx.signal`）；
  注册 `parent._syncChildAborts`（Map，key = relayPrefix 去尾 `role#N`）——try / finally **三路径注销**。
- **catch 三分支**（纯函数 `classifySyncAbort(ctxSignal, baseSignal, ctrlSignal, err)`）：① base / ctx aborted → 整回合停，rethrow；
  ② `AbortError` ∧ ctrl aborted ∧ 非整回合停 → **折叠**（`mergeChildMutations` + stopped partial 报告 + `⟦ev⟧stopped` 直发 + 正常 return）；③ 其他错误原样。
  `STOPPED_MARK`（定义 = `thincoder-core/agent/child-marks.mjs`——`spawn-child.mjs` 再导出；与 `TURN_CAP_MARK` 同族）= 折叠报告公共锚。
- **TUI 面板门控**：按 `_syncChildAborts` 存在性 + queued 臂判 ⏹ 可见；⏹ 顺带 deny 该 child 的 pending 权限 / continue 模态。
- **日志面**（2026-09-17 af 批二轮 fix · F-12）：⏹ 定向中止在 `cancelSyncChild` **提交点**（`entry.stopped = true` + `ctrl.abort({ abortTrigger:"cancel", abortDetail:"sync-child-cancel" })` 之后、`return { status:"cancelled" }` 之前）**直记一条**
  `logEvent("ev:cancelled", { id: k })`（`k` = registry 键 `role#N`——与异步取消族**同事件名 / 同字段形**；口径 = `docs/core/design/LOGGING.md` §6.2）；error 两分支（`stopped` 后再调 / registry miss）**零记录**（无取消发生）。
  该 child 的阻塞 spawn 面照旧**另记** `child:done`（kind `partial`——折叠报告撞 `STOPPED_MARK`；`thincoder-core/agent-tools/subagent.mjs`）——两记录分属**取消面 / spawn 面**（不合并、不去重）；
  「异步 running 取消以 `ev:cancelled` 取代 `child:done`」的互斥口径**不适用**本面（sync 无 settle 链）。
  ⏹ 面今日唯一调用处 = CLI TUI mouse（VSC 无 sync ⏹——本档 §6.7.2 面行在案）；写点落核单点 ⇒ 端侧他日接路自动继承。

### 6.7.3 async 子代理（后台并行）

**缺省 async**：`asyncFlag = asyncArg ?? (depth === 0)`——**depth-0 缺省 async（全角色）**；depth>0 缺省 sync（子代理内部强制同步）；`async:false` 显式覆盖（depth-0 参数合法；顶层行为受提示词 / 工具描述约束——§6.7.5）。

**async 分支**：子代理照常启动（复用 `spawnChild` 管线——relay / turn-cap / 权限 / `mergeChildMutations` 全不变），父侧不 await——`_asyncSubagents` 记录 + 立即返回 `{ id, role, status: "running" }`；settle → 报告经自动通道送达（回合尾注入 / 挂起 digest——§6.8）。

**槽位队列 + 分域池**：async 入口检查 running 数（< 域上限 → 立即启动；≥ → 入队 `{ status: "queued", position }`）；任一 running settle → 队列可启动项自动补位（§6.9 / §6.10）。

**settle 统一机制**：四族（subagent / advisor / escalate / consult）settle 公共收尾单点 = `settleAsyncEntry`（`thincoder-core/agent-tools/async-settle.mjs`）：

 - 落 done / status、日志三连、cancelled / parentAborted / 挂起分流、`settleSeq` 唤醒 waiter、腾槽补位（subagent / escalate 族恒补；**advisor 同补（ED-4 起——原「豁免」句废）**；consult 豁免）；
- 守卫统一 `!parentAborted`（严格版：ctx.signal aborted 或条目 controller aborted）；族特有段作 `onAccounting` hook（advisor 陈旧判定 / token 落盘记账；escalate 三分类 merge 决策）；
- **pending 单容器** `_pendingAsyncResults` + role；**done-in-pool 统一表示** = 留池 `done: true` + pending 单容器（`_inPending` 标记防重复移交）；
- **池 accessor** = `getAsyncPool(parent, role)`；**`buildChildSignal`** = `_sessionSignal ?? ctx.signal ?? null` 单点。

### 6.7.4 子代理零 git

**全部 explore / plan（及审计）子代理零 git**：不注入 git 上下文、不承诺 git 命令、工具集无 git——子代理证据链只含「任务书 + 磁盘当前状态（read / glob / grep）+（审计时）`_touchedFiles` 机械并集」。顶层主 agent 的 git 上下文保留（`AGENT-LOOP.md` §6.3）。
动机：git 是污染源（`git diff HEAD` 不见已提交修复、untracked 新文件不可见、`status` 是全工作区脏状态）——比没有 git 更危险。与 advisor 零 git 同构——**双物理防线**（工具不存在 + 不注入）。

### 6.7.5 `check` 删除与 async 锚句

`action:"check"`（阻塞取回 async 报告）已**删除**——check 是冗余 API：异步 = 后台跑 + 结果自动送达，没有「异步拉起再等它」的路径；删后无「拉回阻塞」动作，模型不再自发轮询钉死回合。结果自动通道不受影响（done 条目无人工消费后自动通道照常接管）。consumed 墓碑保留（`dependsOn` 的「consumed id 视为已满足」）。

**async 锚句（逐字定稿——双端照抄，fail-when-unchanged）**：

> After an async spawn the turn winds down normally — nothing expects you to wait for it: the child runs in the background and its report is delivered to you automatically — before your next turn, or digested in the suspension session — so end the turn; do not poll or wait for the result.
> Top-level spawns are ALWAYS async — never pass `async:false` at depth-0 (the report arrives automatically; if your next step needs it, end the turn and let the digest deliver it). Inside subagents (depth>0) spawns are always synchronous (platform rule).

**顶层一律异步**（2026-09-08 用户裁定）：规则覆盖 `spawn` / `escalate` / `advisor`——三者的顶层同步例外全移除；`async:false` 在 depth-0 仍平台合法（机制零触碰），但提示词与**工具描述**不引导（工具描述面 = 项目仓内文件，是模型的最大引导面）。

### 6.7.6 工程交付协议（eng-coder——概览）

> 完整协议（内部闭环步骤 / 收敛计数 ≤5 / 任务域授权 / 审计任务书独立性 / 报告终态）→ `docs/core/design/ENGINEERING-MODE-V2.md`（工程模式档——v1 设计档已归档；批次档协议 = `BATCH-RECORD.md`）；本节只述本机制关系。

- **eng-coder 默认 async**：spawn 即返回 → 主回合结束进挂起 → 交付 settle → digest 注入消化；主会话无跨 digest 状态机。
- **eng-coder 内部 spawn 受限**：只允许 explore role + 同步（机械层——防内部递归 spawn eng-coder 无限嵌套）；非 explore / async → 工具层拒绝。
- **任务域授权**：spawn 时刻授权（用户已批准设计 + 任务）；内部写操作自动放行（豁免粒度仅 `onPermissionRequest` 阶段；planMode / design-token 等前置门照常）；域外写仍受纪律约束——交付偏差审计兜底。
- **收敛与终态**：内部 explore 偏差审计 + advisor 复评闭环；修正轮共享计数 ≤5；报告自述 `clean` 或 `stalled`。
- **审计效率**：审计 explore thoroughness = **quick**（非广度探索）+ 机械预算句（只读 `_touchedFiles` 文件 + 任务书点名节，预算 ≤10 工具轮）。
- **文档漂移处置**：eng-coder **永不编辑设计文档**（设计文档是输入非交付物）——真实漂移写入交付报告 / stalled 注记，修订归设计者 / 父侧（防子代理改文档洗审计）。
- **偏差审计四类**（对照设计逐条查）：**部分实现 / 静默简化 / 文档漂移 / 超清单改动**——「超清单」判据 = 改了且未报告 = 偏差（静默越权）；**已报告 = 透明可接受**（清单外改动允许但必须逐项报告）。

## 6.9 文件域调度器（`files` / `dependsOn`）

> 权威 = `thincoder-core/agent-tools/subagent-scheduler.mjs`。**机制**：父代理只声明域与依赖、提交即走——调度器保证同文件串行、依赖有序、并发不误伤。

- **`files?: string[]`**——写域声明（纪律：清单外改动允许但必须逐项报告；不做任务书文本自动解析）。**目录声明不支持**（`normalizeFileList` 对以 `/` 或 `\` 结尾 / 指向既有目录 → 抛明确错误，fail-closed）。归一化：相对 cwd 转绝对 + 正斜杠 + win32 小写比较键。
- **`dependsOn?: string[]`**——子代理 id 列表（显式依赖）。
- **`batchDoc?: string`**（eng-coder spawn **门禁参数**——非调度参数，不参与冲突判定）：工程模式 spawn `role="eng-coder"` **必传**（批次档路径）；判据 = 参数在 + `resolve(cwd, batchDoc)` 存在且为文件（**不校验内容 / 措辞**）；缺失 / 不可读 → spawn 拒绝（校验落点 = `buildSpawnChild`——token 门之前，sync / async 两路共经）。
- **准入（spawn 时）**：(running ∪ queued) 有 files 交集 或 `dependsOn` 未 done → 入 queued（waiting-deps 态记原因）；否则立即 start。**仅 async 参与调度**：sync spawn 带 `files` / `dependsOn` 且命中冲突 → **明确错误**（不队列化）。
- **动态文件域**：冲突判定的「他条目域」= `effectiveFiles(e)` = 声明域 ∪（running 且已绑 `childAgent` 时的 `childAgent._touchedFiles`——写工具批提交实时记录）；queued 条目无 `childAgent`（start 才绑）⇒ 天然只声明域。out-of-list 写入由此获得域保护。
- **补位（`maybeRefillAsync`）**：settle / cancel 释放槽后从 queued 选「依赖全满足 + 域无冲突」的最早条目启动到槽满（先入者优先）。
- **终态守卫（2026-09-17 af 批 · c1——族无关单点）**：补位**永不启动终态条目**——判据（逐字）`entry.cancelled === true ∨ entry.done === true` ⇒ 跳过（不 `start()`）；
  单点谓词 = `entryTerminal(entry)`（`thincoder-core/agent-tools/subagent-scheduler.mjs`，与 `queueRunnable` 同址），两消费点 = 子代理族 `queueRunnable`（`maybeRefillAsync` 经它判）· 评审族 `refillAdvisorQueue`。
  **动机（台账 #31 可达面）**：取消后条目若仍留队列（出队未生效面——#21 的 VSC 合成 parent 下 `dequeueAdvisor` no-op 即此形），补位会把它 `start()` 重启——
  这正是「已取消条目事后仍被 settle ⇒ 幻影冻结块」的**唯一燃料**；守卫落地后该燃料族无关地消失。
  **边界**：守卫**只跳过、不剔除、不重编号**（队列内容零副作用）；终态条目滞留队列面今日 CLI 不可达（出队恒生效）、VSC 面经 §6.10 ④ 载体吸收亦零残留——实现轮若发现可达则同式剔除并回报。
- **同文件串行序判定（防互等）**：域冲突阻断**只适用「先入者」**（id 数值比较——spawn 序递增）与 running；**后入者不阻断**——避免两个 queued 同文件互等死锁。running 永远阻断。
- **依赖终态释放**：依赖在目标 settle（任何终态）或条目移除时视为满足；依赖取消 / 失败 → 依赖者留 queued 标 `dependency-cancelled` + 注入提醒供模型决策（仅父侧显式处置或 AUTO 档才自动启动——滞留有意、显式可清、不静默）。
- **`dependsOn` 成环 → spawn 拒绝**（防御断言）；**unknown id → 拒绝**（明确错误）。
- **停滞机械检测（`detectStall`）**：池无 running 且 queued ≥1，且每 queued 的 blocker（files 冲突者 + 未 settle 依赖目标）都落在 queued 集内（阻塞闭包无外逃）且无 dep-cancelled 标记 → status 视图标记停滞 + 逐条阻塞链 + 引导 cancel 破环（保守不误报）。
- **排队面板 UX**：任何排队 spawn 在 spawn 返回时立即建面板块（`⟦ev⟧queued` / `cancelled` 事件 token）——块头标注 `[▶ role#N · waiting] waiting for: …` / `queued · position N`；启动后转 running（同 key 不重建）。
- **父侧文件拦截（R26）**：父侧维护文件（`CHANGELOG.md`——老 `todo.md` / `todo-archive.md` / `checklist` 族随 M2 台账 SQLite 化 + M7 废除退役）**不得列入 files 声明**——黑名单机械校验（归一化后 basename 全名匹配 + 大小写不敏感，路径任意层）→ 声明含任一 → 拒绝 + 英文提示（fail-closed，校验先于调度器）。**设计文档仍可声明**（eng-coder 落实现记录是常态——不误伤）。

## 6.12 子代理 abort 来源标注（可诊断性）

**单一权威源** = `thincoder-core/abort-provenance.mjs`（纯函数、零 import——任意层可引、无环）。

**trigger（枚举 5 值）**：

| trigger | 判据（`signal.reason`） | 发起面 |
|---|---|---|
| `user` | `reason.interrupt === true` | Ctrl+C 停回合 / Ctrl+I / ACP cancel |
| `timeout` | `reason.name === "TimeoutError"`；或 `reason.abortTrigger === "timeout"` | 读侧 idle / proxy 定时器 / consult watchdog |
| `cancel` | `reason.abortTrigger === "cancel"` | 池 cancel / sync ⏹ / 评审 cancel |
| `stop` | `reason.abortTrigger === "stop"` | 全停 / 清池 / consult 会话停 |
| `unknown` | reason 缺失且错误无 `abortInfo` | **诊断告警态**（残留 / 未标注路径——必须显式呈现，不得静默） |

**layer（枚举 3 值）**：`provider` / `agent` / `settle`；未标注错误回落 `unrecorded`（合成器兜底 token——计入 unknown 告警形态）。

**求值链（一处写死；`deathLine` / `annotateAbort` 共用）**：`err.abortInfo?.trigger`（已标注 ⇒ 直取）→ 否则 `triggerOf(signal)`（信号域）→ 否则 `err.name` 兜底（`TimeoutError` → `timeout`；`AbortError` → `unknown`（告警））。归属：标注域归产生点与 `annotateAbort`；信号域归 `triggerOf`；兜底归合成器。

**reason 形态（4 形态——就地扩展，向后兼容）**：① `{ interrupt: true(, message) }`（既有——user 面）；② `TimeoutError`（Node 原生——timeout 面）；③ `{ abortTrigger: "cancel"|"stop"|"timeout"(, abortDetail) }`（新增——程序性取消 / 停止 / 定时器）；④ 缺失（→ unknown）。既有 `reason.interrupt` 判据点**零触碰**（新增形态不含 `interrupt` 键）。

**模块接口**（纯函数、零 import——任意层可引、无环）：

- `TRIGGERS`（枚举权威，计数 5）；`triggerOf(signal)`（按判据序判定）；`deathLine(err, signal)`（报告面合成器）。
- `abortError(signal, layer, detail)`（产生点：`AbortError` + reason 透传 + `abortInfo` 标注）；`timeoutError(message, layer, detail)`（定时器面）。
- `annotateAbort(err, signal, layer, detail)`（外部错误补标——缺 `abortInfo` 才补，不改 name / message；`detail` 载站点名短串；缺省回落 `unrecorded`）。

**死亡行形态（合成器输出——fail-when-unchanged 断言锚）**：`<原 message>[ ← cause: <cause.message>][ · abort(<trigger>@<layer>:<detail>)]`。

- 原 message 前缀**逐字保留**（零回归——既有前缀 / 包含断言不受影响）；
- 后缀出现条件 = `err.abortInfo` 存在 ∨ `signal?.aborted` ∨ `err.name ∈ { AbortError, TimeoutError }`；
- unknown 形态（告警）= `· abort(unknown@<layer>:no reason on signal)`；未标注回落 `unknown@unrecorded`；总长 ≤300 字符（超长优先截 detail）。

**站点规则（覆盖勘察外漏网）**：**对单个任务目标的定向中止 = cancel；整批 / 会话 / 回合级停止 = stop；用户按键 = user；定时器 = timeout；无标注 = unknown**（unknown 即告警——不得静默）。站点面（产生 / 传播 / 取消停止 / 定时器四类）与报告面合成点（settle 族 5 处）的逐档坐标属**实现面快照**——以本档词汇表 + 模块接口为契约面，坐标随实现演进（旧档 §20 站点总表原文见来源档）。

## 6.21 spawn 站点取号断言（防静默覆写）（2026-09-16 · 批 8 ENGINE-DEBT · ED-5）

### 6.21.1 问题陈述与现状坐标（as-of 2026-09-16 实读）

- **消费点直读、零断言**：`thincoder-core/agent-tools/subagent-run.mjs:53` `const id = parent._subAgentCounter`——取号与消费之间**无断言**；
  紧接 `:181` `parent._asyncSubagents.set(String(id), entry)` 入池。
- **失败链（已自陈）**：某 spawn 站点**漏调** `nextSubagentId` ⇒ `:53` 读到**陈旧 counter** ⇒ `:181` 用同键 `set` **覆写**旧条目
  ⇒ **静默丢报告 + status / cancel 错址**——病征由分配器本体注释自陈（`subagent-scheduler.mjs:379`）。
- **现状保障 = 约定 + 测试，非运行期强制**：取号公式与「必先调分配器」的约定见分配器本体（`:374-386` 注释 + `:387-399` 实现）；
  保障仅由用例族锁定**已知**链路（`thincoder-cli/test/subagent-scheduler.test.mjs:161-172` 分配点前缀号 ≡ ack id ·
  `:105-139` 分配器表单测 · `thincoder-core/test/async-family.test.mjs:83-94` 两形同读 · `thincoder-vscode/test/subagent-id-counter.test.mjs` 镜像面）。
  ⇒ **新增第四族 / 新站点漏调时无任何机械拦截**（现状 = 静默数据损坏，不是显式报错）。
- **取号站点（现行 3 族 + 旧同步族）**：`subagent-spawn.mjs:445`（async 分支，取号 → `subagent-run.mjs:53` **回读** counter）·
  `escalate-async.mjs:157`（取号 → `:285` 入池，用**本地 id**）· `advisor-async.mjs:270`（取号 → `:326` 入评审池，用**本地 id**）·
  `agent/spawn-child.mjs:78`（旧同步族自增，**不进池**）。
- **入池点共 3 处**：`subagent-run.mjs:181` · `escalate-async.mjs:285` · `advisor-async.mjs:326`——**三处皆无键重复守卫**。
- **约束（分配器自陈）**：`subagent-run.mjs` 消费为**同步直读**（`subagent-scheduler.mjs:383-384` 注「分配与消费同步——无 await 间隙」）——
  本条目的断言形态据此选型（见 §6.21.2 候选 1 的代价栏）。

### 6.21.2 方案选型对比

| # | 候选方案 | 判据逐项评估（①运行期显式报错 ②零回归 ③不改 id 语义 ④最小面） | 取舍（选定代价 / 权衡） | 结论（选定 / 否决理由） |
|---|---|---|---|---|
| 1 | **一次性取号令牌 + 入池键守卫**：分配器写令牌 `parent._lastSubagentId = next`；消费点断言同号后清令牌；三入池点前置 `has(String(id))` 守卫 | ①✓ 两处皆**抛错**（漏调 / 覆写各一）· ②✓ 正常路径零改 · ③✓ 公式与载体不动 · ④✓ 核侧 4 文件小改 | 代价 = 新增一个约定字段 + 两句断言；**成立前提 = 取号 → 消费同步**（已实读成立：`subagent-spawn.mjs:445` → `subagent-run.mjs:53` 无 await）；跨 await 取号站点令牌不适用 ⇒ 由键守卫兜底（登记为约束，见 D-SUB-ID2） | **选定** |
| 2 | 仅入池键守卫（无令牌） | ①半——抓到「键已存在」，抓不到「漏调分配器」本身（漏调而 id 恰好不撞键 ⇒ 静默通过，id 语义漂移不可见）· ②✓ · ③✓ · ④✓ | 覆盖窄于判据①措辞（「未调分配器即消费 ⇒ 报错」） | 否决（判据①不满足） |
| 3 | id 显式传参（改 `executeAsyncSpawn(..., idOverride)` 接口） | ①✓ · ②✗ 3 族调用点 + VSC 镜像面同改 · ③✓ · ④✗ 接口面扩张 | 面大且触及既有签名 | 否决（本轮范围 = 仅加固；接口改建另案） |
| 4 | 在分配器内断言 counter 新鲜（陈旧即报错） | ①✗——分配器职责恰是**池活续号兜底**（旧值自愈，`:396` `max(counter ?? 0, poolMax) + 1`）⇒ 断言与其设计语义直接冲突 | — | 否决（语义冲突） |

### 6.21.3 接口契约

- **新增约定字段（核私有，非对外 API）**：`parent._lastSubagentId`（`number | undefined`）。
  - 写：`nextSubagentId(parent)` 在 `:397` 回写 counter 的同一原子段内**同步**写令牌 = 返回值。
  - 读：消费点断言 `parent._lastSubagentId === id`，**断言通过即置 `undefined`**（一次性——消费即失效，防同一令牌跨站点复用）。
  - 失配 ⇒ `throw new Error(...)`（文案含「allocator not called (nextSubagentId)」语义 + 站点名 + `role#id`）。
- **入池键守卫（三入池点同族）**：`set` 前断言键不存在（`has(String(id)) === false`）；命中 ⇒ `throw new Error("subagent id collision: <role>#<id> already in pool")`。
- **数据流（不变式）**：spawn 站点 → `nextSubagentId`（写 counter **且** 写令牌）→（同步）消费点读 counter + 断言令牌 → 入池键守卫 → `set(String(id), entry)`。
- **零改面**：取号公式（`subagent-scheduler.mjs:396-397`）· 载体字段名 `_subAgentCounter` · 池键形态 `String(id)` · relay 前缀（`relayPrefixOf`）· VSC 镜像载体 ·
  `_asyncQueue` / position / 补位 / describeBlockers / detectStall 语义。

### 6.21.4 受影响文件清单（R24a · 行数口径 = `wc -l`（换行符计数））

| # | 文件 | 当前行数 | 预计增量 | 说明 |
|---|---|---|---|---|
| 1 | `thincoder-core/agent-tools/subagent-scheduler.mjs` | 398 | +4 | `nextSubagentId` 写令牌（`:396-399` 内）+ 注释句 |
| 2 | `thincoder-core/agent-tools/subagent-run.mjs` | 202 | +8 | `:53` 令牌断言 + `:181` 入池键守卫 |
| 3 | `thincoder-core/agent-tools/escalate-async.mjs` | 295 | +6 | `:157` 令牌断言 + `:285` 键守卫 |
| 4 | `thincoder-core/agent-tools/advisor-async.mjs` | 357 | +6 | `:270` 令牌断言 + `:326` 键守卫 |
| 5 | `thincoder-cli/test/subagent-scheduler.test.mjs` | 182 | +34 | **T5-4–T5-7**（令牌单次性 + 两反证 + 兄弟族）——宿主二选一：同档追加（与 ID-COUNTER 链路族同宿主）或核侧新档（实现轮定，见批 8 §2.10 续办） |
| 6 | `thincoder-core/agent-tools/subagent-spawn.mjs` | 459 | 0 | **零改**（取号站点已在位——只读核对面） |

### 6.21.5 关键决策记录

- **D-SUB-ID1（断言族 = 令牌 + 键守卫双管）**：令牌抓「漏调分配器」，键守卫抓「覆写」——二者互补；**否决**候选 2（仅守卫）/ 3（接口传参）/ 4（分配器内断言）。
- **D-SUB-ID2（令牌 = 同步配对语义）**：令牌生命周期 = 取号 → 同步消费（实读前提：`subagent-spawn.mjs:445` → `subagent-run.mjs:53` 无 await 间隙）。
  **跨 await 的新取号站点**令牌不适用 ⇒ 该站点以键守卫兜底，并在站点处显式登记（**不**把令牌扩为多槽 / 计数池——那会使失效面变复杂、误报面变大）。
- **D-SUB-ID3（报错形态 = 抛 `Error`，fail loud）**：**否决**降级为日志 / 静默改号——静默改号恰是掩盖「漏调」这一被断言对象，与判据①相反。
- **D-SUB-ID4（范围 = 仅核侧）**：VSC 侧同机制复用核实现（`thincoder-vscode/test/subagent-id-counter.test.mjs` 只读复测），本条目零 VSC 写入。

### 6.21.6 用例表（正常 / 边界 / 错误）

| # | 用例 | 输入 | 期望输出 | 回指 |
|---|---|---|---|---|
| T5-1 | 正常·async spawn 标准链路（取号 → 消费 → 入池） | 标准 parent（池空） | ack `id` ≡ relay 前缀号 ≡ 入池键；零抛错；令牌消费后为 `undefined` | F-B6 |
| T5-2 | 正常·池满入队链路连续 5 次 | 池内 4 running | id 严格递增无覆写；`position` 1..n 正确（既有语义零改） | F-B6 |
| T5-3 | 边界·counter 丢失面（`_subAgentCounter` 未定义 + 池活 4） | 池 max = 4 | id = 5（分配器兜底）+ 令牌同号 ⇒ 断言通过（既有语义不变） | F-B6 |
| T5-4 | 边界·令牌单次性：同令牌二消费 | 手工二次调消费点 | 第二次**抛错**（令牌已清） | F-B6 |
| T5-5 | 错误·**漏调分配器**（反证）：直接调 `executeAsyncSpawn`，counter 陈旧 | counter = 3（池空） | **抛错**（令牌不匹配）——不得静默入池 | F-B6 |
| T5-6 | 错误·**覆写**（反证）：同 id 二次入池 | 池已有键 `"3"` | **抛错**（collision guard） | F-B6 |
| T5-7 | 错误·兄弟族同族断言：escalate / advisor 漏调分配器 | 各自站点 | 同 T5-5 形态抛错（两族各 ≥1 用例） | F-B6 |
| T5-8 | 零回归·既有 ID-COUNTER 链路 | 既有夹具 | `thincoder-cli/test/subagent-scheduler.test.mjs:161-172` 逐条绿 | F-B6 |

### 6.21.7 验收标准（逐条回指）

| # | 验收标准（可机检） | 回指 |
|---|---|---|
| A1 | 漏调路径**必红**：T5-5 / T5-6 / T5-7 三例断言抛错（`assert.throws`——非静默通过） | 批 8 E5 判据①② |
| A2 | 断言在位可机检：`subagent-run.mjs` / `escalate-async.mjs` / `advisor-async.mjs` 消费点各含令牌断言、三入池点各含键守卫（grep 断言句 + 抛错分支） | 批 8 E5 判据① |
| A3 | 零回归：`thincoder-cli/test/subagent-scheduler.test.mjs:161-172` 绿 + 分配器单测族（`:105-139` / `thincoder-core/test/async-family.test.mjs:83-94` / `thincoder-vscode/test/subagent-id-counter.test.mjs`）绿 | 批 8 E5 判据②③ |
| A4 | 范围守恒（机检）：diff 不触取号公式行（`subagent-scheduler.mjs:396-397`）与池键形态（`String(id)`）；`thincoder-vscode/**` 零写入 | 批 8 E5 范围句 |
| A5 | 触碰源档 ≤500 硬限；越软线档在档内登记（含拆分计划） | R24a |

### 6.21.8 边界（本条目不做）

1. 不改 id 语义 / 分配算法 / 取号公式 / 池键形态 / relay 前缀形态；不新增第四条池。
2. 不做 VSC 侧写入（镜像面只读复测）；不改 VSC 测验夹具。
3. 不改 `_asyncQueue` / position / 补位（`maybeRefillAsync`）/ `describeBlockers` / `detectStall` 语义。
4. 不改令牌为多槽 / 计数池形态（D-SUB-ID2）；不做跨进程 / 槽持久化。
5. 不迁 `DOC-MIGRATION.md:63` 所记「取号公式句并入 `AGENT-LOOP.md` 子代理池节」（迁移 = 另案）。
6. 不解 ED-4 排队面（§6.10 / §6.11）与 ED-1 / ED-2 / ED-3 条目内容——互不耦合。

## 6.22 委派与 spawn 门（v2——M5 增量）

**定位**：委派治理的**结构承载**——任务书必须带齐字段（尤其「轮次」），files 声明面拦截兜住越界面——瞎下的指令被门拒，而不是被自觉忽略。v1 已有 `batchDoc` 参数门与 token 门，v2 增量 = 任务书强制字段 + files 声明面拦截。

**门序（spawn 入场判完，调度器只按 files/dependsOn 排队）**：角色 enum 校验（F5）→ batchDoc 门（F1，继承）→ round 字段（F2）→ token 门（继承）→ files 声明面（F6）。

| # | 功能点 | 方案 |
|---|---|---|
| F1 | `batchDoc` 参数门 | **继承**（缺参 / 路径不可读 → 机械拒；判据只到「参数在 + 路径可读」，内容由执行者拒收兜底） |
| F2 | 任务书强制字段（目标与理由 / 轮次 initial\|fix / 已知事实 / 设计要点与禁止范围 / 验收标准 / 交付报告格式） | **新增结构化 spawn 参数 `round`**（enum；必带集合 = eng-coder/eng-designer，explore/advisor 豁免——勘察与评审不带实现轮次语义）；`validateTaskBookFields(args)` 六强制字段 + round 枚举校验 |
| F5 | 角色 enum 校验 | 工程模式 enum = **explore / eng-designer / eng-coder**（advisor 不入——评审走 advisor 工具通道，不入 spawn 通道；`plan` 不入——工程模式无 plan 角色，normal 模式 `plan`/`coder` 不删） |
| F6 | files 声明语义 | `files` = 预期触碰面（内容产物：源/测试/设计档）；**不列工程工具面（`scripts/**`）**、不列过程档（台账/CHANGELOG）；目录声明已被 `normalizeFileList` 拒（继承） |

**落点**：全部新增门禁逻辑统一落 `thincoder-core/agent-tools/spawn-gates.mjs`（`validateTaskBookFields` / `rejectEngineeringFilePaths`）——`buildSpawnChild` / `normalizeFileList` 只加 import 调用（装配点增量 ≤10 行；as-of 2026-09-17 实测 `subagent-spawn.mjs` 484 行——**as-of 读数 · 本批不追值**（统一归实现轮；登记见 §6.27.12.7 尾注④）。

**验收（回指 AC-M5）**：

| # | 判据 |
|---|---|
| AC-M5-1 | 缺 `batchDoc` 或路径不可读 → 拒 |
| AC-M5-2 | 任务书缺任一强制字段 → 拒（缺「轮次」→ 期望拒） |
| AC-M5-5 | `files` 声明目录 / `scripts/**` / 过程档 → 拒 |
| AC-M5-6 | 角色 enum 非法 → 拒（工程模式 enum = explore/eng-designer/eng-coder） |

**边界（本增量不做）**：不做实现（eng-coder 职责）；不做 token 签发（M6）；不重写调度器本体（继承 v1）；不判断「任务大小」（零裁量——工程模式下所有请求走全流程）。

## 6.23 M 家族小散件收正（2026-09-18 · 批 M-FAMILY-SWEEP · 条目 ①②）

**定位**：M5 委派面两处「声明与实况不符」的收正——① 工具描述句（**模型可见面**）与工程模式角色 enum（同为模型可见面）；② `round` 枚举单源（**契约值面**）。
批次档 = `docs/batches/2026-09-18-m-family-sweep.md` §1.1 条目 ①②；同批条目 ③（VSC 测试登记死项）= `TESTING.md` §10.1。

### 6.23.1 问题陈述与现状坐标（as-of 2026-09-18 实读）

| # | 缺陷 | 现状坐标（实读） | 权威裁定 |
|---|---|---|---|
| ①a | 描述句称工程模式暴露 `plan` | `thincoder-core/agent-tools/subagent.mjs:133` 逐字「Mode filtering: normal mode exposes explore/plan/coder; engineering mode exposes explore/plan/eng-designer/eng-coder. The schema enum reflects the active mode.」 | §6.22 F5（「`plan` 不入」）+ 运行期门 `subagent.mjs:245` |
| ①b | 工程模式**装配 enum** 同样含 `plan` | `thincoder-core/agent/family-tools.mjs:46` = `["explore", "plan", "eng-designer", "eng-coder"]` | §6.22 F5 逐字「工程模式 enum = **explore / eng-designer / eng-coder**」 |
| ② | `ROUND_VALUES` 单源不实 | 导出（`thincoder-core/agent-tools/spawn-gates.mjs:27`）**无生产消费方**：schema 面（`agent-tools/subagent.mjs:154`）与谓词面（`spawn-gates.mjs:50`）各持一份字面量；唯一 import = 本包测档（`thincoder-core/test/spawn-gates.test.mjs:17`，用例名 `:81` 称「schema enum 同源单点」） | §6.22 F2（`round` = 结构化契约参数）+ D2 单一权威源 |

**①a/①b 为何同批改**：两者都是**派单依据**（描述句与 schema 都进模型上下文）。只改描述句 ⇒ 「可见但不可用」的诱饵值留在 enum 面，同一缺陷换面存在（等于给症状换位置，不是修结构）。
门 `:245` 的错误文案自称「the engineering-mode enum is explore / eng-designer / eng-coder」——代码内部已自相矛盾（`family-tools.mjs:46` vs 门文案）。
**② 的实害**：`round` 合法值集合有两份实体 ⇒ 增删值只改一处即**静默分叉**（schema 允许而谓词拒，或谓词放行而模型看不见）；用例名所称的「同源单点」当前不成立。

### 6.23.2 方案选型对比

| 面 | 候选 | 判据 | 结论 |
|---|---|---|---|
| ①b enum | A 保留 `plan` + 描述句写明「运行期会拒」 | F5 已裁定 enum = explore/eng-designer/eng-coder；`plan` 在工程模式**零合法用途**（勘察用 `explore`）；A 保留一处诱饵值 | **B 选定** |
| ①b enum | B enum 收正为 F5 集 `["explore","eng-designer","eng-coder"]` | 与门/门文案/F5 三处一致；正常模式 enum 不动（F5：normal 不删） | **B 选定** |
| ② 单源 | A 删导出 + 用例名收正（承认两份字面量） | 保留分叉面，只删掉「同源」的声明——缺陷仍在（下一个人仍会改一处） | 否决 |
| ② 单源 | B 真单源：schema `enum` 引用 `ROUND_VALUES`，谓词同用该常量 | `round` 是契约值 ⇒ 两处**必须恒等**；`spawn-gates.mjs` 是零 import 叶子（`spawn-gates.mjs:9`），`subagent.mjs → spawn-gates.mjs` 单向（无环、叶子性质不变） | **B 选定** |
| ①a 文案 | 陈述「模式 → 可派角色」（门的取舍） | 描述句陈述**门的取舍**（真值来源 = 门），enum 过滤机制另句说明；避免描述句随装配实现漂移 | **选定** |

### 6.23.3 接口契约（改前 → 改后 逐字）

| 落点 | 改前 | 改后 |
|---|---|---|
| `agent-tools/subagent.mjs:133` | `Mode filtering: normal mode exposes explore/plan/coder; engineering mode exposes explore/plan/eng-designer/eng-coder. The schema enum reflects the active mode.` | `Mode filtering: normal mode exposes explore/plan/coder (eng-coder and eng-designer are refused); engineering mode exposes explore/eng-designer/eng-coder (plan and coder are refused — plan is a normal-mode role, coder is replaced by eng-coder). The role enum is filtered per mode at assembly, and the spawn gate refuses out-of-mode roles mechanically.` |
| `agent/family-tools.mjs:46` | `enum: ["explore", "plan", "eng-designer", "eng-coder"],` | `enum: ["explore", "eng-designer", "eng-coder"],` |
| `agent-tools/subagent.mjs:154` | `round: { type: "string", enum: ["initial", "fix"], … }` | `round: { type: "string", enum: ROUND_VALUES, … }`（+ 顶部 `import { ROUND_VALUES } from "./spawn-gates.mjs"`） |
| `agent-tools/spawn-gates.mjs:50` | `if (a.round !== "initial" && a.round !== "fix")` | `if (!ROUND_VALUES.includes(a.round))`（错误文案**逐字不变**：`round (initial\|fix)` / `round ∈ {initial, fix}` 由常量拼出，输出同形） |

**零改面**：`family-tools.mjs:48` 的 suffix 句（现状准确）· `subagent.mjs:229` ROLES 白名单（`plan` 必须仍在——门文案要能指名拒绝）· 门文案 `:242`/`:245`/`:248`/`:254` · `rejectEngineeringFilePaths` 谓词 · 正常模式 enum `family-tools.mjs:51`。

### 6.23.4 受影响文件清单（R24a · 行数口径 = `wc -l`；as-of 2026-09-18）

| 文件 | 现 | Δ | 说明 |
|---|---|---|---|
| `thincoder-core/agent-tools/subagent.mjs` | 408 | +1 → 409 | 描述句 1 行改写（行数不变）+ import 1 行 + schema enum 换常量引用（行数不变）；距 500 硬限充裕，无需拆分 |
| `thincoder-core/agent-tools/spawn-gates.mjs` | 107 | +2 → 109 | 谓词改用常量 + `ROUND_VALUES` 注补「单源」句 |
| `thincoder-core/agent/family-tools.mjs` | 169 | ±0 | enum 一行内改 |
| `thincoder-core/test/spawn-gates.test.mjs` | 141 | +8± → **实测 155** | import `subagentTool`；`ROUND_VALUES` 用例改「单源锁」（引用同一性 + 字面量锁 + 成员逐一放行）+ U7 门零回归用例 6 行（实施轮实测收正，2026-09-18） |
| `thincoder-core/test/family-tools.test.mjs` | 118 | ±0 | 工程模式 enum 期望值一行内改 |
| `thincoder-cli/test/eng-designer-role.test.mjs` | 269 | ±0 | T30 两行断言：描述句 regex 换新句 + 工程模式 enum 期望值 |

**拆分计划（超档项）**：

- `thincoder-core/agent-tools/subagent.mjs`（**409——已越 300 软线**；本批改动 = 描述句换新 + schema 契约行换常量引用 + import 行）：
  候选拆分面 = spawn 同步阻塞段（turn-cap 续跑询问 + SYNC-CANCEL 三分支折叠 + 收尾发射，as-of `:284`–`:385`）抽 `subagent-sync-run.mjs`。
  与既有拆分面（`subagent-actions.mjs` / `subagent-run.mjs` / `subagent-spawn.mjs`）同形（本文件已是 re-export 面，抽段不破对外导出）；**本批只登记不执行**（拆分 ≠ 本批范围——避免夹带）。
- **未触碰**：`thincoder-core/agent-tools/subagent-async.mjs`（279）。

### 6.23.5 关键决策记录

- **KD-M5-7（描述句 = 门的取舍，不是实现快照）**：描述句陈述「哪个模式可派哪些角色」（真值来源 = 运行期门），enum 过滤机制另句说明。理由：描述句进模型上下文，模型需要的是「能不能派」，不是装配实现；句随门走比随实现走稳。
- **KD-M5-8（enum 收正到 F5 集，否决「保留 + 免责句」）**：enum 是模型读得到的派单依据；「可见但不可用」的值 = 系统性误导（模型按 enum 派 `plan` → 被门拒 → 空耗一轮）。F5 已裁定，门文案已自称该集合 ⇒ 改 enum 三处对齐，不改 F5。
- **KD-M5-9（`round` 真单源，否决删导出）**：契约值恒等要求 ⇒ 保留唯一字面量于 `spawn-gates.mjs`，schema 与谓词都引用它；用例从「重述字面量」改为「**接线断言**」（schema enum 与常量同一引用）+ 契约锁（字面量 = initial\|fix）+ 行为面（枚举成员逐一放行）。
- **KD-M5-10（门文案与白名单零改）**：`plan` 留在 `ROLES` 白名单与门文案中（拒收要能指名）——「enum 不收 `plan`」≠「门不认识 `plan`」。

### 6.23.6 用例表（正常 / 边界 / 错误）

| # | 类 | 输入 / 动作 | 期望 |
|---|---|---|---|
| U1 | 正常 | 读 `subagentTool.description` | 含新句（工程模式 = explore/eng-designer/eng-coder）；**不含**旧句 `engineering mode exposes explore/plan/eng-designer` |
| U2 | 正常 | `assembleFamilyTools({ depth: 0, engineering: true })` | role enum = `["explore","eng-designer","eng-coder"]` |
| U3 | 正常 | `assembleFamilyTools`（正常模式） | role enum = `["explore","plan","coder"]`（零回归） |
| U4 | 正常 | `subagentTool.parameters.properties.round.enum` | **=== `ROUND_VALUES`**（同一引用）且 = `["initial","fix"]` |
| U5 | 边界 | `validateTaskBookFields({ task: FULL_BOOK, round: r })`，`r` 遍历 `ROUND_VALUES` | 逐一放行（枚举成员与谓词同源的行为面证据） |
| U6 | 错误 | `round: "v2"` / 缺 `round` | 拒；文案 `round ∈ {initial, fix}` / `round (initial\|fix)` 逐字不变 |
| U7 | 错误 | 工程模式 spawn `role="plan"` | throw（门文案含 `role='plan' is disabled`——门零改） |

### 6.23.7 验收标准（逐条回指）

| # | 回指 | 判据（机检命令 ⇒ 期望） |
|---|---|---|
| A-MS1 | ①a | `cd thincoder-cli && node --test test/eng-designer-role.test.mjs` ⇒ exit 0（T30 断言已按新句改写）；且 `grep -c "engineering mode exposes explore/plan/eng-designer" thincoder-core/agent-tools/subagent.mjs` ⇒ `0` |
| A-MS2 | ①b | `cd thincoder-core && node --test test/family-tools.test.mjs` ⇒ exit 0（期望值 = F5 集）；CLI 侧 T30 ④ 同断言 ⇒ exit 0 |
| A-MS3 | ② | `cd thincoder-core && node --test test/spawn-gates.test.mjs` ⇒ exit 0（含引用同一性断言）；`grep -n 'enum: \["initial", "fix"\]' thincoder-core/agent-tools/subagent.mjs` ⇒ 零命中 |
| A-MS4 | ② | F2 拒收文案零回归：T6/T6b/T6c 原样通过（`spawn-gates.test.mjs` 内同档）；`rejectEngineeringFilePaths` 面（T8 族）零改 |
| A-MS5 | ① | 门行为面零回归：U7 用例（工程模式拒 `plan`）通过 |
| A-MS6 | ①② 全局 | 三包 `npm test`：`thincoder-core` ⇒ exit 0 · `thincoder-cli` ⇒ exit 0 · `thincoder-vscode` ⇒ **失败集合 ⊆ 批前失败集合（批前实测 = {T-V13}）**（等价口径 = 「本批触碰面无新增红」；计数式「≤ 基线 1」不采用——新红 + T-V13 转绿可相互抵消，评审轮 1 #4）。T-V13 归因**并行线在途** `thincoder-core/agent-tools/eng.mjs` 工作树改动——非本批；读数会随该线漂移，以 coder 轮复跑为准 |

### 6.23.8 边界（本批不做）

- 不做 AC-M5 的核验本身（AC-M5-1/2/5/6 = 甲批）；
- 不在正常模式删 `plan`/`coder`（F5 明文：normal 模式不删）；
- 不动 advisor 通道与 `rejectEngineeringFilePaths` 谓词面；
- 不改 `thincoder-cli/docs/**` / `thincoder-vscode/docs/**` 旧档中的同句散文（`docs/README.md` §2 政策：产品树旧档 = **迁移期参照历史**，保留 ≠ 维护；其中仅 `thincoder-cli/docs/design/AGENT-LOOP.md` 与 `thincoder-vscode/docs/design/AGENT-LOOP.md` 载同句——登记为参照历史，不随批改）；
- 不做 VSC 清单的**反向**自检（盘上未登记档 → 拒）——见 `TESTING.md` §10.1「不做」。

## 6.24 VSC 装配面（第三面）enum 收正 + 判据收紧（2026-09-18 · 批 VSC-MIRROR-RETIRE · 条目 ③）

**问题陈述（实测 as-of 2026-09-18）**：§6.22 F5 的收正（批 M-FAMILY-SWEEP）覆盖了核侧两处——描述句（`thincoder-core/agent-tools/subagent.mjs:134`）与核装配 enum（`thincoder-core/agent/family-tools.mjs:46`）；**VSC 端装配面仍含 `plan`**（同一机制的第三面）：

| 面 | 坐标 | 现状 |
|---|---|---|
| VSC 装配 enum（第三面） | `thincoder-vscode/src/agent/setup-tooltable.mjs:216` | `["explore", "plan", "eng-coder", "eng-designer"]` |
| 调用面（depth-0 门） | `thincoder-vscode/src/agent/setup.mjs:277`（门 = `:276` `depth === 0 && t.name === "subagent"`） | 逐轮装配 schema `.role`（与核 `family-tools.mjs:44` 的 depth-0 门同构） |
| 导出缝 | `thincoder-vscode/src/agent/setup.mjs:25`（import）· `:40`（re-export） | 缝零改 |
| 判据面（**假绿**） | `thincoder-vscode/test/eng-designer-role.test.mjs:89-94` | 仅 `includes("eng-designer")` ⇒ enum 含 `plan` 亦过 |

**修法（枚举）**：`setup-tooltable.mjs:216` 的工程分支 enum 逐字收正为 F5 集 `["explore", "eng-designer", "eng-coder"]`（§6.22 F5 的集与序）。**不 import 核常量**——核侧该集是 `assembleFamilyTools` 内的字面量（非导出常量），端侧镜像面按既有形态自持字面量，**同集由判据锁死**（下条）。

**修法（判据 —— 假绿的根治）**：`eng-designer-role.test.mjs:89-94` 的 `includes` 判据改**集合相等**——工程分支 `[...enum].sort()` 与 `["eng-coder", "eng-designer", "explore"]` `deepEqual`；普通分支同法对 `["coder", "explore", "plan"]`。反证面 = enum 再引入任一集外值（如 `plan`）即红。

**边界（本节不做）**：不动 `ROLES` 白名单与门文案（KD-M5-10——门须能指名被拒值）；不动正常模式集（F5 明文：normal 不删）；不动核侧两处（§6.22 已收正）；不动深度门语义（端侧 `:276` 与核 `family-tools.mjs:44` 保持同构）。

## 6.25 动作面 depth 门收口 + 异步面残留两则（2026-09-18 · 批 TOOLFACE-FIXES · 条目 ①②）

**问题陈述与现状坐标（as-of 2026-09-18 实读）**：

| # | 台账 | 面 | 坐标 | 现状（实读） |
|---|---|---|---|---|
| ① | #46 | `subagent` 动作面 depth 门 | `thincoder-core/agent-tools/subagent-actions.mjs:106`（`executeStatusAction`） | **无 depth 门**——读 `getAsyncPool(ctx.agent, …)` = 调用者自己的池；子代（`depth>0`）调用 ⇒ **静默空 overview**（把「不可用」读成「无在飞」） |
| ② | #43-① | 队列剔除读面（第四面） | `thincoder-core/agent-tools/async-discard.mjs:69`（`pruneQueue`） | 直读 `parent?.[queueKey]`——未过载体吸收；三处调用点恒传完整 agent ⇒ 今日零缺陷（部分 parent 形 ⇒ no-op） |
| ③ | #43-② | 墓碑借用窄形 | `thincoder-core/agent-tools/async-settle.mjs:70-74`（`writeTombstone`） | 父对象无自有 `_asyncTombstones` 且载体无 ⇒ 建容器于 **per-call 对象**（合成 parent 形 ⇒ 墓碑随对象消失） |

**① 的同族对照（七动作逐条实读）**：`spawn`（depth-legal——depth>0 子代 spawn 恒同步）· `status` **✗ 无门** · `observe`（`subagent-actions.mjs:235-236`）· `send`（`:287-288`）·
`escalate`（`:341`）· `cancel`（`subagent-async.mjs:246-248`）· `panel` freeze（`thincoder-core/agent-tools/subagent-panel.mjs:87-89`）——**五处显式拒**，
文案族骨架 = `"<action> is only available at depth 0 — a child agent has no async pool of its own (<anchor>)"`。

**③ 的窄形可达性（VSC 形实核）**：VSC ⏹ 取消传**合成 parent**（`thincoder-vscode/src/extension/panel-messages.mjs:234-242`——携双池 + `history: lines.history`）；
`thincoder-vscode/src/agent.mjs:141-146` 在 run 起始只预建六款容器（**不含 `_asyncTombstones`**），该字段仅由 `:147-153` 绑为**访问器** ⇒ `history._asyncTombstones` 只在「经**绑定 agent** 写过一次墓碑」之后存在。
⇒ 会话首次墓碑写若走合成 parent（例：⏹ 取消一条 queued 条目），墓碑落 per-call 对象、随调用消失。
**CLI 形同分支（发现 4 证据）**：CLI agent 亦无预建 `_asyncTombstones`（核内零预建点——懒建）⇒ 会话首写同走本分支——主容器落点见接口契约 ③（父字段主）。
**绑定腿目标坐标（发现 12）**：访问器腿目标 = `thincoder-vscode/src/agent.mjs:147-153` `Object.defineProperty(agent, f, { get() { return history[f] }, set(v) { history[f] = v } })`——闭包捕获 `:140` 分支的 **`history` 形参**（depth-0 会话数组）；合成 parent 携同一数组（`panel-messages.mjs:234-242`）⇒ 两腿同容器。

**退化面（今日无假阳）**：墓碑丢失 ⇒ `depInfo` 命中 `unknown` ⇒ 依赖者**等**（`subagent-scheduler.mjs:125-131` · `:144-150`）；重复取消确认退化为 unknown-id 错（`subagent-async.mjs:262-264` 读墓碑）——保守，但违背幂等确认契约（§6.11 第 3 条）。

**方案选型对比（8 候选——选定 3 / 否决 5）**：

| # | 候选 | 判据 | 结论 |
|---|---|---|---|
| ①-1 | 补同款 depth 门 + 同文案族 | 明示拒（fail-closed）/ 零新语义 / 父侧零回归 | **选定** |
| ①-2 | 保留静默空 overview | 零改动 | 否决——与「拒翻 = 明示」口径相抵；子代把「不可用」读成「无在飞」 |
| ①-3 | 子代读父池（跨深度可见） | 「子代也能查」 | 否决——池属父对象、子代无稳定父引用；扩权面 = 新语义 |
| ②-1 | `pruneQueue` 读面经 `carrierField` | 与三面同式 / 单点 / 完整 parent 零回归 | **选定** |
| ②-2 | 核验 + 登记不改 | 零改动 | 否决——§6.10 ④ 已定「队列载体吸收」口径，第四面留白 = 同一机制两态 |
| ③-1 | 借用规则扩张（父无自有 Map 且载体在场 ⇒ **主容器落父字段（今日落点）+ 载体侧写同一容器**） | 单点 / 两条读取路径命中同一容器 / CLI 主容器不随 `agent.history` 数组整体替换漂移（零回归可断言）/ VSC 合成 parent 形跨调用存活 | **选定** |
| ③-2 | 核验 + 登记不改 | 零改动（退化保守） | 否决——窄形**可达**（VSC 合成 parent 证据见上），幂等确认契约在窗口内失效 |
| ③-3 | 仅落载体、不回写父字段 | 少一行 | 否决——违 §2.3 写回义务「写入落父对象字段」（CLI 测档直读 `agent._asyncTombstones` 亦会红） |

**接口契约（改前 → 改后 逐字）**：

① `subagent-actions.mjs` `executeStatusAction` 函数首行（改前 = `const agent = ctx.agent`）→ 改后先入门：

```js
if ((ctx.depth ?? 0) > 0) {
  return JSON.stringify({ status: "error", error: "status is only available at depth 0 — a child agent has no async pool of its own (AGENT-LOOP-SUBAGENT.md §6.7.2)" })
}
```

锚点取**现行可解析节号**（`AGENT-LOOP-SUBAGENT.md` §6.7.2 = 七动作面），不照抄 observe/send 的 `AGENT-LOOP.md §7.2`——后者为旧编号、现行两档均不可解析（域外登记，见批档 §2 发现表 F-1）。

② `async-discard.mjs` `pruneQueue`：`const queue = parent?.[queueKey]` → `const queue = carrierField(parent, queueKey)`（`carrierField` 随既有 `./async-settle.mjs` import 行补入）。

③ `async-settle.mjs` `writeTombstone`（改后）：

```js
export function writeTombstone(parent, id, status, role) {
  if (!(parent?._asyncTombstones instanceof Map)) {
    const existing = carrierField(parent, "_asyncTombstones")
    if (existing instanceof Map) parent._asyncTombstones = existing          // 借用（既有）
    else if (parent?.history && typeof parent.history === "object") {
      parent._asyncTombstones = new Map()                                    // 主容器（父字段——今日落点）
      parent.history._asyncTombstones = parent._asyncTombstones              // 载体别名（合成 parent 跨调用存活）
    }
  }
  writeTombstoneTo(parent, id, status, role)
}
```

**为何父字段为主 / `history` 为别名（发现 4 落点——CLI 形首写路径实核）**：CLI agent 无预建 `_asyncTombstones`（懒建）⇒ **CLI 首写即走本分支**；
而 CLI 的 `agent.history` **不是稳定载体**——`thincoder-core/context.mjs:309` / `:317` / `:332` / `:483`（压缩重建）· `thincoder-core/explore-distill.mjs:144` · `thincoder-core/session.mjs:301` / `:438` 均以 `agent.history = [...]` **整体替换数组**。
容器若落 `history`（v1 形），主容器随替换漂移（靠父字段别名兜住、可运作但主落点不稳）；改后主容器 = 父字段（与今日落点**逐字同** ⇒ 「CLI 零回归」成可断言事实），`history` 侧写同一容器（VSC 合成 parent 形跨调用存活——修复目标不变）。
**VSC 绑定形零差异**：绑定 agent 的 `parent._asyncTombstones = new Map()` 经访问器即落 `history`（`thincoder-vscode/src/agent.mjs:147-153`），第二行幂等赋同容器。

**受影响文件清单（R24a · 行数口径 = `wc -l`；as-of 2026-09-18）**：

| 文件 | 现 | Δ | 改动 |
|---|---|---|---|
| `thincoder-core/agent-tools/subagent-actions.mjs` | 488 | +3 | ① depth 门（488 → **491 < 500 硬限**）。**拆分计划（候选面具名）**：escalate 同步段（`executeEscalateAction` + `touchedFilesNote`，as-of `:332-488` ≈157 行）抽 `subagent-escalate.mjs`——照 panel 段抽取先例（`subagent-panel.mjs` + `:330` re-export 保 import 面）；**本批只登记不执行**（§6.20.8-3 = §6.20 批边界声明，非拆分计划本体——措辞收正） |
| `thincoder-core/agent-tools/async-discard.mjs` | 143 | +2/−1 | ② 读面 `carrierField` + import 补名 |
| `thincoder-core/agent-tools/async-settle.mjs` | 284 | +6/−1 | ③ 借用规则扩张（父字段主 + 载体别名，净 +5 → **289**，< 300 软线）+ 头注一句 |
| `thincoder-core/test/async-family.test.mjs` | 225 | +14 | U5 / U6 夹具（③） |
| `thincoder-core/test/async-discard.test.mjs` | 234 | +12 | U3 夹具（②） |
| `thincoder-cli/test/subagent-observe-send.test.mjs` | 305 | +8 | U1（① 子代拒）+ U2 回归 |
| `thincoder-vscode/test/async-parity.test.mjs` | 454 | +10 | U2 对侧回归（①）+ V2 绑定腿（③）；端侧测试档存量超软线（本批增量小 ⇒ 拆分另议——批档 §2.4 软线处置列） |

**关键决策记录**：见「方案选型对比」表（选定 ①-1 · ②-1 · ③-1；否决 ①-2 · ①-3 · ②-2 · ③-2 · ③-3，各带否决理由）。

**用例表（正常 / 边界 / 错误）**：

| # | 类 | 输入 | 期望 |
|---|---|---|---|
| U1 | 错误 | `executeStatusAction({}, { depth: 1, agent })` | `{status:"error", error:"status is only available at depth 0 — a child agent has no async pool of its own (AGENT-LOOP-SUBAGENT.md §6.7.2)"}`——**逐字相等** |
| U2 | 正常 | 同 ctx 但 `depth: 0` / 缺省 | overview / by-id 行为逐字同今日（现有族用例全绿） |
| U3 | 边界 | 部分 parent（`{_asyncSubagents, history}` + `history._asyncQueue`）+ 丢弃 queued 条目 | 队列被剔除 + 存活 `position` 重编号 1..n（今日 no-op） |
| U4 | 正常 | 完整 agent（自有 `_asyncQueue`） | 队列剔除逐字同今日 |
| U5 | 边界 | 合成 parent（无自有墓碑 Map）+ `history`（无容器）→ 写；另一携同 `history` 的合成 parent 读 | 读命中该墓碑（今日 miss） |
| U6 | 正常 | CLI 形（agent 自有 Map）+ `writeTombstone` | `agent._asyncTombstones` 为 Map、`tombstoneOf` 命中，且 `carrierField(parent, …) === parent._asyncTombstones`（同一容器） |
| U6b | 边界 | **无自有 Map + `history` 在场**（CLI 首写实况：`{ history: [] }` 无 `_asyncTombstones`）+ `writeTombstone` | 主容器建在**父字段**（`parent._asyncTombstones` 为 Map）+ `parent.history._asyncTombstones` 为**同一容器**；`tombstoneOf` 命中 |
| V2 | 边界（VSC 对侧） | 合成 parent（`{ history: H }`——无自有 Map）写墓碑 ⇒ 经**绑定形 agent**（`Object.defineProperty` get/set 绑同一 `H`——与 `thincoder-vscode/src/agent.mjs:147-153` 同形）读 | `tombstoneOf(绑定 agent, id)` **命中**（访问器腿成立）；绑定目标坐标 = 该档 `:140` 分支的 `history` 形参（合成 parent 与绑定 agent 携**同一数组**——`panel-messages.mjs:234-242` 携 `lines.history`） |

**验收标准（逐条回指批档条目）**：

| # | 判据（机判） | 回指 |
|---|---|---|
| A1 | `depth:1` ⇒ 上列错误串**逐字相等**；七动作族源码 `only available at depth 0` 命中计数 **5 → 6**（既存五处文案逐字零改 + `status` 新增一处）。命令：`grep -rn "only available at depth 0" thincoder-core/agent-tools/subagent-actions.mjs thincoder-core/agent-tools/subagent-async.mjs thincoder-core/agent-tools/subagent-panel.mjs` ⇒ 逐档 **4 / 1 / 1**（改前 3 / 1 / 1）。**族外不计**：`advisor.mjs:147`（advisor 族另一文案）与测试档断言在 `agent-tools/` 全目录 grep 中会额外命中 ⇒ 搜索根 = 上列三档 | 批档 ① / 台账 #46 |
| A1b | 拒返回形 ≡ **observe / send 既存拒形态**（引坐标 `subagent-actions.mjs:236` / `:288`）：`JSON.parse(返回)` ⇒ 两键 `{status:"error", error:<A1 串>}`（**对象形**；escalate `:341` 的 `Error:` 字符串形不在同款族） | 评审轮 1 发现 11 |
| A2 | `depth` 缺省 / 0 路径：CLI 与 VSC 两侧 status 用例全绿、返回体逐字不变 | 批档 ① 判据「父侧零回归」 |
| A3 | 部分 parent 夹具（U3）：队列剔除 + `position` 重编号生效 | 批档 ② / 台账 #43-① |
| A4 | 完整 agent 形（U4）：与今日逐字同（回归） | 批档 ② |
| A5 | 窄形夹具（U5）：跨调用 `tombstoneOf` 命中 | 批档 ② / 台账 #43-② |
| A5b | 绑定腿（V2）：合成 parent 写 ⇒ 经绑定形 agent 读 ⇒ 命中；绑定目标坐标已记（`thincoder-vscode/src/agent.mjs:147-153`——不可直测时该坐标即判据） | 评审轮 1 发现 12 |
| A6 | CLI 形（U6）：`carrierField(parent, "_asyncTombstones") === parent._asyncTombstones` | `AGENT-LOOP.md` §2.3 写回义务 |
| A6b | 首写腿（U6b）：无自有 Map + `history` 在场 ⇒ 主容器 = 父字段、`history` 侧同一容器 | 评审轮 1 发现 4 |

**边界（本节不做）**：不动 `spawn` 的 depth 语义；不动工具描述 / 提示词面（`subagent` 工具描述 = `thincoder-core/agent-tools/subagent.mjs` 内联 `description`——无独立 `tool-docs/*.md`；内容权归主 agent）；不做 observe/send/cancel/panel 既有门文案的旧编号收正（`AGENT-LOOP.md §7.2` · `§19.5 D-M6` · `§19.6 D-P2` 在现行两档均不可解析——域外登记）；
不收敛 VSC 侧同机制重复实现（`thincoder-vscode/src/agent-tools/async-discard.mjs`——D-AD7 已登记，另案）；**不执行** `subagent-actions.mjs` 拆分——拆分计划 = 本节受影响文件表（候选面已具名），本批只登记不执行（§6.20.8-3 = §6.20 批的边界声明，非拆分计划本体——措辞收正）。

## 6.26 机制性指令注入位置：spawn 固块改走 system 面（2026-09-18 · 批 PROMPT-FACE · 台账 #23）

**问题陈述（实测 as-of 2026-09-18）**：

子代理 spawn 的**两处 spawn 级固定机制性指令**现随 **user 首条消息**（`input`）下发；压缩把首条并入摘要
（`thincoder-core/context.mjs:38` `KEEP_HEAD = 0` ⇒ head 恒空、首条落中段；`:274-324` `applyCompression` 重建成 `note + tail`），
摘要目标 ≤1K token（`thincoder-core/context.mjs:46` `SUMMARY_TOKEN_ESTIMATE = 1000`）。
⇒ 长任务（台账 #67 近 500 轮）中后期：eng-coder 既看不到批次档路径、也看不到审计模板 ⇒
只能满仓 `ls` / `grep` 重找——**「过度勘察」的真病根**（非勘察纪律缺失）。

**现状坐标（逐处实核——注入面 + 机械面）**：

| # | 站点 | 坐标 | 现载体 |
|---|---|---|---|
| S1 | 批次档路径行 `Batch record (batchDoc): <abs>` | `thincoder-core/agent-tools/subagent-spawn.mjs:393`（`if (engineeringRole)`） | user 首条 `input` 尾 |
| S2 | 审计模板块（四类偏差 + A2 任务书摘要 + touched 清单 + zero-git 范围 + 预算句 + 报告格式） | 同档 `:401-437`（`if (engAuditAttempt !== null)`；模板文本 `:407-436`） | user 首条 `input` 尾 |
| S3 | `child._engTaskInput = input` | 同档 `:441` | 记账字段（A2 摘要源——非消息面） |
| C1 | 吞首条的压缩机制 | `thincoder-core/context.mjs:38`（`KEEP_HEAD`）· `:274-324`（`applyCompression`）· `:365-431`（`compressIfNeeded`） | 机制面（本批零改） |
| C2 | 系统消息每轮组装点 / 装配点 | `thincoder-core/agent.mjs:230`（`[{ role: "system", content: systemPrompt }, ...agent.history]`）· `thincoder-core/agent/setup.mjs:214`（`let systemPrompt = base`） | 机制面（本批改点） |

**分类裁定表（全仓同类扫描——逐处归类 + 理由）**：

判据（本批定形，理由见逐行）：**① 内容在 agent 生命周期内逐字节稳定（spawn 级 / 会话级固定）且属「这件事怎么做」的常驻契约 ⇒ system；
② 逐轮 / 逐 run 变化，或属「要做什么」的任务内容 ⇒ user（保持现状）。**

| # | 站点 | 坐标 | 现载体 | 归类 | 裁定 + 理由 |
|---|---|---|---|---|---|
| 1 | 批次档路径行（S1） | `thincoder-core/agent-tools/subagent-spawn.mjs:393` | user 首条 | spawn 级固定（同一 child 终身不变） | **改**：入 system 固块——判据 ① 两条全中 |
| 2 | 审计模板块（S2） | 同档 `:401-437` | user 首条 | spawn 级固定（父交付已定、touched 快照冻结） | **改**：入 system 固块——同上 |
| 3 | `_engTaskInput`（S3） | 同档 `:441` | 记账字段 | **非注入点**（A2 摘要的源） | **保持**；其值随 S1 移出而变为「纯任务书」 |
| 4 | git 上下文 | `thincoder-core/agent/setup.mjs:55-64`（depth-0 门） | user 提醒 | 逐 run 变化 | 保持（子代理本就零 git——§6.7.4） |
| 5 | OS / cwd / Session start + 目录树快照 | 同档 `:65-80`（once-guard） | user 提醒 | 进程级变化 | 保持——判据 ② |
| 6 | repomap 大纲 | 同档 `:91-99` | user 提醒 | 索引态（可随索引变） | 保持 |
| 7 | 记忆 / 文档召回 | 同档 `:103-128`（depth-0 门） | user transient | 逐轮变化 | 保持——判据 ②（本条即契约句的举例面） |
| 8 | 当前时间 | 同档 `:146-150`（尾位） | user 提醒 | 逐 run 变化 | 保持（尾部即缓存契约既有设计） |
| 9 | env-state / peer / manifest 情境行 | `thincoder-core/agent/setup-reminders.mjs:50-56` · `:115-138` · `:160-166` | user 提醒 | 逐回合变化 | 保持——判据 ② |
| 10 | 活体守卫行（ENG 状态 / AUTO / verify 推回） | `thincoder-core/agent/completion.mjs:81` · `thincoder-core/agent/helpers.mjs:372` | user 提醒 | 逐回合变化 | 保持（`docs/core/design/ENGINEERING-MODE-V2.md:321` 已裁定「不落 system 槽」——其判据即本表判据 ②，本批不改该裁定） |
| 11 | advisor 评审简报（对象声明 + Approval Signal/token + 文档清单） | `thincoder-core/advisor/messages.mjs:29-39` · `:49-58` · `thincoder-core/advisor/run.mjs:233` | 评审 user 首条 | **评审级固定（同类根因）** | **不动——已由另一机制覆盖**：F13 pinned 重挂（`thincoder-core/advisor/compaction.mjs:55-83` 压缩时作为一条 user 消息重挂 · 调用点 `thincoder-core/advisor/loop.mjs:128`）⇒ 压缩不丢。登记为「同类已解」 |
| 12 | consult / escalate / 读图降级子代理的任务文本 | `thincoder-core/agent-tools/consult.mjs:308` · `thincoder-core/agent-tools/subagent-actions.mjs:415` · `thincoder-vscode/src/extension/image-handler.mjs:84` | user 首条 | 任务内容（非机制性指令） | 保持——判据 ② 后半 |
| 13 | `REPORT_CONTINUATION`（报告过短追问） | `thincoder-core/agent-tools/subagent-async.mjs:327-329` | user 追问 | 按需重发（机制不同：重发即在场） | 保持 |
| 14 | async 结果注入 / digest 提醒 | `thincoder-core/agent-tools/subagent.mjs:358`（`injectAsyncResult`） | user 提醒 | 事件驱动 | 保持 |

**方案选型对比**：

| # | 候选 | 判据 | 结论 |
|---|---|---|---|
| ①-1 | **落 system**（spawn 固块字段 → `prepareRun` 拼接） | 与缓存契约相容（run 内逐字节稳定）· 压缩后天然不丢（零重挂机制）· 与台账 #23 已定形修法同向 | **选定** |
| ①-2 | 留 user + 压缩后重挂（P1 pinned 形——照 advisor F13 先例） | 复用既有先例 | 否决——须在 `context.mjs` 增挂接面（子代理路径无参数面，pin 的供给方无处落）+ 重挂落在动态位置；且与已定形修法相抵 |
| ①-3 | 不改（靠模型自省重读任务书） | 零改动 | 否决——#67 实证失败（500 轮后满仓 `ls` 即本条病根） |
| ②-1 | 审计块构造器**外提**（`thincoder-core/agent-tools/audit-block.mjs`（拟新增）：`summarizeEngTaskBook` + `buildAuditBlock`） | `subagent-spawn.mjs` 470 行已越 300 软线、逼近 500 硬限；本改净增 ⇒ 外提后回 ~390；且块构造成纯函数（判据面可直测） | **选定** |
| ②-2 | 块内联留在 spawn 档 | 少一次搬动 | 否决——线宽风险 + 判据面无直测落点 |
| ③-1 | 审计子代理（role `explore`）**不**补批次档路径行 | 审计范围纪律（只读 touched ∪ 任务书点名节）+ schema 面已删该参数（`thincoder-core/agent/family-tools.mjs:101`） | **选定** |
| ③-2 | 审计子代理亦补批次档路径行 | 「审计能看到档」 | 否决——邀其通读批次档全档 ⇒ 与 10 轮预算 /「只读该读的」句相抵 |

**接口契约（改前 → 改后 逐字）**：

生产者（`thincoder-core/agent-tools/subagent-spawn.mjs` `buildSpawnChild` 内）：

```js
// 改前（:393 · :401-437 · :441）
if (engineeringRole) input += `\n\nBatch record (batchDoc): ${batchDocAbs}`
if (engAuditAttempt !== null) { /* … input += 审计模板（六段拼接）… */ }
if (role === "eng-coder") child._engTaskInput = input
```

```js
// 改后（模板文本逐字搬入 audit-block.mjs；spawn 档只做「收集 + 绑定」）
let input = args.context ? `Context:\n${args.context}\n\nTask:\n${args.task}` : args.task
const spawnBlocks = []
if (engineeringRole) spawnBlocks.push(`Batch record (batchDoc): ${batchDocAbs}`)
if (engAuditAttempt !== null) spawnBlocks.push(buildAuditBlock(ctx))  // 纯函数：touched 快照 + summarizeEngTaskBook(ctx.agent._engTaskInput) + 模板逐字
if (spawnBlocks.length) child._spawnSystemBlock = spawnBlocks.join("\n\n")
if (role === "eng-coder") child._engTaskInput = input                  // 源 = 纯任务书（不含固块）
```

消费者（`thincoder-core/agent/setup.mjs` `prepareRun`，`:214` 之后）：

```js
let systemPrompt = base
// 派单固块（台账 #23）：spawn 级固定的机制性指令随 system 面下发——run 内逐字节稳定（前缀缓存不破），
// 压缩只重建 history（吞不掉）。拼接位 = 槽位装配之后、项目指令之前。
if (agent._spawnSystemBlock) systemPrompt += `\n\n${agent._spawnSystemBlock}`
```

- **拼接位（槽位裁定）**：`base`（人格 → common → 纪律）→ **固块** → `Project instructions…` → skills 尾块。
  理由：固块与槽位同属「角色 / 契约」层；项目指令（不可信包裹）保持尾位（现状不动）。
  不新设槽位文件（槽位 = 设计档 + 中英双面流程面，本块是**运行期派生文本**，非槽位档）。
- **字段生命周期**：`buildSpawnChild` 写入一次（sync / async 单点——`thincoder-core/agent-tools/subagent.mjs:276` 为唯一调用点）；
  此后只读 ⇒ 同一 child 的任意 run（含 `resume` 续跑、报告追问重跑）逐字节恒定。
- **文本零改**：块内文本逐字搬移（含块内 `above` / `below` 自指——它们指本块内的相对位置，整块搬移不改真值）
  ⇒ **本批不触提示词正文**（内容权 = 主 agent）；无正文改动 ⇒ 无上抛项。

**缓存契约兼容证明（`docs/core/design/AGENT-LOOP.md` §6.3——契约精化见同批该档修订）**：

- 契约的**操作条件** = 「同一 agent 的相邻请求前缀逐字节相同」；现行表述「跨 run 逐字节不变」是它在
  「system = 槽位装配 + 项目指令 + skills」下的**充分形态**，非必要条件。
- 固块值 = spawn 参数派生（批次档绝对路径 / 审计快照），**在 child 生命周期内恒定** ⇒ 同一 child 的任意两次请求 system 逐字节相同 ⇒ **命中不破**。
- 跨 spawn 不同值（不同批次档）不构成损失：新 child 的首个请求本来即缓存写（首现无前缀可复用）。
- 零回归面：`_spawnSystemBlock` 为 null ⇒ 拼接分支不进入 ⇒ depth-0 / explore / plan / coder / consult 的 system 逐字节同改前
  （现有断言面 = `thincoder-vscode/test/context-parity.test.mjs:335` 所覆盖者）。

**压缩面不变量（AC 机判对象）**：

- `systemPrompt` 是 run 局部量（`thincoder-core/agent.mjs:125-130` 取值 · `:230` 每轮组装请求）——**不在 `agent.history` 内**；
  压缩（`thincoder-core/context.mjs:274-324`）只重建 `history` ⇒ **结构上无法吞掉 system 面**。
- 压缩开销估算（`thincoder-core/agent.mjs:184-190` 的 `compactionOverhead.systemPrompt`）随固块自动增大 ⇒ 估算面不低计（无需另行处理）。
- **不变量句（逐字，供 AC 断言）**：压缩前 / 压缩后，同一 child 的 system 消息含**同一**固块文本，且 `agent.history` 内**不含**该文本。

**受影响文件清单（R24a · 行数口径 = 换行符计数；as-of 2026-09-18）**：

| 文件 | 当前行数 | 预计增量 | 说明 |
|---|---|---|---|
| `thincoder-core/agent-tools/subagent-spawn.mjs` | 470 | −80 / +12 | ① `summarizeEngTaskBook`（`:44-80`）与审计模板构造体（`:394-437`）外提；② 三处改固块收集 + `child._spawnSystemBlock` 绑定（S1 / S2 / S3 单点） |
| `thincoder-core/agent-tools/audit-block.mjs`（拟新增） | 0 | +~95 | `summarizeEngTaskBook` + `buildAuditBlock(ctx)`（纯函数——判据面直测面） |
| `thincoder-core/agent/setup.mjs` | 234 | +3 | `:214` 之后固块拼接（`prepareRun` 单点） |
| `thincoder-core/test/spawn-system-block.test.mjs`（拟新增） | 0 | +~120 | 用例 U1–U7 宿主（`npm test` 自动收集——`thincoder-core/test/run.mjs:8` 单层 glob） |
| `thincoder-cli/test/batch-doc-gate.test.mjs` | 188 | ±14 | `:98` · `:115-119` · `:127` · `:143-146` · `:185` 判据改指固块字段（`input` 侧断言反转「不含」） |
| `thincoder-cli/test/eng-designer-role.test.mjs` | 269 | ±8 | `:162-168`（批次档行）· `:202`（负控强化为「连固块字段也不含」）· `:207`（对照改指固块） |
| `thincoder-vscode/test/eng-designer-role.test.mjs` | 198 | ±3 | `:167` 负控补固块字段断言（防空转——原断言改后恒真） |
| `thincoder-vscode/test/subagent-audit-summary.test.mjs` | 118 | ±6 | `:39-45` A2 摘要读取面由 `input` 改 `child._spawnSystemBlock` |
| `docs/core/design/AGENT-LOOP-SUBAGENT.md` | 883 | +~120 | 本节（机制面单源） |
| `docs/core/design/AGENT-LOOP.md` | 514 | ±2 | §6.3 `:229` 契约精化一句 + 变更记录 |
| `docs/core/design/PROMPT-SYSTEM.md` | 270 | +1 | §6.2 装配事实补一行指针（不复制机制——D2） |

> 行数纪律：`subagent-spawn.mjs` 470 → ~400（本批下降，越软线状态缓解）；`subagent-scheduler.mjs`（398）已在 §6.20.4 登记、
> 本批不触；`AGENT-LOOP-SUBAGENT.md` 本节落笔后 ~1003 行——**文档档不适用源码行数线**（线口径 = `AGENTS.md` 源文件），
> 但过千行已成事实 ⇒ **拆档已落地**（2026-09-22 structure-debt 批 · 三分——§6.8 / §6.10 / §6.11 / §6.18 / §6.19 / §6.20 ⇒ `docs/core/design/AGENT-LOOP-ASYNC-POOL.md`；
> §6.27 全族 ⇒ `docs/core/design/AGENT-LOOP-UPSTREAM.md`；本档留子代理工具契约与装配面）。

**关键决策记录（含否决备选）**：

| # | 决策 | 理由 / 否决备选 |
|---|---|---|
| D23-1 | 载体 = **system 固块**（`child._spawnSystemBlock` → `prepareRun` 拼接） | 与缓存契约相容 / 压缩天然不丢 / 零重挂机制；否决 pinned 重挂（须新挂接面——选型 ①-2） |
| D23-2 | 拼接位 = 槽位装配之后、项目指令之前 | 固块与槽位同属「角色 / 契约」层；项目指令（不可信包裹）保持尾位不动 |
| D23-3 | 审计块构造器外提 `audit-block.mjs`（拟新增） | spawn 档越软线 + 块构造成纯函数可直测；否决内联（选型 ②-2） |
| D23-4 | 块内文本**逐字搬移**（含块内自指词） | 零提示词正文改动（内容权在主 agent）；否决「顺手改写」（非本批必要 + 须上抛） |
| D23-5 | 审计子代理不补批次档路径行 | 审计范围纪律 + schema 面已删该参数；否决「顺带补上」（选型 ③-2） |
| D23-6 | `_engTaskInput` 语义 = **纯任务书**（不含固块） | A2 摘要面更干净（三要素抽取不受派生行干扰）；固块不再是「任务书的一部分」 |
| D23-7 | 任务书本体（批次档 §2 文本）**不**入 system | 本批范围 = 机制性指令；任务内容属会话内容，压缩摘要面已按「当前任务锚定」承接（SUMMARIZE_PROMPT 第 3–4 条）——边界如实登记 |

**用例表（正常 / 边界 / 错误——含先红证据）**：

| # | 类型 | 输入 | 期望输出 | 先红（现态读数） |
|---|---|---|---|---|
| U1 | 正常 | eng-coder spawn（真 `buildSpawnChild` + 真 `prepareRun`，depth 1） | `systemPrompt` 含 `Batch record (batchDoc): <abs>` ∧ `input` 不含 | **红**：system 无该行（只在 `input`） |
| U2 | 正常 | 审计 spawn（eng-coder 父 + role `explore` + attempt 非 null） | `systemPrompt` 含五锚：`[Audit instructions — mechanical template` · A2 块头 · `Zero-git scope authority` · `[Audit budget — mechanical]` · `[Audit report format — mechanical template` | **红**：五锚只在 `input` |
| U3 | 边界 | 长史（> 切割面）→ 压缩（`compressFallback` 零网络；另跑 `compressIfNeeded` + stub provider 一条） | system 五锚仍在 ∧ `agent.history` 无五锚 | **红**：两处皆无（压缩吞首条 = 病根复现） |
| U4 | 边界 | 同一 child 连跑两次 `prepareRun` | 两次 `systemPrompt` 逐字节相等（缓存契约） | 现态绿（基线——改后须保持绿） |
| U5 | 边界 | `_spawnSystemBlock` 为 null（depth-0 / explore / plan / consult） | `systemPrompt` 与改前逐字节相同（零回归） | 现态绿（基线） |
| U6 | 边界 | designer 勘察 spawn（attempt = null） | system 不含审计五锚 ∧ 不含批次档行 | 现态绿（基线；改后须保持） |
| U7 | 边界 | 整请求体（system + history）文本计数 | 固块文本恰出现 **1** 次（独占性） | **红**：现态在 history 中出现（而压缩后为 0） |

**验收标准（逐条回指）**：

| # | 判据（可机判） | 回指 |
|---|---|---|
| A23-1 | `prepareRun(engChild).systemPrompt` 含批次档行 ∧ `input` 不含（U1） | 批次档 §2 条目 1 · 派单验收 ②③ |
| A23-2 | 审计 spawn 的 system 含五锚 ∧ `input` 不含（U2） | 批次档 §2 条目 2 |
| A23-3 | 压缩后五锚仍在 system ∧ 不在 history（U3）——**先红**：现态两处皆无 | 批次档 §2 条目 3 |
| A23-4 | 同 child 两次装配 system 逐字节相等（U4）；null 固块路径逐字节同改前（U5 / U6） | 批次档 §2 条目 4 |
| A23-5 | 分类裁定表 14 行逐处有裁定（本档表——含「同类已解」第 11 行） | 批次档 §2 条目 5 · 派单验收 ① |
| A23-6 | `node scripts/doc-check.mjs` 本批触碰档零新增悬空锚 / 零新增行宽违规 | 批次档 §2 条目 6 · 派单验收 ⑥ |

**边界（本批不做）**：

1. 不动压缩本体（`thincoder-core/context.mjs` 零改动）——本批只改注入位置。
2. 不动任务书本体（批次档 §2 文本仍走 user 首条、仍可被摘要；见 D23-7）。
3. 不动 advisor 评审简报（同类已由 F13 pinned 重挂覆盖——分类表第 11 行）。
4. 不动 VSC 镜像装配面（`thincoder-vscode/src/agent/setup.mjs`）：VSC 子代理恒经核 `runChildPipeline` → 核 `runAgent`
   （`thincoder-core/agent-tools/subagent-async.mjs:305-308`）⇒ 单点即可；该端 depth>0 直连面仅 `thincoder-vscode/src/extension/image-handler.mjs:84`（无固块字段）。
   **实施轮复核项**：若发现端侧另有子代理装配路径携带该字段，同式补一行。
5. 不改 `batch_segment` 工具描述与提示词正文（零正文改动 ⇒ 内容权面零依赖）。
6. 不动 `thincoder-core/agent/family-tools.mjs` 的 schema 删除面（审计子代理仍无 batchDoc 参数）。
7. 无 UI / 交互决策（system 面对 UI 不可见；TUI / webview 零改）——**无 open 项**。

## 6.28 VSC 端 batch 改名镜面修复（2026-09-21 · 批 VSC-BATCH-RENAME-FIX · 核 `0b45957c` 遗留 5 红）

**问题陈述（as-of 2026-09-21 实测）**：核批 `0b45957c`（batch 生命周期工具单名化——主名 `batch` 单工具四 action，
`thincoder-core/agent-tools/batch.mjs:270`；过渡别名 `batchSegmentTool` 降 shim 导出面，`:366`）落地后，VSC 全量
876 测试中 **5 红**——红源全部为 **VSC 测试断言面钉改前形状**（生产码零红）。核挂载面（VSC 装配同源，四处全主名）：
depth-0 段 `agent/family-tools.mjs:141`（`batchTool(null)`）· eng-coder `:170` / eng-designer `:171`
（`batchTool(batchDoc)`）· 设计评审 `advisor/loop.mjs:45`（`batchTool(batchDoc, { review: true })`）。

**改前 → 改后（逐处；坐标 as-of 2026-09-21 实读）**：

| # | 红例 | 档:行 | 改前 → 改后 | 性质 |
|---|---|---|---|---|
| 1 | W9① | `agent-tools-registry.test.mjs:29` | REGISTRY_NAMES 含 `"batchSegmentTool"` → `"batchTool"`（仍 15 名——别名不入登记册，`thincoder-core/agent-tools.mjs:17/:21`） | 红 |
| 1b | W9① 注 | `:36` | 行内注释「batchSegmentTool = 工厂」随主名 | 注释面 |
| 2 | T57 正常 | `eng-designer-role.test.mjs:105` | `has("batch_segment")` → `has("batch")` | 红 |
| 2b | T57 正常 | `:109` | `get("batch_segment").execute({segment,text})` → `get("batch").execute({action:"append",…})`（`batch.mjs:321` `required:["action"]`） | 红 |
| 3 | T57 零回归 | `eng-designer-role.test.mjs:126` | 名单字面 `"batch_segment"` → `"batch"` | 红 |
| 4 | T60 | `batch-segment.test.mjs:183/:186/:187/:188` | 四处 `byName` 断言名 → `"batch"` | 红 2（:186/:187）+ 误绿 2（:183/:188 旧名下恒真） |
| 5 | T5 | `integration/host-shape-spawn.test.mjs:125` | depth-0 期望 15 名 → 加 `"batch"`（15→16——`:141` 实挂） | 红 |
| 5b | T5 | `:126/:127` | eng 两行 `"batch_segment"` → `"batch"` | 红 |
| 6 | 注释面 | `setup-tooltable.mjs:4/:22` · `thincoder-vscode/src/agent/setup.mjs:5/:325` | 四处「batch_segment 记账缝 / 唯一路径来源」指称 → 主名 `batch`（`configureBatchSegment` 契约名不动） | 静默残留 |
| 7 | 注释面 | `batch-segment.test.mjs:8` · `eng-designer-role.test.mjs:8` | 两档头注 `batch_segment` 指称 → 随主名 | 静默残留 |

**坐标收拢注**（§3 复评 🟡#1 · 实施轮代落）：表未单列的 `:98/:120/:178` 三处 = 所在用例块的 **test() 标题行**（`:98` = 表行 2 用例标题 · `:120` = 表行 3 用例标题 · `:178` = 表行 4 用例标题）——非独立改动点，snake_case 字面随块内断言行同批收正；块内断言行（`:105/:109/:126/:183–:188`）即表中改后形态，U2/U3/U4 覆盖。

**保缝面（三处——非改名面，禁触）**：① `configureBatchSegment`（#84 记账缝契约名——`setup-tooltable.mjs:14/:27`
消费、`batch-segment.test.mjs:19/:204` 镜像注册）；② shim 直调用例（T59/T66/T-FZ3 的 `batchSegmentTool` 直调——
别名等价载体，等价性由核 BATCH-RECORD §4.14 撤除判据守护）；③ 核错误串前缀断言
`batch-segment.test.mjs:126`（`/^batch_segment: the text contains a section header line/`——核 `batch.mjs:251`
对子代理身份的错误串**逐字保持** `batch_segment:` 前缀 = 核锚；该断言锁核契约，非残留）。

**关键决策**：

- **D-1** 登记册**换名不加名**（仍 15 名——实读 `thincoder-core/agent-tools.mjs:17/:21`：`batchSegmentTool` 过渡别名不入登记册，仅 shim 导出面）。
- **D-2** T60 **四处全改**（非仅 2 红）——`:183/:188` 在旧名下恒真（主名世界里代码评审既不含旧名也不含新名），
  断言力已失；随主名改后 `!has("batch")` 恢复强断言。
- **D-3** `:109` 改走主名 execute 形——`required:["action"]`（`batch.mjs:321`）+ action 分发（`:342`）实读：
  缺 action = unknown action throw；shim 形 `{segment,text}` 对主名不可达。
- **D-4** 注释面 = **6 处** = src 4（`setup-tooltable.mjs:4/:22` · `thincoder-vscode/src/agent/setup.mjs:5/:325`）+ 测试档头注 2（`batch-segment.test.mjs:8` · `eng-designer-role.test.mjs:8`）。
- **D-5** 落点 = 本档 §6.28（VSC 装配镜像面 owner 档——§6.24 先例）；不另建 `WEBVIEW-TOOLTABLE.md`
  （不存在，glob 实勘——另建即单一权威源破面）。

**用例表（改后形态——既有用例就地收正，零新增用例）**：

| # | 用例 | 输入 | 期望 | 回指 |
|---|---|---|---|---|
| U1 | W9① 名集 | import 核登记册 | `Object.keys` 排序 = 15 名（含 `batchTool`、不含 `batchSegmentTool`） | 红 1 |
| U2 | T57 正常 | depth-1 eng-designer 装配 + 绑定档 | `has("batch")`；`get("batch").execute({action:"append",…})` 写 §2 落绑定档 | 红 2 |
| U3 | T57 零回归 | depth-1 eng-coder 装配 | advisor / verify / batch / subagent 全在 | 红 3 |
| U4 | T60 只读面 | `advisorToolsFor` code/design × 绑定/未绑定 | code 集 6 名恒定且无 `batch`；design+绑定含 `batch`；design 未绑定 / code+绑定不含 | 红 4 |
| U5 | T5 矩阵 | `hostShape` 六角色 | depth-0 = 16 名（含 `batch`）；eng 两行含 `batch`；coder / explore / explore-eng 不变 | 红 5 |

**验收标准（可机检 · cmd.exe · cwd = `thincoder-vscode/`）**：

| # | 判据 | 回指 |
|---|---|---|
| A-1 | `npm test` = **876/876 零红**（改前 871/876） | 全体 |
| A-2 | `node --test test/agent-tools-registry.test.mjs test/eng-designer-role.test.mjs test/batch-segment.test.mjs test/integration/host-shape-spawn.test.mjs` 全绿 | 红 1–5 |
| A-3 | 残留清零：VSC `src` + `test` + `webview` 域 snake_case `batch_segment` 字面命中 = **0**（webview 域 2026-09-21 实勘已零命中）；豁免集见下 | 注释面 6 处 + 红 2/3/5b |

A-3 豁免集（不计入命中面）：① `configureBatchSegment` / `batchSegmentTool` camelCase 缝名与 shim 导出面；
② `batch-segment.mjs` 连字符路径；③ `batch-segment.test.mjs:126` 核错误串前缀断言（保缝面 ③）。

A-3 机检（单行 · cmd.exe · cwd = `thincoder-vscode/`；§3 复评 🔵#3 · 实施轮代落）：
`node -e "const fs=require('fs'),path=require('path');let n=0;const w=d=>{for(const x of fs.readdirSync(d)){const q=path.join(d,x);if(fs.statSync(q).isDirectory())w(q);else
 if(/\\.(mjs|js)$/.test(x))fs.readFileSync(q,'utf8').split(/\\r?\\n/).forEach(l=>{if(l.includes('batch_segment'))n++})}};['src','test','webview'].forEach(w);console.log(n)"`
→ 期望输出 = `1`（唯一命中 = 豁免集③ `batch-segment.test.mjs:126` 核错误串前缀断言；命中面 = 0——camelCase 缝名与连字符路径形态不含 snake_case 字面，天然不入命中）。

**边界（本批不做）**：不改核侧（`0b45957c` 已收口）；不动 #84 缝契约名；不删 shim 档与别名（核 §4.14 撤除判据
归核批）；错误串 `batch_segment:` 前缀零改（核 §4.1 锚）；T5 已定性机械面（fixture 钉改前形状），零行为裁决；
`thincoder-vscode/src/agent/setup.mjs` 现量 **421**（as-of 2026-09-22 实测——拆分后；本批 ±0）——该档后续净增的拆分归父侧派单登记。

## 变更记录

- 2026-09-22（**structure-debt 批 · 档面车道 · eng-designer**——承 `docs/batches/2026-09-22-structure-debt.md` §2.5 · 台账 #67）：**三分**——
  迁出 §6.8 · §6.10 · §6.11 · §6.18 · §6.19 · §6.20 ⇒ `docs/core/design/AGENT-LOOP-ASYNC-POOL.md`；迁出 §6.27 全族（含 §6.27.12.13 + §6.27.8 内两段无编号提示词面文本块）⇒ `docs/core/design/AGENT-LOOP-UPSTREAM.md`。
  **段零改动**（逐字搬移 · 节号沿用）；本档 = 子代理工具契约与装配面（§6.7 · §6.9 · §6.12 · §6.21–§6.26 · §6.28）——标题 / 归属句 / 节号句按三分收正 + §6.26 旧「两分」建议句收正；全仓档面指针同批改指（节号不动）。

- 2026-09-22（**hygiene-sweep 批 · 文档卫生轮 · eng-designer**——承 `docs/batches/2026-09-22-hygiene-sweep.md` §2 · 台账 #111① / #203 / #216）：§6.27.12.9 **F10 行扩残余两项**（采样窄窗 race · 谓词恒真 ⇒ 连开轮——登记，**判据本体零改**）；
  §6.28 坐标消歧（`setup.mjs` → `thincoder-vscode/src/agent/setup.mjs`；否定式指称改**裸名形态** `WEBVIEW-TOOLTABLE.md`——消悬空）+ A-3 机检命令**软折行**（字面零改）。**零新语义**。


- 2026-09-22（**pending-triage 批 · 设计评审修正轮 1 · eng-designer**——承 `docs/batches/2026-09-22-pending-triage.md` §3 轮次 1 发现 2 · 台账 #87）：#87 收正清单补两处 + 称谓一处——
  §6.27.6 ▸ 载体清单位点 `:1283`（「残余另案 = 端壳取消 / 观察面对位」→ 已对位现态）· §6.27.7 D-UC6 注 `:1297`（「另案三项」→ 三项均已对位，含逐项现态）· §6.27.12.12 回指 `:1793`（同称谓）；
  §6.28 边界行读数就地收正（`thincoder-vscode/src/agent/setup.mjs` 现量 421 · as-of 2026-09-22——拆分后）。**零机制改动**。

- 2026-09-22（**pending-triage 批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-22-pending-triage.md` §1「#87 归档」裁 · 台账 #87）：F8 残项③（端壳取消 / 观察面对位）**判已消解**——三处 pending 标记（§6.27 F8 行 · §6.27.7 注 · §6.27.12.11 边界 6）+ §6.27.12.12 ⑤ 台账关系句收正为现态（携两见证坐标）；**零机制改动**。

- 2026-09-22（**busy-extend 批 · 同族扩面轮 · eng-designer**——承 `docs/batches/2026-09-22-busy-extend.md` §1 裁定 · 父侧并入本批）：§6.8 主会话 busy 条 + 挂起状态机两处收正——
  busy 提交 = **入单槽**（吞面收敛四；回指 `docs/cli/design/TUI-INPUT-BOX.md` §4.1 / `docs/cli/design/TUI.md` §7.5 / `docs/vsc/design/WEBVIEW-INPUT.md` §1 C-B2-6）；状态机「digest 在跑」行 → 入槽（槽满 ⇒ 吞 + 提示）。机制条文零改。

- 2026-09-22（**tool-discipline 批 · 第三面闭口轮 · eng-designer**——承 `docs/batches/2026-09-21-tool-discipline.md` §5 线外发现 · 父侧裁定并入本批）：
  §6.8「digest 动作域（两档）」收正两处——手动档条目任务清单更新改**模式条件句**（普通模式允许 / 工程模式不允许——F10：装配摘除 + 执行拒；域文本随模式取变体，追踪权威面 = 批次档 + 台账）· 权限条目自省工具示例补模式限定；
  两处指针 → `docs/core/design/TOOLS.md` §6.15.3（机制与文本单源，本档不重述）。其余条目零改。

- 2026-09-21（**批 VSC-BATCH-RENAME-FIX · 设计轮 · eng-designer**——承 `docs/batches/2026-09-21-vsc-batch-rename-fix.md` §1 · 核 `0b45957c` 遗留 VSC 5 红）：新增 **§6.28**——5 红逐处坐标表（改前→改后）+ 保缝面三处（#84 缝契约名 / shim 直调用例 / 核错误串前缀断言）+
  决策 D-1–D-5（登记册 15 名换名 / T60 误绿面 / 主名 execute 形 / 注释面 6 处 / 落点本档）+ 用例 U1–U5 + 验收 A-1–A-3 + 边界。零生产码改动（断言面 + 注释面单侧收正）。

- 2026-09-21（**批 SUBAGENT-SIGNAL-LINES · 设计微修三轮 · eng-designer**——承 `docs/batches/2026-09-21-subagent-signal-lines.md` §3 轮次 1 评审 #44（pass · 3🟡 / 5🔵）设计档面四项 × 父侧逐条裁定）：§6.27.12.13 ——
  ① ⑥ 表后补**越线核查**（行 3 / 5 / 8 / 9 四档逐档档位口径）· ② 行 11–14 补**读数口径**注（as-of 读数 · 不追值）· ③ ⑤a 代码块改用 `ASK_LABEL_MSG_MAX` · ④ ⑨-5 补理由句（跨端单源 D2 · 宽字符折行为已知形态）。机制面零改。

- 2026-09-21（**批 SUBAGENT-SIGNAL-LINES · 设计微修二轮 · eng-designer**——承 `docs/batches/2026-09-21-subagent-signal-lines.md` §2.6 遗留 2（CLI 设计档 §6.9 口径差）· **父侧 2026-09-21 02:1x 裁定纳入本批**）：
  CLI 设计档同步——`docs/cli/design/TUI.md` **§6.9** 就地收正为 F-UC8 现态口径（起跑标签**两档**〔ask 携参 / digest——manual / AUTO 同判 · `auto` 泛句退场〕
  · **起跑数行** `pend0 > 0` ⇒ `digest.start` · 收尾行 **`pend0 > 0` 守卫**——done / aborted 两形态同判）+ 该档变更记录一行；
  §6.27.12.13 ⑥ 文件表 **14 行**（新增行 14 = `docs/cli/design/TUI.md`——实现轮零改）。机制面零改。

- 2026-09-21（**批 SUBAGENT-SIGNAL-LINES · 设计微修正轮 · eng-designer**——承 `docs/batches/2026-09-21-subagent-signal-lines.md` §1 · **父侧 2026-09-21 02:0x 裁定**（⑩-1 上抛项：ask-only 轮 CLI 收尾行**纳入本批**））：§6.27.12.13 ——
  X9 收尾行**加 `pend0 > 0` 守卫**（ask-only 轮零收尾行；**done / aborted 两形态同判**——VSC `webview/chat.js:425-426` 零动作守卫先于 `ok` 判）；③ 尾条改写 + 射程句 / §6.27.12.5 D 尾注同扫收正 + ⑨-2 边界改写（「轮尾行零改」→「收尾行 guard 一处，其余零改」）+
  ⑩-1 改「已裁纳入」含落点 + ⑤c 守卫口径 + ⑦ 用例 **T-SL-C3**（ask-only 零收尾行 · 两态对照）+ ⑧ U-SL2 回指含 C3 + ⑥ 文件表 Δ 收正两行（`suspension-drive.mjs` +9 → +10 · `digest-end-line.test.mjs` +20 → +40）。机制面零改（可见提示面一处守卫）。

- 2026-09-21（**批 SUBAGENT-SIGNAL-LINES · 设计轮 · eng-designer**——承 `docs/batches/2026-09-21-subagent-signal-lines.md` §1（用户 01:55 报告 + 01:58 口径「全档 × 双端」）· 需求 §4.12 **F-UC8** · 台账 #166）：
  **新增 §6.27.12.13 信号提示行**（档位矩阵 / ask 携参 / CLI 起跑行 / 决策 D-SL1–D-SL5 / 接口契约 a–f / 受影响文件 13 档 / 用例 T-SL1–T-SL4 + T-SL-C1·C2 + T-SL-V1·V2 / 验收 U-SL1–U-SL5 / 边界 7 条 / 登记 2 条）；
  §6.27.12.5 **D** 改写为 F-UC8 现态契约（按因两档 × 全档 + 起跑行——`auto` 泛句退场）；§6.27.12.12 ⑥ 首条（webview digest 可见面）与 ④ 对照表第 10 行收正（tier 两档 · 携参 · 计数元素随 `n > 0`）。
  对位档同步：`docs/vsc/design/WEBVIEW-PROTOCOL.md` §3 / §3.2（行 11 收正 + 新增行 14）/ §5 / §13 / §6.3 · `docs/vsc/design/WEBVIEW.md` §5.1 / §6 D-W35 / §8 U-W19。**机制面零改**（只动可见提示面）。

- 2026-09-20（**显示面消差批 · 批 4 收口轮 · eng-designer**——承 `docs/batches/2026-09-20-display-parity-batch.md` §2.11 未落面 / §5.13 / §5.18 批 2 实施记录）：
  §6.7.2 —— ① 「VSC 同步 spawn 块无 ⏹」句收正为 **X10 现态**（`syncLive` 门控 + 宿主 sync 分支经核 `cancelSyncChild` 单源；产者侧序缺陷 ⇒ 降级登记）；
  ② `STOPPED_MARK` 定义指针收正为下沉零依赖叶 `thincoder-core/agent/child-marks.mjs`（`spawn-child.mjs` 再导出）。

- 2026-09-20（**显示面消差批 · 批 4 条款落笔 · eng-designer**——承 `docs/batches/2026-09-20-display-parity-batch.md` §2.10.9 附（第三档落点））：
  §6.27.12.12 ⑥ 边界首条改写为 **webview digest 可见面现态**（ask-only 轮同 post `tier: "ask"` 起跑消息——建标签行、不建计数元素；`digest.turnLabelAsk` / `digest.turnLabelAuto` 两键入核 i18n 容器）；元素级契约挂 `docs/vsc/design/WEBVIEW.md` §5.1 / `docs/vsc/design/WEBVIEW-PROTOCOL.md` §5（D2）。

- 2026-09-19（**批 2026-09-19-upstream-channel-availability · 设计评审修正轮 1 · eng-designer**——承 `docs/batches/2026-09-19-upstream-channel-availability.md` §3 轮次 1（9 条：🔴 2 · 🟡 5 · 🔵 2；域外注 2）· 父侧逐条裁定）：**逐条落位（发现 1–8；🔵9 = 父侧裁 Not an issue ⇒ 零动作）**——
  ① **CLI 贯通跳补入**（发现 1）：文件表 **21 → 23 行**（行 22 = `thincoder-cli/src/tui/agent-turn.mjs` · 行 23 = 核新测档）+ §6.27.12.5 **I / E** 与 §6.27.12.4 ④ 范围面链路收正 + T-CL-U1 扩「桩第 4 参 `upstreamTurn === true`」（可机检）；
  ② **尺寸档收正**（发现 2）：T18–T22 拆至 `thincoder-core/test/parent-channel-upstream.test.mjs`（拟新增——`test/*.test.mjs` 单层 glob 自动收集）+ `input-lock.test.mjs` 档位声明与触发式拆分计划 + 「零新增越线档」句改实；
  ③ **坐标收正**（发现 3）：核 opts 读点 `:62` → **`:96`**（三处：E / I / 文件表行 5）；④ **域文本指位改述**（发现 4）：「above」→ 在飞消息在域文本**下方**（次序约束入档；定稿权 = 父侧）；
  ⑤ **跨档指针**（发现 5）：`AGENT-LOOP.md` `:407` 的 `T-VS-U1–U6` → **`T-VS-U1–U7`**；⑥ **现态超前标记**（发现 6）：`AGENT-LOOP.md` `:104-105` / `:113-114` 两句加**「待实现轮落地」**；
  ⑦ **U5 命令按包拆分**（发现 7）：`cd thincoder-core && npm test` + `cd thincoder-cli && npm test`（cwd = 仓根）；⑧ **口径统一**（发现 8）：`input-lock.test.mjs` 268 → **267**（实测），`AGENT-LOOP.md` 519 / `subagent-spawn.mjs` 484 / 本档 1932 标 **as-of 读数 · 不追值**；
  **域外注①顺带收正**：`family-tools.mjs` depth>0 分支坐标与 consult 行 **+1**（§6.27.2 ① · §6.27.4 装配接线）。**无新机制面**（本轮 = 补一处漏跳 + 坐标 / 计数 / 档位 / 判据面收正）。

- 2026-09-19（**批 2026-09-19-upstream-channel-availability · D8 收正轮 · eng-designer**——承用户 2026-09-18「失效的表达一定要删掉」裁定 + 批档 §2.16-⑧③ 点名）：**三处形态收正**——
  §6.27.12.4 ④ 扩充依据去修订式对照语（留用户裁定引文 + N4 范围现值）· §6.27.12.12 回指同式 · §6.27.7 **「已知面 = F8」行改现态陈述**（去修订式括注与失效半句；留 F8 标识符 + 另案三项现态）。
  同轮同族收正 = `AGENT-LOOP.md` §2.3 两处（见该档变更记录）。机制条文零改。

- 2026-09-19（**批 2026-09-19-upstream-channel-availability · 定点消差轮 · eng-designer**——承用户 2026-09-19 23:35 裁定「**端差还是要消除的**」（批档 §1.5-4 改判，撤回原「接受端差」））：**端侧域文本改「核基座 + 端 overlay」单点组合**——
  ① §6.27.12.5 新增 **L**：`thincoder-vscode/src/agent/turn-domains.mjs`（拟新增）= 拆分计划落地 + 端侧域文本组合单点（核基座转口 + `VSC_TURN_OVERLAY` + `composeTurnDomain`）；② J 转口表增两名（`AUTO_TURN_DIGEST_DOMAIN` + `UPSTREAM_TURN_DOMAIN`）· G ④ 改组合调用 · §6.27.12.4 ② 指针收正；
  ③ §6.27.12.12 ④ 改为**现态陈述 + 两轮对照表**（域文本构成差异项 = 0）+ Δ 登记（四族枚举短语退役 / 端 overlay 落位 / 端侧核文本副本退役）；④ 用例 **T-VS-U7** + T-VS-U5 / U12 结构机检扩令牌 · 文件表 20 → **21 行**（VSC 写域 12–21）· 拆分触发面清零（U13 同步）。
  **核 / CLI 零改**（组合全在端侧——核单源未破，端特有述句不进核）。

- 2026-09-19（**批 2026-09-19-upstream-channel-availability · VSC 对位扩面轮 · eng-designer**——承用户 2026-09-19 23:23 裁定「vsc 肯定要扩啊」+ 需求 §4.12 **N4** 同轮改（核 + CLI + VSC 两端对位））：§6.27.12 **VSC 面由「对位登记」升为落地设计**——
  ① §6.27.12.4 ④ 范围面改写（三面写域 + 落点顺序硬约束 + 实证面口径）；② 新增 **§6.27.12.12 VSC 对位面**（drain 面 / 载体表 / 唤醒 + 谓词 + 日志标签 / 端差登记 / 写域与实证口径 / 边界）；
  ③ §6.27.12.5 增 **G–K** 五段接口契约（端壳 `thincoder-vscode/src/agent.mjs` · `thincoder-vscode/src/extension/suspension.mjs` · 旗标三跳 · 核单源转口 · CLI 日志载荷）；④ 文件表 11 → **20 行**（VSC 9 档）+ 尾距与拆分计划；⑤ 用例 **T-VS-U1–U6** + 验收 **U9–U13**（cmd.exe 可跑 · 中文串判据禁 `findstr /c:`——台账 #102）；⑥ 边界第 8 条改写（VSC 并入）。
  **核 / CLI 机制面零改**（唯一回填 = 日志载荷，承父侧裁定 ④）；F8 已知面随本批**消解**。
- 2026-09-19（**批 2026-09-19-upstream-channel-availability · 设计轮 · eng-designer**——承需求 §4.12 **F-UC7**（`:220`）/ 台账 #104）：新增 **§6.27.12 上行唤醒面**（默认流可用性）——
  ① 唤醒事件族逐条实核（W1 settle / W2 用户输入 / W3 abort；「未 drain 的 ask」缺位）+ 驱动坐标三档；② 关键发现「唤醒 ≠ 开轮」——开轮判据（第 2 步谓词）是第二要件，本批修法 = 唤醒 + 谓词两件一组；
  ③ 四面裁定（复用 W1 通道 `wakeAsyncWaiters` 单点 + `upstreamWaiting` 谓词 + `upstreamTurn` 旗标 + 新域文本）+ 选型表六候选（a 选定 / b·c·e·f 否决 / d 备选不落）；
  ④ 受影响文件表 11 档 + 用例 T18–T24 / T-CL-U1–U2 + 验收 U1–U8（cmd.exe 可跑）；⑤ 边界九条（含 VSC 对位登记 · note 面登记 · 降级分支备份路径）。**§6.27 机制/语义/射程三面零改**——本节只补唤醒面。
- 2026-09-18（**批 SUBAGENT-UPSTREAM-CHANNEL · 设计档面收正轮 · eng-designer**——承实现轮交付报告「待父侧」四则（父侧转派 · 修正轮 id=94））：逐则落位——
  ① §6.27.4 schema 块补 `readonly: true` **只读分类**行 + 三处 dispatch 载荷回指（`thincoder-core/agent/dispatch.mjs:167` / `:257` / `:483`）+ **机检锚**（`thincoder-core/test/parent-channel.test.mjs:278`）；
  ② §6.27.6 ▸ **越线登记**补 `escalate-async.mjs`（300 → **302**——本批新增越 300 软线档）+ 核侧 `SOFT_LINE_REGISTRY` 已登记回指（`thincoder-core/test/core-hygiene.test.mjs:32-37`）；
  ③ §6.27.6 表行数按 **as-of 2026-09-18 17:3x 实测**回填（209 / 291 / 23 / 173 / 473 / 495 / 302 / 436 / 131 / 121；行 11–14 现盘 112 / 121 / 74 / 119——批后同窗写入已注，行 16 需求档 257 为父侧笔）；
  ④ 装配面**计数收正**：「5 个插入点」→ **4 处携带**（`thincoder-core/agent/family-tools.mjs:165-169` 实读——`eng-coder` / `eng-designer` / `coder` / 兜底段四者携带，`consult` 分支不入）——§6.27.2 ① · §6.27.4 装配接线 · §6.27.6 行 3 同改；**上一条目（修正轮 2 ⑤）的「5 个插入点」读法作废**。
  **实现面待落一处（登记）**：代码注 `thincoder-core/agent/family-tools.mjs:161-163` 现读「5 个插入点」（与实读 4 处携带相抵）——本席写域外（产品代码面），归实现轮改述；机制零新语义（只补登记行 / 回填读数 / 改计数措辞）。
- 2026-09-18（**批 SUBAGENT-UPSTREAM-CHANNEL · 设计评审修正轮 2 · eng-designer**——承 `docs/batches/2026-09-18-subagent-upward-channel.md` §3 轮次 1 重发（8 条：🟡 5 · 🔵 3；VERDICT pass））：逐条落位——① §6.27.6 行 11–14 提示词面回填「已落笔」+ 实测 Δ（+21 / +2 / +15 / +2；as-of 2026-09-18 16:2x）；
  ② F6 行补 sync 面**单向**处置（`send` 不可达 ⇒ 父重派 / 无答复兜底）+ 工具返回注按 `_upstream.sync` **两形分述**（W1–W3 携带 `sync` 字段）+ 工具描述补 SYNCHRONOUS SPAWN 句；
  ③ 结束注脚**两形态判据点**逐字（池条目 `done: true` / 出池 + 墓碑 `cancelled`）+ 第三态**不附注脚**显式声明 + 用例 T15 / T16 / T17（A2 / A4 同改）；
  ④ **载体吸收**（`_childUpstream` / `_childUpstreamSeq` 同经 `carrierField` + 载体别名单点——与 `_asyncQueue` / `_asyncAdvisorQueue` 同列）+ **VSC 形已知面 F8**（端壳自持循环 ⇒ drain 不经端壳；端壳载体表未含字段）与 D-UC6 / §6.27.11-6 同改；
  ⑤ 装配面表述收正为**4 数组 + explore / plan 共享兜底段**（5 个插入点——**该计数已作废，见上一条目 ④**；未列名 depth>0 role 亦装配）+ A1 补兜底段断言；⑥ 消费点 **import 形态 = 动态**（同 `injectAsyncResult` 先例）；§6.27.6 行 1/3/7/8/15 同步、行 16 行数按需求档落笔后实测回填（233 → 257）。机制零新语义。
- 2026-09-18（**批 SUBAGENT-UPSTREAM-CHANNEL · 设计评审修正轮 1 · eng-designer**——承 `docs/batches/2026-09-18-subagent-upward-channel.md` §3 轮次 1（5 条：🟡 3 · 🔵 2））：逐条落位——① A 表回指逐条对齐
  （A3 → 条目 1 · A4 → 条目 3 · A5 → 条目 4 · A7 → 条目 6 · A6/A8 → 批档自身约束「无对应条目」）；② W1 站点收正为 `subagent-spawn.mjs:463` 邻位（`relayPrefix` 定值后——消 `:345` TDZ）；
  ③ 闸一窗口**显式定为「未 drain」**（§6.27.2 ③ + F5 + 错误文案 + 提示词双面 + 工具描述 + T10 + A5 同改）；④ §6.27.6 表项 15 行数按修正轮实测回填；⑤ T-CL1 更新面补 `:82` 标题串（三处同改）。机制零改（窗口 = 既有队列语义的显式化）。

- 2026-09-18（**批 SUBAGENT-UPSTREAM-CHANNEL · 设计轮 · eng-designer**——承 `docs/batches/2026-09-18-subagent-upward-channel.md` §1 · 台账 #81）：**新增 §6.27**——子代理上行通道：
  四面裁定（机制 = 新工具 `notify_parent` + 父侧队列 `_childUpstream` + 回合边界注入单点；语义 = 非阻塞五步 + 无答复兜底；
  射程 = 两问自检 + 正负清单 + 三闸；失败 = F1–F7）· 方案选型 7 候选 · 接口契约（W1–W3 上游接线 3 站点全枚举 + 注入 / 返回 / 错误文案逐字）·
  与既有机制关系 7 行 · 受影响文件 16 档 · 用例 T1–T14 · 判据 A1–A8；提示词面逐字建议（`common.md` 双面 + `discipline-engineering.md` 双面 + 工具描述）**父侧落笔**。

- 2026-09-18（**批 PROMPT-FACE · 设计轮 · eng-designer**——承 `docs/batches/2026-09-18-prompt-face.md` §1.1 ① · 台账 #23）：新增 §6.26——机制性指令注入位置收正：
  分类裁定表 14 行（S1 批次档行 / S2 审计模板 = spawn 级固定 ⇒ 改走 system 固块；advisor 评审简报 = 同类已由 F13 pinned 重挂覆盖）；
  机制 = `child._spawnSystemBlock`（spawn 单点写入）+ `prepareRun` 拼接（槽位后、项目指令前）；缓存契约兼容证明 + 压缩面不变量句；
  审计块构造器外提 `audit-block.mjs`（拟新增）；用例 U1–U7（含先红）· 判据 A23-1–A23-6。

- 2026-09-18（**批 TOOLFACE-FIXES · 设计评审修正轮 1 · eng-designer**——承 `docs/batches/2026-09-18-toolface-fixes.md` §3 轮次 1）：逐条落位——§6.7.2 补 depth 可用性行（发现 3）·
  ③ 改**父字段主 + 载体别名**（CLI `history` 非稳定载体实核——发现 4）+ U6b / V2 用例 · 判据补 A1b（拒形态同款 · 发现 11）/ A5b（绑定腿目标坐标 · 发现 12）/ A6b ·
  A1 计数改「5 → 6 + 命令与搜索根」（发现 2）· 拆分计划候选面具名 + §6.20.8-3 指向措辞收正（发现 8）。

- 2026-09-18（**批 TOOLFACE-FIXES · 设计轮 · eng-designer**——承 `docs/batches/2026-09-18-toolface-fixes.md` §1）：新增 §6.25——
  ① `subagent status` 补同款 depth 门 + 同文案族（锚取现行 §6.7.2）· ② `pruneQueue` 第四读面经 `carrierField` 吸收 ·
  ③ `writeTombstone` 借用规则扩张（父无自有容器且载体在场 ⇒ 落载体 + 同容器别名回父字段；窄形可达证据 = VSC 合成 parent + 载体未预建 `_asyncTombstones`）；
  用例 U1–U6 · 判据 A1–A6。对应台账 #46 / #43。（2026-09-18 PROMPT-FACE 设计轮纯机械折行——零语义改动）

- 2026-09-18（**批 VSC-MIRROR-RETIRE · 设计轮 · eng-designer**）：新增 §6.24——VSC 装配面（第三面）enum 收正为 F5 集 + 测档判据 `includes` → 集合相等（假绿根治）；坐标实核（`thincoder-vscode/src/agent/setup-tooltable.mjs:216` · 端装配面 `thincoder-vscode/src/agent/setup.mjs` 的 `:277`/`:276` · 缝 `:25`/`:40`）。

- 2026-09-18（**批 M-FAMILY-SWEEP · 设计评审修正轮 1 · eng-designer**）：活档同句收正（评审轮 1 发现 1）——§6.7.1 `:19` plan 行模式列改「普通」· `:24` 模式过滤句工程侧去 `plan`（回指 §6.22 F5）；§6.23.4 补越 300 软线拆分登记（发现 3）；§6.23.7 A-MS6 改集合式判据（发现 4）。
- 2026-09-18（**批 M-FAMILY-SWEEP · 设计轮 · eng-designer**）：新增 §6.23——M5 委派面小散件收正（①a 描述句如实两向 / ①b 工程模式 enum 收正为 F5 集 / ② `round` 真单源）；受影响文件 6 档 · 用例 U1–U7 · 判据 A-MS1–A-MS6；条目 ③（VSC 测试登记死项）落 `TESTING.md` §10.1。
- 2026-09-17（**v2 就地更新 · 退役批** · 主 agent）：M5 模块设计语义融合——新增 §6.22 委派与 spawn 门（F1 继承 / F2 round 结构化参数 / F3 带宽六格 from-zero=1·mid-梳理中=2·mid-已梳理=4 / F4 裁撤 / F5 enum 收正 / F6 files 声明面；落点 `spawn-gates.mjs`；AC-M5 验收）；原旁路档 `_archive/modules/ENGINEERING-MODE-V2-MODULE-DELEGATION.md` 归档 `_archive/modules/`。
- 2026-09-17（**F3 带宽裁撤** · eng-designer——承 `docs/batches/2026-09-17-bandwidth-repeal.md` §2 · **用户 2026-09-17 裁定**）：§6.22 拆 F3——F3 行改墓志（墓志形态承 F4 先例）· 门序链 / 落点句 / AC-M5-4 清带宽活体引用 · F4 行注记去 F3 指针。

- 2026-09-15（**迁移批 · 第 5 批 · eng-designer**）：**建档**——自 `docs/core/design/AGENT-LOOP.md` 拆出 §6.7–§6.12（节号沿用）；**并入**——评审对象锚（旧档 §12.1）→ §6.18 · 判定铁律 R1–R7（旧档 §12.2）→ §6.19（来源档一字未改，留参照历史）；引用修复 = §6.7.6 工程模式档指针改指现状（`ENGINEERING-MODE.md`）· §6.8 核内形态指针回指母档 §2.3 · §6.10 凭证机制指针改指 `ENGINEERING-MODE.md`。
- 2026-09-15（**批 4 CLI-ASYNC-DISCARD · eng-designer**）：**新增 §6.20**——CLI 侧中止丢弃对称（子代理 / 评审池）：
  问题陈述 + 现状坐标三站点 · 方案选型对比（9 候选 × 4 轴）· 接口契约（新档 `thincoder-core/agent-tools/async-discard.mjs` 双导出
  + 判定 / 动作序 / 文案 verbatim / 端差 D-AD8a·b / 两接线点 / C-6 判据收口）· 受影响文件清单（R24a 行数 + 拆分计划）·
  关键决策 D-AD1–D-AD8 · 用例表（U1–U9 / I1）· 验收标准 A1–A7（回指 F1–F4 / N1–N3）· 边界六条；
- 2026-09-16（**批 4 CLI-ASYNC-DISCARD · 设计评审修正轮 1 · eng-designer**）：§3 十二发现逐条落设计档——🔴#1 墓碑写点改 `writeTombstone`（载体吸收单点）+ U9 夹具次序前提；
  🟡#2 A6 补核用例执行入口（`thincoder-core` 下 `node --test`，CI `.github/workflows/test.yml:36-46` 同式）；🟡#3·#4 判据口径统一 = controller 支、两接线点不传 ctx（D-AD6 修订——删去 ② 捕获改写旧口径）；
  🟡#5 D-AD8c status 回显面登记 + 收敛方向；🟡#6 对侧 `thincoder-vscode/docs/design/AGENT-LOOP.md:751` 行协调项（归父侧另案）；🔵#7 consult 族残留登记（§6.20.1 + D-AD5）；🔵#8 零命中口径收窄（墓碑状态 / 提醒文案）；
  🔵#9 行数口径脚注 + 批次档行改「各段追加」（本档 442 → **450** 实测）；🔵#10 TESTING 双指针（§2 寿命 + §5.2 F19 禁令）；🔵#11 U7 直调前提；🔵#12 队列 `position` 重编号 + ⟦ev⟧ 块头残差登记。
- 2026-09-16（**批 4 CLI-ASYNC-DISCARD · 修正轮 1 机检卫生收尾 · eng-designer**）：§6.20.1 零命中段简写路径补 `thincoder-core/` 全限定（消 1 条新增悬空锚——「零新增（非前向引用类）」口径复归）；:271 / :334 折行（后者原 323 字符——宽度违规清零；折行位以现状帧计）；行数复测 = **457 行**（修正轮终态；前记 450 → 457 = 修正轮内后段落笔 +4 · 本轮机检卫生 +3（折行 +2 · 变更记录行 +1））。
- 2026-09-16（**批 8 ENGINE-DEBT · 设计轮 · eng-designer**——承 `docs/batches/2026-09-16-engine-debt.md` §2 ED-4）：§6.10 修订——async advisor 超限语义由「即拒」改**异 scope 入队 / 同 scope 仍拒**（队列复用子代理域既有排队语义；`agent.poolLimits` 默认值不变）+ 同 scope 守卫补**出队复检**句；
  需求侧同批 `docs/core/requirements/AGENT-LOOP.md` §4.3 新增 **F-B5**（原「不做评审排队」撤）。
- 2026-09-16（**批 8 ENGINE-DEBT · 设计轮 · eng-designer**——承 `docs/batches/2026-09-16-engine-debt.md` §2 ED-5）：**新增 §6.21**（spawn 站点取号断言——防静默覆写）：问题陈述与现状坐标（三取号站点 / 三入池点 / 病征自陈 `subagent-scheduler.mjs:379`）·
  方案选型对比（4 候选 × 4 轴——选定「一次性取号令牌 + 入池键守卫」）· 接口契约（`_lastSubagentId` 一次性令牌 + 三处键守卫；取号公式 / 池键形态零改）· 受影响文件清单（R24a——核 4 文件 + CLI 测档）·
  关键决策 D-SUB-ID1–ID4 · 用例表 T5-1–T5-8 · 验收 A1–A5（回指 E5 判据①–③）· 边界六条；需求侧同批新增 **F-B6**（`docs/core/requirements/AGENT-LOOP.md` §4.3）。
- 2026-09-16（**批 8 ENGINE-DEBT · 设计轮 · 机检卫生收正 · eng-designer**）：`:171` / `:555` 折行（原行超 300 字符——本档宽度违规清零）。
- 2026-09-16（**批 8 ENGINE-DEBT · 设计轮 · ED-4 排队面落笔 · eng-designer**——承 `docs/batches/2026-09-16-engine-debt.md` §2 ED-4（R1 裁定））：§6.10 增**排队面补充**（队列上限 / TTL 不新设 · 补位覆盖评审池 · 取消 = 出队）；
   §6.11 取消路由补 **queued 分支**（出队 + 余位重编号 + cancelled）；§6.20.3 `discardAbortedAdvisors` `wasStatus` 扩 **queued** 面。
- 2026-09-17（**af 批 · fix 轮 · eng-designer**——承 `docs/batches/2026-09-17-async-face-fixes.md` §2.12）：① §6.9 新增**终态守卫**（c1——单点谓词 `entryTerminal` + 两补位消费点〔`queueRunnable` / `refillAdvisorQueue`〕；§6.10 ② 补指针）；
  ② §6.11 第 3 条 **三面 → 五面**（加**日志面**〔F-6——queued 取消出队点直记 `ev:cancelled`〕+ **工具路径收口**〔F-3②——`executeCancelAction` advisor 落池分支不得早退〕）。对应台账 #20 / #21 / #31。

- 2026-09-17（**af 批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-17-async-face-fixes.md` §2）：§6.11 第 3 条补**队列取消收尾三面逐字**
  （机读线提醒文案 · `⟦ev⟧cancelled` 发射源 · **不经 settle ⇒ 无 `⟦ev⟧stopped`**）；§6.10 排队面补充增 ④ **队列载体**（`_asyncAdvisorQueue` 入载体字段集 + 三读面载体吸收）。对应台账 #20 / #21。
- 2026-09-17（**af 批 · 二轮 fix 轮 · eng-designer**——承 `docs/batches/2026-09-17-async-face-fixes.md` §2.13）：① §6.7.2 sync 定向中止增**日志面**（F-12——`cancelSyncChild` 提交点直记 `ev:cancelled`，与异步取消族同形）；
  ② §6.11 第 3 条增**端侧路径收口**（F-11——VSC ⏹ advisor 目标不得走专用直调分支，须与子代理族同经 `executeCancelAction`）；同批**收尾面计数收正**（五面 → 七面——补计「幂等与池面」并计新面）。对应台账 #20（F-11）/ 日志面补全（F-12——无台账条目）。
- 2026-09-18（**af 批 · 三轮 fix 轮 · eng-designer**——承 `docs/batches/2026-09-17-async-face-fixes.md` §2.14 · 设计评审轮 1）：① §6.11 第 3 条**块面事件面发射单源化**（#1——唯一发射点 = 核 `cancelAsyncAdvisor` queued 分支〔含 `pushReal`〕，接口 = 可选 `onToken` 形参；工具路径 / CLI mouse / VSC 三路各传通道、均不另发）；
  ② 同条「工具路径收口」面改述「经核单点（不另发）」+ 新增 **CLI mouse 直连路径去重**句（实读定性 = 自持发射 ⇒ 去重）；③ 端侧路径收口句补 `was` 生产点点名（中继合成——本批零改）。对应台账 #20。
- 2026-09-18（**af 批 · 微 fix 轮 · eng-designer**——承 `docs/batches/2026-09-17-async-face-fixes.md` §2.15 · 设计评审核销轮 2 尾巴③）：§6.11 第 3 条 mouse 去重句**统一为守卫形**（自持发射行加 `!isAdvisorBlock` 守卫——共享行保留；评审族由核单点经传入通道发射）——**措辞收正，机制零改**。
- 2026-09-18（**af 批 · fix 轮 2 · eng-designer**——承 `docs/batches/2026-09-17-async-face-fixes.md` §2.16 · 实施轮开口项 1 / 4 / 6 父侧裁定）：§6.11 第 3 条「幂等与池面」补三句——
  ① **确认形状**逐字定格（首发含 `was:"queued"` / 重复无 `was`）；② **确认面外延**接受并登记（墓碑读取无面别 ⇒ 曾 running 取消、已 settle 出池的 id 亦答同一确认；不扩墓碑形状）；
  ③ **跨 run 墓碑无区隔**登记（取号计数器不随载体跨 run ⇒ 旧 cancelled 号可重取 / 池未命中时陈旧 ⏹ 答 `cancelled`）。**机制零改**——三句均为既有行为定格 / 登记。
- 2026-09-18（**坐标漂移收正轮 · eng-designer**——承 `docs/batches/2026-09-18-distill-prefix.md` §5 八、登记 · 台账 #76）：载体面「`history` 非稳定载体」句坐标收正——
  `thincoder-core/explore-distill.mjs:148` → **`:144`**（蒸馏前缀批 −4 位移；同句 `thincoder-core/context.mjs:309` / `:317` / `:332` / `:483` 与 `thincoder-core/session.mjs:301` / `:438` 逐处实核未漂移）。语义零改。
- 2026-09-18（**失效表达清理批 · 本批直接执行 · 可 revert**——承用户 2026-09-18 裁定「修订式表达很害人，失效的表达一定要删掉」）：删除现役规范面内的失效表达（不留划改残留）——§6.22 定位句括注 · 功能点 F3 / F4 两行 · 落点句「F3 拆除后回落」半句 · 验收表 AC-M5-4 行。历史沿革 = 本档既有历史段 + 批档 `docs/batches/2026-09-18-stale-expression-purge.md`。
- 2026-09-20（**P2 机制层端差批 · 车道 3 设计档落笔轮 · eng-designer**——承 `docs/batches/2026-09-20-mechanism-parity-batch.md` §2.21）：§6.27.12.2「挂起驱动坐标」段尾句按现态收正——核驱动 = **参考实现**（唯一消费者 = 核测）；挂起面权威 = 两端驱动（已分叉，**判保留**）；核档读者不得据其改端行为（2026-09-20 §2.21 裁定）。机制条文零改。
- 2026-09-20（**库存清账批 · v1 测试门词面收正 · eng-designer**——承 `docs/batches/2026-09-20-residual-sweep-batch.md` §2 · 台账 #128）：§6.20.7 A6 行判据收正（v1 三层命令 → `lint` / 各包 `npm test` 单入口）。**零新语义**。
