# 工具输出额度与截断（TOOL-OUTPUT-LIMITS）· 工具系统板块

> 板块 = **工具系统（输出额度子面）**——超长工具结果的落盘阈值 · 双端 preview · advisor 结果截断 · read 读回双端返回。
> 本档 = 该机制族的**唯一权威**（常量 / 语义 / 坐标）。
> 地图指针 = `docs/core/design/AGENT-LOOP.md` §6.16（指针表登记「结果落盘阈值 → 工具输出上限系（CLI 仓·设计）」——本档即其落点）；工具契约 = `docs/core/design/TOOLS.md`（本档不复制其内容，D2）。
> 双端：本形态 = 核内共享实现 `thincoder-core/**`（双壳同用）；VSC 对位坐标见 §6。
> 需求侧 = `docs/core/requirements/TOOLS.md` §4.3 N5（资源上限条目）· §4.5（工具输出上限系）。

## 1. 定位

统一额度：**工具结果族**超过 64K 字符才落盘；**报告族**（子代理 / advisor / escalate 的注入报告，`force: true`）无条件落盘。落盘后内联 preview 采**保头保尾**；报告族正文 ≤64K 时给正文一份，不上预览（§3）。

## 2. 常量与预算（`thincoder-core/agent/offload.mjs`；`thincoder-core/agent/helpers.mjs` 以具名 re-export 转口同名三件——既有 import 面零改）

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

- **头切片 = 核内单一来源**：`thincoder-core/text-budget.mjs` 的 `safeSliceUTF16`——双端 preview 头切片（`thincoder-core/agent/offload.mjs`）与 doc_search 预览（`thincoder-core/agent/setup.mjs`）经 import 复用，核内只此一处定义（D2）。
- **尾切片（agent 侧私有实现）**：`thincoder-core/agent/offload.mjs` 的 `safeSliceUTF16End`——起点落低代理（DC00–DFFF）时前进一码元，与头切片同规则（切点落代理对丢整对，绝不产生孤立高/低代理）。
- **尾切片的强化对称面**：`thincoder-core/text-budget.mjs` 的 `safeSliceUTF16Tail`——起点规则同上，另去掉原文末尾的孤立高代理（发送前 `thincoder-core/escape.mjs` 的 `sanitizeLoneSurrogates` 是兜底，此处是源头）。

## 3. 落盘（`offloadToolResult`）与失败回退

`offloadToolResult(text, callId, dir?, { force })`（`thincoder-core/agent/offload.mjs`）按 `force` 分两族：**工具结果族**（`force` 缺省，调用点 `thincoder-core/agent/dispatch-run.mjs:148`——非 multimodal 结果统一过落盘守卫）过长度门；**报告族**（`force: true`，调用点 `thincoder-core/agent-tools/subagent-async.mjs:389`）恒落盘。

**落盘条件分族，渲染形态不分族**——两族按同一常量 `TOOL_RESULT_OFFLOAD_LIMIT`（`thincoder-core/agent/offload.mjs` 的常量段）二分：

| 族 | 正文长度 | 落盘 | 返回体 |
|---|---|---|---|
| 工具结果族 | `≤ 65536` | 不落盘（长度门在 `offloadToolResult` 本体） | 原样返回 |
| 两族 | `> 65536` | 恒写 | 双端 preview + 路径提示语（下框） |
| 报告族 | `≤ 65536` | 恒写 | 正文原样一份 + `full content saved to: PATH` + 读取提示（无 `middle omitted`、无 `too large` 字样） |

`> 65536` 的落盘路径：写时自清理（删 offload 目录内 mtime 超 `TMP_RETENTION_MS` = **3 天**的文件——`TMP_RETENTION_MS`）→ `mkdir` → `writeFile` 全文落盘 → 返回双端 preview + 路径提示语（`offloadToolResult` 落盘成功支）：

```text
[... output too large (N chars total), full content saved to: PATH
Page through it with the read tool (offset/limit) or sed -n 'START,ENDp' — do NOT re-run the tool blindly.]
```

- **提示语与路径格式不变**（模型契约稳定）：需要完整内容时定向读——但 preview 已含尾部，多数场景无需读回。
- **落盘失败回退**：**无路径提示**（`offloadToolResult` 的 `catch` 支），按同一长度门分两形：
  - 正文 `> 65536`：双端切片 + 原文案 `[... truncated: N chars total, offload to disk failed]`。
  - 报告族正文 `≤ 65536`：正文整段在前（本就不截断，不谎称 `truncated`）+ `[... full text kept inline above (N chars), offload to disk failed]`。
- 报告族进入对话的形态（预览 / 路径 / 轮预算档）= `docs/core/design/TIMEOUT-DIGEST.md` §2.2；本档只管落盘与渲染形态。

## 4. advisor 结果截断

- 上限常量 `MAX_RESULT_CHARS = 64 * 1024`（`thincoder-core/advisor/compaction.mjs`，与主链路对齐）。
- **双端化截断**（DUAL-END-TRUNCATION）：工具结果回填由「保头弃尾」改为**头尾双保**——头行累加至预算约 **60%**（`ADVISOR_HEAD_RATIO = 0.6`，`thincoder-core/advisor/truncate.mjs:14`）→ 中段切 → 尾行累加至剩余预算（**裁决 / 结论行可见**）。
- 头尾之间省略注 + offset 续读提示保留；**绝不半行切开**；K=0 时不谎报截断。
- 实现落点：截断纯函数 `truncateAdvisorResult`（`thincoder-core/advisor/truncate.mjs`），唯一调用点 = `thincoder-core/advisor/loop.mjs:282`。
- advisor 上下文保护另有 `compactMessages` 兜底——放宽上限后不新增风险。

## 5. read 读回双端返回

`read` 工具对大文件 / offload 产物的读回（纯头向窗口尾不可见的剩余回路）：

- **判别锚**（`thincoder-core/tools/file.mjs:104`）：窗口截断（`windowEnd < total`）**且**文件行数 > `MAX_READ_LINES`（2000，`thincoder-core/tools/shared.mjs:21`）→ 双端分支。
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
| 落盘阈值 + preview 四常量 | `thincoder-core/agent/offload.mjs`（`TOOL_RESULT_OFFLOAD_LIMIT` · `TOOL_RESULT_PREVIEW` · `TOOL_RESULT_PREVIEW_HEAD` · `TOOL_RESULT_PREVIEW_TAIL`） | 在位 |
| offload 目录保留期 | `thincoder-core/agent/offload.mjs`（`TMP_RETENTION_MS` = 3 天） | 在位 |
| 双端切片（UTF-16 安全） | 头 = `thincoder-core/text-budget.mjs`（`safeSliceUTF16`，单源）· 尾 = `thincoder-core/agent/offload.mjs`（`safeSliceUTF16End`） | 在位 |
| preview 构造 | `thincoder-core/agent/offload.mjs`（`buildDualEndPreview`） | 在位 |
| 落盘主函数 + 写时自清理 | `thincoder-core/agent/offload.mjs`（`offloadToolResult` · 清理函数 `cleanupOldToolResults` 及其调用点） | 在位 |
| 主链路调用点（工具结果族） | `thincoder-core/agent/dispatch-run.mjs:148` | 非 multimodal 结果过守卫 |
| 报告族调用点 | `thincoder-core/agent-tools/subagent-async.mjs:389` | 无条件 `{ force: true }` |
| 共享文本额度纯函数 | `thincoder-core/text-budget.mjs`（`capText` · `appendCappedText` · `safeSliceUTF16` · `safeSliceUTF16Tail`） | 单一来源；`safeSliceUTF16` 消费 = `thincoder-core/memory/*` 三档 ∥ offload 头切片 ∥ setup doc_search 预览 |
| advisor 上限常量 | `thincoder-core/advisor/compaction.mjs`（`MAX_RESULT_CHARS`） | 由 `thincoder-core/advisor/run.mjs` re-export |
| advisor 双端截断 | `thincoder-core/advisor/truncate.mjs:14` · 调用 `thincoder-core/advisor/loop.mjs:282` | 头/尾预算行级累加 |
| read 双端返回 | `thincoder-core/tools/file.mjs:30`（`READ_TAIL_LINES`）· `:104`（判别）· `:111`（尾区起点） | `MAX_READ_LINES` = `thincoder-core/tools/shared.mjs:21` |

### 6.2 双端与测试

- **双端**：镜像面 = UTF-16 安全切片与双端预览（`safeSliceUTF16` · `safeSliceUTF16Tail` ∥ `buildHeadTailPreview`）——两端各存实现、语义同源（锁步镜像）；`read` 双端返回与 advisor 截断现体均在核内单源，无端面镜像。VSC 端坐标见 §6.3。

### 6.3 VSC 端实现坐标

> 与 CLI / 核面**同阈值同构成**。端独有保留 = 两段 UTF-16 安全切片器 + 双端预览构造 + 三常量（锁步镜像——单边改动会造成行为漂移，须两端同步）；其余面（落盘 / 自清理 / 失败回退 / advisor 截断 / read 双端返回）走核单源，端不另存实现。
> 坐标一律**符号名 + 档路径，不带行号**——行号随插删漂位，落笔即旧（D6 同法）。

| 面 | VSC 落点 |
|---|---|
| 落盘阈值 + preview 三常量 | `thincoder-vscode/src/agent/run-helpers.mjs`（`MAX_TOOL_RESULT` = 64 × 1024 · `TOOL_RESULT_PREVIEW_HEAD` · `TOOL_RESULT_PREVIEW_TAIL`——实际 = 预算 − head − noteLen，tail 优先） |
| 双端切片（UTF-16 安全） | `thincoder-vscode/src/agent/run-helpers.mjs`（`safeSliceUTF16` · `safeSliceUTF16Tail`） |
| preview 构造 | `thincoder-vscode/src/agent/run-helpers.mjs`（`buildHeadTailPreview`——head + 省略注 + tail 预算） |
| 落盘 + 写时自清理 | **端内无实现，取核单源** `thincoder-core/agent/offload.mjs`（`offloadToolResult` · `cleanupOldToolResults` · `TMP_RETENTION_MS`）；端侧唯一复用点 = `thincoder-vscode/src/extension/image-handler.mjs` import 核 `cleanupOldToolResults` |
| 失败回退 | 核 `offloadToolResult` 的 `catch` 支（端内无端实现） |
| 主链路调用点 | 核 `thincoder-core/agent/dispatch-run.mjs`（非 read_image 结果统一过落盘守卫——端已取核） |
| advisor 上限 + 双端截断 | **端内无 advisor 实现**（`thincoder-vscode/**/*advisor*` 无命中）⇒ 单源 = 核 `thincoder-core/advisor/compaction.mjs`（`MAX_RESULT_CHARS` = 64 × 1024）· `thincoder-core/advisor/truncate.mjs`（`truncateAdvisorResult` · `ADVISOR_HEAD_RATIO`）· 调用 `thincoder-core/advisor/loop.mjs` |
| 实时显示同宽 | `thincoder-vscode/src/extension/panel-callbacks.mjs`（`onToolResult` 内 `String(r ?? "").slice(0, 64 * 1024)`） |
| 历史页工具卡同宽 | `thincoder-vscode/src/extension/panel-session.mjs`（tool 卡 `slice(0, 64 * 1024)` · assistant 帧 `tools[].result` 同限 + `resultTruncated` 旗） |
| webview DOM 上限 | 实现单源 = `thincoder-render-core/lib.mjs`（`MAX_TOOL_OUTPUT` = 64 × 1024 · `capText`）；VSC 接入形 = 再导出 shim `thincoder-vscode/webview/lib.js` |
| read 双端返回 | 现体 = 核 `thincoder-core/tools/file.mjs`（`READ_TAIL_LINES` / 双端返回形态；`MAX_READ_LINES` = 核 `thincoder-core/tools/shared.mjs`） |

**VSC 侧差异注**：端内无独立落盘实现 ⇒ 提示语与路径格式只有核一套（超限 `[... output too large (N chars total), full content saved to: PATH …]`、报告族 ≤ 64K `[... full content saved to: PATH …]`），模型契约天然两端一致；`tail` **绝不硬编码**（实际 = 预算余量）两端同律。

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
