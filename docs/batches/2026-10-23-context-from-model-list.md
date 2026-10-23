# 2026-10-23 · 上下文长度以渠道自报优先（四级链 + 按模型粒度的人工声明）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-23 · 来源 = 用户 2026-10-23 17:28「我还是希望如果模型列表接口提供了参数还应该优先用」+ 17:30 裁定「A」+ 17:31「人工声明现在挂在 provider 是不对的，应该是对应的 provider 下的具体模型」。
> 台账 = #1739（PROVIDER · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-23
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**讨论（主 agent）**

**起点**：用户 2026-10-23 17:28「我还是希望如果模型列表接口提供了参数还应该优先用。」

**父侧实读（六渠道，2026-10-23）**——列表字段三家三名、三家不报：

| 渠道 | 字段 | 实测值 |
|---|---|---|
| deepseek | `context_window` | 1,048,576 |
| kimi | `context_length` | 262,144–1,048,576 |
| dgx-island2（vLLM） | `max_model_len` | 1,048,576 |
| qwen（178）· glm（11）· mimo（7） | 无 | — |

静态表与列表几乎全不一致（`deepseek-flash` 表 1,000,000 ∥ 列表 1,048,576；`kimi-k2.6` 表 128,000 ∥ 列表 262,144）。

**顺序裁定**：17:30 用户裁「A」= 人工声明 > 列表 > 静态表 > 兜底 128K。

**粒度裁定**：17:31「人工声明现在挂在 provider 是不对的，应该是对应的 provider 下的具体模型。」

**父侧发现的现场事故（本批动因之一）**：五个渠道填了 `context`（K 单位），其中两个填的是 token——`dgx-v41` 262144 ⇒ 2.68 亿 · `dgx-island2` 1048576 ⇒ 10.7 亿 token。上下文算到这个量级，压缩永不触发 ⇒ 必然溢出，且全程不报错。⇒ 需求把值的单位改成 **token**（R30）。

**- **已定决定**：人工声明按模型粒度（新键 `providers[].modelContext`，键 = 模型 ID 逐字，值 = token 数） · 用户原话：「人工声明现在挂在 provider 是不对的，应该是对应的 provider 下的具体模型。」 · 时间：2026-10-23 17:31**

**- **已定决定**：优先级 = 人工声明 > 模型列表自报 > 静态表 > 兜底 128K · 用户原话：「我还是希望如果模型列表接口提供了参数还应该优先用。」（裁定 A） · 时间：2026-10-23 17:30**

**需求落点**：`docs/core/requirements/PROVIDER.md` §4.8（R24–R30，gate PASS）。

**范围**：产品代码面（`providerSpec` / `listModels` / 配置解析），提示词面零改。

**不做**：不改 `listModels` 返回形态 · 不按列表值反写静态表 · 不改 `maxOutput` 来源 · 不处理 anthropic / google 两端的列表形态（零实测无判据）· 不动服务端（team）模型元数据。

- **已定决定**：模型名匹配一律取「按 `/` 拆分后的最后一段」，**前缀不参与匹配**；规格表查表与 `modelContext` 键**同一规则** · 用户原话：「模型名匹配不是早就确定过规则的吗？应该改是匹配/拆分以后的最后一段，跟前面没关系。」 · 时间：2026-10-23 17:34

**父侧实测（现行实现与上述规则不符）**：`thincoder-core/model-specs.mjs:270-284` 的 `lookupSpec` 是**先扫完整名、未中才取末段**。后果——`glm-5.3/zzz` 今天解析为 `matched=true`、取 `glm-5.3` 行（1M 上下文），而 `zzz` 根本不是 glm-5.3。按用户规则，该形应取末段 `zzz` ⇒ 未命中 ⇒ DEFAULT_SPEC + 告警。

**影响面（实测）**：规格表 76 个键里**只有 1 个含 `/`**（`kimi/kimi-k3`），而 `kimi-k3` 单段行同样在表内且取值相同 ⇒ 去掉完整名先扫**零损失**。`qwen/ZHIPU/GLM-5.3` 走末段本就命中，行为不变。

**并要求设计席把该规则的适用范围写清**：`modelContext` 的用户键、`/v1/models` 返回的 id、静态表查表——三者用同一把尺子，不出现第二套匹配语义。

- **已定决定**：CLI 的 `context`（K）编辑命令随旧键**退役，同批给出替代写面，三端齐** · 用户原话：「A，退役」+「vsc/桌面的写面为啥不补？你以前赖了现在还想接着赖？」 · 时间：2026-10-23 17:39 / 17:41

**配套需求**：`docs/core/requirements/PROVIDER.md` §4.8 **R31**（五判据：旧命令不可达 / 全仓无写入旧键 / **三端各能写** / 三端读面回显一致 / 旧键只读仍在）。设计侧 = `docs/core/design/PROVIDER.md` §6.15 关键决策 D7（「退役 + 同批替代」）。

**已作废的一句（留痕以免误读）**：曾写「新的编辑界面单独立项」——用户 2026-10-23 17:41 驳回：配置项必须有界面，三端同批，欠账不许续期。

## §2 批次任务与设计（eng-designer）
**状态行**：（eng-designer 写入时更新）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

**状态行**：设计完成（2026-10-23）

## 本批条目（覆盖）

| # | 条目 | 设计落点（单源） |
|---|---|---|
| 1 | R24 四级链 | `docs/core/design/PROVIDER.md` §6.15「解析链」 |
| 2 | R25 三字段名与取用序 | 同节「列表三字段与取值序」 |
| 3 | R26 非法值不发散 | 同节「非法值与异常值」 |
| 4 | R27 异常值照用 + 告警 | 同节「非法值与异常值」 |
| 5 | R28 列表未报行为零变 | 同节「缓存：触发 / 键 / 失效 / 失败」 |
| 6 | R29 人工声明按模型粒度 | 同节「modelContext 键形与查表规则」 |
| 7 | R30 值单位 = token | 同节「解析链」单位列 +「旧键退役形态」 |
| 8 | 用户 17:34 裁定：模型名匹配末段唯一 | `docs/core/design/PROVIDER.md` §6.9（规则单源）+ §6.15（三面应用）+ `docs/core/design/MODEL-SPECS.md` §17 |

**不在本批**：需求 §4.8 范围边界六项（别名映射表 / 反写静态表 / maxOutput 来源 / `/models` 展示文案 / team 模型元数据 / anthropic·google 列表形态）。
另两条认账边界：同 `baseURL` 不同凭据共用一个缓存条目；本批不新增拉取触发（会话从不打开列表面 ⇒ L3 缺席、落 L4）。

## 设计档落点

- `docs/core/design/PROVIDER.md` §6.15 = **就地换代**（标题改「模型上下文解析（`providerSpec` 四级链）」）。保留节号的理由：`thincoder-core/model-specs.mjs:316`、`thincoder-core/config.mjs:82`、`thincoder-core/provider/core.mjs:130` 三处代码注释已引用 §6.15，换号即造死指针。
- `docs/core/design/PROVIDER.md` §6.9 第 158 行 = 模型名匹配规则单源（末段唯一），§6.15 引用不重述。
- `docs/core/design/MODEL-SPECS.md` §17 = 同规则在规格表侧的实现形 + 用例表（U-6 改判别性形 `glm-5.3/zzz ⇒ false`）。

## 机制设计（摘要，详情见 §6.15）

解析链 L1–L5：`modelContext[模型]`（token，不乘）> `providers[].context`（K，×1024 唯一乘点 `model-specs.mjs:334`）> 列表自报（三字段取第一个合法值，token，不乘）> `MODEL_SPECS` > `DEFAULT_SPEC`。
形态：新增 `thincoder-core/model-context.mjs`（模块级 `baseURL` 缓存 + 键归一 + 值校验）；写面收在 `listModels` 的 openai 分支；`providerSpec` 同步只读缓存，未命中落下一层。
匹配尺子：末段唯一、大小写不敏感、歧义不猜（三面同一把）。
告警：旧键迁移一次（provider 名去重）· 异常值一次（baseURL + 模型 + 值去重）· 歧义一次。

## 受影响文件与测试覆盖

| 文件 | 现值 | 增量 | 性质 |
|---|---|---|---|
| `thincoder-core/model-context.mjs` | 0（新） | +~100 | 缓存 / 键归一 / 值校验 |
| `thincoder-core/model-specs.mjs` | 370 | 链 +~35 ∥ 匹配规则 -10 | `providerSpec` 链 + `providerSpecResolution` + `lookupSpec` 末段唯一 + `kimi/kimi-k3` 行退役 |
| `thincoder-core/provider/list-models.mjs` | 168 | +~15 | openai 分支收集 id→窗口，返回前写缓存；返回形态零改 |
| `thincoder-core/config.mjs` | 408 | +~20 | `modelContext` 装载归一 + `windowSource` 改读 resolution |
| `thincoder-cli/src/tui/provider-admin.mjs` | 249 | -48 | K 单位编辑命令退役（`:174-221`） |
| `thincoder-vscode/src/specs.mjs` | 102 | ±0 | `effortDefaultFor` 末段唯一（一 token + 注改） |
| `thincoder-server/public/model-specs-snapshot.mjs` | 未实测 | 一 token + 注改 | 第三载体（`specForDisplay`，父侧坐标 `:97`） |
| `thincoder-core/CHANGELOG.md` | — | +1 条 | 旧键迁移说明（A7） |
| 单元测试（本批新增，收口删） | 0 | +~120 | 链四层 / 键形 / 三字段 / 非法·异常 / 单位 / 告警去重 / 缓存写读 / 末段唯一 |

## 验收对照（R24–R30 逐条机判）

| 需求 | 判定行（可机判） |
|---|---|
| R24 | 四源各不相同 ⇒ 取 L1；去 L1 ⇒ 取 L3；无 L3 ⇒ 取 L4；表无行且无 L3 ⇒ 128K |
| R25 | 三字段各造一例 ⇒ 均命中；同条目三字段异值 ⇒ 取序首合法值 |
| R26 | 0 / 负 / 非数 / 非整各一例 ⇒ 与「该字段缺席」逐字同判，不抛、不落 0 |
| R27 | 造 8× 值 ⇒ 采用该值（未被改写）+ 告警恰一次 |
| R28 | 五档既有模型在「列表不报」路径下 context 逐值不变 |
| R29 | 同渠道两模型各给不同值 ⇒ 各自生效；`qwen/ZHIPU/GLM-5.3` 键与 id 末段相等 ⇒ 命中；未点名 ⇒ 落 L2 |
| R30 | 写 `131072` ⇒ 解析结果恰 `131072`；旧键 `context: 128` ⇒ `131072` + 告警一次 |
| 17:34 裁定 | `specMatch("glm-5.3/zzz").matched === false`；`qwen/ZHIPU/GLM-5.3` 仍 `true` |

## 关键决策

| # | 决策 | 理由 |
|---|---|---|
| D1 | 模块级缓存 + 同步只读（非预取注入、非 async） | 热路径零 IO；provider 对象被反复浅拷贝，注入字段会丢 |
| D2 | 写面收在 `listModels`，零新增请求 | 六个消费面本来就要拉；启动预取与 §6.16 M8/M9「启动零探测」冲突 |
| D3 | L2 旧键位于 L3 列表之上 | 旧键也是人工声明；17:30 裁定人工声明 > 列表 |
| D4 | 三面同一把尺子 = 末段唯一 + 歧义不猜 | 用户 17:34 裁定；同模型三种写法 |
| D5 | 三字段取第一个合法值 | R25 与 R26 同时成立 |
| D6 | 异常值照用 + 告警，不截断 | R27 明示；截断 = 静默改写真事实 |
| D7 | K 单位编辑命令退役 | 需求：旧键不再写入新配置 |
| D8 | `kimi/kimi-k3` 行退役 | 末段 `kimi-k3` 已达同值行（`model-specs.mjs:44` 与 `:46` 逐值相同），含 `/` 的键不可能是末段 ⇒ 该行不可达 |

## 待父侧裁 / 需随正

1. **[上抛·待裁] 需求档 §4.8 R29② 措辞**：现文「键与 /v1/models 的 id 逐字匹配」，与 17:34 裁定的「末段归一后相等」字面不一致（§4.6 已由主 agent 收正）。设计按裁定落；R29② 请主 agent 同拍。
2. **[上抛·待裁] 旧键写面退役**：删 CLI `/model` 的 K 编辑命令（`provider-admin.mjs:174-221`）是「旧键不再写入新配置」的直接导出，但属 UI 面改动，请评审确认。
3. **[上抛·知会] 服务器第三载体**：`thincoder-server/public/model-specs-snapshot.mjs:97` `specForDisplay` 是同机制第三载体，实施轮需一并收正（否则三载体不一致）。

## 修正轮（用户 2026-10-23 17:40 指出：D7 只退役不替代 = 配置项全平台无写面）

**设计落点**：`docs/core/design/PROVIDER.md` §6.15 新增「写面：CLI `modelContext` 编辑命令（`setModelContextFlow`）」；同节「旧键退役形态」第二条改为「退役 + 同批替代」；D7 改为「退役 **+ 同批替代**」。

### 本批条目（补登）

| # | 条目 | 设计落点（单源） |
|---|---|---|
| 9 | R31 旧写面退役 + 同批替代（CLI `modelContext` 编辑命令） | `docs/core/design/PROVIDER.md` §6.15「写面：CLI `modelContext` 编辑命令」 |

### 受影响文件（补行 / 改行——覆盖上方同名表对应行）

| 文件 | 现值 | 增量 | 性质 |
|---|---|---|---|
| `thincoder-cli/src/tui/provider-admin.mjs` | 249 | +~55 ∥ -48（净 ~+7） | 新增 `setModelContextFlow`（选渠道 → 选模型 → 输 token）∥ `setContextFlow`（`:174-221`）删除；模块头登记改口 |
| `thincoder-cli/src/tui/model-picker.mjs` | 297 | +~6 ∥ -2 | L1 管理项改 `Set model context (tokens)…` / `action:"model-context"`；尾再出口注册 `setModelContextFlow`；模块头「四流」→「五流」 |

### 验收对照（R31 补行）

| 需求 | 判定行（可机判） |
|---|---|
| R31① | `/model` 菜单不再有 `Set context window (K units)…` 项；`grep setContextFlow thincoder-cli/src` 零命中 |
| R31② | `grep` 无代码路径写 `providers[].context`（旧命令删除后零命中） |
| R31③ | 走新命令：选渠道 → 选模型 → 输 `131072` ⇒ 盘上 `modelContext[<模型>] = 131072`、解析 131072（不乘 1024）；空输入 ⇒ 该键删除，对象空则 `modelContext` 整体删除 |
| R31④ | 旧键 `context: 128` 仍解析 131072 + 告警一次（R30② 同判） |

### 判定说明

- 「列表拉不到」分两读：**整体不可达** ⇒ 中止本流并明示 `modelListFailureText`（M8/M9 模型候选面不设手输绕过）；**列表不报窗口字段**（qwen / glm / mimo）⇒ 流程照常——新流只写人工声明，不从列表读值。设计按此落地。
- **三端写面同批**：CLI 命令 ∥ VSC 设置 providers 卡 ∥ 桌面设置 providers 段——同一交互形（选渠道 → 选模型 → 输 token → 空即清除）；判据 = 三端读面回显一致（需求 R31 ④）。

## 修正轮 2（2026-10-23 17:43 · 用户驳回「只补 CLI」+ 单位改回 K）

**作废（就地覆盖，以上方同名段为准）**：上方「VSC / 桌面写面不在本批（需求 R31 已写「另批裁」）」一句作废——R31 已改写为**三端同批**；上方受影响文件表与验收对照中 R31 各行是 **CLI 单端口径**，以下补行覆盖。

**单位口径（用户 17:43 逐字「设置时的长度单位必须是 K！」）**：`modelContext` 的**输入 / 存储 / 展示三处都是 K**，解析时 ×1024。设计档已全节收正：L1 单位列 = 「K，×1024」、L1 ∥ L2 共用唯一乘点 `thincoder-core/model-specs.mjs:334`、提示文案 K 口径、用例表 `128` ⇒ 解析 131072。

### 本批条目（补登）

| # | 条目 | 设计落点（单源） |
|---|---|---|
| 10 | R30 单位 K 三处一致（输入 / 存储 / 展示） | `docs/core/design/PROVIDER.md` §6.15「解析链」L1 行 +「`modelContext` 键形」+「写面」第 3/4 步 +「文案登记」 |
| 11 | R31③ VSC 写面（providers 卡入口） | 同节「三端落点」VSC 行 |
| 12 | R31③ 桌面写面（设置 providers 段入口） | 同节「三端落点」桌面行 |
| 13 | R31④ 三端读面同源 | 同节「读面回显 = 同一个函数 + 同一个格式器」+「读面载荷」 |

### 受影响文件（补行 / 改行——覆盖上方同名表）

| 文件 | 现值（行，实测） | 增量 | 性质 |
|---|---|---|---|
| `thincoder-cli/src/tui/provider-admin.mjs` | 210 | +~55 ∥ -48 | `setModelContextFlow`（K）新增 ∥ `setContextFlow`（`:174-221`）删除；模块头登记改口 |
| `thincoder-cli/src/tui/model-picker.mjs` | 276 | +~6 ∥ -5 | L1 管理项 `Set context window (K)…` / `action:"model-context"`；`fmtContextK`（`:39`）上提核（本地副本删） |
| `thincoder-core/model-specs.mjs` | 370 | +~12 | 新增导出 `formatContextK(tokens)`；L1 ∥ L2 唯一乘点 `:334`；`providerSpecResolution` |
| `thincoder-vscode/webview/settings-providers.js` | 126 | +~35 | 渠道行动作簇 `Context…` 钮 + 弹窗装配 + `saveProviderModelContext` 消息 |
| `thincoder-vscode/webview/settings-provider-dialog.js` | 236 | +~60 | 上下文编辑弹窗体（渠道 → 模型 → K 值） |
| `thincoder-vscode/webview/i18n.js` | 1（打包入口） | +4 键 | `settings.providers.context*` 四键 |
| `thincoder-vscode/src/extension/settings.mjs` | 350 | +~25 | `providerStatus()` 增 `modelContext` + `context` 两键；新宿主函数 `saveProviderModelContext`（`vscPersistRaw`） |
| `thincoder-vscode/src/extension/panel-messages-settings.mjs` | 237 | +~12 | 新 case `saveProviderModelContext`（形沿 `handleSaveProviderKey` `:36-48`） |
| `thincoder-desktop/renderer/views/settings-sections-providers.mjs` | 178 | +~30 | 渠道行 `Context…` 钮 + `providerContextBody` 弹窗体 |
| `thincoder-desktop/renderer/views/settings.mjs` | 382 | +~10 | `providerContext` 弹窗支 |
| `thincoder-desktop/renderer/mount-settings-segments-providers.mjs` | 125 | +~30 | handlers 表增编辑 ∥ 保存出口；`ask("provider:setModelContext", { name, model, k })` |
| `thincoder-desktop/renderer/mount-settings-reads.mjs` | 173 | +~8 | `provider:list` 回执透传 `modelContext` + `context`（视图零派生） |
| `thincoder-desktop/renderer/i18n-settings.mjs` | 202 | +4 键 | 与 VSC 同名四键 |

### 验收对照（R31 三端口径，覆盖上方 R31 各行）

| 需求 | 判定行（可机判） |
|---|---|
| R31① | `/model` 菜单不再有 K 单位旧编辑项；`grep setContextFlow thincoder-cli/src` 零命中 |
| R31② | `grep` 无代码路径写 `providers[].context`（旧命令删除后零命中） |
| R31③-CLI | 走新命令：渠道 → 模型 → `128` ⇒ 盘上 `modelContext[<模型>] = 128`、解析 131072；空输入 ⇒ 该键删除，对象空则 `modelContext` 整体删除 |
| R31③-VSC | providers 卡 `Context…` → 渠道 → 模型 → `128` ⇒ 盘上同判；重开输入框 current = `128K` |
| R31③-桌面 | 渠道行 `Context…` → 同形三步 ⇒ 盘上同判；复读行面回显 `128K` |
| R31④ | 三端对同一渠道同一模型显示同一串：`providerSpec(provider).context` 经同一 `formatContextK` ⇒ `128K`（三端代码路径均指向该函数） |
| R31⑤ / R30③ | 旧键 `context: 128` 仍解析 131072 + 告警一次；界面回显 `128K` 而非 `131072` |

### 判定说明（改口径 2 条）

- **列表不可达**：由上方「中止 + 模型候选面不设手输」改为「明示失败信息 + **允许手填模型 id**」——本轮任务书口径；写面只写人工声明，不以列表存在为前提。
- **CLI 无 i18n 档**（实读：`thincoder-cli/src/tui/` 无 i18n 模块，旧命令文案 `provider-admin.mjs:189` 即内联英文）⇒ 任务书「三端各有 i18n 档」对 CLI 不成立；CLI 新文案内联，VSC / 桌面各登记同名四键。

### 待父侧裁 / 需随正

1. **[上抛·待裁]** 需求档 §4.8 R29② 仍是「键与 /v1/models 的 id 逐字匹配」字样，与 R22 / R29 判定句的「末段归一等」字面不一致（上一轮已上抛，未处置）。设计按末段尺子落。
2. **[上抛·知会]** 设计新增核导出 `formatContextK(tokens)`（由 CLI `fmtContextK` 上提）——三端共用一个格式器是 R31④ 的落实方式；若父侧不新增导出，替代 = 三端各自格式化（三份会漂，不推荐）。

## 修正轮 3（2026-10-23 · 评审 20 条逐条落地 · 设计侧）

**范围**：评审轮次 1 的 🔴1 · 🟡3–🟡8 · 🟡11–🟡20 逐条落地；🟡9 / 🟡10 / 🔴2 的需求侧已由主 agent 改完，本席按新需求对齐（🟡10 的设计侧余项 = 标题改五级链，已落）。**未动代码、未动需求档。**

**逐条落点**（坐标 = 本轮改后实读行）：

| 评审# | 改动 | 落点 |
|---|---|---|
| 🔴1 | 删「`kimi/kimi-k3` 与 `k3` 保留显式 alias 行」半句，改为退役口径（单源 §6.9） | `docs/core/design/PROVIDER.md:210` |
| 🟡3 | §6.9 新增逐面算子表（静态表 = 段内前缀；`modelContext` / 列表 = 末段相等）+ 判别例 `glm-5.3` × `glm-5.3-flashx` ⇒ 不命中 | `docs/core/design/PROVIDER.md:158-166` · `:326` · `docs/core/design/MODEL-SPECS.md:1665` · 用例 P-10（`:496` 表内） |
| 🟡4 | 歧义射程写明「仅该模型、不废整层」 | `docs/core/design/PROVIDER.md:335` |
| 🟡5 | 写面校验 = parse 成 Number → `positiveInt`；边界 `"128"` 收 / `"128K"` `"1.5"` `"-1"` 拒 | `docs/core/design/PROVIDER.md:381-383` |
| 🟡6 | §6.15 补 AC 回指表（R24–R31）+ 读链用例表 P-1..P-13 + 写面情形表编号 W-1..W-9 | `docs/core/requirements/PROVIDER.md:479` · `:496` · `:430-440` |
| 🟡7 | §6.15 受影响文件表（逐档 `wc -l` + Δ）+ `model-specs.mjs` 拆点算式（370 − 10 + 59 = 419 ≤ 500 ⇒ 未触发） | `docs/core/design/PROVIDER.md:524` |
| 🟡8 | §17.3 补单元测试档行（0 / +~90）、服务器快照现量 106；第三载体等价断言（§17.4 末行 + U-10） | `docs/core/design/MODEL-SPECS.md:1706-1715` · `:1732` · `:1753` |
| 🟡11 | R31② 写者枚举三条 + G-1 / G-2 grep 判据 | `docs/core/requirements/PROVIDER.md:514` |
| 🟡12 | 四键 zh ∥ en 两字面 + 非法值报错行 zh / en 各一份 | `docs/core/design/PROVIDER.md:415-425` |
| 🟡13 | 候选载体（VSC `{type:"models", models}` / 桌面 `provider:list` 回执 `models`）+ GUI 手填入口形 | `docs/core/design/PROVIDER.md:403-406` |
| 🟡14 | `windowSource` 五值映射 = 恒等（不并类）+ 消费档入受影响文件表（Δ ±0） | `docs/core/design/PROVIDER.md:442-444` · `:524` 表内 `agent-tools/context.mjs` 行 |
| 🟡15 | 两节各补 closest-precedent 行（§6.15 → §6.22；§17 → §6.9），偏离写理由 | `docs/core/design/PROVIDER.md:291` · `docs/core/design/MODEL-SPECS.md:1657` |
| 🟡16 | 两节各补 survey-evidence 行（`publicRepos` 实读 `[]` ⇒ none relevant） | `docs/core/design/PROVIDER.md:293` · `docs/core/design/MODEL-SPECS.md:1659` |
| 🟡17 | 既有件三问表（`providers[].context` = existing but unusable；其余 none found + grep 读数） | `docs/core/design/PROVIDER.md:550` |
| 🟡18 | §17 开头声明「本节 = 实施目标形」+ 同步义务 + 判据（U-6/U-7/U-8） | `docs/core/design/MODEL-SPECS.md:1654-1655` |
| 🟡9（设计侧对齐） | 已知边界补「L3 进程内缓存、跨进程不同步；R31④ 只判已声明值」 | `docs/core/requirements/PROVIDER.md:464` |
| 🟡10（设计侧余项） | 标题「四级链」→「五级链 · 含旧键过渡层」 | `docs/core/design/PROVIDER.md:286` |
| 🔵19 | 在册读数统一到一次 `wc -l`（2026-10-23）：`model-specs.mjs` 370 · `specs.mjs` 102 · `docs/core/design/PROVIDER.md` 886 | `docs/core/design/MODEL-SPECS.md:242` · `:1563` · `:1710` · `:1712` · `:1842` |
| 🔵20 | 单位进函数名：`manualContextK` / `listedContextTokens` | `docs/core/design/PROVIDER.md:295` · `:297` · `:347-348` |

**验收**：`doc_check(mode:"gate")` 对两档 = `DOC-CHECK GATE: PASS`（0 条命中）。

**不做**：不改代码（实施轮）· 不改需求档（父侧笔）· 不新增需求判据 · 不重写 §6.15 解析链结构（只补缺项）。

## 修正轮 4（2026-10-23 · U-10 判据契约对齐 + 实施读数随正）

**触发**：实施席 §5 上抛 D2（U-10 与快照契约互斥）+「上抛·知会」（乘点读数漂移 / `CHANGELOG.md` 表行缺）。**范围**：仅两设计档；未动代码、未动需求档、未改 §6.15 结构。

**裁定（父侧）**：快照 `specForDisplay` 零兜底 = **展示面契约**（未收录 ⇒ 不显示）；核 `DEFAULT_SPEC` = **执行面兜底**（真实请求必须有窗口）——不是同一件事，不能要求相等。**改 U-10，不改快照。**

### 逐项落点（坐标 = 改后实读行）

| # | 项 | 改动 | 落点 |
|---|---|---|---|
| 1 | U-10 判据改契约口径 | 在册名（U-1 / U-8）与核 `specForModel` 逐名 `context` / `maxOutput` 相等；未收录名（U-6 `glm-5.3/zzz`）按快照自身契约 = `null`，与核 `DEFAULT_SPEC` **不比** | `docs/core/design/MODEL-SPECS.md:1753` |
| 2 | §17.4「第三载体等价」行同口径 | 在册名（U-1..U-4 · U-8 · U-9 命中名）相等；未收录名（U-5 / U-6 / U-7）快照 `null`、不比 | `docs/core/design/MODEL-SPECS.md:1732` |
| 3 | 乘点坐标 `:334` ⇒ `:361` | L1 / L2 / 旧键仍读 / 既有件三问 / survey-evidence 五处 | `docs/core/design/PROVIDER.md:294` · `:301` · `:302` · `:364` · `:555` |
| 4 | `model-specs.mjs` 行数随正 | 现量 **417**（批后 `wc -l`；批前 370，净 +47）；拆点判定 `417 ≤ 500` ⇒ 未触发 | `docs/core/design/PROVIDER.md:529` |
| 5 | `CHANGELOG.md` 表行补登 | **311** 行，+6 条（`:10-18`，含 A7 迁移说明一条） | `docs/core/design/PROVIDER.md:533` |
| 6 | 同节坐标一致性 | `lookupSpec` `:270-284` ⇒ `:271-281`（与 #3 同句改后口径对齐） | `docs/core/design/PROVIDER.md:304` |

### 实测凭据（本席 2026-10-23 实读）

- `wc -l`：`thincoder-core/model-specs.mjs` **417** · `thincoder-server/public/model-specs-snapshot.mjs` **102** · `thincoder-core/CHANGELOG.md` **311**。
- 乘点唯一：`grep "* 1024"` ⇒ `thincoder-core/model-specs.mjs:361` 恰一行。
- U-10 采样实跑（核 `specForModel` ∥ 快照 `specForDisplay`）：U-1 / U-8 两侧 = 1000000 / 128000 逐名相等；U-6 = 核 128000 / 32000 ∥ 快照 `null`；U-5 / U-7 同 U-6 形。

**验收**：`doc_check(mode:"gate")` 两档 = PASS。

## 修正轮 5（2026-10-23 · 两处「设计字面 vs 代码实读」冲突 · 父侧裁定）

**触发**：三端实施席撞出两处设计表述与代码实读不符；父侧已裁，本席按裁定改设计档 `docs/core/design/PROVIDER.md` §6.15。**未动代码、未动需求档**（R31④ 已由父侧收为「已声明值」，与本裁定同向）。

**实读凭据（本轮实读）**：

- `thincoder-desktop/src/main/providers.mjs:89-119` `providerList()` 回执 = `presets` / `active` / `defaultModel` / `providers[]`，**无 `models` 键**。
- `thincoder-desktop/renderer/mount-settings-reads.mjs:97` `loadModels` 走 `model:list`；`:72` · `:93` · `:104` 写 `settings.model.models` 切片；`:79` 注：无渠态候选行 = `{ provider, id }`。
- `thincoder-vscode/src/extension/settings.mjs:426` `fullStatus` 下发 `{ type: "models", models }`；行携 `provider`（`thincoder-vscode/src/extension/provider-probe-window.mjs:67`）。
- `thincoder-core/config-io.mjs:154` `delete p.model`；`thincoder-core/model-specs.mjs:345` L1 键取 `provider?.model ?? ""`。
- `thincoder-desktop/src/main/providers.mjs` `wc -l` = **312**。

**裁定与落点**（坐标 = 改后实读行）：

| # | 项 | 裁定 | 落点 |
|---|---|---|---|
| 1 | 候选模型载体 | 复用「开面板时已经到手」的切片，零新增请求：VSC = `fullStatus` 的 `{ type: "models", models }`；桌面 = `settings.model.models`（`provider:list` 无 `models` 键，不得作载体）；该渠无候选 ⇒ 换文本输入（不区分「无模型」∥「探测失败」） | `docs/core/design/PROVIDER.md:377` · `:405-411` |
| 2 | 卡片行展示取值 | 展示读 `modelContext` 的已声明值（逐条 `模型: NK`；单条 `NK`；无声明 `未声明` / `Not declared`），不读 `providerSpec().context`（渠道条目不携模型 ⇒ L1 永不命中 ⇒ 落到 L5 128000 / `125K`）；载荷两键不变 | `docs/core/design/PROVIDER.md:389-393` · `:415-418` · `:473` |
| 3 | 文案登记随正 | 新增 `contextNoCandidates` / `contextNotDeclared` 两键（四键 ⇒ 六键）；未声明态统一 `Not declared` / `未声明` | `docs/core/design/PROVIDER.md:423-424` · `:431-433` · `:435` |
| 4 | 用例表随正 | W-6 对齐「无候选 ⇒ 文本输入」；W-9 改已声明值口径（不得显示 `125K`）；新增 W-10 无候选 / W-11 无声明 | `docs/core/design/PROVIDER.md:444` · `:447-449` |
| 5 | AC 回指随正 | R31③ 增 W-10（手填照写）；R31④ 改「同一已声明值 K 串 + 不显示 L5 值」并带 W-11 | `docs/core/design/PROVIDER.md:501-502` |
| 6 | 受影响文件表随正 | 两档 i18n 行 +4 键 ⇒ +6 键；新增 `thincoder-desktop/src/main/providers.mjs` **312** 行 +~10（回执行面增 `modelContext` + `context`，**不加 `models`**）；`mount-settings-reads.mjs` 行注明候选切片只读 | `docs/core/design/PROVIDER.md:549` · `:553-555` |
| 7 | 计数随正 | 测试档行 W-1..W-9 ⇒ W-1..W-11；既有件三问「四键 i18n」⇒「六键」 | `docs/core/design/PROVIDER.md:557` · `:569` |

**验收**：`doc_check(mode:"gate")`（target = `D:\teamcode\thincoder`，docs = `docs/core/design/PROVIDER.md`）⇒ `DOC-CHECK GATE: PASS`，0 条命中。

**与裁定的偏离**：无。未动代码 / 未动需求档 / 未改解析链结构与载荷形状（两键保留）。

**覆盖声明**：本节覆盖上方 §2 两处旧口径——修正轮 3 的 🟡13「桌面 = `provider:list` 回执 `models`」与修正轮 2 验收表 R31④「`providerSpec(provider).context` 经 `formatContextK` 显示」（含修正轮 4 同口径引用）。以本节 + `docs/core/design/PROVIDER.md` §6.15 现文为准。

**上条更正**：「含修正轮 4 同口径引用」不成立——修正轮 4 各行（U-10 · §17.4 · 乘点坐标 · 行数 · CHANGELOG · 坐标一致性）无展示口径内容。覆盖面 = 修正轮 3 🟡13 与修正轮 2 验收表 R31④ 两处。

## 修正轮 6（2026-10-23 · 清除 = 破坏动作先确认；Esc 回取消语义 · 父侧裁定）

**触发**：CLI 席撞出设计 `docs/core/design/PROVIDER.md` §6.15 写面第 3 步「空输入 = 清除该模型的键」与 CLI 事实冲突——自由文本问句的 Esc 与空回车同返 `""`（`thincoder-cli/src/tui/key-modes.mjs:145` ∥ `:152-153`），而框内提示写 `Esc: cancel`（`thincoder-cli/src/tui/render-frame.mjs:140`）⇒ 按原设计，用户按 Esc 想取消 = **静默删掉一个已声明的值**。
  **裁定**：清除前加一次确认；**不改 `key-modes.mjs`**（平台共享键位层，为一个命令改它 = 全 CLI 的 Esc 语义都要重验）。

**范围**：仅 `docs/core/design/PROVIDER.md` §6.15。未动代码、未动需求档、未动 `key-modes.mjs`。

### 逐项落点（坐标 = 改后实读行）

| # | 项 | 改动 | 落点 |
|---|---|---|---|
| 1 | 写面四步 → 五步 | 第 3 步空输入改为「进入第 4 步清除路径，本步不直接删键」；新增第 4 步「清除路径分岔」：有已声明值 ⇒ 复用 `confirmDelete`（默认 `Cancel`）；无已声明值 ⇒ 空操作 + `Nothing to clear for <model>`；原第 4 步顺延为第 5 步并补清除回显 `Context cleared for <model>` | `docs/core/design/PROVIDER.md:374` · `:378-384` |
| 2 | 空串指向随正 | 「空串不走校验分支（走第 4 步清除路径）」 | `docs/core/design/PROVIDER.md:388` |
| 3 | 清除语义补判据 | 「已声明值」= 归一后匹配键存在（值非法的条目也算，确认行 current 段回 `Not declared`）；零匹配键 ⇒ 空操作、不留收据 | `docs/core/design/PROVIDER.md:391` |
| 4 | 用例 W-12 / W-13 | W-12 = 有值时空输入（回车 ∥ Esc）⇒ 确认框、默认 Cancel、盘上零变、无「已清除」回执；W-13 = 无值时空操作 + `Nothing to clear`；W-3 随正为「确认后删除」 | `docs/core/design/PROVIDER.md:447` · `:456-457` |
| 5 | 文案登记补两键 | `settings.providers.contextClearConfirm` / `contextNothingToClear`（zh ∥ en 逐字，含裁定给的带值确认句） | `docs/core/design/PROVIDER.md:436-437` |
| 6 | 计数与回指随正 | AC 回指 R31③ 补「空 ⇒ 确认后删（无声明 ⇒ 空操作）」+ W-12 · W-13；VSC / 桌面 i18n 行六键 → 八键；测试档行 W-1..W-11 → W-1..W-13 | `docs/core/design/PROVIDER.md:511` · `:427-428` · `:559` · `:565` · `:567` · `:579` |
| 7 | 决策与边界 | 新增 D8（清除前确认 ∥ 不改键位层 ∥ 无值不留假收据，含三项否决）；已知边界登记端面差异（本批确认只落 CLI，带解决路径与到期条件） | `docs/core/design/PROVIDER.md:496` · `:483` |
| 8 | 三端落点 ∥ 受影响文件随正 | CLI 行交互载体补「→（空输入）`confirmDelete` 确认」；`provider-admin.mjs` 现量 **385**（本轮 `wc -l`；批前 210） | `docs/core/design/PROVIDER.md:403` · `:553` |

### 实施侧实读（设计与之逐字对齐）

`thincoder-cli/src/tui/provider-admin.mjs:255-257` 无值 ⇒ `Nothing to clear for ${model}`（零写）· `:261-264` 有值 ⇒ `confirmDelete(...)`，Cancel ∥ Esc ⇒ 零动作 · `:296` 盘面已无键 ⇒ 同句 · `:311-313` 回显 `Context cleared for ${model}` ∥ `Context saved: … = <N>K`。
  `confirmDelete` = `thincoder-cli/src/tui/pickers.mjs:116-122`（`Yes, delete` ∥ `Cancel`，`defaultIndex: 1`）。

### 验收对照

| 判据 | 判定行 |
|---|---|
| ① 五步 + 空操作分支 | `docs/core/design/PROVIDER.md:374` · `:378-384`——第 4 步两分岔逐条可读 |
| ② W-12 / W-13 | `docs/core/design/PROVIDER.md:456-457`——有值取消后该键仍在、无值时空操作零写 |
| ③ 两键 | `docs/core/design/PROVIDER.md:436-437`——zh ∥ en 各一字面 |
| ④ doc_check | `DOC-CHECK GATE: PASS`（1 档，0 条命中） |

### 与裁定的偏离

- 内容零偏离：裁定三段（有值确认 / 无值空操作 / 删后回显）逐段落盘。
- 一处范围说明（非偏离，登记在册）：**端面差异**——确认只落 CLI（裁定按 CLI 碎片定），VSC ∥ 桌面仍是「留空提交即删除」。已写进 §6.15 已知边界并带上抛。

### 上抛

- **[上抛·知会]** 清除确认目前仅在 CLI 落地；两端补不补、何时补，请父侧定（设计档已把差异与到期条件写在册，不当作已合规）。
- **[上抛·知会]** `Context cleared for <model>` 未新增 i18n 键（裁定只点名两键）：CLI 内联英文，VSC ∥ 桌面以卡面行复读 `未声明` / `Not declared` 作回显。若三端要同句回执，需补第三键。

## 修正轮 7（2026-10-23 · 清除确认扩到三端 · 父侧裁定「不留只落 CLI 的边界」）

**裁定**：清除 = 破坏动作，**三端同批同形**。CLI 的即时风险来自 Esc 与空回车同值；VSC ∥ 桌面「留空 + 提交」同样是一条未确认的删除路径（清空想重填、手滑回车即删）。删掉「本批只落 CLI」的已知边界行。

**范围**：仅 `docs/core/design/PROVIDER.md` §6.15。未动代码（三端席各自在补）· 未动需求档。

### 逐项落点（坐标 = 改后实读行）

| # | 项 | 改动 | 落点 |
|---|---|---|---|
| 1 | 删已知边界「本批只落 CLI」 | 整行删除（无删除线、无「已作废」痕迹） | `docs/core/design/PROVIDER.md` 已知边界节现末条 `:501` |
| 2 | 第 4 步改三端同形 | 「有已声明值 ⇒ 先确认再删」改为三端各用本端既有确认层；补两端「留空 + 提交 = 未确认删除路径」的理由；正文键 = `contextClearConfirm`、默认焦点「取消」 | `docs/core/design/PROVIDER.md:379-383` |
| 3 | 三端落点表逐端写明确认落点 | VSC ∥ 桌面交互载体各补「→（空输入）确认层」；新增「清除确认落点」表：CLI `confirmDelete` · VSC `showConfirmPopover`（`_confirmSecretDelete` 同件）· 桌面 `confirmSecretDelete`，逐端给默认焦点 ∥ 取消径 | `docs/core/design/PROVIDER.md:405-406` · `:410-418` |
| 4 | W-12 限定载体 + 新增 W-14 / W-15 | W-12 = CLI 载体；W-14 = VSC（留空提交 ⇒ 确认、默认 Cancel、盘上零变、行面仍显原值）；W-15 = 桌面同形；表下注明三行 = 同一判据的三端各一例 | `docs/core/design/PROVIDER.md:471-476` |
| 5 | 清除回执分工登记 | 选定「不新增第三键」：CLI 内联 `Context cleared for <model>`；VSC ∥ 桌面卡面行复读 `未声明` / `Not declared` 作回执。分工理由 + 判据（行面不变 ≡ 无回执 = 缺陷）+ VSC 实读凭据 | `docs/core/design/PROVIDER.md:454-456`；第 5 步指向该条 `:384` |
| 6 | 随正 | D8 改「三端同形」+ 否决项补「只落 CLI」；AC R31③ 补 W-14 · W-15；受影响文件表增 `settings-confirm.mjs`（71 行，+~5）；测试档行 W-1..W-13 → W-1..W-15；W-3 标题与词面写明三端 | `docs/core/requirements/PROVIDER.md:514` · `:529` · `:581` · `:586` · `:462` |

### 验收对照

| 判据 | 判定行 |
|---|---|
| ① 三端同形 · 边界行已删 | 已知边界节无「只落 CLI」行（`docs/core/design/PROVIDER.md:501` 为节末条） |
| ② 逐端确认落点 | `docs/core/design/PROVIDER.md:410-418` 三行各载载体 + 默认焦点 ∥ 取消径 |
| ③ W-14 ∥ W-15 | `docs/core/design/PROVIDER.md:473-474` |
| ④ doc_check | `DOC-CHECK GATE: PASS`（1 档，0 条命中） |

### 实读凭据（本席本轮实读）

- VSC 确认层：`thincoder-vscode/webview/settings.js:57-64`（`_confirmSecretDelete` → `showConfirmPopover`，正文 `settings.secretDeleteConfirm`）· `webview/settings-widgets.js:77-105`（`:104` 焦点落「取消」· `:98-102` 框内 Esc 零动作）。
- 桌面确认层：`thincoder-desktop/renderer/settings-confirm.mjs:65-80`（`:78-79` 焦点落「取消」· `:50-54` 框内 Esc 零动作 · 正文固定 `secretDeleteConfirm` `:57`）。
- VSC 清除回执：`thincoder-vscode/webview/settings-providers.js:81-85`（清除径 `k === null` ⇒ 零提示，行面转 `未声明`）。

### 待随正（收口轮）

1. **[上抛·知会] 受影响文件表读数漂移**：设计轮记 `settings-provider-dialog.js` **279** / `mount-settings-segments-providers.mjs` **162**；本轮实读 = **439** / **292**（实施已落、设计表未随）。未在本轮清算——实施席仍在跑，终值待收口轮一次 `wc -l` 统一。

## 修正轮 8（2026-10-23 · 三处口径写错/写偏 · 父侧裁定）

**范围**：仅 `docs/core/design/PROVIDER.md` §6.15。未动代码（核面另派修正轮）· 未动需求档（R32 已在档 `docs/core/requirements/PROVIDER.md:205`）。

**实读凭据（本席本轮实读）**：

- `thincoder-core/model-specs.mjs:313-316` `formatContextK(tokens)` = `Math.round(tokens / 1024)` ⇒ 收 token；`formatContextK(128)` = `0`（K 直喂得 `0K`）。
- `thincoder-core/model-specs.mjs:350-362` L1 ∥ L2 合流分支只判 `Number.isInteger && > 0`，`:361` 直接 `kUnit * 1024`，**无量级判定**；4× 守卫只挂 L3（`:367`）。
- `thincoder-core/config-io.mjs:154` `delete p.model` ⇒ 渠道条目不携模型，`providerSpec(entry).context` 落 L5 的 128000 ⇒ `125K`。
- `thincoder-cli/src/tui/model-picker.mjs:124` 渠道行取 `declaredContextText(p)`；该出口 = `thincoder-cli/src/tui/provider-admin.mjs:367-371`，写面选渠道行 `:225`。
- 静态表 `glm-5.3` 行 context = 1_000_000（`thincoder-core/model-specs.mjs:69`）⇒ W-16 / W-17 的阈值与判据按此算。

### 逐项落点（坐标 = 改后实读行）

| # | 项 | 改动 | 落点 |
|---|---|---|---|
| 1 | 量级守卫归属 | `:390` 改为「守卫不在端侧；写面只判正整数 K，量级判定由核 `providerSpecResolution` 承担（R32）」；新增「人工声明的量级守卫（L1 ∥ L2 · R32）」小节：判点 `model-specs.mjs:361`（与 L3 `:367` 对称）· 阈值 K×1024 > 静态×4 · 照用不截断 · 去重键 provider+模型+K · 决策表增 D9 | `docs/core/requirements/PROVIDER.md:360-367` |
  `:399` · `:351` · `:531` |
| 2 | 格式器 K/token 口径 | 取值改交核导出 `formatDeclaredContextK(k)`（收 K，内部 `formatContextK(k*1024)`——展示换算单点）；写明「端侧 ×1024 再调 `formatContextK`」不可选（三个换算点 + K 直喂得 `0K`）；两导出分工登记；`:433` ∥ W-9 ∥ 受影响文件表 ∥ 三问表随正 | `docs/core/design/PROVIDER.md:403-406` · `:409` · `:410` · `:446` · `:481` · `:584` · `:615` |
| 3 | `/model` 渠道行取值 | 写明该行 ∥ 写面选渠道行都读已声明值、**不取 `providerSpec(entry).context`**（渠道条目不携模型 ⇒ 落 L5 ⇒ `125K`）；行形与卡片一致（逐条 `模型: NK` / 单条 `NK` / 无声明 `未声明`）；死指针 `provider-admin.mjs:180` 换为实读落点 `model-picker.mjs:124` ∥ `provider-admin.mjs:225` ∥ 出口 `:367-371` | `docs/core/design/PROVIDER.md:444-445` |
| 4 | 用例 W-16 / W-17 | W-16 = 手改 JSON 声明 `262144` ⇒ 268435456 未被截断 + 告警恰一次；W-17 = 声明 `128` ⇒ 131072、零告警（静态 1_000_000 ×4 = 4_000_000）；表下注明两例 = R32 两端 + 「守卫在核」的判别形 | `docs/core/requirements/PROVIDER.md:488-489` · `:492` |
| 5 | AC 回指 R32 | 回指表标题 R24–R31 → R24–R32，新增 R32 行（判据 + W-16 · W-17） | `docs/core/requirements/PROVIDER.md:533` · `:549` |

**验收**：`doc_check(mode:"gate")`（target = `D:\teamcode\thincoder`，docs = `docs/core/design/PROVIDER.md`）⇒ `DOC-CHECK GATE: PASS`，0 条命中。

**与裁定的偏离**：无。父侧给的两支里选「新增收 K 的入口」——理由：端侧 ×1024 是三个换算点，与本节点既有「端侧不得自己乘 1024」冲突。

**计数随正**：单元测试档行 `P-1..P-13 ∥ W-1..W-17 ∥ G-1..G-2`（+~180）；`model-specs.mjs` 拆点判定补「本轮 ≈ +10 ⇒ ≈ 427 ≤ 500 软线」。

## 修正轮 9（2026-10-23 · VSC 面交付后三处文档欠账 · 父侧裁定）

**范围**：设计档三处——`docs/vsc/design/SETTINGS.md` · `docs/vsc/design/WEBVIEW-PROTOCOL.md` · `docs/core/design/PROVIDER.md`。未动代码、未动需求档。

### 本批条目（补登）

| # | 条目 | 设计落点（单源） |
|---|---|---|
| 14 | VSC 新协议对登记（`saveProviderModelContext` ∥ `providerContextSaved`）+ providers 卡 `Context…` 入口 | `docs/vsc/design/SETTINGS.md` §2.21；协议登记表 = `docs/vsc/design/WEBVIEW-PROTOCOL.md` §3.2 行 35 ∥ §12 ∥ §13 |
| 15 | 受影响文件表补 VSC 侧四行 + `settings.mjs` 性质改「转口 + 两键入载荷」 | `docs/core/design/PROVIDER.md` §6.15「受影响文件」 |
| 16 | 非法声明值展示口径（卡面 = `未声明` ∥ 弹窗回填盘面原值 ∥ 盘上零改写） | `docs/core/design/PROVIDER.md` §6.15「读面回显」+ 用例 W-18 |

### 逐项落点（坐标 = 改后实读行）

| # | 改动 | 落点 |
|---|---|---|
| 1 | 新增 §2.21：机制单源指针 · `Context…` 入口 · 上行 ∥ 回执载荷 · 状态面 · 机检 · 边界 | `docs/vsc/design/SETTINGS.md:624-641` |
| 2 | 协议增量登记新增行 35（新消息对）+ 计数「三十四项 ⇒ 三十五项」 | `docs/vsc/design/WEBVIEW-PROTOCOL.md:86` · `:129` · `:131` |
| 3 | §12 收面表增 `providerContextSaved` 行 | `docs/vsc/design/WEBVIEW-PROTOCOL.md:420` |
| 4 | §13 发面表增 `saveProviderModelContext` 行 | `docs/vsc/design/WEBVIEW-PROTOCOL.md:502` |
| 5 | 非法声明值展示规则（与「无键」同面 + 弹窗回填盘面原值 + 盘上零改写） | `docs/core/design/PROVIDER.md:409-410` |
| 6 | 用例 W-18 + 表下判据说明 | `docs/core/design/PROVIDER.md:492` · `:496` |
| 7 | AC 回指 R31④ 补 W-18 | `docs/core/design/PROVIDER.md:551` |
| 8 | `settings.mjs` 行改性质（443 行，转口 + 两键入载荷） | `docs/core/design/PROVIDER.md:597` |
| 9 | 受影响文件表增四行（`provider-context.mjs` 88 ∥ `panel-messages.mjs` 400 ∥ `chat-messages.js` 301 ∥ `settings.js` 204，均本轮 `wc -l`） | `docs/core/design/PROVIDER.md:600-603` |
| 10 | 测试档计数 W-1..W-17 ⇒ W-1..W-18；表读数注随正 | `docs/core/design/PROVIDER.md:612` · `:614` |

### 验收对照

| 判据 | 判定行 |
|---|---|
| ① docs/vsc/design/SETTINGS.md 登记协议对与入口 | `docs/vsc/design/SETTINGS.md:624-641`（双向载荷 · 分发 `panel-messages.mjs:318` · 回执消费 `chat-messages.js:170` · 入口 `settings-providers.js:120`）+ `docs/vsc/design/WEBVIEW-PROTOCOL.md:129` 行 35 |
| ② 受影响文件表四行 + `settings.mjs` 性质 | `docs/core/design/PROVIDER.md:597` · `:600-603` |
| ③ 非法声明值展示一条 + W-18 | `docs/core/design/PROVIDER.md:409-410` · `:492` · `:496` · `:551` |
| ④ doc_check | `DOC-CHECK GATE: PASS`（3 档，0 条命中） |

### 偏离与处置

| # | 偏离 | 原因 / 处置 |
|---|---|---|
| D1 | 任务书只点名 docs/vsc/design/SETTINGS.md，本席同笔改 `docs/vsc/design/WEBVIEW-PROTOCOL.md` 三处 | §3.2 是消息增量的权威登记表，纪律 =「新增 / 变更一律入本节登记表」；§2.18 先例的指针行（§3.2 行 25 + §12 对表行）若照抄而表内无行 = 死指针。补齐后 §2.21 的指针行可解析 |
| D2 | 同笔修 19 条既有「档缺」指针（docs/vsc/design/SETTINGS.md 13 · docs/vsc/design/WEBVIEW-PROTOCOL.md 6） | 交付门按整档判，旧裸名指针使两档 REFUSED ⇒ 按「锚点必须可解析」补全为仓根相对路径（产品树 `docs/vsc/design/WEBVIEW.md` 指向其现存 `_archive` 路径）；零语义改 |
| D3 | `provider-context.mjs` 现量 88 行（实施席上抛记 70） | 实施后修正轮有增行；本轮 `wc -l` 实读 = 88 |

### 需随正（收口轮）

1. **[上抛·知会] 表内既有 VSC 行读数漂移**：本轮实读 `settings-providers.js` **180**（表 145）· `settings-provider-dialog.js` **494**（表 279）· `panel-messages-settings.mjs` **321**（表 301）· `locales/zh·en.json` **362·362**（表 353·353）·
   · `desktop/renderer/views/settings.mjs` **464**（表 453）· `mount-settings-segments-providers.mjs` **328**（表 162）。
   按任务书范围只补四行 + `settings.mjs`；其余终值统一留收口轮一次 `wc -l`。
2. **[上抛·知会] 非法声明值口径目前只落文档**：卡面 ∥ 弹窗现实现是否已满足「非法 ⇒ `未声明` + 弹窗回填盘面原值」未在本轮改动（任务书：不动代码）；如需改码另派。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

### 评审对象
设计 `docs/core/design/PROVIDER.md` §6.15（模型上下文解析四级链 + 三端写面）· `docs/core/design/MODEL-SPECS.md` §17（模型名末段唯一）· 需求 `docs/core/requirements/PROVIDER.md` §4.8 R24–R31（判据源）。三档全文实读；未读源码（作用域外），行数读数未能对盘核对。

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Document ownership | 🔴 | mikan：`kimi/kimi-k3` alias 行两处结论相反——`docs/core/design/PROVIDER.md:201`「能力差异全走规格表；`kimi/kimi-k3`（router 前缀）与 `k3` 保留显式 alias 行」vs `docs/core/design/PROVIDER.md:161`「`kimi/kimi-k3` 显式 alias 行**退役**」+ `docs/core/design/MODEL-SPECS.md:1669`「**`kimi/kimi-k3` 行退役**：末段 `kimi-k3` 已达同值行」。同一机制两种描述，实施侧读到哪条决定删不删行 | 定一条：以 §6.9/§17.1「退役」为准 ⇒ 删 §6.11 该半句（或反向以 §6.11 为准并回收 §6.9/§17.1 的退役理由）；同时核 §17.3 的 `-10` 差值口径 |
| 2 | Document ownership | 🔴 | `/glm-5.3` 守卫端差两档相反——设计 `docs/core/design/MODEL-SPECS.md:1693`「**端差消除**：原「核 `slash > 0` ∥ VSC `slash >= 0`」认账行随本规则退役……`/glm-5.3` 两端同判命中（U-8 / V-4）」+`:1727`「需求档 §4.6 已由主 agent 同拍收正」；需求 `docs/core/requirements/PROVIDER.md:148` 仍写「守卫为既有端差（核 `slash > 0` ∥ VSC `slash >= 0`……），**不动、显式认账**」。所声称的同拍收正未落该句 | 收正需求 §4.6 末句为「守卫随末段唯一退役，`/glm-5.3` 两端同判命中」（或反向改设计 U-8/V-4 期望为核 miss）；两档同一句逐字对齐后再实施 |
| 3 | Clarity | 🟡 | 「三面同一把尺子」与实际算子不符：`docs/core/requirements/PROVIDER.md:160`「**不得出现第二套匹配语义。**」+`docs/core/design/MODEL-SPECS.md:1658`，但静态表仍是段内**前缀**匹配（`docs/core/requirements/PROVIDER.md:158`「`lookupSpec` **只**在按 `/` 拆分后的最后一段上做大小写不敏感的前缀匹配」），`modelContext`/列表侧是末段**相等**（`docs/core/requirements/PROVIDER.md:313`「双侧取末段、大小写不敏感、末段相等即命中」） | 逐面写明算子差（静态表 = 段内前缀；`modelContext`/列表 = 末段相等），并补一条判别用例：用户键 `glm-5.3` × 模型 `glm-5.3-flashx` ⇒ 不命中（防按前缀语义实现而违反 R29③） |
| 4 | Clarity | 🟡 | 歧义处置射程未定：`docs/core/requirements/PROVIDER.md:322`「同一侧两条键归一后相同……⇒ 该层视为未提供、落下一层，并告警一次」——「该层」= 该模型还是整个 L1（后者会连带废掉同渠道其它模型的声明，与 R29③ 不继承原则冲突） | 写明「仅该模型视为未提供」，与同段列表侧 `docs/core/requirements/PROVIDER.md:322`「该模型在 L3 视为未报」同口径 |
| 5 | Clarity | 🟡 | 写面值校验谓词不可直用：`docs/core/design/PROVIDER.md:367`「判据与读面同一个谓词（`positiveInt`）」，而 `docs/core/design/PROVIDER.md:334` 的 `positiveInt(v)` 判据含 `typeof v === "number"`——交互输入是字符串，直用会全量拒绝 | 写明「parse 成 Number → `positiveInt`」，并钉死边界输入（`"128"` 收 / `"128K"` `"1.5"` `"-1"` `""` 拒）与报错行逐字 |
| 6 | Acceptance | 🟡 | 读链无验收/用例映射：§6.15 只有写面「情形」表（`docs/core/requirements/PROVIDER.md:401-411`），R24–R28 的链解析、非法值、歧义、异常值、列表不报均无用例号/AC 回指（对照 `docs/core/design/MODEL-SPECS.md:1711-1712` §17.4 与 `:1729` §17.6 的形态） | 补 §6.15 的 AC 回指表 + 用例表（L1–L5 逐层命中 / 三字段序 / 非法值 / 两键相撞 / 4× 异常值 / 列表不报零变），用例号唯一 |
| 7 | Affected files | 🟡 | §6.15 自身的受影响文件面无读数：`docs/core/design/PROVIDER.md:57` 只给指针（`docs/core/design/CORE-UNIFICATION.md` §2.8，本轮作用域外 ⇒ 未核），而本节将新增 `thincoder-core/model-context.mjs` 并改 `model-specs.mjs` / `list-models.mjs` / `config.mjs` / 三端 UI 约十余档；无逐档现量 + Δ，也未写 `model-specs.mjs` 是否触发既有拆点（§16.7/§18.5 都写了「∉ 实质改动 / 拆点未触发」） | 在本档补受影响文件表（逐档 `wc -l` 现量 + `≤±N`），并对 `model-specs.mjs` 给出拆点判定（370 − §17 的 10 + §6.15 增量 ≤ 500 的算式） |
| 8 | Affected files / Acceptance | 🟡 | §17.3 表缺两类读数：`docs/core/design/MODEL-SPECS.md:1729`「落点 = 单元测试档（拟新增）」但 §17.3 无该测试档行（无现量/Δ）；`:1703` 服务器快照行只写「同形第三载体（`:97`）」无行数；且第三载体无任何验收用例（U-/V- 只覆盖核与 VSC） | 补测试档行（现量 + Δ）；给快照档现量；为第三载体加一条等价性断言（或以核表生成并 diff 的机检） |
| 9 | Requirements | 🟡 | R31④ 三端同显与机制不自洽：需求 `docs/core/requirements/PROVIDER.md:207`「④ 三端读面回显一致（同一渠道同一模型三端显示同一个窗口值）」；设计 `docs/core/requirements/PROVIDER.md:390` 以「同一函数、同一配置、同一链、同一格式器出词」声称成立，但 L3 是**进程内**模块缓存（`docs/core/requirements/PROVIDER.md:296-298`），桌面端不在六个写面消费面内 ⇒ 同渠道同模型 VSC 显列表值、桌面显静态值 | 把 R31④ 的射程收为「已声明值（K）三端同显」，并把「L3 跨进程不同步」写入 §6.15 已知边界（与 `:432` 的「会话从不拉取 ⇒ L3 缺席」并列）；或给桌面补写面入口 |
| 10 | Requirements | 🟡 | 层级计数两档不一：需求 `docs/core/requirements/PROVIDER.md:200`「① 四源各不相同 ⇒ 取 modelContext[模型]；② 去人工声明 ⇒ 取列表值」按四级写判据，而同一档 `:187` 又把旧键置于列表之上（五级）；设计的 L1–L5 是对的，但 §6.15 标题仍称「四级链」（`docs/core/requirements/PROVIDER.md:277`）⇒ R24② 在含旧键配置下字面不成立 | 需求 R24 改名/改判据为五级（含 L2 旧键位），设计标题同步为「五级链（含旧键过渡层）」；`docs/core/requirements/PROVIDER.md:292` 的裁定理由保留为 L2 位次依据 |
| 11 | Requirements | 🟡 | R31② 无可核凭据：需求 `docs/core/requirements/PROVIDER.md:207`「② 全仓无代码路径写入 `providers[].context`」；设计只写「不再写入新配置」（`docs/core/requirements/PROVIDER.md:349`）与删一处 CLI 命令，未枚举现存写者也未给 grep 结论（本档 §9.1 有「本轮实 grep 入仓码面」的先例形态） | 补一行「现存写者枚举 + 全仓 grep 判据（`context` 写路径零命中）」，并指明迁移/装载面不产该键 |
| 12 | Clarity / Acceptance | 🟡 | 新增四键只有英文逐字：`docs/core/design/PROVIDER.md:395` 列 VSC 四键、`:396` 桌面四键，`:397-398` 只给一条英文句；两端为双语端（本档先例 `docs/core/design/PROVIDER.md:651`「zh ∥ en 字面」）⇒ zh 字面缺失，验收无法逐字断言 | 补四键的 zh 字面（与英文同键两字面），并把「非法值报错行」也按 zh/en 各给逐字 |
| 13 | Feasibility | 🟡 | 两端写面的候选来源未落载体：`docs/core/design/PROVIDER.md:361` 只说「候选 = 该渠道 `/v1/models` 的 id；列表拉不到 ⇒ 允许手填」；VSC/桌面两行的载荷键未指名（CLI 有 `model-catalog.mjs` 缓存可依），GUI 侧要么复用既有探针载荷要么新拉——两者机制后果不同 | 在「三端落点」表补「候选载荷键 / 复用哪次配置阶段探针结果」，并写明手填路径在 GUI 的入口形 |
| 14 | Clarity | 🟡 | `windowSource` 闭集扩到 5 值但消费面未列：`docs/core/design/PROVIDER.md:415-416`「闭集 = `modelContext` ∥ `provider-override` ∥ `list` ∥ `spec` ∥ `default`……文案形态不变」——`thincoder-core/agent-tools/context.mjs:101` 现只有两值映射，需改而未进任何受影响文件面，且「文案形态不变」与「新增三值」如何相容未说 | 写明该消费点的新映射（新增三值各落哪条文案 / 是否合并为「人工声明 / 列表 / 静态」三类），并把该档列入受影响文件表 |
| 15 | Methodology | 🟡 | 无 closest-precedent 行：§6.15（`docs/core/design/PROVIDER.md:277-447`）与 §17（`docs/core/design/MODEL-SPECS.md:1652-1756`）均无「实现坐标 ∥ 对应设计节 ∥ 先例批次」+ 对齐/偏离理由；本档先例形态 = `docs/core/design/PROVIDER.md:708`「**先例（closest-precedent）**：……」 | 两节各补一行先例对照（§6.15 可对位 §6.22 运行时统一解析；§17 可对位 §6.9 既有查表机制），偏离项写理由 |
| 16 | Methodology | 🟡 | 无 survey-evidence 行：两节均未登记「查过哪些公共源文档（独立文档仓优先）∥ 有无相关」，§6.15 的「为什么不是预取注入 / async」与 §17 的「旧法误命中面」均只由推理支撑 | 各补一行源档勘察记录（如参考系的模型列表解析 / 规格查表实现），无相关也显式写「none relevant」 |
| 17 | Methodology | 🟡 | 无既有件三问：新增名 `modelContext`（配置键）· `model-context.mjs`（新模块）· `providerSpecResolution` / `formatContextK`（新导出）· 四键 i18n · `Context…` 钮文案，均无「住哪 · 逐字名 · 谁」的 `existing: …` / `none found: …` / `existing but unusable: …` 答复（`formatContextK` 只隐含自 `fmtContextK` 上提，未按三问写） | 补一张三问表；`providers[].context` 属「existing but unusable」（粒度 + 单位事故），i18n 键与钮文案给 `none found: …` 或复用键的逐字证据 |
| 18 | Document ownership | 🟡 | 复述越自订纪律：`docs/core/design/MODEL-SPECS.md:5`「本文只登记**规格表面**并引用它（`doc:section` 形式），不复述」，而 §17.1–§17.2（`:1656-1689`）完整复述规则 + 目标代码，与 `docs/core/design/PROVIDER.md:158-162` 双份描述（无矛盾但两处会各自漂） | 二选一：把目标代码搬进 `docs/core/design/PROVIDER.md` §6.9（机制单源）由 §17 引用；或在 §17 开头声明本节 = 实施目标形（并给同步义务与判据） |
| 19 | Doc state | 🔵 | 数值漂移（R7c）：`docs/core/design/MODEL-SPECS.md:1701` 记 `thincoder-core/model-specs.mjs` **370**、`:1830` 记 **359**、`:1563` 记 **348**；`:1702` 记 `thincoder-vscode/src/specs.mjs` **102**、`:242` 记 **84**；`:1704` 记 `docs/core/design/PROVIDER.md` **825**，而本轮实读该档共 886 行 | 本批把在册读数统一到一次 `wc -l`（注明口径与日期），后续各节引用同一读数 |
| 20 | Clarity | 🔵 | 单位只靠文档纪律：`docs/core/design/PROVIDER.md:243`「**单位是 K**」、`:334`「单位差只在乘点」，而两个取值函数（`manualContext` 返 K、`listedContext` 返 token）名字不带单位——历史上两起 ×1024 事故正出在此 | 名称直接带单位（`manualContextK` / `listedContextTokens`），或返回值改 `{value, unit}` 让乘点强制显式分支 |

**计数**：🔴 2 · 🟡 16 · 🔵 2。

**未核项（作用域限制，写明口径）**：① 本评审按声明只读三档，未读源码 ⇒ 所有 `file:line` 引用与行数读数均按设计档自述采信，未与盘面核对；② 项目无独立标准档，文档地图（`AGENTS.md` 声明的 `docs/README.md`）不在作用域 ⇒ 归属判定按两档自述的分层纪律（需求层 ↔ 设计层镜像、D2 单一权威源）与 `AGENTS.md` 惯例判定；③ §5 的受影响文件总表在作用域外的 `docs/core/design/CORE-UNIFICATION.md` §2.8，是否覆盖 §6.15 新增档未能核。

VERDICT: changes-required

### 轮次 2（评审子代理）

## 第 2 轮复核（上一轮 20 条 · 2🔴/16🟡/2🔵）

实读三档（docs/core/requirements/PROVIDER.md 214 行 · docs/core/design/PROVIDER.md 998 行 · docs/core/design/MODEL-SPECS.md 1884 行）＋ 复核修复脚本 `.thincoder/tmp/fix-req-from-review.mjs`（其三条需求侧编辑均已落：:148 / :189+:201 / :208）。

| # | Orig# | File | Severity | Status | Notes |
|---|---|---|---|---|---|
| 1 | 1 | docs/core/design/PROVIDER.md | 🔴 | Fixed | §6.11 已改：「（`kimi/kimi-k3` 行已退役——规则单源 §6.9）」（:210），与 :170 / MODEL-SPECS :1678 一致；全档 grep 无「保留显式 alias 行」残留 |
| 2 | 2 | docs/core/requirements/PROVIDER.md | 🔴 | Fixed | :148 已改「**原守卫端差随本规则退役**——核 `slash > 0` 与 VSC `slash >= 0` 两端统一为「末段为空才算未命中」」，与 MODEL-SPECS :1702 / :1737、U-8 / V-4 对齐；:1738 的「已同拍收正」现为真 |
| 3 | 3 | docs/core/design/PROVIDER.md | 🟡 | Fixed | §6.9 新增逐面算子表（:161-165）+ 「**算子差不得越面**」（:167）+ 判别例 `glm-5.3` × `glm-5.3-flashx` ⇒ 不命中（:164）；P-10 钉用例；§17.1（:1667）同口径 |
| 4 | 4 | docs/core/design/PROVIDER.md | 🟡 | Fixed | :337 射程收为「**仅该模型**在 L1 视为未提供、落下一层……**不废整层**」，列表侧同口径；P-11 / P-12 落用例 |
| 5 | 5 | docs/core/design/PROVIDER.md | 🟡 | Fixed | :383「**值校验 = 先 parse 再判**」+ `Number(String(v).trim())` → `positiveInt`，:384 钉边界输入（`"128"` 收 / `"128K"`·`"1.5"`·`"-1"`·`"abc"`·`"0"` 拒） |
| 6 | 6 | docs/core/design/PROVIDER.md | 🟡 | Fixed | :479 新增「**验收回指（R24–R31）**」逐行可机判 + :496「**用例表（读链）**」P-1..P-13（含边界 / 错误类） |
| 7 | 7 | docs/core/design/PROVIDER.md | 🟡 | Fixed | :524 新增受影响文件表（14 档 + 测试档，逐档现量 + Δ，含 `model-context.mjs` 新档）+ :529 拆点判定「370 − 10 + 59 = 419 ≤ 500 软线 ⇒ 拆点未触发」 |
| 8 | 8 | docs/core/design/MODEL-SPECS.md | 🟡 | Fixed | :1712 快照现量 **106**；:1715 补测试档行（+~90）；:1732 第三载体等价判据 + U-10（:1753） |
| 9 | 9 | docs/core/requirements/PROVIDER.md | 🟡 | Fixed | :208 ④ 已收为「三端**已声明值**回显一致……L3 列表值是进程内缓存、跨界不同步，属已知边界，不纳入本判据」；设计 :464 / :493 同口径 |
| 10 | 10 | docs/core/requirements/PROVIDER.md | 🟡 | Fixed | :189「**五级优先级（用户裁定 A + 旧键过渡层）**」+ 五条编号；:201 R24 改「**五级链落地**」；设计标题 :286 同步「五级链」 |
| 11 | 11 | docs/core/design/PROVIDER.md | 🟡 | Fixed | :514 新增「R31② 凭据（写者枚举 + grep 判据）」，三写者逐坐标 + G-1 / G-2（:522）；残留口径问题另立 New#21 |
| 12 | 12 | docs/core/design/PROVIDER.md | 🟡 | Fixed | :421-426 四键表补齐 zh 字面（如 :424「`上下文窗口 <provider>:<model>，单位 K（当前: <N>K — 例：128 = 128K；留空清除）：`」）+ :428 未声明态 zh / en |
| 13 | 13 | docs/core/design/PROVIDER.md | 🟡 | Fixed | :403-406「**候选载体（载荷键 · 零新增请求）**」点名 VSC `fullStatus` → `{ type:"models", models }`、桌面 `provider:list` 回执 `models` 键，且明示不新拉 |
| 14 | 14 | docs/core/design/PROVIDER.md | 🟡 | Fixed | :446「**映射 = 恒等**（五个枚举值原样入括号）……**不并类**」+ 该档进受影响文件表（:532 Δ=±0） |
| 15 | 15 | docs/core/design/PROVIDER.md | 🟡 | Fixed | :291「**先例（closest-precedent）**：对位 = 同档 §6.22」＋对齐 / 偏离（模块级缓存的理由）；MODEL-SPECS :1657 同项 |
| 16 | 16 | docs/core/design/PROVIDER.md | 🟡 | Fixed | :293-295「**survey-evidence**：查过 `PROJECT-MANIFEST.json` 的 `index.publicRepos`（实读 = `[]`）……**none relevant**」；MODEL-SPECS :1659-1661 同项 |
| 17 | 17 | docs/core/design/PROVIDER.md | 🟡 | Fixed | :550-558「**既有件三问**」逐件答复（旧键 existing but unusable / 新键与新模块 none found / 四键 i18n none found） |
| 18 | 18 | docs/core/design/MODEL-SPECS.md | 🟡 | Fixed | :1654 改「**本节 = 实施目标形**……规则单源 = `docs/core/design/PROVIDER.md` §6.9……本节不复述理由」+ :1655 同步义务；判据强度问题另立 New#23 |
| 19 | 19 | docs/core/design/MODEL-SPECS.md | 🔵 | Fixed | 读数已统一：model-specs.mjs 三处（:1563 / :1710 / :1842）均 **370**（2026-10-23 `wc -l`）；specs.mjs :242 / :1711 均 **102**；残留自指读数另立 New#22 |
| 20 | 20 | docs/core/design/PROVIDER.md | 🔵 | Fixed | :301 / :303 / :350 单位进函数名（`manualContextK` / `listedContextTokens`），乘点唯一（:302 `model-specs.mjs:334`） |
| 21 | (new) | docs/core/requirements/PROVIDER.md | 🟡 | New | R31② 判定句与设计验收口径不同：「② 全仓无代码路径写入 `providers[].context`；」（:208）vs 设计「**生产面零写** `providers[].context`」（docs/core/design/PROVIDER.md:491），且设计保留两处核面写者：「**保留**：只读旧盘面、不产新键（R31② 射程 = 不写入**新**配置）」（docs/core/design/PROVIDER.md:519），G-2 的 grep 面不含 `thincoder-core`（:522）。字面判据不可达 ⇒ 收正需求 ② 为「生产面零写（迁移 / 装载归一不产新键）」，或把 G-2 扩到核面并钉两处已知例外 |
| 22 | (new) | docs/core/design/MODEL-SPECS.md | 🔵 | New | 自指现量漂移：:1713「| `docs/core/design/PROVIDER.md` | **886**（同上读数） |」，本轮实读该档共 998 行（修复轮 +~112 行）⇒ 复读后重钉读数或删该格 |
| 23 | (new) | docs/core/design/MODEL-SPECS.md | 🔵 | New | 同步义务判据强度：:1655「**判据** = §17.6 的判别用例（U-6 / U-7 / U-8）把两处钉在同一行为上——任一处单改 ⇒ 用例红」——三例只钉代码行为，改 §6.9 表文而不改码时用例仍绿；建议把该义务落成 review 清单项或加文档文本断言 |
| 24 | (new) | docs/core/design/PROVIDER.md | 🔵 | New | `formatContextK` 的 VSC import 面未点名：:389「三端取 `providerSpec(provider).context`（token 值；VSC 经 `thincoder-vscode/src/specs.mjs:17` 转口），再用**同一个** `formatContextK(tokens)` 出展示串」只给了 `providerSpec` 的转口；若格式器同经该转口 ⇒ `specs.mjs` 需 +1 行而 :528-546 表未列（该档只在 §17.3 以 §17 的 ±0 出现） |

计数：🔴 0 · 🟡 17（16 已修 + 1 New）· 🔵 3（2 已修 + 1 New + 2 New）→ 合计 Fixed 20 / New 4。

未核项：① 未读源码（作用域外）⇒ 引用坐标与 `wc -l` 读数按设计档自述采信；② 无独立标准档，文档地图（`AGENTS.md` → `docs/README.md`）不在作用域 ⇒ 归属判定按两档自述分层纪律 + `AGENTS.md` 惯例；③ §5 指向的 `docs/core/design/CORE-UNIFICATION.md` §2.8 在作用域外，未核是否与 §6.15 本档表冲突。

VERDICT: pass

## §4 用户批准（主 agent）

**批准（主 agent 代记）**

用户整批令覆盖批准门（FR36）：2026-10-23 17:48「自动跑完」——批内全链自动跑完，批准不止步。

**评审轨迹**：
- 第 1 轮（`#14`）：changes-required —— 🔴2（`kimi/kimi-k3` 行留退相反 · `/glm-5.3` 守卫端差两档相反）/ 🟡16 / 🔵2。
- 修正轮（`#15`）：20 条逐条落地；父侧同轮改需求侧三条（守卫退役 · R24 五级 · R31④ 收射程）。
- 第 2 轮（`#16`）：**pass** —— 🔴 清零，20 条全部 Fixed；新增 4 条 🟡/🔵 均为非阻塞（R31② 口径随动 · 自指读数 · 同步义务判据偏弱 · 格式器 import 面）。

**批准结论**：设计与需求一致，进入实施。评审发现表全文 = 本档 §3。

**实施切分（按面，各 ≤15 档）**：
1. 核面（`model-context.mjs` 新建 + `model-specs.mjs` / `list-models.mjs` / `config.mjs` / `agent-tools/context.mjs` / 服务端快照）
2. CLI 面（`provider-admin.mjs` / `model-picker.mjs`）
3. VSC 面（webview 三档 + 宿主两档 + `specs.mjs` 转口）
4. 桌面面（renderer 五档）

依赖：2 / 3 / 4 依赖 1（共用 `formatContextK` / `providerSpecResolution`）。

## §5 实施记录（eng-coder）

**状态行**：实施完成（修正轮 9：R32 量级守卫 + formatDeclaredContextK（2026-10-23））

### 交付（核面 · 本批条目 1-8）

| # | 改动 | 坐标 |
|---|---|---|
| 1 | 新模块 `model-context.mjs`：模块级只读缓存 · 键归一（末段 + 小写）· `positiveInt` 值域校验 | `thincoder-core/model-context.mjs:1-112` |
| 2 | 两入口 `manualContextK`（返 K）∥ `listedContextTokens`（返 token）；写面 `recordListedContext`（整条替换） | `thincoder-core/model-context.mjs:53-96` |
| 3 | 告警单点 `warnContextOnce`（本模块唯一 console.warn） | `thincoder-core/model-context.mjs:37-43` |
| 4 | `lookupSpec` 改末段唯一（`lastIndexOf("/")` + 空段守卫，删完整名先扫）；`kimi/kimi-k3` 行退役 | `thincoder-core/model-specs.mjs:271-281` |
| 5 | 五级链 L1→L5；`providerSpecResolution`（带 `source`）∥ `providerSpec` = `.spec`；唯一 ×1024 在 L1∥L2 合流点 | `thincoder-core/model-specs.mjs:344-382`（乘点 `:361`） |
| 6 | `formatContextK(tokens)` 核导出（CLI `fmtContextK` 逐字上提） | `thincoder-core/model-specs.mjs:311-316` |
| 7 | `listModels` openai 分支收 `id → 窗口`（三字段按序取首个合法值），返回前写缓存；返回仍 `string[]` | `thincoder-core/provider/list-models.mjs:61-90` · `:123-139` |
| 8 | `modelContext` 装载归一（非法 = 未声明 + 告警一次，不留空对象） | `thincoder-core/config.mjs:267-289` |
| 9 | `requestBudget().windowSource` 改读 `providerSpecResolution().source`（五值恒等，不并类） | `thincoder-core/config.mjs:97-116` |
| 10 | 消费面恒等映射（注释随动，零新分支） | `thincoder-core/agent-tools/context.mjs:94-101` |
| 11 | 第三载体 `specForDisplay` 随末段唯一；退役死行 `kimi/kimi-k3` | `thincoder-server/public/model-specs-snapshot.mjs:94-103` |
| 12 | 旧键迁移说明（A7） | `thincoder-core/CHANGELOG.md:8-18` |
| 13 | 批次单元档（收口删）：P-1..P-13 ∥ U-1..U-10 ∥ 单参 budget ∥ 形态/失败面 | `thincoder-core/test/model-context.test.mjs`（20 用例） |

### 偏离与处置

| # | 偏离 | 原因 / 处置 |
|---|---|---|
| D1 | 快照同批删了 `kimi/kimi-k3` 死行（设计受影响文件表记「±0，一 token + 注改」） | 末段唯一下该键不可达，核表已退役；两轮独立审计均判载体与源漂移。零行为变化，按设计 §6.9「留行即死行」收正 |
| D2 | U-10 设计与快照契约字面冲突（设计要求 U-6 ⇒ `DEFAULT_SPEC` 相等；快照契约 = 未收录零兜底 `null`） | 未改任一侧：改快照 = 改服务端展示契约（另面），改设计 = 设计席笔。测试注释留痕；待设计侧裁决，不静默改判 |
| D3 | `config.mjs` re-export 面扩到五名（+`providerSpecResolution` / `formatContextK`） | 三端写面另席共用同一导入面（现有 CLI import 面 = `@thincoder/core/config.mjs`）；新增两导出为设计 §6.15 明列导出，旧三名契约未删 |
| D4 | 设计未点名的模块导出：`warnContextOnce` / `normalizeModelKey` / `recordListedContext` / `_resetModelContextForTest` | model-context 的实现面（设计只定两入口名）；告警集中一处是「去重键生效」的机检前提 |

### 内部审计与评审轮次

| 轮 | 类型 | 结论 | 处置 |
|---|---|---|---|
| 1 | explore 偏差审计（只读） | clean——部分实现 / 静默简化 / 文档漂移 / 清单外改动 四类零命中；7 条 🔵 观察 | 2 条落地：L3 读面写时建归一索引（读 = 一次 Map 查表）；陈旧注释改口 |
| 2 | advisor 代码评审（轮 1） | changes-required——🔴1 · 🟡5 · 🔵2 | 修正轮 1 次（明细见下） |
| 3 | advisor 代码评审（轮 2） | pass——🔴 已修且有回归用例；🟡4 修 / 1 收口（文档侧待裁）；🟡1 协调项（即本条 §5）；🔵2 有理由收口 | 终端状态 clean |

**修正轮明细（1 次 · ≤5）**

1. 🔴 `requestBudget` 单参形：`maxTokens` / `reserve` 改读 `resolved`（`thincoder-core/config.mjs:107` · `:109`）；补回归用例（anthropic `maxTokens` = `spec.maxOutput` · 非 anthropic `reserve` 不为 0 · `limit = window − reserve`）。
2. 🟡 快照死行删除（D1）。
3. 🟡 CHANGELOG 语句收为批次口径「三端同批，随各端包发布」。
4. 🟡 `listModels` 形状门：`data` 非数组 ⇒ 不写缓存（「读不出」≠「不报」），用例覆盖。
5. 🟡 U-10 判据冲突：文档侧裁决（D2）。

### 验收读数（命令原文 ∥ 结果）

| 判据 | 命令 | 读数 |
|---|---|---|
| ① 批次单元档 | `node --test "thincoder-core/test/model-context.test.mjs"` | 20 tests · 20 pass · 0 fail |
| ③ 既有档零回归 | `node --test "thincoder-core/test/*.test.mjs"` | 55 tests · 55 pass · 0 fail |
| ③ 项目自有门 | `cd thincoder-core; npm test` | 55 tests · 55 pass · 0 fail |
| ⑤ 判别形 | `node -e` 调 `specMatch("glm-5.3/zzz")` ∥ `specMatch("qwen/ZHIPU/GLM-5.3")` | `matched:false`（128000 / 32000）∥ `matched:true`（1000000 / 128000） |
| ④ 告警单点 | `grep console.warn`（两档） | `model-context.mjs:42` 一处 · `model-specs.mjs:290` 一处 |
| ⑥ 乘点唯一 | `grep "\* 1024" thincoder-core/model-specs.mjs` | 恰一行（L1 ∥ L2 合流点） |

**注**：验收 ③ 的原始形 `node --test thincoder-core/test/` 在本机 Node 24.19 上批前即 `MODULE_NOT_FOUND`（目录参数被当模块解析），非本批引入；以项目 `npm test` 同一 glob 形替代并全绿。

### 终端状态

terminal state = clean（修正轮 1 次 · 评审 pass · 偏差已登记）。

### 上抛项

- **[上抛·待裁] U-10 判据冲突（D2）**：设计 `docs/core/design/MODEL-SPECS.md` §17.4「逐名相等（U-6 ⇒ DEFAULT_SPEC）」与快照「未收录零兜底」互斥，需设计侧定一条，测试断言随判。
- **[上抛·知会] 设计读数漂移**：设计 §6.15 记「乘点唯一 = `thincoder-core/model-specs.mjs:334`」，实施后乘点在同档 `:361`（文件 418 行，仍 ≤ 500 软线）；设计受影响文件表未列 `thincoder-core/CHANGELOG.md`（§6.15 旧键节明令要求该档）——请设计席随正。

**坐标更正（本段条目 2 ∥ 5）**：条目 2 的模块区 = `thincoder-core/model-context.mjs:51-105`（`recordListedContext` `:54-69` · `listedContextTokens` `:71-86` · `manualContextK` `:88-105`）；条目 5 的链区 = `thincoder-core/model-specs.mjs:344-380`（`providerSpec` `:382-384`）。

### 交付（CLI 面 · 本批条目 9 / 10 / 13）

| # | 改动 | 坐标 |
|---|---|---|
| 1 | 新增写面 `setModelContextFlow`：选渠道（行带已声明值 + `declared: N ∥ none`）→ 选模型（`model-catalog` 会话缓存；无候选 ∥ 失败 ⇒ 失败信息 + 登记文案 `No candidates (type the model ID)` + 手填模型 id）→ 输 K（提示逐字；空 = 清除）→ `persistRaw` 单键补丁 + 内存镜像就地改键 + 只回显 K | `thincoder-cli/src/tui/provider-admin.mjs:220-329` |
| 2 | 清除语义（父裁三段）：无声明 ⇒ `Nothing to clear for <model>` 零写；有声明 ⇒ `confirmDelete`（默认 Cancel、带当前值）⇒ 删键 ∥ 对象空连 `modelContext` 删；盘面对端已删 ⇒ 不出假收据；清除判据取盘面原文（含装载归一清掉的值非法条目） | 同档 `:255-275` · `:336-345` |
| 3 | 键处理 = 末段 + 小写归一后相等 ⇒ 改写既有键；歧义拒写 | 同档 `:236-241` · `:350-355` |
| 4 | 内存镜像就地改键（`agent.provider` 共享同一表；盘面拼写不同时先清旧拼写）；§6.17 auto 派生线刷新保留 | 同档 `:296` · `:313-324` · `:376-386` |
| 5 | 旧写面 `setContextFlow`（旧 `:174-221`）删除；模块头登记改口 | 同档 `:1-19` |
| 6 | 读面回显 = 已声明值（`Not declared` ∥ `NK` ∥ `模型: NK · …`）：写面渠道行与 `/model` L1 渠道行同串；导出 `declaredContextText` 单源 | 同档 `:364-371` · `thincoder-cli/src/tui/model-picker.mjs:124` |
| 7 | 管理项 `Set context window (K)…` / `action:"model-context"`；本地 `fmtContextK` 删，token 面改用核 `formatContextK` | `thincoder-cli/src/tui/model-picker.mjs:23` · `:76-77` · `:138` |
| 8 | 批次单元档（收口删）：14 用例（W-1/2/3/4/6/10/11/12/13 + 对端抢删 + 歧义 + diskMissing + 非法值可删） | `thincoder-cli/test/model-context-flow.test.mjs` |

### 偏离与处置

| # | 偏离 | 原因 / 处置 |
|---|---|---|
| D1 | 清除路径多一道确认（设计原「空输入 = 直接清除」） | 父裁 2026-10-23：CLI 自由文本态 Esc 与空回车同返空串（`thincoder-cli/src/tui/key-modes.mjs:133-153`），直接清 = 取消手势变破坏动作；设计侧已补 W-12 ∥ W-13 + `contextNothingToClear`，实现按新裁决落 |
| D2 | 写面无量级守卫（设计写面「量级守卫沿用 R27」） | 父裁 ①：守卫落核（需求侧已补 R32），另派修正轮；本端不新增单端守卫（三端同判）——按裁定标「守卫在核」 |
| D3 | 读面已声明值用 `<k>K` 字面（未调 `formatContextK`） | 该格式器吃 token（`thincoder-core/model-specs.mjs:315` 除以 1024），传 K 原值 128 得 `0K`；VSC ∥ 桌面同用 `<k>K`，三端同串（R31④）⇒ 父裁：按三端同串落，设计侧改准格式器段 |
| D4 | `/model` L1 渠道行改读已声明值（设计受影响文件表未列该行） | 审计上抛，父裁：按桌面同一裁定读已声明值 ⇒ 本批同改 |
| D5 | 清除判据读盘面原文 `loadRaw()`（设计只说「键存在即算」） | 装载归一已把值非法条目从内存清掉，只看内存 ⇒ 设计明令的「值非法条目同样要能删掉」不成立；读用 `loadRaw`、写仍 `persistRaw`（D-F5a） |
| D6 | 新增导出 `declaredContextText`（provider-admin → model-picker 共用） | 两处行面必须同串；复制实现 = 同端两份会漂（D2 单源） |

### 内部审计与评审轮次

| 轮 | 类型 | 结论 | 处置 |
|---|---|---|---|
| 1 | explore 偏差审计（只读） | issues：🔴2（写面渠道行取 providerSpec · Esc 误删）· 🟡1（缺 `No candidates` 文案）· 🔵4 | 逐条修；Esc 上抛后按父裁加确认 |
| 2 | explore 复核（只读） | 代码侧 0 偏差（R1–R8 全符合）；🟡2 设计 ∥ 需求文字随正；🔵7（死导入 · 注释坐标 · 用例编号 · 设计读数） | 死导入删、注释改口、用例号对齐 W-12/W-13；设计侧读数与格式器段上抛 |
| 3 | advisor 代码评审（轮 1） | changes-required：🔴1（写面无量级守卫）· 🟡4（非法值条目不可删 · 格式器口径 · `/model` 行 · 拉取触发）· 🔵4 | 守卫上抛 → 父裁落核（D2）；非法值可删已修（D5）；格式器 ∥ `/model` 行父裁落定（D3/D4）；拉取触发登记随报告 |

修正轮 2 次（审计后 1 次 · 评审后 1 次）· ≤5。终端状态 = clean。

### 验收读数（命令原文 ∥ 结果）

| 判据 | 命令 | 读数 |
|---|---|---|
| ① 批次单元档 | `node --test thincoder-cli/test/*.test.mjs` | 14 tests · 14 pass · 0 fail |
| ① 项目自有门 | `cd thincoder-cli; npm test` | 14 tests · 14 pass · 0 fail |
| 语法门 | `cd thincoder-cli; npm run lint` | check-syntax: 125 file(s) OK |
| ② G-1 旧命令退役 | `grep -rn "setContextFlow" thincoder-cli/src` | 零命中 |
| ② G-2 CLI 段 | `grep -rn "\.context *= " thincoder-cli/src` | 零命中 |
| ② 旧格式器退役 | `grep -rn "fmtContextK" thincoder-cli/src` | 零命中 |
| 命令入口 | 实读 `thincoder-cli/src/tui/model-picker.mjs:138` | `Set context window (K)…` / `action:"model-context"` |
| ③ 写 K | 单测 W-1 | 盘上 128；`providerSpec(...).context === 131072` |
| ③ 清除 | 单测 W-3 ∥ W-12 ∥ W-13 | 删键 + 空对象删整键；取消零写；无值空操作 |
| ④ 非法输入 | 单测 W-4 | `128K` ∥ `1.5` ∥ `-1` ∥ `abc` ∥ `0` ⇒ 报错行 + 盘面字节不变 |
| 核面无回归 | `cd thincoder-core; npm test` | 55 tests · 55 pass · 0 fail |

注：本机 PowerShell 无原生 `grep`，grep 判据以等价检索工具执行（结果 = 零命中）；其余命令均为原文实跑。

### 上抛项

- **[上抛·知会] 设计读数漂移**：设计受影响文件表记 `thincoder-cli/src/tui/provider-admin.mjs` 385 / `thincoder-cli/src/tui/model-picker.mjs` 325；实施后实读 412 / 322。请设计席收口轮统一随正。
- **[上抛·知会] 格式器段待改准**：设计「读面回显 = 同一个 `formatContextK`」字面不可实现（传 K 原值得 `0K`）；三端实现取 `<k>K` 同串，父裁已并入设计修正轮。
- **[上抛·知会] 拉取触发登记**：CLI 写面在会话缓存未命中时会拉一次 `GET /models`（复用既有 `model-catalog` 面）；与「本批不新增任何拉取触发」字面有差，请设计席在「候选载体」节登记 CLI 行。
- **[上抛·知会] 测试档放置口径**：批次单元档落 `thincoder-cli/test/`（`test/run.mjs` 的收集面），已被 `npm test` 收编；与 `thincoder-cli/AGENTS.md`「单元测试档随批次本地」的字面口径待统一。

### 交付（VSC 面 · 本批条目 11 / 12-13 的 VSC 侧）

| # | 改动 | 坐标 |
|---|---|---|
| 1 | providers 卡渠道行动作簇新增 `Context…` 钮（行内入口 = 「选渠道」一步） | `thincoder-vscode/webview/settings-providers.js:120` |
| 2 | 行面回显读 `modelContext`（逐条 `模型: NK` · 单条即 `NK` · 无声明 `未声明`） | 同档 `:12-25` · `:111` |
| 3 | `providerContextSaved` 受理回执消费位（行内保存行 4s 自散；清除径零提示） | 同档 `:76-90` · `thincoder-vscode/webview/chat-messages.js:168-170` |
| 4 | 上下文编辑弹窗（五步：渠道已定 → 选模型 → 输 K → 清除确认 → 保存） | `thincoder-vscode/webview/settings-provider-dialog.js:280-443` |
| 5 | 候选 = 既有 `fullStatus` models 切片（零新增请求）；无候选 ⇒ 文本输入 + 失败信息明示 | 同档 `:357-395` |
| 6 | 值校验 = 先 parse 再判（`"128K"` / `"1.5"` / `"-1"` / `"abc"` / `"0"` 全拒 + 报错行） | 同档 `:445-489` |
| 7 | 清除确认层（`showConfirmPopover` 同件 · 正文带当前值 · 默认焦点「取消」· 无声明 ⇒ 空操作） | 同档 `:455-478` |
| 8 | 关面板 ∥ 关框同清（含确认族遮罩，防全屏孤儿） | 同档 `:440-447` · `thincoder-vscode/webview/settings.js:176` |
| 9 | 宿主读写面：`providerContextFields`（两键）+ `saveProviderModelContext`（K 写入 / 空清除 / 末段尺子改写 / 歧义拒写 / 拒径不落盘） | `thincoder-vscode/src/extension/provider-context.mjs:26-88`（新档 70 行） |
| 10 | `providerStatus()` 载荷增 `modelContext` + `context`；按设计坐标 re-export 写函数 | `thincoder-vscode/src/extension/settings.mjs:102` · `:141-143` |
| 11 | 新 case 分发 + handler（成径先 `_pushStatus` 后回执；缺 `k` 键拒，不当清除） | `thincoder-vscode/src/extension/panel-messages-settings.mjs:130-151` · `panel-messages.mjs:318` |
| 12 | i18n 八键 zh ∥ en（四键 + `contextClearConfirm` / `contextNothingToClear` + 未声明 / 无候选） | `thincoder-vscode/locales/zh.json:129-136` · `en.json:129-136` |
| 13 | 批次单元档（收口删）：W-1..W-4 · W-7 · W-13 · W-14 · 载荷两键 · 八键字面 · 弹窗四径 | `thincoder-vscode/test/2026-10-23-vsc-provider-model-context.test.mjs`（18 用例）· `test/files.mjs` 登记 |

### 偏离与处置

| # | 偏离 | 原因 / 处置 |
|---|---|---|
| D1 | 新增档 `provider-context.mjs`（设计表把写面体记在 `settings.mjs`） | `settings.mjs` 经 `provider-flows.mjs` 引 `vscode` ⇒ 在 Node 里不可 import，写面留原档则验收 ③ 无法单测。读写面留纯 Node 档，`settings.mjs` re-export 同名函数（导入面零改） |
| D2 | 清单外三档：`panel-messages.mjs`（分发 case）· `chat-messages.js`（回执消费）· `settings.js`（关面板同清） | 新协议对与弹窗族自清规的必备接线；设计与任务书六档清单未列，随报告上抛请设计席补 |
| D3 | `webview/i18n.js` 零改 | 实读为单行 shim（`export * from "@thincoder/render-core/i18n.mjs"`）；字面按设计 `:438` 落 `locales/{zh,en}.json` |
| D4 | 不接核 `formatContextK`（任务书第 6 档的「转口」未加） | 该函数是 **token 口径**（`thincoder-core/model-specs.mjs:315` `Math.round(tokens / 1024)`）；已声明值是 K，喂它就出 `0K`，要出 `128K` 必须端侧 ×1024 = 硬约束禁止。VSC 面唯一 token 值 = 载荷 `context`（父裁留给用量百分比面），无展示消费 ⇒ 转口即死码。K 串 = 已声明原值 + 模板 K（同提示行规则），档内留因（`settings-providers.js:16-18` · 弹窗 `:290`） |
| D5 | 行面展示读 `modelContext`、不读 `providerSpec().context`（设计「展示数值只喂 context」的字面） | 父侧裁定 ②：渠道条目不携 `model` ⇒ L1 永不命中，该值只到 L2/L5（写 128 会显 125K）；`context` 仍在载荷内（设计/验收 ④）。设计 `:393`「同一个 `formatContextK`」同批需设计席收正 |
| D6 | 确认层牌面挂进弹窗卡内（`settings-widgets.js` 原件挂 body） | 弹窗遮罩 z 999 ⇒ 挂 body 的牌面会被盖住；同件零新增 CSS，遮罩随关框同清（见 D8 修正轮 2） |
| D7 | 手填模型径逐键输入不回写 K 输入件（候选 select 改选仍回写） | 否则先输 K 再改模型 id 会抹掉已输值（评审轮 2 🔵 项，就地收口） |
| D8 | 分歧键（两条键归一相撞）写面拒写 + 报错；缺 `k` 字段拒（不当清除） | 读链同判歧义未提供（`model-context.mjs:97`）⇒ 择一改写会回一笔不生效的「已保存」；缺字段默认成删除 = 一条没被确认的删除径 |

### 内部审计与评审轮次

| 轮 | 类型 | 结论 | 处置 |
|---|---|---|---|
| 1 | explore 偏差审计（只读） | findings=5——🔴1（K 串端侧自拼未披露）+ 🟡4 | 🔴 以 D4/D5 留因 + 上抛设计收正；🟡 注释漂移（L2 限定）就地改；表/清单外三档入 D1/D2 |
| 2 | advisor 代码评审（轮 1 · 清除确认前） | pass——🔴0 · 🟡6 · 🔵3 | 🟡1（`formatContextK` 冲突）设计侧待裁（D4/D5）；🟡2 i18n 六键 vs 设计八键由追加范围收口；🟡3 新档未入设计表（上抛）；🟡4 docs/vsc/design/SETTINGS.md 协议未登记（上抛）；🟡5 缺 `k` 默认成清除 → 修（D8）；🟡6 歧义择一 → 修（D8）；🔵3 三条（值非法显示 / 注释计数 / 手填抹 K）——后两条就地修 |
| 3 | advisor 代码评审（轮 2 · 清除确认后） | changes-required——新增 1 条：确认层在场时关弹窗留下全屏 `.auto-backdrop`（孤儿遮罩，吞一次点击） | 修正轮 1 次：`closeProviderContextDialog` 增 `closeConfirmPopover()`（牌面在卡内、遮罩在 body）+ 补用例（开确认层 → 点弹窗取消 → 断言遮罩为零）。轮 2 报的 🔵（手填抹 K · 注释「四键」残留）同轮修 |

**修正轮明细（1 次 · ≤5）**：① 孤儿遮罩（轮 2 新增面）→ `closeProviderContextDialog` 同清确认族 + 用例；② 缺 `k` 默认成清除 → handler 前置门；③ 歧义键择一 → 预检拒写（零落盘）+ 用例；④ 手填模型逐键输入回写 K → 加 `prefillK` 门；⑤ 测试断言标签「四键之一」→「八键之一」。

### 验收读数（命令原文 ∥ 结果）

| 判据 | 命令 | 读数 |
|---|---|---|
| ① 全量单测（含新增） | `node --test "thincoder-vscode/test/*.test.mjs"` | 45 tests · 45 pass · 0 fail |
| ① 项目自有门（清单反查 + 全量） | `cd thincoder-vscode; npm test` | 45 tests · 45 pass · 0 fail |
| ① 批次单元档单独 | `node --test "thincoder-vscode/test/2026-10-23-vsc-provider-model-context.test.mjs"` | 18 tests · 18 pass · 0 fail |
| ③ 写 128 ⇒ 盘上 128 / 空 ⇒ 删键 / 对象空 ⇒ 连键删 | 同上用例 W-1 / W-3 | 断言通过（`modelContext` 深比 `{"glm-5.3":128}` ∥ 键消失 ∥ 整键消失） |
| ④ 载荷两键 + `context` 与核同值 | 用例「providerStatus 载荷两键（桩载入真档）」 | `modelContext` 深比原值；`context === providerSpec(provider).context` |
| ⑤ 八键 zh ∥ en 两字面 | `grep settings.providers.context thincoder-vscode/locales/*.json` | zh / en 各 8 行（`zh.json:129-136` · `en.json:129-136`），用例逐字断言 |
| 端侧零乘 1024 | `grep '* 1024'`（四档） | 零命中 |
| 核 `formatContextK` 在 VSC 面无代码消费 | `grep formatContextK`（webview + src） | 2 处，均注释（说明不接的理由） |

### 终端状态

terminal state = clean（偏差审计 1 轮 · advisor 评审 2 轮 · 修正轮 1 次 · 偏离已登记并上抛）。

### 上抛项

- **[上抛·待裁] 设计 `docs/core/design/PROVIDER.md:393-398` 与硬约束互斥**：要求「卡面把 `modelContext` 原值交给 `formatContextK`」「端侧不得自己拼 K 串」，而该格式器是 token 口径、`formatContextK(128)` ⇒ `0K`，要出 `128K` 必须端侧 ×1024。请设计席二选一：核补 K 口径入口（如 `formatDeclaredK`）∥ 删「同一个格式器」强制句并改写为「K 串 = 原值 + `K`」。
- **[上抛·知会] 设计受影响文件表缺三行**：新档 `thincoder-vscode/src/extension/provider-context.mjs`（70 行）+ 清单外接线三档（`panel-messages.mjs` · `chat-messages.js` · `settings.js`）；`settings.mjs` 性质应改「转口 + 两键入载荷」（现 444 行）。
- **[上抛·知会] `docs/vsc/design/SETTINGS.md` 未登记新协议对**：`saveProviderModelContext`（webview → host）∥ `providerContextSaved { name, model, k }`（host → webview），形沿同档 `:588` 的 `providerKeySaved` 先例 + 一条机检判据。
- **[上抛·知会] 值非法声明的展示口径未定**：手写 `modelContext` 值为 `"128"` / `0` 时，卡面与输入框照原值出数，而读链判未声明（W-11 只覆盖「无键」）。按现行实现交付，如需过滤请设计席定口径。

### 修正轮 9（R32 人工声明量级守卫 · `formatDeclaredContextK` · 2026-10-23）

**范围**：仅 `thincoder-core/model-specs.mjs` 与本批单元档；未动三端（另派）、未动表行值、未改 `providerSpec` 同步语义、未动 L3 既有守卫、未改任何文档。

**交付**

| # | 改动 | 坐标（改后实读） |
|---|---|---|
| 1 | R32 量级守卫：L1 ∥ L2 合流点、解析乘点之前——`kUnit * 1024 > base.context * 4`（表无行 = DEFAULT_SPEC 128000 ⇒ 512000）⇒ 照用 + `warnContextOnce`；去重键 = provider 名 + 模型 + K 值；不截断、不拒写 | `thincoder-core/model-specs.mjs:376-385` |
| 2 | 解析乘点收为一次换算（`declaredTokens`），判点与 return 同值 | 同档 `:379` · `:386` |
| 3 | 新导出 `formatDeclaredContextK(k)` = `formatContextK(k * 1024)`；两导出分工入注释；前提 = 调用方先过 `positiveInt` | 同档 `:319-325`（分工注 `:311-313`） |
| 4 | 两处 `* 1024` 各带用途注释（解析乘点 / 展示换算） | 同档 `:324` · `:379` |
| 5 | 单元档 W-16（手改 JSON 262144 ⇒ 268435456 未截断 + 告警恰一次 + 同值不重告 + 换值再告 + L2 同判）· W-17（手改 JSON 128 ⇒ 131072 零量级告警 + 表无行边界 500/501）· 格式器两例（128 ⇒ 128K · 1024 ⇒ 1M） | `thincoder-core/test/model-context.test.mjs:156-227` · `:406-411` |

**验收读数（命令原文 ∥ 结果）**

| 判据 | 命令 | 读数 |
|---|---|---|
| ① 批次单元档 | `node --test "thincoder-core/test/model-context.test.mjs"` | 23 tests · 23 pass · 0 fail |
| ② 全核 | `cd thincoder-core; npm test`（= `node test/run.mjs`） | 58 tests · 58 pass · 0 fail |
| ③ 守卫直跑 | node 调 `providerSpecResolution` | 262144K ⇒ 268435456（modelContext）；同值不重告、524288 ⇒ 536870912 再告；L2 旧键 262144 ⇒ 268435456（provider-override）；128 ⇒ 131072 零告警；表无行 500 ⇒ 512000 不告、501 ⇒ 513024 告一次 |
| ④ 格式器 | `formatDeclaredContextK(128)` / `(1024)` | `"128K"` / `"1M"` |
| ⑤ 乘点计数 | `Select-String -Path thincoder-core\model-specs.mjs -Pattern '\* 1024'`（本机无原生 grep，等价检索） | 2 行（`:324` · `:379`），均带用途注释 |
| ⑥ 语法 | 每次编辑后内置语法检查 | Syntax: OK |

**偏离与处置**

| # | 偏离 | 原因 / 处置 |
|---|---|---|
| D1 | 同档出现第二个 `* 1024`（展示换算） | 设计 `:403-409` 明令展示换算单点 ⇒ 保留 2 处；代码注释把唯一性限定为「**解析**乘点唯一」（`:331` · `:363`），不改设计档 |

**内部审计与评审轮次**

| 轮 | 类型 | 结论 | 处置 |
|---|---|---|---|
| 1 | explore 偏差审计（只读） | issues：🔵2（设计档读数 417/≈427 ⇒ 实读 442；设计判点坐标已漂）；部分实现 / 静默简化 / 清单外改动零命中 | 两 🔵 在设计档（非本席笔）⇒ 报告漂移，未改 |
| 2 | advisor 代码评审 | pass —— 🔴0 · 🟡4 · 🔵5 | 自修 4 条：表无行边界用例 · W-17 改走落盘 + `loadConfig` · W-17 断言改子串 · 文案渠道名兜底；余 5 条为文档侧 / 三端接线 / 既有口径，登记于上抛 |

**终端状态**：clean（审计 1 轮 · advisor 1 轮 · 自修 1 次 · 无 🔴）。

**上抛**

- **[上抛·知会] 设计档漂移**：`docs/core/design/PROVIDER.md:584` 记 417 / ≈427，实读 **442**（仍 ≤ 500 ⇒ 拆点未触发）；同档 `:362` 两判点坐标（`:361` / `:367`）已漂到 `:380` / `:391`；同档 `:302`「全仓唯一乘点」按字面不成立（解析 1 + 展示 1）。请设计席收口轮随正。
- **[上抛·知会] 三端尚未接新入口**：桌面已接（`thincoder-desktop/src/main/providers.mjs:78`）；CLI 仍自拼 `${k}K`（`thincoder-cli/src/tui/provider-admin.mjs:370`），VSC 同（`thincoder-vscode/webview/settings-providers.js:23`）。声明 1024 会出桌面 `1M` ∥ CLI/VSC `1024K`。按任务书三端另派，请排入接线轮。
- **[上抛·待裁] 值非法声明的展示口径**：`formatDeclaredContextK` 不复判值域（docstring 钉「调用方先过 `positiveInt`」）；手改 JSON 写 `"128"` / `0` 时展示与读链判「未声明」的取舍未落设计，是否需要核心入口兜底请设计席裁。
- **[上抛·知会] `config.mjs` 再导出面未补**：`formatContextK` 在面、`formatDeclaredContextK` 不在（`thincoder-core/config.mjs:40-41`）；桌面直取已证可达，CLI/VSC 接线轮若走 `config.mjs` 需补两处清单。
- **[上抛·知会] L2 旧键布尔口径**：`Number(provider?.context)` 把 `true` 当 1K（1024 token 窗口），L1/L3 的 `positiveInt` 拒布尔；既有口径在册，非本轮引入，4× 守卫不触发。

**实施侧实况（外部事件 · 2026-10-23 18:47-18:48）**：收口脚本（`.thincoder/tmp/closeout-delete-tests.mjs`，18:47:21）删除了本批四包单元档——`thincoder-core/test/model-context.test.mjs` 与上文坐标档已不在盘（`Test-Path` = False）。本段验收读数均取于删除前（批次单元档 23/23 · 全核 58/58 · `* 1024` = 2）；验收 ① 若要复跑须先恢复该档。交付代码未受影响（守卫 `thincoder-core/model-specs.mjs:376-386` · 新导出 `:319-325` 实读仍在）。

## §6 验证与收口（父代理）

**验证与收口（主 agent）**

### 1. 验证读数（收口轮实跑 · 2026-10-23）

批次单元档（收口前）：

| 包 | 命令 | 读数 |
|---|---|---|
| core | `node --test thincoder-core/test/*.test.mjs` | **58 tests · 58 pass · 0 fail** |
| cli | `node --test thincoder-cli/test/*.test.mjs` | **14 · 14 · 0** |
| vscode | `node --test thincoder-vscode/test/*.test.mjs` | **45 · 45 · 0** |
| desktop | `node --test thincoder-desktop/test/*.test.mjs` | **18 · 18 · 0** |

**收口删**（按测试纪律：单元档随批删，不转集成）：四档已删 —— `thincoder-core/test/model-context.test.mjs` · `thincoder-cli/test/model-context-flow.test.mjs` · `thincoder-vscode/test/2026-10-23-vsc-provider-model-context.test.mjs` · `thincoder-desktop/test/model-context.test.mjs`；并从 `thincoder-vscode/test/files.mjs` ∥ `thincoder-desktop/test/files.mjs` 注销。

删后基线复跑：core **35·35·0** · cli **0** · vscode **27·27·0** · desktop **0** —— 零回归。

**集成面**：本仓无集成套件覆盖本面 ⇒ 报告的「集成场景影响 = 无新增、无修订」。真机走查由桌面席以真浏览器 + quickcheck 服务给出等价读数（开弹窗 0 新增 IPC · `pageerror=0` · `unstubbed=0`）。

### 2. 文档门

`doc_check(mode:"gate")` 本批 docs 集（共 6 档：需求 §4.8 · 设计 PROVIDER §6.9/§6.15 · 设计 MODEL-SPECS §17 · `docs/vsc/design/SETTINGS.md` · `docs/vsc/design/WEBVIEW-PROTOCOL.md` · 本档）⇒ **`DOC-CHECK GATE: PASS`（0 命中）**。

门修过程（父侧机械笔，逐笔可 revert、零语义改）：本档 103 处裸档名 → 全路径、两处超宽行折行；§2/§3 正文一字未改。

**边界（在册不隐藏）**：三端 `CHANGELOG.md` 不在 docs 门判据面（`docs/**` 之外），其历史条目含既有锚债（cli 98 · vscode 74），本批未清——不在本批范围，另批处置。

### 3. 结算同步清单

- **§2 ↔ 设计对账**：§2 各项（五级链 / 三端写面 / 匹配规则）与设计 §6.9 / §6.15 / §17 一致；受影响文件表读数已按收口轮一次 `wc -l` 随正（19 行），不再有设计轮旧值。
- **前批遗留**：无（`#1739` 即本批）。
- **暂缓批复核**：无。
- **搁置项复核**：无。
- **修正轮落地前置**：设计修正 8 轮（`#18`/`#22`/`#23`/`#24`/`#25`/`#26` + 父侧两笔机械），实施修正 2 轮（`#19`/`#21`），核修正 1 轮（`#27`），均已落盘并复核。
- **用户文档面同步**：三端 CHANGELOG 各一条（cli/vscode/desktop）+ core 一条，均按 A7 写迁移说明。

### 4. 已知边界（在册）

1. **`formatDeclaredContextK` 接线**：核已导出；desktop 已接；CLI/VSC 仍按 `<k>K` 字面出词（同串，但 `1024` 在核格式器里应出 `1M`）——收口轮不追，登记为后续小笔。
2. **非法声明值**：卡面 `未声明`、弹窗不回填原值（W-18 已随正）；非法原值由装载期告警明示。
3. **桌面 `§5` 未写入**：该席工具面无 `batch`；其交付事实以本档 §6 与本条为准。
4. **L3 列表值跨进程不同步**：R31④ 只判已声明值，已写入设计已知边界。

### 5. 台账

`#1739` 结账依据 = 本条 + §4 批准 + 设计评审批次（§3 第 1/2 轮），状态走 在途 → 待核销 → 已核销。
