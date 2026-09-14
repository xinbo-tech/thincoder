# 工程模式（Engineering Mode）· 设计

> 板块：工程模式——thincoder 的严格方法论工作流：design-before-code、纪律层槽位提示词驱动、双门禁（设计评审 + 代码评审）。
> 本档为**架构级机制文档**：功能性需求以机制目标与约束表述（架构级文档以约束替代用户故事），非功能性需求与测试层完整。
> 需求层指针 = `requirements/ENGINEERING-MODE.md`（§0 铁律 / §1 FR·NFR / §1.5 裁定清单 / §1.14 失败路径 / §2 可移植性 / §3 边界）。
> 同批兄弟档：`design/BATCH-RECORD.md`（批次档载体 + 段写入工具 + 行为纪律）· `design/DOC-DISCIPLINE.md`（文档更新纪律 + 机检对账 V1–V5）·
> `design/LEDGER.md`（台账机制）· `design/LEDGER-SELF-CONTAINED.md`（各仓自持）· `design/ADVISOR-CONVERGENCE.md`（评审收敛）· `design/ADVISOR-GUARDS.md`（评审链边缘守卫）。
> 提示词载体：纪律与逐字锚现驻 `thincoder-core/prompts/discipline-engineering.md` + `thincoder-core/prompts/persona-engineering.md`（双端各自实现）。
> 判据指针：归属与命名 = `docs/core/design/DOC-SYSTEM.md` §5.1 / §6。

## 1. 定位

普通模式靠纪律提示词约束模型；工程模式把“设计先行、评审把关、验证收尾”提升为**半机械流程**——可硬性拦截的环节一律拦截（写文件门禁、token 校验），
无法硬拦的靠纪律层槽位提示词约束。本档 = **工作流本体**：角色、主流程、机械闸、凭证生命周期、错误恢复、逐字锚清单。

依赖关系：`design/AGENT-LOOP.md`（子代理任务调度器 · 评审对象锚——本档机制经其权威源接管点注册）·
`design/ADVISOR-CONVERGENCE.md`（评审收敛权威：design 评审 cap 豁免、code 评审轮次上限、stale-context 保护）· `design/TESTING.md`（测试分层权威）。
需求侧不变量（发起权归用户 / 需求不经 advisor / 设计 = 对需求的检验）住 `requirements/ENGINEERING-MODE.md` §0 / §1.5，本档不重述（D2）。

## 2. 角色模型（三段链）

| 角色 | 职责 | 机械约束 |
|---|---|---|
| **主 agent**（父代理·顶层，`role` 未定义） | **产品经理 + 流程编排者 + 批次档作者**：需求讨论/登记/收口 · 批次档 §1/§4/§6 · **核验设计稿（内容性）** · 提醒用户发起设计评审 · 委派 eng-designer（设计）/ eng-coder（实现）· 交付验证（L2 `test:full` 每链终态 1 次）· 链终核销 consume-design。**不写**需求档/设计档、不写实现 | 拦截型：design token 前写产品代码被拒；提示词约束：不写实现、不发起评审、等批准、验收 |
| **eng-designer**（子代理，`role="eng-designer"`） | **写稿面唯一作者**：需求档 + 设计档（含修订）+ 批次档 §2；自勘察（限 explore，预算 ≤6/批）→ 并入需求 + 体系对账 → 判定句 → 写设计 → 自检交回 | **无 token**（授权 = 需求已确认）；spawn 必传 `batchDoc`；内部 spawn 仅 explore（机械门）；不写实现/不改提示词/不发起评审 |
| **eng-coder**（子代理，`role="eng-coder"`） | 实现者：按设计实现 → **内部协议闭环**（explore 偏差审计 → 自修 → advisor 复评 → 收敛，≤5 修正轮）→ 交付（报告含审计/评审轮次 + 终态 clean/stalled；永不编辑设计文档） | 拦截型：spawn 需 token、写文件需 `_engDesignReviewed`；内部 spawn 仅 explore + 同步（机械门）；审计 ≤6 次（第 7 次机械拒绝 = stalled 信号） |

### 2.1 角色注册与提示词装配

**注册面**（枚举 + 白名单 + 错误文案 + 场景槽位映射）与**装配面**（槽位文件表 + 场景槽文件表 + 子代理 childConfig）**逐处落齐**——漏一处不报错，是**静默回退陷阱**：

- **角色枚举**：`thincoder-core/agent-tools/subagent.mjs`（schema enum）+ `thincoder-core/agent/setup.mjs`（工程模式 enum 与后缀）。
- **白名单与错误文案**：`thincoder-core/agent-tools/subagent.mjs`（`ROLES` 集合 + 错误文案的角色列举）——漏改则报错信息说谎。
- **模式门（三闸）**：工程模式禁 `coder` · 非工程模式禁 `eng-coder` · **非工程模式禁 `eng-designer`**（与 eng-coder 同族）；`thincoder-core/agent-tools/subagent.mjs` 集中实现。
- **装配映射**：`thincoder-core/prompt-overlays.mjs`（`SLOT_CONTENTS` + `SCENARIO_SLOT_FILES`）——不登记则**静默返回通用基底且零警告**；`thincoder-core/agent/setup.mjs` 的场景映射**外层谓词 + 内层选择器都要改**。
- **槽位文件**：`thincoder-core/prompts/persona-eng-designer.md`（英文落地产物）+ `docs/core/design/prompts/persona-eng-designer.md`（中文权威模板）——双源各自实现、语义同源。
- **子代 spawn 门**：父角色集合（eng-coder / eng-designer）**均只允许 spawn `explore`**；**审计预算（≤6）只计 eng-coder**（designer 勘察非审计）——designer 父路径校验通过后**必须返回 `null`**，否则审计范围块会被误注进勘察任务书。
- **受限变体**：designer 勘察变体 = **参数化复用**既有受限变体（父角色集合条件 + 描述文案分流），不并列第二个 IIFE；受限变体的动作拒绝清单**以机械门为唯一真值**（`escalate/status/cancel/panel/consume-design/observe/send`），已退役动作不得残留。

### 2.2 写域边界（提示词纪律——无机械门）

设计者的写域 = `docs/`（扣 `docs/core/design/prompts/`）。**不新增机械门**（用户裁定“不需要机械门禁”）——靠 persona 明写写域 + 主 agent 内容性核验兼底。
**已知摩擦（用户裁定“接受”）**：designer 子代理**不**拿任务域豁免，故其每次写操作走人工授权（授权弹窗可“全部授权/切自动”）——设计**不为此加任务域豁免**。

## 3. 主流程（Mandatory Flow · 10 步）

工程模式任务**不分大小**全走本流程——零裁量。普通需求点先按需求池规则登记攒批（机制见 `discipline-engineering.md` 需求池攒批工作流节），不越池提前启动设计。

1. 写设计档（三层：需求/设计/测试；按业务板块组织）——**路由 eng-designer**（主 agent 出批次档 → spawn designer）。任务涉及 UI 时设计文档必须收录与用户达成的每一条 UI/交互决策（布局/流程/控件行为/状态/反馈），未定部分标 `open`、绝不静默发明。
2. 父代理呈递设计摘要 + 提醒“设计就绪，可以评审”——**等待，不自行调 advisor**。
3. 用户发起设计评审：父代理调 `advisor(type="design", documents=[涉及文档清单], object={type,target,status,reason,exclude})`。
   - 有 🔴 → 呈递发现 + 逐项修复建议 → **用户逐条拍板** → 修改 → 再提醒 → 用户发起复审；持续拒绝（>3 轮）→ 停下向用户报告未决项，不静默循环。
   - 无 🔴 → advisor 回显凭证 + designId（同 scope 复审沿用同 id）→ designId+token 入槽（会话内 Map）。
4. 用户批准设计——显式 sign-off 才解锁实现；**用户对设计内容/形态的选择只是需求确认，不是设计批准**。
5. spawn `eng-coder`：`subagent(role="eng-coder", designId, designToken, batchDoc=<本批批次档>, task)`——designId 可选（单设计省略）；**`batchDoc` 必传**（eng-designer 同门）。
   designToken 经 **PARAMETER** 传值，**绝不进任务文本**；task 按「实施委托结构化」含 Docs involved → 文件清单 → 验收标准——**默认 async**。
   spawn 声明 `files` + `dependsOn` 交调度器排序（重叠域 queued 自动启动；同步冲突报错；并发 ≤4）。
   机械校验：按 designId 定位槽比对 token，不符即 throw；通过 → child 解锁写文件 + 任务域授权。
6. eng-coder **内部交付协议**（子代理内部闭环）：实现 → 自查透明表 → explore 偏差审计（审计任务书 = 父 spawn 任务书 ∪ 实际 `_touchedFiles` **机械并集**，非自述；对照设计查四类偏差：部分实现/静默简化/文档漂移/超清单改动未报告）→ dirty 自修（修正轮 ≤5）→ clean → advisor(type="code") 复评（documents = 设计文档 + 交付文件清单）→ findings 自修 → 收敛交付。
   **现行口径**：标准链 = ③审计（LLM#1）→ ④dirty 自修（无 LLM）→ ⑤advisor 首审（LLM#2）→ ⑥findings 自修（无 LLM）→ 终审 = advisor 复评（LLM#3——验证 fix，不复跑审计）；**修正轮默认不重跑审计/复评**。eng-coder 永不编辑设计文档。
7. 交付 settle → 报告注入 → 父侧消化。子代理改动经 mergeChildMutations 合并进父代理——失效旧 verify/advisor 标记、**重置轮次计数**。父侧不再自动 spawn 审计/评审（防双重审计/误用）。
8. 父代理交付验证：对照验收标准跑测试、读改动文件——**信任 eng-coder 内部验证结果**；父侧 = **L2 全量 `test:full` 恰一次（每链终态）**，不再复跑 L1。L2 失败 → 该链终态 non-clean → 报告用户（未达验收——不静默放行）→ 可转 fix round（同凭证，docs FIRST）或用户决定。
9. 父代理 verify（对照验收标准）。
10. 完成：**验收勾销落批次档 §6**（逐条验收结论——通过/未过/未做 + 理由）；设计档只承载设计本身，**勾销不进设计档**。
    链闭合（verified + clean + 已签入）→ 父侧 `subagent(action="consume-design", designId=…)` 消费槽（§6）。

## 4. 机械强制链（拦截闸 vs 流程驱动）

> **设计原则：只拦截，不催促。** 评审由流程提示词在正确节点驱动；每轮结束的机械推回（advisor/verify guard）在工程模式下**一律关闭**（含 opt-in 配置）。拦截闸（写文件门禁、token 校验）保持机械强制。

| 闸 | 类型 | 机制 | 位置 |
|---|---|---|---|
| **Design gate — token** | 拦截 | spawn 按 designId 定位槽，校验 token 值 + 格式/TTL fail-closed；不符即拒；会话内仅一个设计时 designId 可省略，多个设计时缺 designId → 拒并要求指定 | subagent 域（CLI/VS 双端） |
| **Design gate — 产品代码变更** | 拦截 | eng-coder 未过门 → 写/删/改产品代码被拒；父代理无 design token → 产品代码写/删/改被拒（豁免仅设计产出物）；门禁覆盖全部变更形态（写/删/改） | dispatch 域（CLI/VS 双端） |
| **Code review** | 流程驱动 | **eng-coder 内部协议默认承担**：in-child advisor(type="code") 复评 → findings 自修 → 收敛 ≤5 修正轮；父侧复核保留可选（stalled/存疑/用户要求） | 纪律层提示词（双端） |
| **偏差审计** | 流程驱动 | **eng-coder 内部协议默认承担**：in-child explore 审计；dirty → 自修 → 再审计；审计 ≤6 次、第 7 次机械拒绝 = stalled 信号 | 纪律层提示词（双端） |
| **收敛上限** | 拦截 | code review 最多 5 轮（code-only）；design 评审不消耗轮次（cap 豁免）；非 LLM 自检不消耗轮次 | `thincoder-core/advisor/run.mjs`（CLI/VS 双端） |
| **冻结窗口预闸** | 拦截 | 设计评审在途时，父侧对被审文件集的写被拒（D5——见 `design/ADVISOR-GUARDS.md`） | `thincoder-core/agent/dispatch.mjs` |

**评审范围（Review Scope）**——评审对象由任务定义，不由遍历决定：

- **doc review**：`advisor(type="design")` 调用时**显式传 documents 参数**（需求 + 设计 + 引用文档路径）；advisor 只评审清单内文档，**不收集 git diff 变更集**（早期“按 diff 找文档”范围大、不准、与任务无关，还会漏掉 untracked 新文档——已废弃）。
- **object 参数必传**：评审调用必须携带对象声明 `{type, target, status, reason, exclude}`——评审对象由任务定义，与 documents 同批传入；对象声明块由 advisor 消息层机械注入（漏传 = 评审目标模糊 = 与 documents 漏传同级错误）。
- **code review**：评审范围 = task 的 Docs involved（设计文档）+ 交付文件清单/验收标准（显式化）；不遍历 git diff 找评审对象。默认由 eng-coder 内部协议承担。
- 父代理负责收集涉及文档，在设计评审（documents 参数）与 spawn（Docs involved）两处传入。

**评审时机（Review Timing）**：

- **设计评审**：仅由**用户发起**——父代理呈递设计就绪并提醒，用户发话才调 advisor；打回后每轮呈递发现 + 修复建议、用户逐条拍板再改、再提醒复审（**修订落档经 eng-designer**）；持续拒绝时停下报告。
- **交付 code review**：流程节点自动、不问用户——默认由 eng-coder 内部协议承担；父侧复核保留可选——stalled/存疑才复核。
- **系统推回**：工程模式下 advisor/verify guard 推回**一律关闭**，如未来启用也只作提示用户之用。
- **advisor 失败/中断**：停止重试，向用户报告原因。

## 5. Token 生命周期（链终消费制）

背景：token 只存不废 = 复用洞（父代理跳过审核、未呈方案即直接复用旧 token spawn 的实证）。裁定：**spawn eng-coder 整链完成（首 spawn + 全部中间修复轮走完 → 父端验收核销）后从父端消费掉 designToken**。

- **F1（链终消费——机械）**：subagent 工具提供 `action: "consume-design"`（参数 designId——单设计会话可省略）——父侧验收核销时显式调用。实现：读槽值 → 移除该 slot（**单值镜像已退役——consume 只删槽 Map 项**）→ 消费后同 designId 再 spawn = 槽 not found **机械拒**。**新改动（含新偏差修复）一律新评审新 token**。未知 designId 与重复消费 = 同款 no-op 提示（幂等——不报错）。
- **F2（链中复用不受影响——docs FIRST）**：fix round（同 designId——首 spawn 后、验收前）仍可 spawn（slot 未消费）——消费点仅在父侧核销时（非交付 digest 时——否则 fix round 无 slot 可用）。修正轮的 findings + planned changes **必须先落所属设计文档再** spawn eng-coder；跳档 = 文档漂移，等同静默改动；**落档动作经 eng-designer**（写稿权唯一）。
- **F3（提示词义务句——两则英文锚逐字，落点各注；锚测试 fail-when-unchanged）**：

  - 链终消费锚（落点：纪律层交付链收口节——双端）——逐字文本：

    > **Chain-terminal token consumption**: after the delivery is verified and the chain closes out,
    > call `subagent` with `action:'consume-design'` for this designId — the slot is consumed; a
    > further spawn for the same designId is mechanically rejected, and any new work (including new
    > deviation fixes) requires a fresh design review and token. Leaving a consumed-out token in the
    > slot is the reuse hole.

  - 修正轮句的逐字文本（双端）：

    > Fix rounds reuse the same designToken — but docs FIRST, and only while the chain is open (same designId, before parent-side close-out); once the chain terminal state is reached, every further spawn — including deviation fixes — goes through a fresh design review and token.

  - 执行判据（主 agent）：**链中不疑 token**（多次 spawn/fix round 复用同一 token 是正常态，非 bug）；**链终必清 slot**（delivery verified + clean + 已签入 = 链闭合 → 立即 consume）；**未闭合不消费**（stalled / L2 非 clean / fix round 在途 → 同 token 继续）；**重评审只在真新链需要**。
- **F4（边界）**：stalled 交付不消费——fix round 续用；L2 非 clean 不消费；用户放弃该设计 → consume-design 作废；跨会话恢复的持久化槽同受消费管理；consume-design 幂等；**多槽隔离（消费 A 不动 B）**。

## 6. 凭证不落文档

背景：真实 token/designId 值曾被写进设计文档状态行/变更记录（运行时凭证落文档 = 死值污染 + 诱导后续评审员“照格式模仿”自编）；“脱敏占位”同样是废话——**根本不要记录**。

- **F1（提示词纪律——逐字锚，双端一致；锚测试 fail-when-unchanged）**：

  > **Credential values stay out of documents**: never write token or designId VALUES into design docs, change records, or status lines — credentials are runtime state. A review passing is recorded as "review passed"; nothing else. No values, no placeholders.

- **F2（文档面）**：值记载清理是父侧文档层持续义务（已清一轮；此后新增值残留由巡检把关并报父侧清理——不背书存量零残留现状，以巡检结果为准）。
- **巡检**：值形态正则钉死为「参数名（token/designId）+ 空白 + uuid 形 hex + 可选冒号 epoch 后缀」；巡检范围 = `docs/**/*.md` + `thincoder-core/prompts/**/*.md` + 根级变更记录。
- **验收**：锚断言绿（双端）+ 巡检绿（`test:full`）+ 既有 prompts 家族零回归。

## 7. 错误与恢复

| 场景 | 行为 |
|---|---|
| eng-coder 中途失败/中断 | 父代理可重新 spawn（同一 token——链中未消费）；或在报告中说明 |
| 实现中设计变更（用户反馈） | eng-coder 停下报告；**转 eng-designer 更新设计档** → 请求用户重新确认 → 必要时重新评审 |
| advisor 工具失败/中断 | 停止重试，向用户报告 |
| merge 冲突/异常 | mergeChildMutations 为纯内存操作，冲突不可能（单线程）；异常向上抛，父代理见错误结果 |
| 并发 spawn（同一或不同 designId） | 允许（token 链终前不消费）；各 eng-coder 携自己 designId+token 独立实现，父代理分别验收 |
| 会话恢复/重进 | token 随 slot 持久化（TTL 7 天 fail-closed）——重进 TTL 内恢复；过期/换槽才需重新设计评审；持久化槽同受链终消费管理 |

失败路径的九条清单（L2 不过 / 轮次用尽 / 评审不收敛 / 否决设计 / 撤回废弃 / 退出模式 / token 过期 / 依据缺失 / 崩溃）= `requirements/ENGINEERING-MODE.md` §1.14（需求侧权威，本档不重述）。

## 8. 提示词锚清单（逐字契约——双端一致）

下列逐字锚是工程模式纪律层的落地契约。**字节源 = prompts 落地文本本身**（本档不收录压缩改写版本）；锚测试均为 fail-when-unchanged 断言。
机制语义权威源：需求池 = `discipline-engineering.md` 需求池攒批工作流节；调度器 = `design/AGENT-LOOP.md` §10；评审对象锚 = `design/AGENT-LOOP.md` §12.1；内部协议完整文本 = 本档 §3 step 6。

- **锚#1 零裁量**（落点：纪律层「Mandatory Flow (every task, no skipping)」标题下、step 1 之前——双端；顶层工程模式生效，普通模式零触碰）：

  > Task sizing is NOT your call — every user request in this mode runs the full Mandatory Flow
  > regardless of size. "The task is too small / it is just a tweak" is never a reason to skip or
  > compress a step, and no change is exempt from being recorded in the design docs. If you find
  > yourself weighing whether the flow applies, the answer is always the full flow — the user's
  > decision to be in engineering mode was the sizing decision.

- **锚#2 需求池三规则**（落点：纪律层需求池攒批工作流节——双端）：

  > 1. **Pool routing** — "ordinary requirement statements register in the owning board's requirements doc and the project docs/TODO.md「Requirement Pool」group first; design does not start until the user says start this batch (or marks the point urgent — fast lane)."
  > 2. **Threshold reminder** — "same board ≥2 or pool-wide ≥3 requirement points: remind once that batch design can start — the user still fires the review and approval."
  > 3. **Fast lane** — "the user saying this is urgent / do it now skips the pool: single-point full flow (design → review → implementation — no step cut)."

- **锚#3 修正轮 token 复用 + docs FIRST**：修正轮逐字锚见 §5 F3 引文。配套指针句（落点：纪律层交付链收口节——双端）：

  > Fix-round re-spawns are docs FIRST too — the deviation record / change note lands in the owning design doc BEFORE the eng-coder spawn (full rule: the eng-coder delivery bullet under Then handle the message).

  语义：修正轮 findings + planned changes 必须先落档再 spawn；“代码变更都必须落文档”对修正轮无豁免——跳档 = 文档漂移；同设计修正轮是唯一合法 token 复用——超出设计文件清单 = 新任务，需自有流程与新 token。

- **锚#4 用户拍板 ≠ 设计批准**（落点：纪律层交付链收口节——双端；step 5「User sign-off」指针句同文随迁）：

  > A user ruling on design CONTENT (form/shape/option choice) is requirements confirmation — NOT
  > design approval. New scope — including extensions to an already-approved design — still runs the
  > full review chain: design ready → user-initiated advisor review → user approval → implementation.
  > Approving a form ("B", "可以") never shortcuts past review. Only the explicit sign-off after the
  > advisor review unlocks eng-coder.

  step 5 指针句（逐字）：

  > A user ruling on design form/shape/option choice is NOT this sign-off — scope extensions (incl. extensions to an already-approved design) still run the full review chain (full rule: the eng-coder delivery bullet under Then handle the message).

- **锚#5 链终消费**：逐字锚见 §5 F3 引文——落点纪律层交付链收口节——双端。
- **锚#6 凭证不落文档**：逐字锚见 §6 F1 引文——落点纪律层交付链收口节——双端；配套巡检正则与范围见 §6。
- **锚#7 调度器句**：字节源 = Multi-Task Parallelism 节调度器条款段；机制权威 = `design/AGENT-LOOP.md` §10：“overlapping domains are queued by the scheduler, never hand-serialized”。
- **锚#8 设计行为纪律四维（A1–A4）**：字节源 = 纪律层「设计行为纪律四维」节（A2 改写形态 = 同档方案选型对比节）；机制语义权威 = 纪律层文档规范节（三层模板 / 方案选型对比表 / 多实现面纪律——本档不收录压缩改写版本）。断言：各端自身驻留 fail-when-unchanged。
  - **A1 勘察 checklist**、**A2 方案选型对比**、**A3 评审前预检**、**A4 实践沉淀**——四维的逐字文本住 prompts 落点（本档只登记锚位与断言口径）。

## 9. 配置与会话恢复

**engineering 与 advisor.guard 都是会话级**——事实源是当前会话槽位文件（`engineering` 字段与 `advisor.guard`），`config.json` 的对应项降级为 **CLI 兼容/可见性镜像**，不再是事实源。
背景（跨端污染 bug）：旧设计里 engineering 只存 config.json 全局，两端设置面板都写它 → 两端互相翻转对方的工程模式——会话级化后两端会话各自独立，互不影响。

- **读取优先级（两端一致）**：slot 显式值 > config.json 兜底 > false。slot 无字段（旧槽位）→ 回退 config.json（兼容锁定）；slot 显式 `false` ≠ 未设置，压过 config 的 `true`。
- **写入路径**：CLI `/eng`（persistEngineering）与 eng(enter/exit) 工具 = **slot-only**（`config.json` 只是初值默认，不再镜像写）；
  CLI `/advisor` guard 切换 + VS Code 设置面板 toggle = **双写**（slot 先、config 镜像后——slot 写失败不阻断 config 写）；VS Code eng 工具经 `engPersist` 通道随每轮把 live 状态带入槽位。
- **初值链**：CLI `assembleAgent()` 从 config.json 播种 → `applySession` 时 slot 值覆盖；VS Code `setupAgentRun` 每轮从 engState（panel-chat 从槽位读）注入。
- **guard 存槽 ≠ 工程模式机械推回**：guard 状态存槽只是会话级配置事实；工程模式下 guard 推回一律关闭（§4 设计原则），存槽不改变这一点。
- **resume** 保留 run 状态（mutation 追踪/收敛预算）——guard 跨续跑生效、cap 不可重置；design token **随 slot 持久化**（TTL 7 天 fail-closed）。
- **角色互斥**：工程模式禁用 `coder`，普通模式禁用 `eng-coder` 与 `eng-designer`（schema 枚举 + 运行期硬门禁双保险）。

## 10. 已知取舍

1. 父代理无全面写文件门禁——必须能写设计产出物；越权靠提示词（拦截型门禁覆盖产品代码）。
2. token 跨任务存活——保守缺口，已接受（链终消费制收口后：仅链中存活，链终消费）。
3. token 持久化边界——单值随 slot 持久化、多槽同构序列化；TTL fail-closed 兜底，过期重评；**无签名格式下防伪不声称**——门禁可经工程模式开关绕过，防伪无实际安全边界。
4. multi-repo 时 advisor cwd 取 `repos[0]`——`_touchedFiles` 绝对路径缓解，已知限制。
5. 架构级文档以机制约束替代用户故事——架构级机制文档的既定形式。
6. designer 的每次写操作走人工授权（弹窗需人点“全部授权/切自动”）——用户裁定接受，不加任务域豁免。

## 11. 验收标准（逐条回指需求）

| # | 验收标准（机器可验） | 回指 |
|---|---|---|
| A-EM1 | 三角色均在册且可 spawn：枚举 + 白名单 + 错误文案 + 装配映射四处齐；非工程模式 spawn `eng-designer` 被拒 | FR9 · NFR4 |
| A-EM2 | 主流程 10 步在档且与需求 §1.6/§1.9 口径一致（step 1 路由 designer / step 10 勾销落批次档 §6） | FR1 · FR9 |
| A-EM3 | token 门禁：spawn 不符即 throw；`consume-design` 后同 designId 再 spawn 机械拒；消费幂等 | FR3 · NFR3 |
| A-EM4 | 链终消费锚 / 修正轮 docs FIRST 锚 / 拍板≠批准锚 / 凭证不落文档锚——四处逐字锚驻留断言绿（双端） | FR3 · FR21 |
| A-EM5 | designer 勘察通道：内 spawn `explore` 允、`coder` 拒；勘察预算 ≤6 且不计入审计预算 | FR9 #7 |
| A-EM6 | 会话级事实源：slot 显式值优先；工程模式 guard 推回关闭 | NFR6 · FR21 |
| A-EM7 | `docs/core/design/ENGINEERING-MODE.md` 各节坐标全为**现状路径**且经实核（零迁移前 `src/**` 形） | FR4 · N4 |
| A-EM8 | 三机检（锚域悬空 0 · 宽度零新增 · 台账 0 违规）全绿 | N3 |

**用例表（正常 / 边界 / 错误）**：

| # | 类 | 输入 | 期望输出 |
|---|---|---|---|
| EM-1 | 正常 | 工程模式 spawn `eng-designer`（带可用 `batchDoc`） | 放行；装配工程纪律槽；工具集含 `batch_segment`、不含 advisor |
| EM-2 | 错误 | 非工程模式 spawn `eng-designer` | throw（与 eng-coder 门同族） |
| EM-3 | 错误 | spawn `eng-coder` 不带 designToken / token 不符 | throw（零 spawn） |
| EM-4 | 边界 | 链终 consume 后同 designId 再 spawn | 机械拒（槽 not found）；重复 consume 幂等 |
| EM-5 | 边界 | designer 内 spawn `explore` / `coder` | 前者允、后者拒 |
| EM-6 | 边界 | slot 显式 `false` + config `true` | 判 false（slot 压过 config） |
| EM-7 | 错误 | 文档内出现 token 值形态 | 巡检报红（`test:full`） |

## 12. 不并项与历史沿革

| 面 | 内容 | 何故不并 |
|---|---|---|
| 逐批设计记录（原 §2.11–§2.32 的批次小节） | 每批的「问题陈述 / 方案选型 / 受影响文件 as-of 快照 / 关键决策」 | 一次性批次材料——机制结论已提炼入本档正文；流水归 `docs/batches/` + git 历史 |
| 受影响文件 as-of 快照表 | 原 §2.14 / §2.18 / §2.21 / §2.23 / §2.25 等「不得当契约引用」的行数表 | 快照（as-of 数字不作契约）；现状行数以工具实测为准 |
| 用例表与验收标准的历史编号集（T25–T112 / AC10–AC90 / T-V5-*） | 逐批用例与 AC 明细 | 批次验收材料；**机制级不变量与判定句**已并入各落点档的验收标准节 |
| 状态行与落笔流水 | 「实现未启动 / 待用户发起评审 / 已落 / 待 coder」类状态句 | 运行时状态；单笔改动通知 = 变更记录行 + git |
| 已退役机制 | METHODOLOGY 携带/缺失降级（D-M1/D-M2）· 旧 `engineering.md` / `engineering-sub.md` / `methodology-template.md` 载体 · 无签名 token 的防伪层 | 已退役/已迁——语义保留处已并入正文（载体改指纪律层双源） |
| VSC 专有面实现坐标（§2.22 / §2.23 的 VSC 仓文件路径与行数） | VSC 仓逐文件落点表 | **P2 产品面**——按 P5 归 VSC 轮；本档只保留机制原则（语义同源·原文自持 / 镜像锚 / 两处各落）与需求指针（`requirements/ENGINEERING-MODE-MECHANISM.md` §1.17） |
| 勘察与分析快照 | 评审轮次逐条处置、审计 id 记录、行数剖析 | 一次性材料 |

## 13. 体量与拆分规划（R24a）

**实测行数**：本档 **≈300 行**——撞 300 软线。
**拆分规划（登记——触发 = 再度增厚至 >350）**：候选切面 = ①**角色与主流程**（§2–§4）②**凭证与锚**（§5–§8）；切点零交叉（§8 锚清单引 §5/§6 引文——拆后以 `design/ENGINEERING-MODE.md` 内节名互挂）。**当前不拆**（本档为单板块机制文档，拆则破「一板块一档」与 D2）。
**同批兄弟档切分理由（已在本次迁移执行）**：原 3030 行超 500 硬限，按**机制族**切为 6 档（工作流本体 / 批次档 / 文档纪律 / 台账 / 自持 / 评审收敛），读者面互不重叠。

## 变更记录

- 2026-09-15（**迁移批 · 第 4 批 · 大档拆分实迁** · eng-designer）：自 `thincoder-cli/docs/design/ENGINEERING-MODE.md`（3030 行）按 B 式重建并拆分入 `docs/core/design/`——落点判据 = `design/DOC-SYSTEM.md` §5.1 P1；
  本档承载工作流本体（原 §2.1–§2.10 + §5 + §6 + §2.15 角色面）；批次档机制 / 文档纪律 / 台账机制切出为兄弟档；逐批设计与用例表入「不并项与历史沿革」；坐标全量改现状路径。
