# 工具输出长度限制调整 — 设计（CLI）

> 板块：工具输出的超长**落盘阈值与显示层**（已实现专题，**当前生效**）。
> 需求：`../requirements/TOOL-OUTPUT-LIMITS.md`
> 关联：`docs/TODO.md`（C 方案——read 读回防炸，**2026-09-09 已实现核销**——见 §2.6）、`docs/README.md`（总地图）。
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

`thincoder-core/advisor/run.mjs` `MAX_RESULT_CHARS = 64 * 1024`（与主链路 64K 对齐）。**双端化截断**
（2026-09-09 DUAL-END-TRUNCATION——评审尾部结论不再被切）：工具结果回填从"保头弃尾"
（纯头向 line-aware 累加至 64K break）改为**头尾双保**——头行累加至预算 ~60%
（`ADVISOR_HEAD_RATIO = 0.6`）→ 中段切 → 尾行累加至剩余预算（保尾结论——裁决/
结论行可见）——头尾之间省略注 `… (truncated: N more lines, N chars total)` + offset
续读提示保留（`read(path, offset=…, limit=…)` 续中段）。实现落点：截断纯函数迁至
`thincoder-core/advisor/truncate.mjs`（`truncateAdvisorResult`——头尾预算行级累加、绝不半行切开、
K=0 防御不谎报截断——run.mjs 工具回填调用同函数——双端 VSC 逐字同构镜像）。advisor
上下文保护已有 `compactMessages` 兜底，放宽后不新增风险。

### 2.6 read 双端返回（C 方案——2026-09-09 实现）

`thincoder-core/tools/file.mjs` read 工具对大文件/offload 产物的读回（纯头向窗口尾不可见的剩余回路）：

- **判别锚（实测）**：窗口截断（`windowEnd < total`）**且**文件行数 > `MAX_READ_LINES`（2000）
  → 双端分支。≤ 2000 行文件任何窗口走**旧头向路径**（含旧 `... (N lines total, use offset
  to continue)` 尾注——字节零变化）；窗口覆盖全文件也走旧路径。offload 产物文件为纯文本
  （无尾注标记）——按行数判别覆盖（offload 结果行数众多天然 > 阈值）。
- **返回形态**：头 N 行（请求窗口——默认 2000，offset 起，续读路径不变）+ `…(truncated:
  K lines in middle, use offset to continue)` + 尾 M 行（文件**真实尾部**——`READ_TAIL_LINES
  = 500`——现尾注升级为真实尾行内容）。K = 尾区起点 − 窗口终点；尾区 = 文件末 500 行，
  起点落入窗口（重叠）→ 从窗口后开始——**任何行不重复**；剩余全被覆盖（K=0）→ 整印余段
  **无假省略注**。hashes 模式照常（头尾行 hash 与 hashline_edit 同域）。
- 双端返回结果不再套纯头 `truncate()`（会二次切尾）——超 64K 由主链路 offload 双端
  preview 兜底（§2.1-2.4 层——同样保尾）。与 read offload 双端预览同构（共享"头+尾保留、
  中段截断"策略——分别实现）。

## 3. 实现落点与兼容性

- `src/agent/helpers.mjs`：常量 + `safeSliceUTF16` / `safeSliceUTF16End` / `buildDualEndPreview` / `offloadToolResult` / `cleanupOldToolResults`。
- 调用点 `src/agent/dispatch.mjs`（offloadToolResult——函数内部行为改，调用点零改）：非 read_image 工具结果统一经落盘守卫。
- `thincoder-core/advisor/run.mjs`：`MAX_RESULT_CHARS`（截断行为迁 `thincoder-core/advisor/truncate.mjs`——2026-09-09）。
- `thincoder-core/tools/file.mjs`：read 双端返回（§2.6——`READ_TAIL_LINES`；≤ 阈值旧路径零变化）。
- 兼容不变量：落盘全文（磁盘全量）、清理逻辑（保留期/写时自清理/目录缺失）、失败回退、提示语与路径格式全部不变。

## 4. 验收标准（核销参考）

- ≤65536 不落盘、原样返回；65537+ 落盘返回 preview + 路径、磁盘全量。
- 落盘 preview 含头段与尾段（双端都在）、中间省略注在、总长 ≤ 65536 + 路径开销。
- advisor `MAX_RESULT_CHARS` = 65536。
- 落盘失败回退同用双端切片（无路径提示）。
- 现有 offload 测试（清理/保留/目录缺失）与全套测试通过。
- **C 方案已实现核销（2026-09-09 DUAL-END-TRUNCATION）**：read 大文件/offload 读回 =
  头 N + 省略注（K）+ 尾 M（§2.6 形态——`test/read-dual-end.test.mjs` 7 用例）；advisor 截断
  双端化（§2.5——`test/advisor-truncation.test.mjs` 6 用例）——双端锁步镜像
  （CLI/VSC——VSC 仓对应文档与测试同批）。

## 变更记录

- 2026-08-24：首版——阈值 16K→64K、preview 2K→64K、advisor 12K→64K。npm 0.12.43。
- 2026-09-04：预览保头保尾修订（§5）——preview 改为头 16K + 省略注 + 尾 48K；失败回退同用双端切片。
- 2026-09-07：文档重写为人类可读当前态（批 A）——§5 并入正文，折叠实现流水。
- 2026-09-09：C 方案实现核销 + advisor 截断双端化（DUAL-END-TRUNCATION——read 双端
  §2.6 / advisor §2.5 头尾双保——truncate.mjs 拆分——双端锁步）。
