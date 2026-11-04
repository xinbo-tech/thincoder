# 子代理工具契约与装配面（AGENT-LOOP-SUBAGENT）· 核心统一子系统档（拆分面）

> 归属 = `docs/core/design/AGENT-LOOP.md` 的**机制族拆分面**——「子代理工具契约与装配面」族。
> **三分**——自本档迁出：后台异步池 / 挂起回合与 digest / 评审实例面 ⇒ `docs/core/design/AGENT-LOOP-ASYNC-POOL.md`（§6.8 · §6.10 · §6.11 · §6.18 · §6.19 · §6.20）；子 → 父上行与唤醒面 ⇒ `docs/core/design/AGENT-LOOP-UPSTREAM.md`（§6.27 全族）。
> **节号沿用母档全局编号**（本档承接 §6.7 · §6.9 · §6.12 · §6.21–§6.26 · §6.28–§6.30；本档自有 §6.58 · §6.59）——全仓既有指针**只改档名、不改节号**；母档续 §6.1–§6.6 + §6.13–§6.17。
> 母档 = `docs/core/design/AGENT-LOOP.md`（归属与范围 / 核模块裁决行 / 须用户裁条目 / 对外契约 / 受影响文件 / 主循环机制面 §6.1–§6.6 / 诊断与预算面 §6.13–§6.16 / 关键决策 / 沿革）。
> 工作流档 = `docs/core/design/CORE-UNIFICATION.md`；需求层 = `docs/core/requirements/AGENT-LOOP.md`（含 §4 需求条目面）。

## 6.7 子代理（`subagent` 工具）

**综述**：子代理 = `depth > 0` 的独立 agent 对象 + 丢弃式局部双线；role 决定工具集（只读过滤）与 overlay prompt。

### 6.7.1 角色与委派

| 角色 | 能力 | 模式 |
|---|---|---|
| explore | 只读查询族 / **零 git**（§6.7.4）/ 报告须列未找到项 / thoroughness 三档 | 普通 + 工程 |
| plan | 纯只读规划 | 普通 |
| coder | 父全量读写执行 + verify / advisor 自评 + 强制交付表 | 普通 |
| eng-coder | 工程模式替换 coder + 设计驱动 overlay + 必带 `designToken` + explore 受限审计 | 工程 |
| eng-designer | 工程模式写稿面唯一作者（设计档 / 批次档 §2，含修订；**需求档不归它**——只读，改动回主 agent）+ **无 designToken**（授权 = 需求已确认）+ 必带 `batchDoc` + `round` + explore 受限勘察 | 工程 |
| tester | 读数来源：只读工具集 ∪ `{execute, bash}` − `{verify, advisor}`；只跑不改 = 角色契约（父侧按缺陷处理）；不写档、工具表里没有 `advisor`（面见 §6.59） | 普通 + 工程 |

**模式过滤**：普通模式 explore / plan / coder / tester；工程模式 explore / eng-designer / eng-coder / tester——schema enum 反映现行模式（角色互斥：工程禁 plan 与 coder、普通禁 eng-coder 与 eng-designer；`tester` 两模式都可派；schema 枚举 + 运行期硬门禁双保险；裁定源 = §6.23.3（角色 enum 契约）；`tester` 一侧判据见 §6.59）。

**委派动机**：隔离上下文（子 agent 全部读写调用不进父窗口）+ 单任务专注 + 并行省时 + coder / eng-coder 自带 verify / advisor 自评。thoroughness 三档 = quick（单点定向）/ medium（默认，适度并行）/ thorough（多位置全面分析，报告列搜索过什么 / 没找到什么）——提示词约定形态，不加工具参数。

**报告契约**：<200 字符视为交接不完整，打回扩写一次（`MIN_REPORT_CHARS`）；超长报告落盘全量保留。

**权限**：手动模式下子代理非只读工具透传到父 agent 权限审批（人在回路）；**eng-coder 例外 = spawn 时任务域授权**（已批准设计 + 任务书即授权——内部写豁免逐写审批）；非 eng-coder 子代理手动档语义不变。

**模型 override 解析**：子代理模型 = tool 参数 `model` > `config.agent.subagentModels[role]` > `config.agent.subagentModel` > 继承父 provider
（`resolveChildProvider`——`thincoder-core/agent-tools/subagent-async.mjs`）。合法形态 = `"provider:model"` / 渠道名 / 模型名 / `"default"`（= 不覆盖）。**非法形态三层防线**：

① config 加载期清洗——`subagentModel` / `subagentModels.*` 非「非空字符串」者不采纳（回退 `null` ∕ 剔除该键）+ 一次性警告（`loadConfig`——沿 `sanitizeConsultModels` 先例）；

② 运行期解析入口对非字符串入参抛**明确错误**（不裸 TypeError；tool `model` 参数面同防）；③ settings 写面形状表拒非法（既有）。VSC 端壳自读 raw 配置（不经核 `loadConfig`）——**端差处置 = VSC 端壳同拍清洗**：清洗逻辑核内单源（沿 `sanitizeConsultModels` 先例）、端壳于 raw 读点（`thincoder-vscode/src/agent/setup.mjs:131-132`）同拍消费 ⇒ 两端同判、用户零可见端差；宿主能力面举证不成立（清洗为纯函数、无宿主约束）。

### 6.7.2 单工具动作面（九动作）

`spawn / status / observe / send / escalate / cancel / panel / consume-design / design-slots`（`check` 已删——§6.7.5）；`action` 缺省 = `spawn`——既有 subagent 调用（无 action）零迁移。**eng-coder role 覆盖**照旧（role 参数不影响工程协议）。

| action | 参数 | 返回 | 阻塞 |
|---|---|---|---|
| spawn（缺省） | role / batchDoc / round / designToken / designId + `files?` / `dependsOn?`（逐角色见 §6.22.1——工程角色无任务书文本参数） | `{ id, role, status, position?, waiting?, reason? }` | 同步 role 等完成；async 立即返回 |
| status | id?（省 = 全部概览） | `{ running / queued / done }` 结构化数组（running 带 model / elapsedSec / turn / maxTurns / touched 摘要） | 不阻塞 |
| observe | id（必填）+ recent?（默认 5） | `{ id, role, status, turn, maxTurns, touched…, currentTool?, recentTurns, done? }` | 不阻塞 |
| send | id + message（均必填） | `{ id, status: "delivered", queued }` | 立即（入队） |
| escalate | task / model? | 术后报告（缺省 async——settle 三分类 → digest） | 缺省 async |
| cancel | id（必填——防误全停） | `{ id, status: "cancelled" }` | 立即（定向 abort） |
| panel | `{ view?, freeze? }`（互斥） | 镜像快照 / 冻结回收确认 | 同步 |
| consume-design | designId? ∥ designIds? ∥ expired? ∥ olderThanDays?（选择器恰一） | 消费回执（逐枚 ∥ 批量——逐枚行 + 计数） | 同步（父侧 · 工程模式——语义 = `DESIGN-TOKEN-SETTLEMENT.md` §5 / §9） |
| design-slots | designId? | 槽位清单（designId ∥ live/expired ∥ 时龄 ∥ `expiresAt` ∥ 批 ∥ `designToken`——龄升序）+ 计数尾行；`designToken` 恒列（过期照列——`status` 自标态；畸形 ⇒ `—`）；`designId` 过滤 ⇒ 单槽行 + 计数尾行（注 `(filtered by designId)`）；两值原样入 eng-coder spawn | 同步（父侧 · 工程模式 · 只读） |

**depth 可用性（本表 = 锚 `§6.7.2` 的规则住所）**：`status` 与 `observe` / `send` / `escalate` / `cancel` / `panel freeze` **同为 depth 0 专有**——子代（`depth>0`）调用 ⇒ 显式拒（子代无自有异步池）；**`consume-design` / `design-slots` 同属父侧（depth-0）面**（受限变体拒绝清单在案）；

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
  **判据 / 门控 / 路由三条已落，产者侧序缺陷致运行期未达 ⇒ 降级登记**——见 `docs/vsc/design/WEBVIEW.md` §5.2）——

  点击 ⇒ 宿主 sync 分支（`thincoder-vscode/src/extension/panel-messages-turn.mjs` `handleCancelSubagent`）经核 `cancelSyncChild` 单源直连（与 CLI 同法）；`action:"cancel"` 只对 async 池 / advisor 池。
- **信号链**：`armSyncChildAbort` 建**自属** `AbortController` 并链到基信号 `buildChildSignal`（`_sessionSignal ?? ctx.signal`）；
  注册 `parent._syncChildAborts`（Map，key = relayPrefix 去尾 `role#N`）——try / finally **三路径注销**。
- **catch 三分支**（纯函数 `classifySyncAbort(ctxSignal, baseSignal, ctrlSignal, err)`）：① base / ctx aborted → 整回合停，rethrow；
  ② `AbortError` ∧ ctrl aborted ∧ 非整回合停 → **折叠**（`mergeChildMutations` + stopped partial 报告 + `⟦ev⟧stopped` 直发 + 正常 return）；③ 其他错误原样。
  `STOPPED_MARK`（定义 = `thincoder-core/agent/child-marks.mjs`——`spawn-child.mjs` 再导出；与 `TURN_CAP_MARK` 同族）= 折叠报告公共锚。

`⟦ev⟧` 事件 token **文法机读单源** = `thincoder-core/agent/subagent-event.mjs`（零依赖叶——哨兵 ∥ 形态判据 ∥ 逐事件投影；`spawn-child.mjs` 再导出哨兵 ⇒ 既有 import 面零改；消费方 = ACP 桥，见 `docs/cli/design/ACP-CLIENT.md` §12；显示面三消费点收敛 = 登记）。
- **TUI 面板门控**：按 `_syncChildAborts` 存在性 + queued 分支判 ⏹ 可见；⏹ 顺带 deny 该 child 的 pending 权限 / continue 模态。
- **日志面**：⏹ 定向中止在 `cancelSyncChild` **提交点**（`entry.stopped = true` + `ctrl.abort({ abortTrigger:"cancel", abortDetail:"sync-child-cancel" })` 之后、`return { status:"cancelled" }` 之前）**直记一条**
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

**顶层一律异步**：规则覆盖 `spawn` / `escalate` / `advisor`——三者的顶层同步例外全移除；`async:false` 在 depth-0 仍平台合法（机制零触碰），但提示词与**工具描述**不引导（工具描述面 = 项目仓内文件，是模型的最大引导面）。

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

- **`files?: string[]`**——写域声明（纪律：清单外改动允许但必须逐项报告；不做任务书文本自动解析）。**目录声明不支持**（`normalizeFileList` 对以 `/` 或 `\` 结尾 / 指向既有目录 → 抛明确错误，fail-closed）。归一化：相对 cwd 转绝对（`resolve`——平台原生分隔符，win32 为反斜杠）；冲突比较另走 win32 小写键（`thincoder-core/agent-tools/subagent-scheduler.mjs:70` 的 `fileKey`）。
- **写域进 child 视野**：本清单同时作为写域行注入 child 的 system 固块（机制单源 = §6.26「写域行（S4）」——文案与用例住那里，本档不复述）。
- **`dependsOn?: string[]`**——子代理 id 列表（显式依赖）。
- **`batchDoc?: string`**（eng-coder spawn **门禁参数**——非**调度器**参数，不参与 `files` 域冲突判定；同档并发的拒发面见 §6.58——那是 spawn 门，不是调度器排队）：工程模式 spawn `role="eng-coder"` **必传**（批次档路径）；判据 = 参数在 + `resolve(cwd, batchDoc)` 存在且为文件（**不校验内容 / 措辞**）；缺失 / 不可读 → spawn 拒绝（校验落点 = `buildSpawnChild`——token 门之前，sync / async 两路共经）。
- **准入（spawn 时）**：(running ∪ queued) 有 files 交集 或 `dependsOn` 未 done → 入 queued（waiting-deps 态记原因）；否则立即 start。**仅 async 参与调度**：sync spawn 带 `files` / `dependsOn` 且命中冲突 → **明确错误**（不队列化）。
- **动态文件域**：冲突判定的「他条目域」= `effectiveFiles(e)` = 声明域 ∪（running 且已绑 `childAgent` 时的 `childAgent._touchedFiles`——写工具批提交实时记录）；queued 条目无 `childAgent`（start 才绑）⇒ 天然只声明域。out-of-list 写入由此获得域保护。
- **补位（`maybeRefillAsync`）**：settle / cancel 释放槽后从 queued 选「依赖全满足 + 域无冲突」的最早条目启动到槽满（先入者优先）。
- **终态守卫**：补位**永不启动终态条目**——判据（逐字）`entry.cancelled === true ∨ entry.done === true` ⇒ 跳过（不 `start()`）；
  单点谓词 = `entryTerminal(entry)`（`thincoder-core/agent-tools/subagent-scheduler.mjs`，与 `queueRunnable` 同址），两消费点 = 子代理族 `queueRunnable`（`maybeRefillAsync` 经它判）· 评审族 `refillAdvisorQueue`。

  **动机**：取消后条目若仍留队列（出队未生效面——#21 的 VSC 合成 parent 下 `dequeueAdvisor` no-op 即此形），补位会把它 `start()` 重启——
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

## 6.21 spawn 站点取号断言（防静默覆写）

### 6.21.3 接口契约

- **新增约定字段（核私有，非对外 API）**：`parent._lastSubagentId`（`number | undefined`）。
  - 写：`nextSubagentId(parent)` 在 `:397` 回写 counter 的同一原子段内**同步**写令牌 = 返回值。
  - 读：消费点断言 `parent._lastSubagentId === id`，**断言通过即置 `undefined`**（一次性——消费即失效，防同一令牌跨站点复用）。
  - 失配 ⇒ `throw new Error(...)`（文案含「allocator not called (nextSubagentId)」语义 + 站点名 + `role#id`）。
- **入池键守卫（三入池点同族）**：`set` 前断言键不存在（`has(String(id)) === false`）；命中 ⇒ `throw new Error("subagent id collision: <role>#<id> already in pool")`。
- **数据流（不变式）**：spawn 站点 → `nextSubagentId`（写 counter **且** 写令牌）→（同步）消费点读 counter + 断言令牌 → 入池键守卫 → `set(String(id), entry)`。
- **零改面**：取号公式（`subagent-scheduler.mjs:412-413`）· 载体字段名 `_subAgentCounter` · 池键形态 `String(id)` · relay 前缀（`relayPrefixOf`）· VSC 镜像载体 ·
  `_asyncQueue` / position / 补位 / describeBlockers / detectStall 语义。

### 6.21.5 关键决策记录

- **D-SUB-ID1（断言族 = 令牌 + 键守卫双管）**：令牌抓「漏调分配器」，键守卫抓「覆写」——二者互补。
- **D-SUB-ID2（令牌 = 同步配对语义）**：令牌生命周期 = 取号 → 同步消费（`subagent-spawn.mjs:417` → `subagent-run.mjs:61` 无 await 间隙）。
  **跨 await 的新取号站点**令牌不适用 ⇒ 该站点以键守卫兜底，并在站点处显式登记（**不**把令牌扩为多槽 / 计数池——那会使失效面变复杂、误报面变大）。
- **D-SUB-ID3（报错形态 = 抛 `Error`，fail loud）**：静默改号恰是掩盖「漏调」这一被断言对象（与判据①相反）。
- **D-SUB-ID4（范围 = 仅核侧）**：VSC 侧同机制复用核实现，本条目零 VSC 写入。

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

### 6.21.7 验收标准（逐条回指）

| # | 验收标准（可机检） | 回指 |
|---|---|---|
| A1 | 漏调路径**必红**：T5-5 / T5-6 / T5-7 三例断言抛错（`assert.throws`——非静默通过） | — |
| A2 | 断言在位可机检：`subagent-run.mjs` / `escalate-async.mjs` / `advisor-async.mjs` 消费点各含令牌断言、三入池点各含键守卫（grep 断言句 + 抛错分支） | — |
| A4 | 范围守恒（机检）：diff 不触取号公式行（`subagent-scheduler.mjs:412-413`）与池键形态（`String(id)`）；`thincoder-vscode/**` 零写入 | — |
| A5 | 触碰源档 ≤800 硬限；越软线档在档内登记（含拆分计划） | — |

### 6.21.8 边界（本条目不做）

1. 不改 id 语义 / 分配算法 / 取号公式 / 池键形态 / relay 前缀形态；不新增第四条池。
2. 不做 VSC 侧写入（镜像面只读复测）；不改 VSC 测验夹具。
3. 不改 `_asyncQueue` / position / 补位（`maybeRefillAsync`）/ `describeBlockers` / `detectStall` 语义。
4. 不改令牌为多槽 / 计数池形态（D-SUB-ID2）；不做跨进程 / 槽持久化。
5. 不迁「取号公式句并入 `AGENT-LOOP.md` 子代理池节」（迁移 = 另案）。
6. 不解 ED-4 排队面（§6.10 / §6.11）与 ED-1 / ED-2 / ED-3 条目内容——互不耦合。

## 6.22 委派与 spawn 门（任务书单通道 = 批次档 §2）

**定位**：委派治理的**结构承载**。任务书只有一个来源——**批次档 §2**（设计席写、经设计评审）；工程角色的 spawn 不再携带任何任务书文本参数。

**最近先例**：§6.23「工具描述与门同源」族——`subagent.mjs` 描述句随门改口、`ROUND_VALUES` 单源。**对齐**其形：描述面与门同源、判据值集单源；**偏离**一处：先例只做参数级收正（同一套参数改口径），本节把任务书整体从参数面移到档面（参数面清零）——没有先例可完全套用，故 KD 面另立（§6.22.4）。
**勘察证据**：查过——
- 提示词面：`thincoder-core/prompts/persona-engineering.md` ∥ `thincoder-core/prompts/discipline-normal.md`（载五参）、`thincoder-core/prompts/discipline-engineering.md`（0 命中）；
- 工具与门面：`thincoder-core/tool-docs/subagent.md` · `thincoder-core/agent-tools/subagent.mjs` · `spawn-gates.mjs` · `subagent-spawn.mjs` · `audit-block.mjs` · `thincoder-core/permission.mjs`；
- 夹具与基准：`bench/probe/data.mjs` · `bench/check/probe.check.mjs` · `docs/core/design/MODEL-BENCH.md`。

公开源档内未见同机制成案（本节为首案）。

工程角色（eng-coder / eng-designer）的 spawn 面 = `batchDoc`（必带、可读）· `round`（enum，必带）· `files` / `dependsOn` / `async` / `model`（调度与运行面）· eng-coder 另带 `designId` + `designToken`。

非工程角色（explore / plan / coder / tester）保留任务书参数：四项核心（`goal` / `knownFacts` / `acceptance` / `reportFormat`）+ `scope`。explore / plan / coder 没有批次档，不存在「第二个来源架空第一个来源」这条缺陷路径；`tester` 有执行面（能写盘，不是纯只读角色），它仍取五项任务书是用户裁定（F-TT5，2026-11-02），其写面由角色契约约束而非只读面约束（§6.59.7）——上面那条「只读角色改不动任何东西」的推导不适用于它。

**范围判据（本设计的推导，非用户逐字）**：**只读角色改不动任何东西，通道不构成风险；有写权的角色必须只有一个任务来源。**依据 = 用户 22:42「真正的解决方案是取消designPoints这个参数，要求一切必须写在批档里」+ 22:43「那把这些自由文本参数都取消，eng-coder只接受批档一个任务通道」（原话）。

据此收口面 = **eng-coder ∥ eng-designer 两个可写角色**；explore ∥ plan ∥ 普通 coder 一律不动——自由文本在它们那里是「勘察方向」，不是任务书。
`task` / `context` 同为自由文本且都进子代理 input（拼装尾段 / `Context:` 前缀），按同一判据对两个工程角色一并拒收（推导项，basis = 范围判据——自由文本且进子代理 input ⇒ 第二任务来源）。

**§2 引用面约束（用户 2026-10-24 22:55 裁定）**：**任务书（批档 §2）禁止引用任何批档**——含路径、批档节号、台账与批档互指；只许引需求档条目 / 设计档小节 / 代码坐标。理由：批档可随时整体清理，引用它 = 写下一个立刻就要断的指针（`docs/core/design/DOC-DISCIPLINE.md` §4.5.1）。执行面 = **§6.29.3 单源**（三项，本节不复制）；不新增运行时内容校验（KD-SC7 不变）。

**判据句（为什么删）**：门只校三样——批档可读 ∥ token 未过期 ∥ designId 配对。三样全真时，一段主 agent 当场写、零校验的自由文本仍能把「从未设计、从未评审」的改动派出去。
**门校的是凭证自洽，不是任务书属于这份设计**；只要自由文本参数在，这条绕行面就一直在。

### 6.22.1 接口契约（参数面：取消 / 保留 / 拒收）

| 参数 | eng-coder | eng-designer | explore / plan / coder |
|---|---|---|---|
| `batchDoc` | 必带 ∧ 可读 | 必带 ∧ 可读 | coder 可选（既有） |
| `round` | 必带（initial / fix） | 必带 | — |
| `designToken` / `designId` | 必带 / 多槽时必带 | — | — |
| `goal` `knownFacts` `acceptance` `reportFormat` | **拒收** | **拒收** | 必带 |
| `scope` | **拒收** | **拒收** | 必带 |
| `task` `context` | **拒收** | **拒收** | 保留（`task` 可选） |
| `designPoints` | **退役**（传入即拒，点名并指路 §2） | 同左 | 不动（未声明键，行为同改前） |
| `files` `dependsOn` `async` `model` | 保留 | 保留 | 保留 |

**拒收判据 = 键在场**：值全空白也拒——键在场说明派单方仍以为自己在写第二本任务书。

**门的取参面 = 工具入参原对象**：门内以 `const a = args ?? {}` 判（`spawn-gates.mjs` 各谓词同形），不按 schema 做白名单投影 ⇒ 已从 schema 删除的 `designPoints` 仍能到达门并被点名拒收（用例 §6.22.6 #13）。实现轮须核实唯一取参点（`thincoder-core/agent-tools/subagent.mjs` 的 spawn 分支）在 schema 校验 / 剥键之前取参；若上游会剥键，拒收面须上移到剥键之前。

**必填集合（一眼看出缺什么）**：

| role | 必填 |
|---|---|
| eng-coder | `role` · `batchDoc`（可读）· `round` · `designToken`（多槽时另需 `designId`） |
| eng-designer | `role` · `batchDoc`（可读）· `round` |
| explore / plan / coder | `role` · `goal` · `knownFacts` · `scope` · `acceptance` · `reportFormat` |
| tester | `role` · `goal` · `knownFacts` · `scope` · `acceptance` · `reportFormat`（同 explore 五项；不进 `ENGINEERING_ROLES`，见 §6.59.2） |

**门序**：角色 enum → `batchDoc` 门（既有；同档在飞的拒发判据见 §6.58）→ 任务书门（工程角色 = 拒收八个自由文本键 ∥ 非工程角色 = 四项核心 + `scope` 必带）→ `round`（工程角色）→ token 门（eng-coder，既有）→ files 声明面（既有）。

**拒收文案（逐字模板；实现单源 = `spawn-gates.mjs`，`<…>` 为拼入值）**：

```text
Spawn task-channel gate (role='<role>'): <offending names, " / " separated>. An engineering spawn carries NO task-book text parameters — the task book is batch record §2 (batchDoc), read by the child itself. Put everything the child needs into §2 before spawning; a thin §2 earns a bounce, not a supplement. Required for role='<role>': <required names, " · " separated>.
```

`designPoints` 命中时，该名后缀一句：` (designPoints is retired for every role — write §2, or scope for explore/plan/coder)`。

### 6.22.2 子代理任务输入（数据流）

- 工程角色：`input` = 一行机械文本 `Task book: §2 of the batch record at <abs path> — read it before acting; it is the only task channel for this spawn.`（路径 = 门内已解析的绝对路径）。
- `child._engTaskInput` = 该行（批档路径记账面；审计块的批档路径另取 `ctx.agent._batchDoc`——KD-SC6）。
- 非工程角色：`input` = 既有拼装（`context` 前缀 + 任务书参数 + 可选 `task`），零变。
- **运行时不抽取 §2 正文注入**（KD-SC5）：eng-designer 自己会写 §2，注入正文 = 给它一份落笔前的过期副本；抽取还要解析 markdown 标题，脆。

### 6.22.4 关键决策记录

- **KD-SC1（全删，`reportFormat` 也不例外）**：判据 = 内容随任务变化的参数一律进 §2；跨任务不变的表单进 persona 层。`reportFormat` 是平台惯例（persona 已固定交付表），留它只能重复交付表 ⇒ 变成第二判据。同判据删 `goal` / `knownFacts` / `acceptance`（内容全随任务变）。
- **KD-SC2（非工程角色不动——派生判据，推导自 22:42 / 22:43 两句话）**：**只读角色改不动任何东西，通道不构成风险；有写权的角色必须只有一个任务来源。** explore / plan / coder 没有批次档（无第一来源可被架空），工程模式禁 `coder` / `plan`，`explore` 只读（强制只读工具集 + 权限恒 false）⇒ 写面不开放；工程模式里唯一的写入口是 eng-coder / eng-designer，收口即可，无需波及只读角色。
- **KD-SC3（参数没收 ≠ schema 全删）**：工具一格 schema 全局，`goal` 等仍须在 schema（非工程角色用）；工程角色的拒收由门执行 ⇒ 误传得到点名拒绝，而不是静默忽略。`designPoints` 例外：只有工程语义、零剩余消费者 ⇒ 从 schema 真删；拒收只对工程两个角色执行（非工程角色传它 = 未声明键，行为同改前——派生判据不动只读角色）。**门的取参面 = 入参原对象**（§6.22.1）——拒收不依赖 schema 声明，删属性不削弱门。
- **KD-SC4（`task` / `context` 一并拒收——推导项）**：用户原话是「那把这些自由文本参数都取消，eng-coder只接受批档一个任务通道」（22:43）——**未逐项点名五参**，收口面 = 全部进子代理 input 的自由文本。`task` / `context` 不在原五参之列，但同为自由文本（拼装尾段 / `Context:` 前缀）——按同一判据一并拒收（推导项）。不拒就是换名夹带；若用户只认五参字面，删掉这两个键的拒收即可，判据其余部分不动。
- **KD-SC5（子代理自读 §2，运行时不注入正文）**：① eng-designer 自己写 §2，注入正文 = 过期副本；② 抽取要解析标题，脆；③ 审计证据面更强（读评审正本，不读拼装副本）。
- **KD-SC6（审计块改指 §2 路径）**：`_engTaskInput` 不再是拼装文本，A2 摘要失去来源 ⇒ 删 `summarizeEngTaskBook`，审计块注入 `Batch record (batchDoc): <abs path>` + 「任务书 = 该档 §2，自读」。
- **KD-SC7（§2 内容不校验——有意的代价）**：门判据只到「批档可读」。§2 写不够 ⇒ 子代理只能打回，没有补递渠道。**打回是设计选择，不是缺陷**：内容校验要语义判断，机械门只能做形式匹配（正则撞标题 = 假绿 / 假红），而形式匹配给不了「任务属于这份设计」的保证。
- **KD-SC8（拒绝而非忽略）**：多传的键静默丢弃会让派单方以为已生效；点名拒绝把代价放在派单时刻。
- **未取方案**：① 留 `reportFormat` 作唯一幸存者（重复交付表，第二判据）；② 要求 `designPoints` 逐字等于 §2（§2 是散文，不可能；比对等于把评审结论当字符串）；③ 留 `goal` 作一行指针（指针也能说谎，仍是自由文本）；④ 运行时机械抽取 §2 正文注入（KD-SC5）。

### 6.22.5 验收（判据自足；回指由 §2 单向指向本节）

| # | 判据 | 机检命令 ⇒ 期望 |
|---|---|---|
| AC-SC-1 | 取消范围：工程角色传 `goal` / `knownFacts` / `acceptance` / `reportFormat` / `scope` / `task` / `context` 任一（含空白值）⇒ 拒且点名；传 `designPoints` ⇒ 拒且点名退役；非工程角色行为零变 | `node --test bench/check/probe.check.mjs` ⇒ exit 0（拒收断言组逐键：七键 + `designPoints` + 空白值 + 非工程角色零变） |
| AC-SC-2 | 必填集合：eng-coder 缺 `batchDoc` / `round` / `designToken` 各出既有拒句（文案零变——**例外登记**：round 门 `:49` 的 five-task-book 句按 P13 改新口径）；eng-designer 缺 `batchDoc` / `round` 同 | `node --test bench/check/probe.check.mjs bench/check/probe-frozen.mjs` ⇒ exit 0（既有拒句冻结面） |
| AC-SC-3 | 任务书行：工程角色 `input` 含批档绝对路径且写明「§2 = 唯一任务通道」；`_engTaskInput` 同值 | `node --test bench/check/probe.check.mjs` ⇒ exit 0（driver 放行态断言组） |
| AC-SC-4 | 非工程角色零变：explore / plan / coder 四项核心 + `scope` 行为、拼装序、错误文案逐字不变（**例外登记**：`:139` 的 designPoints 指路句按 P13 改——原句称该名属于工程角色，与同档 `:83` 退役句互斥） | `node --test bench/check/probe.check.mjs bench/check/probe-frozen.mjs` ⇒ exit 0（非工程用例 + 冻结面） |
| AC-SC-5 | 提示词面：`thincoder-core/tool-docs/subagent.md` 的新任务书段与 §6.22.8-A 逐字全等（整行 `===`；不做折叠归一——归一正是「字符不变只挪断点」的免检通道）；两档整档无 >300 字符行；工程示例与工程段落不带任务书文本参数；**拒收名册只活在门的报错里，不进提示词**（提示词只正面陈述工程角色带什么）；提示词档无退役参数表述 | `node -e "const fs=require('fs');const c=(f,s)=>fs.readFileSync(f,'utf8').split(s).length-1;console.log(c('thincoder-core/prompts/persona-engineering.md','designPoints'),c('thincoder-core/prompts/persona-engineering.md','every spawn role'),c('thincoder-core/prompts/persona-engineering.md','four core'),c('thincoder-core/prompts/persona-engineering.md','goal='),c('thincoder-core/prompts/discipline-normal.md','designPoints'),c('thincoder-core/prompts/discipline-normal.md','every spawn role'),c('thincoder-core/prompts/discipline-engineering.md','designPoints'))"` ⇒ `0 0 0 0 0 0 0`（七列全 `0`：两档无退役参数、无「every spawn role / four core」旧口径、`persona-engineering.md` 内 `goal=` 示例零处）；`thincoder-core/tool-docs/subagent.md` 含 §6.22.8-A 段 1 处、按整行逐字比较同一判法（`node --test bench/check/probe.check.mjs` 断言组 exit 0）；`node -e "for(const f of ['thincoder-core/tool-docs/subagent.md','thincoder-core/prompts/persona-engineering.md'])console.log(f,require('fs').readFileSync(f,'utf8').split('\n').filter(l=>l.length>300).length)"` ⇒ 两行均 `0`（整档无 >300 行——存量 >300 行按重新组织语言重写处置后的判据） |
| AC-SC-6 | 审计块：含 `Batch record (batchDoc):` 行与 §2 指向句；`summarizeEngTaskBook` 符号 0 命中 | `node -e "console.log((require('fs').readFileSync('thincoder-core/agent-tools/audit-block.mjs','utf8').match(/summarizeEngTaskBook/g)||[]).length)"` ⇒ `0`（全 `thincoder-core` 扫同法）；审计块断言随 `node --test bench/check/probe.check.mjs` ⇒ exit 0 |
| AC-SC-7 | 过渡：现存设计 / 需求档里以 `designPoints` 为落点的验收条款逐条改指 §2 | `grep -rn "designPoints" docs/core/design docs/core/requirements` ⇒ 命中行仅剩「退役 / 改指 §2」表述（逐行核，`grep` 结果即清单） |
| AC-SC-8 | 引用面：本档无批档出处行（只留模板形 `docs/batches/<批档词干>.test.mjs`）；机检三式 = 批档路径形 ∥ 发现表编号形 ∥ 批档 §2 条目号形；任务书 §2 无批档坐标（人核，§2 内容不机检——KD-SC7） | `node -e "const t=require('fs').readFileSync('docs/core/design/AGENT-LOOP-SUBAGENT.md','utf8');console.log((t.match(/docs\/batches\/[0-9]{4}/g)||[]).length,(t.match(/发现表 F-[0-9]/g)||[]).length,(t.match(new RegExp('批次档 '+ '§2 条目','g'))||[]).length)"` ⇒ `0 0 0`（第三式字面被拼接断开，不自匹配本行） |

### 6.22.6 用例表（正常 / 边界 / 错误）

| # | 类 | 输入 | 期望 |
|---|---|---|---|
| 1 | 正常 | `{role:"eng-coder", batchDoc, round:"initial", designToken, designId}` | 放行；`input` = 任务书行；`_engTaskInput` 同值 |
| 2 | 正常 | `{role:"eng-designer", batchDoc, round:"initial"}` | 放行，同上 |
| 3 | 正常 | `{role:"explore", goal, knownFacts, scope, acceptance, reportFormat}` | 放行；拼装五段，逐字同改前 |
| 4 | 边界 | 工程角色 + `task:"…"` | 拒；点名 `task` |
| 5 | 边界 | 工程角色 + `context:"…"` | 拒；点名 `context` |
| 6 | 边界 | 工程角色 + `goal: "   "` | 拒（键在场即拒，不看值） |
| 7 | 错误 | 工程角色 + `designPoints:"…"` | 拒；点名退役 + 指路 §2 / scope |
| 8 | 边界 | 非工程角色 + `designPoints:"…"` | 行为零变（未声明键不判——范围判据：只读角色不动） |
| 9 | 错误 | eng-coder 缺 `batchDoc` | 既有批档门拒（文案零变） |
| 10 | 错误 | eng-coder 缺 `round` | 既有 round 门拒（零变） |
| 11 | 错误 | eng-coder 缺 `designToken` | 既有 token 门拒（零变） |
| 12 | 边界 | `explore` 在工程模式内（eng-coder 的审计派单）带五项 | 放行（explore 无写通道，任务书参数保留） |
| 13 | 错误 | 工程角色 + `designPoints:"…"`，而 schema 已删该属性（未声明键） | 仍拒并点名退役——门判入参原对象（§6.22.1）；两条断言同时成立：属性不在 schema ∥ 键到达门 |
| 14 | 边界 | 工程角色 + `round:"fix"` + 批档 §2 写足 | 放行（修复轮只靠 `round` 区分；无文本参数可携带） |

### 6.22.7 边界（本条目不做）

1. 不改 token 机制（签发 / TTL / 消费 / 槽）。
2. 不改 `batchDoc` 必填性与路径判据（参数在 + 路径可读；内容不校验）；同档在飞的拒发判据见 §6.58。
3. 不校验 §2 内容（KD-SC7）；不新增任何任务书参数。
4. 不改 `files` / `dependsOn` 调度语义、`round` 枚举、角色 enum。
5. 不改非工程角色的任务书参数与拼装序。
6. 不动 `batch` 工具的段作者面、advisor 评审通道、`escalate` 的 `task` 语义（escalate 不是 spawn）。
7. 不做 §2 正文的运行时抽取（KD-SC5）。
8. 不做跨批引用检测——§6.29.3 的检测面按 2026-10-24 22:55 裁定废止；执行面 = §6.22 的 §2 写作约束 + 设计评审退回。
9. 不改 `thincoder-core/prompts/discipline-engineering.md`（2026-10-24 22:55 全档 grep：四类表述 0 命中，零改）。

### 6.22.8 提示词面逐字改法

| # | 落点 | 现文（逐字摘要） | 改法（逐字） | 判据 |
|---|---|---|---|---|
| P1 | `thincoder-core/tool-docs/subagent.md:23` | `Task book (every spawn role): four core structured parameters — … plus ONE fifth parameter named by role: designPoints … for eng-coder/eng-designer, scope … for explore/plan/coder. All five are required … round (initial\|fix) is mandatory for eng-coder/eng-designer. An eng-coder spawn also carries designToken …` | 整段替换为 §6.22.8-A（下方代码块） | 描述与门同源 |
| P2 | `thincoder-core/tool-docs/subagent.md:26-27` | `subagent(role="eng-coder", round="initial", goal="…", knownFacts="…", designPoints="…", acceptance="…", reportFormat="…", batchDoc="<batch record>", designToken="…")` ／ explore 行五参 | 取 §6.30「参数骨架」块第 1 行（eng-coder）∥ 第 3 行（explore）逐字——示例正本住 §6.30，本节不复制 | 示例即门形 |
| P3 | `thincoder-core/agent-tools/subagent.mjs:142` | `task: … OPTIONAL free-text supplement — the brief itself is the structured task-book parameters (four core … plus the role's fifth: designPoints … scope …); a task-only spawn is refused …` | `For action:'spawn': non-engineering roles (explore / plan / coder / tester) — OPTIONAL free-text supplement; the brief itself is the four core parameters (goal / knownFacts / acceptance / reportFormat) + scope. Engineering roles (eng-coder / eng-designer) take NO task-book text parameters — their task book is batch record §2 (batchDoc), read by the child itself. For action:'escalate': the brief (goal, constraints, entry files, acceptance criteria).` | 描述与门同源 |
| P4 | `thincoder-core/agent-tools/subagent.mjs:143` `context` | `Optional background the sub-agent needs (it cannot see this conversation); action:'spawn' only.` | `Optional background for non-engineering spawns (explore / plan / coder / tester) only; action:'spawn' only.` | 同上 |
| P5 | `thincoder-core/agent-tools/subagent.mjs:153-158` | 五条 `REQUIRED for every spawn role …`；`designPoints: {…}` 属性一条 | `goal` / `knownFacts` / `acceptance` / `reportFormat` 首句 → `REQUIRED for role='explore'/'plan'/'coder'/'tester' (non-engineering task book) …`；`scope` 首句 → `REQUIRED for role='explore'/'plan'/'coder'/'tester' (non-engineering task book, the fifth parameter) …`；**删除 `designPoints` 属性整行**；`batchDoc` 描述加一句 `This IS the task book for engineering roles — batch record §2, read by the child itself.` | 同上 |
| P6 | `thincoder-core/prompts/persona-engineering.md` §Call chain 的 `spawn eng-designer` 形 | `spawn eng-designer (\`subagent(role="eng-designer", batchDoc=<…>, files=[...], round="initial", goal=..., knownFacts=..., designPoints=..., acceptance=..., reportFormat=...)\`; \`task\` is an optional supplement)` | `spawn eng-designer (\`subagent(role="eng-designer", batchDoc=<this batch's record path>, files=[...], round="initial")\`)` | 示例即门形 |
| P7 | `thincoder-core/prompts/persona-engineering.md` §Implementation dispatch structure 的 `In engineering mode the spawn looks like` 句 | ``subagent(role="eng-coder", designId=<id>, designToken=<token>, batchDoc=<batch record path>, round="initial", goal=..., knownFacts=..., designPoints=..., acceptance=..., reportFormat=...)`` | ``subagent(role="eng-coder", designId=<id>, designToken=<token>, batchDoc=<batch record path>, round="initial", files=[...])`` | 同上 |
| P8 | `thincoder-core/prompts/persona-engineering.md` §Implementation dispatch structure 的 `The task book is batch record §2` 句 | 「Every dispatch carries a task book — four core = structured spawn parameters, every spawn role」+ `goal` / `round` / `designToken` / `knownFacts` / 第五项按角色 / `acceptance` / `reportFormat` 七条列表 | 整段替换为 §6.22.8-B（下方代码块）；`files` 是调度通道那两条警告（§Implementation dispatch structure 的 `The \`files\` parameter is a SCHEDULING channel`）逐字保留 | 任务书单通道 |
| P9 | `thincoder-core/prompts/persona-engineering.md` §Parallel dispatch 的 `subagent(role="eng-coder", designId=<id-B>` 两行 | 两条并行 token 隔离示例（各带五参） | 两条同 P7 形（只差 designId / designToken 字面） | 示例即门形 |
| P10 | `thincoder-core/prompts/discipline-normal.md:253-260` | `Every delegation carries a task book — four core = structured spawn parameters, every spawn role …` 与第五项按角色行、`Every spawn role: …` | `Every non-engineering delegation (explore / plan / coder / tester) carries a task book — four core structured spawn parameters:` / 第五项行改为 `**\`scope\`** (scope & forbidden scope — what to read / what not to touch)` / 末尾改 `Every non-engineering spawn role (explore / plan / coder / tester): …`；另加一行 `**Engineering-mode spawns (eng-coder / eng-designer) carry no task-book text parameters** — their task book is batch record §2, and free text parameters are refused with the parameter named.` | 层次不串 |
| P11 | `thincoder-core/permission.mjs:38` | `cap(composeTaskBookBrief(args, args.role) \|\| args.task \|\| "", 500)` | `cap(composeTaskBookBrief(args, args.role) \|\| (args.batchDoc ? \`task book: batch record §2 (\${args.batchDoc})\` : "") \|\| args.task \|\| "", 500)` | 人审面不空白 |
| P12 | 需求面（主 agent 笔） | `docs/core/requirements/ENGINEERING-MODE-V2.md:430`「派单任务书 = 四项核心 + 第五项按角色」／`:433`「四项核心 + 第五项按角色 + round 要可见」／`docs/core/requirements/ENGINEERING-MODE-V2-SPEC-DELEGATION.md:7`「四项核心 + 第五项按角色」／`:14-19` 五项列表／`:33` AC-M5-2 | 均改为「**任务书 = 批次档 §2**（工程角色零任务书文本参数，自由文本参数点名拒收）；非工程角色（explore / plan / coder）= 四项核心 + `scope`」；`:33` 判据改为「工程角色：`batchDoc` 可读 ∧ `round` 合法 ∧ 无任务书文本参数（命中即拒并点名）∥ 非工程角色：四项核心 + `scope` 缺任一即拒」 | 需求与设计同口径 |
| P13 | `thincoder-core/agent-tools/spawn-gates.mjs:49` ∥ `:139` | `:49` round 门文案 `the five task-book parameters are enforced by a separate gate (validateTaskBookParams)` ∥ `:139` 拼接模板 ` (got ${otherFifth} instead — that name belongs to the eng-coder/eng-designer spawns)` | `:49` → `task-book text parameters are refused for engineering roles by a separate gate (rejectEngFreeTextParams)`；`:139` → ` (got ${otherFifth} instead — ${otherFifth} is retired for every role; the fifth parameter here is ${fifth})` | 同档两句互斥消解——`:83` 退役句为准；原 `:139` 把派单方指去一个同样拒收该名的 spawn，`:49` 自述的五参门对工程角色已不存在 |
| P14 | `thincoder-core/prompts/discipline-normal.md:255` | `**\`round\`** (initial \| fix — eng-coder / eng-designer only; fix rounds are point-fixes only, no full survey)` 挂在 normal-mode 任务书清单内 | 整行删除——`round` 是工程角色必带项，normal-mode 清单不列；工程面由同段末「Engineering-mode spawns …」行承载 | 层次不串（清单头 = normal-mode 四项核心，行内混工程参数）——**本格不改**（该行只枚举工程角色 `eng-coder / eng-designer only`，无「非工程角色集」可增；它所在的清单头 = P10，已在 P10 改） |
| P16 | `thincoder-core/agent-tools/subagent.mjs:227` | spawn 前置拒文的角色句 `… requires the structured task-book parameters for normal-mode roles (four core: goal / knownFacts / acceptance / reportFormat + scope) — a free-text task alone is not the brief.` | 同句 `for normal-mode roles` → `for non-engineering roles (explore / plan / coder / tester)`；其余逐字不变 | 描述与门同源（判据 = `isEngineeringRole`，tester 非工程角色 ⇒ 本拒文同样落在它身上） |
| P17 | `thincoder-core/agent-tools/spawn-gates.mjs:83` | `(designPoints is retired for every role — write §2, or scope for explore/plan/coder)` | `(designPoints is retired for every role — write §2, or scope for explore/plan/coder/tester)` | 同上（tester 的第五项同样是 `scope`） |
| P15 | `thincoder-core/agent/family-tools.mjs:99` ∥ `:129` | 注释 `its task book rides the mechanical summary of the parent's _engTaskInput instead` ∥ 审计通道描述 `The audit task book is appended MECHANICALLY — your own spawn task (docs involved / acceptance criteria / file list) plus the files you actually touched` | `:99` → `its task book rides the parent's batch record §2 instead (the audit block carries the batchDoc path)`；`:129` 该句 → `The audit context is appended MECHANICALLY — the batch record path (its §2 is the delivery's task book, read it before judging) plus the files you actually touched` | 描述与门同源——A2 摘要面已删（KD-SC6），现审计块 = 批档路径行 + §2 指向句 + touched 快照 |

**P4 是真判断点（本轮实读，不照抄）**：

- 拼装分支实读：`thincoder-core/agent-tools/subagent-spawn.mjs:370-372`——`engineeringRole ? <任务书行> : (args.context ? \`Context:\n…\n\nTask:\n…\` : taskBriefOf(args, role))`。
- tester 不在 `ENGINEERING_ROLES`（`thincoder-core/agent-tools/spawn-gates.mjs:54`）⇒ 走 else 支，**`context` 对它可用**。
- 拒收名单含 `context`（`spawn-gates.mjs:64`），但 `rejectEngFreeTextParams` 只对工程角色执行 ⇒ tester 传 `context` 不被拒。
- 故 P4 的枚举含 `tester`，且不写「normal-mode」——tester 两模式都可派。

**提示词面只作正面陈述，不预演错误**：模型只会用列出的参数——把被拒的名字写进提示词，等于把那串名字变成候选项。拒收名册只活在门的报错里（命中时逐字点名，§6.22.1），提示词与工具描述都不预演错误。

**§6.22.8-A（P1 的整段替换——一条规则一行，逐行 ≤300；整行逐字比较规则见 AC-SC-5）**：

```text
Task book (non-engineering roles: explore / plan / coder / tester): four core structured parameters — goal (goal & why), knownFacts (the facts you already verified), acceptance (machine-verifiable criteria), reportFormat (delivery-report format)
— plus scope (scope & forbidden scope — what to read / what not to touch).
All five are required: a missing, blank or non-string value is refused with the parameter named.
A free-text task is an optional supplement, never the whole brief.
Engineering roles (eng-coder / eng-designer) take their task book from the batch record: batchDoc (the record path) and round (initial|fix), plus files / dependsOn for scheduling; the child reads §2 of that record itself — no other task text is passed.
An eng-coder spawn also carries designToken — the write credential (the exact value from the review, or copied verbatim from the action:'design-slots' row, the text after designToken=), and designId when several designs are open: missing or mismatched = the spawn is refused.
```

**§6.22.8-B（P8 的整段替换）**：

```text
- **The task book is batch record §2**: an engineering spawn carries `batchDoc` (the record path) and `round` (initial | fix), plus `files` / `dependsOn` for scheduling; an eng-coder spawn also carries `designToken` and `designId` when several designs are open.
  The child reads §2 of that record itself — that is the only task channel.
  Everything the child must know goes into §2 **before** the spawn: the goal and its why, the design-doc landing points, the affected-file list, the acceptance criteria (each citing its design section), and the forbidden scope with its consequence.
  A §2 too thin to act on earns a **bounce**, not a supplement — there is no second channel by design.
  - **Why**: a free-text parameter is a task book the review never saw; the gate checks credentials, and a credential-valid spawn can still carry work nobody designed.
- **Where §2 and the design doc disagree, the design doc is the criterion source of record**: §2 cites `design §N.M`, never restates a count or criterion.
```

**写形依据**：A ∥ B 两块的落盘处（`thincoder-core/tool-docs/subagent.md:23` · `thincoder-core/prompts/persona-engineering.md` §Delivery-chain closure 的 `Why` 行 —— `a token written into a doc is a token in every clone`）非表格非围栏

批档写入门按整档判行宽（>300 即拒），单行 1000 ∥ 335 必破 ⇒ 处置 = 重新组织语言重写（一条规则一行时按规则边界断，不按字符数挪断点）；该档存量 14 条长行同一处置。

**§6.22.9 集成测试设计（本变更该得的场景与判据）**：

| 入口（业务可观察点） | 判据 |
|---|---|
| 探针 driver 起一次工程角色 spawn（夹具批档在盘） | 放行；子代理任务输入含批档绝对路径与「§2 = 唯一任务通道」；判官读到的任务书文本同源 |
| `probe.check` 旧五参形（含 `designPoints`） | 拒，文案点名该参数；`designPoints` 命中带退役句 |
| `probe.check` 工程角色 + `task` / `context` | 各拒并点名 |
| 审计派单 | 审计块含 `Batch record (batchDoc):` 与 §2 指向句；`summarizeEngTaskBook` 0 命中 |
| 非工程 explore spawn | 五参拼装逐字同改前 |

**UI / 交互决策**：无 UI 面；工具描述面与提示词面已在 §6.22.8 逐字给全，`open` 项为零。
## 6.23 M 家族小散件收正

**定位**：M5 委派面两处「声明与实况不符」的收正——① 工具描述句（**模型可见面**）与工程模式角色 enum（同为模型可见面）；② `round` 枚举单源（**契约值面**）。
同批条目 ③（VSC 测试登记死项）= `TESTING.md` §10.1。

### 6.23.3 接口契约（改前 → 改后 逐字）

| 落点 | 改前 | 改后 |
|---|---|---|
| `thincoder-core/tool-docs/subagent.md:77`（Mode filtering 句） | `Mode filtering: normal mode exposes explore/plan/coder; engineering mode exposes explore/eng-designer/eng-coder — off-mode roles are refused mechanically (enums filtered at assembly; the spawn gate re-checks).` | `Mode filtering: normal mode exposes explore/plan/coder/tester (eng-coder and eng-designer are refused); engineering mode exposes explore/eng-designer/eng-coder/tester (plan and coder are refused — plan is a normal-mode role, coder is replaced by eng-coder; tester is dispatchable in both modes). The role enum is filtered per mode at assembly, and the spawn gate refuses out-of-mode roles mechanically.` |
| `agent/family-tools.mjs:46` | `enum: ["explore", "plan", "eng-designer", "eng-coder"],` | `enum: ["explore", "eng-designer", "eng-coder", "tester"],` |
| `agent-tools/subagent.mjs:154` | `round: { type: "string", enum: ["initial", "fix"], … }` | `round: { type: "string", enum: ROUND_VALUES, … }`（+ 顶部 `import { ROUND_VALUES } from "./spawn-gates.mjs"`） |
| `agent-tools/spawn-gates.mjs:50` | `if (a.round !== "initial" && a.round !== "fix")` | `if (!ROUND_VALUES.includes(a.round))`（错误文案**逐字不变**：`round (initial\|fix)` / `round ∈ {initial, fix}` 由常量拼出，输出同形） |

**「改前」列的时态**：各格「改前」= 该批落地前实读；该批已落地，盘上只存「改后」形 ⇒「改前」在任何时刻都不可再复验，读它时别当活体判据——它记录的是那次改动的起点，不是第二条现行规则。

**零改面**：`family-tools.mjs:50` 的 suffix 句（现状准确）· `subagent.mjs:238` ROLES 白名单里 `plan` 必须仍在（门文案要能指名拒绝；该集现行成员见 §6.59.2 ①）· 门文案 `:242`/`:245`/`:248`/`:254` · `rejectEngineeringFilePaths` 谓词 · 正常模式 enum 的集（现行成员见 §6.59.2 ②）。

### 6.23.5 关键决策记录

- **KD-M5-7（描述句 = 门的取舍，不是实现快照）**：描述句陈述「哪个模式可派哪些角色」（真值来源 = 运行期门），enum 过滤机制另句说明。理由：描述句进模型上下文，模型需要的是「能不能派」，不是装配实现；句随门走比随实现走稳。
- **KD-M5-8（enum 收正到 §6.23.3 的集）**：enum 是模型读得到的派单依据；「可见但不可用」的值 = 系统性误导（模型按 enum 派 `plan` → 被门拒 → 空耗一轮）。该集已裁定，门文案已自称该集合 ⇒ 改 enum 三处对齐，不改该集。
- **KD-M5-9（`round` 真单源）**：契约值恒等要求 ⇒ 保留唯一字面量于 `spawn-gates.mjs`，schema 与谓词都引用它；用例从「重述字面量」改为「**接线断言**」（schema enum 与常量同一引用）+ 契约锁（字面量 = initial\|fix）+ 行为面（枚举成员逐一放行）。
- **KD-M5-10（门文案与白名单零改）**：`plan` 留在 `ROLES` 白名单与门文案中（拒收要能指名）——「enum 不收 `plan`」≠「门不认识 `plan`」。

### 6.23.6 用例表（正常 / 边界 / 错误）

| # | 类 | 输入 / 动作 | 期望 |
|---|---|---|---|
| U1 | 正常 | 读 `subagentTool.description` | 含新句（工程模式 = explore/eng-designer/eng-coder）；**不含**旧句 `engineering mode exposes explore/plan/eng-designer` |
| U2 | 正常 | `assembleFamilyTools({ depth: 0, engineering: true })` | role enum = `["explore","eng-designer","eng-coder"]` |
| U3 | 正常 | `assembleFamilyTools`（正常模式） | role enum = `["explore","plan","coder"]`（零回归） |
| U4 | 正常 | `subagentTool.parameters.properties.round.enum` | **=== `ROUND_VALUES`**（同一引用）且 = `["initial","fix"]` |
| U5 | 边界 | `validateRoundParam({ round: r })`，`r` 遍历 `ROUND_VALUES` | 逐一放行（枚举成员与谓词同源的行为面证据） |
| U6 | 错误 | `round: "v2"` / 缺 `round` | 拒；文案 `round ∈ {initial, fix}` / `round (initial\|fix)` 逐字不变 |
| U7 | 错误 | 工程模式 spawn `role="plan"` | throw（门文案含 `role='plan' is disabled`——门零改） |

### 6.23.7 验收标准（逐条回指）

| # | 回指 | 判据（机检命令 ⇒ 期望） |
|---|---|---|
| A-MS1 | ①a | 该批改面单测档（名随批档 · 收口即删；复跑 = 下一批的改面单测档）⇒ exit 0；且 `grep -c "engineering mode exposes explore/plan/eng-designer" thincoder-core/agent-tools/subagent.mjs` ⇒ `0` |
| A-MS2 | ①b | 该批改面单测档（名随批档 · 收口即删；复跑 = 下一批的改面单测档）⇒ exit 0（期望值 = §6.23.3 的集） |
| A-MS3 | ② | 该批改面单测档（名随批档 · 收口即删；复跑 = 下一批的改面单测档）⇒ exit 0（含引用同一性断言）；`grep -n 'enum: \["initial", "fix"\]' thincoder-core/agent-tools/subagent.mjs` ⇒ 零命中 |
| A-MS5 | ① | 门行为面零回归：U7 用例（工程模式拒 `plan`）通过 |

### 6.23.8 边界（不做）

- 不做 AC-M5 的核验本身（AC-M5-1/2/5/6 = 甲批）；
- 不在正常模式删 `plan`/`coder`（§6.23.3：normal 模式不删）；
- 不动 advisor 通道与 `rejectEngineeringFilePaths` 谓词面；
- 不改产品树旧档（`thincoder-cli/docs/**` / `thincoder-vscode/docs/**`）中的同句散文：`docs/README.md` §2 政策 = 产品树旧档属**迁移期参照历史**，保留 ≠ 维护——其中载同句者登记为参照历史，不随批改。
- 不做 VSC 清单的**反向**自检（盘上未登记档 → 拒）——见 `TESTING.md` §10.1「不做」。

## 6.24 VSC 装配面（第三面）enum 收正 + 判据收紧

**修法（枚举）**：`setup-tooltable.mjs:216` 的工程分支 enum 逐字收正为 §6.23.3 的集 `["explore", "eng-designer", "eng-coder"]`（集与序 = §6.23.3）。**不 import 核常量**——核侧该集是 `assembleFamilyTools` 内的字面量（非导出常量），端侧镜像面按既有形态自持字面量，**同集由判据锁死**（下条）。

**边界（本节不做）**：不动 `ROLES` 白名单与门文案（KD-M5-10——门须能指名被拒值）；不动正常模式集（§6.23.3：normal 不删）；不动核侧两处（§6.22 已收正）；不动深度门语义（端侧 `:276` 与核 `family-tools.mjs:44` 保持同构）。

## 6.25 动作面 depth 门收口 + 异步面残留两则

**接口契约（改前 → 改后 逐字）**：

① `subagent-actions.mjs` `executeStatusAction` 函数首行（改前 = `const agent = ctx.agent`）→ 改后先入门：

```js
if ((ctx.depth ?? 0) > 0) {
  return JSON.stringify({ status: "error", error: "status is only available at depth 0 — a child agent has no async pool of its own (AGENT-LOOP-SUBAGENT.md §6.7.2)" })
}
```

锚点取**现行可解析节号**（`AGENT-LOOP-SUBAGENT.md` §6.7.2 = 九动作面），不照抄 observe/send 的旧编号——旧编号在现行两档均不可解析。

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

**为何父字段为主 / `history` 为别名**：CLI agent 无预建 `_asyncTombstones`（懒建）⇒ **CLI 首写即走本分支**；

而 CLI 的 `agent.history` **不是稳定载体**——`thincoder-core/context.mjs:309` / `:317` / `:332` / `:483`（压缩重建）· `thincoder-core/explore-distill.mjs:144` · `thincoder-core/session-lifecycle.mjs:113` / `:438` 均以 `agent.history = [...]` **整体替换数组**。

容器若落 `history`（v1 形），主容器随替换漂移（靠父字段别名兜住、可运作但主落点不稳）；改后主容器 = 父字段（与今日落点**逐字同** ⇒ 「CLI 零回归」成可断言事实），`history` 侧写同一容器（VSC 合成 parent 形跨调用存活——修复目标不变）。
**VSC 绑定形零差异**：绑定 agent 的 `parent._asyncTombstones = new Map()` 经访问器即落 `history`（`thincoder-vscode/src/agent.mjs:147-153`），第二行幂等赋同容器。

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
| V2 | 边界（VSC 对侧） | 合成 parent（`{ history: H }`——无自有 Map）写墓碑 ⇒ 经**绑定形 agent**（`Object.defineProperty` get/set 绑同一 `H`——与 `thincoder-vscode/src/agent.mjs:147-153` 同形）读 | `tombstoneOf(绑定 agent, id)` **命中**（访问器用例成立）；绑定目标坐标 = 该档 `:140` 分支的 `history` 形参（合成 parent 与绑定 agent 携**同一数组**——`panel-messages-turn.mjs:113-118` 携 `lines.history`） |

**验收标准（逐条回指批档条目）**：

| # | 判据（机判） | 回指 |
|---|---|---|
| A1 | `depth:1` ⇒ 上列错误串**逐字相等**；九动作族源码 `only available at depth 0` 命中计数 **5 → 6**（既存五处文案逐字零改 + `status` 新增一处）。命令：`grep -rn "only available at depth 0" thincoder-core/agent-tools/subagent-actions.mjs thincoder-core/agent-tools/subagent-async.mjs thincoder-core/agent-tools/subagent-panel.mjs` ⇒ 逐档 **4 / 1 / 1**（改前 3 / 1 / 1）。**族外不计**：`advisor.mjs:147`（advisor 族另一文案）与单元测试档断言在 `agent-tools/` 全目录 grep 中会额外命中 ⇒ 搜索根 = 上列三档 | — |
| A1b | 拒返回形 ≡ **observe / send 既存拒形态**（引坐标 `subagent-actions-query.mjs:230` / `:48`）：`JSON.parse(返回)` ⇒ 两键 `{status:"error", error:<A1 串>}`（**对象形**；escalate `:341` 的 `Error:` 字符串形不在同款族） | — |
| A2 | `depth` 缺省 / 0 路径：CLI 与 VSC 两侧 status 用例全绿、返回体逐字不变 | — |
| A3 | 部分 parent 夹具（U3）：队列剔除 + `position` 重编号生效 | — |
| A4 | 完整 agent 形（U4）：与今日逐字同（回归） | — |
| A5 | 窄形夹具（U5）：跨调用 `tombstoneOf` 命中 | — |
| A5b | 绑定用例（V2）：合成 parent 写 ⇒ 经绑定形 agent 读 ⇒ 命中；绑定目标坐标已记（`thincoder-vscode/src/agent.mjs:147-153`——不可直测时该坐标即判据） | — |
| A6 | CLI 形（U6）：`carrierField(parent, "_asyncTombstones") === parent._asyncTombstones` | `AGENT-LOOP.md` §2.3 写回义务 |
| A6b | 首写用例（U6b）：无自有 Map + `history` 在场 ⇒ 主容器 = 父字段、`history` 侧同一容器 | — |

**边界（本节不做）**：不动 `spawn` 的 depth 语义；不动工具描述 / 提示词面（`subagent` 工具描述 = `thincoder-core/tool-docs/subagent.md`——描述外置面（`DESC("subagent")` 单点加载）；内容依据 = 机制文档，落笔 = eng-coder）；不做 observe/send/cancel/panel 既有门文案的旧编号收正（旧编号在现行两档均不可解析——域外登记）；

**不执行** `subagent-actions.mjs` 拆分，只登记不执行（§6.20.8-3 = §6.20 的边界声明，非拆分计划本体——措辞收正）。

## 6.26 机制性指令注入位置：spawn 固块改走 system 面

**分类裁定表（全仓同类扫描——逐处归类 + 理由）**：

判据（定形，理由见逐行）：**① 内容在 agent 生命周期内逐字节稳定（spawn 级 / 会话级固定）且属「这件事怎么做」的常驻契约 ⇒ system；
② 逐轮 / 逐 run 变化，或属「要做什么」的任务内容 ⇒ user（保持现状）。**

| # | 站点 | 坐标 | 现载体 | 归类 | 裁定 + 理由 |
|---|---|---|---|---|---|
| 1 | 批次档路径行（S1） | `thincoder-core/agent-tools/subagent-spawn.mjs:350` | user 首条 | spawn 级固定（同一 child 终身不变） | **改**：入 system 固块——判据 ① 两条全中 |
| 2 | 审计模板块（S2） | `thincoder-core/agent-tools/audit-block.mjs`（改前位 同档 `:401-437`） | user 首条 | spawn 级固定（父交付已定、touched 快照冻结） | **改**：入 system 固块——同上 |
| 3 | `_engTaskInput`（S3） | 同档 `:441` | 记账字段 | **非注入点**（批档路径记账面） | **保持**；值 = 一行机械任务书行（批档绝对路径 + §2 指向句）；A2 摘要面已删（§6.22 KD-SC6） |
| 4 | git 上下文 | `thincoder-core/agent/setup.mjs:55-64`（depth-0 门） | user 提醒 | 逐 run 变化 | 保持（子代理本就零 git——§6.7.4） |
| 5 | OS / cwd / Session start + 目录树快照 | 同档 `:65-80`（once-guard） | user 提醒 | 进程级变化 | 保持——判据 ② |
| 6 | repomap 大纲 | 同档 `:91-99` | user 提醒 | 索引态（可随索引变） | 保持 |
| 7 | 记忆 / 文档召回 | 同档 `:103-128`（depth-0 门） | user transient | 逐轮变化 | 保持——判据 ②（本条即契约句的举例面） |
| 8 | 当前时间 | 同档 `:146-150`（尾位） | user 提醒 | 逐 run 变化 | 保持（尾部即缓存契约既有设计） |
| 9 | env-state / peer / manifest 情境行 | `thincoder-core/agent/setup-reminders.mjs:50-56` · `:115-138` · `:160-166` | user 提醒 | 逐回合变化 | 保持——判据 ② |
| 10 | 活体守卫行（ENG 状态 / AUTO / verify 推回） | `thincoder-core/agent/completion.mjs:81` · `injectEngineeringReminder`（`thincoder-core/agent/helpers.mjs`） | user 提醒 | 逐回合变化 | 保持（`docs/core/design/ENGINEERING-MODE-V2.md:321` 已裁定「不落 system 槽」——其判据即本表判据 ②，不改该裁定） |
| 11 | advisor 评审简报（对象声明 + Approval Signal/token + 文档清单） | `thincoder-core/advisor/messages.mjs:29-39` · `:49-58` · `thincoder-core/advisor/run.mjs:233` | 评审 user 首条 | **评审级固定（同类根因）** | **不动——已由另一机制覆盖**：F13 pinned 重挂（`thincoder-core/advisor/compaction.mjs:56-84` 压缩时作为一条 user 消息重挂 · 调用点 `thincoder-core/advisor/compaction.mjs:94`）⇒ 压缩不丢。登记为「同类已解」 |
| 12 | consult / escalate / 读图降级子代理的任务文本 | `thincoder-core/agent-tools/consult.mjs:308` · `thincoder-core/agent-tools/subagent-actions.mjs:415` · `thincoder-vscode/src/extension/image-handler.mjs:84` | user 首条 | 任务内容（非机制性指令） | 保持——判据 ② 后半 |
| 13 | `REPORT_CONTINUATION`（报告过短追问） | `thincoder-core/agent-tools/subagent-async.mjs:327-329` | user 追问 | 按需重发（机制不同：重发即在场） | 保持 |
| 14 | async 结果注入 / digest 提醒 | `thincoder-core/agent-tools/subagent.mjs:412`（`injectAsyncResult`） | user 提醒 | 事件驱动 | 保持 |
| 15 | 写域声明行（S4） | `thincoder-core/agent-tools/subagent-spawn.mjs:346-357`（固块收集点） | **未注入**（只有调度器知道） | spawn 级固定（`files` 是 spawn 参数，同一 child 终身不变） | **改**：入 system 固块——判据 ① 两条全中；判据 ② 后半不命中（写域声明是「在哪改」的常驻契约，不是任务内容） |

**接口契约（改后 = 盘上真身节选）**：

生产者（`thincoder-core/agent-tools/subagent-spawn.mjs` `buildSpawnChild` 内）：

```js
// 改后（盘上真身 `:337-363` 节选——模板文本住 `audit-block.mjs`，spawn 档只做「收集 + 绑定」）
const input = engineeringRole
  ? `Task book: §2 of the batch record at ${batchDocAbs} — read it before acting; it is the only task channel for this spawn.`
  : (args.context ? `Context:\n${args.context}\n\nTask:\n${taskBriefOf(args, role)}` : taskBriefOf(args, role))
const spawnBlocks = []
if (batchBound) spawnBlocks.push(`Batch record (batchDoc): ${batchDocAbs}`)
if (engAuditAttempt !== null) spawnBlocks.push(buildAuditBlock(ctx))
if (files.length > 0) spawnBlocks.push(filesBlockOf(files))
if (engineeringRole) child._engTaskInput = input
if (spawnBlocks.length > 0) child._spawnSystemBlock = spawnBlocks.join("\n\n")
```

消费者（`thincoder-core/agent/setup.mjs` `prepareRun`，`:285` 之后）：

```js
let systemPrompt = base
// 派单固块：spawn 级固定的机制性指令随 system 面下发——run 内逐字节稳定（前缀缓存不破），
// 压缩只重建 history（吞不掉）。拼接位 = 槽位装配之后、项目指令之前。
if (agent._spawnSystemBlock) systemPrompt += `\n\n${agent._spawnSystemBlock}`
```

- **拼接位（槽位裁定）**：`base`（人格 → common → 纪律）→ **固块** → `Project instructions…` → skills 尾块。
  理由：固块与槽位同属「角色 / 契约」层；项目指令（不可信包裹）保持尾位（现状不动）。
  不新设槽位文件（槽位 = 设计档 + 提示词面（`thincoder-core/prompts/`），本块是**运行期派生文本**，非槽位档）。
- **字段生命周期**：`buildSpawnChild` 写入一次（sync / async 单点——`thincoder-core/agent-tools/subagent.mjs:276` 为唯一调用点）；
  此后只读 ⇒ 同一 child 的任意 run（含 `resume` 续跑、报告追问重跑）逐字节恒定。
- **文本零改**：块内文本逐字搬移（含块内 `above` / `below` 自指——它们指本块内的相对位置，整块搬移不改真值）
  ⇒ **不触提示词正文**（内容依据 = 机制文档，落笔 = eng-coder）；无正文改动 ⇒ 无上抛项。

**写域行（S4）—— `files` 首次进入 child 视野**：

- **触发**：`files.length > 0`。`files` 到这里已是归一化写域（`thincoder-core/agent-tools/subagent-spawn.mjs:137` 调 `normalizeFileList`：相对 cwd 转绝对——`resolve(cwd, f)`，平台原生分隔符，win32 为反斜杠）。空数组 / 未传 ⇒ **不推块**（`_spawnSystemBlock` 不因 S4 改变）。
- **收集序**：批次档行 → 审计块 → **写域行**（追加在既有两块之后，既有两个推块语句零改、零换序）。**序非断言对象**：A23-8 判 `_spawnSystemBlock` 逐字节相等、A23-9 判块内两句语义在位，都与位次无关 ⇒ 写域行只占最后一格。
- **落点**：`thincoder-core/agent-tools/subagent-spawn.mjs` 本档局部纯函数 `filesBlockOf(files)`（表头 + 逐条 + 两句，不外提模块——D23-9）。
- **角色无关**：只读角色（`explore` / `plan`）同样收本行——它们的写权限已由 `thincoder-core/agent-tools/subagent-spawn.mjs:250-251` 机械置 false，文案不必按角色分叉（第二种文案无观察到的场景支撑）。
- **文本（逐字；英文——与兄弟块同语体）**：

```text
Files declared for this spawn (the write domain this task declares, for scheduling):
- <abs path>
- <abs path>

This list is not an authorization boundary: touching a file outside it is allowed — report every out-of-list file you changed, with its reason. It is also not the whole change surface: other spawns on this task declare their own files, and what is listed here is your share only.
```

- **两句语义不可省**（缺任一句，本块就换一个病）：
  ① **预期写域 ≠ 授权边界**（纪律原文：`beyond-declaration ≠ violation, just disclose truthfully`）——缺这句，子代理读成「我只能写这些」⇒ 该写的漏掉，越界问题换成漏做问题；
  ② **本清单只是你那一份**——缺这句，子代理仍把任务书 §2 全文当成自己的改动面（本块的病因）。
- **不截断**：清单多长列多长——截断会把已声明档藏起来，正是本块要消除的「看不见」。

**最贴近先例**：`existing: thincoder-core/agent-tools/subagent-spawn.mjs:350`（`Batch record (batchDoc): …` 行）· name: 既有「spawn 固块」· consumers: `child._spawnSystemBlock` → `thincoder-core/agent/setup.mjs:285`。**对齐** = 同一收集点（`:346-357`）、同一绑定单点（`:363`）、同英文语体、同「空 ⇒ 不推块」纪律。**偏离** = 无——不新开通路、不新建模块。

**公开源勘察**：`docs/core/design/PROMPT-SYSTEM.md:176`（派单固块的字段与拼接位，逐字含「机制单源 = `AGENT-LOOP-SUBAGENT.md` §6.26，本档不复制」）· `docs/core/design/AGENT-LOOP.md` §6.3（system 前缀缓存契约）· 本档「缓存契约兼容证明」。**结论** = 本改动落在这三处既有契约覆盖内，无需新契约。

**既有件三问（新增名）**：`existing`（措辞面）= `thincoder-core/agent-tools/subagent-spawn.mjs:143`（`subagent files must be an array of file paths (the write domain this task declares)`）

∥ `thincoder-core/prompts/persona-engineering.md` §Implementation dispatch structure 的 `The \`files\` parameter is a SCHEDULING channel, not a briefing channel`（原引句 `spawns carry files (write domain)` 已不在盘）

两处都面向**派单侧**，consumers = 父侧主会话。

`none found`（子代理面）= 写域此前只被调度器消费（冲突检测 / 排队），从不进入 child 的提示词面 ⇒ 块内文案新造，唯一副本 = 本节。

**缓存契约兼容证明（`docs/core/design/AGENT-LOOP.md` §6.3——契约精化见同批该档修订）**：

- 契约的**操作条件** = 「同一 agent 的相邻请求前缀逐字节相同」；现行表述「跨 run 逐字节不变」是它在
  「system = 槽位装配 + 项目指令 + skills」下的**充分形态**，非必要条件。
- 固块值 = spawn 参数派生（批次档绝对路径 / 审计快照），**在 child 生命周期内恒定** ⇒ 同一 child 的任意两次请求 system 逐字节相同 ⇒ **命中不破**。
- 跨 spawn 不同值（不同批次档）不构成损失：新 child 的首个请求本来即缓存写（首现无前缀可复用）。
- 零回归：`_spawnSystemBlock` 为 null ⇒ 拼接分支不进入 ⇒ depth-0 / explore / plan / coder / consult 的 system 逐字节同改前

**压缩面不变量（AC 机判对象）**：

- `systemPrompt` 是 run 局部量（`thincoder-core/agent/run-start.mjs`（prepareRun 返回）取值 · `thincoder-core/agent/chat-call.mjs:18` 每轮组装请求）——**不在 `agent.history` 内**；
  压缩（`thincoder-core/context.mjs:274-324`）只重建 `history` ⇒ **结构上无法吞掉 system 面**。
- 压缩开销估算（`thincoder-core/agent/turn-loop.mjs:39-45` 的 `compactionOverhead.systemPrompt`）随固块自动增大 ⇒ 估算面不低计（无需另行处理）。
- **不变量句（逐字，供 AC 断言）**：压缩前 / 压缩后，同一 child 的 system 消息含**同一**固块文本，且 `agent.history` 内**不含**该文本。

**固块落地坐标（单源）**：写域行 = `thincoder-core/agent-tools/subagent-spawn.mjs` 固块收集块（`:346-357`）内一处 `spawnBlocks.push`（`:357`）+ 局部纯函数 `filesBlockOf`（`:170-178`）；审计块 = `thincoder-core/agent-tools/audit-block.mjs` `buildAuditBlock(ctx)`（touched 快照 + 模板逐字 + 批档路径行，路径取 `ctx.agent._batchDoc`）；

拼接分支 = `thincoder-core/agent/setup.mjs:285`；缓存契约精化句 = `docs/core/design/AGENT-LOOP.md` §6.3；装配事实行 = `docs/core/design/PROMPT-SYSTEM.md` §6.2。

> 行数纪律：**文档档不适用源码行数线**（线口径 = `AGENTS.md` 源文件）；档位归属（三分）——§6.8 / §6.10 / §6.11 / §6.18 / §6.19 / §6.20 ⇒ `docs/core/design/AGENT-LOOP-ASYNC-POOL.md`；
> §6.27 全族 ⇒ `docs/core/design/AGENT-LOOP-UPSTREAM.md`；本档留子代理工具契约与装配面。

**关键决策记录**：

| # | 决策 | 理由 |
|---|---|---|
| D23-1 | 载体 = **system 固块**（`child._spawnSystemBlock` → `prepareRun` 拼接） | 与缓存契约相容 / 压缩天然不丢 / 零重挂机制 |
| D23-2 | 拼接位 = 槽位装配之后、项目指令之前 | 固块与槽位同属「角色 / 契约」层；项目指令（不可信包裹）保持尾位不动 |
| D23-3 | 审计块构造器外提 `audit-block.mjs` | 块构造成纯函数可直测 |
| D23-4 | 块内文本**逐字搬移**（含块内自指词） | 零提示词正文改动（内容依据 = 机制文档，落笔 = eng-coder） |
| D23-5 | 审计子代理不补批次档路径行 | 审计范围纪律 + schema 面已删该参数 |
| D23-6 | `_engTaskInput` 语义 = **一行机械任务书行**（批档绝对路径 + §2 指向句；不含固块） | A2 摘要面随 `summarizeEngTaskBook` 删除（§6.22 KD-SC6）⇒ 该字段只剩「批档路径记账」一个面；固块不是「任务书的一部分」 |
| D23-7 | 任务书本体（批次档 §2 文本）**不**入 system | 范围 = 机制性指令；任务内容属会话内容，压缩摘要面已按「当前任务锚定」承接（SUMMARIZE_PROMPT 第 3–4 条）——边界如实登记 |
| D23-8 | 写域行不分角色（`explore` / `plan` 同文） | 只读角色写权限已机械置 false（`thincoder-core/agent-tools/subagent-spawn.mjs:250-251`）；第二种文案无观察场景 ⇒ 不建分支 |
| D23-9 | 文本由本档局部纯函数 `filesBlockOf(files)` 组合，不外提模块；清单不截断 | 组合 = 表头 + 逐条 + 两句；可测性由真 `buildSpawnChild` 端到端用例取得（U8）；截断会把已声明档藏起来，正是本块要消除的病 |

**用例表（正常 / 边界 / 错误——含先红证据）**：

| # | 类型 | 输入 | 期望输出 | 先红 |
|---|---|---|---|---|
| U1 | 正常 | eng-coder spawn（真 `buildSpawnChild` + 真 `prepareRun`，depth 1） | `systemPrompt` 含 `Batch record (batchDoc): <abs>` ∧ `input` 不含 | **红**：system 无该行（只在 `input`） |
| U2 | 正常 | 审计 spawn（eng-coder 父 + role `explore` + attempt 非 null） | `systemPrompt` 含五锚：`[Audit instructions — mechanical template` · A2 块头 · `Zero-git scope authority` · `[Audit budget — mechanical]` · `[Audit report format — mechanical template` | **红**：五锚只在 `input` |
| U3 | 边界 | 长史（> 切割面）→ 压缩（`compressFallback` 零网络；另跑 `compressIfNeeded` + stub provider 一条） | system 五锚仍在 ∧ `agent.history` 无五锚 | **红**：两处皆无（压缩吞首条 = 病根复现） |
| U4 | 边界 | 同一 child 连跑两次 `prepareRun` | 两次 `systemPrompt` 逐字节相等（缓存契约） | 现态绿（基线——改后须保持绿） |
| U5 | 边界 | `_spawnSystemBlock` 为 null（depth-0 / explore / plan / consult） | `systemPrompt` 与改前逐字节相同（零回归） | 现态绿（基线） |
| U6 | 边界 | designer 勘察 spawn（attempt = null） | system 不含审计五锚 ∧ 不含批次档行 | 现态绿（基线；改后须保持） |
| U7 | 边界 | 整请求体（system + history）文本计数 | 固块文本恰出现 **1** 次（独占性） | **红**：现态在 history 中出现（而压缩后为 0） |
| U8 | 正常 | eng-coder spawn，`files` = 两条真路径（真 `buildSpawnChild` + 真 `prepareRun`） | `systemPrompt` 含两条绝对路径（逐条一行）∧ 含两句语义逐字 ∧ `input`（`_engTaskInput`）不含所声明的写域路径 | **红**：现态 system 零路径——写域只有调度器知道 |
| U9 | 边界 | 同一 spawn 去掉 `files`（`batchDoc` 仍在） | `_spawnSystemBlock` 逐字节 = `Batch record (batchDoc): <abs>`（S4 未推块） | 现态绿（基线——改后须保持） |
| U10 | 边界 | explore spawn 带 `files`（无 `batchDoc`、无审计）；同 child 连跑两次 `prepareRun` | system 含写域行 ∧ 不含批次档行 ∧ 两次 `systemPrompt` 逐字节相等 | **红**：现态零路径 |

**验收标准（逐条可机判）**：

| # | 判据（可机判） |
|---|---|
| A23-1 | `prepareRun(engChild).systemPrompt` 含批次档行 ∧ `input` 不含（U1） |
| A23-2 | 审计 spawn 的 system 含五锚 ∧ `input` 不含（U2） |
| A23-3 | 压缩后五锚仍在 system ∧ 不在 history（U3）——**先红**：现态两处皆无 |
| A23-4 | 同 child 两次装配 system 逐字节相等（U4）；null 固块路径逐字节同改前（U5 / U6） |
| A23-5 | 分类裁定表 15 行逐处有裁定（本档表——含「同类已解」第 11 行） |
| A23-6 | `doc_check(mode:"gate")` 对触碰档 PASS（判据为绝对量：零悬空锚 / 零超长段——机检无 delta 语义） |
| A23-7 | `files` 非空 ⇒ `prepareRun(child).systemPrompt` 含每条声明路径（逐条一行）∧ `_engTaskInput` 不含所声明的写域路径（U8） |
| A23-8 | `files` 空 / 未传 ⇒ `_spawnSystemBlock` 逐字节同改前（U9——零回归） |
| A23-9 | 块内含两句语义逐字（`not an authorization boundary` ∧ `your share only`）（U8 / U10） |
| A23-10 | 同一 child 两次装配 system 逐字节相等（`files` 属 spawn 参数，run 内恒定——U10 后半） |

**边界（不做）**：

1. 不动压缩本体（`thincoder-core/context.mjs` 零改动）——只改注入位置。
2. 不动任务书本体（批次档 §2 文本仍走 user 首条、仍可被摘要；见 D23-7）。
3. 不动 advisor 评审简报（同类已由 F13 pinned 重挂覆盖——分类表第 11 行）。
4. 不动 VSC 镜像装配面（`thincoder-vscode/src/agent/setup.mjs`）：VSC 子代理恒经核 `runChildPipeline` → 核 `runAgent`
   （`thincoder-core/agent-tools/subagent-async.mjs:305-308`）⇒ 单点即可；该端 depth>0 直连面仅 `thincoder-vscode/src/extension/image-handler.mjs:84`（无固块字段）。
   **实施轮复核项**：若发现端侧另有子代理装配路径携带该字段，同式补一行。
5. 不改 `batch_segment` 工具描述与提示词正文（零正文改动 ⇒ 落笔面零依赖——内容依据 = 机制文档，落笔 = eng-coder）。
6. 不动 `thincoder-core/agent/family-tools.mjs` 的 schema 删除面（审计子代理仍无 batchDoc 参数）。
7. 无 UI / 交互决策（system 面对 UI 不可见；TUI / webview 零改）——**无 open 项**。
8. **不做同批他人写域注入**（要批次视图——调度器有表未外放）；**不做分组归属**（纪律面：父侧在任务书里点名）；**不做越界检测**（只让它看得见，不拦它）。
9. 不动调度器（`thincoder-core/agent-tools/subagent-scheduler.mjs` 零改动）——`files` 的冲突判定 / 队列语义零变。
10. 不动 `subagent` 工具描述与提示词正文（`thincoder-core/tool-docs/subagent.md` 零改动；写域行文本是运行期派生块，落点在代码）。
11. **集成用例面 delta = 破坏 0 / 冗余 0 / 缺失 0**：`test/RTM.md` 无一行断言子代理 system 固块内容（回指组 7-x / 10-x / 11-x / 17-x 逐组读过）；本改动不改任一既有行断言的业务可观测结果，且跨组件而起于无用户可见入口（system 面对用户不可见）⇒ 两条触发均不成立，不新增用例。

## 6.28 VSC 端 batch 改名镜面修复

**保缝面（三处——非改名面，禁触）**：① `configureBatchSegment`（#84 记账缝契约名——`setup-tooltable.mjs:19/:29`
消费）；② shim 直调用例（别名等价载体，等价性由核撤除判据守护）；③ 核错误串前缀断言
对子代理身份的错误串**逐字保持** `batch_segment:` 前缀 = 核锚；该断言锁核契约，非残留）。

**关键决策**：

- **D-1** 登记册**换名不加名**（仍 15 名——`thincoder-core/agent-tools.mjs:24`：过渡别名不入登记册，仅 shim 导出面）。
- **D-2** T60 **四处全改**——`:183/:188` 在旧名下恒真（主名世界里代码评审既不含旧名也不含新名），
  断言力已失；随主名改后 `!has("batch")` 恢复强断言。
- **D-3** `:109` 改走主名 execute 形——`required:["action"]`（`batch.mjs:321`）+ action 分发（`:342`）：
  缺 action = unknown action throw；shim 形 `{segment,text}` 对主名不可达。
- **D-4** 注释面 = **4 处**（`setup-tooltable.mjs:4/:22` · `thincoder-vscode/src/agent/setup.mjs:5/:325`）。
- **D-5** 落点 = 本档 §6.28（VSC 装配镜像面 owner 档——§6.24 先例）；不另建独立档
  （另建即单一权威源破面）。

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
| A-1 | `npm test` = **876/876 零红** | 全体 |
| A-2 | `node --test test/agent-tools-registry.test.mjs test/eng-designer-role.test.mjs test/batch-segment.test.mjs test/integration/host-shape-spawn.test.mjs` 全绿 | 红 1–5 |
| A-3 | 残留清零：VSC `src` + `test` + `webview` 域 snake_case `batch_segment` 字面命中 = **0**；豁免集见下 | 注释面 6 处 + 红 2/3/5b |

A-3 豁免集（不计入命中面）：① `configureBatchSegment` / `batchSegmentTool` camelCase 缝名与 shim 导出面；
② `batch-segment.mjs` 连字符路径。

A-3 机检（单行 · cmd.exe · cwd = `thincoder-vscode/`）：
`node -e "const fs=require('fs'),path=require('path');let n=0;const w=d=>{for(const x of fs.readdirSync(d)){const q=path.join(d,x);if(fs.statSync(q).isDirectory())w(q);else

 if(/\\.(mjs|js)$/.test(x))fs.readFileSync(q,'utf8').split(/\\r?\\n/).forEach(l=>{if(l.includes('batch_segment'))n++})}};['src','test','webview'].forEach(w);console.log(n)"`

**边界（不做）**：不改核侧（`0b45957c` 已收口）；不动 #84 缝契约名；不删 shim 档与别名（核撤除判据
归核批）；错误串 `batch_segment:` 前缀零改（核 §4.1 锚）；T5 已定性机械面（fixture 钉改前形状），零行为裁决；
`thincoder-vscode/src/agent/setup.mjs` 现量 **421**——该档后续净增的拆分归父侧派单登记。

## 6.29 队列条目自携任务书 + 批次档写门

### 6.29.1 形一 · 批次档写门（containment）

**判据（逐字）**：**携绑定的子代理**（`depth > 0` ∧ `agent._batchDoc` 在场——工程角色 ∥ 普通面 coder，`BATCH-RECORD.md` §4.16）对**批次档文件**（目标路径落 `batchDocBases(cwd)` 任一基底内——声明面单源 `thincoder-core/agent-tools/batch-paths.mjs`）的写（`FILE_MUTATORS`）

⇒ 目标 ≠ 绑定 `_batchDoc` **且非绑定批次的伴随件** ⇒ **拒绝**（fail-closed）；写自己绑定的档 ∥ **自身批次伴随件** ⇒ 放行（正常面）。比较键 = 绝对路径 + win32 大小写归一。

**伴随件判据（三合取）**：① 目标**非 `.md`**（批次档本体永在门内——一切 `.md`、含近词干形如 `<词干>-v2.md`）；② 目标与绑定档**同目录**（按比较键归一）；③ 目标基名以 `<词干>+「.」或「-」`打头（词干 = 绑定档基名剥 `.md`）。三合取全中 ⇒ 不进本门；余者照拒（他批 `.md` ∕ 他批伴随件 ∕ 异目录伴随件均拒）。

**拒绝文案（实现单源）**：`write refused — cross-batch batch-record write: this child is bound to <A>; <B> belongs to a different batch.`

  `Write only your own bound record and its companion files (the batch tool targets your bound record); the parent agent handles other batch records.`（A / B = 基名；文案字面单源 = 实现档 `thincoder-core/agent/write-gate.mjs`）

**判据收窄理由**：批次本地单元测试档（`docs/batches/<批档词干>.test.mjs` 族）的合法作者 = **当批实施者（子代理）** ⇒ 本门保护对象 = **批次档本体**（跨批写他批 §2 = 损害通道）——非 `.md` 伴随件不构成该通道 ⇒ 放行（拒面不动：一切 `.md` 与当批外伴随件照拒）。
**已知边界（登记）**：词干前缀族共享豁免命名空间（绑定 `X` 者可写 `X-<后缀>.非md`——保护对象 = 档本体故可接受；现实撞面再收窄）。

**落点（两端对齐）**：核 `thincoder-core/agent/dispatch.mjs` Phase 1（与 D5 冻结窗同区——同为写前门 · 共用同一路径集）；
端已取核——核 `thincoder-core/agent/write-gate.mjs`（CLI parity 单点）。判据本体 = `thincoder-core/agent/write-gate.mjs` 新导出

`batchRecordWriteConflict(agent, depth, absPaths)`（与 `freezeWindowConflict` 同址——写前判据单源）；基底集按子代理 run 记忆化（每 run 一次 manifest 读）。

**接口契约（实现面）**（形照 `docs/core/design/TOOLS.md` §6.17「接口契约（实现面）」表）：

| 面 | 落点 | 形态 |
|---|---|---|
| 判据本体 | `thincoder-core/agent/write-gate.mjs` | `export function batchRecordWriteConflict(agent, depth, absPaths)` → 命中 = `{ bound, target, message }`（`bound` / `target` = 绝对路径；`message` = 逐字拒绝文案——A / B 基名已填）· 无冲突 / 不进本门 = `null` · **恒零抛**（形照 `freezeWindowConflict` 先例） |
| 拒绝文案单源 | `thincoder-core/agent/write-gate.mjs` | 文案字面**只出该档**（与判据同址——判据与文案同时锁死）；两端直取 `conflict.message`——**零字面副本** |
| 两端取用 | 核 `thincoder-core/agent/dispatch.mjs` Phase 1（单源——端已取核） | 各一次 import（`@thincoder/core/agent/write-gate.mjs`）+ 拒因分支；文案取上表单源（T12 的「文案含 A / B 基名」由此保证） |

**与 `batch` 工具的关系（分层，不重复）**：`batch` 工具的绑定面管**段维度**（身份 → 可写段白名单，`BATCH-RECORD.md` §4.1 / §4.2）；本门管**档维度**——绑定档**之外**的同族文件此前无门（`write` / `edit` 直写批档 = 绕过工具绑定的通道，正是本实例的损害通道）。

**豁免 / 边界**：depth 0（主 agent）不受门约束（跨档处置是父侧职责）；无 `_batchDoc` 的子代理不进本门（非工程绑定族——行为零变）；`file_ops` 不入门（门判据集 = `FILE_MUTATORS`，两端同集）；读类工具零影响；

  **非 `FILE_MUTATORS` 写通道（`bash` / `execute` 等）不在射程**——理由：判据 = 工具面 mutator 集（零文本拦截——`docs/core/design/TOOLS.md` §6.4），且事故真实通道未定
  ⇒ 本门只收工具面直写通道、不宣称全面封闭；**自身批次伴随件 = 放行面**（三合取——见上判据）。

### 6.29.2 形二 · 条目自携 + 双点留痕（可诊断性）

- **条目自携**：`executeAsyncSpawn` 在条目上记 `_batchDoc`（= `child._batchDoc ?? null`）与 `_taskSeal`（任务书文本摘要——12 hex；不留全文，NF-L3 同族）；`_files` / `_dependsOn` / `role` 既有。
- **双点留痕**：`child:spawn`（既有事件）与 `child:start`（新事件——条目实际启动点）键面同为 `{ role, id, batchDocBase, taskSeal }`（**基名 + 摘要，零内容**）——事后可对账「哪条任务书在哪个 id 下起跑」（本实例缺失的正是这条轨迹）。
- **不做的**：以条目记录**重建** payload——现启动路径已按条目闭包取值（等价于已重绑），重建 = 无收益的结构重写。

### 6.29.3 形三 · 跨批引用：规范禁止 + 检测面废止

**规范（用户 2026-10-24 22:55 裁定，逐字）**：「不允许跨批引用！所有的引用只能是对需求、设计之类的持久性约定的引用，批档不是持久稳定的，可能被归档清理，怎么能被引用呢！」
⇒ **任务书（批档 §2）禁止引用任何批档**（路径 / 批档节号 / 「参照上一批」「同 #NNNN」这类指向）；只许引需求档条目、设计档小节、代码坐标。同理，规范档（设计 / 需求）不得以批档为出处载体（`docs/core/design/DOC-DISCIPLINE.md` §4.5.1）。

**执行面（单源——§6.22 的 §2 引用面约束只指向本节）**：① §2 写作约束（§6.22）；② 设计评审退回项——评审通读 §2，批档坐标零容忍；③ 设计档自查——AC-SC-8 机检三式零命中（批档路径形 ∥ 发现表编号形 ∥ 批档 §2 条目号形）。**不新增运行时内容校验**：§2 是散文，正则抽 `.md` 会把需求 / 设计引用一并误判，真假绿都不可靠（KD-SC7 同判据）。

**原「task↔batchDoc 观测留痕」= 废止**（提取谓词 · `child:batchdoc-ref` 事件 · T15 断言三件套一并删）。理由：

1. **前提被推翻**——原判据自述「任务书合法引用他批档是常态（前情指针 / 证据引用）」，裁定后该前提不存在；一个「命中也不阻断」的面在新规范下是假兜底。
2. **扫描对象失效**——本批后工程角色 `input` = 一行机械文本（§6.22.2），唯一 `.md` 字面 = 绑定档自身 ⇒ 对最需要它的两个角色恒空。
3. **无场景分支不留**——保留它要为永不触发的路径维护提取谓词、事件键面与测试夹具，而三者都无法被真实场景验证。

**保留的相邻面**：§6.29.2 双点留痕（`_batchDoc` + `child:spawn` / `child:start`）不动——它管 payload 绑定与对账，不涉跨批引用。

### 6.29.4 串扰回归锁（可机检）

「每条目启动消费**自携** payload」以用例固定：同 `files` 域两个 async spawn（任务书文本各异、绑定档各异）⇒ 入队两条；启动序 = 先入者；断言逐条 `_batchDoc` / `_taskSeal` 与 spawn 入参一致、且两条目互不相等（零跨条目文本）。既有调度器用例（同域串行 / 依赖 / 终态守卫）零改。

## 6.30 工具面首用可发现性：spawn 任务书参数入描述面

**来源**：用户「几乎每次派单都会出现，感觉提示词面或者工具描述面存在缺口」；需求 = `docs/core/requirements/ENGINEERING-MODE-V2.md` §8.2「工具面自解释」①。

**改法（描述面载明）**：`thincoder-core/tool-docs/subagent.md` 角色列与 `Mode filtering:` 段之间（`- eng-designer …` 行后）载入 §6.22.8-A 那一段——**逐字正本住 §6.22.8-A，本节不复制**（D2：同一段两处逐字 = 改一处漏一处）。示例正本 = **参数骨架**（下表；`thincoder-core/tool-docs/subagent.md:26-27` 取块第 1 行 ∥ 第 3 行，第 2 行属 eng-designer 示例面）。§6.22.8 的 P2 按行引用本块。

```text
Pass one parameter per field — contents only (the runtime adds the labels):
subagent(role="eng-coder", round="initial", batchDoc="<batch record>", designToken="…", files=[…])
subagent(role="eng-designer", round="initial", batchDoc="<batch record>", files=[…])
subagent(role="explore", goal="…", knownFacts="…", scope="…", acceptance="…", reportFormat="…")
```

**决策**：
- **KD-TF1（描述句与门一致——KD-M5-7 同族）**：描述面载明「normal-mode 角色 = 五项参数；工程角色 = 零任务书文本参数（任务书 = §2）+ `round`」——描述随门走；门侧判据 = engineering 角色拒收面 + `taskBookParamsFor(role)`（非工程角色：存在 / string / `trim()` 非空）+ `ROUND_VALUES`。描述只作人类可读声明，不复写值集（D2 单源 = `spawn-gates.mjs`）。
- **KD-TF2（共享块）**：eng-coder / eng-designer 共享一段——两段重复 = 描述面双份字面（D2；改一处漏一处）。
- **KD-TF3（参数即骨架）**：文本骨架退役——「照抄标签写进任务文本」的形不再是门的形；骨架改为一次带参调用，文本面与门面同形（工程角色只带 `batchDoc` / `round` / `designToken` / `files`）。

**边界（本节不做）**：门的判据面归 §6.22.1 ∥ §6.22.4 · 提示词面（`thincoder-core/prompts/`）零触 · 其他工具描述零清扫 · 不新增工具。同族两件（batch 档头可填性 ∥ 死占位判据可辨性）= `TOOLS.md` §6.20。

## 6.58 批次档复用护栏：同一档的在飞 spawn 拒发

**来源**：2026-10-28 事故——两个 spawn 共用一本批档、文件域互不重叠，结果语法坏档 + 一席复原。提示词面当天已补（`thincoder-core/prompts/persona-engineering.md` §Implementation dispatch structure 的 `One batch record serves one spawn at a time`），机制面不拦：`batchDoc` 门只判「参数在 + 路径可读」，`thincoder-core/agent-tools/subagent.mjs:151` 的描述仍是单数措辞、无禁令。

本节的判据把提示词的软约束落成写不出来的硬拒。

**为什么拦（而非只靠提示词）**：提示词靠「派单的人读到并记住」，机制靠「写不出来」。本项目的同族先例已经存在——`files` 文件域并发冲突由调度器拦（§6.9 `describeBlockers`），而「一本批档两个写者」是同一类资源冲突，此前只是没把它当资源声明。一次发生的代价 = 坏档 + 一席重做；护栏的代价 = 一次池扫描 + 一行拒因。

**最贴近先例**：`existing: thincoder-core/agent-tools/subagent-scheduler.mjs` 的 `describeBlockers`（设计档 §6.9）——**对齐** = 同一冲突判定落点（池派生事实单源，判定在 `buildSpawnChild` 里求值）；**偏离** = 拒发不排队（KD-BG2：批档冲突排队只把第二个写者延后，病不消失）。

**勘察证据**：查过——

- 池与条目面：`thincoder-core/agent-tools/subagent-scheduler.mjs`（`depInfo` :115 · `fileKey` :70 · `effectiveFiles` :92 · `describeBlockers`）· `thincoder-core/agent-tools/subagent-run.mjs:92`（条目 `_batchDoc`）· `thincoder-core/agent-tools/async-settle.mjs`（`carrierField` :53-57 · 载体吸收 :120-125 · 留池 :231）。
- spawn 门面：`thincoder-core/agent-tools/subagent-spawn.mjs`（`buildSpawnChild` :187 · batchDoc 门 :204-220 · coder 面 :212-220 · 任务书门 :227）· `thincoder-core/agent-tools/subagent.mjs`（:151 描述 · :321-322 sync 不入池）· `thincoder-core/tool-docs/subagent.md`。
- 纪律与验收面：`thincoder-core/prompts/persona-engineering.md` §Implementation dispatch structure 的 `One batch record serves one spawn at a time` 条（含顺序交接边界与 `Why` 两行）· `test/RTM.md` · `docs/core/design/TOOLS.md` §6.4。

外部公开源档未查——本节判据全部取自本仓既有件（池访问器 · `fileKey` · 载体吸收），无外部同机制实现可引；同机制在本仓亦为首案。

### 6.58.1 判据

- **在飞**：`getAsyncPool(parent, "subagent")` 中 `status ∈ {running, queued}`、且 `done !== true`、且 `cancelled !== true` 的条目。
- **池必须经访问器读**：与 `depInfo`（`thincoder-core/agent-tools/subagent-scheduler.mjs:115`）同一读法。裸读 `parent._asyncSubagents`，在只携 `history` 的合成 parent（VSC 面）读到的是空池 ⇒ 护栏静默失效，无报错、无信号。
- **占用**：条目的 `_batchDoc`（`thincoder-core/agent-tools/subagent-run.mjs:92` 逐条目自携）与本次入参解析出的绝对路径按 `fileKey` 相等（win32 大小写不敏感，与 `subagent-scheduler.mjs:70` 同键）。
- **占用判据只认 `_batchDoc`，不分角色**：普通面 coder 携 `batchDoc` 时条目同样带 `_batchDoc`（`thincoder-core/agent-tools/subagent-spawn.mjs:212-220`）⇒ 它也是占用者，会拒掉后续工程派单；被检面只覆盖工程角色，coder 面靠两模式互斥不可达。
- **命中 ⇒ 拒**：`buildSpawnChild` 抛错，不许入池；拒因逐字模板 = §6.58.2。
- **不读 `round`**：判据面只判并发，不判轮次（理由见 §6.58.3）。

**为什么必须按 status 过滤**：正常 settle 的条目留在池里（`async-settle.mjs:295`「非挂起期 ⇒ 留池 done-in-pool」，`:231-232` 置 `done=true`/`status="done"`）。只看「池里有同档条目」会把单席顺序交接全部误拒。

### 6.58.2 接口契约

- **新导出** `batchDocInFlight(parent, batchDocAbs)` → `{ id, role, status } | null`，住 `thincoder-core/agent-tools/subagent-scheduler.mjs`——与 `depInfo` / `describeBlockers` 同族，池派生事实单源在此；池读法同 `depInfo`。
- **既有件三问**：`existing:` 条目字段 `_batchDoc`（`thincoder-core/agent-tools/subagent-run.mjs:92`）· 池访问器 `getAsyncPool` · 同族冲突判定 `describeBlockers`（`subagent-scheduler.mjs`，§6.9）。`none found:` 无「按档查占用者」的现成谓词——`depInfo` 只按 id 查、`describeBlockers` 只按文件域查。消费方 = `buildSpawnChild` 单点。
- **调用点**：`thincoder-core/agent-tools/subagent-spawn.mjs:211` 之后、任务书门（`:227`）之前——即归属于既有 `batchDoc` 门，不新开一门。
- **门的先后**：guard 在条目入池（`subagent-run.mjs:202`）之前求值 ⇒ 本次 spawn 不会命中自己。
- **被检面双路、占用面单路**：sync / async 共用 `buildSpawnChild`（`subagent-spawn.mjs:196-197` 注释所载）⇒ 一处校验双路生效；但**占用者只来自异步池**——sync spawn 不入池（`thincoder-core/agent-tools/subagent.mjs:321-322`）⇒ 两次 `async:false` 同档并行拦不住（§6.58.7 第 7 条）。

**拒因文案（逐字模板；实现单源 = `thincoder-core/agent-tools/subagent-spawn.mjs` 的 `buildSpawnChild`——下游断言照此逐字，`<…>` = 拼入值）**：

```text
batchDoc is already in flight — spawn refused. Batch record: <abs path>. Occupant: <role>#<id> (status: <running|queued>). One batch record serves one concurrent spawn: wait for <role>#<id> to settle, or cancel it, then spawn again.
```

门序（逐字替换 §6.22.1 末行）：角色 enum → `batchDoc` 门（缺参 ∥ 不可读 ∥ **同档在飞**）→ 任务书门 → `round` → token 门 → files 声明面。

### 6.58.3 关键决策记录

- **KD-BG1（判据 = 并发，不读 round）**：`round="fix"` 能放行，不是因为它被豁免，而是因为派修正轮的前提是父侧已拿到上一轮结果 ⇒ 上一轮已 settle ⇒ `done=true` ⇒ 不在在飞集。反过来，前一轮仍在飞就派修正轮 = 同一种两写者病，本条照样拒。「只在 initial 上拦」会漏掉这一形，且要给池条目新增 `_round` 字段（现条目字面量无此字段，`subagent-run.mjs:66-99`）——多一个字段换更弱的判据，不取。
- **KD-BG2（拒发，不排队）**：`files` 冲突可以排队（等域空出来重跑，结果不变）；批档冲突排队无效——第二个写者稍后启动仍然写同一本档，病没有消失，只是延后。「等前一轮 settle 再派」的判断属于派单侧，机制不替它排。
- **KD-BG3（读在飞表，不做文本匹配）**：`TOOLS.md` §6.4 已否决文本拦截式安全；本节只用结构性事实（池 + 路径相等），不猜意图。
- **KD-BG4（跨进程不设防）**：池是会话内存，另一个 ThinCoder 实例同仓同档不在本护栏内——与 `files` 冲突检测同一条界。设跨进程锁要新增共享状态（文件锁 / 探活），代价远大于它挡住的形；登记为已知界，不设防。

**两态的观察来源（如实登记）**：

- **`status="queued"` 计入在飞 = 推导项**（同一种两写者：启动序推迟不消病）——无观察场景，事故当场未留池读数。
- **前一轮在飞就派修正轮 ⇒ 拒 = 推导项**——无观察场景。有观察场景的两态只有主分支（2026-10-28 11:34：两席共用一本、文件域不重叠 ⇒ 语法坏档 + 一席复原）与放行分支（`thincoder-core/prompts/persona-engineering.md` §Implementation dispatch structure 的 `A sequential handoff … keeps the same record: it never overlaps, so nothing is shared.`的单席顺序交接）。

### 6.58.5 验收（回指 §2 条目；机检命令逐条）

| # | 判据 | 机检命令 ⇒ 期望 |
|---|---|---|
| AC-BG-1 | 病态被拒：同档 + 在飞 `running` ⇒ 抛错，文本**逐字等于** §6.58.2 模板（拼入值 = 档绝对路径 · `role#id` · status） | `node --test <本批单测文件>` ⇒ 断言 rejection 且文本逐字相等 |
| AC-BG-2 | 顺序交接放行：前一条 `done` ⇒ 同档再派 `initial` 通过 | 同上 ⇒ 返回 child 装配产物，无 throw |
| AC-BG-3 | 修正轮放行：无在飞 + `round="fix"` ⇒ 通过 | 同上 |
| AC-BG-4 | 队列条目也算在飞：`status="queued"` ⇒ 拒 | 同上 |
| AC-BG-5 | 别的档不受影响：不同 `_batchDoc` 在飞 ⇒ 放行 | 同上 |
| AC-BG-6 | 路径归一：同一档的相对写法 / 反斜杠 / win32 大小写差异 ⇒ 命中（大小写变体仅 `process.platform === "win32"` 断言——非 win32 宿主无判别力；相对 / 反斜杠变体各平台恒断） | 同上 |
| AC-BG-7 | 非工程角色零影响：`_batchDoc = null` 的 explore 在飞 ⇒ 任何 spawn 不阻 | 同上 |
| AC-BG-8 | 文档门：本次写入的档 `doc_check` gate PASS | `doc_check(mode:"gate")` ⇒ 首行 `DOC-CHECK GATE: PASS` |

### 6.58.6 用例表

| # | 类 | 输入 | 期望 |
|---|---|---|---|
| 1 | 错误 | 池内 `<role>#7` running、`_batchDoc=<A>`；派 `initial`，`batchDoc=<A>` | 拒；文本逐字等于 §6.58.2 模板（`<A>` / `<role>#7` / `running`）（AC-BG-1） |
| 2 | 正常 | 池内 `<role>#7` done、`_batchDoc=<A>`；同上入参 | 放行（AC-BG-2） |
| 3 | 正常 | 池内无同档条目；入参 `round="fix"`、`batchDoc=<A>` | 放行（AC-BG-3） |
| 4 | 边界 | 池内条目 `status="queued"`、`_batchDoc=<A>` | 拒（AC-BG-4） |
| 5 | 边界 | 池内 `<role>#8` running、`_batchDoc=<B>` | 放行（AC-BG-5） |
| 6 | 边界 | 同一档分别以绝对路径 / 反斜杠写法 / 大小写差异给出 | 判为同一档（AC-BG-6）；大小写变体行按平台条件化 |
| 7 | 边界 | 池内 `explore#3` running、`_batchDoc=null`；派任意工程角色 | 不阻（AC-BG-7） |
| 8 | 错误 | 池内同档 running，入参 `round="fix"` | 拒（KD-BG1 的反向形——前一轮未完就派修一轮） |

### 6.58.7 边界（本节不做）

1. 不改提示词——`thincoder-core/prompts/persona-engineering.md` §Implementation dispatch structure 的 `One batch record serves one spawn at a time` 零改。
2. 不做文本匹配式拦截（`TOOLS.md` §6.4）。
3. 不校验档**内容**（判据仍只看路径与池状态）。
4. 不覆盖跨进程（KD-BG4）。
5. 不含 advisor 评审池（`_asyncAdvisors`）：评审写 §3、与实施席的 §5 段不相交，「同档并行评审 + 实施」属正常流程。
6. 不改批档写门（§6.29.1）与 token 机制。
7. sync spawn 不入池、不是占用者——两次 `async:false` 同档并行不拦（`thincoder-core/agent-tools/subagent.mjs:321-322`；提示词 `:335` 已禁 depth-0 `async:false`，机制面不重复设防）。

### 6.58.8 集成测试设计（RTM 行 20-1）

**故事**：`test/RTM.md` CLI 端故事 20「一本批档只服务一个并发 spawn」。与故事 12（无活批档不许改产品代码）不是同一业务故事——12 断的是「写产品码被拒」，本节断的是「同档第二席被拒」，业务结果不同，故另立故事节而不是挂进 12。

| 行 | 交互组件 | 业务可观察结果 | 进入口 | 回指 |
|---|---|---|---|---|
| 20-1 | spawn 门（`buildSpawnChild`）⟷ 异步池在飞表（`getAsyncPool`）⟷ 第二席的返回 | 第二席被拒，返回文本点名本批档路径、占用者 `role#id` 与其 status，并给可执行下一步（等其 settle ∥ cancel 它）；第一席照常交付，档上只有一套写者 | 工程模式父侧并发派两席共一本批档 | 设计 §6.58.1–§6.58.2 · AC-BG-1 |

**进入口来源**：生产真实发生（2026-10-28 11:34 两份并发 spawn 共用一本批档 ⇒ 语法坏档 + 一席复原）——不是推演场景。

**UI / 交互决策**：无 UI 面；工具描述面（`thincoder-core/tool-docs/subagent.md`）与参数描述面（`thincoder-core/agent-tools/subagent.mjs:151`）载明一本一批档，`open` 项为零。


## 6.59 `tester` 子代理（读数来源 · 角色面）

**需求** = `docs/core/requirements/AGENT-LOOP.md` §4.20（F-TT1–F-TT5 + `F-TT4-补`；F-TT1–F-TT5 = 2026-11-02 用户裁定，`F-TT4-补` = 父侧落笔）。本节只写机制：一个**跑验证、交读数、不改不写**的子代理角色如何装配进来。

### 6.59.1 做法与理由

**做法**：新增第 6 个子代理角色 `tester`。它是**第 3 种工具面**——不是 explore/plan 那种纯只读面（读不到执行），也不是 coder 那种全量面（带着写）。`tester` 的工具面 = **只读面 ∪ `{execute, bash}` 再减 `{verify, advisor}`**。

**为什么是第三种面而不是「coder 减去写工具」**：coder 面 = `parent.tools` 全集，减出来的面随父侧工具表漂——父侧明天多一把写工具，tester 明天就多一把。允许清单式则相反：**写入面 fail-closed**——非只读新工具默认**进不来**，要进得显式加名；只读新工具按同一公式自动进（§6.59.2 ④ 的 `readonlyToolNames` 那一项就是它）。用户裁定「控制不住再收紧」说的是**执行面先宽**，不是**写面先宽**。

**为什么执行面给全**（F-TT2）：装依赖 ∥ 编译 ∥ 建夹具都在「跑测试之前必须发生」这一类里；砍掉它们的结果不是更安全，是 tester 交不出读数。`execute` 的 `async` 后台形也**不新增裁**——全量套件常越过同步超时，砍掉后台形等于逼它前台跑死在超时上，产出的是一份**假红**。（`bash` 的 `async` 参在 depth>0 被既有排除面删掉，见 §6.59.2 ④——那是继承来的面，不是本设计新收的。）

**最近先例行**：`explore` / `plan` 的角色过滤（`thincoder-core/agent-tools/subagent-spawn.mjs:273-283`：`role === "explore" || role === "plan"` ⇒ `readonlyToolNames(parent.tools)` 过滤）。

- **对齐**：同一处过滤点、同一份 `readonlyToolNames` 单源。
- **偏离**：`tester` 在该行**不是**纯只读，故改为「只读集 ∪ 两个执行工具名 − `{verify, advisor}`」。
- **偏离理由**（须是能力面 ∥ 契约面的失败，不是口味）：`readonlyToolNames` 里没有执行工具（纯只读面读不到执行），而 F-TT2 要求执行面在场。照抄那一行会直接违约。

**三问式查据（新名字 `tester`）**：

- `existing but unusable: thincoder-core/agent-tools/subagent-spawn.mjs:273-283 · name: "explore" / "plan"（只读面分支）· failed on: 能力面——`readonlyToolNames` 只收 `readonly` 旗标为真的工具（`helpers.mjs:283-284`），而执行面的 `readonly` 均为 false（`tools/execute.mjs:203` ∥ `tools/bash.mjs:253`）⇒ 该集里没有执行面，照抄即违 F-TT2。`
- `existing but unusable: 同一处 · name: "coder"（全量面分支）· failed on: 契约面——`parent.tools` 全集含 `write` / `edit` / `apply_patch` 等写面，与 F-TT3「不写任何档」相抵；且减出来的面随父侧工具表漂（D-TT1）。`
- `none found: 既有五个 spawn 角色（explore / plan / coder / eng-coder / eng-designer）无一承担「跑验证、交读数、不改不写」这一职责——`thincoder-core/prompts/` 与 `docs/core/design/TESTING.md`（1349 行）内零命中（见下方勘察证据行）。`

**勘察证据行**：

- `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.7 ∥ §6.22 ∥ §6.58（子代理角色、spawn 门、批档复用护栏）。
- `docs/core/design/TOOLS.md` §6.2 ∥ §6.25（注册与 schema、令牌门）。
- `docs/core/design/TESTING.md` §4 ∥ §11 ∥ §13（集成集承载与执行、RTM、测试纪律两层 why）——该档 1349 行内零「tester」，无现成角色面可对齐。
- `docs/core/requirements/AGENT-LOOP.md` §4.20。
- `index.publicRepos` = 空 ⇒ 无外仓可查（已查，无）。

**数据事实面**：本节不含需要读数据才能定的断言（「有多少档会因此变」类）——需要实读的都已在下方逐处标了文件与逐字；无需查库，故「无需读数据」。

### 6.59.2 接口契约（六处角色面 + 任务书面 ∥ 池位 ∥ 报告形态）

**① 角色白名单**——`thincoder-core/agent-tools/subagent.mjs`：
- `:144` schema `role.enum` 从 `["explore", "plan", "coder", "eng-coder", "eng-designer"]` 增 `"tester"`。
- `:241` `const ROLES = new Set(["explore", "plan", "coder", "eng-coder", "eng-designer"])` 增 `"tester"`；`:243` 拒文的角色枚举同增（不改则报错信息说谎：合法角色被报成非法）。
- 模式门 `:253-269` **不加新门**（F-TT1 两模式都可派）。四条模式拒文里**只有一句枚举了模式内角色集**：`:259`「the engineering-mode enum is explore / eng-designer / eng-coder / tester」——已把 `tester` 写进去（本轮已落）。另三句各点名一个具体替代角色、没有角色集可增：`:256`（工程模式禁 `coder` ⇒ 指向 `eng-coder`）、`:262`（普通模式禁 `eng-coder` ⇒ 指向 `coder`）、`:268`（普通模式禁 `eng-designer` ⇒ 指向 `explore` / `plan`）——往这三句塞 `tester` 会把它写成「可替代角色」，语义反而错，故不改。

**② depth-0 角色 enum（按模式）**——`thincoder-core/agent/family-tools.mjs`：
- `:49-57` 两个模式各一份 `enum`：工程面 `["explore", "eng-designer", "eng-coder"]` 与普通面 `["explore", "plan", "coder"]` **都增** `"tester"`。
- `:63-68` 的 `suffix`（描述面补充句）补一句：tester = 只跑不改的读数角色。

**③ 提示词装配**——`thincoder-core/prompt-overlays.mjs`：
两处都增（逐字）：

```js
// SLOT_CONTENTS
"persona-tester.md": loadSlot("persona-tester.md"),
// SCENARIO_SLOT_FILES
"tester": ["persona-tester.md", "common.md", "discipline-normal.md", "subagent-base.md"],
```
- **不登记会怎样**（实读 `assemblePrompt`）：「`const files = SCENARIO_SLOT_FILES[scenario]` / `if (!files) return { prompt: applyPromptInjections(CONSULT_BASE), warnings: [] }`」——未登记的场景**静默**装配成 consult 基底、零警告。`tester` 的 scenario 名由 `thincoder-core/agent/setup.mjs:241-247` 取 `agent._role ?? "normal"` 得到，故漏登记 = 它带着会诊人格去跑测试。
- 纪律槽取 `thincoder-core/prompts/discipline-normal.md`（与 explore/coder/plan 同）：`thincoder-core/prompts/discipline-engineering.md` 装的是四步流程与 §2 任务书，而 tester 不写账、不推进工程流程。

**④ 工具面过滤**——`thincoder-core/agent-tools/subagent-spawn.mjs:273-283`：
- 现文两分支：explore/plan ⇒ 只读集；其余（含 coder）⇒ `parent.tools` 全集。**tester 落在第二分支就会拿到 `write` / `edit` / `apply_patch`**，与 F-TT3 直接相抵。
- 新分支：`role === "tester"` ⇒ `parent.tools.filter((t) => (allowed.has(t.name) && !TRIMMED.has(t.name)) || t.name === "execute" || t.name === "bash")`，其中 `allowed = readonlyToolNames(parent.tools)`（单源 `thincoder-core/agent/helpers.mjs:283-284`）、`TRIMMED = new Set(["verify", "advisor"])`。等价公式：**只读集 ∪ `{execute, bash}` − `{verify, advisor}`**。
- 减 `verify`：它的语义是「我宣布这次交付达标了」——那是结论；`tester` 的产物是读数（F-TT3「不代父侧下结论」）。
- 减 `advisor`：它的语义是「开一次评审、产出一个判断」——同样是结论；且它 `readonly: true`（`thincoder-core/agent-tools/advisor.mjs:146`）⇒ 不减就自动落进只读集，边界「不做评审」变成一句没人执行的话。父侧 2026-11-02 裁：**减掉工具，不是改写边界句**。
- 两枚减法都按名显式做，不看 `readonly` 旗标分流：旗标说的是「不写盘」，不是「不产出结论」。
- `:283` 之后的 `excludeSubagentTools(tools)`（`helpers.mjs:299`）照旧生效、顺序不变。它做两件事，tester 全继承：① 排 `question` / `ssh`（`SUBAGENT_TOOL_EXCLUSIONS`，`helpers.mjs:292`）；② 对 `bash` / `browser` **删掉 `async` 参**（`helpers.mjs:303-305`）⇒ **`bash` 的后台形在 depth>0 本来就不存在**，`execute` 不在该表内、其 `async` 保留。因此 F-TT2 的「`async` 不裁」= 本设计不新增收窄，不等于 bash 有后台形。

**⑤ 段级工具段**——`family-tools.mjs:187-193` 的 depth>0 角色段**不加新分支**，tester 走 `:193` 的兜底段 `[parentChannelTool, ledgerReadTool, teamLedgerReadTool, manifestReadTool]`。

- 该段给它的正是要的面：`notify_parent`、台账只读、manifest 只读——能上抛、不能写账。
- `batch` / `doc_check` 不在该段 ⇒ 语法面不可达。
- `advisor` 也不在该段，但它是只读工具、会从基础集进来：挡住它的是 ④ 的显式减法，不是这一段。

**⑥ 端侧角色面**——`thincoder-vscode/src/agent/tool-table.mjs`（同一角色集在 VS Code 端的活体描述，与核那五处并列）：

- **谁替换谁**：`:40` 的 `vscSubagentFace` 经 `opts.toolDecorate` 供核 `assembleFamilyTools({ decorate })`，**替换核 `filteredSubagent`**（档头自述「端侧自带 role 面」，`:4-6`）⇒ 该端模型看到的 `role.enum` 与 suffix 由这一档给，核那份在该端不生效。漏这一处 = 该端 enum 里没有 `tester`，父侧派不出去、模型也看不见，用户可见的端差即缺陷。
- **角色面**：`:45-56` 的 `testerSuffix` 与两模式 enum 各增 `"tester"`，逐字对核 `family-tools.mjs` 的 `subagentRoles`（实施轮已落）。
- **端侧第二处工具面过滤（防御面）**：`buildToolTable` 的 `:176` `const isReadOnlyRole = depth > 0 && (role === "explore" || role === "plan" || role === "consult")`、`:177` `const isTesterRole = depth > 0 && role === "tester"`；tester 分支为 `:183-185` 的 `builtinTools.filter((t) => t.readonly || t.name === "execute" || t.name === "bash").filter((t) => !TESTER_TRIMMED.has(t.name))`（`TESTER_TRIMMED` = 端侧自持字面量 `{verify, advisor}`，`:178`）。
- **可达性实读（决定这一处的性质）**：`buildToolTable` 的运行期唯一调用点是 `thincoder-vscode/src/agent/setup.mjs:215`（`hydrateRun` 内），而 `hydrateRun` 在本端唯一的装配调用点传的是 `depth: 0, role: null`（`thincoder-vscode/src/extension/panel-turn-loop.mjs:198` `const hydrateCtx = { provider: p, cwd, input: text, opts: ro, depth: 0, role: null, getAuto: () => panel._autoApprove }`）⇒ 端侧 `depth > 0` 整段（连同既有的 explore / plan / consult 只读分支）运行期走不到。故这一处按**防御面**记账：端侧将来启用 depth>0 时，该分支按 ④ 的同一公式即生效；当前不可达，它不是「已修的缺陷」，也不构成「用户可见端差已消除」的证据。
- **端侧只读集怎么取（写死，勿自择）**：`allowed = builtinTools.filter((t) => t.readonly)`——就是 `:181` 现成的那个形，端侧不调核 `readonlyToolNames`；`TRIMMED` 两端**各自字面量**（核 = `subagent-spawn.mjs` 的 `new Set(["verify", "advisor"])`，端 = 该档内自持同形字面量）。理由：§6.24 已立端侧规范「不 import 核常量——端镜像面按既有形态自持字面量，同集由判据锁死」；端侧引核 helper 与该规范相左。
- **AC-TT2 的「两端名集相等」怎么算**：两侧各按自己那条成文规则算**基础集**再逐名比。核 = `readonlyToolNames(parent.tools) ∪ {execute, bash} − {verify, advisor}`；端 = `builtinTools.filter((t) => t.readonly) ∪ {execute, bash} − {verify, advisor}`；两侧各自再经 `SUBAGENT_TOOL_EXCLUSIONS`。家族段不进这条比较——两端都由核 `prepareRun` 在同一处追加。核侧算例取 `parent.tools = [...builtinTools, verifyTool]`（父面 = 基础集 + `verify`）⇒ 两侧名集应逐名相等。

**任务书面**：`thincoder-core/agent-tools/spawn-gates.mjs:54` 的 `ENGINEERING_ROLES` 只含 `eng-coder` / `eng-designer`，tester **不进**该集 ⇒ `taskBookParamsFor`（`:107-108`）自动给它五项任务书（`goal` ∥ `knownFacts` ∥ `scope` ∥ `acceptance` ∥ `reportFormat`），正好是 F-TT5 的形。无新参数、无新门。

**池位**：`thincoder-core/agent-tools/subagent-async.mjs:71-73` 的 `poolDomainOf` 现文「`role === "eng-coder" ? "engCoder" : "other"`」⇒ `tester` 落 **`other` 域**（`ASYNC_POOL_LIMITS` `:62` = `{ engCoder: 4, other: 4 }`）。

**不新增池键**：一个跑全量套件的 tester 与 explore/plan/coder 共用 4 席，但**挤不掉实施席**（`eng-coder` 独占另 4 席）。新增第三键要动 `config.mjs` 默认值 + 校验 + 两端配置面，为一个尚未出现的拥塞先建一层；读数出现真实拥塞再议。

**报告形态（F-TT3 的可判形）**：四块固定，写进人格层正文（中文权威 = §6.59.10 的「报告形态」一节）——块 1 命令原文 + `exit code`（**兼载写盘落点**：凡写盘的命令逐条标出落点路径，不另立第五块）· 块 2 跑者汇总行逐字引用 · 块 3 失败用例名逐行（上限 20，超出写余数）· 块 4 摘要 = **末 40 行** + 首个错误栈段（连续缩进行，上限 20 行）。

**超长输出落到哪**：落点是**报告产物文件**，不是「档」——跑命令时即 `tee` 到 `<系统临时目录>/thincoder-tester-<role#id>-<时间戳>.log`（`bash` 的重定向 / `tee` 完成；tester 无 `write` 工具，**事后补写这条路不存在**），报告给该路径并注明「摘要 = 末 40 行」。F-TT3 的「不写任何档」指不写仓库内的需求 / 设计 / 批次 / 台账档；报告产物文件在仓库外、只服务本次报告，不进入任何账。机制面只约束**形态可判**，不约束措辞。

### 6.59.3 受影响文件与层级结论

| 文件（节 ∥ 落点） | 层级 | 本轮 |
|---|---|---|
| `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.59 | 设计档 | 写（机制全貌，本轮已落） |
| 同档 §6.7.1 角色表 + 「模式过滤」句 | 设计档 | 加 `tester` 行；模式过滤改写为六角色事实形（普通 explore / plan / coder / tester · 工程 explore / eng-designer / eng-coder / tester）（本轮已落） |
| 同档 §6.22 非工程角色句 + §6.22.1 必填集合表 | 设计档 | 角色集增 `tester`、必填表加 `tester` 行（同 explore 五项）（本轮已落） |
| 同档 §6.22.8-A 逐字块 | 设计档 | 首句角色集改 `non-engineering roles: explore / plan / coder / tester`；实施轮 `thincoder-core/tool-docs/subagent.md:23` 按该块整段替换（AC-SC-5 的逐字对比目标 = 改后的块）（本轮已落） |
| 同档 §6.22.8 P3 ∥ P4 ∥ P5 ∥ P10 | 设计档 | 角色枚举增 `tester`、`normal-mode` → `non-engineering`（判据 = 描述与门同源：`taskBookParamsFor` 只看 `isEngineeringRole`，tester 取五项；P4 的 `context` 已实读为 tester 可用）（本轮已落） |
| 同档 §6.22.8 P14 | — | **不改**：该行删的是 normal-mode 清单里的 `round` 行，行内只枚举工程角色，无「非工程角色集」可增；它所在的清单头 = P10，已在 P10 改（本轮核定） |
| 同档 §6.22.8 P16 ∥ P17（P16 / P17 为一对新增行） | 设计档 | 两处代码文案的角色集订正（`subagent.mjs` 的任务书错误文案 ∥ `spawn-gates.mjs` 的 designPoints 指路句）（本轮已落） |
| 同档 §6.23.3 的 `subagent.mjs:133` 模式过滤行 ∥ `family-tools.mjs` 工程 enum 行 | 设计档 | 两格「改后」文本再增 `tester`（逐字住 §6.23.3，本节不复制）（本轮已落） |
| `docs/core/design/TOOLS.md` §6.27 | 设计档 | 写（工具面一侧 + 回指 §6.59）（本轮已落） |
| `docs/core/requirements/AGENT-LOOP.md` §4.20 | 需求档 | 父侧落笔（`F-TT4-补` 行），设计席未改 |
| `thincoder-core/prompts/persona-engineering.md:476` 池位句 | 产品代码（提示词面） | 实施轮写：`other-role (explore / plan / coder) pool` → 增 `tester`（tester 落 `other` 池域，§6.59.2 池位） |
| 注释面四处（`spawn-gates.mjs:7` ∥ `:29` · `subagent-spawn.mjs:258` · `subagent-async.mjs:67`） | 产品代码（注释） | 实施轮写：注释里的三角色枚举补 `tester`，零行为变更 |
| 运行期英文 persona 档（`thincoder-core/prompts/` 下，以 `persona-` 开头、以角色名结尾那一档；文件名单源 = §6.59.2 ③ 代码块，实施轮新建） | 产品代码（英文落地面） | 实施轮新建 |
| `thincoder-core/agent-tools/subagent.mjs` | 产品代码 | 实施轮写 |
| `thincoder-core/agent/family-tools.mjs` | 产品代码 | 实施轮写 |
| `thincoder-core/agent-tools/subagent-spawn.mjs` | 产品代码 | 写（`role === "tester"` 分支，`:278-290`）：`TRIMMED = new Set(["verify", "advisor"])` 两枚减法均已落盘 ⇒ AC-TT2 的核侧期望集现已在盘上成立 |
| `thincoder-core/prompt-overlays.mjs` | 产品代码 | 实施轮写 |
| `thincoder-core/tool-docs/subagent.md` | 产品文本面 | 实施轮写（角色矩阵） |
| `thincoder-vscode/src/agent/tool-table.mjs` | 产品代码（端侧装饰面 ∥ 端侧过滤面） | 角色 enum + `testerSuffix` 增 `tester`；`:177` 的 `isTesterRole` 分支已落（性质 = 防御面，运行期不可达，见 §6.59.2 ⑥） |
| `test/RTM.md` + `test/integration/*.test.mjs` | 产品面 | 实施轮写（集成行） |

**层级结论**：

- 本轮零跨层——只写设计面二档（`AGENT-LOOP-SUBAGENT.md` ∥ `TOOLS.md`）。
- 实施轮跨入产品代码面（走实施席 + 设计令牌）；`test/RTM.md` 与 `test/integration/` 属产品面（走全链）。
- **无拆分计划**：实施轮五个代码档（`subagent.mjs` ∥ `family-tools.mjs` ∥ `subagent-spawn.mjs` ∥ `prompt-overlays.mjs` ∥ 端侧 `tool-table.mjs`），连同表内两处注释面档（`spawn-gates.mjs` ∥ `subagent-async.mjs`），无档越 500 行软线。

### 6.59.4 关键决策记录

| # | 决策 | 否决的替代 | 理由 |
|---|---|---|---|
| D-TT1 | 工具面 = 允许清单（只读集 ∪ execute/bash − {verify, advisor}） | ① coder 全量面减写工具（拒绝清单）；② 纯只读面 + 只给 `bash` | ① 随父侧工具表漂，新写工具默认进得来（fail-open）；② `readonlyToolNames` 里没有执行工具，且 `execute` 与 `bash` 是两种不同执行形态（内联 JS ∥ 子进程 CLI），只给一种会让一半测试跑不了 |
| D-TT2 | 池位落 `other`，不新增键 | 新增 `tester` 池域 | 新增键 = 动 `config.mjs` 默认值 + `resolvePoolLimits` 校验 + 两端配置面，换来的只是「不被 explore 挤」；而实施席已独占 `engCoder` 域，拥塞风险不在关键路径上。无现场读数支持 |
| D-TT3 | `async` 不新增裁 | 本设计主动收窄后台形，只留同步 | 全量套件越同步超时 ⇒ 前台跑死 = 假红。假红读数比没有读数更坏（父侧会据它重新派单）。注：`bash` 的 `async` 在 depth>0 已被既有 `excludeSubagentTools` 删参（§6.59.2 ④）——那是继承面，不是本决策的产物；`execute` 的 `async` 保留 |
| D-TT4 | 不加 depth>0 段级分支，走兜底段 | 与 eng-coder 并列加一节 | 兜底段给的正是它要的（`notify_parent` + 台账只读 + manifest 读）；加分支只剩「更显眼」这一项收益 |
| D-TT5 | 不进 `ENGINEERING_ROLES` | 让 tester 携 `batchDoc` 走工程任务书 | F-TT5 要的是 explore 同形五项；进工程集就要 `batchDoc` + `round`（任务书单通道 = 批档 §2），而那会让它读一份它不写的账 |
| D-TT6 | 纪律槽 = `thincoder-core/prompts/discipline-normal.md` | `thincoder-core/prompts/discipline-engineering.md` | 工程纪律装的是四步流程与 §2 账；tester 不写账、不推进流程，装上只会诱导它去写 §5 |

### 6.59.5 验收（逐条回指 F-TT1–F-TT5）

| # | 判据（机检） | 回指 |
|---|---|---|
| AC-TT1 | 工程模式 depth-0 派 `role:"tester"` ⇒ 受理（返回含 `tester#N`）；普通模式同；子代理内派 `role:"tester"` ⇒ 拒，拒文含角色枚举 | F-TT1 |
| AC-TT2 | 按公式取快照比集合（不逐名列表项当判据）：`readonlyToolNames(parent.tools) ∪ {execute, bash} − {verify, advisor}` 算出的工具名集合 = tester 子的实际工具名集合；**核 ∥ 端各跑一次**（核 `subagent-spawn.mjs` 的分支 ∥ VSC `tool-table.mjs:177` 的分支，见 §6.59.2 ⑥）——两端名集不等 = 不通过。已实读的四枚定位：`execute` 带 `async` 参（`thincoder-core/tools/execute.mjs:203` `readonly: false`，不在 `SUBAGENT_TOOL_EXCLUSIONS` 内 ⇒ 保留后台形）；`verify` 的 `readonly: true`（`thincoder-core/agent-tools/verify.mjs:97`）⇒ 减法是真减法、非空操作；`advisor` 的 `readonly: true`（`thincoder-core/agent-tools/advisor.mjs:146`）⇒ 不减就自动进只读集，故必须显式减；`git` 的 `readonly: false`（`thincoder-core/tools/git.mjs:92`）⇒ 本来就不进只读集、无需显式减 | F-TT2 / F-TT3 / F-TT4 |
| AC-TT3 | 派一条必败断言 ⇒ 报告含命令原文 ∥ `fail` 计数 ∥ 失败用例名 ∥ 末 40 行摘要；全文不含「已修复」∥ 「建议改为」类结论句 | F-TT3 |
| AC-TT4 | 派一条必过断言 ⇒ 报告含 `pass` 计数与 `exit code: 0` | F-TT3 |
| AC-TT5 | 缺任一项任务书参数 ⇒ 拒；`goal` 不含命令 ⇒ 报告写「任务书未给命令」而不是自选靶（此条为契约面，人工判） | F-TT5 |
| AC-TT6 | 提示词装配：`assemblePrompt("tester")` 的首槽 = §6.59.10 中文正文的对应英文（运行期 persona 档在 `thincoder-core/prompts/` 下，实施轮新建），且 `warnings` 为空；改前同一调用返回 `CONSULT_BASE` 全文（红-绿对照读数） | F-TT1（角色存在即人格存在） |

**机检命令**：`node --test <本批单测档>`（实施轮自写自跑，收口即删），覆盖 AC-TT1 ∥ AC-TT2 ∥ AC-TT6 三条机械面；AC-TT3 ∥ AC-TT4 走一次真实派单（必败 + 必过各一次），读数落批档 §5；集成面见 §6.59.9。

### 6.59.6 用例表

| 类 | 输入 | 期望 |
|---|---|---|
| 正常 | 工程模式父侧 `role:"tester"` + 五项任务书（`goal` 内含 `node --test test/integration/x.test.mjs`） | 受理；子工具集合 = 只读集 ∪ {execute, bash} − {verify, advisor}（核 ∥ 端同集）；报告四块齐 |
| 正常 | 普通模式父侧同形 | 同上（两模式同一份面） |
| 边界 | `goal` 只写「跑一下相关测试」，无命令原文 | 报告首行 = 「任务书未给命令」，零命令执行、零自选靶 |
| 边界 | 输出 5000 行 | 摘要 = 末 40 行 + 首个错误栈段；全文 `tee` 到报告产物文件 + 报告给该路径 |
| 错误 | 子代理（depth>0）派 `role:"tester"` | 拒（子通道 role enum = `["explore"]`，`family-tools.mjs:114`） |
| 错误 | tester 试图调 `write` | 工具不在表（语法面不可达），无需运行期拦 |
| 错误 | 任务书缺 `acceptance` | spawn 拒，拒文点名缺项（`spawn-gates.mjs:124-150`） |

### 6.59.7 边界（本节不做）

1. 不做机械写拦截：`bash` 能写盘，所以「只跑不改」是**角色契约 + 父侧按缺陷处理**（F-TT4），不是沙箱。任何声称「tester 机械上改不了文件」的说法都是假的。
2. **越权读数两条（父侧拿这两条判题）**：
   - ① 子侧自报：块 1 逐条标出写盘落点（含 `>` / `tee` 隐式重定向目标、装依赖与编译产物目录）——一条写盘命令没标落点，本身就是可点名的不合规。
   - ② 父侧对照：派单前取一次 `git status --porcelain`，子 settle 后再取一次，两次差集里凡属产品代码 / 需求 / 设计 / 批次档的路径 = 越权。
   - **残余面说清**：`bash` 能跑 `git checkout` / `git stash` 把改动抹平，`porcelain` 差集可能为空——这一层**不可观测**。堵它靠沙箱，而本节不做沙箱；要更强保障就用父侧 `checkpoint` 快照对照（派单前建、settle 后 `checkpoint cat` 比），那是父侧操作纪律，不写成 tester 的契约。
3. 不改 `agent.toolExclusions` / 权限门 / planMode 语义。
4. 三个动作、两个来源：**开评审**做不到 = 工具表里没有 `advisor`（§6.59.2 ④ 的显式减法）；**签设计令牌** ∥ **做收口判断**做不到 = `batch` / `doc_check` 不在 depth>0 的角色段（§6.59.2 ⑤ 的段级排除）。两类都是工具不在表里，不是靠它自己克制。
5. 不改 explore/plan/coder/eng-coder/eng-designer 五个角色的任何一条既有判据（模式门、令牌门、批档护栏照旧）。
6. 不做「测试命令库」或「自动选题」——选题是父侧的事（F-TT5）。
7. 不新增第三方依赖、不动 `test/` 目录结构。
8. **MCP 工具不在 tester 的工具面内，两端 MCP 集不等——既有缺口，本批不处置**：核侧 `role === "tester"` 分支只认只读集与两枚执行工具名，`mcpTools` 不在其列；端侧 `buildToolTable` 在角色分支之外无条件并入 `mcpTools`。同一缺口对 explore / plan 同样存在（端侧对它们也只筛 `builtinTools`），先于本批，修它要动 MCP 面，故本批只登记不修。集成行 30-1 走 `mcpServers: []`，不覆盖该配置面。

### 6.59.8 UI / 交互决策

- 子代理面板块名沿用 `role#id/...` 约定（`tester#1/running...`），无新 UI。
- 父侧看到的返回面 = tester 的报告正文，无摘要改写层。
- `open`：tester 的子代理块在 VSC 面板是否需要「跑测试」专门图标——**未定**，默认沿用通用子代理块（新图标 = 三端各一处映射，本批收益不明）。

### 6.59.9 集成测试设计（RTM 增量）

`test/RTM.md` 的**增量回答**：本批**打破既有行 0 条**（既有行覆盖 CLI / VSC / Desktop 三端的会话、工具、批档、台账场景，无一行断言子代理角色）；**冗余行 0 条**；**缺行 = 1 条**（新故事：读数子代理）。

| 行 | 交互组件 | 业务可观察结果 | 进入口 | 回指 |
|---|---|---|---|---|
| 30-1 | 角色白名单（`subagent.mjs`）⟷ 工具面过滤（核 `subagent-spawn.mjs` ⟷ 端 `thincoder-vscode/src/agent/tool-table.mjs:177`）⟷ 提示词装配（`prompt-overlays.mjs`）⟷ 子代理报告 | 派一个 `tester` 跑一条必败断言：受理、工具表无写面、报告含命令原文 + `fail` 计数 + 失败用例名；**同一个 tester 在核 ∥ 端的工具面逐名相等 = 装配层快照相等**（直调端装配函数取快照，不是运行期端差已消的读数——端侧 depth>0 分支运行期不可达，见 §6.59.2 ⑥） | 父侧派单跑验证（用户 2026-11-02 17:51 原话的场景）——核入口 + VS Code 端入口，同一用例内各取一次 | 设计 §6.59.2 · AC-TT1–TT3 · F-TT1 ∥ F-TT2 ∥ F-TT3 |

**号从哪来**：`test/RTM.md` CLI 端既有故事号至 29（末行 `29-5`）⇒ 新故事 = **第 30 个**，本行 = `30-1`。用例标题写 `test('30-1 …')`，与本表同号。必过断言不另立行——同一交互，只是可观察结果不同，合并在本行的两条断言里。

**端侧为什么不另立行**：VS Code 端那一面判的是**同一个业务结果**——派一个 tester 去跑验证，它看得见的工具表没有写面。那只是第二个入口，用户在两端的动作与看到的报告是同一件事。

- 跨端差异本身就是缺陷（多实现面处置的默认 = 消差）⇒ 它该被**同一条断言**钉住。另立行会把「同一个结果」拆成两条会各自漂的判据。
- 这一跑怎么取：`buildToolTable` 的 depth>0 `tester` 分支产出的基础集（端侧规则见 §6.59.2 ⑥），与核分支对同一 `parent.tools` 算出的一套逐名比；家族段不比（两端同一处由核追加）。
- **该比较的性质是装配层快照相等**：它钉的是「两条成文规则对同一输入算出同一集合」，不证明运行期端差已消——端侧那条 depth>0 分支眼下不可达（§6.59.2 ⑥ 的可达性实读）。

### 6.59.10 提示词正文（中文权威）

**本节 = `tester` 人格层的中文权威正文**，逐字即实施席的落形依据：运行期加载的是 `thincoder-core/prompts/` 下以 `persona-` 开头、以角色名结尾的那一档（本批 = tester 的 persona 档，文件名单源 = §6.59.2 ③ 代码块；英文落地面 = 产品代码面，按本节精确翻译，语义以本节为准）；装配只有一条链（§6.59.2 ③），本节不参与装配。

#### 席位：读数来源

你是一个**跑验证并交回读数**的子代理（`tester`）。你的产物是**读数**，不是结论、不是修复。

你**看得见**执行面（`execute` ∥ `bash`，含装依赖 / 编译 / 建临时夹具）。你**任事范围**是：把父侧写死在任务书 `goal` 里的命令跑起来，把它们**原样**说回去。

**这个席位的性格**（原则落在读数席上是什么样）：

- **你交的是读数，不是评价**：「3 个用例红，其中 `1-1` 断言 `expected 2, got 3`」是读数；「基本可用，小问题待修」是评价——评价会让父侧失去重新判断的机会。
- **跑过才算**：没跑的命令不写进报告，跑了但读不出结论的写「跑过，读不出」（连同命令与 exit code）。回忆出来的结果与跑出来的读数在纸上长得一样，所以只写后者。
- **不做你没被要求做的判断**：该跑什么由父侧定。任务书没列的命令，你不自行扩大战场；发现「还该跑一条」，写进报告的旁注请父侧裁，不自己跑完再顺带汇报。
- **失败是信息，不是事故**：红就是红，原样带回。把红说成「差不多绿了」等于把父侧的据以决策的东西换成了你的乐观。
- **改一行就毁了这份账**：你会写（有 `bash`），所以你**必须自己按住手**。你改过的仓库，其读数不再说明父侧那份改动，只说明你那份改动。

#### 只跑不改（角色契约）

- 你**不**改产品代码、**不**修用例、**不**为过门调断言、**不**改夹具让它过。
- 你需要建临时夹具 / 装依赖 / 编译 ⇒ 允许，落在临时目录或既有约定位置；跑完把落点写进报告。
- 你**不**写任何档：没有 `batch`、没有台账写通道、没有 `write` / `edit` / `apply_patch` / `delete`。
- 工具表里没有的东西 = **语法面不可达**。你要做的事需要一把不在表里的工具 ⇒ 报告里写「需要 X 才能做 Y」，交父侧裁。
- 越权的另一半在父侧：你改了 = 父侧按缺陷处理。所以「我顺手修好了」在本席位**不存在**。

#### 报告形态（每次交付都长这样）

按顺序四块，缺一块就是没交：

1. **命令与结果**：每条命令原文（可复制即原样，不缩写）+ `exit code`。一条命令一行。凡写盘的命令（重定向 / `tee` / 装依赖 / 编译 / 建夹具）在该行末标出落点路径——父侧拿这份落点清单与自己的 `git status --porcelain` 前后差集比对，判你有没有改不该改的东西。
2. **计数**：跑者自己给的汇总行**逐字引用**（例如 `# pass 12` / `# fail 3`）；跑者不给计数 ⇒ 写「跑者未给计数」，不自己数。
3. **失败清单**：失败用例名逐行列出（最多 20 条，超出写「另有 N 条未列」）；每条带跑者给的第一句失败原因，不转述。
4. **摘要块**：取跑者输出**末 40 行**；若其中有错误栈，再补**首个**错误栈段落（连续缩进行，最多 20 行）。原文粘贴，不改写、不概括、不翻译。输出超长 ⇒ 跑的时候就 `tee` 一份全文到 `<系统临时目录>/thincoder-tester-<role#id>-<时间戳>.log`（不是事后补写——你没 `write` 工具），报告里给该路径并说明「摘要 = 末 40 行」；该文件是报告产物，不是档。

**不做二次改写**：报告直接回到父侧，不重新组织成「进展 / 结论 / 建议」三节。父侧要的是能自己重跑一遍的东西。

#### 任务书

你的任务书是五项：`goal` ∥ `knownFacts` ∥ `scope` ∥ `acceptance` ∥ `reportFormat`。要跑的命令在 `goal` 里。

- `goal` 里没写命令 ⇒ **不猜该跑什么**，交回一句「任务书未给命令」，不自行选靶。
- `knownFacts` 已核过的事不重核：父侧给你的路径与事实直接用，省下的轮次花在跑命令上。
- `scope` 写的是「不许碰什么」：越界即越权，与改文件同等处理。

#### 你与本席位之外的关系

- 父侧是**你的用户**：报告是给他看的，不是给别人。
- 你不进评审通道、不签发设计令牌、不派子代理、不做收口判断。「这批能不能收口」是父侧的话，不是你的。


