# 2026-09-25 · config 镜像写收口
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-25 · 来源 = 用户 2026-09-25 16:37 裁定「advisor 那个要停」（台账 #362：advisor.guard 同法停 config 镜像写——槽唯一权威）；+ 工程模式归属批（#358）实施轮域外第 5 条：`panel-messages-settings.mjs:144` 通用保存路径仍可达 `settings-panel-write.mjs:88`（白名单含 `engineering`）——同面残留通路一并收口。
> 台账 = #380（config 镜像写收口 · 归批）。前情 = `docs/batches/2026-09-25-eng-ownership.md` §1.9 / §6.3（已收口 2026-09-25）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-25
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 讨论来源

用户 2026-09-25 16:37 裁定「**advisor 那个要停**」——在父侧呈的两条消解径中选**①（同法收口）**：advisor.guard **亦停 config 镜像写**（槽唯一权威，与 engineering 同向）；**否决②「成文保留」**（该端差**不构成**结构性不对称）。另并入工程模式归属批（#358）实施轮域外第 5 条（残留通路）。

### 1.2 两条是什么（实读坐标）

- **A（#362 本体）**：`thincoder-vscode/src/extension/panel-messages-settings.mjs:163-166` = advisor.guard 的「slot authority + **config mirror**」双写。**分叉事实**：#358 已按用户裁定撤 **engineering** 键的 config 镜像写（`panel-messages-settings.mjs` 翻转路径调用 + `thincoder-vscode/src/agent/setup-tooltable.mjs` 的 `vscPersistRaw` 块与死引用）⇒ 落地后**同一设置面板内两键行为分叉**（engineering = 槽唯一权威；advisor.guard = 槽 + config 双写）。
- **B（残留通路）**：`panel-messages-settings.mjs:144` 的**通用保存**路径仍可达 `settings-panel-write.mjs:88`（**白名单含 `engineering`**——今日 webview 不发该键 ⇒ 潜在旁路）。槽唯一权威尚有一条可写入路。

### 1.3 范围与批级判据

**交付** = ① advisor.guard 停 config 镜像写（照 engineering 的收口形）；② engineering 键的通用保存残留通路收口（白名单 / 写面，二选一取舍）。
**批级判据**：① 面板两键行为**同口径**（engineering ∥ advisor.guard 均「槽唯一权威」）；② 被收口键**无旁路**（通用保存不可达，或明确允许 + 登记理由）；③ **行为读数**：翻转 / 任意保存前后 `config.json` 的对应键**逐字不变**；④ 三包测试全绿 + `node scripts/doc-check.mjs` 零新增闸态失败。

### 1.4 边界

- 本批 = **VSC 端产品代码面**（必要时连带核缝）；不改模式语义 · 不改**其他键**的镜像/写面语义（若他键存在同族双写 ⇒ 先登记、不顺手扩面）· 不改需求档 / 提示词 · 不碰 `docs/desktop/**`（他批写域）。
- 若收口必须动**核缝**（`configureEngMirror` 族或同类）⇒ 设计面逐处说明并标「连带面」，不得静默跨核。
- **落点候选** = `docs/vsc/design/SETTINGS.md`（面板设置面）；若 advisor.guard 镜像语义在 `docs/core/design/ENGINEERING-MODE-V2.md` / `MANIFEST.md` 有登记面 ⇒ 由设计者判定并纳入（只动与 advisor.guard / engineering 键写面相关的表述）。

### 1.5 修正轮裁定（父侧 · 2026-09-25 17:58）

- **发现 ① 的择支 = 认**：字面「写进表」在实施前不可执行（无新发射点行号，手写即伪造）⇒ 取**可行形**（§2.10 追记行 + 协议档本体零手改 + 实施轮 `--emit` 实读收正）；先例 = `2026-09-18-vsc-settings-wiring.md` §2.3 #17「表体随实现同步」。**「两头留」不成立**——§3 登记行支不取的理由（语义相悖）成立。
- **同病声明（§2.2:60 vs §2.10）= 认**：批档 append-only（工具语义禁止改写既有行）⇒ 只能「追条 + 声明本节为准」；`SETTINGS.md` 侧已收净（`agent-state.mjs:93-101` 零残留）✓。
- **新域外项（`WEBVIEW-PROTOCOL.md:469` 坐标漂移 `settings-agent.js:141` vs 现读 `:146`）裁定 = 并入本批实施轮的协议档行收正**（同一表、同一收正动作，§2.10 追记行已含「行坐标实施轮实读收正」）——不另开条目。
- **到期核对**：#1 的实施轮落地 = **已登记待执行项**（非静默延后）✓，随实施轮完成。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（A/B/B′ 收口设计 + 测试面 + 落点判定；评审轮 1 修正已落（#1–#4 · §2.10））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.0 交付与判据对照（§1.3 ← → 设计）

**交付** = ① advisor.guard 停 config 镜像写（照 engineering 收口形）；② engineering 通用保存残留通路收口（白名单 / 写面二选一）。

| §1.3 判据 | 设计满足方式 | 机检指针 |
|---|---|---|
| ① 面板两键同口径（槽唯一权威） | A 落地后 `handleSetAdvisorGuard` 与 `handleSetEngineeringEnabled` 同形（槽写 + `_pushSettingsLight()`；零 config 写）——范本 = #358 已收口形 | T-1 / T-2 / T-3 |
| ② 被收口键无旁路 | engineering = 白名单删项（B）；advisor.guard = 删通用保存 guard 赋值行（B′）；webview 发值面各归专线 | T-4 / T-5 |
| ③ 行为读数：翻转 / 任意保存前后 config 对应键逐字不变 | 写面只剩种子循环 verbatim 存活（`settings-panel-write.mjs:136-140`） | T-1…T-7 |
| ④ 三包测试全绿 + `node scripts/doc-check.mjs` 零新增闸态失败 | 2.4 两档测试面；实施轮读数入 §5 | 三包 + doc-check |

### 2.1 本批条目（覆盖）

| # | 条目（来源） | 交付 | 设计落点 |
|---|---|---|---|
| E-1 | advisor.guard 停 config 镜像写（台账 #362 本体 / #380；用户 2026-09-25 16:37 裁定①「同法收口」） | ① (A) | 三档：`panel-messages-settings.mjs`（删镜像调用 + 注释）· `webview/settings-agent.js`（复选框改接既有消息）· `settings-panel-write.mjs`（删 guard 活旁路 B′） |
| E-2 | engineering 通用保存残留通路收口（#358 实施轮域外第 5 条） | ② (B) | `settings-panel-write.mjs:88` 白名单删 `engineering` |
| E-3 | AC④ 行为断言资产化（台账 #379——消解径含「并入 advisor.guard 收口批的测试面」） | — | 本批测试面落常驻行为断言（T-3 / T-6 族）；#379 核销建议随本批收口（主 agent 笔权） |

（#379 并入 = 其消解径明列「或并入 advisor.guard 收口批的测试面」⇒ 本批即该到期条件。）

### 2.2 机制设计（写面契约：槽唯一权威）

**A · advisor.guard 翻转路径**（`thincoder-vscode/src/extension/panel-messages-settings.mjs:161-168`，as-of 2026-09-25）：

- 删 `:166` 镜像调用（`saveAgentSettingsFromPanel({ advisor: { guard } })`）+ `:163-164` 两行镜像注释；
- 保留 `try { setSlotAdvisorGuard(cwd, slot, on) } catch {}` + `:167` `panel._pushSettingsLight()`——与 `handleSetEngineeringEnabled`（`:171-180`）同形（槽写 + 推送；零 config 写）；
- 读面零改：`settings.mjs:204` 取值链 = `slotData?.advisor?.guard ?? (config === true)`（槽优先）；快照每轮重建（`agent-state.mjs:93-101`）⇒ 翻转后复选框回填随推送刷新。

**B′ · guard 的通用保存面**（`thincoder-vscode/src/extension/settings-panel-write.mjs:142`）：

- 删整行 `merged.guard = adv.guard !== undefined ? !!adv.guard : (merged.guard ?? false)`——该行双罪：① 载荷带 `advisor.guard` 即直写 config（活旁路 ⇒ 破判据②）；② 载荷缺席时 `?? false` 物化 `guard:false`（破判据③）；
- 删后 guard 只经种子循环（`:136-140`）**verbatim 存活**：在场按原值回写 · 缺席保持缺席 · 零强制转换。

**B · engineering 的通用保存面**（`settings-panel-write.mjs:88`）：白名单删 `engineering` 项——通用保存不可达该键（判据②）；写面唯一权威 = 会话槽（#358 已定）。
**零行为变化旁证（本席实读穷尽）**：webview 通用保存发值面 = `settings-agent.js` 唯一载荷构造点 + `settings-providers.js:89`（只 `defaultModel`）⇒ engineering 零发值、guard 仅专线。

**面板复选框接线**（`thincoder-vscode/webview/settings-agent.js`）：

- `:122` 删载荷 `guard` 字段（通用保存链不再携带该键）；
- `:163-165` 绑定列表 `["adv-guard", …]` → `["consult-turns","consult-timeout"]`（余下 autoSave 触发件），并给 `#adv-guard` 新挂 change 监听：post `{ type: "setAdvisorGuard", value: checked }`——**复用既有消息类型，协议零增量**（镜像 = `webview/mode-buttons.js:37` 同型 post）；
- 文案 / 本地化零改（`locales/zh.json:110` / `locales/en.json:187` 在册，本批零触碰）。

**核缝判定（§1.4 第 2 条）——零核缝连带**：本批零核侧文件改动（2.4 全列）；guard / engineering 槽写走既有 `@thincoder/core/session-slot-write.mjs` re-export（零签名变化）；`configureEngMirror` 族 VSC 侧现体 = 槽写 + catch 注释逐字「no config mirror」（`src/agent/setup-tooltable.mjs:89-97`，实读）⇒ #358 已收口，无连带面。

### 2.3 设计档落点（§1.4 第 3 条判定）

- **主落点 = `docs/vsc/design/SETTINGS.md`**（本轮落）：新增 §2.14（两键写面契约）+ §3 登记 2 条（`null` 用例域边界 · 措辞残余族）+ §5 U-S13 + 变更记录 1 行。
- **`ENGINEERING-MODE-V2.md` / `MANIFEST.md` 判定 = 不纳入（零改）**：本席实读——两档 `advisor.guard` 零写面陈述；engineering 命中全为模式门读面（槽优先 + config 回退）与已收口句（`:379` 翻转点 = 槽写）；唯一「config.json 镜像」措辞 = `ENGINEERING-MODE-V2.md:377`（**读面回退**语境——depth>0 面 truthful-read 回退说明，行为未变）⇒ 不属「键写面相关表述」，且同属 #378 措辞族（在册）⇒ 归其到期条件（见 2.8）。
- 本批零改：需求档 / 提示词 / `docs/desktop/**`（§1.4）。

### 2.4 受影响文件与测试面

**受影响文件（坐标 as-of 2026-09-25；行数口径 = `type | find /c /v ""`）**：

| 文件 | 现读数 | 期望 Δ | 内容 |
|---|---|---|---|
| `thincoder-vscode/src/extension/panel-messages-settings.mjs` | 206 | −3 | A：镜像调用 + 两注释 |
| `thincoder-vscode/src/extension/settings-panel-write.mjs` | 198 | −2 | B 白名单行 + B′ guard 赋值行 |
| `thincoder-vscode/webview/settings-agent.js` | 180 | ≈ −1 / +4 | 载荷删字段 + 绑定重挂 |
| `thincoder-vscode/test/config-io-panel.test.mjs` | 185 | +≈100（实施轮实读） | +8 案（下表）+ V-3 / V-4 载荷换中性 |
| `thincoder-vscode/test/effort-select-views.test.mjs` | 191 | ≈ ±10 | 触发件换 `#consult-turns` + 断言补（载荷无 `guard` 键 · guard 变更 ⇒ post `setAdvisorGuard` 且零 `saveAgentSettings`） |
| `docs/vsc/design/SETTINGS.md` | 524 | +≈45 | 本席本轮落（2.3） |

- 五档均 <300 软线 ⇒ 无拆分计划；**预案**：`config-io-panel.test.mjs` 若实施实读越 300 ⇒ 拆分边界 = advisor.guard / engineering 写面组析出 `thincoder-vscode/test/config-io-panel-guard.test.mjs`（拟新增；`test/files.mjs` 同步登记），届时执行。
- 不新增测试档（预案仅在越线时触发）。**用例断言口径**：新案以真实 `saveLines` 物化槽（同档 selectModel 用例先例）→ 发消息 → 断言槽值 + config 键**存留性 + 值**四态（`undefined` / `null` / `false` / `true`）可辨的前后恒等。
- 既有用例处置：V-1（`:136`）种子 verbatim 存活**不变**；V-3（`:160`）/ V-4（`:167` / `:169`）载荷换中性（`{timeoutMs:60000}` / `{maxTurns:111}`）——原载荷含 `guard` 键，本批后该键不可达写面。

**用例表（新案）**：

| 案 | 类 | 输入 | 期望 |
|---|---|---|---|
| T-1 | 正常 | 面板 `setAdvisorGuard {value:true}`（槽已认领） | 槽 `advisor.guard === true`；config 对应键逐字不变；推送刷新 |
| T-2 | 正常 | 同上 `{value:false}` | 槽 `false`；config 逐字不变 |
| T-3 | 正常 | 面板 `setEngineeringEnabled {value:true/false}`（#379 资产） | 槽变；config 逐字不变 |
| T-4 | 边界（旁路直测） | 通用保存载荷**伪造** `engineering:true` | config `agent.engineering` 不写（白名单已删项）；槽不受影响 |
| T-5 | 边界（旁路直测） | 通用保存载荷**伪造** `advisor:{guard:true}` | config `advisor.guard` 不动（B′ 已删） |
| T-6 | 边界（判据③主案） | config `advisor.guard` ∈ {缺席 · `true` · `false`} 三格 × 通用保存 | 三格各自前后恒等（缺席仍缺席；零 `false` 物化） |
| T-7 | 边界（登记钉住） | config `advisor.guard: null` × 通用保存 | 零新值物化（≠ `false` / ≠ `true`）；其余键不变（磁盘存留随 §3 登记） |
| T-8 | 错误 | 槽未认领（`loadSlotForWrite` → `null`）翻 guard | 面板不崩（`catch` 兜底）；config 逐字不变 |

### 2.5 同源链（条目 ↔ 设计档 ↔ 需求面）

三链同源 = E-1 / E-2 ↔ SETTINGS.md §2.14 + U-S13（本轮落） ↔ **需求面 = 台账 #380 / #379 / #362 + 用户 2026-09-25 16:37 裁定**——本批无对应需求档条目，§1.4 明示不改需求档 ⇒ 需求档零改（若需立条目 ⇒ 见 2.9-3）。

### 2.6 边界（本批不做）

- 不改模式语义（engineering 模式判定 / 写入点 / 恢复语义）；不改**其他键**的镜像 / 写面语义（他键他面同族双写 ⇒ 只报，见 2.8 第 1 条）；
- 零核侧文件改动（无「连带面」）；不改 webview 协议（复用既有消息，零 +1 类型）；
- 不改需求档 / 提示词 / 不碰 `docs/desktop/**`（他批写域）。

### 2.7 关键决策（含被拒备选）

- **KD-1（A 形）**：取「删镜像调用」；被拒 = 「保留双写 + 在配置侧丢弃」（判据藏进写入器内部、双写路径仍在）。
- **KD-2（B 形）**：取「白名单删项」；被拒 = ①「保留条目 + 保护分支」（engineering 已非面板可写配置键 ⇒ 死面 + 长期维护成本）②「改 webview 侧不发」（已零发值 ⇒ 零收益）。
- **KD-3（B′ 形）**：取「删 guard 赋值行」；被拒 = 「保留 guard 透传」（= 保留 config 写面 ⇒ 破判据③）。
- **KD-4（复选框走线）**：取「复用既有 `setAdvisorGuard` 消息」；被拒 = ① 新增消息类型（协议 +1，零必要）② 通用保存链双跳（先写槽再连带保存 ⇒ 破判据③）。
- **KD-5（核缝）**：判定零核缝连带（证据见 2.2 末）——不标「连带面」。
- **KD-6（`null` 边界）**：登记不修（既有通例、本批零引入）；用例域收窄为 {缺席 · `true` · `false`} + T-7 钉住「零物化」（登记行 = SETTINGS.md §3）。

### 2.8 域外只报（本批零触碰；主 agent 台账笔权）

1. **CLI `persistGuard` 同族双写**：`thincoder-cli/…/cmd-advisor.mjs:30-43` = 槽 + config 双写（另一产品面）——按 §1.4「他面同族双写先登记不扩面」⇒ 只报，建议另册。
2. **措辞残余族（#358 撤写 + 本批撤写的残留语句）**：① `docs/core/design/ENG-TOKEN-BINDING.md:100`（「slot 持久化 = 会话槽 + config.json mirror」——mirror 已撤）② `docs/vsc/design/WEBVIEW-PROTOCOL.md:111`（「只做槽写 + config 镜像 + 结果尾提示串」——现体零 config 镜像）③ `docs/core/design/ENGINEERING-MODE-V2.md:377`（读面回退句）④ 注释 / 产品文本：`thincoder-vscode/AGENTS.md:86` · `thincoder-vscode/src/extension/settings.mjs:181` · `thincoder-vscode/src/extension/panel-session-write.mjs:92` · `thincoder-vscode/webview/mode-buttons.js:3-4`（「These mirror config.json fields」——engineering / advisor 两钮语境已失实）。台账 #378 在册集 = `TOOLS.md:81` / `:122` + 注释三处（④ 前三项）；**①② 与 ④ 的 `mode-buttons.js:3-4` 项 = 本轮新增实读（未在册）**。
3. **需求档面**：本批无对应需求档条目（需求面 = 台账行）——若需在 `requirements/WEBVIEW.md` 登记「两键槽唯一权威」，= 主 agent 笔权。

### 2.9 上抛项（待裁）

1. 2.8-2 的「新增未在册」三项（`ENG-TOKEN-BINDING.md:100` · `WEBVIEW-PROTOCOL.md:111` · `mode-buttons.js:3-4`）是否随本批收正 ⇒ 扩面需主 agent 裁定（本席按 §1.2 / §1.4 未扩）。
2. 台账动作建议（主 agent 笔权）：#380 → 待核销（随本批）；#379 → 核销（测试面已入本批）；#362 已废弃（并入本批）；2.8-2 新增三项 → 并入 #378 或另册。
3. 需求档是否需要新增「两键槽唯一权威」条目 ⇒ 主 agent 定。

**机检面（本批）**：`thincoder-vscode/test/config-io-panel.test.mjs`（T-1…T-8）· `thincoder-vscode/test/effort-select-views.test.mjs`（绑定与载荷断言）——与本节用例表同源；实施轮读数入 §5。

### 2.10 设计评审轮 1 修正（fix 轮 · 承 §3 轮次 1 四条 · 零新语义）

**#1（🟡 协议档表体缺失）——择支：写进受影响文件表（表外追记）**。§3:165 两分支取「写进表」支之可行形（原表 append-only，不回溯改写）：
- **追记行**：`docs/vsc/design/WEBVIEW-PROTOCOL.md`（现 627 行 | ≈+1 | §13 `setAdvisorGuard` 行（`:478` as-of 评审实读）② 列并入 `webview/settings-agent.js` 专线发射点 + 变更记录 1 行；行坐标实施轮 `--emit` 实读收正）。改前 `--emit` 读数：`setAdvisorGuard | webview/mode-buttons.js:37 | panel-messages.mjs:349`（新发射点待实施轮落地入册）。
- **不取「§3 登记行」支**：该档为**本批交付物面**（实施轮写收口会改它），§3 行语义 = 「不改 + 到期条件」登记——择支相悖；且 literal「写进表」不可执行（实施前无行号，手写 = 伪造）。
- **先例** = `docs/batches/2026-09-18-vsc-settings-wiring.md` §2.3 #17「表体随实现同步（实现轮）」。本 fix 轮零手改协议档；实施轮落地 + 读数。

**#2（🟡 读面句错面引用 + 失实句）——已修**。`SETTINGS.md:403-404`（改后）＝「读面零改：guard 取值链每次快照构建按槽优先（`thincoder-vscode/src/extension/settings.mjs:204`——`slotData?.advisor?.guard ?? (config === true)`）；复选框随建面 / 重开按快照渲染（推送不重建面板——`thincoder-vscode/webview/settings-agent.js:147-148`/`:178-180`）。」——原句「快照随每轮重建（`agent-state.mjs:93-101`）⇒ 翻转后复选框回填随推送刷新」（错面引用 + 失实推送断言）同笔收正；收正后 SETTINGS.md 内 `agent-state.mjs:93-101` 零残留。
- **同病同修**：§2.2 第 3 条 bullet（:60）载同病（同一错面引用 + 同一失实句）——收正形式以上句为准（**本节为准**；§2.2 不回溯改写）。

**#3（🔵 `null` 静态预期未定死）——已修**。`SETTINGS.md` §3 登记行（`:453`，改后）＝「静态预期（本批）= `null` ⇒ 保存后键缺席（非 `null` / 非 `false`）——机制链（实读）：种子循环先丢该 null ⇒ `patch.advisor` 不含该键（`:173`）⇒ `applyAgentPatch` 顶层整键替换（`:30-37`——`advisor` 顶层键整段覆盖、无深合并）⇒ 盘上该键缺席。」
- 到期条件收正 = `settings-panel-write.mjs` 种子循环下次被触碰（删「实施轮读数显示实际变化时」）；T-7（§2.4 表）期望「磁盘存留随 §3 登记」经此行收正 ⇒ 断言形态 = **保存后该键缺席**；**实施轮只回填读数、不判语义**（读数与静态预期不符 ⇒ 回评审，不自行改判）。

**#4（🔵 零徽标未登记）——已修（取建议首支）**。`SETTINGS.md:400`（新增行）＝「无「已保存」徽标（观感面）：翻转走专线不经 `autoSaveAgent`（其徽标闪点 = `thincoder-vscode/webview/settings-agent.js:154-155`）⇒ 翻转不闪「已保存」徽标；与工具栏开关同口径（`webview/mode-buttons.js:37` 亦零徽标）。」——备选「翻转内补 `flashSaved`」未取：翻转已即时生效，补徽标反改观感面（`flashSaved` 现挂面 = 面板其余保存路径，与 guard 翻转零关联）。

**同笔记录（零新语义）**：`SETTINGS.md` 变更记录追加 fix 轮条目 1 条（`:567-568`，承 §3 轮次 1）；现档 569 行（本 fix 轮 +3 = 观感差 1 行 + 变更记录 2 行；`.md` 免线）。

**命令读数（改后）**：
- `cd thincoder && node scripts/doc-check.mjs`：**悬空 4 / 行宽 18**——与改前基线同（两目标档零项）：悬空 4 = MODEL-SPECS.md ×3（`provider/core.mjs` ×2 · `cacheMode` 符号）+ SESSION.md ×1；行宽 18 = CORE-UNIFICATION ×2 / MODEL-BENCH ×6 / MODEL-SPECS ×6 / VSC-DEBT ×3 / WEBVIEW.md ×1——全在他档 ⇒ **零新增**。
- D6 读回：6 处改动逐处回读 ✓（含插入行与 changelog 尾 2 行）。
- 三包测试未重跑：本轮零代码改动（仅设计档 6 处），机检口径无变化。

**域外只报（不手改）**：`WEBVIEW-PROTOCOL.md:469` `saveAgentSettings` ② 列 `settings-agent.js:141` vs 现读 `:146`（坐标漂移，疑 `b19fcb9b` 同 wave 落地所致，未 diff 证实）——建议随实施轮顺带收正或另裁。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象**：`docs/vsc/design/SETTINGS.md` §2.14（guard 写面收口：写面契约表 / webview 接线 / 发值面穷尽旁证 / 读面零改 / 机检面 / 边界登记）+ §3 两条登记 + U-S13 + 变更记录；批次档 §2 为设计面承载（`docs/batches/2026-09-25-config-mirror-closeout.md`）。评审类型 = 设计评审（不读 git diff）。

**实读点检（逐条核对设计声明，非信任转述）**：
- A 面：`handleSetAdvisorGuard`（`panel-messages-settings.mjs:161-168`）实为注释 `:163-164` + 槽写 `:165` + 镜像 `:166` ⇒ 与批档 §2.2「删 `:166` + 两注释」逐字相符；`handleSetEngineeringEnabled`（`:171-180`）= 槽写 + 推送（同形范本）。
- B 面：`settings-panel-write.mjs:88` = `if (payload.engineering !== undefined)` 直写行；`:136-140` 种子循环（`v === null` 除 `thinking` 外 continue）；`:142` = `merged.guard = adv.guard !== undefined ? !!adv.guard : (merged.guard ?? false)` 逐字相符；`applyAgentPatch`（`:30-37`）为顶层整键替换 ⇒ 删 `:142` 后 guard 仅经种子循环 verbatim 存活（判据成立）。
- webview 面：`:122` = `guard: chk("adv-guard")`；`:163` 触发列表含 `adv-guard`；`#adv-guard` 渲染位在 consult/advisor 卡（`:58`／`:40`）、不在 `agCard` 全绑域（`:158`）内；`bindConsultRows`（`settings-models.js:193-217`）只绑 `.consult-del` 与 add ⇒ **无双发风险**（专线 post 不叠加通用保存）。
- 发值面穷尽旁证成立：全 webview 树 `saveAgentSettings` 发射点 = `settings-agent.js:146` + `settings-providers.js:89`（只 `defaultModel`）⇒ engineering 零发值、guard 仅专线。
- 协议零增量成立：`setAdvisorGuard` 既有发射 = `mode-buttons.js:37`、host 路由 `panel-messages.mjs:349`、`WEBVIEW-PROTOCOL.md` §13 在册（`:478`）。
- 读面：`settings.mjs:204` 取值链槽优先逐字相符；工具栏态 `mode-buttons.js:117-122` 随推送同步（本批后仍成立）。
- 受影响文件行数点检 5/5 与 `read` 口径一致（206 / 198 / 180 / 185 / 191）；SETTINGS.md 变更记录 +≈45 实得 ≈+42（`≈` 口径内，且 `.md` 免线）；无档越 300 / 500 线（`config-io-panel.test.mjs` 185+≈100 ⇒ 预案已备）。
- 既有用例影响域穷尽：面板写面含 guard 的断言仅落在 `config-io-panel.test.mjs:136/:160/:167/:169` 与 `effort-select-views.test.mjs:175`（两档均在受影响文件表内）；其余 guard 用例（`advisor-guard-rounds.test.mjs` / `agent-lifecycle-singleton.test.mjs` / `agent-session-fields-roundtrip.test.mjs`）走 `applySlotSessionState` / 槽面，零影响。

| # | 类别 | 严重度 | 问题 | 建议 |
|---|---|---|---|---|
| 1 | 文档归属 / 完整性 | 🟡 | 受影响文件表与「零改」清单均未含 `docs/vsc/design/WEBVIEW-PROTOCOL.md` §13 发面表行；§2.14:398-399 在 `webview/settings-agent.js` 新增 `setAdvisorGuard` 发射点，而该行 webview 坐标单元现为单点 `webview/mode-buttons.js:37`（`WEBVIEW-PROTOCOL.md:478`）——多发射点在册写法 = 坐标以 `/` 并联（`:466` `removeProvider` · `:469` `saveAgentSettings` · `:476` · `:479`）。反向对账机检只比**判别式集合**（`protocol-coverage-reverse.test.mjs:306-311` / `:357-363`），同判别式新增发射点不红 ⇒ 表行静默欠报。 | 把该坐标单元的更新（或「本批不改 + 到期条件」）写进受影响文件表或 §3 登记行——二选一，使表行读数与实测输出不分叉。 |
| 2 | Clarity | 🟡 | §2.14 读面零改行（SETTINGS.md:403）以「快照随每轮重建（`agent-state.mjs:93-101`）⇒ 翻转后复选框回填随推送刷新」佐证读面零改，但该坐标 = 运行时 `agent.config` 每轮重建面（`thincoder-vscode/src/agent/agent-state.mjs:90-101`），非面板快照面；面板侧推送只经 `updateAgentSettings` 合并 `SS.agentSettings`（`settings-agent.js:178-180`），复选框只随建面 / 重开按快照渲染（推送不重建面板——`settings-agent.js:147-148`；`#adv-guard` 不在 §2.8 F-W9 回填表内）。引用亦未带目录前缀（同档其余坐标为仓根相对全路径）。按此句写「推送 ⇒ 复选框刷新」型断言会红。 | 改写为「取值链每次快照构建按槽优先（`thincoder-vscode/src/extension/settings.mjs:204`）；复选框随建面 / 重开按快照渲染」，并把引用补为全路径。 |
| 3 | Clarity（用例口径） | 🔵 | §3 `advisor.guard: null` 登记行（SETTINGS.md:450-453）把该形态的磁盘存留判给「实施轮读数」，而该结果可由写入器语义静态判定：`applyAgentPatch`（`settings-panel-write.mjs:30-37`）顶层整键替换 ⇒ `patch.advisor` 内缺席的键在盘上随整段覆盖消失（种子循环已先丢 `null`）⇒ 保存后该键为**缺席**。T-7 现口径「零新值物化」与该预测一致，但未写死预期盘面。 | 在登记行写明静态预期（保存后键缺席）并由 T-7 断言该形态，使用例口径确定。 |
| 4 | 观感面 | 🔵 | `#adv-guard` 从 autoSave 触发列表摘出（`settings-agent.js:163-164`）改挂专线 post 后，翻转不再经 `autoSaveAgent` ⇒ 不再闪「已保存」徽标（`settings-agent.js:154-155`）；设计只声明「文案 / 本地化零改」（SETTINGS.md:399），未登记该观感差。 | 在 §2.14 明示该观感差（与工具栏 `mode-buttons.js:37` 同口径 = 无徽标）或按 §3 观感面体例登记。 |

**计数：🔴 0 · 🟡 2 · 🔵 2**（无 🔴 ⇒ 不阻塞）。范围限制：无声明面标准档（方法学按 AGENTS.md + 批档自身体裁定）；无文档地图（文档归属按 Project Guide + 批档 §2.3 落点判定判据）。

VERDICT: pass

## §4 用户批准（主 agent）

### 4.1 设计批准（用户 · 2026-09-25 17:59）

**依据**：用户 2026-09-25 17:59「**批**」（四条清单第 4 条）。**此前置**：设计评审 **pass**（§3 轮次 1 · 🔴0 / 🟡2 / 🔵2）+ 修复轮四条全落（§1.5 裁定）+ 父侧核验通过。

**批准射程** = 本批设计（advisor.guard 停 config 镜像写 · engineering 通用保存通路收口 · 两键槽唯一权威）⇒ **派 eng-coder 实施**（designToken 见评审回执——**按凭据纪律不入档**）。

## §5 实施记录（eng-coder）

### 交付摘要（4 改点全部落地）

| # | 改点 | 落点（文件） | 内容 |
|---|---|---|---|
| ① A | advisor.guard 停 config 镜像写 | `thincoder-vscode/src/extension/panel-messages-settings.mjs`（`handleSetAdvisorGuard`） | 删 `saveAgentSettingsFromPanel({ advisor: { guard } })` 调用；镜像注释改「Slot only… no config.json mirror」；保留槽写 + `_pushSettingsLight()`——与 `handleSetEngineeringEnabled` 同形 |
| ② B | engineering 通用保存通路收口 | `thincoder-vscode/src/extension/settings-panel-write.mjs` | 白名单删 `if (payload.engineering !== undefined) patch.engineering = …` 行——该键通用保存不可达 |
| ③ B′ | guard 通用保存活旁路收口 | 同上 | 删 `merged.guard = adv.guard !== undefined ? !!adv.guard : (merged.guard ?? false)` 整行；guard 只经种子循环 verbatim 存活（在场原值 / 缺席保持缺席 / 零 `?? false` 物化） |
| ④ 接线 | 面板复选框改走专线 | `thincoder-vscode/webview/settings-agent.js` | 载荷 advisor 段删 `guard` 键；通用保存触发件列表 `["adv-guard","consult-turns","consult-timeout"]` → `["consult-turns","consult-timeout"]`；`#adv-guard` 新挂 change ⇒ post 既有 `{ type: "setAdvisorGuard", value: !!checked }`（协议零增量）；文案 / 本地化零改 |
| ⑤ 测试面 | AC④ 行为断言资产化 | `thincoder-vscode/test/config-io-panel-guard.test.mjs`（新）· `config-io-panel.test.mjs` · `effort-select-views.test.mjs` · `files.mjs` | T-1…T-8 新建；V-3 / V-4 载荷换中性 + 补载体段落盘正控；effort V-3 触发件换 `#consult-turns`、补「载荷 advisor 面零 `guard` 键」；effort 追加 V-7（专线双向量翻转 + 值随 checked + 零双发）；`files.mjs` 登记新档 |
| ⑥ 协议档 | §13 反查表 + 变更记录收正 | `docs/vsc/design/WEBVIEW-PROTOCOL.md` | `setAdvisorGuard` 行 ② 列并入 `webview/settings-agent.js:167`；`saveAgentSettings` 行 ② 列坐标 `:141` → `:145`；变更记录 1 条（4 行） |

**文件与行数读数（口径 = 换行符计数，同 `type | find /c /v ""`）**：

| 文件 | §2.4 设计 Δ | 实测 | 差异说明 |
|---|---|---|---|
| `panel-messages-settings.mjs` | −3 | **205**（206 → −1） | guard 处两行镜像注释取「替换为现体准确注释」而非纯删（设计字面 = 删两行）；调用行确已删 |
| `settings-panel-write.mjs` | −2 | **199**（198 → +1） | B 白名单行 / B′ 赋值行确已删；B′ 处补 3 行说明注释（`guard` 非本面载荷字段——槽写唯一） |
| `webview/settings-agent.js` | ≈−1 / +4 | **183**（180 → +3） | 栏内 |
| `test/config-io-panel.test.mjs` | +≈100 | **192**（185 → +7） | 拆分后余 V-1 / V-2′ / V-3 / V-4 / V-6；档头加新档指针 3 行 |
| `test/config-io-panel-guard.test.mjs` | （预案） | **176**（新档） | 拆分触发：实施轮末实读原档 307 > 300 软线（批档 §2.4 预案执行） |
| `test/effort-select-views.test.mjs` | ≈±10 | **213**（191 → +22） | 超出估计 = 追加 V-7 案（§2.4:101 要求未指案号，本席拟 V-7） |
| `docs/vsc/design/WEBVIEW-PROTOCOL.md` | ≈+1 | **632**（627 → +5） | 两行表体改写（0 净增）+ 变更记录 1 条 4 行 |

**机检读数（实施轮实跑）**：

- `cd thincoder-core && npm test` ⇒ tests 679 / pass 679 / fail 0（首跑 1 次 `test/git-noninteractive.test.mjs` A26 时间敏感案在满载并发下超阈失败——单档隔离复跑 5/5 pass、全档复跑 679/679 pass ⇒ 判为负载抖动，核侧本批零触碰）。
- `cd thincoder-cli && npm test` ⇒ tests 863 / pass 863 / fail 0。
- `cd thincoder-vscode && npm test` ⇒ tests 1006 / pass 1006 / fail 0 / cancelled 0 / skipped 0。
- `cd thincoder && node scripts/doc-check.mjs` ⇒ 汇总 候选 25017 · **悬空 4** · 注记豁免 43 · 拟新增 49 · 迁移期引文 221；**行宽 18 行超 300**——与基线（悬空 4 / 行宽 18）**零新增**（首跑本席变更记录行 404 字符曾触发 +1，已改 4 行折行）。
- 协议档坐标口径 = `cd thincoder-vscode && node test/protocol-coverage-reverse.test.mjs --emit --full`：`setAdvisorGuard | webview/mode-buttons.js:37/webview/settings-agent.js:167 | src/extension/panel-messages.mjs:349`、`saveAgentSettings | webview/settings-agent.js:145/webview/settings-providers.js:89 | …:294`——两行与档体逐字相符（读回核对）。

**决策透明表**：

| 决策 | 取形 | 理由 / 备选 |
|---|---|---|
| 载荷中性化（V-3 / V-4） | 原载荷含 `guard` 键（本批后不可达写面）⇒ 换 `{advisor:{timeoutMs:60000}}`（V-4 第二发另加 `maxTurns:111`） | 载荷留空 ≠ 中性：`payload.advisor === undefined` ⇒ advisor 合并分支整段跳过 ⇒ 原断言退化为恒真（失去守门力）。故每案补「载体段已落盘」正控（`advOf().timeoutMs === 60000`）；备选「删键后留空载荷」被拒 = 断言恒真 |
| 测试档拆分 | 原档 307 > 300 ⇒ 拆出 `config-io-panel-guard.test.mjs`（T-1…T-8 写面组），原档留 effort 键接线组 | 批档 §2.4 预案 + 同族拆分先例；新档夹具自持（零跨档 import），`test/files.mjs:30` 登记 |
| T-5 / T-6 / T-7 载荷 | T-5 `{advisor:{guard:true}}`（伪造）· T-6 `{advisor:{}, maxTurns:55}` · T-7 `{advisor:{}}` | 直测「通用保存面不可达该键」——缺 `advisor` 段即整段跳过，故各案带载体段以保门力（T-4 同法用 `maxTurns:77` 作对照组） |
| 协议档坐标收正 | 先跑 `--emit` 实读，再逐字入档（不手写行号） | 批档 §2.10 #1 择支 = 「表体随实现同步」；手写行号 = 伪造 |
| 门力实证（读旧体） | T-1/T-2/T-3/T-4/T-8 旧代码写 config ⇒ config 字节断言改前为红；T-5/T-6/T-7 旧 `merged.guard = … ?? false` ⇒ 载荷 true 直写 / 缺席物化 false ⇒ 改前为红 | `settings-panel-write.mjs` 旧体赋值行 + 旧镜像调用实读 |

**审计与代码评审轮次与终态**：

- **分歧审计轮 1**（内部 explore 只读装配 · 阻塞）：结论 **DEVIATIONS 3**——①（🟡）§5 实施记录为空 = 本条自身，已随本条闭合；②（🔵）`docs/vsc/design/SETTINGS.md:395-396` 后态格坐标漂移（「删 guard 赋值行（`:142`）」= `:142` 现为注释行；「种子循环（`:136-140`）」= 现读 `:134-139`；`:387`/`:396` 的「白名单删项（`:88`）」指向已删行）——**域外只报**：该档 = 设计档（eng-designer 笔权），本批任务书未授权本席收正（§2.10 #1 的收正动作只覆盖协议档）；③（🔵）A 处注释「替换」而非「字面删两行」+ B′ 处补 3 行注释 ⇒ 文件 Δ 与设计列不符——语义达成、无残留性陈述，逐项记入上表「差异说明」。四类中 **SILENT-SIMPLIFICATION 0 · OUT-OF-LIST 0**。审计侧未跑项（三包 / doc-check / `--emit`）= 其装配无 bash ⇒ 由本席上列实跑读数补足。

**域外只报（本批零触碰）**：① CLI `persistGuard` 同族双写（`thincoder-cli/…/cmd-advisor.mjs:30-43`）；② 措辞残余族（`docs/vsc/design/WEBVIEW-PROTOCOL.md:111` · `mode-buttons.js:3-4` · `settings.mjs:181` · `panel-session-write.mjs:92`）——均按 §2.8 留主 agent 笔权；③ 上列 `SETTINGS.md` 后态格坐标漂移（同上）。

**他批未提交改动声明（非本席改动）**：工作树另含 `thincoder-core/**` 多档、`thincoder-vscode/src/extension/session-io.mjs` / `session-slots.mjs`、`test/agent-tools-registry.test.mjs` / `zero-sync-exec.test.mjs` 等他批（SLOT-END-PARAM 等）改动与 `docs/batches/**` 他批档——本席零触碰，`npm test` 读数为含他批改动的合并态。

### 收尾轮追记（实施完成 → 审计 / 评审收敛）

**连带收正（超 §2.10 #1 字面项的同机制动作 · 已披露）**

- 对象：`docs/vsc/design/WEBVIEW-PROTOCOL.md` §12 表两行坐标——本批对 `panel-messages-settings.mjs` 的改写（删 2 处 config 镜像调用 + 注释改写，净 −1 行）使该档 `postMessage` 发射点行号前移，两行读数随之失准（收正前记 `proxyTestResult` `:207` · `shellCandidates` `:190`）。
- 动作：`proxyTestResult` ② 列 `:207 → :204`；`shellCandidates` ② 列同档坐标 `:190 → :187`；坐标口径 = `node test/protocol-coverage.test.mjs --emit` 实读；变更记录追 1 条（`WEBVIEW-PROTOCOL.md:500-501`）。**零新语义**（纯数值 · 表行数不变 = 53）。
- 依据：① 本批致因；② 该表口径「本表坐标 = 提取器唯一读值」；③ 内部评审 finding #2 建议重出该行；④ 同档变更记录中「表体随实现轮同步」的历轮先例。
- 边界说明：§2.10 #1 授权字面项 = §13 两行 + 变更记录 1 行；本条属同一机制下的同文件连带行，已在本追记与交付报告双披露。

**域外只报（本批零触碰 · 非本批致因）**

- §12 四行 ② 列的 `thincoder-vscode/src/extension/chat-panel.mjs:39x/:40x`：`agentSettings`（:371）· `proxySettings`（:397）· `shellCandidates`（:403 首两点）· `websearchSettings`（:421）
  —— 系他批把 settings 推送面迁出至 `src/extension/panel-settings-push.mjs` 的遗留；现读数 `:103/:96` · `:104/:93` · `:106/:95` · `:105/:94`。
- 与本批致因的区分：该两档（`chat-panel.mjs` / `panel-settings-push.mjs`）在本批工作树为零改动；本批只收 `shellCandidates` 行中由本批所致的那一格（`panel-messages-settings.mjs`），其余留待坐标 sweep。
- 已在 §12 变更记录同条登记（`WEBVIEW-PROTOCOL.md:501`，记录面），供表读者不被误导。
- 其余域外项未触碰：`SETTINGS.md` §2.14 机检面指针与 `:404` 坐标、`SETTINGS.md:395-396/387` 后态格坐标、CLI `persistGuard` 同族双写、§2.8 措辞残余族。

**评审与审计（轮次 · 终态）**

- 轮 1 · 内部 explore 分歧审计（read-only，对表设计原文件清单）：DEVIATIONS 3（1 条已闭合 = §5 当时为空；2 条 🔵 文档态）· SILENT-SIMPLIFICATION 0 · OUT-OF-LIST 0 ⇒ 无必须修复项。
- 轮 1 · advisor `type='code'`（同步；审查面 = 本批 6 改动档 + 新建测试档 + 协议档 + 批档）：**VERDICT pass**（0 🔴 / 1 🟡 / 2 🔵）。
  - ①🟡 = `SETTINGS.md` §2.14 机检面指针仍指拆档前旧档（T-1…T-8 已入新档 `test/config-io-panel-guard.test.mjs`），且 `:404` 坐标随本批 +3 行位移（`settings-agent.js:178-180` → `:181`）⇒ 属设计档笔权者收正范围，本席零触碰（域外只报）。
  - ②🔵 = §12 同档两行坐标未随位移收正 ⇒ **本轮已收正**（见上「连带收正」）。
  - ③🔵 = §5 文件读数「拆分后余 V-1 / V-2′ / V-3 / V-4 / V-6」漏 V-2（实体在 `test/config-io-panel.test.mjs:142`）⇒ 记录面读数欠一项；append-only，故不追改前文，待父侧 §6 追条或忽略。
- 轮 2 · advisor `type='code'`（复核修复声明）：PENDING。
- 终态：见轮 2 读数后判定。

**收尾机检读数（本追记时点 · 实跑）**

- `npm test`：`thincoder-vscode` 1006 / 1006 · 0 fail；`thincoder-cli` 863 / 863 · 0 fail；`thincoder-core` 691 / 691 · 0 fail（前读 679——他批在途新增用例，非本批改动）。
- `node test/protocol-coverage.test.mjs`（§12 对表机检）：4 pass / 0 fail（表行数不变 · 无未登记 / 无悬空）。
- `node scripts/doc-check.mjs`：悬空 4 · 行宽 18 = 基线零新增；18 条超宽行无一位于 `WEBVIEW-PROTOCOL.md` ⇒ 本追记所加两行合宽。

**追记 2（轮 2 复核后 · 一处欠项补正 + 实读确认）**

- 补正上条「域外只报」的一处欠项：`SETTINGS.md:404` 的两处坐标**同因本批位移**，上条只记了后者——
  ① `settings-agent.js:178-180`（`updateAgentSettings` = 推送合并点）现为 `:181-183`；
  ② `:147-148`（「推送不重建面板」注释）现为 `:146-147`（受本批删载荷行 −1 影响）。
  该档本批净 **+3** 行（`git diff` 实测：hunk `-119,7 +119,6` ⇒ −1；`-157,16 +156,20` ⇒ +4）。两处均属域外只报（设计档笔权者收正），本批零触碰。
- 实读确认（本席亲读，非采信）：`SETTINGS.md:406` 机检面指针确仍指拆档前旧档 —— T-1…T-8 实体在 `test/config-io-panel-guard.test.mjs:89-164`；`test/config-io-panel.test.mjs` 仅余 V-1 / V-2 / V-2′ / V-3 / V-4 / V-6。
- 轮 2 · advisor `type='code'`（复核修复声明）：**VERDICT pass**（0 🔴）。被指派修复项经本席独立实读复核为真：`WEBVIEW-PROTOCOL.md:398` = `panel-messages-settings.mjs:204`（该行即 `proxyTestResult` 发射 `postMessage`）；`:403` 同档坐标 = `:187`（该行 = 单行 `handleGetShellCandidates`，`.postMessage(` 落在 187）；变更记录 `:500-501` 在位，工具口径（`test/protocol-coverage.test.mjs` = §12 表机检）与域外登记读数（`panel-settings-push.mjs` `:96/:103` · `:93/:104` · `:95/:106` · `:94/:105`）逐条吻合。
- 终态：`clean`（0 🔴；余项 = SETTINGS.md 两处报告项 + §5 V-2 待父侧追条 + 域外登记）。

**追记 3（数值更正 + 行宽自校 · 终态前）**

- **更正（数值口径）**：追记 1 与协议档变更记录 `:500` 所述「本批净 −1 行」有误 —— `panel-messages-settings.mjs` 本批实测净 **−3** 行（`git diff`：hunk `-160,10 +160,9` ⇒ −1；hunk `-175,9 +174,7` ⇒ −2）。两行坐标**值**不受影响（来自 `--emit` 实读，且与 −3 自洽：`:207 → :204` · `:190 → :187`，两处修订点均在该两档位移点之前）。协议档 `:500` 已就地更正为「**−3** 行位移收正」；本条为记录面更正（§5 append-only，前文不追改）。§12 表行数 53 经逐行实读复核（`WEBVIEW-PROTOCOL.md:370-422`）。
- **自校连带**：上条更正一度使 `:500` 达 323 字符（超 300 行宽判据）——已收紧，`node scripts/doc-check.mjs` 复跑：**行宽 18 = 基线**，19 条降回 18 条且超宽行无一在 `WEBVIEW-PROTOCOL.md`。属既有触碰面内的自查修复，未新增触碰面。
- **悬空读数归因（非本批）**：同次 `doc-check` 读「悬空 4 → 8」；8 条 ID 全部落他人档 —— `docs/core/design/MODEL-SPECS.md:323`（符号·窄）· `:1372` · `:1465`（路径/坐标）；`docs/core/design/SESSION.md:850`；`docs/vsc/design/WEBVIEW.md:35 ×2` · `:76` · `:79`；`WEBVIEW-PROTOCOL.md` 与本批档**零条** ⇒ 系并发他批（MODEL-SPECS / WEBVIEW / SESSION 在途改动）所致；本席零触碰，只报（供父侧路由）。

## §6 验证与收口（父代理）

### 6.1 落地核验（父侧实读 · 2026-09-25 19:26）

| 面 | 核验 | 结果 |
|---|---|---|
| **A 停镜像**（`advisor.guard`） | 实读 `panel-messages-settings.mjs` | ✓ 镜像调用已删——`saveAgentSettingsFromPanel` 只剩 **import（`:25`）+ 通用保存（`:144`）**；`handleSetAdvisorGuard` 段（`:161-167`）零 config 写 |
| **B 停 engineering 直写** | 实读 `settings-panel-write.mjs` | ✓ `engineering` 直写行**零命中**；`merged.guard` 赋值已消（`:141` 注释明写「`guard` 非本面载荷字段——槽写路径负责」） |
| **B′ 关 guard 活旁路** | 实读 `webview/settings-agent.js` | ✓ 载荷无 `guard`；自动保存触发件收为 `["consult-turns","consult-timeout"]`（`:161`）；`#adv-guard` 改挂**专线** `post({type:"setAdvisorGuard"})`（`:164-167`） |
| **测试面 T-1–T-8** | 子代理落档 + 协议指针收正 | ✓ 落 `thincoder-vscode/test/config-io-panel-guard.test.mjs:89-164`（机检面指针已随之收正 · #33） |
| **协议档** | #33 / #34 两轮收正 | ✓ §13 两行 · §12（4+3）行 · `:111` 措辞残余 · as-of 行——均对现态可解析 |
| **三包测试** | 子代理实跑（父侧未复跑——「交付已内审」纪律） | vsc **1006** / cli **863** / core **691** · fail 0 |
| **机检** | **父侧实跑** | 悬空 **4** / 行宽 **18** · 本批三档零新增 |

### 6.2 核销同步清单（D7）

角色表 ✓（§1 父侧 · §2 eng-designer · §3 评审子代理 · §5 eng-coder · §6 父侧）· 状态行 ✓ · **计数 / 指针** ✓（#33 / #34 收正后两档对现态可解析）· 变更记录 ✓（两档各一条）· **待办勾销**：**#362 已废弃**（前置 · 被本批吸收）· **#379 已核销**（T-1–T-8 资产化）· **#380 已核销** · 新债入账 **#390**（同档两口径）· 台账可见面 ✓ · 前批遗留核对 ✓（前情 = 工程模式归属批 §6.3 域外第 5 条 → 本批承接 ✓）。

### 6.3 验收

批级判据 **①–④ 逐条成立**：① 面板两键同口径（engineering ∥ advisor.guard 均「槽唯一权威」）✓ · ② 被收口键无旁路 ✓ · ③ 行为读数 = 翻转 / 任意保存前后 `config.json` 对应键**逐字不变**（T-1–T-8 含 `null` ⇒ 键缺席）✓ · ④ 三包 + 机检 ✓。交付面 ①–⑥ 全落（§5）· 表外面（协议档坐标）已收正 ✓。

### 6.4 后续

本批闭环（无后续项）；跨批脆弱面 **#388**（裸锚 × basename 唯一性）与 **#390**（同档两口径）在册另办。
