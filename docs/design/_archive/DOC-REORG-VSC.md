> **变更史——正文冻结**（2026-09-10 文档重组批）：本档为一次实施批的过程记录或已被取代的旧权威档，
> 内容 as-of 交付时点，**不作为现状依据**。现状见 `docs/README.md` 地图指向的板块权威档。

# VSC 文档重组——ARCHITECTURE 拆分 + 双端结构对齐（DOC-REORG-VSC）

> 板块：结构债（VSC 文档组织重构——`thincoder-vscode` 独立代码树）。状态：**已执行（2026-09-08 交付——重组落地：ARCHITECTURE §13 MCP 行展开成档 MCP.md（第 5 批实证——VSC MCP.md 变更记录）等——双树结构对齐）**。前置：CLI `DOC-REWRITE.md`（判据引用）+ explore 对照报告（2026-09-08，双端 docs/design 结构对照）+ 用户裁定。

## 1. 问题与目标

1. **VSC 单体过大**：`docs/design/ARCHITECTURE.md` 886 行/43KB，把大量机制正文（会话/Provider/Agent 循环/工具/子代理/评审/上下文压缩/webview）塞进单文件——不可维护、难对比。
2. **双端结构不对位**：CLI 45 文档（一板块一档），VSC 19 文档（机制都堆在 ARCHITECTURE）。共有机制板块缺独立同名文件，无法双端对比。

目标：
1. **拆 VSC ARCHITECTURE** 为薄枢纽 + 按机制分板块。
2. **双端共有机制板块同名文件、各自独立完整**——各自从自己代码实现出发写全正文，**不互指、不复制共享、不做指针镜像**（用户裁定：防漂移理论无效，交叉引用越多 agent 越不看；两份各自独立）。
3. 独有板块各留各的（CLI 有 TUI/ACP/流程，VSC 有 WEBVIEW/SETTINGS/PROJECT-SWITCHER——正常不对齐）。

## 2. 用户裁定（2026-09-08，固化）

- **两端文档盒子独立**：不做"指针 + CLI 权威"镜像模式。同机制两端各写各的完整正文，靠**同名文件**自然对齐便于对比。文件头可注"与 CLI 同名文档对应"作对比辅助，但不依赖交叉引用。
- **无跨端共享契约档**：SESSION 等不合并成两端共同文档，各自独立（两边可以一样，但不并在一起）。
- **独有板块正常**：CLI 有 VSC 没有的板块（TUI/ACP 等）、VSC 有 CLI 没有的（WEBVIEW/SETTINGS/PROJECT-SWITCHER 等）——不追求板块全集或文件数一致，只对齐"共有板块"。

## 3. VSC 目标文件结构（拆分后）

### 3.1 薄 ARCHITECTURE（瘦身后保留）
原则（§1）+ 整体架构图（§2）+ 模块地图（§3，维护寄存器在 AGENTS.md）+ **与 CLI 差异表（§14）** + 变更记录。估 8-15KB。

### 3.2 机制板块独立成文（从 ARCHITECTURE §4-§13 迁出正文，各自写全 VSC 实现，与 CLI 同名）

| 新档 | 来源（ARCHITECTURE 节） | 内容（VSC 独立写全） |
|---|---|---|
| `AGENT-LOOP.md` | §6 主循环 + §8 子agent/后台池 + §8.3 eng-coder 交付 | Agent 循环/工具调度/子代理动作面/async 池/挂起/收敛 |
| `TOOLS.md` | §7 工具系统 | 工具接口/VS 适配/工具清单/审批 |
| `PROVIDER.md` | §5 Provider 面 + **并 RESPONSES-TRANSPORT.md**（用户裁定③并入） | Provider/transport/预设表/responses |
| `SESSION.md` | §4 会话持久化 | VSC 本地会话存储独立完整（session-io/slots/GC/恢复） |
| `CONTEXT-COMPACTION.md` | §10 | 上下文压缩/阈值/策略 |
| `MEMORY.md` | §13 扩展点 Memory 行 | 三层记忆（VSC 文件式 markdown 实现） |
| `ENGINEERING-MODE.md` | §9 | 工程模式/eng token/会话级开关/guard |
| `ADVISOR-CONVERGENCE.md` | §9 评审收敛 | 评审收敛/铁律 R1-R7 |
| `MCP.md` | §13 MCP 行 | MCP 机制 |
| `CHECKPOINT.md` | §13 Checkpoint 行 | 快照/回滚 |

**VSC 独有档（不与 CLI 对齐——评审 #3 单列）**：`WEBVIEW.md` = §11 + §12（webview 布局 + **消息协议** + 活动面板——消息协议并入，用户裁定④）。

### 3.3 结构位置保持（文件不移动/不改名；机制内容照旧）
`REQUIREMENTS` / `PHILOSOPHY` / `RELEASE` / `README` / `CONSULTATION` / `ESCALATE` / `TURN-CAP-CONTINUE` / `SETTINGS`（VSC 独有面板）/ `PROJECT-SWITCHER`（VSC 独有）+ 4 专题对 REQ/TUN。
> 注：README 地图内容会被修改（§5/AC5——增登记新档），此处"保持"指文件位置/命名不动，非内容冻结（评审 #2 澄清）。

### 3.4 结果规模
VSC 19 → 约 28-30 档（净增 ~10 机制档 + WEBVIEW，RESPONSES 并入减 1）。ARCHITECTURE 886 行 → 薄枢纽。

## 4. 等位对齐纪律（双端对比的保证）

- **共有机制板块 = 同名文件**（AGENT-LOOP/TOOLS/PROVIDER/SESSION/CONTEXT-COMPACTION/MEMORY/ENGINEERING-MODE/ADVISOR-CONVERGENCE/MCP/CHECKPOINT + 已同名的 CONSULTATION/ESCALATE/TURN-CAP/专题对）。
- **各自独立完整**：每端从自己代码实现出发写正文，内容可不一致（体现各自真实实现差异），但**板块定位/命名对齐**便于 diff 对比。
- 文件头统一加对比注（可选）：`> 与 CLI（或 VSC）同名文档对应同一机制板块——各端独立实现，内容以本端代码为准。`——只作对比辅助，非权威引用。
- **不复制**：迁出正文从 VSC 自己的 ARCHITECTURE §4-§13 取（那是 VSC 既有实现描述），不从 CLI 文档抄。

## 5. 受影响文件（全部在 thincoder-vscode）

- 修改：`docs/design/ARCHITECTURE.md`（886→薄枢纽）、`docs/design/README.md`（地图增登记新档 + 更新板块归属）
- 新建：AGENT-LOOP / TOOLS / PROVIDER / SESSION / CONTEXT-COMPACTION / MEMORY / ENGINEERING-MODE / ADVISOR-CONVERGENCE / MCP / CHECKPOINT / WEBVIEW.md
- 删除：RESPONSES-TRANSPORT.md（内容并入 PROVIDER.md）
- AGENTS.md 若模块图/引用段指到被拆的 ARCHITECTURE 章节 → 同步重指（父侧核对）

## 6. 逐字契约保真 + 漂移（引用 CLI DOC-REWRITE §3/§4/§8 判据）

同批判据：无 >300 行 / markdown 正确 / 逐字锚句保留 / 漂移更新 / 历史折叠随正文迁。**迁出是移动非改写**——ARCHITECTURE 正文块原样移入新档（各档再按需重组当前态），从 ARCHITECTURE 删块防双份。
**模块 Split Policy**：先在新档写入移动段（verbatim），再从 ARCHITECTURE 删对应节——任何时刻正文有且仅一份。
**AC3 compare 快照（评审 #5）**：byte-exact 对比以**迁移前 ARCHITECTURE 原始状态**为源（先打快照再迁，防删后无法 compare）——各新档重组非锚句正文可改，但锚句须 byte-exact。

## 7. 执行模型

1. 本执行设计经 advisor 一次 design 评审签发一个 token。
2. 分批 eng-coder（每批 1-3 板块，控制跨仓指针/断链风险——不整仓一次搬完）：先迁出机制档（AGENT-LOOP/PROVIDER/SESSION 等大板块独立或小批），再 WEBVIEW + 薄 ARCHITECTURE 瘦身 + README 地图更新。
3. 每 eng-coder 任务书引用：本执行设计 + CLI DOC-REWRITE §3/§4/§8 判据 + 来源 ARCHITECTURE 章节 + 目标档内容要点。
4. 交付审计 + 内审同前批。

## 8. 验收

AC1 = 拆分后各文件无 >300 行（check-doc-width.mjs；薄 ARCHITECTURE 若 §14 差异表使总量逼近限制则先瘦表——评审 #4）；AC2 = markdown 正确；
AC3 = 迁出锚句 byte-exact 未改（compare 源 = 迁移前 ARCHITECTURE 章节快照）；AC4 = ARCHITECTURE 瘦身为薄枢纽（§4-§13 机制节迁出，无残留双份）；
AC5 = README 地图登记全部新档 + 板块归属对齐 CLI；AC6 = 每 VSC 机制档含 ≥1 条本端实现接线描述（非指针空壳——评审 #1：grep 有 VSC 特有符号 / 非"仅见 CLI §x 指针"）。

## 变更记录

- 2026-09-08：立项。基于 explore 双端对照报告 + 用户裁定写本执行设计。用户裁定固化：①两端独立盒子不做指针镜像 ②无跨端契约档各自独立 ③RESPONSES-TRANSPORT 并入 PROVIDER ④消息协议并入 WEBVIEW ⑤独有板块正常不对齐。
- 2026-09-08 评审：签发 token。采纳：AC6 定义代理（含 ≥1 本端接线）+ §3.3 "保持"措辞澄清（位置非内容）+ WEBVIEW 移出同名表单列 + ARCHITECTURE 规模防限注 + AC3 用迁移前快照为源。
