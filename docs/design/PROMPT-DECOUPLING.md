# 提示词架构解耦：工程模式与普通模式完全独立

> 状态：**已实现**（工程模式顶层 = system.md + engineering.md + METHODOLOGY.md，不注入 main.md/discipline.md；TODO.md「setup.mjs 提示词解耦」已勾销）。下文保留原始设计陈述。
> 关联：`src/agent/setup.mjs`、`src/prompts/*.md`、`docs/design/ENGINEERING-MODE.md`

## 问题陈述

工程模式与普通模式的提示词存在**共享基础 + 补丁覆盖**架构，导致两类问题：

1. **规则互相泄漏**：
   - `main.md`（主代理 overlay："You are the lead engineer... do precision edits yourself"）在两种模式下都注入——与工程模式"Designer, not Implementer"角色直接冲突；当前靠 engineering.md 里的 override 声明打补丁。
   - `discipline.md`（"Calling advisor is mandatory... The run cannot finish until advisor has reviewed"）在 METHODOLOGY.md 缺失的降级路径下会 fallback 注入工程模式——诱导模型在工程模式下频繁调用 advisor（本会话实证：连续 6 次 aborted 仍重试）。
2. **改动互相牵扯**：修改 discipline.md 影响普通模式；修改 engineering.md 又要为 main.md 的冲突打补丁。一处改动波及两套模式，回归风险高。

## 解决方案

工程模式顶层提示词**完全独立**，只与普通模式共享纯通用基础（system.md）：

| 模式 | 顶层提示词组装 |
|---|---|
| 普通模式（现状不变） | `system.md + discipline.md + main.md + AGENTS.md` |
| 工程模式（改造后） | `system.md + engineering.md + METHODOLOGY.md + AGENTS.md`（**不注入 main.md、不注入 discipline.md**） |
| eng-coder 子代理 | `eng-coder.md + engineering-sub.md + METHODOLOGY.md + AGENTS.md`（现状，已独立） |

### 具体改动

1. **`src/agent/setup.mjs`**
   - overlay 逻辑：`depth === 0 && !engineering` 时才附加 `mainOverlay`——工程模式顶层不再注入 main.md。
   - 降级路径：`buildEngineeringPrompt` 在 METHODOLOGY.md 缺失时**不再返回 null**，改为返回工程模板本身（工程约束仍生效，仅缺项目规则）；setup 不再 fallback 到 discipline，改为注入警告消息（现有逻辑保留）。
   - 删除 discipline fallback 分支（工程模式永不注入 discipline.md）。

2. **`src/prompts/engineering.md`**
   - 删除 "The 'lead engineer / do precision edits yourself' guidance from the main overlay does NOT apply..." 段（main.md 不再注入，补丁不再需要）。
   - 补充 code review 后的**响应表纪律**（原 discipline.md 提供，工程模式独立后需自带）：
     - advisor 发现问题时产生 `| # | Action | Detail |` 响应表
   - **评审时机（Review Timing）**——工程模式的核心行为约束（2026-08-24 修订：发起权归用户）：
     - **设计评审仅由用户发起**：agent 呈递设计就绪并提醒，用户发话才调 advisor；打回后每轮呈递发现+修复建议、用户逐条拍板再改（agent 不自行修完重送）。
     - **交付 code review 自动**：eng-coder 返回后评审**一次**（流程节点，不问用户）；评审通过后不重复调用。
     - **失败出口**：advisor 工具失败/中断时**停止重试**，向用户报告原因，继续其他工作。
   - **对话决策落盘（Docs capture the conversation）**：用户在设计讨论/评审中提出的决策、约束、偏好，**当轮就更新相关文档**（设计文档、METHODOLOGY.md、ENGINEERING-MODE.md），不等人点名——"没进文档的决策等于没落地"。写入 METHODOLOGY.md（工程模式注入的方法论）与 engineering.md 自身；**不修改普通模式的 discipline.md**——两套提示词互不牵扯。

3. **测试（`test/agent.test.mjs`）**
   - 新增：工程模式顶层 system prompt 不含 main.md 的 "lead engineer" 条款、不含 discipline 的 advisor 强制条款；含 "ENGINEERING MODE"。
   - 新增：METHODOLOGY.md 缺失时工程模式 prompt 仍为工程模板（非 discipline），并注入警告。
   - 现有普通模式 prompt 分层测试不受影响。

## 受影响文件

| 文件 | 动作 |
|---|---|
| `src/agent/setup.mjs` | 修改（overlay 条件、降级路径、buildEngineeringPrompt） |
| `src/prompts/engineering.md` | 修改（删 override 段、补响应表纪律与评审时机；2026-08-24 修订为发起权归用户） |
| `test/agent.test.mjs` | 修改（新增 2 个工程模式 prompt 断言测试） |
| `docs/design/ENGINEERING-MODE.md` | 修改（提示词组装表同步） |
| `docs/design/PROMPT-DECOUPLING.md` | 新建（本文档） |

不涉及：`src/prompts/discipline.md`（普通模式纪律，保持不动）、`src/prompts/main.md`（普通模式专属，保持不动）、`src/prompts/system.md`（纯通用基础，两模式共用）、`METHODOLOGY.md`（项目方法论，工程模式专用）。

## 验收标准

1. 工程模式（engineering=true）顶层 system prompt 包含 `ENGINEERING MODE` 与 METHODOLOGY.md 内容；**不包含** "lead engineer"、discipline 的 "Calling advisor is mandatory" 条款。
2. 普通模式（engineering=false）顶层 system prompt 与现状完全一致（含 main overlay 与 discipline）。
3. METHODOLOGY.md 缺失时：工程模式仍为工程模板 + 警告消息，不出现 discipline 内容。
4. `node --test test\*.test.mjs` 全套通过。

---

## 变更段：搜索工具优先级条款（2026-09-02，用户问题 Q5）

> **状态：已实现**（2026-09-02 交付：discipline.md / engineering.md 条款落地，两端 prompts byte-identical，T1/T4 断言锁定措辞；TODO.md Q5 由架构师勾销）。用户裁定："提示词里应该引导一下 websearch 只做备用，有 MCP 搜索服务的时候要用 MCP"。

**问题**：discipline.md:72-73 工具表已标注 `websearch` = "weak for technical; MCP search tool first"、`glm-websearch_web_search_prime` = "primary when available"——但**只是表格罗列，非强制规则**。模型可能直接先跑 websearch（Bing 弱且噪音多），MCP 搜索（glm-websearch 等）闲置。教训案例（2026-08-31）：Bing 连续返回无关结果硬抓官方文档 URL 耗七八轮，切 glm-websearch 一发命中——需把该教训提升为正式提示词行为条款。

**设计**：

- **D-P1 discipline.md 新增"搜索工具优先级"行为规则**（普通模式——工程模式顶层不含 discipline；**工程模式注入面定死（评审 #5 修订）：同条款进 `src/prompts/engineering.md`**——规则是工具行为引导，两模式都用工具，不能只在普通模式生效；eng-coder 子代理走 eng-coder.md + engineering-sub.md，搜索条款随子代理提示词由其上游纪律覆盖，不在本变更段重复）：
  - **有 MCP 搜索工具（`*_web_search*` / `*_search_prime` 等）→ 搜索前先查工具表，MCP 优先**——技术查证/通用搜索一律先用 MCP 搜索；websearch（Bing）仅在其不可用（工具未配置/调用失败）时兜底。
  - **websearch 连续 2 次返回垃圾/无关结果 → 立即切 MCP 搜索或换路径**（不恋战、不重复同 query）。
  - **被墙/抓不到站点（docs.claude.com / ai.google.dev 等）→ 优先镜像路径（gh-proxy.com 抓 GitHub SDK 源码/类型定义），不硬猜官方文档 URL**。
  - **动手抓页面前先扫工具表**（"我是不是有现成工具"的自查——fetch/glm-websearch 优先于 curl）。
- **D-P2 system.md 同步**（普通模式 + 工程模式共享基础）：在"search for information"类指引中补一行"MCP search tools first; websearch is fallback"（若 system.md 已有搜索指引则并入；无则只在 discipline/engineering 加——实现时确认，避免重复）。**实现结果：system.md 无 web 搜索指引（仅"Codebase exploration order"本地代码探索顺序），按设计不加行，条款只落 discipline.md / engineering.md。**
- **D-P3 两端一致**：thincoder-vscode 的 src/prompts 与 CLI byte-identical（既有纪律）——VS Code 端口随两端 prompts 同步测试自动覆盖；本设计仅改 CLI 端 prompt 文件（VS Code 端镜像由既有 parity 流程带出，不单独列）。

**受影响文件**：`src/prompts/discipline.md` ✅（条款落地）、`src/prompts/engineering.md` ✅（同条款——评审 #5 定死）、（+可选 system.md 一行 —— D-P2 判定不加）、两端 prompts 比对测试 ✅（既有，全绿）、`test/agent.test.mjs` ✅（T1+T4 断言新增）、`docs/design/PROMPT-DECOUPLING.md` ✅（本节）、`CHANGELOG.md`（由架构师统一更新，本次未动）。

**测试**：

| # | 场景 | 预期 | 映射 | 结果 |
|---|---|---|---|---|
| T1 | discipline.md 含优先级条款 | 断言文本含"MCP 优先/websearch 备用"语义句（具体措辞实现时定，测试锁措辞） | D-P1 | ✅ 通过（锁措辞：MCP search tools / PRIMARY for technical / is ONLY the fallback / twice in a row / repeat the same query / mirror path / scan the tool table） |
| T2 | 两端 prompts byte-identical | 既有 parity 测试全绿（若 system.md 改动） | D-P3 | ✅ 通过（15 文件逐字节比对全绿） |
| T3 | 既有 prompt 断言回归 | agent.test.mjs prompt 分层测试全绿 | — | ✅ 通过（CLI 全量回归绿） |
| T4 | engineering.md 含优先级条款（评审 #5 新增） | 断言工程模式顶层 prompt（system.md + engineering.md 组装）含同语义句——工程模式与普通模式同规则 | D-P1 | ✅ 通过（测试按 setup.mjs:254 纯拼接组装后断言） |

**验收**：AC1 ✅ = 提示词明确"有 MCP 搜索先用 MCP、websearch 仅备用"（**普通模式 + 工程模式均含**——T1/T4）；AC2 ✅ = 两端 prompts 一致（parity 测试绿）；AC3 ✅ = CLI 全量 + lint 绿。

**关键决策**：① 条款落 discipline.md（普通模式行为规则所在地）而非单独文件——遵守文档地图"功能点并入所属板块"；② 措辞用行为规则（何时先用/何时切换）而非工具描述扩展——工具表已标注优先级，缺的是**行为引导**；③ 不新增工具、不改 websearch 实现（工具本身不动，只改引导）。

