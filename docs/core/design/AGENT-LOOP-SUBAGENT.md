# 子代理工具契约与装配面（AGENT-LOOP-SUBAGENT）· 核心统一子系统档（拆分面）

> 归属 = `docs/core/design/AGENT-LOOP.md` 的**机制族拆分面**——「子代理工具契约与装配面」族。
> **三分**——自本档迁出：后台异步池 / 挂起回合与 digest / 评审实例面 ⇒ `docs/core/design/AGENT-LOOP-ASYNC-POOL.md`（§6.8 · §6.10 · §6.11 · §6.18 · §6.19 · §6.20）；子 → 父上行与唤醒面 ⇒ `docs/core/design/AGENT-LOOP-UPSTREAM.md`（§6.27 全族）。
> **节号沿用母档全局编号**（本档承接 §6.7 · §6.9 · §6.12 · §6.21–§6.26 · §6.28）——全仓既有指针**只改档名、不改节号**；母档续 §6.1–§6.6 + §6.13–§6.17。
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

**模式过滤**：普通模式 explore / plan / coder；工程模式 explore / eng-designer / eng-coder——schema enum 反映现行模式（角色互斥：工程禁 plan 与 coder、普通禁 eng-coder 与 eng-designer；schema 枚举 + 运行期硬门禁双保险；裁定源 = §6.23.3（角色 enum 契约））。

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

- **`files?: string[]`**——写域声明（纪律：清单外改动允许但必须逐项报告；不做任务书文本自动解析）。**目录声明不支持**（`normalizeFileList` 对以 `/` 或 `\` 结尾 / 指向既有目录 → 抛明确错误，fail-closed）。归一化：相对 cwd 转绝对 + 正斜杠 + win32 小写比较键。
- **`dependsOn?: string[]`**——子代理 id 列表（显式依赖）。
- **`batchDoc?: string`**（eng-coder spawn **门禁参数**——非调度参数，不参与冲突判定）：工程模式 spawn `role="eng-coder"` **必传**（批次档路径）；判据 = 参数在 + `resolve(cwd, batchDoc)` 存在且为文件（**不校验内容 / 措辞**）；缺失 / 不可读 → spawn 拒绝（校验落点 = `buildSpawnChild`——token 门之前，sync / async 两路共经）。
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

### 6.21.4 受影响文件清单

| # | 文件 | 当前行数 | 预计增量 | 说明 |
|---|---|---|---|---|
| 1 | `thincoder-core/agent-tools/subagent-scheduler.mjs` | 398 | +4 | `nextSubagentId` 写令牌（`:396-399` 内）+ 注释句 |
| 2 | `thincoder-core/agent-tools/subagent-run.mjs` | 202 | +8 | `:53` 令牌断言 + `:181` 入池键守卫 |
| 3 | `thincoder-core/agent-tools/escalate-async.mjs` | 295 | +6 | `:157` 令牌断言 + `:285` 键守卫 |
| 4 | `thincoder-core/agent-tools/advisor-async.mjs` | 357 | +6 | `:270` 令牌断言 + `:326` 键守卫 |
| 6 | `thincoder-core/agent-tools/subagent-spawn.mjs` | 459 | 0 | **零改**（取号站点已在位——只读核对面） |

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
5. 不迁 `DOC-MIGRATION.md:63` 所记「取号公式句并入 `AGENT-LOOP.md` 子代理池节」（迁移 = 另案）。
6. 不解 ED-4 排队面（§6.10 / §6.11）与 ED-1 / ED-2 / ED-3 条目内容——互不耦合。

## 6.22 委派与 spawn 门（任务书单通道 = 批次档 §2）

**定位**：委派治理的**结构承载**。任务书只有一个来源——**批次档 §2**（设计席写、经设计评审）；工程角色的 spawn 不再携带任何任务书文本参数。

**最近先例**：§6.23「工具描述与门同源」族——`subagent.mjs` 描述句随门改口、`ROUND_VALUES` 单源（§6.23.3 / §6.23.4）。**对齐**其形：描述面与门同源、判据值集单源；**偏离**一处：先例只做参数级收正（同一套参数改口径），本节把任务书整体从参数面移到档面（参数面清零）——没有先例可完全套用，故 KD 面另立（§6.22.4）。
**勘察证据**：查过——
- 提示词面：`thincoder-core/prompts/persona-engineering.md` ∥ `thincoder-core/prompts/discipline-normal.md`（载五参）、`thincoder-core/prompts/discipline-engineering.md`（0 命中）；
- 工具与门面：`thincoder-core/tool-docs/subagent.md` · `thincoder-core/agent-tools/subagent.mjs` · `spawn-gates.mjs` · `subagent-spawn.mjs` · `audit-block.mjs` · `thincoder-core/permission.mjs`；
- 夹具与基准：`bench/probe/data.mjs` · `bench/check/probe.check.mjs` · `docs/core/design/MODEL-BENCH.md`。

公开源档内未见同机制成案（本节为首案）。

工程角色（eng-coder / eng-designer）的 spawn 面 = `batchDoc`（必带、可读）· `round`（enum，必带）· `files` / `dependsOn` / `async` / `model`（调度与运行面）· eng-coder 另带 `designId` + `designToken`。
非工程角色（explore / plan / coder）保留任务书参数：四项核心（`goal` / `knownFacts` / `acceptance` / `reportFormat`）+ `scope`——它们没有批次档，不存在「第二个来源架空第一个来源」这条缺陷路径。

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

**门序**：角色 enum → `batchDoc` 门（既有）→ 任务书门（工程角色 = 拒收八个自由文本键 ∥ 非工程角色 = 四项核心 + `scope` 必带）→ `round`（工程角色）→ token 门（eng-coder，既有）→ files 声明面（既有）。

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

### 6.22.3 受影响文件清单

**行数口径**：`现` = 内容行数（`\n` 计数 + 1）；本档行 = 含本批的实测值（as-of 2026-10-24 23:45），其余行 = 改前实测值（as-of 2026-10-24 22:55）；他节（§6.21 / §6.29 等）的「现」值 = 该节成文时的读数，不作当前值用。

| 文件 | 现 | Δ（设计估算） | 说明 |
|---|---|---|---|
| `thincoder-core/agent-tools/spawn-gates.mjs` | 171 | ≈+12 | 删 `ENG_TASK_BOOK_MIN` / `designPoints` 标签 / fifth 的 engineering 支；新增 `ENG_REFUSED_PARAMS` 单源 + `rejectEngFreeTextParams(args, role)`；`:49` / `:139` 两句文案随 P13 改新口径 |
| `thincoder-core/agent-tools/subagent-spawn.mjs` | 435 | ≈+8 | 工程角色 input 改任务书行；拒收门落点（`batchDoc` 门之后、`round` 之前） |
| `thincoder-core/agent-tools/audit-block.mjs` | 109 | ≈−37 | 删 `summarizeEngTaskBook` 与其 marker 表；审计块改注入 §2 路径 |
| `thincoder-core/agent-tools/subagent.mjs` | 423 | ≈±2 | 删 `designPoints` 属性；七条 description 改口（工程角色不收 / 非工程角色才收） |
| `thincoder-core/tool-docs/subagent.md` | 39 | ≈+25 → ≈64 | 任务书段重写 + 两条示例；A 块折行不折字（1→6 行）+ 存量 14 条 >300 行（`:4-12` ∥ `:19-21` ∥ `:31` ∥ `:33`）同法折行（语义零改，断行处 = 原空格）——落盘处非表格非围栏，批档写入门按整档判行宽 |
| `thincoder-core/prompts/persona-engineering.md` | 473 | ≈−11 | 示例三处改形 + 五项参数块删除，换「任务书 = §2」一段；B 块首条折行（1→2 行，同 A 块归一规则） |
| `thincoder-core/prompts/discipline-normal.md` | 315 | ±0 | 「every spawn role」收窄为 normal-mode 角色 + 一行工程模式说明；P14 删 `:255` 的 `round` 行 |
| `thincoder-core/prompts/discipline-engineering.md` | 345 | ±0 | 已核：`designPoints` ∥ `four core` ∥ `every spawn role` ∥ 五项参表述 0 命中（2026-10-24 22:55 全档 grep）——工程规则载体无同类表述，零改 |
| `thincoder-core/permission.mjs` | 133 | ±0 | `:38` 预览句：拼装空 ⇒ 回退到 §2 路径句 |
| `thincoder-core/agent/family-tools.mjs` | 206 | ±0 | `:99` 注释与 `:129` 审计通道描述随 KD-SC6 改（P15——现文仍指已删的 A2 摘要面） |
| `bench/probe/data.mjs` | 217 | ≈−10 | 三族夹具：五参 → `{round, batchDoc}`，冲突内容移进夹具批档 §2 |
| `bench/check/probe.check.mjs` | 306 | ≈−12 | 五参断言组改为拒收断言组；A 段逐字断言改行折叠归一比较（AC-SC-5） |
| `bench/check/probe-frozen.mjs` | 107 | ≈±0 | 按族随动；冻结面含 `:49` / `:139` 两句的期望文案随 P13 更新 |
| `bench/probe/driver.mjs` | 267 | ±0 | 拼装点签名不变时零改 |
| `docs/core/design/AGENT-LOOP-SUBAGENT.md` | 855 | 本批 | §6.22 重写 + §6.30 描述块随改 + §6.7.1 `:21` / §6.7.2 `:42` / §6.24 / §6.30 四处 F 指针与跨节滞后改锚 + **§6.26 审计块契约改锚**（改后代码块 / D23-6 / 分类表第 3 行 / 受影响表两行——`summarizeEngTaskBook` 按 KD-SC6 删除）；行数已过 800 硬限，本批继续加行 ⇒ **拆分候选登记**：§6.22 提示词逐字面 + §6.30 描述面另立设计档 `SPAWN-TASK-CHANNEL`（下一批创建，本批不建档） |
| `docs/core/design/ENGINEERING-MODE-V2.md` | 517 | ±0 | `:68` M5 职责格改新口径（工程角色 = §2 + `round` + token ∥ 非工程角色 = 四项核心 + `scope`）· `:256` 委派治理段随口径 · `:306` F 指针改锚 §6.22.1 |
| `docs/core/design/MODEL-BENCH.md` | 1844 | ≈−15 | 夹具族任务书形改指夹具批档 §2：`:1439` 探针 `args` 五参键 → `{round, batchDoc, model}` · `:1440` 门描述去 `taskBookParamsFor("eng-designer")` 五参名集（改「工程角色拒收八个自由文本键、任务书 = 批档 §2」）· `:1462` 夹具族名集 + `composeTaskBookBrief(params, "eng-designer")` 五参拼装 → 任务书 = 夹具批档 §2 · `:1467-1471` / `:1484-1488` / `:1501-1505` 三族任务书 fenced 块（各 5 行）内容移进夹具批档 §2 |

**需求面（主 agent 笔，设计席只登记）**：`docs/core/requirements/ENGINEERING-MODE-V2.md:430` / `:433`；`docs/core/requirements/ENGINEERING-MODE-V2-SPEC-DELEGATION.md:7` / `:12-19` / `:33`——见 §6.22.8 的改法列。

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
| AC-SC-5 | 提示词面：`thincoder-core/tool-docs/subagent.md` 的新任务书段与 §6.22.8-A 逐字全等（行折叠归一：折行块按 `\n` 两侧空白折叠为单空格后比较）；两档整档无 >300 字符行；工程示例与工程段落不带任务书文本参数；**拒收名册只活在门的报错里，不进提示词**（提示词只正面陈述工程角色带什么）；提示词档无退役参数表述 | `node -e "const fs=require('fs');const c=(f,s)=>fs.readFileSync(f,'utf8').split(s).length-1;console.log(c('thincoder-core/prompts/persona-engineering.md','designPoints'),c('thincoder-core/prompts/persona-engineering.md','every spawn role'),c('thincoder-core/prompts/persona-engineering.md','four core'),c('thincoder-core/prompts/persona-engineering.md','goal='),c('thincoder-core/prompts/discipline-normal.md','designPoints'),c('thincoder-core/prompts/discipline-normal.md','every spawn role'),c('thincoder-core/prompts/discipline-engineering.md','designPoints'))"` ⇒ `0 0 0 0 0 0 0`（七列全 `0`：两档无退役参数、无「every spawn role / four core」旧口径、`persona-engineering.md` 内 `goal=` 示例零处）；`thincoder-core/tool-docs/subagent.md` 含 §6.22.8-A 段 1 处、按同一归一逐字全等（`node --test bench/check/probe.check.mjs` 断言组 exit 0）；`node -e "for(const f of ['thincoder-core/tool-docs/subagent.md','thincoder-core/prompts/persona-engineering.md'])console.log(f,require('fs').readFileSync(f,'utf8').split('\n').filter(l=>l.length>300).length)"` ⇒ 两行均 `0`（整档无 >300 行——A/B 折行与存量 14 行处置的判据） |
| AC-SC-6 | 审计块：含 `Batch record (batchDoc):` 行与 §2 指向句；`summarizeEngTaskBook` 符号 0 命中 | `node -e "console.log((require('fs').readFileSync('thincoder-core/agent-tools/audit-block.mjs','utf8').match(/summarizeEngTaskBook/g)||[]).length)"` ⇒ `0`（全 `thincoder-core` 扫同法）；审计块断言随 `node --test bench/check/probe.check.mjs` ⇒ exit 0 |
| AC-SC-7 | 过渡：现存设计 / 需求档里以 `designPoints` 为落点的验收条款逐条改指 §2（清单见 §6.22.3） | `grep -rn "designPoints" docs/core/design docs/core/requirements` ⇒ 命中行仅剩「退役 / 改指 §2」表述（逐行核，清单 = §6.22.3 末段） |
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
2. 不改 `batchDoc` 必填性与其判据（参数在 + 路径可读；内容不校验）。
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
| P3 | `thincoder-core/agent-tools/subagent.mjs:142` | `task: … OPTIONAL free-text supplement — the brief itself is the structured task-book parameters (four core … plus the role's fifth: designPoints … scope …); a task-only spawn is refused …` | `For action:'spawn': normal-mode roles (explore/plan/coder) — OPTIONAL free-text supplement; the brief itself is the four core parameters (goal / knownFacts / acceptance / reportFormat) + scope. Engineering roles (eng-coder / eng-designer) take NO task-book text parameters — their task book is batch record §2 (batchDoc), read by the child itself. For action:'escalate': the brief (goal, constraints, entry files, acceptance criteria).` | 描述与门同源 |
| P4 | `thincoder-core/agent-tools/subagent.mjs:143` `context` | `Optional background the sub-agent needs (it cannot see this conversation); action:'spawn' only.` | `Optional background for normal-mode spawns (explore/plan/coder) only; action:'spawn' only.` | 同上 |
| P5 | `thincoder-core/agent-tools/subagent.mjs:153-158` | 五条 `REQUIRED for every spawn role …`；`designPoints: {…}` 属性一条 | `goal` / `knownFacts` / `acceptance` / `reportFormat` 首句 → `REQUIRED for role='explore'/'plan'/'coder' (normal-mode task book) …`；`scope` 首句 → `REQUIRED for role='explore'/'plan'/'coder' …`；**删除 `designPoints` 属性整行**；`batchDoc` 描述加一句 `This IS the task book for engineering roles — batch record §2, read by the child itself.` | 同上 |
| P6 | `thincoder-core/prompts/persona-engineering.md:72` | `spawn eng-designer (\`subagent(role="eng-designer", batchDoc=<…>, files=[...], round="initial", goal=..., knownFacts=..., designPoints=..., acceptance=..., reportFormat=...)\`; \`task\` is an optional supplement)` | `spawn eng-designer (\`subagent(role="eng-designer", batchDoc=<this batch's record path>, files=[...], round="initial")\`)` | 示例即门形 |
| P7 | `thincoder-core/prompts/persona-engineering.md:312` | ``subagent(role="eng-coder", designId=<id>, designToken=<token>, batchDoc=<batch record path>, round="initial", goal=..., knownFacts=..., designPoints=..., acceptance=..., reportFormat=...)`` | ``subagent(role="eng-coder", designId=<id>, designToken=<token>, batchDoc=<batch record path>, round="initial", files=[...])`` | 同上 |
| P8 | `thincoder-core/prompts/persona-engineering.md:325-346` | 「Every dispatch carries a task book — four core = structured spawn parameters, every spawn role」+ `goal` / `round` / `designToken` / `knownFacts` / 第五项按角色 / `acceptance` / `reportFormat` 七条列表 | 整段替换为 §6.22.8-B（下方代码块）；`files` 是调度通道那两条警告（`:341-343`）逐字保留 | 任务书单通道 |
| P9 | `thincoder-core/prompts/persona-engineering.md:432-433` | 两条并行 token 隔离示例（各带五参） | 两条同 P7 形（只差 designId / designToken 字面） | 示例即门形 |
| P10 | `thincoder-core/prompts/discipline-normal.md:253-260` | `Every delegation carries a task book — four core = structured spawn parameters, every spawn role …` 与第五项按角色行、`Every spawn role: …` | `Every normal-mode delegation (explore / plan / coder) carries a task book — four core structured spawn parameters:` / 第五项行改为 `**\`scope\`** (scope & forbidden scope — what to read / what not to touch)` / 末尾改 `Every normal-mode spawn role: …`；另加一行 `**Engineering-mode spawns (eng-coder / eng-designer) carry no task-book text parameters** — their task book is batch record §2, and free text parameters are refused with the parameter named.` | 层次不串 |
| P11 | `thincoder-core/permission.mjs:38` | `cap(composeTaskBookBrief(args, args.role) \|\| args.task \|\| "", 500)` | `cap(composeTaskBookBrief(args, args.role) \|\| (args.batchDoc ? \`task book: batch record §2 (\${args.batchDoc})\` : "") \|\| args.task \|\| "", 500)` | 人审面不空白 |
| P12 | 需求面（主 agent 笔） | `docs/core/requirements/ENGINEERING-MODE-V2.md:430`「派单任务书 = 四项核心 + 第五项按角色」／`:433`「四项核心 + 第五项按角色 + round 要可见」／`docs/core/requirements/ENGINEERING-MODE-V2-SPEC-DELEGATION.md:7`「四项核心 + 第五项按角色」／`:14-19` 五项列表／`:33` AC-M5-2 | 均改为「**任务书 = 批次档 §2**（工程角色零任务书文本参数，自由文本参数点名拒收）；非工程角色（explore / plan / coder）= 四项核心 + `scope`」；`:33` 判据改为「工程角色：`batchDoc` 可读 ∧ `round` 合法 ∧ 无任务书文本参数（命中即拒并点名）∥ 非工程角色：四项核心 + `scope` 缺任一即拒」 | 需求与设计同口径 |
| P13 | `thincoder-core/agent-tools/spawn-gates.mjs:49` ∥ `:139` | `:49` round 门文案 `the five task-book parameters are enforced by a separate gate (validateTaskBookParams)` ∥ `:139` 拼接模板 ` (got ${otherFifth} instead — that name belongs to the eng-coder/eng-designer spawns)` | `:49` → `task-book text parameters are refused for engineering roles by a separate gate (rejectEngFreeTextParams)`；`:139` → ` (got ${otherFifth} instead — ${otherFifth} is retired for every role; the fifth parameter here is ${fifth})` | 同档两句互斥消解——`:83` 退役句为准；原 `:139` 把派单方指去一个同样拒收该名的 spawn，`:49` 自述的五参门对工程角色已不存在 |
| P14 | `thincoder-core/prompts/discipline-normal.md:255` | `**\`round\`** (initial \| fix — eng-coder / eng-designer only; fix rounds are point-fixes only, no full survey)` 挂在 normal-mode 任务书清单内 | 整行删除——`round` 是工程角色必带项，normal-mode 清单不列；工程面由同段末「Engineering-mode spawns …」行承载 | 层次不串（清单头 = normal-mode 四项核心，行内混工程参数） |
| P15 | `thincoder-core/agent/family-tools.mjs:99` ∥ `:129` | 注释 `its task book rides the mechanical summary of the parent's _engTaskInput instead` ∥ 审计通道描述 `The audit task book is appended MECHANICALLY — your own spawn task (docs involved / acceptance criteria / file list) plus the files you actually touched` | `:99` → `its task book rides the parent's batch record §2 instead (the audit block carries the batchDoc path)`；`:129` 该句 → `The audit context is appended MECHANICALLY — the batch record path (its §2 is the delivery's task book, read it before judging) plus the files you actually touched` | 描述与门同源——A2 摘要面已删（KD-SC6），现审计块 = 批档路径行 + §2 指向句 + touched 快照 |

**提示词面只作正面陈述，不预演错误**：模型只会用列出的参数——把被拒的名字写进提示词，等于把那串名字变成候选项。拒收名册只活在门的报错里（命中时逐字点名，§6.22.1），提示词与工具描述都不预演错误。

**§6.22.8-A（P1 的整段替换——折行不折字：断行处 = 原空格，逐行 ≤300；归一比较规则见 AC-SC-5）**：

```text
Task book (normal-mode roles: explore / plan / coder): four core structured parameters — goal (goal & why), knownFacts (the facts you already verified), acceptance (machine-verifiable criteria), reportFormat (delivery-report format)
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

**折行依据**：A ∥ B 两块的落盘处（`thincoder-core/tool-docs/subagent.md:23` · `thincoder-core/prompts/persona-engineering.md:324`）非表格非围栏——批档写入门按整档判行宽（>300 即拒），单行 1000 ∥ 335 必破 ⇒ 折行不折字（断行处 = 原空格，归一后逐字全等已实测）；该档存量 14 条长行同理同法。

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
| `agent-tools/subagent.mjs:133` | `Mode filtering: normal mode exposes explore/plan/coder; engineering mode exposes explore/plan/eng-designer/eng-coder. The schema enum reflects the active mode.` | `Mode filtering: normal mode exposes explore/plan/coder (eng-coder and eng-designer are refused); engineering mode exposes explore/eng-designer/eng-coder (plan and coder are refused — plan is a normal-mode role, coder is replaced by eng-coder). The role enum is filtered per mode at assembly, and the spawn gate refuses out-of-mode roles mechanically.` |
| `agent/family-tools.mjs:46` | `enum: ["explore", "plan", "eng-designer", "eng-coder"],` | `enum: ["explore", "eng-designer", "eng-coder"],` |
| `agent-tools/subagent.mjs:154` | `round: { type: "string", enum: ["initial", "fix"], … }` | `round: { type: "string", enum: ROUND_VALUES, … }`（+ 顶部 `import { ROUND_VALUES } from "./spawn-gates.mjs"`） |
| `agent-tools/spawn-gates.mjs:50` | `if (a.round !== "initial" && a.round !== "fix")` | `if (!ROUND_VALUES.includes(a.round))`（错误文案**逐字不变**：`round (initial\|fix)` / `round ∈ {initial, fix}` 由常量拼出，输出同形） |

**零改面**：`family-tools.mjs:50` 的 suffix 句（现状准确）· `subagent.mjs:238` ROLES 白名单（`plan` 必须仍在——门文案要能指名拒绝）· 门文案 `:242`/`:245`/`:248`/`:254` · `rejectEngineeringFilePaths` 谓词 · 正常模式 enum `family-tools.mjs:53`。

### 6.23.4 受影响文件清单

| 文件 | 现 | Δ | 说明 |
|---|---|---|---|
| `thincoder-core/agent-tools/subagent.mjs` | 408 | +1 → 409 | 描述句 1 行改写（行数不变）+ import 1 行 + schema enum 换常量引用（行数不变）；距 800 硬限充裕，无需拆分 |
| `thincoder-core/agent-tools/spawn-gates.mjs` | 107 | +2 → 109 | 谓词改用常量 + `ROUND_VALUES` 注补「单源」句 |
| `thincoder-core/agent/family-tools.mjs` | 169 | ±0 | enum 一行内改 |

- **未触碰**：`thincoder-core/agent-tools/subagent-async.mjs`（279）。

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
| A-MS1 | ①a | `cd thincoder-cli && node --test test/eng-designer-role.test.mjs` ⇒ exit 0（T30 断言已按新句改写）；且 `grep -c "engineering mode exposes explore/plan/eng-designer" thincoder-core/agent-tools/subagent.mjs` ⇒ `0` |
| A-MS2 | ①b | `cd thincoder-core && node --test test/family-tools.test.mjs` ⇒ exit 0（期望值 = §6.23.3 的集）；CLI 侧 T30 ④ 同断言 ⇒ exit 0 |
| A-MS3 | ② | `cd thincoder-core && node --test test/spawn-gates.test.mjs` ⇒ exit 0（含引用同一性断言）；`grep -n 'enum: \["initial", "fix"\]' thincoder-core/agent-tools/subagent.mjs` ⇒ 零命中 |
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

**受影响文件清单**：

| 文件 | 现 | Δ | 改动 |
|---|---|---|---|
| `thincoder-core/agent-tools/subagent-actions.mjs` | 488 | +3 | ① depth 门（488 → **491 < 800 硬限**） |
| `thincoder-core/agent-tools/async-discard.mjs` | 143 | +2/−1 | ② 读面 `carrierField` + import 补名 |
| `thincoder-core/agent-tools/async-settle.mjs` | 284 | +6/−1 | ③ 借用规则扩张（父字段主 + 载体别名，净 +5 → **289**，< 500 软线）+ 头注一句 |

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
| 1 | 批次档路径行（S1） | `thincoder-core/agent-tools/subagent-spawn.mjs:387` | user 首条 | spawn 级固定（同一 child 终身不变） | **改**：入 system 固块——判据 ① 两条全中 |
| 2 | 审计模板块（S2） | 同档 `:401-437` | user 首条 | spawn 级固定（父交付已定、touched 快照冻结） | **改**：入 system 固块——同上 |
| 3 | `_engTaskInput`（S3） | 同档 `:441` | 记账字段 | **非注入点**（批档路径记账面） | **保持**；值 = 一行机械任务书行（批档绝对路径 + §2 指向句）；A2 摘要面已删（§6.22 KD-SC6） |
| 4 | git 上下文 | `thincoder-core/agent/setup.mjs:55-64`（depth-0 门） | user 提醒 | 逐 run 变化 | 保持（子代理本就零 git——§6.7.4） |
| 5 | OS / cwd / Session start + 目录树快照 | 同档 `:65-80`（once-guard） | user 提醒 | 进程级变化 | 保持——判据 ② |
| 6 | repomap 大纲 | 同档 `:91-99` | user 提醒 | 索引态（可随索引变） | 保持 |
| 7 | 记忆 / 文档召回 | 同档 `:103-128`（depth-0 门） | user transient | 逐轮变化 | 保持——判据 ②（本条即契约句的举例面） |
| 8 | 当前时间 | 同档 `:146-150`（尾位） | user 提醒 | 逐 run 变化 | 保持（尾部即缓存契约既有设计） |
| 9 | env-state / peer / manifest 情境行 | `thincoder-core/agent/setup-reminders.mjs:50-56` · `:115-138` · `:160-166` | user 提醒 | 逐回合变化 | 保持——判据 ② |
| 10 | 活体守卫行（ENG 状态 / AUTO / verify 推回） | `thincoder-core/agent/completion.mjs:81` · `thincoder-core/agent/helpers.mjs:372` | user 提醒 | 逐回合变化 | 保持（`docs/core/design/ENGINEERING-MODE-V2.md:321` 已裁定「不落 system 槽」——其判据即本表判据 ②，不改该裁定） |
| 11 | advisor 评审简报（对象声明 + Approval Signal/token + 文档清单） | `thincoder-core/advisor/messages.mjs:29-39` · `:49-58` · `thincoder-core/advisor/run.mjs:233` | 评审 user 首条 | **评审级固定（同类根因）** | **不动——已由另一机制覆盖**：F13 pinned 重挂（`thincoder-core/advisor/compaction.mjs:56-84` 压缩时作为一条 user 消息重挂 · 调用点 `thincoder-core/advisor/compaction.mjs:94`）⇒ 压缩不丢。登记为「同类已解」 |
| 12 | consult / escalate / 读图降级子代理的任务文本 | `thincoder-core/agent-tools/consult.mjs:308` · `thincoder-core/agent-tools/subagent-actions.mjs:415` · `thincoder-vscode/src/extension/image-handler.mjs:84` | user 首条 | 任务内容（非机制性指令） | 保持——判据 ② 后半 |
| 13 | `REPORT_CONTINUATION`（报告过短追问） | `thincoder-core/agent-tools/subagent-async.mjs:327-329` | user 追问 | 按需重发（机制不同：重发即在场） | 保持 |
| 14 | async 结果注入 / digest 提醒 | `thincoder-core/agent-tools/subagent.mjs:412`（`injectAsyncResult`） | user 提醒 | 事件驱动 | 保持 |

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
let input = args.context ? `Context:\n${args.context}\n\nTask:\n${taskBriefOf(args, role)}` : taskBriefOf(args, role)
const spawnBlocks = []
if (engineeringRole) spawnBlocks.push(`Batch record (batchDoc): ${batchDocAbs}`)
if (engAuditAttempt !== null) spawnBlocks.push(buildAuditBlock(ctx))  // 纯函数：touched 快照 + 模板逐字 + 批档路径行（路径取 ctx.agent._batchDoc；无 A2 摘要——§6.22 KD-SC6）
if (spawnBlocks.length) child._spawnSystemBlock = spawnBlocks.join("\n\n")
if (role === "eng-coder") child._engTaskInput = input                  // 源 = 纯任务书（不含固块）
```

消费者（`thincoder-core/agent/setup.mjs` `prepareRun`，`:214` 之后）：

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

**受影响文件清单**：

| 文件 | 当前行数 | 预计增量 | 说明 |
|---|---|---|---|
| `thincoder-core/agent-tools/subagent-spawn.mjs` | 470 | −80 / +12 | ① 审计模板构造体（`:394-437`）外提；② 三处改固块收集 + `child._spawnSystemBlock` 绑定（S1 / S2 / S3 单点） |
| `thincoder-core/agent-tools/audit-block.mjs` | 0 | +~95 | `buildAuditBlock(ctx)`（纯函数——判据可直测）：touched 快照 + 模板逐字 + 批档路径行（路径取 `ctx.agent._batchDoc`）；不持 A2 摘要函数（§6.22 KD-SC6） |
| `thincoder-core/agent/setup.mjs` | 234 | +3 | `:214` 之后固块拼接（`prepareRun` 单点） |
| 批次本地单元测试档 | 0 | +~120 | 用例 U1–U7 宿主（`npm test` 自动收集——`thincoder-core/test/run.mjs:8` 单层 glob） |
| `docs/core/design/AGENT-LOOP-SUBAGENT.md` | 883 | +~120 | 本节（机制面单源） |
| `docs/core/design/AGENT-LOOP.md` | 514 | ±2 | §6.3 `:229` 契约精化一句 + 变更记录 |
| `docs/core/design/PROMPT-SYSTEM.md` | 270 | +1 | §6.2 装配事实补一行指针（不复制机制——D2） |

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

**验收标准（逐条可机判）**：

| # | 判据（可机判） |
|---|---|
| A23-1 | `prepareRun(engChild).systemPrompt` 含批次档行 ∧ `input` 不含（U1） |
| A23-2 | 审计 spawn 的 system 含五锚 ∧ `input` 不含（U2） |
| A23-3 | 压缩后五锚仍在 system ∧ 不在 history（U3）——**先红**：现态两处皆无 |
| A23-4 | 同 child 两次装配 system 逐字节相等（U4）；null 固块路径逐字节同改前（U5 / U6） |
| A23-5 | 分类裁定表 14 行逐处有裁定（本档表——含「同类已解」第 11 行） |
| A23-6 | `node scripts/doc-check.mjs --root .` 触碰档零新增悬空锚 / 零新增行宽违规 |

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

