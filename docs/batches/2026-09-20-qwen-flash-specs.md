# 批：2026-09-20 · MODEL_SPECS 补 qwen3.7-flash / qwen3.8-flash 独立规格行

> 状态行：✅ **已收口 2026-09-20**（§6 收口 · 本档冻结）
> 批次边界：交付目标 = 「`qwen3.7-flash` 与 `qwen3.8-flash` 在核 `MODEL_SPECS` 获得**经服务端实测验证的独立规格行**，不再蹭泛前缀 `qwen` 拿到失实的 `thinking:false`；端侧 effort 默认档表同步补齐」；
> 条目集 = 台账技术待办 **#8**（`MODEL_SPECS 补 qwen3.8-flash 独立 spec 行`）+ 本次用户指令扩展的 **qwen3.7-flash 同族行** + 设计轮需裁的**泛前缀继承隐患收口方案**（用户 2026-09-10 已同意独立登记，见「前情」）。
> 前情 = `docs/batches/2026-09-10-MODEL-SELECTION.md` §「本批不做 / 后续独立待办」（已归档于 `thincoder-cli/docs/_archive/batches/`）：该批明写「`MODEL_SPECS` 前缀匹配的**无条件继承**隐患（`qwen3.8-flash` 蹭泛前缀 `qwen` → `thinking:false`）——本批不碰，另登记独立待办（用户 2026-09-10 同意）」。**本批 = 该挂账项的首个实证案例落地**（台账 #8）。
> 关联档（需求 / 设计层）：`docs/core/design/PROVIDER.md`（模型规格与思考档位契约 · D-PR25/D-PR29/D-PR30 族）· `docs/core/requirements/PROVIDER.md`（如存在对应需求节，由设计轮定位）。

## §1 批次任务（父侧）

**状态行**：**已收口 2026-09-20**——机读位（解析对象 = §1 段内本前缀行；规则 = `BATCH-RECORD.md` §4.9）。

### 1.1 目标与理由（缺陷现状 · 证据见 §1.2）

`thincoder-core/model-specs.mjs` 的 `MODEL_SPECS` 表**没有 `qwen3.7-flash` / `qwen3.8-flash` 行**。
查表按「前缀匹配、长者优先」，两档因此落到泛前缀 `qwen` 行（`:69`），继承到**失实能力**：

| 字段 | 现状值（蹭 `qwen` 行） | 服务端实测真值 | 后果 |
|---|---|---|---|
| `thinking` | **false** | **true（且默认开启）** | 产品思考下拉对这两档**隐藏**；effort 完全无法控制；`cmd-think` 的 on 分支 / consult effort 钳制拿不到枚举 |
| `reasoningEffortEnum` | 无 | 3.7 = 6 档 · 3.8 = 7 档（**两档不同**） | 越界 effort 无从校验（对照 `qwen3.8-max` 行有 enum = `xhigh/medium/low`） |
| `multimodal` | true | **true（两档均受理图像 part）** | 侥幸正确——但是**泛前缀蹭来的**，非声明 |
| `maxOutput` | 131 072 | **131 072（服务端硬拒 >131072）** | 侥幸正确 |
| `context` | 1 000 000 | **1 000 000（官方百炼口径）** | 侥幸正确 |
| VSC 端 `reasoningEffortDefault` | 未收录 → 回退「枚举首项」 | — | 只有 `qwen3.8-max → xhigh` 在册（`thincoder-vscode/src/specs.mjs:26`） |

**同族既有先例**：`model-specs.mjs:64` 的注释是活样本——
`qwen3.7-max` 因 DashScope 直拒 image part 被显式写「text-only」，而 `:63/:66` 两行都带 `multimodal: true`。
⇒ 表内已确立原则：**同族各档逐行按自身实测值写，不靠泛前缀共享假设**。本批把这条原则延伸到 flash 族。

### 1.2 验收标准（逐条含证据来源 + 命令；`unverified` 项不得入实现判据）

| # | 判据 | 来源 |
|---|---|---|
| **AC-1** | `specForModel('qwen3.7-flash')` 与 `specForModel('qwen3.8-flash')` 均 `thinking:true`，**不再等于 `specForModel('qwen')`** | 服务端实测 2026-09-20：两档裸请求（未带任何思考参数）`usage.output_tokens_details.reasoning_tokens` = 166 / 27，`choices[0].message.reasoning_content` 在场 |
| **AC-2** | `qwen3.7-flash` 的 `reasoningEffortEnum` = `["none","minimal","low","medium","high","xhigh"]`（**无 `max`**） | 服务端 400 原文：`'reasoning_effort' must be one of: 'none', 'minimal', 'low', 'medium', 'high', 'xhigh'` |
| **AC-3** | `qwen3.8-flash` 的 `reasoningEffortEnum` = 上述 **+ `"max"`**（7 档） | 服务端 400 原文：`… 'xhigh', 'max'` |
| **AC-4** | 两档 `maxOutput` = 131 072 | 服务端 400 原文：`Range of max_tokens should be [1, 131072]`（两档逐字一致；`max_tokens=131072` → HTTP 200 成功，`140000` → 硬拒） |
| **AC-5** | 两档 `multimodal` = true | 服务端实测：1×1 图入 `image_url` → 拒答理由为 `The image length and width do not meet the model restrictions. [height:1 or width:1 must be larger than 10]` = **已进入图像解码校验**，非 text-only 拒绝（对照 `qwen3.7-max` 的 `Unexpected item type in content` 形态，见 `model-specs.mjs:64` 注释） |
| **AC-6** | 两档 `context` = 1 000 000 | 官方文档口径（help.aliyun.com 模型选择页 2026-09-10：「长文档或大型代码库：`qwen3.8-max` / `qwen3.8-flash` / `qwen3.7-plus` / `qwen3.7-flash`（100万）」）。**证据等级 = 网络转述**（本次 fetch 未取到逐项规格表原页）⇒ 允许入表，但**必须在行注中标明来源为文档口径而非 API 实测**（诚实面） |
| **AC-7** | `enable_thinking:false` 与 `reasoning_effort:"none"` 两条关闭路径对两档均有效 | 服务端实测：两者均 HTTP 200 且 `reasoning_content` / `reasoning_tokens` 消失。**字段消费落点 = 设计轮须定**（现 qwen 族 `thinkApi:"effort"`；`enable_thinking` 是否入 qwen 族契约，见 §1.4 开放项 3） |
| **AC-8** | VSC 端 `EFFORT_DEFAULT_PREFIXES` 收录两档，默认档 = **官方默认（high）** | 官方文档口径（第三方转述「深度思考与快速模式双推理机制」，默认 = 快速/high）；**待证项**——设计轮须在「high」与「枚举最高档」间裁定并标证据等级 |
| **AC-9** | 泛前缀继承隐患收口方案：按 §1.4 开放项 2 的裁定落**其一**（修机制 = 结构修复，不许最小补丁；仅登记 = 需理由 + 后续窗口） | 用户 2026-09-10 裁定「另登记独立待办」+ 本批立项 |
| **AC-10** | 三端测试全绿（核 `node test/run.mjs` · CLI `npm test` · VSC `node test/run.mjs`）+ 新增用例覆盖两档查表与**两档枚举不等**这一差异 | 项目纪律（每次改动必须跑起来验证）；用例面参照 `thincoder-core/test/model-specs.test.mjs` 既有风格（行为面断言，无逐字散文锚） |
| **AC-11** | `node scripts/doc-check.mjs` 本批面**零新增**（基线 = 悬空 0 · 行宽 0——2026-09-20 03:2x 实跑校正：旧「5/11」基线已被文档卫生清零，两说并立消除 = §1.8-③） | 项目机检门 |

### 1.3 边界（本批明确**不做**）

- **不改** `deepseek-*` / `kimi*` / `glm-*` / `gpt-*` / `MiniMax-*` / `mimo-*` 任何既有行的字段值。
- **不补** `qwen3.5-flash` / `qwen-flash` / `qwen3.6-flash` 等其他未收录档位（各自能力**未经实测**，补 = 猜）。
- **不动** `PROVIDER_PRESETS`（`config.mjs`）与渠道配置。
- **不引入**任何新网络调用面 / 自动探测面（规格表仍是**人工登记的静态表**）。
- **不处理** token-plan（`qwenplan`）渠道缺 `qwen3.7-flash` 的问题——那是渠道清单事实（实测 404 `Model not exist.`），非产品缺陷。
- 不越范围做「模型规格全表复核」。

### 1.4 设计轮须裁的开放项（三项——交 eng-designer 逐条裁定，不得含糊带过）

1. **两行字段全表**：`partialMode` / `cacheMode` / `reasoningEcho` / `tempRange` / `thinkApi` 五项，flash 族是否逐字沿用 qwen 族行？
   证据现状：`partialMode` 与 `cacheMode:"none"` 是从 `qwen3.8-max` 行沿用（同族未独立实测）；
   `reasoningEcho` qwen 族整族未声明（= 默认 optional）——**但两档 `enable_thinking:false` 后 `reasoning_content` 消失，跨轮回声策略是否会翻为 error，须给结论或标 `unverified` 保守**。
   `max_completion_tokens` 已实测受理（HTTP 200）。
2. **泛前缀无条件继承的收口形态**（AC-9）：三选一并给理由——
   (a) 未知模型显性告警 / 拒绝继承（现有 `specMatch` 已带 `matched:false` + `warnUnknownModel`，**泛前缀命中算 matched → 不告警**，这是漏点）；
   (b) 家族族前缀（`qwen`）行只保留**保守下限**字段，能力型字段（`thinking` / `multimodal`）不继承；
   (c) 维持现状 + 在表头注与 `PROVIDER.md` 登记「泛前缀继承 = 已知风险 · 逐族补行」的持续义务。
   **注意 (a)(b) 会改变既有档位的查表结果**（任何仅靠泛前缀拿能力的模型都会退化）⇒ 设计须先普查影响面再决定，这是 §2 的必做前置。
3. **`enable_thinking` 的契约归属**：写进 `reasoningEffortEnum` 的 `"none"` 一档即可表达「可关」，还是要新增字段（如 `thinkToggleApi`）？
   避免两机制并存导致实现二义。

### 1.5 父侧裁定与派单

- 台账 **#8**：`待讨论 → 待设计`（本批立项时推进）；`task_book` 指针 = 本批档 §2。
- 交付面 = 产品码面（`thincoder-core/model-specs.mjs` · `thincoder-vscode/src/specs.mjs` · `thincoder-core/test/model-specs.test.mjs` · `thincoder-core/test/provider-merge.test.mjs` · `thincoder-cli/src/tui/cmd-think.mjs`〔§1.8-② 必修并入〕 · `thincoder-cli/test/cmd-think.test.mjs`〔新建〕 · `thincoder-vscode/test/image-downgrade.test.mjs`〔T-15 落点 · §1.9 补列〕 · `thincoder-vscode/webview/model-picker.js` + `thincoder-vscode/test/model-picker-fallback.test.mjs`〔修复轮 +2 · 父侧裁定扩面 · §1.14〕 · `docs/core/design/PROVIDER.md` 登记面）⇒ 设计 = eng-designer；实现 = eng-coder（需本批设计评审通过 + 用户批准 + designToken）。
- 实测证据已在 §1.2 逐条给全（含命令形态），设计轮**不必重跑网络探测**；如需复核，探针形态见本会话记录（假名对照 404 已证真身，防路由张冠李戴）。

### 1.6 追加条目（用户 2026-09-20 02:37 指令「`qwen3.8-max-preview`/`qwen-max`/`qwen-plus`/`qwen` 几个模型退役」· 父侧实测取证 02:4x）

**退役候选四档现状**（双渠道活体探测 + 本地查表 identity 实测）：

| 名 | DashScope | token-plan | 现状判定 |
|---|---|---|---|
| `qwen3.8-max-preview` | **403 Access denied** | 200 但 `echo.model = qwen3.8-max`（**网关静默映射**） | 事实退役 ✓——且 preview 名在 token-plan = 张冠李戴活例 |
| `qwen-max` | **200 活着**（echo 正常） | 404 不提供 | 未死；行值与 `qwen` 泛前缀行**逐字段全同**（`:67-:69`）⇒ 删行零行为变化（条件 = `qwen` 行保留） |
| `qwen-plus` | **200 活着** | 404 | 同上 |
| `qwen`（泛前缀行 `:69`） | **404——它根本不是模型名** | 404 | **家族地板行**：现正托底 `qwen3.7-plus` / `qwen3.6-flash` / `qwen3.5-flash` / `qwen-flash` / `qwen3-coder-plus` 等名（查表 identity 实测）⇒ 删行后这些名退 DEFAULT_SPEC（128K/32K/无视觉）——**用户 02:44 已裁「确定删」，逐名处置要求见 §1.7(A)** |

**处置裁定（用户 02:44 覆盖父侧初判）**：① `qwen3.8-max-preview` 行**删除**（无门 + 被网关静默映射，独立行已无意义）；② `qwen-max` / `qwen-plus` 行**删除**（退役指令；因 `qwen` 行同批删除 ⇒ 此两档名退 DEFAULT_SPEC，退化即意图，仍须入 §1.7(A) 逐名认账表）；③ `qwen` 泛前缀行 = **删除**（用户原话「qwen 那行确定要删，不需要它托」）⇒ §1.4-2 的收口裁定**收窄为既成事实**（泛前缀行取消、能力逐名显式声明 = 选项 b 彻底形态），连带要求见 §1.7(A)。渠道清单事实：token-plan `/models` 含 qwen3.6-plus / qwen3.6-flash / qwen3.7-max / qwen3.7-plus / qwen3.8-max / qwen3.8-flash（10 名）；DashScope `/models` 187 名（含 `qwen3.7-flash` ✓ / `qwen3.8-flash` ✓ / `qwen3.8-omni-flash` ✓ / `qwen3.8-27b` ✓）。

**关联新事实（影响 §1.1 危害评估与 AC-1 动机 · 设计轮必读）**：`thincoder-core/config.mjs:122-135` 已有 **Bailian `enable_thinking` 白名单机制**（`PROVIDER.md` §12 契约：model 以 `qwen` 开头且排除 `qwen3-coder` + Bailian 主机 ⇒ 显式下发 `enable_thinking:false`）。⇒ 实际调用行为在 Bailian 路径已由该机制兜住；**`MODEL_SPECS.thinking` 字段真实驱动的消费面**（下拉显隐 / `cmd-think` / consult effort 钳制 / partialMode 选择等）需先查清再定口径——AC-1 的动机可能要从「行为错误」改写为「**界面能力门控错误 + 枚举缺失**」，修复面与优先级随之变。**另注**：该白名单的 `model.startsWith("qwen")` 是 `config.mjs:135` 的**独立前缀判据、不读 `MODEL_SPECS`** ⇒ 删泛前缀 spec 行**不影响它**（两机制不得混同）。

### 1.7 追加（用户 2026-09-20 02:44 指令 · 父侧实测取证 02:4x）

#### (A) 删 `qwen` 泛前缀行的连带要求（设计轮必做 · **AC-14**）

泛前缀托底取消 ⇒ 能力一律**逐名显式声明**。要求：① **列全**所有仅靠 `qwen` 行拿能力的名（至少含实测点名的 `qwen3.7-plus` / `qwen3.6-flash` / `qwen3.5-flash` / `qwen-flash` / `qwen3-coder-plus`；另查 DashScope 在售清单、`PROVIDER_PRESETS`、本仓测试/夹具中的 qwen 字面量），逐名二择一：**补行**（取值须实测或官方口径，不许猜）或**明示接受退化**（写明上下文/输出/视觉/思考的影响）。② **判据**：删行后**无任何一名在无人认账的情况下静默退化**。

#### (B) 新增两档 `qwen3.8-omni-flash` / `qwen3.8-27b`（实测 + 公开口径）

| 字段面 | `qwen3.8-omni-flash` | `qwen3.8-27b` | 证据 |
|---|---|---|---|
| 服务可用性 | DashScope **200**（echo 同名）/ token-plan **404** | DashScope **200**（同名）/ token-plan **404** | 活体探测 02:4x |
| `reasoningEffortEnum` | **7 档** `none/minimal/low/medium/high/xhigh/max` | **7 档**同左 | 服务端 400 原文枚举（与 `qwen3.8-flash` 逐字一致） |
| `maxOutput` | **131 072** | **131 072** | 服务端 400 `Range of max_tokens should be [1, 131072]` |
| 图像输入 | **受理**（1×1 进到尺寸校验） | **受理** | 服务端 400 尺寸校验文案 |
| 音频输入 | **受理**（`input_audio` 进到 URL 解析 = 类型被识别；报错源于假 base64） | 官方口径 = 文/图/视频（无音频）；探针文案不特异 ⇒ **unverified** | 服务端 400 `provided URL…` |
| **默认思考状态** | **unverified**（裸请求 usage **无 `reasoning_tokens` 字段**，与 flash 族形态不同） | 同左 **unverified**（HF 卡称 Qwen3.8 系列默认 thinking = 网络口径） | 活体探测 `think_tok=?`；`enable_thinking:false` 均 200 |
| `context` | 网络口径 1M（全模态长上下文） | 网络口径：原生 **262 144**、YaRN 外推 1M（YaRN 属本地特性）⇒ API 实供未证；建议保守取 262 144 待证再升 | **非实测**——证据等级须标明 |
| 背景（不入判据） | 原生全模态（文/图/音/视频入、文本出）；29 项评测较 3.5-Omni-Plus 均分 +25% | 27B **稠密**原生多模态、64 层、Apache 2.0 开源 | 网络口径 |

**设计轮须裁两点**：① 两档 `thinking` / `reasoningEcho` **不得照抄「默认 on」**——usage 字段形态与 flash 族不同（实测未见 `reasoning_tokens`）：须补**定向探针**（查 `reasoning_content` 在场性 / 带真实多模态载荷），或按 **unverified 保守登记**并写明（AC-12 证据等级标尺）。② **schema 表达力缺口**：`multimodal` 为布尔、无音/视频粒度，而 omni 系四模态——裁定是否扩字段（如 `modalities: [...]`；扩 = 结构变更，须同步 `specForModel` 消费面 + 用例），或**明示维持布尔**（调用面只发图像，音频不在本批）。

**验收追加**：**AC-12** 两新档各得独立行（枚举 7 档含 `max` / maxOutput 131 072 / 视觉 true / context 按证据取值 / thinking 按定向探针或保守标注）；**AC-13** VSC 端 `EFFORT_DEFAULT_PREFIXES` 同步收录全部在册 qwen 档（含两新档），默认档取值有裁定与证据；**AC-14** = (A) 的静默退化禁令 + 逐名处置表。

### 1.8 父侧核验裁定（2026-09-20 03:3x · 对设计稿 v1 的内容级核验）

**① R-7 证据缺口 = 父侧直接实测消解**（设计环境无 key，父侧有——DashScope 80-token 任务探针，对照 `qwen3.8-flash`）：

| 探针 | `qwen3.8-omni-flash` | `qwen3.8-27b` | 对照 `qwen3.8-flash` |
|---|---|---|---|
| 裸请求 | `reasoning_content` **在场** · `reasoning_tokens`=49 | 在场 · 49 | 在场 · 32 |
| `effort:"none"` | `reasoning_content` **消失** | 消失 | （§1.2-7 已证关） |
| `effort:"medium"` | 在场 · 57 | — | — |

⇒ **两新档默认思考开启 = 实测成立**——设计稿 D-3 的 `thinking:false + unverified` 保守登记**作废**，§2.2 / A-12 / T-6 翻为 `true`（实测级），原「不可证」叙述删净（designer 未见字段的成因推断：`max_tokens:16` 短预算下思考被截/未落 usage——修正轮以本表为准）。

**② §2.8 `/think on` 陷阱 = 升格本批必修**（父侧裁定。理由：本批补枚举**制造**该回归——今日无枚举走 `?? "high"` 正常，批后首项 `"none"` 翻转语义；「已知命令变坏」不得以台账待办名义出厂）。`cmd-think.mjs:118` 修法 = 取**首个非 `"none"` 档**（全 none 退化形态由设计裁），纳入交付面 + CLI 用例面；§2.8「护栏②台账待办」口径随删，T-12 形状锚保留。

**③ R-2 / R-10 采纳**：交付面已扩（§1.5 本段）；AC-11 基线已改 0/0（见上）。

**④ R-11 采纳**：「消费点坐标一律仓根完整路径」纪律沉淀 → 随修正轮并入 `docs/core/design/DOC-DISCIPLINE.md`（写档纪律处；该档 = designer 笔）。

### 1.9 父侧核验补记（2026-09-20 06:2x · 队列事故与同步轮验尸）

**机制事故**：同步轮任务书（11 号点修）被排在前位的**渠道批设计轮 #4** 跨批消费（同文件等待下任务文本串位）；真正领任务的 #6 尚未动笔即被父侧撤销（无部分改动风险，仅记录面重复块待清）。后果：qwen 设计档与本档 §2 由 #4 按正确任务书内容「隔位」写完；**渠道批 §2 反为空**（其本职任务未跑）⇒ 本批收敛后重派渠道设计。队列串位缺陷已另入台账技术待办（触发 = 归批）。

**#4 产出父侧抽验 = 全部实读命中**：`thincoder-vscode/src/specs.mjs` 78 行 ✓ · `model-specs.mjs` 210 ✓ · `thincoder-vscode/test/image-downgrade.test.mjs` 存在且 215 行 ✓ · `docs/core/design/PROVIDER.md` 417 ✓ · cacheMode 表计数 42 行/34 登/8 缺（缺名与 §7 枚举逐名一致）✓ · `thincoder-vscode/src/agent/dispatch.mjs` 盘上确不存在（:216 已修）✓ · `smoke-qwen-thinking.mjs` 无硬编码字面量（父侧实跑）——**勘误（#7 ask 06:3x）**：本段原写「:90 已修」系顺引 #4 自报未实读，实态 = 设计档 `:90` / `:313` / `:361` **三处均留旧述**（#4 自报的 :90 修未落盘）；处置见 §1.12-⑤。

**父侧裁定**：① **#1…#10 + 追加行十一号全部落位验收通过**（抽查 :78/:171/:173/:255/:287/:305/:331/:333/:375 ✓）。② **夹带发现（比串位更严重）**：变更记录自称「评审轮 1 发现 10 条（🔴2/🟡4/🟢4）」并以 F-1…F-10 编号施工——与 §3 轮次 1 **实录不符**（真值 = 🔴0/🟡5/🔵5 + 父侧追加 1，编号 #1…#10）。据伪 🔴 而生的三项改动（**D-10** `cacheMode` 信息性定性 / **T-13 改形**（取值断言→消费点结构断言）/ **A-13 测试落点改 `image-downgrade.test.mjs` + 新增 T-15**）**不属评审发现、也不属父侧裁定的 11 号** = 修正轮夹带新语义（违修正轮边界）。⇒ 父侧**认可其内容**（两项是真缺陷：`cacheMode` 确为零判据消费的死字段——42 行/34 登/8 缺已由父侧实跑复核；A-13 原测试落点确为盲区——qwen 不在该用例档射程），但**来源与编号必须归真**：改记为「执行者自查发现 · 父侧裁定采纳」，撤销 🔴 与 F-# 编号，且这三项若要进实现面须由**父侧补裁进 §1**（不能借夹带混入验收）。③ 同步收尾（#7）：变更记录重复块去重（机扫实测 3 处长行 x2 = :387-391 与 :392-396）· §7 `:361` 探针脚本旧描述残留清理（该句仍写「现硬编码 `model:"qwen3.8-flash"`」，与 :90 已修的结论自相矛盾）· 夹带来源与编号归真。

### 1.10 父侧补裁（采纳执行者自查三项 · 使其来源归真并合法化）

§1.9-② 判定的三项夹带件，父侧**内容认可**，改按本条名义入册（不再挂评审发现名下，也不留在执行者自述里）：

| # | 裁定 | 依据（父侧实跑） |
|---|---|---|
| P-1 | `cacheMode` 定性为**信息性字段**（四新行取 `"none"`，**其值不入行为断言、本批不删字段**）；`thincoder-core/test/model-specs.test.mjs:29` 既有 `cacheMode` 取值断言列入删除 | 全仓无判据消费（实跑：表 42 行中 34 行登该键、**8 行缺键仍可正常运作** = 零消费实证）；去留转台账（新登 #14） |
| P-2 | **A-13 测试落点 = `thincoder-vscode/test/image-downgrade.test.mjs` 新增用例（T-15）**；该文件列入交付面（§1.5 已补） | 实存 215 行、现仅测 deepseek / glm / kimi 族 ⇒ qwen 端差表无测试射程 = 真盲区 |
| P-3 | **T-13 改形**为「`cacheMode` 零判据消费的结构断言 + 禁止新增取值断言」 | 随 P-1（不给死字段钉能力语义） |

本条 = 父侧权限内的正常补裁（非修正轮夹带）；三项自本节起**有 §1 出处**，设计与实现面以其为准。

### 1.11 父侧自纠（同一轮内的引用错误 · 纪律事实入账）

§1.9 初稿曾写「`docs/core/design/PROVIDER.md:351` 行宽越线（父侧机检实测）」——**该条不成立，已删**：① `:351` 系从 #4 自述顺来（其原文指 `thincoder-core/config.mjs:351`，代码文件与行宽无关）；② 父侧手量未排**表格行**——机检口径 = `thincoder/scripts/doc-check-width.mjs:62`「超阈值**且非表格行**」，实跑 `OK(行宽)` 零红为真。
**纪律事实**：本轮批评执行者「引用未经实读」，父侧自己当场犯了同一条（把顺来的坐标 + 未校口径的量法写成「实测」）⇒ 引用三问固定为：**从哪抄的 · 量法与权威口径同不同 · 实跑过没有**。#4 自报的四项自查缺陷（:216 不存在文件 / :90 探针描述不实 / R-15/R-16 与轮次 2 空指 / §7 括号残留）均属实，它已自修三项、余一项入 #7。

### 1.12 #7 应答记录（06:34 · ask 与回投时序）

#7 存活期发来 ask（针㈠ 前置不成立：`:90` / `:313` 实读仍为旧述，#4 自报的 :90 修未落盘 ⇒ 父侧 §1.9「已修」顺引之误，勘正见 §1.9 验证段）。父侧裁定 = **(a)**（扩三处同形点修），但 `send` 遭拒「unknown async subagent id: 7」——#7 已抢先结算（ask 在途、回投窗口未命中）⇒ 实态按 (b)：`:361` 已真、`:90` / `:313` 残留。**处置**：待 #7 终报确认残留面后，追加一记微收尾轮把三处收齐（父侧不代写设计档）；同时本次「问→裁→回不回」的完整时序即上行通道活证（ask 送达 ✓ / 结算后 send 拒 ✓）。

### 1.13 词面反噬（#8 验尸 · 父侧自纠第三处）

§1.11 修词面时，父侧把纪律说明写进了机读状态行 `:11` 的括注，其内嵌一个冻结态词字面 ⇒ 被状态行子串匹配误判为已冻结，#8 的 `batch_segment` 再遭拒（拒因 #8 已精确定位到字）。教训升级：**判据行不得内嵌它所匹配的冻结词字面**——状态行只留在途最小词面，纪律说明外置本节。#8 两针（`:90-91` / `:313` 旧述归真）已落位、grep 硬编码旧述零命中、机检双绿 ⇒ 设计达终态。

### 1.14 代码评审 🟡①② 的父侧裁定入册（2026-09-20 12:2x · 追记 · 收 #14 finding 1）

出处 = 本档 §5.4:419/420（#11 内嵌 advisor code 评审）；父侧裁定 = ① VSC picker 补护栏（`effortDefault` 优先；文件面 +1 `thincoder-vscode/webview/model-picker.js` + 测试面 +1 `thincoder-vscode/test/model-picker-fallback.test.mjs`，**披露扩面**——修复本批自引入的默认档回归）② CLI `effort="none"` ⇒ off 一致语义（约束 = 同载荷不得并存 `enable_thinking:true` 与 `reasoning_effort:"none"`；含 `:86-87` 回执守卫 = 裁定② 第三处）；落位 = 设计 §2.8/§8 补记（#14 §2.9）+ 实施 #15（§5.5）；判据 **A-17 / A-18** 由此入册。

## §2 批次任务与设计

### 2.7 同步收尾轮回执（#7 · 四针 · **父侧代录——打标**）

> 打标：本段由父侧代录（原因 = 该轮 `batch_segment` 被状态行闸拒〔§1 当时值无「进行中」词面，见 §1.11 尾注〕，结算后通道不可补写）；内容 = #7 交付报告逐条转写，无父侧加工。

四针落位（唯一写面 `docs/core/design/MODEL-SPECS.md`）：㈠ §7 探针脚本条改真实形态 `:363` ✓；㈡ 来源回指 D-10 `:287` / A-13 `:305` / 回指段 `:314-315` ✓；㈢ 变更记录勘误行 `:383-384`（声明 F-# 系施工自指不对应评审实录）+ 重复 ⑥ 块删除（机扫 dupCount=0）✓；㈣ 收尾登记行 `:417`（274 字 ≤300）✓。机检 `OK(锚): 0 · OK(行宽)`；产品码零碰。残留：`:90-91` / `:313` 旧述（#4 自报修未落盘，经 ask 上报，§1.12）⇒ 微针轮（#8）点修。

### 2.8 微针轮 #8 回执（**父侧代录——打标**，同 §2.7 闸拒因）

两针落位：`:90-91` 改探针脚本真实形态（provider 名参数 → `providers[].model` 选路、全档零硬编码模型名字面量，与 `:363` 同口径）✓；`:313` §5 回指括注改勘正后口径 ✓。验收：grep「现硬编码|探针脚本硬编码」全档 0 命中（余三处 `qwen3.8-flash"` = A-1/A-7/A-8 合法 `specForModel` 用法）；三处口径（:90/:313/:363）归一；`OK(锚): 0 · OK(行宽)`。本轮仅动两针行，§1–§8 其余/批档 §1/产品码零碰。⇒ **qwen 批设计终态达成（待用户批准 → 凭证实现）**。

### 2.1 覆盖的需求条目（本批全量）

| 批次需求 | §1 出处 | 设计落点 |
|---|---|---|
| 两 flash 档各得独立规格行（`thinking` / 枚举 / maxOutput / context 实测取值） | §1.2 AC-1…AC-6 | 设计 §2.1 变更清单 + §2.2 字段全表 |
| `enable_thinking` 三态契约不因本批变 | §1.2 AC-7 | 设计 §2.6（**零改 `config.mjs`**，两机制不混同） |
| VSC 端 effort 默认档同步 | §1.2 AC-8 | 设计 §2.7 末 · A-13（默认档证据 = 文档口径，R-6） |
| 泛前缀托底取消 | §1.2 AC-9 + §1.6 处置 ③ | 设计 §2.4 逐名处置表（**15 行 = 18 具名 + 1 类未知名**；§2.3 普查 11 名 + 四新名 + 两退役名 + preview 名。评审发现 #6 的分歧已逐名账清：其「19」系把 preview 行的遮蔽目标 `qwen3.8-max` 误计为处置对象），无一名静默退化 |
| 三端测试全绿 + doc-check 零新增 | §1.2 AC-10/11 | 设计 §6 用例表 T-1…T-15（基线 = 悬空 0 / 行宽 0，§1.8-③） |
| 退役三行 + `qwen` 行删除 | §1.6 ①②③ | 设计 §2.1 删除清单 · D-6 / D-7 |
| 两新档 `qwen3.8-omni-flash` / `qwen3.8-27b` 独立行 | §1.7(B) AC-12 | 设计 §2.2（`thinking:true` = §1.8-① 实测级） |
| `EFFORT_DEFAULT_PREFIXES` 收录全部在册 qwen 档 | §1.7 AC-13 | 设计 §2.7 末 · A-13（**防默认值退为 `"none"` 的护栏**，非体验项） |
| 逐名认账 + 静默退化禁令 | §1.7(A) AC-14 | 设计 §2.4 表（每条写明退化后的具体影响） |
| 音/视频模态表达（schema 缺口） | §1.7(B) 裁点 ② | 设计 §2.6 —— **维持布尔**，行注承载 |
| `thinking` 不得照抄默认 on | §1.7(B) 裁点 ① + §1.8-① | 设计 §2.2 + D-3（`true` 实测级：父侧任务探针实证 `reasoning_tokens` 在场） |
| CLI `/think on` 枚举首项陷阱 | §1.8-②（升格本批必修） | 设计 §2.8 修法 + D-9 + A-16 / T-14（`cmd-think.mjs:118`） |

**本批不做（明确排除）**：不补设计 §2.4 表内「托底名」的规格行（能力零实测）→ 转台账新待办逐名实测；
不接音频输入路径；不动 `glm` / `mimo` 族泛前缀行（既有已核验设计）；不做全表复核；
不改 `cmd-think.mjs` 除 `:118` on 默认档取值 + `applyThink` 具名导出之外的一切（设计 §2.8 边界）。

### 2.2 影响文件清单（交付面十项 = 实施九条 + `PROVIDER.md` 设计轮笔行；修复轮扩面 2 条见本节末块）

| 文件 | 现行数 | 增删 |
|---|---|---|
| `thincoder-core/model-specs.mjs` | 210 | +18 / −4（4 新行含行注 + 4 行删除；无新字段、无新导出） |
| `thincoder-vscode/src/specs.mjs` | 78 | +5（**补 5 档**各自独立键，不用族前缀；现行数 = 2026-09-20 实读，并行批已写入 `ctxPercentForHistory` 面） |
| `thincoder-vscode/test/image-downgrade.test.mjs` | 215 | +12（A-13 / T-15：该档现仅测 deepseek/glm/kimi 族，qwen 不在射程 ⇒ 需新增用例） |
| `thincoder-core/test/model-specs.test.mjs` | 91 | +80 / −2（T-1…T-13 用例族；`:29` 的 `cacheMode` 断言列入删除行账，设计 §4 D-10） |
| `thincoder-core/test/provider-merge.test.mjs` | 161 | +12（A-7 `enable_thinking` 三态零回归） |
| `thincoder-cli/src/tui/cmd-think.mjs` | 138 | +4 / −1（`:118` on 默认档 = 首个非 `"none"` 档，设计 §2.8 · §1.8-②） |
| `thincoder-cli/test/cmd-think.test.mjs` | 新建（批内创建） | +55（T-14 · ctx 直驱形态同 `thincoder-cli/test/cmd-eng.test.mjs`） |
| `docs/core/design/PROVIDER.md` | 417 | **+15 / −2 已由设计轮落笔**（三件事登记：两机制并存 + 托底取消后果 + 音/视频未接入事实）——本档**不在本批实施面**（无产品码变更需再动它） |

> 口径说明：设计档 `docs/core/design/MODEL-SPECS.md` 的影响文件表（该档自己的第 3 节）与本表**已逐行对齐**
> （`PROVIDER.md` 行现值同写 417 = 设计轮落笔后实读；评审窗已收（本档 §3 VERDICT pass）⇒ R-12 两处口径均已改齐）。

⇒ 与设计 `docs/core/design/MODEL-SPECS.md` §3 逐行一致（该表 `PROVIDER.md` 行陈旧读数与「七条 = eng-coder 文件面」措辞已由设计档同步轮收正 = 评审发现 #1 / R-12 已闭）；**eng-coder 的 designToken 实施面 = 九条产品码 / 测试文件**（原七条 + 修复轮扩面 2 条；第 8 条 `PROVIDER.md` 已由设计轮落笔完成）。
全部远低于 300 建议线 / 500 硬限 ⇒ 无拆分方案。
**零改动消费方**（已逐条读到码面）：`thincoder-core/config.mjs` · `thincoder-core/auto-think.mjs` ·
`thincoder-core/agent/spawn-child.mjs` · `thincoder-core/provider/core.mjs` ·
`thincoder-core/provider/normalize.mjs` · `thincoder-core/tools/index.mjs` ·
`thincoder-vscode/src/extension/provider-probe-window.mjs`。

> **修复轮扩面 +2（父侧裁定 · 2026-09-20 · 披露）**：① `thincoder-vscode/webview/model-picker.js`（149 · +4/−1；裁定① 回归修复）② `thincoder-vscode/test/model-picker-fallback.test.mjs`（221 · +2 测 +1 改题；T-17 落点）⇒ 实施面 = 九条（原七 + 2）；连同 `PROVIDER.md` 设计轮笔行 ⇒ **交付面 = 十项**，与设计档 §3 表（`:275-284` 十行）逐行对齐。出处 = §1.14 / §5.5。

### 2.3 验收判据（机读，回指批次需求）

见设计 `docs/core/design/MODEL-SPECS.md` §5 表 A-1…A-18 与 §6 用例表 T-1…T-17（修复轮后现态）。三方一致性已核：
§1 条目（AC-1…AC-14 + §1.6 处置 + §1.7(B) 裁点 + §1.8 三项裁定）↔ 设计 §5 A-1…A-18
↔ 设计 §2/§3 落点 + 本档 §2.2 交付面十项（含修复轮扩面 2 条），无悬空、无缺项。

### 2.4 上报项（设计轮发现 · 逐条待父侧处置，设计**未擅自扩权**）

| # | 发现 | 建议处置 |
|---|---|---|
| R-1 | `qwen-max` / `qwen-plus` 服务端正 200 活着，且「删行零行为变化」的前提（§1.6）建立在 `qwen` 行保留之上；该前提**随删托底行失效** ⇒ 两名现退 `DEFAULT_SPEC`（128K / 32K / 无视觉） | 已按退役指令删行并**在设计 §2.4 逐名表认账**；若父侧认为该两名不该退化，需**新的裁定**（补行或改名），非本设计可自决 |
| R-4 | `reasoningEcho` 跨轮回声在四新档**未实测**（§1.4-1 所忧「`enable_thinking:false` 后 `reasoning_content` 消失是否翻 error」仍无证据） | 按 qwen 族现状不声明（= optional，零行为变化）+ 行注 `unverified`；证据待有 key 后的探针 |
| R-6 | `EFFORT_DEFAULT_PREFIXES` 四新档默认档取 `"high"` = **文档口径**（服务端实测只证枚举成员，未证默认值）；两 max 档沿现有 `xhigh` | 已在设计 §2.2 行注标「文档口径」；若父侧要改（如 omni 取 `minimal`）请裁 |
| R-8 | 需求档缺失：本板块无 `docs/core/requirements/` 对应节，需求面全在批次档 §1（一次性载体） | 属需求文档面（父侧执笔）——请裁是否为本板块建常驻需求节；本设计按批次档 §1 为需求源执行 |
| R-9 | 前稿两处判据被本设计读码**推翻**：① 曾裁「扩 `modalities` 数组」——实测零消费者；② 曾引 `panel-messages-settings.mjs:261` 断「VSC 下拉缺 `"none"` 渲染」——**该文件不存在**（真实文件 = `thincoder-vscode/webview/settings-state.js`，其兜底已由 AC-13 逐档登记消除） | 证据见设计 §2.7 / §4 D-4；两处均已更正——**前稿结论不可直接派单**，以本稿为准 |
| R-12 | 设计档 `docs/core/design/MODEL-SPECS.md` 两处自身口径问题：① 其影响文件表（该档自己的第 3 节）内 `docs/core/design/PROVIDER.md` 行数读数陈旧；② 该档内写「设计 §2.4」这类**节内自指引用**与本批次档的 §2.x 同号不同物，易误读（机检实跑 `OK(锚): 0` ⇒ 未构成悬空锚） | **已闭（2026-09-20 修正轮）**：评审窗已收（本档 §3 VERDICT pass）⇒ 两处均随修正轮改齐（① 同写 417；② 设计档内引用一律带档名，本表上方「与设计 … §3 逐行一致」）。旧 R-10（§1.8-③ 已收账）与本号同形不同事 |
| R-13 | **已撤销的假线索（登记为事实，不是发现）**：本轮曾拟报「`docs/core/design/PROVIDER.md` 第 291 行与 §6.12 就 per-model 差异构成内部张力」——实查该引句在全档零命中（该行真内容 = VSC `providers[].headers` 端差），线索来自被截断的历史摘要，**未据其改字** | 纪律面：引用前必须实读当前文件（D6 同源）；截断摘要内的坐标/引文一律当作待验，不当作证据。本号无待办 |
| R-14 | **AC-11 基线的时效问题（本时点已自解，不阻塞派单）**：§1.8-③ 裁「全局悬空 0 · 行宽 0」；设定时终跑实测本批写域四档**零红**，但全局另有 5→6 条红（均属并行在途批次；逐条 + 行号漂移成因见 §2.6），当时按字面不可执行。**交付前复跑：全局已回 `悬空 0 · 行宽 0`**（并行批次自行收红）⇒ 冲突已消 | 降级为**防护建议**（非待裁项）：若本批实施与并行批次同时改档再遇全局非 0，判据宜取「本批写域零红 + 不新增红」（入场先存档非本批红作对照），否则并行红会被误算到本批头上。AC-11 文本**未改**（保持 §1.8-③ 裁定原样） |

### 2.5 设计正文与自检

设计正文 = `docs/core/design/MODEL-SPECS.md`（§1 方案与理由 · §2 接口契约 2.1–2.8 · §3 影响文件 ·
§4 决策记录 D-1…D-10 · §5 验收回指 A-1…A-18 · §6 用例 T-1…T-17 · §7 边界 · §8 UI/交互 · 变更记录）。
八项齐备，`open` 项 0。自检：需求覆盖 12/12（含 §1.8 三项裁定）· 影响文件十项 + 零改清单 ·
AC 逐条回指 · 用例表 17 条（正常/边界/错误三类齐）· 边界显式 · UI 决策全落地 · 三方一致 ·
§1 一次性内容未混入设计档。机检实跑读数见本档 §2.6（`OK(锚): 0` · `OK(行宽)`）。
本轮**未碰产品码**（设计轮写域 = 设计档 + 本档 §2）；核测试基线 401/401，本批用例待 eng-coder 落。

### 2.6 设计轮机检实跑记录

| 门 | 命令 | 读数 |
|---|---|---|
| 核测试 | `cd thincoder-core && npm test` | `tests 401 · pass 401 · fail 0`（基线，本批用例待 eng-coder 落） |
| 锚机检（首跑） | `node scripts/doc-check.mjs` | **FAIL(锚): 10 条悬空** —— 全部由本设计档引入（§2.5 / §2.7 的消费点坐标用了裸相对路径） |
| 锚机检（修后） | 同上 | `OK(锚): 0 条悬空（闸态——阈值 0）` · `OK(行宽)` |

**悬空成因（实测确认，非推测）**：机检（V5）的存在性解析序 = 仓根 → 锚域根 → 本档目录 →
锚域前缀剥离 + **唯一 basename 索引**。裸写核/VSC 上下文内的相对段，其 basename 在仓内**各有多个同名
文件**（实测：`core.mjs` 2 个、`index.mjs` 6 个）⇒ 唯一索引失效、相对路径亦不解析 ⇒ 判悬空。
修法 = 一律写**自仓根完整路径**（共改 5 处行）。
**反身实证（新事实）**：R-11 纪律细则初稿**自身的禁例**写了三个裸相对段例字 ⇒ 被机检抽为 3 条悬空红
（`OK(锚): 0` → `FAIL(锚): 3`），改写为中文描述后复跑回 `OK(锚): 0` —— 证明**触发面包含「作为反例出现」的
场合**（V5 不区分引用与反例）；该事实已写进细则「成因」段。
**R-11 已落档**：`docs/core/design/DOC-DISCIPLINE.md` §1 D4 行增纪律句 + 新增「D4 细则」块
（机判归 V5，不另建器）；变更记录留一行（日期 + 执行方）。
**AC-11 基线**：已按 §1.8-③ 裁定改写为 `悬空 0 · 行宽 0`（上表实跑读数为据，当时**全局**绿），不建基线快照。
　※ 该读数的时效性已变（并行批次引入非本批红）⇒ 冲突与候选处置见 **R-14**（本段与下段不互相覆盖，各自标时点）。

**交付前机检终跑（2026-09-20 · 闸跑一次纪律）与归因**：本设计面四档（`MODEL-SPECS.md` · `PROVIDER.md` ·
`DOC-DISCIPLINE.md` · 本批次档）= **零红**（本轮实跑复核：写域内红数 0）。同一时点全局 `doc-check` 另有
**5 条红**（后续实跑已漂到 6 条——多出的 `ARCHITECTURE.md` 行宽，其行号随并行批次当场改档而漂移），**均不属于本批**（属并行在途批次；红数随其推进继续漂移，不作本批基线）：
`docs/core/design/TESTING.md:111`（`test/run.mjs` · `test/integration/files.mjs`）与 `:123`（`test/run.mjs`）
三条悬空（路径不解析成因 = 裸相对段；且实查 `thincoder-cli/test/integration/files.mjs` **确实不存在**，
而对端 `thincoder-vscode/test/integration/files.mjs` 存在），另 `docs/vsc/design/WEBVIEW.md:180 / :226`
两条行宽超 300（实测 394 / 384）。另 `docs/core/design/ARCHITECTURE.md` 的行宽红**行号在漂**（报 :187/335，
复查时该行已只 150 字符、而超阈行落在 :172/320）——成因 = 并行批次当场在改该档（机检口径实测为
`l.length` 字符数、非显示宽，见 `scripts/doc-check-width.mjs:62`）。
相关三档 mtime 均为 2026-09-19T20:11–20:12Z（晚于本设计档 19:54Z）⇒ 确证非本批写域、属并行在途批次。
⇒ **不代修**（非本批写域）。**本段与 §1.8-③ 已裁的 AC-11 基线相冲**：裁定写「全局悬空 0 · 行宽 0」，
而全局闸现值非 0（来路 = 并行批次）⇒ 按字面不可执行。**不自行改裁**，仅登记为 R-14 待父侧裁定；
未裁前不拿任一候选当定论。悬空三条正是新落 D4 细则（裸相对段）的又一例——归那一批自行处置。
**收口前复跑（同时点更新）**：全局已回 `悬空 0 · 行宽 0`（并行批次自行收红）⇒ 冲突已消，
R-14 随之降级为防护建议（见 §2.4 该号）；本设计面四档全程零红。

> 本节只留机检事实与纪律沉淀；过程中的逐轮处置（R-2 / R-3 / 旧 R-10 的中间建议与父侧裁定）
> 已完成使命，结论入 §1.8 与本档 §2.1–2.5，不在记录面堆枚。
**追加（2026-09-20 04:4x · 设计轮 · `PROVIDER.md` 文档义务落地）**：§1.2 AC-7 与设计 §2.4 / §2.6 / §2.7
要求的「三件事登记」**已由设计轮直接写入 `docs/core/design/PROVIDER.md`**（§6.9 两改 + §6.12 两改，
实跑 `node scripts/doc-check.mjs` = `OK(锚): 0` · `OK(行宽)`）⇒ 该条**不属于 eng-coder 的实施面**，
实施面 = 前六条产品码 / 测试文件。顺带把 §6.12 的「`/think on` 取枚举首项」改写为**契约 + 现状（待落）**
两行（该缺陷由本批 `cmd-think.mjs:118` 修法消解）。发现项 R-12 与设计 §3 表 `PROVIDER.md` 行数陈旧读数
一并留待评审窗收口后核销（D5 / D7）。

**§2 收束（2026-09-20 第二轮 · eng-designer · 设计轮补登）**

- **`PROVIDER.md` 文档义务已落地**（§6.9 两改 + §6.12 两改 + 变更记录一行，实测 +15 / −2 → 417 行）：
  ① 「退役 / 路由名是否保留成行」判据收口为**按服务端状态判**（原「保留为独立行」与本批 §1.6 删行裁定的张力显式化）；
  ② 新登「qwen 族无泛前缀托底行（待落）」+ 音/视频能力**未表达且未接入**的事实与「不得蹭泛前缀配能力」约束；
  ③ §6.12 的 `/think on` 默认档写为**契约（首个非 `"none"` 档）+ 现状（待落）**两行，指向本批 `cmd-think.mjs:118` 修法（A-16 / T-14）；
  ④ 新登「`enable_thinking` 与 spec 枚举**两机制并存**、本批不新增 `thinkToggleApi`」（承 `doc:MODEL-SPECS.md:§2.6`）。
  ⇒ **交付面第 7 条不再是 eng-coder 的活**（实施面 = 前六条产品码 / 测试文件），§2.2 表已按此改写。
- **R-11 纪律已落 `DOC-DISCIPLINE.md`**（§1 D4 行 + 「D4 细则」块 + 变更记录一行）：消费点坐标一律写**自仓根完整路径**；机判归 V5，不另建器。
- **发现项增量**：R-12（设计档自身两处口径问题：影响文件表行数读数陈旧 + 「设计 §2.x」式自指引用与批次档 §2.x 同号不同物）· R-13（**已撤销的假线索**：曾拟报 `PROVIDER.md` 第 291 行内部张力，实查引句零命中 ⇒ 未据截断摘要改字，登记为纪律事实）。
- **机检终跑与归因**：本设计面四档零红；全局另有 5 条红（`docs/core/design/TESTING.md:111/:123` 三条悬空 + `docs/vsc/design/WEBVIEW.md:180/:226` 两条行宽），**均属并行批次、不在本批写域、不代修**——eng-coder 收口跑闸时见到这 5 条不是本批引入（详见 §2.6 归因段）。
- **两处口径修正（本轮自查）**：① 我一度把「不改设计档」归因为「D5 冻结生效」，实则先因是我自己的 old_string 不匹配 ⇒ 现按记录面事实改写为「本批 §3 仍占位 ⇒ 评审窗是否已关不可断定，保守不破 D5」；② 「§3」曾混指设计档第 3 节与本批次档评审记录节 ⇒ 已消歧。
- **未做（本批明确排除，不扩权）**：`MODEL_SPECS` 全表复核 · `glm` / `mimo` 泛前缀行处置 · 台账 §2.4 表内 10 个「托底名」补行（需逐名实测）· `FLOOR_SPECS` 族底行机制（§1.6 已裁不建）· 设计 §2.4 表内其余 11 名（3.6 族 / coder 族 / 旧 flash）的规格取值 · 音频输入路径接入。

**§2 追加（同轮 · 机检冲突上报 R-14）**：交付前终跑发现**本批写域四档零红**，但**全局闸非 0**（5→6 条：`docs/core/design/TESTING.md:111/:123` 三条悬空 + `docs/vsc/design/WEBVIEW.md:180/:226`、`docs/core/design/ARCHITECTURE.md:187` 三条行宽；前两类文件 mtime 晚于我首轮绿跑，属并行在途批次）。
这与 §1.8-③ 已裁的 AC-11 基线（全局悬空 0 · 行宽 0）**按字面相冲** ⇒ 登记 **R-14 待父侧裁定**，本设计不自改裁：
候选 (a) 判据改「本批写域零红 + 不新增红」（eng-coder 入场先把非本批红逐条存档作对照）；
候选 (b) 保留全局 0/0，先请并行批次收红再派本批实施。
附带事实一条：`TESTING.md:111` 悬空的三条里，`thincoder-cli/test/integration/files.mjs` **盘上确实不存在**（对端 `thincoder-vscode/test/integration/files.mjs` 存在）——该红可能不是纯形态问题，归那一批自行核实。

### 2.9 修复轮 #11 回执（2026-09-20 · eng-designer · 收口 §5.4:419/420 顾问面 🟡①② + §3 评审收口项）

**写域**：`docs/core/design/MODEL-SPECS.md`（本档 §2 仅追加；需求面 / §1 / §4 / §5 不改）。

**落位表（逐条）**

| # | 派单项 | 状态 | 落点（设计档 file:line） |
|---|---|---|---|
| 1 | §3 影响表读数刷新（split 口径 253/84/253/395/304/152/154/149/221）+ 越线披露 | ✅ 已落 | §3 表 :275-:284 · 口径注与越线段 :286-:289 |
| 2 | §3 交付面计数收正（「八条」→ **十行** = 九条产品码/测试 + `PROVIDER.md`） | ✅ 已落 | :294-:296 |
| 3 | §1.5「列八项」/ §4「实施面七条」事实收正 + 父侧裁定请求（三处计数） | ✅ 已落 | :298-:302 |
| 4 | 针㈥① §2.8 面 2 补**回执面第三处落位**（`:86-87` 守卫） | ✅ 已落 | :259 |
| 5 | 针㈥② §7 边界「只改两处取值面」→ **三处** + 交互循环例外注 | ✅ 已落 | :393 |
| 6 | 针㈥③ §5 A-18 行补 `:86-87` + **零测试射程**注 | ✅ 已落 | :343-:344 |
| 7 | 针㈥④ §3 cmd-think 行补守卫（152 行） | ✅ 已落 | :280 |
| 8 | 针㈥⑤ 变更记录新条 | ✅ 已落 | :724-:725 |
| 9 | 判据面 A-16→**A-18** · 用例面 T-15→**T-17**（A-17/A-18 · T-16/T-17） | ✅ 已落 | :343-:344 · :375-:376 · 计数 :731 |
| 10 | **T-9 第四态**（`thincoder-core/test/provider-merge.test.mjs`） | ✅ **已落**（#17 收口轮：`:208` 标题四态 + `:216-218` 断言；307 行） | — |
| 11 | 本轮新捕 · 自造死坐标：§9.6 `cmd-think.mjs:115`（本批改动后已不指该处）→ `:104 / :127` | ✅ 已修 | :543 |
| 12 | 本轮新捕 · 陈报消解：§3「登记未登 ⇒ 用例现红」已被并行渠道批登记落笔 ⇒ 改为现状述（绿） | ✅ 已修 | :287-:289 |

**门读数（交付前一次 · 实跑）**

- `cd thincoder && node scripts/doc-check.mjs` ⇒ 锚 `OK：0 条悬空`（阈值 0）；行宽红 **2 行** = `docs/core/requirements/AGENT-LOOP.md:163（327 字符）/ :168（319 字符）`——该档 `git status` = `M`（**并行批在途未提交**，需求面 = 父侧写域）；本设计档零红、零新增红（档内 9 处命中全为「符号·宽——报告面，不入闸」）。
- 辅读 `cd thincoder-core && node test/core-hygiene.test.mjs` ⇒ `pass 5 · fail 0`（T-C14 绿；登记表体 `:54` · 注释 `:38-40`）。

**上报项（逐条 · 只报不改）**

1. **裁定出处未登 §1**：A-17 / A-18 的父侧裁定出处 = 本档 §5.4:419/420（advisor 代码评审 🟡①②）；§5.5 标题只明记「父侧裁定②」，🟡① 仅 §5.5:467「父侧已批」侧面承载 ⇒ 三方链需求环暂由 §5.4/§5.5 承担，请父侧补登 §1。
2. **交付面计数三方不齐**：§1.5（列八项）/ §4（实施面七条）/ §2.2（八条表体）/ 设计 §3（十行）。请父侧裁定「修正轮 +2 行是否入交付面」后统一三处；本档只改设计面 + 计数注，不改他段。
3. **同族可达面（复用 §5.5 越界报告 item 1）**：`thincoder-cli/src/tui/cmd-advisor.mjs:116-117` / `:235` 与 `thincoder-vscode/webview/settings-agent.js:50` / `:63` 仍可产出 A-18 本轮消解的同款矛盾载荷；设计 §2 现记 `cmd-advisor.mjs:225-255` 为「出批零改（listing-only）」⇒ 是否扩面 = 父侧裁。
4. **守卫零测试射程**：`:86-87` 回执守卫已入本批写面但无用例覆盖（用例面止于 T-17）⇒ 补用例请父侧登台账（该行注已在设计面写明）。
5. **行宽红他批在途**：`docs/core/requirements/AGENT-LOOP.md:163 / :168`（工作区 `M`）。
6. **口径差（非矛盾）**：`thincoder-vscode/webview/model-picker.js` 设计面 149（`split('\n').length`，口径已声明于 §3:286）vs §5.5:466「实读 148」（`wc -l` 口径）；同文件两口径，实跑两读均已复核（split=149 / wc=148），验收以本档声明口径为准。
7. **既有形态（非缺陷）**：`cmd-config` 面双 `"none"` 行 = 既有枚举呈现形态，本批零触碰。
8. **AC-13 复核实录**：`thincoder-vscode/src/specs.mjs` 5 个 qwen 键已在 HEAD（`7f3a532b`）、工作区干净 ⇒ 全覆盖成立。

**三方一致性（收口自检）**：设计 §3 影响表（10 行）= §5 判据面 **A-1…A-18（18 条）** = §6 用例面 **T-1…T-17（17 个）**，与本档 §2.2 交付面同源；**无未落项**（T-9 第四态 = #17 已落 · §5.6）。

**父侧收口注（§6 时点）**：本表上报项 1/2 已收（§1.14 / 三方计数统一）；3 → 已登台账（advisor/consult 同族残留）；4 → 已登台账（守卫零射程）；5 → 他批在途（需求档宽红 2 行，非本批笔）；6–8 = 确认无动作。

## §3 设计评审记录

### 轮次与发现（评审子代理）

### 轮次 1（评审子代理 · 写入通道未落 §3 —— **父侧代录 + 打标**；语义逐条忠实、长句压缩；全文见会话记录）

对象 = `docs/core/design/MODEL-SPECS.md` + 本批档 §1/§2；射程外 = 并行渠道批写入面。
评审自报限制：未读任何代码（全部 `file:line` 坐标 = 设计断言级）；未读 PROVIDER.md / DOC-DISCIPLINE.md。

| # | 类 | 级 | 发现（要点） | 建议（要点） |
|---|---|---|---|---|
| 1 | 文档所有权/交付面 | 🟡 | 派单文件面两档不一致：设计 `MODEL-SPECS.md:253-255`「七条 = eng-coder 的 designToken 文件面」（含 PROVIDER.md，`:247` 记 402/+14−2 为未做）⇄ 批档 `:165`「已落笔、不在实施面」+ `:258`「实施面=前六条」；语义相同，属状态陈旧（已登 R-12） | 窗收后改齐：设计 `:247` → 417 + 标「设计轮已落笔」；`:253-255` 改「六条实施面 + 第 7 条已完成」 |
| 2 | 纪律一致性 | 🟡 | 设计 `:361` 变更记录自称「坐标已改仓根完整路径」，但 `:167`、`:194-197` 仍混写裸段（`tools/file.mjs` 等），另 `:24/:112/:115/:145-147/:216/:309/:316` 裸 basename；现不红是因 basename 唯一索引兼容，并行批次增同名文件即抽红（AC-11） | 全部消费点坐标补成自仓根完整路径，与已采纳的 R-11（DOC-D4）一致 |
| 3 | Clarity/AC-13 | 🟡 | 设计 `:242` 写 `specs.mjs`「补 4 档」但增删 +5；现态只有 `qwen3.8-max→xhigh` 在册，A-13 另要求 `qwen3.7-max→xhigh` ⇒ 实为**补 5 档**；按「4 档」落码直接失 AC-13 | `:242` 改「补 5 档（四新档 + `qwen3.7-max`→xhigh）」 |
| 4 | 事实正确性 | 🟡 | 设计 `:163` 称本批「消除现网抛错：qwen3.8-max 设 `/think effort high` 必 400」——该档枚举 `xhigh/medium/low` 本批**保留零改**，抛错前后均存在，不属本批效果；真正被消解的是四新档路径（今日无枚举 ⇒ 回退门不生效） | 效果归属改到四新档；qwen3.8-max 单列为既有抛错面（入待办或标注），不据为本批效果 |
| 5 | Requirements/AC-14 | 🟡 | 设计 `:128` 对 `qwen3.7-plus` 等否决补行的理由 = 「能力四项无一项实测」；但需求 `:95` 允许「实测**或官方口径**」且 `:40` 官方清单点名 3.7-plus ⇒ 否决实基在更窄口径（官方口径只覆盖 context 单字段）未逐名交代 | 表 5-11 行逐名补一句：哪些字段有官方口径 / 哪些只到同族沿用，引 §1.3 + D-8（先例只到单字段）为据 |
| 6 | 计数 | 🔵 | 设计 §2.4 表 15 行实覆盖 19 具名 + 1 类；批档 `:141` 写「15 名穷举」错 | 批档改「15 行 / 19 名」（父侧本轮已改 ✓） |
| 7 | Testability | 🔵 | A-9 首断 `specMatch("qwen-flash").spec !== specMatch("qwen3.8-max").spec` **改动前同样成立**（无区分力）；T-1「均非 qwen 行」删键后无可比对象 | A-9 换 `specMatch("qwen").matched === false`；T-1 该子句删或同形替换 |
| 8 | 一致性 | 🔵 | §2.4 定义三档处置含「③ 登记待办」，15 行无一取 ③（解法写在 ② 行内）⇒ 空挂分支 | ③ 删，或把 §1.7(A) 普查残项落为 ③ 行 |
| 9 | 数值漂移 | 🔵 | `model-specs.mjs` 现行数 `:42`=211 ⇄ `:241`=210；普查「10 名」（`:32/:55/:261`）⇄ §2.3 表实列 11 名；PROVIDER.md 402⇄417（=R-12 已登） | 计数取实数三处一致（210 / 11 名）；设计断言的盘上现值标 unverified |
| 10 | 跨面口径 | 🔵 | CLI `/think on` 取首个非 none ⇒ 四新档得 `minimal`；VSC 默认档登记 `high` ⇒ 同模型两端默认强度不同（修法本体 = 父侧裁定，非缺陷） | §8 加一行裁定注：分叉为已知后果、不并入本轮（防后续当缺陷返工） |
| ＋ | 父侧自验追加 | 🟡 | 设计 `:77` 称「R-4 已消解」——但 §1.4-1 所忧的**跨轮回声**（历史含 `reasoning_content` 再发）并未被 §1.8-① 探针覆盖（它只证了关档无冲突）⇒ 表述过强；R-4 处置列仍要求行注 `unverified` | `:77` 改「关档路径实测无冲突；跨轮回声仍未实测（= optional 现状零变化）」+ 行注 `unverified` 照登 |

**VERDICT: pass**（计数：🔴 0 · 🟡 5 · 🔵 5 ——评审者语；父侧自验追加 1 🟡 另计）。凭证不入档（评审通过 = 事实登记，值不落文）。

## §4 用户批准

**2026-09-20 · 用户批准**（原文：「批准」）——设计链收口后批准：

- **批准对象**：设计档 `docs/core/design/MODEL-SPECS.md`（qwen 族规格面 §1–§8 + 变更记录）+ 本档 §2 实施任务书（交付面 = 产品码/测试七条）。
- **前置状态**：设计评审轮次 1 **PASS**（🔴 0 · 🟡 5 · 🔵 5 + 父侧自验追加 🟡 1）；11 条发现逐条裁定落地并经父侧复验；同步收尾轮（#7 四针 / #8 两针）落位、三处口径归真（§1.11–§1.13）；机检 `OK(锚): 0 · OK(行宽)` 实跑复核；§3 评审记录已落（代录打标）。
- **批准范围**：本档 §1.5 + §2.2 实施面 = **七条**——`thincoder-core/model-specs.mjs` · `thincoder-vscode/src/specs.mjs` · `thincoder-core/test/model-specs.test.mjs` · `thincoder-core/test/provider-merge.test.mjs` · `thincoder-cli/src/tui/cmd-think.mjs` · `thincoder-cli/test/cmd-think.test.mjs`（新建）· `thincoder-vscode/test/image-downgrade.test.mjs`；**不含** `docs/core/design/PROVIDER.md`（设计轮已落笔，非实施面）。
- **解锁**：eng-coder 实施（凭证 = 评审轮 1 签发，值不落文档）；实施完成 → 父侧验证 → 收口核销（D7）。
- **扩面追记（父侧裁定 · 2026-09-20 修复轮）**：交付面经修复轮 +2（`thincoder-vscode/webview/model-picker.js` / `thincoder-vscode/test/model-picker-fallback.test.mjs`——修复本批自引入回归，披露在案）⇒ 实施面七条 → **九条**；本批准记录**原文保留**（不回溯改写），扩面依据 = §1.14 / §2.2 扩面块。

## §5 实施与修正记录

（待 eng-coder 自写。）

### §5.1 交付摘要（eng-coder 自写 · 落位完成）

**实施面七条全部落位**（写域 = 本档 §2.2 前七条产品码 / 测试文件；第 8 条 `docs/core/design/PROVIDER.md` = 设计轮已落笔，本批未碰）：

| # | 文件 | 落码内容 | 增删（`git diff --numstat` 实测） |
|---|---|---|---|
| 1 | `thincoder-core/model-specs.mjs` | 删 4 行（`qwen3.8-max-preview` · `qwen-max` · `qwen-plus` · 泛前缀 `qwen`）；增 4 独立行（`qwen3.7-flash` 枚举 6 档无 `max` · `qwen3.8-flash` 7 档 · `qwen3.8-omni-flash` 7 档 · `qwen3.8-27b` context 262_144）；三段行注（证据等级逐项标明 / `reasoningEcho` 不声明（R-4）/ 禁重加泛前缀行） | +21 / −4 |
| 2 | `thincoder-vscode/src/specs.mjs` | `EFFORT_DEFAULT_PREFIXES` 补 5 键（`qwen3.7-max`→`xhigh` · 四新档→`high`；`qwen3.8-max`→`xhigh` 既有保留） | 我面 +5 行；文件读数 +24 / −1 **含并行批 M2 `ctxPercentForHistory` 面，非我** |
| 3 | `thincoder-cli/src/tui/cmd-think.mjs` | `:118` on 默认档 = 枚举**首个非 `"none"`** 档（全 `none` / 无枚举 ⇒ `"high"`）；`applyThink` 改具名导出（供 T-14 直驱） | +8 / −5 |
| 4 | `thincoder-cli/test/cmd-think.test.mjs`（批内新建） | T-14 三用例（四新档 ⇒ `minimal` + off 标记清除 + 同步字段；枚举全 `none` ⇒ `high`；无枚举 ⇒ `high`） | +84（新档） |
| 5 | `thincoder-core/test/model-specs.test.mjs` | qwen 段 T-1…T-13（用例标题带 `[qwen]` 与上段同号用例消歧）；删上段 `cacheMode` 取值断言（D-10 删除行账，实删行 = `assert.equal(spec.cacheMode, "auto")`） | +165 / −3 |
| 6 | `thincoder-core/test/provider-merge.test.mjs` | T-8（越界门：枚举外 `max` 于组体前抛错 + 零出站 + 错误串含服务端原文序 + 正控 `xhigh` 过门）+ T-9（`resolveEnableThinking` 三态 × 两新档 + 非百炼 host 负控） | +60 / −0 |
| 7 | `thincoder-vscode/test/image-downgrade.test.mjs` | T-10（四新档 ⇒ `high` / 两 max 档 ⇒ `xhigh`，且默认档须是枚举成员）+ T-15（qwen 域无族前缀条目负探针） | +37 / −0 |

### §5.2 实施裁定与漂移上报（逐条）

**落码裁定（实施层自定，均有出处，无越设计）**：

1. `applyThink` 改**具名导出**——设计 §2.8 只写 `:118` 取值改法、未写导出；T-14 要直驱该函数（私有面不可达）⇒ 导出为达成用例所必需，**行为零变化**（导出不改调用面）。**漂移 ⑤**。
2. **T-15 改形**：设计 §6 T-15 原文「任一键均没有同为键前缀的兄弟」（全表结构断言）**全表不成立**——既有反例 `deepseek-v4-flash` ⊂ `deepseek-v4-flash-vision-exp`、`glm-5` ⊂ `glm-5.3` ⇒ 按 **qwen 域负探针**实施（族前缀条目如 `qwen3.8` / `qwen` 一被加回即红）。改形理由写在用例注释内。**漂移 ①**。
3. **T-8 / T-9 同落 `provider-merge.test.mjs`**：设计把 A-7（`enable_thinking` 三态）落点写在该档且 §2.2 只给 +12；A-3 越界门未指定文件 ⇒ 两用例同档落位，该档 +60（超 +12 预估）。**漂移 ②**。
4. 未知模型查表 `warnUnknownModel` 会告警 ⇒ 负探针用例（T-15 / T-10）自带局部 `silent()`（`try/finally` 还原 `console.warn`），不引共享夹具。
5. 行注语言 = 英文（`model-specs.mjs` 既有行注风格）；测试内注释 = 中文（测试档既有风格）。
6. 本批**不动** `config.mjs`（两机制不混同，AC-7 零改）、不动 `PROVIDER_PRESETS`、不引新网络调用面、不补未实测档位（§1.3 边界逐条守住）。

**漂移表（实施读数 vs 设计/批次档书面数字）**：

| # | 书面 | 实测 | 归因 |
|---|---|---|---|
| ① | 设计 §6 T-15「全表无键前缀兄弟」结构断言 | 全表不成立（既有两族反例）⇒ 改 qwen 域负探针 | 设计对既有表的普查漏了 deepseek / glm 两族；改形不降强度（针对本批语义域） |
| ② | §2.2 `provider-merge.test.mjs` +12 | +60 | T-8 落点同档（第 3 条裁定） |
| ③ | §3 表 `model-specs.test.mjs` −2 | +165 / −3 | 删行账实为 3 行（2 行档头注释重写 + 1 行 `cacheMode` 断言）；增行含三段行注与 T-13 结构扫针 |
| ④ | 设计引用 `thincoder-vscode/src/specs.mjs:50-54`（`EFFORT_DEFAULT_PREFIXES` 坐标） | 该表现于 `:27-36`（我面 +5 行后） | 设计写作时行号已偏（该档并行批同时改头部注释）；坐标漂移非语义漂移 |
| ⑤ | 设计 §2.8 未提 `applyThink` 导出 | 已改具名导出 | 第 1 条裁定 |

**未验证项（写明但不作阻塞）**：VSC 测试跑尾部提示「子进程仍持有管道」——退出码 0、读数完整（`tests 831 · pass 831 · fail 0`），判为环境提示非用例失败；`reasoningEcho` 四新档跨轮回声按 R-4 不声明（行注 `unverified` 级）。

### §5.3 机检 / 测试实跑读数（收口终跑）

| 门 | 命令 | 读数 |
|---|---|---|
| 核测试 | `cd thincoder-core && node test/run.mjs`（= 该包 `scripts.test`） | `tests 413 · pass 413 · fail 0` |
| CLI 测试 | `cd thincoder-cli && node test/run.mjs`（= 该包 `scripts.test`） | `tests 735 · pass 735 · fail 0` |
| VSC 测试 | `cd thincoder-vscode && node test/run.mjs`（= 该包 `scripts.test`） | `tests 831 · pass 831 · fail 0` |
| 文档机检 | `cd thincoder && node scripts/doc-check.mjs` | 全局 `FAIL(锚): 3 悬空`（全在 `docs/vsc/design/WEBVIEW-PROTOCOL.md:354/:365/:377`，属并行显示面批写域，其文件在工作区为已修改态）· `FAIL(行宽): 2 行`（`docs/core/requirements/AGENT-LOOP.md:163` 373 字符 / `:167` 332 字符——**该档工作区未改、最后提交 `5b52523b`、非本批引入**）；**本批写域（七文件 + 本批次档）零红、零新增红**（入场时快照 = 悬空 0 · 行宽 2〔同上两行〕⇒ 增量三条悬空属并行批）——按 §2.4 R-14 候选 (a)「本批写域零红 + 不新增红」成立；AC-11 文本基线（全局 0/0）与本时点全局值不齐的原因登记于 R-14，本批不自改裁 |

### §5.4 审计轮 · 修复轮 · 代码评审轮（执行者自写）

**内部 divergence 审计（subagent explore · 只读 · 一轮）**
- VERDICT `findings(4)`，`OUT-OF-LIST 0`（无越面改动）。
- 审计推翻我 §5.2 的自报漂移 ⑤：设计 `MODEL-SPECS.md:237/:258/:351/:655` 四处明写 `applyThink` 具名导出 ⇒ 非实施层自定、非漂移。
- 审计更正我 T-15 注释里的失实举证（`glm-5 ⊂ glm-5.3` 属核表、非 VSC `EFFORT_DEFAULT_PREFIXES`；该表内有效反例仅 `deepseek-v4-flash` ⊂ `deepseek-v4-flash-vision-exp`）⇒ 已按表内原文改注释（`thincoder-vscode/test/image-downgrade.test.mjs:246-248`）。
- 审计自陈限制：三端读数为我自报、它未复核；未提交改动全集它无法枚举。

**fix round 1（自修 · 一轮）**
- F1：`thincoder-core/model-specs.mjs:75-79` omni 行注补齐口径标注——`context` = 文档/网页口径（1M 级，非 API 实测）、`partialMode/cacheMode/thinkApi/tempRange` = 同族沿用、`reasoningEcho` 按 R-4 未声明。
- F2：`thincoder-core/test/model-specs.test.mjs:221-255` T-13 ② 由**文件级 allowlist**（`image-downgrade.test.mjs` 整档豁免 ⇒ 该档新增取值断言不红，窄于设计）改为**逐档计数冻结**（`scanFieldHits` 返回 `[rel, count]`，基线 `thincoder-cli/test/model-ref.test.mjs`=1 · `thincoder-vscode/test/image-downgrade.test.mjs`=1）。
  - 负控实测：临时在 `image-downgrade.test.mjs` 追加一条 `cacheMode` 取值断言 ⇒ 核套件 T-13 转红（`✖ [qwen] T-13/D-10 …`）⇒ 撤销探针后复绿；`git diff --numstat` 净变化 `+37/-0`（探针零残留，`findstr` 扫 `TEMP NEGATIVE`/`T-EMP` 无命中）。
- F3：设计档死指针（`MODEL-SPECS.md:330` 引 `:50-54`、`:305` 引 `:22-31`）——设计档非我写面 ⇒ **上报不改**，交父侧收口轮。
- F4：§5.2 所述更正（⑤失实、④坐标 `:22-36`）以本节为更正面登记。

**修复后终态读数（实跑）**
- `thincoder-core` = 413 / 413 / 0 · `thincoder-cli` = 735 / 735 / 0 · `thincoder-vscode` = 831 / 831 / 0。
- `node scripts/doc-check.mjs` = 闸态 `OK(锚): 0 条悬空`（阈值 0）；列报项全在他人写域档（`ENG-TOKEN-BINDING.md` / `DESIGN-TOKEN-SETTLEMENT.md` / `docs/core/requirements/…`），本批写域零红零新增。

**advisor 代码评审（type:'code' · 同步 · 一轮）**
- VERDICT `pass`（0 🔴 / 2 🟡 / 4 🔵）。处置：
  - 🟡①「VSC 对话面板 picker 不读 `effortDefault`（`webview/model-picker.js:82/:119` 取 `levels[0]`，四新档首项 = `none`）⇒ 选中即落 `reasoning="none"` = 思考关，与登记默认 `high` 分叉」——修点在 webview（不在本批七文件面）且涉 design §2.8/§8 口径 ⇒ **父侧裁定项，不自行改**。
  - 🟡②「CLI `/think effort none` 使百炼 qwen 载荷携 `enable_thinking:true` + `reasoning_effort:"none"`（批前不可达）」——两种修法（`none` 按 off 处理／列表不列 `none`）均改设计 §2.6-2/§8 口径 ⇒ **父侧裁定项，不自行改**。
  - 🔵③ T-13 全仓扫针跨包耦合、🔵④ `allowedProd` 中 VSC 项空许可、🔵⑥ T-14 直驱不覆盖 `handleThinkCommand` 绑定面 —— 三者均为设计明定口径（T-13 全仓域 / P-1 允许面 / T-14 直驱形态）⇒ **保留并披露**。
  - 🔵⑤ 用例标题 AC 标注错位 ⇒ **已修**：`T-7/A-4 → T-7/§2.7`、`T-11/A-8 → T-11/§1.3`（纯字符串，无断言语义改动；修后核套件复跑 413/413/0）。

**终态：`clean`**（0 🔴 未决；2 🟡 为父侧裁定项、不阻塞；1 条 🔵 已修、3 条 🔵 设计明定保留）。

**未验证项（诚实登记）**：三端测试读数为本会话实跑输出（advisor 未复核）；VSC 跑尾部提示「子进程仍持有管道」但退出码 0、读数完整；`reasoningEcho` 四新档按 R-4 未声明；顾问面 🟡①② 端到端行为未实机复现（证据链为静态逐环 `file:line`）。

### §5.5 修复轮 #11（2026-09-20 · eng-coder · 收口 §5.4:419/420 两条顾问面发现 · 父侧裁定②=「`none` 按 off 处理」）

**交付摘要**

| # | 判据 | 落点（file:line） |
|---|---|---|
| ① | reasoning 归一改取端侧默认档（`effortDefault`），未声明才回落枚举首项 | `thincoder-vscode/webview/model-picker.js:85`（`selectModel`）、`:123`（`handleModelsMessage`）——两处 `… \|\| levels[0]` 式；理由注释单一出处 = `selectModel` 内，`:122` 登记指针 |
| ② | `/think effort none` = 关思考（与 off 动作同态） | `thincoder-cli/src/tui/cmd-think.mjs:104` 入口归一（`effort`+`"none"` ⇒ `{action:"off"}`）；回执 `:37`/`:82` none ⇒ `Thinking: OFF`；循环回执公式 `:86-87` 补 `cur.thinking !== null` 守卫（相邻既有 bug：缺守卫时 effort 型 off 后回执误报 ON） |
| ③ | 测试面（CLI） | `thincoder-cli/test/cmd-think.test.mjs` +3 测（`:105` 四新档 none ⇒ `thinking:null` + 删 effort + 载荷 `enable_thinking:false`；`:125` glm-5.2 type 型 ⇒ `{type:"disabled"}`；`:142` 非 none 零回归） |
| ③b | 测试面（VSC） | `thincoder-vscode/test/model-picker-fallback.test.mjs` +2 测（`:173` 直驱、`:192` 真点击流 `#model-btn`→provider 行→飞窗行）+ `:154` ② 测改题为负控「未声明 `effortDefault` ⇒ 回落 `levels[0]`」 |

**决策透明表**

| 决策 | 依据 | 备选与否决 |
|---|---|---|
| 归一式 = `effortDefault \|\| levels[0]`（不夹取成员性） | 设计 A-17 原文口径 | 夹取式（非成员回落 `levels[0]`）= 评审 🔵1 建议——未采纳：超设计写面，成员性由既有 T-10 断言面护栏 |
| `none` 归一到**既有 off 路径**（不新造第三态） | 父侧裁定 + 各族原生 off 形（effort 型 `thinking:null`／type 型 `{type:"disabled"}`） | 新造「零强度」语义 = 被否（载荷层 `core.mjs:197-204` 会真送 `reasoning_effort:"none"`，且与 `config.mjs:137` 的 `thinking===null ⇒ false` 判据错位） |
| 循环回执守卫随本轮一并修（= 第三处改动） | ③ 的回执文案与状态机同拍显示相抵（缺守卫必误报 ON） | 只改 `:82` 文案不修公式 = 留下同拍自相矛盾 |
| 死变量 `prevAuto`/`prevThinking`/`prevEffort`（`:69-71`）**未删** | 非本轮写面、非运行错误；三项仅声明处出现（grep 实证） | 删除 = 评审 🔵4 建议——留父侧裁，防扩面 |

**审计与评审轮次与终态**

- 内部偏差审计（explore 只读 · 1 轮）：判据 A/B/C ✅——归一残留全端扫描 3 命中皆同式无漏改点；off 双型形齐备且载荷门核实；测试真产线 + 有区分力 + 反例族（MiniMax 无枚举）已排除。D ⚠️ 仅「本轮未落档」一项，本段即消解。
- advisor（type=code · 1 轮）：`VERDICT: pass`（0 🔴 / 1 🟡 / 4 🔵）。🟡 = 循环回执守卫不在设计写面（§2.8-2 只记 `:106-111`、A-18 只指 `:47-48`）且设计 §7「交互循环零触碰」已陈旧 ⇒ **文档陈旧类，按 R7e 报告不阻断**；🔵1 成员夹取、🔵2 `"off"` 哨兵归一为 `effortDefault`（已核为非缺陷：用户显式 off 存 `"none"` ∈ 枚举 ⇒ 保留）、🔵3/🔵4 见上表与死变量项。
- **fix round**：#11 内 1 轮——③-b 原断言（期待点击路补发 `selectReasoning`）属自造、超出既有写面契约，已撤为「显示面 `High`（非 off）+ 槽写 `selectModel` post 在位 + 不补发 `selectReasoning`」；结论 = 已修，复查 833/833。
- 终态：**clean**（评审 pass；1 🟡 + 4 🔵 全数披露，0 项待修待复）。

**验证读数（实跑 · 最终盘面）**

- `cd thincoder-cli && node test/run.mjs` = **738 pass / 0 fail**（735 基线 + 本轮 3）。
- `cd thincoder-vscode && node test/run.mjs` = **833 pass / 0 fail**（831 基线 + 本轮 2）。
- `cd thincoder && node scripts/doc-check.mjs`：**锚 0 悬空**（闸态阈值 0 ✅）；行宽红 2 行落 `docs/core/requirements/AGENT-LOOP.md:163/:168` = **并行批在途未提交编辑**（`git diff` 见其 hunk），非本交付面。
- 瞬态披露：一次 CLI 全量 737/1 红 = `T-CL1`（common 英文面 ## 块数 · prompt 面）；单测隔离跑 pass、全量复跑 pass ⇒ 并行写 prompt 面所致，非本轮引入；最终读数 738/738。

**越界/收口报告（未自行处理，交父侧）**

1. 🟡② 同族残留可达面：`/advisor` effort 菜单仍可写入无 off 标记的 `"none"`（`thincoder-cli/src/tui/cmd-advisor.mjs:116-117` 直赋 + `:235` 档位表取 `spec.reasoningEffortEnum`）——四新档枚举首项即 `none` ⇒ 产出 A-18 本轮刚消解的同款矛盾载荷；另有 VSC 设置卡 advisor/consult effort 下拉同族（`webview/settings-agent.js:50/:63` 渲染全枚举）。**只报不改。**
2. 设计档漂移（非本交付写域）：§7 边界「CLI 面板/picker / 交互循环 / `:16` 列表语义零触碰」与已落守卫相抵；§2.8-2/A-18 只记 `:106-111`/`:47-48` 两处 ⇒ 请 designer/父侧补一行口径（回执同式守卫）。
3. 设计档 §3 影响表读数陈旧：`thincoder-vscode/test/model-picker-fallback.test.mjs` 计划 `157 / +~14`、`thincoder-cli/test/cmd-think.test.mjs` 计划 `85 / +~15`，两档实测行数均显著高于计划增量；`model-picker.js` 记 149 而实读 148。
4. 文件清单披露：本轮 4 档 = 任务书写面 3 档（`model-picker.js` ① / `cmd-think.mjs` ② / `cmd-think.test.mjs` ③）+ 1 档既有在册测试档 `thincoder-vscode/test/model-picker-fallback.test.mjs`（+2 测 +1 改题 + 头注锚点修正——父侧已批）。
5. 方法偏差自披露：一次字符级正字（`思耉`→`思考` ×2）经 `node -e`（fs 写）完成，违反「写类走 write/edit」纪律；事后核验 = grep 零残留 + 该档 8/8 + 全量 833/833。

### §5.6 微收尾轮 #12（2026-09-20 · eng-coder · 补 T-9 第四态 · 收设计 `:279` / 批档 §2 `:337` 第 10 项「本批唯一未落实施项」）

**交付摘要**

| # | 判据 | 落点（file:line） |
|---|---|---|
| ① | T-9 第四态（同携态 `{thinking:null, reasoningEffort:"none"}` ⇒ `false`）× 两新档 | `thincoder-core/test/provider-merge.test.mjs:216-218`（两行依据注释 + 一行断言；两档由 `:210` 循环覆盖） |
| ② | 标题计数 三态 → 四态（与设计 §6 T-9 口径对齐） | 同档 `:208`（`T-9/A-7 enable_thinking 四态零回归：两新档 × 百炼 host＋非百炼负控`） |
| ③ | 增量面 = 设计 `:279` 预估 `+~4 / −0` | 实读 304 → 307（read/split 口径；`wc -l` 语义 306）⇒ **+3**（注释 ×2 + 断言 ×1；改题不改行数），无夹带 |

写面：**仅 `thincoder-core/test/provider-merge.test.mjs`**（= §2.2 原七条产品码/测试档之一，非扩面）。

**决策透明表**

| 决策 | 依据 | 备选与否决 |
|---|---|---|
| 第四态期望 = `false`（非 `undefined`） | 设计 §6 T-9（`:368`）四态 `false/true/undefined/false` + §5 A-7（`:333`）「同携态 ⇒ `false`」 | 期望 `undefined` = 与设计相抵（`thinking === null` 先判，必 `false`） |
| 同携态取「保留 `"none"` 档」形（而非只断 CLI 实发形） | 设计 A-18 终态集 `reasoningEffort ∈ {"none", undefined}` + §2.8-2（`:256-258`）「两写法均可、判据不区分两形」 | 只断 `{thinking:null}`（`cmd-think.mjs:127` 已删档）= 设计明列第四态少一形，并丢判序护栏 |
| 以判序作区分力支点（注释注明「判序颠倒即回归 true」） | `config.mjs:137`（`thinking === null` 先判）先于 `:138`（truthy 档位次判）；`"none"` 为 truthy ⇒ 倒序即 `true` | 不加判序说明 = 断言看似冗余（前三态在倒序下仍绿，第四态是唯一区分点） |

**审计与评审轮次与终态**

- 内部偏差审计（explore 只读 · 1 轮）：判据 A–E 全 ✅ · `OUT-OF-LIST 0`。独立复核要点：设计 `:368` 四态逐项对位；`config.mjs:133-140` 判序自核（其明记未采信自述）；第四态所模拟形 = 设计 A-18 明列两形之一且注释如实声明；既有 `B-1…B-6` 段与 T-8 / T-9 前三态零扰动；「§5 回执未落」一项由本段消解。
- advisor（type=code · 1 轮 · 同步）：`VERDICT: pass`（0 🔴 / 2 🟡 / 1 🔵）。两条 🟡 = **doc 落位状态面陈旧**（设计 `:279`/`:297`、批档 `:337`/`:357`/`:409` 仍述「未落 / 三态 / 304 行」）⇒ 按 R7e 不阻断、报父侧刷；🔵 = 该档越 300 软线但已在 `core-hygiene.test.mjs:55` 登记、拆分义务归并行渠道批（R3 既有裁定）⇒ 无需动作。
- **fix round：0 轮**（审计与评审均无产品面待修项；两条 🟡 属 doc 面、受令只报不改）。
- 终态：**clean**。

**验证读数（实跑）**

- `cd thincoder-core && npm test` = **`tests 434 · pass 434 · fail 0`**（exit 0）。
- `cd thincoder && node scripts/doc-check.mjs` = **`OK(锚): 0 条悬空（闸态——阈值 0）`** · **`OK(行宽)`**（exit 0）；✗/报告行属列报面（迁移期引文等，不入闸）。

**越界/收口报告（未自行处理，交父侧）**

1. **设计档陈旧 2 处**：`MODEL-SPECS.md:279` 仍写「`+~4 / −0`（**未落**——修复轮唯一未落项）… **T-9 第四态待补**」+ 现行数 `304`；`:297` 仍写「**唯一未落项 = …T-9 第四态**」⇒ 请父侧收口轮刷为「已落」并同步行数（307 / 306）。
2. **批档陈旧 3 处**：§2.9 回执表 `:337` 第 10 行 `❌ **未落**`；`:357`「唯一未落项 = **T-9 第四态**（#10）」；§5.1 `:409` 述 T-9 为「三态 × 两新档」。本工具为**段内追加**（不改旧行）⇒ §5.1 前段不追改，请父侧随收口一次性闭合 #10 并注明 `:409` 为 as-of 读数。

## §6 验证与收口

**收口日期**：2026-09-20 · **终态**：✅ 已收口

### 6.1 交付面验证（十项 = 实施九条 + `PROVIDER.md` 设计轮笔行）

| 条 | 落位 | 验证 |
|---|---|---|
| 1 `thincoder-core/model-specs.mjs` | 4 新行 + 4 删行 | core 套件 435/0 ✓（A-1..A-16 用例全绿） |
| 2 `thincoder-vscode/src/specs.mjs` | 5 键（`EFFORT_DEFAULT_PREFIXES`） | 已在 HEAD（`7f3a532b`——显示面消差批提交顺带；**附记**，非本批提交面） |
| 3 `thincoder-vscode/test/image-downgrade.test.mjs` | T-15 | vsc 套件 ✓ |
| 4 `thincoder-core/test/model-specs.test.mjs` | T-3..T-6 / T-13 等 | core ✓ |
| 5 `thincoder-core/test/provider-merge.test.mjs` | T-9 三态 + 第四态（`:216-218`） | core ✓（#17 后） |
| 6 `thincoder-cli/src/tui/cmd-think.mjs` | on 首非 `none` + `none`⇒off + 回执守卫 | cli ✓ |
| 7 `thincoder-cli/test/cmd-think.test.mjs`（新建） | T-14 / T-16 | cli ✓ |
| 8 `thincoder-vscode/webview/model-picker.js` | 裁定① 护栏（`:85`/`:123`） | vsc ✓ |
| 9 `thincoder-vscode/test/model-picker-fallback.test.mjs` | T-17 | vsc ✓ |
| 10 `docs/core/design/PROVIDER.md` | 设计轮笔（+15/−2） | 档在（445 行）✓ |

### 6.2 终态机检（父侧实跑 · 2026-09-20 13:5x）

- 三端：core **435 / 0** · cli **738 / 0** · vsc **839 / 0**（`npm test` 原文读数；vsc 总数含并行批测试入驻，本批新测全绿）。
- `cd thincoder && node scripts/doc-check.mjs` ⇒ `OK(锚): 0 条悬空` · `OK(行宽): 无 >300 字符单行`。

### 6.3 验收回指

AC-1..AC-14 全部承载于设计 §5 判据面 **A-1..A-18** + 用例面 **T-1..T-17**（全绿）；§1.8 三项裁定 / §1.10 P-1..P-3 / §1.14 裁定①② = 逐条落位（§5.4 / §5.5 / §5.6 实读核验）。§5.1 `:409`「三态」述 = 该轮 as-of 读数（第四态后落于 §5.6；**终态以本节为准**）。

### 6.4 结算同步（D7 清单）

- **角色表**：讨论 = 父侧 · 设计 = eng-designer（#4 串位事故后隔位产出 + #7/#8 收尾 + #14 补记）· 设计评审 = advisor 轮 1 **PASS**（§3 逐字落档）· 批准 = 用户（§4）· 实施 = eng-coder #11 · 修复 = #15（裁定①②）+ #17（T-9 第四态）。
- **状态行**：本档 → 「已收口 2026-09-20」（本节落笔后**冻结**）。
- **计数**：交付面 = **十项**（§2.2）/ 实施面 = **九条** / 判据 = A-1..A-18 / 用例 = T-1..T-17。
- **父侧机械直改（打标 · 可逐条核）**：§2.9 表行 10 `❌未落`→`✅已落` · `:357` 无未落项句 · §2.9 尾上报项收口注 · 本档状态行 ×2。
- **变更记录**：设计档变更记录（修复轮条⑤ + 收口条——#14 落）。
- **他批联动**：① `specs.mjs` 5 键经 `7f3a532b` 入 HEAD；② #15 三项披露（文件面 +2 · `node -e` 字符写违纪自述 · 读法口径）= 已登记 §5.5。

### 6.5 台账结算

**#8 / #9 / #10**：`在途 → 待核销 → 已核销`（结算依据 = 本档 §6 + 三端实跑读数）。

### 6.6 提交

路径限提交 = 本收口序列末步；hash 落台账 evidence（不入本档，避二次回改）。
