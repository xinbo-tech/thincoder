# 2026-10-04 · OpenCode Go 预设接入（内置渠道）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-04 · 来源 = 用户 2026-10-04 12:16「好，那你把这个opencode go套餐支持先落地吧。」⇒ OpenCode Go 内置预设接入立批（承 #858 邻题侦察——key 制 ∥ 无 OAuth ∥ 头可选 ∥ 协议混装）。
> 台账 = #906（core · 归批）。前情 = 无（独立批——来源 = gitee #IKDWH7 邻题「支持 OpenCode Go 套餐」；侦察在册 = 台账 #858 证据）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-04
**开批登记（2026-10-04 12:1x · 主 agent）**：**来源** = 用户 12:16「好，那你把这个opencode go套餐支持先落地吧。」（承 #858 邻题侦察）。**条目** = **OpenCode Go 内置预设接入**：核预设表增一条（`PROVIDER_PRESETS`——核内单一预设面，各端自动消费）——baseURL `https://opencode.ai/zen/go/v1` ∥ key 制（**无 OAuth**——实读官方档在册）∥ **协议混装建模**（OpenAI 兼容侧 + Anthropic `/messages` 侧——现架构 = 单体 `format`，建模 = 设计轮核心问题）∥ 各端可见性核查。**授权口径** = 全链（设计 → 用户点火评审 → 批准 → 实施；每步停走）。**设计轮已派**（eng-designer——首轮）。**边界** = 无 OAuth ∥ 不发会话头（可选遥测，在册）∥ 不动其他预设 ∥ 无 key 不实拉（「待验」注沿 huawei/tokenhub 先例）∥ 需求档零触（主 agent 域）。

**设计交回核读（主 agent · 2026-10-04 12:3x）**：全过——条目表 ∥ 协议混装择案 A（否 B/C 判由）∥ 六消费点自动（零端侧改）∥ 受影响表 as-of+Δ ∥ G-1..G-6 ∥ KD-1..KD-8 ∥ U1–U6 逐条在档；设计档三处读回抽验（`PROVIDER.md:187-193` ∥ `:312-318` ∥ `:177`）✓。

**需求侧与 README 随动计划（主 agent 裁 · 落点申报）**：U1/U2 计数与名单收正（`requirements/PROJECT.md:30` C3 22⇒24 + 括注 ∥ `thincoder-cli/README.md:20-21` ∥ `thincoder-vscode/README.md:22` + `:75-99` 表）——**实施落定后随收口笔**（届时码盘 = 24；先落会造成需求档与实现相抵——沿前批同窗口先例）；U3 桌面注释 = 实施轮随落。U1 附裁：`requirements/PROVIDER.md:29` 句 = **历史条目（不动）**（2026-09-29 批记录面）。U4 = 另批候选（不排期）∥ U5 = 待验在册 ∥ U6 = 另批建议在册。

## §2 批次任务与设计（eng-designer）
**状态行**：✅ 设计完成 2026-10-04（初轮——落点 = PROVIDER.md §6.11 ∕ §6.19 ∕ 变更记录（589 ⇒ 598）；候用户点火全链下一步）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目（覆盖 ∥ 不复盖）

- **覆盖**（台账 #906）：**OpenCode Go 套餐接入（内置预设）**——核预设表 `PROVIDER_PRESETS` 增条目：key 制 ∥ 双协议混装建模 ∥ 各端可见性核查 ∥ 预设表文档落点。
- **需求侧锚点** = `docs/core/requirements/PROJECT.md` C3（预设权威单源——本批 = 其路径内增条目）；**需求档零触**（计数随动 = §2.8 U1，主 agent 笔）。本批无独立需求档（#906 `req_doc` = null——沿 huawei ∕ tokenhub 预设类先例：需求锚 = 既有 C3 契约 + 用户令）。
- **不复盖**：#858（`x-opencode-session` 头——维持「不做」，本批仅登记边界）；OAuth（#869 另线）；per-model format 核机制扩展（§2.6 KD-2 判「另批」）；MODEL-SPECS 补行（§2.8 U4）。

### 2.2 机制设计

**① 预设条目（两条——`thincoder-core/config-presets.mjs` 表尾追加）**

| 条目 | 字段（新行全文） |
|---|---|
| `opencode-go` | `baseURL: "https://opencode.ai/zen/go/v1"` ∥ `model: "glm-5.2"` ∥ `desc: "OpenCode Go subscription (sk- key from opencode.ai/zen; OpenAI-compatible models — MiniMax/Qwen via opencode-go-anthropic)"` |
| `opencode-go-anthropic` | `baseURL: "https://opencode.ai/zen/go/v1"` ∥ `model: "qwen3.7-max"` ∥ `format: "anthropic"` ∥ `maxTokens: 65536` ∥ `desc: "OpenCode Go — Anthropic Messages side (same sk- key as opencode-go; MiniMax/Qwen models)"` |

形状 = 现 schema 既有字段（零新字段）：OpenAI 侧 = 最小三字段（`huawei` / `tokenhub` 先例形）；anthropic 侧 = `claude` 先例形（`format` + `maxTokens`）。表尾追加（新条目进尾——`groq` 后），附注释块（口径 ∕ 待验 ∕ 会话头不发）。

**② 协议混装建模（本批核心问题）——择案 A（拆双预设）**

- **事实（官方档 `go.mdx` Endpoints 表快照——逐模型 ID ∕ 端点）**：OpenAI 兼容 `/chat/completions` 侧 10 名 = `grok-4.5` ∕ `glm-5.2` ∕ `glm-5.1` ∥ `kimi-k3` ∕ `kimi-k2.7-code` ∕ `kimi-k2.6` ∥ `deepseek-v4-pro` ∕ `deepseek-v4-flash` ∥ `mimo-v2.5` ∕ `mimo-v2.5-pro`；Anthropic `/messages` 侧 6 名 = `minimax-m3` ∕ `minimax-m2.7` ∕ `minimax-m2.5` ∥ `qwen3.7-max` ∕ `qwen3.7-plus` ∕ `qwen3.6-plus`（官方注：清单随测试演进——非合同）。baseURL 单值 `https://opencode.ai/zen/go/v1` 两侧同源。
- **鉴权（参考实现实读——两协议各自认头，与我方两 transport 现发形逐字吻合）**：`/chat/completions` 读 `authorization: Bearer`（= 我方 OpenAI 路径形）；`/messages` 读 `x-api-key`（= 我方 anthropic transport 形）⇒ **零头装配改**。
- **择案 A**：`opencode-go`（OpenAI 侧）+ `opencode-go-anthropic`（Anthropic 侧）双条目——单体 `format` 架构内零机制改、全目录（16 名）覆盖。
- **否案 B（per-model format 机制）**——评估：需 ① 新增 per-model 格式承载位（`models[]` 种子已按 MODEL-SELECTION v2 / D-PR11 整字段退场——方向相反）；② 核分派三改点（`chat()` ∕ `generate-title` ∕ `list-models` 各读 `provider.format`）；③ 三端字段拷贝白名单随动（CLI 三处拷贝点会**静默丢**未知字段）；④ 静态模型↔协议映射表（与「候选清单运行期拉取」方向相抵——官方清单会漂移）。量级 ≈ 独立机制批（核 + 三端 + 文档 + 测试）。**判「另批」**——如「单条目体验」被点名需求，另立设计（含动态元数据来源面）；**不建议并批**。
- **否案 C（v1 仅 OpenAI 侧 + Anthropic 侧另批）**——目录减半（6/16：MiniMax 三档 + Qwen 三档 = 套餐卖点模型族）；A 的边际成本 = 1 行表项 + 1 条 desc，C 的「另行」将再拉一轮全链 ⇒ 无保守收益。
- **已知项（如实登记 · 非阻断）**：网关 `/models` 面与协议无关（返回全量并集）⇒ 两渠道候选面均列 16 名——**跨协议误选**（如 anthropic 渠道选 `glm-5.2`）= 使用期失败（参考实现 = 按模型声明 `formatFilter` 过滤、拒形 `ModelFormatNotSupported` 类；无 key 未实测）。过滤需静态协议表（同 B 缺点）⇒ 本批不设，记录在案。
- **字段语义依据（实读——两 transport 的「不设」语义不同）**：OpenAI 路径 `max_tokens` ∕ `thinking` ∕ `reasoning_effort` 缺省 = **不发**（`thincoder-core/provider/core.mjs:187` ∕ `:196` ∕ `:200`）；anthropic transport `max_tokens` = `provider.maxTokens || spec.maxOutput || 8192`（**必发**——`thincoder-core/provider/anthropic.mjs:56`）⇒ anthropic 侧「不设」= 落规格行值 `131072`（超渠道口径）⇒ 显式设 `65536`（渠道口径 = 官方模型元数据 `output` 读数；`≤` 规格行 `131072` 满足 §6.11 不变式）。

**③ 各端可见性（逐端点名——新增条目三端自动出现，零端侧硬编码表）**

| 端 | 消费点（实读 file:line） | 结论 |
|---|---|---|
| 核流程族 | `thincoder-core/provider-flows.mjs:147`（`Object.entries(PROVIDER_PRESETS)` → QuickPick 项） | 自动 |
| CLI—/model 加渠道 | `thincoder-cli/src/tui/provider-admin.mjs:16`（import）∥ `:42`（迭代，过滤已添加）∥ `:75-81`（字段拷贝——含 `format` ∕ `maxTokens`） | 自动 |
| CLI—TUI 首跑向导 | `thincoder-cli/src/tui/wizard.mjs:9`（import）∥ `:28`（迭代）∥ `:34-35`（字段随行） | 自动 |
| CLI—TTY 首配向导 | `thincoder-cli/src/cli/setup-wizard.mjs:2`（import）∥ `:27`（迭代）∥ `:43`（预设整对象随行） | 自动 |
| VSC | `thincoder-vscode/src/extension/presets.mjs:21`（re-export 核表）∥ `settings.mjs:99`（设置面 presets 项）∥ `provider-flows.mjs:33`（薄壳 → 核流程） | 自动 |
| 桌面 | `thincoder-desktop/src/main/providers.mjs:27`（import）∥ `:57-64`（`presetChoices()`）∥ `:97`（`provider:list` `presets` 面）∥ `renderer/views/settings-controls.mjs:71/:102`（选项形 `name — desc (model)`）∥ `renderer/views/settings-sections-providers.mjs:183` ∥ `renderer/views/onboarding.mjs:36/:59`（首启向导） | 自动 |

→ 「预设表 = 核单源」契约成立：**零端侧硬编码清单、零端侧改动**。

**④ 探测与准入（两侧）**：探针按 `format` 分派（`thincoder-core/provider/list-models.mjs:103`）——OpenAI 侧 `GET {baseURL}/models` + Bearer；anthropic 侧 `GET {baseURL}/models?limit=1000` + `x-api-key`（`:65-79`）。参考实现 `/models` 面 = 无鉴权校验、OpenAI 形 `{data:[{id}]}`（两分支同取 `data[].id` ⇒ 均可解析）。**待验**（无 key——未实拉）。

**⑤ UI / 交互决策（全落地 · 无 open）**：三端呈现 = 现 picker 自动列出（零新 UI ∥ 零新状态）；desc 文案即向导（含「同 key」互指）；候选面 = 网关并集（已知项——§2.2-②）。

### 2.3 受影响文件（as-of 2026-10-04 + Δ）

| 文件 | as-of 行数 | Δ | 内容 | 笔 |
|---|---|---|---|---|
| `thincoder-core/config-presets.mjs` | 55 | +8~9（净） | 表尾两键 + 注释块（口径 ∕ 待验 ∕ 会话头） | 实施轮（eng-coder） |
| `thincoder-desktop/src/main/providers.mjs` | 340 | ±0（1 行内改） | `:83` 注释「22 条」⇒「24 条」（计数随动，零行为） | 实施轮（eng-coder） |
| `docs/batches/2026-10-04-opencode-go-preset.test.mjs` | 新档 | ≈+120 | 批内件（§2.4 用例表；沿 `docs/batches/2026-09-29-provider-config-family.test.mjs` 先例——仓库根 cwd、零实网） | 实施轮（eng-coder） |
| `docs/core/design/PROVIDER.md` | 589 | +9（实读 598） | §6.11 计数 + 新条 ∥ §6.19 名单 + 坐标收正 ∥ 变更记录 | **设计轮（本轮已落）** |

**上抛面（非本轮笔）**：§2.8 U1–U3（需求档 ∥ README ∥ 注释口径逐条点名）。

### 2.4 测试面（批内件用例设计——实施轮落；零实网 ∥ 配置缝隔离）

| # | 用例 | 断言（机检） |
|---|---|---|
| G-1 | 两键行形（OpenAI 侧） | `PRESETS["opencode-go"]` deepEqual 三键（baseURL ∕ model ∕ desc）；`presetToEntry("opencode-go")` = `{name, baseURL, model}`（desc 剥离、零 `format` 键） |
| G-2 | 两键行形（anthropic 侧） | `PRESETS["opencode-go-anthropic"]` deepEqual（含 `format:"anthropic"` ∕ `maxTokens:65536`）；`presetToEntry` 保两键 |
| G-3 | 护栏（漂移白名单只减不增） | 逐预设 `specMatch(model).matched === false` 集 ⊆ {hunyuan, siliconflow, groq}；两新默认 `glm-5.2` ∕ `qwen3.7-max` 命中既有规格行 |
| G-4 | 零改不变量 | 计数 = 24；旧键抽样 deepEqual（`claude` ∕ `minimax` ∕ `kimi-code` ∕ `tokenhub`）——零改 |
| G-5 | 字段面白名单（防端侧静默丢） | 两新键字段集 ⊆ {baseURL, model, desc, format, thinking, reasoningEffort, maxTokens, chatPath}（= 三端拷贝面交集——`provider-admin` ∕ `wizard` ∕ `setup-wizard` 实读） |
| G-6 | 行为（配置缝 ∥ stub fetch） | `addProviderEntry({preset})`（`_setConfigPathForTest` 隔离）⇒ `resolveProviders` 出条目形（anthropic 侧含 `format`）；`listModels` stub 两腿：openai 侧 → `GET /models` + `Authorization: Bearer`；anthropic 侧 → `GET /models?limit=1000` + `x-api-key` |

复跑 = 仓库根 `node --test docs/batches/2026-10-04-opencode-go-preset.test.mjs`（实施轮自跑；仓级套件 = 父侧收口跑，不在实施链）。

### 2.5 验收对照（批验收 ∥ 三向一致）

| 批验收（父侧派单） | 落点 |
|---|---|
| ① 批档 §2 齐备（条目 ∕ 机制（含协议混装择案）∕ 落点 ∕ 受影响表（as-of + Δ）∕ 用例 ∕ 验收 ∕ KD ∕ 边界 ∕ 上抛） | 本 §2 全节 |
| ② 设计档落点逐处读回 | §2.7（读回 = 2026-10-04 实读 `:187-193` ∥ `:312-318` ∥ `:597`） |
| ③ 各端可见性逐端点名 | §2.2-③（六消费点 file:line） |
| ④ `node scripts/doc-check.mjs` 复跑 exit 0 | 交付前复跑（读数 = 报告） |
| ⑤ 量级对账（改动清单 × 净增） | §2.3 + §2.7 量级账 |
| （实施轮）G-1..G-6 全绿 ∥ 零改不变量 ∥ 桌面注释随动 | §2.3 ∕ §2.4 |

**三向一致**：批档 §2 条目（§2.1）↔ 设计档回指（PROVIDER.md §6.11 新条 ∥ §6.19 名单）↔ 需求锚（PROJECT.md C3——随动 = U1）。本批无独立需求档（先例同族），链 = 台账 #906 ↔ §2 ↔ 设计档。

### 2.6 关键决策（KD——含被否）

- **KD-1 落点**：核预设表 = 唯一落点（各端自动消费，零端侧改）——沿 C3 契约。被否：端侧各加（三处硬编码 ⇒ 漂移）。
- **KD-2 协议混装 = 拆双预设（A）**：见 §2.2-②。被否：B（核机制扩展 + 静态映射表方向问题 ⇒ 另批）∥ C（目录减半无收益）。
- **KD-3 命名**：`opencode-go`（OpenAI 侧——对齐官方 provider id 形 `opencode-go/<model-id>`）+ `opencode-go-anthropic`（协议后缀，符 `format` 值域词；同厂商双键先例 = `glm`/`glm-code`、`mimo`/`mimoplan`）。被否：编号式 ∥ `-messages`（端点名混入）。
- **KD-4 默认模型**：`glm-5.2`（OpenAI 侧——官方用量表旗舰示例 ∕ 1M-128K 规格行在册 ∕ 规格面最丰）∥ `qwen3.7-max`（anthropic 侧——与 `qwen` 预设同值先例 ∕ 1M 规格行）。被否：`grok-4.5`（`thinking:false`——编码代理默认不宜）∥ `deepseek-v4-flash`（价廉非旗舰）∥ `kimi-k3`（在册但属他预设家族）。
- **KD-5 字段集 = 最小面**：`thinking` ∕ `reasoningEffort` 不设（= 不发，D-13 同口径）；`maxTokens` 仅 anthropic 侧 `65536`（§2.2-② 字段语义差——不设 ≠ 不发）；无 `chatPath`（transport 默认路径逐字吻合官方端点：`core.mjs:379` ∕ `/messages`）。
- **KD-6 会话头不发**：`x-opencode-session` = 可选遥测（#858 证据——缺省空串照走）；亦不动 `providers[].headers` 面。
- **KD-7 无 OAuth**：key 制 = 现 paste-key 流程，零新构件。
- **KD-8 不改 MODEL-SPECS 行集**：两默认模型命中既有行；16 名中 2 名无行（U4）不补（D-11 纪律）。

### 2.7 设计档落点与量级账

| 落点 | 内容 | 读回 |
|---|---|---|
| `docs/core/design/PROVIDER.md` §6.11（`:177` 计数 ∥ `:187-193` 新条） | 22 ⇒ 24 家 + OpenCode Go 机制条 | ✅（2026-10-04 实读） |
| 同档 §6.19（`:312-318`） | 24 preset 名单 + `format` 句 + `presetToEntry` 坐标 `:44` ⇒ `:49`（一致性面自修） | ✅ |
| 同档 变更记录（`:597`） | +1 行 | ✅ |

**量级账**：设计轮净增 = PROVIDER.md **589 ⇒ 598**（+9——新条 7 行 + 名单扩展 1 行 + 变更记录 1 行；坐标自修零净增）；实施轮预算 = `config-presets.mjs` +8~9（≤ 300 软线安全）＋ 批内件新档 ≈120 行 ＋ 桌面注释 ±0。

### 2.8 上抛与待验（逐条报）

- **U1（需求档 · 主 agent 笔）**：`docs/core/requirements/PROJECT.md:30` C3「当前全集 **22** 个」⇒ **24**（括注示例名单可补两新键）；`docs/core/requirements/PROVIDER.md:29`「（22 家——…）」句随动与否 —— 主 agent 裁。
- **U2（产品 README · 父侧裁笔）**：`thincoder-cli/README.md:20-21`「twenty-two providers」⇒ twenty-four（名单补两行）∥ `thincoder-vscode/README.md:22`「22 provider presets」⇒ 24 + 名单；`:75-99` Supported Providers 表 +2 行。先例 = 前批主 agent 笔；候裁（主 agent ∥ 实施轮）。
- **U3（桌面注释 · 实施轮随落）**：`thincoder-desktop/src/main/providers.mjs:83`「22 条」⇒「24 条」。
- **U4（规格面观察 ∕ 不排期）**：Go 16 名中 2 名无规格行（`glm-5.1` ∥ `minimax-m2.5`）⇒ 选中退 `DEFAULT_SPEC` + 一次性告警（既有面）。是否补行 = 另批候选（证据 = 官方模型元数据：`glm-5.1` 202752∕32768 ∥ `minimax-m2.5` 204800∕65536）；本批不动。
- **U5（待验清单——无 key 不可验；沿先例「待验」注）**：① `/models` 实拉可达性（参考实现 = 无鉴权裸可达）；② anthropic 侧端到端（`x-api-key` + `/messages` 实链）；③ 载荷语义（thinking ∕ effort 默认行为、跨协议误选实际拒形）；④ 额度 = 金额制（用户侧计费，非我方实现面）。**接入后按实拉复核**。
- **U6（另批建议）**：per-model format 机制（单条目体验）= 另批候选；不建议并批（见 KD-2）。
- **观察（非阻塞 · 已自修）**：`presetToEntry` 坐标 `:44` 陈旧（表体增长所致）——本批随 §6.19 收正为 `:49`（一致性面自修，零新语义）。

### 2.9 doc-check 复跑读数（设计轮交付前 · 2026-10-04）

- **锚闸 = OK（悬空 0）**——本批面零列报（新增文句零悬空锚）。
- **FAIL(行宽) 1 行 = `docs/cli/requirements/ACP-CLIENT.md:91`（421 字符）**——**他批在飞面**（台账 #862 · `docs/batches/2026-10-04-acp-face-completion.md`；需求档 = 主 agent 笔 ∥ 在飞批面）——**本批零触，不代修**（披露项：父侧裁处置归属）。
- 行数面 = 差异 8 条（**报告态，非闸**——声明面均属 desktop 文档族（manifest `checkConfig.lineCounts`），与本批零交集）。
- ⇒ **exit 1 成因 = 他批红；本批面零红**（锚 ∥ 行宽 ∥ 行数三面均与本批零挂账）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象**：批档 §2（含协议混装择案 A）· 设计档 `thincoder/docs/core/design/PROVIDER.md` §6.11 新条 ∥ §6.19 名单/坐标 · 需求锚 `thincoder/docs/core/requirements/PROJECT.md` C3（三档全文实读）。
**抽验（准则 8 行数 ∥ 坐标核验）**：`thincoder/thincoder-core/config-presets.mjs` = 55 行 ∥ 22 preset ∥ `presetToEntry` 实住 `:49` ∥ 表尾 `groq` 实住 `:44`（设计所引全部属实）；`thincoder/thincoder-desktop/src/main/providers.mjs` = 340 行 ∥ `:83`「22 条」注释在位；`PROVIDER.md` 现读数 598 属实；`provider/anthropic.mjs:56/:77/:95` ∥ `provider/core.mjs:187/:196/:200/:379` ∥ `provider-flows.mjs:147` ∥ `tui/provider-admin.mjs:42/:75-80` ∥ `tui/wizard.mjs:28/:34-35` ∥ `cli/setup-wizard.mjs:27/:43` ∥ `provider/list-models.mjs:59-79/:103` ∥ `config-io.mjs:223`（`addProviderEntry`）∥ 09-29 批测试 G-3 白名单先例 = {hunyuan, siliconflow, groq}——逐条属实；`maxTokens:65536 ≤ 规格行` 不变式可由 qwen 预设既有 131072 值行 + 空白名单反推成立。
**限制**：无项目标准档声明 ∥ 无文档地图——「文档归属」按 Project Guide 与档内分节结构核对（改动落在自家 §6.11 ∥ §6.19 节，未另立新档、无重复描述）——判据降级如实登记。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements / 文档态 | 🟡 | 计数跨档迟滞：`thincoder/docs/core/requirements/PROJECT.md:30` C3「当前全集 **22** 个」vs 设计面「（住 `thincoder-core/config-presets.mjs`，24 家）」（`thincoder/docs/core/design/PROVIDER.md:177`）∥「**24 preset**」（`thincoder/docs/core/design/PROVIDER.md:313`）。随动已登记为 U1（`thincoder/docs/batches/2026-10-04-opencode-go-preset.md:121`）且落点已裁（`thincoder/docs/batches/2026-10-04-opencode-go-preset.md:11`「先落会造成需求档与实现相抵」）——协调项，非缺陷；风险 = 窗口拖过收口。 | 收口检查单加一项：`requirements/PROJECT.md:30` C3 计数 22⇒24 + 括注示例名单，使需求 ∥ 设计 ∥ 实现同数（随实施落定窗口）。 |
| 2 | 验收 | 🟡 | 验收④「复跑 exit 0」（`thincoder/docs/batches/2026-10-04-opencode-go-preset.md:92`）与披露读数相抵：现读数 = exit 1，成因 = 他批在飞面的行宽红（`thincoder/docs/batches/2026-10-04-opencode-go-preset.md:132`「本批零触，不代修」）；`:134`「exit 1 成因 = 他批红；本批面零红」——④ 字面门槛不由本批面可达，处置留悬。 | 收口读数按面拆分记录（本批面零红 + 他批红归因），或将 ④ 字面收窄为「本批面零红」。 |
| 3 | Clarity / 坐标 | 🔵 | `thincoder/docs/core/design/PROVIDER.md:317` 收正 `presetToEntry` ⇒ `thincoder/thincoder-core/config-presets.mjs:49`——现值属实，但本批自身在表尾（`thincoder/thincoder-core/config-presets.mjs:44` `groq` 后，`thincoder/docs/batches/2026-10-04-opencode-go-preset.md:32`「新条目进尾——`groq` 后」）插 +8~9 行（`:65`）落在函数之前 ⇒ 落地后坐标再漂至 ≈`:57`–`:58`，「一致性面自修」在批内即失效。 | 实施落地后随收口再校一次该坐标（或按 as-of 口径注明），避免批内失效。 |
| 4 | 受影响表行数 | 🔵 | 抽验：`thincoder/thincoder-desktop/src/main/providers.mjs` = 340 行（超 300 建议线、低于 500 硬限），Δ ±0（`thincoder/docs/batches/2026-10-04-opencode-go-preset.md:66`）；目标注释「核预设表投影（22 条 · 序 = 核表声明序」（`thincoder/thincoder-desktop/src/main/providers.mjs:83`）在位。本批不改其行数 ⇒ 未触层级跨越，无需切分方案；属存量档位事实登记。 | 注释型 ±0 改无需动作；如该文件日后有实质增量，300 行建议线适用。 |
| 5 | 覆盖 / 已登记限制 | 🔵 | 「跨协议误选」（`thincoder/docs/batches/2026-10-04-opencode-go-preset.md:41`——网关 `/models` 返回并集 ⇒ 两预设候选面均列 16 名；错侧选型 = 使用期失败）已登记但本批不设过滤；现唯一用户面指引 = 预设 desc 互指句（`:30`）。 | 可在用户指引窗口（U2）补一句「两预设 = 同 key 两协议侧，模型按侧选」，把登记项转成用户可见提示。 |

**计数**：🔴 0 ∥ 🟡 2 ∥ 🔵 3。
**VERDICT: pass**（无 🔴——🟡 2 ∥ 🔵 3 均非阻断：＃1 ∥ ＃2 = 已登记/已裁的协调项；＃3–＃5 = 观察。）

## §4 用户批准（主 agent）

**2026-10-04 12:44 父侧代签批准**（用户 12:18「都自动跑吧」授权——全链自动）。

**三条件核验**：① 评审 pass（#21 · 🔴 0 · 🟡 2 + 🔵 3 全裁——裁定表逐条：🟡1 计数随动 = Deferred（已裁窗口：实施落定后随收口笔）∥ 🟡2 验收④读数 = Deferred（收口按面拆分记录：本批面零红 + 他批红归因）∥ 🔵3 坐标 = Deferred（实施落地后随收口重校）∥ 🔵4 = Not an issue（Δ±0 注释改，无层级跨越）∥ 🔵5 = Deferred（并入 U2 用户指引窗）；**修正面 = 无**——全部裁定落收口窗/收口笔，无需修正轮）；② 修正落地核验 = 无需修正轮（在册）；③ token 已签发（运行态，不入档）。

**批准范围** = 本批全量（两条目 + 注释块 ∥ 桌面注释随动 ∥ 批内件 G-1..G-6）。派发 = 实施舱（eng-coder · initial）。

## §5 实施记录（eng-coder）

**状态行**：✅ 实施完成 2026-10-04（eng-coder · initial 轮 · 收口前）

**交付摘要（件 → file:line ∥ 读数）**

- ① 核预设表两条目 + 注释块：`thincoder-core/config-presets.mjs:45-52`（表尾 `groq`:44 后、`presetToEntry` 前）。
  字段逐字 = 批档 §2.2-①：`"opencode-go"`（baseURL `https://opencode.ai/zen/go/v1` ∥ model `glm-5.2` ∥ desc 全文）
  ∥ `"opencode-go-anthropic"`（同 baseURL ∥ model `qwen3.7-max` ∥ `format: "anthropic"` ∥ `maxTokens: 65536` ∥ desc 全文）。
  注释块 `:45-50` 载三口径（thinking/reasoningEffort 不设=不发（D-13 同口径）∥ 待验（无 key——未实拉）∥ `x-opencode-session` 头不发）。
  行数 **55 ⇒ 63**（+8，≤64 界内）。
- ② 桌面注释随动：`thincoder-desktop/src/main/providers.mjs:83`「22 条」⇒「24 条」（单行内改 · Δ±0 · 零行为；全档 340 行不变）。
- ③ 批内件新档：`docs/batches/2026-10-04-opencode-go-preset.test.mjs`（175 行）= G-1..G-6 六例全落
  （行形 ∥ 护栏白名单 ⊆ {hunyuan, siliconflow, groq} ∥ 零改不变量 ∥ 字段面白名单 ∥ 配置缝条目形 ∥ stub fetch 两腿 + anthropic chat `max_tokens` 实发腿）。
- ④ 本段 §5——写入自证：经 `batch` 工具 append 落本段（段号由身份定）。

**读数（先红后绿 ∥ 验收逐条）**

- 先红（实施前）：`node --test docs/batches/2026-10-04-opencode-go-preset.test.mjs` ⇒ **5✖ / 1✔**（G-1 ∥ G-2 ∥ G-4 ∥ G-5 ∥ G-6 红——依赖新条目；G-3 护栏实施前即成立）。
- 后绿（实施后）：同命令 ⇒ **6✔ / 0✖**（pass 6 · fail 0）。
- `node --check`：`config-presets.mjs` ∥ `providers.mjs` 两产品档均无输出 = **exit 0**。
- `node scripts/doc-check.mjs`（仓根）复跑 = **exit 0**：`OK(锚)：0 条悬空` ∥ `OK(行宽)：无 >300 字符单行` ∥ 行数面差异 8 条（**报告态** · desktop 文档族声明面，与本批零交集）。
  设计轮在册行宽红（`docs/cli/requirements/ACP-CLIENT.md:91`）复跑已由他批在飞面消除——非本批笔。
- 仓套件：**not repo-suite verified——父侧收口轮为唯一仓套件跑**（批内件复跑 = 上列命令）。

**决策透明表（实施轮取舍）**

- D1 注释块 = +6 行（与两条目合计 +8，落批档 +8~9 界内）；三口径句全载，未增未减语义。
- D2 G-4 旧键面由批档 §2.4 的 4 键抽样扩为 **全量 22 条逐条 deepEqual**（派单口径「既有 22 条逐条」）——超集增强、非简化；件头已披露。
- D3 G-6 增列 anthropic chat `max_tokens` 实发腿（派单 ⑤ 口径）——超集；件头已披露。
- D4 批内件 175 行 > 批档估算 ≈120（成因 = D2/D3）——超估算非缺项；验收行数界仅两产品档，均达标。

**审计与代码评审轮次与终态**

- 发散审计（explore · 只读）**1 轮**：判 DEVIATIONS（PARTIAL×1 = §5 未落——随本段闭合 ∥ SILENT-SIMPLIFICATION 0 ∥ DOC-DRIFT 0 ∥ OUT-OF-LIST 0）；
  A 字段逐字 ∥ B 注释三口径 ∥ C G-1..G-6 逐条 = 属实；D 未发现越表（替代取证：mtime 面 4 档落笔）；E 动态复跑 = 审计舱无执行面，未独立复现（本舱读数在上）。
- 代码评审（advisor · code）**1 轮 · VERDICT: pass**：🔴 0 ∥ 🟡 3（无 must-fix）∥ 🔵 4。
  🟡 = ① 前批护栏件 `docs/batches/2026-09-29-provider-config-family.test.mjs:47` 冻结计数 22 随本批变红（护栏已随本批重立 = 新件 G-3；收口窗归因）
  ② 用户/需求面计数 22 未随（= 已登记 U1/U2 · §4 已裁收口窗）③ desktop 340 行存量档位（>300 建议线 · Δ±0 · 非本批引入）。
  🔵 = ① `PROVIDER.md:317` 坐标 `:49` ⇒ 实住 `:57`（收口重校窗 · §3-🔵3 已预判）② 记录面对账（≈+120⇒175 ∥ 抽样⇒全量 = 本段 D2/D4）
  ③ §5/§6 在飞态（本条即其闭合）④ 跨协议误选用户指引（在册）。
- 评审 host 引用核 1 条不可解（`presets.mjs:21` 缺全路径）——人工实读消解：`thincoder-vscode/src/extension/presets.mjs:21` = `export { PROVIDER_PRESETS as PRESETS } from "@thincoder/core/config.mjs"`（claim 属实）。
- **fix round = 0**（无 🔴 ∥ 无 must-fix ⇒ 零代码更正）；**终态 = clean**（审计 1 轮 + 代码评审 1 轮，全部发现均为报告面）。

**上抛（收口窗 · 非本段笔）**

- P1 `PROVIDER.md:317` 坐标校 `:57`（设计档面）。
- P2 U1/U2 计数随动（需求 C3 ∥ 两 README）+ 可选并入跨协议指引一句（advisor-🔵④）。
- P3 前批护栏件变红归因——收口窗二选一（更新 `PROVIDER.md:182` 指针 ∥ 该件头补 as-of 注）；他批件不代改。
- P4 零越表自证：本批文件写域 = 3 档（①②③）+ 批档 §5；`git status` 其余 32 M / 8 ?? 属在飞他批（acp-face ∥ session-carryover ∥ desktop 两批等，各持自档），非本批。

## §6 验证与收口（父代理）

**收口判词：已收口 2026-10-04**（OpenCode Go 预设接入——批链：设计 #15 → 评审 #21（pass · 0🔴/2🟡/3🔵 全裁）→ §4 代签（12:44）→ 实施 #25（审计无偏离 ∥ 代码评审 pass）→ 本节核销）

- **判据链**：批内件 G-1..G-6 **先红 5✖/1✔ → 后绿 6✔/0✖**（父侧收口复跑：仓根 `node --test docs/batches/2026-10-04-opencode-go-preset.test.mjs` = **exit 0 · tests 6**）∥ `node --check` 两档 exit 0 ∥ as-built：`config-presets.mjs` 55 ⇒ **63**（+8 ≤64 界内）∥ desktop `providers.mjs` 340 ±0 ∥ 预设表两条目 + 注释块逐字对设计（实读 `config-presets.mjs:45-52`）。
- **收口测试行**：本批单元件 = `docs/batches/2026-10-04-opencode-go-preset.test.mjs`（175 行 · 6 例 · 随批留存）；集成面 = 无新增 ∥ 无修订；仓套件 = 未跑（仓 `test/` 树空清单——批内件复跑为本批唯一运行）。
- **doc-check**：**exit 0**（父侧收口直跑：悬空 0 ∥ 行宽 0）。
- **收口笔（父侧 · 逐处可 revert）**：① `docs/core/design/PROVIDER.md:317` 坐标 `:49` ⇒ `:57`（as-built——设计评审 🔵3 预判项落定）；② 同档 `:182` 护栏指针 ⇒ 现形 = 本批 G-3（前身 as-of 注随件头）；③ `docs/core/requirements/PROJECT.md:30` C3 计数 **22 ⇒ 24**（+ 括注 + 批同步括弧）；④ `thincoder-cli/README.md` twenty-two ⇒ twenty-four + 名单 +「两协议侧同 key」句；⑤ `thincoder-vscode/README.md` 22 ⇒ 24 + 支持表 +2 行；⑥ `docs/batches/2026-09-29-provider-config-family.test.mjs` 头 as-of 注（22 冻结过时——预期红互指）。
- **在册（非阻断）**：① U4（`glm-5.1` ∥ `minimax-m2.5` 无规格行——另批候选）∥ U5（无 key 待验清单）∥ U6（per-model format 另批建议）；② 旧护栏件计数腿预期红（as-of 注随件）；③ 打包面：预设 = 核数据面，无 asar 影响。
- **前批遗留交叉核**：无（独立批）。
- **结算**：台账 #906 核销 ∥ 签入（双远端）。
