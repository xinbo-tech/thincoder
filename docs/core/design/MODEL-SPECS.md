# MODEL-SPECS 模型规格表 · 设计

> 层 = 设计层（`how`）。需求面（`what`）= `docs/batches/2026-09-20-qwen-flash-specs.md` §1
> （本板块暂无独立需求档 —— 见批次档 §2 上报项 R-8）。
> 权威源纪律：`enable_thinking` / `reasoning_echo` 的机制正文在
> `docs/core/design/PROVIDER.md`，本文只登记**规格表面**并引用它（`doc:section` 形式），不复述。

## 1. 方案与理由

四处变更，全在 qwen 族：

1. **新增 4 条独立行**：`qwen3.7-flash` / `qwen3.8-flash`（批次档 §1.2）+
   `qwen3.8-omni-flash` / `qwen3.8-27b`（§1.7(B)）。逐字段取服务端实测值，证据分档标注。
2. **删除 4 行**：`qwen3.8-max-preview` / `qwen-max` / `qwen-plus`（退役指令）+
   **泛前缀 `qwen` 托底行**（用户 2026-09-20 02:44 裁定「qwen 那行确定要删，不需要它托」）。
3. **omni 系模态登记：`multimodal` 维持布尔**（不扩字段），音频/视频**仅以行注承载**（§2.7）——
   布尔够用，扩 `modalities` 会造出零消费者的死字段（§2.7 证据）。
4. **VSC 端差表补全**：`EFFORT_DEFAULT_PREFIXES` 收录全部在册 qwen 档（AC-13）——
   新档**各自独立键、不用族前缀条目**（防族前缀互相遮蔽；现有表已按此形式，`thincoder-vscode/src/specs.mjs:22-36`）。

**理由（根因）**：缺陷不是「少了几行」，而是**泛前缀托底在静默掩盖缺行**——
`qwen3.7-flash` / `qwen3.8-flash` 蹭 `qwen` 行拿到 `thinking:false` + 无枚举，
且这一退化**既无告警也无从发现**（`specMatch` 对前缀命中一律 `matched:true`，
`thincoder-core/model-specs.mjs:172`）。父侧裁定删除托底行 = 把「继承来的能力」全部显式化；
代价是**一批名会静默退到 `DEFAULT_SPEC`（128K/32K/无视觉）**，所以本设计的重心
从「选一种继承策略」改为 **§2.4 的逐名处置表**：删行后**无任何一名在无人认账的情况下退化**。

**候选与理由**（父侧裁定取消泛前缀行，故本文只记已采纳方案，不铺候选清单）：

| 变更 | 已采纳方案 | 一句话理由 |
|---|---|---|
| qwen 托底 | 删 `qwen` 行，能力逐名显式声明 | 用户裁定；继承式托底是静默失实的源头（§2.3 普查 11 名靠它拿 1M 上下文与视觉） |
| 两 flash 档字段 | 实测优先 + 同族沿用项逐条标注 | 只有 `thinking` / 枚举 / maxOutput / 图像受理是实测；其余标「同族沿用」——诚实面 |
| 两新档 `thinking` | `true`（**实测级**） | 父侧 80-token 任务探针（批次档 §1.8-①）：裸请求 `reasoning_content` 在场、`reasoning_tokens`＝49；`effort:"none"` 即消失、`"medium"` 在场（57）；对照 `qwen3.8-flash`＝32 |
| 音频/视频表达 | `multimodal: true` 不变 + 行注写明模态 | 调用面只发图像（§2.7 实测），扩字段无消费者；行注承载零结构风险 |
| `qwen3.8-27b` context | `262_144` | 网络口径（原生 262 144；YaRN 外推属本地部署特性，DashScope 实供未证）⇒ 保守取，行注标网络口径 |

## 2. 接口契约

### 2.1 数据面：表变更清单

`MODEL_SPECS`（`thincoder-core/model-specs.mjs`，现 210 行）：

| 动作 | 行 | 现状坐标 |
|---|---|---|
| 新增 | `qwen3.7-flash` | 插入 `:65`（`qwen3.7-max`）之后——**长名在前**，防 `qwen3.7-*` 互相遮蔽 |
| 新增 | `qwen3.8-flash` | 插入 `:66`（`qwen3.8-max`）之后 |
| 新增 | `qwen3.8-omni-flash` | 同上区段（`:66` 后） |
| 新增 | `qwen3.8-27b` | 同上区段（`:66` 后） |
| 删除 | `qwen3.8-max-preview` | `:63` |
| 删除 | `qwen-max` | `:67` |
| 删除 | `qwen-plus` | `:68` |
| 删除 | `qwen`（泛前缀托底） | `:69` |
| 保留零改 | `qwen3.7-max` / `qwen3.8-max` | `:65` / `:66`（独立行，不靠托底） |
| 不加行（§2.4 表第 11 行） | `qwen3-coder-plus` 等 11 个借托底名（§2.3 表穷举） | 现靠 `qwen` 行拿能力；本批**接受退化并逐名认账**（§2.4），取值无实测 ⇒ 不补行 |

排序不变量：`SORTED_SPECS` 按前缀长度降序（`:130`）⇒ 表内插入位置不改变匹配优先级；
但**「删 `qwen` 行」改变一批名的命中结果**——这是 §2.4 的全部动机。
前缀遮蔽自查（新名之间无 `qwen3.8-flash` vs `qwen3.8-omni-flash` 类互覆：均非前缀关系），
唯一在册遮蔽 = `qwen3.8-max` 前缀盖住 `qwen3.8-max-preview`（实测：两者返回同一对象）。

### 2.2 字段口径表（四新行逐字段 + 证据等级）

四新档 `thinking` 均为 **`true`（实测级）**——但两组探针形态不同：两 flash 档＝`reasoning_tokens` 166/27 在场；
两新档＝`reasoning_content` 在场＋`reasoning_tokens` 49。逐行登记证据等级，不按族类推：

| 字段 | `qwen3.7-flash` | `qwen3.8-flash` | `qwen3.8-omni-flash` | `qwen3.8-27b` | 证据等级 |
|---|---|---|---|---|---|
| `thinking` | `true` | `true` | `true` | `true` | 两 flash 档：实测（§1.2-1 裸请求 `reasoning_tokens` 166/27 在场）；两新档：**实测**（父侧 80-token 探针，批次档 §1.8-①：裸请求 `reasoning_content` 在场、`reasoning_tokens`＝49；`effort:"none"` 消失；`"medium"` 在场 57；对照 `qwen3.8-flash`＝32） |
| `reasoningEffortEnum` | `["none","minimal","low","medium","high","xhigh"]`（6 档，**无 max**） | 7 档（+ `"max"`） | 7 档 | 7 档 | 实测（服务端 400 原文逐字枚举） |
| `maxOutput` | `131_072` | `131_072` | `131_072` | `131_072` | 实测（400 `Range of max_tokens should be [1, 131072]`） |
| `context` | `1_000_000` | `1_000_000` | `1_000_000` | **`262_144`** | **文档/网络口径**（非 API 实测；27b 取原生值，YaRN 外推属本地特性）⇒ 行注必标 |
| `multimodal` | `true` | `true` | `true` | `true` | 实测（§1.2-5 图像解码门证据；两新档同类尺寸校验文案）。音频/视频不入此位——行注承载（§2.7） |
| `modalities` | 不登记 | 不登记 | 不登记 | 不登记 | 裁定 = 维持布尔（§2.7）：音频/视频**只写行注**，不入结构化字段 |
| `partialMode` | `true` | `true` | `true` | `true` | **同族沿用，未独立实测**（两 flash 档实测过 `max_completion_tokens` 受理，27b/omni 未测）⇒ 行注标「沿用」 |
| `cacheMode` | `"none"` | `"none"` | `"none"` | `"none"` | 同族沿用（未实测；值 = 不发缓存参数，保守侧） |
| `thinkApi` | `"effort"` | `"effort"` | `"effort"` | `"effort"` | 同族 + 实测支撑（枚举 400 原文即该参数） |
| `reasoningEcho` | 不声明（= optional） | 不声明 | 不声明 | 不声明 | qwen 全族现状即不声明且可用 ⇒ 零变化。**关档路径**已实测无字段冲突（两新档 `"none"`，批次档 §1.8-①）；**跨轮回声**（历史携带 `reasoning_content` 再发）仍未实测 = R-4 在册，行注标 `unverified` |
| `tempRange` | `[0, 2]` | `[0, 2]` | `[0, 2]` | `[0, 2]` | 同族沿用（未独立实测） |
| `noUsageStream` / `prefixMode` / `thinkEnabledValue` | 不设 | 不设 | 不设 | 不设 | qwen 族均无此项 |

**入实现判据的只有「实测」行**（四档 `thinking` / 枚举 / `maxOutput` / 图像受理）；
「沿用」「文档口径」两类**必须逐条写进行注**（诚实面纪律），测试面只断言已登记值本身。

**探针证据（父侧实测 · 批次档 §1.8-①）**：两新档 `thinking` 的证据 = 父侧 DashScope 80-token 任务探针
（2026-09-20 03:3x）——裸请求 `reasoning_content` 在场、`reasoning_tokens`＝49；`effort:"none"` 时消失；
`"medium"` 在场（57）；对照组 `qwen3.8-flash`＝32。设计环境无密钥（仓内无 `config.json`、`process.env`
无 `DASHSCOPE|QWEN|BAILIAN|ALIYUN` 任一项），该探针由父侧执行。**思考字段实测的预算纪律**：探针必须用
≥80-token 任务型预算——`max_tokens:16` 类短预算会把思考截断、不落 usage，不可读作「字段不存在」
（v1 误判成因链归变更记录）。探针脚本 `thincoder-cli/test/smoke-qwen-thinking.mjs:24-30` 取 provider
名参数→ `providers[].model` 选路，全档无硬编码模型名字面量，扩档执行属父侧/用户操作（需密钥）。

### 2.3 泛前缀托底取消（连带面普查）

实测（`specMatch` 逐名跑，判据 = 返回对象与泛前缀行 `qwen`（`:69`）同一（`===`），即「仅靠托底行拿能力」）：

| 名 | 现借托底所得 | 删行后（无处置） |
|---|---|---|
| `qwen3.7-plus` | ctx 1M / maxOut 131 072 / mm true / partial / cacheMode none / think **false** | 128K / 32K / 无视觉 |
| `qwen3.6-plus` | 同上 | 同上 |
| `qwen3.6-flash` | 同上 | 同上 |
| `qwen3.5-plus` | 同上 | 同上 |
| `qwen3.5-flash` | 同上 | 同上 |
| `qwen-flash` | 同上 | 同上 |
| `qwen-turbo` | 同上 | 同上 |
| `qwen-vl-max` | 同上 | 同上 |
| `qwen-omni-turbo` | 同上 | 同上 |
| `qwen3-235b-a22b` | 同上 | 同上 |
| `qwen3-coder-plus` | 同上（该名的 `qwen3-coder` 门在 `thincoder-core/config.mjs:135`，**不读 spec**） | 同上 |

（`qwen-max` / `qwen-plus` 现命中各自独立行 ⇒ 不在借托底清单内；两行按退役指令一并删，退化在 §2.4 认账。）

**关键澄清（两件事不得混同，批次档 §1.6 末注）**：`thincoder-core/config.mjs:133-140` 的
`resolveEnableThinking` 判据 = **名称前缀 `startsWith("qwen")` + `isBailianHost`**，
**不读 `MODEL_SPECS`** ⇒ 删 `qwen` spec 行**完全不影响**它（实测两机制零耦合）。
`thincoder-core/provider/normalize.mjs:22` / `thincoder-vscode/src/extension/vision-channel.mjs:17` 等
**模态与视觉门确实读 spec**，删行的真实后果在这些面上。

### 2.4 逐名处置表（AC-14 · 判据 = 零静默退化）

两档处置：**① 补行**（实测或已核口径取值）/ **② 接受退化**（写明四项影响并逐名认账）；
表内第 14 项为 ① 的变体（**并入既有行**：不新建行，靠前缀遮蔽命中）。本批**只有上述两档 + 并入形态**——
所有发现均由设计面收账（未处置项另记 §7，不占用本表行、不设第三档处置）；本表 **15 行 = 18 具名 + 1 类未知名**（§2.3 普查 11 名 + 四新名 + 两退役名 + preview 名 = 18，逐名枚举见本表 `#` 列 1–14；评审发现 #6 所称「19」系把第 14 项行内引用的遮蔽目标 `qwen3.8-max` 误计为处置对象）。

> **需求口径对齐（评审发现 #5）**：批次档 §1.7(A) 的补行门槛 = 「实测**或官方口径**」（两项均可），而非仅实测；
> 但**口径是分字段的**——某名在文档里被点名，只够那一字段（先例 = D-8：`context` 入表但行注必须标「文档口径」）。
> 因此表 5–11 行的否决理由逐名写明：**哪些字段有官方口径、哪些字段零口径**；
> “能力四项无一项该名的**独立**证据”才是补行被否的根据（而非「需求只允许实测」）。

| # | 名 | 处置 | 取值依据 / 退化后果（context · maxOutput · 视觉 · 思考） |
|---|---|---|---|
| 1 | `qwen3.7-flash` | ① 补行 | §2.2 全列（实测） |
| 2 | `qwen3.8-flash` | ① 补行 | §2.2 全列（实测） |
| 3 | `qwen3.8-omni-flash` | ① 补行 | §2.2 全列（枚举/maxOutput/图像/`thinking` 均实测（§1.8-①）；context 网络口径） |
| 4 | `qwen3.8-27b` | ① 补行 | §2.2 全列（同上，context 262 144） |
| 5 | `qwen3.7-plus` | ② 接受退化 | **逐字段口径**（评审发现 #5）：官方口径只到 `context` 一项（文档将其列入「100 万长文档」族）；`reasoningEffortEnum` / `maxOutput` / `thinking` / 视觉 **四名均零口径**（无逐名实测、文档不列档位）⇒ 补行 = 拿 flash 族沿用值填整个能力门（与 §1.3「补 = 猜」同性质；先例参 D-8：文档口径**只到被点名的单字段**）。退化四项后果见下方「② 类的统一后果」共用行。**认账人** = 本批用户裁定（删托底行连带）；**解法** = 台账新待办逐名实测补行 |
| 6 | `qwen3.6-plus` | ② 接受退化 | **逐字段口径**：官方口径 = **仅渠道在册性**（token-plan `/models` 点名，§1.6）——连 `context` 都未逐名核 ⇒ **五项全零口径**；比 5 更弱。该名为**实际可被用户选中**，退化影响真实存在 |
| 7 | `qwen3.6-flash` | ② 接受退化 | 同 6（口径只到 token-plan `/models` 在册一项，能力四项与 context 均未逐名核） |
| 8 | `qwen3.5-plus` / `qwen3.5-flash` | ② 接受退化 | 两名在本批普查的三个口径面（服务端实测 / token-plan 清单 / DashScope 文档族）**均无逐名条目** ⇒ 全字段零口径（仅 6 的在册性亦无） |
| 9 | `qwen-flash` / `qwen-turbo` | ② 接受退化 | 老命名族：无实测、无清单点名 ⇒ 全字段零口径（此两名曾完全依赖托底行，退化幅度最大） |
| 10 | `qwen-vl-max` / `qwen-omni-turbo` / `qwen3-235b-a22b` | ② 接受退化 | **视觉退化最重**：「按命名即视觉/全模态档」属**命名推断**（既非实测也非官方逐名口径 ⇒ 不够补行门槛）；退化为 `multimodal` 未声明 ⇒ `read_image` 摘除。认账同 5 |
| 11 | `qwen3-coder-plus` | ② 接受退化 | §1.6 渠道清单未见该名 ⇒ 全字段零口径；`thincoder-core/config.mjs:135` 的 `qwen3-coder` 排除门独立存在，**不受影响** |
| 12 | `qwen-max` | ② 接受退化 | 服务端实测 **DashScope 200 活着**（§1.6）⇒ 与「退役」指令字面矛盾。按裁定删行，退化同 5。**差异上报 = 批次档 §2 R-1** |
| 13 | `qwen-plus` | ② 接受退化 | 同 12 |
| 14 | `qwen3.8-max-preview` | ①→并入既有行 | 删独立行；查表经 `qwen3.8-max` 前缀**遮蔽命中该行**（实测同对象）⇒ **不退化**，且避开该 preview 名实测的 token-plan **静默映射**陷阱（§1.6） |
| 15 | 任意 `qwen*` 未知名（未来新档） | ② 接受退化 | 退 `DEFAULT_SPEC` + **`warnUnknownModel` 一次性告警**（`:154-160` 现成，无需新码）⇒ 静默性由该告警消解 |

**② 类的统一后果（四项 · 必须写进 `docs/core/design/PROVIDER.md` 的那段，§2.6-4）**：
上下文 1M→128K（压缩阈值提前，长会话被截）· 输出 131 072→32 000（大改动单轮输出被截）·
视觉能力消失（`read_image` 工具摘除 + 贴图降级为文本）·
思考与 effort 枚举缺失。
`DEFAULT_SPEC`（`:118`）= `{ context: 128_000, maxOutput: 32_000, cacheMode: "none" }`——
`thinking` / `reasoningEffortEnum` / `partialMode` 全缺 ⇒ 思考下拉空、autoThink 直接 `return null`
（`thincoder-core/auto-think.mjs:67-68`）、consult effort 不钳制（`thincoder-core/agent/spawn-child.mjs:188-195`）、
截断续写从 Partial Mode 退到普通续写（`thincoder-core/provider/core.mjs:253`）、
视觉门判据转假（八个消费点坐标见 §2.7 第 1 项）。

**判据达成方式**：AC-14 的「无任何一名静默退化」= 本表 15 行（18 具名 + 1 类未知名）穷举 + 上方四项后果共用行 +
测试面 T-4 断言「托底名退化形状已知」（不退化成「无人认账的意外」）。

### 2.5 消费面契约（本批动谁、谁零改）

`thinking` / `reasoningEffortEnum` / `multimodal` / `partialMode` 的**真实消费点**（全仓普查，逐条 `file:line`）：

| 消费点 | 读什么 | 本批影响 |
|---|---|---|
| `thincoder-vscode/src/extension/provider-probe-window.mjs:65-66` | `reasoningEffortEnum \|\| (spec.thinking ? ["enabled"] : [])` | **本文件零改**：两 flash 档下拉从空变 6/7 档（数据面修复自动生效） |
| `thincoder-vscode/src/extension/settings.mjs:213` | 仅 `reasoningEffortEnum` | 设置面板 effort 枚举补齐（含两新档） |
| `thincoder-core/auto-think.mjs:67-68` | 仅 `reasoningEffortEnum`（无枚举 ⇒ return null） | **autoThink 对两 flash 档从静默失效变生效** |
| `thincoder-core/agent/spawn-child.mjs:188-195` | 仅 `reasoningEffortEnum` | consult/subagent effort 钳制生效（越界值由「放行」转「丢弃」） |
| `thincoder-core/provider/core.mjs:197-203` | 仅 `reasoningEffortEnum`（越界即抛） | 消除一条**现网正在发生**的抛错路径：今日 `qwen3.7-flash` / `qwen3.8-flash` 无枚举 ⇒ `:198` 判据短路、`/think effort high` 直通服务端吃 400；本批补枚举后该值在枚举内 ⇒ 该路径就地消解。**对照**：`qwen3.8-max` 枚举 `xhigh/medium/low`（`:74`）本批零改，其 `/think effort high` 抛错**批前批后均在** ⇒ 不属本批效果（另见 §7）|
| `thincoder-core/config.mjs:133-140` | 名称前缀 + Bailian 主机（**不读 spec**） | **零改零影响**（§2.3 澄清；两新档前缀 `qwen` 自动覆盖） |
| `thincoder-core/model-specs.mjs:118` · `thincoder-core/model-specs.mjs:198` | `cacheMode`（只登记不消费：`DEFAULT_SPEC` 兜底取值 + `providerSpec` 展开复制） | 本批 `cacheMode` 取值**对运行行为零影响**（§4 D-10）|
| `thincoder-cli/src/tui/cmd-think.mjs:13-16` · `thincoder-cli/src/tui/cmd-think.mjs:131` | `thinkApi` / `thinkEnabledValue` / `reasoningEffortEnum`（`:131`＝`/think on` 默认档取值点） | `:131` 已落（§2.8-1）；`:104` 入口归一 `"none"` ⇒ off 标记（§2.8-2 · A-18，已落）；`:13-16` 读取面零改 |
| `thincoder-vscode/webview/model-picker.js:85` · `:123` | 条目 `reasoning` 枚举 + `effortDefault`（两处归一 = `selectModel` / `handleModelsMessage`） | **本批回归修复 · 披露面**（§2.8-3 · A-17）：取值式 `effortDefault \|\| levels[0]`——不读它则「档 ∉ 枚举」归一落首项 `"none"` |
| `thincoder-cli/src/tui/cmd-advisor.mjs:225-255` | `reasoningEffortEnum`（`:235` 档位表 · `:247-253` `← current` 标记） | **出批零改**（listing-only）：会诊池 effort 菜单档位随枚举显真相（含 `"none"`）；无写槽、无载荷面 |
| `thincoder-cli/src/tui/slash-commands.mjs:150-157` | `reasoningEffortEnum`（`:154` 补全候选） | **出批零改**（listing-only）：`/think effort <Tab>` 候选随枚举显真相 |
| `thincoder-cli/src/tui/cmd-config.mjs:172-184` | `reasoningEffortEnum`（`:180` `["none", ...enumList]` · `:205` 过滤 `!== "none"`） | **出批零改**：枚举含 `"none"` 的档 picker 出双 `none` 行 = **既有形态**（`glm-5` / `glm-5.2` 在册）⇒ 收账于台账（父侧面） |
| `thincoder-core/provider/core.mjs:253` | `partialMode` | 四新行沿用 true ⇒ 与今日蹭 `qwen` 行同值，零变化 |
| 八个消费点：核 `thincoder-core/tools/index.mjs:64` · `thincoder-core/tools/file.mjs:159` · `thincoder-core/agent/record-results.mjs:51` · `thincoder-core/agent/setup-reminders.mjs:251` · `thincoder-core/provider/normalize.mjs:22` · VSC `thincoder-vscode/src/extension/vision-channel.mjs:17` · `thincoder-vscode/src/agent/setup-tooltable.mjs:305` · `thincoder-vscode/src/extension/image-handler.mjs:110` | `multimodal`（共 8 处，逐处语义见 §2.7 第 1 项） | **八个消费点全部零改**；四新行置 true ⇒ 两 flash 档由「蹭来」变「声明」，布尔语义无失真（实测见 §2.7） |

**关键事实（修正批次档 §1.1 的后果评估）**：核/CLI 路径上**没有任何一处读 `spec.thinking`**
（全仓 `spec.thinking` 仅 1 处消费 = 上面 VSC 那行（`thincoder-vscode/src/extension/provider-probe-window.mjs:66`）+ 1 处测试断言）。
⇒ 本批危害面 = **VSC 下拉显隐 + effort 枚举缺失 + autoThink 静默失效**，
**不是**「请求体发错字段」——请求体的思考开关由 `thincoder-core/config.mjs:133` 名称白名单兜住
（`doc:PROVIDER.md:§12`）。

### 2.6 `enable_thinking` 的契约归属（开放项 3 裁定）

> 需求指针：批次档 §1.4 开放项 2（三选一收口形态）**已被用户 02:44 裁定替代**（删 `qwen` 托底行 = §4 D-1 /
> §2.3–§2.4）——该段属需求原文保持（§1 不回收），本档不复述三选一，只记已裁定事实。

**裁定：不新增 `thinkToggleApi` 字段；`reasoningEffortEnum` 含 `"none"` 是「可关」的唯一枚举表达。**

1. `enable_thinking` 已是**名称 + 主机驱动**的白名单（`thincoder-core/config.mjs:133-140`），与 spec 无耦合，
   qwen 全族（含四新档）自动覆盖；新增 spec 字段 = 同一语义两处真源（违 D2 单权威源）。
2. 两条关闭路径职责不同，**不是二义**：`reasoning_effort:"none"` = 服务端参数（枚举内合法值，
   §1.2-7 实测）；`enable_thinking:false` = 面板/`/think off` 的显式 off 标记
   （`provider.thinking === null`）所触发。**但两侧不得互补**：`thincoder-core/config.mjs:137-138` 判据顺序 =
   `thinking === null` 先判、`reasoningEffort`（truthy）次判 ⇒「标记缺失 + effort = `"none"`」= `true` + `"none"`
   同携（矛盾载荷，面板显示 `Thinking: ON` 与实际关思考分叉）；本批在生产端消除该组合（§2.8-2 · A-18），
   `resolveEnableThinking` 本体零改（§7 边界）。
3. VSC off 链路已验证可达：`thincoder-vscode/webview/model-picker.js:64` → `thincoder-vscode/src/extension/reasoning-mode.mjs:22-24`
   （`{thinking:null, reasoningEffort:null}`）→ `thincoder-core/provider/core.mjs:209` → `enable_thinking:false`。
   qwen 新行不带 `"enabled"` 下拉项（枚举无该值），off 走 `"none"` 一档，AC-7 语义满足。
4. 该「两机制并存」事实须写进 `docs/core/design/PROVIDER.md`（§3 影响文件表末行）——本批的文档义务在此。

### 2.7 omni 系模态：`multimodal` 维持布尔（结构变更裁定 · 含否决理由）

**裁定：不扩 `modalities` 字段**；音频/视频以**行注承载**，不入结构化字段。

1. **布尔语义无失真（实测）**：`multimodal` 全部 8 个消费点的判据都是**图像**（坐标一律自仓根完整路径，评审发现 #2；读数 as-of 2026-09-22 评审轮实读更正）：
   核 `thincoder-core/tools/index.mjs:64`（`read_image` 注册门）· `thincoder-core/tools/file.mjs:159`（读图门）·
   `thincoder-core/agent/record-results.mjs:51` 与 `thincoder-core/agent/setup-reminders.mjs:251`（多模态注入门）·
   `thincoder-core/provider/normalize.mjs:22`（`type:"image_url"` part 剥除门）；
   VSC `thincoder-vscode/src/extension/vision-channel.mjs:17` · `thincoder-vscode/src/agent/setup-tooltable.mjs:305` ·
   `thincoder-vscode/src/extension/image-handler.mjs:110`（三处贴图门）
   ⇒ 「支持图像输入」这一语义对 omni 档**恰好为真**，不存在「装不下四模态」的实际破损。
2. **扩字段必造死字段**：全仓**无任何音频发送路径**（实测：无 `input_audio`、
   无 `type:"audio"` 字面量；`RASTER_IMAGE_URL = /^data:image\/(png|jpe?g|gif|webp);base64,/`
   本就排除 `data:audio/`，`thincoder-core/provider/normalize.mjs:11`）⇒ `modalities` 写进来后
   **零个消费点**，只剩「登记了但没人读」的第二真源风险（违 D2 单权威源）。
   （注：`thincoder-core/tools/file.mjs:138` 与 `thincoder-vscode/src/agent/execute-tools.mjs:271` 的同名 `multimodal` 是**工具属性**（返回值带图），与模型 spec 无关，不入此计数。）
3. **本环境不接音频输入**：ACP 侧 `promptCapabilities` 全 `false`
   （`thincoder-cli/src/acp/client-caps.mjs:59`）⇒ 用户无法向本工具投喂音频，
   声明服务端音频能力对产品行为无意义。
4. **「逐名显式声明」的承诺不失**：该承诺针对**能力门**（thinking / 枚举 / 视觉 / 上下文），
   音频不属本仓任何能力门 ⇒ 写入行注即可（omni 行注：「服务端另受理音频输入
   （§1.7(B) 实测进到 URL 解析）；本仓调用面只发图像，音频不入」）。
5. **未来若要接音频**：按「消费点先存在、字段后登记」补结构化模态，属新批次新需求。

### 2.8 枚举首项陷阱三面（CLI `/think on` · CLI `/think effort none` · VSC picker 归一——本批必修 + 回归修复）

**面 1（原文面 · 批次档 §1.8-② 裁定）**：`thincoder-cli/src/tui/cmd-think.mjs:131`：`/think on`（effort 型）`delete cur.thinking` 后，若 `reasoningEffort` 为空
取 `spec.reasoningEffortEnum?.[0] ?? "high"`。本批四新档枚举首项是 **`"none"`** ⇒ 「开思考」
实际把思考关掉（服务端实测 §1.2-7 证 `"none"` = 关）。父侧读码确认：这是**本批补枚举制造的回归**
（今日无枚举走 `?? "high"` 正常）——「已知命令变坏」不得以台账待办名义出厂 ⇒ 升格本批必修、纳入交付面。

- **修法（父侧裁定）**：on 默认档取**首个非 `"none"` 档**——实现形态
  `spec.reasoningEffortEnum?.find((v) => v !== "none") ?? "high"`；四新档 ⇒ `"minimal"`。
  无枚举模型的 `?? "high"` 回退语义**零改动**保持。
- **退化形态处置（设计裁定，§4 D-9）**：枚举在场但**全部成员为 `"none"`** ⇒ 同落 `"high"`（与无枚举同型），
  不抛错、不留空。本批四新档均有非 `none` 成员，该形态仅防御面。
- **测试落点**：`applyThink` 改具名导出（行为零变化，供注入合成 spec）；新增
  `thincoder-cli/test/cmd-think.test.mjs`（批内新增，已落；ctx 直驱形态同 `thincoder-cli/test/cmd-eng.test.mjs`；
  runner 自动收集 `test/*.test.mjs`，`thincoder-cli/test/run.mjs:3`）。判据 = §5 A-16 · 用例 T-14；`"none"` 面的判据 / 用例 = §5 A-18 / T-16。
- **枚举形状锚（保留）**：T-12 继续钉「登记顺序 = 服务端原文、首项 `"none"`」（D-5 证据登记忠实性）。
- **补枚举的另一面效果**：`/think effort high` 从「必然枚举校验抛错」转为正常工作（修复）；
  现 `qwen` 行无枚举 ⇒ 今日回退 `["high","max"]`、`thincoder-core/provider/core.mjs:198` 抛错门不生效——
  均为删除/补行后的既成事实，不再有「下批」条件遗留。
- **面 2（修正轮新增 · 裁定②）：CLI `/think effort none` ⇒ 关思考**。判据：`e.action === "effort"` ∧ `e.level === "none"`
  ⇒ 终态必须落**显式 off 标记**（`cur.thinking = null`）；终态若为「档位 `"none"` + 标记缺失」则
  `resolveEnableThinking`（`thincoder-core/config.mjs:137-138`：`thinking === null` 先判、`reasoningEffort` truthy 次判）
  返 `true` ⇒ 载荷 `enable_thinking:true` + `reasoning_effort:"none"` **同携**（矛盾载荷），面板 `:48-49` 亦显 `Thinking: ON`。
  该档位批前不可达（批前在册 qwen 枚举无 `"none"` 成员），随四新档入册进入可达面。修点在**生产端**（`:104`）：
  `"none"` 落 off 标记，`resolveEnableThinking` 本体零改（§7 边界）。effort 值写法（保留 `"none"` / 清除）
  由实施轮定，两形态均落 off（qwen 侧由 `thinking === null` 主导 `enable_thinking:false`；effort 族侧由 §9.6 D-14
  判据补发 `reasoning_effort:"none"`）⇒ 判据不区分两形态（§5 A-18 · 用例 T-16 + T-9 第四态）。
- **回执面第三处落位（同裁定② · 实施侧第三处改动）**：循环回执公式 `thincoder-cli/src/tui/cmd-think.mjs:86-87` 补 `cur.thinking !== null` 守卫
  ——缺守卫时 effort 型 off 后回执误报 `Thinking: ON`（与菜单头 `:48-49` 同式单一口径）；出处 = 批次档 §5.4 裁定② 行（`docs/batches/2026-09-20-qwen-flash-specs.md:435` · `:445`）。
  测试射程 = 本批**零**（`thincoder-cli/test/cmd-think.test.mjs` 仅直驱 `applyThink`，无 `handleThinkCommand` 驱动用例）⇒ 补驱动用例 = 父侧裁定**出批登台账**，不并入本批交付面。
- **面 3（修正轮新增 · 裁定①）：VSC picker 归一 = `effortDefault` 优先**。`thincoder-vscode/webview/model-picker.js`
  两处归一（`:85` `selectModel` · `:123` `handleModelsMessage`）取值式 = `m.effortDefault || levels[0]`——
  **不读 `effortDefault` 时**，四新档枚举首项 `"none"` 会把「当前档 ∉ 新枚举」的归一落到关思考（静默 off）；
  同式 = `thincoder-vscode/webview/settings-state.js:48`（AC-13 逐档登记链所依赖），`effortDefault` 来源 =
  `thincoder-vscode/src/extension/provider-probe-window.mjs:67`。已随实施轮落盘（§3 披露面行）；用例面 T-17
  = `thincoder-vscode/test/model-picker-fallback.test.mjs` 扩用例（负控 = 无 `effortDefault` 的条目仍落 `levels[0]`）。
- **`settings-state.js:48` 兑底链本体零改**（§7 边界）：`effortDefault || levels[0] || null` 形式与面 3 取值式同源
  ⇒ 触发路径由 AC-13 逐档登记消除；A-13 不是体验项，而是防默认值退化的护栏（VSC 端壳 extension 面零改）。

## 3. 影响文件清单

| 文件 | 现行数 | 预期增删 | 内容 |
|---|---|---|---|
| `thincoder-core/model-specs.mjs` | 253 | 已落（计划 +18 / −4） | 4 新行（每行配 2–3 行证据行注）+ 4 行删除（preview / qwen-max / qwen-plus / 泛前缀 `qwen`）——无新字段、无新导出 |
| `thincoder-vscode/src/specs.mjs` | 84 | 已落（计划 +5） | `EFFORT_DEFAULT_PREFIXES`（表体 `:22-36`，匹配器 `:38-52`）**补 5 档**（各自独立键、不用族前缀，§1 第 4 项 / A-13）——AC-13。【现行数 84 = 2026-09-20 修正轮实读（split 口径，见本节末口径注）；本批补 5 档落位前该档为 78（本批前 61，经并行「显示面消差批」）】 |
| `thincoder-vscode/test/image-downgrade.test.mjs` | 253 | 已落（计划 +12） | VSC 端差表（`thincoder-vscode/src/specs.mjs`）的用例档就在此文件（T36 / W16 / T38 三段），但原仅测 deepseek / glm / kimi 族，qwen 档的 `EFFORT_DEFAULT_PREFIXES` 展开不在射程（补行盲区）⇒ A-13 的测试落点 = 本文件新增用例（T-15），现已落 |
| `thincoder-core/test/model-specs.test.mjs` | 395 | 已落（计划 +80 / −2） | 新用例族：四档逐字段、两 flash 档枚举不等、托底删除后果（T-3/T-4）、退役名遮蔽与退化（T-5/T-6）、既有族零回归；**`:29` 一行删除**（`cacheMode` 断言移出用例面，§4 D-10 / T-13）|
| `thincoder-core/test/provider-merge.test.mjs` | 307 | 已落（计划 +~4 / −0；渠道接入批微收尾轮 #12 补落） | `enable_thinking` 三态对两新档（已落，A-7）；T-9 第四态已落（`:216-218`，同携态 ⇒ `false`，裁定② · A-18）；现行数含并行渠道批 B-1…B-6 增量 |
| `thincoder-cli/src/tui/cmd-think.mjs` | 152 | 已落（修复轮实读 152） | `:131` on 默认档 = 首个非 `"none"` 档（§2.8-1 · 批次档 §1.8-②，已落）；`:104` effort 分支 `"none"` ⇒ 显式 off 标记（§2.8-2 · A-18，已落）；`applyThink` 具名导出（已落）；`:86-87` 循环回执守卫（裁定② 第三处 · §2.8 面 2 末条，已落）|
| `thincoder-cli/test/cmd-think.test.mjs` | 154（批内新增） | 已落（修复轮实读 154） | T-14 已落（四新档 `"minimal"` / 退化形 `["none"]` ⇒ `"high"` / 无枚举 ⇒ `"high"`；形态同 `thincoder-cli/test/cmd-eng.test.mjs`）；**T-16 已落**（实现侧标签 =「修复轮 #11」×3 段，映射注见 §6）|
| `docs/core/design/PROVIDER.md` | 445 | 已由设计轮落笔（+15 / −2） | 登记三件事：`enable_thinking` 与 effort 两机制并存 · 泛前缀托底行取消后的退化后果 · qwen 族模态与音频未接入（§7「不扩 `modalities` 结构化字段」条）——**该档属设计轮笔（D1），不在 eng-coder 实施面** |
| `thincoder-vscode/webview/model-picker.js` | 149 | 已落（+4 / −1） | **本批回归修复 · 披露面**（§2.8-3 · A-17 · 裁定①）：两处归一改 `effortDefault` 优先（`:85` / `:123`，同式 `thincoder-vscode/webview/settings-state.js:48`）——补枚举使 `levels[0]` 对四新档落 `"none"` |
| `thincoder-vscode/test/model-picker-fallback.test.mjs` | 221 | 已落（修复轮实读 221） | **本批回归修复 · 测试面**：T-17 已落（实现侧标签 =「③」×2 用例，映射注见 §6）；既有 ② 用例标题/注释按新语义收正（fixture 无该档 ⇒ 断言值不变）|

**行数上限（2026-09-20 修复轮后复读 · split 口径）**：本表产品码/测试档读数 = 253 / 84 / 253 / 395 / 304 / 152 / 154 / 149 / 221（行序同上；两项 VSC 行 = 修正轮新增行）⇒ 本表 = 档内**当前行数的权威面**（§2.1「现 210 行」等 = 落位前 as-of 读数，按变更记录 2026-09-20 修复轮条⑤不追改）。
本批**自身**增删零越线；**两档现越 300 软线**（`thincoder-core/test/model-specs.test.mjs` 395 · `thincoder-core/test/provider-merge.test.mjs` 304）——增量均来自并行「渠道接入批」在途落盘（`[onboard]` / `B-1…B-6` 段），**拆分义务归该批**；硬限 500 未越。
两档的软线登记已由该批落笔：`SOFT_LINE_REGISTRY` 表体见 `thincoder-core/test/core-hygiene.test.mjs:55`（注释 `:38-44`）⇒ 2026-09-20 修复轮实跑该用例**绿**（`pass 5 · fail 0`，工作区在途读数）；`docs/core/design/PROVIDER.md` 445 是文档，不受此类线限。
越线两档的**拆分计划**收口落点 = 渠道接入批设计面（`CORE-UNIFICATION.md` §2.8.1 子表行 12 / 13——不拆档——单档内聚 + 消解窗口；其节 §9.7 同指）；本修正轮对两档自身零加行；`thincoder-vscode/test/model-picker-fallback.test.mjs`（复读 221）仍 < 300。

**收口注（2026-09-20 · 渠道接入批收口轮）**：两越线测试档收口复读 = `test/model-specs.test.mjs` **415** · `test/provider-merge.test.mjs` **307**（`split` 口径）；本档「行数上限」段读数（395 / 304）= 修复轮 as-of（不追改）；两档拆分义务收口 = `CORE-UNIFICATION.md` §2.8.1 子表行 12 / 13。
`thincoder-core/auto-think.mjs` / `thincoder-core/agent/spawn-child.mjs` / `thincoder-core/config.mjs` /
`thincoder-core/tools/index.mjs` /
`thincoder-core/provider/normalize.mjs` / `thincoder-vscode/src/extension/provider-probe-window.mjs` **零改动**（消费方，§2.5 / §2.7）。

**交付面已对齐（评审发现 #1 · 修正轮更新）**：本表 **10 行** = 九条产品码/测试文件 + `docs/core/design/PROVIDER.md`（设计轮笔，D1）；
修正轮 +2 行 = `thincoder-vscode/webview/model-picker.js` + `thincoder-vscode/test/model-picker-fallback.test.mjs`
（**本批回归修复 · 披露面**，§2.8-3 / A-17 / 裁定①，两档均已落盘）。
**九条产品码/测试文件的落位实况（收口复读 2026-09-20）**：九条**全部落盘**（逐行状态见本表「预期增删」列）；原「唯一未落项 = `provider-merge.test.mjs` 的 T-9 第四态」已由 qwen 批 §5.6 微收尾轮 #12 补落（`thincoder-core/test/provider-merge.test.mjs:216-218`）；该档收口实读 **307**（`split` 口径 · `wc -l` 306）。
批次档 §1.5 交付面**列八项**（第八项 = `docs/core/design/PROVIDER.md` 登记面）；§4 批准范围行明记**实施面 = 七条**（不含 `PROVIDER.md`）
⇒ 修正轮两行是否计入交付面，请父侧裁定后同步 §1.5 / §2.2 / §4 三处计数（已入上报；本档不越权改批档面）。
**A-17 / A-18 出处注**：两判据的裁定出处 = 批次档 **§5.4 顾问代码评审 🟡①②**（原记「§3 轮次 1」系误指——§3 轮次 1 = 设计评审 #1…#10），**§1 未登记** ⇒ 三方链的需求环暂由 §5.4 承担；建议父侧补登 §1（已入上报）。
批次档 §2.2 = **设计轮八条表体**（前七条 = eng-coder 实施面 + `PROVIDER.md` = 设计轮笔档）；修正轮两行
（`thincoder-vscode/webview/model-picker.js` · `thincoder-vscode/test/model-picker-fallback.test.mjs`）入本表后
交付面 = **十行**——该两行在批次档侧见 §2 本轮回执与变更记录 2026-09-20 修正轮条②（§2.2 = 出批档笔、append-only，不回改）；
批次档 §1.5 括注仍列 `docs/core/design/PROVIDER.md` 登记面属**需求原文保持**（不改 §1）。
上报项编号口径（防与批次档 §2.4 同号异事）：本档不新设 R 号——A-16「属新增断言非回归」已写于本档 §5 A-16 行内；
`cacheMode` 去留已写于本档 §7（台账待办）；交付面条数已在本节上方收正；批次档 §3 现只有轮次 1（VERDICT pass），
若后续开窗另走轮次 2。本档内引用一律带档名（如本行 `批次档 §2.4`）。

## 4. 关键决策记录（含否决项）

| # | 决策 | 否决的替代 | 否决理由 |
| D-1 | 删 `qwen` 托底行，退化逐名认账（§2.4） | 保留托底行 + 加「族底命中即告警」机制 | 用户 02:44 裁定「不需要它托」；继承式托底是静默失实的源头（§2.3 普查 11 名靠它拿 1M 上下文与视觉） |
| D-2 | 托底名一律接受退化，不据「同族类推」补行 | 给 `qwen3.7-plus` 等借托底名批量补行 | 补行取值 = 文档口径 + 同族沿用填整张能力门（`thinking` / 枚举全无实测）⇒ 与 §1.3「补 = 猜」边界同性质；且「接受退化」是用户裁定的**直接后果**，「补猜行」不是 |
| D-3 | 两新档 `thinking` = **`true`（实测级）**——定向探针实证后登记 | v1 的 `false` + `unverified` 保守登记 | 已被父侧实测推翻（批次档 §1.8-①）：80-token 任务探针裸请求 `reasoning_content` 在场、`reasoning_tokens`＝49，`effort:"none"` 即消失。v1「`usage` 无 `reasoning_tokens`」观察 = `max_tokens:16` 短预算探针截断伪影（§2.2 预算纪律）。「无证据不登记」纪律本身维持——证据到位即按证据翻正，成因链归变更记录 |
| D-4 | `multimodal` **维持布尔**，音频/视频只入行注 | 扩 `modalities` 数组结构化字段 | 读码实测：全仓**无音频发送路径**、`thincoder-core/provider/normalize.mjs` 只处理 `image_url` part 且正则已排除 `data:audio/` ⇒ 新字段**零消费者** = 死字段与第二真源（§2.7）；布尔对「支持图像」语义无失真 |
| D-5 | 枚举登记取**服务端 400 原文顺序**（`none` 首位） | 按强度序把 `high`/`xhigh` 置首 | 服务端自述顺序 ≠ 强度序（`max` 在 3.8-flash 列**末位**）⇒ 重排 = 编造证据不支撑的语义。**代价已知**：§2.8 的 `/think on` 档陷阱（本批已修，取首个非 `"none"` 档）+ VSC「枚举首项兑底」路径（`thincoder-vscode/src/specs.mjs:19-21` 注释、`thincoder-vscode/webview/settings-state.js:48`）落到 `"none"` ⇒ 由 `EFFORT_DEFAULT_PREFIXES` 显式登记规避（AC-13） |
| D-6 | `qwen3.8-max-preview` 删行后**靠 `qwen3.8-max` 前缀遮蔽**取规格 | 改名 `qwen3.8-max` 别名 / 保留并改枚举为 `xhigh/medium/low` | 实测两者返回同一对象 ⇒ 该名不退化；preview 名在 token-plan 被**网关静默映射**为 `qwen3.8-max`（§1.6）⇒ 保留独立行 = 保留张冠李戴活例 |
| D-7 | `qwen-max` / `qwen-plus` 删行（服务端正 200 活着） | 保留（「实测未死」） | 用户退役指令优先。【父侧初判「两行与 `qwen` 行逐字段全同 ⇒ 删行零行为变化」（§1.6）】**该前提随 D-1 删托底行而失效** ⇒ 现退化为 `DEFAULT_SPEC`，差异如实上报（批次档 §2 R-1） |
| D-8 | `context` 文档/网络口径入表 + 行注标明；27b 取 262 144 | 不入表（等 API 实测）/ 27b 取 1M | 缺 `context` = 整行不可用；批次档 AC-6 已裁「允许入表但须标来源」。27b 的 1M 是 YaRN 外推（本地部署特性），DashScope API 实供未证 ⇒ 取原生值保守（AC-12「按证据取值」） |
| D-9 | `/think on` 默认档 = **首个非 `"none"` 档**（find 形态）；全 `"none"` 退化形态 ⇒ 回退 `"high"`（与无枚举同型） | 抛错；不写 `reasoningEffort`（留空吃服务端默认档） | 抛错需给 `applyThink` 新增报错管道（现无 push 面）且把静态表病态形态变成用户当场炸点；留空使「on」后无显式档、面板显示 `Effort: —` 与实际行为分叉。回退 `"high"` = 现 fallback 零改动（父侧确认今日该路径无回归）；病态形态本批无在册实例，属防御面（判据 = T-14 / A-16）。「首个非 none 档」修法本体 = 父侧裁定（批次档 §1.8-②），非本设计自选 |
| D-10 | `cacheMode` 登记为**信息性字段**：四新行取 `"none"`，**其值对运行行为零影响**；字段去留出本批面（转台账） | 本批内直接删该字段（表 + `providerSpec` 展开 + `DEFAULT_SPEC`） | 读码实测：全仓无判据消费（唯二落点 = `thincoder-core/model-specs.mjs:118` 的 `DEFAULT_SPEC` 兜底取值与 `:198` 的 `providerSpec` 展开复制；`CONTEXT-COMPACTION.md:333` 已自行记录该字段「核内除定义与测试断言外零消费」并因此否决过用它作分派判据）。删字段 = 本批**未要求且不可实测**的顺手结构改动，违 §1.3 边界与本批「无新字段/无新导出」口径（§3）；而静默登记一个无消费者字段又是个假能力位 ⇒ 以本行裁定将其**性质明示**（不据其取值做行为断言、不再新增断言），去留转台账；来源 = 批次档 §1.10 P-1/P-2/P-3 父侧补裁 |

## 5. 验收标准回指（逐条指回批次档 §1.2 / §1.6 / §1.7 / §1.8）

| AC | 机读判据（可直接进测试） | 回指 |
|---|---|---|
| A-1 | `specForModel("qwen3.7-flash").thinking === true` 且 `specForModel("qwen3.8-flash").thinking === true` | §1.2 AC-1（动机按 §2.5 修正：门控/枚举，非请求体） |
| A-2 | 3.7-flash `reasoningEffortEnum` `deepEqual` `["none","minimal","low","medium","high","xhigh"]` | §1.2 AC-2 |
| A-3 | 3.8-flash `deepEqual` 上述 + `"max"`；并断言 A-2 与 A-3 两数组**不相等** | §1.2 AC-3 |
| A-4 | 四新档 `maxOutput === 131_072` | §1.2 AC-4 + §1.7(B) |
| A-5 | `specForModel("qwen3.7-flash").multimodal === true`、`qwen3.8-flash` 同 | §1.2 AC-5（实测形态 = 已进入图像解码校验，非 text-only 拒绝） |
| A-6 | 三档 `context === 1_000_000`；`qwen3.8-27b` `context === 262_144`；源码行注含「文档口径/网络口径」（人工核） | §1.2 AC-6 + §1.7(B) |
| A-7 | `resolveEnableThinking({model:"qwen3.8-flash" \| "qwen3.8-omni-flash", baseURL:<bailian>, thinking:null}, spec) === false`；`reasoningEffort:"high"` ⇒ `true`；均无 ⇒ `undefined`；**同携态 ⇒ `false`**（§2.6-2）| §1.2 AC-7 + §2.6（网络实测已在 §1.2-7，不入测试）|
| A-8 | VSC `specForModel("qwen3.7-flash").reasoningEffortDefault === "high"`、`"qwen3.8-flash"` 同 | §1.2 AC-8（默认档证据 = 文档口径，批次档 §2 R-6） |
| A-9 | 托底行取消落地：`specMatch("qwen").matched === false`（泛前缀键已删 ⇒ 该名自身退 DEFAULT_SPEC）+ `specForModel("qwen-flash").context === 128_000`。**不采用**「两 spec 对象不等」式断言（评审发现 #7：改动前同样成立、无区分力） | §1.2 AC-9（开放项 2 已由用户 02:44 裁定为删行，无需选型） |
| A-10 | 三端测试全绿 = 门禁读数：核 `node test/run.mjs` · CLI `npm test` · VSC `node test/run.mjs` 均 `fail 0`；用例面含「两 flash 档枚举不等」差异断言（A-3） | §1.2 AC-10（项目纪律「每次改动必须跑起来验证」；读数落批次档 §5） |
| A-11 | `node scripts/doc-check.mjs` ⇒ 悬空 0（实跑，闸 OK）· 行宽：本批射程零新增；全仓残余 2 行 = `docs/core/requirements/AGENT-LOOP.md:163/168`（需求档非本批笔 ⇒ 上抛） | §1.2 AC-11 |
| A-12 | 两新档各得独立行：枚举 7 档含 `"max"`、`maxOutput 131_072`、`multimodal true`、context 按 §2.2、`thinking === true`（实测级，批次档 §1.8-①） | §1.7(B) AC-12 + §1.8-① |
| A-13 | `EFFORT_DEFAULT_PREFIXES` 收录**全部在册 qwen 档**（六档 = 四新档 + `qwen3.7-max` + `qwen3.8-max`；表体 `thincoder-vscode/src/specs.mjs:22-36`，批后实读六档在册）⇒ 本批**补 5 档**：两 max 档→`xhigh`、四新档→`high`；且无族前缀条目。**测试落点** = `thincoder-vscode/test/image-downgrade.test.mjs` 新增用例（T-15）——该档现有用例不覆盖 qwen ⇒ **不得以「已有用例」为凭据声称已测**（§3）| §1.7 AC-13（取值裁定见 §2.2 / D-5；评审发现 #3；测试落点件来源 = 批次档 §1.10 P-1/P-2/P-3 父侧补裁）|
| A-14 | 逐名处置表 **15 行 = 18 具名 + 1 类未知名**穷举 + 测试断言退化形状已知（`specForModel("qwen3.7-plus").context === 128_000`）；未知 qwen 名经 `warnUnknownModel` 告警一次 | §1.7(A) AC-14 |
| A-15 | 退役名查表结果：`specForModel("qwen3.8-max-preview")` **同一对象** 于 `specForModel("qwen3.8-max")`（遮蔽不退化）；`specForModel("qwen-max")` `context === 128_000`（退化认账） | §1.6 处置裁定 ①② |
| A-16 | CLI `/think on` 后 `cur.reasoningEffort`：四新档 ⇒ `"minimal"`（首个非 `"none"` 档）；无枚举 ⇒ `"high"`（既有回退零变化）；合成退化枚举 `["none"]` ⇒ `"high"`；三态均**不得**写入 `"none"`，且 `thinking` 显式 off 标记被清除。【前提】本判据属**新增断言**而非回归断言（落地载体 = 批内新增档 `thincoder-cli/test/cmd-think.test.mjs`，已落）（批次档 §2 R-12）| §1.8-②（升格必修）+ §2.8-1 / D-9 |
| A-17 | picker 归一：条目载 `effortDefault` 时「当前档 ∉ 枚举」取 `effortDefault` 而非 `levels[0]`（`thincoder-vscode/webview/model-picker.js:85` · `:123`；未声明才回落）⇒ qwen 四新档不得被归一成关思考 | 裁定①（批次档 §5.4 顾问代码评审 🟡①）+ §2.8-3；用例 T-17 |
| A-18 | CLI `/think effort none` ⇒ 关思考：终态 `thinking === null` ∧ `reasoningEffort ∈ {"none", undefined}` ⇒ 载荷不得同携 `enable_thinking:true` + `reasoning_effort:"none"`，面板不得显 `Thinking: ON`（`thincoder-cli/src/tui/cmd-think.mjs:48-49` 菜单头 · `:86-87` 循环回执公式 = 同式 `!== null` 守卫；后者本批零测试射程 ⇒ 补用例归台账）| 裁定②（批次档 §5.4 顾问代码评审 🟡②）+ §2.6-2 / §2.8-2；用例 T-16 + T-9 第四态 |

**开放项裁定回指**：§1.4 开放项 1 = §2.2 全字段表；开放项 2 = 已被用户裁定替代（§4 D-1）；
开放项 3 = §2.6。§1.7(B) 两点 = §2.2（thinking 实测登记）+ §2.7（模态维持布尔、行注承载）。
§1.8-②（`cmd-think` 升格必修）= §2.8 修法 + D-9 退化裁定 + A-16 / T-14。各项裁定均有结论，无含糊带过。
§1.8-④（探针脚本按 provider 名选路 · §1.10/§1.12 勘正后口径）= 边界面（§7「不改探针脚本」条）——非本批交付项。
**三项自查件（§4 D-10 / §6 T-13 改形 / §5 A-13 测试落点 + T-15）来源** = 批次档 §1.10（P-1/P-2/P-3 父侧补裁）
——三项经 §1.10 入册后合法，实现面以批次档 §1 为出处。
**本修正轮新登判据的出处与需求面缺口**：A-17 / A-18 的裁定出处 = 批次档 **§5.4 顾问代码评审**（🟡①②；原记「§3 轮次 1」系误指）；该两裁定**未入批次档 §1**
⇒ 三方链（需求 ↔ 批次档 §2 ↔ 设计判据）的需求环暂由 §5.4 承担。**上报（不在本档权限面）**：请父侧决定 §1 补登记形
（本档 §2 / §5 / §6 已按裁定落位，不含新语义）。

## 6. 用例表（正常 / 边界 / 错误 · 17 条）

| # | 场景 | 输入 | 期望 |
|---|---|---|---|
| T-1 | 正常：两 flash 档独立行 | `specForModel` 两档名 + `specMatch` | 逐字段等 §2.2；两名均 `matched:true`（独立行命中，不靠托底）|
| T-2 | 正常：两 flash 档枚举不等 | 两档 `reasoningEffortEnum` | 3.8 比 3.7 多且仅多 `"max"`；`deepEqual` 断两数组不等 |
| T-3 | 边界：托底行已删（AC-9/14） | `specMatch("qwen")` / `specMatch("qwen-flash")` | 两名的键均已删 ⇒ `matched:false`、退 `DEFAULT_SPEC`（`context 128_000` / `maxOutput 32_000`）|
| T-4 | 边界：借托底名退化形状已知（AC-14） | `specForModel("qwen3.7-plus")` | `context 128_000`、`multimodal undefined`、无枚举（§2.4 表第 5 行认账的形状） |
| T-5 | 正常：退役名遮蔽路径（A-15） | `specForModel("qwen3.8-max")` / `("qwen3.8-max-preview")` | **同一对象**（实测过的前缀遮蔽行为，不退化） |
| T-6 | 正常：两新档独立行（AC-12） | `specForModel("qwen3.8-omni-flash")` / `("qwen3.8-27b")` | 枚举 7 档含 `max`、`maxOutput 131_072`、`multimodal true`、`thinking true`（§1.8-① 实测）、context 分别 1M / 262 144 |
| T-7 | 边界：模态位语义单一（§2.7） | 全表扫描 | 任何行**不得出现 `modalities` 键**（本表模态面只有 `multimodal` 布尔一字段）；`multimodal` 仅 true/undefined 两态 |
| T-8 | 错误：effort 越界抛错门 | `qwen3.7-flash` + `reasoningEffort:"max"` 组请求体 | 抛 `not supported by model`（3.7-flash 枚举无 `max`，A-3 反向门）；落点在 `thincoder-core/provider/core.mjs:198-203`，按既有装配导出面调用，不新增导出 |
| T-9 | 正常：`enable_thinking` 白名单零回归 + 同携态（A-7） | `resolveEnableThinking` **四态**：`{thinking:null}` / `{reasoningEffort:"high"}` / `{}` / **同携态 `{thinking:null, reasoningEffort:"none"}`** × 两新档 | `false` / `true` / `undefined` / **`false`**（判据顺序见 §2.6-2；风格同 `thincoder-core/test/provider-merge.test.mjs`）|
| T-10 | 正常：VSC 默认档（AC-13） | VSC `specForModel(四档 + qwen3.7-max / qwen3.8-max).reasoningEffortDefault` | 四新档 `high`；两 max 档 `xhigh`（`EFFORT_DEFAULT_PREFIXES` 命中端差行返拷贝，`thincoder-vscode/src/specs.mjs:55-59`） |
| T-11 | 边界：既有族零回归（§1.3） | deepseek/kimi/glm/gpt/MiniMax/mimo 各一代表名 | 字段逐字不变（防误删误改行） |
| T-12 | 边界：枚举登记形状锚（§4 D-5） | 四新档 `reasoningEffortEnum[0]` 与末位成员 | 首项均为 `"none"`；3.7-flash 末位 `xhigh`、3.8-flash 与两新档末位 `max` ⇒ 钉住「登记顺序 = 服务端原文顺序」的证据忠实性——有人按强度序重排即红，必须回 §4 决策面重裁 |
| T-13 | 边界：`cacheMode` 系信息性字段（§4 D-10）| ① 全仓搜 `cacheMode`：除 `thincoder-core/model-specs.mjs` 与 `thincoder-vscode/src/specs.mjs`（表自身 + 端差拷贝）外，出现于**任何判据位置** ⇒ 红；② 本批用例档新增 `cacheMode` 取值断言 ⇒ 红 | 零判据消费点 ⇒ 四新行取 `"none"` 不影响任何行为；无消费者即不断言（防把死字段当能力位钉住）|
| T-14 | 正常＋边界：CLI `/think on` 首个非 `none` 档（§2.8 / A-16）| 注入合成 spec 直驱 `applyThink`：四新档枚举 / 退化枚举 `["none"]` / 无枚举 | 四新档 ⇒ `reasoningEffort === "minimal"`；退化形与无枚举 ⇒ `"high"`；三态均不写入 `"none"`、`thinking` 标记已清除（批内新增文件 `thincoder-cli/test/cmd-think.test.mjs`——收口实读 154 行）|
| T-15 | 正常：VSC 端差默认档覆盖 **qwen 全档**（A-13）| VSC `specForModel` 逐档：四新档 + `qwen3.7-max` + `qwen3.8-max`；另加「无族前缀条目」结构断言 | 四新档 → `high`、两 max 档 → `xhigh`；`EFFORT_DEFAULT_PREFIXES` 任一键均没有同为键前缀的兄弟（防族遮蔽）。落点 = `thincoder-vscode/test/image-downgrade.test.mjs` 新增段 |
| T-16 | 正常＋边界：CLI `/think effort none` 关思考（§2.8-2 / A-18）| 注入合成 spec 直驱 `applyThink`：`{action:"effort", level:"none"}` 于「有档无标记」态 | 终态 `thinking === null`；`reasoningEffort ∈ {"none", undefined}`（两写法均须 `resolveEnableThinking(...) !== true`）；载荷无矛盾对；落点 = `thincoder-cli/test/cmd-think.test.mjs` |
| T-17 | 正常＋边界：VSC picker 归一 `effortDefault` 优先（§2.8-3 / A-17）| `model-picker.js` 归一函数直驱：① 条目载 `effortDefault:"high"` + 枚举含 `"none"`，当前档 ∉ 枚举；② 负控 = 条目**无** `effortDefault` | ① 归一取 `"high"`（不得落 `"none"`）；② 回落 `levels[0]`（既有行为零回归）；落点 = `thincoder-vscode/test/model-picker-fallback.test.mjs` |

**实施标签映射注（修复轮实读）**：A-18 / A-17 的用例在实施侧未挂 T- 号——`thincoder-cli/test/cmd-think.test.mjs` 以「修复轮 #11」×3 段承载 T-16 语义；`thincoder-vscode/test/model-picker-fallback.test.mjs` 以「③」×2 用例承载 T-17 语义。用例号 = 本档判据面口径（§5 A-17 / A-18）；实施侧标签仅作对照，判定以语义覆盖为准。

**测试面既有依赖核查**（已逐条读到码面，结论 = 除下行外无需改动；**另**：`thincoder-vscode/test/model-picker-fallback.test.mjs` 为修正轮新增用例落点，其既有 ② 用例标题/注释按新归一语义收正——见 §3 披露面行 / T-17）：
`thincoder-core/test/model-specs.test.mjs:22-31` 的 `deepEqual(spec, specForModel(FLASH))` 是 **deepseek 族内两行互比**，
不受 qwen 面影响；`thincoder-core/test/tool-registry.test.mjs:37-38` 的 fixture 实测为
`TEXT_ONLY_MODEL = "qwen3.7-max"` / `VISION_MODEL = "qwen3.8-max"`——**两者均有独立行**（`:64`/`:74`），
不借 `qwen` 托底 ⇒ 删托底行**不破该测试**（批次档 §2 R-5 已消解）。

**删除行账（评审 F-3）**：本批唯一的既有用例删除 = `thincoder-core/test/model-specs.test.mjs:29` 的
`assert.equal(spec.cacheMode, "auto", …)`（deepseek 族现有取值零变 ⇒ 删它不掩盖回归；保留 = 按 T-13 / D-10 与死字段共谋），
计 §3 的 `−2`（该行 + 其相邻空行）；除此之外本批对既有用例**零删**。

## 7. 边界（本设计**不做**）

- 不改 `thincoder-core/auto-think.mjs`、`thincoder-core/agent/spawn-child.mjs`、`thincoder-core/config.mjs`；
  `thincoder-cli/src/tui/cmd-think.mjs` 只改三处取值面：`:131` on 默认档 + `:104` `"none"` ⇒ off 标记
  （§2.8-1 / §2.8-2）＋ `applyThink` 具名导出＋ `:86-87` 循环回执守卫（同裁定② 第三处，§2.8 面 2 末条）——CLI 面板 / picker / `:16` 列表语义零触碰（**例外 = 上述回执守卫：交互循环仅此一处公式入本批面**）；
  **VSC picker 归一 = 本批回归修复**（§2.8-3 / A-17，另列）。
- 不给 `specMatch` 的 `matched` 位加第三态；不改 `lookupSpec` 返回形状与热路径。
- 不新增思考关闭开关：`"none"` 已是枚举成员（四新档首项），`resolveEnableThinking`（`thincoder-core/config.mjs:137`）对显式 off 的既有覆盖即够（§2.6）——该函数现无「effort=none ⇒ `enable_thinking:false`」分支，本批不加；`"none"` 面的矛盾组合消除在**生产端**（§2.8-2 / A-18），不经该函数。
- 不为 qwen 之外的族新增/删除任何托底或冗余行（`glm` / `mimo` 族泛前缀行为**既有已核验设计**，本批不碰）。
- 不扩 `modalities` 结构化字段（§2.7 裁定）；不改 8 个 `multimodal` 消费点的任何判据（八处完整坐标 = §2.5 表末行 + §2.7 第 1 项）。
- 不引入网络探测 / 自动校正；全部字段均**人工登记**。
- **`cacheMode` 登记形态不统一不入本批面**：`MODEL_SPECS` 在册规格 **53 行**（2026-09-22 设计轮实读计数）——
  40 行登记该键、**13 行缺**；本批只处置 mimo 两行（`mimo-v2.5-pro` `:119` · `mimo-v2.5` `:120`，随 v2.5 对齐补键，§12）⇒
  实施后 = **56 行 / 45 登记 / 11 缺**。其余 11 行 = 既有面两类：① 渠道批五行的**有意不设**（`hy3` / `hy3-preview` /
  `hy4-preview` / `doubao-seed-2-0-code-preview-260215` / `doubao-seed-2-0-lite-260428`——两族缓存未实测，登记 = 猜，§9.3 表末行）；
  ② 既有缺口六行（`grok-4.6` / `grok-4.5` / `grok-4` / `grok-4-mini` / `mistral-large` / `codestral`——无缓存证据）。
  两类均与本批判据无关；其处置随 `cacheMode` 去留台账待办一并解（本节的「不删 `cacheMode` 字段」条 / §4 D-10）。
- **不删 `cacheMode` 字段**（§4 D-10）：全仓无判据消费、属既有死字段，其去留 = 台账新待办（含字段本体与导出面清理），不入本批。
- 不修 VSC 默认档兑底链（`thincoder-vscode/webview/settings-state.js:48`：未登记时取枚举首项）——本批由 `EFFORT_DEFAULT_PREFIXES` 逐档登记消除其触发路径（§2.8 / §2.2 端差表），该码零改；**VSC picker 归一同式取值已随本批回归修复落位**（`thincoder-vscode/webview/model-picker.js:85` · `:123`，§2.8-3 / A-17）。
- 不改探针脚本 `thincoder-cli/test/smoke-qwen-thinking.mjs:24-30`（该脚本取 provider 名参数→ `providers[].model` 选路，全档无硬编码模型名字面量）——扩档需密钥实操作，归父侧/用户（§2.2 末）。
- 不给 omni 之外的行添加模态行注。
- **不修 `qwen3.8-max` 的 effort 枚举越界抛错面**（评审发现 #4）：该档枚举 `xhigh/medium/low`（`thincoder-core/model-specs.mjs:74`）
  本批零改 ⇒ 其 `/think effort high` 抛错**批前批后均在**，不属本批效果、也不在本批修复射程（取值无实测依据，补 = 猜）
  ⇒ 单列为**台账待办**（逐名实测 `qwen3.8-max` 家族枚举后修）；本批不据其改动任何判据或文案。

## 8. UI/交互决策（全落地，无 open）

| 界面/交互面 | 决策 |
|---|---|
| CLI `/think` 面板（四新档） | effort 列表从硬回退 `["high","max"]` 变真实 6/7 档；`/think on` 取首个非 `"none"` 档（四新档 ⇒ `"minimal"`，§2.8-1 · A-16）；`/think effort none` = 关思考（§2.8-2 · A-18）；Thinking 开关行仍隐藏（`thinkApi:"effort"` 既有语义，`thincoder-cli/src/tui/cmd-think.mjs:55`） |
| VSC 思考下拉（两 flash 档） | 6 / 7 档逐档列出（读 `reasoningEffortEnum`），**无** `"enabled"` 项；默认标签 = `high`（`EFFORT_DEFAULT_PREFIXES` 逐档登记，`thincoder-vscode/src/specs.mjs:19-21`）；切/开模型归一 = `effortDefault` 优先（`thincoder-vscode/webview/model-picker.js:85` · `:123`——§2.8-3 · A-17） |
| VSC 下拉 off 项 | 沿用 `thincoder-vscode/webview/model-picker.js:61` 既有渲染：`"none"` 档按钮文案显 `"off"`（零改）；选中 `"none"` 的载荷 = **真 off**（`thincoder-vscode/src/extension/reasoning-mode.mjs:22-24`：`{thinking:null, reasoningEffort:null}`）——与 CLI 侧 §2.8-2 同语义 |
| 未知 qwen 名的可见性 | 走既有 `warnUnknownModel` 一次性 `console.warn`（`thincoder-core/model-specs.mjs:154-160`），**不进 TUI 对话流**、不入状态栏——启动诊断面，非交互内容 |
| **两端默认强度分叉（已知后果 · 裁定注）** | 同一模型 CLI `/think on` ⇒ `"minimal"`、VSC 面板默认 ⇒ `"high"`——两端默认档**有意不同**，不是缺陷：CLI 侧取「首个非 `none`」是 `"off` 翻转」修复的产物（父侧裁定 · §2.8 / D-9），VSC 侧取服务端默认档（文档口径 · R-6）⇒ 本批**不并入统一**，后续批次若要统一须新裁定（评审发现 #10 · 防当缺陷返工）|

无 `open` 项。

## 9. 渠道接入批行集（腾讯 TokenHub / 火山方舟豆包 Seed）

> 需求面与批次任务面 = `docs/batches/2026-09-20-channel-onboarding.md`（§1 判据 / §2 设计任务）。
> 本节上报项编号取 **CH-号**（本批专用）——`R-号` 已被 qwen 批占用（同号异事 = 缺陷）。
> 实测证据源 = 该批次档 §1.2
> （父侧 2026-09-20 活体双渠道全针），设计轮直取未重跑（仓内无密钥，环境不具备复现条件）。

### 9.1 登记规则（本批立 · D-11）

**能力位不跨名沿用，尺寸位可沿用**——按证据等级分档：

| 字段类别 | 错登记的后果 | 登记策略 |
|---|---|---|
| 尺寸类（`context` / `maxOutput`） | 保守侧退化（压缩阈值偏早 / 显示偏小），不发往服务端 | 实测值优先；无实测 ⇒ 同族沿用或参考口径，**行注必标** |
| 能力位（`thinking` / `thinkApi` / `reasoningEffortEnum` / `multimodal`） | **用户可见硬失败**：越界档位被 `thincoder-core/provider/core.mjs:198` 客户端抛错门拦截；`thinking` 参数误发被服务端 400 | **只登记到有实测证据的名**，未实测名一律不声明 |

判据出处：`docs/batches/2026-09-20-channel-onboarding.md` §1.5 开放项 1/2 裁定 + §1.2 实测面。

**消费点随登记同变（本批适用项）**：`thinkApi` 现有消费点三处（本轮实 grep 入仓码面：**核内零读取**，读点均在端侧）
= `thincoder-cli/src/tui/cmd-think.mjs:13`（交互命令的 effort-only 分叉）· `thincoder-cli/src/tui/cmd-advisor.mjs:104` 与 `:234`
（advisor 同型分叉）· `thincoder-vscode/src/extension/reasoning-mode.mjs:27`（面板 `enabled` 项的 off-marker）；
字段含义 = 定义注 `thincoder-core/model-specs.mjs:21`。**核内首个消费点 = D-14（AC-9）**：其修法在
`thincoder-core/provider/core.mjs` 载荷组装段新读 `spec.thinkApi` ⇒ 该字段自此不再只是端侧概念（三端 UI 零改，
判据不变）。本段形制参照 = 同档 **D-10**（`cacheMode` 因零消费点被定性为信息性字段并登台账），方向相反而纪律同源：
字段消费状态变了，登记面就得跟着说清。

### 9.2 表变更清单（五新行，零删除、零改既有行）

| 动作 | 行 | 证据等级 |
|---|---|---|
| 新增 | `hy3` | 全针实测（§批次档 1.2） |
| 新增 | `hy3-preview` | 在场实测（401 前验活）；能力位**未探针** ⇒ 尺寸行 |
| 新增 | `hy4-preview` | 在场实测（`/models` + 401）；能力位**未探针** ⇒ 尺寸行 |
| 新增 | `doubao-seed-2-0-code-preview-260215` | 全针实测（含服务端 400 原文枚举 + `max_tokens` 上限 400） |
| 新增 | `doubao-seed-2-0-lite-260428` | 同族全针 ✓（批次档 §1.2 lite 行明列：思考 tok=161 / 视觉 "Red" / 上限 131 072 / echo 真名） |

段位置：实施面按表内既有族注释风格落位（建议：Gemini 族段尾新建 `// Tencent Hunyuan (TokenHub)` /
`// Doubao Seed (Volcano Ark)` 两族段）——表序不影响查找（`SORTED_SPECS` 按前缀长度降序，
`thincoder-core/model-specs.mjs:111`）。端点口径 = 批次档 §1.2 逐字：腾讯 TokenHub = `https://tokenhub.tencentmaas.com/v1`；
火山方舟 = `https://ark.cn-beijing.volces.com/api/v3`。渠道预置面（`PROVIDER_PRESETS`）裁定 = §9.6 D-13。

前缀遮蔽自查：`hy3` 是 `hy3-preview` 的前缀 ⇒ 两名均显式在册，
`SORTED_SPECS` 按前缀长度降序（`thincoder-core/model-specs.mjs:111`）保证长名先命中；
`hy3` 前缀将遮蔽未来同族新档（`hy3-plus` 类）⇒ 随台账 #11 巡检补显式行。
现状核对（设计轮实跑）：五名 `specMatch` 全为 `matched:false`（今日靠 `DEFAULT_SPEC` 128K/32K 兜底并每次首请求告警）。

**前缀继承面现状核对（评审轮 1 #8 · 批次档 §1.10-② 素材）**：网关 124 名全量筛 `hy*|hunyuan*`——其余名 = `hy-image-v3` /
`hy-vision-2.0-instruct` / `hunyuan-t1-vision-*` / `hunyuan-turbos-vision-video-*` / `hy-mt2-{pro,plus,lite}` / `hy-role` /
`hunyuan-role-latest` / `hy-3d-*` 族 / `hy-asr-*` / `hy-world2-*` / `hy-video-*` / `hy-image-lite`——**无一以 `hy3` 起头** ⇒
`hy3` 行落盘后现盘前缀继承命中面 = `hy3-preview` 一枚（已显式在册，非继承）；其余名不入 `hy3` 前缀面（落 `DEFAULT_SPEC` + 告警）。
未来同族名随台账 #11 巡检（D-11「能力位不跨名沿用」＝ 本核对的计数口径，不受影响）。

### 9.3 字段口径表（逐字段 + 证据等级）

| 字段 | `hy3` | `hy3-preview` | `hy4-preview` | seed-code | seed-lite | 等级说明 |
|---|---|---|---|---|---|---|
| `thinking` | `true` | 不声明 | 不声明 | `true` | `true` | 实测：裸请求 `reasoning_content` 在场（hy3 tok=16 / code 219 / lite 161）；`effort:"none"` 即消失 |
| `thinkApi` | `"effort"` | 不声明 | 不声明 | `"effort"` | `"effort"` | 实测：档位经 `reasoning_effort` 参数生效（seed 系 400 原文即该参数） |
| `reasoningEffortEnum` | `["none","minimal","low","medium","high","xhigh","max"]` | 不声明 | 不声明 | `["none","minimal","low","medium","high","xhigh","max"]` | 同 code 行（同族全针） | hy3 = **受理级探针**（批次档 §1.10-①：七值全 200 受理；乱值 `zzz` → 400 泛化拒收，服务端不列枚举）；seed = 服务端**真校验**（`zzz` → 400 明列 invalid + 七档全 200）；两族**同值集、行独立**（受理级 ≠ 校验级，等级不混）；lite = 同族全针（代价说明见表下 D-11 代价句） |
| `multimodal` | **不声明**（实测无视觉） | 不声明 | 不声明 | `true` | `true` | hy3 = 真值 32×32 纯红图答 "Unknown"（对照无图组明说看不到图）⇒ **不得声明**；seed = 答 "Red"。**`hy3-preview` 补记**：该名服务端默认能力 = 思考 + 视觉（hy 系百炼实测同模型，父侧口径），本批**不声明 = 认账**（未本渠道探针 ⇒ 不跨名沿用，D-11）；不声明的代价 = 该名面板不展图，与今日无行时同形 |
| `maxOutput` | `128_000` | `128_000` | `128_000` | `131_072` | `131_072` | hy3 / hy3-preview = **参考实配**（网关对 `max_tokens` 不硬拒 ⇒ 上限未证，行注标）；hy4-preview = 同族沿用（本批次档 §1.2 **未给该名尺寸行** ⇒ 上报项 §9.9 清单 2）；seed = **实测**（262 144 → 400 `above maximum`） |
| `context` | `256_000` | `256_000` | `256_000` | `256_000` | `256_000` | hy3 族 = **网络/他仓口径**（未实测；hy4-preview 同 §9.9 清单 2）；seed = 官方 256K 口径 + **实测下界 210K 输入受理**（探至账号 429 停手）⇒ 行注逐字标 |
| `reasoningEcho` | 不声明 | 不声明 | 不声明 | 不声明 | 不声明 | 两族均实测 tool 历史三形态 200 ⇒ optional；不声明 = 现状默认，行为字节等价（与 §2.2 qwen 族同款处置） |
| `partialMode` / `prefixMode` | 不设 | 不设 | 不设 | 不设 | 不设 | 两族均未实测续写协议 ⇒ 不预支 |
| `cacheMode` | 不设 | 不设 | 不设 | 不设 | 不设 | 信息性字段零消费点（§4 D-10），且两族缓存未实测 ⇒ 不登记 |
| `tempRange` / `noUsageStream` / `thinkEnabledValue` | 不设 | 不设 | 不设 | 不设 | 不设 | 未实测 ⇒ 不设（不设 = 不钳位 / 照常发 `stream_options`） |

**只有「实测」列进交付判据**；「参考口径」「同族沿用」两类必须逐条落行注，测试面只断言已登记值本身。

**D-11 不声明的代价（显式认账，不默带）**：`hy3-preview` / `hy4-preview` 两行因能力位无实测 ⇒ 不声明枚举，后果可观：
VSC 探测下拉该两名的档位枚举空（`thincoder-vscode/src/extension/provider-probe-window.mjs:66`）、CLI `/think effort`
无枚举时走回退档 `high|max`（`thincoder-cli/src/tui/cmd-think.mjs:16`）——两者与今日（无行时代靠 `DEFAULT_SPEC`）同形
⇒ **零新增退化**，不属本批回归；补实测随台账 #11（覆盖面巡检）。

### 9.4 聚合网关命中面（TokenHub 转售名逐名认账）

`tokenhub` 是聚合网关（`/models` 实返 124 名），其上的第三方名**直命中既有原厂行**——
命中 = 沿用原厂行取值，能力位是否等同原厂**未实测**（禁止静默套用）。逐名认账表（设计轮实跑 `specForModel` 取值）：

| 转售名 | 命中行 | `maxOutput` | 宿主耦合字段（原厂语义，转售通道未验证） | 认账 |
|---|---|---|---|---|
| `glm-5.3` / `glm-5.3-flash` | `glm-5.3*` | 128 000 | `noUsageStream`（不发 `stream_options`） | **可沿用**——耦合位失效仅损失 usage 统计，无 400 面 |
| `minimax-m3` | `minimax-m3` | 128 000 | `thinkEnabledValue:"adaptive"` + `noUsageStream` | **可沿用**——同上，`thinking.type` 值域风险限于显式开思考路径 |
| `kimi-k3` | `kimi-k3` | 131 072 | `partialMode`（续写带 `partial:true`）+ `reasoningEcho:"required"`（回声必发） | **存疑沿用**——回声位实测过 hy3 侧为 optional，kimi 位系原厂结论；续写/回声在网关侧未验证 |
| `deepseek-v4-flash` / `deepseek-v4-pro` | 同名行 | 384 000 | **`prefixMode` ⇒ 续写请求改写 baseURL 为 `/beta`**（`thincoder-core/provider/errors.mjs:56-60`）+ `reasoningEcho:"required"` | **存疑沿用**——TokenHub 无 `/beta` 的可能性高；失败被 `thincoder-core/provider/core.mjs:270-276` 捕获为 `_warnings`（软失败，不整轮飞出） |
| 未在册名（`deepseek-v3.1` 等） | 无 ⇒ `DEFAULT_SPEC` | 32 000 | — | 退化面 = 现状，告警一次（`thincoder-core/model-specs.mjs:135-141`），本批不补行（无实测） |

**裁定（D-12）**：本批**不**为转售名增设「渠道限定行」，也**不**改查表机制（`lookupSpec` 无 provider 维度，
扩维属机制变更、越本批边界）。命中原厂行 + 本表逐名认账 + 宿主耦合字段公开登记 = 满足「不静默套用」。
转售通道的续写/回声实测随台账 #11（覆盖面巡检）处理——本批不冒充已验。

**覆盖面口径（本表据此列全——评审轮 1 #7 · 批次档 §1.10-③）**：124 名中**命中既有行**的全集 = `glm-5.3` / `glm-5.3-flash` /
`glm-5.3-flashx`（经 `glm-5.3-flash` 前缀继承）· `deepseek-v4-pro(-0813/-202606)` · `deepseek-v4-flash(-0731/-202605)` ·
`deepseek/deepseek-v4-flash-vision-exp`（`/` 命名空间剥离后命中）· `kimi-k3` · `minimax-m3`——**本表逐名覆盖、无表外命中名**；
**未命中名**（无行 ⇒ `DEFAULT_SPEC` + 首请求告警）= `kimi-k2.5` / `kimi-k2.6` / `kimi-k2.7-code(-highspeed)` /
`kimi-k2.8-preview` 等（代表例 = A-9 `deepseek-v3.1`）；非聊天家族（`minimax-video/voice/speech/music-*` 等）不属聊天路由面，不入本表。

### 9.5 方舟 schema 兼容层裁定（AC-4）

**不引入**（他仓为方舟维护的 `minLength/maxLength/minItems/maxItems/minContains/maxContains` 剥除层）。
判据两条：① 批次档 §1.2 实测 seed-2.0 代全部 200 不触发；② 设计轮 grep 实证自有工具 schema 零使用这些关键字
（`thincoder-core/tools/` 命中 0）。复访条件 = 服务端真出现 400（登台账，不预支兼容层）。
**正文登记位 = 本节自身**（AC-4 结论 + 两条判据由本节承载）——机制面 `doc:PROVIDER.md` 逐节实读（§6.1–§6.19）无方舟 schema /
受限关键字对应节（§6.7 = 工具配对与转义净化，非兼容层）⇒ 本批 PROVIDER.md 不设 AC-4 交付行、无跨档指针（评审轮 1 #4）。

### 9.6 渠道预置与「off 静默失效」修法（D-13 / D-14 · 两条均为本批交付项）

**D-13 预置面形状（AC-5）**：① 新增 `tokenhub` 预置（名 = 批次档标题名；baseURL = §1.2 实钉端点；
`model: "hy3"`；**不带** thinking / reasoningEffort / maxTokens 字段——两新渠道的 `thinking:{type}` 载荷与 `max_tokens`
行为未测，不设 = 不发）；② 方舟 = **复用既有 `volcengine` 预置**（baseURL 与 §1.2 逐字节同 = 同渠道不双键；
`ark` 是用户配置条目名，与预置键解耦），其 `model` 改指 `doubao-seed-2-0-code-preview-260215`
（旧值从未在规格表 = 预置/表漂移；新值实测在册，旧值与动因 = 批次档 §1.2–§1.3）。**收口追注（2026-09-20 · 批次档 §5.4 DR-5；顾问 🔵⑤ 同指）**：该行
`maxTokens` 32768 → **131072**（已落盘——随模型改指同变；新模型实测上限 131072，取值参表内 `kimi` / `qwen` / `mimo` 行）；③ 既有 `hunyuan` 预置（另一主机 `api.hunyuan.cloud.tencent.com`）
**不动**——本轮未实测该端点。护栏（批次档交付目标「渠道预置/选择面一致」）：新建结构用例
`thincoder-core/test/config-presets.test.mjs`（批内已建 · 收口实读 52 行）：逐预置 `specMatch(model).matched === true`，
已知漂移白名单 = {`hunyuan`, `siliconflow`, `groq`}（设计轮实跑 20 预置命中 4 漂移，`volcengine` 本批出名单；
白名单只减不增，新增须挂台账待办号）。

**D-14 effort 族非百炼渠道的 off 静默失效（本批登记的实测事实制造的端侧假告知，同 §2.8 先例不得出厂）**：
两端「关思考」现形态 = `thinking:null` 标记（CLI `thincoder-cli/src/tui/cmd-think.mjs:104 / :127` /
VSC `thincoder-vscode/src/extension/reasoning-mode.mjs:22-24`）。该标记对百炼 qwen 生效靠 `enable_thinking:false`
（`thincoder-core/config.mjs:136` 主机门控），对 `hy3`/seed 两新渠道**不发任何思考字段**（`thinking:null` falsy 被
`thincoder-core/provider/core.mjs:193` 跳过），而两渠道服务端默认思考 **on**（批次档 §1.2 裸请求实测）⇒
UI 显示 OFF、服务端照想 = 与 PROVIDER.md §6.12 初始缺陷同类。修法（单点、载荷组装层；**谓词单源 = `doc:PROVIDER.md:§6.12`**
——本节引其条件，机制面不另立判据）：
`provider.thinking === null` ∧ `spec.thinkApi === "effort"` ∧ `spec.reasoningEffortEnum?.includes("none")` ∧
`provider.reasoningEffort == null` ∧ **`!provider.model.includes("/")`**（末款复用 `thincoder-core/provider/core.mjs:196-197`
既有 router 门，含 `/` 的模型 ID 免被路由/代理误读——评审轮 1 #5）
⇒ 发 `reasoning_effort: "none"`（实测唯一有效 off 路径：tok=0、rc 消失）。三端 UI 零改；百炼 flash off 多携该字段（同义、
§1.8-① 实测支持）；枚举不含 `none` 的名（qwen3.7-max / 3.8-max）与无枚举名零变化；路由形态名（`x/hy3` 类）= 同零变化（guard ⑤）。
**状态 = 已获父侧批准（批次档 §1.7-① · 新登 AC-9）⇒ 本批交付项**：交付面 = `thincoder-core/provider/core.mjs`
载荷组装段 +~5（§9.7）；判据链 = 批次档 §1.7-① + 本节 + 用例 B-5（§9.9）。

**副作用面（设计轮实 grep 发现，必须认账不默带）**：`thinking:null` 不只有 UI 两个生产者，还有**三处内部生产者**：
`thincoder-core/context.mjs:401`（压缩摘要）· `thincoder-core/explore-distill.mjs:98`（explore 蒸馏）·
`thincoder-core/config-presets.mjs:18-19`（`kimi` / `kimi-code` 预置携带）。⇒ AC-9 生效后：
① 前两路后台调用对 hy3 / seed 类渠道（无显式 effort 时）**新发** `reasoning_effort:"none"` = 后台调用不再想
——与今日 qwen 同路径的行为同方向（qwen 侧该标记已使 `enable_thinking:false` 生效），且更省更快 ⇒ **本设计认账不排除**
（区分「用户 off」与「内部 off」需新增标记位 = 机制变更，越本批边界 ⇒ 已入 §9.10）；
② `kimi` / `kimi-code` 预置同携 `reasoningEffort:"max"` ⇒ guard ④ 没有命中、零变化（已核）。
### 9.7 影响文件清单（收口行数 · 本批增量）

本批**产品码交付面三处** = 规格表 + 预置表 + 载荷组装段（D-14 · AC-9）；其余面见 §9.2 与 §9.10：

| 文件 | 现行数（2026-09-20 收口复读 · `split` 口径） | 预期增删 | 改动 |
|---|---|---|---|
| `thincoder-core/model-specs.mjs` | 253 | 已落（计划 +~18 / −0） | 五新行（§9.2 落位 · §9.3 取值 · 逐字段证据等级行注）——无新字段、无新导出 |
| `thincoder-core/config-presets.mjs` | 50 | 已落（计划 +1 / ±1；另 `volcengine.maxTokens` 收口追注见 §9.6 D-13） | 新增 `tokenhub` 键（`:36`；注释 `:34-35`）+ `volcengine.model` 改指 `doubao-seed-2-0-code-preview-260215`（`:32`）。表 = **核单源**：VSC 取一侧 `thincoder-vscode/src/extension/presets.mjs:21`，端壳无镜像文件 ⇒ 两端产品码零改 |
| `thincoder-core/provider/core.mjs` | 492 | 已落（计划 +~5 / −0） | **D-14（AC-9）**：off 标记 + `thinkApi:"effort"` + 行枚举含 `"none"` + 无显式档 ⇒ 载荷补发 `reasoning_effort: "none"`；谓词 = §9.6，判据 = 用例 B-5（硬限余量披露见下行数上限段）|
| `docs/core/design/MODEL-SPECS.md` | 837 | 设计轮笔 | 本节 §9（D1，不入 eng-coder 实施面）|
| `docs/core/design/PROVIDER.md` | 445 | 设计轮笔 | §6.11（`:168` 预设段）：`tokenhub` 入表 + `volcengine` 默认模型改值（同 §3 第 8 行先例）；§6.12 + §6.2 载荷组装枚举：D-14 谓词单源登记（评审轮 1 #3）；§6.19 预设段：核单源 + 计数 21 收正（评审轮 1 #1）|

> **行计数口径注（本表与批次档 §2 统一 · 微修轮立 · 收口轮更值）**：「现行数」= 实读 `split('\n').length`（含末行；文件以尾换行
> 结尾时比 `wc -l` 多 1）⇒ 两口径差恒 1：本表 `thincoder-core/model-specs.mjs` 253 ↔ `wc -l` 252；表值 = **2026-09-20 收口复读（实施后终态）**；
> 设计轮预读数（230 / 47 / 477 / 256 / 222 等）、qwen 面所记 210、交付面表（`:275-284`）的 395 / 304 均系各自 as-of，不追改（漂移登记 = 本档变更记录 + 批次档 §5.4 漂移表）。

- **`thincoder-core/provider/core.mjs` 除 D-14 一处外零改**：同文件的 effort 枚举越界 = 客户端**抛错**门（`:198-203`）
  行为**保持原样**——该门是既有设计（代码在场；断言面 = 同表 §6 用例 T-8，qwen 批在途未落），登记枚举的效果 =
  越界值由「无枚举行放行到服务端吃 400」改判「本地抛错并列出合法档位」（无枚举 = `DEFAULT_SPEC` 无
  `reasoningEffortEnum` 键 ⇒ 门短路）= §9.1 能力位纪律的**预期机制**，非本批缺陷 ⇒ 本设计**不**在此文件引入
  「字段省略」类降级。
- 测试面（用例号 = §9.9）：

| 文件 | 现行数 | 预期增删 | 覆盖 |
|---|---|---|---|
| `thincoder-core/test/model-specs.test.mjs` | 415 | 已落（计划 +~50；越 300——登记不拆档，见下行数上限段） | A-1..A-12（五名逐字段 · 证据等级行注 · 转售命中面 · 既有族零回归）|
| `thincoder-core/test/provider-merge.test.mjs` | 307 | 已落（计划 +~50；越 300——登记不拆档；读数含微收尾轮 #12 +3 = T-9 第四态落盘） | B-1..B-6（chat 载荷面 `reasoning_effort`；含 D-14 off 补发与五 guard 零变面、后台路径副作用认账；stubFetch 形态参照 `compress-form.test.mjs:254`）|
| `thincoder-core/test/config-presets.test.mjs` | 52（批内新增） | 已落（计划 ~+24） | P-2 `tokenhub` 预置逐字段等值 · P-3 预置↔规格漂移白名单护栏（§9.6 D-13 裁定的新建位）· P-4 `volcengine.maxTokens` 随改指模型同变（`131072` = seed-code 实测上限）|
| `thincoder-cli/test/config-merge.test.mjs` | 217 | 已落（+3 / −3） | P-1 预设数 20→21（`:5` 覆盖注 + `:26` 标题 + `:28` 断言——D3 计数与清单同变）|
| `thincoder-vscode/test/config-merge.test.mjs` | 182 | 已落（+3 / −3） | 同上（`:4` / `:130` / `:132`）|
- 行数上限（读数 = `split('\n').length`，口径注见上；**2026-09-20 收口复读 · 实施后终态**）：`model-specs.mjs` **253** ·
  `config-presets.mjs` **50** ⇒ 均低于 300 行软线；**两测试档越线** = `thincoder-core/test/model-specs.test.mjs` **415** ·
  `thincoder-core/test/provider-merge.test.mjs` **307** ⇒ 处置 = 批次档 §1.10-④ 预裁「**不拆档——单档内聚**」——登记已落
  （`thincoder-core/test/core-hygiene.test.mjs:55` 两条）；拆分计划落点 = `CORE-UNIFICATION.md` §2.8.1 子表行 12 / 13（含消解窗口）。
  `thincoder-core/provider/core.mjs`（D-14 已落）实 **491**（`wc -l` 口径 = 核内机检口径；`split` 口径 492）越 300 系既有态
  （注册表 `:54` 已登记）⇒ **距 500 硬限余量 9 行** ⇒ 该档后续实质改动时按 `CORE-UNIFICATION.md` §2.8.1 次优先面口径补登拆分计划。
- **`thincoder-core/test/model-specs.test.mjs` 越 300 软线（已裁已落 · 评审轮 1 #10 连带 · 收口复读）**：设计预估 ~305 ⇒
  收口实读 **415**（`split` 口径；`wc -l` 414）⇒ 越线成立。机检面 = `thincoder-core/test/core-hygiene.test.mjs:117-131`：
  `walk(ROOT)`（`ROOT` = `thincoder-core/`）递归全树、**无 test 目录排除**，注册键 = 核内相对路径 ⇒ 测试档同受「>300 未登记即红」约束。
  处置 = 批次档 §1.10-④ 预裁「**不拆档——单档内聚**」——登记已落（`SOFT_LINE_REGISTRY:55` 两条）；拆分计划落点 =
  `CORE-UNIFICATION.md` §2.8.1 子表行 12（同 13 = `provider-merge.test.mjs`）；消解窗口 = 越 500 硬限前或该档下次实质改动时。
  本条 = §9.9 清单 8 的收口闭合。
- **计数同变面（D3 · 「预设 20」在盘 **12** 处——2026-09-20 收口复读逐行实证）**：测试面 **7 处**（CLI `thincoder-cli/test/config-merge.test.mjs:5`/`:26`/`:28`
  + VSC `thincoder-vscode/test/config-merge.test.mjs:4`/`:130`/`:132` + `thincoder-vscode/test/files.mjs:21`〔本清单补入的第 12 处——批次档 §5.4 DR-3／§5.1 越清单披露〕）· 设计面 **2 处**（`docs/core/design/PROVIDER.md:168` §6.11 +
  `:274` §6.19——均**设计轮笔已落**〔`:171-175` / `:284-289`〕；§6.19 的计数与来源坐标收正详该节）· 需求档 1 处 `docs/core/requirements/PROJECT.md:30`（**父侧笔已落**——现记 21）· 产品文案 2 处 `thincoder-cli/README.md:18` +
  `thincoder-vscode/README.md:22`（**随实施轮已落**——twenty-one / 21 provider presets）；归档面（`_archive/**`）不改。另 `thincoder-vscode/README.md:92` 的
  `doubao-pro-32k` 行属 D-13 **改值**同变面（非计数）⇒ 计入 §9.9 上报清单 5（已随实施轮改指新值）。清单已列全（**12** 处），逐处落位见各 file:line。

### 9.8 验收标准回指（逐条指回批次档 §1.3 + §1.7-① 新登 AC-9）

| 批次档 | 本设计落点 | 机检判据（用例号 = §9.9）|
|---|---|---|
| AC-1 | §9.2 / §9.3 | **五**在册名 `specForModel(...)` 命中**独立行** + 逐字段等值（A-1..A-3）；hy3 视觉 = 不声明、seed 两档 = `true`（A-12）|
| AC-2 | §9.3 等级列 | 未证字段行注含「参考实配 / 网络口径 / 官方口径」字样（A-4）；两 preview 名 = 在场但无实测 ⇒ 尺寸行（A-5）|
| AC-3 | §9.4 | 转售名逐名断言命中行与取值（A-6..A-9），宿主耦合字段逐名认账、未在册名退化（A-9）|
| AC-4 | §9.5 | 结论落档 + 自有工具面关键字零使用可机检（A-10）|
| AC-5 | §9.6 | P-1 预设数 20→21 · P-2 `tokenhub` 字段等值 · P-3 漂移白名单只减不增 · P-4 `volcengine.maxTokens` 随改指模型同变（`131072`）|
| AC-6 | §9.7 测试面 | 三端 `test` 全绿 + 新用例覆盖**五名**逐字段 + 两族枚举各自七值、行独立（A-12）|
| AC-7 | 本节 | `node scripts/doc-check.mjs` ⇒ 悬空 0 · 行宽 0（2026-09-20 收口实跑：`OK(锚)` / `OK(行宽)`）|
| AC-8 | §9.6 载荷面 | B-1..B-6 离线断言 `reasoning_effort` 载荷形状（B-5/B-6 属 AC-9 面）；活体一轮 = 父侧执行 |
| AC-9（§1.7-① 新登）| §9.6 D-14 + §9.7 `thincoder-core/provider/core.mjs` | B-5 离线断言：`hy3` + `thinking:null` ⇒ 体携 `reasoning_effort:"none"`，且同用例五 guard 零变面全部成立（§9.9）；后台路径副作用 = B-6；活体 off 一轮（tok=0 / rc 消失）= 父侧执行 |

上报编号口径：本设计**不新设** CH-x 体系（批次档 §1 无编号上报面）⇒ 上报面统一为 §9.9 表末**清单**的序号，
正文引用一律写「§9.9 清单 N」（父侧以该清单为准）。

### 9.9 用例表（正常 / 边界 / 错误）

规格表面（`thincoder-core/test/model-specs.test.mjs`）：

| 号 | 类 | 输入 | 期望 |
|---|---|---|---|
| A-1 | 正常 | `specMatch("hy3")` | `matched:true` + `thinking:true` / `thinkApi:"effort"` / 枚举 `deepEqual ["none","minimal","low","medium","high","xhigh","max"]`（受理级七值） / `maxOutput:128_000` / `context:256_000` |
| A-2 | 正常 | `("doubao-seed-2-0-code-preview-260215")` | `matched:true` + 七档枚举（含 `"max"`）+ `multimodal:true` + `maxOutput:131_072` |
| A-3 | 正常 | `("doubao-seed-2-0-lite-260428")` | `matched:true`，与 A-2 字段同值（同族全针，批次档 §1.2 lite 行）|
| A-4 | 边界 | 未证字段行注文本 | hy3 族尺寸行注含「参考实配 / 网络口径」、seed context 含「官方」——证据等级词逐字在场（等级列 = §9.3）|
| A-5 | 边界 | `("hy4-preview")` / `("hy3-preview")` | `matched:true` + 能力位**全不声明**（`thinking` / `thinkApi` / 枚举 / `multimodal` 均 `undefined`）+ 仅尺寸行 |
| A-6 | 正常 | `("deepseek-v4-flash")` | 命中同名行、值零变化（`thinkApi:"type"` + 枚举 `low/high/max` + 384 000 / 1 000 000 / `prefixMode`）|
| A-7 | 正常 | `("glm-5.3")` | 命中既有行（128 000 / `noUsageStream` / `tempRange`）——**无渠道限定行**（§9.4 D-12）|
| A-8 | 边界 | `("kimi-k3")` | 命中既有行 + `partialMode:true` 原样（转售通道未验证 ⇒ 行值不改、认账入 §9.4 表）|
| A-9 | 错误 | `("deepseek-v3.1")`（tokenhub 有售 · 原厂无行）| `matched:false` + `specForModel` 落 `DEFAULT_SPEC`（32 000 / 128 000）+ 首请求告警一次——**不补托底行**（§9.4 D-12）|
| A-10 | 边界 | grep `thincoder-core/tools/` 内 `minLength/maxLength/minItems/maxItems/minContains/maxContains` | 命中 0（§9.5 判据的回归护栏：关键字一旦入自有 schema ⇒ 兼容层复访条件成立）|
| A-11 | 正常 | qwen / deepseek / glm / kimi 既有名回归 | 与 §2.1 表值零变化（防五新行前缀遮蔽波及；`SORTED_SPECS` 降序面）|
| A-12 | 正常 | hy3 枚举 vs seed 枚举 | 两数组各自 `deepEqual` 七值（同值集）且**行独立**（改一行不动另一行——AC-1/AC-6 判据：受理级 ≠ 校验级，互不污染）|

载荷与渠道面（`thincoder-core/test/provider-merge.test.mjs` 收口实读 **307** 行（`split` 口径；+~50 已落）；`thincoder-core/test/config-presets.test.mjs` 批内已建 · **52** 行）：

| 号 | 类 | 输入 | 期望 |
|---|---|---|---|
| B-1 | 正常 | `hy3` + `reasoningEffort:"none"` | 请求体携 `reasoning_effort:"none"` |
| B-2 | 错误 | `hy3` + `"zzz"`（**域外值**——七值受理集外）| **抛错**含 `not supported by model` 与合法档位（现状门 `thincoder-core/provider/core.mjs:198-203`，形态参照 = 同表 §6 用例 T-8）|
| B-3 | 边界 | 无枚举名（`hy4-preview`）+ 任意档位 | 原样透传（无校验 = 现状零变化）|
| B-4 | 正常 | seed-code + `"max"` | 携 `reasoning_effort:"max"`（七档全通过）|
| B-5 | 正常 | `hy3` + `thinking:null` 且无 `reasoningEffort`（**D-14 · AC-9**）| 请求体携 `reasoning_effort:"none"`；同一用例内五个 guard 零变面同断：`hy4-preview` + `thinking:null` ⇒ 无该字段（无枚举）/ `hy3` + `reasoningEffort:"low"` ⇒ 只携 `"low"`（显式档优先）/ `qwen3.6-flash` + `thinking:null` ⇒ `enable_thinking:false` 照发且多携 `reasoning_effort:"none"`（同义）/ `kimi-k3`（枚举无 `none`）+ `thinking:null` ⇒ 无该字段 / **`x/hy3`（路由形态名——命名空间剥离后命中 `hy3` 行）+ `thinking:null` ⇒ 无该字段（子句复用 `thincoder-core/provider/core.mjs:196-197` 的 `!isRouter` 门）** |
| B-6 | 边界 | 后台路径形态：`hy3` + `thinking:null`、无 effort（模拟 `thincoder-core/context.mjs:401` / `thincoder-core/explore-distill.mjs:98` 的 `{...provider, thinking:null}`）| 同样携 `reasoning_effort:"none"` = **认账交付**（§9.6 副作用面：后台调用不再想，与 qwen 侧同方向）——断言防「误当缺陷改掉」|
| P-1 | 正常 | `Object.keys(PROVIDER_PRESETS).length` | `21`（CLI `thincoder-cli/test/config-merge.test.mjs:28` + VSC `:132` 同批改值，标题「20 条」→「21 条」，文件头覆盖注 `:5` / `:4` 随变）|
| P-2 | 正常 | `PROVIDER_PRESETS.tokenhub` | `baseURL === "https://tokenhub.tencentmaas.com/v1"` + `model === "hy3"`（命中规格行）+ 无 `thinking` / `reasoningEffort` / `maxTokens` 键（D-13「不设 = 不发」）|
| P-3 | 边界 | 逐预置 `specMatch(p.model).matched` | 除白名单 {`hunyuan`, `siliconflow`, `groq`} 外全部 `true`；`volcengine` 本批出名单（改值后命中）；白名单**只减不增** |
| P-4 | 正常 | `PROVIDER_PRESETS.volcengine.maxTokens` | `131072`（= seed-code 实测输出上限；随 `model` 改指同变——§9.6 D-13 ② 追注的代码面落点 · 用例 `thincoder-core/test/config-presets.test.mjs:49-51`，批 DR-5 已落）|

**上报清单（本设计不自修，逐条交父侧）**：
1. AC-1 在册名已由批次档 §1.8-② 补登为**五名**（`hy3` / `hy3-preview` / `hy4-preview` / seed 两档）——字面缺口闭合
   （`docs/batches/2026-09-20-channel-onboarding.md:44`/`:49` 现列五名；§9.8 AC-1 / AC-6 行文本轮随同变）；VSC 探测下拉对
   两 preview 档位空 = 已认账（§9.3 D-11 代价句）。
2. `hy4-preview` 尺寸无 §1.2 证据行 ⇒ 取 hy3 族参考实配同值 = **同族沿用级**（§9.3 `maxOutput` / `context` 行注逐字标）。
3. §9.4 逐名认账表的**取值全部为原厂行现值**（本轮实跑 `specMatch` 核对：glm 族 128 000 / `noUsageStream`、minimax-m3
   128 000 / `thinkEnabledValue:"adaptive"`、kimi-k3 131 072 / `partialMode` + `reasoningEcho:"required"`、deepseek-v4 两档
   384 000 / `prefixMode` + `reasoningEcho:"required"`）。批次档 §1.2 对转售名**未给逐项实测** ⇒ 宿主耦合字段在网关侧行为未验证 =
   认账（AC-3 采「沿用 + 公开登记 + 随台账 #11 巡检」判，不加渠道限定行 = D-12）。
4. D-14（effort 族渠道「off 静默失效」修法）**已获父侧批准（批次档 §1.7-① · 新登 AC-9）**⇒ 由「待批」转为本批
   交付项（落点 §9.6 / §9.7 / 用例 B-5）；本条保留 = 上报面完整性（它仍是「超出批次档 AC 字面清单的项」，现已成 AC）。
5. 预设 20→21 的**主 agent 笔**面：`docs/core/requirements/PROJECT.md:30`（需求档 C3「当前全集 20 个」）+ 产品文案
   `thincoder-cli/README.md:18`（twenty providers）/ `thincoder-vscode/README.md:22`（20 provider presets）+ VSC README 预设表
   `:92` 的 `doubao-pro-32k` 行（随 D-13 改值）。设计侧改两处：`docs/core/design/PROVIDER.md:168`（§6.11 计数）+ `:274`（§6.19 计数与来源坐标，评审轮 1 #1）。
   **收口实况（2026-09-20 逐处复核）**：需求档 / 两 README / VSC README `:92` / 设计侧两处均已落（21 与改值名在盘）——本条留存 = 上报面完整性。
6. **§9.11 发现（不阻塞）**：VSC 思考下拉的枚举源 = spec（`thincoder-vscode/src/extension/provider-probe-window.mjs:66`
   `spec.reasoningEffortEnum || (spec.thinking ? ["enabled"] : [])`；快照面 = `thincoder-vscode/src/extension/settings.mjs:210-215`
   `:213`，下拉构造 = `thincoder-vscode/webview/settings-state.js:36-49`）⇒ 两 preview 名空档 = 已认账（D-11）；而 **CLI 侧下拉
   对未在册名回退全档**（含 `max`/`xhigh`）⇒ 同一症状两端行为不一致（VSC 空 / CLI 全档），批次档 AC-6 字面只覆盖 VSC ⇒
   本批 **CLI 侧零改**（已入 §9.10 边界），差异登记待父侧处置（可入台账巡检）。
7. **五新名的 VSC 端差默认档未登记（评审轮 1 #6 · 修法越批 ⇒ 只上抛）**：端差默认档表 `EFFORT_DEFAULT_PREFIXES`
   （`thincoder-vscode/src/specs.mjs:22-36`，13 条前缀）只覆盖 deepseek / kimi / glm / qwen 族，五新名全不命中 ⇒ 落兑底链
   「`entry.effortDefault`（未命中 = `undefined`）`|| levels[0] || null`」（`thincoder-vscode/src/specs.mjs:38-52` +
   `thincoder-vscode/webview/settings-state.js:48`）= **枚举首项**：`hy3` / seed 两档 = `"none"`（下拉默认显 off）、两 preview =
   `null`（空档）。现状后果 = 首次切到新名时 VSC 面板默认「关思考」（与 §9.11 档位行同面、本批已认账）；修法 = 五新名登记进
   `EFFORT_DEFAULT_PREFIXES`（VSC 产品码改码）= **越本批边界**（本批 VSC 侧零改）⇒ 处置交父侧（后批登记 or 维持端差兑底）。
8. **`thincoder-core/test/model-specs.test.mjs` 越 300 软线——已裁已落（收口闭合）**：设计预估 ~305、收口实读 **415**（`split` 口径；`wc -l` 414）⇒ 越线成立
   （机检面 = `thincoder-core/test/core-hygiene.test.mjs:117-131`：`walk(ROOT)` 无 test 目录排除、注册键 = 核内相对路径）。处置 = 批次档 §1.10-④ 预裁
   「**不拆档——单档内聚**」——登记已落（`SOFT_LINE_REGISTRY:55`）；拆分计划落点 = `CORE-UNIFICATION.md` §2.8.1 子表行 12 / 13；消解窗口 = 越 500 硬限前
   或该档下次实质改动时。与 §9.7 行数上限段同源。

### 9.10 本节边界（不做什么）

- 不登记**未开通**名（`doubao-seed-2-1-*` = ModelNotOpen，批次档 §1.2 / §1.4）——开通后随台账 #11 巡检补行。
- 不为两族登记音频/视频模态位（产品无发送路径，同 §2.7 判）。
- 不引入方舟 schema 剥除兼容层（§9.5 实测裁定），亦**不**为兼容层预建字段。
- 不为转售名增设渠道限定行、不给 `lookupSpec` 扩 provider 维度（§9.4 D-12——机制变更越本批边界）。
- 不改 `resolveEnableThinking`（`thincoder-core/config.mjs:133-140`——百炼主机门控专属，与两新渠道的关系已核对 = §9.6，非改码对象）。
- 不改三端 effort UI 形状、不改用户 `config.json`、不建 Anthropic Messages 通道（hy4 标称支持，非本批目标）。
- 不修 VSC 端差默认档面（五新名未登记 `EFFORT_DEFAULT_PREFIXES` ⇒ 面板默认档落枚举首项）：本批 VSC 侧零改，认账与上抛 = §9.11 / §9.9 清单 7。
- 不做 TokenPlan 订阅端点（`api.lkeap.cloud.tencent.com/plan/v3` 同 key 401 ⇒ 未订阅）与方舟 Coding 订阅端点（`/api/coding/v3` 400 `InvalidSubscription`）——`docs/batches/2026-09-20-channel-onboarding.md:§1.4`。
- 不引入自动探测 / 在线校正——规格仍人工登记（`docs/batches/2026-09-20-channel-onboarding.md:§1.4`）。
- 不改 CLI 思考档位下拉的托底形态（未在册名回退全档 = `thincoder-cli/src/tui/cmd-think.mjs:16` 现状；两端差异已上报 §9.9 清单 6）。
- AC-9 **不区分**「用户显式 off」与「内部静默 off」（`thinking:null` 单标记，三处生产者见 §9.6 副作用面）⇒ 不得为区分而新增
  provider 字段或改 `resolveEnableThinking`（百炼主机门控专属，上条已列边界）。
- 本节不落实现——改码 = eng-coder，需本批 designToken。

### 9.11 UI/交互决策（全落地，无 open）

| 面 | 决策 |
|---|---|
| CLI `/models`（名 + 上下文）| 五新行显示 `256K`；未在册转售名（`deepseek-v3.1` 类）显示 `128K` + 现状告警——与 §8 百炼未在册名同判 |
| CLI `/think <effort>` 档位行 | hy3 / seed 两族同列 `effort: none/minimal/low/medium/high/xhigh/max`（七值——hy3 受理级 · seed 校验级）；无枚举名（两 preview）= 回退档 `high\|max`（`thincoder-cli/src/tui/cmd-think.mjs:16` 现状，本批零改）|
| CLI 思考开关行 | hy3 / seed 族 `thinking:true` ⇒ off 载荷 = `reasoning_effort:"none"`（**D-14 已批准 · AC-9**，判据 = 用例 B-5）；显示面零改 |
| VSC 思考下拉 | 零改码：枚举源 = spec ⇒ `hy3-preview` / `hy4-preview` 档位空 = **认账**（代价句 = §9.3 D-11；两端差异 = §9.9 清单 6）；五新名**默认档** = 枚举首项（hy3 / seed 两族 `"none"` · 两 preview `null`）= 端差表未登记所致，**已认账**（后果与上抛 = §9.9 清单 7）|
| 面板 `max_output` / `context` 显示 | 双栏形状同 §8（证据等级由行注承载，显示面不区分等级）|

## 10. glm-5.3-flashx 独立规格行（2026-09-20 快车道批 · 单行新增）

> 需求面 = `docs/batches/2026-09-20-glm53-flashx-row.md` §1（台账 #20）；批次条目 = 同档 §2.1。
> §1–§9 机制不变；本节为单行新增批交付面（形状循 §9 先例）。

### 10.1 方案与理由

- **独立行新增，不修 `glm-5.3-flash` 行**（开放项 批档 §1.5-② 裁定）：flashx 是独立模型档，
  131_072 为校验级实测（批档 §1.2 400 原文），flash 的 128_000 是其自身口径——AC-3 钉
  「既有 glm 族回归零变化」。先例 = `deepseek-v4.1-flash`（2026-09-15 DEEPSEEK-QWENPLAN 批）
  · `hy3` 族三行（§9）。
- **落位**：GLM 段 `glm-5.3-flash`（`thincoder-core/model-specs.mjs:53`）与 `glm-5.2`（`:54`）
  之间。`SORTED_SPECS` 按名长降序预排（`thincoder-core/model-specs.mjs:153`——**as-of 读数**：
  同档 §2.1（`:57`）与变更记录「修复轮 #11」条均记 `:130`，坐标以实施轮实读复验为准；**收口核销值 = `:161`**（实施轮 #4 实读，父侧复验））⇒
  flashx(14) > flash(13) > 5.3(7) 自洽，长前缀优先天然成立（用例 F-1 钉住）。
- **「始终思考」= 仅行注，不加机制位**（开放项 批档 §1.5-① 裁定）：枚举
  `["low","high","max"]` 无 `none` ⇒「off 不可达」已由枚举本身表达
  （`thincoder-core/provider/core.mjs:213-219` D-14 五 guard 第 4 面 `includes("none")`
  = false ⇒ off 载荷惰性不发字段）；机制无此字段、无消费者 ⇒ 加字段 = 死字段（同 §2.7
  D-10 判）。先例 = `glm-5.3` 行注（`thincoder-core/model-specs.mjs:50-51`）。
- **零机制改动**：查表 / 排序 / off 路径机制全部不动（零改面 = §10.4）。

### 10.2 表变更清单（一行新增，零删除、零改既有行）

| 位置 | 新行 | 取值 |
|---|---|---|
| `thincoder-core/model-specs.mjs:53` 与 `:54` 之间 | `["glm-5.3-flashx", { … }]` | §10.3 口径表 |

### 10.3 字段口径表（逐字段 + 证据等级；批档 §1.2 取证表同源）

| 字段 | 值 | 证据等级 |
|---|---|---|
| context | 1_000_000 | 族沿用（网络口径——未探边） |
| maxOutput | 131_072 | **校验级**（400「max_tokens…限制数值范围[1,131072]」） |
| thinking | true | 实测（disabled → 400；裸请求 rc=61 默认开） |
| multimodal | true | 实测（8×8 纯红 PNG → 答「红色」） |
| reasoningEffortEnum | ["low","high","max"] | **校验级**（400 原文点名：low/high/max 受理，其余拒绝） |
| cacheMode / thinkApi / reasoningEcho / tempRange / noUsageStream | "auto" / "type" / "optional" / [0,1] / true | 族沿用（前缀命中路径日常在用） |

「族沿用」字段的 F-2 期望值**推导规则**：以实施轮实读 `glm-5.3-flash` 行
（`thincoder-core/model-specs.mjs:53`）的现行键集/值逐字为准，未声明键不进期望对象；
上表字面清单仅作 as-of 参考（某键若为「不声明 = optional」形态，deepEqual 照此规则自然成立，
不逼实施侧补造声明）。

行注（AC-2 承载面）证据等级词 = **实测 / 校验级 / 族沿用**——用例 F-5 断言（断言面不变）；
行注「始终思考」句内补记：**off 动作在 UI 侧为 no-op**（`thinkApi:"type"` + 枚举无 `none`
⇒ D-14 guard 短路不发字段，服务端无关闭路径）——静默失配自行注可发现，认账面 = §10.9。

### 10.4 消费面契约（本批动谁、谁零改）

- **动**：`thincoder-core/model-specs.mjs`（+1 行 + 行注）·
  `thincoder-core/test/model-specs.test.mjs`（F-1..F-5）· 本设计档（本节 + 变更记录）。
- **零改**：CLI（`cmd-think.mjs` 档位行枚举驱动，flashx 自动显示三档）· VSC（
  `specs.mjs` 端差表零改——`EFFORT_DEFAULT_PREFIXES` 既有 `glm-5` 族前缀条目即命中 flashx，
  其默认档 `max` 在新枚举内合法）· `thincoder-core/provider/core.mjs`（`resolveEnableThinking`
  qwen 白名单对 glm 恒 undefined——`thincoder-core/config.mjs:133-140` 零影响）·
  `PROVIDER.md`（渠道机制无变）。

### 10.5 影响文件清单（预读 · split 口径 · as-of 2026-09-20 设计轮）

| 文件 | 现行数 | 预期 | 拆分计划 |
|---|---|---|---|
| `thincoder-core/model-specs.mjs` | 253 → **261**（收口实读） | ~259（<300 软限） | 无需 |
| `thincoder-core/test/model-specs.test.mjs` | 415 → **468**（收口实读） | ~460（<500 硬限） | 无需（不拆档豁免已登记：`thincoder-core/test/core-hygiene.test.mjs:55`；拆分计划落点 = `CORE-UNIFICATION.md` §2.8.1） |
| `docs/core/design/MODEL-SPECS.md` | 837 | ~940 | 本节 + 变更记录一条 |

### 10.6 验收标准回指（逐条指回批档 §1.3）

| AC | 判据 | 用例 |
|---|---|---|
| AC-1 | `specForModel('glm-5.3-flashx')` 命中独立行：`multimodal:true` · `maxOutput:131_072` · 枚举 `["low","high","max"]` · `thinking:true` | F-1 / F-2 |
| AC-2 | 未实测字段行注含「族沿用」字样 | F-5 |
| AC-3 | 既有 glm 族回归零变化；排序面 flashx 先于 flash 不破坏 | F-3 / F-1 |
| AC-4 | 三端测试全绿 + doc-check 零新增 | 批档 §6 收口实跑 |

### 10.7 用例表（`[flashx]` 段 · F-1..F-5 · 循 `[onboard]` 段先例）

| 用例 | 类 | 输入 / 动作 | 期望 |
|---|---|---|---|
| F-1 | 正常 | `specMatch("glm-5.3-flashx")` | `matched:true` 且 `spec.maxOutput === 131_072`（≠ 128_000 即证非蹭 flash 行，排序面同证） |
| F-2 | 正常 | `specForModel("glm-5.3-flashx")` | §10.3 全字段 deepEqual |
| F-3 | 回归 | `glm-5.3` / `glm-5.3-flash` 查表 | 两行逐字段零变化（FAMILY_BASELINE 形状先例） |
| F-4 | 结构 | `TABLE_ROW_NAMES` | 含 `glm-5.3-flashx`（防空扫） |
| F-5 | 锚 | `rowNote("glm-5.3-flashx")` | 含「族沿用」+「校验级」 |

### 10.8 边界（本节不做）

- 不探 context 上限（沿用族口径 + 行注）；不动 `glm-5.3-flash` 行 128_000（残留上抛 =
  批档 §2.6——语义面，后续批以同法取证后修正）；不动 VSC / `PROVIDER.md` / CLI 产品码。
- 不新增「始终思考」机制字段（§10.1 裁定）；不改排序 / 查表 / off 路径机制。
- 不测 flashx 在 tokenhub / dashscope 的转售差异（批档 §1.4）。
- 本节不落实现——改码 = eng-coder，需本批 designToken。

### 10.9 UI/交互决策（全落地，无 open）

| 面 | 决策 |
|---|---|
| CLI `/models` | flashx 显示 `1M`（context 族口径；证据等级由行注承载，显示面不区分） |
| CLI `/think effort` 档位行 | flashx 列 `effort: low/high/max`（枚举驱动零改码）；off 标记经 D-14 guard 对 `thinkApi:"type"` 行不发字段（现状族形——与 `glm-5.3` 同，off 不可达 = 服务端 400，非本批对象） |
| VSC 思考下拉 | 零改：flashx 落既有 `glm-5` 族前缀条目，默认档 `max`（新枚举内合法）；档位行自动 = 枚举三档 |

## 11. qwen3.6 系五名独立规格行（2026-09-20 快车道批 · 五行新增）

> 需求面 = `docs/batches/2026-09-20-qwen36-family-rows.md` §1（台账新需求条目随该档 §6 核销）；批次条目 = 同档 §2.1。
> §1–§10 机制不变；本节为五行新增批交付面（形状循 §10 先例）。

### 11.1 方案与理由

- **五名同形独立行，不修既有行**：批档 §1.2 活体取证五名每名 10 针全绿、字段面完全同形
  （枚举六档止于 xhigh / maxOutput 65_536 / 视觉受理 / 默认思考开）⇒ 一套字段口径 × 五名，
  每名独立一行（同值集 ≠ 同行——§9 `[onboard]` A-3 形状先例）。既有 qwen3.7/3.8 行零触碰（AC-3）。
- **独立行必要性**：qwen 泛前缀托底行已随 qwen 批删除（§2.4）⇒ 未登名落 DEFAULT_SPEC
  （128K / 32K / 无视觉 / 无枚举），maxOutput 与枚举双失真坐实（65_536 ≠ 131_072；
  `max` 非法档位无从拦截）。
- **落位**：qwen 段末尾——`thincoder-core/model-specs.mjs:96`（「No generic qwen fallback
  row」注释块末行）与 `:97`（MiniMax 段注释）之间插入五行；行序 = flash / plus / max-preview /
  27b / 35b-a3b（表插入序；`SORTED_SPECS` 派生序由机制自排，§11.8）。
  （**锚核 2026-09-20 修正轮 · 实读**：`:73-79` = 3.7/3.8-flash 共享行注块 · `:83-92` =
  omni/27b 行注块 · `:94-96` = fallback 注释块 · `:97` = MiniMax 段注释 ⇒ `:96`/`:97` 为真锚，
  批档 §2.2 原记 `:93`/`:94` 系预读坐标漂移，已同步同锚。）
- **零机制改动**：查表 / 排序 / off 路径 / VSC 端差机制全不动——五名 off **可达**
  （`none` / `minimal` 实测 rc=0 可关，D-14 guard `includes("none")` = true ⇒ off 载荷
  正常下发），无 §10 flashx 那样的 no-op 失配面。

### 11.2 表变更清单（五行新增，零删除、零改既有行）

| 位置 | 新行 | 取值 |
|---|---|---|
| `thincoder-core/model-specs.mjs:96` 与 `:97` 之间 | `["qwen3.6-flash" / "qwen3.6-plus" / "qwen3.6-max-preview" / "qwen3.6-27b" / "qwen3.6-35b-a3b", { … }]` 共 5 行 | §11.3 口径表 |

行注形态：**家族共享证据块**（首行 `qwen3.6-flash` 上方——五名同形 ⇒ 取证叙述落一处全量）+
plus / max-preview / 27b / 35b-a3b 各一行单行注（证据词在场，细则 = 实施轮自由度）；
`qwen3.6-35b-a3b` 单行注另含「MoE」后缀说明（开放项 批档 §1.5-② 裁定 = 行注承载）；
max-preview 单行注另如实记录视觉证据波动（纯红图答「黑色」= 抽样波动、通道 ✓——批档 §1.2）。

### 11.3 字段口径表（逐字段 + 证据等级；批档 §1.2 取证表同源）

| 字段 | 值 | 证据等级 |
|---|---|---|
| context | 1_000_000 | 官方口径（未探边；行注标明文档口径非 API 实测） |
| maxOutput | 65_536 | **校验级**（400「Range of max_tokens should be [1, 65536]」；65536 → 200） |
| thinking | true | 实测（裸请求 rc=143–239 默认开；`none` / `minimal` rc=0 可关） |
| multimodal | true | 实测（64×64 纯红 PNG 五名受理） |
| reasoningEffortEnum | ["none","minimal","low","medium","high","xhigh"] | **校验级**（400 原文点名六档；`max` → 400——3.6 系无 max，≠ 3.8 系七档） |
| partialMode / cacheMode / thinkApi / tempRange | true / "none" / "effort" / [0,2] | 族沿用（qwen3.7/3.8 行先例——非独立实测） |
| reasoningEcho | 不声明 | 跨轮回声未验（R-4 口径——optional 现状零变化） |
| reasoningEffortDefault（VSC 端差） | "high" | 族沿用（qwen3.7-flash 先例；官方默认未探——复访条件：官方默认口径确认后升级证据等级） |

「族沿用」字段的 Q-2 期望值**推导规则**：五名同形实证 ⇒ 期望对象 = 运行时推导
`{ ...specForModel("qwen3.7-flash"), maxOutput: 65_536 }`——全字段 deepEqual 语义下未声明键
（reasoningEcho）自然不进期望；**禁字面清单**（T-13 信息性字段闸 =
`thincoder-core/test/model-specs.test.mjs:260` 全仓测试面计数冻结，新档含该字面即时红）。
3.7-flash 行若未来漂移，Q-2 期望自动跟随（推导式红利，循 §10.3 推导规则先例）。

VSC 端差字段不在核表：核规格行无 `reasoningEffortDefault`（端侧扩展面——
`thincoder-vscode/src/specs.mjs:22` 端差表持有）。

### 11.4 消费面契约（本批动谁、谁零改）

- **动**：`thincoder-vscode/src/specs.mjs` `EFFORT_DEFAULT_PREFIXES` +5 条目（qwen 段
  `thincoder-vscode/src/specs.mjs:35` 后插入；运行时最长优先扫描 ⇒ 条目序无关；
  快照名 `qwen3.6-flash-2026-04-16` 前缀命中 `qwen3.6-flash` 条目同得 "high"——与核查表
  继承意图一致，父侧裁定 批档 §1.2「快照不登」的配套行为面）。
- **零改但行为受益（链路现成）**：`thincoder-vscode/webview/settings-state.js:48`
  （`defaultEffortFor` 读 `effortDefault`，端差未命中才回落枚举首项）·
  `thincoder-vscode/src/extension/provider-probe-window.mjs:67`（模型行 `effortDefault`
  直读 spec）——本批登记后两处消费面自动生效，零码改。
- **零改**：CLI 产品码（on 默认档 = 枚举首个非 `"none"` 档 =
  `thincoder-cli/src/tui/cmd-think.mjs:131` qwen 批修法产物，机制现成）· 核查表 / 排序 /
  off 路径机制 · `thincoder-core/test/run.mjs`（单层 glob 自动收集新测试档——
  `thincoder-core/test/run.mjs:42`，启动器零清单改动）。

### 11.5 影响文件清单（预读 · split 口径 · as-of 2026-09-20 设计轮）

| 文件 | 现行数 | 预期 | 变更 |
|---|---|---|---|
| `thincoder-core/model-specs.mjs` | 261 | ~273 | +5 表行 + 行注块（§11.2 落位）；300 软限内 |
| `thincoder-core/test/model-specs-qwen36.test.mjs` | **批内新建** | ~150 | `[qwen36]` 段 Q-1..Q-6 · Q-8——**500 硬限拆分载体**（`thincoder-core/test/core-hygiene.test.mjs:123` 硬红判据，登记表只适用 300–500 段 ⇒ 主档 append-only 不可行）；新文件 ≤300 软限、零登记 |
| `thincoder-core/test/model-specs.test.mjs` | 468 | 468 | **零触碰**（三段/四段已收口面不动、老段不迁移——拆分 = 新文件承载） |
| `thincoder-vscode/src/specs.mjs` | 84 | ~89 | `EFFORT_DEFAULT_PREFIXES` +5 条目 |
| `thincoder-vscode/test/image-downgrade.test.mjs` | 253 | ~271 | +`[qwen36]` 段 Q-7（append-only，不扩改既有 T-10/T-15）；≤300 ✓ |
| `docs/core/design/MODEL-SPECS.md` | 950 | ~1070 | §11（本节，设计轮自笔）+ 变更记录一条 |

### 11.6 验收标准回指（逐条指回批档 §1.3）

| AC | 判据（§1.3 原文） | 承载 |
|---|---|---|
| AC-1 | 五名各命中独立行（非前缀兜底）：`maxOutput:65_536` · 枚举六档 · `thinking:true` · `multimodal:true` | Q-1 / Q-2 / Q-3 · Q-8（max 拒收负证） |
| AC-2 | 未实测字段行注含「族沿用」/「官方口径」字样 | Q-6 |
| AC-3 | 既有 qwen3.7/3.8 族回归零变化；五新行排序面不遮蔽既有名 | Q-4 / Q-5 + §11.8 读码核 |
| AC-4 | VSC 端差表处置裁定（= 登记 "high"，批档 §1.5-①）+ 三端测试全绿 + doc-check 零新增 | Q-7 + 收口实跑（批档 §6） |

### 11.7 用例表（`[qwen36]` 段 · Q-1..Q-8 · 循 `[flashx]` 段先例）

Q-1..Q-6 · Q-8 落新建核测试档（`thincoder-core/test/model-specs-qwen36.test.mjs`——批内新建，
不带行号坐标防悬空锚）；Q-7 落 VSC 既有档新段。四类齐全：正常 = Q-1 / Q-2 / Q-7；
边界 = Q-3（max 缺失 + 快照继承）/ Q-5；回归护栏 = Q-4 / Q-6；错误 = Q-8。

| 用例 | 断言 |
|---|---|
| Q-1 | 五名 `specMatch` 均 `matched:true`（精确命中非兜底）且 `maxOutput === 65_536`（≠131_072 即证非蹭 3.7/3.8 行）；五行对象两两 `notEqual`（行独立——A-3 形状） |
| Q-2 | 五名全字段 deepEqual = 运行时推导 `{ ...specForModel("qwen3.7-flash"), maxOutput: 65_536 }`（五名同形 ⇒ 单推导式通吃；3.7-flash 行漂移自动跟随；T-13 字面闸安全） |
| Q-3 | 枚举形状锚：五名 deepEqual `["none","minimal","low","medium","high","xhigh"]`（服务端原文序 · 首项 `"none"`——D-5 禁重排）；`includes("max") === false`；与 `qwen3.8-max` 行枚举 `notDeepEqual`（同带 max 字样的跨版本行不同值集，防抄错源） |
| Q-4 | 既有 qwen 族 6 行（3.7-max / 3.7-flash / 3.8-flash / 3.8-max / 3.8-omni-flash / 3.8-27b）逐字段零变化 + 五新名 × 既有行名非前缀循环（A-11 形状）；期望对象/字段清单**不含 `cacheMode` 键**（D-10 信息性字段、零行为面——硬约束① T-13 字面闸安全），其余字段逐字面 |
| Q-5 | `TABLE_ROW_NAMES` 含五名（防空扫——`>= 40` 正控先例） |
| Q-6 | `rowNote` 五名各含「校验级」「官方口径」「族沿用」；`qwen3.6-35b-a3b` 行注另含「MoE」 |
| Q-7（VSC `thincoder-vscode/test/image-downgrade.test.mjs` 新 `[qwen36]` 段） | 五名 `reasoningEffortDefault === "high"` 且 ∈ 枚举（**不落首项 "none"**——qwen 批 §2.8 首项陷阱负证）；快照名前缀命中母名条目亦得 "high" |
| Q-8 | 错误面：`qwen3.6-flash` + `reasoningEffort:"max"` ⇒ 本地抛错含 `not supported by model` 且合法档位清单 = 六档（`thincoder-core/provider/core.mjs:198-203` 门——T-8 / B-2 先例形态；枚举入册后 `max` 由「透传吃服务端 400」变「本地抛错」） |

新档实施约束（设计钉死）：① 全文禁含 `cacheMode` 字面（T-13 全仓测试面计数闸——
`thincoder-core/test/model-specs.test.mjs:259-260` 基线逐档冻结）；② helpers
（`SPEC_SOURCE` / `TABLE_ROW_NAMES` / `rowNote` / `assertFields` / `EFFORT_6`）就地重定义、
零 import 主测试档（主档无导出面，动了即破零触碰）。

### 11.8 排序面读码核（批档 §1.2「设计轮核现排序实现语义」销项）

- `SORTED_SPECS` = 对表按 `b[0].length - a[0].length` 降序预排
  （`thincoder-core/model-specs.mjs:161`——五行实长严格降序无并列，比较器稳定性语义不介入）。
- 五名长度 19 / 15 / 13 / 12 / 11，两两互非前缀；既有表**无任何 `qwen3.6` 前缀条目**
  （泛 `qwen` 行已随 qwen 批删除）⇒ 五新名唯一命中面 = 自身精确行，零遮蔽
  （Q-1 命中 + Q-4 非前缀循环钉住）。
- `qwen3.6-max-preview`(19) 与 `qwen3.8-max` 版本号不同位互非前缀，不蹭 max 行；
  日期戳快照长名未登 ⇒ 前缀命中 13 字符 flash 行 = **有意继承非遮蔽**
  （父侧裁定 批档 §1.2「快照不登」）。结论：排序面零机制风险。

### 11.9 UI/交互决策（全落地，无 open）

| 面 | 决策 |
|---|---|
| CLI `/models` | 五名显示 `1M`（context 官方口径；证据等级由行注承载，显示面不区分） |
| CLI `/think effort` 档位行 | 五名列 `effort: none/minimal/low/medium/high/xhigh`（六值枚举驱动零改码）；off 可达 = 实测（`none` / `minimal` rc=0）——与 §10 flashx 不同，无 no-op 失配面 |
| CLI `/think on` 默认档 | = 枚举首个非 `"none"` 档 = **minimal**（`thincoder-cli/src/tui/cmd-think.mjs:131` 机制现成）——与 VSC 默认 `high` 分叉 = 已知后果，不并入本轮（qwen 批 §3 发现 #10 同款裁定注，防后续当缺陷返工） |
| VSC 思考下拉 | 五名默认档 = **high**（§11.4 端差登记）；档位行自动 = 枚举六档（零改码）；快照名同得 high（前缀扫描） |
| 面板 `max_output` / `context` 显示 | `65_536` / `1M` 双栏（证据等级由行注承载，显示面不区分） |

## 12. MiMo V2.6 三款独立规格行 + v2.5 存量对齐（2026-09-22 快车道批）

> 需求面 = `docs/batches/2026-09-22-mimo26-specs.md` §1（台账 #236）；批次条目 = 同档 §2。
> §1–§11 机制不变；本节为本批交付面（形状循 §10 / §11 先例）。
> 取证源 = 同档 §1.2（本机真端点实测：三款逐款探针 + v2.5 两行同日同测）——本节不重复探测。

### 12.1 方案与理由

- **三款各得独立行**（`mimo-v2.6-pro` / `mimo-v2.6-flash` / `mimo-v2.6-pro-ultraspeed`，2026-09-22 上架）：
  设计轮实跑三名 `specMatch` 全 `matched:false` ⇒ 落 `DEFAULT_SPEC`（128 000 / 32 000 / 无视觉 / 无思考位）——
  上下文 / 输出 / 视觉 / 思考四类能力位**全面低估且静默**（除一次性告警外无可见性）。
- **同形不同行**：三款同批同形（同端点、同参数面、逐款探针全绿）⇒ 一套字段口径 × 三行、每名独立一行
  （同值集 ≠ 同行——§9 `[onboard]` A-3 形状先例）；行独立 = 将来单款取值漂移可单行改。
- **v2.5 两行随批对齐**（同日同测）：`maxOutput` 128 000 → **131_072**（低于服务端实测上限 = 低估，同档 §1.2 对照面）；
  补登记 `cacheMode: "auto"`（实测 `cached_tokens` 18 816）。在役期表值须准；两行**不删**（下线节奏归小米，同档 §1.6）。
- **预设改指 + 对外文本同步**：`mimo` / `mimoplan` 默认模型 → `mimo-v2.6-pro`（v2.5 官网标「即将下线」）；
  VSC README provider 表两行同变；预设 `maxTokens: 131072` 已在位（= 实测上限）零改。
- **零机制改动**：查表 / 排序 / 兜底 / off 路径 / 端差机制全不动；三新款无 effort 枚举 ⇒
  auto-think、consult 钳制、`/think effort` 档位面均与今日同形（§12.4）。

**排序面读码核**（`mimo-v2.6-pro` ⊂ `mimo-v2.6-pro-ultraspeed` 遮蔽自查）：`SORTED_SPECS` 按名**长度降序**预排
（`thincoder-core/model-specs.mjs:178`）⇒ 长名先命中、短名不可能盖长名（现行行为实读：
`specForModel("mimo-v2.5-pro-x") === specForModel("mimo-v2.5-pro")` = true）。三名实长 13 / 15 / 24、**两两无并列**
⇒ 比较器稳定性语义不介入；在册名无 `mimo-v2.6` 前缀条目 ⇒ 三名唯一命中面 = 自身精确行（M-1 / M-4 钉住）。

**关键决策（本批）**：

| # | 决策 | 理由 |
|---|---|---|
| D-1 | 三款各得独立行，不修 / 不删 v2.5 两行 | 同值集 ≠ 同行；v2.5 在役（同档 §1.3 / §1.6） |
| D-2 | `reasoningEcho` 三新款 = `"required"`（族沿用） | 保守策略：两态均安全、零行为回归、覆盖未复现的旧严格条件（同档 §1.4） |
| D-3 | v2.5 信息性字段断言 = **运行时可推导形**（合成键） | AC-3 要值断言、T-13② 禁字面量 ⇒ 两者并存的唯一形态；张力面见 §12.7 实施约束 |
| D-4 | `[mimo]` 用例承载 = **新建核测试档**（非 append 主档） | 主档 467 行 / 500 硬限余量 33 行，9 例（~70 行）append 即越硬限；先例 = `model-specs-qwen36.test.mjs` |
| D-5 | `mimo` / `mimoplan` 预设改指 `mimo-v2.6-pro` | v2.5 将下线；`maxTokens` 与实测上限同值零改（同档 §1.3-3）。**mimoplan 端点未实测**（Token Plan 无 tp- 凭证 ⇒ 未探）= 同平台推断（**unverified**，同档 §1.4）——与 mimo（按量端点实测）证据差在登记面可见 |
| D-6 | MiMo 族头注块按 2026-09-22 复测改写 | 现句「else 400 on follow-ups」与本批复测矛盾——活性面不留已证伪的处方（§12.3 草案）；同一处方面延伸至 `assistantToolCallMessage` 文档串（评审轮 1 #3 裁定 ①；§12.2 / §12.8） |
| D-7 | VSC 端差表 `EFFORT_DEFAULT_PREFIXES` 零改 | mimo 未登记 ⇒ 默认档 = 档位首项（三新款 `"enabled"`）——与 v2.5 同形 = 现状，非本批回归 |

### 12.2 表变更清单

`MODEL_SPECS`（`thincoder-core/model-specs.mjs`，设计轮实读 **53 规格行**）：

| 动作 | 行 | 落位（as-of 2026-09-22 设计轮实读） |
|---|---|---|
| 新增 | `mimo-v2.6-pro` / `mimo-v2.6-flash` / `mimo-v2.6-pro-ultraspeed` | `["mimo-v2.5", …]`（`:120`）与 `["minimax-m3", …]`（`:121`）之间；行序 = pro / flash / pro-ultraspeed |
| 改值 | `mimo-v2.5-pro`（`:119`）· `mimo-v2.5`（`:120`） | `maxOutput` 128_000 → 131_072；各补 `cacheMode: "auto"` |
| 行注改写 | MiMo 族头注块（`:116-118`） | 「else 400 on follow-ups」句按实测改写（§12.3 草案） |
| 文档串改写 | `assistantToolCallMessage` 文档串（`:255-259`；非规格行 ⇒ 53 行计数不变） | 按 2026-09-22 复测原地换写（原「missing field → 400」句已证伪 ⇒ 与 §12.3 行注同一事实陈述；净增 0 行；评审轮 1 #3 裁定 ①） |
| 零改 | 其余 **51** 行（MiniMax / grok / claude / gemini / qwen / TokenHub / Seed 各族） | — |

排序面：`SORTED_SPECS` 派生序由机制自排（`thincoder-core/model-specs.mjs:193`——实施后实读，as-of 2026-09-22）⇒ 表内插入位置不改变匹配优先级。

### 12.3 字段口径表（逐字段 + 证据等级）与行注草案

三新款（同形；下列各款均逐款在验）：

| 字段 | 取值 | 证据等级 |
|---|---|---|
| `context` | `1_000_000` | **官方口径**（官网 + vLLM recipes「up to 1M」；未探边——同 v2.5 行口径） |
| `maxOutput` | `131_072` | **校验级**（400 原文「This model supports at most 131072 completion tokens」+ `max_tokens:131072` → 200；三款逐款） |
| `tempRange` | `[0, 1.5]` | **校验级**（400「temperature must be within [0, 1.5]」；三款逐款） |
| `thinking` | `true` | **实测**（裸请求 `reasoning_content` 在场 + `reasoning_tokens` 3–12；`thinking:{type:"disabled"}` → 200 且 rc 消失；`{type:"enabled"}` → 200） |
| `thinkApi` | `"type"` | **实测**（探针即经 `thinking.type` 两态受理 ⇒ 请求面被服务端认可） |
| `multimodal` | `true` | **实测**（8×8 纯红 PNG 三款受理；pro / flash 答 "Red"；ultraspeed 64 预算截断、512 预算答 "Red"） |
| `cacheMode` | `"auto"` | **实测**（同前缀二轮 `prompt_tokens_details.cached_tokens` = 18 688，首轮 0）——信息性字段（§4 D-10 零判据消费） |
| `reasoningEcho` | `"required"` | **族沿用**（保守策略——同档 §1.4 裁定）：本批三形态复测（真值 / 缺字段 / 空串）全 200 ⇒ 9-20 记录的缺字段 400 不可复现，**不翻** |
| `reasoningEffortEnum` / `partialMode` / `prefixMode` / `noUsageStream` / `thinkEnabledValue` | 不声明 / 不设 | 三款无 effort 档面（`thinking.type` 族，与 v2.5 同形）；续写与 usage 面未实测 ⇒ 不预支 |

v2.5 两行（本批改值面；其余字段零改）：

| 字段 | `mimo-v2.5-pro` | `mimo-v2.5` | 证据等级 |
|---|---|---|---|
| `maxOutput` | `131_072` | `131_072` | **校验级**（同日 400 原文 + 131072 → 200） |
| `cacheMode` | `"auto"` | `"auto"` | **实测**（`cached_tokens` 18 816） |

**行注草案**（AC-5 承载面；证据等级词逐字在场 = 硬判据，文字可微调）——MiMo 段落盘形：

```js
  // MiMo series (Xiaomi — OpenAI-compatible https://api.xiaomimimo.com/v1; deep thinking via
  // thinking.type, default ON). Family echo policy stays conservative ("required" — tool rounds
  // always echo); 2026-09-22 re-probe: value / missing field / empty string all 200 — the
  // 2026-09-20 "must be passed back" 400 was NOT reproduced. v2.5 rows aligned 2026-09-22:
  // maxOutput 131_072 = **校验级**; cacheMode "auto" = **实测** (2nd same-prefix round cached 18,816).
  ["mimo-v2.5-pro",     { context: 1_000_000, maxOutput: 131_072, thinking: true,  cacheMode: "auto", thinkApi: "type", reasoningEcho: "required", tempRange: [0, 1.5] }],
  ["mimo-v2.5",         { context: 1_000_000, maxOutput: 131_072, thinking: true,  multimodal: true, cacheMode: "auto", thinkApi: "type", reasoningEcho: "required", tempRange: [0, 1.5] }],
  // MiMo V2.6 series (2026-09-22 launch — three independent rows, each probed individually).
  // maxOutput 131_072 / tempRange [0, 1.5] = **校验级** (400 "at most 131072 completion tokens" /
  // "temperature must be within [0, 1.5]", per model); thinking = **实测** (bare request carries
  // reasoning_content; thinking.type disabled → rc gone ⇒ thinkApi "type" = measured face) and
  // multimodal = **实测** (8×8 pure-red PNG, pro / flash answered "Red"); cacheMode "auto" = **实测**
  // (cached_tokens 18,688). context 1_000_000 = **官方口径** (docs); reasoningEcho = **族沿用**.
  ["mimo-v2.6-pro",     { context: 1_000_000, maxOutput: 131_072, thinking: true,  multimodal: true, cacheMode: "auto", thinkApi: "type", reasoningEcho: "required", tempRange: [0, 1.5] }],
  // mimo-v2.6-flash: same row shape as pro — maxOutput 131_072 / tempRange [0, 1.5] = **校验级**,
  // thinking / multimodal / cacheMode = **实测**, context = **官方口径**, reasoningEcho = **族沿用**.
  ["mimo-v2.6-flash",   { context: 1_000_000, maxOutput: 131_072, thinking: true,  multimodal: true, cacheMode: "auto", thinkApi: "type", reasoningEcho: "required", tempRange: [0, 1.5] }],
  // mimo-v2.6-pro-ultraspeed: same row shape — same grades as flash (**校验级** / **实测** /
  // **官方口径** / **族沿用**); image answer at a 64-token budget was truncated — "Red" at 512.
  ["mimo-v2.6-pro-ultraspeed", { context: 1_000_000, maxOutput: 131_072, thinking: true,  multimodal: true, cacheMode: "auto", thinkApi: "type", reasoningEcho: "required", tempRange: [0, 1.5] }],
```

**行数预算（软线）**：本段落盘净增 **+15 行**（旧 5 行 → 20 行；另 `assistantToolCallMessage` 文档串换写净增 0——文件级预算见 §12.5）⇒ `thincoder-core/model-specs.mjs` 预测 **293**
（`split` 口径；`wc -l` 292）——该档**未登记** `SOFT_LINE_REGISTRY`（`thincoder-core/test/core-hygiene.test.mjs:77-90`）
⇒ 越 300 即红；余量 8 行，**行注草案即行数上限**（写长前须先上报）。

### 12.4 消费面契约（本批动谁、谁零改）

**动 = 数据面**（三新款由兜底变真行；v2.5 两行改值）；**消费码全部零改**：

| 消费点 | 读什么 | 三新款变化（数据驱动） |
|---|---|---|
| 压缩阈值 / 上下文占比 | `context`（核侧 `thincoder-core/config.mjs:104-110`（`resolveCompactThreshold`）· `thincoder-core/token-window.mjs:152`（窗口与占比）· `:161`；面板 `thincoder-vscode/src/specs.mjs:73` · `:87`；CLI 帧 `thincoder-cli/src/tui/render-frame.mjs:393`；坐标 as-of 2026-09-22 评审轮实读） | 128K → 1M（长会话截断面解除） |
| 温度钳位 | `tempRange`（`thincoder-core/provider/core.mjs:187-188`） | 不钳位 → 钳至 [0, 1.5]（越界值不再打到服务端吃 400） |
| 视觉门（8 处） | `multimodal`（坐标 = §2.7 第 1 项，as-of 2026-09-22 评审轮实读更正） | 无视觉 → `read_image` 注册 + 贴图注入生效 |
| 工具轮回声构造 | `reasoningEcho`（`thincoder-core/model-specs.mjs:288-290`——实施后实读，as-of 2026-09-22） | 无字段 → 工具轮 assistant 消息恒带 `reasoning_content`（缺值 ⇒ `""`；三形态全 200 实测支撑） |
| VSC 思考下拉档位 | `thinking`（`thincoder-vscode/src/extension/provider-probe-window.mjs:66`） | 档位空 → 单档 `"enabled"` |
| 输出上限登记位 | `maxOutput`（非 OpenAI 载荷面 = `thincoder-core/provider/anthropic.mjs:56` · `thincoder-core/provider/responses.mjs:207`——mimo 不走此两格式） | 32K → 131_072（登记面 + 面板显示） |

**零改面（明文）**：CLI 产品码全零改（无枚举 ⇒ `/think` effort 列表走既有回退档，`thincoder-cli/src/tui/cmd-think.mjs:16`）；
VSC 产品码全零改（`EFFORT_DEFAULT_PREFIXES`（`thincoder-vscode/src/specs.mjs:22-41`）不含 mimo ⇒ 端差默认档不命中 =
档位首项兑底：三新款 = `"enabled"`、v2.5 同形 = **现状**）；查表 / 排序 / 告警 / 兜底机制零改（`:193` · `:198-212` · `:217-223`——实施后实读，as-of 2026-09-22）；
`thincoder-core/config-presets.mjs` 除 `model` 两处取值外零改；`thincoder-core/provider/core.mjs` 零改（无枚举名 ⇒ effort 越界门短路 = 现状）；
`assistantToolCallMessage` 构造零改（仅按既有 `reasoningEcho` 判定）；`resolveEnableThinking`（`thincoder-core/config.mjs:133-140`）零改（百炼主机门控，与 mimo 无关）。

### 12.5 影响文件清单（预读 · split 口径 · as-of 2026-09-22 设计轮）

| 文件 | 现行数（实读） | 预期增删 | 改动 / 拆分计划 |
|---|---|---|---|
| `thincoder-core/model-specs.mjs` | 278（`wc -l` 277） | +15（文档串换写净增 0）⇒ ~293 | §12.2 / §12.3（三新行 + 行注块 + v2.5 对齐）+ `assistantToolCallMessage` 文档串原地换写；≤300 软线内、免登记 |
| `thincoder-core/config-presets.mjs` | 50（`wc -l` 49） | ±0（2 行改值） | `mimo` / `mimoplan` 的 `model` → `mimo-v2.6-pro`；**mimoplan 端点未实测**（无 tp- 凭证）= 同平台推断（**unverified**） |
| `thincoder-core/test/model-specs-mimo.test.mjs`（拟新增——本批实施轮创建） | **批内新建** | ~95 | `[mimo]` 段 M-1..M-4 · M-6..M-9（§12.7）；新档 ≤300 免登记；单层 glob 自动收集（`thincoder-core/test/run.mjs:42`）零清单改动 |
| `thincoder-core/test/model-specs.test.mjs` | 468（`wc -l` 467） | +7 ⇒ ~475 | 仅两处：`FAMILY_BASELINE` mimo 行值改（`:201`，128_000 → 131_072）+ M-5。**500 硬限余量 25 行** ⇒ `[mimo]` 段不 append 至此档（硬限口径 = `thincoder-core/test/core-hygiene.test.mjs:149-163`：`>500` 硬红、`300–500` 须登记；D-4） |
| `thincoder-vscode/README.md` | 205（`wc -l` 204） | ±0（2 行改值） | `:84-85` provider 表模型列 → `mimo-v2.6-pro` |
| `docs/core/design/MODEL-SPECS.md` | 1096（`wc -l` 1095） | 设计轮笔 | §12（本节）+ 变更记录 + §7 内缺键面坐标/计数收正（`:403-406`） |

**行数上限段**：`thincoder-core/model-specs.mjs` 实施后 ~293（`wc -l` 292 = 277 + 15 行注块净增 + 0 文档串换写）⇒ 低于 300 软线（未登记档），余量 8 行（`wc -l` 口径）；新测试档 ~95（免登记）；
`thincoder-core/test/model-specs.test.mjs` ~475 ⇒ 越 300 系既有态（登记已落 `thincoder-core/test/core-hygiene.test.mjs:86`；
拆分计划落点 = `CORE-UNIFICATION.md` §2.8.1 子表行 12，消解窗口 = 越 500 硬限前或该档下次实质改动）。

### 12.6 验收标准回指（逐条指回批次档 §1.5）

| AC | 判据（同档 §1.5 原文） | 本设计落点 | 机检判据（用例号 = §12.7） |
|---|---|---|---|
| AC-1 | 三新款 `matched === true`（命中独立行、非兜底；context 1M ≠ 128K） | §12.1 / §12.3 | M-1（+ M-4 前缀面） |
| AC-2 | 三新款字段逐项 = 口径表（七项） | §12.3 表 | M-2 |
| AC-3 | v2.5 两行对齐值（131_072 + 信息性字段）；`FAMILY_BASELINE` 同步 | §12.3 表 / §12.5 | M-3（值断言 = 运行时可推导形）+ M-5（基线同步） |
| AC-4 | `mimo` / `mimoplan` 预设 `model === "mimo-v2.6-pro"` | §12.2 / §12.5 | M-8 |
| AC-5 | 三新款行注证据等级词逐字在场 | §12.3 行注草案 | M-6 |
| AC-6 | 三端测试全绿 + `doc-check` 本批面零新增 | §12.5 | 实跑读数（设计轮基线见下方「设计轮机检基线」） |
| AC-7 | VSC README 两行已更新（实读） | §12.5 行 5 | 实施轮 + 收口目视核（设计轮给出目标行文本） |
| AC-8 | T-13 保持绿（本批测试面零新增信息性字段字面量） | §12.7 实施约束 | M-7（本批自扫）+ 既有 `[qwen]` T-13 本体 |

**设计轮机检基线（as-of 本批面 · 设计轮实跑）**：core `node test/run.mjs` = **566 pass / 0 fail**；
cli = **805 / 0**；vsc = **942 / 0**；`node scripts/doc-check.mjs` = 悬空 **4** / 行宽 **2**——逐条落面 =
`docs/core/design/SESSION.md` · `docs/core/design/TOOLS.md`（悬空）与 `docs/core/design/BATCH-RECORD.md`（行宽），
**全部为本批面外既有项**；本批面（本档 / 核表 / 预设表 / 测试面）零命中 ⇒ 实施后须保持本读数不增。

### 12.7 用例表（`[mimo]` 段 · 正常 / 边界 / 回归 / 错误）

承载 = **新建核测试档** `thincoder-core/test/model-specs-mimo.test.mjs`（拟新增——本批实施轮创建；D-4）
＋ 主档 `thincoder-core/test/model-specs.test.mjs` 仅承载 M-5（基线常量所在档，一文件一行内聚）。

| 号 | 类 | 承载 | 输入 / 动作 | 期望 |
|---|---|---|---|---|
| M-1 | 正常 | 新档 | 三名 `specMatch` | `matched:true` + `context === 1_000_000` + `maxOutput === 131_072`（≠ 128K/32K 兜底即证非默认面） |
| M-2 | 正常 | 新档 | 三名 `specForModel` 逐字段 | `assertFields`：`context` / `maxOutput` / `thinking` / `multimodal` / `thinkApi` / `reasoningEcho` / `tempRange`（AC-2 七项；**不含**信息性字段——D-3） |
| M-3 | 边界 | 新档 | v2.5 两行全字段 | `deepEqual`：pro = 对齐形（`maxOutput` 131_072 + `[{合成键}]: "auto"`）；`mimo-v2.5` = pro 形 + `multimodal: true`；**全文零字面量** |
| M-4 | 边界 | 新档 | 前缀面 | `mimo-v2.6-pro-ultraspeed` ≠ `mimo-v2.6-pro` 行对象（长名不被短名遮蔽）；三名 × 在册 mimo 名非前缀循环（v2.5 两行不被遮蔽） |
| M-5 | 回归 | **主档** | `FAMILY_BASELINE` mimo 行 | 行在场（防空扫）+ `assertFields(基线对象)` + `maxOutput === 131_072`（不同步 ⇒ 既有 `[qwen]` T-11 即红） |
| M-6 | 边界 | 新档 | `rowNote` 三名 | 「实测」「校验级」「官方口径」「族沿用」逐字在场（AC-5） |
| M-7 | 边界 | 新档 | 本档自扫（合成键） | 字面量命中数 === 0（T-13② 用例面零新增——防自踩） |
| M-8 | 正常 | 新档 | `PROVIDER_PRESETS.mimo` / `.mimoplan` | `model === "mimo-v2.6-pro"` 且该值 `specMatch().matched === true`（AC-4）；两预设同断；`mimoplan` 端点未实测（**unverified**，同平台推断）——本用例只验预设表取值，不涉端点 |
| M-9 | 错误 | 新档 | `mimo-v3-pro`（未在册） | `matched:false` + 兜底形状 128K/32K + 告警恰一次 + 表内不补泛前缀行（防空扫对照 = `TABLE_ROW_NAMES`） |

四类齐：正常 = M-1 / M-2 / M-8；边界 = M-3 / M-4 / M-6 / M-7；回归 = M-5；错误 = M-9。

**实施约束（设计钉死）**：

1. 新档 helpers **就地重定义、零 import 主测试档**（主档无导出面）：`SPEC_SOURCE` / `TABLE_ROW_NAMES` / `rowNote` /
   `assertFields` / 信息性字段**合成键**（`["cache", "Mode"].join("")`——主档 `:221` 同法先例）。
2. **测试面全文零信息性字段字面量**（含注释与断言消息）——T-13② 逐档计数闸：新增命中即红（M-7 自扫兜底）。
3. 主档只改两处：`:201` 基线值 + M-5（+7 行）——不得顺带改写既有段（`[qwen]` / `[onboard]` / `[flashx]` 段零触碰）。
4. 三名常量与期望值取 §12.3 表字面（`131_072` / `[0, 1.5]` / `"type"` / `"required"` / `true`）。

### 12.8 边界（本节不做）

- 不动 mimo 族以外任何规格行 / 预设；**不删** v2.5 两行（在役，下线节奏归小米）。
- 不补泛 `mimo` 前缀行（未在册名照旧落 `DEFAULT_SPEC` + 一次性告警；M-9 钉住）。
- 不做全表复核 / 不加新字段 / 不改查表与排序机制 / 不改告警与兜底路径。
- 不改 CLI / VSC 端差面（`EFFORT_DEFAULT_PREFIXES` 零改——mimo 无 effort 档，本批不涉）。
- 不写 CHANGELOG（发布轮事务）；不改三端产品码（除预设表 `model` 两处改值）。
- v2.5 行 `reasoningEcho` 保持 `required`，本批不重议。
- **机制面回显证据句随批同步（评审轮 1 #3 裁定 ①）**：`assistantToolCallMessage` 文档串（`thincoder-core/model-specs.mjs:265-278`——实施后实读，as-of 2026-09-22）随本批按 2026-09-22 复测同步改写
  （原「missing field → 400」句已证伪；改写后与 §12.3 行注同一事实陈述；净增 0 行——§12.2 / §12.5）；机制正文（`doc:PROVIDER.md`）本体不在本批改动面。
- 本节不落实现——改码 = eng-coder，需本批 designToken。

### 12.9 UI/交互决策（全落地，无 open）

| 面 | 决策 |
|---|---|
| CLI `/models` | 三新款显示 `1M`（context 官方口径；证据等级由行注承载，显示面不区分）；v2.5 两行显示不变 |
| CLI `/think` 面板 | mimo 无 effort 枚举 ⇒ effort 列表 = 既有回退档 `high\|max`（`thincoder-cli/src/tui/cmd-think.mjs:16`，零改）；`thinkApi:"type"` ⇒ `isEffortOnly` = false ⇒ 开关行走 `thinking:{type}` 面——与 v2.5 同形（零变化） |
| VSC 思考下拉 | 三新款 = 单档 `"enabled"`（`thincoder-vscode/src/extension/provider-probe-window.mjs:66`：无枚举 ∧ `thinking:true`）；由「档位空」转「`enabled`」= 本批可见改善；默认档 = 档位首项（端差表不含 mimo，`thincoder-vscode/src/specs.mjs:22-41` 零改，D-7） |
| 预设面 | `mimo` / `mimoplan` 条目：`model` 改指；`thinking:{type:"enabled"}` 与 `maxTokens:131072` 零改（= 实测上限） |
| 面板 `max_output` / `context` 显示 | 三新款 `131072` / `1M`；v2.5 两行 `131072`（对齐后）/ `1M`——显示面不区分证据等级 |

无 `open` 项。

## 变更记录

- 2026-09-22（**MiMo V2.6 三款批 · 设计轮（initial）** · eng-designer——承 `docs/batches/2026-09-22-mimo26-specs.md` §1）：
  新增 §12（三新款独立行 + v2.5 两行对齐：方案与理由 / 表变更 / 字段口径 + 行注草案 / 消费面 / 影响文件 /
  AC-1..AC-8 回指 / 用例 M-1..M-9 / 边界 / UI 决策 + 关键决策 D-1..D-7）；§7 内 `cacheMode` 缺键面坐标与计数收正
  （42/34/8 → 53/40/13；`:75`/`:76` → `:119`/`:120`）；§7 除本条 `cacheMode` 缺键面坐标/计数收正外，§1–§11 其余零触碰。

- 2026-09-22（**MiMo V2.6 三款批 · 设计评审轮 1 修正** · eng-designer——fix 轮；承
  `docs/batches/2026-09-22-mimo26-specs.md` §3 轮次 1，#1…#6 六针全落）：
  ① §12.5 预设行 / D-5 / M-8 补 `mimoplan` **unverified** 标注（#1）；② §12.4 压缩阈值行坐标按评审实读收正（#2）；
  ③ 「文档串随批同步改写」入界 + §12.2 表变更清单补该笔 + §12.5 行数预算重算（#3）；④ §12.4 视觉门行标 as-of + §2.7 第 1 项八消费点坐标收正（#5）；
  ⑤ 变更记录本批条表述收一致（#6）。零新语义——§1–§11 除 ④ 项坐标收正外未动。

- 2026-09-20（**qwen3.6 五名行批 · 设计评审轮 1 修正** · eng-designer——fix 轮；承
  `docs/batches/2026-09-20-qwen36-family-rows.md` §3 轮次 1，#1…#10 十针全落）：
  ① §11.1 补插入锚实读核注（`:96`/`:97` 真锚）；② §11.8 五名长度 19/15/13/12/11、
  删同长并列稳定句；③ §11.4/§11.9 `cmd-think.mjs` 坐标 `:118`→`:131`；④ Q-4 补期望
  形态句（不含 `cacheMode` 键）；⑤ §11.5 行数对齐批档（~273 / ~1070）；⑥ 用例分类
  四类齐 + 补 Q-8 错误面用例（Q-1..Q-8 · 新档 7 例 + VSC 1 例，计数与清单同变）；
  ⑦ helpers 清单补 `EFFORT_6`；⑨ §11.2 max-preview 视觉波动如实记录句。
  ⑧⑩ 两针落批档 §2.3 / §2.2 面。零新语义——§1–§10 未动。
- 2026-09-20（**qwen3.6 系五名独立行批 · 设计轮（initial）** · eng-designer——承
  `docs/batches/2026-09-20-qwen36-family-rows.md` §1 + §2）：新增 §11（五行新增交付面：
  方案 / 表变更 / 字段口径 / 消费面 / 影响文件 / AC 回指 / 用例 Q-1..Q-7 / 排序核 / UI 决策）
  + 变更记录本条。§1–§10 机制与既有面零触碰。
- 2026-09-20（**glm-5.3-flashx 独立行批 · 设计评审轮 1 修正** · eng-designer——fix 轮；承
  `docs/batches/2026-09-20-glm53-flashx-row.md` §3 轮次 1 · 针一 #1 / 针二 #3 / 针三 #4）：
  ① §10.3 补「族沿用」字段 F-2 期望值**推导规则**（实施轮实读 `glm-5.3-flash` 行现行键集/值
  逐字为准，未声明键不进期望对象；§10.3 字面清单降为 as-of 参考）；② §10.1 `SORTED_SPECS`
  `:153` 标 as-of 读数（同档 §2.1 与「修复轮 #11」条均记 `:130`，坐标以实施轮实读复验为准）；
  ③ §10.3 行注规格补「off 动作在 UI 侧为 no-op（服务端无关闭路径）」（F-5 断言面不变）。
  零新语义——§1–§9 未动。
- 2026-09-20（**glm-5.3-flashx 独立行批 · 设计轮（initial）** · eng-designer——承
  `docs/batches/2026-09-20-glm53-flashx-row.md` §1 + §2）：新增 §10（单行新增交付面：
  +1 表行 + 行注证据块 + 用例 F-1..F-5）；开放项两项裁定（行注表达 / 独立行）= §10.1；
  零改面 = §10.4；残留上抛（flash 行 128_000 与 §1.2 对照实测矛盾）= 批档 §2.6。

- 2026-09-20（**渠道接入批 · 设计侧收口轮（fix 轮）** · eng-designer——承 `docs/batches/2026-09-20-channel-onboarding.md` §5.4 漂移表 DR-3 / DR-4 / DR-5 + §1.10-④ 预裁）：
  ① **读数刷新（收口复读 · 实施后终态）**：§9.7 表改收口值——`model-specs.mjs` **253** · `config-presets.mjs` **50** · `thincoder-core/provider/core.mjs` **492** · 两测试档 **415** / **307** · 新档 `config-presets.test.mjs` **52**（`split` 口径；口径注更「收口复读」as-of，各预读 as-of 不追改）。
  ② **结论反转收正**：§9.7 原「改后 ~272 ⇒ 均低于 300 ⇒ 无拆分方案」→「**两测试档越线**（415 / 307）⇒ 批次档 §1.10-④ 预裁『不拆档——单档内聚』⇒ 登记已落（`core-hygiene.test.mjs:55`）+ 拆分计划落点 = `CORE-UNIFICATION.md` §2.8.1 子表行 12 / 13」（§9.9 清单 8 同变闭合）。
  ③ **首次披露**：`thincoder-core/provider/core.mjs` **距 500 硬限余量 9 行**（`wc -l` 口径 = 核内机检口径）——后续实质改动按 §2.8.1 次优先面口径补登拆分计划。
  ④ **DR-3 计数面**：「预设 20」在盘处数 11 → **12**（测试面 6 → **7**——补 `thincoder-vscode/test/files.mjs:21`）；`PROVIDER.md` §6.19 指针 `:273` → `:274`（死坐标收正）；其余各笔逐处复核已落。
  ⑤ **DR-5**：§9.6 D-13 ② 补 `volcengine.maxTokens` 追注（32768 → **131072**，已落盘——随模型改指同变）。
  ⑥ **旧字面收正**：§9.6 护栏档「拟新增」→「批内已建 · 52 行」· §9.7 新档行「拟新增」→ 实读形 · §9.9 载荷面承载段（222 → 307）/ 清单 5 / 清单 8 旧读数与旧状态 · `:373` T-14 行「拟新增文件」→「批内新增文件」· `:279` / `:288` / `:297` 旧状态与旧坐标（`:54` → `:55`、注释 `:38-40` → `:38-44`）——随收口修正。
  ⑦ **DR-5 追加同步（针㈤ · 父侧实测回填）**：代码面 P-4 已落（`config-presets.mjs:32` = `maxTokens: 131072` · 用例 `test/config-presets.test.mjs:49-51`）
  ⇒ 设计侧同变：§9.9 补 **P-4** 行（正常类）· §9.8 AC-5 行 / §9.7 覆盖列补 P-4（D3）；**用例计数 21 → 22**（A-1..A-12 · B-1..B-6 · P-1..P-4）；另本批 DR-5 / D-13 面数字形态归一无分隔符形（`32_768` → `32768` · `131_072` → `131072`，与代码字面同形）。
  ⑧ **AC-7 机检读数刷新**：`doc-check` 闸态实跑双清（悬空 0 · 行宽 0）；旧附注「残余 2 行」随现读删除（`AGENT-LOOP.md:163/168` 现读 188 / 124，已非超线行）。
  **零新语义**：全部条目 = 批次档 §5.4 DR-3 / DR-4 / DR-5 与 §1.10-④ 预裁的直接导出项（含 ①/⑧ 读数刷新类；DR-1 项落 `CORE-UNIFICATION.md` 变更记录 2026-09-20 条）。

- 2026-09-20（**修复轮 #11 · 裁定落位后读数收正** · eng-designer；承 `docs/batches/2026-09-20-qwen-flash-specs.md` §5.4 顾问代码评审 🟡①②）：
  ① **出处收正**：A-17 / A-18 的裁定出处由「批次档 §3 轮次 1」改记 **§5.4 顾问代码评审 🟡①②**（§3 轮次 1 = 设计评审 #1…#10，原记系误指）——§3 尾注 · §5 尾注 · A-17 / A-18 两行 · 本记录下方 2026-09-20 修正轮条目（头部 / ⑤ 句 / 夹带句）同步变。
  ② **坐标收正（修复轮实读）**：`thincoder-cli/src/tui/cmd-think.mjs` `:121`→`:131`（on 默认档）· `:106-111`→`:104`（off 归一入点）· `:47-48`→`:48-49`（面板行）· `:54`→`:55`；
  `thincoder-core/model-specs.mjs` `DEFAULT_SPEC` `:99`→`:118` · `warnUnknownModel` `:135-141`→`:154-160` · `providerSpec` 展开 `:107`→`:198` · `specMatch` `:153-158`→`:172` · `SORTED_SPECS` `:111`→`:130` · `qwen3.8-max` 行 `:66`→`:74`；
  `thincoder-core/agent/spawn-child.mjs` `:193-202`→`:188-195` · `thincoder-vscode/src/agent/setup.mjs` `:168`→`:173` · `thincoder-vscode/src/agent/execute-tools.mjs` `:259`→`:271` · `thincoder-vscode/src/specs.mjs` 端差表 `:22-31`→`:22-36`。
  ③ **§3 行数刷新（实读）**：`thincoder-cli/src/tui/cmd-think.mjs` 142→**152** · `thincoder-cli/test/cmd-think.test.mjs` 85→**154** · `thincoder-vscode/test/model-picker-fallback.test.mjs` 157→**221**；行数上限段同变；`thincoder-core/test/provider-merge.test.mjs` 标「T-9 第四态 = 修复轮唯一未落项」；§3 尾注「未落项」句改落位实况（九条中八条完整落盘）。
  ④ **§6 增实施标签映射注**：T-16 ↦ 实施档「修复轮 #11」×3 段 · T-17 ↦ 「③」×2 用例（实施侧未挂 T- 号，判定以语义覆盖为准）。
  ⑤ **【勘误】**：§2.1「现状坐标」列 · §2.1「现 210 行」 · §2.3 `:69` · §2.2 探针 `:24-30` · §7 `:75-87` 等 = **落位前 as-of 读数**（落位后净增 20 行），按 D4「行号仅作 as-of 参考」不逐条追改——本记录即漂移登记面；本记录内新坐标 = 2026-09-20 修复轮实读值。
  ⑥ **本轮续修**：§2.8 面 2 补回执守卫末条（`thincoder-cli/src/tui/cmd-think.mjs:86-87` 守卫，裁定② 第三处；零测试射程 ⇒ 台账）+ §7 边界「只改两处取值面」改正为**三处**并含交互循环例外注 + §3 该行与 §5 A-18 行补记 + §3 表**二次复读**（`thincoder-core/model-specs.mjs` 253 · 测试面 395 / 304——含并行渠道批增量，越 300 软线披露见该节末）。
  **零新语义**：全部条目 = 裁定出处 / 坐标 / 行数读数 / 标签映射 / 回执守卫登记的收正，无判据或取值改动。

- 2026-09-20（**修正轮 · 顾问代码评审 🟡①②落位** · eng-designer；承 `docs/batches/2026-09-20-qwen-flash-specs.md` §5.4 顾问代码评审 🟡①②）：
  ① **裁定②落位**——CLI `/think effort none` ⇒ 关思考：§2.6-2 补「两侧不得互补」判据（判据顺序 `thincoder-core/config.mjs:137-138`）；
  §2.8 由「on 默认档」单面改写为**三面**（面 1 `:121` on 默认档 · 面 2 `:106-111` `"none"` ⇒ 显式 off 标记 · 面 3 VSC picker 归一）；
  新增判据 **A-17 / A-18**、用例 **T-16 / T-17**、T-9 扩第四态 ⇒ **判据 16→18 · 用例 15→17**（D3 同变）；§7 边界三条、§8 三行同变。
  ② **裁定①落位**——VSC picker 回归修复（`thincoder-vscode/webview/model-picker.js` 149 行，已落盘）：入 §3 =「本批回归修复 · 披露面」，
  其测试档 `thincoder-vscode/test/model-picker-fallback.test.mjs`（157）另列一行（一文件一行，遵本表原形制）。
  ③ **死指针收正**——T-10 坐标 `:50-54`→`:55-59` · A-13 坐标 `:22-31`→`:22-36` 并改「现仅一档在册」为**批后真值**（六档在册）·
  `thincoder-cli/src/tui/cmd-think.mjs:118`→`:121`（§2.5 / §2.8 / §3 / §7）；A-16 前提句按「批内新增档已落地」收正。
  ④ **§3 全表 as-of 读数刷新**（split 口径 · 口径注置该节末）+ 行数上限段按实读改写（无档越 300）+ 交付面段更新（10 行 = 九条产品码/测试 + 设计轮笔档）。
  ⑤ **§5 尾注新增 A-17 / A-18 出处注**：两裁定出处 = 批次档 §5.4 顾问代码评审 🟡①②，**§1 未登记**（三方链需求环暂由 §5.4 承担 ⇒ 已入上报）。
  **零新语义**：全部条目 = 批次档 §5.4 顾问代码评审 🟡①② 裁定的直接导出项（无夹带）。

- 2026-09-20（**渠道接入批 · 设计评审轮 1 修正** · eng-designer——fix 轮；承 `docs/batches/2026-09-20-channel-onboarding.md` §3 轮次 1，#1…#12）：
  ① hy3 枚举三档 → **七值受理集**（批档 §1.10-①；与 seed 同值集、行独立），连锁面（§9.3 / §9.7 / §9.9 / §9.11）同变；
  ② 交付面行数改实读（§9.7 全表：`model-specs.mjs` 230 / 测试面 256・222），测试面越线档（`test/model-specs.test.mjs` 改后 ~305）
  登记 + 上抛 = §9.9 清单 8；③ D-14 谓词**单源**改挂 `doc:PROVIDER.md:§6.12` + 补第五子句 `!provider.model.includes("/")`（guard ⑤ = `x/hy3`）；
  ④ §9.5 正文登记位失实修正（本档无 AC-4 节，改为本节自身）；⑤ §9.2 补**前缀继承面现状核对**（现盘 `hy3` 面 = `hy3-preview` 一枚）、§9.4 补**覆盖面口径**
  （命中/未命中名全集，批档 §1.10-③）；⑥ §9.9 清单 2/4/6 收正（枚举源坐标 = `provider-probe-window.mjs:66`）+ 新增 7（VSC 端差默认档
  认账 + 上抛）/ 8（测试档越线）；§9.8 AC-1 / AC-6 行文本轮随五名 / 七值同变；⑦ §9.10 补三条既有边界（端差档面 / 订阅端点 / 不自动探测）。
  **零新语义**（D-14 系批档 §1.7-① 已批项；余全为评审发现的直接导出项）。
- 2026-09-20（**修正轮 · 设计评审落位** · eng-designer）：评审轮 1 发现 10 条（🔴2/🟡4/🟢4）→ 本文坐标面与口径面逐条修：
  【勘误】F-1…F-10 与 🔴2/🟡4/🟢4 计数系本轮施工自指编号，不对应评审实录；实录 = 批档 §3 轮次 1（#1…#10 + 追加 🟡），自查三件归位 = 批档 §1.10（P-1…P-3）。
  ① F-1 交付面文件归属改写（`PROVIDER.md` 标为设计轮笔已落，eng-coder 实施面 = 七条）；② F-2/F-3（🔴）**新登 D-10**
  ——`cacheMode` 定性为**信息性字段（零判据消费）**，T-13 由「取值断言」改为「消费点结构断言 + 禁止新增取值断言」，
  `model-specs.test.mjs:29` 列入删除行账（§3 −2）；③ F-4（🔴）A-13/T-15 —— VSC 端差用例**实际落点** =
  `thincoder-vscode/test/image-downgrade.test.mjs`（现仅测 deepseek/glm/kimi 族，qwen 不在射程），用例 14→**15 条**；
  ④ F-5 本档 §2.4 表头与表行数口径对齐（三档处置 → 两档 + 并入既有行）；⑤ F-6～F-8（🟡/🟢）`EFFORT_DEFAULT_PREFIXES`
  坐标、探针预算句、§2.3 判据表述去对不存在的函数引用；⑥ F-9～F-10（🟢）裸段坐标全部补仓根完整路径（核 / VSC 侧各消费点：`thincoder-core/config.mjs` /
  `thincoder-core/provider/normalize.mjs` / `thincoder-vscode/src/extension/vision-channel.mjs` /
  `thincoder-core/auto-think.mjs` / `thincoder-core/agent/spawn-child.mjs` /
  `thincoder-vscode/webview/model-picker.js` / `thincoder-vscode/src/extension/reasoning-mode.mjs` /
  `thincoder-vscode/src/extension/provider-probe-window.mjs` / `thincoder-vscode/src/agent/execute-tools.mjs`）、现行数 211→210 与 `docs/core/design/PROVIDER.md` 402→417；
  ⑦ §7 边界新三条（不删 `cacheMode` / 不修 VSC 兑底链 / 不改探针脚本），§5 回指新登 §1.8-④ 归属；
  ⑧ 本稿修正引入的四项待目均已在本档内收账（不入批次档 R 号，防同号异事）：A-16 行内【前提】注（属新增断言非回归）·
  §7「不修 `qwen3.8-max` 枚举」条（= 台账待办）· §7「`cacheMode` 不删」条（= 台账待办）· §3 交付面条数收正（八条）。**零新需求、零语义改写**——均为评审发现的直接导出项。
- 2026-09-20（**修正轮 · 批次档 §1.8 裁定落位** · eng-designer）：① **D-3 翻案**——两新档 `thinking` 由
  `false`+`unverified` 保守登记翻为 `true`（实测级）：v1 未见 `reasoning_tokens` 的成因 = `max_tokens:16`
  短预算探针截断伪影（思考被截、不落 usage），父侧 80-token 任务探针实证字段在场（§1.8-① 表：49 / none 消失 /
  medium 57 / 对照 3.8-flash 32）——「无证据不登记」纪律延续，证据到位即翻正；② **§2.8 升格本批必修**
  （§1.8-②：本批补枚举制造的回归）——`thincoder-cli/src/tui/cmd-think.mjs:118` 改取首个非 `"none"` 档；
  `applyThink` 具名导出 +
  新增 CLI 用例档（拟新增文件 `thincoder-cli/test/cmd-think.test.mjs`，批内创建）；交付面五条 → **七条**（与 §1.5 同步）；新增 D-9 / A-16 / T-14
  （用例 13→14、判据 15→16），原「护栏②台账待办」处置整段删除（T-12 形状锚保留）；③ 上报项收账：
  R-2/R-3/R-4/R-7/R-10/R-11 闭（R-6 维持）；④ R-11 纪律沉淀落 `docs/core/design/DOC-DISCIPLINE.md` §1 D4。
- 2026-09-20（父侧裁定后重写）：§1.4-2 收口方案由「族底行显性化」改为用户裁定「删 `qwen` 托底行」——
  原设计的 `FLOOR_SPECS` 常量 + 族底告警机制整段作废，重心改为 §2.4 逐名处置表（AC-14）；
  纳入两新档 `qwen3.8-omni-flash` / `qwen3.8-27b`（AC-12）与 `EFFORT_DEFAULT_PREFIXES` 全档补全（AC-13）。
- 2026-09-20（自纠）：`modalities` 扩字段裁定推翻（D-4）——读码实测证明该字段零消费者，
  改为维持布尔 + 行注承载（§2.7）；`normalize.mjs` / `provider-probe-window.mjs` 从交付面移出（§3）。
  交付面缺口从「+4 文件」修正为「+2 文件」。
- 2026-09-20 建立（批 `2026-09-20-qwen-flash-specs`）：qwen flash 两独立行 + 退役清理 + 泛前缀继承收口。
- 2026-09-20（自检修订轮）：① 消费点坐标改**仓根完整路径**（裸相对段 basename 不唯一 ⇒ 机检判悬空，首跑引入 10 条）；
  ② 用例表 11 → **13 条**（新 T-12 枚举形状 / T-13 `cacheMode`），§2.8 护栏改为「绿断言 + 台账待办」（不留已知红用例）；
  ③ A-11 基线按实跑读数改写（悬空 0 / 行宽 0）。
- 2026-09-20 06:2x（**同步收尾 · 机械三件** · eng-designer）：§7 探针脚本条括号内旧描述改真实形态（provider 名参数 → `providers[].model` 选路；该档 `:90` 同形旧述未在本轮四针射程内，已上报）· §4 D-10 与 §5 A-13 行末各补来源回指（批次档 §1.10 P-1/P-2/P-3 父侧补裁）+ §5 回指段补出处句 · 变更记录：重复 ⑥ 块删重（保留一份）+ 修正轮条目头部加勘误行。判据出处 = 批次档 §1.9-③ / §1.10 / §1.11。
- 2026-09-20（批 `2026-09-20-channel-onboarding` 设计轮 · eng-designer）：新增 **§9 渠道接入批行集**——`hy3` / `hy3-preview` / `hy4-preview` / 豆包 Seed 两档共五行 + 登记规则（D-11 能力位不跨名沿用）+ TokenHub 转售名逐名认账（D-12 不增渠道限定行）。纯增量，未触碰 §1–§8 既有内容。
- 2026-09-20（同批 · **设计自查修正轮** · eng-designer）：§9 面一致性四修：
  ① §9.7 测试表**补两行**（`thincoder-core/test/provider-merge.test.mjs` 162 行承载 B-1..B-4 · `thincoder-core/test/config-presets.test.mjs` 拟新增承载 P-2/P-3；
  原表只列 `model-specs.test.mjs` ⇒ 用例落点无归属）；② P-2/P-3 归属由 `config.test.mjs` 改指新建档（§9.6 D-13 早已裁定新建，两处此前互相矛盾）；
  ③ `thincoder-core/provider/core.mjs:198-203` 抛错门的「已有断言先例」口径收正为「代码在场、断言面 = 同表 §6 T-8（qwen 批在途未落）」，
  并补 `DEFAULT_SPEC` 无枚举 ⇒ 门短路的机理（原「先例」说法经 grep 实测 = 测试面无该断言）；④ 计数与坐标面修正：涉改档现行数刷新
  （MODEL-SPECS 613→639 / PROVIDER 418→423）、行数上限句补 `provider-merge.test.mjs`、**D3 计数与清单同变**（「预设 20」在盘 9→**10 处**：
  测试面实为 6 处而非 4 处，CLI 测试文件头覆盖注 `:5` 与 VSC `:4` 此前漏计）、`test/config-merge.test.mjs` 预期增删 +2→+3；
  另 §9.6 D-13 旧值叙述改指批次档（不在规范面留已改值的尸体）。机检：`doc-check` 悬空 0 / 行宽 0（含四条新悬空的现场修：
  `tokenhub`/`volcengine` 符号误抽、文档地图死指针（本仓无 `docs` 级 AGENTS 档 ⇒ 改指 `docs/README.md`）、
  核内载荷档坐标缺仓根前缀 ⇒ 改全路径）。**零新语义、零范围变更**——均为坐标与归属面的直接导出项。
- 2026-09-20 07:1x（同批 · **父侧裁定落位 + 一致性微修轮** · eng-designer）：① 批次档 §1.7-① 批准 D-14 ⇒ §9.6 由「待批」
  改「已批准 · 本批交付项」，§9.7 表新登 `thincoder-core/provider/core.mjs` 行（477 / +~5）、原「零改动」句改「除 D-14 外零改」
  （抛错门行为保持原样），§9.8 新登 AC-9 回指行，§9.9 新增用例 **B-5**（off 补发 + 四 guard 零变面），`provider-merge.test.mjs`
  预期增量 +~26 → +~50（新用例 B-6 = 后台路径副作用认账断言）；② §9.11 **删重复表块**（同内容两份，两份间状态口径互相矛盾 = 一致性面自修）+ 思考开关行改「已批准」；
  ③ §9.9 上报清单新增第 6 条：CLI 思考下拉对未在册名**回退全档**，与 VSC 侧「档位空」两端不一致（AC-6 字面只覆盖 VSC ⇒
  本批 CLI 零改，差异交父侧）；④ §9.7 新立**行计数口径注**（本表 = `split('\n').length` 含末行；qwen 面 §3 的 210 = `wc -l`
  同文件读数，差 1 属口径非事实，§3 面不追改）；`SOFT_LINE_REGISTRY` 登记态经实读 `thincoder-core/test/core-hygiene.test.mjs:47`
  核实后写入。**零新语义**：除 §1.7-① 批准带来的交付面解锁外，全部为坐标 / 归属 / 重复块清理。
- 2026-09-20 07:2x（同批 · **消费点与副作用面核对轮** · eng-designer）：① **更正自己上一轮的失实断言**——原写
  「`thinkApi` 全仓零读取点」，实 grep（仓根入码面）= 三处端侧消费点（`thincoder-cli/src/tui/cmd-think.mjs:13` /
  `thincoder-cli/src/tui/cmd-advisor.mjs:104`+`:234` / `thincoder-vscode/src/extension/reasoning-mode.mjs:27`）——
  上轮只扫 `thincoder-core/**/*.mjs` 得出了「零消费」的过头结论 ⇒ §9.1 消费点段按实读重写（核内零读取 · 端侧三读点 ·
  AC-9 = 核内首个消费点）；② **新登 §9.6 副作用面**：`thinking:null` 除 UI 外另有三处生产者（`thincoder-core/context.mjs:401`
  压缩摘要 / `thincoder-core/explore-distill.mjs:98` 蒸馏 / `thincoder-core/config-presets.mjs:18-19` 预置）⇒ AC-9 使后台调用
  对 effort 族也不再想（与 qwen 侧同方向，认账不改）；kimi 两预置因带显式 effort 而零变化；新增用例 **B-6** 断言该认账；
  ③ §9.10 新登一条边界（不为区分内部/用户 off 而新增字段或改 `resolveEnableThinking`）；④ §9.7 交付面句的
  「§2.2」改指本节内正确的 §9.2，MODEL-SPECS 现行数刷新 639→676，`multimodal` 行补 `hy3-preview` 能力补记（父侧口径、
  未本渠道探针 ⇒ 不声明 = 认账）。
- 2026-09-20 09:1x（同批 · **#10 复审后一致性微修轮** · eng-designer）：零新语义（新语义 = 父侧 §1.7 已裁的两项，本轮只落文）。
  ① 上轮被父侧抓到的四条自写悬空已全部收正（父侧 08:57 实跑 FAIL 2 → 本轮 09:0x 实跑悬空 0 / 行宽 0），两条超长行（本变更记录尾
  + §9.9 清单 6）折行；② **计数与清单同变（D3）**：§9.7 测试面 `provider-merge.test.mjs` 承载段 B-1..B-4 → B-1..B-6（补 B-6 行，
  本轮副作用面新增）· §9.9 B-5 guard 数三 → 四（§9.8 AC-9 行同步）· §9.8 AC-8 行 B-1..B-3 → B-1..B-6；③ **死指针**：变更记录
  旧条中指向本仓不存在文件的指针改描述性写法（不追改历史事实，只收正可解析性）。详细面见批次档 §2。
