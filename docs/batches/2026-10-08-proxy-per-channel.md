# 2026-10-08 · proxy 逐渠独立（去全局闸）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-08 · 来源 = 用户 2026-10-07 19:04 裁「2b」（A2 双闸去留 = 去全局闸·逐渠独立）+ 2026-10-08 10:49「开」——点火；来源 = parity 批设计 §2.9②（台账 #1042）。
> 台账 = #1042（core · 归批）。前情 = docs/batches/2026-10-07-provider-config-parity.md §2（已收口 2026-10-08）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-08
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 点火与批前合并扫描（2026-10-08 10:5x · 主 agent）

- **点火**：用户 2026-10-08 10:49「开」——承 2026-10-07 19:04 裁「2b」（A2 双闸去留 = 去全局闸·逐渠独立）；来源 = parity 批设计 §2.9②（前情批已收口，见档头）。
- **批前合并扫描**（台账同面）：**并入** = #1037（`core/proxy.mjs` 303 行越 300——本批触碰 ⇒ 先拆后改）∥ #1048（`probeTargetOf` 不携 headers ∥ 向导 upsert proxy 径——同 provider-flow 面）∥ #1049（CLI 向导逐渠问句——同板评估）∥ #1040（VSC `_delKey` 死码——同文件面顺手）。**不并**（写明理由）= #1041（onboarding 交棒链本批零触）∥ #1051 ∥ #1053（协议面未开）∥ #1052（桌面段出口面未开）。
- **范围**：去全局闸机制 ∥ CLI `/config` 全局面语义重定 ∥ 三端 UI 提示随动。
- **授权口径**：用户「开」（全链）；评审点火与 §4 批准到点请点（默认不代签）。
- **设计轮** = eng-designer #2 已派（在跑）。

### 1.5 用户授权（自动跑 · 2026-10-08 11:38）

**用户原话**：「自动跑」⇒ 本批**设计评审点火权** ∥ **§4 用户批准权（代签）** ∥ **修正/实施轮派发** ∥ **收口核销与提交**——均委托父侧自动执行，直至本批收口。

**父侧自缚三条（本仓惯例·先例同形）**：① 代签仅当三条件齐备（评审 pass 0🔴 ∧ 修正轮已落地并逐条核验 ∧ token 已签发），每次代签在 §4 写明「父侧代签（用户 11:38 授权）+ 依据」；② 新范围 ∥ 用户口径裁决 ⇒ 停下、只摆那一条；③ 破坏性/不可逆 ⇒ 先停。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（实施审计 S1（在案限）收正——修正块已落 · §2.13；实施轮设计面回填落讫 · §2.14；A/B 三点裁定落定——待裁注解除 ∥ 补步设计落法 · §2.15）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目（台账 #1042——并入 #1037 ∥ #1048 ∥ #1049 ∥ #1040）

| 号 | 条目 | 处置（设计轮） | 判据面 |
|---|---|---|---|
| #1042 | 逐渠代理独立（去全局 `proxy.model` 闸）：核判定式收正 ∥ 三端随动 ∥ CLI 全局面重定 | 设计落（上抛项除外——2.7） | 批内件（2.5）+ 走查 |
| #1037 | `proxy.mjs` 拆档（303 行——先拆后改） | 设计落（拆法 = 2.3.2） | 批内件 T1 |
| #1048 | ① `probeTargetOf` 字段面携 `headers` ∥ ② `cli/setup-wizard.mjs` 探针改探合并条目 | 两处裁 = 对齐（落法 = 2.3.4） | 批内件 T3 ∥ T5 |
| #1049 | CLI 两向导是否随加「走 proxy」问句 | 评估毕——上抛（2.7 项 3） | 待裁（补步 ⇒ 届时加腿） |
| #1040 | `_delKey` 死码收尸（`thincoder-vscode/webview/settings-providers.js:39-41`） | 设计落（只删本体；宿主链保留） | 批内件 T7 |

### 2.2 设计档落点（逐处 · 本设计轮已落）

1. `docs/core/design/PROXY.md`（主档）：§1 归一键形收正（`{uri,web}`；`model` 去留注）∥ §2 拆档落法 ∥ §3 代价面句 ∥ §4 `model` 行 ⇒ 逐渠独立（+ VSC 第二注入点点名 + 探针字段面句）∥ §5 /config 重定型待裁标记 ∥ §6.1 拆档坐标计划 ∥ §6.2 批内件指针 ∥ §7 **D-PX1 改写 + D-PX10** ∥ 变更记录。
2. `docs/vsc/design/SETTINGS.md`：§1 行内 proxy 句 ∥ §2.10 入口册 #3（`_delKey` 拟清·实施轮落）+ 判据域计数 **5 名 ⇒ 4 名** ∥ §2.16 ③ 生效面 ∥ ③′ 裁定 ∥ 落法 ∥ 同族同径（setup-wizard 改探合并条目）∥ 变更记录。
3. `docs/desktop/design/SETTINGS.md`：§1 **KD-75** ⑤ ∥ §2.16 项 7 ∥ 项 8 判据 ∥ 变更记录。
4. `docs/core/design/PROVIDER.md` §6.19 ② 句（口径单源改指 PROXY.md §4）。
5. `docs/desktop/design/IPC.md` `provider:models` 行 ∥ `docs/vsc/design/WEBVIEW-PROTOCOL.md` §13 `testProvider` 行 + `deleteProviderKey` 行（发射点 ⇒ 无）。
6. 需求档 = 主 agent 笔（报告项 = 2.8）。

### 2.3 机制设计

**2.3.1 判定面（本批核心）**——运营期判定 = **逐渠旗 ∧ `uri` 在案**：`injectProxy` 判定式收正（`p.proxyUri = p.proxy && uri ? uri : undefined`——`thincoder-core/proxy.mjs:70` 现形；不再读 `model`）；`resolveProxyConfig` 返形去 `model`（`{uri, web}`）。`uri` = 代理目标本体（非门槛——唯一 `proxy.uri` 不变）。

**双注入点清单（设计轮实核——关键发现；批档交接只点了核一处）**：① 核 `injectProxy`（CLI ∥ 桌面经核装配——调用 `thincoder-core/agent/assemble.mjs:71` ∥ `thincoder-cli/src/tui/cmd-config.mjs:71`）② **VSC `thincoder-vscode/src/extension/presets.mjs:134`（`providerFromConfig`——VSC 运行期自建 provider，自身带 `proxyCfg.model === true` 合取；VSC chat/标题/探针窗经 `buildProvider` 消费）**——不修则 VSC 仍双门槛。③ 探针面 = `probeTargetOf`（三端同源）。VSC agent 装配（`src/agent/setup.mjs:136`）只读 `cfgProxy`（web 面），无第二注入。

**2.3.2 拆档（#1037——先拆后改）**：新 `thincoder-core/proxy-target.mjs`（`resolveProxyConfig` ∥ `resolveWebProxy` ∥ `isLoopbackTarget`）∥ 新 `thincoder-core/proxy-transport.mjs`（`streamHttpResponse` ∥ `tunnelHttps` ∥ `tcpConnectProxy` + `FETCH_TIMEOUT`）∥ `proxy.mjs` 留 `injectProxy` + `proxyFetch` 编排 + **facade 再出口**（消费面 import 零改——外部只 import `proxyFetch`）。

**2.3.3 迁移兼容（不动盘）**：不批量改盘；旧配置中已勾 `proxy: true` 的渠道**即刻生效**（原全局闸关时长期静默无效——正是用户报告问题）；`model` 键两案均不再参与运行期判定；旧版回退（旧版读同盘）= 其双门槛读法中旗仍挂 `model` ⇒ 行为回落（安全向——不意外走代理）。

**2.3.4 探针（#1048① ∥ ②）**：`probeTargetOf` 携 `headers`（仅 plain-object 才携——形如 `apiKey` 归一同律）∥ `cli/setup-wizard.mjs:60` 改探**合并条目**（既有渠道携盘上 `proxy` ∨ `headers`——探针 ≡ 写后运行态；upsert 本就保留 `proxy`/`headers`，实核）。

**2.3.5 全局面（CLI /config）**：重定形 = 上抛 2.7 项 2（`proxySummary` ∥ 菜单行随形落）。**现无渠级旗编辑径**（CLI 只有 add 流问句——实核 provider-admin 四流）——任一删行案需补径或登记（见 2.7）。

**2.3.6 `_delKey` 收尸（#1040）**：删 `settings-providers.js:39-41` 本体（全仓零调用实核）；宿主链（`deleteProviderKey` → `panel-messages.mjs:298` → `panel-settings-push.mjs:31` → `settings.mjs:299`）保留（协议面——「仅删钥」入口另议时一并处置）。

### 2.4 受影响文件与测试面（现读行数 = 2026-10-08 实读；Δ = 实施轮回填——2026-10-08 按盘实读）

| 面 | 文件（现读） | 改动 | Δ |
|---|---|---|---|
| 核 | `thincoder-core/proxy.mjs`（303） | 拆档 + 判定式收正 | **→ 50**（三档口径 = `PROXY.md` §2——按盘实读） |
| 核 | `thincoder-core/proxy-target.mjs`（新） | 新档（resolve* ∥ loopback） | **→ 54**（按盘实读） |
| 核 | `thincoder-core/proxy-transport.mjs`（新） | 新档（tunnel ∥ 流 ∥ tcp ∥ 常量） | **→ 245**（按盘实读——含同窗 #1065 集成；本批落盘值 219） |
| 核 | `thincoder-core/provider-flows.mjs`（248） | `probeTargetOf`：判定式 + `headers` | **+2**（现读 250） |
| 核 | `thincoder-core/config.mjs`（494） | `normalizeProxy` 去 `model`（两行改写） | **±0**（A 案已落——两行改写；#1009 在册） |
| 核 | `thincoder-core/config-io.mjs`（283） | `addProviderEntry` 注释收正 | **±0**（注释随正） |
| CLI | `thincoder-cli/src/tui/cmd-config.mjs`（488） | `proxySummary` ∥ 菜单行（随重定型） | **−2**（形A 已落——现读 **486**；≤500 照在） |
| CLI | `thincoder-cli/src/tui/provider-admin.mjs`（242） | 问句尾注去「needs global proxy.model on」（`:74` ∥ `:102`） | **±0**（注释随正——问句尾注 ×2） |
| CLI | `thincoder-cli/src/cli/setup-wizard.mjs`（96） | 探针改探合并条目（#1048②）∥ 末问「走 proxy」（#1049） | **+13**（现读 109） |
| CLI | `thincoder-cli/src/tui/wizard.mjs`（247） | 末问「走 proxy」——`showPicker` 同形（#1049） | **+9**（现读 256） |
| CLI | `thincoder-cli/src/tui/index.mjs`（263） | 装配注入 `showPicker`（#1049——写域清单外，报告随附） | **+1**（现读 264） |
| VSC | `thincoder-vscode/src/extension/settings.mjs`（406） | 注释随正 ∥ `proxySettings` 出形注释 ∥ `saveProxySettingsFromPanel` 重建去 `model`（`:251-257`） | **−1**（A 案已落——写链重建；现读 405） |
| VSC | `thincoder-vscode/src/extension/presets.mjs`（192） | `providerFromConfig` 门句去 `model`（`:134`）+ 注释（`:131-132`） | **±0**（现读 192——门句收正 ∥ 注释） |
| VSC | `thincoder-vscode/webview/settings-env.js`（203） | `#px-model` 行全消（A 案：`:56` 行 ∥ `:75` ∥ `:87` ∥ `:108`） | **−8**（A 案已落——现读 195） |
| VSC | `thincoder-vscode/locales/{zh,en}.json`（298） | `settings.proxyModel` ∥ `proxyModelHelp` 删（A 案）+ `proxyRowTitle` 值改 | **−2**（A 案已落——两语同；现读 296） |
| VSC | `thincoder-vscode/webview/settings-providers.js`（175） | `_delKey` 删（`:39-41`——#1040） | **−3**（本批；现读 **188**——同窗 #1053 批随动并计） |
| 桌面 | `thincoder-desktop/renderer/views/settings-sections-env.mjs`（137） | `proxy.model` 行删（A 案——`:87-94`） | **−8**（A 案已落——现读 129） |
| 桌面 | `thincoder-desktop/renderer/mount-settings-reads.mjs`（206） | 读切片去 `model`（`:167`——A 案） | **±0**（A 案已落——读切片 ∥ 缺省形） |
| 桌面 | `thincoder-desktop/src/main/settings-env.mjs`（95） | 白名单 ∥ 校验去 `model`（`:55` ∥ `:58`）+ 默认形（`:25` ∥ `:33`） | **−2**（A 案已落——现读 93） |
| 桌面 | `thincoder-desktop/renderer/i18n-views.mjs`（408）∥ `i18n-settings.mjs`（158） | `settings.proxyModel` 删 ∥ `proxyRowTitle` 值改 | **−2 ∥ ±0**（A 案已落——现读 406 ∥ 158） |
| 桌面 | `thincoder-desktop/src/main/providers.mjs`（324） | 注释随正（`:272-273`） | **±0**（`:298` 坐标注释留设计面——§5 报表项 5） |
| 批内件 | `docs/batches/2026-10-08-proxy-per-channel.test.mjs`（新） | 本批件（2.5 用例） | **→ 448**（已落——按盘实读；T1–T8 + W1 ∥ W2——10/10 绿） |
| 随正 | `2026-10-07-provider-config-parity-cli.test.mjs`（127）`:107-127` ∥ `-desktop.test.mjs`（377）`:246-256` ∥ `2026-09-29-parity-b10-ui-w1w4.test.mjs`（246）`:33-51` ∥ `2026-09-29-desktop-rebuild-fidelity-M604.test.mjs`（522）`:496` | 双门槛断言 ⇒ 逐渠断言随正；M604 选择器随 A 案（B 则另定） | 结构不变（±≤10；批内件不计线——M604 不拆，§2.6 项 8）；**随正已落**——复跑 21/21 全绿（cli 4 ∥ desktop 6 ∥ b10 11）；M604 原档以 tmp 副本整档替换已落（§5） |
| 文档 | 6 档（2.2 表——本设计轮已落） | 见 2.2 | — |

### 2.5 验收对照（机检用例——批内件）

- **T1 拆档面**：三档在盘；`proxy.mjs` ≤300 咨询线；facade 导出集 ⊇ 旧导出七名（`resolveProxyConfig` ∥ `resolveWebProxy` ∥ `isLoopbackTarget` ∥ `injectProxy` ∥ `streamHttpResponse` ∥ `tunnelHttps` ∥ `proxyFetch`）。
- **T2 判定式**（`injectProxy` 三态 × `model` 键两值）：旗 ∧ `uri` ⇒ `proxyUri = uri`；旗 ∧ 无 `uri` ⇒ `undefined`；无旗 ⇒ `undefined`；盘上 `proxy.model` 真 ∥ 假零影响。
- **T3 探针字段面**（`probeTargetOf`）：同 T2 三态 + `headers`（plain object ⇒ 携；缺 ∥ 非法 ⇒ 零键）。
- **T4 VSC 门句**：`presets.mjs` 源零 `proxyCfg.model` 命中 + 行为腿（假 config：旗 + `uri` ⇒ `proxyUri` 在；无 `uri` ⇒ 零）。
- **T5 #1048②**：`setup-wizard` 探针目标（tmp config：既有渠带旗 ⇒ `proxyUri` 在；新渠 ⇒ 零）——探针 ≡ 写后运行态。
- **T6 文案面**：`settings.proxyModel` 两语零命中（A 案）∥ `proxyRowTitle` 值零「proxy.model」字样（两语两端）∥ `provider-admin` 问句尾注零残留。
- **T7 #1040**：`webview/settings-providers.js` 零 `_delKey` 字面。
- **T8 全局面**（A 形腿）：VSC `settings-env.js` 零 `px-model`；桌面 env 树零 `proxy.model` 节点；CLI 菜单随形（形裁决后落腿）。
- **T9 随正面**：四件复跑绿（cli ∥ desktop ∥ b10 ∥ M604）。
- **T10 需求面**：2.8 报告项由主 agent 闭合（六段界：需求档非本席笔）。

### 2.6 关键决策（本批）

1. 运行期判定 = **逐渠旗 ∧ `uri`**（无全局闸）——用户 2026-10-07 19:04 裁「2b」的落法。
2. 拆档三段 + facade（消费面 import 零改）。
3. 迁移 = 不动盘 ∥ 旧旗即刻生效（disclose）；`model` 键两案运行期均不读。
4. `probeTargetOf` 携 `headers`（仅 plain object——形状门防脏字段进目标对象）。
5. `setup-wizard` 探针 ≡ 写后运行态（合并条目）。
6. `_delKey` 只删本体、宿主链保留（协议面）。
7. 随正面四件批内随正（归档批内件·历史档——非产品面）。
8. **批内件（含历史档随正件）不计线**——随批留存 · 不进仓套件（`docs/core/design/TESTING.md` §2）；越 500 豁免先例在册（裁「豁免登记」——890 ∥ 625 行件 · `docs/batches/2026-09-30-cross-end-digest-recovery.md` §6 收口轮）⇒ **不设 500 硬限拆分义务**：M604（522——2026-10-08 实读）越 500 字面限 = 本豁免面（随正两处断言，不拆）。

### 2.7 上抛项（待裁——3 项）

1. **`proxy.model` 键去留**：**A 退役**（本席倾向——归一键形 ∥ 三端全局面 UI ∥ 写链 ∥ 词表全清；键名旧义（闸）已死，残留 = 误读源）∥ **B 保留为新渠道建档默认**（新渠道表单初值 = 该值；运行期仍逐渠——b2「缺旗回落读全局」被 2b 裁排除）。**每案面差** = `normalizeProxy` 形 ∥ 三端全局 UI（VSC env 卡 ∥ 桌面 env 段 ∥ CLI 菜单行）∥ 写链（`saveProxySettingsFromPanel` ∥ `settings-env.mjs` 白名单）∥ 词表（`settings.proxyModel` 两语两端）。**B 案补充义务** = 词表值改（去 code token——种子 ⑥ 顺正）。**承载落点（在飞标记——2026-10-08 已注）** = `docs/vsc/design/SETTINGS.md` §2.8 ∥ `docs/desktop/design/IPC.md` `settings:env` 行。
2. **CLI `/config` 全局面重定形**：**形B 改行 = 逐渠管理**（本席倾向——旧全局控制位直系继任；`/config → Proxy` 单家；小菜单循环复用）：`Model requests (per-provider)…` ⇒ 渠道 picker 逐渠开关（写 `providers[].proxy` 同键）∥ **形A 删行 = 最小**（删行即止；代价 = CLI 无渠级旗编辑径 ⇒ 需登记路径债）∥ **形C 删行 + 渠道管理补流**（provider-admin 第五流；编辑径归渠道族）。
3. **CLI 向导补步（#1049）**：**维持**（本席倾向——两向导无 URI 问句、旗多惰性；端差在册）∥ **补步**（首启渠道同携问句）。**联动**：若上抛 2 取删行且不补编辑径 ⇒ 本项建议改取补步（否则 CLI 旗面无可写径）。

### 2.8 报告项（主 agent 笔 / 登记——本席零触）

1. **需求档五要素缺位**：`docs/core/requirements/CONFIG.md` 无 #1042 条目（现档仅「代理」根层承载）；建议条目 = 「逐渠代理独立（去全局闸）」+ 判据句（验收 = T2 ∥ T3 ∥ T6）。
2. **`docs/vsc/requirements/WEBVIEW.md:34`（F-W17 入口册）**：「死 handler 1 = `_delKey`」随收尸失效（改 = 死 handler 0）；live 计数 2 不变。
3. **#1009（`config.mjs` 贴 500 硬限）**：本批 `normalizeProxy` 改 = 两行改写、±0 行——非「增量」；若判触发（「config 面增量批」）⇒ 请裁。
4. **#1038（VSC `settings.mjs` 越 300 咨询线 · 403→406）**：本批触碰该档（−1 行：注释 ∥ 字段级）；触发条件「随该档下次触碰」字面命中——本批不做结构拆（范围外），触发改判「下次结构性触碰」候裁。
5. **PROXY.md 坐标漂移（设计轮顺修）**：`injectProxy` 调用点旧记 `make-agent.mjs:29-30` ⇒ 实为 `agent/assemble.mjs:71`；VSC 配置面旧记 `thincoder-vscode/src/config-io.mjs:146` 已随核迁移退场 ⇒ 改指核 `config-io.mjs` 引用。

### 2.9 边界（本批不做）

桌面/VSC 渠级旗**写语义**（行开关已对齐——零改）∥ 每渠独立 URI（`proxy.uri` 仍单值）∥ `web` 字段 ∥ loopback 旁路 ∥ `insecureTls` ∥ 死链宿主删除面（`deleteProviderKey` 链）∥ 「仅删钥」入口 ∥ 两向导步骤链（#1049 待裁）∥ 测试树/仓库套件 ∥ 批内件拆分面（批内件不计线——随正件与 M604 不拆；§2.6 项 8）。

### 2.10 设计评审轮 1 修正（fix 轮）块（2026-10-08）

承批档 §3 轮次 1 发现 1–7（发现 8 = 已裁「非问题」——零动作）。逐号处置（明细 = 各档变更行 ∥ fix 轮交付报告）：

1. vsc `SETTINGS.md` §2.10 收齐：门调用点清单与计数（入口 3 无载体 ⇒ **5 处**）∥ 判据句计数（发射 **5 名 ⇒ 4 名**）——`_delKey` 拟清（实施轮落）态；同节死指针一致性面当场修——门调用点清单 ∥ 计数映射 ∥ 判据句三行坐标按 2026-10-08 现读重锚（逐条见报告）；同节其余漂移坐标（抽样：入口册行 ∥ `:296` 桥位 ∥ `:286` 越 EOF 位）未触——报告留存（随节内「实施后回填面」消解）。
2. 时态正名：「已清」⇒「拟清（实施轮落）」——vsc `SETTINGS.md` 三处（入口册 #3 ∥ 判据域边界 ∥ 设计轮行）本轮落；§2.2 表行同口径以本块追正；`WEBVIEW-PROTOCOL.md` 两处（`:494` ∥ `:755`）缓投（#10 冻窗——待窗过续投）。
3. `PROXY.md` §4 补 #1048① 机制落点（`probeTargetOf` 携 `headers`——仅 plain-object；来源面 = 盘上条目 ∥ 表单；消费点 = `list-models` 请求头展开）；批内件「探针字段面」腿对位已核（§6.2 在位——现 `:129`，无需改文）。
4. `PROVIDER.md` 补 2026-10-08 变更条目 + 落点指针行（记录面补录——发现 4）；口径单源句改述（去并列形）。
5. `PROXY.md` §5 补 #1049 落点指针（评估毕 = 上抛——承载面 = 本档 §2.7 项 3；无实体机制落点）。
6. `PROXY.md` §1 `model` 键注 ∥ §5 菜单行注：两案映射与分项关系标注（字面「A/B」不互指）；案B 行义展开（初值来源 ∥ 落点 ∥ 词表）。
7. vsc `SETTINGS.md` 设计轮行节号收正（「§1」⇒「§2.1」）；§1 卡行 + 待裁注。

不动项（明列）：#1040 清除本体（产品码——实施轮）∥ `docs/vsc/design/WEBVIEW-PROTOCOL.md` 零写（#10 冻窗）∥ 设计决策重开（§2.7 零动）∥ 发现 8 ∥ 批外档零触 ∥ 伪差零动作（`PROXY.md:31` 引文验签「未中」= 含 `**` 强调符所致——父侧实读复核内容实存）。**零新语义**（= 评审发现 ∥ 裁定 ∥ 死指针重锚的直接导出项）。

### 2.11 #12 收尾续笔块（fix 续投——#10 冻窗解除后）（2026-10-08）

承 §2.10 块缓投项 ∥ 报告留存项；父侧裁 = fix in place，不登记。逐处明细 = 收尾续笔交付报告：

1. `docs/vsc/design/WEBVIEW-PROTOCOL.md` 两处时态落盘（§13 `deleteProviderKey` 行 ∥ 其设计轮变更记录条）：「`_delKey` 死码已清」⇒「拟清（实施轮落）」——④ 列「协议保留」义零改。
2. `docs/vsc/design/SETTINGS.md` §2.10 六处漂移坐标按 2026-10-08 现读重锚：`:286` ∥ `:207`（卡 HTML 载体 `settings-providers.js:182 ⇒ :123`）∥ `:289`（`_removeProvider` `:64-66 ⇒ :50-52`）∥ `:296`（`input.js:125/:33 ⇒ :128/:36`）∥ `:204`（handler `:45-47 ⇒ :46-48`）∥ `:205`（handler `:27-29 ⇒ :28-30`）。
3. 两档变更行随补（各一行）；逐处回读核讫。
4. 余量（报告项——未触）：`SETTINGS.md` 同档抽样外死指针——`settings-providers.js:182` 余处（`:277` ∥ `:617`）∥ `settings-providers.js:48-49` 族（`:207` ∥ `:277` ∥ `:288` ∥ `:617`）——留该批收口 ∥ 文档卫生批面。

**零新语义**（时态 ∥ 坐标；产品码零触）。

### 2.12 设计评审轮 2 修正（fix 轮）块（2026-10-08）

承批档 §3 轮次 2 发现 1–6（必收）∥ 7–8（🔵——随拍）。逐号处置（明细 = 各档变更行 ∥ fix 轮交付报告）：

1. ① §2.2 表行时态收正：「（死码已清）」⇒「（`_delKey` 拟清·实施轮落）」——§2.10 第 2 条「追正」本块兑现。
2. ② `PROXY.md` §2 同族收窄指针重锚——`PROVIDER.md:102 ⇒ :114`（§6.3）。
3. ③ §2.4 补 `config-io.mjs` 现读（283——2026-10-08 实读）；随正行 Δ 收数值形（结构不变 · ±≤10）。
4. ④ `cmd-config.mjs` 行补上限约束（改后 ≤500 硬限——越线则先拆后改）；随正件（批内件·历史档）豁免口径入 §2.6 项 8 ∥ §2.9（批内件不计线——M604 522 不拆）。
5. ⑤ A/B 未裁 ⇒ 待裁注落两端承载（vsc `SETTINGS.md` §2.8 三处 ∥ 桌面 `IPC.md` `settings:env` 行）；§2.7 项 1 补承载落点。
6. ⑥ 桌面 `SETTINGS.md` 两处「单源并列」收正（落点指针 + 单源 = `PROXY.md` §4）。
7. ⑦ §2.4 主档余量收同源（≈75 ⇒ ≈50——与 `PROXY.md` §2 三档口径同值）；§2.10 项 3 坐标按盘收正（`:125 ⇒ :129`）。
8. ⑧ `PROXY.md` §4 首行开关列收正（「`model`（逐渠）」⇒「模型请求（逐渠 `providers[].proxy`）」）。

**零新语义**（= 评审发现 ∥ 裁定的直接导出项）；产品码零触（fix 轮）。

### 2.13 实施审计 S1（在案限）收正块（fix 轮 · 2026-10-08）

承实施审计轮发现 S1（§2.3.1 判定式字面缺 env 排除——与设计正典相抵；父侧裁 = **在案限**）：§2.3.1 现形行只给「去 `model`」后的合式，未给 `uri` 取值的**在案 guard**——照字面落码则 env 回供可开模型代理。收正（**零新语义**——全部由设计正典直接推得）：

**① §2.3.1 现形行收正**：`injectProxy` 判定式收正定形——`uri` 取值加**在案 guard**：`config?.proxy != null ? resolveProxyConfig(...).uri : null`（`config` = `injectProxy` 第二参；`proxy` 字段不在案 ⇒ `uri` = `null`）；再合逐渠旗：`p.proxyUri = p.proxy && uri ? uri : undefined`（不再读 `model`）。**env 回落路径不供模型代理**——逐渠旗只对在案 `uri` 生效。

依据 = `docs/core/design/PROXY.md:24`（env 路径不供模型——逐渠旗只对在案 `uri` 生效）∥ `:138`（D-PX1——per-provider `proxy: true` **且** `proxy.uri` 在案 ⇒ 该渠走代理）∥ `:141`（D-PX4——env 回落不代理 model 请求）。

现位 = `thincoder-core/proxy.mjs:18-23`（拆档后；2026-10-08 实读——原记 `:70` = 拆档前位）；实施侧同轮同形（eng-coder——1 行；落位以盘为准）。

**② §2.6 已定项 1 补「在案」限定**：读作「运行期判定 = **逐渠旗 ∧ `uri` 在案**（无全局闸）」。

**③ §2 同族字面清扫**（他处重复——读法随本块）：

- §2.3.3（`:54`）「旧配置中已勾 `proxy: true` 的渠道**即刻生效**」∥ §2.6 项 3（`:106`）「旧旗即刻生效（disclose）」：生效读作 **旗 ∧ `uri` 在案** 双合（env 回供不计）。
- §2.5 T2（`:92`）三态读作：旗 ∧ `uri` 在案 ⇒ `proxyUri = uri`；旗 ∧ `uri` 不在案（含 env 回供）⇒ `undefined`；无旗 ⇒ `undefined`。
- §2.5 T3（`:93`）「同 T2 三态」——读法随 T2。
- §2.5 T4（`:94`）行为腿读作：旗 + `uri` 在案 ⇒ `proxyUri` 在；不在案 ⇒ 零。
- §2.5 T5（`:95`）条件读作：既有渠（旗 ∧ `uri` 在案）⇒ `proxyUri` 在；新渠 ⇒ 零。
- 两注入点同判（§2.3②）：在案限对两注入点同源；VSC 点现形已按在案读（`presets.mjs:133-135`——`target.proxy === true ∧ proxyCfg?.uri`；§2.3② 所记 `model` 合取 = 收正前态）——核点 guard 按本块落，VSC 腿承载 = T4。

**④ 取代关系写死**：§2.3.1 `:48` 现形形式句以本块 guard 形为准（前句为其前身——实现与用例一律按本块）；本块所列同族各处读法同随本块；append-only——原行不回改（§2 前文与之相抵处以本块为准）。

**零新语义**（= 实施审计发现 S1 ∥ 父侧裁定 ∥ 设计正典三处的直接导出项）；射程 = §2 本块（§1 ∥ §3–§6 ∥ 产品码 ∥ 设计档 ∥ 需求档零触）。

### 2.14 实施轮设计面回填块（fix 轮 · 2026-10-08）

承 §5 报表项 1（设计档回填面）——批收口前设计面收官。逐处明细 = 回填轮交付报告：

1. `docs/core/design/PROXY.md`：拆档坐标按实施后现盘重锚（§2 五处邻域 + §6.1 表 + 同族旧单档引用随正——行号逐处实读）∥ 三档行数按盘实读回填（54 ∥ 241 ∥ 50——`proxy-transport.mjs` 含同窗 #1065 集成；本批落盘值 219）∥ §2 例外注断行（396 ⇒ ≤300）。基准 = 2026-10-08 现盘实读。
2. `docs/vsc/design/SETTINGS.md`：§2.10 入口册 #4 载体坐标按现盘收正（`settings-providers.js:123 ⇒ :132` ∥ 编辑行取消重建位 `:48-49 ⇒ :22-23`）∥ `_delKey` 时态四处（`:185` ∥ `:198` ∥ `:206` ∥ `:328`）「拟清（实施轮落）」⇒「已清」。
3. `docs/vsc/design/WEBVIEW-PROTOCOL.md`：§13 `deleteProviderKey` 行时态同拍收正（`:495`）。
4. 本档 §2.4 Δ 列按实施后收正（零触面依 §5 决策表——A/B ∥ 形裁候判）。

报告项（本席面外——未触）：`settings-providers.js:47` 注释（产品码——卡 HTML 坐标 `:123 ⇒ :132` 待产品码腿）∥ §2.11 余量族（`SETTINGS.md:277` ∥ `:286` ∥ `:287` ∥ `:288` ∥ `:639`——同族死指针待扫）∥ 桌面 `providers.mjs:298` 坐标注释（产品码）∥ chunked 面（#1065——`proxy-chunked.mjs` 已见盘 ∥ `proxy-transport.mjs` 集成已入 ∥ §6.1 该行「拟落」随其回填）∥ 批内件（测试腿 #41——`.test.mjs` 已落 271 行）。

**零新语义**（坐标 ∥ 行数 ∥ 时态——全部实施后按盘实读直接导出）；产品码零触（fix 轮）。

### 2.15 A/B 三点裁定落定块（fix 轮 · 2026-10-08）

承用户 2026-10-08 三点裁（13:12「应该去掉」∥ 13:19「项2 也跟着没了」∥ 13:20「项3 应该补」）∥ 父侧派单（本腿三件：待裁注解除 ∥ 裁定记录 ∥ 项 3 补步设计落法）。**§2.7 各点状态以本块为准**（append-only——原行不回改）。逐处明细 = 本腿交付报告。

**① 项 1 = A（`proxy.model` 键退役）——施行已落。** 实施面 = §5「A 案落」块（11 档产品 + M604 tmp；父侧报表项在册：M604 原档替换 ∥ 桌面残留 2 处登记）。设计面待裁注解除（逐处）：`docs/core/design/PROXY.md` §1 `model` 键注（:19-21）⇒ 定案单形 A ∥ 归一句去 `model` 支（:22）∥ §7 D-PX1 尾注（:141）；`docs/vsc/design/SETTINGS.md` §1 卡行（:19）∥ §2.8 三处（回填表 ∥ 逐字段载荷判据 ∥ 路径册 #1 子路径）；`docs/desktop/design/IPC.md` `settings:env` 行（:140）——投影缺省三键 ⇒ 两键（`uri` / `web`）。

**② 项 2 = 形A（CLI `/config` 该行删行即止）——施行已落。** 实施面 = §5「A 案落」块（父补裁纳入 `cmd-config.mjs`：菜单行删 ∥ `proxySummary` 去 `model:` 段 ∥ seturi 模板去 `model:false`）。设计面：`PROXY.md` §5 菜单块 Model requests 行 ⇒ 删行形（:94-96 删）∥ `proxySummary` 条收述（:104——坐标按盘：菜单项 `:118`–`:124` ∥ 守卫 `:142` ∥ 消费 `:349` ∥ `:363` ∥ `:388`）。**路径债句随裁收述**：§2.7 项 2 形A 成本注（「CLI 无渠级旗编辑径 ⇒ 需登记路径债」）随补步立案**不成立**——渠级旗写入径配套已齐（删行 + 两向导问句）；零新增债登记。

**③ 项 3 = 补步（两向导携「走 proxy」问句）——设计落；实施 = 产品腿另轮。** 落点 = `PROXY.md` §5 #1049 条（:105 改写）+ 本块。定位实核 = `thincoder-cli/src/cli/setup-wizard.mjs` ∥ `thincoder-cli/src/tui/wizard.mjs`（§2.3.5 口径——provider-admin 四流之外）；问句形 ≡ add 流既有问句（`provider-admin.mjs:74` ∥ `:102`——零新形）；旗写入点 = 新渠条目 `proxy` 字段（随各自落盘一次写；探针条目携答案——探针 ≡ 写后运行态，同 #1048② 判据）；验收 = 批内件增量腿（两向导双案）+ 首配向导假 HOME 实跑读数。备选（否决）= 向导内菜单步（同问句二次渲染——与「零新形」相抵）。

**设计档落点**（本腿已落）：`docs/core/design/PROXY.md`（§1 ∥ §5 ∥ §7 D-PX1 ∥ 变更记录）∥ `docs/vsc/design/SETTINGS.md`（§1 卡行 ∥ §2.8 三处 ∥ 变更记录）∥ `docs/desktop/design/IPC.md`（`settings:env` 行 ∥ 变更记录）。

**零新语义**（= 三点裁定 ∥ 已裁设计的直接导出项）；射程 = 本块 + 三涉档（改动面）；§1 ∥ §3–§6 ∥ 产品码 ∥ 需求档零触。

**块内坐标补记**（§2.15 上列各行号 = 改前盘面——改后现读）：`PROXY.md` §1 `model` 键注 `:19` ∥ 归一句 `:20` ∥ §5 菜单块 `:89`–`:94`（Model Requests 行已删）∥ `proxySummary` `:99` ∥ #1049 条 `:100`–`:104` ∥ §7 D-PX1 `:139`；`docs/vsc/design/SETTINGS.md` 四处（`:19` ∥ `:119` ∥ `:136` ∥ `:149`）与 `docs/desktop/design/IPC.md` `:140` 同拍未移。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

评审范围限制（明示）：未声明 Document Map ⇒ 文档归属判据降级（按项目指南 AGENTS.md 与档内互指检视：六档皆各主题既有权威、未以新档承载既有章节、未发现归属违规）；未声明项目标准档 ⇒ 方法学按 AGENTS.md 与各档体例判（设计轮 ∥ 产品码零触 ∥ 批档 §2 承载一次性材料——体例一致）；批档 §2（落点表 ∥ 逐文件行数表 ∥ 验收 ∥ 用例）为评审范围外（见发现 8 与范围外注）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Doc contradiction（文档矛盾） | 🟡 | `docs/vsc/design/SETTINGS.md` §2.10 内 #1040 的随动未收齐：`:185` 仍作「门调用点 **6 处**（入口册 6 行 1:1）」并点名「`webview/settings-providers.js:57`（入口 3）」，与 `:206` 入口册 #3「**无 UI 载体**（`_delKey` 死码已清——2026-10-08 · 台账 #1040」相抵（入口 3 无载体 ⇒ 无门调用点）；`:198` 判据句仍作「域内删除入口发射 **5 名**全落确认门实参内」，而 `:327` 已作「域内删除入口发射 **4 名**（`deleteEmbedKey` · `deleteWebsearchKey` · `deleteMcpServer` · `removeProvider`）」——同节同一判据两种计数。 | 按 #1040 落点把两处随动收齐：`:185` 门调用点列表与计数（入口 3 改无载体项）、`:198` 判据句计数（5 名 ⇒ 4 名）；若清除尚未落盘，两处加在飞标记并统一时点。 |
| 2 | Doc contradiction（时态） | 🟡 | 「`_delKey` 死码已清」以完成态入档（`docs/vsc/design/SETTINGS.md:206` ∥ `:327` ∥ `:795`；`docs/vsc/design/WEBVIEW-PROTOCOL.md:754`），而 `SETTINGS.md:795` 同一笔同时声明「`_delKey` 死码已清（发射 5 名 ⇒ 4 名——#1040）。**产品码零触（设计轮）**」，且 #1040 在本批并入清单内——设计轮零触产品码与「已清」完成态相抵；若清除已在别轮落盘，档内未点名落轮与实读。 | 二者取一收口：属本批实施轮 ⇒ 改「拟清（实施轮落）」；已落 ⇒ 补注落轮与实读坐标（沿「设计轮续笔核验」时态收正先例）。 |
| 3 | Doc contradiction / Coverage | 🟡 | `docs/core/design/PROXY.md:171` 变更记录声称 §4 增「§4 `model` 行 ⇒ 逐渠独立（+ VSC 第二注入点 `presets.mjs:134` 点名 + 探针字段面 `headers`——#1048①）」，但 §4 正文（`:61`–`:70`）无 headers 语句——全档「headers」命中仅 `:109`（「原 `provider-headers.test.mjs`」旧件名）；#1048① 在范围内仅剩 `docs/vsc/design/SETTINGS.md:504` 与 `docs/core/design/PROVIDER.md:337` 两处括注「`headers` 字段面随行——#1048①」，且 `:504` 所示目标形 `probeTargetOf({ name: "", baseURL: url, apiKey, format, proxy: proxy === true })` 不含 `headers` 形参——字段来源面（盘上条目 ∥ 表单）未明。 | 在 §4（或 §6.2 对位行）补 #1048① 机制落点：明示 `probeTargetOf` 目标形是否/如何携 `headers`（来源面 = 盘上条目 ∥ 表单）与消费点，或把记录行改指实际落点；同拍核对 `:112` 批内件「探针字段面」腿。 |
| 4 | Doc contradiction | 🟡 | `docs/core/design/PROVIDER.md` §6.19 正文 `:337` 载本批内容（「**逐渠独立、无全局闸**：2026-10-07 19:04 裁「2b」· 2026-10-08 批落」＋「`headers` 字段面随行——#1048①」），而该档变更记录无 2026-10-08 条目、落点指针块（`:60`–`:66`）亦无本批行（全档「2026-10-08」唯一命中 = `:337`；末条为 `:633` 2026-10-07）——正文与记录面不同步（同批其余五档皆有条目）。 | 补 2026-10-08 变更条目 + 落点指针行（逐点：§6.19 ② 逐渠独立 ∥ 探针判定单源指针 ∥ #1048①）；同句「口径单源 = §4 ∥ VSC §2.16 ∥ 桌面 §2.16」建议改述为「三端落点」以免与单源纪律相抵。 |
| 5 | Requirements coverage | 🟡 | 并入清单四号中 `#1049` 在范围内无可见落点：仅 `docs/core/design/PROXY.md:171` 与 `docs/vsc/design/SETTINGS.md:795` 的合并名单点名（「并入 #1037 ∥ #1040 ∥ #1048 ∥ #1049」），六档正文 ∥ 判据 ∥ 用例腿均无对位；#1037（拆档）· #1040（死码）· #1048①②（探针面）皆各有落点。 | 逐号点名 #1049 的承载面（批档 §2 落点表或本族设计档一行落点指针）；若其即 §2.7 待裁位 ∥ 「文案面」腿，在档内明写对应关系，使四号合并可逐号对账。 |
| 6 | Clarity | 🟡 | 同一「上抛单源 = 批档 §2.7」在两处用两套选项集且无映射：`docs/core/design/PROXY.md:19` 作「A 退役 ∥ B 保留为新渠道建档默认」（键去留），`:77` 作「**本批重定·待裁**（形A 删 ∥ 形B 改为逐渠管理 ∥ 形C 删行+渠道管理补流——」（菜单行形态），且 `:19` 括注「差异面 = 归一键形 ∥ 三端全局面 UI ∥ 写链 ∥ 词表（随裁决落）」把键 ∥ 行 ∥ 三端 UI 绑成一面——两套选项是否同一决策的两个切面无判；「B 保留为新渠道建档默认」行义未展开。 | 统一为单一选项表（或标注两套选项的映射与先决关系），并把「B」的行义（新渠道建档时 `providers[].proxy` 初值来源 ∥ 落点 ∥ 词表）写明；三端全局面 UI 项可在各端档补对位待裁标记。 |
| 7 | Doc hygiene | 🔵 | `docs/vsc/design/SETTINGS.md:795` 记录「§1 行内 proxy 句 ⇒ 逐渠独立（去「双开关」）」——「行内 proxy 勾选 = `provider.proxy: true`」实住 §2.1（`:28`），§1 无对应句（节号指针错位）；另 §1 卡行 `:19` 仍作「Proxy（URI / web / model 双开关 / Test）」，机制义已由本批退役，UI 处置在待裁面内。 | 记录行节号改指 §2.1；`:19` 若保留现 UI 描述，建议加待裁/在飞注（或随裁决同拍改写），避免「双开关」词面与逐渠独立口径误读。 |
| 8 | Note | 🔵 | 判据 8（受影响文件行数注记）与验收面在评审范围内不可整验：本批逐文件表（现行行数 ∥ 增量）按体例住批档 §2（一次性材料，评审范围外），档内仅见拆档三档注记「三档预估 ≈75 ∕ ≈55 ∥ ≈205 行」（`docs/core/design/PROXY.md:31`）；「原档 303 行」当前读数与其余将改档（`presets.mjs` ∥ `provider-flows.mjs` ∥ `setup-wizard.mjs` ∥ `settings-providers.js` 等）的行数/增量无法在范围内抽查。 | 在批档 §2 的逐文件表上按盘复核行数与增量（跨 300 线者随拆分计划），并把需活档承载的行数注记回填本族设计档。 |

**计数**：🔴 0 · 🟡 6 · 🔵 2
VERDICT: pass

### 轮次 2（评审子代理）

评审范围限制（明示）：未声明 Document Map ⇒ 文档归属判据降级（六档皆各主题既有权威、未以新档承载既有章节——归属违规 0）；未声明项目标准档 ⇒ 方法学按 AGENTS.md 与各档体例判；源码 ∥ 批内件本体不在评审范围 ⇒ 涉码坐标只作「档内互证」，标 unverified 者不作结论。

轮次 1 各号修正核讫（发现 1–7 逐号落地，证据 = 各档现文）：① vsc `SETTINGS.md:185`「门调用点 **5 处**（入口册 5 行 1:1）」∥ `:198` ∥ `:327` 三处同计「发射 **4 名**」；② :206 ∥ :198 ∥ :327 皆「拟清（实施轮落）」+ `WEBVIEW-PROTOCOL.md:494` ∥ `:755`（续笔 `:757-758`）；③ PROXY.md `:83-84` 探针字段面注 + `:128` 批内件腿；④ PROVIDER.md `:69` 落点指针行 + `:686` 变更条目 + `:341` 口径单源改述；⑤ PROXY.md `:102` #1049 落点指针；⑥ PROXY.md `:19-21` 两案映射 + `:91-93` 菜单行注；⑦ vsc `SETTINGS.md:822` 节号「§2.1」+ `:19` 待裁注。发现 8（Note）后继：§2.4 表本轮已复核——见本表发现 3 ∥ 4。在飞项核讫（声明已知，不另立发现）：§2.11 项 4 余量死指针 ∥ §2.4 主档余量 ≈75（见发现 7）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Doc contradiction（文档矛盾） | 🟡 | §2.10 块第 2 条自称「§2.2 表行同口径以本块追正」（批档 `:135`），但批档 §2.2 第 2 行仍作「§2.10 入口册 #3（死码已清）」（批档 `:40`）——完成态未随正；而设计档侧（vsc `SETTINGS.md:206` ∥ `:198` ∥ `:327`、`WEBVIEW-PROTOCOL.md:494`）均已落「拟清（实施轮落）」。 | 批档 §2.2 第 2 行的「死码已清」改「拟清（实施轮落）」，或删去未兑现的追正句——二者取一，使时态与 #1040 在飞态一致。 |
| 2 | Doc contradiction（跨档指针） | 🟡 | `PROXY.md:37` 的「同族收窄 = `PROVIDER.md:102`」不指向对应内容：`docs/core/design/PROVIDER.md:102` 现文为 body 组装句（「`temperature` 按 `spec.tempRange` 钳位」），超时射程收窄句实住同档 `:114`（「**超时语义（废弃绝对墙钟）**」）。 | 指针重锚 `PROVIDER.md:114`，或改节指 `PROVIDER.md:§6.3`。 |
| 3 | 判据 8（行数注记形态） | 🟡 | 批档 §2.4 中 `thincoder-core/config-io.mjs` 行未注现读行数（同表他行皆「（NNN）」——对照 `:66` 的「`thincoder-core/proxy.mjs`（303）」）；「随正」行 Δ 作「小（批内件·历史档）」（批档 `:86`），非「≤±N ∥ structure unchanged」形。 | 两处按盘补齐：`config-io.mjs` 补（NNN）现读；随正行 Δ 给数值（≤±N）或「结构不变」式。 |
| 4 | 判据 8（越线面） | 🟡 | `cmd-config.mjs`（488）Δ 上限 +30 ⇒ 最坏 488+30=518 越 500 硬限，表内无拆案亦无上限约束；同表 M604（522）已越 500 硬限仍被改（Δ 记「小（批内件·历史档）」），无拆案亦无越线登记——对照：同批 #1038（仅越 300 咨询线）即登记报告项。 | 给 `cmd-config.mjs` 行加「≤500」上限约束或随形状补拆案；M604 行补拆案或越线登记；若「批内件·历史档」不受 500 硬限，在 §2.6 ∥ §2.9 明写该豁免口径。 |
| 5 | Doc landing / 待裁面 | 🟡 | A 案（§2.7 项 1）面差含「三端全局面 UI ∥ 写链（`saveProxySettingsFromPanel` ∥ `settings-env.mjs` 白名单）」（批档 `:114`），§2.4 已列端侧码改动（`:77` ∥ `:80-82`），但两处承载文段既无落点亦无待裁注：vsc `SETTINGS.md` §2.8（`:119` 回填表「`#px-uri` / `#px-web` / `#px-model`」∥ `:136`「`web` / `model` 缺席 ⇒ 保留磁盘值」∥ `:149` 路径册 #1 子路径）与 desktop `IPC.md:140` `settings:env` 行（「`proxy` = 核 `normalizeProxy` 投影缺省三键」——A 案下投影减键）。 | 两处随裁决落，或先加在飞/待裁注（沿 vsc §1 卡行先例）；§2.7 项 1 的每案面差点名该两处文档落点。 |
| 6 | Doc contradiction（单源收述未随正） | 🟡 | desktop `SETTINGS.md` 两处仍作「口径单源 = `docs/core/design/PROVIDER.md` §6.19 ∥ …」（`:31` KD-75 ⑤ ∥ `:193` §2.16 引言），而 `PROVIDER.md:341` 已按轮 1 发现 4 收述为「**口径单源 = `docs/core/design/PROXY.md` §4**」——同句并列形在端侧未随正。 | 端侧两处改述为落点指针（去「单源」并列），或标注与 `PROXY.md` §4 的先决关系。 |
| 7 | Note（记录面漂移） | 🔵 | 记录面数值 ∥ 坐标已随文漂移：批档 §2.4 主档行「→ ≈75」（`:66`）↔ `PROXY.md:35`「三档预估 ≈55 ∕ ≈205 ∥ ≈50 行」（声明已知、待随正）；§2.10 项 3「现 `:125`」（`:136`）↔ 现盘该句在 `PROXY.md:128`（「拆档 ∥ 逐渠判定 ∥ 探针字段面」）。 | 随修正轮同拍按盘收正两处读数。 |
| 8 | Note（词面残留） | 🔵 | `PROXY.md` §4 首行开关列仍作「`model`（逐渠）」（`PROXY.md:76`）——运行期开关已换 `providers[].proxy`（A ∥ B 两案下该键均不再参与运行期判定），词面与口径有误读风险。 | 随 A/B 裁决同拍改述（如「模型请求（逐渠 `providers[].proxy`）」）或加注。 |

**计数**：🔴 0 · 🟡 6 · 🔵 2
VERDICT: pass

## §4 用户批准（主 agent）

### 4.1 父侧代签（用户 2026-10-08 11:38 授权「自动跑」✓）

**三条件齐备** ✓：① **设计评审 pass** ✓（§3 轮次 2 · 🔴 0 · 🟡 6 ∥ 🔵 2——八条逐号核讫〔修正轮⑧/⑧ 落地〕）；② **修正轮已落地并逐条核验** ✓（§2.12 块 + 父侧实读：`:37` 重锚 `PROVIDER.md:114` ∥ `:76` 首列改述 ∥ 桌面 `SETTINGS.md:31` 单源收述 ∥ vsc `SETTINGS.md:119` 待裁注；八号 + 变更行 ×4）；③ **token 已签发** ✓。**代签依据 = §3 轮次 2「VERDICT: pass」+ 计数（🟡 6 ∥ 🔵 2）**。

**父侧裁定（承接上抛）**：M604 豁免口径支 = **认可**（批内件不计线——`TESTING.md` §2 + 先例在册；M604 不拆）；⑦ 坐标以盘为准（`:129`）；余量 ≈50 同源口径 = 认；「KD-4 裸号」改引 = 认。
**实施分派**：按 §2.3–2.5 落法分腿（拆档 ∥ 逐渠随动 ∥ 批内件 ∥ 随正四件）；**chunked 修复（#1065）候本批拆档落定后派发**（先拆后改——设计原定）。收口 = 父侧核验（档目/坐标/逐件跑 + 结算）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（产品腿 + 测试腿 + A 案腿 + #1049 补步腿（2026-10-08）——各自内部审计 ∥ advisor 收正，终态均 clean）



### 交付摘要（产品腿 · 2026-10-08 · eng-coder）

**落码面**：13 档（11 改 + 2 新）——全依 §2.3 落法；零触面依父裁（见决策表）。
- 新 `thincoder-core/proxy-target.mjs`（54 行）——`resolveProxyConfig`（返形 `{uri, web}`——设计应差①）∥ `resolveWebProxy` ∥ `isLoopbackTarget`；移段逐字。
- 新 `thincoder-core/proxy-transport.mjs`（219 行）——`streamHttpResponse` ∥ `tunnelHttps` ∥ `tcpConnectProxy`（+export）∥ `FETCH_TIMEOUT`（+export）；移段逐字。
- `thincoder-core/proxy.mjs`（50 行）——`injectProxy`（判定式收正 + 在案限）∥ `proxyFetch` ∥ facade 再出口（导出集 = 旧七名；消费面 import 零改）。
- `thincoder-core/provider-flows.mjs`——`probeTargetOf`：去 model 门 ∥ 携 `headers`（plain-object 门——缺/非法 ⇒ 零键）。
- `thincoder-cli/src/cli/setup-wizard.mjs`——探针 ≡ 写后运行态（合并条目 `{...existing, ...}`；upsert 保留 `proxy`/`headers`）。
- `thincoder-vscode/src/extension/presets.mjs`——第二注入点同判据（旗 ∧ `uri`）。
- `thincoder-vscode/webview/settings-providers.js`——`_delKey` 本体删（宿主 `deleteProviderKey` 链保留）。
- 随正注释 6 档：`config-io.mjs` ∥ `provider-admin.mjs`（问句尾注 ×2）∥ `cmd-config.mjs` ∥ VSC `settings.mjs` ∥ 桌面 `providers.mjs` ∥ `assemble.mjs`（表外——父批「随正」）。

**决策透明表**

| 项 | 处置 | 依据 |
|---|---|---|
| §2.7 项1/项2 面差「①–④」：`config.mjs:258-264` `normalizeProxy` 形 ∥ VSC `settings.mjs:250-259` 写链 ∥ `cmd-config.mjs` 摘要/菜单行/seturi 模板 ∥ 形注连带（`cmd-config.mjs:41∥:117` ∥ VSC `settings.mjs:184` ∥ `config.mjs:382`）+ i18n 两语两端 | **零触**（候 A/B 裁——A 退役 ∥ B 保留） | 父裁（上抛回复）：①–④ 属 A/形条件 ⇒ 维持现形即设计合规，不预判裁局 |
| `injectProxy` **在案限**（S1） | 落（fix 轮 1） | 父裁 S1：`PROXY.md:24`「env 路径不供模型代理」∥ D-PX1 ∥ D-PX4「否决 env 也能开 model 代理」——设计档为准；§2.3.1 现形行（`&& uri` 含 env）与之相抵（审计轮检出、上抛、父裁） |
| `assemble.mjs:68` 注释（表外 1 处） | 落 | 父批「随正」（死机制注——「double opt-in: provider.proxy + config.proxy.model」） |
| 桌面 `providers.mjs:298` 拆档前坐标注释（`proxy.mjs:191-200`） | **零触**（报表项） | 设计表未列；不猜新坐标——父侧/设计面处置 |

**机检读数（本腿跑——仓套件不跑，父侧收口唯一跑点）**

| # | 检 | 读数 |
|---|---|---|
| 1 | `node --check`（12 档；webview 以临时 `.mjs` 复检 module 语法） | 全绿 |
| 2 | facade 七名 + 同一性（再出口 ≡ 新档原体） | 7/7 ∥ 5/5 互等 |
| 3 | 拆档逐字核（对 HEAD）：5 段字节同 ∥ `tcpConnectProxy` 仅 +export ∥ 应差唯二 | 全中 |
| 4 | 判定矩阵（injectProxy——S1）：无字段+env+旗 ⇒ 零注入 ∥ 在案 uri ⇒ 注入 ∥ 在案无 uri ⇒ 零 ∥ 裸串 ⇒ 注入 ∥ `model` 键零影响 ∥ 无旗 ⇒ 直连 | 9/9 |
| 5 | `probeTargetOf`：旗 ∧ uri ⇒ proxyUri ∥ headers 门（plain ⇒ 携；缺/数组/null ⇒ 零键） | 全中 |
| 6 | 向导端到端（假代理 P + 假端点 M）：既有渠（盘上旗 + headers）⇒ 经代理（绝对形 + `X-Merged` 实捕）∥ 新渠 ⇒ 直连 origin-form ∥ 写后 `proxy`/`headers` 保留 | A/B 双绿 |
| 7 | VSC `providerFromConfig` 五态（旗 ∧ uri ∥ model 零影响 ∥ 无旗/无 uri ∥ 裸串） | 5/5 |
| 8 | 死码：源面零 `_delKey` ∥ 宿主链在 | 实核 |
| 9 | 行数实读：50 ∥ 54 ∥ 219（≤300 各） | 达标 |
| 10 | 真用户配置零写（`~/.thincoder/config.json` mtime 未变——只读核验） | 实核 |

**审计与代码评审轮次与终态**
- 内部 explore 发散审计（轮 1）：DEVIATIONS = 1 条候裁级（env 交叉面）；四类（PARTIAL ∥ SILENT-SIMPLIFICATION ∥ OUT-OF-LIST ∥ 越列）**零发散**。
- fix 轮 1（父裁 S1 后）：`injectProxy` 在案限 + 档头注；S1 矩阵 9/9 复跑。
- 内部 advisor 代码评审（轮 1）：`changes-required`（唯一 🔴 = env 交叉面——与审计同点；余 🟡×5 ∥ 🔵×2 = 报告面）。
- 内部 advisor 代码评审（轮 2 · fix 复核）：**`pass`**（🔴 → Fixed ∥ 无新面 ∥ 其余行无变动如实）。
- **终态 = clean**；未决项全部落父侧/设计面（见下），本腿零挂起。

**报表项（父侧/设计面——本腿零触）**
1. 设计档实施轮回填面：`PROXY.md` 拆档坐标+行数（`:28` ∥ `:35` ∥ `:46` ∥ `:59` ∥ `:112`）∥ vsc `SETTINGS.md` 收尸 −3 坐标（`:207`——`settings-providers.js:123` ⇒ 现盘 `:132`；同档 `settings-providers.js:47` 注释同漂）∥ 时态（`SETTINGS.md:185/:198/:206/:328` ∥ `WEBVIEW-PROTOCOL.md:495`「拟清（实施轮落）」⇒ 已落）∥ 批档 §2.4 Δ 列回填。
2. 随正四件（另一腿）：`docs/batches/2026-10-07-provider-config-parity-{desktop,cli}.test.mjs` ∥ `2026-09-29-parity-b10-ui-w1w4.test.mjs`（+M604）仍双门槛断言 ⇒ 新判定式下红——收口复跑前须随正。
3. `PROXY.md` §2 #1065 分块解码两态（§2 陈述态 vs §6.1 拟落）——在飞批面，随 #1065 窗落。
4. i18n `settings.proxyRowTitle` 两语两端旧门文案——A/B 面差（零触）；两案下均失实，随裁决清。
5. `thincoder-desktop/src/main/providers.mjs:298` 坐标注释（拆档前 `proxy.mjs:191-200`）。
6. designId：本舱 spawn 未携字面值——如实缺项（不猜、不从盘取；写授权 = token 门——本舱全部写获准落地即证）。

**边界**：批内件（T1–T9 测试件）∥ 设计档回填 ∥ 四件随正 ∥ A/B 与形裁决件——均不在本腿（另一腿/父侧/设计面）。仓套件本腿零跑（父侧收口唯一跑点）。

### 测试腿（2026-10-08 · eng-coder）

**交付摘要**（落盘 = 1 新件 + 随正 3 件〔跨批面——父侧整档落讫〕）

- 新 `docs/batches/2026-10-08-proxy-per-channel.test.mjs`（283 内容行 · T1–T7 七用例；逐条按 §2.5，读法以 §2.13 收正块为准）：
  T1 拆档面（三档在盘 ∥ ≤300 ∥ facade 旧七名 + 再出口同一性 ×5）∥ T2 判定式 9 态（旗 ∧ uri 在案 × model 两值 ∥ 裸串形 ∥ 缺 uri 三形 ∥ env 在案不在案 ∥ 无旗两值 ∥ 清残）∥
  T3 探针字段面（三态 + headers 门 1 携 5 零键 + env 不在案）∥ T4 VSC 源锁 + 行为腿三态 ∥ T5 向导端到端（假 HOME 子进程实跑真 `setupWizard` + 子进程内假代理实捕：既有渠 ⇒ 绝对形 + `X-Merged` 实捕；新渠 ⇒ 直连实捕 + 代理零命中）∥ T6 provider-admin 尾注零残留（问句本体 ×2 在场）∥ T7 `_delKey` 零字面 + 宿主链三环在案。
- 随正三件（跨批面——本舱写门按批次档绑定拒写，已上抛；父侧整档落讫 = payload 逐字重放）：
  `2026-10-07-provider-config-parity-cli.test.mjs`（`:107` ∥ `:115` ∥ `:118` ∥ `:121-123`）∥ `-desktop.test.mjs`（`:246` ∥ `:249` ∥ `:256`）∥ `2026-09-29-parity-b10-ui-w1w4.test.mjs`（`:43` ∥ `:49-51` + I6 `:92` ∥ `:97`——父裁 B）。
  payload 存 `.thincoder/tmp/proxy-parity-patch/`（sha256 头：cli `f03afe45a90ec2cb` ∥ desktop `34ea0261c156591b` ∥ b10 `e2de5b61eff6e7d0`）。

**决策透明表**

| 项 | 处置 | 依据 |
|---|---|---|
| T6 半面（`settings.proxyModel` ∥ `proxyRowTitle`）∥ T8（三端全局面） | **不写** | 派工口径：A/B 待裁面候裁勿造红灯（§2.7 项 1 未裁）；件头 `:13-14` 已写明 |
| M604 不触 | **不触** | §2.4 M604 行（选择器随 A 案）+ §2.7 项 1；行数豁免 = §2.6 项 8 ∥ §2.9 |
| T5 走「假 HOME 子进程 + 子进程内假代理」 | 落（真代码路径 E2E） | 向导写盘取 `configPath` 常量（`setup-wizard.mjs:77`）、不经 `_setConfigPathForTest` ⇒ 须假 HOME 隔离（真 `~/.thincoder/config.json` 零触） |
| T3 补 env 态断言（`:130-139`） | 落（审计发现 #3 自修） | §2.13 T3 读法「随 T2」含 env 回供不算在案；前提实核 = `provider-flows.mjs:81-83`（读盘不读 env） |
| T5 驱动器 stdout 冲刷后再退（`:205-206`） | 落（顾问轮 1 🔵#4 采纳） | `process.exit` 不等管道写 ⇒ 读数截断则断言失据（R4 定序） |
| 档头 M604 引据补全（`:14`） | 落（顾问轮 1 🔵#6 采纳） | 操作依据 = §2.4 M604 行 ∥ §2.7 项 1；豁免 = §2.6 项 8 ∥ §2.9 |
| 桌面 payload `:220` ∥ `:261`「双门槛」词面残 | **零触**（登记） | 父裁「仅清单点 + I6 两行，勿扩」——守裁；收口轮/下次触碰同拍改述（顾问 🔵#3） |
| 桌面 payload 377 行越 300 咨询线 | **零触**（登记） | 批内件不计线（§2.6 项 8 ∥ §2.9；`TESTING.md` §2）——裁定类债务不重议（顾问 🔵#5） |

**机检读数（本腿跑——仓套件零跑：父侧收口唯一跑点）**

| # | 检 | 读数 |
|---|---|---|
| 1 | `node --check`（本件 + 三随正件现盘） | 4/4 全绿 |
| 2 | 批内件 `node --test`（终稿） | **7/7 通过**（T1 行数 50 ∥ 54 ∥ 241 皆 ≤300 ∥ T2 9 态 ∥ T3 三态 7 断 + headers 门 ∥ T4 源锁 0 命中 + 行为三态 ∥ T5 假 HOME E2E 双案 ∥ T6 0/0/×2 ∥ T7 0 命中 + 三环） |
| 3 | 随正三件（payload 副本实跑，验毕删） | cli 4/4 ∥ desktop 6/6 ∥ b10 11/11 |
| 4 | 随正三件（父侧整档落讫后复跑） | **21/21 全绿**（父侧读数：cli 4 ∥ desktop 6 ∥ b10 11 · fail 0） |

**审计与代码评审轮次与终态**

- 内部 explore 发散审计（轮 1）：DEVIATIONS = 5（🟡×2 ∥ 🔵×3）——实修 1（T3 env 断言）；余 = 件外（设计档/批档回填）∥ 已声明面（T6 半面）；四类（PARTIAL ∥ SILENT-SIMPLIFICATION ∥ OUT-OF-LIST ∥ 越列）**零发散**。
- fix 轮（审计后；采纳审计 #3）：T3 补 env 态断言 → 复跑 7/7。
- 内部 advisor 代码评审（轮 1）：`pass`（🔴 0 ∥ 🟡 2 非必改 ∥ 🔵 4）。
- fix 轮（顾问后；采纳 🔵#4 ∥ 🔵#6）：T5 驱动器 stdout 冲刷 ∥ 档头引据补全 → 复跑 7/7 + `node --check` 4/4。
- 内部 advisor 代码评审（轮 2 · fix 复核）：**`pass`**（两处 fix 均 Fixed ∥ 无新面 ∥ 其余行无变动如实）。
- **终态 = clean**（未决项全部落父侧/设计面，见下）。

**报表项（父侧/设计面——本腿零触）**

1. 设计档/批档回填：`PROXY.md:129` 批内件指针「拟落」⇒「已落」；批档 §2.4 本件行 Δ（≈200 ⇒ 实读 283 内容行）；§2.5 T6/T8 加「A/B 面候裁不写」注（顾问 🟡#1）。
2. 产品腿 §5 机检读数行 9「50 ∥ 54 ∥ 219」⇒ 现盘 `proxy-transport.mjs` 实读 241（#1065 已落该档——`:13` ∥ `:95-101` 实核）——读数刷新闻（顾问范围外注记）。
3. `settings.proxyModel` ∥ `proxyRowTitle` ∥ 三端全局面 UI ∥ T8 ∥ M604 随正——A/B 裁决后另补腿。
4. payload 保留 `.thincoder/tmp/proxy-parity-patch/`（收口后可清）。
5. designId：本舱 spawn 未携字面值——如实缺项（不猜、不从盘取；写授权 = token 门——本舱全部写获准落地即证）。

**边界**：设计档 ∥ 批档 ∥ 需求档 ∥ 产品码 ∥ M604 ∥ 仓套件——本腿零触。

### A 案落（proxy.model 键退役——2026-10-08 · eng-coder）

**交付摘要**（A 案面差全清——11 档产品 + 1 tmp 随正件；父补裁 = 项 2 形A 纳入 `cmd-config.mjs`）

- 核 `thincoder-core/config.mjs`：`normalizeProxy` 归一只产 `{uri, web}`（字符串 ∥ 对象两分支）＋`:382` 归一句注随正。
- CLI `thincoder-cli/src/tui/cmd-config.mjs`（补裁）：菜单行「Model requests (providers with proxy:true)」删 ∥ `proxySummary` 去 `model:` 段 ∥ seturi 模板去 `model:false` ∥ toggle 分支收窄 web-only ∥ 注释 ×2 收正。
- VSC：`webview/settings-env.js` `#px-model` 全消（标签 ∥ 基线 ∥ seedBaselines ∥ 绑定集合 ∥ 字段映射 ∥ 回填块）∥ `src/extension/settings.mjs` 快照注 ∥ 写链重建 ∥ 缺省形 ∥ `locales/{zh,en}.json` `settings.proxyModel` ∥ `proxyModelHelp` 键删 + `proxyRowTitle` 值改。
- 桌面：`renderer/views/settings-sections-env.mjs` 行删 ∥ 缺省形 ∥ 头注（含 VSC 行数注 204⇒195）∥ `renderer/mount-settings-reads.mjs` 读切片 ∥ 缺省 ∥ `src/main/settings-env.mjs` 白名单 ∥ 校验 ∥ 默认形（:25 ∥ :33）∥ 注释 ∥ `renderer/i18n-views.mjs` 键删 ×2 ∥ `renderer/i18n-settings.mjs` 值改 ×2（与 VSC 同口径）。
- 随正：M604 tmp 副本（`.thincoder/tmp/proxy-Apatch/2026-09-29-desktop-rebuild-fidelity-M604.test.mjs`——sha256 `0890a16e4b13b34de1749a3b91ddeb3c86527be178f3fcc3e8191b8246687d25`）选择器去 `[name="proxy.model"]`（恰 1 行）；原档落讫归父侧（跨批写门——沿先例）。

**决策透明表**

| 项 | 处置 | 依据 |
|---|---|---|
| 桌面 `store.mjs:127` ∥ `views/settings.mjs:207` 退役键活读（射程外 2 处） | 零触 | 声明 12 档外；内部审计 ∥ advisor 同点——父侧登记下批或扩腿 2 行 |
| `cmd-config.mjs` seturi（保留既有键）vs toggleweb（归一重建）对退役键处置相反 | 零触（登记） | advisor 🔵；补裁「删行即止」——口径统一候父裁（零功能影响） |
| M604 tmp seed `model: false`（`:255` ∥ `:439`） | 零触（登记） | 设计 §2.4 仅「选择器随 A 案」；advisor 🔵——不扩随正面 |
| 桌面 env 段头注 VSC 行数注 204⇒195 | 改 | 删 8 行后按现读重锚（注释随正；原值本身 +1 漂移） |
| VSC `test/smoke-settings.mjs` 现红（`settings-providers.js:186` 缺 `document.querySelector` 桩） | 零触（域外注） | #1053 他批在编面；与 A 案零关（读数为「已滞后」，非本腿所改） |

**机检读数（本腿跑——仓套件不跑：父侧收口唯一跑点）**

| # | 检 | 读数 |
|---|---|---|
| 1 | `node --check`（9 产品 JS/MJS + tmp 副本） | 10/10 绿 |
| 2 | 两 locale `JSON.parse` | 2/2 绿（294 键 ×2；`proxyModel*` 键 0） |
| 3 | grep 复核（live 树）：`px-model` ∥ `proxyModel` ∥ `proxy\.model`——core ∥ cli ∥ vsc ∥ desktop(renderer+src) ∥ server ∥ render-core | 全 0 |
| 4 | `proxyRowTitle` 四端在且值净（无「proxy.model / 需全局」字样） | 4/4 |
| 5 | 批内件 `2026-10-08-proxy-per-channel.test.mjs`（**绝对路径启动形**） | 7/7 绿；相对路径形 T4 伪红（@thincoder/core 符号链接 realpath 大小写分裂——与改动零关） |
| 6 | M604 原档（未随正） | 8 测：7 绿 1 红（红 = `控件在场：[name="proxy.model"]`） |
| 7 | M604 tmp 副本（随正后） | 8/8 绿（红→绿对） |
| 8 | tmp vs 原档逐行 diff | 恰 1 行 |

**审计与代码评审轮次与终态**

- 内部 explore 发散审计（轮 1）：DEVIATIONS = 1（`config.mjs:382` 注释形退役键残）；四类中 PARTIAL ∥ SILENT-SIMPLIFICATION ∥ OUT-OF-LIST 零发散（键名残留实项 1）。
- fix 轮 1（审计后）：`:382` 注释去 `, model:false` → `node --check` 复绿。
- 内部 advisor 代码评审（轮 1）：**`pass`**（🔴 0 ∥ 🟡 1 非必改〔M604 530 行——豁免在册〕∥ 🔵 2〔命令面双分支不对称 ∥ M604 seed 残〕）。
- **终态 = clean**（无必改项；未决项全落父侧/设计面）。

**报表项（父侧/设计面——本腿零触）**

1. M604 原档落讫 = 以 tmp 副本整档替换；old→new 逐字：`[…'[name="proxy.web"]', '[name="proxy.model"]', '[name="shell.select"]']` ⇒ `[…'[name="proxy.web"]', '[name="shell.select"]']`（1 行；sha256 头如上）。
2. 桌面残留 2 处（`store.mjs:127` ∥ `views/settings.mjs:207`）——登记下批触碰面或扩腿 2 行。
3. 收口复跑启动形：批内件请用**绝对路径**（相对路径形 T4 伪红——符号链接 realpath 大小写分裂）。
4. 批内件 T6 半面 ∥ T8（词表断言 ∥ 三端全局面腿）——A 裁后可补（测试腿报表项 3）。
5. designId：本舱 spawn 未携字面值——如实缺项（不猜、不从盘取）。

**边界**：设计档 ∥ 批档 ∥ 需求档 ∥ M604 原档 ∥ 仓套件 ∥ wizard 两档——本腿零触（tmp 副本与清单除外）。

### 测试面补全（T6 全三条 + T8 三腿）—— 2026-10-08 · eng-coder

**交付摘要**（改 1 档：批内件；零产品码）

- `docs/batches/2026-10-08-proxy-per-channel.test.mjs`（原 283 内容行 ⇒ 现 336 内容行）：
  - T6 扩为全三条：① `proxyModel` 键面三载体零命中（`thincoder-vscode/locales/{en,zh}.json` ∥ 桌面 `renderer/i18n-views.mjs`，`:266-269`）∥ ② `proxyRowTitle` 值净 4/4（两语两端——零「proxy.model」字样 ∥ 零旧门文案；`:270-284`）∥ ③ `provider-admin` 尾注零残留 + 问句本体 ×2 留证（`:285-289`）。
  - T8 新增三腿（`:305-336`）：① VSC `settings-env.js` 零 `px-model`（`px-uri` ∥ `px-web` 正锚）∥ ② 桌面 env 树三档零 `proxy.model` + 裸 `model` 键形态闭合（段体 ∥ 读切片 ∥ 主侧；切片段内零 model）∥ ③ CLI 菜单随形A（`Model requests` ∥ `togglemodel` ∥ `model:false` ∥ `model:${` 四零 + `Set proxy URI` 正锚）。
  - 档头随正：「本件不写面」（A/B 候裁）注删除 ⇒ A 案落讫口径；T8 条目入清单；`T1–T7` ⇒ `T1–T8`。

**决策透明表**

| 项 | 处置 | 依据 |
|---|---|---|
| T6② 值净加护「needs global ∥ 需全局」 | 落 | §2.5 字面 = 零「proxy.model」字样；A 案读数 4 口径 = 「无「proxy.model / 需全局」字样」——同径加护 |
| 桌面 env 树裸 `model` 键形态断言（审计观察项 1） | 落（fix 轮 1） | 审计轮 1 观察项 1：`proxy[.-]model` 看不见裸键形态（A 案前真实形态 = 裸 `model: false` 键）——段体 ∥ 主侧升为 model-any-form 零、读切片以段内零断 |
| T8② 措辞收口（顾问 🟡 建议①） | 落（fix 轮 2）：件头 `:12` ∥ 测名 `:307` ∥ 注释 `:312` 收为「三档 + store ∥ views 两档残留已登记——§5 A案 报表项 2」；断言零变 | advisor 轮 1 🟡：实测三档 vs 措辞「env 树」口径不一 |
| 顾问 🔵 2/3/4 | 维持（显式不改——轮 2 Accepted） | 非必改；事实基座复验不变、今日零假绿 |
| CLI 腿断言靶（四删项） | 落（按 A 案 diff 取原文） | 形A 补裁（§5 A案落）：行删 ∥ `proxySummary` 去段 ∥ seturi 模板去 `model:false` ∥ toggle 分支收窄 |
| store ∥ views 两档残留（T8 覆盖面余项） | 零触（已登记注明） | 产品面外；A 案报表项 2「登记下批触碰面或扩腿 2 行」——本件 T8② 措辞已注明留痕 |
| M604 ∥ 他件 ∥ 他面 | 零触 | 派工口径（只动批内件 + §5）；M604 原档随正已由父侧落讫 |

**机检读数**（本腿跑——仓套件零跑：父侧收口唯一跑点）

| # | 检 | 读数 |
|---|---|---|
| 1 | `node --check`（本件） | 绿 |
| 2 | `node --test`（**大写盘符绝对路径形** `D:\…`） | **8/8 通过**（T1–T7 原样 ∥ T6 全三条 ∥ T8 三腿） |
| 3 | 启动形对照：小写盘符 `d:\…` | T4 伪红（@thincoder/core 符号链接 realpath 大小写分裂——模块双实例，与改动零关）；绿色形 = 盘符大写 |
| 4 | 非空洞对照（新断言 × A 案前旧形态） | 11/11：对旧形态必红、对现态零命中 |
| 5 | 触碰面 | 恰 1 档（本件）+ 本段；产品码 ∥ 他件 ∥ 设计档零触 |

**审计与代码评审轮次与终态**

- explore 发散审计（轮 1）：四类（PARTIAL ∥ SILENT-SIMPLIFICATION ∥ OUT-OF-LIST ∥ 越列）**0 发散**；观察项 3（🔵）——1 采纳、2/3 维持。
- fix 轮 1（审计后；采纳观察项 1）：裸 `model` 键形态闭合 → 复跑 8/8 绿。
- advisor 代码评审（轮 1）：`pass`（🔴 0 ∥ 🟡 1 非必改 ∥ 🔵 3）。
- fix 轮 2（顾问后；采纳 🟡 建议①）：T8② 措辞收口 3 处 → 复跑 8/8 + `node --check` 绿。
- advisor 代码评审（轮 2 · fix 复核）：**`pass`**（🟡 → Fixed；🔵 三条 Accepted〔显式不改〕；New 0）。
- **终态 = clean**（无必改项；余量全部落父侧/设计面，见下）。

**报表项（父侧/设计面——本腿零触）**

1. 批档 §2.4 本件行 Δ「→ 271」⇒ 收口轮按现件回填（336 内容行——T8 落讫后）；§5 测试腿「283 内容行」= T8 前读数（历史）。
2. store ∥ views 两档残留（`store.mjs:127` ∥ `views/settings.mjs:207`）——T8 覆盖面余项；产品面清讫后可按 A 案预案「扩腿 2 行」。
3. designId：本舱 spawn 未携字面值——如实缺项（不猜、不从盘取；写授权 = token 门——本舱全部写获准落地即证）。

**边界**：产品码 ∥ 设计档 ∥ 需求档 ∥ 仓套件 ∥ 他件——本腿零触（本件 + 本段除外）。

### #1049 补步（两向导「走 proxy」问句）——2026-10-08 · eng-coder

**交付摘要**（改 3 产品档〔含设计落法点名的装配面〕+ 1 批内件；设计落法 = `docs/core/design/PROXY.md:100-104`）

- `thincoder-cli/src/cli/setup-wizard.mjs`（109 行，+7）：向导末问——readline `ask` 载 `Route this provider's model requests through the proxy [y/N]: `（`:62` ∥ `:63`；空输入 = 缺省 No）；探针条目携答案（`:71`——探针 ≡ 写后运行态，同 #1048② 判据）；答 Yes ⇒ `rec.proxy = true` 随 `writeConfigAtomic` 单 mutate 一次写（`:90`），No ∥ 缺省 ⇒ 零键零写。
- `thincoder-cli/src/tui/wizard.mjs`（256 行，+9）：`finishWizard` 落盘前 `showPicker` 同形调用（`:192`–`:195`——正文 ∥ No (direct) / Yes (proxy) 与 add 流逐字同形；缺省 No/Esc）；答 Yes ⇒ `providerRec.proxy = true`（`:196`），随下方单 `persistRaw` 一次写。
- `thincoder-cli/src/tui/index.mjs`（+1）：装配处注入 `showPicker`（`:196`——设计落法点名的 ctx 注入点；**写域清单外**，报告随附）。
- `docs/batches/2026-10-08-proxy-per-channel.test.mjs`（449 行）：新增 **W1**（`:351`–`:373`——首配向导假 HOME 子进程实跑三案：y ⇒ 盘上 `proxy: true` + 探针经代理实捕（绝对形）∥ n ∥ 缺省 ⇒ 直连 + 零键）∥ **W2**（`:424`–`:448`——TUI 向导 mock ctx 行为腿三案：picker 形 3/3 逐字 ∥ yes ⇒ `proxy: true` ∥ no/Esc ⇒ 零键 ∥ 各案落盘恰一次）；T5 随动（答卷末项 +1——`:251` ∥ `:265`）+ 向导实跑 harness 上提共用（`:218`–`:240`）。

**决策透明表**

| 项 | 处置 | 依据 |
|---|---|---|
| 首配向导问句载形 = `[y/N]` readline（正文逐字同 add 流） | 落 | 设计落法 `PROXY.md:103`「首配向导 = 该档既有 readline `ask`（y/N；该档唯一输入机制）」 |
| `index.mjs`（清单外，+1 行） | 落（披露） | 设计落法 `PROXY.md:103` 点名 ctx 注入点——「经 ctx 注入——`index.mjs` 装配处随 `openModelPicker` 先例」 |
| 既有渠道重配径：答 No/Esc 不清既有旗 | 维持（零触） | 设计写入点 = 「新渠条目」（`PROXY.md:104`）；add 流先例同形（零键零写）；语义归属设计面——顾问 🟡#4 非必改，转设计面收口（报表项 1） |
| 答 Yes 生效时点 = 下次装配（会话内仍直连） | 披露（零触） | `proxyUri` 注入点仅装配/重载（`assemble.mjs:71` ∥ `cmd-config.mjs:71`）；设计以「探针 ≡ 写后运行态」承接——顾问 🔵#8 报告面（报表项 5） |
| W2 驱动器快照 = 深拷贝（落盘内容） | 落 | 「先盘后存」语义——探针失败标记等内存态不落盘；防读数误读 |
| 两驱动器退出前双管道排空 ∥ W2 Esc 案传 `null` ∥ 件头启动形注 | 落（顾问 🔵#5/#6/#7 采纳） | stdout 截断先例同族（stderr 同险）∥ `pickers.mjs:13` 真返形「Esc = pop 当前层并 resolve(null)」∥ 批档 §5 A案落 报表项 3 |
| 审计 DOC-DRIFT 4 条 ∥ 顾问 🟡#1–#3（文档态） | 零触（报表项） | 设计/批档面——本腿零触；批档 §5 本段即本腿实施记录 |

**机检读数**（本腿跑——仓套件零跑：父侧收口唯一跑点）

| # | 检 | 读数 |
|---|---|---|
| 1 | `node --check`（4 档：setup-wizard ∥ wizard ∥ index ∥ 批内件） | 4/4 全绿 |
| 2 | 批内件 `node --test`（**绝对路径大写盘符形** `D:\…`） | **10/10 通过**（T1–T8 原样 ∥ W1 ∥ W2 新腿——fail 0；实施后 ∥ fix 后两次复跑同绿） |
| 3 | W1 实跑（stdin 桩答，末答 y）：stderr 提问行 ∥ 代理实捕 ∥ 盘上条目 | 提问行在案 ∥ `[PROXY_HITS] [{"url":"http://tc-wiz.invalid/v1/models","xMerged":null}]` ∥ `{"name":"tc-wiz-ev","baseURL":"http://tc-wiz.invalid/v1","model":"m-wiz","apiKey":"sk-ev","proxy":true}` |
| 4 | W2 实跑（mock ctx × 三答案） | picker 形 3/3（正文 + 两选项逐字）∥ `route:"yes" ⇒ provider.proxy=true` ∥ `"no" ∥ null ⇒ 零键` ∥ 各案 `persists: 1` |
| 5 | 零触核验：`provider-admin.mjs`（问句先例）∥ 设计/需求档 ∥ 产品他面 | 实读零触（问句本体 ×2 仍在案——T6 断言） |
| 6 | 本仓约定反查 `thincoder-cli/scripts/doc-impact.mjs`（只读——`--base HEAD --files` 三档） | 跑（base HEAD ⇒ 121 在途噪声为主；命中 = 3 旧归档泛命中——无本腿新增设计档影响项） |
| 7 | 真用户配置零写 | 结构性：全部向导实跑走假 HOME 子进程（`HOME` ∥ `USERPROFILE` 重定向） |

**审计与代码评审轮次与终态**

- 内部 explore 发散审计（轮 1）：DEVIATIONS = 4（全 DOC-DRIFT——设计档坐标/时态回填面）；四类（PARTIAL ∥ SILENT-SIMPLIFICATION ∥ OUT-OF-LIST ∥ 越列）**零发散**；设计面复核 = `index.mjs:194`（装配）∥ `startup.mjs:238`（触发）改后仍准。
- fix 轮（审计后）：零代码修项（4 条全落报表项）。
- 内部 advisor 代码评审（轮 1）：`pass`（🔴 0 ∥ 🟡 4〔3 文档态 report-only + 1 非必改语义边〕∥ 🔵 4）。
- fix 轮（顾问后；采纳 🔵#5/#6/#7）：双管道排空 ×2 ∥ Esc 案传 null ∥ 件头启动形注 → 复跑 10/10 + `node --check` 4/4。
- 内部 advisor 代码评审（轮 2 · fix 复核）：**`pass`**（Fixed 3 ∥ Accepted 2 ∥ Unfixed 3〔文档态/报告面——非阻断〕∥ New 0）。
- **终态 = clean**（无必改项；未决项全部落父侧/设计面，见下）。

**报表项（父侧/设计面——本腿零触）**

1. 设计档回填：`PROXY.md:104`「实施 = 产品腿另轮」⇒ 已实施态 ∥ `:131`「拟落」⇒「已落」∥ 变更记录补条（+ 重配径语义句候设计面收口——顾问 🟡#4）。
2. 批档 §2.4 回填：setup-wizard 行「+6（现读 102）」⇒ 现读 109；补 `thincoder-cli/src/tui/wizard.mjs` 行（+9）；批内件行「→271」⇒ 449；本段即本腿实施记录。
3. 批档 §2.4 随正行「随正未落」与 §5「21/21 全绿」相抵——按盘收正（审计 ∥ 顾问同点）。
4. 设计档坐标漂移（审计点名；非本腿专有）：`docs/vsc/design/SETTINGS.md:518` ∥ `docs/core/design/AGENT-LOOP-ASYNC-POOL.md:585` ∥ `docs/core/design/MODEL-SPECS.md:1790` ∥ `:1855`。
5. 会话内即时性（顾问 🔵#8）：答 Yes 生效时点 = 下次装配；如需会话内即效须另补注入（设计是否收口候裁）。
6. designId：本舱 spawn 未携字面值——如实缺项（不猜、不从盘取；写授权 = token 门——本舱全部写获准落地即证）。

**边界**：`provider-admin.mjs`（只借鉴其形）∥ 产品他面 ∥ 设计/需求档 ∥ 他批 ∥ 仓套件——本腿零触（4 档 + 本段除外）。

## §6 验证与收口（父代理）

**收口结算（主 agent · 2026-10-08）**

**腿表（终态全 clean）**：#40 产品 ∥ #41 测试 ∥ #48 设计回填 ∥ #66 设计收束（三点裁 + 补步落法）∥ #61 A 案 + 形A（用户 13:12/13:19/13:20 三点裁全落）∥ #68 T6/T8 ∥ #69 补步 ∥ #71 as-built 回填 ∥ M604 原档随正（父侧落讫 · 8/8）。

**仓套件（父侧唯一跑点 · 同上一次覆盖并集）**：`thincoder-server` `prepublishOnly` 201/201 · fail 0 · exit 0 ∥ 五包空清单绿。本批批内件：`2026-10-08-proxy-per-channel.test.mjs` **10/10**（跑法 = 大写盘符绝对路径形——小写/相对形有 `@thincoder/core` 符号链接 realpath 伪红，在册）；M604 件 **8/8**（父侧落讫复跑）。

**台账结算**：**#1042** 核销（本档 = 锚）∥ **#1049** 核销（补步落）∥ **#1037** 核销（拆档已落：`proxy.mjs` 50 ∥ `proxy-target.mjs` 54 ∥ `proxy-transport.mjs` 245）∥ **#1038** 已废弃（406 ≤ 500 咨询线 ⇒ 拆档候选前提消失）∥ **#1060** 已废弃（三件 523–614 < 800 ⇒ 拆分前提消失）∥ **#1088** 已撤（补步配套）。引出条件债：**#1082** ∥ **#1083** ∥ **#1090** ∥ **#1093** ∥ **#1095**（去重收窄 = 批档 §2.5 后注）。

**残留扫描**：全部在册；prose 零残留。**前情**：无（独立批）。
