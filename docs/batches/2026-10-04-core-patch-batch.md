# 2026-10-04 · 核面小修批（offload 汇总 ∥ manifest 告警 ∥ 环尾 abort）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-04 · 来源 = 用户 2026-10-04 10:58「开」（承 10:54「你检查一下台账，分批处理一下」+ 父侧分批方案）——E 批 = 核面小修三件（台账 #796 ∥ #802 ∥ #793）。
> 台账 = #796 ∕ #802 ∕ #793（核面小修 · 归批）。前情 = 无（独立批——台账分批方案 E 批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-04
**开批登记（2026-10-04 11:0x · 主 agent）**：**来源** = 用户 10:54「你检查一下台账，分批处理一下」（+ 父侧分批方案）+ 10:58「开」。**条目** = 核面小修三件：**#796**（大工具回执 offload 盲区——批末汇总行）∥ **#802**（manifest 未知键静默丢弃——最小告警形）∥ **#793**（核环尾无 abort 前置——环头/环尾双检查点）。**授权口径** = 全链（设计 → 用户点火评审 → 批准 → 实施）。**设计轮已交**（eng-designer #2 · §2 + 四设计档随动）——父侧核读毕（三件落点 ∥ 代码坐标 ∥ 四档落点全核）⇒ **候用户点火评审**。**档头补填复核**（父侧通过）：`#796 ∕ #802 ∕ #793（核面小修 · 归批）`——建档义务遗漏（父侧认账），eng-designer 受迫机械补填。
## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（评审轮 1 发现 1–4 落位 · fix 轮修正块在册 · 发现 2 前提据实修正）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

---
### E 批设计（eng-designer · 2026-10-04 · 首轮）
（承 §1：E 批 = 核面小修三件——#796 ∥ #802 ∥ #793；三件均有父侧实读证据）

**条目（覆盖）**：**#796**（大工具回执 offload 盲区）∥ **#802**（未知 manifest ∥ checkConfig 子键静默丢弃 = fail-open）∥ **#793**（核环尾无 abort 前置——#782 竞态窗根因）。三件逐条 = 问题定形 ∥ 方案（二择论证）∥ 落点 ∥ 验收。

#### #796 · 大工具回执 offload 盲区（中段不可见 + 零条数汇总）
- **问题定形**：大回执 >64K ⇒ `offloadToolResult` 落盘 + 双端 preview（head 16K + `… [middle omitted: N chars] …` + tail 48K——`thincoder-core/agent/helpers.mjs:36-39 ∥ :71-77`）；`applyEditBatch` 回执 = 逐条串联、**无合计行**（`thincoder-core/tools/edit-batch.mjs:90-108`——`results.join` 收尾）⇒ 批中段既不可见亦无计数——「后 5 条未落且无可见报错」的结构成因（实物锚 = `tool-results/1790792213842-…log`：11 条回执 · 零 error · 零 truncated 标）。工具面本身无静默丢条（#760 已核销——原子语义）——缺陷 = **可见性**。
- **方案（二择 · 定形 ①）**：
  - ① **批末恒定追加一行汇总**（选定——父侧候选形）：逐字 `edit batch: N/N entries — <路径清单>`（N = 条目数；路径 = 去重保序首现序；全判后原子写 ⇒ 成功恒 N/N）。tail 恒保留（`buildDualEndPreview` 尾端 = 文本末端）⇒ 汇总结论恒在可见面；恒定 = 判据单点（不设「仅大回执」分支——工具侧须知 offload 阈值 = 跨面耦合）；小回执多一行 = 零害（结论区惯例同源——`docs/core/design/TOOL-OUTPUT-LIMITS.md` D-L2）。
  - ② **大回执全量回给模型**（否决）：无界上下文成本（百文件 diff 级回执直灌）；与 offload 预算设计（D-L1/D-L2 ∥ P1–P3）相抵；全文恒在盘 + `read` 可回读——缺的只是「汇总结论」，非全文。
- **落点**：`thincoder-core/tools/edit-batch.mjs`（`applyEditBatch` 回执组装尾——单点；`edit` 工具 `edits` 形态自动继承）〔**勘误（父侧小笔 · 2026-10-04 实施轮上抛）**：原「∥ ACP 桥同经此内核 ⇒ 三通道自动继承」失实——桥面批量回执**自持**（`thincoder-cli/src/acp/bridge.mjs:182`，不经本内核）⇒ 覆盖 = 双通道；桥面汇总行 = 归批 **#908**〕。设计档 = `docs/core/design/EDIT.md` §5/§6/§7/§8 D-9。
- **验收**：批内件四腿（见下「验收对照」）；同类扫描 = 其余多文件面（`apply_patch`）首行已携合计（`Applied patch to N file(s)`——头部切片恒可见）——无同类缺口。

#### #802 · 未知 manifest ∥ checkConfig 子键静默丢弃（fail-open）
- **问题定形**：`fillDefaults` 只搬已知键（`thincoder-core/manifest-schema.mjs:147-166`——顶层 `MANIFEST_SCHEMA.keys` × 四嵌套层 `nestedKeys`）；未知键静默丢弃、`readManifest` 返回无该键、**零报错（`ok:true`）**（`thincoder-core/manifest.mjs:154-157`）⇒ 声明失效而无人知（实景 = 声明键拼写错 / 版本错位类）。KD-M1-31「可选识别键」第三类键已否——**不重启该备选**。
- **方案（定形 = ①；更强校验已论证否）**：
  - ① **最小告警形（选定）**：`validateManifest` 增算 `unknownKeys`（**非拒**——`ok` 定性零变；产线 = 顶层 + 四嵌套层，恰 = `fillDefaults` 丢弃面）；`readManifest` 返回面携 `unknownKeys` + **读面一行可见告警**（`console.warn` + `logEvent('manifest:unknown-keys')`——含键名；同档同键集去重）。读面单点 ⇒ 全会话面 + `doc-check`（`scripts/doc-check.mjs:82` 同读 `readManifest`）同享。
  - ② **强校验（拒档 = `ok:false`）**（否决）：旧版本读新档 / 残留键 ⇒ 整项目拒（破启动零拒绝 KD-M1-25）；与 KD-M1-11「不迁移、不报错」定性相抵。③ 只在 doc-check 告警（否决——会话面不可见）。④ 回写清键（否决——第二写路径，KD-M1-11 同族）。
- **边界（如实）**：告警 ≠ 报错——KD-M1-11 的「非错 / 零迁移」定性保持；改写的是「不可见」面。去重语义 = 同档同键集仅告警一次（进程内；先删后加同键集会重告警——状态值每次读刷新）。
- **落点**：`thincoder-core/manifest-schema.mjs`（`validateManifest`）+ `thincoder-core/manifest.mjs`（`readManifest` + import）。设计档 = `docs/core/design/MANIFEST.md` §2.2 ∥ §2.3 行 48–49 ∥ §2.4 KD-M1-36 ∥ §3.1 AC-38。

#### #793 · 核环尾无 abort 前置（#782 扩门所绕竞态窗根因）
- **问题定形（坐标据实收正）**：实际档 = `thincoder-core/agent/turn-loop.mjs`（桌面现体 = 消费核环——`thincoder-desktop/src/main/turn-loop.mjs` 已不在盘；证据 = 核档 `:59`（环头）∥ `:243`（环尾 `throw new ContinueError`）——与台账实录同形）。竞态窗：`signal.aborted` 态下回合环仍可经 `continue`（工具期中断 ∥ 流规则）或轮体完成走到环尾 ⇒ `ContinueError` 携中止态抛出 ⇒ 端侧撞帽腿（`thincoder-desktop/src/main/turn-face.mjs:133-158`——cap 询问 ∥ `ev:digest` cap 帧）在中止下可达；#782 端侧墓碑门 = 绕行（记录腿）。**判据面 = 需求 F5「用户 Stop 优先——中止路径（`AbortError` / `signal.aborted`）始终优先于继续提示」（`docs/core/requirements/TURN-CAP-CONTINUE.md:24`）——现行环尾违反之。**
- **方案（定形 = 双检查点）**：
  - **环尾（必需）**：`throw new ContinueError(maxTurns)` 前查 `signal?.aborted` ⇒ `throw abortError(signal, "agent", "turn-tail")`。
  - **环头（并入——同一不变式）**：轮起点查 `signal?.aborted` ⇒ `throw abortError(signal, "agent", "turn-head")`——消除「中止信号下开启新轮」（环头注入族 / 压缩 / 模型调用零触；工具期中断的让渡点由「下一轮 chat 失败面」提前为环头直抛——同错误形，消费契约零变）。
  - **否决备选**：① 只改 `continueDecision` 判定序（中止优先提前）——表面修（错误类型仍错 ∥ 桌面端自有分支不经它）。② 端侧再加门——第三重门非根修。③ 改 `ContinueError` 载荷语义——需求 N6 面（不动）。
  - **与 #782 记录腿关系**：端侧墓碑门（`turn-face.mjs:138`）**保留零改**——核侧前置后其为主径之外的兜底（revoked ⇒ aborted ⇒ 核侧已不产 ContinueError）；两端不互斥、不双写。
- **落点**：`thincoder-core/agent/turn-loop.mjs`（两检查点——`abortError` 已在 import 面 `:9`，零新依赖）。设计档 = `docs/core/design/AGENT-LOOP.md` §6.2 + `docs/desktop/design/ACTIVITY.md` §7 DD ②。
- **回归面（判据归一——中止族收尾分支如实随动）**：非中止撞帽全链零变；中止态由「ContinueError ⇒ ask / cap-stop / 留池续跑」归一为「AbortError ⇒ resume / stop（中断续跑照旧 ∥ 普通停弃）」；涉及点 = CLI `thincoder-cli/src/tui/agent-turn.mjs`（经 `continueDecision`）∥ VSC `thincoder-vscode/src/extension/panel-turn-loop.mjs`（同）∥ 桌面 `turn-face.mjs`（AbortError 支既在）∥ 核 `agent/run-stages.mjs:189-207`（中止清池支既有）∥ `agent/spawn-child.mjs`（子代撞帽循环：中止不再升为撞帽问询）。实施轮定向复跑 = 核 `test/` 续跑 ∥ 中断族 + 端侧对位件。

#### 设计档落点表
| 件 | 落点 | 面 |
|---|---|---|
| #796 | `docs/core/design/EDIT.md` | §5 汇总行条 ∥ §6 追加点行 ∥ §7 批内件 4 例 ∥ §8 D-9 ∥ 变更记录 |
| #802 | `docs/core/design/MANIFEST.md` | §2.2 契约两行 ∥ §2.3 行 48–49 + Δ 块 ∥ §2.4 KD-M1-36 ∥ §3.1 AC-38 ∥ §4 变更记录 |
| #793 | `docs/core/design/AGENT-LOOP.md` ∥ `docs/desktop/design/ACTIVITY.md` | §6.2 步 4 + 中断语义条 ∥ §7 DD ② 行收正 ∥ 两档变更记录 |

#### 受影响文件与测试面（产品码；行数 = as-of 2026-10-04 实读）
| 文件 | 现行行数 | Δ 界 | 变更点 |
|---|---|---|---|
| `thincoder-core/tools/edit-batch.mjs` | 203 | ≤ +8 | 回执组装尾 append 汇总行（单点） |
| `thincoder-core/manifest-schema.mjs` | 166 | ≤ +16 | `validateManifest` 未知键产线 + 头注 |
| `thincoder-core/manifest.mjs` | 251 | ≤ +28 | `readManifest` 返回面 + 告警 + import |
| `thincoder-core/agent/turn-loop.mjs` | 244 | ≤ +8 | 环头 / 环尾两检查点（各 1 行 + 注） |
| `docs/batches/2026-10-04-core-patch-batch.test.mjs` | 0 | 新增 | 批内件（三件机判腿——见下） |
> 全部 <500 硬限；>300 软线 = 不触（增量后峰值 ≤279）。

#### 验收对照（每件可机判 · 批内件 = `docs/batches/2026-10-04-core-patch-batch.test.mjs`）
| 件 | 腿（机判） |
|---|---|
| #796 | ① 汇总行逐字 `edit batch: 3/3 entries — a.mjs, b.mjs`（末行恰一次）；② 路径去重保序（同档两条目 ⇒ `2/2 entries — a.mjs`）；③ 恒定（N=1 与 N=n 皆附）；④ >64K 回执经 `offloadToolResult`（临时目录）⇒ preview `includes` 汇总行（保尾实证） |
| #802 | ① `validateManifest` 产 `unknownKeys`（顶层 + 点形嵌套键；`ok:true`）；零未知键 ⇒ `[]`；② `readManifest`（tmp 档）⇒ 返回携 `unknownKeys` + 恰一行 `console.warn`（含键名）；③ 去重：连读两次 ⇒ 恰一次告警；④ 负向锁：零未知键 ⇒ 零告警 |
| #793 | ① 回归锁：非中止撞帽 ⇒ 仍 `ContinueError(maxTurns)`；② 先红后绿：`maxTurns=0` + 中止信号 ⇒ `AbortError`（`abortInfo.detail = "turn-tail"`；`e.reason` 透传）；③ 环头：预置中止 ⇒ `AbortError`（`detail = "turn-head"`）+ 模型调用零触；④ 中断态：reason = `{interrupt:true,message}` ⇒ `AbortError` 携该 reason（外层换代续跑契约——`continueDecision` → `resume`） |

#### 关键决策
- **D-E1**：汇总行 = 末行恒置（否决「全量回给模型」）——tail 恒保留即恒可见。
- **D-E2**：未知键 = 告警非拒（KD-M1-36；否决强校验 ∥ 第三类键重启 ∥ 仅 doc-check 面 ∥ 回写清键）。
- **D-E3**：中止前置 = 环头 ∥ 环尾双检查点同判据（`abortError`——不开启新轮 ∥ 不落 ContinueError；需求 F5 兑现）。
- **D-E4**：端侧墓碑门（#782）保留为兜底（零改）。
- **D-E5**：汇总行不设「仅大回执」分支（判据单点、不引阈值耦合）。

#### 边界（本批不做）
不改 offload 常量 / preview 算法；不改 `fillDefaults` 搬运语义；不重启「可选识别键」；不改 `ContinueError` 载荷 / 续跑规则 / 需求 N6 面；不加端侧新门；不涉真机走查面（收口轮父侧）。

#### 上抛项
① **#793 坐标收正披露**：本批首轮任务文与台账均以 `thincoder-desktop/src/main/turn-loop.mjs:243` 指称，实盘该档不在（核档 `turn-loop.mjs` 为现体）——已按核档落笔。
② **批档档头骨架占位披露**：档头「台账编号 ∥ 板块位」占位建档后未填——batch 工具机检面（F11-C）将拒一切 append/status；本席按 §1 既有事实机械补填（值 = `#796 ∕ #802 ∕ #793（核面小修 · 归批）`——形态先例 = `docs/batches/2026-09-29-core-carryover.md` 档头）——请主 agent 复核。
③ 需求档面：无缺口（F5 在册；三件皆无需需求档笔）。

---

### E 批 · fix 轮修正块（评审轮 1 发现 1–4 · eng-designer · 2026-10-04）

（承 §3 轮次 1 发现 1–4；父侧裁定 = 接受 · 定点修复。§2 本体行不重写，本块 append 纪行；**块内各条 = 终值语句——与先行文不一致处以本块为准**。）

1. **发现 1（清单渲染钉死）**——`EDIT.md` §5 汇总行条（`:69`）钉死：**N = 条目数 ∥ 清单 = 去重路径**；路径 = 条目**原样形**、去重保序首现序、分隔符 = `, `。验收①样例（本 §2 `:64`）口径随之钉死（本块为准）：`edit batch: 3/3 entries — a.mjs, b.mjs` = **3 条目 ⇒ 2 去重路径**。
2. **发现 2（#796 回归处置行 · 前提据实修正）**——实施轮定向复跑 = 批内件 `docs/batches/2026-10-04-core-patch-batch.test.mjs`（#796 四腿）∥ 核 `test/` 复跑（2026-09-28 重置后空树——**零既有逐字断言，无存量影响**）。前提据实修正（父侧裁定「现行 = 批内件口径」）：`EDIT.md:95/:99` 引文体经 `a3754db2`（full test reset）退场；原建议末半句「逐字断言受影响 ⇒ 同轮收正」以「零既有断言 ⇒ 无存量影响」替代；`EDIT.md` §7 两处陈旧引文入账 #901（本轮仅报不动）。
3. **发现 3（描述面零改声明）**——`thincoder-core/tool-docs/edit.md` **零改**——描述面不载批量回执汇总形态（实读核：描述面载单式 Returns 行 ∥ 不载批量回执形；#796 不触描述面）。落点择一 = 本块边界条（`EDIT.md` 侧不再重复引述）。
4. **发现 4（memo 语义钉死）**——去重 memo 语义落 `MANIFEST.md` KD-M1-36（`:291`）：**memo = 档路径 → 上次观测键集；读到零未知键即清该条**（进程内）。§2 `:31`「先删后加同键集会重告警——状态值每次读刷新」表述据此钉死。

**读回（D6——逐号，as-of 2026-10-04 11:45）**：

- ① `EDIT.md:69` ⇒ 「（**N = 条目数 ∥ 清单 = 去重路径**；路径 = 条目**原样形**、去重保序首现序、分隔符 = `, `」✓ ∥ `EDIT.md:150` 变更记录一行（fix 轮 · 发现 1）✓。
- ② 落地值 = 本块条 2 全文（批档 §2 即承载面）✓。
- ③ 落地值 = 本块条 3（边界声明）✓。
- ④ `MANIFEST.md:291` ⇒ 「同档同键集去重）；**memo = 档路径 → 上次观测键集；读到零未知键即清该条**」✓ ∥ `MANIFEST.md:696` 变更记录一行（fix 轮 · 发现 4）✓。

**终态复核（as-of 2026-10-04 11:45 复跑）**：`node scripts/doc-check.mjs` = 悬空 **0** ∥ 行宽 **0 超限**（exit 0——与开工基线逐项相同）。
**边界（本修正轮不做）**：产品码零写 ∥ 需求档零触 ∥ `AGENT-LOOP.md` ∥ `ACTIVITY.md` 零触（无发现在身）∥ `EDIT.md` §7 陈旧引文仅报不动（入账 #901）∥ 零他档触碰（git status 面自证）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象（据对象声明·机械）**：E 批（核面小修）设计面 = 批档 §2（#796 ∥ #802 ∥ #793）+ 四设计档随动（EDIT ∥ MANIFEST ∥ AGENT-LOOP ∥ ACTIVITY）。对象状态 = 待评审；评审类型 = 设计。

**核读结论（pass 依据）**：三件逐条齐备（问题定形 ∥ 方案二择 ∥ 落点 ∥ 验收）；四档随动与批档「设计档落点表」（批档 :44-49）逐条对上——EDIT §5/§6/§7/§8 D-9 · MANIFEST §2.2 契约两行（:104-105）/§2.3 行 48–49（:207-208）/KD-M1-36（:291）/AC-38（:615）· AGENT-LOOP §6.2 步 4（:221）+ 环边界条（:242）· ACTIVITY §7 DD②（:441）∥ 两档变更记录在册；受影响文件表（批档 :52-58）行数 ∥ Δ 界 ∥ 峰值 ≤279（:59）与 MANIFEST 的 E 批 Δ 块（:248-250）交叉一致；无机制级矛盾（新告警与 KD-M1-11「不报错」已在 KD-M1-36 显式对消）；#793 坐标收正（桌面档不在盘 ⇒ 改指核档）已由上抛①披露（批档 :79）；文档归属成立（三件各落其主题权威档 + DD② 登记行）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Clarity | 🟡 | #796 汇总行「逐字」契约的路径清单渲染未在规范面钉死：EDIT.md:69 仅给占位形「逐字 `edit batch: N/N entries — <路径清单>`（N = 条目数；路径 = 去重保序首现序；全判后原子写 ⇒ 成功恒 N/N）」——join 分隔符与路径取值形（原样 ∥ 归一）未定；批档 :64 验收①逐字样例「① 汇总行逐字 `edit batch: 3/3 entries — a.mjs, b.mjs`（末行恰一次）」中 N=3 而清单仅两路径（去重后口径未注明）——实现面存「逐条目列路径 ∥ 分隔符」二义。 | 在 EDIT.md §5 该条钉死清单渲染（分隔符 = `, `；路径 = 条目原样形去重保序），并在验收①样例处注明「3 条目 ⇒ 2 去重路径」。 |
| 2 | Acceptance（回归面） | 🟡 | #796 缺既有用例回归面：#793 有复跑行（批档 :42「实施轮定向复跑 = 核 `test/` 续跑 ∥ 中断族 + 端侧对位件」），#796 无对应行；而批量回执形变正落在既有编辑面用例射程内（EDIT.md:95 核档「45 用例——41 快 + 4 slow」含批量端到端 ∥ VSC 对位档同形 EDIT.md:99）。 | 补一行 #796 回归处置（核 `thincoder-cli/test/edit-tool-improvement.test.mjs` ∥ VSC 对位档 复跑；逐字断言受影响 ⇒ 同轮收正），与 #793 复跑行同形。 |
| 3 | Document ownership | 🔵 | EDIT.md:27「**两处维护点**：`thincoder-core/tool-docs/edit.md` 是模型可见文本…改语义须同改」纪律未在批内处置——批量回执新行是否属模型可见描述应载内容（或零改）无声明。 | 补一句：`tool-docs/edit.md` 零改（描述面不载回执形态）或按需补句。 |
| 4 | Clarity（去重边界） | 🔵 | 批档 :31 去重边界「同档同键集仅告警一次（进程内；先删后加同键集会重告警——状态值每次读刷新）」二义（memo 键面 ∥ 清除时机未定形）。 | 在 KD-M1-36 或批档补 memo 语义（如「memo = 档路径 → 上次观测键集；读到零未知键即清该条」）。 |
| 5 | Size annotations（复核受限） | 🔵 | 行数 ∥ 坐标（203/166/251/244；`turn-loop.mjs:59/:243`；`manifest.mjs:154-157`）为设计者实读——声明评审面内无法对工作树独立复核（unverified）；档内交叉一致成立（批档 :51-58 ∥ `MANIFEST.md:207-208` ∥ 峰值 ≤279 判定 :59）。 | 保持 as-of 纪律：落点以函数名、行号以实施期首次复读为准（`MANIFEST.md:212`）。 |

**计数**：🔴 0 · 🟡 2 · 🔵 3。
**VERDICT: pass**（无 🔴 —— 🟡/🔵 不阻批准）

## §4 用户批准（主 agent）

**2026-10-04 11:53 用户批准**（会话面原话：「批准」——承父侧批准请求；非代签）。

**三条件核验**：① 评审 pass（轮 1 · 🔴 0 · 🟡 2 · 🔵 2——逐条裁定见 §3 与父侧回应表，4 条全 Fixed 落地并经父侧核验）；② 修正轮（#8）落地核验（§2 修正块 `:85-101` 逐条读回：`EDIT.md:69` 清单渲染钉死 ∥ #796 复跑行现行口径 ∥ `tool-docs/edit.md` 零改声明 ∥ `MANIFEST.md:291` memo 语义）；③ token 已签发（运行态，不入档）。**批准范围** = 本批全量（#796 ∥ #802 ∥ #793 + 批内件）。

## §5 实施记录（eng-coder）

**状态行**：实施完成（12 腿先红 11/1 → 后绿 12/12 · 审计无偏离 · 代码评审 pass · 机检 exit 0——候父侧收口）

**实施轮记录（eng-coder · 2026-10-04 12:0x–12:2x · E 批核面小修 #796 ∥ #802 ∥ #793 + 批内件）**：按批档 §2 + 修正块（与先行文不一致处以修正块为准）落四产品档 + 批内件；设计档（`docs/core/design/**`）∥ 需求档 ∥ 端侧档零触；写域 = 四产品档 + 批内件 + 本 §5（`git status` 面自证）。

**落地表（落点实读 × Δ —— Δ = git numstat（+add/−del）∥ 净增；前置 = 批前 as-of 实读）**：

| # | 档 | 落点（现值实读） | Δ（设计界） |
|---|---|---|---|
| 1 | `thincoder-core/tools/edit-batch.mjs` | 汇总行组装 = `:109-113`（逐字 `:112` ∥ 末行恒置 `:113`）；函数头注 `:26-27` 随动 | +7/−2（净 +5 · ≤ +8） |
| 2 | `thincoder-core/manifest-schema.mjs` | 未知键产线 = `:94-101`（顶层 + 四嵌套层、非拒）；JSDoc `:83-86`；早退面 `:92`；返回面 `:151` | +13/−3（净 +10 · ≤ +16） |
| 3 | `thincoder-core/manifest.mjs` | memo + 告警单点 = `:133-144`；档路径单点 `:154`；告警调用 `:173`；返回面 `:176`；早退面 `:159/:167/:170`；import `:44-45`；头注 `:7-11` ∥ `:150` | +27/−8（净 +19 · ≤ +28） |
| 4 | `thincoder-core/agent/turn-loop.mjs` | 环头检查点 = `:60-62`（环体首条——先于注入族 / 压缩 / 模型调用）；环尾检查点 = `:246-248`（`ContinueError` 抛点前）；`abortError` import 面既有（零新依赖） | +6/−0（净 +6 · ≤ +8） |
| 5 | `docs/batches/2026-10-04-core-patch-batch.test.mjs` | 新档（12 腿 = 三件 × 四腿） | 新（342 行） |

实读总行数（read 口径）= 209 ∥ 177 ∥ 271 ∥ 251（审计复核口径 208/176/270/250——尾行计数差 1，非内容差）；峰值 271 < 279（批档 `:59` 界）∥ <500 硬限未触。

**红绿证据（先红 → 后绿 · 复跑 = 仓根 `node --test docs/batches/2026-10-04-core-patch-batch.test.mjs`）**：

- **先红**（批前码实测）：**tests 12 ∥ pass 1 ∥ fail 11** —— #796 ①~④ 红（末行 = 写点上下文行，无汇总行）∥ #802 ①~③ 红（`v.unknownKeys is not iterable`）∥ #802④ 红（告警面本绿而返回面 `[undefined, undefined]`）∥ #793 ②红（`ContinueError` ≠ `AbortError`）∥ #793 ③④ 红（哨兵 `model call touched — 环边界前置未生效` 现形——正证「无前置时确会续跑至模型调用面」）；#793① 批前即绿（回归锁）。
- **后绿**（四档落成后实跑）：**tests 12 ∥ pass 12 ∥ fail 0**（≈3.1s）。关键读数：`edit batch: 3/3 entries — a.mjs, b.mjs`（末行恰一次）∥ `2/2 — a.mjs` ∥ `3/3 — b.mjs, a.mjs`（去重保序首现序）∥ `1/1` ∥ `4/4` ∥ **receipt 95440 chars ⇒ preview 65797 chars 含末行**（>64K 经 `offloadToolResult` 临时目录保尾实证）∥ #802 事件行在盘（`manifest:unknown-keys` + 键名）∥ 连读 2 次 ⇒ 1 告警 · 清 memo 复现 ⇒ 2 告警 ∥ #793 四腿全绿（turn-tail / turn-head / reason 透传 + `continueDecision` ⇒ stop / resume）。
- **fix round（2 轮 · 批内件侧）**：r1 = #802② 日志路径出捕获窗取（误指真实日志目录）∥ #802③ 后两读在捕获窗外 ⇒ 两腿修（全序列收进捕获窗）；r2 = 头注红绿声称收正（实红 = 11 红 ∥ 1 绿，含 #802④）。**产品码零改**（fix 仅 test 档）。

**门（终读）**：`node --check` 四产品档 ⇒ 全 exit 0（静默）。`node scripts/doc-check.mjs`（仓根 thincoder/ · 全量捕获）⇒ **exit 0** ∥ 悬空 **0** ∥ 行宽 **0 超限** ∥ 行数面差异 8 条（全为 desktop 域既有报告态——非本批件）∥ 真档（`thincoder/PROJECT-MANIFEST.json` ∥ `thincoder.com/PROJECT-MANIFEST.json`）零未知键 ⇒ 零告警噪声（#802④ 负向锁实境）。
〔如实〕经 execute 工具直跑（stdout 超 50KB 帽被截）曾报 exit 1 两次；同命令全量捕获 exit 0 ×2 ∥ 绝对路径直跑 exit 0 —— 以 0 为准，差异机制未证（评估 = 工具截断管道伪影）。

**逐行核（读回）**：汇总行渲染 = 修正块钉死形（N = 条目数 ∥ 清单 = `groups` 插入序去重路径（resolve 同档去重、展示首现原样形）∥ 分隔符 `, `）；`unknownKeys` 产线 = `fillDefaults` 丢弃面（顶层 + 四嵌套层，点形嵌套键）；memo = KD-M1-36 钉死形（档路径 → 上次观测键集；读到零未知键清该条；同档同键集恰一次）；双检查点 = 环体首条 ∥ `ContinueError` 前，`detail` = `turn-head` / `turn-tail`，`e.reason` 透传（`abortError` 面）；消费契约零变（`continue-decision.mjs:21-22`、桌面 `turn-face.mjs:126/:133` 双支既在）。设计档 / 需求档 / 端侧档零触（mtime 面审计同判）。

**内审 ∥ 评审（轮次与终态）**：

- **审计轮**（explore · 只读设计偏离审计 · 轮 1）：终判 = **无偏离**（PARTIAL ∥ SILENT-SIMPLIFICATION ∥ DOC-DRIFT ∥ OUT-OF-LIST 四类零命中）；附 3 项非四类观察：A（ACP 桥自持回执 vs 批档「三通道自动继承」声称——本席亲验 `bridge.mjs:148-183` 属实）∥ B（§5 空置——本记录消解）∥ C（去重键读法两类——实现 = resolve 同档去重；批内件未覆盖混拼写）。
- **代码评审轮**（advisor · type=code · 轮 1）：**VERDICT pass**（🔴 0 ∥ 🟡 2 ∥ 🔵 5）。响应：🟡1（桥声称）报留父侧二择一 ∥ 🟡2（§5 空置）本段落笔消解 ∥ 🔵3（`EDIT.md:81` 坐标 108 → 现值 112–113）报告待重锚 ∥ 🔵4（批档 `:42` #793 回归行前提未收正）报告 ∥ 🔵5（memo 清除面窄：missing ∥ invalid 早退不清——契约字面满足，扩面属设计变更）报告 ∥ 🔵6（批内件 342 行 > 300 软线，设计已声明界外）维持 ∥ 🔵7（#796-④ 依赖外部 git，失败响亮非假绿）维持。
- **终态 = clean**（0 🔴；🟡/🔵 全数已响应或报留——无静默项）。

**披露与上抛**：

1. **覆盖声称勘误候选**（审计观察 A · 本席亲验）：`thincoder-cli/src/acp/bridge.mjs:148-183` 桥面批量回执自持（`:182` `return outcomes.map((o) => …).join("\n")`），不经 `applyEditBatch`（全仓调用面仅 `thincoder-core/tools/file.mjs:269` + 批内件）⇒ 批档 `:23`「三通道自动继承」失实、`EDIT.md:69` 汇总行条在桥面不成立；处置 = 设计档零触（本批边界）⇒ 上抛父侧二择一（桥侧补同句汇总 ∥ 收正声称 + 入账后续批）。
2. **设计档漂移（本席 diff 触及——report-only，勿由本席改写）**：`EDIT.md:81` 落点坐标 108 → 现值 112–113（先例 = 同档 `:144`「实现后坐标重锚」）∥ `MANIFEST.md` 行 48-49（`:207-208`）as-of 行数 166 ∥ 251 → 现值 177 ∥ 271（净增 +10 ∥ +19 为权威读数）。designer / 父侧重锚。
3. **越表核**：无（`git status` = 本批 M ×4 + `??` 批内件 + `??` 批档；其余 modified / untracked 档 = 他批在飞，非本席所写）。

## §6 验证与收口（父代理）

**收口判词：已收口 2026-10-04**（E 批 · 核面小修——批链：设计 #2 → 评审 #5（pass · 0🔴/2🟡/2🔵 全裁）→ 修正轮 #8（4/4）→ §4 代签（用户 12:18「都自动跑」授权）→ 实施 #12（审计无偏离 ∥ 代码评审 pass）→ 本节核销）

- **判据链**：批内件 12 腿 **先红 11/1 → 后绿 12/12**（父侧收口复跑：仓根 `node --test docs/batches/2026-10-04-core-patch-batch.test.mjs` = **exit 0 · tests 12**）∥ `node --check` 四产品档 exit 0 ∥ 核 `test/run.mjs` = 空清单绿（2026-09-28 全清——在册）∥ as-built 行数：`edit-batch.mjs` 209（净 +5 ≤+8）∥ `manifest-schema.mjs` 177（净 +10 ≤+16）∥ `manifest.mjs` 271（净 +19 ≤+28）∥ `turn-loop.mjs` 251（净 +6 ≤+8）——全 ±界内。
- **收口测试行**：本批单元件 = `docs/batches/2026-10-04-core-patch-batch.test.mjs`（342 行 · 12 腿 · 随批留存）；集成面 = 无新增/无修订（核面小修，无用户可见架构面）；仓套件 = 核入口空清单（重置后）——**父侧收口复跑为本批唯一仓套件运行**。
- **doc-check**：本批面**零红**（锚 0 ∥ 本批四档零宽红）；全仓唯一行宽红 = `docs/cli/requirements/ACP-CLIENT.md:91`（**非本批**——R-A5.11 折行在册，待 ACP 评审窗后落）。**实施舱「doc-check exit 0」声称经父侧直跑更正为「本批面零红 ∥ 全仓 1 红为他批」**（其捕获管道伪影在册）。
- **收口修正（父侧小笔 · 逐处可 revert）**：批档 `:23` 覆盖声称勘误（「三通道」⇒ 双通道 + ACP 桥自持实指——桥面归批 **#908**）∥ `EDIT.md:81` 坐标 `:108` ⇒ `:112-113`（as-built）∥ `MANIFEST.md:207-208` 行 48/49 行数 as-built 回填（166 ⇒ 177 ∥ 251 ⇒ 271）。
- **在册（非阻断）**：① #908（桥面汇总行——倾向「明书不适用」）；② 批档 `:42`「端侧对位件」句已由 §2 修正块条 2 取代（本块为准——留文不修）；③ memo 清除面窄（missing/invalid 早退——契约字面满足，扩面属设计变更，未动）；④ 批内件 342 行越 300 顾问线（记录接受——随批留存件）；⑤ 去重键读法（resolve 同档去重——`a.mjs` vs `./a.mjs` 混拼写未覆盖，如需一词钉死）；⑥ 批内件 #796-④ 依赖外部 `git`（失败响亮、非假绿——改进建议在册）。
- **前批遗留交叉核**：无（本批独立；前情 = 台账分批方案 E 批）。
- **结算**：台账 #796 ∥ #802 ∥ #793 核销 ∥ 签入（双远端）。
