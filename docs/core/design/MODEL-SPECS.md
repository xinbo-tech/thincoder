# MODEL-SPECS 模型规格表 · 设计

> 层 = 设计层（`how`）。
> 权威源纪律：`enable_thinking` / `reasoning_echo` 的机制正文在
> `docs/core/design/PROVIDER.md`，本文只登记**规格表面**并引用它（`doc:section` 形式），不复述。

## 1. 决策与理由

**决策与理由**：

| 变更 | 决策 | 理由 |
|---|---|---|
| qwen 托底 | 删 `qwen` 行，能力逐名显式声明 | 用户裁定；继承式托底是静默失实的源头（§2.3 普查 11 名靠它拿 1M 上下文与视觉） |
| 两 flash 档字段 | 实测优先 + 同族沿用项逐条标注 | 只有 `thinking` / 枚举 / maxOutput / 图像受理是实测；其余标「同族沿用」——诚实面 |
| 两新档 `thinking` | `true`（**实测级**） | 父侧 80-token 任务探针：裸请求 `reasoning_content` 在场、`reasoning_tokens`＝49；`effort:"none"` 即消失、`"medium"` 在场（57）；对照 `qwen3.8-flash`＝32 |
| 音频/视频表达 | `multimodal: true` 不变 + 行注写明模态 | 调用面只发图像（§2.7 实测），扩字段无消费者；行注承载零结构风险 |
| `qwen3.8-27b` context | `262_144` | 网络口径（原生 262 144；YaRN 外推属本地部署特性，DashScope 实供未证）⇒ 保守取，行注标网络口径 |

## 2. 接口契约

### 2.1 数据面：表变更清单

`MODEL_SPECS`（`thincoder-core/model-specs.mjs`）：

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
| 不加行（§2.4 表第 11 行） | `qwen3-coder-plus` 等 11 个借托底名（§2.3 表穷举） | **接受退化并逐名认账**（§2.4），取值无实测 ⇒ 不补行 |

排序不变量：`SORTED_SPECS` 按前缀长度降序（`:130`）⇒ 表内插入位置不改变匹配优先级；
删 `qwen` 行改变一批名的命中结果——后果逐名认账见 §2.4。
前缀遮蔽自查（新名之间无 `qwen3.8-flash` vs `qwen3.8-omni-flash` 类互覆：均非前缀关系），
唯一在册遮蔽 = `qwen3.8-max` 前缀盖住 `qwen3.8-max-preview`（实测：两者返回同一对象）。

### 2.2 字段口径表（四新行逐字段 + 证据等级）

四新档 `thinking` 均为 **`true`（实测级）**——但两组探针形态不同：两 flash 档＝`reasoning_tokens` 166/27 在场；
两新档＝`reasoning_content` 在场＋`reasoning_tokens` 49。逐行登记证据等级，不按族类推：

| 字段 | `qwen3.7-flash` | `qwen3.8-flash` | `qwen3.8-omni-flash` | `qwen3.8-27b` | 证据等级 |
|---|---|---|---|---|---|
| `thinking` | `true` | `true` | `true` | `true` | 两 flash 档：实测（裸请求 `reasoning_tokens` 166/27 在场）；两新档：**实测**（父侧 80-token 探针：裸请求 `reasoning_content` 在场、`reasoning_tokens`＝49；`effort:"none"` 消失；`"medium"` 在场 57；对照 `qwen3.8-flash`＝32） |
| `reasoningEffortEnum` | `["none","minimal","low","medium","high","xhigh"]`（6 档，**无 max**） | 7 档（+ `"max"`） | 7 档 | 7 档 | 实测（服务端 400 原文逐字枚举） |
| `maxOutput` | `131_072` | `131_072` | `131_072` | `131_072` | 实测（400 `Range of max_tokens should be [1, 131072]`） |
| `context` | `1_000_000` | `1_000_000` | `1_000_000` | **`262_144`** | **文档/网络口径**（非 API 实测；27b 取原生值，YaRN 外推属本地特性）⇒ 行注必标 |
| `multimodal` | `true` | `true` | `true` | `true` | 实测（图像解码门证据；两新档同类尺寸校验文案）。音频/视频不入此位——行注承载（§2.7） |
| `modalities` | 不登记 | 不登记 | 不登记 | 不登记 | 裁定 = 维持布尔（§2.7）：音频/视频**只写行注**，不入结构化字段 |
| `partialMode` | `true` | `true` | `true` | `true` | **同族沿用，未独立实测**（两 flash 档实测过 `max_completion_tokens` 受理，27b/omni 未测）⇒ 行注标「沿用」 |
| `cacheMode` | `"none"` | `"none"` | `"none"` | `"none"` | 同族沿用（未实测；值 = 不发缓存参数，保守侧） |
| `thinkApi` | `"effort"` | `"effort"` | `"effort"` | `"effort"` | 同族 + 实测支撑（枚举 400 原文即该参数） |
| `reasoningEcho` | 不声明（= optional） | 不声明 | 不声明 | 不声明 | qwen 全族现状即不声明且可用 ⇒ 零变化。**关档路径**已实测无字段冲突（两新档 `"none"`）；**跨轮回声**（历史携带 `reasoning_content` 再发）仍未实测 = R-4 在册，行注标 `unverified` |
| `tempRange` | `[0, 2]` | `[0, 2]` | `[0, 2]` | `[0, 2]` | 同族沿用（未独立实测） |
| `noUsageStream` / `prefixMode` / `thinkEnabledValue` | 不设 | 不设 | 不设 | 不设 | qwen 族均无此项 |

**入实现判据的只有「实测」行**（四档 `thinking` / 枚举 / `maxOutput` / 图像受理）；
「沿用」「文档口径」两类**必须逐条写进行注**（诚实面纪律），测试只断言已登记值本身。

**探针脚本**：`thincoder-cli/test/smoke-qwen-thinking.mjs:24-30` 收显式 `provider:model` 入参选路，全档无硬编码模型名字面量，扩档执行属父侧/用户操作（需密钥）。

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
| `qwen3-coder-plus` | 同上（该名的 `qwen3-coder` 门在 `thincoder-core/config.mjs:146`，**不读 spec**） | 同上 |

（`qwen-max` / `qwen-plus` 两行按退役指令一并删，退化在 §2.4 认账。）

**关键澄清（两件事不得混同）**：`thincoder-core/config.mjs:143-156` 的
`resolveEnableThinking` 判据 = **名称前缀 `startsWith("qwen")` + `isBailianHost`**，
**不读 `MODEL_SPECS`** ⇒ 删 `qwen` spec 行**完全不影响**它（实测两机制零耦合）。
`thincoder-core/provider/normalize.mjs:22` / `thincoder-vscode/src/extension/image-handler.mjs:110` 等
**模态与视觉门确实读 spec**，删行的真实后果在这些面上。

### 2.4 逐名处置表（AC-14 · 判据 = 零静默退化）

两档处置：**① 补行**（实测或已核口径取值）/ **② 接受退化**（写明四项影响并逐名认账）；
表内第 14 项为 ① 的变体（**并入既有行**：不新建行，靠前缀遮蔽命中）。**只有上述两档 + 并入形态**——
所有发现均由设计面收账（未处置项另记 §7，不占用本表行、不设第三档处置）；本表 **15 行 = 18 具名 + 1 类未知名**（§2.3 普查 11 名 + 四新名 + 两退役名 + preview 名 = 18，逐名枚举见本表 `#` 列 1–14）。

> **需求口径对齐**：补行门槛 = 「实测**或官方口径**」（两项均可），而非仅实测；
> 但**口径是分字段的**——某名在文档里被点名，只够那一字段（先例 = D-8：`context` 入表但行注必须标「文档口径」）。

| # | 名 | 处置 | 取值依据 / 退化后果（context · maxOutput · 视觉 · 思考） |
|---|---|---|---|
| 1 | `qwen3.7-flash` | ① 补行 | §2.2 全列（实测） |
| 2 | `qwen3.8-flash` | ① 补行 | §2.2 全列（实测） |
| 3 | `qwen3.8-omni-flash` | ① 补行 | §2.2 全列（枚举/maxOutput/图像/`thinking` 均实测；context 网络口径） |
| 4 | `qwen3.8-27b` | ① 补行 | §2.2 全列（同上，context 262 144） |
| 5 | `qwen3.7-plus` | ② 接受退化 | **逐字段口径**：官方口径只到 `context` 一项（文档将其列入「100 万长文档」族）；`reasoningEffortEnum` / `maxOutput` / `thinking` / 视觉 **四名均零口径**（无逐名实测、文档不列档位）⇒ 补行 = 拿 flash 族沿用值填整个能力门（与「补 = 猜」同性质；先例参 D-8：文档口径**只到被点名的单字段**）。退化四项后果见下方「② 类的统一后果」共用行。**认账人** = 用户裁定（删托底行连带） |
| 6 | `qwen3.6-plus` | ② 接受退化 | **逐字段口径**：官方口径 = **仅渠道在册性**（token-plan `/models` 点名）——连 `context` 都未逐名核 ⇒ **五项全零口径**；比 5 更弱。该名为**实际可被用户选中**，退化影响真实存在 |
| 7 | `qwen3.6-flash` | ② 接受退化 | 同 6（口径只到 token-plan `/models` 在册一项，能力四项与 context 均未逐名核） |
| 8 | `qwen3.5-plus` / `qwen3.5-flash` | ② 接受退化 | 两名在普查的三个口径面（服务端实测 / token-plan 清单 / DashScope 文档族）**均无逐名条目** ⇒ 全字段零口径（仅 6 的在册性亦无） |
| 9 | `qwen-flash` / `qwen-turbo` | ② 接受退化 | 老命名族：无实测、无清单点名 ⇒ 全字段零口径（此两名曾完全依赖托底行，退化幅度最大） |
| 10 | `qwen-vl-max` / `qwen-omni-turbo` / `qwen3-235b-a22b` | ② 接受退化 | **视觉退化最重**：「按命名即视觉/全模态档」属**命名推断**（既非实测也非官方逐名口径 ⇒ 不够补行门槛）；退化为 `multimodal` 未声明 ⇒ `read_image` 摘除。认账同 5 |
| 11 | `qwen3-coder-plus` | ② 接受退化 | 渠道清单未见该名 ⇒ 全字段零口径；`thincoder-core/config.mjs:146` 的 `qwen3-coder` 排除门独立存在，**不受影响** |
| 12 | `qwen-max` | ② 接受退化 | 服务端实测 **DashScope 200 活着** ⇒ 与「退役」指令字面矛盾。按裁定删行，退化同 5。**差异上报 = R-1** |
| 13 | `qwen-plus` | ② 接受退化 | 同 12 |
| 14 | `qwen3.8-max-preview` | ①→并入既有行 | 删独立行；查表经 `qwen3.8-max` 前缀**遮蔽命中该行**（实测同对象）⇒ **不退化**，且避开该 preview 名实测的 token-plan **静默映射**陷阱 |
| 15 | 任意 `qwen*` 未知名（未来新档） | ② 接受退化 | 退 `DEFAULT_SPEC` + **`warnUnknownModel` 一次性告警**（`:154-160` 现成，无需新码）⇒ 静默性由该告警消解 |

**② 类的统一后果（四项 · 必须写进 `docs/core/design/PROVIDER.md` 的那段，§2.6-4）**：
上下文 1M→128K（压缩阈值提前，长会话被截）· 输出 131 072→32 000（大改动单轮输出被截）·
视觉能力消失（`read_image` 工具摘除 + 贴图降级为文本）·
思考与 effort 枚举缺失。
`DEFAULT_SPEC`（`:215`）= `{ context: 128_000, maxOutput: 32_000 }`——
`thinking` / `reasoningEffortEnum` / `partialMode` 全缺 ⇒ 思考下拉空、autoThink 直接 `return null`
（`thincoder-core/auto-think.mjs:67-68`）、consult effort 不钳制（`thincoder-core/agent/spawn-child.mjs:188-195`）、
截断续写从 Partial Mode 退到普通续写（`thincoder-core/provider/core.mjs:253`）、
视觉门判据转假（**八个**消费点坐标见 §2.7 第 1 项）。

**判据达成方式**：AC-14 的「无任何一名静默退化」= 本表 15 行（18 具名 + 1 类未知名）穷举 + 上方四项后果共用行 +
测试 T-4 断言「托底名退化形状已知」（不退化成「无人认账的意外」）。

### 2.5 消费面契约（动谁、谁零改）

`thinking` / `reasoningEffortEnum` / `multimodal` / `partialMode` 的**真实消费点**（全仓普查，逐条 `file:line`）：

| 消费点 | 读什么 | 影响 |
|---|---|---|
| `thincoder-vscode/src/extension/provider-probe-window.mjs:65-66` | `reasoningEffortEnum \|\| (spec.thinking ? ["enabled"] : [])` | **本文件零改**：两 flash 档下拉从空变 6/7 档（数据面修复自动生效） |
| `thincoder-vscode/src/extension/settings.mjs:213` | 仅 `reasoningEffortEnum` | 设置面板 effort 枚举补齐（含两新档） |
| `thincoder-core/auto-think.mjs:67-68` | 仅 `reasoningEffortEnum`（无枚举 ⇒ return null） | **autoThink 对两 flash 档从静默失效变生效** |
| `thincoder-core/agent/spawn-child.mjs:188-195` | 仅 `reasoningEffortEnum` | consult/subagent effort 钳制生效（越界值由「放行」转「丢弃」） |
| `thincoder-core/provider/core.mjs:197-203` | 仅 `reasoningEffortEnum`（越界即抛） | 消除一条**现网正在发生**的抛错路径：`qwen3.7-flash` / `qwen3.8-flash` 无枚举 ⇒ `:198` 判据短路、`/think effort high` 直通服务端吃 400；补枚举后该值在枚举内 ⇒ 该路径就地消解。**对照**：`qwen3.8-max` 枚举 `xhigh/medium/low`（`:74`）零改，其 `/think effort high` 抛错 ⇒ 不属本册效果（另见 §7）|
| `thincoder-core/config.mjs:143-156` | 名称前缀 + Bailian 主机（**不读 spec**） | **零改零影响**（§2.3 澄清；两新档前缀 `qwen` 自动覆盖） |
| `thincoder-core/model-specs.mjs:215` · `thincoder-core/model-specs.mjs:292`（`:295` `...spec` 展开） | `cacheMode`（只登记不消费：`DEFAULT_SPEC` 取值 + `providerSpec` 展开复制） | **字段本体整体删除**（§14.2 #11 · 字面清零）——消费面零 ⇒ 删除零行为差；本条效力面收口于 §14 |
| `thincoder-cli/src/tui/cmd-think.mjs:13-16` · `thincoder-cli/src/tui/cmd-think.mjs:131` | `thinkApi` / `thinkEnabledValue` / `reasoningEffortEnum`（`:131`＝`/think on` 默认档取值点） | `:131` 已落（§2.8-1）；`:104` 入口归一 `"none"` ⇒ off 标记（§2.8-2 · A-18，已落）；`:13-16` 读取面零改 |
| `thincoder-vscode/webview/model-picker.js:85` · `:123` | 条目 `reasoning` 枚举 + `effortDefault`（两处归一 = `selectModel` / `handleModelsMessage`） | **回归修复 · 披露面**（§2.8-3 · A-17）：取值式随 §15.4 单源规则收正（`effortSelection` 三支优先序——注册默认优先、无注册默认 ⇒ 中性档 `null`） |
| `thincoder-cli/src/tui/cmd-advisor.mjs:225-255` | `reasoningEffortEnum`（`:235` 档位表 · `:247-253` `← current` 标记） | **出批零改**（listing-only）：会诊池 effort 菜单档位随枚举显真相（含 `"none"`）；无写槽、无载荷面 |
| `thincoder-cli/src/tui/slash-commands.mjs:150-157` | `reasoningEffortEnum`（`:154` 补全候选） | **出批零改**（listing-only）：`/think effort <Tab>` 候选随枚举显真相 |
| `thincoder-cli/src/tui/cmd-config-menus.mjs:84-93` | `reasoningEffortEnum`（读点 `:87`；`none` 去重形 = `thincoder-cli/src/tui/config-helpers.mjs:40-42`） | **出批零改**：枚举含 `"none"` 的档 picker 出双 `none` 行 = **既有形态**（`glm-5` / `glm-5.2` 在册） |
| `thincoder-core/provider/core.mjs:253` | `partialMode` | 四新行沿用 true ⇒ 零变化 |
| **八个**消费点：核 `thincoder-core/tools/index.mjs:64` · `thincoder-core/tools/file.mjs:159` · `thincoder-core/agent/record-results.mjs:51` · `thincoder-core/agent/setup-reminders.mjs:251` · `thincoder-core/provider/normalize.mjs:22` · `thincoder-core/attachments.mjs:54` · VSC `thincoder-vscode/src/agent/tool-table.mjs:177` · `thincoder-vscode/src/extension/image-handler.mjs:43` | `multimodal`（共 **8** 处，逐处语义见 §2.7 第 1 项） | **八个消费点全部零改**；四新行置 true ⇒ 两 flash 档由「蹭来」变「声明」，布尔语义无失真（实测见 §2.7）。 |

**关键事实（修正原后果评估）**：核/CLI 路径上**没有任何一处读 `spec.thinking`**
（全仓 `spec.thinking` 仅 1 处消费 = 上面 VSC 那行（`thincoder-vscode/src/extension/provider-probe-window.mjs:66`）+ 1 处测试断言）。
⇒ 危害面 = **VSC 下拉显隐 + effort 枚举缺失 + autoThink 静默失效**，
**不是**「请求体发错字段」——请求体的思考开关由 `thincoder-core/config.mjs:146` 名称白名单兜住
（`doc:PROVIDER.md:§12`）。

### 2.6 `enable_thinking` 的契约归属（开放项 3 裁定）

**裁定：不新增 `thinkToggleApi` 字段；`reasoningEffortEnum` 含 `"none"` 是「可关」的唯一枚举表达。**

1. `enable_thinking` 已是**名称 + 主机驱动**的白名单（`thincoder-core/config.mjs:143-156`），与 spec 无耦合，
   qwen 全族（含四新档）自动覆盖；新增 spec 字段 = 同一语义两处真源（违 D2 单权威源）。
2. 两条关闭路径职责不同，**不是二义**：`reasoning_effort:"none"` = 服务端参数（枚举内合法值，
   实测）；`enable_thinking:false` = 面板/`/think off` 的显式 off 标记
   （`provider.thinking === null`）所触发。**但两侧不得互补**：判据序 = ① effort 有值且非 `"none"` ⇒ `true`
   ② `thinking === null` ⇒ `false` ③ effort truthy ⇒ `true`（机制正文与百炼互斥约束 = `doc:PROVIDER.md:§6.12`；
   实现 = `thincoder-core/config.mjs:143-156`）⇒「标记缺失 + effort = `"none"`」= `true` + `"none"`
   同携（矛盾载荷，面板显示 `Thinking: ON` 与实际关思考分叉）；该组合在生产端消除（§2.8-2 · A-18），三条判据之外零改（§7 边界）。
3. VSC off 链路已验证可达：`thincoder-vscode/webview/model-picker.js:64` → `thincoder-vscode/src/extension/reasoning-mode.mjs:22-24`
   （`{thinking:null, reasoningEffort:null}`）→ `thincoder-core/provider/core.mjs:209` → `enable_thinking:false`。
   qwen 新行不带 `"enabled"` 下拉项（枚举无该值），off 走 `"none"` 一档，AC-7 语义满足。
4. 该「两机制并存」事实须写进 `docs/core/design/PROVIDER.md`（§3 影响文件表末行）——文档义务在此。

### 2.7 omni 系模态：`multimodal` 维持布尔（裁定）

**裁定：不扩 `modalities` 字段**；音频/视频以**行注承载**，不入结构化字段。

1. **布尔语义无失真（实测）**：`multimodal` 全部 **8** 个消费点的判据都是**图像**（坐标一律自仓根完整路径）：
   核 `thincoder-core/tools/index.mjs:64`（`read_image` 注册门）· `thincoder-core/tools/file.mjs:159`（读图门）·
   `thincoder-core/agent/record-results.mjs:51` 与 `thincoder-core/agent/setup-reminders.mjs:251`（多模态注入门）·
   `thincoder-core/provider/normalize.mjs:22`（`type:"image_url"` part 剥除门）·
   `thincoder-core/attachments.mjs:54`（非多模态判据 `specForModel(model).multimodal !== true`——原普查未含）；
   VSC `thincoder-vscode/src/agent/tool-table.mjs:177`（贴图门）·
   `thincoder-vscode/src/extension/image-handler.mjs:43`（贴图门）
   ⇒ 「支持图像输入」这一语义对 omni 档**恰好为真**，不存在「装不下四模态」的实际破损。
2. **扩字段必造死字段**：全仓**无任何音频发送路径**（实测：无 `input_audio`、
   无 `type:"audio"` 字面量；`RASTER_IMAGE_URL = /^data:image\/(png|jpe?g|gif|webp);base64,/`
   本就排除 `data:audio/`，`thincoder-core/provider/normalize.mjs:11`）⇒ `modalities` 写进来后
   **零个消费点**，只剩「登记了但没人读」的第二真源风险（违 D2 单权威源）。
   （注：`thincoder-core/tools/file.mjs:138` 的 `multimodal` 是**工具属性**（返回值带图），与模型 spec 无关，不入此计数；端同名实现已取核。）
3. **本环境不接音频输入**：ACP 侧 `promptCapabilities` 全 `false`
   （`thincoder-cli/src/acp/client-caps.mjs:59`）⇒ 用户无法向本工具投喂音频，
   声明服务端音频能力对产品行为无意义。
4. **「逐名显式声明」的承诺不失**：该承诺针对**能力门**（thinking / 枚举 / 视觉 / 上下文），
   音频不属本仓任何能力门 ⇒ 写入行注即可（omni 行注：「服务端另受理音频输入
   （实测进到 URL 解析）；本仓调用面只发图像，音频不入」）。
5. **未来若要接音频**：按「消费点先存在、字段后登记」补结构化模态，属新批次新需求。

### 2.8 枚举首项陷阱三面（CLI `/think on` · CLI `/think effort none` · VSC picker 归一）

**面 1（裁定）**：`thincoder-cli/src/tui/cmd-think.mjs:131`：`/think on`（effort 型）`delete cur.thinking` 后，若 `reasoningEffort` 为空
取 `spec.reasoningEffortEnum?.[0] ?? "high"`。四新档枚举首项是 **`"none"`** ⇒ 「开思考」
实际把思考关掉（服务端实测证 `"none"` = 关）。

- **修法（父侧裁定）**：on 默认档取**首个非 `"none"` 档**——实现形态
  `spec.reasoningEffortEnum?.find((v) => v !== "none") ?? "high"`；四新档 ⇒ `"minimal"`。
  无枚举模型的 `?? "high"` 回退语义**零改动**保持。
- **退化形态处置（设计裁定，§4 D-9）**：枚举在场但**全部成员为 `"none"`** ⇒ 同落 `"high"`（与无枚举同型），
  不抛错、不留空。四新档均有非 `none` 成员，该形态仅防御面。
- **测试落点**：`applyThink` 改具名导出（行为零变化，供注入合成 spec）；新增
  `thincoder-cli/test/cmd-think.test.mjs`（ctx 直驱形态同 `thincoder-cli/test/cmd-eng.test.mjs`；
  runner 自动收集 `test/*.test.mjs`，`thincoder-cli/test/run.mjs:3`）。判据 = §5 A-16 · 用例 T-14；`"none"` 面的判据 / 用例 = §5 A-18 / T-16。
- **枚举形状锚**：T-12 钉「登记顺序 = 服务端原文、首项 `"none"`」（D-5 证据登记忠实性）。
- **面 2（裁定②）：CLI `/think effort none` ⇒ 关思考**。判据：`e.action === "effort"` ∧ `e.level === "none"`
  ⇒ 终态必须落**显式 off 标记**（`cur.thinking = null`）；终态若为「档位 `"none"` + 标记缺失」则
  `resolveEnableThinking`（判据序 ①②③ = §2.6-2；机制正文 = `doc:PROVIDER.md:§6.12`；
  实现 = `thincoder-core/config.mjs:143-156`）返 `true` ⇒ 载荷 `enable_thinking:true` + `reasoning_effort:"none"` **同携**（矛盾载荷），
  面板 `:48-49` 亦显 `Thinking: ON`。该档位随四新档入册进入可达面。修点在**生产端**（`:104`）：
  `"none"` 落 off 标记，`resolveEnableThinking` 的三条判据零改（§7 边界）。effort 值写法（保留 `"none"` / 清除）
  两形态均落 off（qwen 侧由 `thinking === null` 主导 `enable_thinking:false`；effort 族侧由 §9.6 D-14
  判据补发 `reasoning_effort:"none"`）⇒ 判据不区分两形态（§5 A-18 · 用例 T-16 + T-9 第四态）。
- **回执面第三处落位**：循环回执公式 `thincoder-cli/src/tui/cmd-think.mjs:86-87` 补 `cur.thinking !== null` 守卫
  ——缺守卫时 effort 型 off 后回执误报 `Thinking: ON`（与菜单头 `:48-49` 同式单一口径）。
- **面 3（裁定①）：VSC picker 归一 = `effortDefault` 优先**。`thincoder-vscode/webview/model-picker.js`
  两处归一（`:85` `selectModel` · `:123` `handleModelsMessage`）取值式现 = §15.4 单源规则（`effortSelection` 三支优先序：已存值 ∈ 枚举 > 注册默认 ∈ 枚举 > **中性档 `null`**）——
  **不读 `effortDefault` 时**，四新档枚举首项 `"none"` 会把「当前档 ∉ 新枚举」的归一落到关思考（静默 off）；
  同根面 = `thincoder-vscode/webview/settings-state.js` 兜底链（AC-13 逐档登记链所依赖），`effortDefault` 来源 =
  `thincoder-vscode/src/extension/provider-probe-window.mjs:67`。用例 T-17
  = `thincoder-vscode/test/model-picker-fallback.test.mjs`（② 负控随 §15.4 改判：无注册默认 ⇒ 中性档，**不得**落 `levels[0]`）。
- **`settings-state.js` 兜底链面（AC-13 登记链所依赖）**：`effortDefault || levels[0] || null` 形式与面 3 取值式同源
  ⇒ 触发路径由 AC-13 逐档登记消除；A-13 不是体验项，而是防默认值退化的护栏（VSC 端壳 extension 面零改）。

## 3. 影响文件清单

| 文件 | 现行数 | 预期增删 | 内容 |
|---|---|---|---|
| `thincoder-core/model-specs.mjs` | **253** | — | 4 新行（每行配 2–3 行证据行注）+ 4 行删除（preview / qwen-max / qwen-plus / 泛前缀 `qwen`）——无新字段、无新导出 |
| `thincoder-vscode/src/specs.mjs` | **102**（2026-10-23 `wc -l`） | — | `EFFORT_DEFAULT_PREFIXES`（表体 `:22-36`，匹配器 `:38-52`）**补 5 档**（各自独立键、不用族前缀，A-13）——AC-13 |
| `thincoder-vscode/test/image-downgrade.test.mjs` | **253** | — | VSC 端差表（`thincoder-vscode/src/specs.mjs`）的单元测试档就在此文件（T36 / W16 / T38 三段），但仅测 deepseek / glm / kimi 族，qwen 档的 `EFFORT_DEFAULT_PREFIXES` 展开不在射程（补行盲区）⇒ A-13 的测试落点 = 本文件新增用例（T-15） |
| `thincoder-core/test/model-specs.test.mjs` | **395** | — | 新用例族：四档逐字段、两 flash 档枚举不等、托底删除后果（T-3/T-4）、退役名遮蔽与退化（T-5/T-6）、既有族零回归；**`:29` 一行删除**（`cacheMode` 断言移出用例，§4 D-10 / T-13） |
| `thincoder-core/test/provider-merge.test.mjs` | **307** | — | `enable_thinking` 三态对两新档（A-7）；T-9 第四态（`:216-218`，同携态 ⇒ `false`，裁定② · A-18）；现行数含 `B-1…B-6` 增量 |
| `thincoder-cli/src/tui/cmd-think.mjs` | **152** | — | `:131` on 默认档 = 首个非 `"none"` 档（§2.8-1）；`:104` effort 分支 `"none"` ⇒ 显式 off 标记（§2.8-2 · A-18）；`applyThink` 具名导出；`:86-87` 循环回执守卫（裁定② 第三处 · §2.8 面 2 末条）|
| `thincoder-cli/test/cmd-think.test.mjs` | **154** | — | T-14（四新档 `"minimal"` / 退化形 `["none"]` ⇒ `"high"` / 无枚举 ⇒ `"high"`；形态同 `thincoder-cli/test/cmd-eng.test.mjs`）+ **T-16** |
| `docs/core/design/PROVIDER.md` | **445** | — | 登记三件事：`enable_thinking` 与 effort 两机制并存 · 泛前缀托底行取消后的退化后果 · qwen 族模态与音频未接入（§7「不扩 `modalities` 结构化字段」条）——**该档属设计面，不入实施面** |
| `thincoder-vscode/webview/model-picker.js` | **149** | — | **回归修复 · 披露面**（§2.8-3 · A-17 · 裁定①）：两处归一改 `effortDefault` 优先（`:85` / `:123`；对端同根面 = `thincoder-vscode/webview/settings-state.js` 兜底链）——补枚举使 `levels[0]` 对四新档落 `"none"`；该取值式随 §15.4 收正 |
| `thincoder-vscode/test/model-picker-fallback.test.mjs` | **221** | — | **回归修复 · 测试**：T-17；既有 ② 用例标题/注释按新语义（fixture 无该档 ⇒ 断言值不变） |

**行数上限**：本表产品码/单元测试档读数 = 253 / 84 / 253 / 395 / 304 / 152 / 154 / 149 / 221（行序同上）；**最新读数面 = §14.6**。
**本文件自身**增删零越线；**两档现越 300 软线**（`thincoder-core/test/model-specs.test.mjs` 395 · `thincoder-core/test/provider-merge.test.mjs` 304）——增量均来自 `[onboard]` / `B-1…B-6` 段；硬限 500 未越。
越线两档的**拆分计划**登记面 = `thincoder-core/test/core-hygiene.test.mjs` 的 `SOFT_LINE_REGISTRY`（`docs/core/design/CORE-UNIFICATION.md` §2.8.1 子表现读空壳）——不拆档——单档内聚 + 消解窗口；`thincoder-vscode/test/model-picker-fallback.test.mjs`（221）仍 < 300。

`thincoder-core/auto-think.mjs` / `thincoder-core/agent/spawn-child.mjs` / `thincoder-core/config.mjs` /
`thincoder-core/tools/index.mjs` /
`thincoder-core/provider/normalize.mjs` / `thincoder-vscode/src/extension/provider-probe-window.mjs` **零改动**（消费方，§2.5 / §2.7）。

**交付面已对齐**：本表 **10 行** = 九条产品码/测试文件 + `docs/core/design/PROVIDER.md`（D1）；
修正轮 +2 行 = `thincoder-vscode/webview/model-picker.js` + `thincoder-vscode/test/model-picker-fallback.test.mjs`
（**回归修复 · 披露面**，§2.8-3 / A-17 / 裁定①，两档均已落盘）。
## 4. 关键决策记录

| # | 决策 | 理由 |
|---|---|---|
| D-1 | 删 `qwen` 托底行，退化逐名认账（§2.4） | 用户裁定「不需要它托」；继承式托底是静默失实的源头（§2.3 普查 11 名靠它拿 1M 上下文与视觉） |
| D-2 | 托底名一律接受退化，不据「同族类推」补行 | 补行取值 = 文档口径 + 同族沿用填整张能力门（`thinking` / 枚举全无实测）⇒ 与「补 = 猜」边界同性质；且「接受退化」是用户裁定的**直接后果** |
| D-3 | 两新档 `thinking` = **`true`（实测级）**——定向探针实证后登记 | 证据到位即按证据翻正（裸请求 `reasoning_content` 在场、`reasoning_tokens`＝49，`effort:"none"` 即消失）；「无证据不登记」纪律维持 |
| D-4 | `multimodal` **维持布尔**，音频/视频只入行注 | 读码实测：全仓**无音频发送路径**、`thincoder-core/provider/normalize.mjs` 只处理 `image_url` part 且正则已排除 `data:audio/` ⇒ 新字段**零消费者** = 死字段与第二真源（§2.7）；布尔对「支持图像」语义无失真 |
| D-5 | 枚举登记取**服务端 400 原文顺序**（`none` 首位） | 服务端自述顺序 ≠ 强度序（`max` 在 3.8-flash 列**末位**）⇒ 重排 = 编造证据不支撑的语义。**代价已知**：§2.8 的 `/think on` 档陷阱（取首个非 `"none"` 档）+ VSC「枚举首项兑底」路径落到 `"none"` ⇒ 由 `EFFORT_DEFAULT_PREFIXES` 显式登记规避（AC-13） |
| D-6 | `qwen3.8-max-preview` 删行后**靠 `qwen3.8-max` 前缀遮蔽**取规格 | 实测两者返回同一对象 ⇒ 该名不退化；preview 名在 token-plan 被**网关静默映射**为 `qwen3.8-max` |
| D-7 | `qwen-max` / `qwen-plus` 删行（服务端正 200 活着） | 用户退役指令优先 ⇒ 现退化为 `DEFAULT_SPEC`，差异如实上报（R-1） |
| D-8 | `context` 文档/网络口径入表 + 行注标明；27b 取 262 144 | 缺 `context` = 整行不可用；需求已裁「允许入表但须标来源」。27b 的 1M 是 YaRN 外推（本地部署特性），DashScope API 实供未证 ⇒ 取原生值保守（AC-12「按证据取值」） |
| D-9 | `/think on` 默认档 = **首个非 `"none"` 档**（find 形态）；全 `"none"` 退化形态 ⇒ 回退 `"high"`（与无枚举同型） | 回退 `"high"` = 现 fallback 零改动；病态形态无在册实例，属防御面（判据 = T-14 / A-16）。「首个非 none 档」修法本体 = 父侧裁定 |
| D-10 | `cacheMode` 登记为**信息性字段**：四新行取 `"none"`，**其值对运行行为零影响**；字段去留出面 | 读码实测：全仓无判据消费（唯二落点 = `thincoder-core/model-specs.mjs:118` 的 `DEFAULT_SPEC` 兜底取值与 `:198` 的 `providerSpec` 展开复制）。删字段 = **未要求且不可实测**的顺手结构改动，违「无新字段/无新导出」边界与口径（§3）⇒ 以本行裁定将其**性质明示**（不据其取值做行为断言、不再新增断言）。**结项**：字段本体随 §14.2 #11 整体删除、字面清零 |

## 5. 验收标准回指（逐条指回需求）

| AC | 机读判据（可直接进测试） | 回指 |
|---|---|---|
| A-1 | `specForModel("qwen3.7-flash").thinking === true` 且 `specForModel("qwen3.8-flash").thinking === true` | AC-1（动机按 §2.5 修正：门控/枚举，非请求体） |
| A-2 | 3.7-flash `reasoningEffortEnum` `deepEqual` `["none","minimal","low","medium","high","xhigh"]` | AC-2 |
| A-3 | 3.8-flash `deepEqual` 上述 + `"max"`；并断言 A-2 与 A-3 两数组**不相等** | AC-3 |
| A-4 | 四新档 `maxOutput === 131_072` | AC-4 |
| A-5 | `specForModel("qwen3.7-flash").multimodal === true`、`qwen3.8-flash` 同 | AC-5（实测形态 = 已进入图像解码校验，非 text-only 拒绝） |
| A-6 | 三档 `context === 1_000_000`；`qwen3.8-27b` `context === 262_144`；源码行注含「文档口径/网络口径」（人工核） | AC-6 |
| A-7 | `resolveEnableThinking({model:"qwen3.8-flash" \| "qwen3.8-omni-flash", baseURL:<bailian>, thinking:null}, spec) === false`；`reasoningEffort:"high"` ⇒ `true`；均无 ⇒ `undefined`；**同携态 ⇒ `false`**（§2.6-2）| AC-7 + §2.6（网络实测不入测试）|
| A-8 | VSC `specForModel("qwen3.7-flash").reasoningEffortDefault === "high"`、`"qwen3.8-flash"` 同 | AC-8（默认档证据 = 文档口径 · R-6） |
| A-9 | 托底行取消落地：`specMatch("qwen").matched === false`（泛前缀键已删 ⇒ 该名自身退 DEFAULT_SPEC）+ `specForModel("qwen-flash").context === 128_000`。**不采用**「两 spec 对象不等」式断言 | AC-9（开放项 2 已由用户裁定为删行，无需选型） |
| A-10 | 三端测试全绿 = 门禁读数：核 `node test/run.mjs` · CLI `npm test` · VSC `node test/run.mjs` 均 `fail 0`；用例含「两 flash 档枚举不等」差异断言（A-3） | AC-10（项目纪律「每次改动必须跑起来验证」） |
| A-11 | 锚引用：本册面零悬空 · 行宽：射程零新增（人工核；全仓既有残余不在本册笔面） | AC-11 |
| A-12 | 两新档各得独立行：枚举 7 档含 `"max"`、`maxOutput 131_072`、`multimodal true`、context 按 §2.2、`thinking === true`（实测级） | AC-12 |
| A-13 | `EFFORT_DEFAULT_PREFIXES` 收录**全部在册 qwen 档**（六档 = 四新档 + `qwen3.7-max` + `qwen3.8-max`；表体 `thincoder-vscode/src/specs.mjs:22-36`）⇒ **补 5 档**：两 max 档→`xhigh`、四新档→`high`；且无族前缀条目。**测试落点** = `thincoder-vscode/test/image-downgrade.test.mjs` 新增用例（T-15）——该档现有用例不覆盖 qwen ⇒ **不得以「已有用例」为凭据声称已测**（§3）| AC-13（取值裁定见 §2.2 / D-5） |
| A-14 | 逐名处置表 **15 行 = 18 具名 + 1 类未知名**穷举 + 测试断言退化形状已知（`specForModel("qwen3.7-plus").context === 128_000`）；未知 qwen 名经 `warnUnknownModel` 告警一次 | AC-14 |
| A-15 | 退役名查表结果：`specForModel("qwen3.8-max-preview")` **同一对象** 于 `specForModel("qwen3.8-max")`（遮蔽不退化）；`specForModel("qwen-max")` `context === 128_000`（退化认账） | 处置裁定 ①② |
| A-16 | CLI `/think on` 后 `cur.reasoningEffort`：四新档 ⇒ `"minimal"`（首个非 `"none"` 档）；无枚举 ⇒ `"high"`（既有回退零变化）；合成退化枚举 `["none"]` ⇒ `"high"`；三态均**不得**写入 `"none"`，且 `thinking` 显式 off 标记被清除。【前提】本判据属**新增断言**而非回归断言（落地载体 = `thincoder-cli/test/cmd-think.test.mjs`，已落）（R-12）| 升格必修 + §2.8-1 / D-9  |
| A-17 | picker 归一：条目载 `effortDefault` 时「当前档 ∉ 枚举」取 `effortDefault` 而非 `levels[0]`（`thincoder-vscode/webview/model-picker.js:85` · `:123`；无注册默认 ⇒ 中性档——**不得**回落 `levels[0]`，判据单源 = §15.4）⇒ qwen 四新档不得被归一成关思考 | §2.8-3；用例 T-17（② 负控随 §15.4 改判） |
| A-18 | CLI `/think effort none` ⇒ 关思考：终态 `thinking === null` ∧ `reasoningEffort ∈ {"none", undefined}` ⇒ 载荷不得同携 `enable_thinking:true` + `reasoning_effort:"none"`，面板不得显 `Thinking: ON`（`thincoder-cli/src/tui/cmd-think.mjs:48-49` 菜单头 · `:86-87` 循环回执公式 = 同式 `!== null` 守卫；后者零测试射程）| §2.6-2 / §2.8-2；用例 T-16 + T-9 第四态 |

## 6. 用例表（正常 / 边界 / 错误 · 17 条）

| # | 场景 | 输入 | 期望 |
|---|---|---|---|
| T-1 | 正常：两 flash 档独立行 | `specForModel` 两档名 + `specMatch` | 逐字段等 §2.2；两名均 `matched:true`（独立行命中，不靠托底）|
| T-2 | 正常：两 flash 档枚举不等 | 两档 `reasoningEffortEnum` | 3.8 比 3.7 多且仅多 `"max"`；`deepEqual` 断两数组不等 |
| T-3 | 边界：托底行已删（AC-9/14） | `specMatch("qwen")` / `specMatch("qwen-flash")` | 两名的键均已删 ⇒ `matched:false`、退 `DEFAULT_SPEC`（`context 128_000` / `maxOutput 32_000`）|
| T-4 | 边界：借托底名退化形状已知（AC-14） | `specForModel("qwen3.7-plus")` | `context 128_000`、`multimodal undefined`、无枚举（§2.4 表第 5 行认账的形状） |
| T-5 | 正常：退役名遮蔽路径（A-15） | `specForModel("qwen3.8-max")` / `("qwen3.8-max-preview")` | **同一对象**（实测过的前缀遮蔽行为，不退化） |
| T-6 | 正常：两新档独立行（AC-12） | `specForModel("qwen3.8-omni-flash")` / `("qwen3.8-27b")` | 枚举 7 档含 `max`、`maxOutput 131_072`、`multimodal true`、`thinking true`（实测）、context 分别 1M / 262 144 |
| T-7 | 边界：模态位语义单一（§2.7） | 全表扫描 | 任何行**不得出现 `modalities` 键**（本表模态面只有 `multimodal` 布尔一字段）；`multimodal` 仅 true/undefined 两态 |
| T-8 | 错误：effort 越界抛错门 | `qwen3.7-flash` + `reasoningEffort:"max"` 组请求体 | 抛 `not supported by model`（3.7-flash 枚举无 `max`，A-3 反向门）；落点在 `thincoder-core/provider/core.mjs:198-203`，按既有装配导出面调用，不新增导出 |
| T-9 | 正常：`enable_thinking` 白名单零回归 + 同携态（A-7） | `resolveEnableThinking` **四态**：`{thinking:null}` / `{reasoningEffort:"high"}` / `{}` / **同携态 `{thinking:null, reasoningEffort:"none"}`** × 两新档 | `false` / `true` / `undefined` / **`false`**（判据顺序见 §2.6-2；风格同 `thincoder-core/test/provider-merge.test.mjs`） |
| T-10 | 正常：VSC 默认档（AC-13） | VSC `specForModel(四档 + qwen3.7-max / qwen3.8-max).reasoningEffortDefault` | 四新档 `high`；两 max 档 `xhigh`（`EFFORT_DEFAULT_PREFIXES` 命中端差行返拷贝，`thincoder-vscode/src/specs.mjs:55-59`） |
| T-11 | 边界：既有族零回归 | deepseek/kimi/glm/gpt/MiniMax/mimo 各一代表名 | 字段逐字不变（防误删误改行） |
| T-12 | 边界：枚举登记形状锚（§4 D-5） | 四新档 `reasoningEffortEnum[0]` 与末位成员 | 首项均为 `"none"`；3.7-flash 末位 `xhigh`、3.8-flash 与两新档末位 `max` ⇒ 钉住「登记顺序 = 服务端原文顺序」的证据忠实性——有人按强度序重排即红，必须回 §4 决策面重裁 |
| T-13 | 边界：`cacheMode` 系信息性字段（§4 D-10）| ① 全仓搜 `cacheMode`：除 `thincoder-core/model-specs.mjs` 与 `thincoder-vscode/src/specs.mjs`（表自身 + 端差拷贝）外，出现于**任何判据位置** ⇒ 红；② 单元测试档新增 `cacheMode` 取值断言 ⇒ 红 | 零判据消费点 ⇒ 四新行取 `"none"` 不影响任何行为；无消费者即不断言（防把死字段当能力位钉住）|
| T-14 | 正常＋边界：CLI `/think on` 首个非 `none` 档（§2.8 / A-16）| 注入合成 spec 直驱 `applyThink`：四新档枚举 / 退化枚举 `["none"]` / 无枚举 | 四新档 ⇒ `reasoningEffort === "minimal"`；退化形与无枚举 ⇒ `"high"`；三态均不写入 `"none"`、`thinking` 标记已清除（`thincoder-cli/test/cmd-think.test.mjs`） |
| T-15 | 正常：VSC 端差默认档覆盖 **qwen 全档**（A-13）| VSC `specForModel` 逐档：四新档 + `qwen3.7-max` + `qwen3.8-max`；另加「无族前缀条目」结构断言 | 四新档 → `high`、两 max 档 → `xhigh`；`EFFORT_DEFAULT_PREFIXES` 任一键均没有同为键前缀的兄弟（防族遮蔽）。落点 = `thincoder-vscode/test/image-downgrade.test.mjs` 新增段  |
| T-16 | 正常＋边界：CLI `/think effort none` 关思考（§2.8-2 / A-18）| 注入合成 spec 直驱 `applyThink`：`{action:"effort", level:"none"}` 于「有档无标记」态 | 终态 `thinking === null`；`reasoningEffort ∈ {"none", undefined}`（两写法均须 `resolveEnableThinking(...) !== true`）；载荷无矛盾对；落点 = `thincoder-cli/test/cmd-think.test.mjs`  |
| T-17 | 正常＋边界：VSC picker 归一 `effortDefault` 优先（§2.8-3 / A-17）| `model-picker.js` 归一函数直驱：① 条目载 `effortDefault:"high"` + 枚举含 `"none"`，当前档 ∉ 枚举；② 负控 = 条目**无** `effortDefault` | ① 归一取 `"high"`（不得落 `"none"`）；② **中性档**（不落 `levels[0]`——与 §15.7 E-8 同判据，§15.4 改判）；落点 = `thincoder-vscode/test/model-picker-fallback.test.mjs`  |

## 7. 边界（不做）

- 不改 `thincoder-core/auto-think.mjs`、`thincoder-core/agent/spawn-child.mjs`、`thincoder-core/config.mjs`；
  `thincoder-cli/src/tui/cmd-think.mjs` 只改三处取值面：`:131` on 默认档 + `:104` `"none"` ⇒ off 标记
  （§2.8-1 / §2.8-2）＋ `applyThink` 具名导出＋ `:86-87` 循环回执守卫（同裁定② 第三处，§2.8 面 2 末条）——CLI 面板 / picker / `:16` 列表语义零触碰（**例外 = 上述回执守卫：交互循环仅此一处公式入册面**）；
  **VSC picker 归一 = 回归修复**（§2.8-3 / A-17，另列；取值式随 §15.4 收正——无注册默认 ⇒ 中性档「—」）。
- 不给 `specMatch` 的 `matched` 位加第三态；不改 `lookupSpec` 返回形状与热路径。
- 不新增思考关闭开关：`"none"` 已是枚举成员（四新档首项），`resolveEnableThinking`（`thincoder-core/config.mjs:143-156`）对显式 off 的既有覆盖即够（§2.6）——该函数现无「effort=none ⇒ `enable_thinking:false`」分支，不加；`"none"` 面的矛盾组合消除在**生产端**（§2.8-2 / A-18），不经该函数。
- 不为 qwen 之外的族新增/删除任何托底或冗余行（`glm` / `mimo` 族泛前缀行为**既有已核验设计**，不碰）。
- 不扩 `modalities` 结构化字段（§2.7 裁定）；不改 **8** 个 `multimodal` 消费点的任何判据（八处完整坐标 = §2.5 表末行 + §2.7 第 1 项）。
- 不引入网络探测 / 自动校正；全部字段均**人工登记**。
- 不修 VSC 默认档兑底链（`thincoder-vscode/webview/settings-state.js:44-49`——未登记时取枚举首项）：由 `EFFORT_DEFAULT_PREFIXES` 逐档登记消除其触发路径（§2.8 / §2.2 端差表）。
- 探针脚本 `thincoder-cli/test/smoke-qwen-thinking.mjs:24-30` 的**扩档执行**不改（入参 = 显式 `provider:model`；全档无硬编码模型名字面量）——扩档需密钥实操作，归父侧/用户（§2.2 末）。
- 不给 omni 之外的行添加模态行注。
- **不修 `qwen3.8-max` 的 effort 枚举越界抛错面**：该档枚举 `xhigh/medium/low`（`thincoder-core/model-specs.mjs:74`）
  零改（取值无实测依据，补 = 猜）
  ⇒ 不据其改动任何判据或文案。

## 8. UI/交互决策（全落地，无 open）

| 界面/交互面 | 决策 |
|---|---|
| CLI `/think` 面板（四新档） | effort 列表从硬回退 `["high","max"]` 变真实 6/7 档；`/think on` 取首个非 `"none"` 档（四新档 ⇒ `"minimal"`，§2.8-1 · A-16）；`/think effort none` = 关思考（§2.8-2 · A-18）；Thinking 开关行仍隐藏（`thinkApi:"effort"` 既有语义，`thincoder-cli/src/tui/cmd-think.mjs:55`） |
| VSC 思考下拉（两 flash 档） | 6 / 7 档逐档列出（读 `reasoningEffortEnum`），**无** `"enabled"` 项；默认标签 = `high`（`EFFORT_DEFAULT_PREFIXES` 逐档登记，`thincoder-vscode/src/specs.mjs:19-21`）；切/开模型归一 = §15.4 单源规则（注册默认优先 > 中性档「—」）（`thincoder-vscode/webview/model-picker.js:85` · `:123`——§2.8-3 · A-17） |
| VSC 下拉 off 项 | 沿用 `thincoder-vscode/webview/model-picker.js:61` 既有渲染：`"none"` 档按钮文案显 `"off"`（零改）；选中 `"none"` 的载荷 = **真 off**（`thincoder-vscode/src/extension/reasoning-mode.mjs:22-24`——**载荷形随 §16.2 按族取形**）——与 CLI 侧 §2.8-2 同语义 |
| 未知 qwen 名的可见性 | 走既有 `warnUnknownModel` 一次性 `console.warn`（`thincoder-core/model-specs.mjs:154-160`），**不进 TUI 对话流**、不入状态栏——启动诊断面，非交互内容 |
| **两端默认强度分叉（已知后果 · 裁定注）** | 同一模型 CLI `/think on` ⇒ `"minimal"`、VSC 面板默认 ⇒ `"high"`——两端默认档**有意不同**，不是缺陷：CLI 侧取「首个非 `none`」是「off 翻转」修复的产物（父侧裁定 · §2.8 / D-9），VSC 侧取服务端默认档（文档口径 · R-6）⇒ **不并入统一**，后续批次若要统一须新裁定（防当缺陷返工）|

无 `open` 项。

## 9. 渠道行集（腾讯 TokenHub / 火山方舟豆包 Seed）

### 9.1 登记规则（立 · D-11）

**能力位无族据一律不声明（族沿用须点名来源行 + 行注标级）；尺寸位可沿用**——按证据等级分档：

| 字段类别 | 错登记的后果 | 登记策略 |
|---|---|---|
| 尺寸类（`context` / `maxOutput`） | 保守侧退化（压缩阈值偏早 / 显示偏小），不发往服务端 | 实测值优先；无实测 ⇒ 同族沿用或参考口径，**行注必标** |
| 能力位（`thinking` / `thinkApi` / `reasoningEffortEnum` / `multimodal`） | **用户可见硬失败**：越界档位被 `thincoder-core/provider/core.mjs:198` 客户端抛错门拦截；`thinking` 参数误发被服务端 400 | **实测值优先；无实测有族据（同表已声明族行——点名来源行，取值适用）⇒ 可族沿用照写 + 行注标级；无族据 ⇒ 一律不声明**（不得凭同族类推 / 跨渠道同模型推断补声明） |

判据出处：族沿用准入（点名来源行 + 行注标级）= `MODEL-BENCH.md` §4 KD-36 三态②。

**消费点随登记同变（适用项）**：`thinkApi` 现有消费点三处（本轮实 grep 入仓码面：**核内零读取**，读点均在端侧）
= `thincoder-cli/src/tui/cmd-think.mjs:13`（交互命令的 effort-only 分叉）· `thincoder-cli/src/tui/cmd-advisor.mjs:104` 与 `:234`
（advisor 同型分叉）· `thincoder-vscode/src/extension/reasoning-mode.mjs:27`（面板 `enabled` 项的 off-marker）；
字段含义 = 定义注 `thincoder-core/model-specs.mjs:21`。**核内首个消费点 = D-14（AC-9）**：其修法在
`thincoder-core/provider/core.mjs` 载荷组装段新读 `spec.thinkApi` ⇒ 该字段自此不再只是端侧概念（三端 UI 零改，
判据不变）。本段形制参照 = 同档 **D-10**（`cacheMode` 因零消费点被定性为信息性字段），方向相反而纪律同源：
字段消费状态变了，登记面就得跟着说清。

### 9.2 表变更清单（五新行，零删除、零改既有行）

| 动作 | 行 | 证据等级 |
|---|---|---|
| 新增 | `hy3` | 全针实测 |
| 新增 | `hy3-preview` | 在场实测（401 前验活）；能力位**未探针** ⇒ 尺寸行 |
| 新增 | `hy4-preview` | 在场实测（`/models` + 401）；能力位**未探针** ⇒ 尺寸行 |
| 新增 | `doubao-seed-2-0-code-preview-260215` | 全针实测（含服务端 400 原文枚举 + `max_tokens` 上限 400） |
| 新增 | `doubao-seed-2-0-lite-260428` | 同族全针 ✓（lite 行明列：思考 tok=161 / 视觉 "Red" / 上限 131 072 / echo 真名） |

段位置：实施面按表内既有族注释风格落位（建议：Gemini 族段尾新建 `// Tencent Hunyuan (TokenHub)` /
`// Doubao Seed (Volcano Ark)` 两族段）——表序不影响查找（`SORTED_SPECS` 按前缀长度降序，
`thincoder-core/model-specs.mjs:111`）。端点口径：腾讯 TokenHub = `https://tokenhub.tencentmaas.com/v1`；
火山方舟 = `https://ark.cn-beijing.volces.com/api/v3`。渠道预置面（`PROVIDER_PRESETS`）裁定 = §9.6 D-13。

前缀遮蔽自查：`hy3` 是 `hy3-preview` 的前缀 ⇒ 两名均显式在册，
`SORTED_SPECS` 按前缀长度降序（`thincoder-core/model-specs.mjs:111`）保证长名先命中；
`hy3` 前缀将遮蔽未来同族新档（`hy3-plus` 类）。
现状核对（设计轮实跑）：五名 `specMatch` 全为 `matched:false`（今日靠 `DEFAULT_SPEC` 128K/32K 兜底并每次首请求告警）。

**前缀继承面现状核对**：网关 124 名全量筛 `hy*|hunyuan*`——其余名 = `hy-image-v3` /
`hy-vision-2.0-instruct` / `hunyuan-t1-vision-*` / `hunyuan-turbos-vision-video-*` / `hy-mt2-{pro,plus,lite}` / `hy-role` /
`hunyuan-role-latest` / `hy-3d-*` 族 / `hy-asr-*` / `hy-world2-*` / `hy-video-*` / `hy-image-lite`——**无一以 `hy3` 起头** ⇒
`hy3` 行落盘后现盘前缀继承命中面 = `hy3-preview` 一枚（已显式在册，非继承）；其余名不入 `hy3` 前缀面（落 `DEFAULT_SPEC` + 告警）。

### 9.3 字段口径表（逐字段 + 证据等级）

| 字段 | `hy3` | `hy3-preview` | `hy4-preview` | seed-code | seed-lite | 等级说明 |
|---|---|---|---|---|---|---|
| `thinking` | `true` | 不声明 | 不声明 | `true` | `true` | 实测：裸请求 `reasoning_content` 在场（hy3 tok=16 / code 219 / lite 161）；`effort:"none"` 即消失 |
| `thinkApi` | `"effort"` | 不声明 | 不声明 | `"effort"` | `"effort"` | 实测：档位经 `reasoning_effort` 参数生效（seed 系 400 原文即该参数） |
| `reasoningEffortEnum` | `["none","minimal","low","medium","high","xhigh","max"]` | 不声明 | 不声明 | `["none","minimal","low","medium","high","xhigh","max"]` | 同 code 行（同族全针） | hy3 = **受理级探针**（七值全 200 受理；乱值 `zzz` → 400 泛化拒收，服务端不列枚举）；seed = 服务端**真校验**（`zzz` → 400 明列 invalid + 七档全 200）；两族**同值集、行独立**（受理级 ≠ 校验级，等级不混）；lite = 同族全针（代价说明见表下 D-11 代价句） |
| `multimodal` | **不声明**（实测无视觉） | 不声明 | 不声明 | `true` | `true` | hy3 = 真值 32×32 纯红图答 "Unknown"（对照无图组明说看不到图）⇒ **不得声明**；seed = 答 "Red"。**`hy3-preview` 补记**：该名服务端默认能力 = 思考 + 视觉（hy 系百炼实测同模型，父侧口径），**不声明 = 认账**（未本渠道探针 ⇒ 无族据（同表无适用来源行）⇒ 不声明，D-11）；不声明的代价 = 该名面板不展图 |
| `maxOutput` | `128_000` | `128_000` | `128_000` | `131_072` | `131_072` | hy3 / hy3-preview = **参考实配**（网关对 `max_tokens` 不硬拒 ⇒ 上限未证，行注标）；hy4-preview = 同族沿用（该名无尺寸行）；seed = **实测**（262 144 → 400 `above maximum`） |
| `context` | `256_000` | `256_000` | `256_000` | `256_000` | `256_000` | hy3 族 = **网络/他仓口径**（未实测；hy4-preview 同）；seed = 官方 256K 口径 + **实测下界 210K 输入受理**（探至账号 429 停手）⇒ 行注逐字标 |
| `reasoningEcho` | 不声明 | 不声明 | 不声明 | 不声明 | 不声明 | 两族均实测 tool 历史三形态 200 ⇒ optional；不声明 = 现状默认，行为字节等价（与 §2.2 qwen 族同款处置） |
| `partialMode` / `prefixMode` | 不设 | 不设 | 不设 | 不设 | 不设 | 两族均未实测续写协议 ⇒ 不预支 |
| `cacheMode` | 不设 | 不设 | 不设 | 不设 | 不设 | 信息性字段零消费点（§4 D-10），且两族缓存未实测 ⇒ 不登记 |
| `tempRange` / `noUsageStream` / `thinkEnabledValue` | 不设 | 不设 | 不设 | 不设 | 不设 | 未实测 ⇒ 不设（不设 = 不钳位 / 照常发 `stream_options`） |

**只有「实测」列进交付判据**；「参考口径」「同族沿用」两类必须逐条落行注，测试只断言已登记值本身。

**D-11 不声明的代价（显式认账，不默带）**：`hy3-preview` / `hy4-preview` 两行因能力位无实测（无族据）⇒ 不声明枚举，后果可观：
VSC 探测下拉该两名的档位枚举空（`thincoder-vscode/src/extension/provider-probe-window.mjs:66`）、CLI `/think effort`
无枚举时走回退档 `high|max`（`thincoder-cli/src/tui/cmd-think.mjs:16`）
⇒ **零新增退化**，不属回归。

### 9.4 聚合网关命中面（TokenHub 转售名逐名认账）

`tokenhub` 是聚合网关（`/models` 实返 124 名），其上的第三方名**直命中既有原厂行**——
命中 = 沿用原厂行取值，能力位是否等同原厂**未实测**（禁止静默套用）。逐名认账表（设计轮实跑 `specForModel` 取值）：

| 转售名 | 命中行 | `maxOutput` | 宿主耦合字段（原厂语义，转售通道未验证） | 认账 |
|---|---|---|---|---|
| `glm-5.3` / `glm-5.3-flash` | `glm-5.3*` | 128 000 | `noUsageStream`（不发 `stream_options`） | **可沿用**——耦合位失效仅损失 usage 统计，无 400 面 |
| `minimax-m3` | `minimax-m3` | 128 000 | `thinkEnabledValue:"adaptive"` + `noUsageStream` | **可沿用**——同上，`thinking.type` 值域风险限于显式开思考路径 |
| `kimi-k3` | `kimi-k3` | 131 072 | `partialMode`（续写带 `partial:true`）+ `reasoningEcho:"required"`（回声必发） | **存疑沿用**——回声位实测过 hy3 侧为 optional，kimi 位系原厂结论；续写/回声在网关侧未验证 |
| `deepseek-v4-flash` / `deepseek-v4-pro` | 同名行 | 384 000 | **`prefixMode` ⇒ 续写请求改写 baseURL 为 `/beta`**（`thincoder-core/provider/errors.mjs:56-60`）+ `reasoningEcho:"required"` | **存疑沿用**——TokenHub 无 `/beta` 的可能性高；失败被 `thincoder-core/provider/core.mjs:270-276` 捕获为 `_warnings`（软失败，不整轮飞出） |
| 未在册名（`deepseek-v3.1` 等） | 无 ⇒ `DEFAULT_SPEC` | 32 000 | — | 退化面 = 现状，告警一次（`thincoder-core/model-specs.mjs:135-141`），不补行（无实测） |

**裁定（D-12）**：**不**为转售名增设「渠道限定行」，也**不**改查表机制（`lookupSpec` 无 provider 维度，
扩维属机制变更、越边界）。命中原厂行 + 本表逐名认账 + 宿主耦合字段公开登记 = 满足「不静默套用」。

**覆盖范围口径（本表据此列全）**：124 名中**命中既有行**的全集 = `glm-5.3` / `glm-5.3-flash` /
`glm-5.3-flashx`（经 `glm-5.3-flash` 前缀继承）· `deepseek-v4-pro(-0813/-202606)` · `deepseek-v4-flash(-0731/-202605)` ·
`deepseek/deepseek-v4-flash-vision-exp`（`/` 命名空间剥离后命中）· `kimi-k3` · `minimax-m3`——**本表逐名覆盖、无表外命中名**；
**未命中名**（无行 ⇒ `DEFAULT_SPEC` + 首请求告警）= `kimi-k2.5` / `kimi-k2.6` / `kimi-k2.7-code(-highspeed)` /
`kimi-k2.8-preview` 等（代表例 = A-9 `deepseek-v3.1`）；非聊天家族（`minimax-video/voice/speech/music-*` 等）不属聊天路由面，不入本表。

### 9.5 方舟 schema 兼容层裁定（AC-4）

**不引入**（他仓为方舟维护的 `minLength/maxLength/minItems/maxItems/minContains/maxContains` 剥除层）。
判据两条：① 实测 seed-2.0 代全部 200 不触发；② 设计轮 grep 实证自有工具 schema 零使用这些关键字
（`thincoder-core/tools/` 命中 0）。复访条件 = 服务端真出现 400（不预支兼容层）。
**正文登记位 = 本节自身**（AC-4 结论 + 两条判据由本节承载）——机制面 `doc:PROVIDER.md` 逐节（§6.1–§6.19）无方舟 schema /
受限关键字对应节（§6.7 = 工具配对与转义净化，非兼容层）⇒ PROVIDER.md 不设 AC-4 交付行、无跨档指针。

### 9.6 渠道预置与「off 静默失效」修法（D-13 / D-14 · 两条均为交付项）

**D-13 预置面形状（AC-5）**：① 新增 `tokenhub` 预置（名 = 批次档标题名；baseURL = 实钉端点；
**无 `model` 键**；**不带** thinking / reasoningEffort / maxTokens 字段——两新渠道的 `thinking:{type}` 载荷与 `max_tokens`
行为未测，不设 = 不发）；② 方舟 = **复用既有 `volcengine` 预置**（baseURL 逐字节同 = 同渠道不双键；
`ark` 是用户配置条目名，与预置键解耦），**无 `model` 键**。**追注**：该行
`maxTokens` **131072**（随模型改指同变；新模型实测上限 131072，取值参表内 `kimi` / `qwen` / `mimo` 行）；③ 既有 `hunyuan` 预置（另一主机 `api.hunyuan.cloud.tencent.com`）
**不动**——本轮未实测该端点。护栏（渠道预置/选择面一致）：新建结构用例
`thincoder-core/test/config-presets.test.mjs`：逐预置 `specMatch(model).matched === true`，
已知漂移白名单 = {`hunyuan`, `siliconflow`, `groq`}（白名单只减不增）。

**D-14 effort 族非百炼渠道的 off 静默失效（登记的实测事实制造的端侧假告知，同 §2.8 先例不得出厂）**：
两端「关思考」现形态 = `thinking:null` 标记（CLI `thincoder-cli/src/tui/cmd-think.mjs:104 / :127` /
VSC `thincoder-vscode/src/extension/reasoning-mode.mjs:22-24`）。该标记对百炼 qwen 生效靠 `enable_thinking:false`
（`thincoder-core/config.mjs:147` 主机门控），对 `hy3`/seed 两新渠道**不发任何思考字段**（`thinking:null` falsy 被
`thincoder-core/provider/core.mjs:193` 跳过），而两渠道服务端默认思考 **on**（裸请求实测）⇒
UI 显示 OFF、服务端照想 = 与 PROVIDER.md §6.12 初始缺陷同类。修法（单点、载荷组装层；**谓词单源 = `doc:PROVIDER.md:§6.12`**
——本节引其条件，机制面不另立判据）：
`provider.thinking === null` ∧ `spec.thinkApi === "effort"` ∧ `spec.reasoningEffortEnum?.includes("none")` ∧
`provider.reasoningEffort == null` ∧ **`!provider.model.includes("/")`**（末款复用 `thincoder-core/provider/core.mjs:196-197`
既有 router 门，含 `/` 的模型 ID 免被路由/代理误读）
⇒ 发 `reasoning_effort: "none"`（实测唯一有效 off 路径：tok=0、rc 消失）。三端 UI 零改；百炼 flash off 多携该字段（同义、
实测支持）；枚举不含 `none` 的名（qwen3.7-max / 3.8-max）与无枚举名零变化；路由形态名（`x/hy3` 类）= 同零变化（guard ⑤）。

**副作用面（设计轮实 grep 发现，必须认账不默带）**：`thinking:null` 不只有 UI 两个生产者，还有**三处内部生产者**：
`thincoder-core/context.mjs:401`（压缩摘要）· `thincoder-core/explore-distill.mjs:98`（explore 蒸馏）·
`thincoder-core/config-presets.mjs:18-19`（`kimi` / `kimi-code` 预置携带）。⇒ AC-9 生效后：
① 前两路后台调用对 hy3 / seed 类渠道（无显式 effort 时）**新发** `reasoning_effort:"none"` = 后台调用不再想
——与今日 qwen 同路径的行为同方向（qwen 侧该标记已使 `enable_thinking:false` 生效），且更省更快 ⇒ **本设计认账不排除**
（区分「用户 off」与「内部 off」需新增标记位 = 机制变更，越边界 ⇒ 已入 §9.10）；
② `kimi` / `kimi-code` 预置同携 `reasoningEffort:"max"` ⇒ guard ④ 没有命中、零变化（已核）。
### 9.7 影响文件清单（收口行数 · 增量）

**产品码交付面三处** = 规格表 + 预置表 + 载荷组装段（D-14 · AC-9）；其余面见 §9.2 与 §9.10：

| 文件 | 现行数 | 预期增删 | 改动 |
|---|---|---|---|
| `thincoder-core/model-specs.mjs` | **253** | — | 五新行（§9.2 落位 · §9.3 取值 · 逐字段证据等级行注）——无新字段、无新导出 |
| `thincoder-core/config-presets.mjs` | **50** | ±1（另 `volcengine.maxTokens` 收口追注见 §9.6 D-13） | 新增 `tokenhub` 键（`:36`；注释 `:34-35`）+ `volcengine.model` 改指 `doubao-seed-2-0-code-preview-260215`（`:32`）。表 = **核单源**：VSC 取一侧 `thincoder-vscode/src/extension/presets.mjs:21`，端壳无镜像文件 ⇒ 两端产品码零改 |
| `thincoder-core/provider/core.mjs` | **492** | — | **D-14（AC-9）**：off 标记 + `thinkApi:"effort"` + 行枚举含 `"none"` + 无显式档 ⇒ 载荷补发 `reasoning_effort: "none"`；谓词 = §9.6，判据 = 用例 B-5（硬限余量披露见下行数上限段）|
| `docs/core/design/MODEL-SPECS.md` | —（本档自指） | 设计轮笔 | 本节 §9（D1，不入 eng-coder 实施面）|
| `docs/core/design/PROVIDER.md` | 445 | 设计轮笔 | §6.11（`:168` 预设段）：`tokenhub` 入表 + `volcengine` 默认模型改值（同 §3 第 8 行先例）；§6.12 + §6.2 载荷组装枚举：D-14 谓词单源登记；§6.19 预设段：核单源 + 计数 21 收正 |

- **`thincoder-core/provider/core.mjs` 除 D-14 一处外零改**：同文件的 effort 枚举越界 = 客户端**抛错**门（`:198-203`）
  行为**保持原样**——该门是既有设计（代码在场；断言 = 同表 §6 用例 T-8，qwen 批在途未落），登记枚举的效果 =
  越界值由「无枚举行放行到服务端吃 400」改判「本地抛错并列出合法档位」（无枚举 = `DEFAULT_SPEC` 无
  `reasoningEffortEnum` 键 ⇒ 门短路）= §9.1 能力位纪律的**预期机制**，非缺陷 ⇒ 本设计**不**在此文件引入
  「字段省略」类降级。
- 测试（用例号 = §9.9）：

| 文件 | 现行数 | 预期增删 | 覆盖 |
|---|---|---|---|
| `thincoder-core/test/model-specs.test.mjs` | **415** | —（越 300——登记不拆档，见下行数上限段） | A-1..A-12（五名逐字段 · 证据等级行注 · 转售命中面 · 既有族零回归） |
| `thincoder-core/test/provider-merge.test.mjs` | **307** | —（越 300——登记不拆档） | B-1..B-6（chat 载荷面 `reasoning_effort`；含 D-14 off 补发与五 guard 零变面、后台路径副作用认账；stubFetch 形态参照 `compress-form.test.mjs:254`） |
| `thincoder-core/test/config-presets.test.mjs` | 52（新建） | — | P-2 `tokenhub` 预置逐字段等值 · P-3 预置↔规格漂移白名单护栏（§9.6 D-13 裁定的新建位）· P-4 `volcengine.maxTokens` 随改指模型同变（`131072` = seed-code 实测上限） |
| `thincoder-cli/test/config-merge.test.mjs` | **217** | — | P-1 预设数 **21**（`:5` 覆盖注 + `:26` 标题 + `:28` 断言——D3 计数与清单同变） |
| `thincoder-vscode/test/config-merge.test.mjs` | **182** | — | 同上（`:4` / `:130` / `:132`） |
- 行数上限：`model-specs.mjs` **253** ·
  `config-presets.mjs` **50** ⇒ 均低于 300 行软线；**两单元测试档越线** = `thincoder-core/test/model-specs.test.mjs` **415** ·
  `thincoder-core/test/provider-merge.test.mjs` **307** ⇒ 处置 = 预裁「**不拆档——单档内聚**」——登记已落
  （`thincoder-core/test/core-hygiene.test.mjs:55` 两条）；拆分计划登记面 = `thincoder-core/test/core-hygiene.test.mjs` 的 `SOFT_LINE_REGISTRY`（含消解窗口）。
  `thincoder-core/provider/core.mjs`（D-14 已落）实 **491**（`wc -l` 口径 = 核内机检口径；`split` 口径 492）。
- **`thincoder-core/test/model-specs.test.mjs` 越 300 软线（已裁已落）**：越线成立。机检 = `thincoder-core/test/core-hygiene.test.mjs:117-131`：
  `walk(ROOT)`（`ROOT` = `thincoder-core/`）递归全树、**无 test 目录排除**，注册键 = 核内相对路径 ⇒ 测试文件同受「>300 未登记即红」约束。
  处置 = 「**不拆档——单档内聚**」——登记已落（`SOFT_LINE_REGISTRY:55` 两条）；拆分计划落点 =
  `thincoder-core/test/core-hygiene.test.mjs` 的 `SOFT_LINE_REGISTRY` 行 12（同 13 = `provider-merge.test.mjs`）；消解窗口 = 越 800 硬限前或该档下次实质改动时。
- **计数同变面（D3 · 「预设 20」在盘 **12** 处）**：测试 **7 处**（CLI `thincoder-cli/test/config-merge.test.mjs:5`/`:26`/`:28`
  + VSC `thincoder-vscode/test/config-merge.test.mjs:4`/`:130`/`:132` + `thincoder-vscode/test/files.mjs:21`）· 设计面 **2 处**（`docs/core/design/PROVIDER.md:168` §6.11 +
  `:274` §6.19——均**已落**〔`:171-175` / `:284-289`〕；§6.19 的计数与来源坐标收正详该节）· 需求档 1 处 `docs/core/requirements/PROJECT.md:30`（现记 **22**）· 产品文案 2 处 `thincoder-cli/README.md:18` +
  `thincoder-vscode/README.md:22`（twenty-one / 21 provider presets，后同变为 22）；归档面（`_archive/**`）不改。另 `thincoder-vscode/README.md:92` 的
  `doubao-pro-32k` 行属 D-13 **改值**同变面（非计数）。清单已列全（**12** 处），逐处落位见各 file:line。

### 9.8 验收标准回指（逐条指回需求 AC）

| 批次档 | 本设计落点 | 机检判据（用例号 = §9.9）|
|---|---|---|
| AC-1 | §9.2 / §9.3 | **五**在册名 `specForModel(...)` 命中**独立行** + 逐字段等值（A-1..A-3）；hy3 视觉 = 不声明、seed 两档 = `true`（A-12）|
| AC-2 | §9.3 等级列 | 未证字段行注含「参考实配 / 网络口径 / 官方口径」字样（A-4）；两 preview 名 = 在场但无实测 ⇒ 尺寸行（A-5）|
| AC-3 | §9.4 | 转售名逐名断言命中行与取值（A-6..A-9），宿主耦合字段逐名认账、未在册名退化（A-9）|
| AC-4 | §9.5 | 结论落档 + 自有工具面关键字零使用可机检（A-10）|
| AC-5 | §9.6 | P-1 预设数 20→21 · P-2 `tokenhub` 字段等值 · P-3 漂移白名单只减不增 · P-4 `volcengine.maxTokens` 随改指模型同变（`131072`）|
| AC-6 | §9.7 测试 | 三端 `test` 全绿 + 新用例覆盖**五名**逐字段 + 两族枚举各自七值、行独立（A-12）|
| AC-7 | 本节 | 锚引用零悬空 · 行宽零超限 |
| AC-8 | §9.6 载荷面 | B-1..B-6 离线断言 `reasoning_effort` 载荷形状（B-5/B-6 属 AC-9 面）；活体一轮 = 父侧执行 |
| AC-9（新登）| §9.6 D-14 + §9.7 `thincoder-core/provider/core.mjs` | B-5 离线断言：`hy3` + `thinking:null` ⇒ 体携 `reasoning_effort:"none"`，且同用例五 guard 零变面全部成立（§9.9）；后台路径副作用 = B-6；活体 off 一轮（tok=0 / rc 消失）= 父侧执行 |

### 9.9 用例表（正常 / 边界 / 错误）

规格表面（`thincoder-core/test/model-specs.test.mjs`）：

| 号 | 类 | 输入 | 期望 |
|---|---|---|---|
| A-1 | 正常 | `specMatch("hy3")` | `matched:true` + `thinking:true` / `thinkApi:"effort"` / 枚举 `deepEqual ["none","minimal","low","medium","high","xhigh","max"]`（受理级七值） / `maxOutput:128_000` / `context:256_000` |
| A-2 | 正常 | `("doubao-seed-2-0-code-preview-260215")` | `matched:true` + 七档枚举（含 `"max"`）+ `multimodal:true` + `maxOutput:131_072` |
| A-3 | 正常 | `("doubao-seed-2-0-lite-260428")` | `matched:true`，与 A-2 字段同值（同族全针，lite 行）|
| A-4 | 边界 | 未证字段行注文本 | hy3 族尺寸行注含「参考实配 / 网络口径」、seed context 含「官方」——证据等级词逐字在场（等级列 = §9.3）|
| A-5 | 边界 | `("hy4-preview")` / `("hy3-preview")` | `matched:true` + 能力位**全不声明**（`thinking` / `thinkApi` / 枚举 / `multimodal` 均 `undefined`）+ 仅尺寸行 |
| A-6 | 正常 | `("deepseek-v4-flash")` | 命中同名行、值零变化（`thinkApi:"type"` + 枚举 `low/high/max` + 384 000 / 1 000 000 / `prefixMode`）|
| A-7 | 正常 | `("glm-5.3")` | 命中既有行（128 000 / `noUsageStream` / `tempRange`）——**无渠道限定行**（§9.4 D-12）|
| A-8 | 边界 | `("kimi-k3")` | 命中既有行 + `partialMode:true` 原样（转售通道未验证 ⇒ 行值不改、认账入 §9.4 表）|
| A-9 | 错误 | `("deepseek-v3.1")`（tokenhub 有售 · 原厂无行）| `matched:false` + `specForModel` 落 `DEFAULT_SPEC`（32 000 / 128 000）+ 首请求告警一次——**不补托底行**（§9.4 D-12）|
| A-10 | 边界 | grep `thincoder-core/tools/` 内 `minLength/maxLength/minItems/maxItems/minContains/maxContains` | 命中 0（§9.5 判据的回归护栏：关键字一旦入自有 schema ⇒ 兼容层复访条件成立）|
| A-11 | 正常 | qwen / deepseek / glm / kimi 既有名回归 | 与 §2.1 表值零变化（防五新行前缀遮蔽波及；`SORTED_SPECS` 降序面）|
| A-12 | 正常 | hy3 枚举 vs seed 枚举 | 两数组各自 `deepEqual` 七值（同值集）且**行独立**（改一行不动另一行——AC-1/AC-6 判据：受理级 ≠ 校验级，互不污染）|

载荷与渠道面（`thincoder-core/test/provider-merge.test.mjs`；`thincoder-core/test/config-presets.test.mjs`）：

| 号 | 类 | 输入 | 期望 |
|---|---|---|---|
| B-1 | 正常 | `hy3` + `reasoningEffort:"none"` | 请求体携 `reasoning_effort:"none"` |
| B-2 | 错误 | `hy3` + `"zzz"`（**域外值**——七值受理集外）| **抛错**含 `not supported by model` 与合法档位（现状门 `thincoder-core/provider/core.mjs:198-203`，形态参照 = 同表 §6 用例 T-8）|
| B-3 | 边界 | 无枚举名（`hy4-preview`）+ 任意档位 | 原样透传（无校验 = 现状零变化）|
| B-4 | 正常 | seed-code + `"max"` | 携 `reasoning_effort:"max"`（七档全通过）|
| B-5 | 正常 | `hy3` + `thinking:null` 且无 `reasoningEffort`（**D-14 · AC-9**）| 请求体携 `reasoning_effort:"none"`；同一用例内五个 guard 零变面同断：`hy4-preview` + `thinking:null` ⇒ 无该字段（无枚举）/ `hy3` + `reasoningEffort:"low"` ⇒ 只携 `"low"`（显式档优先）/ `qwen3.6-flash` + `thinking:null` ⇒ `enable_thinking:false` 照发且多携 `reasoning_effort:"none"`（同义）/ `kimi-k3`（枚举无 `none`）+ `thinking:null` ⇒ 无该字段 / **`x/hy3`（路由形态名——命名空间剥离后命中 `hy3` 行）+ `thinking:null` ⇒ 无该字段（子句复用 `thincoder-core/provider/core.mjs:196-197` 的 `!isRouter` 门）** |
| B-6 | 边界 | 后台路径形态：`hy3` + `thinking:null`、无 effort（模拟 `thincoder-core/context.mjs:401` / `thincoder-core/explore-distill.mjs:98` 的 `{...provider, thinking:null}`）| 同样携 `reasoning_effort:"none"` = **认账交付**（§9.6 副作用面：后台调用不再想，与 qwen 侧同方向）——断言防「误当缺陷改掉」|
| P-1 | 正常 | `Object.keys(PROVIDER_PRESETS).length` | `25` |
| P-2 | 正常 | `PROVIDER_PRESETS.tokenhub` | `baseURL === "https://tokenhub.tencentmaas.com/v1"` + **无 `model` 键** + 无 `thinking` / `reasoningEffort` / `maxTokens` 键（D-13「不设 = 不发」）|
| P-3 | 边界 | 逐预置 `"model" in p` | 全表 25 条均 `false`（逐条无 `model` 键断言） |
| P-4 | 正常 | `PROVIDER_PRESETS.volcengine.maxTokens` | `131072`（= seed-code 实测输出上限；随 `model` 改指同变——§9.6 D-13 ② 代码面落点 · 用例 `thincoder-core/test/config-presets.test.mjs:49-51`） |

### 9.10 本节边界（不做什么）

- 不登记**未开通**名（`doubao-seed-2-1-*` = ModelNotOpen）。
- 不为两族登记音频/视频模态位（产品无发送路径，同 §2.7 判）。
- 不引入方舟 schema 剥除兼容层（§9.5 实测裁定），亦**不**为兼容层预建字段。
- 不为转售名增设渠道限定行、不给 `lookupSpec` 扩 provider 维度（§9.4 D-12——机制变更越本节边界）。
- 不改 `resolveEnableThinking`（`thincoder-core/config.mjs:143-156`——百炼主机门控专属，与两新渠道的关系已核对 = §9.6，非改码对象）。
- 不改三端 effort UI 形状、不改用户 `config.json`、不建 Anthropic Messages 通道（hy4 标称支持，非本节目标）。
- 不修 VSC 端差默认档面（五新名未登记 `EFFORT_DEFAULT_PREFIXES` ⇒ 面板默认档落枚举首项）：VSC 侧零改。
- 不做 TokenPlan 订阅端点（`api.lkeap.cloud.tencent.com/plan/v3` 同 key 401 ⇒ 未订阅）与方舟 Coding 订阅端点（`/api/coding/v3` 400 `InvalidSubscription`）。
- 不引入自动探测 / 在线校正——规格仍人工登记。
- 不改 CLI 思考档位下拉的托底形态（未在册名回退全档 = `thincoder-cli/src/tui/cmd-think.mjs:19` 现状）——**VSC 侧对齐 = 已裁（#677）· 实施清单 I7**。
- AC-9 **不区分**「用户显式 off」与「内部静默 off」（`thinking:null` 单标记，三处生产者见 §9.6 副作用面）⇒ 不得为区分而新增
  provider 字段或改 `resolveEnableThinking`（百炼主机门控专属，上条已列边界）。
- 本节不落实现——改码 = eng-coder，需 designToken。

### 9.11 UI/交互决策（全落地，无 open）

| 面 | 决策 |
|---|---|
| CLI `/models`（名 + 上下文）| 五新行显示 `256K`；未在册转售名（`deepseek-v3.1` 类）显示 `128K` + 现状告警——与 §8 百炼未在册名同判 |
| CLI `/think <effort>` 档位行 | hy3 / seed 两族同列 `effort: none/minimal/low/medium/high/xhigh/max`（七值——hy3 受理级 · seed 校验级）；无枚举名（两 preview）= 回退档 `high\|max`（`thincoder-cli/src/tui/cmd-think.mjs:16` 现状，零改）|
| CLI 思考开关行 | hy3 / seed 族 `thinking:true` ⇒ off 载荷 = `reasoning_effort:"none"`（**D-14 已批准 · AC-9**，判据 = 用例 B-5）；显示面零改 |
| VSC 思考下拉 | 零改码：枚举源 = spec ⇒ `hy3-preview` / `hy4-preview` 档位空 = **认账**（代价句 = §9.3 D-11）；五新名**默认档** = 枚举首项（hy3 / seed 两族 `"none"` · 两 preview `null`）= 端差表未登记所致，**已认账** |
| 面板 `max_output` / `context` 显示 | 双栏形状同 §8（证据等级由行注承载，显示面不区分等级）|

## 10. glm-5.3-flashx 独立规格行

### 10.1 决策与落位

- **独立行新增，不修 `glm-5.3-flash` 行**（开放项裁定）：flashx 是独立模型档，
  131_072 为校验级实测（400 原文），`glm-5.3-flash` 行零改（其 128_000 属该行自身口径；该行后按同源证据修至 131_072，§14.2 #1）——AC-3 钉
  「既有 glm 族回归零变化」。先例 = `deepseek-v4.1-flash` · `hy3` 族三行（§9）。
- **落位**：GLM 段 `glm-5.3-flash`（`thincoder-core/model-specs.mjs:53`）与 `glm-5.2`（`:54`）
  之间。`SORTED_SPECS` 按名长降序预排（`thincoder-core/model-specs.mjs:153`）⇒
  flashx(14) > flash(13) > 5.3(7) 自洽，长前缀优先天然成立（用例 F-1 钉住）。
- **「始终思考」= 行注 + 机制位 `thinkAlwaysOn`（单源 = `doc:MODEL-SPECS.md:§16.3`）**：枚举
  `["low","high","max"]` 无 `none`（D-14 五 guard 第 4 面 `includes("none")` = false ⇒ off 载荷本就惰性不发字段）之外，
  「`{type:"disabled"}` 被服务端拒」这一事实亦须机器可判 ⇒ 三行（`glm-5.3` / `glm-5.3-flash` / `glm-5.3-flashx`）落
  `thinkAlwaysOn: true`，消费方 = `thinkOffPath` 回执判据（`thincoder-core/think-off.mjs`）；行注照旧承载证据等级
  （先例 = `thincoder-core/model-specs.mjs:63-64`）。
- **零机制改动**：查表 / 排序 / off 路径机制全部不动（零改面 = §10.4）。

### 10.2 表变更清单（一行新增，零删除、零改既有行）

| 位置 | 新行 | 取值 |
|---|---|---|
| `thincoder-core/model-specs.mjs:53` 与 `:54` 之间 | `["glm-5.3-flashx", { … }]` | §10.3 口径表 |

### 10.3 字段口径表（逐字段 + 证据等级）

| 字段 | 值 | 证据等级 |
|---|---|---|
| context | 1_000_000 | 族沿用（网络口径——未探边） |
| maxOutput | 131_072 | **校验级**（400「max_tokens…限制数值范围[1,131072]」） |
| thinking | true | 实测（disabled → 400；裸请求 rc=61 默认开） |
| multimodal | true | 实测（8×8 纯红 PNG → 答「红色」） |
| reasoningEffortEnum | ["low","high","max"] | **校验级**（400 原文点名：low/high/max 受理，其余拒绝） |
| cacheMode / thinkApi / reasoningEcho / tempRange / noUsageStream | "auto" / "type" / "optional" / [0,1] / true | 族沿用（前缀命中路径日常在用） |

「族沿用」字段的 F-2 期望值**推导规则**：以 `glm-5.3-flash` 行
（`thincoder-core/model-specs.mjs:53`）的现行键集/值逐字为准，未声明键不进期望对象；
上表字面清单仅作参考（某键若为「不声明 = optional」形态，deepEqual 照此规则自然成立，
不逼实施侧补造声明）。

行注（AC-2 承载面）证据等级词 = **实测 / 校验级 / 族沿用**——用例 F-5 断言（断言不变）；
行注「始终思考」句内补记：**off 动作在 UI 侧为 no-op**（`thinkApi:"type"` + 枚举无 `none`
⇒ D-14 guard 短路不发字段，服务端无关闭路径）——静默失配自行注可发现，认账面 = §10.9。

### 10.4 消费面契约（本节动谁、谁零改）

- **动**：`thincoder-core/model-specs.mjs`（+1 行 + 行注）·
  `thincoder-core/test/model-specs.test.mjs`（F-1..F-5）· 本设计档（本节）。
- **零改**：CLI（`cmd-think.mjs` 档位行枚举驱动，flashx 自动显示三档）· VSC（
  `specs.mjs` 端差表零改——`EFFORT_DEFAULT_PREFIXES` 既有 `glm-5` 族前缀条目即命中 flashx，
  其默认档 `max` 在新枚举内合法）· `thincoder-core/provider/core.mjs`（`resolveEnableThinking`
  qwen 白名单对 glm 恒 undefined——`thincoder-core/config.mjs:143-156` 零影响）·
  `PROVIDER.md`（渠道机制无变）。

### 10.5 影响文件清单

| 文件 | 现行数 | 预期 | 拆分计划 |
|---|---|---|---|
| `thincoder-core/model-specs.mjs` | **261** | ~259（<500 软限） | 无需 |
| `thincoder-core/test/model-specs.test.mjs` | **468** | ~460（<500 硬限） | 无需（不拆档豁免已登记：`thincoder-core/test/core-hygiene.test.mjs:55`；拆分计划登记面 = `thincoder-core/test/core-hygiene.test.mjs` 的 `SOFT_LINE_REGISTRY`）  |
| `docs/core/design/MODEL-SPECS.md` | —（本档自指） | ~940 | 本节 |

### 10.6 验收标准回指（逐条指回需求）

| AC | 判据 | 用例 |
|---|---|---|
| AC-1 | `specForModel('glm-5.3-flashx')` 命中独立行：`multimodal:true` · `maxOutput:131_072` · 枚举 `["low","high","max"]` · `thinking:true` | F-1 / F-2 |
| AC-2 | 未实测字段行注含「族沿用」字样 | F-5 |
| AC-3 | 既有 glm 族回归零变化；排序面 flashx 先于 flash 不破坏 | F-3 / F-1 |
| AC-4 | 三端测试全绿 | 机检 |

### 10.7 用例表（`[flashx]` 段 · F-1..F-5 · 循 `[onboard]` 段先例）

| 用例 | 类 | 输入 / 动作 | 期望 |
|---|---|---|---|
| F-1 | 正常 | `specMatch("glm-5.3-flashx")` | `matched:true` 且 `spec.maxOutput === 131_072`（取值 + 排序面同证非蹭 flash 行；flash 行值已同修 131_072（§14.2 #1）⇒ 差异判据收于排序面） |
| F-2 | 正常 | `specForModel("glm-5.3-flashx")` | §10.3 全字段 deepEqual |
| F-3 | 回归 | `glm-5.3` / `glm-5.3-flash` 查表 | 两行逐字段零变化（FAMILY_BASELINE 形状先例） |
| F-4 | 结构 | `TABLE_ROW_NAMES` | 含 `glm-5.3-flashx`（防空扫） |
| F-5 | 锚 | `rowNote("glm-5.3-flashx")` | 含「族沿用」+「校验级」 |

### 10.8 边界（本节不做）

- 不探 context 上限（沿用族口径 + 行注）；`glm-5.3-flash` 行 128_000 残留上抛（语义面）
  已随 §14 批按同源证据收正为 **131_072**（§14.2 #1）；不动 VSC / `PROVIDER.md` / CLI 产品码。
- 不新增「始终思考」机制字段（§10.1 裁定）；不改排序 / 查表 / off 路径机制。
- 不测 flashx 在 tokenhub / dashscope 的转售差异。
- 本节不落实现——改码 = eng-coder，需 designToken。

### 10.9 UI/交互决策（全落地，无 open）

| 面 | 决策 |
|---|---|
| CLI `/models` | flashx 显示 `1M`（context 族口径；证据等级由行注承载，显示面不区分） |
| CLI `/think effort` 档位行 | flashx 列 `effort: low/high/max`（枚举驱动零改码）；off 标记经 D-14 guard 对 `thinkApi:"type"` 行不发字段（现状族形——与 `glm-5.3` 同，off 不可达 = 服务端 400，非本节对象） |
| VSC 思考下拉 | 零改：flashx 落既有 `glm-5` 族前缀条目，默认档 `max`（新枚举内合法）；档位行自动 = 枚举三档 |

## 11. qwen3.6 系五名独立规格行

### 11.1 决策与落位

- **五名同形独立行，不修既有行**：活体取证五名每名 10 针全绿、字段面完全同形
  （枚举六档止于 xhigh / maxOutput 65_536 / 视觉受理 / 默认思考开）⇒ 一套字段口径 × 五名，
  每名独立一行（同值集 ≠ 同行——§9 `[onboard]` A-3 形状先例）。既有 qwen3.7/3.8 行零触碰（AC-3）。
- **独立行必要性**：qwen 泛前缀托底行已删除（§2.4）⇒ 未登名落 DEFAULT_SPEC
  （128K / 32K / 无视觉 / 无枚举），maxOutput 与枚举双失真坐实（65_536 ≠ 131_072；
  `max` 非法档位无从拦截）。
- **落位**：qwen 段末尾——`thincoder-core/model-specs.mjs:96`（「No generic qwen fallback
  row」注释块末行）与 `:97`（MiniMax 段注释）之间插入五行；行序 = flash / plus / max-preview /
  27b / 35b-a3b（表插入序；`SORTED_SPECS` 派生序由机制自排，§11.8）。
- **零机制改动**：查表 / 排序 / off 路径 / VSC 端差机制全不动——五名 off **可达**
  （`none` / `minimal` 实测 rc=0 可关，D-14 guard `includes("none")` = true ⇒ off 载荷
  正常下发），无 §10 flashx 那样的 no-op 失配面。

### 11.2 表变更清单（五行新增，零删除、零改既有行）

| 位置 | 新行 | 取值 |
|---|---|---|
| `thincoder-core/model-specs.mjs:96` 与 `:97` 之间 | `["qwen3.6-flash" / "qwen3.6-plus" / "qwen3.6-max-preview" / "qwen3.6-27b" / "qwen3.6-35b-a3b", { … }]` 共 5 行 | §11.3 口径表 |

行注形态：**家族共享证据块**（首行 `qwen3.6-flash` 上方——五名同形 ⇒ 取证叙述落一处全量）+
plus / max-preview / 27b / 35b-a3b 各一行单行注（证据词在场，细则 = 实施轮自由度）；
`qwen3.6-35b-a3b` 单行注另含「MoE」后缀说明（开放项裁定 = 行注承载）；
max-preview 单行注另如实记录视觉证据波动（纯红图答「黑色」= 抽样波动、通道 ✓）。

### 11.3 字段口径表（逐字段 + 证据等级）

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
`thincoder-core/test/model-specs.test.mjs:260` 全仓测试计数冻结，新档含该字面即时红）。
3.7-flash 行若未来漂移，Q-2 期望自动跟随（推导式红利，循 §10.3 推导规则先例）。

VSC 端差字段不在核表：核规格行无 `reasoningEffortDefault`（端侧扩展面——
`thincoder-vscode/src/specs.mjs:22` 端差表持有）。

### 11.4 消费面契约（本节动谁、谁零改）

- **动**：`thincoder-vscode/src/specs.mjs` `EFFORT_DEFAULT_PREFIXES` +5 条目（qwen 段
  `thincoder-vscode/src/specs.mjs:35` 后插入；运行时最长优先扫描 ⇒ 条目序无关；
  快照名 `qwen3.6-flash-2026-04-16` 前缀命中 `qwen3.6-flash` 条目同得 "high"——与核查表
  继承意图一致，父侧裁定「快照不登」的配套行为面）。
- **零改但行为受益（链路现成）**：`thincoder-vscode/webview/settings-state.js` 兜底链
  （`defaultEffortFor` 读 `effortDefault`，端差未命中才回落枚举首项——**该链已随 §14 批改形**：占位「—」规则取代首项回落）·
  `thincoder-vscode/src/extension/provider-probe-window.mjs:67`（模型行 `effortDefault`
  直读 spec）——本节登记后两处消费面自动生效；probe 面零码改照旧，settings-state 面随 §14 改码。
- **零改**：CLI 产品码（on 默认档 = 枚举首个非 `"none"` 档 =
  `thincoder-cli/src/tui/cmd-think.mjs:131` qwen 批修法产物，机制现成）· 核查表 / 排序 /
  off 路径机制 · `thincoder-core/test/run.mjs`（单层 glob 自动收集新测试文件——
  `thincoder-core/test/run.mjs:42`，启动器零清单改动）。

### 11.5 影响文件清单

| 文件 | 现行数 | 预期 | 变更 |
|---|---|---|---|
| `thincoder-core/model-specs.mjs` | 261 | ~273 | +5 表行 + 行注块（§11.2 落位）；500 软限内 |
| `thincoder-core/test/model-specs-qwen36.test.mjs`（新建） | 0 | ~150 | `[qwen36]` 段 Q-1..Q-6 · Q-8——**500 硬限拆分载体**（`thincoder-core/test/core-hygiene.test.mjs:123` 硬红判据，登记表只适用 300–500 段 ⇒ 主档 append-only 不可行）；新文件 ≤300 软限、零登记  |
| `thincoder-core/test/model-specs.test.mjs` | 468 | 468 | **零触碰**（三段/四段已收口面不动、老段不迁移——拆分 = 新文件承载）  |
| `thincoder-vscode/src/specs.mjs` | 84 | ~89 | `EFFORT_DEFAULT_PREFIXES` +5 条目 |
| `thincoder-vscode/test/image-downgrade.test.mjs` | 253 | ~271 | +`[qwen36]` 段 Q-7（append-only，不扩改既有 T-10/T-15）；≤300 ✓  |
| `docs/core/design/MODEL-SPECS.md` | —（本档自指） | ~1070 | §11（本节，设计轮自笔） |

### 11.6 验收标准回指（逐条指回需求）

| AC | 判据（原文） | 承载 |
|---|---|---|
| AC-1 | 五名各命中独立行（非前缀兜底）：`maxOutput:65_536` · 枚举六档 · `thinking:true` · `multimodal:true` | Q-1 / Q-2 / Q-3 · Q-8（max 拒收负证） |
| AC-2 | 未实测字段行注含「族沿用」/「官方口径」字样 | Q-6 |
| AC-3 | 既有 qwen3.7/3.8 族回归零变化；五新行排序面不遮蔽既有名 | Q-4 / Q-5 + §11.8 读码核 |
| AC-4 | VSC 端差表处置裁定（= 登记 "high"）+ 三端测试全绿 | Q-7 + 机检 |

### 11.7 用例表（`[qwen36]` 段 · Q-1..Q-8 · 循 `[flashx]` 段先例）

Q-1..Q-6 · Q-8 落新建核单元测试档（`thincoder-core/test/model-specs-qwen36.test.mjs`——新建，
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
| Q-7（VSC `thincoder-vscode/test/image-downgrade.test.mjs` 新 `[qwen36]` 段） | 五名 `reasoningEffortDefault === "high"` 且 ∈ 枚举（**不落首项 "none"**——qwen 批 §2.8 首项陷阱负证）；快照名前缀命中母名条目亦得 "high"  |
| Q-8 | 错误面：`qwen3.6-flash` + `reasoningEffort:"max"` ⇒ 本地抛错含 `not supported by model` 且合法档位清单 = 六档（`thincoder-core/provider/core.mjs:198-203` 门——T-8 / B-2 先例形态；枚举入册后 `max` 由「透传吃服务端 400」变「本地抛错」） |

新档实施约束（设计钉死）：① 全文禁含 `cacheMode` 字面（T-13 全仓测试计数闸——
`thincoder-core/test/model-specs.test.mjs:259-260` 基线逐档冻结）；② helpers
（`SPEC_SOURCE` / `TABLE_ROW_NAMES` / `rowNote` / `assertFields` / `EFFORT_6`）就地重定义、
零 import 主单元测试档（主档无导出面，动了即破零触碰）。

### 11.8 排序面读码核

- `SORTED_SPECS` = 对表按 `b[0].length - a[0].length` 降序预排
  （`thincoder-core/model-specs.mjs:161`——五行实长严格降序无并列，比较器稳定性语义不介入）。
- 五名长度 19 / 15 / 13 / 12 / 11，两两互非前缀；既有表**无任何 `qwen3.6` 前缀条目**
  （泛 `qwen` 行已删除）⇒ 五新名唯一命中面 = 自身精确行，零遮蔽
  （Q-1 命中 + Q-4 非前缀循环钉住）。
- `qwen3.6-max-preview`(19) 与 `qwen3.8-max` 版本号不同位互非前缀，不蹭 max 行；
  日期戳快照长名未登 ⇒ 前缀命中 13 字符 flash 行 = **有意继承非遮蔽**
  （父侧裁定「快照不登」）。结论：排序面零机制风险。

### 11.9 UI/交互决策（全落地，无 open）

| 面 | 决策 |
|---|---|
| CLI `/models` | 五名显示 `1M`（context 官方口径；证据等级由行注承载，显示面不区分） |
| CLI `/think effort` 档位行 | 五名列 `effort: none/minimal/low/medium/high/xhigh`（六值枚举驱动零改码）；off 可达 = 实测（`none` / `minimal` rc=0）——与 §10 flashx 不同，无 no-op 失配面 |
| CLI `/think on` 默认档 | = 枚举首个非 `"none"` 档 = **minimal**（`thincoder-cli/src/tui/cmd-think.mjs:131` 机制现成）——与 VSC 默认 `high` 分叉 = 已知后果，不并入本轮（裁定注，防后续当缺陷返工） |
| VSC 思考下拉 | 五名默认档 = **high**（§11.4 端差登记）；档位行自动 = 枚举六档（零改码）；快照名同得 high（前缀扫描） |
| 面板 `max_output` / `context` 显示 | `65_536` / `1M` 双栏（证据等级由行注承载，显示面不区分） |

## 12. MiMo V2.6 三款独立规格行 + v2.5 存量对齐

### 12.1 决策与理由

- **三款各得独立行**（`mimo-v2.6-pro` / `mimo-v2.6-flash` / `mimo-v2.6-pro-ultraspeed`）。
- **同形不同行**：三款同批同形（同端点、同参数面、逐款探针全绿）⇒ 一套字段口径 × 三行、每名独立一行
  （同值集 ≠ 同行——§9 `[onboard]` A-3 形状先例）；行独立 = 将来单款取值漂移可单行改。
- **v2.5 两行随批对齐**（同日同测）：`maxOutput` **131_072**（低于服务端实测上限 = 低估）；
  补登记 `cacheMode: "auto"`（实测 `cached_tokens` 18 816）。在役期表值须准；两行**不删**（下线节奏归小米）。
- **预设面与对外文本**：`mimo` / `mimoplan` **零 `model` 键**；VSC README provider 表同批随正；预设 `maxTokens: 131072` 已在位（= 实测上限）。
- **零机制改动**：查表 / 排序 / 兜底 / off 路径 / 端差机制全不动；三新款无 effort 枚举 ⇒
  auto-think、consult 钳制、`/think effort` 档位面均与今日同形（§12.4）。

**排序面读码核**（`mimo-v2.6-pro` ⊂ `mimo-v2.6-pro-ultraspeed` 遮蔽自查）：`SORTED_SPECS` 按名**长度降序**预排
（`thincoder-core/model-specs.mjs:178`）⇒ 长名先命中、短名不可能盖长名（现行行为：
`specForModel("mimo-v2.5-pro-x") === specForModel("mimo-v2.5-pro")` = true）。三名实长 13 / 15 / 24、**两两无并列**
⇒ 比较器稳定性语义不介入；在册名无 `mimo-v2.6` 前缀条目 ⇒ 三名唯一命中面 = 自身精确行（M-1 / M-4 钉住）。

**关键决策**：

| # | 决策 | 理由 |
|---|---|---|
| D-1 | 三款各得独立行，不修 / 不删 v2.5 两行 | 同值集 ≠ 同行；v2.5 在役 |
| D-2 | `reasoningEcho` 三新款 = `"required"`（族沿用） | 保守策略：两态均安全、零行为回归、覆盖未复现的旧严格条件 |
| D-3 | v2.5 信息性字段断言 = **运行时可推导形**（合成键） | AC-3 要值断言、T-13② 禁字面量 ⇒ 两者并存的唯一形态；张力面见 §12.7 实施约束 |
| D-4 | `[mimo]` 用例承载 = **新建核单元测试档**（非 append 主档） | 主档 467 行，9 例（~70 行）append 即越 500 软线；先例 = `model-specs-qwen36.test.mjs` |
| D-5 | `mimo` / `mimoplan` 预设**零 `model` 键**（原改指 `mimo-v2.6-pro`） | v2.5 将下线；`maxTokens` 与实测上限同值零改。**mimoplan 端点未实测**（Token Plan 无 tp- 凭证 ⇒ 未探）= 同平台推断（**unverified**）——与 mimo（按量端点实测）证据差在登记面可见 |
| D-6 | MiMo 族头注块按复测改写 | 现句「else 400 on follow-ups」与本节复测矛盾——活性面不留已证伪的处方（§12.3 草案）；同一处方面延伸至 `assistantToolCallMessage` 文档串（§12.2 / §12.8） |
| D-7 | VSC 端差表 `EFFORT_DEFAULT_PREFIXES` 零改 | mimo 未登记 ⇒ 默认档 = 档位首项（三新款 `"enabled"`）——与 v2.5 同形 = 现状，非本节回归 |

### 12.2 表变更清单

`MODEL_SPECS`（`thincoder-core/model-specs.mjs`，**53 规格行**）：

| 动作 | 行 | 落位 |
|---|---|---|
| 新增 | `mimo-v2.6-pro` / `mimo-v2.6-flash` / `mimo-v2.6-pro-ultraspeed` | `["mimo-v2.5", …]`（`:120`）与 `["minimax-m3", …]`（`:121`）之间；行序 = pro / flash / pro-ultraspeed |
| 改值 | `mimo-v2.5-pro`（`:119`）· `mimo-v2.5`（`:120`） | `maxOutput` 128_000 → 131_072；各补 `cacheMode: "auto"` |
| 行注改写 | MiMo 族头注块（`:116-118`） | 「else 400 on follow-ups」句按实测改写（§12.3 草案） |
| 文档串改写 | `assistantToolCallMessage` 文档串（`:255-259`；非规格行 ⇒ 53 行计数不变） | 按复测原地换写（与 §12.3 行注同一事实陈述；净增 0 行） |
| 零改 | 其余 **51** 行（MiniMax / grok / claude / gemini / qwen / TokenHub / Seed 各族） | — |

排序面：`SORTED_SPECS` 派生序由机制自排（`thincoder-core/model-specs.mjs:193`）⇒ 表内插入位置不改变匹配优先级。

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
| `reasoningEcho` | `"required"` | **族沿用**（保守策略裁定）：本节三形态复测（真值 / 缺字段 / 空串）全 200 ⇒ 缺字段 400 不可复现，**不翻** |
| `reasoningEffortEnum` / `partialMode` / `prefixMode` / `noUsageStream` / `thinkEnabledValue` | 不声明 / 不设 | 三款无 effort 档面（`thinking.type` 族，与 v2.5 同形）；续写与 usage 面未实测 ⇒ 不预支 |

v2.5 两行（改值面；其余字段零改）：

| 字段 | `mimo-v2.5-pro` | `mimo-v2.5` | 证据等级 |
|---|---|---|---|
| `maxOutput` | `131_072` | `131_072` | **校验级**（同日 400 原文 + 131072 → 200） |
| `cacheMode` | `"auto"` | `"auto"` | **实测**（`cached_tokens` 18 816） |

**行注草案**（AC-5 承载面；证据等级词逐字在场 = 硬判据，文字可微调）——MiMo 段落盘形：

```js
  // MiMo series (Xiaomi — OpenAI-compatible https://api.xiaomimimo.com/v1; deep thinking via
  // thinking.type, default ON). Family echo policy stays conservative ("required" — tool rounds
  // always echo); re-probe: value / missing field / empty string all 200 — the
  // "must be passed back" 400 was NOT reproduced. v2.5 rows aligned:
  // maxOutput 131_072 = **校验级**; cacheMode "auto" = **实测** (2nd same-prefix round cached 18,816).
  ["mimo-v2.5-pro",     { context: 1_000_000, maxOutput: 131_072, thinking: true,  cacheMode: "auto", thinkApi: "type", reasoningEcho: "required", tempRange: [0, 1.5] }],
  ["mimo-v2.5",         { context: 1_000_000, maxOutput: 131_072, thinking: true,  multimodal: true, cacheMode: "auto", thinkApi: "type", reasoningEcho: "required", tempRange: [0, 1.5] }],
  // MiMo V2.6 series (launch batch — three independent rows, each probed individually).
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

**行数预算（软线）**：`thincoder-core/model-specs.mjs` ~293——该档**未登记** `SOFT_LINE_REGISTRY`（`thincoder-core/test/core-hygiene.test.mjs:77-90`）
⇒ 越 500 即红。

### 12.4 消费面契约（本节动谁、谁零改）

**动 = 数据面**（三新款由兜底变真行；v2.5 两行改值）；**消费码全部零改**：

| 消费点 | 读什么 | 三新款变化（数据驱动） |
|---|---|---|
| 压缩阈值 / 上下文占比 | `context` · `maxOutput`（完成预留——可用窗口 = 窗口 − 预留；阈值 = 可用窗口 × 0.8；核侧 `thincoder-core/config.mjs:116-120`（`resolveCompactThreshold`）· `thincoder-core/token-window.mjs:152`（窗口与占比）· `:161`；面板 `thincoder-vscode/src/specs.mjs:73` · `:87`；CLI 帧 `thincoder-cli/src/tui/render-frame.mjs:393`） | 128K → 1M（长会话截断面解除） |
| 温度钳位 | `tempRange`（`thincoder-core/provider/core.mjs:187-188`） | 不钳位 → 钳至 [0, 1.5]（越界值不再打到服务端吃 400） |
| 视觉门（**8** 处） | `multimodal`（坐标 = §2.7 第 1 项） | 无视觉 → `read_image` 注册 + 贴图注入生效 |
| 工具轮回声构造 | `reasoningEcho`（`thincoder-core/model-specs.mjs:288-290`） | 无字段 → 工具轮 assistant 消息恒带 `reasoning_content`（缺值 ⇒ `""`；三形态全 200 实测支撑） |
| VSC 思考下拉档位 | `thinking`（`thincoder-vscode/src/extension/provider-probe-window.mjs:66`） | 档位空 → 单档 `"enabled"` |
| 输出上限登记位 | `maxOutput`（非 OpenAI 载荷面 = `thincoder-core/provider/anthropic.mjs:56` · `thincoder-core/provider/responses.mjs:207`——mimo 不走此两格式） | 32K → 131_072（登记面 + 面板显示） |

**零改面（明文）**：CLI 产品码全零改（无枚举 ⇒ `/think` effort 列表走既有回退档，`thincoder-cli/src/tui/cmd-think.mjs:16`）；
VSC 产品码全零改（`EFFORT_DEFAULT_PREFIXES`（`thincoder-vscode/src/specs.mjs:22-41`）不含 mimo ⇒ 端差默认档不命中 =
档位首项兑底：三新款 = `"enabled"`、v2.5 同形 = **现状**）；查表 / 排序 / 告警 / 兜底机制零改（`:193` · `:198-212` · `:217-223`）；
`thincoder-core/config-presets.mjs` 除 `model` 两处取值外零改；`thincoder-core/provider/core.mjs` 零改（无枚举名 ⇒ effort 越界门短路 = 现状）；
`assistantToolCallMessage` 构造零改（仅按既有 `reasoningEcho` 判定）；`resolveEnableThinking`（`thincoder-core/config.mjs:143-156`）零改（百炼主机门控，与 mimo 无关）。

### 12.5 影响文件清单

| 文件 | 现行数 | 预期增删 | 改动 / 拆分计划 |
|---|---|---|---|
| `thincoder-core/model-specs.mjs` | 278（`wc -l` 277） | +15（文档串换写净增 0）⇒ ~293 | §12.2 / §12.3（三新行 + 行注块 + v2.5 对齐）+ `assistantToolCallMessage` 文档串原地换写；≤500 软线内、免登记 |
| `thincoder-core/config-presets.mjs` | 50（`wc -l` 49） | ±0（2 行改值） | `mimo` / `mimoplan` 的 `model` → `mimo-v2.6-pro`；**mimoplan 端点未实测**（无 tp- 凭证）= 同平台推断（**unverified**） |
| `thincoder-core/test/model-specs-mimo.test.mjs`（新建） | 0 | ~95 | `[mimo]` 段 M-1..M-4 · M-6..M-9（§12.7）；新档 ≤300 免登记；单层 glob 自动收集（`thincoder-core/test/run.mjs:42`）零清单改动  |
| `thincoder-core/test/model-specs.test.mjs` | 468（`wc -l` 467） | +7 ⇒ ~475 | 仅两处：`FAMILY_BASELINE` mimo 行值改（`:201`，128_000 → 131_072）+ M-5。**500 硬限余量 25 行** ⇒ `[mimo]` 段不 append 至此档（硬限口径 = `thincoder-core/test/core-hygiene.test.mjs:149-163`：`>500` 硬红、`300–500` 须登记；D-4）  |
| `thincoder-vscode/README.md` | 205（`wc -l` 204） | ±0（2 行改值） | `:84-85` provider 表模型列 → `mimo-v2.6-pro` |
| `docs/core/design/MODEL-SPECS.md` | —（本档自指） | 设计轮笔 | §12（本节） |

**行数上限段**：`thincoder-core/model-specs.mjs` ~293 ⇒ 低于 500 软线；新单元测试档 ~95（免登记）；
`thincoder-core/test/model-specs.test.mjs` ~475 ⇒ 越 300 系既有态（登记已落 `thincoder-core/test/core-hygiene.test.mjs:86`；
拆分计划登记面 = `thincoder-core/test/core-hygiene.test.mjs` 的 `SOFT_LINE_REGISTRY`，消解窗口 = 越 800 硬限前或该档下次实质改动）。

### 12.6 验收标准回指（逐条指回需求）

| AC | 判据（原文） | 本设计落点 | 机检判据（用例号 = §12.7） |
|---|---|---|---|
| AC-1 | 三新款 `matched === true`（命中独立行、非兜底；context 1M ≠ 128K） | §12.1 / §12.3 | M-1（+ M-4 前缀面） |
| AC-2 | 三新款字段逐项 = 口径表（七项） | §12.3 表 | M-2 |
| AC-3 | v2.5 两行对齐值（131_072 + 信息性字段）；`FAMILY_BASELINE` 同步 | §12.3 表 / §12.5 | M-3（值断言 = 运行时可推导形）+ M-5（基线同步） |
| AC-4 | `mimo` / `mimoplan` 预设 `model === "mimo-v2.6-pro"` | §12.2 / §12.5 | M-8 |
| AC-5 | 三新款行注证据等级词逐字在场 | §12.3 行注草案 | M-6 |
| AC-6 | 三端测试全绿 | §12.5 | 机检 |
| AC-7 | VSC README 两行已更新 | §12.5 行 5 | 实施轮 + 收口目视核（设计轮给出目标行文本） |
| AC-8 | T-13 保持绿（本节测试零新增信息性字段字面量） | §12.7 实施约束 | M-7（本节自扫）+ 既有 `[qwen]` T-13 本体 |

### 12.7 用例表（`[mimo]` 段 · 正常 / 边界 / 回归 / 错误）

承载 = **新建核单元测试档** `thincoder-core/test/model-specs-mimo.test.mjs`（D-4）
＋ 主档 `thincoder-core/test/model-specs.test.mjs` 仅承载 M-5（基线常量所在档，一文件一行内聚）。

| 号 | 类 | 承载 | 输入 / 动作 | 期望 |
|---|---|---|---|---|
| M-1 | 正常 | 新档 | 三名 `specMatch` | `matched:true` + `context === 1_000_000` + `maxOutput === 131_072`（≠ 128K/32K 兜底即证非默认面） |
| M-2 | 正常 | 新档 | 三名 `specForModel` 逐字段 | `assertFields`：`context` / `maxOutput` / `thinking` / `multimodal` / `thinkApi` / `reasoningEcho` / `tempRange`（AC-2 七项；**不含**信息性字段——D-3） |
| M-3 | 边界 | 新档 | v2.5 两行全字段 | `deepEqual`：pro = 对齐形（`maxOutput` 131_072 + `[{合成键}]: "auto"`）；`mimo-v2.5` = pro 形 + `multimodal: true`；**全文零字面量** |
| M-4 | 边界 | 新档 | 前缀面 | `mimo-v2.6-pro-ultraspeed` ≠ `mimo-v2.6-pro` 行对象（长名不被短名遮蔽）；三名 × 在册 mimo 名非前缀循环（v2.5 两行不被遮蔽） |
| M-5 | 回归 | **主档** | `FAMILY_BASELINE` mimo 行 | 行在场（防空扫）+ `assertFields(基线对象)` + `maxOutput === 131_072`（不同步 ⇒ 既有 `[qwen]` T-11 即红） |
| M-6 | 边界 | 新档 | `rowNote` 三名 | 「实测」「校验级」「官方口径」「族沿用」逐字在场（AC-5） |
| M-7 | 边界 | 新档 | 本档自扫（合成键） | 字面量命中数 === 0（T-13② 用例零新增——防自踩） |
| M-8 | 正常 | 新档 | `PROVIDER_PRESETS.mimo` / `.mimoplan` | **无 `model` 键** + `baseURL` 逐条在场；两预设同断；`mimoplan` 端点未实测（**unverified**，同平台推断）——本用例只验预设表取值，不涉端点 |
| M-9 | 错误 | 新档 | `mimo-v3-pro`（未在册） | `matched:false` + 兜底形状 128K/32K + 告警恰一次 + 表内不补泛前缀行（防空扫对照 = `TABLE_ROW_NAMES`） |

四类齐：正常 = M-1 / M-2 / M-8；边界 = M-3 / M-4 / M-6 / M-7；回归 = M-5；错误 = M-9。

**实施约束（设计钉死）**：

1. 新档 helpers **就地重定义、零 import 主单元测试档**（主档无导出面）：`SPEC_SOURCE` / `TABLE_ROW_NAMES` / `rowNote` /
   `assertFields` / 信息性字段**合成键**（`["cache", "Mode"].join("")`——主档 `:221` 同法先例）。
2. **测试全文零信息性字段字面量**（含注释与断言消息）——T-13② 逐档计数闸：新增命中即红（M-7 自扫兜底）。
3. 主档只改两处：`:201` 基线值 + M-5（+7 行）——不得顺带改写既有段（`[qwen]` / `[onboard]` / `[flashx]` 段零触碰）。
4. 三名常量与期望值取 §12.3 表字面（`131_072` / `[0, 1.5]` / `"type"` / `"required"` / `true`）。

### 12.8 边界（本节不做）

- 不动 mimo 族以外任何规格行 / 预设；**不删** v2.5 两行（在役，下线节奏归小米）。
- 不补泛 `mimo` 前缀行（未在册名照旧落 `DEFAULT_SPEC` + 一次性告警；M-9 钉住）。
- 不做全表复核 / 不加新字段 / 不改查表与排序机制 / 不改告警与兜底路径。
- 不改 CLI / VSC 端差面（`EFFORT_DEFAULT_PREFIXES` 零改——mimo 无 effort 档，本节不涉）。
- 不写 CHANGELOG（发布轮事务）；不改三端产品码（除预设表 `model` 两处改值）。
- v2.5 行 `reasoningEcho` 保持 `required`，本节不重议。
- **机制面回显证据句**：`assistantToolCallMessage` 文档串（`thincoder-core/model-specs.mjs:265-278`）随本节按复测同步改写
  （改写后与 §12.3 行注同一事实陈述；净增 0 行——§12.2 / §12.5）；机制正文（`doc:PROVIDER.md`）本体不在本节改动面。
- 本节不落实现——改码 = eng-coder，需 designToken。

### 12.9 UI/交互决策（全落地，无 open）

| 面 | 决策 |
|---|---|
| CLI `/models` | 三新款显示 `1M`（context 官方口径；证据等级由行注承载，显示面不区分）；v2.5 两行显示不变 |
| CLI `/think` 面板 | mimo 无 effort 枚举 ⇒ effort 列表 = 既有回退档 `high\|max`（`thincoder-cli/src/tui/cmd-think.mjs:16`，零改）；`thinkApi:"type"` ⇒ `isEffortOnly` = false ⇒ 开关行走 `thinking:{type}` 面——与 v2.5 同形（零变化） |
| VSC 思考下拉 | 三新款 = 单档 `"enabled"`（`thincoder-vscode/src/extension/provider-probe-window.mjs:66`：无枚举 ∧ `thinking:true`）；由「档位空」转「`enabled`」= 可见改善；默认档 = 档位首项（端差表不含 mimo，`thincoder-vscode/src/specs.mjs:22-41` 零改，D-7） |
| 预设面 | `mimo` / `mimoplan` 条目：`model` 改指；`thinking:{type:"enabled"}` 与 `maxTokens:131072` 零改（= 实测上限） |
| 面板 `max_output` / `context` 显示 | 三新款 `131072` / `1M`；v2.5 两行 `131072`（对齐后）/ `1M`——显示面不区分证据等级 |

无 `open` 项。

## 13. bench 名单面 14 档规格行补齐

### 13.1 处置口径

处置口径（用户「9 档参数补齐的应该去查表补齐」）：**建行 = 机器读源补齐**；取值三态——① 有读数（实测 / 校验级 / 受理级）照写；② 官方口径 / 同族沿用（**点名来源行**）照写 + 行注标级；③ 零口径 ⇒ **不声明该能力位**（尺寸位沿现盘生效值 + 行注标「未取证」）。
**不猜**：无实测、无口径的字段一律不冒充——宁可行注登记「未探」，不写猜测值（循 §2.4 D-2「不据同族类推补行」的裁定精神）。
**视觉位语义单一**（§2.7 + T-7 冻结）：`multimodal` 仅 `true` 或**不声明**——「实测无视觉」的正确机读形态 = 不声明（补齐 = 行注 + 测试锚，非改值）。

### 13.2 表变更清单（10 行新增 + 4 档声明面裁定 + 行注补录；零删除、零改既有行取值）

| # | 名 | 动作 | 落点 |
|---|---|---|---|
| 1 | `glm-4.5-air` | 建行（族沿用 `glm-4` 行取值 + 实测温度事实） | 新增行（`glm-4` 行之后） |
| 2 | `qwen3.7-plus` | 建行（context 官方口径 + 机制位族沿用 `qwen3.7-flash` 行；枚举 / 视觉不声明） | 新增行（`qwen3.7-flash` 行之后） |
| 3 | `qwen3.5-27b` | 建行（context 官方口径 · 定价页分档佐证；其余族沿用 `qwen3.6-27b` 行） | 新增行（`qwen3.6-27b` 行之后） |
| 4–6 | `kimi-k2.6` / `kimi-k2.7-code` / `kimi-k2.7-code-highspeed` | 建行（温度「仅受理 1」= 校验级；尺寸位未取证 ⇒ 沿现盘兜底值 + 标级；**不得带 `tempRange`**） | 新增三行（`k3` 行之后） |
| 7–9 | `doubao-seed-2-1-pro-260915` / `-turbo-260628` / `-lite-260915` | 建行（thinking / 枚举 / maxOutput = 实弹；context 族沿用 2.0 行；视觉**未探**不声明） | 新增三行（`doubao-seed-2-0-lite-260428` 行之后） |
| 10 | `MiniMax-M2.7`（前缀行——覆盖标准档与 `-highspeed`） | 建行（thinking 实测；尺寸 / 机制位族沿用 `minimax-m1` 行；`thinkApi` / 枚举不声明） | 新增行（`minimax-m1` 行之后） |
| 11 | `qwen3.7-max` | 声明面裁定：**保持不声明**（实测拒图像——T-7 语义下的「无视觉」形态）+ 补测试锚 | 行注（既有行）+ 单元测试档 |
| 12 | `hy3` | 同 11（实测无视觉——A-1 锚已在位，行注 / 测试零改） | —— |
| 13 | `deepseek-v4-pro` | 声明面裁定：**保持不声明** + 行注升级「视觉面未探」 | 行注（既有行） |
| 14 | `glm-5.3` | 同 13 | 行注（既有行） |
| 15 | `mimo-v2.6-{pro,flash,pro-ultraspeed}` | 行注补录：effort **无生效面**（实弹：effort 被忽略；off 路径 = `thinking:{type:"disabled"}` ✓） | 行注（既有三行） |
| 16 | `MiniMax-M3` / `minimax-m3` | 同 15（off 路径 = `type:"disabled"` ✓；effort 被忽略） | 行注（既有两行） |

### 13.3 字段口径表（取值 + 证据等级）

**新建行取值（逐名 · 证据等级括注）**：

| 名 | context | maxOutput | thinking / 枚举 | 视觉 | 机制位（partialMode / cacheMode / thinkApi / tempRange / 其它） |
|---|---|---|---|---|---|
| `glm-4.5-air` | 128_000（族沿用 `glm-4` 行） | 32_000（族沿用 `glm-4` 行） | true（族沿用）；枚举**不声明**（未探） | 不声明（未探） | cacheMode `auto` / thinkApi `type` / reasoningEcho `optional` / tempRange [0, 1] / noUsageStream（均族沿用 `glm-4` 行） |
| `qwen3.7-plus` | 1_000_000（**官方口径 · 网络转述**——AC-6 已裁「允许入表 + 行注标级」） | 131_072（族沿用 `qwen3.7-flash` 行） | true（族沿用）；枚举**不声明**（零口径） | 不声明（未探） | partialMode / cacheMode `none` / thinkApi `effort` / tempRange [0, 2]（族沿用 `qwen3.7-flash` 行） |
| `qwen3.5-27b` | 262_144（**官方口径 · 定价页分档佐证**——[128K, 256K) 档在售；规格页未逐名核） | 65_536（族沿用 `qwen3.6-27b` 行） | true（族沿用）；枚举**不声明**（零口径） | 不声明（未探） | partialMode / cacheMode `none` / thinkApi `effort` / tempRange [0, 2]（族沿用） |
| `kimi-k2.6` · `kimi-k2.7-code` · `kimi-k2.7-code-highspeed` | 128_000（**未取证**——沿现盘兜底值；建行不改变生效值） | 32_000（同左） | 不声明（未探）；枚举**不声明** | 不声明（未探） | **零机制位声明**（`tempRange` 不得给——KD-31 例外档不变量） |
| `doubao-seed-2-1-pro-260915` · `-turbo-260628` · `-lite-260915` | 256_000（族沿用 `doubao-seed-2-0-*` 两行；官方口径未逐名取证） | **524_288**（**受理级**——262 144 / 524 288 均 200；**上限未证**） | true（**实测**：裸请求 rc 在场）+ thinkApi `effort`（实测）+ 枚举七值（**受理级**——七值全 200、乱值 400 泛化） | **不声明（未探）**——如实标级 | 无（与 2.0 行同形：零 cacheMode / partialMode / tempRange / reasoningEcho 声明） |
| `MiniMax-M2.7` | 256_000（族沿用 `minimax-m1` 行） | 128_000（族沿用） | true（**实测**：裸请求 rc 在场）；thinkApi **不声明**（off 路径**未找到**——`disabled` 不生效）；枚举**不声明**（effort 被忽略 ⇒ 无生效面） | 不声明（未探） | cacheMode `auto` / noUsageStream（族沿用 `minimax-m1` 行） |

**行注草案（逐行 JS 注释 · 实现轮照抄；行注 = 证据等级承载面）**：

```js
// glm-4.5-air（智谱轻档）：temperature 0 受理 = **实测**；其余 = **族沿用 glm-4 行**
// （逐名官方口径未取证）；枚举 / 视觉面 = **未探**（不声明）。medium 直发实测受理。
["glm-4.5-air", { context: 128_000, maxOutput: 32_000, thinking: true, cacheMode: "auto", thinkApi: "type", reasoningEcho: "optional", tempRange: [0, 1], noUsageStream: true }],

// qwen3.7-plus：context = **官方口径（网络转述）**（AC-6 已裁允许入表——「100 万长文档」族点名）；
// maxOutput / partialMode / cacheMode / thinkApi / tempRange / thinking = **族沿用 qwen3.7-flash 行**；枚举 / 视觉面 = **未探**（不声明）。
["qwen3.7-plus", { context: 1_000_000, maxOutput: 131_072, thinking: true, partialMode: true, cacheMode: "none", thinkApi: "effort", tempRange: [0, 2] }],

// qwen3.5-27b：context 262_144 = **官方口径（定价页分档佐证——[128K, 256K) 档在售；规格页未逐名核）**；
// maxOutput / 机制位 = **族沿用 qwen3.6-27b 行**；枚举 / 视觉面 = **未探**（不声明）。
["qwen3.5-27b", { context: 262_144, maxOutput: 65_536, thinking: true, partialMode: true, cacheMode: "none", thinkApi: "effort", tempRange: [0, 2] }],

// kimi-k2.6 / kimi-k2.7-code / kimi-k2.7-code-highspeed（三行同形）：temperature **仅受理 1** = **校验级**
// （400 原文「invalid temperature: only 1 is allowed for this model」）；尺寸位 = **未取证**
// （沿现盘兜底值——建行不改变生效值）；**不得声明 tempRange**（KD-31 例外档不变量：入档值 = 实发值）；枚举 / 视觉面 = **未探**。
["kimi-k2.6",                { context: 128_000, maxOutput: 32_000 }],
["kimi-k2.7-code",           { context: 128_000, maxOutput: 32_000 }],
["kimi-k2.7-code-highspeed", { context: 128_000, maxOutput: 32_000 }],

// doubao-seed-2-1 三档（火山方舟 · 三行同形）：thinking / thinkApi / 枚举 = **实测**
// （裸请求 rc 在场；`reasoning_effort:"none"` → rc=0；七值全 200、乱值 400 泛化 ⇒ **受理级**——等级低于 2.0 行的
// 「真校验」，同值集不混级）；maxOutput 524_288 = **受理级**（262 144 / 524 288 均受理；**上限未证**）；
// context = **族沿用 2.0 行**（官方口径未逐名取证）；**视觉面未探**（不声明——如实标级，不冒充实测）。
["doubao-seed-2-1-pro-260915",   { context: 256_000, maxOutput: 524_288, thinking: true, thinkApi: "effort", reasoningEffortEnum: ["none", "minimal", "low", "medium", "high", "xhigh", "max"] }],
["doubao-seed-2-1-turbo-260628", { context: 256_000, maxOutput: 524_288, thinking: true, thinkApi: "effort", reasoningEffortEnum: ["none", "minimal", "low", "medium", "high", "xhigh", "max"] }],
["doubao-seed-2-1-lite-260915",  { context: 256_000, maxOutput: 524_288, thinking: true, thinkApi: "effort", reasoningEffortEnum: ["none", "minimal", "low", "medium", "high", "xhigh", "max"] }],

// MiniMax-M2.7（前缀行——覆盖标准档与 -highspeed）：thinking = **实测**（裸请求 rc 在场）；off 路径 **未找到**
// （`thinking:{type:"disabled"}` 不生效——如实，不声明 thinkApi）；effort 被忽略 ⇒ **无生效面**（枚举不声明；medium 照发仅口径统一）；
// 尺寸 / cacheMode / noUsageStream = **族沿用 minimax-m1 行**；视觉面 = **未探**（不声明）。
["MiniMax-M2.7", { context: 256_000, maxOutput: 128_000, thinking: true, cacheMode: "auto", noUsageStream: true }],
```

### 13.5 消费面契约（本节动谁、谁零改）

**零改面**：`thincoder-core/provider/core.mjs` 守卫与裁剪逻辑（effort 枚举校验 / `tempRange` 裁剪 / 路由与 format 豁免）· `auto-think.mjs` 与 `spawn-child.mjs` 的档位读取 · CLI `/think` 面板与 VSC 思考下拉（新建行未声明枚举的档 = 既有回退档形——与建行前同形）· `bench/models.json` 的 `skipDims`（10 名现状照旧）。
**动面**：`model-specs.mjs` 表行（§13.2）；`bench` 中档口径的覆写值住 `models.json`，与 spec 表正交（两处各自的测试分档承载）。

### 13.6 影响文件清单

| 文件 | 现状 | 预期增量 | 说明 |
|---|---|---|---|
| `thincoder-core/model-specs.mjs` | 292 | +~45（10 行 + 行注块 + 4 处行注升级）⇒ ~337 | 见 §13.2 / §13.3；行序取「同族相邻」（查表按前缀长度排序，行序不影响命中——防遮蔽由 G-1 / T-11 覆盖） |
| `thincoder-core/test/model-specs.test.mjs` | 477 | **±0**（G-1..G-7 迁新载体档——500 硬限余量 23 行） | 仅 `[qwen] T-4/A-14` 退化锚**就地同名替换**（`qwen3.7-plus` 建行后不再是退化样本——改用仍在兜底的名字）；新增锚（建行逐名命中 / 「未探」词在场 / `multimodal` 分态）随 G-1..G-7 落新载体档（下行）  |
| `thincoder-core/test/model-specs-bench.test.mjs`（新建） | 0 | ~90–140 | G-1..G-7 承载档（§13.8）；循 `model-specs-mimo.test.mjs` / `model-specs-qwen36.test.mjs` 先例（helpers 就地重定义 · 零 import 主档）；≤300 免登记；实施读数在册。|
| `thincoder-core/test/core-hygiene.test.mjs` | 183 | +4 ±1 | `SOFT_LINE_REGISTRY` 增 `model-specs.mjs`（建行后 >300 登记——规则源 = `thincoder-core/test/core-hygiene.test.mjs:149-162`）；注释块登记句 + Set 行  |

**行数处置（登记 + 拆分计划）**：行数上限 = 软线 **300** / 硬限 **500**（`thincoder-core/test/core-hygiene.test.mjs:149-162` 规则：>500 硬红 · >300 未登记即红）——`model-specs.mjs` ~337 ⇒ **登记**（上行 `core-hygiene.test.mjs` 同批落）；
**拆分计划** = 拆点 `MODEL_SPECS` 表块（行 + 行注）外提；落点 `thincoder-core/model-specs-table.mjs`（拟新增——主档 re-export 保 import 面零改）；连带面 = 单元测试档文本扫描 helpers（`SPEC_SOURCE` 族）随拆分批改读两档；**消解窗口 = 越 800 硬限前或该档下次实质改动时**（登记面 = `thincoder-core/test/core-hygiene.test.mjs` 的 `SOFT_LINE_REGISTRY` 体例）。

### 13.7 验收标准回指（条目 #267 · 需求裁定）

| 判据 | 设计落点 | 判定方式 |
|---|---|---|
| 10 档无专行 ⇒ 建行逐名命中 | §13.2 / §13.3 | G-1（`specMatch(name).matched === true`）+ G-2（取值逐字段对读） |
| 4 档视觉声明分态（实测无视觉 / 未探）且 T-7 零改 | §13.1 / §13.2 | G-6（`qwen3.7-max` / `hy3` 不声明 + 理由锚；未探两档行注「未探」在场） |
| 尺寸失实面（doubao 2.1 上限低估）收正 | §13.3 | G-2（`maxOutput = 524_288` 受理级 + 行注「上限未证」） |
| 未探面如实标级（不冒充实测） | §13.3 | G-3（「未探 / 未取证」词在场）+ 本表登记 |
| 三端产品行为零回归 | §13.5 | G-7（既有族代表名字段零改）+ 核测试全绿 |

### 13.8 用例表（`[bench-specs]` 段 · 循 `[flashx]` / `[qwen36]` / `[mimo]` 先例）

**承载档**：G-1..G-7 = **新载体单元测试档**（循 `model-specs-mimo.test.mjs` / `model-specs-qwen36.test.mjs` 先例）；主单元测试档 **±0**（距 500 软线 23 行 ⇒ 新增锚不得落主档；G-5 的退化锚改指 = 主档就地同名替换，其余锚落新档）。

| id | 类 | 输入 | 期望与判据 |
|---|---|---|---|
| G-1 | 正常 | 10 个新建名（§13.2 #1–#10） | `specMatch(name).matched === true`（命中独立行，非兜底）；表行名提取含全 10 名（正则空扫防护同 T-7） |
| G-2 | 正常 | 逐名关键字段 | 取值 = §13.3 表逐字段（context / maxOutput / thinking / 枚举 / 视觉 / 机制位）；`doubao` 三行枚举七值 + `maxOutput = 524_288`；`kimi` 三行 `tempRange === undefined` |
| G-3 | 正常 | 行注证据词 | 新建行注含「未探 / 未取证」字面（`glm-4.5-air` / `kimi×3` / `doubao×3` / `MiniMax-M2.7`）+ 按 §13.3 在位「受理级 / 实测 / 官方口径 / 族沿用」 |
| G-4 | 边界 | KD-31 例外档不变量 | `kimi-k2.6` / `k2.7-code` / `k2.7-code-highspeed` 的 `tempRange === undefined`（入档值 = 实发值） |
| G-5 | 边界（退化锚改指） | `qwen3.7-plus`（建行后不再走退化面） | T-4/A-14 改指仍在兜底的名字（如 `qwen3.5-flash`）+ 保留「退化形状已知」判据；`qwen3.7-plus` 新增「建行命中」断言 |
| G-6 | 边界 | `qwen3.7-max` / `hy3` | `multimodal === undefined` + 行注含实测理由（拒图像 / 不识图）；T-7 全表扫描零改 |
| G-7 | 回归 | 既有族代表名（T-11 清单） | 字段逐项不变（防误删误改行） |

### 13.9 边界（本节不做）

- 不做未探字段的推测填充（「未探不声明」——用户「查表补齐」的证据面到此为止）。
- 不声明 `multimodal: false`（T-7 语义单一——无视觉 = 不声明）。
- 不落主单元测试档（`thincoder-core/test/model-specs.test.mjs` 477——500 硬限余量 23 行）：G-1..G-7 新增锚一律落新载体档；`model-specs.mjs` 越 300 的处置 = 登记 + 拆分计划（§13.6「行数处置」段），**本节不拆**。
- 不改核侧行为（守卫 / 裁剪 / 豁免零改）；不改 `bench/models.json` 的 `skipDims` 与中档覆写值。
- 不做实弹探针（需密钥 = 父侧 / 用户执行面）；探针结论落地时另批改行。

### 13.10 UI/交互决策（全落地，无 open）

CLI `/think` 面板与 VSC 思考下拉的可见面：新建行未声明枚举的档 = 与建行前同形（回退档 / 单档 `enabled`）⇒ **零可见变化**；`doubao-seed-2-1` 三档因声明七值枚举，选择面由「兜底档」转「七值」（与 2.0 行同形）；`MiniMax-M2.7` 前缀行对标准档与 `-highspeed` 同效。无 `open` 项。

## 14. 八条清理与收口

### 14.1 决策与理由

| 定案 | 判据 | 理由 |
|---|---|---|
| **D-a #14 删字段** | `.cacheMode` 消费面全仓 = 0（行14）；66 行中 49 行携带而零读 | 计数基线白名单须逐批改数 = 永久维护成本 |
| **D-b #21 → 131_072** | 校验级 400「限制数值范围 [1,131072]」 | 实测 max=128000 是请求侧表现、非上限证明 |
| **D-c #11 分行补行** | 服务端活测 + 父侧五名实测读数 | 1M/256K、effort 块有无不同 = 合并即错；无读数先补行（零口径不声明） |
| **D-d #15 占位「—」** | 防与 hy3/doubao `thinking:true` 矛盾（enum0=none = off） | 取 `levels[0]` 预选即批前现行为（由 §14.5/§14.10 收正）= 缺陷面 |
| **D-e #16 抽纯函数去重** | :180 对含 none 枚举出双行；:205/:232 只认 `=== "none"` ⇒ 去重零语义变 | 同规则两处手写 = 两处漂移源；抽纯函数后语义零变 |
| **D-f #18 归一 off** | 镜像 `cmd-think.mjs:104` 归一式 / :127 删档 / :82 回执；残留 `"none"` 会被载荷层当强度档送（:102-103 注实证） | 镜像 `cmd-think.mjs:104` 归一式 = 既有单源形态；残留 `"none"` 会被载荷层当强度档送（:102-103 注实证） |
| **D-g #19 降值 + 不变式** | 预置 ≤ 规格行（`model-specs.mjs:33` 实值 384_000） | 抬行无实测依据 = 捏造口径；全量硬断言不带白名单：六家存量即红 |
| **D-h #17 纯补测** | 回执公式 `cmd-think.mjs:86-88` 已正，缺陷 = 零覆盖（全仓仅 :36 注释提及） | 回执公式已正 ⇒ 缺陷只在零覆盖，补测不动码 |

### 14.2 表变更清单（1 行改值 + 8 行新增 + 两表改值 + 字段删除；零删行）

| # | 面 | 动作 | 落点 |
|---|---|---|---|
| 1 | `glm-5.3-flash` | maxOutput 128_000 → **131_072**（校验级）+ :67 行注改写 | `thincoder-core/model-specs.mjs:60` / 行注；本档对应差异句同批收正（§14.5 · §14.6 行注） |
| 2–6 | `gemini-3.1-pro` / `claude-fable-5.1` / `step-3.7-flash` / `qwen-flash` / `qwen-vl-max` | 补专行（值 = 父侧实测交付读数） | 新增五行（同族行后） |
| 7 | `kimi-for-coding` | 补行：context **1_048_576** + effort 块 `[low,high,max]` default max（均活测） | `k3` 行之后 |
| 8 | `kimi-for-coding-highspeed` | 补行：context **262_144**（活测）；**无 effort 块** | 同上，**独立行**（防与 `kimi-k2.7-code-highspeed` 128_000 合并） |
| 9 | `k3-256k` | 补行：context **262_144** + effort `[low,high,max]` default **high**（活测） | `k3` 行之后 |
| 10 | `grok-4.7` / `grok-4.8` | 按父侧实测裁定：失实 ⇒ 补两专行；相符 ⇒ 零改 + 记证 | 条件（父侧实测裁定） |
| 11 | `cacheMode` | 字段整体删除：字段注 :20 + 49 行键 + `DEFAULT_SPEC:215` + 注释提及 = **61 处字面 → 0** | `model-specs.mjs` 全档 |
| 12 | 端差表 | `EFFORT_DEFAULT_PREFIXES` **+1**：`["k3-256k","high"]`（现 `["k3","max"]` 前缀对 k3-256k 出错默认）；`kimi-for-coding` 已由 `["kimi","max"]` 覆盖同值 ⇒ 零加（防键前缀冗余）；五名默认档随实测条件登记。**继承披露**：`["kimi","max"]`（`:27`）同时命中 `kimi-for-coding-highspeed` ⇒ 其端差面继承 `reasoningEffortDefault:"max"` 而行面无 effort 块（枚举空）——裁定**接受继承**（前缀语义有意、先例 = 快照名继承母行「有意继承非遮蔽」）；零下拉由 `effortSelectView` 空枚举 ⇒ null 承接 + 「注册默认 ∈ 枚举」前置兜底（§14.3 / AC-3） | `thincoder-vscode/src/specs.mjs:22-41` |
| 13 | 预设表 | deepseek `maxTokens` 393216 → **384_000** | `thincoder-core/config-presets.mjs:17` |

### 14.3 字段口径表（新建行取值 + 证据等级）

| 名 | context | maxOutput | effort（枚举 / 默认） | 机制位与其它 |
|---|---|---|---|---|
| `kimi-for-coding` | 1_048_576（**活测**——服务端 200 /models） | 族沿用 `k3` 行（点名来源行）+ 行注标级 | `["low","high","max"]` / default **max**（活测） | 机制位族沿用 `k3` 行（有则沿、无则不声明）；能力位按现盘口径 |
| `kimi-for-coding-highspeed` | 262_144（活测） | 同上族沿用 | **无 effort 块**（活测——枚举/默认均不声明） | 与 `kimi-k2.7-code-highspeed`（128_000）分值分行 |
| `k3-256k` | 262_144（活测） | 同上族沿用 | `["low","high","max"]` / default **high**（活测） | 机制位族沿用 `k3` 行 |
| 五名（§14.2 #2–6） | 父侧实测交付值 | 同左 | 交付含默认档则登记端差表，不含则不声明 | 未交付字段零口径 |
| `glm-5.3-flash` | 既有行零改 | **131_072**（校验级） | 枚举零改 | `glm-5.3` 本体 :59 **128_000 冻结** |
| deepseek 预置 | — | 规格行 384_000（`model-specs.mjs:33` 不动） | 预置 `maxTokens` ≤ 384_000 | `presetToEntry` 输出面值变（:17） |

**端差继承注（裁定「接受继承」）**：`kimi-for-coding-highspeed` 行面无 effort 块，但端差表 `["kimi","max"]`（`thincoder-vscode/src/specs.mjs:27`）按既有前缀语义（`specs.mjs:19-21`）命中 ⇒ 端侧 `reasoningEffortDefault = "max"`。
  接受理由：前缀语义有意为之（先例 = 快照名继承母行同判，`thincoder-vscode/test/image-downgrade.test.mjs:270`）；其后果被两层承接——枚举空 ⇒ `effortSelectView` 返 `null`（零下拉 / 零预选 / 零落盘）+ 「注册默认须 ∈ 枚举」前置（注册默认 ∉ 枚举时不生效，回落占位「—」）。AC-3 两径同判据。

### 14.5 消费面契约（本节动谁、谁零改）

**零改面**：`cmd-think.mjs` 码面（#17 纯补测）· `settings-state.js` 的 `effortEnumFor`（枚举读取面——`effortSelectView` 内部调用，本体零改）· `cmd-config-menus.mjs:117/:144` 消费语义（只认 `=== "none"`）· `specMatch` / 前缀排序 / `warnUnknownModel` / `DEFAULT_SPEC` 兜底语义 · F-1:429 / F-2:439 断言 · k3 预置面（不转）· mimo 半边（销案）·
  VSC `src/specs.mjs` 的 cacheMode（本就零在场）· 核守卫/裁剪/豁免（`thincoder-core/provider/core.mjs`）。

**动面**：`model-specs.mjs`（改值 / 补行 / 删字段）· `config-presets.mjs:17` · `specs.mjs:22-41`（+1 登记）·
  `config-helpers.mjs:40`（抽纯函数）· `cmd-advisor.mjs:116-117`（归一 + 删档 + 回执）· `settings-state.js:44-49`（`effortSelectView` / `effortPayloadValue` 新增；`defaultEffortFor` 并入删除——零调用者）·
  `settings-widgets.js:44-53`（`buildEffortSelect` 同源化 = **换模型重建径**）· `settings-models.js:26-30`（`collectConsultRows` 落盘归一 +import；`:18` 读取面保持原值）· `settings-agent.js:50/:63`（初渲染径）+ `:125`（payload 归一）· 八支单元测试档（§14.6——含三支拟新增）。

### 14.6 影响文件清单

| 文件 | 现状 | 预期增量 | 说明 |
|---|---|---|---|
| `thincoder-core/model-specs.mjs` | **326** | +~10 −1 ⇒ ~335 | **本节不拆** |
| `thincoder-core/test/model-specs.test.mjs` | **477** | **±0**（T-13:250-262 改零字面门同尺寸、F-3:451 改值） | 改写面含 `INFO_FIELD:221`（`["cache","Mode"].join("")` 藏字面——针保留）与 `SCAN_EXT:224`/`SKIP_DIRS:225` 已排除 `docs/` 与 `.md` ⇒ 零字面门在码+测清理后可绿；`scanFieldHits:229` 零改。新增锚一律落新载体档；500 硬限余量 23 行保留；**F-1:426/:429 取值断言与 `:431` `notEqual` 保留**（差异判据 = 排序面，§14.2 #1）  |
| `thincoder-core/test/model-specs-cleanup.test.mjs`（新建） | 0 | ~80–120 | AC-1 锚承载（C-1..C-4；AC-2 门归 T-13、AC-8 锚归 F-3（`model-specs.test.mjs`）——均不在本档，§14.7；循 mimo/qwen36/bench 载体先例，≤300 免登记）  |
| `thincoder-core/config-presets.mjs` | **49** | **±0**（:17 值改） | AC-7 数据面 |
| `thincoder-core/test/config-presets.test.mjs` | **51** | +~25 | 不变式 + 白名单六家双向断言（C-7/C-8）  |
| `thincoder-vscode/src/specs.mjs` | **88** | +1 ⇒ **89** | k3-256k 登记（§14.2 #12） |
| `thincoder-vscode/test/image-downgrade.test.mjs` | **273** | +~22 ⇒ ~295 | AC-3/AC-6 VSC 侧锚（E-5 **两径**：初渲染 + 换模型重建）；≤300 免登记（**余量 5 行**——超即拆新档，勿挤写）  |
| `thincoder-vscode/webview/settings-agent.js` | **174** | +~2 ⇒ ~176 | 初渲染两 select（`:50/:63` 内联 HTML 串）改走 `effortSelectView`；payload（`:125`）过 `effortPayloadValue`——select 类名 / id 不变（绑定链零改） |
| `thincoder-vscode/webview/settings-widgets.js` | **109** | +~2 ⇒ ~111 | `buildEffortSelect`（`:44-53` = **换模型重建径**）同源化；空枚举返 null 语义不变（`view === null`） |
| `thincoder-vscode/webview/settings-models.js` | **214** | +~4 ⇒ ~218 | `collectConsultRows`（`:26-30`）落盘前 `effortPayloadValue` 归一（「—」/`none`/空 → null ⇒ 删键）+import；`:18` 读取面保持原始值 |
| `thincoder-vscode/webview/settings-state.js` | **53** | +~18 −6 ⇒ ~65 | 新 `effortSelectView`（levels = 「—」+ 枚举；selected = 已存值 > 注册默认∈枚举 > 「—」；枚举空 ⇒ null）与 `effortPayloadValue`（「—」/`none`/空 → null ⇒ 删键）；`defaultEffortFor`（`:44-49`）并入删除（零调用者） |
| `thincoder-cli/src/tui/cmd-config.mjs` | **463** | +~8 ⇒ ~471 | 抽 `effortMenuLevels` 导出；**>300 无登记机制在场**（`SOFT_LINE_REGISTRY` 扫描域 = `thincoder-core/`——`core-hygiene.test.mjs:19` ROOT）⇒ 核面 = 500 硬限，**余量 29 行**  |
| `thincoder-cli/test/cmd-config-effort.test.mjs`（本轮新建） | 0 | ~50 | AC-4（E-1/E-2）  |
| `thincoder-cli/src/tui/cmd-advisor.mjs` | **255** | +~8 ⇒ ~263 | 归一 + 删档 + 回执（:116-117） |
| `thincoder-cli/test/cmd-advisor.test.mjs`（新建） | 0 | ~65 | AC-6（E-3）；全仓现无此档 = **新建** |
| `thincoder-cli/src/tui/cmd-think.mjs` | **151** | **±0** | 码面零改 |
| `thincoder-cli/test/cmd-think.test.mjs` | **153** | +~25 ⇒ ~178 | AC-5（E-4）注入驱动  |
| `thincoder-cli/test/model-ref.test.mjs` | **432** | **±0**（:85 deepEqual 去 cacheMode 键） | AC-2 联动  |
| DOC 侧（就地改写） | — | ~0 | — |

### 14.7 验收标准回指

| 判据 | 条目 | 设计落点 | 判定方式（机器核） |
|---|---|---|---|
| AC-1 | #11 | §14.2 / §14.3 | C-1（五名命中专行、逐值 = 交付读数）+ C-2（kimi 三行字段）+ C-3（防合并三值分行） |
| AC-2 | #14 | §14.2 / §14.5 | T-13 零字面门（**唯一权威** = `model-specs.test.mjs:250-262` 就地改形；§14.8 表下注）+ `model-ref.test.mjs:85` / `image-downgrade.test.mjs:120` 去键绿  |
| AC-3 | #15 | §14.10 | E-5（**两径**：初渲染 + 换模型重建——同源 helper）：未注册 → 「—」selected ∧ payload 无 effort 键；已存 > 注册默认（∈ 枚举）> 「—」优先序；选 `none` → 删键；空枚举 ⇒ `view = null` |
| AC-4 | #16 | §14.10 | E-1/E-2：含 none 枚举单 none 首位、无 none 前置、enum 序保持；:205/:232 源零改断言 |
| AC-5 | #17 | §14.8 | E-4：注入驱动 off 后回执 `Thinking: OFF`（缺守卫回归 = ON 即红） |
| AC-6 | #18 | §14.10 | E-3：`effort_none` → off 形 + 删 `reasoningEffort` + 回执 OFF；`effort_low` → 置档；VSC 两 select 同约锚 |
| AC-7 | #19 | §14.2 | C-7/C-8：deepseek 384_000 ∧ 不变式绿 ∧ 白名单双向（实际超限集 == 白名单六家） |
| AC-8 | #21 | §14.2 / §14.3 | C-6：F-3:451 = 131_072 ∧ flash 行 = 131_072 ∧ `glm-5.3` = 128_000 冻结 |

### 14.8 用例表（正常 / 边界 / 错误）

| id | 类 | 输入 | 期望输出与判据 |
|---|---|---|---|
| C-1 | 正常 | 五实测名 | `specMatch(名).matched === true`（非兜底）且 context / maxOutput = 交付读数逐字段 |
| C-2 | 正常 | kimi 三名 | 行存在；`kimi-for-coding` 1_048_576 + effort 三值 default max；`-highspeed` 262_144 **无** effort 块；`k3-256k` 262_144 default high；maxOutput = 族沿用值 + 行注标级字面在场 |
| C-3 | 边界 | k3 / 两 highspeed 近名 | `k3` 1_048_576 ≠ `kimi-for-coding-highspeed` 262_144 ≠ `kimi-k2.7-code-highspeed` 128_000（防合并） |
| C-4 | 边界 | 未知名 | 仍落 `DEFAULT_SPEC`（兜底语义回归零改）；grok-4.7/4.8 命中面 = 实测裁定结果 |
| C-6 | 正常 | `glm-5.3-flash` / `glm-5.3` | 131_072 / 128_000（冻结对照） |
| C-7 | 正常 | `PROVIDER_PRESETS.deepseek` | `maxTokens = 384_000` ∧ `≤ specForModel("deepseek-flash").maxOutput` |
| C-8 | 错误 | 全预设逐条不变式 | 实际超限集 == 白名单六家（僵尸白名单红、新增超限红——双向） |
| E-1 | 正常 | enum 含 none（qwen3.8-flash 形） | `effortMenuLevels(enum)` → none 唯一且首位、其余序保持 |
| E-2 | 边界 | enum 无 none / 空 | 前置 none；空 → `pickEffort` 早退 null（既有） |
| E-3 | 正常/错误 | advisor `effort_none` / `effort_low` | off 形（think_off 同式）+ `delete cfg.reasoningEffort` + 回执 `Thinking: OFF`；low → `Reasoning effort: low`；无归一即红 |
| E-4 | 回归 | `/think` effort none 路径 | 回执 `Thinking: OFF`（守卫缺失时误报 ON = 红） |
| E-5 | 正常/边界 | VSC consult/advisor 两 select | **两径**：① 初渲染；② 先渲染再换模型（`settings-widgets.js` 重建）——同源 helper 同判据：未注册 → 「—」selected ∧ 落盘无 effort；已存值优先注册默认（∈ 枚举）；选 none → 删键不写字面；空枚举 ⇒ 零渲染 |

**零字面门注（AC-2）**：本表不另立用例——唯一权威 = `thincoder-core/test/model-specs.test.mjs:250-262`（T-13 就地改形为单门，±0 行）。

### 14.9 边界（本节不做）

- 不做 #5 / #13（排除面）；不动六态机制与批档机制。
- k3 预置零动（用户逐字「不转」= 不可扩边界）；mimo 半边销案。
- hy3 / doubao 官方默认档**不注册**（探针挂 #11 取证族；扩面 = 上报）。
- 五名未交付字段零口径不声明；grok 专行仅在实测失实时落（两分支已定）。
- `model-specs.mjs` **本节不拆**。
- 不改 `thincoder-core/provider/core.mjs` 守卫/裁剪/豁免；不改 `warnUnknownModel` 告警语义。
- 六家预置超限**不修**（仅白名单 + 上报——修值 = 扩面待裁）。

### 14.10 UI/交互决策（全落地，无 open）

- **VSC consult/advisor effort 下拉**：单一规则源 = `settings-state.js` 的 `effortSelectView`（渲染：levels = 「—」+ 枚举；selected = 已存值 > 注册默认（须 ∈ 枚举）> 「—」；空枚举 ⇒ `null`）与 `effortPayloadValue`（载荷：「—」/`none`/空 → 删键）；
  **两渲染径同源**——初渲染（`settings-agent.js:50/:63` 内联 HTML 串）与换模型重建（`settings-widgets.js:44-53` DOM 构造）共用该 helper；载荷归一两点 = `settings-models.js:26-30`（consult）与 `settings-agent.js:125`（advisor）；
  「—」恒首项、不落盘 effort；选 `none` = 关思考语义 ⇒ **落盘删键**（不写字面 `none`）。consult 行与 advisor 行两 select 同约；`class` / id 不变（绑定链零改）。
- **CLI `/config` effort picker**：`levels` 唯一 `none` 且首位；`none` 语义不变（= 清档，:205/:232 零改）；`← current` 回显逻辑零改。
- **CLI advisor effort 菜单**：`effort_none` → 回执 `Thinking: OFF`（先例 `cmd-think.mjs:82`）+ off 形落盘；其余档回执 `Reasoning effort: <档>` 照旧。
- **CLI `/think`**：可见面零变化（#17 纯补测）。
- 五名 / kimi 建行对 UI 的影响 = 选择面由「兜底/告警」转「专行值」（显示面不区分证据等级，循 §13.10 同则）。

无 `open` 项。

## 15. 规格·effort 轮

### 15.1 判定总纲

1. **收窄 / 接线只在「有据」处做**——无据面取保守处置并把等级如实标出（D-11 / KD-36 同则），不得以「同族类推」或「占位值」冒充证据。
2. **off 语义单口径**——「关思考」= 载荷层可识别的 off 形（**族别形 = §15.4-2**：effort 族 `thinking === null`、type 族 `{type:"disabled"}`——两形同一语义），且**该形不得在任何解析链上被抹掉**（§15.4-3）；谓词本体不在本节，单源 = `doc:PROVIDER.md:§6.12`。
3. **归一规则单源**——VSC 两处归一（设置面板 / 聊天面板 picker）共用一条三支优先序规则（§15.4-1）；「已存值 ∉ 枚举」在本节获得显式定义。

### 15.2 #241 `noUsageStream` 复核（裁定 = 保留；字段语义收正）

**表内现状**：带该标 = **14 行**——glm 族 7（`glm-5.3` / `glm-5.3-flash` / `glm-5.3-flashx` / `glm-5.2` / `glm-5` / `glm-4` / `glm-4.5-air`）·
minimax 族 4（`MiniMax-M3` / `minimax-m3` / `minimax-m1` / `MiniMax-M2.7`）· gemini 族 3（`gemini-3-pro` / `gemini-2.5-pro` / `gemini-2.5-flash`）。

**唯一消费点** = `thincoder-core/provider/core.mjs:183`（`if (!spec.noUsageStream) body.stream_options = { include_usage: true }`），位于 **OpenAI 兼容体组装段**：

| 族 | 消费点可达 | 复测读数 | 本节裁定 |
|---|---|---|---|
| glm 族 7 行 | 可达 | **双向有据**：① 四家直连探针带 `stream_options.include_usage` 全 200（含 `glm-5.3-flash`）；② bench 冒烟经核路径（不发该参数）usage 正常（31/0/92 · 29/0/212 · 33/0/447）⇒ 抑制**无实害** | **保留**（裁据见下） |
| minimax 族 4 行 | 可达（`chatPath` 非标路径） | **未复测** | **保留**（保守——无据即不动） |
| gemini 族 3 行 | **不可达**（`format:"google"` 走原生 transport；usage 由 `usageMetadata` 承载） | 不适用 | **保留**（该标对这三行是**惰性声明**：核不经此路，属如实登记面） |

**保留裁据（不对称代价）**：收窄的唯一收益 = 让「核主动声明 usage 需求」；该收益对 glm 族已由读数①证伪（网关不依赖该参数也带 usage）⇒ **收益 ≈ 0**，而风险 = 14 行行为面的一次性变更（含**取证未覆盖的两条宿主面**：glm 编码端点 `open.bigmodel.cn/api/coding/paas/v4`、minimax 非标 `chatPath`）——一个 400 即整渠道不可用。零收益 × 非零风险 ⇒ **不收窄**。

**字段语义收正（交付面 = 文档 + 行注，零行为变更）**：`noUsageStream` 的现行读法近似「该模型不支持 usage 流」= **能力断言**；读数①②已证该断言对 glm 族失实 ⇒ 语义收正为「**核不主动发 `stream_options.include_usage`**（保守抑制；非服务端能力断言）」，等级逐族标（glm = 实测无实害 · minimax = 未复测 · gemini = 惰性）。

**复评条件（非待办）**：后续若要收窄，证据面 = 一次同时覆盖 ① 标准宿主 ② 编码宿主 ③ minimax `chatPath` 的 `include_usage` 契约级读数（缺任一条即维持本裁定）。

### 15.3 #326 预置 `maxTokens` ⇄ 规格行逐对对齐

**不变式（沿用 · 单源 = `thincoder-core/test/config-presets.test.mjs` C-8）**：逐预置（设了 `maxTokens` 者）`maxTokens ≤ specForModel(preset.model).maxOutput`——**基准 = 生效规格值**（含 `DEFAULT_SPEC` 兜底 32_000；未建行名即以此为准）。

**六对处置（逐对方向 + 基准等级）**：

| 预置 | 模型 | 现 `maxTokens` | 生效基准（来源） | 本节动作 |
|---|---|---|---|---|
| `grok` | `grok-4.5` | 65 536 | 行值 **64 000**（真行） | 降 → **64_000** |
| `mistral` | `mistral-large` | 32 768 | 行值 **32 000**（真行） | 降 → **32_000** |
| `openrouter` | `anthropic/claude-sonnet-4` | 32 768 | 行值 **32 000**（命名空间剥离命中 `claude-sonnet-4` 行） | 降 → **32_000** |
| `hunyuan` | `hunyuan-pro` | 32 768 | **无行** ⇒ `DEFAULT_SPEC` 32 000（占位） | 降 → **32_000**（对齐至生效基准）+ 覆盖挂 #11 |
| `siliconflow` | `deepseek-ai/DeepSeek-V3` | 32 768 | **无行**（剥离后 `deepseek-v3` 不命中任何 `deepseek-v4*` 行）⇒ 占位 32 000 | 降 → **32_000** + 覆盖挂 #11 |
| `groq` | `llama-3.3-70b-versatile` | 32 768 | **无行** ⇒ 占位 32 000 | 降 → **32_000** + 覆盖挂 #11 |

**兜底三对的口径（「先补覆盖再对齐」的落法）**：**对齐**与**覆盖**是两条轴，各自处置——

- **对齐轴（本节交付）**：降 preset 至**生效基准** 32_000（安全方向：值只减不增，服务端不会因过大的 `max_tokens` 吃 400；32768 → 32_000 = 既有「K×1024 ⇄ 十进制」口径差族，同 `deepseek` 384_000 先例）。对齐不承诺该三名真实上限——**占位基准不是证据**，此点如实登记。
- **覆盖轴（挂 #11 覆盖巡检族 · 不建行）**：三名的**真实输出上限** = 未取证 ⇒ 按 D-11 / KD-36 三态**不据同族类推建行**、不冒充实测。取证路径 = 三名各自渠道的**校验级读数**（`max_tokens` 越界 400 原文 / 服务端受理上限）或官方口径（`网络口径`/`官方口径` 标级），取证到位后补**尺寸行**并按行值复对齐（二分支：有据 ⇒ 预设可随行值上调；无据 ⇒ 维持 32_000）。取证主体 = 父侧（本机 config 13 条渠道**无** hunyuan / siliconflow / groq ⇒ 核内无活体通道）。

**白名单终态**：`OVER_LIMIT` 六家 → **空名单**（超限集 = ∅）——不变式全绿，绊网保留（任一预置再超限即红）。`NO_SPEC_ROW`（hunyuan / siliconflow / groq）**不动**——覆盖缺口仍由该名单可见，与超限轴解耦。

### 15.4 effort 归一链单源规则（#330 本体；#329 / #331 各占其面）

**§15.4-1 规则（单源 = `thincoder-vscode/webview/settings-state.js` 的 `effortSelection`；两消费面 = 设置面板 `effortSelectView` / 聊天面板 `model-picker.js` 两处归一）**：

```
effortSelection(levels, current, registeredDefault) → value ∈ levels ∪ { null }
  ⓪ current === "none" ∧ "none" ∉ levels → null   （off 哨兵避支：不经注册默认支——§16.5）
  ① current ∈ levels            → current          （已存值优先）
  ② registeredDefault ∈ levels   → registeredDefault（注册默认须在枚举内）
  ③ 否则                        → null             （中性档：不显式档）
```

**「已存值 ∉ 枚举」定义（新登）**：**按枚举显式判成员**——不在枚举内即不成立（不得由浏览器「无匹配 option ⇒ value 落空」的代发行为承载结果）。中性档（`null`）语义 = **不写 effort 载荷**：服务端默认与渠道条目原值照旧生效。

**off 哨兵避支（§16.5）**：`current === "none"`（读面 off 形字面）∧ 枚举不含 `"none"` ⇒ **中性档**（不经 ② 支）——两消费面同源：设置面板预选「—」、聊天面板 picker 落「—」（`""` ⇒ 回合侧零 patch）。

**三面映射（同一 value，三种落法）**：

| 面 | 中性档渲染 | 载荷 |
|---|---|---|
| 设置面板 `effortSelectView` | 选项「—」恒首项且 selected（沿用 §14.10） | **consult 行**：`effortPayloadValue`（「—」/`none`/空 → 删键，零改）；**advisor 行**：`advisorEffortPayloadValue`（「—」/空 → `null` 删键；`none` **原样上送** = off 意图，写面归一——§15.4-2） |
| 聊天面板 picker（`model-picker.js:85` / `:123`） | 按钮文案「—」、列表**无 ✓**（列表本体 = 模型能力档，不新增项）；`ctx.selectedReasoning = ""`；**渲染点两处同判据**（见下注） | `""` 为假值 ⇒ 回合侧不 patch（`panel-turn-stages.mjs:98` `if (reasoning)`） |
| CLI `/config` 与 `/advisor` 菜单 | 不变（枚举显真相，§14 已定） | 不变 |

**picker 中性档渲染注（两处同判据）**：渲染点 = `model-picker.js:86-88`（`selectModel` 径）与 `:124-125`（`handleModelsMessage` 径）——两处现行式 `visible === "none" ? "off" : reasoningLabel(visible)`
对 `""` 落 `reasoningLabel("")` = `t("reasoning.none")`（`:105-107`）⇒ 中性档须补「—」支；`active` 判据（`classList.toggle("active", …)` 的 `visible !== "off"` 形）对 `""` 误真 ⇒ 中性档须判否（防半实现）。

**#330 收口判据**：picker 两处取值式不再出现「无注册默认 ⇒ 落 `levels[0]`」——`levels[0] === "none"` 的族（hy3 / doubao 六名）在**换模型 / 首推**两径都不再被静默关思考；`model-picker-fallback.test.mjs` 的负控判据随之改判（原「无 `effortDefault` ⇒ 仍落 `levels[0]`」→「无 `effortDefault` ⇒ 中性档（不写载荷）」）。

**§15.4-2 · off 形（按族统一 · 本档单源）**：「选 `none` = 关思考」的落盘形**按族取形**（逐族判据见下表——取首中者为是）——

| 族判据 | off 形 | 依据 |
|---|---|---|
| `spec.thinkApi === "effort"`（hy3 / doubao / qwen / kimi-k3 形） | `thinking = null` **+ 删 `reasoningEffort` 键** | 载荷层 §6.12 谓词首款要求 `thinking === null`（`{type:"disabled"}` 不开门 ⇒ 载荷层不发 `reasoning_effort:"none"`）；先例 = `thincoder-cli/src/tui/cmd-think.mjs:124-134` isEffortOnly 支（`:127` 落 `null` + 删档） |
| `spec.thinkEnabledValue ?? "enabled"` ≠ `"enabled"`（MiniMax 自定义开值族） | `thinking = { type: "disabled" }` | **实测**（off 路径 = `thinking:{type:"disabled"}` ✓ rc=0——`thincoder-core/model-specs.mjs:144-145` / `:169-171`；裁决落位——§16.12 项 1） |
| 其余（type 族默认，如 `deepseek-v4-flash` 形） | `thinking = { type: "disabled" }` | type 机制原生 off 形（MiniMax / mimo 实测路径） |

**两生产者**：① CLI `/advisor` 的 `applyThinkOff`（`thincoder-cli/src/tui/cmd-advisor.mjs:59-64`）——取形 = §16.2 单源（effort 族 ⇒ `null`；其余 ⇒ `{type:"disabled"}`——自定义开值族随 §15.4-2 表改判同归此行）；
补 effort 族支的原因 = 缺该支时对 effort 族落 `{type:"disabled"}` ⇒ 门不开（静默失效）。
② VSC 面板写面（`thincoder-vscode/src/extension/settings-panel-write.mjs`）同式取形（`specForModel(adv.model)`；`none` 档只在 select 已渲染时可达 ⇒ 模型名在 payload 内，spec 可解）。
**选档 / 「—」两态**：写档位 = 要思考 ⇒ **写 `reasoningEffort`（字面档值）** + 清 `thinking === null` 标记（与 CLI `cmd-think.mjs:119-120` 同式：`:119` 清标记 · `:120` 置档；`{type:"disabled"}` 不动——CLI 同式）；「—」= 不设档 ⇒ **不触** `thinking`；**删键只适用 off（`none`）与「—」两态**（档位态 = 写键——V-1 / V-6）。

**指针（§16）**：off 形的**生产者全表 / 单一实现源 / 「有效 off 路径」判据（回执条件化）/ 面板读面口径** = §16——本节三支形、谓词本体（`doc:PROVIDER.md:§6.12`）与两菜单形态零改。

**§15.4-3 · off 形须达载荷层（advisor 径 · #329 本体）**：载荷层 off 门（`thinking === null` ∧ `thinkApi === "effort"` ∧ 枚举含 `none` ∧ 无显式档 ∧ 非路由名）
**单源 = `doc:PROVIDER.md:§6.12`**。本节补两层：**① 生产者面**（§15.4-2——effort 族须落 `thinking: null`，否则门不可达）；**② 解析链前置条件**——advisor 的 provider 解析不得把 off 形抹掉：
`thincoder-core/advisor/run.mjs` 的 `resolveAdvisorProvider` 两分支对 `cfg.thinking === null` **保形**（原抹为 `undefined` ⇒ 门永不开）
+ 显式 off 时**清继承档**（渠道条目 / 主 provider 的 `reasoningEffort` 不得随行）。谓词本体**零改**。

**§15.4-4 · 读面（面板预选取值）**：`advisorEffortCurrent(adv)`（新 helper，`settings-state.js`）——`thinking` 为 off 形（`null` / `{type:"disabled"}`）⇒ 字面 `"none"`（**优先于**档位键——与 CLI 状态行 `cmd-advisor.mjs:46-49` 同序）；
否则 `advisor.reasoningEffort`；再缺席 ⇒ legacy `advisor.effort`（日值兜底）；三支结果均经 `effortSelection` 判成员（非成员 ⇒ ② 支注册默认 = E-7；**off 哨兵例外**——`"none"` 不经注册默认支、落中性档「—」（§16.5 ⓪ 支）；不落列表外值）。
legacy `effort` 保存即删（§15.4-2 侧写面）；快照面（`thincoder-vscode/src/extension/settings.mjs:204`）为 spread 透传 ⇒ 新旧两键与 `thinking` 均随行，端侧零改。
**指针（§16.5）**：off 哨兵避支（不经注册默认支、落中性档）= §16.5（共享规则 ⓪ 支——§15.4-1）。

**§15.4-5 · off 形跨保存存活**：写面种子循环（`settings-panel-write.mjs:121-125` 的 `if (v === null || Array.isArray(v)) continue`）丢 null 值键
⇒ `advisor.thinking = null` 在下一次任意面板保存即被静默删除（面板每次保存恒携 `advisor` 载荷——`settings-agent.js:118-127`；`payload.advisor !== undefined` 即入合并面 `:106`）。
**裁定：`advisor.thinking` 的 `null` 须穿透种子循环**——该键的 `null` = 有意义值（NF1 显式 off）；carve-out 只此一键，其余键维持「null = 清空、不复活」；
兼保手写 off 标记在 select 未渲染面（枚举空 / 模型未定）不被保存吞掉。判据 = V-4（连续两次保存后 off 形仍在盘）。

**§15.4-6 · #331 · VSC `advisor.effort` 键（死键 → 接线）**：面板写入键改 `advisor.reasoningEffort`（单源 = 核读取键 `thincoder-core/advisor/run.mjs:48/:64`，与 CLI `/advisor` 菜单同键）；off 形同 CLI（`thinking` 落 off 形 + 删 effort 键）；面板面细则 = `doc:docs/vsc/design/SETTINGS.md:§2.13`。

### 15.5 影响文件清单

| 文件 | 现状 | 预期增删 | 说明 |
|---|---|---|---|
| `thincoder-core/config-presets.mjs` | **49** | ±0（六处值改） | §15.3 六对（:30 `grok` / :31 `mistral` / :38 `openrouter` / :33 `hunyuan` / :37 `siliconflow` / :39 `groq`） |
| `thincoder-core/test/config-presets.test.mjs` | **77** | +~20 −3 | C-8 白名单 = 空名单 + 六对逐对 `≤ 生效基准` 断言（真行三对另断 = 行值） |
| `thincoder-core/advisor/run.mjs` | **190** | +~8 −4 | #329：两分支 off 保形 + 显式 off 清档（`:39` / `:52` 两处 + 注释） |
| `thincoder-cli/src/tui/cmd-advisor.mjs` | **270** | +~3 −1 | #329 生产者面：`applyThinkOff`（`:59-64`）补 effort 族支（`spec.thinkApi === "effort"` ⇒ `null`——与 `cmd-think.mjs:124-134` isEffortOnly 支同式）+ 注释 |
| `thincoder-cli/test/cmd-advisor.test.mjs` | **81** | +~10 | off 形族规则断言（effort 族 ⇒ `thinking === null`；type 族 ⇒ `{type:"disabled"}`；`effort_none` 归一 + 删键零回归）  |
| `thincoder-core/provider/core.mjs` | **491** | ±0（注释面） | :182 行注改述（保守抑制语义，§15.2）；谓词本体零改。**>300 拆分复核：已登记在位**（`SOFT_LINE_REGISTRY` · `thincoder-core/test/core-hygiene.test.mjs:96`）+ 登记面 = `thincoder-core/test/core-hygiene.test.mjs` 的 `SOFT_LINE_REGISTRY`；距 500 硬限余量 9 行（±0 不动结构）  |
| `thincoder-vscode/webview/settings-state.js` | **65** | +~18 −2 | 新增 `effortSelection`（规则单源）+ `advisorEffortCurrent`（读面兜底——§15.4-4）+ `advisorEffortPayloadValue`（「—」/空 ⇒ `null`；`none` 原样）；`effortSelectView` 改由 `effortSelection` 取 selected（成员判定显式化） |
| `thincoder-vscode/webview/model-picker.js` | **148** | +~8 −4 | `:85` / `:123` 两处归一改走 `effortSelection`；中性档渲染「—」+ 无 active（**两渲染点 `:86-88` / `:124-125` 同判据**——§15.4 三面映射） |
| `thincoder-vscode/webview/settings-agent.js` | **175** | +~6 −2 | advisor 初渲染 `effortSelectView(adv.model, advisorEffortCurrent(adv))`；载荷键改 `reasoningEffort`（`advisorEffortPayloadValue`；select 未渲染 ⇒ 不发字段——P2-4 的 advisor-effort 半） |
| `thincoder-vscode/src/extension/settings-panel-write.mjs` | **169** | +~20 −6 | #331：`effort` → `reasoningEffort`（含 off 归一：`none` ⇒ 族别 off 形（§15.4-2）+ 删 effort 键）+ 旧键清理（`delete merged.effort`）+ 种子循环 null carve-out（`advisor.thinking` 穿透——§15.4-5） |
| `thincoder-vscode/src/extension/settings.mjs` | **409** | **±0** | 快照面 `:204`（spread 透传）已载新旧两键与 `thinking`——读面归 webview（§15.4-4），本档零改 |
| `thincoder-vscode/test/model-picker-fallback.test.mjs` | **220** | +~10 −6 | T-17 负控改判（§15.4）+ 中性档两径断言（含 `:86-88` / `:124-125` 渲染与 active 判据）  |
| `thincoder-vscode/test/effort-select-views.test.mjs` | **106** | +~20 | 「已存值 ∉ 枚举」显式分支 + 面板「—」判据 + **读面**（新旧键优先级 / off 形 ⇒ 预选 `none`——V-5）  |
| `thincoder-vscode/test/config-io-panel.test.mjs`（#331 写面载体） | **116** | +~20 | `saveAgentSettingsFromPanel` 面：键位（`reasoningEffort` 在盘 ∧ 旧 `effort` 不在）+ off 形族映射（`hy3` 形 ⇒ `advisor.thinking === null`；`deepseek-v4-flash` 形 ⇒ `{type:"disabled"}`）+ **跨保存存活**（连续两次保存——V-4）  |
| `thincoder-core/test/advisor-provider-resolve.test.mjs`（本轮钉） | 0 | ~60 | #329：`resolveAdvisorProvider` 两分支（AD-1 / AD-2）+ 载荷面 stubFetch（AD-3 / AD-4；形态循 `provider-merge.test.mjs`）  |
| 设计档 | — | 设计轮 + 修正轮笔 | 本档 §15 · `PROVIDER.md` §6.9/§6.11/§6.12 · `docs/vsc/design/SETTINGS.md` §2.13 + §3 + U-S12 · `docs/vsc/design/WEBVIEW.md` §6 D-W41 / §8 U-W20（WEBVIEW 两行为设计轮已落、修正轮零改） |

**`settings.mjs` 拆分复核注**：组边界 = ① 快照族（`agentSettings` / `proxySettings` / `websearchSettings` / `fullStatus`）② 渠道路由族（provider 增删 / 代理旗标 / 连接测试）③ 密钥与 MCP 族（`saveProviderKey` / `deleteProviderKey` / MCP 三件）——① 拆出 = `src/extension/settings-snapshots.mjs`（拟新增）；
拆分计划 = 触发阈值 **750 行** 或该档下次结构改动（先到即拆）；**登记 = `doc:docs/vsc/design/SETTINGS.md:§3`**。

### 15.6 验收标准回指

| 判据 | 条目 | 设计落点 | 判定方式（机器核） |
|---|---|---|---|
| AC-1 | #241 | §15.2 | 表内 `noUsageStream` 标集 = 清单 14 名逐行在场（glm 7 / minimax 4 / gemini 3，逐名扫表比对）；`thincoder-core/provider/core.mjs:183` 单消费点在位 |
| AC-2 | #241 | §15.2 | 语义收正句 + 逐族等级词在场（文档面核；**不设测试锚**——散文锚禁） |
| AC-3 | #326 | §15.3 | 六对逐对 `PRESET.maxTokens ≤ specForModel(model).maxOutput` 全绿；真行三对另断 **= 行值**（64_000 / 32_000 / 32_000） |
| AC-4 | #326 | §15.3 | C-8 超限集 = **∅**（空名单绊网）；`NO_SPEC_ROW` 三名不动（P-3 零改绿） |
| AC-5 | #329 | §15.4-2 / §15.4-3 / `PROVIDER.md` §6.12 | **生产者面**：off 形族规则落地（effort 族 ⇒ `thinking === null` ∧ 无 `reasoningEffort` 键——CLI `/advisor` 与 VSC 面板写面同式）+ `resolveAdvisorProvider` off 形两分支断言（保形 + 清档）+ 载荷面：effort 族 advisor provider + off ⇒ 体携 `reasoning_effort:"none"`；显式档面照发 |
| AC-6 | #330 | §15.4 | `effortSelection` 三分支直驱（含负控：无注册默认 ⇒ `null`）；picker 两径（换模型 / 首推）不再落 `levels[0]`；面板「已存值 ∉ 枚举」⇒ selected「—」；两渲染径同源 |
| AC-7 | #331 | §15.4-2 / §15.4-5 / `docs/vsc/design/SETTINGS.md` §2.13 | 写面：面板保存后 `agent.advisor.reasoningEffort` 在盘、旧 `effort` 键不在盘；选 `none` ⇒ off 形**按族字面量**（effort 族（`hy3` 形）⇒ `advisor.thinking === null` ∧ 无 `reasoningEffort` 键；type 族默认（`deepseek-v4-flash` 形）⇒ `thinking.type === "disabled"` ∧ 无该键）；**连续两次保存后 off 形仍在盘**（种子循环 carve-out）；select 未渲染 ⇒ 载荷无该键（手写键存活） |
| AC-8 | #331 / #330 | §15.4-4 | 读面：`advisor.reasoningEffort` 在场 ⇒ 预选该档；缺席 + legacy `advisor.effort` 在场 ⇒ 按旧值日值预选、保存即删旧键；`thinking` 为 off 形 ⇒ 预选 `none`（优先于档位键）；三态渲染与载荷同源（`effortSelection` / `advisorEffortCurrent`） |

### 15.7 用例表（正常 / 边界 / 错误）

| id | 类 | 输入 | 期望输出与判据 |
|---|---|---|---|
| N-1 | 正常 | 逐行扫 `model-specs.mjs` 的 `noUsageStream` 标 | 集合 = §15.2 十四名（逐名在场；多余/缺失即红） |
| P-5 | 正常 | 六对预置逐条 | `≤ 生效基准` 全绿；`grok` 64_000 / `mistral` 32_000 / `openrouter` 32_000 三对等值行值 |
| P-6 | 错误 | 全预设超限集 | `deepEqual(over, [])`——任一预置超限即红（空名单绊网） |
| P-7 | 边界 | 兜底三名 | `specMatch(model).matched === false` 且 `specForModel(model).maxOutput === 32_000`（对齐基准可复算） |
| AD-1 | 正常 | `resolveAdvisorProvider`：`cfg.thinking = null` + 渠道条目带 `reasoningEffort` | 返回对象 `thinking === null` ∧ 无 `reasoningEffort` 键（保形 + 清档） |
| AD-2 | 边界 | 主 provider 兜底分支（无 `cfg.provider`）+ `cfg.thinking = null` | 同上（继承档被清） |
| AD-3 | 正常 | 载荷面：effort 族（`hy3` 形）+ off 形（`thinking:null` ∧ 无档） | 请求体携 `reasoning_effort:"none"`（D-14 门开） |
| AD-4 | 错误 | off 形 + 枚举不含 `none`（`kimi-k3` 形） | 无该字段（guard ④ 零变）+ 不抛错 |
| E-6 | 正常 | `effortSelection`：已存值 ∈ 枚举 | 取已存值 |
| E-7 | 边界 | 已存值 ∉ 枚举 ∧ 注册默认 ∈ 枚举（off 哨兵 `"none"` 除外——§16.5 ⓪ 支） | 取注册默认 |
| E-8 | 边界 | 已存值 ∉ 枚举 ∧ 无注册默认（hy3 / doubao 六名形） | `null`（中性档）——**不得**落 `levels[0]`（`"none"`） |
| E-9 | 回归 | picker 两径：`selectModel` / `handleModelsMessage` | 同判据（同源 helper）；中性档 ⇒ 按钮「—」+ 无 ✓ + 回合侧零 patch（两渲染点 `:86-88` / `:124-125` 同判据——§15.4 三面映射） |
| E-10 | 正常 | 面板存值 ∉ 枚举 ⇒ 渲染与载荷 | selected = 「—」；保存后载荷 = 删键（不写字面） |
| V-1 | 正常 | 面板选 advisor effort 档 `low` | 盘上 `advisor.reasoningEffort = "low"` ∧ 无 `effort` 键 |
| V-2 | 正常 | 面板选 `none`（关思考） | 族别字面量：effort 族（`hy3` 形）⇒ 盘上 `advisor.thinking === null` ∧ 无 `reasoningEffort` 键；type 族默认（`deepseek-v4-flash` 形）⇒ `advisor.thinking.type === "disabled"` ∧ 无该键 |
| V-3 | 边界 | advisor effort select 未渲染（枚举空）+ 盘上已有手写 `reasoningEffort` | 载荷无该键 ∧ 盘上手写值存活（P2-4 的 advisor-effort 半） |
| V-4 | 边界 | 盘上已有 off 形（`advisor.thinking = null`）+ 面板任意保存 ×2（如 guard 切换） | 每次保存后 off 形仍在盘（种子循环穿透——§15.4-5）；两保存间零报警、零意外清除 |
| V-5 | 边界 | 读面三态（注入 `advisor` 对象）：① 仅 legacy `effort`；② `reasoningEffort` 与 `effort` 并存；③ `thinking` off 形 + 档位键并存 | ① 预选旧值（保存后旧键删）；② 预选 `reasoningEffort`（新键优先）；③ 预选 `none`（off 形优先——§15.4-4） |
| V-6 | 边界 | 盘上 `advisor.thinking = null`（off 标记）+ 面板选档 `low`（两族别：effort 族（`hy3` 形）/ type 族默认（`deepseek-v4-flash` 形）） | `null` 标记清除（键删，不落 `null`）∧ 盘上 `advisor.reasoningEffort = "low"`（档位态 = 写键——§15.4-2） |

**用例号注**：本表 `AD-` 前缀 = advisor / provider-resolve 族用例号（避与 §5 判据号 `A-` 空间同号；`PROVIDER.md` §6.12 指针已同步）。

### 15.8 边界（本节不做）

- **不收窄 `noUsageStream`**（§15.2 裁定）；不动 gemini 行的惰性标（登记面）。
- **不为兜底三名建行**（无据；挂 #11 覆盖族）；不据同族类推填尺寸位。
- **不改载荷层 off 谓词本体**（`doc:PROVIDER.md:§6.12` 单源）；不给 payload 面加「off 意图」新字段。
- **不改 `resolveEnableThinking` 主机门控 / `tempRange` 裁剪 / 枚举越界抛错门**（§9.7 裁定沿用）。
- **不给聊天面板 picker 中性档加列表项**（列表 = 模型能力档；中性档 = 兜底渲染，§15.4）。
- **不改 CLI `/config` / `/think` / `/advisor` 菜单形态**（§14 已定面）。
- 无 off 路径的族（effort 型枚举不含 `none` / 服务端强制思考族）**仍无 off 路径**——回执条件化（不提供动作 / 不显示状态）判据与两菜单面落点 = `doc:MODEL-SPECS.md:§16.4`；本节面零改。

### 15.9 UI/交互决策（全落地，无 open）

- **聊天面板推理按钮**：中性档（不显式档）渲染「—」，无 active 态；列表本体与 ✓ 规则不变（✓ 仅在值 ∈ 列表且相等时亮）。
- **设置面板 advisor / consult 两 select**：规则单源化后渲染形不变（「—」恒首项、无预选枚举首项）。
- **面板 advisor effort 选择**：`—` = 不设档（删 effort 键）；`none` = 关思考（写 `thinking` off 形）；其余档 = 写 `reasoningEffort`。
- **CLI 面**：零 UI 变化。

无 `open` 项。

## 16. off 形族收尾

### 16.1 判定总纲

1. **规则面零改、实现面收敛**——§15.4-2 的族别形**不动**（唯一例外 = 自定义开值族行的 off 形裁决——§16.12 项 1）；本节补其**单一实现源**（四处手写 → 一叶档）与**判据**（「可宣称性」）。
2. **不宣称做不到的事**——「Thinking: OFF」是对**服务端状态**的断言：只有当本端写入的 off 形**能到达载荷层且服务端受之**时该断言成立；否则 **不提供该动作、不显示该状态**——不得静默降级为「显示一个档位」或「写一个不生效的标记」。
3. **副本 = 漂移源（实证）**——四处生产者中已有两处漂移（VSC 主模型面全族 `null` = #335 本体；CLI `/think` 自定义开值族支写 `undefined`——与该族 off 形不一致（§15.4-2 表））⇒ 单源化。

### 16.2 单源实现（#335 手段裁定 · 端引核 · 零副本）

**接线口径**：新建叶档 `thincoder-core/think-off.mjs`（零 import 纯函数；两端经 `@thincoder/core/think-off.mjs` 直引——`thincoder-core/package.json` 的 `exports: "./*"` 覆盖）。

| 函数 | 签名 | 语义 |
|---|---|---|
| `thinkOffShape(spec)` | `spec → null \| { type:"disabled" }` | **写面取形**——§15.4-2 判据的单一实现：`thinkApi === "effort"` ⇒ `null`；其余（含自定义开值族——其 off 形随 §15.4-2 表改判同归）⇒ `{ type:"disabled" }` |
| `thinkOffPath(spec)` | `spec → boolean` | **有效 off 路径**（判据本体 = §16.4）——**由 `thinkOffShape` 派生**：`null` 形只有 effort 族的载荷门据它补发 `reasoning_effort:"none"`（谓词单源 = `doc:PROVIDER.md:§6.12`）⇒ 仅 `thinkApi === "effort"` ∧ 枚举含 `none` ∧ `thinkAlwaysOn !== true` 成立；`{type:"disabled"}` 形 ⇒ `thinkAlwaysOn !== true` 成立 |

**四处生产者改写（逐处 · 语义保形——例外 = 第 2 行自定义族支：随 §15.4-2 表改判升为真 off）**：

| # | 位置 | 现形 | 改后 |
|---|---|---|---|
| 1 | `thincoder-cli/src/tui/cmd-advisor.mjs:62-72`（`applyThinkOff`） | 三支手写 | `cfg.thinking = thinkOffShape(spec)`；effort 支的 `delete cfg.reasoningEffort` **扩至三支**（§16.6-⑵） |
| 2 | `thincoder-cli/src/tui/cmd-think.mjs:124-141`（`applyThink` off 支） | effort 支 `null`；非 effort 支 `isCustomThink ? undefined : {type:"disabled"}` | `cur.thinking = thinkOffShape(spec)`——自定义族支由 `undefined` 改 `{type:"disabled"}`（§15.4-2 表改判后的该族 off 形；**行为变更**：`undefined` 不发字段（服务端默认 = 想），`{type:"disabled"}` 达载荷层 = 真 off——与 #335 同旨） |
| 3 | `thincoder-vscode/src/extension/reasoning-mode.mjs:22-24`（off 支） | **全族** `{ thinking:null, reasoningEffort:null }` | `{ thinking: thinkOffShape(spec), reasoningEffort: null }`——**#335 本体**：type 族（`deepseek-v4-flash` 形）off 落 `{type:"disabled"}` ⇒ 达载荷层（服务端默认不再「仍想」） |
| 4 | `thincoder-vscode/src/extension/settings-panel-write.mjs:63-68`（`advisorOffShape`） | 三支手写（与 ① 同规则副本） | 本地体删除 → `thinkOffShape(specForModel(model ?? ""))`（单源零副本） |

### 16.3 字段面：`thinkAlwaysOn`（服务端强制族可判 · 新机制位）

**事实**（`glm-5.3` 族 = 服务端恒思考：`thinking:{type:"disabled"}` 被拒）今日只住行注（`thincoder-core/model-specs.mjs:63-64` 与 `:68-73` 的「始终思考 / 服务端无关闭路径」句）——§16.4 的条件化回执需**机器可判**。

**裁定 = 新增布尔机制位 `thinkAlwaysOn`**（`true` = 服务端强制思考 / 无关闭路径）。落点 = `thincoder-core/model-specs.mjs` 三行 + 表头字段注（`:21` 邻位，与 `thinkApi` / `thinkEnabledValue` 同段）：

| 行 | 值 | 证据等级 |
|---|---|---|
| `glm-5.3` | `true` | **官方口径**（智谱 GLM-5.3 文档：thinking always-on、无 `disabled`） |
| `glm-5.3-flash` | `true` | **族沿用**（族据 = `glm-5.3` 行） |
| `glm-5.3-flashx` | `true` | **实测**（`thinking:{type:"disabled"}` → 400；裸请求默认开） |

行注保留现有句（`thincoder-core/test/model-specs.test.mjs` 的 `[flashx] F-5` 词锚不变），各补一句「该事实 = 机制位 `thinkAlwaysOn`（单源 = `doc:MODEL-SPECS.md:§16.3`）」**并携逐行证据等级词**——
`glm-5.3` = **官方口径** · `glm-5.3-flash` = **族沿用**（族据 = `glm-5.3` 行）· `glm-5.3-flashx` = **实测**（与本档证据纪律齐：非实测类须逐条写进行注）。**未取证行一律不声明**（D-11）。
**`glm-5.2` / `glm-5` 的 `thinkAlwaysOn`——取证**：`{type:"disabled"}` 受理且生效（载荷 200 · `reasoning_content` 缺席 ⇒ off 路径存在——族形态与 `glm-5.3` 族相反）⇒ `thinkAlwaysOn` **维持不标**、判据默认侧（可宣称 OFF）成立。

### 16.4 判据：`thinkOffPath` —— 「何时可宣称 OFF」（#334 · 定形）

**判据（本档单源）**：**OFF 可宣称 ⟺ 该族有有效 off 路径**（`thinkOffPath(spec) === true`）：

| 族 | 判据 | off 形 | 有效？ |
|---|---|---|---|
| effort 族（`thinkApi === "effort"`） | 枚举含 `none` | `thinking:null` + 删档 | 含 `none`（hy3 / doubao / qwen3.7-flash 等）⇒ **有效**（载荷门补发 `reasoning_effort:"none"`）；无枚举 / 无 `none`（`kimi-k3` · `k3-256k` · `k3` · `kimi-for-coding` · `qwen3.7-max` · `qwen3.8-max` · `qwen3.7-plus` · `qwen3.5-27b`）⇒ **无效**（形不发任何字段） |
| 服务端强制族（`thinkAlwaysOn === true`） | — | `{type:"disabled"}` | **无效**（服务端拒 / 恒思考） |
| 自定义开值族（`MiniMax-M3` / `minimax-m3`） | — | `{type:"disabled"}` | **有效**（达载荷层——实测路径：off 路径 = `thinking:{type:"disabled"}` ✓ rc=0）；off 形随 §15.4-2 表改判（裁决 = §16.12 项 1） |
| 其余（`type` 族默认，如 `deepseek-v4-flash` / `mimo-v2.5`；`thinkApi` 未声明行） | 未标 `thinkAlwaysOn` | `{type:"disabled"}` | **有效**（达载荷层；MiniMax / mimo 实测路径） |

**两菜单面落点（CLI）**：

| 面 | 落点 | 行为 |
|---|---|---|
| `/think` 快速径 | `thincoder-cli/src/tui/cmd-think.mjs:20-26` | `offPath === false` ⇒ **拒绝** `/think off`（不写盘）+ 理由行；`/think on` 与档位面零改（`on` = 恢复径：清残留标记 / 重写 ON 形） |
| `/think` 环内 | 同档 `:44-90` | 菜单头与回执**条件化**（无有效 off 路径 ⇒ 恒报 `ON`——残留 off 标记不再误报 `OFF`）；**Thinking 开关项不渲染**（`:55` 现行 `!isEffortOnly` 门**再合取 `thinkOffPath`**——生效面 = 非 effort 且无有效 off 路径族） |
| `/advisor` 状态行 | `thincoder-cli/src/tui/cmd-advisor.mjs:44-51`（`advisorStatus`）+ 调用点 `:156` / `:158` / `:171` | `offPath === false` ⇒ **不报 off**（残留标记按「未设档」渲染：有档报 `on (<档>)`，无档报 `on`） |
| `/advisor` 思考菜单 | 同档 `buildThinkingEntries`（`:248-278`） | **Disabled 项**加门（无有效 off 路径不渲染）；**Enabled 项保留**（残留 `{type:"disabled"}` 的恢复径）；档位面零改（`effort_none` 本由枚举驱动） |
| `/advisor` 选档支 | 同档 `:139-143` | **#346-①**：选档 = 要思考 ⇒ 先清 `cfg.thinking === null` 标记（对齐 `thincoder-cli/src/tui/cmd-think.mjs:119-120` 先例 / §15.4-2 末句）；`{type:"disabled"}` 不动（同先例；**残余登记 = §16.6-⑸**——type 族 off→选档 后该标记保持） |

**拒绝文案（定形）**：`No off path for this model — thinking cannot be turned off here (use /think effort <level>)`（单行 · `C.error` 通道，循 `thincoder-cli/src/tui/cmd-think.mjs:21` 的 autoThink 拒绝先例）。

**VSC off 入口面零改**：聊天面板 picker 与设置面板 select 的 off 入口**本由枚举驱动**（`off` / `none` 项只在 `reasoning` / 档枚举含它时存在）⇒ 无有效 off 路径的族本就不渲染 off 入口；**读面**（off 哨兵避支——§16.5）另落。

### 16.5 读面口径（面板预选 —— #346-②）

**裁定**：**off 哨兵值不得降级为档位**——本条并入**共享规则 `effortSelection`**（§15.4-1 ⓪ 支）⇒ 两消费面同源生效：`effortSelectView`（`thincoder-vscode/webview/settings-state.js:60-65`）对 `current === "none"` ∧ `levels` 不含 `"none"` ⇒ 预选 **`—`（中性档）**，**不经注册默认支**。效果：

- 面板显示「—」= 如实（off 态下盘上无档位键——off 动作按 §16.6-⑵ 清档）；**不再显示用户从未选的档位**。
- 无关保存落「—」支（`advisorEffortPayloadValue("—")` ⇒ `null` ⇒ 写面删档键、**不触** `thinking`）⇒ off 形跨保存存活（§15.4-5 carve-out 同径）、零误写。
- 含 `none` 的族不受影响（`"none" ∈ levels` ⇒ 照旧预选 `none` = off，语义不变）。
- **面板能力边界（如实登记）**：type 族的 off 状态在面板**不可视 / 不可选**（档表无 off 项）；**不新增 off 选项**（列表 = 模型能力档，增设 = §15.9 UI 形态变更 + 能力面，须另批裁定）。
- consult 行同径（同一 `effortSelectView`）：手写 `effort: "none"` 在无 `none` 档的模型上亦落「—」（写面结果不变——`effortPayloadValue("none")` 本就归 `null`）。
- **聊天面板 picker 同源（本节并入）**：`selectedReasoning === "none"` × 模型枚举无 `none`（`selectModel` / `handleModelsMessage` 两径）⇒ 落中性档（按钮「—」/ 无 ✓ / `""` ⇒ 回合侧零 patch）——不落注册默认档（同判据 = §15.4-1 ⓪ 支；用例 W-10）。

### 16.6 残余补口 + 冗余 import（#346）

⑴ **`reasoning:["enabled"]` 族用例补格（#346-③）**：无 effort 枚举的思考开关族（`reasoning` = `["enabled"]`——
`thincoder-vscode/src/extension/provider-probe-window.mjs:66` 的 `spec.reasoningEffortEnum || (spec.thinking ? ["enabled"] : [])` 形态）在 §15.4 归一改判后：
① 支（已存值）与 ② 支（注册默认）均不命中该单元素枚举 ⇒ 落**中性档 `""`**（按钮「—」/ 无 active / 回合侧零 patch）。**零实现改动**，补用例钉（§16.9 用例 W-5）。

⑵ **off 动作清档（生产者完整性）**：§15.4-2 末句「删键只适用 off（`none`）与「—」两态」——CLI `/advisor` 的 `applyThinkOff` 现只在 **effort 支**清 `reasoningEffort`
（`thincoder-cli/src/tui/cmd-advisor.mjs:65-68`），自定义 / type 支不清 ⇒ 「off 标记 + 档位」同盘（载荷层 `thinking` 关值与 `reasoning_effort:<档>` 矛盾同发——F2 违约族）。
**裁定 = 三支同清**（`delete cfg.reasoningEffort` 提至支外）；VSC 面板写面已是此形（`thincoder-vscode/src/extension/settings-panel-write.mjs:154-165`）⇒ 本项 = CLI 侧对齐（conformance 面，非新语义）。

⑶ **选档清标记（#346-①）**：见 §16.4 表末行（`/advisor` 选档支清 `thinking === null`）——与 `thincoder-cli/src/tui/cmd-think.mjs:119-120` 先例 / §15.4-2 末句同式（原设计只点名 off 生产者，选档生产者面未点名 ⇒ 本条 = **生产者范围补全**）。

⑷ **冗余 import（#346-④ · pre-existing）**：`thincoder-core/advisor/run.mjs:12` 的 `advisorIncompleteMarker` 与同档 `:19` 的 re-export 重复（函数体零使用——`:171` 只消费 `estimateTokens`）⇒ 该行只留 `estimateTokens`。零行为变更。

⑸ **type 族 off→选档 残余（登记 · 与 ⑵ 方向差并案）**：⑵ 闭「off 动作 ⇒ 清档位键」方向；「选档动作 ⇒ 清 off 标记」方向只覆盖 `thinking === null`（§16.4 表末行——同 `thincoder-cli/src/tui/cmd-think.mjs:111` 注释「仅清 null」先例）⇒ type 族「off（`{type:"disabled"}`）⇒ 选档」后标记保持——同盘「off 标记 + 档位」（= ⑵ 已定性的 F2 违约族）。
**裁定 = 登记（不闭）**：闭该方向 = 改既有「仅清 null」语义（越本节条目）。**复评条件** = ① 该组合的服务端实测后果（400 / 静默忽略）读数到位；或 ② 与 `thincoder-cli/src/cli/setup-wizard.mjs:70` 在册项（`thinking:null` 落盘口径统一）并案处置时随拍闭。

### 16.7 受影响文件清单

| 文件 | 现状 | 预期增删 | 说明 |
|---|---|---|---|
| `thincoder-core/think-off.mjs` | 0 | ~40 | §16.2 单源两函数（叶档 · 零 import；≤300 免登记） |
| `thincoder-core/model-specs.mjs` | **370**（2026-10-23 `wc -l`） | +~6 | §16.3 三行 `thinkAlwaysOn` + 表头字段注 + 行注句；**>300 已登记**（`thincoder-core/test/core-hygiene.test.mjs:96`）+ 拆分计划（§13.6）——本次 = 字段面补充（拆点未触发——判定见下注）  |
| `thincoder-core/advisor/run.mjs` | 200 | ±0（−1 标识符） | §16.6-⑷ |
| `thincoder-cli/src/tui/cmd-think.mjs` | 151 | +~14 −3 | §16.2-2 + §16.4（拒绝 / 开关项门 / 头与回执条件化） |
| `thincoder-cli/src/tui/cmd-advisor.mjs` | 278 | +~16 −6 | §16.2-1 + §16.4（状态行条件化 / Disabled 门）+ §16.6-⑵⑶ |
| `thincoder-cli/test/cmd-think.test.mjs` | 200 | +~35 | W-1..W-4  |
| `thincoder-cli/test/cmd-advisor.test.mjs` | 110 | +~30 | W-6..W-8  |
| `thincoder-core/test/think-off.test.mjs` | 0 | ~55 | T-1..T-4  |
| `thincoder-vscode/src/extension/reasoning-mode.mjs` | 34 | +~4 −2 | §16.2-3（#335 本体） |
| `thincoder-vscode/src/extension/settings-panel-write.mjs` | 200 | +~2 −6 | §16.2-4（本地形体删） |
| `thincoder-vscode/webview/settings-state.js` | 95 | +~5 −1 | §16.5（off 哨兵 ⓪ 支并入共享规则——§15.4-1） |
| `thincoder-vscode/test/reasoning-mode.test.mjs` | 0 | ~45 | R-1..R-3（该面首测——无既有单元测试档）  |
| `thincoder-vscode/test/model-picker-fallback.test.mjs` | 279 | +~20 | W-5 / W-10（off 哨兵 × picker 两径）  |
| `thincoder-vscode/test/effort-select-views.test.mjs` | 172 | +~12 | W-9  |
| 设计档 | — | 本节 + §10.1 订正 + §15.4-1 / §15.4-2 / §15.4-4 / §15.8 档面（指针 / 收正）+ `doc:PROVIDER.md:§6.9` / `§6.12` / `§6.19` + `doc:docs/vsc/design/SETTINGS.md:§2.13` 指针 | — |

**`model-specs.mjs` 消解窗口判定（§13.6 口径——本次改动 ∉「实质改动」）**：本节改动 = 字段面补充（三行机制位 + 表头字段注 + 行注句；零结构 / 零表块位移 / 零导出面变更）⇒ **∉ §13.6「实质改动」**——拆点（`MODEL_SPECS` 表块外提）未触发；改后 ~354（≤500 软线）。

### 16.8 验收标准回指

| 判据 | 条目 | 设计落点 | 判定方式（机器核） |
|---|---|---|---|
| AC-1 | #334 | §16.3 / §16.4 | `thinkAlwaysOn` 三行在场（`specForModel` 逐行断 `true`——防空扫）；`thinkOffPath` 逐族采样：`hy3` / `qwen3.7-flash` / `deepseek-v4-flash` / `mimo-v2.5` / `MiniMax-M3` / `minimax-m3` ⇒ `true`；`kimi-k3` / `k3-256k` / `qwen3.8-max` / `qwen3.7-plus` / `glm-5.3` / `glm-5.3-flash` / `glm-5.3-flashx` ⇒ `false` |
| AC-2 | #334 | §16.4 两菜单面 | `/think off`（`kimi-k3` · `glm-5.3-flashx`）⇒ 零写盘 + 拒绝行在场；`/think` 环（`kimi-k3` + 残留 `thinking:null`）⇒ 头与回执不含 `OFF`；`/think` 环（`glm-5.3-flashx` + 残留 `{type:"disabled"}`）⇒ **无 Thinking 开关项**（`:55` 门生效面）∧ 头报 `ON`；`/advisor`（`glm-5.3-flashx`）⇒ 无 Disabled 项 ∧ 状态行不报 off |
| AC-3 | #335 | §16.2（第 3 / 4 行） | `resolveReasoningMode("off","deepseek-v4-flash",…)` ⇒ `{ thinking:{type:"disabled"}, reasoningEffort:null }`；`hy3` ⇒ `{ thinking:null, reasoningEffort:null }`；`minimax-m3` ⇒ `{ thinking:{type:"disabled"}, reasoningEffort:null }`（自定义族 off 形随 §15.4-2 表改判）；`advisorOffShape` 委派核单源（本地无形体） |
| AC-4 | #346-①/② | §16.4 表末行 / §16.5 / §16.6-⑵ | 选档清标记（`thinking` 键不在 cfg ∧ 档在位）；`effortSelection` off 哨兵（`"none"`）× 无 `none` 档 ⇒ 中性档 `null`（不经注册默认支——§15.4-1 ⓪ 支）；`effortSelectView` ⇒ `selected === "—"`；picker 两径 ⇒ 按钮「—」/ 零 patch；`applyThinkOff` 三支皆清档 |
| AC-5 | #346-③/④ | §16.6-⑴ / ⑷ | `reasoning:["enabled"]` 族 ⇒ 按钮「—」/ `""` / 无 active / 零 patch ∧ 列表仍渲染该单档；`thincoder-core/advisor/run.mjs:12` 行不含 `advisorIncompleteMarker` ∧ `:19` re-export 在 |

### 16.9 用例表（正常 / 边界 / 错误）

**用例号注**：`T-` = 核谓词 / 字段面 · `W-` = CLI 与面板面 · `R-` = VSC reasoning-mode 面（`R-` 前缀避与本档 §5 判据号 `A-` / §14.8 号 `E-` / §15.7 号 `V-` 同空间）。

| id | 类 | 输入 / 动作 | 期望输出与判据 |
|---|---|---|---|
| T-1 | 正常 | `thinkOffPath(specForModel(m))`：`hy3` / `qwen3.7-flash` / `deepseek-v4-flash` / `mimo-v2.5` | `true`（有效 off 路径） |
| T-2 | 边界 | 同上：`kimi-k3` / `k3-256k` / `qwen3.8-max` / `qwen3.7-plus`（无枚举） | `false`（枚举无 `none` / 无枚举） |
| T-3 | 边界 | 同上：`glm-5.3` / `glm-5.3-flash` / `glm-5.3-flashx` | `false` ∧ 三行 `thinkAlwaysOn === true`（在场，防空扫） |
| T-4 | 边界 | 同上：`MiniMax-M3` / `minimax-m3` | `true`（`{type:"disabled"}` 达载荷层——§16.4 表第 3 行） |
| W-1 | 错误 | `/think off`（`kimi-k3`） | 拒绝行 = §16.4 文案；`provider.thinking` / `reasoningEffort` **零改**（不写盘） |
| W-2 | 错误 | `/think off`（`glm-5.3-flashx`） | 同上（服务端强制族同拒） |
| W-3 | 边界 | `/think` 环两例：① `kimi-k3` + 残留 `thinking:null`；② `glm-5.3-flashx` + 残留 `{type:"disabled"}` | ① 头与回执报 `Thinking: ON`（不误报 OFF——`offPath === false` ⇒ 恒报 `ON`）；② **无 Thinking 开关项**（`:55` 新合门生效面——现行门对非 effort 族本会渲染）；两例档位项照旧 |
| W-4 | 正常 | `/think on`（`glm-5.3-flashx`，残留 `{type:"disabled"}`） | 写 ON 形覆盖（恢复径可达）；回执 `Thinking: ON` |
| W-5 | 回归 | 聊天面板 `reasoning: ["enabled"]` 族（直驱 + 真点击流） | 归一落 `""`（按钮「—」/ 无 active / 零 patch）；列表仍渲染该单档（不空列表） |
| W-6 | 边界 | `/advisor`（`glm-5.3-flashx`）思考菜单 | **无 Disabled 项**；Enabled 项在场；档位三行在场 |
| W-7 | 边界 | `/advisor` 状态行：`kimi-k3` + 残留 `thinking:null`；`glm-5.3-flashx` + 残留 `{type:"disabled"}` | 两例均**不报 off**（无档 ⇒ `on`） |
| W-8 | 正常 | `/advisor`（`qwen3.8-flash`）：先 `think_off`（`thinking:null`）⇒ 再 `effort_low`；反向用例 = type 族（`deepseek-v4-flash`）`think_off` 且预置 `reasoningEffort` | 选档后 `thinking` 键**不在** cfg ∧ `reasoningEffort = "low"`（#346-①）；反向：off 后 `reasoningEffort` 键清出（§16.6-⑵） |
| W-9 | 边界 | `effortSelectView`：off 哨兵 × 枚举无 `none` ∧ 有注册默认 | `selected = "—"`（**不得**落注册默认）；枚举含 `none` ⇒ 照旧预选 `none` |
| W-10 | 边界 | `effortSelection` / 聊天面板 picker：off 哨兵（`"none"`）× 枚举无 `none` ∧ 有注册默认（两径：换模型 / 首推） | 落中性档（`null`；picker ⇒ 按钮「—」/ 无 ✓ / `""` 零 patch）——**不得**落注册默认档（同判据 = §15.4-1 ⓪ 支） |
| R-1 | 正常 | `resolveReasoningMode("off", "deepseek-v4-flash", specForModel)` | `{ thinking: { type:"disabled" }, reasoningEffort: null }`（#335 本体） |
| R-2 | 边界 | 同上：`hy3`；`minimax-m3` | `hy3` ⇒ `{ thinking: null, reasoningEffort: null }`；`minimax-m3` ⇒ `{ thinking: { type:"disabled" }, reasoningEffort: null }`（族别形 = §15.4-2 表） |
| R-3 | 回归 | `resolveReasoningMode("enabled" / 档位值, …)` | 既有两支逐字零变 |

### 16.10 边界（本节不做）

- **§15.4-2 表的唯一改动 = 自定义开值族行**（裁决 · §16.12 项 1）：off 形由 `null` 改 `{ type: "disabled" }`——该行依据与规格表实测（`MiniMax-M3` / `minimax-m3`：off 路径 = `thinking:{type:"disabled"}` ✓ rc=0）均指此形；表其余两行零改。
- **不改载荷层**：off 门谓词本体（`doc:PROVIDER.md:§6.12`）· `resolveEnableThinking` · 枚举越界抛错门零改。
- **不给面板 select 增设 off 选项**（§16.5 能力边界）；不动聊天面板 picker 的列表本体与 ✓ 规则。
- **不清理既存失配态**：修复前写入的「强制族 + `{type:"disabled"}`」标记会照发（服务端 400）——本节只保证**不再产生**新失配（入口已关），不做自愈扫描。
- **不动 `/think effort none` 的归一**（`thincoder-cli/src/tui/cmd-think.mjs:104`）：其可达性由枚举门保证（`none` 只在枚举含它时渲染）；**复评条件** = 出现「`thinkAlwaysOn` ∧ 枚举含 `none`」的行时，该归一须加 `thinkOffPath` 门；**同拍复评 `thinkOffPath` 谓词本体**（§16.2——effort 支的 `thinkAlwaysOn !== true` 合取须随该行逐款复核）。
- 不动 `thincoder-cli/src/cli/setup-wizard.mjs:70` 已登记的「`thinking:null` 落盘差异口径统一」（父侧在册项，另一面）。
- 需求档零改（主 agent 笔）。

### 16.11 UI / 交互决策（全落地，无 `open`）

| 面 | 决策 |
|---|---|
| CLI `/think` | 无有效 off 路径：**Thinking 开关项不渲染** + 头与回执恒报 `ON` + `/think off` 拒绝（理由行）——`on` 侧与档位面零改 |
| CLI `/advisor` | 无有效 off 路径：**Disabled 项不渲染**（Enabled 保留 = 残留标记恢复径）+ 状态行不报 off |
| VSC 设置面板 | 读面：off 形在无 `none` 档的族落「—」（不落档位）；**不新增 off 选项** |
| VSC 聊天面板 | off 入口零改（本由 `reasoning` 数组驱动）；**读面**：off 哨兵值不经注册默认支、落中性档「—」（§16.5 · §15.4-1 ⓪ 支） |

无 `open` 项。

### 16.12 关键决策

**关键决策**：

1. **#335 = 端引核（零副本）**。
2. **`thinkAlwaysOn` 机制位**。
3. **回执条件化 = 动作面**（不提供不可达的 off 动作）。
4. **读面落「—」而非新增 off 项**（§16.5）。
5. **判据由 `thinkOffShape` 派生**。

**已裁项**：

1. **§15.4-2 自定义开值族行与实测相抵**（`MiniMax-M3` / `minimax-m3`）——**已裁 · 落位**：该行依据「type 机制原生 off 形」与规格表实测
（`thincoder-core/model-specs.mjs:144-145` / `:169-171`：off 路径 = `thinking:{type:"disabled"}` ✓ rc=0）均指 `{type:"disabled"}` ⇒ 自定义开值族 off 形改 `{ type: "disabled" }`（off 可达）。
连带面（同变）= §15.4-2 表 · §16.2 派生与生产者第 2 行 · §16.4 表第 3 行 · §16.8 AC-1 / AC-3 · §16.9 T-4 / R-2。
2. **`glm-5.2` / `glm-5` 的 `thinkAlwaysOn`——取证**：渠道校验级读数 = `{type:"disabled"}` **受理且生效**（载荷 200 · `reasoning_content` 缺席——off 路径存在，族形态与 `glm-5.3` 族相反）⇒ **维持不标**（D-11）· 判据默认侧（可宣称 OFF）成立。

## 17. 模型名匹配 · 末段唯一

> **本节 = 实施目标形**（目标代码 + 行为变更表 + 用例）；规则单源 = `PROVIDER.md` §6.9（含**逐面算子表**：静态表 = 段内前缀、`modelContext` / 列表 = 末段相等），本节不复述理由。
> **同步义务**：规则变更同批改 §6.9 与本节；**判据** = §17.6 的判别用例（U-6 / U-7 / U-8）把两处钉在同一行为上——任一处单改 ⇒ 用例红。

**先例（closest-precedent）**：对位 = `PROVIDER.md` §6.9（规格表与能力位 · 既有查表机制）。**对齐** = 同一函数 `lookupSpec` 单点、单次扫描、零新机制、零导出面变更；**偏离** = 归一从「完整名先扫 + 末段兜底」收为「末段唯一」（理由 = 用户 2026-10-23 17:34 裁定 + 旧法误命中面 §17.1）。

**survey-evidence**：查过 `PROJECT-MANIFEST.json` 的 `index.publicRepos`（实读 = `[]`——本仓未声明独立公共源文档仓）、需求 §4.6 / §4.8 与设计 `PROVIDER.md` §6.9、
三载体实现坐标（核 `thincoder-core/model-specs.mjs:270-284` ∥ VSC `thincoder-vscode/src/specs.mjs:44-59` ∥ 服务器 `thincoder-server/public/model-specs-snapshot.mjs:97`）；
**none relevant**（无外部源文档可对位）。

### 17.1 规则（用户 2026-10-23 17:34 裁定）

模型 ID 按 `/` 拆开，**只拿最后一段**查表；前缀段不参与匹配，**不再先扫完整名**。
单段名末段 = 自身（零回归）；段内仍按既有前缀匹配（`glm-5.3-flashx` 命中 `glm-5.3` 行）；末段为空（`foo/`）⇒ 未命中。
**归一只有一套（末段 + 小写）；算子按面各不相同**（单源表 = `PROVIDER.md` §6.9）：`MODEL_SPECS` 静态表 = 段内**前缀**（`glm-5.3-flashx` 命中 `glm-5.3` 行）；`providers[].modelContext` 用户键 ∥ `/v1/models` 返回 id = 末段**相等**（键 `glm-5.3` × 模型 `glm-5.3-flashx` ⇒ **不命中**）。
后两面的应用与歧义处置 = `PROVIDER.md` §6.15。

**行为变更（全部是旧法的误命中面，认账）**：

| 名 | 旧形 | 新形 | 用例 |
|---|---|---|---|
| `glm-5.3/zzz` | 完整名直扫 ⇒ 命中 `glm-5.3` 行（`matched === true`） | 末段 `zzz` ⇒ `false` + `DEFAULT_SPEC` + 告警 | U-6（判别性） |
| `glm-5.3/` | 完整名直扫 ⇒ 命中（`"glm-5.3/".startsWith("glm-5.3")`） | 末段空 ⇒ `false` | U-7 |
| `/glm-5.3` | 核 miss ∥ VSC 命中（守卫端差） | 末段 `glm-5.3` ⇒ 两端同判命中 | U-8 |

**`kimi/kimi-k3` 行退役**：末段 `kimi-k3` 已达同值行（`thincoder-core/model-specs.mjs:44` 与 `:46` 逐值相同）；含 `/` 的键永远不可能是末段 ⇒ 该行不可达，留行即死行（D8）。发送路径不含该行的依赖。

### 17.2 机制改法逐字（目标形 · 实施轮照此落笔）

**核侧 = `thincoder-core/model-specs.mjs`** `lookupSpec`（`:270-284`）——删「完整名直扫」，只扫末段：

```js
function lookupSpec(model) {
  const m = (typeof model === "string" ? model : "").toLowerCase()
  const slash = m.lastIndexOf("/")
  const bare = slash >= 0 ? m.slice(slash + 1) : m   // 末段唯一；单段名 = 自身
  if (!bare) return null                             // 末段为空 ⇒ 未命中（空串不做前缀匹配）
  for (const [prefix, spec] of SORTED_SPECS) {
    if (bare.startsWith(prefix.toLowerCase())) return spec
  }
  return null
}
```

档头注（`:245-259` 现文）改为末段唯一口径；`kimi/kimi-k3` 行与 `:45` 的 alias 说明一并删除（§17.1）。
`SORTED_SPECS` 降序前缀排序、`warnUnknownModel` 文案、`specMatch` 返回形状、`DEFAULT_SPEC` 回落语义零改。

**VSC 侧 = `thincoder-vscode/src/specs.mjs:44-59` `effortDefaultFor`**：同形——`const seg = slash >= 0 ? m.slice(slash + 1) : m`，`if (!seg) return undefined`，再 `scan(seg)`；删「先扫完整名」一跳与 `:55` 的「按裸模型段重试」注。

**端差消除**：原「核 `slash > 0` ∥ VSC `slash >= 0`」认账行随本规则退役——两端同为 `slash >= 0` + 空段守卫，`/glm-5.3` 两端同判命中（U-8 / V-4）。

**第三载体 = `thincoder-server/public/model-specs-snapshot.mjs:97` `specForDisplay`**（父侧读）：同尺随正；父侧原记「射程外披露」，本批登记为同机制载体。

### 17.3 受影响文件清单

| 文件 | 现状 | 预期增删 | 说明 |
|---|---|---|---|
| `thincoder-core/model-specs.mjs` | **370**（2026-10-23 `wc -l`） | 本机制 **-10**（`lookupSpec` 去完整名直扫 ~-8 · alias 行 + 说明 -2）；同批 §6.15 链改动另计 | §17.2 核侧目标形；零结构 / 零导出面 / 零表行（alias 行除外） |
| `thincoder-vscode/src/specs.mjs` | **102**（同上读数） | ±0（一 token + 注改） | §17.2 VSC 侧目标形；零结构 / 零导出面 |
| `thincoder-server/public/model-specs-snapshot.mjs` | **106**（同上读数） | ±0（一 token + 注改） | 第三载体（`:97` `specForDisplay`）；等价性判据 = §17.4 末行 / U-10 |
| `docs/core/design/PROVIDER.md` | **886**（同上读数） | 本批已落（§6.9 规则 + §6.15 换代） | 单源 = §6.9；§6.15 引用不重述 |
| `docs/core/design/MODEL-SPECS.md` | —（本档自指） | +本节 | 本节 |
| 单元测试档（拟新增，收口删） | 0 | +~90 | §17.6 U-1..U-10 ∥ V-1..V-5 |

**零触面**：规格表行值（`kimi/kimi-k3` 退役除外）· `SORTED_SPECS` 排序 · 告警文案（`warnUnknownModel`）· 回落语义（`DEFAULT_SPEC` / `specMatch` 返回形状）· 服务器侧外标形（§17.7）。

### 17.4 验收标准回指（与需求档 §4.6 同源）

| 判据 | 设计落点 | 判定方式（机器核） |
|---|---|---|
| R22-① | §17.2 | `specMatch("qwen/ZHIPU/GLM-5.3")` ⇒ `matched === true` ∧ spec = `glm-5.3` 行（context 1_000_000 / maxOutput 128_000） |
| R22-② | §17.2 | `specMatch("qwen/ZHIPU/GLM-5.3-FlashX")` ⇒ `matched === true` ∧ spec = `glm-5.3-flashx` 行（context 1_000_000 / maxOutput 131_072） |
| R22-③ | §17.2 | 大小写变体 `Qwen/ZHIPU/GLM-5.3` 与 ① 同判（双侧 `.toLowerCase()` 口径零改） |
| R22-④ | §17.2 | 既有面零回归：单段 `ZHIPU/GLM-5.3` · 裸名 `glm-5.3-flash` · 单段对照 `qwen/qwen3.7-max` · `deepseek/deepseek-flash` 逐名与批前同判（本行不含 §17.1 记的三类行为变更） |
| R22 判别性（17:34 裁定新增） | §17.2 | `specMatch("glm-5.3/zzz")` ⇒ `matched === false` ∧ spec = `DEFAULT_SPEC`——旧实现会误命中 `glm-5.3` 行 |
| R22-⑤ | §17.2 | `zzz/unknown-x` ⇒ `matched === false` ∧ spec = `DEFAULT_SPEC`（128_000 / 32_000）∧ 告警一次 |
| R22 同判（VSC 载体） | §17.2 VSC 段 | V-1..V-4（§17.6） |
| N13 | §17.2 | 形态不变（纯函数；单次末段扫描，无逐段迭代）——U-6 钉「不回扫中间段」 |
| N14 | §17.2 | 过匹配防回归：未知名仍兜底（⑤）+ 既有命中面逐一回归（④）+ 三类误命中面转负（§17.1） |
| 第三载体等价 | §17.2 第三载体 | **在册名**（U-1..U-4 · U-8 · U-9 的命中名）`specForDisplay(name)` 与核 `specForModel(name)` 逐名 `context` / `maxOutput` 相等；**未收录名**（U-5 `zzz/unknown-x` · U-6 `glm-5.3/zzz` · U-7 `glm-5.3/`）按快照自身契约 = `null`（零兜底），与核 `DEFAULT_SPEC` **不比**——展示面零兜底 ∥ 执行面有兜底，两个契约不可比。或快照由核表生成 + `diff` 机检（比生成结果与入仓快照） |

### 17.5 裁定（VSC 端差表 · 同判随正）

裁定 = **同判随正**：同一机制的第二载体（VSC `effortDefaultFor`，注释自述「与核 `lookupSpec` 同法」）按同一把尺子落地。
本规则同时**消除**原守卫端差（核 `slash > 0` ∥ VSC `slash >= 0`）：两端统一为 `slash >= 0` + 空段守卫，`/glm-5.3` 同判命中。
需求档 §4.6 已由主 agent 同拍收正（末段唯一 + `glm-5.3/zzz ⇒ false`）。

### 17.6 用例表（14 条 · 落点 = 单元测试档（拟新增））

| id | 类 | 输入 | 期望输出与判据 |
|---|---|---|---|
| U-1 | 正常 | `qwen/ZHIPU/GLM-5.3` | `matched === true`；spec = `glm-5.3` 行（context 1_000_000 · maxOutput 128_000）——R22① |
| U-2 | 正常 | `qwen/ZHIPU/GLM-5.3-FlashX` | `matched === true`；spec = `glm-5.3-flashx` 行（context 1_000_000 · maxOutput 131_072；长前缀先命中）——R22② |
| U-3 | 边界 | `Qwen/ZHIPU/GLM-5.3` | 与 U-1 同判（大小写不敏感）——R22③ |
| U-4 | 回归 | 单段 `ZHIPU/GLM-5.3` · 裸名 `glm-5.3-flash` · 单段对照 `qwen/qwen3.7-max` · `deepseek/deepseek-flash` | 逐名命中与批前同判——R22④ |
| U-5 | 错误 | `zzz/unknown-x` | `matched === false`；spec = `DEFAULT_SPEC`（128_000 / 32_000）；告警一次——R22⑤ |
| U-6 | **判别性** | `glm-5.3/zzz`（两段，首段恰为在册前缀） | `matched === false`——末段 `zzz` 无行；旧实现先扫完整名会命中 `glm-5.3` 行。**这是唯一能分开两套规则的形**（`qwen/glm-5.3/zzz` 旧法也 miss，无判别力） |
| U-7 | 边界 | `glm-5.3/`（尾斜杠） | `matched === false`（末段为空 ⇒ 未命中）；旧法直扫会命中 |
| U-8 | 边界 | `/glm-5.3`（首斜杠） | `matched === true` ∧ spec = `glm-5.3` 行——末段 = `glm-5.3`；两端同判 |
| U-9 | 边界 | `/qwen/glm-5.3`（前导斜杠 + 多段） | 末段 `glm-5.3` ⇒ 命中 |
| U-10 | 等价 | 第三载体 `specForDisplay`：喂 U-1 · U-6 · U-8 三名 | **在册名**（U-1 / U-8）与核 `specForModel` 逐名 `context` / `maxOutput` 相等；**未收录名**（U-6 `glm-5.3/zzz`）按快照自身契约 = `null`，与核 `DEFAULT_SPEC` **不比**（展示面零兜底 ∥ 执行面兜底——两个契约不可比，见 §17.4「第三载体等价」） |
| V-1 | 正常 | `[vsc]` `specForModel("qwen/ZHIPU/GLM-5.3")` | `reasoningEffortDefault === "max"`——R22 同判（VSC 载体） |
| V-2 | 回归 | `[vsc]` `specForModel("ZHIPU/GLM-5.3")` | `reasoningEffortDefault === "max"`——单段零回归 |
| V-3 | 错误 | `[vsc]` `specForModel("zzz/unknown-x")` | `reasoningEffortDefault === undefined` ∧ spec = 核 `DEFAULT_SPEC` 立面 |
| V-4 | 边界 | `[vsc]` `specForModel("/glm-5.3")` | `reasoningEffortDefault === "max"`——与核 U-8 同判（端差已消） |

### 17.7 边界（本节不做）

不做：改表行值（`kimi/kimi-k3` 退役除外）/ 改 `SORTED_SPECS` 排序 / 改告警文案 / 改回落语义 / 引入别名映射表 / 引入「逐段迭代」循环 / 改大小写口径 / 改 `provider.model` 发送形。
**端差**：原守卫端差已消除（§17.5）；三载体（核 / VSC / 服务器快照）同尺。

### 17.8 UI/交互决策（UI 面零改）

- 核 / CLI / 桌面面：零 UI 变化（查表结果面，无形态改动）。
- VSC 面（同判）：仅「双段外标名的 effort 默认档由占位「—」转注册默认档」= 数据面修复自动生效；下拉本体零改。
- 无 `open` 项。

## 18. gemini-3.8-flash ∥ gemini-3.7-flash 两行入表

### 18.1 关键裁定

| # | 裁定 | 理由 |
|---|---|---|
| KD-1 | `thinking: true` + `thinkAlwaysOn: true` | 官方：thinking_level 受理 LOW/MEDIUM/HIGH（默认 MEDIUM）——枚举无关闭档，显式 MINIMAL ⇒ API 校验错 ⇒ 恒思考（= §16.3 机制位语义；先例 = `glm-5.3` 行同形、同证据档） |
| KD-2 | 机制位其余全不声明（`thinkApi` / `reasoningEffortEnum` / `tempRange` / `noUsageStream` / `format` / `partialMode` / `prefixMode`） | google 传输面零可达 / 零消费（逐键凭据 = §18.4 表后「机制位逐键凭据」段）：「未取证 ⇒ 不设」+「无消费面 ⇒ 不落键」 |
| KD-3 | 存量 gemini 行零改 + 差异认账 | 禁改他行；存量 `thinking: false` 与新行并存 = 同族不同声明（不为其背书、亦不以存量约束新行）——差异写进 §18.4 认账行 |

### 18.2 表变更清单（两行新增，零删除、零改既有行）

插入锚 = `thincoder-core/model-specs.mjs:207`（`gemini-3.1-pro` 行）之后——Gemini 族段尾；行序不影响命中（`SORTED_SPECS` 按前缀长度降序，`thincoder-core/model-specs.mjs:256`）。

**前缀遮蔽自查**：两新名等长（16）且互非前缀；与存量四行（`gemini-3-pro` / `gemini-2.5-pro` / `gemini-2.5-flash` / `gemini-3.1-pro`）无遮蔽（无一是新名前缀，反之亦然）。
两新行将前缀覆盖未来同族名（`gemini-3.x-flash-*` 类）= 有意继承（同族在册名随覆盖范围巡检复核）。

**行文草案（含行注 · 实施轮照此落笔；行注为逐行标级义务）**：

```js
  // gemini-3.8-flash ∥ gemini-3.7-flash：官方逐档规格页实核——
  // 尺寸位（官方口径）：context 1_048_576 ∥ maxOutput 65_536；入 = 文/图/音/视、出 = 文（本表 multimodal = 图像面，§2.7——
  // 音/视仅行注承载）；思考恒开（thinking_level 受理 LOW/MEDIUM/HIGH、无关闭档；显式 MINIMAL ⇒ API 校验错——官方逐档页注）
  // ⇒ thinking + thinkAlwaysOn = 官方口径（§16.3 机制位）；机制位其余不声明（google 传输面——§18.3）。
  // GA 2026-09-02（3.8）∥ 2026-08-13（3.7）；3.7 退役 2027-01-28（日程注）。
  ["gemini-3.8-flash",  { context: 1_048_576, maxOutput: 65_536, thinking: true, thinkAlwaysOn: true, multimodal: true }],
  ["gemini-3.7-flash",  { context: 1_048_576, maxOutput: 65_536, thinking: true, thinkAlwaysOn: true, multimodal: true }],
```

### 18.3 字段口径表（逐字段 + 证据等级）

| 字段 | 值 | 证据等级 | 依据 / 不声明理由 |
|---|---|---|---|
| `context` | `1_048_576` | **官方口径** | 逐档规格页实核；非 API 实测（本机无该渠道密钥）——行注标级 |
| `maxOutput` | `65_536` | **官方口径** | 同上 |
| `multimodal` | `true` | **官方口径 + 族据** | 官方入模态含图像（本表语义 = 图像面，§2.7）；族据 = 同族在册三行均声明 true（点名来源行） |
| `thinking` | `true` | **官方口径** | 受理枚举含档位（LOW/MEDIUM/HIGH）、默认 MEDIUM ⇒ 思考在场 |
| `thinkAlwaysOn` | `true` | **官方口径** | 受理枚举无关闭档 ∧ 显式 MINIMAL ⇒ 校验错 ⇒ 无 off 路径（§16.3 语义；官方逐档页注） |
| 机制位其余 | 不声明 | —— | google 传输面零可达 / 零消费（逐键凭据 = §18.4 表后「机制位逐键凭据」段）；「无消费面 ⇒ 不落键」 |
| 其余官方读数（不进字段） | —— | 官方口径 | 参数默认 temperature 1.0 / topP 0.95 / topK 64（默认值 ≠ 值域 ⇒ 不构成 `tempRange` 证据；该键在本传输面亦零消费）；出 = 文本（无字段承载） |

### 18.4 消费面与影响（本节动谁、谁零改）

| 字段 | 消费点 | 行为变化 |
|---|---|---|
| `context` | `providerSpec` → 压缩阈值（`thincoder-core/config.mjs:116-120`（`resolveCompactThreshold`）；`COMPACT_RATIO = 0.8` `:51`）· 上下文占比显示（`thincoder-vscode/src/specs.mjs:82` / `:96`）· advisor 预算（`thincoder-core/advisor/compaction.mjs:35-36`） | 压缩阈值按 1M 窗口重算——预设渠（`maxTokens: 8192`，`thincoder-core/config-presets.mjs:30`）：≈ 71 884 ⇒ **838 860**；无显式 `maxTokens` 渠：**838 860**（= min(1 048 576 − 65 536, floor(1 048 576 × 0.8))）；长会话不再被 128K 档提前压缩 |
| `maxOutput` | `outputReserve`（`thincoder-core/config.mjs:59-62`）——仅无显式 `provider.maxTokens` 时生效 | 预留 32 000 ⇒ 65 536（计入上式）；显式 `maxTokens` 渠零变化（预设主导）。**发送面**：spec 值不达 google 请求（`thincoder-core/provider/google.mjs:86` 发 `maxOutputTokens` 仅取 `provider.maxTokens`） |
| `multimodal` | 图像门族（清单与语义单源 = §2.7 第 1 项：`thincoder-core/attachments.mjs:54` 入列（第八处）∥ `thincoder-vscode/src/agent/setup-tooltable.mjs:305` ⇒ `thincoder-vscode/src/agent/tool-table.mjs:177` ∥ `thincoder-vscode/src/extension/image-handler.mjs:110` ⇒ `:43`） | 两档由「非多模态」（`true` 之外一切）转「多模态」：`read_image` 注册门（`thincoder-core/tools/index.mjs:66`——读点 `specForModel(model)?.multimodal`；注册表达式 `:69`）、贴图 / 读图 / 注入门放行；google 侧 `inlineData` 通路既有（`thincoder-core/provider/google.mjs:54-59`） |
| `thinking` | `effortEnumForModel` 读取点：`spec.thinking` 直接读点 = `thincoder-vscode/src/specs.mjs:72`（读形 `s.reasoningEffortEnum || (s.thinking ? ["enabled"] : ["high","max"])`）此一处；消费面（调用点）= `thincoder-vscode/src/extension/provider-probe-window.mjs:66` | 该两档 VSC 档位面落 `["enabled"]` 单档（思考开关族既有形；选档归一落中性档、零 patch——§16.6-⑴）；其余面零变 |
| `thinkAlwaysOn` | `thinkOffPath`（`thincoder-core/think-off.mjs:22-26`）→ 既有条件分支族 | ①CLI `/think`：无 Thinking 开关项 ∧ `/think off` 拒绝（§16.4 两菜单面落点）；②`/advisor`：Disabled 项不渲染；③生成标题零发禁用形（`thincoder-core/generate-title.mjs:46` / `:74`——「无有效 off 路径 ⇒ 不发禁用形」；判据单源 = §16.4）；④auto-think 无枚率先行 `return null`（`thincoder-core/auto-think.mjs:73-74`，先于恒思考守卫）；⑤桌面模型菜单 `thinkOff: false` ∧ `effortEnum: []`（`thincoder-desktop/src/main/settings.mjs:96-99`） |

**机制位逐键凭据（不声明面）**：

- `thinkApi`：读点全在端侧 off 形族（`thincoder-cli/src/tui/cmd-think.mjs:16` · `thincoder-cli/src/tui/cmd-advisor.mjs:130` / `:265` · `thincoder-core/think-off.mjs:15` · `thincoder-core/provider/core.mjs:222` · `thincoder-vscode/src/extension/reasoning-mode.mjs:32`）；
  两新档 `thinkAlwaysOn: true` ⇒ off 形族动作不可达（`thinkOffPath === false`）⇒ 无消费后果。
- `reasoningEffortEnum`：读点全为 `reasoning_effort` 参数面（CLI 档位 `thincoder-cli/src/tui/cmd-think.mjs:19` / `cmd-advisor.mjs:267` / `cmd-config-menus.mjs:87` / `thincoder-cli/src/tui/slash-commands.mjs:157`）；
  核 `thincoder-core/provider/core.mjs:206` / `thincoder-core/agent/spawn-child.mjs:211` / `thincoder-core/auto-think.mjs:73` · 端 `thincoder-vscode/src/specs.mjs:72` / `thincoder-desktop/src/main/settings.mjs:77`；
  google 发送面排除（`thincoder-core/provider/core.mjs:205`；`:153` 分派即返）⇒ 零可达（假控制面——KD-2）。
- `tempRange`：钳制点 = OpenAI 兼容体组装段（`thincoder-core/provider/core.mjs:195-196`）∥ responses（`thincoder-core/provider/responses-request.mjs:208-209`）∥ anthropic（`thincoder-core/provider/anthropic.mjs:66`）——google 在 `thincoder-core/provider/core.mjs:153` 分派即返、不经该段 ⇒ 本传输面零消费；
- `noUsageStream`：唯一消费点 = OpenAI 兼容体组装段（`thincoder-core/provider/core.mjs:191`）——google 走原生 transport、不经该段 ⇒ 不可达（§15.2 逐族表同判）；
- `format`：全仓入码面无 `spec.format` 读取点；`format` 值的运行时消费全为 `provider.format`（传输分派 `thincoder-core/provider/core.mjs:143` / `:153` / `:163` / `:205`）；
  取值源 = 预设表（`thincoder-core/config-presets.mjs:30`）∥ 条目自定义（`thincoder-core/config-io.mjs:245-248`），非本表键；同族先例 = 存量 `gemini-3.1-pro` 尺寸行无 `format`（§14.2 #2–6；§15.2 记录面同引）。

**认账（存量差异 · 如实登记）**：存量 gemini 四行（其中三行 `thinking: false`；第四行 `gemini-3.1-pro` 尺寸行无该键）沿用（禁改他行）——其「标题路径照发禁用形」的既有行为与新行「零发」并存。
另：`/think off` 拒绝文案括注（「use /think effort <level>」）对本族**不生效**（档位项可选中——`thincoder-cli/src/tui/cmd-think.mjs:19` 兜底档；值经 `thincoder-core/provider/core.mjs:205` 被 google 发送面排除、不达载荷；§16.4 定形文案同源）。

**零触面**：存量 gemini 四行 · `SORTED_SPECS` / 查表语义 / 告警文案 / `DEFAULT_SPEC` · 预设表（`thincoder-core/config-presets.mjs`）· 传输面（`thincoder-core/provider/**`）· 三端代码。

### 18.5 影响文件清单

| 文件 | 现状 | 预期增删 | 说明 |
|---|---|---|---|
| `thincoder-core/model-specs.mjs` | **370**（2026-10-23 `wc -l`） | **+~7**（行注 5 行 + 两表行） | §18.2 行文草案；零结构 / 零导出面 / 零存量行改。>300 处置 = 登记 + 拆分计划（落点 = 本档 §13.6「行数处置」段——拆点 / 落点 / 消解窗口住彼）；本次 ∉「实质改动」——拆点未触发；改后 ~377（≤500 硬限） |
| `docs/core/design/MODEL-SPECS.md` | —（本档自指） | +本节 | 本节 |

### 18.6 验收标准回指

| 判据 | 条目 | 设计落点 | 判定方式（机器核） |
|---|---|---|---|
| AC-1 | #1198 | §18.2 / §18.3 | 两行逐字段在场：`specForModel("gemini-3.8-flash")` ∧ `("gemini-3.7-flash")` 各 deepEqual `{ context: 1_048_576, maxOutput: 65_536, thinking: true, thinkAlwaysOn: true, multimodal: true }`；`specMatch` 双名 `matched === true` |
| AC-2 | #1198 | §18.2 | 零改既有面：存量 gemini 四行逐名与批前同判（`gemini-3.1-pro` 保持 `{ context: 1_048_576, maxOutput: 65_536 }`）；未知名面零变（`gemini-3.9-flash` / 裸段 `gemini-3.8` ⇒ `matched: false` + `DEFAULT_SPEC`） |
| AC-3 | #1198 | §18.3 | 机制位不声明面（防空扫）：两行 `thinkApi` / `reasoningEffortEnum` / `tempRange` / `noUsageStream` / `format` 全 `undefined`；`thinkOffPath(spec) === false` |
| AC-4 | #1198 | §18.4 | 影响面读数：`outputReserve({ model: "gemini-3.8-flash" }, spec)` = 65 536；`resolveCompactThreshold(null, { model: "gemini-3.8-flash" })` = `{ value: 589_824, auto: true }`；显式 `{ maxTokens: 8192 }` ⇒ 624 230。实施前确认两函数导出面（均具名导出，见 `thincoder-core/config.mjs` 行 117 / 139）；若现读为模块内函数 ⇒ 改经公开消费面取读数 |

### 18.7 用例表（正常 / 边界 / 错误 · 落点 = 单元测试档（拟新增））

**用例号注**：`G-` 号在本档两组节表内各成一族（§13.8 与本节），判定以所属节表为准。

| id | 类 | 输入 / 动作 | 期望输出与判据 |
|---|---|---|---|
| G-1 | 正常 | `specForModel("gemini-3.8-flash")` | deepEqual `{ context: 1_048_576, maxOutput: 65_536, thinking: true, thinkAlwaysOn: true, multimodal: true }`；`specMatch` `matched: true` |
| G-2 | 正常 | 同上：`gemini-3.7-flash` | 同 G-1（两行同形、各自独立行） |
| G-3 | 边界 | `GEMINI-3.8-FLASH`（大小写变体）∥ `gemini-3.8-flash-preview`（未来同族名） | 大小写不敏感同判；`…-preview` 经前缀继承命中本行（`matched: true`、同对象——有意继承） |
| G-4 | 错误 | `gemini-3.9-flash`（无行）；裸段 `gemini-3.8` | 均 `matched: false` + `DEFAULT_SPEC`（128 000 / 32 000）+ 告警一次（既有 dedupe 面）——未知名兜底零变 |
| G-5 | 回归 | 存量四行：`gemini-3-pro` / `gemini-2.5-pro` / `gemini-2.5-flash` / `gemini-3.1-pro` | 逐名与批前同判（取值逐字段不变；`gemini-3.1-pro` = `{ context: 1_048_576, maxOutput: 65_536 }` 零改） |
| G-6 | 边界 | `thinkOffPath(specForModel("gemini-3.8-flash"))` + 机制位缺位断言 | `false`（恒思考族）；`thinkApi` / `reasoningEffortEnum` / `tempRange` / `noUsageStream` / `format` 全 `undefined` |
| G-7 | 正常 | `outputReserve` / `resolveCompactThreshold`（`thincoder-core/config.mjs`）两态 | 无显式：预留 65 536、阈值 `{ value: 589_824, auto: true }`；显式 `maxTokens: 8192`：阈值 624 230。实施前确认两函数导出面（均具名导出；若现读为模块内函数 ⇒ 改经公开消费面取读数） |

### 18.8 边界（本节不做）

- 不动存量表行（四行——其中三行携 `thinking: false` / `noUsageStream` / `format`；禁改他行；差异认账见 §18.1 KD-3）。
- 不动预设面（`thincoder-core/config-presets.mjs`）· 传输面（`thincoder-core/provider/**`）· 三端代码 · VSC 端差表（`thincoder-vscode/src/specs.mjs`——两新档无枚举 / 无注册默认档，零改）。
- 旁档不入（gemini 3.6 / 3.5 各族及其他未在册 gemini 名）。
- 服务器手工同步快照（`thincoder-server/public/model-specs-snapshot.mjs`）零触——按该面既定「核表更新后由后续版本手工同步」机制处理。
- google 传输面 chat 载荷的思考 / effort 通路缺口（`thincoder-core/provider/google.mjs` 无 `thinkingConfig`；`thincoder-core/provider/core.mjs:205` 排除 google 的 `reasoning_effort` 发送）——本轮禁改面，如实尾注（报告），不立条目。

### 18.9 UI/交互决策（全落地，无 `open`）

| 面 | 决策 |
|---|---|
| CLI `/think` / `/advisor` | 零形态变更——两档落 `thinkOffPath === false` ⇒ 既有条件分支生效（开关项 / Disabled 项不渲染——§16.4 语义，不新增 UI） |
| VSC（聊天面板 / 设置面板）· 桌面模型菜单 | 零形态变更——档位面随数据面（`["enabled"]` 单档 / `effortEnum: []` / `thinkOff: false`），既有渲染规则承接 |

无 `open` 项。
