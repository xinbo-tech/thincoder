# 子代理 · 异步 · 调度 · 池（AGENT-LOOP-SUBAGENT）· 核心统一子系统档（拆分面）

> 归属 = `docs/core/design/AGENT-LOOP.md` 的**机制族拆分面**——「子代理 / 异步 / 调度 / 池 / 评审实例」族（2026-09-15 迁移批第 5 批自母档 §6.7–§6.12 拆出）。
> **v2 就地更新**（2026-09-17 退役批）：M5 模块设计语义融入（委派与 spawn 门——见 §6.22；原旁路档 `_archive/modules/ENGINEERING-MODE-V2-MODULE-DELEGATION.md` 已归档 `_archive/modules/`）。
> **节号沿用母档全局编号**（§6.7–§6.12 · 新增 §6.18–§6.19）——全仓既有指针**只改档名、不改节号**；母档续 §6.1–§6.6 + §6.13–§6.17。
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
  VSC webview 同步 spawn 块无 ⏹（无池条目 ⇒ cancel 路由定位不到）；`action:"cancel"` 只对 async 池 / advisor 池，sync 由 ⏹ → `cancelSyncChild` 直连。
- **信号链**：`armSyncChildAbort` 建**自属** `AbortController` 并链到基信号 `buildChildSignal`（`_sessionSignal ?? ctx.signal`）；
  注册 `parent._syncChildAborts`（Map，key = relayPrefix 去尾 `role#N`）——try / finally **三路径注销**。
- **catch 三分支**（纯函数 `classifySyncAbort(ctxSignal, baseSignal, ctrlSignal, err)`）：① base / ctx aborted → 整回合停，rethrow；
  ② `AbortError` ∧ ctrl aborted ∧ 非整回合停 → **折叠**（`mergeChildMutations` + stopped partial 报告 + `⟦ev⟧stopped` 直发 + 正常 return）；③ 其他错误原样。
  `STOPPED_MARK`（`spawn-child.mjs`，与 `TURN_CAP_MARK` 同族）= 折叠报告公共锚。
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

## 6.8 挂起回合与 digest（会话级后台双通道）

> 核内形态（状态机 / 载体契约 / 注入面 / 端特有面）见 `AGENT-LOOP.md` §2.3；本节 = 现行机制语义与端面分工。

- **回合尾语义**：回合尾**不再直注入排空**——done 条目留池（settled not consumed）→ `willSuspend`（`poolLive` 覆盖池非空）判 true → 进挂起态 → `sweepSettledToPending` → pending 非空 → digest 回合。**无 suspension 驱动的调用方**（headless / 直连 `runAgent`）保留回合尾直注入兜底（不丢结果）。多条目近邻完成 = **合并一轮消化**。
- **主会话 busy（processing 含 digest）提交禁发**（INPUT-LOCK-BEHAVIOR-REVISED 2026-09-09）：输入不禁（可打字回显），Enter 与斜杠命令同吞；**排队机制整批废弃**——`pendingInput` 收敛**单槽**（至多一条待交接），`state.queue` 缩为残项单容器（释放窗口兜底 / 中止残余——零丢失保留）。

**挂起状态机**：

| 状态 | 事件 | 动作 | 出口 |
|---|---|---|---|
| idle | 回合返回且池非空 | 置 `_suspended` → 挂起态 | → suspension |
| idle | 回合返回且池空 | 正常回 idle | 不变 |
| suspension | 池项 settle 且无 pendingInput | settle 入 `_pendingAsyncResults` → 开 auto-turn | auto-turn 期间仍挂起 |
| suspension | 用户 Enter（无 digest 在跑） | 新回合输入入 `pendingInput` 单槽 + 唤醒 | 回合末池空 → idle；非空 → 回 suspension |
| suspension | 用户 Enter（digest 在跑 = busy） | **提交吞**（不发送）+ busy 提示 | auto-turn 结束后回挂起（文本保留可重发） |
| suspension | 释放窗口 / 槽满 Enter | 单槽交接（槽满吞 + 提示） | 不变 |
| auto-turn | 池项 settle（消化中） | settle 入 pending（不并发开新轮——单 `runAgent` 循环） | 轮末按 pending / 池态续开或退出 |
| auto-turn | 结束且池空 + 无 pendingInput | 补发 done 冻结 + 清 `_suspended` | → idle |
| auto-turn | 结束且 pending 非空 + 无 pendingInput | 立即续开合并消化轮（一次注入全部 pending） | → 新 auto-turn |
| auto-turn | 结束且池非空 | 回挂起等下一 settle | → suspension |
| auto-turn | 结束且有 pendingInput | 自动以该消息开新回合 | → 回合 |

**时序边界**：settle 与 `_suspended` 翻转竞态——`_suspended` 在 `runAgent` finally 返回后（交互层进入挂起前）置位；settle 回调读到的标志若为 false（回合刚结束瞬间）→ 按正常回合语义发 done 冻结（该块本就在流尾，无害）；门控以回调读取时刻为准（确定性，无锁需求）。

**digest 动作域（两档）**：

- **手动档**（无 AUTO——只做「信息整理」）：**允许**总结报告要点注入会话流、更新任务清单、标记需决策点 + 写下建议（只写不执行）；**禁止**写文件 / 改代码、执行类工具（bash / execute / verify）、spawn 一切子代理（async + 同步——**机械拒绝**，subagent 入口检查 `_inAutoTurn && !autoApprove`）。
- **AUTO 档**（`autoApprove` 开——与用户回合一致的全语义推进型）：读 / 写 / spawn / verify / 执行全开放；禁 spawn 的机械限制撤销（推进链终止 = 池空自然停 + 用户输入随时打断）；guard 与普通回合同款。
- **两档通用**：auto-turn 的 mutation 标记不随下轮 per-run 重置而丢（auto-turn 结束时 guard 字段合并保留 `_inheritedGuard`）→ 下一用户回合覆盖 auto-turn 期间改动（防静默漏验）。
- **权限**：手动档 auto-turn 不传 `onPermissionRequest` handler（无 handler 即 denied——不弹审批面板）；AUTO 档沿用 `autoApprove`；自省工具（如 `task`）按只读 / 豁免分类放行。
- **轮次上限**：auto-turn **不另设轮次预算**——统一用系统 `maxTurns`；成本护栏 = 手动档动作域 + 合并消化 + AUTO 责任转移。

**冻结门控 + 消化完成逐条回收**：

- **挂起态 settle 延迟冻结**：settle 时若处于挂起态 → 不发 `⟦ev⟧done`，区块头保持中间态（`done · awaiting digestion` 驻留面板）；正常回合内 settle 行为不变（完成即冻结）。
- **digest 消化完成即逐条补发冻结回收**（不等池空）：pending 条目注入后按 settle 锚点 splice 落位（冻结块位于其 digest 总览文本**之前**）；池空 freeze-out 仅兜底未消化残项。
- **settle 锚点 splice**：`sub._freezeAt` = settle 时刻流位置；多锚点按 `_freezeAt` **降序**冻结（splice 是绝对位置插入——先插小锚点会把大锚点目标后移一位）；>5000 行头裁切处按净位移校正锚点。

**挂起期 Ctrl+C 武装化（三态一致）**：processing / 挂起态首按 → `abort({ interrupt: true })` 无 message（停当前回合——**不清池**——提示「再按中止全部后台」）+ 武装 3s；3s 内二按 → 全停（清池 + 标记 + 唤醒）。二按检查提升到状态路由之前（两次按下之间状态会迁移）；中止后复位 `state._suspAborted`；残余 `pendingInput` 单槽消息转回 `state.queue`（单条——不静默丢）；回合启动解除 `exitArmed` 残留。

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

## 6.10 回合外事件后台化统一模型（分域池 + async advisor）

- **池容量**：`ASYNC_POOL_LIMITS = { engCoder: 4, other: 4 }`（默认）；角色域 = `role === "eng-coder"` → engCoder 池，其余（explore / plan / coder / sub）→ other 池。运行中计数按域分别记；队列补位按域腾槽。**跨域总量 8、同域仍 4**。
- **配置键**：`agent.poolLimits = { engCoder, other, advisor }`——subagent 两键运行期读 + 校验（正整数 ≥1，非法回退默认 4 / 4）；advisor 第三键由独立读取器消费（合法 ≥1 整数生效；非法 / 缺省回退 4）。变更下回合生效。配置面条目 = `docs/core/design/CONFIG.md` §6.1（本档不复制）。
- **async advisor（独立后台评审池）**：池 = `_asyncAdvisors`（复用 pending / digest / 注入 / 冻结机制；runner 包装 `runAdvisorReview`，不碰 subagent 管线）；容量默认 4——**超限语义（2026-09-16 批 8 修订）**：**异 scope** 发起 ⇒ **入队**（ack 含 `queued` + `position`，非 error——原「超限即拒、排队无意义」**撤**），槽释放按队首自动起跑；
  **同 scope** ⇒ 仍拒（依赖语义——文案含 scope 与指引）。队列复用子代理域既有排队语义（位置号 · 槽空起跑 · 取消出队 + 余位重编号），**不新造第二套队列**；`agent.poolLimits.advisor` 容量语义与默认值不变。
- **同 scope 并发守卫**：launch 判定两关独立——① 池容量（全局 running ≤ 生效上限）；② 同 scope（同 `reviewType` + scope 有 running 评审 → 拒；design scope = 文档集键 `docSetKey`；code = 单 `code` 线程 `openCodeRun`）。拒文案含 scope 语义与指引；`settled` 续跑语义不变。
  **排队交互（2026-09-16 批 8）**：守卫在**入队时**判定（同 scope ⇒ 拒；异 scope + 池满 ⇒ 入队）；**出队时复检**——若届时同 scope 已有 running 评审则**不启动、留队**（「同 scope 不并发」不变式保持）。**否决**「只在入队时判」——会让同 scope 的评审并跑。
- **排队面补充（2026-09-16 批 8 ED-4）**：① **队列上限 / TTL = 不新设**——沿用子代理域既有排队语义（取消 = 出队即释放）；
   ② **补位覆盖评审池**：settle / cancel 释放槽后按**队首**自动起跑——原补位循环「显式豁免 advisor」句**废**（`async-settle.mjs`；consult 面不变）；
   **终态守卫**同 §6.9 单点谓词（不启动已取消 / 已终态条目——评审队列补位同判）；
   ③ **取消 = 出队**：queued 评审取消 ⇒ 出队 + 余位 `position` 重编号 + 终态 cancelled（**无 abort / 无 controller**——从未 start）——详见 §6.11。
   ④ **队列载体**：`_asyncAdvisorQueue` 属**载体字段集**（`docs/core/design/AGENT-LOOP.md` §2.3——与 `_asyncQueue` 同列；VSC 形挂 depth-0 `history`）——
   出队 / 补位 / 排队刷新三个读面经**载体吸收**（`carrierField`）命中同一容器，**部分 parent（只携池 + `history`）下不得 no-op**（2026-09-17 af 批：VSC 合成 parent 下 dequeue no-op ⇒ 已取消评审被补位重启——台账 #21）。
- **工具语义**：advisor 加 `async: true`；**缺省 async**——仅 depth-0（depth>0 显式 async 拒 / 缺省恒同步）。发起返回 ack → 回合自然收尾 → 挂起态 → settle → digest。
- **UI 通道**：subagent 面板 + `role="advisor"` 伪角色（块 / ⏹ / 冻结全复用）；cancel = 定向 abort → cancelled settle（不入 pending、不入 token 槽、digest 提示「评审已取消——token 未签发」）。
- **settle 记账**：评审 settle 时（消化链首行注入前）——① **陈旧判定**（launch 后发生 `FILE_MUTATORS` ⇒ 基于旧状态 ⇒ 不置 `_calledAdvisorThisRun`、代码评审不签发 token，guard 仍推回发起新评审）；② 通过 → token 入槽 `_engDesignTokens` + 当场同步落盘权威台账；③ `_advisorRound` 改按 review 实例记（轮次仅作提示词衰减与显示——**无机械上限**）；④ guard 推回判定看后台评审是否已 settle 且非陈旧。
- **收敛状态 per-review 化**：`_advisorRuns: Map<reviewId, { round, priorOutput, stale }>`——`reviewId` = `designId`（设计评审）/ 随机 id（代码复核）；多评审并行隔离。
- **消化处置轮**：报告注入 → 模型消化（呈递发现 + 修复建议——不擅自动手）→ 用户逐项拍板 → 修正轮在 agent 回合内发起 round2（async 再启——round / prior 从 `_advisorRuns` 取）。
- **凭证机制**（designId / token：设计锚 / 同步 / 回显 / 登记 / 消费 / 校验）→ 属工程模式板，见 `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md`（结算面）· `docs/core/design/ENG-TOKEN-BINDING.md`（生命周期 + 写权门禁）。

**受影响文件清单（R24a · 批 8 ED-4）**：

| 文件 | 当前行数 | 预计增量 | 说明 |
|---|---|---|---|
| `thincoder-core/agent-tools/advisor-async.mjs` | 357 | +22/−6 | `:15-28` 头注改句 + `:265-267` 池满分支 → 入队（返回 `queued` + `position`）；同 scope 分支**不动**；`cancelAsyncAdvisor:209-224` 排队条目取消分支（无 controller ⇒ 出队 helper + 余位重编号）——≈+4 |
| `thincoder-core/agent-tools/async-settle.mjs` | 280 | +2/−2 | `:274-278` 补位豁免面收窄（advisor 纳入补位；consult 保持豁免） |
| `thincoder-core/agent-tools/async-discard.mjs` | 139 | +6 | 排队条目取消 = 出队 + 余项位置重编号 |
| `thincoder-core/agent-tools/subagent-scheduler.mjs` | 398 | 0 | **复用**既有导出面（入队 / 位置重算 / 补位 / 排队块刷新）——不新造第二套队列 |
| `thincoder-core/test/advisor-pool-queue.test.mjs` | 新档 | +90 | 判据 1–5 用例宿主 |
| `thincoder-cli/test/config-pool.test.mjs` | 159 | ±15 | 池满两处断言改排队（`:70-83` / `:85-96`——异 scope 第 5 发 ⇒ 断 `queued` + `position`） |
| `thincoder-vscode/test/config-pool.test.mjs` | 201 | ±15 | 同族两处（`:90-97` / `:99-105`） |

> 行数口径与值 = 批次档 §2.4 表**逐字一致**（as-of 2026-09-16）；越软线拆分面（`subagent-scheduler.mjs` 398）已在 §6.20.4 登记，不重复。

## 6.11 后台评审池可观测 / 可控（接入面补全）

1. **状态通道**：`subagent status` 读**两池并集**——子代理池 + 评审池（`getAsyncPool(agent, "advisor")`）；单查（带 id）先子代理池、未命中落评审池
   （两池共用 `nextSubagentId` 命名空间——id 全局唯一）；概览 `running` 行含 `role` / `model` / `elapsedSec` / `turn` / `maxTurns`（子代理）
   或 `reviewType` / `round` / `elapsedSec`（评审）；`done` 行带「已 settle 未消化」注记（走自动送达通道）；未命中两池 → 既有错误文案不变。
2. **等待口径**：`wait_for "advisor settled"` 判据 = **评审池无 running / queued 条目**（双载体：`agent._asyncAdvisors` ∪ `history._asyncAdvisors`）——与「未决评审判定」同源（`advisorReviewPending` / `advisorReviewInFlight`）；条件字面 / 超时 / 间隔语义零变。
3. **取消路由**：`subagent cancel <id>` 在子代理池未命中时**落评审池**——命中 running 评审 → `entry.cancelled = true` + `controller.abort()` + 机读线提醒（「评审已取消——token 未签发」）+ 幂等（重复取消返回同一确认）；
   命中 **queued** 评审 → **出队 + 余位 `position` 重编号** + 终态 cancelled（**无 abort / 无 controller**——从未 start；`wasStatus` 记 `queued`）+ 同款机读线提醒 + 幂等；未命中两池 / 已完成 → 既有错误文案。取消语义同 §6.10（不入 pending、不入 token 槽）。
   **队列取消收尾七面（2026-09-17 af 批逐轮收正——设计轮四〔机读线提醒 / 块面事件 / 不经 settle / 幂等与池面〕+ fix 轮二〔日志面 / 工具路径收口〕+ 二轮 fix 一〔端侧路径收口〕；原句只写「同款机读线提醒」，余面未逐字定）**：
   - **机读线提醒（逐字）**：与 running 面**同一条** `pushReal` 文案（模板源 = `thincoder-core/agent-tools/async-settle.mjs` cancelled 分支）——
     `[System reminder: async advisor review #<id> cancelled — the review did not settle; token not issued (评审已取消——token 未签发)]`；**不新造队列专用文案**（「同款」= 逐字同一条）。
   - **块面事件（逐字）**：出队即发 `⟦ev⟧cancelled`（零字段；relay 前缀 = `advisor#<id>/`）——TUI 侧「取消 / 出队 → 移除块（不冻结）」条文（`docs/cli/design/TUI.md` §6.8.2）的发射源；**不发 `⟦ev⟧stopped`**。
     **发射单源化（2026-09-18 设计评审轮 1 #1 裁定）**：queued 取消的 `⟦ev⟧cancelled` **唯一发射点 = 核 `cancelAsyncAdvisor` queued 分支**（`thincoder-core/agent-tools/advisor-async.mjs`）——
     该分支同时承担**机读线提醒（`pushReal`）**与**块面事件发射**两面（本节两队列表述同址同源）；发射经**调用方传入的 `onToken` 通道**（接口 = 可选第三形参 `cancelAsyncAdvisor(agent, id, onToken)`，缺省不就绪则不发射）。
     **全链三条调用路各传本层通道、均不另发**：工具路径（`executeCancelAction` 落池分支 · `ctx.callbacks?.onToken`）· CLI mouse ⏹ 直连（`thincoder-cli/src/tui/mouse.mjs` · 本地 `emit` = `routeSubToken` 就地路由）· VSC ⏹（经 `executeCancelAction` → `relaySubagentEventToken` 中继）——同一取消事件全链恰发射一次。
   - **不经 settle**：queued 取消**不走** `settleAsyncEntry`（从未 start ⇒ 无 run 链）⇒ 无 cancelled settle 分支、无 `⟦ev⟧stopped`（该冻结通道只属 running 取消）。
     ⇒ 任何「queued 取消会发 `⟦ev⟧stopped`」的推断**不成立**（台账 #31 第二跳——af 批探针实证：token 流仅 `⟦ev⟧cancelled`）。
   - **幂等与池面**：重复取消返回同一确认；出池 `map.delete(String(id))` + `cancelled` 墓碑（`writeTombstone`——载体吸收单点）与 running 面同形。
     **幂等面补注（2026-09-18 af 批 fix 轮 2 · 实施轮开口项 1 / 4 / 6 父侧裁定——三句定格，不新增面）**：
     ① **确认形状（逐字）**：首发（queued 命中出队返）= `{id, status:"cancelled", was:"queued"}`（`thincoder-core/agent-tools/advisor-async.mjs:255`）；重复取消（池未命中 → 读 cancelled 墓碑）= `{id, status:"cancelled"}`（**无 `was`**）——墓碑形状 `{status, role}` 单源不改，端侧 `was` 由中继合成（`thincoder-vscode/src/extension/panel-callbacks.mjs`）。
     ② **确认面外延（父侧裁定 = 接受并登记）**：墓碑读取**无面别**（判据 `tomb?.status === "cancelled" && tomb.role === "advisor"`——`thincoder-core/agent-tools/advisor-async.mjs:229`；
     两取消面同形写入——`thincoder-core/agent-tools/async-settle.mjs:229` / `thincoder-core/agent-tools/advisor-async.mjs:246`）⇒ **曾 running 取消、已 settle 出池**的 id 重复取消亦答同一确认（原 unknown-id error）。
     **不扩墓碑形状**（加面别字段破单源形状、成本更高）；早退在全部写点之前 ⇒ 零重复注入 / 发射 / 日志，副作用面零。
     ③ **跨 run 墓碑无区隔（登记）**：`_asyncTombstones` 随 VSC 载体跨 run 存活（`thincoder-vscode/src/agent.mjs:41`），而取号计数器 `_subAgentCounter` 不在载体字段集（取号 = `max(counter ?? 0, 活池 max) + 1`——`thincoder-core/agent-tools/subagent-scheduler.mjs:404-414`，两池皆空即从头取号）⇒ 旧 run 的 cancelled 号可在本 run 被重取（编号空间无跨 run 隔离）。
     于是本 run 池未命中时，陈旧 ⏹ / cancel 命中旧 run 墓碑 ⇒ 答 `cancelled`（零状态变更——非 unknown-id error）：**已知面、低影响——本批不修**（编号空间跨 run 隔离 = 另议）。
   - **日志面（2026-09-17 af 批 · F-6——逐字）**：queued 取消**不经 settle** ⇒ 不经 `settleAsyncEntry` cancelled 分支的 `ev:cancelled` ⇒ 出队点**直记一条**
     `logEvent("ev:cancelled", { id: "advisor#<id>" })`（与 running 面经 settle 记的事件名 / 字段同形；口径 = `docs/core/design/LOGGING.md` §6.2）。
     子代理族 queued 取消（`cancelAsyncSubagent`）同款直记（`id = "<role>#<id>"`）——两族写点各自一处，VSC 端同引核单点（零端差）。
   - **工具路径收口（2026-09-17 af 批 · F-3②）**：`executeCancelAction` 的 advisor 落池分支（`thincoder-core/agent-tools/subagent-async.mjs`）**不得早退跳过 TUI 维护**——
     queued 命中时把 `ctx.callbacks?.onToken` 传进核 queued 分支（**发射由该单点完成，本路径不另发**）+ 调 `refreshAdvisorQueuedTokens`（余位重编号刷新）；
     **不补位**（槽从未被占——§6.10 排队面补充 ③）、**不发** `⟦ev⟧stopped`。
   - **CLI mouse 直连路径（2026-09-18 评审轮 1 #1 实读定性——去重）**：`thincoder-cli/src/tui/mouse.mjs` 的 ⏹ 路由对评审族**直调** `cancelAsyncAdvisor`（不经 `executeCancelAction`），且在 `was === "queued"` 分支**自持发射** `⟦ev⟧cancelled`（as-of 2026-09-18 实读）。
     按单源化裁定**去重**：`emit` 上移并作为通道传进核调用（核调用形 = `cancelAsyncAdvisor(agent, id, emit)`）；自持发射行**加 `!isAdvisorBlock` 守卫**（共享行保留——子代理族自持发射面零改：该族两路互斥、各发一次；评审族由核单点经该通道发射，同一事件不重复发）；两路同通道同式（通道注入面 = mouse `emit` / 工具路径 `ctx.callbacks.onToken`）。
     running 命中不需要收尾（settle cancelled 分支 + 公共尾部补位已覆盖）。
   - **端侧路径收口（2026-09-17 af 批二轮 fix · F-11——VSC 对位形）**：VSC 扩展的 ⏹ 路由（`thincoder-vscode/src/extension/panel-messages.mjs` `cancelSubagent`）**不得按 role 分专用分支**——
     advisor 目标与子代理族**同经** `executeCancelAction`（合成 parent 携双池 + `history` + `_asyncQueue` + `config` / `autoApprove`；`callbacks.onToken` = `relaySubagentEventToken` 中继）。
     advisor **queued** 命中时：`⟦ev⟧cancelled` **经核单点发射**（relay 前缀 `advisor#<id>/`）→ `relaySubagentEventToken` 中继转 webview `subagent` `cancelled(was:"queued")` 协议消息（等待头移除）+ `refreshAdvisorQueuedTokens`（余位重编号）+ **不补位** + **不发** `⟦ev⟧stopped`；
     `was` 生产点 = **中继合成**（`thincoder-vscode/src/extension/panel-callbacks.mjs` 面 `relaySubagentEventToken`：`⟦ev⟧cancelled` → `cancelled` 协议消息；核 ack 的 `was` 字段不回传端侧）——中继档结构不变、本批零改。
     running 命中 ⇒ settle cancelled 分支的 `⟦ev⟧stopped` 同经中继（webview 评审块定格）——现形端侧**无 callbacks** ⇒ 两种命中皆零中继。
     **现形缺陷（`panel-messages.mjs:216-223`）**：advisor 分支**直调** `cancelAsyncAdvisor(...)` 后 `break`（无 callbacks / 无刷新）⇒ webview 评审等待头悬留（= F-3① 的端侧对位形）；该形**不得保留**（修法 = 删专用分支、并入共用路径——取消收尾单源）。
     端侧协议面登记 = `docs/vsc/design/WEBVIEW-PROTOCOL.md` §3 `cancelSubagent` 行（只登记端侧形态与回指，不重述机制）。
4. **动作面指引**：`observe` / `send` 遇 advisor id → 明确指引（指向 `action:'status'` 或提醒结果自动送达）；两动作**不为 advisor 开新能力**。
5. **工具描述**：`subagent` 工具描述 status / cancel 句补「后台评审（advisor）同面可查 / 可取消」（两端各自原文自持——语义同源）。

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

## 6.18 评审对象锚（并入 · 2026-09-15）

> 来源 = `thincoder-cli/docs/design/AGENT-LOOP.md` 旧 §12.1（一字未改，留参照历史）；本档 = 该面的活档承接（父侧调用面契约）。

评审调用注入**机械生成的对象声明**——消除评审员推断「评谁 / 为什么评」的纠结。父侧调用传 `object` 参数（`{type, target, status, reason, exclude}`——tool 参数为 JSON）→ 在评审 user 消息机械注入对象声明块——**每轮（round1 fresh + round2+ 复评）都注入**。定序：对象声明块 → 评审内容。

**对象声明块格式（逐字定稿——英文）**：

```
## Review-object declaration (mechanical — do not infer)
Review type: {type} | Target: {target} | Object state: {status} | Trigger: {reason}
Excluded (not in this review): {exclude}
Follow this declaration — do not infer the review target from the documents.
```

无 `object` 参数 → 降级现状（不注入不崩——旧调用兼容）。

**现状坐标（as-of 2026-09-15 实核）**：块生成 = `thincoder-core/advisor/messages.mjs:33` · 注入定序 = 同档 `:96`；round 2+ 定锚 = `thincoder-core/advisor.mjs:164`；tool 参数面 = `thincoder-core/agent-tools/advisor.mjs:71` / `:96`。

## 6.19 判定铁律（R1–R7）（并入 · 2026-09-15）

> 来源 = `thincoder-cli/docs/design/AGENT-LOOP.md` 旧 §12.2（一字未改，留参照历史）。**与 `docs/core/design/ADVISOR-CONVERGENCE.md` 正交**（该档管轮次衰减 / 收敛上限；本条管严重级怎么定）；冲突时以该档轮次表为准。
> 铁律块注入全部 4 模板（advisor-design / round1 / round2 / round3）——辅助判定不改变语义。来源标注（诚实——不假装权威）：「verified judgments, NOT absolute — continuously re-reviewed」（英文单向定稿——4 模板同句）。来源 = 样本 7 轮观察固化——持续复核。提示词正本 = `docs/core/design/prompts/advisor-*.md`。

**D-10.1 R1-R7 判定铁律（逐字定稿——中文稿；提示词层英文定稿）**：

- R1 文档状态/内容不一致（非机制描述冲突——区别于 Document ownership 维度）→ 🟡（报出即修——父侧文档层——不是🔴；**例外：同一机制两处不同描述 = Document ownership 🔴**——维持 advisor-design.md 约定——不降级）
- R2 实现偏离设计（验收未达/静默简化）→ 🔴（必须修）
- R3 裁定（挂债——如文件尺寸）→ 🟡/🔵 不升级（不重复纠结）
- R4 测试脆弱（墙钟/依赖序列化形态）→ 🔵 + 建议改确定性
- R5 范围协调（父侧待办）→ 🟡 "协调项"（不报缺陷）
- R6 测试缝——测试需 mock 内部工具集/慢工具——工具集由循环内硬编码获取（不可注入）→ 不要试 真实慢工具/FIFO/大文件（不确定）/观察 onTool（不足以区分）/mock LLM 返回真实工具（太快）——唯一路径 = 加测试 seam（setter 或参数 override + `??` 默认兜底——默认 null 生产零变化——测试 finally 恢复）——两端同法
- R7a 文档状态矛盾/跨文件滞后 → 🟡 报出不改（评审只读；机制级矛盾除外——见 R1 例外 =🔴）
- R7b 内容矛盾 → 设计层(D) > 需求层(F) > 记录(TODO)——较高层为准
- R7c 数字漂移/TODO 未勾销/文档卫生 → 🔵
- R7d 语义悬空 → 🟡 报设计缺口（父侧补）
- R7e 从不因文档状态矛盾卡"通过"——矛盾=🟡 报出即过（**机制级描述不一致除外 =🔴**——必须处理后才可过）
- R7f 引用清扫/旧名残留/文档卫生只约束活体文案（`docs/` 生效档 + 根级生效文档）；`_archive/` 历史快照不在判定面
- 来源：样本 7 轮——已验证判定——持续复核

## 6.20 CLI 侧中止丢弃对称（子代理 / 评审池）（2026-09-15 · 批 4 CLI-ASYNC-DISCARD）

> 需求侧 = `docs/core/requirements/AGENT-LOOP.md` §4.10；条目 F1–F4 / N1–N3 与批次档 `docs/batches/2026-09-15-cli-async-discard.md` §2 **三方一致**。
> 对侧基准 = `thincoder-vscode/src/agent-tools/async-discard.mjs`（126 行，第 35 批 §12 + §15 建）——本批**不改对侧**（D-AD7 另案登记）。

### 6.20.1 问题陈述与现状坐标（as-of 2026-09-15 实核）

CLI 侧中止分支**静默清池**：被清出的条目不留终态、无提醒、无事件——**丢弃墓碑状态与丢弃提醒文案**在 `thincoder-core/**` + `thincoder-cli/**` 全仓零命中（该词在核内另有 4 处出现，均为其他语义——`thincoder-core/agent.mjs:398` / `thincoder-core/tools/bash.mjs:158` / `thincoder-core/memory/code-sync.mjs:158` / `thincoder-core/prompts/discipline-normal.md:169`；
  CLI `src/**` 零出现、设计档另有 2 处同词（`thincoder-cli/docs/design/AGENT-LOOP.md:100` / `thincoder-cli/docs/design/TUI-TOOL-OUTPUT.md:43`，同属其他语义）——**评审轮 1 #8 收窄**）⇒ 模型只能猜「后台报告到底到没到」。

| 站点 | 坐标 | 现状 |
|---|---|---|
| 回合尾中止 | `thincoder-core/agent/run-stages.mjs:168-170` | `subPool?.clear(); advPool?.clear(); agent._asyncQueue = []` |
| 挂起会话中止 | `thincoder-cli/src/tui/suspension-drive.mjs:258-262` | 同上三行 |
| 挂起收尾（**不接线**） | `thincoder-core/agent/suspension.mjs:97-101` | `carrier._asyncSubagents?.clear(); _asyncAdvisors?.clear()` |

**第二处缺口（C-6 依赖终态判据）**：`thincoder-core/agent-tools/subagent-scheduler.mjs:124` 的 `depInfo` 以 `t.status === "cancelled" || t.status === "failed" ? t.status : "ok"` 判墓碑——**非 cancel/failed 的墓碑一律判 `ok`**。CLI 侧今日无 `discarded` 墓碑（该句 = 死分支）；本批落地后立即成为活路径 ⇒ 被丢弃的依赖目标被判「报告已到达」、依赖者照常启动（错误行为）。父侧 U1 裁：同批收口。

**收尾站③不接线的判据（父侧 U2 裁：接受）**：`finishSuspension`（`thincoder-core/agent/suspension.mjs:97-101`）是
`waitForSettleOrWake` 驱动的挂起会话收尾（`:208-220`），其形为 **carrier 形**（`_asyncSubagents` 挂在 carrier 上）——
该路径**无父 agent 注入目标**（无 `pushReal` 宿主 agent）——aborted 分支（`:98-107`）无任何注入通道（宿主注入器 `injectResidual` 仅非 aborted 分支消费，`:108-111`）；在此接线会把提醒写进 carrier 历史 = 语义扩张。
⇒ 登记为**已知残留**：该处仍为静默清池；若要对称须先定 carrier 注入目标（另批）。

**已知残留（consult 族）**：两接线点对 consult 族仍 `cleanupConsultSessions` 静默清场（无墓碑、无提醒——与对侧同形，边界 §6.20.8-4）；需求面（§4.10 F1–F4）只覆盖子代理 / 评审两池 ⇒ 本条不扩面；如需对称须先定 consult 的终态与提醒语义（另批——**评审轮 1 #7**）。

**族归属（escalate）**：两接线点按池作用（`getAsyncPool` 对 role ∉ {advisor, consult} 一律返 `_asyncSubagents`——`thincoder-core/agent-tools/async-settle.mjs:106`）⇒ escalate 族条目同被判丢弃、写 `discarded` 墓碑，并进入「background subagent(s) … re-spawn if the work is still needed」措辞的名单（`escalate#N`）——**与对侧同形（非端差）**。
措辞面留后者：该族属后台子代理语义，提醒文案如实承载；`docs/core/design/ESCALATE.md:86`「aborted → 出池丢弃」句只言出池、未言提醒 ⇒ 无互斥，随该档下次改动校准（档外，父侧判——**评审轮 3 #5 / 轮次 4 #5 / 实施轮落地**）。

### 6.20.2 方案选型对比

| # | 轴 | 候选方案 | 判据逐项评估 | 取舍（选定代价 / 权衡） | 结论（选定 / 否决理由） |
|---|---|---|---|---|---|
| 1 | 落点 | 新建 `thincoder-core/agent-tools/async-discard.mjs` | 职责内聚（丢弃 ≠ 结算）；核内单源、双壳可 import；形态与对侧同构（对侧已把守卫 / 池 accessor / 墓碑写点改指核单源，`thincoder-vscode/src/agent-tools/async-discard.mjs:32`） | 多一档（+~130 行） | **选定** |
| 2 | 落点 | 并入 `thincoder-core/agent-tools/async-settle.mjs` | 墓碑三函数已在该档；但该档 = 结算路径（279 行），并入 = 两职责混档 + ~400 行（越 300 软线） | 责任混淆 + 越软线 | 否决 |
| 3 | 落点 | CLI 侧直接 import 对侧实现 | 零新代码 | **依赖方向倒置**（核 / CLI 壳不得依赖 VSC 壳档；对侧档另 import VSC 私有 `../agent/run-helpers.mjs:33`） | 否决 |
| 4 | 依赖终态取值 | `discarded` 墓碑 → 既有 `cancelled` 口径 | 与「用户取消」同义（报告不会到达 + 非失败）：非 AUTO 依赖者 ⇒ depc（锁住等父处置，`subagent-scheduler.mjs:140-143`）、AUTO ⇒ 可启动（`:141`）；零新枚举、零消费者改动 | 墓碑 `status`（`discarded`）与 `depInfo.state`（`cancelled`）名不同形——须显式登记映射（D-AD2） | **选定** |
| 5 | 依赖终态取值 | 新增 `"discarded"` 状态值 | 名实相符 | 枚举扩散：`describeBlockers` / `detectStall`（`:205-212`）/ spawn 返形 / status 行 / 对侧用例全需同步 = 把「零新语义」变成新语义 | 否决 |
| 6 | 提醒注入点 | 核单点 `pushReal(parent, {role:"user", ...})` | 核内既有先例 = 取消提醒三处（`async-settle.mjs:231/236/246`，均 user 注入）；写两条线（机器线 + 人读线） | 与对侧现写法（`thincoder-vscode/src/agent-tools/async-discard.mjs:83` 直 `parent.history.push`）形不同、语义同——登记端差 D-AD8a | **选定** |
| 7 | 提醒注入点 | 逐字照对侧 `parent.history.push(...)` | 与对侧逐字同形 | 核内**绕过 `pushReal` 单点** ⇒ 人读线（`thincoder-core/context.mjs:184-194`）缺该条，与核内取消提醒先例不一致 | 否决 |
| 8 | 队列载体 `_asyncQueue` | 模块内剔除被丢弃 id + 存活条目 `position` 按 `1..n` 重编号（接线点原 `= []` 行删除；取消路径 `subagent-async.mjs:190` 同式） | 队列与池同源（`subagent-run.mjs:186` push 同一 entry 对象）；存活条目仍占池位 ⇒ 无差别清空抹掉其位置记录 | 模块新增一处写面（对侧无此形——核侧特有） | **选定** |
| 9 | 队列载体 | 保留原 `agent._asyncQueue = []` | 零改动 | 存活条目留池却丢队列位 ⇒ 池 / 队列不一致（面板与 status 的 queue position 面） | 否决 |

### 6.20.3 接口契约

**新档** `thincoder-core/agent-tools/async-discard.mjs`（预计 ~130 行；双导出 + 私有共享核，与对侧同构）：

- `discardAbortedPool(parent, ctx = null)` → `{ discarded: Array<{id, role, wasStatus: "running"|"queued"}>, kept: number }`
- `discardAbortedAdvisors(parent, ctx = null)` → `{ discarded: Array<{id, role: "advisor", reviewType, wasStatus: "running"|"queued"}>, kept: number }`
  （`"queued"` 面随 2026-09-16 批 8 ED-4——评审池排队语义引入；排队条目无 controller，丢弃判定 / 出队逻辑实现轮补）
- 私有 `discardRole(parent, spec, ctx)`：族差异（池键 / 摘要 / 列表词 / 文案 / 角色名）经 spec 注入。

**判定单点**（零新谓词）：`discardable(entry, ctx) = entry.done !== true ∧ entry.cancelled !== true ∧ parentAborted(ctx ?? {}, entry)`
——`parentAborted` 复用核单点（`thincoder-core/agent-tools/async-settle.mjs:130-134`，interrupt 豁免内建）。
**本批两接线点均不传 `ctx`** ⇒ 判据 = controller 支（`parentAborted(null, entry)`——与对侧有效判据同判：对侧 ctx 为死参，实走同一 controller 支；**消差收窄，理由见 D-AD6——评审轮 1 #3 / #4**）。
「controller 已中止 = 条目真死」由 `bindChildController` 单点保证（`:88-98` 双路：基信号已中止 ⇒ 立即 abort；未来中止 ⇒ 带活监听逐链传播；interrupt 不逐链）——两接线点的条目 controller 在各自中止触发时已被逐链中止。
`ctx` 保留为签名备用面（直调用例 / 对侧收敛时调用形合法）。

**动作序**：每条目 = `writeTombstone(parent, entry.id, "discarded", roleOf(entry))`（**载体吸收单点** = `async-settle.mjs:67-72`——父对象无自有 `_asyncTombstones` 而 `history` 有 ⇒ 借用同一 Map，不另建分叉）。
**禁用** `writeTombstoneTo(parent.history ?? parent, …)` 形——CLI 载体形（字段挂 agent）下会与读取面 `tombstoneOf`（`:75-78`，父对象优先）分叉、F4 的 `depInfo` 读不到（**评审轮 1 #1**）→ 出池（`map.delete(String(id))`）+ 队列剔除（存活条目 `position` 重编号——与取消路径 `subagent-async.mjs:190` 同式）→ 汇总；
整批（`discarded.length > 0` 才发生）= **一次** `pushReal(parent, { role: "user", content: reminder })` + **一条** `logEvent("ev:discarded", { n, ids })`；`n === 0` ⇒ 零注入、零事件（零噪音）。

**文案模板（verbatim 同源**，逐字源 = `thincoder-vscode/src/agent-tools/async-discard.mjs:37-44`；列表词 `:47`；族 spec `:90-105`；测试断关键子串不逐行断）：

```
[System reminder: ${n} background subagent(s) were discarded by the user's Stop — their reports will NOT arrive: ${list}. Partial changes from discarded children stay unmerged/unaudited; re-spawn if the work is still needed.]
[System reminder: ${n} background advisor review(s) were discarded by the user's Stop — their reports will NOT arrive: ${list}.\nNo design token was issued for a discarded design review; launch the review again if it is still needed.]
```

列表词：`queued` → `" (was queued — never started)"`；其余 → `" (was running)"`；评审族带 `(${reviewType})`。

**端差登记（本批三处：a / b 语义同源、可观察输出等价；c = 覆盖差异——登记 + 收敛方向）**：

- **D-AD8a 注入通道**：核 = `pushReal`（`thincoder-core/context.mjs:184-194`，写机器线 + 人读线），对侧 = 直 `parent.history.push`（`thincoder-vscode/src/agent-tools/async-discard.mjs:83`）。模型可见输出等价；核侧多写人读线（与 `async-settle.mjs:231` 先例同口径）。
- **D-AD8b 转义范围**：核 = 仅转义插值（沿 `async-settle.mjs:233/248` 先例；`escapeXml` 源 = `thincoder-core/agent/helpers.mjs:89`），对侧 = 整条文本转义（`thincoder-vscode/src/agent-tools/async-discard.mjs:83`）。文本骨架无 XML 特殊字符 ⇒ 输出等价。
- **D-AD8c status 回显面（评审轮 1 #5）**：对侧丢弃 id 经 `subagent status` 回显 `discarded`（`thincoder-vscode/src/agent/setup.mjs:226-227` 墓碑回读；对侧用例 T-D8 `thincoder-vscode/test/async-parity.test.mjs:293` · T-D13 `:436`）；
  CLI 侧除 `depInfo`（`thincoder-core/agent-tools/subagent-scheduler.mjs:123`）外零墓碑读取调用点（grep 实核）⇒ 丢弃 id 在 CLI 状态面报 unknown。
  **取舍**：本批不触碰 `subagent-actions.mjs`（488 行，贴 500 硬限——§6.20.8-3）——丢弃事实由整批提醒承载（模型可见面不缺）；**收敛方向 = 后续批**（status 墓碑回显与 `subagent-actions.mjs` 拆分同案，或并入 D-AD7 对侧收敛案）。

**接线点①** `thincoder-core/agent/run-stages.mjs:168-170`：三行（`subPool?.clear(); advPool?.clear(); agent._asyncQueue = []`）
→ `discardAbortedPool(agent)` + `discardAbortedAdvisors(agent)`（**不传 ctx**——判据 = controller 支，D-AD6；队列剔除由模块接管）。
`ev:stopped` 日志（`:166`）与 `cleanupConsultSessions` / pending 过滤（`:171-176`）**不变**。

**接线点②** `thincoder-cli/src/tui/suspension-drive.mjs:258-262`：`:260-262` 三行（同上）→
`discardAbortedPool(agent)` + `discardAbortedAdvisors(agent)`（**不传 ctx**；CLI 侧 import `@thincoder/core/agent-tools/async-discard.mjs`）。
`:248` 判据行（`aborted` 的 `_sessionAbort` 读取点**在** `:253` 置 null **之前**——既有写法已安全）与 `:252-254` 句柄释放**不变**；
会话 / 同回合子代的 controller 在 Stop 触发时已被逐链中止（key-handler 先 abort 全部会话 controller——`thincoder-cli/src/tui/key-handler.mjs:83`——此后才走本 `finally`）⇒ controller 支足判。
pending 清容器（`:266`）与既有序（consult 清场 `:267-268`、pendingInput 转 `state.queue` `:273-276`）**不变**。

**判据收口（C-6）** `thincoder-core/agent-tools/subagent-scheduler.mjs:124`：现式三态判前置一行
`const st0 = t.status === "discarded" ? "cancelled" : t.status`（或等价展开），三态判沿用。
**登记**：墓碑 `status`（`discarded`——账簿真实）与 `depInfo.state`（`cancelled`——依赖者处置口径）**名不同形**——
代码注释 + 本节说明；依赖者文案（`dependency cancelled`，`async-settle.mjs:248`）与 `describeBlockers` / `detectStall` **零改动**。

**数据流**：中止 → 逐条判定（controller 支）→ 墓碑（`_asyncTombstones` 跨 run 终态账本）→ 出池 + 队列剔除（含 `position` 重编号）→ 存活条目留池（其报告沿自动通道到达）→ 整批一次提醒 → `ev:discarded`。
**⟦ev⟧queued 面板块头残差**（评审轮 1 #12）：`refreshQueuedTokens`（`thincoder-core/agent-tools/subagent-scheduler.mjs:332-345`）需 `onToken` 回调，两接线点无回调可传 ⇒ 块头序号随**下一次队列事件**自然重发（其 sig 含活队列序号——变化即重发）；本批登记为显示面残差（status / 面板读数取活队列索引，不受影响）。

### 6.20.4 受影响文件清单（R24a）

| 文件 | 当前行数 | 预计增量 | 落点 |
|---|---|---|---|
| `thincoder-core/agent-tools/async-discard.mjs` | —（新建） | **138（实测）** | 单点实现（双导出 + 私有共享核） |
| `thincoder-core/agent/run-stages.mjs` | 244 → **246（实测）** | +3 / −3（含 import 行——净 ≈0） | 接线点① |
| `thincoder-cli/src/tui/suspension-drive.mjs` | 299 → **301（实测——已越 300 软线）** | +3 / −3（含 import 行——净 ≈0） | 接线点②（拆分计划保留——见下） |
| `thincoder-core/agent-tools/subagent-scheduler.mjs` | 394 → **398（实测）** | +2 / −1 | F4（既有越软线在案） |
| `thincoder-core/test/async-discard.test.mjs` | —（新建） | **234（实测）** | 单点用例（U1–U8） |
| `thincoder-core/test/async-family.test.mjs` | 177 → **225（实测）** | +~10 | F4 用例（U9 / U9b） |
| `thincoder-cli/test/input-lock.test.mjs` | 204 → **267（实测）** | +~30 | 接线点② 桩驱动用例（U10） |
| `thincoder-cli/test/integration/subagent-lifecycle.test.mjs` | 167 → **228（实测）** | +~45 | 业务可观察集成用例（I1） |
| `docs/core/design/AGENT-LOOP-SUBAGENT.md`（本档） | — | — | §6.20 + 变更记录 |
| `docs/core/requirements/AGENT-LOOP.md` | — | — | §4.10 |
| `docs/batches/2026-09-15-cli-async-discard.md` | —（各段追加，不计入增量） | — | §2 / §3 已落；§4–§6 由各作者追加 |

> 行数口径 = **内容行数**（`wc -l` 同口径；读取工具把文件尾换行渲染为空尾行 ⇒ 同文件显示值可 +1——计法差异非漂移）。本表行数为 **as-of 落笔实测**；批次档 §2 同名表为**落地前估算**——本档 / 需求档两行的估算值已由本表实测值取代；批次档行 = 各段追加（不计入增量）；其余行为预计。

**拆分计划（超档项）**：

- `thincoder-cli/src/tui/suspension-drive.mjs`（**301——已越 300 软线**）：候选拆分面 = `finally` 收尾块（清场 + 计数日志，`:246-266`）抽 `suspension-teardown.mjs`。**本批只登记不执行**（搬迁 ≠ 本批范围——避免夹带）。
- `thincoder-core/agent-tools/subagent-scheduler.mjs`（398——实测）：候选拆分面 = 依赖与等待态派生族（`depInfo` / `describeBlockers` / `detectStall`）抽 `subagent-deps.mjs`。本批只登记。
- **未触碰**：`thincoder-core/agent-tools/subagent-actions.mjs`（488，贴 500 硬限）、`async-settle.mjs`（279）。

### 6.20.5 关键决策记录

| # | 决策 | 备选与否决理由 |
|---|---|---|
| D-AD1 | 核内新档承载（对侧 = 核单源 import 者） | §6.20.2 轴一候选 1；候选 2 混档 / 候选 3 依赖倒置 |
| D-AD2 | `discarded` 墓碑 → `depInfo` 归 `cancelled` | 零新枚举、处置等价；名不同形须登记（防误读为语义丢失） |
| D-AD3 | 注入走核 `pushReal` | 沿核内取消提醒先例；端差 D-AD8a 登记 |
| D-AD4 | `_asyncQueue` 由模块接管剔除 | 队列与池同源；无差别清空抹掉存活条目的位置记录 |
| D-AD5 | 收尾站③（`finishSuspension`）不接线；consult 族两接线点清场不扩面 | carrier 形无注入目标；consult 无墓碑 / 提醒（与对侧同形）——均登记为已知残留（§6.20.1） |
| D-AD6 | 判据口径 = controller 支，两接线点均不传 ctx（**收窄消差**——两端同判） | 候选 1（否决）：显式 ctx.signal 支——会把**存活**子代（跨回合 / 会话外基信号）当死条目丢弃（= 对侧注释所述孤儿形态）；候选 2（选定）：`parentAborted(null, entry)` ⇒ controller 支——「controller 中止」= 条目真死（`bindChildController:88-98` 双路），与对侧有效判据同判。`ctx` 保留为签名备用面 |
| D-AD7 | 对侧重复实现**本批不收敛** | 落地后同机制两实现（核新档 + `thincoder-vscode/src/agent-tools/async-discard.mjs`）⇒ 后续应收敛为核单源 + 对侧改 import；**本批 VSC 零写入**（父侧 U3 另案登记）。**登记为已知重复**，非静默 |
| D-AD8 | 与对侧端差登记（a 注入通道 / b 转义范围 / c status 回显面） | 见 §6.20.3；a·b 可观察输出等价；c = CLI 无 status 墓碑回显面（覆盖差异——提醒面已承载信息，收敛方向已登记） |

### 6.20.6 用例表（正常 / 边界 / 错误）

| # | 用例 | 输入 | 期望输出 | 回指 |
|---|---|---|---|---|
| U1 | 正常·子代理族只清已死 | 池 [running-aborted, queued-aborted, done, cancelled]（两 -aborted 条目 controller 已中止；直调不传 ctx = 接线口径） | `discarded` = 2（wasStatus 各 running / queued）· `kept` = 2 · 两条 `discarded` 墓碑 · 存活条目仍在池与 `_asyncQueue` | F1 F2 |
| U2 | 正常·评审族 | 池 [running-aborted(advisor, reviewType="design"), done] | `discarded` = 1（带 reviewType）· `kept` = 1 · 提醒含 `No design token was issued` | F2 F3 |
| U3 | 边界·零丢弃（零噪音） | 池全 done / 空池（无条目 controller 中止——接线口径不传 ctx） | `{discarded: [], kept: n}` · **零注入** · **零事件** | F2 |
| U4 | 边界·载体缺失 | 池字段不存在（`getAsyncPool` 返 null） | 空结果、不抛 | F1 |
| U5 | 边界·interrupt 豁免 | `ctx.signal.reason.interrupt === true`（直调） | 零丢弃（与 `parentAborted` 单点同判） | F1 |
| U6 | 边界·队列剔除精确 | `_asyncQueue` = [丢弃 id, 存活 id] | 仅丢弃 id 被剔除；存活条目 `position` 按 `1..n` 重编号（与取消路径 `subagent-async.mjs:190` 同式） | F1 D-AD4 |
| U7 | 错误·条目形态残缺 | 条目 `{}`（缺 controller / id）；前提 = ctx 未中止（直调——接线口径不传 ctx） | 保守判不丢弃、不抛 | F1 |
| U8 | 提醒形态 | n = 2 | 注入**一条** user 消息；列表含 `(was queued — never started)` 与 `(was running)` 两词 | F2 N1 |
| U9 | 依赖终态（C-6） | 依赖目标墓碑 `discarded`（**夹具次序前提**：先经 `writeTombstone` 落一条父形态既有墓碑，复现「载体自有墓碑 Map 已存在」——否则「丢弃先写」次序下写 / 读同落 history 老 Map、用例假绿——评审轮 1 #1） | `depInfo` ≠ `ok`（= `cancelled`）；非 AUTO 依赖者 depc / AUTO 可启动；`failed` / `cancelled` 墓碑行为不变 | F4 |
| U9b | 边界·生产者绑定（F1↔F4） | 夹具：父形态墓碑已在（`writeTombstone` 写）+ `history` 在场；走生产入口 `discardAbortedPool` | 丢弃墓碑由接线入口产出、与读取面同容器可读（`tombstoneOf` / `depInfo`） | F1 F4 |
| U10 | 接线点②·挂起中止（桩驱动） | 桩驱动 `suspensionSession`（`thincoder-cli/test/input-lock.test.mjs:17` import），池含在飞 / 排队 / done 条目；父回合中止 | 已死条目出池 + `discarded` 墓碑 + 两族各一条提醒 / `ev:discarded`；存活条目留池 | F3 N2 |
| I1 | 集成·真管线中止 | 真调度器 + 脚本化 provider：父回合中止（signal abort），池含在飞子代理 | 父历史获一条提醒（关键子串）+ 一条 `ev:discarded`；已死条目出池、存活条目仍能结算注入 | F2 N2 |

**落点**：U1–U8 → `thincoder-core/test/async-discard.test.mjs:84-233`（新建）；U9 / U9b → `thincoder-core/test/async-family.test.mjs:110` / `:135`（扩）；
U10（接线点② 桩驱动）→ `thincoder-cli/test/input-lock.test.mjs:212`（扩）；
I1 → `thincoder-cli/test/integration/subagent-lifecycle.test.mjs:182`（扩）。
**I1 若在中止时序上不可稳定驱动 ⇒ 降级为桩面 + 如实登记**，不静默省略。

**测试层寿命分类**：I1 = 集成资产（常驻）；U1–U10 = 单元（开发期工具——批次收口逐条判：默认退役，除业务可观察 + 集成未覆盖 + 可稳定驱动三者全满足）。**断言语义 = 行为面**（池内容 / 墓碑状态 / 注入 / 事件计数 / 依赖终态），不做文档散文锚（寿命分类 → `docs/core/requirements/TESTING.md` §2；行为面禁令本体 → 同档 §5.2 F19）。

### 6.20.7 验收标准（逐条回指）

| # | 验收标准（可机检） | 回指 |
|---|---|---|
| A1 | 中止时已死条目出池 + 墓碑 `status = "discarded"`（role 正确）；存活条目与 done-in-pool 留池 | F1 |
| A2 | 提醒**恰好一次**（user 注入，含丢弃数 + 名单）；`ev:discarded` **恰好一条**；零丢弃 ⇒ 二者皆无 | F2 |
| A3 | 接线点①② 生效（中止路径产出 A1 / A2 结果）；`thincoder-core/agent/suspension.mjs` 零改动 | F3 |
| A4 | `depInfo` 对 `discarded` 墓碑不再返 `ok`；非 AUTO 依赖者 depc、AUTO 可启动 | F4 |
| A5 | 文案 / 动作序 / 事件名与对侧同源；判据口径 = controller 支（与对侧同判——D-AD6）；端差清单已登记（D-AD8a·b·c）· 重复实现登记（D-AD7） | N1 |
| A6 | 用例表逐条有对应断言；核用例入口 = `thincoder-core` 下 `node --test`（CI 同式 `.github/workflows/test.yml:36-46`——CLI 三命令不覆盖核用例）；`lint` / `test:full` / `test:integration` 全绿 | N2 |
| A7 | 触碰源档 ≤500 硬限；越软线档在档内登记（含拆分计划） | N3 |

### 6.20.8 边界（本批不做）

1. VSC 侧零写入（`thincoder-vscode/**` 与 `thincoder-vscode/docs/**`）——对侧重复实现收敛（D-AD7）与装饰 / 悬空名退场 = 另案。
  **协调项**：对侧登记行 `thincoder-vscode/docs/design/AGENT-LOOP.md:751`（§12.8 #2——「CLI 面无丢弃提醒与丢弃终态记录 …（CLI 属他批/后续批）」）在本批落地后过时——该行更新归父侧另案（本批 VSC 零写入；§1 输入 #3 所载 `:740` 为旧坐标——评审轮 1 #6）。
2. 不接线收尾站③（`finishSuspension`）——判据见 §6.20.1（D-AD5）。
3. 不改 `subagent status` / 面板显示面，不新增 `discarded` 显示行（**端差与收敛方向 = D-AD8c**）；不触碰 `subagent-actions.mjs`（488 行）。
4. 不改 `_pendingAsyncResults` 停靠语义（done-in-pool 非丢弃目标——判据 `done !== true`）；不改 `cleanupConsultSessions` / consult 族清场。
5. 不改 cancel / failed 语义与文案；不新增枚举值；不改 `describeBlockers` / `detectStall`。
6. 不迁移搬档（拆分计划只登记不执行）。

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
> 但过千行已成事实 ⇒ **拆档建议登记**（子代理族 / 评审池族两分，另案，见批档 §2 发现表）。

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

## 6.27 子代理上行通道（子 → 父 在飞提问 / 上报）（2026-09-18 · 批 SUBAGENT-UPSTREAM-CHANNEL · 台账 #81）

**定位**：补上子代理通信的**第三象限**。既有两象限 = 父→子在飞（`send`，§6.7.2）+ 子→父**终态**（报告 → settle → digest，§6.8）；
本条目 = 子→父**在飞**——子代理在运行中向父（spawn 方）发一条决策级消息，**不中断自身回合**。

### 6.27.1 问题陈述与现状坐标（as-of 2026-09-18 实读）

**病**：子代理在飞命中「前提失效 / 方向冲突 / 授权边界」时只有一条出路——走到终态停下上报（`thincoder-core/prompts/common.md:40-45`）；
父在子代理运行期间**收不到任何在飞信号**。代价 = 该轮上下文作废 + 父重派新子代理 + 重新勘察
（当日两例：id=53 在**已作废前提**上建成整节 §10；id=49 命中「设计 1 档真读、实况 3 档」只能终态停报）。

**现状坐标（逐处实读）**：

| # | 面 | 坐标 | 实况 |
|---|---|---|---|
| S1 | 下行在飞（父→子） | `thincoder-core/agent-tools/subagent-actions.mjs:319-320`（push `entry._injected`）→ `thincoder-core/agent.mjs:214-218`（回合边界 `consumeInjected?.(agent)`）→ `thincoder-core/agent-tools/subagent-run.mjs:26-32`（`drainInjectedQueue` → `pushReal`） | ✅ 既有 |
| S2 | 上行终态（子→父） | `thincoder-core/agent-tools/async-settle.mjs:200-293`（settle）→ `thincoder-core/agent-tools/subagent-async.mjs:358-392`（`injectAsyncResult` → `pushReal`） | ✅ 既有 |
| S3 | 上行在飞（子→父） | —— | **缺**（本条目补位） |
| S4 | 子代理侧工具面 | `thincoder-core/agent/family-tools.mjs:139-165` | eng-coder `[advisor, verify, batch_segment, subagent(勘察)]` · eng-designer `[batch_segment, subagent(勘察)]` · coder `[verify, advisor]` · consult `[recent_changes]` · explore / plan `[]` |
| S5 | 子代理内 `question` | `thincoder-core/tools/question.mjs:20` | 无 `ctx.onQuestion` ⇒ **抛错**（子代理无交互 UI） |
| S6 | 父侧消费点 | `thincoder-core/agent.mjs:96`（`consumeInjected = null` 缺省） | depth-0 调用方**不传** ⇒ 父侧无「子→父在飞」消费点 |
| S7 | depth 门现状（§6.7.2） | `thincoder-core/agent-tools/subagent.mjs:179-181` · `subagent-actions.mjs:110-112` / `:241-243` / `:293-295` | 除 `spawn` 外全部动作 **depth-0 专有** |

### 6.27.2 四面裁定

**① 机制面**（子侧如何发声 · 父侧如何接收 · 与既有模型如何相容）

- **子侧载体 = 新工具 `notify_parent`**（单档 `thincoder-core/agent-tools/parent-channel.mjs`（拟新增）导出
  `parentChannelTool` / `pushChildUpstream` / `drainChildUpstream` / 三常量）。
  **否决**「`subagent` 工具新动作 `action:'notify'`」——① 须给 explore / plan 装 subagent 工具，破「非递归」结构防线；② 与 §6.7.2 / §6.25 的**单向 depth 门**相抵（新动作方向相反 ⇒ 判定表重构）；③ subagent 描述 140+ 行，子代变体已分叉（`family-tools.mjs:86-127`）。
- **装配面** = `assembleFamilyTools` 的 depth>0 段（`thincoder-core/agent/family-tools.mjs:139-169`）——形状 = **三元链 5 分支，其中 4 处携带 `parentChannelTool`**（as-of 2026-09-18 17:3x 实读）：
   `eng-coder`（`:166`）· `eng-designer`（`:167`）· `coder`（`:168`）· **兜底段 `: []`**（`:170`——今日落 explore / plan 及未列名 role）——**四者携带**（坐标 = **修正轮 1 收正**至现盘；原记 `:165` / `:166` / `:167` / `:169` 为逐行差 1 的陈旧读数）。
  ⇒ **携带点 = 4 处**；`consult` 分支（`:168`，`[recentChangesTool]`）**不入**。**未列名 depth>0 role 落同一兜底段 ⇒ 亦装配**（语义 =「depth>0 且非 consult 皆装配」；
  今日可达 role 集由 spawn 门收束 = 五角色 + consult——`family-tools.mjs:44-54` 两 enum 并集）。**consult 不装配**（其角色语义 = 父发起的一次性会诊，父在其 settle 前不期望中途对话——登记为范围边界）。
- **父侧接收 = 队列 `_childUpstream`**（数组；条目 `{seq, from, kind, message, ts}`）+ 单调计数 `_childUpstreamSeq`——**两字段皆属载体字段集**
  （`docs/core/design/AGENT-LOOP.md` §2.3——与 `_asyncQueue` / `_asyncAdvisorQueue` 同列；VSC 形挂 depth-0 `history`）：
  读 / 写同经单点 `upstreamHolder(parent)` = ① 父字段在场 ⇒ 父对象（CLI 形主容器）② 缺 ⇒ `carrierField` 回退 `history`（命中即用）③ 两者皆无 ⇒ **建在父字段 + 载体别名**
  （`parent.history._childUpstream = parent._childUpstream`——同 `writeTombstone` 借用规则扩张句的既有形态，`thincoder-core/agent-tools/async-settle.mjs:73-83`）。
  ▸ **VSC 形后果 = 已知面（F8）**：载体吸收只解决容器跨 run 存活；**端壳自接消费点 = 已并入（2026-09-19 批 · 设计面）**（循环头调核单源——`thincoder-vscode/src/agent.mjs:179` 邻位，§6.27.12.12；**实现待实现轮落地**）⇒ VSC 形与核形同判。
  **载体分离**：不进 `_asyncSubagents`（那是「父→子」的池条目）、不进 `_pendingAsyncResults`（那是终态报告容器）。
- **与既有 `send` 相容**：**回复路径复用 `send`**（零新下行管子）——本通道只增「子→父」一个方向。
- **与池 / 异步模型相容**：池 / 队列 / 补位 / settle / digest **零触碰**；`_childUpstream` 生命周期与子代理生命周期**解耦**（子代理 settle / cancel 不迁移它）。

**② 语义面**（非阻塞往返五步 + 无答复路径）

1. 子代理在回合 T 调 `notify_parent({kind, message})`；
2. 工具**立即返回**（`{status:"queued", kind, position, note}`）——同步 push 进父队列，**零 await、零等待态**；
   ▸ **本通道不提供任何「取回复」动作**——判据同 §6.7.5 `check` 删除（不造「异步拉起再等它」的路径）；
3. 子代理继续：**不受影响的部分照常做**；受影响部分**标 pending**（提示词纪律——§6.27.8）；
4. 父的**下一回合边界**消费（`thincoder-core/agent.mjs:214-218` 邻位单点 `drainChildUpstream(agent)`）：
   全部 pending 消息**合并为一条** user 消息注入（`pushReal`——不带 `transient`，事件落盘）；
5. 父判断 → 需要答复则 `subagent action:'send'`（id + message）→ 子下回合边界按普通指令消费（既有路径）；不需要答复则继续 / 终止子代理。

**无答复路径（兜底）**：到子代理终态仍未收到答复 ⇒ ① 受影响部分**不做** ② 终态报告如实写「未获答复 ⇒ X 未做」（现有「停下上报」纪律的自然延伸）
③ 父侧队列中未消费的消息**仍注入**（下一回合边界，附「该子代理已结束」注脚）——信息不丢、父可回溯。

**③ 射程面**（什么必须问 / 什么必须自己判——可判据分界）

**两问自检（须皆过才可问）**：

- **Q1 行动相关性**：答案会改变我的下一步行动吗？两种答案下行动相同 ⇒ **禁问**。
- **Q2 材料可读性**：答案能在本次任务的可读材料（任务书 / 设计档 / 仓内代码与文档）里找到吗？能找到 ⇒ **禁问——先自己读**。

**可问（正面清单四类）**：① 前提失效（任务书 / 设计写明的前提与实况冲突）② 方向冲突（两处要求互斥且都不可自行裁）
③ 授权边界（待做之事是否在任务域内）④ 代价性抉择（继续当前路线会作废已完成的工作）。

**禁问（负面清单四类）**：① 细节判断（命名 / 实现方式 / 代码结构 / 措辞——自己定并写进报告）② 可自查事实（文件在否 / 签名 / 测试是否通过）
③ 任务书已明示的取舍 ④ 求安心式确认。

**兜底判据**：**拿不准 ⇒ 按终态「停下上报」处置（保守），不做默认问。**

**机制面强制（可机判）**：`kind` 必填枚举 `ask|note`；**同一子代理「未 drain」的 `ask` ≤1**（`UPSTREAM_ASK_MAX_INFLIGHT = 1`——再问 ⇒ 工具报错，不投递）；
▸ **闸一窗口定义 = 「未 drain」**（判据 = 父队列中存在 `from` = 本子代理 label 的 `ask` 条目；该条目随 drain 移出队列 ⇒ 窗口关闭）——**机制面不追踪答复**
（子代理无法观测答复是否到达 ⇒ 闸门不以答复为界；提示词面同述此窗口——§6.27.8 ①②）；
`message` 长度上限（`UPSTREAM_MSG_MAX = 1500` 字符）；父队列总长上限（`UPSTREAM_QUEUE_MAX = 20`——超 ⇒ 工具报错，不静默丢）。

**④ 失败面**

| # | 情形 | 处置 |
|---|---|---|
| F1 | 父已结束回合（挂起 / idle / digest 之间） | 消息留队列 → 父**下次苏醒**（digest auto-turn / 用户回合）的回合边界注入（核形 / VSC 形同判——VSC 侧消费点已并入（2026-09-19 批 · 设计面）：§6.27.12.12） |
| F2 | 父侧会话终止（进程退出） | 无注入面——消息随会话丢弃（子代理同随会话 abort——一致性）；`child:upstream` 日志留痕 |
| F3 | 子代理先 settle / cancel | 队列消息**不删**——注入时读池状态附注脚（两形态判据点逐字见 §6.27.4「结束注脚」：池内条目 `done: true` ⇒ `has since settled`；出池 + 墓碑 `cancelled` ⇒ `has since been cancelled`；其余态**不附注脚**）；终态报告侧由「无答复兜底」承载 |
| F4 | 并发多子代理 | 父侧**单队列**，条目带 `from`（`role#id`）；同一回合边界**合并一条**注入（按入队序）——不刷屏、不丢来源 |
| F5 | 消息积压 | 双闸（单子代理未 drain ask ≤1（窗口定义见 ③）+ 父队列总长上限）；超限 = 子侧工具**明确报错** |
| F6 | 同步子代理（顶层 `async:false` / 子代内嵌套 spawn） | **单向**：消息同样入队（父侧消费顺延到阻塞工具返回后的下一回合边界，不因父在等而丢）；但**回复不可达**——`send` 契约只对**运行中异步子代理**可注入（§6.7.2 / 本档 `:51`），父在阻塞中、子在其返回前已终态 ⇒ 处置 = **父重派**（带答复的任务书）/ **无答复兜底**（子侧该部分不做 + 如实报告）。工具返回注按 `_upstream.sync` 分形（§6.27.4）；工具描述对 sync 面同述此单向性（§6.27.8 ④） |
| F7 | 无上游（`_upstream` 缺失——未接线站点 / depth-0 误调） | 工具返回**明确错误**（不静默成功） |
| F8 | **VSC 端壳（消费点已并入——2026-09-19 批设计 / 2026-09-20 批实现；§6.27.12.12）** | 端壳自持 depth-0 循环（`thincoder-vscode/src/agent.mjs:59` `runAgent` / `:206` 循环头；面板调用点 `thincoder-vscode/src/extension/panel-chat.mjs:27` / `:427`）⇒ **核 `thincoder-core/agent.mjs:223-225` 邻位的 drain 不经端壳** —— 消费点与载体面 = 端壳自接（**设计 + 实现均已落地**——设计 2026-09-19 · 实现 2026-09-20 三包）：端壳循环头调核单源 `drainChildUpstream`（`thincoder-vscode/src/agent.mjs:206` 循环头，动态 import `:162-163`）+ 载体两字段入 `CARRIER_FIELDS`（`:36-40`，12 → 14）；**未并入项** = 端壳取消 / 观察面对位（另案） |

### 6.27.3 方案选型对比

| # | 候选 | 判据逐项评估 | 结论 |
|---|---|---|---|
| 1 | **新工具 `notify_parent` + 父侧队列 + 回合边界注入** | ① depth>0 专有、不动既有动作面 ② 复用 `send` 作回复（零新管子）③ 非阻塞（无等待 API）④ 单容器可测 | **选定** |
| 2 | `subagent` 新动作 `action:'notify'`（depth>0 可用） | ① 须给 explore / plan 装 subagent（破非递归防线）② 与 §6.7.2 单向门相抵（判定表重构）③ 描述面二次分叉 | 否决 |
| 3 | 复用 `⟦ev⟧` token（TUI 事件通道） | 只到端侧（用户面）——**不进父上下文**，不解决「父瞎猜」 | 否决 |
| 4 | 子代理写文件当信箱（如 `docs/.child-inbox`） | 路径污染（须进 files 域 / §6.9 R26 黑名单面）+ 无生命周期 + 读写竞态 | 否决 |
| 5 | 阻塞式「子停下等父 `send`」 | 占池位空转 + 等待无界定（父可能长时不回）——**任务书明示不做** | 否决 |
| 6 | 队列挂池条目 `entry._inbox`（而非父 agent 对象） | 条目生命周期 = 子代理生命周期（settle 出池 ⇒ 消息随条目丢）——违反 F3 | 否决 |
| 7 | 注入形态用 `transient: true` | transient = 机器状态行（不进人读线 / 不落盘，`thincoder-core/session-segments.mjs:59-61`）；本通道是**事务性事件** | 否决 |

### 6.27.4 接口契约（改前 → 改后逐字）

**新档 `thincoder-core/agent-tools/parent-channel.mjs`（拟新增）** 导出面：
`parentChannelTool`（工具对象）· `pushChildUpstream({parent, from, kind, message})` · `drainChildUpstream(agent)` ·
`UPSTREAM_MSG_MAX` / `UPSTREAM_QUEUE_MAX` / `UPSTREAM_ASK_MAX_INFLIGHT`。

▸ **载体吸收**（finding 4 落位 · §6.27.2 ① 载体句）：`_childUpstream` / `_childUpstreamSeq` 的读 / 写同经单点 `upstreamHolder(parent)`——
`carrierField` 自 `thincoder-core/agent-tools/async-settle.mjs` import（同层既有导出，`thincoder-core/agent-tools/advisor-async.mjs:64` / `thincoder-core/agent-tools/async-discard.mjs:35` 同式；无新静态边）。

工具 schema（改后）：

```js
{ name: "notify_parent",
  description: "<工具描述——建议逐字见 §6.27.8 ④（实现轮落笔）>",
  parameters: { type: "object", properties: {
    kind: { type: "string", enum: ["ask", "note"], description: "ask = a question whose answer changes your next step; note = an FYI that needs no answer" },
    message: { type: "string", description: "The message to deliver to your parent (one short paragraph — details belong to your final report)" },
  }, required: ["kind", "message"] },
  readonly: true }
```

▸ **只读分类 `readonly: true`**（工具对象字段——实现轮落位；判据同 `task` 工具「只改 agent 内部状态、不改外部世界」）：标为只读是本通道在 **explore / plan 子代**可用的**前提**（子代无交互 UI ⇒ 非只读会吃权限询问）。
  dispatch 分类载荷三处：① planMode 门放行（`thincoder-core/agent/dispatch.mjs:167`——`!tool.readonly` 即拒）② 免权限问询（同档 `:257`——`tool.readonly` 直过）③ 批并行分类（同档 `:483`——非只读 ⇒ 断批串行）。
  实读落点 = `thincoder-core/agent-tools/parent-channel.mjs:172`（`readonly: true`；落地理由注 = 同档 `:135-141`）；**机检锚 = `thincoder-core/test/parent-channel.test.mjs:278`**（`assert.equal(parentChannelTool.readonly, true, …)`）。

▸ **depth 门**（工具 execute 首行）：`(ctx.depth ?? 0) === 0` ⇒ 返回错误对象（与 §6.7.2 / §6.25 同款 fail-closed 形态）。

**装配接线（改后）**：

- `thincoder-core/agent-tools.mjs`（登记册，20 → **23** 行）：+ 一行 re-export——`export { parentChannelTool }`（源 = `./agent-tools/parent-channel.mjs`）；
- `thincoder-core/agent/family-tools.mjs:166-170` depth>0 段**前置** `parentChannelTool`——**4 处携带**：`eng-coder`（`:166`）· `eng-designer`（`:167`）· `coder`（`:168`）· 兜底段（`:170`，explore / plan / 未列名 role）；`consult` 分支（`:169`）不入（坐标 = **修正轮 1 收正**至现盘；原 as-of 2026-09-18 17:3x 读数逐行差 1）。

**上游接线（改后——3 站点全枚举，各 1 行 + 注）**：

| # | 站点 | 改后 |
|---|---|---|
| W1 | `thincoder-core/agent-tools/subagent-spawn.mjs:463` **邻位**（`child._logId = relayPrefix.slice(0, -1)` 之后——`relayPrefix` 于 `:451` `let` / `:457`·`:459` 定值，故 `:345` 的 `createAgent` 处引用是 **TDZ**；`buildSpawnChild` = spawn 主路径，sync + async 共用） | `child._upstream = { parent, label: relayPrefix.slice(0, -1), sync: !wantAsync }`（紧随 `:463` 落位；`wantAsync` 是本函数入参 ⇒ **sync / async 两形同点装配**，`sync` 供返回注分形（§6.27.4）） |
| W2 | `thincoder-core/agent-tools/subagent-actions.mjs:409`（escalate **sync** 的 `createAgent`） | 同式（label = `escId`；**`sync: true`**） |
| W3 | `thincoder-core/agent-tools/escalate-async.mjs:193`（escalate **async** 的 `createAgent`） | 同式（label = `escalate#<id>`；**`sync: false`**——该站点已用 `relayPrefix`，`:191`） |

▸ **嵌套天然成立**：子代内 spawn 时 `parent` = 子代自身（`buildSpawnChild(parent, …)`）⇒ 通道逐层指向上游、零特判。
▸ **consult 不接线**（`thincoder-core/agent-tools/consult.mjs:275`）——装配面已排除，工具不在场 ⇒ 零「在场不可用」诱错面。

**父侧消费点（改后）**：`thincoder-core/agent.mjs:214-218` 邻位新增一行 `drainChildUpstream(agent)`（空队列 no-op——零开销）。

▸ **import 形态 = 动态**：`const { drainChildUpstream } = await import("./agent-tools/parent-channel.mjs")` —— 实到档 = `thincoder-core/agent-tools/parent-channel.mjs`（拟新增）；先例 = `injectAsyncResult`（`thincoder-core/agent.mjs:113-117`）：
**不新增静态边**（登记册静态图契约 = `family-tools.mjs:12-16` / 端壳 W8 契约②）；取用一次 / 循环头就地取皆可（实现轮择一，判据 = 零新增静态 import + A2 的循环头调用点）。

▸ 与 `consumeInjected?.(agent)` 的关系：后者 = spawn 方为我（子）装的**入向**通道；前者 = 我（作为父）自身的**子代理入向**通道。同址、反向、互不干扰。
▸ 覆盖面：正常回合 / digest auto-turn / headless 直连 `runAgent` **同点覆盖**（皆为循环头）。

**注入文案（逐字——父侧所见；`message` 经 `escapeXml`）**：

单条：

```
[System reminder: in-flight message from your subagent eng-coder#57 — it keeps working on the unaffected parts. Answer with subagent action:'send' (id + message) if the decision is yours; an unanswered ask means the child skips that part and reports it as not done.]
ask · eng-coder#57: <message>
```

多条（同一回合边界合并）：

```
[System reminder: N in-flight message(s) from your subagents — they keep working on the unaffected parts. Answer with subagent action:'send' (id + message) if the decision is yours; an unanswered ask means that child skips the part and reports it as not done.]
- ask · eng-coder#57: <message>
- note · explore#61: <message>
```

结束注脚（drain 时读池状态——`getAsyncPool(parent, "subagent")` + `tombstoneOf`，accessor 源 `thincoder-core/agent-tools/async-settle.mjs`）——**两形态 + 一显式不附注脚**（finding 5 落位）：

| 形态 | 判据点（逐字） | 注脚文案 |
|---|---|---|
| 已 settle | 池内命中条目且 `entry.done === true`（done-in-pool 表示——§6.7.3 `:87`） | `(eng-coder#57 has since settled — see its report)` |
| 已 cancel | 池**未命中** 且 `tombstoneOf(parent, id)?.status === "cancelled"`（出池 + 墓碑——`async-settle.mjs:86-89`；写点 `:238`） | `(eng-coder#57 has since been cancelled)` |
| 其余态（`discarded` §6.20.3 / `consumed` / `failed` 墓碑，或池与墓碑皆未命中） | —— | **不附注脚**（消息本体照常注入——**不臆断状态**；`discarded` 写点 = `thincoder-core/agent-tools/async-discard.mjs:90`） |

▸ `id` 取自条目 `from` 的 `#` 后段（W1 / W2 = relay 前缀去尾；W3 = `escalate#<id>`）——该 id 即池键（`String(id)`，`subagent-run.mjs:187` / `escalate-async.mjs:290`）。

**工具返回（逐字——子侧所见）**：**两形分述**（键 = `_upstream.sync`，W1–W3 装配）——sync 形**不给「答复到达」承诺**（父在阻塞中，`send` 对已终态子代理不可达，F6）。

异步形（`sync: false`）：

```json
{ "status": "queued", "kind": "ask", "position": 1,
  "note": "delivered to your parent's queue — consumed at the parent's next turn boundary (non-blocking). Keep working on the unaffected parts; a reply arrives as an ordinary instruction at your next turn boundary. If your run ends first, report the unanswered part as not done." }
```

同步形（`sync: true`）：

```json
{ "status": "queued", "kind": "ask", "position": 1,
  "note": "queued for your parent — but it spawned you synchronously and is blocked on this run, so no reply can reach you before you end. It reads this when its call returns and may re-spawn you; report the unanswered part as not done." }
```

**错误文案（逐字）**：

- depth-0：`notify_parent is only available inside a subagent (depth > 0) — at depth 0 you talk to the user through your normal reply or the question tool`
- 无上游：`notify_parent: this agent has no parent channel (not spawned through the subagent pipeline)`
- kind 非法：`notify_parent requires kind: "ask" (a question whose answer changes your next step) or "note" (an FYI that needs no answer)`
- message 空：`notify_parent requires a non-empty message`
- message 超长：`notify_parent message exceeds 1500 chars — one short paragraph; details belong to your final report`
- 未 drain ask 在场（闸一窗口——见 ③）：`notify_parent: your earlier ask (#<seq>) is still queued for your parent — one ask at a time until the parent picks it up; fold this into your final report if you cannot continue without an answer`
- 队列满：`notify_parent: the parent's in-flight queue is full (20) — the parent has not consumed the pending messages yet; fold yours into your final report instead`

**日志面**：入队点直记一条 `logEvent("child:upstream", { id: "role#N", kind, seq })`（`thincoder-core/log.mjs`）；消费点不另记（注入动作自身已有面）。

**UI / 交互面**：零新增面板块 / 零块状态机改动；注入 = 父历史的一条 user 消息（TUI 渲染既有逻辑，用户可见 ⇒「会话面唯一 = 父侧」不被破坏）。**无 open 项**。

### 6.27.5 与既有机制的关系

| 机制 | 关系 |
|---|---|
| `send`（§6.7.2） | **回复路径**（复用）——本通道只增「子→父」方向 |
| `observe` / `status`（§6.7.2） | 互补：二者 = 父**拉**（readonly 快照）；本通道 = 子**推**（事件） |
| `panel`（§6.7.2 / §6.11） | 零关系——不进面板块面、不改块状态机 |
| 池（`_asyncSubagents` / `_asyncQueue`） | 零触碰（载体分离）；drain 时**只读**池状态做结束注脚 |
| depth 规则（§6.7.2 / §6.25） | **互补对偶**：既有「除 `spawn` 外全部 depth-0 专有」；本工具「depth>0 专有」——两面不重叠（本工具不进 depth-0 家族段） |
| 终态通道（settle → digest，§6.8） | 分离：终态 = 报告（`_pendingAsyncResults`）；在飞 = 本通道。两容器互不迁移 |
| `question`（用户面） | 不替代：`question` = 「agent ↔ 用户」（子代理内不可用，S5）；本通道 = 「子代理 ↔ 父」 |

### 6.27.6 受影响文件清单（R24a · 行数口径 = `wc -l`；**当前行数 = as-of 2026-09-18 17:3x 实测**（实现轮后复读）；Δ 列 = 批内记录值（据实回填））

| # | 文件 | 当前行数 | Δ（实测） | 说明 |
|---|---|---|---|---|
| 1 | `thincoder-core/agent-tools/parent-channel.mjs`（本批新增） | **209** | 新增 **+209** | 通道本体（工具 + push + drain + 常量 + 载体吸收单点 `upstreamHolder`）；守 300 软线内 |
| 2 | `thincoder-core/agent-tools.mjs` | **23** | **+3**（20 → 23） | 登记册 re-export + 2 行注 |
| 3 | `thincoder-core/agent/family-tools.mjs` | **173** | **+4**（169 → 173） | depth>0 段前置 `parentChannelTool`——**4 处携带**（`eng-coder` `:165` · `eng-designer` `:166` · `coder` `:167` · 兜底段 `:169`；`consult` 分支 `:168` 不入）+ 4 行注（段内前置 ⇒ 零新增装配行） |
| 4 | `thincoder-core/agent-tools/subagent-spawn.mjs` | **473** | **+3**（470 → 473） | W1 上游接线（1 行 + 注；含 `sync: !wantAsync`；`:463` 邻位） |
| 5 | `thincoder-core/agent-tools/subagent-actions.mjs` | **495** | **+3**（493 → 495） | W2（escalate sync——`sync: true`） |
| 6 | `thincoder-core/agent-tools/escalate-async.mjs` | **302** | **+3**（300 → **302**） | W3（escalate async——`sync: false`）；**本批新增越 300 软线档**（核侧 `SOFT_LINE_REGISTRY` 已登记——见下 ▸ 越线登记） |
| 7 | `thincoder-core/agent.mjs` | **436** | **+6**（430 → 436） | 回合边界消费点一行 + **动态 import 取用**（同 `:113-117` 先例，零新增静态边）+ 2 行注 |
| 8 | `thincoder-core/test/parent-channel.test.mjs`（本批新增） | **291** | 新增 **+291** | 用例 T1–T17 + A4 导出面 + 载体吸收（19 例） |
| 9 | `thincoder-core/test/family-tools.test.mjs` | **131** | **+13**（118 → 131） | `ROLE_FIXTURES`（:24-56）名集 + 兜底段 / depth-0 / consult 断言 |
| 10 | `thincoder-cli/test/prompts-dual-source.test.mjs` | **121** | **0**（121 → 121） | `T-CL1` 计数 10 → **11** 三处同改——`:80` 口径注 · `:82` 标题串（「十节（## 块数 10…）」）· `:83` 断言与消息串（净增 **0** 行） |
| 11 | `thincoder-core/prompts/common.md` | **112** | **已落笔**——批内实测 **+21**（89 → 110，as-of 16:2x）；批后 **+2**（→ 112，见 ▸ 表注） |
| 12 | `thincoder-core/prompts/discipline-engineering.md` | **121** | **已落笔**——批内实测 **+2**（118 → 120）；批后 **+1**（→ 121，见 ▸ 表注） |
| 13 | `docs/core/design/prompts/common.md` | **74** | **已落笔**——批内实测 **+15**（58 → 73）；批后 **+1**（→ 74，见 ▸ 表注） |
| 14 | `docs/core/design/prompts/discipline-engineering.md` | **119** | **已落笔**——批内实测 **+2**（116 → 118）；批后 **+1**（→ 119，见 ▸ 表注） |
| 15 | `docs/core/design/AGENT-LOOP-SUBAGENT.md` | **1932** | **+333**（设计轮 1085 → 1418）· **+6**（修正轮 1 → 1424）· **+44**（修正轮 2 → 1468）· **+15**（设计档面收正轮 → **1483** 实测） | §6.27 全节 + 变更记录条目（设计轮 / 修正轮 1 / 修正轮 2 / 设计档面收正轮 各一行） |
| 16 | `docs/core/requirements/AGENT-LOOP.md` | **257** | **已落笔**——实测 **+24**（233 → 257，as-of 16:2x） | §4.12 建议文本（**父侧笔**——本档不写） |

▸ **提示词面落笔状态（finding 1 回填 · 口径 = 换行计数）**：行 11–14 **已落笔**（父侧 2026-09-18；逐字 = §6.27.8 ①–③）——批内实测 Δ：核 `common.md` **+21** · 核 `discipline-engineering.md` **+2** · 中文 `common.md` **+15** · 中文 `discipline-engineering.md` **+2**（as-of 16:2x）。
**批后同窗写入（as-of 2026-09-18 17:3x 复读 · 现盘值已按此回填）**：四档现盘 **112 / 121 / 74 / 119**——比批内读数各 **+2 / +1 / +1 / +1**。
**来源** = 批内落笔之后的同窗写面（父侧 sync 面限定句（批档 §5 `:316`）· 末次触碰 = `4e3429f2`（09-18 16:59，两份 `discipline-engineering.md` 各 +2——`git log --numstat` 实证））；**本档 / 本批零写提示词面**（父侧笔）。
逐档归因不闭合处（`discipline-engineering.md` 批内记录 120 / 现盘 121 而末次提交 +2）已入批档 §2 报告面。
**仍归实现轮**：T-CL1 计数（10 → 11——`:80` / `:82` / `:83` 三处同改）与 `notify_parent` 工具注册——两者与提示词面**同批落地**；在此之前 `prompts-dual-source.test.mjs:83` 现盘断 10 / 现盘 `##` 块数 11 ⇒ 该测**现盘红**（已知，实现轮消解，不入本批判据）。

▸ **载体清单位点（finding 4）**：`_childUpstream` / `_childUpstreamSeq` 属载体字段集（核读 / 写 = §6.27.2 ① 的 `upstreamHolder` 吸收）；**端壳字段表**（`thincoder-vscode/src/agent.mjs:36-40` `CARRIER_FIELDS`）**已并入（2026-09-19 批 · 设计面）**（12 → 14 款 + 端壳 drain 接线；**实现已落地**——§6.27.12.12 · 2026-09-20 三包）；**残余另案 = 端壳取消 / 观察面对位**（F8 / §6.27.11-6）。

▸ **越线登记（R24a 尺寸档 · as-of 2026-09-18 17:3x 实测）**：本批**新增一个越 300 软线档** = `thincoder-core/agent-tools/escalate-async.mjs`（300 → **302**——W3 纯接线 1 行 + 注）。
**核侧已登记**：`thincoder-core/test/core-hygiene.test.mjs:32`（`SOFT_LINE_REGISTRY`）含 `agent-tools/escalate-async.mjs`（`:34`），登记注 = 同档 `:27-30`（「纯接线、不改变既有拆分结论；拆分计划归父侧另案」）。
既有已越档（本批前即越，**不变**）：`subagent-actions.mjs`（493 → **495**）· `subagent-spawn.mjs`（470 → **473**）——各 +3 纯接线，拆分立场不变（**登记同理**——同表在册）。新档 `parent-channel.mjs`（**209**）守 300 软线内。⇒ **三档拆分计划归父侧另案（登记）**。

### 6.27.7 关键决策记录

- **D-UC1（载体 = 新工具 + 父侧队列）**：否决候选 2 / 3 / 4 / 6（§6.27.3）。判据 = 非递归防线 + 单向 depth 门 + 容器生命周期。
- **D-UC2（回复复用 `send`）**：不新造下行管子；「send→settle 竞态」与「undelivered 提示」语义原样继承（`subagent-run.mjs:165-174`）。
- **D-UC3（非阻塞 = 结构保证）**：通道**不提供任何拉取 / 等待动作**（判据同 §6.7.5 `check` 删除）——子代理在机制上无法等待，「禁等待态」不只靠纪律。
- **D-UC4（射程 = 两问自检 + 正负清单 + 保守兜底）**：射程是**提示词面**纪律（§6.27.8）；机制面只强制可机判的三条闸（kind / 未 drain ask ≤1（窗口 = 未 drain，见 §6.27.2 ③）/ 长度与队列上限）。
- **D-UC5（注入形态 = `pushReal` 非 `transient`）**：判据 = 事件性（一次性、有内容、落盘有价值）vs 状态性（每轮重复的机器行）；先例 = `injectAsyncResult`（`subagent-async.mjs:383`）。
- **D-UC6（范围 = 核侧 + 提示词面——§6.27 批口径）**：VSC 端对位面**该批不做**（登记：VSC 子代理经核 `runChildPipeline` → 核 `runAgent`；装配面在其 `setup` 面）；**范围现值 = 核 + CLI + VSC 两端对位**（2026-09-19 批并入——需求 §4.12 N4 / §6.27.12.12）。
  **已知面 = F8**（端壳自持 depth-0 循环 ⇒ 核侧 drain 不经端壳）：**另案三项**（端壳 drain 接线 / 端壳载体表补字段（+ 夹具）/ 端壳取消 · 观察面对位）——现态 = **前两项设计已并入本批（2026-09-19 · 设计面；实现待实现轮落地）**（§6.27.12.12）+ **第三项未并入**（另案）。**核侧读 / 写按 `carrierField` 吸收**（§6.27.2 ①）——端壳面只补消费点与端壳登记，**不回改核码**。

### 6.27.8 提示词面逐字建议（**父侧已落笔（2026-09-18）**——内容权在父侧；本档只出文本。落笔状态与实测读数 = §6.27.6 行 11–14 及其下表注）

**① `thincoder-core/prompts/common.md`（英文运行面）**——新增一段（置于「停下上报（Stop and report）」段之后、「工具观」段之前；`##` 块数 10 → 11）：

```
## 上行通道（Upstream channel — subagents and their parent）

A subagent has a channel to its parent for decision-grade questions — the `notify_parent` tool. The parent is not a
user: it cannot confirm anything and it may be busy. Pass every message through this filter first:

- **Ask only when both hold**: (1) the answer changes your next step, and (2) the answer cannot be found in the
  materials you can read (task book, design doc, repo code/docs). Otherwise decide yourself and write the call into your report.
- **In scope**: a stated premise the facts contradict; two requirements that conflict and you cannot arbitrate;
  whether an action is inside your task domain; a choice that would waste work already done.
- **Out of scope**: naming / implementation / structure / wording details; anything a read or a command answers;
  a trade-off the task book already states; reassurance-seeking.
- **Non-blocking**: send it and keep working on the unaffected parts — the affected part stays pending until a reply
  arrives (as an ordinary instruction). Never idle waiting, never poll. No reply by the time you finish ⇒ skip that
  part and report it as not done.
- **One ask at a time**: while an `ask` of yours is still waiting in the parent's queue (not yet picked up), a
  second one is refused. When unsure whether a question qualifies, fall back to the stop-and-report discipline above.

Receiving side (the parent): an in-flight child message arrives as a `[System reminder: ...]` user message at your
next turn boundary. If it is decision-grade, answer with `subagent action:'send'` (id + message) — the child consumes
it at its next turn boundary and keeps the rest of its discipline unchanged.
```

**② `docs/core/design/prompts/common.md`（中文权威面）**——同段中文（双面流程：中英不同字面，各自自足）：

```
## 上行通道（子代理及其父）

子代理有一条向父（spawn 方）发「决策级问题」的通道——`notify_parent` 工具。父不是用户：它不确认任何事，
也可能正忙。每条消息先过这道滤网：

- **两问皆过才可问**：① 答案会改变你的下一步行动 ② 答案在你能读到的材料（任务书 / 设计档 / 仓内代码与文档）里找不到。
  否则自己定，并把该判断写进报告。
- **可问**：写明的前提与实况冲突；两处要求互斥且你不可自行裁；待做之事是否在任务域内；继续当前路线会作废已完成的工作。
- **禁问**：命名 / 实现方式 / 结构 / 措辞等细节；读一下或跑一下就有答案的事；任务书已明示的取舍；求安心式确认。
- **非阻塞**：发完继续做不受影响的部分——受影响部分标 pending 直到答复到达（按普通指令消费）。**禁空转等待、禁轮询**；
  到结束仍无答复 ⇒ 该部分不做，并如实报告。
- **一问一答**：你的 `ask` 还留在父队列里（父尚未取走）时不得再发 `ask`。拿不准是否该问 ⇒ 回落到上面的「停下上报」纪律。
- **接收侧（父）**：子代理的在飞消息在下个回合边界以 `[System reminder: ...]` user 消息到达；属决策级则以
  `subagent action:'send'`（id + message）答复——子代理在其下个回合边界按普通指令消费，其余纪律不变。
```

**③ 工程场景一句**（`thincoder-core/prompts/discipline-engineering.md` + `docs/core/design/prompts/discipline-engineering.md`）：

- 英文：`**Premise invalidated mid-flight**: when the premise you are executing on turns out false (the code contradicts the design / the task book), send an upstream `ask` (notify_parent) — do not finish the wrong work and stop at the terminal report.`
- 中文：`**途中前提失效**：正在执行的前提被实况证伪（代码与设计 / 任务书相抵）⇒ 走上行 `ask`（notify_parent）——不要做完错的工作再终态停报。`

**④ 工具描述（`parent-channel.mjs` 的 `description`——实现轮落笔，建议逐字）**：

```
A one-way channel to your PARENT (the agent that spawned you) — you are a subagent, so there is no user to ask.
Queue a message on the parent's side; your turn is not interrupted and nothing is consumed from it.
- kind:'ask' — a question whose answer changes your next step and that you cannot answer from the materials you can read
  (task book / design doc / repo). The parent replies with subagent action:'send'; you receive it as an ordinary
  instruction at your next turn boundary. One ask at a time while the previous one is still waiting in the parent's queue.
- kind:'note' — an FYI that needs no answer (a premise you found broken, a conflict you resolved and want visible early).
- NON-BLOCKING: the call returns immediately. Keep working on the unaffected parts; keep the affected part pending.
  There is no fetch and no waiting — if you finish first, report the unanswered part as not done (never idle, never poll).
- SYNCHRONOUS SPAWN: if the parent is blocked on your run (sync spawn), nothing can be sent back to you — the reply path (`send`) reaches only a RUNNING ASYNC child. The message is read when the parent's call returns (it may re-spawn you with an answer); report the unanswered part as not done.
- Out of scope: naming / implementation / wording details, anything a read or a command would answer, trade-offs the
  task book already states. When in doubt use the stop-and-report discipline — this is not an escape from your own judgment.
- Availability: subagents only (depth > 0). At depth 0 you talk to the user through your normal reply or the question tool.
```

### 6.27.9 用例表（正常 / 边界 / 错误）

| # | 用例 | 输入 | 期望输出 | 回指 |
|---|---|---|---|---|
| T1 | 正常·`ask` 入队 + 立即返回 | 子代理（带 `_upstream`）调 `notify_parent({kind:"ask", message:"…"})` | 返回 `status:"queued"` + `position:1`；父 `_childUpstream` 长度 1（`from` / `kind` / `seq` 正确）；调用**即刻返回**（零 await） | A1 / A4 |
| T2 | 正常·父消费注入 | T1 后 `drainChildUpstream(parent)` | 父 history 尾新增**恰 1** 条 user 消息（含 `eng-coder#57` + `ask` + 指引句）；队列清空 | A2 |
| T3 | 正常·往返闭环 | T2 后父 `send` → 子下回合边界 | 子历史新增该回复（user 回合）——既有 `drainInjectedQueue` 路径零改 | A2 / A6 |
| T4 | 正常·`note` 类 | `{kind:"note"}` | 注入文案含 `note`；无待答复语义 | A1 |
| T5 | 边界·多来源合并 | 两子代理各 1 条（同边界前） | 注入**恰 1** 条 user 消息，含两条列表行（按入队序）；队列清空 | A2 |
| T6 | 边界·父未运行（挂起） | 父 `runAgent` 已返回后子代理入队 | 队列留存；父下次 `runAgent` 首轮边界注入 | F1 |
| T7 | 边界·子代理已 settle | 子代理 settle 后父 drain | 注入含 `has since settled` 注脚；消息**不丢** | F3 |
| T8 | 边界·空队列 | `drainChildUpstream` on 空 | 零历史变更（no-op） | A2 |
| T9 | 错误·depth-0 调用 | 主 agent 调 `notify_parent` | 明确错误（`depth > 0` 文案）；零入队 | A3 |
| T10 | 错误·二次 `ask`（窗口 = 未 drain） | ① 首条 `ask` 未 drain 时同子代理连发两次 ② 同子代理首条被 drain 后再发一次 | ① 第二次**报错**（`one ask at a time` 文案）；队列长度仍 1 ② 放行（队列长度 1） | A5 |
| T11 | 错误·队列满 | 队列已达 20 | 报错（队列满文案）；零入队 | A5 |
| T12 | 错误·`message` 非法（空 / 超 1500）· `kind` 非法 | 三种输入 | 各自明确错误；零入队 | A5 |
| T13 | 错误·无上游 | 手工构造无 `_upstream` 的 agent | 报错（`no parent channel`） | F7 |
| T14 | 零回归 | 既有族 | `subagent-observe-send` / `async-family` / `spawn-gates` / `family-tools`（更新后）全绿 | A6 |
| T15 | 边界·子代理已 cancel（注脚第二形态） | 子代理取消（出池 + 墓碑 `cancelled`）后父 drain | 注入含 `has since been cancelled` 注脚；消息**不丢** | F3 |
| T16 | 边界·第三态不附注脚 | 池未命中 + 墓碑 `discarded`（`thincoder-core/agent-tools/async-discard.mjs:90`）/ 无墓碑 | 注入**不含**任何注脚；消息本体照常注入 | F3 |
| T17 | 边界·sync 面返回注（同用例两半） | ① `_upstream.sync === true` 调 `notify_parent` ② `sync: false` 同调 | ① 注**不含**「reply arrives」句、**含**「父阻塞 ⇒ 无答复 ⇒ 报未做」句 ② 含「reply arrives」句（异步形字面不变） | F6 |

### 6.27.10 验收标准（逐条回指）

| # | 判据（可机检） | 回指 |
|---|---|---|
| A1 | 工具在场性：`assembleFamilyTools({depth:1, role})` 五角色皆含 `notify_parent`；兜底段（未列名 role）同含（表断言：`{depth:1, role:"sub"}` ⇒ 含）；`depth:0` 各面不含；consult 不含（表断言） | 批 §2 条目 1 |
| A2 | 消费单点：`agent.mjs` 循环头含 `drainChildUpstream(agent)` 调用（import 形态 = 动态——§6.27.4）；空队列零变更；非空 ⇒ 恰 1 条合并注入 + 清队列 + 结束注脚按两判据点（T2 / T5 / T8 / T15 / T16） | 批 §2 条目 2 |
| A3 | depth 门：depth-0 调 ⇒ 明确错误（T9）；文案族与 §6.7.2 fail-closed 形态同款 | 批 §2 条目 1（depth>0 专有——五角色装配 / depth-0 与 consult 不装配） |
| A4 | 非阻塞 + 无答复路径：工具 execute 无父侧 await；**通道无拉取 / 等待导出**（导出面断言：仅 tool + push / drain + 常量）；未获答复的 ask 其队列消息**仍注入**（T7——信息不丢）；sync 形返回注不给「答复到达」承诺（T17——同用例两半） | 批 §2 条目 3 |
| A5 | 三闸：未 drain ask ≤1（T10 红——窗口 = 未 drain：未 drain ⇒ 拒 / drain 后 ⇒ 放行，同用例两半）· 长度上限与队列上限（T11 / T12 红）· kind 枚举（T12 红） | 批 §2 条目 4 |
| A6 | 零回归：既有族测试全绿（含 `thincoder-cli/test/subagent-observe-send.test.mjs`）+ `family-tools.test.mjs` 更新后绿 | 批档自身约束（无对应条目——零回归基线 = 需求档建议 N2） |
| A7 | 提示词面：`common.md` `##` 块数 = 11（T-CL1 同批更新——`:80` 口径注 · `:82` 标题串 · `:83` 断言与消息串三处）；核 `prompts/` 文件集仍 15（`thincoder-core/test/prompt-files.test.mjs:69`）；零新增 `{{inject:...}}` 锚 | 批 §2 条目 6 |
| A8 | 文档一致：设计档 §6.27 ↔ 批档 §2 ↔ 需求档条目三方一致；`node scripts/doc-check.mjs` 本批触碰档零新增悬空锚 / 零新增行宽违规 | 批档自身约束（无对应条目——三方一致 + doc-check 按档零新增） |

### 6.27.11 边界（本批不做）

1. 不做阻塞式提问（等待态）；不提供拉取 / 轮询 / 等答复 API（D-UC3）。
2. 不给 consult 装配（角色语义边界）；不给 depth-0 主 agent 装配（其与用户的通道 = 普通回复 / `question`）。
3. 不改 `send` / `observe` / `status` / `cancel` / `panel` 动作语义与文案；不改 depth 门既有条文（§6.7.2 / §6.25）。
4. 不改池 / 队列 / 补位 / settle / digest 语义；`_childUpstream` 不参与 `dependsOn` 墓碑与 `status` 视图。
5. 不新增 TUI 面板块 / 不改块状态机；不改 `transient` 语义。
6. **VSC 端对位已并入（2026-09-19 批 · 设计面）**（端壳消费点 = 循环头调核单源 `drainChildUpstream` + 载体表 12 → 14 款 + 端侧唤醒 / 谓词 / 旗标 + 夹具同步；**实现待实现轮落地**——§6.27.12.12）；**残余边界 = 端壳取消 / 观察面对位**（F8 未并入项——另案）。
7. 不改需求档正文（父侧笔）；不改提示词正文（父侧落笔——本档只出逐字建议）。
8. 不做「父→子」新动作 / 新管子（回复路径恒 = `send`）。

### 6.27.12 上行唤醒面（默认流可用性 · F-UC7）（2026-09-19 · 批 2026-09-19-upstream-channel-availability · 台账 #104）

**回指**：需求 = `docs/core/requirements/AGENT-LOOP.md` §4.12 **F-UC7**（`:220`）+ 由头注（`:227`）；任务书 = `docs/batches/2026-09-19-upstream-channel-availability.md` §2。
**定位**：§6.27（通道本体）建成后**在默认异步流不可用**——本节 = 唤醒面（结构层真因）的裁定与落地契约。三面（机制 / 语义 / 射程）承 §6.27.2 不变，本节只补**唤醒面**。

#### 6.27.12.1 病与实证（默认流窗口）

**病**：通道的父侧消费点 = 回合循环头单点 `drainChildUpstream(agent)`（`thincoder-core/agent.mjs:225`）——**只在回合内**；而挂起期（父侧无回合）的唤醒源只有三路（§6.27.12.2），**「未 drain 的 ask」不在列** ⇒ 默认流（单子代理 · 父侧挂起）里 ask 恒等到「子代理自身 settle」那次 digest 轮才被读到 ⇒ 子代理已终态，答复无处可去——§4.12 总体需求 `:210` 的「在飞纠偏」在默认流**不成立**。

**实证（本机 `~/.thincoder/logs/agent-2026-09-19.log` 逐条实读）**：挂起窗口 = 分钟级，且首个唤醒恒 = 子代理自身 settle（五次挂起皆 `poolN 1 / runningN 1` = 单子代理默认流）：

| # | `susp:enter` | 首个 `digest:start` | 窗口 | 证据行 |
|---|---|---|---|---|
| 1 | 12:52:09 | 12:59:08 | **419 s** | `:1721` / `:2025` |
| 2 | 13:24:03 | 13:28:26 | **263 s** | `:2592` / `:2748` |
| 3 | 14:26:09 | 14:34:29 | **500 s** | `:3863` / `:4122` |
| 4 | 14:38:40 | 14:45:25 | **405 s** | `:4200` / `:4332` |
| 5 | 14:46:42 | 14:52:28 | **346 s** | `:4373` / `:4423` |

子代理典型运行时长 ≈ 该窗口 ⇒ **ask 恒迟到**（§1.2 诊断的结构面成立）。**同档次生读数**：digest 轮自身耗时 ≈ 6.8–64.3 s（`digest:end` 的 `ms` 字段全档区间）——即「唤醒后答复到达」的代价量级 = 一个父侧轮。
**零使用证据**：同日志 `child:upstream` **0 命中**（`notify_parent` 仅出现在父侧 read / grep 载荷内）⇒ 本通道**从未在默认流被真实走通一次**——本批修的是「结构在先、建成即不可用」，不是统计意义上的偶发。

#### 6.27.12.2 唤醒事件族逐条实核（三路 + 一问）

| # | 唤醒源 | 核内 `thincoder-core/agent/suspension.mjs` | CLI `thincoder-cli/src/tui/suspension-drive.mjs` | VSC `thincoder-vscode/src/extension/suspension.mjs` |
|---|---|---|---|---|
| W1 | **子代理 settle**（池项结算） | 注册 `:133`（`carrier._asyncWaiters ??= []` + `push(onSettle)`）· 摘除 `:121-122` · 兑现 = `thincoder-core/agent-tools/async-settle.mjs:281` | 注册 `:127`；兑现同核 settle 尾 | 注册 `:190`（双载体 `panel._agent` + `susp.lines.history`）；兑现同核 settle 尾 |
| W2 | **用户输入**（Enter 落槽） | `latch.wake` `:134` ← 宿主句柄 `handle.wake()` `:231` | `state._suspWake` `:128`（Enter → 唤醒） | `panel._suspWake` `:191` |
| W3 | **abort**（Ctrl+C / 会话中止） | `abortSignal` `:123` / `:136` → `finish("aborted")` | `agent._sessionAbort.signal` `:126` / `:129-130` | `susp.abort.signal` `:180` / `:192-193` |
| — | **未 drain 的 ask** | —— | —— | —— |

**三路之外无第四路（实核）**：advisor digest / consult 结果都经 settle 入池 ⇒ 走 W1；`_asyncQueue` 排队条目由调度面在池内处理，不设唤醒点。

**末行缺口的填充（2026-09-19 VSC 扩面轮）**：表内「未 drain 的 ask」一行的「——」= 诊断时缺口；修法 = 唤醒（核 ask 入队尾调 `wakeAsyncWaiters`——§6.27.12.4 ①）+ 三驱动第 2 步谓词（§6.27.12.4 ① / §6.27.12.12-③）。**VSC 侧等待栓（W1 面）本就在位**（`thincoder-vscode/src/extension/suspension.mjs:190`）——本批只补该面的消费与谓词。

**挂起驱动坐标（核 + 两端）**：核 `thincoder-core/agent/suspension.mjs`（**234 行** · `startSuspension` `:150` · 等待单点 `waitForSettleOrWake` `:116-138`）·
CLI `thincoder-cli/src/tui/suspension-drive.mjs`（**301 行** · `suspensionSession` `:191` · 等待单点 `:109-132`）·
VSC `thincoder-vscode/src/extension/suspension.mjs`（**397 行** · `suspensionSession` `:227` · 等待单点 `:163-195`）。
**核驱动现状 = 无生产消费方**：`startSuspension` 全仓命中仅核档 + `thincoder-core/test/suspension.test.mjs`（CLI / VSC 各自持自有循环）⇒ 本批改动面 = **核 + CLI + VSC 三面**（VSC = 对位设计已并入本批（2026-09-19 · 设计面）：§6.27.12.4 范围面 / §6.27.12.12）。

#### 6.27.12.3 关键发现——唤醒 ≠ 开轮（第二要件）

CLI 驱动循环（`:211-247`）的等待单点被唤醒后**只重新求值、不直接开轮**：

```
while (…) { sweepSettledToPending(agent)
  1. pendingInput 非空            → 用户回合（:217）
  2. _pendingAsyncResults 非空    → 消化轮 auto-turn（:231）
  3. !poolLive(agent)             → 退出（:244）
  4. await 等待下一唤醒（:246） }
```

⇒ **只补唤醒零效果**：唤醒后 ① 输入槽空 ② pending 空 ③ 池仍 live（子代理还在跑）⇒ 回第 4 步继续等。**未 drain 的 ask 必须进第 2 步的开轮判据**——只有轮跑起来，`thincoder-core/agent.mjs:225` 的 drain 才会把消息注入父上下文（消费单点唯一性的结构断言 = `thincoder-core/test/parent-channel.test.mjs:130-133`）。
⇒ **本批修法 = 唤醒面（复用 W1 通道）+ 开轮谓词（第 2 步新增判据源）两件一组，缺一无效。**

#### 6.27.12.4 四面裁定

**① 机制面**（唤醒条件 / 注入点 / 回复路径）

- **唤醒条件** = 子代理入队一条 `kind:"ask"` 条目（`thincoder-core/agent-tools/parent-channel.mjs:88-95` 入队之后）。
  `note` **不唤醒**（FYI 无时效义务；同时避开「每条消息一次父侧 LLM 轮」的轮风暴面）——唤醒源 = **未 drain 的 ask**，与 F-UC7 措辞（`:220`「ask 须能触发父侧一次处理」）逐字对齐；note 面处置见边界项 §6.27.12.11-7。
- **唤醒实现** = **复用 W1 通道**（`_asyncWaiters`），抽核内单点：`wakeAsyncWaiters(parent)`（现 `async-settle.mjs:281` 的 `splice(0)` 循环**逐字**迁入；settle 尾改调用同函数），`pushChildUpstream` 在 `kind === "ask"` 分支尾部调它一次。
  载体读经 `carrierField`（既有无障碍单点，`async-settle.mjs:52-56`）——与入队侧 `upstreamHolder`（`parent-channel.mjs:67-80`）同口径。
  **零新字段 / 零新容器 / 零新注册点**：等待栓数组在挂起期已由三驱动注册；非挂起期数组空 ⇒ `splice(0)` 空循环 = no-op（父侧忙 / 会话已退出 / 挂起未进入三情形皆 no-op）。
- **轮谓词** = 三驱动第 2 步判据追加 `|| upstreamWaiting(carrier)`（`parent-channel.mjs` 新导出；读 `carrierField(carrier, "_childUpstream")`，且**队列中存在 `kind === "ask"` 条目**为真）。
  该轮 = **auto 轮**（`autoTurn: true` 不变 ⇒ `_inAutoTurn` spawn 门 / `INHERITED_GUARD_KEYS` 继承 / `resume: resume || autoTurn` 语义**全部沿既有 auto 轮**）+ 新旗标 `upstreamTurn: true`（**仅供域文本选择**，不进任何门）。
- **注入点** = **零改**：仍是 `drainChildUpstream` 回合头单点（`thincoder-core/agent.mjs:225`），全部 pending 合并一条 user 消息（`parent-channel.mjs:120-133`）。
- **回复路径** = **零改**：`subagent action:'send'`（§6.27.1 S1 表 = `subagent-actions.mjs:319-320` 入 `entry._injected` → 子代理回合头 `thincoder-core/agent.mjs:223` `consumeInjected` 消费）。
  **回复可达性实核（本批关键前提）**：`send` 属 dispatch **控制类豁免**——`thincoder-core/agent/dispatch.mjs:94-99`（`isSubagentControlAction` 含 `send` ⇒ `:257` 免权限门）⇒ 免审批 / planMode 放行 / **digest 内放行**；
  `thincoder-core/agent-tools/subagent.mjs:186` 的 auto 轮门**只覆盖 `escalate`**，`:263` 只覆盖 spawn ⇒ **manual 档 auto 轮内 `send` 可调**（逐条实读，非推断）。
- **非阻塞地基**：`notify_parent` 侧零改（仍同步返回、无等待 / 拉取导出）——N1 / D-UC3 结构保证原样。

**② 语义面**（回合类型与域文本）

- 唤醒轮 = **auto 轮类**（父侧无用户在场）：manual 档照既有 D-S6 纪律（不 spawn / 不改文件 / 不提问）；AUTO 档无域提醒（既有）。
  **与既有 digest 域文本的冲突（必须处置）**：`AUTO_TURN_DIGEST_DOMAIN`（`thincoder-core/agent/helpers.mjs:371-372`；VSC 侧注入点 = 端侧组合 `thincoder-vscode/src/agent/turn-domains.mjs`（拟新增——§6.27.12.5 L））写「**No one is waiting for this reply**, so organize only」——**对 ask 轮恰相反**（子代理正在等答复）
  ⇒ 唤醒轮**不得**沿用 digest 域文本，须有自己的域文本（逐字建议 = §6.27.12.8；**内容权 = 父侧**，本档只出文本——同 §6.27.8 先例）。选择点 = `thincoder-core/agent.mjs:162`（manual 档域提醒注入点）邻位：`upstreamTurn` 优先、否则 `autoTurn`。
- **提示词面零改**：注入文案自带指引（`parent-channel.mjs:126-129` 抬头「Answer with subagent action:'send' …」）⇒ 主分支下 §6.27.8 的 async 承诺（「回复在你的下回合边界到达」）在默认流**变得成立**，无需改准；`prompts/**` 与工具描述本批**零行**。
- 队列消费仍**消费即清**（`parent-channel.mjs:123` `splice(0)`）⇒「未 drain」窗口随该轮关闭，子代理可再问一条（闸二语义零改）。
- 混合场景（同一轮既有 ask 又有已 settle 报告）：**一轮同时办两事**（drain 注入 ask + 轮首注入 pending 报告 `thincoder-core/agent.mjs:111-122`）——域文本按 `upstreamTurn` 选择并显式容纳摘要句（§6.27.12.8 文本末段），**不新开第二轮**。

**③ 失败面**（增量；F1–F8 原样）

| # | 情形 | 处置 |
|---|---|---|
| F9 | 唤醒后父侧轮未及跑完，子代理已 settle | 注入仍发生（`endNote` 附「has since settled」注脚，`parent-channel.mjs:105-111`）；`send` 因目标出池不可达 ⇒ 既有 F-UC3 兜底（子侧该部分不做 + 如实上报）——**零新语义** |
| F10 | 唤醒触发但队列已被同轮 drain 清空（多次唤醒 / 竞态） | 循环回求值：谓词假 ⇒ 继续等——**无自旋**（唤醒为一次性栓，`splice(0)` 即清） |
| F11 | 挂起已退出后 ask 入队 | 等待栓数组空（核 `finishSuspension` / CLI `:258` / VSC `:324` 清场）⇒ 唤醒 no-op；消息留队列等下一回合边界（F1 原样） |
| F12 | 父侧忙（回合内）时 ask 入队 | 等待栓数组空 ⇒ 唤醒 no-op；该轮或下一轮边界注入（既有） |
| F13 | 挂起期 note 入队（不唤醒） | 静默留队列 → 下一拐点（settle / 用户输入）注入——**今日语义零变**（边界项 §6.27.12.11-7） |

**④ 范围面**

- **本批写域 = 核 + CLI + VSC（三面）**：核（`thincoder-core/agent-tools/async-settle.mjs` / `thincoder-core/agent-tools/parent-channel.mjs` / `thincoder-core/agent/suspension.mjs` /
  `thincoder-core/agent.mjs` / `thincoder-core/agent/helpers.mjs`）+ CLI（`thincoder-cli/src/tui/suspension-drive.mjs` / `thincoder-cli/src/tui/agent-turn.mjs`——**旗标贯通两跳，修正轮 1 补**）
  + **VSC 端壳**（`thincoder-vscode/src/agent.mjs` / `thincoder-vscode/src/extension/suspension.mjs` / 旗标贯通三档 / 载体表夹具——**细则、坐标与用例 = §6.27.12.12**）。
  **扩充依据**：用户 2026-09-19 23:23 裁定「**vsc 肯定要扩啊，否则不完整啊**」+ 需求档 §4.12 **N4**（`docs/core/requirements/AGENT-LOOP.md`——范围 = **核侧 + CLI + VSC 两端对位**）。
- **实证面仍 = CLI**（§6.27.12.1 日志 = 本机 CLI 会话：无 `Code` 进程、会话子代理 id 序列与批档 §1.2 同源）；**VSC 面 = 对位设计已并入本批（2026-09-19 · 设计面）**（结构 + 夹具可机判）——**实证日志不覆盖 VSC**（如实登记：本机默认流非 VSC；VSC 侧重载后自验归收口，见 §6.27.12.12-5）。
- **VSC 面落点顺序（硬）**：**先补 drain**（否则唤醒轮注入空内容——F8 病征原样）**再补载体两字段**（否则队列跨 run 丢）⇒ 其后才是谓词 / 旗标 / 日志标签。四项同批改造，**待实现轮落地**。
- **不动**：consult / depth-0 面 · 既有三路唤醒语义（W1–W3）· `_childUpstream` 与池生命周期解耦（F3）· sync 子代理面（F6）· 计数 / 上限（无新增）。

#### 6.27.12.5 接口契约（改前 → 改后）

**A. `thincoder-core/agent-tools/async-settle.mjs`（293 行 → ~299 行）**

```js
// 改前（:278-281 公共尾 ④）
  entry._settleSeq = (parent._asyncSettleSeq = (parent._asyncSettleSeq ?? 0) + 1)
  entry._settle?.()
  for (const w of parent._asyncWaiters?.splice(0) ?? []) { try { w() } catch { /* noop */ } }

// 改后（抽单点——settle 尾 / 上行 ask 两处调用；循环体逐字）
  entry._settleSeq = (parent._asyncSettleSeq = (parent._asyncSettleSeq ?? 0) + 1)
  entry._settle?.()
  wakeAsyncWaiters(parent)

/** 唤醒挂起驱动单点（settle 尾 / 上行 ask 两处调用；读经 `carrierField` 吸收）。 */
export function wakeAsyncWaiters(parent) {
  const list = carrierField(parent, "_asyncWaiters")
  for (const w of list?.splice(0) ?? []) { try { w() } catch { /* noop */ } }
}
```

▸ **语义差分显式声明**：循环体逐字；唯一差分 = 读径由 `parent._asyncWaiters` 改 `carrierField(parent, "_asyncWaiters")`（父字段优先、缺则载体）——**严格超集**（父字段在场路径零差分；今日「父字段缺 + 载体有」= 漏唤醒 ⇒ 挂起僵死至下次用户输入，本点顺带补齐）。

**B. `thincoder-core/agent-tools/parent-channel.mjs`（209 行 → ~231 行）**

```js
// 新导出（谓词单点——三驱动第 2 步判据共用）
/** 父侧是否存在「未 drain 的 ask」（唤醒 / 开轮判据单点；载体经 carrierField 吸收）。 */
export function upstreamWaiting(carrier) {
  const q = carrierField(carrier, "_childUpstream")
  return Array.isArray(q) && q.some((e) => e.kind === "ask")
}

// pushChildUpstream 尾部（唯一激活点——入队 + 日志之后；同步，无 await）
  if (kind === "ask") wakeAsyncWaiters(parent)   // import 自 ./async-settle.mjs（既有边，零新增静态边）
```

**C. `thincoder-core/agent/suspension.mjs`（234 行 → ~242 行）**——`:187` 判据 + 旗标贯通：

```js
// 改前
        if ((carrier._pendingAsyncResults?.length ?? 0) > 0) {
          const afterRun = consumedByRun()
          hooks.onDigest?.("start", backgroundCounts(carrier))
          try { await runTurn("", { autoTurn: true }) }
// 改后
        const upstream = upstreamWaiting(carrier)   // 静态 import（同 :29 async-settle 先例）
        if ((carrier._pendingAsyncResults?.length ?? 0) > 0 || upstream) {
          …
          try { await runTurn("", { autoTurn: true, upstreamTurn: upstream }) }
```

**D. `thincoder-cli/src/tui/suspension-drive.mjs`（301 行 → ~313 行）**——`digestTurn`（`:159-174`）加第三档提示行 + 旗标；`:231` 判据同式：

```js
// 改前（:231）
      if (pendingFamiliesNonEmpty(agent)) { await digestTurn(ctx) … }
// 改后
      const upstream = upstreamWaiting(agent)
      if (pendingFamiliesNonEmpty(agent) || upstream) { await digestTurn(ctx, upstream) … }
// digestTurn：manual 档提示行三分（既有两档 + `[auto-turn: answering a subagent's in-flight message…]`）；
//             runAgentTurn(ctx, "", { autoTurn: true, upstreamTurn: upstream, skipSession: true })
```

（`upstreamTurn` 与 `autoTurn` 同径贯通到核 `runAgent`——**修正轮 1 补跳后的实际链路（发现 1）**：CLI 驱动 `runAgentTurn(ctx, "", { autoTurn, upstreamTurn, skipSession })`
→ `thincoder-cli/src/tui/agent-turn.mjs:71` 解构补 `upstreamTurn` → 同档 `:147` opts 字面量补 `upstreamTurn`
→ 核 `thincoder-core/agent.mjs:96` 签名解构读 `opts.autoTurn` / `opts.upstreamTurn`、`:124` 落 `_inAutoTurn`（**原「同径贯通」句在补跳前不成立**——CLI 档曾丢弃该旗标）；实证 = `_inAutoTurn` 门在 CLI manual 档生效。）

**E. `thincoder-core/agent.mjs`（436 行 → ~441 行）**——`:96` 读 `opts.upstreamTurn`（**修正轮 1 收正（发现 3）**：原记 `:62` 实为 `createAgent` 参数表；opts 读点 = `runAgent` 签名解构 `:96`）；`:124` 落 `_inAutoTurn`；`:162` 域提醒选择（`upstreamTurn` → `UPSTREAM_TURN_DOMAIN`，否则 `AUTO_TURN_DIGEST_DOMAIN`；皆限 manual 档 `!getAuto()`）。

**F. `thincoder-core/agent/helpers.mjs`（383 行 → ~386 行）**——新增导出 `UPSTREAM_TURN_DOMAIN`（文本 = §6.27.12.8 逐字；**内容权 = 父侧**）。

**G. `thincoder-vscode/src/agent.mjs`（485 行 → ~487 行）**——端壳 depth-0 循环的**消费点（drain）** + 载体表补款 + 域文本组合调用（常量块外提至 L ⇒ 净移出 8 行）：

```js
// ① 载体表（thincoder-vscode/src/agent.mjs:41-45）12 → 14 款（+ `_childUpstream` / `_childUpstreamSeq`
//     ——进 `for (const f of CARRIER_FIELDS)` :146-152 的访问器绑定；不预建容器）
// ② run 起、主循环之前（仿核 thincoder-core/agent.mjs:195）——动态 import，模块缓存
  const { drainChildUpstream } = await import("@thincoder/core/agent-tools/parent-channel.mjs")
// ③ 循环头（thincoder-vscode/src/agent.mjs:179）——紧随 `opts.turnInput?.()` 消费段（:193-198）；
//     核 thincoder-core/agent.mjs:223-225 同址反向（consumeInjected → drain）
  drainChildUpstream(agent)     // 子→父在飞消息（§6.27）；空队列 no-op——零历史变更
// ④ 旗标读点（:62 邻位）+ 域文本组合调用（:125-127）——组合单点 = L（核基座 + 端 overlay）
  const upstreamTurn = opts.upstreamTurn === true
  if ((autoTurn || upstreamTurn) && !getAuto()) {
    history.push({ role: "user", content: composeTurnDomain(upstreamTurn), transient: true })
  }
```

**为什么是动态 import（非静态）**：`thincoder-core/agent-tools/parent-channel.mjs` 的**静态闭包实测可达 `node:sqlite`**（本席实测：126 档，`node:sqlite` 在 builtins 列——经 `thincoder-core/agent-tools/async-settle.mjs`）⇒ 静态引会破端壳静态闭包机判
（`thincoder-vscode/test/engine-floor-guard.test.mjs:129-155` W8 契约②）。**零新增静态边**——与 `thincoder-vscode/src/extension/suspension.mjs:73` 同款先例。

**H. `thincoder-vscode/src/extension/suspension.mjs`（397 行 → ~409 行）**——等待单点**零改**（W13 已双载体注册 `_asyncWaiters`：`thincoder-vscode/src/extension/suspension.mjs:171-191`）；第 2 步判据 + 旗标 + 日志标签：

```js
// 会话进入（while 之前，:257 邻位）：谓词取一次——动态 import（同上，W8 契约②）
  const { upstreamWaiting } = await import("@thincoder/core/agent-tools/parent-channel.mjs")
// 第 2 步（改前 :283-284）
  const pendingN = history._pendingAsyncResults?.length ?? 0
  const upstream = upstreamWaiting(history)
  if (pendingN > 0 || upstream) {
    … logEvent("digest:start", { pendingN, ...(upstream ? { upstream: true } : {}) })
    if (pendingN > 0) panel._panel?.webview.postMessage({ type: "digest", status: "start", n: pendingN })  // webview 面零改
    await entry.runTurn({ autoTurn: true, text: "", upstreamTurn: upstream })
    … logEvent("digest:end", { pendingN: left, ms: …, ...(upstream ? { upstream: true } : {}) })
```

谓词载体 = `history`（与 `:283` 同行读的 pending 容器**同一对象**）；写侧（核 `upstreamHolder`）与读侧（核 `carrierField`）经访问器 + 载体别名命中**同一容器**——两读点等价（`history._childUpstream` ≡ `panel._agent._childUpstream`）。

**I. 旗标贯通链（VSC 三档——每档一处透传）**：`thincoder-vscode/src/extension/panel-turn-stages.mjs`（`:156-158` `runTurn` 闭包解构 + 透传）→ `thincoder-vscode/src/extension/panel-chat.mjs`（`:87` opts 解构 + `:243` deps 注入）→
`thincoder-vscode/src/extension/panel-turn-loop.mjs`（`:60` deps 解构 + `:65-80` `ro.upstreamTurn`）——末端 = 端壳 `runAgent` 的 `opts`（G ④ 读点）。**参照 CLI**：`runAgentTurn(ctx, "", { autoTurn: true, upstreamTurn, skipSession: true })`——VSC 的三跳 = 端壳自有循环的固有多层，非新面。
（CLI 侧另有**两跳**（**修正轮 1 补——发现 1**）：`thincoder-cli/src/tui/agent-turn.mjs:71` 解构 → 同档 `:147` opts 字面量 ⇒ 核 `runAgent` 才实收该旗标。）

**J. `thincoder-vscode/src/agent/setup-reminders.mjs`（134 行 → ~136 行）**——核单源转口表（W15，`:31-40`）**增两名**：`AUTO_TURN_DIGEST_DOMAIN` + `UPSTREAM_TURN_DOMAIN`（自核面 `thincoder-core/agent/helpers.mjs` 转口——端侧**零自持副本**；两名 = 端侧域文本组合的两个基座，消费点 = L）。

**K. `thincoder-cli/src/tui/suspension-drive.mjs`（301 行 → ~315 行）**——承父侧同轮裁定 ④「**宿主日志加 `upstream: true`** 区分唤醒轮与 digest 轮」（**两端同规**）：`digestTurn(ctx, upstream)` 内
`logEvent("digest:start", { pendingN: pend0, ...(upstream ? { upstream: true } : {}) })` / `logEvent("digest:end", { …, ...(upstream ? { upstream: true } : {}) })`（CLI 面两点同式；核 `thincoder-core/agent/suspension.mjs` 无 `logEvent`——宿主钩子 `hooks.onDigest` 承载，本项零触）。

**L. `thincoder-vscode/src/agent/turn-domains.mjs`（拟新增——拆分计划落地 + 端侧域文本组合单点）**

端侧域文本的**唯一组合点**（digest 轮与 ask 唤醒轮共用——选择仅换基座，端 overlay 恒在场）：

```js
// ① 核单源转口（自 ./setup-reminders.mjs 的 W15 转口表取——端侧零自持基座副本）
import { AUTO_TURN_DIGEST_DOMAIN, UPSTREAM_TURN_DOMAIN } from "./setup-reminders.mjs"

// ② 端 overlay（端自持述句块——逐字搬迁自端侧既有变体的端特有部分；零新撰 / 零改写；
//    字面 as-of 源 = thincoder-vscode/src/agent.mjs:29-30；逐字见 §6.27.12.12-④）
export const VSC_TURN_OVERLAY = "…"

// ③ 组合单点（入参 = 轮型旗标；不出基座串 ⇒ 调用方无从绕过 overlay——fail-closed）
export function composeTurnDomain(upstreamTurn) {
  const base = upstreamTurn ? UPSTREAM_TURN_DOMAIN : AUTO_TURN_DIGEST_DOMAIN
  return base.endsWith("]") ? `${base.slice(0, -1)} ${VSC_TURN_OVERLAY}]` : `${base} ${VSC_TURN_OVERLAY}`
}
```

- **组合形态 = 收尾括号内拼接**：端 overlay 落于基座正文之后、闭合 `]` 之前（`base.endsWith("]")` 为真 ⇒ 去尾插入；为假 ⇒ 尾接退化——端述句恒在场，不静默丢弃）。
- **为什么不是另一边（括号外尾部追加 / 句内锚点插值）**：① 括号外追加 ⇒ overlay 落在 `]` 之外，破 system reminder 括号形态（两基座皆以 `]` 收尾）；② 句内锚点插值 ⇒ 端侧须持基座句串锚点，而基座文本内容权在核侧（§6.27.12.8）——核侧改字面即静默失效（漂移面）。
- **核单源守护**：本档零核基座文本字面（基座只经转口 import 取）——机检锚 = §6.27.12.9 T-VS-U5 / §6.27.12.10 U12；端 overlay 住端侧 ⇒ **端特有述句不进核**。
- **W8 契约②（零新增静态边）**：核 `thincoder-core/agent/helpers.mjs` 已在端壳静态闭包内（`thincoder-vscode/src/agent/setup-reminders.mjs:31-42` 转口——包名导入符形态）⇒ 本档不引新核侧静态边，`node:sqlite` 仍不入端壳静态链。
- **行数收益**：`thincoder-vscode/src/agent.mjs` 原常量块（`:23-30`，含 JSDoc）随本档外提 ⇒ 该档净移出 8 行（拆分触发面清零——§6.27.12.7 尾距注）。

#### 6.27.12.6 方案选型对比

| # | 候选 | 判据逐项评估 | 结论 |
|---|---|---|---|
| **a** | **复用既有 async 唤醒通道（W1 `_asyncWaiters`）+ 扩第 2 步开轮谓词**（+ auto 轮新旗标与域文本） | ① 唤醒零新字段 / 零新注册（三驱动已注册）② 谓词 = 1 行 × 3 驱动（核单点导出）③ 回复路径既有（`send` 控制类豁免，digest 内可调）④ **提示词面零改**（承诺变真）⑤ 非阻塞地基零改 ⑥ 面数 = **7 档 + 4 用例档**（**修正轮 1 收正**：+ CLI 贯通档 `agent-turn.mjs` · + 核新测档） | **选定** |
| b | 把 ask 并入 `_pendingAsyncResults`（复用 digest 机器，谓词零改） | ① 破 §6.27.2 载体分离裁决（D-UC1/D-UC5——`_childUpstream` ≠ 终态报告容器）② 注入点二义（轮首注入 vs 轮头 drain）③ 回收 / 冻结 / `injectAsyncResult` 族分发全需新分支 ④ 失败面（F3 / F9）注脚语义被污染 | 否决 |
| c | 新造唤醒钩子（宿主句柄注册字段，如 `parent._upstreamWake`） | ① 比 a 多 3 宿主注册 + 1 字段 + 清场生命周期面（挂起退出 / 面板销毁 / 会话切换三路）② 只买到「唤醒原因可区分」这点内部面子（返回值今日无消费方——`thincoder-core/agent/suspension.mjs:208-209` 只判 `aborted`） | 否决 |
| d | **降级 note-only**（不改机制，把承诺改准） | 0 机制改动；但「在飞纠偏」需求主线（`:210`）作废、F-UC1 / F-UC2 / F-UC6 须同步收紧（**需求改判 = 父侧笔**） | **备选（不落——见 §6.27.12.11-6 备份路径）** |
| e | 子侧批量化提问（"攒够再问"） | 提示词面纪律、零结构收益——首个 ask 仍等父侧拐点，且子代理无从知晓拐点在何时 | 否决 |
| f | 同步窗口（`notify_parent` 阻塞 N 秒等父回合） | 破非阻塞地基（N1 / D-UC3「子代理机制上永不等」）——**出界**（批档禁触面） | 否决 |

**为什么不是另一边（d）**：a 的代价面 = **7 档小改 + 1 段文本 + 4 用例档**（**修正轮 1 收正**），全部落在既有单点上；d 的代价 = 需求承诺降级（用户 2026-09-19 23:11 确认的验收目标 `:220` 整条作废）。**残余代价如实登记**：a 下答复到达耗时 = 一个父侧轮（本机实测 ≈ 6.8–64.3 s）；子代理剩余运行时长若短于该轮，答复仍在子代理终态后到达 ⇒ 走 F9 / F-UC3 兜底。**收益面**：恒迟到 ⇒ 大概率及时（窗口从「子代理自身 settle」前移到「ask 入队 + 一个父侧轮」）。

#### 6.27.12.7 受影响文件清单（行数口径 = `find /c /v ""`（≡ `wc -l`）；现量 = as-of 2026-09-19 23:2x 实测）

| # | 文件 | 现量行数 | Δ（估） | 变更类型 | 说明 |
|---|---|---|---|---|---|
| 1 | `thincoder-core/agent-tools/async-settle.mjs` | 293 | +6 | 重构（抽单点） | `wakeAsyncWaiters(parent)` 新导出；settle 尾 `:281` 改调用同函数（循环体逐字） |
| 2 | `thincoder-core/agent-tools/parent-channel.mjs` | 209 | +22 | 新导出 + 1 调用 | `upstreamWaiting(carrier)` 谓词单点；`pushChildUpstream` ask 分支尾唤醒；文件头注同步 |
| 3 | `thincoder-core/agent/suspension.mjs` | 234 | +8 | 判据 + 旗标贯通 | `:187` 谓词；`runTurn("", { autoTurn: true, upstreamTurn })`；import |
| 4 | `thincoder-core/agent/helpers.mjs` | 383 | +3 | 新常量（**文本 = 父侧内容权**） | `UPSTREAM_TURN_DOMAIN`（§6.27.12.8 逐字；父侧确认后落笔） |
| 5 | `thincoder-core/agent.mjs` | 436 | +5 | 域文本选择 | `:96` 读旗标（**修正轮 1 收正**——原记 `:62`）；`:124` 落 `_inAutoTurn`；`:162` 邻位二选一 |
| 6 | `thincoder-cli/src/tui/suspension-drive.mjs` | **316**（实测） | **+15（实测）** | 判据 + 提示行 + 旗标 | `:245` 谓词（**先于**池空退出判 `:259`）；`digestTurn` 第三档提示行 `:173`；`upstreamTurn` 贯通 `:183`（父侧直接执行 · 可 revert） |
| 7 | `thincoder-core/test/parent-channel.test.mjs` | 291 | **0（改行）** | 用例（**修正轮 1 拆分**） | T18–T22 **移出**（→ 行 23）；本档仅 `:272` 导出面名单补 `upstreamWaiting`（一行就地改）；余 T1–T17 原位 |
| 8 | `thincoder-core/test/suspension.test.mjs` | 213 | +35 | 用例（假 carrier 纯 Node 驱动） | ask → 唤醒 → 开轮；note → 零轮零退出 |
| 9 | `thincoder-cli/test/input-lock.test.mjs` | **368**（实测） | **+101（实测）** | 用例（复用 `driveRig` `:137-164`） | T-CL-U1 / U2（驱动判据 + 提示行 + `runAgent` 桩第 4 参 `upstreamTurn` `:251`）；**档位声明**：越 300 **advisory** 线（368）——CLI 无同族机检门 ⇒ **不拆**（触发式计划见越线核查；父侧直接执行 · 可 revert） |
| 10 | `docs/core/design/AGENT-LOOP-SUBAGENT.md` | 1932（**as-of 读数**） | +~130 | 设计档（本节） | §6.27.12 全节 + 变更记录一行；**本批不追值**（见尾注④） |
| 11 | `docs/core/design/AGENT-LOOP.md` | 519（**as-of 读数**） | +~12 | 设计档（一致性对齐） | §2.3 载体字段集 11 → **13**（补 `_childUpstream` / `_childUpstreamSeq`）+ 唤醒栓兑现点改指 + 变更记录一行；**本批不追值**（见尾注④） |
| 12 | `thincoder-vscode/src/agent.mjs` | 485 | **−8 / +~10** | 端壳 drain + 载体两字段 + 旗标 + 域文本组合调用 | 域文本常量块（`:23-30`）外提至行 21（净移出 8 行）；循环头 `drainChildUpstream(agent)`（动态 import 核单源——W8 契约②）；`CARRIER_FIELDS` 12 → 14 |
| 13 | `thincoder-vscode/src/extension/suspension.mjs` | 397 | +~12 | 第 2 步判据 + 旗标 + 日志标签 | `upstreamWaiting(history)`（动态 import）；`runTurn({ autoTurn, upstreamTurn })`；`digest:start` / `digest:end` 载荷 |
| 14 | `thincoder-vscode/src/extension/panel-turn-stages.mjs` | 177 | +2 | 旗标透传 | `:156-158` `runTurn` 闭包解构 + 透传 |
| 15 | `thincoder-vscode/src/extension/panel-chat.mjs` | 252 | +2 | 旗标透传 | `:87` opts 解构 + `:243` deps |
| 16 | `thincoder-vscode/src/extension/panel-turn-loop.mjs` | 161 | +2 | 旗标透传 | `:60` deps 解构 + `ro.upstreamTurn` |
| 17 | `thincoder-vscode/src/agent/setup-reminders.mjs` | 134 | +2 | 核单源转口 | `AUTO_TURN_DIGEST_DOMAIN` + `UPSTREAM_TURN_DOMAIN`（两个基座；端侧零自持副本——§6.27.12.5 J） |
| 18 | `thincoder-vscode/test/upstream-parity.test.mjs` | **262**（实测） | **+262（新建）** | 用例（新档） | T-VS-U1–U7（夹具自持，`suspFixture` 手法同 `thincoder-vscode/test/async-parity.test.mjs:245-260`；U7 = 组合同规） |
| 19 | `thincoder-vscode/test/files.mjs` | 101 | +1 | 入册 | 新档登记（未登记 = 不跑——`thincoder-vscode/test/run.mjs:49-51` 自检） |
| 20 | `thincoder-vscode/test/integration/scenario-03-subagent-lifecycle.test.mjs` | 266 | +1（改行） | 夹具同步 | `:48` 字段副本 12 → 14（T-AF16 对位锁 `:263-266`——不改即红） |
| 21 | `thincoder-vscode/src/agent/turn-domains.mjs` | **31**（实测） | **+31（新建）** | 新档（拆分计划落地 + 端侧域文本组合单点） | 核基座转口（两名）+ `VSC_TURN_OVERLAY` + `composeTurnDomain(upstreamTurn)`——§6.27.12.5 L |
| 22 | `thincoder-cli/src/tui/agent-turn.mjs` | 343 | **0（两行就地改）** | 旗标贯通（CLI 跳——**修正轮 1 补入**） | `:71` 解构补 `upstreamTurn` + `:147` opts 字面量补 `upstreamTurn`（承接发现 1——CLI 驱动与核 `runAgent` 之间的漏跳）；行号置尾以保本表既有行序 |
| 23 | `thincoder-core/test/parent-channel-upstream.test.mjs` | **95**（实测） | **+95（新建）** | 用例（新档——**修正轮 1 拆分落地**） | T18–T22（含档头 / import 面 ≈10–12 行）；`thincoder-core/test/run.mjs:37` 单层 `test/*.test.mjs` glob 自动收集（无需入册） |

**越线核查（修正轮 1 收正——原「零新增越线档」句不实，见发现 2）**：

① **核侧硬门**（`thincoder-core/test/core-hygiene.test.mjs:109-123`——`walk()` 覆盖 `test/`、注册表 `:39-50` 零 test 条目 ⇒ >300 未登记 = 红，且 U5 重点族含 `core-hygiene`）：`parent-channel.test.mjs` 291 + 45 会越线 ⇒ **已拆**（T18–T22 → 行 23 新档；`thincoder-core/test/run.mjs:37` 单层 glob 自动收集）。

**登记 `SOFT_LINE_REGISTRY` 路被否**（二选一之另一支）：注册表 33 档全为源档、零 `test/` 条目；登记动作 = 产品码 `core-hygiene.test.mjs` 改 + 设计档 `CORE-UNIFICATION.md` §2.8.1 拆分计划补登——两者皆出本批写域，且 test 档无「拆分计划」面（2026-09-15 批已裁「勿以为 `test/` 免档位」）。

② **CLI 侧 advisory 线**（无同族机检门——`SOFT_LINE_REGISTRY` 全仓仅核档一处）：`input-lock.test.mjs` 267 → **368（实测）** 越 300 **advisory** ⇒ **拆分立场 = 本批不拆**（该档 `driveRig` 夹具 `:137-164` 为本档自持，外提即改既有夹具结构；先例 = 2026-09-18-toolface-fixes §2「端侧测试档存量超线 ⇒ 拆分另议」——CLI 现役 >300 测试档 **16 档**、最大 488）。

**拆分计划（触发式）**：该档下次实质改动，或 CLI 侧引入档位门时，把 `suspensionSession` 直驱段（`:134-267`）连 `driveRig` 一并外提；**消解条件 = 上述触发之一**。

③ 最大档 `thincoder-core/agent.mjs` 436 → ~441（≤500 硬限）；`parent-channel.mjs` 209 → ~231（守 300 软线）⇒ **核侧零新增越线档**；VSC 侧零新增（见下尾距注 + 拆分计划）。

④ **读数口径（修正轮 1 · 发现 8 处置）**：① `input-lock.test.mjs` 取实测 **267**（原记 268 = 口径差）；② `docs/core/design/AGENT-LOOP.md` **519**（行 11）、③ `thincoder-core/agent-tools/subagent-spawn.mjs` **484**（§6.14 `:616`）、④ 本档自持 **1932**（行 10）= **as-of 读数**（批档 / 现盘另记 ~535 / 473 / newline 1931——差已登记）⇒ **本批不追值**，统一归实现轮。

**VSC 侧尾距（拆分计划已落地）**：`thincoder-vscode/src/agent.mjs` 485 → ~487（距 500 硬限 ~13 行——N-P3 口径）——域文本常量族（`:23-30`）外提至行 21 `thincoder-vscode/src/agent/turn-domains.mjs`（拟新增），该档净移出 8 行，抵消本批他项净增；拆分触发面清零（判据 = `wc -l`（≡ `find /c /v ""`）读数）。
`thincoder-vscode/src/extension/suspension.mjs` 397 → ~409（>300 咨询线、≤500 硬限）——读数登记面 = `docs/vsc/design/VSC-DEBT.md` §12.1（**登记归父侧派单**，本席不越域）。

#### 6.27.12.8 唤醒轮域文本（逐字建议——**内容权 = 父侧**；本档只出文本）

落点 = `thincoder-core/agent/helpers.mjs`（常量）+ `thincoder-core/agent.mjs:162` 邻位（选择）；manual 档注入（`transient: true`——同 `AUTO_TURN_DIGEST_DOMAIN` 注入口）：

（下方按行宽折行展示；**实现时 = 单行字符串常量**——逐字拼接，无换行）

```
[System reminder: auto-turn — a running subagent sent you an in-flight message (shown below). No user message is waiting.
Decide it now and reply with subagent action:'send' (id + message) — the child consumes the reply at its next turn boundary and keeps working
on the unaffected parts; if the message needs no answer, say so in one line and move on. If finished subagent reports are also present above,
summarize them as usual in the same turn. Do not start new work: FORBIDDEN this turn (mechanically enforced): modifying files, bash/execute/verify,
spawning subagents, asking questions — those need a real user message. End the turn once the reply is sent.]
```

**指位约束（修正轮 1 · 发现 4——上方改述 = 改述建议，定稿权 = 父侧）**：域文本先注入（`thincoder-core/agent.mjs:163-165`，循环前）、在飞消息由循环头 drain 追加（`:225`）⇒ 消息落于域文本**之后（下方）**——逐字面**不得**以「above / 上方」指在飞消息（原「named in the reminder above」与注入次序相抵）；末段「finished subagent reports … above」指 run 首注入的已结算报告（`:111-122`）——用法正确、保留。

**双面纪律**（承 §6.27.8 先例）：英文运行面（核 `helpers.mjs`）+ 中文权威面的对位文本归父侧同轮落笔；本档只登记落点与逐字建议。

#### 6.27.12.9 用例表（正常 / 边界 / 错误）

| # | 用例 | 输入 | 期望输出 | 回指 |
|---|---|---|---|---|
| T18 | 正常·ask 入队即唤醒 | 父挂起（`_asyncWaiters` 已注册）· 子入队 `{kind:"ask"}` | 等待栓被兑现（`_asyncWaiters` 清空 + 唤醒回调恰 1 次）；入队同步返回（零 await） | 批 §2 条目 1 |
| T19 | 边界·note 不唤醒 | 同 T18 但 `{kind:"note"}` | 唤醒回调 **0 次**；队列长度 1 | 条目 1 / 边界 7 |
| T20 | 边界·无等待栓（父侧忙 / 已退出） | `_asyncWaiters` 缺省 / 空数组 | ask 入队成功、唤醒 no-op（零抛错、队列长度 1） | 条目 1 / F11 / F12 |
| T21 | 谓词真值 | `[]{ }` / `[{kind:"note"}]` / `[{kind:"ask"}]` / `[{kind:"note"},{kind:"ask"}]` 四形 | `upstreamWaiting` = false / false / true / true | 条目 2 |
| T22 | 结构单点（机检） | 源文本 | `async-settle.mjs` 内 `wakeAsyncWaiters` 定义 1 处 + `splice(0)` 全档仅在该函数内；三驱动第 2 步含 `upstreamWaiting(`；`agent.mjs` 的 `drainChildUpstream(agent)` 仍恰 1 处（既有断言 `parent-channel.test.mjs:130-133` 不破） | 条目 1 / 2 / 零回归 |
| T23 | 正常·核驱动开轮（假 carrier） | `startSuspension`：池内 1 running + `_childUpstream` 含 ask；假 `runTurn` 记录 `(text, opts)` 并清池 | `runTurn("", { autoTurn: true, upstreamTurn: true })` 恰 1 次；`res.upstreamTurn === true` | 条目 2 |
| T24 | 边界·核驱动 note 不开轮 | 同上但 `[{kind:"note"}]` | 零 `runTurn` 调用；池空即退出（`reason: "idle"`） | 条目 2 / 边界 7 |
| T-CL-U1 | 正常·CLI 驱动开轮 + **旗标贯通（修正轮 1 补——发现 1）**（`driveRig`） | `agent._childUpstream = [{kind:"ask",…}]` + 池内 1 running；桩 `ctx.runAgent`（记录第 4 参 opts） | 桩被调 1 次（`text === ""`——auto 轮）；**桩第 4 参 `opts.upstreamTurn === true`**（旗标未被 CLI 跳丢弃——可机检）；提示行含 `in-flight message` | 条目 4 |
| T-CL-U2 | 边界·CLI 驱动提示行三分 + 不误开轮 | ① 仅 note ⇒ 桩 0 次 ② manual 档 ask ⇒ 第三档提示行字面 | 字面断言（`/auto-turn: answering a subagent's in-flight message/`） | 条目 4 / 条目 3 |
| T-VS-U1 | 正常·端壳驱动开轮（`thincoder-vscode/test/upstream-parity.test.mjs`） | 桩面板 + `history` 内 `_childUpstream = [{ kind:"ask", … }]` + 池内 1 running；桩 `runTurn` 记录 `(opts)` | 恰 1 次调用且 `opts = { autoTurn: true, text: "", upstreamTurn: true }` | 条目 9 |
| T-VS-U2 | 正常·注入内容非空（补 F8 病征） | 同 T-VS-U1；桩 `runTurn` 内调核 `drainChildUpstream(history)` | `history` 尾条 user 消息含 `ask · <role>#<id>: <message>`（**非空**）；队列消费即清（`_childUpstream.length === 0`） | 条目 7 |
| T-VS-U3 | 正常·ask 唤醒驱动开轮（端到端·含载体别名路） | 不 await 地起 `suspensionSession`（会话进第 4 步等待）→ 一拍后 `pushChildUpstream({ parent: { history }, kind: "ask" })`（合成 parent 形——写侧别名） | 等待栓被兑现 ⇒ 驱动重入 ⇒ 第 2 步真 ⇒ 桩 `runTurn` 恰 1 次；日志含 `upstream: true`；会话自然退出 | 条目 9 |
| T-VS-U4 | 边界·note 不唤醒不开轮 | 同上但 `{ kind:"note" }` + 池空 | 桩 `runTurn` 0 次；会话退出（`history._suspended === false`）；队列长度 1（留队等下拐点） | 边界 7 |
| T-VS-U5 | 结构机检（端侧名集 + 消费点 + 谓词 + 组合单点） | 源文本 | 生产 `CARRIER_FIELDS` 含两款（夹具副本 == 生产表——既有 T-AF16 锁，本批同步）；`thincoder-vscode/src/agent.mjs` 含 `drainChildUpstream(agent)` 恰 1 处 + `composeTurnDomain(` 调用恰 1 处 + 动态 import 形态（静态引即红——W8 契约②）；`thincoder-vscode/src/extension/suspension.mjs` 含 `upstreamWaiting(`；`thincoder-vscode/src/agent/turn-domains.mjs`（拟新增）含 `composeTurnDomain(` 定义恰 1 处 + `VSC_TURN_OVERLAY` ∧ **零核基座文本字面**（核单源守护） | 条目 7 / 8 / 9 |
| T-VS-U6 | 正常·回复可达（`send` → runs 子代理） | 端侧载体形（`{ history }` 合成父 + 池挂 history）+ `executeSendAction({ id, message }, ctx)` | `delivered` + 条目 `_injected` 呈追加（下回合边界消费——回复路径零改） | 条目 7 / §6.27.12.4 ① 回复可达性 |
| T-VS-U7 | 正常·组合同规（两轮构成差异项 = 0） | 端侧纯函数两分支（`composeTurnDomain(false)` / `composeTurnDomain(true)`——`thincoder-vscode/src/agent/turn-domains.mjs`（拟新增）） | 两返回值：① 各以对应核基座（`AUTO_TURN_DIGEST_DOMAIN` / `UPSTREAM_TURN_DOMAIN`）逐字起头；② 均含 `VSC_TURN_OVERLAY` 全串（逐字）；③ 均以 `]` 收尾且端 overlay 在收尾括号内；④ 两返回值的 overlay 段逐字相同（差异项 = 0） | 条目 9 / §6.27.12.12 ④ |

**用例档位（修正轮 1 · 发现 2）**：T18–T22 = `thincoder-core/test/parent-channel-upstream.test.mjs`（拟新增——拆分落地，行 23）；T23 / T24 = `thincoder-core/test/suspension.test.mjs`；T-CL-U1 / U2 = `thincoder-cli/test/input-lock.test.mjs`；T-VS-U1–U7 = `thincoder-vscode/test/upstream-parity.test.mjs`（拟新增）。

#### 6.27.12.10 验收标准（逐条回指——可机检 · Windows / cmd.exe）

| # | 判据（cmd.exe 可跑） | 回指 |
|---|---|---|
| U1 | `cd thincoder && node --test thincoder-core/test/parent-channel.test.mjs thincoder-core/test/parent-channel-upstream.test.mjs` 全绿（**T18–T22 在新档**——修正轮 1 拆分；原档导出面断言 `:268-279` 更新后含 `upstreamWaiting`、常量仍**恰 3 个**） | 批 §2 条目 1 / 2 |
| U2 | `cd thincoder && node --test thincoder-core/test/suspension.test.mjs` 全绿（含 T23 / T24——假 carrier / 假 runTurn 纯 Node 驱动，不加载端模块） | 条目 2 |
| U3 | `cd thincoder && node --test thincoder-cli/test/input-lock.test.mjs` 全绿（含 T-CL-U1 / U2——`driveRig` 直驱 `suspensionSession`，不触网） | 条目 4 |
| U4 | 结构机检（ASCII 令牌，单行 `node -e`；四查：两定义点 + 两调用点）：`node -e "const fs=require('fs');const f=(p,s)=>{if(!fs.readFileSync(p,'utf8').includes(s))throw new Error(p+' missing: '+s)};f('thincoder-core/agent-tools/parent-channel.mjs','export function upstreamWaiting');f('thincoder-core/agent-tools/async-settle.mjs','export function wakeAsyncWaiters');f('thincoder-core/agent/suspension.mjs','upstreamWaiting(');f('thincoder-core/agent-tools/parent-channel.mjs','wakeAsyncWaiters(')"` | 条目 1 / 2 |
| U5 | 零回归（**按包拆分——修正轮 1 · 发现 7**；仓根无 `package.json`）：cwd = `D:\teamcode\thincoder` ⇒ `cd thincoder-core && npm test` + `cd thincoder-cli && npm test` **双绿**——重点族落点：核包 = `core-hygiene` / `family-tools`；CLI 包 = `async-settle` / `queued-stop` / `input-lock` / `attention-state` / `subagent-observe-send` / `doc-check`（机检本体仍 = 仓根 `node scripts/doc-check.mjs`——U8） | 不变量 ⑤ |
| U6 | 零新增计数 / 上限：`parent-channel.mjs` 导出常量集不变（3 个）；三驱动第 2 步**无新增数值常量** | 不变量 ③ |
| U7 | 提示词面零行：`git diff --stat -- thincoder-core/prompts docs/core/design/prompts` 输出为空（主分支不需改承诺） | 批档禁触面 |
| U8 | 文档一致：`node scripts/doc-check.mjs` 输出中**本批触碰档零新增**悬空锚 / 行宽条目（基线（修正轮 1 复测，cwd = `thincoder/`）= **6 悬空 / 18 行宽**——存量，非本批引入；初期轮记 17 = as-of 读数；本批落地后复测原始读数 = **6 / 19**，**剔除他批同期写入 1 行（`docs/core/design/PROMPT-SYSTEM.md:293`）后 = 6 / 18** ⇒ 本批写域**净增 0**；本批触碰两档零悬空 / 零行宽条目）；§6.27.12 ↔ 批档 §2 ↔ 需求档 §4.12 三方条目同源 | 批档自身约束 |
| U9 | VSC 载体检修：`cd thincoder-vscode && node --test test/upstream-parity.test.mjs test/integration/scenario-03-subagent-lifecycle.test.mjs` 全绿（含 T-VS-U1–U7 + 夹具同步） | 条目 7 / 8 / 9 |
| U10 | VSC 零回归：`cd thincoder-vscode && npm test` 全绿（单元 + 集成两清单；启动自检含无漏登记反查） | 不变量 ⑤ |
| U11 | 端壳静态闭包不破：`cd thincoder-vscode && node --test test/engine-floor-guard.test.mjs` 全绿（W8 契约②——`node:sqlite` 不入静态链） | 不变量 ① / ⑤ |
| U12 | 端侧结构机检（ASCII 令牌，单行 `node -e`；四查 + 一否定）：`node -e "const fs=require('fs');const f=(p,s)=>{if(!fs.readFileSync(p,'utf8').includes(s))throw new Error(p+' missing: '+s)};const g=(p,s)=>{if(fs.readFileSync(p,'utf8').includes(s))throw new Error(p+' must not contain: '+s)};f('thincoder-vscode/src/agent.mjs','drainChildUpstream(agent)');f('thincoder-vscode/src/extension/suspension.mjs','upstreamWaiting(');f('thincoder-vscode/src/agent/turn-domains.mjs','composeTurnDomain');f('thincoder-vscode/src/agent.mjs','composeTurnDomain(');g('thincoder-vscode/src/agent/turn-domains.mjs','[System reminder: auto-turn')"`（在 `thincoder` 根跑；末项 = 核单源守护——新档零核基座文本字面） | 条目 7 / 9 |
| U13 | 行宽门（N-P3 硬限）：`find /c /v "" thincoder-vscode\src\agent.mjs` ≤ 500（本批预测 ~487）；报告行数口径 = `wc -l`（≡ `find /c /v ""` 实测） | 拆分计划已落地（行 21） |

#### 6.27.12.11 边界（本批不做）

1. 不改非阻塞地基：`notify_parent` 仍同步返回（无等待 / 无拉取 / 无轮询导出）——N1 / D-UC3。
2. 不新增机制计数 / 上限（承用户 2026-09-18 裁定）；`UPSTREAM_*` 三常量语义与数值零改。
3. 不动 consult / depth-0 面；不动 `send` / `observe` / `status` / `cancel` / `panel` 语义与文案；不动 depth 门条文。
4. 不改 settle / digest / 用户输入三路既有唤醒语义（W1–W3）；不改 `_childUpstream` 生命周期与池解耦（F3）、sync 子代理面（F6）。
5. 不改提示词面（`prompts/**`）与 `notify_parent` 工具描述 / 返回注（主分支下承诺变真，无需改准）——**内容权 = 父侧**。
6. **降级分支（不落 · 备份路径）**：若父侧裁为 note-only 降级，则改准面 = 工具描述 `parent-channel.mjs:144-156`（`:148` 承诺句）· `ASYNC_NOTE` `:45-49` · 提示词面 `thincoder-core/prompts/common.md` + 模板 `docs/core/design/prompts/common.md`（父侧笔）· 需求 F-UC1 / F-UC2 / F-UC6 收紧（父侧笔）；机制零改。
7. **note 面（登记）**：`note` 入队**不唤醒**（§6.27.12.4 ①）⇒ 挂起期 note 仍等下一拐点——若父侧要求 note 一并唤醒，改动 = `upstreamWaiting` 谓词一行（`q.some(...)` → `q.length > 0`）+ 用例 T19 / T24 反转；**代价 = 每条 note 一次父侧轮**（轮风暴面，故默认不开）。
8. **VSC 面已并入本批（设计面；实现待实现轮落地）**：本批 VSC 写域 = 文件表行 **12–21**（源 7 档 + 新测 1 档 + 登记 1 档 + 集成夹具 1 档）；**不动** webview 面（`digest` 消息族 / `suspension` 消息族 / 文案）与提示词面——细则 = §6.27.12.12。
9. 不改需求档正文（父侧笔）；不做「父→子」新动作 / 新管子（回复路径恒 = `send`）。


#### 6.27.12.12 VSC 对位面（本批并入——用户 2026-09-19 23:23 裁定「**vsc 肯定要扩啊，否则不完整啊**」）

**回指**：需求 `docs/core/requirements/AGENT-LOOP.md` §4.12 **N4**（范围 = **核侧 + CLI + VSC 两端对位**）；台账 **#87**（VSC 端壳上行通道对位 = F8 已知面 + 另案三项）。
**本节功能**：VSC 面**落地设计**——四面 + 接口契约（§6.27.12.5 G–L）+
关键决策 + 端侧域文本组合（核基座 + 端 overlay——§6.27.12.5 L）+ 用例 / 验收（§6.27.12.9 / §6.27.12.10）+ 边界。

**① drain 面（端侧消费点）**

- **落点** = 端壳自有 depth-0 循环的**循环头**：`thincoder-vscode/src/agent.mjs:179` 循环体首段，紧随 `opts.turnInput?.()` 消费段（`:193-198`）——与核 `thincoder-core/agent.mjs:223-225`（`consumeInjected` → `drainChildUpstream`）**同址反向**（同址 = 回合边界单点；反向 = 核该处兼收父→子注入，端壳该处只收子→父在飞消息）。
- **形态 = 复用核单源**（动态 import `@thincoder/core/agent-tools/parent-channel.mjs` 取 `drainChildUpstream`；run 起取一次、循环头调用一次）——**禁另造第二实现**。
- **为什么不是另一边（端侧自持一份）**：① **写侧已在核**——入队单点 `pushChildUpstream`（`thincoder-core/agent-tools/parent-channel.mjs:88-95`）是唯一生产者，VSC 子代理经核 `runChildPipeline` → 核 `runAgent` 运行 ⇒ 端侧副本 = 第二份实现 + 第二份抬头 / 注脚文案（`endNote` 读池 + 墓碑）⇒ 漂移源（D2 单一权威源）。
  ② **同面既有先例（W13 · 2026-09-15）**：`thincoder-vscode/src/extension/suspension.mjs:68-73` / `:344-356` 已把 pending 停靠（`parkAsyncPending`）· 残余注入（`injectAsyncResult` / `injectConsultResult`）· 会诊清理
  （`cleanupConsultSessions`）改为**核单源 + 动态 import**，端侧镜像随「镜像删旧」退役；`subagent` 工具族（status / observe / send / cancel）同批同向 ⇒ 本项沿同一收敛方向。
  ③ **FR23 的适用面界定**：FR23「语义同源 · 原文自持（两端各自实现、不共用代码）」的对象 = **工程模式机制的跨端镜像**
  （`docs/core/requirements/ENGINEERING-MODE-V2.md` §13.2 / `docs/core/design/BATCH-RECORD.md` §6.1），其「不共用代码」的**前提 = 两仓分立**（跨仓 import 不可行）——
  该前提已由两仓合并批（`thincoder-cli/docs/batches/2026-09-13-TWO-REPO-MERGE.md:128` **R14**：「import 禁令删除……『语义同源 / 各写一份』保留」）撤销
  ⇒ 单仓内核包复用**不违** FR23，且**强于**「语义同源」（同一实现）。④ 端壳「自持 depth-0 循环」不是障碍——本项是**单点调用**（非把核循环搬端侧），与 W15 的「循环契约位移 = 调用期适配」同款。
  **备选（登记不采）**：端侧自持 drain 副本——收益 = 端侧可自定文案（本项无此需求）；代价 = 上文 ① 的漂移面。若父侧另裁，改动面 = 端侧新函数 + 夹具重组（本设计不预设）。
- **W8 契约②（硬）**：`thincoder-core/agent-tools/parent-channel.mjs` 静态闭包实测**可达 `node:sqlite`**（本席实测 126 档）⇒ **必须动态 import**（静态引 ⇒ `thincoder-vscode/test/engine-floor-guard.test.mjs:129-155` 即红）。

**② 载体表**

- `CARRIER_FIELDS`（`thincoder-vscode/src/agent.mjs:36-40`）**12 → 14 款**（+ `_childUpstream` / `_childUpstreamSeq`）——进 `:146-152` 访问器绑定循环；`docs/core/design/AGENT-LOOP.md` §2.3 的 VSC 绑定不变式**本批归零**（13 款全集全绑定——承接句见该档 `:114`）。
- **不预建容器**（`:139-145` 预建块**不加行**）：创建 / 借用归核单点 `upstreamHolder`（`thincoder-core/agent-tools/parent-channel.mjs:67-80`）；两读点皆有 `Array.isArray` 守卫（缺容器 ⇒ 谓词 `false` / drain 返 0——fail-closed，不抛）。
- **夹具同步（硬）**：`thincoder-vscode/test/integration/scenario-03-subagent-lifecycle.test.mjs:48` 字段副本 + T-AF16 对位锁（`:263-266` `deepEqual` 双向）——**不改即红**；`thincoder-vscode/test/integration/vsc-panel-rings.test.mjs:35` `BOUND_CARRIER_FIELDS` = **子集**断言 ⇒ 零改。

**③ 唤醒 + 开轮谓词 + 日志标签**

- **等待单点零改**：`thincoder-vscode/src/extension/suspension.mjs:163-195` 已双载体注册 `_asyncWaiters`（`:190`）——核 ask 入队尾的 `wakeAsyncWaiters(parent)` 经 `carrierField` 命中同一容器（`panel._agent` 访问器 → 共享 `history`；`:171` 的第二载体 = `susp.lines.history` = 同一数组）。**本项不新增注册点**（唤醒面 W1 复用成立）。
- **第 2 步判据**（`:283-284`）：`const upstream = upstreamWaiting(history)` + `if (pendingN > 0 || upstream)`。**谓词必须先于第 3 步池空退出**——「池空 + 队列留 ask」（子代理已 settle 且报告已消化）仍须开一轮把它 drain 出来。
- **旗标**：`entry.runTurn({ autoTurn: true, text: "", upstreamTurn: upstream })` → 三跳透传（§6.27.12.5 I）→ 端壳 `runAgent` 域文本组合调用（§6.27.12.5 G ④ / L）。
- **日志标签**（父侧同轮裁定 ④ · 两端同规）：`digest:start` / `digest:end` 载荷**条件携带** `upstream: true`（仅 ask 唤醒轮）——VSC `thincoder-vscode/src/extension/suspension.mjs:287` / `:307`；CLI 同式（§6.27.12.5 K）。**备选（未采）**：恒带布尔（`upstream: false`）——对既有 digest 轮载荷的字节零扰动优先。

**④ 端侧域文本 = 核基座 + 端 overlay（两轮同规 · 组合单点 = §6.27.12.5 L）**

- **形态**：端侧域文本 = **核基座（转口逐字——`AUTO_TURN_DIGEST_DOMAIN` / `UPSTREAM_TURN_DOMAIN`；端侧零自持基座副本）+ 端 overlay（`VSC_TURN_OVERLAY`——端特有 advisor / consult / escalate 呈递纪律，端侧自持）**；组合 = 端侧纯函数 `composeTurnDomain(upstreamTurn)`（`thincoder-vscode/src/agent/turn-domains.mjs`（拟新增））——**选择仅换基座，端 overlay 恒在场**。
- **端 overlay 字面**（逐字搬迁 · 零新撰 / 零改写；下方按行宽折行展示，实现时 = 单行）：

```text
(async advisor review reports: present the findings and suggested fixes verbatim — do not apply them;
consultation reports: present each reply verbatim with your per-reply adoption judgment as text — do not apply anything;
escalate reports: summarize the merged post-op work — further changes need a user message)
```

- **两轮对照（域文本构成 · 差异项 = 0）**：

| # | 构成项 | VSC digest 轮 | VSC ask 唤醒轮 | 差异 |
|---|---|---|---|---|
| 1 | 核基座（核单源） | `AUTO_TURN_DIGEST_DOMAIN`（转口逐字） | `UPSTREAM_TURN_DOMAIN`（转口逐字） | 按轮型换基座——核侧同款二选一（`thincoder-core/agent.mjs:162` 邻位同判）⇒ 非构成差异 |
| 2 | 端 overlay（呈递纪律） | `VSC_TURN_OVERLAY`（逐字） | 同常量 · 逐字 | **0** |
| 3 | 组合形态 | `composeTurnDomain(false)` | `composeTurnDomain(true)` | **0**（同一纯函数） |
| 4 | 注入点 / 载体 | `thincoder-vscode/src/agent.mjs:125-127`（`history.push` + `transient`） | 同址 | **0** |
| 5 | 注入条件 | `autoTurn && !getAuto()` | `upstreamTurn && !getAuto()` | **0**（同门；AUTO 档两侧皆无域文本） |
| 6 | 四族覆盖（subagents / consultations / escalate reports / advisor reviews） | 基座（subagents）+ 端 overlay（其余三族——“consultation reports” / “escalate reports” / “async advisor review reports” 类目形态） | 同 | **0** |
| 7 | 机械拒绝面 | 同（`autoTurn` ⇒ permission deny-stub + spawn 门） | 同 | **0** |
| 8 | 收尾形态 | `]` 收尾 · 端 overlay 在括号内 | 同 | **0** |
| 9 | 宿主日志载荷 | `digest:start` / `digest:end` | 同 + `upstream: true` | 非文本面（有意区分项——两端同规：CLI 同式 = §6.27.12.5 K） |
| 10 | webview 起跑行 | `n > 0` 时 post `digest` 消息 | 不 post | 非文本面（可见性面——登记见 ⑥） |

⇒ **域文本构成差异项 = 0**（第 1 行 = 按轮型的基座选择；第 9 / 10 行 = 非文本面且各有既定登记）。

- **Δ 登记（文本形态 · 零新撰）**：① 四族枚举短语（端侧变体头部「/ consultations / escalate reports / advisor reviews」）作为独立串退役——该短语语法上系于 digest 基座的句身（ask 基座无同句），不能作两轮共用 overlay 片段；其外延由端 overlay 的族名列举穷尽（其余三族以「… reports」类目形态在场，subagents 由基座承载——四族覆盖零缺口；**枚举原串逐字不保留**，如实登记）。
  ② 端 overlay 落位 = 基座正文之后、收尾 `]` 内（原 = 句内嵌套）；③ 端侧核文本副本（原整体变体）退役——基座部分改引核单源，端特有部分入端 overlay（端特有述句单源化）。
- **备选（登记 · 须父侧先裁才可动——属核侧改文本）**：把四族枚举**上收核基座**——收益 = 枚举在两端两轮恒在场、端 overlay 只携纪律句；代价 = 核文本改（内容权 = 父侧）+ CLI 文本随之变 ⇒ 本设计不采。

**⑤ 写域与实证口径（如实登记）**

- 本批 VSC 写域 = 文件表行 **12–21**；核面零改；**CLI 面 1 档**（`thincoder-cli/src/tui/agent-turn.mjs`——旗标贯通两行，**修正轮 1 补——发现 1**；行 22）+ CLI 日志载荷回填（§6.27.12.5 K，承父侧同轮裁定 ④）。
- **实证面 = CLI**（§6.27.12.1）；VSC 面 = **对位设计已并入本批（2026-09-19 · 设计面）**（结构 + 夹具可机判）。本机默认流非 VSC ⇒ VSC 侧行为验收 = 收口轮**重载扩展后实跑**（「重载后自验」口径；`docs/core/requirements/ENGINEERING-MODE-V2.md` §13.2）。
- **台账 #87 关系**：其 **①②**（端壳循环插 drain / 端壳载体表补两字段 + 夹具）= **本批设计并入（2026-09-19 · 设计面；实现待实现轮落地）**；其 **③**（端壳取消 / 观察面对位）= 承前批另案、**不在本批**。台账本体 = 父侧笔（本席不改）。

**⑥ 边界（VSC 面）**

- **不动 webview 面**：`digest` 消息族（`thincoder-vscode/webview/chat.js:356-403`）· `suspension` 消息族 · i18n 文案——ask-only 轮**不 post** `digest` 起跑消息（post 仍限 `pendingN > 0`；`n = 0` 形态不引入）。
  **后果登记**：ask-only 轮的可见性 = 既有 `turnState` / loading 面承载（无「消化中」行）——如需专属行 ⇒ 另案（须先定 i18n 键与行形态）。
- **不动提示词面 / 工具描述 / 返回注**（同 §6.27.12.11-5）。
- **不做** VSC 侧 `escalate` / `consult` 面的上行对位（本批只及子代理 spoke 面——与 §6.27.2 射程一致）。
- **端 overlay 字面 = 逐字搬迁既有端述句**（零新撰 / 零改写——落点 = §6.27.12.5 L；四族枚举短语的处置见 ④ Δ 登记）。

## 变更记录

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
