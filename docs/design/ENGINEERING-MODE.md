# 工程模式（Engineering Mode）设计

> 工程模式是 thincoder 的严格方法论工作流：design-before-code、METHODOLOGY 驱动、双门禁（设计评审 + 代码评审）。
> 本文档为**架构级机制文档**：功能性需求以机制目标与约束表述（METHODOLOGY 允许架构级文档简化用户故事），非功能性需求与测试层完整。
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
| FR3 | 授权链 | 设计评审通过签发 token；spawn eng-coder 必须持有匹配 token；token 纯内存态，重进后重新评审 |
| FR4 | 代码评审归属 | eng-coder 交付前自查（对照验收标准/文件范围，非 LLM）；父代理在 eng-coder 返回后调 `advisor(type="code")` 评审——修复循环在父代理与 eng-coder 之间闭环（eng-coder 子代理环境无法真实调用 LLM advisor，2026-08-01 裁定） |
| FR5 | 评审时机 | **设计评审仅由用户发起**（agent 呈递就绪并提醒，不自行调 advisor）；打回后每轮呈递发现+修复建议、用户逐条拍板；**交付 code review 流程节点自动**（eng-coder 返回后自动，不问用户）；失败停止重试（2026-08-24 决策，见头部） |
| FR6 | 范围约束 | eng-coder 不得修改 Implementation Handoff 文件清单外的任何文件；父代理不得修改设计文档外的范围；超范围停下提出设计更新 |
| FR7 | 待办管理 | 技术待办统一在 `docs/TODO.md`，不落入设计文档（避免触发重新 doc review） |

### 1.3 非功能性需求（技术标准）

| # | 维度 | 标准 |
|---|---|---|
| NFR1 | 性能 | token 校验在 spawn 时同步完成（<10ms，无网络依赖）；design review 每轮一次 LLM 调用 |
| NFR2 | 收敛性 | code review 最多 5 轮（MAX_ADVISOR_ROUNDS），第 6 次调用被机械拒绝；design 评审不消耗该预算 |
| NFR3 | 安全 | token 机械字符串匹配（正则锚定行首）；design 评审失败即失效已签发 token；token 纯内存态（重进重新评审） |
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
   └─ 无 🔴 → 回显 [DESIGN-TOKEN:...] → 签发 _engDesignToken
4. 用户批准设计
5. subagent(role="eng-coder", designToken=token)
   ├─ 机械校验 parent._engDesignToken === token，不符即 throw
   ├─ spawn 成功 → child._engDesignReviewed = true（解锁写文件）
   └─ task 含：Docs involved（需求+设计+引用清单）→ 文件清单 → 验收标准（METHODOLOGY Task Structure）
6. eng-coder 实现（内部小步 verify）
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
| **Design gate — token** | 拦截 | spawn 时校验 `parent._engDesignToken === designToken`，不符即拒 | subagent.mjs |
| **Design gate — 写文件** | 拦截 | eng-coder `!_engDesignReviewed` → 写文件被拒；父代理 `!_engDesignToken` → 产品代码写入被拒（豁免仅设计产出物） | dispatch.mjs |
| **Code review** | 流程驱动 | **主代理发起**：eng-coder 返回后，父代理调 `advisor(type="code")` 评审（评审范围 = task 的 Docs involved + 设计验收标准，显式化）；发现问题回 eng-coder 修复或 minor 直修。eng-coder 子代理环境无法真实调用 LLM advisor，自评不可行（2026-08-01 裁定）。mergeChildMutations 合并改动供评审使用，并重置 `_advisorRound = 0` | engineering.md；eng-coder.md |
| **收敛上限** | 拦截 | code review 最多 5 轮；design 不消耗轮次；eng-coder 内部评审同样受上限约束 | advisor/run.mjs |

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

- 签发：design review 通过（advisor 回显 `[DESIGN-TOKEN:...]`，正则锚定行首机械匹配）。
- 存活：会话内跨 turn（用户批准是新 runAgent 调用）；**纯内存态**（2026-08-01 裁定：验证依赖内存字段，退出重进内存清空；session 存档持久化无意义——恢复逻辑复杂且低收益，不持久化）。
- 失效：任何后续 design review 失败即清空。
- 消费：不消费（一个设计可 spawn 多个 eng-coder）。
- 已知缺口：
  - 重进/续跑后 token 丢失 → 重新设计评审（接受：评审-修复循环通常在同一会话内完成；跨会话继续属罕见路径）。
  - token 跨任务存活可复用——低风险接受（需模型故意提取历史 token）。
  - 多设计并行为单值 token，后签发覆盖前签发（TODO：映射化，见 docs/TODO.md）。

### 2.7 受影响文件

| 文件 | 动作 | 用途 |
|---|---|---|
| `src/agent/setup.mjs` | MODIFY | 提示词独立组装（工程模式不注入 main/discipline）；METHODOLOGY 缺失降级为工程模板+警告 |
| `src/agent/dispatch.mjs` | MODIFY | 父代理门禁（isProductCode）；未知路径保守拦截（待办） |
| `src/agent-tools/advisor.mjs` | MODIFY | advisor 工具增加 documents 参数；design 通过时同步 _engDesignReviewed |
| `src/advisor/messages.mjs` | MODIFY | design 分支按 documents 清单构建评审输入（替代 git diff 收集） |
| `src/agent-tools/subagent.mjs` | MODIFY | mergeChildMutations（已有）；spawn 校验（已有） |
| `src/prompts/engineering.md` | MODIFY | Delivery review 一步：主代理发起 code review（范围 = Docs involved + 验收标准）；Work Loop 交付评审状态同步 |
| `src/prompts/eng-coder.md` | MODIFY | 交付前自评纪律；按 Docs involved 自查 |
| `src/prompts/discipline.md` | 不动 | 普通模式专属（解耦原则） |
| `src/prompts/main.md` | 不动 | 普通模式专属（解耦原则） |
| `test/agent.test.mjs` | MODIFY | 门禁/guard 测试；doc review 范围测试 |
| `test/advisor.test.mjs` | MODIFY | design 评审输入构建测试 |
| `docs/TODO.md` | MODIFY | 待办统一维护（已有） |

### 2.8 错误与恢复（Error & Recovery）

| 场景 | 行为 |
|---|---|
| eng-coder 中途失败/中断 | 父代理可重新 spawn（同一 token，token 未失效）；或在报告中说明 |
| 实现中设计变更（用户反馈） | eng-coder 停下报告（eng-coder.md）；父代理更新设计文档 → 请求用户重新确认 → 必要时重新评审 |
| advisor 工具失败/中断 | 停止重试，向用户报告（评审时机纪律） |
| merge 冲突/异常 | mergeChildMutations 为纯内存操作，冲突不可能（单线程）；异常向上抛，父代理见错误结果 |
| 并发 spawn 同一 token | 允许（token 不消费）；各自独立实现，父代理分别验收 |
| 会话恢复/重进 | token 不持久化（纯内存态）——重进后重新设计评审（接受） |

## 3. 测试（Testing）

### 3.1 验收标准（Acceptance Criteria）

- AC1: 工程模式下，无 design token 时写产品代码（含 `src/prompts/*.md`）被 dispatch 拒绝；写 `docs/**` 与根级文档放行。
- AC2: spawn eng-coder 时 token 不匹配即 throw；匹配则 `_engDesignReviewed = true` 解锁写文件。
- AC3: 工程模式顶层 system prompt 不含 main.md/discipline.md 条款（解耦后）。
- AC4: doc review 按显式 documents 清单评审——清单外文档（如无关的 git diff 变更）不被评审。
- AC5: eng-coder 交付前自查（验收标准/文件范围/测试）；父代理在 eng-coder 返回后**自动**调 `advisor(type="code")` 评审（不问用户），对照验收标准验收。
- AC6: 评审时机纪律生效——设计评审仅用户发起时调用；无用户发起/交付流程节点时，父代理不调 advisor。
- AC7: `node --test test/*.test.mjs` 全套通过（平台无关路径写法）。

### 3.2 用例表

| # | 场景 | 输入 | 预期输出 | 映射 |
|---|---|---|---|---|
| T1 | 正常：设计→token→spawn | 设计评审通过（无 🔴）→ spawn 带正确 token | token 签发；eng-coder 解锁写文件并完成实现 | FR3 |
| T2 | 错误：token 不匹配 | spawn 带错误/缺失 token | throw "Invalid or missing design token" | FR3 |
| T3 | 边界：设计评审失败 | 评审含 🔴 | token 不签发；已签发 token 失效 | FR3/NFR3 |
| T4 | 错误：设计前写代码 | engineering=true、无 token、写 src/app.mjs | dispatch 拒绝（"design review required"） | FR1 |
| T5 | 边界：设计前写 src/prompts/*.md | 同上，写 src/prompts/x.md | 拒绝（isProductCode） | FR1 |
| T6 | 边界：设计前写 docs/ 文档 | 同上，写 docs/design/x.md | 放行 | FR1 |
| T7 | 错误：advisor 失败 | advisor 调用 aborted | 停止重试，报告中说明 | FR5 |
| T8 | 边界：resume/重进后 token 丢失 | 会话恢复后 spawn | 需重新设计评审（接受） | FR3 |
| T9 | 正常：主代理评审 | eng-coder 实现 → 返回 → 父代理调 advisor(code) | 评审通过 → 对照验收标准验收 | FR4 |
| T10 | 边界：评审范围显式化 | design review 传 documents=[X.md]，diff 含无关文档 Y.md | 只评审 X.md，Y.md 不被提及 | FR2 |
| T11 | 边界：范围外写文件 | eng-coder 试图写文件清单外路径 | 停下报告，不静默扩展（eng-coder.md 纪律，机械层无此检查——记录为纪律保障） | FR6 |
| T12 | 边界：收敛上限 | 工程模式下 code review 第 6 次调用 | 被 MAX_ADVISOR_ROUNDS 拒绝（详见 ADVISOR-CONVERGENCE.md，覆盖于 test/advisor.test.mjs cap 用例） | NFR2 |
| T13 | 边界：评审时机纪律 | 设计文档就绪但用户未发起时，父代理不调 advisor、只提醒就绪（提示词行为；验证 engineering.md 含该纪律，机械层无自动触发——记录为纪律保障） | FR5 |
| T14 | 边界：同一 token 多次 spawn | 同一设计 token 连续 spawn 两个 eng-coder | 两者均成功（token 不消费）；各自独立实现 | FR3 |

（FR7 待办管理为流程级约定，由 Docs/Project TODO 纪律保障，不作机械测试——方法论明示。）

## 4. 边界（信任模型）

- **eng-coder 拦截型机械约束**：token 校验、写文件门禁。质量靠 eng-coder.md 自查 + 交付前自评。
- **父代理拦截型机械约束**：design token 前写产品代码被拒。其余（等批准、不写实现、验收）靠 engineering.md 提示词。
- **门禁豁免边界**：豁免仅覆盖设计产出物（`docs/**`、根级 METHODOLOGY/README/AGENTS/LICENSE）；`src/` 下一切文件（含 prompts/*.md）为产品代码。判定 `isProductCode(p) = /^src[\\/]/.test(p) || !isDocFile(p)`（一致化待办见 docs/TODO.md）。
- METHODOLOGY.md 缺失：工程模板 + 警告（不再 fallback discipline）。

## 5. 配置与会话恢复

**engineering 与 advisor.guard 都是会话级（2026-08-29 重构）**——事实源是当前会话槽位文件（`~/.thincoder/sessions/{hash}.json.N` 的 `engineering` 字段与 `advisor.guard`），config.json 的 `agent.engineering` / `agent.advisor.guard` 降级为 **CLI 兼容/可见性镜像**，不再是事实源。

背景（跨端污染 bug）：旧设计里 engineering 只存 config.json 全局，而 CLI `/eng` 与 VS Code 设置面板都写它 → 两端互相翻转对方的工程模式（"VS Code 工程模式下模型仍委托 role='coder'"）。会话级化后两端会话各自独立，互不影响。

- 读取优先级（两端一致）：**slot 显式值 > config.json 兜底 > false**。slot 无字段（2026-08-29 前的旧槽位）→ 回退 config.json（兼容锁定，见 `test/session-eng-advisor.test.mjs` / vscode `test/eng-session.test.mjs`）；slot 显式 `false` ≠ 未设置，压过 config 的 `true`。
- 写入路径（全部双写：slot 先、config 镜像后，slot 写失败不阻断 config 写）：
  - CLI `/eng`（`src/tui/cmd-eng.mjs` `persistEngineering`）；CLI `eng(enter/exit)` 工具翻转活状态，`saveSession` 每 turn 落盘往返（`session.mjs` 显式字段清单含 `engineering` / `advisor`）
  - CLI `/advisor` guard 切换（`src/tui/cmd-advisor.mjs` `persistGuard`——仅 guard 双写，model/thinking/effort 仍 config-scoped）
  - VS Code：设置面板 ENG/GUARD toggle（`panel-messages.mjs` setSlotEngineering/setSlotAdvisorGuard + config 镜像）；`eng` 工具经 `engPersist: { cwd, slot }` 通道（top-level run 专属，subagent 不携带）；`agentState()`（run-helpers.mjs）随每轮 `saveLines` 把 live engineering/advisorGuard 带入槽位
- agent 初值链（CLI）：`assembleAgent()` 从 config.json 播种 → `bin/thincoder.mjs` 启动 `applySession` 时 slot 值覆盖（TUI 单 agent 长驻，无 per-submit 重建）；VS Code：`setupAgentRun` 每轮从 `engState`（panel-chat 从槽位读）注入。
- resume 保留 run 状态（mutation 追踪/收敛预算）——guard 跨续跑生效、cap 不可重置；**design token 不持久化**（纯内存态，重进重新评审）。
- 角色互斥：工程模式禁用 `coder`，普通模式禁用 `eng-coder`（schema 枚举 + 运行期硬门禁双保险）。

## 6. 已知取舍（评审记录）

1. 父代理无全面写文件门禁——必须能写设计产出物；越权靠提示词（拦截型门禁覆盖产品代码）。
2. token 跨任务存活——保守缺口，已接受。
3. token 纯内存态——重进重新评审（验证依赖内存字段，持久化恢复低收益，接受）。
4. multi-repo 时 advisor cwd 取 `repos[0]`——`_touchedFiles` 绝对路径缓解，已知限制。
5. 架构级文档简化功能性需求（用户故事）——METHODOLOGY 允许，机制约束 FR1-FR7 替代。

## 7. 变更记录

### 2026-08-29：UI/交互决策全链路落档（用户报告"agent 无视讨论过的 UI 设计"）

**需求**（用户拍板）：与用户讨论达成的 UI/交互设计经常不体现在实现里。根因：eng-coder 是零上下文子代理，决策只留在对话里就永远到不了它那里。要求：UI/交互决策必须落设计文档，且必须包含在下达给 eng-coder 的任务中。

**设计**（两端 `src/prompts/` byte-identical）：
1. `engineering.md` flow 第 2 步（设计文档要素）扩项：任务涉及界面时，设计文档**必须**收录与用户达成的每一条 UI/交互决策（布局、流程、控件行为、状态与反馈），严格照讨论结论；未定部分标 open，绝不静默发明。
2. `engineering.md` flow 第 6 步（eng-coder 任务书）：涉及 UI 时任务文本**必须**复述已达成的 UI/交互决策（或精确指向设计文档的具体章节）——点破机理"eng-coder has NO conversation context"。
3. `engineering.md` Hard Rules 加独立条目 "UI/interaction decisions ride the full chain"——"讨论过但没落文档"是实现无视用户要求的最常见原因。
4. `eng-coder.md` Guidelines 加执行侧闭合：UI/交互严格照任务书与设计文档实现（布局/流程/控件行为/状态/反馈）；任务书与设计文档都没覆盖的界面决策 → 停下报告缺口，不自行发明交互设计。

**测试**（内容级断言英文短语，两端各验；副本未改时必须能失败）：`engineering.md` 三处条款 + `eng-coder.md` 执行闭合，见两端 `test/agent.test.mjs`（"UI/交互决策必须落设计文档且必须进 eng-coder 任务书" / "UI 按任务书与设计文档执行"组）。

**受影响文件**：`src/prompts/engineering.md`、`src/prompts/eng-coder.md`（`thincoder/` + `thincoder-vscode/` 各一份，byte-identical）。
