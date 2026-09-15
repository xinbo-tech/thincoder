# 子代理面板覆盖面残环（⏹ 释放 · 归属标签）· 批次记录（2026-09-16）

> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务（eng-designer）· §3 设计评审（评审子代理）·
> §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-16 · 来源 = 用户「这两个问题也都修了吧」（03:14——承 AUTOAPPROVE 批 §6.4 呈请项 1）。
> 六段骨架头常驻（各段 append 的锚点；段内无内容 = 该段尚未发生——不另加「待写」式占位文本）。
> **状态：设计轮待发 · 执行宿主 = CLI**（2026-09-16——VSC 面板内 spawn 已通，但本批涉核权限闭包，统一 CLI 侧推进）。
>
> **条目指针（三方一致）**：本批 = 台账 `docs/TODO.md` 需求池「子代理面板覆盖面两残环」条——§2 条目 ↔ 设计档验收回指 ↔ 需求档条目须逐条对齐。
> **同链前序**：第 5/6 处 = `docs/batches/2026-09-16-vsc-autoapprove-misalign.md`（A′ + F1 + F2，已收口）——本批 = 该批 §2.16 覆盖面 10 环表的**残环 9 / 10** + 该批代码评审 **B5**。
> 上游：台账 `docs/TODO.md` · 批次档模板与段作者表 = `docs/core/design/BATCH-RECORD.md`（D2——本档不重述）。

---

## §1 讨论（主 agent 记）

### 状态

**设计轮待发 · 执行宿主 = CLI（2026-09-16）**——用户 03:14 裁定「这两个问题也都修了吧」（承 AUTOAPPROVE 批 §6.4 呈请项 1）。
本批为同链**收尾批**：前批覆盖面 10 环表已闭 8 环，本批收残环 9 / 10 + 评审 B5。

### 条目（本批 = 台账需求池一条；原文与证据以台账为准）

| # | 台账条目 | 症状 | 消解路径（台账所载） |
|---|---|---|---|
| 1 | `docs/TODO.md` 需求池「子代理面板覆盖面两残环（⏹ 释放 / escalate·continue 归属标签）」 | 见下三症状 | 设计轮裁决（核侧或端侧、缝约内）——单笔落地 + 机判断言 |

### 症状（三处 · 同属前批覆盖面表残环）

| # | 症状 | 证据 / 说明（前批 §2.16 环 9/10 + 评审 B5） |
|---|---|---|
| ① | **子代理定向取消（⏹）不释放已开权限卡** | 核闭包不携条目 signal（`opts.signal` 无来源——核零改面）；已开卡靠 Stop / 用户应答释放；`stopped` 检查只挡新 ask（`thincoder-core/agent-tools/subagent-spawn.mjs:316-318`）⇒ 用户在面板点 ⏹ 停某子代理后，该子代理先前弹出的权限卡仍挂着 |
| ② | **escalate / continue 询问卡归属标签不闭** | 卡可达（供给回退分支——原样名 `escalate/<tool>` / `continue`）；名不携 id/model ⇒ 卡面归属标签缺语义（**父侧勘正 2026-09-16**：原注「核零改面」按前批口径写；§2 面二 A 已裁为**核侧名形态改**〔`escalate#<id>/<tool>`〕——闭合含核侧改动，以 §2 为准） |
| ③ | **子代卡归属缺 model 分支（B5 疑点）** | 端侧供给构造未传 `model` ⇒ `childOwnerLabel` 的 `<model>` 分支不可达（卡归属恒 `<role>#<id>`）；与活动块标签一致性未核（KD-8）——证据（实施笔 §5 读数）`thincoder-vscode/src/extension/panel-callbacks.mjs:346-353` |

### 根因（前批实核——designer 不必重探）

- ① = **核闭包无 signal 来源**：卡释放三路（child abort / Stop / approve-all）不含「条目定向取消」路；⏹ 取消面（核 `cancelAsyncSubagent`）与卡释放闭包（`child-permission`）之间缺一条链。
- ② = 回退分支**只透原样名**（无 owner 语义解析）。
- ③ = 供给侧**未传 `model`**（构造参数缺口）——② ③ 同族（归属标签语义面）。

### 设计输入与已知事实（父侧已核——designer 不必重探）

1. **缝约**（承全链）：壳→核可 · 核→壳禁 · 零 `if (vsc)` 入核；端差走缝层 + 端装饰。
2. **前批既有面参照**：卡投递 `permission-gate.mjs:59` · 释放 `:63-73` · 批准回传 `panel-messages.mjs:344-360` · 逐字拒绝 `agent/dispatch.mjs:331-332` · ⏸ 态 `panel-callbacks.mjs:251`（供给/透传 = `panel-callbacks.mjs:333-359` / `execute-tools.mjs:217`——前批已落）。
3. **机判面**：前批两新档（`thincoder-vscode/test/vsc-autoapprove-field.test.mjs` · `test/integration/vsc-spawn-ctx-permission.test.mjs`）为可比先例；断言直接打在门判据/供给面行为（mock provider 不覆盖权限面）。
4. **结构纪律**：R24a 行数增量与超线判断；档 ≤300 行软线 / ≤500 硬限。
5. **执行宿主 = CLI**（设计轮与实施轮的 spawn 均在 CLI）。
6. 迁移期档性：权威层 = `docs/core/**` · `docs/cli/**` · `docs/vsc/**`；产品树 `docs/**` = 迁移期参照历史（保留 ≠ 维护，`docs/README.md:4`）⇒ 坐标按现状实核重锚。

### 批次边界（明确不做）

1. 不重开同链前序五批（`2026-09-15-vsc-agent-tools-spawn-fix` / `2026-09-15-vsc-tool-table-dup` / `2026-09-16-vsc-subagent-panel-channel` / `2026-09-16-subagent-reasoning-echo` / `2026-09-16-vsc-autoapprove-misalign`）——均已收口。
2. 不改 `§17 D-S6` 规则本身；不动台账 / 本档 §1。
3. 覆盖面表其余 8 环已闭——不重做；不动 AUTO 直通面（A′ 已收口）。

---

## §2 批次任务（eng-designer）

**状态：设计就绪待评审**——交付 = 本任务书 + 涉模块权威档收正（已落，见 2.11；实施笔 §5 零重复触碰）。发起评审 = 用户 / 主 agent（本子代理不发起）。

**依据** = 本档 §1（主 agent 实核）。**本席复核** = 直读取证（零 explore 委派——勘察预算 0/6 未用）+ 迁移前引擎备份实证（工作区根 `_merge-backup/_dryrun/cli/thincoder-vscode/src/agent-tools/*`——「丢链」结论的直接证据源）。**任务映射** = 必核三件 → 2.1（①②③）；机判面 → 2.6 + 2.7。

**三方条目一致**：台账需求池条（`docs/TODO.md:12`「子代理面板覆盖面两残环」）↔ 本段验收条目（2.6）↔ 需求档（本批**零改**——缺陷批：需求语义不变，缺口在实现面；前批 §2.11/2.18 同口径）。旁证条目 = 技术待办 `docs/TODO.md:60`（B5 疑点——本批闭；请父侧随收口核销/归档）。

### 2.1 问题陈述与三必核结论

**问题陈述**：前批覆盖面 10 环表残环 9 / 10——① 子代理定向取消（⏹）不释放已开权限卡；② escalate / continue 询问卡归属标签不闭；③（B5）端侧供给未传 `model` ⇒ `childOwnerLabel` 的 `<model>` 分支不可达。本批 = 同链收尾批（§1）：**按原设计机制接回两段丢链** + 机判断言。关键新事实 = **迁移丢链**（见 ①）——修复方向 = 接回原机制，非新造机制。

**① ⏹ 释放链现状（必核一）**——四问逐答：

| 问 | 结论（实证坐标） |
|---|---|
| 缺哪条链 | 池条目 `controller.signal` → ask 的 `opts.signal` 一段。卡释放三路中路径①（child abort——`permission-gate.mjs:70-74`：signal abort ⇒ deny 释放 + `permissionWithdrawn`）设计在位、**从未接源**（F1 供给构造 `signal: null`——`panel-callbacks.mjs:350-351`）；⏹ 面（`cancelSubagent` → 核 `executeCancelAction` → `cancelAsyncSubagent` → `entry.controller?.abort?.()`——`subagent-async.mjs:173-207`）与卡释放闭包之间无桥 |
| 应有来源 | **条目级 controller**（原 VSC 引擎设计 C-2/C-9 逐字如此——备份 `subagent-run.mjs:89,95`：`childSig = entry.controller?.signal ?? childSignal` → `makeChildPermission({… signal: childSig })`；`subagent-escalate-async.mjs:81` · `subagent-escalate.mjs:145` 同款）——W12/W13 迁核退役 + F1 重建供给时**丢链** ⇒ 本批 = 按原设计接回 |
| 核内部可解否 | 可解析（relay id = 池键）但交付仍需端侧承载（gate 在端）；核侧改 = seam 扩参 + CLI 回归面 + 端核双源分裂 ⇒ **端侧为最简闭合点**（核零改——缝约构造性保证） |
| 端侧 ⏹ 后能否经既有 `releasePermission` 释放 | **能——经既有路径①，非直接调用**：⏹ → `cancelAsyncSubagent` → `entry.controller.abort()` → gate `onAbort → release(false)` → `releasePermission`（`permission-gate.mjs:28-36`）→ webview 按 promptId 移卡（`chat.js:260-266`）。供给接回后 ⏹ / 模型 `action:'cancel'` / 会话链中止（`bindChildController`——`async-settle.mjs:88-98`）**三路同链闭合**；迟弹卡（`enqueueAsk` 窗口）由 gate `sig.aborted` 即释放兜底（`permission-gate.mjs:72`） |

**② 归属标签闭法（必核二）**：

| 面 | 现状 | 闭法（选定） |
|---|---|---|
| `childOwnerLabel` 三形态（`child-permission.mjs:22-25`） | role ∈ {escalate, consult} 且有 model ⇒ `<role> <model> #<id>`；否则 `<role>#<id>` | 语义不动（核零改）——**供给实参**补齐（model 由池条目取） |
| escalate（async `escalate-async.mjs:229` · sync `subagent-actions.mjs:437` 裸 handler） | 名不携 id ⇒ 端侧不可判（并行飞刀条目歧义） | **核侧名形态改** = `escalate#<id>/<tool>`（async）+ sync 同构包装（`escId`——`:398` 既有）⇒ 端侧既有解析分支命中 + 池条目 model ⇒ 卡 `escalate <model> #<id>` |
| continue（名锁死——`key-modes.mjs:43` `name === "continue"` + `denyModalForOwner` `args.agent === key`） | 三生产者：sync spawn `key` ✓（`subagent.mjs:293`）；sync escalate `tag` ✗（`:442`）；consult `label` ✗（`consult.mjs:318`） | **args.agent 键形归一**（核两处）+ 端侧**「键形才归属」解析**（文法单源 `parseRelayPath`——零自造正则） |
| KD-8 同源核对（卡 vs 活动块） | family 逐字同源 ✓；escalate 卡 `escalate <model> #<id>` vs 块 `escalate#<id>` + model 段（CLI `render-segments.mjs:86,91` · VSC `activity-view.js:56`） | **三值（role/id/model）同源同值、呈现形不同**——结论登记（不修） |

**③ 机判面（必核三）**：断言打业务可观察（卡开 / 关状态 · 卡面归属文案 · 释放时机）；先例 = 前批两新档 fixture 形态（stubPanel + `buildPanelCallbacks` + driveCards；mock-llm + hydrateRun）；用例表与 RED/GREEN 协议见 2.7。

### 2.2 方案选型对比

**面一：⏹ 释放（核闭包 signal 来源 vs 端侧释放）**

| # | 候选 | 判据逐项评估 | 取舍 | 结论 |
|---|---|---|---|---|
| A | **端侧供给接回条目级 signal**（供给按归属键读池条目 → `signal: entry.controller.signal`） | 一机制覆盖全取消路（⏹ / cancel / 会话链）✓；迟弹卡兜底 ✓；核零改（CLI 零回归构造性）✓；= 原设计 Q3/C-2/C-9 机制复活（原生先例）✓；改动一处（供给 ~10 行）✓ | 无 | **选定** |
| B | 核闭包自带 signal + seam 扩参（`ctx.onPermissionRequest(name, args, {signal})`） | 核内可解析但交付仍需端侧消费；核改 + seam 新参数 + CLI 回归面 + 端核双源 = 新分裂源 | 面大 + 无增量收益 | 否决 |
| C | 面板队列反查释放（取消时扫 owner 匹配队列） | 仅覆盖 ⏹ 一路（模型 cancel 直连核、不经面板路由）✗；迟弹窗无卡可扫 ✗；**原批 Q3 已明确否决**（「面板队列反查（只覆盖 UI ⏹ 一路）」） | 覆盖不全 | 否决 |

**面二：escalate 归属（端侧单边 vs 核侧名形态改）**

| # | 候选 | 判据逐项评估 | 取舍 | 结论 |
|---|---|---|---|---|
| A | **核侧名形态改**（`escalate#<id>/<tool>`——async + sync 同批） | 端侧不可判 ⇒ 唯一可行 ✓；与 spawn 路径同构（端解析单分支）✓；CLI 影响 = 预览按 `/` 末段解析不变（`interaction.mjs:16-18`）· 模态状态行显示键形（可读性↑）✓ | 核侧两处单行 | **选定** |
| B | 端侧单边（仅补 model + 键解析） | 名不携 id ⇒ escalate 卡不可归属（并行条目歧义）✗ | 不闭环 | 否决 |
| C | 询问 args 携 owner（加隐形字段） | 工具 args = 参数面（diff/preview 消费）✗ 污染 + seam 隐形契约 | 面污染 | 否决 |

**面三：continue 归属 + B5 model**

| # | 候选 | 判据逐项评估 | 取舍 | 结论 |
|---|---|---|---|---|
| A | **核两生产者键形归一 + 端侧键形解析 + model 池条目供给** | 三生产者同规 ✓；escalate / consult 续跑卡得归属 ✓；B5 闭（`<model>` 分支对 escalate 实态可达）✓；CLI 显示变化 = modal 状态行（键形替 tag/label——语义面微变，登记） | — | **选定** |
| B | 端侧只解键形（不动生产者） | sync escalate / consult 续跑卡仍无归属（半闭）✗ | 半闭 | 否决 |
| C | continue 改名（`continue#<key>`） | CLI TUI 锁名（模态判 + y/n 键集 + `denyModalForOwner`）✗ 回归 | CLI 回归 | 否决 |

B5 单列并入面三 A 行：`model: entry?.model ?? null` 无条件供给——coder 等族角色 label 构造性不受 model 影响（零外观变化）；sync 飞刀无池条目 ⇒ 族形 `escalate#<id>`（登记）。

### 2.3 接口契约（实现锚）

| 项 | 契约 |
|---|---|
| 供给改点 | `thincoder-vscode/src/extension/panel-callbacks.mjs` `buildPanelCallbacks` 供给函数（现 `:341-358`） |
| ① 池条目解析 | 归属键分支内：`const lines = panel._liveLines ?? panel._susp?.lines`；`const entry = lines?.history?._asyncSubagents?.get(String(id))`（与 ⏹ 路由同源同式——`panel-messages.mjs:254,259`） |
| ② signal / model 供给 | `makeChildPermission({ ctx: { callbacks: cbs }, id, role, model: entry?.model ?? null, signal: entry?.controller?.signal ?? null })`——非池子代（sync / 嵌套回退）entry 缺失 ⇒ 双 null（现状语义零改） |
| ③ 飞刀名（核） | async：`escalate-async.mjs:229` `escalate/${name}` → `${entry.relayPrefix.slice(0, -1)}/${name}`；sync：`subagent-actions.mjs:437` 裸 handler → `(n, a) => ctx.onPermissionRequest(\`${escId}/${n}\`, a)` |
| ④ continue 名解析（端） | `String(name) === "continue"` 且 `parseRelayPath(String(args?.agent ?? "") + "/")` 全消耗（`p && p.inner.length === 0 && p.rest === ""`）⇒ `makeChildPermission({ id, role })`（id/role 自 `p.head` 拆）→ `perm("continue", args, null)`（announce → ask → 清态随行——块头 `⏸` 对位） |
| ⑤ continue args（核） | `subagent.mjs:293` `agent: key` **不动**；`subagent-actions.mjs:442` `agent: tag` → `agent: escId`；`consult.mjs:318` `agent: label` → `agent: relayPrefix ? relayPrefix.slice(0, -1) : label`（防御回落） |
| 数据流 | webview ⏹ → `cancelSubagent` → `executeCancelAction` / `cancelAsyncSubagent` → `entry.controller.abort()` →（供给已挂 signal）gate 路径① → `permissionWithdrawn{promptId}` → webview 移卡 |
| 不动面 | `permission-gate.mjs`（107）· `panel-messages.mjs`（530）· `webview/**` · `child-permission.mjs`（44）· 核 spawn / dispatch 树——全零改 |

### 2.4 关键决策记录

| # | 决策 | 依据 / 否决备选 |
|---|---|---|
| D1 | signal 来源 = 池条目 controller（端侧解析） | 原设计 C-2/C-9 + Q3；核零改；⏹ 路由同源读取先例（2.2 面一） |
| D2 | 「键形才归属」单规则（escalate 名 + continue args 统一） | 文法单源 `parseRelayPath` / `RELAY_PREFIX_RE`（`relay-prefix.mjs`）；否决特例分支 |
| D3 | escalate 名 = `<role>#<id>/<tool>`（与 spawn 同构） | relay 文法 `[\w-]+#\d+/` 不容空格（`RELAY_PREFIX_RE`）⇒ 否决 `escalate <model> #<id>/…` 形态 |
| D4 | sync 飞刀询问同批装箱 | 同族缺陷（裸名更劣——连 `escalate/` 前缀都无）；CLI 预览零变（末段解析） |
| D5 | continue 生产者两处键形归一 | `args.agent` 语义归位（CLI `denyModalForOwner` 本就按键匹配）；显示面变化登记 |
| D6 | model 无条件供给（`entry?.model`） | `childOwnerLabel` 仅 escalate / consult 消费（构造性零外观影响）；B5 闭 |
| D7 | 新测试 = 核新档 + VSC 集成新档；T6 反证腿收正 | 前批 D4 先例（单点单档）；T6 所钉语义随本批直接变更（2.13 #4 披露） |

### 2.5 受影响文件表（R24a——现值 split 口径 · 拆行前实测）

| # | 文件（cwd = 仓根） | 现值 | 预计增量 | 动作 |
|---|---|---|---|---|
| 1 | `thincoder-vscode/src/extension/panel-callbacks.mjs` | 362 | +14（±4）→ ~372–380 | 供给三补（signal / model / continue）——**唯一端侧生产改动**；>300 软线（基线即超——前批 5.9 #5 在案）；≤500 硬限内 |
| 2 | `thincoder-core/agent-tools/escalate-async.mjs` | 294 | +0–1 | 询问名携键（单行内替换） |
| 3 | `thincoder-core/agent-tools/subagent-actions.mjs` | 484 | +1–3 → ~485–487 | sync 飞刀名包装 + continue agent 键形；≤500 硬限内（余量 ~13——超即红） |
| 4 | `thincoder-core/agent-tools/consult.mjs` | 470 | +0–1 | continue agent 键形 |
| 5 | `thincoder-core/test/child-ask-attribution.test.mjs` | 新 | ~+150–190 | 核侧 T-A1–A4n（fixture = 注入 `ctx.runAgent` 假 runner——不触网） |
| 6 | `thincoder-vscode/test/integration/vsc-panel-rings.test.mjs` | 新 | ~+190–240 | 端侧 T-R1–R5n |
| 7 | `thincoder-vscode/test/integration/vsc-spawn-ctx-permission.test.mjs` | 266 | +8（±6）→ ~274 | T6 收正（① 腿两态 / ② 腿换嵌套形态） |
| 8 | `thincoder-vscode/test/integration/files.mjs` | 21（10 条） | +1（11 条） | 新档登记（漏登记 = 启动自检 fail——`run-integration.mjs:45-47`） |
| 9 | `docs/core/design/AGENT-LOOP.md` | **已落 517**（514 → +3） | 0（实施笔零触碰） | §6.18 行 + §9 + 变更记录——本席（2.11） |
| 10 | `docs/core/design/CORE-UNIFICATION.md` | **已落 1952**（1949 → +3） | 0 | §2.13.3 行 + 变更记录——本席（2.11） |
| 11 | `docs/vsc/design/WEBVIEW-PROTOCOL.md` | **已落 273**（272 → +1） | 0 | §3 两行 + §10 + 变更记录——本席（2.11） |
| — | `thincoder-vscode/src/extension/permission-gate.mjs` | 107 | 0 | **不触**（路径① 既有） |
| — | `thincoder-vscode/src/extension/panel-messages.mjs` | 530 | 0 | **不触** |
| — | `thincoder-vscode/webview/**` · `thincoder-core/agent-tools/child-permission.mjs`（44） | — | 0 | **不触** |

行数口径注：split（`\n` 分片）口径——与 T-CP18 结构判据同款；末行口径 = −1。

### 2.6 验收标准（逐条可机判——回指台账条目）

| # | 判据（机判） | 执行面 | 回指 |
|---|---|---|---|
| AC1 | 供给 signal 接回：stub 池条目（controller）→ ask `coder#7/write` 出卡 → `ctrl.abort()` ⇒ resolve(false) + 队列空 + `permissionWithdrawn` 恰一（T-R1；修复前必红） | `npm run test:integration` 新档 | 台账 `docs/TODO.md:12` ①（前批 §2.16 环 9） |
| AC2 | 全链 ⏹：真 async spawn → 子写卡（owner `coder#N`）→ `cancelSubagent` 消息 ⇒ 卡移除（promptId 命中）+ 队列清空（T-R4；修复前必红） | 同上 | 同上 |
| AC3 | escalate 卡归属：池条目在 ⇒ `escalate#3/read` → owner `escalate <glm-5.3> #3` + announce id=3；无条目 ⇒ `escalate#3` 族形（T-R2） | 同上 | `docs/TODO.md:12` ② + `:60`（B5） |
| AC4 | continue 卡归属：`("continue", {agent:"coder#7"})` ⇒ owner `coder#7` + announce tool=continue；非键 agent ⇒ 回退 owner null 零 announce（T-R3） | 同上 | `docs/TODO.md:12` ② |
| AC5 | 核（async 飞刀名）：假 runner 触 ask ⇒ 捕获逐字 `escalate#<id>/write`（T-A1；修复前 `escalate/write`） | 核 `node --test` 新档 | `docs/TODO.md:12` ② |
| AC6 | 核（sync 飞刀名 + continue）：捕获 `escalate#<N>/write` 与 `("continue", {agent:"escalate#N"})`（T-A2；修复前裸名 / `tag`） | 同上 | 同上 |
| AC7 | 核（consult continue）：捕获 `("continue", {agent:"consult#<relayN>"})`（T-A3；修复前 `label`） | 同上 | 同上 |
| AC8 | 反证面：修复前新例必红 / 修复后必绿——§5 原样存证（逐字 + 日志落盘） | §5 | 机判面纪律（§1 第 3 条） |
| AC9 | 零回归：VSC `npm run lint` + `test:full` + `test:integration` 全绿；核 `node --test` 全绿；登记面启动自检过 | §5 读数 | §1 边界 |
| AC10 | 文档收正已落且回读核对（2.11）；仓根三闸全绿（宽度 / 台账 / 锚 `--domain .`） | 回读 + 三闸 | §1 第 6 条（三层分工） |

### 2.7 用例表与反证面（RED/GREEN 协议）

端侧档（`vsc-panel-rings.test.mjs`；fixture = `stubPanel` + `buildPanelCallbacks`（前批 T5 形态）+ 池假体 + `run.history._asyncSubagents` 绑定 + mock-llm）：

| 例 | 类 | 输入 | 期望输出（断言） |
|---|---|---|---|
| T-R1 | 正常（释放 · 单元） | 池条目 `{controller, role:"coder"}`；ask `coder#7/write` ⇒ 卡出 ⇒ `controller.abort()` | resolve(false)（sleep-轮询断言——防超时假红）；队列空；`permissionWithdrawn` 恰一（promptId 命中） |
| T-R2 | 正常（归属 · 飞刀+model） | 池条目 `{role:"escalate", model:"glm-5.3"}`；ask `escalate#3/read` | owner 逐字 `escalate <glm-5.3> #3`；announce `{id:3, role:"escalate"}`；边界：无池条目 ⇒ owner `escalate#3` |
| T-R3 | 正常+边界（归属 · continue） | ① `("continue", {turns:3, agent:"coder#7"})`；② `("continue", {agent:"zhipu:glm-5.2"})` | ① owner `coder#7` + announce `{tool:"continue", id:7}`；② 回退：owner null、零 announce（卡可达） |
| T-R4 | 正常（释放 · 全链） | 真 async spawn（mock provider）→ 子写卡 → `handlePanelMessage({type:"cancelSubagent", id, role:"coder"})` | 卡移除（until `permissionWithdrawn` 命中）；队列空（修复前必红） |
| T-R5n | 反证（不误释放） | T-R1 同构但**不 abort** → 用户应答 | 卡保持（零误释放）；应答后正常出队（零回归锚） |

核侧档（`child-ask-attribution.test.mjs`；fixture = 最小 parent + `ctx.runAgent` 假 runner——零网络）：

| 例 | 类 | 输入 | 期望输出（断言） |
|---|---|---|---|
| T-A1 | 正常（async 飞刀名） | `launchEscalateAsync(parent, ctx, {…})`；假 runner 内 `cbs.onPermissionRequest("write", {})` | 捕获名逐字 `escalate#<id>/write`（修复前 `escalate/write`） |
| T-A2 | 正常（sync 飞刀名 + continue） | `executeEscalateAction({task}, ctx)`；假 runner 同调 + 抛 `ContinueError` | 捕获 `escalate#<N>/write`；continue `{turns, agent:"escalate#N"}`（修复前裸名 / `tag`） |
| T-A3 | 正常（consult continue） | `consultStartTool.execute({problem}, ctx)`；假 runner 抛 `ContinueError` | 捕获 `("continue", {turns, agent:"consult#<relayN>"})`（修复前 `label`） |
| T-A4n | 反证（边界） | 无 `ctx.onPermissionRequest` | 不崩——退化返回（拒绝路径零回归） |

**RED/GREEN 协议**：① 先落两新档 + `files.mjs` 登记 + T6 收正 ⇒ 两树判面跑 ⇒ 新例**必红**（逐字记录）；② 落核侧四处改动（见 2.3 ③⑤）⇒ 核档转绿；③ 落端侧供给 ⇒ VSC 档转绿；④ 全链复跑（§5 三段存证 + 门禁链）。

### 2.8 同族读点核对

| 面 | 核对结论 |
|---|---|
| 端双读点 | ⏹ 路由（`panel-messages.mjs:254,259`）与供给读取面同源同式（`panel._liveLines ?? panel._susp?.lines` → `history._asyncSubagents`）——**双读点单载体**（无第二载体面） |
| 核 controller abort 全路 | `cancelAsyncSubagent`（定向）+ `bindChildController` 链（会话 / 回合级）——供给后全覆盖；`_syncChildAborts` 面**不接**（VSC 无 sync ⏹ 路——登记为非缺失） |
| escalate 双生产者 | async / sync 同批覆盖（2.3 ③） |
| continue 三生产者 | sync spawn 已键形（不动）；sync escalate / consult 归一两处（2.3 ⑤） |
| 不涉面 | `_asyncAdvisors`（评审只读零 ask）· nested（inner>0 回退——登记）· depth-0 直问（owner null 现状零改） |

### 2.9 边界

1. 不重开同链前序五批；不改 §17 D-S6 规则；台账 / 本档 §1 零触碰（承 §1）。
2. 覆盖面表其余 8 环不重做；AUTO 直通面（A′）零触碰（供给首行 AUTO 短路构造性不变）。
3. 核侧改动限 2.3 ③⑤ 所列（名形态 / args 值）——其余核树零触碰；CLI 消费面零改（预览末段解析 / 模态判据构造性不动）。
4. 不新增 UI 控件（escalate 块不加 ⏹——本批只闭「归属 / 释放」登记面）；不改 continue 名；不触 `permission-gate.mjs` / `panel-messages.mjs` / webview/**。
5. 报告项（2.13）不动手——含 ESCALATE.md 迁移期漂移 / CLI async 模态同族缺口 / webview parseChannel 遗留。

### 2.10 执行宿主与交付面

- **执行宿主 = CLI**（承 §1）；实施 = eng-coder（任务书 = 本段）；真机复测 = §6 父侧 / 用户面（VSC 面板：⏹ 已开卡实测 + 飞刀卡归属目视）。
- 定向跑法：`cd thincoder-core && node --test test/child-ask-attribution.test.mjs`；`cd thincoder-vscode && node --test test/integration/vsc-panel-rings.test.mjs`。
- 门禁 = VSC `npm run lint` → `npm run test:full` → `npm run test:integration`；核 `node --test`；仓根三闸。

### 2.11 文档收正（已落——本席；实施笔零重复触碰）

| # | 文件 | 落点 | 内容 |
|---|---|---|---|
| 1 | `docs/core/design/AGENT-LOOP.md`（514 → **517**） | §6.18 child permission gate 行（`:394`）· §9 · 变更记录 | 卡释放三路注 + **残环批收正**块（signal 接回 / 名携键 / model 供给）· 体量读数随收 |
| 2 | `docs/core/design/CORE-UNIFICATION.md`（1949 → **1952**） | §2.13.3 `ctx.onPermissionRequest` 行（`:1324`）· 变更记录 | VSC 列补供给两补 + 询问名形态（残环批）；核内坐标复核不变 |
| 3 | `docs/vsc/design/WEBVIEW-PROTOCOL.md`（272 → **273**） | §3 `permissionRequest`（`:54`）/ `permissionWithdrawn`（`:56`）行 · §10 · 变更记录 | owner 形态收正（`<model>` 替 `<tag>` + continue 键形）· 释放来源补条目取消 |

需求档（requirements）本批零改——缺陷批：需求语义不变，缺口在实现面（前批 §2.11/2.18 同口径）。

### 2.12 自检（评审前预检对照）与读数

①需求可设计 ✓（判据全机判）· ②受影响文件 + 行数（R24a）✓ 2.5 · ③AC 逐条回指 ✓ 2.6 · ④UI/交互决策落档 ✓（owner 文案形态定死；open 项 = 零；KD-8 差异已登记结论）· ⑤方案对比已做 ✓ 2.2。

**三闸读数（本席实跑 · cwd = 仓根 · 收正后）**：① `check-doc-width` = OK（417 文件零超 300 字符）· ② `check-ledger` = 0 违规（基线 0）· ③ `doc-anchors --domain .` = OK(V5) 0 条悬空锚（8511 候选 · 豁免 912）。

**复跑观察（附注——他批在途）**：末次三闸复跑时宽度闸现 1 行超宽——`docs/batches/2026-09-16-tui-history-trim.md:203`（353 字符；本目录另有活跃实例在写该批——非本批写域，本席零触碰）；本批四文件（本档 + 三权威档）复跑零超宽 · 零悬空 · 台账零违规；一致性 V1/V2/V3 新增 0。

**STOP「设计就绪待评审」**——发起权在用户 / 主 agent。

### 2.13 报告项（发现即报告——不修 / 待父侧裁量）

| # | 项 | 证据 | 建议 |
|---|---|---|---|
| 1 | CLI async ⏹ 模态释放同族缺口 | `thincoder-cli/src/tui/mouse.mjs:224-228` 注释自述（「async 成功取消不 deny 模态——v2 deny 机制后续可复用到 async」） | 本批端侧 signal 机制可平移（TUI 对 modal 挂条目 controller signal）——另案或台账 |
| 2 | ESCALATE.md 迁移期漂移 | `docs/core/design/ESCALATE.md` §4 / §6「VSC = `sub:escalate <label> #N`」（引已退役 `subagent-escalate.mjs:142`）——现状 = 核 relay 分流 `sub:escalate#<id>`（`relaySubagentContentChunk`） | 另案收正（含「双端异形」句复核） |
| 3 | VSC 飞刀块 parseChannel 遗留 | `webview/activity.js:44-48` 的 `<role> <label> #<id>` 解析分支（上游已不产）对现形 `sub:escalate#<id>` 判 role null | webview 收正另案；本批只登记 KD-8 结论（2.1 ②） |
| 4 | T6 收正披露 | 前批 T6 ① 腿（键形 continue → owner null）与本批语义直接冲突 | 收正 = 「键形 ⇒ 归属」+「非键 ⇒ 回退」两态；② 腿输入换嵌套形态（现行仍可达回退面）——已列入 2.5 #7 |
| 5 | B5 台账双条目 | `docs/TODO.md:60` 与 `:12` ③ 同指 | 本批闭后请父侧随收口（核销 / 归档） |
| 6 | 派单坐标注（非矛盾——锚点收窄） | 派单所引「`subagent-async.mjs:258-272` 区」= `executeCancelAction` 调用区（实体定义 = `:173-207`）；「`panel-messages.mjs:344-360` 区」= `permissionResponse` 同族区（⏹ 路由实体 = `:253-300`） | 本段已按实核坐标书写（2.1 / 2.3） |
| 7 | 他批在途文件超宽（观察） | `docs/batches/2026-09-16-tui-history-trim.md:203`（353 字符——末次复跑时出现，他批活跃实例在写） | 本批零触碰；源批自查折行（父侧转达） |

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审依据**：四项在册文档（本档 + AGENT-LOOP / CORE-UNIFICATION / WEBVIEW-PROTOCOL）全文通读；受影响文件表逐行 spot-check（代码只读、非改动面）。无项目标准档、无文档地图 ⇒ 方法学按 Project Guide 与评审判据读。台账条 `docs/TODO.md:12` 作交叉证据读取（评审对象外）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership | 🟡 | §1 症状② 标「（核零改面）」（本档 :33），而 §2 选定面二 A = **核侧名形态改**（:105 · 2.3③ :126 · 边界 3 :217 自许核侧改动）；台账同条明许「核侧或端侧」（`docs/TODO.md:12`）⇒ 需求面无碍，滞后的是 §1 旁注 | 父侧收正 §1 该旁注（或加一行勘正：② 的闭合含核侧名形态改——§2 已载） |
| 2 | Affected-file size annotations | 🟡 | 2.5 #3/#4 两核档越 300 软线（`subagent-actions.mjs` 484→~487 · `consult.mjs` 470→~471）**无拆分计划行**；项目自身登记面 `CORE-UNIFICATION.md:1115`（该档计划，消解条件＝「该档下次实质改动时」）与 `:1121-1123`（consult 列次优先，补登时点＝下次实质改动）正指向本批 | 2.5 两行补拆分计划（或引 §2.8.1 既有计划 + 延续/延后理由）；`panel-callbacks.mjs` 行已引「前批 5.9 #5 在案」——同法 |
| 3 | Acceptance criteria | 🟡 | 门禁（:225）与 AC9（:177）= VSC 三命令 + 核 `node --test` + 三闸，**缺 CLI 全链**——本批改 3 个核档（CLI 亦消费）且 `key-modes.mjs:25` 归属判定读 `p.name.startsWith(key+"/")` / `p.args?.agent === key` ⇒ 核改名后 async 飞刀卡/continue 的 wait 串与预览 JSON 改变；边界 3（:217）「CLI 消费面零改（…模态判据构造性不动）」表述不准（判据不动、判据输入变） | AC9 / 2.10 加 CLI 全链（或至少 `test:full` + `test:integration`）；边界 3 收正为「消费逻辑零改 · 显示面微变已登记（2.2 面二 A）」 |
| 4 | Clarity | 🔵 | 2.3③（:126）sync 包装写成 `(n, a) => ctx.onPermissionRequest(...)`——无 null 守卫，与现形（`subagent-actions.mjs:437` `ctx.onPermissionRequest ?? null`）及自家 T-A4n（:199「无 ctx.onPermissionRequest ⇒ 不崩」）相抵 | 补守卫形（`ctx.onPermissionRequest ? … : Promise.resolve(false)`），与 ⑤（:128）防御回落同形 |
| 5 | Clarity | 🔵 | `<model>` 记法双关：2.1②（:84）「`escalate <model> #<id>`」与 `WEBVIEW-PROTOCOL.md:53` 同形，代码实产**字面尖括号**（`child-permission.mjs:23` `${role} <${model}> #${id}`） | 档内点明尖括号为字面（AC3 :171 / T-R2 :187 逐字值已正确——补一句即可） |
| 6 | Clarity | 🔵 | 行数口径注（:163）引「T-CP18 结构判据」——该用例已段删（`child-permission.test.mjs:12-13`）；现口径锚 = `core-hygiene.test.mjs:98`（`wc -l` · `CORE-UNIFICATION.md:1083-1085`）；且 484 / 470 较 §2.8.1 读数（483 / 469）各 +1 | 口径锚改指现权威 + 两数注 as-of（或按 §2.8.1 口径重测） |
| 7 | Clarity | 🔵 | `run-integration.mjs:45-47`（:155）为裸档名——仓内同名两处（`thincoder-cli/test/run-integration.mjs` · `thincoder-vscode/test/run-integration.mjs`）；项目纪律「同名≠同物必带路径前缀」 | 写全路径 |
| 8 | Clarity | 🔵 | 迟弹卡兜底（2.1① :78）只覆盖「条目在池、signal 已 abort」；2.3②（:125）entry 缺失 ⇒ 双 null ⇒ 该路无释放桥（池条目移除后的迟 ask 无兜底）——设计未述所依赖的池留存不变式 | 一行点明依赖面（或登记 tombstone 兜底为后置项） |
| 9 | Clarity | 🔵 | KD-8 登记（:87）称块「+ model 段」：实为 `webview/activity.js:44-48` parseChannel 把现形 `sub:escalate#<id>` 判 role null ⇒ 才未触发 `webview/activity-view.js:56` 的 escalate/consult 排除（model 段才可见）；报告项 3 收正后该段消失 | KD-8 行 / 报告项 3 加一句耦合注 |
| 10 | Requirements | 🔵 | 三方一致段（:65）只点台账；台账同条另引需求锚 `docs/core/requirements/AGENT-LOOP.md` §4.4（需求档在册范围外——其是否覆盖环①未核） | 回指列 / 2.11 补需求锚，或明写「§4.4 不覆盖环① ⇒ 缺陷批口径」（现有「需求档零改」句已具框架） |

**计数**：🔴 0 · 🟡 3 · 🔵 7
**VERDICT: pass**

（本节写入成功——批次档 §3 已落。）

## §4 用户批准（主 agent）

## §5 实施记录（eng-coder）

### ⓪ 基线（开工实测——2026-09-16 03:40–03:47）

| 面 | 命令（cwd） | 读数（日志 = `.thincoder/tmp/`） |
|---|---|---|
| 核 | `node --test`（thincoder-core） | **195/195/0**（`core-baseline.log`） |
| VSC | `npm run lint` / `npm test` / `npm run test:full` / `npm run test:integration` / `npm run doc:check` | 197 JS OK · fast **560/525/0/35** · full **560/560/0** · integration **48/48/0** · doc:check 0（`b-vsc-*.log`） |
| CLI | `npm run lint` / `npm test` / `npm run test:full` / `npm run test:integration` | 181 JS OK · fast 612/**552/1** · full 612/**610/2** · integration 25/25/0（`b-cli-*.log`） |
| 三闸 | `check-doc-width` · `check-ledger` · `doc-anchors --domain .` | width **FAIL 1**（`docs/batches/2026-09-16-tui-history-trim.md:203` 353 字符——他批在途，§2.12 报告项 7 同源）· ledger **0 违规** · anchors `.` **OK(V5) 0 悬空**（8511 候选 · 912 豁免）（`b-gate-*.log`） |
| 全域锚 | `doc-anchors --domain thincoder-cli` | **37 悬空 = 存量基线**（`b-anchors-cli.log`） |

**基线噪声注（如实）**：CLI 两失败非本笔来源——fast 1 = `U1–U5 + U10 保底…`（`test/tui-memory-budget.test.mjs`，旁批 TUI 批工作区在途档）· full 2 = 同 + `T-V5-15②`（真实域复跑报 **37** = 上表存量基线）。VSC/核/三闸基线全绿面如上。

### ① 落点（file:line——实施后实测）

| # | 文件 | 落点 | 变更 |
|---|---|---|---|
| 1 | `thincoder-vscode/src/extension/panel-callbacks.mjs` | `:341-373`（供给） | 键形解析单点（relay 名 + continue `args.agent` 全消耗判）→ 池条目两读（`signal` / `model`）→ `makeChildPermission({id, role, model, signal})`；回退分支零改 |
| 2 | `thincoder-core/agent-tools/escalate-async.mjs` | `:231` | ask 名 `escalate/${name}` → `${entry.relayPrefix.slice(0, -1)}/${name}`（= `escalate#<id>/<tool>`） |
| 3 | `thincoder-core/agent-tools/subagent-actions.mjs` | `:429` / `:441` / `:446` | 新 `askPermission`（null 守卫 ⇒ `Promise.resolve(false)`）→ 透传（替 `?? null`）；continue `agent: tag` → `agent: escId` |
| 4 | `thincoder-core/agent-tools/consult.mjs` | `:320` | continue `agent: label` → `agent: relayPrefix ? relayPrefix.slice(0, -1) : label`（防御回落） |
| 5 | `thincoder-core/test/child-ask-attribution.test.mjs`（新） | 145 行 | T-A1–T-A4n（假 runner 夹具——零网络） |
| 6 | `thincoder-vscode/test/integration/vsc-panel-rings.test.mjs`（新） | 251 行 | T-R1–T-R5n（stubPanel + 真 `buildPanelCallbacks` + 生产形宿主 + mock-llm 全链） |
| 7 | `thincoder-vscode/test/integration/vsc-spawn-ctx-permission.test.mjs` | 266 → 278 | T6 收正（① 两态 / ② 嵌套形态） |
| 8 | `thincoder-vscode/test/integration/files.mjs` | 21 → 22（10 → 11 条） | 新档登记（漏登记 = 启动自检 fail） |

行数（`wc -l` 口径——口径锚见 ⑤🔵#6，as-of 2026-09-16）：`escalate-async` 294→**295** · `subagent-actions` 484→**487** · `consult` 470→**471** · `panel-callbacks` 362→**380**——四档皆在 §2.5 预算内（+0–1 / +1–3 / +0–1 / +14±4）且 ≤500 硬限内。

### ② 反证原样（RED——修复前必红；命令 + 失败断言逐字 + 日志落盘）

**核**（`cd thincoder-core && node --test test/child-ask-attribution.test.mjs` → `red-core-attribution.log`）：tests 4 · pass 0 · fail 4——
- T-A1：`actual: [ 'escalate/write', { path: 'x' } ]` / `expected: [ 'escalate#1/write', { path: 'x' } ]`
- T-A2：`actual: [ 'write', { path: 'x' } ]` / `expected: [ 'escalate#1/write', { path: 'x' } ]`
- T-A3：`actual: [ 'continue', { turns: 3, agent: 'mockprov:mock-model' } ]` / `expected: [ 'continue', { turns: 3, agent: 'consult#1' } ]`
- T-A4n：`actual: [ null ]` / `expected: [ false ]`

**VSC**（`cd thincoder-vscode && node --test test/integration/vsc-panel-rings.test.mjs` → `red-vsc-rings.log`）：tests 5 · pass 1 · fail 4——
- T-R1：`Error: until: timeout`（卡悬挂——signal 未接源，队列不释放）
- T-R2：`actual: 'escalate#3'` / `expected: 'escalate <glm-5.3> #3'`（model 未供给）
- T-R3：`actual: null` / `expected: 'coder#7'`（continue 键形未解析）
- T-R4：`Error: until: timeout`（真 async spawn 全链——`permissionWithdrawn` 未达）
- T-R5n = 反证锚**两态绿**（不误释放——设计成，非修复判别例）

**GREEN 三段**：② 核侧改动落地 ⇒ `green-core-attribution.log` **4/4**；③ 端侧供给落地 ⇒ `green-vsc-rings.log` **5/5** · `green-vsc-ctx.log` **6/6**（含收正后 T6）。

### ③ 复跑链（全绿读数——实施后；日志 `.thincoder/tmp/rr-*.log`）

| 面 | 命令 | 读数 |
|---|---|---|
| 核 | `node --test` | **199/199/0**（195 + 4 新） |
| VSC | lint / fast / full / integration / doc:check | 198 JS OK · **560/525/0/35** · **560/560/0** · **53/53/0**（48 + 5 新）· doc:check 0 |
| CLI | lint / fast / full / integration | 181 JS OK · **612/553/0**（串行复跑）· 612/611/**1**（`T-V5-15②` 报 **37** = 存量基线零新增）· **25/25/0** |
| 三闸 | width / ledger / anchors `.` / anchors CLI 域 | 同基线（width 1 = 他批在途 · ledger 0 · anchors `.` 0 悬空 · CLI 域 37 = 零新增） |

**复跑噪声（如实记录）**：① 首跑 VSC fast 现 3 例 slow 门拦截（`edit-tool-improvement.test.mjs` 890–1318ms）——并发跑 full+integration 的机器负载所致；
**隔离复跑（`npm test` 单独）零拦截**（560/525/0/35）；单档复跑（`node --test test/edit-tool-improvement.test.mjs`）三例 88–186ms。
② 首跑 CLI fast 现 `T-CL1` 瞬时红（他实例写提示词档窗口内的读窗交错）；单档复跑 **4/4 绿**。两例皆环境噪声、非本笔差异（对照见 ⓪ 基线）。

### ④ 决策透明表（实施轮）

| # | 决策 | 依据 / 说明 |
|---|---|---|
| 1 | 端侧供给键形**预解析单点**（`ownerKey`/`tool` 两变量 + 单一 `makeChildPermission` 构造点）——relay 与 continue 两形态共用 | 两分支语义同构（键 → id/role → 构造）；消除两处构造重复；行为与 §2.3 ④ 逐字等价 |
| 2 | async 飞刀名用 `entry.relayPrefix.slice(0, -1)`（局部 `relayPrefix` 同值可用——取 `entry` 形态） | §2.3 ③ 逐字；入口字段 = 单源 |
| 3 | sync 侧抽具名 `askPermission`（替内联三元） | 🔵#4 守卫形要求 + 可读性；行数 +3（设计预算 +1–3 内） |
| 4 | **设计档坐标刷新**（`AGENT-LOOP.md:394` 一处 + `CORE-UNIFICATION.md:1324` 三处数字）——本笔实现位移致设计档坐标漂移（审计 🟢#2 实证）；仅数字重锚，机制条文零改 | doc-code 一致纪律；§2.11「实施笔零触碰」= 不重复设计师收正面——本刷新为其**新后果**的坐标重锚，如实登记（差异显式） |
| 5 | T6 ① 腿断言次序：announce 先断言 `["continue"]`、清态在应答后断言 `["continue", null]` | `makeChildPermission` 顺序 = announce → ask →（应答后）清态——应答前清态未发生（首版断言次序错已修） |
| 6 | 新增测试档行数守 ≤300（核 hygiene 对 test/** 同扫）——核档 145 行 · VSC 集成档 251 行 | 未登记超软线 = 红；两档均低于 300 |

### ⑤ 硬项落点（§3 裁决逐条）

- **🟡#2 拆分计划行**（越 300 软线档）：
  - `subagent-actions.mjs` **484 → 487**（>300 软线·核登记在案）：既有计划 = `docs/core/design/CORE-UNIFICATION.md:1115`（§2.8.1 行 #5——抽取查询面 status/observe 外提
    `subagent-actions-query.mjs` 式；**消解条件 = 该档下次实质改动时**）。本批 = **延续登记**——单点包装 + 守卫（+3 行，无新面）；
    拆分 = 新增未声明档 ∉ 本批写域（§2.9.3 核侧改动限 2.3 ③⑤）⇒ 拆分执行时点 = **下一实质改动批**（承既有计划，不新设条件）。
  - `consult.mjs` **470 → 471**（>300 软线·核登记在案）：`CORE-UNIFICATION.md:1121-1123` 次优先列档（补登时点 = 下次实质改动 / S2 接线轮）。本批 = 单行键形替换（+1）⇒ 拆分不随本批（同理由——延后至该档实质改动轮）。
  - `panel-callbacks.mjs` **362 → 380**（>300 软线·VSC 无登记表；前批 5.9 #5 在案 + §2.5 #1 行已注）——设计预算 +14±4 内。
- **🟡#3 门禁补 + 边界 3 措辞收正**：
  - CLI 全链入复跑 = ③ 表（lint / fast / full / integration 四读数已录）。
  - 边界 3 收正（正本）：**「消费逻辑零改 · 显示面微变已登记（2.2 面二 A）」**——`key-modes.mjs:25` 归属判定**输入**变（`p.name.startsWith(key+"/")` / `p.args?.agent === key` 的命中面扩大：async 飞刀卡与 sync/consult continue 现可被 ⏹ deny 模态定向释放）；`interaction.mjs:16-18` 预览末段解析零变（`escalate#3/read` → base `read`）。
  - 实扫 `thincoder-cli/test/**`：**未见钉住旧串**（裸 `escalate/${tool}` / `agent: tag|label`）的用例——最近形态 = `acp-channel.test.mjs:92`（`eng-coder#2/bash` 键形）· `queued-stop.test.mjs:111`（`escalate#4` 块键）——如实记。
- **🔵#5**：`<model>` 尖括号为**字面**（`child-permission.mjs:23` `${role} <${model}> #${id}`）——AC3/T-R2 逐字断言 `escalate <glm-5.3> #3` 即此形态（档内已不再双关）。
- **🔵#6**：口径锚收正——行数口径现权威 = `thincoder-core/test/core-hygiene.test.mjs:98`（`wc -l`）+ `docs/core/design/CORE-UNIFICATION.md:1083-1085`（T-CP18 已段删）；本批读数 as-of = 2026-09-16（split 口径：`split("\n").length - 1`）。
- **🔵#7**：`run-integration.mjs:45-47` 全路径 = **`thincoder-vscode/test/run-integration.mjs:45-47`**（仓内同名两处——另一处 = `thincoder-cli/test/run-integration.mjs`）。
- **🔵#8**：池条目不变式——供给读池条目在 **ask 时刻**成立面 = 条目仍在池（`_asyncSubagents`）；⏹ / cancel 路径中条目**在池**（settle 才出池）⇒ 释放链成立；迟弹卡兜底（`permission-gate.mjs:72` sig 已 abort ⇒ 即释放）**仅**在「条目在池 ∧ signal 已 abort」时成立；**条目已出池后的迟到 ask**（池已清）⇒ entry 缺失 ⇒ 双 null ⇒ 无释放桥（后置面——登记不修）。
- **🔵#9**：KD-8 耦合注——块内 model 段可见性依赖 `webview/activity.js:44-48` parseChannel 对 `sub:escalate#<id>` 判 role null（才未触发 `activity-view.js:56` 的 escalate/consult 排除）；报告项 3 收正后该段消失。**不动 webview**（本批零触碰）。
- **🔵#10**：台账 / 需求锚 = 父侧收口（本笔零触）。

### ⑥ 未落项 / 差异登记

1. 报告项 1（CLI async ⏹ 模态释放）/ 2（ESCALATE.md 迁移期漂移）/ 3（webview parseChannel 遗留）= **不动手**（§2.13 明示，另案）。
2. T6 ② 腿以嵌套形态（`coder#7/explore#1/read`）替裸 `escalate/read`（§2.13 #4 披露）——裸形态修复后核侧不再产（仍回退，非本批断言面）。
3. B5 台账双条（`docs/TODO.md:60` 与 `:12` ③）核销 / 归档 = 父侧（§2.13 #5）。
4. 反证锚 T-R5n / T-A4n 两态绿（不误释放 / 无通道退化）= 设计成——非修复判别例（如上 ②）。
5. 设计档坐标刷新（④#4）属 §2.5 #9/#10 行的「实施笔零触碰」边界外**如实披露**项——仅数字重锚，零机制条文改。

### ⑦ 分歧审计与代码评审（轮次与终态）

**轮次 1 · 分歧审计**（explore 只读——交付 vs 设计对照）：**DEVIATIONS（1 🔴 / 2 🟢）**，逐条处置：

- 🔴#1 §5 实施记录空（RED / 读数 / 硬项登记无落点）——审计时本笔按序尚未写入（先跑测试链、后落 §5）；**Fixed**：本节 ⓪–⑥ 即落点（写入后回读核对）。
- 🟢#2 设计档坐标漂移（`AGENT-LOOP.md:394` / `CORE-UNIFICATION.md:1324` 引核坐标随本批位移失效）——**Fixed**：两档四处数字重锚（④#4；`:1324` 含新守卫句）。
- 🟢#3 §2.5 行数预测 vs 实测 ±1（计数口径差）——**Not an issue**：本笔按 split 口径读数 295 / 487 / 471 / 380，四档皆在 §2.5 预算内（口径锚见 ⑤🔵#6）。

**轮次 1 · 代码评审**（in-child advisor · 同步）：**pass（🔴 0 · 🟡 5 · 🔵 5）**——🟡 五条全部**非 must-fix**；逐条处置：

- 🟡#1/#2/#3（`panel-callbacks` 380 · `subagent-actions` ~487 · `consult` ~471 越 300 软线）= 存量在案（⑤ 拆分计划行）——**无代码动作**；#2/#3 的「本批非实质改动 ⇒ 延后拆分」判定请父侧随收口确认。
- 🟡#4（B5 台账双条核销 / §2.13 报告项 1–3 另案）= 父侧收口项（⑥#1/#3）。
- 🟡#5（§2.5 #9/#10「实施笔零触碰」与 §5 ④#4 坐标重锚披露并存——文档状态滞后）= 父侧文档层注一句收正（§2 非本笔写权——**登记不打回**）。
- 🔵#6（`CORE-UNIFICATION.md:1115` 读数 483 / `:1121` 469 滞后）= **Deferred**——该表为 as-of 快照（头注 `:1084` 带日期）；局部重锚破坏 as-of 一致性 ⇒ 设计侧下轮统扫（登记）。
- 🔵#7（`WEBVIEW-PROTOCOL.md:53` 尖括号双关）= **Fixed**——该行补「尖括号为字面」（281 → 290 字符；行宽闸零新增）。
- 🔵#8（consult 续跑卡 model 分支不可达——consult 会话不入 `_asyncSubagents`）= **Not an issue（实现面）+ 登记**——实现逐字合 §2.3 ②；登记：consult 卡恒族形 `consult#<id>`（无池条目 ⇒ 无 model）——既定形态（escalate 同族差异 §2.2 面三 A 在案）。
- 🔵#9（T-R5n `sleep(30)` 固定观察窗）= **Accepted（保持）**——负向断言（不 abort ⇒ 零释放）慢机下无翻转风险；注释已点明意图。
- 🔵#10（条目 signal 监听器按 ask 累积——`permission-gate.mjs:73` 答复路径不解除）= **Deferred（登记）**——与轮级 `panel._abortController` 既有同形（非本批新造）；`permission-gate.mjs` 属 §2.3「不动面」⇒ 本批零触，留后续卫生项。

**终态 = clean（收敛交付）**：审计 1 轮（🔴 处置毕）· 评审 1 轮（pass——🔵#7 就地修正，余项登记 / 父侧收口）。评审后复跑：VSC 三命令 + 核 + 三闸（行宽闸含 WEBVIEW-PROTOCOL 修正后复跑——零新增）。

## §6 验证与收口（父代理）

### 6.1 实施与验证（父侧实核）

- 实施提交 `752fe592`（11 档 / +476−32）：供给三补（`thincoder-vscode/src/extension/panel-callbacks.mjs:348-377`——键形解析单点 + 池条目两读 `signal`/`model`）· 核侧名形态（`thincoder-core/agent-tools/escalate-async.mjs:231`）· sync 包装 + continue 键形（`thincoder-core/agent-tools/subagent-actions.mjs:429/441/446`）· consult 键形（`consult.mjs:320`）· 新档两（核 145 行 `child-ask-attribution.test.mjs` / 端 251 行 `vsc-panel-rings.test.mjs`）+ `files.mjs` 11 条 · 三权威档坐标重锚（机制条文零改，如实披露）。
- **反证三段（原样在案）**：RED = 核 4 例 fail（T-A1 `'escalate/write'` vs `'escalate#1/write'` · T-A2 `'write'` · T-A3 `agent: 'mockprov:mock-model'` · T-A4n `[null]` vs `[false]`）+ 端 4 例 fail（T-R1/T-R4 `until: timeout`〔卡悬挂〕· T-R2 `'escalate#3'` vs `'escalate <glm-5.3> #3'` · T-R3 `null` vs `'coder#7'`；T-R5n 反证锚两态绿）→ GREEN 全绿。
- 终态链：核 **199/199/0** · VSC lint 198 / fast 560/525/0/35 / full 560/560/0 / integration **53/53/0** / `doc:check` 0 · CLI lint 181 / fast 612/553/0 / full 612/611/1（唯一 fail = `T-V5-15②` 报 37 = **存量基线**、零新增）/ integration 25/25/0 · 三闸：ledger 0 · 锚 `.` 域 0 悬空（CLI 域 37 = 存量基线）· width 仅他批在途 1 行（TUI 批 → 其收口折）。
- 自含交付协议：审计 1 轮（🔴×1 处置 + 设计档坐标漂移 Fixed）+ 代码评审 1 轮 = **pass**（🔴 0 · 🟡 5 非 must-fix · 🔵 5）⇒ 终态 **clean**。

### 6.2 评审发现处置（父侧裁定）

- 🟡#1（§1 旁注「核零改面」与 §2 核侧改动相抵）= **父侧就地勘正**（§1 ② 行加勘正注，以 §2 为准）✓；
- 🟡#2（拆分计划）= §5 ⑤ 已落（引 `docs/core/design/CORE-UNIFICATION.md:1115` / `:1121-1123` + 延后理由）；**父侧确认**：`subagent-actions.mjs` / `consult.mjs`（及 `setup.mjs`）延后拆分维持（既有登记 + 触发 = 下次实质改动）✓；
- 🟡#3（门禁）= **CLI 全链已入复跑**（读数见 6.1）+ 边界 3 措辞收正（消费逻辑零改 · 显示面微变已登记）✓；
- 🔵#4–#9 = 逐条落 §5 ⑤；🔵#10（需求锚）= 父侧收口项（见 6.6）。

### 6.3 测试寿命处置

核 T-A1–A4n + 端 T-R1–R5n = **转 ② 长期资产（常驻）**——三条件全满足（业务可观察 = 卡开/关 · 归属文案 · 释放时机；此前无覆盖面；宿主侧可稳定驱动）；T-R5n 反证锚保留。

### 6.4 呈请项（明示用户）

1. **覆盖面 10 环表全闭（8 + 2）**——本批即收尾；
2. **报告项 1–3**（`mouse.mjs` CLI 异步 ⏹ 释放面缺口等）仍为另案（§2.13 已登记）；
3. **reload 后人工复核**：面板 ⏹ 停子代理 → 其已开权限卡应立即消失；escalate / continue 卡面归属带 id（飞刀含 `<model>`）。

### 6.5 收口行（核销同步清单）

- 台账：需求池「子代理面板覆盖面两残环」→ `docs/TODO-archive.md` §四（已核销）；需求池 25 → 24；**技术待办「子代审批卡归属标签缺 model 分支（B5）」→ 归档（已核销）**；技术待办 11 → 10。
- 提交：实现 = `752fe592`（单笔）；收口 = 本记录 + 台账两档。
- 推送：两远端（gitee / github）；凭证：本批 designId 槽位终消费（链终）。

### 6.6 未落项（携带）

1. §2.13 报告项 1–3（另案 / 父侧裁量）；
2. `CORE-UNIFICATION.md` §2.8.1 读数 483 / 469 为 as-of 快照（设计侧下轮统扫）；
3. 需求锚（`docs/core/requirements/AGENT-LOOP.md` §4.4 是否覆盖环①）——父侧下次触碰该档时核。

### 6.7 结论

批终态 = clean（两残环闭 · 覆盖面 10/10 · 反证闭环齐 · 全链绿〔含补入的 CLI 全链〕）。
