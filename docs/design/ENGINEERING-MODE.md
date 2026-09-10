# 工程模式（Engineering Mode）设计

> 板块：工程模式——thincoder 的严格方法论工作流：design-before-code、纪律层槽位提示词驱动、双门禁（设计评审 + 代码评审）。
> 本文档为**架构级机制文档**：功能性需求以机制目标与约束表述（架构级文档以约束替代用户故事——评审 2026-09-02 #1 措辞修正），非功能性需求与测试层完整。
> 提示词载体注（2026-09-10——PROMPT-SYSTEM 施工①③）：旧 engineering.md/engineering-sub.md 已退役——
> 工程纪律与逐字锚现驻 `src/prompts/discipline-engineering.md` + `persona-engineering.md`（双端各自实现——蓝图 §3.2 装配矩阵）。
> 依赖与权威关系：[AGENT-LOOP.md](AGENT-LOOP.md)（§8 工程交付协议概览、§10 子代理任务调度器、§12.1 advisor 评审对象锚——本文件机制经其 §17 权威源接管点注册）；[ADVISOR-CONVERGENCE.md](ADVISOR-CONVERGENCE.md)（评审收敛权威：design 评审 cap 豁免、code 评审 MAX_ADVISOR_ROUNDS=5、stale-context 保护）；[TESTING.md](TESTING.md) §1（测试分层 L0+/L1/L2 权威）。

> 需求层已迁出（2026-09-10 需求层拆分批）：四条铁律见 `../requirements/ENGINEERING-MODE.md` §0。

> 需求层已迁出（2026-09-10 需求层拆分批）：铁律（§0）+ 总体需求/FR/NFR/裁定清单见 `../requirements/ENGINEERING-MODE.md`。

## 2. 设计（Design）

### 2.1 角色模型

> **目标态注（2026-09-10——FR9 角色重定义，需求已收口待设计）**：现行实现为下列两角色；
> 目标态为**三段链**（主 agent 产品经理 / eng-designer / eng-coder）。本表在 FR9 设计落地前
> 描述**现行态**；目标态细节（9 条裁定）见 `../requirements/ENGINEERING-MODE.md` §1.4。

| 角色 | 职责 | 机械约束 |
|---|---|---|
| **父代理**（顶层，`role` 未定义） | 架构师：需求/设计文档 → 提醒设计就绪 → 用户发起设计评审（传 documents + object）→ 打回呈递 + 用户拍板 → 用户批准 → spawn eng-coder（默认 async）→ 交付验证（父侧 = L2 `test:full` 每链终态 1 次 + 可选的父侧复核）→ 链终核销 consume-design | 拦截型：design token 前写产品代码被拒；提示词约束：不写实现、不发起评审、等批准、验收 |
| **eng-coder**（子代理，`role="eng-coder"`） | 实现者：按设计实现 → **内部协议闭环**（explore 偏差审计 → 自修 → advisor 复评 → 收敛，≤5 修正轮；完整协议 = 本文件 §2.2 step 6）→ 交付（报告含审计/评审轮次 + 终态 clean/stalled；永不编辑设计文档） | 拦截型：spawn 需 token、写文件需 `_engDesignReviewed`；内部 spawn 仅 explore + 同步（机械门）；审计 ≤6 次（第 7 次机械拒绝 = stalled 信号） |

### 2.2 主流程（Mandatory Flow——10 步）

工程模式任务**不分大小**全走本流程——零裁量（逐字锚见 §2.9 锚#1）。普通需求点先按需求池规则登记攒批（锚#2——工程模式专用；机制见 `src/prompts/discipline-engineering.md` 需求池攒批工作流节），不越池提前启动设计。

1. 写需求/设计文档 `docs/`（三层：需求/设计/测试；按业务板块组织）。任务涉及 UI 时设计文档必须收录与用户达成的每一条 UI/交互决策（布局/流程/控件行为/状态/反馈），未定部分标 open、绝不静默发明。
2. 父代理呈递设计摘要 + 提醒"设计就绪，可以评审"——**等待，不自行调 advisor**。
3. 用户发起设计评审：父代理调 `advisor(type="design", documents=[涉及文档清单], object={type,target,status,reason,exclude})`。
   - 有 🔴 → 呈递发现 + 逐项修复建议 → **用户逐条拍板** → 修改 → 再提醒 → 用户发起复审；持续拒绝（>3 轮）→ 停下向用户报告未决项，不静默循环。
   - 无 🔴 → advisor 回显 `[DESIGN-TOKEN:…]` + designId（同 scope 复审沿用同 id）→ designId+token 入槽（`_engDesignTokens` Map）。
4. 用户批准设计——显式 sign-off 才解锁实现；用户对设计内容/形态的选择只是需求确认，不是设计批准（锚#4）。
5. spawn `eng-coder`：`subagent(role="eng-coder", designId, designToken, task)`——designId 可选（单设计省略）；
   designToken 经 PARAMETER 传值，**绝不进任务文本**；task 按 Implementation Handoff 结构化任务书（纪律层
   "实施委托结构化"节）含 Docs
   involved → 文件清单 → 验收标准——**默认 async**（返回 {id, running}，交付协议在子代理内部闭环）。
   spawn 声明 `files` + `dependsOn` 交调度器排序（重叠域 queued 自动启动；同步冲突报错；并发 ≤4——FR8）。
   机械校验：按 designId 定位 `_engDesignTokens.get(designId) === token`（单设计取唯一槽），不符即
   throw；通过 → child `_engDesignReviewed = true`（解锁写文件）+ 任务域授权（内部写豁免逐写审批）。
6. eng-coder **内部交付协议**（子代理内部闭环——完整协议以本文件为准，AGENT-LOOP §8 仅概览）：实现 → 自查透明表 → explore 偏差审计
   （审计任务书 = 父 spawn 任务书 ∪ 实际 `_touchedFiles` **机械并集**，非自述；对照设计查四类偏差：
   部分实现/静默简化/文档漂移/超清单改动未报告）→ dirty 自修（修正轮 ≤5，`修正轮 N/5` 提醒）→
   clean → advisor(type="code") 复评（documents = 设计文档 + 交付文件清单——实际文件为对象，非自述）
   → findings 自修 → 收敛交付。**R2 现行口径**：标准链 = ③审计（LLM#1）→ ④dirty 自修（L0——无
   LLM）→ ⑤advisor 首审（LLM#2）→ ⑥findings 自修（L0）→ 终审 = advisor 复评（LLM#3——验证 fix，
   不复跑审计）——**修正轮默认不重跑审计/复评**（仅触碰上次审计/评审未覆盖文件时回③）；LLM 验证
   = 3 次/链。eng-coder 永不编辑设计文档（真实文档漂移写报告归父侧）。
7. 交付 settle → 报告注入 → 父侧消化。子代理改动经 mergeChildMutations 合并进父代理（`_mutatedThisRun`/`_touchedFiles`）——失效旧 verify/advisor 标记、**重置 `_advisorRound=0`**。父侧不再自动 spawn 审计/评审（防双重审计/误用）。
8. 父代理交付验证：对照验收标准跑测试、读改动文件——**信任 eng-coder 内部验证结果（首次实现 L0+、修正轮 L0——测试分层权威 TESTING.md §1）；父侧 = L2 全量 `test:full` 恰一次（每链终态）——不再复跑 L1**。L2 失败（test:full 有 fail）→ 该链终态 non-clean → 报告用户（未达验收——不静默放行）→ 可转 fix round（同 designId+token，docs FIRST）或用户决定。
9. 父代理 verify（对照验收标准）。
10. 完成：验收标准勾销到设计文档；链闭合（verified + clean + 已签入）→ 父侧 `subagent(action="consume-design", designId=…)` 消费槽（§2.6 F1/F3）。

### 2.3 机械强制链（拦截闸 vs 流程驱动）

> **设计原则：只拦截，不催促。** 评审由流程提示词在正确节点驱动；每轮结束的机械推回（advisor/verify guard）在工程模式下**一律关闭**（含 opt-in 配置）。拦截闸（写文件门禁、token 校验）保持机械强制——防止错误行为，而非催促正确行为。

| 闸 | 类型 | 机制 | 位置 |
|---|---|---|---|
| **Design gate — token** | 拦截 | spawn 按 designId 定位 `_engDesignTokens.get(designId)`，校验 `args.designToken === 槽值` + `validateDesignToken`（格式 + TTL fail-closed——token 无签名，见 NFR3），不符即拒；会话内仅一个设计时 designId 可省略（取唯一槽），多个设计时缺 designId → 拒并要求指定 | subagent 域（CLI/VS 双端） |
| **Design gate — 产品代码变更** | 拦截 | eng-coder `!_engDesignReviewed` → 写/删/改产品代码被拒；父代理无 design token → 产品代码写/删/改被拒（豁免仅设计产出物）；门禁覆盖全部变更形态（写/删/改），非仅写 | dispatch 域（CLI/VS 双端） |
| **Code review** | 流程驱动 | **eng-coder 内部协议默认承担**：in-child advisor(type="code") 复评（documents = 设计文档 + 交付文件清单）→ findings 自修 → 收敛 ≤5 修正轮；in-child advisor 不消耗父侧 NFR2 预算；父侧复核保留可选（stalled/存疑/用户要求） | engineering.md、eng-coder.md（双端） |
| **偏差审计** | 流程驱动 | **eng-coder 内部协议默认承担**：in-child explore 审计（任务书 = 父 spawn 任务书 ∪ `_touchedFiles` 机械并集）；dirty → 自修 → 再审计；审计 ≤6 次、第 7 次机械拒绝 = stalled 信号。父侧复核保留可选 | engineering.md（双端） |
| **收敛上限** | 拦截 | code review 最多 5 轮（MAX_ADVISOR_ROUNDS——code-only）；design 评审不消耗轮次（cap 豁免）；eng-coder 非 LLM 自检不消耗轮次 | advisor/run.mjs（CLI/VS 双端） |

### 2.4 评审范围（Review Scope）——评审对象由任务定义，不由遍历决定

- **doc review**：`advisor(type="design")` 调用时**显式传 documents 参数**（需求 + 设计 + 引用文档路径）；advisor 只评审清单内文档，**不收集 git diff 变更集**（早期"按 diff 找文档"范围大、不准、与任务无关，还会漏掉 untracked 新文档——已废弃；advisor 直接 read 显式路径）。
- **object 参数必传**：评审调用必须携带对象声明 `{type, target, status, reason, exclude}`——评审对象由任务定义（AGENT-LOOP §12.1 评审对象锚机制），与 documents 同批传入；对象声明块由 advisor 消息层机械注入，评审模型无需从文档反推目标（漏传 = 评审目标模糊 = 与 documents 漏传同级错误——历史 6 次评审漏传教训）。code review 同理（object 声明交付文件/验收目标）。
- **code review**：评审范围 = task 的 Docs involved（设计文档）+ 交付文件清单/验收标准（显式化）；不遍历 git diff 找评审对象。默认由 eng-coder 内部协议承担（in-child advisor 复评 documents 同此范围）；父侧复核可选。
- 父代理负责收集涉及文档，在设计评审（documents 参数）与 spawn（Docs involved）两处传入。

### 2.5 评审时机（Review Timing）

- **设计评审（doc review）**：仅由**用户发起**——父代理呈递设计就绪并提醒，用户发话才调 advisor；打回后每轮呈递发现 + 修复建议、用户逐条拍板再改、再提醒复审（agent 不自行修完重送）；持续拒绝时停下报告。
- **交付 code review**：流程节点自动、不问用户——默认由 **eng-coder 内部协议承担**（in-child advisor 复评 → findings 子代理内自修收敛 → 收敛交付）；父侧复核保留可选——stalled/存疑才复核，发现问题回 eng-coder 修复（同 designId+token——修正轮 docs FIRST）或 minor 直修。
- **系统推回**：工程模式下 advisor/verify guard 推回一律关闭（§2.3），如未来启用也只作提示用户之用，由用户发起评审。
- **advisor 失败/中断**：停止重试，向用户报告原因。

### 2.6 Token 生命周期（链终消费制——2026-09-07 定稿）

背景：token 只存不废 = 复用洞（父代理跳过审核、未呈方案即直接复用旧 token spawn 的实证）。裁定：**spawn eng-coder 整链完成（首 spawn + 全部中间修复轮走完 → 父端验收核销）后从父端消费掉 designToken**。

- **F1（链终消费——机械）**：subagent 工具提供 `action: "consume-design"`（参数 designId——单设计会话可省略，
  spawn 同款语义）——父侧验收核销时显式调用。实现：读 `_engDesignTokens.get(designId)` 取槽值 →
  `removeDesignTokenSlot`（定义在 token-ttl.mjs——移除该 slot；**D3 2026-09-08 单值镜像已退役——不再条件清镜像**，consume 只删槽 Map 项）→ 消费后同 designId 再 spawn = 槽 not found **机械拒**。**新改动
  （含新偏差修复）一律新评审新 token**。未知 designId 与重复消费 = 同款 no-op 提示（幂等——不报错）。
- **F2（链中复用不受影响——docs FIRST）**：fix round（同 designId——首 spawn 后、验收前）仍可 spawn（slot 未消费）——消费点仅在父侧核销时（非交付 digest 时——否则 fix round 无 slot 可用）。修正轮的 findings + planned changes 必须先落所属设计文档（deviation record / change note 追加至对应章节）**再** spawn eng-coder；跳档 = 文档漂移，等同静默改动（逐字锚见 §2.9 锚#3）。
- **F3（提示词义务句——两则英文锚逐字，落点各注；锚测试 fail-when-unchanged）**：
  - 链终消费锚（落点：纪律层交付链收口节（`discipline-engineering.md`）——双端；原 engineering.md
    Mandatory Flow step 8 行后）——逐字文本：

    > **Chain-terminal token consumption**: after the delivery is verified and the chain closes out,
    > call `subagent` with `action:'consume-design'` for this designId — the slot is consumed; a
    > further spawn for the same designId is mechanically rejected, and any new work (including new
    > deviation fixes) requires a fresh design review and token. Leaving a consumed-out token in the
    > slot is the reuse hole.

  - engineering.md Work Loop「eng-coder delivery」条目修正轮句的逐字文本（双端）：

    > Fix rounds reuse the same designToken — but docs FIRST, and only while the chain is open (same designId, before parent-side close-out); once the chain terminal state is reached, every further spawn — including deviation fixes — goes through a fresh design review and token.

  - 执行判据（父侧架构师）：**链中不疑 token**（多次 spawn/fix round 复用同一 token 是正常态，非 bug，
    勿误判失效而重评审）；**链终必清 slot**（delivery verified + clean + 已签入 = 链闭合 → 立即
    consume——不消费 = slot 堆积，旧 designId 从 session 查不到，表现似"token 丢"实为未清）；
    **未闭合不消费**（stalled / L2 非 clean / fix round 在途 → 同 token 继续）；**重评审只在真新链
    需要**（同设计无新范围不重评审；新设计/新范围 → 新设计评审签发新 token，consume 旧槽）。
- **F4（边界）**：stalled 交付（未收敛）不消费——fix round 续用；父侧 L2 非 clean 不消费（同 stalled）；用户放弃该设计 → consume-design 作废（或用户明示）；跨会话恢复的持久化槽同受消费管理（恢复后仍在——直到验收消费）；consume-design 幂等；**多槽隔离（消费 A 不动 B——consume 只删槽 Map 项——槽间天然隔离）**。

### 2.7 凭证不落文档（2026-09-07）

背景：真实 token/designId 值曾被写进设计文档状态行/变更记录（运行时凭证落文档 = 死值污染 + 诱导后续评审员"照格式模仿"自编）；"脱敏占位"同样是废话——**根本不要记录**。

- **F1（提示词纪律——engineering.md Hard Rules 逐字锚，双端一致；锚测试 fail-when-unchanged）**：

  > **Credential values stay out of documents**: never write token or designId VALUES into design docs, change records, or status lines — credentials are runtime state. A review passing is recorded as "review passed"; nothing else. No values, no placeholders.

- **F2（文档面）**：值记载清理是父侧文档层持续义务（2026-09-07 已清一轮；此后新增值残留由巡检把关并报父侧清理——不背书存量零残留现状，以巡检结果为准）。
- **巡检（慢层 + slow-gate 归册——以 test:full 执行为准）**：值形态正则钉死：`/(token|designId)\s+[0-9a-f]{8}[0-9a-f:.-]*/i`（uuid 形 hex + 可选冒号 epoch 后缀——参数名不匹配，防误伤）；巡检范围 = `docs/**/*.md` + `src/prompts/**/*.md` + 根级变更记录（CHANGELOG.md/README.md/AGENTS.md）。
- **验收**：锚断言绿（双端）+ 巡检绿（test:full）+ 既有 prompts 家族零回归。

### 2.8 错误与恢复（Error & Recovery）

| 场景 | 行为 |
|---|---|
| eng-coder 中途失败/中断 | 父代理可重新 spawn（同一 token——链中未消费）；或在报告中说明 |
| 实现中设计变更（用户反馈） | eng-coder 停下报告；父代理更新设计文档 → 请求用户重新确认 → 必要时重新评审 |
| advisor 工具失败/中断 | 停止重试，向用户报告（评审时机纪律） |
| merge 冲突/异常 | mergeChildMutations 为纯内存操作，冲突不可能（单线程）；异常向上抛，父代理见错误结果 |
| 并发 spawn（同一或不同 designId） | 允许（token 链终前不消费——链终验收核销时父侧 consume-design 消费，见 §2.6）；各 eng-coder 携自己 designId+token 独立实现，父代理分别验收 |
| 会话恢复/重进 | token 随 slot 持久化（TTL 7 天 fail-closed）——重进 TTL 内恢复；过期/换槽才需重新设计评审；持久化槽同受链终消费管理（§2.6 F4） |

### 2.9 提示词锚清单（逐字契约——双端一致）

下列逐字锚是工程模式纪律层（2026-09-10 前为 engineering.md；现 = `src/prompts/discipline-engineering.md` +
`persona-engineering.md`——CLI/VS Code 双端各自实现同一语义集合）的落地契约。**字节源 = prompts 落地文本本身
（本文件不收录压缩改写版本）**；锚测试均为 fail-when-unchanged 断言（双端测试域 + 既有 prompts 对比对家族兜底）。
机制语义权威源：需求池 = `discipline-engineering.md` 需求池攒批工作流节；调度器 = AGENT-LOOP §10；
评审对象锚 = AGENT-LOOP §12.1；内部协议完整文本 = 本文件 §2.2 step 6（AGENT-LOOP §8 仅概览）。

> 落点历史注（2026-09-10——PROMPT-SYSTEM 施工①③）：下表"engineering.md"落点自施工③起 = `discipline-engineering.md`（纪律类锚——零裁量/需求池/docs FIRST/拍板≠批准/链终消费/凭证/调度器/Multi-Task/交付链收口）与 `persona-engineering.md`（人格层锚——发起权/推进档位；VSC 端 Multi-Task/R14 段原地保留于其 persona-engineering.md——端特有段各端保留）。锚句字节源不变——逐字随迁（施工③断言绿为迁移完整性凭证）。

- **锚#1 零裁量**（落点：engineering.md「Mandatory Flow (every task, no skipping)」标题下、step 1 之前——双端；顶层工程模式生效，main.md 普通模式零触碰）：

  > Task sizing is NOT your call — every user request in this mode runs the full Mandatory Flow
  > regardless of size. "The task is too small / it is just a tweak" is never a reason to skip or
  > compress a step, and no change is exempt from being recorded in the design docs. If you find
  > yourself weighing whether the flow applies, the answer is always the full flow — the user's
  > decision to be in engineering mode was the sizing decision.

- **锚#2 需求池三规则**（落点：纪律层需求池攒批工作流节（`discipline-engineering.md`）——双端；原 methodology-template.md 镜像已随模板退役。机制语义（攒批/阈值提醒/快车道/边界）= 同节三条英文锚句 + 中文批设计/边界条）：

  > 1. **Pool routing** — "ordinary requirement statements register in the owning board's requirements doc and the project docs/TODO.md「Requirement Pool」group first; design does not start until the user says start this batch (or marks the point urgent — fast lane)."
  > 2. **Threshold reminder** — "same board ≥2 or pool-wide ≥3 requirement points: remind once that batch design can start — the user still fires the review and approval."
  > 3. **Fast lane** — "the user saying this is urgent / do it now skips the pool: single-point full flow (design → review → implementation — no step cut)."

- **锚#3 修正轮 token 复用 + docs FIRST**：修正轮逐字锚见 §2.6 F3 引文（Fix rounds reuse the same designToken — but docs FIRST…）。配套指针句（落点：纪律层交付链收口节（`discipline-engineering.md`）——双端）：

  > Fix-round re-spawns are docs FIRST too — the deviation record / change note lands in the owning design doc BEFORE the eng-coder spawn (full rule: the eng-coder delivery bullet under Then handle the message).

  语义（原 engineering.md Work Loop eng-coder delivery 条目——施工③随迁至纪律层交付链收口节——修正轮 spawn 指令后附 docs FIRST 条款段）：修正轮 findings + planned changes 必须先落档再 spawn；"代码变更都必须落文档"对修正轮无豁免——跳档 = 文档漂移，等同静默改动；同设计修正轮是唯一合法 token 复用——超出设计文件清单 = 新任务，需自有流程与新 token。

- **锚#4 用户拍板 ≠ 设计批准**（落点：纪律层交付链收口节（`discipline-engineering.md`）——双端；step 5「User sign-off」指针句同文随迁）：

  > A user ruling on design CONTENT (form/shape/option choice) is requirements confirmation — NOT
  > design approval. New scope — including extensions to an already-approved design — still runs the
  > full review chain: design ready → user-initiated advisor review → user approval → implementation.
  > Approving a form ("B", "可以") never shortcuts past review. Only the explicit sign-off after the
  > advisor review unlocks eng-coder.

  step 5 指针句（引文同上规则，逐字）：

  > A user ruling on design form/shape/option choice is NOT this sign-off — scope extensions (incl. extensions to an already-approved design) still run the full review chain (full rule: the eng-coder delivery bullet under Then handle the message).

- **锚#5 链终消费**：逐字锚见 §2.6 F3 引文（Chain-terminal token consumption…）——落点纪律层交付链收口节（`discipline-engineering.md`）——双端。
- **锚#6 凭证不落文档**：逐字锚见 §2.7 F1 引文（Credential values stay out of documents…）——落点纪律层交付链收口节（`discipline-engineering.md`）——双端；配套全仓巡检正则与范围见 §2.7。
- **锚#7 调度器句**（字节源 = Multi-Task Parallelism 节调度器条款段——CLI= `discipline-engineering.md`、VSC = `persona-engineering.md`（R14 池规则段原地保留）——调度器机制权威 = AGENT-LOOP §10；本文件 FR8 行引文）："overlapping domains are queued by the scheduler, never hand-serialized"。
- **锚#8 主会话四维设计纪律（MAIN-DESIGN-ENHANCE A1-A4——2026-09-09）**（字节源 = 设计档
  MAIN-DESIGN-ENHANCE.md「逐字锚定文本 A1-A4」——A4 为评审 #4 中性化版（落点不硬编码单端路径——
  双端同一文本；施工③ A1/A3/A4 逐字随迁 `discipline-engineering.md`「设计行为纪律四维」节，
  A2 改写形态 = 同文件方案选型对比节）；机制语义权威 = `discipline-engineering.md` 文档规范节
  （三层模板/方案选型对比表/单一锚纪律——本节不收录压缩改写版本）；断言：prompts-async-guidance.test.mjs（双端——各端断言自身
  驻留 fail-when-unchanged）——逐字锚与落点：
  - **A1 勘察 checklist**（落点：`discipline-engineering.md`「设计行为纪律四维」节——需求澄清后/设计前交界语义位，不缠需求池子条目）：
    > 设计启动前先跑**勘察 checklist**：① `doc_search` 定位所属设计文档（查 docs/README.md
    > 地图——已有则更新不新建）② 读既有实现与先例 ③ 核测试面（既有用例/测试文件）④ 核双端对位面
    > （CLI/VSC 镜像）⑤ 广度勘察委派 explore 子代理（不重复已委派探索——主会话不重扫）。
  - **A2 方案对比**（落点：engineering.md step 2 首句（设计文档内容清单句）后——设计文档要求簇）：
    > 候选方案 ≥2 时，设计文档 MUST 含**方案选型对比**子节（候选/判据/取舍/否决理由表）；单一候选
    > 显式声明豁免（"单方案——无对比"）即可。
  - **A3 评审前预检**（落点：engineering.md step 3——"Remind readiness" 动作句前执行）：
    > 提"设计就绪待评审"前先跑**评审前预检**：① 需求三层具体到可设计？② 受影响文件全清单 + 行数
    > 标注（R24a）？③ 验收标准逐条回指需求（每条可机器验证）？④ UI/交互决策全落档（无"讨论过但没
    > 写"）？⑤ 方案对比已做？——预检不过先修，不自发起评审（发起权仍在用户）。
  - **A4 实践沉淀**（落点：`discipline-engineering.md`「设计行为纪律四维」节——Docs Capture the Conversation 收尾语义位；施工③按 METHODOLOGY 退役改述——"落板块设计文档/反例档案"，不再指 METHODOLOGY.md 注入体）：

### 2.10 受影响文件（折叠注）

本文档对应机制的实现早已分批落地（advisor/subagent/dispatch/agent 各层 + 双端 prompts + 测试域）。逐批受影响文件表与 R24a 行数标注为历史批记录（as-of 快照），已随格式债批折叠——不得当契约引用；模块现状以源码目录与 ARCHITECTURE.md 为准，锚落点见 §2.9 各行，行号型引用一律作废（符号锚为准，如 `removeDesignTokenSlot` 于 token-ttl.mjs）。

### 2.11 批次档机制（CLI 第 1 批——FR16 载体面）

> 需求源：`../requirements/ENGINEERING-MODE.md` §1.12（FR16）/ §1.11（FR17）/ §1.14 #9（FR20）。
> **本批范围 = 载体 + 门禁 + 路径随件**（用户 2026-09-10 确认）；六段自写 / 一段一作者等**行为纪律属第 2 批**
> （随 eng-designer 角色落地）。**范围仅 CLI**（用户指令；本仓无 VSC 端代码，镜像延后）。

**批次档是什么**：工程模式任务的流转承载物——`docs/batches/<批>-<主题>.md`（批 = 日期；主题 = 批次概括词，
通常即主板块名，允许跨板块）。六段 append-only、一段一作者、§2 即任务书——机制定义在需求档 §1.12，
**本设计不重复**；本节只设计 **CLI 端机械支撑**。

**机械支撑三点**：

1. **路径随件（spawn 注入）**：eng-coder spawn 时把批次档绝对路径注入 child 任务输入
   （`src/agent-tools/subagent-spawn.mjs` 的 `_engTaskInput` 组装处——:340 `input` 组装 / :388 赋值——追加一行 `Batch record (batchDoc): <abs>`）——子代理因此"拿到本档路径"
   （需求 §1.11 铁律 #5"随件传递"的机械面）。第 1 批只传路径，**不附六段行为指令**（第 2 批）。
2. **无运行期路径字面**：`src/` 不硬编码 `docs/batches/`——批次档路径**永远是运行期输入**（`batchDoc` 参数），
   与 FR13（不假定用户项目布局）一致；`docs/batches/` 只存在于文档规范与用户项目自己的用法里。
3. **模板不进代码**：六段模板是文档规范（需求档 §1.12），代码不校验、不生成、不匹配措辞。

### 2.12 batchDoc spawn 门禁（FR20 #9 机械面）

**规则**：engineering 模式下 spawn `role="eng-coder"` **必须传 `batchDoc` 参数**（批次档路径）——**没传即拒绝**。
`eng-designer` 角色落地后（第 2 批）**同门适用**（需求 §1.12"designer/coder 都要求"——本批先行 eng-coder）。
explore / plan / coder（普通模式）**不适用**——行为零变更。

**判据（只到"参数在 + 路径可读"）**：`args.batchDoc` 为非空字符串，且 `resolve(cwd, batchDoc)` 存在且为文件
（路径语义照 `files` 先例：cwd 相对或绝对均可，`\\` 归一为 `/`）。**不校验内容/措辞**——不做"已收口"正则、
不生成、不匹配模板（内容够不够由**执行者拒收**兜底——需求 §1.14 #9 行为面，提示词层第 2 批）。

**校验落点 = `buildSpawnChild`（token 门之前）**：async 与 sync 两条 spawn 路径都经过它——一处校验双路生效，
错误出口与 token 门一致。错误消息沿用现行风格（英文单行、破折号后给纠正动作）：
`batchDoc is required for role='eng-coder' — pass the batch record path (docs/batches/<batch>-<topic>.md); spawn refused without it.`
（路径不可读时后缀 ` (given path is not a readable file)`。）

**配套四点（含落点全路径）**：

- **schema**（`src/agent-tools/subagent.mjs` 的 properties，designToken 邻域）：`batchDoc` string 描述含 "REQUIRED for eng-coder"——
  schema 保持 advisory（`required:[]` 不动，机械检查在 execute 链——现行注释口径不变）。
- **工具描述**：动作说明串加一句（batchDoc 必传 + 拒绝语义）。
- **审计受限变体**（`src/agent/setup.mjs` 的 eng-coder 内部审计通道）：`delete props.batchDoc`——审计子代理不派生批次参数
  （与既有的 `delete props.async/id/n/designToken/designId` 同列）。
- **提示词最小同步**（门禁配套，非第 2 批规则）：`src/prompts/discipline-engineering.md`（spawn 样例行所在处）+ 中文权威
   `docs/design/prompts/discipline-engineering.md` 的 spawn 样例行补 `batchDoc=<路径>` + 一句“必传，没传即拒”——
  **机械门禁先行而样例不教，会每次撞墙**。

**落点全路径**（评审 #2）：「校验落点 = `buildSpawnChild`」指 **`src/agent-tools/subagent-spawn.mjs`**（:237 导出；
调用点 `src/agent-tools/subagent.mjs:260`，async 分支在 :294 之后——故两端均经此处）；
**不要**误放进 `src/agent-tools/subagent.mjs`（那里只是 schema 所在处）。

**文案与字面的界定**（评审 #7）：错误消息里的 `docs/batches/<批>-<主题>.md` 是**提示文案**，
**不参与路径判定、不是默认位置**（判定只看 `batchDoc` 传入值）——与 §2.11 第 2 点“不硬编码运行期路径”不矛盾；
该串仅在消息里引导，不向用户项目强加目录形状。

### 2.13 交界面锚的机械面（FR17 本批可落部分）

需求 §1.11 **五条铁律**中，本批：**两条既有机械支撑（#1/#2，无改动）· 一条本批落机械面（#5）· 两条属提示词纪律（#3/#4，第 2 批）**：

| 铁律 | 本批落地 |
|---|---|
| #1 产物落盘、消息只报告 | （既有——无改动） |
| #2 凭证走参数 | （既有——无改动） |
| #5 随件传递、各写己段 | **机械面 = batchDoc 注入 child 任务输入**（§2.11.1）；行为面（自写己段）第 2 批 |
| #3 澄清必经主 agent / #4 三方条目一致 | 提示词纪律（第 2 批，随 eng-designer） |

### 2.13.1 方案选型（本批四个决策点）

| 决策点 | 候选 | 选定 | 否决理由 |
|---|---|---|---|
| 校验落点 | A `buildSpawnChild`（token 门旁）· B `subagent.mjs` execute 内 · C 两处都查 | **A** | **A 与 B 的覆盖等价**（`execute` 在 :260 调 `buildSpawnChild`，async 分支在其后 :294——放 B 同样双路覆盖），
A 胜在：**单一共用装配点 + 与 token 门同出口**（错误生命周期一致）；B 覆盖等价但会把门禁拆到与 token 门不同的层，后续加角色时需再想一遍；C 冗余（本条否决理由已按评审 #5 修正——原“B 只盖同步前半”不成立） |
| 判据级别 | (i) 措辞正则（"已收口"）· (ii) 机器标记（HTML 注释）· (iii) 存在 + 可读 | **(iii)** | (i) 把中文措辞写死进代码、模板一改就断；(ii) 给文档加机器字段=形状约束；(iii) 零脆弱——内容好坏由执行者拒收兜底（需求已定） |
| 提示词同步时机 | 本批最小同步（样例行）· 全部留给第 2 批 | **本批最小同步** | 门禁先行而样例不教 = 每次调用撞墙；第 2 批的"六段自写"规则仍留第 2 批 |
| 测试落点 | 新文件 `test/batch-doc-gate.test.mjs` · 并入 design-token-settlement | **新文件** | 机制独立（batchDoc ≠ token）；token 测试已 245 行。构造手法照抄**两份**先例：`test/design-token-settlement.test.mjs`（隔离缝 + 最小 agent + assert.throws）与 **`test/subagent-id-counter.test.mjs:12,27`**（直驱 `buildSpawnChild`——T27 成功路径断言靠它） |


### 2.14 受影响文件（第 1 批 as-of 快照——不得当契约引用）

| 文件 | 性质 | as-of 行数 | 预计增量 | 拆分评审 |
|---|---|---|---|---|
| src/agent-tools/subagent.mjs | 修改 | 394 | ≤±12 | **>300 文件档**——本批不拆：单点增量（properties 一项 + 描述一句），不新增函数；若实施中发现单函数将超 300 行 → 停下报告，不静默扩 |
| src/agent-tools/subagent-spawn.mjs | 修改 | 418 | ≤±25 | **>300 文件档**——本批不拆：门禁为 `buildSpawnChild` 内一段短判断 + 消息构造；不触发函数档但拆留待整体重构批 |
| src/agent/setup.mjs | 修改 | 340 | ≤±2 | **>300 文件档**——本批不拆：单行 `delete props.batchDoc` |
| src/prompts/discipline-engineering.md | 修改 | 195 | ≤±4 | 纯 .md——免除行数标注（按评审标准） |
| docs/design/prompts/discipline-engineering.md | 修改 | 122 | ≤±4 | 纯 .md——免除标注（中文权威模板，双源同步） |
| docs/design/AGENT-LOOP.md | 修改 | 715 | ≤±6 | 纯 .md——免除标注（§10.1 参数表加 batchDoc 行） |
| test/batch-doc-gate.test.mjs | **新增** | — | +80±30 | 新建测试文件（T25/T25b/T26/T27/T28/T29） |

> 行数为 2026-09-10 实测（`wc -l` 口径：读工具总行数报数）；三个 &gt;300 行源文件均**不触发拆分**
> （本批增量合计 ≤39 行、无新函数），故不出拆分计划——待后续整体重构批（见 TODO 结构债组）。

### 2.15 eng-designer 角色（第 2 批——CLI 端；FR9 + FR19）

**角色定位**：写稿面唯一作者——写 **需求文档 / 设计档 / 批次档 §2**；**不写实现代码**、**不改提示词文件**（§1.5 #8）、
**不发起评审**（#6）；**无 designToken**（#4：授权 = 需求已确认）；**必传 `batchDoc`**（与 coder 同门）。

**A. 角色注册（五处硬清单 + 模式门）**

| 落点 | 改动 |
|---|---|
| `src/agent-tools/subagent.mjs:145`（schema enum） | 加 `"eng-designer"` |
| `:224` ROLES 白名单 + `:226` 错误文案 | 加角色 |
| `:124-129` 工具描述（角色矩阵 + Mode filtering 句） | 加 designer 行；模式句改“工程模式 = explore/plan/**eng-designer**/eng-coder” |
| `src/agent/setup.mjs:187`（工程模式 enum）+ `:189` suffix | 加角色 |
| `src/tui/tool-args.mjs:44`（显示 case） | 加 `case "eng-designer"` |

**角色注册共 5 处**（上表 5 行）——AC16/T30 按“**五处**”计数。

**batchDoc 的模型面文案同步（评审 #9）**：`subagent.mjs:149` schema 描述现写“REQUIRED for role='eng-coder'…
explore/plan/coder spawns ignore it”、`:128` 角色条目为 eng-coder 专属句——**同批扩为角色集合**（`eng-coder`/`eng-designer`），
并同步纪律层 spawn 样例行（含 `batchDoc=` 的 designer 例）——口径同 §2.12“提示词最小同步”（门禁先行而样例不教 = 每次撞墙）。

**越界错误文案参数化（评审 #13）**：`src/agent/spawn-child.mjs:47/:50` 与 `src/agent-tools/subagent.mjs:237` 的“eng-coder”专属措辞
改为**带实际角色名**（designer 越界时不误导）。

**主 agent 人格改写（评审 #1——PROMPT-SYSTEM §8.1:271 已登记；FR9 #1/#2）**：

| 文件 | 改动 |
|---|---|
| `docs/design/prompts/persona-engineering.md`（中文权威，先定稿） | 身份段从 ARCHITECT/Designer 改述为**产品经理 + 流程编排者**（保留编排/确认/核验/发起权——FR9 #1/#2）；删去“deliverables = 需求+设计文档”句 |
| `src/prompts/persona-engineering.md`（英文落地） | 同义改述（现行 `:10-13` “You are the ARCHITECT… 1. the requirements + design documents”、`:34` “You design and delegate”） |

**为何必须同批**：不落此面，落地后**主会话人格仍自称设计文档的交付者**——与 §2.15:295“eng-designer = 写稿面唯一作者”直接互斥（机制级两处不同描述）。

**纪律层“主会话即 designer”句撤销（评审 #2——PROMPT-SYSTEM §8.1:274 已登记）**：
双源 `discipline-engineering.md`（`src/prompts/:28` / `docs/design/prompts/:21`）删该句；“设计行为纪律四维”归属改述为**设计者角色**的纪律。

**纪律层四步流程改写（PROMPT-SYSTEM §8.1:273——同批一并落，超出评审发现的补充项）**：写“设计=需求检验”定位 + 需求缺口停报链;
该文件同时是 designer 的装配链成员，与 §2.16 四条行为纪律**同一文件落点**。

**模式门（对称补全）**：`subagent.mjs:236-241` 现有两门（工程禁 coder / 非工程禁 eng-coder）→ **加第三门**：
**非工程模式 spawn eng-designer → throw**（它是工程模式专属角色，与 eng-coder 同族）。

**B. 提示词装配（四处——漏一处不报错，是静默回退陷阱）**

| 落点 | 改动 |
|---|---|
| `src/prompt-overlays.mjs:22-32` SLOT_CONTENTS | 加 `loadSlot("persona-eng-designer.md")`（不登记 → `:77` 缺槽告警路径） |
| `:47-55` SCENARIO_SLOT_FILES | 加 `"eng-designer": ["persona-eng-designer.md", "common.md", "discipline-engineering.md"]`（不登记 → `:70-71` **静默返回 CONSULT_BASE 且零警告**） |
| `src/agent/setup.mjs:295-301` 场景映射 | **外层谓词 + 内层选择器都要改（评审 #3）**：外层的 `(depth === 0 \|\| agent._role === "eng-coder")` 扩为工程角色集合；
**内层的 `agent._role === "eng-coder" ? "eng-coder" : "engineering"`（`:299`）必须同步映射 `eng-designer → "eng-designer"`**——
只改外层会让 designer 拿到 `assemblePrompt("engineering")`（= 主会话人格），正是本行要防的静默错配 |
| `src/agent-tools/subagent-spawn.mjs:322-326` childConfig | `role === "eng-coder" → engineering:true` 扩为工程角色集合（designer 也必须 `engineering:true` 才能装配工程纪律槽） |

**C. 新槽文件（双源——体例照 `persona-eng-coder.md`：头注 `slot:[1] consumers:[...]` + 身份/授权/边界/产出/纪律）**

- `docs/design/prompts/persona-eng-designer.md`（**中文权威模板**，先定稿）
- `src/prompts/persona-eng-designer.md`（英文落地产物）

**内容要素**（逐项对应需求，不自由发挥）：身份=写稿面唯一作者 · 授权=需求已确认（**无 token**）· 边界=不写实现/不改提示词/不发起评审 ·
收到什么（批次档 §1 + 本批 todo 项 + 需求体系 + 清单）· **缺料就打回** · 五步（勘察 → 并入需求 + 体系对账 → 每条需求配判定句 → 写设计 → 自检交回停）·
失败路径 · **执行者拒收**（查不到任务书不执行）· 批次的写手边界（§2 自写）。

**FR19 产出要求——必含要素逐项列（评审 #5；需求档 :78 / §1.8）**：

1. **产出两件不混**：①本批批次任务（覆盖条目 / 不在本批 / 受影响文件 / 验收标准 → **批次档 §2**，不写进设计档）
   ②设计档（8 项：三层需求 / 方案与选型 / 受影响文件带行数 / 验收标准逐条回指 / 用例表 / 边界 / 关键决策 / 接口契约）。
2. **判定句**：每条需求配验收口径——执行面进提示词、判据面落需求档（供核对）。
3. **缺料/冲突的打回链**（需求说不通 / 现实与需求冲突 / 归属不明 → 打回主 agent，不自己编）。

**D. spawn 面：batchDoc 同门 + 勘察能力**

1. **batchDoc 门扩角色集**：`subagent-spawn.mjs:251/254` 的 `role === "eng-coder"` 精确串 → 角色集合
   `NEEDS_BATCH_DOC = {eng-coder, eng-designer}`；错误文案相应参数化（带实际角色名）；注入行 `:366` 同步扩。
2. **勘察能力（§1.5 #7——设计者自己做勘察）**：新增 **designer 专属受限 subagent 变体**（explore-only）——
   镜像 `setup.mjs:224-257` 的 eng-coder 审计变体：`props.role = { enum: ["explore"] }` +
   `delete props.async/id/n/designToken/designId/batchDoc`；注入点同族（`setup.mjs:277` 的 depthOnly 链，`designer` 行加入该变体）。
3. **子代 spawn 门**：`src/agent/spawn-child.mjs:44-58` `gateEngCoderSpawn` 现只认父角色 eng-coder——**扩为父角色集合**
   （eng-coder / eng-designer）→ 两者都只允许 spawn `explore`；**审计预算（6）仍只计 eng-coder**（designer 勘察非审计；
   防滥用靠并发池 other≤4）。**返回值语义（评审 #4）**：designer 父路径校验通过后**必须返回 `null`**——
   `subagent-spawn.mjs:374` 以 `engAuditAttempt !== null` 为审计任务书注入开关（`:376-393` 会追写“你在审计 eng-coder 交付”范围块）——
   非 null 会把审计范围误注进勘察任务书。
4. **变体实现口径（评审 #8）**：designer 变体 = **参数化复用**既有受限变体（父角色集合条件 + 描述文案分流），**不并列第二个 34 行 IIFE**——
   据此 `setup.mjs` 增量守住 ≤±20。

**E. 写域边界（**提示词纪律——无机械门**，2026-09-10 用户裁定）**

设计者的写域 = `docs/`（扣 `docs/design/prompts/`）。**不新增机械门**（用户裁定“不需要机械门禁”）——
靠 **persona-eng-designer 明写写域** + **主 agent 内容性核验**（§1.5 #2）兼底。

- 事实前提（勘察实证）：现行 `dispatch.mjs` **无障碍拦 designer 写 `src/**`**（该文件的 `:172` 门只对 `agent._role === "eng-coder"` 生效、
  `:193` 门只对 depth 0 生效）——本批**有意不补门**：越界风险由提示词 + 核验承担（与“执行者拒收”同族纪律）。
- **不新增写域门 = 不改 `src/agent/dispatch.mjs`**（从受影响文件表移除该项）。
- **已知摩擦（评审 #7——用户 2026-09-10 裁定“接受”）**：designer 子代理**不**拿 `_engTaskAuthorized`（`subagent-spawn.mjs:345` 仅给 eng-coder），
  故其每次写操作走 `dispatch.mjs:220` 的人工 ask；**用户裁定：接受**——授权弹窗可“全部授权/切自动”；
  设计**不为此加任务域豁免**（与“不需要机械门禁”口径一致）。用例固化该预期（T39）。

**F. 展示面（TUI 四处）**：`src/tui/cmd-submodel.mjs:4` SUBMODEL_SLOTS（+ `:24/:90` 注释“4 role slots”→5）·
`src/tui/slash-commands.mjs:45`（描述串）+ `:147`（补全候选）· `src/tui/subagent-blocks.mjs:69` SUBAGENT_ROLES。
（`:29` 前缀正则已含连字符——无需改。）

**G. 文档登记面（6 处——评审 #6 修正计数）**：`docs/requirements/PROMPT-SYSTEM.md:39`（命名法角色行）· `:45-46`（文件计数）·
`:54-59`（人格层大纲加行）· `:195-207`（§3.2 装配矩阵加行）· `docs/design/AGENT-LOOP.md:177-184`（角色矩阵 + Mode filtering）·
`AGENTS.md:56`（槽位清单）。

### 2.16 行为纪律（第 2 批 B——提示词层，双源同步）

| 纪律 | 内容 | 落点 |
|---|---|---|
| **六段自写 · 一段一作者** | §1 主 agent / **§2 designer** / §3 评审子代理 / §4 主 agent / §5 coder / §6 父代理 | persona-eng-designer（§2 自写）+ persona-eng-coder（§5 自写）+ discipline-engineering（§3/§4/§6 归属 + **过渡期注**：§3 自写机制未落地前由父侧代写） |
| **执行者拒收**（FR20 #9 行为面） | 任务书/依据不存在→**不执行、打回**（coder 找不到 §2 / designer 找不到 §1） | persona-eng-designer + persona-eng-coder + discipline-engineering |
| **澄清必经主 agent**（#3） | 子代理撞到需用户决定的事→打回主代理（无旁路） | discipline-engineering |
| **三方条目一致**（#4） | 批次档 §2 条目 = 设计档验收回指 = 需求档条目 | discipline-engineering |
| **纪律层身份句撤销**（评审 #2——PROMPT-SYSTEM §8.1:274） | 删双源 `discipline-engineering.md` 的“主会话即 designer”（`src/prompts/:28` / `docs/design/prompts/:21`）；
设计行为纪律四维→归属设计者角色 | discipline-engineering（双源） |
| **四步流程改写**（§8.1:273） | 设计=需求检验定位 + 需求缺口停报链 | discipline-engineering（双源） |

**锚断言口径**：四条纪律的关键句（执行者拒收 / 一段一作者 / 澄清必经主 agent / 三方一致）**进 fail-when-unchanged 家族**
（`test/prompts-async-guidance.test.mjs` 现有机制）——**且新增 `persona-eng-designer.md` 必须进 `NEW_PROMPTS` 清单**
（`test:33-38`），否则首行格式断言（`:374-384`）与表行宽断言（`:386-398`）**不覆盖它**（漏覆盖即漏防）。

### 2.17 方案选型（第 2 批四个决策点）

| 决策点 | 候选 | 选定 | 否决理由 |
|---|---|---|---|
| **设计者写域边界** | A 加机械门（仅 docs/，扣 prompts）· B **纯提示词纪律 + 核验兜底** | **B**（2026-09-10 **用户裁定**） | A 需新增一道门（直改 dispatch 拦截层），而写稿面越界概率低、已有两层兼底（persona 明写写域 + 主 agent 内容性核验 §1.5#2）；**用户裁定：不需要机械门禁** |
| **设计者勘察手段** | A 受限 explore-only 变体 · B 全量 subagent 工具 · C 不给（只靠主 agent 勘察） | **A** | #7 明定“设计者自己做勘察”——C 直接违背；B 让设计者能 spawn coder 类写手 = 越界面过大（最小权限） |
| **角色是否全量入 TUI** | A 入（submodel/subagent-blocks/补全） · B 只入核心、展示面留后 | **A** | 角色半登记会造成“可在但不显示/不可配模型”的怪异态；本批一次做完 |
| **纪律句进锚断言** | A 进 · B 只上文案 | **A** | 锚断言家族正是“提示词不得静默漂移”的机械保障；纪律句是本批核心产物 |

### 2.18 受影响文件（第 2 批 as-of 快照——不得当契约引用）

| 文件 | 性质 | as-of 行数 | 预计增量 | 拆分评审 |
|---|---|---|---|---|
| src/agent-tools/subagent.mjs | 修改 | 395 | ≤±10 | >300 档——**不拆**：四处枚举/描述单点增量，无新函数 |
| src/agent-tools/subagent-spawn.mjs | 修改 | 444 | ≤±15 | >300 档——**不拆**：门判据扩集合 + 注入行扩；不新增函数 |
| src/agent/spawn-child.mjs | 修改 | 218 | ≤±12 | — |
| src/agent/setup.mjs | 修改 | 343 | ≤±20 | >300 档——**不拆**：枚举/变体/场景映射/工具链四处单点 |
| src/prompt-overlays.mjs | 修改 | 81 | ≤±4 | — |
| src/tui/cmd-submodel.mjs | 修改 | 155 | ≤±6 | — |
| src/tui/slash-commands.mjs | 修改 | 187 | ≤±2 | — |
| src/tui/subagent-blocks.mjs | 修改 | 451 | ≤±2 | >300 档——**不拆**：数组加一项 |
| src/tui/tool-args.mjs | 修改 | 82 | ≤±1 | — |
| src/prompts/persona-eng-designer.md | **新增** | — | ~30 | 新提示词槽文件（英文落地） |
| docs/design/prompts/persona-eng-designer.md | **新增** | — | ~30 | 新提示词槽文件（中文权威） |
| src/prompts/discipline-engineering.md | 修改 | 196 | ≤±12 | 纯 .md 豁免行数标注（纪律句） |
| docs/design/prompts/discipline-engineering.md | 修改 | 124 | ≤±12 | 纯 .md 豁免（双源） |
| src/prompts/persona-eng-coder.md | 修改 | 30 | ≤±4 | 纯 .md（§5 自写 + 拒收句） |
| docs/design/prompts/persona-eng-coder.md | 修改 | 30 | ≤±4 | 纯 .md（双源） |
| src/prompts/persona-engineering.md | 修改 | 40 | ≤±15 | 纯 .md——**主 agent 人格改述**（评审 #1；PROMPT-SYSTEM §8.1:271） |
| docs/design/prompts/persona-engineering.md | 修改 | 40 | ≤±15 | 纯 .md（中文权威，双源） |
| docs/requirements/PROMPT-SYSTEM.md | 修改 | 295 | ≤±8 | 纯 .md（登记面 5 处） |
| docs/design/AGENT-LOOP.md | 修改 | 720 | ≤±6 | 纯 .md |
| AGENTS.md | 修改 | 69 | ≤±2 | 纯 .md |
| test/prompts-async-guidance.test.mjs | 修改 | 417 | ≤±25 | **>300 档——不拆**：仅增断言、不新增函数。**需同步之处（评审 #12）**：`:51/:294/:413` 的六场景数组与 `:32` 注释“新 14 文件全集”（新场景/新文件不入则无覆盖） |
| test/batch-doc-gate.test.mjs | 修改 | 160 | ≤±25 | 门文案与角色集同步 |
| test/eng-designer-role.test.mjs | **新增** | — | +120±40 | 角色注册/装配不回退/勘察受限用例 |

> 行数为 2026-09-10 实测；.md 提示词/文档文件按标准豁免行数标注；
> 表中 **>300 行的共 5 个**（4 个源文件 `subagent.mjs` 395 / `subagent-spawn.mjs` 444 / `setup.mjs` 343 / `subagent-blocks.mjs` 451
> + 测试 `prompts-async-guidance.test.mjs` 417）——均**不触发拆分**（各为单点增量、无新函数/仅增断言；评审 #8 修正了原“六个”误计）；
> 若实施中出现单函数超 300 行，停下报告。


## 3. 测试（Testing）

### 3.1 验收标准（Acceptance Criteria）

- AC1: 工程模式下，无 design token 时写产品代码（含 `src/prompts/*.md`）被 dispatch 拒绝；写 `docs/**` 与根级文档放行。
- AC2: spawn eng-coder 时 token 不匹配即 throw；匹配则 `_engDesignReviewed = true` 解锁写文件。
- AC3: 工程模式顶层 system prompt 不含 main.md/discipline.md 条款（解耦后）。
- AC4: doc review 按显式 documents 清单评审——清单外文档（如无关的 git diff 变更）不被评审。
- AC5: eng-coder 交付前自查扩展为**内部协议闭环**——explore 偏差审计 + advisor code review 复评在子代理内部自动运行（默认承担，无需用户在场）；交付报告含审计/评审轮次与终态 clean/stalled；父侧复核保留可选。
- AC6: 评审时机纪律生效——设计评审仅用户发起时调用；无用户发起/交付流程节点时，父代理不调 advisor（交付评审节点 = eng-coder 内部协议自动承担，父侧 advisor 仅可选复核时调用）。
- AC7: `npm test`（fast 层，slow 门控跳过）与 `npm run test:full`（含 slow 层）均通过（平台无关路径写法）。
- AC8: 多设计并行——各 eng-coder 凭自己 designId+token 独立通过，后签发**不覆盖**前签发；某 design 复审失败 → 该次评审不入槽（同 scope 复审沿用同 id）、既有槽不清（旧 token 存活至 TTL）、其他设计槽不受波及；顶层 engineering.md 注入并行化纪律（断言可指认）。
- AC9: 首次交付偏差审计下沉 eng-coder 内部协议（自动节点、无需用户发起不变——内部 explore 审计 + dirty 自修在子代理内部闭环，不依赖用户在场）；父侧复核保留可选（stalled/存疑才复核）。
- AC10（§2.12）: engineering 模式 spawn eng-coder **不带 batchDoc** → throw（消息含纠正动作）；**带存在路径** → 通过且 child 任务输入含该路径；**带不存在路径** → throw（消息含 "(given path is not a readable file)" 后缀）。
- AC11（§2.12）: 判据只到"参数在 + 路径可读"——**不校验内容/措辞**（不匹配模板、不生成、不判"已收口"）。
- AC12（§2.12）: explore/plan/coder（普通模式）spawn 不要求 batchDoc——现行行为零变更；sync 与 async 两条路径均被门禁覆盖（校验在 buildSpawnChild）。
- AC13（§2.12）: eng-coder 审计受限 schema 变体**不含** batchDoc 属性（delete 清单——实现枚举照 `src/agent/setup.mjs` 实际清单 async/id/n/designToken/designId 追加）。
- AC14（§2.11 点 2）: `src/` 内**无 `docs/batches/` 逻辑字面**（评审 #3）——源码全仓扫描该串仅出现在**错误/提示文案**中（§2.12 消息），无路径解析/默认位置引用。
- AC15（§2.11 点 3 + §2.12 提示词同步）: `src/` 不生成/不校验批次档模板（无“已收口”类措辞匹配、无模板常量）；且 spawn 样例行含 `batchDoc=`（**双源** `discipline-engineering.md`——`src/prompts` 英文落地 + `docs/design/prompts` 中文权威，非双端；校验方式 = 对两文件 grep `batchDoc=`，**非既有锚断言家族**——该家族只断言枚举子串）。
- AC16（§2.15 A）: `eng-designer` 入**五处**硬清单（subagent.mjs 的 schema/ROLES/描述 + setup.mjs 工程模式枚举 + tool-args 显示）——五处在位且可分别断言；非工程模式 spawn 它 → throw。
- AC17（§2.15 B——**防静默回退**）: designer 场景**已登记**装配——`assemblePrompt("eng-designer")` 返回的 prompt **非空且 ≠ CONSULT_BASE**，
  槽序 = `persona-eng-designer → common → discipline-engineering`，warnings 为空（盖 `prompt-overlays.mjs:70-71` 的静默回退陷阱）；
  **且接线断言（评审 #3）**：designer 子代理**实选场景 = `eng-designer`**（非 `engineering`/`normal`）——盖 `setup.mjs:299` 内层选择器。
- AC18（§2.15 D）: designer spawn **必传 `batchDoc`**（与 eng-coder 同门；不带→throw、带可读路径→通过且任务输入含 `Batch record` 行）；错误文案**含实际角色名**。
- AC19（§2.15 E）: **写域边界为提示词级（无机械门——用户裁定）**——`persona-eng-designer.md`（双源）**明写写域**（`docs/` 且不写 `docs/design/prompts/`）；`src/agent/dispatch.mjs` **保持不变**（不新增写域判定；其他角色行为零变更）。
- AC20（§2.15 D2/D3）: designer 的勘察变体 = **explore-only**（无法 spawn 其他角色）；且**无 designToken 需求**（设计师不需要凭证——§1.5 #4）。
- AC21（§2.15 C）: `persona-eng-designer.md` 双源齐备（`src/prompts/` + `docs/design/prompts/`），首行头注合 `slot:[1] consumers:[...]` 格式，且已入 `NEW_PROMPTS` 清单（否则不打格式/宽行断言）。
- AC22（§2.16）: 四条行为纪律句双源在位且入锚断言家族：六段自写·一段一作者 / 执行者拒收 / 澄清必经主 agent / 三方条目一致。
- AC23（§2.15 A——评审 #1）: **主 agent 人格已改述**（PROMPT-SYSTEM §8.1:271 落档）——双源 `persona-engineering.md` 含产品经理/会话面身份，**不再自称设计文档交付者**（`ARCHITECT`/`You design and delegate` 语义已除）。
- AC24（§2.15 A——评审 #2）: **“主会话即 designer”句已撤销**——双源 `discipline-engineering.md` 无该句；设计行为纪律四维归属已改述。
- AC25（§2.15 C——评审 #5）: `persona-eng-designer.md` 必含 FR19 产出要素（产出两件不混 + 设计档 8 项 + 判定句 + 打回链）——双源 grep 关键子串验证。
- AC26（§2.15 E——评审 #7）: designer 子代理**保留**人工 ask 路径（不加任务域豁免）：其写操作经父侧授权；且授权弹窗提供“全部授权/切自动”（一次性摩擦）。

### 3.2 用例表

| # | 场景 | 输入 | 预期输出 | 映射 |
|---|---|---|---|---|
| T1 | 正常：设计→token→spawn | 设计评审通过（无 🔴）→ spawn 带正确 token | token 签发；eng-coder 解锁写文件并完成实现 | FR3 |
| T2 | 错误：token 不匹配 | spawn 带错误/缺失 token | throw "Invalid or missing design token" | FR3 |
| T3 | 边界：复审失败（既有通过后的复审） | 复审含 🔴 | token 不签发（同 scope 复审沿用同 id——既有槽原样）；既有 token **存活至 TTL** | FR3/NFR3 |
| T4 | 错误：设计前写代码 | engineering=true、无 token、写 src/app.mjs | dispatch 拒绝（"design review required"） | FR1 |
| T4b | 变更形态全覆盖 | 无 token 删除/移动产品代码文件 | 同写路径被拒（门禁覆盖写/删/改全部变更形态） | FR1 |
| T5 | 边界：设计前写 src/prompts/*.md | 同上，写 src/prompts/x.md | 拒绝（isProductCode） | FR1 |
| T6 | 边界：设计前写 docs/ 文档 | 同上，写 docs/design/x.md | 放行 | FR1 |
| T7 | 错误：advisor 失败 | advisor 调用 aborted | 停止重试，报告中说明 | FR5 |
| T8 | 边界：resume/重进后 token 恢复（TTL 内） | 会话恢复后 spawn（同 slot、TTL 内） | token 校验通过，eng-coder 解锁写文件——不再重新评审 | FR3 |
| T8b | 边界：角色互斥 | 工程模式 spawn `role="coder"` | 拒绝（schema 枚举 + 运行期硬门禁） | NFR4 |
| T9 | 正常：eng-coder 内部复评 | eng-coder 内部协议 advisor(type=code) 复评（documents=设计文档+交付清单） | 复评通过（或 findings 自修收敛）→ 交付报告含轮次 + clean/stalled；父侧复核可选 | FR4 |
| T10 | 边界：评审范围显式化 | design review 传 documents=[X.md]，diff 含无关文档 Y.md | 只评审 X.md，Y.md 不被提及 | FR2 |
| T11 | 边界：范围外写文件 | eng-coder 试图写文件清单外路径 | **A 裁定**：允许——交付时逐项报告（说明原因）；审计"out-of-list"判据 = 改了且未报告 = 偏差（静默越权）；已报告 = 透明可接受（纪律保障，机械层无此检查） | FR6 |
| T12 | 边界：收敛上限 | 工程模式下 code review 第 6 次调用 | 被 MAX_ADVISOR_ROUNDS 拒绝（code-only——design 评审 cap 豁免，见 ADVISOR-CONVERGENCE.md） | NFR2 |
| T13 | 边界：评审时机纪律 | 设计文档就绪但用户未发起时 | 父代理不调 advisor、只提醒就绪（提示词行为；机械层无自动触发——纪律保障） | FR5 |
| T14 | 边界：同一 token 多次 spawn | 同一设计 token 连续 spawn 两个 eng-coder | 两者均成功（token 链终前不消费——链终核销时 consume-design 消费）；各自独立实现 | FR3 |
| T15 | 正常：双设计并行 spawn | 两个 design review 分别通过（各自 designId+token）→ 并行 spawn eng-coder 各带自己 designId+token | 两者均通过、互不覆盖（单值槽时代后者会拒前者 token） | FR3/FR8 |
| T16 | 边界：designId 缺失 + 多设计 | 会话内有两个不同 designId，spawn 只带 designToken 不带 designId | throw 要求指定 designId（不误取任一槽） | FR3 |
| T17 | 边界：评审失效隔离 | 某 design 的复审失败（含 🔴） | 复审不签发——既有槽原样；**其他并行设计槽不受波及、token 仍有效** | FR8/NFR3 |
| T18 | 边界：并行文件交集——调度器口径 | 两任务写域有交集时父代理 spawn（声明 files） | 重叠任务入 queued 自动排队——冲突清后自动启动（不提示串行/不手动停——调度器语义）；未声明 files → 无冲突检测；同步 spawn 冲突 → 明确错误 | FR8 |
| T19 | 正常：内部偏差审计闭环（R2 现行口径） | eng-coder 交付前 → 内部 explore 审计 → dirty 自修（L0）→ advisor 首审（L0 自修）→ 终审 = advisor 复评（LLM#3——验证 fix，不复跑审计）——修正轮默认不重跑审计/复评 | 收敛 → 交付（报告含审计/评审轮次 + clean/stalled）；5 轮未收敛或审计节点重试仍败 → stalled 报告（不静默） | FR4/AC9 |
| T20 | 正常：链终消费 | 链闭合（delivery verified + clean + 已签入）后父侧 consume-design（designId 参数） | slot 消费——同 designId 再 spawn = 机械拒；新工作（含新偏差修复）需新评审新 token | FR3/F1 |
| T21 | 边界：链中 fix round 复用 | 首 spawn 后、验收前（未消费）——修正轮先落档（docs FIRST）再以同 designId+token spawn | 通过（slot 未消费）；消费点仅在父侧核销时 | F2/F3 |
| T22 | 边界：未闭合不消费 | stalled 交付，或父侧 L2 test:full 有 fail | 不消费——同 token 续 fix round | F2/F4 |
| T23 | 边界：幂等 + 多槽隔离 | 未知 designId / 重复 consume；消费 A 时 B 在槽 | 未知 id 与重复消费 = no-op 提示（不报错）；消费 A 不动 B（consume 只删槽 Map 项——槽间天然隔离） | F1/F4 |
| T24 | 边界：凭证不落文档巡检（慢层） | 全仓 md（docs/** + src/prompts/** + 根级变更记录）扫描值形态正则 `/(token\|designId)\s+[0-9a-f]{8}[0-9a-f:.-]*/i` | 零命中（参数名不匹配防误伤） | §2.7 F1/F2 |
| T25 | 错误：eng-coder 无 batchDoc | engineering=true、token 合法、spawn 不带 batchDoc | throw /batchDoc is required/（含纠正动作） | FR20#9/§2.12 |
| T26 | 错误：batchDoc 指向不存在路径 | batchDoc="docs/batches/none.md"（文件不存在） | throw，消息含 "(given path is not a readable file)" | FR20#9/§2.12 |
| T27 | 正常：batchDoc 存在 | 先建临时批次档文件，spawn 带 batchDoc=<路径> | 通过；child 任务输入含 "Batch record (batchDoc): <abs>" | FR16/FR17#5/§2.11 |
| T25b | 错误：sync 路径缺 batchDoc（评审 #4） | engineering=true、token 合法、`async:false`、不带 batchDoc | 同样 throw（双路覆盖断言成真——校验在 buildSpawnChild） | AC12/§2.12 |
| T28 | 边界：非 eng-coder 不受影响 | explore spawn 不带 batchDoc | 现行行为不变（不拒绝） | §2.12 |
| T29 | 边界：审计受限变体 | setup 组装 eng-coder 审计通道 schema | properties 不含 batchDoc | AC13 |

注：FR7（待办管理）为流程级约定，由 Docs/Project TODO 纪律保障，不作机械测试——方法论明示。

**第 2 批用例（T30–T37）**

| # | 场景 | 输入 | 预期输出 | 映射 |
|---|---|---|---|---|
| T30 | 正常：角色注册五处 | 工程模式 spawn `role="eng-designer"` | 不被白名单/模式门拒；child 装配工程纪律槽 | AC16/FR9 |
| T31 | 错误：角色互斥 | **非**工程模式 spawn `eng-designer` | throw（与 eng-coder 门同族） | AC16/NFR4 |
| T32 | 边界：装配不静默回退 | `assemblePrompt("eng-designer")` | prompt 非空、≠ CONSULT_BASE、槽序正确、warnings=[] | AC17/FR9 |
| T33 | 错误：designer 无 batchDoc | 带 token 合法上下文、不带 batchDoc | throw（文案含 eng-designer） | AC18/FR20#9 |
| T34 | **边界：写域纪律（提示词级）** | grep 双源 `persona-eng-designer.md`；并校对 `src/agent/dispatch.mjs` | persona 含写域声明（`docs/` 扣除 `docs/design/prompts/`）；dispatch **无新增写域判定**（机械层零变更） | AC19/**§1.5#8** + 批次档 §1 对账发现 2 |
| T38 | 边界：主 agent 人格改述 | 双源 grep `persona-engineering.md` | 含产品经理/会话面身份；不含 `ARCHITECT`/`You design and delegate` 类交付物句 | AC23/FR9#1#2 |
| T39 | 边界：designer 写操作走 ask（评审 #7） | designer 子代理写 `docs/x.md`（manual 档位） | 触发父侧授权（非静默）；授权后可“全部授权/切自动” | AC26 |
| T35 | 边界：勘察受限 | designer 内 spawn `role="coder"` / `role="explore"` | 前者拒（explore-only）、后者允；**且勘察任务输入不含 Audit scope 块**（评审 #4） | AC20/§1.5#7 |
| T36 | 边界：designer 无 token 需求 | spawn 不带 designToken | 通过（不需凭证——与 eng-coder 形成对照） | AC20/§1.5#4 |
| T37 | 边界：纪律锚驻留 | 四条纪律句双源 grep + 锚断言 | 双源命中；新 person 文件已入 NEW_PROMPTS；锚断言绿 | AC22/FR16/FR17/FR20 |

> 需求层已迁出（2026-09-10 需求层拆分批）：信任模型/边界需求见 `../requirements/ENGINEERING-MODE.md` §2。
- ~~METHODOLOGY.md 缺失降级（D-M1/D-M2——已实现）~~ **已随 METHODOLOGY 退役删除（2026-09-10——PROMPT-SYSTEM 蓝图 §2.5 项目层收敛）**：工程模板携带/缺失警告整段移除——项目层唯一入口 = AGENTS.md（loadProjectInstructions 已注入，缺失 = 项目层空缺静默跳过，无警告需求）；方法论骨干已分拣入纪律层槽位文件。

## 5. 配置与会话恢复

**engineering 与 advisor.guard 都是会话级**（2026-08-29 重构）——事实源是当前会话槽位文件
（`~/.thincoder/sessions/{hash}.json.N` 的 `engineering` 字段与 `advisor.guard`），config.json 的
`agent.engineering` / `agent.advisor.guard` 降级为 **CLI 兼容/可见性镜像**，不再是事实源。背景
（跨端污染 bug）：旧设计里 engineering 只存 config.json 全局，CLI `/eng` 与 VS Code 设置面板都写它 → 两端互相翻转对方的工程模式——会话级化后两端会话各自独立，互不影响。

- **读取优先级（两端一致）**：slot 显式值 > config.json 兜底 > false。slot 无字段（旧槽位）→ 回退 config.json（兼容锁定）；slot 显式 `false` ≠ 未设置，压过 config 的 `true`。
- **写入路径（2026-09-08 D1.1 收窄——config 不再镜像 `agent.engineering`；双写条款只对 CLI `/advisor` guard + VS Code 设置面板 toggle）**：
  - CLI `/eng`（persistEngineering）与 eng(enter/exit) 工具 = **slot-only**——翻转活状态落当前会话槽（saveSession 每 turn 落盘往返；cmd-eng.mjs:77-83 注释实证——config.json 只是初值默认，不再镜像写）；
  - CLI `/advisor` guard 切换（persistGuard）+ VS Code 设置面板 ENG/GUARD toggle（setSlotEngineering/setSlotAdvisorGuard）= **双写**（slot 先、config 镜像后——slot 写失败不阻断 config 写——仅 guard 双写，model/thinking/effort 仍 config-scoped）；
  - VS Code eng 工具经 `engPersist: {cwd, slot}` 通道（top-level run 专属）、`agentState()` 随每轮 saveLines 把 live engineering/advisorGuard 带入槽位。
- **初值链**：CLI `assembleAgent()` 从 config.json 播种 → `applySession` 时 slot 值覆盖（TUI 单 agent 长驻，无 per-submit 重建）；VS Code `setupAgentRun` 每轮从 `engState`（panel-chat 从槽位读）注入。
- **guard 存槽 ≠ 工程模式机械推回**：guard 状态存槽只是会话级配置事实；工程模式下 guard 推回一律关闭（§2.3 设计原则），存槽不改变这一点。
- **resume** 保留 run 状态（mutation 追踪/收敛预算）——guard 跨续跑生效、cap 不可重置；design token **随 slot 持久化**（TTL 7 天 fail-closed——重进 TTL 内恢复；过期重新评审）；持久化槽同受链终消费管理（§2.6 F4）。
- **角色互斥**：工程模式禁用 `coder`，普通模式禁用 `eng-coder`（schema 枚举 + 运行期硬门禁双保险）。

## 6. 已知取舍（评审记录）

1. 父代理无全面写文件门禁——必须能写设计产出物；越权靠提示词（拦截型门禁覆盖产品代码）。
2. token 跨任务存活——保守缺口，已接受（链终消费制收口后：仅链中存活，链终消费）。
3. token 持久化边界——单值自 08-29 起已随 slot 持久化、多槽同构序列化；TTL fail-closed 兜底，过期重评；无签名格式（uuid:expiresAt）下防伪不声称——门禁可经工程模式开关绕过，防伪无实际安全边界。
4. multi-repo 时 advisor cwd 取 `repos[0]`——`_touchedFiles` 绝对路径缓解，已知限制。
5. 架构级文档以机制约束（FR1-FR8）替代用户故事——架构级机制文档的既定形式（评审 2026-09-02 #1 措辞修正，不主张 METHODOLOGY 原文含此豁免）。

## 7. 变更记录

- 2026-09-10（同日晚）：**设计评审轮次 1 处置**（2🔴+8🟡+3🔵——用户裁定全部照办）：①**主 agent 人格改写**入本批
  （persona-engineering 双源——身份改述为产品经理；FR9#1#2）②**“主会话即 designer”句撤销**入 §2.16（双源）
  ③setup 内层选择器映射 + 接线断言 ④勘察 spawn 返回值语义（null）⑤FR19 产出要素逐项 + AC25 ⑥计数对齐（五处/6 处）
  ⑦已知摩擦落档（逐写 ask——用户接受，弹窗可“全部授权/切自动”）⑧档位计数修正（5 个 >300）+ setup 变体=参数化复用
  ⑨batchDoc 模型面文案同步 ⑩T34 映射改指 ⑪需求档 B7 计数对齐 ⑫测试清单同步点名 ⑬越界文案参数化。
  另补：纪律层四步流程改写（§8.1:273）纳入同批。新增 AC23–AC26 + T38/T39。

- 2026-09-10：**eng-designer 角色 + 行为纪律设计**（第 2 批——FR9 九条裁定 / FR19 产出要求 / FR16 行为面 / FR17 #3#4 / FR20 #9 行为面；
  CLI 端）——新增 §2.15（角色注册五处 + 模式门 + 装配四处 + 新槽双源 + spawn 同门 + 勘察变体 + **写域=提示词纪律（无机械门，用户裁定）** + TUI 四处 + 文档登记五处）·
  §2.16（四条行为纪律 + 锚断言口径）· §2.17（四个决策点）· §2.18（受影响文件 as-of）+ AC16–AC22 + T30–T37。
  **实现未启动**（待用户发起评审 → 批准 → eng-coder）；VSC 镜像延后。
  **需求侧澄清（同日）**：§1.5 #8 的“提示词编写权” = **内容权**（落笔仍走 eng-coder）——用户裁定：豁免会抽掉纪律面的门禁，
  而本批重构的正是它。

- 2026-09-10：**批次档机制第 1 批设计**（FR16 载体 / FR17 铁律#5 机械面 / FR20#9 门禁——CLI 端）——新增
  §2.11-§2.14（载体三点 / batchDoc 门禁 / 交界面锚 / 方案选型 / 受影响文件 as-of 表）+ AC10-15 + T25/T25b/T26-29 + 四条方案选型。
  **设计评审**：轮次 1 changes-required（1🔴=§2.14 实测缺失——主 agent 写入静默失败仍报完成）→ 逐条处置 →
  轮次 2 **pass**（0🔴；8 条 advisory 已全部处置：FR17/批次档铁律计数对齐五条、AC15 改双源+grep 校验、§2.13 三态对齐、
  落点文件锚、§2 写手归属注记）。**实现未启动**（待用户批准 → eng-coder）；行为纪律属第 2 批；VSC 镜像延后。

- 2026-08-24 ~ 2026-09-07：机制逐批演进（发起权归用户铁律 → designId 多槽 token → eng-coder 内部交付协议与默认 async → 无签名 token（防伪层删）→ 链终消费 → 凭证不落文档 → 需求池/零裁量/docs FIRST/用户拍板≠批准提示词锚）——活机制与逐字锚已全部提炼入正文（§0-§6 及 §2.9 锚清单），本节不再重复；逐批需求-评审-实现-核销流水账已折叠，批次轨迹以 git 历史与 docs/TODO.md 为准。
- 2026-09-07：格式债批 A 重写为人类可读当前态（DOC-REWRITE / DOC-REWRITE-LARGE §5）——无 >300 字符单行、markdown 结构正确、历史折叠；锚句字节源 = prompts 落地文本（engineering.md），对照逐字。
- 2026-09-09：MAIN-DESIGN-ENHANCE 批——engineering.md 双端注入四维设计纪律逐字锚（A1 勘察/A2 方案
  对比/A3 评审前预检/A4 实践沉淀——§2.9 锚#8 登记——锚文本照抄设计档逐字锚定文本）；结构语义落
  METHODOLOGY §7（设计文档模板细化）；各端 prompts-async-guidance 驻留断言钉住。
- 2026-09-10：PROMPT-SYSTEM 施工①③批——旧 engineering.md/engineering-sub.md/methodology-template.md
  退役，锚句逐字随迁 `discipline-engineering.md`（+ VSC 端 Multi-Task/R14 段驻其 persona-engineering.md）；
  D-M1/D-M2 随 METHODOLOGY 退役删除；§2.9 落点全部改指新宿主；prompts-async-guidance.test.mjs 重写
  （施工③——本批）——锚网整体收编至新文件（fail-when-unchanged 续防）。
- 2026-09-10：**角色重定义需求收口**（用户逐条裁定）——FR9 新增（主 agent=产品经理 /
  eng-designer=设计 / eng-coder=实现三段链；设计=对需求的检验定位）；§2.1 加目标态注。
  **本批待设计**（设计启动权在用户）；提示词实现面登记于 `PROMPT-SYSTEM.md` §8。
