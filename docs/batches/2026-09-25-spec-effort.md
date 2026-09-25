# 2026-09-25 · spec-effort
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-25 · 来源 = 用户 2026-09-25 12:57「这七批都派出去」——技术待办排批 · 批 2/7：规格·effort 轮（条目 #241/#326/#329/#330/#331）。
> 台账 = #241 / #326 / #329 / #330 / #331（技术待办 · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-25
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**本批条目**（任务书指针 = 本档 §2 · 条目细节以台账 evidence 为准）：

| # | 条目 | 要点 | 面 |
|---|---|---|---|
| #241 | 核 spec `noUsageStream` 复核（glm 族） | glm 族 8 行 `noUsageStream: true`；09-23 实测无实害（经核路径 usage 正常）——收窄与否待裁 | 核 |
| #326 | 六家预置 maxTokens 超限逐对处置 | 真行三对（grok 65536>64000 · mistral 32768>32000 · openrouter 32768>32000）= 降 preset 至 spec 行值；兜底三对（hunyuan/siliconflow/groq）= 先补规格行/覆盖再对齐 | 核 |
| #329 | advisor effort off 形与核载荷层 off 门不一致 | `thinking === null` 门对 advisor 径永不开——off 意图未达载荷层 | 核 |
| #330 | VSC model-picker 归一链 | `effortDefault || levels[0]` 与设计档 §14.4-3 声明不符 +「已存值 ∉ 枚举」无定义 | VSC |
| #331 | VSC `agent.advisor.effort` 死键 | 写而无人读——或确认、或接线 | VSC |

**边界**：模型规格表 / effort 载荷链 / VSC picker；不动预设语义以外面。preset ≤ spec 不变式与历史超限白名单锁（AC-7）按上批已实现口径沿用。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 覆盖条目（五条 · 台账 / 本档 §1 / 设计档 §15 三分同源）

| # | 条目 | 设计裁定（一句话） | 设计落点 |
|---|---|---|---|
| #241 | 核 spec `noUsageStream` 复核（glm 族） | **不收窄**（保留 14 行标）+ 字段语义收正为「保守抑制（非能力断言）」+ 逐族等级标 | `MODEL-SPECS.md` §15.2 · `PROVIDER.md` §6.9 |
| #326 | 六家预置 `maxTokens` 超限逐对处置 | 六对逐对对齐（真行三对降行值；兜底三对降生效基准 32_000）⇒ 超限集 **∅**；覆盖轴挂 #11 | `MODEL-SPECS.md` §15.3 · `PROVIDER.md` §6.11 |
| #329 | advisor off 形与核载荷层 off 门不一致 | advisor provider 解析**保形 off 形 + 显式 off 清继承档** ⇒ 载荷层门可开（谓词本体零改） | `MODEL-SPECS.md` §15.4 · `PROVIDER.md` §6.12 |
| #330 | VSC model-picker 归一链 | 归一链**单源规则** `effortSelection`（三支优先序 + 中性档）；「已存值 ∉ 枚举」显式定义 | `MODEL-SPECS.md` §15.4 · `WEBVIEW.md` D-W41 / U-W20 |
| #331 | VSC `agent.advisor.effort` 死键 | **接线**（非确认死键）：键改 `advisor.reasoningEffort` + off 形同 CLI + 旧键读回+删 | `MODEL-SPECS.md` §15.4 · `SETTINGS.md` §2.13 / U-S12 |

### 2.2 机制设计（逐条；判据面 = §15.6 AC 表）

**#241（复核裁定）**：表内带标 = **14 行**（glm 7 / minimax 4 / gemini 3，本设计轮实扫）；唯一消费点 = `thincoder-core/provider/core.mjs:183`（OpenAI 兼容体组装段）。
- gemini 3 行 `format:"google"` 走原生 transport ⇒ 该标对这三行**惰性**（如实登记，非缺陷）；minimax 4 行**未复测**（保守保留）。
- glm 7 行**双向有据**（09-23 直连探针带 `include_usage` 全 200 + 经核路径不发该参数 usage 仍正常）⇒ 抑制无实害 ⇒ 收窄**收益 ≈ 0**；风险 = 一次性动 14 行行为面（含**取证未覆盖**的 glm 编码宿主与 minimax 非标 `chatPath`）⇒ **不收窄**。
- 交付 = 字段语义收正（「核不主动发 `stream_options.include_usage`」= 保守抑制，非「服务端不支持 usage 流」的能力断言）+ 逐族等级 + 复评条件（须同时覆盖三宿主面）。

**#326（六对对齐）**：不变式沿用（基准 = **生效规格值**，含 `DEFAULT_SPEC` 32_000 兜底）。
- 真行三对：`grok` 65 536 → **64_000**（`grok-4.5` 行值）· `mistral` 32 768 → **32_000**（`mistral-large`）· `openrouter` 32 768 → **32_000**（命名空间剥离命中 `claude-sonnet-4`）。
- 兜底三对：`hunyuan` / `siliconflow` / `groq` 32 768 → **32_000**（对齐至生效基准；32768 vs 32000 = 既有「K×1024 ⇄ 十进制」口径差族，同 `deepseek` 384_000 先例）。
- **两轴分开处置（偏离台账「先补覆盖再对齐」的写法，理由在此）**：**对齐轴** = 本批交付（安全方向，只降不升）；**覆盖轴** = 三名的**真实输出上限**未取证 ⇒ 本批**不建行**（不据同族类推、不冒充实测——D-11 / KD-36 三态），挂 #11 覆盖巡检族，取证路径 = 三名各自渠道的校验级读数或官方口径，到位后补**尺寸行**并按行值复对齐。**如实登记**：对齐到「占位基准」不等于该三名真实上限被证明；覆盖缺口由 `NO_SPEC_ROW` 名单（不动）持续可见。
- `OVER_LIMIT` 白名单 **六家 → 空名单**（绊网保留：任一预置再超限即红）。

**#329（off 意图达载荷层）**：载荷层 off 门谓词**单源 = `PROVIDER.md` §6.12**（`thinking === null` ∧ `thinkApi === "effort"` ∧ 枚举含 `none` ∧ 无显式档 ∧ 非路由名），本批**零改**；补的是它的**解析链前置条件**——`thincoder-core/advisor/run.mjs` 的 `resolveAdvisorProvider` 两分支（自定义渠道 / 主 provider 兜底）：
① `cfg.thinking === null` **保形**（现行把 null 归一为 `undefined` ⇒ 门永不开）；② 显式 off 时**清继承档**（渠道条目 / 主 provider 的 `reasoningEffort` 不得随行）。`cfg.thinking === false`（非法原值）仍归一为 `undefined`（零变）。
- 效果：effort 族 advisor（hy3 / doubao / qwen 族）关思考 = 真关（体携 `reasoning_effort:"none"`，D-14 实测唯一有效 off 路径）；无 off 路径族（枚举不含 `none`）guard ④ 零变（不发该字段、不抛错）。

**#330（归一链）**：规则单源 = `thincoder-vscode/webview/settings-state.js` 的 `effortSelection(levels, current, registeredDefault)` → ① 已存值 ∈ 枚举 → 取之；② 否则注册默认（**须 ∈ 枚举**）→ 取之；③ 否则 → **中性档 `null`**（不写 effort 载荷）。
- **「已存值 ∉ 枚举」定义** = 按枚举**显式判成员**（不再由浏览器「无匹配 option ⇒ value 落空」的代发行为承载结果）；面板渲染落「—」（载荷 = 删键，零改），聊天面板 picker 落**中性档**（按钮「—」、列表无 ✓、`ctx.selectedReasoning = ""` ⇒ 回合侧 `if (reasoning)` 假值不 patch）。
- 收口点：picker 两处（`model-picker.js:85` / `:123`）不再有「无注册默认 ⇒ 落 `levels[0]`」——`levels[0] === "none"` 族（hy3 / doubao 六名）两径都不再被静默关思考；既有负控判据（T-17 ②）随之改判（属**有意语义变更**，已入影响文件表）。

**#331（死键接线）**：面板写入键 `advisor.effort` → **`advisor.reasoningEffort`**（单源 = 核读取键 `thincoder-core/advisor/run.mjs:41/:54`，与 CLI `/advisor` 菜单同键）；
三态语义 = 档位值写键 / `none` = 关思考（写 `thinking` off 形 + 删 effort 键，与 CLI `applyThinkOff` 同式）/「—」= 不设档（删键、不动 thinking）；
旧 `effort` 键读回兜底显示 + 保存时删（死键不复活）；advisor effort select **未渲染时载荷不发该字段**（缺席 ≠ 清空）——此半消解需求档 P2-4 的 advisor-effort 面。

### 2.3 影响文件清单（as-of 2026-09-25 设计轮实测行数 · `wc -l` 口径 · 详见 `MODEL-SPECS.md` §15.5）

核：`thincoder-core/config-presets.mjs`（**49** · 六处值改）· `test/config-presets.test.mjs`（**78** · +~20 −3）· `advisor/run.mjs`（**191** · +~8 −4）· `provider/core.mjs`（**492** · ±0，行注改述）· 新增/扩 advisor 用例档（+~25）。
VSC：`webview/settings-state.js`（**66** · +~12 −2）· `webview/model-picker.js`（**149** · +~6 −4）· `webview/settings-agent.js`（**176** · +~3 −2）·
`src/extension/settings-panel-write.mjs`（**170** · +~12 −5）· `src/extension/settings.mjs`（快照面 `:204` · ±0~+2）·
`test/model-picker-fallback.test.mjs`（**221** · +~10 −6）· `test/effort-select-views.test.mjs`（**107** · +~15）· advisor effort 用例档（载体实施轮定 · +~20）。
设计档（设计轮已落）：`docs/core/design/MODEL-SPECS.md` §15（新）· `PROVIDER.md` §6.9/§6.11/§6.12 · `docs/vsc/design/SETTINGS.md` §2.13 + U-S12 · `docs/vsc/design/WEBVIEW.md` §6 D-W41 + §8 U-W20。

### 2.4 验收标准回指（AC-1..AC-7 · 判据与 `MODEL-SPECS.md` §15.6 同源）

| AC | 条目 | 机检判据（摘要） |
|---|---|---|
| AC-1 | #241 | `noUsageStream` 标集 = 十四名逐行在场（glm 7 / minimax 4 / gemini 3）；`provider/core.mjs:183` 单消费点在位 |
| AC-2 | #241 | 语义收正句 + 逐族等级（文档面 = 评审/父侧核；**不设测试锚**——散文锚禁） |
| AC-3 | #326 | 六对逐对 `maxTokens ≤ specForModel(model).maxOutput` 全绿；真行三对另断 = 行值（64_000 / 32_000 / 32_000） |
| AC-4 | #326 | C-8 超限集 = **∅**（空名单绊网）；`NO_SPEC_ROW` 三名不动 |
| AC-5 | #329 | `resolveAdvisorProvider` off 形两分支（保形 + 清档）+ 载荷面体携 `reasoning_effort:"none"`；显式档照发 |
| AC-6 | #330 | `effortSelection` 三分支直驱（含负控：无注册默认 ⇒ `null`，**不得**落 `levels[0]`）；picker 两径同判据；面板「已存值 ∉ 枚举」⇒ selected「—」 |
| AC-7 | #331 | 保存后 `advisor.reasoningEffort` 在盘 ∧ 旧 `effort` 键不在盘；`none` ⇒ `advisor.thinking` = off 形 ∧ 无 effort 键；select 未渲染 ⇒ 载荷无该键（手写键存活） |

用例表（正常/边界/错误 · 12 条 N-1 / P-5..P-7 / A-13..A-16 / E-6..E-10 / V-1..V-3）逐条见 `MODEL-SPECS.md` §15.7。

### 2.5 关键决策（含被否）

1. **#241 不收窄**（被否：「按 09-23 直连读数收窄 glm 族」——收益 ≈ 0 而风险非对称；被否理由入 §15.2）。
2. **#326 兜底三对不建行、降生效基准**（被否：「据同族类推填尺寸位」= KD-36 被否①；被否：「按 32K 直觉保留 32 768」= 不变式违例）。
3. **#329 只补解析链前置、谓词零改**（被否：「在 advisor 层自行补发 `reasoning_effort`」——同语义两真源违 D2）。
4. **#330 中性档不新增列表项**（被否：「picker 加「—」项」——列表 = 模型能力档；被否：「保留 `levels[0]` 回落」——静默关思考）。
5. **#331 接线而非确认死键**（被否：「删面板控件」——核侧消费方已在，删控件 = 能力缺失）；旧键**不迁移值、只读回兜底**（被否：「把 `effort` 值搬进 `reasoningEffort`」——静默激活历史死值）。

### 2.6 边界（本批不做）

不收窄 `noUsageStream` · 不为兜底三名建行（挂 #11）· 不改载荷层 off 谓词本体 / `resolveEnableThinking` / `tempRange` 裁剪 / 枚举越界抛错门 · 不给 picker 中性档加列表项 · 不改 CLI 三菜单形态 · 无 off 路径族的回执措辞不动（见 §2.7 上抛 3）· 需求档零改（主 agent 笔）。

### 2.7 上抛与实施前置核对（只报不改）

1. **台账 #241 计数偏差**：条目写「glm 族 8 行」，实扫 = **7 行**（全表带标 14 行 = glm 7 / minimax 4 / gemini 3）——台账 = 主 agent 写面，请收正（本批按实扫 14 行设计）。
2. **需求档收正需求（主 agent 笔）**：`docs/vsc/requirements/WEBVIEW.md:80` P2-4（「元素缺席 ≡ 显式清空」）的 **advisor-effort 半**已由本批消解（select 未渲染 ⇒ 不发字段）；P2-4 余项（advisor `provider` / `model` 等字段）仍在册。
3. **无 off 路径族的回执面**（本批射程外）：effort 型枚举不含 `none` 者（如 `kimi-k3`）与服务端强制思考族（如 `glm-5.3-flashx`，`disabled` 400）**仍无有效 off 路径**，而 CLI `/advisor`、`/think` 仍回执「Thinking: OFF」——建议另册（回执条件化或档位隐藏），本批不动。
4. **VSC 端 off 形族差**（本批射程外）：`thincoder-vscode/src/extension/reasoning-mode.mjs:22-24` 对**所有**族落 `thinking:null`，而 CLI `applyThinkOff` 对标准族落 `{type:"disabled"}` —— 同语义两端两式（type 族在 VSC 侧 off = 不发字段 = 服务端默认仍想）；建议另批归一。
5. **兜底三名的取证无本机通道**：本机 config 13 条渠道实读**无** hunyuan / siliconflow / groq ⇒ 覆盖轴证据只能由父侧交付（或明确不做）；交付形态建议沿用五名先例（读数直投设计轮）。
6. **doc-check 既存 FAIL（非本批引入）**：悬空 **7** 条（`MODEL-SPECS.md:323` `cacheMode` · `:1372` / `:1465` `provider/core.mjs` · `SESSION.md:789` ·
   `TOOLS.md:1032` / `:1038` · `MULTI-INSTANCE-COLLAB.md:169`）+ 行宽 **17** 行（`MODEL-BENCH.md` / `MODEL-SPECS.md:409/1356/1372/1374/1644/1646` 等）；
   **本批新增 = 0**（设计轮首跑曾引入 1 悬空 + 5 行宽，落笔即收正；本档 §2 自身 4 行超宽亦已折行）。

**实施前置核对**（核实后再落，细文 = `MODEL-SPECS.md` §15.5 尾注）：① `webview/send.js:55/:83` 的 `reasoning` 无真值强转（中性档 `""` 须保持假值语义——设计轮实读为原生透传）；② 面板 advisor off 形映射所需 `specForModel` 在扩展侧的取用口径（off 形规则 = `thinkEnabledValue ?? "enabled"` ≠ `"enabled"` ⇒ `null`，否则 `{type:"disabled"}`，与 CLI `applyThinkOff` 同式）。

### 2.8 UI / 交互决策（全落地，无 `open`）

聊天面板推理按钮中性档渲染「—」且无 active 态（不新增列表项）· 设置面板 advisor / consult 两 select 渲染形不变（「—」恒首项、不预选枚举首项）· 面板 advisor effort 三态（档位 / `none`=关思考 / `—`=不设档）· CLI 面零 UI 变化。

### 2.9 设计评审轮 1 修正（fix 轮 · 七条逐条落位 · 2026-09-25）

**承接** = 本档 §3 轮次 1（changes-required · 🔴2 / 🟡3 / 🔵2）——父侧逐条裁定全部接受；本轮只动七条点名处所（设计 / 判据 / 注记面），不重开设计、不写实现码。

| # | 落点（设计档 · as-of 修正轮） | 处置 |
|---|---|---|
| 1 🔴 | `MODEL-SPECS.md` §15.4-2（新块）+ §15.5 新增 CLI 两行 + `SETTINGS.md:375` 行 | 择路 ⑴：off 形**按族统一**——effort 族（`thinkApi === "effort"`）= `thinking:null` + 删 `reasoningEffort` 键（对齐 `thincoder-cli/src/tui/cmd-think.mjs:124-134` isEffortOnly 先例）；两生产者同步（CLI `/advisor` `applyThinkOff` + VSC 面板写面）；AC-7 / V-2 期望值改**族别字面量**（`hy3` 形 ⇒ `thinking === null`；`deepseek-v4-flash` 形 ⇒ `{type:"disabled"}`） |
| 2 🔴 | §2.5 行（:175）· §2.8-3 · A-17 · T-17② · §7（两处）· §8 行 | 六处**就地收正**为 §15.4 单源口径；T-17② 负控改判「中性档、**不得**落 `levels[0]`」⇒ 与 E-8 的互斥解除；`WEBVIEW.md:469` D-W41 核后已为新口径（冻结窗内零触碰） |
| 3 🟡 | §15.5 全表 + 表后拆分复核注 | 行数按 `wc -l` 复锚（权威锚 = `core-hygiene.test.mjs:98`；read 面 = 表值 +1）+ 点名载体：`config-io-panel.test.mjs`（116 · #331 写面）/ `advisor-provider-resolve.test.mjs`（拟新增 ~60 · #329）/ `cmd-advisor.test.mjs`（81）；两越线档结论：`thincoder-core/provider/core.mjs` 491 已登记（`SOFT_LINE_REGISTRY` · `core-hygiene.test.mjs:96`）+ 计划 = `CORE-UNIFICATION.md` §2.8.1 次优先；`settings.mjs` **409**「不拆 + 计划」→ 新登记 `SETTINGS.md` §3 |
| 4 🟡 | §15.4-5（新块）· AC-7 · V-4（新）· `SETTINGS.md` §2.13「—」行 | 裁定 **null 须穿透种子循环**（carve-out 只 `advisor.thinking` 一键）+「连续两次保存后 off 形仍在盘」用例 V-4；§2.13 措辞随实况收正 |
| 5 🟡 | §15.4-4（新块）· AC-8（新）· V-5（新）· §15.5 `settings.mjs` 行 | 读面定形：off 形 ⇒ `none` > `reasoningEffort` > legacy `effort` > 「—」（`advisorEffortCurrent`）；旧键读回兜底 + 保存即删；`settings.mjs` 增量钉 = **±0**（快照 spread 透传已载新旧两键与 `thinking`） |
| 6 🔵 | §15.7 用例号 + `PROVIDER.md` §6.12 指针 | `A-13..A-16` → **`AD-1..AD-4`**（避 §5 判据号 `A-` 空间同号） |
| 7 🔵 | §15.4 三面映射表 + picker 渲染注 | 点名两渲染点 `model-picker.js:86-88` / `:124-125`（含 `active` 判据对 `""` 误真 ⇒ 中性档须判否）+ 半实现防线 |

**受影响面变动（承 §2.3）**：新增 3 行 = `thincoder-cli/src/tui/cmd-advisor.mjs`（**270** · +~3 −1）· `thincoder-cli/test/cmd-advisor.test.mjs`（**81** · +~10）· `thincoder-core/test/advisor-provider-resolve.test.mjs`（拟新增 · ~60）；替换 2 行 = `settings-*` glob → `config-io-panel.test.mjs`（116 · +~20）、`advisor-*` glob → 上述新档；全表行数口径统一 `wc -l`（−1 系 read 面差，非漂移）。

**编号与计数收正**：§2.4 尾句「12 条」与其自身列项不符（实列 16 = N-1 + P-5..P-7 + A-13..A-16 + E-6..E-10 + V-1..V-3）；修正轮后用例 = **18 条**（`AD-1..AD-4` 改名 + V-4 / V-5 入表）。§2.4 / §2.2 旧文中的 `A-13..A-16` = 本轮 `AD-1..AD-4`（同物改名；§2 段 append-only 不回改）。

**机检读数（2026-09-25 修正轮实跑）**：`node scripts/doc-check.mjs` ⇒ 悬空 **14** · 行宽 **19**——逐条核**无一条落于本轮改动处**（本批面零净增；首跑曾引入 4 行宽 + 1 悬空，落笔即收正）。AC-7 / V-2 期望值已为族别字面量（机判面 = §15.6 / §15.7）。

### 2.10 设计评审轮 2（pass）修正（fix 轮 · 三条逐条落位 · 2026-09-25）

**承接** = 本档 §3 轮次 2（pass · 🔴0 / 新 🟡1 / 🔵3）——父侧裁定：新行 8 / 9 / 11 接受并收正（行 10 = 并行批次归因，父侧收口时核，不在本轮）。本轮只动三条点名处所（+ 本轮自身变更记录一条），不重开设计、不写实现码。

| # | 落点（as-of 本轮落笔后） | 处置 |
|---|---|---|
| 8 🟡 | `MODEL-SPECS.md:1569`（§15.4-2「选档 / 「—」两态」句）+ `:1650`（§15.7 新用例 V-6） | 句收正：档位态 = **写 `reasoningEffort`（字面档值）** + 清 `null` 标记；**删键只适用 off（`none`）与「—」两态**（原「两态均删 `reasoningEffort` 键」字面退场——与 `SETTINGS.md` §2.13 档位值行 / V-1 / `cmd-think.mjs:119-120` 先例同口径）；V-6 = 盘上 `thinking:null` + 选 `low` ⇒ 标记清除 ∧ `reasoningEffort = "low"`（两族别 = effort 族 / type 族默认）——用例计数 18 → **19 条** |
| 9 🔵 | `MODEL-SPECS.md:268`（§2.8 兜底链面）+ `:283`（§3 表 `model-picker.js` 行） | 两处旧形派生句补指针：「两取值式随 §15.4 收正（`effortDefault || levels[0]` 形为被否形）」/「该取值式随 §15.4 收正（`effortDefault` 优先为被否形）」 |
| 11 🔵 | `MODEL-SPECS.md:1587`（§15.5 表头） | 权威锚**先实读复核再收正**：`:98` = 注册表列表行（`SOFT_LINE_REGISTRY` 表体，本轮实读）⇒ 改指 **`:165`**（`split("\n").length - 1 // wc -l semantics` = 口径实现行，本轮实读） |

**本轮附加一笔（护计数一致）**：`MODEL-SPECS.md:1675-1679` 变更记录补一条（`2026-09-25 · 设计评审轮 2（pass）修正`）——因轮 1 条载「用例计数 = 18 条」，V-6 入表后若不补记，本档最新计数句与表矛盾（D3 计数与清单同变）；循档内历轮体例（每 fix 轮一条）落笔，**零新语义**。

**机检读数（2026-09-25 轮 2 修正后实跑 · `node scripts/doc-check.mjs`）**：悬空 **14** · 行宽 **19**——与本轮前基线同数（本档面 = 悬空 3 在闸 + 拟新增 2 列报 · 行宽 6，逐条同在改前集合）；**本档零净增**（新增行均 < 300 字符；`:283` = 表格行 291 字符——表格行结构性豁免，且已压回 300 内）。

**未做 / 越界自述**：行 10（doc-check 读数归因）不在本轮射程（父侧收口时核）；未触 §15.4-2 其余句 / 本档其余节 / 他档 / 批档 §1·§3–§6 / 需求档 / 实现码。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**设计评审（批 `2026-09-25-spec-effort` · 评审对象 = §2 设计 + MODEL-SPECS §15 / PROVIDER §6.9·6.11·6.12 / SETTINGS §2.13 / WEBVIEW D-W41·U-W20）**

口径声明：无文档地图、无独立项目标准档（评审上下文未提供）⇒ 文档归属维度按在评文档自身的 D2（单源/不重述）与档内既有「就地收正」体例判定；影响文件表按 code-structure 判据（>300 软线 / >500 硬限）+ `wc -l` 抽查。

抽查已核（正面）：`noUsageStream` 14 行 = glm 7 / minimax 4 / gemini 3（`thincoder-core/model-specs.mjs:66-81/146-176/196-198`）、唯一消费点 `thincoder-core/provider/core.mjs:183`；六对预置值（`thincoder-core/config-presets.mjs:30/31/33/37/38/39`）与行值（`grok-4.5` 64_000 · `mistral-large` 32_000 · `claude-sonnet-4` 32_000）；`OVER_LIMIT` 六名 = `thincoder-core/test/config-presets.test.mjs:56`；off 补发谓词 5 款在场（`provider/core.mjs:213-219`）；`resolveAdvisorProvider` 现行抹形（`advisor/run.mjs:39-40` / `:52-53`）；picker 两处归一原位（`webview/model-picker.js:85` / `:123`）；行数抽查 `config-presets.mjs` 49 / `advisor/run.mjs` 191 / `settings-state.js` 66 / `model-picker.js` 149 / `provider/core.mjs` 492 / `settings-panel-write.mjs` 170 / `settings-agent.js` 176 / `config-presets.test.mjs` 78 全中。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements | 🔴 | 「off 形」两处定义互斥 ⇒ #329 声明的效果在 #331 的写入规则下不可达：`docs/vsc/design/SETTINGS.md:375`（批档 §2.2:57 同式）钉「`thinkEnabledValue ?? "enabled"` ≠ `"enabled"` ⇒ `null`，否则 `{type:"disabled"}`」，而 `thinkEnabledValue` 全表仅 MiniMax 两行在册（`thincoder-core/model-specs.mjs:146` / `:171` 实读）⇒ effort 族（hy3 / doubao / qwen）关思考落 `{type:"disabled"}`；载荷层 off 门首款要求 `provider.thinking === null`（`thincoder-core/provider/core.mjs:213-219` 实读；单源 `docs/core/design/PROVIDER.md:199-200`）⇒ 门仍不开，`docs/batches/2026-09-25-spec-effort.md:50` 的「effort 族 advisor 关思考 = 真关（体携 `reasoning_effort:"none"`）」与 AC-5（`MODEL-SPECS.md:1593`）只可由直接注入 `thinking:null` 的测试满足——两 UI 均无该形生产者（CLI 同式 `thincoder-cli/src/tui/cmd-advisor.mjs:59-64` 实读；落 `null` 的是 `thincoder-cli/src/tui/cmd-think.mjs:124-134` 的 isEffortOnly 分支） | 把「off 形」按族统一定义到能开载荷门的形（effort 族须落 `thinking:null` + 删 effort 键，对齐 `cmd-think.mjs:127` 的 isEffortOnly 分支），或反向收窄 #329 效果句与 AC-5 到实际可达生产者面；并把 AC-7 / V-2 的期望值按族钉成字面量（现「off 形」二义，不可机判） |
| 2 | Document ownership | 🔴 | §15.4 改判 picker 归一（`docs/core/design/MODEL-SPECS.md:1553`：负控改判为中性档、不得落 `levels[0]`），同档既有规范面未同笔收正、仍载被推翻取值：§2.8-3（`:262-267`「`effortDefault` 优先」）· §2.5 表（`:175`）· A-17（`:345`「未声明才回落」）· T-17②（`:378`「回落 `levels[0]`（既有行为零回归）」）· §8 行（`:421`）· §7（`:397` / `:409`）——同机制两式并存；`docs/vsc/design/WEBVIEW.md:469` D-W41 还把该活形（`effortDefault \|\| levels[0]`）列为「被否」替代；仅 `:1364`（§14.4-3）带前向指针 | 文档面就地收正（或逐行加前向指针）：§2.8-3 / §2.5 行 / A-17 / T-17② / §8 行 / §7 条与 §15.4 同口径；T-17② 与 E-8（`:1611`「**不得**落 `levels[0]`」）互斥不得并存 |
| 3 | Affected-file size annotations | 🟡 | §15.5（`:1562-1579`）三行缺现行行数 / 未定文件：`thincoder-vscode/src/extension/settings.mjs`（现「—」，实测 **410** 行 ⇒ 越 300 软线）· `thincoder-vscode/test/settings-*`（advisor effort 面）· `thincoder-core/test/advisor-*.test.mjs`（新增/扩）——后两行以 glob 指代、载体「实施轮定」（现存候选各 6 档：`test/advisor-{cancel-faces,consult-merge,convergence,history,pool-queue,truncate}.test.mjs` / `test/settings-{empty-no-write,mcp-delete-confirm,open-snapshots,refill,secret-delete-confirm,tool}.test.mjs`）；两越线档（`provider/core.mjs` **492** · `settings.mjs` **410**）行内无拆分复核 / 计划指针 | 逐行补现行行数 + 预期增删并点名载体档；对 >300 档补拆分复核结论（`provider/core.mjs` 可指 `SOFT_LINE_REGISTRY`（已登记，`thincoder-core/test/core-hygiene.test.mjs:96`）与拆分计划落点 `CORE-UNIFICATION.md` §2.8.1；`settings.mjs` 410 行需给结论，勿以「—」留空） |
| 4 | Clarity | 🟡 | off 形的**跨保存存活**未入设计与判据：面板写入的 `advisor.thinking` 若取 `null` 支（§2.13「自定义开值族」；按 #329 统一后更普遍）会被写面种子循环丢弃——`thincoder-vscode/src/extension/settings-panel-write.mjs:121-125`（`if (v === null \|\| Array.isArray(v)) continue`）实读；而面板每次保存恒携 `advisor` 载荷（`thincoder-vscode/webview/settings-agent.js:118-127` 实读，`payload.advisor !== undefined` 即入 `:106` 合并面）⇒ 下一次任意面板保存即静默删除该 off 形；§2.13 行「『—』…**不动** `advisor.thinking`」对 null 形不成立，AC-7 / V-2 只覆盖首次保存 | 写明 off 形跨保存的存活语义（`null` 是否须穿透种子循环、或改用非 null 形），并补一条「连续两次保存后 off 形仍在盘」的用例；§2.13 该行措辞随实况收正 |
| 5 | Clarity | 🟡 | 读面载体未定形、无判据：#331 的旧键读回（`docs/vsc/design/SETTINGS.md:377`「`reasoningEffort` 缺席时按 `effort` 日值显示；保存时删旧键」）与快照面（§15.5 `:1574`「`effort` 读回兜底**若**落快照面则一并」）均无 AC / 用例（V-1..V-3 只断盘面键位）；`thincoder-vscode/src/extension/settings.mjs:204` 现为 `advisor: { ...(s.advisor ?? {}), guard: … }` 透传（新键自动随行，旧键亦随行） | 定形读面（快照键与新 / 旧键的显示优先级）并把 AC-7 拆出一条读面判据 + 用例 id；`settings.mjs` 行据此给确定增量（现「±0~+2」含条件句，不可实施） |
| 6 | Clarity | 🔵 | 用例号与既有判据号撞号：§15.7 以 `A-13..A-16` 作**用例**号（`:1605-1608`），而同档 §5 的 `A-13..A-18` 是**判据**号（`:341-346`）——同档同号异义（本档用例号先例 = T-/C-/E-/G-/Q-/F- 前缀） | 用例号改前缀（避与 §5 判据号同空间），或加「§15 内 A- 号一律指用例」的显式限定句 |
| 7 | Clarity | 🔵 | 中性档渲染点未点名：现式 `const visible = levels.length > 0 ? ctx.selectedReasoning : "off"` + `visible === "none" ? "off" : reasoningLabel(visible)`（`thincoder-vscode/webview/model-picker.js:86-88` 实读）对 `selectedReasoning = ""` 落 `reasoningLabel("")` = `t("reasoning.none")`（同档 `:105-107`）——即中性档默认显示「none 档文案」而非设计要求的「—」，设计只写「按钮文案面」未点名该式 | 在 §15.4 三面映射表点名该式（含 `ctx.reasoningBtn.classList.toggle("active", …)` 的 `visible !== "off"` 判据），避免半实现（按钮仍显 none 文案） |

计数：🔴 2 · 🟡 3 · 🔵 2（共 7 条）。VERDICT: changes-required。

### 轮次 2（评审子代理）

**设计评审 · 轮次 2（修正验证 · 批 `2026-09-25-spec-effort` · 对象 = 修正轮落位 + 明显新问题；不扩面）**

口径声明：无文档地图 / 无独立项目标准档 ⇒ 归属维度按在评文档自身 D2 与档内「就地收正」体例判；行数按 `wc -l` 口径抽查（read 面 = 表值 +1）；本机无 shell ⇒ wc 读数只能经 read 面换算（已换算的可复核，未换算的记 unverified）。

抽查已核（正面）：`config-presets.mjs` read 面 50 ⇒ 表值 49 ✓；`settings-state.js` 66 ⇒ 65 ✓；`advisor/run.mjs` 191 ⇒ 190 ✓；`SOFT_LINE_REGISTRY` `core-hygiene.test.mjs:96` 含 `provider/core.mjs` ✓；口径实现 = 同档 `:165`（`split("\n").length - 1`）；`WEBVIEW.md:520` U-W20 在位 ✓；`cmd-think.mjs:116-121`（选档 = 置档 + 只清 `null` 标记）与 `:127`（isEffortOnly off = `null` + 删档）与修正轮引证一致 ✓。

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | `MODEL-SPECS.md` §15.4-2 · `PROVIDER.md` §6.12 · `SETTINGS.md` §2.13 · 批档 §2.9 | 🔴 | ✅ 已修 | off 形成族别单源 + 两生产者同步 ⇒ #329 效果可达：`:1558`「**§15.4-2 · off 形（按族统一 · 本档单源）**」· `:1562` effort 族行「`thinking = null` **+ 删 `reasoningEffort` 键**」· `:1566-1568` 两生产者（CLI `applyThinkOff` / VSC 面板写面）· `:1623` AC-5「**生产者面**…CLI `/advisor` 与 VSC 面板写面同式」· `:1646` V-2「族别字面量：effort 族（`hy3` 形）⇒ 盘上 `advisor.thinking === null` ∧ 无 `reasoningEffort` 键」· `SETTINGS.md:375`「**off 形按族取形**（规则单源 = §15.4-2）」· `PROVIDER.md:210`「**生产者面**…单源 = §15.4-2」。CLI 侧纳入面另核：`:1594`/`:1595` 两行（`cmd-advisor.mjs` 270 / `cmd-advisor.test.mjs` 81）。 |
| 2 | 2 | `MODEL-SPECS.md` §2.5 / §2.8-3 / A-17 / T-17② / §7 / §8 · `WEBVIEW.md` D-W41 | 🔴 | ✅ 已修（六处全清） | `:175`「取值式随 §15.4 单源规则收正…`effortDefault \|\| levels[0]` 为被否形」· `:263`「取值式现 = §15.4 单源规则」· `:345`「无注册默认 ⇒ 中性档——**不得**回落 `levels[0]`，判据单源 = §15.4」· `:378`「② **中性档**（不落 `levels[0]`——与 §15.7 E-8 同判据，§15.4 改判）」· `:397`「取值式随 §15.4 收正——无注册默认 ⇒ 中性档「—」」· `:409`「**该两处取值式随 §15.4 收正**（无注册默认 ⇒ 中性档，`levels[0]` 回落退场）」· `:421`「切/开模型归一 = §15.4 单源规则（注册默认优先 > 中性档「—」；`levels[0]` 回落退场）」。T-17② 与 E-8（`:1642`）互斥解除 ✓；D-W41 未改且指 §15.4 单源 ✓；残留仅派生句 / 历史行（见 9）。 |
| 3 | 3 | `MODEL-SPECS.md` §15.5 · `SETTINGS.md` §3 | 🟡 | ✅ 已修 | 三行缺口已点名：`:1601` `settings.mjs` **409**「快照面 `:204`（spread 透传）…**>300 拆分复核 = 本批不拆**」· `:1604` `config-io-panel.test.mjs` **116** · `:1605` `advisor-provider-resolve.test.mjs`（拟新增 ~60）；两越线档结论 + 计划：`:1596` core.mjs **491**「**>300 拆分复核：已登记在位**（`SOFT_LINE_REGISTRY`）+ 计划落点 = `CORE-UNIFICATION.md` §2.8.1…距 500 硬限余量 9 行」· `:1608` 组边界 / `SETTINGS.md:420`「该档现 **409 行**（`wc -l` 口径；read 面 410）——**复核结论 = 本批不拆**」+ `:422`「触发阈值 **450 行**」。 |
| 4 | 4 | `MODEL-SPECS.md` §15.4-5 · AC-7 · V-4 · `SETTINGS.md` §2.13 | 🟡 | ✅ 已修 | `:1580`「**§15.4-5 · off 形跨保存存活**…种子循环…丢 null 值键」· `:1582`「**裁定：`advisor.thinking` 的 `null` 须穿透种子循环**…carve-out 只此一键」· V-4（`:1648`「每次保存后 off 形仍在盘（种子循环穿透）」）+ AC-7（`:1625`「**连续两次保存后 off 形仍在盘**」）+ `SETTINGS.md:376` 指针 + §15.5 写面行（`:1600`）。 |
| 5 | 5 | `MODEL-SPECS.md` §15.4-4 · AC-8 · V-5 · `SETTINGS.md` §2.13 · §15.5 | 🟡 | ✅ 已修 | `:1576`「**§15.4-4 · 读面（面板预选取值）**：`advisorEffortCurrent(adv)`…`thinking` 为 off 形 ⇒ 字面 `"none"`（**优先于**档位键）…再缺席 ⇒ legacy `advisor.effort`」· `:1578` 快照 spread 透传 · AC-8（`:1626`）/ V-5（`:1649`）· `SETTINGS.md:379` 读面行 · `settings.mjs` 增量钉 **±0**（`:1601`）✓。 |
| 6 | 6 | `MODEL-SPECS.md` §15.7 · `PROVIDER.md` §6.12 | 🔵 | ✅ 已修 | `:1636-1639` 号改 `AD-1..AD-4`；`:1651`「**用例号注**：本表 `AD-` 前缀…避与 §5 判据号 `A-` 空间同号；`PROVIDER.md` §6.12 指针已同步」；`PROVIDER.md:208`「用例 = `…§15.7` AD-1..AD-4」✓；`E-6..E-10` 与 §14.8 `E-1..E-5` 连续无撞号 ✓。 |
| 7 | 7 | `MODEL-SPECS.md` §15.4 渲染注 · §15.5 · E-9 | 🔵 | ✅ 已修 | `:1550`「**渲染点两处同判据**（见下注）」· `:1553-1554`「渲染点 = `model-picker.js:86-88`…与 `:124-125`…对 `""` 落 `reasoningLabel("")` = `t("reasoning.none")`…⇒ 中性档须补「—」支；`active` 判据…对 `""` 误真 ⇒ 中性档须判否（防半实现）」· §15.5（`:1598`）+ E-9（`:1643`）同步 ✓。 |
| 8 | (new) | `MODEL-SPECS.md:1569` | 🟡 | New（修正轮引入） | 句尾「两态均删 `reasoningEffort` 键」字面 = 选档也删键，与同档判据相悖：`SETTINGS.md:374`「档位值（枚举档）｜写字面档值（如 `low`/`high`/`max`）」、V-1（`:1645`「盘上 `advisor.reasoningEffort = "low"` ∧ 无 `effort` 键」）；且与所引先例相反（`cmd-think.mjs:120` 实读「`cur.reasoningEffort = e.level`」）。同句覆盖的反向迁移（off 形在场 ⇒ 选档）无 AC / 用例，且明文「`{type:"disabled"}` 不动」。机判面 V-1 钉死正解 ⇒ 判 🟡（若按「同机制两式」严格口径可上调，留父侧裁定）。 | 收正为「档位态 = 写 `reasoningEffort`（清 `null` 标记）；删键只适用 off 与「—」两态」，并补一条「盘上 `thinking:null` + 选 `low` ⇒ 标记清除 ∧ `reasoningEffort = "low"`」用例（两族别）。 |
| 9 | (new) | `MODEL-SPECS.md:268` · `:283` | 🔵 | New（残留措辞） | 两处仍以旧形描述 picker 归一的派生 / 历史面且无 §15.4 指针：`:268`「`effortDefault \|\| levels[0] \|\| null` 形式与面 3 取值式同源」；`:283`（§3 表行）「两处归一改 `effortDefault` 优先（…）——补枚举使 `levels[0]` 对四新档落 `"none"`」。规范句六处已单源化（见 2），本条仅派生句 / 历史行 → 🔵。 | 循档内「就地收正」体例补指针（如「取值式随 §15.4 收正」）或改写该派生句；可选。 |
| 10 | (new) | 批档 §2.7 上抛 6 vs §2.9 机检读数 | 🔵 | New（待父侧确认） | doc-check 自述读数两轮间上升：§2.7「悬空 **7** 条…行宽 **17** 行…**本批新增 = 0**」→ §2.9「悬空 **14** · 行宽 **19**——逐条核**无一条落于本轮改动处**」；差额 7 / 2 未归因（并行批次可能）。 | 收口前确认新增悬空未由本轮新引的「拟新增」路径产生；本机无 shell ⇒ doc-check 未自跑（unverified）。 |
| 11 | (new) | `MODEL-SPECS.md:1587` | 🔵 | New（指针对准） | §15.5 表头「权威锚 = `thincoder-core/test/core-hygiene.test.mjs:98`」；本轮实读 `:98` = 注册表列表行（`"test/provider-merge.test.mjs", …`），行数口径的实现面在 `:165`（「`const lines = readFileSync(file, "utf8").split("\n").length - 1 // wc -l semantics`」）；`:96` 的 `provider/core.mjs` 登记引用正确 ✓。 | 锚改指 `:165`（或 `:10-11` 档位注释）。 |

计数：🔴 0（原 2 条 🔴 均核过）· 🟡 1（新）· 🔵 3（新）。VERDICT: pass。

## §4 用户批准（主 agent）

**§4 用户批准（主 agent 代执行 · 2026-09-25 全链授权口径）**

- **授权口径** = 2026-09-25「这七批都派出去」= 全链；代执行自缚三条件逐项核验：
  - ① 设计评审 **pass（轮 2）**——轮 1 = changes-required（🔴2 / 🟡3 / 🔵2）→ 修正轮 7/7 全落 → 轮 2 = pass（7/7 修正验证；新 🟡1 / 🔵3 全非阻断）✓；
  - ② 收尾修正（轮 2 新行 8 / 9 / 11）**全落并读回核验** ✓（`:1569` 档位态 = 写键（删键只适用 off/「—」两态）· `:1650` 补用例 V-6（计数 18→19）· `:1587` 锚改指 `core-hygiene.test.mjs:165` · `:268`/`:283` 补「随 §15.4 收正」指针）；
  - ③ designToken **在效** ✓。
- 轮 2 行 10（doc-check 差额 7/2）：**归因并行批次**（#29 改前实跑即 14/19 · 本档三跑行集不变 ⇒ 非本档、非本轮引入）；收口时随 §6 再核。
- 据上：批② 进入实施（eng-coder · 按批档 §2 + 设计档 `MODEL-SPECS.md` §15 实施；§5 实施记录由该档写）。

## §5 实施记录（eng-coder）

**§5 实施记录（eng-coder · 实施轮 · 2026-09-25）**　**状态行**：实施完成

**交付摘要**：按设计 `docs/core/design/MODEL-SPECS.md` §15（任务书 = 本档 §2 + §2.9/§2.10 修正块）实施五条（#241/#326/#329/#330/#331）——改动 **15 档**（14 改 + 1 新），零 `docs/**` 改动。
三包读数：`thincoder-core` **663/663** · `thincoder-vscode` **985/985** · `thincoder-cli` **849/849**（`npm test`，fail 0）。
doc-check 对照：入场 **悬空 14 / 行宽 18** → 交付后 **悬空 4 / 行宽 18**（下降差额归并行批次；**本批零净增**——剩余 4 悬空 = `MODEL-SPECS.md:323` `cacheMode` · `:1372`/`:1465` `provider/core.mjs` · `SESSION.md:793`，均既存）。

**逐条落位**（`file:line` as-of 交付实读）：

| 条目 | 落位 | 判据 / 用例 |
|---|---|---|
| #241（不收窄 + 语义收正） | `thincoder-core/provider/core.mjs:182` 行注改述（±0 行；谓词本体零改）；`thincoder-core/test/model-specs-cleanup.test.mjs:119-133` | N-1（标集 14 名逐行 + 单消费点在位）；AC-2 散文面（设计明许无测试锚） |
| #326（六对对齐） | `thincoder-core/config-presets.mjs:30/31/33/37/38/39`（grok 64_000 · 其余五家 32_000）；`thincoder-core/test/config-presets.test.mjs:55-116` | P-5（逐对 ≤ 生效基准 + 真行三对另断 = 行值）· P-6（`OVER_LIMIT = []` 绊网）· P-7（兜底三名 `matched:false` ∧ 基准 32_000） |
| #329（off 形达载荷层） | `thincoder-core/advisor/run.mjs:43-48`（自定义渠道分支）· `:59-64`（主 provider 兜底分支）；`thincoder-cli/src/tui/cmd-advisor.mjs:57-72`（`applyThinkOff` 三支） | AD-1/AD-2（保形 + 清继承档；`false` 归一零变）· AD-3/AD-4（stubFetch 载荷面）· `cmd-advisor.test.mjs` 三族别 |
| #330（归一链单源） | `thincoder-vscode/webview/settings-state.js:48-53`（`effortSelection`）+ `:60-65`（`effortSelectView` 收口）；`webview/model-picker.js:86`/`:125`（两处归一）+ `:88`/`:127`（渲染「—」+ 无 active） | E-6/E-7/E-8（三分支直驱）· E-10（存值 ∉ 枚举 ⇒ 「—」）· E-9（两径中性档：按钮「—」/ 无 ✓ / 零 patch） |
| #331（死键接线） | `webview/settings-state.js:71-75`（`advisorEffortCurrent`）· `:88-92`（`advisorEffortPayloadValue`）；`webview/settings-agent.js:64`（读面）+ `:131`（载荷键 + 未渲染不发）；`src/extension/settings-panel-write.mjs:58-68`（`advisorOffShape`）+ `:137-142`（种子循环 carve-out）+ `:150-167`（三态 + 旧键删） | V-1/V-2/V-2′/V-3（两半）/V-4/V-6 · V-5（读面三态） |

**决策透明表**（设计留白处 + 表外项，逐条披露）：

| # | 决策 | 理由 | 面 |
|---|---|---|---|
| 1 | N-1 挂 `thincoder-core/test/model-specs-cleanup.test.mjs`（**表外载体**） | 设计 §15.5 未点名 N-1 载体；该档已持 `model-specs.mjs` 源扫 helpers（`SPEC_SOURCE`）⇒ 零新脚手架；主档 `model-specs.test.mjs` 的 500 硬限余量按 §14.6 保留 | 测试载体 |
| 2 | VSC 写面 off 取形 = 模块内 `advisorOffShape(model)`（`specForModel` 取自 `../specs.mjs`） | 设计只给规则（§15.4-2）与取形源（payload `adv.model`）；未给模型名时查表兜底 `DEFAULT_SPEC` ⇒ `{type:"disabled"}`（off 档只在 select 已渲染时可达 ⇒ 该兜底为防御面） | `settings-panel-write.mjs` |
| 3 | `handleModelsMessage` 渲染点改用与 `selectModel` 同式 `visible` 变量 | §15.4 渲染注要求「两渲染点同判据」；附带效果——枚举空 + 陈旧 `selectedReasoning` 时显示由「陈旧档文案」归「off」（同判据的必然结果） | `model-picker.js` |
| 4 | CLI `applyThinkOff` 用 early-return 三支（effort / 自定义开值 / 其余） | 与 §15.4-2 表同序，字面可对；`effort_none` 调用方的 `delete cfg.reasoningEffort` 保留（幂等） | `cmd-advisor.mjs` |

**审计与代码评审轮次（终态 = clean）**：

- **内部 explore 偏离审计（轮 1）**：`DEVIATIONS` 一类 🔵（我新写注释里的 `advisor/run.mjs:41/:54` 死指针——评审后已修）；`PARTIAL` / `SILENT-SIMPLIFICATION` / `OUT-OF-LIST` **未发现**（表外 N-1 载体已披露，按令不重复报）；观测 1 项 = CLI `/advisor` 选档支（`effort_<level>`）不清 `thinking:null`（设计 §15.5 只点名 `applyThinkOff` + §15.8 锁菜单形态 ⇒ 按设计字面实施正确，差口归设计面），已转报父侧。
- **内部 advisor 代码评审（轮 1 · `type=code` · sync）**：**VERDICT: pass**（0 🔴 / 未标 must-fix）。读数：🟡2 = ①读面「type 族 off 形」缝隙（`effortSelection` ②/③ 使 `none` 对不含该档的枚举不可渲染 + 面板任意保存会把渲染值当档位写盘——归设计面口径缝隙，报父侧）②`provider/core.mjs` 491 行存量债（已登记 `SOFT_LINE_REGISTRY`，本批 ±0）；🔵4 = 未覆盖的 `reasoning:["enabled"]` 族 / `advisorIncompleteMarker` 冗余 import（**本批未引入**）/ N-1 源码计数脆性 / 该评审发现的我方旧指针（已修）。
- **fix 轮（1 轮）**：①清我方引入的死 import（`settings-agent.js:7` 的 `effortPayloadValue`）；②修 3 处被本批位移的坐标注释（`model-picker-fallback.test.mjs` 的 `:111`/`:13`/`:33`/`:88`/`:81`/`:125`/`:132` 与 `cmd-advisor.test.mjs` 的 `:130-138`/`:57-72`/`:132-133`）；③修本批新写断言消息的旧指针（`config-io-panel.test.mjs:134` → `:48/:64`）。修后复跑：3 档相关测试档全绿（VSC 全量 985/985 · CLI 849/849 · core 663/663）。
- **终态**：`clean`（无未决 must-fix；审计 1 类发现已修，评审 pass）。

**未做 / 越界自述**：`docs/**` 零改动（设计轮已落；DOC 侧义务不在实施面）；未修 §15.8 禁止清单任一项；未采纳评审的 2 项 🟡（1 = 设计面口径缝隙，2 = 存量登记债）与 4 项 🔵 中除「我方文本」外的项——均按「不越设计边界」留报父侧裁定。

## §6 验证与收口（父代理）

**核验与收口（主 agent · 2026-09-25）**

**实施交付核验**
- 交付 = eng-coder `#30`（内部审计 DEVIATIONS〔1🔵 已修〕· 顾问代码评审 pass〔0🔴 · 无 must-fix；🟡2 / 🔵4 advisory〕· fix 轮 1 清死指针与坐标 · 终态 `clean` · §5 在档 3970 字符）。
- **本席复核（读盘抽验）**：`advisor/run.mjs:43-48` / `:59-64` 两分支 off 保形（`thinking === null` 保留 + 删继承档 · `false` 归一 `undefined`）✓ · `config-presets.mjs` 六值（grok **64_000** · 其余 32_000）✓ · `settings-panel-write.mjs:58-68` `advisorOffShape` 族别取形（effort / 自定义开值族 ⇒ `null` ∥ type 族 ⇒ `{type:"disabled"}`）✓。
- 三树读数（交付）：core **663/663** · CLI **850/850** · VSC **987/987**（fail 0 ×3）；用例 **19/19**；doc-check 零净增（14/18 → 4/18，差额归并批面）✓。
- **表外 1 档**（如实披露）：`test/model-specs-cleanup.test.mjs` 载 N-1（设计 §15.5 未点名载体——gap；选档理由 = 已持源扫 helpers、零新脚手架）——**接受**（载体合理；主档 500 硬限余量按 §14.6 保留）。

**advisory 处置（交付提请 · 父侧裁）**
- ① CLI `/advisor` 选档支不清 `thinking:null` · ② type 族 off 形读面角 · ③ `reasoning:["enabled"]` 族按钮转「—」无用例——**三件均属设计面补口（off 形族完整性）**：**Deferred → 台账 #346**（归批）；④ `advisor/run.mjs:12` 冗余 import（pre-existing）→ 并 #346 证据。⑤ N-1 判据 = 源码文本行扫（按设计形态）——**接受**（登记）。
- **设计档指针收正（父侧直接执行 · 可 revert）**：`MODEL-SPECS.md:1585` + `SETTINGS.md:367` 的核读取键坐标 `advisor/run.mjs:41/:54` → **`:48/:64`**（本批注释插入后实位）。

**收口**：§1 置「已收口」· 记录冻结；台账 #241 / #326 / #329 / #330 / #331 → 待核销 → 已核销；designToken 消费（链终止）。
