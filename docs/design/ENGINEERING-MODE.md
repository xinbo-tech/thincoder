# 工程模式（Engineering Mode）设计

> 板块：工程模式——thincoder 的严格方法论工作流：design-before-code、纪律层槽位提示词驱动、双门禁（设计评审 + 代码评审）。
> 本文档为**架构级机制文档**：功能性需求以机制目标与约束表述（架构级文档以约束替代用户故事——评审 2026-09-02 #1 措辞修正），非功能性需求与测试层完整。
> 提示词载体注（2026-09-10——PROMPT-SYSTEM 施工①③）：旧 engineering.md/engineering-sub.md 已退役——
> 工程纪律与逐字锚现驻 `src/prompts/discipline-engineering.md` + `persona-engineering.md`（双端各自实现——蓝图 §3.2 装配矩阵）。
> 依赖与权威关系：[AGENT-LOOP.md](AGENT-LOOP.md)（§8 工程交付协议概览、§10 子代理任务调度器、§12.1 advisor 评审对象锚——本文件机制经其 §17 权威源接管点注册）；[ADVISOR-CONVERGENCE.md](ADVISOR-CONVERGENCE.md)（评审收敛权威：design 评审 cap 豁免、code 评审 MAX_ADVISOR_ROUNDS=5、stale-context 保护）；[TESTING.md](TESTING.md) §1（测试分层 L0+/L1/L2 权威）。

> 需求层已迁出（2026-09-10 需求层拆分批）：铁律（§0）+ 总体需求/FR/NFR/裁定清单见 `../requirements/ENGINEERING-MODE.md`。

## 2. 设计（Design）

### 2.1 角色模型

> **目标态注（2026-09-10——FR9 角色重定义，需求已收口；设计已批待实施）**：本表在实施落地前
> 描述**现行态**；目标态细节（9 条裁定）见 `../requirements/ENGINEERING-MODE.md` **§1.5**（as-of 指针——D4）。
> **落地时核销项（D7）**：本表与注同步改为三段链目标态；§5 角色互斥句（:664）同步补第三门（非工程禁 eng-designer）。

| 角色 | 职责 | 机械约束 |
|---|---|---|
| **父代理**（顶层，`role` 未定义） | 架构师：需求/设计文档 → 提醒设计就绪 → 用户发起设计评审（传 documents + object）→ 打回呈递 + 用户拍板 → 用户批准 → spawn eng-coder（默认 async）→ 交付验证（父侧 = L2 `test:full` 每链终态 1 次 + 可选的父侧复核）→ 链终核销 consume-design | 拦截型：design token 前写产品代码被拒；提示词约束：不写实现、不发起评审、等批准、验收 |
| **eng-coder**（子代理，`role="eng-coder"`） | 实现者：按设计实现 → **内部协议闭环**（explore 偏差审计 → 自修 → advisor 复评 → 收敛，≤5 修正轮；完整协议 = 本文件 §2.2 step 6）→ 交付（报告含审计/评审轮次 + 终态 clean/stalled；永不编辑设计文档） | 拦截型：spawn 需 token、写文件需 `_engDesignReviewed`；内部 spawn 仅 explore + 同步（机械门）；审计 ≤6 次（第 7 次机械拒绝 = stalled 信号） |

### 2.2 主流程（Mandatory Flow——10 步）

工程模式任务**不分大小**全走本流程——零裁量（逐字锚见 §2.9 锚#1）。普通需求点先按需求池规则登记攒批（锚#2——工程模式专用；机制见 `src/prompts/discipline-engineering.md` 需求池攒批工作流节），不越池提前启动设计。

1. 写设计档 `docs/design/`（三层：需求/设计/测试；按业务板块组织）——**本批起路由 eng-designer**（主 agent 出批次档 → spawn designer；写权见表 §2.15 A2）。任务涉及 UI 时设计文档必须收录与用户达成的每一条 UI/交互决策（布局/流程/控件行为/状态/反馈），未定部分标 open、绝不静默发明。
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
10. 完成：**验收勾销落批次档 §6**（逐条验收结论——通过/未过/未做 + 理由）；设计档只承载设计本身，**勾销不进设计档**（用户 2026-09-10 裁定：“勾销这些都应该在批次档做，不是设计档”）。
    链闭合（verified + clean + 已签入）→ 父侧 `subagent(action="consume-design", designId=…)` 消费槽（§2.6 F1/F3）。

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

- **设计评审（doc review）**：仅由**用户发起**——父代理呈递设计就绪并提醒，用户发话才调 advisor；打回后每轮呈递发现 + 修复建议、用户逐条拍板再改、再提醒复审（agent 不自行修完重送；**修订落档经 eng-designer**——§2.15 A2）；持续拒绝时停下报告。
- **交付 code review**：流程节点自动、不问用户——默认由 **eng-coder 内部协议承担**（in-child advisor 复评 → findings 子代理内自修收敛 → 收敛交付）；父侧复核保留可选——stalled/存疑才复核，发现问题回 eng-coder 修复（同 designId+token——修正轮 docs FIRST）或 minor 直修。
- **系统推回**：工程模式下 advisor/verify guard 推回一律关闭（§2.3），如未来启用也只作提示用户之用，由用户发起评审。
- **advisor 失败/中断**：停止重试，向用户报告原因。

### 2.6 Token 生命周期（链终消费制——2026-09-07 定稿）

背景：token 只存不废 = 复用洞（父代理跳过审核、未呈方案即直接复用旧 token spawn 的实证）。裁定：**spawn eng-coder 整链完成（首 spawn + 全部中间修复轮走完 → 父端验收核销）后从父端消费掉 designToken**。

- **F1（链终消费——机械）**：subagent 工具提供 `action: "consume-design"`（参数 designId——单设计会话可省略，
  spawn 同款语义）——父侧验收核销时显式调用。实现：读 `_engDesignTokens.get(designId)` 取槽值 →
  `removeDesignTokenSlot`（定义在 token-ttl.mjs——移除该 slot；**D3 2026-09-08 单值镜像已退役——不再条件清镜像**，consume 只删槽 Map 项）→ 消费后同 designId 再 spawn = 槽 not found **机械拒**。**新改动
  （含新偏差修复）一律新评审新 token**。未知 designId 与重复消费 = 同款 no-op 提示（幂等——不报错）。
- **F2（链中复用不受影响——docs FIRST）**：fix round（同 designId——首 spawn 后、验收前）仍可 spawn（slot 未消费）——消费点仅在父侧核销时
  （非交付 digest 时——否则 fix round 无 slot 可用）。修正轮的 findings + planned changes 必须先落所属设计文档
  （deviation record / change note 追加至对应章节）**再** spawn eng-coder；跳档 = 文档漂移，等同静默改动（逐字锚见 §2.9 锚#3）；
  **落档动作经 eng-designer**（写稿权唯一——§2.15 A2，主 agent/eng-coder 不代笔）。
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
| 实现中设计变更（用户反馈） | eng-coder 停下报告；**转 eng-designer 更新设计档（写稿权唯一——§2.15 A2）** → 请求用户重新确认 → 必要时重新评审 |
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

**A2. 调用链与写权路由（2026-09-10 用户裁定——本批落地）**

> 裁定原话：**“主代理负责的是批次档，设计档由 designer 负责。”**

| 文档 | 唯一作者 | 说明 |
|---|---|---|
| 批次档 `batches/*.md`（§1/§4/§6 段） | **主 agent** | 它是唯一对话面——批次讨论/批准/收口由它记（段作者明细见需求档 §1.12） |
| 需求档 `requirements/*.md` | **eng-designer** | 并入本批需求 + 全体系对账（§1.8 五步） |
| 设计档 `design/*.md` | **eng-designer** | **含修订**（FR9 #3：含小改——**写稿权唯一，不给主 agent 直改留口子**） |
| **验收勾销 / 批次状态** | **主 agent·批次档 §6** | **用户裁定（2026-09-10）**：“勾销这些都应该在**批次档**做，不是设计档”——逐条验收结论/需求池核销/遗留项均在批次档 §6；**设计档内不写勾销状态** |

**三个写入面的路由（消除“同一机制两处不同描述”）**：

- **语义修订**（方案/验收标准/接口/受影响文件的改动）→ **只经 eng-designer**（主 agent 不自改；含小改）——§2.2 step1 / §2.8 已改指，另 §2.6 F2/§2.5 的**修正轮 docs FIRST** 落档动作同属此类 → 同走 designer。
- **勾销/验收/核销**→ **批次档 §6**（主 agent；见上表末行）——**不写进设计档**，故与“写稿权唯一”不冲突；
  **提示词文件**已在 A2 表末行（主 agent 内容权 + eng-coder 落笔），此处不重列（D4/D2）。

**调用形态（链路可执行性——评审 🔴）**：主 agent 在批次讨论收口后
`subagent(role="eng-designer", batchDoc=<本批批次档路径>, files=[...], task=<极简指针>)`——任务书本体 = 批次档 §2（B11）；
**`files` 声明照需求 §1.11 B3**（写明将要改的文档，**不声明 `docs/TODO.md`**——TODO 状态推进是提示词规定的动作、不经 files）；
designer 产出 = 设计档 + 回写批次档 §2；主 agent 核验（内容性核验 §1.5 #2）→ 提醒用户发起评审。
**为何必须成文**：只落角色不落调用，落地后没有任何提示词/设计句说明“谁写设计档、谁去派 designer”——
同档 §2.8 原句（父代理更新设计文档）与新角色直接冲突（同一机制两处不同描述）。

**FR9 九条裁定落地状态表（评审 #2）**——逐条给“本批落 / 沿用现状 / 后续批”，消除“九条”整体宣称与实际子集的口径差：

| # | 裁定 | 本批 | 说明 |
|---|---|---|---|
| 1 | 主 agent 保留编排/核验/确认/发起权 | ✅ 落 | persona-engineering 改写 + §2.15 A2 写权表 |
| 2 | 主 agent 内容性核验设计稿 | ✅ 落 | 同上（人格文本明写） |
| 3 | 设计修订全部回 designer | ✅ 落 | §2.15 A2 写权表 + §2.8 路由改目标态 |
| 4 | designer 无 designToken | ✅ 落 | AC20/T36（机制面） |
| 5 | 需求文档不过 advisor 评审 | — 沿用现状 | 无**机制**动作（advisor 评审对象仅由调用清单定义）；**纪律告知落点 = persona-eng-designer 内容要素一句**（“需求档不经 advisor——用户确认即定稿”）→ **已同步进 §2.15 C 内容要素与 AC25 子串** |
| 6 | 评审发起权仍在主 agent | ✅ 落 | persona-engineering 改写保留发起权句 |
| 7 | 勘察归 designer 自己做 | ✅ 落 | §2.15 D2 勘察变体 + **勘察预算**（每批 ≤6 次 explore spawn——与审计预算（6）语义独立、各自计数；调用形态里的“主 agent 勘察结果仅作参考传递”写进 persona） |
| 8 | 提示词编写权 | ✅ 落 | §1.5 #8 注（内容权）+ A2 写权表 |
| 9 | 设计确认门 A⊃B | ◆ 部分 | A（用户反馈迭代改稿路径）= A2 写权表（修订回 designer）；B（advisor 评审必经）= 现有流程节点 |

**batchDoc 的模型面文案同步（评审 #9）**：`subagent.mjs:149` schema 描述现写“REQUIRED for role='eng-coder'…
explore/plan/coder spawns ignore it”、`:128` 角色条目为 eng-coder 专属句——**同批扩为角色集合**（`eng-coder`/`eng-designer`），
并同步纪律层 spawn 样例行（含 `batchDoc=` 的 designer 例）——口径同 §2.12“提示词最小同步”（门禁先行而样例不教 = 每次撞墙）。

**越界错误文案参数化（评审 #13）**：`src/agent/spawn-child.mjs:47/:50` 与 `src/agent-tools/subagent.mjs:237` 的“eng-coder”专属措辞
改为**带实际角色名**（designer 越界时不误导）。

**主 agent 人格改写（评审 #1——PROMPT-SYSTEM §8.1:271 已登记；FR9 #1/#2）**：

| 文件 | 改动 |
|---|---|
| `docs/design/prompts/persona-engineering.md`（中文权威，先定稿） | 身份段从 ARCHITECT/Designer 改述为**产品经理 + 流程编排者 + 批次档作者**（保留编排/确认/核验/发起权——FR9 #1/#2）；
删去“deliverables = 需求+设计文档”句；**新增调用链段**：主 agent 写批次档 → `spawn eng-designer(batchDoc=<本批档>)` → 核验其产出 → 提醒用户发起评审（§2.15 A2） |
| `src/prompts/persona-engineering.md`（英文落地） | 同义改述（现行 `:10-13` “You are the ARCHITECT… 1. the requirements + design documents”、`:34` “You design and delegate”）+ 调用链段 |

**为何必须同批**：不落此面，落地后**主会话人格仍自称设计文档的交付者**——与 §2.15 A2“eng-designer = 写稿面唯一作者”直接互斥（机制级两处不同描述）。

**同时改**（写入面路由——评审轮次 3 补全）：

- `docs/design/ENGINEERING-MODE.md:54`（§2.2 step 10）：验收勾销 → **批次档 §6**（不进设计档，见 A2 表末行）。
- `:90`（§2.6 F2）+ `:78`（§2.5）：修正轮 **docs FIRST** 的落档动作 → **eng-designer**（语义修订写权唯一）。
- `:30`（§2.2 step 1）已改指 designer·`:129`（§2.8）已改路由——**四点合起来覆盖全部设计档写入面**（AC27 核对集）。

**纪律层“主会话即 designer”句撤销（评审 #2——PROMPT-SYSTEM §8.1:274 已登记）**：
双源 `discipline-engineering.md`（`src/prompts/:28` / `docs/design/prompts/:21`）删该句；“设计行为纪律四维”归属改述为**设计者角色**的纪律。

**纪律层四步流程改写（PROMPT-SYSTEM §8.1:273——同批一并落）——定稿文本（评审 #3：不给抽象定位，给可落笔文本 + 入锚）**：

1. **定位句**：“设计 = 对需求的检验——设计写不出来的地方，就是需求没说清的地方（回问，不自己补）。”
2. **需求缺口停报链句**：“勘察发现需求说不通 / 与实现冲突 / 归属不明 → **停下打回主 agent**，不自行选一种解释往下写。”
3. **写权句**：“设计档与需求档由 eng-designer 写作（含修订）；主 agent 记批次档、核验设计稿、发起评审。”

落点 = 双源 `discipline-engineering.md`；**三句均入锚断言家族**（AC22/T37 口径）。

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
**需求档不经 advisor**（FR9 #5——用户确认即定稿）· **勘察预算 ≤6 次 explore/批**（FR9 #7，与审计预算独立）·
收到什么（批次档 §1 + 本批 todo 项 + 需求体系 + 清单）· **缺料就打回** · 五步（勘察 → 并入需求 + 体系对账 → 每条需求配判定句 → 写设计 → 自检交回停）·
**todo 状态推进**（需求 §1.8 步 2 / §1.11 B5：并入需求时同步推进 `docs/TODO.md` 状态——提示词规定的动作，机械面归 FR18【单列】）·
失败路径 · **执行者拒收**（查不到任务书不执行）· 批次的写手边界（§2 自写）。

**FR19 产出要求——必含要素逐项列（评审 #5；需求档 :78 / §1.8）**：

1. **产出两件不混**：①本批批次任务（覆盖条目 / 不在本批 / 受影响文件 / 验收标准 → **批次档 §2**，不写进设计档）
   ②设计档——**8 项按 FR19 逐字对齐（评审 #4）**：**选型对比**（候选 ≥2 时对比表，单方案显式声明豁免）/ **接口契约** /
   **受影响文件带行数 + 拆分计划** / **决策记录**（含被否决备选）/ **验收标准逐条回指批次任务** / **用例表**（正常/边界/错误 + 输入/预期） /
   **边界**（不做什么）/ **UI·交互决策全落档**（未定标 `open`，绝不静默发明）。
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

**F. 展示面（TUI——3 文件 / 6 处改点；评审 #8 修正计数口径）**：`src/tui/cmd-submodel.mjs:4` SUBMODEL_SLOTS（+ `:24/:90` 注释“4 role slots”→5）·
`src/tui/slash-commands.mjs:45`（描述串）+ `:147`（补全候选）· `src/tui/subagent-blocks.mjs:69` SUBAGENT_ROLES。
（`:29` 前缀正则已含连字符——无需改。）

**G. 文档登记面（7 处——含 `docs/README.md`，评审 #2）**：`docs/requirements/PROMPT-SYSTEM.md:39`（命名法角色行）· `:45-46`（文件计数）·
`:54-59`（人格层大纲加行）· `:195-207`（§3.2 装配矩阵加行）· `docs/design/AGENT-LOOP.md:177-184`（角色矩阵 + Mode filtering）·
`AGENTS.md:56`（槽位清单）· **`docs/README.md:12`（§1 目录行“requirements ← 主 agent·产品经理产物”）+ `:44`（§3.1 作者表：需求层作者行）**
——两处均改为 **eng-designer**（含过渡期注：eng-designer 未落地前由主 agent 代行），与 §2.15 A2 写权表口径一致。

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
| docs/requirements/PROMPT-SYSTEM.md | 修改 | 295 | ≤±8 | 纯 .md（登记面 7 处——与 §2.15 G 口径一致） |
| docs/README.md | 修改 | 226 | ≤±4 | 纯 .md——§1 目录行 + §3.1 作者表改 eng-designer（评审 #2） |
| docs/design/AGENT-LOOP.md | 修改 | 720 | ≤±6 | 纯 .md |
| AGENTS.md | 修改 | 69 | ≤±2 | 纯 .md |
| test/prompts-async-guidance.test.mjs | 修改 | 417 | ≤±25 | **>300 档——不拆**：仅增断言、不新增函数。**需同步之处（评审 #12）**：`:51/:294/:413` 的六场景数组→**七场景**（+`eng-designer`）与 `:32` 注释“14 文件全集”→“**15 文件**”（+`persona-eng-designer.md`）；新场景/新文件不入则无覆盖 |
| test/batch-doc-gate.test.mjs | 修改 | 160 | ≤±25 | 门文案与角色集同步 |
| test/eng-designer-role.test.mjs | **新增** | — | +120±40 | 角色注册/装配不回退/勘察受限用例 |
| scripts/check-doc-width.mjs | 修改 | 51 → **281**（以 §2.21 为准） | ≤±60 | §2.19 机械校验 V1/V2（扩为文档一致性扫描）——**当时为 51 行小脚本；实测已 281 行，档位判定以 §2.21 为准**（轮次5 评审 #9） |
| test/doc-consistency.test.mjs | **新增** | — | +90±30 | V1/V2 机判用例（进快层 `test/*.test.mjs` glob，随 `npm test` 生效） |
| test/fixtures/doc-consistency-baseline.json | **新增** | — | +与存量同数 | V1/V2 **基线**（首跑固化清单——AC28 “存量降报告”的判据源） |

> 行数为 2026-09-10 实测；.md 提示词/文档文件按标准豁免行数标注；
> 表中 **>300 行的共 5 个**（4 个源文件 `subagent.mjs` 395 / `subagent-spawn.mjs` 444 / `setup.mjs` 343 / `subagent-blocks.mjs` 451
> + 测试 `prompts-async-guidance.test.mjs` 417）——均**不触发拆分**（各为单点增量、无新函数/仅增断言；评审 #8 修正了原“六个”误计）；
> 若实施中出现单函数超 300 行，停下报告。


### 2.19 文档更新纪律（2026-09-10 用户裁定——与角色落地同批）

> 动机（用户指出）：**“更新文档的复杂度”**——写稿权唯一只是必要条件；两轮评审反复栽的根因是**缺更新纪律**
> （同一条机制散在多处 / 计数与段号漂移 / 行号锚过期 / 状态行无人同步 / 权威源分叉）。

| # | 纪律 | 内容 | 落地 |
|---|---|---|---|
| D1 | **写权矩阵** | 文档类 → 唯一作者（§2.15 A2 表）：批次档=主 agent · 需求/设计档=eng-designer · 提示词=主 agent 内容权 + eng-coder 落笔 | 提示词（纪律层）+ §2.15 A2 |
| D2 | **单一权威源** | 一条机制**只在一处详述**；其余处**只引用不重述**（含模板：批次档模板只在需求档 §1.12，设计不重抄） | 提示词 + 评审判据（advisor 八维 #7） |
| D3 | **计数·枚举纪律** | 声明“**N 项/N 处**”时，紧跟可枚举的来源；计数与列表必须同时改——**机械校验 D3**（下方） | 脚本 + 测试 |
| D4 | **指针纪律** | 指针形态 = `文档:节`（行号仅作 as-of 参考，标 as-of）；**禁止**“见上/见该节”式相对指针 | 提示词 + **机械校验 V1** |
| D5 | **冻结窗口** | 评审在途**不改被审文档**（改了 = 评审对象已变 → stale，token 不签发）；改动集齐后统一入场 | 提示词（纪律层） |
| D6 | **回读核对** | 任何写入后**回读核实**再报完成（本会话三次事故：写入静默失败仍报完成、编辑吞标题×2）——已是踩坑记录，本批**升为纪律** | 提示词 |
| D7 | **变更留痕 + 核销同步** | 每批核销时跑**核销同步清单**（需求档 §1.12 批次档 §6 模板新槽位）——逐项检查：角色表 / 头部状态行 / 计数 / 指针 / 变更记录 / 待办勾销 | 模板槽位（父侧） |

**机械校验最小集（评审指出两轮反复栽的两类——可机判的才上机械）**：

| 校验 | 内容 | 落点 |
|---|---|---|
| V1 **段引用可解析** | 扫描 **`docs/design/` + `docs/requirements/` + `docs/batches/`** 里的 `§N` / `文档:节` 引用，目标节号存在（**排除 `_archive/`**——历史快照豁免，同 check-doc-width 现行口径） | **落点见 §2.21 二选一**（首选 `scripts/check-doc-width.mjs`——增量 ≤±19 守 300；超出则拆 `scripts/doc-consistency.mjs`）；**“定死此文件”口径已废**（轮次4 评审 #2——同机制不得两说） |
| V2 **计数与列表一致** | 匹配“**N 项/N 处/N 条**”声明，并在**同节（同一标题块）**内找对应陈述；其条数 ≠ 声明值 → 报。识别三形态：md 列表行 / 表格行 / 顿号·斜杠枚举（括号内计数） | **落点见 §2.21 二选一**（首选 `scripts/check-doc-width.mjs`——增量 ≤±19 守 300；超出则拆 `scripts/doc-consistency.mjs`）；`test/doc-consistency.test.mjs` 为用例面（轮次5 评审 #6：与 V1 同口径，同机制不得两说） |

> 边界（不硬判）：V1/V2 只查**可机判的两类**；语义级一致性（“同一机制两处不同描述”）仍归**评审**（advisor 八维 **#7 Document ownership**——`src/prompts/advisor-design.md:9`）——
> 机械只管计数/指针，不管意思（否则误报湮没信号）。

**受影响**：`scripts/check-doc-width.mjs`（扩扫——现 51 行）+ **新增** `test/doc-consistency.test.mjs`（进快层 glob，随 `npm test` 生效）+
**新增基线** `test/fixtures/doc-consistency-baseline.json`（§2.18 已列）；
提示词层三句（D5/D6/D2）入锚家族（**AC22 ③ 项**）。


### 2.20 批次档段写入工具（第 4 批——FR22/§1.16）

**目标**：给子代理一条受控写入通道，把「一段一作者」从**纪律**升为**机械事实**——§2 designer / §3 设计评审 / §5 coder 各自写己段。

#### 2.20.1 工具契约

```
batch_segment({ segment, text })     // 无路径参数——目标档由绑定提供（§2.20.2：spawn 绑定 / 评审实例键）
text 限量：≤20000 字符 / 次（超出拒，引导**分段追加**——每次调用各成节、N 顺延，见 AC34）
```

| 守卫 | 机制 | 身份判据（定权限的依据） |
|---|---|---|
| **无路径参数** | schema 不含 `path`——**语法上写不到别处** | — |
| **段白名单（按调用者身份）** | `eng-designer → §2` · `设计评审（reviewType=design）→ §3` · `eng-coder → §5`；**参数只声明段号，身份定权限**——越段/未知段 → throw | `eng-designer`/`eng-coder` = `agent._role`；设计评审 = **与目标档绑定读同一实例键**（`resolved.run.batchDoc` 存在且可读——depth-0 父 agent 无 `_role`；**不用单值会话态**） |
| **append-only** | 只做**插入**，不重写任何既有行（定位段尾：下一条 `## §N` 或 EOF）；档内既有字节不变 | — |
| **骨架保护（评审 #9）** | `text` 内出现 `^## §\d` 行 → **拒**（防段定位错位/破坏 append-only 预期）；引导改写为转义或去标题 | — |
| **来源戳由工具生成（评审 #1——N4；作用域 = 仅 §3，轮次4 评审 #3）** | 小节标题 **由工具写**：`### 轮次 N（评审子代理）`——**只加在 §3 的轮次节**（§2/§5 不加任何节标题）；N **只数 §3 内**该形态行 + 1（**排除骨架行** `### 轮次与发现（…）`——否则首轮即 N=2、V3 假阴）；**N = 节序号**（拆节时逐节顺延，见 fail-closed）；**调用方 text 内的同名标题行被忽略** | — |
| **凭证剥除（工具做）** | 写入前过滤 **`[DESIGN-TOKEN:…]` 与 `designId: …`** 两形态行——**用剥除器自己的正则（不复用 §2.7 巡检正则——后者要求参数名后接空白，匹配不到冒号态）**；**模型可能忘，机械不能忘** | — |
| **失败 fail-closed** | **目标段标题不存在**（§1.12 骨架应由创建方预先写入——缺失则 throw 并给纠正动作）/ 未绑定批次档 / 路径不可读 / 越段 / 超量（text >20000 字符，引导**分段追加**——每次调用各成节、N 顺延；**不承诺“不新盖戳”**） / 含 `^## §\d` → throw（消息带原因，供报告引用）；**不静默兜底** | — |

#### 2.20.2 档绑定（路径怎么到执行者手里）

| 角色 | 绑定时机 | 落点 |
|---|---|---|
| `eng-designer` / `eng-coder` | spawn 时（第 1 批 `batchDoc` 门已保证「参数在 + 路径可读」）→ `child._batchDoc = batchDocAbs` | `src/agent-tools/subagent-spawn.mjs`（复用第 1 批已有的 `batchDocAbs` 变量） |
| 设计评审 | advisor 工具**显式参数** `batchDoc`；门禁口径 = **“若传则须可读”（空/不可读 → throw）**——**不强制必传**（零回归，见 §2.20.8 不改 N5）；绑定 **按评审实例键**（`resolved.run.batchDoc`，与 `reviewType/round/designId` 同族）——**不用单值会话态** | `src/agent-tools/advisor.mjs`（参数 + 门禁 + 实例键绑定） |

**并发隔离（评审 #7）**：绑定必须**按评审实例**（顾问池默认 4，仅同 scope 拒——`src/agent-tools/advisor-async.mjs:20-22`/`:400`）；
若用单值会话态，后发起的另一批设计评审会覆盖前绑定，而正在跑的评审其工具执行读的是**当前** agent 状态（`src/advisor/run.mjs:291`）
→ 发现表可能落进**别批的 §3**（项目对 token 已因同类问题废弃单值镜像——本档 `:87`）。**不变量：异批次并发必须各自正确落档，不得串档**。

**为何“参数在外、传递走实例键”**（而非把路径一路穿到 `runAdvisorReview`）：参数保留可拒可测（门禁在工具入口）；
传递走**评审实例键**（`resolved.run.batchDoc`）——因为要避开的只是 **`advisor-async.mjs` 的 500 行档位硬顶**（+行即越线）；
实例键属本产品**既有机制**（`_engTaskInput` / `_touchedFiles` / `_engDesignId` 同族），且 fail-closed（未绑定即不挂载）。
`run.mjs` 本就要改（`advisorToolsFor` 签名——§2.20.3），**不在避让范围内**。

#### 2.20.3 工具挂载（三方，只读面不扩）

| 调用方 | 挂载落点 | 路径来源 |
|---|---|---|
| **设计评审** | `src/advisor/run.mjs:91-97` `advisorToolsFor(agent)` → `advisorToolsFor(agent, reviewType, batchDoc)`：**仅当 `reviewType === "design"` 且 batchDoc 已绑定（可读）时**追加 `batch_segment`；代码评审分支零变更（零 git、只读不变）；测试缝 `_advisorToolsFor` 保留 | 评审实例键（§2.20.2） |
| **eng-designer / eng-coder** | `src/agent/setup.mjs:286-290` 挂载链：`eng-coder`（:286）/`eng-designer`（:287）两分支各追加 `batch_segment` | `agent._batchDoc`（spawn 时由 §2.20.2 绑定） |
| **主 agent** | **不挂载**（不变量 3——§1/§4/§6 走普通文档写；机械上：主 agent 工具链无此项，身份判据亦拒） | — |
——与 §2.20.2 的“不强制必传”口径一致（**非死条件**：未传 → 工具不挂载，设计评审照常跑）。

#### 2.20.4 §3 内容 = 评审结论全文（FR22 F4）

每轮追加附录节（**一轮可多节**：超量分块时逐节顺延，见 §2.20.1 fail-closed）：**`### 轮次 N（评审子代理）`（**标题由工具生成**，见 §2.20.1）+ 该轮发现表（逐字 markdown 表）+ VERDICT 行 + 计数**；
 多轮各自成节（append）。**逐字不转述**（父侧不得代润色/缩减）；`§3` 写在**批次档**——**§3 段不在评审对象清单内**（B9 只含批次档 **§2**，需求 §1.11 `:350`）；追加 §3 **不改变被审内容**，故与 D5 冻结窗口不冲突（**不写“批次档非被审文档”**——批次档本身在 documents 清单里，写错反惹下轮评审当矛盾——轮次5 评审 #5）。
**F4/F5 的承载面（轮次4 评审 #10）**：内容性（表全文 + VERDICT + 计数、逐字）由**提示词层**承载（AC33/AC35 的 grep 断言）；
机械面 V3 只保证**底线**（§3 非空 + 含工具写入轮次行）——V3 不看内容，这是有意的（内容判定无法机判，强判会假阳）。

#### 2.20.5 提示词侧（双源）

- 六段自写句 → 改为「用 `batch_segment` 写己段」（designer/coder 各自 persona + 纪律层）；
- **调用侧**（评审 #5；**适用面限定**——轮次5 评审 #4）：**有批次档在飞**时发起设计评审**必须传 `batchDoc`**（主 agent 指令，落纪律层发起评审节）；**无批次档的在途设计评审不受阻**（参数不传即工具不挂载，见 §2.20.2/§2.20.8——不得因缺此参数拒绝评审）；
- 评审层**三条提示词全覆盖（评审 #3；round 1 宿主已钉死——`src/advisor.mjs:109-111` 无 prior 即 `ADVISOR_DESIGN`）**：`advisor-design.md`（round 1）+ **`advisor-round2.md` + `advisor-round3.md`**（round 2+ 的设计评审**不读** advisor-design.md——`src/advisor.mjs:113-115`）——均指示评审者在报告之外**调工具把表与 VERDICT 写进批次档 §3**；
  **适用范围限定（轮次4 评审 #3）**：round2/round3 为**设计 + 代码评审共用**——该句必须限定「**仅设计评审、且工具已挂载时**」（代码评审只读、无此工具，否则每轮代码评审会被引导报假“§3 未写入”——AC31/§2.20.3）；
- **失败明示句**：「写不进去 → 报告里明说‘§× 未写入’；父侧代写**必须打标**」（不得静默、不得假装写过）。

#### 2.20.6 V3 机械校验（零假阳口径）

加入 `scripts/check-doc-width.mjs` 一致性扫描族：**仅当批次档「§4 或 §6 有实质内容」时**（机器判据；**不引用 §1 的“已收口”状态词**——它是讨论状态，与本守卫无关）；**“有实质内容”的定义（轮次5 评审 #1）**：该段内**除骨架行/斜体占位行外**存在非空行——即 `_（...）_` 形态占位、`### 批准（...）` 等模板骨架行**一律不算内容**（不定义则本批档在飞时即假阳——其 §4/§6 带占位行）；断言「§3 **含工具写入的轮次行**（`### 轮次 \d+（评审子代理）`——排除骨架行）」；
**落点按 §2.21 二选一**（首选 `check-doc-width.mjs` +≤19 守 300；超出则拆 `scripts/doc-consistency.mjs`）；**§2.19 V1 的“定死此文件”句已在本批同步废除**（轮次4 评审 #2——同机制不得两说）：
在飞批次（尚未评审）**不报**（避免每批都假阳）。反证用例：构造已批准但 §3 空 → 必报。

#### 2.20.7 方案选型（四个决策点）

| 决策点 | 候选 | 选定 | 否决理由 |
|---|---|---|---|
| 路径传递 | A 显式参数贯穿到 `runAdvisorReview` · **B 参数在工具入口 + 评审实例键（`resolved.run.batchDoc`）传递** | **B** | A 需改 `advisor-async.mjs`——它已 **500 行 = 档位硬顶**，+行即越线；B 保留参数可拒可测，且实例键与正文 §2.20.2/§2.20.8 同口径（**不用单值会话态**） |
| 工具形态 | A 专用 `batch_segment`（无路径参数） · B 通用 `write` + 路径白名单 | **A** | B 授权面大一档（白名单可绕/可扩大）；A 把限制写在**语法**里 |
| V3 范围 | A 全批（含在飞） · **B 仅 §4 或 §6 非空的批次** | **B** | A 对在飞批次必然假阳（§3 未到评审时本为空）——违需求 §1.15「零假阳才能常驻」 |
| 段表「写入手段」列 | 加 · 不加 | **加** | 需求 §1.12 段作者表是读段机制的第一入口；只写在设计档里会形成第二源（D2） |

#### 2.20.8 不变量（评审判据）

1. **代码评审只读保证不削弱**（零 git + 只读工具集）。
2. **凭证绝不落档**（工具级强制，不靠纪律）。
3. **父代理不走本工具**（§1/§4/§6 走普通文档写）。
4. **不静默兜底**（失败必可见 + 代写必打标）。
5. **来源戳不可伪造**（工具生成标题与 N——N4）。
6. **并发隔离**：异批次并发的设计评审**各自正确落档**（实例键绑定），不得串档。

**取舍记录（评审 #2）**：评审侧 `batchDoc` 定为**“若传则须可读”而非“必传”**——理由：`type="design"` 无工程模式门（`src/agent-tools/advisor.mjs:85-115`；advisor 工具两侧模式均挂载 `src/agent/setup.mjs:275`），
“必传”会改变**无批次档场景下的设计评审行为**（本仓 `docs/README.md:174` 即列三份“设计待评审”在途设计档）——与 **N5 零回归**冲突。
本设计**不扩大、也不收窄**既有评审路径：无批次档 → 工具不挂载，评审照常跑。

### 2.21 受影响文件（第 4 批 as-of 快照——不得当契约引用）

| 文件 | 性质 | as-of 行数 | 预计增量 | 拆分评审 |
|---|---|---|---|---|
| src/agent-tools/batch-segment.mjs | **新增** | — | +140±40 | 新工具（工具定义 + 段定位 + 剥除 + append 写入） |
| src/agent/setup.mjs | 修改 | 353 | ≤±12 | >300 档——**不拆**：挂载链（:286-290）两分支各加一项 |
| src/agent-tools/subagent-spawn.mjs | 修改 | 449 | ≤±6 | >300 档——**不拆**：复用已有 `batchDocAbs` 设 `_batchDoc` |
| src/agent-tools/advisor.mjs | 修改 | 213 | ≤±14 | 参数 + 门禁 + **评审实例键绑定** |
| src/advisor/run.mjs | 修改 | 488 | **≤±10** | **>300 档 + 逼近 500 硬顶（488 + 上限 10 = 498）——若实施中越 500，停下报告并带拆分计划（不得静默越线）** |
| src/prompts/advisor-design.md | 修改 | 36 | ≤±8 | 纯 .md（round 1 评审者用工具写 §3） |
| docs/design/prompts/advisor-design.md | 修改 | 66 | ≤±8 | 纯 .md（双源） |
| src/prompts/advisor-round2.md | 修改 | 41 | ≤±6 | 纯 .md（**round 2 设计评审也须写 §3**——评审 #3） |
| docs/design/prompts/advisor-round2.md | 修改 | 57 | ≤±6 | 纯 .md（**双源**——AC35 grep 覆盖；评审 #2 补行） |
| src/prompts/advisor-round3.md | 修改 | 37 | ≤±6 | 纯 .md（round 3+ 同） |
| docs/design/prompts/advisor-round3.md | 修改 | 55 | ≤±6 | 纯 .md（**双源**） |
| src/agent-tools.mjs | 修改 | 17 | ≤±2 | **barrel export（评审 #4）**——`setup.mjs:172` 从它解构工具符号；新工具必须加 export 行 |
| src/prompts/discipline-engineering.md | 修改 | 219 | ≤±10 | 纯 .md（六段自写→用工具 + 失败明示） |
| docs/design/prompts/discipline-engineering.md | 修改 | 147 | ≤±10 | 纯 .md（双源） |
| src/prompts/persona-eng-designer.md | 修改 | 56 | ≤±6 | 纯 .md（§2 自写→用工具） |
| docs/design/prompts/persona-eng-designer.md | 修改 | 53 | ≤±6 | 纯 .md（双源） |
| src/prompts/persona-eng-coder.md | 修改 | 35 | ≤±6 | 纯 .md（§5 自写→用工具） |
| docs/design/prompts/persona-eng-coder.md | 修改 | 35 | ≤±6 | 纯 .md（双源） |
| scripts/check-doc-width.mjs | 修改 | 281 | **≤±19** | **>300 档：增量收到 ≤19 以守住 300（评审 #9）**——V1/V2/V3 扫描若超出，拆到新文件（见下）；仍越线 → 停下报告 |
| scripts/doc-consistency.mjs | **新增（条件）** | — | ≤±120 | **评审 #9 备选**：V1/V2/V3 扫描独立成文件（`check-doc-width.mjs` 只留宽度）——二者取一，**不得都做也不得都不做** |
| test/batch-segment.test.mjs | **新增** | — | +150±40 | T43–T47 |
| test/doc-consistency.test.mjs | 修改 | 176 | ≤±30 | V3 用例 |
| docs/design/TOOLS.md | 修改 | 124 | ≤±8 | 工具系统权威源（登记新工具——轮次4 评审 #5 实测校正 79→124） |
| docs/design/AGENT-LOOP.md | 修改 | 721 | ≤±2 | **评审 #11**：`:283`「恒定六工具不含 git」对**设计评审**不再成立（代码评审仍成立）——一句话级修正 |
| docs/requirements/ENGINEERING-MODE.md | 修改（**eng-designer 落笔**——写权表 §2.15 A2 / D1） | 679 | ≤±8 | 4 项：§1.12 段表加「写入手段」列 · §1.11 B9 同步 batchDoc 参数 · §1.16 F1 注评审侧口径 · §1.16 N2 改“§3 段不在评审对象清单” · **§1.17 N3 计数口径改（“双源 15+15=30 档之宿主档”——轮次3 评审 #9）** |

> 行数为 2026-09-10 实测；**档位风险结论（评审 #9）**：`scripts/check-doc-width.mjs` 由“≤±45（上界 326 越 300）”改为
> **二选一**：①增量 ≤19 守住 300（V3 仅少许行）；②V1/V2/V3 拆入 `scripts/doc-consistency.mjs`（增量不限）。
> `src/advisor/run.mjs` 488 + ≤±10 = 498 **逼近 500 硬顶**——若实施中越 500，停下报告并带拆分计划（不静默越）。

### 2.22 VSC 端镜像（第 5 批——FR23）

**目标**：把第 1/2/4 批机制落到 `thincoder-vscode`，使两端**同一套机制、各自实现**。终局判据 = **VSC 会话可 spawn eng-designer 并令其自写 §2/设计档**（需求 `requirements/ENGINEERING-MODE.md` FR23 行 / §1.17 总体目标——N4 是验收两层，非判据句，轮次2 评审 #14）。

#### 2.22.1 总原则：语义同源·原文自持（N1）

两端**不共用代码、不作跨仓 import**（VSC 自定纪律 `src/prompt-overlays.mjs:5`）；机制语义同源，**实现各写一份**。
镜像 ≠ 抄实现：**抄的是契约与锚句**，适配的是落点（勘察已证 VSC 落点多处不同）。

#### 2.22.2 镜像锚（逐字源钉死——多实现面规则 §1.12）

**主 agent 人格面同批落地（轮次2 评审 #1 🔴）**：`thincoder-vscode/src/prompts/persona-engineering.md:10-13` 实证仍写「You are the ARCHITECT… deliverables are: the requirements + design documents」——
与本批带入 VSC 的 A1/A4（D1「需求/设计档=eng-designer」）**在同一次装配内互斥**（同 §2.15:365 判据）；且本批要拷的 CLI 中文镜像恰是改述后版本——
不落此面则中文权威与英文落地相反。**故 `persona-engineering.md` 双源入本批锚/受影响文件（A12）**。

需逐字一致的段**不在本设计重述**（避免第三份副本），而以 **CLI 文件:节为逐字源**，实现面**照拷、禁自行解释**；差异只允许在路径/UI 引用处，且必须登记：

| 锚 # | 内容 | CLI 逐字源 | VSC 宿主（落地文件） |
|---|---|---|---|
| A1 | 六段 append-only·**一段一作者**声明句 + **子代理自写不经父侧转述** | `src/prompts/discipline-engineering.md:30-31`（六段块） | `src/prompts/discipline-engineering.md`（**新增六段节**——VSC 现零命中） |
| A2 | **写入手段句**（`batch_segment({segment, text})`——无路径参数 + 段白名单枚举） | `src/prompts/discipline-engineering.md:32`（同块） | 同上（同业） |
| A3 | **执行者拒收**·**澄清必经主 agent**·**三方条目一致** | `src/prompts/persona-eng-coder.md` + `persona-eng-designer.md` | 同名两档 |
| A4 | **D1-D7 文档更新纪律表** | `src/prompts/discipline-engineering.md`（文档更新纪律节） | 同 A1 宿主 |
| A5 | **§3 写入指令句 + 适用面限定子串**（仅设计评审/工具已挂载） | `src/prompts/advisor-design.md` / `advisor-round2.md` / `advisor-round3.md`（三档） | 同名三档 |
| A6 | **失败明示句**（“§× 未写入” + “父侧代写必须打标”） | `src/prompts/discipline-engineering.md` + 评审三档 | 同 A1 宿主 + 三档 |
| A7 | **调用侧句**（有批次档在飞时发起设计评审必须传 `batchDoc`） | `src/prompts/discipline-engineering.md`（发起评审节） | 同 A1 宿主 |
| A8 | **`batch_segment` 工具描述文案**（段白名单枚举 / 无路径参数 / append-only / 来源戳 / 剥凭证 / 失败明示） | `src/agent-tools/batch-segment.mjs`（描述字符串，196 行） | 新增同名档 |
| A9 | **来源戳形态**（`### 轮次 N（评审子代理）`、N = §3 内该形态行计数 + 1、排骨架行） | `design/ENGINEERING-MODE.md` §2.20.1 | 同上（工具实现） |
| A10 | **V3 触发判据**（§4 或 §6 有实质内容；骨架/占位行不算） | `design/ENGINEERING-MODE.md` §2.20.6 | `scripts/check-doc-width.mjs`（V3） |
| A11 | **spawn 样例行带 `batchDoc=`**（发现 #3：门禁先行而样例不教 = 每次撞墙） | `src/prompts/discipline-engineering.md`（spawn 样例节） | 同 A1 宿主（**VSC:168-169 现无 `batchDoc=`**——本批补） |
| A12 | **主 agent 人格改述 + spawn eng-designer 调用链**（轮次2 评审 #1 🔴） | `src/prompts/persona-engineering.md`（身份段 + 调用链段；中文镜像同档） | **双源同名两档**（VSC 现仍是 ARCHITECT 旧身份——`:10-13` 实证） |

> **判据**：**文本类锚**（A1-A8、A11、A12）在 VSC 侧宿主文件（双源两侧）与 CLI 侧逐字相同（grep 断言；白名单枚举/参数名/状态词不得改写）；
> **A9/A10 为行为锚**（宿主是工具/脚本代码，无“双源两侧”可言——轮次2 评审 #8）：断言面改为行为用例（A9 → T59 来源戳 / A10 → T61 V3 零假阳），**不进 grep 集合**。
> A1 的宿主已从“CLI §1.12 抬头”（VSC 无该树）改为 **VSC `src/prompts/discipline-engineering.md` 新增六段节**（发现 #7：锚必须有落点才能断言）。

#### 2.22.3 batchDoc 门（F1——两处各落 + 共享校验）

| 决策点 | 候选 | 选定 | 否决理由 |
|---|---|---|---|
| 门落在哪 | A **两处各落 + 共享校验函数**（阻塞 `subagent.mjs` / 异步 `subagent-async.mjs` 各一个调用点，校验逻辑单份） · B 先造共享 spawn 等价点 | **A** | VSC **无** CLI 的双路装配单点（勘察实证）；B 是结构性重构（动阻塞/异步两条链的公共骨架）= 风险超出镜像范围；A 改动面最小且校验逻辑仍单份（语义不会漂） |

- **共享校验函数落点**：`src/agent-tools/subagent-spawn-gate.mjs`（169 行——token gate 家族所在，门的天然落点）；签名 `resolveBatchDoc(agent, batchDoc)`：空/解析失败/非文件 → throw（消息明示）。
- **角色域（发现 #3——必须写死，否则违 N2 零回归）**：门**只对 `NEEDS_BATCH_DOC = { eng-coder, eng-designer }` 生效**——其余角色（explore / plan / coder）**零变更**（不带 batchDoc 照常 spawn）。
  AC37/T55 的“两路拒”**仅指这两个角色**；反面例（explore 不带 batchDoc 不得被拒）入 T55b。
- **参数面（发现 #3）**：spawn schema 需新增 `batchDoc` 属性（否则参数无处传入）；受限变体（审计/勘察子代理）的 `delete props` 清单**同步加 `batchDoc`**（不得透传给子代）。
- **注入**：通过校验后子代理携带 `child._batchDoc = <abs>`（与 CLI 第 4 批同形态）——`batch_segment` 取用；
  **child 任务文本行是否同形（轮次2 评审 #12）**：**镜像**（CLI 第 1 批形态 = “Batch record (batchDoc): <abs>”行）；若实施改为仅绑定形态，须在交付报告明示（不得静默二选一）。

#### 2.22.4 eng-designer 角色（F2——**八处落地**；发现 #1/#4）

> **发现 #1 的教训**：枚举/装配层落完**不等于角色能 spawn**——VSC 运行期有 fail-closed 白名单与三道门，必须逐点落。

| 处 | 落点（as-of） | 内容 |
|---|---|---|
| ① **运行期白名单** | `src/agent-tools/subagent.mjs:254-256`（`const ROLES = new Set([...])`） | 加入 `"eng-designer"`，**并改写错误文案的角色列举**（现列 4 个角色——漏改则报错信息说谎） |
| ② **模式门（第三门）** | `src/agent-tools/subagent.mjs:267-272`（现只有 coder↔eng-coder 互斥两门） | 加：`eng-designer` 仅在工程模式可用（非工程模式 → 拒，文案同族） |
| ③ **子代 spawn 门** | `src/agent-tools/subagent-async.mjs:47`（现 `parent._role !== "eng-coder"` 即 null 放行） | 父角色集合扩入 `eng-designer`（designer 的勘察子代 = explore-only） |
| ④ **装配分支** | `src/agent/setup.mjs:151-160`（449 行） | 增 `eng-designer` 分支：读/搜/写设计产出 + `batch_segment` + **勘察通道工具（explore-only 受限 subagent 变体——镜像 CLI §2.15 D3 的受限变体与注册）**；**不含 advisor**（轮次3 评审 #5） |
| ⑤ **角色 enum** | `src/agent-tools/subagent.mjs:56-74`（`modeRoleField`） | 工程模式 enum 由 `[explore, plan, eng-coder]` → 含 `eng-designer` |
| ⑥ **场景表** | `src/prompt-overlays.mjs`（82 行） | 补 `"persona-eng-designer.md": loadSlot(...)` 与 `"eng-designer": [...]` 两行（CLI:26/CLI:52 同形——**全文逐行同构，最干净的可照抄点**） |
| ⑦ **webview 枚举** | `activity-view.js:13`（157）· `activity.js:37`（205）· `settings-agent.js`（175）· `settings-models.js`（215） | 四处角色枚举/regex 补 `eng-designer` |
| ⑧ **人格文件** | `src/prompts/persona-eng-designer.md`（**新增**） | 逐字源 = CLI 同名文件（56 行）；锚句 A3 |

**⑨ 勘察通道（发现 #4——CLI §2.15 D2/D3 的镜像，**必搬**）**：designer 的勘察能力 = **explore-only 受限子代理变体**（schema 只暴露 explore + 描述分流）；
否则逐字拷来的人格文本（CLI `persona-eng-designer.md:24`「勘察预算 ≤6 explore spawns per batch」）**指向不存在的能力**（CLI 侧动机 = FR9 #7「勘察归 designer 自己做」）。
**无“不搬”选项**（轮次3 评审 #1——原退路句已删）：实施中若遇阻，停下报告（同档位停线体例），不得以“记取舍 + 同步人格文本”代替能力交付。

#### 2.22.5 batch_segment 移植（F4——工具本体 + 两个适配点）

- **工具本体**：新增 `src/agent-tools/batch-segment.mjs`（契约同 §2.20.1：无路径参数 / 段白名单按身份 / append-only / 来源戳仅 §3 / 剥证自有正则 / fail-closed 六条）——**无依赖冲突，可逐步移植**。
- **适配点 ①（工具集落点）**：VSC 的 `advisorToolsFor` 在 **`src/advisor/tools.mjs:26`（单参，49 行）**而非 `run.mjs`——签名改 `(agent, reviewType, batchDoc)`，**仅当 `reviewType === "design"` 且 batchDoc 已绑定**时追加工具；测试缝 `_resolvedAdvisorToolsFor` 保留语义。
- **适配点 ②（实例键通道）**：VSC 的 `runAdvisorReview`（`src/advisor/run.mjs:346`，459 行）比 CLI 多一个 `rv` 实例参数——`batchDoc` 沿 **`rv.batchDoc`** 传递（与 `rv.round`/`rv.priorOutput` 同族），**不用单值会话态**（与 §2.20.2 同口径）。
- **挂载**：`src/agent-tools/index.mjs`（16 行）barrel export；`src/agent-tools.mjs`（2 行）为 `export * from` 不需改。

#### 2.22.6 文档纪律与 V1/V2/V3（F5——含「接线」这一半）

| 决策点 | 候选 | 选定 | 理由 |
|---|---|---|---|
| 扫描域 | A **含三个目录，缺失即跳过** · B 镜像时把 VSC docs 树建齐 | **A** | VSC 无 `docs/requirements//docs/batches/`；批次档**仍落 CLI 仓**（单一归属）；建空树 = 造无用目录；现有 CLI 实现已有跳过语义 |

- VSC `scripts/check-doc-width.mjs`（51 行，现**仅宽度、无导出、无 CLI 模式、未接自动化**）→ 扩为一致性扫描（V1 段引用 / V2 计数与列表 / V3 批次档 §3）+ 基线读写 + 导出；
  增量上限**对齐 CLI 同机制实测**：CLI 同档现 **298 行**（宽检+V1/V2+V3 全量；§2.21 记 as-of 281 + ≤19 守 300）——本批上限 **≤+250（→≤300）**，
  **保留 CLI 退路条款：若超 300 即拆 `scripts/doc-consistency.mjs`（二选一，不得都做也不得都不做）**；原“+≤120/距 300 尚远”估算与 CLI 实测差约百行，已废（轮次2 评审 #5）。
- **V3 扫描根与跨仓边界（发现 #6——不得空转）**：
  VSC 的 V3 默认扫**本仓** `docs/batches/`——该目录不存在 → **跳过不报**（现状）；
  **但批次档的单一归属是 CLI 仓**（决策 A），**真实守门在 CLI 侧的 V3**（已落地，第 4 批）；
  VSC 侧 V3 的价值 = 结构对等 + 测试面 + 未来 VSC 自建批次档时可用；**若将来需要扫 CLI 仓批次档，以显式参数传入扫描根**（不得硬编码跨仓相对路径）。
- **接线是硬项**（N3）：接线落点**钉死 `test/files.mjs` 入册**（**`package.json` 不入本批受影响文件与两个实现面文件域**——轮次2 评审 #4；**5 个新 test 档全部入册**，基线 fixture 不入；`test/files.mjs` 增量按入册条数上调）——
  VSC 快层目标 = 显式清单 `test/files.mjs`（41 行，**28 条清单项**；`test/` 下 **27 个 `.test.mjs`**——两数口径不同，发现 #11）——否则“有校验器但不跑” = 机制没活。

#### 2.22.7 提示词双源（F6——用户在裁：双源）

- **VSC 现状单源**：`src/prompts/` 14 文件，`docs/design/prompts/` **不存在**；VSC 自己的 `docs/design/README.md:30` 写明“机制权威 = CLI 仓”。
- **本批建 `docs/design/prompts/` 15 文件**（中文权威）——初始内容 **逐字自 CLI `docs/design/prompts/` 拷贝**（现有 15 档）。
- **端特有段处置（发现 #8——不得静默）**：CLI 纪律明文「**端特有段各端保留**」（CLI `src/prompts/discipline-engineering.md:91` / `:205`：VSC R14 池规则段“原地保留于 VSC、CLI 不引入”），
  而 VSC `src/prompts/discipline-engineering.md:202-205` 确有该段——故“逐字拷 CLI 中文档”后，**VSC 的中文权威镜像不含其英文源里的端特有段**。
  本批定：**端特有段一并进 VSC 中文镜像**（以 VSC `src/prompts` 为准适配写入），**逐项登记在镜像差异表**（文件 + 段 + 来源；**差异表宿主 = `thincoder-vscode/docs/design/README.md` 新增节**——轮次2 评审 #13），并让 AC43 的双源断言**覆盖端特有段存在性**（非仅锚句）。
- **跨仓节引用处置（轮次2 评审 #9）**：CLI 中文档含 CLI 侧文档节引用（实证 `docs/design/prompts/discipline-engineering.md:81`「需求档 §1.12」/`:91`「§2.20」/`:138`「docs/README.md 文档规范 §2.7」），VSC 无对应档；
  **逐字拷入后按“路径/UI 引用处”豁免**：能对上目标仓对应节的改写、对不上的改注“（CLI 侧）”，**逐项入镜像差异表**。
  **V1 判据（轮次3 评审 #7——必须写死，否则自创规则）**：V1 扫含**“（CLI 侧）”注记的行/引用时豁免**（不报、不入基线）；无注记且目标节不存在的引用 → 正常报（新增阻断 / 存量入基线）。该规则入 **T63** 用例。
- **VSC `src/prompts/` 14 → 15**（新增 `persona-eng-designer.md`）；**锚句宿主档定点改写**（A1/A2/A4/A6/A7/A11/A12 所在档），**其余档不动**（轮次2 评审 #10——不做“余 14 档都改”的宽表述）——**不得拿 CLI 的 src/prompts 整体覆盖**（VSC 自持原文，整体覆盖会回退 VSC 特有内容）。
- `thincoder-vscode/docs/design/README.md:30` 的“机制权威 = CLI 仓”句随之改写（登记项；发现 #12 注仓前缀）。

#### 2.22.8 实现面拆分（选型 3）

| 面 | 文件域 | 内容 |
|---|---|---|
| **① 代码面** | `src/**`（除 prompts）· `scripts/**` · `test/**`（除锚句断言） | 门/角色/工具/装配/枚举/V1-V3 + 四个新用例档 |
| **② 提示词双源面** | `src/prompts/**` · `docs/design/prompts/**` · `docs/design/README.md` | 15 拷贝 + 14 定点改 + 1 新建 + 锚句断言测试 |

**文件域不相交** → 两个 eng-coder **并行**（`files` 声明交调度器）；**锚句断言测试归面 ②**（它拥有那些文件），面 ① 的测试只测代码行为——避免跨面依赖。

#### 2.22.9 不变量

1. **代码评审纯只读不削弱**（零 git + 只读工具集；`batch_segment` 仅设计评审附加）。
2. **凭证绝不落档**（工具级剥除，VSC 侧同口径）。
3. **语义同源·原文自持**（不跨仓 import；**文本类锚 A1-A8/A11/A12** 逐字一致；**A9/A10 为行为锚**，由 T59/T61 行为用例承载——轮次3 评审 #3）。
4. **零回归**（VSC 现有清单 28 条 / 27 个 `.test.mjs` + 冒烟集不变红）。
5. **验收不拿静态存在冒充生效**（N4：必须重载扩展后实跑）。
6. **角色可 spawn**（发现 #1）：断言下沉到运行期门——白名单/模式门/子代门全部通过才算落地。

### 2.23 受影响文件（第 5 批 as-of——VSC 仓实测，不得当契约引用）

**代码面**（`thincoder-vscode`）

| 文件 | 性质 | as-of | 增量上限 |
|---|---|---|---|
| src/agent-tools/batch-segment.mjs | **新增** | — | +≤200（CLI 同名档 196 行） |
| src/agent-tools/subagent-spawn-gate.mjs | 修改 | 169 | +≤15（共享校验 `resolveBatchDoc`） |
| src/agent-tools/subagent.mjs | 修改 | 358 | +≤18（白名单/模式门/enum）——**>300 档：不拆**（三处单点枚举改动，结构不变） |
| src/agent-tools/subagent-async.mjs | 修改 | 489 | **+≤10（→499，越 500 停下报告）**——>300 档：不拆（仅父角色集合一行） |
| src/agent-tools/advisor.mjs | 修改 | 296 | +≤14（`batchDoc` 参数）——**跨 300：不拆**（单点参数新增，无结构增长；拆分留给专项债） |
| src/agent-tools/advisor-async.mjs | 修改 | 457 | +≤10（`rv.batchDoc` 实例字段）——>300 档：不拆（同因） |
| src/advisor/tools.mjs | 修改 | 49 | +≤10（三参签名 + 注入） |
| src/advisor/run.mjs | 修改 | 459 | +≤10（调用点 / rv 透传）——>300 档：不拆 |
| src/agent/setup.mjs | 修改 | 449 | +≤20（eng-designer 分支 + 勘察变体）——>300 档：不拆 |
| src/agent-tools/index.mjs | 修改 | 16 | +≤2（barrel） |
| src/prompt-overlays.mjs | 修改 | 82 | +≤4（两行 eng-designer 条目） |
| scripts/check-doc-width.mjs | 修改 | 51 | **+≤247（→298，对齐 CLI 同机制实测 298 行；≤300）；若超 300 即拆 `scripts/doc-consistency.mjs`（二选一）** |
| webview/activity-view.js | 修改 | 157 | +≤2（FAMILY_ROLES） |
| webview/activity.js | 修改 | 205 | +≤2（角色 regex） |
| webview/settings-agent.js | 修改 | 175 | +≤2 |
| webview/settings-models.js | 修改 | 215 | +≤2 |
| test/files.mjs | 修改 | 41 | +≤8（**5 个新 test 档**全部入册；基线 fixture 不入——轮次3 评审 #13） |
| test/batch-segment.test.mjs | **新增** | — | +200 |
| test/batch-doc-gate.test.mjs | **新增** | — | +150 |
| test/eng-designer-role.test.mjs | **新增** | — | +180（含运行期门三例） |
| test/doc-consistency.test.mjs | **新增** | — | +180（V1/V2/V3 + 接线） |
| test/fixtures/doc-consistency-baseline.json | **新增** | — | 基线 |
| thincoder-vscode/docs/design/README.md | 修改 | — | +≤20（“机制权威”句改写 + **镜像差异表新增节**——轮次3 评审 #12；行前缀已标明仓） |

**提示词双源面**

| 文件 | 性质 | as-of | 说明 |
|---|---|---|---|
| src/prompts/persona-eng-designer.md | **新增** | — | 逐字源 = CLI 同名档（56 行） |
| src/prompts/advisor-design.md · advisor-round2.md · advisor-round3.md | 修改 | 36 / 41 / 37 | 锚句 A5/A6 定点改 |
| src/prompts/discipline-engineering.md | 修改 | 206 | 锚句 **A1/A2/A4/A6/A7/A11** 定点改 + **新增六段节**（A1/A2 宿主） |
| src/prompts/persona-eng-coder.md | 修改 | 43 | 锚句 A3 |
| src/prompts/persona-engineering.md | 修改 | 71 | 锚句 **A12**（身份段改述 + spawn eng-designer 调用链——轮次2 评审 #1 🔴） |
| docs/design/prompts/persona-engineering.md | 修改 | — | 中文镜像同步（A12 中文版） |
| thincoder-vscode/docs/design/prompts/*.md | **新增 15** | — | 逐字自 CLI `docs/design/prompts/` 拷贝 + **端特有段适配**（§2.22.7） + **跨仓节引用改写**（轮次2 评审 #9） |
| test/prompts-mirror-anchors.test.mjs | **新增** | — | +≤120（锚句 A1-A8/A11/A12 双源断言 + 端特有段存在性；面 ②） |

> 行数为 2026-09-10 实测（VSC 仓）；**唯一逼近硬顶**：`subagent-async.mjs` 489 + ≤10 = 499——越 500 停下报告并带拆分计划。

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
- AC22（§2.16 + §2.15:371 + §2.19:527）: **锚断言家族覆盖全清单**（一双源在位 + 进 fail-when-unchanged）：
  ①四条行为纪律句（六段自写·一段一作者 / 执行者拒收 / 澄清必经主 agent / 三方条目一致——**定稿文本见 §2.16 各行内容列**）
  ②四步流程三句（设计=需求检验 / 需求缺口停报链 / 写权句）
  ③文档更新纪律三句（D2 单一权威源 / D5 冻结窗口 / D6 回读核对）。
- AC23（§2.15 A——评审 #1）: **主 agent 人格已改述**（PROMPT-SYSTEM §8.1:271 落档）——双源 `persona-engineering.md` 含产品经理/会话面身份，**不再自称设计文档交付者**（`ARCHITECT`/`You design and delegate` 语义已除）。
- AC24（§2.15 A——评审 #2）: **“主会话即 designer”句已撤销**——双源 `discipline-engineering.md` 无该句；设计行为纪律四维归属已改述。
- AC25（§2.15 C——评审 #5；子串钉死见评审 #4）: `persona-eng-designer.md` 必含 FR19 产出要素——
  双源 grep **固定子串**：`批次档 §2` · `不写进设计档` · `选型对比` · `拆分计划` · `验收标准逐条回指` · `用例表` · `UI` · `open` · `判定句` · `打回` · `todo 状态推进` · `不经 advisor` · `勘察预算`。
- AC26（§2.15 E——评审 #7）: designer 子代理**保留**人工 ask 路径（不加任务域豁免）：其写操作经父侧授权；且授权弹窗提供“全部授权/切自动”。
  **依据（评审 #9）**：ask 路径 = 勘察实证（`dispatch.mjs:220` 非授权子代理逐写 ask）；“全部授权/切自动”= 用户 2026-09-10 裁定原话（**非本档可验行为**——实现时由 eng-coder 自验）。
- AC27（§2.15 A2——写权路由）: 设计档**语义修订写权单一**，且“勾销归批次档”已落——核对集 = **六个写入面**：
  §2.2 step 1 / §2.2 step 10 / §2.6 F2 / §2.5 / §2.8 / §2.15 A2——**口径**：语义修订→eng-designer（**F2/§2.5 本体各含一句指向 §2.15 A2 的引用**——D2 不重述、但可核对）；勾销/验收/核销→**批次档 §6**，不进设计档；
  另 `docs/README.md:12/:44` 的作者口径一致；`persona-engineering.md` 双源含**调用链段**（批次档 → spawn eng-designer（带 `files`）→ 核验 → 提醒评审）。
- AC28（§2.19 文档更新纪律）: 纪律表 D1-D7 双源在位（写权矩阵/单一权威源/计数枚举/指针/冻结窗口/回读核对/变更留痕）；
  机械校验 V1/V2 在 `test/doc-consistency.test.mjs` 内可跑：**新增违规阻断、存量不达基线降为报告**（口径照需求档 §1.15:614，非自创）；
  基线 = 首跑固化清单（存 `test/fixtures/doc-consistency-baseline.json`，入 §2.18）。
- AC29（§2.20.1——工具契约与 fail-closed 面）: `batch_segment` schema **不含 `path`**；段白名单按调用者身份强制（designer→§2 / 设计评审→§3 / **eng-coder→§5**），
  **越段/未知段 → throw**；**append-only**（写入前后档内既有行 **字节不变**）；
  **fail-closed 面逐条**：骨架保护（text 含 `^## §\d` → 拒）· text >20000 → 拒 · 未绑定/路径不可读 → 拒 · 目标段标题缺失 → 拒；**父代理不适用**（无绑定即无写权——不变量 3）。
- AC30（§2.20.1——凭证剥除）: 写入文本含 `[DESIGN-TOKEN:…]` 或 `designId: …` 行 → **落档后档内零命中**（其余内容逐字保留）；
  **剥除器用自有正则**（不复用 §2.7 巡检正则——后者要求参数名后接空白，匹配不到冒号形态）。
- AC31（§2.20.2/2.20.3——路径门禁与只读面）: 评审侧 `batchDoc` **若传则须可读**（空/不可读 → throw）；**未传 → 工具不挂载、评审照常**（零回归，不破 N5）；
  未绑定批次档时工具 **fail-closed**（不挂载/调用即拒）；**代码评审工具集零变更**（`_advisorToolsFor` 断言 code review 不含本工具）。
- AC32（§2.20.6——V3）: 对**§4 或 §6 有实质内容（排骨架/占位行）**的批次档断言「§3 含**工具写入的轮次行**（`### 轮次 \d+（评审子代理）`——排除骨架行 `### 轮次与发现（…）`）」；
  **在飞批次不报**（零假阳；**判据不引用 §1 的“已收口”状态词**）；反证：§4 有实质内容 + §3 无工具轮次行 → 必报。
- AC33（§2.20.5——失败明示）: 双源提示词含「写不进去→报告明示‘§× 未写入’」「父侧代写**必须打标**」句（grep 断言）。
- AC34（§2.20.1——来源戳，评审 #1/N4）: `### 轮次 N（评审子代理）` **由工具生成**——**作用域 = 仅 §3**（§2/§5 不加节标题）；N = **§3 内**工具写入的轮次行计数 + 1（收窄口径，**排除骨架行**）；**N = 节序号**（拆节逐节顺延；评审轮次以内容为准）；
  调用方 text 内的同名标题行被忽略；**§3 中工具写入的轮次节必带该戳**（缺戳/伪造戳用例反证）。
- AC35（§2.20.4/§2.20.5——F4/F5 + 多轮面，评审 #3/#6）: 三条评审提示词**双源**（`advisor-design.md`/`advisor-round2.md`/`advisor-round3.md`）均含「把发现表+VERDICT+计数**逐字**写入批次档 §3」句**且带适用面限定子串**（“仅设计评审 / 工具已挂载”类——轮次5 评审 #7）（grep 断言）——
  盖住 round 2+ 设计评审（`src/advisor.mjs:109-115`）不读 advisor-design.md 的事实。
- AC36（§2.20.2/§2.20.8——并发隔离，评审 #7）: 绑定按**评审实例键**（非单值会话态）；两个不同批次档的设计评审并发 → **各自正确落档**，不得串档（实例键下的预期即为两者均成——无“或拒”并列）。
- AC37（§2.22.3——batchDoc 门移植）: VSC **两路 spawn**（阻塞 `subagent.mjs` / 异步 `subagent-async.mjs`）均：**目标角色**（`eng-coder` / `eng-designer`）batchDoc 缺 → 拒；路径不可读 → 拒；参数在 + 可读 → 放行并注入；
  **非目标角色（explore/plan/coder）零变更**（不带 batchDoc 不拒）；**校验逻辑单份**（共享 `resolveBatchDoc`，无重复实现）；schema 含 `batchDoc` 属性、受限变体 delete 清单含之。
- AC38（§2.22.4——eng-designer **八处** + 勘察通道⑨）: ①运行期白名单（`ROLES`，**含错误文案列举**）②模式门（非工程模式拒 designer）③子代 spawn 门（父角色集合）
  ④装配分支（工具集含 `batch_segment`、**不含 advisor**）⑤角色 enum ⑥`prompt-overlays` 两行 ⑦**webview 四处** ⑧人格文件；
  **⑨勘察变体必搬**（explore-only，参数化复用 CLI §2.15 D4 口径；**无“不搬”选项**——否则人格文本指向不存在的能力，轮次2 评审 #4）。
- AC39（§2.22.2——锚句 A1-A12）: **文本类锚**（A1-A8、A11、A12）在 VSC 侧宿主文件（双源两侧）与 CLI 侧**逐字相同**（grep 断言；白名单枚举/参数名/状态词不得改写）；**A1/A2 宿主 = VSC discipline-engineering.md 新增六段节**；
  **A12 宿主 = VSC `persona-engineering.md` 双源**（含产品经理身份 + spawn eng-designer 调用链，**不含 ARCHITECT 交付物句**——轮次2 评审 #1）；
  **A9/A10 为行为锚，不进 grep 集合**（断言由 T59/T61 行为用例承载——轮次2 评审 #8）。
- AC40（§2.22.5——工具移植 + 只读面）: 工具契约同 §2.20.1（无 `path` / 段白名单按身份 / append-only / 戳仅 §3 / 自有剥证正则 / fail-closed 六条）；
  VSC `src/advisor/tools.mjs` **仅当 `reviewType==='design'` 且 batchDoc 已绑定**时追加；**代码评审工具集逐字节不变**（`_resolvedAdvisorToolsFor` 断言）。
- AC41（§2.22.5 适配点②——实例键通道）: batchDoc 沿 **`rv` 实例参数**传递（非单值会话态）；两批设计评审并发各自正确落档。
- AC42（§2.22.6——V1/V2/V3 + 接线 + 跨仓边界）: VSC `check-doc-width.mjs` 扩为一致性扫描（V1/V2/V3）+ 基线读写 + 导出；
  **接线钉死 `test/files.mjs` 入册**（`package.json` 不在本批文件域——不得改，轮次2 评审 #4）；**V3 扫描根/跨仓边界**按 §2.22.6 定（本仓缺目录即跳过；真守门在 CLI 侧）；**V1/V2 两面各有用例**。
- AC43（§2.22.7——双源结构 + 端特有段）: VSC 建 `docs/design/prompts/` **15 文件**（与 CLI 同名集合一一对应）；`src/prompts/` 14 → **15**；
  **同名集合两侧相等**（无多无少）；**端特有段进镜像且被断言**（非仅锚句）；VSC 特有文件不得被 CLI 版本整体覆盖（逐差异面登记）。
- AC44（§2.22.9 + 需求 N4——验收不冒充）: 机械面全绿之外，**交付报告必须写明“生效需重载扩展”**；不得以“文件存在/静态断言绿”声称机制已生效（第 2 批教训）。

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

**第 2 批用例（T30–T42）**

| # | 场景 | 输入 | 预期输出 | 映射 |
|---|---|---|---|---|
| T30 | 正常：角色注册五处 | 工程模式 spawn `role="eng-designer"` | 不被白名单/模式门拒；child 装配工程纪律槽 | AC16/FR9 |
| T31 | 错误：角色互斥 | **非**工程模式 spawn `eng-designer` | throw（与 eng-coder 门同族） | AC16/NFR4 |
| T32 | 边界：装配不静默回退 | `assemblePrompt("eng-designer")` | prompt 非空、≠ CONSULT_BASE、槽序正确、warnings=[] | AC17/FR9 |
| T33 | 错误：designer 无 batchDoc | 工程模式合法上下文（**不带凭证**）、不带 batchDoc | throw（文案含 eng-designer） | AC18/FR20#9 |
| T34 | **边界：写域纪律（提示词级）** | grep 双源 `persona-eng-designer.md`；并校对 `src/agent/dispatch.mjs` | persona 含写域声明（`docs/` 扣除 `docs/design/prompts/`）；dispatch **无新增写域判定**（机械层零变更） | AC19/**§1.5#8** + 批次档 §1 对账发现 2 |
| T35 | 边界：勘察受限 | designer 内 spawn `role="coder"` / `role="explore"` | 前者拒（explore-only）、后者允；**且勘察任务输入不含 Audit scope 块**（评审 #4） | AC20/§1.5#7 |
| T36 | 边界：designer 无 token 需求 | spawn 不带 designToken | 通过（不需凭证——与 eng-coder 形成对照） | AC20/§1.5#4 |
| T37 | 边界：纪律锚驻留（**AC21/AC22 共用例**） | 四条纪律句 + 四步三句 + D2/D5/D6 三句双源 grep + 锚断言；新 person 文件已入 NEW_PROMPTS | 双源命中；锚断言绿 | AC21/**AC22** |
| T38 | 边界：主 agent 人格改述 | 双源 grep `persona-engineering.md` | 含产品经理/会话面身份；不含 `ARCHITECT`/`You design and delegate` 类交付物句 | AC23/FR9#1#2 |
| T39 | 边界：designer 写操作走 ask（评审 #7） | designer 子代理写 `docs/x.md`（manual 档位） | 触发父侧授权（非静默）；授权后可“全部授权/切自动” | AC26 |
| T40 | 边界：写权路由单一口径（**AC27/AC27b 用例——六面**） | grep §2.2 step1/step10 / §2.8 / §2.15 A2 / §2.6 F2 / §2.5 / persona-engineering（双源） | 六面均指向 eng-designer（F2/§2.5 为指向句）；无“父代理更新设计文档”残留；勾销无“进设计档”字样 | AC27+AC27b/FR9#3 |
| T41 | 正常：文档一致性机判 | 跑 `test/doc-consistency.test.mjs`（V1 段引用 / V2 计数） | 存量基线全绿；人为制造一条计数不符 → 报红（反证非空转） | AC28/§2.19 D3-D4 |
| T42 | 边界：撤销句/产出要素（评审 #10） | 双源 grep `discipline-engineering.md`（无“主会话即 designer”）；grep `persona-eng-designer.md`（FR19 固定子串） | 前者零命中；后者子串全命中 | AC24/AC25 |

> 需求层已迁出（2026-09-10 需求层拆分批）：信任模型/边界需求见 `../requirements/ENGINEERING-MODE.md` **§3**。
- ~~METHODOLOGY.md 缺失降级（D-M1/D-M2——已实现）~~ **已随 METHODOLOGY 退役删除（2026-09-10——PROMPT-SYSTEM 蓝图 §2.5 项目层收敛）**：工程模板携带/缺失警告整段移除——项目层唯一入口 = AGENTS.md（loadProjectInstructions 已注入，缺失 = 项目层空缺静默跳过，无警告需求）；方法论骨干已分拣入纪律层槽位文件。

**第 4 批用例（T43–T53）**

| # | 场景 | 输入 | 预期输出 | 映射 |
|---|---|---|---|---|
| T43 | 正常：append 写入 | designer 调工具写 §2（档内已含 `## §2` 标题——骨架由创建方预写，§1.12） | 成功；§2 尾部追加；**既有行字节不变**（append-only 反证） | AC29/FR22F3 |
| T43b | 错误：目标段标题缺失（评审 #7） | 批次档无 `## §2` 标题时调工具写 §2 | throw（纠正动作：先由创建方补骨架） | AC29/§2.20.1 fail-closed |
| T44 | 错误：越段 | designer 写 §3 / eng-coder 写 §2 / 设计评审写 §2 | 三者均 throw（身份定权限） | AC29/FR22F2 |
| T45 | 边界：凭证剥除 | text 内嵌 `[DESIGN-TOKEN:…]` + `designId: …` 行 | 落档后档内零命中；其余内容逐字保留 | AC30/§2.7 |
| T46 | 边界：V3 零假阳 | ①在飞批次（§4/§6 **仅骨架/占位行**——同本批档真实形态）②§4 有实质内容但 §3 无工具轮次行 ③§4 有实质内容且含**工具写入轮次行** ④§3 **只有骨架行** `### 轮次与发现（…）` | ①**不报** ②报 ③不报 ④**报**（骨架行不算） | AC32/FR22N3 |
| T47 | 错误：路径门与只读面 | 评审带**不可读的** `batchDoc` → throw；评审**不带** `batchDoc` → 工具**不挂载**且评审照常跑（零回归）；`_advisorToolsFor(agent, "code")` | 前两者如上；后者工具集不含 batch_segment | AC31/FR22N1·N5 |
| T48 | 边界：来源戳不可伪造（评审 #1） | ①正常写入 ②text 内自带 `### 轮次 1（评审子代理）` ③连写两轮 ④档内已有骨架行 `### 轮次与发现（…）` | ①工具写的标题为首行；②自带标题被忽略、N 由工具算；③两轮 N = 1、2；④**N 仍为 1**（骨架行不计） | AC34/FR22N4 |
| T49 | 正常：多轮提示词面（评审 #3） | grep 双源 `advisor-design.md` / `advisor-round2.md` / `advisor-round3.md` | 三档均含写入 §3 指令，**且该句已限定“仅设计评审 / 工具可用时”**（round2/3 为设计+代码共用——`src/advisor.mjs:109-120`，未限定会让 round 2+ **代码**评审误报“§3 未写入”） | AC35/FR22F3F4 |
| T49b | 错误：代码评审不带写指令（轮次4 评审 #3） | round 2+ **代码**评审的注入文本 | **不含**“写入批次档 §3”句（钉死单形态；若选“含但带不适用限定”则断言限定子串必在） | AC31/AC35/N1 |
| T50 | 边界：骨架保护（评审 #9） | text 含 `## §4 用户批准` 行 | throw（引导改写） | AC29/§2.20.1 |
| T51 | 边界：并发隔离（评审 #7） | 两个设计评审（不同批次档）并发启动并各自写 §3 | **各自落自档**（实例键绑定下的预期即为两者均正确落档；轮次4 评审 #9 删去“或启动即拒”并列） | AC36/§2.20.8 |
| T52 | 边界：超量拒绝（评审 #10） | `text` >20000 字符 | throw（消息引导分段追加：**每次调用各成节、N 顺延**） | AC29/§2.20.1 |
| T52b | 正常：超量后分段追加（轮次4 评审 #1） | 超量拒收后拆成两次调用写同轮内容 | 两次**各成节**：N = 1、2（档案按节记，分区诚实——**无“不新盖戳”承诺**） | AC34/§2.20.1 |
| T53 | 正常：身份判据同源（评审 #6） | 设计评审实例写入时断言身份判定与目标档绑定读**同一实例键** | 不读他批状态；无单值会话态依赖 | AC36/§2.20.1 |

**第 5 批用例（VSC 镜像——在 VSC 仓跑，T54–T66，含 T55b/T57b/T57c）**

| # | 场景 | 输入 | 预期输出 | 映射 |
|---|---|---|---|---|
| T54 | 正常：门放行两路 | 阻塞/异步两路 spawn 各带可读 batchDoc（目标角色） | 两路均放行；注入 `_batchDoc` + **child 任务文本含 `Batch record (batchDoc): <abs>` 行**（镜像 CLI 第 1 批形态——轮次3 评审 #11）；**两路命中同一校验函数** | AC37/F1 |
| T55 | 错误：缺参 | 目标角色（eng-coder/eng-designer）两路不带 batchDoc | 两路均拒（消息明示缺参）；**不得只拒一路** | AC37/F1 |
| T55b | 边界：非目标角色零变更（发现 #3） | `explore` / `plan` / `coder` 不带 batchDoc | **均不拒**（照常 spawn）——否则违 N2 | AC37/N2 |
| T56 | 错误：不可读 | batchDoc 指向不存在/非文件路径 | 两路均拒（消息含路径与原因） | AC37/F1 |
| T57 | 正常：角色可 spawn（**运行期门**） | 工程模式 spawn `eng-designer`（含真白名单/模式门/子代门路径） | 白名单放行 + 错误文案含新角色 + 工具集含 `batch_segment`、**不含 advisor**；人格槽位命中 | AC38/F2 |
| T57b | 错误：模式门与子代门（发现 #1） | ①非工程模式 spawn `eng-designer` ②designer 子代 spawn 非 explore | ①拒 ②拒（留的写法同族；不得撞 generic engineering-mode 文案） | AC38/F2 |
| T57c | 正常：勘察通道（轮次3 评审 #5，对齐 CLI T35） | designer 内 spawn `explore`（勘察）· designer 内 spawn `eng-coder`/`plan` | 前者**允**；后者**拒**（受限变体只暴露 explore） | AC38⑨/F2 |
| T58 | 边界：webview 四处 | grep `activity-view.js` / `activity.js` / `settings-agent.js` / `settings-models.js` | 四处均含 `eng-designer`（漏一处即红） | AC38/F2 |
| T59 | 正常：工具行为（VSC 独立实现） | 段白名单（越段拒）/ append-only / 来源戳（§3、N=节序号、排骨架行）/ 剥凭证（零命中） | 逐项同 CLI T43–T45 口径 | AC40/F4 |
| T60 | 错误：只读面 | `_resolvedAdvisorToolsFor`（code） | 工具集**不含** batch_segment（零变更） | AC40/N1 |
| T61 | 边界：V3 零假阳 | ①在飞批次（仅骨架/占位行）②§4 有实质内容 + §3 无工具轮次行 ③二者均备 ④**本仓缺 `docs/batches/`** | ①不报 ②报 ③不报 ④**跳过不报**（跨仓边界） | AC42/F5 |
| T62 | 正常：双源结构 + 锚句 + 端特有段 | 同名集合对比 + 文本类锚 grep（双源）+ 端特有段存在性 | **两侧各 15**、集合相等；锚句逐字一致；端特有段在镜像中 | AC39/AC43/F6 |
| T63 | 正常：V1/V2 + 跨仓注记（发现 #5 · 轮次3 评审 #7） | ①人造段引用失配 ②计数声明与列表不符 ③存量不达基线 ④**带“（CLI 侧）”注记的引用行** | ①②**报** ③**降报告**（不阻断） ④**豁免不报**（注记行不入基线） | AC42/F5 |
| T64 | 正常：接线（发现 #5） | `test/files.mjs` 入册并实跑 | 校验器**真被跑到**（未接线 = 红） | AC42/N3 |
| T65 | 边界：主 agent 人格（轮次2 评审 #1，对齐 CLI T38） | 双源 grep `thincoder-vscode/src/prompts/persona-engineering.md` + 中文镜像 | 含产品经理身份 + spawn eng-designer 调用链；**不含 ARCHITECT/交付物句** | AC39/AC44/FR23 |
| T66 | 边界：并发隔离（轮次3 评审 #4——镜像 CLI T51） | 两个设计评审（不同批次档）并发启动并各自写 §3 | **各自落自档**（RV 实例键绑定），不得串档 | AC41/§2.22.5 |

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
- **角色互斥**：工程模式禁用 `coder`，普通模式禁用 `eng-coder` 与 `eng-designer`（schema 枚举 + 运行期硬门禁双保险；第 2 批新增第三门——落地时同步本行，见设计档 §2.15 A 模式门）

## 6. 已知取舍（评审记录）

1. 父代理无全面写文件门禁——必须能写设计产出物；越权靠提示词（拦截型门禁覆盖产品代码）。
2. token 跨任务存活——保守缺口，已接受（链终消费制收口后：仅链中存活，链终消费）。
3. token 持久化边界——单值自 08-29 起已随 slot 持久化、多槽同构序列化；TTL fail-closed 兜底，过期重评；无签名格式（uuid:expiresAt）下防伪不声称——门禁可经工程模式开关绕过，防伪无实际安全边界。
4. multi-repo 时 advisor cwd 取 `repos[0]`——`_touchedFiles` 绝对路径缓解，已知限制。
5. 架构级文档以机制约束（FR1-FR8）替代用户故事——架构级机制文档的既定形式（评审 2026-09-02 #1 措辞修正，不主张 METHODOLOGY 原文含此豁免）。

## 7. 变更记录

- 2026-09-11（凌晨·一）：**第 5 批设计评审轮次 3 处置**（1🔴+6🟡+6🔵，用户裁定**全修**）：
  🔴 **勘察通道同档两说**（正文留“不搬”退路 vs AC38/任务书“必搬”）——**删退路句、正文改写“必搬 + 遇阻停下报告”**（与批次档 §2 一致）；
  🟡 用例表标题改 **T54–T66** + **T62 归位** + 新 **T57c**（勘察通道行为）/ **T66**（并发隔离，镜像 CLI T51）；
  不变量 3 改「文本类锚 A1-A8/A11/A12；A9/A10 行为锚」（与 AC39 同口径）；④ 装配清单明列**勘察通道工具**；
  跨仓节引用补 **V1 判据**（“（CLI 侧）”注记行豁免）+ 入 T63（新④）；T54 补 **任务文本注入行**断言；
  🔵 check-doc-width 上限改 **≤+247（→298）** · README 差异表宿主行改 **+≤20** · 测试档计数统一「5 new test + 1 fixture」 · 需求档 N3 计数口径入 designer 任务书；
  **批次档（父侧写域）**：§3 落**带编号的轮次 1/轮次 2 发现表**（供「发现 #N」解析）；§2 计数改提示词面 **8 项** + 用例表 **T54–T66**。

- 2026-09-10（晚·十六）：**第 5 批设计评审轮次 2 处置**（1🔴+8🟡+5🔵，用户裁定**全修**）：
  🔴 **主 agent 人格面缺位**（VSC `persona-engineering.md:10-13` 实证仍是 ARCHITECT/设计档交付者——与带入的 A1/A4/D1 同装配互斥）——**新增锚 A12**（双源改述 + spawn eng-designer 调用链，逐字源 = CLI 同档）+ §2.23 补双源两行 + **T65** + §2.22 目标段记实证；
  🟡 用例标题 **T54–T65**（含 T55b/T57b/T65；T62 归位）+ 批次档 §2 同步；
  轮次 1 发现落点：批次档 §3 待父侧代写打标（§3 = 评审子代理自写，工具落地前通道：**本轮先补设计档内“发现 #N”可解析性**——处置段已逐条化）；
  AC38 ⑨ **勘察变体必搬**（无“不搬”选项）；接线落点**钉死 files.mjs**（package.json 不入文件域）；
  check-doc-width 增量上限改 **≤+250（→≤300，对齐 CLI 实测 298 行）** + 保留拆分退路；
  测试标注补齐（anchors 档 +≤120；files.mjs +≤8）；**AC39 分文本类锚/行为锚**（A9/A10 不进 grep，改 T59/T61 承载）；
  跨仓节引用处置（改写/注 CLI 侧/入差异表——不产生悬空引用）；镜像差异表宿主钉死（VSC docs/design/README.md 新增节）；
  “余 14 档都改”收紧为“仅锚句宿主档”；注入行同形镜像（T54 断言，改形态须报告）；终局判据指针改 FR23/§1.17。

- 2026-09-10（晚·十五）：**第 5 批设计评审轮次 1 处置**（2🔴+8🟡+4🔵，用户裁定**全修**）：
  🔴 **F2 漏运行期门**（照设计落地则 designer 根本 spawn 不出来）——§2.22.4 由五处→**八处**（白名单 `subagent.mjs:254-256`+错误文案 / 模式门第三门 / 子代 spawn 门）+ 不变量 6 + T57 下沉运行期 + 新 **T57b**；
  🔴 **档位表无拆分结论**——§2.23 逐档补“拆/不拆 + 理由”（`advisor.mjs` 296→310 **跨档：不拆**）；
  🟡 batchDoc 门补**角色域**（`{eng-coder, eng-designer}`；其余零变更）+ schema 属性 + 受限变体 delete 清单 + 新 **T55b**；
  🟡 designer **勘察通道**（CLI §2.15 D2/D3）入 §2.22.4 ⑨ + 人格文本同步要求；
  🟡 V1/V2 与接线补用例（新 **T63/T64**）；V3 **跨仓边界**写死（真守门在 CLI 侧，VSC 缺目录即跳过；将来用显式参数传根）；
  锚表补**宿主列**（A1 宿主改 VSC discipline-engineering 新增六段节）+ 新 **A11**（spawn 样例带 batchDoc=）；
  双源定**端特有段进镜像 + 被断言**（AC43/T62）；删自相矛盾的“>300 档”括注；
  🔵 计数口径（28 条清单 / 27 个 .test.mjs）· 仓前缀已标（`thincoder-vscode/docs/design/README.md`）· “両側”→“两侧”。
  **批次档（父侧写域）**：§2 任务书落笔并打标（覆盖条目/不在本批/受影响文件指针/验收标准/就绪）。

- 2026-09-10（晚·十四）：**第 5 批设计（VSC 端镜像，FR23/§1.17）**——新增 **§2.22**（总原则语义同源原文自持 / **镜像锚 A1-A10 逐字源钉死** / batchDoc 门两处各落+共享校验 / eng-designer 五处落地 / batch_segment 两个适配点 / V1-V2-V3 含**接线硬项** / 双源新建 15 档 / 实现面拆分 / 五条不变量）
  + **§2.23**（受影响文件 as-of：VSC 仓 23 项代码面 + 6 项提示词面，行数实测；唯一逼近硬顶 `subagent-async.mjs` 489+≤10=499）+ **AC37–AC44** + **T54–T62**。
  **适配点**：工具集落点 = `src/advisor/tools.mjs:26`（三参签名）；实例键通道 = `rv.batchDoc`（非单值会话态）。
  **实现面拆分（选型 3）**：2 个并行 eng-coder（①代码面 ②提示词双源面，文件域不相交；锚句断言测试归面 ②）。
  **待用户裁**：无（四项选型已定，见 §2.22）；**实现未启动**（待用户发起评审 → 批准）。

- 2026-09-10（晚·十三）：**第 4 批实施交付核销**（eng-coder 终态 **clean**）——交付 26 文件：新 2（`src/agent-tools/batch-segment.mjs` 196 / `test/batch-segment.test.mjs` 321），改 24（挂载三处 + advisor 参数/实例键 + run.mjs 设计分支 + V3 入 check-doc-width + 提示词双源 12 + TOOLS/AGENT-LOOP 登记）。
  内层 explore 审计 1 轮 + advisor 代码评审 2 轮 **pass**；父侧 L2 **324/324 全绿**；AC29–AC36/T43–T53 全绿；档位两约束未越（497/298）。**FR22 已落地**；批次档 §6 已回填（父侧验证/核销清单/遗留四项）。

- 2026-09-10（晚·十二）：**第 4 批设计评审轮次 5 处置（PASS 后 advisory 全修；同链复用 token，不重评审）**（6🟡+5🔵）：
  🟡 **V3 触发判据补定义**——“非空”→“**有实质内容（骨架/斜体占位行不算）**”（本批档在飞态真实命中过）；T46① 改为“仅骨架/占位行”反证；
  🟡 **批次档 §2–§6 骨架改回 §1.12 模板形态**（§3 含 `### 轮次与发现（…）` 骨架行、子标题逐项对齐模板）；
  🟡 **来源戳作用域钉死**：仅 §3 轮次节（§2/§5 不加节标题）；N 只数 §3 内该形态行；并在 §2.20.1/AC34 明写 **N = 节序号**（轮次以内容为准）；
  🟡 调用侧句补**适用范围**（无批次档的在途设计评审不受阻）+ AC 面补全；
  🟡 §2.20.4 的 D5 论证改口径（“§3 段不在评审对象清单内（B9 只含 §2）”——不再写“批次档非被审文档”）；需求 §1.16 N2 句一并入 designer 任务书；
  🟡 **§2.19 V2 行补“落点见 §2.21 二选一”**（上轮只扫了 V1）；
  🔵 AC35 加**适用面限定子串**断言 · §2.20.1/§2.20.2 的角色名统一 `eng-designer`/`eng-coder` · §2.18 的 check-doc-width 行数加“以 §2.21 为准”（51↦281） · T49b 钉死单形态断言。
  **说明**：轮次 5 已 PASS 并签发 token；本段为 pass 后 advisory 的**同链修正**（评审自己开的方子、无新范围），不触发重评审。

- 2026-09-10（晚·十一）：**第 4 批设计评审轮次 4 处置**（2🔴+4🟡+6🔵，用户裁定**全修**）：
  🔴 **轮次戳两规则互斥**（我上轮自造）——撤“续写不新盖轮次戳”，改「**分段追加——每次调用各成节、N 顺延**」（契约注释 / fail-closed 行 / §2.20.4 / T52 同步）+ 新增 **T52b** 反证；
  🔴 **§2.19 V1 与 §2.21 二选一**——本批内同步废除 V1“定死此文件”口号（不再延后给 designer）；
  🟡 round2/3 提示词为**设计+代码共用**——“写 §3”句限定“仅设计评审/工具已挂载”（`src/advisor.mjs:109-120` 实证）+ **T49b**；“会话态”残留三处（契约注释 / §2.20.2 标题 / §2.21 行）统一改「档绑定/评审实例键」；
  TOOLS.md 行数 **79→124**（实测）；需求档行数 **675→679**；
  🔵 AC29/T44 简写 `coder` → `eng-coder` · AC36/T51 删“或门禁明拒”并列（实例键下预期即各自落档）· §2.20.4 明写 **F4/F5 由提示词层承载、V3 只保底线**及理由 · §2.21 需求档行加 **§1.16 F1 评审侧口径**；
  **批次档（父侧写域）**：补 §2–§6 六段骨架 + §2 作者改“eng-designer（已落地）” + 需求清单重组为**完整 4 条列表**（消 V2 “声明 4 条 vs 同块 2 项”假阳）+ 补 §3–§6 作者署名。

- 2026-09-10（晚·十）：**第 4 批设计评审轮次 3 处置**（1🔴+5🟡+5🔵，用户裁定**全修**；评审对上轮 🔵11 的“§2.20.2 末段仍写会话态”报告与磁盘不符——84ad034 时已改，未计）:
  🔴 **§2.20.7 路径传递行**残留旧口径——改「参数在工具入口 + **评审实例键**传递；不用单值会话态」（与正文 §2.20.2/不变量 6 同口径）；
  🟡 §2.20.7 V3 范围行改机器判据原文 · **§2.20.3 重构为三方挂载表**（评审/designer+coder/主 agent——不变量 3 有了机械落点）·
  AC29 扩含 fail-closed 逐条 · **T43b**（段标题缺失 throw）+ fail-closed 清单补该情形 · §2.20.6 补“落点按 §2.21 二选一”句 · T53 映射窄化；
  🔵 超量改“**同轮分段追加**——续写不新盖轮次戳”（轮次戳语义闭合）· 调用侧补“发起评审必须传 batchDoc”指令 · round 1 宿主钉死（`src/advisor.mjs:109-111` 实证）· T 表标题 T43–T53 · §2.21 补 TOOLS.md 实测行数与 B9 同步项。
  **范围外不外溢**：批次档 §2–§6 骨架与 §1 作者注滞后（R7a）——待 designer 落 §2 时一并不正；§2.19 V1“定死此文件”冲突——designer 同步时处置。

- 2026-09-10（晚·九）：**第 4 批设计评审轮次 2 处置**（1🔴+8🟡+3🔵——用户裁定**全修**）：
  🔴 **AC31 同步**——由“必传”改为“**若传则须可读**；未传→工具不挂载、评审照常”（与正文 §2.20.2/取舍记录/T47 口径一致，不破 N5）；
  🟡 §2.21 补 round2/round3 **双源**行 · 剥证器改**自有正则**（不复用 §2.7——其正则匹配不到冒号态；F6 同步）· 来源戳与 V3 改**收窄口径**（只认工具写入的轮次行，排骨架行；T46④/T48④ 反证）· V3 触发条件改**机器判据「§4 或 §6 非空」**（删“已收口”同名状态词）·
  身份判据改与目标档绑定**同读实例键** · 需求档 **B12 §4→§5** · §2.21 定义 `check-doc-width.mjs` **二选一**（增量 ≤19 守 300 / 拆 `scripts/doc-consistency.mjs`）；
  🔵 新增 **T52**（超量 throw）/ **T53**（身份判据同源）· §2.20.2 末段按实例键重写 · 批次档 §1 标签改“第 4 批”。

- 2026-09-10（晚·八）：**第 4 批设计评审轮次 1 处置**（1🔴+6🟡+5🔵——用户裁定**全照办**）：
  🔴 来源戳——守卫表新增「**来源戳由工具生成**」（N = 计数 + 1；调用方同名标题被忽略）+ **AC34/T48**；
  🟡 评审侧门禁改「**若传则须可读**」并记取舍（不改 N5 零回归；§2.20.8 取舍记录）· 提示词面扩到 **round2/round3**（`src/advisor.mjs:109-115` 实证）+ **AC35/T49** ·
  §2.21 补 **`src/agent-tools.mjs`（barrel）** · 需求档行改标 **eng-designer 落笔** · F4/F5 补 AC35 ·
  评审侧绑定改**评审实例键**（并发出隔离不变量 + **AC36/T51**）；
  🔵 run.mjs 行数写法澄清 · **骨架保护**（拒 `^## §\d`，T50）· 守卫表补「身份判据」列 · §2.21 计入 `AGENT-LOOP.md:283` 修正 · 抽查结果回记。

- 2026-09-10（晚·七）：**第 4 批设计（C——批次档段写入工具，FR22/§1.16）**——新增 **§2.20**（工具契约 / 会话态绑定 / 评审工具集只读面 / §3 内容口径 / 提示词侧 / V3 零假阳 / **四个选型决策** / 四条不变量）+ **§2.21**（受影响文件 as-of，**两处档位风险显式标注**）+ **AC29–AC33 + T43–T47**。
  **编号避让**：并行会话的「模型选择面重构」批已占「第 3 批」→ 本批称**第 4 批**。
  **待用户裁**：无（四个选型已定，见 §2.20.7）；**实现未启动**（待用户发起评审 → 批准）。

- 2026-09-10（晚·六）：**第 2 批实施交付核销**（eng-coder 终态 clean：审计 1 轮 + advisor pass + 修正轮 1/5；父侧 L2 **310/310 pass**；
  父侧磁盘抽查 10/10 与声明一致）。需求池：FR9（角色落地+写权+人格改述）/FR16 行为面/FR17 #3#4/FR19/FR20#9 行为面/FR21 **已落地**；
  遗留 8 项见批次档 §6（V2 窗口口径待裁 / 中文四维正文 / 既存漂移 / 预估偏差 / CLI 自用首验 等）。**VSC 镜像延后**。

- 2026-09-10（晚·五）：**设计评审轮次 3 处置**（2🔴+9🟡+3🔵——用户裁定“**勾销这些都应该在批次档做，不是设计档**”）：
  🔴1 写权路由收口（**勾销→批次档 §6** 入 A2 表；**§2.2 step10 / §2.6 F2 / §2.5** 三写入面补路由；AC27 核对集→六面）；
  🔴2 `docs/README.md` 纳入（登记面→7 处 + §2.18 新增行）；
  🟡 AC25 合并去重 · 删逐字重复段 · 需求 §1.15 尾段改指针 · 批次档计数 8 条 · V1 落点定死+`_archive` 豁免+V2 三形态判据 ·
  AC28 口径照需求档（新增阻断/存量降报告 + 基线文件）· AC22 枚举扩全（三组十句）· 补 T42（AC24/AC25）· FR9 #5 落点与 #7 勘察预算（≤6/批，与审计预算独立）；
  🔵 T33 输入措辞 · D4 落点→V1 · 八维编号校正为 **#7 Document ownership**（定耆 `advisor-design.md:9`）· 目标计数 7 场景/15 文件 ·
  A2 补 `files` 声明 + C 补 todo 状态推进（§1.8 步 2 / B5）。

- 2026-09-10（晚·三）：**设计评审轮次 2 处置**（1🔴+5🟡+3🔵——用户逐条裁）：
  🔴 写权路由——用户裁定**“主代理负责的是批次档，设计档由 designer 负责”**：新增 **§2.15 A2**（写权矩阵 + 调用形态）、
  §2.2 step1/§2.8 路由改目标态、persona-engineering 增调用链段、**FR9 九条落地状态表**；
  🟡四步流程改写给**定稿三句**+入锚 · 8 项按 FR19 逐字对齐 + AC25 子串钉死 · 计数 6 处 · 需求档段号（§5/§3→§6）；
  🔵 用例表标题/排序（T30–T41）· TUI 计数口径 · AC26 依据标注；需求档 §1.6/§1.8 状态改“**用户已确认**”。
  新增 **AC27/AC28 + T40/T41**（写权路由单一口径——六面 / 文档一致性机判）。
- 2026-09-10（晚·四）：**§2.19 文档更新纪律**（用户指出“更新文档的复杂度”）——D1-D7 七条 +
  机械校验最小集 V1/V2（`scripts/check-doc-width.mjs` 扩扫 + 新增 `test/doc-consistency.test.mjs`）；
  需求侧同步落 §1.15 + **FR21** + §1.12 模板§6「核销同步清单」槽位。

- 2026-09-10（同日晚）：**设计评审轮次 1 处置**（2🔴+8🟡+3🔵——用户裁定全部照办）：①**主 agent 人格改写**入本批
  （persona-engineering 双源——身份改述为产品经理；FR9#1#2）②**“主会话即 designer”句撤销**入 §2.16（双源）
  ③setup 内层选择器映射 + 接线断言 ④勘察 spawn 返回值语义（null）⑤FR19 产出要素逐项 + AC25 ⑥计数对齐（五处/6 处）
  ⑦已知摩擦落档（逐写 ask——用户接受，弹窗可“全部授权/切自动”）⑧档位计数修正（5 个 >300）+ setup 变体=参数化复用
  ⑨batchDoc 模型面文案同步 ⑩T34 映射改指 ⑪需求档 B7 计数对齐 ⑫测试清单同步点名 ⑬越界文案参数化。
  另补：纪律层四步流程改写（§8.1:273）纳入同批。新增 AC23–AC26 + T38/T39。

- 2026-09-10：**eng-designer 角色 + 行为纪律设计**（第 2 批——FR9 九条裁定 / FR19 产出要求 / FR16 行为面 / FR17 #3#4 / FR20 #9 行为面；
  CLI 端）——新增 §2.15（角色注册五处 + 模式门 + 装配四处 + 新槽双源 + spawn 同门 + 勘察变体 + **写域=提示词纪律（无机械门，用户裁定）** + TUI 3 文件 6 处 + 文档登记 7 处【含 README】）·
  §2.16（四条行为纪律 + 锚断言口径）· §2.17（四个决策点）· §2.18（受影响文件 as-of）+ AC16–AC22 + T30–T37（历史 as-of 计数；后续轮次已扩充，见上）。
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
