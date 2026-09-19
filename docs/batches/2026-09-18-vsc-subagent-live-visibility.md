# 批：2026-09-18 · VSC 子代理 live 块可见性（台账 #94）

**状态行**：🔄 进行中（设计轮 · eng-designer）
> 批次边界：交付目标 = 「**子代理块在 live 区可见性**（出生 / 呈现两面）」；条目源 = 专项审计 **id=128**（2026-09-18 23:3x · 只读 · 11 条可疑点）+ 用户 2026-09-18 23:30 症状复述「**经常不显示在 live 区**」。
> 前情 = `docs/batches/2026-09-11-VSC-ASYNC-VISIBILITY.md`（三层脆弱 R-1~R-5）· `docs/batches/2026-09-16-vsc-subagent-panel-channel.md`（迁移期丢面 · 已收口）· **CLI 已实证同型缺陷** = `docs/batches/2026-09-17-subagent-zero-block.md`（其 §「VSC 对位不在本批」= 本批的直接来源）。

## §1 批次任务（父侧）

**状态行**：🔄 进行中（设计轮 · eng-designer）

> 形态说明（父侧自正 · 2026-09-19）：状态行同时置于档头与 §1 段内——门禁按「§1 段内 `**状态行**：` 行」解析，档头单置会被拒（本次 #3 被拒之因）。

### 1.1 目标与理由

用户 2026-09-18 23:30 复述症状「**subagent 经常不显示在 live 区**」；23:32 追问「怎么会按设计意图不修？怎么会有这种设计意图？」。父侧当晚已认定：**把「审计观察到的现状」登记成「勿误修的意图」是错的**——用户报的症状一律先当缺陷查。

专项审计 id=128（只读）结论：**找到 11 条**，其中 **1 条 🔴 + 4 条 🟠 具备用户可见后果**，且**其中一条与 CLI 已实证缺陷（`2026-09-17-subagent-zero-block`）同型，其 VSC 对位当年被明确划在批外、台账亦无条目** ⇒ 本批。

### 1.2 本批覆盖的条目（逐条来自审计 · 各自带坐标）

| # | 级 | 条目 | 坐标 | 用户可见后果 |
|---|---|---|---|---|
| ① | 🔴 | **frozen 键守卫静默吞掉非 `started` 路径的全部后续消息**（与 CLI 同型：`takeoverBlock` 只在 `started && pool && family` 分支调用 ⇒ `subagentChunk`/`queued`/`turn` 无接管） | `webview/activity.js:149` + `:281-290`（takeover 调用点 `:286-289`） | 键已 frozen 时**块永久不出现且无痕** |
| ② | 🟠 | **escalate / consult 的 `started` 不建块**（`FAMILY_ROLES` 六角色门） | `activity.js:284` · `activity-view.js:14` | 这两类子代理**跑着也没有块** |
| ③ | 🟠 | **sync spawn 不建块**（`pool` 门 ⇒ 首 chunk 才出生；首 chunk 又可能被 ① 吞） | `activity.js:284` · 核 `subagent-spawn.mjs:458-459` | 同步子代理**开头一段不可见** |
| ④ | 🟠 | **活动区视口 + pin 失效**：区高 32vh、`pin` 只由 `wheel`/`touchmove` 更新 ⇒ 用户滚过后新块**出生在视口外** | `base.css:102-109` · `ui.js:442-445/466-472` · `activity.js:109` | **块在 DOM 但不在屏上**（最像"经常"的常态成因） |
| ⑤ | 🟠 | **内容面投递无队列、无 `_wvReady` 门**（与事件面 outbox 不对称 ⇒ webview 未就绪时静默丢） | `panel-subagent-relay.mjs:108-110` vs `:142-154` | 早到的子代理内容**永久丢失** |
| ⑥ | 🟡 | view dispose 清空 outbox（暗窗口出生事件永久丢）· 终态补桩限 family role · `makeRelay` 无池兜底 · `onToolResult` 无 relay 分流 | `chat-panel.mjs:126-127` · `activity.js:226-230` · `spawn-child.mjs:77-82` · `panel-callbacks.mjs:163-168` | 窄缝 |
| ⑦ | — | **丢弃无痕**（frozen / tombstone 两条丢弃路径不入 `_subTraceLog`）——CLI 侧对应加固点 = 「禁静默」 | `activity.js:70-74`（只记 takeover / late-terminal-stub / drop-unknown-role） | **用户与我们都无法从痕判定** |

### 1.3 本批不做

- **不改 I-7**（「不做子代理块跨 reload 恢复」= 需求档设计意图）——**但父侧承诺语义边界改造**：登记现状 ≠ 冻结决定（见 §1.6）。
- 不改「非 settled 终态即时归档」（审计判设计意图 · 若用户认「完成的子代理应滞留片刻」⇒ 另裁）。
- 不动 CLI 侧（其同型缺陷已单独收口）。

### 1.4 边界

- 写域（预估 · 设计轮核准）= `thincoder-vscode/webview/activity.js` · `activity-view.js` · `ui.js` · `base.css` · `panel-subagent-relay.mjs` · 相应测试档 · 设计档 `docs/vsc/design/WEBVIEW.md`。
- 需求档 = 父侧笔（本批需新增需求条目 + I-7 语义边界注）。

### 1.5 验收口径

1. **可机判 · 逐条**：① freeze 后新代消息 ⇒ 块**必须出现**（或**必须留痕**——二择一由设计裁并给判据）；② escalate/consult `started` ⇒ 建块；③ sync spawn ⇒ 建块（不等首 chunk）；④ 用户滚动过后新块出生 ⇒ **在视口内或显式提示**；⑤ webview 未就绪时的内容面投递 ⇒ **入队不丢**；⑥⑦ 留痕面补齐（丢弃路径逐条入痕）。
2. **先红**：以上各条在现态**必须先红**（真产者/真分发路径，禁夹具手写）。
3. `thincoder-vscode` `npm test` 全绿 + `lint` OK + `doc-check` 按档归属零新增。

### 1.6 父侧自陈（用户 23:32 追问的答复 · 已入册）

**我把「审计观察到的现状」写成了「设计意图（勿误修）」**，并用它回答用户报的症状——**这是拿自己写的文档挡用户的体验**。规则上讲得通（防误改），但结论是错的。**修正承诺**：① 「设计意图」清单只用于**防止把 A 改坏去修 B**，**绝不用于驳回用户报的症状**；② 用户报的症状一律先当缺陷查；③ 该清单的语义边界（登记现状 ≠ 冻结决定）在本批随需求档收正。

### 1.7 父侧注记（2026-09-18 23:5x · 交叉件：init-block 批已产设计 · 防重复）

同题交叉：同晚 `docs/batches/2026-09-18-init-block.md`（VSC 初始化冻结批）曾按用户 23:33「live 区一起修」将 live 块面并入其条目 ④，并**已产出一份已交付的 ④ 设计件（未经评审）**；经发现本专批后，父侧裁定**归属本批**，该件整体移交为**本批设计轮输入**：

- **已产设计件（可复用 / 可修订 / 可裁并——非终稿）**：`docs/vsc/design/WEBVIEW.md` §5.3（出生自愈心跳 · 投递面全量留痕 · webview 痕迹与上行 · 终态必现 · 清屏可恢复）+ 用例表 T-A1..T-A15 + §6 D-W20–D-W24；`docs/vsc/design/WEBVIEW-PROTOCOL.md` §3.2 行 8（`panelDiag` 诊断上行）+ D-P14；批档 `docs/batches/2026-09-18-init-block.md` §2.8–§2.13（覆盖 / 不含 / 受影响文件 / 验收 / 反例先红 / findings）。
- **需求侧已落（勿重复新增）**：F-A1–F-A5 / NFR-A1–NFR-A3 已自迁移期参照档收敛入 `docs/vsc/requirements/WEBVIEW.md` §2（含复发实据与射程说明）；本批 §1.3 的「I-7 语义边界注」仍待本批收正。
- **覆盖对照（供设计轮用）**：该件覆盖 ≈ 本批审计 ①⑤⑥⑦ 的部分面（frozen 键吞消息的留痕 / 内容面队列 / dispose·outbox / 丢弃无痕）＋出生自愈心跳 / 终态补桩 / 身份接管 / 控制面 / 清屏；**本批审计 ②③④（escalate·consult `started` 不建块 / sync spawn 出生 / 视口 pin）该件未覆盖，须并入设计射程**。
- **并发写提示**：`docs/vsc/design/WEBVIEW.md` / `WEBVIEW-PROTOCOL.md` 尚未提交（工作树最新态含上述改动）；设计轮以最新态为基准，重复设计部分**裁并 / 择优，不许静默覆盖**。
- **归属补记**：init-block 侧已将 ④ 标记「已移交——本批不实施、不评审」。

## §2 批次任务与设计

（按 eng-designer id=129 交付正文**逐字誊录**——其 `batch_segment` 被 §1 状态行形态门禁拒写；父侧已就地收正 §1 形态。）

### 2.0 状态与交付口径（eng-designer · 2026-09-19）
**状态：任务书就绪**（轮次 = initial）。实施者 = eng-coder（设计 token 门——签发在评审 + 用户批准之后，值不落文档）。
本轮零实现面代码：只动设计档 `docs/vsc/design/WEBVIEW.md`（§5.1 / §5.3 / §5.5 / §6 / §8 / §10 / 变更记录）与本档 `WEBVIEW-PROTOCOL.md` §3.2 行 8 收窄 + 变更记录。
设计权威 = 设计档（§5.3 为机制单源）；本段 = 任务书 + 口径锚（D2 不复述长条文）。范围 = 审计七条全入（用户 2026-09-19 00:08「全修」）+ 并入 init-block 移交件的机制面（心跳 / 投递留痕 / 终态必现 / 源新鲜度）。

### 2.1 覆盖条目与不在本批
覆盖 = ① frozen 键静默吞（§5.3 出生面存活闸 + 非出生面禁静默）· ② escalate/consult started 不建块（去家族门）· ③ sync spawn 不建块（去 pool 门）· ④ 视口/pin（§5.5 出生可见性）· ⑤ 内容面无就绪门/无队列（单队列）· ⑥ 窄缝四项 · ⑦ 丢弃无痕（七类痕 + 上行）；移交 A–D（心跳 / 五处置留痕 / 终态必现（射程收正）/ 源新鲜度）。
不在本批：I-7 本体 · 「非 settled 终态即时归档」（设计意图，另裁）· CLI 侧与核侧发射面 · 核 `makeRelay` 池活兜底（上抛）。

### 2.2 设计定案（file:line + 判据）
① `webview/activity.js:144-155` / `:157-171` / `:257-269` / `:281-290`——出生事件命中冻结键 ⇒ 接管；非出生 ⇒ 丢弃 + 痕（判据：新块 frozen===false + takeover 痕 / 零新块 + drop-frozen）。
② ③ 同点去门（`FAMILY_ROLES` / `pool`）——判据：escalate/consult/sync 的 started ⇒ 建块（键 = `sub:<role>#<id>`，与内容面逐字一致）。
④ `webview/ui.js:463-473`（scroll 旗标）+ `webview/activity.js:108-111` + 新档 `webview/activity-new.js`（计数钮）+ `webview/base.css`——判据：未钉底出生 ⇒ 钮 N=1 且 scrollTop 零改；点击 ⇒ 回底 + 钮移除。
⑤ `src/extension/panel-subagent-relay.mjs:109-111` / `:143-155`——内容面同口入队（单队列，上界 200，丢最旧）——判据：入队 + flush 序 started→toolPanel + drop-overflow。
⑥ `chat-panel.mjs:121-133`（discard-dispose）· `activity.js:226-230`+`:365-373`（补桩前置收窄）· 核 `makeRelay` 登记上抛 · `panel-callbacks.mjs:163-168`（第 4 参 `_subagentKey` 消费 ⇒ sync 块终态）。
⑦ 新档 `webview/activity-diag.js`（拟新增）+ `state.js:83-85`/`:122` + `panel-messages.mjs` case `panelDiag`——判据：三丢弃路径各一痕 + 批内合并上行 ⇒ `ev:subtrace`。
关键决策 = 设计档 §6 D-W25–D-W31（含否决备选）；就地收正 = D-W10 / D-W23。

### 2.3 受影响文件表 / 2.4 验收标准 / 2.5 用例表
= 见设计档 §5.3 用例表 T-A16–T-A32（含先红）+ §5.5 判据；受影响文件表与 AC 逐条见本批报告（同源：13 档 + 2 新档，全部 <500 硬限、新档 ≤300）。

### 2.6 eng-coder 任务书（六强制字段）
① 目标：子代理 live 块「出生 / 呈现」全链可见性收口（七条 + 移交件面）。② 轮次：initial。③ 已知事实：报告 ① 表 + 设计档 §5.3/§5.5 坐标（as-of 2026-09-19 实读）。④ 设计要点与禁止范围：逐条照设计档（不得自创）；禁触 = I-7 相关恢复面 · 非 settled 终态即时归档语义 · CLI 侧与核侧发射面 · `activity-view.js` 头词/⏹ 判据 · `_archive/**` · 需求档。⑤ 验收：AC 逐条机判 + `npm test` 全绿 + `lint` OK + `doc-check` 按档归属零新增。⑥ 报告格式：交付表 + 触碰面 file:line + 行数实测改前→改后 + 验证读数原文。

### 2.7 边界与出批登记
不改 I-7 · 不改「非 settled 终态即时归档」· 不动 CLI/核发射面 · 不做跨 reload 恢复。

### 2.9 修正轮（评审 id=130 · 逐号落地 · eng-designer · 2026-09-19）

**口径**：定向修正（点改 + 读回），零新扇面。§2.3 遗留的「受影响文件表见本批报告」由本节**就地兑现**（下表——不再指读域外）；AC 逐条 = 设计档 §5.3 用例表 T-A16–T-A32（含先红）+ §5.5 判据（不复制——D2）。**计数收正**：§2.3 所称「13 档 + 2 新档」= 含零改读依赖的口径；实际触碰面 = 下表 **10 改 + 2 新（拟新增）+ 测试面**（D3：本表为单源）。

#### 2.9.1 受影响文件表（行数 = read 口径 · 2026-09-19 实读）

| # | 文件 | 当前行数 | 预期增量 | 备注 |
|---|---|---|---|---|
| 1 | `thincoder-vscode/webview/activity.js` | 425 | ≤ ±10 | 出生闸去门 / 接管 · 非出生面丢弃痕 · 补桩前置收正 · 计数钮出生判据；痕迹外提（−~8）对冲新增调用点（+~5） |
| 2 | `thincoder-vscode/webview/streaming.js` | 225 | ≤ +5 | `subagentChunk`（`:218` 守卫旁）冻结 / tombstone 丢弃痕 |
| 3 | `thincoder-vscode/webview/state.js` | 124 | ≤ −5 | `_subTraceLog` / `SUB_TRACE_MAX` 退场（`:82-85` · `:121-122`） |
| 4 | `thincoder-vscode/webview/ui.js` | 474 | **零增** | `scroll` 进事件数组循环写法（见 §2.9.2） |
| 5 | `thincoder-vscode/webview/base.css` | 469 | ≤ +10 | `.activity-new-btn`（sticky 区首） |
| 6 | `thincoder-vscode/webview/activity-new.js`（拟新增） | 0 | ≤ 80 | 计数钮载体（建 / 更 / 删 + 点击回底 + `resetActivity` 同清） |
| 7 | `thincoder-vscode/webview/activity-diag.js`（拟新增） | 0 | ≤ 120 | 痕迹族外提（七 kind + 环形）+ `panelDiag` 上行发点 |
| 8 | `thincoder-vscode/src/extension/panel-subagent-relay.mjs` | 181 | ≤ +25 | `emitToolPanel`（`:109-111`）改同口入队 + `ev:subdeliver` 五处置留痕 + `ev:subcontent` 正收据 |
| 9 | `thincoder-vscode/src/extension/panel-callbacks.mjs` | 258 | ≤ +10 | `onToolResult`（`:163-168`）第五路分流 + 第 4 参 `_subagentKey` 消费 |
| 10 | `thincoder-vscode/src/extension/panel-messages.mjs` | 242 | ≤ +12 | `webviewReady` case 起拍（`:229` 后）+ `panelDiag` case |
| 11 | `thincoder-vscode/src/extension/panel-session.mjs` | 263 | ≤ +5 | `loadSession` 入口段清 `panel._liveLines`（`:74` · `:85` 旁——D-W24 落点） |
| 12 | `thincoder-vscode/src/extension/chat-panel.mjs` | 426 | ≤ +5 | dispose 停拍 + 清队留痕（`:126-127` 旁） |
| 13 | 测试 `thincoder-vscode/test/` | 见备注 | 新增档 ≤400 + `files.mjs`（97）+1 行 | T-A16–T-A32 机检驱动；既有档随判据面收正 = `activity-flow`（438）· `activity-closure`（296）· `activity-live-ux`（162）· `async-visibility`（401）· `subagent-content-relay`（145） |

**零改（读依赖——结构不变）**：`webview/activity-view.js`（183——⏹ / 头词不动，F-A4 边界）· `webview/chat.js`（412）· `webview/panels.js`（141）· `src/extension/suspension.mjs`（398——`reassertLiveChildren` 本体 + 返回值复用）· `src/extension/panel-chat.mjs`（249）· `src/extension/panel-messages-session.mjs`（92）· 核侧全树（`thincoder-core/**` 零修——`makeRelay` 池活兜底 = 登记 + 出批上抛）。

#### 2.9.2 ui.js 闭合判据（评审 #3）

- **实读**：`ui.js` = **474** 行（2026-09-19 · read 口径）——设计档 D-W13 原载「492 行」= 陈旧读数，已就地收正为 474（注明实读日）。
- **零增写法**：`initScrollFollow` 的 `watch` 闭包（`ui.js:466-470`）两行 `addEventListener`（`wheel` / `touchmove`）改一行事件数组循环（`["wheel","touchmove","scroll"]`）⇒ 改后仍 **474**（净增 0）。
- **拆分结论（主动评审）**：本批**不拆**——① 改动零增；② 拆滚动族须牵动 `scroll.js` 装配面 + 既有用例，非本批射程。**超 300 建议线登记**：消解路径 = `ui.js` 下次功能触碰时按面拆（滚动族 → `scroll.js` 收口 / DOM 构造族另档）；到期条件 = `ui.js` 下次修改批。

#### 2.9.3 逐号处置（评审 id=130 · 发现 1–12）

| # | 级 | 处置 | 落点 |
|---|---|---|---|
| 1 | 🔴 | §5.1 补桩行 / §5.3 补桩**状态表**（名 + 前置收正）· T-A27 触发面 · `FAMILY_ROLES` 射程点明（`:210` / `:267`） | `docs/vsc/design/WEBVIEW.md` `:155` / `:161` / `:170` / `:210` / `:267` / `:314` |
| 2 | 🔴 | §6.2 模型行按收正口径重写（来源 = 事件载荷；键不含模型段）+ §12 `sub:*` 备注收正 | `docs/vsc/design/WEBVIEW-PROTOCOL.md` `:218` / `:366` |
| 3 | 🔴 | 受影响文件表就地补齐（§2.9.1）+ `ui.js` 零增写法与拆分结论（§2.9.2）+ D-W13 读数收正 | 本档 §2.9 · `WEBVIEW.md:360` |
| 4 | 🟡 | 计数钮落档登记 = 新档 `webview/activity-new.js`（拟新增） | `WEBVIEW.md:339` |
| 5 | 🟡 | 工具结果行 relay 分流两说合一（实核：分流**无**——本批补；第 4 参同点并列） | `WEBVIEW.md:277` |
| 6 | 🟡 | `↓ N 新块` i18n 三面登记（键名 `sub.newBlocks` / zh·en 逐字 / `${n}` 形态） | `WEBVIEW-PROTOCOL.md` §6.3（12 键 → 13 键）+ `WEBVIEW.md:339` 引键 |
| 7 | 🟡 | D-W24 补落点坐标（`panel-session.mjs:74` `loadSession`） | `WEBVIEW.md:241` / `:371` |
| 8 | 🟡 | §10 行 12 悬空指针 → 内嵌建议文本（新增条目号仍待父侧落） | `WEBVIEW.md:452` |
| 9 | 🔵 | T-A12 退场标记化（空壳行填为有义行） | `WEBVIEW.md:299` |
| 10 | 🔵 | `FAMILY_ROLES` 退役射程措辞（`:210` vs `:267`）+ §12 枚举核对 | `WEBVIEW.md` · `WEBVIEW-PROTOCOL.md:366` |
| 11 | 🔵 | `content-first` 落事件名与载荷（`ev:subcontent` / `{ ch, face }`；**不并入** `ev:subdeliver`——五处置计数与 T-A13 判据面零改） | `WEBVIEW.md:249` |
| 12 | 🔵 | 限制声明（无项目标准档 / 文档地图）——**无需动作**（父侧既定） | — |

**上抛 / 待裁**：① 出生可见性需求条目号仍待父侧落（建议文本已内嵌 `WEBVIEW.md:452`）；② `docs/vsc/design/VSC-DEBT.md:69-70` 同留 `FAMILY_ROLES` 归一口径措辞（该档 = 在途拆分批写域 ⇒ 本批只报不动）；③ `WEBVIEW-PROTOCOL.md` §12 `sub:*` 行 ② 列（`panel-callbacks.mjs:122`）随四档拆分批位移（现役 = `panel-subagent-relay.mjs:110` / `:130`；按 D4 as-of 口径留档，本批未重出）。

#### 2.9.4 读回（写后实读 · 终态坐标 · 2026-09-19）

> §2.9.3 所列行号 = 修正落笔时点值；**终态值以本块为准**（D4 as-of 口径）。

- **落点实读（写后）**：`WEBVIEW.md` `:155` / `:161` / `:170`（#1 状态表三处）· `:210` / `:269` / `:361`（`FAMILY_ROLES` 射程三处——#10）· `:241-243`（源新鲜度 / D-W24 正文）· `:251`（`ev:subcontent`——#11）· `:279`（`onToolResult` 两件——#5）· `:301`（T-A12 退场——#9）· `:316`（T-A27 触发面——#10）· `:341-343`（计数钮落档登记 + i18n 引键——#4 / #6）· `:364`（D-W13 读数 474）· `:375`（D-W24 表行——#7）· `:456`（§10 行 12 建议文本——#8）· `:495-498`（变更记录）；**写后 = 499 行**。
- `WEBVIEW-PROTOCOL.md`：`:218`（模型行）· `:227` / `:243` / `:246`（§6.3 13 键）· `:368`（§12 `sub:*` 备注）· `:506-507`（变更记录）；**写后 = 508 行**。
- **doc-check 读数**（`node scripts/doc-check.mjs`，仓根）：写前 = 候选 16316 · 悬空 5 · 拟新增 12 · 迁移期引文 222 · 行宽超限 11（全部在 `docs/core/**`——既有债，非本批）；写后 = 候选 16354 · **悬空 5（同一 5 条既有债，docs/vsc 零）** · **拟新增 14**（+2 = `activity-new.js` 两处，标「（拟新增」⇒ 列报不入闸）· 迁移期引文 222 · **行宽超限 11（docs/vsc 零——本批新增两行超限已自查就改）** ⇒ 按档归属**零新增**。
- 触碰文件（本档外）：`docs/vsc/design/WEBVIEW.md` +8 行（499）· `docs/vsc/design/WEBVIEW-PROTOCOL.md` +4 行（508）。

## §3 设计评审记录

> **父侧誊录**（评审子代理 #130 的 `batch_segment` 被 §1 状态行门禁拒写——已就地收正形态；全文见其交付报告）· 2026-09-19 00:2x。

**评审对象**：`docs/vsc/design/WEBVIEW.md` · `docs/vsc/design/WEBVIEW-PROTOCOL.md` · 本批档。**计数：🔴 3 · 🟡 5 · 🔵 4** · **VERDICT: changes-required**。

| # | Category | Severity | Issue（摘要） |
|---|----------|----------|------------|
| 1 | Document ownership | 🔴 | 同一机制（终态补桩前置判据）在 `WEBVIEW.md` §5.3 内两处互斥：`:161` 括注 / `:170` 表行记「非 family（consult · escalate）⇒ 不补」；`:265-267` 射程收正记「consult / escalate 纳入补桩射程」「`FAMILY_ROLES` 白名单退场」；`:318`（T-A31）· `:357`（D-W10）同此。按未改的成员表实现即与本批判决相反。 |
| 2 | Document ownership | 🔴 | 同一机制（consult / escalate 端侧键形）跨档两说：`WEBVIEW-PROTOCOL.md:218` 称「键内嵌」；`WEBVIEW.md:195-196` 称端侧键 = `sub:consult#4`（**不含模型段**）；`:366` 自身已按 `sub:<role>#<id>` 记 ⇒ 协议档内部亦不自洽。 |
| 3 | Affected-file size annotations | 🔴 | **三档内无受影响文件表**：`:81`（§2.3）把「受影响文件表与 AC 逐条」推给读域外的「本批报告」；`:35`（§1.4）只列 7 项预估。逐档「当前行数 + 预期增量」缺失 ⇒ `ui.js`（`WEBVIEW.md:360` D-W13 自载 **492 行**近 500 硬限）本批要改（`:74`）却无增量注记、无拆分方案；`activity.js`（425）仅 `:302` 断言改后 <500。 |
| 4 | Clarity | 🟡 | 计数钮落档不一：`WEBVIEW.md:337-342`（§5.5）未指落档；`:74` 称「新档 `webview/activity-new.js`」——该档在 `WEBVIEW.md` 全文无登记，而 `:64` 定设计档为权威。 |
| 5 | Clarity | 🟡 | 「工具结果行」relay 分流现状两说：`WEBVIEW.md:232`「（本批补）」vs `:277`「已随五路面补齐」；`:76`（批档 §2.2 ⑥）未列该面。先红基线（`:41`）无从确定。 |
| 6 | Clarity | 🟡 | 新文案 `↓ N 新块`（`WEBVIEW.md:339`）未登记 i18n 键（键名 / zh·en 逐字 / 占位符形态三缺；`${k}` 形态为项目既有事故点，`:244`）。 |
| 7 | Clarity | 🟡 | D-W24「源新鲜度」修法（`WEBVIEW.md:241`）未给落点坐标（本档其余条目多带 file:line）。 |
| 8 | Requirements / 悬空 | 🟡 | `WEBVIEW.md:452`（§10 行 12）「建议文本见批档 §2」——批档 §2（`:62-88`）无该文本 ⇒ 指针悬空。 |
| 9-11 | Doc hygiene / Clarity | 🔵 | T-A12 空壳行（`:299`）· `FAMILY_ROLES` 退役射程措辞（`:210` vs `:267`）· host `content-first` 未给定 `logEvent` 事件名（`:249`）。 |
| 12 | Methodology（限制声明） | 🔵 | 无项目标准档 / 文档地图声明 ⇒ 归属维度降级判定。 |

（逐条全文与建议 = 评审 id=130 交付报告；本档只保真摘要。）

### 轮次 1（评审子代理）

**评审对象**：`docs/vsc/design/WEBVIEW.md` · `docs/vsc/design/WEBVIEW-PROTOCOL.md` · 本批档（`docs/batches/2026-09-18-vsc-subagent-live-visibility.md`）。**轮次 2（修正后复核）**：前轮 12 项逐项以本轮实读原文复核——均闭合；无新 🔴 / 🟡；残留 1 条 🔵。

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | WEBVIEW.md | 🔴 | Fixed | :161「前置 = `id != null` ∧ 角色段合法（`[\w-]+`）∧ 回读解析一致——`FAMILY_ROLES` 前置退场（2026-09-19 收正，射程含 consult / escalate）」· :170「角色段非法（非 `[\w-]+`）/ id 缺失 / 回读解析不一致」· :155 / :269 / :316 同口径（旧 family 门已清） |
| 2 | 2 | WEBVIEW-PROTOCOL.md | 🔴 | Fixed | :218「来源 = 事件载荷字段 `model`；键形 `sub:<role>#<id>` **不含模型段**」· :368「role 段 = **键文法 `[\w-]+`**……`FAMILY_ROLES` 只判 ⏹ 可见性 / sync-async 词，**非**键枚举」 |
| 3 | 3 | 本批档 §2.9.1 | 🔴 | Fixed | :101「痕迹外提（−~8）对冲新增调用点（+~5）」（activity.js 425 / ≤±10）· :104「`scroll` 进事件数组循环写法（见 §2.9.2）」（ui.js 474 / 零增）· :120「⇒ 改后仍 **474**（净增 0）」· D-W13 读数已收正（WEBVIEW.md:364「474 行（2026-09-19 实读）」）· 拆分结论 + 到期条件在册 |
| 4 | 4 | WEBVIEW.md | 🟡 | Fixed | :343「**落档 = 新档 `thincoder-vscode/webview/activity-new.js`（拟新增）**——建 / 更 / 删钮 + 点击回底 + `resetActivity` 同清」 |
| 5 | 5 | WEBVIEW.md | 🟡 | Fixed | :279「① 审计 ⑥「relay 分流缺失」成立——本批补第五路调用面 `toolResult`」——与 :232「（本批补——⑥）」两说合一 |
| 6 | 6 | WEBVIEW-PROTOCOL.md | 🟡 | Fixed | :246「`sub.newBlocks`（2026-09-19 追加……）：键名 / 双语逐字 / 占位符形态（`${n}`）三面以本表为单源」· §6.3 12 键 → 13 键 · WEBVIEW.md:342 引键 |
| 7 | 7 | WEBVIEW.md | 🟡 | Fixed | :242「修法落点 = `thincoder-vscode/src/extension/panel-session.mjs:74` **`loadSession` 入口段**（`:85` `panel._agent = null` 销毁点旁）」· D-W24 表行同（:375） |
| 8 | 8 | WEBVIEW.md | 🟡 | Fixed | :456「出生面 / 视口面新增条目号待父侧落——建议文本：「活动区未钉底时新块出生 ⇒ 区首出现未读计数钮（`↓ ${n} 新块`）且不夺阅读位；点击 ⇒ 回底并清账」」——悬空指针改内嵌 |
| 9 | 9 | WEBVIEW.md | 🔵 | Fixed | :301「覆盖 = **T-A31**（补桩非留痕）；本行只作退场标记」——T-A12 退场标记化 |
| 10 | 10 | WEBVIEW.md · PROTOCOL | 🔵 | Fixed | :210「`FAMILY_ROLES`（`activity-view.js:14`）**在本判据与 sync/async 词面存续**，「白名单退场」只指补桩前置面」· :269 · PROTOCOL:368 枚举核对 |
| 11 | 11 | WEBVIEW.md | 🔵 | Fixed | :251「每频道**首条**记 `logEvent("ev:subcontent", …)`——载荷 `{ ch, face }`」——事件名 + 载荷已定，且明不并入 `ev:subdeliver`（T-A13 五处置零改） |
| 12 | 12 | 本批档 | 🔵 | Closed | :138「限制声明（无项目标准档 / 文档地图）——**无需动作**（父侧既定）」 |
| N1 | （#3 残留） | 本批档:113 | 🔵 | New | 测试面行只列既有五档当前行数——T-A16–T-A32 机检驱动；既有档随判据面收正 = `activity-flow`（438）· `activity-closure`（296）· `activity-live-ux`（162）· `async-visibility`（401）· `subagent-content-relay`（145）——未逐档给预期增量（其余 10 改 + 2 新（≤80 / ≤120）+ `files.mjs` +1 均带增量；五档均 <500 硬限，风险低）——🔵 级注记，不阻塞 |
| N2 | — | 读域外登记 | —（无严重度） | 出批 note | §2.9.4「上抛 / 待裁」三条（需求条目号 · `VSC-DEBT.md:69-70` `FAMILY_ROLES` 措辞 · §12 `sub:*` ② 列位移）已登记，本评审不判 |

**另核**：§2.9.4 读回块的行号/行数声明与实读一致（`WEBVIEW.md` 落点 `:155` / `:161` / `:170` / `:210` / `:241-243` / `:251` / `:279` / `:301` / `:316` / `:341-343` / `:364` / `:375` / `:456` / `:495-498`，写后 499 行；`WEBVIEW-PROTOCOL.md` `:218` / `:227` / `:243` / `:246` / `:368`，写后 508 行——全部命中）。

**计数**：🔴 0 · 🟡 0 · 🔵 1（N1；另 N2 = 读域外登记 note，无严重度）
**VERDICT: pass**

## §4 用户批准

**2026-09-19 00:08 用户直接裁定** —— 逐字「**全修**」（七条全入本批 · 无一豁免）。触发链 = 用户 23:30 症状复述「经常不显示在 live 区」+ 23:32 追问「怎么会按设计意图不修」⇒ 专项审计 id=128（11 条可疑点）⇒ 父侧立批 §1 ⇒ 用户裁定全修。

## §5 实施与修正记录

（eng-coder 写）

### 5.1 交付摘要（eng-coder · 2026-09-19 · 实施轮）

**状态：实现完成 · 自检全绿**——`npm test` = 695/695 绿 · `npm run lint` = 212 档 OK · 协议两机检（§12/§13）绿 · `doc-check` 按档归属零新增（悬空 5 全在 `docs/core/**` 既有债、行宽 11 全在 `docs/core/**`）。
范围 = 审计七条（① frozen 键出生接管 · ②③ 建块去门 · ④ 出生可见性 · ⑤ 内容面同口入队 · ⑥ 窄缝四件 · ⑦ 痕七类与上行）+ 移交件面（心跳 · 五处置留痕 · 终态必现含 tombstone · 源新鲜度），逐条照设计档 §5.3 / §5.5 / §6（D-W25–D-W31）落笔，无自创交互、无静默降级。

**新增 2 档**：`webview/activity-diag.js`（84 行 ≤120——痕七类 + 环载体 `SUB_TRACE_MAX=50` + `panelDiag` 批内合并上行）；`webview/activity-new.js`（71 行 ≤80——未钉底计数钮）。**退场**：`state.js` 的 `_subTraceLog` / `SUB_TRACE_MAX` 载体迁出。

### 5.2 受影响表（行数 = read 口径 · Δ = 本批实测）

| # | 文件 | 设计预期 | Δ 实测 | 改动 |
|---|---|---|---|---|
| 1 | `webview/activity.js` | ≤ ±10 | **+10**（425→435） | 出生闸 `enterBlock`（冻结⇒接管 / live⇒复用 +`reassert-hit` / tombstone⇒丢弃 + 痕）/ 非出生面丢弃痕（chunk·turn·终态）/ 补桩前置收窄（去 `FAMILY_ROLES`）/ 计数钮出生判据 / `parseChannel` 补键文法 general 分支 |
| 2 | `webview/streaming.js` | ≤ +5 | **+6**（225→231） | chunk 丢弃痕（`drop-frozen` / `drop-tombstone`——每频道每生命周期首条） |
| 3 | `webview/state.js` | ≤ −5 | **−5**（124→119） | 痕载体退场（迁 `activity-diag.js`） |
| 4 | `webview/ui.js` | 零增 | **0（474）** | `watch` 闭包两行 `addEventListener` → 一行事件数组循环（`["wheel","touchmove","scroll"]`） |
| 5 | `webview/base.css` | ≤ +10 | **+8**（469→477） | `.activity-new-btn`（区首 sticky） |
| 6 | `webview/activity-new.js`（新） | ≤ 80 | **71** | 计数钮载体（建/更/删 + 点击回底 + 三清账路） |
| 7 | `webview/activity-diag.js`（新） | ≤ 120 | **84** | 痕迹族外提 + `panelDiag` 上行发点 |
| 8 | `src/extension/panel-subagent-relay.mjs` | ≤ +25 | **+33**（181→214） | `emitToolPanel` 同口入队 / 五处置留痕（含批量 `ch` 摘要）/ `ev:subcontent` 正收据 / 第五路 `toolResult` face |
| 9 | `src/extension/panel-callbacks.mjs` | ≤ +10 | **+15**（258→273） | `onToolResult` 第 4 参消费（`settleSyncSubagent`）+ 第五路分流 |
| 10 | `src/extension/panel-messages.mjs` | ≤ +12 | **+49**（242→291） | 心跳（起拍/单拍/停拍 + 两守卫 + 30 拍兜底留痕）+ `panelDiag` case |
| 11 | `src/extension/panel-session.mjs` | ≤ +5 | **+3**（263→266） | `loadSession` 入口置空 `panel._liveLines`（D-W24） |
| 12 | `src/extension/chat-panel.mjs` | ≤ +5 | **+6**（426→432） | dispose：`discard-dispose` 留痕 + 心跳停拍 |
| 13 | 测试面 | 新档 ≤400 + `files.mjs` +1 | **399** + 1 行 | `test/activity-live-visibility.test.mjs`（T-A16–T-A32 + 移交件）；`activity-closure` / `async-visibility` 随判据面收正 |

**Δ 越预期三档（说明 · 非静默）**：① `panel-messages.mjs` +49 —— 设计行只预算「`webviewReady` 起拍 + `panelDiag` case」，而心跳拍体（timer/单拍/两守卫/兜底留痕）须住文件集内（`suspension.mjs` = 设计零改档、`chat-panel` 上限 +5）⇒ 机制体落本档；② `panel-subagent-relay.mjs` +33（五处置批量 `ch` 摘要 + 第五路 face + 同口入队注释面）；③ `panel-callbacks.mjs` +15（`settleSyncSubagent` 键拆解面）。三档均 <500 硬限，机制面逐条落齐。

### 5.3 先红读数（实施前 · 真产者 / 真分发 · 原文）

探针 = 真模块直驱（真 `relaySubagentEventToken` / `relaySubagentContentChunk` 载荷 → 真 `applySubagentStatus` / `streaming.subagentChunk`；临时探针脚本用后即删）：

```
① 冻结键+新代 started → 区活块数 = 0 · map 键指冻结块 = true
② escalate started → sub:escalate#6 在册 = false
③ sync spawn started → sub:coder#2 在册 = false
④ 未钉底出生 → 计数钮 = false · scrollTop = 120
⑤ 未就绪内容 chunk → 队列长 = (无队列——直投丢弃)
⑥ onToolResult 第 4 参在 → subagent 载荷数 = 0
⑦ 冻结键收 chunk → _subTraceLog = []
⑧ consult done 无块 → 补桩 = false · 痕 = [{"kind":"drop-unknown-role","channel":"sub:consult#4",…}]
```

修后同探针（绿）：

```
① 区活块数 = 1 · map 键指冻结块 = false   ② 在册 = true   ③ 在册 = true
④ 计数钮 = true · scrollTop = 120（零改）   ⑤ 队列长 = 1   ⑥ subagent 载荷数 = 1
⑦ 痕尾 = {"kind":"drop-frozen","channel":"sub:explore#5"}
⑧ 补桩 = true · 痕尾 = {"kind":"late-terminal-stub","channel":"sub:consult#4"}
```

### 5.4 用例读数（命令 + 读数）

- 修前：`node --test test/activity-live-visibility.test.mjs` → **tests 19 · pass 1 · fail 18**（唯一绿 = 机检在册；webview 侧 17 例红 = 新档/新 API 未在位 + 行为面红，host 侧 4 例红 = 真断言失败）。
- 修后：同档 → **tests 19 · pass 19 · fail 0**；`npm test`（全量）→ **tests 695 · pass 695 · fail 0**；`npm run lint` → `check-syntax: 212 JS files OK`。
- 协议机检：`node test/protocol-coverage.test.mjs --emit` / `protocol-coverage-reverse.test.mjs --emit` 读数与档面 ②③ 列一致（`panelDiag` = `webview/activity-diag.js:81` ↔ `panel-messages.mjs:270`）。
- `doc-check`（`node scripts/doc-check.mjs --root ..`）：候选 16413 · 悬空 5（全在 `docs/core/**`——既有债，docs/vsc 零） · 拟新增 7（前轮 14——两新档已落地） · 行宽超限 11（全在 `docs/core/**`）。

### 5.5 内部审计 + 代码评审（轮次与终态）

- **内部审计**（explore 只读 · 逐条「设计条款 → 实现落点 → 结论」）：**DEVIATIONS（0 🔴）**——4 条 out-of-list（locales×2 / AGENTS.md / 协议档——已在交付报告逐条披露）· 2 档增量越预期（本节 5.2 已披露）· **1 条 🔵 节律微差已修**（`activity.js` turn 分支 tombstone 丢弃由「每频道去重」改「状态面逐条」，与 §5.3 留痕节律对齐）· 1 条设计档漂移（`WEBVIEW.md:154` §5.1 表「`started` + `pool: true`」与 §5.3 / D-W26「不限 `pool`」互斥——档侧，报父侧处置，实现取 §5.3/D-W26）。
- **代码评审**（advisor · code）：**VERDICT pass**（🔴 0 · 🟡 2 · 🔵 4）。🟡#1（`ev:subdeliver` 批量两处置缺 `ch` 字段 vs §5.3/T-A13 载荷句）**已就地修**（`flush` / `discard-dispose` 补 `ch` 摘要——`subagentChannelSummary`）；🟡#2 = 三档越 300 建议线（activity.js / ui.js / chat-panel.mjs——前两档已有本批拆分裁决与到期条件，按 R3 不重审）登记；🔵 四条登记（计数钮 N 含补桩出生 / T-A28 墙钟等待 / `blockNamesFor` CLI 分支死码面 / `ev:subcontent` 仅覆盖 relay 源）。
- **终态：clean**（审计 1 轮 + 评审 1 轮；fix 轮 = 2 处就地修，见下）。

### 5.6 fix 轮记录（2 处）

1. `activity.js` turn 分支 tombstone 丢弃痕 `traceSubOnce → traceSub`（审计 🔵——留痕节律「状态面逐条」）。
2. `panel-subagent-relay.mjs` / `chat-panel.mjs`：`ev:subdeliver` 的 `flush` 与 `discard-dispose` 两处置补 `ch`（去重频道摘要；评审 🟡#1——对齐 §5.3 载荷句）；`flushSubagentOutbox` 返回值改按 `flushed.length` 计（语义零改）。

### 5.7 越界项（改了但不在 §2.9.1 受影响表内——逐条已报）

1. `locales/zh.json` / `locales/en.json`（各 +1 行）：`sub.newBlocks` 键落地——设计 §5.5 指定文案键、`WEBVIEW-PROTOCOL.md` §6.3 为其单源；不落键则钮显 raw key ⇒ 必改。
2. `thincoder-vscode/AGENTS.md`（+2 行）：webview 模块图登记两新档（设计 §3「模块图登记见 `thincoder-vscode/AGENTS.md`」）。
3. `docs/vsc/design/WEBVIEW-PROTOCOL.md`（+19 行）：§13 `panelDiag` 行落 + §12 四行 ② 列按 `--emit` 重出 + 两表 as-of 注记 + 变更记录（设计 §5.3 授权「§13 机检表行随实现落」）。
4. `test/activity-closure.test.mjs` / `test/async-visibility.test.mjs`：随判据面收正（痕 API 迁出 / D-W24 源 fixture 改 `_susp.lines` / 五处置分列 / 补桩拒绝面重新定点）——§2.9.1 行 13 列举五档，实际只动此两档（余三档零改即绿）。

## §6 验证与收口

**收口（2026-09-19 01:1x · 父侧直接执行）**

- **交付判据**：专项审计 id=128（11 条）→ 立批 §1（用户 00:08「全修」）→ 设计 id=129 → 评审 **changes-required**（id=130 · 🔴3/🟡5/🔵4）→ 修正 id=131（12/12）→ **轮 2 重评 pass**（id=132）→ 实现 id=133（终态 clean）⇒ **审计七条 + 移交件面全闭**。
- **父侧独立复跑**：`activity-live-visibility` **19/19 pass**（与 coder 报数一致）。
- **验收读数**：vsc `npm test` **695/695** · lint OK（212 档）· 协议两机检 + 新档 **25/25** · `ui.js` 改后 **474**（零增）· `activity.js` +10（≤±10）· 新档 71 / 84 / 400（≤80/120/400）· `doc-check` 按档归属零新增。
- **先红（真产者/真分发 · 八面）**：① 冻结键新代 ⇒ 活块 0→1；②③ escalate / sync spawn ⇒ 在册 false→true；④ 未钉底出生 ⇒ 钮 false→true ∧ `scrollTop` 零改；⑤ 未就绪内容 ⇒ 直投丢→入队；⑥ 第 4 参 ⇒ 载荷 0→1；⑦ 冻结键收 chunk ⇒ 痕 []→`drop-frozen`；⑧ consult done 无块 ⇒ 补桩 false→true（`late-terminal-stub`）。
- **越界项（4 条 · 逐条理由已审 · 均属设计授权面）**：`locales/{zh,en}.json`（`sub.newBlocks` 键落地——必须）· `AGENTS.md`（模块图登记两新档）· `WEBVIEW-PROTOCOL.md`（§13 `panelDiag` 行落 + §12 四行 ② 列 `--emit` 重出——设计授权「随实现落」）· `activity-closure` / `async-visibility`（随判据面收正）。
- **Δ 越预期（2 档 · 已披露）**：`panel-messages.mjs` +49（心跳拍体必须住设计文件集内）· `relay`/`callbacks` 越 10/5（五处置留痕与第 4 参拆解）——**全档零越 500 硬限**。
- **设计档漂移（登记 · 待收正）**：`WEBVIEW.md:154`（§5.1 生命周期表「新代接管」行）仍载「`started` + **`pool: true`**」，与 §5.3（`:207-210`）/ D-W26「不限角色族 · 不限 `pool`」互斥——实现取后者 ✓；**消解路径 = 设计档下次触碰单行收正**；到期 = 本批后续任何触碰。
- **登记不阻塞**：计数钮 N 含补桩出生 · T-A28 含 5ms 墙钟等待 · `blockNamesFor` consult CLI 形态分支死码 · `ev:subcontent` 收据只覆盖 relay 源 · 核 `makeRelay` 池兜底（出批上抛）。
- **状态行**：✅ 已收口 2026-09-19（全档冻结）。
- **台账**：#94 ⇒ 已核销。
