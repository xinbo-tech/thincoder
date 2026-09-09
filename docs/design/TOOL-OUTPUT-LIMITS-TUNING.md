# 工具输出长度限制调整 — 设计（VS Code 扩展）

> 板块：工具输出的超长**落盘阈值与显示层**（已实现专题，当前生效）。
> 需求：`TOOL-OUTPUT-LIMITS-REQUIREMENTS.md`
> 关联：`README.md`（文档地图）。
> 状态：**已实现**（2026-08-24 首版 + 2026-09-04 预览保头保尾修订——已并入本文为现行正文；marketplace / Open VSX 0.1.49）。
> 说明：与 CLI 端 `TOOL-OUTPUT-LIMITS-TUNING.md` 同源（两端语义一致；各自文件清单独立——文档地图惯例）。

## 1. 问题陈述

- **P1 · 阈值过小**：工具输出 >16K 即落盘（`MAX_TOOL_RESULT = 16000`）。advisor 评审输出、大文件读取、grep 大仓库等常见场景频繁落盘，模型被迫 read 文件才能看全。
- **P2 · preview 过小/纯头**：落盘后内联 preview 原为 2K 纯头（`TOOL_RESULT_PREVIEW`）——结果在尾部的输出（测试统计/错误尾/结论句）被截掉。放大后原为纯头 64K，模型仍读不回尾部结果。
- **P3 · advisor 截断过紧**：advisor 评审循环内工具结果 12K 即截断（`MAX_RESULT_CHARS = 12_000`，line-aware）——比主链路更紧，评审可能基于不完整证据。
- **P4 · 实时显示截断**：`onToolResult` 发 webview 前 `slice(0, 20000)`——即使落盘阈值放宽，面板上看到的仍是 20K 截断，与上下文不一致。
- **P5 · 历史页工具卡截断**：`sendHistoryPage` 里 `slice(0, 2000)`——回看历史时工具输出只剩前 2K。

## 2. 现行设计

统一阈值与 preview 预算：`64 * 1024 = 65536`。preview 采用**保头保尾**（keep head + tail + 中间省略注），与压缩/蒸馏同款策略。

### 2.1 常量（`src/agent/run-helpers.mjs`）

```js
export const MAX_TOOL_RESULT = 64 * 1024 // chars — large results saved to disk instead of truncated (aligns with CLI)
export const TOOL_RESULT_PREVIEW_HEAD = 16 * 1024 // §5 D-4.1 head slice preserved (preview 保头保尾)
export const TOOL_RESULT_PREVIEW_TAIL = 48 * 1024 // §5 D-4.1 nominal tail — actual budget = MAX_TOOL_RESULT − head − noteLen (tail 优先)
```

旧单常量 `TOOL_RESULT_PREVIEW` 已随双端预览实现删除（run-helpers.mjs——`buildHeadTailPreview`/`safeSliceUTF16Tail`）。**tail 绝不硬编码**——实际 = `MAX_TOOL_RESULT − head − noteLen`，noteLen 含省略位数（先按 `PREVIEW_NOTE_MAX_DIGITS` 预留，再按真实位数把差额释放给 tail——位数只减不增，迭代收敛），保证总长 ≤ 65536。

### 2.2 双端安全切片

- `safeSliceUTF16(text, max)`：头部截断——截断点落在高代理（D800–DBFF）上时向前收一个码元，防把 emoji 代理对切成孤立高代理。
- `safeSliceUTF16Tail(text, max)`：尾部切片起点落在低代理（DC00–DFFF）上时前移一个码元，防孤立低代理开头。
- 两端均 UTF-16 安全，与 `src/agent/run-helpers.mjs` 的 `safeSliceUTF16`/`safeSliceUTF16Tail` 同语义（`src/escape.mjs` 的 sanitizeLoneSurrogates 是发送兜底，此处是源头——原 `src/context.mjs` 引用随 GIT-ASYNC L21 删除；CLI `helpers.mjs` 同规则，两端独立实现）。

### 2.3 preview 构成（`buildHeadTailPreview`）

`head（≤16K）` + 省略注 `\n\n… [middle omitted: N chars] …\n\n` + `tail（预算余量）`。尾部承载结果/统计/错误——"截断负优化"变"截断正优化"。

### 2.4 落盘（`offloadToolResult(cwd, text)`）

- ≤65536：原样返回，不进落盘路径。
- >65536：写时自清理（删 `.thincoder/tmp/` 内 mtime 超 `TMP_RETENTION_MS` = 3 天的文件，含同目录 `paste-*` 图；子目录不动；失败静默）→ `mkdir` → `writeFile` 落盘全文 `tool-<id>.txt` → 返回**成功提示语 + `\n\n` + 双端 preview**：

```
[Large output saved. Read the full result with the read tool: <cwd>/.thincoder/tmp/tool-<id>.txt]

<preview: head + … [middle omitted: N chars] … + tail>
```

- 提示语/路径格式**不变**（模型契约稳定：需要完整时定向 read——preview 已含尾部，多数场景无需读回）。
- **落盘失败回退**：同用双端切片 + 无路径提示——`<preview>` + `\n... (truncated <原文总长> chars total — offload to disk failed)`（不报旧"text.length − MAX"——双端切片下已非实际弃置数，与省略注矛盾——改报总量）。

调用点：`src/agent/execute-tools.mjs`（非 read_image 工具结果统一经落盘守卫——`result = offloadToolResult(cwd, result)`，函数内部行为改，调用点零改）。

### 2.5 advisor 截断（P3）

`src/advisor/run.mjs` `MAX_RESULT_CHARS = 64 * 1024`（line-aware 保留完整行，仅上限变化，与主链路 64K 对齐）。advisor 上下文保护已有 `compactMessages` 兜底，放宽后不新增风险。

### 2.6 实时显示（P4）

`src/extension/panel-callbacks.mjs` `onToolResult`：

```js
const text = (r || "").slice(0, 64 * 1024)
```

webview 侧 `finishToolCard` → `capText(text)`（`webview/lib.js`，上限 `MAX_TOOL_OUTPUT = 64 * 1024`）正好承接——实时链路两端一致，无新截断点。

### 2.7 历史页工具卡（P5）

`src/extension/panel-session.mjs` `sendHistoryPage`：

```js
if (m.kind === "tool") return { ...m, text: m.text.slice(0, 64 * 1024) }
```

历史懒加载分页机制不变，仅单卡上限放宽。

### 2.8 上下文成本

preview 放大后每次落盘结果最多 64K 进模型上下文，由既有 compaction 机制兜底（与 advisor 侧 compactMessages 同构）。

## 3. 实现落点与兼容性

- `src/agent/run-helpers.mjs`：常量（`MAX_TOOL_RESULT`/`TOOL_RESULT_PREVIEW_HEAD`/`TOOL_RESULT_PREVIEW_TAIL`）+ `safeSliceUTF16`/`safeSliceUTF16Tail`/`buildHeadTailPreview`/`offloadToolResult`（含写时自清理）。
- 调用点 `src/agent/execute-tools.mjs`：`offloadToolResult`（行为改、调用零改）。
- `src/advisor/run.mjs`：`MAX_RESULT_CHARS`。
- `src/extension/panel-callbacks.mjs`：`onToolResult` `slice(0, 64 * 1024)`。
- `src/extension/panel-session.mjs`：历史页工具卡 `slice(0, 64 * 1024)`。
- `webview/lib.js`：`MAX_TOOL_OUTPUT = 64 * 1024` 已达标，不动。
- 兼容不变量：落盘全文（磁盘全量）、清理逻辑（保留期/写时自清理/目录缺失）、失败回退、提示语与路径格式全部不变。

## 4. 验收标准（核销参考）

- AC1 ≤65536 字符的工具结果不落盘、原样进上下文（`offloadToolResult(cwd, "x".repeat(65_536))` 返回原文）。
- AC2 65537+ 字符落盘，返回 preview + 路径、磁盘全量（`"x".repeat(65_537)` → 匹配 `[Large output saved`，磁盘 65_537，内联 ≤ 65536 + 路径开销）。
- AC3 落盘 preview 放大到双端（原 2K 纯头）：内联返回长度 > 20000，且头段、省略注、尾段都在。
- AC4 advisor `MAX_RESULT_CHARS` = 65536（常量断言或行为用例）。
- AC5 实时显示截断 = 64K（原 20K）：mock 回调，70_000 字符结果经 onToolResult 后 ≤ 65536。
- AC6 历史页工具卡 = 64K（原 2K）：70_000 字符工具消息经 sendHistoryPage 后 ≤ 65536（且 > 20000 证明旧限制已破）。
- AC7 落盘格式与清理逻辑不变：现有 offload 测试（清理/保留/目录缺失）通过（原 20_000 触发输入的测试改 >65536 输入）。
- AC8 `npm test` 全套通过。
- AC9 `src/` 无 16000/20000/2000/12000（工具输出相关）残留（grep 验证；区分业务常量——12000 为 advisor 截断，已改 65536）。

## 变更记录

- 2026-08-24：首版——阈值 16K→64K、preview 2K→64K、advisor 12K→64K、实时 20K→64K、历史 2K→64K。marketplace / Open VSX 0.1.49。
- 2026-09-04：预览保头保尾修订——preview 改为头 16K + 省略注 + 尾（预算余量）；失败回退同用双端切片。
- 2026-09-08：文档重写为人类可读当前态（批 V3b）——双端修订并入正文，折叠实现流水并更新模块落点（实时显示自 panel-chat.mjs 迁 panel-callbacks.mjs 等）。
