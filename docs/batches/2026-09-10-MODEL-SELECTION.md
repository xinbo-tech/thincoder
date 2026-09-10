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
| AC-8 | R8 | `grep -rn "候选硬约束\|候选外拒" docs/design/ src/ bin/` 无现状残留（`_archive/` 除外）；`_archive/MODEL-MERGE-SESSION.md` 字节不变 |
| AC-9 | R9 | 配置阶段准入探两态断言（探通可用 / 探不通标不可用 + 不入可选来源 + 条目仍可保存）；运行期不探测断言（启动 / 请求零 `/models`）——T23/T24/T25 |

### 任务书就绪（本节即任务书——spawn 传路径，不另写副本）

- **交付物**：双端代码 + 测试改动（工作区未提交）；本文档 §5 自写实施记录（交付摘要 / 透明表 / 轮次 / 终态）。
- **凭证**：designId + designToken 经 spawn 参数传递（**绝不进任务文本、绝不落文档**）。
- **建议 spawn 面**：本批跨双仓——建议按仓拆两个 eng-coder（CLI / VSC 各一，files 域不重叠）或单 coder 顺序实施；由主 agent 定。
- **实现提示（勘察已核，供免重复勘察）**：三 format 的端点规范与响应形状见 §16.2 M1（已核）；VSC webview 直读 config 字段的四处（§16.10 #2）与 custom 空条目判据（#3）易漏；`setup-wizard.mjs:43` 既存 bug 本批自动对上（#4）；M9 准入探复用 `provider/list-models.mjs`（双端）——VSC 既有 `testProviderConnection`（`settings.mjs:155`）为现成探针先例。
- **边界重申**：撞设计缺口 → 停下报告；超范围改动 → 逐项报告；不编辑设计文档。


## §3 设计评审（评审子代理自写）

> 待写（过渡期注：advisor 自写机制未落地前由父侧代写）。

## §4 用户批准（主 agent 记）

> 待记。

## §5 实施记录（eng-coder 自写）

> 待写。

## §6 验证与收口（父代理自写）

> 待写。
