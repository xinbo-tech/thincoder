# sleep 工具删除 — 设计（CLI）

> 板块：工具移除（**历史专题——已实施且已被取代**）。
> ⚠️ **历史已取代 · 建议归档 `_archive/`**：现行等待语义由 `wait_for` 工具承接（`TOOLS.md` §16）——见本文件 §4。本对文档保留为删除决策的历史记录。
> 需求：`SLEEP-REMOVAL-REQUIREMENTS.md`
> 关联：`TOOLS.md`（工具系统权威源）、`README.md`（文档地图）。
> 状态：**已实现**（2026-08-25 实施；npm 0.12.43）。

## 1. 问题陈述（历史）

- **P1 · sleep 零使用**：`sleep` 工具存在但两端会话历史 0 次真实调用——占工具表名额，浪费模型注意力。
  - 位置：`src/tools/ops.mjs`（定义）、`src/tools/index.mjs`（3 处注册）、`src/tools/sleep.md`（说明）。
- **P2 · 说明误导空等**：工具说明 "Use to wait for a web page to load, an async task to finish, or to respect a rate limit" 误导模型在同步工具（advisor/subagent）调用后 sleep 空等——这些工具返回即完成，等待毫无意义，白耗 10–300 秒。
  - 位置：`src/tools/sleep.md`。
- **P3 · 路由规则悬空**：提示词路由 "Process / time / **sleep** / tree → the dedicated tools" 指向该工具。
  - 位置：`src/prompts/discipline.md`——删除工具后规则悬空。

## 2. 删除方案（历史执行内容）

### 2.1 删除工具定义与注册

- `src/tools/ops.mjs`：删除 `// ─── sleep ───` 段与 `sleepTool` 定义；头注释 "get_current_time, sleep" → "get_current_time"。
- `src/tools/index.mjs`：3 处删除 `sleepTool`（import、re-export、builtinTools 数组）。
- `src/tools/sleep.md`：删除文件。

### 2.2 提示词路由更新

`src/prompts/discipline.md` 路由规则原文：

```md
- **Process / time / sleep / tree** → the dedicated tools (never `tasklist`/`ps`/`date`/`tree` via bash).
```

改为（等待允许走 bash）：

```md
- **Process / time / tree** → the dedicated tools (never `tasklist`/`ps`/`date`/`tree` via bash); waiting (e.g. `sleep`/`timeout`) is fine via bash when truly needed.
```

### 2.3 内部等待保留（FR3）

`src/provider/rate.mjs` `_rateHooks.sleep`（速率门控）、`src/provider/core.mjs`（重试退避）、`src/embedding.mjs`（embedding 重试）——全部为**代码内部函数**，模型不可见、不注册为工具，**不受影响**。

### 2.4 测试更新

删除 `test/tools.test.mjs` 中 sleep 用例部分（get_current_time / process 用例保留）；可选新增 "builtinTools 不含 sleep" 断言。

## 3. 实现落点（核销参考，历史）

- `src/tools/ops.mjs`：删除 `sleepTool` 定义、头注释更新。
- `src/tools/index.mjs`：3 处删除 `sleepTool` 引用。
- `src/tools/sleep.md`：删除说明文件。
- `src/prompts/discipline.md`：路由规则移除 sleep，等待允许走 bash。
- `docs/design/TOOLS.md`：工具注册表散文 "ops 4（file_ops/process/get_current_time/sleep）" → "ops 3（…）"。
- `test/tools.test.mjs`：删除 sleep 测试部分。

## 4. 取代路径（现行——2026-09-06 起）

`sleep` 删除留下的"回合内等待异步事件"真空由 `wait_for` 工具填补（权威：`TOOLS.md` §16，`src/tools/ops.mjs` `waitForTool`）。现行工具表 = `file_ops / process / get_current_time / wait_for`。

wait_for 相比 sleep 的关键差异：

- **条件语义化**：非裸 sleep——只等在语义条件上，轮询直至满足/超时。
- **内置有界 timeout**：默认 30s、cap 600s，可配置 `agent.waitForTimeoutMs`——替代无界 sleep-then-wait。
- **未知条件显式报错**，不静默等待。

`docs/design/TOOLS.md` 已记 "sleep 已删——见 wait_for"。

## 变更记录

- 2026-08-25：实施删除（npm 0.12.43）。
- 2026-09-06：`wait_for` 工具引入（TOOLS.md §16）——本删除文档转历史。
- 2026-09-07：文档重写为人类可读（批 A），标历史已取代建议归档。
