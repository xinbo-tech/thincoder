# 模型清单 provider 化 + 去候选否决权 · 批次记录（2026-09-10）

> 六段 append-only，**一段一作者**：§1 讨论（主 agent）· §2 批次任务（eng-designer）·
> §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 不是规格：需求内容按**新老划断**同档承载（Provider 板块无 `requirements/` 镜像，需求层落
> `../design/PROVIDER.md`——具体落点由 designer 定）；整批做完本档冻结。
> 机制与模板见 `requirements/ENGINEERING-MODE.md` §1.12。**本档 = 第 3 批**（第 1 批 `2026-09-10-ENGINEERING-MODE.md`、
> 第 2 批 `2026-09-10-ENG-DESIGNER.md`）。

---

## §1 讨论（主 agent）

### 批次范围

**第 3 批 = 模型选择面重构**（CLI + VSC **双端同批**）。六个面：

| 面 | 内容 |
|---|---|
| ① 清单来源 provider 化 | 可用模型清单的权威 = **运行期从 provider 拉取**（`GET /models`），按 `format` 各实现一份（openai / anthropic / google） |
| ② 删除候选清单字段 | `providers[].models[]` **整字段删除**——含内置预设、迁移、会话槽位兜底、picker 候选区、`/config` 默认模型菜单、wizard 播种 |
| ③ 渠道默认模型（单值） | 每渠道保留**恰好一个**默认模型字符串——承担：新装启动种子 / 会话槽位空时兜底 / 端点不支持列表时的最后手段 |
| ④ 显式 `provider:model` 放行 | 一律放行；仅【空值 / 裸值（无冒号）/ 未知 provider】= 无效 |
| ⑤ 切换回显 spec 来源 | 切换成功回显一行规格来源；`DEFAULT_SPEC` 兜底时警示色 + 提示经 `/config` 设 `context` 覆盖 |
| ⑥ VSC 端同批对齐 | 面板候选同源（provider 拉取）+ `resolveDefaultModel` 不再静默回退 `models[0]` |

**明确不在本批**：MODEL_SPECS 前缀匹配的**无条件继承**隐患（`qwen3.8-flash` 蹭泛前缀 `qwen` → `thinking:false`
一类；另有差异快照静默蹭主线 spec 且无提示）——**另登记独立待办**（用户 2026-09-10 同意）。

### 谈成什么（逐条）

1. **范围升格**（用户原话："providers[].models 不是我预期中的设计，模型应该从 provider 拉"）——由「**去否决权**」
   升为「**清单 provider 化 + 去否决权**」，两项**同批**。理由：只去否决权会留一个必然与 `/models` 漂移的
   第二来源（人工维护的清单与端点真实清单不可能长期一致）。
2. **字段去留 = 不留**（用户："Q1 没意义，不留"）。主 agent 原推荐「保留字段、降语义为便捷列表」**被否**——
   候选清单整体不由人工维护。
3. **显式 `provider:model` 放行**（用户："Q2 放行"）——不做「候选外需二次确认 / `--force`」这类方案：
   那是给白名单开后门，与本次定调相反。
4. **spec 来源回显 = 要**（用户："q3 那肯定要啊"）。现状提示是 `console.warn` 打 stdout（`model-specs.mjs:117-120`），
   TUI 全屏绘制下基本不可见——放开选择面后"错 spec 静默运行"更难发现，回显是配套件。
5. **拉不到列表的渠道**（用户："q4 不支持 get models 就拉不到模型就不用了呗"）。**读法经用户确认**：
   该渠道**不列候选、不保留任何静态兜底清单**；渠道**照常可用**，模型名手输 `p:m`。
6. **VSC 端同批**（用户："q5 一起改"）。
7. **渠道默认模型（单值）保留**（主 agent 推荐"留"，用户确认）。与第 2 条**不冲突**：删的是**清单**（数组），
   留的是**单值**（一个启动/兜底模型）。不保留的代价：无网或端点不支持时，必须先手输模型名才能开始对话。
8. **排除方向（沿用原条目）**：不是"放宽 F-1"、不是给白名单开后门、不是往 `models[]` 补登记一行
   （补登记 = 迁就该拆的错结构）。
9. **槽位面已是目标形态**（现成先例，非新机制）：`/submodel` 与 `/config` consult 池（`model-picker.mjs:177` 起）
   **已**从 `listModels` 拉取并**直接可选**、不受 `models[]` 约束。本批实质 = 把**会话面**提升到槽位面语义。

### 对账结果（与现有文档/裁定的冲突 + 用户澄清）

| # | 现存表述 | 本批处置 |
|---|---|---|
| 1 | `src/model-ref.mjs:1-6` 头注「`providers[].models[]` (string array) is the HARD candidate set」 | 实现改 + 头注改写（本批） |
| 2 | `src/model-ref.mjs:68-74` `firstCandidate` 注释「the channel default no longer exists; candidates replace it」 | **本批恢复渠道单值默认** → 该注释须改写；属 MODEL-MERGE-SESSION 的**部分回滚**（当初把预设 scalar `model` 退职换成 `models[]` 种子——见 `config.mjs:30-32`） |
| 3 | `docs/design/SESSION.md:225-232`（D-S1/D-S2/D-S3 段内「models[] 是候选硬约束」句） | 须改写。**D-S1 机制本身保留**（无效 defaultModel **不抛错** → 标 `providerInvalidReason` → TUI 首帧弹 picker）；变的只是"无效"的**判据**——不再含"候选外" |
| 4 | `docs/design/PROVIDER.md` §9（规格表与决策）/ §11（模型支持与预设） | 本批设计落点；§11「预设 = models 种子（裁定⑦）」改写为「预设 = 单值默认模型」 |
| 5 | `_archive/MODEL-MERGE-SESSION.md` F-1/F-7 裁定（候选白名单） | `_archive/` **正文冻结不重写**；取代关系在 `PROVIDER.md` 变更记录记一行，代码注释内 F-1/F-7 引用就地清理 |
| 6 | `docs/TODO.md:275-304` 需求池条目（多行细节） | 本批已改写为**指针条目**（顺带兑现 `docs/TODO.md:144` 的"条目格式收拢"） |
| 7 | VSC 端是否有对应 Provider 板块档需同改 | **待勘察**（designer 定：`thincoder-vscode/docs/` 现状 + 是否新增） |

> 口径注（本批不动）：预设的 `maxTokens` / `thinking` / `reasoningEffort` / `format` 等字段**保留原样**——
> 本批只动"模型清单"这一件事。

#### 已核事实清单（供 designer 免重复勘察）

> 行号为 **as-of 2026-09-10** 快照；designer 勘察以现场为准。标注（勘察）= explore 只读子代理读码所得，
> 主 agent **未逐行复核**——引用前先核。

**参数表（主 agent 已读）**

- `src/model-specs.mjs`：`MODEL_SPECS`（`:27`）· `SORTED_SPECS` 长度降序（`:101`）· `specForModel`（`:102-122`：
  前缀命中 → vendor 命名空间剥离重试 → `DEFAULT_SPEC`（`:89` = `{128K, 32K, cacheMode:"none"}`）+ warn once（`:117-120`））·
  `providerSpec`（`:140-145`：`providers[].context` K 单位覆盖，返回**拷贝**防共享 spec 被污染）。
- 实测（本会话实跑，非引述）：`specForModel('qwen3.8-max-0902')` → 命中 `qwen3.8-max` 行（`model-specs.mjs:56`）
  全套精确 spec（1M / 131072 / thinking / partialMode / multimodal / effort[xhigh,medium,low]）——**非** DEFAULT 兜底
  ⇒ 原拒绝与"适配"无关。

**否决权落点（主 agent 已读）**

- ① `src/model-ref.mjs:39-43` `parseModelRef`——**最重**：非成员 → `ok:false`；经 `resolveRuntimeProvider`（`:51-55`）
  返回 `{}` → `providerInvalidReason` 置位 → **一个未登记字符串废掉整个渠道**。
- ② `src/tui/model-picker.mjs:238-241` `selectModel` 切换路径硬 `throw`。
- ③ `src/tui/model-picker.mjs:118-121` fetch 建议行点击即报错（API 已证明渠道有该模型，仍拒）；
  同文件 `:201-207` 把 `models[]` 外者标为 Suggestions 且文案写"选择会被拒"。
- ④ `src/tui/cmd-model.mjs:16-22`（勘察）——`/model <p:m>` 先过 `parseModelRef` 再调 `ctx.selectModel`（双闸）。
- ⑤ `src/tui/model-picker.mjs:131/:135`——L1 渠道行的模型名与 `ctx` 标签按 `firstCandidate(p)`（= `models[0]`）算。

**消费面（`models[]` 现状读者）**

- 已读：`model-ref.mjs:39/71-74` · `config.mjs:33-54`（20 个预设的 `models:[...]` 播种）+ `:30-32` 注 ·
  `model-picker.mjs:162-171`（候选区）/ `:201-206`（fetch 去重按候选集）。
- （勘察，待核）：`config.mjs:285-288`（normalize：非字符串/空串过滤）· `config-migrate.mjs:30-31/38/48/52/58-59` ·
  `session.mjs:322-328`（槽位空 → `models[0]`）· `cmd-config.mjs:275-309`（默认模型菜单只列候选）·
  `subagent-async.mjs:157`（`byName.models?.[0] ?? parent.provider?.model`）· `advisor/run.mjs:337`（`provider.model ?? provider.models?.[0]`）。

**拉取能力（已有一半）**

- `src/provider/core.mjs` `listModels`（`:352` 起，勘察）——`GET {baseURL}/models` + Bearer + 超时；
  **仅 OpenAI 形状**。`claude`（`format:"anthropic"`）需 `x-api-key`/`anthropic-version`，`gemini`（`format:"google"`）
  走 `?key=` 路径——两者用现实现会 401/404 ⇒ 本批须按 format 各实现一份。
- 槽位面（`model-picker.mjs:177` 起 + `:287` 起，前段已读）——已有"拉取即候选、直接可选"的先例可参照。

**固化契约测试**

- `test/model-ref.test.mjs:128`（F-1 候选外拒）+ `:123-141`（AC-1 断言 invalid reason 串）——（勘察，待核）；
  `test/config-merge.test.mjs:131`（同族断言）——（勘察，待核）。**两处契约须随本批反转**。

### 本批需求清单（回读给用户 → 用户确认）

| # | 需求点 | 落地面（初判——全清单以 §2 为准） | 状态 |
|---|---|---|---|
| 1 | 清单来源 provider 化（按 format 实现） | `provider/core.mjs`（listModels 分支）· `model-picker.mjs`（会话面候选区）· `cmd-config.mjs`（默认模型菜单） | 待设计 |
| 2 | `providers[].models[]` 字段删除 | `config.mjs`（预设 20 行 + normalize）· `config-migrate.mjs` · `session.mjs` · `model-ref.mjs` · `model-picker.mjs` · wizard | 待设计 |
| 3 | 渠道默认模型（单值） | `config.mjs` 预设 · `config-migrate.mjs` · `session.mjs` 槽位兜底 · `model-ref.mjs`（`firstCandidate` 退场） | 待设计 |
| 4 | 显式 `provider:model` 放行 | `model-ref.mjs`（`parseModelRef`）· `model-picker.mjs`（`selectModel` + 建议行）· `cmd-model.mjs` | 待设计 |
| 5 | 切换回显 spec 来源（DEFAULT 警示色） | `model-picker.mjs` · `cmd-model.mjs` · `model-specs.mjs`（须暴露"是否命中"判据——现返回共享对象无来源信息） | 待设计 |
| 6 | VSC 端同批对齐 | `thincoder-vscode`：`config-io.mjs` · `panel-messages.mjs` · `config-migrate.mjs` · `wizard.mjs`（勘察定） | 待设计 |

### todo 项（提交 designer 时必须带上）

**= 上表 6 条 + 以下随件项 2 条**：

1. **契约测试反转**：`test/model-ref.test.mjs:128`（F-1 候选外拒）+ `:123-141`（AC-1 reason 串）；
   `test/config-merge.test.mjs:131`（同族断言）——转为"候选外可切换 + 不再标 invalid"的新契约。
2. **文档连带改写**：`SESSION.md:225-232` 硬约束句 · `model-ref.mjs` 头注 + `firstCandidate` 注释 ·
   `PROVIDER.md` §9/§11 · `_archive/MODEL-MERGE-SESSION.md` 取代关系一行注记（不重写归档正文）·
   代码内 F-1/F-7 注释引用清理。

### 过程留痕

- **范围升格的触发点**：用户一句"模型应该从 provider 拉"——本批判定为**结构纠偏**（不是补丁）。
- **主 agent 推荐被否一次**：Q1「保留字段、降语义」→ 用户"不留"。已采纳，记录在案。
- **事实核对方式**：`specForModel('qwen3.8-max-0902')` 本会话**实跑**（非引述 TODO 条目），确认前缀命中非 DEFAULT；
  三处闸门 + 预设表 + `model-ref.mjs` 全文逐行读码核准。
- **批次编号**：沿用连续制（第 1 批 ENGINEERING-MODE / 第 2 批 ENG-DESIGNER / **本批 = 第 3 批**）。

### 状态

**已收口 2026-09-10**（用户"确认"6 条裁定 + 读法确认 + 单值默认保留）。下一步 = **设计**
（spawn eng-designer；设计落 `../design/PROVIDER.md`）。

### 追加裁定（同日后续——**取代上文相应读法**；原文保留 = 决策留痕，不删不改）

§1 收口后、设计进行中用户追加的五条裁定。**上文与本清单冲突处，一律以本清单为准**（冲突点：批次范围 ③ 面末段「端点不支持列表时的最后手段」· 谈成什么 #5「渠道照常可用，模型名手输 `p:m`」· #7「必须先手输模型名才能开始对话」）：

| # | 时间 | 裁定 | 取代 / 影响 |
|---|---|---|---|
| 1 | 21:47 | **不加 UI 手输行**（用户原话："模型名不要手输，那个是过度设计"）——`/model` L2 与 `/config → 默认模型` L2 **两处都不加**；失败文案不含任何"手输 / 改 config / 绕过"指引 | 取代 #5、#7 中**把"手输"当 UI 出口**的读法（命令面不受影响） |
| 2 | 21:50 | **渠道准入 = 必须支持 `/models`**——不支持 / 拉不到的渠道 = **不可用渠道**，不为其新建任何绕过路径 | **翻转** #5「渠道照常可用」读法；批次范围 ③ 面末段作废 |
| 3 | 21:51 | O2/O3/O4 照准：VSC 回显**本批不加** · `TODO.md` 状态**保持 `待设计`** · VSC 仓设计档**父侧收口后同步** | 设计 §16.6 #9 / §16.9 row 6、7 |
| 4 | 21:52 | 准入校验落**配置阶段**（加渠道 / 设 key / 设默认模型时探一次 `/models`；探不通 → 标「不可用」+ 不入默认模型可选来源 + **不阻断保存**）；**运行期不加闸**（启动 / 请求零探测） | **新增需求 R9 + 机制 M9**；"命令面是否受准入约束"= **结案：不受** |
| 5 | 21:52（承 #2） | 边界澄清：命令面 `/model provider:model` 放行语义**不变**（R4）——被否的只是「在 UI 里新造一个手输入口」 | 设计 §16.6 #11 / #13 |

**失败文案终态**：`该渠道不提供模型列表（GET /models {状态}）——无法选择模型，请改用其他渠道`（无绕过指引）。

**主 agent 核验记录（2026-09-10 22:00——设计交付 / 修正轮后）**：

- 三方编号机器核对：**R1–R9**（§0.2 ↔ 本节 §2 ↔ `PROVIDER.md` §17.2）· **AC-1..AC-9** · **T1–T25** 全对齐，无"只出现两处"；
- 全文零「待用户裁定」残留；§17.1 回显类用例端列仅 CLI（O2 未扩范围）；
- 受影响文件行数：**32 处抽查全对**（CLI 26 + VSC 6）；新增文件 3 个（双端 `provider/list-models.mjs`、`tui/model-catalog.mjs`）实测均不存在；
- 读者面穷尽性由主 agent 独立 grep 复核（CLI + VSC 全在清单内）；
- `check-doc-width`：新增 V1/V2 违规 0；宽度无新增超宽行（存量 7 行与本批无关）；designer 仅改 docs（git status 证实零代码改动）；
- **修正轮结果**：F1–F4 全中 + 5 条追加裁定全中（F3 白名单与主 agent 示例不同处经自检论证成立——`consult.mjs`/`cmd-advisor.mjs` 为运行期容器，非配置字段）。

**当前状态**：设计已定稿、**待用户发起设计评审**（发起权在用户）。

---

## §2 批次任务（eng-designer 自写）

> 本节 = **eng-coder 任务书本体**（spawn 只传本节路径 + 凭证参数，不另写副本）。
> 依据：本批需求见 §1（用户已收口）；设计档 `../design/PROVIDER.md` §0（需求层）/ §16（设计）/ §17（测试层）。
> 开工前必须先读：`../design/PROVIDER.md` §16 全文 + §17.1 用例表；实现与设计冲突时**停下报告**，不静默适应。

### 本批覆盖的需求条目

- **R1 清单来源 provider 化**：清单在运行期从 provider 拉取（`GET /models`），按 `format` 各实现一份（openai / anthropic / google），
  成为各选择面候选来源（`/model`、`/config 默认模型`、VSC 面板）；拉不到列表 = 该渠道**不可选**（准入要求：渠道必须支持 `GET /models`——不列候选、无静态兜底、无手输绕过）。
  落地面：新 `src/provider/list-models.mjs`（双端）· 新 `src/tui/model-catalog.mjs` · `model-picker.mjs` · `cmd-config.mjs` · VSC `settings.mjs` · `webview/settings-providers.js`
- **R2 `providers[].models[]` 整字段删除**：预设 / 迁移 / 会话槽位兜底 / picker 候选区 / `/config` 默认模型菜单 / wizard 播种全部不再读写。
  落地面：`config.mjs` · `config-migrate.mjs` · `model-ref.mjs` · `session.mjs` · `model-picker.mjs` · `wizard.mjs` · `setup-wizard.mjs` · VSC 同族
- **R3 渠道默认模型（单值 `providers[].model`）**：承担新装启动种子 / 会话槽位空兜底。
  落地面：`config.mjs`（预设 20 条）· `config-migrate.mjs` · `session.mjs` · 显示回退（`model-picker.mjs`）· `advisor/run.mjs` · `subagent-async.mjs` · VSC `config-io.mjs` 等
- **R4 显式 `provider:model` 放行**：仅【空值 / 裸值（无冒号）/ 未知 provider】无效；含候选外与多冒号（`a:b:c` → provider=a，model=`b:c`）。
  落地面：`model-ref.mjs`（`parseModelRef` v2——删成员校验）· `model-picker.mjs`（`selectModel` 删 throw）· `cmd-model.mjs`
- **R5 切换回显 spec 来源**：切换成功回显一行；`DEFAULT_SPEC` 兜底时警示色 + 经 `/config` 设 `context` 提示。
  落地面：`model-specs.mjs`（新 `specMatch`）· `model-picker.mjs`（`selectModel` 回显）
- **R6 VSC 端同批对齐**：面板候选同源（provider 拉取）+ `resolveDefaultModel` 不再静默回退 `models[0]`（改「复合属本渠道 → 渠道默认单值 → null」）。
  落地面：VSC `config-io.mjs` · `extension/settings.mjs` · `webview/settings-providers.js`
- **R7 契约测试反转**（随件）：三族测试转新契约。
  落地面：`test/model-ref.test.mjs` · `test/config-merge.test.mjs` · `test/provider-model-guard.test.mjs`（双端）+ 新 `test/list-models.test.mjs`
- **R8 文档连带改写**（随件——**代码注释与文案部分**）：`model-ref.mjs` 头注与注释、代码内 F-1/F-7 引用、`provider/errors.mjs` 与 VSC `openai.mjs` guard 文案、`bin/thincoder.mjs` 帮助文案、各文件头注/注释内 `models[]` 现行语义表述。
  落地面：见设计档 §16.5 清单（设计文档正文已由 eng-designer 改毕；coder 不改设计文档）
- **R9 渠道准入校验（配置阶段）**：加渠道 / 设 API key / 设默认模型时探一次 `GET /models`（复用 M1）；探通 → 渠道可用、候选直接可用；探不通 → 标「不可用」+ 明示原因、不入默认模型可选来源、**不阻断保存**；**运行期不加闸**（命令面 R4 不变、启动/请求零探测）。
  落地面：CLI `cmd-config.mjs` · `tui/wizard.mjs` · `cli/setup-wizard.mjs` · VSC `provider-flows.mjs` · `settings.mjs` · `settings-panel-write.mjs` · `webview/settings-providers.js`（复用 `provider/list-models.mjs`——双端）

### 明确不在本批的条目

- **MODEL_SPECS 前缀匹配的无条件继承隐患**（`qwen3.8-flash` 蹭泛前缀 `qwen` 一类；差异快照静默蹭 spec）——另登记独立待办（用户 2026-09-10 同意），**本批不碰**。
- **候选外二次确认 / `--force` 类白名单后门**——用户否决，不做。
- **UI 手输行 / 模型名输入控件**——O1 已裁（用户 2026-09-10：模型名不要手输——过度设计）；命令面 `/model provider:model` 仍放行任意串（R4 不变，那是既有能力）——被否的只是「在 UI 里新造一个手输入口」。
- **渠道准入绕过路径**——不做：`/models` 不可用的渠道 = 不可用（不列候选、不可选、无静态兜底、无手输绕过）；失败文案只明示原因 + 指引换渠道（用户 2026-09-10 裁定）。
- **运行期加闸 / 命令面加闸**——不做：准入校验落配置阶段（M9）；命令面 `/model provider:model` 放行语义不变（R4）；启动 / 请求零探测（N2）。
- **`defaultModel` 的 F-5/F-6 语义**（新会话起点 + 未设显式引导）——不改。
- **子代理 / advisor 模型覆盖语义**（自由串 / 裸渠道名 / `default` 别名）——红线零改；仅改其 `models[0]` 兜底取值。
- **VSC 面板 spec 来源回显**——本批不做（O2 已裁——用户 2026-09-10；见 §16.7）。
- **VSC 仓文档更新**（`thincoder-vscode/docs/design/PROVIDER.md`）——父侧收口后执行（用户 2026-09-10 裁定 O4），不在 coder 交付物。
- **拉取结果持久化缓存 / 双端同步依赖 / 逐字硬一致**——不做。

### 受影响文件（带当前行数 + 预计增量）

> 行数 = 2026-09-10 快照；**详细改动要点与 over-tier 拆分计划见 `../design/PROVIDER.md` §16.5**（单一权威源，本节不重述）。
> 双端分列。**CLI 文档（PROVIDER.md / SESSION.md）已由 eng-designer 改毕——coder 不改设计文档**。

**CLI 源（23 文件，其中新增 2）**：

| 文件 | 行数 | 增量 | 文件 | 行数 | 增量 |
|---|---|---|---|---|---|
| `src/config.mjs` | 484 | ±0 | `src/tui/model-picker.mjs` | 490 | −35 |
| `src/config-migrate.mjs` | 68 | +20 | `src/tui/model-catalog.mjs` | 新增 | ~85 |
| `src/model-ref.mjs` | 75 | −15 | `src/tui/cmd-config.mjs` | 447 | +25 |
| `src/model-specs.mjs` | 146 | +18 | `src/tui/cmd-model.mjs` | 24 | ±0 |
| `src/session.mjs` | 476 | ±0 | `src/tui/cmd-advisor.mjs` | 255 | ±0（核查） |
| `src/provider/core.mjs` | 498 | −20 | `src/tui/wizard.mjs` | 217 | +5 |
| `src/provider/list-models.mjs` | 新增 | ~95 | `src/tui/pickers.mjs` | 106 | ±0（注释） |
| `src/provider/index.mjs` | 7 | ±0 | `src/tui/index.mjs` | 450 | ±0（核查） |
| `src/provider/errors.mjs` | 102 | ±0 | `src/tui/cmd-submodel.mjs` | 155 | ±0（核查） |
| `src/advisor/run.mjs` | 488 | ±0 | `bin/thincoder.mjs` | 406 | ±0 |
| `src/agent-tools/subagent-async.mjs` | 473 | ±0 | | | |
| `src/cli/setup-wizard.mjs` | 80 | +10 | `src/cli/make-agent.mjs` | 163 | ±0（注释） |

**CLI 测试（7 文件，其中新增 2）**：`test/list-models.test.mjs`（新增 ~130）· `test/provider-admission.test.mjs`（新增 ~110）· `test/model-ref.test.mjs`（170→~190 重写）·
  `test/config-merge.test.mjs`（151→~160 重写）· `test/provider-model-guard.test.mjs`（132→~140）· `test/consult-models-softfail.test.mjs`（98，核查）· `test/advisor-provider.test.mjs`（72，核查）。

**VSC 源（18 文件，其中新增 1）**：

- `src/config-presets.mjs`(41) · `src/config-migrate.mjs`(161,+25) · `src/config-io.mjs`(438,±5) · `src/provider.mjs`(456,−15) · `src/provider/list-models.mjs`（新增 ~95）· `src/provider/transports/openai.mjs`(±0 文案)
- `src/advisor/provider.mjs`(39) · `src/agent-tools/subagent.mjs`(358) · `src/extension/settings.mjs`(332,+20) · `src/extension/provider-flows.mjs`(193,+15) · `src/extension/settings-panel-write.mjs`(134,+10) · `src/extension/vision-channel.mjs`(23,+5)
- `src/extension/panel-chat.mjs`(499,核查) · `src/extension/turn-model.mjs`(28,核查) · `src/extension/presets.mjs` / `panel-messages.mjs`(454) / `panel-session.mjs`(333)（头注/注释）· `webview/settings-providers.js`(264,+20)

**VSC 测试（10 文件）**：`test/config-merge.test.mjs`(126 重写) · `test/provider-admission.test.mjs`（新增）· `test/provider-model-guard.test.mjs`(149 改) · `test/image-downgrade.test.mjs`(120 改) ·
  `config-io-panel`(101) / `config-softfail`(114) / `settings-panel`(87) / `chat-panel`(621)（核查） · `test/files.mjs` + `smoke-provider.mjs`（注册表/smoke 核查）。

### 验收标准（逐条回指需求）

> 与 `../design/PROVIDER.md` §17.2 一致（AC-1..AC-9）；机器验证命令照写。

| AC | 回指 | 验证（机器可判） |
|---|---|---|
| AC-1 | R1 | `node --test test/list-models.test.mjs` 全绿（三 format 分派：URL/请求头/响应解析/失败态）；拉取失败 = 该渠道不可选 + 明示原因（T5/T20）；picker 候选行来自拉取的 mock 断言；VSC 静态候选来源清除：`cd thincoder-vscode && grep -rn "configCandidates" src/` → 空（标识符只在 VSC 仓——现状 `settings.mjs:301-317` 命中；CLI 仓无此名） |
| AC-2 | R2 | `node --test test/config-merge.test.mjs` 全绿（迁移后磁盘无 `models` 键）；配置字段读写零残留：`cd thincoder && grep -rn --exclude=config-migrate.mjs --exclude=consult.mjs --exclude=cmd-advisor.mjs --exclude=model-catalog.mjs --exclude=list-models.mjs "\.models" src/` → 空 |
| AC-3 | R3 | 预设 20 条单值断言；槽位/克隆兜底断言绿（provider-model-guard） |
| AC-4 | R4 | `node --test test/model-ref.test.mjs` 表驱动全绿（放行：候选外/多冒号；无效：三类） |
| AC-5 | R5 | 回显断言——正常与 DEFAULT 两分支（警示色分支 + `/config` 提示文案） |
| AC-6 | R6 | VSC `resolveDefaultModel` 新回退链断言；`fullStatus` 拉取失败 = 渠道不可选断言（明示原因；无 fallback 候选） |
| AC-7 | R7 | 双端 `npm test` 全绿（三道契约测试族 + 新增面） |
| AC-8 | R8 | `cd thincoder && grep -rn "候选硬约束\|候选外拒" docs/design/ src/ bin/ --exclude=PROVIDER.md --exclude-dir=_archive` → 空（排除：`PROVIDER.md`=叙述承载 · `_archive/`=冻结归档）；目标态自检（排除后当前码非空 → 目标空；细则见 `PROVIDER.md` §17.2 AC-8）；`_archive/MODEL-MERGE-SESSION.md` 字节不变（SHA 比对） |
| AC-9 | R9 | 配置阶段准入探两态断言（探通可用 / 探不通标不可用 + 不入可选来源 + 条目仍可保存）；运行期不探测断言（启动 / 请求零 `/models`）——T23/T24/T25 |

### 任务书就绪（本节即任务书——spawn 传路径，不另写副本）

- **交付物**：双端代码 + 测试改动（工作区未提交）；本文档 §5 自写实施记录（交付摘要 / 透明表 / 轮次 / 终态）。
- **凭证**：designId + designToken 经 spawn 参数传递（**绝不进任务文本、绝不落文档**）。
- **建议 spawn 面**：本批跨双仓——建议按仓拆两个 eng-coder（CLI / VSC 各一，files 域不重叠）或单 coder 顺序实施；由主 agent 定。
- **实现提示（勘察已核，供免重复勘察）**：三 format 的端点规范与响应形状见 §16.2 M1（已核）；VSC webview 直读 config 字段的四处（§16.10 #2）与 custom 空条目判据（#3）易漏；`setup-wizard.mjs:43` 既存 bug 本批自动对上（#4）；M9 准入探复用 `provider/list-models.mjs`（双端）——VSC 既有 `testProviderConnection`（`settings.mjs:155`）为现成探针先例。
- **边界重申**：撞设计缺口 → 停下报告；超范围改动 → 逐项报告；不编辑设计文档。


### 评审修正轮（2026-09-11——13 条采纳项落档）

> 依据：§3 轮次 1 评审（🟡×6 + 🔵×7——VERDICT: pass）经主 agent 裁决**全部采纳**；本轮 = 设计档修正（docs FIRST——同一 designId 链内，不重新发起评审）。
> 落点全部在 `../design/PROVIDER.md`；本小节声明对 §2 上文的修正——**上表与本小节不一致处，以本小节 + PROVIDER.md §17.2 为准**。

**逐条落点（编号 = §3 评审发现编号）**：

| # | 落点（PROVIDER.md 节） | 内容 |
|---|---|---|
| 1 | §16.2 M1 · T2/T3 · §17.2 AC-1 | 完整 URL 钉死（claude `…/v1/models`、gemini `…/v1beta/models`——与 chat 同基）；T2/T3 增完整 URL 断言；mock-only 残余风险 + 上机验证动作记录 |
| 2 | §16.2 M1（表 + 翻页 bullet）· T26/T27 | 跟随翻页（cursor loop，≤10 页上限；任一分页失败整体抛出）——否决「接受单页截断」；规范依据补 `has_more` / `nextPageToken` |
| 3 | §16.2 M3④ · §16.5（CLI/VSC advisor 行）· §16.8 · T28 | advisor 兜底对齐 subagent：`provider.model ?? agent.provider?.model`（父兜底）；空值语义句（极端缺失 → chat 前 guard fail-fast）；§16.8「红线零改」措辞精确化 |
| 4 | §17.2 AC-8 | 显式排除集：`--exclude=PROVIDER.md --exclude-dir=_archive`；目标态自检（排除后当前码非空 → 目标空）；归档 SHA 检查保留 |
| 5 | §16.5（VSC 源表 + VSC 测试表） | 行数补齐：openai.mjs 308 · presets 85 / panel-messages 454 / panel-session 333 · files 41 · smoke-provider 65；smoke-provider 增量「核查」→「改」 |
| 6 | R9 · §16.2 M8/M9 · §16.7 · T24 · AC-9 | 文案分工钉死：消息本体 = 逐字长句 `…——无法选择模型，请改用其他渠道`；状态标签 = `不可用`（唯一逐字断言对象） |
| 7 | §16.3（model-catalog 行）· T6 | 缓存时钟可注入（先例 `rate.mjs` `_rateHooks`；本函数钩子 `_catalogHooks`）——T6 假时钟确定性断言 |
| 8 | §16.2 M1 · §16.6 #14 | 决策：候选不过滤非对话模型（embedding 等）——理由与否决备选入决策表 |
| 9 | N2 · §16.2 M9 边界 · T25 | 零探测边界定义：探测只允许发生在配置写入面；首启向导加渠道 = 配置流内动作（不受限）；非配置流启动零探测 |
| 10 | §16.2 M3① · §16.5 turn-model.mjs 行 | VSC 对位核验：等价回落**已有**（`runModel = modelOverride \|\| slotModel \|\| baseModel`——槽空经 `baseModel`=`resolveDefaultModel` 新回退链）；注释同步项列入 |
| 11 | §16.2 M1 超时行 · §16.4 a1 | 超时统一 15s（核实现：`core.mjs` listModels 整体 / header / body idle 均 15s）；a1「≤10s」→「≤15s」 |
| 12 | §16.5 CLI 文档行 | 长度注记改 as-of 快照（PROVIDER.md ≈800 行 / SESSION.md ≈536 行——2026-09-11 实测） |
| 13 | §16.5 over-tier 说明 | 拆分阈值对齐 500 硬限；`model-picker.mjs` 估算 455 行——**455 可接受、本批不拆**（主 agent 裁决） |

**对 §2 上文的修正与编号同步声明**：

- **AC-8 行已于 2026-09-11 就地修正**（上表 AC-8 行即最终文本；原「AC-8 文本替换」覆盖注记作废）。
- **AC-8 目标态自检（2026-09-11 修正轮重跑；本机 cmd 无 grep——经 Git usr/bin/grep，正则与排除集未变）**：`SESSION.md:230` 已按 §17.2 既定措辞改以「候选成员校验」表达（字面量消除、语义不变）；排除后命中集 = `src/tui/model-picker.mjs` 5 处 + `src/tui/cmd-model.mjs` 1 处旧注释（设计文档面已清零）；src 注释随实施清零，实施后本命令为空。
- **AC-1 / AC-3 / AC-9 增补**（与 §17.2 对齐）：AC-1 += 翻页合并（T26/T27）+ 上机验证动作；AC-3 += 克隆空值语义（T28）；AC-9 += 失败消息逐字长句 + 行内标 `不可用`。
- **T 编号新增 T26–T28**（§17.1 表尾；引用点：AC-1 / AC-3 / §16.5 三行）——R 编号（R1–R9）与 AC 编号（AC-1–AC-9）总数不变；三方编号（§0.2 ↔ 本节上文 ↔ §17.2）已逐项核对一致。
- **受影响文件行数呈现**与 §16.5 对齐（VSC openai.mjs 308 · presets 85 / panel-messages 454 / panel-session 333 · test/files 41 · smoke-provider 65）。
- `model-picker.mjs` 拆分：主 agent 裁决**本批不拆**（触发阈值对齐 500 硬限；估算 455 行可接受）。

**格式债披露**（`node scripts/check-doc-width.mjs` 实测——2026-09-11）：

- 本档 §3 轮次 1 发现表第 1 条 / 第 5 条两行为 >300 字符长行（评审子代理笔迹——超本任务写域；建议父侧收口时压缩）。
- 全仓其余 >300 字符行 7 处为存量（AGENT-LOOP ×3 / SESSION ×1 / SUBAGENT-ID-COUNTER-AGENT ×1 / TUI ×2——与本批无关）。
- PROVIDER.md 本次编辑后：超宽行 **0**；一致性检查新增违规 **0**（存量 23 条在基线内）——新增 V1/V2/V3 违规与新增超宽行均为零。

## §3 设计评审（评审子代理自写）

> 待写（过渡期注：advisor 自写机制未落地前由父侧代写）。

### 轮次 1（评审子代理）

> 评审对象：`docs/design/PROVIDER.md` §0/§16/§17 + `docs/design/SESSION.md` §8 + 本档 §2（第 3 批 MODEL-SELECTION——设计评审，2026-09-11）。发现表：

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Feasibility / Clarity | 🟡 | M1 把 anthropic 拉取记为 `GET {baseURL}/models`（PROVIDER.md:462），但未说明 claude 预设的 baseURL 是否含版本段（同档 §8:174 把聊天路径写作 `POST /v1/messages`；Anthropic List Models 位于 `/v1/models`）。**…余文与建议逐字见下「§3-补 1」** | **（见下「§3-补 1」）** |
| 2 | Feasibility / Defensiveness | 🟡 | 翻页防御不足：anthropic 行「分页 `limit` 传大值取全量」（:462）忽略 has_more——端点若对 limit 有上限即静默截断；google 行未处理设计自己在规范依据中引用的 `nextPageToken`（:468）。截断 =「清单权威」静默失全，mock 用例不覆盖翻页。 | 二选一落进 M1/T 表：跟随翻页（token/上限内 loop），或显式记录「接受单页截断」的取舍与理由 |
| 3 | Requirements / Feasibility | 🟡 | M3④ 把 advisor 克隆兜底链整段删至 `provider.model`（:484）——渠道无默认模型（M3「空值合法」、M7 空结果合法）时取值 undefined 的下游行为未写；subagent 侧显式保留父兜底（:485），advisor 侧没有；§16.8:707「红线零改」与「兜底值被删」存在措辞张力；该路径无用例（:622 仅「核查」）。 | 补一句空值语义（或对齐 subagent 的父兜底），并给该调用点一条测试断言 |
| 4 | Acceptance criteria | 🟡 | AC-8 的机器检查按字面不可能返回空——被搜字面量出现在 AC-8 自己行（:779）、R8 行（:34）、§16.1（:444）、§16.4 表头（:490）与 SESSION.md:230（变更叙述）；两处版本排除集不一致（:779「§16 本文叙述除外」vs 批次档 :259 仅「_archive/ 除外」）。 | 按 AC-2 白名单范式给出显式排除/收窄 pattern，两处 AC 文本对齐；保留归档 SHA 检查 |
| 5 | File-size annotations | 🟡 | §16.5 部分将改动的源/测试文件缺「当前行数」（「—」）：VSC `transports/openai.mjs`（:635）。**…余文与建议逐字见下「§3-补 5」** | **（见下「§3-补 5」）** |
| 6 | Document consistency | 🟡 | 准入失败文案两版本并存：R9（:35）/M9（:535）引 `…——不可用`；M8（:527）/§16.7（:693）/批次档「失败文案终态」（:156）为 `…——无法选择模型，请改用其他渠道`；T24（:762）只断言「标『不可用』」。测试将锁定的逐字文案不唯一。 | 以批次档终态为准统一长句（或明写「——不可用」=状态标签、长句=消息本体），使 T24/AC-9 有唯一逐字断言对象 |
| 7 | Tests / Determinism | 🔵 | T6（:744）缓存 TTL 未给确定性测试缝——按壁钟/睡眠写即脆弱测试。 | 预制可注入时钟/钩子（先例 rate.mjs `_rateHooks`），在 §16.3 helper 契约点明 |
| 8 | Content / Defensiveness | 🔵 | 拉取候选将包含非对话模型（Gemini embedding 类等）——设计未过滤也未记录该取舍。 | 一句话记录「不过滤」决策（或按能力字段过滤，如 google `supportedGenerationMethods`） |
| 9 | N2 一致性 | 🔵 | 「运行期零探测」边界未写死：M9 落点含「首启加渠道探 `/models`」（:599），而 T25 断言「会话启动 / 发请求 → 无 `/models` 调用」——首启即启动路径，测试口径需显式排除「配置流内探测」。 | 在 M9/N2 交界写边界定义（探测只允许发生在配置写入面，与发生在进程早期无关），T25 场景表述同步 |
| 10 | Double-end parity | 🔵 | CLI M3① 槽位兜底（`activeModel` 空 → `slotProvider.model`，:482）在 §16.5 VSC 列中无对位改动/核验项——若 VSC 恢复路径对同形态槽无等价回落，N4「语义同源」在两端行为上出现缺口。 | 核验 VSC 对位语义并如实落档（有则标「已有」、无则列入） |
| 11 | Numeric drift | 🔵 | 拉取超时数字两处不一致——M1「header/body idle 15s」（:466）vs §16.4 a1「≤10s 超时」（:558）。 | 统一为一个数字并确认与既有实现一致 |
| 12 | Numeric drift / docs | 🔵 | 文档长度注记过时——:624「440→约 770 行」（现约 800 行，末内容行 :800）、「SESSION.md（527 行）」（现约 536 行）；.md 豁免行数硬纪律，仅影响准确性。正面核对：§16.5 与批次档 §2 的源/测试行数逐项一致，按估算无文件越过 500 硬限（最大 499/±0）。 | 刷新注记或改标 as-of 快照 |
| 13 | Clarity / Scope | 🔵 | 「:582 `model-picker.mjs` 若超 450，拆分计划=…」的触发条件按设计自己估算已命中（490−35=455 > 450），但拆分写成条件式且批次档 §2 不携带该拆分——实施时既可能多做一次重构、也可能不做而「违反」设计自设阈值。 | 二选一写死：声明本批拆（并入交付报告），或把触发阈值对齐项目硬限（>500）并说明 455 可接受 |

**§3-补 1 / §3-补 5**（父侧格式整备——表内第 1、5 条余文；**原文文字逐字保留**，仅插入换行与定位标签；2026-09-11）

> **§3-补 1 余文（发现 1）**：两种组合必有一种是 404；T2 只断言请求头、契约 mock-only（真机未验），自洽的错误组合会保持全绿
> ——且在 M8 准入判据下会把该渠道整体判为不可用。baseURL 实际形态在本评审范围不可核（unverified）。
>
> **§3-补 1 建议（发现 1）**：在 M1 行内钉死组合后的完整 URL（或明写 baseURL 形态），T2/T3 增加完整 URL 断言；
> 两个新分支安排一次真机一发验证，或显式记录 mock-only 残余风险。
>
> **§3-补 5 余文（发现 5）**：`presets.mjs`/`panel-messages.mjs`/`panel-session.mjs`（:644——批次档 :241 反而带 454/333）、
> `test/files.mjs`（:663）、`test/smoke-provider.mjs`（:664，箭头明示要改而增量仅「核查」）。
>
> **§3-补 5 建议（发现 5）**：补齐行数+增量（或统一「structure unchanged」）；消除 §16.5 与批次档 :241 的呈现差异（权威源处应更全）。

计数：🔴×0 · 🟡×6 · 🔵×7（共 13 项）
VERDICT: pass

## §4 用户批准（主 agent 记）

**2026-09-11 00:33 用户批准**（原话："批准"）——解锁实现。前置条件全绿：

- 设计评审 **pass**（0🔴 · 6🟡 · 7🔵——发现表见 §3）；
- 13 条评审采纳项**已全部落档**并经主 agent 核验（独立复核：URL 钉死 vs `src/config.mjs` 预设 = 正确；
  VSC 6 处行数实测 = 全中；三方编号 R1–R9 / AC-1..AC-9 / T1–T28 对齐）；
- 评审后收尾轮（**文档可达性修正**——AC-8 字面量冲突 + §2 该 AC 双版本合一）在途，**属文档整备、非设计变更**，
  不影响本批准范围；
- §3 表内两条超宽行由父侧格式整备（原文逐字保留，见 §3-补；内容零改）。

**批准范围**：`docs/design/PROVIDER.md` §0/§16/§17 定稿 + `docs/design/SESSION.md` §8 连带改写 +
§2 任务书所载 **CLI / VSC 双端**实现。

**不含**：VSC 仓设计档同步（O4——父侧收口后执行）· `docs/TODO.md` 状态推进（本批准后翻「在途」）。

**下一节点**：eng-coder ×2 并行（CLI 面 / VSC 面）。

## §5 实施记录（eng-coder 自写）

> 待写。

### VSC 面（eng-coder 自写 · 2026-09-11）

**交付摘要**

- 范围：MODEL-SELECTION 第 3 批 **VSC 端**（`thincoder-vscode/`）——R1–R9 的 VSC 面 + 测试层；交付 = 工作区未提交（未 commit）。
- 新增 2 文件：`src/provider/list-models.mjs`（163 行——三 format 分派 + 翻页 ≤10 页 + 15s 超时 + 失败抛出带 status + M9 渠道准入探针/展示态）· `test/provider-admission.test.mjs`（267 行——T1–T4/T23–T27 本端用例）。
- 改动源 16 / webview 2 / 测试 9：`config-presets.mjs`(41) · `config-migrate.mjs`(186, 迁移 v2) · `config-io.mjs`(455, 单值归一 + resolveDefaultModel 新链 + probeTargetFromEntry) · `provider.mjs`(433, listModels 迁出 + re-export) · `provider/transports/openai.mjs`(309, guard 文案) · `advisor/provider.mjs`(40) · `agent-tools/subagent.mjs`(381) · `extension/settings.mjs`(352, status 单值 + fullStatus 拉取 + M9) · `extension/provider-flows.mjs`(221, M9 探 + 单值播种) · `extension/settings-panel-write.mjs`(154, defaultModel 写面探) · `extension/vision-channel.mjs`(24) · `extension/panel-messages.mjs`(455, selectModel 注释 + addProvider M9 接线 + testProvider format 透传) · `extension/panel-chat.mjs` / `turn-model.mjs` / `presets.mjs`（注释同步） · `webview/settings-providers.js`(270, 四处配置直读改运行期载荷 + 不可用标注) · `webview/settings.css`(+15, 标注样式——超 §16.5 清单，已披露)。
- 测试：`cd thincoder-vscode && npm test` → **353 tests / 352 pass / 1 skipped（既有 slow 归册）/ 0 fail**，exit 0；日志 `_t-modelselect-vsc.log`（工作区根，实现期产物）。AC-1 VSC 侧机器判据：`grep -rn "configCandidates" src/` → 空。
- 轮次与终态：explore 差异审计 1 轮（0🔴/1🟡/5🔵——🟡 已修）→ 内部 advisor 代码评审 1 轮（**VERDICT: pass**，0🔴/2🟡/3🔵）→ 复核全绿 → **clean**。

**逐需求透明表（VSC 面，逐条对 R1–R9）**

| 需求 | 状态 | VSC 落点与说明 |
|---|---|---|
| R1 清单来源 provider 化 | **Done** | 新 `provider/list-models.mjs`：openai（缺省/未知）/anthropic（`?limit=1000` + x-api-key/anthropic-version）/google（`?key=…&pageSize=1000` + 剥 `models/` 前缀）；翻页 `has_more→after_id` / `nextPageToken→pageToken`（≤10 页，任一分页失败整体抛）；失败抛出（调用方降级）。候选面 = `settings.mjs fullStatus` 单源拉取（无静态兜底）；`webview/settings-providers.js` 默认模型菜单改运行期载荷；`testProviderConnection` 带动 `format` 三格式分派。 |
| R2 `providers[].models[]` 整字段删除 | **Done** | 预设 20 条单值；迁移 v2 `delete p.models`；`resolveProviders` 单值归一（非字符串/空串删）；`saveCustomProvider`/`deleteProviderKey` custom 判据改 `entry.model`；`openai.mjs` guard 文案不再称 `models[]`。 |
| R3 渠道默认模型（单值） | **Done** | 预设 20 条各携 `model`（T13 锁定）；`resolveDefaultModel` 第二级 = 渠道单值；advisor `provider.model ?? agent._provider?.model`；subagent `byName.model ?? parent._provider?.model`（T28 父兜底锁定）；槽位空兜底链（`runModel = modelOverride \|\| slotModel \|\| baseModel`）经核验**已有**，仅注释同步。 |
| R4 显式 `provider:model` 放行 | **Done（本端无闸）** | VSC 侧不存在成员校验路径（命令面属 CLI）；`selectModel` 消息 = 会话槽写（无候选校验）；注释同步（显式 p:m 一律放行）。 |
| R5 切换回显 spec 来源 | **N/A（设计明示不加）** | O2 已裁：回显仅 CLI 面（§16.7——不扩范围）；VSC 未实现。 |
| R6 VSC 同批对齐 | **Done** | `resolveDefaultModel` 新回退链（复合属本渠道 → 渠道默认单值 → null，不再 `models[0]`）；`fullStatus` 失败 = 该渠道不可选（无候选行、无 fallback）+ `unavailable[{provider,reason}]` 随载荷；webview 四处 config 直读（presets 行 / 默认模型菜单 / 渠道行 / custom）改运行期载荷与单值。 |
| R7 契约测试反转 | **Done（本端）** | `config-merge.test.mjs` 重写（迁移 A/B + 预设单值 + 回退链）· `provider-model-guard.test.mjs` 改（F-1 新文案 + 单值兜底 + T28）· `image-downgrade.test.mjs` 改（视觉判据 + 旧字段不读）· `provider-admission.test.mjs` 新增；`files.mjs` 登记。 |
| R8 文档连带改写（代码注释面） | **Done（本端）** | 头注/注释：config-io / config-migrate / config-presets / presets / provider-flows / panel-messages / panel-chat / turn-model / vision-channel / list-models / openai.mjs。 |
| R9 渠道准入（配置阶段） | **Done** | 探针落点 6 处：`addProviderFlow` · `setKeyFlow` · `saveProviderKey` · `saveCustomProvider`(有 key) · panel `addProvider` case · `defaultModel` 写面（fire-and-forget）；探不通 → 标 `不可用`（行内）+ 失败消息逐字长句 + 不入默认模型可选来源 + **不阻断保存**；失败不缓存（重探）；运行期零**新增**探测点（fullStatus 拉取 = R6 候选面既有机制，非 M9）。 |
| N1–N4 | **Done** | N1 迁移不丢凭据（测试锁）；N2 拉取 15s 超时/异步、零启动期新增依赖；N3 失败不缓存/成功结果即权威；N4 独立实现、零双端 import、差异如实落档（回显仅 CLI）。 |

**决策透明表（实现取舍与披露项）**

| # | 事项 | 取舍 | 理由 / 披露 |
|---|---|---|---|
| 1 | 准入展示态与探针宿主 | 新增于 `provider/list-models.mjs`（`_admission` + `probeChannelModels` / `recordAdmission` / `admissionOf` + `_setProbeImplForTest` 测试缝） | 设计未钉宿主；该模块为依赖叶（settings / provider-flows / settings-panel-write 均可引，零环），M9 明示「复用 M1」 |
| 2 | `defaultModel` 写面探针形态 | fire-and-forget（`settings-panel-write.mjs`） | 写面为**同步契约**（调用方不 await）；探针全捕获、绝不 reject、不阻断写——结果入展示态 |
| 3 | 加渠道探针落点 | `panel-messages` addProvider case + `addProviderFlow`（非 `addProviderEntry` 内部） | 保持纯持久化函数零副作用；两 UI 路径各探一次、可 await、失败可提示 |
| 4 | `testProviderConnection` 增 `format` 参数 | settings.mjs + `webview/settings-providers.js` + panel-messages 三处接线 | M1 三格式分派对自定义渠道表单是**必需**：否则 anthropic/google 渠道表单探针走 openai 形状 → 拉不到候选 → 无法保存（审计 🟡#1 即此处漏接线，已修 + T23b 锁定） |
| 5 | 新增 `webview/settings.css` 两条类 | `.prov-unavailable` / `.prov-hint` | **超 §16.5 文件清单**（该文件未列）——为 M9 行内标注的样式承载；如实披露，父侧收口时补表 |
| 6 | VSC `listModels` 内部 `.sort()` | 保留本端排序（文件头已注明） | 设计行文「排序由调用方」；本仓既有行为即内部排序（UI 确定性），双端 N4 允许差异——已披露，未改动 |
| 7 | `models` 载荷新增 `unavailable` 字段 | 失败渠道诊断载荷（原因随载荷下发） | 设计未钉原因承载位置；UI 面失败原因实际经 providerStatus 行渲染（`.prov-hint`），本字段为测试/排障面（T24 断言对象） |
| 8 | custom 渠道无 key 保存不探 | `saveCustomProvider` 仅在写 key 时探 | 无 key 渠道本就不可用（无候选）；已披露为边界豁免 |

**审计与代码评审轮次与终态**

- **explore 差异审计（轮次 1）**：0🔴 / 1🟡 / 5🔵。
  - 🟡（**已修**）：`panel-messages.mjs` 的 `testProvider` case 未透传 `format` → 自定义渠道 anthropic/google 表单探针走 openai 形状（拉不到候选→渠道加不进）——修为 `format: msg.format` + 新增 `T23b` 断言（anthropic 完整 URL/头 + 下拉得到候选）。
  - 5🔵：① settings.css 超清单（已披露）② 受影响文件表呈现差异（panel-messages 实含功能性 M9 接线、list-models 含探针展示态）→ 父侧收口时更新 §16.5/§2 ③ 排序措辞（保留，见透明表 #6）④ custom 无 key 不探（透明表 #8）⑤ 无。
- **内部 advisor 代码评审（轮次 1）**：**VERDICT: pass**，0🔴 / 2🟡 / 3🔵。
  - 🟡#1 **语义悬挂（Deferred——上报父侧裁定）**：`webview/model-picker.js:118-126` 兜底（prefs/当前选择不命中拉取清单时取 `_models[0]` 并 post `selectModel`）→ `panel-messages` 随即**写会话槽**；本批把 `models` 载荷来源从静态候选换成运行期拉取后，兜底值变为「首个已配置渠道的排序首项」，会话开面板/切槽时可能被静默改写渠道+模型。该消费面**不在本批交付清单**（属设计缺口；CLI 对位已由设计裁为 `:70 兜底首候选 → keep.model`）。建议父侧按 CLI 对位语义立项/补做（仅命中才回写，或兜底保持当前）。
  - 🟡#2 `docs/TODO.md:130` 状态仍 `待设计`（§4 已批准）→ 父侧收口翻「在途」（非本端文档域）。
  - 🔵#3 `unavailable` 载荷无 UI 消费点 → 已补注释（诊断/测试载荷，见透明表 #7）。
  - 🔵#4 排序措辞漂移 → 保留（透明表 #6）。
  - 🔵#5 VSC `fullStatus` 无会话级缓存（CLI 有 TTL 60s）→ 记录为已知双端不对称（可选后续）。
- **修正轮**：1 轮（审计 🟡 修复 + T23b 新增 + 全量复核绿）；advisor 后仅注释澄清（0 代码语义改动）。
- **终态：clean**——可修项全部修复；剩余 2🟡/3🔵 = 已披露项（父侧裁定/文档收口/设计表补录），无未披露偏离。

**实现期产物（非交付物）**：`thincoder-vscode/_t-modelselect-vsc.log`（测试日志留证）——提交前可由父侧清理。

### 交付（eng-coder · CLI 面 = `thincoder/` 仓）

**交付摘要**：CLI 面实现完成（含修复轮）。新增源 2 + 新增测试 2；改源 20 + 改测试 3。
`npm test`（快层）= **342 tests / 331 pass / 0 fail / 11 skipped**；AC-1/AC-2/AC-3/AC-4/AC-8/AC-9 命令逐条过。
上机验证：openai 分支真机两发（kimi 4 模型 / deepseek 2 模型，真 key）——**anthropic / google 两分支本环境无真 key，仍为 mock-only**（设计 §16.2 M1 已记录的残余风险；上机验证动作待父侧安排）。

**新增文件**：`src/provider/list-models.mjs`（94 行——三 format 分派 + 完整 URL 钉死 + `has_more`→`after_id` / `nextPageToken` 翻页 ≤10 页 + 15s 三重超时）· `src/tui/model-catalog.mjs`（90 行——拉取 + 会话缓存 TTL 60s/失败不缓存 + `_catalogHooks` 假时钟 + M9 准入探 + M8 失败文案 + `dedupeModels`/`modelSeries` 迁入）· `test/list-models.test.mjs` · `test/provider-admission.test.mjs`。

**逐需求透明表（Done / Simplified / Not done——逐条对 R1–R9）**

| 需求 | 状态 | 落地 | 备注 |
|---|---|---|---|
| R1 清单 provider 化 | **Done** | `provider/list-models.mjs`（三 format）· `tui/model-catalog.mjs`（缓存）· `model-picker.mjs`（L2 候选=拉取，进入即触发）· `cmd-config.mjs`（默认模型菜单同源） | 真机仅 openai 分支；anthropic/google = mock-only（残余风险已记录） |
| R2 `models[]` 整字段删除 | **Done** | `config.mjs`（20 预设单值 + normalize）· `config-migrate.mjs`（v2：只读旧形态 + `delete p.models`）· `session.mjs` · `model-ref.mjs` · `model-picker.mjs` · `wizard.mjs` · `cli/setup-wizard.mjs` | AC-2 grep：白名单外零命中 |
| R3 渠道单值默认模型 | **Done** | 预设 20 条 · 槽位兜底 `session.mjs` · 显示回退（L1/槽位/管理面）· `advisor/run.mjs` + `subagent-async.mjs` 克隆链（`?? 父 model` 兜底，T28） | |
| R4 显式 `p:m` 放行 | **Done** | `model-ref.mjs`（首冒号分割 v2；删 `firstCandidate`）· `selectModel`（仅未知 provider/空模型名拒）· `cmd-model.mjs` | 表驱动 T7/T8/T9 |
| R5 切换回显 spec 来源 | **Done** | `model-specs.mjs`（`specMatch` 共享单次查表）· `selectModel` 两分支（正常 `C.tool` / DEFAULT `C.error` + `/config` 提示） | 含 `providers[].context` 覆盖用例 |
| R6 VSC 端同批 | **Not in this end** | —— | 另一端 eng-coder 并行实施（非本端文件域，未触碰 `thincoder-vscode/`） |
| R7 契约测试反转 | **Done** | `test/model-ref` / `config-merge` / `provider-model-guard` 三族重写 + 新 `test/list-models` | |
| R8 文档连带改写（代码注释与文案面） | **Done** | `model-ref` 头注 · `model-picker`/`pickers`/`cmd-model`/`wizard`/`errors`/`session`/`config`/`core`/`bin` 注释与帮助文案 | AC-8 grep 空；`_archive/MODEL-MERGE-SESSION.md` SHA 未变（`35d1d6b8…`），`docs/**` 零改 |
| R9 渠道准入校验（配置阶段） | **Done** | `probeChannelModels`（fresh 探）· cmd-config 默认模型菜单（探不通标 `不可用` + 不入可选来源 + 不阻断）· `setProviderKey` / 加渠道流（`wizard.js`、`cli/setup-wizard.mjs`） | 运行期零探测（T25）；命令面放行不变 |

**与设计的偏差（逐条透明）**

| # | 偏差 | 理由 |
|---|---|---|
| 1 | M9 准入探落在 `model-picker.mjs`（§16.5 该文件行未列探点；R9/§16.2 M9 落点含「加渠道 / 设 API key」；VSC 对位 `provider-flows.mjs` 同） | 按 R9 需求面落地——CLI 的渠道管理 flow 宿主即 model-picker |
| 2 | `probeChannelModels` / `modelListFailureText` 落 `tui/model-catalog.mjs`（§16.3 只列 `getProviderModels`）；`cli/setup-wizard.mjs` 由 `../tui/model-catalog.mjs` 引入（跨层） | 探针与文案单一权威（避免重复字面量）；无环、无 TUI 依赖 |
| 3 | `cmd-config.saveProxy` 改走 `ctx.persistRaw`（原直调 `writeConfigAtomic(configPath, …)`） | 语义等价（同 `writeConfigAtomic` + 冲突重试文案）；使既有 `createConfigHelpers` 测试注入缝对写链生效（T23/T24 可测） |
| 4 | 槽位面 / 会话面候选区新增 `(loading…)` 占位行（+ `fillAvailableModels`）；槽位面 fetch 增 `format` 透传（`cmd-advisor.mjs` 同） | 修复 explore/advisor 发现：0-item 会让 `showPicker` 立即 `resolve(null)`（picker 不打开、拉取结果被弃）；`format` 是三 format 支持到达调用点的必要条件 |
| 5 | `wizard.mjs` / `setup-wizard.mjs` 不再就地 `delete …models` | 迁移唯一权威 = `config-migrate`（下次 load 统一清理） |
| 6 | `setup-wizard.mjs` 预设分支落全量扩展字段（`format`/`thinking`/`reasoningEffort`/`maxTokens`/`chatPath`，与 TUI wizard 同构）+ 探针输入同源 | 修复 advisor 发现：探针缺 `format` 会误报「不可用」；落盘缺字段会走错协议路径 |

**轮次（内层自含交付协议）**

- **explore 分歧审计 ×1**（0🔴 / 1🟡 / 7🔵）：🟡（加渠道当次无 key 则不探）+ 测试覆盖提示 → 已修（探统一到流尾、**精确一次**；补「设 API key」面用例）；其余为已声明偏差 / 文档面归属 / 设计边界所许（D8：`settings` 工具直写 config 点路径不在 M9 枚举落点内）。
- **advisor 代码评审 ×1**（1🔴 / 2🟡 / 1🔵）：🔴 = 非当前渠道（及空槽渠道）L2 恒空 → `showPicker` 0-item 自闭、拉取结果被弃（跨渠道切换在 picker 面不可用、D-S1 恢复流被卡）→ **已修**（两候选区占位行 + `fillAvailableModels` 落地填充 + 回归用例）；🟡 = M9 探被 60s 会话缓存短路 → **已修**（`getProviderModels(…,{fresh})`，探针 `fresh:true`）；🟡 = setup-wizard 探针缺 `format`、不落预设扩展字段 → **已修**（预设全量字段探针/落盘同源）；🔵 = 回显 out 的二进制 K 口径 → **不改**（设计 M6 例 `out 128K` 由 kimi-k3 `maxOutput 131_072` 二进制换算得出——设计例即该口径；证据同档留痕）。
- **修复验证轮**：advisor 复评 3 发均**环境故障**（2×600s 超时、1×「文件不可读」）——未取得独立复评结论，**如实披露不静默**；替代证据 = 本端逐条机械核验（新增回归用例 + 全量 `npm test` 复绿 342/331/0 + AC 命令逐条重跑）。
- **fix round 计数**：2（审计修 1 + 评审修 1；未触 5 轮上限）。

**终态**：`clean` —— 本端全部验收命令绿（含修复后全量复跑）；唯一未竟项 = advisor 复评的环境故障（已披露，非内容阻塞）。工作区状态：**clean（HEAD 已含本端全部改动——父侧提交；本 coder 全程未执行任何 git 写操作）**。

**日志证据**：`thincoder/_t-modelselect-cli.log`（全量快层复跑尾部 ℹ 计数 + 失败段）。

### 父侧代码评审小修正轮（eng-coder 自写 · 2026-09-11）

父侧代码评审小修正轮（2026-09-11）：#5 空 key 守卫对齐（`src/provider/list-models.mjs:52` → `Bearer ${provider.apiKey ?? ""}`，与本文件 `:57`/`:74` 兜空对齐）· #4 占位行注释（`src/tui/model-picker.mjs:152`——"（不可选）"改为"选中视为返回上一级；拉取后台继续、缓存照写；通用 picker 无禁用项概念"）· #1 首启向导注释（`src/cli/setup-wizard.mjs:67`——"与 TUI wizard 同构"改为"近似同构" + `thinking: null` 落盘差异已登记待口径统一（父侧））——3 处均注释/一行级，**零行为改动**；`npm test`（快层）= **342 tests / 331 pass / 0 fail** / 11 skipped（exit 0；日志 `thincoder/_t-modelselect-fix.log`）。

## §6 验证与收口（父代理自写）

> 待写。
