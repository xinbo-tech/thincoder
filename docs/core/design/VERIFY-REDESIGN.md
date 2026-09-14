# verify 通用验证门禁（VERIFY-REDESIGN）· 工具系统板块

> 板块 = **工具系统（verify 元工具）**——通用验证门禁的交互契约、判定门与双端一致。
> 本档 = verify 机制设计的**唯一权威**（契约 / 判定 / 坐标）。
> 工具契约要点 = `docs/core/design/TOOLS.md`（§6.7 verify 行 · 元工具族）；`verify` 与 coding 语境的边界 = `docs/core/design/AGENT-LOOP.md`；本档不复制其内容（D2）。
> 双端：CLI `thincoder-core/agent-tools/verify.mjs` · VSC `thincoder-vscode/src/agent-tools/verify.mjs`（同机制、各自实现）。
> 需求侧 = `docs/core/requirements/`（根层**无**对应档）；CLI 树需求档 `thincoder-cli/docs/requirements/VERIFY-REDESIGN.md` **未迁**（后续批——部分面已由 `TOOLS.md` D-V5 快路径接管）。
> 建档：2026-09-15（**B 式迁移轮 · 第 3 批**——`thincoder-cli/docs/design/VERIFY-REDESIGN.md` 内容重建入基准层；旧档原地一字不改、留作参照历史）。
> 本档坐标 = **as-of 2026-09-15 实核**（仓根 = `thincoder/`）。

## 1. 定位与问题

verify 原把**项目特定逻辑硬编码进通用工具**：

1. `MODULE_TO_TEST`——src 模块 → 测试文件的硬编码映射（本仓私有结构，任何其他项目无意义）；
2. 「改动无测试则强制拦 done」——与「测试不强制、按需加」的理念冲突；
3. `npm test` / `node --check` 自动执行——锁死 JS/npm 生态。

后果：verify 只适用于特定 JS 项目；测试文件一变映射即悬空；通用 agent 面对非 JS / 无测试项目逻辑失效或误拦。

**现行定位**：verify = **语言 / 框架 / 项目无关的完成前门禁**。它**不替模型跑任何测试/验证命令**，只对模型的**声明**做机械裁定。

## 2. 交互契约（声明式）

模型调用 verify 时**声明验证状态**（`verification` 参数，`thincoder-core/agent-tools/verify.mjs:82`–`:92`）：

```text
verification: { status: "passed" | "failed" | "skipped", command?, summary? }   // status 必填
```

- `command` / `summary` 可选；**`summary` 在 `skipped` 时为必填**（须给具体理由）。
- verify **不执行** `command`——它是模型的自述证据。
- 参数面保留 `workdir`（定位项目根 / doc-only 判定）。
- 参数面**已删** `full` / `testNamePattern` / `filter` 及其拒绝分支（无「自动跑测试」后语义消亡）。

## 3. 判定门与打回引导

| 声明 | 行为 |
|---|---|
| `passed` | 放行（结合语法结果） |
| `failed` | 打回（`_verifyPassed = false`，不能声明 done） |
| `skipped` + `summary` | 放行 |
| `skipped` 无 `summary` | 打回（空跳过不允许——防假装跑过） |
| 未声明 | 打回并要求声明 |

- **打回引导**（`thincoder-core/agent-tools/verify.mjs:62` · `:166`）：打回消息列出改动的源文件，并引导「参考项目 `AGENTS.md` 声明的验证方式决定补什么验证」——不空泛说「没验证」。
- **doc-only 快路径**：全部改动为文档 → 早退（无需验证）；**但不得吞显式 `failed`**——模型显式声明 `verification.status = "failed"` 时**恒打回**（双端同）。
- **可选语法提示**：仅改动为 `.js` / `.mjs` 且 node 存在时给 `node --check` **软提示**（**不进门禁**）。
- 另报：改动文件清单（git diff）、task 清单、自审 checklist。

## 4. 完成守卫（guard）与 goal 门禁

verify 的强制面住在完成路径，不住 verify 本体：

- **completion guard**（`thincoder-core/agent/completion.mjs:73`–`:74`）：**opt-in**（`agent.verifyGuard === true`）且**排除工程模式**（工程模式走流程驱动评审，不做逐回合机械推回）。
  - G1 未验证 → 推回提醒（`:76` · `:81`）；
  - G2 已声明但未通过 → 重试推回（`:89` · `:94`），上限 `MAX_VERIFY_RETRIES`；
  - G3 重试耗尽 → 一次性诚实声明提醒（`:100` · `:109`）。
  - 三条文案均**不称**「test failures」——`_verifyPassed === false` 可能是 failed / 无理由 skipped / 未声明（`:87`–`:88` 注释即此判据）。
- **goal 门禁**（`thincoder-core/agent-tools/goal.mjs:52`–`:54`）：本 run 改过文件却未 verify → 拒绝 complete。

## 5. 双端一致与提示词面

- **双端一致（硬要求）**：同输入同判定（通过 / 打回同结果）。VSC 侧对位：

| 面 | CLI | VSC |
|---|---|---|
| guard 首闸 | `thincoder-core/agent/completion.mjs:81` | `thincoder-vscode/src/agent/run-stages.mjs:86` |
| guard 重试 | `thincoder-core/agent/completion.mjs:94` | `thincoder-vscode/src/agent/run-stages.mjs:99` |
| guard 耗尽 | `thincoder-core/agent/completion.mjs:109` | `thincoder-vscode/src/agent/run-stages.mjs:113` |
| code-mutations 层 | `thincoder-core/agent/completion.mjs:76`（`hasCodeMutations`） | `thincoder-vscode/src/agent/run-helpers.mjs:71` |
| 打回报告 | `thincoder-core/agent-tools/verify.mjs` | `thincoder-vscode/src/agent-tools/verify.mjs:142`（`rejectionReport`） |
| goal 门禁 | `thincoder-core/agent-tools/goal.mjs:52` | `thincoder-vscode/src/agent-tools/goal.mjs:38` |

- **提示词面**：测试执行职责**已从 verify 挪回模型**——模型从项目 `AGENTS.md` 读验证方式，自决跑哪一层（L0 即时验证 / L1 项目快测试 / L2 全量），verify 三层都只**收声明**。提示词正本 = `docs/core/design/prompts/**`（本档只留机制边界，D2）。
- **测试纪律不进 verify 代码**：纪律靠 `AGENTS.md` / 提示词自然语言指导，不硬编码进工具。

## 6. 机制面（B 式迁移并入——现状路径）

### 6.1 实现坐标（as-of 2026-09-15 实核）

| 面 | 落点 | 实核 |
|---|---|---|
| 工具对象 / 描述派生 | `thincoder-core/agent-tools/verify.mjs:75`（`verifyTool`）· `:78`（description） | 在位 |
| `verification` schema | `thincoder-core/agent-tools/verify.mjs:82`–`:92` | 在位 |
| doc-only + 显式 failed 铁判 | `thincoder-core/agent-tools/verify.mjs:152`–`:167` | 注释 + 分支在位 |
| 判定门写入点 | `thincoder-core/agent-tools/verify.mjs:183` · `:226` · `:235` · `:241` · `:247` · `:253` · `:260` | 在位 |
| 未知 status 拒 | `thincoder-core/agent-tools/verify.mjs:258` | 在位 |
| guard 强制端 | `thincoder-core/agent/completion.mjs:73`–`:74`（opt-in）· `:81` · `:94` · `:109` | 在位 |
| goal 完成门 | `thincoder-core/agent-tools/goal.mjs:52` | 在位 |
| 测试 | `thincoder-cli/test/verify-redesign.test.mjs`（T-V1–V8） | 在位 |

### 6.2 用例面（现行）

| 组 | 覆盖 |
|---|---|
| T-V1–V4 | 声明四态：passed 放行 / failed 打回 / skipped+理由放行 / skipped 无理由打回 |
| T-V5 | doc-only 快路径放行 |
| T-V6 · T-V6b | 打回消息含改动文件 + 引 AGENTS.md；未声明 → 打回并要求声明 |
| T-V8 | doc-only + 显式 failed → 打回（G10 双端同） |
| VSC 对位 | VSC 侧同名测试档（端专属面 = 编辑器诊断段与可 Stop 中断执行） |

**已退场用例**：T-V9（guard 文案断言）· T-V10（提示词语义断言）——散文锚整删（见 §8.1）。

## 7. 并入的关键决策记录（含否决备选）

| # | 决策 | 理由 / 否决备选 |
|---|---|---|
| D-V1 | verify 收**声明**（`verification`），不代跑命令 | 通用 agent 不得锁死 JS/npm 生态；模型自述证据 + 机械门。否决「自动跑项目测试」 |
| D-V2 | `skipped` **须带理由** | 无理由跳过 = 假装跑过；否决「skipped 一律放行」 |
| D-V3 | 打回消息**给引导**（列改动文件 + 引 AGENTS.md） | 只说「没验证」模型无从下手；否决空泛打回 |
| D-V4 | 删 `MODULE_TO_TEST` / 模块映射 / related-tests / `npm test` 自动跑 / 无测试拦 done | 项目私有逻辑不得进通用工具（测试一变即悬空，已实证）；否决「保留但可关」 |
| D-V5 | **保留** doc-only 快路径 + 语法软提示 + task/checklist + git diff 报告 | 这些是语言无关的机械面；语法提示**不进**门禁（避免锁生态） |
| D-V6 | 双端**同输入同判定** | 门禁语义分叉会让同一模型行为在两个壳里结果不同；否决「各端各自裁定」 |
| D-V7 | 参数清理：删 `full` / `testNamePattern` / `filter`，留 `workdir` | 无自动跑测试后这些参数语义消亡；否决「留着兼容」 |
| D-V8 | doc-only 快路径**不吞**显式 declared failed | 快路径是省事通道，不是绕过模型明示失败的通道；VSC 行为为对、CLI 已对齐（G10） |

## 8. 不并项与历史沿革

### 8.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-cli/docs/design/VERIFY-REDESIGN.md`（CLI 产品档）——**原地保留作参照历史**（保留 ≠ 维护）。下列内容不并入本档：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 旧档状态行（相 1 / 相 2 交付状态 + DOC-SWEEP 核验注 + 背景注） | 时点状态行与一次性核验注 | 批次语境——现行态已入 §2–§5 |
| 旧档 §「相 2 缺口收口设计」的 G1–G14 清单 | 一次性审计编号与会话内修复流水（G5–G9 旧提示词文件清单、G14 归属注等） | 审计材料——现行约束已分别入 §4 / §5；非机制正文 |
| 旧档 T-V9 / T-V10 两行（「已退场」） | 散文锚用例退场记录 | 一次性退场材料——删除记录 = CLI 树 `docs/design/TESTING.md` §11.3（PROSE-ANCHOR-RETIRE） |
| 旧档 §5 验收行 AC1–AC5 | 一次性验收清单 | 批次材料——现行用例面入 §6.2 |
| 旧档 §「前身吸收」（`VERIFY-DOCONLY.md` 归档） | 前身档吸收流水 | 历史叙述——doc-only 机制已入 §3 |
| 旧档变更记录（五条逐批流水 + 「背景注」同步评审说明） | 2026-09-07 / 09-08 批次流水 | 历史叙述——本档自有变更记录 |

### 8.2 不并项登记（跨板块 / 一次性材料——**不并**，逐项登记）

| 旧档面 | 内容 | 何故不并（去向 / 触发） |
|---|---|---|
| 提示词文件逐条清单（旧 eng-coder / engineering-sub / system / discipline / main） | 已退役文件坐标 | **提示词面 = 产品代码**；宿主映射为现行 prompts 档——本档只留机制边界（§5） |
| guard 文案全文（三句逐字） | 提示词句子 | 提示词面——落点 = 提示词正本 / 产品代码；本档只留语义判据 |
| VSC 端专属面（编辑器诊断段、可中断执行） | 端特有实现 | 归 VSC 文档面（本批不含）——触发 = VSC 轮 |
| 需求侧正文 | CLI 树需求档 | 需求档未迁——后续批并入既有档 |

## 9. 体量与拆分规划（R24a）

**实测行数**：本档 **119 行**（根层新建 · as-of 2026-09-15 实核）——**低于 300 行软线，无需拆分规划**。

## 变更记录

- 2026-09-15（**B 式迁移轮 · 第 3 批**）：建档——`thincoder-cli/docs/design/VERIFY-REDESIGN.md` 内容重建入基准层（旧档一字未改、原地作参照历史）；坐标改写为现状路径并实核（`agent-tools/verify.mjs` · `agent/completion.mjs` · `agent-tools/goal.mjs` · VSC 对位四档）；「相 1 / 相 2」批次流水与 G 编号审计清单入 §8；同一事实只详述一处（guard 文案只留语义判据，逐字文案归提示词面）。
