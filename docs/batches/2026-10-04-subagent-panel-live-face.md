# 2026-10-04 · 子代理面板·实况回读与归还补口（panel 桌面面 ∥ 消化归还 done 发射完备）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-04 · 来源 = 用户 2026-10-04 00:12 原话 + 00:15 裁定（㈠ 实况回读 = 明确要求的主交付，不得降级）+ #891 实报（#27/#40 挂留）+ #49 只读诊断（丢帧面收敛）+ 父侧槽文件法证（#27/#36/#40 = 零归档记录 trio）。
> 台账 = #891 ∥ #892（面板面 · 归批）。前情 = 无（独立批——需求源 = 台账 #891 ∥ #892）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**本批性质**：用户两次裁定（00:12 设计批判 + 00:15 优先级修正）驱动的**面板面修复+兑现批**——`subagent panel` 工具须在桌面端兑现其契约（「exactly as the user sees them」），并根治「完成块永不消化」的实报。

**需求（以用户话为准 · 优先级经 00:15 修正）**：
- **㈠ 实况回读 = 主交付（明确要求，不得降级）**：用户原话「你自己看不到界面上显示什么，我跟你说的时候不是鸡同鸭讲？上次就是碰到这个问题才让你加的这个功能」——桌面 `panel view` 必须回读**渲染面实况**（块集/态/入流位），使父侧与用户看到同一份事实。
- **① 归还补口**：#891 实报（#27/#40 挂留不消化）→ 父侧槽文件法证 = **三块零归档记录**（#27 ∥ #36 ∥ #40——报告均已送达模型、核账本干净，但「done」归档信号从未发出）；对照 = 同批投四块（#28/#32/#37/#39）及单投各块（#41/#43/#44/#47 等 15 块）记录齐备。定性 = **核/宿主归还链存在零 done 发射的消费旁径**（诊断锚 = 会话槽法证 + #49 报告）。
- **③ 桌面回收阀 = 配套**（CLI `panel freeze` 的桌面对位——现桌面「panel unavailable … CLI-TUI-only, AC-P4」）。
- **② 对账自愈 = 可选补强**（用户未要求；便宜可并，否则不做）。

**证据链（父侧法证 · 会话槽 `sessions/38478126….json.33` 尾区实扫）**：trio 三键（`sub:advisor#27` ∥ `sub:eng-coder#36` ∥ `sub:eng-designer#40`）**零命中**；对照组记录形逐字 = `{"kind":"subagent","meta":{"key":"sub:advisor#41",…,"status":"done",…,"frozen":true,…,"awaitingDigest":false,…}}`（前置帧 = `{"kind":"digest","status":"start","n":1}`）；尾区 digest `n` 值分布 = `1,1,1,3,1,1,2,4,1,1,1,1,1,1,1` ⇒ **非「只末条」**（同 n=4 轮内 4/5 发出）——是**逐条可漏**。

**诊断要点（#49 只读报告 · 待设计轮复核）**：通道面无丢帧门（`src/main/main.mjs:131-133` 单点直发 ∥ `renderer/events-subscribe.mjs:83-96` 逐事件）；done 发射器全在宿主挂起驱动（`src/main/suspension-drive.mjs:76-86` `reemitDone` 逐条目；三调用点 `:157`/`:229`/`:232-234`）；**主嫌疑 = 无发射器的消费旁径**（核 `thincoder-core/agent/suspension.mjs:129-132` 残差注入·零 done；`:239-244` Abort-continue 跳过 reclaim）；渲染面 2 s 拍只投 running/queued（`agent-bridge.mjs:180-203`）**无「缺席⇒归档」负信号** ⇒ 漏一次即永久（重载 ≠ 自愈——awaiting 块不落记录面）。

**边界**：全链（设计 → 评审 → 实施）；不动已收口批档 ∥ 不触在飞写域（`#51` 只读接口实施 = `thincoder-core/ledger-*.mjs` ∥ `thincoder-cli/src/**` ∥ `docs/cli/design/{CLI-ENTRY,ACP-CLIENT}.md`；`#50` = design-token 系档）。

**用户裁定（2026-10-04 00:21 · 逐字）**：「你走全链修啊！我又没让你走轻通道。」——**本线 = 全链**（设计 → 评审 → 实施 → 收口），**轻通道不适用**；父侧此前分流草案中「缺陷 ⇒ 轻通道修复笔」的候选句**作废**（该句从未落到本线执行面，仅存于 00:0x 父侧回复文本；本档为唯一在案口径）。现行在跑 = 全链第一段（设计轮 #52）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（修复轮（#54 收正 · 七条全采纳）已落 · 2026-10-04）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**§2 内容（2026-10-04 · eng-designer · initial 轮）**

**本批条目（覆盖）**——台账 #891 ∥ #892 归批；用户 00:12 ∥ 00:15 裁定拆四面：
- **㈠ 桌面 `panel view` = 渲染面实况回读**（主交付——用户明确要求，不得降级）；
- **归还补口**（「消费 ⇒ 必发 done」不变量——治 #27/#36/#40 零归档 trio）；
- **③ 桌面回收阀**（CLI `panel freeze` 桌面对位）；
- **④ 对账自愈**（可选补强——**本案裁定：不做，给由**，见设计档 §2.4：非便宜可并——需新增对账循环 + 拍频 + 竞态分析 + 独立用例面；两个真实故障面已被归还补口与回收阀覆盖）。
**明确不在本批**：④ 对账自愈；像素级截图面（另层可裁）；CLI ∥ VSC 端侧改造（#51 禁域 ∥ VSC 零触——VSC 仅作核收口受益面注明）；台账其余项零触。

**设计档落点**：`docs/desktop/design/PANEL-READBACK.md`（新档 · 2026-10-04 建）——本批机制单源（四面全落 + 受影响文件表 + 用例清单 + 验收对照）。
归属理由：主交付㈠与实报缺陷（#891/#892 可见面）皆落桌面端面；核侧件（回收恒达窗 + 回读源注入缝）是为主交付服务的结构性收口。先例 = read-data-interface 批设计档落交付端 `cli/design/`（同一归属原则）。
登记随动（本设计轮已落）：`docs/README.md` §1 部分档行（desktop 设计 **14 ⇒ 15** · 全档总数 **52 ⇒ 53**）+ 变更记录一行；`docs/desktop/design/IPC.md` §2 增 `panel:state` 行 + 白名单面段（47 ⇒ 48——设计目标态，实施批落）+ 变更记录一行。

**机制设计（摘要——全文 = PANEL-READBACK.md）**：
1. **㈠ 实况回读**：渲染面帧出口（`renderer/app.mjs` `applyFrame` 后）按签名去重 ⇒ `invoke("panel:state", { key, blocks })`（六字段 `key/status/frozen/awaitingDigest/region/dom`——trio 判别面）⇒ 主侧读数缓存（新档 `src/main/panel-live.mjs`）⇒ `agent._panelReadout`（`agent-host.mjs` 装配挂）⇒ 核 `panel` 工具 view 读源链（readout 快照 → CLI `ctx.state` → 降级池视图）；awaitingDigest 条目读时交叉核池/pending 标 `digested` ⇒ **核净 UI 挂可判（trio 形）**。
2. **归还补口**（结构性收口——「消费 ⇒ 必发 done」）：核 `agent/suspension.mjs` 三支 runTurn（用户 ∥ 消化 ∥ timer）的 `hooks.reclaim` 移入**恒达窗**（finally 形——Abort-continue ∥ 异常抛两窗同达）+ `finishSuspension` 残差注入返回 `{ injected }` 并补 `reclaim`（C2 零发射口）；中止快照径（C3/C4）保持零改。消费路径普查五条在册（设计档 §1.2）。
3. **③ 回收阀**：freeze 门控数据源扩为回读源链（键规范化 `sub:` 剥除；awaitingDigest 限定 + 池/pending/consult 判据逐字复用）；发射 = 既有 relay 字面 `` `${role}#${id}/⟦ev⟧done\x1e0\x1e0\x1edone\x1e` `` 经桥面（`turn-face.mjs:114` callbacks = `bridge(key)`）⇒ 渲染面归档机（含 `record:append` 落档）——**零新消费者**。
4. **④ 不做**（§2.4 给由）。

**受影响文件表（现行行数 as-of 2026-10-04 实读 + Δ 预算）**：核 `agent/suspension.mjs` 301（+12/−6）· `agent-tools/subagent-panel.mjs` 190（+55/−10）· `agent-tools/subagent.mjs` 400（+2/−1）· 桌面 `src/main/panel-live.mjs` 0 新（~45）· `src/main/ipc.mjs` 284（+14）· `src/main/ipc-registry.mjs` 93（+1）· `src/preload/preload.cjs` 84（+1）· `src/main/agent-host.mjs` 323（+3）· `renderer/panel-readout.mjs` 0 新（~60）· `renderer/app.mjs` 322（+4）· 批内件 `docs/batches/2026-10-04-subagent-panel-live-face.test.mjs` 0 新（~260）· 文档面 `PANEL-READBACK.md` 新 ∥ `IPC.md`（+6/−4）∥ `docs/README.md`（+2/−1）。行数闸：无跨限拆分触发；`subagent.mjs` 超 300 顾问线在册（+1 不触硬限——属它批拆分面，登记）。

**四交付面落点表 + 用例清单**：设计档 §5（落点表：㈠⇒preload/ipc/panel-live/agent-host/app/panel-readout/subagent-panel ∥ 归还⇒suspension.mjs ∥ ③⇒subagent-panel/subagent.mjs ∥ ④⇒无）；§6（用例 18 条：T-A1..A8 归还逐路径 ∥ T-B1..B5 回读 ∥ T-C1..C5 回收阀——normal/boundary/error 逐条 input/expected；三窗先红后绿）。

**验收对照（回指）**：AC-1 实况回读（核净 UI 挂可判·trio 形）∥ AC-2 消费必发 done（逐路径计数）∥ AC-3 卡块可回收 ∥ AC-4 CLI/降级兼容 ∥ AC-5 `node scripts/doc-check.mjs` exit 0 ∥ AC-6 边界（④ 给由 + 禁域零触）。各条机检面 = 批内件（T-号）——设计档 §7。

**关键决策与被否**：KD-1 通道形 = 上报 + 缓存（否：按需回读——增益不成比例；否：主侧事件镜——第二副本=漂移面）· KD-2 回读源注入 = `agent._panelReadout`（否：改 `_tuiState` 语义——CLI 面混淆）· KD-3 发射口 = 恒达窗收口（否：逐处补丁——不收敛）· KD-4 freeze 发射 = 复用 relay 字面 token（否：新 IPC 直发——双路）· KD-5 ④ 不做 · KD-6 文档落点 desktop。

**上抛项**：① ④ 对账自愈不做——若要求并入需追加对账循环设计（§2.4 代价评估在册）；② `subagent.mjs` 400 行超 300 顾问线（本批 +1——拆分属它批面）；③ 工具参数说明改述（`subagent.mjs:135`）若判属提示词面 ⇒ 措辞由主 agent 定稿（语义本档已定）。

**需求五要素核对**：任务书 §1 已含（目标 = 用户原话锚；边界 = §1 行 + 本段「不在本批」；验收 = 父侧法证锚）；设计可写且已写 ⇒ 无缺口上抛。

**§2 修复轮块（2026-10-04 · eng-designer · fix 轮——设计评审 #54 轮次 1 收正，父侧裁定 = 七条全采纳；先读 §3 轮次 1 发现表原文逐字为准）**

逐号处置（号 → 处置 → 落点）：
- **号 1 🟡（AC-2 计数口径）**：AC-2 改述 =「**≥1 发射（恒达不变量——发射层不去重、两发面互不吞并）＋ 归档/记录恰一次（幂等住归档层）**」；T-A2 ∥ T-A8 期望随正（T-A8 计数锚点改指归档/record 层）；落点 = 设计档 §6 ∥ §7（AC-2）。
- **号 2 🟡（超线登记）**：行数闸段补 `suspension.mjs` ∥ `agent-host.mjs` ∥ `app.mjs` 同款超 300 顾问线登记（合 `subagent.mjs` 共四档在册）；同笔核正行数口径 = **内容行数（文末换行不计——项目现行）**（原表 +1 = 分裂行口径；`suspension.mjs` 现处 300 线、本批落点越线）；落点 = 设计档 §4（表 ∥ 行数闸段）。
- **号 3 🔵（不变量例外窗）**：取 **try/catch 收口**（由 = 单函数 + 调用点小面即可落地 · 全窗闭合（零发射口不残留）· fail-loud 保持——优于「收窄口径 + 明注例外」）；`finishSuspension` 返回 `{ injected, left, error }`——**补发面 = 离容全量**（注入失败条不缩水；抛错径同覆），首错重抛；新增红锚 **T-A11**（由裁直接派生——披露）；落点 = 设计档 §2.2 ∥ §6。
- **号 4 🔵（用例补窗）**：补 **T-A9**（timer 支 Abort-continue）∥ **T-A10**（消化支非 abort 异常）——先红后绿锚；用例 18 ⇒ **21** 条（T-A1..A11）；落点 = 设计档 §6 ∥ §7。
- **号 5 🔵（「六字段」三处不一）**：统一 =「**判别六键 + `role`/`id` 随行**」（判别六键 = `key/status/frozen/awaitingDigest/region/dom`）；落点 = 设计档 §2.1（邻位 ∥ §3 图 ∥ 用例位同拍）∥ IPC.md §2 `panel:state` 行 ∥ 本摘要（上列行按此读）。
- **号 6 🔵（键规范化 CLI 面）**：明写 = **有意放宽且两端同宽**（单一比对规则；接受面纯增；除此外 CLI 判据 ∥ 文案零变）；发射主体改述 = 规范化键（sub 块 `role#id` ∥ consult 子块 `consult#N`）；AC-4 ∥ T-C5 同拍；落点 = 设计档 §2.3 ∥ §7。
- **号 7 🔵（IPC.md 计数）**：同笔收正——档头 `ipc.mjs` **276 ⇒ 283**（实读 2026-10-04）；§3.1 两行白名单 **47 ⇒ 48**（设计目标态——同 §2 面；行数 283 ∥ 83 经核现盘一致、不改）+ 变更记录一行；落点 = IPC.md。

零语义外扩（除号 3 形经父侧倾向授权；号 3/4 用例增量 = 同裁直接派生）；#51 ∥ #56 写域零触；AC-5 = 仓根 `node scripts/doc-check.mjs` 复跑 exit 0（读数随交付报告）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**核读结论（四要点 · 先于发现表）**

- ㈠ 真回读：成立——源链 = 渲染面帧出口上报 + 主侧缓存 + 工具同步读（非第二副本；C 案被否、主侧零归约）；陈旧界（asOf/ageMs、不设截断）已成文（PANEL-READBACK.md:65-66）。DOM 盖章单点核实：`block.mjs:30` 唯一写点，活动区（`pool-subagents.mjs:29`）与流内（`chat-subagent.mjs:62`）同经 `renderSubBlock` ⇒ 单查询覆盖两区。
- 归还：普查全集核实——容器离容点实为 4 处（`run-start.mjs:40` ∥ `suspension.mjs:122` ∥ `:131` ∥ `run-stages.mjs:206` ⇒ C1–C4 全落；C5 = 池面收集非容器且桌面临 `suspDriven:true` 不达，`turn-face.mjs:120`）——两修点（三支 finally + C2 补发）覆盖 Abort-continue ∥ 异常 ∥ 残差三窗（边际见发现 3 ∥ 4）。
- 阀门链路：成立——relay 文法 `^([\w-]+)#(\d+)\//`（`relay.mjs:22`）确不吃 `:`（`sub:` 前缀必修）· done 分支 `relay.mjs:135` · 桥分流 `agent-bridge.mjs:153-158` · 归档 + `record:append` `subagent-reduce.mjs:125-138` ∥ `:191` · 幂等 drop-frozen `state.mjs:236-240`——逐点实读命中；发射字面与 CLI 同式（`subagent-panel.mjs:124`）。
- CLI 零回归：门控 ∥ 视图两路回落链同函数同序（未见行为差）；唯键规范化放宽面需注明（发现 6）。
- 未独立复核：AC-5 `node scripts/doc-check.mjs` exit 0（脚本在盘，本轮无 shell 复跑）；台账 #891 ∥ #892 与 trio 槽文件证据（批档 §1 在录口径）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 验收标准 | 🟡 | AC-2 计数断言「每条消费条目恰一 done 发射」（PANEL-READBACK.md:172）与本设计双发射面结构相抵：正常消化径 = 起跑窗主面逐条补发（:30）+ 轮后 `hooks.reclaim` 兜底（:74 ∥ :75）对同一条目各发一次——T-A2 自述即「起跑窗 done ×1 + reclaim」（:151），幂等实住归档/记录层（发射层无去重）；T-A8「done 帧数 = 消费条目数」（:157）同源含混。 | AC-2 改述为「≥1 发射（恒达不变量）＋归档/记录恰一次（幂等）」，或计数按发射面分列（起跑窗 N ∥ reclaim N）；T-A8 计数锚点改指归档/record 层。 |
| 2 | 受影响文件尺寸 | 🟡 | 行数闸段（:135）仅登记 `subagent.mjs` 400 超 300 顾问线，并断言「无跨限拆分触发」；本批改动档中 `suspension.mjs` 301→~307（:120）∥ `agent-host.mjs` 323→326（:127）∥ `app.mjs` 322→326（:129）同处超 300 顾问线，均无超线登记/拆分评述。 | 对三档补同款超线登记（或拆分评述结论），使行数闸盘点与实际一致——口径沿 `subagent.mjs` 已有句式。 |
| 3 | 归还不变量（错误窗） | 🔵 | 不变量「每一条离容（注入消费 ∥ 残差注入 ∥ 丢弃）必达一次 done」（:36）在残差注入器抛错窗不成立：`finishSuspension` 先 `splice(0)` 取走全部（`suspension.mjs:131`），任一 `injectResidual` 抛错 ⇒ 剩余条目既未注入亦无 done，且抛错跳过调用点新 reclaim——「丢弃」窗不在两面覆盖内。 | 或收窄不变量口径（明写「注入器抛错 = 例外，fail-loud」）；或在 `finishSuspension` 内按注入成功前缀累计并补发（try/catch + 返回已注入集）。 |
| 4 | 用例覆盖（归还） | 🔵 | 普查点名「消化轮 Abort-continue」窄窗（:30 引 `suspension.mjs:239-244`），但 timer 支同形 Abort-continue `continue`（`suspension.mjs:268`——跳过 :271 reclaim）亦属同类零发射窗；T-A3（消化 abort）∥ T-A4 ∥ T-A5 未覆盖 timer-Abort-continue 与消化支非 abort 异常两窗（finally 形结构性覆盖，然无先红后绿证据）。 | 补 T-A 两条（timer 支 Abort-continue ∥ 消化支非 abort 异常），或在 AC-2/用例说明明写两窗由 finally 形结构性覆盖、不逐条举证。 |
| 5 | 契约精度 | 🔵 | 「六字段」标签与枚举自相抵：PANEL-READBACK.md:57 ∥ IPC.md:144 均写「六字段」但枚举 8 键 `{ key, role, id, status, frozen, awaitingDigest, region, dom }`；批档 §2 摘要（:43）则列 6 键（无 role/id）——三处字段集/计数不一。 | 统一措辞：标签改「判别六键 + role/id 随行」并同步批档摘要，或删 role/id 使枚举与「六」一致（判别面单源仍 = design §2.1）。 |
| 6 | CLI 零回归口径 | 🔵 | 「键规范化（剥 `sub:` 前缀；接受两写法）」（:83）若落共用 `panelFreezeGate`，CLI 面将同步放宽——现值精确比对拒 `sub:` 前缀键（`subagent-panel.mjs:62`），与「CLI 面判据与文案零变（同一门控函数、同序检查）」（:82）表述有微差。 | 明写该放宽为有意（两端同宽），或把规范化限在回读块源（`sub:` 前缀仅桌面块出现）；AC-4 措辞同步。 |
| 7 | 文档计数（IPC.md） | 🔵 | 本批改 IPC.md，但 Δ 登记（:132——+6/−4 = §2 行 ∥ 白名单面 ∥ 变更记录）未含档头/文件账计数收正：档头 `ipc.mjs` 仍 276（IPC.md:3——as-of 2026-10-02）对本设计表 284（:124）；§3.1 两行（IPC.md:363 ∥ :365）写 283 ∥ 83 与白名单 47——本批落定后白名单面 = 48（IPC.md:153），§3.1 将滞留 47。 | 落笔批在 IPC.md 同笔收正档头/§3.1 行数与白名单 47⇒48；或明注 §3.1 行按 as-of 日期不改（沿既有「计数随现盘收正」先例）。 |

VERDICT: pass

计数：🔴 0 ∥ 🟡 2 ∥ 🔵 5（发现 7 条）

## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
