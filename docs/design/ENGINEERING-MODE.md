# 工程模式（Engineering Mode）设计

> 工程模式是 thincoder 的严格方法论工作流：design-before-code、METHODOLOGY 驱动、双门禁（设计评审 + 代码评审）。
> 本文档为**架构级机制文档**：功能性需求以机制目标与约束表述（架构级文档以约束替代用户故事——评审 2026-09-02 #1 措辞修正），非功能性需求与测试层完整。
> 依赖 [ADVISOR-CONVERGENCE.md](ADVISOR-CONVERGENCE.md)：design 评审的轮次豁免、MAX_ADVISOR_ROUNDS=5 上限、stale-context 保护均定义于该文档；本设计引用其机制。
>
> **2026-08-24 决策（发起权归用户）**：agent 曾两次越权抢跑（自行提交设计评审→拿 token→直接开发，其中一次全程零确认）——工程模式改为：**设计评审只能由用户发起**（agent 准备+提醒"设计就绪"，不自行调 advisor）；评审打回后每轮呈递发现+修复建议、**用户逐条拍板**再改（agent 不自行修完重送）；**交付 code review 保持流程节点自动**（eng-coder 返回后自动评审，不问用户）；系统推回（guard）在工程模式一律关闭（未来若启用仅作提示，由用户发起评审）。

## 1. 需求（Requirements）

### 1.1 总体需求

普通模式靠纪律提示词约束模型；工程模式把"设计先行、评审把关、验证收尾"提升为**半机械流程**——可硬性拦截的环节一律拦截（写文件门禁、token 校验），无法硬拦的靠 METHODOLOGY 与提示词约束。核心承诺：**代码必须先有被评审过的设计；评审对象由任务定义而非遍历猜测；评审循环在实现者内部闭环（不依赖父代理持有凭证）。**

### 1.2 功能性需求（机制约束，架构级表述）

| # | 机制需求 | 约束 |
|---|---|---|
| FR1 | 设计先行 | 设计文档（三层）存在且通过设计评审前，任何代码文件（含 `src/prompts/*.md`）不可被修改 |
| FR2 | 设计评审独立 | design review 由独立上下文执行；评审对象 = 调用时显式传入的文档清单，不遍历 git diff |
| FR3 | 授权链 | 设计评审通过签发 token——连同**随机 designId**（**评审调用时生成、通过时入槽**——评审 #7 时机口径统一；不锚定文档路径/内容，避开 2026-08-31 已否决的"文档锚失效"问题）存于会话内多设计槽 `Map<designId,{token}>`；spawn eng-coder 必须携带 designId + 匹配 token（单设计时 designId 可省略）；token 随会话 slot 持久化跨进程（TTL 7 天 fail-closed；评审 2026-09-02 #1 统一口径——见 §2.6 持久化边界） |
| FR4 | 代码评审归属 | eng-coder 交付前自查（对照验收标准/文件范围，非 LLM）；父代理在 eng-coder 返回后调 `advisor(type="code")` 评审——修复循环在父代理与 eng-coder 之间闭环（eng-coder 子代理环境无法真实调用 LLM advisor，2026-08-01 裁定） |
| FR5 | 评审时机 | **设计评审仅由用户发起**（agent 呈递就绪并提醒，不自行调 advisor）；打回后每轮呈递发现+修复建议、用户逐条拍板；**交付 code review 流程节点自动**（eng-coder 返回后自动，不问用户）；失败停止重试（2026-08-24 决策，见头部） |
| FR6 | 范围约束 | eng-coder 不得修改 Implementation Handoff 文件清单外的任何文件；父代理不得修改设计文档外的范围；超范围停下提出设计更新 |
| FR7 | 待办管理 | 技术待办统一在 `docs/TODO.md`，不落入设计文档（避免触发重新 doc review） |
| FR8 | 多任务并行 | 相互独立的设计可**并行推进**（设计/评审/实现/审计/交付评审各环节），上限 ≤4 并发（2026-09-02 用户拍板 3→4——AGENT-LOOP.md §15 D-A4 同步点；**提示词纪律——与文件集交集检查同级，无机械门禁，评审 round3 #2 补记**）。**前置检查（流程强制——提示词纪律，无机械门禁，评审 #6 措辞对齐）**：两任务"受影响文件"集无交集才可并行 spawn eng-coder（engineering.md Delegation 节「并行多 eng-coder 不得编辑同一文件」条款的形式化——评审 #3 具名锚点）；任务间有依赖链 → 串行。用户澄清/批准逐个进行（但可一次连发多个评审/批准）。token 按 designId 隔离（FR3）——各 eng-coder 携自己设计的 designId+token，互不覆盖。**发起权不变**：设计评审仍仅由用户发起（FR5），并行不改变这一点。 |

### 1.3 非功能性需求（技术标准）

| # | 维度 | 标准 |
|---|---|---|
| NFR1 | 性能 | token 校验在 spawn 时同步完成（<10ms，无网络依赖——**设计目标，非机械测试**，评审 2026-09-02 #7 标注）；design review 每轮一次 LLM 调用 |
| NFR2 | 收敛性 | code review 最多 5 轮（MAX_ADVISOR_ROUNDS），第 6 次调用被机械拒绝；design 评审不消耗该预算 |
| NFR3 | 安全 | token 机械匹配（正则锚定 + HMAC/TTL fail-closed）+ designId 定位槽；design 评审失败**不波及其他设计的槽**（2026-08-30 隔离逻辑扩至多槽；评审 #2 方案 ②：复审失败旧 token 存活至 TTL——已知取舍）；token 随 slot 持久化跨进程（TTL 7 天 fail-closed，重进 TTL 内恢复、过期重新评审——评审 2026-09-02 #1） |
| NFR4 | 兼容 | 两种模式互斥：工程模式禁用 `coder` 角色，普通模式禁用 `eng-coder`；行为不互相污染（提示词两套独立） |
| NFR5 | 可维护 | 判定逻辑单一来源：`isProductCode(p) = /^src[\\/]/.test(p) \|\| !isDocFile(p)`（相对路径语义）；对存绝对路径的 `_touchedFiles` 使用组件级匹配 `/(?:^|[\\/])src[\\/]/`（2026-08-01 实现修正，已接受）——统一用于门禁/guard/doc-only 判定 |
| NFR6 | 可恢复 | eng-coder 失败/中断可重新 spawn（同 token）；advisor 工具失败不重试，向用户报告 |

## 2. 设计（Design）

### 2.1 角色模型

| 角色 | 职责 | 机械约束 |
|---|---|---|
| **父代理**（顶层，`role` 未定义） | 架构师：需求/设计文档 → 提醒设计就绪 → 用户发起设计评审（传文档清单）→ 打回呈递+用户拍板 → 用户批准 → spawn eng-coder → 交付自动评审+验收 | 拦截型：design token 前写代码被拒；提示词约束：不写实现、不发起评审、等批准、验收 |
| **eng-coder**（子代理，`role="eng-coder"`） | 实现者：按设计实现 → 自评 → 修复 → 交付 | 拦截型：spawn 需 token、写文件需 `_engDesignReviewed`；流程驱动：交付前自评 |

### 2.2 主流程

```
1. 写需求/设计文档 docs/（三层：需求/设计/测试；按业务板块组织）
2. 父代理呈递设计摘要 + 提醒"设计就绪，可以评审"——**等待，不自行调 advisor**
3. 用户发起设计评审：父代理调 advisor(type="design", documents=[涉及文档清单])
   ├─ 有 🔴 → 呈递发现+逐项修复建议 → 用户逐条拍板 → 修改 → 再提醒 → 用户发起复审
   └─ 无 🔴 → 回显 [DESIGN-TOKEN:…] + designId（评审调用时已生成）→ designId+token 入槽
4. 用户批准设计
5. subagent(role="eng-coder", designId=<可选，单设计省略>, designToken=token)
   ├─ 机械校验 _engDesignTokens.get(designId) === token（单设计取唯一槽），不符即 throw
   ├─ spawn 成功 → child._engDesignReviewed = true（解锁写文件）
   └─ task 含：Docs involved（需求+设计+引用清单）→ 文件清单 → 验收标准（METHODOLOGY Task Structure）
6. eng-coder 实现（内部小步 verify）
6.5 首次交付偏差审计（2026-08-30 用户裁定，自动节点）：subagent(role="explore") 对照设计文档审计交付代码——验收标准是否有部分实现/静默简化/文档漂移（模块地图未回写）/超清单改动；**有偏差 → eng-coder 二次修正轮**（偏差清单即任务全文，不发明新内容；返回后逐点核销）→ **无偏差 → 进入交付评审**
7. 返回时 mergeChildMutations：子代理改动合并进父代理（_mutatedThisRun/_touchedFiles，失效旧 verify/advisor 标记，重置 _advisorRound=0）
8. 父代理 advisor(type="code", 评审范围=task 的 Docs involved + 设计验收标准) 代码评审——**流程节点自动，不问用户**
   （评审由主代理发起——eng-coder 子代理环境无法真实调用 LLM advisor 自评；评审范围仍显式化，不遍历 git diff）
9. 父代理 verify（对照验收标准）
10. 完成：验收标准勾销到设计文档
```

### 2.3 机械强制链（拦截闸 vs 推回闸）

**设计原则：只拦截，不催促。** 评审由流程提示词在正确节点驱动；每轮结束的机械推回（advisor/verify guard）在工程模式下**一律关闭**（含 opt-in 配置）。拦截闸（写文件门禁、token 校验）保持机械强制——防止错误行为，而非催促正确行为。

| 闸 | 类型 | 机制 | 位置 |
|---|---|---|---|
| **Design gate — token** | 拦截 | spawn 按 designId 定位 `parent._engDesignTokens.get(designId)`，校验 `args.designToken === 槽值` + `validateDesignToken`（HMAC/TTL 不变），不符即拒；会话内仅一个设计时 designId 可省略（取唯一槽），多个设计时缺 designId → 拒并要求指定 | subagent.mjs |
| **Design gate — 产品代码变更** | 拦截 | eng-coder `!_engDesignReviewed` → 写/删/改产品代码被拒；父代理 `!_engDesignToken` → 产品代码写/删/改被拒（豁免仅设计产出物；评审 2026-09-02 #8：门禁覆盖全部变更形态，非仅写） | dispatch.mjs |
| **Code review** | 流程驱动 | **主代理发起**：eng-coder 返回后，父代理调 `advisor(type="code")` 评审（评审范围 = task 的 Docs involved + 设计验收标准，显式化）；发现问题回 eng-coder 修复或 minor 直修。eng-coder 子代理环境无法真实调用 LLM advisor，自评不可行（2026-08-01 裁定）。mergeChildMutations 合并改动供评审使用，并重置 `_advisorRound = 0` | engineering.md；eng-coder.md |
| **偏差审计** | 流程驱动 | 首次交付后**父代理自动** spawn explore 审计（对照设计查验收覆盖/静默简化/文档漂移/超清单改动）；有偏差 → eng-coder 修正轮（同 designId+token）；无偏差 → 进交付评审（2026-08-30，见 §2.2 step 6.5——T19/AC9） | engineering.md |
| **收敛上限** | 拦截 | code review 最多 5 轮；design 不消耗轮次；eng-coder 非 LLM 自检不消耗轮次（上限只约束父代理发起的 code review——评审 2026-09-02 #5 澄清） | advisor/run.mjs |

### 2.4 评审范围（Review Scope）——评审对象由任务定义，不由遍历决定

- **doc review**：`advisor(type="design")` 调用时**显式传 documents 参数**（需求 + 设计 + METHODOLOGY + 引用文档路径）；advisor 只评审清单内文档，**不收集 git diff 变更集**（现机制按 diff 找文档——范围大、不准、与任务无关；上轮误审 VERIFY-DOCONLY.md 的教训）。显式传路径同时解决 untracked 新文档 diff 不可见问题（advisor 直接 read）。
- **code review**：主代理发起，评审范围 = task 的 Docs involved + 设计验收标准（显式化）；不遍历 git diff 找评审对象。
- 父代理负责收集涉及文档，在设计评审（documents 参数）与 spawn（Docs involved）两处传入。

### 2.5 评审时机（Review Timing）

- **设计评审（doc review）**：仅由**用户发起**——父代理呈递设计就绪并提醒，用户发话才调 advisor；打回后每轮呈递发现+修复建议、用户逐条拍板再改、再提醒复审（agent 不自行修完重送）。
- **交付 code review**：流程节点自动——eng-coder 返回后父代理自动评审（不问用户）；发现问题回 eng-coder 修复或 minor 直修。
- **系统推回**：工程模式下 advisor guard 推回一律关闭（§2.3），如未来启用也只作提示用户之用，由用户发起评审。
- advisor 失败/中断：停止重试，向用户报告原因。

### 2.6 Token 生命周期

- 签发：design review 通过（advisor 回显 `[DESIGN-TOKEN:...]`，正则锚定机械匹配）→ 生成随机 designId，token 存入 `parent._engDesignTokens` Map（多设计并存，2026-09-01）。同时置 `parent._engDesignToken` = 本次 token（向后兼容单槽读取点）。**advisor 通过结果携带 designId 回显给父代理**（与 `[DESIGN-TOKEN:…]` 同段——评审 #1：父代理凭它定向多设计下的**首次** spawn）；spawn 结果亦回传 designId，供修正轮复用。designId 于评审调用时生成、通过时入槽（评审 #7 时机口径统一）。
- 存活：会话内跨 turn（用户批准是新 runAgent 调用）；**持久化边界（2026-09-01 评审更正）**：单值 token 自 2026-08-29 会话级重构起**实际随 slot 持久化跨进程**（session.mjs `data.engDesignToken`）——多槽 Map 与之同构序列化入 slot（两端），"纯内存态"旧表述作废；TTL 7 天（`agent.engTokenTtlMs` 可覆盖）——未改动的设计一周内不必重复评审。
- 失效：design review 失败 → 该次调用的 designId 不入槽（本就为空）；**既有槽不被清除，旧 token 存活至 TTL**（用户拍板方案 ②，评审 #2：与已知取舍 #2 同窗口——需模型故意提取历史 token，接受；主防线为提示词纪律）。隔离性不变：任一评审结果不影响其他设计的槽（2026-08-30 隔离逻辑扩至多槽）。
- 消费：不消费（一个设计可 spawn 多个 eng-coder，修正轮复用同 designId+token）。
- 已知缺口：
  - 重进/续跑后 token 随 slot 恢复（TTL 内）；过期/换槽 → 重新设计评审（TTL 语义已覆盖原"接受"取舍——评审 2026-09-02 #1 统一）。
  - token 跨任务存活可复用——低风险接受（需模型故意提取历史 token）。
  - ~~多设计并行为单值 token，后签发覆盖前签发~~ → **2026-09-01 已解决**（designId 多槽集合；触发场景：同会话 memory_delete + §14 并行 spawn，单值覆盖致 §14 首 spawn 失败重跑）。
  - 复审失败后旧 token 存活至 TTL（2026-09-01 用户拍板方案 ②）——与取舍 #2 同窗口接受；主防线为提示词纪律（打回即修订复审，spawn 过时设计需模型主动绕过整条流程）。

### 2.7 受影响文件

| 文件 | 动作 | 用途 |
|---|---|---|
| `src/agent/setup.mjs` | MODIFY | 提示词独立组装（工程模式不注入 main/discipline）；METHODOLOGY 缺失降级为工程模板+警告 |
| `src/agent/dispatch.mjs` | MODIFY | 父代理门禁（isProductCode）；未知路径保守拦截——已实现（「语义一致化 4 项」已闭环） |
| `src/agent-tools/advisor.mjs` | MODIFY | advisor 工具增加 documents 参数；design 通过时同步 _engDesignToken（存入 _engDesignTokens Map——评审 2026-09-02 #3 修正；_engDesignReviewed 为 spawn 时子代理侧标志，非此处）；**2026-09-01**：评审调用生成随机 designId，**通过结果携带 designId 回显给父代理**（评审 #1——多设计首 spawn 的定向依据），通过时 token 存入 `_engDesignTokens` Map（多设计并存）；失败该 designId 不入槽、不波及其他槽（隔离扩至多槽；评审 #2 方案 ②：复审失败旧 token 存活至 TTL） |
| `src/advisor/messages.mjs` | MODIFY | design 分支按 documents 清单构建评审输入（替代 git diff 收集） |
| `src/agent-tools/subagent.mjs` | MODIFY | mergeChildMutations（已有）；**2026-09-01**：spawn eng-coder 增 `designId` 参数（schema，可选），token 校验改按 `_engDesignTokens` 槽定位——单设计省略 designId 取唯一槽、多设计缺 designId 拒并要求指定、给定 designId 无匹配槽明确报错；修正轮 spawn 回传 designId |
| 两端 `src/agent-tools/advisor.mjs` + `subagent.mjs` + `src/prompts/engineering.md` + 测试 | **VS Code 端镜像同步（评审 #5）**——engineering.md byte-identical 硬约束 + `_engDesignTokens` 两端同构；VS Code 测试同步加 designId/隔离断言；**VS Code 端 `advisor.mjs` paths 描述同步 CLI（"never inspects diffs"——2026-08-25 documents 改造时 VS Code 漏改，审计 #4 补记）** |
| 两端 `run-helpers.mjs`（VS Code `agentState()`）/ `session.mjs`（CLI slot 持久化）/ `panel-session.mjs`（VS Code 往返） | **多槽序列化（2026-09-01 审计 #1 修复）**——`_engDesignTokens` Map 随 slot 持久化（VS Code 跨轮 agent 重建场景的必要补齐）；§2.6 持久化边界同步。序列化格式 `{ [designId]: token }`（JSON 安全），恢复 `new Map(Object.entries)`；旧 slot 无字段 → 不设 Map（fail-closed TTL 兜底过期 token）。**修复轮补记实际触点**：VS Code 恢复链 `panel-chat.mjs`（engState 携带）→ `setup.mjs`（恢复 Map）；清理对称（**审计修复 #2**）——两端 `agent-tools/eng.mjs`（exit + off→on）+ CLI `tui/cmd-eng.mjs` + `session.mjs` `resetSessionState` 同步 `_engDesignTokens = new Map()`，resolveDesignSlot 的"有 Map 无镜像"防护降级为防御冗余 |
| 两端 `setup-reminders.mjs`（VS Code）/ `setup.mjs`（CLI）+ `run-helpers.mjs`（VS Code `loadEngineeringPrompt`，评审 2026-09-02 #3 补全）/ METHODOLOGY 缺失警告 | MODIFY | 2026-09-02：警告含模板**绝对路径** + **模板正文**注入（D-M1/D-M2，§7 变更段）——模板可达性修复（CLI 端已实现 2026-09-02，D-AC 勾销见 §7 状态行；VS Code 端并行任务进行中） |
| 两端 `CHANGELOG.md` | 变更记录（下一版本号——0.12.54/0.8.9 已发布，评审 #3 补记） |
| `src/prompts/engineering.md` | MODIFY | Delivery review 一步：主代理发起 code review（范围 = Docs involved + 验收标准）；Work Loop 交付评审状态同步；**首次交付偏差审计 + eng-coder 修正轮（2026-08-30，见变更记录）**；**2026-09-01**：注入"Parallelize aggressively"并行化纪律（§14 条款——顶层工程模式 system prompt 不加载 system.md，该纪律须在 engineering.md 单独出现方生效）+ 多任务并行/文件集交集禁并行/≤4 并发/并行 spawn 调用形态 |
| `src/prompts/eng-coder.md` | MODIFY | 交付前自评纪律；按 Docs involved 自查 |
| `src/prompts/discipline.md` | 不动 | 普通模式专属（解耦原则） |
| `src/prompts/main.md` | 不动 | 普通模式专属（解耦原则） |
| `test/agent.test.mjs` | MODIFY | 门禁/guard 测试；doc review 范围测试；**2026-09-01**：+designId 多槽 spawn 校验（T15/T16/T17）；engineering.md 并行化条款断言 |
| `test/advisor.test.mjs` | MODIFY | design 评审输入构建测试；**2026-09-01**：+多设计 token 并存、失败不波及其他槽隔离测试、**advisor 通过结果含 designId 断言（评审 #1）** |
| `docs/TODO.md` | MODIFY | 待办统一维护（已有） |

### 2.8 错误与恢复（Error & Recovery）

| 场景 | 行为 |
|---|---|
| eng-coder 中途失败/中断 | 父代理可重新 spawn（同一 token，token 未失效）；或在报告中说明 |
| 实现中设计变更（用户反馈） | eng-coder 停下报告（eng-coder.md）；父代理更新设计文档 → 请求用户重新确认 → 必要时重新评审 |
| advisor 工具失败/中断 | 停止重试，向用户报告（评审时机纪律） |
| merge 冲突/异常 | mergeChildMutations 为纯内存操作，冲突不可能（单线程）；异常向上抛，父代理见错误结果 |
| 并发 spawn（同一或不同 designId） | 允许（token 不消费）；各 eng-coder 携自己 designId+token 独立实现，父代理分别验收（2026-09-01 多设计并行） |
| 会话恢复/重进 | token 随 slot 持久化（TTL 7 天 fail-closed）——重进 TTL 内恢复；过期/换槽才需重新设计评审（评审 2026-09-02 #1） |

## 3. 测试（Testing）

### 3.1 验收标准（Acceptance Criteria）

- AC1: 工程模式下，无 design token 时写产品代码（含 `src/prompts/*.md`）被 dispatch 拒绝；写 `docs/**` 与根级文档放行。
- AC2: spawn eng-coder 时 token 不匹配即 throw；匹配则 `_engDesignReviewed = true` 解锁写文件。
- AC3: 工程模式顶层 system prompt 不含 main.md/discipline.md 条款（解耦后）。
- AC4: doc review 按显式 documents 清单评审——清单外文档（如无关的 git diff 变更）不被评审。
- AC5: eng-coder 交付前自查（验收标准/文件范围/测试）；父代理在 eng-coder 返回后**自动**调 `advisor(type="code")` 评审（不问用户），对照验收标准验收。
- AC6: 评审时机纪律生效——设计评审仅用户发起时调用；无用户发起/交付流程节点时，父代理不调 advisor。
- AC7: `npm test`（fast 层，slow 门控跳过）与 `npm run test:full`（含 slow 层——session/token 持久化区域按项目测试策略走 full）均通过（平台无关路径写法）。
- AC8（2026-09-01）: 多设计并行——各 eng-coder 凭自己 designId+token 独立通过，后签发**不覆盖**前签发；单值覆盖缺口消除；某 design 复审失败 → 该次 designId 不入槽、**既有槽不清**（旧 token 存活至 TTL，方案 ②）、其他设计槽不受波及；engineering.md 顶层注入并行化纪律（§14 条款在工程模式生效，断言可指认）。
- AC9（2026-09-01，评审 round3 #1）: 首次交付偏差审计（§2.2 step 6.5）自动运行——无需用户发起；有偏差 → eng-coder 修正轮 spawn（同 designId+token，任务仅偏差清单）；无偏差 → 直接进交付评审。

### 3.2 用例表

| # | 场景 | 输入 | 预期输出 | 映射 |
|---|---|---|---|---|
| T1 | 正常：设计→token→spawn | 设计评审通过（无 🔴）→ spawn 带正确 token | token 签发；eng-coder 解锁写文件并完成实现 | FR3 |
| T2 | 错误：token 不匹配 | spawn 带错误/缺失 token | throw "Invalid or missing design token" | FR3 |
| T3 | 边界：复审失败（既有通过后的复审） | 复审含 🔴 | token 不签发（该次 designId 不入槽）；既有 token **存活至 TTL**（评审 #2 方案 ②——与 T17 隔离语义互补，见 §2.6 失效/已知缺口） | FR3/NFR3 |
| T4 | 错误：设计前写代码 | engineering=true、无 token、写 src/app.mjs | dispatch 拒绝（"design review required"） | FR1 |
| T4b | 变更形态全覆盖（评审 2026-09-02 #8 补） | 无 token 删除/移动产品代码文件 | 同写路径被拒（门禁覆盖写/删/改全部变更形态） | FR1 |
| T5 | 边界：设计前写 src/prompts/*.md | 同上，写 src/prompts/x.md | 拒绝（isProductCode） | FR1 |
| T6 | 边界：设计前写 docs/ 文档 | 同上，写 docs/design/x.md | 放行 | FR1 |
| T7 | 错误：advisor 失败 | advisor 调用 aborted | 停止重试，报告中说明 | FR5 |
| T8 | 边界：resume/重进后 token 恢复（TTL 内） | 会话恢复后 spawn（同 slot、TTL 内） | token 校验通过，eng-coder 解锁写文件——不再重新评审（评审 2026-09-02 #1 重写） | FR3 |
| T8b | 边界：角色互斥（评审 2026-09-02 #6 补） | 工程模式 spawn `role="coder"` | 拒绝（schema 枚举 + 运行期硬门禁） | NFR4 |
| T9 | 正常：主代理评审 | eng-coder 实现 → 返回 → 父代理调 advisor(code) | 评审通过 → 对照验收标准验收 | FR4 |
| T10 | 边界：评审范围显式化 | design review 传 documents=[X.md]，diff 含无关文档 Y.md | 只评审 X.md，Y.md 不被提及 | FR2 |
| T11 | 边界：范围外写文件 | eng-coder 试图写文件清单外路径 | 停下报告，不静默扩展（eng-coder.md 纪律，机械层无此检查——记录为纪律保障） | FR6 |
| T12 | 边界：收敛上限 | 工程模式下 code review 第 6 次调用 | 被 MAX_ADVISOR_ROUNDS 拒绝（详见 ADVISOR-CONVERGENCE.md，覆盖于 test/advisor.test.mjs cap 用例） | NFR2 |
| T13 | 边界：评审时机纪律 | 设计文档就绪但用户未发起时 | 父代理不调 advisor、只提醒就绪（提示词行为；验证 engineering.md 含该纪律，机械层无自动触发——记录为纪律保障） | FR5 |
| T14 | 边界：同一 token 多次 spawn | 同一设计 token 连续 spawn 两个 eng-coder | 两者均成功（token 不消费）；各自独立实现 | FR3 |
| T15 | 正常：双设计并行 spawn | 两个 design review 分别通过（各自 designId+token，**advisor 结果回显 designId**——评审 #1）→ 并行 spawn eng-coder 各带自己 designId+token | 两者均通过、互不覆盖（单值槽时代后者会拒前者 token） | FR3/FR8 |
| T16 | 边界：designId 缺失+多设计 | 会话内有两个不同 designId，spawn 只带 designToken 不带 designId | throw 要求指定 designId（不误取任一槽） | FR3 |
| T17 | 边界：评审失效隔离 | 某 design 的复审失败（含 🔴） | 该次 designId 不入槽；**其他并行设计槽不受波及、token 仍有效**（评审 #2 方案 ②：旧 token 存活至 TTL） | FR8/NFR3 |
| T18 | 边界：并行文件集交集 | 两任务"受影响文件"有交集时父代理试图并行 spawn | 提示串行/停（提示词纪律——engineering.md 条款；机械层无检查，记为纪律保障） | FR8 |
| T19 | 正常：首次交付偏差审计（评审 round3 #1） | eng-coder 首次交付 → explore 审计（自动节点，无用户发起） | 有偏差 → 修正轮 spawn（同 designId+token，任务仅偏差清单）；无偏差 → 直接进交付评审 | FR4/AC9 |

（FR7 待办管理为流程级约定，由 Docs/Project TODO 纪律保障，不作机械测试——方法论明示。）

## 4. 边界（信任模型）

- **eng-coder 拦截型机械约束**：token 校验、写文件门禁。质量靠 eng-coder.md 自查 + 交付前自评。
- **父代理拦截型机械约束**：design token 前写产品代码被拒。其余（等批准、不写实现、验收）靠 engineering.md 提示词。
- **门禁豁免边界**：豁免仅覆盖设计产出物（`docs/**`、根级 METHODOLOGY/README/AGENTS/LICENSE）；`src/` 下一切文件（含 prompts/*.md）为产品代码。判定 `isProductCode(p) = /^src[\\/]/.test(p) || !isDocFile(p)`（一致化已实现——「语义一致化 4 项」已闭环）。
- METHODOLOGY.md 缺失：工程模板 + 警告（不再 fallback discipline）；警告含模板**绝对路径**与**模板正文**（2026-09-02：模板可达性修复——模型可直接 read 或参考正文，不再手写）。

## 5. 配置与会话恢复

**engineering 与 advisor.guard 都是会话级（2026-08-29 重构）**——事实源是当前会话槽位文件（`~/.thincoder/sessions/{hash}.json.N` 的 `engineering` 字段与 `advisor.guard`），config.json 的 `agent.engineering` / `agent.advisor.guard` 降级为 **CLI 兼容/可见性镜像**，不再是事实源。

背景（跨端污染 bug）：旧设计里 engineering 只存 config.json 全局，而 CLI `/eng` 与 VS Code 设置面板都写它 → 两端互相翻转对方的工程模式（"VS Code 工程模式下模型仍委托 role='coder'"）。会话级化后两端会话各自独立，互不影响。

- 读取优先级（两端一致）：**slot 显式值 > config.json 兜底 > false**。slot 无字段（2026-08-29 前的旧槽位）→ 回退 config.json（兼容锁定，见 `test/session-eng-advisor.test.mjs` / vscode `test/eng-session.test.mjs`）；slot 显式 `false` ≠ 未设置，压过 config 的 `true`。
- 写入路径（全部双写：slot 先、config 镜像后，slot 写失败不阻断 config 写）：
  - CLI `/eng`（`src/tui/cmd-eng.mjs` `persistEngineering`）；CLI `eng(enter/exit)` 工具翻转活状态，`saveSession` 每 turn 落盘往返（`session.mjs` 显式字段清单含 `engineering` / `advisor`）
  - CLI `/advisor` guard 切换（`src/tui/cmd-advisor.mjs` `persistGuard`——仅 guard 双写，model/thinking/effort 仍 config-scoped）
  - VS Code：设置面板 ENG/GUARD toggle（`panel-messages.mjs` setSlotEngineering/setSlotAdvisorGuard + config 镜像）；`eng` 工具经 `engPersist: { cwd, slot }` 通道（top-level run 专属，subagent 不携带）；`agentState()`（run-helpers.mjs）随每轮 `saveLines` 把 live engineering/advisorGuard 带入槽位
- agent 初值链（CLI）：`assembleAgent()` 从 config.json 播种 → `bin/thincoder.mjs` 启动 `applySession` 时 slot 值覆盖（TUI 单 agent 长驻，无 per-submit 重建）；VS Code：`setupAgentRun` 每轮从 `engState`（panel-chat 从槽位读）注入。
- resume 保留 run 状态（mutation 追踪/收敛预算）——guard 跨续跑生效、cap 不可重置；design token **随 slot 持久化**（TTL 7 天 fail-closed，重进 TTL 内恢复；过期重新评审——评审 2026-09-02 #1 统一口径）。
- 角色互斥：工程模式禁用 `coder`，普通模式禁用 `eng-coder`（schema 枚举 + 运行期硬门禁双保险）。

## 6. 已知取舍（评审记录）

1. 父代理无全面写文件门禁——必须能写设计产出物；越权靠提示词（拦截型门禁覆盖产品代码）。
2. token 跨任务存活——保守缺口，已接受。
3. token 持久化边界（2026-09-01 评审更正）——单值自 08-29 起已随 slot 持久化、多槽同构序列化；TTL fail-closed 兜底，过期重评。
4. multi-repo 时 advisor cwd 取 `repos[0]`——`_touchedFiles` 绝对路径缓解，已知限制。
5. 架构级文档以机制约束（FR1-FR8）替代用户故事——架构级机制文档的既定形式（评审 2026-09-02 #1 措辞修正，不主张 METHODOLOGY 原文含此豁免）。

## 7. 变更记录
### 2026-09-02：engineering-sub.md 子代理确认例外声明（用户实测：eng-coder 输出"确认后开始"空转等用户——子代理无用户可等）

**问题**：eng-coder 子代理误用"确认范式"——输出"确认后开始"结束回合空转等用户，但子代理无用户。根因 = 模型自发套用训练范式，非提示词直接诱导（engineering-sub.md 已核实无确认句）。

**加固**：两端 `src/prompts/engineering-sub.md` "Additional mandatory constraints:" 追加一条（英文、与既有条目同风格，两端 byte-identical 保持）——子代理任务已由父代理确认、无用户可等、立即执行、禁止确认式提问或以 "waiting for approval" 收尾、任务歧义写最终报告返回。

**受影响文件**：两端 `src/prompts/engineering-sub.md`（追加子代理确认例外声明）+ 两端 `test/agent.test.mjs`（engineering-sub.md 内容断言——此前无断言，补防回退）。

**验收**：两端 engineering-sub.md 改后 byte-identical（既有 15 文件比对断言覆盖）；两端新增断言测试通过。

### 2026-09-02：METHODOLOGY 缺失模板可达性（用户报告：模型说"模板在源码里访问不到，自己写了一个"）

**问题**：项目根无 `METHODOLOGY.md` 时，工程模式注入缺失警告，指引模型参考 `src/prompts/methodology-template.md` 创建——但该路径是**产品源码相对路径**（CLI npm 包 / VS Code 扩展安装目录），用户项目 cwd 下不存在 → 模型读取失败（"模板在源码里，访问不到"）→ 只能自己手写一个，模板参考链路断裂。

**需求**：F1 = 模板路径对模型**可达**（真实路径或内容直达）；F2 = **保留模型互动**（模型询问用户 → 确认后写入 cwd/METHODOLOGY.md——用户裁定：不经过模型不询问的自动脚手架不好，喜欢有模型互动的体验）；F3 = 两端（CLI + VS Code）同行为。

**设计**（用户确认 2026-09-02）：

- **D-M1 警告文本给真实路径**：缺失警告中模板路径从静态相对路径 `src/prompts/methodology-template.md` 改为**运行时解析的绝对路径**——setup 代码用 `dirname(import.meta.url)` 拼模板真实位置（`../prompts/methodology-template.md` 的绝对形式），CLI npm 包与 VS Code 扩展安装目录下模型均可直接 read
- **D-M2 模板正文直接注入警告**：缺失警告消息内附模板**完整正文**（44 行 ≈1.5KB，仅缺失时注入一次）——模型零文件访问障碍，参考内容生成；正文前加注"built-in template（可 read <绝对路径> 或直接参考以下内容）"
- **D-M3 互动流程保留**：警告文本引导"与用户确认是否创建 METHODOLOGY.md，确认后写 cwd/METHODOLOGY.md"——询问 + 写文件仍由模型主导，系统不做自动脚手架
- **D-M4 两端落地**：CLI `src/agent/setup.mjs`（buildEngineeringPrompt 缺失警告 + 模板绝对路径解析）；VS Code `src/agent/run-helpers.mjs`（loadEngineeringPrompt 同）+ `src/agent/setup-reminders.mjs`（警告文本同）
- **D-M5 测试**：两端断言更新——缺失警告含**模板绝对路径**（断言 /(?:thincoder|thincoder-vscode)[\\/].*methodology-template.md/ 或扩展绝对路径形态）与**模板首行内容**（"# METHODOLOGY — AI Agent Collaboration"）；"Ask the user whether to create METHODOLOGY.md" 引导语义保留（新文本断言）
- **并发上限 3 → 4（2026-09-02 用户拍板）**：架构师并行跟踪 N 任务状态 + 修复轮不串台的实际约束，超限收益递减、混淆风险升；异步化后主会话同一时刻在跑的子代理可能更多，4 为用户拍板值——AGENT-LOOP.md §15 D-A4 同步点（评审 2026-09-02 #4：09-01 条目保持 as-of，本条目记录拍板）

**受影响文件**：`src/agent/setup.mjs`（CLI）、`src/agent/run-helpers.mjs` + `src/agent/setup-reminders.mjs`（VS Code）、两端 `test/agent.test.mjs`（警告文本断言）。

**验收**：D-AC1 = 无 METHODOLOGY.md 项目进入工程模式 → 警告含模板绝对路径 + 模板正文（D-M1/D-M2）；D-AC2 = 模型可沿该路径 read 到模板（真机可验证）；D-AC3 = 互动流程不变——仍由模型询问用户后生成（D-M3）；D-AC4 = 两端测试全绿（D-M5）。

**状态（2026-09-02，两端均已实现）**：受影响文件 ✓——CLI `setup.mjs`（buildEngineeringPrompt 增绝对路径解析 + methodologyTemplatePath/Body 返回；缺失警告含绝对路径 + 正文 + 读取失败降级分支）；VS Code `run-helpers.mjs`（loadEngineeringPrompt 同构返回）+ `setup-reminders.mjs`（警告文本与 CLI 逐字一致——D-M3 句 + D-M2 设计字面前缀 + 降级不补句，审计 2026-09-02 修复编码损坏后逐字统一）；两端 `test/agent.test.mjs`（运行时断言：绝对路径形态 + existsSync true（D-AC2）+ 模板首行 + Ask 语义 + write cwd/METHODOLOGY.md + 前缀字面断言（审计补——防编码损坏漏网））。D-AC1 ✓、D-AC2 ✓、D-AC3 ✓、D-AC4 ✓（CLI 1061/0 + lint 209 OK；VS Code 888/888 + lint 197 OK——两端全量全绿，警告文本逐字一致）。

**状态（2026-09-02，CLI 端）**：已实现——受影响文件 ✓：`src/agent/setup.mjs`（D-M1 模板绝对路径运行时解析、D-M2 模板正文注入、D-M3 询问引导保留——警告文本 "Ask the user whether to create METHODOLOGY.md; if the user confirms, write cwd/METHODOLOGY.md before designing." + 正文前缀 "built-in template（可 read <绝对路径> 或直接参考以下内容）:"（设计 D-M2 字面，CLI 为准）+ 正文块；降级：正文读取失败 → 基础警告不补句，保持现有降级路径）、`test/agent.test.mjs`（断言更新，行为级 + 文本级，含 D-M2 标注句字面断言）。验收勾销：D-AC1 ✓、D-AC2 ✓、D-AC3 ✓、D-AC4 ✓（CLI 端 `npm test` 1061/0 fail + `npm run lint` 209 files OK；VS Code 端 888/888 全绿，两端警告文本逐字一致——审计 2026-09-02 修复编码损坏后统一）。



### 2026-09-01：多任务并行化 + designId 多槽 token（用户拍板方案 a）

**需求**：用户要求"能并行化的尽可能并行化"，并追问工程模式并行可行性。评估结论：工程模式各环节（设计/评审/实现/审计/交付评审）多可并行，机制近乎零改动——**唯一硬障碍是 token 单值槽**（`_engDesignToken` 后者覆盖前者）。**触发实证**：本会话 memory_delete + §14 两独立任务尝试并行 spawn eng-coder，后者成功写入槽、前者 spawn 校验 `!== issued` 失败（实为失败后串行重跑，非真并行）。**归因更正**：§14 token 失效真因是单值覆盖，**非**"文档修订使 token 失效"（token = `uuid:expiresAt:HMAC(uuid:expiresAt)`，不含文档哈希，documents 参数仅是评审输入清单——无内容绑定）。**方案**：token 改按**随机 designId** 存 `Map<designId,{token}>`（不锚定文档路径/内容——避开 2026-08-31 已否决的"文档锚失效"路线，即当时预留"未来可再议"的评审实例表方案的落地）。**附带缺口**：§14 并行纪律条款落在 system.md，但顶层工程模式不加载 system.md（setup.mjs 独立组装）→ engineering.md 须单独注入该纪律方生效。

**改动**（全走 eng-coder，两端镜像——评审 #5）：
1. `src/agent-tools/advisor.mjs`——评审调用生成 designId；**通过结果携带 designId 回显给父代理（评审 #1——多设计首 spawn 定向依据）**，通过时 token 入 `_engDesignTokens` Map（保留 `_engDesignToken` 单槽兼容）；失败该 designId 不入槽、不波及其他槽（隔离扩至多槽；评审 #2 方案 ②：复审失败旧 token 存活至 TTL）
2. `src/agent-tools/subagent.mjs`——eng-coder 增可选 `designId` 参数；token 校验按槽定位（单设计省略取唯一槽 / 多设计缺 designId 拒 / 给定 designId 无匹配拒）；修正轮回传 designId
3. `src/prompts/engineering.md`——注入"Parallelize aggressively"（§14 纪律，顶层 system.md 不含）+ 多任务并行纪律（前置文件集交集检查 / ≤4 并发 / 依赖链串行 / 并行 spawn 调用形态——决策③ 取代原 ≤3）
4. `test/agent.test.mjs` + `test/advisor.test.mjs`——T15-T18 + 多槽/隔离断言 + engineering.md 并行条款断言
5. `docs/TODO.md`——"多设计并行 token 映射化"条目销账（09-01 规格定稿、评审通过后随 eng-coder 落地销账——落地前条目保持 Open，评审 #3 生命周期统一）；**VS Code 端镜像改动同批（评审 #5：engineering.md byte-identical + 两端同构 + vscode 测试）**

**测试**：T1-T14 既有行为不变；T15-T18（见用例表）。
**关键决策**：① 多设计标识用**随机 designId 而非文档路径**（否决：文档锚——文档改名/回写状态/重组即失效，08-31 已否决此路线；采用：评审调用生成随机 id，文档仅审计不参与校验）；② **保留 `_engDesignToken` 单槽**（向后兼容 + 门禁"有无 token"布尔判定不改为"Map 非空"——改动最小）；③ **并发上限 3**（架构师并行跟踪 N 任务状态 + 修复轮不串台的实际约束，超限收益递减、混淆风险升——as-of 快照；**2026-09-02 用户拍板 3→4，见当日变更记录**）。

**修复轮（2026-09-01，上轮交付的 4 项审计/评审修复，任务全文=清单，invent nothing new）**：
1. 审计 #1 🔴 多槽序列化——`_engDesignTokens` Map 随 slot 持久化（CLI `saveSession`/`applySession` + VS Code `agentState`→`saveLines`→`panel-chat`→`setup` 四环同构，格式 `{ [designId]: token }`），旧 slot 无字段不设 Map（TTL fail-closed 兜底）；
2. 审计/评审 #2 🟡 清理对称——清 `_engDesignToken` 的 6 处位置（CLI eng(exit)/off→on + cmd-eng OFF + resetSessionState；VS Code eng(exit)/off→on）同步 `_engDesignTokens = new Map()`，resolveDesignSlot 防护保留为防御冗余；
3. 审计 #4 🟡 VS Code advisor `paths` 描述去 git-diff 字样（同步 CLI "never inspects diffs"，两端 documents 描述本就同文）；
4. 卫生 🔵 engineering.md 两端 byte-identical 删重复 `## Questioning Style` 标题；**designId 占位文案归属更正**：实际在两端 `subagent.mjs`（declined 分支），不在 engineering.md——统一为 `(single-design session — designId optional)`。

### 2026-08-30：首次交付偏差审计 + eng-coder 修正轮（用户裁定）

**触发**：用户指示"第一次 eng-coder 开发完成以后先用 explore 查探一次现码与设计文档之间的偏差，然后再跑一次 eng-coder 修正这些偏差"。

**机制**：Mandatory Flow 插入 step 7（偏差审计，自动节点）——首次交付后先 spawn `explore`（thoroughness 按交付规模，默认 medium）对照 Docs involved + 验收标准审计实现：部分实现/静默简化/文档漂移（eng-coder 自查第 6 项的模块地图回写）/超清单改动四类偏差。有偏差 → eng-coder **第二次 spawn**（同一 designToken，偏差清单 = 任务全文，`invent nothing new`——修正轮不发明新需求），返回后逐点核销；无偏差 → 直接进交付评审（原 step 7 顺延为 step 8）。审计是自动节点，不需要用户发起。

**定位**：advisor code review 是独立视角的质量闸（隔离上下文、多模型）；偏差审计是**同源对照**（设计文本 vs 实现文本），explore 的只读全文比对正合适——两者互补，不能互替。静默简化恰是交付报告不会自首的偏差类型（eng-coder 保真条款的执行核查）。

**影响**：`engineering.md`（两端 byte-identical）Flow step 7 + Work Loop "First delivery audit" 状态 + eng-coder delivery 消息处理分支；两端 `test/agent.test.mjs` 新增内容断言（8 项）锁死。每次任务多一个 explore + 可能一轮 eng-coder 的 token 成本，换取静默降级的机械兜底。

### 2026-08-30：工程模式提示词补委托引导（解耦遗留缺口，用户拍板方案 A）

**需求**（用户核对发现）：提示词解耦（PROMPT-DECOUPLING.md）后工程模式顶层不注入 main.md/discipline.md，而 AGENT-LOOP §13（广度探索下沉 explore）只落在 main.md——工程模式从此只剩 eng-coder 委托，零 explore/plan 引导。后果：架构师在需求澄清/设计阶段做广度探索时无规则可循，大概率内联 read 淹没自己的主历史（正是 §13 要解决的问题在工程模式下同样存在）。核实确认非有意取舍（文档无决策记录）：`explore`/`plan` 在工程模式实际可用（setup.mjs role enum = explore/plan/eng-coder）。

**设计**（两端 `src/prompts/engineering.md` byte-identical，插在 Work Loop 与 Questioning Style 之间新增 "## Delegation (subagents)" 一节，6 条）：
1. 广度探索 → `explore` 子 agent（任务里标注 thoroughness：quick/medium/thorough）；点破隔离收益——子 agent 的 read/grep 不进主历史，内联扫会把架构师自己的上下文埋进噪声。
2. `plan` 子 agent 独立验证可行性问题；只读、不问最终用户——歧义经报告回给架构师与用户解决。
3. 精度例外（沿 §13 口径）：仅即将立刻编辑某文件时才亲自 read——架构师因设计判断需要仍可直接读设计相关代码。
4. 并行多 eng-coder 不得编辑同一文件。
5. 不重做已委托的探索——eng-coder 交付验证 = 读其声称改动的文件 + 跑测试。
6. `escalate` 工程模式不可用（与 setup.mjs fail-closed 不注册一致——措辞用 "unavailable" 不用 "禁用"，模型工具表里确实没有该工具）；`consult` 保留可用（疑难判断）。

**明确不做**：不移植 main.md 的全部条款（consult 简报规范/飞刀时机判断不适用——工程模式 escalate 不可用；goal/skill 与工程模式无关）。

**测试**（两端各一，内容级断言英文短语；副本未改时必须能失败）：CLI `test/agent.test.mjs`（"prompts/engineering.md: 委托引导…"）、vscode `test/agent.test.mjs`（"engineering.md: delegation guidance…"）——断言委托句/三档彻底度/隔离收益/精度例外/并行互斥/不重做/escalate 不可用/consult 保留 8 项关键句 + 既有 15 文件 byte-identical 比对测试兜底。

**受影响文件**：`src/prompts/engineering.md`（thincoder/ + thincoder-vscode/ 各一份，182→208 行）、两端 `test/agent.test.mjs`。验证：两端全量测试 784/784、781/781 全绿；`npm run lint` 两端 0 error；byte-identical 比对通过。


### 2026-08-30：eng-coder 补「实现保真——不许静默降级」条款（用户核对提示词系统后拍板）

**需求**（用户核查触发）：提示词系统对"按设计交付不打折"的覆盖——普通模式 system.md 有完整链条（"Decide what's right before deciding what's smallest" / "deliver exactly what was agreed — no simplifying" / 收尾自检 "not a subset, not a reinterpretation"），工程模式架构师侧也有（no silently deviate / never silently invented / no pre-existing cop-out），但 **eng-coder.md 缺正面禁止句**：L10/L16 的 "not silently deviate" 只封"默默换方向"，未封"默默简化已明确的设计"——实现期把设计明确要求的行为（交互/边界/状态）降级成近似版、交付时才在报告里披露，字面上不构成 deviate，正好是漏洞形状（实证：§7.2 折叠区块交互被实现降级，用户裁定"按照设计做都要讨价还价吗"）。

**设计**（两端 `src/prompts/eng-coder.md` byte-identical，Guidelines 节 Follow-the-design 条之后新增一条）："Implement to the full design — no silent degradation"——① 觉得设计元素实现代价高也照样实现、成本写进报告；② 指定行为的"更简单近似"就是 deviation：要么照设计实现，要么编码前停下向父代理呈报权衡，**不许先交缩水版再事后披露**；③ 点破"父代理批准的是设计，不是你的折扣"。

**测试**（两端各一，内容断言英文短语，5 项关键句；副本未改时必须能失败）：CLI `test/agent.test.mjs`（"prompts/eng-coder.md: 实现保真…"）、vscode `test/agent.test.mjs`（"eng-coder.md: full-design fidelity…"）+ 既有 15 文件 byte-identical 比对兜底。

**受影响文件**：`src/prompts/eng-coder.md`（两端各一份，36→44 行）、两端 `test/agent.test.mjs`。验证：CLI 全量 785/785 全绿、vscode 全量 782/782 全绿、CLI lint 0 error、byte-identical 通过。


### 2026-08-30：system.md 补「设计文档即契约——执行期不许静默降级」（普通模式缝隙，同一触发；同日用户二轮纠偏后改为无条件绑定）

**需求**（用户指出：本会话降级实例发生在**普通模式**）：eng-coder 条款补完后，普通模式的缝隙仍在——① system.md L15 的不降级义务挂在 "Once confirmed" 上，而设计文档驱动的任务（如 §7.2 按文档实现）没有显式 confirm 环节，条款挂不上钩；② L26/L60 是披露义务而非禁止义务——降级后如实披露在形式上"合规"，但按 PHILOSOPHY 交付透明条款，披露该发生在**决策前**（让用户选择）而非交付后（通知既成事实）；③ L25 收尾自检发生在最后，管不住实现中途的降级决策时刻。

**第一版缺陷（用户二轮纠偏）**：初版补句 "whenever the behavior is already fixed by a design document or an agreed decision" 仍带前提——把绑定绑在"设计文档或已达成决策"上，**会话中直接说出的要求**（"改成 3 行""默认折叠吧"）两头不沾，字面上仍在降级许可区。

**修订设计**（两端 `src/prompts/system.md` byte-identical，L15 尾部改写为无条件绑定）：① "This binding is UNCONDITIONAL and does not wait for a formal confirmation round"——绑定无条件；② "every requirement the user states — mid-conversation, in a design doc, or in a confirmed plan — binds the moment it is stated"——要求陈述的那一刻即生效，三个来源（会话直述/设计文档/已确认计划）并列覆盖；③ "A stated request IS the contract; whatever its source, implementation may not quietly shrink it"——陈述即契约，实现不得悄悄缩水；④ 保留"代价高照做+报成本 / 实现前呈报权衡 / 交付后披露≠合规"三条出口语义。

**测试**（两端各一，7 项关键句断言；副本未改时必须能失败）+ 既有 byte-identical 比对兜底。

**受影响文件**：`src/prompts/system.md`（两端各一份）、两端 `test/agent.test.mjs`。至此三层闭合且无条件：普通模式主 agent（本条）/ eng-coder（同日上一条）/ 工程模式架构师（既有 surface-or-propose 条款）。


### 2026-08-29：UI/交互决策全链路落档（用户报告"agent 无视讨论过的 UI 设计"）

**需求**（用户拍板）：与用户讨论达成的 UI/交互设计经常不体现在实现里。根因：eng-coder 是零上下文子代理，决策只留在对话里就永远到不了它那里。要求：UI/交互决策必须落设计文档，且必须包含在下达给 eng-coder 的任务中。

**设计**（两端 `src/prompts/` byte-identical）：
1. `engineering.md` flow 第 2 步（设计文档要素）扩项：任务涉及界面时，设计文档**必须**收录与用户达成的每一条 UI/交互决策（布局、流程、控件行为、状态与反馈），严格照讨论结论；未定部分标 open，绝不静默发明。
2. `engineering.md` flow 第 6 步（eng-coder 任务书）：涉及 UI 时任务文本**必须**复述已达成的 UI/交互决策（或精确指向设计文档的具体章节）——点破机理"eng-coder has NO conversation context"。
3. `engineering.md` Hard Rules 加独立条目 "UI/interaction decisions ride the full chain"——"讨论过但没落文档"是实现无视用户要求的最常见原因。
4. `eng-coder.md` Guidelines 加执行侧闭合：UI/交互严格照任务书与设计文档实现（布局/流程/控件行为/状态/反馈）；任务书与设计文档都没覆盖的界面决策 → 停下报告缺口，不自行发明交互设计。

**测试**（内容级断言英文短语，两端各验；副本未改时必须能失败）：`engineering.md` 三处条款 + `eng-coder.md` 执行闭合，见两端 `test/agent.test.mjs`（"UI/交互决策必须落设计文档且必须进 eng-coder 任务书" / "UI 按任务书与设计文档执行"组）。

**受影响文件**：`src/prompts/engineering.md`、`src/prompts/eng-coder.md`（`thincoder/` + `thincoder-vscode/` 各一份，byte-identical）。

### 2026-08-29：METHODOLOGY 三缺口修复（核对 engineering.md 提示词时发现）

**需求**（用户要求补齐）：核对工程模式提示词时发现三个规范缺口——① engineering.md 引用 "three layers per METHODOLOGY"，但 METHODOLOGY.md 里没有三层定义（总目标/功能用户故事/非功能标准），引用悬空；② METHODOLOGY 硬流程要求三文档（需求/设计/测试文档），engineering.md 的 8 步 flow 没有测试文档环节，两文档口径不一；③ 项目根目录无 METHODOLOGY.md 时静默降级（只拼 engineering.md 模板），"per METHODOLOGY" 引用全部悬空，用户无感知。

**设计**：
1. **三层定义落地**（`METHODOLOGY.md` 基本流程 + `methodology-template.md` Requirements 步同步改写）：需求文档按三层组织——总目标（一句话为谁解决什么）/ 功能用户故事（可逐条验收，who/what/why 不写 how）/ 非功能标准（写清度量方式）；补完成判据（三层都具体到可以据此设计）；设计文档要素补"每条验收标准回指用户故事"。
2. **测试文档口径对齐**（`engineering.md` flow 第 7 步）：交付评审明确"METHODOLOGY 存在时测试文档是交付物的一部分——每条用户故事至少一个测试用例（正常/边界/异常），无测试覆盖 = 交付评审不通过"。措辞用 "When METHODOLOGY.md is present" 条件式，与 ③ 的降级路径兼容。
3. **缺失警告点名后果**（CLI `agent/setup.mjs` 警告块 + VS Code `agent/setup-reminders.mjs` 同款）：从"METHODOLOGY.md not found — project-specific rules are absent."（仅陈述缺席）升级为点名后果——"每个 'per METHODOLOGY' 引用悬空 + 三文档硬流程不被强制执行"，并给恢复路径（先问用户是否创建 METHODOLOGY.md；VS Code 侧同时删掉不存在的 "eng tool's write mode" 陈旧指引）。

**测试**（内容级断言，两端各验；副本未改时必须能失败）：三层结构/完成判据/验收回指（template）、测试文档交付条件句（engineering.md）、警告后果句/恢复路径/陈旧指引删除（setup）。见两端 `test/agent.test.mjs`。

**受影响文件**：`docs/design/METHODOLOGY.md`（CLI）、`src/prompts/methodology-template.md`（两端）、`src/prompts/engineering.md`（两端）、`src/agent/setup.mjs`（CLI 警告块）、`src/agent/setup-reminders.mjs`（VS Code 警告块）。
