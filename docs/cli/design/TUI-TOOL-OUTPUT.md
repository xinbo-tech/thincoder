# TUI 工具输出（行间区块）· CLI 面 · 设计

> 板块 = **TUI 工具输出**——普通工具调用在 CLI 终端界面里的**行间区块**显示机制。
> 配对需求档 = `docs/cli/requirements/TUI-TOOL-OUTPUT.md`。
> 对位档 = **无**（VSC 侧无行间区块面——其工具面为 webview 卡片，非同机制；非同源镜像）。
> 建档：2026-09-15（**B 式迁移轮 · 第 6 批**——`thincoder-cli/docs/design/TUI-TOOL-OUTPUT.md` 内容重建入基准层；
> 旧档原地一字不改、留作参照历史。需求侧同批自 `thincoder-cli/docs/requirements/TUI-TOOL-OUTPUT.md` 迁入）。
> 本档坐标与行数 = **as-of 2026-09-15 实核**（仓根 = `thincoder/`）。

## 1. 定位与边界

- **行间区块 = 普通工具输出的唯一形态**：工具执行时在对话区产出「标题行 + 执行中滚动内容 + 完成行」，随会话流滚动。
- **工具面板区已废除**——不存在「面板 / 行间」双轨。权威注在实现侧：`thincoder-core/agent/dispatch.mjs:258` · `:315`
  （`Panel area abolished — all tools now stream inline via onToolOutput`）。
- **区块是 UI 层预览**：完整结果始终落 history（需求 FR4）；模型从 history 读完整结果，不读区块。
- **本档只覆盖普通工具输出路径**；子 agent / advisor / subagent 活动由专用分支承载（见 §7）。

## 2. 区块格式与生命周期

```text
❯ bash npm test (in thincoder)   ← onToolCall：标题行（工具色；可读关键参数摘要）
│ line1                           ← onToolOutput：滚动内容（追加进工具载体 body）
│ …
│ …                               ← 溢出折叠标记
❯ bash — done (1200ms) → 345 tests passed   ← onToolResult：载体状态改 done（摘要进头部）
```

- **数据路径**：`onToolOutput` → 追加进该工具的单框载体 `_toolBlock.output`（受 `TOOL_OUTPUT_LINE_CAP` 行截断）
  → 载体随 `onToolResult` 定态。
- **颜色**：title 用工具色（bash = 黄 warn / verify = 青 tool / advisor = 亮绿——映射见 `tool-events.mjs` 的 `onToolCall` 色表）；内容 dim。
- **历史持久化**：完整工具结果按落盘 / 截断机制进 history（需求 FR4）——区块只是预览面。

## 3. `onToolOutput(name, chunk)` chunk 契约

`chunk` 两形态：

| 形态 | 载荷 | 使用方 |
|---|---|---|
| **对象形态**（正式契约） | `{ kind, text }`，`kind ∈ think \| text \| tool` | advisor 等工具（有序多块流——`think` ↔ `tool` 交替靠 kind 区分渲染） |
| **裸字符串**（兼容形态） | stdout / stderr 原文 | bash 等工具 |

- **消费端归一化**（单行兜底）：`typeof chunk === "string" ? { kind: "text", text } : chunk`——TUI 统一归一后再分发。
- **新工具应优先发对象形态**（kind 显式，渲染面才能分流）。

## 4. 参数可见性（`thincoder-cli/src/tui/tool-args.mjs`）

- **单源摘要**：`describeToolArgs(name, args)`（`:18`）——按工具挑关键参数的可读单行
  （bash = 命令 + workdir；文件工具 = 路径 + offset/limit/edit 摘要；搜索 = pattern + path；未知 / MCP 工具 = 紧凑 JSON 80 截断）。
- **live 标题行**：`❯ name <可读摘要>`（`tool-events.mjs:153` 调用）——取代早期「原始 JSON 前 80 字符」（长路径截半不可读）。
- **恢复路径**：`[tool] name — <摘要>` 标题行 + **全量 pretty JSON 落 dim 行**（`toolArgsLines`，`:81`）——
  TUI 无悬停面，全量必须落行；超长由连续 dim 折叠收纳。畸形 args JSON 降级为原始串 dim 行，不崩。
- **两端对齐**：VSC 卡片头 name+args 截断 ≈ 标题行摘要；点击展开 body ≈ 全量 JSON dim 行。

## 5. 载体收尾与共享守卫

- **载体收尾语义分层**：普通工具结果落载体本体（`settleToolBlock(state, name, toolId, summary)`——`tool-display.mjs:105`）；
  **subagent / escalate / advisor** 的结果由专用分支承载（子 agent 冻结框 / 评审冻结框），但 dispatch 级载体仍需标 done
  ——统一收尾（否则回合清扫会把成功调用误标 `(interrupted)`）。
- **中断清扫**：`sweepToolBlocks(state)`（`tool-display.mjs:60`；agent-turn finally 调用，与 `freezeAllSubTasks` 并列）
  ——未 done 载体标 `done + interrupted` 并清计时。
- **`slimToolResultForDisplay(result, maxRows = 400)`**（`tool-display.mjs:82`，LIVE 与 RESTORE 共用）：
  ① `read_image` 等多模态结果剥离 base64 images 只留 text（模型侧图像走 multimodal 通道）；
  ② 超过 `maxRows` 截断（全文在 history）。恢复路径同函数——历史上缺此守卫时，恢复旧会话会重现 base64 洪水。
- **工具块宽度的组件 `cols` 纪律**：工具块展开 / 折叠态的组件调用**必须传 `cols`**（漏传 = 组件按默认 80 wrap，生成中「左边一小块」）。
- **中断配对**（`thincoder-core/agent/dispatch.mjs` 工具执行）：工具执行中 Ctrl+I——已提交的 assistant tool_calls 先合成占位 tool 结果
  （`[Tool execution interrupted — results discarded]`）再注入中断消息，保证重试轮历史可配对（strict provider 否则 400）。

## 6. 具名输出上限常量

单源 = `thincoder-cli/src/tui/tool-display.mjs`（与 TUI 显示层额度族并列——`docs/cli/design/TUI-SESSION-VIEW.md` §5）：

| 常量 | 值 | 面 |
|---|---|---|
| `TOOL_OUTPUT_LINE_CAP` | 200 | 输出环条目数（`:24`） |
| `REMINDER_CAP` | 3 | 回合末提示行数上限（`:25`） |
| `REMINDER_PERSIST_TURNS` | 5 | 提示落盘节流（每 N 回合，`:26`） |
| 预览行数上限 | 8 | 子 agent 预览尾部行数（`SUBAGENT_PREVIEW_LINES` 族——改由显示层额度族管辖） |
| 预览行宽 | 120 | 预览行字符上限（`PREVIEW_LINE_CHARS` 族） |

> 字符维度额度（行 / 载体字符双维）见 `docs/cli/design/TUI-SESSION-VIEW.md` §5（`thincoder-cli/src/tui/display-budget.mjs`）——本档不重述（D2）。

## 7. 边界划清：普通工具输出 vs 子 agent 活动

- 普通工具（bash / read / verify 等）走本档的行间区块路径（`onToolOutput` → 工具单框载体 `_toolBlock` → done 行），
  **不经过** `state.subTasks`。
- `subTasks` 只承载带 `role#id/` 前缀的子 agent 活动——两条路径的数据结构与渲染分支完全分离。
- 消费端分流（`thincoder-cli/src/tui/tool-events.mjs` 的 `onToolOutput`）：advisor 特判进 `_advisorBlocks`；
  带前缀的子 agent 输出经 `routeSubToolOutput` 进对应区块；其余进工具单框载体。
- 子 agent 活动区块的机制面 = `docs/cli/design/TUI.md` §6（本档不覆盖）。

## 8. 不并项与历史沿革

### 8.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-cli/docs/design/TUI-TOOL-OUTPUT.md`——**原地保留作参照历史**（保留 ≠ 维护）。下列内容不并入本档：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 旧档档头状态行 | 「已实现」时点声明 + 需求层已迁出注 | 批次语境——现行态即本档正文 |
| 旧档 §「测试（验收标准与用例）」 | AC1–AC4 + 用例表 T1–T7 | 一次性批次材料（验收已完成）——机制不变量已提炼入本档 §2–§5 |
| 旧档 §「变更记录」 | 逐批流水（2026-08-01 过渡期设计面板方案 / 08-29 定稿 / 08-30 单框化 / 09-07 格式债） | 历史叙述——本档自有变更记录 |
| 旧档「面板区废除」前的过渡期设计 | 设计面板方案（已废形态） | 已废结构——现行态零面板，正文即结论 |

### 8.2 不并项登记（跨板块 / 一次性材料——**不并**，逐项登记）

| 旧档面 | 内容 | 何故不并（去向 / 触发） |
|---|---|---|
| 需求层条目 | FR1–FR4 / NFR1–NFR2 | 需求面——落 `docs/cli/requirements/TUI-TOOL-OUTPUT.md`（本档只留设计层） |
| 落盘阈值权威 | `TOOL_RESULT_OFFLOAD_LIMIT` 等 | 机制权威 = `docs/core/design/TOOL-OUTPUT-LIMITS.md` 与 `thincoder-core/agent/helpers.mjs`——本档只挂指针 |
| 子 agent 活动显示 | 冻结框 / 面板 / 路由 | `docs/cli/design/TUI.md` §6——本档只划边界（§7） |

## 变更记录

- 2026-09-15（**B 式迁移轮 · 第 6 批**）：建档——`thincoder-cli/docs/design/TUI-TOOL-OUTPUT.md` 内容重建入基准层（旧档一字未改、原地作参照历史）。
  ① 落点 = `docs/cli/design/`（P2：CLI 终端界面结构性只属 CLI；VSC 无行间区块面）；
  ② 坐标全量改**现状路径**并实核（`thincoder-cli/src/tui/**` · `thincoder-core/agent/dispatch.mjs`）；
  ③ 旧档「测试 / 用例 / 变更流水」入 §8.1（不并）；④ 字符维度额度的详述挂 `docs/cli/design/TUI-SESSION-VIEW.md` §5（D2 单一权威源）。
