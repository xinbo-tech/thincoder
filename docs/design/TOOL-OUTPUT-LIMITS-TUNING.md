# 工具输出长度限制调整 — 设计（CLI）

> 板块：工具输出的超长**落盘阈值与显示层**（已实现专题，**当前生效**）。
> 需求：`TOOL-OUTPUT-LIMITS-REQUIREMENTS.md`
> 关联：`docs/TODO.md`（C 方案——read 读回防炸，未做）、`README.md`（文档地图）。
> 状态：**已实现**（2026-08-24 首版 + 2026-09-04 §5 预览保头保尾修订——§5 已并入本文为现行正文）。

## 1. 问题陈述

- **P1 · 阈值过小**：工具输出 >16K 即落盘（`TOOL_RESULT_OFFLOAD_LIMIT = 16_000`）。advisor 评审输出、大文件读取、grep 大仓库等常见场景频繁落盘，模型被迫 read 文件才能看全。
- **P2 · preview 过小/纯头**：落盘后内联 preview 原为 2K（`TOOL_RESULT_PREVIEW = 2_000`），放大后原为纯头 64K——结果在尾部的输出（测试统计/错误尾/结论句）被截掉，模型读不回结果 → read 回全文（炸）或重跑（浪费）。
- **P3 · advisor 截断过紧**：advisor 评审循环内工具结果 12K 即截断（`MAX_RESULT_CHARS = 12_000`，line-aware）——比主链路更紧，评审可能基于不完整证据。

## 2. 现行设计

统一阈值与 preview 预算：`64 * 1024 = 65536`。preview 采用**保头保尾**（与 context.mjs 压缩/蒸馏同款策略——keep head + tail + 中间省略注）。

### 2.1 常量（`src/agent/helpers.mjs`）

```js
const TOOL_RESULT_OFFLOAD_LIMIT = 64 * 1024 // 65536 chars — offload only above 64K
const TOOL_RESULT_PREVIEW      = 64 * 1024 // total preview budget: head + middle note + tail ≤ 65536
const TOOL_RESULT_PREVIEW_HEAD = 16 * 1024 // head slice preserved
const TOOL_RESULT_PREVIEW_TAIL = 48 * 1024 // nominal tail slice (actual tail = budget remainder)
```

预览预算（评审 #2 定稿）：`head + 省略注 + tail ≤ 65536`——tail 从常量计算（`tail = TOOL_RESULT_PREVIEW − head − noteLen`），**绝不硬编码**。注字符数随省略位数变化，用 `text.length` 位数作上界预算保证总长 ≤ 65536。

### 2.2 双端安全切片

- `safeSliceUTF16(text, max)`：头部截断——截断点落在高代理（D800–DBFF）上时向前收一个码元，防把 emoji 代理对切成孤立高代理（deepseek 400 根因）。
- `safeSliceUTF16End(text, max)`：尾部切片起点落在低代理（DC00–DFFF）上时前移一个码元，防孤立低代理开头。
- 两端均 UTF-16 安全，与 `setup.mjs` 的 `safeSliceUTF16` 同语义（`escape.mjs` 的 sanitizeLoneSurrogates 是发送兜底，此处是源头）。

### 2.3 preview 构成（`buildDualEndPreview`）

```
head（≤16K）  +  \n\n… [middle omitted: N chars] …\n\n  +  tail（预算余量）
```

尾部承载结果/统计/错误（保头保尾——"截断负优化"变"截断正优化"）。

### 2.4 落盘（`offloadToolResult(text, callId, dir)`）

- ≤65536：原样返回，不进落盘路径。
- >65536：写时自清理（删 offload 目录内 mtime 超 `TMP_RETENTION_MS` = 3 天的文件）→ `mkdir` → `writeFile` 落盘全文 → 返回双端 preview + 路径提示语：

```
[... output too large (N chars total), full content saved to: PATH
Page through it with the read tool (offset/limit) or sed -n 'START,ENDp' — do NOT re-run the tool blindly.]
```

- 提示语/路径格式**不变**（模型契约稳定：需要完整时定向读——但 preview 已含尾部，多数场景无需读回）。
- **落盘失败回退**（评审 #3）：同用双端切片 + 无路径提示：

```
[... truncated: N chars total, offload to disk failed]
```

### 2.5 advisor 截断（P3）

`src/advisor/run.mjs` `MAX_RESULT_CHARS = 64 * 1024`（line-aware 保留完整行，仅上限变化，与主链路 64K 对齐）。advisor 上下文保护已有 `compactMessages` 兜底，放宽后不新增风险。

## 3. 实现落点与兼容性

- `src/agent/helpers.mjs`：常量 + `safeSliceUTF16` / `safeSliceUTF16End` / `buildDualEndPreview` / `offloadToolResult` / `cleanupOldToolResults`。
- 调用点 `src/agent/dispatch.mjs`（offloadToolResult——函数内部行为改，调用点零改）：非 read_image 工具结果统一经落盘守卫。
- `src/advisor/run.mjs`：`MAX_RESULT_CHARS`。
- 兼容不变量：落盘全文（磁盘全量）、清理逻辑（保留期/写时自清理/目录缺失）、失败回退、提示语与路径格式全部不变。

## 4. 验收标准（核销参考）

- ≤65536 不落盘、原样返回；65537+ 落盘返回 preview + 路径、磁盘全量。
- 落盘 preview 含头段与尾段（双端都在）、中间省略注在、总长 ≤ 65536 + 路径开销。
- advisor `MAX_RESULT_CHARS` = 65536。
- 落盘失败回退同用双端切片（无路径提示）。
- 现有 offload 测试（清理/保留/目录缺失）与全套测试通过。
- 未做：C 方案（read 读回 offload 文件防炸——防模型为看尾部读回大文件再炸）——独立后续，见 `docs/TODO.md`。

## 变更记录

- 2026-08-24：首版——阈值 16K→64K、preview 2K→64K、advisor 12K→64K。npm 0.12.43。
- 2026-09-04：预览保头保尾修订（§5）——preview 改为头 16K + 省略注 + 尾 48K；失败回退同用双端切片。
- 2026-09-07：文档重写为人类可读当前态（批 A）——§5 并入正文，折叠实现流水。
