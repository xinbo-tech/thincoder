# 2026-09-20 · 嵌套 token 显示面批（NESTED-TOKEN-BATCH）

> 六段 append-only，一段一作者。编制：主 agent · 2026-09-20 14:3x · 来源 = 用户 14:29「**点火4条**」+ 台账 **#137**（承 sync 可达性批设计轮 §2.10 观察项 1 · eng-designer #47）。
> 本档 = **显示面**一则（出生事件守卫）；**须先复现**（原发现为静态推导 · 未现场复现）。

## §1 讨论（主 agent）

**状态行**：🔄 进行中（设计轮待发）

### 1.1 条目（1 条）

| # | 台账 | 条目 | 要点 |
|---|---|---|---|
| 1 | **#137** | **嵌套 sync 出生 token 归属缺陷** | `parseRelayPath.head` 取**最外层**（`thincoder-core/agent/spawn-child.mjs` 族 · `relay-prefix.mjs:27`）⇒ 形如 `eng-coder#2/explore#3/[model]x` 的嵌套 token 被 relay 当作**外层 head 的 `started`** 发出，而 webview **无「已出生」守卫**（`thincoder-vscode/webview/activity.js:306-327`）⇒ **外层 async 块 `pool` 翻 false / `startedAt` 重置** ⇒ 其 ⏹ 消失（门控 `activity-view.js:156`）。

### 1.2 边界与硬要求

- **第一义务 = 复现**：设计轮**必须先给现场复现**（真嵌套 spawn 序列或最小夹具），**复现不成立 ⇒ 判「不成立」结案**（不许照静态推导直接改 ✗）。
- **不触**：核面（sync 批已收口 ✓）· 已收口面条款 · `scripts/**` · 归档档 · 他批写域。
- **关联**：#133 序修复已使 `syncLive` 可真 ⇒ 本缺陷一旦成立，其**用户可见面**更明显（外层块 ⏹ 消失 ✓）。

### 1.3 验收（方向）

① 复现读数（成立 / 不成立 二择一，附证据）；② 若成立 ⇒ 修法 + 判据（先红后绿）；③ 受影响文件表；④ `doc-check` 净增 0。

### 1.4 台账

#137 → 本批（在途）· 落定后核销（或判「不成立」结案 ✓）。

## §2 批次任务与设计（eng-designer）

### 2.1 本批覆盖 / 不入批

| # | 台账 | 覆盖内容 | 落点面 |
|---|---|---|---|
| 1 | **#137** | 嵌套 token 归属缺陷（**已现场复现 · 成立**）：内层子代理的出生帧被当作**外层 head** 的 `started` ⇒ 外层块 `pool` 翻 false / `startedAt` 重置 / `model` 覆写 ⇒ ⏹ 消失 | VSC 宿主事件中继 1 档 + 新测试档 1 + 清单 1 行 |

**不入批（零改，逐条对应批界）**：核 `thincoder-core/**`（`relay-prefix.mjs` · `spawn-child.mjs` · `agent-tools/subagent*.mjs` 族——本批判据是**显示面归属**，非发射面）· `thincoder-cli/**`
· webview 渲染层（`webview/activity.js` · `webview/activity-view.js`——候选 A 下**零改**，见 §2.3）· 内容面（`relaySubagentContentChunk`——嵌套子标已在位，随 C2 复跑既有 `subagent-content-relay.test.mjs:75` T3 覆盖）· i18n · `scripts/**` · 归档档 · 他批写域。

**判据点名（本批唯一）**：#137 症状 = 外层块 ⏹ 消失（门控 `activity-view.js:156`）。本批**不动**同批兄弟面（#133 序修复已收口 ✓ · #134/#135 在册）。

### 2.2 复现（第一义务 · 现场读数）

**手段**（设计轮探针 · 真模块闭路 · 非静态推导）：happy-dom 夹具（`thincoder-vscode/test/helpers/webview-env.mjs`）+ 真 `panel-subagent-relay.mjs` + 真 webview `state.js`/`activity.js` + 真生成侧链：

- 外层 = depth-0 async spawn（生产字面 = `thincoder-core/agent-tools/subagent-run.mjs:147`/`:149`：`⟦ev⟧async` + `[model]`）；
- 内层 = 真装配 + 真宣告：`buildSpawnChild(...)`（`thincoder-core/agent-tools/subagent-spawn.mjs:464` 取号）→ `armSyncChildAbort(parent, key, baseSignal, () => emitRelayModel(ctx.callbacks?.onToken, …))`（生产形逐字 = `thincoder-core/agent-tools/subagent.mjs:339`）；
- 嵌套前缀由真生产者链拼出：`wrapChildCallbacks("eng-coder#2/", panelCb)`（`thincoder-core/agent/spawn-child.mjs:146-163`——async 支经 `subagent-run.mjs:110-124` 的 turn 镜像层透传 `_relayPrefix`）。

**面板实收 token（逐字）**：`eng-coder#2/explore#1/[model]explore-audit-model`

| 序 | 载荷（面板 → webview） | 块读数（`meta` + ⏹） |
|---|---|---|
| A 外层 async 出生 | `{status:"started", pool:true, model:"outer-model", startedAt:t0, syncLive:false}` | `pool:true` · `model:outer-model` · **⏹ 在位** |
| B 内层出生帧（真链） | `{status:"started", pool:false, model:"explore-audit-model", startedAt:t0+21ms, syncLive:false}` | `pool:false` · `model` **被覆写** · `startedAt` **重置** · **⏹ 消失** |
| D1 内层 `⟦ev⟧turn` | `{status:"turn", turn:7, maxTurns:9}` | 外层块头 turn 被污染 |
| D2 内层 `⟦ev⟧queued` | `{status:"queued", kind:"slot", …}` | 外层块翻 queued（⏳ 等待头） |
| D3 内层 `⟦ev⟧done` | `{status:"done"}` | **外层块冻结折叠 + 归档**（外层子代理仍在跑） |
| E 外层 sync 案 | `{status:"started", pool:false, model:"explore-audit-model", syncLive:true}` | ⏹ **幸存**（`syncLive` 支）；`model` 覆写 + `startedAt` 重置**照旧** |

**结论：成立**（A→B 两读数即 #137 症状本体；三症状全中）。**同族扩面**（D1–D3）= 同根因 + 同函数 + 同用户可见面（其中 D3 的早冻结比 ⏹ 消失更重）。

**机制链（本席实读）**：`parseRelayPath` 的 `head` 取**最外层**（`thincoder-core/agent/relay-prefix.mjs:27`）→ relay `[model]` 支**无条件**发 `started`（role/id = head；`thincoder-vscode/src/extension/panel-subagent-relay.mjs:99-104`）
→ webview `started` 支**无条件**写 `status/pool/syncLive/startedAt/model`（`thincoder-vscode/webview/activity.js:306-329`）→ 门控 `running ∧ (pool ∨ syncLive) ∧ family` 失守 ⇒ ⏹ 移除（`thincoder-vscode/webview/activity-view.js:150-158`，判据行 `:156`）。

**关键限定（决定修法落点）**：该载荷**不携嵌套信息**（role/id 恒 = 外层 head，无 inner 字段）⇒ 消费侧（webview）**结构上无法判别**一帧 `started`/`done` 是否属于本块 ⇒ 「消费侧守卫」只能治出生一症，同族三面不可达。

**CLI 对照（同 token 序列喂真 `routeSubToken`）**：外层块 `async:true · model:"outer-model" · queued:null · turn:0`，**零污染**；内层落子块载体 `{key:"explore#1", model:"explore-audit-model", done:true}`；`_frozenSubKeys` 空 ⇒ **CLI 免疫**。
**规条** = 「内层事件剥除不路由」（`thincoder-cli/src/tui/subagent-blocks.mjs:152` `nested` 判据 · `:164` async 支 · `:211-221` 其余事件族 · `:285-296` `[model]` 支；文档面 = `docs/cli/design/TUI.md` §6.8.2）。

### 2.3 修法设计（方案选型 ≥2 候选 + 取舍）

| 候选 | 内容 | 取舍 |
|---|---|---|
| **A（选定）** | **产者侧嵌套守卫**：`relaySubagentEventToken` 内加 `nested = path.inner.length > 0` 判据 ⇒ 内层链事件**消费不路由**（CLI `routeSubToken` **同旨**——同防外层块头污染；覆盖面差异 = CLI 另有子块载体落点面） | 治根因（归属）· 一次覆盖出生族 + 同族三面 · 单档单点 · CLI 有同旨先例可对拍 · 载荷字段集零改。代价：内层子代理的 `model` 与 `done/stopped` 定格在 VSC 无落点（CLI 落到不可见子块载体）⇒ 端差登记（§2.8 #2） |
| B | **消费侧出生守卫**（台账原建议形）：`activity.js` `started` 支「同块代已记出生 ⇒ 不改写 `startedAt`/`model`/`pool`/`syncLive`」（首写胜） | 只治 #137（⏹ 面）；**载荷仍带错误归属** ⇒ 同族 D1–D3 照旧（消费侧无嵌套信息 ⇒ 不可判 `done` 归属）；且心跳 2 s 重发与 takeover 的判定面须另行收窄 ⇒ 缺陷族半开 |
| C | A+B 双层 | 防御纵深；代价 = 第二套语义（CLI 无 `pool`/`startedAt` 对应守卫）· B 的覆盖面 ⊂ A ⇒ 收益 ≈ 0。**否决**（随 §2.10 #2 的 B 否决一并——收益 ≈ 0） |
| D | 核侧改（嵌套 spawn 不拼外层前缀 / 不发嵌套出生 token） | 与既有契约相抵：嵌套链 = `wrapChildCallbacks` 语义本体（内容并入外层 + 子块载体 + D-R23c1 内层定格），**CLI 正依赖它** ⇒ 改核连带 CLI 面 ⇒ 否决 |

**落地（候选 A · 单点）**：`thincoder-vscode/src/extension/panel-subagent-relay.mjs` `relaySubagentEventToken`（现 `:83-138`）——在 `const rest = path.rest`（`:91`）之后、`⟦ev⟧async` 支（`:93`）之前插入：

```js
const nested = path.inner.length > 0
if (nested && (rest.startsWith("⟦ev⟧") || rest.startsWith("[model]"))) { // 判据射程 = 内层链事件（评审 #1 收窄）
  logEvent("ev:substrip", { ch: `sub:${path.inner.at(-1)}`, outer: path.head, kind: rest.startsWith("[model]") ? "model" : rest.slice(4).split("\x1e")[0] })
  return true // 剥除不路由——同旨 CLI routeSubToken（防外层块头污染）；NFR-A2 留痕
}
```

**判据射程（评审 #1 收窄）**：仅「嵌套 ∧ `rest` 起于 `⟦ev⟧` 或 `[model]`」——含字面 `[model]`／`⟦ev⟧` 的**内层 text chunk** 不在射程内（`rest` 不以二者起头）⇒ 仍走内容面（T-N6 锁）。CLI 先例同形：嵌套剥除收在 `⟦ev⟧` 形态内，文本落内容路（`thincoder-cli/src/tui/subagent-blocks.mjs:204-211` · `:299-306`）。
**剥除留痕（评审 #3 · NFR-A2）**：独立事件名 `ev:substrip`（沿 `ev:subcontent` 先例——**不并入** `ev:subdeliver` 五处置计数，T-A13 判据面零改；射程 = 事件面，内容面高频 chunk 不在内）；载荷 `{ ch, outer, kind }`（`ch` = 内层自身频道 `sub:<inner>` · `outer` = 被防污染的外层键 · `kind` = 事件族名）。

**位置刚性（两条，均为复现读数所逼出）**：
① 必须早于 `⟦ev⟧async` 支（`:93-98`）——该支会 `set.add(path.head)`，内层 async 帧会把**外层键**塞进 `_relayAsyncPending` ⇒ 吞掉外层真实出生帧的 `pool:true`（T-N3 先红点）；
② 必须早于 `[model]` 支（`:99-104`）——该支既 `emit(started)` 又 `delete(pending)` ⇒ 双破坏（T-N2/T-N3 先红点）。

**修后期望读数（设计轮模拟已得，供实现轮对参）**——**事件面**：外层块 `pool:true · model:"outer-model" · startedAt 不变 · ⏹ 在位 · 未冻结`；内层出生帧与同族事件帧 ⇒ webview 载荷零增 + 逐帧一行 `ev:substrip` 痕（`ch:"sub:explore#1"` · `outer:"eng-coder#2"`）。
**内容面：不变**——含字面 `[model]`／`⟦ev⟧` 的内层 text chunk 仍落内容面（`name=sub:eng-coder#2` + `sub=explore#1`——判据收窄的直接后果；T-N6 锁）。

### 2.4 用例集（先红后绿）

**落点**：新档 `thincoder-vscode/test/nested-token-relay.test.mjs`（新档理由 = 面独立：既有 `sync-block-stop.test.mjs` 已 305 行且其判据面 = X10 门控/路由，掺入会混淆两面；新档登记 `test/files.mjs`）。手法 = 本档 §2.2 探针骨架（真 relay + 真 webview 模块 + 真生成侧链）。

| # | 断言（帧序写全——评审 #2） | 先红读数（今天 · 真模块实跑） |
|---|---|---|
| **T-N2** 嵌套出生帧剥除（真链） | 帧序 = 单帧：`eng-coder#2/explore#1/[model]x`（真装配 + 真宣告产物）⇒ `posted.length` 不增 ∧ 返回 `true` ∧ `ev:substrip` 一行（`ch=sub:explore#1` · `outer=eng-coder#2` · `kind=model`） | **红**：发 1 条 `started{pool:false, model:"x"}` + 零痕 |
| **T-N3** 嵌套 async 不污染 pending | 帧序：① 外层 `eng-coder#2/⟦ev⟧async`（真出生前驱）→ ② 内层 `eng-coder#2/explore#1/⟦ev⟧async` + 内层 `…/explore#1/[model]m` ⇒ 零载荷 + 两痕 → ③ 单层 `eng-coder#2/[model]m` ⇒ 唯一载荷 `started{pool:true}` | **红**：② 内层 async 复用 pending 键、内层 `[model]` 删键并发 1 条 `started{pool:true, model:"m"}`（载荷非零 + 零痕）⇒ ③ 落 `pool:false`（应 `true`） |
| **T-N4** 端到端（真 webview 闭路） | 帧序：① 外层 `⟦ev⟧async` + `eng-coder#2/[model]outer-model` → apply（基态：`meta.pool===true` · ⏹ 在位）→ ② 内层出生帧（真链）→ apply ⇒ `meta.pool` 仍 `true` ∧ ⏹ 在位 ∧ `meta.model` 与 `meta.startedAt` 逐字不变 | **红**：`pool:false` · 无 ⏹ · `model` 覆写 · `startedAt` 重置 |
| **T-N5** 同族事件面 | 帧序：外层出生 → 内层 `⟦ev⟧turn` / `⟦ev⟧queued` / `⟦ev⟧done` ⇒ 外层块 `turn` · `status` · `frozen` 零变化 + 逐帧 `ev:substrip` 痕 | **红**：turn 7/9 · status queued · frozen true |
| **T-N6** 内容面不误吞（宽判据反例 · 评审 #1） | 嵌套 text chunk 含字面 `[model]`（`eng-coder#2/explore#1/… [model] …`）⇒ 事件面返 `false` ∧ 内容面载荷 `name="sub:eng-coder#2"` ∧ `chunk.sub="explore#1"` ∧ 零 `ev:substrip` | **宽判据（`nested` 即早退）下必红**：该帧被吞（`panel-callbacks.mjs:139` 已消费 ⇒ 内容面与主流双失）；**今日 = 绿**（本案锁收窄口径） |
| **T-N7** 清单登记 | `test/files.mjs` 含新档 | **红** |

**零回归面（不加重复用例，走既有档）**：单层出生帧支 = `sync-block-stop.test.mjs` T-S1c 已覆盖；嵌套内容子标 = `subagent-content-relay.test.mjs:75` T3 已覆盖（两者随 C2 复跑）——**D2 单源：新档不复制同形断言**。

**帧序注（评审 #2）**：四条用例逐条写全帧序（免实现轮按半截帧序写出不可满足的绿）；**T-N6 口径** = 宽判据反例锁——今日（未修）= 绿，若实现按 `nested` 即早退落地则必红（该帧被吞）⇒ 收窄判据下维持绿。其余四条（T-N2–T-N5）今日红（实跑读数 = §2.12）。

### 2.5 受影响文件表（行数 = 实读 as-of 2026-09-20 · 口径 = `wc -l` / 含末行；增量 = 预计）

| 档 | 面 | 现行数 | 预计增量 | 内容 |
|---|---|---|---|---|
| `thincoder-vscode/src/extension/panel-subagent-relay.mjs` 【源】 | 事件中继 | 257 | +6~10 | `nested` 判据（射程 = 内层链事件）+ 早退 + `ev:substrip` 留痕 |
| `thincoder-vscode/test/nested-token-relay.test.mjs` 【测试·新档】 | 新档 | 0 | +105~145 | T-N2–T-N6 五例 + 头注（复现指针 → 本档 §2.2） |
| `thincoder-vscode/test/files.mjs` 【测试】 | 清单注册 | 119 | +1 | 新档登记（T-N7） |
| `docs/vsc/design/WEBVIEW.md` 【设计档 · 收口轮】 | 契约 / 决策 | 586 | +10~16 | §5.3 事件面嵌套规条 + §6 决策行 + §10 回指行 + `:239` 坐标收正 + 变更记录（见 §2.8 #1） |

**文件级判据**：源码侧全部 < 500 硬限（最大 = relay 257 → ~263-267 ✓；函数级 `relaySubagentEventToken` 现 ~56 行 → ~62 ✓）；`WEBVIEW.md` 586 → ~600（**文档档不受 500 源码限**）。
**零改（明列）**：`webview/activity.js`（450）· `webview/activity-view.js`（200）· `src/extension/suspension.mjs`（430）· `src/extension/panel-callbacks.mjs` · `thincoder-core/**` · `thincoder-cli/**` · i18n · `scripts/**`。

### 2.6 验收标准（A1–A5 对位 + 命令，全 ASCII / cmd.exe）

**A1 复现有结论** = §2.2（**成立** · 附真链读数）· **A2 修法含 ≥2 候选** = §2.3（4 候选 A–D）· **A3 受影响文件表** = §2.5 · **A4 验收命令** = C1–C4 · **A5 不一致处** = §2.9 #3。

| # | 判据 | 命令（cmd.exe） | 期望 |
|---|---|---|---|
| C1 | 新建用例面（先红后绿） | `cd thincoder-vscode && node --test test/nested-token-relay.test.mjs` | 先红（T-N2–T-N5 四条）→ 后全绿 |
| C2 | 同族零回归（X10 三支 + 内容面嵌套子标） | `cd thincoder-vscode && node --test test/sync-block-stop.test.mjs test/subagent-content-relay.test.mjs` | 全绿（保持——本批零改其判据面） |
| C3 | 包级全绿 | `cd thincoder-vscode && npm test` | 全绿（**基线 = 实现轮实读**，不钉数） |
| C4 | 机检净增 0 | `cd D:\teamcode\thincoder && node scripts/doc-check.mjs --root .` | 锚 0 悬空 · 行宽 0（本设计轮实读基线 = 悬空 0 / 行宽 0 ⇒ 净增 0 义务） |

**需求回指（三链同源）**：#137（台账）→ 本档 §1 条目 1 → 本节验收；需求档锚 = **F-A4**（「任何重建 / 补发路径产生的块必须保留完整控制面与首见元数据：⏹ 取消 · async/sync 标记 · model · startedAt」——`docs/vsc/requirements/WEBVIEW.md:53`）+ **F-W1**（嵌套活动显示对位行 `:115`：嵌套行随外层块、不做嵌套独立小节）。**需求面无需新增条目**（本条 = 既有条目被实现违反）。
**NFR-A2 落点（评审 #3——可诊断面）**：剥除路径留痕 = `ev:substrip`（判据见 §2.3「剥除留痕」，落点 = 实施轮 `panel-subagent-relay.mjs`）；度量 = 用例断言痕迹发生（§2.4 各例）+ 痕迹调用点在位。端侧无痕义务的说明 = 被剥除帧不达 webview（无端侧事件可记）。

### 2.7 边界（本批不做）

- 不动核（`relay-prefix.mjs` 的 `head` 语义 / 发射面字面）· 不动 CLI · 不动 webview 渲染层（`activity.js` / `activity-view.js`）与内容面（`relaySubagentContentChunk`）。
- 不改载荷字段集与协议表（`WEBVIEW-PROTOCOL.md` 零改）；不新增协议消息形态；不加第二 registry / 第二采样路径。
- 不重构 `subagent-run.mjs:149` 的 async 支 `[model]` 字面（同形重复登记在册 = #127 族，非本批）。
- 不触 `scripts/**` / 归档档（`_archive` 引文可留）/ 他批写域；不清理记录面历史表述。

### 2.8 收口轮文档面清单（**不在本批实现轮**，逐处给出承接方）

| # | 落点 | 收正内容 | 承接 |
|---|---|---|---|
| 1 | `docs/vsc/design/WEBVIEW.md` §5.3（事件面）· §6（决策表）· §10（回指表）· `:239` 坐标 · 变更记录 | 事件面嵌套规条段 + D-W41 决策行 + §10 回指补 F-A4 / NFR-A2 + `:239` 同点坐标收正（要点见下块） | **eng-designer**（收口轮） |
| 2 | `docs/vsc/requirements/WEBVIEW.md` §4 端差表 | 补一行端差登记（射程 = §2.10 #1 的 A-全族）：内层 `model` 与内层 `done/stopped` 定格 = **CLI 有落点 / 本端无落点**；内层 `async`/`queued`/`turn`/`cancelled`/`settled` = **两端同为剥除**（无端差）；本端嵌套行只随外层块（F-W1 对位行既有语义） | **父侧**（需求档笔） |
| 3 | 台账 #137 | 本批落定后核销 | **父侧** |

**收口轮 §5.3 落笔要点（评审 #1 / #3 / #5 / #6 的落档面）**：
- ① 判据 = `path.inner.length > 0` ∧ `rest` 起于 `⟦ev⟧`／`[model]`——含字面形态的内层 text chunk **不在射程**（仍走内容面）；
- ② 理由句 = 载荷无嵌套信息 + CLI `routeSubToken` **同旨**（防外层块头污染）+ **覆盖面差异**（CLI 有子块载体落点 · 本端端差登记）；
- ③ 留痕判据 = `ev:substrip`（独立事件名——不并入 `ev:subdeliver` 五处置计数；载荷 `{ ch, outer, kind }`）；实据 = 本档 §2.2 · 用例 = §2.4 T-N6；
- ④ `:239` 同点坐标收正（`activity.js:44-48` → `:49-50`）。

### 2.9 观察项（本批范围外，逐条附证据，**只报不动**）

1. **嵌套子代理完成锚 → 可见折叠桩（端差）**：核 `subagent.mjs:395` 置 `ctx._subagentKey = syncKey`（**内层**键），端侧 `settleSyncSubagent`（`panel-callbacks.mjs:89-95`）据此发内层身份的 `done` ⇒ webview 无该块 ⇒ 走 F-A2 终态补桩，落一枚**可见折叠桩** `sub:explore#N`（CLI 对位 = 不可见子块载体定格）。**判**：非归属缺陷（是补桩射程 × 嵌套的交互面）⇒ 建议另案登记，不并入本批。
2. **`activity.js:49-50` 的 `sub:consult <model> #<id>` 解析分支** = CLI 形态残留（`WEBVIEW.md:239` 已登记「不作判据」；其同点坐标按评审 #6 随收口轮同批收正——见 §2.8 #1）——本批不动。
3. **不一致处核对**：本席实读与批档 §1 已知事实**一致**（`relay-prefix.mjs:27` head 取最外层 · `activity.js:306-327` 无出生守卫 · `activity-view.js:156` 门控）。**增补两点**（批档未记）：
   ① 产者点 = `panel-subagent-relay.mjs:99-104` 的**无条件** `emit(started)`；
   ② 同支**同时消费** `_relayAsyncPending`（`delete`）⇒ 内层出生帧会吞掉外层 pending 标记（= T-N3 的判据来源）。
4. **旁证不实核对**：批档 §1.1 引 `sync-block-stop.test.mjs` 三条 X10 测试「夹具预置 registry ⇒ 不构成生产可达性证据」（承 #133 evidence）——本席实读**成立**（该档 T-S2/T-S3 为 display-logic-only），与本批无冲突。

### 2.10 裁定项（原待裁 2 条——评审 #7 建议 + 父侧裁定）

1. **剥除射程 = A-全族**：出生族（`⟦ev⟧async` + `[model]`）+ 同族事件族（turn/queued/终态）一并剥除——覆盖 §2.2 的 D1–D3。理由 = 同根因 + 同函数 + 同用户可见面；CLI 规条已含全族（一次触碰一面，免二进宫）。**否决 A-出生族（最小面）**：只消 #137 症状、D3「早冻结」留另批 ⇒ 同一函数二进宫。
2. **不叠加消费侧出生守卫（候选 B）**：否决理由 = B 覆盖面 ⊂ A（载荷无嵌套信息 ⇒ 消费侧不可判同族三面）· 第二套语义无 CLI 先例 · 心跳 2 s 重发与 takeover 面须另行收窄。**候选 C（A+B 双层）随 B 一并否决**（B 的覆盖面 ⊂ A ⇒ 收益 ≈ 0）。

### 2.11 复现手段留痕（可复跑）

探针 = 设计轮 inline node（真模块闭路 · 未落任何档）：入口三段 = `test/helpers/webview-env.mjs` 的 `setupWebview()` + `installChatFixture()` → 真 relay/webview 模块 `import` → 生成侧真链 `buildSpawnChild` + `armSyncChildAbort` + `wrapChildCallbacks`。
全部读数见 §2.2 表；`.mjs` 夹具写法先例 = `thincoder-vscode/test/sync-block-stop.test.mjs`（本档 §2.4 新档同骨架）。
**修正轮补跑（评审 #1 直接导出 · 2026-09-20）**：真 relay 模块直驱——内层 text chunk 含字面 `[model]`／`⟦ev⟧` ⇒ 事件面返 `false` + 内容面载荷 `{name:"sub:eng-coder#2", sub:"explore#1"}`（= T-N6 今日绿读数）。
今日红读数（内层 `[model]` 发 `started{pool:false}` · 内层 async+`[model]` 误发 `started{pool:true}` 且单层回落 `pool:false` · 内层 turn/queued/done 各 1 条）= §2.12 表。

### 2.12 设计评审修正轮（id=61 · 发现 1–7 逐条落 · 2026-09-20 · eng-designer）

**轮次** = fix（定点 · 追加制）。**依据** = 本档 §3 轮次 1 发现表（🔴1 / 🟡3 / 🔵3 = 7 条）+ 父侧逐条裁定**接受**（`Suggestion` 列 = 处置建议 · 处置执行 = 本席）。
**改动形态** = ① 被点名处**就地收正**（§2.3 / §2.4 / §2.5 / §2.6 / §2.8 / §2.9 / §2.10——本作者段内；原行可由 git 历史逐字复核）② 本节 = 追加制轮记（号 → 改动 file:line → 机检断言 / 实测读数）。
**本轮不做**：产品码（`panel-subagent-relay.mjs` 一行未动 · 零 token）· 需求档 · 设计档正文（`WEBVIEW.md` 落笔 = 收口轮，清单见 §2.8）· §1 / §3–§6 · `scripts/**` · 他批写域。**零新条目 · 零新语义**（只落 7 条的直接导出项）。

| 发现 | 严重度 | 处置 | 改动落点（file:line · as-of 本节） |
|---|---|---|---|
| 1 | 🔴 | Fixed | `:85`（判据收窄：`nested && (rest.startsWith("⟦ev⟧") || rest.startsWith("[model]"))` 替 `nested ⇒ return true`）+ `:91`（新增「判据射程」段 · CLI 先例同形）+ `:98`–`:99`（期望读数改述「事件面：…；内容面：不变」双读）+ `:111`（新增 T-N6 宽判据反例例） |
| 2 | 🟡 | Fixed | `:108`（T-N3 帧序写全：外层 `⟦ev⟧async` 前驱 → 内层两帧 → 单层 `[model]` 三步）+ `:107` / `:109` / `:110`（T-N2 / T-N4 / T-N5 逐条帧序）+ `:116`（帧序注） |
| 3 | 🟡 | Fixed | `:92`（新增「剥除留痕（NFR-A2）」段：`ev:substrip` 独立事件名 + 载荷 `{ ch, outer, kind }`）+ `:142`（新增 NFR-A2 落点行）+ `:155`（§2.8 #1 带留痕判据句）+ `:122`（§2.5 relay 行增量按实收正 `+5~9` → `+6~10`） |
| 4 | 🟡 | Fixed | `:156`（§2.8 #2 端差行按实读改写：`model` + `done/stopped` 定格 = 端差；`async`/`queued`/`turn`/`cancelled`/`settled` = 同剥除）+ `:76`（§2.3 A 行代价栏同点收正——原「`model`/`turn`」不实 · 同缺陷类一致性修） |
| 5 | 🔵 | Fixed | `:76`（A 行「同规」→「**同旨** + 覆盖面差异」）+ `:87`（落地注释同句）+ `:122`（§2.5 行 1）+ `:161`（§2.8 §5.3 落笔要点 ②）——§2 段「同规」零残留（仅 §3 评审原句保留） |
| 6 | 🔵 | Fixed | `:168`（§2.9 #2 坐标 `activity.js:44-48` → `:49-50`）+ `:163`（§2.8 #1 收口轮补 `WEBVIEW.md:239` 同点收正行） |
| 7 | 🔵 | Fixed | `:174`–`:177`（§2.10 两待裁按裁定收正：**A-全族** ✓ · **不叠加 B** ✓ + 否决理由）+ `:78`（§2.3 候选 C 行同步「否决」——原「留作评审可选分层」已随裁定作废） |

**实跑读数（本席 · 真 relay 模块直驱 · 2026-09-20）**：

- **T-N6 面（内容面 · 今日绿）**：`relaySubagentEventToken` 对 `eng-coder#2/explore#1/… [model] …` ⇒ `false`；`relaySubagentContentChunk` ⇒ `true` + `{name:"sub:eng-coder#2", sub:"explore#1"}`（`⟦ev⟧` 字面形态同读）。
- **今日红读（T-N2–T-N5 期望）**：内层 `[model]` ⇒ 1 条 `started{pool:false, model:"…"}`；① 外层 async → ② 内层 async + 内层 `[model]` ⇒ 1 条误发 `started{pool:true, model:"m"}` → ③ 单层 `[model]` ⇒ `pool:false`；内层 turn/queued/done ⇒ 各 1 条（外层键）。
- **机检**（`node scripts/doc-check.mjs --root .` · cwd = 仓根）：**悬空 0 · 行宽 0**（与修前基线同读 ⇒ **净增 0**；`PROJECT-MANIFEST.json:27-30` 声明 `batches` 在扫描排除域内 ⇒ 本档改动不进该读数）。

**机检断言（全 ASCII · 搜索域 = §2.3–§2.11 切片——免本节自匹配）**：

```
node -e "const L=require('fs').readFileSync('docs/batches/2026-09-20-nested-token-batch.md','utf8').split('\n').slice(71,184);const c=(k)=>L.filter(x=>x.includes(k)).length;console.log('wide',c('if (nested) return true'),'narrow',c('nested && (rest.startsWith'),'strip',c('ev:substrip'),'tn6',c('T-N6'),'coord',c('activity.js:49-50'),'gui',c('\u540c\u89c4'),'zhi',c('\u540c\u65e8'),'nfr',c('NFR-A2'))"
```

⇒ 实测 **wide 0 · narrow 1 · strip 9 · tn6 7 · coord 1 · gui 0 · zhi 3 · nfr 4**（宽判据零残留 · 收窄判据在位 · 留痕 / 用例 / 坐标 / NFR-A2 面在册；「同规」§2 段零残留）。

**不一致处（如实报告）**：① `Suggestion` 列逐条已落，无 Not-an-issue / 无 Deferred；② **#4 加修一处**——§2.3 A 行代价栏同载旧读「`model`/`turn`」（点名行 = §2.8 #2），按同缺陷类一并收正并在此列明；③ **#3 采「独立事件名」支**（非「`ev:subdeliver` 增一值」支）——理由 = 剥除不达投递口（非投递处置）+ 五处置计数与 T-A13 判据面零改（沿 `ev:subcontent` 先例），与 #1 的收窄判据同点自洽；④ **行号漂移声明**：父侧 C4 引的 `:92`（修后期望读数行）= 修前坐标，收正后该行 = `:98`–`:99`（本轮插入新段所致）；⑤ **§2.5 relay 增量** = `+6~10`（收窄判据 5 行 + 留痕 1 行 ⇒ 下界 6；#3 Suggestion 的「可能越 +9」为上限情形）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象**：嵌套 token 显示面批（#137）§2 全段（`docs/batches/2026-09-20-nested-token-batch.md:30-165`）。**方法学限制**：无文档地图 / 无 Project Standards ⇒ Document ownership 判据降级（按 AGENTS.md + 批档既有惯例判）；C4 命令实读有效（`scripts/doc-check.mjs:44-46` 收 `--root`）。
**§2.5 数字抽检（口径 = 批档声明「wc -l / 含末行」）全数吻合**：relay 257（函数 `relaySubagentEventToken` 56 行）· files.mjs 119 · activity.js 450 · activity-view.js 200 · suspension.mjs 430 · WEBVIEW.md 586 · sync-block-stop.test.mjs 305 ⇒ 文件级/函数级均未触 300/500 档，无拆分义务。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Feasibility（判据射程） | 🔴 | 早退判据写作 `nested ⇒ return true`（`:84-85`，位置=「`parseRelayPath` 之后、四类分支之前」`:81`）——**射程宽于「内层链事件」**。本函数入口是子串门 `if (!text.includes("⟦ev⟧") && !text.includes("[model]")) return false`（`panel-subagent-relay.mjs:85`）⇒ **含字面 `[model]`／`⟦ev⟧` 的内层 text chunk**（如 `eng-coder#2/explore#1/… 讲 [model] token …`）今天走到 `:137 return false` ⇒ 落内容面（`:160-178` ⇒ `name=sub:eng-coder#2` + `sub=explore#1` 子标行，同形既有 T3 `test/subagent-content-relay.test.mjs:75`）；修后该帧被**整条吞掉**（`panel-callbacks.mjs:139-141` 以 `true` = 已消费 ⇒ 既不落内容面也不落主流）⇒ 内层子代理内容静默丢失。与设计自称「内容面读数不变」（`:92`）·「不动内容面」（`:135`）相抵；CLI 先例并不这么宽（`thincoder-cli/src/tui/subagent-blocks.mjs:204-211` 的嵌套剥除被收在 `payload.startsWith("⟦ev⟧")` 形态内，文本落 `:299-306`）⇒ 本批用例与 C2 均照绿，回归会静默上线 | 判据收窄为「嵌套 ∧ `rest` 起于 `⟦ev⟧` 或 `[model]`」，§2.3 的两条位置刚性不动；用例集补一条「嵌套 text chunk 含字面 `[model]` ⇒ 仍走内容面（`name=sub:eng-coder#2` + `sub=explore#1`；先红 = 该帧被吞）」。判据行数不变 ⇒ §2.5 relay 行 `+5~9` 无需改 |
| 2 | Acceptance（先红后绿不可达） | 🟡 | T-N3 的绿期望「内层 `⟦ev⟧async` + 内层 `[model]` ⇒ 零载荷；随后**单层** `eng-coder#2/[model]m` ⇒ `pool:true`」（`:101`）在其所列帧序下**不可达**：`pool` 唯一来源 = `_relayAsyncPending.delete(path.head)`（`:100`），修后内层帧在 `:93` 之前即被剥除、不再入 pending ⇒ 缺真外层 `eng-coder#2/⟦ev⟧async` 帧时，单层出生必落 `pool:false`（与红读数同形 ⇒ 该例修后仍红）。红侧描述本身与实读一致（修前：内层 async 入 pending → 内层 `[model]` 删键 ⇒ 单层 `pool:false`） | T-N3 写全帧序（外层 `⟦ev⟧async` → 内层 async/`[model]` → 单层 `[model]`）或把断言改为「单层出生 `pool` 以真外层 async 帧在场为前提」；四条用例逐条写全帧序，免实现轮按字面写出不可满足的绿 |
| 3 | Requirements（可诊断面 · NFR-A2） | 🟡 | 新剥除路径**零痕**：NFR-A2 要求「每一次『出生事件被守卫丢弃 …』留一条可断言痕迹（webview 侧结构化日志 + 主侧投递日志）」（`docs/vsc/requirements/WEBVIEW.md:59`），而 §2.2 的 B 帧与 D1–D3 帧正是「出生族事件被守卫丢弃」；同文件族既有「禁静默」成规（宿主五处置含 `discard-dispose`：`panel-subagent-relay.mjs:230-232` · `chat-panel.mjs:132-134`；webview 侧 `activity.js:298-299`/`:365`/`:393` 各落 `drop-*` / `late-terminal-stub` 痕），且本缺陷当初正是凭「不可诊断」扩大 | 给剥除路径落一痕（沿用 `ev:subdeliver` 处置词表增一值，或独立 `logEvent`），并在 §2.8 #1 的 §5.3 段落内带该痕判据句；若判不落痕，须在 §2.6 需求回指里明写 NFR-A2 不适用的理由。若采用，§2.5 relay 行增量按实收正（可能越 `+9`） |
| 4 | Requirements（端差登记） | 🟡 | §2.8 #2 行「内层子代理的 `model`/`turn` 本端不跟踪（CLI 有子块载体）」（`:145`）实读不符且射程不全：① `turn` 不在载体面——CLI 嵌套支 `subagent-blocks.mjs:211-221` 除 `done`/`stopped` 外一律剥除（嵌套 turn 同剥 ⇒ 无端差）；② 载体实收 = `[model]`（`:285-296`）+ `done/stopped` 定格（`:211-221`）——本档 §2.2 的 CLI 读数亦作 `{model, done:true}`（`:69`）⇒ 该行**多写 turn、漏写 done 定格**；③ 若 §2.10 #1 取 A-全族，内层 `queued/cancelled/settled` 亦从「外溢到外层块头」（`panel-subagent-relay.mjs:105-131`）变为无落点，端差行须随射程对齐 | 该行按实读改写为「内层 `model` + 内层 `done/stopped` 定格无落点；内层 `queued/turn/cancelled/settled` 两端同为剥除（无端差）」，并与 §2.10 #1 的裁定射程同步 |
| 5 | Clarity（对拍表述） | 🔵 | 「CLI `routeSubToken` 同规」为过度等价：CLI 是**同旨**（防外层块头污染）但**多一层载体面**——嵌套 `[model]` 与 `done/stopped` 落子块载体（`subagent-blocks.mjs:211-221`/`:285-296`），本端无该面（§2.3 A 行代价栏已承认差异 `:76`）；该措辞将随 §2.8 #1 进入 `WEBVIEW.md` §5.3 理由句与代码注释（`:85` 同句） | 措辞改为「同旨（防外层块头污染）+ 覆盖面差异（CLI 有子块载体 · 本端端差已登记）」，免后续按「同规」追问两端行为差 |
| 6 | Doc hygiene（坐标漂移） | 🔵 | §2.9 #2 引 `activity.js:44-48` 的 `sub:consult <model> #<id>` 分支（`:151`）——实读 `:44-48` = `parseChannel` 头 + family 正则（`:47`），consult/escalate 正则在 `:49-50`（`:50` 即「CLI 形态残留（不作判据）」注释源）；该坐标沿用 `WEBVIEW.md:239` 既有同坐标（既有漂移，非本批引入） | 收口轮同点收正为 `activity.js:49-50`（`WEBVIEW.md:239` 与 §2.9 #2 同点），或标注「沿用既有坐标」以免复查二次误判 |
| 7 | Scope（待裁裁定建议） | 🔵 | §2.10 两条待裁（`:159` 剥除射程 · `:160` 是否叠加 B）属评审待裁项，非缺陷 | 裁定建议：① **A-全族**（D1–D3 与 #137 同根因/同函数/同用户可见面；`done` 早冻结比 ⏹ 消失更重；`panel-subagent-relay.mjs:93-136` 单点可覆全族）；② **不叠加 B**（载荷无嵌套信息 `:92` ⇒ B 覆盖面 ⊂ A，且引入无 CLI 先例的第二套语义；其「心跳 2 s 重发」前提实读成立 `panel-messages.mjs:40`/`:45-47`，但不足以改变取舍） |

**计数：🔴 1 · 🟡 3 · 🔵 3**（#1–#7）。
VERDICT: changes-required

### 轮次 2（评审子代理）

**轮次 2（复核 · 承轮 1 changes-required · 修正轮 id=62）**——只验 §2.12 七条真落 + 修正引入的新问题；不重开全量评审（批界声明照办）。

**实读面（本轮 fresh）**：本档全 241 行 · `thincoder-vscode/src/extension/panel-subagent-relay.mjs:1-40/:70-189/:240-258`（末行 = 257 内容行 ⇒ §2.5 的 257 ✓；判据未落源档 ✓ 与 §2.12「产品码一行未动」一致）· `panel-callbacks.mjs:125-154` · `webview/activity.js:40-57` · `thincoder-cli/src/tui/subagent-blocks.mjs:140-219/:278-307` · `thincoder-core/log.mjs`（`logEvent` 面）· `test/protocol-coverage.test.mjs:32/:109/:179-181` · `test/activity-live-visibility.test.mjs:241`。
**方法学限制**：无文档地图 / 无 Project Standards ⇒ Document ownership 判据降级（承轮 1）；C4 命令有效（`scripts/doc-check.mjs:44-46` 收 `--root`）。

| # | Orig# | File | Severity | Status | Notes |
|---|---|---|---|---|---|
| 1 | 1 | 本档 `:85`（+`:91`/`:99`/`:111`） | 🔴 | Fixed | 判据收窄真落：`:85` = `if (nested && (rest.startsWith("⟦ev⟧") || rest.startsWith("[model]"))) { // 判据射程 = 内层链事件（评审 #1 收窄）`；`:91` 射程段（含字面 `[model]`／`⟦ev⟧` 的内层 text chunk 不在射程 ⇒ 仍走内容面）+ `:99` 内容面「不变」双读 + `:111` 新增 T-N6 反例（今日绿 = 收窄口径锁）。回归封死链实读成立：源档 `panel-subagent-relay.mjs:85` 子串门（`if (!text.includes("⟦ev⟧") && !text.includes("[model]")) return false`）→ `:137` `return false` → `panel-callbacks.mjs:139` `if (relaySubagentEventToken(panel, tok)) return` 之后落内容面 ⇒ 含字面 `[model]` 的内层 text chunk 不再被吞 ✓ |
| 2 | 2 | 本档 `:108`/`:116` | 🟡 | Fixed | T-N3 帧序写全（① 外层 `⟦ev⟧async` 前驱 → ② 内层 async/`[model]` ⇒ 零载荷 + 两痕 → ③ 单层 `[model]` ⇒ `pool:true`）——绿可达：`pool` 唯一来源实读 = `panel-subagent-relay.mjs:96` `set.add(path.head)` / `:100` `const pool = _relayAsyncPending.get(panel)?.delete(path.head) === true` ✓；红读数（② 误发 `started{pool:true}` · ③ 回落 `pool:false`）与源档一致 ✓ |
| 3 | 3 | 本档 `:86-87`/`:92`/`:142`/`:155` | 🟡 | Fixed | `ev:substrip` 独立事件名 + `{ ch, outer, kind }` 真落（`:86` `logEvent("ev:substrip", { ch: … , outer: path.head, kind: … })`）；可行性实读 = `panel-subagent-relay.mjs:29` `import { logEvent } from "@thincoder/core/log.mjs"` ✓ · 同形先例 `:184`/`:190` `logEvent("ev:subcontent", { ch, face })`（「**不并入** `ev:subdeliver` 五处置计数」注释同源）✓ · `core/log.mjs:107` `export function logEvent(kind, fields = {})` 无名册校验 ✓ · `protocol-coverage.test.mjs` 只扫 RELAYS 载荷字面量（`:32` `const RELAYS = [` · `:109` `function relayLiterals(code, fn)`）⇒ 无 fail-closed 冲突 ✓ |
| 4 | 4 | 本档 `:156`（+`:76`） | 🟡 | Fixed | 端差行按实读改写 ✓ 并与 CLI fresh 实读吻合：`subagent-blocks.mjs:146-147`（内层 ⟦ev⟧ 除 done/stopped…外剥除不路由）· `:209-210`（其余内层事件 turn/approval/queued/settled/async/cancelled 剥除不路由）· `:213-217`（done/stopped → `closeSubChild` 子块定格）· `:285-290`（内层 `[model]` → `leaf.model`）⇒「`model` + `done/stopped` 定格 = CLI 有落点 / 本端无落点；`async/queued/turn/cancelled/settled` = 两端同为剥除」逐字成立 ✓ |
| 5 | 5 | 本档 `:76`/`:87`/`:161` | 🔵 | Fixed | grep 复核：「同规」全档仅存 `:231`（§3 轮 1 评审原句 · 声明豁免）；「同旨」= `:76`/`:87`/`:161` ✓ |
| 6 | 6 | 本档 `:168`（+`:163`） | 🔵 | Fixed | 坐标收正真落（`:168` = `activity.js:49-50`）；准确性实读：`activity.js:49` `const c = /^sub:(consult|escalate) (.+) #(\d+)$/.exec(channel)` · `:50` `… // CLI 形态残留（不作判据）` ✓（`:44-48` = `parseChannel` 头 / family 正则）；`:163` 收口轮同点收正行在位 ✓ |
| 7 | 7 | 本档 `:176-177`（+`:78`） | 🔵 | Fixed | 两条裁定收正（A-全族 ✓ · 不叠加 B ✓ + 否决理由）；`:78` 候选 C 行同步「**否决**」✓；「待裁 / 留作」残留仅在记录面（`:174` 标题「原待裁 … 父侧裁定」· `:200` · `:233`）✓ |
| 8 | (new) | 本档 §2.8 | 🔵 | 提示（非缺陷） | 收口轮承接项（WEBVIEW.md §5.3/§6/§10 + `:239` 坐标 + 变更记录 · requirements §4 端差行 · 台账 #137 核销）= 声明式延期；按批界排除不在本批评审面 —— pass 以收口轮实落为前提 |
| 9 | (new) | — | 🔵 | 提示（非缺陷） | 本席未复跑项（如实声明）：① `PROJECT-MANIFEST.json:27-30` 的 batches 排除域声明；② `doc-check` 实跑读数（悬空 0 / 行宽 0，承设计席自报——本席无运行面）。§2.12 机检读数经手工重数逐项吻合：wide 0 · narrow 1 · strip 9 · tn6 7 · coord 1 · gui 0 · zhi 3 · nfr 4（切片 71–184 自洽——命令行自匹配被上界排除 ✓） |

**计数：复核 7/7 Fixed · 新发现 🔴 0 · 🟡 0 · 🔵 2（提示项，不阻断）**
VERDICT: pass

## §4 用户批准（主 agent）

**2026-09-20 14:5x 父侧代签** —— 用户 14:40「**全自动跑到下午五点**」⇒ 本批**设计评审点火权 + §4 批准权**均在授权射程内（窗口 → 17:00）。

**三条件核验**：① 评审 **pass**（id=61 changes-required → 修正轮 id=62 **7/7 Fixed** → **复核 id=65 pass**（逐条实读校：判据收窄 `:85` · T-N6 反例锁 · `ev:substrip` 留痕 · 端差行 · 坐标 · 裁定项）✓）；② 修正轮已落地并经父侧逐条核验 ✓；③ **token 已签发**（值不落档——运行时凭证）✓。

**批准范围**：本批全量（唯一源档 = `panel-subagent-relay.mjs` + 新测试档 `nested-token-relay.test.mjs` + `files.mjs` 登记 1 行）；**实施轮已派发** ✓。
## §5 实施记录（eng-coder）

**状态行**：✅ 实现完成（C1–C4 全绿 · 内审 + advisor 代码评审终态 = clean/pass）· 2026-09-20 · eng-coder

### 5.1 交付摘要（file → 落点 → Δ · as-built）

| 档 | 落点 | Δ（实读口径 = 含末行） |
|---|---|---|
| `thincoder-vscode/src/extension/panel-subagent-relay.mjs` 【源】 | `relaySubagentEventToken` 内 **L92–100**：嵌套守卫（`const nested = path.inner.length > 0` + 收窄判据 `nested ∧ (rest 起于 ⟦ev⟧／[model])` + `ev:substrip` 留痕 + `return true`）——位置 = `const rest = path.rest`（`:91`）之后、`⟦ev⟧async` 支（`:102`）与 `[model]` 支（`:108`）之前（§2.3 两条位置刚性 ✓） | 257 → **266** 行（**+9** ∈ §2.5 预计 +6~10 ✓）；函数级 `:83-147` = **65** 行（档记 ~62——+3，见 5.4 #1） |
| `thincoder-vscode/test/nested-token-relay.test.mjs` 【新档】 | **T-N2–T-N7 六例 + 头注**（复现指针 → §2.2）；真链夹具 = `buildSpawnChild`（L86）+ `armSyncChildAbort` announce 闭包（L87/L92）+ `wrapChildCallbacks` 前缀链（L79）+ `emitRelayModel` 单源；真 webview 闭路 = `state.js`/`activity.js` + happy-dom 夹具（L105-113）；留痕读取 = `THINCODER_LOG_DIR` 隔离目录（L37-51/L62-72） | 0 → **230** 行（§2.5 预计 +105~145——**实收越上界 +85**，见 5.4 #1；300 建议线内，无拆分义务） |
| `thincoder-vscode/test/files.mjs` 【测试】 | **L119** 新档登记行（T-N7 断言源） | 119 → **120** 行（**+1** ✓） |

**零改（明列核验）**：`webview/**` · `src/extension/suspension.mjs` · `src/extension/panel-callbacks.mjs` · `thincoder-core/**` · `thincoder-cli/**` · i18n · `scripts/**` · 设计档 / 需求档 · `test/sync-block-stop.test.mjs`——本席 diff 面 = 上表三档（`git status` 实读；工作区其余在途改动属他批写域）。

### 5.2 先红后绿（读数原文）

**先红**（`node --test test/nested-token-relay.test.mjs` · 仅落测试档 · 源档未动）：

- T-N2 红：`零载荷（先红：1 条）`——内层出生帧发 1 条 `started{pool:false}` + **零 `ev:substrip`**；
- T-N3 红：`② 内层两帧零载荷（先红：1 条误发 started{pool:true}）` + `② 两痕` 实收 `[]`；
- T-N4 红：`pool 未被翻 false（先红：内层 started 覆写）`——`false !== true`；
- T-N5 红：`三帧零载荷（先红：各 1 条落外层键）`——`4 !== 1`（三条内层帧各落外层键）；
- T-N7 红：未登记；**T-N6 绿**（内容面反例锁——收窄口径下维持绿）。

**后全绿**（落源档 L92–100 + 登记行后复跑）：`6/6 pass · 0 fail`。

**变异探针（负例锁非空验证）**：临时把判据改为宽形 `if (nested)` ⇒ **T-N6 红**（`事件面不认领` 失败：`actual: true` / `expected: false` ⇒ 该帧被整条吞掉）⇒ 按 §2.4 反例锁成立；随即逐字还原（`git diff` 复核：探针前后同形，blob `d975f0ea`）。

**先红期修正（本席自捕 · 测试夹具缺陷）**：初版 T-N3/T-N5 只经真链**合成**内层帧而未驱动入 relay（断言空过）⇒ 增 `drive(p, chain, fn)` 逐帧驱动后再断言；修正后先红读数与 §2.4 表逐条吻合（T-N3 恰 1 条误发 · T-N5 恰 3 条落外层键）。

### 5.3 验收命令读数（C1–C4 · 全 ASCII）

| # | 命令 | 读数 |
|---|---|---|
| C1 | `cd thincoder-vscode && node --test test/nested-token-relay.test.mjs` | 先红（T-N2–T-N5 + T-N7）→ **6/6 pass · 0 fail** |
| C2 | `cd thincoder-vscode && node --test test/sync-block-stop.test.mjs test/subagent-content-relay.test.mjs test/nested-token-relay.test.mjs` | **25/25 pass · 0 fail**（两既有档零改复跑；`sync-block-stop.test.mjs` 逐字未动） |
| C3 | `cd thincoder-vscode && npm test` | **853 tests · 853 pass · 0 fail · 0 cancelled · 0 skipped**（基线 = 本轮实读，不钉数） |
| C4 | `cd D:\teamcode\thincoder && node scripts/doc-check.mjs --root .` | **OK(锚): 0 条悬空 · OK(行宽): 源域全部 .md 无 >300 字符单行** ⇒ 与设计轮基线同读 ⇒ **净增 0** |

### 5.4 留痕与实收（决策透明）

1. **§2.5 预估 vs as-built（越界项如实列报）**：新测试档实收 **230 行**（预计 +105~145 ⇒ 越上界 85）；函数级 `relaySubagentEventToken` = **65 行**（档记 ~62）。成因 = 真链夹具三件（装配 / 宣告 / 前缀链）+ 日志痕读取器 + webview 闭路夹具 + 评审 #2「逐条写全帧序」口径。**未触** 300 建议线 / 500 硬限 ⇒ 无拆分义务；§2.5 属设计席段（实施席不改），建议收口轮按本行 as-built 回填。
2. **留痕（NFR-A2）落点**：`ev:substrip` 独立事件名（**不并入** `ev:subdeliver` 五处置计数——沿 `ev:subcontent` 先例）；载荷 `{ch, outer, kind}` = `{sub:<最内层段>, 被防污染的外层 head, 事件族名}`；测试断言痕迹发生（逐帧）+ 调用点在位。写门实读 = `core/log.mjs:64`（`NODE_TEST_CONTEXT` 下默认跳过）+ `:135` 同步 `appendFileSync` ⇒ 隔离目录读行无竞态。
3. **编号面（如实登记）**：任务书范围写作「T-N1–T-N7」，设计 §2.4 表自 **T-N2** 起（全档零 `T-N1` 定义）⇒ 交付 = 设计表全集（六例 T-N2–T-N7），**未另造 T-N1**。
4. **判据面零改声明**：本批不动载荷字段集 / 协议表 / webview 渲染层 / 内容面（`relaySubagentContentChunk`）——T-N6 锁内容面同路由（`name=sub:eng-coder#2` + `sub=explore#1` + 零痕）。

### 5.5 内审 + 代码评审（轮次与终态）

- **内审（explore · 只读 · 轮次 1）**：四类偏差 = ① 实现面（验收条目 / 判据收窄 / 留痕）**零发现** · ② 静默简化 **零发现** · ④ 超清单 **零发现**（全仓指纹 `ev:substrip` / `nested-token-relay` 命中域 = 三交付档）· ③ 记录面 **1 项 🔵**（§2.5 预估 vs 实读）⇒ **无代码修正轮**。
- **代码评审（advisor type=code · 轮次 1）**：🔴 0 · 🟡 0 · 🔵 3 —— **VERDICT: pass**。三条处置（响应表）：

| # | 严重度 | 评审发现 | 处置 |
|---|---|---|---|
| 1 | 🔵 | 记录面数值/内容漂移（§2.5 新档 +105~145 vs 实读 230；「T-N2–T-N6 五例」vs §2.4 六例；函数级 ~62 vs 65） | **本段 5.4 #1 列报实收**（§2.5 属设计席段，实施席不越权改）；建议收口轮回填 |
| 2 | 🔵 | T-N1 编号留白（任务书范围 vs §2.4 表） | **本段 5.4 #3 登记**；交付与设计表一致，无缺例 |
| 3 | 🔵 | `:99` 行尾注释与 `:93-95` 注块语义重复 | **Not-an-issue**——`:99` 行尾句 = 批档 §2.3 设计块字面（评审 #5 定稿「同旨」措辞的落地句），且为 `return` 点判据锚；保留 |

**终态 = clean**（零未处置项 · 零代码修正轮 · 评审 pass）。

### 5.6 上抛项（父侧 / 收口轮）

1. §2.8 收口清单照旧承接（`docs/vsc/design/WEBVIEW.md` §5.3 嵌套规条 + `:239` 坐标 · `docs/vsc/requirements/WEBVIEW.md` §4 端差行 · 台账 #137 核销）——本轮零改。
2. §2.5 该行 as-built 回填（新档 230 行 / 六例措辞 / 函数级 65 行）建议随收口轮同批收正。
3. §2.9 观察项 1（嵌套 sync 完成锚 ⇒ 可见折叠桩）保持「只报不动」——本轮零触。

## §6 验证与收口（父代理）

**2026-09-20 15:0x 父侧收口**

**交付核验（四道）**：设计（#59：**真模块闭路复现** ⇒ 缺陷成立 + CLI 免疫对照）✓ · 评审（id=61 **changes-required** 🔴1：判据射程过宽 ✗）→ 修正轮（#62 7/7 + 真模块复跑取证 + T-N6 反例锁）→ 复核（id=65 **pass** 7/7 Fixed）✓ · **实施（#66 · eng-coder）**✓——产者侧嵌套守卫收窄判据 + `ev:substrip` 留痕（`panel-subagent-relay.mjs:92-100` · +9 行 ∈ 预估 +6~10 ✓）+ 新档 `nested-token-relay.test.mjs` 六例 ✓

**读数**：C1 先红（T-N2–T-N5 + T-N7）→ **6/6** ✓ · C2 **25/25** ✓ · C3 **853/853** ✓ · C4 锛 0 · 行宽 0 ✓ · **变异探针**（临时改宽形 ⇒ T-N6 红 ⇒ 逐字还原）⇒ 负例锁非空 ✓✓

**台账**：#137 → **已核销** ✓

**遗留（显式）**：① §2.5 该行 **as-built 回填**（新档实读 230 行 / 六例 / 函数级 65 行——收口轮或下批）；② 收口轮承接：`WEBVIEW.md` §5.3 规条 + `:239` 坐标 · `requirements/WEBVIEW.md` §4 端差行（需求档笔）；③ §2.9 #1 观察项（嵌套完成锚 ⇒ 可见折叠桩）保持只报不动 ✓。

**提交**：待入库（本笔 + 后批）。
