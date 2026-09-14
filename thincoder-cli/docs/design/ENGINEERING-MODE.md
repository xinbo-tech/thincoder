# 工程模式（Engineering Mode）设计

> 板块：工程模式——thincoder 的严格方法论工作流：design-before-code、纪律层槽位提示词驱动、双门禁（设计评审 + 代码评审）。
> 本文档为**架构级机制文档**：功能性需求以机制目标与约束表述（架构级文档以约束替代用户故事——评审 2026-09-02 #1 措辞修正），非功能性需求与测试层完整。
> 提示词载体注（2026-09-10——PROMPT-SYSTEM 施工①③）：旧 engineering.md/engineering-sub.md 已退役——
> 工程纪律与逐字锚现驻 `src/prompts/discipline-engineering.md` + `persona-engineering.md`（双端各自实现——蓝图 §3.2 装配矩阵）。
> 依赖与权威关系：[AGENT-LOOP.md](AGENT-LOOP.md)（§8 工程交付协议概览、§10 子代理任务调度器、§12.1 advisor 评审对象锚——本文件机制经其 §17 权威源接管点注册）；[ADVISOR-CONVERGENCE.md](ADVISOR-CONVERGENCE.md)（评审收敛权威：design 评审 cap 豁免、code 评审 MAX_ADVISOR_ROUNDS=5、stale-context 保护）；[TESTING.md](TESTING.md) §1（测试分层 L0+/L1/L2 权威）。

> 需求层已迁出（2026-09-10 需求层拆分批）：铁律（§0）+ 总体需求/FR/NFR/裁定清单见 `../requirements/ENGINEERING-MODE.md`。

## 2. 设计（Design）

### 2.1 角色模型

> **落地核销完成（2026-09-11——角色重定义批）**：本表 = **三段链目标态**（第 2 批落地 CLI · 第 5 批镜像 VSC；本注即第 2 批 §2.15 的「落地时核销项（D7）」执行——同批核销）。裁定依据 = `../requirements/ENGINEERING-MODE.md` **§1.5**（写权矩阵见 #10；现行对账明细见 §2.28.2）。

| 角色 | 职责 | 机械约束 |
|---|---|---|
| **主 agent**（父代理·顶层，`role` 未定义） | **产品经理 + 流程编排者 + 批次档作者**：需求讨论/登记/收口 · 批次档 §1/§4/§6 · **核验设计稿（内容性）** · 提醒用户发起设计评审 · 委派 eng-designer（设计）/ eng-coder（实现）· 交付验证（L2 `test:full` 每链终态 1 次 + 可选父侧复核）· 链终核销 consume-design。**不写**需求档/设计档（写稿权归 eng-designer——§2.15 A2）、不写实现 | 拦截型：design token 前写产品代码被拒；提示词约束：不写实现、不发起评审、等批准、验收 |
| **eng-designer**（子代理，`role="eng-designer"`） | **写稿面唯一作者**：需求档 + 设计档（含修订）+ 批次档 §2；自勘察（限 explore，预算 ≤6/批）→ 并入需求 + 体系对账 → 判定句 → 写设计 → 自检交回（§2.15 A–F） | **无 token**（授权 = 需求已确认）；spawn 必传 `batchDoc`；内部 spawn 仅 explore（机械门）；不写实现/不改提示词/不发起评审 |
| **eng-coder**（子代理，`role="eng-coder"`） | 实现者：按设计实现 → **内部协议闭环**（explore 偏差审计 → 自修 → advisor 复评 → 收敛，≤5 修正轮；完整协议 = 本文件 §2.2 step 6）→ 交付（报告含审计/评审轮次 + 终态 clean/stalled；永不编辑设计文档） | 拦截型：spawn 需 token、写文件需 `_engDesignReviewed`；内部 spawn 仅 explore + 同步（机械门）；审计 ≤6 次（第 7 次机械拒绝 = stalled 信号） |

### 2.2 主流程（Mandatory Flow——10 步）

工程模式任务**不分大小**全走本流程——零裁量（逐字锚见 §2.9 锚#1）。普通需求点先按需求池规则登记攒批（锚#2——工程模式专用；机制见 `src/prompts/discipline-engineering.md` 需求池攒批工作流节），不越池提前启动设计。

1. 写设计档 `docs/design/`（三层：需求/设计/测试；按业务板块组织）——**本批起路由 eng-designer**（主 agent 出批次档 → spawn designer；写权见表 §2.15 A2）。任务涉及 UI 时设计文档必须收录与用户达成的每一条 UI/交互决策（布局/流程/控件行为/状态/反馈），未定部分标 open、绝不静默发明。
2. 父代理呈递设计摘要 + 提醒"设计就绪，可以评审"——**等待，不自行调 advisor**。
3. 用户发起设计评审：父代理调 `advisor(type="design", documents=[涉及文档清单], object={type,target,status,reason,exclude})`。
   - 有 🔴 → 呈递发现 + 逐项修复建议 → **用户逐条拍板** → 修改 → 再提醒 → 用户发起复审；持续拒绝（>3 轮）→ 停下向用户报告未决项，不静默循环。
   - 无 🔴 → advisor 回显 `[DESIGN-TOKEN:…]` + designId（同 scope 复审沿用同 id）→ designId+token 入槽（`_engDesignTokens` Map）。
4. 用户批准设计——显式 sign-off 才解锁实现；用户对设计内容/形态的选择只是需求确认，不是设计批准（锚#4）。
5. spawn `eng-coder`：`subagent(role="eng-coder", designId, designToken, batchDoc=<本批批次档>, task)`——designId 可选（单设计省略）；**`batchDoc` 必传**（§2.12 门禁——eng-designer 同门，§2.15 A）；
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
| **收敛上限** | 拦截 | code review 最多 5 轮（MAX_ADVISOR_ROUNDS——code-only）；design 评审不消耗轮次（cap 豁免）；eng-coder 非 LLM 自检不消耗轮次 | thincoder-core/advisor/run.mjs（CLI/VS 双端） |

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

  - 执行判据（主 agent）：**链中不疑 token**（多次 spawn/fix round 复用同一 token 是正常态，非 bug，
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
    > 地图——已有则更新不新建）② 读既有实现与先例 ③ 核测试面（既有用例/测试文件）④ 核多实现面
    > 镜像面（多端 / 多种语言 / 多个平台同源镜像）⑤ 广度勘察委派 explore 子代理（不重复已委派探索——主会话不重扫）。
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
   （`thincoder-core/agent-tools/subagent-spawn.mjs` 的 `_engTaskInput` 组装处——:340 `input` 组装 / :388 赋值——追加一行 `Batch record (batchDoc): <abs>`）——子代理因此"拿到本档路径"
   （需求 §1.11 铁律 #5"随件传递"的机械面）。第 1 批只传路径，**不附六段行为指令**（第 2 批）。
2. **无运行期路径字面**：`src/` 不硬编码 `docs/batches/`——批次档路径**永远是运行期输入**（`batchDoc` 参数），
   与 FR13（不假定用户项目布局）一致；`docs/batches/` 只存在于文档规范与用户项目自己的用法里。
3. **模板不进代码**：六段模板是文档规范（需求档 §1.12），代码不校验、不生成、不匹配措辞。

### 2.12 batchDoc spawn 门禁（FR20 #9 机械面）

**规则**：engineering 模式下 spawn `role="eng-coder"` **必须传 `batchDoc` 参数**（批次档路径）——**没传即拒绝**。
`eng-designer` 角色落地后（第 2 批）**同门适用**（需求 §1.12"designer/coder 都要求"——本批先行 eng-coder）。
explore / plan / coder（普通模式）**不适用**——行为零变更。

**判据（只到"参数在 + 路径可读"）**：`args.batchDoc` 为非空字符串，且 `resolve(cwd, batchDoc)` 存在且为文件
（路径语义与 `files` 同口径：cwd 相对或绝对均可，`\\` 归一为 `/`）。**不校验内容/措辞**——不做"已收口"正则、
不生成、不匹配模板（内容够不够由**执行者拒收**兜底——需求 §1.14 #9 行为面，提示词层第 2 批）。

**校验落点 = `buildSpawnChild`（token 门之前）**：async 与 sync 两条 spawn 路径都经过它——一处校验双路生效，
错误出口与 token 门一致。错误消息沿用现行风格（英文单行、破折号后给纠正动作）：
`batchDoc is required for role='eng-coder' — pass the batch record path (docs/batches/<batch>-<topic>.md); spawn refused without it.`
（路径不可读时后缀 ` (given path is not a readable file)`。）

**配套四点（含落点全路径）**：

- **schema**（`thincoder-core/agent-tools/subagent.mjs` 的 properties，designToken 邻域）：`batchDoc` string 描述含 "REQUIRED for eng-coder"——
  schema 保持 advisory（`required:[]` 不动，机械检查在 execute 链——现行注释口径不变）。
- **工具描述**：动作说明串加一句（batchDoc 必传 + 拒绝语义）。
- **审计受限变体**（`thincoder-core/agent/setup.mjs` 的 eng-coder 内部审计通道）：`delete props.batchDoc`——审计子代理不派生批次参数
  （与既有的 `delete props.async/id/n/designToken/designId` 同列）。
- **提示词最小同步**（门禁配套，非第 2 批规则）：`src/prompts/discipline-engineering.md`（spawn 样例行所在处）+ 中文权威
   `docs/design/prompts/discipline-engineering.md` 的 spawn 样例行补 `batchDoc=<路径>` + 一句“必传，没传即拒”——
  **机械门禁先行而样例不教，会每次撞墙**。

**落点全路径**（评审 #2）：「校验落点 = `buildSpawnChild`」指 **`thincoder-core/agent-tools/subagent-spawn.mjs`**（:237 导出；
调用点 `thincoder-core/agent-tools/subagent.mjs:260`，async 分支在 :294 之后——故两端均经此处）；
**不要**误放进 `thincoder-core/agent-tools/subagent.mjs`（那里只是 schema 所在处）。

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
| 测试落点 | 新文件 `test/batch-doc-gate.test.mjs` · 并入 design-token-settlement | **新文件** | 机制独立（batchDoc ≠ token）；token 测试已 245 行。构造手法同形于两档既有测试：`test/design-token-settlement.test.mjs`（隔离缝 + 最小 agent + assert.throws）与 **`test/subagent-id-counter.test.mjs:12`（VSC 仓；27 行同）**（直驱 `buildSpawnChild`——T27 成功路径断言靠它） |


### 2.14 受影响文件（第 1 批 as-of 快照——不得当契约引用）

| 文件 | 性质 | as-of 行数 | 预计增量 | 拆分评审 |
|---|---|---|---|---|
| thincoder-core/agent-tools/subagent.mjs | 修改 | 394 | ≤±12 | **>300 文件档**——本批不拆：单点增量（properties 一项 + 描述一句），不新增函数；若实施中发现单函数将超 300 行 → 停下报告，不静默扩 |
| thincoder-core/agent-tools/subagent-spawn.mjs | 修改 | 418 | ≤±25 | **>300 文件档**——本批不拆：门禁为 `buildSpawnChild` 内一段短判断 + 消息构造；不触发函数档但拆留待整体重构批 |
| thincoder-core/agent/setup.mjs | 修改 | 340 | ≤±2 | **>300 文件档**——本批不拆：单行 `delete props.batchDoc` |
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
| `thincoder-core/agent-tools/subagent.mjs:145`（schema enum） | 加 `"eng-designer"` |
| `:224` ROLES 白名单 + `:226` 错误文案 | 加角色 |
| `:124-129` 工具描述（角色矩阵 + Mode filtering 句） | 加 designer 行；模式句改“工程模式 = explore/plan/**eng-designer**/eng-coder” |
| `thincoder-core/agent/setup.mjs:187`（工程模式 enum）+ `:189` suffix | 加角色 |
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
  **提示词文件**：主 agent 内容权 + eng-coder 落笔（§1.5 #10 / §2.19 D1；起草分工 = §2.28.3），此处不重列（D4/D2）。

**调用形态（链路可执行性——评审 🔴）**：主 agent 在批次讨论收口后
`subagent(role="eng-designer", batchDoc=<本批批次档路径>, files=[...], task=<极简指针>)`——任务书本体 = 批次档 §2（B11）；
**`files` 声明照需求 §1.11 B3**（写明将要改的文档，**不声明 `docs/TODO.md`**——台账（记录 + 状态推进 + 物理落笔）归主 agent；子代理一律不声明台账档——2026-09-11 归属修订）；
designer 产出 = 设计档 + 回写批次档 §2；主 agent 核验（内容性核验 §1.5 #2）→ 提醒用户发起评审。
**为何必须成文**：只落角色不落调用，落地后没有任何提示词/设计句说明“谁写设计档、谁去派 designer”——
同档 §2.8 原句（父代理更新设计文档）与新角色直接冲突（同一机制两处不同描述）。

**FR9 裁定落地状态表（第 2 批 as-of——评审 #2；覆盖 #1–#9）**——逐条给“本批落 / 沿用现状 / 后续批”。**现行对账（#1–#12 + FR9——含 #10–#12 补充裁定）见 §2.28.2**：

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

**batchDoc 的模型面文案同步（评审 #9）**：`thincoder-core/agent-tools/subagent.mjs:149` schema 描述现写“REQUIRED for role='eng-coder'…
explore/plan/coder spawns ignore it”、`:128` 角色条目为 eng-coder 专属句——**同批扩为角色集合**（`eng-coder`/`eng-designer`），
并同步纪律层 spawn 样例行（含 `batchDoc=` 的 designer 例）——口径同 §2.12“提示词最小同步”（门禁先行而样例不教 = 每次撞墙）。

**越界错误文案参数化（评审 #13）**：`src/agent/spawn-child.mjs:47/:50` 与 `thincoder-core/agent-tools/subagent.mjs:237` 的“eng-coder”专属措辞
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

**模式门（对称补全）**：`thincoder-core/agent-tools/subagent.mjs:236-241` 现有两门（工程禁 coder / 非工程禁 eng-coder）→ **加第三门**：
**非工程模式 spawn eng-designer → throw**（它是工程模式专属角色，与 eng-coder 同族）。

**B. 提示词装配（四处——漏一处不报错，是静默回退陷阱）**

| 落点 | 改动 |
|---|---|
| `thincoder-core/prompt-overlays.mjs:22-32` SLOT_CONTENTS | 加 `loadSlot("persona-eng-designer.md")`（不登记 → `:77` 缺槽告警路径） |
| `:47-55` SCENARIO_SLOT_FILES | 加 `"eng-designer": ["persona-eng-designer.md", "common.md", "discipline-engineering.md"]`（不登记 → `:70-71` **静默返回 CONSULT_BASE 且零警告**） |
| `thincoder-core/agent/setup.mjs:295-301` 场景映射 | **外层谓词 + 内层选择器都要改（评审 #3）**：外层的 `(depth === 0 \|\| agent._role === "eng-coder")` 扩为工程角色集合；
**内层的 `agent._role === "eng-coder" ? "eng-coder" : "engineering"`（`:299`）必须同步映射 `eng-designer → "eng-designer"`**——
只改外层会让 designer 拿到 `assemblePrompt("engineering")`（= 主会话人格），正是本行要防的静默错配 |
| `thincoder-core/agent-tools/subagent-spawn.mjs:322-326` childConfig | `role === "eng-coder" → engineering:true` 扩为工程角色集合（designer 也必须 `engineering:true` 才能装配工程纪律槽） |

**C. 新槽文件（双源——体例照 `persona-eng-coder.md`：头注 `slot:[1] consumers:[...]` + 身份/授权/边界/产出/纪律）**

- `docs/design/prompts/persona-eng-designer.md`（**中文权威模板**，先定稿）
- `src/prompts/persona-eng-designer.md`（英文落地产物）

**内容要素**（逐项对应需求，不自由发挥）：身份=写稿面唯一作者 · 授权=需求已确认（**无 token**）· 边界=不写实现/不改提示词/不发起评审 ·
**需求档不经 advisor**（FR9 #5——用户确认即定稿）· **勘察预算 ≤6 次 explore/批**（FR9 #7，与审计预算独立）·
收到什么（批次档 §1 + 本批 todo 项 + 需求体系 + 清单）· **缺料就打回** · 五步（勘察 → 并入需求 + 体系对账 → 每条需求配判定句 → 写设计 → 自检交回停）·
**todo 侧职责（2026-09-11 归属修订）**：状态推进与物理落笔归主 agent；designer 只做需求档条文修订 + 收拢应用清单（提示词面同步 = 主 agent 内容权——登记项）·
失败路径 · **执行者拒收**（查不到任务书不执行）· 批次的写手边界（§2 自写）。

**FR19 产出要求——必含要素逐项列（评审 #5；需求档 :78 / §1.8）**：

1. **产出两件不混**：①本批批次任务（覆盖条目 / 不在本批 / 受影响文件 / 验收标准 → **批次档 §2**，不写进设计档）
   ②设计档——**8 项按 FR19 逐字对齐（评审 #4）**：**选型对比**（候选 ≥2 时对比表，单方案显式声明豁免）/ **接口契约** /
   **受影响文件带行数 + 拆分计划** / **决策记录**（含被否决备选）/ **验收标准逐条回指批次任务** / **用例表**（正常/边界/错误 + 输入/预期） /
   **边界**（不做什么）/ **UI·交互决策全落档**（未定标 `open`，绝不静默发明）。
2. **判定句**：每条需求配验收口径——执行面进提示词、判据面落需求档（供核对）。
3. **缺料/冲突的打回链**（需求说不通 / 现实与需求冲突 / 归属不明 → 打回主 agent，不自己编）。

**D. spawn 面：batchDoc 同门 + 勘察能力**

1. **batchDoc 门扩角色集**：`thincoder-core/agent-tools/subagent-spawn.mjs:251/254` 的 `role === "eng-coder"` 精确串 → 角色集合
   `NEEDS_BATCH_DOC = {eng-coder, eng-designer}`；错误文案相应参数化（带实际角色名）；注入行 `:366` 同步扩。
2. **勘察能力（§1.5 #7——设计者自己做勘察）**：新增 **designer 专属受限 subagent 变体**（explore-only）——
   镜像 `thincoder-core/agent/setup.mjs:224-257` 的 eng-coder 审计变体：`props.role = { enum: ["explore"] }` +
   `delete props.async/id/n/designToken/designId/batchDoc`；注入点同族（`thincoder-core/agent/setup.mjs:277` 的 depthOnly 链，`designer` 行加入该变体）。
3. **子代 spawn 门**：`src/agent/spawn-child.mjs:44-58` `gateEngCoderSpawn` 现只认父角色 eng-coder——**扩为父角色集合**
   （eng-coder / eng-designer）→ 两者都只允许 spawn `explore`；**审计预算（6）仍只计 eng-coder**（designer 勘察非审计；
   防滥用靠并发池 other≤4）。**返回值语义（评审 #4）**：designer 父路径校验通过后**必须返回 `null`**——
   `thincoder-core/agent-tools/subagent-spawn.mjs:374` 以 `engAuditAttempt !== null` 为审计任务书注入开关（`:376-393` 会追写“你在审计 eng-coder 交付”范围块）——
   非 null 会把审计范围误注进勘察任务书。
4. **变体实现口径（评审 #8）**：designer 变体 = **参数化复用**既有受限变体（父角色集合条件 + 描述文案分流），**不并列第二个 34 行 IIFE**——
   据此 `setup.mjs` 增量守住 ≤±20。
5. **受限变体描述面动作清单同步（第 20 批——2026-09-11；D3 枚举纪律适用）**：受限变体（eng-coder 审计 /
   eng-designer 勘察——参数化复用同一 IIFE）的动作拒绝清单**以机械门为唯一真值**（`thincoder-core/agent-tools/subagent.mjs`
   execute 内受限变体动作门，as-of :175-177——门文案列 `escalate/status/cancel/panel/consume-design/observe/send`；
   工具动作面文档 = `AGENT-LOOP.md` §7.2）。3 个文案面同清单同步（`thincoder-core/agent/setup.mjs` as-of :253 action 描述 ·
   :259 勘察描述 · :260 审计描述）；**已退役动作 `check` 不得残留**（删除记录见 `AGENT-LOOP.md` §7.5）。
   - 逐字草案（`thincoder-core/agent/setup.mjs:253`，action 描述）：`spawn only — the ${engChildRole}'s internal spawn channel is
     read-only (escalate/status/cancel/panel/consume-design/observe/send are refused: escalate spawns a
     coder+WRITE child, and the pool/panel actions have no async pool or panel mirror in a child context).`
   - 逐字草案（`thincoder-core/agent/setup.mjs:259` / `:260`）：串 `escalate/check/status are not available` →
     `escalate/status/cancel/panel/consume-design/observe/send are not available`（两处同串替换）。
   - **AC-A2-1**（机验）：`test/eng-designer-role.test.mjs` **T32b 扩断言**（该例双端 `prepareRun` 装配既有
     ——零新增装配调用，规避慢门）：designer / eng-coder 两处 description 各含上列 7 个动作名、不含
     `check`；触发机械门（受限内非 spawn 动作）的错误文案同含 7 名（同清单对照）。
   - 零改面（核对项）：`subagent.mjs` 基工具描述 / action 枚举、`spawn-child.mjs` 门语义、其余 setup 面；
     VSC 端独立实现（`thincoder-vscode/src/agent/setup.mjs` `delete props.action` + 自有文案）
     ——镜像评估归父侧（本批 CLI-only）。

**E. 写域边界（**提示词纪律——无机械门**，2026-09-10 用户裁定）**

设计者的写域 = `docs/`（扣 `docs/design/prompts/`）。**不新增机械门**（用户裁定“不需要机械门禁”）——
靠 **persona-eng-designer 明写写域** + **主 agent 内容性核验**（§1.5 #2）兼底。

- 事实前提（勘察实证）：现行 `dispatch.mjs` **无障碍拦 designer 写 `src/**`**（该文件的 `:172` 门只对 `agent._role === "eng-coder"` 生效、
  `:193` 门只对 depth 0 生效）——本批**有意不补门**：越界风险由提示词 + 核验承担（与“执行者拒收”同族纪律）。
- **不新增写域门 = 不改 `src/agent/dispatch.mjs`**（从受影响文件表移除该项）。
- **已知摩擦（评审 #7——用户 2026-09-10 裁定“接受”）**：designer 子代理**不**拿 `_engTaskAuthorized`（`thincoder-core/agent-tools/subagent-spawn.mjs:345` 仅给 eng-coder），
  故其每次写操作走 `dispatch.mjs:220` 的人工 ask；**用户裁定：接受**——授权弹窗可“全部授权/切自动”；
  设计**不为此加任务域豁免**（与“不需要机械门禁”口径一致）。用例固化该预期（T39）。

**F. 展示面（TUI——3 文件 / 6 处改点；评审 #8 修正计数口径）**：`src/tui/cmd-submodel.mjs:4` SUBMODEL_SLOTS（+ `:24/:90` 注释“4 role slots”→5）·
`src/tui/slash-commands.mjs:45`（描述串）+ `:147`（补全候选）· `src/tui/subagent-blocks.mjs:69` SUBAGENT_ROLES。
（`:29` 前缀正则已含连字符——无需改。）

**G. 文档登记面（7 处——含 `docs/README.md`，评审 #2）**：`docs/requirements/PROMPT-SYSTEM.md:39`（命名法角色行）· `:45-46`（文件计数）·
`:54-59`（人格层大纲加行）· `:195-207`（§3.2 装配矩阵加行）· `docs/design/AGENT-LOOP.md:177-184`（角色矩阵 + Mode filtering）·
`AGENTS.md:56`（槽位清单）· **`docs/README.md:12`（§1 目录行“requirements ← 主 agent·产品经理产物”）+ `:44`（§3.1 作者表：需求层作者行）**
——两处均改为 **eng-designer**（含过渡期注：eng-designer 未落地前由主 agent 代行——**该注已随落地核销**，落地面见 §2.28.4 RF-3），与 §2.15 A2 写权表口径一致。

### 2.16 行为纪律（第 2 批 B——提示词层，双源同步）

| 纪律 | 内容 | 落点 |
|---|---|---|
| **六段自写 · 一段一作者** | §1 主 agent / **§2 designer** / §3 评审子代理 / §4 主 agent / §5 coder / §6 父代理 | persona-eng-designer（§2 自写）+ persona-eng-coder（§5 自写）+ discipline-engineering（§3/§4/§6 归属；**§3 自写机制已落地**——`batch_segment` 第 4 批 CLI / 第 5 批 VSC，过渡期注已消） |
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
| thincoder-core/agent-tools/subagent.mjs | 修改 | 395 | ≤±10 | >300 档——**不拆**：四处枚举/描述单点增量，无新函数 |
| thincoder-core/agent-tools/subagent-spawn.mjs | 修改 | 444 | ≤±15 | >300 档——**不拆**：门判据扩集合 + 注入行扩；不新增函数 |
| src/agent/spawn-child.mjs | 修改 | 218 | ≤±12 | — |
| thincoder-core/agent/setup.mjs | 修改 | 343 | ≤±20 | >300 档——**不拆**：枚举/变体/场景映射/工具链四处单点 |
| thincoder-core/prompt-overlays.mjs | 修改 | 81 | ≤±4 | — |
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
| test/fixtures/doc-consistency-baseline.json | **新增** | — | +与存量同数 | V1/V2 **基线**（**必须保持为空**——非空即 FAIL；AC28 的判据源） |

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
| D7 | **变更留痕 + 核销同步** | 每批核销时跑**核销同步清单**（需求档 §1.12 批次档 §6 模板新槽位）——逐项检查：角色表 / 头部状态行 / 计数 / 指针 / 变更记录 / 待办勾销 / 台账可见面（收口行） | 模板槽位（父侧） |

**机械校验最小集（评审指出两轮反复栽的两类——可机判的才上机械）**：

| 校验 | 内容 | 落点 |
|---|---|---|
| V1 **段引用可解析** | 扫描 **`docs/design/` + `docs/requirements/` + `docs/batches/`** 里的 `§N` / `文档:节` 引用，目标节号存在（**排除 `_archive/`**——历史快照豁免，同 check-doc-width 现行口径） | **落点见 §2.21 二选一**（首选 `scripts/check-doc-width.mjs`——增量 ≤±19 守 300；超出则拆 `scripts/doc-consistency.mjs`）；**“定死此文件”口径已废**（轮次4 评审 #2——同机制不得两说） |
| V2 **计数与列表一致** | 匹配“**N 项/N 处/N 条**”声明，并在**同节（同一标题块）**内找对应陈述；其条数 ≠ 声明值 → 报。识别三形态：md 列表行 / 表格行 / 顿号·斜杠枚举（括号内计数） | **落点见 §2.21 二选一**（首选 `scripts/check-doc-width.mjs`——增量 ≤±19 守 300；超出则拆独立档——**未采用：实际落 = 留单档 + 拆分计划登记**）；`test/doc-consistency.test.mjs` 为用例面（轮次5 评审 #6：与 V1 同口径，同机制不得两说） |
| V5 **文档锚一致性** | 现行档内**事实锚**（用例号 / 文件路径 / 符号）的存在性判定（报告态 → 收紧阈值 0）——判据规格、射程边界与假阳排除见 **§2.32.3**（本节不重述——D2）；落点 = **独立档** `scripts/doc-anchors.mjs` + `test/doc-anchors.test.mjs`（`scripts/check-doc-width.mjs` 368 行——本批只导出共享豁免谓词） | 设计 = §2.32（DOC-CODE-RECONCILE 批——2026-09-12；需求 §1.20 / FR26） |

> 边界（不硬判）：V1/V2 只查**可机判的两类**；语义级一致性（“同一机制两处不同描述”）仍归**评审**（advisor 八维 **#7 Document ownership**——`src/prompts/advisor-design.md:9`）——
> 机械只管计数/指针，不管意思（否则误报湮没信号）。

**受影响**：`scripts/check-doc-width.mjs`（扩扫——现 51 行）+ **新增** `test/doc-consistency.test.mjs`（进快层 glob，随 `npm test` 生效）+
**新增基线** `test/fixtures/doc-consistency-baseline.json`（§2.18 已列）；
提示词层三句（D5/D6/D2）入锚家族（**AC22 ③ 项**）。

**基线清零 + 闸门收紧（2026-09-12 清零轮——用户「残留即先例」裁定）**：

- **本基线必须保持为空**——新增违规一律红，**不得再入基线**（**入基线 = 例外 = 违规**，fail-closed：`scripts/check-doc-width.mjs` 对非空基线直接 FAIL，`test/doc-consistency.test.mjs` T41 ①/⑤ 断言同钉）；「存量降报告」**不再是合法态**（存量＝破例先例源）；
- 历史存量已逐条处置清零（CLI **25** 条 · VSC **31** 条）：V1 规范形态化（`名称 §N`——去 `.md` 与路径前缀；自引同规）· V2 计数与列表同改（D3）· V3 工具前时代批次档由**判据射程**排除（见 §2.20.6）。


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
| `eng-designer` / `eng-coder` | spawn 时（第 1 批 `batchDoc` 门已保证「参数在 + 路径可读」）→ `child._batchDoc = batchDocAbs` | `thincoder-core/agent-tools/subagent-spawn.mjs`（复用第 1 批已有的 `batchDocAbs` 变量） |
| 设计评审 | advisor 工具**显式参数** `batchDoc`；门禁口径 = **“若传则须可读”（空/不可读 → throw）**——**不强制必传**（零回归，见 §2.20.8 不改 N5）；绑定 **按评审实例键**（`resolved.run.batchDoc`，与 `reviewType/round/designId` 同族）——**不用单值会话态** | `thincoder-core/agent-tools/advisor.mjs`（参数 + 门禁 + 实例键绑定） |

**并发隔离（评审 #7）**：绑定必须**按评审实例**（顾问池默认 4，仅同 scope 拒——`thincoder-core/agent-tools/advisor-async.mjs:20-22`/`:400`）；
若用单值会话态，后发起的另一批设计评审会覆盖前绑定，而正在跑的评审其工具执行读的是**当前** agent 状态（`thincoder-core/advisor/run.mjs:291`）
→ 发现表可能落进**别批的 §3**（项目对 token 已因同类问题废弃单值镜像——本档 `:87`）。**不变量：异批次并发必须各自正确落档，不得串档**。

**为何“参数在外、传递走实例键”**（而非把路径一路穿到 `runAdvisorReview`）：参数保留可拒可测（门禁在工具入口）；
传递走**评审实例键**（`resolved.run.batchDoc`）——因为要避开的只是 **`advisor-async.mjs` 的 500 行档位硬顶**（+行即越线）；
实例键属本产品**既有机制**（`_engTaskInput` / `_touchedFiles` / `_engDesignId` 同族），且 fail-closed（未绑定即不挂载）。
`run.mjs` 本就要改（`advisorToolsFor` 签名——§2.20.3），**不在避让范围内**。

#### 2.20.3 工具挂载（三方，只读面不扩）

| 调用方 | 挂载落点 | 路径来源 |
|---|---|---|
| **设计评审** | `thincoder-core/advisor/run.mjs:91-97` `advisorToolsFor(agent)` → `advisorToolsFor(agent, reviewType, batchDoc)`：**仅当 `reviewType === "design"` 且 batchDoc 已绑定（可读）时**追加 `batch_segment`；代码评审分支零变更（零 git、只读不变）；测试缝 `_advisorToolsFor` 保留 | 评审实例键（§2.20.2） |
| **eng-designer / eng-coder** | `thincoder-core/agent/setup.mjs:286-290` 挂载链：`eng-coder`（:286）/`eng-designer`（:287）两分支各追加 `batch_segment` | `agent._batchDoc`（spawn 时由 §2.20.2 绑定） |
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
- 评审层**三条提示词全覆盖（评审 #3；round 1 宿主已钉死——`thincoder-core/advisor.mjs:109-111` 无 prior 即 `ADVISOR_DESIGN`）**：`advisor-design.md`（round 1）+ **`advisor-round2.md` + `advisor-round3.md`**（round 2+ 的设计评审**不读** advisor-design.md——`thincoder-core/advisor.mjs:113-115`）——均指示评审者在报告之外**调工具把表与 VERDICT 写进批次档 §3**；
  **适用范围限定（轮次4 评审 #3）**：round2/round3 为**设计 + 代码评审共用**——该句必须限定「**仅设计评审、且工具已挂载时**」（代码评审只读、无此工具，否则每轮代码评审会被引导报假“§3 未写入”——AC31/§2.20.3）；
- **失败明示句**：「写不进去 → 报告里明说‘§× 未写入’；父侧代写**必须打标**」（不得静默、不得假装写过）。

#### 2.20.6 V3 机械校验（零假阳口径）

加入 `scripts/check-doc-width.mjs` 一致性扫描族：**仅当批次档「§4 或 §6 有实质内容」时**（机器判据；**不引用 §1 的“已收口”状态词**——它是讨论状态，与本守卫无关）；**“有实质内容”的定义（轮次5 评审 #1）**：该段内**除骨架行/斜体占位行外**存在非空行——即 `_（...）_` 形态占位、`### 批准（...）` 等模板骨架行**一律不算内容**（不定义则本批档在飞时即假阳——其 §4/§6 带占位行）；断言「§3 **含工具写入的轮次行**（`### 轮次 \d+（评审子代理）`——排除骨架行）」；
**落点按 §2.21 二选一**（首选 `check-doc-width.mjs` +≤19 守 300；超出则拆独立档——**未采用：实际落 = 留单档**）；**§2.19 V1 的“定死此文件”句已在本批同步废除**（轮次4 评审 #2——同机制不得两说）：
在飞批次（尚未评审）**不报**（避免每批都假阳）。反证用例：构造已批准但 §3 空 → 必报。
**判据射程（2026-09-12 清零轮收紧）**：V3 只判**工具落地后**（`V3_ERA_START` = 2026-09-11）创建的批次档——该日及之前的批次档 §3 无工具写入通道（父侧代写），属**结构性历史事实**而非违规；原「存量入基线」处置由**射程排除**取代（残留即先例——基线不得留任何合法态）。

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

**取舍记录（评审 #2）**：评审侧 `batchDoc` 定为**“若传则须可读”而非“必传”**——理由：`type="design"` 无工程模式门（`thincoder-core/agent-tools/advisor.mjs:85-115`；advisor 工具两侧模式均挂载 `thincoder-core/agent/setup.mjs:275`），
“必传”会改变**无批次档场景下的设计评审行为**（本仓 `docs/README.md:174` 即列三份“设计待评审”在途设计档）——与 **N5 零回归**冲突。
本设计**不扩大、也不收窄**既有评审路径：无批次档 → 工具不挂载，评审照常跑。

### 2.21 受影响文件（第 4 批 as-of 快照——不得当契约引用）

| 文件 | 性质 | as-of 行数 | 预计增量 | 拆分评审 |
|---|---|---|---|---|
| thincoder-core/agent-tools/batch-segment.mjs | **新增** | — | +140±40 | 新工具（工具定义 + 段定位 + 剥除 + append 写入） |
| thincoder-core/agent/setup.mjs | 修改 | 353 | ≤±12 | >300 档——**不拆**：挂载链（:286-290）两分支各加一项 |
| thincoder-core/agent-tools/subagent-spawn.mjs | 修改 | 449 | ≤±6 | >300 档——**不拆**：复用已有 `batchDocAbs` 设 `_batchDoc` |
| thincoder-core/agent-tools/advisor.mjs | 修改 | 213 | ≤±14 | 参数 + 门禁 + **评审实例键绑定** |
| thincoder-core/advisor/run.mjs | 修改 | 488 | **≤±10** | **>300 档 + 逼近 500 硬顶（488 + 上限 10 = 498）——若实施中越 500，停下报告并带拆分计划（不得静默越线）** |
| src/prompts/advisor-design.md | 修改 | 36 | ≤±8 | 纯 .md（round 1 评审者用工具写 §3） |
| docs/design/prompts/advisor-design.md | 修改 | 66 | ≤±8 | 纯 .md（双源） |
| src/prompts/advisor-round2.md | 修改 | 41 | ≤±6 | 纯 .md（**round 2 设计评审也须写 §3**——评审 #3） |
| docs/design/prompts/advisor-round2.md | 修改 | 57 | ≤±6 | 纯 .md（**双源**——AC35 grep 覆盖；评审 #2 补行） |
| src/prompts/advisor-round3.md | 修改 | 37 | ≤±6 | 纯 .md（round 3+ 同） |
| docs/design/prompts/advisor-round3.md | 修改 | 55 | ≤±6 | 纯 .md（**双源**） |
| thincoder-core/agent-tools.mjs | 修改 | 17 | ≤±2 | **barrel export（评审 #4）**——`thincoder-core/agent/setup.mjs:172` 从它解构工具符号；新工具必须加 export 行 |
| src/prompts/discipline-engineering.md | 修改 | 219 | ≤±10 | 纯 .md（六段自写→用工具 + 失败明示） |
| docs/design/prompts/discipline-engineering.md | 修改 | 147 | ≤±10 | 纯 .md（双源） |
| src/prompts/persona-eng-designer.md | 修改 | 56 | ≤±6 | 纯 .md（§2 自写→用工具） |
| docs/design/prompts/persona-eng-designer.md | 修改 | 53 | ≤±6 | 纯 .md（双源） |
| src/prompts/persona-eng-coder.md | 修改 | 35 | ≤±6 | 纯 .md（§5 自写→用工具） |
| docs/design/prompts/persona-eng-coder.md | 修改 | 35 | ≤±6 | 纯 .md（双源） |
| scripts/check-doc-width.mjs | 修改 | 281 | **≤±19** | **>300 档：增量收到 ≤19 以守住 300（评审 #9）**——V1/V2/V3 扫描若超出，拆到新文件（见下）；仍越线 → 停下报告 |
| （条件备选）`doc-consistency` 独立档——**未建** | **新增（条件）** | — | ≤±120 | **评审 #9 备选**：V1/V2/V3 扫描独立成文件（`check-doc-width.mjs` 只留宽度）——二者取一；**实际落 = 留单档（本备选未采用）** |
| test/batch-segment.test.mjs | **新增** | — | +150±40 | T43–T47 |
| test/doc-consistency.test.mjs | 修改 | 176 | ≤±30 | V3 用例 |
| docs/design/TOOLS.md | 修改 | 124 | ≤±8 | 工具系统权威源（登记新工具——轮次4 评审 #5 实测校正 79→124） |
| docs/design/AGENT-LOOP.md | 修改 | 721 | ≤±2 | **评审 #11**：`:283`「恒定六工具不含 git」对**设计评审**不再成立（代码评审仍成立）——一句话级修正 |
| docs/requirements/ENGINEERING-MODE.md | 修改（**eng-designer 落笔**——写权表 §2.15 A2 / D1） | 679 | ≤±8 | 4 项：§1.12 段表加「写入手段」列 · §1.11 B9 同步 batchDoc 参数 · §1.16 F1 注评审侧口径 · §1.16 N2 改“§3 段不在评审对象清单” · **§1.17 N3 计数口径改（“双源 15+15=30 档之宿主档”——轮次3 评审 #9）** |

> 行数为 2026-09-10 实测；**档位风险结论（评审 #9）**：`scripts/check-doc-width.mjs` 由“≤±45（上界 326 越 300）”改为
> **二选一**：①增量守住 300（V3 仅少许行）；②V1/V2/V3 拆入独立 `doc-consistency` 档（增量不限）。**实际落 = ①留单档**（拆分计划登记——≥400 必拆）。
> `thincoder-core/advisor/run.mjs` 488 + ≤±10 = 498 **逼近 500 硬顶**——若实施中越 500，停下报告并带拆分计划（不静默越）。

### 2.22 VSC 端镜像（第 5 批——FR23）

**目标**：把第 1/2/4 批机制落到 VSC 仓，使两端**同一套机制、各自实现**。终局判据 = **VSC 会话可 spawn eng-designer 并令其自写 §2/设计档**（需求 `requirements/ENGINEERING-MODE.md` FR23 行 / §1.17 总体目标——N4 是验收两层，非判据句，轮次2 评审 #14）。

#### 2.22.1 总原则：语义同源·原文自持（N1）

两端**各自实现、不共用代码**（VSC 自定纪律 `src/prompt-overlays.mjs:5`）；机制语义同源，**实现各写一份**；**单仓内 import 合法**——原禁令已随两仓合并退役（`TWO-REPO-MERGE.md` §2.4 R14）。
镜像 ≠ 抄实现：**抄的是契约与锚句**，适配的是落点（勘察已证 VSC 落点多处不同）。

#### 2.22.2 镜像锚（逐字源钉死——多实现面规则 §1.12）

**主 agent 人格面同批落地（轮次2 评审 #1 🔴）**：`src/prompts/persona-engineering.md（VSC 仓）:10-13` 实证仍写「You are the ARCHITECT… deliverables are: the requirements + design documents」——
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
| A8 | **`batch_segment` 工具描述文案**（段白名单枚举 / 无路径参数 / append-only / 来源戳 / 剥凭证 / 失败明示） | `thincoder-core/agent-tools/batch-segment.mjs`（描述字符串，196 行） | 新增同名档（**断言口径 = 跨仓同文件 grep**，非“双源两侧”——同 A9/A10 理由，轮次4 评审 #11） |
| A9 | **来源戳形态**（`### 轮次 N（评审子代理）`、N = §3 内该形态行计数 + 1、排骨架行） | `design/ENGINEERING-MODE.md` §2.20.1 | 同上（工具实现） |
| A10 | **V3 触发判据**（§4 或 §6 有实质内容；骨架/占位行不算） | `design/ENGINEERING-MODE.md` §2.20.6 | `scripts/check-doc-width.mjs`（V3） |
| A11 | **spawn 样例行带 `batchDoc=`**（**发现 #14**：门禁先行而样例不教 = 每次撞墙——轮次4 评审 #9 校正编号） | `src/prompts/discipline-engineering.md`（spawn 样例节） | 同 A1 宿主（**VSC:168-169 现无 `batchDoc=`**——本批补） |
| A12 | **主 agent 人格改述 + spawn eng-designer 调用链**（轮次2 评审 #1 🔴） | `src/prompts/persona-engineering.md`（身份段 + 调用链段；中文镜像同档） | **双源同名两档**（VSC 现仍是 ARCHITECT 旧身份——`:10-13` 实证） |

> **判据**：**文本类锚**（A1-A8、A11、A12）在 VSC 侧宿主文件（双源两侧）与 CLI 侧逐字相同（grep 断言；白名单枚举/参数名/状态词不得改写）；
> **A9/A10 为行为锚**（宿主是工具/脚本代码，无“双源两侧”可言——轮次2 评审 #8）：断言面改为行为用例（A9 → T59 来源戳 / A10 → T61 V3 零假阳），**不进 grep 集合**。
> A1 的宿主已从“CLI §1.12 抬头”（VSC 无该树）改为 **VSC `src/prompts/discipline-engineering.md` 新增六段节**（发现 #7：锚必须有落点才能断言）。

#### 2.22.3 batchDoc 门（F1——两处各落 + 共享校验）

| 决策点 | 候选 | 选定 | 否决理由 |
|---|---|---|---|
| 门落在哪 | A **两处各落 + 共享校验函数**（阻塞 `subagent.mjs` / 异步 `subagent-async.mjs` 各一个调用点，校验逻辑单份） · B 先造共享 spawn 等价点 | **A** | VSC **无** CLI 的双路装配单点（勘察实证）；B 是结构性重构（动阻塞/异步两条链的公共骨架）= 风险超出镜像范围；A 校验逻辑仍单份（语义不会漂） |

- **共享校验函数落点**：`thincoder-core/agent-tools/batch-segment.mjs`（`resolveBatchDocPath`——原拟 `subagent-spawn-gate` 落点未采用）；签名 `resolveBatchDocPath(cwd, given)`：空/解析失败/非文件 → throw（消息明示）。
- **角色域（发现 #3——必须写死，否则违 N2 零回归）**：门**只对 `NEEDS_BATCH_DOC = { eng-coder, eng-designer }` 生效**——其余角色（explore / plan / coder）**零变更**（不带 batchDoc 照常 spawn）。
  AC37/T55 的“两路拒”**仅指这两个角色**；反面例（explore 不带 batchDoc 不得被拒）入 T55b。
- **参数面（发现 #3）**：spawn schema 需新增 `batchDoc` 属性（否则参数无处传入）；受限变体（审计/勘察子代理）的 `delete props` 清单**同步加 `batchDoc`**（不得透传给子代）。
- **注入**：通过校验后子代理携带 `child._batchDoc = <abs>`（与 CLI 第 4 批同形态）——`batch_segment` 取用；
  **child 任务文本行是否同形（轮次2 评审 #12）**：**镜像**（CLI 第 1 批形态 = “Batch record (batchDoc): <abs>”行）；**无变体退路**（轮次4 评审 #3：T54 无条件断言 + 批次档要求 T54–T66 全绿，退路不可行使）；实施中若无法同形，**停下报告**，不得自行降为仅绑定形态。

#### 2.22.4 eng-designer 角色（F2——**八处落地**；发现 #1/#4）

> **发现 #1 的教训**：枚举/装配层落完**不等于角色能 spawn**——VSC 运行期有 fail-closed 白名单与三道门，必须逐点落。

| 处 | 落点（as-of） | 内容 |
|---|---|---|
| ① **运行期白名单** | `thincoder-core/agent-tools/subagent.mjs:254-256`（`const ROLES = new Set([...])`） | 加入 `"eng-designer"`，**并改写错误文案的角色列举**（现列 4 个角色——漏改则报错信息说谎） |
| ② **模式门（第三门）** | `thincoder-core/agent-tools/subagent.mjs:267-272`（现只有 coder↔eng-coder 互斥两门） | 加：`eng-designer` 仅在工程模式可用（非工程模式 → 拒，文案同族） |
| ③ **子代 spawn 门** | `thincoder-core/agent-tools/subagent-async.mjs:47`（现 `parent._role !== "eng-coder"` 即 null 放行） | 父角色集合扩入 `eng-designer`（designer 的勘察子代 = explore-only） |
| ④ **装配分支** | `thincoder-core/agent/setup.mjs:151-160`（449 行） | 增 `eng-designer` 分支：读/搜/写设计产出 + `batch_segment` + **勘察通道工具（explore-only 受限 subagent 变体——镜像 CLI §2.15 D3 的受限变体与注册）**；**不含 advisor**（轮次3 评审 #5） |
| ⑤ **角色 enum** | `thincoder-core/agent-tools/subagent.mjs:56-74`（`modeRoleField`） | 工程模式 enum 由 `[explore, plan, eng-coder]` → 含 `eng-designer` |
| ⑥ **场景表** | `thincoder-core/prompt-overlays.mjs`（82 行） | 补 `"persona-eng-designer.md": loadSlot(...)` 与 `"eng-designer": [...]` 两行（CLI:26/CLI:52 同形——**全文逐行同构，最干净的可照抄点**） |
| ⑦ **webview 枚举** | `webview/activity-view.js:13`（VSC 仓）（157）· `webview/activity.js:37`（VSC 仓）（205）· `webview/settings-agent.js`（VSC 仓）（175）· `webview/settings-models.js`（VSC 仓）（215） | 四处角色枚举/regex 补 `eng-designer` |
| ⑧ **人格文件** | `src/prompts/persona-eng-designer.md`（**新增**） | 逐字源 = CLI 同名文件（56 行）；锚句 A3 |

**⑨ 勘察通道（发现 #4——CLI §2.15 D2/D3 的镜像，**必搬**）**：designer 的勘察能力 = **explore-only 受限子代理变体**（schema 只暴露 explore + 描述分流）；
否则逐字拷来的人格文本（CLI `src/prompts/persona-eng-designer.md:24`「勘察预算 ≤6 explore spawns per batch」）**指向不存在的能力**（CLI 侧动机 = FR9 #7「勘察归 designer 自己做」）。
**无“不搬”选项**（轮次3 评审 #1——原退路句已删）：实施中若遇阻，停下报告（同档位停线体例），不得以“记取舍 + 同步人格文本”代替能力交付。

#### 2.22.5 batch_segment 移植（F4——工具本体 + 两个适配点）

- **工具本体**：新增 `thincoder-vscode/src/agent-tools/batch-segment.mjs`（契约同 §2.20.1：无路径参数 / 段白名单按身份 / append-only / 来源戳仅 §3 / 剥证自有正则 / fail-closed 六条）——**无依赖冲突，可逐步移植**。
- **适配点 ①（工具集落点）**：VSC 的 `advisorToolsFor` 在 **`src/advisor/tools.mjs:26`（VSC 仓；单参，49 行）**而非 `run.mjs`——签名改 `(agent, reviewType, batchDoc)`，**仅当 `reviewType === "design"` 且 batchDoc 已绑定**时追加工具；测试缝 `_resolvedAdvisorToolsFor` 保留语义。
- **适配点 ②（实例键通道）**：VSC 的 `runAdvisorReview`（`thincoder-core/advisor/run.mjs:346`，459 行）比 CLI 多一个 `rv` 实例参数——`batchDoc` 沿 **`rv.batchDoc`** 传递（与 `rv.round`/`rv.priorOutput` 同族），**不用单值会话态**（与 §2.20.2 同口径）。
- **挂载**：`thincoder-vscode/src/agent-tools/index.mjs`（16 行）barrel export；`thincoder-vscode/src/agent-tools.mjs`（2 行）为 `export * from` 不需改。

#### 2.22.6 文档纪律与 V1/V2/V3（F5——含「接线」这一半）

| 决策点 | 候选 | 选定 | 理由 |
|---|---|---|---|
| 扫描域 | A **含三个目录，缺失即跳过** · B 镜像时把 VSC docs 树建齐 | **A** | VSC 无 `docs/requirements//docs/batches/`；批次档**仍落 CLI 仓**（单一归属）；建空树 = 造无用目录；现有 CLI 实现已有跳过语义 |

- VSC `scripts/check-doc-width.mjs`（51 行，现**仅宽度、无导出、无 CLI 模式、未接自动化**）→ 扩为一致性扫描（V1 段引用 / V2 计数与列表 / V3 批次档 §3）+ 基线读写 + 导出；
  增量上限**对齐 CLI 同机制实测**：CLI 同档现 **298 行**（宽检+V1/V2+V3 全量；§2.21 记 as-of 281 + ≤19 守 300）——本批上限 **≤+247（→298，≤300）**（轮次4 评审 #1：原“≤+250”算术越线 301，已废），
  **保留 CLI 退路条款：若超 300 即拆 `scripts/doc-consistency.mjs`（二选一，不得都做也不得都不做）**；原“+≤120/距 300 尚远”估算与 CLI 实测差约百行，已废（轮次2 评审 #5）。
- **V3 扫描根与跨仓边界（发现 #6——不得空转）**：
  VSC 的 V3 默认扫**本仓** `docs/batches/`——该目录不存在 → **跳过不报**（现状）；
  **但批次档的单一归属是 CLI 仓**（决策 A），**真实守门在 CLI 侧的 V3**（已落地，第 4 批）；
  VSC 侧 V3 的价值 = 结构对等 + 测试面 + 未来 VSC 自建批次档时可用；**若将来需要扫 CLI 仓批次档，以显式参数传入扫描根**（不得硬编码跨仓相对路径）。
- **接线是硬项**（N3）：接线落点**钉死 `test/files.mjs`（VSC 仓） 入册**（**`package.json` 不入本批受影响文件与两个实现面文件域**——轮次2 评审 #4；**5 个新 test 档全部入册**，基线 fixture 不入；`test/files.mjs`（VSC 仓） 增量按入册条数上调）——
  VSC 快层目标 = 显式清单 `test/files.mjs`（VSC 仓）（41 行，**28 条清单项**；`test/` 下 **27 个 `.test.mjs`**——两数口径不同，发现 #11）——否则“有校验器但不跑” = 机制没活。

#### 2.22.7 提示词双源（F6——用户在裁：双源）

- **VSC 现状单源**：`src/prompts/` 14 文件，`docs/design/prompts/` **不存在**；VSC 自己的 `docs/design/README.md:30` 写明“机制权威 = CLI 仓”。
- **本批建 `docs/design/prompts/` 15 文件**（中文权威）——初始内容 **逐字自 CLI `docs/design/prompts/` 拷贝**（现有 15 档）。
- **端特有段处置（发现 #8——不得静默）**：CLI 纪律明文「**端特有段各端保留**」（CLI `src/prompts/discipline-engineering.md:91` / `:205`：VSC R14 池规则段“原地保留于 VSC、CLI 不引入”），
  而 VSC `src/prompts/discipline-engineering.md:202-205` 确有该段——故“逐字拷 CLI 中文档”后，**VSC 的中文权威镜像不含其英文源里的端特有段**。
  本批定：**端特有段一并进 VSC 中文镜像**（以 VSC `src/prompts` 为准适配写入），**逐项登记在镜像差异表**（文件 + 段 + 来源；**差异表宿主 = `README（VSC 仓）` 新增节**——轮次2 评审 #13），并让 AC43 的双源断言**覆盖端特有段存在性**（非仅锚句）。
- **跨仓节引用处置（轮次2 评审 #9）**：CLI 中文档含 CLI 侧文档节引用（实证 `docs/design/prompts/discipline-engineering.md:81`「需求档 §1.12」/`:91`「§2.20」/`:138`「docs/README.md 文档规范 §2.7」），VSC 无对应档；
  **逐字拷入后按“路径/UI 引用处”豁免**：能对上目标仓对应节的改写、对不上的改注“（CLI 侧）”，**逐项入镜像差异表**。
  **V1 判据（轮次3 评审 #7——必须写死，否则自创规则）**：V1 扫含**“（CLI 侧）”注记的行/引用时豁免**（不报、不入基线）；无注记且目标节不存在的引用 → 正常报（一律阻断——不得再入基线；F14 同条）。该规则入 **T63** 用例。
  **差异登记（轮次4 评审 #13）**：本豁免为 **VSC 侧独有语义**（CLI 侧 V1 不变）——逐项入**镜像差异表**（宿主 `README（VSC 仓）` 新增节），以免被当成 N1“语义同源”的反例。
- **VSC `src/prompts/` 14 → 15**（新增 `persona-eng-designer.md`）；**锚句宿主档定点改写**（A1/A2/A4/A6/A7/A11/A12 所在档），**其余档不动**（轮次2 评审 #10——不做“余 14 档都改”的宽表述）——**不得拿 CLI 的 src/prompts 整体覆盖**（VSC 自持原文，整体覆盖会回退 VSC 特有内容）。
- `README（VSC 仓）:30` 的“机制权威 = CLI 仓”句随之改写（登记项；发现 #12 注仓前缀）。

#### 2.22.8 实现面拆分（选型 3）

| 面 | 文件域（**与 §2.23 两表一致**） | 内容 |
|---|---|---|
| **① 代码面** | `src/**`（除 `src/prompts/**`）· `scripts/**` · `test/**`（除 `test/prompts-mirror-anchors.test.mjs`（VSC 仓）） | 门/角色/工具/装配/枚举/V1-V3 + 四个新用例档（含基线 fixture） |
| **② 提示词双源面** | `src/prompts/**` · `docs/design/prompts/**` · `docs/design/README.md（VSC 仓）` · `test/prompts-mirror-anchors.test.mjs`（VSC 仓） | 15 拷贝 + **锚句宿主 6 档定点改** + 1 新建 + 锚句断言测试（轮次4 评审 #4/#5） |

**文件域不相交** → 两个 eng-coder **并行**（`files` 声明交调度器）；**锚句断言测试归面 ②**（它拥有那些文件），面 ① 的测试只测代码行为——避免跨面依赖。

#### 2.22.9 不变量

1. **代码评审纯只读不削弱**（零 git + 只读工具集；`batch_segment` 仅设计评审附加）。
2. **凭证绝不落档**（工具级剥除，VSC 侧同口径）。
3. **语义同源·原文自持**（**文本类锚 A1-A8/A11/A12** 逐字一致；**A9/A10 为行为锚**，由 T59/T61 行为用例承载——轮次3 评审 #3；原 import 禁令随两仓合并退役——`TWO-REPO-MERGE.md` §2.4 R14）。
4. **零回归**（VSC 现有清单 28 条 / 27 个 `.test.mjs` + 冒烟集不变红）。
5. **验收不拿静态存在冒充生效**（N4：必须重载扩展后实跑）。
6. **角色可 spawn**（发现 #1）：断言下沉到运行期门——白名单/模式门/子代门全部通过才算落地。

### 2.23 受影响文件（第 5 批 as-of——VSC 仓实测，不得当契约引用）

**代码面**（`thincoder-vscode`）

| 文件 | 性质 | as-of | 增量上限 |
|---|---|---|---|
| thincoder-vscode/src/agent-tools/batch-segment.mjs | **新增** | — | +≤200（CLI 同名档 196 行） |
| thincoder-vscode/src/agent-tools/batch-segment.mjs（原拟 `subagent-spawn-gate`） | 修改 | 169 | +≤15（共享校验 `resolveBatchDocPath`） |
| thincoder-core/agent-tools/subagent.mjs | 修改 | 358 | +≤22（白名单/模式门/enum + **阻塞路 batchDoc 门调用点**〔轮次4 评审 #2〕）——**>300 档：不拆**（单点枚举与单点校验调用，无结构增长）；**函数档：无 ≥300 行单函数**（as-of） |
| thincoder-core/agent-tools/subagent-async.mjs | 修改 | 489 | **+≤10（→499，越 500 停下报告）**——含**异步路 batchDoc 门调用点**〔轮次4 评审 #2〕；>300 档：不拆；**函数档：无 ≥300 行单函数**（as-of） |
| thincoder-core/agent-tools/advisor.mjs | 修改 | 296 | +≤14（`batchDoc` 参数）——**跨 300：不拆**（单点参数新增，无结构增长；拆分留给专项债）；**函数档：无 ≥300 行单函数**（as-of） |
| thincoder-core/agent-tools/advisor-async.mjs | 修改 | 457 | +≤10（`rv.batchDoc` 实例字段）——>300 档：不拆（同因）；**函数档：无 ≥300 行单函数**（as-of） |
| src/advisor/tools.mjs（VSC 仓） | 修改 | 49 | +≤10（三参签名 + 注入） |
| thincoder-core/advisor/run.mjs | 修改 | 459 | +≤10（调用点 / rv 透传）——>300 档：不拆；**函数档：无 ≥300 行单函数**（as-of） |
| thincoder-core/agent/setup.mjs | 修改 | 449 | +≤24（eng-designer 分支 + 勘察变体）——>300 档：不拆；**函数档：无 ≥300 行单函数**（as-of） |
| src/agent-tools/index.mjs | 修改 | 16 | +≤2（barrel） |
| thincoder-core/prompt-overlays.mjs | 修改 | 82 | +≤4（两行 eng-designer 条目） |
| scripts/check-doc-width.mjs | 修改 | 51 | **+≤247（→298，对齐 CLI 同机制实测 298 行；≤300）；若超 300 即拆独立档（二选一——实际落 = 留单档 + 拆分计划登记）** |
| webview/activity-view.js（VSC 仓） | 修改 | 157 | +≤2（FAMILY_ROLES） |
| webview/activity.js（VSC 仓） | 修改 | 205 | +≤2（角色 regex） |
| webview/settings-agent.js（VSC 仓） | 修改 | 175 | +≤2 |
| webview/settings-models.js（VSC 仓） | 修改 | 215 | +≤2 |
| test/files.mjs（VSC 仓） | 修改 | 41 | +≤8（**5 个新 test 档**全部入册；基线 fixture 不入——轮次3 评审 #13） |
| test/batch-segment.test.mjs | **新增** | — | +200 |
| test/batch-doc-gate.test.mjs | **新增** | — | +150 |
| test/eng-designer-role.test.mjs | **新增** | — | +180（含运行期门三例） |
| test/doc-consistency.test.mjs | **新增** | — | +180（V1/V2/V3 + 接线） |
| test/fixtures/doc-consistency-baseline.json | **新增** | — | 基线 |
| docs/design/README.md（VSC 仓） | 修改（**归面②**——轮次4 评审 #4） | — | +≤20（“机制权威”句改写 + **镜像差异表新增节**——轮次3 评审 #12；行前缀已标明仓） |

**提示词双源面**

| 文件 | 性质 | as-of | 说明 |
|---|---|---|---|
| src/prompts/persona-eng-designer.md | **新增** | — | 逐字源 = CLI 同名档（56 行） |
| src/prompts/advisor-design.md · advisor-round2.md · advisor-round3.md | 修改 | 36 / 41 / 37 | 锚句 A5/A6 定点改 |
| src/prompts/discipline-engineering.md | 修改 | 206 | 锚句 **A1/A2/A4/A6/A7/A11** 定点改 + **新增六段节**（A1/A2 宿主） |
| src/prompts/persona-eng-coder.md | 修改 | 43 | 锚句 A3 |
| src/prompts/persona-engineering.md | 修改 | 71 | 锚句 **A12**（身份段改述 + spawn eng-designer 调用链——轮次2 评审 #1 🔴） |
| docs/design/prompts/persona-engineering.md | 修改 | — | 中文镜像同步（A12 中文版） |
| docs/design/prompts/*.md（VSC 仓） | **新增 15** | — | 逐字自 CLI `docs/design/prompts/` 拷贝 + **端特有段适配**（§2.22.7） + **跨仓节引用改写**（轮次2 评审 #9） |
| test/prompts-mirror-anchors.test.mjs（VSC 仓） | **新增** | — | +≤120（锚句 A1-A8/A11/A12 双源断言 + 端特有段存在性；面 ②） |

> 行数为 2026-09-10 实测（VSC 仓）；**唯一逼近硬顶**：`subagent-async.mjs` 489 + ≤10 = 499——越 500 停下报告并带拆分计划。

### 2.24 需求池指针台账（第 8 批——FR18 载体面）

#### 2.24.1 机制目标与范围

FR18 的诉求：**一眼看出"哪条需求落地了没有"**，无需遍历文档。现状的病不是"条目少"而是
**条目与任务书脱钩**——没有指针，条目只是备忘；有指针，点开即见任务书 §2 与验收结论。

本批做四件事：①两仓 `docs/TODO.md` 按**严格指针格式**收拢 ②**两池重分组 + 计数修正**（D3）
③技术待办补定 **(b) 指针 + 最小证据行** ④新增**台账机检**（本仓脚本，不进产品提示词）。

**范围边界**：本批只动**台账档 + 需求档 §1.13 + 提示词锚句 + 检查器**。不实现新的产品功能，
不动 `src/agent/**`、`src/advisor/**`，不扩宽度扫描域。

#### 2.24.2 条目契约（本批只落增量——形态本体见需求档 §1.13）

**两种锚形态（需求池 / 技术待办）与铁律「不展开任务细节」= 需求档 §1.13 既定**——本节**不重述**
（D2 单一权威源），只落**本批新增量**两条：

- **「一行一条」升级为硬约束**（原为软口径）：**需求池组**条目正文**不得超过 1 行**，续行即违规——机检 L3① 判。
  依据：台账的可用性全在"一行一条"，多行即回退成长条垃圾场（§1.13 铁律的可机判化）。
  **适用范围（钉死——修正轮对齐）**：本硬约束的**机检面 = 需求池组**；技术组条目的机判面是**锚形态**
  （指针 + `file:line` 证据行——L3②③），**不判行数/长度**（长度与症状措辞属语义面，"不得靠自然语言理解"机判——
  §2.24.6 末段分界）。两池共用同一**铁律**（不展开任务细节），可机判的只有需求池侧的行数与技术侧的锚形态。
- **技术待办 (b) 形态纳入机检**：文本权威 = 需求档 §1.13；本批只把「证据行」钉成可判形态
  （`file:line` 正则——L3②），症状 / 归属语义留给评审（§2.24.6 末段分界）。

#### 2.24.3 状态机（六态——本节只记修正，表本体见需求档 §1.13）

**状态机表本体（6 行）= 需求档 §1.13**——本节不重述（D2），只记**本批的修正动作**：

- 原 FR18 行写「五态」而 §1.13 表列 **6 行**（自伤：计数与列表不一致）→ 本批**计数与列表同改**（D3）：
  FR18 行改为「六态」，表保持 6 行；本批**不新增态**。
- 各态对任务书指针的要求（必填 / 可挂 / 保留）随表住需求档 §1.13；本档 §3.1 AC45 只取其中
  「在途 / 待核销 = 必填」一条做断言，其余态**只判单行形态**——机判面与需求文本对齐，不另立口径。
- **归档两态（2026-09-11 追加裁定）**：已核销 / 已废弃 = **归档态**——勾销后移出活文件（同仓 `docs/TODO-archive.md`）；
  活文件不判其入口形态（活文件零 `- [x]`——L3⑤）；表本体与去向以需求档 §1.13 为准（细则 §2.24.9①）。

#### 2.24.4 两池分组与计数

- **两池不混**：需求池收**用户需求点**；技术待办另组分列。**分组是归属判定**——错组 = 后续状态推进认错对象。
- **组计数口径（钉死——机检 L2 与验收共用同一口径；2026-09-11 改为未决口径）**：**组** = 行首 `##` 级标题（H1 档标题不计入）；
  **条目** = 行首顶格 `- [ ]`（未决——`- [x]` 只存于归档档、活文件零命中：L3⑤）。组标题声明的「N 条」必须等于组内**未决**实条目数（D3）。
- **归档（2026-09-11 追加裁定——替代原「就地 `[x]` 保留、计入组计数」）**：`status=已核销` / `已废弃` 的条目
  **勾销（锚行 `- [x]`）后整体移入同仓 `docs/TODO-archive.md`**（与 `checklist-done.md` 同口径）；条目连同其冻结指针入归档档，
  **活文件只留未决**；活组计数 = 未决数。细则（命名 / 形态 / 机检 / VSC 对位）= §2.24.9。
- **数字口径**：本节 / §2.25 / 变更记录里的散文字数一律为 **as-of 实测**，不构成契约；
  **验收以检查器（`check-ledger.mjs`）重算值为准**（散文数字不作判据）。

#### 2.24.5 提示词锚（逐字——eng-coder 照抄，不得自行解释）

两条锚句**逐字如下**，4 个落点文件**同文**（中文；宿主节本就中英混排，锚句**不翻译、不改写**）：

**锚 L-A**（宿主 = 双端 `discipline-engineering.md`「需求池攒批工作流」节末）:

> 需求池与技术待办同一铁律（指针化、不展开任务细节），但锚的形态不同：需求池挂需求档节 + 任务书 §2；技术待办挂归属档节 + 最小证据行（file:line + 症状）。

**锚 L-B**（同上宿主，紧随 L-A）：

> 台账条目一行一条，续行即违规；组标题声明的条数必须等于组内实条目数。

**落点清单（双端 × 双源 = 4 文件；4 个文件均入 eng-coder `files`）**：

| 端 | 产品提示词 | 中文权威镜像 |
|---|---|---|
| CLI | `src/prompts/discipline-engineering.md`（「需求池攒批工作流」节末，as-of `:170`–`:176`） | `docs/design/prompts/discipline-engineering.md` 同名节末 |
| VSC | `src/prompts/discipline-engineering.md（VSC 仓）`（同名节末，as-of `:171`–`:177`） | `docs/design/prompts/discipline-engineering.md（VSC 仓）` 同名节末 |

**镜像纪律**（§1.12 / §2.22.1 沿用，本批不重选）：**锚句逐字 · 节内其余各端原文自持**——
4 文件内 L-A / L-B **逐字相同**（中文）；该节其余文本各端以本端原文为准，**不设 byte-identical 依赖**
（硬一致形成乒乓互追，已废）。差异如实上报。

#### 2.24.6 台账机检契约（FR18 #6）

**检查什么**（三项，逐项独立可判）：

| 号 | 检查 | 判据 |
|---|---|---|
| **L1** | **指针可解析** | 条目内引用的 `<档>.md §X` 须过三条子判据（**①归一 ②basename 唯一 ③可解析**——逐条见下表后「L1 子判据」） |
| **L2** | **计数一致（D3）** | 组标题声明的"（N 条）" == 组内**未决**实条目数（口径见 §2.24.4——2026-09-11 修订） |
| **L3** | **形态合规（只判形态）** | ①需求池组条目均为**单行**（无续行细节）②技术**组**条目含 `file:line` 的**正则形态**③条目锚形态与**所在组标题**结构一致（需求池组 = 需求档节 + 任务书；技术组 = 归属档节 + 证据行）④**`status=` 取值落在六态内**（活文件实为未决四态——§2.24.9①）⑤**活文件 `- [x]` 零命中**（归档口径——§2.24.9①）⑥**技术条目 `触发=` 取值合法**（三枚举——§2.24.9②；无触发 = 审计面非红） |

**L1 子判据**（三条，任一不过即 L1 红）：

1. **归一**：`§X` ↔ 标题编号 `X` 视为同一节——标题 `### 1.13 需求池（产品机制）` 与指针 `§1.13` 同指（标题不含 `§` 字样，字面比对必假阳）。
2. **basename 唯一**：只写 basename 时仓内同名档必须唯一；多义（`docs/requirements/ENGINEERING-MODE.md` vs `docs/design/ENGINEERING-MODE.md`）**必须带目录前缀**。
3. **可解析**：档存在 **且** 归一后编号可在该档标题（`#`/`##`/`###` 各级 + 编号）里找到。

**L3 的豁免与分组识别（修正轮裁决 #3 / #5——零假阳所需，与需求档 §1.15 NFR 对齐）**：

- **`—` / 非必填态豁免**：§1.13 允许 待讨论 写 `—`、待设计「可挂」、技术项无归属档写 `—`——
  该类槽位**只判单行形态**（L3①），**不判** ③ 的锚齐备（与 AC45 同口径；否则假阳 → T67 红）。
- **分组识别（钉死结构依据）**：`##` 组标题**含 `需求池` → 需求池组**；**含 `技术` → 技术组**；
  **两标记都不含的 `##` 组不判 L3③**（仍受 L2 计数与 L3① 约束）。两仓台账的组标题据此统一（收拢动作的一部分）。
- **status 枚举豁免**：非必填态槽位写 `—`、**无 `status=` 场**的条目豁免 L3④；
  台账内机外取值（如 `登记` / `登记待裁` / `根因已定位待设计`）**不再入基线**——违规照报（阈值 = 0；F14 同条），
  并在**收拢时就近归一**（`登记` / `登记待裁` → 待讨论；`根因已定位待设计` → 待设计）。
- **归档态与触发字段豁免（2026-09-11）**：已核销 / 已废弃条目不在活文件（归档档——L3⑤ 排除，不另判 L3④）；
  需求池组无 `触发=` 场（触发 = 技术条目专属）；技术组**无触发** → 审计「待处置」（非 L3⑥）；`触发=` 写而取值非三枚举 → **L3⑥ 红**。

**机判与评审的分界**：症状措辞是否属实、条目归属是否真是技术项、指针指得对不对——**一律不机判**
（需求档 §1.15 NFR：「不得靠自然语言理解」）。上表三项**只判可判的形态**；语义面留评审。

**输入 / 输出 / 失败信息形态**：

- **输入**：仓根路径 + 目标台账档清单（默认两仓 `docs/TODO.md`）。
- **输出（绿）**：`OK: <档>` 一行 + 退出码 0。
- **输出（红）**：每违规一行，形态 = `<档>:<行号> [L1|L2|L3] <症状> — 期望 <…> · 实得 <…>`；
  末尾汇总 `<n> 处违规`；退出码 **1**。
- **退出码**：**0 = 全绿 / 1 = 有红**（fail-closed；异常退出不得伪装成绿）。
- **审计模式（新增——2026-09-11）**：`node scripts/check-ledger.mjs --audit`——输出「**待处置清单**」（技术组全部无触发条目；
  行龄超 N 天者标「老化」，N 默认 30）；**退出码 0、运行前后文件字节不变**（报告只读——处置要人判）。

**扫描域**：**仅两仓 `docs/TODO.md`**（显式清单，不做目录递归发现）。
**明确不含**：`docs/design/**`（宽度扫描域，归 `check-doc-width.mjs`）——
两扫描域**互不侵入**（见 §2.24.7 决策点 1）。

**基线与存量**：机检基线（`test/fixtures/ledger-baseline.json`）**必须保持为空**——**违规一律阻断**（修掉；
「存量分流 / 入基线」已废——阈值 = 0；F14 同条）；非空基线 ⇒ FAIL + 固定句「本基线必须保持为空」（fail-closed）。
**基线存放面（修正轮裁决 #6）**：`test/fixtures/ledger-baseline.json`——键**稳定、不含行号**
（与 `scripts/check-doc-width.mjs:34` → `test/fixtures/doc-consistency-baseline.json` 同口径，按 `(kind|file|引用串)` 键控）；
入 eng-coder `files`；文件格式由实现阶段定（本节只钉**路径与键稳定性**）。
「基线必须保持为空（非空即 FAIL）」是 **AC48** 的断言项之一（与 T71① 对齐）。
**反证要求**：用例须含"合成坏台账必报红"（防"永远绿的空转脚本"）。

**实现细节**（解析正则 / 行扫描算法 / 基线文件格式 / 报表排版）**由实现阶段确定**——
本节只钉**契约**（检查什么 / 输入输出 / 失败形态 / 扫描域 / 退出码）。设计者不写正则、不写脚本。

**归属面**：脚本住**本仓** `scripts/`（FR13：本仓局部工具，**不进产品提示词**）；
`src/prompts/**` 不得出现该脚本名（AC48 机判）。

#### 2.24.7 方案选型（本批三个决策点）

| # | 候选方案 | 判据逐项评估 | 取舍（选定代价/权衡） | 结论 |
|---|---|---|---|---|
| 1 | **A**：扩 `scripts/check-doc-width.mjs` 承载台账检查 | 域：宽度扫描 = `docs/design` + `docs/requirements` + `docs/batches`（as-of 2026-09-11 实测；台账 `docs/TODO.md` **不在域内**）——扩域即域污染；行数：该档 **298 行已贴 300 硬顶**（+检查逻辑必越顶） | — | **否决**——域污染 + 撞硬顶双因 |
| 1 | **B**：**新建** `scripts/check-ledger.mjs` | 域：显式清单，与宽度域互不侵入；行数：新档 ≤180，硬顶内；复用：基线/退出码口径照搬既有 | 代价 = 多一个脚本档与一份用例档 | **选定** |
| 2 | **A**：VSC 台账**照抄 CLI 分组名** | 两仓现状差异大（VSC 40 行/8 组/18 条，无需求池）；照抄会移植 CLI 特有的板块分组 | — | **否决**——把一端的分组当契约迁到另一端 |
| 2 | **B**：**VSC 按现状轻量建池** | 只加"建需求池组 + 技术组按 (b) 重排"，保留 VSC 自有的组结构 | 代价 = 两端分组名不同（可接受：语义同源即可，非 byte-identical） | **选定** |
| 3 | **A**：机检在**两仓各落一份** | 双实现面 = 双维护点 + 双漂移面 | — | **否决**——FR13 定位为本仓局部工具 |
| 3 | **B**：**单脚本住本仓，VSC 台账作外部输入** | 输入含仓根参数 → 一份脚本扫两仓 | 代价 = 脚本需接受外部路径（已入契约 §2.24.6 输入项） | **选定** |

**单一候选（豁免）**：条目格式（需求池 = 需求档节 + 任务书；技术 = 归属档节 + 证据行）——
**由需求档 §1.13 既定**，本批无选型空间（单方案——无对比）。

#### 2.24.8 不变量（评审判据）

1. 台账条目**一行一条**，且**不含方案叙述**（无续行细节）。
2. 需求池与技术待办**分组互斥**，组计数与实条目数（**未决数**）**相等**。
3. 状态机**六态**，且"N 态"声明处处与列表一致（D3）。
4. 检查器**退出码二值可靠**（0 绿 / 1 红），且**含反证用例**（坏台账必报红）。
5. 检查器**不进产品提示词**（`src/prompts/**` 零命中）。
6. 提示词锚 L-A / L-B **双端逐字相同**（锚句不含 byte-identical 之外的依赖；节内其余文本各端自持）。
7. 本批**不触碰** `check-doc-width.mjs`、**不扩**宽度扫描域。
8. 活台账**零 `- [x]`**——已核销 / 已废弃整体住同仓 `docs/TODO-archive.md`；组计数 = 未决数（2026-09-11 追加裁定）。
9. 技术条目 `触发=` 取值 ∈ 三枚举（写即须合法）；无触发条目 → 审计「待处置」（报告不阻断——§2.24.9）。
10. 老化报告**只读**——运行前后台账文件字节不变；年龄不可判定（无 git / 解析失败）降级「年龄未知」照列。

#### 2.24.9 归档 / 触发 / 老化（2026-09-11 追加裁定——范围扩展）

> 来源 = 批次档 §1「追加裁定」1–6（用户 2026-09-11 16:34–16:37）。机制句权威 = 需求档 §1.13；
> 本节 = 设计侧口径（机检 / 归属 / VSC 对位）。**归属修订**：记录 + 状态推进 + 物理落笔 = **主 agent**（父侧）；
> eng-designer 台账侧职责 = 需求档条文修订 + **收拢应用清单**（判定交付——物理落笔不归它）。

**① 归档口径（替代「就地 `[x]` 保留、计入组计数」——§2.24.4 已同步改写）**：

- 已核销 / 已废弃条目**勾销（锚行 `- [x]`）后整体移入同仓 `docs/TODO-archive.md`**
  （CLI = `docs/TODO-archive.md`；VSC = `docs/TODO-archive.md（VSC 仓）`——**同 basename**；与 `checklist-done.md` 同口径）。
- 活文件**只留未决**：`- [x]` 零命中（**L3⑤**）；**组计数（N 条）= 未决数**（L2 口径同改）。
- 归档档最小形态：一行标题 + 来源注（自本仓 `docs/TODO.md` 移出）+ 原样迁入行（保留 `- [x]` 锚、status、冻结指针）；
  **不入机检扫描域**（扫描域 = 两仓活台账——§2.24.6）。
- **VSC 归档对位**：**已迁 VSC 仓**（台账自持批 LEDGER-SELF-CONTAINED——本端不再承载该登记）；
  接收 = `ENGINEERING-MODE（VSC 仓·需求）` 档「归档对位」节；**移出行源档 blob SHA** = `7b05f1b0badeac8775a0a2b72164764fded2be2e`（本批改动前 HEAD 版）。

**② 触发字段（技术待办——(b) 形态补定；文本权威 = 需求档 §1.13）**：

- 形态：`触发=归批（<批名/批号>）` / `触发=条件（<条件句>）` / `触发=认账不排期`（三枚举；`认账不排期` = 合法选项，区别于遗忘）。
- **无 `触发=` 场** → 审计面「待处置」（默认归集；**不判 L3 红**——处置要人判）；`触发=` 取值非三枚举 → **L3⑥ 红**。
- 赋值归主 agent（能用则不空——在途条可「归批」、带前置条可「条件」）；未赋者由审计面兜底（不强制迁移时全量赋）。

**③ 老化报告（审计模式——报告只读）**：

- 入口 = `node scripts/check-ledger.mjs --audit`；输出「**待处置清单**」= 技术组全部无触发条目（逐条 `<档>:<行号>` + 摘要），
  **行龄超 N 天**者标「老化」。
- **N 默认 30 天**（实现常量）；行龄 = 条目行最近变更时间（实现面建议 `git blame` 行级；
  非 git / 不可判定 → 标「年龄未知」照列、不判老化——零假阳降级）。
- **不自动删 / 不改任何文件**；退出码 **0**（报告不阻断——处置要人判）。

**④ 归属与落笔（修订）**：物理落笔（两仓 `TODO.md` / `TODO-archive.md`）= 父侧；台账档**不入任何子代理 `files`**
（§1.13 职责分工——2026-09-11 修订）；运行面头部行口径 = 父侧落笔（含「归档 = 同仓 `docs/TODO-archive.md`」句）。

**⑤ 机检增量汇总（L1–L3 基础上）**：L3⑤（活文件零 `- [x]`）· L3⑥（触发取值合法）· 审计模式（待处置清单 + 老化标记）。
基线不得再设（**必须保持为空**——非空即 FAIL；「存量分流」已废——阈值 = 0；F14 同条）；**反证**：合成活文件含 `- [x]` / 非法 `触发=` → 必报红（T92 / T93）。

### 2.25 受影响文件（第 8 批 as-of——2026-09-11 实测，不得当契约引用）

**代码 / 文档面**（本仓 `thincoder`）

| 文件 | 性质 | as-of | 增量上限 | 档位处置 |
|---|---|---|---|---|
| docs/requirements/ENGINEERING-MODE.md | 修改 | 817（as-of 2026-09-11 本扩展轮实测） | **本扩展轮净增 +19（798 → 817——§1.13 / §1.8 步 2 / §1.11 B5 / FR18 行 / §1.17）**；早前已落 +19（719 → 738，as-of 当时） | >300：不拆（按节组织，新增量全在既有节内） |
| docs/design/ENGINEERING-MODE.md | 修改 | 2285 → **2307**（as-of 2026-09-11；本扩展轮实测 2285，微修落笔后复测 2307） | **本扩展轮净增 +79（2206 → 2285——§2.24.9 / AC75–AC79 / T92–T96 / §7 / §2.25）**；早前轮次净增 +263（1187 → 1450，as-of 当时） | >300：**不拆**（拆档破"一板块一档 + D2 单一权威源"）。**拆分计划**：§2.24 扩展后实测 **192 行**（≤300）——本档结构未变；后续批若越 300，按既有子节 §2.24.1–§2.24.9 切为两节（各 ≤300） |
| docs/TODO.md | 修改（收拢执行——父侧） | 174（as-of 2026-09-11 脚本复算） | 净减（收拢后活文件 = 未决 **30**；归档档 +40 条） | 非源文件，无硬顶；**他批并行在写**——as-of 仅供参照；物理落笔 = 父侧（2026-09-11 归属修订） |
| scripts/check-ledger.mjs | **新增** | — | ≤240（L3⑤⑥ + 审计模式增量） | 新增档，300 硬顶内 |
| test/ledger.test.mjs | **新增** | — | ≤180（T92–T96 增量） | 新增档 |
| test/fixtures/ledger-baseline.json | **新增** | — | ≤80 | 台账检查**基线档**（**必须保持为空**——非空即 FAIL；「存量分流 / 入基线」已废——§2.24.6）；键稳定不含行号（与 `test/fixtures/doc-consistency-baseline.json` 同口径）；**入 eng-coder `files`** |
| `docs/TODO-archive.md` | **新增**（父侧落笔） | — | ≈+40 行（归档 / 勾销条目迁入 + 头部注） | 台账归档档（§2.24.9①）；**不入任何子代理 `files`**——物理落笔 = 父侧 |
| 测试注册面（CLI 仓 glob 自动发现） | **无改动** | — | **0** | CLI 仓**无显式清单档**——`test/run-fast.mjs:19` / `test/run-full.mjs:9` 走 `test/*.test.mjs` glob → 新 test 档注册改动 **0**（`test/files.mjs`（VSC 仓） 是 VSC 仓机制，不入本表） |
| scripts/check-doc-width.mjs | **不触碰** | 298 | **0** | 已贴 300 硬顶——本批一律不改 |

**代码 / 文档面**（VSC 仓 `thincoder-vscode`）

| 文件 | 性质 | as-of | 增量上限 | 说明 |
|---|---|---|---|---|
| `docs/TODO.md（VSC 仓）` | 修改（收拢执行——父侧） | 63（as-of 2026-09-11 实测） | 净变（活留 **9** / 归档 **11** 条移出——as-of 清单表） | 单脚本以外部路径输入覆盖此档（§2.24.7 决策 3）；**不入任何子代理 `files`**——物理落笔 = 父侧 |
| docs/design/PROVIDER.md（VSC 仓） | **不触碰** | — | **0** | 并行会话在写——只读参照，本批不得改 |
| docs/TODO-archive.md（VSC 仓） | **新增**（父侧落笔） | — | ≈+13 行（11 条迁入 + 头部注） | VSC 归档档（同 basename 对位——需求档 §1.17 登记；§2.24.9①）；物理落笔 = 父侧 |

**提示词双源面**（**8 文件 = `persona-eng-designer.md` ×4 + `discipline-engineering.md` ×4**——**落笔归 eng-coder**）

*（a）`discipline-engineering.md` ×4——锚 L-A / L-B（设计侧只出锚；逐字源 = §2.24.5 / AC49）*

| 文件 | 性质 | as-of | 增量上限 |
|---|---|---|---|
| src/prompts/discipline-engineering.md | 修改 | 222 | +≤12（锚 L-A / L-B 入「需求池攒批工作流」节；**入 eng-coder `files`**） |
| docs/design/prompts/discipline-engineering.md | 修改 | 150 | +≤12（中文权威同步；**入 eng-coder `files`**） |
| src/prompts/discipline-engineering.md（VSC 仓） | 修改 | 229 | +≤12（端原文自持，语义同源；**入 eng-coder `files`**） |
| docs/design/prompts/discipline-engineering.md（VSC 仓） | 修改 | 156 | +≤12（同上；**入 eng-coder `files`**） |

*（b）`persona-eng-designer.md` ×4——todo 归属句替换（**2026-09-11 补列**——§5 审计 Deferred 闭合；实落）*

| 文件 | 性质 | as-of | 增量（实落） |
|---|---|---|---|
| src/prompts/persona-eng-designer.md | 修改 | 56 | 归属句替换（逐字源 = 本批 §4 批准面 / §5 对表 4–7——「todo 状态推进（记录 + 状态推进 + 物理落笔）= 主 agent」；AC25 子串 `todo 状态推进` 保留）；**入 eng-coder `files`** |
| docs/design/prompts/persona-eng-designer.md | 修改 | 54 | 同上（中文权威）；**入 eng-coder `files`** |
| src/prompts/persona-eng-designer.md（VSC 仓） | 修改 | 56 | 同上（端原文自持——含「不触碰本仓 `docs/TODO.md`」）；**入 eng-coder `files`** |
| docs/design/prompts/persona-eng-designer.md（VSC 仓） | 修改 | 54 | 同上；**入 eng-coder `files`** |

> 行数一律 as-of（2026-09-11 实测），不作契约。persona 面设计侧零新增选型——纯登记（逐字源 = 批次档 §4 批准面 + §5 对表 4–7 实落）。

> **声明纪律（2026-09-11 归属修订）**：两仓台账（`docs/TODO.md` / `docs/TODO.md（VSC 仓）`）与归档档
> （`docs/TODO-archive.md` / `docs/TODO-archive.md（VSC 仓）`）**均不列入任何子代理 `files` 参数**；
> **物理落笔 = 父侧（主 agent）**（§1.13 职责分工——原「eng-designer 落笔」口径作废）。
> **VSC 三文件归属拆分**：2 个提示词档（`thincoder-vscode/src/prompts/…` + 同仓中文镜像）**入 eng-coder `files`**；
> `docs/TODO.md（VSC 仓）` **不入**（同父侧维护档）。
> **注册面已核实（原“待实测确认项”结案）**：CLI 仓无显式清单档，`test/*.test.mjs` glob 自动发现
> （`test/run-fast.mjs:19`、`test/run-full.mjs:9`）→ 新 test 档注册改动 **0**。

### 2.26 文档机制边界与拆分（第 13 批——机制债收束）

> 需求 = `../requirements/ENGINEERING-MODE.md` §1.15「机械校验边界」（2026-09-11 第 13 批块）；批次档 = `../batches/2026-09-11-MECH-DEBT-SWEEP.md` §1/§2。
> 条目：B 跨仓引用 V1 缺口 · C 评审发现表宽度 vs 表格结构 · D 两处拆分债（A 在 `ADVISOR-CONVERGENCE.md` §15；E 在 `SETTINGS-TOOL.md` §9——各回其板块）。
> 交付面 = 文档规范（`docs/README.md` §3.7——B/C 规范文本，eng-coder 逐字落笔）/ 检查器（`scripts/check-doc-width.mjs`——C 机制）/ 测试档拆分（D-2）。

#### 2.26.1 条目 B：跨仓引用 V1 缺口（选型 + 规范文本）

**问题**：V1（`checkSectionRefs`）按 **basename 在本仓扫描域**解析引用——跨仓引用（他仓档名 + `.md` 后缀 + 节号形态）
**当该 basename 不在本仓扫描域时**恒判 `unknown-doc`（基线 unknown-doc 存量 = 0 → 新增即阻断）；**加仓前缀也无效**（basename 仍是原档名）。
**同名 basename 处置（修正轮 #9）**：他仓档名与本仓某档同名 → V1 按其**本仓档**解析——可能 `no-section` 误报、甚至以**错档**节号通过（罕例；规范形态去 `.md` 同时消解此残差）。
夜班两批实证（第 10 批与父侧代笔清）；即时处置（去 `.md` 后缀 + 仓别注记）已在用（`docs/TODO.md` 在案）。

**候选对比（≥2）**：

| # | 候选 | 判据（机验能力 / 成本） | 取舍 | 结论 |
|---|---|---|---|---|
| ① | V1 跨仓解析（按仓前缀 / 链接路径解析他仓档） | 跨仓引用可机验 | 需工作区双仓布局假设（克隆布局可能不同）；双端（CLI + VSC）双实现；新语义新假阳面；与 §2.22.6 既有裁定「不得硬编码跨仓相对路径」同向 | 否决——收益（罕见引用类的可验性）低于成本 |
| ② | 形态规范（去 `.md` 后缀 + 仓别注记；V1 域外显式化） | 零假阳 / 零代码 / 与在用实践一致 | 跨仓引用永不机验（以「显式域外」如实声明，不静默） | **选定** |
| ③ | 静默容忍（跨仓形态不判不报） | 免误报 | 静默不校验 = 违零静默；与 unknown-doc 真阳性不可机械区分 | 否决 |

**契约（选定 ②）**：检查器**零改动**（`checkSectionRefs` 不动——边界 ≠ 机制变更）；规范文本（逐字——落笔见 §2.26.2「落笔表」第 2 行）：

> - **跨仓引用形态**：引用他仓文档不得写 `X.md` §N 形态（V1 按本仓 basename 解析——**basename 不在本仓扫描域时**恒判 `unknown-doc`；同名 basename 按本仓档解析、可能 `no-section` 误报甚至以错档通过）——写「名称（仓别）§N」（如 `WEBVIEW（VSC 仓）§5`）：去 `.md` 后缀、去路径前缀（跨仓引用 = V1 域外）。

**登记（后续选项）**：跨仓引用规模增大、确需机验 → 走 ① 独立批（先定义他仓扫描根 + 双端镜像约定，不得硬编码）。

#### 2.26.2 条目 C：表格行宽度豁免（选型 + 契约）

**问题**：宽度规则（无 >300 字符单行——`docs/README.md` §3.7 规则 1）与 markdown **表格行不可折行**结构性冲突——
多批评审 §3 发现表全部超宽（**as-of 2026-09-11 实测：全仓 37 命中 = 表格行 24 + 非表格 13**——表格行为主力）。

**候选对比（≥2）**：

| # | 候选 | 判据（规范-机制一致 / 成本） | 取舍 | 结论 |
|---|---|---|---|---|
| ① | 表格行豁免（规范 + 检查器同步） | 双层一致；表格行结构性不可折行 | 表格可任意宽——以「建议就近折行」非阻断注保留可读性取向 | **选定** |
| ② | 检查器单边跳过 | 只改检查器一侧 | 规范仍禁、机制放行——规范-机制漂移（违 D2 / 零静默取向） | 否决 |
| ③ | 发现表非表格化 | 保住宽度域 | 评审协议 / 提示词模板 / 既有 §3 结构全动；提示词面不在本批 | 否决 |

**契约（选定 ①）**：

1. **机制**（`scripts/check-doc-width.mjs`）：宽度扫描豁免表格行——谓词 = 既有 `isTableRow`（`^\s*\|.*\|\s*$`，与 V2 同源）；
   **单源化**：`checkDocWidths()` 内跳过 + CLI 主流程改调用 `checkDocWidths(root, {max, dir})`（删除内联重复扫描——
   防两处规则漂移）；头注 ① 块补豁免注记。
2. **规范**：`docs/README.md` §3.7 落笔（规则 1 扩豁免句 + 括注校正——逐字见「落笔表」）。
3. **影响面（as-of 实测；修正轮复核）**：豁免前全仓 **38** 命中 = 表格行 24 + 非表格 14（设计初测 37 = 24 + 13；
   增量 1 = 批次档 §3 评审段行——评审面非实现面）；豁免后宽度报告集 **14** 命中（降 24 表格行）——**非表格 14 命中照常报告**
   （含 docs/design 域既有存量——归 `docs/TODO.md`「既有文档超宽行清理」另项，非本批）；V1/V2/V3 与
   基线（`test/fixtures/doc-consistency-baseline.json`）**零接触**（宽度面无基线机制——宽度不进 T41 基线条目）。

**残余登记（修正轮 #10）**：豁免谓词 = **裸 `isTableRow`**（单行形态判定）——代码围栏内、或其他 `|…|` 形态的 >300 行会被一并豁免（罕例——
V2 面有分隔行二次确认、宽度面无此确认，fail-open 方向）；不影响本批选型（规范侧以「建议就近折行」兜底）。

**落笔表（eng-coder 逐字——`docs/README.md` §3.7）**：

| # | 落点 | 逐字文本 |
|---|---|---|
| 1 | 规则 1（整行替换） | `- **无 >300 字符单行**（整节/表/规则不得压成一行）——**表格行豁免**：markdown 表格行结构性不可折行，超宽表格行不计入宽度检查（建议就近折行或表下补充——非阻断）` |
| 2 | 规则表新增 bullet（跨仓引用形态） | `- **跨仓引用形态**：引用他仓文档不得写 `X.md` §N 形态（V1 按本仓 basename 解析——**basename 不在本仓扫描域时**恒判 `unknown-doc`；同名 basename 按本仓档解析、可能 `no-section` 误报甚至以错档通过）——写「名称（仓别）§N」（如 `WEBVIEW（VSC 仓）§5`）：去 `.md` 后缀、去路径前缀（跨仓引用 = V1 域外）` |
| 3 | 检查器括注（随修——as-of 实测与现状不符） | `（扫描域 = `docs/design/` + `docs/requirements/` + `docs/batches`——排除 `_archive/`（历史快照豁免）；`docs/README.md`、`docs/TODO.md`、`docs/PHILOSOPHY.md` 覆盖为待办，见 `TODO.md`）` |

> 落笔表注：第 2 行内层反引号按 README 既有风格嵌套（档名 `X.md` / `WEBVIEW（VSC 仓）§5` 逐字保留——
> 该形态使 V1 正则不匹配，不在本仓检查器域内）；第 3 行路径逐字保留反引号包裹。

#### 2.26.3 条目 D：两处拆分债（D-1 不拆 / D-2 拆分）

**D-1 `thincoder-core/advisor/messages.mjs`（413 行——300 建议线外、500 硬限内）——不拆（显式理由 + 拆分计划登记）**：

- 理由：本批零增厚（改动面不触该档）；413 < 500 硬限；模块职责单一（advisor 消息装配）；
  第 11 批既有裁定同向（§14.10 #4——「若后续继续增厚，按 loop.mjs 同法拆分」）。
- **拆分计划（登记——不执行；触发 = 再度增厚）**：候选线 = 抽「项目上下文发现」组
  （`findProjectRoot` + `injectProjectGuide`，~85 行）→ `thincoder-core/advisor/project-context.mjs`；import 面由 re-export
  保持不变（`run.mjs` / `advisor.mjs` / 测试三处导入点零改——同 `loop.mjs` 形态）。

**D-2 `test/prompts-async-guidance.test.mjs`（563 行——超 500 硬限）——拆分为两档**：

| # | 拆法 | 移动量 | 结论 |
|---|---|---|---|
| ① | 迁出「eng-designer 双源（AC21–AC25）+ 第 9 批锚（T-RO1–T-RO6）」组（`:420`–EOF；T-RO1–T-RO4 已退场——整删，删除记录 = `TESTING.md` §11.3） | 144 行 / 11 例 | **选定**——主题连贯（双源 / 跨仓镜像锚）；余档 419、新档 ~180，两档余量充足 |
| ② | 迁出「装配矩阵 + 降级链」运行时组（§3.2 / §3.4） | ~102 行 / 8 例 | 否决——运行时组与保留部分共用基建更多；余档余量较小 |

**契约**：

- 新档 `test/prompts-dual-source.test.mjs`：头部自持（imports + `read` / `exists` 助手 + 所需语料读取 + 常量）——
  **零跨档 import**；11 例**逐字搬移**（断言零改、零增、零删）；CLI 快层 glob 自动发现（零注册改动）。
- 原档保留 42 例；两档各 ≤500（目标 ≈419 / ≈180）。
- **用例数守恒**：53 = 42 + 11（拆前实测）。
- 边界：不动任何断言文本；原档头注不改（新档自带头注）。

**D 受影响文件（eng-coder 写域——5 项 = 4 改 + 1 新）**：

| # | 文件 | 当前行数 | 动作 | 预计 |
|---|---|---|---|---|
| 1 | `docs/README.md` | 239 | 改（§3.7 落笔表三条） | +~5 |
| 2 | `scripts/check-doc-width.mjs` | 298 | 改（表格行豁免 + 宽度扫描单源化 + 头注） | ±~6 |
| 3 | `test/doc-consistency.test.mjs` | 196 | 改（+T72–T73；T74 已退场——整删，删除记录 = `TESTING.md` §11.3） | +~45 |
| 4 | `test/prompts-async-guidance.test.mjs` | 563 | 改 + **拆**（迁出 `:420`–EOF） | → ~419 |
| 5 | `test/prompts-dual-source.test.mjs` | 新 | **新增**（11 例逐字迁入 + 头部自持） | ~180 |

**档位结论（修正轮 #6）**：`scripts/check-doc-width.mjs` = **存量贴线档**（298/300 建议线）——本批承诺**终态 ≤300**（净增 ≤2；±~6 为双向评估，删除内联重复扫描为减量项）；
落地以**批前 298 / 批后实测对表**记账（§5 行数对表）。**若实测 >300（净增 ≥3）→ 拆分退路**：抽宽度扫描核心（`collectMarkdown` / `scanDomain` / `checkDocWidths`）至
独立档 + 扫描库分档（原拟 `doc-scan` 库档——**未采用**；re-export 保持消费面零改——`test/doc-consistency.test.mjs` 导入点不变），主档回 ≤300；触发即**停下报告父侧**（增量档不在本批 files 声明内）。

#### 2.26.4 关键决策记录（含否决备选）

| # | 决策 | 否决备选 | 依据 |
|---|---|---|---|
| D-26a | B = 形态规范（检查器零改） | ① 跨仓解析 / ③ 静默容忍 | 成本-收益 + §2.22.6 既定口径 + 零静默 |
| D-26b | C = 表格行双层豁免 | ② 机制单边 / ③ 非表格化 | 规范-机制一致 + 提示词面隔离 |
| D-26c | D-1 不拆（计划登记） | 本批拆 | 硬限内 + 零增厚 + 第 11 批裁定同向 |
| D-26d | D-2 按拆法①（双源 + ROPE 组迁出） | 拆法② | 主题连贯 + 两档余量 |

#### 2.26.5 边界（本批不做）

- 不做 V1 跨仓解析（①——登记后续）；不扩宽度扫描域（`docs/TODO.md` / `docs/README.md` / `docs/PHILOSOPHY.md` 仍域外——T6 域扩提案已由用户 2026-09-11 裁定不采纳〔维持三域〕；轮次 4 #2② 状态同步）
- 不动 VSC 仓脚本镜像（`thincoder-vscode/scripts/check-doc-width.mjs`——C 豁免语义镜像 = 登记项，本批 CLI 单端；若用户要同批镜像 → 一句话翻转并入）
- 不重排既有批次档 §3 表（已折行记录冻结）；不做文档内容改写（只做规则 / 括注层面改动）
- 提示词面零碰（`src/prompts/**` 与本批无关）

### 2.27 收尾批：第 13 批遗留收束 + 文档实测回写（第 14 批——2026-09-11）

**问题陈述**（来源 = 第 13 批 §6 收口遗留 + id=11 观察）：第 13 批交付后留下三个未收尾面——
① **T111/T112 无测试宿主**（原设计号 T75/T76——2026-09-12 编号避让，见 §2.27.4）——§3.2 两条用例（拆分守恒 / 新档自持）仅有设计行、无落点（当批写域清单缺口；
D-2 契约「禁新档增例」），交付时仅一次性人工核验——**无回归锁**；
② **AC54 注行号指针 +1 漂移**——`scripts/check-doc-width.mjs` 行号随条目 C 落地位移（当批 coder 审计发现）；
③ **TUI.md §1 地图行存量漂移**——非第 7 批触及行仍为 2026-09-09 值（id=11 实测：pickers 500→107 为最大量级差）。
本批 = **小收尾**（回归锁补齐 + 文档 ↔ 实测对齐）——不新增功能语义、不动既有行为面。
需求面 = 需求档 §1.15 收尾批块（**无新需求**——A = 既有判定句的回归锁化 / B = D4 维护 / C = 文档对齐 / D = 纯格式折行〔§2.27.8〕）。

#### 2.27.1 条目 A：T111/T112 宿主与断言形态（选型对比）

| # | 候选方案 | 判据逐项评估 | 取舍（选定代价/权衡） | 结论（选定/否决理由） |
|---|---|---|---|---|
| 1 | `test/doc-consistency.test.mjs` 续 T72–T73（T74 已退场——整删，删除记录 = `TESTING.md` §11.3） | 同档同族（第 13 批 B/C 机判即落此档）；零新档；快层 glob 自动发现 | 档名语义偏「文档一致性」——本组为「测试档拆分完整性」，主题相邻 | **选定** |
| 2 | 新档 `test/prompts-split-guard.test.mjs`（已废——否决） | 主题最贴切 | 违本批「不得自行新建档」边界；新增档位注册/维护面 | 否决——零新档纪律 |
| 3 | 并入两档提示词测试之一 | 就近可写 | **破坏其自身守恒计数**（拆分时 53 = 42 + 11；现锁 14 + 4 = 18——并入即失稳，自证矛盾） | 否决 |

**契约（T111/T112 = 静态不变量——逐字实现形态见 §2.27.4 代码块）**：

- **T111（正常：拆分守恒）**——三面断言：①**发现面** = 两档在快层发现集内
  （`readdirSync(test)` ∩ `*.test.mjs` ≡ `test/*.test.mjs` 单层 glob——`test/run-fast.mjs:19` 默认目标）；
  ②**守恒** = 用例计数（`^(?:test|slow)\(`）**14 / 4 / 合计 18**（**as-of 2026-09-12 散文锚退役批重测基线**——拆分时合计 53；
  其后第 15/16/23 批锚 + TD 锚组等增例、散文锚退役批整删驻留断言后回落；**增删用例须同步锁定值**——实施规则见 §2.27.4 `SPLIT_CASES`）；
  ③**硬限** = 两档行数 ≤500（口径 `split("\n").length` 含末行）。
- **T112（边界：新档自持）**——两面断言：①新档源码零 `prompts-async-guidance` 子串（含注释面——零跨档引用）；
  ②新档 import 说明符全部 `node:` 前缀（头部自持契约的机械面）。
- **「全绿」不入用例内（裁决）**：两档与 T111 同处一个快层套件——红则套件红，套件级已承载；
  用例内嵌 runner（spawn 两个测试档）= 重复执行 + 引入 spawn 面 + 零边际信号 → 否决（D-27b）。
- **守恒锁守则**：后续批次向两档增/删用例时，本锁数值须同步（D3——锁的存在即提醒点；数值源 = §2.27.4 `SPLIT_CASES`）。
- §3.2 T111 行「输入」列的 `node test/run-fast.mjs` = 批级验证输入（§6 级），非单测内嵌 runner——
  该两行零改（落档形态的权威 = 本节，见 D2）。

#### 2.27.2 条目 B：行号指针修正（精确定位 + 同类自查）

**修正集 = 3 处**（与 coder 审计同一溯源链；已落）：

| # | 位置 | 原值 | 修正值 | 目标行核验（2026-09-11 实测） |
|---|---|---|---|---|
| 1 | §3.1 AC54 注 | `scripts/check-doc-width.mjs:296` | `:297` | `process.exit(widthHits.length ? 1 : 0);` |
| 2 | §3.1 AC51 | `scripts/check-doc-width.mjs:30` | `:32` | `export const SCAN_DIRS = [...]` 声明行 |
| 3 | §2.24.6 | `scripts/check-doc-width.mjs:32` | `:34` | `export const BASELINE_PATH = ...` 声明行 |

判据 = 指向批 13 触及文件、且因条目 C 落地位移（批 13 前后对照核验）。同类自查面 = 全档 `文件:行` 型指针全量枚举
（77 处 / 70 行）+ 活体面（§3.1 / §3.2 / 当前机制叙述处）逐处精查。
**登记集 = 5 处**（存量漂移——如实登记本批不修）：

1. `src/agent/dispatch.mjs:220`（AC26）——现 :244 豁免条件行 / :254 入 ask 队列（批 11 位移）；
2. `thincoder-core/agent/setup.mjs:299`（AC17）——装配调用现 :307–313、内层条件 :310–312；
3. `thincoder-core/prompt-overlays.mjs:70-71`（AC17）——所述「静默回退陷阱」现 :73；
4. 需求档 `ENGINEERING-MODE.md` §1.15:614（AC28）——非功能段现 :635–636；
5. `docs/README.md:174`（§2.20.8）——在途设计档行现 :175。

**范围外（D4）**：§2.x 历史批段与 §7 变更记录内的行号 = **as-of 记录**（描述当时状态、非当前导航）——不溯改；
§2.26.3 的 `:420`–EOF（×2）= **搬迁操作记录**（描述搬迁前时点状态）——留档不改（零「当前值」可换）。

#### 2.27.3 条目 C：TUI.md §1 地图行数回写（口径 + 全表）

**口径裁定 = `split("\n").length`（含末行）**——依据：同表多数行（28 / 42）+ 全部 SUBAGENT-TAIL 回写行
（git `1fb78fe` 核验）+ id=11 观察值均为同口径。**全表回写**（非只回写 id=11 观察处——一次量测摊平成本、
消灭混口径/混时点——「非本批触及行是否顺带全部回写」的裁定：**顺带回写**）。
**回写净值 = 15 行改**（其余 27 行同值——回写后全表单一 as-of：2026-09-11）：

| # | 文件 | 原值 | 新值 | # | 文件 | 原值 | 新值 |
|---|---|---|---|---|---|---|---|
| 1 | `tui-lifecycle.mjs` | 75 | 88 | 9 | `layout.mjs` | 226 | 227 |
| 2 | `key-modes.mjs` | 216 | 239 | 10 | `mouse.mjs` | 213 | 250 |
| 3 | `agent-turn.mjs` | 323 | 324 | 11 | `pickers.mjs` | 500 | 107 |
| 4 | `suspension-drive.mjs` | 297 | 298 | 12 | `wizard.mjs` | 208 | 228 |
| 5 | `tool-events.mjs` | 404 | 406 | 13 | `cmd-config.mjs` | 393 | 464 |
| 6 | `render-frame.mjs` | 376 | 377 | 14 | `cmd-advisor.mjs` | 255 | 256 |
| 7 | `tool-args.mjs` | 80 | 82 | 15 | `cmd-submodel.mjs` | 152 | 155 |
| 8 | `render-loop.mjs` | 129 | 131 |  |  |  |  |

另有小命令范围格 = 实测 **8–95**（原 10–101）；行内 `/eng(101)` → `/eng(95)`；`distill-cmd.mjs`（47 行）与
`slash-commands.mjs`（187 行）实测同值不变。**表头口径注**（已落）：单一 as-of + 口径句 + 如实注两条。
**如实注（超出范围项——只注不补）**：① 三档未收本表——`model-picker.mjs`（496）/ `model-catalog.mjs`（90）/
`wrapped-spawn.mjs`（39）（补登随后续 TUI 文档维护批）；② `pickers.mjs` 行文字未随 MODEL-MERGE-SESSION 拆分重写
（模型两级面 + `/provider` 管理已迁 `model-picker.mjs`——行内已注）。

**刷新债登记（协调项——as-of 2026-09-12 全量逐行重测）**：2026-09-11 快照后他批改盘未回写——现盘差 = 地图 **16 行** + 小命令范围格 + 如实注（`model-picker.mjs` / `wrapped-spawn.mjs`）。
**本批不代刷**（触行刷新归各批——AC59 口径）；归口 = 下一次 TUI 文档维护批（台账落笔归父侧）：

| # | 行（TUI.md §1） | 地图现值 | 现盘实测（rawSplit） |
|---|---|---|---|
| 1 | `index.mjs` | 450 | 483 |
| 2 | `tui-lifecycle.mjs` | 88 | 95 |
| 3 | `key-handler.mjs` | 461 | 475 |
| 4 | `key-handler-search.mjs` | 114 | 122 |
| 5 | `agent-turn.mjs` | 324 | 344 |
| 6 | `suspension-drive.mjs` | 298 | 300 |
| 7 | `tool-events.mjs` | 406 | 447 |
| 8 | `tool-display.mjs` | 144 | 158 |
| 9 | `subagent-blocks.mjs` | 454 | 437 |
| 10 | `subagent-freeze.mjs` | 170 | 176 |
| 11 | `subagent-children.mjs` | 163 | 235 |
| 12 | `render-frame.mjs` | 377 | 404 |
| 13 | `tool-args.mjs` | 82 | 85 |
| 14 | `startup.mjs` | 266 | 298 |
| 15 | `ansi.mjs` | 49 | 51 |
| 16 | `cmd-session.mjs` | 103 | 107 |

- 小命令范围格：`各 8–95` 与行内 `/eng(95)` → 实测 **8–79**（min `cmd-exit.mjs` 8 · max `cmd-eng.mjs` 79）。
- 如实注①：`model-picker.mjs` 496 → **499**；`wrapped-spawn.mjs` 39 → **55**（`model-catalog.mjs` 90 同值不变）。
- 说明：上表 16 行 = 快照 vs 现盘差异全集；本批触行中 4 行（key-modes / layout / pickers / wizard）另经交付后刷新轮再触——以最新批为准，不计本表。

#### 2.27.4 受影响文件全清单 + T111/T112 落档形态（2026-09-12 修正轮：数值/编号重钉）

| # | 文件 | 当前行数（rawSplit；as-of 2026-09-12） | 动作 | 内容 | 实施者 | 预计 |
|---|---|---|---|---|---|---|
| 1 | `test/doc-consistency.test.mjs` | 301 | 改（+T111/T112） | 两用例落档尾（形态见下） | **eng-coder**（待 token 门） | ≤+40 |
| 2 | `docs/design/ENGINEERING-MODE.md` | 2627 → 2686（修正轮） | 改（§2.27 + AC57–AC60/AC67 + 3 指针） | 本节 + §3.1/§3.2 + 行号 | eng-designer（**已落**） | 已落（含修正轮） |
| 3 | `docs/design/TUI.md` | 1527 | 改（§1 回写 + 表头注 + 变更记录） | 15 行 + 范围格 + 注 | eng-designer（**已落**） | 已落 |
| 4 | `docs/requirements/ENGINEERING-MODE.md` | 909 → 910（修正轮） | 改（§1.15 收尾批块 + 状态行） | 薄块 + 状态行 | eng-designer（**已落**） | 已落（含修正轮 D 行） |
| 5 | `docs/design/AGENT-LOOP.md` | 1782 | 改（D 折行 3 处） | 纯折行 + 标注 | eng-designer（**已落**） | 已落 |
| 6 | `docs/design/SESSION.md` | 865 | 改（D 折行 1 处） | 纯折行 + 标注 | eng-designer（**已落**） | 已落 |
| 7 | `docs/design/SUBAGENT-ID-COUNTER-AGENT.md` | 59 | 改（D 折行 1 处） | 纯折行 + 标注 | eng-designer（**已落**） | 已落 |

**档位结论（行 1——修正轮补；300 行建议线）**：现 301 行；交付（≤+40）后 ≈≤341 行——越 300 行建议线（advisory）、距 500 硬限余量充足。
**结论 = 留存（不拆）＋拆分计划登记（不执行）**：候选线 = 「防回潮静态锚族」段（现 `:239–:300`——自含常量与扫描面）独立成档（名随批定）；
触发 = **再度增厚**（下一批向本档增段/增例时随批评拆分）。依据：档内主题（文档一致性机判）仍内聚；拆出需新档注册与维护面，本批收益不足。

**编号避让（修正轮）**：两例原拟号 T75/T76——但 `test/doc-consistency.test.mjs` 档内已存 `T75/T76 防回潮（收归族）` 标题（2026-09-11 TEST-LIFECYCLE 并档），同档撞号。
**定名 T111/T112**（§3.1 AC57 / §3.2 行 / 需求档 §1.15 / 批次档 §2 修正轮块同步）。

**T111/T112 逐字落档形态（coder 落笔文案；形态权威 = 本节）**：

```js
/* ─── 第 14 批（T111–T112——拆分守恒与自持回归锁；ENGINEERING-MODE.md §2.26.3 D-2 / §2.27.4） ─── */

/** 快层发现集 = `test/*.test.mjs`（单层通配 ↔ readdirSync 同集——run-fast 默认目标） */
const FAST_LAYER = readdirSync(join(REPO, "test")).filter((f) => f.endsWith(".test.mjs"))
/** 用例数 = 顶层 `test(` / `slow(` 声明数（两档均无 slow——计数字面即归册面） */
const caseCount = (rel) => (readFileSync(join(REPO, rel), "utf8").match(/^(?:test|slow)\(/gm) ?? []).length
/** 拆分守恒 as-of 基线（2026-09-12 散文锚退役批重测；拆分时合计 53）：A 14 / B 4 / 合计 18。
 *  实施规则：两档增删用例时须同步更新本基线（红 = 对账提醒——防静默丢例）。 */
const SPLIT_CASES = { async: 14, dual: 4 }

test("T111 正常：拆分守恒——14 + 4 = 18（as-of 基线）；两档各 ≤500；被快层发现（D-2/AC56）", () => {
  const A = "test/prompts-async-guidance.test.mjs"
  const B = "test/prompts-dual-source.test.mjs"
  for (const f of [A, B]) assert.ok(FAST_LAYER.includes(f.split("/").pop()), `未被快层 glob 发现: ${f}`)
  assert.equal(caseCount(A), SPLIT_CASES.async, "async-guidance 用例数（as-of 基线）")
  assert.equal(caseCount(B), SPLIT_CASES.dual, "dual-source 用例数（as-of 基线）")
  assert.equal(caseCount(A) + caseCount(B), SPLIT_CASES.async + SPLIT_CASES.dual, "拆分守恒（合计 = 两档和）")
  for (const f of [A, B]) {
    const n = readFileSync(join(REPO, f), "utf8").split("\n").length
    assert.ok(n <= 500, `${f} ${n} 行 >500 硬限`)
  }
})

test("T112 边界：新档自持——零跨档引用；import 全 node:（D-2/AC56）", () => {
  const src = readFileSync(join(REPO, "test/prompts-dual-source.test.mjs"), "utf8")
  assert.equal((src.match(/prompts-async-guidance/g) ?? []).length, 0, "零跨档引用（含注释）")
  const specs = [...src.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1])
  assert.ok(specs.length > 0 && specs.every((s) => s.startsWith("node:")), "import 全 node: 内建（头部自持）")
})
```

**coder 落笔注意**：`node:fs` import 行追加 `readdirSync`；新段（含节注）插在**档尾**（收归族段 `:239–:300` 之后、文件末尾）；
**零改既有用例与档头注**（全量既有 = T41①–⑤ / T46 / T72–T73 / T75 防回潮收归族；T74/T76 已退场——整删，删除记录 = `TESTING.md` §11.3）；`REPO` / `join` / `assert` 已在该档直接复用。

#### 2.27.5 关键决策记录（含否决备选）

| # | 决策 | 否决备选 | 依据 |
|---|---|---|---|
| D-27a | T111/T112 宿主 = `doc-consistency.test.mjs`（档尾新段——修正轮重钉） | 新档 / 并入两档 | 零新档 + 同族同形 + 守恒自洽 |
| D-27b | T111 断言 = 静态不变量（发现 + 守恒 + ≤500）；「全绿」归套件级 | 用例内 spawn runner | 零重复执行、零 spawn 面、无边际信号 |
| D-27c | C 口径 = rawSplit + **全表**回写 | nlCount 归一化 / 只回写观察处 | 与同表多数 + id=11 + SUBAGENT-TAIL（git 核验）同口径；混口径/混时点一次消灭 |
| D-27d | B 修正集 = 批 13 所致 3 处；存量 5 处登记不修 | 全档全量重算 / 只修单处 | 溯源一致（第 13 批遗留）；「新增阻断、存量报告」纪律类比 |

#### 2.27.6 边界（本批不做）

- 不新增文件；`src/**` / `scripts/**` / 提示词 / `CHANGELOG.md` / `docs/TODO.md` 零触碰（B 只改文档内指针文本）；
- B 登记集 5 处与 §2.x / §7 历史行号不修；TUI 三档不补行（只注）；`pickers.mjs` / §9 描述不重写（只注）；
  **地图现盘差 16 行不代刷**（刷新债 = §2.27.3 债表——归各批）；
- 第 9 批 §13.9 登记面（§2.2 / §2.5 / §2.6 / §2.9——批 8 链窗口）不碰；
- 宽度扫描域不扩；V1/V2/V3 检查器语义零改。

#### 2.27.7 纪律核对

- **D1**：设计/需求档修订 = eng-designer（含 A 的设计面）；coder 写域 = `test/doc-consistency.test.mjs` 单档。
- **D2**：T111/T112 形态权威 = §2.27.4（§3.2 行只作回指、不作形态权威）；批次档 §2 只引用不重述。
- **D3**：计数声明与列表同改（3 处修正 = 表 3 行；5 处登记 = 列 5 项；15 行回写 = 表 15 行；三档未入表 = 列 3 名；
  修正轮：受影响全清单 = 表 7 行 · 刷新债 = 债表 16 行 + 表后两项〔范围格 / 如实注〕）。
- **D4**：修正值 = 当前解析目标（as-of 2026-09-11）；历史/as-of 面不溯改。
- **D5**：B/C 落档先于评审点火；评审在途零改（冻结；修正轮 = 轮次 1 报告送达后落笔——非在途窗口，轮次 2 入场前落齐）。
- **D6**：落笔后回读 + 机检（`node scripts/check-doc-width.mjs` 新增 0）。
- **D7**：变更留痕 = 本档 §7 一行 + `TUI.md` 变更记录一行（已落）。

#### 2.27.8 条目 D（候选 2 翻转）：设计档侧非表格超宽折行（5 处——已落）

**来源**：第 13 批 §6 收口遗留（批次档 §1 候选 2——用户 2026-09-11「能开的都开起来」翻转纳入本批）；批次记录侧 9 行已由父侧代笔折行 + 打标，设计档侧余额 = 5 处（非表格行）。
**折行口径**：纯折行——文字零增删、语义不变（断点取既有 `；`/`——` 边界；列表续行 2 空格缩进）；逐处带折行标注（`> 〔eng-designer 折行 …〕`——与父侧代笔式标注同型）。
**与表格行豁免的关系**：豁免（第 13 批条目 C——§2.26.2）只覆盖 markdown 表格行（结构性不可折行）；本 5 处均为**非表格行**——不豁免、照折。

| # | 文件 | 行（as-of 2026-09-11） | 原长 → 折后行数 |
|---|---|---|---|
| 1 | `docs/design/AGENT-LOOP.md` | `:510` | 444 → 3 |
| 2 | `docs/design/AGENT-LOOP.md` | `:572` | 338 → 2 |
| 3 | `docs/design/AGENT-LOOP.md` | `:574` | 391 → 2 |
| 4 | `docs/design/SESSION.md` | `:524` | 392 → 2 |
| 5 | `docs/design/SUBAGENT-ID-COUNTER-AGENT.md` | `:53` | 479 → 3 |

**落笔裁定 = 设计者自落（选型对比）**：

| # | 候选 | 判据逐项评估 | 取舍（选定代价/权衡） | 结论 |
|---|---|---|---|---|
| 1 | eng-designer 自落（本轮） | D1 设计档写权唯一；零语义格式修订；批记录侧域归父侧代笔（同规）；零 token 链成本 | 无（纯格式面，无实现信号可验） | **选定** |
| 2 | eng-coder 落（token 门后） | 实施/设计分离 | 设计档写权异位（D1）+ 为格式面新开 token 链 | 否决 |
| 3 | 不折（留存量） | 零成本 | 违「非表格禁 >300」纪律 + TODO 清理面挂账 | 否决 |

**边界**：零文字语义改动、零行序调整、零表格行触碰；本批 5 处之外不折——他链在飞超宽行如实注、归其链（as-of 2026-09-11 快照 3 处：`PORTABILITY.md` `:164`（335）· `COMMON-LAYER.md` `:125`（344）· `VSC-GUARD-COMPLETION.md` `:157`（802）——随其链变动）；`src/**` / `scripts/**` 零触碰。
**纪律核对**：D1（写权 = eng-designer）· D3（5 处 ↔ 表 5 行）· D4（行号只作 as-of）· D5（落档先于评审点火）· D6（落笔后回读 + 机检）· D7（本档 §7 一行）。
**验收**：AC67（§3.1）· 用例 T83（§3.2）。

### 2.28 角色重定义收口（角色重定义批——2026-09-11；FR9 + 需求 §1.5）

> 需求源 = `../requirements/ENGINEERING-MODE.md` §1.2 FR9 + §1.5（裁定清单 + 收口块）；批次档 = `../batches/2026-09-11-ROLE-REDEFINITION.md`。
> 本批 = **收口批**：对账（已实现面 vs 裁定面）为主 + 差异面修正；**新增机制 = 零**（不发明需求——新增文本仅源自既有裁定与实践口径）。
> 零碰区（他批在途/已落）：§2.26 · §2.27 · §3.1 AC45–AC60。

#### 2.28.1 问题陈述

2026-09-10 用户逐条裁定的「角色三段链」（主 agent = 产品经理 / eng-designer = 写稿面唯一作者 / eng-coder = 实现；「设计 = 对需求的检验」）已随第 2/4/5 批实际运行——本会话 7–15 批全链即**运行实例**。但裁定面与文档面/提示词面之间仍留三类残留（勾销口径 · 内容权流程 · 归属/计数/过渡性登记面）——「同一机制两处不同描述」（D2 违反）会在下批评审里复现。本批逐条对账（§2.28.2）并收口（§2.28.4），使三段链在四层（需求/设计/提示词/机械）单口径。

#### 2.28.2 现状对账（§1.5 全部裁定 + FR9——逐条判定）

| # | 裁定要点 | 判定 | 现行证据 | 差异处置 |
|---|---|---|---|---|
| 1 | 主 agent 保留编排/核验/确认/发起权 | 已实落 | persona-engineering 双源（身份宣言 + 调用链 + 发起权边界） | — |
| 2 | 主 agent 内容性核验设计稿 | 已实落 | 同上（content-level verification 明写） | — |
| 3 | 设计修订全部回 eng-designer | 已实落 | §2.2 step1/step10 · §2.5 · §2.6 F2 · §2.8 · §2.15 A2（六面核对集——AC27/T40 在守） | — |
| 4 | eng-designer 无 designToken | 已实落 | persona-eng-designer 双源 + 机械面（AC20/T36） | — |
| 5 | 需求档不过 advisor | 已实落 | persona-eng-designer 双源（不经 advisor 句） | — |
| 6 | 评审发起权/提醒权在主 agent | 已实落 | persona-engineering 发起权边界（双端） | — |
| 7 | 勘察归 eng-designer 自己做 + 预算 | 已实落 | persona（≤6/批）+ setup 勘察变体（AC20/T35） | — |
| 8 | 提示词内容权 | **部分** | 内容权/落笔分工在 D1 与 persona；该分工未在本链档面（ENGINEERING-MODE / PROMPT-SYSTEM）落档 + `PROMPT-SYSTEM.md` §2.7 #13 抵牾（修正轮 #8） | **RF-2** |
| 9 | 设计确认门 A⊃B | 已实落 | A = §2.15 A2 修订路径；B = §2.2 step 3–4 评审节点 | — |
| 10 | 文档写权分工 | **部分** | D1/A2 表在位；`README.md` / `AGENTS.md` / §2.1 残留过期限定 | **RF-3** |
| 11 | 文档更新纪律 | 已实落 | D1–D7 双源 + §2.19 + 机械校验（AC28/T41）；计数/状态登记面归 RF-5 | **RF-5**（登记面） |
| 12 | 勾销归属（批次档 §6） | **部分** | 设计档/persona/README 面已对；纪律层模板块 4 面残留「实现后验收标准逐条勾销」 | **RF-1** |
| FR9 | 角色三段链定义/分工 | **部分** | 角色/流程/机械面在位；§2.1 表两行 + 「落地时核销项」未执行（对账快照——修复 = RF-3/RF-5，本批已落） | **RF-3/RF-5** |

**判定计数**：已实落 9（#1–#7 · #9 · #11）· 部分 4（#8 · #10 · #12 · FR9）· **未落 0**。

#### 2.28.3 接口契约——提示词面变更流程（本批落档的流程契约）

**唯一形态**：**eng-designer 起草逐字 → 主 agent 确认（内容权） → eng-coder 机械落笔**（落笔走正常链：设计评审 → 用户批准 → eng-coder；照抄不解释、不裁量）。

- 依据：需求 §1.5 #8 注（内容权；落笔仍走正常链；`src/prompts/*.md` 仍是产品代码——FR1 不变）+ #10 + D1。
- 与 D1 的相容性（本批 Q5 核对）：D1「提示词 = 主 agent 内容权 + eng-coder 落笔」为**权利归属**；起草/确认/落笔为**分工步骤**——归属 ≠ 分工（同 `ADVISOR-CONVERGENCE.md` §13.8 既有裁法——修正轮 #5：§13.9 为后续登记项）。
- 与双端纪律的相容性：4 面（CLI src/中文权威 + VSC src/中文权威）**各端独立落笔、语义同源**；不做 byte-identical 硬一致；差异如实上报（多实现面纪律——纪律层文档规范节）。
- 落档形态：本设计 §2.28.4 各条 = 逐字草案（照抄件）；落笔批「文本 + 断言同批」（锚句变更永不静默——`PROMPT-SYSTEM.md` §2.7 #12）。

#### 2.28.4 差异面收口（RF-1–RF-6——逐字草案 + 完整修复路径）

**RF-1 勾销口径（需求 #12）——4 面**（CLI/VSC × src/中文权威 `discipline-engineering.md`）
- 定位：设计文档模板细化 →「变更记录」行尾句。
- 现句（删除——4 面同文）：`实现后验收标准逐条勾销。`
- 替句（逐字——4 面同文；修正轮 #1——删归因注：`PROMPT-SYSTEM.md` §2.7 #15 口径）：`实现后验收勾销落批次档 §6（设计档内不写勾销状态）。`
- 排程：提示词面（父侧排程/协调——与在途链同触 `discipline-engineering.md` 时由调度器按文件域串行）。

**RF-2 内容权与提示词流程（需求 #8/#10）——父侧排程**
- (a) `docs/requirements/PROMPT-SYSTEM.md` §2.7 #13——修正逐字稿（替换现段；保留「变更走批」首句，其下改写）：

  13. **变更走批**：提示词内容变更 = 设计批评审 + 批准，不走"顺手改"；每文件头部注本槽位与消费方
      ——**变更流程界定（用户裁定 2026-09-10；口径 = `ENGINEERING-MODE.md` §1.5 #8/#10）**：提示词文件
      （`src/prompts/*.md`）**仍是产品代码**（FR1 口径不变）——**内容权 = 主 agent**（逐字文本由它定，
      它就是设计的一部分）；**落笔走正常链**（设计评审 → 用户批准 → eng-coder），起草分工 = eng-designer
      起草逐字 → 主 agent 确认 → eng-coder 机械落笔（流程详述 = `../design/ENGINEERING-MODE.md` §2.28.3）。
      "不经设计流程"指不经 eng-designer 的**需求/设计档**流程（提示词是产品方针，非设计方案）——**不**指
      绕过门禁。装配代码（setup.mjs/prompt-overlays.mjs 等）= 代码，工程模式实现链不变。

- (b) 同档 §8：标题「（需求——2026-09-10 用户裁定；待设计）」→「（需求——2026-09-10 用户裁定；**已设计 + 已实现**——第 2 批 CLI / 第 5 批 VSC）」；§8 状态行同改；机制权威源行「§2.1 目标态注」→「§2.1 三段链表 + §2.15/§2.28」；§8 变更记录 2026-09-10 行（as-of :301）「9 条裁定」→「§1.5 裁定清单」（修正轮 #2——「§8.1 末行」指针与磁盘不符，实际命中行 = 变更记录）；§8.2 过渡例外 → 闭合注（与需求档 §1.5 同口径，引 a 案）。
- (c) 同档 §5 结构债第 1 条（「工程模式现拼 engineering.md（ARCHITECT）…」）→ 核销注（槽位化已交付，PROMPT-SYSTEM 施工①③）。
- 排程：父侧排程（不在本批写域——修正稿由主 agent 确认后落笔；TODO 在案条目随落笔核销）。

**RF-3 作者归属（需求 #10/FR9）**
- (a) `docs/README.md` §1 目录行——「requirements/<板块>.md ← 需求层（**eng-designer 产物**；过渡期由主 agent 代行——三层归属与迁移规则见 §3）」→ 删「过渡期由主 agent 代行」限定。
- (b) 同档 §3.1 作者表——「| 需求层 | … | eng-designer（过渡期主 agent 代行） |」→「| 需求层 | … | eng-designer |」。
- (c) `AGENTS.md`（本仓根）——整句替换：现句「**需求基线**：需求层 `docs/requirements/`（主 agent·产品经理产物）+ 设计层 `docs/design/`（eng-designer 产物）+ 用户对话。」→ 替句「**需求基线**：需求层 `docs/requirements/` + 设计层 `docs/design/`（均 **eng-designer 产物**——写稿权唯一；需求讨论/登记在会话面）+ 用户对话。」
- (d) 设计档 §2.1 + 需求档 §1.6 落地注——**本批已落**。
- 排程：(a)(b)(c) 落笔（README 与 T40 断言同批；AGENTS.md 归父侧维护面）；(d) 已落。

**RF-4 子代理提示词角色句（需求 #1/#3）——提示词面（修正轮 #4——EN + 中文权威均逐字）**
- (a) `persona-eng-coder.md` 身份句 4 面——EN 现句
  `The parent agent is the architect: it provides design documents, file lists, and acceptance criteria. Your role is implementation.` → EN 替句（逐字）：
  `The parent agent is the product manager and flow orchestrator: it hands you the batch record §2 as your task book (design-doc references, file list, acceptance criteria) and the design token; the design document itself is authored by eng-designer. Your role is implementation.`
  zh 现句（中文权威 CLI/VSC 同文）`父代理是架构师：它提供设计文档、文件清单和验收标准。你的角色是实现。` → zh 替句（逐字）：
  `父代理是产品经理与流程编排者：它把批次档 §2 作为任务书交给你（设计档引用、文件清单、验收标准），以及设计 token；设计文档本身由 eng-designer 执笔。你的角色是实现。`
- (b) 同档「边界：设计是权威规格」首句——EN 现句 `The parent agent provided a design document. Read it, follow it. Do not deviate.` → EN 替句（逐字）
  `Your task book references the design document — the authoritative spec. Read it, follow it. Do not deviate.`；zh 现句 `父代理提供了设计文档。通读它，遵循它。不得偏离。` → zh 替句（逐字）
  `任务书引用了设计文档——权威规格。通读它，遵循它。不得偏离。`
- (c) `persona-eng-coder.md`（VSC 仓）收尾自审第 6 条 ×2 面——EN 现句 `6. Update the affected design-doc sections your diff touches — …`（含粘连断行 `…rot otherwise) Your last message…`）→ EN 替句（逐字）：
  `6. Report any design-doc drift your diff touches (module map / affected-files table) in your delivery report — do not edit design docs yourself; they are authored by eng-designer.`
  （粘连修复：`Your last message IS the report the parent sees — make it complete:` 断开起新行——只报告、不修改）；zh 现句 `⑥ 受影响的设计档章节随 diff 更新（模块地图/受影响文件表）` → zh 替句（逐字）：
  `⑥ diff 触及的设计档漂移（模块地图/受影响文件表）写交付报告——不修改设计档；设计档由 eng-designer 执笔`
- (d) `discipline-engineering.md` 头注 consumers 4 面——补 eng-designer：EN `eng-coder subagent — both engineering-mode assemblies` → `eng-coder + eng-designer subagents — all engineering-mode assemblies`（逐字）；zh `eng-coder 子代理——全部工程模式装配` → `eng-coder + eng-designer 子代理——全部工程模式装配`（逐字）。
- 排程：提示词面（父侧排程/协调）。

**RF-5 登记面（需求 #11——D3/D7）**
- (a) 需求档（本批已落）：header 状态行 · §1.5 收口块 · §1.6 落地注 · §1.17 落地注。
- (b) 设计档（本批已落）：§2.1 三段链目标态 + 核销注 · §2.2 step5 sample 补 `batchDoc` · §2.6 角色名 · §2.15 计数口径/现行对账指针/A2 指针修正 · §2.16 过渡期注核销 · §5 模式门注。
- (c) `ENGINEERING-MODE.md`（VSC 仓）——头注「METHODOLOGY 驱动」· §1 槽位清单 · §5 角色 enum + 运行期文案 · §7 装配句 · §8 受影响文件表（五处陈旧面）——跨仓，父侧排程。
- 排程：(a)(b) 已落；(c) 跨仓父侧排程。

**RF-6 回归锁（FR19 + 需求 #11 可机判）**
- CLI：`test/eng-designer-role.test.mjs`（T40 断言更新——README 口径「过渡期主 agent 代行」零命中）· `test/prompts-dual-source.test.mjs`（**新增断言**——勾销旧句零命中 + 替句子串在位）（修正轮 #7）。
- VSC：`test/prompts-mirror-anchors.test.mjs`（VSC 仓）（**新增断言**——勾销句 · VSC 自审第 6 条零命中 · 身份句子串）（修正轮 #7——同前，措辞统一）。
- 口径：断言随文本同批落（锚句变更永不静默）。

#### 2.28.5 方案选型与关键决策

| # | 决策点 | 候选 | 选定 | 否决理由 |
|---|---|---|---|---|
| D1 | 差异修法载体 | A 提示词面逐字修 + 文档面收口 · B 只改文档 · C 大范围重写 | **A** | B：文档对 agent 无执行力（§1.8 教训）；C：超需（差异为残留级） |
| D2 | 勾销句修法 | A 就地改述（指向批次档 §6）· B 整句删除 · C 整节重写 | **A** | B：模板句位留空（读者追问勾销去哪）；C：超需 |
| D3 | 内容权抵牾收口（本批 Q4） | A 以 §1.5 #8/#10 为准修 #13 · B 以 #13 为准改 §1.5 · C 两存加互指注 | **A** | B：同日澄清注明言「落笔仍走正常链」（避免与 FR1 冲突）+ 实操全按 #8/#10；C：两说并存违 D2，评审必撞 |
| D4 | persona-eng-coder 身份句 | A 就地改述（产品经理 + 任务书 + designer 执笔）· B 删句 · C 不改 | **A** | B：身份信息有用；C：与主 agent 新身份互斥（同机制两说） |
| D5 | VSC 收尾自审第 6 条 | A 改述「只报告、不修改」· B 删除 · C 保留 | **A** | B：drift 上报义务的显式化丢失；C：与「eng-coder 永不编辑设计文档」互斥 |
| D6 | 收口范围 | A 只收角色重定义直接差异 · B 顺带清 METHODOLOGY 残留等相邻项 | **A** | B：范围蔓延（相邻项各有归属批次/父侧定时点——登记不并批） |

> D3 结论：**并入本批收口**——本批主题即提示词面流程（起草 → 确认 → 落笔），#13 旧表述正是其对立面；不收口 = 本批自带未决矛盾（评审必撞）；修法成本 = 一处文本 + §8 同步（登记面随落笔核销）。

#### 2.28.6 受影响文件（as-of 2026-09-11——行数口径 = 读工具行数）

| 文件（端） | as-of | 增量 | 条目 | 落笔 |
|---|---|---|---|---|
| `src/prompts/discipline-engineering.md`（CLI） | 227 | ≤±5 | RF-1 · RF-4d | 提示词面 |
| `docs/design/prompts/discipline-engineering.md`（CLI） | 155 | ≤±5 | RF-1 · RF-4d | 提示词面 |
| `src/prompts/discipline-engineering.md`（VSC 仓） | 234 | ≤±5 | RF-1 · RF-4d | 提示词面 |
| `docs/design/prompts/discipline-engineering.md`（VSC 仓） | 161 | ≤±5 | RF-1 · RF-4d | 提示词面 |
| `src/prompts/persona-eng-coder.md`（CLI） | 37 | ≤±5 | RF-4a/4b | 提示词面 |
| `docs/design/prompts/persona-eng-coder.md`（CLI） | 37 | ≤±5 | RF-4a/4b | 提示词面 |
| `src/prompts/persona-eng-coder.md`（VSC 仓） | 50 | ≤±8 | RF-4a/4b/4c | 提示词面 |
| `docs/design/prompts/persona-eng-coder.md`（VSC 仓） | 46 | ≤±8 | RF-4a/4b/4c | 提示词面 |
| `docs/README.md`（CLI） | 240 | ≤±3 | RF-3a/3b | 落笔（随 T40） |
| `AGENTS.md`（CLI 仓根） | 69 | ≤±2 | RF-3c | 落笔（父侧维护面） |
| `docs/requirements/PROMPT-SYSTEM.md`（CLI） | 308 | ≤±14 | RF-2a/2b/2c | 父侧排程 |
| `docs/design/ENGINEERING-MODE.md`（VSC 仓） | 206 | ≤±10 | RF-5c | 父侧排程（跨仓） |
| `docs/requirements/ENGINEERING-MODE.md`（CLI） | 761 | +17（实测 778） | RF-5a + 收口块 | **本批已落** |
| `docs/design/ENGINEERING-MODE.md`（CLI） | 1762 | +163（实测 1925） | §2.28 + 登记面各节 | **本批已落** |
| `test/eng-designer-role.test.mjs`（CLI） | 316 | ≤±6 | RF-6（T40 更新） | 随 RF-3 |
| `test/prompts-dual-source.test.mjs`（CLI） | 175 | +~25 | RF-6（勾销句断言） | 随 RF-1 |
| `test/prompts-mirror-anchors.test.mjs`（VSC 仓） | 231 | +~25 | RF-6（勾销/自审句断言） | 随 RF-1/RF-4 |

> 档位注：全部为文档/提示词/测试类；无源文件触发档位线（本批零代码改动）。设计档本体（1762 行）为架构级文档——本次实测 +163（≤±200 预算内——同档折叠惯例（§2.10）），不触发拆分。`test/eng-designer-role.test.mjs` 316 行 = >300 建议档——本批单点更新（T40 更新，+≤6）不拆（修正轮 #6）。

#### 2.28.7 边界（不做什么）

- 本批**零代码改动**（无 `src/**` 代码面；提示词文本按排程落笔）。
- 不碰零碰区（§2.26/§2.27/AC45–AC60）· `docs/TODO.md` 只读（§1 边界）· 他链在途档。
- 不并批相邻项：第 9 批设计登记面（§2.2/§2.5/§2.6/§2.9 时序规则登记——父侧定时点）· 第 4 批 C 工具遗留文档同步 · METHODOLOGY 退役残留（含 `discipline-engineering.md`（VSC 仓）R24 死指针）· TODO 旧 VSC 镜像登记行核销。
- 不加机械门/不改 `dispatch`（写域纪律维持提示词级——用户裁定）。
- 不做跨端 byte-identical 硬一致；不重写 §2.15 历史表（as-of 保留 + 指针）。
- 不发明需求（本批无用户新裁定项——新增文本仅源自既有裁定与实践口径）。

#### 2.28.8 UI/交互决策与回指

- **UI/交互：N/A**——本批为文档/提示词文本收口，无界面面；无 `open` 项。
- 验收标准 = §3.1 AC61–AC66（逐条回指 RF-1–RF-6 / 需求 §1.5）；用例 = §3.2 T77–T82。

### 2.29 文档 / 产品文案卫生（第 22 批——2026-09-11）

> 来源：TODO 全量审计（id=28）「该落地」清单批 C（6 条）+ 用户 13:12「批C开工」；批次档 `../batches/2026-09-11-DOC-HYGIENE.md` §1。
> 范围裁定：原建议 7 条剔除 C#145（设计档超宽折行——已由第 14 批承接，不重复派工）。本批 = **纯文档 / 文案卫生**——
> 不改行为与语义（C1 仅改描述文本；C2/C4 仅注释与描述串内锚文本；spec 驱动真值面零改）。

#### 2.29.1 问题陈述（6 条现状——审计 id=28 一手实测复核）

| # | 现状缺陷 | 现场锚（as-of 2026-09-11） |
|---|---|---|
| C1 | `read_image` 工具描述（**模型可见面**）事实错误：点名「DeepSeek V4, GLM-5」为纯文本模型——实测 `deepseek-flash` / `deepseek-v4-flash` / `deepseek-v4-flash-vision-exp` 均 `multimodal: true`（仅 `deepseek-v4-pro` 非视觉）；能力门为 spec 驱动 | `thincoder-core/tool-docs/read_image.md:8` vs `src/model-specs.mjs:33/38/40`；门 `thincoder-core/tools/file.mjs:168` |
| C2 | `§24` 旧锚残留（AGENT-LOOP 重排后旧节号不存 = 断链）：CLI `src/**` 实测 **28 行 / 29 处 token / 18 文件**（审计估「25 处」——以逐行枚举为准，D3） | 逐行见 §2.29.3 |
| C3 | `AGENT-LOOP（VSC 仓）§7` 两句仍述 C' 态（busy「输入禁用」/ readOnly 锁）——与 INPUT-LOCK-BEHAVIOR-REVISED 及本端实现矛盾 | `AGENT-LOOP（VSC 仓）:290-291` / `:322-325`；实现 `webview/loading.js:38`（VSC 仓）（readOnly 锁移除）+ `webview/send.js`（VSC 仓） 出口守卫 + `locales/{zh,en}.json:13`（占位符定稿串） |
| C4 | `wrapped-spawn.mjs:1` 注释指向已归档档 `docs/design/TUI-STDERR-CAPTURE.md`（真断链） | `src/tui/wrapped-spawn.mjs:1`；归档实况 `docs/design/_archive/TUI-STDERR-CAPTURE.md` |
| C5 | 需求档 5 点位未同步（第 4 批 C 遗留 ②；第 5 项 N3 为第 5 批评审 #9 委托项） | `docs/requirements/ENGINEERING-MODE.md` §1.12 段表 / §1.11 B9 / §1.16 F1 / §1.16 N2 / §1.17 N3 |
| C6 | CLI 仓 `.thincoder/index/`（`manifest.json` 117,135 B + `vectors.bin` 4,395,208 B）为 DB 化前死产物（mtime 2026-07-29；`src/**`+`bin/**` 零读写点；活体索引 = `~/.thincoder/memory.db`） | `thincoder-cli/.thincoder/index/`；`.gitignore:18`（未跟踪） |

**契约面（本节裁定即实现规格）**：C1/C3/C4 的逐字替句 + C2 的逐行映射表 + C5 的点位表——实现与评审的核对以此为准。

#### 2.29.2 C1 描述面同步（`thincoder-core/tool-docs/read_image.md:8`——逐字替句）

**修法方向（审计）**：改「能力以 spec 为准」+ 去具体模型名。

| # | 候选 | 判据（防再漂移 / 模型可读 / 改动面） | 结论 |
|---|---|---|---|
| 1 | 保留示例（名单更新为「正确」名单） | 名单随模型上下线必再漂（本缺陷即第 6 批 deepseek 放行后漂移的产物——同形态复发） | 否决 |
| 2 | **去具体模型名 + 能力以 spec 为准** | 唯一不随模型清单变化的表述；错误路径由 `file.mjs` 门文案兜底（含引导句——零改） | **选定** |

**定稿替句（逐字——整行替换 `thincoder-core/tool-docs/read_image.md:8`）**：

`- This tool only works with models that support vision/image input (capability is spec-driven — the model spec decides, not a hardcoded list). Models without vision support will receive an error — except svg, which needs no vision support since it is read as text.`

**要点**：① 去两个名单纯（「Kimi K3, Qwen3.8, MiniMax M3, GLM-5.3-Flash」与「DeepSeek V4, GLM-5」= 漂移源）；
② svg 例外子句保留（语义零改——svg 走文本源码路径）；③ **工具名示例不新增**（「This tool」在工具描述上下文内自明；
`read_image` 字样已在首行与 `file.mjs` 错误/引导文案在位）——去名单纯、不引入新示例，与第 20 批「描述面同步」同族；
④ `file.mjs` 门与错误文案（spec 驱动真值面）本批零改。

#### 2.29.3 C2 旧锚清理（`§24`→`§11.x`——逐行映射表）

**口径（映射权威 = POOL-CONFIG-UNIFIED F-7）**：`§24` → **`§11.x` 粒度**（非裸 `§11`）；`D-24x` 标签保留（与已更新行同形——
`thincoder-core/config.mjs:77`「§11.1 D-24a/R14 + §11.2 R13」）。三域：

- `D-24a` / `R14` / 分域池 → **§11.1**（角色分池 + 可配置）；
- `D-24b` / `R13` / async advisor 收敛 → **§11.2**（async advisor——独立后台评审池）；
- `D-24c` / `R15` / 排队合并（已废弃） → **§11.3**（排队用户指令合并——废弃记录）。

**逐行映射表（28 行 / 29 处 token / 18 文件——键控 = 文件 + 旧锚串；行号 as-of 2026-09-11，实现时以 grep 重扫为准）**：

| # | 文件:行（as-of） | 旧锚 → 新锚 | 域 |
|---|---|---|---|
| 1 | `thincoder-core/advisor/messages.mjs:133` | `§24 D-24b` → `§11.2 D-24b` | B |
| 2 | `thincoder-core/advisor/run.mjs:22` | `§24 D-24b` → `§11.2 D-24b` | B |
| 3 | `thincoder-core/advisor/run.mjs:145` | `§24 D-24b ③` → `§11.2 D-24b ③` | B |
| 4 | `thincoder-core/advisor.mjs:270` | `§24 D-24b` → `§11.2 D-24b` | B |
| 5 | `src/agent/completion.mjs:123` | `§24 D-24b` → `§11.2 D-24b` | B |
| 6 | `src/agent/dispatch.mjs:390` | `§24 D-24b` → `§11.2 D-24b` | B |
| 7 | `src/agent/record-results.mjs:103` | `§24 D-24b` → `§11.2 D-24b` | B |
| 8 | `thincoder-core/agent/run-stages.mjs:166` | `§24 D-24b` → `§11.2 D-24b` | B |
| 9 | `thincoder-core/agent-tools/eng.mjs:37` | `§24 D-24b` → `§11.2 D-24b` | B |
| 10 | `thincoder-core/agent-tools/eng.mjs:55` | `§24 D-24b` → `§11.2 D-24b` | B |
| 11 | `thincoder-core/agent-tools/escalate-async.mjs:155` | `§24 D-24a` → `§11.1 D-24a` | A |
| 12 | `thincoder-core/agent-tools/subagent-actions.mjs:116` | `§24 D-24b` → `§11.2 D-24b` | B |
| 13 | `thincoder-core/agent-tools/subagent-run.mjs:39` | `§24 D-24a/R14` → `§11.1 D-24a/R14` | A |
| 14 | `thincoder-core/agent-tools/subagent-run.mjs:55` | `§24 D-24a/R14` → `§11.1 D-24a/R14` | A |
| 15 | `thincoder-core/agent-tools/subagent-run.mjs:83` | `§24 D-24a` → `§11.1 D-24a` | A |
| 16 | `thincoder-core/agent-tools/subagent-scheduler.mjs:341` | `§24 D-24a/R14` → `§11.1 D-24a/R14` | A |
| 17 | `thincoder-core/agent-tools/subagent-scheduler.mjs:346` | `§24 D-24a（R14）` → `§11.1 D-24a（R14）` | A |
| 18 | `thincoder-core/agent-tools/subagent.mjs:132`（token ①） | `§15/§18/§24` → `§15/§18/§11.1` | A |
| 19 | `thincoder-core/agent-tools/subagent.mjs:132`（token ②） | `per role domain (AGENT-LOOP.md` 句内 `§24` → `§11.1` | A |
| 20 | `thincoder-core/agent-tools/subagent.mjs:390` | `§24 拆分轮` → `§11.1 拆分轮` | A |
| 21 | `thincoder-core/agent.mjs:71` | `§24 D-24b` → `§11.2 D-24b` | B |
| 22 | `thincoder-core/agent.mjs:72` | `§24 D-24b` → `§11.2 D-24b` | B |
| 23 | `src/tui/cmd-eng.mjs:35` | `§24 D-24b` → `§11.2 D-24b` | B |
| 24 | `src/tui/mouse.mjs:202` | `§24 D-24b` → `§11.2 D-24b` | B |
| 25 | `src/tui/subagent-panel.mjs:59` | `§24 D-24b` → `§11.2 D-24b` | B |
| 26 | `src/tui/suspension-drive.mjs:25` | `§24 D-24c` → `§11.3 D-24c` | C |
| 27 | `src/tui/suspension-drive.mjs:30` | `§24 D-24b` → `§11.2 D-24b` | B |
| 28 | `src/tui/suspension-drive.mjs:77` | `§24 D-24b` → `§11.2 D-24b` | B |
| 29 | `src/tui/suspension-drive.mjs:133` | `§24 D-24b` → `§11.2 D-24b` | B |

**执行面**：替换仅改锚文本（`§24`→`§11.x`）——其余逐字不动；`thincoder-core/agent-tools/subagent.mjs:132` 为**描述串内锚文本**（模型可见面——
无语义变化、零行为）。
**同族观察（出批——登记不并修）**：① 同描述/同文件内另有同代旧编号锚（`§15/§18` 串、`§19.x`、`§20`——实测
`thincoder-core/agent-tools/subagent.mjs` 内 `§19` 21 处 / `§20` 5 处）——不属 C2（`§24`）范围，建议另立勘察做一次全描述重锚；
② `test/advisor-description.test.mjs:18`（已退场——TEST-LIFECYCLE）的「旧 §24 已更新」为**变更注**（非断链）——保留；`docs/**` 记史面照留；
③ VSC 仓 `src/**` `§24` 残留（实测 39 处 / 13 文件）——本批 CLI 单端，出批（TODO「双端」余 VSC 面另议）。

#### 2.29.4 C3 机制正文同步（`AGENT-LOOP（VSC 仓）§7`——两句修订，已落）

**事实核对（实现已按 INPUT-LOCK-BEHAVIOR-REVISED 落地）**：`webview/loading.js:38`（VSC 仓） `readOnly = false`（锁移除——始终可编辑）；
`webview/send.js`（VSC 仓） 出口守卫 busy 拒发（文本保留不吞）；占位符定稿串 = `input.busyPlaceholder`「主会话处理中——Enter 提交禁用——可继续输入」
（`locales/{zh,en}.json:13` 同串）。原文两句为 C' 态残留（busy 输入禁用 + readOnly）。

**修订（逐字两处——已落磁盘；本节行号 as-of 2026-09-11——该档活跃，键控以句内容为准）**：

- 位①（busy 判据段「单一判据）提交拒收」句；as-of `:293-295`）：`单一判据）输入禁用**（INPUT-LOCK-ASYNC C'——…——webview 输入锁见下方 UI 段）` →
  `单一判据）提交拒收**（INPUT-LOCK-BEHAVIOR-REVISED——2026-09-09——**输入不禁**（可录入回显）——Enter/发送拒发不排队——webview 输入面见下方 UI 段）`；
- 位②（挂起 UI 段「输入门禁 = busy…派生」句；as-of `:329-332`）：`**输入锁 = busy…派生**（loading.js——readOnly + busy 占位符——…中断模态豁免锁…）` →
  `**输入门禁 = busy…派生**（loading.js——**readOnly 锁已撤**（可录入）——busy 占位符「主会话处理中——Enter 提交禁用——可继续输入」——…中断模态——注入通道在门禁前…）`；
- 档头加一行变更注（`2026-09-11：§7 输入门禁两句按 INPUT-LOCK-BEHAVIOR-REVISED 同步——第 22 批 C3`）。

**UI 面**：占位符定稿串照实（与实现同串）——**无 open 项**。
**范围边界（不并修——登记；修正轮 #3）**：模块地图行 `INPUT-LOCK-ASYNC（C'` 标签两处（chat-panel / suspension 行——as-of `:72`/`:73`）、
中止语义（F-6）行 C' 标签（as-of `:314-315`）= 机制/裁决**指针**、
无行为断言——不属 C3 断言面（TODO 范围 = busy 判据段旧句 / 挂起 UI 段旧句两处——as-of `:293` / `:329`）。

#### 2.29.5 C4 注释断链（处置择一——去路径，待 coder）

| # | 候选 | 判据（可解析 / 不开先例 / 同族一致 / 现状依据边界） | 结论 |
|---|---|---|---|
| 1 | 改指归档档（`docs/design/_archive/TUI-STDERR-CAPTURE.md`） | 指针可解析；但 src 全仓 `_archive/` 零引用（开先例），且产品注释指冻结档（DOC 地图归档面「不作现状依据」） | 否决 |
| 2 | **去路径（机制名保留）** | 同机制姊妹引用已是名称形态（`src/crash-reports.mjs:35`「TUI-STDERR-CAPTURE F-2」零路径）——两处同形；名称可 grep 回溯 | **选定** |

**定稿改动（逐字）**：`src/tui/wrapped-spawn.mjs:1` 删去 `（docs/design/TUI-STDERR-CAPTURE.md——已归档（DOC-REORG 批））`——首行变为
`/** wrapped-spawn.mjs — TUI-STDERR-CAPTURE F-1/F-3：包装父`（其余注释逐字不动）。
**后续触发（登记）**：`TUI.md` §1 已登记 wrapped-spawn 补登随「后续 TUI 文档维护批」——届时注释可再改指 `TUI.md` 权威节。

#### 2.29.6 C5 需求档同步（5 点位——已落）

第 4 批 C 遗留 ② 收口（§1 记「4 项」= 原措辞；第 5 项 N3 为第 5 批评审 #9 委托——设计档 §2.21 as-of 行含，
`2026-09-10-VSC-MIRROR（VSC 仓）` §5:93 登记——同位同源并入，计数按 5 点位，D3）：

| # | 点位 | 改法（已落） | 判定子串（AC72） |
|---|---|---|---|
| ① | §1.12 段作者表 | 加第 3 列「写入手段」（6 行：§2/§3/§5 = `batch_segment`（条件与身份限定照 §2.20.3）；§1/§4/§6 = 普通文档写） | `写入手段` · `batch_segment` |
| ② | §1.11 B9 行 | documents 列补「§3 段不在评审对象清单内」；怎么传列补「设计评审带 `batchDoc`——有批次档在飞时必传；工具侧 = 若传则须可读」 | `batchDoc` · `若传则须可读` |
| ③ | §1.16 F1 | 追加「评审侧口径（实施同步）」句（若传则须可读——非必传；不传不挂载、评审照常跑） | `评审侧口径` · `若传则须可读` |
| ④ | §1.16 N2 | 「（非被审文档）」→「§3 段不在评审对象清单内（B9 只含批次档 §2）」——**不写「批次档非被审文档」**（§2.20.4 口径） | `§3 段不在评审对象清单内` |
| ⑤ | §1.17 N3 | 「双源 29 文件」→「双源 15+15=30 档之宿主档」（第 5 批评审 #9 委托） | `15+15=30` · N3 行 `29 文件` 零命中 |

**边界（登记）**：§1.17 勘察快照块内另有一处「双源 29 文件」（落地注覆盖的 as-of 表述）——不改（快照如实）；
§1.12「实现差量」登记段残句（与新增「写入手段」列直接矛盾——advisor 写权面）——**C5 附注项并落**（转为已落地注；不另计条目）。

#### 2.29.7 C6 死产物清理（删除面 + 先决检查 + 归属）

- **删除面（路径级——1 目录 / 2 文件）**：`thincoder-cli/.thincoder/index/`（`manifest.json` + `vectors.bin`）整目录删除。
- **先决检查（fail-closed——执行时逐条实跑，任一不成立 → 停下报告，不删）**：① `git ls-files .thincoder/index` 为空（未跟踪——设计期已验）；
  ② `.gitignore` 命中（`:18` `.thincoder/index/`——已验）；③ `src/`+`bin/` 对该目录/文件名零引用（实测 0 命中——已验）。
- **归属裁定 = eng-coder**（与 C1/C2/C4 同批一次交付/一次核验；删除为未跟踪态机械动作——不涉设计取舍）；VSC 仓 `.thincoder/index/`（活体索引）**零碰**。
- **范围不扩**：单目录——不扫其他 `.thincoder/` 面（`advisor.md` / `skills/` 等为跟踪资产，零碰）。

#### 2.29.8 受影响文件全清单（行数批前基准 / 预计增量 / 分工）

行数口径（修正轮 #1）：本列 = **批前基准**（设计期 as-of 2026-09-11 实测）——「已落」行的当前值 = 批前 + 增量列（均在声明上限内）；本表不逐次回写，收口核数按批前/批后差。

| 文件 | 行数（批前基准） | 预计增量 | 改动 | 执行（本批） |
|---|---|---|---|---|
| `docs/requirements/ENGINEERING-MODE.md` | 786 | ≤+24 | C5 五点位 + §1.15 批块 | eng-designer（**已落**） |
| `docs/design/ENGINEERING-MODE.md` | 1986 | ≤+240 | §2.29 + §3.1 AC68–AC74 + §3.2 T84–T91 + 变更记录 | eng-designer（**已落**） |
| `AGENT-LOOP.md`（VSC 仓 `docs/design/`） | 521 | ≤+8 | C3 两句 + 档头变更注 | eng-designer（**已落**） |
| `docs/TODO.md` | 173 | ±6 | 6 条 status 推进（C1–C6 六行——键控 = 行内「第 22 批」注记：`:92` C6 · `:93` C4 · `:146` C1 · `:148` C5 · `:164` C2 · `:168` C3；行号 as-of——修正轮 #2） | eng-designer（**已落**） |
| `thincoder-core/tool-docs/read_image.md` | 9 | 0（整行替换） | C1 替句 | eng-coder |
| `src/tui/wrapped-spawn.mjs` | 39 | 0（串删除） | C4 去路径 | eng-coder |
| `src/**`（C2——18 文件，行数见下） | — | 0（逐处替换） | `§24`→`§11.x`（28 行 / 29 处） | eng-coder |
| `.thincoder/index/`（目录——2 文件） | — | -2 文件（-4.5 MB） | C6 删除 | eng-coder |
| `batches/2026-09-11-DOC-HYGIENE.md` | — | +§2 / §5 | 任务书 / 交付记录 | designer / coder |

C2 十八文件行数（as-of）：`advisor/messages` 300 · `advisor/run` 239 · `advisor.mjs` 291 · `agent/completion` 147 ·
`agent/dispatch` 490 · `agent/record-results` 175 · `agent/run-stages` 228 · `agent-tools/eng` 68 · `agent-tools/escalate-async` 287 ·
`agent-tools/subagent-actions` 479 · `agent-tools/subagent-run` 203 · `agent-tools/subagent-scheduler` 392 · `agent-tools/subagent` 403 ·
`agent.mjs` 401 · `tui/cmd-eng` 79 · `tui/mouse` 250 · `tui/subagent-panel` 150 · `tui/suspension-drive` 298。
**档位注**：>300 五档（dispatch 490 / subagent-actions 479 / subagent-scheduler 392 / subagent 403 / agent.mjs 401）
均为**注释/描述串文本替换**（零逻辑、零净增）——不触发拆分；贴线档 `messages.mjs`（300）同为零净增。

#### 2.29.9 关键决策记录（含否决备选）

| # | 决策 | 否决备选 | 理由 |
|---|---|---|---|
| D-29a | C1 去模型名 + spec 口径 | 更新名单 / 保留原句 | 名单即漂移源（本缺陷形态复发）；spec 驱动为单一真值面 |
| D-29b | C2 映射 `§11.x` 粒度 + 保留 `D-24x` 标签 | 裸 `§11` / 删 `D-24x` | F-7 权威；与已更新行（`thincoder-core/config.mjs:77`）同形 |
| D-29c | C3 局部修订两句 | 整段重写 / 不修 | 改动限于两句、不涉他处；整段重写越权（该档他链面内容） |
| D-29d | C4 去路径 | 归档前缀改指 | 同族同形（`crash-reports.mjs:35`）；不开 `_archive` 先例；归档面「不作现状依据」 |
| D-29e | C5 含 N3（5 点位） | 只做 4 项 | 同位同源未完项（第 5 批评审委托）；计数与列表同改（D3） |
| D-29f | C6 归 eng-coder | 父侧执行 | 同批一次交付/一次核验；未跟踪态机械可判（先决检查 fail-closed） |
| D-29g | 判定面 = 一次性静态判据（不新增持久测试） | 新增 fail-when-present 测试 | 判据为「清理/同步」形态（非行为锁）；存量回归锁已覆盖核心面（`advisor-description.test.mjs` 断言 §11.2 锚在位、`prompts-async-guidance` 断言 §7.5 锚句）；CI 面零扩张 |

#### 2.29.10 边界（本批不做）与同族观察

- 不改任何行为/语义（C1 仅描述文本——spec 驱动真值面零改；C2/C4 仅注释与描述串内锚文本；C3 仅本端文档句）；
- 不碰 `src/prompts/**`（提示词 = 主 agent 内容权）；不建新档；不碰他链在途档（D5）；
- 出批登记：VSC 仓 `src/**` `§24` 残留（39 处 / 13 文件——另议）；`wrapped-spawn` 同族「约 12 处 `docs/design/` 前缀注释扫尾」；
  同描述旧编号锚全描述重锚（§2.29.3 观察①）；`thincoder-core/tool-docs/read_image.md:7` 的 API 列表（Kimi/Anthropic/OpenAI/Gemini）不在 C1 实证面；
  第 6 批遗留「deepseek-v4-pro 视觉复检」（TODO:145——触发 = 2026-09-14 后）不在本批。

### 2.30 台账提醒与可见面（LEDGER-SURFACE 批——2026-09-12；需求 §1.18 / FR24）

> 状态：设计 + 测试层已落档（2026-09-12，待设计评审）；实现未启动（design token 门）。
> 需求层 = `../requirements/ENGINEERING-MODE.md` §1.18（F1–F8 / N1–N2）；批次档 = `../batches/2026-09-12-LEDGER-SURFACE.md`。
> **行文本逐字契约 = §2.30.3.3**（实现面照抄，不得自行解释——多实现面规则 §1.12）。

#### 2.30.1 问题陈述与范围

**现状（一手实测）**：台账（需求档 §1.13）只有两个读面——`check-ledger`（L1–L3 形态机检，面向维护者）与
`--audit`（待处置清单——慢层、手动跑）；**没有任何主动可见面**。用户 2026-09-12 实测「从未见过任何提醒」：
两仓 40 条技术待办、触发字段 0/40、老化只活在 `--audit` 输出里。结果：未决项静默积压。

**本批目标**：给台账装三层可见面——**状态行标记**（常驻两数）· **明细行三面**（启动 / 收口 / 变化，落会话流）·
**VSC 状态栏增量**（item + tooltip）；**有可动作项才出声**（零噪音）；数字与形态**单源**（一处实现、三面同文）。

**范围**：CLI（TUI 状态行 + 流内行）+ VSC（状态栏 item + tooltip + chat 流）+ 收口行清单槽位 + 单源模块 + 测试。
**非目标**：台账内容治理（归档移档——收口划扫）· `check-ledger` L1–L3 语义（零改）· 新命令 / 工具面（否决在案）。

**用户裁定 R1–R6（批次档 §1）→ 需求条目映射**：R1→F1 · R2→F2 · R3→F4+F3 · R4→F3/F5/F6 · R5→F8 · R6→§2.30.6 边界（否决不得复活）。

#### 2.30.2 选型对比（七个决策点——被否决候选记否决理由）

**D1 数字单源落点**（需求设计约束 1）

| # | 候选 | 判据 | 取舍 | 结论 |
|---|---|---|---|---|
| 1 | 扩 `scripts/check-ledger.mjs` 为唯一实现 | 运行时可达性：npm `files=[bin/,src/,…]`（`package.json:22-28`）——**`scripts/` 不入包** | 装出来的 CLI 拿不到该模块；TUI 显示面无法消费 | **否决** |
| 2 | 新模块 `thincoder-core/ledger.mjs`（check-ledger 消费之） | 运行时可达 + 双端各自实现（N1 语义同源不共码） | check-ledger 的组扫描改 import 共享解析（L1–L3 语义零改——消费同一 `scanGroups`） | **选定** |
| 3 | 各面各写一份解析 | 单源约束 | 三处口径漂移（正是 FR18 收拢前的教训） | **否决** |

**D2 刷新模型**

| # | 候选 | 判据 | 取舍 | 结论 |
|---|---|---|---|---|
| 1 | 每帧现算 | 渲染路径零阻塞 | 每帧 git 子进程（老化需 blame）——不可行 | **否决** |
| 2 | 仅启动算一次 | 成本最低 | 长会话陈旧——本机制的意义即「变化可见」 | **否决** |
| 3 | 启动 + 周期（`REFRESH_MS=120s`）+ 事件（VSC 项目切换） | 成本有界（N2）+ 变化可捕获 | 常量固定；周期内变化延迟 ≤120s（台账写入低频，可接受） | **选定** |

**D3 变化行去重载体**（需求设计约束 3）

| # | 候选 | 判据 | 取舍 | 结论 |
|---|---|---|---|---|
| 1 | 会话内内存 | 零持久化 | 「首次越线」跨会话重报（每次启动重报 = 不是一次性） | **否决** |
| 2 | `~/.thincoder/ledger-notify.json`（configDir 同区——crash-reports） | 跨会话、跨端（同一台机器一份）；坏档降空 | 两进程并发写有丢更新窗口（后果 = 至多一次重报，非缺陷级） | **选定** |
| 3 | 写进仓库（如 `docs/.ledger-notify.json` 形态——已废：否决未采用） | 随仓可共享 | 污染用户仓库 + 需 gitignore + 对跨仓族不适用 | **否决** |

**D4 收口行载体**（需求设计约束 4）

| # | 候选 | 判据 | 取舍 | 结论 |
|---|---|---|---|---|
| 1 | 运行时自动检测「批次收口」 | 零人工 | 运行时无从知道收口时刻（收口 = 主 agent 的文档动作，无可观测信号） | **否决** |
| 2 | 新工具 / 新命令承载 | 形态整齐 | 否决面在案（`/todo` 已否决；本批自我约束「不新增工具/命令面」） | **否决** |
| 3 | 既有脚本 `--summary` 面 + 核销同步清单新槽位 | 复用既有命令面；输出即收口行 | 依赖主 agent 跑清单项（纪律面——§2.30.3.6 给逐字句） | **选定** |

**D5 VSC「当前项目」判据**（需求设计约束 5）

| # | 候选 | 判据 | 取舍 | 结论 |
|---|---|---|---|---|
| 1 | `_cwd()`（扩展的当前项目目录）向上 | 与扩展唯一「当前项目」概念一致（面板项目按钮同源） | 容器工作区（如 D:\teamcode）下无当前项目 → 标记不显（K6 观测） | **选定** |
| 2 | 活动编辑器文件目录向上 | 更贴「我在哪个仓」 | 同一产品出现第二个「当前项目」概念（与面板分叉）；多一个 `onDidChangeActiveTextEditor` 监听面 | **否决** |

**D6 VSC chat 行载体**

| # | 候选 | 判据 | 取舍 | 结论 |
|---|---|---|---|---|
| 1 | 新消息类型 `ledgerNotice` + 专用行元素 | 语义准；入 messages 容器（**可回看**——R4 要求） | 需 webview 新 case + 新小档 + CSS（~40 行） | **选定** |
| 2 | 复用 `error` 气泡 | 零新代码 | 语义错（非错误）；红色错误样式误导 | **否决** |
| 3 | 复用 `statusText`（状态行区） | 已有通道 | 非会话流——不可回看（违 R4「各落各自会话流」） | **否决** |

**D7 行文本语言**

| # | 候选 | 判据 | 取舍 | 结论 |
|---|---|---|---|---|
| 1 | 定点中文（两 locale 同文） | 同款同源（三面同字节）；台账词汇 = 需求档定义的中文术语（需求池 / 技术待办 / 老化） | 英 locale 下这几行为中文（产品其余 UI 走 i18n） | **选定** |
| 2 | i18n 键 + 双语 | 与产品 i18n 体系一致 | 翻译 = 第二词汇表 = 漂移源；且跨端「同款同源」字节面破损 | **否决** |

#### 2.30.3 接口契约

##### 2.30.3.1 单源模块与导出面

**CLI**：`thincoder-core/ledger.mjs`（新档——纯逻辑 + 文件 I/O，无 TUI 依赖）+ `src/tui/ledger-surface.mjs`（TUI 胶水）。
**VSC**：`src/ledger.mjs`（**独立实现、语义同源**——照 N1 双端纪律；原 import 禁令随两仓合并退役——`TWO-REPO-MERGE.md` §2.4 R14）+ `src/extension/ledger-surface.mjs`（扩展胶水）。

导出契约（两端同名同义；实现细节各端自持）：

| 导出 | 语义 |
|---|---|
| `AGING_DAYS=30` · `THRESHOLD_BOARD=2` · `THRESHOLD_POOL=3` · `REFRESH_MS=120000` · `NOTIFY_FILE` | 常量（口径 = 需求 §1.18；`REFRESH_MS` = N2 实现常量） |
| `findProject(anchor)` | 向上（含自身）最近含 `docs/TODO.md` 的目录 → `{root, ledger}` / `null` |
| `discoverFamily(anchor)` | `{current, projects}`——current = `findProject`；projects = current + 其同级含台账目录（current 缺 → 上下文目录向上最近「含台账子目录」者取其子目录） |
| `scanGroups(lines)` | `##` 组扫描 → `[{name,line,declared,entries:[{line,text}]}]`（**与 check-ledger L2/L3 同源**——解析唯一实现） |
| `summarizeLedger(project,{days,ageOf})` | 单项目 → `{name,root,ledger,pool,tech,aged,agedKeys,agedTitles,thresholdReached,boards,actionable}` |
| `formatMarker(scan)` / `formatDetailLine(scan)` | §2.30.3.3 逐字 |
| `planChangeLines(prev, summary)` | 纯函数——返回 `{lines, next}`（去重口径 §2.30.3.2） |
| `loadNotifyState(file)` / `saveNotifyState(file, state)` | 去重档 I/O（坏档 → 空态；写失败静默；temp + rename） |
| `blameAges(abs)` | 全档一次 `git blame --porcelain` → `Map<line,days>` / `null`（升级自 §2.24.9 的逐行 `blameDays`——供显示面批量用） |

##### 2.30.3.2 口径契约

- **计数 / 老化 / 阈值 / 可动作**：见需求 §1.18 口径节（D2——本节不重述）。
- **明细行集** = `{current} ∪ {可动作项目}`（发现序：current 在前，其余按目录名升序）；同项去重。
- **条目键派生**（状态档 `aged` 集元素；修正轮 #3）：键 = 条目行**归一化文本**——去行首 `- [ ] ` 前缀 + 去首尾空白 + 连续空白折叠为单空格。
  **位置无关**（跨行位移 / 同档他条编辑稳定）；**自身文本变更**（含 `status` 推进）= 键变 → 按新条目计（最坏一次重报——与坏档降级同级，非缺陷级）；两端同规则（去重档跨端共享——CLI 写的键 VSC 须逐字认得）。
  例：`- [ ] X → 证据 a.mjs:3 · status=待讨论` 位移后仍同键；`status` 改 `待设计` → 键变（下一扫计一次新增）。
- **变化检测（去重）**——状态档每台账一项 `{aged:[条目键…], threshold:bool}`：
  - 老化事件：`agedNow − aged(档)` 非空 → 一行（标题取新增者）；**送达后** `aged := agedNow`（自清：已处置条目自然移出）。
  - 阈值事件：`thresholdNow && !threshold(档)` → 一行；**送达后** `threshold := thresholdNow`（跌回 false 即重置——再达阈 = 新事件）。
  - **送达门（F5）**：仅当行真正 push（CLI）/ post（VSC，webview 已就绪）成功后才写档；未送达不记。
- **去重档 schema**：`{"version":1,"ledgers":{"<台账绝对路径·正斜杠>":{"aged":[…],"threshold":false,"updatedAt":<ms>}}}`；
  缺失 / 坏 JSON → `{version:1, ledgers:{}}`；UTF-8；`writeFileSync(tmp)` + `renameSync`（防撕裂）。
- **行龄未知**（非 git / 未跟踪）→ 不计老化（零假阳——既有 `blameDays` 同族降级）。
- **性能**：技术组无「无触发候选条目」的项目**不跑 git**；有候选 → 每台账恰一次全档 blame（非逐行——40 条逐行 blame 会开 40 个子进程）。

##### 2.30.3.3 行文本逐字契约（三面同文——CLI / VSC / `--summary` 同一 formatter）

| # | 形态 | 逐字模板 | 色 / 态 |
|---|---|---|---|
| L1 状态标记 | 单行 | `台账 <pool>·<tech>`（例 `台账 4·32`） | `aged>0` → 警示色（CLI `C.warn` / VSC `statusBarItem.warningBackground`）；否则默认 |
| L2 明细行 | 每项目一行 | `台账 <名>：需求池 <pool> · 技术待办 <tech>（老化 <aged>）` +（阈值时）` — 可开批` | 该项目 `actionable` → 警示色；否则 dim |
| L3 变化行·老化 | 每事件一行 | `台账变化：<名> 老化首次越线 <n> 条（超 30 天未处置）：<t1>；<t2>；<t3>`（标题 = 条目首段 `**…**`；**无粗体段 → 回退 = 归一化文本前 20 字**〔超出加 `…`；修正轮 #3〕；>3 条时第三项后接 `；…`） | 警示色 |
| L4 变化行·阈值 | 每事件一行 | `台账变化：<名> 需求池达阈值（<pool> 条）— 可开批` | 警示色 |

- `<名>` = 项目根目录 basename；数字 = 十进制整数；`<aged>` **恒显**（含 0——自证已检查）。
- `--summary` 输出 = L2 行序列（**行集 = 族行**——`discoverFamily` 的 `projects` 全体逐项目一行，含不可动作同级；**非**「明细行集」（那是运行时启动行的行集——§2.30.3.4）；发现序 = current 在前、其余按目录名升序）；族空时输出 `台账：未发现台账（docs/TODO.md）。`（**仅命令面**——运行时面静默，N1）。
  （实现后同步（2026-09-12）：收口行 = 核销检查点，给全族台账状态——「不可动作不显」门只约束运行时启动行（§2.30.3.4），不约束本命令面。）
- **状态行位置**：`buildStatusLine` 状态段簇**尾**（`scrollHint` 后、` │ Enter: send` 键位组前）——状态类信息同簇；
  受 `sliceByWidth` 右截的优先级与既有状态段一致。备选「行尾」被否决：120 列下 `Ctrl+C: exit` 段已先被截——标记会落在可视区外（K7）。

##### 2.30.3.4 CLI 挂载（TUI）

| 点 | 接线 | 行为 |
|---|---|---|
| `src/tui/index.mjs` | state 加 `ledger: {marker:null, warn:false, scannedAt:0}`；`showStartup` 后调 `startLedgerSurface({state,agent,pushLine,render})`；`cleanup()` 调 `dispose()`（`process.on("exit", cleanup)` 同 `:278`） | 启动扫描 + 周期 |
| `src/tui/ledger-surface.mjs`（新档） | 首扫（`setImmediate` 后——不抢首帧）→ push 变化行 / 启动行 → 写 `state.ledger`；`setInterval(REFRESH_MS)`（`unref()`）；`state.processing` 期间跳过本轮（git 子进程不打断回合帧） | 三面发射 + 状态位 |
| `src/tui/render-frame.mjs` | `buildStatusLine` 状态簇尾插 L1；空标记零注入（半态逐字节等价纪律——render-frame `:233-238` 同款） | 常驻标记 |

- **启动行**（修正轮 #2——可动作门）：首扫**任一项目可动作**（`aged>0` 或阈值）→ push 明细行集 L2 行（每项目一行）；**不可动作 → 会话流零行**（常驻标记不受此门约束——F2 按标记态照显，T98）；同扫若出变化行 → **先变化行、后明细行**。
- **周期扫描**：仅检测到**新**变化时 push（L3 / L4）；`state.ledger` 每次刷新重写（marker / warn）。
- headless（`thincoder chat` / ACP）**零改动**——入口 `bin/thincoder.mjs`（`.cjs` 仅 shim）不落任何台账面（N1；文件域判据 = AC89 / T110④——T110④「`bin/thincoder.mjs` 内 `ledger` 零命中」已退场（段删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §11.3））。

##### 2.30.3.5 VSC 挂载（状态栏 + chat 流 + tooltip）

| 点 | 接线 | 行为 |
|---|---|---|
| `src/extension/ledger-surface.mjs`（新档） | `initLedgerSurface(panel)` / `refreshLedger(panel,{emit})` / `pushLedgerStartup(panel)` / `dispose()` | 扫描 + item 更新 + post |
| `src/extension/chat-panel.mjs`（VSC 仓） | `_initStatusBar()` 内调 `initLedgerSurface(this)`（item 并立——`StatusBarAlignment.Right`、priority 99；同 `:156`） | item 建立 + 周期注册 |
| `src/extension/panel-messages.mjs`（VSC 仓） | `webviewReady` 分支（既有三推口处，`:428-430`）加 `pushLedgerStartup(panel)`——每次 webview 创建一次（`retainContextWhenHidden` 下 ≈ 每宿主会话一次） | 启动行 post |
| `src/extension/panel-project.mjs`（VSC 仓） | `onProjectChanged` 尾加 `refreshLedger(panel,{emit:false})` | 换项目即时刷新 |
| `webview/chat.js`（VSC 仓） | 新 case `ledgerNotice` → `addLedgerNotice(ctx, m.lines)` | 流内行 |
| `webview/ledger-line.js`（VSC 仓）（新档 ~25 行） | 逐行 `<div class="ledger-line [warn]">` append 到 `ctx.messagesEl`（`ui.js` 492 行 +25 越 500 硬限 → 独立新档） | 渲染 |
| `webview/chat.css`（VSC 仓） | `.ledger-line` 样式（弱化小字；`.warn` 警示色） | 视觉 |

- item 形态：`text = L1`；`tooltip = MarkdownString(明细行集 L2 行)`；**无 `command`**（点击面板否决在案）；无台账 → `hide()`。
- 消息载荷：`{type:"ledgerNotice", lines:[{text, warn:bool}]}`（端内自有投递通道——与 CLI 的 pushLine 各自实现，语义同源）。
- **启动行 post 门 = 同 §2.30.3.4**（任一项目可动作才 post；不可动作零 post——零噪音 N1；修正轮 #2）。
- **自验前置**（见 N4）：源码改动**需重载扩展才生效**——终局自验 = 重载后在含台账工作区看到 item / 启动行。

##### 2.30.3.6 收口行（命令面 + 清单槽位 + 提示词逐字）

- **命令面**：`node scripts/check-ledger.mjs --summary [--root <dir>]`——输出 = L2 行序列；**只读**（不写档、不改台账）；退出码 0。
  （本仓直接跑；自工作区根 / VSC 仓用该脚本实际路径。）**命令字面（含脚本名）只落本档 / 批次档 §6 模板——不入提示词**（FR13；修正轮 #1）。
- **清单槽位**（枚举同步——D3；需求 §1.12 §6 模板 + §1.15 D7 + 本档 §2.19 D7 已落）：核销同步清单加「**台账可见面（收口行）**」。
- **提示词逐字**（双端 `discipline-engineering.md` ×4——主 agent 内容权 + eng-coder 落笔）：

  > 7. **D7 变更留痕 + 核销同步** — 每批核销跑**核销同步清单**（批次档 §6）：角色表 / 状态行 / 计数 / 指针 / 变更记录 / 待办勾销 / **台账可见面（收口行）**。
  >    收口行 = 台账 `--summary` 汇总面的输出（有汇总面的仓直接跑；无则按同口径汇总输出）——保留在会话流。

  （各端原文自持——CLI / VSC 各自文本落地；锚断言 = 固定子串 `台账可见面（收口行）` 与 `--summary`——**两锚即全部断言面**、**不含脚本名**〔修正轮 #1〕；命令字面只落本档 / 批次档 §6 模板。）

#### 2.30.4 受影响文件全清单（as-of 2026-09-12 实测；行数口径 = read 工具）

**本仓（CLI）**

| 文件 | 动作 | 批前 | 预计增量 | 分工与档位 |
|---|---|---|---|---|
| `thincoder-core/ledger.mjs` | **新增** | — | ~180 | eng-coder（新档 ≤300 ✓） |
| `src/tui/ledger-surface.mjs` | **新增** | — | ~80 | eng-coder ✓ |
| `src/tui/index.mjs` | 修改 | 478 | +8 | eng-coder（≤486 / 500）——>300 档：**不拆**（state 槽 + 起动调用 + cleanup 挂接——三处单点接线，零结构增长）；函数档：**`startTUI` 400 行（既有，as-of）**——本批零新增函数；拆 = 专项债（§2.30.6） |
| `src/tui/render-frame.mjs` | 修改 | 398 | +10 | eng-coder（≤408 / 500）——>300 档：**不拆**（`buildStatusLine` 单点注入，零结构增长）；函数档：无 ≥300 行单函数（as-of；最大 `renderInputBox` 85 行） |
| `scripts/check-ledger.mjs` | 修改 | 240 | +40 / −15 | eng-coder（消费 `scanGroups` + `--summary`；L1–L3 语义零改） |
| `src/prompts/discipline-engineering.md` | 修改 | 228 | +2 / −1 | 主 agent 内容权 + eng-coder 落笔 |
| `docs/design/prompts/discipline-engineering.md` | 修改 | 157 | +2 / −1 | 同上（中文权威镜像） |
| `test/ledger-surface.test.mjs` | **新增** | — | ~240 | eng-coder（glob 自动发现——无需登记） |
| `docs/requirements/ENGINEERING-MODE.md` | 修改 | 817 | +60 | eng-designer（**已落**——§1.18 + FR24 + 三处枚举） |
| `docs/design/ENGINEERING-MODE.md` | 修改 | 2307 | +~340 | eng-designer（**已落**——§2.30 + AC80–AC90 + T97–T110；T105 已退场——整删，删除记录 = `TESTING.md` §11.3） |

**对端仓（VSC）**

| 文件 | 动作 | 批前 | 预计增量 | 分工与档位 |
|---|---|---|---|---|
| `thincoder-vscode/src/ledger.mjs` | **新增** | — | ~180 | eng-coder（独立实现、语义同源） |
| `src/extension/ledger-surface.mjs` | **新增** | — | ~120 | eng-coder ✓ |
| `src/extension/chat-panel.mjs`（VSC 仓） | 修改 | 420 | +6 | eng-coder（≤426 / 500）——>300 档：**不拆**（`_initStatusBar` 单点初始化，零结构增长）；函数档：无 ≥300 行单函数（as-of；最大 `constructor` 74 行） |
| `src/extension/panel-messages.mjs`（VSC 仓） | 修改 | 485 | +3 | eng-coder（**紧**——488 / 500，不得超）——>300 档：**不拆**（`webviewReady` 分支单点调用）；函数档：**`handlePanelMessage` 378 行（既有 switch 巨型函数，as-of）**——本批仅加 1 个 case 分支；拆 = 专项债（§2.30.6） |
| `src/extension/panel-project.mjs`（VSC 仓） | 修改 | 92 | +2 | eng-coder ✓ |
| `webview/chat.js`（VSC 仓） | 修改 | 398 | +3 | eng-coder（≤401 / 500）——>300 档：**不拆**（新 case `ledgerNotice` 单点；渲染外置 `ledger-line.js`）；函数档：无 ≥300 行单函数（as-of；最大 message 监听 156 行） |
| `webview/ledger-line.js`（VSC 仓） | **新增** | — | ~25 | eng-coder（独立新档——`ui.js` 492+25 越硬限，故不寄居） |
| `webview/chat.css`（VSC 仓） | 修改 | 477 | +12 | eng-coder（≤489 / 500）——>300 档：**不拆**（追加 `.ledger-line` 样式段，零结构增长）；样式表——**无函数档（不适用）** |
| `src/prompts/discipline-engineering.md` | 修改 | 240 | +2 / −1 | 同 CLI |
| `docs/design/prompts/discipline-engineering.md` | 修改 | 163 | +2 / −1 | 同上 |
| `test/ledger.test.mjs` | **新增** | — | ~240 | eng-coder + `test/files.mjs`（VSC 仓） 登记（VSC 显式清单） |
| `test/files.mjs`（VSC 仓） | 修改 | 77 | +1 | eng-coder |
| `docs/design/ENGINEERING-MODE.md`（VSC 仓） | 修改 | 218 | +3 | eng-designer（登记行——**已落**） |

> **档位结论**（修正轮 #4——六档逐档注）：全表**无**触发拆分的档（新增档均 ≤300；既有档增量均守 ≤500；两处临界已在表中标注）。
> **>300 六档**（CLI `tui/index.mjs` / `tui/render-frame.mjs`；VSC `src/extension/chat-panel.mjs`（VSC 仓） / `src/extension/panel-messages.mjs`（VSC 仓） / `webview/chat.js（VSC 仓）` / `webview/chat.css（VSC 仓）`）**均不拆**——各自为单点接线 / 追加样式，零结构增长；
> **函数档结论（as-of 实测）**：`index.mjs` `startTUI` 400 行 · `panel-messages.mjs` `handlePanelMessage` 378 行——**两处均为既有巨型函数**（本批零新增函数；拆 = 专项债，§2.30.6）；余四档无 ≥300 行单函数（最大 85 / 74 / 156 行；chat.css 不适用）。
> **实现面拆分（建议——实施阶段终定）**：2 个并行 eng-coder——① CLI 面（代码 + 测试 + CLI 提示词双源）② VSC 面（代码 + 测试 + VSC 提示词双源）；文件域不相交。

#### 2.30.5 关键决策记录（UI / 判据级——含否决备选）

| # | 决策 | 理由 | 否决备选 |
|---|---|---|---|
| K1 | 明细行集 = **current ∪ 可动作**（非全族铺开） | 零噪音优先；实测 `D:\teamcode` 下另有 `ai-gateway` / `thinworker` 含 `docs/TODO.md`——全族 = 4 行噪音 | 「全族每项目一行」（真实异构环境噪音大） |
| K2 | 启动行**每次会话**出现（不设去重） | 启动行本义 = 会话开场状态提醒；受一次性约束的是**变化行**（F5） | 「一次性/每窗口仅一次」（丢信息——新会话看不到状态） |
| K3 | VSC 启动行时机 = **webviewReady** | webview 未就绪时 post 会丢（SESSION-FLOW-B 已实证——「此刻发内容即丢」） | 「扩展激活时一枪」（面板未开 = 丢） |
| K4 | **不新增**工具 / 命令 / 快捷键面 | 否决在案（`/todo`）+ 本机制无新增交互点诉求 | 「新命令 / 新工具」（否决面） |
| K5 | **不监听文件系统**（无 fs.watch / FileSystemWatcher） | 周期 + 事件已足（台账写入 = 主 agent 低频动作）；少一个常驻监听面 | 「监听台账 mtime」（跨端监听器复杂度 / 资源） |
| K6 | 容器目录无当前项目 → **标记不显**（明细行照常） | R3「无台账的根不显」直接推导；当前项目判据单一（D5） | 「容器下猜一个子项目」（无判据依据） |
| K7 | 状态标记置**状态段簇尾** | 状态类信息同簇；右截优先级与既有状态段一致 | 「绝对行尾」（120 列下在可视区外——失效） |

> **K6 观测（据实记录）**：`D:\teamcode`（实测：无 `.git`、无 `docs/`）此类**容器工作区**下，状态标记不出现（无「当前项目」）；
> 明细行与变化行照常（候选集从上下文目录推导）。若用户要容器场景也显标记，属**新裁定**——本批不预改。

#### 2.30.6 边界（本批不做）

- 不做：`/todo` 命令 · 触发字段回填 + 机检强制 · 点击展开面板 · 状态行合计 / 多行 / 多根铺开（否决在案）。
- 不做：台账内容治理（归档 / 移档 / 勾销——收口划扫职责，§1.18 范围外）。
- 不改：`check-ledger` L1–L3 语义（仅消费共享 `scanGroups` + 新增只读 `--summary`）；`bin/thincoder.mjs` headless 面；`test/ledger.test.mjs` 既有用例。
- **提示词面可移植性**（FR13；修正轮 #1）：四提示词文件只写「台账 `--summary` 汇总面」口径——**不含脚本名**（`src/prompts/**` `check-ledger` 零命中保持，AC48/AC80）；具体命令字面只落**批次档 §6 模板 / 本档**。用户项目无该脚本 → 收口行由主 agent 按同口径汇总输出——不阻断工作流。
- **同级枚举上限（N2 成本有界——确定性退化；实现后同步（2026-09-12））**：同级枚举限 `MAX_SIBLING_SCAN=100`（`thincoder-core/ledger.mjs:76`）——父目录的目录项数超限 → 该层候选判**空集**（不取部分结果），退化 **current-only**（`projects = [current]`）；current 缺（容器目录）→ 继续向上求候选。
  **裁定句**：F4「项目集 = current + 同级含台账者」不设语义上限，**N2 成本有界（≤500ms）优先**——上限只约束枚举规模，不改「含台账者」判据本身；触发面 = 缓存 / 临时等非仓族形态的超大父目录（真实工作区远小于 100）。
- **登记（不在本批）**：两处既有 ≥300 行单函数——`src/tui/index.mjs` `startTUI`（400 行）· `src/extension/panel-messages.mjs`（VSC 仓） `handlePanelMessage`（378 行）（as-of 2026-09-12 实测；本批零新增函数、零结构增长）——拆分专项另议（父侧登记台账）。
- 不做：跨进程缓存 / 全工作区深扫 / 文件监听 / 任何网络面 / 台账档写入（唯一写面 = 去重档）。

#### 2.30.7 UI / 交互决策落档

| # | 决策 | 落点 | 状态 |
|---|---|---|---|
| U1 | 状态行标记位置 = 状态段簇尾（键位组前） | §2.30.3.3 / §2.30.3.4 | 定案（K7） |
| U2 | 标记/行色语义 = 老化>0 / actionable → 警示色 | §2.30.3.3 | 定案 |
| U3 | VSC item 无点击命令；tooltip = 明细行集 | §2.30.3.5 | 定案（K4） |
| U4 | 空态：无台账 → 标记不显 + 零行；不可动作 → **会话流零行**（标记照常——默认色；修正轮 #2） | §2.30.3.2 / §2.30.3.4 | 定案（K1/K6） |
| U5 | VSC 启动行时机 = webviewReady（每次创建） | §2.30.3.5 | 定案（K3） |
| U6 | 行文本语言 = 定点中文（不翻译） | §2.30.2 D7 | 定案 |

> **open 项：无**（上表全部定案；实现中如遇未决点——停下报告，不静默发明）。

#### 2.30.8 不变量（评审判据）

1. **无台账 → 零输出零标记**（空态零噪音——N1）。
2. **台账档只读**——本机制唯一写面 = `~/.thincoder/ledger-notify.json`（且仅在送达后写）。
3. **数字单源**——显示数字全部出自 `src/ledger.mjs`（VSC 等价物）；L2 行在 CLI / VSC / `--summary` 三面同 formatter。
4. **L1–L3 机检语义零改**——`check-ledger` 既有用例（T67–T94 + T96；T95 已退场——删除记录 = `TESTING.md` §11.3）零改全绿为证。
5. **不新增工具 / 命令 / 快捷键面**；headless 零新增输出。
6. **变化行送达门**——未送达不记账（F5——否则用户永远看不到）。

### 2.31 文档体系各仓自持（LEDGER-SELF-CONTAINED 批——2026-09-12；需求 §1.19 / FR25）

> 本批设计全文 = `LEDGER-SELF-CONTAINED.md`（问题陈述与选型 §1–§4 · 决策 D1–D14 §5 · 提示词面 §6 · 机检补强 §7 · 存量处置逐档清单 §8 · 受影响文件 §9 · 用例与验收 AC-LS1–AC-LS26 / T-LS1–T-LS29 §10–§11）；本节 = 工程模式设计面**登记**（指针级——D2 不复制）。

**依据**：用户 2026-09-12 04:16–05:20 裁定 R1–R9 + 父侧 P1′ / P2′ / P3（批次档 §1）；需求 = `requirements/ENGINEERING-MODE.md` §1.19（F1–F10 / N1–N4）。

**四个面**：

| # | 面 | 内容 | 落点 |
|---|---|---|---|
| 1 | 射程规则（轴一） | 台账 / 批次档 / 需求只收本仓事项——禁跨仓指针（含本产品多端互引） | 本档 §2.24 机制面 + 提示词新节 |
| 2 | 行为纪律 | 提示词「文档与台账自持」新节 + 「多实现面纪律」节通用化（去绑死 / 去维护者注 / 并入核验职责） | `src/prompts/discipline-engineering.md` / `discipline-normal.md`（双源各端自持） |
| 3 | 机械闸 | `check-ledger.mjs` 新增 **L4 本仓可解析**（指针 + 证据路径；fail-closed + 基线分流）；`DEFAULT_LEDGERS` 只扫本仓 | `scripts/check-ledger.mjs` / `test/ledger.test.mjs` |
| 4 | 存量处置（宽口径 + 溯及既往） | 批档迁移 14 / 拆分 19（本仓份保留 + 档首搬迁注记）/ 零处置 20；需求设计写痕 A 类零改 / B 类逐条改指 / C 类迁移；归档面迁移 3 / 拆分 2 / 改指 16 | 设计档 §8 逐档清单 |

**关键决策**（全文 = 设计档 §5 D1–D14）：D1 判据 = **本仓可解析**（零假阳 / 直击事故形态）· D2 新增 L4、L1–L3 语义零改 · D9 跨仓迁移 = **两仓两步法**（两仓为独立 git 仓——无跨仓 `git mv`；本仓删 + 对端增携源档路径与源 SHA）· D10 拆分逐字搬运（不重写）· D11 存量搬迁 = 带清单的搬迁（对端份不得留本仓——append-only 只约束在飞过程）· D13 两侧各一个 eng-coder、各端独立实施、共享同一设计链。

**两轴对齐（取代 / 收口 / 并列——逐条）**：条目与归属不带他仓指针（轴一——本批立闸）；正文引用他仓仍用既有 V1 规范形态「名称（仓别）§N」（轴二——语义零改）。二者**并列**、射程不重叠（一句话：正文可以指他仓（规范形态），条目与归属不行）。

**边界**：不改 L1–L3 / V1/V2/V3 既有判据语义；不做跨仓历史重写；不做 36 档需求物理复制；在飞 2 档的拆分收口随其收口（期 2——逐档点名不豁免）；台账物理落笔归主 agent。

**分期**：期 1 = 本批（自持面 + 提示词 + 机检 + 存量处置 + 互引改指——无条件）；期 2 = 在飞 2 档拆分收口（触发 = 该批收口）。

### 2.32 文档↔实装对账（DOC-CODE-RECONCILE 批——2026-09-12；需求 §1.20 / FR26 + §1.19 F15–F17）

> 需求 = `../requirements/ENGINEERING-MODE.md` §1.20（F1–F10 / N1–N5）；批次档 = `../batches/2026-09-12-DOC-CODE-RECONCILE.md` §1/§2。
> 三层：① 机检器 V5（报告态 → 收紧）② 按锚类型清账 ③ 防回潮 + 流程入规（含跨仓批派单与写域——用户 23:01 追加）。

#### 2.32.1 问题陈述与三层交付

设计/需求档的「事实句」落后于代码/测试现态——撞见即清 250+ 处，但**没有全量清单**（清的是撞见的，不是存在的）。病根四条见需求 §1.20。三层交付：

| 层 | 交付 | 判据面 | 落点 |
|---|---|---|---|
| 1 机检器 | V5「文档锚一致性」（三锚）+ 全量清单 + 报告态/闸态两态 | 可机器判的事实锚 | `scripts/doc-anchors.mjs` + `test/doc-anchors.test.mjs` |
| 2 清账 | 逐条处置（现态改写 / 退场·已废注记 + 来源指针）+ 收紧 | 文档面（零代码/测试语义改动） | `docs/design/**` + `docs/requirements/**` |
| 3 防回潮 | 反查脚本 + V5 常驻 + 语义巡检 + 跨仓批派单与写域 | 机检面 + 人流程面 | `scripts/doc-impact.mjs`（轮 3 已落） + 提示词层 + 批次流程 |

#### 2.32.2 方案选型对比

| # | 候选 | 判据逐项评估 | 取舍（选定代价/权衡） | 结论 |
|---|---|---|---|---|
| ① | **形态-only**（只判锚的书写形态合规，不判存在性） | 零假阳：✓；断真漂移：✗（句子写的档/号是否还存在——形态面无此信息）；成本：最低 | 本批要治的就是「句子落后于现态」——形态-only 等于不治 | **否决** |
| ② | **全树存在性（裸口径）**：反引号内标识符 / 用例号 / 路径一律判存在性 | 零假阳：✗（实测：反引号标识符 2629 个候选里 196 个在代码树无命中——统计面 = 本仓扫描域全域（97 档），其中多为**对端仓符号 / 库·平台 API / 退场叙述 / 术语**——假阳为主）；断真漂移：✓ | 红一片 = 无人看 = 等于没有（违 F2 硬条） | **内核保留、口径收窄**（见 ④） |
| ③ | **声明式清单**（人工维护「允许清单 / 例外清单」） | 零假阳：✓（人工兜底）；清单腐烂：✗（新锚不入清单即假阳；存量豁免 = 先例源——违 F14 / N2）；成本：持续人工 | 与本仓「**基线必须保持为空 / 不得再设存量通道**」同一裁定相抵（登账即例外即违规） | **否决** |
| ④ | **坐标化判定（选定）**：② 的存在性内核 + 判定面收窄到「可证明为坐标的引用」 | 零假阳：✓（实测：用例号悬空 16 · 路径悬空 103 · 窄形态符号悬空 2——均真悬空）；断真漂移：✓（直击「档/号/符号不存在」类事实句）；成本：判定面窄于 ②（无坐标的符号提及归语义巡检——已声明的边界） | 选定：例外的**唯一依据 = 判据句**（F14）；窄化带来的漏判面 = 显式登记（写进 §2.32.8 边界） | **选定** |

**选定代价（如实列）**：④ 不覆盖「无坐标 / 无宿主声明的符号引用」（实测面最大的一类）——该类归 **V5-C 宽形态报告清单 + 语义巡检**（不阻断）；也不覆盖「设计计划未落地」类（用例表编号在 test 树无宿主的计划面，实测 294 条——**不属悬空**：其编号定义在本档用例表内，归测试生命周期 / §6 收口面）。

#### 2.32.3 V5 判据规格

##### 2.32.3.1 锚抽取（逐条：正则 + 排除式）

判定单位 = **行**（fenced 块整块跳过——与 V1–V4 同口径）。三锚抽取规则：

- **V5-A 路径 / 坐标锚（入闸）**：正则 `/(?<![A-Za-z0-9_.\-\/])((?:[A-Za-z0-9_.\-]+\/)*[A-Za-z0-9_.\-]+\.(?:mjs|cjs|js|json|md|css|html|svg|yml|yaml|sh|ps1))(?::(\d+(?:-\d+)?))?(?![\w])/`。
  **射程** = ① 含 `/` 的路径形态，**或** ② 带行号坐标（`:NN`——含**行区间 `:N-M`**，整条参与抽取、不截断；轮 3 实装收正）——裸 basename 且无坐标者**不判**（它是文档互指 / 运行期档名 / 术语的常用写法，无坐标则不可定位）。
  排除式逐条（与假阳类一一对应；每条均为硬排除）：
  1. **占位 / 示意名与通配**：token 含 `< > { } * ? …`；或**夹具 / 示意档名**——末段裸名 ∈ 占位集（`x` / `y` / `a` / `b` / `foo` / `bar` / `file` / `target` / `doc` / `none` / `example`）
     + **通用入口名类**（`app` / `main` / `index`——应用入口类通用名，同类属示意档名），**大小写不敏感**。
     **判据句 = 「夹具与示例档名」（通用示意名不主张档存在——如用例表描述面的 `src/app.mjs`）**；**射程 = 末段裸名**（同条既有口径）——正文主张句不受此豁免；**（新增判据——实装对齐已落：`scripts/doc-anchors.mjs`）**。
  2. **运行期面**：以 `.thincoder/` / `.git/` / `.vscode/` 等点目录开头者（不在仓内的运行期/工具面档）。
  3. **组合简写**：一段内出现 ≥2 个扩展名段（`main.md/engineering.md` 类简写）。
  4. **命令字面与围栏**：fenced 块整块；行内命令链 / 命令词 / 搜索模式串行（`isExecutableLine` 同一谓词——与 V4 射程豁免同源）。
  5. **已属他判据**：**`.md` token** 后接 `§N` 者（V1 段引用面——V1 只判 `.md`；非 `.md` token **不豁免**，照判存在性——轮 3 实装收窄）；**对端仓直引的 V4 违规形态**（枚举 E1–E5 外——裸 `thincoder-vscode/…` 未附 `（仓别）`
     注记 / `VSC 仓` + 裸 `§N`）归 V4——V5 **跳过**（不判、不报、不入域外行）；**合规形态**（`路径（仓别）`——E3）**不排除**——入存在性域判存在性（不可达 ⇒ 域外报告，见 2.32.3.2 / 2.32.3.6）。
- **V5-B 用例号锚（入闸）**：正则 `/(?<![A-Za-z0-9-])((?:T-[A-Z]{1,5}\d{1,3}(?:-\d{1,3})?|T-\d{1,3}|T[A-Z]?\d{1,3})[a-z]?(?:\.\d+)?)(?![A-Za-z0-9-])/`。
  - 形态注（修正轮 #10 收紧 + **实施后同步轮按实装收正**）：① 裸 `T` 后 ≤1 字母且直接数字——`TLS12` / `TAB123` 类不入抽取；② `T-` 前缀「字母块 1–5」形态补**多段号完整捕获**（`(?:-\d{1,3})?`）——`T-V5-12` 类多段号完整命中（逐字旧形态只捕获到 `T-V5` 前缀，与「类均保留」的声明意图相抵——按实装收正）；③ 收尾 lookahead 补 `-`（`(?![A-Za-z0-9-])`）；`T-V5-*` / `T-LS*` / `T-H8` / `T-01` 类均保留。
  排除式：① 带前缀的内部编号（`D-TR6` / `AC-xx` / `F-x` / `N-x`——前导 `-` 即排除）；② 裸 `T<数>.<数>`（台账/条目号族——与用例号同形不同物）；③ 形态面：`TLS12` / `TAB123` 类标识符**不入抽取**（正则收紧——假阳类 10）。
  存在性域 = **定义面**（不直接判 test 树——见 2.32.3.2）。
- **V5-C 符号锚**：分两段（同一抽取面，两种判定）：
  - **窄形态（入闸）**：同一行内同时出现「反引号标识符」+「定义谓词」（闭枚举：`定义于` / `定义在` / `声明于` / `声明在` / `生成点` / `定义处` / `唯一权威` / `导出`）+「**唯一**宿主档坐标」三要素时，判该符号在宿主档文本存在。
  - **宽形态（报告态——不阻断）**：反引号标识符（≥5 字符、含大写或 `_`）在代码树的存在性——实测 2629 候选 / 196 悬空（统计面 = 本仓扫描域全域——§2.32.3.7），悬空面含大比例对端符号 / 库·平台 API / 退场叙述（假阳），**按 F2 硬条不入闸**，仅入报告清单（供语义巡检选样）。

##### 2.32.3.2 存在性域

- **路径 / 坐标 / 窄符号宿主**：解析序 = ① 本仓根 → ② **本档所在目录**（`../requirements/X.md` 类）→ ③ **对端仓根** → ④ **唯一 basename 索引**。
  - ③ 可达来源序（实施后同步轮按实装收正）：显式 `peerRoot` 参数（用例直驱入口）→ env `THINCODER_PEER_ROOT`（别名 `THINCODER_CLI_ROOT`——对端侧同源名；**自指防护** = 取值解析为本仓根即弃用）→ 工作区兄弟目录（仓族名枚举、跳过自身）。**仅合规形态**（`路径（仓别）`——E3）入域——V4 违规形态跳过（排除式 5）；仓前缀形态含 `thincoder-vscode/…` / `thincoder-cli/…`。
  - ④ **本仓**同名命中口径：唯一 ⇒ 通过；多命中且带目录前缀 ⇒ 通过；多命中无目录前缀 / 零命中 ⇒ 报。**仓前缀合规形态（③ 不命中、对端可达）同落此步**——本仓同名命中（≥1）⇒ 通过（**缺档不报 = 已登记代价**——见 §2.32.8）；本仓零同名 ⇒ 悬空报行。
- **代码树（符号宽/窄形态）**：`src` / `scripts` / `bin` / `test` 四树（两仓）。
- **用例号定义面**（三源任一命中即通过）：① 两仓 `test/**` 文本（含测试名内嵌号）；② **定义位**——表格首格 / 列表项首 / 粗体行首（全档全域：`docs/{design,requirements,batches}` 两仓）；③ **退役登记表**（表头含 `用例名` 的表格行任意格）。
- **降级（明示）**：对端仓不可达（单仓克隆）⇒ 解析序 ③ 不可用——**合规形态锚**记「**域外**」计入报告行（不阻断）；**不得**因对端缺失而静默放过或静默报红。域外行**只**来自合规形态——V4 违规形态根本不入 V5 域（两态互斥，见 2.32.3.6）。

##### 2.32.3.3 注记识别（何种形态视为「已退场 / 已废」而通过）

- **粒度 = 判定行**（同行即通过；**不做跨行语义判**——防假阳）。
- **标记集（闭枚举，逐字）**：`已退场` · `已退役` · `已废` · `已废弃` · `已撤` · `已收窄` · `退场` · `退役` · `已删` · `已拆` · `已清空` · `已并入` · `归档` · `换名` · `改名` · `删除记录` · `未恢复`（修正轮 #4 补后三项）。
- **并档叙述形态（新增判据——实装对齐已落：`scripts/doc-anchors.mjs`）**：`原…系`——旧编号系列的谱系括注（如「（原 T-L/T-F4/T-F5 系，…）」）；**判据句 = 谱系叙述不主张单号存在**；**射程 = 叙述位（标题 / 括注）**；判定粒度 = 判定行（同注记——`原`＋编号段〔字母 / 数字 / `-` / `/`〕＋`系`，正则可判）。
- **指针形态**：`源 = <file:line>` 或 `删除记录 = <指针>`（指针本体同受 V5-A 判定——自洽：注记不能拿一个不存在的指针当退场证据）。
- **本轮已落处置形态**（被识别——逐字样例）：「已退场（段删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §11.3）」·「已废/收窄——源 = `src/x.mjs:42`」。
- **可见面（防标记集滥用）**：每次运行报告「注记豁免条数」——标记膨胀即漂移信号（与 F14「残留即示范」同族）。

##### 2.32.3.4 假阳类逐条排除（硬——F2 的落地面）

| # | 假阳类 | 排除式 |
|---|---|---|
| 1 | 设计档内部编号（`AC-xx` / `D-xx` / `F-x` / `N-x` / `D-TR6` 类） | V5-B 前导 `-`/字母排除 + 形态不含 `T` 前缀者不入抽取 |
| 2 | 库 / 浏览器 / 平台 API（如 `preventDefault`） | V5-C 宽形态**不入闸**（仅报告）；窄形态需「定义谓词 + 宿主坐标」双证 |
| 3 | 提交哈希 | 形态排除（40 位 hex 不在三锚正则内） |
| 4 | 命令字面 / fenced 块（可执行坐标） | 围栏整块跳过 + `isExecutableLine` 谓词（与 V4 射程豁免同源） |
| 5 | 夹具 / 示例占位路径（`docs/design/X.md` 等——含**通用入口名类**） | 占位 / 示意名排除（2.32.3.1 排除式 1） |
| 6 | 运行期 / 用户面档名（`config.json` / `.thincoder/…`） | 无坐标裸 basename 不判 + 点目录排除 |
| 7 | 对端仓符号 / 对端相对路径（**合规形态** `路径（仓别）`——E3） | 对端仓根入存在性域（可达时判存在性）；不可达 ⇒ 域外报告（不阻断）；**V4 违规形态（裸直引）→ V5 跳过**（归 V4——排除式 5） |
| 8 | 退场 / 换名 / 归档叙述句（**含「原…系」并档叙述**——判据见 2.32.3.3 新增条） | 同行注记标记集（闭枚举——逐字见 2.32.3.3；含 `已拆` / `已并入` / `归档` / `换名` / `改名` 类书面语） |
| 9 | 裸 `T<数>.<数>`（台账/条目号） | V5-B 排除式 ② |
| 10 | 标识符撞用例号形态（`TLS12` / `TAB123`——裸 `T` + ≥2 字母 + 数字） | V5-B 形态收紧（裸 `T` 后 ≤1 字母且直接数字——不入抽取；修正轮 #10） |

##### 2.32.3.5 报告态 → 阻断态（切换条件与阈值）

- **两态**：模块常量 `V5_GATE`（初值 `false` = **报告态**——轮 2 清账完成后已翻 `true`）；CLI 参数 `--v5-gate` / `--v5-report` 可覆盖（反证与临时收紧 / 放宽用——翻转后两态仍可直驱）。
- **报告态语义**：命中逐条打印为报告段（`报告(V5): <档>:<行> <锚>（<类>）`）+ 汇总行 `V5 报告 <n> 条（报告态——不阻断）`；**退出码不受 V5 影响**；**不入基线**（N2）。
- **闸态语义**：命中计入违规集——`exit 1`（固定句与 V1–V4 同族）；阈值 = **0**。
- **切换条件（收紧点）**：① 扫描域（`docs/design` + `docs/requirements`）三锚命中 = **0**（层 2 清账完成）② `V5_GATE` 翻 `true`（落点 = `scripts/doc-anchors.mjs`——翻转属轮 2）③ 快层断言 as-of 与本态同步（一次性）。三者齐备才收紧；**未清完不收紧**（不得提前设闸建红一片）。
- **测试稳定性**：判定函数接受**显式 `gate` 参数**（两态均可直驱）——用例与 AC 跨切换点零改（T-V5-12 即此形态——夹具域 + 显式参数，不读真实扫描域）。

##### 2.32.3.6 与 V1–V4 的射程边界（不重复报同一行）

| 判据 | 判什么 | V5 的避让 |
|---|---|---|
| V1 段引用可解析 | `X.md §N` 的档 / 节号存在性 | **`.md` token** 后接 `§N` 归 V1（V5 跳过；非 `.md` 不豁免——V1 域外照判存在性） |
| V2 计数与列表 | “N 项/处/条”与枚举对齐 | 面不交（V5 不碰计数） |
| V3 批次档 §3 轮次行 | 批次档（`docs/batches`）——V5 扫描域**不含批档** | 域不交 |
| V4 跨仓形态合规 | 对端仓**直引形态**（枚举 E1–E5 外） | **V4 违规形态（枚举外）token 归 V4——V5 跳过**；**合规形态（`路径（仓别）`——E3）入存在性域**判存在性（不可达 ⇒ 域外行，不阻断）。两态互斥：同一 token 不会既归 V4 又入 V5 域 |

##### 2.32.3.7 设计期实测基线（原型 as-of 2026-09-12——作量级与清单预估）

原型在本仓扫描域（`docs/design` + `docs/requirements` · 97 档）实测（规则集 = §2.32.3 全量排除式）：

| 锚类 | 候选（射程内） | 悬空（未过） | 备注 |
|---|---|---|---|
| 用例号（V5-B） | 1552 | **16** | 16 条均真悬空（退场/清空批的旧引用行无本地注记） |
| 路径 / 坐标（V5-A） | 2894 | **103** | 含退役/归档档引用、已删/已并测试档、已归档设计档、设计备选档名 |
| 符号·窄形态（V5-C 入闸） | 34 | **2** | 两条均真命中（死事件声明 / 生成点行号指针） |
| 符号·宽形态（报告面） | 2629 | 196 | 不入闸（假阳类 2 / 7 / 8 为主——见 §2.32.3.4）；统计面 = 全域（勿与批次档 §1 单档实测混读） |

**数字口径注**：上表 = **设计期原型**（规则集 as-of；未含实现期新增规则与注记集的完整生效）；**统计面 = 本仓扫描域全域**（`docs/design` + `docs/requirements` · 97 档）——**与批次档 §1 的单档实测**（`WEBVIEW.md` 一档：符号锚 196 个候选 / 真缺失 9 + 噪声 2）**为两个不同统计面**（同值不同量，勿互读；复核结论 = 修正轮 #13；原型未随批入库，数量事实以首跑清单为准）；**最终清单 = 实现落地首跑的输出**（层 1 交付物 F5——以它为准；本表只作量级与分档预估）。

#### 2.32.4 层 2 清账契约

- **顺序**：用例号（V5-B）→ 符号（V5-C 窄形态）→ 路径（V5-A）——按需求 §1.20 F6。
- **粒度与纪律**：逐档改完即 D6 回读；同行可判者不改语义、只改**现态陈述**；**不得**顺手重写整段（超出对账面）。
- **处置三选**（二选一 + 订正）：① **现态改写**（改为现行号 / 现行档 / 现行符号）② **退场·已废注记 + 来源指针**（标记集 + 指针形态见 2.32.3.3）③ **订正**（引用确属笔误 → 改为正确引用）。
- **零代码面**：不改 `src/**` / `test/**` 实体（本批 = 文档面对账）；锚缺失若暴露**真实代码问题**（例：文档说的机制在代码里不存在）→ **停下上报**（不自行改码）。
- **轮 2 写域对接（动态清单 → `files` 声明）**：首跑清单（F5 输出）中 `docs/design/**` + `docs/requirements/**` 的**每个命中档**逐档转为 file-level `files` 项（清单「档」列去重后逐行取用）；`scripts/doc-anchors.mjs`（`V5_GATE` 翻转）另列一项——轮 2 文件域 = 该集合（清单外的档不入）。
- **收紧**：清账完成即翻闸（2.32.3.5 三条件）——件随层 2 末轮。

#### 2.32.5 层 3 防回潮 + 流程入规

##### 2.32.5.1 反查脚本（`scripts/doc-impact.mjs`——轮 3 已落）

**目标**：给批次「受影响文件表」一条机械化的补充来源——改了哪些符号 → 哪些设计/需求档必须跟着改。

- **接口**：`node scripts/doc-impact.mjs --base <ref> [--files a,b] [--json]`；退出码 **0**（非门禁——查询工具；git 降级亦 0——打印「反查跳过」行）；**用法错误（缺 `--base`）⇒ `2`**（fail-loud——工具未运行，轮 3 as-built 登记）；`--base` **必给**（基准 = 上一批收口点——见下条）。（D-V5-6 / AC-V5-12 / 需求 §1.20 F7 的「退出码 0」= 非门禁语义——正常运行 / 降级恒 0，用法错误另计。）
- **输入**：① 变更文件（`git diff --name-only <base>`）② 变更符号（`git diff -U0 <base>` 的新增/删除行内标识符候选——过滤保留）。
- **输出**：① 变更面（文件 + 符号候选）② 反查命中档清单（`docs/{design,requirements}` 内——每档一行 + 命中词 + 命中数）③ 一行提示（「以上档建议录入批次档 §2 受影响文件表」）。
- **实现形态（单源）**：纯函数 `docImpact({changedFiles, changedSymbols, docsRoot})`（**快层直驱可测**）+ 薄 git 包装（子进程——**慢层 `slow()` 归册**，同 T94/T102 口径）。
- **时点与基准（修正后——#6）**：**实施轮开工前**跑一次（设计期无 diff——不在设计期跑）；基准 = **上一批收口点**（同批多轮 = 上一轮开工点）——**不以 HEAD 为默认**（干净工作区下 `git diff HEAD` 为空、输出无意义）；归属 = 主 agent（流程句入提示词层——两副本另起节，见 2.32.5.5）；输出**不自动**写批次档（写权归作者——建议录入选用）。

##### 2.32.5.2 V5 常驻

清账后 V5 常驻两个面：① 快层面（`test/doc-anchors.test.mjs`——随 `npm test` 生效，同 V1–V4 的接线口径；真实域复跑 = T-V5-15②——`slow()` 归册、`test:full` 跑）② 发部门链（`lint` → `test:full` → `test:integration`）经快层间接生效。再出现即红（闸态）。

##### 2.32.5.3 语义巡检机制（机器判不了的那类——F9）

| 要素 | 定义 |
|---|---|
| 对象 | **无锚语义句**（句中不含可判锚的事实句——例：「消息一律入队（回合尾 FIFO 消费，零丢失）」） |
| 周期 | ① **触发式**：某板块档发生**实质修订**（内容增删改）→ 该档**随改巡检**该档 ② **收口式**：批次收口时对**本批触碰档**逐档过一遍 |
| 归属 | **eng-designer**（写稿面唯一作者——巡检发现的修正也归其修订） |
| 记录形态 | 批次档 §6 既有「遗留项」行内一行：`语义巡检（<档>）：发现 <n> 处 — 处置/遗留`（**零新槽位**——不改 §1.12 模板） |
| 判据面 | **无机械判据（明示）**——不入机检；发现项经设计者修订后由评审核验 |

##### 2.32.5.4 跨仓批派单与写域（用户 2026-09-12 23:01 裁定「本来就应该各自落笔。」——需求 §1.19 F15–F17）

- **派单形态**：跨仓面的批次——**每仓各起一轮实施**，各轮带**自己仓的批次档**（`batchDoc` = 本轮所在仓）；语义同源由**同一份简报**保证，**不做逐字一致**（多实现面纪律）。
- **写域纪律**：子代理**只写本仓**（含本仓批次档里自己那一段）；**写对端仓任何档 = 违规**；确需对端改动 → **停下上报**，由主 agent **另起对端仓一轮**。
- **反例在案**：本批前序轮的**跨仓落修 = 反例**——不得再犯（不因「顺手」「只有一行」「对端缺人」而代写）。
- **本批自适用**：本设计只写 CLI 仓（需求/设计/§2）；对端（VSC 仓）的需求/设计与提示词同节 = **对端仓一轮自行落笔**（本设计只给语义同源的简报）。

##### 2.32.5.5 提示词落笔表（逐字——落笔归 coder 轮；内容权归主 agent）

| # | 落点文件 : 节 | 逐字文本（逐条落笔，不改字） |
|---|---|---|
| 1 | 两副本 §「文档与台账自持（各仓记各仓的）」——续编号 6 | `6. **跨仓批 = 每仓一轮、各带自己的批次档**：一批涉及工作区里两个仓时，**每仓各起一轮实施**——每轮带**自己仓的批次档**（`batchDoc` = 本轮所在仓的批次档）；两轮共用**同一份简报**（语义同源），**不追求逐字一致**（各端原文自持）。` |
| 2 | 两副本 同节——续编号 7 | `7. **子代理只写本仓**：任何子代理（eng-designer / eng-coder）**只写本仓文件**——含本仓批次档里自己那一段；写对端仓的任何档（含代写、顺手改、路径指向他仓的写入）= **违规**。` |
| 3 | 两副本 同节——续编号 8 | `8. **需对端改动 = 停下上报**：本轮确需改对端仓时，**停下报告**（改什么 / 为什么），由主 agent **另起对端仓一轮**——不得在本轮跨仓落笔。` |
| 4 | 两副本——**另起节**「改动面反查（文档影响面）」（同档，不并入自持节——修正轮 #11） | `本批实施轮开工前跑本仓反查脚本（文档影响面；基准 = 上一批收口点）——其输出的设计/需求档建议一并录入本批「受影响文件」表。` |
| 5 | `docs/design/prompts/discipline-engineering.md`（**中文权威镜像**——`docs/README.md`:15）§「文档与台账自持（各仓记各仓的）」+ 另起节「改动面反查（文档影响面）」 | **同 1–4 行逐字**（两副本逐字同落——不另抄文本；D2） |

> 落笔注：① 第 1–3 条落两副本同节「文档与台账自持」；第 4 条落两副本同档**另起节**「改动面反查（文档影响面）」（节题适配——修正轮 #11；不并入自持节）；**两副本** = `src/prompts/discipline-engineering.md`（产品装配源）+ `docs/design/prompts/discipline-engineering.md`（中文权威镜像——`docs/README.md`:15）——**逐字同落**（AC15 双源口径；纪律层为工程模式全链共读，不另在 persona 层重述）；
> ② 第 4 条的脚本名**不写进提示词**（可移植性口径——同 `台账可见面（收口行）` 先例）；③ 对端（VSC 仓）同节由**对端一轮**落笔（非本端代写——2.32.5.4）。

#### 2.32.6 受影响文件全清单（行数口径 = read 工具；as-of 2026-09-12 设计期——实施后同步轮回读刷新）

| # | 文件 | 当前行数 | 动作 | 预计增量 | 分工 |
|---|---|---|---|---|---|
| 1 | `docs/requirements/ENGINEERING-MODE.md` | 926（批前）→ **1000（修正轮后实测）**（轮 3：F7 落点行 as-built——行数零变） | 改（§1.19 补 F15–F17 + 新增 §1.20 + header 行；修正轮：F10 / F17 / §1.20 判定句行 + N5 判定句同步；轮 3：F7 去计划注） | **+74（实测）** | eng-designer（**已落**） |
| 2 | `docs/design/ENGINEERING-MODE.md` | 2735（批前）→ **3024（实施后同步轮实测）** → **3025（轮 3 实测）** | 改（§2.19 补 V5 行 + 新增 §2.32 + §3.1 AC + §3.2 用例 + §7 变更记录；修正轮：3🔴+3🟡+7🔵 落地；实施后同步轮：设计↔实装对齐 + 口径刷新；轮 3：判据收窄 / 行区间 + §2.32.6 / §3.2 as-built 同步） | **+289 → +290（累计实测）** | eng-designer（**已落**；轮 3 机械登记 = eng-coder） |
| 3 | `scripts/doc-anchors.mjs` | 新 → **300（实施轮实测；split 口径 300 / read 口径 299）** | **新增**（三锚抽取 + 存在性域 + 注记 + 两态 + CLI 清单；轮 3：排除式 5 收窄为 `.md` + 坐标行区间 `:N-M`——行数零变） | ~260 → **300（实测）** | eng-coder（轮 1） |
| 4 | `test/doc-anchors.test.mjs` | 新 → **282 → 298（轮 3 实测）** | **新增**（T-V5-1–T-V5-12 · T-V5-15（含②真实域·洁净句——轮 3）· T-V5-16；T-V5-13/14 → 行 6；快层 8 例 + `slow()` **7 例**；轮 3：T-V5-2 补排除式 5① 收窄 + `:N-M` 断言） | **282 → 298（轮 3 实测）** | eng-coder（轮 1 · 轮 3 增补） |
| 5 | `scripts/doc-impact.mjs` | 新 → **142（轮 3 实测）** | **新增**（纯函数 + git 包装 + CLI——已落） | ~150 → **142（实测）** | eng-coder（轮 3） |
| 6 | `test/doc-impact.test.mjs` | 新 → **91（轮 3 实测）** | **新增**（T-V5-13 / T-V5-14——含慢层 git 夹具；已落） | ~110 → **91（实测）** | eng-coder（轮 3） |
| 7 | `scripts/check-doc-width.mjs` | 367（批前）→ **368（实施后实测）** | 改（导出既有 `isExecutableLine` / `inCodeSpan`——共享豁免谓词单源；头部导出清单 +1 行；判据语义零改） | **+1（实测）** | eng-coder（轮 1） |
| 8 | `docs/README.md` | 247（批前）→ **250（实施前小轮后实测）** | 改（§3.7 补 V5 判据面一条；修正轮：补运行命令；实施前小轮：命令去重） | **+3（实测）** | eng-designer（**已落**） |
| 9 | `src/prompts/discipline-engineering.md` | 252 → **259（轮 3 实测）** | 改（§「文档与台账自持」续编号 6–8 + 另起节「改动面反查」——逐字见 §2.32.5.5；已落） | **+7（实测）** | eng-coder（轮 3——提示词落笔） |
| 10 | `docs/design/prompts/discipline-engineering.md` | 181 → **188（轮 3 实测）** | 改（同行 9 逐字——**两副本逐字同落**；修正轮 #1；已落） | **+7（实测）** | eng-coder（轮 3——提示词落笔） |
| 11 | `scripts/doc-anchors.mjs`（轮 2） | 轮 1 交付 → **300（轮 2 实测）** | 改（**实装对齐**——两类新排除（通用入口名类 / 「原…系」并档叙述）；净 ±0 行；**清账处置 36 档**（347 → 330 → 9 → **0**——末 9 = 轮 3 交付面 8 + ACP edit 桥拆分计划 1，按现态改写为计划面形态）；**`V5_GATE` 翻 `true`**（三条件齐备）+ 增 `--v5-report` 临时放宽参数（披露见批次档 §5）；对照记录 = 批次档 §5） | ±0 / 动态 | eng-coder（轮 2） |

**档位结论证**：`scripts/check-doc-width.mjs` **367（批前）→ 368（实施后实测）**——本批净增 +1（两处 `export` 前缀 ±0 行 + 头部导出清单 +1 行；≤500 硬限内）；**新判据面不入该档**（独立成 `scripts/doc-anchors.mjs`）——既有拆分计划（LEDGER 批登记：再有功能增厚随批评估 / ≥400 必拆）**本批不触发**（无净增结构体）；
  **新四档各自 ≤300**（`scripts/doc-anchors.mjs` / `test/doc-anchors.test.mjs` / `scripts/doc-impact.mjs` / `test/doc-impact.test.mjs`——轮 3 全部已落，实测均 ≤300）。

#### 2.32.7 关键决策记录（含否决备选）

| # | 决策 | 否决备选 | 依据 |
|---|---|---|---|
| D-V5-1 | 判定面 = **坐标化引用**（路径/坐标 + 用例号定义面 + 窄符号） | ① 形态-only · ③ 声明式清单 | 假阳纪律（F2）+ F14（例外的唯一依据 = 判据句）+ 基线不得再设（N2） |
| D-V5-2 | 用例号锚 = **定义面存在性**（不直接判 test 树） | 直接判 test 树（实测 425 条命中——含跨仓宿主 / 计划面 / 在途设计档，假阳为主） | 实测基线（§2.32.3.7）+ 零假阳前提 |
| D-V5-3 | 符号宽形态 **不入闸**（仅报告） | 全量入闸（实测 196/2629 假阳为主） | 同上；漏判面显式登记（§2.32.8） |
| D-V5-4 | V5 = **独立脚本**（不扩展 `check-doc-width.mjs`） | 入既有档（368+~260 > 500 硬限——违 F12 无豁免） | 硬限无豁免（F12）+ 既有拆分计划 |
| D-V5-5 | 报告态先落、清账后收紧（阈值 0） | 直接 fail-closed（首跑即红一片——无人看） | 需求 F4 + 假阳纪律 |
| D-V5-6 | 反查脚本 **非门禁**（退出码 0） | 入闸（`git diff` 面多变——噪声入闸即红一片） | 工具 vs 闸门分离（与 V1–V5 闸面不混） |
| D-V5-7 | 跨仓批 = 各仓一轮 + 提示词单档落笔（D2） | 父侧代写对端 / 双档重述（persona + discipline） | 用户 23:01 裁定 + D2 单一权威源 |

#### 2.32.8 边界（本批不做）

- **不动既有判据语义**：V1–V4 / L1–L4 / 宽度域 / 台账域——各自域零改（N5——判定句 = AC-V5-16 / T-V5-16）；新增 V5 与它们**不重叠报行**（§2.32.3.6）。
- **不动 `_archive/`**：归档档不作现状依据，也不入扫描域（历史快照——同现有扫描域口径）。
- **不重写历史批档**（`docs/batches/**` append-only）；V5 扫描域**不含批档**。
- **不改代码 / 测试语义**（含不改测试用例名——用例号锚缺失的处置只能走文档面：改写或注记）。
- **不承诺清零的两类**（已声明）：① 无锚语义句（归巡检——F9）② 符号宽形态命中（归报告 + 巡检选样——D-V5-3）。
- **不入产品提示词**：V5 脚本名/命令字面属本仓工具面（同 `check-doc-width` 口径）；只有 §2.32.5.5 的**通用行为条款**入提示词。
- **对端仓零写**：本端不写 VSC 仓任何档（含提示词镜像 / 台账 / 批档）——对端一轮自行落笔（§2.32.5.4）。
- **两端差异不对齐（各自保留、互不追赶）**：**对端仓树不可达**的处置两端口径不同——本仓（CLI）= 合规形态锚记「域外」报告行、**不阻断**（判据见 §2.32.3.2 降级条）；对端仓（VSC）= **fail-closed 拒跑**（`DOC-CODE-RECONCILE（VSC 仓）§4.1`「缺仓行为 = fail-closed」：固定报错句 + 退出码非 0 + 不产出清单）。**不做统一、不以任一端为准回改另一端**——判据 = 多实现面纪律「各端独立实现、语义同源、差异如实登记、互不追赶」。
  **已注销（跨仓失实注销——2026-09-13 对端缺仓口径变更）**：2026-09-13 用户裁定后对端（VSC）缺仓口径改「域外标记、不阻断」⇒ 两端口径一致 ⇒ 端差消解（指针 = 对端 `DOC-CODE-RECONCILE（VSC 仓）§4.1`）；本条注销留行、不再作为现态差异依据。
- **已登记代价（假阴面——2026-09-12 实施后同步轮登记）**：对端仓前缀**合规形态**——**对端可达但档缺失**时 ③ 不命中转 ④ 本仓同名 basename（≥1）⇒ **通过** ⇒ **缺档不报**（已知代价；判别判据 = §2.32.3.2 ④）；该面归语义巡检选样，**不得**以「通过」读作对端档案存在。

#### 2.32.9 UI / 交互决策落档

**本批零 UI / 交互决策**（文档面机制 + 命令行工具——无界面变更）——8 项中「UI / 交互决策落档」本批**不适用**（显式声明，非缺项）；无 `open` 项。

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
- AC13（§2.12）: eng-coder 审计受限 schema 变体**不含** batchDoc 属性（delete 清单——实现枚举照 `thincoder-core/agent/setup.mjs` 实际清单 async/id/n/designToken/designId 追加）。
- AC14（§2.11 点 2）: `src/` 内**无 `docs/batches/` 逻辑字面**（评审 #3）——源码全仓扫描该串仅出现在**错误/提示文案**中（§2.12 消息），无路径解析/默认位置引用。
- AC15（§2.11 点 3 + §2.12 提示词同步）: `src/` 不生成/不校验批次档模板（无“已收口”类措辞匹配、无模板常量）；且 spawn 样例行含 `batchDoc=`（**双源** `discipline-engineering.md`——`src/prompts` 英文落地 + `docs/design/prompts` 中文权威，非双端；校验方式 = 对两文件 grep `batchDoc=`，**非既有锚断言家族**——该家族只断言枚举子串）。
- AC16（§2.15 A）: `eng-designer` 入**五处**硬清单（subagent.mjs 的 schema/ROLES/描述 + setup.mjs 工程模式枚举 + tool-args 显示）——五处在位且可分别断言；非工程模式 spawn 它 → throw。
- AC17（§2.15 B——**防静默回退**）: designer 场景**已登记**装配——`assemblePrompt("eng-designer")` 返回的 prompt **非空且 ≠ CONSULT_BASE**（`≠ CONSULT_BASE` 断言面已退场（段删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §11.3）；现体 = 非空（>500）+ warnings=[]）；
  槽序 = `persona-eng-designer → common → discipline-engineering`，warnings 为空（盖 `thincoder-core/prompt-overlays.mjs:70-71` 的静默回退陷阱）；
  **且接线断言（评审 #3）**：designer 子代理**实选场景 = `eng-designer`**（非 `engineering`/`normal`）——盖 `thincoder-core/agent/setup.mjs:299` 内层选择器。
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
  机械校验 V1/V2 在 `test/doc-consistency.test.mjs` 内可跑：**违规一律阻断（修掉）**；**基线必须保持为空**——非空 ⇒ FAIL（固定句；「存量分流 / 入基线」已废——阈值 = 0；F14 同条）（口径照需求档 §1.15，非自创）；
  基线档 = `test/fixtures/doc-consistency-baseline.json`（§2.18 已列）。
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
  盖住 round 2+ 设计评审（`thincoder-core/advisor.mjs:109-115`）不读 advisor-design.md 的事实。
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
  VSC `src/advisor/tools.mjs（VSC 仓）` **仅当 `reviewType==='design'` 且 batchDoc 已绑定**时追加；**代码评审工具集逐字节不变**（`_resolvedAdvisorToolsFor` 断言）。
- AC41（§2.22.5 适配点②——实例键通道）: batchDoc 沿 **`rv` 实例参数**传递（非单值会话态）；两批设计评审并发各自正确落档。
- AC42（§2.22.6——V1/V2/V3 + 接线 + 跨仓边界）: VSC `check-doc-width.mjs` 扩为一致性扫描（V1/V2/V3）+ 基线读写 + 导出；
  **接线钉死 `test/files.mjs`（VSC 仓） 入册**（`package.json` 不在本批文件域——不得改，轮次2 评审 #4）；**V3 扫描根/跨仓边界**按 §2.22.6 定（本仓缺目录即跳过；真守门在 CLI 侧）；**V1/V2 两面各有用例**。
- AC43（§2.22.7——双源结构 + 端特有段）: VSC 建 `docs/design/prompts/` **15 文件**（与 CLI 同名集合一一对应）；`src/prompts/` 14 → **15**；
  **同名集合两侧相等**（无多无少）；**端特有段进镜像且被断言**（非仅锚句）；VSC 特有文件不得被 CLI 版本整体覆盖（逐差异面登记）。
- AC44（§2.22.9 + 需求 N4——验收不冒充）: 机械面全绿之外，**交付报告必须写明“生效需重载扩展”**；不得以“文件存在/静态断言绿”声称机制已生效（第 2 批教训）。
- AC45（§2.24.2/§2.24.4——需求池指针化；口径对齐 L3①）: CLI `docs/TODO.md` 需求池组**每条为单行**，
  **无多行任务细节续行**；**指针必填态**（`status=在途` / `待核销`）条目须三要素齐备（需求 `<档>` §X ·
  任务书 `batches/…` §2 · status）；**非必填三要素断言态（待讨论 / 待设计——活文件内）**只断言单行形态，
  **不判其指针齐备**——形态权威 = 需求档 §1.13（待讨论 写 `—`、待设计 可挂；**已核销 / 已废弃 = 归档态**——勾销后移出活文件、随条目入 `docs/TODO-archive.md`，活文件不判；2026-09-11 追加裁定 / 修正轮 #8 / 轮次3 #2）；
  **收拢面可机判形态 = 需求池组零续行**（机检 L3① 绿）；原文「既有 4–5 行细节条目已收拢」中的
  **数字不作文本契约**——条目数一律以检查器重算值为准（D3）。
- AC46（§2.24.4——两池分组 + D3 计数）: 需求池组与技术组**互斥不混**（同一板块条目只在一池）；
  每组标题声明的“（N 条）”与组内**未决实条目数相等**（机检 L2 绿——条目口径 = 顶格 `- [ ]`）；
  `status=已核销` / `已废弃` 条目**勾销后移入 `docs/TODO-archive.md`**（活文件零 `- [x]`——机检 L3⑤；**不计入**活组条目数——
  2026-09-11 追加裁定，替代原「就地保留、计入」口径）。
- AC47（§2.24.2——技术待办 (b) 形态）: 每条技术待办 = **指针（可指则指）+ 最小证据行（`file:line` + 症状）**；
  无归属档时指针为 `—`；正文方案叙述不入台账。
- AC48（§2.24.6——机检 + 反证 + 违规一律阻断 / 基线保持为空 + 不进产品提示词）: `node scripts/check-ledger.mjs` 对双端台账 **退出码 0**；
  对**合成坏台账**（坏指针 / 计数不符 / 需求池组非指针行）**报红且退出码 1**（反证非空转）；
  **存量面**：基线（`test/fixtures/ledger-baseline.json`）**必须保持为空**——非空 ⇒ FAIL + 固定句「本基线必须保持为空」（fail-closed；「存量分流 / 入基线」已废——阈值 = 0；F14 同条——与 T71① 对齐）；
  输出形态符合 `<档>:<行号> [L1|L2|L3] <症状> — 期望 … · 实得 …`；
  `grep -r "check-ledger" src/prompts/` **零命中**（FR13）。
- AC49（§2.24.5——双端锚 + VSC 建池；**锚串判据面已退场——整删，删除记录 = `TESTING.md` §11.3**）: 双端 `discipline-engineering.md`（产品 + 中文镜像共 4 文件）
  各含锚 **L-A / L-B 的固定子串**（逐字 grep；子串取自 §2.24.5 锚句）：`同一铁律（指针化、不展开任务细节）` ·
  `锚的形态不同` · `最小证据行（file:line + 症状）` · `组标题声明的条数必须等于组内实条目数`；
  **镜像面 = 锚句逐字**（节内其余文本各端原文自持——不做跨仓逐字节断言）；
  `docs/TODO.md（VSC 仓）` 含**需求池组**且组计数自洽；**锚串判据面已退场（随 AC49 锚用例整删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §11.3）；锚句本体（§2.24.5）不变**。
- AC50（§2.24.3 + §2.24.6 L1/L3④——D3 计数、失效指针、过期 / 未勾销条目）：
  **按指针字符串键控（行号只作 as-of 提示，不作契约——修正轮 #1）**：
  **①D3**：需求档 FR18 行称“**六态**”且 §1.13 表列 **6 行**（D3 机判绿）；
  **②失效指针**：`docs/TODO.md` 中**归属档写作 `docs/design/requirements/PROMPT-SYSTEM.md` 的条目**已改为
  `docs/requirements/PROMPT-SYSTEM.md`；**写「§1.2 FR9」的条目**已改为「§1.3 FR9」——二者机检 L1 绿；
  **③过期状态**：`docs/TODO.md` 中**含 `FR16-FR19` 子串的条目**已重写为只指 FR18（不再以四条整体挂 `待设计`）
  ——**机检（L3④）**：含 `FR18` 的条目 `status` ∈ 六态（**活文件实为未决四态**——已核销 / 已废弃 归归档档）；含 `FR16-FR19` 的条目数 **0**——**验收面 grep 断言**
  （`grep -c "FR16-FR19" docs/TODO.md` = 0；父侧 L2 执行——非 L1–L3 契约判据；轮次3 #3）；
  **④未勾销**：`docs/TODO.md` 中**含「已全部完成」子串的条目**已勾销并**移入归档档**——**验收面 grep 断言**（字面命令式——父侧 L2 执行；§4 12:50 裁定随本链本次写入落笔）：
  `grep -c "已全部完成" docs/TODO.md` **= 0**（已移出活文件）且 `grep -c "已全部完成" docs/TODO-archive.md` **≥ 1**（该条存入、锚行 `- [x]`——2026-09-11 追加裁定后口径）。
- AC51（§2.24.7——不侵入纪律；**全文权威落点 = 本节**，批次档 §2 只引用）: `scripts/check-doc-width.mjs` **零改动**（as-of 298 行不变）；
  宽度扫描域**维持** `docs/{design,requirements,batches}`（`scripts/check-doc-width.mjs:32`）**不变**——本批**未扩至** `docs/TODO.md` / `docs/README.md`；
  `docs/design/PROVIDER.md（VSC 仓）` 零改动。
- AC52（§2.24.2/§2.24.3 交付面——需求档文本已在位）: 需求档 `ENGINEERING-MODE.md` §1.13 含本批新增口径的
  **固定子串**（逐字 grep）：`重分组口径` · `需求点一律入需求池组，技术项一律入技术组` · `(b) = 指针（可指则指）` · `最小证据行`；
  计数面（FR18 行「六态」/ §1.13 表 6 行）由 AC50 断言，本条只断言**文本交付**。
- AC53（§2.26.1——跨仓引用规范）: `docs/README.md` §3.7 含规范 bullet 的固定子串（`跨仓引用形态` · `名称（仓别）§N` · `去路径前缀`）；
  检查器对带 `.md` 的跨仓形态保持 fail-closed 如实报（T72 反证钉住）；规范形态零命中（T72）；`checkSectionRefs` 零改动。
- AC54（§2.26.2——表格行宽度豁免）: T73 绿（T74 已退场——整删，删除记录 = `TESTING.md` §11.3）（豁免谓词 = `isTableRow`；非表格超宽照报；宽度扫描单源——内联重复零残留 grep）；
  `docs/README.md` §3.7 规则 1 含 `表格行豁免` 子串。**判据口径（修正轮 #11）**：「新增超宽 0」= **批前/批后命中集合差**（非 exit 码）；
  豁免后检查器仍报存量非表格命中且 exit 非零（`scripts/check-doc-width.mjs:297`——存量 as-of：37 = 24+13，修正轮实测 38 = 24+14）——**不得读作 exit 0**。
- AC55（§2.26.3 D-1）: `thincoder-core/advisor/messages.mjs` 本批零改动（改动集判据）；实测 ≤500；拆分计划在档（子串 `project-context.mjs` 在位）。
- AC56（§2.26.3 D-2）: 两档各 ≤500（实测对表）；用例数守恒（53 = 42 + 11——**as-of 批 13 交付值**；两档其后增例至
   42 / 21 / 合计 63、2026-09-12 散文锚退役批整删后 = **14 / 4 / 合计 18**（活体守恒锁 = AC57 / T111–T112 的 as-of 基线））；两档独立可跑且全绿、被 glob 自动发现；
  新档零跨档 import（grep：无 `prompts-async-guidance` 引用）。
- AC57（§2.27.1——T111/T112 宿主与断言）: `test/doc-consistency.test.mjs` 新增 T111/T112 两例（**收归族段之后落档**，落档形态逐字见 §2.27.4）——
  T111 = 发现面（快层集）+ 用例计数（`^(?:test|slow)\(`——**as-of 基线 14 / 4 / 合计 18**，增删须同步）+ 两档 ≤500（`split("\n").length` 口径）；
  T112 = 新档零 `prompts-async-guidance` 子串 + import 全 `node:`；
  既有用例（**T41①–⑤ / T46 / T72–T73 / T75 防回潮收归族**；T74/T76 已退场——整删，删除记录 = `TESTING.md` §11.3）零改。机器判据：`node --test test/doc-consistency.test.mjs` 全绿（含新两例）+ 该档 ≤500。
- AC58（§2.27.2——行号指针修正）: 修正表 3 处逐行核验（`:297` = exit 行 / `:32` = `SCAN_DIRS` 声明行 / `:34` = `BASELINE_PATH` 声明行）；
  登记集与历史/as-of 行号**未动**（对照 = 仅表列 3 行变化）。机器判据：核验脚本按「指针行号 → 目标行内容」三断言直跑。
- AC59（§2.27.3——TUI.md §1 回写）: 表内 42 行数值 = **本批落笔 as-of 快照**（2026-09-11 全表实测回写；记录 = §2.27.3 表）；
  表头含单一 as-of + 口径句 + 未入表三档注；`pickers.mjs` 行含迁移注；小命令格与 `/eng` 值 = 回写时点快照。
  **机判作用域 = 本批落笔快照 + 本批触行**（不承诺全表随现盘复现）：① 表头固定子串 grep；② 本批落笔 15 行与 §2.27.3 表对照——
  差异集 ⊆ 交付后刷新轮再触行（key-modes / layout / pickers / wizard——以最新批为准），余 11 行逐行一致；
  ③ **刷新债已登记**（§2.27.3——16 行 + 范围格 + 如实注；**后续触行刷新归各批**，本批不代刷）。
- AC60（批级——机检零新增 + 快层）: `node scripts/check-doc-width.mjs` **新增超宽 0 + 一致性新增违规 0**（存量照报）；
  `node test/run-fast.mjs`（或 `npm test`）全绿。

- AC61（§2.28.4 RF-1——勾销口径 · 4 面）: 四端 `discipline-engineering.md`（CLI/VSC × src/中文权威）旧句「实现后验收标准逐条勾销」**零命中**；替句固定子串「实现后验收勾销落批次档 §6」+「设计档内不写勾销状态」在位（各端自断言）。
- AC62（§2.28.3/§2.28.4 RF-2——内容权与流程）: `requirements/PROMPT-SYSTEM.md` §2.7 #13 含固定子串「仍是产品代码」·「内容权 = 主 agent」·「落笔走正常链」·「eng-designer 起草」；旧口径「不走 eng-coder 实现链」「架构师直接」在本档内零命中；§8 标题/状态行无「待设计」、§8.2 为已关闭注、「9 条裁定」零命中。
- AC63（§2.28.4 RF-3——作者归属）: `docs/README.md` 含「eng-designer 产物」且「过渡期主 agent 代行」零命中；`AGENTS.md` 含「eng-designer 产物」口径句（无「主 agent·产品经理产物」）；设计档 §2.1 为三段链三行表（含 eng-designer 行）+ 无「目标态注」残留；需求档 §1.6 无「尚未落地」。机器判据：grep + `node --test test/eng-designer-role.test.mjs`（T40 更新后）绿。
- AC64（§2.28.4 RF-4——子代理角色句）: 双端 `persona-eng-coder` 无「architect/架构师」「provided a design document」旧句、VSC 侧无「Update the affected design-doc sections」句、VSC 中文权威面无「受影响的设计档章节随 diff 更新」句（修正轮 #4）；含固定子串「product manager and flow orchestrator」/「产品经理与流程编排者」+ 报告口径句；discipline 头注 consumers 含 eng-designer（4 面）。
- AC65（§2.28.4 RF-5——登记面）: 需求档 header 无「九条」、§1.5 收口块在位、§1.17 落地注在位；设计档 §2.15/§2.16 无「过渡期由主 agent 代行」「九条」类残留（修正轮 #3——核销句不命中该子串，零假红）、§2.1 核销注在位；`ENGINEERING-MODE.md`（VSC 仓）陈旧面已修（角色 enum 含 eng-designer · 槽位清单/受影响文件含 persona-eng-designer · 装配句含 designer 分支 · 无「METHODOLOGY 驱动」）。
- AC66（批级——机检零新增 + 快层）: `node scripts/check-doc-width.mjs` **新增超宽 0 + 一致性新增违规 0**（存量照报；口径 = **批前/批后命中集合差**——本批改动文件）；`node test/run-fast.mjs`（或 `npm test`）全绿；VSC 仓快层按其清单全绿。
  **归属注**：as-of 实跑余 1 条非本批新增一致性命中（`batches/2026-09-11-PORTABILITY.md` 发现表行的自指段引用——指向批次档不存在的第 9 节，应为设计档 `PORTABILITY.md` §9；他链在飞，D5）——归其链修，不计入本批。

- AC67（§2.27.8——设计档侧非表格超宽折行）: 5 处折行后逐处命中归零（`AGENT-LOOP.md` `:510`/`:572`/`:574` · `SESSION.md` `:524` · `SUBAGENT-ID-COUNTER-AGENT.md` `:53`——按「文件 + 折后首行内容」键控，行号只作 as-of）；各折行处 `〔eng-designer 折行 …〕` 标注在位；
  批前/批后宽度命中集合差 = **仅本批 5 处**（他链在飞照报——归其链，不计入本批）；本批改动面新增一致性违规 0。机器判据：`node scripts/check-doc-width.mjs` 前后对照。

- AC68（§2.29.2 C1——描述面同步；修正轮 #4）: `thincoder-core/tool-docs/read_image.md:8` 与 §2.29.2 定稿替句**逐字全等**（整行替换——逐字全等蕴含一切旧串零命中：两名单全 6 名 +「Pure text models」）；
  `thincoder-core/tools/file.mjs` 本批零改动（`git diff` 空——spec 驱动真值面）。
- AC69（§2.29.3 C2——旧锚清理）: CLI `src/**` 内 `§24` 零命中（grep）；映射表 29 处逐处落位（键控 = 文件 + 新锚串——逐行对照 §2.29.3 表）；
  `§11.1`/`§11.2`/`§11.3` 在新锚位分别在位（域 A 9 处 / 域 B 19 处 / 域 C 1 处）。
- AC70（§2.29.4 C3——VSC 机制正文同步）: `AGENT-LOOP.md`（VSC 仓）内旧串「单一判据）输入禁用」「readOnly + busy」零命中；
  替句子串「提交拒收」「readOnly 锁已撤」「主会话处理中——Enter 提交禁用——可继续输入」在位。
- AC71（§2.29.5 C4——注释断链）: `src/tui/wrapped-spawn.mjs` 内「docs/design/TUI-STDERR-CAPTURE.md」零命中（该档已归档——DOC-REORG 批）；
  「TUI-STDERR-CAPTURE F-1/F-3」在位；该档 diff 仅 1 行（其余注释逐字未动）。
- AC72（§2.29.6 C5——需求档同步）: 五点位逐点子串在位（① 段表「写入手段」列 + 6 行填值；② B9 行 `若传则须可读` + `§3 段不在评审对象清单内`；
  ③ F1 段 `评审侧口径`；④ N2 段 `§3 段不在评审对象清单内` 且「非被审文档」零命中；⑤ N3 行 `15+15=30` 且该行 `29 文件` 零命中）。
- AC73（§2.29.7 C6——死产物删除）: `thincoder-cli/.thincoder/index/` 不存在（目录判据）；`thincoder-vscode/.thincoder/index/` 存在且本批零触碰（对照）。
- AC74（批级——机检零新增 + 快层）: 两仓 `node scripts/check-doc-width.mjs` **新增超宽 0 + 新增一致性违规 0**（存量照报；口径 = 批前/批后命中集合差）；
  CLI `node test/run-fast.mjs`（或 `npm test`）全绿；VSC 快层按其清单全绿。
  **归属注（设计期实跑——as-of 2026-09-11）**：宽度超宽与 V1 新增加计均为**他链在飞项**（PORTABILITY 批次档的自指 §9 ·
  TUI-SELECTION 批次档的自指 §12.4 等）——**非本批文件**（D5）——归其链修，不计入本批；本批文件两仓命中 0。

- AC75（§2.24.9④——归属修订；文本 + 台账面）: 需求档 `ENGINEERING-MODE.md` §1.13 含固定子串「记录 + 状态推进 + 物理落笔」·
  「收拢应用清单」（职责分工段）；旧口径「状态推进 = eng-designer」在需求档 §1.13 与两仓台账头部**零命中**
  （grep 断言——两仓头部行由父侧落笔）。
  **已退役（2026-09-12 PROSE-ANCHOR-RETIRE）**——判据面作废（散文锚：读非测试档断言文本在场/缺席；见 `TESTING.md` §11.5）；需求本体（§2.24.9④ 归属修订）不变。
- AC76（§2.24.9①——归档口径 / 机检 L3⑤）: 两仓活台账 `- [x]` 条目 **= 0**（`grep -c "^- \[x\]"`）；
  合成「活文件含 `- [x]`」样本 → `[L3]` 报红 + 退出码 1（反证——T92）；两仓 `docs/TODO-archive.md` 存在且含键控条目
  （CLI =「已全部完成」·「parseValue」；VSC =「eng(enter)」）；需求档 §1.13 含固定子串「活文件只留未决」·「TODO-archive.md」；需求档 §1.17「台账归档对位」块含固定子串「台账归档对位」·「同 basename」（轮次 4 #7——并入本子串族）。
- AC77（§2.24.9②——触发字段 / L3⑥）: 需求档 §1.13 含三枚举固定子串（`归批` · `条件` · `认账不排期`）与「待处置」句；
  机检 L3⑥：`触发=` 取值非三枚举 → 报红；**无触发** → 不进红、进审计报告（T93 / T94）。
- AC78（§2.24.9③——老化报告 / 审计模式）: `node scripts/check-ledger.mjs --audit` 对合成台账（无触发条目）输出
  「待处置清单」+ 逐条 `<档>:<行号>`；超 N 天者带「老化」标记；**退出码 0**；**运行前后两仓台账字节不变**（不自动删/改——T94）。
- AC79（§2.24.9①/②执行面——两仓收拢应用清单）: 批次档 §2 含「两仓台账收拢应用清单」表（逐条判定 ∈ {留池 / 移技术组 / 归档 / 勾销}；
  键控 = 指针字符串）；执行后键控抽验（CLI 归档档「已全部完成」·「parseValue 两端不一致」·「跨批依赖」；VSC 归档档「eng(enter)」·「Gitee open 巡检」）——已退场（段删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §11.3）；活文件组计数 = 未决数（L2 绿——T96）。

- AC80（§2.30.3.1——数字单源 / F7）: `scripts/check-ledger.mjs` 消费 `src/ledger.mjs`（grep `src/ledger.mjs` 在场）；
  同一夹具下 `summarizeLedger` 的 `pool`/`tech` 计数 == `checkLedger` L2 判据的「组内未决条目数」（T97 反证：改一条 → 两侧同步变）；
  `check-ledger` 既有用例（T67–T94 + T96；T95 已退场——删除记录 = `TESTING.md` §11.3）**零改全绿**（L1–L3 语义零改）；`grep -r "check-ledger" src/prompts/` 零命中（FR13——既有不变）。
- AC81（§2.30.3.3——行文本逐字 / F1+F2）: L1–L4 四形态与 §2.30.3.3 逐字全等（formatter 直驱断言——含 `台账 4·32`、`（老化 0）` 恒显、`— 可开批` 后缀、`；…` 截断、**无粗体段回退标题**〔修正轮 #3〕）；
  `--summary` 输出 = L2 序列（T98/T99/T104）。
- AC82（§2.30.3.2 + §2.30.3.4——可动作门 / F3①；修正轮 #2）: **任一项目**可动作（`aged>0` 或阈值）→ 启动行（明细行集）出现；不可动作 → **会话流零行**——**常驻标记不受此门约束**（F2：标记照显、`aged=0` 默认色——T98）（T100 两侧）。
- AC83（§2.30.3.2——阈值口径 / F3③）: 池 ≥3 或任一板块 ≥2 达阈；反例（池 2 条跨两档各 1）不达阈（T101）。
- AC84（§2.30.3.2——老化口径 / F7）: 仅技术组无 `触发=` 且行龄 >30 天者计老化（夹具 git 回填界值 29/31 天——T102）；行龄未知 → 不计且不抛。
- AC85（§2.30.3.2——去重 / F5；修正轮 #3）: 同一事件只报一次；跨会话（状态档在场）零重报；送达后才记账（未送达不记）；**条目键 = 条目归一化文本**（行位移 / 他条编辑零重报；同条文本变更 = 一次新增——T103）（T103）。
- AC86（§2.30.3.6——收口行 / F6；修正轮 #1）: `node scripts/check-ledger.mjs --summary` 输出 = L2 序列逐字 + 退出码 0 + **运行前后台账字节不变**；
  四提示词文件与需求档 §1.12/§1.15、设计档 §2.19 含固定子串 `台账可见面（收口行）`；**四提示词文件另含 `--summary` 子串、不含脚本名**（两锚即全部断言面——T105 已退场：整删，删除记录 = `TESTING.md` §11.3；`check-ledger` 零命中归 AC48/AC80）。
- AC87（§2.30.3.4/§2.30.3.5——渲染接线 / F2+F8）: CLI：`buildStatusLine` 在 `scrollHint` 后注入 L1，空标记零注入（字节等价）；
  VSC：item `text`=L1 / `tooltip` 含全部 L2 行 / `aged>0` → warningBackground / 无台账 → hide；webview `ledgerNotice` → `.ledger-line` 行入 messages（T106–T108）。
- AC88（§2.30.3.2——项目发现 / F4）: `current` = 向上最近含台账目录（T109①②）；容器目录（无台账且子目录含台账）→ current=null、projects=子目录族；
  全无台账 → current=null、projects=[]、零输出（T109③）。
- AC89（§2.30.3.2 + §2.30.8——降级与成本 / N1+N2；修正轮 #5）: 台账不可读 / 去重档坏 JSON / 非 git → 零抛出（T110）；
  无候选条目项目零 git 子进程（计数断言——不调 `blameAges`）；两仓夹具单次刷新 ≤500ms（慢层实测）；
  **headless 面零接线**（文件域判据：`bin/thincoder.mjs` 本批 `git diff` 空 + 其内 `ledger` 零命中——T110④ 承载 N1「headless 零新增输出」）——`ledger` 零命中机判面已退场（段删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §11.3）。
- AC90（批级——机检零新增 + 快层）: 两仓 `node scripts/check-doc-width.mjs` **新增超宽 0 + 新增一致性违规 0**（存量照报；口径 = 批前/批后命中集合差）；
  CLI `node test/run-fast.mjs`（或 `npm test`）全绿；VSC 快层按其清单全绿（含 `test/ledger.test.mjs` 入册）。
  **归属注（设计期实跑——as-of 2026-09-12）**：唯一新增 V3 命中 = **本批批次档 §4 占位段内的 `---` 分隔行**（骨架标点被 V3 判为实文——
  在飞态瞬态：§3 获评审轮次行后自消）；归父侧收紧（去掉该行）或随评审自消——**非本批代码面**（批次档 = 父侧写域）。

- AC-V5-1（§2.32.3.1——用例号锚 / F1+F3）: 夹具三例（①引用未定义号 ②引用 test 树/定义面存在的号 ③悬空但同行带退场注记）→ **仅 ① 报**；
  ②③ 零命中（反证非空转 + 零假阳；T-V5-1）。
- AC-V5-2（§2.32.3.1——路径/坐标锚 / F1）: 夹具四例（① 悬空路径 ② 现存路径 ③ 占位形态（`<file>.md` / 末段占位集）④ 裸 basename 无坐标）→ **仅 ① 报**（T-V5-2）。
- AC-V5-3（§2.32.3.1——符号锚 / F1）: 夹具三例（① 有定义谓词 + 宿主坐标但宿主无此符号 ② 宿主有此符号 ③ 无定义谓词/无宿主的悬空符号）→ **仅 ① 报**（③ 射程外——不报；T-V5-4）。
- AC-V5-4（§2.32.3.4——假阳类 / F2+N1）: 夹具覆盖假阳表十类（内部编号 / 库·平台 API / 提交哈希 / fenced 与命令行 / 夹具占位路径 / 运行期面 / 对端仓**违规形态**（裸直引——V5 跳过）/ 退场·换名·归档叙述行 / 裸 `T<数>.<数>` / `TLS12` 类标识符）→ **全零命中**（逐类可判——T-V5-5）。
- AC-V5-5（§2.32.3.5——两态 / F4）: 同一夹具域：`gate:false` → 命中非空 + 主行程**退出码 0** + 输出含报告段标记；`gate:true` → **退出码 1**（两态由显式参数驱动——逐态可判；T-V5-6/T-V5-7）。
- AC-V5-6（§2.32.3.5——基线 / N2）: `test/fixtures/doc-consistency-baseline.json` `entries` = `[]`；V5 命中**不入基线**（两态均不写）；非空 ⇒ FAIL（既有判据零改；T-V5-8）。
- AC-V5-7（§2.32.3.5——全量清单 / F5）: CLI 输出逐条清单（档:行 + 锚 + 锚类）+ 汇总（各类候选数 / 悬空数 / 注记豁免数 / 域外数 + 报告态标记）——可重定向落盘作层 2 清账输入（T-V5-9）。
- AC-V5-8（§2.32.3.6——射程边界 / F10）: 夹具（后接 `§N` 的引用 / **对端仓直引的 V4 违规形态**（枚举外——裸 `thincoder-vscode/…` / `VSC 仓` + 裸 `§N`）/ “N 项”计数声明）→ **V5 零命中**且 V1 / V4 / V2 各自照报（不重复报行；T-V5-10）。
- AC-V5-9（§2.32.3.2——降级 / N1）: 夹具仅建本仓树（无对端）+ **合规形态**（`路径（仓别）`——E3）锚 → 记「域外」入报告行、**不阻断、零抛出**；不得静默放过 / 静默报红（与 AC-V5-8 夹具**互斥两类**；T-V5-11）。
- AC-V5-10（§2.32.4——清账完成判据 / F6）: 本仓扫描域（`docs/design` + `docs/requirements`）三锚命中 = **0**；`node scripts/doc-anchors.mjs --v5-gate` 退出码 0——核验面 = **轮 2 收口复跑**（首跑清单 → 清账 → 复跑；轮 1 快层不断言真实域——夹具两态见 T-V5-12）。
- AC-V5-11（§2.32.3.5——收紧落位 / F4+F6）: `V5_GATE` = `true`（轮 2 翻转）+ 闸态夹具命中 ⇒ 退出码 1 + 基线仍空（V5 不进基线）；收紧点三条件逐条可验（T-V5-12 夹具两态 + 轮 2 复跑）。
- AC-V5-12（§2.32.5.1——反查纯函数 / F7）: 直驱 `docImpact({changedFiles, changedSymbols, docsRoot})` 夹具 → 返回命中档清单（每档带命中词）；反证：无关联变更 → 空清单；**退出码 0**（非门禁；T-V5-13）。
- AC-V5-13（§2.32.5.1——反查 git 包装 · **慢层 `slow()`** / F7）: 临时 git 仓夹具（改动档导出符号 + 设计档引用该符号）→ CLI 输出含该设计档（子进程/真实 git 类归册；T-V5-14）。
- AC-V5-14（§2.32.5.2——V5 常驻接线 / F8）: `test/doc-anchors.test.mjs` 被快层 glob 发现（`readdirSync(test)` 含该档）+ 快层全绿（未接线 = 红；T-V5-15）。
- AC-V5-15（批级门）: 两仓 `node scripts/check-doc-width.mjs` **新增超宽 0 + 新增一致性违规 0**（口径 = 批前/批后命中集合差）；CLI 快层全绿；改动档守 500 硬限（新四档 ≤300）。
- AC-V5-16（§2.32.8——既有判据零伤 / N5）: `SCAN_DIRS` 三元素逐字不变；V1–V4 输出**批前/批后逐字节一致**（批级对照运行——变更前快照 vs 变更后复跑，对照记录入批次档 §5）；V1–V4 夹具域判定集合 = 钉死快照（`test/doc-anchors.test.mjs`——T-V5-16）；L1–L4 / 宽度域 / 台账域零触碰（本批变更面仅 `scripts/check-doc-width.mjs` 两处 `export` 前缀）。

**无机械判据项（明示——F9 / F17）**：① 语义巡检机制（无锚语义句——机器判不了；周期 / 归属 / 记录形态见 §2.32.5.3）
② 提示词层逐字落笔（F15–F17——落笔面验收 = coder 交付报告 + 评审；**不设机检锚**：提示词句子断言属已退役的散文锚面，`TESTING.md` §11）。

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
| T32 | 边界：装配不静默回退 | `assemblePrompt("eng-designer")` | prompt 非空（>500）、槽表行 + warnings=[]；≠ CONSULT_BASE / 槽序正确——已退场（段删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §11.3） | AC17/FR9 |
| T33 | 错误：designer 无 batchDoc | 工程模式合法上下文（**不带凭证**）、不带 batchDoc | throw（文案含 eng-designer） | AC18/FR20#9 |
| T34 | **边界：写域纪律（提示词级）** | — | 已退场（整删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §11.3） | AC19/**§1.5#8** + 批次档 §1 对账发现 2 |
| T35 | 边界：勘察受限 | designer 内 spawn `role="coder"` / `role="explore"` | 前者拒（explore-only）、后者允；**且勘察任务输入不含 Audit scope 块**（评审 #4） | AC20/§1.5#7 |
| T36 | 边界：designer 无 token 需求 | spawn 不带 designToken | 通过（不需凭证——与 eng-coder 形成对照） | AC20/§1.5#4 |
| T37 | 边界：纪律锚驻留（**AC21/AC22 共用例**） | 四条纪律句 + 四步三句 + D2/D5/D6 三句双源 grep + 锚断言；新 person 文件已入 NEW_PROMPTS | 双源命中；锚断言绿 | AC21/**AC22** |
| T38 | 边界：主 agent 人格改述 | 双源 grep `persona-engineering.md` | 含产品经理/会话面身份；不含 `ARCHITECT`/`You design and delegate` 类交付物句 | AC23/FR9#1#2 |
| T39 | 边界：designer 写操作走 ask（评审 #7） | designer 子代理写 `docs/x.md`（manual 档位） | 触发父侧授权（非静默）；授权后可“全部授权/切自动” | AC26 |
| T40 | 边界：写权路由单一口径（**AC27/AC27b 用例——六面**） | grep §2.2 step1/step10 / §2.8 / §2.15 A2 / §2.6 F2 / §2.5 / persona-engineering（双源） | 六面路由句类正向锚 + 无“父代理更新设计文档”残留 + 勾销无“进设计档”字样——已退场（段删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §11.3）；现体 = §2.8 切片非空 | AC27+AC27b/FR9#3 |
| T41 | 正常：文档一致性机判 | 跑 `test/doc-consistency.test.mjs`（V1 段引用 / V2 计数） | **基线必须为空 + 扫描域零违规**（非空即 FAIL）；人为制造一条计数不符 → 报红（反证非空转） | AC28/§2.19 D3-D4 |
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
| T49 | 正常：多轮提示词面（评审 #3） | grep 双源 `advisor-design.md` / `advisor-round2.md` / `advisor-round3.md` | 三档均含写入 §3 指令，**且该句已限定“仅设计评审 / 工具可用时”**（round2/3 为设计+代码共用——`thincoder-core/advisor.mjs:109-120`，未限定会让 round 2+ **代码**评审误报“§3 未写入”） | AC35/FR22F3F4 |
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
| T63 | 正常：V1/V2 + 跨仓注记（发现 #5 · 轮次3 评审 #7） | ①人造段引用失配 ②计数声明与列表不符 ③基线内条目（存量） ④**带“（CLI 侧）”注记的引用行** | ①②**报** ③**不再降报告分流**（生产路径：非空基线 ⇒ FAIL——入基线 = 例外 = 违规） ④**豁免不报**（注记行不判） | AC42/F5 |
| T64 | 正常：接线（发现 #5） | `test/files.mjs`（VSC 仓） 入册并实跑 | 校验器**真被跑到**（未接线 = 红） | AC42/N3 |
| T65 | 边界：主 agent 人格（轮次2 评审 #1，对齐 CLI T38） | 双源 grep `src/prompts/persona-engineering.md（VSC 仓）` + 中文镜像 | 含产品经理身份 + spawn eng-designer 调用链；**不含 ARCHITECT/交付物句** | AC39/FR23 |
| T66 | 边界：并发隔离（轮次3 评审 #4——镜像 CLI T51） | 两个设计评审（不同批次档）并发启动并各自写 §3 | **各自落自档**（RV 实例键绑定），不得串档 | AC41/§2.22.5 |

**第 8 批用例（T67–T71——需求池指针台账 / 台账机检）**

| # | 场景 | 输入 | 预期输出 | 映射 |
|---|---|---|---|---|
| T67 | 正常：台账机检全绿 | `node scripts/check-ledger.mjs`（CLI + VSC 修正后台账） | 每档一行 `OK: <档>`；**退出码 0**；**对端仓不可读 / 本仓缺目录 → 该档跳过不报**（降级不阻断——对称 T61 ④ 跨仓口径） | AC48/L1-L3 |
| T68 | 错误：坏指针必报红（反证） | 合成台账：引用不存在的档 / 存在档但无该 §X | 逐行 `<档>:<行号> [L1] … — 期望 … · 实得 …`；**退出码 1**（防空转脚本） | AC48/L1 |
| T69 | 错误：计数不符必报红（D3） | 合成台账：组标题写“（5 条）”而组内 3 条 | 报 `[L2]` 违规 + 汇总计数；**退出码 1** | AC46/L2 |
| T70 | 边界：形态违规（含 status 枚举与分组识别——修正轮 #3/#5） | ①需求池条目带续行细节 ②技术条目缺证据行 ③技术项混入需求池组 ④条目 `status=登记`（六态外） ⑤未带 `需求池`/`技术` 标记的 `##` 组内条目锚形态杂 | ①②③④各报 `[L3]`（逐例可判，不得只报其一）；**④机外取值照报（不再入基线豁免——阈值 = 0）**；⑤**不判 L3③**（分组识别凭标题标记）——仍受 L2 计数与 L3① 约束 | AC45/AC47/AC48/L3 |
| T71 | 边界：基线不得再设（非空即 FAIL）+ 域不侵入 | ①非空基线 ②对 `docs/design/**` 运行宽度检查 | ①**FAIL**（固定句「本基线必须保持为空」——违规照报；入基线 = 例外 = 违规） ②`check-doc-width.mjs` 与台账检查**互不侵入**（各自域） | AC48/AC51 |

**第 13 批用例（T72–T73 + T111–T112①——文档机制边界与拆分；T74 已退场——整删，删除记录 = `TESTING.md` §11.3）**

| # | 场景 | 输入 | 预期输出 | 映射 |
|---|---|---|---|---|
| T72 | 正常/反证：跨仓引用（B） | 夹具两行：`WEBVIEW.md` §5 形态 / `WEBVIEW（VSC 仓）§5` 规范形态 | 前者报 `unknown-doc`（fail-closed 钉住——防未来静默放开）；后者零命中；`docs/README.md` §3.7 规范子串在位——已退场（段删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §11.3） | AC53 |
| T73 | 正常：宽度表格行豁免 | 夹具：>300 字符表格行 + >300 字符非表格行 | 表格行零报告；非表格行照报（含行号） | AC54 |
| T74 | 边界：宽度扫描单源 | — | 已退场（整删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §11.3） | AC54 |
| T111 | 正常：拆分守恒（原设计号 T75①） | 拆分后两档 + `node test/run-fast.mjs` | 用例数 = as-of 基线（A 14 · B 4 · 合计 18——增删须同步）；两档各 ≤500；全绿且被 glob 发现 | AC56 |
| T112 | 边界：新档自持（原设计号 T76①） | 新档源码 | 零跨档 import（无 `prompts-async-guidance` 引用） | AC56 |

> ① 编号避让（修正轮）：`test/doc-consistency.test.mjs` 档内已存 `T75/T76 防回潮（收归族）` 标题（2026-09-11 TEST-LIFECYCLE 并档）——
> 本两例宿主落地改号 **T111/T112**（宿主与断言形态见 §2.27.1 / §2.27.4）。

**角色重定义批用例（T77–T82）**

| # | 场景 | 输入 | 预期输出 | 映射 |
|---|---|---|---|---|
| T77 | 正常/反证：勾销口径 4 面 | 四端 `discipline-engineering.md` grep（旧句 / 替句）；合成含旧句样本 | 旧句零命中 + 替句子串在位；含旧句样本被断言捕获（反证非空转） | AC61 |
| T78 | 正常：内容权口径 | `requirements/PROMPT-SYSTEM.md` grep（固定子串 + 旧口径 + §8 状态） | 固定子串全中；旧口径与「待设计」零命中 | AC62 |
| T79 | 边界：作者归属 | `README.md` / `AGENTS.md` / 设计档 §2.1 / 需求档 §1.6 grep + `node --test test/eng-designer-role.test.mjs` | 口径子串在位；过期限定零命中；T40 更新后全绿 | AC63 |
| T80 | 边界：子代理角色句 | 双端 `persona-eng-coder` grep + VSC 断言（自审第 6 条） | 旧句零命中；新子串在位 | AC64 |
| T81 | 边界：登记面 | 两档 grep（计数/过渡期表述/§1.17）+ `ENGINEERING-MODE.md`（VSC 仓）人工核（修正轮 #3） | 无「九条/过渡期由主 agent 代行/尚未落地」残留；落地注在位 | AC65 |
| T82 | 正常：批级门 | `node scripts/check-doc-width.mjs` + CLI 快层 + VSC 快层 | 新增超宽 0 / 新增一致性违规 0；两仓快层绿 | AC66 |

**收尾批续做用例（T83——设计档侧超宽折行）**

| # | 场景 | 输入 | 预期输出 | 映射 |
|---|---|---|---|---|
| T83 | 正常：设计档侧超宽清零 | `node scripts/check-doc-width.mjs`（批前/批后） | 本批 5 处命中归零；批前/批后差 = 仅本批 5 处（他链在飞照报） | AC67 |

**文档 / 产品文案卫生批用例（T84–T91——静态判据为主）**

| # | 场景 | 输入 | 预期输出 | 映射 |
|---|---|---|---|---|
| T84 | 正常：C1 描述面 | `thincoder-core/tool-docs/read_image.md:8` 与定稿替句逐字比对 + `thincoder-core/tools/file.mjs` diff | `:8` 与定稿替句逐字全等（蕴含旧串零命中）；`file.mjs` diff 空 | AC68 |
| T85 | 正常：C2 清理 | `src/**` grep `§24` + 逐行对照 §2.29.3 映射表 | 0 命中；29 处新锚逐处落位（域 A 9 / B 19 / C 1） | AC69 |
| T86 | 边界：C2 扫描域 | 同 grep 于 `test/**` / `docs/**` | scope = `src/**`；`test/advisor-description.test.mjs:18`（已退场——TEST-LIFECYCLE）变更注与 `docs/**` 记史面不判 | AC69 |
| T87 | 正常：C3 同步 | `AGENT-LOOP.md`（VSC 仓）grep（旧串 / 新串） | 旧串零命中；新子串在位 | AC70 |
| T88 | 正常：C4 断链 | `src/tui/wrapped-spawn.mjs` grep + diff | 归档路径串零命中；diff = 1 行 | AC71 |
| T89 | 正常：C5 五点位 | `docs/requirements/ENGINEERING-MODE.md` grep（五点位子串） | 逐点全中；旧措辞（「非被审文档」/ N3 行「29 文件」）零命中 | AC72 |
| T90 | 正常/边界：C6 删除面 | 目录存在性检查（两仓 `.thincoder/index`） | CLI 侧不存在；VSC 侧存在且零触碰 | AC73 |
| T91 | 正常：批级门 | 两仓 `check-doc-width` + CLI/VSC 快层 | 新增超宽 0 / 新增一致性违规 0；两仓快层绿 | AC74 |

**第 8 批用例·范围扩展（T92–T96——归档 / 触发 / 老化 / 收拢执行）**

| # | 场景 | 输入 | 预期输出 | 映射 |
|---|---|---|---|---|
| T92 | 错误：活文件 `- [x]` 必报红（反证） | 合成台账：活文件含 `- [x]` 条目（未移出） | 报 `[L3]`（归档口径）+ 退出码 1；移出后（归档档侧）→ 绿 | AC76/L3⑤ |
| T93 | 错误：非法触发取值必报红 | 合成台账：技术条 `触发=随便`；对照 `触发=归批（第 8 批）` | 前者 `[L3⑥]` 红 + 退出码 1；对照条绿；**无 `触发=` 场不报红** | AC77/L3⑥ |
| T94 | 边界：待处置清单 + 老化（审计模式——**慢层 `slow()` 门控**：含 fs / git 子进程；轮次 4 #6） | `--audit` 对合成台账：1 条无触发新鲜 + 1 条无触发超龄（夹具 git 回填行龄——**commit 日期钉常量**〔超龄条〕，零壁钟依赖） | 「待处置清单」两条均列；超龄者标「老化」；**退出码 0**；运行前后文件字节不变 | AC78 |
| T95 | 边界：归属修订文本面 | grep：需求档 §1.13 / 两仓台账头部行 | 新句在位（「记录 + 状态推进 + 物理落笔」）；旧句「状态推进 = eng-designer」零命中。**已退役（2026-09-12 PROSE-ANCHOR-RETIRE——判据面作废；见 `TESTING.md` §11.5）** | AC75 |
| T96 | 正常：收拢执行面（键控抽验） | 两仓台账 + 归档档（收拢执行后） | 归档档键控条目（CLI/VSC 各 ≥2）——已退场（段删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §11.3）；活文件 `- [x]` = 0 + 组计数 = 未决数（L2 绿） | AC79/AC46 |

**台账可见面批用例（T97–T110——LEDGER-SURFACE；含慢层 git 夹具）**

| # | 场景 | 输入 | 预期输出 | 映射 |
|---|---|---|---|---|
| T97 | 正常：单源等价（反证） | 合成夹具台账（两池各若干条）+ 人为改一条后重跑 | `summarizeLedger` 计数 == `checkLedger` L2 实际数；改动后两者同步变（非空转） | AC80/F7 |
| T98 | 正常：状态标记形态 | 扫描结果 `{pool:4,tech:32,aged:0}` / `{aged:3}` | L1 逐字 `台账 4·32`；aged=0 默认色、aged>0 warn 态（直驱色语义） | AC81/F2 |
| T99 | 正常：明细行 / 变化行逐字 | 阈值达成 / 未达成 / 老化 +2；>3 条标题截断；**无 `**…**` 条目（标题回退）** | 与 §2.30.3.3 模板逐字全等（含 `— 可开批`、`；…`、回退标题 = 归一化文本前 20 字） | AC81/修正轮 #3 |
| T100 | 边界：启动行门 | ①可动作（aged>0）②可动作（阈值）③不可动作（池 1 条同板块且老化 0） | ①②出 L2 行（首达阈时带 L4）；③**会话流零行**（标记照常显——默认色；修正轮 #2） | AC82 |
| T101 | 边界：阈值三例 | ①池 2 条同一需求档 ②池 3 条跨三档 ③池 2 条跨两档（各 1） | ①②达阈；③不达阈 | AC83 |
| T102 | 边界：老化界值（慢层 `slow()`——git 夹具，commit 日期钉常量） | 夹具 git 回填：29 天 / 31 天 / 31 天但带 `触发=认账不排期` | 仅「31 天且无触发」计老化；余不计 | AC84 |
| T103 | 正常：去重 + 送达门 + **条目键稳定性**（修正轮 #3） | 首扫（新增老化 + 首达阈）→ 再扫同状态 → 再改一条后再扫；另：**行位移 / 他条编辑后重扫**、**同条文本编辑后重扫**；post 失败（面板未就绪）不记账 | 首扫 2 行 + 记账；再扫 0 行；改动后仅新事件 1 行；位移 / 他条编辑 **0 行**（键稳定）；同条文本编辑 **1 行**（键变 = 一次新增）；未送达后补送达重报 | AC85/F5 |
| T104 | 正常：收口行命令 | `node scripts/check-ledger.mjs --summary`（夹具族）；空族目录对照 | 输出 = L2 序列逐字；退出码 0；运行前后台账字节不变；空族输出「未发现台账」行 | AC86/F6 |
| T105 | 正常：收口行槽位（文本面；修正轮 #1） | — | 已退场（整删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §11.3） | AC86 |
| T106 | 正常：CLI 状态行接线 | `buildStatusLine` 直驱：marker=null / marker 平态 / marker+warn | null → 零注入（字节等价）；非 null → ` │ 台账 4·32` 在位；warn → 警示色段包裹 | AC87/F2 |
| T107 | 正常：VSC item 形态 | `refreshLedger` 直驱（vscode-mock） | `text` = L1；`tooltip` 含全部 L2 行；aged>0 → warningBackground；无台账 → `hide()` | AC87/F8 |
| T108 | 正常：VSC webview 渲染（happy-dom——真 chat.js） | `{type:"ledgerNotice", lines:[…]}` 直驱 | `.ledger-line` 逐行入 `#messages`；warn 类仅警示行；连续两次消息不吞行 | AC87/F8 |
| T109 | 边界：项目发现 / 无台账 | ①cwd 深路径（含台账仓内）②容器目录（子目录含台账）③无任何台账 | ①current = 该仓 ②current=null、projects=子目录族 ③current=null、projects=[]、零输出 | AC88/F4 |
| T110 | 错误：降级不崩（修正轮 #5：+headless 文件域） | ①台账档不可读 ②去重档坏 JSON ③非 git（`ageOf`→null）④headless 文件域 | ①该项目跳过（余者照常）②按空态重新记账（最坏一次重报）③老化 0 且不抛；④`bin/thincoder.mjs` diff 空 + 其内 `ledger` 零命中（零接线）——已退场（段删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §11.3） | AC89/N1 |

> 快层归属：T102 / AC89 计时断言走 `slow()`（fs / git 子进程——`test/slow.mjs` 归册制）；余例直驱纯函数或 mock（快层）。

**文档↔实装对账批用例（T-V5-1–T-V5-16——DOC-CODE-RECONCILE；设计 §2.32 / AC-V5-1–AC-V5-16）**

| # | 场景 | 输入 | 预期输出 | 映射 |
|---|---|---|---|---|
| T-V5-1 | 正常/反证：用例号锚（定义面 + 注记） | 夹具：① 悬空号（三源均无、同行无注记）② 在 test 树存在的号 ③ 悬空但同行注记 | 仅 ① 报（报行含档:行 + 号 + 锚类）；②③ 零命中 | F1/F3 |
| T-V5-2 | 正常：路径/坐标锚（射程 + 排除式 5① 收窄 / 行区间） | 夹具：① 悬空路径 ② 现存路径 ③ `<file>.md` 占位 ④ 裸 basename 无坐标；⑤ 非 `.md` + `§N` 照判（存 / 缺两向）· `:N-M` 坐标整条抽取（轮 3 补） | 仅 ① 报；③④ 射程外不报；⑤ 非 `.md` 不豁免——缺 ⇒ 报（收窄反证） | F1 |
| T-V5-3 | 边界：解析序（档相对 / 唯一 basename / 对端合规形态） | 夹具：① `../requirements/x.md`（档相对可解析）② 唯名 basename（仓内唯一）③ 对端**合规形态** `thincoder-vscode/…（VSC 仓）`（可达且存在） | 三者均通过（零命中——③ = 合规形态入域判存在性的正例） | F1 |
| T-V5-4 | 正常/反证：符号锚窄形态 | 夹具：① 定义谓词 + 宿主坐标但宿主无此符号 ② 宿主有此符号 ③ 无宿主/无谓词的悬空符号 | 仅 ① 报；③ 不报（归宽形态报告面） | F1 |
| T-V5-5 | 边界：假阳类十类零命中（逐类钉死） | 十类夹具：① 内部编号（`AC-V5-1` / `D-V5-1` / `F-x` / `N-x`）② 库·平台 API（`preventDefault`）③ 提交哈希（40 位 hex）④ 命令 / fenced 块 ⑤ 占位路径（`docs/design/X.md`）⑥ 运行期面（`config.json` / `.thincoder/…`）⑦ 对端仓违规形态（裸直引——V4 面）⑧ 退场 / 换名 / 归档叙述行（`已拆` / `已并入` / `归档` / `换名` / `改名` + 同行悬空锚）⑨ 裸 `T<数>.<数>` ⑩ `TLS12` / `TAB123` | 全零命中（逐类可判，不得只排其一） | F2/N1 |
| T-V5-6 | 正常：报告态 | 夹具命中 + `gate:false` + 主行程 CLI | 退出码 **0**；输出含报告段 + 汇总行（报告态标记） | F4 |
| T-V5-7 | 正常：闸态（反证非空转） | 同夹具 + `gate:true` | 退出码 **1**；违规行含锚与档:行 | F4 |
| T-V5-8 | 边界：基线零改 | `test/fixtures/doc-consistency-baseline.json` + 两态运行后回读 | `entries` = `[]`；V5 不出现在条目标记（`V1|/V2|/V3|/V4|` 面零改） | N2 |
| T-V5-9 | 正常：全量清单 | CLI 对夹具域（含注记行 / 对端域外行） | 汇总含四数（候选 / 悬空 / 注记豁免 / 域外）+ 逐条行；重定向落盘可读 | F5 |
| T-V5-10 | 边界：射程不重叠（**与 T-V5-11 互斥两类**） | 夹具：① 档名 + 节号的引用形态（V1 面）② 对端仓**违规形态**（裸直引 / `VSC 仓` + 裸 `§N`——V4 面）③ “三条：”+ 两行列表（V2 面） | V5 零命中（② 直接被跳过——**不产生域外行**）；①②③ 各自归 V1 / V4 / V2 报（不重复报行） | F10 |
| T-V5-11 | 错误：降级不抛 | 夹具仅本仓树（对端仓根不存在）+ **合规形态** `thincoder-vscode/…（VSC 仓）` 锚（与 T-V5-10 ② 互斥两类） | 该锚记「域外」入报告行；零抛出；不阻断；退出码按本态语义 | N1 |
| T-V5-12 | 正常/反证：收紧两态（**夹具域 + 显式 `gate` 参数——不读真实扫描域**） | 夹具域：① 清账完成态（三锚命中 0）+ 显式 `gate:true` ② 同域植入一条悬空锚 + `gate:true` ③ 同域 + `gate:false`（报告态） | ① 退出码 **0**（收紧不误红）+ 闸态洁净句 `OK(V5): 0 条悬空锚（闸态——阈值 0）`（轮 3 补断言）；② 退出码 **1**（反证非空转）；③ 退出码 **0** + 报告段；基线仍空（两态均不写） | F6/F4 |
| T-V5-13 | 正常：反查纯函数 | 直驱 `docImpact`：变更文件 + 符号（设计档内有引用） | 返回命中档清单（档 + 命中词）；无关联变更 → 空清单 | F7 |
| T-V5-14 | 正常：反查 git 包装（**慢层 `slow()`**） | 临时 git 仓：commit 一档改动（导出符号）+ 设计档引用该符号 → 跑 CLI | 输出含该设计档；退出码 0（非门禁） | F7 |
| T-V5-15 | 正常：常驻接线（① 快层发现集 · ② 真实域复跑） | ① `readdirSync(test)` + `node test/run-fast.mjs`；② `scanDocAnchors(REPO)` 默认 peer 解析（`slow()` 归册——≈1.3s） | ① 新档在快层发现集内；快层全绿；② 真实域 `danglingTotal` = **0**（闸态——再出现即红；轮 3 补） | F8 |
| T-V5-16 | 正常/反证：既有判据零伤（N5 承接——① ② 快层 / ③ 批级对照） | ① `SCAN_DIRS` 断言（import——逐字三元素全等）② 夹具域直驱 `checkDocConsistency`（V1 / V2 / V4 各人造命中 + 合规对照 + V3 批档夹具）→ 与钉死快照全等 ③ 批级对照：变更前 `check-doc-width` 输出快照 vs 变更后复跑 | ① 全等；② 快照全等（逐例可判）；③ V1–V4 段逐字节一致（差 = 0） | N5 |

> 快层归属（**轮 3 实施轮收正**）：**T-V5-6 / 7 / 8 / 9 / 11 / 12 六例走 `slow()`**（主行程 CLI 子进程 spawn——实施轮实测 0.8–1.9s/例，归册制）；**T-V5-15② 真实域复跑走 `slow()`**（REPO 全域扫描 ≈1.3s——常驻接线面）；
> 宿主归属：T-V5-1–T-V5-12 · T-V5-15 · T-V5-16 = `test/doc-anchors.test.mjs`（轮 1；T-V5-15② 轮 3 增补）；T-V5-13（快层——纯函数直驱）/ T-V5-14（慢层——真实 git 子进程）= `test/doc-impact.test.mjs`（轮 3）；
> T-V5-16 ③ = 批级对照运行（对照记录入批次档 §5）；**快层 8 例 · 慢层 7 例**（`test/doc-anchors.test.mjs` 全 15 例——`test:full` 全跑）。

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
- **角色互斥**：工程模式禁用 `coder`，普通模式禁用 `eng-coder` 与 `eng-designer`（schema 枚举 + 运行期硬门禁双保险；第三门（非工程禁 `eng-designer`）= 第 2 批——见 §2.15 A 模式门）

## 6. 已知取舍（评审记录）

1. 父代理无全面写文件门禁——必须能写设计产出物；越权靠提示词（拦截型门禁覆盖产品代码）。
2. token 跨任务存活——保守缺口，已接受（链终消费制收口后：仅链中存活，链终消费）。
3. token 持久化边界——单值自 08-29 起已随 slot 持久化、多槽同构序列化；TTL fail-closed 兜底，过期重评；无签名格式（uuid:expiresAt）下防伪不声称——门禁可经工程模式开关绕过，防伪无实际安全边界。
4. multi-repo 时 advisor cwd 取 `repos[0]`——`_touchedFiles` 绝对路径缓解，已知限制。
5. 架构级文档以机制约束（FR1-FR8）替代用户故事——架构级机制文档的既定形式（评审 2026-09-02 #1 措辞修正，不主张 METHODOLOGY 原文含此豁免）。

## 7. 变更记录

- 2026-09-13（**两仓合并批 3（S6）纪律句落地**——R14 import 禁令删除（§2.22.1 / §2.22.9 / §2.30.3.1 三处）+ 需求档 §1.17 N1 / `ENGINEERING-MODE（VSC 仓·需求）`§1 N5 同批）；退场注记面 = `TWO-REPO-MERGE.md` §2.4 R12–R16；只改文档、零代码）。

- 2026-09-13（跨仓失实注销——裁定来源 = 对端仓 2026-09-13 用户裁定；只改文档、零代码）：§2.32.8「两端差异不对齐（各自保留、互不追赶）」条**注销留行**（注销注记入原位）——对端缺仓口径改「域外标记、不阻断」⇒ 两端口径一致 ⇒ 端差消解（对端指针 = `DOC-CODE-RECONCILE（VSC 仓）§4.1`）。

- 2026-09-12（文档↔实装对账批·**实施后同步轮（设计↔实装对齐 + 父侧裁定）**；只改文档、零代码）：
  ① §2.32.3.1 V5-B 正则**按实装收正**（补多段号完整捕获 `(?:-\d{1,3})?` + 收尾 lookahead 补 `-`——`T-V5-12` 类完整命中；`TLS12` / `TAB123` 收紧面零改）·
  ② §3.2 快层归属注收正——T-V5-6/7/8/9/11/12 六例 `slow()` 归册（快层 8 例 / `test:full` 14 例）·
  ③ §2.32.6 受影响文件表回读刷新（`scripts/check-doc-width.mjs` 367 → **368**；`scripts/doc-anchors.mjs` 300 / `test/doc-anchors.test.mjs` 282 / `docs/README.md` 250）；§2.19 V5 行 / 档位结论 / D-V5-4 同数同步·
  ④ §2.32.3.2 补对端仓根**可达来源序**（显式参数 → env `THINCODER_PEER_ROOT`〔别名 `THINCODER_CLI_ROOT`〕+ 自指防护 → 兄弟目录）；④ 补仓前缀形态**通过条件**（按实装写入）·
  ⑤ 排除式 1 + §2.32.3.3 + 假阳类 5 / 8 新增**排除判据**（通用入口名类 / 「原…系」并档叙述——F2 / N1 假阳缺口闭环；判据句 + 射程入档；**实装对齐随其后实施轮**）·
  ⑥ §2.32.8 登记**假阴面代价**（对端可达但档缺失 ⇒ 缺档不报——已知代价）。
  批次档 §2 追加同轮小节（`../batches/2026-09-12-DOC-CODE-RECONCILE.md` §2）；§2.32 自引用全量核验 = 0 悬空。

- 2026-09-12（文档↔实装对账批·**实施前小轮——两端差异登记 + README 去重**；只改文档、零实现）：
  §2.32.8 补**两端差异登记**一条——对端仓树不可达的处置两端口径**各自保留、互不追赶**（本仓 CLI = 合规形态记「域外」报告行、不阻断；对端 VSC = fail-closed 拒跑）；
  `docs/README.md` §3.7 的 V5 运行命令**去重保留检查器登记行**（删条目内命令句——单源）。
  批次档 §2 追加小轮小节（`../batches/2026-09-12-DOC-CODE-RECONCILE.md` §2）。

- 2026-09-12（文档↔实装对账批——**设计评审轮次 1 后修正轮**：3🔴+3🟡+7🔵 逐条落地；只落评审发现直接导出的修正、零新语义）：
  **#1 🔴 中文权威镜像入表**——受影响文件表 + §2.32.5.5 落笔表各行 + 批次档 §2 各补 `docs/design/prompts/discipline-engineering.md`（+~14；**两副本逐字同落**——`docs/README.md`:15 中文权威源；AC15 双源口径；批次档轮 3 口径改「1 节 × 2 副本」）·
  **#2 🔴 T-V5-12 宿主与判据**——用例覆盖逐例钉死（`test/doc-anchors.test.mjs` = T-V5-1–12 · 15 · 16；`doc-impact.test.mjs`（拟落 `test/`） = T-V5-13/14）；T-V5-12 改夹具域 + 显式 `gate` 参数（消轮 1 批级门冲突）；受影响文件表补轮 2 行（`V5_GATE` 翻转 + 清账档集合 = 首跑清单——动态清单 → `files` 对接入 §2.32.4）·
  **#3 🔴 对端仓锚统一**（父侧裁定）——V4 违规形态（枚举外）→ V5 跳过；合规形态（`路径（仓别）`——E3）→ 入存在性域、不可达记「域外」不阻断——排除式 5 / 解析序 ③ / 降级条 / 假阳类 7 / §2.32.3.6 全文统一；AC-V5-8/9 与 T-V5-10/11 夹具钉成互斥两类·
  **#4 🟡 标记集补 `归档` / `换名` / `改名` + 假阳类 8 括注对齐 + T-V5-5 十类夹具逐类钉死**·
  **#5 🟡 N5 独立判定句——新增 AC-V5-16 / T-V5-16**（`SCAN_DIRS` 不变 + V1–V4 批前/批后逐字节对照 + 夹具快照；需求档 §1.20 判定句行同步）·
  **#6 🟡 反查时点与基准**——`--base` 必给 = 上一批收口点、实施轮开工前跑（§2.32.5.1 + 落笔表第 4 条逐字同改）·
  **#7–#13 🔵**：366→367（D-V5-4）· 「新四档」· 需求档行 1 实测回填 +74（1000——修正轮后终值；修正轮前实测 999/+73）· V5-B 收紧（`TLS12` / `TAB123` 不入抽取——假阳类 10 + T-V5-5 ⑩）· item 9 另起节（#11）· README §3.7 补运行命令 · 196 口径统计面消歧（#13——单档 vs 全域）。

- 2026-09-12（文档↔实装对账批——DOC-CODE-RECONCILE：用户「完整的全面清理」裁定）：**新增 §2.32**（问题陈述与三层交付 · 方案选型对比四条 · **V5 判据规格**（三锚抽取与排除式 / 存在性域 / 注记识别 / 假阳类十条 / 报告态→闸态与阈值 0 / 与 V1–V4 射程边界 / 设计期实测基线）· 层 2 清账契约 · 层 3 防回潮（反查脚本 / V5 常驻 / 语义巡检 / **跨仓批派单与写域**——用户 23:01 追加 + 提示词落笔表）· 受影响文件 11 项 · 决策 D-V5-1–D-V5-7 · 边界）
  + **§3.1 AC-V5-1–AC-V5-16** + **§3.2 T-V5-1–T-V5-16**；§2.19 机械校验最小集补 **V5** 行（指针级——D2）；需求档 §1.20（FR26）+ §1.19 F15–F17 + `docs/README.md` §3.7 同批。
  **实施待 coder（token 门）**；层 2 清账与收紧随其后轮（批次档 `../batches/2026-09-12-DOC-CODE-RECONCILE.md` §2）。

- 2026-09-12（台账自持批·**存量旧义清零轮**——F14 同条（阈值 = 0）对齐；只改文档、零代码）：
  §2.18 / §2.22.7 / §2.24.3 / §2.24.6 / §2.24.9 / §2.25 与 **AC28 · AC48 · T41 · T63 · T70 · T71** 的旧口径（「存量入基线降报告」）
  全部对齐为**「违规一律阻断（修掉）· 基线必须保持为空（非空即 FAIL）」**；需求档 §1.13 / §1.15 同句同步（`:562` L3④ 语境 + NFR 句）；
  两仓同族面逐处研判与处置见批次档 `../batches/2026-09-12-LEDGER-SELF-CONTAINED.md` §2 本轮小节；历史语义保留（变更记录 / 批次档记录 / 引述类——F14 同条）。

- 2026-09-12（台账自持批·**基线清零 + 闸门收紧轮**——用户 11:06「残留即先例」裁定；文档 + 脚本 + 夹具）：
  §2.19 机械校验最小集补**基线必须保持为空**硬规矩（入基线 = 例外 = 违规，fail-closed；检查器非空基线直接 FAIL · T41 ①/⑤ 断言翻转）·
  §2.20.6 V3 补**判据射程**（`V3_ERA_START` = 2026-09-11——工具前时代批次档 §3 父侧代写，结构性历史事实不判）·
  `test/fixtures/doc-consistency-baseline.json` **清空**（CLI 25 条逐条处置：V1 规范形态化 14 行 / V2 计数与列表同改 2 条 /
  V3 射程排除 3 条；对端同源：31 条）；实施记录 = 批次档 `../batches/2026-09-12-LEDGER-SELF-CONTAINED.md` §5。

- 2026-09-12（台账自持批·**C 桶托管内容迁移**——只改文档、零代码）：§2.24.9 的「VSC 归档对位」登记行**迁出本档**（
  接收 = `ENGINEERING-MODE（VSC 仓·需求）` 档——该登记陈述的是 VSC 仓归档档的命名 / 位置，属对端事项）；
  原行位留**搬迁注记**（源档 blob SHA = `7b05f1b0badeac8775a0a2b72164764fded2be2e`）；
  同批另有对端需求档 `requirements/AGENT-LOOP.md` 的 7 节 VSC 托管族迁出（移出清单 = 该档档首）——
  两处处置 = 设计档 `LEDGER-SELF-CONTAINED.md` §8.4 C 桶。

- 2026-09-12（第 14 批·**设计评审轮次 1 后修正轮**：发现 2🔴+3🟡+2🔵 逐条落地；只落直接导出的修正、零新语义）：
  **#1 🔴 回归锁数值重测重钉**——两被锁档实测 `dual-source` 21 例 / 404 行 · `async-guidance` 42 例 / 420 行（合计 63）；锁定形态改 **as-of 基线 + 增删同步实施规则**（§2.27.1 / §2.27.4 `SPLIT_CASES`）；§3.2 行 / AC57 / 需求档 §1.15 同步（AC56 补 as-of 注）·
  **#2 🔴 用例编号避让**——新例定名 **T111/T112**（同档已存 T75/T76 防回潮收归族）；插入锚重钉 = **档尾**（收归族段之后）；「既有用例零改」清单刷新为全量（T41①–⑤ / T46 / T72–T74 / T75·T76 收归族）·
  **#3 🟡 受影响文件标注重测**——行 1 上界 `≤+40` + **档位结论（留存不拆 + 拆分计划登记——触发 = 再度增厚）**；三行 .md 补 as-of；D 三档补入（全清单 7 行）·
  **#4 🟡 AC59 作用域改标**——「本批落笔 as-of 快照 + 本批触行」；**16 行刷新债逐行登记**（§2.27.3；本批不代刷）·
  **#5 🟡 D 需求面登记**——需求档 §1.15 补 D 行（无新需求）+ header 第 14 批行同步·
  **#6 🔵 登记面同步**——批级验收 = AC57–AC60 + AC67（T83/T111/T112）·
  **#7 🔵 验证边界**——`node scripts/check-doc-width.mjs` 两仓实跑（新增 0——见批次档 §2 修正轮块）。
  批次档 §2 修正轮块登记（`../batches/2026-09-11-SWEEP-FOLLOWUP.md`）。

- 2026-09-12（文档体系各仓自持批——LEDGER-SELF-CONTAINED）：**新增 §2.31**（射程规则 / 提示词行为条款 / L4 本仓可解析机检 / 存量宽口径处置登记——设计全文 = `LEDGER-SELF-CONTAINED.md`）；
  §2.9 锚#8 A1 ④ 引文同步（多实现面通用化——与 prompts 落地文本一致）；需求 §1.19（FR25）；两仓分头实施（CLI 侧任务书 = 批次档 `../batches/2026-09-12-LEDGER-SELF-CONTAINED.md` §2）。

- 2026-09-12（散文锚退役批——PROSE-ANCHOR-RETIRE）：§3.1 **AC75** 与 §3.2 **T95** 行**就地退役注记（保号）**——判据面作废（散文锚）；需求本体（§2.24.9④ 归属修订 / 需求档 §1.13 文本）**零改**；逐条删除清单与判据口径见 `TESTING.md` §11（其中 `test/ledger.test.mjs` T95 / AC49 整删）。

- 2026-09-12（台账可见面批——**实现后同步（交付后 doc 面收口）**；只改文档、零代码）：① §2.30.6 补「同级枚举上限」条（`MAX_SIBLING_SCAN=100` → 同级判空集、退化 current-only；F4 vs N2 裁定句）· ② §2.30.3.3 钉死 `--summary` 行集 = 族行（含不可动作同级；非明细行集）· ③ 需求档 §1.15 D7 行锚逐字化（原「（收口行——跑 …」变体 → 含逐字子串 `台账可见面（收口行）`）；批次档 §2 同步（实现后同步块）。

- 2026-09-12（台账可见面批——**设计评审轮次 1 后修正轮**：发现 1🔴+3🟡+1🔵 全裁「修」；只落直接导出的修正、零新语义）：
  **#1 🔴 提示词面去脚本名**——§2.30.3.6 逐字文本删脚本名、保留两锚 `台账可见面（收口行）`/`--summary`；命令字面落点 = 本档 / 批次档 §6 模板（§2.30.6 补可移植性口径；AC86/T105 锚面写清，AC48/AC80 口径零改）·
  **#2 🟡 启动行门改可动作**（§2.30.3.4 / §2.30.3.5；AC82/T100/U4「零输出」限定 = 会话流零行、标记不受门）·
  **#3 🟡 条目键派生 + 标题回退**（§2.30.3.2 / §2.30.3.3；AC81/AC85/T99/T103 补例）·
  **#4 🟡 六档逐档档位注**（§2.30.4；含两处既有 ≥300 行单函数登记）·
  **#5 🔵 headless 文件域判据**（AC89/T110④）。
  批次档 §2 同步（修正轮留痕见 `../batches/2026-09-12-LEDGER-SURFACE.md` §2）。

- 2026-09-12（台账可见面批——LEDGER-SURFACE：用户逐条裁定 R1–R6 落地）：**新增 §2.30**（问题陈述 / 七个选型决策点 /
  单源导出契约 + 口径 + 行文本逐字契约 + 双端挂载 + 收口行 / 受影响文件 23 项 / 决策与边界 / 不变量六条）
  + **§3.1 AC80–AC90** + **§3.2 T97–T110**；§2.19 D7 行与需求 §1.12/§1.15 枚举同步加「台账可见面（收口行）」；
  需求档 §1.18（FR24）+ §1.13 指针行已落；**否决在案**：`/todo` 命令 · 触发字段回填+机检强制 · 点击面板 · 状态行合计/多行。
  实现待 coder（token 门）；VSC 仓登记行已落（`ENGINEERING-MODE（VSC 仓）`）。

- 2026-09-11（第 8 批·范围扩展轮后**微修**——§5 审计遗留 Deferred 闭合；只改文档、零代码）：§2.25 提示词面表改
  「**8 文件 = persona ×4 + discipline ×4**」——补列 `persona-eng-designer.md` ×4（todo 归属句替换实落——逐字源 = 本批 §4 批准面 / §5 对表 4–7）；
  批次档 §2 同步补 4 行（D3——计数与列表同改）+ 登记 PORTABILITY 写权裁定（`2026-09-11-PORTABILITY-VSC-MIRROR（VSC 仓）§4`——persona 该行零动）。

- 2026-09-11（第 8 批·范围扩展轮——**设计评审轮次 4 后修正轮**：发现 7 条全裁「修」；只落直接导出的修正、零新语义）：
  **AC76 子串族并入需求档 §1.17「台账归档对位」块**（子串「台账归档对位」·「同 basename」——#7）· **T94 补层归属与确定性**（慢层 `slow()` 门控 + 夹具 commit 日期钉常量——#6）·
  **分隔符形态统一为 `+`**（AC75 子串形态——§2.15 A2 与需求档 FR18 行同步——#4）· **§2.26.5 域陈述状态同步**（T6 域扩已裁不采纳——`docs/TODO.md` 不再「在案待裁」——#2② 复核落点）；
  批次档 §2 配套行级修订（① 指针改指 §2.15 A2 · 应用清单两行复核注 · 预算 / 枚举 / AC 回指注 · 本基准数字口径 · 落笔要点 `+` 形态）——见 `../batches/2026-09-11-POOL-LEDGER.md` §2 修正轮留痕。

- 2026-09-11（第 8 批·**范围扩展**——TODO 机制增量并入：归档 / 触发 / 老化 / 归属修订）：
  **新增 §2.24.9**（归档口径——勾销后移入同仓 `TODO-archive.md` / 活文件只留未决 / 组计数 = 未决数；触发字段三枚举——`归批` / `条件` / `认账不排期`；
  老化报告审计模式——`--audit` / N 默认 30 天 / 报告只读；归属修订——物理落笔归父侧）
  + **§3.1 AC75–AC79** + **§3.2 T92–T96**；§2.24.3 / §2.24.4 / §2.24.6 / §2.24.8 同步改写（L2 未决口径 · L3⑤⑥ · 审计模式）；
  §2.25 补两仓归档档行 + 声明纪律改写（原「由 eng-designer 落笔」作废）；**枚举统一 = AC45–AC52 · AC75–AC79 / T67–T71 · T92–T96**；
  需求档 §1.13 同步（状态机两行 / 组计数 / 状态取值面 / 触发与老化 / 职责分工；另 FR18 行 · §1.8 步 2 · §1.11 B5 · §1.17 对位登记）；
  两仓收拢应用清单落批次档 §2（物理落笔 = 父侧）；**替代口径**：「就地 `[x]` 保留、计入组计数」作废。

- 2026-09-11（文档 / 产品文案卫生批——小结性修正轮，设计评审轮次 1【pass——🔴0 · 🟡0 · 🔵4】后）：4 条 🔵 全落（只改文档、零语义）——
  #1 §2.29.8 行数列改标「批前基准」+ 口径注（批前/现读混列消解）· #2 §2.29.8 `docs/TODO.md` 行六条键控拉全（C1–C6——计数 6 与括注 5 不齐消解）·
  #3 §2.29.4 行号指针内容键控（「中止语义（F-6）行」等）+ as-of 更新 · #4 AC68/T84 改「与定稿替句逐字全等」断言（零命中集真子集问题消解）。

- 2026-09-11（文档 / 产品文案卫生——第 22 批：审计 id=28 批 C 六条）：**新增 §2.29**（C1 描述面同步 · C2 `§24`→`§11.x` 逐行映射表 28 行/29 处 · C3 VSC 机制正文两句同步 · C4 注释断链去路径 · C5 需求档 5 点位同步 · C6 死产物删除——逐条裁定 + 边界）
  + **§3.1 AC68–AC74** + **§3.2 T84–T91**；需求档 §1.15 批块同步（逐条「无新需求」）+ C5 五点位已落；C3 已落（VSC 仓）；C1/C2/C4/C6 待 coder（token 门）。

- 2026-09-11（角色重定义批——ROLE-REDEFINITION：现状对账 + 差异面收口）：**新增 §2.28**（对账表 §2.28.2 · 提示词面变更流程 §2.28.3 · 差异面 RF-1–RF-6 §2.28.4 · 决策 §2.28.5）
  + **§3.1 AC61–AC66** + **§3.2 T77–T82**；同步核销：§2.1 三段链目标态（第 2 批 D7 核销项执行）· §2.2/§2.6/§2.15/§2.16/§5 登记面；需求档 §1.5 收口块 + 登记同步。
  落笔排程（提示词面 / PROMPT-SYSTEM / VSC 仓文档）见批次档 `../batches/2026-09-11-ROLE-REDEFINITION.md` §2。

- 2026-09-11（角色重定义批——修正轮，设计评审轮次 1 后）：**8 条修正落档**（RF-1 替句删归因注 · RF-2b 定位校正 as-of :301 · AC65/T81 断言改准——核销句零假红 · RF-4 a–d 中文面逐字补全 + AC64 zh 零命中 · §2.28.3 指针 §13.9→§13.8 · §2.28.6 档位注 · RF-6「新增断言」措辞 · §2.28.2 #8 措辞限定）——**只改文档、零实现**（提示词实体零碰）。

- 2026-09-11（第 14 批——收尾批：第 13 批遗留收束 + 文档实测回写）：**新增 §2.27**（A T75/T76 宿主与断言形态——
  落 `test/doc-consistency.test.mjs` 续 T72–T74；B 行号指针修正 3 处 + 存量登记 5 处；C `TUI.md` §1 全表行数回写）
  + **§3.1 AC57–AC60**；需求档 §1.15 收尾批块同步（无新需求）。B/C 设计侧已落；A 待 coder（token 门）。

- 2026-09-11（第 14 批·续做轮——候选 2 翻转）：新增 **§2.27.8**（条目 D——设计档侧非表格超宽折行 5 处：`AGENT-LOOP.md` / `SESSION.md` / `SUBAGENT-ID-COUNTER-AGENT.md`——已落 + 逐处标注）+ **§3.1 AC67** + **§3.2 T83**。

- 2026-09-11（第 13 批——机制债收束）：**新增 §2.26**（B 跨仓引用形态规范——V1 检查器零改 · C 表格行宽度豁免——规范+机制双层 ·
  D 两处拆分债——D-1 不拆 [计划登记] / D-2 测试档拆分）+ **§3.1 AC53–AC56** + **§3.2 T72–T76**；需求档 §1.15 边界块同步。
  F（第 9 批 §13.9 登记面）经窗口评估**打回**——批 8 链收口后随批落地（本批未写）。

- 2026-09-11（第 13 批·修正轮——设计评审轮次 1 后）：§2.26.1 跨仓「恒判」限定 + 同名 basename 处置（评审 #9）· §2.26.2 豁免残余登记（#10）·
  §2.26.3 档位结论（#6）· AC54 判据口径（#11）。

- 2026-09-11（上午）：**第 8 批轮次 3 设计评审 3 条 🔵 落地（措辞级，语义零变化）**——AC45 槽位口径（`—` 限定 待讨论 / 待设计；已核销 / 已废弃 = 保留指针（已冻结）——轮次3 #2）·
  AC50 断言面拆分（`status ∈ 六态` 归机检 L3④；子串计数与 `- [x]` 改标验收面 grep 断言——轮次3 #3）· AC51 域措辞改「维持 `docs/{design,requirements,batches}` 不变、未扩至 `docs/TODO.md` / `docs/README.md`」（轮次3 #4）。
- 2026-09-11（凌晨·七）：**第 8 批交付前设计侧自检（两处，语义零变化——D6 回读 + 机检实测发现）**——
  **⑨宽度违规自纠**：`§2.24.6` 的 L1 表行原 322 字符超 300 硬限（`node scripts/check-doc-width.mjs` 实测；HEAD 版该档超宽 **0 行** → 属本批新引入）→
  表行改摘要句，三条子判据（①归一 ②basename 唯一 ③可解析）下沉为表后「L1 子判据」编号列表——**内容逐字保全，只改承载位置** ·
  **⑩域陈述校正**：`§2.24.7` 决策 1 判据原写「宽度扫描 = `docs/design/`」，与磁盘实测不符（`docs/{design,requirements,batches}`）→ 按实测改写并标 as-of；
  **决策结论不变**（台账 `docs/TODO.md` 仍在宽度域外 → 扩域仍是域污染；该档 298 行撞 300 硬顶的第二理由独立成立）。

- 2026-09-11（凌晨·六）：**第 8 批评审轮次 2 后修正轮落笔（用户「修」裁定 9 条全 Fixed——docs FIRST）**——
  **①AC50 改按指针字符串键控**（原绝对行号 L113/L119 已漂移——台账被并行会话改写；行号只作 as-of）**并扩断言面**：
  过期状态条（含 `FR16-FR19` 子串 → 只指 FR18）+ 未勾销条（含「已全部完成」子串 → 锚行 `- [x]`）·
  **②L1 补归一/解析规则**（`§X` ↔ 标题编号；basename 多义须带目录前缀——两 `ENGINEERING-MODE.md`）·
  **③L3③ 补豁免与分组识别**（`—`/可挂槽只判单行形态；`需求池`/`技术` 标题标记定组，无标记组不判 L3③）·
  **④AC45 尾句改可机判形态**（需求池组零续行；数字不作文本契约）+ 标签改「非必填三要素断言态」·
  **⑤L3 增 ④status 六态枚举判据**（非必填槽/无 status 场豁免；存量机外取值入基线，收拢时就近归一）·
  **⑥补基线存放面** `test/fixtures/ledger-baseline.json`（键稳定不含行号——与 `doc-consistency-baseline.json` 同口径）+ AC48 增「存量降报告不阻断」·
  **⑦`已核销` 去向钉死**：就地 `- [x]` 保留冻结指针，**计入**活组计数；AC46 按此改写，需求档 §1.13 该行两列自洽 ·
  **⑧T70 扩至五例**（+status 机外取值 / +无标记组不判 L3③）。
  需求档 §1.13 增「状态取值面」段（六态机判指针 + 勾销形态）。

- 2026-09-11（凌晨·五）：**第 8 批评审后修正轮落笔（docs FIRST——评审 10 条 + E1）**——
  AC45 收窄至指针必填态（`—` / 可挂态只判单行形态）· AC49 列出逐字固定子串 · **新增 AC52**（需求档 §1.13
  新增口径的文本断言——补 E1 缺口；**枚举统一为 AC45–AC52**）· §2.24.2/§2.24.3 改**指针引用**需求档 §1.13
  （D2：只留本批新增量）· §2.24.4 钉死计数口径（`##` 组 / 行首顶格条目）+ 数字一律 as-of ·
  §2.24.6 机判收窄（L3 只判形态，语义留评审）· §2.24.5 锚句逐字钉死 + 镜像面限定为「锚句逐字」·
  §2.25 行数刷新 + 删 `test/files.mjs`（VSC 仓） 行（CLI 无显式清单档，glob 自动发现 → 注册改动 0）·
  §3.2 用例组标题改「第 8 批」。

- 2026-09-11（凌晨·四）：**第 8 批设计定稿（FR18 需求池指针台账——CLI + VSC 双端；定稿时序号记为第 6 批，同日改号第 8 批）**——
  新增 §2.24（条目契约 / 六态状态机 / 两池分组与计数 / 提示词锚 L-A·L-B / 机检契约 L1-L3 / 三个决策点选型 / 不变量）
  + §2.25（受影响文件 as-of）+ AC45–AC52（AC52 于修正轮补入）+ T67–T71；需求档 §1.13 补两池重分组口径与技术待办 (b) 指针形态，
  FR18 行与 §1.13 表计数 `五态 → 六态`（D3，计数与列表同改）。
  **设计侧只出契约**——解析正则与脚本实现由实现阶段确定（§2.24.6 末段）。

- 2026-09-11（凌晨·三）：**第 5 批实施交付核销**（两面并行 eng-coder，**双终态 clean**）——
  面① 代码面（20 改+6 增：batch_segment/batchDoc 门两路+角色域/eng-designer 八处+勘察通道/advisor 三参+rv 实例键/V1-V3+基线+接线；越界 5 项已报备核可）·
  面② 提示词双源（18 增+8 改：15 档中文镜像+端特有段 3 处+跨仓引用零悬空/锚句宿主 6 档+designer 新建/A12 人格改述/锚句断言测试 203 行/README 权威句+差异表 9 行；超锚点 2 项已报备核可）；
  内层每面 explore 审计+advisor 评审 pass+复评；
  父侧合流核验：（18 增+8 改：15 档中文镜像+端特有段 3 处+跨仓引用零悬空/锚句宿主 6 档+designer 新建/A12 人格改述/锚句断言测试 203 行/README 权威句+差异表 9 行；超锚点 2 项已报备核可）；内层每面 explore 审计+advisor 评审 pass+复评；
  父侧合流核验：**VSC L2 353/352 · CLI L2 341/330 全绿**；档位 async 499≤499/check-doc-width 297≤298；A12 抽验 ✓；CLI 基线补 1 条 V3 工具前时代批次档（T41① 真阳性——本批 §4 已批准、§3 系父侧代写，按 §2.19 存量入基线，非缺陷）。**FR23 实现面已落地**；批次档 §5（父侧代写打标）+§6 已回填；**待用户终局自验**（重载扩展后 spawn eng-designer）。

- 2026-09-11（凌晨·二）：**第 5 批设计评审轮次 4 处置（PASS 后 advisory 全修；同链复用 token，不重评审）**（9🟡+5🔵）：
  🟡 档位账算术修正（≤+250→**≤+247**，原值 301 越 300）· **门调用点入两行档位账**（阻塞/异步各一处，async 仍守 ≤499）· 注入行**退路改停线**·
  §2.22.8 面域与 §2.23 对齐（README 归面② + 锚句断言档入面②域）· “14 定点改”→**锚句宿主 6 档**；
  🔵 T65 映射去 AC44 · A8 断言口径改“跨仓同文件 grep” · V1 豁免入**镜像差异表**（VSC 独有语义登记）· 五处 >300 档补**函数档结论**；
  **批次档**：轮次 1 题头 1🔴→2🔴；**补登轮次 3 发现表**（13 条带编号）；§2 待办增需求档 N3 口径项（designer 写域）。

- 2026-09-11（凌晨·一）：**第 5 批设计评审轮次 3 处置**（1🔴+6🟡+6🔵，用户裁定**全修**）：
  🔴 **勘察通道同档两说**（正文留“不搬”退路 vs AC38/任务书“必搬”）——**删退路句、正文改写“必搬 + 遇阻停下报告”**（与批次档 §2 一致）；
  🟡 用例表标题改 **T54–T66** + **T62 归位** + 新 **T57c**（勘察通道行为）/ **T66**（并发隔离，镜像 CLI T51）；
  不变量 3 改「文本类锚 A1-A8/A11/A12；A9/A10 行为锚」（与 AC39 同口径）；④ 装配清单明列**勘察通道工具**；
  跨仓节引用补 **V1 判据**（“（CLI 侧）”注记行豁免）+ 入 T63（新④）；T54 补 **任务文本注入行**断言；
  🔵 check-doc-width 上限改 **≤+247（→298）** · README 差异表宿主行改 **+≤20** · 测试档计数统一「5 new test + 1 fixture」 · 需求档 N3 计数口径入 designer 任务书；
  **批次档（父侧写域）**：§3 落**带编号的轮次 1/轮次 2 发现表**（供「发现 #N」解析）；§2 计数改提示词面 **8 项** + 用例表 **T54–T66**。

- 2026-09-10（晚·十六）：**第 5 批设计评审轮次 2 处置**（1🔴+8🟡+5🔵，用户裁定**全修**）：
  🔴 **主 agent 人格面缺位**（VSC `src/prompts/persona-engineering.md:10`（VSC 仓；至 13 行） 实证仍是 ARCHITECT/设计档交付者——与带入的 A1/A4/D1 同装配互斥）——**新增锚 A12**（双源改述 + spawn eng-designer 调用链，逐字源 = CLI 同档）+ §2.23 补双源两行 + **T65** + §2.22 目标段记实证；
  🟡 用例标题 **T54–T65**（含 T55b/T57b/T65；T62 归位）+ 批次档 §2 同步；
  轮次 1 发现落点：批次档 §3 待父侧代写打标（§3 = 评审子代理自写，工具落地前通道：**本轮先补设计档内“发现 #N”可解析性**——处置段已逐条化）；
  AC38 ⑨ **勘察变体必搬**（无“不搬”选项）；接线落点**钉死 files.mjs**（package.json 不入文件域）；
  check-doc-width 增量上限改 **≤+250（→≤300，对齐 CLI 实测 298 行）** + 保留拆分退路；
  测试标注补齐（anchors 档 +≤120；files.mjs +≤8）；**AC39 分文本类锚/行为锚**（A9/A10 不进 grep，改 T59/T61 承载）；
  跨仓节引用处置（改写/注 CLI 侧/入差异表——不产生悬空引用）；镜像差异表宿主钉死（VSC docs/design/README.md 新增节）；
  “余 14 档都改”收紧为“仅锚句宿主档”；注入行同形镜像（T54 断言，改形态须报告）；终局判据指针改 FR23/§1.17。

- 2026-09-10（晚·十五）：**第 5 批设计评审轮次 1 处置**（2🔴+8🟡+4🔵，用户裁定**全修**）：
  🔴 **F2 漏运行期门**（照设计落地则 designer 根本 spawn 不出来）——§2.22.4 由五处→**八处**（白名单 `thincoder-core/agent-tools/subagent.mjs:254-256`+错误文案 / 模式门第三门 / 子代 spawn 门）+ 不变量 6 + T57 下沉运行期 + 新 **T57b**；
  🔴 **档位表无拆分结论**——§2.23 逐档补“拆/不拆 + 理由”（`advisor.mjs` 296→310 **跨档：不拆**）；
  🟡 batchDoc 门补**角色域**（`{eng-coder, eng-designer}`；其余零变更）+ schema 属性 + 受限变体 delete 清单 + 新 **T55b**；
  🟡 designer **勘察通道**（CLI §2.15 D2/D3）入 §2.22.4 ⑨ + 人格文本同步要求；
  🟡 V1/V2 与接线补用例（新 **T63/T64**）；V3 **跨仓边界**写死（真守门在 CLI 侧，VSC 缺目录即跳过；将来用显式参数传根）；
  锚表补**宿主列**（A1 宿主改 VSC discipline-engineering 新增六段节）+ 新 **A11**（spawn 样例带 batchDoc=）；
  双源定**端特有段进镜像 + 被断言**（AC43/T62）；删自相矛盾的“>300 档”括注；
  🔵 计数口径（28 条清单 / 27 个 .test.mjs）· 仓前缀已标（`README（VSC 仓）`）· “両側”→“两侧”。
  **批次档（父侧写域）**：§2 任务书落笔并打标（覆盖条目/不在本批/受影响文件指针/验收标准/就绪）。

- 2026-09-10（晚·十四）：**第 5 批设计（VSC 端镜像，FR23/§1.17）**——新增 **§2.22**（总原则语义同源原文自持 / **镜像锚 A1-A10 逐字源钉死** / batchDoc 门两处各落+共享校验 / eng-designer 五处落地 / batch_segment 两个适配点 / V1-V2-V3 含**接线硬项** / 双源新建 15 档 / 实现面拆分 / 五条不变量）
  + **§2.23**（受影响文件 as-of：VSC 仓 23 项代码面 + 6 项提示词面，行数实测；唯一逼近硬顶 `subagent-async.mjs` 489+≤10=499）+ **AC37–AC44** + **T54–T62**。
  **适配点**：工具集落点 = `src/advisor/tools.mjs:26`（VSC 仓）（三参签名）；实例键通道 = `rv.batchDoc`（非单值会话态）。
  **实现面拆分（选型 3）**：2 个并行 eng-coder（①代码面 ②提示词双源面，文件域不相交；锚句断言测试归面 ②）。
  **待用户裁**：无（四项选型已定，见 §2.22）；**实现未启动**（待用户发起评审 → 批准）。

- 2026-09-10（晚·十三）：**第 4 批实施交付核销**（eng-coder 终态 **clean**）——交付 26 文件：新 2（`thincoder-core/agent-tools/batch-segment.mjs` 196 / `test/batch-segment.test.mjs` 321），改 24（挂载三处 + advisor 参数/实例键 + run.mjs 设计分支 + V3 入 check-doc-width + 提示词双源 12 + TOOLS/AGENT-LOOP 登记）。
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
  🟡 round2/3 提示词为**设计+代码共用**——“写 §3”句限定“仅设计评审/工具已挂载”（`thincoder-core/advisor.mjs:109-120` 实证）+ **T49b**；“会话态”残留三处（契约注释 / §2.20.2 标题 / §2.21 行）统一改「档绑定/评审实例键」；
  TOOLS.md 行数 **79→124**（实测）；需求档行数 **675→679**；
  🔵 AC29/T44 简写 `coder` → `eng-coder` · AC36/T51 删“或门禁明拒”并列（实例键下预期即各自落档）· §2.20.4 明写 **F4/F5 由提示词层承载、V3 只保底线**及理由 · §2.21 需求档行加 **§1.16 F1 评审侧口径**；
  **批次档（父侧写域）**：补 §2–§6 六段骨架 + §2 作者改“eng-designer（已落地）” + 需求清单重组为**完整 4 条列表**（消 V2 “声明 4 条 vs 同块 2 项”假阳）+ 补 §3–§6 作者署名。

- 2026-09-10（晚·十）：**第 4 批设计评审轮次 3 处置**（1🔴+5🟡+5🔵，用户裁定**全修**；评审对上轮 🔵11 的“§2.20.2 末段仍写会话态”报告与磁盘不符——84ad034 时已改，未计）:
  🔴 **§2.20.7 路径传递行**残留旧口径——改「参数在工具入口 + **评审实例键**传递；不用单值会话态」（与正文 §2.20.2/不变量 6 同口径）；
  🟡 §2.20.7 V3 范围行改机器判据原文 · **§2.20.3 重构为三方挂载表**（评审/designer+coder/主 agent——不变量 3 有了机械落点）·
  AC29 扩含 fail-closed 逐条 · **T43b**（段标题缺失 throw）+ fail-closed 清单补该情形 · §2.20.6 补“落点按 §2.21 二选一”句 · T53 映射窄化；
  🔵 超量改“**同轮分段追加**——续写不新盖轮次戳”（轮次戳语义闭合）· 调用侧补“发起评审必须传 batchDoc”指令 · round 1 宿主钉死（`thincoder-core/advisor.mjs:109-111` 实证）· T 表标题 T43–T53 · §2.21 补 TOOLS.md 实测行数与 B9 同步项。
  **范围外不外溢**：批次档 §2–§6 骨架与 §1 作者注滞后（R7a）——待 designer 落 §2 时一并不正；§2.19 V1“定死此文件”冲突——designer 同步时处置。

- 2026-09-10（晚·九）：**第 4 批设计评审轮次 2 处置**（1🔴+8🟡+3🔵——用户裁定**全修**）：
  🔴 **AC31 同步**——由“必传”改为“**若传则须可读**；未传→工具不挂载、评审照常”（与正文 §2.20.2/取舍记录/T47 口径一致，不破 N5）；
  🟡 §2.21 补 round2/round3 **双源**行 · 剥证器改**自有正则**（不复用 §2.7——其正则匹配不到冒号态；F6 同步）· 来源戳与 V3 改**收窄口径**（只认工具写入的轮次行，排骨架行；T46④/T48④ 反证）· V3 触发条件改**机器判据「§4 或 §6 非空」**（删“已收口”同名状态词）·
  身份判据改与目标档绑定**同读实例键** · 需求档 **B12 §4→§5** · §2.21 定义 `check-doc-width.mjs` **二选一**（增量 ≤19 守 300 / 拆独立档——**未采用：实际落 = 留单档**）；
  🔵 新增 **T52**（超量 throw）/ **T53**（身份判据同源）· §2.20.2 末段按实例键重写 · 批次档 §1 标签改“第 4 批”。

- 2026-09-10（晚·八）：**第 4 批设计评审轮次 1 处置**（1🔴+6🟡+5🔵——用户裁定**全照办**）：
  🔴 来源戳——守卫表新增「**来源戳由工具生成**」（N = 计数 + 1；调用方同名标题被忽略）+ **AC34/T48**；
  🟡 评审侧门禁改「**若传则须可读**」并记取舍（不改 N5 零回归；§2.20.8 取舍记录）· 提示词面扩到 **round2/round3**（`thincoder-core/advisor.mjs:109-115` 实证）+ **AC35/T49** ·
  §2.21 补 **`thincoder-core/agent-tools.mjs`（barrel）** · 需求档行改标 **eng-designer 落笔** · F4/F5 补 AC35 ·
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
  🔵 T33 输入措辞 · D4 落点→V1 · 八维编号校正为 **#7 Document ownership**（定耆 `src/prompts/advisor-design.md:9`）· 目标计数 7 场景/15 文件 ·
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
