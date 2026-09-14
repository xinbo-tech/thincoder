# 工具输出额度与截断（TOOL-OUTPUT-LIMITS）· 工具系统板块

> 板块 = **工具系统（输出额度子面）**——超长工具结果的落盘阈值 · 双端 preview · advisor 结果截断 · read 读回双端返回。
> 本档 = 该机制族的**唯一权威**（常量 / 语义 / 坐标）。
> 地图指针 = `docs/core/design/AGENT-LOOP.md` §6.16（指针表登记「结果落盘阈值 → 工具输出上限系（CLI 仓·设计）」——本档即其落点）；工具契约 = `docs/core/design/TOOLS.md`（本档不复制其内容，D2）。
> 双端：本形态 = 核内共享实现 `thincoder-core/**`（双壳同用）；VSC 对位坐标见 §6。
> 需求侧 = `docs/core/requirements/TOOLS.md` §4.3 N5（根层现有承载·部分）；CLI 树需求档 `thincoder-cli/docs/requirements/TOOL-OUTPUT-LIMITS.md` **未迁**（后续批并入既有档）。
> 建档：2026-09-15（**B 式迁移轮 · 第 3 批**——`thincoder-cli/docs/design/TOOL-OUTPUT-LIMITS.md` 内容重建入基准层；旧档原地一字不改、留作参照历史）。
> 本档坐标 = **as-of 2026-09-15 实核**（仓根 = `thincoder/`）。

## 1. 定位与问题

统一额度：工具结果 **超过 64K 字符**才落盘；落盘后内联 preview 采**保头保尾**。三条原始痛点（首版立项依据，现行处置一并列出）：

| # | 问题 | 现行处置 |
|---|---|---|
| P1 | 阈值过小（原 16K）——advisor 评审输出 / 大文件读取 / grep 大仓库频繁落盘，模型被迫 read 回全文 | 落盘阈值提至 64K |
| P2 | preview 过小且**纯头**——结果在尾部的输出（测试统计 / 错误尾 / 结论句）被截掉 ⇒ 读不回结果 | preview 改**双端**：头 + 中间省略注 + 尾，总预算 ≤ 64K |
| P3 | advisor 评审循环内工具结果 12K 即截断（比主链路更紧）——评审可能基于不完整证据 | advisor 上限对齐 64K，并**双端化** |

## 2. 常量与预算（`thincoder-core/agent/helpers.mjs`）

```js
const TOOL_RESULT_OFFLOAD_LIMIT = 64 * 1024 // 65536 chars — offload only above 64K
const TOOL_RESULT_PREVIEW      = 64 * 1024 // total preview budget: head + middle note + tail ≤ 65536
const TOOL_RESULT_PREVIEW_HEAD = 16 * 1024 // head slice preserved
const TOOL_RESULT_PREVIEW_TAIL = 48 * 1024 // nominal tail slice (actual tail = budget remainder)
```

- **预算恒等式**：`head + 省略注 + tail ≤ 65536`。tail 从常量**推导**（`tail = TOOL_RESULT_PREVIEW − head − noteLen`），**绝不硬编码**。
- 注长随省略位数变化 ⇒ 预算用 `text.length` 的位数作上界，保证总长 ≤ 65536；注里报的是**实际**省略数。
- preview 形态：

```text
head（≤16K）  +  \n\n… [middle omitted: N chars] …\n\n  +  tail（预算余量）
```

- **双端切片（本档私有实现）**：头切片 `safeSliceUTF16`（`thincoder-core/agent/helpers.mjs:45`）、尾切片 `safeSliceUTF16End`（`:56`）。两端均 UTF-16 安全——切点落在代理对上时丢整对，绝不产生孤立高/低代理。
- **共享 UTF-16 安全切片另有单一来源**：`thincoder-core/text-budget.mjs:55`（`safeSliceUTF16`）/ `:69`（`safeSliceUTF16Tail`）——供 agent 捕获截断与 TUI 载体额度共用（`helpers.mjs` 内两个同义函数为 agent 侧本地面）。

## 3. 落盘（`offloadToolResult`）与失败回退

- `≤ 65536`：原样返回，**不进落盘路径**（`thincoder-core/agent/helpers.mjs:125`）。
- `> 65536`：写时自清理（删 offload 目录内 mtime 超 `TMP_RETENTION_MS` = **3 天**的文件——`thincoder-core/agent/helpers.mjs:80`）→ `mkdir` → `writeFile` 全文落盘 → 返回双端 preview + 路径提示语（`thincoder-core/agent/helpers.mjs:131`–`:135`）：

```text
[... output too large (N chars total), full content saved to: PATH
Page through it with the read tool (offset/limit) or sed -n 'START,ENDp' — do NOT re-run the tool blindly.]
```

- **提示语与路径格式不变**（模型契约稳定）：需要完整内容时定向读——但 preview 已含尾部，多数场景无需读回。
- **落盘失败回退**：同用双端切片 + **无路径提示**（`thincoder-core/agent/helpers.mjs:136`–`:139`）：

```text
[... truncated: N chars total, offload to disk failed]
```

- 调用点：`thincoder-core/agent/dispatch.mjs:428`——非 multimodal 工具结果统一过落盘守卫（函数内部行为改、调用点零改）。

## 4. advisor 结果截断（P3）

- 上限常量 `MAX_RESULT_CHARS = 64 * 1024`（`thincoder-core/advisor/compaction.mjs:37`，与主链路对齐）。
- **双端化截断**（DUAL-END-TRUNCATION）：工具结果回填由「保头弃尾」改为**头尾双保**——头行累加至预算约 **60%**（`ADVISOR_HEAD_RATIO = 0.6`，`thincoder-core/advisor/truncate.mjs:14`）→ 中段切 → 尾行累加至剩余预算（**裁决 / 结论行可见**）。
- 头尾之间省略注 + offset 续读提示保留；**绝不半行切开**；K=0 时不谎报截断。
- 实现落点：截断纯函数 `truncateAdvisorResult`（`thincoder-core/advisor/truncate.mjs`），唯一调用点 = `thincoder-core/advisor/loop.mjs:290`。
- advisor 上下文保护另有 `compactMessages` 兜底——放宽上限后不新增风险。

## 5. read 读回双端返回

`read` 工具对大文件 / offload 产物的读回（纯头向窗口尾不可见的剩余回路）：

- **判别锚**（`thincoder-core/tools/file.mjs:104`）：窗口截断（`windowEnd < total`）**且**文件行数 > `MAX_READ_LINES`（2000，`thincoder-core/tools/shared.mjs:20`）→ 双端分支。
  - `≤ 2000` 行文件的任何窗口走**旧头向路径**（含旧尾注 `... (N lines total, use offset to continue)`——字节零变化）；窗口覆盖全文件也走旧路径。
  - offload 产物为纯文本（无尾注标记）——按行数判别即天然覆盖（其行数众多）。
- **返回形态**：头 N 行（请求窗口，offset 起，续读路径不变）+ `…(truncated: K lines in middle, use offset to continue)` + 尾 M 行（文件**真实尾部**，`READ_TAIL_LINES = 500`，`file.mjs:30`）。
  - K = 尾区起点 − 窗口终点；尾区 = 文件末 500 行；起点落入窗口（重叠）→ 从窗口后开始——**任何行不重复**；剩余全被覆盖（K=0）→ 整印余段、**无假省略注**（`file.mjs:111`–`:116`）。
  - hashes 模式照常（头尾行 hash 与 hashline_edit 同域）。
- 双端返回结果**不再套纯头 `truncate()`**（会二次切尾）——超 64K 由主链路 offload 双端 preview 兜底（同保尾）。

## 6. 机制面（B 式迁移并入——现状路径）

### 6.1 实现坐标（as-of 2026-09-15 实核）

| 面 | 落点 | 实核 |
|---|---|---|
| 落盘阈值 + preview 四常量 | `thincoder-core/agent/helpers.mjs:36`–`:39` | 在位 |
| offload 目录保留期 | `thincoder-core/agent/helpers.mjs:80`（`TMP_RETENTION_MS` = 3 天） | 在位 |
| 双端切片（本档私有） | `thincoder-core/agent/helpers.mjs:45`（head）· `:56`（tail） | 在位 |
| preview 构造 | `thincoder-core/agent/helpers.mjs:71`（`buildDualEndPreview`） | 在位 |
| 落盘主函数 + 写时自清理 | `thincoder-core/agent/helpers.mjs:124` · `:114`（清理判定）· `:127`（清理调用） | 在位 |
| 主链路调用点 | `thincoder-core/agent/dispatch.mjs:428` | 非 multimodal 结果过守卫 |
| 共享 UTF-16 安全切片 | `thincoder-core/text-budget.mjs:55` · `:69` | 单一来源（agent 捕获 + TUI 额度共用） |
| advisor 上限常量 | `thincoder-core/advisor/compaction.mjs:37`（`MAX_RESULT_CHARS`） | 由 `thincoder-core/advisor/run.mjs:20` re-export |
| advisor 双端截断 | `thincoder-core/advisor/truncate.mjs:14` · 调用 `thincoder-core/advisor/loop.mjs:290` | 头/尾预算行级累加 |
| read 双端返回 | `thincoder-core/tools/file.mjs:30`（`READ_TAIL_LINES`）· `:104`（判别）· `:111`（尾区起点） | `MAX_READ_LINES` = `thincoder-core/tools/shared.mjs:20` |

### 6.2 双端与测试面

- **双端**：CLI 与 VSC 各自实现、语义同源（锁步镜像）。镜像面 = `read` 双端返回与 advisor 截断两族；VSC 侧文档与测试随 CLI 同批落（VSC 树档未迁——按 P2 归 VSC 轮）。
- **测试面**：`thincoder-cli/test/read-dual-end.test.mjs` · `thincoder-cli/test/advisor-truncation.test.mjs` · `thincoder-core/test/advisor-truncate.test.mjs`（VSC 侧同名对位 `thincoder-vscode/test/`）。

## 7. 并入的关键决策记录（含否决备选）

| # | 决策 | 理由 / 否决备选 |
|---|---|---|
| D-L1 | 阈值与 preview 预算同取 **64K** | 单一数字省一层心智；否决「阈值 / preview 各自独立取值」 |
| D-L2 | preview **保头保尾**（头 16K + 注 + 尾余量） | 结果/统计/错误天然落在尾部——纯头截断会把结论切掉；否决纯头 64K |
| D-L3 | tail 从常量**推导**，禁止硬编码 | 注长随省略位数浮动——硬编码会破总预算；否决把 48K 写死进切片 |
| D-L4 | 两端切点均 **UTF-16 安全** | 裸 `slice` 产生孤立代理会触发严格解析器 400（deepseek 根因）；否决裸切片 |
| D-L5 | 提示语 / 路径格式**不变**，失败回退同用双端切片 | 模型契约稳定优先；失败时也不退回纯头（否则尾部结论同样丢失） |
| D-L6 | advisor 也**双端化**（不维持纯头） | 评审的裁决/结论行常在尾部——截掉即评审基于不完整证据；否决「主链路改、advisor 不动」 |
| D-L7 | read 双端**条件启用**（窗口截断 且 文件 > 2000 行） | ≤ 阈值文件与全文件窗口保持字节零变化（回归面最小）；否决无条件双端 |

## 8. 不并项与历史沿革

### 8.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-cli/docs/design/TOOL-OUTPUT-LIMITS.md`（CLI 产品档）——**原地保留作参照历史**（保留 ≠ 维护）。下列内容不并入本档：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 旧档状态行（「已实现 2026-08-24 首版 + 09-04 §5 修订」） | 时点状态行 | 批次语境——现行态已入 §1–§5 |
| 旧档 §4「验收标准（核销参考）」 | 一次性验收清单（含测试用例名与核销注） | 批次材料——现行约束已入 §2–§5，测试面入 §6.2 |
| 旧档 §3「实现落点与兼容性」 | 单次改动的受影响文件清单 | 一次性材料——现行坐标入 §6.1 |
| 旧档档头「关联：`docs/TODO.md`（C 方案核销）」 | 台账指针（已核销） | 一次性台账指针——非机制正文 |
| 旧档变更记录（四条逐批流水） | 2026-08-24 / 09-04 / 09-07 / 09-09 批次流水 | 历史叙述——本档自有变更记录 |

### 8.2 不并项登记（跨板块 / 一次性材料——**不并**，逐项登记）

| 旧档面 | 内容 | 何故不并（去向 / 触发） |
|---|---|---|
| 工具描述文本 | 模型可见的 offload 提示语之外的描述面 | **提示词面 = 产品代码**——落点 `thincoder-core/tool-docs/*.md` |
| VSC 侧设计档与测试 | VSC 树对应文档 | 按 P2 归 VSC 轮（本批零触碰 VSC 树） |
| 需求侧正文 | CLI 树需求档 | 需求档未迁——后续批并入 `docs/core/requirements/TOOLS.md` |

## 9. 体量与拆分规划（R24a）

**实测行数**：本档 **123 行**（根层新建 · as-of 2026-09-15 实核）——**低于 300 行软线，无需拆分规划**。

## 变更记录

- 2026-09-15（**B 式迁移轮 · 第 3 批**）：建档——`thincoder-cli/docs/design/TOOL-OUTPUT-LIMITS.md` 内容重建入基准层（旧档一字未改、原地作参照历史）；坐标改写为现状路径并实核（`thincoder-core/agent/helpers.mjs` · `advisor/compaction.mjs` · `advisor/truncate.mjs` · `tools/file.mjs` · `text-budget.mjs`）；批次材料 / 状态行 / 变更流水不并（§8）。
