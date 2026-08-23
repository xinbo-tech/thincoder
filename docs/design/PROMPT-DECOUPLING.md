# 提示词架构解耦：工程模式与普通模式完全独立

> 状态：设计（待 design review）
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
