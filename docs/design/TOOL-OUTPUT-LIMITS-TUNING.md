# 工具输出长度限制调整 — 设计（CLI）

> 状态：待评审（2026-08-24）
> 需求：`docs/design/TOOL-OUTPUT-LIMITS-REQUIREMENTS.md`
> 关联：`docs/design/README.md`（文档地图）

## 1. 问题陈述（Problem Statement）

| # | 现状 | 位置 | 后果 |
|---|---|---|---|
| P1 | 工具输出 >16K 即落盘（阈值 `TOOL_RESULT_OFFLOAD_LIMIT = 16_000`） | `src/agent/helpers.mjs:23`，调用点 `src/agent/dispatch.mjs:176`（所有非 read_image 工具结果） | advisor 评审输出、大文件读取、grep 大仓库等常见场景频繁落盘，模型被迫 read 文件才能看全 |
| P2 | 落盘后内联 preview 仅 2K（`TOOL_RESULT_PREVIEW = 2_000`） | `src/agent/helpers.mjs:24` | 模型在上下文里只能看到前 2K + 路径，无法判断是否需要 read 全文 |
| P3 | advisor 评审循环内工具结果 12K 即截断（`MAX_RESULT_CHARS = 12_000`，line-aware） | `src/advisor/run.mjs:33`，截断点 `:284-301` | advisor 读文件/grep 的结果被 12K 截断（比主链路 16K 更紧），评审可能基于不完整证据 |

## 2. 解决方案（Solution Approach）

统一阈值与 preview：`64 * 1024 = 65536`（与 VS Code webview `MAX_TOOL_OUTPUT = 64 * 1024` 完全一致，N1）。

### 2.1 落盘阈值与 preview（P1/P2）

`src/agent/helpers.mjs:23-24`：

```js
const TOOL_RESULT_OFFLOAD_LIMIT = 64 * 1024 // 65536 chars — offload only above 64K (2026-08-24)
const TOOL_RESULT_PREVIEW = 64 * 1024 // chars shown inline when offloaded (aligns with CLI/VS Code webview)
```

- 落盘路径/格式不变：`cleanupOldToolResults`（写时自清理，TMP_RETENTION_MS 3 天）→ `mkdir` → `writeFile` → 返回 `preview + "\n\n[... output too large (N chars total), full content saved to: PATH ...]"`。
- 失败回退截断 `text.slice(0, TOOL_RESULT_OFFLOAD_LIMIT)` 自动跟随新阈值（无需单独改）。
- 主循环上下文成本：preview 放大后每次落盘结果最多 64K 进模型上下文，由既有 compaction 机制兜底（评审 #8，与 advisor 侧 compactMessages 同构）。
- preview = 阈值：≤64K 不落盘直接全文进上下文；>64K 落盘并内联前 64K——模型在任何情况下都能看到前 64K，与 webview 显示上限一致。

### 2.2 advisor 内部截断（P3）

`src/advisor/run.mjs:33`：

```js
const MAX_RESULT_CHARS = 64 * 1024 // tool result truncation (line-aware; 64K, aligned with main offload limit)
```

- 截断逻辑（line-aware 保留完整行）不变，仅上限变化。
- 注：advisor 上下文保护已有 `compactMessages`（120K 上限、保留最近 20 条 + system），放宽后由该机制兜底，不新增风险。

### 2.3 测试更新（N3，关键连带）

现有测试用 20_000 字符触发落盘——64K 阈值下 20K 不再落盘，**断言全部失效**，必须同步改：

| 测试 | 现状 | 改动 |
|---|---|---|
| `test/agent.test.mjs:1761`（runAgent 落盘 e2e） | `"X".repeat(20_000)`，断言预览 `< 5000`、磁盘 20_000 | 输入改 `70_000`；断言磁盘 70_000；**预览断言改为 `<= 65536`（preview 放大后不再 <5000）**；新增 `65_536` 恰好不落盘、`65_537` 落盘的边界用例 |
| `test/agent.test.mjs:1819/1844/1855`（offload 单测） | `20_000` | 输入改 `70_000`；磁盘断言 70_000；`:1827` `out.length < 5000` 断言改为 `<= 65536 + 路径开销`（或删除该断言，路径长度已由 match 断言覆盖） |
| `test/advisor.test.mjs` | — | 新增 MAX_RESULT_CHARS 常量断言 = 65536（**必做**，评审 #2）；行为用例可选 |
| `test/agent.test.mjs`（新增用例） | — | 落盘失败回退路径：mock 落盘失败（只读目录/注入失败），断言回退截断长度 = 65536（评审 #6） |

## 3. 受影响文件（Affected Files）

| 文件 | 动作 | 内容 |
|---|---|---|
| `src/agent/helpers.mjs` | MODIFY | `:23-24` 阈值与 preview → `64 * 1024`；注释同步 |
| `src/advisor/run.mjs` | MODIFY | `:33` `MAX_RESULT_CHARS` → `64 * 1024` |
| `test/agent.test.mjs` | MODIFY | 4 处 20_000 输入 → 70_000；预览断言放宽；新增 65536/65537 边界用例 |
| `test/advisor.test.mjs` | MODIFY | 新增 advisor 截断阈值用例（可选） |

## 4. 验收标准（Acceptance Criteria）

| # | AC | 验证方式 |
|---|---|---|
| AC1 | ≤65536 字符的工具结果不落盘，原样进上下文 | 单元测试：`offloadToolResult("x".repeat(65_536), …)` 返回原文（=== 输入） |
| AC2 | 65537+ 字符落盘，返回 preview + 路径，磁盘全量 | 单元测试：`"x".repeat(65_537)` → 匹配 `full content saved to:`，磁盘长度 65_537，内联 preview 长度 ≤ 65536 + 路径开销 |
| AC3 | 落盘 preview 放大到 64K（原 2K） | 单元测试：内联返回长度 > 20000（旧限制会被截到 2K） |
| AC4 | advisor `MAX_RESULT_CHARS` = 65536 | 常量断言或行为用例 |
| AC5 | 落盘格式与清理逻辑不变 | 现有 offload 测试（清理/保留/目录缺失）全部通过（输入改 70_000 后） |
| AC6 | `node --test test/*.test.mjs` 全套通过 | 命令 |
| AC7 | `src/` 无 `16_000`/`2_000`/`12_000`（工具输出相关）残留 | grep 验证（注意区分其他业务常量；12_000 为 advisor 截断，评审 #3） |
