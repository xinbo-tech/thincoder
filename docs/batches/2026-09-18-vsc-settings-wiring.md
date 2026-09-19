# 批：2026-09-18 · VSC 配置页接线修复（台账 #89）

> 批次边界：一个交付目标 = 「配置页接线缺陷（快照到达 / 控件回填 / 空值不静默清除 / 死线）修复」；条目集 = 台账 #89（用户报告）+ 只读审计 id=90 的同族发现（登记为 F-W11 / F-W12）。
> 前情 = 需求档 `docs/vsc/requirements/WEBVIEW.md` F-W8–F-W12 + N-W8（父侧 2026-09-18 直接执行 · 可 revert）；审计报告 = 只读探索 id=90（表 1–3 + 缺陷清单 P0/P1/P2）。

## §1 批次任务（父侧）

**状态行**：🔄 进行中（设计轮 · eng-designer）

### 1.1 目标与理由

用户 2026-09-18 17:04 报告「vscode 配置页的 proxy uri 老是不显示，新进去的时候总是空的」，17:06 裁「现在就立项，顺便盘点一下配置页还有没有其他的接线问题」。父侧根因实证 + id=90 全量审计 ⇒ 需求档同轮落 F-W8–F-W12 + N-W8。**本批修的是接线缺陷本体**（含一条静默删配置的真数据丢失路径）。

### 1.2 本批覆盖的需求条目（逐条可交付）

| # | 需求（`docs/vsc/requirements/WEBVIEW.md`） | 本批交付 |
|---|---|---|
| ① | **F-W8** 设置面快照打开必达 | 打开路径（`openSettings` / `initSettings`）补齐 **proxySettings · websearchSettings · indexStatus** 三条快照（推送或拉取）——不等「保存 / 跑回合 / 外部改 config」补 |
| ② | **F-W9** 控件级回填（收到即刷活控件） | 四处「只存 SS」消费函数回填：`settings-env.js:66-69`（shellCandidates）· `:71-73`（proxySettings）· `settings-tools.js:293-295`（websearchSettings）；对照正例 = `settings-providers.js:244-253` / `settings-tools.js:297-300` |
| ③ | **F-W10** 空值不得静默清除既有配置（🔴 数据丢失） | change-to-save 只在**用户实际编辑过**该控件后发值；「快照未达 / 从未编辑」不得以默认或空渲染值回写；「URI 清空 = 清除代理」保留但须**显式用户动作**触发 |
| ④ | **F-W11** Shell 控件接线或移除 | `#sh-select` / `#sh-custom`（`settings-env.js:27-31`）死线二选一：接线（change → `saveShellSettings` → 写盘 + 回填）**或**移除控件 + 清死 handler |
| ⑤ | **F-W12** 收发面对表零未处置 | **4 反向死 handler**（`panel-messages.mjs:320` `settings` / `:322` `saveCustomProvider` / `:372` `saveEmbeddingConfig` / `:460` `saveShellSettings`）+ 1 无消费者推送（`panel-mcp.mjs:137` `mcpReconnected`）逐条处置（删 / 补消费者 / 登记）——口径同 N-W7（**计数随评审 id=96 发现 1 收正**：原记 3） |
| ⑥ | **N-W8** 三条先红后绿用例 | `settings-open-snapshots.test.mjs` · `settings-empty-no-write.test.mjs` · `settings-refill.test.mjs`（**修复前必红**）+ 登记入 `thincoder-vscode/test/files.mjs`；**不得沿用** `smoke-settings.mjs:70-78` 的灌 SS 手法 |

### 1.3 本批不做（明确）

- 不改 extension 侧「空 uri ⇒ `delete raw.proxy`」的删除语义（设计档明载）；不改「单击即删」（设计意图）。
- 不恢复整卡重建（SETTINGS-REORG P3——丢半填输入）；不新增协议 type（沿用既有 type 与 `_pushSettings` / `_pushSettingsLight`）。
- **登记不修五条**（P2-3 默认值物化 · P2-4 元素缺席≡清空 · P2-5 保存面零校验 · P2-6 表单被重建清空 · P2-7 面板关时错误不可见）——各带消解路径 + 到期条件，见需求档在册。
- **待用户裁 1 项**（key / token 在 UI 只显 `****` 时「可逆删除」是否成立）不在本批射程。

### 1.4 边界

- 写域 = `thincoder-vscode/webview/**`（`settings*.js` · `chat.js`）+ `thincoder-vscode/src/extension/**`（`panel-messages.mjs` · `chat-panel.mjs` · `settings.mjs` · `settings-panel-write.mjs`）+ `thincoder-vscode/test/**`。
- 不碰核 `thincoder-core/**`（读面语义不变）；不碰 `thincoder-cli/**`；不碰需求档正文（父侧笔）。
- 修前安全提示（对用户）：修好前配置页三个代理控件勿动（「Test」只读安全）——已同步。

### 1.5 验收口径

1. **先红后绿**：N-W8 三条用例在**修复前必红**（读数入 §5）；修复后全绿。
2. **数据安全（机判）**：修后「快照未达 + 未编辑控件」触发 change ⇒ **零写盘**（`config.json` 逐字节不变）；显式清空 ⇒ 才删除。
3. **零回归**：`thincoder-vscode` `npm test` 全绿 + `node scripts/doc-check.mjs` 按档归属零新增。

## §2 批次任务与设计

（eng-designer 写）

（eng-designer · **initial 轮** 2026-09-18）

**设计落点（单源 · D2）**：机制与判据 = `docs/vsc/design/SETTINGS.md` **§2.8**（打开拍必达 / 控件级回填 / 写值纪律 + 空值⇒删除路径册）与 **§2.9**（Shell 写面接线圈）、UI 决策 = 同档 **§5 U-S8–U-S10**；协议面 = `docs/vsc/design/WEBVIEW-PROTOCOL.md` **§13**（发面全量对表）+ §12 头注/三行 ② 列 + 方向口径段（打开拍回批）。本段 = 批次面（逐条要点 / 受影响文件 / 用例 + 先红 / AC / 处置表 / 上抛），**不重述机制**。

### 2.1 逐条设计（回指 §1.2 ①–⑥）

| # | 需求 | 机制要点（落点 = `SETTINGS.md` §2.8 / §2.9 · `WEBVIEW-PROTOCOL.md` §13） | 判据（用例号见 §2.4） |
|---|---|---|---|
| ① | F-W8 | 打开拍回批：`case "getAgentSettings"` 内先 `panel._pushIndexStatus()` 再 `panel._pushSettingsLight()`；`_pushSettingsLight` 内 **agentSettings 移末位** ⇒ 序 = `indexStatus → providerStatus · proxySettings · websearchSettings · shellCandidates → agentSettings`；零新增协议 type（复用既有 sink） | 打开后三快照到达 + 建面即真值（W8-1 / W8-2） |
| ② | F-W9 | 四处消费函数补回填：`updateProxySettings`（`#px-uri` / `#px-web` / `#px-model`）· `updateShellCandidates`（`#sh-select` 选项表 + `#sh-custom` 值）· `updateWebsearchSettings`（`#row-websearch` 行）· `updateIndexStatus`（扩到 `#row-embed`）；**跳过聚焦中的控件**；行级重绘（两行内零输入控件） | 推送后屏值 = 新值；随后改动发回屏值（W9-1…W9-4） |
| ③ | F-W10 | **基线判据**（屏值 ≠ 基线才发；**基线 = 控件最后一次被写入值**——跳过聚焦控件 ⇒ 基线冻结，定值 = `SETTINGS.md` §2.8）+ **逐字段载荷**（`#px-uri`→`{uri}` · `#px-web`→`{web}` · `#px-model`→`{model}`）；宿主既有部分载荷语义 = 安全网（**宿主零改动**）；「空 / null ⇒ 删除」路径册 4 条 + #1 子路径（登记） | 未编辑 ⇒ 零发值 + 徽标零亮；显式清空 ⇒ 仅该字段（W10-1…W10-6） |
| ④ | F-W11 | Shell **接线**（不删控件）：`#sh-select` change → 发 `{value}`（`""` = System default ⇒ 删 `config.shell`；`__custom__` = 零发值）；`#sh-custom` change → 非空发值 / 空值零发值 + 就地回显 | 选择 / 输入 ⇒ 写盘 + 回填（W10-5 · W9-2） |
| ⑤ | F-W12 | 5 条逐条处置见 §2.7（3 死 handler 删 + 1 接线转 `活` + 1 无消费者推送删）；**实测死 handler = 4 条**（多 `saveEmbeddingConfig`——需求档计数 3，见上抛 1）；发面全量对表落 `WEBVIEW-PROTOCOL.md` §13（52 行 as-of 实测）+ 机检新档 | §13 表 ↔ 提取集双向对账绿；删除项全树 grep 零命中（W12-1 / W12-2） |
| ⑥ | N-W8 | 三档先红后绿（`settings-open-snapshots` · `settings-empty-no-write` · `settings-refill`）+ 四档登记 `test/files.mjs`（含 `protocol-coverage-reverse`——`test/run.mjs` 对未登记档 fail-closed） | 修复前必红读数见 §2.4；`npm test` 全绿 |

**设计轮实测（P0-1 复现 · happy-dom + 真 webview 模块直驱 · 零仓内写入）**：快照未达（宿主只回 `agentSettings`）建面 ⇒ `#px-uri.value === ""` · `#px-web.checked === true`；对**未编辑**的 `#px-web` 派发 change ⇒ 捕获 `[{"type":"saveProxySettings","settings":{"uri":"","web":true,"model":false}}]`（宿主 `thincoder-vscode/src/extension/settings.mjs:249-250` 空 uri ⇒ `delete raw.proxy`）且 `#agent-saved-badge` class = `"agent-saved-badge visible"`（UI 反给「已保存」——P0-1 链全环复现）。

### 2.2 关键决策记录（含否决备选）

| # | 决策 | 否决备选 / 理由 |
|---|---|---|
| D-W1 | 打开路径 = **推送**（piggyback 既有 `getAgentSettings` 拉取回批） | ① 新增 `getProxySettings` 等拉取 type —— 违「不新增协议 type」；② 只在 `webviewReady` 推 —— 不随开面板刷新（外部写后仍陈旧）；③ 每次开面板走 `_pushSettings()` 全量 —— 带网络探测（面板抖动） |
| D-W2 | 发值纪律 = **基线判据 + 逐字段载荷**（字段级「未编辑不发值」） | ① 卡级闩「快照未达 ⇒ 整卡零发值」—— 过宽（用户真实编辑亦丢）；② 只判「快照在场」—— 复选框自渲染默认值（`px.web !== false`）仍会被写；③ 宿主侧加「空值不许删」守卫 —— 改宿主删除语义（需求明令不改） |
| D-W3 | 发面对表落 **§13**（§12 保持收面） | 并入 §12 子节（`### 12.2`）：§12 现有解析器按 `## ` 切节 + 双向同名判别式（`userMessage`）⇒ **本轮即把既有协议机检改红**（设计轮不写实现面）；本设计改以 §12 头注给指向，两表合称「收发面对表」。若须并入 §12：实施轮须**同轮**改 `protocol-coverage.test.mjs` 切节口径（上抛 2） |
| D-W4 | Shell = **接线**（不删控件） | 删除：宿主通道（拉取 + 写盘 + 候选表）已完整，缺的只是 webview change 绑定 = 接线缺陷本体；删除会连带孤立 `shellCandidates` 快照族（§12 行 + 消费位 + 拉取）⇒ 面更大。代价 = 新增一条「空 ⇒ 删键」路径（入口 = 显式 `System default` 项——已入路径册 #2） |
| D-W5 | `updateIndexStatus` 回填面**扩到 `#row-embed`** | 不扩：`indexStatus` 为异步推送（计数 + `loadRaw`），可能晚于 `agentSettings` 触发拍 ⇒ 建面后到达时 `#row-embed` 保持 `—` = 假阴性（F-W8 判据句「已配置项不回显为空 / 不假阴性」）；修复 = 同函数重绘（零新语义） |
| D-W6 | `mcpReconnected`（`thincoder-vscode/src/extension/panel-mcp.mjs:137`）= **删** | 补消费者需新 UI 文案（新语义，超接线修复射程）；重连的用户可见效果已由同函数 `pushMcpStatus`（`:141`）全量覆盖 |

### 2.3 受影响文件表（行数 as-of 2026-09-18 实测 · Δ = 预估）

| # | 文件 | 现况 → 预估（Δ） | 面 |
|---|---|---|---|
| 1 | `thincoder-vscode/webview/settings-env.js` | 82 → ~150（+68） | 写值门（基线 + 逐字段）+ Shell 接线 + 代理 / Shell 回填 |
| 2 | `thincoder-vscode/webview/settings-tools.js` | 368 → ~396（+28） | `#row-websearch` 行重绘 + `renderIndexStatus` 扩 `#row-embed` |
| 3 | `thincoder-vscode/src/extension/chat-panel.mjs` | 423 → ~420（−3） | `_pushSettingsLight` 序收正（agentSettings 末位）+ 删 `_saveCustomProvider` + import 名 |
| 4 | `thincoder-vscode/src/extension/panel-messages.mjs` | 477 → ~470（−7） | 打开拍回批（+2 行）+ 删 3 个死 case（`settings` / `saveCustomProvider` / `saveEmbeddingConfig`） |
| 5 | `thincoder-vscode/src/extension/settings.mjs` | 413 → ~391（−22） | 删 `saveCustomProvider`（导出面——级联后零调用方） |
| 6 | `thincoder-vscode/src/extension/panel-mcp.mjs` | 167 → 166（−1） | 删 `mcpReconnected` 发射行 |
| 7 | `thincoder-vscode/test/files.mjs` | 83 → 87（+4） | 四档登记（三必红档 + 发面机检档） |
| 8 | `thincoder-vscode/test/protocol-coverage.test.mjs` | 385 → 385（±0） | **零改**（§13 独立顶级节——既有解析不受影响；设计轮实测 4/4 绿） |
| 9 | `thincoder-vscode/test/settings-open-snapshots.test.mjs` | 新建 ~130 | F-W8（host 回批 + webview 渲染真值） |
| 10 | `thincoder-vscode/test/settings-empty-no-write.test.mjs` | 新建 ~190 | F-W10（webview 值纪律门 + 宿主落盘语义）+ N-W8 点名符号覆盖（W10-6 / W10-7） |
| 11 | `thincoder-vscode/test/settings-refill.test.mjs` | 新建 ~140 | F-W9 + F-W11 回填半（含 `#row-embed`） |
| 12 | `thincoder-vscode/test/protocol-coverage-reverse.test.mjs` | 新建 ~170 | F-W12 / N-W7（发面表 ↔ 提取集机检） |
| 13 | `thincoder-vscode/test/helpers/webview-env.mjs` | 92 → 92（±0） | 零改（`#agent-saved-badge` 由 agent 卡 HTML 生成——夹具无需扩） |
| 14 | `thincoder-vscode/test/smoke-settings.mjs` | 98 → 98（±0） | 零改；**约束**：回填函数须在该档极简 DOM 桩下可跑（回归门） |
| 15 | `docs/vsc/design/SETTINGS.md` | 124 → **208**（+84） | **已落**（§2.8 / §2.9 / §3 残留 +2 / §5 U-S8–U-S10 / 变更记录——含 fix 轮 +19；行数 = as-of 2026-09-18 fix 轮末实测） |
| 16 | `docs/vsc/design/WEBVIEW-PROTOCOL.md` | 369 → **443**（+74） | **已落**（§13 新节 + §12 头注/四行 ② 列/方向口径 + §11 回指 +1 + 变更记录——含 fix 轮 +4；行数 = as-of 2026-09-18 fix 轮末实测） |
| 17 | 上述两档的表体随实现同步 | —（实现轮） | §13 删 3 行（`settings` / `saveCustomProvider` / `saveEmbeddingConfig`）+ `saveShellSettings` 转 `活` + §12 `mcpReconnected` 行随删退场（源零位 ⇒ 表行不留悬空——同 §12 口径） |

**行数口径（D3——发现 10 复核，仅约束 #15 / #16 两条）**：本注两行一律 = **内容行数（`wc -l` 同值）**，尾空行不计；旧注 #15 「190」= 尾空行口径多计 1（评审实测末行 `:189`）——以本注为准。

**拆分规划（超 300 咨询档——四档 · 本批只登记不执行；登记轮 = 实现后收正轮 §2.12.2）**（行序 = **贴限优先**；`#` 列 = §2.3 表号）

> 登记式承 `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.20.4 / §6.23.4：**拆点** = 候选面（具名成员 + as-of 行号范围）→ 目标档；**触发条件** = 超 500 硬限前主动拆 / 下次触碰时拆。行数 = as-of 2026-09-18 实现轮末实测（§5.1）；「缝」= 抽取后既有 import / 分发面如何保持（零调用方改动）。

| # | 文件（§2.3 表号） | 现况（距 500 硬限） | 拆点（候选面 → 目标档 · 缝） | 触发条件 |
|---|---|---|---|---|
| 4 | `thincoder-vscode/src/extension/panel-messages.mjs` | **480**（余 20 · 本批 +3 **贴限优先**） | **回合控制族** = `case "abort"`（`:167-195`）+ `case "cancelSubagent"`（`:203-247`）+ `case "interrupt"`（`:250-257`）≈82 行 → `panel-messages-turn.mjs`（缝 = 分发表按同名 case 标签分发——照 D-3 会话族先例，`:15-19` 在册） | ① **净增致 >490（距硬限 10 行内）⇒ 先拆后落笔**；② 否则下次实质触碰该档（新增 / 改造 case 族）随批拆 |
| 3 | `thincoder-vscode/src/extension/chat-panel.mjs` | 424（余 76） | **设置推送面** = `_pushStatus`（`:310-312`）+ `_pushSettingsLight`（`:314-329`）+ `_pushSettings`（`:331-339`）+ `_agentSettingsSession`（`:341-349`）≈40 行 → `panel-settings-push.mjs`（缝 = 类内薄委托——照 `panel-session.mjs` / `panel-index.mjs` / `panel-mcp.mjs` 先例） | ① 任一单批净增 ≥ 40 ⇒ 先拆后落笔；② 否则下次触碰该档随批拆 |
| 5 | `thincoder-vscode/src/extension/settings.mjs` | 384（余 116） | **环境面（代理 / Shell / 检索）** = `shellCandidates`（`:57-88`）+ `proxySettings`（`:194-197`）+ `websearchSettings`（`:200-203`）+ `saveWebsearchKeyFromPanel`（`:206-213`）+ `deleteWebsearchKeyFromPanel`（`:216-222`）+ `saveProxySettingsFromPanel`（`:246-257`）+ `testProxyConnection`（`:261-284`）≈91 行 → `settings-env.mjs`（缝 = re-export——照本档 `:189-191` 先例，面板 import 面零改） | ① 任一单批净增 ≥ 40 ⇒ 先拆后落笔；② 否则下次触碰该档（代理 / 检索面改动）随批拆 |
| 2 | `thincoder-vscode/webview/settings-tools.js` | 368（余 132） | **MCP 面** = `renderMcpList`（`:158-220`）+ `updateMcpTestResult`（`:223-231`）+ `updateMcpTools`（`:234-253`）+ `parseHeadersLike`（`:326-339`）+ `openMcpForm`（`:343-363`）+ `kvToInput`（`:366-368`）+ `bindToolsControls` 的 MCP 段（`:92-139`）≈170 行 → `settings-mcp.js`（缝 = 卡片模块内再分面——照 `settings-env.js` / `settings-tools.js` 自 `settings.js` 拆出的既有先例） | ① 任一单批净增 ≥ 40 ⇒ 先拆后落笔；② 否则下次触碰该档（MCP 表单 / 键行族改动）随批拆 |

**行数债注**：四档批前值 = 368 / 423 / 477 / 413、批后 = 368 / 424 / 480 / 384（§5.1）——**本批净增集中 `panel-messages.mjs`（+3）**，其余持平或下降；`thincoder-vscode/webview/settings-env.js`（203）在 300 档内、零拆分义务。

**零改面（明示）**：`thincoder-vscode/webview/chat.js`（消息 case 零改——回填住设置模块内）· `webview/settings.js`（`bindEnvControls` 每建面重绑，序不变）· `webview/settings-state.js`（SS 形状零改）· 宿主侧删除语义（`settings.mjs:246-257` · `settings-panel-write.mjs:158-165`）· `thincoder-vscode/locales/**`（**零新增文案**）。

### 2.4 用例表（正常 / 边界 / 错误）+ 三条必红档的先红形态

> 夹具约定：webview 侧 = `test/helpers/webview-env.mjs`（happy-dom + 全量 id 夹具）+ 真 `chat.js`/`settings.js` 模块；host 侧 = **临时 config**（`_setConfigPathForTest` 指 tmp 文件）+ `Object.create(ChatPanel.prototype)` 桩（`_panel` 捕获 postMessage、`_agentSettingsSession = () => null`）——**测试绝不触碰真实 `~/.thincoder/`**。

**档 A `settings-open-snapshots.test.mjs`（F-W8）**

| 编号 | 组 | 输入 / 动作 | 期望（断言级） |
|---|---|---|---|
| W8-1 | 正常 · **必红** | 桩面板（临时 config 置 `proxy.uri` 真值）→ `handlePanelMessage(p, { type:"getAgentSettings" })` | 捕获批 `type` 序列 `deepEqual ["indexStatus","providerStatus","proxySettings","websearchSettings","shellCandidates","agentSettings"]`（**末位 = agentSettings**）。**先红读数 = `["agentSettings"]`**（三条快照缺） |
| W8-2 | 正常 · **必红** | 真 webview：`openSettings()` → 把 W8-1 捕获的批逐条 `dispatchEvent(new MessageEvent("message",{data}))` | `#px-uri`.value === `"http://127.0.0.1:7890"` · `#px-web`.checked === true · `#index-status` 文本 ≠ `—`。**先红读数 = `""`**（快照未达 ⇒ 建面空渲染） |
| W8-3 | 边界 | 打开后**不回批**（250ms 超时回落） | `#settings-body` 非空（建面完成）+ 零抛错——锁既有回落不回归 |

**档 B `settings-empty-no-write.test.mjs`（F-W10 + N-W8 点名符号覆盖）**

| 编号 | 组 | 输入 / 动作 | 期望（断言级） |
|---|---|---|---|
| W10-1 | 边界 · **必红** | 不灌 SS、不回批 → build → 对**未编辑**的 `#px-web` 派发 change | `posted.filter(m => m.type === "saveProxySettings")` `deepEqual []` ∧ `#agent-saved-badge` class **不含** `visible`。**先红读数 = `[{"type":"saveProxySettings","settings":{"uri":"","web":true,"model":false}}]` + 徽标 `visible`**（= §2.1 实测复现） |
| W10-2 | 正常 | 回批（uri 真值）→ `#px-uri` 置 `"http://new"` + change | `deepEqual(posted, [{type:"saveProxySettings", settings:{uri:"http://new"}}])`——**`Object.keys(settings)` `deepEqual ["uri"]`**（防默认值物化） |
| W10-3 | 正常 | `#px-uri` 显式清空 + change；宿主侧 `saveProxySettingsFromPanel({uri:""})`（临时 config） | payload 恰 `{uri:""}` ∧ `loadRaw().proxy === undefined`（键消失——「URI 清空 = 清除代理」保留但须显式动作） |
| W10-4 | 错误 / 反例 | 同值 change 连发两次；`saveProxySettingsFromPanel({web:false})` | 恰 1 次 post（幂等门）∧ 磁盘 `proxy.uri` 保留（部分载荷语义 = 安全网） |
| W10-5 | 边界 | `#sh-select` 选 `System default`（`""`）· `#sh-custom` 清空 change · `#sh-custom` 非空 change | 分别 = post `{type:"saveShellSettings", value:""}` · **零 post** + 就地回显（式 = `SETTINGS.md` §2.9「回显全表达式」） · post 原值 |
| W10-6 | 边界 · **必红** | build 后 `#px-uri`.focus() → 派发 `{ type:"proxySettings", settings:{uri:"http://new"} }`（聚焦中被跳过 ⇒ 基线冻结于现屏值）→ `#px-uri` 派发 change（**无改动**） | `posted.filter(m => m.type === "saveProxySettings")` **零条**——旧屏值零回写（**发现 2 判别格**：W9-5 覆盖「随后确改值」侧，本格 = 「未改值」侧）。**先红读数 = 1 条 `saveProxySettings`（旧屏值）+ 徽标 `visible`**（同 W10-1） |
| W10-7 | 覆盖（N-W8 点名符号） | 桩面板 + 临时 config（`providers:[{name:"p1"}]`）→ `handlePanelMessage(p, { type:"setProviderProxy", name:"p1", proxy:true })` → 再 `{ name:"p1", proxy:false }` → 再 `{ name:"nope", proxy:true }` | 首次后 `loadRaw().providers[0].proxy === true`（写盘）；二次后该键**消失**（`delete entry.proxy`）；第三次零写盘（`entry` 未命中）。符号 = `handleSetProviderProxy`（`thincoder-vscode/src/extension/settings.mjs:139` · 调用位 `panel-messages.mjs:366-370`）——**非先红**（既有写路径成立——实现前后同绿，N-W8 点名零覆盖符号首测） |

**档 C `settings-refill.test.mjs`（F-W9 + F-W11 回填半）**

| 编号 | 组 | 输入 / 动作 | 期望（断言级） |
|---|---|---|---|
| W9-1 | 正常 · **必红** | build 后按 wire 形态派发 `{ type:"proxySettings", settings:{uri:"http://127.0.0.1:7890",web:true,model:false} }`（消费位 = `webview/chat.js:222-224` 的 `m.settings`） | `#px-uri`.value === 真值。**先红读数 = `""`** |
| W9-2 | 正常 · **必红** | 派发 `{ type:"shellCandidates", candidates:[{name:"System default",value:null},{name:"bash",value:"/bin/bash"}], current:"/bin/bash" }`（载荷本即扁平——消费位 `webview/chat.js:219-221` 直读 `m.candidates` / `m.current`） | `#sh-select`.value === `"/bin/bash"` ∧ `#sh-custom`.value === `""`。**先红读数 = `""`** |
| W9-3 | 正常 · **必红** | 派发 `{ type:"websearchSettings", settings:{hasKey:true} }`（消费位 = `webview/chat.js:213-215` 的 `m.settings`） | `#row-websearch` 状态词 `****` ∧ 删除钮（`.del-key`）在位。**先红读数 = `—` + 仅 Add 钮** |
| W9-4 | 正常 · **必红** | 派发 `{ type:"indexStatus", status:{built:true,files:3,chunks:9,hasEmbedder:true}, hasEmbedder:true }`（消费位 = `webview/chat.js:275-277` 的 `m.status`） | `#row-embed` 状态词 `****` + `#index-status` 读数为已建。**先红读数 = `#row-embed` 保持 `—`**（D-W5 的假阴性） |
| W9-5 | 边界 | `#px-uri`.focus() + 半填值 → 派发 `{ type:"proxySettings", settings:{uri:"<另一值>"} }` → 再改值 + change | 聚焦中屏值**不变**（不被推送拍平）∧ 随后 post = **屏值**（旧值零回写） |

**档 D `protocol-coverage-reverse.test.mjs`（F-W12 / N-W7 机检）**

| 编号 | 组 | 输入 / 动作 | 期望（断言级） |
|---|---|---|---|
| W12-1 | 正常 | §13 表 ↔ 源码提取集双向对账（发面） | `unregistered` / `orphan` / `dup` 三集皆空。**红形态** = 档未建（`test/run.mjs` 清单校验 fail-closed）⇒ 建档即绿（表已在设计轮落位）；**实现轮 3 删 + 1 转 `活` 若漏同步表体 ⇒ 本例如红**（= 「零未处置」回归门） |
| W12-2 | 错误 | tmp 夹具树（未登记 type / 死 handler） | 未登记判别式点名 ∧ 悬空行点名 ∧ 处置错配点名（照 `protocol-coverage.test.mjs` T-7 形态） |
| W12-3 | 边界 | 处置闭区间 + 五列无空 + 形态登记 | ④ ∈ {`活`,`删`,`补`} ∧ 五列无空 ∧ 四形态（对象字面量 / 三元双分支 / 局部对象绑定 / 局部箭头函数）提取齐；未知形态 ⇒ 点名失败（不静默漏计数） |

### 2.5 验收标准（回指 §1.2 ①–⑥ · 逐条机判）

| AC | 回指 | 判据（命令 + 断言） |
|---|---|---|
| AC-W1 | ① F-W8 | `cd thincoder-vscode && node --test test/settings-open-snapshots.test.mjs` 全绿（先红读数在 §2.4 在册） |
| AC-W2 | ② F-W9 | `node --test test/settings-refill.test.mjs` 全绿（含 `#row-embed`） |
| AC-W3 | ③ F-W10 | `node --test test/settings-empty-no-write.test.mjs` 全绿——含「未编辑 ⇒ 零发值 ∧ 徽标零亮」+ 宿主落盘语义（`{web:false}` 保 uri · `{uri:""}` 删键）+ **聚焦跳过格（W10-6）** + N-W8 符号格（W10-7） |
| AC-W4 | ④ F-W11 | **绑定在位 + 行为机判**（不按 grep 计数判——承实现轮上抛 1 · 父侧裁定；处置 = §2.12.1）：(a) **行为半（机判）** = `cd thincoder-vscode && node --test test/settings-empty-no-write.test.mjs test/settings-refill.test.mjs` 全绿——W10-5 三格（`#sh-select` 选 `System default` ⇒ post 恰 `{type:"saveShellSettings",value:""}` · `#sh-custom` 清空 ⇒ 零 post + 就地回显 · 非空 ⇒ post 屏值）即两 change 处理器**在位的运行期证明**，W9-2（`shellCandidates` 到达 ⇒ `#sh-select` 选中匹配候选 ∧ `#sh-custom` 清空）= 回填半；(b) **绑定半（静态核对 · 计数不判）** = `thincoder-vscode/webview/settings-env.js:90`（`#sh-select` change → `onShellSelectChange`）· `:91`（`#sh-custom` change → `onShellCustomChange`）；(c) **写盘半** = 同一 post 载荷 → host 消费位 `thincoder-vscode/src/extension/panel-messages.mjs:464` → `saveShellSettingsFromPanel`（`thincoder-vscode/src/extension/settings-panel-write.mjs:158`——宿主既有单通道零改；本批未加盘面断言）；(d) 协议面 = `WEBVIEW-PROTOCOL.md` §13 `saveShellSettings` 行 ④ = `活`（机检 = `thincoder-vscode/test/protocol-coverage-reverse.test.mjs` 表 ↔ 发射集双向对账） |
| AC-W5 | ⑤ F-W12 | `node --test test/protocol-coverage-reverse.test.mjs test/protocol-coverage.test.mjs` 全绿（发面 + 收面）∧ 删除项全树 grep 零命中：`settings`（发面 case）· `saveCustomProvider`（case + 方法 + 导出）· `saveEmbeddingConfig`（case）· `mcpReconnected`（post） |
| AC-W6 | ⑥ N-W8 | 四档在 `test/files.mjs` ∧ `cd thincoder-vscode && npm test` 全绿 |
| AC-W7 | 文档面 | `node scripts/doc-check.mjs --root .` **按档归属零新增**（读数：本批两档新增悬空 **0** · 新增超宽 **0**；全仓读数对照见 §2.10 发现 5） |
| AC-W8 | 数据面（§1.5-2） | 「快照未达 + 未编辑控件」触发 change ⇒ 零写盘（`config.json` 逐字节不变）——断言形式见 §2.6 |

### 2.6 反例面（明写 · 断言级）

1. **「快照未达 + 未编辑控件」零写盘**：① webview 侧 —— 零 `saveProxySettings` post（W10-1 · 聚焦跳过格 = W10-6）；② 宿主侧 —— 临时 config 逐字节比对（`readFileSync` 前后 `deepEqual`）+ `raw.proxy` 键在场（零删除）。
2. **「未编辑字段永不入载荷」**：payload 键集断言（W10-2 的 `Object.keys` 逐字）——空渲染值 / 默认值 / 复选框自渲染勾选均不进 wire。
3. **「显式清空 ⇒ 才删」**：`{uri:""}` ⇒ `raw.proxy` 键消失；`{web:false}` / `{uri}` 部分载荷 ⇒ 其余字段原值保留（宿主侧单测，落盘断言）。

### 2.7 F-W12 逐条处置表（⑤）

| # | 项 | 位点 | 处置 | 落地动作 / 判据 |
|---|---|---|---|---|
| 1 | `saveShellSettings` | `thincoder-vscode/src/extension/panel-messages.mjs:460-464` | **补**（接线转 `活`） | webview 补 change 绑定（F-W11）；判据 = W10-5 / W9-2 + §13 行 ④ 转 `活` |
| 2 | `settings` | 同上 `:320` | **删** | 零发射方（全树 `type:"settings"` 零命中）；`_pushSettings()` 内部调用点（`panel-index.mjs:115` 等）不受影响；判据 = grep 零命中 + §13 表行退场 |
| 3 | `saveCustomProvider` | 同上 `:322` | **删**（级联） | 同删 `chat-panel.mjs` 的 `_saveCustomProvider` 与 import 名 + `settings.mjs` 的 `saveCustomProvider` 导出（custom 渠道走 `addProvider` → `handleAddProvider` → 核 `addProviderEntry`）；判据 = grep 零命中（三处） |
| 4 | `saveEmbeddingConfig` | 同上 `:372` | **删** | 零发射方（embed key 走 `saveEmbedKey` / `deleteEmbedKey`）；`_saveEmbeddingConfig` **保留**（两 live case 用）；判据 = grep 零命中 |
| 5 | `mcpReconnected` | `thincoder-vscode/src/extension/panel-mcp.mjs:137` | **删** | 消费缺失且效果被同函数 `pushMcpStatus`（`:141`）全量覆盖；判据 = grep 零命中 + §12 表行退场（行留则 orphan 红） |

**发面全量对表**：`WEBVIEW-PROTOCOL.md` §13（52 行 · 设计轮已落）——四形态登记（对象字面量 / 三元双分支 / 局部对象绑定 / 局部箭头函数）+ 未登记形态点名失败；机检 = `protocol-coverage-reverse.test.mjs`（收面机检档零改、实测 4/4 绿）。

### 2.8 UI / 交互决策

已落 = `SETTINGS.md` §5 **U-S8**（未编辑不发值 / 显式清空才删）· **U-S9**（Shell：`System default` = 重置；自定义路径空 = 不发值）· **U-S10**（回填跳过聚焦控件）。**open 项 = 无**（三项语义全定；「快照未达拍 `#px-web` 渲染默认值」入同档 §3 残留登记——消解路径 + 到期条件在册）。本批**零新增 i18n 键 / 零新增 UI 态**。

### 2.9 边界（不做）

不改宿主删除语义 · 不恢复整卡重建（SETTINGS-REORG P3）· 不新增协议 type（沿用既有 type 与 `_pushSettings*`）· 不改 `config.shell` 语义与既有校验 · 不修五条登记项（P2-3 … P2-7）与三条设计意图（单击即删 / URI 清空语义 / 面板推送不重建卡）· 不碰 `thincoder-core/**` · `thincoder-cli/**` · `docs/design/_archive/**` · 不改需求档正文。

### 2.10 上抛项（父侧 / 评审面）

| # | 严重度 | 发现 | 建议处置 |
|---|---|---|---|
| 1 | 🔴 | **F-W12 计数 3 ≠ 实测 4**：反向面实测死 handler = 4 —— 多出 `saveEmbeddingConfig`（`thincoder-vscode/src/extension/panel-messages.mjs:372`，零发射方，唯一调用者 = 同 case） | 需求档 F-W12 计数须**父侧收正**（D3 计数纪律；需求档笔不在我）。本设计已按「零未处置」判据句把它纳入 §2.7 处置（§13 表已列 `删` 行） |
| 2 | 🟡 | **§12 定位微调**：F-W12 判据句写「逐条进 §12 表」，本设计落 **§13**（理由见 D-W3：并入会本轮改红既有协议机检） | 请评审 / 父侧确认；若裁定必须并入 §12 ⇒ 实施轮须**同轮**改 `protocol-coverage.test.mjs` 切节口径（`### 12.1` / `### 12.2` 解析） |
| 3 | 🟡 | **§12 `mcpReconnected` 行的消解路径悬空**：该行记「消解路径 = `docs/TODO.md` 技术组条目」，全仓 grep（`docs/TODO.md` / `docs/TODO-archive.md`）**零命中** = 悬空指针 | 本批删该发射点 ⇒ 行随删、指针问题随之消失（留痕 = §2.7 #5）；若评审要求「登记不删」则须**新立**该 TODO 条目 |
| 4 | 🔵 | **`smoke-settings.mjs` 灌 SS 手法保留**：`thincoder-vscode/test/smoke-settings.mjs:70-78` 仍在 `openSettings()` 前手工灌 SS（N-W8 已明「不得沿用」于新用例；该档不在本批射程） | 保留；但它是**回归门**——回填/发值函数须在该档极简 DOM 桩下可跑（§2.3 #14 约束） |
| 5 | 🔵 | **doc-check 全仓读数含他批在途**：本轮复跑 `node scripts/doc-check.mjs --root .` = 悬空 **11** / 超宽 **6**；相对本批开工基线（悬空 8 / 超宽 6），**+3 悬空非本批写入**（`docs/core/design/CONSULTATION.md:15/:72` · `docs/core/design/CORE-UNIFICATION.md:857` 指向 `src/agent-tools/review-streak.mjs`——该件在 git 工作树内为 `D`（他批删除中），与「零新增」判据的按档归属无关） | 无需本批动作；AC-W7 的「零新增」按**档归属**判（本批两档 = 0 新增） |

### 2.11 修正轮（设计评审轮 1 后——2026-09-18；eng-designer）

**裁决**：轮次 1 = **PASS**（🔴 0 · 🟡 5 · 🔵 6）——父侧逐条裁定：发现 **1 / 3 由父侧收正**（§1.2 ⑤ / 需求档 F-W9 定性），发现 **2 / 4 / 5 / 6 / 7 / 8 / 9 / 10 / 11 共 9 项由本席逐号落地**（`Suggestion` 列 = 建议；处置执行人 = 本席）。
**段内处置（append-only 例外已打标）**：§2.1 ③ / §2.3 #10 · #15 · #16 / §2.4（档 B 表头 + W9-1…W9-5 五行 + 新增 W10-6 · W10-7）/ §2.5 AC-W3 / §2.6 条 1 = **就地校正**（计数与枚举同改——D3；残留以现值为准）。
**零新语义**：九项均为评审发现 + 父侧裁定的直接导出项（无新需求条目、无新 AC 号、无新协议消息、无实现面改动）。

| 号 | 级别 | 处置 | 落点（file:line = as-of 修正轮末） | 读数 |
|---|---|---|---|---|
| 2 | 🟡 | 基线判据**重定义**（基线 = 控件最后一次被写入值——建面 / 回填 / 编辑三写入点）+ 判别句（跳过聚焦 ⇒ 基线冻结）+ 判别用例 | `SETTINGS.md` §2.8（`:105-109`）· §2.1 ③（`:58`）· 批档 §2.4 W10-6（`:121`） | `:105` 逐字「**基线 = 该控件最后一次被写入控件的值**」；`:107` 逐字「跳过聚焦中的控件 ⇒ 零写入 ⇒ 基线冻结于该控件现屏值」；W10-6 期望 = 零 post、先红读数（1 条旧屏值 + 徽标 `visible`）在册 |
| 4 | 🟡 | 补 `handleSetProviderProxy` 覆盖用例（N-W8 点名符号 · provider 行代理开关写路径） | 批档 §2.4 W10-7（`:122`）· §2.3 #10（`:89`）· 档 B 表头（`:112`） | 符号 = `thincoder-vscode/src/extension/settings.mjs:139` · 调用位 `panel-messages.mjs:366-370`（本轮实读）；**非先红**（既有写路径成立）已在行内标注 |
| 5 | 🟡 | §12 `shellCandidates` 行 ② 列补「（打开拍回批）」注 | `WEBVIEW-PROTOCOL.md`（`:339`） | 四快照行注记对齐（`:319` indexStatus · `:332` proxySettings · `:339` shellCandidates · `:356` websearchSettings） |
| 6 | 🔵 | §13 `saveShellSettings` 行 ⑤ 明写「本项处置 = 接线（≠ 删）」 | `WEBVIEW-PROTOCOL.md`（`:406`） | ④ 仍记当前类（`删`）——④ 词表三值（活 / 删 / 补）不变 |
| 7 | 🔵 | W9-1 / W9-3 / W9-4 载荷改 **wire 形态**（消费位回指）；**同表 W9-2 / W9-5 一并规范记法**（同族形面、零语义） | 批档 §2.4（`:128` · `:130` · `:131`；W9-2 `:129` · W9-5 `:132`） | 五格均写 `{ type, … }` 形态；W9-2 注明「载荷本即扁平」（`webview/chat.js:219-221`）；消费位 = `chat.js:222-224` / `:213-215` / `:275-277` |
| 8 | 🔵 | Shell 回显**全表达式**定值（单一详述点 = §2.9；§2.8 回填表 · 路径册 #3 · W10-5 挂指针——D2） | `SETTINGS.md` §2.9（`:144-147`）· §2.8 回填表（`:96`）· 路径册 #3（`:120`）· 批档 W10-5（`:120`） | 匹配候选 ⇒ `#sh-select` 回到它 + `#sh-custom` 空；无匹配 ⇒ `__custom__` + 值（与渲染器同源 `webview/settings-env.js:25-31`） |
| 9 | 🔵 | 路径册 #1 补**子路径**边界句 + §3 登记（消解路径 + 到期条件在册） | `SETTINGS.md` §2.8（`:125-127`）· §3（`:156-158`） | 宿主 `!uri` ⇒ `delete raw.proxy; return`（`src/extension/settings.mjs:249-250`）· UI 仍 `flashSaved`（`webview/settings-env.js:44-45`）——**登记不修**（宿主删除语义本批不改） |
| 10 | 🔵 | 行数注收正（尾空行口径复核） | 批档 §2.3 #15 / #16（`:94-95`） | 实测：`SETTINGS.md` 124 → **208**（+84）· `WEBVIEW-PROTOCOL.md` 369 → **443**（+74）；两档 >300 字符行 = **0** |
| 11 | 🔵 | §12 两处**预存在**坐标漂移收正（标 as-of） | `WEBVIEW-PROTOCOL.md` 头注（`:302`）+ 表行（`:307` · `:319`） | `panel-index.mjs:53` = `postMessage({type:"indexStatus"…})` ✓ · `panel-messages.mjs:405/:421` = agentSettings 两镜像 ✓（本轮实读） |

**本轮边界（守）**：需求档零改（F-W9 / F-W12 = 父侧笔）· 实现面代码零改 · 他批档零改 · `_archive/**` 零改 · §2.7 处置表 / §2.8 UI 决策 / §2.10 上抛表零改。
**机检读数（复跑 `node scripts/doc-check.mjs --root .`）**：锚 **悬空 11** · 行宽 **6**——与本批开工基线（§2.10 #5：悬空 11 / 超宽 6）同值 ⇒ **按档归属零新增**（`docs/vsc/design/SETTINGS.md` 与 `docs/vsc/design/WEBVIEW-PROTOCOL.md` 均不在失败列）。
**旁记（非本轮引入）**：`WEBVIEW-PROTOCOL.md:49`（443 字符）· `:52`（326 字符）= 既有**表格行**超宽——表格行不可折行（折行即破表），行宽闸亦未列报 ⇒ 轮内零触碰、如实登记。
**半条未落（回报主 agent）**：无——九项全落。

### 2.12 实现后收正轮（2026-09-18 · 父侧裁定两项——承本档 §6 父侧裁定与 §5.7 上抛 1 / 2；eng-designer）

**范围**：项 ① **AC-W4 判据改语义形态**（原句「`grep -rn "sh-select" thincoder-vscode/webview` 命中 = 渲染 1 处 + change 绑定 1 处」**字面不可达**——基线种读（`settings-env.js:76`）与回填（`:173`）**必读该控件**，合法读数 ≠ 2）；项 ② **行数咨询档登记拆分规划**（四档拆点 + 触发条件）。
**零新语义**：只改判据形态 + 补拆分登记——实现面代码 / 需求档 / 他批档 / `_archive/**` / 机制条文语义（`SETTINGS.md` §2.8 · §2.9 与 `WEBVIEW-PROTOCOL.md` §12 · §13）**零改**。
**段内处置（append-only 例外已打标）**：§2.3 表后**新增「拆分规划（超 300 咨询档——四档）」块**（项 ② 落点）· §2.5 **AC-W4 行就地校正**（项 ① 落点；表格行结构不变）· §2.12.1 判据行**读数回填**（同轮落笔——非跨轮改写）。

#### 2.12.1 项 ①：AC-W4 判据形态（回指 §1.2 ④ · 落点 = §2.5 AC-W4 行）

| 面 | 处置 | file:line + 读数（as-of 2026-09-18 本席实测） |
|---|---|---|
| 判据 | **绑定在位 + 行为机判** | 命令 = `cd thincoder-vscode && node --test test/settings-empty-no-write.test.mjs test/settings-refill.test.mjs`；断言级 = W10-5（`#sh-select` 选 `System default` ⇒ 恰 `{type:"saveShellSettings",value:""}` · `#sh-custom` 清空 ⇒ 零 post + 就地回显 · 非空 ⇒ post 屏值）→ `thincoder-vscode/test/settings-empty-no-write.test.mjs:148-180`；W9-2（回填）→ `thincoder-vscode/test/settings-refill.test.mjs:56-68`；**本席复跑读数 = 15/15 pass · 0 fail**（三档同跑 = W10-x 7 + W9-x 5 + W12-x 3） |
| 绑定 | 两 change 处理器在位（**静态核对 · 不计数**） | `thincoder-vscode/webview/settings-env.js:90`（`#sh-select` change → `onShellSelectChange` 定义 `:121`）· `:91`（`#sh-custom` change → `onShellCustomChange` 定义 `:135`） |
| 计数残迹（**退场 · 非判据**） | 同命令现读 = `sh-select` **6 行**（渲染 `:60` · 基线种读 `:76` · 绑定 `:90` · **注释 `:118`** · 处理器内 `:122` · 回填 `:173`）；对侧 `sh-custom` = **7 行**（含注释 `:133` · `:170`） | 复跑 `findstr /s /n /c:"sh-select" thincoder-vscode\webview\*.js` = 6（实现轮记 5 = 未计 `:118` 注释行——**同命令两个读数**，即计数面不稳之证） |

**AC 表同类判据扫描（同轮 · §2.5 八行逐行核）**：AC-W1 / AC-W2 / AC-W3 / AC-W6 = 用例档命令（`node --test`）· AC-W7 = `doc-check` 按档归属 · AC-W8 = 端到端逐字节盘面断言——**均非 grep 式**。**AC-W5 含 grep 子句 ≠ 同类**：其值 = 0 的**删除完整性**断言（无「活体命中计数 = N」格），且措辞**回指需求档判据句**（`docs/vsc/requirements/WEBVIEW.md` F-W12「删除项全树 `grep` 零命中」· N-W7 同句——需求档笔不在我）⇒ 判**不改**、标「**已核**」。
**已核读数（按各条形态度量 · 本席复跑）**：`case "settings"` · `case "saveCustomProvider"` · `case "saveEmbeddingConfig"` **各 0 命中** ✓（删项本体零残留）；`mcpReconnected` = **1 命中**（`thincoder-vscode/src/extension/panel-mcp.mjs:137` **留痕注释**——非 post；post 面 0）⇒ 「全树 grep 零命中」按字面读的精度问题入 §2.12.3 #1（**未裁定项——零改**）。

#### 2.12.2 项 ②：拆分规划登记（回指 §1.2 上游 = §5.7 上抛 2 · 落点 = §2.3 新增块）

**四档摘要（行数 as-of §5.1 实测 → 距 500 硬限余量）**：`panel-messages.mjs` **480**（余 20 · 本批 +3 ⇒ **贴限优先**）→ 拆**回合控制族**（`abort` / `cancelSubagent` / `interrupt` ≈82 行）至 `panel-messages-turn.mjs`；`chat-panel.mjs` 424（余 76）→ 拆**设置推送面**（`_pushSettings*` / `_agentSettingsSession` ≈40 行）至 `panel-settings-push.mjs`；`settings.mjs` 384（余 116）→ 拆**环境面**（代理 / Shell / 检索 ≈91 行）至 `settings-env.mjs`；`settings-tools.js` 368（余 132）→ 拆 **MCP 面**（列表 / 表单 / 结果 / 解析 ≈170 行）至 `settings-mcp.js`。**逐档拆点（具名成员 + as-of 行号范围）+ 缝 + 触发条件 = §2.3 该块**（单源——此处不重述）。**本批只登记不执行**（拆分 ≠ 本批范围——避免夹带）。

#### 2.12.3 观察项（不自行处置——父侧 / 他笔）

| # | 级别 | 发现 | 建议处置 |
|---|---|---|---|
| 1 | 🔵 | **AC-W5 字面精度**（扫描实测）：按字面「全树 grep 零命中」有两格不可达——`mcpReconnected` 留痕注释 1 命中（`panel-mcp.mjs:137`）· `saveEmbeddingConfig` 家族**同名存活**（`panel-index.mjs:100` · `embed-config.mjs:121`——§2.7 #4 明载「`_saveEmbeddingConfig` 保留」） | 与 §5.7 上抛 6 **同族**（该条未裁定）；收正口径 = 「带引号的消息类型字面量 + `case` / `post` 零命中（源码树）」——**需求档同句须同改**（F-W12 / N-W7 父侧笔）⇒ 本席零改待裁 |
| 2 | 🔵 | **§5 面时点指称**（他笔）：`§5.1` 末句「拆分规划由父侧裁（评审发现 1）」随 §2.12.2 落地已成失效表达；`§5.3` AC-W4 行「设计字面『渲染 1 处 + 绑定 1 处』」为收正**前**时点值 | 父侧收口时：前者同删 / 改指 §2.3；后者保留（历史读数）或加 as-of 注（§5 笔不在我） |
| 3 | 🔵 | **活债载体**：四档拆分规划住批档（本批收口后全档冻结）——「下次触碰时拆」的触发依赖后续轮读到该块 | 父侧裁：是否另在台账（技术待办）/ 板块活档立行（台账笔不在我） |

**边界（守）**：本轮机检域外性如实声明——`PROJECT-MANIFEST.json` 的 `checkConfig.anchors.exclude` 含 `batches` ⇒ 本轮改动面（批档）**在机检域外**；「按档归属零新增」为结构性成立（读数在册备核，**不充作「已扫过」**）。
**机检读数（复跑 `node scripts/doc-check.mjs --root .`）**：悬空 **6** · 超宽 **7**——与本轮开工基线同值；失败列全部为他档既有（`docs/core/design/DESIGN-TOKEN-SETTLEMENT.md:94/:95/:98` · `docs/core/design/ENG-TOKEN-BINDING.md:96` · `docs/core/requirements/DESIGN-TOKEN-SETTLEMENT.md:22/:26` / 超宽 7 行同 §5.3 列），**本批两档与批档均不在失败列** ⇒ 按档归属零新增 ✓。
**半条未落（回报主 agent）**：无——两项全落（① §2.5 AC-W4 行 + 本 §2.12.1；② §2.3 拆分规划块 + 本 §2.12.2）。

## §3 设计评审记录

（评审子代理写）

### 轮次 1（评审子代理）

**本轮评审范围 = 四档**（`docs/vsc/design/SETTINGS.md` · `docs/vsc/design/WEBVIEW-PROTOCOL.md` · `docs/vsc/requirements/WEBVIEW.md` · `docs/batches/2026-09-18-vsc-settings-wiring.md`，均本轮全读）。重启轮（首试 600s 墙钟超时无结论 ⇒ 未核部分不按已核处理）；本轮按声明目标（VSC 配置页接线修复批设计）重跑，未采纳与声明排除项冲突的外来档清单。

**先核（对照现行源码，本轮实测）**：打开拍序可达（`src/extension/chat-panel.mjs:322-326` 现序 providerStatus → agentSettings → proxy · websearch · shellCandidates，`agentSettings` 移末位即得断言序；`src/extension/panel-messages.mjs:405` 现仅发 agentSettings）；宿主删除语义如注（`src/extension/settings.mjs:249-250` 空 uri ⇒ `delete raw.proxy`；`src/extension/settings-panel-write.mjs:161` 空值 ⇒ `delete raw.shell`）；§13 ① 列 ↔ 本轮 webview 发射集**逐名对账全中**（48 live + 4 `无` 行 = 52，无未登记发射方）；F-W12 级联删除三处证据成立（`_saveCustomProvider` 仅 `panel-messages.mjs:322` 调用；`_saveEmbeddingConfig` 另有两 live case `:373/:374` ⇒ 保留正确）；行数抽检 8/9 与注解一致（`settings-env.js` 82 · `settings-tools.js` 368 · `chat-panel.mjs` 423 · `panel-messages.mjs` 477 · `settings.mjs` 413 · `panel-mcp.mjs` 167 · `test/files.mjs` 83 · `WEBVIEW-PROTOCOL.md` 440）；`test/session-boot.test.mjs:94` 锁的是 webviewReady 握手序（本批不动）⇒ 无既有用例被 `_pushSettingsLight` 改序打破。

**发现表（11 条：🔴 0 · 🟡 5 · 🔵 6）**

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | — | docs/batches/2026-09-18-vsc-settings-wiring.md:22 | 🟡 | New: §1.2 ⑤ 计数滞后 | §1.2 ⑤ 仍写「3 反向死 handler（`panel-messages.mjs:320` / `:322` / `:460`）」，与 §2.1 ⑤（`:60`「**实测死 handler = 4 条**（多 `saveEmbeddingConfig`）」）、§2.7 #4、收正后 F-W12（`requirements/WEBVIEW.md:32`「新增 **4 个**…`:372` `saveEmbeddingConfig`①」·`:119` 收正记录）不一致；枚举漏 `:372`。父侧笔收正即可（§2.7 已按 4 覆盖）。 |
| 2 | — | docs/vsc/design/SETTINGS.md:105-106 | 🟡 | New: ⓐ 基线判据 × 「跳过聚焦控件」未定值 | ① 断言「未编辑控件派发 change … ⇒ 屏值 = 基线 ⇒ 零发值」，基线 = 快照字段派生（「与渲染器同一表达式」）；但回填规则（`:95`/`:100`）跳过聚焦控件、`updateProxySettings` 仍更新 SS（`webview/settings-env.js:72`）⇒ 被跳过的控件屏值 ≠ 基线，随后任何 change 会发**旧屏值**，宿主按部分载荷语义（`src/extension/settings.mjs:249-255`）落盘 = 旧值回写。判别用例缺（W9-5 只覆盖「用户随后确实改了值」）。建议：基线 = 控件最后一次被渲染/回填写入的值（跳过 ⇒ 冻结）+ 补一条用例。可达性注：需一次非用户行为触发的 change（真实浏览器 blur 无改动不发 change）⇒ 非现实数据丢失，但与本批判据句不一致。 |
| 3 | — | docs/vsc/requirements/WEBVIEW.md:29 | 🟡 | New: ⓑ 「四处」计数 vs 枚举 | F-W9（`:29`）与批档 §1.2 ②（`:19`）均写「四处」但只列三处；设计按「三处 + `updateIndexStatus`」收口（`batches/:57` §2.1 ②，D-W5 扩 `#row-embed`）。实测另有「只存 SS」消费者 `updateAgentSettings`（`webview/settings-agent.js:172-174` 仅 `SS.agentSettings = {...}`）不在任何清单 ⇒ 请裁定第 4 处所指；若指它，需补回填或按 P2-3（登记不修·差异提交消解）留痕。D-W5 侧证据成立：`updateIndexStatus`（`settings-tools.js:297-300`）只重绘 `#index-status`/`#index-build-btn`（`renderIndexStatus` `:302-320`），不触 `#row-embed`。 |
| 4 | — | docs/vsc/requirements/WEBVIEW.md:58 | 🟡 | New: ⓒ N-W8 點名零覆盖符号未接 | N-W8 标准列点名三符号「本批补测」：`saveProxySettingsFromPanel`（W10-3/W10-4 ✓）· `proxySettings`（W8-1 捕获 ✓）· **`handleSetProviderProxy`**（定义 `src/extension/settings.mjs:139`、调用 `src/extension/panel-messages.mjs:367`，全树零测试命中 ✓）——设计用例表/受影响文件表零提及（§1.2 ⑥ 摘要本身未带符号清单 = 父侧笔）。裁定：补一条用例，或父侧收窄 N-W8 标准列并留痕。 |
| 5 | — | docs/vsc/design/WEBVIEW-PROTOCOL.md:338 | 🟡 | New: ⓓ §12 ② 列标注不对称 | §12 三行已注「（打开拍回批）」（`:318` indexStatus · `:332` proxySettings · `:356` websearchSettings），同一打开拍的第 4 个快照 `shellCandidates`（`:338`，② 列 = `chat-panel.mjs:326/:334` + `panel-messages.mjs:462`）未注；§2.8（`SETTINGS.md:83`）与 §12 方向口径段（`:360`）都含 shellCandidates ⇒ 行级不一致（信息已在方向口径段，非阻塞；建议同行补注）。 |
| 6 | — | docs/vsc/design/WEBVIEW-PROTOCOL.md:405 | 🔵 | New: §13 `saveShellSettings` ④ 语义双载 | ④=`删`（`:405`），同 ⑤「接线轮转 `活`」+ 批档 §2.7 #1「**补**（接线转 `活`）」+ §2.3 #17「转 `活`」；④ 词表（`:424`：活/删/补）无「待接线」项 ⇒ ④ 记当前类、处置在批档。无动作；若求实现轮表体同步无歧义，可在 ⑤ 明写「本项处置 = 接线（≠ 删）」。 |
| 7 | — | docs/batches/2026-09-18-vsc-settings-wiring.md:126 | 🔵 | New: 用例表载荷缩写 ≠ wire 形态 | W9-1（`:126`）/W9-3（`:128`）/W9-4（`:129`）写成扁平 `proxySettings{...}`/`websearchSettings{hasKey:true}`/`indexStatus{built:…}`，而 `chat.js` 读 `m.settings`/`m.status`（`webview/chat.js:213-215` · `:222-224` · `:275-277`）；W9-2（`:127`）扁平正确（`:219-221`）。建议按 wire 形态（或仿 W8-2 用捕获批）书写，避免用例「永远红」。 |
| 8 | — | docs/vsc/design/SETTINGS.md:116 | 🔵 | New: ⓔ 路径册 #3「就地回显」未定性 | `:116`「零发值 + 控件按快照就地回显」+ `:134`（§2.9 行 5）+ W10-5（`batches/:120`「控件回显 SS 值」）均未写 `#sh-select` 是否回到匹配候选；渲染器（`webview/settings-env.js:25-31`）隐含全表达式（匹配候选 ⇒ 选中它 + `#sh-custom` 空；无匹配 ⇒ `__custom__` + 值）。建议补一句，使实现与用例同口径。 |
| 9 | — | docs/vsc/design/SETTINGS.md:114 | 🔵 | New: 路径册缺「无 uri 时 web/model 改写静默失效」子路径 | 宿主 `!uri` 即 `delete raw.proxy; return`（`src/extension/settings.mjs:249-250`）⇒ 磁盘无 `proxy.uri` 时用户显式勾 `#px-web`/`#px-model` 零落盘，而发射路径仍 `flashSaved(...)`（`webview/settings-env.js:44-45`）⇒ UI 闪「已保存」。非本批修复项（宿主删除语义不改）；建议路径册 #1 补边界句或按 P2-x 登记（消解路径 + 到期条件）。 |
| 10 | — | docs/batches/2026-09-18-vsc-settings-wiring.md:94 | 🔵 | New: 行数标注 ±1 待复核 | #15 注「`SETTINGS.md` 124 → 190（+66）」；本轮实测末行 = `:189`（其余抽检全中：`WEBVIEW-PROTOCOL.md` = 440 ✓ · `settings-env.js` 82 ✓ · `settings-tools.js` 368 ✓ · `chat-panel.mjs` 423 ✓ · `panel-messages.mjs` 477 ✓ · `settings.mjs` 413 ✓ · `panel-mcp.mjs` 167 ✓ · `test/files.mjs` 83 ✓）。差 1 复核即可（尾空行口径）。 |
| 11 | — | docs/vsc/design/WEBVIEW-PROTOCOL.md:306/318 | 🔵 | New: §12 坐标漂移（预存在·非本轮引入） | 抽检 2/6 与现行源不符：`:318` `panel-index.mjs:49`（现行 `:49` = `readIndexCounts(...)`，`postMessage({ type: "indexStatus" …})` 在 `:53`）；`:306` `panel-messages.mjs:408`（现行 `:408` = 注释行，agentSettings 镜像在 `:421`、getAgentSettings 在 `:405`）。表头已自declared as-of 2026-09-16 口径 ⇒ 不构成本轮缺陷；可顺手收正。 |

**计数**：🔴 0 · 🟡 5 · 🔵 6（总 11）；无「必须修复」级（must-fix）项；无未核项（四档全读，源码抽检已标明）。

VERDICT: pass

（注：本轮 token 已签发——不写入本档，按 §2.7 不入凭证值。）

## §4 用户批准

**2026-09-18 18:0x 父侧代签** —— 依据用户三重授权：① 17:06「现在就立项」② 17:00「都点火吧」③ 17:20「你自动跑到排空吧」。

**自缚三条件逐条核验**：① 评审 **pass（0 🔴 · 5 🟡 · 6 🔵）**（id=96——首试 id=95 机制性超时无结论，已记档重跑、未核部分未按已核处理）；② 修正轮（id=97）**9/9 落地并经父侧核验**（含核心项「**基线 = 控件最后一次被写入控件的值**」`SETTINGS.md:105-110` + 判别用例 **W10-6**（必红）· `handleSetProviderProxy` 覆盖 **W10-7** · §12/:338 行注补齐 · §13 处置明写 · 用例载荷改 wire 形态 · 路径册 #3 全表达式定值 · 路径册 #1 子路径边界句 + 登记）；③ **token 已签发**（值不落档——运行时凭证）。

**批准范围**：设计全量（F-W8–F-W12 + N-W8 逐条）+ 受影响表 17 行 + 4 新测试档（三必红 + 反向发面机检）。
**父侧裁定（承 #97 上抛）**：`WEBVIEW-PROTOCOL.md:49`（443 字符）/ `:52`（326 字符）两处**既有**超宽表行 **不改**（markdown 表格行折行即破表；既有债已登记）。
**实施**：eng-coder（initial 轮）已点火（带 designToken）。

## §5 实现与修正记录

（eng-coder 写）

（eng-coder · **实现轮** 2026-09-18）

**交付摘要**：F-W8–F-W12 + N-W8 六条逐条落地，机制与判据逐字取自 `docs/vsc/design/SETTINGS.md` §2.8/§2.9 与 `WEBVIEW-PROTOCOL.md` §13/§12（零新增协议 type · 零新增 i18n 键 · 零整卡重建）。P0-1 数据丢失路径（快照未达 ⇒ 未编辑控件 change ⇒ 宿主 `delete raw.proxy`）在 UI 层闭合：发值门 = **基线判据**（基线 = 该控件最后一次被写入控件的值：建面渲染 / 回填写入 / 用户编辑三写入点；跳过聚焦 ⇒ 零写入 ⇒ 基线冻结于现屏值）+ **逐字段载荷**（`#px-uri`→`{uri}` / `#px-web`→`{web}` / `#px-model`→`{model}`）；宿主删除语义零改（安全网）。

### 5.1 受影响表（行数 Δ 实测 · 内容行数 = `wc -l` 同值，尾空行不计）

| # | 文件 | 实测 → 实测 | Δ | 改动 |
|---|---|---|---|---|
| 1 | `thincoder-vscode/webview/settings-env.js` | 82 → **203** | **+121**（设计估 +68／~150） | 基线三写入点 + 单字段发值门（`saveProxyField`）· 四点控件级回填（代理 / Shell，跳过聚焦）· Shell 接线（两 change → `saveShellSettings`）· 回显全表达式（`shellEchoState`/`shellOptionsHtml` 与渲染器同源）· 建面基线种读（`seedBaselines`） |
| 2 | `thincoder-vscode/webview/settings-tools.js` | 368 → **368** | **±0**（+48/−47；设计估 +28／~396） | `#row-websearch` 整行重绘 · `renderIndexStatus` 扩 `#row-embed`（D-W5）· 行 HTML 提取（`websearchRowHtml`/`embedRowHtml` 渲染器与回填同源）· 两处 `onCancel` 手写重建去重（见 5.4-e） |
| 3 | `thincoder-vscode/src/extension/chat-panel.mjs` | 423 → **424** | **+1**（设计估 −3） | `_pushSettingsLight` **`agentSettings` 移末位**（序 = 契约）+ 删 `_saveCustomProvider` + import 名退役 |
| 4 | `thincoder-vscode/src/extension/panel-messages.mjs` | 477 → **480** | **+3**（设计估 −7） | `case "getAgentSettings"` 打开拍回批（`_pushIndexStatus()` → `_pushSettingsLight()`；+5 注释行）+ 删 3 个死 case（`settings` / `saveCustomProvider` / `saveEmbeddingConfig`） |
| 5 | `thincoder-vscode/src/extension/settings.mjs` | 413 → **384** | **−29**（设计估 −22） | 删 `saveCustomProvider` 导出（级联后零调用方；`probeProviderAdmission` 仍由 `saveProviderKey` 使用——import 保留） |
| 6 | `thincoder-vscode/src/extension/panel-mcp.mjs` | 167 → **167** | **±0**（设计估 −1） | 删 `mcpReconnected` 发射行 + 留痕注释；`const client =` 绑定随删（结果未被使用） |
| 7 | `thincoder-vscode/test/files.mjs` | 83 → **88** | **+5** | 四档登记（标题行 + 四条目 + 注释） |
| 8 | `thincoder-vscode/test/protocol-coverage.test.mjs` | 385 → 385 | **±0 · 零改** | 收面机检冒烟绿（§13 独立顶级节不扰既有解析） |
| 9 | `test/settings-open-snapshots.test.mjs` | 新建 **99** | — | W8-1 / W8-2 / W8-3（桩 `ChatPanel` 原型 + 真 `chat.js`/`settings.js`；记忆面走真宿主路径——见 5.4-f） |
| 10 | `test/settings-empty-no-write.test.mjs` | 新建 **218** | — | W10-1…W10-7（含 W10-1/W10-6 端到端逐字节盘面断言） |
| 11 | `test/settings-refill.test.mjs` | 新建 **104** | — | W9-1…W9-5（回填四点 + 聚焦跳过 + 旧值零回写） |
| 12 | `test/protocol-coverage-reverse.test.mjs` | 新建 **377** | — | W12-1/W12-2/W12-3（§13 首列 ↔ webview 发射集 + 分发档 case 双向对账 + 四形态 + fail-closed） |
| 13 | `docs/vsc/design/SETTINGS.md` | 208 → **211** | **+3** | §2.8 机检面去「（拟新增）」×3 + 补发面机检档指针；变更记录 +2 行（表体随实现同步；机制正文零改） |
| 14 | `docs/vsc/design/WEBVIEW-PROTOCOL.md` | 443 → **450** | **+7** | §13 删 3 行 + `saveShellSettings` 转 `活`（② 列填实现轮实读坐标）+ §12 `mcpReconnected` 行退场 + §12 四行「打开拍回批」坐标 + 「拟新增」标记三处收正 + §13 头注 as-of 说明 + 变更记录（承批档 §2.3 #17 授权） |
| 15 | 零改面（计数实测） | — | — | `webview/chat.js` 410 · `webview/settings.js` 123 · `webview/settings-state.js` 53 · `test/helpers/webview-env.mjs` 91 · `test/smoke-settings.mjs` 97 · `locales/**` · 宿主删除语义（`settings.mjs:246-257` · `settings-panel-write.mjs:158-165`）——**逐档零差分**（`git diff` 空） |

**行数口径注（D3）**：设计 §2.3 的 Δ 为预估；本表为实测。#3/#4（+1/+3 vs 估 −3/−7）与 #1（+121 vs 估 +68）为估算偏差——判据面无影响（AC 不判行数）；#5（−29 vs 估 −22）因删除面比预估略宽。**>300 行咨询档在位债**：`settings-tools.js` 368 · `chat-panel.mjs` 424 · `panel-messages.mjs` 480 · `settings.mjs` 384（批前 368/423/477/413）——拆分规划由父侧裁（评审发现 1）。

### 5.2 先红读数（两段实测 · 命令 = `cd thincoder-vscode && node --test <档>`）

**阶段一（用例首版 · 源码零改）**

| 用例 | 读数（actual → expected） |
|---|---|
| W8-1 | `["agentSettings"]` → `["indexStatus","providerStatus","proxySettings","websearchSettings","shellCandidates","agentSettings"]`（三条快照缺） |
| W8-2 | `#px-uri`.value `""` → `"http://127.0.0.1:7890"`（快照未达 ⇒ 空渲染） |
| W8-3 | ✔ 绿（设计即「锁既有回落」——非先红项） |
| W9-1 | `#px-uri`.value `""` → 真值 |
| W9-2 | `#sh-select`.value `"__custom__"` → `"/bin/bash"`；`#sh-custom` `""` |
| W9-3 | `#row-websearch` 状态词 `—` + 无 `.del-key` → `****` + 删除钮 |
| W9-4 | `#row-embed` 状态词 `—` → `****`（D-W5 假阴性现场） |
| W9-5 | 1 条 `saveProxySettings`（旧屏值 `http://pushed-value`） → 恰 `{uri:"http://final"}` |
| W10-1 | 1 条 `saveProxySettings`（`{uri:"",web:true,model:false}` = 旧屏值）+ 徽标 `visible` → 0 条 + 徽标不亮 |
| W10-2 | `Object.keys(settings)` = `["uri","web","model"]`（默认值物化） → `["uri"]` |
| W10-3 | payload ≠ 恰 `{uri:""}`（三字段全量） |
| W10-4 | 同值 change 连发 = **2** 条 → 恰 1 条（幂等门） |
| W10-5 | `#sh-custom` 无就地回显（`""`）→ 快照值 `/opt/mysh`；select 选 `System default` 零发值 |
| W10-6 | 1 条旧屏值 + 徽标 `visible` → 0 条 + 徽标不亮（聚焦跳过格） |
| W10-7 | ✔ 绿（既有写路径成立——设计在册「非先红」） |
| W12-1/2/3 | ✔ 绿（§13 表已在设计轮落位；红形态 = 档未建 ⇒ `test/run.mjs` 清单 fail-closed，登记即绿） |

**阶段二（最终版用例 · 临时把 `webview/settings-env.js` 回退到 HEAD 复跑档 B——复跑后已逐字还原，见 5.4-g）**

- **W10-1 ✖ 端到端逐字节红**：`config.json` = `{ "$schema": … }`（**`proxy` 整块被静默删除**）→ 原盘面（含 `uri/web/model`）——P0-1 的完整链（未编辑控件 change → 全量载荷 → 宿主 `!uri` ⇒ `delete raw.proxy`）在 UI 层被一发 change 复现。
- **W10-6 ✖ 同款逐字节红**（聚焦被跳过的回填 ⇒ 随后未改值 change 走旧屏值）。
- 其余 W10-x 红态与阶段一同。

### 5.3 用例表读数（修复后 · 命令 + pass/fail）

| 命令 | 读数 |
|---|---|
| `node --test test/settings-open-snapshots.test.mjs` | **3/3 pass · 0 fail**（W8-1/2/3） |
| `node --test test/settings-empty-no-write.test.mjs` | **7/7 pass · 0 fail**（W10-1…W10-7） |
| `node --test test/settings-refill.test.mjs` | **5/5 pass · 0 fail**（W9-1…W9-5） |
| `node --test test/protocol-coverage-reverse.test.mjs` | **3/3 pass · 0 fail**（W12-1…W12-3） |
| 四档同跑 | **18/18 pass · 0 fail** |
| `node --test test/protocol-coverage.test.mjs` | **4/4 pass · 0 fail**（零改叶绿 ✓ AC④） |
| `npm test` | **tests 619 · pass 619 · fail 0 · cancelled 0 · skipped 0**（AC③④） |
| `npm run lint`（`scripts/check-syntax.mjs`） | `check-syntax: 197 JS files OK` |
| `node scripts/doc-check.mjs --root .` | 悬空 **6** · 超宽 **7**（逐条比对：全部为他档既有——`CONTEXT-COMPACTION.md:303` · `persona-engineering.md:137/:139` · `ADVISOR-CONVERGENCE.md:129/:224` · `CONTEXT-COMPACTION.md:27` · `requirements/WEBVIEW.md:49`；**本批两档新增悬空 0 · 新增超宽 0** ✓ AC⑤） |
| AC-W4 判据（`grep -rn "sh-select" thincoder-vscode/webview`） | 命中 **5 处** = 渲染 `settings-env.js:60` · 基线种读 `:76` · change 绑定 `:90` · 处理器 `:122` · 回填 `:173`（设计字面「渲染 1 处 + change 绑定 1 处」与 §2.8 回填表冲突——见 5.4-h 与评审发现 2；「有渲染无绑定」已消除，F-W11 判定句经 W10-5/W9-2 机判成立） |
| AC-W8 数据安全（端到端） | W10-1/W10-6：未编辑控件 change ⇒ **0 条 post + `config.json` 逐字节不变 + `raw.proxy` 键在场**；显式清空 ⇒ W10-3 payload 恰 `{uri:""}` ⇒ `loadRaw().proxy === undefined`（**显式动作才删**） |

### 5.4 决策透明表（实现期判断 · 逐条可核）

| # | 决策 | 依据 / 说明 |
|---|---|---|
| a | 基线状态住 `settings-env.js` 模块内（`_pxBaseline` / `_shBaseline`），**不进 SS** | §2.3 零改面明令 `webview/settings-state.js` SS 形状零改——基线是控件级生命周期态，非共享快照 |
| b | `refillShellControls(skipFocused)` 单函数两面：推送回填 `true` / 就地回显 `false` | §2.8 回填表「跳过聚焦」只约束**推送**面；§2.9 路径册 #3 的就地回显由**用户动作**触发（Enter 未失焦亦须生效） |
| c | `onShellSelectChange` 的 `__custom__` 哨兵分支**也**更新 `_shBaseline.select` | 修正轮定值「基线 = 该控件最后一次被写入控件的值（建面 / 回填 / **用户编辑**三写入点）」——哨兵是用户编辑写入，只是零发值（§2.9 行 3） |
| d | `rerenderKeyRow` 在行内**键编辑中**（`keyRowEdit` 的 `<input>` 在位）跳过整行重绘 | 设计以「行静止态零输入控件 ⇒ 零丢失面」立论；编辑态该前提不成立——守卫是 U-S10「用户输入优先于推送」的直接延伸（评审发现已建：判定自洽，非静默简化） |
| e | 两处 `onCancel`（websearch / embed）由手写 DOM 重建改为复用 `websearchRowHtml()` / `embedRowHtml()` | 同源表达式去重（D2 精神：同一渲染式单一来源）；行为等价（inline onclick 与 addEventListener 等效——`window._edit*` / `_del*` 均在位） |
| f | W8-2 的记忆面走真宿主路径（`applyEngineFloorGuard()` + `ensureMemoryHandle()`），未桩 `pushIndexStatus` | 设计 W8-2 期望 `#index-status` 文本 ≠ `—` 需 status 非空——temp 库 0 行 ⇒ `built:false` ⇒ 读数 = 未建索引（≤0 行库的**真值**，非假阴性）；`memoryDbPath()` = `dirname(_configPath())` ⇒ tmp 目录（**不触真实 `~/.thincoder/`**） |
| g | 先红复验手法：临时 `git checkout -- webview/settings-env.js` 复跑档 B，随后 `file_ops` 备份还原 + `git diff` 复核 | 用例先红阶段后被加强（W10-1/W10-6 加端到端逐字节断言）⇒ 须以**最终版用例**复验红态；还原后 `npm test` 619/619 复跑确认（零残留、零借用他批工作树） |
| h | AC-W4 的 grep 读数按**实质**验收并在 5.3 逐处披露 | 设计字面数（2 处）与 §2.8/§2.9 自身要求互斥（基线种读 + 回填必须读该控件）；不按字面造假、也不静默放过——读数 + 上抛（评审发现 2） |

### 5.5 内部审计与代码评审（轮次 + 终态）

| 轮 | 类型 | 对象 | 读数 | 终态 |
|---|---|---|---|---|
| 1 | 独立审计（`explore` 只读子代理 · 分歧审计） | 交付代码/测试 ↔ 设计规格（SETTINGS §2.8/§2.9 · PROTOCOL §12/§13 · 批档 §2）· 12 档清单 + 零改面 | 4 条：🟡1（`§5` 未落 + §2.3 Δ 预估 vs 实测）· 🔵3（`SETTINGS.md:129`「拟新增」残留 · AC-W4 字面数 · `.thincoder/tmp` 探针档已删）· **零 🔴 / 零静默简化** | 已修 3（§5 本段 · `SETTINGS.md:129` 收正 · 探针档清理）；1 条上抛（AC-W4 字面数） |
| 2 | 代码评审（`advisor` type=code · 独立只读） | 11 档代码 + 4 档文档（批档 / SETTINGS / PROTOCOL / 需求档） | **🔴 0 · 🟡 2（均 advisory/文档口径）· 🔵 8**；正面核项含：序契约可达（`pushIndexStatus` 同步 + `_pushSettingsLight` 末位）· P0-1 链路闭（三写入点 + 逐字段）· F-W9 四点齐 · F-W11 绑定/写盘/回填成立（`System default` 首项实证）· F-W12 五条处置零悬空 · §13①列 ↔ webview 发射集 **49/49** 双向全中 · 回归门（smoke 桩零 TypeError 面 · 无既有档锁旧序/旧 case） | 已修 4（W9-5 去 SS 种读改真推送 · W9-4 断言改 i18n 模板 · §13 两行 ②/③ 坐标重出 · §12 头注 as-of 补句）；余 6 条上抛（见 5.7） |
| 3 | 收敛复跑 | 四档 + `protocol-coverage` + `npm test` + `lint` + `doc-check` | 18/18 · 4/4 · 619/619 · 197 JS OK · 悬空 6/超宽 7（本批两档 0 新增） | **clean**（无未决 must-fix 项） |

**终态 = clean**（审计/评审轮次：2 轮独立评审 + 1 轮收敛复跑；无 stalled、无沉默循环）。

### 5.6 交付表（回指批档 §1.2 ①–⑥）

| # | 条目 | 状态 | 说明 |
|---|---|---|---|
| ① | F-W8 设置面快照打开必达 | ✅ | 回批固定序（末位 `agentSettings`）机判绿（W8-1/W8-2/W8-3）；零新增协议 type |
| ② | F-W9 控件级回填（四处） | ✅ | 代理 / Shell / 检索 / 索引（`#row-embed` 扩面）四点 + 跳过聚焦 + 行级重绘（W9-1…W9-5） |
| ③ | F-W10 空值不得静默清除（🔴 数据丢失） | ✅ | 基线判据 + 逐字段载荷 + 路径册 #1/#2/#3；端到端逐字节机判（W10-1/W10-6 零写盘；W10-3 显式清空才删） |
| ④ | F-W11 Shell 接线 | ✅ | 两 change → `saveShellSettings` → 写盘 + 回填；`__custom__` 零发值；空 ⇒ 零发值 + 就地回显（W10-5/W9-2 + §13 转 `活`） |
| ⑤ | F-W12 收发面对表零未处置 | ✅ | 4 死 handler（3 删 + `saveShellSettings` 转活）+ 1 无消费者推送删；§13 表体随实现同步；机检档建成（W12-1…W12-3） |
| ⑥ | N-W8 三条先红后绿 + 登记 | ✅ | 三档必红实测（5.2）→ 全绿（5.3）；四档入 `test/files.mjs`；**未沿用** smoke-settings 灌 SS 手法（W9-5 已按评审改真推送） |
| AC-W7 | 文档面零新增 | ✅ | 本批两档：新增悬空 0 · 新增超宽 0（读数见 5.3） |

**越界项（明示）**：**无未申报越界**。申报面 = 5.1 表 1–14 行；其中 3 条为**设计期外/实现期新增动作**并逐条披露：① 两处 `onCancel` 去重（5.4-e）；② `webview/settings-tools.js` 行 HTML 提取（渲染器与回填同源——F-W9 行级重绘的必要前置）；③ 探针档 `.thincoder/tmp/probe-*.mjs`（实现期临时件，**已删零残留**，`.gitignore` 覆盖）。**未触碰**：`thincoder-core/**` · `thincoder-cli/**` · `_archive/**` · 需求档 · 宿主删除语义 · `chat.js`/`settings.js`/`settings-state.js`/`locales/**`/`smoke-settings.mjs`/`webview-env.mjs`/`protocol-coverage.test.mjs`。

### 5.7 上抛（父侧 / 设计面——本节未自行处置）

| # | 级别 | 发现 | 建议处置 |
|---|---|---|---|
| 1 | 🟡 | **AC-W4 判据句与设计自相矛盾**：`grep -rn "sh-select" thincoder-vscode/webview` 命中数设计字面 = 2（渲染 + 绑定），实现合法读数 = **5**（§2.8 基线种读 + 回填必须读该控件） | 父侧改述 AC-W4 为语义形态（「渲染 + change 绑定在位（含基线/回填读点）」），否则下轮按字面必判红（本批按实质验收，非放行） |
| 2 | 🟡 | **文件行数咨询档在位债**：`settings-tools.js` 368 · `chat-panel.mjs` 424 · `panel-messages.mjs` 480（**本批 +3，逼近 500 硬限**）· `settings.mjs` 384；设计 §2.3 无拆分规划 | 父侧登记拆分规划入台账 / 或裁定「在位债暂不拆」（建议 `panel-messages.mjs` 优先——本批净增 3 行） |
| 3 | 🔵 | **§13 ②/③ 列坐标对触碰档未全量重出**（已修 4 行；余为 `settings-tools.js` 系 + `panel-messages.mjs` 系 ③ 列漂移；头注已按 D4 声明 as-of 口径） | 下次触碰该表时按实现轮 `--emit` 全量重出（机检不吃坐标——仅人读面） |
| 4 | 🔵 | **§2.3 Δ 预估 vs 实测**（#3 −3→+1 · #4 −7→+3 · #1 +68→+121） | 父侧按实测收正（或标注「Δ 为估、以实测为准」） |
| 5 | 🔵 | **两 sink 的 `agentSettings` 次序相反**（`_pushSettingsLight` 末位 = §2.8 契约 · `_pushSettings` 居首）；打开路径现只走前者 ⇒ 判据满足 | 设计面（eng-designer）在 §2.8 补一句「末位序约束只覆盖 `_pushSettingsLight`（含打开拍）」或统一两 sink 次序 |
| 6 | 🔵 | **AC-W5「全树 grep 零命中」措辞**与 §2.7 #4「`_saveEmbeddingConfig` 保留」并存；`_archive/**` 归档档亦含旧标识符 | 父侧改述为「带引号的消息类型字面量 + case 零命中（源码树，`_archive/**` 除外）」 |
| 7 | 🔵 | **复选框亦受「跳过聚焦」**（浏览器点选即聚焦）：推送被跳过的窗内屏值与磁盘可短暂不一致（基线冻结 ⇒ 零回写、零丢失） | 设计面若追求屏值恒真可对复选框例外，或在 SETTINGS §3 登记该窗；本批不动（与 U-S10 字面一致） |

**半条未落（回报主 agent）**：无——六条需求 + 五条 AC + 三条先红后绿全落；上抛 7 条均为**文档口径 / 在位债 / 设计面补句**，无实现面缺口。

## §6 验证与收口

**收口（2026-09-18 18:2x · 父侧直接执行）**

- **交付判据**：评审 pass（id=96）→ 修正轮（id=97 · **9/9**）→ 实现轮（id=100 · 终态 clean：内部审计 4 发现（3 修 1 上抛）+ 代码评审 pass（0🔴 · 2🟡 · 8🔵 · 已修 4））⇒ 验收 **F-W8–F-W12 + N-W8 逐条 ✅**。
- **验收读数**：四新档 **18/18 pass** · `protocol-coverage.test.mjs` **4/4（零改叶绿）** · `thincoder-vscode npm test` **619/619 pass** · `npm run lint` = 197 JS OK · `doc-check` 按档归属零新增。
- **P0-1 实证闭环（关键）**：阶段一（源码零改）= 红 14 例；阶段二（临时回退 `settings-env.js` 至 HEAD 复跑）= **端到端逐字节红**——`config.json` 变成 `{"$schema":…}`（**proxy 整块被静默删除**）⇒ 数据丢失链在 UI 层一发 change 即复现，修复前/后对照成立 ✓。
- **父侧裁定（承实现轮上抛 1 · 🟡）**：**AC-W4 判据改语义形态**（原「`sh-select` 命中 = 渲染 1 处 + 绑定 1 处」**字面不可达**——基线种读 + 回填必读该控件 ⇒ 合法读数 = 5；实质验收已成立：绑定在位 + F-W11 经 W10-5/W9-2 机判）⇒ 已转修正轮。
- **父侧裁定（承上抛 2 · 🟡）**：行数咨询档（`panel-messages.mjs` **480** 逼近 500 硬限 · `chat-panel.mjs` 424 · `settings.mjs` 384 · `settings-tools.js` 368）⇒ **登记拆分规划**（拆点 + 触发条件）——转修正轮。
- **残项登记（承上抛 3 · 🔵 四条）**：§13 ②/③ 列对触碰档未全量重出（as-of 债）· §2.3 Δ 预估 vs 实测（#3 −3→+1 · #4 −7→+3）· 两 sink `agentSettings` 次序不对称（打开路径只走 `_pushSettingsLight`）· 复选框同样受「跳过聚焦」（零回写零丢失）——均登记，随该面下次触碰收。
- **状态行**：✅ **已收口 2026-09-18**（全档冻结——不再回改）。
- **#102 落地核验（父侧）**：两项全闭 ✓（① AC-W4 改语义形态（行为机判命令复跑 **15/15 pass** + 绑定在位静态核对，**不再按 grep 计数判**）+ 同轮 AC 表八行逐行核（AC-W5 = 值 0 的删除完整性断言 ⇒ 非同类）；② 四档拆分规划登记（拆点 + 触发条件，**不执行拆分**））。
- **父侧三裁（承 #102 上抛）**：① **AC-W5 字面同式收正**——需求档 F-W12 判据句已改「按**实质**零残留（`grep` 命中按实质判：留痕注释 / 同族同名不计）」（父侧直接执行 · 可 revert）② §5 面两句失效表达（§5.1 末句 / §5.3 AC-W4 行）**以 §2.12 处置记录为权威**（该两处为收正前时点值；本档冻结不回改，以本条为消解事实）③ **拆分规划立台账活视面**（技术待办 · 触发 = 条件：净增 >490 先拆 / 该档下次触碰）。
- **结论**：本批 6 条需求 + 5 条 AC + 3 条必红全闭；P0-1（静默删 proxy 整块）**修复前/后对照实证成立**。
- **台账**：#89 ⇒ **已核销**。

（父代理）
