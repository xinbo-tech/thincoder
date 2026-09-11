# CLI TUI 长会话堆 OOM · 根因修复批（TUI-OOM-ROOTCAUSE）· 批次记录（2026-09-11）

> 六段 append-only，一段一作者。编制：主 agent · 2026-09-11 23:46 · 来源 = 用户同事实测（OOM 崩溃截图）+ 用户 23:43「自动推进到排空」；勘察 = explore#7 全量报告（已核事实见下）。
> 姊妹批：`2026-09-11-TUI-OOM-FORENSICS.md`（取证固化——堆快照参数，另链在飞）；本批 = **根因修复**。

---

## §1 讨论（主 agent 记）

### 状态

**已收口 2026-09-11**（用户授权自动推进）。下一步 = **设计**（spawn eng-designer）。

### 事故

CLI TUI 会话 ~19.4 分钟（1,166,708ms）后 **Node 堆 OOM**（`Ineffective mark-compacts near heap limit`，堆 ~8192MB——爬升型）；次生：进程 abort（V8 fatal 不走 JS 钩子）→ `mouseOff` 未下发 → 终端持续上报鼠标序列（滚动飞数字串——**机制已确证**）。

### 勘察结论（explore#7——7 候选 + 上界审计；以下 file:line 均已实测）

**无「单个一炸就 8GB」的显式泄漏**；最可疑 = **三处结构性无界 + 一处分乘数**：

| # | 候选 | 证据 | 无界性 | 8GB 主导性 |
|---|---|---|---|---|
| **C1** | `agent._fullHistory` **永不压缩**（机器线被压缩掉的内容全留此处；注释自认「单条工具结果可几百 KB–MB」） | `context.mjs:163-180`（pushReal 双线）· `:183-200`（compaction 只重建 history）· 仅 3 处重置（`session.mjs:415`/`:292`/createAgent）· `read-history.mjs:276-277` | 高 | 中 |
| **C2** | **子代理 child 各自一份 history/_fullHistory + `_capturedOutput` 无上限**；整对象被池/待消化容器持有（settle→消化窗口内驻留） | `subagent-spawn.mjs:332` · `subagent-run.mjs:133`（entry.childAgent=child）· `async-settle.mjs:163-177` · `run-stages.mjs:226-241`（suspDriven=true 留池）· `spawn-child.mjs:208-217`（output += 逐 token 无 cap） | 高 | 中高（乘数） |
| **C3** | TUI 显示层**行数上限 ≠ 字节上限**；多条 push 路径绕过裁剪（pushLabel/toolBlock/frozenAdvisor/frozenSubTask/unshift）；同内容堆内 2–3 份 | `index.mjs:278-289`（仅 pushLine 裁剪）· `tool-events.mjs:128-141/264-268`（_frozenAdvisor:text 无上限）· `subagent-children.mjs:19` · `tool-display.mjs:21/77` · `subagent-blocks.mjs:338-356`（raw 拼接——单超长行只记 1 行永不 trim） | 部分 | 中低（放大） |
| C4 | trace 每次 LLM 调用**深拷贝全上下文**（fire-and-forget·默认 on）+ 检索**全表向量加载** | `trace-store.mjs:141-197/110-112` · `setup.mjs:100-124` · `memory/core.mjs:60-68` · `memory/docs.mjs:112-116` | 在途份数无界 | 中（尖峰） |
| C5 | `/undo` 快照按条数封顶 50、**字节无界**（无 read 的 10MB 守卫） | `cmd-undo.mjs:12/18-42` · `dispatch.mjs:357-358` | 高 | 中低 |
| C6 | `_advisorRuns` 实例只整体重置、无逐实例删除 | `advisor-async.mjs:104-137` · `eng.mjs:37/55` | 无 | 低 |
| C7 | 小容器族：`_asyncTombstones`/`_turnControllers`/`_frozenSubKeys`/`expandedBlocks`/capturedConsole 拼接（**可突破 64K**——`dispatch.mjs:428-432` 在 offload 之后拼） | 见勘察 §C7 表 | 无 | 低 |

**防线实测（关键）**：
- **「落盘 ≠ 不占堆」成立**：≤64K preview 永久留 `_fullHistory`（C1）+ TUI 再存一份（C3）；
- **compaction 只压机器线**，对 `_fullHistory` 无效；
- 显示层裁剪 = 计数型且非唯一 push 路径；
- **全进程无堆遥测**（`process.memoryUsage()` 全仓唯一出现点 = 崩溃写档 `crash-reports.mjs:91`；无 `--max-old-space-size`/无周期检查）——「炸了才知道」；
- 监听器泄漏/失控循环/指数复制：**明确否定**（四处监听器路径全干净）。

### 范围（用户授权自动推进——按父侧建议 A+B；C 档登记后续）

- **A 档（必做）**：C1 上界 + C2 上界 + **堆遥测/看门狗**（事前预警——补「全进程无遥测」缺口）。
- **B 档（同批）**：C3 字节维度上界 · C4 trace 在途拷贝收敛（+检索加载面）· **崩溃后终端恢复**（父包装器写恢复序列——修鼠标数字串次生面）。
- **C 档（登记，不在本批）**：C5/C6/C7 小项。

### 设计约束（评审会查）

- **语义取舍（最重要）**：`_fullHistory` 是会话落盘 + `read_history` 的账本——**不能简单丢弃**；C1 修法须保「人类线可读记录」语义（候选方向：分段落盘/冷存 + 内存内保窗口/摘要索引——由设计选型论证）。
  **用户 23:48 输入（已核事实）**：CLI **显示层懒加载在且稳**——`startup.mjs:7-11`（首屏末段 + `HISTORY_PAGE_MESSAGES = 20`）+ `:147-163` `loadOlder` 分页（PgUp 到头/滚到顶自动触发；2026-08-31 系列提交专门修过：卡顿根治/自动触发/穿出边界/段级缓存）；**但分页源 `full` 是全量在内存的数组**（`:147` `full.length - loaded - PAGE`）——**内存层无懒加载**。
  **设计要求**：正视「分页源改为磁盘」的迁移路径（磁盘为准 + 内存窗口 + loadOlder 从盘取页 + `read_history`/落盘改走磁盘）——含 `read_history` 语义、落盘完整性（append-only）、恢复速度、VSC parity 影响评估。
  **用户裁定（2026-09-11 23:49「我觉得按这个方向做吧」）**：**C1 修复方向 = 磁盘为准 + 内存窗口（懒加载下沉到内存层）**——方向已定，设计不再对方向做选型；实现级细节（迁移路径/分段粒度/索引形态/read_history 兼容）仍逐项给候选对比与论证。
- C2 修法注意「digest 完整性」——`_capturedOutput` 是报告来源，截断≠丢失报告（落盘先例可循）；
- 可移植性：看门狗/遥测凡涉项目约定（如阈值/目录）须通用化 + 可关（env/config）；
- 机验：上界类修复须可测（模拟增长 → 断言有界）；遥测须可注入（测试缝）；
- 证据链：同事物证（Node report JSON + tui-stderr 日志）待取回——**设计按现勘察推进，物证到达后回填归因**（爬升型 vs 尖峰型）。

### 范围外

- 取证固化（堆快照参数——姊妹批）· VS Code 端（本批 CLI 单端）· V8 堆上限默认值调整。

---

## §2 批次任务（eng-designer 写）

_（待写——eng-designer）_

---

**状态：任务书就绪**（2026-09-11——需求/设计/测试三层已落档；待设计评审 → 用户批准 → 实施）。实施者 = eng-coder（设计 token 门）。本 §2 = coder 任务书本体（不另写副本；选型/契约/用例/AC 全文在设计档，本段只做任务书）。上方「（待写——eng-designer）」占位行为 append-only 工具面既有行（不改）。

**落档位置**：
- 需求 = `docs/requirements/SESSION.md` §14.1（A1/C1）+ `docs/requirements/AGENT-LOOP.md` §15（A2/C2 + B2-trace）
  + `docs/requirements/CRASH-REPORTS.md` F4/F5 + N5/N6（A3/B3）+ `docs/requirements/TUI.md` F6 修订 + N10（B1 + 分页源）
  + `docs/requirements/MEMORY.md` §6（B2-检索）+ `docs/requirements/CONTEXT-COMPACTION.md` F3 括注。
- 设计+测试 = `docs/design/SESSION.md` **§14 全节**（A1/C1 主设计）/ `docs/design/AGENT-LOOP.md` **§23**（A2 + B2-trace）/ `docs/design/CRASH-REPORTS.md` **§8 + §9**（A3/B3）/ `docs/design/TUI.md` **§15**（B1 + 分页 TUI 落点）/ `docs/design/MEMORY.md` **§10**（B2-检索）/ `docs/design/CONTEXT-COMPACTION.md` §6.2 指针行。

**本批覆盖的条目**（三方一致——本节条目 = 设计档 AC 回指 = 需求档条目）：

| # | 条目 | 需求面 | 设计 / AC 面 | 一句话 |
|---|---|---|---|---|
| A1 | 人读线磁盘为准 + 内存窗口（C1） | SESSION §14.1 F-S1–S6 / N-S1–S6 | SESSION §14 · AC-RS1–AC-RS10 | 分段 append-only sidecar（100 条/段）+ 200 条内存窗口 + pushReal 单点追加 + 翻页/本会话检索走盘 + 槽 JSON 全量投影（流式拼接）+ 生命周期联动 |
| A2 | 子代理族上界（C2） | AGENT-LOOP §15 F-O1–F-O3 | AGENT-LOOP §23 · AC-O1–AC-O3 | 子代理人读线窗口（复用）+ `_capturedOutput` 滞后水位截断 + 消化注入后释放 childAgent/report |
| A3 | 堆遥测/看门狗 | CRASH-REPORTS F4 + N5/N6 | CRASH-REPORTS §8 · AC-HW1–AC-HW3 | 60s 采样 + 堆上限比例双档（70/85%）边缘触发预警（stderr + TUI 行 + 事件日志；默认开 / env 可关 / 注入缝） |
| B1 | TUI 显示层额度 | TUI N10 | TUI §15 · AC-TB1–AC-TB6 | 行 + 载体（args/result/output/子块/评审/流式）+ `state.lines` 总量三维字符额度；文字截断 + 既有省略标记语义 |
| B2 | trace 在途收敛 + 检索加载上界（C4） | AGENT-LOOP §15 F-O4/F-O5 · MEMORY §6 F-M1–F-M3 | AGENT-LOOP §23 · AC-O4/O5 · MEMORY §10 · AC-M1–AC-M4 | 轨迹单遍序列化 + 双层额度 + 在途上限 8（丢弃计数）+ seq 缓存；检索分块扫描 + 有界 top-K |
| B3 | 崩溃后终端恢复 | CRASH-REPORTS F5 + N6 | CRASH-REPORTS §9 · AC-RT1–AC-RT3 | 包装父在子进程非零/信号退出时补发 `RECOVERY_SEQUENCE`（序列单一来源；正常退出零干预） |
| C | C5/C6/C7 登记（不在本批） | —（登记项，见下） | SESSION §14.8 登记项 | `/undo` 字节上限 / `_advisorRuns` 回收 / 小容器族——转 `docs/TODO.md` 技术待办（主 agent 落档） |

**实现分组（写域声明——供父侧排程；files 声明收窄用）**：

| 组 | 内容 | 文件域（file 级） |
|---|---|---|
| 组 1 | A1/C1 记录存储 | `src/session-store.mjs`（新）· `src/session.mjs` · `src/context.mjs` · `src/session-gc.mjs` · `src/agent-tools/read-history.mjs` · `src/generate-title.mjs` · `bin/thincoder.mjs` · `src/tui/startup.mjs` · `src/tui/index.mjs` · `src/tui/cmd-session.mjs` · `src/tui/cmd-new.mjs` · `src/acp.mjs` · `test/session-store.test.mjs`（新）· `test/integration/session-resume.test.mjs` |
| 组 2 | A2 + B2-trace | `src/text-budget.mjs`（新）· `src/agent/spawn-child.mjs` · `src/agent-tools/subagent-spawn.mjs` · `src/agent-tools/async-settle.mjs` · `src/agent/run-stages.mjs` · `src/agent.mjs` · `src/tui/suspension-drive.mjs` · `src/agent-tools/escalate-async.mjs` · `src/traces/trace-store.mjs` · `test/subagent-memory-bounds.test.mjs`（新）· `test/trace-bounds.test.mjs`（新） |
| 组 3 | B1 显示层额度 | `src/tui/display-budget.mjs`（新）· `src/tui/tool-events.mjs` · `src/tui/tool-display.mjs` · `src/tui/tool-args.mjs` · `src/tui/subagent-children.mjs` · `src/tui/subagent-blocks.mjs` · `src/tui/key-handler-search.mjs` · `src/tui/index.mjs`（pushLine/pushLabel 额度部分）· `src/tui/startup.mjs`（行额度部分——分页接线归组 1）· `test/tui-memory-budget.test.mjs`（新） |
| 组 4 | A3 + B3 | `src/heap-watch.mjs`（新）· `src/tui/tui-lifecycle.mjs` · `src/tui/wrapped-spawn.mjs` · `test/heap-watch.test.mjs`（新）· `test/tui-stderr-capture.test.mjs` |
| 组 5 | B2-检索 | `src/memory/scan.mjs`（新）· `src/memory/core.mjs` · `src/memory/docs.mjs` · `src/memory/code-sync.mjs` · `test/memory-scan-bounds.test.mjs`（新） |

**同文件跨组点（排程注意）**：`bin/thincoder.mjs`（组 1 + 组 4：`applySession{slot}`/描述符 与 看门狗武装行）；`src/tui/index.mjs`（组 1 描述符接线 + 组 3 pushLine 额度 + 组 4 看门狗订阅）——按调度器 files 域排队自动串行；先落者先并、后落者 rebase。

**行数 as-of（2026-09-11 实测；口径 `split("\n").length` 含末行）**：各设计档 §"受影响文件"表全文在案
（SESSION §14.5 / TUI §15.5 / AGENT-LOOP §23.5 / MEMORY §10.5 / CRASH-REPORTS §8.5+§9.5）。
>300 咨询线登记（不拆）：`read-history.mjs`（~330）· `startup.mjs`（~291）· `core.mjs`（~311）·
`subagent-spawn.mjs`（457）· `agent.mjs`（420）· `escalate-async.mjs`（292）。全部 ≤500 硬限。

**零改核对项**：`src/prompts/**` 零改 · `src/session-slots.mjs`（490——零改，投影原子写实现住 store 模块）· VSC 仓零改（N-S3 红线）· `docs/TODO.md` / `CHANGELOG.md`（父侧）· `docs/**`（写稿面 = 设计者；本批文档已落档）。

**交付要求**：

1. 实现 = 设计档逐条契约——语义争议回设计档，不自行改语义（撞墙 → 停下报告，不静默偏离）。
2. 测试：各新档用例表 1:1（AC 逐条回指）；既有锁档零伤（各 AC「零回归」行点名族）。
3. 验证分层：L0+（语法 + 定向 `node --test <各新档 + 既有族定向>`)；不跑全量（父侧 L2）。
4. 报告：交付透明表（Done / Simplified / Not done）+ 逐条 AC 机验证据（命令 + 结果）+ 触碰档实测行数（口径同上）。
5. **物证回填钩**（设计 SESSION §14.10）：同事 Node 报告 + tui-stderr 日志到达后——归因回填落 `docs/design/SESSION.md` §14.1 表（设计者动作，非 coder 域）；本批实施不受其阻塞。

**边界（不做）**：不改槽 JSON version/形态/路径（VSC 红线）· 不改机器线压缩/保存策略 · 不做 sidecar 跨端协议 · 不做显示层按需回读交互 · 不做向量索引/近似检索 · 不做强制 GC/自动快照/系统通知 · 不做 VSC 端任何改动 · 不 commit。

**呈父侧确认（未确认面）**：

1. **与姊妹批 TUI-OOM-FORENSICS 的协同**：`src/tui/wrapped-spawn.mjs` 与 `docs/design/CRASH-REPORTS.md`（F3 面）为两批共触——本批 §8/§9 为**新增节**（不改其 §1–§7）；若 FORENSICS 评审在途，改动集齐后统一入场（D5 冻结窗口）；实现按 files 域排队（先落者先并）。
2. **C5/C6/C7 登记**：转 `docs/TODO.md` 技术待办（记录归属 = 主 agent——本席未写 TODO）。
3. `docs/design/TUI.md` §1 模块地图行数回写：归设计者收口阶段（先例——TUI-SELECTION 修正轮 #1 裁定）；本批不预写。

### 修正轮（2026-09-11——设计评审轮次 1 后；本追加与上文本冲突时以本追加为准）

**背景**：设计评审（轮次 1）VERDICT = changes-required（🔴 2 · 🟡 6 · 🔵 4——发现表见 §3 轮次 1）。父侧裁决 = **12/12 全修**。本轮 = 修正轮（**只改文档、不碰实现**；`src/**` 零改动；未新建档；§3 零碰）。落点逐处注「修正轮 #N」。

**12 条落点**（as-of 落档后）：

| # | 级别 | 落点 |
|---|---|---|
| 1 | 🔴 | `design/SESSION.md` §14.3.1（`meta.identity` + `degraded` 标记）· §14.3.3（bind 签名 `slotFile/identity`；store 零项目内依赖——避环）· §14.3.4（对账规则改「先验身份、后比计数、身份固化」）· §14.3.8（轮转联动 / 改名不联动 / 孤儿兜底链）· §14.5（补 `session-slots.mjs` 490 +~3 · `session-guard.mjs` 48 +~5）· §14.6 T-RS12/T-RS13 · §14.7 AC-RS5 · §14.8 残余登记 · §14.9 写面口径 |
| 2 | 🔴 | `design/AGENT-LOOP.md` §13 追加内容额度修订行（字段集不变 + trace-store 头注释同步登记）· §23.3.2 D2 指针句改 · §23.5 trace-store 变更点补 |
| 3 | 🟡 | `design/CRASH-REPORTS.md` §9.3 守卫落点 = exit/close 处置内按 `exitCode/exitSignal`（不在共享 `finish`；error 路径零动作）· §9.6 T-RT4 · §9.7 AC-RT4（回指 F5③） |
| 4 | 🟡 | `design/SESSION.md` §14.3.6（描述符 `{history,total}` 两调用点统一 + 标签 total + `store.page` ±1 页沿 `{messages, base}`）· §14.3.4 / §14.5 调用点行列同步 · §14.6 T-RS3/T-RS10 · §14.7 AC-RS3 |
| 5 | 🟡 | `design/SESSION.md` §14.3.7 delta 登记（匹配基准 = 存储文本 / N 失真——不修理由）· T-RS8b · AC-RS4；`requirements/SESSION.md` F-S4 判定句同步 |
| 6 | 🟡 | `design/SESSION.md` §14.4 D-R4 重写（失败即停 + `_memTotal` 追赶 + degraded 标记 + bind 重建）· §14.3.4 degraded 分支 · T-RS14 · AC-RS10 措辞 |
| 7 | 🟡 | `design/SESSION.md` §14.5 表补 `session-slots.mjs` 行 + 「零改」句同步 |
| 8 | 🟡 | `requirements/SESSION.md` §14.1 F-S2 补绑定态范围注 + F-S2 判定句同步；`design/SESSION.md` D-R6 指针 |
| 9 | 🔵 | `design/AGENT-LOOP.md` §23.7 AC-O4 锚点改指 §13 字段清单 · §23.6 T-TR1 参照物 |
| 10 | 🔵 | `design/AGENT-LOOP.md` §23.3.2 seqCache 多进程语义登记（可容忍） |
| 11 | 🔵 | `design/CRASH-REPORTS.md` §8.3 补 TUI 活动时 stderr 面接受噪声句 |
| 12 | 🔵 | 行数按实测刷新（口径 `split("\n").length` 含末行）：wrapped-spawn 39→41 · tui-stderr 79/90→106 · key-handler-search 113→114 · subagent-actions 470→479——落点：CRASH-REPORTS §4/§9.5 · TUI.md §15.5 · AGENT-LOOP §18.5 |

**变更记录行**：五档均追加「TUI-OOM-ROOTCAUSE 批·设计评审轮次 1 修正轮」注记（design 四档 + requirements 一档）。

**三方一致**：批次 §2 条目 = 设计档 AC 回指 = 需求档条目——无条目增删（修正面为既有条目的实现级语义/用例/文档一致）。用例表扩充（A1 面 T-RS8b/T-RS12–T-RS14；B3 面 T-RT4）；AC 编号集不变（AC-RS1–10 / AC-RT1–4——B3 面 AC-RT4 为覆盖 F5③ 的补充）。

**自检**：D6 回读（各落点复读核实）· 宽度自检（>300 字符行零新增）——均过。

**未落项**：无。§3 未碰。

**下一步**：父侧重发设计评审（轮次 2——同链）。

### 实现后同步（eng-designer · 2026-09-12——设计档与交付实测态对齐；本追加与上文本冲突时以本追加为准）

**背景**：实现已交付（§5）+ 父侧核验（§6 遗留 doc 层）；本追加 = `docs/design/SESSION.md` + `docs/design/TUI.md` 与交付实测态的 4 处对齐——**只改文档、实现零触碰**；§1/§3–§6 零碰。

**4 处落点（逐项）**：

| # | 落点 | 内容 |
|---|---|---|
| 1 | `design/SESSION.md` §14.3.6 | 恢复描述符按实载校准：`{history ≤201（尾窗 200 + ±1 页沿头一条）, total, base}`——单源 `sessionDescriptor()`（`src/session.mjs:69-78`）；`base` = `history[0]` 绝对序号（渲染起点；缺省 `total − len` 推导）；翻页锚字段名同步（复用既有 `state._historyTotal`——`_historyAnchor` 未落地） |
| 2 | `design/TUI.md` §15.5 | 补两行：`subagent-freeze.mjs` 170 → 176（冻结 splice 行经 `accountLine` 入 `state.lines` 总量账）· `cmd-clear.mjs` 21 → 23（清屏行集清空时 `_linesChars` 归零）——均声明外触碰补行 |
| 3 | `design/SESSION.md` §14.5 | `session-store.mjs` 交付 442 越 300 登记（不拆——新增档先例）+ `session-segments.mjs` 交付 **101**（拆分产物）表行 + 拆分结论句同步；两调用点行（startup / cmd-session）的 `base` 括注同步 |
| 4 | 两档变更记录 | `design/SESSION.md` / `design/TUI.md` 各一行「实现后同步（2026-09-12）」 |

**行 1 附注**：两调用点锚行按实载刷新（`bin/thincoder.mjs:338` / `src/tui/startup.mjs:226-230` / `src/tui/cmd-session.mjs:96-104`）。

**落点校正（1 处——记录在案）**：父侧指令第 2 处写「`SESSION.md` §14.5 受影响表补两行」——按 coder 披露「设计 §15.5 缺行」+ 本批 §6 原裁定「设计 §15.5 表补两行」+ 板块归属（B1 显示层面；`SESSION.md` §14.5 属记录存储面、两档与 store 零关联），实际落 **`TUI.md` §15.5**。

**实测校正（1 处——对 §5 数值）**：`session-segments.mjs` = **101 行**（口径 `split("\n").length`；§5 报 108）——以实测落档；442 / 170→176 / 21→23 与 §5 一致（170/21 经 git HEAD 基线核验）。

**其它实测漂移（不在本 4 处内——如父侧需统一刷新请另示）**：read-history 交付 310（表列 ~330）· startup 交付 298（表列 ~291）· tool-events 447（估 426）· subagent-children 235（估 189）· trace-store 356（`AGENT-LOOP.md` §23.5 列 ~280——越 300 未登记，同类缺口）· memory/core 300（恰在 300 线）。

**自检**：D6 回读两档触碰区——通过；本次编辑新增 >300 字符行 = 0（SESSION 0；TUI 5 行为既有行、不在触碰区）。

## §3 设计评审（评审子代理写）

_（待写——评审子代理）_

---

### 轮次 1（评审子代理）

**评审对象**：TUI-OOM-ROOTCAUSE 设计（A+B 档：_fullHistory 磁盘为准+内存窗口 / 子代理历史与捕获上界 / 堆遥测 / 显示层额度 / trace+检索收敛 / 终端恢复）。评审范围 = 12 档需求+设计（SESSION/AGENT-LOOP/TUI/MEMORY/CRASH-REPORTS/CONTEXT-COMPACTION 双端）。
**计数**：🔴 2 · 🟡 6 · 🔵 4（共 12 条）。抽查证据（实读源码行数）：session.mjs 476 ✓ · session-slots 490 ✓ · agent.mjs 414 ✓ · subagent-spawn 454 ✓ · acp 448 ✓ · tui/index 455 ✓ · tool-events 408 ✓ · subagent-blocks 436 ✓ · startup 266 ✓ · read-history 295 ✓ · trace-store 225 ✓ · spawn-child 229 ✓ · run-stages 243 ✓ · async-settle 192 ✓ · suspension-drive 298 ✓ · escalate-async 290 ✓ · memory docs/code-sync/core 418/414/301 ✓——无越 500 档。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements/Feasibility（数据完整性） | 🔴 | design/SESSION.md:656-658 绑定对账规则只比条数（段≥JSON→以段为准）——无身份锚：槽文件被 .bak 轮转（session-guard.mjs:29-35 只改名文件不联动 sidecar）/ 被 .corrupted/.unreadable 改名（session.mjs:186-230）/ 被对端删除（N-S3 声明 sidecar 对 VSC 不可见、VSC 零改动）后，槽号会被回收复用（session-slots.mjs:262-282 allocateFresh「文件缺失」回收；newSession 同）；此时陈旧 sidecar 会被当作「崩溃后未保存消息」整体采纳进新会话并随投影写回其槽 JSON——静默跨会话记录污染（如 /new 后立即出现旧会话 200 条；违反 requirements/SESSION.md N-S2「回滚防护（sessionStart 轮转）逐条保持」与 F-S6 删除语义「不复活被删会话」）。§14.3.8（:691-694）只列 deleteSlot/冷 GC//rename，未列轮转/改名/孤儿面；affected-files 表亦无 session-guard.mjs | 给 meta.json 落会话身份（sessionStart 或等价 UUID），bind 对账先验身份：不匹配/无主 sidecar → 丢弃或随现场改名（不得采纳）；补轮转/改名路径的 sidecar 联动 + 「孤儿 sidecar」用例；受影响文件表补 session-guard.mjs 等行 |
| 2 | Document ownership | 🔴 | design/AGENT-LOOP.md:1694（§23 内容额度：消息内容/推理>64K 截断+标记、单记录>4M messages 降 stub）与同档 §13 现行文矛盾——:684「**完整轨迹**…reasoning 全文」+ trace-store.mjs 头注释「大小不限…不截断、不脱漏行」；§23 自称「§13 为轨迹机制权威，本节只改写入代价形态」（:1703-1704）不成立（截断=内容面），且未在 §13 落修订/取代句——同一机制两处不同描述（经要求 F-O4 授权截断，须落修订） | §13 增修订行（逐字见 requirements/AGENT-LOOP.md F-O4 语义：额度截断+标记/stub、字段集不变）+ 同批改 trace-store.mjs 头注释；受文档面登记进 §23.5 |
| 3 | Requirements coverage（验收面） | 🟡 | requirements/CRASH-REPORTS.md:55 F5③（spawn error/包装未启用→零动作）在 design/CRASH-REPORTS.md §9 无对应用例/AC（T-RT1–T-RT3 无此态；AC-RT1–3 未回指 F5③），且契约落点自相矛盾：:316-318 把条件挂在共享的 `finish(code)` 之前，而 spawn error 路径现经 `child.on("error")→finish(1)`（wrapped-spawn.mjs:38）——字面实现会在未启动子进程时补发 clearScreen 序列（清用户屏），违背 F5③ | 明确守卫落点（exit/close 处置按 exitCode/exitSignal 判定，error 路径零动作）+ 增 T-RT4（spawn error→writeImpl 零调用）并回指 F5③ |
| 4 | Clarity（可实施性） | 🟡 | design/SESSION.md:676-677 翻页契约只给 `store.page(绝对区间)`（:638），未给页沿上下文——现有渲染基元 historyToLines 需页前一消息（startup.mjs:26-29 跨页回合标签判定）与页内末条的下一条（:67-69 tool_result 配对）——按现契约取页会回归「❯ ThinCoder: 标签重复」旧 bug / 页沿工具结果失配；/session 切换路径（cmd-session.mjs:95 `restoreLines(state, data.history)`）与改后 `restoreLines` 形态（§14.5「restoreLines(total)」）的对应关系未写 | 契约补「页 = 区间 ±1 边界消息」口径（或 store.page 带 margin 变体）；点名 cmd-session 调用点改造与恢复描述符用 `total`（而非窗口长度）做「N messages」显示口径 |
| 5 | Requirements coverage（read_history 语义） | 🟡 | design/SESSION.md:684 宣称本会话检索「输出构造…逐字不变」，但存储行=pushReal 时点 `slimForDisplay` 后文本（:614）：① 工具消息 keyword 仅可命中前 ~500 字符（旧实现全量文本匹配，read-history.mjs:277-279 注释即「never compacted」）；② 截断标记 N 失真（存储已带「truncated for storage」标记→再截时 N≈26 而非真实丢弃量）。未登记为 delta，与 requirements/SESSION.md N-S2「read_history 输出…逐条保持」相抵 | 登记为显式语义 delta（或 iterate 输出层剥离存储标记/携带原始长度）；modify §14.3.7 + T-RS8 增长内容 keyword 用例 |
| 6 | Feasibility（降级语义） | 🟡 | design/SESSION.md:706-707 D-R4 与 :769 AC-RS10 宣称追加失败「下次保存自愈」不成立：投影源=store（失败条目不在 store），JSON 由投影生成→缺口同步写回盘；bind 对账（:656-658）比较的两侧同缺该条，无修复路径——中段缺口永久静默（丢失一条记录且 total/绝对序号继续计数） | 定义降级语义（如失败即停投影改走全量物化需保留全量内存/或显式打标并在恢复面对账检测缺口）；修正 AC-RS10「自愈」措辞与用例预期 |
| 7 | Affected-file annotations | 🟡 | design/SESSION.md:737 声明 `session-slots.mjs`（490）**零改**，但 :691 契约要求 `deleteSlot → unlinkRecordStore`（T-RS9 断言「deleteSlot 后 sidecar 不存在」）——deleteSlot 在 session-slots.mjs:400-415，实现必改该档；affected-files 表（:719-734）漏该行（及 #1 涉及的 session-guard.mjs）——改档无行数/增量标注 | 表补 `session-slots.mjs`（490，+~2/+~4）等行；或把删除联动移到已列档并同步契约句 |
| 8 | Scope（需求-设计口径） | 🟡 | design/SESSION.md D-R6（:709-711）把内存窗口收窄为「绑定或 depth>0 子代理」，requirements/SESSION.md F-S2/F-S3（:84-85）与总体需求无此限定（「运行期人读线只保最近 200 条」）——未绑定路径（thincoder chat/未覆盖路径）仍全量驻留；两层对同机制的范围描述不一致 | 需求档补范围注（绑定态）或设计扩窗口覆盖并把 mode F 边界同步进 F-S2 判定句 |
| 9 | Acceptance/evidence | 🔵 | design/AGENT-LOOP.md:1758 AC-O4「字段集对照（既有轨迹用例/字段清单）」——本仓 test/ 无轨迹用例（grep trace-store/recordChatTrace 零命中、test/ 无 traces 档），锚点悬空；T-TR1 的「与既有字段集逐字段相等」未定义参照物 | 改指 §13 字段清单 + 新档自身参照实现 |
| 10 | Design detail | 🔵 | design/AGENT-LOOP.md:1701-1702 seqCache 去掉逐调用扫盘（需求 F-O5 授权）——同 cwd 多进程（多实例协作常态）各自缓存后 seq 可撞、同 sessionKey 下两进程记录并入同名文件；「目录被清理后取下界重扫」表述含糊——未登记该边界 | 补一句多进程语义登记（可容忍或落盘校验兜底） |
| 11 | Design detail | 🔵 | design/CRASH-REPORTS.md:223（告警面选定行）含「stderr 行 + TUI 行」，但未写 TUI 活动时裸 stderr 写与 alt-buffer 的交互（其表 2 已自认 stderr 在 TUI 下「写入即被重绘刷新」）——是否抑制/同步未定 | 契约补一句：TUI 活动时 stderr 写抑制或明示接受噪声 |
| 12 | Numeric drift（R7c） | 🔵 | 抽查数字小漂移：tui-stderr-capture.test.mjs 标 90（实 106，CRASH-REPORTS.md:336）· wrapped-spawn 标 39（实 ~41）· key-handler-search 标 113（实 114）· subagent-actions 标 470（实 479）——均不影响档位（无越 500） | 落笔时按实测刷新（非阻塞） |

**VERDICT: changes-required**（🔴 2 条：#1 对账身份锚/跨会话污染；#2 §23-§13 同一机制两处矛盾）。

### 轮次 2（评审子代理）

**评审对象**：TUI-OOM-ROOTCAUSE 设计（A+B 档：_fullHistory 磁盘为准+内存窗口 / 子代理历史与捕获上界 / 堆遥测 / 显示层额度 / trace+检索收敛 / 终端恢复）——**轮次 2**（核验 §3 轮次 1 的 2🔴+6🟡+4🔵 修正轮落修；只验修正）。
**方法**：本轮实读 design/SESSION.md · design/AGENT-LOOP.md（§13/§23）· design/CRASH-REPORTS.md · design/TUI.md（§15）· requirements/SESSION.md · requirements/CRASH-REPORTS.md · 批次档修正轮追加；源码行数抽查（wrapped-spawn 41 · tui-stderr 106 · key-handler-search 114 · subagent-actions 479 · session-guard 48——与刷新值一致）。修正轮「src/** 零改动」声明无 diff 工具可核验（不支撑判定——本轮对象为文档面，已排除）。
**计数**：🔴 0 · 🟡 0 · 🔵 1（残留同步项——非阻断）。轮次 1 共 12 条 = **12/12 已修**。

| # | Orig# | File | Severity | Status | Notes |
|---|---|---|---|---|---|
| 1 | 1 | design/SESSION.md | 🔴 | Fixed | 身份锚全链落位：§14.3.1 `meta.identity`（:617）· §14.3.3 bind（slotFile/identity——:641）· §14.3.4「先验身份、后比计数」+ stale/孤儿拒采纳改名（:666-672）· §14.3.8 轮转联动/改名不联动/孤儿兜底（:725-731）· §14.5 +session-slots（490 +~3）/session-guard（48 +~5）（:769-770）· T-RS12/T-RS13（:805-806）· AC-RS5（:817）· §14.8 残余登记（:829） |
| 2 | 2 | design/AGENT-LOOP.md | 🔴 | Fixed | §13 内容额度修订行（:697-702——「完整轨迹/reasoning 全文」按此限缩、字段集不变）· §23.3.2 D2 指针（:1715-1717）· §23.5 trace-store「头注释同步」（:1743） |
| 3 | 3 | design/CRASH-REPORTS.md | 🟡 | Fixed | §9.3 守卫=exit/close 处置内按 exitCode/exitSignal、**不在共享 finish**、error 路径零动作（:319-325）· T-RT4（:350）· AC-RT4（:359） |
| 4 | 4 | design/SESSION.md | 🟡 | Fixed | §14.3.6 描述符 {history,total} 两调用点 +「N messages」=total + store.page ±1 页沿 {messages,base}（:692-703）· §14.3.4/§14.5 调用点（:661/:776/:778）· T-RS3（:795）/T-RS10（:803）· AC-RS3（:815） |
| 5 | 5 | design/SESSION.md · requirements/SESSION.md | 🟡 | Fixed | §14.3.7 delta 登记（:715-720——匹配基准=存储文本、N 失真登记不修）· T-RS8b（:801）· AC-RS4（:816）；需求 F-S4 判定句同步（:120-122） |
| 6 | 6 | design/SESSION.md | 🟡 | Fixed | D-R4 重写（失败即停+_memTotal 追赶+degraded 标记+bind 重建——:745-751）· §14.3.4 degraded 分支（:673）· T-RS14（:807）· AC-RS10 措辞（:822）· §14.8 登记（:831） |
| 7 | 7 | design/SESSION.md | 🟡 | Fixed | §14.5 补 session-slots.mjs 行（:769）+ 拆分结论「零改」→「+~3」句同步（:785-787） |
| 8 | 8 | requirements/SESSION.md · design/SESSION.md | 🟡 | Fixed | F-S2 绑定态范围注（:84-86）+ 判定句（:116-117）；D-R6 指针（:754-757） |
| 9 | 9 | design/AGENT-LOOP.md | 🔵 | Fixed | AC-O4 锚点改指 §13 字段清单（:1771）· T-TR1 参照物（:1758） |
| 10 | 10 | design/AGENT-LOOP.md | 🔵 | Fixed | §23.3.2 seqCache 多进程语义登记（:1712-1714） |
| 11 | 11 | design/CRASH-REPORTS.md | 🔵 | Fixed | §8.3 TUI 活动时 stderr「不抑制——明示接受噪声」（:244-246） |
| 12 | 12 | design/CRASH-REPORTS.md · design/TUI.md · design/AGENT-LOOP.md | 🔵 | Fixed | 行数实测刷新：wrapped-spawn 41（§4 :146 / §9.5 :340）· tui-stderr 106（:148 / :341）· key-handler-search 114（TUI §15.5 :1433）· subagent-actions 479（AGENT-LOOP §18.5 :850）——实读抽查一致 |
| 13 | (new) | docs/batches/2026-09-11-TUI-OOM-ROOTCAUSE.md:105 | 🔵 | New: 残留同步（非阻断） | 「零改核对项」仍列 `src/session-slots.mjs`（490——零改）vs design §14.5:769 +~3——修正轮 append 优先级条款已覆盖（「本追加与上文本冲突时以本追加为准」）；建议父侧顺手同步该行 |

**新面核验**：修正轮未引入新 🔴/🟡；两条 🔴 的机制面已闭合（槽号回收/轮转/改名/孤儿四类残余均有身份核验拒采纳 + T-RS12/T-RS13 用例）；五档变更记录注记在位（design 四 + requirements 一）。

**VERDICT: pass**（12/12 落修；0 新 🔴/🟡；1 残留 🔵 = 批次档核对行同步——非阻断）。

## §4 用户批准（主 agent 记）

**2026-09-12 01:00 父侧代签**——用户 23:43「自动推进到排空」授权；条件齐备：轮次 1 changes-required（2🔴 · 6🟡 · 4🔵）→ **修正轮 12/12 落地**（#22——身份锚全链/§13 修订行/守卫落点/页沿 ±1/degraded 语义/session-slots 行/F-S2 范围注 等）→ **轮次 2 评审 pass**（0🔴 · 0🟡 · 1🔵 残留同步——非阻断）→ token 已签发（值不落档）。

**批准范围**：A+B 档（C1 磁盘为准+内存窗口 · C2 子代理历史上界 · A3 堆遥测 · C3 显示层额度 · C4 trace/检索收敛 · B3 终端恢复）——实施面 = 各设计档受影响文件表（五分组；§2 为准）；实施者 = eng-coder（设计 token 门）。

**遗留**：① 批次档 §2 :105 核对行「session-slots 零改」与设计 §14.5 不同步（轮次 2 🔵——随收口同步）；② 物证回填钩（同事报告到达后归因）；③ commit 随「扫」批。

---

## §5 实施记录（eng-coder 自写）

_（待写——eng-coder）_

---

**2026-09-12 · eng-coder 交付（A+B 档五组全落地）**

**范围**：§2 五分组（组 1 A1/C1 · 组 2 A2+B2-trace · 组 3 B1 · 组 4 A3+B3 · 组 5 B2-检索）——实现 = 设计档逐条契约；C 档不碰；VSC 仓零改；未 commit；未发起评审。

**新增档（5 + 测试 6）**：`src/session-store.mjs`（495 行）· `src/text-budget.mjs`（47）· `src/tui/display-budget.mjs`（184）·
`src/heap-watch.mjs`（89）· `src/memory/scan.mjs`（96）；`test/session-store.test.mjs`（392）· `test/subagent-memory-bounds.test.mjs`（113）·
`test/trace-bounds.test.mjs`（141）· `test/tui-memory-budget.test.mjs`（224）· `test/heap-watch.test.mjs`（114）· `test/memory-scan-bounds.test.mjs`（99）。

**触碰既有档（30）**：组 1 = session/session-slots/session-guard/context/session-gc/read-history/generate-title/bin·thincoder/cmd-session/cmd-new/
startup/acp + integration/session-resume（扩展 T-RS10）；组 2 = spawn-child/subagent-spawn/async-settle/run-stages/agent.mjs/suspension-drive/
escalate-async/trace-store；组 3 = tool-events/tool-display/tool-args/subagent-children/subagent-blocks/key-handler-search/index（+ startup 行额度）；
组 4 = tui-lifecycle/wrapped-spawn（+ test/tui-stderr-capture 扩展 T-RT1–4）；组 5 = memory/core·docs·code-sync。

**声明外触碰（4——均已披露）**：`src/tui/subagent-freeze.mjs`（冻结 splice 行入 state.lines 总量账——§15.3.3 落点表末行明文要求）·
`src/tui/cmd-clear.mjs`（清屏归零 `_linesChars`——字符账唯一新增状态位必须随行集清空归零）· `src/agent-tools/consult.mjs` 与
`src/agent-tools/subagent-actions.mjs`（代码评审 #2 修正：另两处子代理创建点补置 `_historyWindow`——F-O1 覆盖 depth>0 全部创建点）。

**决策透明表（实现级取舍——均已落码 + 报告披露）**：

| # | 项 | 处理与理由 |
|---|---|---|
| 1 | 恢复描述符实载 `{history ≤201, total, base}`（设计 §14.3.6 写 ≤200） | 多一条 = ±1 页沿头一条（防窗口边界回合标签回归）；`base` 为绝对序号，供 `restoreLines` 定位渲染起点——设计句待同步 |
| 2 | `_historyAnchor` 实现复用既有 `state._historyTotal`（同语义、仅 restoreLines 写） | 不新增状态位（§15.3.2「唯一新增状态位」保持）；语义等价 |
| 3 | `capLine` = 头保真 + 尾标记（`… [line truncated: N chars omitted]`） | 设计只给标记形态未给头尾比；行场景头优先 |
| 4 | 子块入块文本先过单块自身额度（90K+30K+中段标记） | 防「单条无换行巨 chunk 被字符维整行丢光」；环总量仍按最旧先行 |
| 5 | 冷 GC `files` 含 sidecar 目录项（`rmSync` 递归） | F-S6 判定句要求「gc 清冷前缀后 sidecar 不存在」；设计句「files 仍只计文件」按数据文件判定面理解 |
| 6 | trace-store 增 `_traceHooks`（readdir/exists/mkdir/append）+ `_resetTraceStateForTest` | 设计 T-TR4/T-TR5 要求的注入缝（慢写替身 / readdir 计数） |
| 7 | session-store 495 行（设计估 +280±40） | 越 300 咨询线、未越 500 硬限——单点不拆（先例）；父侧可在收口时登记 |
| 8 | 三处 out-of-list 触碰（上表） | file 域 = 预期触碰面（非授权边界）——如实披露即可 |

**审计与代码评审轮次（本会话内）**：

- **内部偏差审计（explore 只读）**：VERDICT changes-required（🟡1 · 🔵3）——🟡 = bind 隔离路径空 base 不重置身份（已修 + T-RS12 回归断言）；
  🔵 = read-history 注释漂移（已修）· 两处 out-of-list 文档面（设计 §15.5 缺行——设计者收口）· `_historyAnchor` 命名（上表 #2）。
- **内部代码评审（advisor code）**：VERDICT changes-required（🔴1 · 🟡3 · 🔵2）→ **修正轮 1 逐条处置**：
  - 🔴 半行拼进投影 → 槽 JSON 非法（评审 file:line = session-store 投影循环/`_scan`）——**修**：投影逐行 `tryParse` 过滤 +
    写路径截除末尾半行（`truncateSync`——恢复「物理行序 = 逻辑序」不变式）+ T-RS6 三段回归断言（取证：半行现场 → 追加不粘连 / total 105 / 投影 JSON 可解析）。
  - 🟡 子代理窗口仅一处创建点 → **修**：四处创建点全置（见上「声明外触碰」）+ T-SM4b grep 回归。
  - 🟡 冻结评审 `capLines(...)[0]` 丢标记且截尾 → **修**：`capAdvisorText`（头 32K + 尾 96K + 中段标记）+ T-TB6 超限断言。
  - 🟡 session-store 行数（上表 #7）——**登记不拆**（未越 500 硬限）。
  - 🔵 描述符 ≤201 + `base`（上表 #1）——**披露，待设计句同步**（不改码）。
  - 🔵 `dropFirstContentLine` 字符账少记行分隔符 → **修**（+1）——`_charCount` 不再偏高。
  终态 = **converged（clean）**；修正轮后复跑全绿（见下）。

**机验证据（先落盘再读尾）**：

| 面 | 命令 | 结果 |
|---|---|---|
| 快层全量 | `node test/run-fast.mjs` | 630 tests · 614 pass · 0 fail（含新档 6 + 既有族） |
| 会话恢复集成 | `node --test test/integration/session-resume.test.mjs` | 4/4（原 3 + T-RS10） |
| 组 2/3/4/5 定向 | `node --test test/{subagent-memory-bounds,trace-bounds,tui-memory-budget,heap-watch,memory-scan-bounds}.test.mjs` | 全绿 |
| 记录存储单元 | `node --test test/session-store.test.mjs` | 17/17（T-RS1–T-RS9/T-RS11–T-RS14 + AC-RS9） |
| 终端恢复扩展 | `node --test test/tui-stderr-capture.test.mjs` | 含 T-RT1–T-RT4b 全绿 |
| 文档宽度 | `node scripts/check-doc-width.mjs` | 本批新增违规 0（新增项属并行批 `2026-09-12-VSC-ACTIVITY-CLOSURE`） |
| 根因 grep | `store.append` 单点 / `full.length − loaded` 零命中 / 向量通道无裸 `.all()` / `_historyWindow` 四处 | 见各档 AC 行 |

**未落项**：无（§2 五组条目全覆盖；C 档与物证回填钩属父侧/设计者面）。

**修正轮补记（同日）**

- **模块拆分（行数硬限）**：代码评审修正后 `src/session-store.mjs` 达 519 行（越 500 硬限）——按职责拆出叶子档
  `src/session-segments.mjs`（108 行：段 IO 原语 + 人读线条目形态 + `_storeStats`）——store 降至 **442 行**，
  公开名全部 re-export（`RECORD_SEG_MESSAGES` / `RECORD_DIR_SUFFIX` / `recordDirOf` / `isLegacyTransient` /
  `slimForDisplay` / `_storeStats`——调用面零改，测试零改）。**新增档 +1（声明外——已披露）**。
- **最终行数**：session-store 442 · session-segments 108 · display-budget 185 · trace-store 356 · read-history 310 ·
  memory/core 300 · tool-events 447 · subagent-children 235 · heap-watch 89 · memory/scan 96 · tui-lifecycle 95 ·
  wrapped-spawn 55 · consult 474 · subagent-actions 482（全部 ≤500）。
- **修正轮后复跑**：`node test/run-fast.mjs` = 630 tests · 614 pass · 1 fail——唯一红 = `doc-consistency`（V3）指向
  并行批 `2026-09-12-VSC-ACTIVITY-CLOSURE.md` / `2026-09-12-VSC-CHILD-PERMISSION.md` §3（非本批档；本批档零违规）。
  定向面全绿：session-store 17/17 · session-guard/slots/gc/read-history 25/25 · integration/session-resume 4/4 ·
  组 2/3/4/5 新档 + 族定向 46/46 · `check-doc-width` 本批新增 0。

**代码评审轮次与裁决表（本轮会话内）**

轮 1（advisor code：TUI-OOM-ROOTCAUSE A+B 修正轮——目标 = 五组实现面）VERDICT = changes-required（🔴1 · 🟡3 · 🔵2）：

| # | Action | Detail |
|---|---|---|
| 1 | Fixed | 🔴 投影拼半行 → 槽 JSON 非法：`src/session-store.mjs` 投影循环改 `if (line === "" || tryParse(line) === undefined) continue`（:417）；补写路径截半行 `_dropPartialTail`（:286-295，`_writeLine` :300 调用）；回归 T-RS6（`test/session-store.test.mjs` :135-144——追加不粘连 / total 105 / 投影可 `JSON.parse`） |
| 2 | Fixed | 🟡 子代理窗口覆盖不全：另三处创建点补置（`src/agent-tools/escalate-async.mjs` :204 · `subagent-actions.mjs` :411 · `consult.mjs` :287——常量单源 import `../session-store.mjs`）；回归 T-SM4b（`test/subagent-memory-bounds.test.mjs` :86-92） |
| 3 | Fixed | 🟡 冻结评审丢标记/截尾：改 `capAdvisorText`（`src/tui/display-budget.mjs` :77-80 = 头 32K + 尾 96K + 中段标记）；调用点 `src/tui/tool-events.mjs` :293；回归 T-TB6（`test/tui-memory-budget.test.mjs` :122-130） |
| 4 | Fixed | 🟡 档行数：按职责拆出 `src/session-segments.mjs`（段 IO 原语 + 条目形态 + `_storeStats`）——store 442 行、叶档 108 行（双 <500 硬限）；公开名 re-export（`src/session-store.mjs` :23-25），调用面零改 |
| 5 | Deferred | 🔵 描述符 `{history ≤201, total, base}` vs 设计 §14.3.6 句「≤200」：实现不改（±1 页沿为必要），已披露待设计者同步设计句——非阻断 |
| 6 | Fixed | 🔵 `dropFirstContentLine` 字符账少记行分隔符：`src/tui/subagent-children.mjs` :73 返回 `droppedLine.length + (kept === "" ? 0 : 1)` |

轮 2（advisor code：仅核验修正声明）VERDICT = **pass**——原 🔴 已解、无新增 🔴；残余 = 1 🔵（上表 #5，披露在案，非阻断）。两轮合计修正档：`src/session-store.mjs` · `src/session-segments.mjs`（新） · `src/tui/tool-events.mjs` · `src/tui/display-budget.mjs` · `src/tui/subagent-children.mjs` · `src/agent-tools/{escalate-async,subagent-actions,consult}.mjs` · 三份测试档。

## §6 验证与收口（父代理自写）

**2026-09-12 01:30 收口（父侧核验）**

- **真跑**：CLI 快层 `node test/run-fast.mjs` → **630 例 / 614 过 / 1 fail / 15 skip**——唯一红 = `doc-consistency` V3 指向**本批外的两个新批档**（`2026-09-12-VSC-ACTIVITY-CLOSURE.md` / `VSC-CHILD-PERMISSION.md` §3——尚未评审，评审写 §3 后自消；非本批因果）；定向（coder 报告）：`session-store` 17/17 · 组 2/3/4/5 族 46/46 · `integration/session-resume` 4/4 · `tui-stderr-capture` 全绿；
- **交付表 10 项全 Done**（组 1–5 全落地：记录存储/子代理上界/显示层额度/堆遥测+终端恢复/检索收敛）；内部审计 clean + 代码评审 2 轮收敛（**1🔴 已修**：投影半行防护 + `_dropPartialTail`；3🟡 全修含硬限拆分 `session-segments.mjs`；残余 1🔵 已登记）；
- **透明表 8 项采纳**（声明外触碰 5 处均有设计依据或评审导出——非静默）；触碰档均 ≤500 硬限（最大 session-store 442）；
- **遗留（doc 层——#31 同步）**：设计 §14.3.6 描述符句（≤200 → ≤201/±1 口径）· 设计 §15.5 表补两行（`subagent-freeze.mjs`/`cmd-clear.mjs`）· `session-store.mjs` 越 300 线登记；③ `read-history` 工具描述串（含 "never compacted"）待提示词批处理（已在披露 #8）；
- **链终**：design 链令牌已消费（值不落档）——再动需新评审。
