# 工具输出长度限制调整 — 设计（VS Code 扩展）

> 状态：**已实现**（2026-08-24 评审修订后实施；Open VSX/Marketplace 0.1.49）
> 需求：`docs/design/TOOL-OUTPUT-LIMITS-REQUIREMENTS.md`
> 关联：`docs/design/README.md`（文档地图）、`docs/design/SETTINGS-PANEL-2.md`
> 说明：与 CLI 端 `TOOL-OUTPUT-LIMITS-TUNING.md` 同源（两端语义一致，各自文件清单独立——文档地图惯例）

## 1. 问题陈述（Problem Statement）

| # | 现状 | 位置 | 后果 |
|---|---|---|---|
| P1 | 工具输出 >16K 即落盘（`MAX_TOOL_RESULT = 16000`） | `src/agent/run-helpers.mjs:63`，调用点 `src/agent/execute-tools.mjs:165` | advisor 评审输出、大文件读取等常见场景频繁落盘，模型被迫 read 文件才能看全 |
| P2 | 落盘后内联 preview 仅 2K（`TOOL_RESULT_PREVIEW = 2000`） | `src/agent/run-helpers.mjs:64` | 模型只能看到前 2K + 路径 |
| P3 | advisor 评审循环内工具结果 12K 即截断（`MAX_RESULT_CHARS = 12_000`，line-aware） | `src/advisor/run.mjs:34`，截断点 `:284-301` | advisor 基于不完整证据评审（比主链路 16K 更紧） |
| P4 | 实时显示截断 20K（`onToolResult` 发 webview 前 `slice(0, 20000)`） | `src/extension/panel-chat.mjs:156` | 即使落盘阈值放宽，面板上看到的仍是 20K 截断，与上下文不一致 |
| P5 | 历史页工具卡截断 2K（`sendHistoryPage` 里 `slice(0, 2000)`） | `src/extension/panel-session.mjs:87` | 回看历史时工具输出只剩前 2K |

## 2. 解决方案（Solution Approach）

统一阈值与 preview：`64 * 1024 = 65536`（与现有 `webview/lib.js:27` `MAX_TOOL_OUTPUT = 64 * 1024` 完全一致，N1）。

### 2.1 落盘阈值与 preview（P1/P2）

`src/agent/run-helpers.mjs:63-64`：

```js
export const MAX_TOOL_RESULT = 64 * 1024 // chars — large results saved to disk instead of truncated (aligns with CLI)
export const TOOL_RESULT_PREVIEW_HEAD = 16 * 1024 // head slice preserved (2026-09-04 §5 双端预览)
export const TOOL_RESULT_PREVIEW_TAIL = 48 * 1024 // nominal tail bound — actual tail = 65536 − head − noteLen
```

> **supersede 注（2026-09-04 §5）**：旧单常量 `TOOL_RESULT_PREVIEW` 已随 §5 双端预览实现删除（run-helpers.mjs —— `buildHeadTailPreview`/`safeSliceUTF16Tail`）——预览构成 = 头 16K + 中间省略注 + 尾（总 ≤ 65536）；回退路径同用双端切片（T-4.4——CLI/VS Code 两端同步）。

- 落盘路径/格式不变：`<cwd>/.thincoder/tmp/` 写时自清理（TMP_RETENTION_MS 3 天）→ `tool-<id>.txt` → 返回 `[Large output saved. ...] + preview`。
- 失败回退截断 `text.slice(0, MAX_TOOL_RESULT)` 自动跟随新阈值。
- 主循环上下文成本：preview 放大后每次落盘结果最多 64K 进模型上下文，由既有 compaction 机制兜底（评审 #8，与 advisor 侧 compactMessages 同构）。
- preview = 阈值：≤64K 不落盘直接全文进上下文；>64K 落盘并内联前 64K。

### 2.2 advisor 内部截断（P3）

`src/advisor/run.mjs:34`：

```js
const MAX_RESULT_CHARS = 64 * 1024 // tool result truncation (line-aware; 64K, aligned with main offload limit)
```

- line-aware 截断逻辑不变，仅上限变化；advisor 上下文由既有 compactMessages 机制兜底。

### 2.3 实时显示（P4）

`src/extension/panel-chat.mjs:156`：

```js
const text = (r || "").slice(0, 64 * 1024)
```

- webview 侧 `finishToolCard` → `capText(text)`（`webview/lib.js:30`，上限 `MAX_TOOL_OUTPUT = 64*1024`）正好承接——实时链路两端一致，无新截断点。

### 2.4 历史页工具卡（P5）

`src/extension/panel-session.mjs:87`（`sendHistoryPage`）：

```js
if (m.kind === "tool") return { ...m, text: m.text.slice(0, 64 * 1024) }
```

- 历史懒加载分页机制不变，仅单卡上限放宽。

### 2.5 测试更新（N3，关键连带）

| 测试 | 现状 | 改动 |
|---|---|---|
| `test/run-helpers.test.mjs:29/54/64` | `"x".repeat(20_000)` 触发落盘 | 输入改 `70_000`；磁盘断言 70_000；`:31` `out.length < 5000` 断言改为 `<= 65536 + 路径开销`（preview 放大） |
| `test/agent.test.mjs:404` | 工具结果 `"y".repeat(20_000)`（上下文相关测试） | **实现开始时即 grep 核对**：若断言依赖落盘行为（路径/磁盘全量）则输入改 70_000；若仅上下文长度语义则不动（评审 #4 明确规则，不再留占位） |
| `test/advisor.test.mjs` | — | 新增 MAX_RESULT_CHARS = 65536 用例 |
| `test/panel-chat.test.mjs` / `test/history-window.test.mjs` | — | **实现开始时即 grep** 2000/20000 截断断言，有则按 65536 更新（评审 #4） |
| `test/run-helpers.test.mjs`（新增用例） | — | 落盘失败回退路径：mock 落盘失败（只读目录/注入失败），断言回退截断长度 = 65536（评审 #6） |
| 新增 | — | 边界用例：65536 不落盘 / 65537 落盘；preview > 20000；历史页 64K 透传 |

## 3. 受影响文件（Affected Files）

| 文件 | 动作 | 内容 |
|---|---|---|
| `src/agent/run-helpers.mjs` | MODIFY | `:63-64` 阈值与 preview → `64 * 1024`；注释同步 |
| `src/advisor/run.mjs` | MODIFY | `:34` `MAX_RESULT_CHARS` → `64 * 1024` |
| `src/extension/panel-chat.mjs` | MODIFY | `:156` `slice(0, 20000)` → `slice(0, 64 * 1024)` |
| `src/extension/panel-session.mjs` | MODIFY | `:87` 工具卡 `slice(0, 2000)` → `slice(0, 64 * 1024)` |
| `test/run-helpers.test.mjs` | MODIFY | 3 处 20_000 → 70_000；预览断言放宽；新增边界用例 |
| `test/advisor.test.mjs` | MODIFY | 新增 advisor 截断阈值用例 |
| `test/panel-chat.test.mjs` 等 | MODIFY（按 grep 结果） | 截断断言同步 |
| `webview/lib.js` | 不动 | `MAX_TOOL_OUTPUT = 64*1024` 已达标 |

## 4. 验收标准（Acceptance Criteria）

| # | AC | 验证方式 |
|---|---|---|
| AC1 | ≤65536 字符的工具结果不落盘，原样进上下文 | 单元测试：`offloadToolResult(cwd, "x".repeat(65_536))` 返回原文 |
| AC2 | 65537+ 字符落盘，返回 preview + 路径，磁盘全量 | 单元测试：`"x".repeat(65_537)` → 匹配 `[Large output saved`，磁盘 65_537，内联 ≤ 65536 + 路径开销 |
| AC3 | 落盘 preview 放大到 64K（原 2K） | 单元测试：内联返回长度 > 20000 |
| AC4 | advisor `MAX_RESULT_CHARS` = 65536 | 常量断言或行为用例 |
| AC5 | 实时显示截断 = 64K（原 20K） | 单元测试：mock 回调，70_000 字符结果经 onToolResult 后 ≤ 65536 |
| AC6 | 历史页工具卡 = 64K（原 2K） | 单元测试：70_000 字符工具消息经 sendHistoryPage 后 ≤ 65536（且 > 20000 证明旧限制已破） |
| AC7 | 落盘格式与清理逻辑不变 | 现有 run-helpers offload 测试（清理/保留/目录缺失）通过（输入改 70_000 后） |
| AC8 | `npm test` 全套通过 | 命令 |
| AC9 | `src/` 无 16000/20000/2000/12000（工具输出相关）残留 | grep 验证（区分业务常量；12000 为 advisor 截断，评审 #3） |
