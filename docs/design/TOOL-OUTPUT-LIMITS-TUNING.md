# 工具输出长度限制调整 — 设计（CLI）

> 状态：**已实现**（2026-08-24 评审修订后实施；npm 0.12.43）
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
- 失败回退截断 `text.slice(0, TOOL_RESULT_OFFLOAD_LIMIT)` 自动跟随新阈值（无需单独改）——**supersede 注（2026-09-04 §5——评审 #3）：回退路径已与 §5 一致改为双端切片——见 T-4.4——本节为旧时点描述。**
- 主循环上下文成本：preview 放大后每次落盘结果最多 64K 进模型上下文，由既有 compaction 机制兜底（评审 #8，与 advisor 侧 compactMessages 同构）。
- preview = 阈值：≤64K 不落盘直接全文进上下文；>64K 落盘并内联前 64K——模型在任何情况下都能看到前 64K，与 webview 显示上限一致。——**supersede 注（2026-09-04 §5）：预览构成已修订为"头 16K+尾 48K"双端切片——见 §5——本节为 2026-08-24 时点描述。**

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


## 5. 预览保头保尾修订（2026-09-04 · 用户拍板 A——源码实证 + 用户观察）

> **需求登记互引（round1 评审 #8）**：本需求句（F-4.1）已登记等效表述于 TOOL-OUTPUT-LIMITS-REQUIREMENTS.md（板块需求文档）——本文档为设计层（含需求层概述）——两文档互引。

> 状态：**已实现（2026-09-04——用户"A"——设计评审 0🔴（round1——token 3cf5755e/designId 9710e11f——1🔴+2🟡+5🔵 处置全落——🔴 AGENT-LOOP:70 父侧已修）——用户批准（"直接"）——实现：CLI id:11（clean——L1 1311/0——T-4.1..4.4 全绿）+ VS Code id:12（clean——L1 1056/0——run-helpers.mjs 独立 offload 已同改）——父侧 L2 核销：CLI 1359/1359 + VS Code 1056/1056 全绿（2026-09-04））**。

**问题（P-2.1）**：>64K 工具结果 → 落盘 + **头 64K 预览**——①预览占 64K 上下文仍大；②**结果在尾部的输出（测试统计/错误尾/结论句）被截掉**——模型读不回结果 → read 回全文（炸）或重跑（浪费）；③与同项目"保头+保尾"策略（压缩/蒸馏）不一致。

**需求（F-4.1）**：作为用户，我希望超长工具输出的**预览含尾部**（结果/统计/错误所在）——模型不读回不重跑——从"截断负优化"变"截断正优化"。

- **F-4.2（保头保尾）**：>64K 预览 = **头 16K + 中间省略注 + 尾 48K**（总 64K 不变——AC4 保持——尾部优先——统计/错误/结论天然在尾）；
- **F-4.3（防读回再炸）**：read 工具读落盘文件……**本批不做**（C 方案——独立后续——read guard 12MB 已有——无第二截断——记 TODO）；
- **N-4.1（零破坏）**：落盘全文不变（磁盘全量——AC2 保持）；阈值 65536 不变（AC1/AC5 保持）；预览总长 ≤ 65536（AC3 保持——构成变化：头 16K + 注 + 尾 48K）。

**设计（D-4.1）**：`helpers.mjs offloadToolResult` 预览段改双端切片：

```js
const TOOL_RESULT_PREVIEW_HEAD = 16 * 1024     // head slice preserved
const TOOL_RESULT_PREVIEW_TAIL = 48 * 1024     // tail slice preserved (results/errors/stats live here)
// 预算（round1 评审 #2 定死）：head + tail + 省略注 + 分隔符 ≤ 65536——tail 优先（tail = 65536 − head − noteLen——注约 44 chars——tail 实为 65536 − 16384 − 44 ≈ 49100——实现以常量计算非硬编码）
// preview = head + `\n\n… [middle omitted: ${omitted} chars] …\n\n` + tail（两端均经 safeSliceUTF16——防代理对切开——评审 #5）
```

- **D-4.2（与既有策略一致）**：context.mjs 压缩/蒸馏 **同款**（keep head + tail——中间省略注）——统一口径；
- **D-4.3（回显处）**：dispatch.mjs:308 / subagent-async.mjs:920 / pdf.mjs:97 的 offload 调用点不变（函数内部行为改——调用点零改——N-4.1）——**VS Code 端核对结论（2026-09-04 id:11 审计核实）：VS Code 确有独立 offload（run-helpers.mjs:170——buildHeadTailPreview/safeSliceUTF16Tail:81-151——双端实现已同语义随 id:12 落地——本设计问号落定为"有独立 offload 且已同改"）**；
- **D-4.4（提示语保留）**：`[... output too large (${text.length} chars total), full content saved to: …]` 提示语不变（模型知道全文在盘——需要完整时定向读——但预览已含尾部——多数场景无需读回）。

**受影响文件**：CLI `src/agent/helpers.mjs`（preview 双端切片）+ 测试（id:11 落 `test/agent.test.mjs`——既有 offload 测试同文件）+ 文档本段。**VS Code 端：有独立 offload（run-helpers.mjs——id:12 同改——同语义——两端 lockstep 口径）**。**文档**：TOOL-OUTPUT-LIMITS-TUNING.md（本节）+ TODO（C 方案条目——read 读回防炸）。

**测试（T-4）**：
| # | 类别 | 输入 | 预期输出 |
|---|---|---|---|
| T-4.1 | N | 65_537 字符（头"AAAA…"+ 尾"ZZZZ…"）→ offload | 预览含 "AAAA" 头段 **与** "ZZZZ" 尾段（双端都在）——中间省略注在——总长 ≤ 65536 + 路径 |
| T-4.2 | E | 恰好 16K 头后立即超限 | 头段保留——尾段出现——省略注在（双端切片边界） |
| T-4.3 | E | 65536 字符（不超限） | 原样返回（AC1 回归——不快路径破坏） |
| T-4.4 | A | 落盘失败 | 回退截断**同用双端切片**（头+省略注+尾——无路径提示——与主路径同口径——round1 评审 #3——既有 catch 路径升级——不再头截断——AC5 回归（清理/保留/目录缺失不变）） |

**验收（AC-4）**：AC-4.1 = T-4.1 绿（预览含头+尾）；AC-4.2 = AC1/AC2/AC3/AC5 回归绿（阈值/落盘/总长（**head+tail+注 ≤ 65536——#2 定稿**）/清理不变）；AC-4.3 = 既有 offload 测试零破坏；AC-4.4 = 提示语/路径格式不变（模型契约稳定——读回依赖不变）。——**round1 评审 #6 范围注**：advisor 截断（MAX_RESULT_CHARS=64K line-aware）头向——不受本批影响——另议/记 TODO（实现批核实其截断方向）。
