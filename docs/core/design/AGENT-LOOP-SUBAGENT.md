# 子代理 · 异步 · 调度 · 池（AGENT-LOOP-SUBAGENT）· 核心统一子系统档（拆分面）

> 归属 = `docs/core/design/AGENT-LOOP.md` 的**机制族拆分面**——「子代理 / 异步 / 调度 / 池 / 评审实例」族（2026-09-15 迁移批第 5 批自母档 §6.7–§6.12 拆出）。
> **节号沿用母档全局编号**（§6.7–§6.12 · 新增 §6.18–§6.19）——全仓既有指针**只改档名、不改节号**；母档续 §6.1–§6.6 + §6.13–§6.17。
> 母档 = `docs/core/design/AGENT-LOOP.md`（归属与范围 / 核模块裁决行 / 须用户裁条目 / 对外契约 / 受影响文件 / 主循环机制面 §6.1–§6.6 / 诊断与预算面 §6.13–§6.16 / 关键决策 / 沿革 / 体量）。
> 工作流档 = `docs/core/design/CORE-UNIFICATION.md`；需求层 = `docs/core/requirements/AGENT-LOOP.md`（含 §4 需求条目面）。
> 建档 = 2026-09-15（拆分 + 并入批次）：**段零改动、只修引用**（拆分纪律）；并入面 = 评审对象锚（旧档 §12.1）· 判定铁律 R1–R7（旧档 §12.2）——来源 = `thincoder-cli/docs/design/AGENT-LOOP.md`（旧档一字未改，留参照历史）。

## 6.7 子代理（`subagent` 工具）

**综述**：子代理 = `depth > 0` 的独立 agent 对象 + 丢弃式局部双线；role 决定工具集（只读过滤）与 overlay prompt。

### 6.7.1 角色与委派

| 角色 | 能力 | 模式 |
|---|---|---|
| explore | 只读查询族 / **零 git**（§6.7.4）/ 报告须列未找到项 / thoroughness 三档 | 普通 + 工程 |
| plan | 纯只读规划 | 普通 + 工程 |
| coder | 父全量读写执行 + verify / advisor 自评 + 强制交付表 | 普通 |
| eng-coder | 工程模式替换 coder + 设计驱动 overlay + 必带 `designToken` + explore 受限审计 | 工程 |
| eng-designer | 工程模式写稿面唯一作者（需求档 / 设计档 / 批次档 §2，含修订）+ **无 designToken**（授权 = 需求已确认）+ 必带 `batchDoc` + explore 受限勘察 | 工程 |

**模式过滤**：普通模式 explore / plan / coder；工程模式 explore / plan / eng-designer / eng-coder——schema enum 反映现行模式（角色互斥：工程禁 coder、普通禁 eng-coder 与 eng-designer；schema 枚举 + 运行期硬门禁双保险）。

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

### 6.7.3 async 子代理（后台并行）

**缺省 async**：`asyncFlag = asyncArg ?? (depth === 0)`——**depth-0 缺省 async（全角色）**；depth>0 缺省 sync（子代理内部强制同步）；`async:false` 显式覆盖（depth-0 参数合法；顶层行为受提示词 / 工具描述约束——§6.7.5）。

**async 分支**：子代理照常启动（复用 `spawnChild` 管线——relay / turn-cap / 权限 / `mergeChildMutations` 全不变），父侧不 await——`_asyncSubagents` 记录 + 立即返回 `{ id, role, status: "running" }`；settle → 报告经自动通道送达（回合尾注入 / 挂起 digest——§6.8）。

**槽位队列 + 分域池**：async 入口检查 running 数（< 域上限 → 立即启动；≥ → 入队 `{ status: "queued", position }`）；任一 running settle → 队列可启动项自动补位（§6.9 / §6.10）。

**settle 统一机制**：四族（subagent / advisor / escalate / consult）settle 公共收尾单点 = `settleAsyncEntry`（`thincoder-core/agent-tools/async-settle.mjs`）：

- 落 done / status、日志三连、cancelled / parentAborted / 挂起分流、`settleSeq` 唤醒 waiter、腾槽补位（subagent / escalate 族恒补；advisor / consult 豁免）；
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

> 完整协议（内部闭环步骤 / 收敛计数 ≤5 / 任务域授权 / 审计任务书独立性 / 报告终态）→ `docs/core/design/ENGINEERING-MODE.md`（工程模式档——已迁；批次档协议 = `BATCH-RECORD.md`）；本节只述本机制关系。

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
- **权限**：手动档 auto-turn 不传 `onPermissionRequest` handler（无 handler 即 denied——不弹审批面板）；AUTO 档沿用 `autoApprove`；自省工具（task / checklist）按只读 / 豁免分类放行。
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
- **同文件串行序判定（防互等）**：域冲突阻断**只适用「先入者」**（id 数值比较——spawn 序递增）与 running；**后入者不阻断**——避免两个 queued 同文件互等死锁。running 永远阻断。
- **依赖终态释放**：依赖在目标 settle（任何终态）或条目移除时视为满足；依赖取消 / 失败 → 依赖者留 queued 标 `dependency-cancelled` + 注入提醒供模型决策（仅父侧显式处置或 AUTO 档才自动启动——滞留有意、显式可清、不静默）。
- **`dependsOn` 成环 → spawn 拒绝**（防御断言）；**unknown id → 拒绝**（明确错误）。
- **停滞机械检测（`detectStall`）**：池无 running 且 queued ≥1，且每 queued 的 blocker（files 冲突者 + 未 settle 依赖目标）都落在 queued 集内（阻塞闭包无外逃）且无 dep-cancelled 标记 → status 视图标记停滞 + 逐条阻塞链 + 引导 cancel 破环（保守不误报）。
- **排队面板 UX**：任何排队 spawn 在 spawn 返回时立即建面板块（`⟦ev⟧queued` / `cancelled` 事件 token）——块头标注 `[▶ role#N · waiting] waiting for: …` / `queued · position N`；启动后转 running（同 key 不重建）。
- **父侧文件拦截（R26）**：父侧维护文件（`docs/TODO.md` · `CHANGELOG.md` · `checklist.md` 及 `checklist*` 前缀）**不得列入 files 声明**——黑名单机械校验（归一化后 basename 全名匹配 + 大小写不敏感，路径任意层）→ 声明含任一 → 拒绝 + 英文提示（fail-closed，校验先于调度器）。**设计文档仍可声明**（eng-coder 落实现记录是常态——不误伤）。

## 6.10 回合外事件后台化统一模型（分域池 + async advisor）

- **池容量**：`ASYNC_POOL_LIMITS = { engCoder: 4, other: 4 }`（默认）；角色域 = `role === "eng-coder"` → engCoder 池，其余（explore / plan / coder / sub）→ other 池。运行中计数按域分别记；队列补位按域腾槽。**跨域总量 8、同域仍 4**。
- **配置键**：`agent.poolLimits = { engCoder, other, advisor }`——subagent 两键运行期读 + 校验（正整数 ≥1，非法回退默认 4 / 4）；advisor 第三键由独立读取器消费（合法 ≥1 整数生效；非法 / 缺省回退 4）。变更下回合生效。配置面条目 = `docs/core/design/CONFIG.md` §6.1（本档不复制）。
- **async advisor（独立后台评审池）**：池 = `_asyncAdvisors`（复用 pending / digest / 注入 / 冻结机制；runner 包装 `runAdvisorReview`，不碰 subagent 管线）；容量默认 4——**超限 → 返回错误文案**（「另有一评审在跑——逐个发起」；评审间有依赖语义 ⇒ 排队无意义）。
- **同 scope 并发守卫**：launch 判定两关独立——① 池容量（全局 running ≤ 生效上限）；② 同 scope（同 `reviewType` + scope 有 running 评审 → 拒；design scope = 文档集键 `docSetKey`；code = 单 `code` 线程 `openCodeRun`）。拒文案含 scope 语义与指引；`settled` 续跑语义不变。
- **工具语义**：advisor 加 `async: true`；**缺省 async**——仅 depth-0（depth>0 显式 async 拒 / 缺省恒同步）。发起返回 ack → 回合自然收尾 → 挂起态 → settle → digest。
- **UI 通道**：subagent 面板 + `role="advisor"` 伪角色（块 / ⏹ / 冻结全复用）；cancel = 定向 abort → cancelled settle（不入 pending、不入 token 槽、digest 提示「评审已取消——token 未签发」）。
- **settle 记账**：评审 settle 时（消化链首行注入前）——① **陈旧判定**（launch 后发生 `FILE_MUTATORS` ⇒ 基于旧状态 ⇒ 不置 `_calledAdvisorThisRun`、代码评审不签发 token，guard 仍推回发起新评审）；② 通过 → token 入槽 `_engDesignTokens` + 当场同步落盘权威台账；③ `_advisorRound` 改按 review 实例记（cap 随实例 ≤5 轮）；④ guard 推回判定看后台评审是否已 settle 且非陈旧。
- **收敛状态 per-review 化**：`_advisorRuns: Map<reviewId, { round, priorOutput, stale }>`——`reviewId` = `designId`（设计评审）/ 随机 id（代码复核）；多评审并行隔离。
- **消化处置轮**：报告注入 → 模型消化（呈递发现 + 修复建议——不擅自动手）→ 用户逐项拍板 → 修正轮在 agent 回合内发起 round2（async 再启——round / prior 从 `_advisorRuns` 取）。
- **凭证机制**（designId / token：设计锚 / 同步 / 回显 / 登记 / 消费 / 校验）→ 属工程模式板，见 `docs/core/design/ENGINEERING-MODE.md`。

## 6.11 后台评审池可观测 / 可控（接入面补全）

1. **状态通道**：`subagent status` 读**两池并集**——子代理池 + 评审池（`getAsyncPool(agent, "advisor")`）；单查（带 id）先子代理池、未命中落评审池
   （两池共用 `nextSubagentId` 命名空间——id 全局唯一）；概览 `running` 行含 `role` / `model` / `elapsedSec` / `turn` / `maxTurns`（子代理）
   或 `reviewType` / `round` / `elapsedSec`（评审）；`done` 行带「已 settle 未消化」注记（走自动送达通道）；未命中两池 → 既有错误文案不变。
2. **等待口径**：`wait_for "advisor settled"` 判据 = **评审池无 running / queued 条目**（双载体：`agent._asyncAdvisors` ∪ `history._asyncAdvisors`）——与「未决评审判定」同源（`advisorReviewPending` / `advisorReviewInFlight`）；条件字面 / 超时 / 间隔语义零变。
3. **取消路由**：`subagent cancel <id>` 在子代理池未命中时**落评审池**——命中 running 评审 → `entry.cancelled = true` + `controller.abort()` + 机读线提醒（「评审已取消——token 未签发」）+ 幂等（重复取消返回同一确认）；未命中两池 / 已完成 → 既有错误文案。取消语义同 §6.10（不入 pending、不入 token 槽）。
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

## 档位与拆分说明（R24a）

**实测行数**：本档 **272 行**（as-of 2026-09-15 拆分实测）——**低于 300 行软线**，无需进一步拆分规划。
**拆分来源**：`docs/core/design/AGENT-LOOP.md` §6.7–§6.12（原 670 行超 500 硬限 ⇒ 拆分，2026-09-15 迁移批第 5 批）；**段零改动、只修引用**（拆分纪律）。母档 §6.13（Stop 钩子）与 §6.12 的 provider 产生点半边（→ 供应商板）两候选拆分面维持母档 §9 的**建议 / 待裁定**状态。

## 变更记录

- 2026-09-15（**迁移批 · 第 5 批 · eng-designer**）：**建档**——自 `docs/core/design/AGENT-LOOP.md` 拆出 §6.7–§6.12（节号沿用）；**并入**——评审对象锚（旧档 §12.1）→ §6.18 · 判定铁律 R1–R7（旧档 §12.2）→ §6.19（来源档一字未改，留参照历史）；引用修复 = §6.7.6 工程模式档指针改指现状（`ENGINEERING-MODE.md`）· §6.8 核内形态指针回指母档 §2.3 · §6.10 凭证机制指针改指 `ENGINEERING-MODE.md`。
