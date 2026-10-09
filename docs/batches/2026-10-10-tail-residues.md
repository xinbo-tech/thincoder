# 2026-10-10 · tail-residues
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-10 · 来源 = 用户 2026-10-10 03:49「不认自设条件——等条件的一起拿出来清理」+ 清账二遍余行收口 = #711（E4-JS 残项两枚）∥ #1073（VSC 空钥回执）。
> 台账 = #711（desktop · 归批）。前情 = docs/batches/2026-10-10-ledger-full-triage.md（已收口 2026-10-10 · 清账二遍余三行）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-10
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**状态行**：🔄 进行中（设计轮已发）

**直令**：用户 2026-10-10 03:49 清账二遍令——本批 = 余行收口（自设「窗口/下次触碰」闸作废，即办）；授权 = 会话全自动沿用。

**条目（2 行 · 三件）**：
- `#711` ①：分段档多面同帧补偿重复计（评审 #172 内审 🟡）——同帧 ≥2 巨块面有窗差时，锚面写后复读已含上面各面位移、又被段序算式二次计入；机制面收正句在册（`docs/batches/2026-09-30-desktop-heap-freeze-e4js.md` §2 ∥ 规划 = 逐面依面序结算）。落点 = 该档实施面（`thincoder-render-core` 段序结算处——设计轮现读定位）。
- `#711` ②：巨块隐藏段查找跳转无位移——`/rc/search.mjs` 命中面完整，隐藏段 `scrollIntoView` 无位移；修法候选 = 核侧协作（设计轮出案）。
- `#1073`：VSC 密钥保存空钥早退仍发受理回执（`presets.mjs:46` 早退零写 ⇒ `panel-messages-settings.mjs:37` 仍发 `providerKeySaved`）——择①案：宿主区分「无写/写成功」（须小设计）。

**边界**：`thincoder-render-core/**`（#711 两件）∥ `thincoder-vscode/**`（#1073）；不触他批落点。

**授权口径**：会话全自动（03:07「全自动」+ 03:49 清账二遍令）——设计 → 评审（用户点火）→ 批准 → 实施。

**父侧办结（2026-10-10）**：① 边界三面随正 ✓（desktop ∥ render-core ∥ vscode——授权已发 #68）；② `config-io.mjs:205` 同型假成功 → 登记台账 `#1179`；③ `docs/desktop/design/PROJECT.md` §4.1 行数滞后（`views/chat.mjs` 244⇒205 ∥ `app.mjs` 293⇒336 等）→ 登记台账 `#1180`（回填轮）；④ 结算序依赖 `mounted` 账序（码注随动义务）+ 无写径写后准入探零改 = 实施轮照落 ✓。

**父裁（2026-10-10 · 评审 #76 pass 回执）**：3 🟡 ∥ 2 🔵 逐条——F1（随动清单漏值行单源两处）⇒ **补 `CHAT.md` §3.1（497 ⇒ 498 + 新档值行）∥ `UI.md` §4.1（26 ⇒ ≈28）**，与 PROJECT.md §4.1 指针行同拍（依据：RENDERER.md:341 值行单源纪律 + `PROJECT-MANIFEST.json:47` 节域声明）∥ F2（§2.9-3「本批零触设计档」与 §2.5 随动行相抵 + chat.mjs 244 例归属）⇒ 实施轮以 §2.5 为准；披露句随正（244 在 PROJECT.md 变更记录 `:1710`，§4.1 该行为指针 `:305`）∥ F3（#711② reveal 抛错径无腿）⇒ 补抛错腿（`console.error` 恰一条 ∧ `scrollIntoView` 照常 ∧ 序不变）∥ 🔵 F4（乙腿需 NodeFilter/createTreeWalker 桩）入机检法注 ∥ F5（§1 双状态行）= 父侧另拍。**实施派工 = eng-coder #89**；产物回后进 §6。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（三件（#711①② ∥ #1073）机制设计 + 逐条落地表 + 机检法 + 关键决策 + 上抛落毕；待父侧送评）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 尾行三件收口设计块（initial 轮 · eng-designer · 2026-10-10）

**覆盖条目**：`#711`①（分段档多面同帧补偿重复计）∥ `#711`②（巨块隐藏段查找跳转无位移）∥ `#1073`（VSC 空钥早退仍发受理回执——择①案）。round = initial；本块 = 三件的机制设计 + 逐条落地表 + 机检法 + 关键决策 + 上抛。

**现读坐标（2026-10-10 · 内容行数口径）**：① 补偿结算唯一实现 = `thincoder-desktop/renderer/views/chat-text-segments.mjs:444-497`（`segmentViewStep`——帧尾第 ⑦ 步；`thincoder-render-core/` 全树零段窗件，实读）；收正句在册 = `docs/batches/2026-09-30-desktop-heap-freeze-e4js.md:34-36`（「逐面依面序结算（前序面位移不入后序面 delta）」）。② 搜索 = 核件 `thincoder-render-core/search.mjs`（`createSearch(deps)` :36；`showCurrentMatch` :108-111）+ 端壳 `thincoder-desktop/renderer/search.mjs:19-26`（`attachSearch` ⇒ `createSearch({ root })` :25）。③ 写链 = `thincoder-vscode/src/extension/presets.mjs:45-48`（`storeProviderKey` 空钥早退）→ `settings.mjs:290-298`（`saveProviderKey` 透传）→ `panel-settings-push.mjs:25-29` → `panel-messages-settings.mjs:28-38`（受理回执点）。桌面对位先例（只读）= `thincoder-desktop/src/main/providers.mjs:176-187`。

**需求面合规核**：三条为缺陷修条目（事实 ∥ 证据 ∥ 修法定形俱在 §1），可设计；VSC 侧设计单源 = `docs/vsc/design/SETTINGS.md` §2.18 ∥ §5 U-S19 ∥ `docs/vsc/design/WEBVIEW-PROTOCOL.md` §3.2 行 25。**边界相抵一条 = 上抛**（§2.9 第 1 条）。

#### 2.2 #711① 面序结算（前序面位移剔除）

**病根（推证）**：帧尾第 ⑦ 步的补偿累加器 `delta`（`:481`）逐面并账。算式径面（`segmentShift`——`:490-491`）读的是**自身量**；复读径面（`:485-487`）读的是**写后全局位移**——该读数天然含「同帧前序面已写入的位移」。两径同累加 ⇒ 前序面位移被计两次（重复计 = Σ 上面各面自身位移）。面序内最多一个复读径面（`anchorClassOf` 的 `{seg}` 唯一 = 视口顶跨面；退化 `{seg: window.first}` 无矩形 ⇒ 复读不可得 ⇒ 走算式径）。

**修法（行内改写 · `chat-text-segments.mjs:486-487`）**：复读径面按「复读位移 = 已结算前序合计」结算（取代式；等价单行 `delta = after - plan.anchorBefore`）：

```js
const measured = after - plan.anchorBefore // 复读位移（含前序面位移 —— 面序结算量恒为已结算前序合计）
delta += measured - delta                  // 前序面位移剔除：本面自担量 = 复读 − 已结算前序合计
```

算式径维持 `+= own`（`:491`）不动；锚面算式回退径（`plan.anchorSeg` ∥ `anchorTop = bandTop`）不动；跟滚帧零读（`:479` 贴底覆盖）∥ `≤0.5px` 写阈值（`:493`）∥ 单面帧读数（settled = 0 ⇒ 取代式 ≡ 原式，逐值不变）皆不动。

**面序前提（设计明写）**：结算序 = `plans` 序 = `records` 序 = `mounted` 序 = **上帧 DOM 块节点序（文档序）**（`chat.mjs:203` 传入 `account?.mounted`；`segments:447-464` 保序筛选，零新排序）；复读径面在面序中恒为「已结算前序全在其上」的贡献位。前提以一行码注落于结算点（未来 `mounted` 账序若改 ⇒ 同拍改）。

**机检法**（批内件 `docs/batches/2026-10-10-tail-residues.test.mjs`——以下同件）：
- 甲（核心回归 · 端到端）：假件直驱 `segmentViewStep`——两面同帧各一窗差（上面巨块面 A ⇒ 自身位移 ΔA；视口跨面 B ⇒ 锚段之上自身量 ΔB），复读位移（B 锚段首壳顶 after − before）= ΔA + ΔB ⇒ 断言 `readout.delta` = ΔA + ΔB ∧ `root.scrollTop` 写入量同值；**改前读数 = 2ΔA + ΔB（先红后绿）**。假件两径任选（沿 E4-JS 批内件 ⑫ 手造面件形 ∥ `mountSegments` 真径建账后再驱）。
- 乙（单面回归 · 零回归）：单面帧 + 既有纯函数腿逐值不变（`segmentShift` ∥ `aboveOf` ∥ `compensateSegments`——E4-JS 批内件 ⑪ 原值复跑）。
- 丙（回退径）：锚面不可测（无矩形）⇒ 算式径并账，不叠前序。
- 丁（跟滚帧）：`following` ⇒ `readout.delta = 0` ∧ 零读 ∧ 贴底写覆盖（既有腿）。
- 戊（行数）：改后 `chat-text-segments.mjs` < 500（净 ≤ +1；见 §2.6 行数背板）。

#### 2.3 #711② 跳转披露缝（核缝 + 桌面接线）

**缺口**：巨块分段后隐藏段（`display:none`）无布局盒 ⇒ 命中其中的 `mark.search-hit` 调 `scrollIntoView` 无位移（E4-JS 三面受损之一，`RENDERER.md` KD-54 ④ 在册）。核件只知 DOM，不知段窗机制；端侧知机制但触不到核件内部的跳转径 ⇒ 修法 = **核留可选缝 + 端侧披露**。

**核缝（`thincoder-render-core/search.mjs`）**：`createSearch(deps)` 增可选 `deps.reveal`（回调，缺省零变）；于 `showCurrentMatch(scroll = true)`（`:108-111`）内、`scrollIntoView` **之前**调用：`try { deps.reveal?.(el) } catch (error) { console.error("[search] reveal hook failed:", error) }`（零静默降级——失败仍照常跳转，不劣化于现状）；`scroll = false` 径（搜索自跑，修复 3）不调。

**桌面披露助手（新档 `thincoder-desktop/renderer/views/chat-segment-reveal.mjs` · ≈15-20 行）**：`export function revealSegmentAt(el)`——`el.closest("[data-raw]")` ⇒ 面账（`ACCOUNTS`）⇒ `el.closest("span[data-seg]")` 段号；面未分段 ∥ 未在账 ∥ 段号非法 ⇒ `false`（零写，调用方照常跳转）；段已在 `record.window` ⇒ `true`（零写，幂等）；否则 `applyWindow(record, padWindow({ viewFirst: seg, viewLast: seg }, record.count))`（一次性放窗 = 段 ±1）⇒ `true`。该档 = 披露面，机制单源仍在 `chat-text-segments.mjs`。

**段账缝（`chat-text-segments.mjs` 两处行内导出化 · 净 0 行）**：`ACCOUNTS`（`:130`）∥ `applyWindow`（`:320`）加 `export` 前缀；`padWindow`（`:63`）已导出，零改。**由**：该件 497 行贴 500 线（净增 >3 行即须先执行在册拆分——登记见 `docs/batches/2026-09-30-desktop-heap-freeze-e4js.md:36`），故新逻辑入新档、本件净 0。

**端壳接线（`thincoder-desktop/renderer/search.mjs`）**：`:13` 增 import（`./views/chat-segment-reveal.mjs`）+ `:25` 改 `createSearch({ root, reveal: revealSegmentAt })`。

**口径与上界**：披露 = **一次性放窗**（同初窗 ∥ 重挂转移径；不计「≤2 段变更/帧」步进预算——该预算服务连续滚动的渐进收敛，跳转为用户离散动作）；成本上界 = 段 ±1 ≤ 3 段布局（≈26ms 量级 < 50ms 长任务门）；跳转帧尾的 `segmentViewStep` 随后所见窗已含目标 ⇒ 零追加变更。失败降级 = 现行为（无位移——下限不劣化）。

**机检法**：
- 甲（披露行为 · 真 `mountSegments` 建账 + 假件面）：命中件在隐藏段 ⇒ 段 ±1 显示（壳 `display` ≠ `none`）∧ 返回 `true`；命中已在窗 ⇒ `true` ∧ 零写；未分段 ∥ 未知面 ⇒ `false` ∧ 零触。
- 乙（核缝调用序 · 假文档装——沿 E4-JS 批内件 ⑨ 假件先例）：驱 `performSearch` + `jumpSearch(1)` ⇒ `reveal` 被调 ∧ 实参 = 当前命中件 ∧ 先于命中件 `scrollIntoView`；缺 `reveal` dep ⇒ 直跳不抛（VSC 形零行为）。命中件 `scrollIntoView` 以桩计数。
- 丙（VSC 零变 · 负向锁）：`thincoder-vscode` 侧搜索端壳未传 `reveal` ⇒ 搜索行为逐字不变（端壳调用面无 `reveal` 键）。

#### 2.4 #1073 写结果三态（回执 ⟺ 真写）

**病根**：`storeProviderKey`（`presets.mjs:45-48`）空 ∥ 全空白钥 ⇒ 早退 `return`（undefined）——与写成功径的 `null` 在 `panel-messages-settings.mjs` 的 `if (err)` 判据下不可辨 ⇒ 宿主对「零写」发 `providerKeySaved`（假成功回执）。

**机制（写面显式三态）**：`storeProviderKey` 返回判别式对象——`{ status: "ok" }`（写成功）∥ `{ status: "no-write" }`（空钥守卫零写——零写盘 ∥ 零错误）∥ `{ status: "conflict", hint }`（mtime 冲突；`hint` = 既有 `CONFIG_CONFLICT_HINT` 透传）。链上透传件（`settings.mjs:290-298` ∥ `panel-settings-push.mjs` ∥ `chat-panel.mjs`）形不变（注随正，其中后两件零改）。

**回执判据（`panel-messages-settings.mjs:28-38`）**：`status === "ok"` ⇒ 发 `providerKeySaved{name}`；`status === "no-write"` ⇒ **零回执** + 宿主 `console.warn` 一条（零静默——发送方契约外达可诊断）；`status === "conflict"` ⇒ `postProviderError(panel, "providers", hint)`（reason 映射 `mtime-conflict` 照旧）∧ 零回执。无写径仍执行既有写后准入探（`probeProviderAdmission`——语义 = 准入刷新而非写副作用；零改，披露）。

**机检法**：
- 甲（三态 · 假 panel 桩）：`no-write` ⇒ sink 恰零条 `providerKeySaved` ∧ warn 恰一条；`ok` ⇒ 恰一条 `providerKeySaved{name}`；`conflict` ⇒ 恰一条 `providerError{scope:"providers", reason:"mtime-conflict"}` ∧ 零回执。
- 乙（真写面 · 临时 config 缝 `_setConfigPathForTest` 注入——真 `~/.thincoder/` 零触）：`storeProviderKey("x","")` ⇒ `{status:"no-write"}` ∧ 盘面零写；`("x"," k ")` ⇒ `{status:"ok"}` ∧ 盘面 `apiKey:"k"`（trim 语义回归）。
- 丙（冻结件复跑 · 零回改）：`docs/batches/2026-10-08-provider-key-guards-vsc.test.mjs` T-V1（真链成功径 ⇒ 回执）∥ T-V2（假 config-io 冲突 ⇒ `providerError`）在新形下同绿。

#### 2.5 逐条落地表（条目号 → 动作 → 目标 file:line → 期望 → 机检法）

| 条目 | 动作 | 目标 file:line（现读） | 期望 | 机检法 |
|---|---|---|---|---|
| `#711`① | 复读径面序结算 | `thincoder-desktop/renderer/views/chat-text-segments.mjs:486-487` | 取代式（`delta += measured − delta`；等价 `delta = after − anchorBefore`）——净 ≤ +1 行 | §2.2 甲（先红后绿） |
| `#711`① | 口径注同笔（面序前提） | 同档 `:7`（档头补偿句）∥ `:438-443`（函数注 ④） | 面序结算句 + `mounted` 文档序前提（行内改写，净 0） | 读回 + §2.2 戊 |
| `#711`② | 核缝（可选披露回调） | `thincoder-render-core/search.mjs:36`（`createSearch(deps)`）∥ `:108-111`（`showCurrentMatch`） | `deps.reveal?.(el)` 于 `scrollIntoView` 前调；`scroll=false` 不调；缺 dep 零变 | §2.3 乙 |
| `#711`② | 段账缝（行内导出化） | `chat-text-segments.mjs:130`（`ACCOUNTS`）∥ `:320`（`applyWindow`） | `export` 前缀；净 0 行（`padWindow` `:63` 已导出） | 读回 + §2.2 戊 |
| `#711`② | 披露助手（新档） | `thincoder-desktop/renderer/views/chat-segment-reveal.mjs`（新 · ≈15-20 行） | `revealSegmentAt(el)`：未分段 ∥ 未知面 ∥ 段外 ⇒ `false`；已在窗 ⇒ `true` 零写；否则一次性放窗（段 ±1）⇒ `true` | §2.3 甲 |
| `#711`② | 端壳接线 | `thincoder-desktop/renderer/search.mjs:13`（import）∥ `:25`（`createSearch` 实参） | `createSearch({ root, reveal: revealSegmentAt })` | §2.3 乙 ∥ 丙 |
| `#1073` | 写面三态 | `thincoder-vscode/src/extension/presets.mjs:45-48` | 返回 `{status:"ok" \| "no-write" \| "conflict", hint?}` | §2.4 甲 ∥ 乙 |
| `#1073` | 透传注随正 | `thincoder-vscode/src/extension/settings.mjs:290-298` | 透传（注句随新形）——零行为改 | 读回 |
| `#1073` | 回执门 | `thincoder-vscode/src/extension/panel-messages-settings.mjs:28-38` | `ok` ⇒ 回执；`no-write` ⇒ 零回执 + 一条 warn；`conflict` ⇒ `providerError` 映射照旧 | §2.4 甲 ∥ 丙 |
| 全 | 批内件（拟新增 · 实施轮建） | `docs/batches/2026-10-10-tail-residues.test.mjs`（≈250-350 行 · 腿九：§2.2 甲乙丙丁 + §2.3 甲乙丙 + §2.4 甲乙） | 先红后绿（①甲 ∥ ③甲 两腿先红） | 自身即机检 |
| 全 | 冻结件复跑（零回改） | `docs/batches/2026-09-30-desktop-heap-freeze.test.mjs` ∥ `docs/batches/2026-10-08-provider-key-guards-vsc.test.mjs` | 两件同绿（⑪/⑫ 腿 ∥ T-V1/T-V2 腿） | 直跑两件 |
| 全 | 设计档随动（实施轮笔） | `docs/desktop/design/RENDERER.md` §3（巨块段窗滚动作——面序结算句）∥ `docs/desktop/design/PROJECT.md` §4.1（行数行 ∥ 新档登记行）∥ `docs/desktop/design/CHAT.md` §3.1（497 ⇒ 498 值行 + 新档值行）∥ `docs/desktop/design/UI.md` §4.1（26 ⇒ ≈28）（父侧补落 2026-10-10 · 可 revert）∥ `docs/render-core/design/RENDER-CORE.md` §3 行 32 ∥ §5（`createSearch` 构件族——`reveal` 可选缝）∥ `docs/desktop/design/RENDERER.md` **KD-54 ④**（三面受损——「查找跳转」面收正为已修）∥ `docs/vsc/design/SETTINGS.md` §2.18 ∥ §5 **U-S19**（无写径句）∥ `docs/vsc/design/WEBVIEW-PROTOCOL.md` 零改（消息面零变——行 25 语义已含「成功径才发」） | 逐处落笔（行号以实施轮现读为准） | 读回 |

#### 2.6 受影响文件与行数背板（现读 2026-10-10 · 内容行数口径）

| 文件 | 现读 | 预期 | 档位 |
|---|---|---|---|
| `thincoder-desktop/renderer/views/chat-text-segments.mjs` | **497** | **≤ 498**（净 ≤ +1） | 贴 500 线——**净增 >3 即须先执行在册拆分**（本设计净 ≤ +1，不触发；500 顶格亦禁——留余 ≥2） |
| `thincoder-desktop/renderer/views/chat-segment-reveal.mjs`（新） | 0 | ≈15-20 | ≤300 ✓ |
| `thincoder-desktop/renderer/search.mjs` | 26 | ≈28 | ≤300 ✓ |
| `thincoder-render-core/search.mjs` | **193** | ≈197 | ≤300 ✓ |
| `thincoder-vscode/src/extension/presets.mjs` | **192** | ≈200 | ≤300 ✓ |
| `thincoder-vscode/src/extension/settings.mjs` | **408** | ±0（注随正） | >300 存量（非本批引入；本批零结构增） |
| `thincoder-vscode/src/extension/panel-messages-settings.mjs` | **244** | ≈250 | ≤300 ✓ |

**零触面（读面）**：`thincoder-desktop/renderer/views/chat.mjs`（205）∥ `views/chat-scroll.mjs`（108）∥ `renderer/app.mjs`（336，`searchFace` 接线零改）∥ `renderer/frame-dispatch.mjs`（53）∥ `thincoder-vscode/src/extension/panel-settings-push.mjs`（121）∥ `chat-panel.mjs`（443）∥ `webview/settings-providers.js`（193）∥ `webview/chat-messages.js`（271）∥ `thincoder-core/config-io.mjs`（核写面——零改）。

#### 2.7 关键决策记录（含被否）

- **KD-TR-1（`#711`① 结算形）**：复读径面取**取代式**（`delta += measured − delta`，等价 `= measured`）——单源 = 写后复读真值（含前序实际位移，非估计并账）；面序前提（`mounted` 文档序）以码注明写。**被否**：①「按面独立坐标系记 delta」（大改记账面，收益 = 无）；②「复读径改测 `scrollTop` 变化」（读数含用户滚动噪声，且与本步「写后复读」语义相抵）。
- **KD-TR-2（`#711`② 缝形）**：核留**可选回调 dep**（`deps.reveal`）。**被否**：①「核直识 `[data-seg]`/段窗」（核零端机制知识——核件单源 = 两端同件，VSC 无段窗）；②「核派发 DOM 事件、端侧监听」（顺序与单源弱于显式回调）；③「端侧独立修」（端壳触不到核件内部跳转径——内部键径不经返回面）。
- **KD-TR-3（`#711`② 披露粒度）**：**一次性放窗**（段 ±1；同初窗 ∥ 重挂转移径，不计「≤2 段变更/帧」步进预算——该预算服务连续滚动渐进收敛，跳转为用户离散动作；成本上界 ≤3 段 ≈26ms < 50ms 长任务门）。**被否**：「逐帧渐进放窗」（跳转同帧不可达目标 ⇒ 本条目缺口不消）。
- **KD-TR-4（`#711`② 段账缝落形）**：**行内导出化（净 0 行）** + 新档承披露逻辑。**被否**：「本件新增披露函数（净 ≈ +8 行）」——497 贴 500（净增 >3 即须先执行在册拆分——本批不拆）。
- **KD-TR-5（`#1073` 无写态）**：无写 = **零回执**（非成功、亦非失败）+ 宿主 `console.warn` 一条（零静默）。**被否**：①「空钥归拒径 banner（`invalid-shape` 式对齐桌面）」——空 ≠ 错（守卫语义 = 零写零错；UI 侧空值 = 取消语义）⇒ 会把 no-op 冒充失败；②「无写发第二回执消息」（协议新消息 + webview 支路 = 不可达路径上的机制增殖；与 ①案原判「仅真写才发回执」相抵）。
- **KD-TR-6（`#1073` 判据单源）**：区分事实由**写面本体**（守卫实际触发点）给出。**被否**：「宿主前置复述空钥判据」（同一判据两处——漂移风险）。

#### 2.8 边界（不做）

`#711`①：段窗机制面零扩（段长 ∥ 窗宽 ∥ ≤2/帧预算 ∥ 回退常量开关皆不动）；不复读径与算式径之外的第三径。`#711`②：跨段全量选择 ∥ 复制受损面（E4-JS 三面受损之另两面）**不在本批**；未分段面（普通块）∥ 失败降级 = 现行为；VSC 搜索零变。`#1073`：webview 侧零改（零协议新消息）；空钥守卫本体（`!key || !key.trim()`）∥ 写后准入探零改；渠道名不存在径（§2.9 披露 2）不在本批。全批：不触他批、不扩条目、需求档零触。

#### 2.9 上抛项与披露

1. **§1 边界相抵——已裁（父侧 2026-10-10）**：按实况登三面（`thincoder-desktop/**` ∥ `thincoder-render-core/**` ∥ `thincoder-vscode/**`）；**边界服从实况**；§1 边界行由父侧随正（原行记 `thincoder-render-core/**` 为笔误——`segmentViewStep` 实住 desktop）。本 §2 已按裁定落。
2. **[上抛·知会] 同族潜径（`#1073` 射程外 · 本批零改）**：`thincoder-core/config-io.mjs:205`（`if (entry) entry.apiKey = key`）——渠道名不在配置 ⇒ 核子零写但返回 `null` ⇒ 同型「假成功」另一触发面（需回读核验方可消；非空钥条目射程）。
3. **[上抛·知会] 设计档值列滞后（非本批落点）**：`docs/desktop/design/PROJECT.md` §4.1 对渲染面若干行数与现读存在漂移（例：`views/chat.mjs` 最近收正记录 244 ⇒ 现读 205；`renderer/app.mjs` 293 ⇒ 336）——上述滞后值列非本批落点，披露归回填轮（父侧收窄 2026-10-10 · 可 revert）。
4. **[上抛·知会] 设计依赖披露**：① 结算序依赖 `settleFrame` 的 `mounted` 账序（上帧 DOM 文档序）——码注已指示随动义务；② `#1073` 无写径仍执行写后准入探（语义 = 准入刷新）。

#### 2.10 三链一致与用户视角自检

**三链**：条目（`#711`①② ∥ `#1073`）= §2.5 表行（逐行携条目号）= 判据腿（§2.2/§2.3/§2.4）同源；需求面回指 = 上述三条条目号 + §1 事实/证据行。**用户视角自检**：① 多巨块同帧滚动 ⇒ 页位不再跳（重复计消）；② `Ctrl+F` 命中巨块隐藏段 ⇒ 跳转到位（不再无反应），跳后段窗自动到位、无闪无跳；③ 空钥径 UI 不可达（发送方守卫）⇒ 用户可见面零变（无可走查项）；④ 视觉/文案/配置项零新增（无新交互面）。

#### 2.11 零触确认

本轮写入 = 本批档 §2 两条 append（`batch` 工具）；**仓内文件零写**（产品码 ∥ 设计档 ∥ 需求档 ∥ 测试面皆零触——批内件为实施轮拟新增）；未触他批、未扩条目；需求档合规核结论见 §2.1（边界相抵一条已裁）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象**：`docs/batches/2026-10-10-tail-residues.md` §2（三件收口设计块 · initial 轮）——`#711`①面序结算 ∥ `#711`②跳转披露 ∥ `#1073` 写结果三态。

**盘上复核（2026-10-10 现读 · 抽核）**：设计现读坐标逐条比对通过——`chat-text-segments.mjs` **497** ∥ `segmentViewStep` `:444-497` ∥ 复读径 `:485-487`（`:486` 守卫 ∥ `:487` `delta += after - plan.anchorBefore`）∥ 算式径 `:490-491` ∥ `:481` 累加器 ∥ `:493` 写阈（`> 0.5`）∥ `:479` 贴底覆盖 ∥ `ACCOUNTS` `:130` ∥ `applyWindow` `:320`（`export` 前缀 ⇒ 净 0 行，可行）∥ `padWindow` `:63` 已导出；`thincoder-render-core/search.mjs` **193** ∥ `createSearch(deps = {})` `:36` ∥ `showCurrentMatch` `:108-111`（reveal 插点 = `:109` 与 `:110` 之间）；`renderer/search.mjs` **26** ∥ import `:13` ∥ 实参 `:25`；`presets.mjs` **192** ∥ `storeProviderKey` `:45-48`（`:46` 早退）；`settings.mjs` **408** ∥ `:290-298`（透传 `:293`）；`panel-settings-push.mjs` **121** ∥ `:25-29`；`panel-messages-settings.mjs` **244** ∥ 判据 `:31-38`（回执 `:37`）；`chat.mjs` **205** ∥ `:203` 传 `account?.mounted` ∥ `:174`「上帧 DOM 块节点序记账」；`renderer/app.mjs` **336** ∥ `chat-scroll.mjs`（CHAT.md `:146` 在册 **108**）∥ `frame-dispatch.mjs`（RENDERER.md `:337` 在册 **53**）；`thincoder-render-core/` 全树零段窗件 ✓；`config-io.mjs`：`_setConfigPathForTest` `:37` ∥ `CONFIG_CONFLICT_HINT` `:42` ∥ `setProviderKey` `:201-208`（成功 ⇒ `null`）∥ `:205` `if (entry) entry.apiKey = key`；`e4js.md` `:34` 收正句 ∥ `:36` 拆分登记（净增越 3 行即先拆）；`RENDER-CORE.md` §3 行 32 = `:118`（`search.js` 判定行）∥ §5 构件族 `:219`；`WEBVIEW-PROTOCOL.md` §3.2 行 25 = `:120`（已含「宿主保存成功径才发」）⇒ 零改成立；`storeProviderKey` / `saveProviderKey` 全仓消费面只余本链（无第二消费方）⇒ 三态形变不波及其他站点；VSC 空钥 UI 不可达成立（`settings-widgets.js:29` `if (!v) { onCancel(); return }`）；冻结件两枚复跑无红——`provider-key-guards-vsc.test.mjs` T-V1/T-V2 驱真链（新形下 sink 序 ∥ `providerError` 词化码同值）、`desktop-heap-freeze.test.mjs` ⑪/⑫ 不驱使能态 `segmentViewStep`（零红）。机制推证复核：①甲（改前 `2ΔA + ΔB` ⇒ 改后 `ΔA + ΔB`）成立 ∥ 单面帧 `settled = 0` ⇒ 取代式 ≡ 原式成立 ∥ 复读径每帧唯一（`{seg}` 唯一 + 退化 `{seg: window.first}` 无矩形）成立。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership | 🟡 | 设计档随动行只点名 `docs/desktop/design/PROJECT.md` §4.1（`docs/batches/2026-10-10-tail-residues.md:103`），漏本域「值行单源」两处：`docs/desktop/design/CHAT.md` §3.1 持 `views/chat-text-segments.mjs` **497** 值行（CHAT.md:155）并为新档 `views/chat-segment-reveal.mjs` 的登记面；`docs/desktop/design/UI.md` §4.1 持 `renderer/search.mjs` **26** 值行（UI.md:491）。PROJECT.md §4.1 对这两档现为指针行（PROJECT.md:305 ∥ :359），且 RENDERER.md:341 载明「后续本域新档由落盘批在本表补值行」；`PROJECT-MANIFEST.json:47` 已把 CHAT.md §3.1 声明为行数面机检节域 | 随动行补 `docs/desktop/design/CHAT.md` §3.1（497 ⇒ 498 值行 + 新档值行）∥ `docs/desktop/design/UI.md` §4.1（26 ⇒ ≈28），与 PROJECT.md §4.1 指针行同拍 |
| 2 | Clarity | 🟡 | §2.9 第 3 条以「本批零触设计档，披露归回填轮」收束（`:136`），与 §2.5 随动行「设计档随动（实施轮笔）」点名七处设计档写点（`:103`）自相抵——实施轮读者可能据前者跳过随动 | 该句域收窄为「上述滞后值列非本批落点」（与 §2.5 随动行不相抵） |
| 3 | Acceptance criteria | 🟡 | `#711`② 机检法（甲 ∥ 乙 ∥ 丙，`:71-73`）未覆盖核缝失败径：`:60` 明写 `try { deps.reveal?.(el) } catch (error) { console.error("[search] reveal hook failed:", error) }`（零静默降级），但无腿断言「`reveal` 抛 ⇒ 记错恰一条 ∧ 跳转照常 ∧ 调用序不变」（E4-JS 批内件 ⑫ 对退段径有「退段必须记错」腿先例） | 增一腿（或并入乙）：`reveal` 抛 ⇒ `console.error` 恰一条 ∧ 命中件 `scrollIntoView` 仍被调 ∧ 先/后序不变 |
| 4 | Clarity | 🔵 | §2.9 第 3 条例证「`views/chat.mjs` 最近收正记录 244 ⇒ 现读 205」归属 §4.1（`:136`），但 244 实例住 PROJECT.md 变更记录（PROJECT.md:1710），§4.1 内该档只余指针行（PROJECT.md:305）；§4.1 内漂移实例 = `renderer/app.mjs` **293**（PROJECT.md:433） | 例证改指实际所在节或改举 §4.1 内实例（免回填轮按 §4.1 检索不到该行） |
| 5 | Feasibility | 🔵 | `#711`② 乙腿「驱 `performSearch` + `jumpSearch(1)`」（`:72`）需 `window.NodeFilter` + `document.createTreeWalker` 及 mark ∕ 片段级 DOM 操作；所引先例（E4-JS 批内件 ⑨ 假件形）不提供这两件（`chat-tool.mjs:259` 在册「平 node 用例面缺两件」），假文档装成本未在机检法点名 | 乙腿注记所需桩面（`window.NodeFilter` ∥ `document.createTreeWalker` ∥ `parentElement.closest`） |

**计数**：🔴 0 ∥ 🟡 3 ∥ 🔵 2（共 5 条——皆非阻断；VERDICT = pass）。
VERDICT: pass

## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
**状态行**：实施完成（三件落地；批内件 11/11 ∥ 冻结件 12/12 + 6/6；评审 1 轮 pass；终态 clean）



### 实施记录（eng-coder · 2026-10-10）

**口径**：本节 = 实施轮自写（一段一作者）；判据单源 = §2 设计块；坐标 = 实施后现读（as-of 2026-10-10，后续批次可再漂）。

#### A. 改动三件（坐标 ∥ 读数）

1. **#711① 面序结算**（`thincoder-desktop/renderer/views/chat-text-segments.mjs:486-489`）
   - 复读径 `:488`：`delta += after - plan.anchorBefore` ⇒ `delta = after - plan.anchorBefore`（取代式；等价 `delta += measured − delta`）。
     由：原式把「已结算前序位移」二次计入本面 delta（等价推导见 §2.2 甲腿批注）。
   - 口径注三处：档头 `:7` ∥ 函数注④ `:441` ∥ 结算点 `:487-488`（面序前提 = `mounted` 上帧 DOM 文档序；账序若改 ⇒ 同拍改）。
   - 零改面：算式径 `:492` ∥ 跟滚零读 `:472` ∥ 贴底覆盖 `:479` ∥ 写阈 `:494` ∥ `readout` 键集。
   - 读数：497 ⇒ **498**（净 +1；贴 500 线未越）。
2. **#711② 披露缝 ∥ 端壳接线 ∥ 段账缝**
   - 核缝 `thincoder-render-core/search.mjs:114`：`try { deps.reveal?.(el) } catch (error) { … }` 于 `:115` `scrollIntoView` 前；
     `scroll=false` 径早退不调；缺 dep 零变；抛错 ⇒ `console.error` 恰一条 + 跳转照常（下限不劣化）。
   - 新档 `thincoder-desktop/renderer/views/chat-segment-reveal.mjs`（**22 行**）：`revealSegmentAt(el)`——未分段 ∥ 未在账 ∥ 段号非法 ⇒ `false`（零写）；
     已在窗 ⇒ `true`（零写 ∥ 幂等）；否则 `applyWindow(record, padWindow({ viewFirst: seg, viewLast: seg }, record.count))`（段 ±1 一次性放窗）⇒ `true`。
   - 端壳 `thincoder-desktop/renderer/search.mjs:15`（import）+ `:27`（`createSearch({ root, reveal: revealSegmentAt })`）。
   - 段账缝（净 0）：`ACCOUNTS` `:130` ∥ `applyWindow` `:320` 加 `export`；`padWindow` `:63` 本已导出。
   - VSC 面 `thincoder-vscode/webview/search.js` 逐字零改（调用面单 `root`）。
   - 读数：核件 193 ⇒ **198**；端壳 26 ⇒ **28**。
3. **#1073 写面三态（回执 ⟺ 真写）**
   - `thincoder-vscode/src/extension/presets.mjs:48-50`：空 ∥ 全空白钥 ⇒ `{status:"no-write"}`；`hint` ⇒ `{status:"conflict",hint}`；否则 `{status:"ok"}`。
     `key.trim()` 语义保留（`CONFIG_CONFLICT_HINT` 透传不变）；注随正 `:44-46`。
   - `thincoder-vscode/src/extension/settings.mjs:293-297`：透传（形不变）；写后准入探 `probeProviderAdmission` 零改（语义 = 准入刷新，非写副作用）。
   - `thincoder-vscode/src/extension/panel-messages-settings.mjs:35-44`：`no-write` ⇒ `console.warn` 恰一条 + `return`（零回执）；
     `conflict` ⇒ `postProviderError(panel,"providers",hint)`（`mtime-conflict` 映射照旧）∧ 零回执；`ok` ⇒ 恰一条 `providerKeySaved{name}`；
     未知态 ⇒ 零回执（防御守卫 `:43`——评审 🔵 采纳，+1 行）。
   - 读数：presets 192 ⇒ **195**；settings 408 ⇒ **409**（+1 注行）；panel-messages 244 ⇒ **252**。

#### B. 机检读数（先红后绿 ∥ 冻结件）

- 批内件 `docs/batches/2026-10-10-tail-residues.test.mjs`（实读 **464 行** · 腿十 + ①戊 = 11 腿）：
  `node --test docs/batches/2026-10-10-tail-residues.test.mjs`（仓根）⇒ **11 pass ∥ 0 fail**。
- 先红后绿：①甲 `delta` 改前 = 2ΔA + ΔB = **360**（红）⇒ 改后 ΔA + ΔB = **330**（绿）；
  ③甲空钥径改前 = 1 条回执 ∥ 0 warn（红）⇒ 改后 = 0 回执 ∥ 1 warn ∥ 盘面零写（绿）。
  红探针 = `.thincoder/tmp/2026-10-10-tail-residues-red-probe.mjs`（临时区 · 非仓件）。
- 冻结件复跑（零回改）：`2026-09-30-desktop-heap-freeze.test.mjs` **12/12** ∥ `2026-10-08-provider-key-guards-vsc.test.mjs` **6/6**（T-V1/T-V2 驱真链）。
- `node scripts/doc-check.mjs`：本批面 **悬空 0**；行数面差异 1 条 = `docs/desktop/design/PACKAGING.md:340`（面外预存）；
  行宽 1 条 = `docs/core/requirements/AGENT-LOOP.md:340`（他批笔——`docs/batches/2026-10-10-agent-loop-allotment.md`，非本批）。

#### C. 设计档随动（六档 · 与代码同拍）

- RENDERER.md：§3 面序结算句 `:303` ∥ KD-54④「查找跳转已修（2026-10-10 · 尾行收口批 · #711②）」`:252` ∥ 变更记录 `:554`。
- CHAT.md：`:155`（**498**）∥ `:156`（新档 22）∥ 变更记录 `:260`。
- UI.md：`:491`（**28**）∥ 变更记录 `:821`。
- PROJECT.md：§4.1 新档指针行 `:360` ∥ 贴层段 `:390`（498 / 余 302）∥ 变更记录 `:1812`。
- RENDER-CORE.md：§3 行 32 `:118`（披露缝句）∥ §5 构件族 `:219`+`:221`（`createSearch({ root, reveal? })`）∥ 变更记录 `:600`。
- SETTINGS.md：§2.18 无写径条 `:610-611` ∥ 机检面追补 `:618` ∥ §5 U-S19 `:733` ∥ `:607` 引用坐标收正（`panel-messages-settings.mjs:43`）∥ 变更记录 `:865`。

#### D. 处断与披露（超清单 ∥ 记账差 ∥ 上抛）

- 超清单（轻）：`.thincoder/tmp/2026-10-10-tail-residues-red-probe.mjs`（临时区，未在 §2.6 声明；另 scratch 调试件 `tr-fake-dom-debug.mjs` 用后已删）——皆 gitignore 区，零仓面影响。
- 在册顺手收正（非本批致因，2 处）：`thincoder-desktop/renderer/search.mjs:19` ∥ `thincoder-render-core/search.mjs:28` 的 `app.mjs:277 ⇒ :288` ∥ `:70 ⇒ :74`（存量坐标漂移）。
- 评审 🔵 采纳：`panel-messages-settings.mjs:43` 增未知态零回执守卫（+1 行；三态行为不变，冻结件复跑复验）。
- 记账差：批内件 464 行（设计预估 ≈250-350；腿九 ⇒ 十为评审 F3 明文增量）；`settings.mjs` 409（预估 ±0）；核件 198（预估 ≈197）。
- **[上抛·待裁] 本席无权改写 §2（一段一作者）**：
  ① §2.9-3「本批零触设计档，披露归回填轮」与 §2.5 随动行 + 实况相抵（父裁 F1/F2 未落——六档实写已在盘）；
  ② `docs/vsc/design/WEBVIEW-PROTOCOL.md:120` ∥ `:439` 的 `panel-messages-settings.mjs:37` 随本批 +6 行漂至 `:43`（该档 §2.5 声明零改 ⇒ 本席未动，报告处置）。

#### E. 评审轮次与终态

- 内部 explore 背离审计 1 轮（4 项）：§5 空（= 本笔）∥ RENDER-CORE 纵段插位误（**已改**）∥ WEBVIEW-PROTOCOL 坐标（上报）∥ 超清单 tmp（披露）。
- 内部 advisor 代码评审 1 轮：**verdict = pass**（0 🔴 ∥ 2 🟡 记录面 ∥ 3 🔵）——🔵 两项已改（未知态守卫 ∥ 陈旧坐标），一项记账（464 行）；🟡 两项 = 本节补笔 + §2 归父侧。
- **终态 = clean**（无未决 🔴；余项皆记录面）。

## §6 验证与收口（父代理）

**交付物**：三件全落（eng-coder #89）—— `#711`① 复读径面序结算（取代式 `delta`；497 ⇒ **498**）∥ `#711`② 披露缝 + 端壳接线 + 段账缝（核 `search.mjs:114` 可选缝 ∥ 新档 `chat-segment-reveal.mjs`（22 行）∥ 端壳 `search.mjs:15/:27`）∥ `#1073` 写面三态（回执 ⟺ 真写）——批内件 11/11（先红后绿）∥ 冻结件 **12/12 ∥ 6/6** 零回改；随动六档与代码同拍。

**父侧验证读数**：批内件 11/11（先红后绿 = ①甲 360⇒330 ∥ ③甲 1 回执 ⇒ 0 回执/1 warn/盘面零写）∥ `node --check` 8 件 OK ∥ `doc-check` 本批面悬空 0。

**父侧载荷落讫（可 revert）**：① §2 随动行补 `CHAT.md §3.1`（497 ⇒ 498 值行 + 新档值行）∥ `UI.md` §4.1（26 ⇒ ≈28）（F1）∥ ② §2.9-3 句域收窄「上述滞后值列非本批落点」（F2）∥ ③ `WEBVIEW-PROTOCOL.md:120/:439` 坐标随正（`:37` ⇒ `:43-44`——+6 行漂移）∥ ④ `AGENT-LOOP.md:340` 超宽行折行（父侧自纠）。

**上抛处置**：① SETTINGS §2.16「第二闸复填在编输入」张力 ⇒ 父裁 = **两义分立**（系统值面 vs 用户草稿不跨形携带＝换形净起步）——`docs/desktop/design/SETTINGS.md:204` 就地注明；② `PROJECT.md` §4.1 行数滞后 ⇒ 台账 **#1180**（已入）；③ §2.9-3 与 §2.5 相抵 ⇒ 已收窄（F2 落）。

**评审终态**：顾问代码评审 1 轮 = pass（0🔴 ∥ 2🟡 记录面 ∥ 3🔵——🔵 两项已改）；探索审计 1 轮（4 项，插位已改 + 上报）。

**结算**：#711 ∥ #1073 ⇒ 核销（evidence = 本档 + 11/11 读数）。**待办**：波尾 scoped commit；无未决项。
