# 工具输出额度与截断（TOOL-OUTPUT-LIMITS）· 工具系统板块

> 板块 = **工具系统（输出额度子面）**——超长工具结果的落盘阈值 · 双端 preview · advisor 结果截断 · read 读回双端返回。
> 本档 = 该机制族的**唯一权威**（常量 / 语义 / 坐标）。
> 地图指针 = `docs/core/design/AGENT-LOOP.md` §6.16（指针表登记「结果落盘阈值 → 工具输出上限系（CLI 仓·设计）」——本档即其落点）；工具契约 = `docs/core/design/TOOLS.md`（本档不复制其内容，D2）。
> 双端：本形态 = 核内共享实现 `thincoder-core/**`（双壳同用）；VSC 对位坐标见 §6。
> 需求侧 = `docs/core/requirements/TOOLS.md` §4.3 N5（资源上限条目）· §4.5（工具输出上限系）。

## 1. 定位

统一额度：**工具结果族**超过 64K 字符才落盘；**报告族**（子代理 / advisor / escalate 的注入报告，`force: true`）无条件落盘。落盘后内联 preview 采**保头保尾**；报告族正文 ≤64K 时给正文一份，不上预览（§3）。

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

`offloadToolResult(text, callId, dir?, { force })`（`thincoder-core/agent/helpers.mjs:157`）按 `force` 分两族：**工具结果族**（`force` 缺省，调用点 `thincoder-core/agent/dispatch-run.mjs:148`——非 multimodal 结果统一过落盘守卫）过长度门；**报告族**（`force: true`，调用点 `thincoder-core/agent-tools/subagent-async.mjs:389`）恒落盘。

**落盘条件分族，渲染形态不分族**——两族按同一常量 `TOOL_RESULT_OFFLOAD_LIMIT`（`thincoder-core/agent/helpers.mjs:36`）二分：

| 族 | 正文长度 | 落盘 | 返回体 |
|---|---|---|---|
| 工具结果族 | `≤ 65536` | 不落盘（长度门：`thincoder-core/agent/helpers.mjs:159`） | 原样返回 |
| 两族 | `> 65536` | 恒写 | 双端 preview + 路径提示语（下框） |
| 报告族 | `≤ 65536` | 恒写 | 正文原样一份 + `full content saved to: PATH` + 读取提示（无 `middle omitted`、无 `too large` 字样） |

`> 65536` 的落盘路径：写时自清理（删 offload 目录内 mtime 超 `TMP_RETENTION_MS` = **3 天**的文件——`thincoder-core/agent/helpers.mjs:80`）→ `mkdir` → `writeFile` 全文落盘 → 返回双端 preview + 路径提示语（`thincoder-core/agent/helpers.mjs:161`–`:167`）：

```text
[... output too large (N chars total), full content saved to: PATH
Page through it with the read tool (offset/limit) or sed -n 'START,ENDp' — do NOT re-run the tool blindly.]
```

- **提示语与路径格式不变**（模型契约稳定）：需要完整内容时定向读——但 preview 已含尾部，多数场景无需读回。
- **落盘失败回退**：**无路径提示**（`thincoder-core/agent/helpers.mjs:168`–`:172`），按同一长度门分两形：
  - 正文 `> 65536`：双端切片 + 原文案 `[... truncated: N chars total, offload to disk failed]`。
  - 报告族正文 `≤ 65536`：正文整段在前（本就不截断，不谎称 `truncated`）+ `[... full text kept inline above (N chars), offload to disk failed]`。
- 报告族进入对话的形态（预览 / 路径 / 轮预算档）= `docs/core/design/TIMEOUT-DIGEST.md` §2.2；本档只管落盘与渲染形态。

## 4. advisor 结果截断

- 上限常量 `MAX_RESULT_CHARS = 64 * 1024`（`thincoder-core/advisor/compaction.mjs:38`，与主链路对齐）。
- **双端化截断**（DUAL-END-TRUNCATION）：工具结果回填由「保头弃尾」改为**头尾双保**——头行累加至预算约 **60%**（`ADVISOR_HEAD_RATIO = 0.6`，`thincoder-core/advisor/truncate.mjs:14`）→ 中段切 → 尾行累加至剩余预算（**裁决 / 结论行可见**）。
- 头尾之间省略注 + offset 续读提示保留；**绝不半行切开**；K=0 时不谎报截断。
- 实现落点：截断纯函数 `truncateAdvisorResult`（`thincoder-core/advisor/truncate.mjs`），唯一调用点 = `thincoder-core/advisor/loop.mjs:282`。
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

## 6. 机制面

### 6.1 实现坐标

| 面 | 落点 | 实核 |
|---|---|---|
| 落盘阈值 + preview 四常量 | `thincoder-core/agent/helpers.mjs:36`–`:39` | 在位 |
| offload 目录保留期 | `thincoder-core/agent/helpers.mjs:80`（`TMP_RETENTION_MS` = 3 天） | 在位 |
| 双端切片（本档私有） | `thincoder-core/agent/helpers.mjs:45`（head）· `:56`（tail） | 在位 |
| preview 构造 | `thincoder-core/agent/helpers.mjs:71`（`buildDualEndPreview`） | 在位 |
| 落盘主函数 + 写时自清理 | `thincoder-core/agent/helpers.mjs:157`（`offloadToolResult`）· `:134`（清理函数）· `:161`（清理调用） | 在位 |
| 主链路调用点（工具结果族） | `thincoder-core/agent/dispatch-run.mjs:148` | 非 multimodal 结果过守卫 |
| 报告族调用点 | `thincoder-core/agent-tools/subagent-async.mjs:389` | 无条件 `{ force: true }` |
| 共享 UTF-16 安全切片 | `thincoder-core/text-budget.mjs:55` · `:69` | 单一来源（agent 捕获 + TUI 额度共用） |
| advisor 上限常量 | `thincoder-core/advisor/compaction.mjs:38`（`MAX_RESULT_CHARS`） | 由 `thincoder-core/advisor/run.mjs:16` re-export |
| advisor 双端截断 | `thincoder-core/advisor/truncate.mjs:14` · 调用 `thincoder-core/advisor/loop.mjs:282` | 头/尾预算行级累加 |
| read 双端返回 | `thincoder-core/tools/file.mjs:30`（`READ_TAIL_LINES`）· `:104`（判别）· `:111`（尾区起点） | `MAX_READ_LINES` = `thincoder-core/tools/shared.mjs:20` |

### 6.2 双端与测试

- **双端**：CLI 与 VSC 各自实现、语义同源（锁步镜像）。镜像面 = `read` 双端返回与 advisor 截断两族；VSC 端坐标已并入（§6.3），测试随 CLI 同批落。

### 6.3 VSC 端实现坐标（实核）

> 与 CLI / 核面**同阈值同构成、各自独立实现**（锁步镜像——单边改动会造成行为漂移，须两端同步）。

| 面 | VSC 落点（实核） |
|---|---|
| 落盘阈值 + preview 三常量 | `thincoder-vscode/src/agent/run-helpers.mjs:25`（`MAX_TOOL_RESULT` = 64 × 1024）· `:26`（`TOOL_RESULT_PREVIEW_HEAD`）· `:27`（`TOOL_RESULT_PREVIEW_TAIL`——实际 = 65536 − head − noteLen，tail 优先） |
| 双端切片（UTF-16 安全） | `thincoder-vscode/src/agent/run-helpers.mjs:97`（`safeSliceUTF16`）· `:115`（`safeSliceUTF16Tail`） |
| preview 构造 | `thincoder-vscode/src/agent/run-helpers.mjs:56`（`buildHeadTailPreview`——head + 省略注 + tail 预算） |
| 落盘 + 写时自清理 | `thincoder-vscode/src/agent/run-helpers.mjs:167`（`offloadToolResult`）· `:86`（`TMP_RETENTION_MS` = 3 天）· `:181`（mtime 清理判定） |
| 主链路调用点 | 核 `thincoder-core/agent/dispatch-run.mjs`（非 read_image 结果统一过落盘守卫——端已取核） |
| advisor 上限 + 双端截断 | `thincoder-vscode/src/advisor/compaction.mjs:34`（`MAX_RESULT_CHARS` = 64 × 1024）· `thincoder-vscode/src/advisor/truncate.mjs`（`truncateAdvisorResult`——头行 ~60% + 中段注 + 尾行余预算）· 调用 `thincoder-vscode/src/advisor/loop.mjs:266`（`thincoder-core/advisor/run.mjs:19` re-export） |
| 实时显示同宽 | `thincoder-vscode/src/extension/panel-callbacks.mjs:203`（`onToolResult` `slice(0, 64 * 1024)`） |
| 历史页工具卡同宽 | `thincoder-vscode/src/extension/panel-session.mjs:195`（tool 卡）· `:199`（tool 结果数组同限） |
| webview DOM 上限 | `thincoder-vscode/webview/lib.js:27`（`MAX_TOOL_OUTPUT` = 64 × 1024）· `:30`（`capText`） |
| read 双端返回 | （现体 = 核 `thincoder-core/tools/file.mjs`：`READ_TAIL_LINES` / 双端返回形态；`MAX_READ_LINES` = 核 `thincoder-core/tools/shared.mjs`） |
| 失败回退 | `thincoder-vscode/src/agent/run-helpers.mjs:196`（双端切片 + 无路径 + 原文总长——`offload to disk failed`） |

**VSC 侧差异注**：提示语 / 路径格式与 CLI 契约**同形**（`[Large output saved. Read the full result with the read tool: …]`——模型契约稳定需双端一致）；`tail` **绝不硬编码**（实际 = 预算余量）两端同律。

## 7. 关键决策记录

| # | 决策 | 理由 |
|---|---|---|
| D-L1 | 阈值与 preview 预算同取 **64K** | 单一数字省一层心智 |
| D-L2 | preview **保头保尾**（头 16K + 注 + 尾余量） | 结果/统计/错误天然落在尾部——纯头截断会把结论切掉 |
| D-L3 | tail 从常量**推导**，禁止硬编码 | 注长随省略位数浮动——硬编码会破总预算 |
| D-L4 | 两端切点均 **UTF-16 安全** | 裸 `slice` 产生孤立代理会触发严格解析器 400 |
| D-L5 | 提示语 / 路径格式**不变**，失败回退同用双端切片 | 模型契约稳定优先；失败时也不退回纯头（否则尾部结论同样丢失） |
| D-L6 | advisor 也**双端化**（不维持纯头） | 评审的裁决/结论行常在尾部——截掉即评审基于不完整证据 |
| D-L7 | read 双端**条件启用**（窗口截断 且 文件 > 2000 行） | ≤ 阈值文件与全文件窗口保持字节零变化（回归最小） |
