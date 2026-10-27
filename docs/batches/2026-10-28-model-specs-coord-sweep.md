# 2026-10-28 · model-specs-coord-sweep
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-28 · 来源 = 用户 2026-10-28 01:47 逐字「都自动跑完」（整批令）—— 授权 `#1863` 开工。本批收台账 `#1863`：`docs/core/design/MODEL-SPECS.md` 内 35 处 `provider/*.mjs` 行号引用中至少 10 处指错。。
> 台账 = #1864（PROVIDER · 归批）。前情 = 2026-10-28-design-coord-reanchor（进行中）—— 本批是它裁定另批的部分。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-28
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 本批范围（父侧 2026-10-28 01:5x）

**一条台账项：`#1863` —— `docs/core/design/MODEL-SPECS.md` 的坐标面整体收正。**

**35 处 `thincoder-core/provider/*.mjs:NN` 引用，已核 8 处错、21 处形同未核、其余未抽到。**

### 1.2 已核样本（`#1861` 设计席逐行读过，父侧转记）

| 档内行 | 句中所述 | 该行实际内容 |
|---|---|---|
| `:146` → `core.mjs:197-203` | reasoningEffort 越界抛错门 | `const rules = compileStreamRules(streamRules)` |
| `:154` → `core.mjs:253` | `partialMode` 续写面 | `// 2026-08-31：tool_choice 能力层（透传 OpenAI 语义）；` |
| `:178` → `core.mjs:209` | `enable_thinking:false` 发送点 | `const budget = requestBudget(provider, spec)` |
| `:1335` → `core.mjs:183` | `body.stream_options` 唯一消费点 | `const { chat: responsesChat } = await import("./responses.mjs")` |
| `:1899` → `core.mjs:191` | `noUsageStream` 消费点 | **空行** |
| `:1886` → `google.mjs:86` | 发 `maxOutputTokens` 的请求体 | `const body = {` |
| `:1893` → `core.mjs:222` | `thinkApi` 读点 | `const isRouter = provider.model.includes("/")` |
| `:1945` → `core.mjs:205` | google 排除 `reasoning_effort` 发送 | `}` |

**未核定但形同（21 处，接笔时按同判据逐条读）**：`:92` `:130` `:155` `:189` `:197` `:323` `:374` `:446` `:486` `:491` `:586` `:589` `:819` `:959` `:963` `:1469` `:1896` `:1897` `:1898` `:1900` `:1905`。

### 1.3 为什么它值得单独立批（不是「顺手修几个数字」）

**`docs/core/design/MODEL-SPECS.md` 是 provider 规格面的**单源档** —— 读它的人会按行号去翻实现。**

**⇒ 10 处以上指错（含指到空行、指到与句中毫不相干的语句），等于该档的坐标面**整体不可信**。**

**★ 成因是**多批累积漂移**：历史每一批改了 `provider/*.mjs` 都没回头校它。这与 `#1861` 收的「B/D 两批造成的三处」是两种成因、两个变更面，故分两批。**

### 1.4 处置三选（父侧定，沿既有对账纪律）

每一条按性质三选一，并在逐条表里写明选了哪个、为什么：

1. **现态改写** —— 句中所述的内容确实还在，只是行号漂了 ⇒ 改成现行号。
2. **退场注记** —— 句中所述的内容已不存在（被删 / 被并入别处）⇒ 加「已废」标记 + 指向现行承载处的指针，**不删证据**。
3. **订正** —— 引用确属笔误（指错文件 / 指错符号）⇒ 改为正确引用。

### 1.5 父侧定的边界

- **只碰 `docs/core/design/MODEL-SPECS.md` 一档**，不碰产品码、不碰其他设计档。
- **不改机制语义**：句中所述的内容若与代码不符（不是行号问题，是说法问题）⇒ **停下上抛**，不自行改判。
- **不改该档的行数与档位读数**（那是另一类读数，本批只校坐标）。
- **逐条表要给够**：每行写明「档:行 → 旧坐标 → 新坐标 → 三选中的哪个 → 依据（该行实际内容）」。

### 1.6 设计席三条上抛的裁定（父侧 2026-10-28 01:5x）

**上抛 1（语义与代码不符）—— 裁：并进本批改，但按「说法订正」单列，不混进坐标表。**

事实：`docs/core/design/MODEL-SPECS.md:1945` 述「`google.mjs` 无 `thinkingConfig`」，而 `thincoder-core/provider/google.mjs:96` 实为 `...(provider.thinking?.type === "disabled" ? { thinkingConfig: { thinkingLevel: "none" } } : {})`（`:94` 注引 `#1200`）。

**为什么并进来而不是另立台账**：`#1861` 的教训就在眼前 —— 同因同面的事只做一半，剩下的一半会以「另批」的名义在账上躺很久，而这一处只要改一句说法。**同档、同面、一行，并入。**

**为什么单列而不混进坐标表**：坐标表每行是「旧坐标 → 新坐标」，那是**机械换位**；这一条是**说法与代码相反**，改的是断言内容。两类改动混一张表，评审无法分辨哪几行需要独立验语义。**⇒ 在 §2.4 表后单开一张「说法订正」表，只此一行。**

**边界**：只改这一句断言，**不改 `thinkingConfig` 的任何机制描述**（那是 PROVIDER 面的活）；若改的过程中发现 google 侧还有别的 `thinkingConfig` 说法与此冲突，**停下上抛**，不连带走。

**上抛 2（行数读数三处不一致）—— 裁：并进本批，一并改。**

事实：`core.mjs` 档 `:513` 记 492、`:1449` 记 491、**实读 494**。

**为什么并进来**：§1.5 的边界写的是「不改该档的行数与档位读数（那是另一类读数）」，但那句话的本意是**别把行数读数当成坐标一起扫**；现在三处读数彼此不一致、且都与实读不符，**留着就是三处互斥的谎**。⇒ 改：三处统一为实读 494，并在同句标取读日。

**上抛 3（知会：该档另有 2 行非本批改动）—— 收下，不改处置。**

那 2 行 = `#1861` 批改的 `specs.mjs` 端侧坐标（`:958` / `:1885`）。**⇒ 两批同档，提交时无法按档分开，只能同一笔提交、message 里写清两批**。这一条记在此处，防提交时误以为是本批的改动。

### 1.7 本批与 `#1861` 的交错（父侧记）

**`#1861` 的修正轮（`eng-designer#6`）改的是 `specs.mjs` 坐标（`:1725` / `:1767` / `:1228` / `:325` / `:251` / `:1778`），本批改的是 `provider/*.mjs` 坐标 —— 两组不重叠。**

**⇒ 且本批 32 行原位改写、±0 行，`#1861` 修正轮所依赖的行号不被本批移动。**

### 1.8 第一轮评审裁定（父侧 2026-10-28 01:5x）

**评审判 changes-required（🔴 2 · 🟡 5 · 🔵 2）。九条全数接受。**

**两条 🔴 的根因是我的流程，不是设计席的执行**：我写 §1.6 裁定时，设计席已按 §1.5 的「说法问题 ⇒ 停手上抛」把两条挂成待裁 —— 它遵守的是它读到的规则，而我的裁定晚了一步、又没有回头通知它。**⇒ 修正轮把两条并进 §2，不要把它当执行偏差。**

| # | 级 | 裁 | 处置 |
|---|---|---|---|
| 1 | 🔴 | **Fixed** | `:1945` 的说法订正并入：在 §2.4 表后补一行「说法订正」表，只改那一句断言（「`google.mjs` 无 `thinkingConfig`」⇒ 按 `thincoder-core/provider/google.mjs:96` 的实有内容改写）；`thinkingConfig` 的机制描述仍归 `docs/core/design/PROVIDER.md`，本批不碰。§2.8 的上抛 1 撤销。 |
| 2 | 🔴 | **Fixed** | `core.mjs` 三处行数统一 494 并各标取读日（`:513` 现 492 · `:536` 现 491 · `:1449` 现 491）；连带 `:1449` 的「距 500 硬限余量 9 行」按 494 重算为 6 行。§2.8 的上抛 2 撤销（它当时只列两处，漏了 `:536`，评审替我们抓到了）。 |
| 3 | 🟡 | **Fixed** | §2 内读数自相矛盾（§2.2/§2.5 的「34 行」vs §2.1/§2.9 的「32 行」；§2.5 的 `1955` vs §2.9 的 `1954`）⇒ 统一为 32 行 / 1954，并把 §2.9 的修订式残留改成单一现读数。 |
| 4 | 🟡 | **Fixed** | §2.4 第 22 行的「依据（旧坐标）」引用错行：`thincoder-core/provider/responses.mjs:207` 实为 `}`，所引 `sources: …` 在 `:205`。③ 订正结论本身成立（该档无 `max_output_tokens` 发送点，仅 `:232` 注释提及）。⇒ 改正引用行与引文，判定保留。 |
| 5 | 🟡 | **Fixed** | 补 closest-precedent 行与 survey-evidence 行。偏离理由可写实：三选处置里 ② 零对象、③ 仅一处 —— 因为 42 处所述内容全部仍在盘。 |
| 6 | 🟡 | **Fixed** | 集成面补 `test/RTM.md` 起点与 delta 结论（无既有用例断言文档坐标 ⇒ 零行破、零行缺），零用例新增不变。 |
| 7 | 🟡 | **Fixed** | 两处函数级区间未到函数末行（`normalize.mjs:99-113` 实 99–120；`errors.mjs:65-68` 实 65–69）⇒ 改到函数末行，与 §2.3 自己的约定对齐。 |
| 8 | 🔵 | **接受，记教训** | 42 处已就地落盘、评审只能追认 —— 这条与本批 `#1864` 的性质有关（改的就是设计档，设计席有权落），但**落盘仍应在 token 之后**。记在此，后续同类批注意。 |
| 9 | 🔵 | **Fixed** | §2 内补 `doc_check(mode:"gate")` 首行读数；§5 以「不适用 + 理由」在记录面声明。 |

**评审核过的正面**：42 处新坐标逐条对读被引实现文件（`core.mjs` / `normalize.mjs` / `errors.mjs` / `google.mjs` / `anthropic.mjs` / `responses-request.mjs` / `responses.mjs`），**全部解析成立、逐条与句中所述同义，确实 0 处需退场注记**；那 1 处跨文件订正（`responses.mjs:207` → `responses-request.mjs:202`）的目标判定成立。

**⇒ 文档地图与项目标准档未提供**，归属只能降级核：落点仍在 `docs/core/design/MODEL-SPECS.md` 本档、未新建文件、未复述他档机制 ⇒ 无归属缺陷。这一条记在此，防后续把「降级核」当成「已按地图校验」。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成 2026-10-28（修正轮已落：评审 9 条全并入；42 处坐标 + 1 处说法订正 + 3 处行数读数统一 494）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目（覆盖）

台账 `#1863`。设计档 `docs/core/design/MODEL-SPECS.md` 的 `thincoder-core/provider/*.mjs:NN` 坐标面整体收正。

| # | 条目 | 覆盖 | 落地位置 |
|---|---|---|---|
| 1 | 该档 35 处带路径 `provider/*.mjs:NN` 引用 + 7 处同行裸 `:NN` 续指，逐条重核并改到现行坐标 | 42 处全核（§2.4 逐条表） | 本档 32 行（已改，未提交） |

`§1.2` 的 8 处已核样本全部复现为错（复读结果逐条见 §2.4 `依据` 列）；21 处「形同未核」全部复核，无一处指向句中所述内容。

**本批零产品码、零其他设计档**（`§1.5` 边界）。变更面 = 设计档坐标一处。

### 2.2 设计档落点

唯一落点 = `docs/core/design/MODEL-SPECS.md`（`docRoot.design`）。

按 D1（设计档 → eng-designer）由设计席**本轮直接落地**：变更对象本身就是设计档，无产品码实施面 ⇒ §5 无工程实施内容（父侧据此裁定 §5 处置）。

档位行数 ±0（32 行原位改写；`1954` 行改前后同）。

### 2.3 机制设计（本批无机制变更）

不新增字段、不改判据、不动代码。改写形态沿用该档既有坐标约定，不另立新形态：

| 被引用的语义 | 坐标形态 | 例 |
|---|---|---|
| 单一判据行 | 单行 | `core.mjs:224`（越界判据）、`:219`（`thinking` falsy 跳过） |
| 判据 + 抛出 / 判据 + 赋值块 | 判据首行至块尾 | `core.mjs:223-229`（越界抛错门）、`:250-251`（`enable_thinking` 发送） |
| 函数级语义 | 函数首行至末行 | `normalize.mjs:99-120`（图像 part 剥除门） |
| 整文件范围（无单点） | 仅路径、不附行号 | `thincoder-core/provider/google.mjs`（§18.8 尾注） |

**最近先例（closest precedent）**：`existing: docs/core/design/MODEL-SPECS.md:517`（同行裸 `:223-229` 由明写的 `thincoder-core/provider/core.mjs` 续指）· `:513`（判据首行至块尾形态）——两条即上表前两行形态的现成用例。**对齐**：42 处全用这三种既有形态，零新增形态。**偏离**：无。

**公共源文档勘察（survey evidence）**：查项目文档地图 `docs/README.md`，四项读数如下。

- `docs/README.md:15`：板块需求 / 设计档落 `core/requirements/` · `core/design/` —— 本批落点 `docs/core/design/MODEL-SPECS.md` 已在该层。
- `docs/README.md:21-24`：迁移政策（新项目级档落本层 · 旧档随批迁）—— 本批零新建档、零迁移 ⇒ 不涉。
- `docs/README.md:26`：命名规则 / 归属判据 / 交叉引用形态归 `docs/core/design/DOC-SYSTEM.md` —— 本批落点在原档 ⇒ 无归属判定面。
- 该地图未规定「坐标形态」⇒ 形态判据取本档既有用法（上表四行）；公共仓索引无外部 provider 规格档可比 ⇒ 无外源可对齐。

### 2.4 逐条表（42 处 · 旧 → 新 → 三选 → 依据）

处置口径沿 `§1.4`：① 现态改写 · ② 退场注记 · ③ 订正。`依据` 列逐字取自被引文件本次实读行。

| # | 档:行 | 旧坐标 | 新坐标 | 处置 | 依据（该行实际内容） |
|---|---|---|---|---|---|
| 1 | `:92` | `normalize.mjs:22` | `normalize.mjs:108` | ① | `if (spec.multimodal && RASTER_IMAGE_URL.test(url)) return p` |
| 2 | `:130` | `core.mjs:253` | `core.mjs:299` | ① | `if (!spec.partialMode && !spec.prefixMode) return result` |
| 3 | `:146` | `core.mjs:197-203` | `core.mjs:223-229` | ① | `if (provider.reasoningEffort && !isRouter && provider.format !== "anthropic" && provider.format !== "google") {` …（throw 在 `:225-228`） |
| 4 | `:146` | `:198`（裸） | `:224` | ① | `if (spec.reasoningEffortEnum && !spec.reasoningEffortEnum.includes(provider.reasoningEffort)) {` |
| 5 | `:154` | `core.mjs:253` | `core.mjs:299` | ① | 同 #2（`partialMode` 判据行） |
| 6 | `:155` | `normalize.mjs:22` | `normalize.mjs:108` | ① | 同 #1 |
| 7 | `:178` | `core.mjs:209` | `core.mjs:250-251` | ① | `const enableThinking = resolveEnableThinking(provider, spec)` / `if (enableThinking !== undefined) body.enable_thinking = enableThinking` |
| 8 | `:189` | `normalize.mjs:22` | `normalize.mjs:99-120` | ① | `export function stripImagesForTextModel(messages, spec) {` … `return { type: "text", text: \`[image omitted — ${reason}]\` }` |
| 9 | `:197` | `normalize.mjs:11` | `normalize.mjs:10` | ① | `const RASTER_IMAGE_URL = /^data:image\/(png\|jpe?g\|gif\|webp);base64,/` |
| 10 | `:323` | `core.mjs:198-203` | `core.mjs:223-229` | ① | 同 #3 |
| 11 | `:374` | `core.mjs:198` | `core.mjs:224` | ① | 同 #4（判据行） |
| 12 | `:446` | `errors.mjs:56-60` | `errors.mjs:65-69` | ① | `export function betaBaseURL(baseURL) {` … `return baseURL.endsWith("/") ? baseURL + "beta" : baseURL + "/beta"` |
| 13 | `:446` | `core.mjs:270-276` | `core.mjs:317-322` | ① | `} catch (error) {` … `result._warnings.push({ name: "continuation-failed", … })` … `break` |
| 14 | `:486` | `core.mjs:193` | `core.mjs:219` | ① | `if (provider.thinking) body.thinking = provider.thinking` |
| 15 | `:491` | `core.mjs:196-197` | `core.mjs:222-223` | ① | `const isRouter = provider.model.includes("/")`（`!isRouter` 门在其下行） |
| 16 | `:517` | `:198-203`（裸） | `:223-229` | ① | 同 #3；裸坐标由同行明写的 `thincoder-core/provider/core.mjs` 续指 |
| 17 | `:586` | `core.mjs:198-203` | `core.mjs:223-229` | ① | 同 #3 |
| 18 | `:589` | `core.mjs:196-197` | `core.mjs:222-223` | ① | 同 #15 |
| 19 | `:819` | `core.mjs:198-203` | `core.mjs:223-229` | ① | 同 #3 |
| 20 | `:959` | `core.mjs:187-188` | `core.mjs:213-215` | ① | `if (spec.tempRange) {` / `t = Math.min(spec.tempRange[1], Math.max(spec.tempRange[0], t))` / `t = Math.round(t * 100) / 100` |
| 21 | `:963` | `anthropic.mjs:56` | `anthropic.mjs:180` | ① | `max_tokens: requestBudget(provider).maxTokens,` |
| 22 | `:963` | `responses.mjs:207` | `responses-request.mjs:202` | ③ | 现 `responses.mjs:205` = SSE 解析内 `sources: item.action?.sources ?? []`（`:207` 为 `}`）；`max_output_tokens` 发送点在 `responses-request.mjs:202`。**指错文件**（拆分时点未考，见 §2.7 D-5） |
| 23 | `:1335` | `core.mjs:183` | `core.mjs:207` | ① | `if (!spec.noUsageStream) body.stream_options = { include_usage: true }` |
| 24 | `:1449` | `:182`（裸） | `:206` | ① | `// 保守抑制（非能力断言）：带 \`noUsageStream\` 的行 = 核不主动发 stream_options.include_usage …` |
| 25 | `:1469` | `core.mjs:183` | `core.mjs:207` | ① | 同 #23 |
| 26 | `:1886` | `google.mjs:86` | `google.mjs:91-92` | ① | `...(requestBudget(provider).maxTokens !== undefined` / `? { maxOutputTokens: requestBudget(provider).maxTokens }` |
| 27 | `:1887` | `google.mjs:54-59` | `google.mjs:58-63` | ① | `else if (part.type === "image_url") {` … `parts.push({ inlineData: { mimeType: mimeMatch[1], data: mimeMatch[2] } })` |
| 28 | `:1893` | `core.mjs:222` | `core.mjs:240` | ① | `spec.thinkApi === "effort" &&` |
| 29 | `:1896` | `core.mjs:206` | `core.mjs:224` | ① | 同 #4（`reasoningEffortEnum` 读点） |
| 30 | `:1897` | `core.mjs:205` | `core.mjs:223` | ① | 同 #3（`provider.format !== "google"` 排除款） |
| 31 | `:1897` | `:153`（裸） | `:166` | ① | `if (provider.format === "google") {` |
| 32 | `:1898` | `core.mjs:195-196` | `core.mjs:213-215` | ① | 同 #20 |
| 33 | `:1898` | `responses-request.mjs:208-209` | `responses-request.mjs:209-212` | ① | `if (spec.tempRange) {` / `t = Math.min(spec.tempRange[1], …)` / `t = Math.round(t * 100) / 100` |
| 34 | `:1898` | `anthropic.mjs:66` | `anthropic.mjs:190-192` | ① | `const [tMin, tMax] = spec.tempRange ?? [0, 1]` … 钳位三行 |
| 35 | `:1898` | `core.mjs:153`（裸） | `core.mjs:166` | ① | 同 #31 |
| 36 | `:1899` | `core.mjs:191` | `core.mjs:207` | ① | 同 #23 |
| 37 | `:1900` | `core.mjs:143` | `core.mjs:152` | ① | `if (provider.format === "anthropic") {` |
| 38 | `:1900` | `:153`（裸） | `:166` | ① | 同 #31 |
| 39 | `:1900` | `:163`（裸） | `:178` | ① | `if (provider.format === "responses") {` |
| 40 | `:1900` | `:205`（裸） | `:223` | ① | 同 #3 |
| 41 | `:1905` | `core.mjs:205` | `core.mjs:223` | ① | 同 #3 |
| 42 | `:1945` | `core.mjs:205` | `core.mjs:223` | ① | 同 #3 |

**计数（D3 · 逐行与汇总同变）**：42 处 = ① 现态改写 **41** + ③ 订正 **1** + ② 退场注记 **0**；落在 **32 个档内行**上（`#3/#4` 同行、`#12/#13` 同行、`#30/#31` 同行等）。② 为零的原因：42 处所述内容**全部仍在盘**，无一处被删或并入他处。

### 2.4.1 说法订正（1 处 · 断言与代码相反）

与 §2.4 分表：§2.4 每行是「旧坐标 → 新坐标」的机械换位，本表改的是**断言内容**——两表混排时评审分不出哪几行需独立验语义。

| # | 档:行 | 原断言 | 现态断言 | 依据（该行实际内容） |
|---|---|---|---|---|
| S-1 | `:1945` | 「`thincoder-core/provider/google.mjs` 无 `thinkingConfig`」 | `google.mjs:96` 的 `thinkingConfig` 仅在 off 形发送（`provider.thinking?.type === "disabled"` ⇒ `thinkingLevel: "none"`），无分档 effort 通路 | `...(provider.thinking?.type === "disabled" ? { thinkingConfig: { thinkingLevel: "none" } } : {}),`（`thincoder-core/provider/google.mjs:96`） |

全档 `thinkingConfig` 词扫 1 命中（即 `:1945` 本行）⇒ 无第二处冲突断言。机制面（`thinkingConfig` 的取值与生效）归 `docs/core/design/PROVIDER.md`，本批不碰。

### 2.5 受影响文件与验证覆盖

| 文件 | 现行行数 | 预期增删 | 改动 |
|---|---|---|---|
| `docs/core/design/MODEL-SPECS.md` | **1954** | ±0（32 行原位改写 + 1 行说法订正） | §2.4 的 42 处坐标字面 + §2.4.1 的 `:1945` 断言 |

**无产品码、无测试文件、无其他设计档**。

验证覆盖（文档面变更，本批无可运行单测；判据 = 实跑的检查与其读数）：

1. **坐标可达性 + 语义对位**：本次复扫（正则 = 全档逐行 `provider/*.mjs:NN` / `:NN-MM` 形）—— 得 **36 处**（§2.4 的 35 处 + §2.4.1 新增引用的 `google.mjs:96` 1 处），**全部解析成立，0 处 `FILE-MISSING`，0 处 `OUT-OF-RANGE`**（2026-10-28 取读）；本轮改动的两处区间已核到函数末行（`normalize.mjs:120` / `errors.mjs:69` 均为 `}`）。逐条语义对位读数见 §2.4 `依据` 列。
2. **裸坐标残余扫描**：档内「提到 `provider/*.mjs` 的行」上的裸 `:NN` 全量列出并逐条核对 —— 收正后仅剩 `:224`(`:146`)、`:166`(`:1897`)、`:166/:178/:223`(`:1900`)、`:223-229`(`:517`)，均为本次已核改值；其余裸坐标属 `model-specs.mjs` / `config.mjs` / 端侧文件（本批边界外）。
3. **`doc_check(mode:"gate")`** —— 首行 `DOC-CHECK GATE: PASS`（显式 docs 2 档 = 本档 + 本批档，结论 0 段超长、2 档全清，2026-10-28 本席跑）；父侧收口复跑。

**集成测试面（起点 = `test/RTM.md`）**：现表按端分节（CLI 端 19 个业务故事 · VSC 端 · Desktop 端 · 异常与更正 · 签署面），一行 = 一个集成用例。逐节对读的 delta —— **零行破**（无一行断言 `docs/**` 设计档的坐标或行号；`6-1` 断的是设计评审对仓内文档的受理面、故事 `7` 断的是收口只判本批改过的档，均不涉本档字面）· **零行冗余**（无一行被本批取代）· **零行缺**（两入径皆不成立：无产品确需的业务场景，无生产实际问题 —— 坐标错读的是人，不是产品行为）⇒ 本批零用例新增，非缺陷。

### 2.6 验收对照（每条回指 §2.1 条目）

| 判据 | 条目 | 判定（机器可核） | 状态 |
|---|---|---|---|
| AC-1 | #1 | 档内 `thincoder-core/provider/*.mjs:NN` 全部落在被引文件行域内（`行号 ≤ 文件行数`），脚本读数 36/36（= §2.4 35 处 + §2.4.1 新增的 `google.mjs:96`） | 已过 |
| AC-2 | #1 | 每处新坐标处的实际行内容与该处句中所述同义（§2.4 `依据` 列逐字对照） | 已过 |
| AC-3 | #1 | 计数一致：逐条表 42 行 = 32 个档内行上的 42 处；① 41 + ③ 1 + ② 0 | 已过 |
| AC-4 | #1 | 边界：本批仅 `docs/core/design/MODEL-SPECS.md` 一处被设计席改动（产品码与其他设计档零触） | 已过 |
| AC-5 | — | `doc_check(mode:"gate")` 首行 `DOC-CHECK GATE: PASS`（2 档全清） | 已过 |

### 2.7 关键决策

| # | 决策 | 理由 |
|---|---|---|
| D-1 | 三选判据 = 句中所述内容**是否仍在盘**：在 ⇒ ①；已不存在 ⇒ ②；指错目标 ⇒ ③ | `§1.4` 三选的定义直接可判；42 处实读后全部命中 ①/③，故 ② 零行——不是漏判，是无对象 |
| D-2 | 由设计席本轮直接落地，不交 eng-coder | D1 路由：设计档 → eng-designer；且变更对象即设计档，无产品码实施面（`§1.5`「不碰产品码」） |
| D-3 | 坐标区间形态沿用该档既有约定（单点单行 / 判据至块尾 / 函数级首末行），不新立「每处都指单行」之类新形态 | 换形态会让 42 处读起来像新语义（D8）；既有约定已被该档其余坐标使用，读者无需学第二套 |
| D-4 | 裸 `:NN`（同行明写 provider 路径者）按续指收正，并单列在表内 | 不收正即残留指错；单列是为让评审能分辨「带路径引用 35」与「裸续指 7」两个基数，避免计数含混 |
| D-5 | `:963` 的 `responses.mjs:207` 判为 ③ 而非 ① | 该处所述内容（`max_output_tokens` 发送）现存于 `responses-request.mjs:202`，**不在** `responses.mjs` 内任何行 ⇒ 是文件指错，不是行号漂移 |

### 2.8 上抛项

**[上抛·知会] 3 · 目标档工作树内另有非本批改动（提交时需分辨）**

- `git diff`（对 HEAD）在本档除本批 32 行外，另有 2 行：`:958` 的 `specs.mjs:73,:87` → `:83,:89`、`:1885` 的 `specs.mjs:82,:96` → `:83,:89`。
- 二者**非本批所改**（本批 42 处不含端侧 `specs.mjs`），提交时勿计入本批；其归属留给父侧认领。

### 2.9 §2 自校读数（逐条可核）

**档位行数**：`docs/core/design/MODEL-SPECS.md` = **1954**（`wc -l` 口径，2026-10-28 取读；与 `core.mjs = 494` 同一支尺）。本轮 ±0：32 行原位改写 + 1 行说法订正，无增行、无删行。

自校三项读数（写完回读，机械核过）：

| 项 | 检查 | 读数 |
|---|---|---|
| ① 引用 ↔ 标题集 | §2 引用的批档段号（`§1.2` / `§1.4` / `§1.5`）与档内节号（`§18.8`）是否在盘 | 全部存在；`doc_check(gate)` 锚判据 0 命中佐证 |
| ② 表行 ↔ 汇总计数 | §2.4 表行 vs §2.4 汇总句 | 表 **42** 行；汇总 42 = ①41 + ③1 + ②0；档内行 **32** 个（与 §2.1/§2.5 一致）；§2.4.1 说法订正表 **1** 行 |
| ③ 断言 ↔ 实测 | §2 内每个数字的来源 | 35/35 与 0/0 = 本次脚本读数；494 / 1954 = 本次 `wc -l` 读数；42 / 32 / 1 = 本次表行计数 |

## §3 设计评审（评审子代理）
**状态行**：评审通过（第二轮：第一轮 9 条全数收口（🔴2 Fixed · 🟡5 Fixed · 🔵2 Fixed/Accepted），新增 🟡2 · 🔵2 不放行拦）



### 轮次 1（评审子代理）

### 设计评审（坐标面整体收正 · `#1863`/`#1864`）

核验面 = 42 处新坐标逐条对读下列被引文件：

- `thincoder-core/provider/core.mjs`
- `thincoder-core/provider/normalize.mjs`
- `thincoder-core/provider/errors.mjs`
- `thincoder-core/provider/google.mjs`
- `thincoder-core/provider/anthropic.mjs`
- `thincoder-core/provider/responses-request.mjs`
- `thincoder-core/provider/responses.mjs`

读数：35 处带路径 + 7 处裸续指全部解析成立，且与句中所述同义。
⇒ 验收重点 ①②④ 通过；未通过项 = 验收重点 ③（§1.6 两条并入）。

| # | 类别 | 严重度 | 问题 | 建议 |
|---|---|---|---|---|
| 1 | 需求覆盖 | 🔴 | §1.6 裁定①（`:1945`「`google.mjs` 无 `thinkingConfig`」作为「说法订正」并入本批、在 §2.4 表后单开一行表）未执行：§2.8 仍记为上抛「按 `§1.5` 未动，交父侧裁（改判 / 保留 / 另批）」（`docs/batches/2026-10-28-model-specs-coord-sweep.md:209`），§2 内无「说法订正」表；档内 `docs/core/design/MODEL-SPECS.md:1945` 仍为「无 `thinkingConfig`」，而 `thincoder-core/provider/google.mjs:96` 实有 `...(provider.thinking?.type === "disabled" ? { thinkingConfig: { thinkingLevel: "none" } } : {}),` | 在 §2.4 表后补一行「说法订正」表，只改 `:1945` 那一句断言；§18.8 其余句与 `thinkingConfig` 机制描述不动（机制面归 `docs/core/design/PROVIDER.md`）；§2.8 上抛 1 随之撤销 |
| 2 | 需求覆盖 | 🔴 | §1.6 裁定②（行数三处统一为实读 494 + 标取读日）未执行，且 §2.8 的上抛 2 只列两处：档内实有三处 —— `docs/core/design/MODEL-SPECS.md:513` 记 492、`:536` 记 491、`:1449` 记 491；`thincoder-core/provider/core.mjs` 末行为 `:494`（`}`）⇒ wc -l = 494。连带 `:1449` 的「距 500 硬限余量 9 行」在 494 下应为 6 行 | 三处一并改 494 并各标取读日；重算 `:1449` 的硬限余量句；§2.8 上抛 2 撤销（并入已改清单） |
| 3 | 清晰度 | 🟡 | §2 内读数自相矛盾：§2.2/§2.5 记「34 行原位改写」，§2.1/§2.9 记「32 行」；§2.5 表仍记 `1955`，§2.9 自校为 `1954`（`docs/batches/2026-10-28-model-specs-coord-sweep.md:171` vs `:223`） | 统一为 32 行 / 1954；把 §2.9 的「1955 → 已更正为 1954」式修订残留改为单一现读数 |
| 4 | 验收可核 | 🟡 | §2.4 #22 的「依据（旧坐标）」与实读不符：`thincoder-core/provider/responses.mjs:207` 实为 `}`，所引 `sources: item.action?.sources ?? []` 在 `:205`。③ 订正结论本身成立 —— 该文件无 `max_output_tokens` 发送点（仅 `:232` 注释提及），发送点在 `thincoder-core/provider/responses-request.mjs:202` | 改正该行依据的引用行与引文；③ 判定保留 |
| 5 | 方法论 | 🟡 | §2 缺 closest-precedent 行（先例坐标 + 对齐/偏离理由）与 survey-evidence 行（查过哪些公共源文档 / 是否相关） | 两条补进 §2（偏离理由 = 三选处置 ② 零对象、③ 仅一处） |
| 6 | 集成测试设计 | 🟡 | §2.5「集成测试面：不适用」理由成立（本批不改任何业务可观察结果），但全段未从 `test/RTM.md`（在盘）起算，未声明「哪些行破、哪些冗余、哪些缺」的 delta | 在 §2.5 点名 `test/RTM.md` 与结论（无既有用例断言文档坐标 ⇒ 零行破、零行缺），保留零用例新增 |
| 7 | 清晰度 | 🟡 | 两处函数级区间未到函数末行，与自身 §2.3 约定（「函数首行至末行」）不符：`thincoder-core/provider/normalize.mjs:99-113`（函数实为 99–120）、`thincoder-core/provider/errors.mjs:65-68`（函数实为 65–69） | 改为 99–120 / 65–69，或在该节写明「门所在行区间」口径 |
| 8 | 流程 | 🔵 | 42 处已就地落盘（「已落地，未提交」），评审不能在内容上设门，只能追认 | 后续同类批把落盘放到 designToken 之后 |
| 9 | 协调项 | 🔵 | §2.2 把 §5 处置留给父侧；AC-5 读数写「见交付报告」而非档内读数 | §2 内记 `doc_check(mode:"gate")` 首行读数；§5 以「不适用 + 理由」在记录面声明 |

核验读数（逐条已核）：

- 42 处新坐标全部解析：0 FILE-MISSING / 0 OUT-OF-RANGE，逐条同义。
- `thincoder-core/provider/core.mjs` 末行 = 494。
- `thincoder-core/provider/google.mjs:96` 确有 `thinkingConfig`。
- `thincoder-core/provider/responses.mjs` 无 `max_output_tokens` 发送点。

文档归属一项降级核：文档地图 / 项目标准档未提供；落点仍在 `docs/core/design/MODEL-SPECS.md` 本档，未新建文件、未复述他档机制。

**计数**：🔴 2 · 🟡 5 · 🔵 2

VERDICT: changes-required

### 轮次 2（评审子代理）

**第二轮（修正轮复评）** —— 只验第一轮 9 条的修正事实。

复读面 = 本批档 §2 全段 + 目标设计档（`docs/core/design/` 下的 MODEL-SPECS）相关行。
实现面复读 = `thincoder-core/provider/` 下 core / normalize / errors / google / responses / responses-request。
另核 = `docs/README.md`（survey 行）· `test/RTM.md`（集成面起点）。

| # | 原# | 级 | 状态 | 复读依据 |
|---|---|---|---|---|
| 1 | 1 | 🔴 | Fixed | §2.4.1 说法订正表在盘（仅 S-1 一行）；目标设计档 `:1945` 已改写为「`thinkingConfig` 仅在 off 形发送 … 无分档 effort 通路」。实读 `thincoder-core/provider/google.mjs:96` 与之相符；该文件全档 thinking / effort 词扫仅此 1 命中 ⇒ 新断言成立；目标设计档全档 `thinkingConfig` 亦仅 `:1945` 1 命中 ⇒ 未连带改机制描述。§2.8 上抛 1 已撤 |
| 2 | 2 | 🔴 | Fixed | 目标设计档 `:513` / `:536` / `:1449` 三处均记 **494**（2026-10-28 取读）；实读 `thincoder-core/provider/core.mjs` 末行 `}` = `:494` ⇒ 读数成立；`:1449` 的 500 硬限余量已重算为 6 行。§2.8 上抛 2 已撤（仅余上抛 3 知会） |
| 3 | 3 | 🟡 | Fixed | §2.2 / §2.5 / §2.9 均记 32 行 / 1954，档内无 34 行、1955 残留 |
| 4 | 4 | 🟡 | Fixed | §2.4 #22 依据改为「现 `responses.mjs:205` = `sources: item.action?.sources ?? []`（`:207` 为 `}`）」；实读 `thincoder-core/provider/responses.mjs:205` 与 `:207` 逐字相符，③ 判定保留 |
| 5 | 5 | 🟡 | Fixed | §2.3 已补 closest-precedent 行与 survey-evidence 行；所引 `docs/README.md:15` / `:21-24` / `:26` 三处读数经实读相符 |
| 6 | 6 | 🟡 | Fixed | §2.5 集成面已以 `test/RTM.md` 起算并给出零行破 / 零行冗余 / 零行缺；该表按端分节、一行 = 一集成用例，CLI 端故事 1–19 实数相符 |
| 7 | 7 | 🟡 | Fixed | #8 改 `normalize.mjs:99-120`、#12 改 `errors.mjs:65-69`；实读两区间末行均为 `}`，与 §2.3「函数首行至末行」约定对齐 |
| 8 | 8 | 🔵 | Accepted | 就地落盘一条记为教训（§1.8 第 8 行「接受，记教训」），有理由、本批不改 ⇒ 关闭 |
| 9 | 9 | 🔵 | Fixed | AC-5 已记首行 `DOC-CHECK GATE: PASS`；§5 归 eng-coder，设计席在 §2.2 声明无实施内容 ⇒ 设计面已尽 |

新增两项（不放行拦）：
- 🟡 本批档 §2.9 ③ 仍写「35/35 与 0/0」，而 AC-1 与 §2.5 已作 36/36（含 §2.4.1 新增的 `google.mjs:96`）——同档两数不一。
- 🔵 本批档 §2.5「±0（32 行原位改写 + 1 行说法订正）」与 §2.9 同句：说法订正落 `:1945`（已在该 32 行内），读感成 33 行。

**计数**：🔴 0 · 🟡 2 · 🔵 1

VERDICT: pass

## §4 用户批准（主 agent）

### 4.1 用户批准（2026-10-28 01:47）

**用户逐字**：「都自动跑完」—— 整批令覆盖本批全链（FR36）。

**⇒ 本批批准面 = 42 处 `provider/*.mjs` 坐标收正 + 1 处说法订正（`:1945`）+ 3 处行数读数统一 494 + 复评 pass 结论。**

**⇒ 本批零产品码、零测试档、零其他设计档改动 —— 唯一变更面 = `docs/core/design/MODEL-SPECS.md`。**

## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）

### 6.1 父侧核验与收口（2026-10-28 02:0x）

### 6.2 父侧亲测读数（非引用设计席报告）

| 项 | 读数 |
|---|---|
| `core.mjs` 行数口径 | `split` = **495** 元素 · 换行符 = **494**（= `wc -l`，末行 `:495` 为空串）⇒ 档记 494 且注明口径，成立 |
| 三处行数读数 | `docs/core/design/MODEL-SPECS.md:513` · `:536` · `:1449` 均 **494**（各带取读日） |
| `:1945` 说法 | 现述「`google.mjs:96` 的 `thinkingConfig` **仅在 off 形发送**（`provider.thinking?.type === "disabled"` ⇒ `thinkingLevel: "none"`），**无分档 effort 通路**」—— 与 `thincoder-core/provider/google.mjs:96` 逐字同义 |
| 门 | `doc_check(mode:"gate")` 两档 ⇒ **PASS · 0 段** |

### 6.3 交付对照

| 条目 | 状态 | 读数 |
|---|---|---|
| 42 处 `provider/*.mjs` 坐标 | ✅ 完成 | 41 现态改写 + 1 订正（`:963` 的 `responses.mjs:207` → `responses-request.mjs:202`）+ 0 退场注记；32 个档内行原位改写、±0 行 |
| 1 处说法订正 | ✅ 完成 | `:1945` 由「`google.mjs` 无 `thinkingConfig`」（**假**）改为「仅在 off 形发送、无分档 effort 通路」（**真**，且信息量更大） |
| 3 处行数统一 | ✅ 完成 | 492 / 491 / 491 → **494**，余量 9 → 6 |

### 6.4 未覆盖面（如实）

1. **复评新提两条未修**（均不拦放行）：§2.9 ③ 记 35/35 与 AC-1 的 36/36 不一（本轮新增 `google.mjs:96` 所致）；§2.5「32 行 + 1 行」读感为 33（说法订正落 `:1945`，该行已在 32 内）。**⇒ 记在此，不在批内改** —— 前者是自校表的数，后者是措辞读感，都不影响设计档内容。
2. **`docs/core/design/MODEL-SPECS.md` 的 `specs.mjs` 坐标面仍有余漂**（`:305` 的 `:22-36` · `:358` 的 `:19-21` · `:1214` 的 `:27`）—— 属 `#1861` 批的射程，不在本批。
3. **本批零测试面**：坐标与说法订正不改任何业务可观察结果，集成面 0 增 / 0 改 / 0 删。

### 6.5 结算清单

- **§2 ↔ 设计档对账**：§2.4 的 42 行 + §2.4.1 的 1 行逐条对现文，一致。
- **前批遗留交叉核**：无（本批独立）。
- **修正轮落地前提**：一轮修正已落、复评 pass。
- **用户面同步**：无用户可见能力变化 ⇒ 一行「无」。
- **台账沉降**：`#1864`（`#1863` 已由本批关闭）。

### 6.6 §5 处置

**不适用** —— 本批唯一变更面是 `docs/core/design/MODEL-SPECS.md`，产品码 / 测试档 / 其他设计档零改动。改动由设计席在自己拥有的段内完成，无工程实施内容。
