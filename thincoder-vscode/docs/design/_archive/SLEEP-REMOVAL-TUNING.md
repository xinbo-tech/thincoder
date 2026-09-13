# sleep 工具删除 — 设计（VS Code 扩展） > 状态：**已实现**（2026-08-25 评审修订后实施；Open VSX/Marketplace 0.1.49）
> 需求：`docs/design/SLEEP-REMOVAL-REQUIREMENTS.md`
> 关联：`docs/design/README.md`（文档地图）
> 说明：与 CLI 端 `SLEEP-REMOVAL-TUNING.md` 同源（两端语义一致，各自文件清单独立——文档地图惯例） ## 1. 问题陈述（Problem Statement） | # | 现状 | 位置 | 后果 |
|---|---|---|---|
| P1 | `sleep` 工具存在但零真实使用（两端会话历史 0 次模型调用） | `src/tools/ops.mjs:125-150`（定义）、`src/tools/index.mjs`（3 处注册） | 占工具表名额，浪费模型注意力 |
| P2 | 工具说明 "Use to wait for a web page / **async task** / rate limit — cheaper than repeatedly polling" 误导模型 | `src/tools/ops.mjs:128-132`（硬编码描述） | 模型在同步工具（advisor/subagent）调用后 sleep 空等——这些工具返回即完成，等待毫无意义，白耗 10-300 秒 |
| P3 | 提示词路由规则 "Process / time / **sleep** / tree → the dedicated tools" 指向该工具 | `src/prompts/discipline.md:28` | 删除工具后规则悬空指向不存在的工具 | ## 2. 解决方案（Solution Approach） ### 2.1 删除工具定义与注册（P1） - `src/tools/ops.mjs:125-150`：删除 `// ─── sleep ───` 段与 `sleepTool` 定义。
- `src/tools/index.mjs`：3 处删除 `sleepTool`（`:22` import、`:41` re-export、`:57` builtinTools 数组）。
- `src/tools/ops.mjs:3` 头注释 "get_current_time, sleep" → "get_current_time"。 ### 2.2 提示词路由更新（P3） `src/prompts/discipline.md:28`： ```md
- **Process / time / sleep / tree** → the dedicated tools (never `tasklist`/`ps`/`date`/`tree` via bash).
```
改为：
```md
- **Process / time / tree** → the dedicated tools (never `tasklist`/`ps`/`date`/`tree` via bash); waiting (e.g. `sleep`/`timeout`) is fine via bash when truly needed.
``` ### 2.3 内部等待保留（FR3） - `src/provider/rate.mjs:18/23-27`（`_rateHooks.sleep`、`abortableSleep`）、`src/embedding.mjs:60/100`（embedding 重试）——全部是**代码内部函数**，模型不可见、不注册为工具，**不受影响**。
- 注意：vscode 端 `src/provider/rate.mjs` 的 `abortableSleep` 是 abort-aware 内部等待，与工具无关，保留。 ### 2.4 测试更新（N4） - `test/tools.test.mjs:663-669`：删除 `get_current_time / sleep / process behave` 中 sleep 部分（get_current_time/process 断言保留）；如用例合并，拆分为不含 sleep 的断言。
- 可选：新增"builtinTools 不含 sleep"断言（如 `assert.ok(!byName.has("sleep"))`，对齐 index.mjs 注册验证）。 ## 3. 受影响文件（Affected Files） | 文件 | 动作 | 内容 |
|---|---|---|
| `src/tools/ops.mjs` | MODIFY | 删除 sleepTool 定义（`:125-150`）；头注释更新 |
| `src/tools/index.mjs` | MODIFY | 3 处删除 sleepTool 引用（`:22`/`:41`/`:57`） |
| `src/prompts/discipline.md` | MODIFY | `:28` 路由规则移除 sleep，等待允许走 bash |
| `test/tools.test.mjs` | MODIFY | 删除 sleep 测试部分；可选新增无 sleep 断言 | ## 4. 验收标准（Acceptance Criteria） | # | AC | 验证方式 |
|---|---|---|
| AC1 | 模型工具表无 `sleep`：builtinTools 无 sleepTool | 单元测试/代码审查 |
| AC2 | `src/` 无 sleepTool 引用残留 | grep "sleepTool" src/ 无匹配 |
| AC3 | `discipline.md` 不再指向 sleep 工具（无 "sleep → dedicated tools"） | grep 验证 |
| AC4 | 内部等待逻辑保留：`_rateHooks.sleep`/`abortableSleep` 存在且测试通过（速率/重试相关现有测试不回归） | 现有测试 |
| AC6 | docs 散文无 sleep 工具残留：本仓库 docs/ 无 sleep 工具散文提及（已核实，评审 #9） | grep 验证 |
| AC5 | `npm test` 全套通过 | 命令 |
