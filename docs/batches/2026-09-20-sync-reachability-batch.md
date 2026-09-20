# 2026-09-20 · sync 可达性批（SYNC-REACHABILITY-BATCH）

> 六段 append-only，一段一作者。编制：主 agent · 2026-09-20 13:0x · 来源 = 台账 **#133 + #135-④**（用户 11:51「库存那些也点火把」+ 13:04「继续」）· 承 **P2 批 §6 遗留**与 **P1 批 §6 遗留③**（X10 降级登记的上抛项）。
> 本档 = **核面两则小轮**（序缺陷 + 计时器卫生）；不触需求档 / 设计档（设计档面随本批收口轮）。

## §1 讨论（主 agent）

**状态行**：🔄 进行中（设计轮待发）

### 1.1 条目清单（2 条台账 · 同域并批）

| # | 台账 | 条目 | 要点 |
|---|---|---|---|
| 1 | **#133** | **sync 子代理可中止载荷「产者侧序缺陷」** | **根因** = sync 出生 token `[model]` 由 `buildSpawnChild` 内 `makeRelay` 发射（`thincoder-core/agent-tools/subagent-spawn.mjs:459` → `spawn-child.mjs:75`），而 registry 写点 `armSyncChildAbort` 在同一次 execute 的**更后一行**（`thincoder-core/agent-tools/subagent.mjs:329`，晚于 `:276`，**中间无 await**）⇒ VSC relay 采样 `syncLive` 时注册表必为空 ⇒ **恒 false** ⇒ X10「sync 块 ⏹」**运行期不可达**。**次因（盲窗）**：首回合 run 期 `panel._agent` 未绑定（`thincoder-vscode/src/extension/panel-turn-loop.mjs:163` 才回写）。**已落面（保留）** = P1 批 2 的判据/门控/路由三条（本身正确 ⇒ 序修好后 ⏹ 自然成活，零二次显示面工作）；三条测试 = display-logic-only。 |
| 2 | **#135-④** | **核 `hooks.mjs` 守卫定时器未 unref ⇒ 测试进程尾挂 ~11s** | `child_process` 钩子用例因核 `hooks.mjs` 的守卫定时器（未 `unref`）使测试进程尾挂 ~11s（CLI `hooks-stop.test.mjs` 同款 · **非某批引入**）⇒ 修 = `unref()`（或等价收口），**行为语义零改**。 |

### 1.2 边界

- **不触**：设计档 / 需求档（随本批收口轮）· `scripts/**` · 归档档 · 他批写域 · P1/P2 已收口面。
- **与 P2 写域的关系**：`subagent.mjs` 出现在 P2 车道 2 的接触面（已收口 ✓）⇒ 无并行冲突 ✓。
- **X10 已落面不动**（判据/门控/路由三条保留 ✓）；测试由 display-logic-only 升级为**真序断言**（本批新增 ✓）。

### 1.3 验收（方向 · 细式由设计定）

① 序修复后 `syncLive` 在真实 spawn 序列上**可为真**（以真发射顺序为夹具，**非**预置 registry）；② 首回合盲窗的处置（修 / 或显式接受并告知——**设计席须给结论**）；③ 定时器 `unref` 后测试进程**零尾挂**（实测墙钟读数）；④ 三包全绿 + `doc-check` 净增 0。

### 1.4 台账

#133 / #135-④ → 本批（在途）· 本批落定后核销。

## §2 批次任务与设计（eng-designer）

### 2.1 本批覆盖 / 不入批

| # | 台账 | 覆盖内容 | 落点面 |
|---|---|---|---|
| 1 | **#133** | ① 出生序（根因）② 首回合盲窗（次因） | 核 `core/agent/*` + VSC 宿主绑定 1 档 |
| 2 | **#135-④** | `hooks.mjs` 守卫定时器未 `unref` | 核 `core/hooks.mjs` 1 档 |

**不入批（零改，逐条对应批界）**：X10 已落三条（`activity-view.js` 门控 · `panel-messages-turn.mjs` 路由 · `suspension.mjs` 投影）· 显示面（`panel-subagent-relay.mjs` 载荷 · `webview/**` · i18n）· 设计档 / 需求档（收口轮，见 §2.9）· `scripts/**` · 归档档 · 他批写域 · 嵌套出生 token 归属（观察项 1，§2.9）。

**可达面口径（先钉住，后文引用）**：sync 子代理 = `wantAsync = args.async ?? ((ctx.depth ?? 0) === 0)`（`thincoder-core/agent-tools/subagent.mjs:224`）——depth-0 默认 async，**显式 `async:false` 是逃生口**（同档 `:222` 注释逐字）；depth>0 恒 sync。⇒ 面板上的「sync 块」= **depth-0 显式 sync spawn**（其 head = 顶层 `panel._agent` 本身 ⇒ registry 键同对象，判据才有意义）；depth>0 的嵌套 sync spawn 的出生 token 带外层前缀、归外层块（见观察项 1），与本批判据无涉。

### 2.2 设计一：sync 出生序（#133 根因）——取号/发射两段 + 出生宣告内聚进 arm 单点

**病（证据链，逐段 file:line）**：sync 出生 token `[model]` 由 `buildSpawnChild` 的 sync 分支发射（`thincoder-core/agent-tools/subagent-spawn.mjs:459` → `thincoder-core/agent/spawn-child.mjs:72-77`，发射行 `:75`）；registry 写点在同一次 execute 的**更后一行**（`thincoder-core/agent-tools/subagent.mjs:329` `armSyncChildAbort`，晚于 `:276`，两者之间**无 await**）⇒ VSC 载荷产者 `syncLiveOf`（`thincoder-vscode/src/extension/panel-subagent-relay.mjs:77-79`）在 `[model]` 到达时采样 `panel._agent._syncChildAborts` **必空** ⇒ `:103` 载荷恒 `syncLive:false` ⇒ ⏹ 永不出现。**无第二载体可翻真**：心跳 / 存活投影只枚举池条目且硬编码 `syncLive:false`（`thincoder-vscode/src/extension/suspension.mjs:151-153`）。**CLI 侧不受影响**（门控 = 渲染期采样 `thincoder-cli/src/tui/subagent-panel.mjs:123`）⇒ 本缺陷的可见面 = VSC 一次性载荷。

**方案选型（≥2 候选 + 取舍）**

| 候选 | 内容 | 取舍 |
|---|---|---|
| **A（选定）** | 拆 `makeRelay` 取号/发射两段（`allocRelay` + `emitRelayModel`），sync 分支**只取号不发射**；发射改由 SYNC-CANCEL 单点 `armSyncChildAbort(parent, key, baseSignal, announce)` 在 **registry 写入之后**当场宣告 | **与 async 支同序**（先例 = `executeAsyncSpawn` 池登记 `subagent-run.mjs:186-187` **先于** `:147-149` 的 `⟦ev⟧async`/`[model]`）⇒ 同一不变式两端一致；序落在**单点内**（可测：§2.5 T-S1b）；arm 之后**全部出口经同一 finally 注销**（`subagent.mjs:366-370`——arm 在 `:329`、try 自 `:331` 起）⇒ 无漏注销窗口；改动 3 档 ≈15 行（**纯代码行**口径——§2.6 增量为含注释口径 +24~36） |
| B | 显示面补采样（VSC 心跳 / 重绘再读 registry，或加周期再采样） | **违批界**（P1/P2 已收口面 · 零二次显示面工作）+ 必然引入第二采样路径（与 X10「禁第二 registry · 单源」精神相抵）；且**端差来源未消**（产者侧仍先宣告后登记） |
| C | 发射不搬 + arm 后**补发第二枚** `[model]` | **双出生事件**：webview `started` 分支无「已出生」守卫（`thincoder-vscode/webview/activity.js:306-327` 无条件重写 `meta`）⇒ `pool` 可能被翻 false、`startedAt` 重置、`model` 覆写 ⇒ 块状态抖动；「出生」语义二义 ⇒ 弃 |
| D | arm 移入 `buildSpawnChild`（发射不动） | 序更「结构」（装配即宣告），但需把 `armSyncChildAbort` 迁叶（`DOC-DISCIPLINE.md:603` 在册的独立抽取动作）或注入回调；且 arm 与调用方 try 域被拉开（装配返回 → try 之间窗口）⇒ 漏注销风险 ⇒ **记保留**（若日后要「单调用夹具」再回看） |

**选定 A 的落地（3 档，逐行给出改动点）**

1. `thincoder-core/agent/spawn-child.mjs`（239 行）
   - 新增 `allocRelay(parent, label)`：`_subAgentCounter` 取号 + `relayPrefixOf`（**取号段**，无 io）。
   - 新增 `emitRelayModel(emit, relayPrefix, model)`：`emit?.(relayPrefix + "[model]" + (model ?? ""))`——`[model]` 文法**仍单源本档**（原 `:75` 字面逐字承）。
   - `makeRelay(parent, label, emit, model)` 收窄为 `allocRelay` + `emitRelayModel` 的组合（escalate / consult 两调用点零改：`subagent-actions.mjs:392` · `consult.mjs:292`）。
2. `thincoder-core/agent-tools/subagent-spawn.mjs`（474 行）— sync 分支 `:459` 改 `relayPrefix = allocRelay(parent, role ?? "sub")`（**不再发射**；async 分支 `:452-457` 零改——其 `[model]` 本就在启动点发）。`child._logId` / `child._upstream`（`:463`/`:466`）不变（仍在装配面定值）。
3. `thincoder-core/agent-tools/subagent.mjs`（410 行）— `armSyncChildAbort`（`:67-78`）加尾参 `announce = null`：`registry.set(key, …)`（`:74-75`）**之后** `announce?.()`，再返回 `{ ctrl, disarm }`；注释写死「序即契约 + async 支同序先例」。阻塞路径 `:329` 改为
   `const { ctrl, disarm } = armSyncChildAbort(parent, syncKey, baseSignal, () => emitRelayModel(ctx.callbacks?.onToken, relayPrefix, built.childProvider?.model ?? ""))`
   （`built.childProvider` = `buildSpawnChild` 返回件 `:472`；`syncKey`/`baseSignal` 快照点不动，`baseSignal` 仍单次快照供 `classifySyncAbort` 复用——`subagent.mjs:328`/`:338` 语义零改；另 **`subagent.mjs:22` import 面补 `emitRelayModel`**）。

**为何「宣告」必须留在 arm 内、而不是由调用方另起一行**：arm 内 = 写入与宣告同一函数、序不可被调用方拆散；且该函数是 SYNC-CANCEL 族的既有可测件（`thincoder-cli/test/sync-cancel.test.mjs:134` / `abort-provenance.test.mjs:41` 直驱）⇒ 新序有现成的直驱测试位（§2.5）。

**零回归面**：`makeRelay` 组合语义与 `:73-76` 逐字等价（escalate / consult / 既有测试零改）· CLI TUI 建块仍由 `[model]` 驱动（仅晚微秒级、仍早于任何内容 chunk）· async 支零改 · relay / webview / 路由零改（`[model]` 文法与字段集不变）。`buildSpawnChild` 唯一调用点 = `subagent.mjs:276`（装配面不发射 ⇒ 无第二消费方受影响；各测试档 callbacks 无 `onToken`——`ctx.callbacks?.onToken` 恒 undefined ⇒ 发射 no-op，本无发射断言）。

### 2.3 设计二：首回合盲窗（#133 次因）——结论 = **修**（宿主写回口与 `panel._agent` 同槽）

**病（证据）**：VSC 宿主在回合内创建 / hydrate 顶层单例后同步写回 `opts.agent`（`thincoder-vscode/src/agent.mjs:110`，主循环 `:178` 之前）——但面板字段只在**回合循环结束**才同步（`thincoder-vscode/src/extension/panel-turn-loop.mjs:161-163`）⇒ 首回合 run 期（以及换槽 / destroy 后的首回合）`panel._agent` 为 null ⇒ 载荷产者与路由（`panel-messages-turn.mjs:86`）双盲。

**方案选型**

| 候选 | 内容 | 取舍 |
|---|---|---|
| **甲（选定）** | `runTurnLoop` 内 `ro` 的 `agent` 槽改为 **⇄ `panel._agent` 的访问器**（抽导出件 `bindPanelAgent(panel, holder)`，运行期一行接入）：宿主 `opts.agent = agent` 的写回**当场落到面板字段** | 1 档 + 3~4 行 + 单测；**不动 X10 三条**、不动 relay 载荷与 webview；载荷产者与取消路由**同享**可达性（两者读同一字段）；语义 = 把「回合末同步」提前为「写回即同步」（`:163` 幂等保留） |
| 乙 | 显式接受 + 告知面（收口轮设计档两行：首回合无 ⏹，fail-closed 不伪造可中止） | 覆盖不到「新会话 / 换槽后首回合」——**恰是最常见入口回合**；「告知」无用户可见载体（只留文档承诺）⇒ 否决 |
| 丙 | relay / 路由改读第二来源（如 `panel._liveLines.history` 载体） | 需把 `_syncChildAborts` 升为 `CARRIER_FIELDS`（载体表 + T-AF16/17 机检连带）**且**改显示面读源 ⇒ 面最大，违「零二次显示面工作」⇒ 否决 |

**落地**：`panel-turn-loop.mjs` 新增导出件 `bindPanelAgent(panel, holder)`（get = `panel._agent`；set = 写 `panel._agent`），`runTurnLoop` 构造 `ro`（`:65-83`）后一行接入；`:161-163` 的回合末写回保留（幂等，注释可随修）。**残留口径（如实）**：本修 + 序修之后，sync 块 ⏹ 的可达面 = 「depth-0 显式 `async:false` spawn × 任意回合」——depth>0 嵌套 sync 仍无 ⏹（其 registry 挂子代理对象，非顶层 `panel._agent`；非缺陷、判据使然，收口轮落句话说明）。

**回合中 `panel._agent` 置 null 窗口（评审 #2 语义口径——结论 = 显式接受并登记为行为变更）**：活绑定下 `ro` 的 `agent` 槽 = 面板字段实读。置 null 全族（三类）：

- 构造初始化（`chat-panel.mjs:70`）· 跟焦点换项目（`:86`，上方 `turnBusy()` 守卫）· 工作区兜底换 cwd（`:102`，无忙态守卫——触发 = 当前 cwd 目录已被移出工作区）；
- 会话/项目切换族（`panel-session.mjs:113` 六路汇合 · `panel-project.mjs:42`——面板侧守卫由 `panel-session.mjs:109-112` 载明、`panel-project.mjs:31-34` 实读一致）；
- 绑定不匹配（`panel-chat.mjs:55`，仅回合入口）· view/panel 销毁（`chat-panel.mjs:138`/`:247`，同点即 abort 在途回合 + kill 分发器）。

⇒ 仅存的**回合中**窗 = 冷启重载（`openSessionContent`）· 销毁两点 · 工作区兜底（异常路径）。其上续跑迭代（Ctrl+I / ContinueError-Continue）重读 `ro.agent` = null ⇒ `agent.mjs:103` `existingAgent = null` ⇒ **本轮 `setupAgentRun` 新建 agent**（今日快照语义 = 续用同一对象）。

**判 = 接受**：面板槽被清即「会话身份已换 / 面板已亡」，续用旧对象恰违 §11 AC4（agent 不跨 session 复用）；新建后回合末 `:163` 回写自愈、下回合按 `ensurePanelAgent` 槽匹配判定（路径不变）。**登记** = §2.9 #8；本窗不配新测试（评审未要求，实现面零增）。

### 2.4 设计三：钩子守卫定时器（#135-④）——`unref` 收口，行为语义零改

**病（证据 + 实测）**：`thincoder-core/hooks.mjs:95` `setTimeout(() => done(0), timeout + 1000)` 未 `unref` ⇒ 该 handle 单独维持事件循环存活至默认 `10_000 + 1000` ms。**实测（本设计轮，2026-09-20）**：`node --test --test-name-pattern T-HS8 test/hooks-stop.test.mjs`（**该用例根本不产生子进程**）= `duration_ms 11553` / 墙钟 11.7s；`T-HS10`（真子进程）= `duration_ms 11726` / 墙钟 12.1s；VSC `test/lifecycle-hooks.test.mjs` 整档 = `duration_ms 13712` / 墙钟 14.3s。⇒ 挂因 = 守卫定时器本身（无子进程用例同样挂 ≈11s）；排除 `child_process` 的 `timeout` 选项内部定时器（探针：spawn 短命子进程 + `timeout:10000` ⇒ 宿主 727ms 退出）。

**修法（落点唯一 = `hooks.mjs`）**：守卫句柄捕获后 `unref()`，并在 `done()` 收尾 `clearTimeout`（TDZ 安全：先 `let guard = null`，`done` 内 `if (guard) clearTimeout(guard)`）。**语义面零改**：进程存活期间守卫照常触发（真 CLI 运行事件循环有其它 handle）；唯一差别 = 不再单独维持进程存活。**house 先例**：`thincoder-core/mcp/transport-stdio.mjs:20` 同形 `.unref()`。

### 2.5 测试升级：真序夹具（先红 → 后绿）

**落点**：`thincoder-vscode/test/sync-block-stop.test.mjs`（206 行，就地升级 + 头注收正）。理由：断言目标 = **载荷**（`syncLive`），闭路两端（核出生序 + VSC relay）本档可同测；VSC 测试树直驱核 `buildSpawnChild` 有先例（`test/eng-designer-role.test.mjs` / `test/subagent-audit-summary.test.mjs`）。

| 断言 | 内容 | 先红读数（今天） |
|---|---|---|
| **T-S1a** 装配面零发射 | spy `ctx.callbacks.onToken`；sync 分支 `buildSpawnChild(parent, ctx, {task}, "explore", false, [], [], null)` ⇒ 断言 spy **零** `[model]` token；且 `built.relayPrefix` 形如 `explore#N/`、`_subAgentCounter` 恰 +1（取号仍在装配面） | **红**：今天 `:459` 发 1 条（`spawn-child.mjs:75`） |
| **T-S1b** 出生序单点（真 relay 闭路） | `panel._agent = parent`（真 agent 形状）；`key = built.relayPrefix.slice(0,-1)`；调 `armSyncChildAbort(parent, key, null, () => emitRelayModel((t) => relaySubagentEventToken(panel, t), built.relayPrefix, "m"))` ⇒ 断言 `panel.posted.at(-1)` = `{type:"subagent", role:"explore", id:N, status:"started", pool:false, model:"m", startedAt:<num>, syncLive:true}` ∧ `parent._syncChildAborts.has(key) === true`（宣告时刻 registry 已在位） | **红**：第 4 参不存在 ⇒ 零载荷 |
| **T-S1c** 判据零回归 | 承 T-S1 既有断言（不预置 registry）：无 `_agent` / 键未命中 ⇒ `syncLive:false`；async 支（`⟦ev⟧async` 前置）⇒ `pool:true` 且 `syncLive:false` | 绿（保持） |
| **T-S1d** 链路形状冻结 | 用生产的**两条调用**（`buildSpawnChild` → `armSyncChildAbort(…, announce)`）复刻首回合序列 ⇒ 载荷与 T-S1b 同形 | 红（同一因）——**标注为「链路形状」，不冒充真序证据**：真序由 T-S1a ∧ T-S1b 两面夹（装配面不得宣告 + 宣告必须在登记之后） |
| **T-S1e** 生产调用点接线（结构机检 · 评审 #1 选项②） | 读 `thincoder-core/agent-tools/subagent.mjs` 源（空白归一后）⇒ 断言阻塞路径调用形在位：`armSyncChildAbort(parent, syncKey, baseSignal, () => emitRelayModel(ctx.callbacks?.onToken,`（第 4 参 = announce 闭包） | **红**：第 4 参不存在 ⇒ 零命中（先例形 = T-B2 / T-S6 / `thincoder-cli/test/hooks-stop.test.mjs:251` T-HS11） |
| **T-B1** 面板绑定 holder 契约 | `bindPanelAgent(panel, holder)` ⇒ 写 `holder.agent = a` 后 `panel._agent === a`；反向写 `panel._agent = b` 后 `holder.agent === b` | 红（helper 不存在） |
| **T-B2** 接线机检 | 读 `panel-turn-loop.mjs` 源 ⇒ `bindPanelAgent(panel, ro)` 在位（结构机检形，同档 T-S6 / `hooks-stop.test.mjs` T-HS11 先例） | 红 |
| **T-S2–T-S6** | webview 门控 / 点击载荷 / 宿主路由 / 清单登记 | **零改**（X10 已落三条不动） |
| **T-T1 定时器（墙钟判据）** | `cd thincoder-cli && node --test --test-name-pattern T-HS8 test/hooks-stop.test.mjs` 读 `duration_ms` | 红：`11553`（上表实测）⇒ 修后 < 2000 |

「先红后绿」路径 = 上表红行逐条先跑记读数 → 实现 → 复跑转绿；（T-S1a/T-S1b 之外的既有断言不得改判据，只可因夹具升级改注释）。

### 2.6 受影响文件表（行数 = 实读 as-of 2026-09-20；增量 = 预计）

| 档 | 面 | 现行数 | 预计增量 | 内容 |
|---|---|---|---|---|
| `thincoder-core/agent/spawn-child.mjs` 【源】 | 生成侧 | 239 | +10~14 | `allocRelay` / `emitRelayModel` 两导出；`makeRelay` 收窄为组合 |
| `thincoder-core/agent-tools/subagent-spawn.mjs` 【源】 | 装配点 | 474 | +2~4 | sync 分支改取号（不发射）+ 注释 |
| `thincoder-core/agent-tools/subagent.mjs` 【源】 | SYNC-CANCEL | 410 | +12~18 | `announce` 尾参 + 序契约注释 + 阻塞路径发射行 |
| `thincoder-core/hooks.mjs` 【源】 | 钩子 | 98 | +3~5 | 守卫句柄捕获 + `unref()` + `clearTimeout` |
| `thincoder-vscode/src/extension/panel-turn-loop.mjs` 【源】 | 面板绑定 | 165 | +6~10 | `bindPanelAgent` 导出件 + `runTurnLoop` 接入一行 |
| `thincoder-vscode/test/sync-block-stop.test.mjs` 【测试】 | 真序夹具 | 206 | +35~55 | T-S1a/b/c/d + T-B1/T-B2 + 头注由 display-logic-only 收正 |
| `thincoder-vscode/test/files.mjs` 【测试】 | 清单注 | 118 | ±1 | `:111` 登记注「display-logic-only」→ 真序 |

**文件级判据**：全部 ≤500 硬限（最大 = `subagent-spawn.mjs` 474 → ~478，**未触线但已在册**）；函数级 `buildSpawnChild` 增量 ≈0（只删一行调用形态）、`armSyncChildAbort` +2 行。**零改（明列）**：`activity-view.js` · `panel-messages-turn.mjs` · `suspension.mjs` · `panel-subagent-relay.mjs` · `webview/**` · i18n · `thincoder-cli/src/**` · `thincoder-cli/test/sync-cancel.test.mjs` / `abort-provenance.test.mjs`（可选第 4 参 ⇒ 既有调用零改）· `thincoder-cli/test/hooks-stop.test.mjs`（判据 = 时长读数，不需改档）。

### 2.7 验收标准（A1–A5 对应 + 命令，全部 ASCII / cmd.exe）

**A1 两条设计齐（含选型 ≥2 候选）** = §2.2（4 候选）· §2.3（3 候选）· §2.4（单点修法，无选型面）。**A2 = 验收判据与命令面**（回指形 = 评审 #8 建议②）= 本表 C1–C6；任务书原文不在档 ⇒ 原文若为异项，收口轮就地改指。**A4 首回合盲窗有结论** = §2.3（结论 = 修，甲案；含回合中 null 窗口语义口径 = 接受为行为变更）。**A3 受影响文件表** = §2.6。**A5 不一致处** = §2.9。

| # | 判据 | 命令（cmd.exe） | 期望 |
|---|---|---|---|
| C1 | 序修复真序可达 + 生产调用点接线 | `cd thincoder-vscode && node --test test/sync-block-stop.test.mjs` | 先红（T-S1a/T-S1b/T-S1e/T-B1/T-B2）→ 实现后全绿；T-S1e = 结构机检（`subagent.mjs` 阻塞路径第 4 参 = announce 闭包） |
| C2 | 定时器零尾挂（实测墙钟） | `cd thincoder-cli && node --test --test-name-pattern T-HS8 test/hooks-stop.test.mjs` | 先红 `duration_ms` ≈11553 → 后 < 2000 |
| C3 | 同族交叉核对（真子进程面） | `cd thincoder-cli && node --test --test-name-pattern T-HS10 test/hooks-stop.test.mjs` | 先红 ≈11726 → 后 < 2000 |
| C4 | VSC 钩子用例面 | `cd thincoder-vscode && node --test test/lifecycle-hooks.test.mjs` | 先红墙钟 ≈14.3s → 后回落到用例体时（≈3s 内） |
| C5 | 三包全绿 | `cd thincoder-core && npm test` · `cd thincoder-cli && npm test` · `cd thincoder-vscode && npm test` | 三包全绿（**基线 = 实现轮实读**——不钉数；同日兄弟批计数已异动：`docs/batches/2026-09-20-batch-record-commons.md:270` 核 395 / CLI 716 / VSC 731 · `docs/batches/2026-09-20-display-parity-batch.md:900` 核 401 / VSC 797） |
| C6 | 机检净增 0 | `cd D:\teamcode\thincoder && node scripts/doc-check.mjs --root .` | 锚 0 悬空 · 行宽 0（净增 0 义务） |

**（§1.3 四方向逐条对位）**：① = C1（真发射顺序夹具，非预置 registry——T-S1a/T-S1b 两面夹）② = §2.3 结论（修）+ T-B1/T-B2 ③ = C2/C3/C4（实测读数）④ = C5/C6。

### 2.8 边界（本批不做）

- 不动 X10 已落三条（判据 / 门控 / 路由）；不动 relay 载荷字段与 webview 渲染；不加第二套 registry / 第二采样路径。
- 不改 `wantAsync` 默认（depth-0 仍默认 async）；不新增 sync 可达面、不改 depth>0 强制同步规则。
- 不动 async 支发射序（已正确）；不做 `[model]` 字面量的异步支收口（观察项 2）。
- 不改需求档 / 设计档（收口轮，§2.9）；不触 `scripts/**` / 归档档 / 他批写域。
- 定时器只改 `hooks.mjs` 一处（不对全仓 `setTimeout` 普查改形）。

### 2.9 收口轮文档面清单（**不在本批**，逐处给出理由，供收口轮直接执行）

| # | 落点 | 收正内容 |
|---|---|---|
| 1 | `docs/core/design/AGENT-LOOP-SUBAGENT.md:62`（X10 现态句）· `:1868`（§6.7.2 收正句） | 「产者侧序缺陷 ⇒ 降级登记」→ **已修**；补可达面口径句（depth-0 显式 `async:false`）+ 首回合盲窗已收（甲案） |
| 2 | `docs/core/design/AGENT-LOOP.md:185`（模块图 spawn-child.mjs 功能列表） | 补 `allocRelay` / `emitRelayModel`；`makeRelay` 记为组合 |
| 3 | `docs/vsc/design/WEBVIEW.md:225-226`（§5.2 ⏹ 行）· `:250`（sync spawn 即建块句）· `:252`（判据句）· `:320`（坐标行 · 评审 #3） | 删「产者侧序缺陷在册」残留；出生点 = arm 单点宣告；改写 `:250` 机制句时**只校** `:320` 坐标（现引 `spawn-child.mjs:77-82` 已漂——`makeRelay` 现盘 span = `spawn-child.mjs:72-77`，本批重构后再下移） |
| 4 | `docs/vsc/design/WEBVIEW-PROTOCOL.md:92`（载荷行） | `syncLive` 产者归属句（`panel-subagent-relay.mjs` + 出生序单点） |
| 5 | `docs/vsc/requirements/WEBVIEW.md:53`（F-A4 边界句） | 「`syncLive` 产者侧序缺陷在册」半句收正（**父侧笔**） |
| 6 | 台账 #133 / #135-④ | 本批落定后核销；#133 evidence 尾句「到期 = 该核侧改动批落定」随之勾销 |
| 7 | 批档 §6 | 收口 + 判据读数（C1–C6）落账 |
| 8 | `docs/vsc/design/WEBVIEW.md`（panel / agent 生命周期面——`_agent = null` 销毁点族同档 · `:285` 一带；评审 #2 登记） | 落一句「回合中面板槽被清 ⇒ 续跑迭代新建 agent（`agent.mjs:103`）＝**接受的行为变更**（活绑定下与 AC4 同向；口径 = §2.3）」 |

### 2.10 观察项（本批范围外，逐条附证据，**只报不动**）

1. **嵌套 sync 出生 token 归属**（静态链路推导，**未现场复现**）：`parseRelayPath` 的 `head` = **最外层**前缀（`thincoder-core/agent/relay-prefix.mjs:27`）⇒ 深度 >0 的 sync spawn 出生 token（形如 `eng-coder#2/explore#3/[model]x`，由 `wrapChildCallbacks` 链拼出）被 relay `[model]` 支（`panel-subagent-relay.mjs:99-104`）当作 **head 的 `started`** 发出，而 webview 的 `started` 分支**无「已出生」守卫**（`webview/activity.js:306-327`：无条件写 `status/pool/syncLive/startedAt/model`）⇒ 外层 async 块 meta 被重写：`pool` 可能翻 false、`startedAt` 重置、`model` 覆写 ⇒ 其 ⏹ 随之消失（门控 `activity-view.js:156`）。**面 = 显示面（本批禁）** ⇒ 建议归显示面批次登记；与 #133 不同根因（本条 = 归属，非序）。
2. **`[model]` 字面量两处同形**：`emitRelayModel`（本批落点）∥ async 支 `subagent-run.mjs:149`。async 支序已正确（池登记 `:186-187` 先于 `:147-149`）⇒ 本批**不动**；同形重复登记（#127 族），可随结构收口轮并。
3. **批档 §1 / 台账 #133 证据链与本席实读一致**（含「中间无 await」·「suspension 投影硬编码 false ⇒ 无第二载体」两条）——无相抵；仅两处「到期条件」措辞需随收口轮收正（#133 evidence 尾句 · F-A4 半句，已入 §2.9）。

### 2.11 修正轮 1（承 §3 评审 id=50 · 8 条逐号落地 · 2026-09-20 · eng-designer）

**依据** = 本档 §3 轮次 1 发现表（🔴 0 / 🟡 2 / 🔵 6 · VERDICT pass）+ 父侧逐条裁定：**8 条全接受 · 定点收正 · 不开新面**。
**形制** = 对应段**就地收正**（失效措辞即删——§2 面零修订式残句 · D8）+ 本块追加（`Suggestion` 列 = 处置建议；处置执行人 = 本席）。

| # | 处置 | 改动（本档 · 收正后 as-of） | 机检锚（§2 面 · 全 ASCII） | 预期读数（收正后 · 本块追加前） |
|---|---|---|---|---|
| 1 | 落（选项②结构机检） | §2.5 新增 T-S1e 行 `:112` · §2.7 C1 行 `:140` | `T-S1e` | 2 命中（`:112` · `:140`）；实现轮 `cd thincoder-vscode && node --test test/sync-block-stop.test.mjs` 先红 → 全绿 |
| 2 | 落（显式接受 + 登记为行为变更） | §2.3 新增段 `:86-94` · §2.9 新增 #8 行 `:168` | `existingAgent` | ≥1（`:92`——`agent.mjs:103` 口径句在位；`setupAgentRun` 同段） |
| 3 | 落 | §2.9 #3 行 `:163` | `:320` | ≥1（`:163`——收口轮「只校坐标」条在位） |
| 4 | 落 | §2.2 候选 A 行 `:52` | `331-369` ⇒ 0 · `366-370` ⇒ ≥1 | `331-369`：§2 面 0（余 `:185` = §3 评审引文 · 记录面）· `366-370`：1（`:52`） |
| 5 | 落 | §2.2 零回归面行 `:70` | `ctx.callbacks = {}` ⇒ 0 · `ctx.callbacks?.onToken` ⇒ ≥1 | 前者 §2 面 0 命中（余 `:186` = §3）· 收正句 `:70` 在位（`:65`/`:112` 为同族余量） |
| 6 | 落 | §2.2 候选 A 行 `:52` · 落点 3 行 `:66` | `+24~36` ⇒ ≥1 · `subagent.mjs:22` ⇒ ≥1 | `+24~36`：`:52`（口径句）；import 行补列 = `:66` |
| 7 | 落 | §2.7 C5 行 `:144` | `388/724/714` ⇒ 0 · `batch-record-commons.md:270` ⇒ ≥1 | 前者 §2 面 0 命中（余 `:188` = §3）· 兄弟批指针 `:144` 在位 |
| 8 | 落 | §2.7 A 行 `:136` | `A2 = ` ⇒ ≥1 | `:136` 在位（A2 回指 = 评审建议②注明式） |

**读法**：`findstr /n /c:"<锚>" docs\batches\2026-09-20-sync-reachability-batch.md` 逐锚（cmd.exe · 全 ASCII）；复算式 = `node -e "const s=require('fs').readFileSync('docs/batches/2026-09-20-sync-reachability-batch.md','utf8');['T-S1e','existingAgent','366-370','A2 = '].forEach(p=>console.log(p,s.split(p).length-1))"`。**注**：含 emoji 的行上 `findstr` 有假阴（`388/724/714` 一列两法读数不一 ⇒ 以 node 复算为准）；本块自身含同锚 ⇒ 复跑计数只增不减，判据 = 「0 命中」项保持 0。

**#1 选型记录（二择一 · ① 未采纳）**：① 真链形（mock provider 驱动真 `execute({async:false})` ⇒ 断言 `[model]` ∧ 载荷 `syncLive:true`）落点必在 `thincoder-vscode/test/integration/**`——**不在 `thincoder-vscode/test/files.mjs` 清单**（该档 = `npm test` 快层 / 全量层单一来源）⇒ 逃出 C1 命令与 C5 三包门；且行为半面已由 T-S1b 钉住（真 relay 闭包 ⇒ 载荷逐字），残口恰 = 「生产调用点是否 / 何时传入第 4 参」= ② 所断。② 随 C1 同档同命令执行（零新基建 · 零 provider 夹具 · 零子代理整跑），与本批机检形同族（T-B2 / T-S6 / T-HS11 先例）。**若父侧要① 兼收 ⇒ 另议（不夹带）。**

**#2 选型记录（二择一 · 「限定 setter 来源」未采纳）**：该备选挡不住读侧——置 null 由**直写面板字段**发生（不经 `bindPanelAgent`），且「面板槽 = 单源（产者 / 路由 / 循环三读同字段）」正是甲案本体 ⇒ 采**显式接受并登记**（§2.3 口径句 + §2.9 #8 落档面）。

**D8 自查**：§2 面四处失效措辞均以**替换式**落位、零残留（`331-369` · `ctx.callbacks = {}` · `388/724/714` · 「约 15 行」——收正后原串在 §2 面不再出现，见上表 0 命中项）；§2 面零删除线形态 · 零双写式；§3 内评审引文 = 记录面（他人段，未动）。

**C4（与 §2 已落面零相抵）**：8 条收正后重扫 §2.2 / §2.3 / §2.5 / §2.7 / §2.9——与 §2.1（覆盖表）· §2.4 · §2.6 · §2.8 零冲突；§2.6 行数与增量口径不因本轮改动（T-S1e 落 §2.5 既有测试档，文件级增量为 +35~55 内）。

**不一致处（本轮发现 · 逐条）**：

1. 产品码注释引 `AGENT-LOOP.md §11`（`thincoder-vscode/src/agent.mjs:97` 一带）——现档 `docs/core/design/AGENT-LOOP.md` **无 §11**（节次 1–8 + 变更记录）；该号现落归档档 `thincoder-vscode/docs/_archive/design/AGENT-LOOP.md:444`（「11. agent 生命周期对齐 CLI」）。= 注释陈旧指针（产品码面 · 独立小轮），本批**只报不动**。
2. A2 条原文不在档（任务书未随档）⇒ 按评审建议②注明于 `:136`；父侧如有原文，收口轮可就地校准。
3. §2.9 #8 的档面落点定 `docs/vsc/design/WEBVIEW.md`（`_agent = null` 销毁点族同档 · `:285` 一带）——**VSC agent 生命周期面在现行档树无独立节**（原 §11 随档归档）；收口轮若判另档更宜，就地改指（内容不变）。

**本修正轮不做**：实现面（产品码 / `scripts/**`）· 需求档 · §1 / §3 / §4–§6 他人段 · 设计档实体（§2.9 清单归收口轮）· 他批写域 · 8 条以外的收正（新增测试 / 新机制面 = 实现轮或另议）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Acceptance criteria | 🟡 | C1 的证据只夹逼「装配面不发射」（T-S1a）∧「arm 单点内登记后宣告」（T-S1b / T-S1d——announce 闭包由测试手写），**生产调用点接线**（`thincoder-core/agent-tools/subagent.mjs:329` 第 4 参是否/何时传入）零断言：T-B2 只机检 VSC 侧 `panel-turn-loop.mjs` 的 `bindPanelAgent(panel, ro)`。若实现轮漏传/错传第 4 参，`thincoder-vscode/test/sync-block-stop.test.mjs` 全绿 · `doc-check` 净增 0 · 三包全绿——实测全仓两测试树**无任何用例断言「真 sync spawn 产出的 `[model]`/`started` 载荷」**（`[model]` 面全为合成 token：`thincoder-cli/test/acp-channel.test.mjs:110` · `thincoder-vscode/test/activity-live-visibility.test.mjs:178`）——而届时 ⏹ 仍不可达 **且** CLI TUI sync 块出生 token 一并消失（§2.2 零回归面自述「CLI TUI 建块仍由 `[model]` 驱动」）。 | 追加一条生产路径断言（二选一，均可机判）：① 真链——先例 `thincoder-vscode/test/integration/host-shape-spawn.test.mjs:94` / `vsc-spawn-ctx-permission.test.mjs:116` 以 mock provider 驱动真 `subagentTool.execute({task, role, async:false})`，断言 callbacks 收到 ≥1 条 `[model]` 且载荷 `syncLive:true`；② 结构机检形——同档先例 T-B2 / T-S6 / `thincoder-cli/test/hooks-stop.test.mjs:251`（T-HS11）读 `subagent.mjs` 源断言 `armSyncChildAbort(` 第 4 参 = announce 闭包。 |
| 2 | Clarity | 🟡 | 甲案把 `ro` 的 `agent` 槽由「回合起快照」改为「⇄ `panel._agent` 活绑定」（§2.3 表 甲行），但未分析**回合中 `panel._agent` 被置 null 的路径**——`thincoder-vscode/src/extension/chat-panel.mjs:138` / `:247`（destroy）· `panel-session.mjs:113`（换会话）· `panel-project.mjs:42`（换项目）· `panel-chat.mjs:55`（槽不匹配）。活绑定下 ContinueError / Ctrl+I 续跑迭代重读 `ro.agent` = null ⇒ `thincoder-vscode/src/agent.mjs:103` `existingAgent = null` ⇒ **回合中新建 agent**（今日 = 续跑同一对象）；同句「语义 = 把『回合末同步』提前为『写回即同步』」读作零语义差。 | §2.3 补该窗口的语义口径（显式接受并登记为行为变更 / 或限定 setter 来源为 runAgent 写回路径），并写明续跑迭代取 null 时的预期行为（与 §11 单例复用面的关系）。 |
| 3 | Doc hygiene | 🔵 | §2.9 #3 只列 `docs/vsc/design/WEBVIEW.md` `:225-226` · `:250` · `:252`；同档 `:320` 同引 `thincoder-core/agent/spawn-child.mjs:77-82`——现盘 `makeRelay` 实际 span = `spawn-child.mjs:72-77`（坐标**今日已漂**），本批重构后 `makeRelay` 再下移 ⇒ 坐标继续漂（机制句「sync 取号 = `_subAgentCounter + 1`」本身仍成立）。 | 收口轮改写 `:250` 机制句时一并校 `:320` 的坐标（只校坐标，机制句免改）。 |
| 4 | Clarity | 🔵 | §2.2 候选 A 取舍栏「arm 与 disarm 仍同 try 域（`subagent.mjs:331-369`）」与码不符：arm 在 `:329`，`try` 自 `:331` 起，disarm 在 finally `:369`；实际不变量 = 「arm 之后每一出口经同一 finally 注销」（本身成立）。 | 措辞改「arm 之后全部出口经同一 finally 注销（`:366-370`）」。 |
| 5 | Clarity | 🔵 | §2.2 零回归面「各测试档传 `ctx.callbacks = {}`，本无发射断言」非逐档为真：`thincoder-vscode/test/integration/host-shape-spawn.test.mjs:87` · `vsc-autoapprove-field.test.mjs:76` 传 `{ onSubagent, onToolPanel }`（结论成立——两者均无 `onToken`，发射仍为 no-op）。 | 改述「各测试档 callbacks 无 `onToken`（`ctx.callbacks?.onToken` 恒 undefined ⇒ 发射 no-op）」。 |
| 6 | Clarity | 🔵 | §2.2 候选 A「改动 3 档约 15 行」与 §2.6 三行增量 +10~14 / +2~4 / +12~18（合计 +24~36）口径不一致；且 §2.2 三点落点清单未列 `thincoder-core/agent-tools/subagent.mjs:22` 新增 `emitRelayModel` import 行。 | 统一口径（注明「约 15 行」= 纯代码行、§2.6 含注释），落点清单补 import 行。 |
| 7 | Acceptance criteria | 🔵 | C5 基线「388/724/714 族」无 as-of，且与同日兄弟批读数不一致（`docs/batches/2026-09-20-batch-record-commons.md:270` = 核 395 / CLI 716 / VSC 731；`docs/batches/2026-09-20-display-parity-batch.md:900` = 核 401 / VSC 797）。 | 标 as-of，或改述「全绿（基线 = 实现轮实读）」。 |
| 8 | Requirements | 🔵 | §2.7 的 A1–A5 映射只回指 A1 / A3 / A4 / A5，**A2 未回指**——仅凭批档无法确认 A2 条目已被覆盖（任务书不在本评审范围：任务书原文 `unverified`）。 | 补一行 A2 回指，或注明「A2 = 本表（C1–C6 判据与命令）」。 |

**核验面（read-only）**：证据链逐条实读复算——`subagent-spawn.mjs:459` ∥ `subagent.mjs:329`（晚于 `:276`，其间无 await）· `spawn-child.mjs:72-77` · `panel-subagent-relay.mjs:77-79`/`:103` · `suspension.mjs:151-153` · `subagent.mjs:224`/`:222` · `panel-turn-loop.mjs:66`/`:161-163` · `agent.mjs:103`/`:110` · `hooks.mjs:95` · `subagent-run.mjs:186-187` 先于 `:147-149`（`entry.start` 闭包）· `relay-prefix.mjs:27` · `subagent-panel.mjs:123` · `activity-view.js:156` · `activity.js:321` · `transport-stdio.mjs:20` · 受影响文件表现行数 7/7 吻合（239 · 474 · 410 · 98 · 165 · 206 · 118）· 函数级 `buildSpawnChild` ≈230 行 < 300（文件级最大 474 → ~478 < 500）· §2.9 五处坐标四处逐字吻合。设计自记之实测墙钟（`duration_ms 11553` 等）本席**无执行面，未复跑**（按设计记录引用）；`T-HS8`「零真进程」由 `thincoder-cli/test/hooks-stop.test.mjs:8` 头注独立佐证；本项目无项目规范档与文档地图（`Document ownership` 判据按 Project Guide 降级执行）。

**计数**：🔴 0 · 🟡 2 · 🔵 6
VERDICT: pass

## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）

**状态行**：✅ 已实现（C1–C6 达标 · 审计 1 轮 · advisor 1 轮 pass · fix 1 轮）· 轮次 = initial · 2026-09-20

### 5.1 交付摘要（设计点 → 落点 · 实读行数）

| 设计点 | 落点（file:line） | Δ（实读） |
|---|---|---|
| §2.2 取号/发射两段拆分 | `thincoder-core/agent/spawn-child.mjs:75-97`（`allocRelay` :75 · `emitRelayModel` :84 · `makeRelay` 收窄为组合 :93） | 239 → 258（+19） |
| §2.2 sync 装配面只取号 | `thincoder-core/agent-tools/subagent-spawn.mjs:459-465`（`allocRelay(parent, role ?? "sub")`）+ import 面换 `allocRelay` :17 | 474 → 478（+4） |
| §2.2 宣告内聚进 arm 单点 | `thincoder-core/agent-tools/subagent.mjs:71-84`（`announce` 尾参 :71 · 登记→宣告 :78-83）+ 阻塞路径第 4 参 :336 + import :22 | 410 → 419（+9） |
| §2.3 首回合盲窗（甲案） | `thincoder-vscode/src/extension/panel-turn-loop.mjs:54-61`（`bindPanelAgent` 导出）· `:102` 接入 · `:183` 回合末写回幂等保留 | 165 → 184（+19） |
| §2.4 守卫定时器 | `thincoder-core/hooks.mjs:59-106`（句柄捕获 :61 · `done` 内 `clearTimeout` :65 · guard :98-106） | 98 → 108（+10） |
| §2.5 真序夹具 + 接线机检 | `thincoder-vscode/test/sync-block-stop.test.mjs:103-200`（T-S1a/b/c/d/e · T-B1/B2）· 头注收正 :1-22 | 206 → 305（+99） |
| §2.6 清单注收正 | `thincoder-vscode/test/files.mjs:111` | 118 → 117（±1 内） |

**零改面复核**：X10 三条（`activity-view.js` / `panel-messages-turn.mjs` / `suspension.mjs`）· `panel-subagent-relay.mjs` · `webview/**` · i18n · `thincoder-cli/src/**` · `scripts/**` · 设计档 / 需求档 —— 全零改（`git status` 未列本批 7 档以外任何文件）；`makeRelay` 另两调用点（`subagent-actions.mjs:392` · `consult.mjs:292`）与 async 支 `[model]` 发射（`subagent-run.mjs:149`）零改；CLI 直驱 `armSyncChildAbort` 三参调用（`sync-cancel.test.mjs` / `abort-provenance.test.mjs`）零改（第 4 参缺省）。

### 5.2 先红后绿（本席实测读数）

| 判据 | 先红 | 后绿 |
|---|---|---|
| C1 `cd thincoder-vscode && node --test test/sync-block-stop.test.mjs` | **6 pass / 6 fail**（T-S1a「装配面发 1 条 `[model]`」· T-S1b「注册表宣告时刻 = null」· T-S1d「零载荷」· T-S1e「零命中」· T-B1「helper 不存在」· T-B2「零接入」；duration_ms 1476.1） | **12 pass / 0 fail**（duration_ms 1454.0；fix 轮后复跑 2106.9） |
| C2 T-HS8（墙钟） | duration_ms **11262.5**（设计记录 11553） | duration_ms **777.8** |
| C3 T-HS10（墙钟） | duration_ms **11258.9**（设计记录 11726） | duration_ms **523.4** |
| C4 VSC `lifecycle-hooks` | 设计记录 13712 / 墙钟 ≈14.3s（本席未复测先红） | duration_ms **1542.7**（11 pass / 0 fail） |
| C5 三包 | 基线（同批实读）435 / 738 / 839 | **core 435/435 · CLI 738/738 · VSC 839/839（0 fail）** |
| C6 `node scripts/doc-check.mjs --root .` | — | 锚悬空 2 · 行宽 1 —— **全为他批在途面**（`docs/core/design/MODEL-SPECS.md:725/:727` = 未跟踪新档 · `docs/core/design/CORE-UNIFICATION.md:1787`）；本批 `docs/**` 零改动（§5 本段落盘后复跑确认）⇒ **净增 0** |

**先红后绿路径留痕**：① 升级测试档 → ② 落最小占位（`spawn-child.mjs` 两叶导出——翻零断言）→ ③ 跑 C1 得**断言级红**（上表逐条）→ ④ 落实现（三核档 + VSC 绑定 + 定时器）→ ⑤ 复跑 C1 全绿；定时器面（C2/C3）先红在实现前独立实测。

### 5.3 决策透明表（偏离 / 自主决定）

| # | 事项 | 依据 | 处置 |
|---|---|---|---|
| 1 | **`hooks.mjs` 扩展**：删 `spawn` 的 `timeout` 选项，超时杀子改由自有 guard 承担（`hooks.mjs:71-85` · `:98-106`） | §2.4 判「挂因 = 守卫定时器本身」并以探针「排除 `child_process` 的 `timeout` 选项内部定时器」 | **实测推翻前提**：ENOENT + `timeout:10000` ⇒ 10023ms 退（同形去该选项 ⇒ 6ms；`proc.kill()` 释放无效）；仅 unref 落盘后 T-HS8 仍 10493ms（C2 <2000 不达标）⇒ 在**唯一落点 `hooks.mjs` 内**收口（§2.8 边界内）；语义面 = 同时点（`timeout` ms）· 同默认信号（SIGTERM）· 同时限放行；已 `notify_parent` 前置披露 |
| 2 | `armSyncChildAbort` 宣告**包异常自清**（`subagent.mjs:78-83`） | advisor 🟡#2 | `registry.set` + `announce?.()` 落在调用方 `try`（:338）之外 ⇒ 宣告抛错则条目永久残留（改序新引入）；改 `try { announce?.() } catch (e) { registry.delete(key); throw e }`（保留上抛语义、闭合泄漏窗） |
| 3 | T-S1e 次序判据改「先剥整行注释再归一」 | §2.5 T-S1e | 复核轮实测：注释插入即令原断言假红 ⇒ `flat()` = 剥 `//` 整行注释 + 坍缩空白（判据强度不变、抗注释插拔） |
| 4 | `panel-turn-loop.mjs:82` 补半句注 | advisor 🔵#7 | 该行初值立即被 `bindPanelAgent` 访问器取代（仅保键序）——注明防后手误当有效快照；零行为 |

### 5.4 审计与代码评审（轮次与终态）

| 面 | 轮次 | 结论 |
|---|---|---|
| 内部偏差审计（explore · 只读） | 1 | PARTIAL / SILENT-SIMPLIFICATION / OUT-OF-LIST = **0**；DOC-DRIFT ×1（= 本表 #1 的文档面，§2 归设计席写域）⇒ 处置 = 披露（本段）+ 上抛（5.5 #1） |
| advisor（type=code · 7 档 + 本档 §2） | 1 | 🟡 3 · 🔵 4 · **VERDICT pass**（无 🔴）；🟡#2 → 本表 #2 已收 · 🔵#7 → 本表 #4 已收 · 🟡#1 = 5.5 #1（文档面）· 🟡#3 / 🔵#4/#5/#6 = 建议 / 登记项（5.5 #2–#4） |
| fix 轮 | 1（≤5） | 收 #2/#3/#4 ⇒ 复跑 C1 12/12 · 三包全绿（435 / 738 / 839） |

**终态：clean**（代码面 0 未决；1 项文档面义务 + 4 项建议已上抛，见 5.5）。

### 5.5 上抛项（父侧 / 设计席 / 后续批）

1. **§2.4 机制句收正**（设计席写域）：挂因 = 双持有者（守卫定时器 ∥ `spawn` `timeout` 选项内部定时器）；修法 = unref + `done` 收尾 `clearTimeout` + 不传 `spawn` `timeout` 选项。档面若保留「已排除该选项」，后手可能回填该选项 ⇒ 尾挂复发（10023ms 实测为证）。
2. **§2.6 增量列收正**（收口轮）：实读 vs 预测 —— `spawn-child.mjs` +19（预测 +10~14）· `subagent.mjs` +9（+12~18）· `hooks.mjs` +10（+3~5）· `panel-turn-loop.mjs` +19（+6~10）· 测试档 +99（+35~55）；`subagent-spawn.mjs` +4 与 `files.mjs` ±0 落带。
3. **300 行 advisory**：`subagent-spawn.mjs` 478 · `subagent.mjs` 419 · `sync-block-stop.test.mjs` 305（本批新越线）——建议另批把真序夹具析出为独立测试档（双登记），两源档随结构收口轮并。
4. **零尾挂无自动护栏**：C2/C3 为手工墙钟读数；建议另批加「钩子失败/悬挂路径下宿主进程及时退出」的子进程判据（宽裕上界，避近界墙钟断言）。
5. **§2.9 收口清单连带**：`spawn-child.mjs` 相关坐标随本批重构整体下移（`makeRelay` span 现 = `:88-97`；`allocRelay` :75 / `emitRelayModel` :84 为新面）——`AGENT-LOOP.md:185` 功能列、`WEBVIEW.md:250`/`:320` 三处收口轮按新坐标落笔。

**C6 复跑补记（§5 落盘后 · 2026-09-20）**：`cd D:\teamcode\thincoder && node scripts/doc-check.mjs --root .` 复跑 = `OK(锚): 0 条悬空（闸态——阈值 0）` · `OK(行宽): 源域全部 .md 无 >300 字符单行。`（含本 §5 全段）——5.2 表 C6 行记的「悬空 2 · 行宽 1」= 他批在途瞬时读数（`MODEL-SPECS.md` 未跟踪新档 / `CORE-UNIFICATION.md:1787`），该两处随他批落定已归零；**本批净增 0 结论不变（现为绝对 0/0）**。

## §6 验证与收口（父代理）
