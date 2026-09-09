# VSC A2 摘要对齐 CLI（A2-SUMMARY-PARITY）

> 板块：评审收敛（eng-coder audit A2 摘要——VSC 对齐 CLI）。权威源：CLI subagent-spawn.mjs summarizeEngTaskBook（:37-73——inline 兜底实现）。
> 状态：**设计待评审**——2026-09-09 落档（代码正确性核实一手——双端分叉定位 + 用户裁 A 对齐 CLI）。需求：TODO L26（agent A2 摘要触发条件——仅 ## 节标题——双端分叉）。

---

## 需求

- **总体目标**：A2 摘要双端对齐 CLI——VSC summarizeEngTaskInput 补 inline 兜底（无 `##` 节标题的任务书也触发摘要——CLI inline 标记全行兜底语义）——用户裁 A。
- **功能性**：
  - F-1 VSC summarizeEngTaskInput（subagent-async.mjs:78-93）对齐 CLI summarizeEngTaskBook（subagent-spawn.mjs:37-73）：`##` 头定位优先 + 无头时 inline 标记全行兜底 + marker 缺失 → "(not found)" 不编造
  - F-2 双端同构（A2 摘要逻辑逐字一致——CLI 现实现为基准）
  - **范围边界**：CLI 零改动（现实现是基准）；VSC auditTaskBook 触发路径（A1 指令/A3 报告）零触碰；A2 目标语义 = 对齐 CLI（用户裁）。

## 设计（对齐 CLI——照 CLI 实现逐字镜像——VSC 侧单文件改）

### 对齐面（CLI → VSC）
CLI summarizeEngTaskBook（subagent-spawn.mjs:37-73）行为：
1. `##` 节标题定位优先——命中则摘要各节
2. 无 `##` 头 → **inline 标记全行兜底**（:64-67 "flat one-line task books"——按 inline 标记行摘）
3. marker 缺失 → `"(not found)"`（:68——不编造）

VSC summarizeEngTaskInput（subagent-async.mjs:78-93）现状：
- 只认 `^##[ \t]+` 头（headingRe :80）——h1/h3-h6 及无头全不认
- 无头或保留节 <2 → 整书 verbatim 返回（:83/:91——摘要不触发）

改：VSC 补 inline 兜底分支（无 ## → 按 CLI inline 标记全行逻辑摘）——保留节 <2 的 verbatim 回退是否保留按 CLI 语义对齐（CLI 无 verbatim 整书回退——最小保留节摘——实现期按 CLI 逐字核）——headingRe 同 CLI 头匹配

### 连带
- VSC subagent-async.mjs 头注释（isomorphic 声明——对齐后成真）
- 测试：A2 摘要——无 ## flat 任务书也触发摘要（CLI inline 兜底形态断言）+ 有 ## 正常摘 + marker 缺失 "(not found)"——VSC 测试（CLI 已有？——核——无则双端补）

## 受影响文件（VSC 单仓——CLI 零改动）

| 文件 | 改动 | 行数 |
|---|---|---|
| src/agent-tools/subagent-async.mjs:78-93 | summarizeEngTaskInput inline 兜底对齐 CLI | ~420 现（+~8——评审 #1 实测） |
| test/（A2 摘要测试） | 新——对齐面断言 | 新 ~60 |
| docs/design/AGENT-LOOP.md | isomorphic 声明同步（如涉及） | doc |

## 验收

- AC-1 无 ## flat 任务书 VSC 也触发摘要（inline 兜底——对齐 CLI 形态——测试锁）
- AC-2 有 ## 正常摘要（不回归）+ marker 缺失 "(not found)"（不编造）
- AC-3 双端同构（CLI/VSC 摘要逻辑逐字一致——diff 核）
- AC-4 测试绿（A2 摘要测试 + 既有——VSC npm test 快层）
- AC 红线：CLI 零改动 + A1 指令/A3 报告模板零触碰 + 行为边界（不编造 marker）保留

## 变更记录
- 2026-09-09：L26 落档（核实一手——双端分叉：CLI inline 兜底 vs VSC 仅 ## + verbatim——用户裁 A 对齐 CLI——VSC 补兜底）。
