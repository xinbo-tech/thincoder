# sleep 工具删除 — 设计（CLI）

> 状态：待评审（2026-08-25）
> 需求：`docs/design/SLEEP-REMOVAL-REQUIREMENTS.md`
> 关联：`docs/design/README.md`（文档地图）

## 1. 问题陈述（Problem Statement）

| # | 现状 | 位置 | 后果 |
|---|---|---|---|
| P1 | `sleep` 工具存在但零真实使用（两端会话历史 0 次模型调用） | `src/tools/ops.mjs:116-140`（定义）、`src/tools/index.mjs`（3 处注册）、`src/tools/sleep.md`（说明） | 占工具表名额，浪费模型注意力 |
| P2 | 工具说明 "Use to wait for a web page to load, **an async task to finish**, or to respect a rate limit" 误导模型 | `src/tools/sleep.md` | 模型在同步工具（advisor/subagent）调用后 sleep 空等——这些工具返回即完成，等待毫无意义，白耗 10-300 秒 |
| P3 | 提示词路由规则 "Process / time / **sleep** / tree → the dedicated tools" 指向该工具 | `src/prompts/discipline.md:28` | 删除工具后规则悬空指向不存在的工具 |

## 2. 解决方案（Solution Approach）

### 2.1 删除工具定义与注册（P1）

- `src/tools/ops.mjs:116-140`：删除 `// ─── sleep ───` 段与 `sleepTool` 定义。
- `src/tools/index.mjs`：3 处删除 `sleepTool`（`:13` import、`:22` re-export、`:32` builtinTools 数组）。
- `src/tools/sleep.md`：删除文件。
- `src/tools/ops.mjs:3` 头注释 "get_current_time, sleep" → "get_current_time"。

### 2.2 提示词路由更新（P3）

`src/prompts/discipline.md:28`：

```md
- **Process / time / sleep / tree** → the dedicated tools (never `tasklist`/`ps`/`date`/`tree` via bash).
```
改为：
```md
- **Process / time / tree** → the dedicated tools (never `tasklist`/`ps`/`date`/`tree` via bash); waiting (e.g. `sleep`/`timeout`) is fine via bash when truly needed.
```

### 2.3 内部等待保留（FR3）

- `src/provider/rate.mjs:18` `_rateHooks.sleep`（速率门控）、`src/provider/core.mjs:125/295/348`（重试退避）、`src/embedding.mjs:76/118`（embedding 重试）——全部是**代码内部函数**，模型不可见、不注册为工具，**不受影响**。

### 2.4 测试更新（N4）

- `test/tools.test.mjs:1742-1751`：删除 `get_current_time / sleep / process: basic behavior` 中 sleep 部分（get_current_time/process 用例保留）；如用例合并，拆分为不含 sleep 的断言。
- 可选：新增"builtinTools 不含 sleep"断言（如 `assert.ok(!byName.has("sleep"))`，对齐 index.mjs 注册验证）。

## 3. 受影响文件（Affected Files）

| 文件 | 动作 | 内容 |
|---|---|---|
| `src/tools/ops.mjs` | MODIFY | 删除 sleepTool 定义（`:116-140`）；头注释更新 |
| `src/tools/index.mjs` | MODIFY | 3 处删除 sleepTool 引用（`:13`/`:22`/`:32`） |
| `src/tools/sleep.md` | DELETE | 删除说明文件 |
| `src/prompts/discipline.md` | MODIFY | `:28` 路由规则移除 sleep，等待允许走 bash |
| `docs/design/TOOLS.md` | MODIFY | `:7` 工具注册表散文 "ops 4（file_ops/process/get_current_time/sleep）" → "ops 3（file_ops/process/get_current_time）"（评审 #9） |
| `test/tools.test.mjs` | MODIFY | 删除 sleep 测试部分；可选新增无 sleep 断言 |

## 4. 验收标准（Acceptance Criteria）

| # | AC | 验证方式 |
|---|---|---|
| AC1 | 模型工具表无 `sleep`：builtinTools 无 sleepTool | 单元测试/代码审查 |
| AC2 | `src/` 无 sleepTool 引用残留 | grep "sleepTool" src/ 无匹配 |
| AC3 | `discipline.md` 不再指向 sleep 工具（无 "sleep → dedicated tools"） | grep 验证 |
| AC4 | 内部等待逻辑保留：`_rateHooks.sleep` 存在且测试通过（速率/重试相关现有测试不回归） | 现有测试 |
| AC6 | docs 散文无 sleep 工具残留：`docs/design/TOOLS.md` 不含 "ops 4（...sleep" 表述；`PROVIDER.md` 的 sleep 为内部机制描述，保留（评审 #9） | grep 验证 |
| AC5 | `node --test test/*.test.mjs` 全套通过 | 命令 |
