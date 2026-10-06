# 子代理面板 · 实况回读与归还补口（PANEL-READBACK）

> 设计档（desktop 部分 · 2026-10-04 建）。单源：批档 `docs/batches/2026-10-04-subagent-panel-live-face.md` §1（用户 00:12 ∥ 00:15 裁定 + #49 只读诊断 + 会话槽法证）· 台账 #891 ∥ #892。
> 覆盖四面：**㈠ 桌面 `panel view` 实况回读**（主交付——用户明确要求，不得降级）· **归还补口**（「消费 ⇒ 必发 done」不变量）· **③ 桌面回收阀**（CLI `panel freeze` 桌面对位）· **④ 对账自愈**（已落——2026-10-06 宿主侧自愈扫 + done 帧痕；§2.4）。
> 边界：#51 在飞写域零触（`thincoder-core/ledger-*.mjs` ∥ `thincoder-cli/src/**` ∥ `docs/cli/design/{CLI-ENTRY,ACP-CLIENT}.md` ∥ `docs/batches/2026-10-03-read-data-interface*`）· #50（design-token 系档）零触 · 已收口批档零触 · advisor 面零触。

## 1. 问题陈述（现状与证据 —— 本设计轮实读）

### 1.1 ㈠ 契约不成立（实报）

`subagent` 工具描述承诺 panel view = "the live blocks … exactly as the user sees them"（`thincoder-core/tool-docs/subagent.md:10`）。但桌面会话下 `panel view` 恒走**降级池视图**：

- 视图面只读 `ctx.state`（= `agent._tuiState`——CLI TUI 装配处挂载；`thincoder-core/agent-tools/subagent.mjs:191`）；
- 桌面无该挂载 ⇒ `computePanelBlocks` 返 `null`（`thincoder-core/agent-tools/panel-blocks.mjs:14-15`）；
- ⇒ 返回 `degraded:true` + 池派生列表（`thincoder-core/agent-tools/subagent-panel.mjs:136-170`）——与 `status` 面重复，看不到渲染面。

用户 00:12 原话定性：「subagent 的那个 panel 操作当初设置的目的为为了让你能够看到 ui 上实际呈现的区块的，结果被做成了看核侧的，那这个还有啥意义？」——㈠ = 主交付。

### 1.2 归还补口（trio 零归档）

会话槽法证（批档 §1）：`sub:advisor#27` ∥ `sub:eng-coder#36` ∥ `sub:eng-designer#40` 三块**零归档记录**——报告均已送达模型、核账本干净，但「done」归档信号从未发出 ⇒ 渲染面块停在 `awaitingDigest`。

- 驻留态来源 = 核态机 `settled` ⇒ `awaitingDigest:true`（`thincoder-render-core/subblocks/state.mjs:249-251`）；`done` 对 awaitingDigest 收 ⇒ 归档（`:238`）。
- 渲染面归档闸 = `frozen ∧ ¬awaitingDigest ∧ region≠"flow"`（`thincoder-desktop/renderer/subagent-reduce.mjs:141` ∥ `:161`）。

**消费路径普查**（`_pendingAsyncResults` 单容器逐条离容点——本设计轮实读全集）：

| # | 离容点（file:line） | 现状发射 | 判定 |
|---|---|---|---|
| C1 | run 起跑注入 `splice(0)`（`thincoder-core/agent/run-start.mjs:33-45`——用户 ∥ 消化 ∥ timer 各轮同一注入点） | 核 `hooks.reclaim`（循环侧差集 `consumedByRun`——`thincoder-core/agent/suspension.mjs:196-202`）+ 桌面消化轮另有**起跑窗主面**逐条补发（`thincoder-desktop/src/main/suspension-drive.mjs:157`） | 覆盖，**但**：消化轮 Abort-continue `continue` 跳过 reclaim（`thincoder-core/agent/suspension.mjs:239-244`）∧ 用户 ∥ 消化 ∥ timer 三支的 reclaim 皆是**正常径语句**（`:225` / `:247` / `:271`）——runTurn 抛错即不达 ⇒ **窄窗 + 异常窗零发射** |
| C2 | 退出残差直注入 `splice(0)`（`thincoder-core/agent/suspension.mjs:129-132`——`finishSuspension` idle 清场） | **零**——随后 `hooks.freezeAll`（`:286`）读 `resident()`（`thincoder-desktop/src/main/suspension-drive.mjs:62-70`）已不含被注入条目 | **零发射口**（确认） |
| C3 | 会话中止清空（`thincoder-core/agent/suspension.mjs:122`——`carrier._pendingAsyncResults = []`） | 宿主冻结快照兜住：`abort()` 先取 `entry.frozen ??= resident()`（`thincoder-desktop/src/main/suspension-drive.mjs:269`）⇒ `freezeAll` 逐条补发（`:230-234`） | 覆盖（保持零改） |
| C4 | 回合中止 filter（`thincoder-core/agent/run-stages.mjs:206`——consult/escalate 族丢弃） | 同 C3 快照（快照时点先于 filter） | 覆盖（保持零改） |
| C5 | 回合尾直注入（`run-stages.mjs:252-270`——`suspDriven=false` 径） | 非桌面径（桌面 `thincoder-desktop/src/main/turn-face.mjs:120` 恒 `suspDriven:true` ⇒ 桌面零触） | 范围外（逐实读注明） |

⇒ 结构性收口 = **「消费 ⇒ 必发 done」不变量**：容器内每一条离容（注入消费 ∥ 残差注入 ∥ 丢弃），必达 **≥1 次** `done` 补发（归档/记录恰一次住幂等层——重复补发不增档）——经既有 `hooks.reclaim` / 中止快照两面，**不新造第三发射面**。修点 = C1 的 Abort-continue ∥ 异常窗 + C2（含残差注入器抛错窗——§2.2）。

### 1.3 ③ 回收阀缺位（实报）

`panel freeze` 桌面恒拒——`panelFreezeGate` 首判 `computePanelBlocks(ctx.state)` 返 `null` ⇒ `"panel unavailable — … CLI-TUI-only, AC-P4"`（`thincoder-core/agent-tools/subagent-panel.mjs:58-61`）。#891 的卡留块（用户所见「挂着没消化」）正缺此阀。

## 2. 方案与理由（决策 + 候选对照）

### 2.1 ㈠ 通道形：渲染面快照上报 + 主侧读数缓存（选定）

候选三案对照（先例均在册）：

| 案 | 形 | 先例 | 代价 | 判定 |
|---|---|---|---|---|
| **A 上报 + 缓存（取）** | 渲染面帧出口按签名去重 ⇒ `invoke("panel:state", { key, blocks })` 上报；主进程缓存；工具**同步读** | `theme:state`（渲染→主单向报告；主侧 `src/main/window.mjs:120-124` 收面置缓存） | 白名单 +1（48 位次）· 渲染写入点一处 · 陈旧界 = 上次上报（携 `asOf` 显龄） | **取**——覆盖 trio 判别面（判别六键 + `role`/`id` 随行）；工具保持同步；零请求往返 |
| B 按需回读 | 工具 ⇒ 主 ⇒ 渲染面请求/应答（请求 id + 超时 + pending map） | `history:page` 方向相反（渲染拉主），本向无先例 | 双向请求管道 + 工具路径异步入工具面 + 降级分支倍增 | 否——增益仅「现刻新鲜度」（≤帧龄）；卡留块状态恒定，无可感差别，不成比例 |
| C 主侧事件镜 | 主进程自行归约 `ev:subagent` 造第二份块表 | 无（反先例） | 第二状态副本 = 与渲染面漂移面——本批要消的正是「看核不看 UI」 | 否——违背契约本义 |

**载荷形**（恰取 trio 判别面）：

- 信封：`{ key }`（会话键）+ `blocks[]`；主侧到达即盖 `receivedAt`（单时钟权威——渲染面时钟不做跨进程比较）。
- 块字段 = **判别六键 + `role`/`id` 随行**：`{ key, status, frozen, awaitingDigest, region, dom }`（判别面——签名去重与 trio 归判只读此六键）+ `role`/`id`（随行——发射寻址与标注）：
  - `key` = 渲染面块键（`sub:role#id` 形；consult 子块 `consult#N` 同表）；
  - `status` = 核态机活态（running/queued/done/cancelled/error——`state.mjs` 模型字段逐字）；
  - `frozen` ∥ `awaitingDigest` = 归档闸两判据（`subagent-reduce.mjs:141`）逐字上报——**trio 判别主键**；
  - `region` = `"activity"`（驻右列）∥ `"flow"`（已入流——归档墓碑）——**入流位**；
  - `dom` = 渲染面元素在场：查 `[data-subname="<key>"]`（核件 `thincoder-render-core/subblocks/block.mjs:30` 单点盖章；活动区块与流内回显块**同属性** ⇒ 单查询覆盖两区）。
- **推送点** = 渲染面**帧出口**（`renderer/app.mjs:307-315` `applyFrame` 五面分派之后——DOM 已落），按**签名**（上列字段串 + 会话键）去重：同签名零报；状态迁转 ∥ 出生 ∥ 归档 ∥ DOM 增减 ∥ 会话切换 ⇒ 一报。流式 `rows` 变化不入签名（内容面不属判别面——不产生逐 token 上报）。
- **主侧缓存** = 新档 `thincoder-desktop/src/main/panel-live.mjs`（拟新增）（`Map key → readout`；`report(key, blocks)` ∥ `get(key)`；后报覆前报）。代理装配处挂 `agent._panelReadout = () => panelLive.get(key)`。
- **工具读源链**（`executePanelAction` 视图面）：`ctx.readout()` 快照非空 ⇒ 返回 `{ source:"renderer", asOf, ageMs, panel[] }`——awaitingDigest 条目**读时交叉**核池/pending 标 `digested`（沿 CLI 面判据 `thincoder-core/agent-tools/subagent-panel.mjs:176-185`；consult 子块走同款消费判据）∥ 快照空（窗未载 ∥ 未报）⇒ 回落现链路（`ctx.state` → 降级池视图；两降级注保留）。
- **陈旧呈现**：`ageMs` 恒携（防「读了旧镜不自知」）；**不设截断阈值**——卡留块状态恒定，旧镜亦真；截断反会隐藏判别面。

### 2.2 归还补口：回收恒达窗（结构性收口）

**不变量（核 · 单点声明）**：`_pendingAsyncResults` 条目每一条离容，必达 **≥1 次 done 补发**——发射经既有两面（`hooks.reclaim` 消费条目 ∥ 中止快照丢弃条目），不新造第三面；**归档/记录恰一次**住幂等层（`drop-frozen` 丢弃——重复补发不增档）。

落法（核 `thincoder-core/agent/suspension.mjs` 三支 + 一处返回面；全部为「发射口恒达」形，零新语义）：

1. **循环内三支 runTurn 调用**（用户支 `:220-228` ∥ 消化支 `:236-249` ∥ timer 支 `:261-274`）：`hooks.reclaim?.(afterRun())` 移入**恒达窗**（`finally` 形）——正常 ∥ Abort-continue ∥ 异常抛**三径同达**。消化支 Abort-continue 的既有语义序保持（`onDigest("end")` 先行；reclaim ∥ onCounts 于重入前到达——两探针幂等，序不影响归档判定）。
2. **`finishSuspension` 残差注入**（`:129-132`）：`splice(0)` = **离容全量** `left`；注入循环 **try/catch 收口**（前缀 = `injected`；首错 = `error`）；返回 `{ injected, left, error }`；调用点（`:285`）在 `hooks.freezeAll?.()` 前增 `hooks.reclaim?.(left)`——**补发面 = 离容全量（抛错径同覆）**；`error` 非空 ⇒ 重抛（**fail-loud 保持**）。与 freezeAll 双探针幂等。
3. **既有 C3/C4 快照径保持零改**（回归锚——不得以「收口」名义动中止语义）。

宿主侧（桌面）零改：`reemitDone`（`thincoder-desktop/src/main/suspension-drive.mjs:76-86`）本为 `hooks.reclaim`/`freezeAll` 唯一消费体——逐条 `done` 直发 `ev:subagent`；consult 族 `childIds` 展开既有。

### 2.3 ③ 桌面回收阀（freeze 桌面对位）

- **门控数据源扩为「回读源链」**：`panelFreezeGate` 首判从「`computePanelBlocks(ctx.state)` 单源」改 **`readPanelSource(ctx)`**——`ctx.readout`（桌面渲染面快照）优先 ∥ `ctx.state`（CLI 现算）∥ 二者皆空 ⇒ 维持现拒因文案。CLI 面**判据与文案零变**（同一门控函数、同序检查）——**唯一有意放宽 = 键规范化（下条——两端同宽，接受面纯增）**。
- **判据映射**（门控序）：`key` 规范化命中块（**键规范化——有意放宽且两端同宽**：`sub:` 前缀剥除后比对，桌面 ∥ CLI 皆接受 `sub:advisor#27` 与 `advisor#27` 两写法；命中后②③④与发射全用规范化键）⇒ ① `awaitingDigest === true`（否 ⇒ 逐态拒因，文案沿运行时块 ∥ `region === "flow"` 追加拒因——已入流 = 已归档，无卡可收）② 池归属查 ③ pending 单容器查 ④ consult 子块消费判据——②③④**复用既有函数逐字**。
- **发射**（消费端 = 渲染面归档机——零新消费者）：门控通过 ⇒ `ctx.callbacks.onToken("${规范化键}/⟦ev⟧done\x1e0\x1e0\x1edone\x1e")`（sub 块 = `role#id` ∥ consult 子块 = `consult#N`）——**与 CLI 面同字面**。
  链路：桌面主会话 callbacks = 桥面（`thincoder-desktop/src/main/turn-face.mjs:114` `run(agent, body, bridge(key), …)`）⇒ `bridge.onToken` relay 分流（`thincoder-desktop/src/main/agent-bridge.mjs:153-158`）⇒ `relayEventToSubPatch` 表（`thincoder-render-core/subblocks/relay.mjs:135`）
  ⇒ `ev:subagent {status:"done"}` ⇒ 态机排收 done ⇒ 归档（awaitingDigest 收 done ⇒ `archive atBoundary`）⇒ 归档入流 + **`record:append` 落档**（`thincoder-desktop/renderer/subagent-reduce.mjs:125-138`——trio 缺的正是这份记录）。
  `sub:` 前缀**必须**在发射前剥除（relay 前缀文法 `^([\w-]+)#(\d+)\//` 不吃 `:`——`thincoder-render-core/subblocks/relay.mjs:22`；带前缀发出会漏入内容面）。
- 幂等：重复 freeze ⇒ 二次 done 命中已归档块 ⇒ 态机 `drop-frozen` 丢弃（`thincoder-render-core/subblocks/state.mjs:236-240`）——零重复归档、零重复记录。
- 工具描述收正（语义）：`agent-tools/subagent.mjs:135` freeze 参数说明的「requires the CLI TUI panel mirror」随本批改述（桌面回读源在列）；`tool-docs/subagent.md:10` 的「exactly as the user sees them」句**逐字保留**（本批把它变成真）。

### 2.4 ④ 对账自愈：已落（2026-10-06——宿主自愈扫 + done 帧双痕 · 台账 #978）

**落盘**（批 `docs/batches/2026-10-06-digested-stuck-fix.md`——light channel · defect fix · 可 revert）：`thincoder-desktop/src/main/suspension-drive.mjs`（自愈扫 + `reemitDone` 逐帧痕）∥ `thincoder-desktop/renderer/subagent-reduce.mjs`（`subBlocksReduce` trace 钩接线）。

**digested-stuck 定义**：渲染面块呈 `frozen ∧ awaitingDigest` 半态（终态已折叠 · 等待消化），而核侧两池 + pending 皆无该条目 = 报告已入模型上下文、块滞留等待归档——done 帧曾丢（帧面零持久痕 = #76 事故读面缺口）。

**自愈扫**（`sweepDigestedStuck`——`thincoder-desktop/src/main/suspension-drive.mjs:77-95`）：手动 freeze 谓词（`thincoder-core/agent-tools/subagent-panel.mjs:117-155`）的 beat 级自动化——渲染面上报块 `awaitingDigest ∧ frozen ∧ 非 consult` ∧ 核侧不在驻留（在途 ⇒ 零动作）⇒ 逐条补发 done（复用 `reemitDone`）。

**三拍** = 起跑（`:184`）∥ `onCounts`（`:255`）∥ `reclaim`（`:256`）；谓词逐 beat 现算 = 零新存储；重复发射由渲染面归档闸幂等消化。

**v1 限度**：扫拍依赖渲染面上报快照（`panel:state` 签名去重上报）——全静默时段无新上报 ⇒ 极端下仍等到下一活动拍。∥ **consult 族不在扫射程**（谓词显式排除——其滞留走手动回收径，门控 `consultChildUndigested`；D20 句「不得须用户介入」为方向性承诺，后续批按需扩扫）。

**done 帧发射点 = 四 + 自愈扫补发**（渲染面归档机的输入全集——发射不去重；归档 / 记录恰一次住幂等层）：

| # | 发射点 | 坐标 | 痕 |
|---|---|---|---|
| ① | 起跑补发（`ev:digest start` 发帧点） | `thincoder-desktop/src/main/suspension-drive.mjs:183` | `[suspension-drive] reemit-done` |
| ② | `hooks.reclaim`（兜底幂等） | `thincoder-desktop/src/main/suspension-drive.mjs:256` | 同左（四径共用点 = `:104`） |
| ③ | `hooks.freezeAll`（退出 ∥ 中止兜底） | `thincoder-desktop/src/main/suspension-drive.mjs:257-261` | 同左 |
| ④ | 手动 = 核 `panel freeze` 工具 | `thincoder-core/agent-tools/subagent-panel.mjs:117-155` 门控 ∥ `:194` 发射 ⇒ 桥 relay（§2.3） | 工具回执 + relay 面（未加宿主痕） |
| ⑤ | 自愈扫补发（beat 级——谓词同 §2.4 自愈扫条） | `thincoder-desktop/src/main/suspension-drive.mjs:77-95`（发射 = `:93`） | `[suspension-drive] sweep-digested-stuck` |

**双痕落点与读法**：宿主侧 `[suspension-drive] reemit-done` ∥ `[suspension-drive] sweep-digested-stuck`（`console.error`——主进程 stderr；四径共用点 + 逐拍命中表）。
渲染侧 `[subagent-trace] <name> <key>`（devtools 控制台——`thincoder-desktop/renderer/subagent-reduce.mjs:189-194`；丢弃径零静默——`thincoder-render-core/subblocks/state.mjs:36-39` 桌面诊断面「到期」兑现；丢弃径名 = `drop-frozen` ∥ `drop-tombstone` ∥ `late-terminal-stub` 等）。

**生效面 = 新进程**（本实例已载旧码——如实披露）。机制句单源 = 本节；家族决策行 = `docs/desktop/design/ACTIVITY.md` §1 KD-34。

## 3. 接口契约（数据流）

```
桌面会话（渲染 → 主 → 核工具 → 渲染闭环）：
  渲染面 store.subBlocks[activeSession] + DOM（[data-subname]）
    └─ 帧出口（applyFrame 后）──签名去重──▶ invoke("panel:state", { key, blocks[判别六键 + role/id] })
         └─ 主进程处理体 ──▶ panel-live.report(key, blocks)（+receivedAt）
              └─ agent._panelReadout() ──▶ 核 executePanelAction{ view | freeze }
                   ├─ view : { source:"renderer", asOf, ageMs, panel[]（awaitingDigest 条目标 digested）}
                   └─ freeze: 门控（readout 块态 + 核池/pending/consult 逐字复用）
                        └─ onToken("role#id/⟦ev⟧done…") ──▶ 桥 relay ──▶ ev:subagent {status:"done"}
                             └─ 渲染面态机归档 ──▶ 流内归档块 + record:append（会话槽）

归还链（核）：
  _pendingAsyncResults 离容（splice ×2 ∥ 清空）
    ──▶ reclaim（恒达窗） ∥ freezeAll（中止前快照）
        └─ 宿主 reemitDone ──▶ ev:subagent done ×N ──▶ 渲染面归档 + record:append
```

**新通道**：`panel:state`（渲染 → 主 · 白名单末位 **48**）——载荷 `{ key, blocks }`；回执 `{ ok:true }` ∥ `{ ok:false, reason }`（形沿 `theme:state`——`thincoder-desktop/src/main/ipc.mjs:271` 邻位；主侧缓存与处理体同 `panel-live.mjs`）。登记面（§2 该行 ∥ 白名单面）随本设计轮落 IPC.md（设计目标态；实施批翻已落）。

## 4. 受影响文件表（现行行数 as-of 2026-10-04 实读——口径 = 内容行数（文末换行不计）；+ 预算 delta）

| 文件 | 现 | Δ 预算 | 改动 |
|---|---|---|---|
| `thincoder-core/agent/suspension.mjs` | 300 | +12/−6 | 回收恒达窗（三支）+ `finishSuspension` 返回 `{ injected, left, error }` + 调用点 reclaim（§2.2） |
| `thincoder-core/agent-tools/subagent-panel.mjs` | 189 | +55/−10 | 回读源链 + 桌面 freeze 门控映射 + digested 交叉复用 |
| `thincoder-core/agent-tools/subagent.mjs` | 399 | +2/−1 | ctx 传 `readout`（`:191` 邻位）+ freeze 参数描述收正（`:135`） |
| `thincoder-desktop/src/main/panel-live.mjs`（拟新增） | 0（新） | ~45 | 回读缓存（report/get + `receivedAt`） |
| `thincoder-desktop/src/main/ipc.mjs` | 283 | +14 | `panel:state` 处理体（校验 + report + 回执） |
| `thincoder-desktop/src/main/ipc-registry.mjs` | 92 | +1 | handler 注册（白名单闭合——表行 = 白名单逐项） |
| `thincoder-desktop/src/preload/preload.cjs` | 83 | +1 | `CHANNELS` 47 ⇒ 48（`"panel:state"` 末位） |
| `thincoder-desktop/src/main/agent-host.mjs` | 322 | +3 | 装配挂 `agent._panelReadout`（per-key） |
| `thincoder-desktop/renderer/panel-readout.mjs`（拟新增） | 0（新） | ~60 | 快照构形 + 签名去重 + 上报（纯函数 + 注入面 `queryDom` ∥ `invoke`——平 node 直测） |
| `thincoder-desktop/renderer/app.mjs` | 321 | +4 | 帧出口挂 readout settle（`applyFrame` 尾） |
| `docs/batches/2026-10-04-subagent-panel-live-face.test.mjs`（拟新增） | 0（新） | ~260 | 批内件（用例清单 = §6；跑法沿先例 `docs/batches/2026-10-02-desktop-menu-system.test.mjs`） |
| `docs/desktop/design/PANEL-READBACK.md` | 0（新） | 本档 | 设计单源（本批） |
| `docs/desktop/design/IPC.md` | 543 | +6/−4 | `panel:state` 行 + 白名单面 ∥ §3.1 47 ⇒ 48（设计目标态）+ 档头 ∥ §3.1 行数齐平 + 变更记录 |
| `docs/README.md` | — | +2/−1 | 部分档行登记（desktop 设计 14 ⇒ 15 · 全档 52 ⇒ 53）+ 变更记录一行 |

行数闸：全部改动档 ≤ 500 硬限内；**超 300 顾问线登记（本批四档；+Δ 均不触硬限）**：
- `subagent.mjs` 399 → ~400（**已超 300 顾问线在册**，+1 不触硬限、不属本批拆分面——登记：随意它批拆分/收口）；
- `suspension.mjs` 300 → ~306（**现处 300 线、本批落点越线**（+6），不触硬限——登记：随意它批拆分/收口）；
- `agent-host.mjs` 322 → ~325（**已超 300 顾问线在册**，+3 不触硬限、不属本批拆分面——登记：随意它批拆分/收口）；
- `app.mjs` 321 → ~325（**已超 300 顾问线在册**，+4 不触硬限、不属本批拆分面——登记：随意它批拆分/收口）；
其余改动档 <300（`subagent-panel.mjs` 189 → ~234；新增两档均 <300）。**无跨限拆分触发**。

## 5. 四交付面落点表（对 §2 验收）

| 面 | 落点（核 ∥ 宿主 ∥ 渲染） | 验收指向 |
|---|---|---|
| ㈠ 实况回读 | `preload.cjs` ∥ `ipc.mjs` ∥ `panel-live.mjs` ∥ `agent-host.mjs` ∥ `app.mjs` ∥ `panel-readout.mjs` ∥ `subagent-panel.mjs`（视图面）∥ `subagent.mjs`（ctx） | AC-1 ∥ AC-4 ∥ AC-5 |
| 归还补口 | `suspension.mjs`（核——三支恒达窗 + finish 返回面） | AC-2 |
| ③ 回收阀 | `subagent-panel.mjs`（门控源链 + 发射）∥ `subagent.mjs`（描述） | AC-3 ∥ AC-4 |
| ④ 对账自愈 | `thincoder-desktop/src/main/suspension-drive.mjs`（宿主自愈扫 + done 帧痕——2026-10-06） | §2.4 ∥ 批 `docs/batches/2026-10-06-digested-stuck-fix.md`（台账 #978） |

## 6. 用例清单（批内件 ← 设计轮拟定；normal ∥ boundary ∥ error 逐条）

| 用例 | 面 | 类 | 输入 | 期望 |
|---|---|---|---|---|
| T-A1 | 归还 | 正常 | 用户轮消费 2 条目（起跑 splice 注入） | `reclaim(consumed)` 恰 2 条 ⇒ done ×2（回归锚——既有行为） |
| T-A2 | 归还 | 正常 | 消化轮消费 1 条 | 发射 ≥1（起跑窗 done ×1 + reclaim 兜底——双发面）；归档恰一次（幂等住归档层） |
| T-A3 | 归还 | 边界 | 消化轮吸收中途 `AbortError`（非会话中止——Abort-continue） | reclaim 仍达（**修复前零调用——先红**）；循环重入 |
| T-A4 | 归还 | 错误 | 用户轮 runTurn 抛非 abort 错 | reclaim 已发（finally 序——**修复前零调用——先红**）；异常续抛 |
| T-A5 | 归还 | 错误 | timer 轮 runTurn 抛错 | 同 T-A4（**修复前零调用——先红**） |
| T-A6 | 归还 | 边界 | 自然退出残差 1 条 | `injectResidual` 调用 + `reclaim(离容集)` 恰 1（注入成功同集；**修复前零发射——先红**）；freezeAll 不重发 |
| T-A7 | 归还 | 边界 | 会话中止清空 2 条 | freezeAll 用中止前快照（含 2 条）；快照外零重发 |
| T-A8 | 归还 | 正常 | 桌面宿主桩（`reemitDone` 计数面） | done 帧 ≥1（发射面）；归档/`record` 恰一次（幂等住归档/记录层）；重复补发不增档 |
| T-A9 | 归还 | 边界 | timer 轮吸收中途 `AbortError`（非会话中止——timer 支 Abort-continue） | reclaim 仍达（**修复前零调用——先红**）；循环重入（timer 轮不发 digest 边界——现序保持） |
| T-A10 | 归还 | 错误 | 消化轮 runTurn 抛非 abort 错（消化支异常窗） | reclaim 已发（恒达窗——**修复前零调用——先红**）；异常续抛 |
| T-A11 | 归还 | 错误 | 自然退出残差 2 条，第 2 条注入抛错 | 前缀 1 条已注入；`reclaim(离容全量 2 条)` 恰一（不缩水）；首错重抛（fail-loud）；**修复前：零 reclaim ∥ 零补发（先红）** |
| T-B1 | 回读 | 正常 | 假 store（running ∥ awaitingDigest ∥ flow 三块）+ 假 DOM 面 | 快照判别六键逐块正确（+ `role`/`id` 随行）；region ∥ dom 判别正确 |
| T-B2 | 回读 | 边界 | 同签名二次 settle ∥ status 翻转移位 | 前者零二次上报；后者一报（去重语义） |
| T-B3 | 回读 | 正常 | `report` 后 `get` ∥ 后报覆前报 ∥ 缺键 | 缓存三语义逐条 |
| T-B4 | 回读 | 正常 | `ctx.readout` 有值（view） | `source:"renderer"` + digested 交叉逐条；CLI 面（readout 无 ∧ state 有）行为逐字不变 |
| T-B5 | 回读 | 错误 | readout 返 `null` | 降级链回落（state → 池视图）+ 注在——零崩 |
| T-C1 | 回收阀 | 正常 | awaitingDigest 块（池/pending 空）+ freeze `sub:advisor#27` | 门控过；onToken 恰字面 `advisor#27/⟦ev⟧done\x1e0\x1e0\x1edone\x1e` |
| T-C2 | 回收阀 | 错误 | running 块 ∥ pending 命中 ∥ 未知键 ∥ `region:"flow"` 块——四拒 | 四拒因逐条（文案在、含 live 列表） |
| T-C3 | 回收阀 | 正常 | 桥 `onToken(字面)` | `ev:subagent {status:"done"}` 出站（relay 表命中） |
| T-C4 | 回收阀 | 正常 | 渲染 reduce：awaitingDigest 块收 done | archive 效果 + 流内块 + `record:append`（meta.status = done） |
| T-C5 | 回收阀 | 边界 | CLI 径 freeze（`ctx.state`） | 逐字原行为（既有字面 ∥ 既有拒因——回归锚；唯一有意差 = 键两写法接受——§2.3） |

## 7. 验收标准（指向回批档 §2 ∥ 台账 #891 ∥ #892）

- **AC-1（㈠ 实况回读）**：桌面会话 `panel view` 返回 `source:"renderer"`，块集/态与渲染面 store 同源（T-B1..B5）；**核净 UI 挂可判（trio 形）** = awaitingDigest ∧ `digested:true` 块可被逐一指认（键 ∥ 态 ∥ 入流位 ∥ DOM 在场四判据齐）。
- **AC-2（归还补口）**：C1–C4 逐路径用例（T-A1..A11）——每条消费条目 **≥1 done 发射（恒达不变量——发射层不去重、两发面互不吞并）** ＋ **归档/记录恰一次（幂等住归档层）**；Abort-continue ∥ 异常 ∥ 残差三窗（各支逐条）**先红后绿**。
- **AC-3（回收阀）**：T-C1..C5——门控通过 ⇒ 发射字面到达 ⇒ 渲染面归档 + record 落档；四类拒因逐条。
- **AC-4（兼容）**：CLI 面 view ∥ freeze 零回归（T-B4 ∥ T-C5）——freeze 唯一有意放宽 = 键两写法接受（两端同宽——§2.3）；两降级链保留（无回读源 ∥ 无 state）。
- **AC-5（文档）**：仓根 `node scripts/doc-check.mjs` exit 0（设计轮复跑）。
- **AC-6（边界）**：④ 已落（§2.4——2026-10-06 宿主自愈扫）；#51 ∥ #50 写域零触（交付读数面）。

## 8. 边界（不做什么）

- 不做像素级截图面（状态级 = 本批射程；截图面另层可裁）。
- 不引入按需回读（B 案）∥ 不做主侧事件镜（C 案）。
- 不改渲染面归档机本体（判据 ∥ 位置零动——本批只保证其**输入完备**）。
- 对账自愈 v1 = 挂既有 beat 扫拍（零独立对账循环 ∥ 零新增拍频）；扫拍依赖渲染面上报快照——不新增拉取面（§2.4）。
- 不动 CLI/VSC 端档（`thincoder-cli/src/**` 禁域零触；VSC 受益于核收口但零触——受益面注明）。
- 零新增运行时依赖；上报帧不含 `rows`（内容面零上行——带宽纪律）。

## 9. 变更记录

- 2026-10-04：建档（本批设计轮——㈠ ∥ 归还补口 ∥ 回收阀三面落设计 + ④ 裁定不做；受影响文件表 + 用例清单 + 验收对照）。
- 2026-10-04：修复轮（设计评审 #54 轮次 1 · 七条全采纳）——AC-2 ∥ 用例口径收正（≥1 发射 + 归档恰一次；补 T-A9..A11）∥ 行数闸四档超线登记（行数口径按内容行数核正）∥ 残差注入 try/catch 收口（§2.2 ②）∥ 字段标签统一「判别六键 + role/id 随行」∥ 键规范化两端同宽明书 ∥ IPC.md 计数收正随拍。
- 2026-10-06：**④ 对账自愈收口（已落）**——#76 digested-stuck 事故 ⇒ 宿主侧自愈扫（三拍）+ done 帧双痕（批 `docs/batches/2026-10-06-digested-stuck-fix.md` · 台账 #978；原「本批不做」判随事故重估——形态 = beat 级现算，零新增循环）；§2.4 重写、档头枚举 ∥ §5 ∥ §7 AC-6 ∥ §8 涉句同拍。**设计形式化轮——产品码零触**。
