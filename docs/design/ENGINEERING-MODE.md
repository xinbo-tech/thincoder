# 工程模式（Engineering Mode）设计

> 板块：工程模式——thincoder 的严格方法论工作流：design-before-code、METHODOLOGY 驱动、双门禁（设计评审 + 代码评审）。
> 本文档为**架构级机制文档**：功能性需求以机制目标与约束表述（架构级文档以约束替代用户故事——评审 2026-09-02 #1 措辞修正），非功能性需求与测试层完整。
> 依赖与权威关系：[AGENT-LOOP.md](AGENT-LOOP.md)（§8 工程交付协议概览、§10 子代理任务调度器、§12.1 advisor 评审对象锚——本文件机制经其 §17 权威源接管点注册）；[ADVISOR-CONVERGENCE.md](ADVISOR-CONVERGENCE.md)（评审收敛权威：design 评审 cap 豁免、code 评审 MAX_ADVISOR_ROUNDS=5、stale-context 保护）；[TESTING.md](TESTING.md) §1（测试分层 L0+/L1/L2 权威）。

## 0. 铁律（发起权与批准权归用户——2026-08-24 决策）

背景：agent 曾两次越权抢跑（自行提交设计评审 → 拿 token → 直接开发，其中一次全程零确认）。此后固化四条铁律：

1. **设计评审只能由用户发起**——agent 准备并提醒"设计就绪，可以评审"，不自行调 advisor。
2. **打回后逐条呈递**——评审打回后每轮呈递发现 + 修复建议，**用户逐条拍板**再改（agent 不自行修完重送）。
3. **交付 code review 保持流程节点自动**——eng-coder 返回后自动评审，不问用户（2026-09-02 起由 eng-coder 内部协议默认承担）。
4. **系统推回（guard）在工程模式一律关闭**——未来若启用也只作提示，评审仍由用户发起。

## 1. 需求（Requirements）

### 1.1 总体需求

普通模式靠纪律提示词约束模型；工程模式把"设计先行、评审把关、验证收尾"提升为**半机械流程**——可硬性拦截的环节一律拦截（写文件门禁、token 校验），无法硬拦的靠 METHODOLOGY 与提示词约束。核心承诺：**代码必须先有被评审过的设计；评审对象由任务定义而非遍历猜测；评审循环在实现者内部闭环（不依赖父代理持有凭证）。**

### 1.2 功能性需求（机制约束，架构级表述）

| # | 机制需求 | 约束 |
|---|---|---|
| FR1 | 设计先行 | 设计文档（三层）存在且通过设计评审前，任何代码文件（含 `src/prompts/*.md`）不可被修改 |
| FR2 | 设计评审独立 | design review 由独立上下文执行；评审对象 = 调用时显式传入的文档清单（documents + object 参数，见 §2.4），不遍历 git diff |
| FR3 | 授权链 | 设计评审通过签发 token——连同**随机 designId**（**同 scope 实例恒定——复审沿用同 id，旧 token 存活至 TTL 保留**；不锚定文档路径/内容——"文档锚失效"路线已否决）存于会话内多设计槽 `Map<designId,{token}>`；spawn eng-coder 必须携带 designId + 匹配 token（单设计时 designId 可省略）；token 随会话 slot 持久化跨进程（TTL 7 天 fail-closed）；**链终核销时父侧 consume-design 消费**（见 §2.6 F1） |
| FR4 | 代码评审归属 | eng-coder 交付前自查（对照验收标准/文件范围，非 LLM）→ **内部协议闭环**：实现 → explore 偏差审计 → 自修 → advisor(type=code) 复评 → 收敛后一次交付（完整协议权威 = 本文件 §2.2 step 6）；LLM 验证 3 次/链（③审计 → ⑤advisor 首审 → 终审复评），修正轮默认不重跑审计/复评；父侧复核保留可选（默认由内部协议承担——stalled/存疑才复核） |
| FR5 | 评审时机 | **设计评审仅由用户发起**（agent 呈递就绪并提醒，不自行调 advisor）；打回后每轮呈递发现 + 修复建议、用户逐条拍板；**交付 code review 流程节点自动**（eng-coder 内部协议默认承担——in-child advisor 复评自动运行、不问用户；父侧复核保留可选——stalled/存疑才复核）；advisor 失败停止重试 |
| FR6 | 范围约束 | **A 裁定**：去掉"文件清单外不可改"硬约束——清单外改动**允许**（交付必要），但**必须逐项报告中说明**（透明）；审计"out-of-list"判据 = "**改了且未报告 = 偏差**（静默越权）"；已报告 = 透明可接受；父代理不得修改设计文档外的范围；超范围停下提出设计更新 |
| FR7 | 待办管理 | 技术待办统一在 `docs/TODO.md`，不落入设计文档（避免触发重新 doc review） |
| FR8 | 多任务并行 | 相互独立的设计可**并行推进**，上限 ≤4 并发（提示词纪律——无机械门禁）。**调度器条款（现行口径）**：spawn 声明 `files`+`dependsOn`——冲突/顺序交调度器自动处理（重叠域 queued、依赖链自动顺序、同步冲突报错），不再手动串行——锚句 "overlapping domains are queued by the scheduler, never hand-serialized"（AGENT-LOOP §10）；未声明 files 不参与冲突检测。token 按 designId 隔离互不覆盖；发起权不变（FR5） |

### 1.3 非功能性需求（技术标准）

| # | 维度 | 标准 |
|---|---|---|
| NFR1 | 性能 | token 校验在 spawn 时同步完成（<10ms，无网络依赖——**设计目标，非机械测试**）；design review 每轮一次 LLM 调用 |
| NFR2 | 收敛性 | code review 最多 5 轮（MAX_ADVISOR_ROUNDS），第 6 次调用被机械拒绝；design 评审不消耗该预算（cap 豁免） |
| NFR3 | 安全 | token 机械匹配（格式 + TTL fail-closed）+ designId 定位槽；token 为**无签名流程凭证**（格式 `uuid:expiresAt`——HMAC 防伪层已删，非现行机制）；复审失败不波及其他设计的槽（旧 token 存活至 TTL——已知取舍）；token 随 slot 持久化跨进程（TTL 7 天 fail-closed——重进 TTL 内恢复、过期重新评审）。存量旧 3 段格式 token 拒绝语义见节后注 |
| NFR4 | 兼容 | 两种模式互斥：工程模式禁用 `coder` 角色，普通模式禁用 `eng-coder`；行为不互相污染（提示词两套独立） |
| NFR5 | 可维护 | 判定逻辑单一来源：`isProductCode(p) = /^src[\\/]/.test(p) \|\| !isDocFile(p)`（相对路径语义）；对存绝对路径的 `_touchedFiles` 使用组件级匹配 `/(?:^|[\\/])src[\\/]/`——统一用于门禁/guard/doc-only 判定 |
| NFR6 | 可恢复 | eng-coder 失败/中断可重新 spawn（同 token——链中未消费）；advisor 工具失败不重试，向用户报告 |

> **NFR3 注（存量旧 3 段格式拒绝——活机制）**：旧 3 段格式 token（`uuid:expiresAt:HMAC` 形态——HMAC 指历史防伪层签名段，2026-09-06 已删，此处仅作拒绝判定的格式描述）即使 TTL 内也**格式即判错** → fail-closed 拒绝 → 需重新设计评审（迁移代价：已批准未实现的设计重评一次，已接受）。

## 2. 设计（Design）

### 2.1 角色模型

| 角色 | 职责 | 机械约束 |
|---|---|---|
| **父代理**（顶层，`role` 未定义） | 架构师：需求/设计文档 → 提醒设计就绪 → 用户发起设计评审（传 documents + object）→ 打回呈递 + 用户拍板 → 用户批准 → spawn eng-coder（默认 async）→ 交付验证（父侧 = L2 `test:full` 每链终态 1 次 + 可选的父侧复核）→ 链终核销 consume-design | 拦截型：design token 前写产品代码被拒；提示词约束：不写实现、不发起评审、等批准、验收 |
| **eng-coder**（子代理，`role="eng-coder"`） | 实现者：按设计实现 → **内部协议闭环**（explore 偏差审计 → 自修 → advisor 复评 → 收敛，≤5 修正轮；完整协议 = 本文件 §2.2 step 6）→ 交付（报告含审计/评审轮次 + 终态 clean/stalled；永不编辑设计文档） | 拦截型：spawn 需 token、写文件需 `_engDesignReviewed`；内部 spawn 仅 explore + 同步（机械门）；审计 ≤6 次（第 7 次机械拒绝 = stalled 信号） |

### 2.2 主流程（Mandatory Flow——10 步）

工程模式任务**不分大小**全走本流程——零裁量（逐字锚见 §2.9 锚#1）。普通需求点先按需求池规则登记攒批（锚#2——工程模式专用；机制见 METHODOLOGY 需求池节），不越池提前启动设计。

1. 写需求/设计文档 `docs/`（三层：需求/设计/测试；按业务板块组织）。任务涉及 UI 时设计文档必须收录与用户达成的每一条 UI/交互决策（布局/流程/控件行为/状态/反馈），未定部分标 open、绝不静默发明。
2. 父代理呈递设计摘要 + 提醒"设计就绪，可以评审"——**等待，不自行调 advisor**。
3. 用户发起设计评审：父代理调 `advisor(type="design", documents=[涉及文档清单], object={type,target,status,reason,exclude})`。
   - 有 🔴 → 呈递发现 + 逐项修复建议 → **用户逐条拍板** → 修改 → 再提醒 → 用户发起复审；持续拒绝（>3 轮）→ 停下向用户报告未决项，不静默循环。
   - 无 🔴 → advisor 回显 `[DESIGN-TOKEN:…]` + designId（同 scope 复审沿用同 id）→ designId+token 入槽（`_engDesignTokens` Map）。
4. 用户批准设计——显式 sign-off 才解锁实现；用户对设计内容/形态的选择只是需求确认，不是设计批准（锚#4）。
5. spawn `eng-coder`：`subagent(role="eng-coder", designId, designToken, task)`——designId 可选（单设计省略）；
   designToken 经 PARAMETER 传值，**绝不进任务文本**；task 按 METHODOLOGY Task Structure 含 Docs
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

- **doc review**：`advisor(type="design")` 调用时**显式传 documents 参数**（需求 + 设计 + METHODOLOGY + 引用文档路径）；advisor 只评审清单内文档，**不收集 git diff 变更集**（早期"按 diff 找文档"范围大、不准、与任务无关，还会漏掉 untracked 新文档——已废弃；advisor 直接 read 显式路径）。
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
  `removeDesignTokenSlot`（定义在 token-ttl.mjs——移除该 slot + 单槽镜像条件清（若指向该 slot）+
  `_engDesignToken` 兼容值清）→ 消费后同 designId 再 spawn = 槽 not found **机械拒**。**新改动
  （含新偏差修复）一律新评审新 token**。未知 designId 与重复消费 = 同款 no-op 提示（幂等——不报错）。
- **F2（链中复用不受影响——docs FIRST）**：fix round（同 designId——首 spawn 后、验收前）仍可 spawn（slot 未消费）——消费点仅在父侧核销时（非交付 digest 时——否则 fix round 无 slot 可用）。修正轮的 findings + planned changes 必须先落所属设计文档（deviation record / change note 追加至对应章节）**再** spawn eng-coder；跳档 = 文档漂移，等同静默改动（逐字锚见 §2.9 锚#3）。
- **F3（提示词义务句——两则英文锚逐字，落点各注；锚测试 fail-when-unchanged）**：
  - engineering.md Mandatory Flow step 8（Delivery review）行后（双端）——逐字文本：

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
- **F4（边界）**：stalled 交付（未收敛）不消费——fix round 续用；父侧 L2 非 clean 不消费（同 stalled）；用户放弃该设计 → consume-design 作废（或用户明示）；跨会话恢复的持久化槽同受消费管理（恢复后仍在——直到验收消费）；consume-design 幂等；**多槽隔离（消费 A 不动 B——镜像条件清仅同值）**。

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

下列逐字锚是 engineering.md（CLI/VS Code 双端同一注入文本）的落地契约。**字节源 = prompts 落地文本本身（本文件不收录压缩改写版本）**；锚测试均为 fail-when-unchanged 断言（双端测试域 + 既有 prompts 对比对家族兜底）。机制语义权威源：需求池 = METHODOLOGY 需求池节；调度器 = AGENT-LOOP §10；评审对象锚 = AGENT-LOOP §12.1；内部协议完整文本 = 本文件 §2.2 step 6（AGENT-LOOP §8 仅概览）。

- **锚#1 零裁量**（落点：engineering.md「Mandatory Flow (every task, no skipping)」标题下、step 1 之前——双端；顶层工程模式生效，main.md 普通模式零触碰）：

  > Task sizing is NOT your call — every user request in this mode runs the full Mandatory Flow
  > regardless of size. "The task is too small / it is just a tweak" is never a reason to skip or
  > compress a step, and no change is exempt from being recorded in the design docs. If you find
  > yourself weighing whether the flow applies, the answer is always the full flow — the user's
  > decision to be in engineering mode was the sizing decision.

- **锚#2 需求池三规则**（落点：engineering.md step 1「Requirement pool (engineering mode only)」子条目——双端；镜像：methodology-template.md「Requirement-Pool」节——模板对。机制语义（攒批/阈值提醒/快车道/边界）见 METHODOLOGY 需求池节）：

  > 1. **Pool routing** — "ordinary requirement statements register in the owning board's requirements doc and the project docs/TODO.md「Requirement Pool」group first; design does not start until the user says start this batch (or marks the point urgent — fast lane)."
  > 2. **Threshold reminder** — "same board ≥2 or pool-wide ≥3 requirement points: remind once that batch design can start — the user still fires the review and approval."
  > 3. **Fast lane** — "the user saying this is urgent / do it now skips the pool: single-point full flow (design → review → implementation — no step cut)."

- **锚#3 修正轮 token 复用 + docs FIRST**：修正轮逐字锚见 §2.6 F3 引文（Fix rounds reuse the same designToken — but docs FIRST…）。配套指针句（落点：engineering.md step 7 句尾——双端）：

  > Fix-round re-spawns are docs FIRST too — the deviation record / change note lands in the owning design doc BEFORE the eng-coder spawn (full rule: the eng-coder delivery bullet under Then handle the message).

  语义（engineering.md Work Loop eng-coder delivery 条目——修正轮 spawn 指令后附 docs FIRST 条款段）：修正轮 findings + planned changes 必须先落档再 spawn；"代码变更都必须落文档"对修正轮无豁免——跳档 = 文档漂移，等同静默改动；同设计修正轮是唯一合法 token 复用——超出设计文件清单 = 新任务，需自有流程与新 token。

- **锚#4 用户拍板 ≠ 设计批准**（落点：engineering.md Work Loop「eng-coder delivery」条目 token 边界句后全规则段——双端；step 5「User sign-off」处指针句同义）：

  > A user ruling on design CONTENT (form/shape/option choice) is requirements confirmation — NOT
  > design approval. New scope — including extensions to an already-approved design — still runs the
  > full review chain: design ready → user-initiated advisor review → user approval → implementation.
  > Approving a form ("B", "可以") never shortcuts past review. Only the explicit sign-off after the
  > advisor review unlocks eng-coder.

  step 5 指针句（引文同上规则，逐字）：

  > A user ruling on design form/shape/option choice is NOT this sign-off — scope extensions (incl. extensions to an already-approved design) still run the full review chain (full rule: the eng-coder delivery bullet under Then handle the message).

- **锚#5 链终消费**：逐字锚见 §2.6 F3 引文（Chain-terminal token consumption…）——落点 engineering.md Mandatory Flow step 8（Delivery review）行后——双端。
- **锚#6 凭证不落文档**：逐字锚见 §2.7 F1 引文（Credential values stay out of documents…）——落点 engineering.md Hard Rules——双端；配套全仓巡检正则与范围见 §2.7。
- **锚#7 调度器句**（字节源 = engineering.md 调度器条款段——双端；调度器机制权威 = AGENT-LOOP §10；本文件 FR8 行引文）："overlapping domains are queued by the scheduler, never hand-serialized"。

### 2.10 受影响文件（折叠注）

本文档对应机制的实现早已分批落地（advisor/subagent/dispatch/agent 各层 + 双端 prompts + 测试域）。逐批受影响文件表与 R24a 行数标注为历史批记录（as-of 快照），已随格式债批折叠——不得当契约引用；模块现状以源码目录与 ARCHITECTURE.md 为准，锚落点见 §2.9 各行，行号型引用一律作废（符号锚为准，如 `removeDesignTokenSlot` 于 token-ttl.mjs）。

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
| T23 | 边界：幂等 + 多槽隔离 | 未知 designId / 重复 consume；消费 A 时 B 在槽 | 未知 id 与重复消费 = no-op 提示（不报错）；消费 A 不动 B（镜像条件清仅同值） | F1/F4 |
| T24 | 边界：凭证不落文档巡检（慢层） | 全仓 md（docs/** + src/prompts/** + 根级变更记录）扫描值形态正则 `/(token\|designId)\s+[0-9a-f]{8}[0-9a-f:.-]*/i` | 零命中（参数名不匹配防误伤） | §2.7 F1/F2 |

注：FR7（待办管理）为流程级约定，由 Docs/Project TODO 纪律保障，不作机械测试——方法论明示。

## 4. 边界（信任模型）

- **eng-coder 拦截型机械约束**：token 校验、写文件门禁。质量靠 eng-coder.md 自查 + 交付前自评。
- **父代理拦截型机械约束**：design token 前写产品代码被拒。其余（等批准、不写实现、验收）靠 engineering.md 提示词。
- **门禁豁免边界**：豁免仅覆盖设计产出物（`docs/**`、根级 METHODOLOGY/README/AGENTS/LICENSE）；`src/` 下一切文件（含 prompts/*.md）为产品代码。判定 `isProductCode(p) = /^src[\\/]/.test(p) \|\| !isDocFile(p)`（一致化已实现）。
- **METHODOLOGY.md 缺失降级（D-M1/D-M2——已实现）**：工程模板 + 警告（不再 fallback discipline）；缺失警告含模板**运行时解析的绝对路径**（D-M1——CLI setup.mjs 与 VS Code 对应实现用 `dirname(import.meta.url)` 解析）与**模板完整正文**（D-M2——模型可直接 read 或参考正文，不再手写）；引导"与用户确认是否创建 METHODOLOGY.md"，询问 + 写文件由模型主导，系统不做自动脚手架。

## 5. 配置与会话恢复

**engineering 与 advisor.guard 都是会话级**（2026-08-29 重构）——事实源是当前会话槽位文件
（`~/.thincoder/sessions/{hash}.json.N` 的 `engineering` 字段与 `advisor.guard`），config.json 的
`agent.engineering` / `agent.advisor.guard` 降级为 **CLI 兼容/可见性镜像**，不再是事实源。背景
（跨端污染 bug）：旧设计里 engineering 只存 config.json 全局，CLI `/eng` 与 VS Code 设置面板都写它 → 两端互相翻转对方的工程模式——会话级化后两端会话各自独立，互不影响。

- **读取优先级（两端一致）**：slot 显式值 > config.json 兜底 > false。slot 无字段（旧槽位）→ 回退 config.json（兼容锁定）；slot 显式 `false` ≠ 未设置，压过 config 的 `true`。
- **写入路径（全部双写：slot 先、config 镜像后——slot 写失败不阻断 config 写）**：
  - CLI `/eng`（persistEngineering）与 eng(enter/exit) 工具翻转活状态（saveSession 每 turn 落盘往返）；
  - CLI `/advisor` guard 切换（persistGuard——仅 guard 双写，model/thinking/effort 仍 config-scoped）；
  - VS Code 设置面板 ENG/GUARD toggle（setSlotEngineering/setSlotAdvisorGuard + config 镜像）、eng 工具经
    `engPersist: {cwd, slot}` 通道（top-level run 专属）、`agentState()` 随每轮 saveLines 把 live
    engineering/advisorGuard 带入槽位。
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

- 2026-08-24 ~ 2026-09-07：机制逐批演进（发起权归用户铁律 → designId 多槽 token → eng-coder 内部交付协议与默认 async → 无签名 token（防伪层删）→ 链终消费 → 凭证不落文档 → 需求池/零裁量/docs FIRST/用户拍板≠批准提示词锚）——活机制与逐字锚已全部提炼入正文（§0-§6 及 §2.9 锚清单），本节不再重复；逐批需求-评审-实现-核销流水账已折叠，批次轨迹以 git 历史与 docs/TODO.md 为准。
- 2026-09-07：格式债批 A 重写为人类可读当前态（DOC-REWRITE / DOC-REWRITE-LARGE §5）——无 >300 字符单行、markdown 结构正确、历史折叠；锚句字节源 = prompts 落地文本（engineering.md），对照逐字。
