# DeepSeek V4.1-Flash 接入（两端 MODEL_SPECS + 预设） · 批次记录（2026-09-11）

> **搬迁注记（LEDGER-SELF-CONTAINED 批——拆分 · 已切除 2026-09-12）**：本档对端（VSC）份**已自本档切除**（原文不再留本仓——D11 完全态）；承载档 = VSC 仓 `docs/batches/2026-09-11-DEEPSEEK-V41-FLASH（VSC 仓）`（逐字搬运、零改写——D10）。
> 已切除条目清单：§2 受影响文件表 VSC 行（4 行 = VSC 源 2 + VSC 测试 2）——条目计数（对端份 / 本仓份）= 4 / 4（判据 = `docs/design/LEDGER-SELF-CONTAINED.md` §8.3 拆分表）。**源档 blob SHA（切除前）= `18f93661d7e9`**。
> 变更记录：2026-09-12——对端份经承载档逐字承接后自本档物理切除；§2 受影响文件表合计 8 → 4 文件。

> 六段 append-only，**一段一作者**：§1 讨论（主 agent）· §2 批次任务（eng-designer）·
> §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 不是规格：需求内容按**新老划断**同档承载（Provider 板块无 `requirements/` 镜像，需求层落
> `../design/PROVIDER.md`）；整批做完本档冻结。
> 机制与模板见 `requirements/ENGINEERING-MODE.md` §1.12。**本档 = 第 6 批**
> （第 1 批 ENGINEERING-MODE / 第 2 批 ENG-DESIGNER / 第 3 批 MODEL-SELECTION / 第 4 批 C 工具 / 第 5 批 VSC-MIRROR）。
> （父侧形态更正 2026-09-12：空占位行已清——实体内容见对应节；空占位 = 残留即先例）

---

## §1 讨论（主 agent）

### 批次范围

**单点批次**：两端 MODEL_SPECS 表更新（DeepSeek V4.1-Flash 接入）+ 渠道预设 `deepseek` 的默认模型更新。
**不含**：其它厂商 spec 复核 · MODEL_SPECS 前缀匹配隐患（另条独立待办）· 用户本机 config 改名（用户环境事，见下）。

### 谈成什么（逐条）

1. **触发（用户原话）**："你查一下 deepseek 新的 deepseek-flash 的模型参数，更新两端的 model_spec"。
2. **事实已核（官方一手 + 渠道实测双向印证——非推断）**：见下表。
3. **预设一并改**（用户 2026-09-11 02:09"那就改吧"——选项 (b)：spec 表 + 预设各端 1 行）。
4. **`deepseek-v4-pro` 行的处理**：留待 designer 裁（保留 + 注释 / 跟进 9/14 路由后语义），本批不预设结论。

### 已核事实（官方一手 · 供 designer 免重复核查）

> 源：`api-docs.deepseek.com` 五页（Your First API Call / Models & Pricing / Vision / Thinking Mode / Context Caching）
> + **本机渠道 `GET /models` 实跑**（2026-09-11：`["deepseek-flash","deepseek-v4-pro"]`）。

| 事实 | 内容 |
|---|---|
| 新模型名 | **`deepseek-flash`** = **DeepSeek-V4.1-Flash** |
| 参数 | **context 1M** · **maxOutput 384K** · thinking 支持（**默认启用**，默认 effort `high`）· effort 枚举 `low/high/max` · Chat Prefix Completion (Beta) ✓ · **磁盘缓存默认启用**（cache hit/miss 分档计价）· **Vision ✓（多模态）** |
| 思考控制 | OpenAI 格式 `{"thinking":{"type":"enabled/disabled"}}`（= 现有 `thinkApi:"type"`）；`reasoning_effort` ∈ `low/high/max`；thinking 模式下 temperature 无效、top_p 下限 0.95 |
| reasoning 回传 | 带 `tools` 的请求**必须**全程回传 `reasoning_content`，否则 400（= 现有 `reasoningEcho:"required"` 语义成立）|
| 图片约束 | 图片**仅限 user 消息**（system/assistant 带图 → 400）；JPEG/PNG/GIF/WebP |
| 退役（旧名仍收） | `deepseek-v4-flash` · `deepseek-v4-flash-vision-exp` —— **模型已退役**，请求由 V4.1-Flash 服务、按 Flash 计价 |
| 退役（有日期） | **`deepseek-v4-pro`（V4-Pro-0813）**：自 **2026-09-14 12:00（北京）** 起全部请求路由到 V4.1 Flash（V4 Pro 有序退役，等 V4.1 Pro）|
| 官方定性 | "V4.1 Flash 在性能、成本、速度、总时长上全面超过 V4 Pro" |

### 对账结果（与现有文档/代码的冲突点）

| # | 现存表述 | 本批处置 |
|---|---|---|
| 1 | `thincoder-cli/src/model-specs.mjs:29-32` 三行 deepseek（pro / flash / flash-vision-exp） | 新增 `deepseek-flash` + 两条退役名对齐 V4.1 Flash（含 `multimodal: true`）|
| 2 | `src/config.mjs:25-28`（VSC 仓）同三行（多 `reasoningEffortDefault: "high"` 字段） | 同上（各端独立实现、语义同源）|
| 3 | `thincoder-cli/src/config.mjs:36` 预设 `deepseek: { … model: "deepseek-v4-pro" … }` | `model` → `"deepseek-flash"`（多模态可用 + 官方定性更优）|
| 4 | `src/config-presets.mjs:11`（VSC 仓）预设同款 | 同上 |
| 5 | `PROVIDER.md` §9（规格表与决策）/ §11（模型支持与预设） | 本批设计落点（需求层 + 设计层）|
| 6 | 用户本机 `~/.thincoder/config.json` 的 `deepseek` 渠道 `model: "deepseek-v4-flash"`（退役名，仍可用） | **非本批代码事**——改名与否属用户环境（待用户许可，父侧可代改）|

### 本批需求清单（回读给用户 → 用户确认）

| # | 需求点 | 落地面（初判——全清单以 §2 为准） | 状态 |
|---|---|---|---|
| 1 | 新增 `deepseek-flash` 行（V4.1-Flash 全套参数，含 `multimodal: true`） | 双端 spec 表 | 待设计 |
| 2 | `deepseek-v4-flash` 行 → 对齐 V4.1 Flash（含 `multimodal: true`——行为变化：deepseek 渠道将允许贴图） | 双端 spec 表 | 待设计 |
| 3 | `deepseek-v4-flash-vision-exp` 行 → 对齐 V4.1 Flash（已 multimodal） | 双端 spec 表 | 待设计 |
| 4 | `deepseek-v4-pro` 行 → 9/14 路由的处置（保留 + 注释 / 跟随语义） | 双端 spec 表 | 待设计（designer 裁，见 §16 决策记录） |
| 5 | 预设 `deepseek` 默认模型 → `deepseek-flash` | 两端各 1 行 | 待设计 |

### todo 项（提交 designer 时必须带上）

**= 上表 5 条 + 以下随件项 2 条**：

1. **文档连带**：`PROVIDER.md` §9/§11 改写 + 变更记录一行；VSC 镜像档（若 VSC 侧有对应节）同步。
2. **测试面**：若现有测试对 deepseek spec 行 / 预设取值有断言，逐条核对并同步（designer 勘察定，列入 §16.5 受影响文件）。

### 过程留痕

- **事实源**：官方文档五页（一手）+ 渠道 `/models` 实跑（二手印证）——两源一致才落档（沿用 spec 表"官方一手核实"惯例）。
- **排期**：本批与第 3 批**共改 `PROVIDER.md`**——故开工等第 3 批文档面释放（用户未指示插队 → 默认等收口）。
- **批次编号**：第 6 批（4 与 5 已被其它链占用）。

### 状态

**已收口 2026-09-11**（用户"那就改吧"：spec + 预设一并改）。下一步 = **设计**
（spawn eng-designer；设计落 `../design/PROVIDER.md` §9/§11）。

---

## §2 批次任务（eng-designer 自写）


**状态：任务书就绪**（2026-09-11——设计已落档，待设计评审）。设计档 = `../design/PROVIDER.md` §18（需求层）/
§19（设计层）/ §20（测试层）；VSC 镜像档 `PROVIDER（VSC 仓）` 对应节已同步。
实施者 = eng-coder（设计 token 门）。本 §2 = coder 任务书本体（不另写副本）。

### 目标与已知事实（免重复勘察）

**目标**：把两端 MODEL_SPECS 表与渠道预设 `deepseek` 更新到 DeepSeek V4.1-Flash 事实面（新名接入 +
两退役名对齐 + pro 限期路由处置 + 预设改指）——纯数据面更新，机制零动（详见设计档 §19.1）。

**已知事实**（as-of 2026-09-11；精确行位）：
- 字段契约逐项 = 设计档 §19.2（a）；预设改动 = §19.2（b）；前缀核对结论 = §19.2（c）——**零冲突**，
  勿"修"不存在的问题（`SORTED_SPECS` 长度降序使各名命中自身行）。
- CLI 行位：`src/model-specs.mjs:27-33`（deepseek 块——新行置块首）；`src/config.mjs:36`（预设行）。
- VSC 行位：`src/config.mjs:22-28`（deepseek 块）；`src/config-presets.mjs:11`（预设行）。
- 测试位：CLI `test/config-merge.test.mjs:31`（预设断言改值）；VSC `test/config-merge.test.mjs:129-137`
  （预设套件内追加断言）；VSC `test/image-downgrade.test.mjs:107-112`（视觉判据套件内追加断言）。
- VSC 侧行须多携 `reasoningEffortDefault: "high"`（VSC-only 字段——`src/extension/settings.mjs:322` 消费）。
- 新增 CLI 测试档 `test/deepseek-v41-specs.test.mjs`（设计档 §20.1 的 T30–T34 落点）。
- 行注释必须含：两退役名的"退役/仍收/路由"标注 + pro 的 9/14 日期（AC-13/AC-14 有 grep 判据）。

### 本批覆盖的需求条目（R11–R17——与设计档 §18.2 同源）

| # | 条目 | 落地面 |
|---|---|---|
| R11 | 新增 `deepseek-flash` 行（V4.1-Flash 全套参数，含 `multimodal: true`） | 双端 spec 表 |
| R12 | `deepseek-v4-flash` 行对齐 V4.1 Flash（含 `multimodal: true`——行为变化：允许读图/贴图） | 双端 spec 表 |
| R13 | `deepseek-v4-flash-vision-exp` 行对齐 V4.1 Flash（注释标注退役/路由） | 双端 spec 表 |
| R14 | `deepseek-v4-pro` 行：保留 + 注释（9/14 路由；**不加 `multimodal`**） | 双端 spec 表 |
| R15 | 预设 `deepseek` 默认模型 → `deepseek-flash` | 双端各 1 行 |
| R16 | 文档连带（随件）——**已由 designer 落档**（CLI §9/§11 + §18–§20；VSC 镜像档对应节） | 文档 |
| R17 | 测试面同步（随件）：既有断言同步 + 新增断言 | 双端测试 |

### 明确不在本批（= 设计档 §18.4 边界清单——逐条）

- **不**改 MODEL_SPECS 前缀匹配机制本身（短前缀继承隐患——另条独立待办）。
- **不**改其它厂商任何 spec 行；`deepseek-v4-pro` 行字段零改（R14 只加注释）。
- **不**做"按日期切换规格"的运行期机制（静态表 + 行注释承载日期语义）。
- **不**动用户本机 `~/.thincoder/config.json`（用户环境事）。
- **不**改 `CONSULTATION.md` / `ESCALATE.md` / `SESSION.md` 等档的 `deepseek-v4-pro` 示例值。
- **不**改多模态消费链（read_image 门 / 视觉渠道 / 贴图门 / 注入）——数据变化经既有机制生效。
- **不**改提示词 / README / CHANGELOG / `docs/TODO.md`；不 commit；**不**改文档面（已落档）。

### 受影响文件（实施者写域——spawn `files` 声明同此，共 4 文件）

| 端 | 文件 | 改动要点 |
|---|---|---|
| CLI 源 | `thincoder-cli/src/model-specs.mjs` | 新行 + 两退役名对齐 + pro 注释 + 块注释 |
| CLI 源 | `thincoder-cli/src/config.mjs` | 预设 `deepseek.model` → `deepseek-flash` |
| CLI 测试 | `thincoder-cli/test/config-merge.test.mjs` | `:31` 预设断言改值 |
| CLI 测试 | `thincoder-cli/test/deepseek-v41-specs.test.mjs` | **新增**（T30–T34） |

> 文档面（双端 `PROVIDER.md`）已由 designer 落档——**不在 coder 写域**；发现文档与实现不符 → 报告，勿径改。

### 验收标准（AC-11–AC-17——机器可验证；判据全文 = 设计档 §20.2）

- **AC-11（R11）**：`cd thincoder && node --test test/deepseek-v41-specs.test.mjs` 全绿；
  VSC 仓 `node --test test/image-downgrade.test.mjs` 全绿。
- **AC-12（R12）**：同套件内退役名对齐 + 行为放行断言（`multimodal` 为真——read_image / 视觉判据）。
- **AC-13（R13）**：vision-exp 行 = 契约；`grep -n "vision-exp" thincoder-cli/src/model-specs.mjs` 命中退役/路由注释。
- **AC-14（R14）**：pro 行零改 + 非多模态断言；`grep -n "2026-09-14"` 双端源文件非空。
- **AC-15（R15）**：双端 `node --test test/config-merge.test.mjs` 全绿（预设值断言）。
- **AC-16（R16）**：双端 `node scripts/check-doc-width.mjs`——本批文件新增超宽 0、本批面新增违规 0
  （仓内存量与它在飞批条目不计——观察见设计档 §19.6（d））。
- **AC-17（R17）**：双端 `npm test` 全绿（含新增面与既有断言同步面）。

### 交付报告格式（eng-coder → §5）

1. **改动清单**：文件 → 实际行数变化 + 要点（逐条对齐设计档 §19.4）。
2. **测试证据**：AC-11–AC-17 逐条命令 + 结果（关键输出行粘贴；长测试落盘再读）。
3. **偏差登记**：与设计档的任何差异（字段/行数/命名/位置）+ 理由；无偏差写"零偏差"。
4. **未决项 / 阻塞点**（若有）。

### 评审修正轮同步（2026-09-11——设计档 7 条采纳项落档后；本轮不新增编号）

**状态更新**：设计评审（轮次 1）pass——修正轮已落设计档（CLI §18–§20 + VSC 镜像档 §6.1）；本追加 = §2 同步（判据全文权威 = 设计档 §20.2；与上文本冲突时以本追加为准）。实现待用户批准（§4）。

- **AC-13 增补（VSC 侧判据——原「（双端同款）」具体化）**：新增 VSC 仓 `grep -n "vision-exp" src/config.mjs`——命中行注释含退役/路由字样；T31（CLI）/ T36（VSC）覆盖 vision-exp 行字段。
- **T36 扩面（VSC）**：关键字段断言扩至 vision-exp 行（三行 = 契约）——落点不变（`test/image-downgrade.test.mjs`）。
- **T38 扩面（双端）**：增 pro 只读字段锚（`context` 1M / `maxOutput` 384K / `prefixMode` true / `reasoningEffortEnum`——防实施误改）——落点 = CLI 新档 pro 段 + VSC `test/image-downgrade.test.mjs`。
- **设计档其余修正（非 §2 面，以设计档为准）**：§19.5 #3 / N7 增重评触发（2026-09-14 12:00 路由生效后复检——视觉能力位是否翻转）；a1/a2 措辞降级（pro 视觉能力未核实——保守）；§19.2(c) 字符位改准（第 10 字符）；§19.2(a) tempRange 出处补记（沿用既有行现值）；§19.4 VSC 行补块注释改写句。
- **实施面无变化**：无新增文件、无新增编号；受影响文件清单（8 文件）与写域声明不变。

（eng-designer 评审修正轮追加 2026-09-11——任务书自此以「上文本 + 本追加」为准。）

## §3 设计评审（评审子代理自写）


### 轮次 1（评审子代理）

**设计评审（轮次 1）**——范围：CLI `docs/design/PROVIDER.md`（§9/§11/§16.2 M3 + §18–§20）· VSC 镜像档 `docs/design/PROVIDER.md`（§2/§6.1/§8/变更记录）· 本档 §2 任务书。对象状态 = 待评审。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 需求/决策 | 🟡 | a1 保守决策（§19.3）代价已写、重评入口已列（§19.5 #3：V4.1 Pro 到货 / 用户裁定），但两处不闭环：(a) 触发集不含 9/14——2026-09-14 12:00 起该名由 V4.1-Flash（§1：Vision ✓）服务，「预支视觉 = 硬失败」的防 400 理由届时消失，而重评只挂日期未知的「V4.1 Pro 到货」；**…余文见「§3-补 1」** | **（见「§3-补 1」）** |
| 2 | 依据溯源 | 🟡 | a1/a2 的硬失败前提「9/14 前由 V4-Pro-0813 服务（无视觉）」（§19.3 a1 判据列 / §19.5 #3 理由列）在 §1 已核事实表内无对应行（§1 只记该名路由日期与「仍收」）——按「仅凭 §1 与本档、不得外推」口径属未入档断言。前提成立则 a2 否决成立；不成立则 a2 的「3 天硬失败窗口」代价项消失、否决只剩换锚成本。保守结论两种情况均安全，但不该以未溯源断言的形态承载。 | 补记来源（官方页/实测）一行，或降级措辞为「现行表未声明视觉（未核实）——维持现状保守」；a2 否决理由同步改措辞。 |
| 3 | 验收标准 | 🟡 | R13 的 VSC 半无机器判据：AC-13 只给 `cd thincoder && grep -n "vision-exp" src/model-specs.mjs`，「（双端同款）」无对应命令；T31（vision-exp 字段契约）亦 CLI-only——**…余文见「§3-补 3」** | **（见「§3-补 3」）** |
| 4 | 验收标准 | 🔵 | R14「行字段零改」无直接断言：T38 只锚 `multimodal` 非真 + 既有锚用例；pro 行其余字段（context/maxOutput/prefixMode/effort enum/tempRange）若被实施误改，双端测试无拦截（§19.6(c) #6 明确不建快照/跨仓一致性机制——本项只建议加只读值锚，不建新机制）。 | T38 顺带加 pro 只读字段锚（context 1M / maxOutput 384K / prefixMode true / effort enum），3–4 行断言即可防误改。 |
| 5 | 清晰度 | 🔵 | §19.2(c) 字符位计数 off-by-one：「第 9 字符均为 `v`，新键第 9 字符为 `f`」——实际第 9 字符双方均为 `-`，分叉在第 10 字符（`v` vs `f`）；长度数（14/17/28/15）与结论（互不为前缀、各自命中自身行——对照 `SORTED_SPECS` 长度降序 + `lookupSpec` 实测）均无误。 | 改「第 9」为「第 10 字符（`deepseek-` 之后首字符）」。 |
| 6 | 依据溯源 | 🔵 | §19.2(a) 逐项依据中仅 `tempRange: [0,2]` 无 §1 事实行（其余 10 项——context/maxOutput/thinking/prefixMode/multimodal/cacheMode/thinkApi/reasoningEcho/effort enum/默认 effort——均有落点）；该值三行中两行沿用既有行现值、新行继承（`src/model-specs.mjs:29/30/32` 实测），风险低；映射表声称的「官方参数页」在档内不可复核。 | 补记出处，或明示「沿用既有 DeepSeek 行现值」。 |
| 7 | 行为变化告知 | 🔵 | 旧名行为变化（`deepseek-v4-flash` 起允许读图/贴图）已入档且可判定：批次 §1 需求点 2（「行为变化：deepseek 渠道将允许贴图」，随需求清单回读用户）、R12 判定句、§19.3 b1、VSC 镜像 §6.1/§8；VSC 连带面（该渠道进入视觉判据/贴图放行）同档。唯一缺口 = 用户可见发布注记（CHANGELOG 明确不在本批范围）。 | 发布流程时补 CHANGELOG 一行注记（父侧发布面，非本批交付物）。 |
| 8 | 受影响文件 | 🔵 | VSC 源块注释将成 stale：`src/config.mjs:23-24`（VSC 仓）「DeepSeek V4 series (official Models & Pricing: **dual models**…)」——本批后该名下有 4 行（新名 + 两退役名 + pro）；§19.4 CLI 行明示「块注释改写」，VSC 行只写「同 CLI 行集」，未点明是否含该块注释改写。 | VSC 行补「块注释同步改写（dual models 句）」一句，或在 §2 已知事实中明示。 |

**断言核验（实测）**：双端 8 个受影响文件行数与行位逐条一致（172 / 487 / 174 / 184 / 41 / 180 / 127；deepseek 块 `model-specs.mjs:29-32` ↔
`src/config.mjs:25-28`（VSC 仓）；锚测试 `read-image-guide.test.mjs:20` / `image-downgrade.test.mjs:24/59/109`）；§19.2 引用锚（`file.mjs:168-173` 门、
`record-results.mjs:47-55`、`execute-tools.mjs:384-387`、`settings.mjs:322`）逐条成立；三档宽度扫描（≥301 字符行）为零；
「VSC 无 deepseek 预设断言」「CLI 预设断言唯一命中 `config-merge.test.mjs:31`」等声明与现状一致；非视觉锚不受影响的论证成立（pro 零改）。

> **§3-补 1 / §3-补 3**（父侧格式整备——表内第 1、3 条余文与建议；**原文文字逐字保留**，仅移出表单元）
>
> **§3-补 1 余文**：(b) 入口仅存于设计档一句话、无追踪载体（§2 任务书将 `docs/TODO.md` 列为禁改面）。
> **§3-补 1 建议**：把「9/14 路由生效后复检」补为第三触发（或说明届时为何仍不翻转）；复检登记为父侧协调项，使 N7 的「显式」有可被触发的接收方。
>
> **§3-补 3 余文**：VSC 端 vision-exp 行/注释（§19.4 VSC 行「同 CLI 行集」含注释）在测试层零断言。
> **§3-补 3 建议**：补一行 VSC 仓 `grep -n "vision-exp" src/config.mjs`（命中退役/路由字样），或把 T36 关键字段断言扩到 vision-exp 行。

**计数**：发现 8 条——🔴 0 · 🟡 3 · 🔵 5。批准链不受阻（无 🔴）。

VERDICT: pass

## §4 用户批准（主 agent 记）

**2026-09-11 02:40 用户批准**（原话："批准"）——**修正轮落地 + 父侧核验后的正式签字**。
本次采用「**严格序**」口径：原则性批准（02:30）→ 修正轮落地（id=15）→ 父侧逐条核验 → **冻结文本呈报** → 本签字。

- 设计评审（轮次 1）**pass**（0🔴 · 3🟡 · 5🔵——发现表见 §3）；
- 8 条发现经主 agent 裁决：**7 Fixed + 1 Deferred**（发布面 CHANGELOG 一行——已登记 `docs/TODO.md:139`）；
- 7 条已落档并经父侧**实文核验**（11/11 关键串：9/14 复检触发 · 「未核实」措辞替代旧硬断言 · AC-13 VSC 判据 · T36 扩 vision-exp ·
  T38 pro 只读锚 · 「第 10 字符」 · tempRange 出处 · VSC 块注释句）；VSC 镜像档同步 ✓；
- 机检：**本批档 0 行超宽**（§3 两条表格行余文移入「§3-补 1/3」+ 核验段折行——文字逐字保留）；VSC 仓全绿；CLI 余项 = 存量档 + 他批 `POOL-LEDGER`；
- **父侧协调项**：`docs/TODO.md:139`（9/14 路由生效后复检 + V4.1 Pro 到货复检 + 发布 CHANGELOG 注记）。

**批准范围**：R11–R17 双端实现——**8 文件**（CLI 2 源 + 2 测试 / VSC 2 源 + 2 测试），**单 coder 双端顺序**。
**不含**：其它厂商 spec 行 · `docs/**`（设计档归 designer）· CHANGELOG（发布面）· 用户本机 config 改名（另议）。
**凭证**：经 spawn 参数传递，**不落档**。

**下一节点**：eng-coder（双端 8 文件）→ 交付 → 父侧实跑验收 → 用户验收 → §6 收口 + 令牌消费。

## §5 实施记录（eng-coder 自写）


### 实施记录（双端实施 · 2026-09-11）

_（上方占位行随 append-only 保留——以本段为准。）_

**交付摘要**：4 文件全部落地（CLI 2 源 + 2 测试）——双端 spec 表新增
`deepseek-flash` 行、两退役名对齐 V4.1-Flash（加 `multimodal`）、`deepseek-v4-pro` 保留 + 注释
（字段零改）、预设 `deepseek.model` → `deepseek-flash`。纯数据面更新——read_image 门 / 视觉判据 /
注入链经 `specForModel` 数据驱动，机制零改（N5）。

**改动清单（实测行数——HEAD 基线 → 现状）**：

| 文件 | 行数 | 要点 |
|---|---|---|
| `thincoder-cli/src/model-specs.mjs` | 171 → 179 | 块首新行（`:33`）；`deepseek-v4-flash` 加 `multimodal`（`:38`）；`vision-exp` 行保持（`:40`）；`pro` 零字段改 + 注释（`:36`）；块注释改写（`:28-32`） |
| `thincoder-cli/src/config.mjs` | 486 → 486 | 预设 `:36` 改值（1 行，净增 0） |
| `thincoder-cli/test/config-merge.test.mjs` | 173 → 176 | T35：`:31` 改值 + `:32-34` 只读锚（advisor 轮 1 第 2 条采纳） |
| `thincoder-cli/test/deepseek-v41-specs.test.mjs` | 新增 86 | T30 / T31 / T32 / T33 / T34+T38（5 用例） |

**逐需求透明表（R11–R17——Done / Simplified / Not done）**：

| # | 需求 | 状态 | 证据 |
|---|---|---|---|
| R11 | 新增 `deepseek-flash` 行（含 `multimodal`） | Done | 双端行（CLI `:33` / VSC `:28`）；T30 / T36 字段锚；T33 门放行 |
| R12 | `deepseek-v4-flash` 对齐（加 `multimodal`——行为变化） | Done | 双端行（CLI `:38` / VSC `:33`）；T31 / T36；T33 放行 + VSC 视觉判据命中 |
| R13 | `vision-exp` 行对齐 + 退役注释 | Done | 双端行（CLI `:40` / VSC `:35`）；T31 / T36；AC-13 双端 grep 命中 retired 字样 |
| R14 | `pro` 保留 + 注释（零字段改 / 不加 `multimodal`） | Done | 双端行（CLI `:36` / VSC `:31`）；T34 / T38 只读锚；AC-14 双端 grep 9/14 日期非空 |
| R15 | 预设 `deepseek` → `deepseek-flash` | Done | 双端改值（CLI `:36` / VSC `:11`）；T35（含其余字段不变锚）/ T37 |
| R16 | 文档连带（随件——设计者面） | Done | 设计档 §9 / §11 + §18–§20 与 VSC 镜像 §6.1 / §8 已落；AC-16 本批面新增 0 |
| R17 | 测试面同步（随件） | Done | 4 测试文件（新增 1 档 + 3 档扩改）；T30–T38 全覆盖；实跑见下 |

**验收实跑（AC-11–AC-17——长测试先落盘再读）**：

- AC-11 / AC-12：`cd thincoder && node --test test/deepseek-v41-specs.test.mjs` → 5 pass / 0 fail；
  VSC 仓 `node --test test/image-downgrade.test.mjs test/config-merge.test.mjs` → 18 pass / 0 fail。
- AC-13：`grep -n "vision-exp"` 双端源文件——CLI `:39` / VSC `:34` 行注释含 retired / 仍收 / 路由语义。
- AC-14：`grep -n "2026-09-14"` 双端源文件非空（CLI `:35` / VSC `:30`）。
- AC-15：双端 `node --test test/config-merge.test.mjs` 全绿（CLI 7 / 7 · VSC 10 / 10）。
- AC-16：`node scripts/check-doc-width.mjs` 双端——本批文件新增超宽 0 行；VSC 仓 0 新增违规；
  CLI 仓新增违规 2 条属它批在飞档（见「仓级残项」）——本批对 `docs/**` 零写入。
- AC-17：VSC `npm test` → 361 tests / 360 pass / 0 fail / 1 skip（日志 `_t-deepseek-vsc.log`）；
  CLI `npm test` → 347 tests / 335 pass / 1 fail / 11 skip（日志 `_t-deepseek-cli.log`）——唯一 fail 属它批在飞档（见下）。

**轮次与终态**：

- 内部探索审计（只读子代理——交付分歧审计）：代码面**零分歧**（4 行 spec 双端逐字段 / 预设 / 8 文件范围 /
  测试落点与断言有效性逐条核验）；1 条流程项（本段即闭合）+ 3 条观察（T32 判别力 / T33 夹具 / §19.4 行数预测）。
- 内部 advisor 代码评审（轮 1）：**pass**（0🔴 · 0🟡 · 3🔵）。响应表：

| # | Action | Detail |
|---|---|---|
| 1 | Not an issue | T32 判据口径 = 设计 §20.1（`matched: true`）；三行字段同值属设计固有（R12 / R13 对齐要求）——行身份不可按值判别；误配由结构（长度降序 + 第 10 字符分叉）与 T34 / T38 pro 锚兜底 |
| 2 | Fixed | `thincoder-cli/test/config-merge.test.mjs:32-34` 增 3 行只读锚（thinking / effort / maxTokens）——闭合设计 §20.1 T35 预期输出「其余字段不变」；重跑 7 / 7 全绿 |
| 3 | Not an issue | `thincoder-cli/src/config.mjs` 行数为存量债：本批净增 0（1 行改值），设计 §19.4 已载明「逼近 500 硬限……不拆」——按 R3 记录不升级、不重开 |

- **终态：clean**（0🔴 / 0🟡 未决；2🔵 有处置记录；Fixed 项已复跑验证）。

**偏差登记（逐条）**：

1. `thincoder-cli/test/config-merge.test.mjs` 实测 +3 行（设计 §19.4 预计 ±0）——advisor 轮 1 第 2 条采纳项，
   闭合 T35 预期输出「其余字段不变」半句；重跑全绿。
2. 行数估算微差（均无阈值影响）：`model-specs.mjs` +8 对预计 +10~14（略低）；VSC `config.mjs` +7 对预计 +4~6（略高）；
   `image-downgrade.test.mjs` +31 对预计 +8~10（修正轮 T38 扩面后投影未回写——T38 为评审采纳项）。
3. T33 夹具用真 1×1 PNG（与 VSC `image-downgrade` 夹具同源）——审计观察采纳。
4. spec 行 / 预设字段层面：**零偏差**（双端逐字段 = 设计 §19.2 契约；`pro` 零字段改）。

**仓级残项（非本批面——父侧裁量）**：

1. CLI `npm test` 唯一 fail = `test/doc-consistency.test.mjs` T41①：新增 V1 违规 2 条，源为它批在飞批次档
   `docs/batches/2026-09-11-POOL-LEDGER.md` 的失效自指（引用节号在档内不存在）；本批对 `docs/**` 零写入，
   多轮复跑稳定复现——修它批档或按存量入基线，属父侧协调项。
2. slow 门载荷性波动：多轮全量复跑中部分轮次出现「未标 slow 超 800ms」拦截，offender 每轮不同
   （`eng-designer-role` / `setup-reminders` / `batch-segment`——均在它批测试文件，本批文件零命中）；
   同仓另有活动实例，环境负载所致的边界抖动（run-fast 注释已预警该带）。
3. 出范围观察（advisor 轮 1 出范围备注）：CLI `src/tools/read_image.md` 工具描述仍写
   「Pure text models (DeepSeek V4, GLM-5) will receive an error」——与本批放行矛盾；该文件不在 8 文件写域
   （设计 §19.7 裁「无新文案」），建议父侧登记后续小项。

## §6 验证与收口（父代理自写）

**收口 2026-09-11**（用户 03:10"批6验收"）——本批**已核销**，本档冻结。

### 交付与提交

| 提交 | 仓 | 内容 |
|---|---|---|
| `c22b3ea` | thincoder | 7 文件 / +742 −19：`src/model-specs.mjs`（新行 + 两退役行 + pro 注释）· `src/config.mjs`（预设改值）· `test/deepseek-v41-specs.test.mjs`（新 86 行）· `test/config-merge.test.mjs` · 设计档 §18–§20 · 本批次档 · `docs/TODO.md` |
| `3e771ee` | VSC 仓 | 5 文件 / +66 −7：`src/config.mjs` · `src/config-presets.mjs` · `test/config-merge.test.mjs` · `test/image-downgrade.test.mjs` · 设计档镜像同步 |

### 验证实跑（父侧——非采信自述）

- `node --test test/deepseek-v41-specs.test.mjs`（CLI）→ **5/5**（T30–T34/T38）；`test/config-merge.test.mjs` CLI **7/7**；VSC `config-merge` + `image-downgrade` → **18/18**。
- 全量：VSC `npm test` → **361 / 360 pass / 0 fail / 1 skipped**；CLI `npm test` → **347 / 335 pass / 1 fail / 11 skipped**——
  **唯一 fail = `T41① 仓库扫描`（V1/V2/V3）**，父侧核实归属 = **他批在飞档 `docs/batches/2026-09-11-POOL-LEDGER.md` 的 2 条新增 V1 违规**（本批对 `docs/**` 零写入）——**非本批面**。
- AC-13 / AC-14 双端 grep 逐条跑通（`vision-exp` 注释含退役/路由语义 · `2026-09-14` 非空）；锚回归 `read-image-guide.test.mjs` 2/2（**非视觉锚未被改**）。
- 字段面逐行实读（非 diff 摘要）：新行 10 字段 = §19.2(a) 契约（含 `multimodal`）· 两退役行对齐 · **pro 零字段改**（无 `multimodal` + 注释）· VSC 多 `reasoningEffortDefault: "high"`。

### 实施后对账（声明 vs 实测——**归 §6**，设计档快照不追改）

| 面 | 设计声明 | 实测 | 判定 |
|---|---|---|---|
| `src/model-specs.mjs` | 171 / +10~14 | **179（+8）** | 微差（无阈值影响） |
| `src/config.mjs`（CLI） | 486 / ±0 | 486（±0） | ✓ |
| `src/config.mjs`（VSC） | 183 / +4~6 | **190（+7）** | 微差（块注释改写） |
| `src/config-presets.mjs` | 40 / ±0 | 40（±0） | ✓ |
| `test/image-downgrade.test.mjs` | 126 / +8~10 | **157（+31）** | 扩面——修正轮 T38 采纳后投影未回写（T38 本身为评审采纳项） |
| `test/config-merge.test.mjs`（CLI） | 173 / ±0 | **176（+3）** | 内部 advisor 轮 1 #2 采纳（T35 只读锚）——**已披露** |

### 遗留清单（逐条 + 归属）

1. **`src/tools/read_image.md:8` 描述漂移**——仍写「Pure text models (DeepSeek V4, GLM-5) will receive an error」，与本批放行的 read_image 行为矛盾（且该描述是发给模型看的面）→ **已登记 `docs/TODO.md:142`**（设计 §19.7 裁「无新文案」，本批未改）。
2. **`deepseek-v4-pro` 复检 + 发布注记**（9/14 路由生效后 / V4.1 Pro 到货；CHANGELOG 一行）→ **已登记 `docs/TODO.md:141`**。
3. **CLI `npm test` 的红 = 他批面**（`POOL-LEDGER.md` V1 违规）——他链处置；本批零写入。
4. **日志产物**：`_t-deepseek-cli.log` / `_t-deepseek-vsc.log`（工作树内、未提交）——证据保留。
5. **设计档状态行**：`PROVIDER.md` §16 首注仍为第 3 批两态旧文（「范围追加…待批准」——实已实施并核销）——**继承第 3 批 §6 遗留 #5，本次复检仍在** → 随下次 PROVIDER.md 设计轮刷新（设计档写权在 designer，父侧不代笔）。

### 核销同步清单（D7）

- **状态行**：本档 §1 状态 ✅（原文保留 + 追加修正块）；设计档状态行 → 遗留 #5。
- **计数**：本批 **R11–R17 / N5–N7 / T30–T38 / AC-11..AC-17**（评审修正轮未新增编号）。
- **指针**：`TODO.md` 需求池条目 → **已核销**（同期处置）· 批次档 §2 = 任务书本体（含修正追加块）✅。
- **变更记录**：CLI 设计档 + VSC 镜像档 ✅ 各一行（含评审修正轮）。
- **待办勾销**：需求池 `DeepSeek V4.1-Flash 接入` → `- [x] ~~…~~`（同期处置）。
- **凭证**：全链零落档 ✅（评审通过只记 "pass"；designId / token 值零出现）。

### 状态

**已核销 2026-09-11**——六段齐备（§2 含修正追加块，同段内 append），append-only 完结。
