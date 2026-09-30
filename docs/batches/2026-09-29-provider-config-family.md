# 2026-09-29 · provider-config-family
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-29 · 来源 = 用户 2026-09-29 20:42 直令——池面转批：provider∕config 族（#57 ∥ #176 ∥ #177）。
> 台账 = #57 ∕ #176 ∕ #177（provider∕config 族 · 归批）。前情 = 09-21 用户问询评估（证据在各自台账行）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-29
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**状态行**：🔄 进行中（2026-09-29 20:44 · 立批——设计轮已派）

- **来源** = 用户 20:42 直令；触发 = 池面转批——provider∕config 族三条（承 09-21 用户问询评估，证据在台账行）。
- **条目**：**#176**（华为云 MaaS 渠道预设——OpenAI 兼容 `https://api.modelarts-maas.com/openai/v1`；待定：渠道 id ∕ 默认模型（实施时实拉 `/models`）∥ 载荷行为未测）· **#177**（预设收录判据成文 + 长尾渠道自助指引——运营商三家首测：电信可收 ∕ 移动联通未实锤暂不收）· **#57**（MCP 头值 ∕ 配置值 `${env:VAR}` 引用形态——落盘不落明文；机制现为全仓 0 命中）。
- **口径**：预设机制 = `PROVIDER_PRESETS`（`config-presets.mjs`）+ 模型清单运行期拉取（PROVIDER 需求 R1）；**实施前须实拉验证**（华为云 `/models` 前提——无 key 时如实标注待验）。
- **边界**：不动既有 21 渠道语义；#57 = 新增解析面（能力增强非安全阻断）。
- **授权** = 13:52 ∕ 17:02 全权。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（eng-designer · 2026-09-29 · 三条全备 + 设计档四笔；修正轮已落（#1–#7 · 见 §2.8））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

（设计轮 · eng-designer · 2026-09-29 · 初始轮——三条逐条设计已落；设计档笔 = PROVIDER.md §6.11/§6.17/§6.19/§6.21 + CONFIG.md §6.3 + SETTINGS-TOOL.md D-ST16 + MCP.md §6.5）

### 2.1 本批条目（覆盖）

| # | 条目 | 板块 ∕ 需求面 | 交付形 |
|---|---|---|---|
| #176 | 华为云 MaaS 渠道预设（OpenAI 兼容 `https://api.modelarts-maas.com/openai/v1`） | PROVIDER ∕ `docs/core/requirements/PROVIDER.md`（R1 机制面） | 预设表 +1 键（产品码）+ 文档随动 |
| #177 | 预设收录判据成文 + 长尾渠道自助指引 + 运营商三家结论 | PROVIDER ∕ 同上 | 设计档 §6.21 + CLI README 指引条（文档，零行为） |
| #57 | 配置值 `${env:VAR}` 引用形态（落盘不落明文；settings 脱敏批候选 C1 转正） | CONFIG–settings 面 ∕ 台账 #57 | 核叶档 + 五消费点解析（产品码）+ 设计档三笔 |

**明确不入本批**：既有 21 渠道语义零动 ∥ `huawei` 区域端点变体不另设预设（走自助路径）∥ 电信入表**不落**（低优先候补）∥ `${env:VAR}` 非敏感值位 ∕ 缺省语法 ∥ 转义形 ∥ MCP `url`·`command`·`args` 不解析 ∥ 需求档零触（见 §2.7-U）。

### 2.2 逐条设计（现状实读 ∥ 方案 ∥ 受影响文件 ∥ 验收判据）

#### 2.2.1 #176 华为云 MaaS 渠道预设

**现状实读**：预设表 = `PROVIDER_PRESETS`（`thincoder-core/config-presets.mjs:16-40`，**21 键**——实读）；`presetToEntry`（`:44-49`）剥 `desc` 成条目；模型清单运行期拉取 = PROVIDER 需求 R1（**拉不到 `/models` = 该渠道不可选**）；`huawei` 键未占用（实读）；华为云形态（官方文档实查 + 2026-09-29 检索复核）：OpenAI 兼容 `base_url = https://api.modelarts-maas.com/openai/v1`（区域变体 `api-ap-southeast-1.modelarts-maas.com/openai/v1`；鉴权 `Bearer`）；托管 DeepSeek ∕ Qwen3 ∕ GLM 系（官方 QS 示例模型 = GLM-5.3；同族名与既有规格行相交的候选以实施轮实拉为准）。

**方案**：入表一条——
`huawei: { baseURL: "https://api.modelarts-maas.com/openai/v1", model: <实施轮实拉取值>, desc: "Huawei Cloud ModelArts Studio (华为云 MaaS)" }`。
① 渠道 id = **`huawei`**（否决 `maas`——泛名与他厂 MaaS 混淆；否决 `huaweicloud`——表内无 -cloud 后缀先例）；② **不带** `thinking` ∕ `reasoningEffort` ∕ `maxTokens`（载荷面未测——「不设 = 不发」，D-13 同式）；③ 表内插入位 = `tokenhub` 后（国内云厂商组尾）；④ 默认模型取数规则（实施轮）：实拉 `GET /models`（带 key）→ 旗舰聊天模型，**优先选命中既有 MODEL_SPECS 行者**（零新行 ∕ 护栏白名单不动）；无命中 ⇒ 按 D-11 族沿用（点名来源行 + 行注标级）或按 qwen-plan 先例加对齐行；皆不可 ⇒ `DEFAULT_SPEC` 兜底 + 记录（挂覆盖族账）；**无 key ⇒ 官方口径记名 + 标「待验」**（禁假绿：不得写「实测」）。

**受影响文件**：见 §2.4（产品码 1 档 +1~2 行；文档 3 处计数随动 + 需求档 1 处上抛）。

**验收判据**：

- **#176-AC1**（机检 · 批内件）：`presetToEntry("huawei")` ⇒ `{ name:"huawei", baseURL, model, desc 剥离 }` 且**无** `thinking` ∕ `reasoningEffort` ∕ `maxTokens` 键。
- **#176-AC2**（机检 · 批内件）：预设总数 **22**；既有 21 键逐键零改（抽样逐字段 deepEqual）。
- **#176-AC3**（实测 · 实施轮落 §5）：有 key ⇒ 实拉 `/models` 读数入 §5（状态 + 全名列表 + 取名）；无 key ⇒ §5 记 `待验（无 key）` + 官方口径名——两态**不得互相冒充**。
- **#176-AC4**（设计面核实）：端面自动可见（单源消费链 `config-presets.mjs` → CLI ∕ VSC ∕ 桌面预设投影——本批端侧零改）。

#### 2.2.2 #177 收录判据成文 + 自助指引 + 运营商结论

**现状实读**：判据无成文（内容仅住台账 #177 evidence 行）；长尾兜底面在位（`providers[]` 自由字段 + 交互添加：CLI `/model` 菜单 add-provider-custom ∕ VSC `Add provider… → Custom` ∕ 桌面核表投影）；CLI README 有「custom endpoint」片段（`:80` ∕ `:108`）但**无「自定义渠道」指引条**；VSC README `:22` 已有「+ custom OpenAI-compatible endpoint」句。

**方案**：① 判据成文 = 设计档 `PROVIDER.md` **§6.21**（三判据 + 字段面纪律 + 运营商三家结论 + 自助路径——**本轮已落**）；② 自助指引 = `thincoder-cli/README.md` **一条**（自定义渠道：add provider → custom ∥ 手写 `providers[]`；区域端点变体示例）；③ 运营商结论入档（电信可收 · 低优先 ∕ 移动联通暂不收——给由在台账 #177）——**本批不新增预设**。

**受影响文件**：`docs/core/design/PROVIDER.md`（设计轮笔 · 已落）· `thincoder-cli/README.md`（+1~2 行 · 实施轮）。

**验收判据**：

- **#177-AC1**（人核 · 评审 ∕ 父侧）：§6.21 三判据逐条在场且与台账 #177 一致（**散文锚禁——不设测试锚**）。
- **#177-AC2**（人核）：CLI README 指引条在场（任意 OpenAI 兼容端点可自助接入）。
- **#177-AC3**（机检 ∕ 人核）：零行为变更——预设表键数 22（仅 #176 的 +1）· 无运营商预设入库。

#### 2.2.3 #57 `${env:VAR}` 引用形态（解析面）

**现状实读**：全仓代码面 `${env:` **零命中**（设计轮实扫——现无任何解析面）；遮蔽面 = `settings` 工具 `isSensitiveKey`（词表 + `headers`∕`env` 开口键族；`thincoder-core/agent-tools/settings.mjs:16-24`）；MCP token 现为明文落盘（`docs/core/design/MCP.md` §6.5）；消费点实读（本设计轮）：`provider/core.mjs:378`（Authorization；`chatImpl` `:117` 入口格式分派——四 transport ∕ advisor ∕ 子代理 ∕ 压缩同享）· `provider/list-models.mjs:60/:65/:82`（三 format）· `mcp.mjs:55` 区（`withBearerToken` + 三传输——**传输建连构造单点覆盖 connect ∕ probe ∕ 重连**）· `tools/web.mjs:49`（Tavily key）· `embedding.mjs:15`（读点区）。

**方案（解析点 ∥ 生效面 ∥ 与遮罩关系——三件全裁）**：

- **解析点** = **消费侧（use-time）单源**：新叶档 `env-ref.mjs`（拟新增，住 `thincoder-core/`——纯函数 `resolveEnvRefs`（串）∕ `resolveEnvRefMap`（键值对象）∕ 形状适配 `resolveProviderSecrets` ∕ `resolveMcpServerSecrets`）；解析点 = ① `chatImpl` 入口（`provider/core.mjs:117` 区）② `listModels` 入口（`list-models.mjs:96`）③ 传输建连构造（`mcp.mjs:55` 区）④ `web.mjs:49` ⑤ `embedding.mjs` 读点。**否决装载期解析**（双端多加载面 + 中途改值不生效 + 内存明文扩面 + 显示面语义漂移）。
- **生效面（v1 五族）** = `providers[].apiKey` ∕ `providers[].headers.*` ∕ `mcp.servers[].token` 与 `.headers.*` ∕ `.env.*` ∕ `websearch.apiKey` ∕ `embedding.apiKey`。**语义**：整值与内嵌同解（`sk-${env:K}` 式）；多引用可；**变量未设 ∕ 空串 ⇒ 消费点抛错**（点名变量；无「未设即缺省」回退——不静默字面透传）；畸形 `${env:` 前缀同抛错；非字符串值原样。
- **与遮罩关系**：谓词 **零改**（引用串同住敏感值位 ⇒ 族遮罩内）；解析产物**永不回显、永不回写**（写盘链按磁盘原文；显示面读存储形 = 引用串）；MCP 指纹 ∕ 漂移比对按**存储原文**（env 变更不伪装为配置漂移；重连按当时环境重解析）。
- **与 CONFIG §6.2 通道纪律关系**：非新配置通道（config.json 仍唯一通道 ∕ 唯一真源）；无隐式回退分支。

**受影响文件**：见 §2.4（核 6 档 + 设计档三笔）。

**验收判据**：

- **#57-AC1**（机检 · 批内件）：解析正确——整值 ∕ 内嵌 ∕ 多引用；stub fetch 断言 `Authorization` = 真值（provider 聊天径）。
- **#57-AC2**（机检 · 批内件错面）：变量未设 ⇒ 抛错（点名变量）——**零字面透传**（负控）；空串同判；畸形同判。
- **#57-AC3**（机检 · 批内件回归）：无引用值逐字零变更；非字符串值原样。
- **#57-AC4**（机检 · 批内件）：MCP 三族（token ∕ headers ∕ env）解析；指纹按原文（改 env 值不触重连——引用串未变）。
- **#57-AC5**（机检 · 批内件）：遮蔽零改（`settings get providers.0.apiKey` ⇒ `MASKED`；`headers.*` 族遮罩不变）。
- **#57-AC6**（机检 · 静态）：解析点集 = 设计五处（grep `resolveEnvRefs` ∕ `resolveProviderSecrets` ∕ `resolveMcpServerSecrets` 使用点集断言——防漏接 ∕ 防扩面）。

#### 2.2.4 用例表（正常 ∕ 边界 ∕ 错误——#177 为文档面，散文锚禁 · 不设测试锚，验证按 §2.5 人核径）

| id | 类 | 输入 ∕ 动作 | 期望输出与判据 |
|---|---|---|---|
| H-1 | 正常 | `presetToEntry("huawei")` | `{name:"huawei", baseURL:"https://api.modelarts-maas.com/openai/v1", model:<V>, desc 剥离}`；无 thinking ∕ effort ∕ maxTokens 键 |
| H-2 | 正常 | 预设键集扫描 | 22 键；21 旧键逐键零改（抽样 deepEqual） |
| H-3 | 边界 | 逐预设 `specMatch(model)` | 漂移白名单 {`hunyuan`, `siliconflow`, `groq`} 只减不增——`huawei` 选名须命中既有行（否则入白名单须挂台账待办号） |
| H-4 | 边界 | 无 key 实拉不可达 | 非机检——实施轮 §5 记「待验」；**不得**出现「实测」字样（禁假绿） |
| E-1 | 正常 | `${env:FOO}` + FOO=sk-x，stub fetch | `Authorization: Bearer sk-x`（chat 径 ∕ list-models 同） |
| E-2 | 正常 | `p-${env:A}-${env:B}` | `p-va-vb`（多引用 ∕ 内嵌） |
| E-3 | 边界 | 无引用值（回归） | 逐字节零变（含空串 ∕ 非字符串原样） |
| E-4 | 错误 | FOO 未设 | throw 含「FOO」；**零请求发出**（stub fetch 零调用） |
| E-5 | 错误 | FOO 为空串 | 同 E-4（空串 = 未设） |
| E-6 | 错误 | 畸形 `${env:1bad}` | 抛错（点名畸形） |
| E-7 | 正常 | MCP：token ∕ headers ∕ env 三族 | 传输收到解析值；**指纹 = 原文**（改 env 值不触发重连；改引用串触发） |
| E-8 | 正常 | `settings get providers.0.apiKey`（值 = 引用串） | `••••（masked）`（谓词零改） |
| E-9 | 静态 | grep 解析函数使用点集 | = 设计五处（防漏接 ∕ 防扩面） |

### 2.3 设计档落点与机制设计（本设计轮已落）

| 档 | 笔（行数 = split 口径 · 实测） |
|---|---|
| `docs/core/design/PROVIDER.md`（463 → **490**） | §6.11：22 家 + `huawei` 行 + 护栏句重锚（批次本地件形态）；§6.17：值引用指针；§6.19：22 preset + 名单；**§6.21 新节**（三判据 + 运营商结论 + 自助路径）；§7 标题行补立（结构面自修——D-PR 决策表原缺标题、§7 引用不可解析；**发现即修 · 披露 U4**）；变更记录 |
| `docs/core/design/CONFIG.md`（210 → **229**） | **§6.3 新节**（机制 ∥ 生效面五族 ∥ 语义 ∥ 遮罩关系 ∥ §6.2 关系 ∥ 边界——**机制单源**）；变更记录 |
| `docs/core/design/SETTINGS-TOOL.md`（173 → **174**） | D-ST16 翻案（「不做」→「已受理做」，改指 §6.3）+ §4 边界行改写；变更记录 |
| `docs/core/design/MCP.md`（215 → **216**） | §6.5 值引用注（解析单源 + 指纹按原文）；变更记录 |

### 2.4 受影响文件与测试面（file 级 · 现状行数 = split 口径（含末行）· 实测 as-of 2026-09-29 设计轮）

产品码（实施轮 · eng-coder）：

| 文件 | 现状 | 预期增删 | 说明 |
|---|---|---|---|
| `thincoder-core/config-presets.mjs` | **50** | +1~2 | `huawei` 键（`tokenhub` 后）+ 行注 |
| `env-ref.mjs`（拟新增 · 住 `thincoder-core/`） | 0 | ~45-55 | 解析叶档（零 import 纯函数） |
| `thincoder-core/provider/core.mjs` | **450** | +~3 | `chatImpl` 入口解析（`resolveProviderSecrets`） |
| `thincoder-core/provider/list-models.mjs` | **164** | +~3 | `listModels` 入口解析 |
| `thincoder-core/mcp.mjs` | **296** | +~4 | 传输建连构造解析（token ∥ headers ∥ env；指纹零改） |
| `thincoder-core/tools/web.mjs` | **225** | +~2 | Tavily key 读点解析 |
| `thincoder-core/embedding.mjs` | **121** | +~3 | 读点解析 |
| `thincoder-cli/README.md` | **537** | +1~2（另 `:20` 计数 twenty-one → twenty-two） | 自定义渠道指引条 + 计数行 |
| `thincoder-vscode/README.md` | **205** | ±0~+1 | `:22` 计数 21→22 + 名单加 `Huawei` |
| `thincoder-desktop/src/main/providers.mjs` | **301** | ±0 | `:76` 注释计数 21→22（零行为；贴 300 顾问线——±0 不越） |

文档面：上表四档设计笔（**已落**）+ **`docs/core/requirements/PROJECT.md:30`**（C3 计数 21→22——需求档 · 主 agent 笔 ⇒ **上抛 U1**）。行数上限核查：全部 < 300 顾问线（`mcp.mjs` 296+4 ≈ 299-300 贴线——若实施越线按既有登记形处置）；`provider/core.mjs` 450+3 距 500 硬限余量 ~47 行（无需拆分计划）；`MODEL-SPECS.md` 仅当默认模型无命中行时条件触达（D-11 纪律 ∕ 不预写）。

测试面（2026-09-28 测试纪律新形——**批次本地件**）：

| 文件 | 形 | 覆盖 |
|---|---|---|
| `docs/batches/2026-09-29-provider-config-family.test.mjs`（拟新增） | 批次本地单元件（随批档 · `node --test` 直跑） | #176：H-1..H-3（预设面——含护栏重立：逐预设 `specMatch` 漂移白名单只减不增）；#57：E-1..E-9（解析面 + 遮蔽零改 + 点集静态断言） |

既有测试面现状（实读）：cli ∕ vsc ∕ desktop ∕ core 测试树 = 2026-09-28 全清后骨架（**在盘 preset 计数断言 0 处**——D3 测试面计数点 = 0；新增断言入批内件）。集成面：本批无跨端业务场景变化（预设单源自动扇出；`${env:VAR}` 为核内消费侧）——**集成档零新增**。

### 2.5 验收对照（三条 → 判据 → 设计落点 → 机检 ∕ 人核）

| 条目 | 判据 | 设计落点 | 判定 |
|---|---|---|---|
| #176 | AC1 ∕ AC2 | §6.11 + 批内件 | 机检（批内件） |
| #176 | AC3 | §6.11「实施轮实拉取值 + 待验标注」 | 实施轮实测（§5 落读数）+ 父侧核 |
| #176 | AC4 | §6.11 ∕ §6.19（单源链） | 设计面核实（端侧零改即扇出） |
| #177 | AC1–AC3 | §6.21 + CLI README 条 | 人核（散文锚禁 ∕ 不设测试锚）+ 机检（预设键数 22） |
| #57 | AC1–AC5 | `CONFIG.md` §6.3 | 机检（批内件） |
| #57 | AC6 | §6.3 解析点集 | 机检（静态 grep 断言） |

三链一致：批次档 §2 本条 = 设计档 AC 回指（本节）= 台账 #176 ∕ #177 ∕ #57（本批无新增需求档条目——见 U2）。

### 2.6 关键决策（含被否）

| # | 决策 | 被否 ∕ 理由 |
|---|---|---|
| D-PC1 | 渠道 id = `huawei` | 否决 `maas`（泛名冲突）· `huaweicloud`（无先例） |
| D-PC2 | 预设字段面 = 最小三字段（baseURL ∕ model ∕ desc） | 否决预置 thinking ∕ maxTokens（载荷未测——D-13） |
| D-PC3 | 默认模型 = 实施轮实拉取值（无 key ⇒ 官方口径 + 待验） | 否决设计轮凭公开文档钉名（禁假绿）；否决「无 key 即不落预设」（收录价值独立于本次实拉） |
| D-PC4 | 区域端点不另设预设（走自助路径） | 否决变体逐条入表（表膨胀 + 判据③） |
| D-PC5 | 判据成文落设计档 §6.21（如需求层需要 ⇒ 上抛 U2） | 需求档笔在主 agent——不自写 |
| D-PC6 | 自助指引 = CLI README 一条 | VSC README 已有句覆盖（不重复） |
| D-PC7 | 运营商三家均不落表（电信 = 低优先候补） | 否决「电信随批收」（低优先 = 无排期 + 判据③未发） |
| D-PC8 | #57 解析 = 消费侧单源（叶档） | 否决装载期解析（多加载面 + 中途改值不生效 + 内存明文扩面）· 逐传输手写（副本漂移） |
| D-PC9 | 语法 = `${env:NAME}`（整值 ∕ 内嵌同解） | 否决仅整值（无谓限制） |
| D-PC10 | 缺失 ∕ 畸形 = 抛错（无回退分支） | 否决静默字面透传（假绿）· 装载期告警（无消费语境） |
| D-PC11 | 生效面 = 五敏感值族 | 否决全配置泛化（无需求 + 显示语义扩面） |
| D-PC12 | 遮罩谓词零改；解析产物不回显不回写 | 否决「显示引用变量名」新面（无需求） |

### 2.7 上抛项（父侧清单）

- **U1（需求档笔 · 清单上抛）**：`docs/core/requirements/PROJECT.md:30`（C3 行「当前全集 **21** 个」）→ **22**——需求档零触纪律下不自行落笔，请父侧裁落。
- **U2（需求层条目待裁）**：#177 收录判据 ∕ #57 `${env:VAR}` 是否需在需求档落条目（判定句）——如需（如 SETTINGS-TOOL 需求档新 F-ST 条目 ∕ PROVIDER 需求档收录判据条目），**主 agent 笔**；本设计不含需求档改动。
- **U3（描述句 · 模型可见文案）**：`settings` 工具 description 是否补一句「值可携 `${env:VAR}` 引用（消费侧解析，不回显）」——内容权 = 主 agent；本设计不在其内（可选项）。
- **U4（已自裁 · 披露）**：`PROVIDER.md` §7 标题行缺失（D-PR 决策表无标题、§7 引用不可解析）——**结构面自修已落**（本设计轮；一致性面）。
- **U5（披露 · 实施轮笔面）**：桌面 `providers.mjs:76` 注释计数 ∕ 两 README 计数与名单 ∕ CLI README 指引条 = 产品文本面（实施轮 eng-coder 笔——全在 §2.4）。

**设计状态**：八项齐（方案 ∥ 机制 ∥ 受影响文件 ∥ 决策 ∥ AC 回指 ∥ 用例表 ∥ 边界 ∥ UI 决策）；三条设计全备、file 级清单齐；D6 读回核实（设计档四笔逐笔读回；`doc-check` 实跑——**本批四档零新增** ✗：命中均为存量迁移期引文 ∕ 报告面项）；**open 项零**（U3 = 可选项上抛）。待评审（发起权在父侧）。

### 2.8 设计评审轮 1 修正轮落账（承 §3 发现 #1–#7 · eng-designer · 2026-09-29）

**口径**：零新语义——全部为评审发现的直接导出项（父侧裁定 = 发现 1–7 全数接受；#1 取选项①）；产品码 ∕ 需求档零触；本节与原 §2.1–§2.7 并列读——**不一致者以本节为准**。逐号落点（均已读回）：

| 号 | 落点（`file:line`） | 状态 |
|---|---|---|
| #1 | §2.2.3 解析点修正 ∕ §2.4 表补行 ∕ AC6 ∕ E-9 同步 ∕ 后果检查（均见下「#1 块」）· 设计档 `docs/core/design/CONFIG.md:175-176`（解析点六处 + 标题径非致命兜底句） | ✅ |
| #2 | `docs/core/design/CONFIG.md:119`（§6.2 补「值位显式引用 ≠ 配置通道」边界段）· `:166`（D-CF5 补注）· `:232`（变更记录） | ✅ |
| #3 | §2.4 `providers.mjs` 行改述（见下「§2.4 表补行 ∕ 改述」） | ✅ |
| #4 | §2.4 表补行 `model-specs.mjs`（见下；择 ① 补行——给由见下） | ✅ |
| #5 | AC6 ∕ E-9 grep 口径写明（见下「#5 块」） | ✅ |
| #6 | `docs/core/design/PROVIDER.md:303` 坐标 `:41 ⇒ :44` · `:490`（变更记录） | ✅ |
| #7 | **仅登记 ∕ 不动（零改）**——`docs/core/design/SETTINGS-TOOL.md:140` 已带「机检豁免——用例退场登记」标记；后续若动该档 §5 顺手重锚（承评审建议） | ✅（零改） |

**#1 块 · 标题径纳解析点集（父裁 = 选项①；给由：后果窄 · 三端共用 · 与 `PROVIDER.md:259`「⑤ 会话标题生成」自述一致；选项②「标题静默回落」与 CONFIG「不静默字面透传」纪律相抵）**：

- **解析点 ⑥** = `thincoder-core/generate-title.mjs` `generateTitle` 入口（`resolveProviderSecrets`——消费位 = `:97` 头装配 ∕ `:102` Bearer ∕ `:63` google URL key）；§2.2.3 档内「解析点 = 五处」以本块为**六处**读数。
- **后果检查（引用串 401 静默回落消解）**：纳解析后标题请求带真值——「引用串按原文上线 ⇒ 标题请求 401 ⇒ `:113` 静默返回 `null`（用户可见退化：无标题）」径消解；变量未设 ∕ 空串 ∕ 畸形 ⇒ 解析抛错落标题径**既有非致命兜底**（`generate-title.mjs:117-119` ∕ `:139-141` 双 catch ⇒ 标题回落 `null`——不破坏回合，与「无 key 不生成标题」同形）；三端（CLI ∕ 桌面 ∕ VSC——经 `ensureSessionTitle`）同径消解。

**§2.4 表补行 ∕ 改述（与原表 `:119-131` 并列读；同名行以本块为准）**：

| 文件 | 现状 | 预期增删 | 说明 |
|---|---|---|---|
| `thincoder-core/generate-title.mjs`（补行 · #1） | **143** | +~2 | 标题径入口解析（`resolveProviderSecrets`——`:97` 头装配 ∕ `:102` Bearer 消费位）；非致命兜底与请求构造零改 |
| `thincoder-core/model-specs.mjs`（补行 · #4） | **355** | ±0 ∕ **+1~2**（条件触达） | 条件 = 默认模型无命中行 ⇒ 加对齐 ∕ 族沿用行（1 行注 + 1 表行——D-PR25 ∕ D-11 先例）；>300 已在册（`CORE-UNIFICATION.md` §2.8.1 子表行 14——拆点 = `MODEL_SPECS` 表块外提）；字段面补充级 ⇒ 本批不拆；与 `MODEL-SPECS.md`（文档面条件触达）配对 |
| `thincoder-desktop/src/main/providers.mjs`（改述 · #3） | **301**（read 口径含末行）＝ 内容 **300**（桌面登记口径） | ±0 | `:76` 注释计数 21→22（零行为）。**存量越线 1 行**（read 口径；≤500 硬限内）——**本批 ±0 不加码**；R3 口径：不升级（无拆分义务）；登记 = `docs/desktop/design/PROJECT.md` §4.1 贴层段在册（内容口径 300 = 贴 300 层；本批 = 注释级 ⇒ 其「注释不计」预案口径零触发） |

**#4 给由（择 ① 补行 ∕ 不取 ② 收紧）**：① 类别对齐——发现类别 = 受影响文件完整性，补行即正解；② 保留已批先例路径（D-PR25 对齐行 ∕ D-11 族沿用）——收紧则无命中模型只能走「白名单 + 台账」或 `DEFAULT_SPEC` 兜底，护栏（漂移白名单只减不增）与旗舰取值质量双损；③ 反改机制口径以回避清单缺口 ∕ 非本修正轮射程。

**#5 块 · AC6 ∕ E-9 修正后口径（与原表 `:86` ∕ `:104` 不一致者以本块为准）**：

- **AC6**（机检 · 静态）：解析点集 = 设计**六处**（provider 聊天入口 ∕ 清单拉取入口 ∕ MCP 传输建连 ∕ websearch 读点 ∕ embedding 读点 ∕ 会话标题生成径）。
- **E-9**（静态）：grep 解析函数使用点集 = **六处**——**匹配口径**：消费点断言——**排除叶档 `env-ref.mjs` 自身定义 ∕ 内部复用**（`resolveEnvRefMap` 等内部调用不计；按调用点白名单断言）——防漏接 ∕ 防扩面。
- **三链核对**：§2.2.3 解析点（六处）＝ §2.4 产品码表（6 行解析面：`provider/core.mjs` ∕ `list-models.mjs` ∕ `mcp.mjs` ∕ `tools/web.mjs` ∕ `embedding.mjs` ∕ `generate-title.mjs`——另叶档 `env-ref.mjs` = 定义源）＝ AC6 ∕ E-9（六处）＝ `CONFIG.md` §6.3（六处）。

**披露**：
1. **#3 口径双列披露**：`providers.mjs` 两口径并存（read 含末行 = 301 ∕ 内容行数 = 300）系两登记面各自既有口径（本表 = read；桌面 `PROJECT.md` §4.1 = 内容）——本块双列并明，**非数字漂移**；#3 原句「301 ∕ 贴线不越」的自相矛盾以本块消解。
2. **#7 零动作**：不动 `SETTINGS-TOOL.md`（已登记态——「机检豁免——用例退场登记」在行）。
3. **笔域**：本轮仅触设计档两档（`CONFIG.md` · `PROVIDER.md`）+ 本节；产品码 ∕ 需求档 ∕ 测试件零触；未发起评审（门 = 父侧）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**设计评审轮 1（provider-config-family · #176 ∕ #177 ∕ #57）**

评审对象 = 批次档 §2（设计）+ 设计档四笔（PROVIDER §6.11/§6.17/§6.19/§6.21 · CONFIG §6.3 · SETTINGS-TOOL D-ST16/§4 · MCP §6.5）。按判据 8 抽查：§2.4 表逐档行数与坐标实读核对（config-presets 50 ✓ · provider/core 450 ✓ · list-models 164 ✓ · mcp 296 ✓ · tools/web 225 ✓ · embedding 121 ✓ · cli README 537 ✓ · vsc README 205 ✓ · desktop providers 301 ✓ · 预设键数 21 ✓ · 代码面 `${env:` 零命中 ✓ · H-3 漂移白名单 {hunyuan, siliconflow, groq} ✓ · PROJECT.md:30 C3「21」 ✓）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 需求覆盖 ∕ 可行性 | 🔴 | #57 解析点集（五处）漏「会话标题生成」径：`thincoder-core/generate-title.mjs` 自建请求（`:97` 头装配含 `provider.headers`、`:102` `Authorization: Bearer ${provider.apiKey}`、`:110-113` 自 fetch），经 `ensureSessionTitle`（`:136` `agent.provider`）被 CLI（`thincoder-cli/src/tui/agent-turn.mjs:22`）∕ 桌面（`thincoder-desktop/src/main/turn-face.mjs:34`）∕ VSC 三端共用；该径不在设计五处解析点（批档 `2026-09-29-provider-config-family.md:72` · `docs/core/design/CONFIG.md:173`），而 PROVIDER.md:259 自列「⑤ 会话标题生成」为 `provider.headers` 消费点 ⇒ 与 CONFIG.md:175「不静默字面透传」相抵：引用串按原文上线 → 标题请求 401 → `:113` 静默返回 null（用户可见退化）；AC6 ∕ E-9（批档:86）把点集冻结为「设计五处」⇒ 缺口被静态断言锁死 | 二择一并落档：① 把标题生成径纳入解析点集（§2.4 表加行：现状 143 行 ∕ +~2，AC6 ∕ E-9 点集同步）；② 显式声明「标题径不解析」并登记后果（引用串按原文送出 ∕ 标题静默回落兜底文案）。不得留白 |
| 2 | 文档所有权（机制面一致性） | 🟡 | CONFIG §6.2 纪律句「自有配置 ∕ 行为输入只经四类通道——不得经环境变量」（`CONFIG.md:117` · D-CF5 `:164`）与新增 §6.3（凭据值取自环境）只有 §6.3 侧单向论证（`:181`），§6.2 ∕ §7 决策面零互指；单读 §6.2 会把新机制读成破例 | 在 §6.2 纪律句 ∕ D-CF5 处补互指或例外登记（「值位显式引用 ≠ 配置通道」），与 §6.3 双向指 |
| 3 | 受影响文件尺寸标注 | 🟡 | `thincoder-desktop/src/main/providers.mjs` 行标注「**301** ∕ ±0；贴 300 顾问线——±0 不越」（批档:130）与自身数字矛盾：301 已越 300 顾问线；设计未按「越线 → 拆分评审 ∕ 存量登记」形处置 | 改述为「存量越线 1 行、本批 ±0 不加码」并按既有登记形登记存量（R3 口径：不升级） |
| 4 | 受影响文件完整性（条件分支） | 🟡 | #176 取数规则允许「按 qwen-plan 先例加对齐行」（批档:41）——该路径要动 `thincoder-core/model-specs.mjs`（现 355 行，>300 顾问线），而 §2.4 表（:132）只提「`MODEL-SPECS.md` 条件触达」，未列该源档 ∕ 未给行数增量 | 二择一：① 该分支补受影响文件行（现状 + 预期增删）；② 收紧分支口径（命中既有行 → D-11 族沿用 → `DEFAULT_SPEC` 兜底，零新行） |
| 5 | 验收可核性（静态断言口径） | 🔵 | E-9 ∕ AC6「grep `resolveEnvRefs` ∕ `resolveProviderSecrets` ∕ `resolveMcpServerSecrets` 使用点集 = 设计五处」（批档:86）未界定叶档自身定义 ∕ 内部复用（`env-ref.mjs` 内 `resolveEnvRefMap` 必调 `resolveEnvRefs` ⇒ 自命中），按字面口径不可满足 | 判据写明匹配口径（消费点 = 排除叶档定义 ∕ 内部复用；或按调用点白名单断言） |
| 6 | 坐标（数字漂移） | 🔵 | `PROVIDER.md:303` 注 `thincoder-core/config-presets.mjs:41`——函数体在 `:44`（`:41` 为 JSDoc 首行；批档 §2.2.1 的 `:44-49` 为准） | 坐标收正为 `:44`（或标注「JSDoc 起 :41」） |
| 7 | 跨档滞后（已登记态） | 🔵 | `SETTINGS-TOOL.md:140`「测试档」行列 `thincoder-cli/test/settings.test.mjs`（480 行）与 `thincoder-vscode/test/settings-tool.test.mjs`（9 例）——在盘已不存在（实测：cli ∕ vsc `test/` 仅 `run.mjs` ∕ `slow.mjs` ∕ `smoke-*` 骨架，2026-09-28 全清后）；该行带「机检豁免——用例退场登记」标记 ⇒ 已知登记态 | 仅登记，不动；后续若动 §5 顺手重锚 |

**计数**：🔴 1 ∕ 🟡 3 ∕ 🔵 3（总计 7）

**职责边界专记**：评审为只读，零改档；上表只证与荐。

VERDICT: changes-required

### 轮次 2（评审子代理）

**设计评审轮 2（provider-config-family · #176 ∕ #177 ∕ #57 · 核验轮）**

核验口径：评审对象 = 批次档 §2（含 §2.8 修正轮落账）+ 设计档五笔（PROVIDER §6.11 ∕ §6.17 ∕ §6.19 ∕ §6.21 ∕ §7 · CONFIG §6.2 ∕ §6.3 · SETTINGS-TOOL D-ST16 ∕ §4 · MCP §6.5）；逐项按本轮实读核验，并对修正所依托的代码读数抽样复核（`generate-title.mjs` 143 行 + `:97`/`:102`/`:63` 消费位 + `:117-119` ∕ `:139-141` 双 catch；`thincoder-desktop/src/main/providers.mjs` 301 行（末行空）；`thincoder-core/model-specs.mjs` 355 行——与 §2.8 补行读数一致）。

轮 1 发现逐项状态：
- **#1 ✅ 已修**（原 🔴）：§2.8「#1 块」= 解析点 ⑥ `thincoder-core/generate-title.mjs` `generateTitle` 入口；`CONFIG.md:175`「六处」+ `:176` 标题径非致命兜底句；§2.4 补行（143 ∕ +~2）；AC6 ∕ E-9 = 六处 + 匹配口径；后果检查经代码复核成立（解析抛错落 `ensureSessionTitle` `:139-141` 兜底 ⇒ 不破坏回合；引用串不再按原文上线）。
- **#2 ✅**：`CONFIG.md:119` 边界句 + `:166` D-CF5 补注 + `:232` 变更记录（与 §6.3 双向指）。
- **#3 ✅**：§2.8 改述块 = 301（read 含末行）∕ 内容 300 + 存量越线 1 行登记；实读 `providers.mjs` 末行空 ⇒ 口径成立。
- **#4 ✅**：§2.4 补行 `model-specs.mjs`（355，条件触达 +1~2）；实读 355 一致。
- **#5 ✅**：E-9 匹配口径写明（排除叶档 `env-ref.mjs` 自身定义 ∕ 内部复用，按调用点白名单断言）。
- **#6 ✅**：`PROVIDER.md:303` 坐标 `:44`（+ `:490` 变更记录）。
- **#7 ✅（按建议零改登记）**：`SETTINGS-TOOL.md:140` 带「机检豁免——用例退场登记」，未动。

轮 2 新发现（2 项，均 🔵）：

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 8 | 档内残留（已被 §2.8 取代） | 🔵 | §2.4 句「行数上限核查：全部 < 300 顾问线」（批档:132）与 §2.8 #3 ∕ #4 的两处越线披露并存（providers.mjs 存量越线 1 行 · model-specs.mjs 355）——该句未收正（§2.8 已声明优先：不一致者以本节为准，非阻断） | 下轮若续写 §2.8，顺手给 :132 句加「以 §2.8 越线披露为准」指针或收正 |
| 9 | 验收覆盖（#1 修正残余） | 🔵 | 标题径已入解析点集与静态断言，但用例表（E-1..E-9）无标题径**行为**用例——静态 grep 只证调用点在位，不证解析值确实抵达 `:97` 头装配 ∕ `:102` Bearer（可选项） | 可加一例：变量设值 ⇒ 标题径 Authorization = 真值；未设 ⇒ 零请求 + 标题 `null`（与 `:139-141` 兜底一致） |

**计数**：🔴 0 ∕ 🟡 0 ∕ 🔵 2（轮 1 七项全部消解；修正未引入新 🔴）

**职责边界专记**：评审为只读，零改档；上表只证与荐。

VERDICT: pass

## §4 用户批准（主 agent）

**批准（代签）· 2026-09-29 21:27**——依据 = 用户 13:52 ∕ 17:02 全权（代点火 + 代批 + 代签）。

- **评审状态**：**评审通过**（§3 轮次 2——轮 1 七项 7 ∕ 7 复核成立（含 🔴 #1 标题径）；零 🔴；余 2 🔵 非阻塞）。
- **批准范围** = §2 设计（#176 `huawei` 预设 ∥ #177 收录判据 + 自助指引 ∥ #57 `${env:VAR}` 消费侧解析）+ §2.8 修正读数（解析点 **六处** ∥ E-9 口径 ∥ providers.mjs 301 口径）。
- **U 裁定**：**U1** 照落（`requirements/PROJECT.md:30` 21→22——并入 #654 父侧笔族）；**U2** 照落最小两条（PROVIDER 收录判据条目 + env-ref 能力条目——并入 #654；届盘核名后落）；**U3** 不落（description 面正做瘦身批系——登记备查）；**U4** 知悉（§7 标题自修 = 设计轮已落，一致性面）；**U5** 照派（产品文本面 = 实施舱，全在 §2.4）。
- **实施切分** = 单舱（eng-coder）：核 6 档 + `env-ref.mjs` 叶档 + 两 README + 批内件（含评审 #9 补例：标题径行为例）。
- **验收** = #176-AC1/AC2 ∥ #57-AC1..AC6 ∥ #177-AC2 ∥ 批内件直跑 ∥ AC3 两态（无 key ⇒ 「待验」标注，禁假绿）。

## §5 实施记录（eng-coder）
**状态行**：实施完成 2026-09-29（provider-config-family · 审计 2 轮 + 内评 3 轮 · fix 轮 1 ∥ 覆盖修复轮（§5.5）已落——README :116 收正 ∥ 同族普查净 · 批内件 13 pass · 详 §5.5）



**（实施轮 · eng-coder · 2026-09-29 · provider-config-family 批）**

### 5.1 交付面逐处表（file:line · 本舱实测）

| # | 文件:行 | 交付（改） |
|---|---|---|
| 1 | `thincoder-core/env-ref.mjs`（新叶档 · read 口径 **82** 行） | 四导出：`resolveEnvRefs`（:28）· `resolveEnvRefMap`（:45）· `resolveProviderSecrets`（:58）· `resolveMcpServerSecrets`（:70）；零 import 纯函数；语义 = 整值/内嵌同解 ∥ 多引用 ∥ 非字符串原样 ∥ 未设/空串/畸形 ⇒ 抛错点名 ∥ 单遍（join 组装，无 `$&` 替换面） |
| 2 | `thincoder-core/config-presets.mjs:37-41` | `huawei` 键（`tokenhub` 后 · 最小三字段）+ 行注（证据等级 = 官方口径 + 「待验（无 key）」）；`model = glm-5.3` |
| 3 | `thincoder-core/provider/core.mjs:8,119-122` | `chatImpl` 入口解析（格式分派之前——四 transport ∕ 续写 ∕ advisor ∕ 子代理 ∕ 压缩同享） |
| 4 | `thincoder-core/provider/list-models.mjs:17,98-99` | `listModels` 入口解析（三 format 分支共享） |
| 5 | `thincoder-core/mcp.mjs:9,56-58` | `createConnectedTransport` 建连单点解析（connect ∕ probe ∕ 重连同享）；`configFingerprint`（:234）零改——指纹按存储原文 |
| 6 | `thincoder-core/tools/web.mjs:4,50-52` | `fetchTavily` 读点解析（try 外——抛错零请求；未配置 key 仍走 Bing 回落） |
| 7 | `thincoder-core/embedding.mjs:9,20-21` | `createEmbedder` 读点解析（embedder 持解析值，请求侧零改） |
| 8 | `thincoder-core/generate-title.mjs:12,49-51` | `generateTitle` try 内首句解析（抛错落既有非致命兜底 ⇒ 标题 null，不破坏回合） |
| 9 | `thincoder-cli/README.md:20-21,83` | 计数 twenty-one → twenty-two + 名单加 `Huawei Cloud MaaS (华为云 MaaS)`；`:83` 自定义渠道指引条（add provider → custom ∥ 手写 `providers[]` ∥ 区域端点变体示例） |
| 10 | `thincoder-vscode/README.md:22,95` | 计数 21 → 22 + 名单加；支持渠道表补行 `:95`（fix 轮 1——承内评 #2；+1 行在 §2.4 ±0~+1 预算内） |
| 11 | `thincoder-desktop/src/main/providers.mjs:76` | 注释计数 21 → 22（零行为 · 行数 ±0 · R3 存量登记态） |
| 12 | 批内件（终位 `docs/batches/2026-09-29-provider-config-family.test.mjs`；本舱暂存 `.thincoder/tmp/` 同名件） | 13 例：H-1/H-2 ∥ H-3 ∥ E-1..E-9 ∥ 标题径（评审 #9 补例）∥ 五族读点补齐（embedding ∕ websearch——E-1/E-4 同判据延伸，已披露） |

### 5.2 读数（#176-AC3 两态 ∥ 测试 ∥ 行数账）

**AC3 · 无 key 态（本机）**：`~/.thincoder/config.json` 实读无 huawei ∕ modelarts-maas 渠 ⇒ **无 key、不可实拉**（key 源单通道 = `providers[].apiKey`——`config.mjs:11` 口径）。
- 端点探针（无鉴权）：`GET https://api.modelarts-maas.com/openai/v1/models` ⇒ **HTTP 400 · `ModelArts.81002 Failed to get the authorization header`**（端点在位、鉴权门——非 404）。
- 默认模型 = **官方口径 + 待验（无 key）**：华为云 MaaS 最佳实践 ∕ 快速体验页（GLM-5.3 · 页更新 2026-09-23）QS 示例模型 + 官方 API 样例 `"model": "glm-5.3"` 逐字；与既有规格行 `glm-5.3`（`thincoder-core/model-specs.mjs:69`）前缀命中。
- **禁假绿**：全批「实测」字样零命中（模型名证据等级 = 官方口径 + 待验）；**有 key 复核条件** = 实拉 `/models` 取值回填预设表（行注同记 `:37-40`）。

**测试读数**：`node --test .thincoder/tmp/2026-09-29-provider-config-family.test.mjs`（cwd = 仓根 `thincoder/`）⇒ **13 pass ∕ 0 fail**（~0.9s）；`node --check` 改面 9 个 .mjs 档全绿（实跑）。

**行数账（read 口径 · 本舱实测）**：config-presets 50→**55**（+5：行注 4 + 键 1）· env-ref 0→**82**（新；预算 ~45-55 上浮 = 注释/头注面，正文 ~50 行）· provider/core 450→**455**（+5）· list-models 164→**167**（+3）· mcp 296→**299**（+3；贴 300 未越）· tools/web 225→**228**（+3）· embedding 121→**123**（+2）· generate-title 143→**147**（+4）· cli README 537→**539**（+2）· vsc README 205→**206**（+1）· desktop providers 301→**301**（±0）· 批内件（新）**345**。

### 5.3 审计 ∥ 内评轮次与终态

- **内部偏离审计（explore · 只读 · 轮 1）**：偏离 = **1 处**（PARTIAL：「§5 空」——本记录即其补齐）；SILENT-SIMPLIFICATION ∥ DOC-DRIFT ∥ OUT-OF-LIST 三类**零**；解析点集 = 恰六处（独立 grep 复核）；H-3 白名单 ⊆ {hunyuan, siliconflow, groq} 成立（huawei 命中既有行）。
- **内部代码评审（advisor · code · 轮 1）**：VERDICT = changes-required——**must-fix ×1**（§5 记录面——本记录补齐）· **🟡×3**（VSC README 支持渠道表缺 Huawei 行——fix 轮已补 ∥ 批内件暂存位——**父侧转正** ∥ core.mjs 455>300 顾问线——R3 存量登记不升级）· **🔵×5**（续写径二次解析窄例外 ∥ embedding 构造期解析口径 ∥ desktop 301 贴线 ∥ 行数预算漂移 ∥ CLI README `:116` 环境句可选补注）。
- **fix 轮 1**：① 本 §5 补齐（AC3 读数 + 行数账）；② `thincoder-vscode/README.md:95` 补支持渠道表行（承内评 #2；预算内 +1）。fix 后批内件复跑仍 13 pass ∕ 0 fail。
- **轮次 2（复核）**：见本节末「附记」（终态随记）。

### 5.4 披露

1. **行数超预估面**：env-ref 82（预算 ~45-55）· config-presets +5（预算 +1~2）· core +5（预算 +~3）——均注释面；语义零偏差（行数账见 §5.2）。
2. **登记（不作动）**：① 续写径对已解析对象二次解析（`provider/core.mjs:273`——仅当值内含 `${env:…}` 字面；与「单遍」字面的窄例外，登记）；② embedding 解析时机 = 构造点（env 变更须重建 embedder；重建点齐备——登记）；③ CLI README `:116` 环境句收正 = 可选（设计 §2.4 未列此笔——不动作，候父侧裁）。
3. **笔域**：需求档 ∥ 设计档 ∥ 既有 21 渠道语义 ∥ MCP `url`/`command`/`args` ∥ 非敏感值位 —— **零触**；本舱 = 产品码 8 档 + 产品文本 3 档 + 批内件 1 档（全在 §2.4 ∩ §2.8 清单内）。
4. **批内件落位**：写门拒直写 `docs/batches/`（「跨批批次档写」拒——本机在跑的写门版本未含伴随件收窄）⇒ **父侧转正**；暂存件与终位两处均可跑（导入按 `process.cwd()` 解析）。
5. **out-of-scope（列报 · 零动作）**：`docs/core/design/MODEL-SPECS.md:611-615` 计数登记面仍记 21（不在本批射程）；`docs/core/requirements/PROJECT.md:28` C1「apiKey 缺省回退环境变量」为既有残留（同档 `:30` C3 计数 22 已由父侧随本批落 ✓）。

**附记 · 轮次 2 复核与终态（eng-coder · 2026-09-29）**

- **内评轮次 2（fix 核验轮）**：VERDICT = **pass**——轮 1 must-fix（§5 记录面）核验补齐；fix 轮 1 两处（本 §5 ∥ `thincoder-vscode/README.md:95` 支持渠道表行）实读复核通过；未引入新 🔴。余项 = 登记态（R3 存量 ∥ 父侧 coordination ∥ 可选收正）——非阻断。
- **附记指针收口**：本节 §5.3「轮次 2（复核）：见本节末「附记」」由本附记闭合。
- **终态**：`clean`（审计 1 轮：偏离 1 处 = §5 空——已闭；内评 2 轮：轮 1 changes-required → fix 轮 1 → 轮 2 pass）。
- **交付前最终复核**：批内件 `node --test .thincoder/tmp/2026-09-29-provider-config-family.test.mjs` ⇒ **13 pass ∕ 0 fail**（fix 后终跑，~1.9s）；`node --check` 改面 9 个 .mjs 档绿。
- **待父侧项**（非阻断）：① 批内件转正 `docs/batches/2026-09-29-provider-config-family.test.mjs`；② `docs/core/design/MODEL-SPECS.md:613-614` 计数登记面收正（列报 · 零动作）；③ CLI README `:116` 环境句可选收正（候裁）。

### 5.5 覆盖修复轮（单点 `:116` ＋ 同族普查 · eng-coder · 2026-09-29 · 追记于 附记 之后）

**来由**：承 §5.4 披露 2③ ∥ 附记「待父侧项」③——「CLI README `:116` 环境句收正 = 可选（候父侧裁）」；父侧已派单（定点形 = config 唯一源 ＋ 敏感值位可引 `${env:VAR}` 消费侧解析 ＋ 无纯环境变量配置通道 ∥ 无 env-only 覆盖）。

**逐处表**：

| # | 文件:行 | 交付 |
|---|---|---|
| 1 | `thincoder-cli/README.md:116-117` | 旧句单行（原 :116「…no environment-variable configuration is supported.」）→ 新形**两行**：`:116`＝「comes exclusively from `~/.thincoder/config.json` — the single source of truth. Sensitive value fields (e.g. a provider's `apiKey` or `websearch.apiKey`)」；`:117`＝「may hold a `${env:VAR}` reference, resolved at use time — … There is no environment-variable-only configuration channel and no env-only override.」。行宽 **167 ∥ 198**（≤300，未增超宽行）；档总行 **539 → 540**（+1 拆行） |
| 2 | `thincoder-vscode/README.md` | 同族普查 = **零命中**（`environment` ∥ `env var` ∥ `env-var` ∥ `env-only` ∥ `${env` ∥ `no environment` ∥ `exclusively` ∥ `variable` 全档扫，仅 `:183` CSS 注释词）⇒ **零改** |

**验证读数（AC 逐条）**：

- **AC①（陈旧断言零残留 · grep 作证）**：精确串 `no environment-variable configuration is supported`——① `thincoder-cli/README.md` **零命中**；② 工作树全域全树实扫（27,980 档 · 除 `.git`；234MB 二进制 `electron.exe` 与 6 处**目录符号链接**（均指 `thincoder-core` / `thincoder-render-core`——已在扫描域内）除外）**仅 3 处非规范面命中** = `.thincoder/tmp/**` 本机 npm packument 缓存 ×2 ＋ probe 装入件 `node_modules/thincoder/README.md`——皆为**已发布包**历史副本，非规范面；③ `thincoder-vscode/README.md` 同族句 **零命中**。
- **AC②（D6 读回）**：`thincoder-cli/README.md:116-117` 逐字读回在盘；档总 540 行（read 口径）。
- **批内件复跑（本舱）**：`node --test docs/batches/2026-09-29-provider-config-family.test.mjs`（cwd = 仓根）⇒ **13 pass ∕ 0 fail**（~1.5s）。
- **机制真值核**：六消费点 import 在位（`provider/core.mjs:8` · `provider/list-models.mjs:17` · `mcp.mjs:9` · `tools/web.mjs:4` · `embedding.mjs:9` · `generate-title.mjs:12`）＋叶档四导出（`env-ref.mjs:28/:45/:58/:70`）——新句断言为真、非空头承诺。

**审计 ∥ 内评（本轮）**：

- 内部偏离审计（explore · 只读 · 轮 1）：**零偏离**（PARTIAL ∥ SILENT-SIMPLIFICATION ∥ DOC-DRIFT ∥ OUT-OF-LIST 四类均无；独立复核 = 要素 A–E 覆盖 ∥ 邻文未波及 ∥ 需求/设计档零触）。
- 内部代码评审（advisor · code · 轮 1）：**VERDICT = pass · 零 🔴**（🟡×1 optional ∥ 🔵×2；越界注若干）。三项可选项**均不落**（不越父侧定点形/批预算——候父侧裁）：① 🟡「失败面半句（未设/空串 ⇒ 抛错）未入句」——advisor 自判「不补亦不构成失实」；② 🔵 极性措辞提示——`CONFIG.md:184` 双向一致为证、判非机制矛盾；③ 🔵 VSC README 对称面留白——批预算 ±0~+1 已被 `:22`/`:95` 用尽。
- **fix 轮 0**（无 must-fix）——本轮首过即收敛。

**披露**：

1. **笔域**：本笔 = 产品文本面 **1 档**（cli README）＋ 本记录；需求档 ∥ 设计档 ∥ 功能语义（纯文本）——**零触**。
2. **行数随动**：§5.2 账记 cli README 539 → 现值 **540**（+1 拆行）；vsc README **206** 不变——父侧 §6 收口笔宜连带记。
3. **越界注（列报 · 零动作）**：`docs/core/design/DOC-CODE-RECONCILE.md:243`（A6 行）仍引被删句判「`:99`『no environment-variable configuration』成立」＋坐标 `:99`/`:114` 陈旧（同表其余锚点系**预存在**滞后、非本笔所致）——其实质（无配置类 env 回退）仍真、由新句 `:117` 末句承接；建议父侧文档层随 §6 补注或重锚（设计档零触纪律，不自笔）。
4. **排除域锚点校读**：派单排除项「:18-19 计数行」实读计数句在 `:20-21`（`:83` 指引条相符）——均在排除域内，账目提示、零动作。
5. **未证面**：工作区根（`thincoder/**` 之外，如 `D:\teamcode\README.md`）未扫——本笔「零残留」结论限域 = `thincoder/**` 工作树全域（实扫已核），`.git` 库内旧版本（未提交态）不计。

**终态**：`clean`（本轮：审计 1 轮零偏离 ∥ 内评 1 轮 pass · 零 🔴 · 余项均 optional 非阻断）。

## §6 验证与收口（父代理）

**§6 验证与收口（主 agent）· 2026-09-29**

- **交付核验**：#131 实施舱（12 处——`env-ref.mjs` 82 行 ∥ huawei 预设 ∥ 六解析点 ∥ 两 README ∥ 桌面注释）逐处抽核在盘；批内件亲跑 **13/13**（终位 `docs/batches/2026-09-29-provider-config-family.test.mjs` 344 行）；修补轮 #146（README `:116-117` 陈旧断言收正——零残留三层 grep 作证）∥ cli README 540 行。
- **AC 面**：#176-AC1/AC2/AC3（无 key ⇒ 端点探针 HTTP 400 鉴权门 + 官方口径名「待验」——禁假绿）/AC4 ∥ #177-AC2/AC3 ∥ #57-AC1..AC6。
- **需求面**：`PROVIDER.md` §2.1 收录判据条目 ∥ `CONFIG.md` §2.1 `${env:VAR}` 条目 ∥ `requirements/PROJECT.md:30` C3 21→22（#654⑤⑦ 同批落）。
- **台账**：#176 ∥ #177 ∥ #57 → 核销；遗留 = #676（MODEL-SPECS 计数 ∥ C1 残留）+ #682（DOC-CODE-RECONCILE:243）。
- **状态**：本批收口。
