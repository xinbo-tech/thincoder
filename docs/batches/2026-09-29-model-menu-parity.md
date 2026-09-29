# 2026-09-29 · model-menu-parity
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-29 · 来源 = 用户走查报障「桌面模型选择器一级 provider 只有一个（应为全部配置渠道——VSC 已做好）」+ #165 只读诊断（根因 = 全渠扇出面整层缺）。
> 台账 = #595（desktop · 立批）。前情 = 用户真机走查（2026-09-29 12:17）+ 诊断轮 #165 根因链。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-29

### 1.1 报障与根因（父侧 · 2026-09-29）

用户走查（12:17）：桌面模型选择器一级 provider 只有一个；VSC 同面 = 全部配置渠道。**诊断（#165）根因链**：桌面 `renderer/composer-sync.mjs:151-172` 仅以活动渠道调 `model:list`（`:159`）；VSC 对位 = 全渠道探测窗口（`provider-probe-window.mjs` + `settings.mjs:387-401` `fullStatus`）——桌面整层缺；菜单本体 = 核件（两端同件，按载荷 distinct provider 聚合 ⇒ 一渠一行）。**自认在册**：`composer-sync.mjs:152` 注释「端差登记……未入台账」= 漏网原因。

### 1.2 修法方向（父侧预钉 · 设计轮裁形）

- 扇出补层：**A 案主进程侧**（结构对位 VSC——倾向）∥ **B 案渲染面**——设计轮裁，给由；核件零改；**假修否决在册**（只拼 `provider:list` 单值 = 把缺陷挪二级）。
- 碰撞面（设计轮必核）：`ipc.mjs` ∕ `ipc-registry.mjs` ∕ `preload.cjs`（B10 W2/W3 同体档——调度串行）；`model:list` 语义扩 = 触 B8 IPC 载荷契约批射程 ⇒ 择形须核。
- 回传两条（诊断轮）：① B10 **S10**「是否复用核件两级菜单」实施轮择一须先拿本批扇出结论；② 若走新通道，上述三档不可与 B10 W2/W3 并行（调度器串行）。

### 1.3 验收面预钉

- 口径 = 用户走查原话「一级 = 全部配置渠道」；判据 = 逐渠实读 + 真机读数（父侧闭合）；CLI 同面（若存）= 设计轮勘察列报。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（2026-09-29 —— 选案 A（主进程扇出）+ 新通道 model:catalog；评审 #170（pass）后七条裁定点修已落（修正轮 1）；W3 文档轮四档落定（IPC.md ∕ UI.md ∕ PROJECT.md ∕ E2E-TESTING.md——逐处见 §2.13）；设计就绪）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.0 交付形态与口径（设计轮 · 零实施）

- **本批 = 设计轮（评审就绪）**：交付物 = 本节自持（逐案裁定 ∕ 扇出数据面 ∕ 切片形 ∕ 刷新触发 ∕ 改动面 ∕ 验收 ∕ 碰撞面）；**持久契约落点** = `docs/desktop/design/IPC.md`（新通道行 + 计数 + `ev:config` 消费句）· `UI.md`（输入区行候选面句）· `PROJECT.md`（§4.1 行数随动 ∕ §4.2 本批行 ∕ 变更记录）——**逐处随实施轮落**（先例 = parity-b8 §2.0）；本设计轮零产品码 ∕ 零文档面笔。
- **纪律**：核件（`thincoder-render-core/**`）**零改**（菜单本体按载荷 distinct provider 聚合——`thincoder-render-core/composer/model-menu.mjs:96-104` 逐字不动）；`thincoder-vscode/**` 零触（对位实盘 = 参照）；`model:list` 回执**契约形零变**。
- **行数口径**：本节所引行数 = `find /c /v ""`（as-of 2026-09-29 本轮实读）；相关档存在并行编辑面（B10 ∕ B8 等在飞）⇒ 实施轮落笔前按「实读定格」纪律复读坐标（先例 = parity-b8 §3 轮 2 行 10）。

### 2.1 本批条目（覆盖）与边界

- **覆盖** = 台账 **#595**（用户走查 2026-09-29 12:17：桌面模型选择器一级 provider 只有一个——应为全部配置渠道，对位 VSC）+ §1.1 根因链（全渠扇出面整层缺）收正。
- **收正项**：① 扇出补层（主进程—渲染面全链）；② 失败渠诊断面（对位 VSC `unavailable` 口径）；③ 候选切片形收正（`forProvider` 失义）；④ 刷新触发面（含**会话切换随动**缺口收正——见 2.5 #5）。
- **不做（边界）**：实施；核件改动；VSC 侧改动；`model:list` 契约形改动；会话头 ∕ 设置面模型候选面语义（仍单渠——语义正确：渠-模复合）；设置面渠道行可用性标（= B10 S3 面，跨批具名）；`provider:list` 载荷（B10 S3 面）；测试树重建（全清令口径）。

### 2.2 逐案裁定（选案 + 判据 + 被否案）

**第一层：扇出面归属 —— A 主进程扇出 ∥ B 渲染面扇出 ⇒ 取 A**

| 判据 | A 主进程扇出 | B 渲染面扇出 |
|---|---|---|
| 对位 VSC 结构 | ✅ 探针窗口族住宿主面（`thincoder-vscode/src/extension/provider-probe-window.mjs` 全族 + `settings.mjs:380-408` `fullStatus`；webview 零探针） | ✗ 与 VSC 结构反（渲染面自持调度 ∕ 在飞 ∕ 重探） |
| 往返数 | 1 次 | 1+N 次（`provider:list` + 逐渠 `model:list`） |
| 密钥面 | 零入渲染面（沿用现状） | 同——但逐渠多次外呼 |
| 失败 ∕ 代理口径 | 核探针单源（`probeChannelModels`：代理规则 + 落账） | 沿 `model:list` 现状（不过代理、不落账）⇒ 对位缺口续存 |
| 碰撞面 | 触主进程四档（B10 W2/W3 同体 ⇒ 串行——登记 2.9） | 零通道面——但结构 ∕ 口径两面劣 |

**第二层：A 内通道形 —— 扩 `model:list` 语义 ∥ 新通道 ⇒ 取新通道 `model:catalog`**

| 判据 | 扩 `model:list` | 新通道 |
|---|---|---|
| 契约面 | 既有行须重写（B8 §2.2 #19 已评审在册——`docs/batches/2026-09-29-parity-b8-ipc.md:108`） | **纯增行**（#19 零动） |
| 回执形 | 双形（`{models}` ∥ `{models, unavailable}`）⇒ 消费面守卫面增 | 单形 |
| 语义 | 一通道两操作，且两形探针语义相斥（单渠形 = 现状裸径 ∥ 全渠形 = 核探针径） | 操作单一（全渠扇出） |
| 既有三消费者 | `renderer/mount-head.mjs:81` ∕ `mount-settings-reads.mjs:78` ∕ `mount-settings-segments-models.mjs:97/:118`——无必要改变（恒传 `provider`） | 零影响 |
| 失败诊断 | 双形分叉 | 天然承载 `unavailable` |
| 计数 | 零动 | 38⇒39（B10 另 +6 ⇒ 后落者随动——登记 2.9） |

**被否案（在册）**：③ **假修**（§1.2 已否决）：只把 `provider:list` 单值名拼进一级、二级无模型 ⇒ 缺陷挪位（二级空）——零采纳。

### 2.3 扇出数据面设计（`model:catalog` · 单源）

- **通道**：`model:catalog`（无载荷）⇒ `{ ok: true, models: [{ provider, id, effortEnum, thinkOff }], unavailable: [{ provider, reason }] }`。
- **取数**（主进程 · 处理体住 `thincoder-desktop/src/main/settings.mjs`，`modelList` `:107-118` 邻位）：`resolveProviders().providers`（核 `thincoder-core/config-io.mjs:146-166`）**滤 `hasKey`**（key 非空——对位 VSC `isProviderConfigured`：条目在 ∧ key 可解析，`thincoder-vscode/src/extension/presets.mjs:26-40`）⇒ 逐渠 `probeChannelModels(name, probeTargetOf(entry))`（核单源 —— `thincoder-core/provider/list-models.mjs:149-163` ∕ `thincoder-core/provider-flows.mjs:79-90`：探 `GET /models` + **落账** + 失败消息逐字）⇒ `Promise.allSettled` 并发（对位 VSC `_probeBatch` —— `provider-probe-window.mjs:83-90`）；逐项经 `modelEntry` 投影（`settings.mjs:95-98` 复用）+ 渠名注入。
- **序**：rows = 渠（配置序）× 渠内（核 `listModels` 已排序 —— `list-models.mjs:104`）；`unavailable` 同序 ⇒ 菜单一级行序 = 配置序（核件按首次出现聚合 —— `model-menu.mjs:96-101`）。
- **失败 ∕ 空表口径（对位 VSC 逐点）**：
  - 探不通渠 ⇒ **零行** + `unavailable` 项（`reason` = 核 `channelUnavailableMessage` **逐字长句**（**非闭集码**——对照 `provider:verify` 的码形 `docs/desktop/design/IPC.md:242`：码供分支 ∕ 本值供显示；分支面另有落账 `failure`）；「模型清单注」逐字注明 = W3 #11 —— `list-models.mjs:109-112`；VSC M8 同源）；
  - 探通零模型渠 ⇒ 零行 ∧ **不落** `unavailable`；
  - 无已配渠 ⇒ `{ok:true, models:[], unavailable:[]}` —— 渲染面**零推送**（VSC `fullStatus` anyKey 早退对位 —— `settings.mjs:383-384`）；
  - 全渠失败 ⇒ `models:[]` + `unavailable` 全项 —— **照推**（VSC `flush` 对位 —— `settings.mjs:389-403`）；
  - 整档不可读（`loadRaw` 抛）⇒ invoke 拒绝直传（「畸形档不吞」—— 判例同 `src/main/providers.mjs:72`）。
- **落账**：逐渠探入经 `probeChannelModels` ⇒ 核 `recordAdmission`（VSC `_probeChannelInto:58-80` 同径：成功清失败 ∕ 失败记 `{reason, failure}`）；`failure` = 核 `classifyProbeFailure`（`timeout` ∕ `malformed` —— `list-models.mjs:125-129`）；**`hostBusy` 档不产**（桌面无宿主采样器 —— R8 已裁同判：`hostBusyOverride` 缺省 null = 核零宿主事件循环观测，`thincoder-core/provider-flows.mjs:16-17 ∕ :98-105`）——端差登记（有由：能力缺失，非静默）。
- **单探针径对齐（同批附带件 · 可裁 —— 见 2.8 U1）**：`modelList`（`settings.mjs:107-118`）现径 = 裸 `listModels(provider)` —— **不过代理**（`resolveProviders` 不产 `proxyUri`；核判据 `list-models.mjs:31`；旁证：`provider:verify` 走 `probeTargetOf` 已过代理 —— `providers.mjs:152-158`）且不落账；改为同径（`probeChannelModels` + `probeTargetOf`）⇒ 逐渠探针**单源 ∕ 代理 ∕ 落账三面一致**（**回执形逐字零变**）。
- **菜单侧**：核件零改 —— 本批只把载荷补成全渠（菜单本体一渠一行聚合逻辑零动）。
- **可见失败面（跨批具名）**：VSC 的可见失败说明 = providerStatus 行（`不可用` ∕ 宿主繁忙 + reason —— `settings.mjs:124-125`）；桌面行标 = **B10 S3 面**（`docs/batches/2026-09-29-parity-b10-ui.md:123`，读核落账 `admissionOf`）——本批落账使其可读；本批**零渲染消费**（菜单不显失败渠 = VSC 同行为；**不造**菜单内失败行——VSC 无对位）。

### 2.4 切片形决策（`forProvider` 失义 ⇒ 裁形）

- **现形**（`thincoder-desktop/renderer/store.mjs:62-65` ∕ `:88` ∕ `:212-221`）：`modelCandidates: { forProvider, models }` + 纯动作 `setModelCandidates(state, provider, models)` —— `forProvider` = 单渠相位标记；扇出后**失义**（载荷跨渠）。
- **裁**：切片 = `{ models, unavailable }`；纯动作 `setModelCandidates(state, models, unavailable)`（回原态判据沿旧式保守：两者同引用才回原态）。
- **核件读面零改**：读键 `.models` 保持（`model-menu.mjs:284` ∕ `composer-sync.mjs:96`）；切片消费面唯一 = `composer-sync.mjs`（本批同改）——
- **`unavailable` 入切片**（同写点数据完整）：现时视图零消费（诊断主载 = 核落账 + 控制台零静默）；后续设置 ∕ 诊断面可读 —— 恒数组（禁假造）。

### 2.5 刷新触发设计（六径）

| # | 触发 | 动作 | 依据 ∕ 接线 |
|---|---|---|---|
| 1 | 装配首次随动（`syncPanel` 首跑） | 取（一次） | VSC 面板 boot `fullStatus`（`panel-session.mjs:310`） |
| 2 | `ev:config`（外部写盘；自写抑制） | 重取 | R8 既有窄口（`IPC.md:36`）；接线 = `renderer/app.mjs:234` `onConfig` 增线 |
| 3 | 设置面 provider 写成功（`provider:save` ∕ `provider:remove` —— 含首启向导同路 `exits.handlers.onSubmit`） | 重取 | VSC 写径后 `_pushSettings`（`panel-messages-settings.mjs:60-98`）；接线 = `createExits` 新 dep `onProvidersChanged`（`mount-settings-exits.mjs:57-59` 注入面；调用点 `:107` ∕ `:137` 后） |
| 4 | 收据 `unavailable` 非空 ⇒ 有界重探链（≤2 轮 ∕ 2s 步进） | 重取；**改善才再推**（`unavailable` 减 ∨ `models` 增） | VSC `_retryFailed`（`provider-probe-window.mjs:103-122`）；无忙让位（无采样器——登记） |
| 5 | 会话切换 ∕ 活动 meta 变（同渠） | **重推缓存 + 新 prefs**（零取数） | VSC MODEL-MERGE-SESSION（`panel-session.mjs:157-170` F-4）——**桌面现缺**（端差收正：`composer-sync.mjs:155-157` 闸致同渠切换零重推 ⇒ 模型钮停前会话值；违反需求 §3.1:51「切会话即随之切换」） |
| 6 | 无已配渠（`models` 空 ∧ `unavailable` 空）——**含「已配渠集 → 空」转移**（#3 `provider:remove` 至无渠，会话内可达；旧行驻留至下一有效推送 = 有意边界） | 零推送（菜单保持现状——沿 VSC 对位：`thincoder-vscode/src/extension/settings.mjs` anyKey 早退 `:383-384` ∕ 「避免空表清下拉」`:361-363`） | VSC anyKey 早退对位 |

- **在飞竞态**：取数带单调 `seq`；响应落地复核 `seq` 未变才写 ∕ 才推（替代原「活动渠复核」闸 — `composer-sync.mjs:153-154 ∕ :160-164`）；在飞期新触发 ⇒ 记位标、落定后补一轮（单飞 + 尾随一轮）。
- **重探链**：链不叠；新取数 ∕ 强制刷新 ⇒ 旧链终止；重取粒度 = **整渠**（非失败子集——内部成本差、非用户可见；登记）；延迟测试缝可注入（沿 VSC `_setProbeRetryDelayForTest:22-23`）。
- **回写备注**：#5 重推 ⇒ 核件 `applyModels` 命中径同值回写（`selectModel` ∕ `selectReasoning` —— `model-menu.mjs:407-411`，忙态门内）—— **已裁同径**（VSC F-4：「prefs 载具带槽复合」）；核件零改。
- **强制刷新口**：`composer-sync` 出 `refreshCandidates()`（供 #2 ∕ #3 接线；`mount-composer.mjs:242` 导出面透传）；在飞期调用 = 位标语义。

### 2.6 受影响文件（实施轮 · 行数 = 本轮实读）+ 测试面

**主进程（W1）**：

| # | 档 | 现读 | 改动点（file:line） | 增量 |
|---|---|---|---|---|
| 1 | `thincoder-desktop/src/main/settings.mjs` | 222 | `modelCatalog()` 新处理器（`modelList` `:107-118` 邻位）+ `modelList` 探针径对齐（`:113-117` 三行级 + import 行）+ 头注随动 | ≈+38（⇒ ≈260） |
| 2 | `thincoder-desktop/src/main/ipc.mjs` | 298 | `modelCatalogChannel` 转口（`modelListChannel:284` 邻位）+ 头注 | ≈+5（⇒ ≈303——**越 300 顾问线** ⇒ 拆分预案 = 在册「按面拆分」句（`docs/desktop/design/PROJECT.md:155`）· 登记落点 = §4.1 越层 ∕ 贴层登记（W3 #13）；与 B10 同档累计越线 ⇒ 后落者随动重登记） |
| 3 | `thincoder-desktop/src/main/ipc-registry.mjs` | 77 | import 列（`:19-22` 区）+ `HANDLERS` 行（`:44` 邻位）+ 表头计数句 | ≈+3 |
| 4 | `thincoder-desktop/src/preload/preload.cjs` | 70 | `CHANNELS` 末位 +1（`:34` 后）+ 表头计数句「三十八项」⇒ 三十九 + 定序句（`:15-20`） | ≈+3 |

**渲染面（W2）**：

| # | 档 | 现读 | 改动点（file:line） | 增量 |
|---|---|---|---|---|
| 5 | `renderer/composer-sync.mjs` | 188 | 候选面重写（`:151-172`）：扇出取数 + `seq` 复核 + 重探链 + 会话切换重推 + `refreshCandidates` 导出；**同笔删 `:152` 端差登记注**（修订式表达禁留——该端差本批闭合） | ≈+55（⇒ ≈243） |
| 6 | `renderer/store.mjs` | 298 | 切片形 ∕ 注释（`:62-65`）· 初态（`:88`）· 纯动作（`:212-221`） | ≤±6（**贴 300 层**——消解窗口 = 本批（结构性触碰）：越线 ⇒ 落拆分预案 ∕ 回线内 ⇒ 读数随动；落点 = §4.1 贴层登记（W3 #13）） |
| 7 | `renderer/mount-composer.mjs` | 243 | `refreshCandidates` 透传导出（`:242` 导出面）+ 注释 | ≤+4 |
| 8 | `renderer/mount-settings.mjs` | 151 | `onProvidersChanged` 注入转口（deps `:47-49` 区 + `createExits` 调用 `:101-104`） | ≤+3 |
| 9 | `renderer/mount-settings-exits.mjs` | 274 | deps 解构（`:58`）+ 两写成功点调用（`:107` ∕ `:137` 后，1 行级 ×2） | ≤+5 |
| 10 | `renderer/app.mjs` | 269（复制面对齐批落值——承该批预估「276 ⇒ ≈268」之实测现值；`PROJECT.md` §4.1 旧标 276 待该批回填轮收正） | `onConfig` 增线（`:234`）+ `attachSettings` deps 增键（`:64`）+ 注释 | ≤+6 |

**文档随动（W3 · 设计笔 · 随实施轮）**：

| # | 档 | 现读 | 改动点 | 增量 |
|---|---|---|---|---|
| 11 | `docs/desktop/design/IPC.md` | 380 | §2 表增 `model:catalog` 行 + 「模型清单注」块；白名单面「已实给 38 项」⇒ 39 + 位次 39 行（`:137-149`）；`ev:config` 行消费句扩（`:36` —— 增「渲染面输入面板候选面复读」）；**档头 ipc.mjs 计数随动**（294 ⇒ 298 实读现值 ⇒ 实施后同随本批 ≈303——先例 `IPC.md:373`） | ≤+30 |
| 12 | `docs/desktop/design/UI.md` | 666 | 输入区行（`:20`）增候选面句（模型钮一级 = 全渠 ∕ 失败渠零行 ∕ 触发指针） | ≤+6 |
| 13 | `docs/desktop/design/PROJECT.md` | 1177 | §4.1 **越层 ∕ 贴层登记**（`ipc.mjs` **新越层**：298 ⇒ ≈303 + 拆分预案引在册「按面拆分」句（`:155`）∕ `store.mjs` 贴层 298 消解窗口（本批））+ 行数随动 · §2 增 **KD-44–KD-46**（承 §2.8 KD-1–KD-3）· §6.1 **D6** 行随拍 · §7 增本批用例行（**R1–R7**）· §10 增 **BZ–CB**（U1–U3）· §4.2 本批行 · 变更记录 | ≤+40 |
| 14 | `docs/desktop/design/E2E-TESTING.md` | 266 | §6 用例表增本批行（**R1–R7**——桌面 + VSC 同配置对拍）+ 按批读注；§4 行随建（集成档实建 ⇒ +1） | ≤+15 |

> **切片 owner 档核（承 §3 轮次 1 发现 4）**：`modelCandidates` 切片形**无对位档**——实核 `docs/desktop/design/RENDERER.md`（§1 单状态树行）：`modelCandidates` ∕ `forProvider` 零命中（as-of 2026-09-29）；render-core 侧 = `docs/render-core/design/RENDER-CORE.md` 同零命中（派单所举 `docs/render-core/design/RENDERER.md` 不存在）⇒ 无对位 · W3 零随动。

**测试面**：批次本地件（新）`docs/batches/2026-09-29-model-menu-parity.test.mjs`（0 → ≈80–120）：① handler 面（核 `_setProbeImplForTest` 桩 + 临时 config：渠滤 ∕ 行形 ∕ 序 ∕ `unavailable` ∕ 落账 `admissionOf`）；② store 纯动作（两键形 ∕ 引用判据）；③ 触发链（**缝 = `createComposerSync` 注入式工厂**：探针 ∕ 重探延时（同形先例 VSC `_setProbeRetryDelayForTest:22-23`）∕ 时钟经 deps 注入——**缺省回退 = 生产径**；断言 = 取数计数 ∕ `seq` 丢弃 ∕ 重推 ∕ 六径有界；**不可装载 ⇒ 回退载体 = 真机 R5 ∕ R6**）。**落点提示**：子代理写 `docs/batches/*.test.mjs` 触写门（#545 在册）⇒ 先落 `.thincoder/tmp/`、父侧转正。现测试树 = 基建三档（`test/files.mjs` ∕ `rc-resolve.mjs` ∕ `run.mjs`）——无在位产品件需同改（零回归面）。

**零改面（备核 —— 勿误改）**：`thincoder-render-core/**`（菜单 ∕ panel ∕ 样式）· `renderer/mount-head.mjs`（155——头面候选 = 现行渠语义正确）· `renderer/mount-settings-reads.mjs`（189）· `renderer/mount-settings-segments-models.mjs`（169——恒传 provider）· `renderer/composer-wire.mjs`（176）· `src/main/providers.mjs`（195）· `thincoder-vscode/**` · `thincoder-core/**`（只用既有导出：`probeChannelModels` ∕ `probeTargetOf` ∕ `resolveProviders` ∕ `specForModel` ∕ `thinkOffPath`）。

### 2.7 验收对照（回指本批条目 · 可机检 + 真机）

- **AC1（★ 用户口径机检）**：一级行数 = 配置渠数 —— 全渠探通前提下，模型载荷 distinct provider 数 = 已配（有 key）渠数，且一渠一行。**判据全式**：有 key ∧ 探通 ⇒ 行 ∕ 探不通 ⇒ 零行（`unavailable` 在册）∥ 零 key ⇒ 零行——三端分歧（桌面 = 有 key 滤 ∕ CLI = 全 providers 含 `(no key)` ∕ VSC = `isProviderConfigured`）为**有意端差**，随 U3 一并裁。[机检 = 批内件 handler 面断言；真机 = R1]
- **AC2**：失败渠 = 零行 ∧ `unavailable` 逐字（`channelUnavailableMessage`）∧ 落账 `admissionOf(name).ok === false`。[批内件（桩探针）+ R3]
- **AC3**：行序 = 配置序（渠）× 核排序（渠内）。[批内件]
- **AC4**：无已配渠 ⇒ 零推送（菜单不空清 —— 现态保持）；**含「已配渠集 → 空」转移**（旧行驻留 = 有意边界——VSC 对位；AC1 判据射程 = 推送生效拍）。[批内件：推送计数（无渠 ∕ 集转空两态）；真机 = R7]
- **AC5**：会话切换（同渠）⇒ 重推缓存 + 新 prefs ⇒ 模型钮随会话。[批内件 + R4]
- **AC6**：触发六径各有界（#1 恰一次 ∕ #2 ∕ #3 恰一取 ∕ #4 ≤2 轮 ∕ #5 零取数 ∕ #6 零推送）。[批内件：调用计数（缝 = `createComposerSync` 注入 ∕ 缺省回退）；不可装载 ⇒ 回退载体 = R5 ∕ R6]
- **AC7**：核件零改（`git diff thincoder-render-core` 空——**前提 = 实施环境 git 可得**〔本仓 as-of 2026-09-29 实测可得；评审环境曾报「无 git 仓」⇒ 明写〕；不可得 ⇒ 载体改述 = 核件目录清单 + 内容哈希抽核对账）∧ `model:list` 回执形逐字零变（对照 `settings.mjs:107-118` 现形）。
- **AC8**：跨端集合对照（R2）。
- **真机条目（父侧收口 · 桌面 + VSC 同配置对拍）**：
  - **R1** 配 ≥2 有 key 渠（含自定义）⇒ 菜单一级行数 = 渠数 ∧ 行序 = 配置序 ∧ 每渠悬停列模型 ∧ 选取 ⇒ 槽写生效（跨端同槽复核）。
  - **R2** 同 config ⇒ 桌面一级行集合 = VSC 一级行集合（集合相等）。
  - **R3** 一渠 key 作废 ⇒ 该渠零行、零崩、控制台零静默（核落账失败项在）。
  - **R4** 会话 A/B 同渠不同模型 ⇒ 切换后模型钮随会话（同值回写不报错）。
  - **R5** 外部改 config（CLI 加渠）⇒ 菜单随现（免重启）。
  - **R6** 设置面加渠 ⇒ 回输入区 ⇒ 菜单随现（免重启）。
  - **R7** 已配渠全删（设置面逐渠删至零）⇒ 菜单保持现状（旧行驻留——有意边界；零崩、控制台零静默）；重新配渠 ⇒ 随推送复现（免重启）。

### 2.8 关键决策（KD）与上抛（U）

- **KD-1 · 扇出面 = 主进程（A 案）**：结构对位 VSC + 单次往返 + 探针 ∕ 代理 ∕ 落账单源。被否：B 案渲染面扇出（结构反 ∕ N 次往返 ∕ 口径缺口续存）。
- **KD-2 · 新通道 `model:catalog`**（不扩 `model:list`）：契约纯增（B8 #19 行零动）∥ 操作单一 ∥ 回执单形。被否：扩语义（双形 ∕ 两探针语义相斥 ∕ B8 行重写）。
- **KD-3 · 探针单源 = 核 `probeChannelModels` + `probeTargetOf`**（含代理 + 落账）；`model:list` 同径对齐（同批附带件 —— U1）。被否：复用裸 `listModels` 径（两探针语义并存 ∕ 代理缺陷续存）。
- **KD-4 · 失败渠诊断 = `unavailable` 载荷 + 核落账**；菜单零行 = VSC 同行为；可见行标 = B10 S3（跨批具名）。被否：菜单内失败行（VSC 无 ⇒ 造反向端差）。
- **KD-5 · 切片 `{ models, unavailable }`**（`forProvider` 去名）；核件读键零改。被否：保留 `forProvider`（失义）∥ 切片改名（无必要动面）。
- **KD-6 · 触发 = 六径表（2.5）**；#5 会话切换重推 = 端差收正（需求 §3.1:51 违反项）。
- **KD-7 · 重探链 = 渲染面持有**（≤2 轮 ∕ 2s ∕ 改善才推）；无忙让位（无采样器——登记）；重取粒度 = 整渠（登记）。
- **KD-8 · 回写同值受理**（#5 径）：沿 VSC F-4 既有裁（prefs 载具）——非本批新裁。
- **U1（父侧裁）**：`model:list` 探针径对齐（代理 + 落账，回执形零变）作为同批附带件是否受理；**裁窄 ⇒ 挂另轮（登记，扇出不受阻）**。
- **U2（父侧裁）**：失败渠可见面时序 —— 本批落账（数据）+ B10 S3 行标（可见）之间，失败渠于菜单静默缺席（= VSC 菜单同行为；VSC 另有 settings 行说明）。**倾向：不提前**（行标面归 B10 S3）——登记待裁。
- **U3（父侧裁 · 需求档笔权在主 agent）**：判据「一级 = 全部配置渠道」是否在需求档明文化（现由 D6 + §3.6 覆盖）；本批 AC1 已机检化。

### 2.9 碰撞面与交接（逐条）

| 对象 | 面 | 处置 |
|---|---|---|
| **B10 W2/W3**（`parity-b10-ui.md:121-131` ∕ 波划分 `:179-184`） | 同体档：`src/main/ipc.mjs` ∕ `ipc-registry.mjs` ∕ `preload.cjs` ∕ `src/main/settings.mjs`（S14）+ `mount-settings-exits.mjs`（S1/S6/S10/S11/S14） | **不可并行**（调度器按 files 串行 —— 确认 §1.2 回传②）；计数（本批 38⇒39 ∥ B10 38⇒44）**后落者随动** |
| **B8**（`parity-b8-ipc.md`） | 请求面 38 行对照表 + `model:list` 行 #19（`:108`） | `model:list` 契约零变 ⇒ #19 原行成立；**新增第 39 通道** ⇒ B8 W4 复跑补行 + 计数 38⇒39（具名随动）；本批 IPC.md 落行在前 ⇒ B8 实施前重读该档 |
| **B10 S10**（§1.2 回传①） | 「是否复用核件两级菜单」实施轮择一 | **回件**：扇出结论 = `model:catalog` 全渠载荷已定（核件菜单零改）—— S10 若复用核件菜单 ⇒ 候选面取本通道（渠-模两级天然可用）；不复用（原生控件）⇒ 零依赖；择一归 B10 实施轮 |
| **B10 S1**（`provider:setKey` ∕ `provider:delKey`，未来） | 写成功径 | 实施时须同接 `onProvidersChanged`（注入缝本批落）——**交接登记** |
| **#562**（B2 收正批在途） | `ipc.mjs` 注释面 | 零重叠（本批只增转口 + 头注句） |
| **#545**（批次本地件写门） | 测试件落点 | 实施轮按 #545 即时形（`.thincoder/tmp/` → 父侧转正） |

### 2.10 勘察列报（CLI 同面 ∕ 需求面合规）

- **CLI 同面（存）**：`thincoder-cli/src/tui/model-picker.mjs:57-80`（L1 = **全部** `agent.providers` —— `:109-121` 行含 `(no key)` ∕ `(不可用)` 行标；L2 = 逐渠运行期拉取 `getProviderModels` —— `:83-106`）⇒ **已合规**（零改；作三端 L1 集合的第三对照）。
- **需求面合规（核 ∕ 不写）**：`docs/desktop/requirements/PROJECT.md:151` D6（provider → 模型两级选择）+ `:138` §3.6（VSC 已有 ⇒ 桌面必须有；缺项 = 缺陷）+ `:51` §3.1（切会话即随之切换）⇒ 本修有据；五要素在位（§1 目标 ∕ §4 功能点 ∕ §5 边界 ∕ §7 验收 ∕ §8 依赖）。**发现**：D6 行未明文化「一级 = 全部配置渠道」（由 §3.6 blanket 覆盖 —— U3，笔权在主 agent）。

### 2.11 评审范围清单（设计评审用）

- **主审对象** = 本节（§2 全段）。
- **契约落点（预核 · 评审可抽读，非本轮改动）**：`docs/desktop/design/IPC.md`（`:36` ∕ `:103-129` ∕ `:137-149` ∕ `:243`）· `UI.md:18 ∕ :20` · `PROJECT.md:174 ∕ :218`。
- **对位实盘（复核用 · 只读）**：VSC `settings.mjs:380-408` ∕ `provider-probe-window.mjs:29-122` ∕ `panel-session.mjs:157-170` ∕ `presets.mjs:26-40`；核 `list-models.mjs:96-163` ∕ `provider-flows.mjs:79-105` ∕ `config-io.mjs:146-166`；桌面 `composer-sync.mjs:151-172` ∕ `store.mjs:62-65 ∕ :212-221` ∕ `src/main/settings.mjs:100-118` ∕ `ipc.mjs:283-284` ∕ `ipc-registry.mjs:19-22 ∕ :44` ∕ `preload.cjs:15-35`。
- **三链同源核**：本节条目 ⟺ 需求 D6 ∕ §3.1:51 ∕ §3.6 ⟺（实施轮）IPC.md 落行。

### 2.12 修正轮记录（评审 #170〔pass〕后七条裁定 · 逐号点修 · 2026-09-29 · eng-designer）

- **① ipc.mjs 越层 ∕ store.mjs 贴层登记**：§2.6 行 2 ∕ 行 6 补拆分预案 ∕ 消解窗口落点引；W3 #13（PROJECT.md 行）改写 = 「§4.1 越层 ∕ 贴层登记（`ipc.mjs` 新越层：298 ⇒ ≈303 + 拆分预案引在册「按面拆分」句 ∕ `store.mjs` 贴层 298 消解窗口）+ 行数随动」。
- **② AC1 判据全式**：有 key ∧ 探通 ⇒ 行 ∕ 探不通 ⇒ 零行（`unavailable` 在册）∥ 零 key ⇒ 零行；三端分歧（桌面 = 有 key 滤 ∕ CLI = 全 providers 含 `(no key)` ∕ VSC = `isProviderConfigured`）为**有意端差**，随 U3 一并裁。
- **③ 「配置集 → 空」转移定形**：取「**沿 VSC 对位保持现状**」（给由 = VSC `fullStatus` anyKey 早退 `settings.mjs:383-384` ∧ 「避免空表清下拉」`settings.mjs:361-363`——不造新端差）；触发 #6 行 ∕ AC4 同拍 + 真机 **R7**。
- **④ W3 扩面**：PROJECT.md 行补 §2 **KD-44–KD-46**（承 §2.8 KD-1–KD-3）· §6.1 **D6** 行随拍 · §7 **R1–R7** · §10 **BZ–CB**（U1–U3）；**新增行 #14**（E2E-TESTING.md）；切片 owner 档核 = **无对位**（实核 `docs/desktop/design/RENDERER.md`——两词零命中；派单所举 `docs/render-core/design/RENDERER.md` 不存在——render-core 侧 = `RENDER-CORE.md` 同零）。
- **⑤ 标数刷新（find 实读）**：W3 #12 UI.md **666** · #13 PROJECT.md **1177** · 行 10 app.mjs **269**（复核成立——补注复制面对齐批落值口径；§4.1 旧标 276 待该批回填轮收正）+ #11 补档头 ipc.mjs 计数随动（294 ⇒ 298 ⇒ 实施后实读——先例 `IPC.md:373`）。
- **⑥ 坐标 ∕ 语义收正**：`thincoder-core/provider-flows.mjs` 全路径（两处）；`unavailable.reason` = **核长句原文逐字（非闭集码）**——对照 `provider:verify` 码形（`docs/desktop/design/IPC.md:242`）；落点 = W3 #11「模型清单注」逐字注明。
- **⑦ 机检载体**：测试面段 ③ 缝命名（`createComposerSync` 注入式工厂 + 缺省回退 = 生产径）+ 回退载体 **R5 ∕ R6**；AC6 同拍；AC7 补 git 可得性前提（本仓实测可得）+ 不可得退路（核件目录清单 + 内容哈希抽核）。

**边界**：零实施 ∕ 零产品码 ∕ 零评审点火；`IPC.md` ∕ `UI.md` ∕ `PROJECT.md` 正文零触（= W3 实施轮事）；§1 ∕ §3–§6 零触。

### 2.13 W3 文档轮落位记录（2026-09-29 · eng-designer）

- 承接 = 本节 §2.6 W3 表 + §2.12 修正轮记录；落面 = 四档（`docs/desktop/design/IPC.md` ∕ `UI.md` ∕ `PROJECT.md` ∕ `E2E-TESTING.md`）——逐处落位（读回确认）与逐档改动 = 交付报告面；实施面零触（产品码 ∕ §1 ∕ §3–§6）。
- 关键标数：档头 `ipc.mjs` 计数 **294 ⇒ 303**（`find /c /v ""` 实读定格；派单记 302 = 承 §5.1 推值——现盘实读 303（§5.5 响应表亦记「实读 ≈303」），已按实读落并报告）；PROJECT.md §4.1 行数随动十档 = 内容行数口径（文末换行不计）。
- 落位清单（读回）：IPC.md —— §2 `model:catalog` 行（`:119`）+「模型清单注」（`:284-290`）+ 白名单 38 ⇒ **39**（`:138-139` ∕ 位次 39 行 `:151`）+ `ev:config` 消费句扩（`:36`）+ `model:list` 行探针径对齐随动（`:245`）+ 档头计数（`:3`）；UI.md —— 输入区行候选面句（`:20`）；PROJECT.md —— §2 **KD-44–46**（`:86-88`）· §4.1 十档行随动 + 越层 ∕ 贴层登记（`:159` ∕ `:178` ∕ `:193` ∕ `:200` ∕ `:222` ∕ `:248` ∕ `:250` ∕ `:254` ∕ `:256` ∕ `:290-291`）· §4.2 本批块（`:622-629`）· §6.1 **D6**（`:654`）· §7 **R1–R7**（`:772-778`）+ 本批注（`:780-782`）· §10 **BZ–CB**（`:930-932`）+ **BE** 计数收正（`:907`——38 ⇒ 39，一致性面在报）；E2E-TESTING.md —— §4 行（`:151`）· §6 **R1–R7** 行（`:183-189`）+ 按批读注（`:204`）。
- 边界核对：`thincoder-render-core/**` ∕ `thincoder-vscode/**` ∕ 产品码 ∕ 批档 §1 ∕ §3–§6 —— 零触（本舱编辑面 = 上述四档）；未引入新机制（落点均为 §2.6 W3 表所列既定内容）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Affected-file size / tier | 🟡 | `ipc.mjs` 298 ⇒ ≈303 越 300 顾问线，但设计只给延后句（「拆分预案随 B10 口径登记 ∕ 后落者重登记」——`docs/batches/2026-09-29-model-menu-parity.md:109`）；`docs/desktop/design/PROJECT.md:278-286` 的越层 ∕ 贴层登记面现无 ipc.mjs 条目（该档行内仅存「按面拆分」旧句 `:155`），W3 亦只写「§4.1 改档行数随动」（`…:130`） | 点名拆分面（或明引在册「按面拆分」预案）并在 §4.1 越层段登记 ipc.mjs（新越层）+ store.mjs（贴层 298，`…:118`）与消解窗口；W3 行由「行数随动」改写为「越层 ∕ 贴层登记 + 行数随动」 |
| 2 | Acceptance / 口径 | 🟡 | AC1 判据窄于用户口径「一级 = 全部配置渠道」（`…:138` ∕ `:138` 参照 §1.3:20）：零 key 条目与探不通渠均零 L1 行（`…:66` ∕ `:69` ∕ `:71`）；被引为合规第三对照的 CLI（`:181`，L1 = 全部 `agent.providers` 含 `(no key)`）两态皆显 | 在批准面（§4）把交付判据写成一句显式式（有 key ∧ 探通 ⇒ 行 ∕ 探不通 ⇒ 零行 ∕ 零 key ⇒ 零行），或明取宽读法；三端口径分歧以「有意」在册 |
| 3 | Edge / AC | 🟡 | 触发 #6 ∕ AC4「零推送 · 菜单保持现状」（`…:95` ∕ `:141`）使「已配渠集 → 空」经 #3（`provider:remove` 至无渠，`…:92`）会话内可达：旧 L1 行与旧选取驻留，与 AC1「一级行数 = 配置渠数」字面读法相抵 | 明写该迁移的预期行为（沿 VSC 对位保留，或清切片 ⇒ 菜单空清），并配一条 AC ∕ 真机条目 |
| 4 | Document ownership / coverage | 🟡 | W3（`…:124-130`）只落 IPC.md ∕ UI.md ∕ PROJECT.md（§4.1 + §4.2 + 变更记录，`:130`）；未含 PROJECT.md §2 KD 行 · §6.1 D 行 · §7 T-DSK 用例 · E2E-TESTING.md 行 · §10 行——而诸先例批全数登记（例 = `docs/desktop/design/PROJECT.md:376` ∕ `:408`）。切片形变更（`…:118`）可能另有 owner 档（RENDERER.md §1 单状态树——**本评审范围外，unverified**） | W3 补 durable 登记面（KD-1…KD-3 ∕ §6.1 D6 行同拍 ∕ §7 R1–R6 用例 ∕ E2E 行 ∕ §10 U1–U3），或明述本批不登记的由；核 RENDERER.md 是否持有切片形面并按需登记 |
| 5 | Numeric drift（只报） | 🔵 | 行数抽核：代码档九处与 PROJECT.md §4.1 一致（settings 222 ∕ ipc 298 ∕ ipc-registry 77 ∕ preload 70 ∕ store 298 ∕ composer-sync 188 ∕ mount-composer 243 ∕ mount-settings 151 ∕ mount-settings-exits 274）；四处漂移 = ① `docs/desktop/design/IPC.md:3` 档头 ipc.mjs **294**（设计现读 298 = `PROJECT.md:155`）② UI.md 现读 664 vs 盘上 666（末行 `UI.md:666`）③ PROJECT.md 现读 1175 vs 盘上 ≥1177 ④ `app.mjs` 269 vs `PROJECT.md:196` 276（§4.2 `:571` 已记 276 ⇒ ≈268） | 沿设计自带 as-of 纪律（`…:30`）实施前复读定格；IPC.md 档头 ipc.mjs 计数若属该档自持面（先例 `IPC.md:373`）则并入 W3 行 |
| 6 | Clarity | 🔵 | 两处坐标欠全：`provider-flows.mjs` 两处仅给档名（`…:66` ∕ `:74`），同句姊妹模块给全路径；`unavailable[].reason` 定义为核长句逐字（`…:69`），而同族 `provider:verify` 的 `reason` = 闭集码（`docs/desktop/design/IPC.md:242`） | 补 `provider-flows.mjs` 全路径；在「模型清单注」写明 `reason` 是消息逐字 ∕ 还是码（若逐字则避免被读作码） |
| 7 | Verifiability（机检载体） | 🔵 | AC6 载体带条件句（「可装载性允许时」`…:132`）且未点明缝；AC7 载体 = `git diff`（`…:144`），本评审环境报「No git repository detected」 | 为触发链点明缝（可注入工厂 ∕ 参数覆盖 + 缺省回退——设计他处已用同形）并给 AC6 的回落载体（真机 R5 ∕ R6）；确认实施环境 git 可得或改述 AC7 载体 |

计数：发现 **7**（🔴 0 · 🟡 4 · 🔵 3）；范围注：需求档（`docs/desktop/requirements/PROJECT.md`）与文档地图不在评审范围 ⇒ 需求吻合 ∕ ownership 两项降级判定（设计侧 D6 ∕ §3.1:51 ∕ §3.6 引文标 unverified）；代码坐标（核 ∕ 桌面 ∕ VSC）范围外，未复核。

VERDICT: pass

## §4 用户批准（主 agent）

**批准（父侧代执行 · 2026-09-29）**

- **依据**：评审 #170 **pass**（🔴 0 · 🟡 4 · 🔵 3）+ 修正轮 1 落位核验（父侧读回：§2.12 七条 ↔ 各落点互指一致）+ 设计 token 在位。
- **口径**：用户批级全点授权下父侧代行批准；**可撤回**（用户任何时点否决 ⇒ 实施止付 ∕ 回滚）。
- **批准范围**：§2 全量（KD-1..KD-8 ∕ 六径 ∕ W1+W2+W3 波面）。
- **父侧裁定（U1–U3）**：**U1 = 受理**（`model:list` 探针径对齐作同批附带件——满量闭合代理 ∕ 落账缺口，回执形零变）；**U2 = 维持设计**（失败渠可见行标归 B10 S3，不提前）；**U3 = 需求档明文化**（父侧笔——随本批父侧收尾落，判据全式以 §2.7 AC1 为准）。
- **实施条件**：① 标数 ∕ 坐标「实读定格」复读后再落（§2.12 ⑤ 在案）；② 与 B8 实施舱（`ipc.mjs` 同体档）调度串行（files 域申报在案）；③ 批内件先落 `.thincoder/tmp/`（#545 在册）⇒ 父侧转正；④ W3 文档轮在码面落定后派（eng-designer）。
- **派发**：单舱 W1+W2（十档 + 批内件）；W3 后派。

## §5 实施记录（eng-coder）

**状态行**：实施完成（W1+W2 十档 + 批内件（9/9 绿）· 审计 clean · 代码评审 pass（0 🔴）· R1–R7 待父侧收口）

### 5.1 交付摘要（逐项改动表：号 → file:line；行数 = `find` 计法实读）

**W1 主进程（四件套）**

1. `thincoder-desktop/src/main/settings.mjs`（222 ⇒ **257** · +35）：`hasKeyOf` 渠滤判据（`:102-105`）+ **`modelCatalog()`** 全渠扇出处理体（`:106-133`：`resolveProviders().providers` 滤 hasKey ⇒ `Promise.allSettled(probeChannelModels(name, probeTargetOf(entry)))` ⇒ `modelEntry` 投影 + 渠名注入 ⇒ 失败渠零行 + `unavailable{provider, reason = 核长句逐字}`；探通零模型渠零行不落项；无渠 ⇒ 两键空表；畸形档零 catch 直传）+ **`modelList` 探针径对齐**（U1 · `:135-152`：`probeChannelModels` + `probeTargetOf` —— 过代理 ∕ 落账；**回执行逐字零变** `{ok, models[, reason]}`）+ import（`:33-34`）+ 头注。
2. `thincoder-desktop/src/main/ipc.mjs`（298 ⇒ **302** · +4 · **越 300 顾问线 = 设计在册越层**）：`modelCatalogChannel` 转口（`:287-288`）+ import（`:44`）+ 导出列（`:109`）+ 头注「三十八 ⇒ 三十九」（`:2`）+ 白名单项注（`:20-21`）+ 设置族句「model 两」（`:7`）。
3. `thincoder-desktop/src/main/ipc-registry.mjs`（77 ⇒ **79** · +2）：import 列（`:18-19`）+ `HANDLERS` 行 `"model:catalog"`（`:46`，`"model:list"` 邻位）+ 表头「三十九」（`:2`）。
4. `thincoder-desktop/src/preload/preload.cjs`（70 ⇒ **72** · +2）：`CHANNELS` 末位 +1 `"model:catalog"`（`:36` ⇒ 39 项）+ 表头计数句「三十八 ⇒ 三十九」+ 本项行（`:7` ∕ `:15`）+ 定序句尾（`:21`）。

**W2 渲染面（六档）**

5. `thincoder-desktop/renderer/composer-sync.mjs`（188 ⇒ **282** · +94）：候选面重写（`:164-266`）—— `land`（投影 ∕ #6 零推送判据 ∕ 改善判据）+ `fetchCatalog`（单飞 + 尾随一轮 + `seq` 落地复核 + 链令牌）+ `startRetryChain`（≤2 轮 ∕ 步进延迟 ∕ 链不叠 ∕ 有改善才再推）+ `syncCandidates`（#1 首跑恰一次 ∕ #5 重推缓存 + 新 prefs 零取数）+ `pushModels`（推送单点 + 缓存 + 签名）+ `prefsSignature` + `refreshCandidates`（导出）；**同笔删旧 `:152` 端差登记注**（该端差本批闭合）；旧 `activeProviderOf` ∕ `candidatesFor` ∕ `prefetching` 退场；测试缝 `retryDelayMs` ∕ `delay`（缺省回退 = 生产径）。
6. `thincoder-desktop/renderer/store.mjs`（298 ⇒ **298** · ±0 · **贴 300 层回线内**）：切片注释 `{models, unavailable}`（`:62-65`）+ 初态（`:88`）+ 纯动作 `setModelCandidates(state, models, unavailable)`（`:212-221`，两者同引用才回原态）。
7. `thincoder-desktop/renderer/mount-composer.mjs`（243 ⇒ **244** · +1）：`refreshCandidates` 透传导出（`:243`）+ 句柄注（`:89-92`）。
8. `thincoder-desktop/renderer/mount-settings.mjs`（151 ⇒ **153** · +2）：`onProvidersChanged` 注入转口（读 `:50` · 注入 `:103`）+ 注句（`:43-44`）。
9. `thincoder-desktop/renderer/mount-settings-exits.mjs`（274 ⇒ **276** · +2）：deps 解构（`:58`）+ 两写成功点调用（`:108` `provider:save` ∕ `:139` `provider:remove`；首启向导同路 `handlers.onSubmit`）。
10. `thincoder-desktop/renderer/app.mjs`（269 ⇒ **271** · +2）：`attachSettings` deps 增键（`:65` `onProvidersChanged: () => composer.refreshCandidates()` · 迟绑定注 `:64`）+ `onConfig` 增线（`:236` · 注 `:234-235`）。

**批内件（#545 即时形 —— 先落 `.thincoder/tmp/`，待父侧转正 `docs/batches/`）**

- `.thincoder/tmp/2026-09-29-model-menu-parity.test.mjs`（**300** 行 · 9 用例）：① handler 面（渠滤 ∕ 行形 ∕ 序 ∕ `unavailable` ∕ 落账 —— 核桩 = 本地回环 HTTP 桩 + 临时 config，探针走**真核径**）· ①B 通道四件套结构机检（CHANNELS 39 ∕ 白名单↔注册表逐项一致 ∕ 处理体在场）· ② store 纯动作 · ③-1..③-6 六径 + 尾随一轮 + 无渠 ∕ 集转空 ∕ 全渠失败三态。

### 5.2 验收读数（机检 · 逐条）

- `node --check`：十档全绿（逐档 OK）。
- 批内件：`node --test .thincoder/tmp/2026-09-29-model-menu-parity.test.mjs` ⇒ **9/9 pass · 0 fail**。
- 桌面自跑器：`npm test`（`thincoder-desktop`）⇒ 「manifest empty — zero tests = green」（零未登记件 —— 设计「零回归面」成立）。
- AC1：批内件 ①（渠滤 ∕ 行形 ∕ 序 ∕ 逐渠探；零 key 渠零探）。
- AC2：①（失败渠零行；`reason` = 核长句逐字；`admissionOf("beta").ok === false` ∕ `failure === "malformed"`）。
- AC3：①（`["alpha","alpha","delta","delta"]` = 配置序 × 渠内核排序）。
- AC4：③-3 ∕ ③-6（无渠 ∕ 集转空 ⇒ 零推送；旧行驻留）。
- AC5：③-2（会话切换 ⇒ 重推缓存 + 新 prefs；零取数）。
- AC6：③-1（#1 恰一次）· ③-5（#2 ∕ #3 恰一取 + 在飞期尾随一轮）· ③-4（#4 ≤2 轮 · 无改善零重推）· ③-2（#5 零取数）· ③-3 ∕ ③-6（#6 零推送）。
- AC7：`model:list` 键面 + 元素形两向零变（旧形在册 = `docs/batches/2026-09-27-desktop-chat-panel-b.md:472`；① 断言在盘）；核件零改 —— 本舱零触碰核心 ∕ render-core ∕ VSC ∕ CLI（见 5.4）；工作树 `git diff thincoder-render-core` 非空 = 旁批在途（subblocks 族），非本批。
- AC8：真机 R2（父侧收口）。
- R1–R7 真机条目：**未跑**（父侧收口跑；本舱零电子化桌面运行面）。

### 5.3 决策透明表（实施轮）

| # | 决策 | 由（依据） |
|---|---|---|
| D-1 | `hasKeyOf` 取 **trim 非空白**（对位 VSC `isProviderConfigured` ∕ `resolveKey`）；「纯空白 key」边缘档与 `provider:list` 行面 `hasKey`（length>0）**不同判**，注释逐字写明（不写「同判」误述） | 设计 §2.3「对位 VSC `isProviderConfigured`」；评审轮 1 附注已吸收 |
| D-2 | 落定（含 #6 零推送拍）**仍写切片**（`{models, unavailable}` = 收据数据）；推送面另按零推送判据 | 设计 §2.4「`unavailable` 入切片（同写点数据完整）」+ §2.5 #6（零推送 = 推送面事，菜单保持现状） |
| D-3 | `#5` 重推判据 = 签名 `[会话键, provider, model, effort]`（比「同渠」更细：同渠换模型亦重推） | 设计 §2.5 #5「会话切换 ∕ 活动 meta 变」+ AC5「模型钮随会话」 |
| D-4 | 重探链归一 =「非链落定 ⇒ 起链；链内轮次自续」；在飞期强制刷新 ⇒ 尾随一轮（链不叠） | 设计 §2.5 在飞竞态 + 重探链条款 |
| D-5 | `seq` 落地复核 = **结构性守卫**（单飞纪律下公开面不可构造双飞 ⇒ 无独立用例） | 设计 §2.5 要求复核在位；测试面头注明示在案 |
| D-6 | 批内件 ① 用**本地回环 HTTP 桩 + 真核探针径**（非设计点名的 `_setProbeImplForTest` 桩）—— 取落账 ∕ 长句逐字的**真径**证据（核桩面会遮蔽 `recordAdmission`） | 设计测试面要求「落账 `admissionOf`」断言 ⇒ 真径更强 |
| D-7 | composer-sync 实增 +94（设计估 +55 ⇒ ≈243；实读 282）—— 六径 + 链 + 缓存 + 签名逐项可追，仍在 300 内 | 设计 §2.6 行数为估值；实读值随 W3 记账（评审轮 1 #2 已列报） |

### 5.4 禁止面核对（零触）

- `thincoder-render-core/**` ∕ `thincoder-vscode/**` ∕ `thincoder-cli/**` ∕ `thincoder-core/**`（只用既有导出 `probeChannelModels` ∕ `probeTargetOf` ∕ `resolveProviders` ∕ `specForModel` ∕ `thinkOffPath`）—— 零触碰（本舱编辑面 = 上述十档 + 批内件）。
- 零改面：`renderer/mount-head.mjs` ∕ `renderer/mount-settings-reads.mjs` ∕ `renderer/mount-settings-segments-models.mjs` ∕ `renderer/composer-wire.mjs` ∕ `src/main/providers.mjs` —— 零触碰（仍走 `model:list` 单渠面，语义正确）。
- `docs/desktop/design/IPC.md` ∕ `UI.md` ∕ `PROJECT.md` ∕ `E2E-TESTING.md` —— **零触**（W3 文档轮后派）。
- 新通道 = 仅 `model:catalog`（零新增其他通道）；行为面 = 模型钮候选面之外零动。

### 5.5 审计与代码评审轮次 + 终态 + fix round

- **实施前**：任务书复读 + 十档「实读定格」复读（坐标按盘上现值取）。
- **内部发散审计（explore · 只读 · 轮 1）**：终态 = **clean**（四类偏差 —— 部分实现 ∕ 静默简化 ∕ 文档漂移 ∕ 越出文件表 —— 逐类未发现；唯一列报 = §5 当时未写 = 本次写入项）。同轮附注已处置：`hasKeyOf` 注释「同判」误述 ⇒ 修正为逐字写明边缘差异（D-1）。
- **内部代码评审（advisor · type=code · 轮 1）**：**VERDICT = pass**（🔴 0；1 🟡 advisory + 5 🔵）。
- **响应表（评审轮 1 逐条）**：

| # | 级别 | 事项 | 处置 |
|---|---|---|---|
| 1 | 🟡 | `ipc.mjs` 302 行（含尾空行计法 303）> 300 顾问线 | 本批零动作（R3：设计已登记 —— W3 #13 落 §4.1 越层 + 引在册「按面拆分」预案 `PROJECT.md:155`）；实读 ≈ 设计估值 ≈303 |
| 2 | 🔵 | composer-sync 282 vs 设计估 ≈243 | 报告项：W3 记账按实读 282（勿抄估值） |
| 3 | 🔵 | 批内件 300 行 vs 设计估 ≈80–120 | 报告项：转正 ∕ 记账按 300 行实读 |
| 4 | 🔵 | 批内件确定性（回环桩 + 墙钟 `tick(15)`） | 评估不改：① 面 = 真核径证据面（档头自述）；③ 链面全微任务 ⇒ `tick` 仅作收敛兜底；如后续需纯单元面可另起 |
| 5 | 🔵 | `ipc.mjs:297` 两空格缩进（先例遗留 · 零语义） | 不改（非本批落笔面；避免评后改动使评审对象失真） |
| 6 | 🔵 | AC1 判据窄于用户原话（失败渠 ∕ 空白 key 渠零行）· 已裁定项 | 无动作（§2.7 AC1 全式 + §2.12 ② + §4 U2 ∕ U3 在册；父侧按 U3 落需求档） |

- **fix round**：**0**（无 must-fix；评审对象冻结 = 交付形态 —— 评后零代码改动）。
- **终态 = clean**（审计 clean + 评审 pass · 0 🔴）。

### 5.6 未决 ∕ 边界诚实项

1. **designId 回显**：本舱 spawn 载荷未携显式值 —— 写授权经 token 门在写时核验（全部编辑 ∕ 用例落盘通过）；如需对账请以父侧发放记录为准（凭据值不落档，沿先例 `2026-09-29-stall-indicator.md:217`）。
2. **R1–R7 真机条目未跑**（父侧收口跑）：含 R2 跨端集合对拍 —— 提示按 provider 键取集合，勿按显示文本（桌面二级分组标题 = 渠名，VSC = `providerLabel`）。
3. **W3 文档轮未落**（后派）：`IPC.md` 档头 ipc.mjs 计数（仍 294）· 白名单 38⇒39 + 位次行 · §2 表 `model:catalog` 行 + 「模型清单注」· `UI.md` 输入区行 · `PROJECT.md` §4.1（越层 ∕ 贴层登记 + 行数随动：settings 257 ∕ ipc 302 ∕ registry 79 ∕ preload 72 ∕ composer-sync 282 ∕ store 298 ∕ mount-composer 244 ∕ mount-settings 153 ∕ exits 276 ∕ app 271）· §2 KD-44–46 · §6.1 D6 · §7 R1–R7 · §10 BZ–CB · §4.2 · 变更记录 · `E2E-TESTING.md` 用例行。
4. **`git diff` 判据的环境注**：共享工作树含多批在途改动（B8 ∕ B10 等）⇒ AC7 的「`git diff thincoder-render-core` 空」不成立（非本批所致：subblocks 族 = 旁批）；本批零触核件的证据 = 本舱编辑面清单（十档 + 批内件）与 mtime 窗（04:57–05:01）。
5. **`seq` 复核无独立用例**（结构性守卫 —— 单飞纪律下公开面不可构造双飞）；见 D-5。
6. 端差登记（沿设计裁决）：桌面无宿主忙采样器 ⇒ 重探链零忙让位；`hostBusy` 档不产（沿 §2.3）。

## §6 验证与收口（父代理）

**收口记录（父代理 · 2026-09-29）**

**波面（全落）**：W1 主进程（`model:catalog` 新通道——handler ∕ 转口 ∕ 入册 ∕ 白名单 39）· W2 渲染面六档（候选面重写六径 + 切片 `{models, unavailable}` + 三接线 + `app.mjs` 两线）· W3 文档四档（IPC ∕ UI ∕ PROJECT ∕ E2E）· U1 附带件（`model:list` 探针径对齐——回执行零变）。

**核验（父侧亲读）**：`settings.mjs:106-133` `modelCatalog`（渠滤 ∕ `allSettled` 保序 ∕ 失败渠零行 + 长句逐字 ∕ 畸形档零吞 ∕ 无渠两键空表）；批内件 `docs/batches/2026-09-29-model-menu-parity.test.mjs` **9/9**；实施舱（#178）审计 clean + 代码评审 pass；文档舱（#184）四档落位读回 + 五项一致性面顺收（303 实读 ∕ BE 39 ∕ R 号面）。

**真机读数（父侧探针 · R1 · 探针件 = `.thincoder/tmp/model-menu-probe.mjs`）**：隔离家 + 回环桩 3 渠（1 渠零 key）⇒ 开项目 ∕ 建会话 ⇒ 点 `#model-btn`：**一级行 = `["alpha›","beta›"]`（= 有 key 渠数 ∧ 配置序 ✓）· 二级 flyout = `["stub-m-a","stub-m-b"]`（核排序 ✓）· 零 key 渠零行 ✓**——用户走查报障「一级只有一个 provider」**真机闭合**。

**R2–R7**（跨端对拍 ∕ key 作废 ∕ 会话切换 ∕ 外改 config ∕ 设置面加渠 ∕ 全删-重配）：转用户走查清单（在册）。

**边界**：零行为外扩 ∕ `thincoder-render-core` ∕ VSC ∕ CLI ∕ 核零触；`ipc.mjs` 越 300 = 设计在册（§4.1 越层登记已落）。

**结算（D7）**：**#595 → 已核销**；U1 受理落地 · U2 维持（失败渠可见行标 = B10 S3）· U3 需求档明文化 = 父侧笔（随落）。
**状态行**：已收口 2026-09-29。
