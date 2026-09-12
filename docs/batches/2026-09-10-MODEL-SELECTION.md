# 模型清单 provider 化 + 去候选否决权 · 批次记录（2026-09-10）

> **搬迁注记（LEDGER-SELF-CONTAINED 批——拆分 · 已切除 2026-09-12）**：本档对端（VSC）份**已自本档切除**（原文不再留本仓——D11 完全态）；承载档 = VSC 仓 `docs/batches/2026-09-10-MODEL-SELECTION（VSC 仓）`（逐字搬运、零改写——D10）。
> 已切除条目清单：§2 双块之 VSC 源块（18 文件）+ VSC 测试块（10 文件）——条目计数（对端份 / 本仓份）= 28 / 30（判据 = `docs/design/LEDGER-SELF-CONTAINED.md` §8.3 拆分表）。**源档 blob SHA（切除前）= `f121fb82bf68`**。
> 变更记录：2026-09-12——对端份经承载档逐字承接后自本档物理切除；档首注记形态收敛为「已切除」。
> 变更记录（收尾轮）：2026-09-12——§2「范围追加」节两处对端纯端片段（追加范围行 + VSC 档落点行）补切；承载档/对应设计档承接。
> 已切除条目清单（补切 · 收尾轮 4）：§2「范围追加评审修正轮」节对端引用（落点句 + AC-10 行）——**源档 blob SHA（切除前）= `c8953eeb5368`**；承载档 = VSC 仓 `docs/batches/2026-09-10-MODEL-SELECTION（VSC 仓）`（逐字搬运——D10）。
> 变更记录（收尾轮 4）：2026-09-12——上列对端引用经 VSC 侧补承载（逐字核对通过）后补切。

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
9. **槽位面已是目标形态**（现成形态，非新机制）：`/submodel` 与 `/config` consult 池（`model-picker.mjs:177` 起）
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
| 7 | VSC 端是否有对应 Provider 板块档需同改 | **待勘察**（designer 定：VSC 仓 `docs/` 现状 + 是否新增） |

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
- 槽位面（`model-picker.mjs:177` 起 + `:287` 起，前段已读）——已有"拉取即候选、直接可选"的形态可参照。

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
| 6 | VSC 端同批对齐 | VSC 仓：`config-io.mjs` · `panel-messages.mjs` · `config-migrate.mjs` · `wizard.mjs`（勘察定） | 待设计 |

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
- **VSC 仓文档更新**（`PROVIDER（VSC 仓）`）——父侧收口后执行（用户 2026-09-10 裁定 O4），不在 coder 交付物。
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

### 验收标准（逐条回指需求）

> 与 `../design/PROVIDER.md` §17.2 一致（AC-1..AC-9）；机器验证命令照写。

| AC | 回指 | 验证（机器可判） |
|---|---|---|
| AC-1 | R1 | `node --test test/list-models.test.mjs` 全绿（三 format 分派：URL/请求头/响应解析/失败态）；拉取失败 = 该渠道不可选 + 明示原因（T5/T20）；picker 候选行来自拉取的 mock 断言；VSC 静态候选来源清除：VSC 仓 `grep -rn "configCandidates" src/` → 空（标识符只在 VSC 仓——现状 `settings.mjs:301-317` 命中；CLI 仓无此名） |
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
- **实现提示（勘察已核，供免重复勘察）**：三 format 的端点规范与响应形状见 §16.2 M1（已核）；VSC webview 直读 config 字段的四处（§16.10 #2）与 custom 空条目判据（#3）易漏；`setup-wizard.mjs:43` 既存 bug 本批自动对上（#4）；M9 准入探复用 `provider/list-models.mjs`（双端）——VSC 既有 `testProviderConnection`（`settings.mjs:155`）为现成探针同款。
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
| 7 | §16.3（model-catalog 行）· T6 | 缓存时钟可注入（同款 `rate.mjs` `_rateHooks`；本函数钩子 `_catalogHooks`）——T6 假时钟确定性断言 |
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

### 范围追加（用户裁定 2026-09-11——VSC 面板兜底静默改写并入本批）

> 依据：§5 VSC 面 advisor 代码评审 🟡#1（语义悬挂——上报父侧裁定）+ 用户 2026-09-11 01:45 裁定「并入本批，不单独立项」。
> 本轮 = 设计档范围追加落档（docs FIRST——同链补记）；**实现前须用户重新发起一轮设计评审 + 批准**（不自动进入实施）。

**语义（已裁——与 CLI 对位同源）**：候选未命中不得静默写会话槽——未命中/兜底场景只允许【保持当前选择 + 呈现候选】；
写会话槽仅显式用户动作（点击候选行）。CLI 对位 = `tui/cmd-config.mjs` 会话重载兜底 `keep.model`（本批已交付）。

**落点与编号**（三方一致：本小节 ↔ 设计档 §0.2 / §16.2 / §17 ↔ VSC 档）：

| 面 | 落点 | 编号 |
|---|---|---|
| 需求 | `../design/PROVIDER.md` §0.2 | **R10**（新增） |
| 机制 | `../design/PROVIDER.md` §16.2 | **M10**（新增） |
| 用例 / 验收 | `../design/PROVIDER.md` §17.1 / §17.2 | **T29 / AC-10**（新增） |
| 文件表 | `../design/PROVIDER.md` §16.5（VSC 源表 + 测试表） | `webview/model-picker.js` + 新测试档 |

**实现面（待新评审 + 用户批准后 spawn）**：VSC 端单端改动——webview 兜底分支去静默写槽（零 `postMessage`、保持当前选择显示）；
测试 = 新 `test/model-picker-fallback.test.mjs`（注册 `test/files.mjs`）。**CLI 端零改动**（对位语义已交付）。

**边界**：命中分支（prefs 命中——同值回写）维持现状；显式点击写槽路径不变；不涉运行期/配置期探测语义（M9 不变）。

### 范围追加评审修正轮（2026-09-11——8 条采纳项落档）

> 依据：§3 轮次 2 评审（🟡×3 + 🔵×5——VERDICT: pass）经主 agent 裁决**全部采纳**；本轮 = 设计档修正（docs FIRST——同一 designId 链内，不重新发起评审）。

**逐条落点（编号 = §3 轮次 2 评审发现编号）**：

| # | 落点（节） | 内容 |
|---|---|---|
| 1 | CLI 档 §16.2 M10 · VSC 档 §3 | 口径统一为「**prefs 未命中即回落会话槽复合 + 零 post**」（选**推荐改法**）——守卫只剩「prefs 复合存在且未命中清单」，`ctx.selectedModel` 不再参与判定；残留子场景消失；§16.5 `model-picker.js` 增量按改定方案复核（−4） |
| 2 | CLI 档 §16.2 M10 · §17.1 T29 | 显示回落时 `ctx.selectedModel`/`ctx.selectedProvider` **同步**为会话槽复合（与回合 echo 一致）；T29 增断言：两者 == prefs 复合 |
| 3 | CLI 档 §0.2 R10 · M10 语义句/边界① · §16.7 · VSC 档 §3 | 全称句限定「未命中/兜底场景内」；命中分支维持现状（同值幂等回写 / 无槽播种 / reasoning 归一）边界①明示；VSC §3 补注 |
| 4 | CLI 档 R10 · M10 · §16.6 #15 · §16.7 · T29 · AC-10 · VSC 档 §3/§3.2 | 断言口径统一为 T29 逐字：零 `selectModel` **且**零 `selectReasoning` post；括注精确化（`selectModel` = 唯一槽写入口；`selectReasoning` 只写 workspaceState） |
| 5 | CLI 档 §16.5 VSC 测试表 | `test/files.mjs` 行数刷新：41 → 48（2026-09-11 实测） |
| 6 | CLI 档 §16 首注 · 本档顶部状态行 | 状态拆两态：主体（R1–R9/M1–M9）已实施并过父侧代码评审 / 范围追加（R10/M10）增量已评审待批准 |
| 7 | VSC 档 §3.2 · CLI 档 M10 CLI 对位行 + §16.5 cmd-config 行 | 「会话重载兜底 = `keep.model`」→ 主行为 = 会话值优先（`cmd-config.mjs:67-71` `sessionModel ?? dm.model ?? keep.model`）；`keep.model` 仅链尾兜底 |
| 8 | 本档 §2（本小节） | AC 计数修正：验收标准前言「AC-1..AC-9」前向扩读为 **AC-1..AC-10**；**AC-10 行已随对端份迁出**（前言行为 append-only 不改——以本注记为准） |

**（父侧形态更正 2026-09-12）**：原「验收表增补行（AC-10）」块**已随对端份迁出**——引导行与空表座随之清空；对应内容见**档首移出清单**与对端**承载档**（本档内不再留空表头/空表体）。

**§2 上文其余句的读法与本轮裁定（本小节修正）**：

- 发现 1 选**推荐改法**（非「本批不扩」）——理由：统一口径与 §16.6 #15「显示 = 会话槽复合」一致；勘察无反例（候选清单仅菜单面，不构成显示校验源；显示值 = 会话实际运行值）。
- 「范围追加」小节语义句「写会话槽仅显式用户动作」→ 按 R10/M10 统一读：限定**未命中/兜底场景内**（命中分支维持现状——同值回写）。
- 「范围追加」小节 CLI 对位句「会话重载兜底 `keep.model`」→ 按发现 7 精确化读（主行为 = 会话值优先；`keep.model` 仅链尾）。
- 状态：本轮仅为修正落档；**增量实现仍待用户批准后 spawn**（「范围追加」小节原声明不变——不自动进入实施）。

- 附注（范围外——父侧收口面）：轮次 2 注记之本档 §5 超宽行为既有留痕（非本小节笔迹），待父侧收口处置。

**读法补全（「范围追加」小节其余字面量——按本修正轮统一）**：

- 实现面句「零 `postMessage`」→ 按 R10/M10 口径读：零 `selectModel` / `selectReasoning` post（断言对象统一为 T29 逐字；语义不变）。

## §3 设计评审（评审子代理自写）


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
| 7 | Tests / Determinism | 🔵 | T6（:744）缓存 TTL 未给确定性测试缝——按壁钟/睡眠写即脆弱测试。 | 预制可注入时钟/钩子（同款 rate.mjs `_rateHooks`），在 §16.3 helper 契约点明 |
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

### 轮次 2（评审子代理）

> 评审对象：范围追加增量（CLI 档 §0.2 R10 / §16.2 M10 / §16.5 追加行 / §16.6 #15 / §16.7 / §17.1 T29 / §17.2 AC-10；VSC 镜像档 §3 + §3.2 行 + §9 变更记录；本档 §2「范围追加」小节）。
> 缝面代码已核：`webview/model-picker.js` · `panel-messages.mjs` · `panel-session.mjs` · `send.js` · `turn-model.mjs` · `cmd-config.mjs` · `test/helpers/webview-env.mjs` · `test/files.mjs`。发现表：

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Clarity / Requirements | 🟡 | 「未命中」口径（prefs 不在清单）≠ 兜底分支 guard——后者还要求 `ctx.selectedModel` 不在清单（`model-picker.js:118`）；残留子场景、影响与夹具问题见「§3-补 1」。 | 见「§3-补 1」：明示归属 + T29 夹具两态。 |
| 2 | Clarity / Tests | 🟡 | 未写明是否同步 `ctx.selectedModel`/`ctx.selectedProvider`（回合 echo 载体——`send.js:47`）；只改显示不动两字段时：显示=槽值而 echo=旧值 → `turn-model.mjs:22` 判 trialOverride（跑 echo 模型、槽不落）；T29 文字只钉 DOM 显示与 post，抓不到该态。 | M10 写明状态同步（或明示不改及其后果）；T29 增断言：`ctx.selectedModel`/`selectedProvider` == prefs 复合。 |
| 3 | Clarity / Boundary | 🟡 | 全称句「写会话槽仅来自显式用户动作」与保留的命中分支自动写槽相抵（有槽=同值幂等；无槽=workspaceState 播种）；命中分支亦改写/post reasoning；VSC 档 §3 未注「命中分支维持现状」。证据见「§3-补 3」。 | 该句限定「未命中/兜底场景内」；VSC §3 补注；T29 ② 可覆盖两条 post。 |
| 4 | Acceptance wording | 🔵 | 同一断言四种表述：M10 改法「零 `postMessage`」· R10/AC-10「零 `selectModel` post」· T29「零 `selectModel`/`selectReasoning` post」· VSC §3.2「零 post」。**…余文与建议逐字见「§3-补 4（轮次 2）」** | **（见「§3-补 4」）** |
| 5 | File-size annotations | 🔵 | spot-check：`webview/model-picker.js` 135 行 ✓、快照 `:118-126` ✓；`test/files.mjs` 标 41、实测 48（未复测）。 | 落册（追加新档条目）时顺带刷新行数。 |
| 6 | Doc-state | 🔵 | `PROVIDER.md:3` 与 `:441` 状态行仍「设计已定稿待评审，尚未实现」——主体已实施并过代码评审（本档 §5），本增量确待评审；两态未区分。 | report-only：收口/本轮把状态行拆为「主体已实施 / 增量待评审」。 |
| 7 | Double-end parity | 🔵 | CLI 对位描述精度：「会话重载兜底 = `keep.model`（保持会话值）」——实测链 = `sessionModel ?? dm.model ?? keep.model`（`cmd-config.mjs:67-71`），keep.model 仅链尾；同源结论成立（双端均无候选成员驱动的槽改写）。 | 措辞拆分（主行为 vs 链尾）；精度提示，无行为差异。 |
| 8 | Coordination / D3 | 🔵 | 本档 §2 验收表前言仍写「AC-1..AC-9」（:248）——范围追加小节新增 T29/AC-10 后，§2 全文覆盖 AC-1..AC-10（计数·枚举纪律）。 | 批准后 spawn 前把前言/表补至 AC-10 或加一行前向注记（父侧协调项）。 |

【核验要点（答评审对象三问）】

- ① 同源成立：CLI 对位 = `cmd-config.mjs:67-75` 会话值优先、无候选成员校验；VSC 本增量删除的正是「候选未命中 → 写槽」的唯一路径。空槽兜底机制两端不同但语义对齐（CLI dm/keep.model 回落 · VSC 显示空白 + 回合期 `baseModel` 兜底——`turn-model.mjs:23`）。
- ② 不引入新的槽写路径：改法 = 删除两条 post、零新增分支；风险集中在发现 1/2 的状态语义缺口（均非槽写）。
- ③ T29 机器可判、盖住原缺陷：原缺陷链 = 兜底 post `selectModel`（`model-picker.js:125`）→ 槽写（`panel-messages.mjs:106-121`）；T29 ① 零 post 断言即断源。工具面已实证：`handleModelsMessage` 已导出（`model-picker.js:101`）、`webview-env.mjs` 提供 DOM 夹具 + `capturedPosts`（`:22-41`/`:60-71`）。

【§3-补 1（发现 1 余文）】

- 残留子场景 = prefs 未命中 ∧ `ctx.selectedModel` 仍在新清单（切/开会话路径可达——`panel-session.mjs:161-174` 推 models + 槽复合 prefs）——不进任何分支：显示与回合 echo 均保持旧值、不回落会话槽（`turn-model.mjs:22` 判 trialOverride——跑 echo 模型、槽不落）。
- 该子场景在本增量改法（删兜底分支两条 post）之外，但与 §16.6 #15「显示 = 会话槽复合」/ R10「显示保持当前选择」口径冲突；T29 用例 ① 文字只钉 prefs 维度、未钉 `ctx.selectedModel` 维度——夹具两取值下（分支进/不进）断言结果不同。
- 建议：明示归属——扩条件使 prefs 未命中全量回落显示（或显式落档「本批不扩」+ 列为已披露边界）；T29 按 `ctx.selectedModel` ∈/∉ 清单两态各钉一组夹具。

【§3-补 3（发现 3 证据）】

- 命中分支 = `model-picker.js:111-117`（prefs.reasoning 不在 levels 时改写为 levels[0] 并 post `selectReasoning`——只落 workspaceState：`panel-messages.mjs:124-128`）；无槽复合时 prefs 走 workspaceState 兜底（`settings.mjs:342`），命中分支的 `selectModel` post 会把该值播种进新会话槽（`panel-messages.mjs:106-121`——F-7「沿用当前」既有语义）。
- 建议：M10 语义句限定作用域（「未命中/兜底场景内写槽仅来自显式用户动作；命中分支维持现状」）——边界 ① 已钉行为，本发现为措辞补全；VSC 档 §3 同步补「命中分支维持现状」一句。

【范围外注记（无严重度）】本档 §5 有 6 行 >300 字符（`check-doc-width` 扫描域含 `docs/batches`、宽度检查硬 FAIL）——非本增量笔迹（实施记录），建议收口压缩（设计两档与增量块本次零新增超宽行）。

> **§3-补 4（轮次 2——发现 4 余文与建议；原文文字逐字保留，仅移出表单元）**：「post 即槽写入口」仅对 selectModel 精确
> （selectReasoning 只写 workspaceState，`panel-messages.mjs:124-128`）。
> 建议：统一逐字断言对象（建议用 T29 口径）；括注改「selectModel = 唯一槽写入口」。

计数：🔴×0 · 🟡×3 · 🔵×5（共 8 项）
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

**2026-09-11 02:04 用户批准（范围追加）**——原话："批准"。范围 = VSC `webview/model-picker.js` 兜底静默改写缺陷**并入本批**（用户 2026-09-11 01:45"并批"裁定）。

- 设计评审（轮次 2）**pass**（0🔴 · 3🟡 · 5🔵——发现表见 §3）；
- 8 条评审采纳项**已全部落档**并经主 agent 核验（抽查实文：R10/M10 口径统一为「prefs 未命中即回落会话槽复合 + 零 post」· T29 断言 + 附注 ·
  `test/files.mjs` 48 · 状态行拆两态 · §16.5 `webview/model-picker.js` 135/−4 行）；
- 第 1 条裁定 = **选「推荐改法」**（勘察无反例：残留子场景实测可达，统一口径后被覆盖）；
- 修正轮 lint：两仓新增超宽 0 · 新增违规 0（本档文件面）。

**批准范围**：M10 增量实现（**VSC 单端**）——`webview/model-picker.js` 兜底分支 + 新增 `test/model-picker-fallback.test.mjs` + `test/files.mjs` 登记。

**下一节点**：eng-coder（VSC 单端；2 个设计槽在飞 → spawn 显式带 designId 消歧）。凭证值不落档。

## §5 实施记录（eng-coder 自写）

> 待写。

### 交付（eng-coder · CLI 面 = `thincoder/` 仓）

**交付摘要**：CLI 面实现完成（含修复轮）。新增源 2 + 新增测试 2；改源 20 + 改测试 3。
`npm test`（快层）= **342 tests / 331 pass / 0 fail / 11 skipped**；AC-1/AC-2/AC-3/AC-4/AC-8/AC-9 命令逐条过。
上机验证：openai 分支真机两发（kimi 4 模型 / deepseek 2 模型，真 key）——**anthropic / google 两分支本环境无真 key，仍为 mock-only**（设计 §16.2 M1 已记录的残余风险；上机验证动作待父侧安排）。

**新增文件**：`src/provider/list-models.mjs`（94 行——三 format 分派 + 完整 URL 钉死 + `has_more`→`after_id` / `nextPageToken` 翻页 ≤10 页 + 15s 三重超时）·
  `src/tui/model-catalog.mjs`（90 行——拉取 + 会话缓存 TTL 60s/失败不缓存 + `_catalogHooks` 假时钟 + M9 准入探 + M8 失败文案 +
  `dedupeModels`/`modelSeries` 迁入）· `test/list-models.test.mjs` · `test/provider-admission.test.mjs`。

**逐需求透明表（Done / Simplified / Not done——逐条对 R1–R9）**

| 需求 | 状态 | 落地 | 备注 |
|---|---|---|---|
| R1 清单 provider 化 | **Done** | `provider/list-models.mjs`（三 format）· `tui/model-catalog.mjs`（缓存）· `model-picker.mjs`（L2 候选=拉取，进入即触发）· `cmd-config.mjs`（默认模型菜单同源） | 真机仅 openai 分支；anthropic/google = mock-only（残余风险已记录） |
| R2 `models[]` 整字段删除 | **Done** | `config.mjs`（20 预设单值 + normalize）· `config-migrate.mjs`（v2：只读旧形态 + `delete p.models`）· `session.mjs` · `model-ref.mjs` · `model-picker.mjs` · `wizard.mjs` · `cli/setup-wizard.mjs` | AC-2 grep：白名单外零命中 |
| R3 渠道单值默认模型 | **Done** | 预设 20 条 · 槽位兜底 `session.mjs` · 显示回退（L1/槽位/管理面）· `advisor/run.mjs` + `subagent-async.mjs` 克隆链（`?? 父 model` 兜底，T28） | |
| R4 显式 `p:m` 放行 | **Done** | `model-ref.mjs`（首冒号分割 v2；删 `firstCandidate`）· `selectModel`（仅未知 provider/空模型名拒）· `cmd-model.mjs` | 表驱动 T7/T8/T9 |
| R5 切换回显 spec 来源 | **Done** | `model-specs.mjs`（`specMatch` 共享单次查表）· `selectModel` 两分支（正常 `C.tool` / DEFAULT `C.error` + `/config` 提示） | 含 `providers[].context` 覆盖用例 |
| R6 VSC 端同批 | **Not in this end** | —— | 另一端 eng-coder 并行实施（非本端文件域，未触碰 VSC 仓） |
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
- **advisor 代码评审 ×1**（1🔴 / 2🟡 / 1🔵）：🔴 = 非当前渠道（及空槽渠道）L2 恒空 → `showPicker` 0-item 自闭、拉取结果被弃
  （跨渠道切换在 picker 面不可用、D-S1 恢复流被卡）→ **已修**（两候选区占位行 + `fillAvailableModels` 落地填充 + 回归用例）；
  🟡 = M9 探被 60s 会话缓存短路 → **已修**（`getProviderModels(…,{fresh})`，探针 `fresh:true`）；
  🟡 = setup-wizard 探针缺 `format`、不落预设扩展字段 → **已修**（预设全量字段探针/落盘同源）；
  🔵 = 回显 out 的二进制 K 口径 → **不改**（设计 M6 例 `out 128K` 由 kimi-k3 `maxOutput 131_072` 二进制换算得出——设计例即该口径；证据同档留痕）。
- **修复验证轮**：advisor 复评 3 发均**环境故障**（2×600s 超时、1×「文件不可读」）——未取得独立复评结论，**如实披露不静默**；替代证据 = 本端逐条机械核验（新增回归用例 + 全量 `npm test` 复绿 342/331/0 + AC 命令逐条重跑）。
- **fix round 计数**：2（审计修 1 + 评审修 1；未触 5 轮上限）。

**终态**：`clean` —— 本端全部验收命令绿（含修复后全量复跑）；唯一未竟项 = advisor 复评的环境故障（已披露，非内容阻塞）。工作区状态：**clean（HEAD 已含本端全部改动——父侧提交；本 coder 全程未执行任何 git 写操作）**。

**日志证据**：`thincoder/_t-modelselect-cli.log`（全量快层复跑尾部 ℹ 计数 + 失败段）。

### 父侧代码评审小修正轮（eng-coder 自写 · 2026-09-11）

父侧代码评审小修正轮（2026-09-11）：#5 空 key 守卫对齐（`src/provider/list-models.mjs:52` → `Bearer ${provider.apiKey ?? ""}`，与本文件 `:57`/`:74` 兜空对齐）·
  #4 占位行注释（`src/tui/model-picker.mjs:152`——“（不可选）”改为“选中视为返回上一级；拉取后台继续、缓存照写；通用 picker 无禁用项概念”）·
  #1 首启向导注释（`src/cli/setup-wizard.mjs:67`——“与 TUI wizard 同构”改为“近似同构” + `thinking: null` 落盘差异已登记待口径统一（父侧））——
  3 处均注释/一行级，**零行为改动**；`npm test`（快层）= **342 tests / 331 pass / 0 fail** / 11 skipped（exit 0；日志 `thincoder/_t-modelselect-fix.log`）。

## §6 验证与收口（父代理自写）

**收口 2026-09-11**（用户 02:24"第三批验收通过"）——本批**已核销**，本档冻结。

### 交付与提交（三段——含一次外部混批，如实记账）

| 提交 | 仓 | 内容 |
|---|---|---|
| `d67c01b` + `05d0946` | thincoder | **主实现被第 5 批（他链）提交卷走**——本批 CLI 面 23 源 + 7 测试的改动全部落在这两次提交内（**非本链自有提交**；父侧调查确认改动未丢、无回滚） |
| `4e59a76` | thincoder | 父侧评审修正轮 3 处 + 设计档 AC-8 枚举改准 + 批次档 §5 补登 |
| `9299661` | VSC 仓 | VSC 主体 26 改 + 2 增（含设计档镜像同步 O4） |
| `cd1de8f` | VSC 仓 | 范围追加 M10：`webview/model-picker.js` + 新测试档 + `files.mjs` 登记 |

### 验证实跑（父侧——非采信自述）

- CLI `npm test` → **342 / 331 pass / 0 fail / 11 skipped**（exit 0）；VSC `npm test` → **353/352/0/1**（主体）· **359/358/0/1**（M10 后）；
  M10 新档单跑 → **6/6**（父侧复跑）。
- AC 命令逐条实跑：AC-1（`configCandidates` 清除）· AC-2（`.models` 白名单外零残留）· AC-4 · AC-8（关键词零残留 + `_archive` SHA 未变）·
  AC-9 · AC-10 —— 全过；`src/` 语法检查 258 文件 OK。

### 实施后对账（声明 vs 实测——**归 §6**，设计档快照不追改）

| 面 | 设计声明 | 实测 | 判定 |
|---|---|---|---|
| `model-picker.mjs` | 490 / −35（估 455） | **495（+5）** | &lt;500 硬限；余 5 行——再触碰须先执行 §16.5 拆分计划 |
| `advisor/run.mjs` | 488 / ±0 | **497** | &lt;500 |
| `core.mjs` | 498 / −20 | 481 | 迁出减负 ✓ |
| `setup-wizard.mjs` | 80 / +10 | 96 | 超预估（预设字段全量复制） |
| CLI 测试 `model-ref` / `provider-admission` | 170→~190 / 新增 ~110 | **416 / 267** | 超预估（表驱动扩面） |
| **VSC `webview/settings.css`** | **未列（超清单）** | 379（本批 +15） | **超清单新增**——M9「不可用」标注样式；已披露 |
| **VSC `panel-messages.mjs`** | 列「注释」 | 实为**功能性改动**（`testProvider` 透传 `format`；addProvider 后 M9 探针） | **改判**——已披露 |
| VSC `model-picker.js`（追加面） | 135 / −4 | **135（±0）** | 注释抵偿删除段 |

### 遗留清单（逐条 + 归属）

1. **`thinking: null` 口径分歧**（setup-wizard 落盘 vs TUI 路径真值过滤）——行为未动；**技术待办**（统一口径以预设声明为准）。
2. **MODEL_SPECS 前缀匹配无条件继承隐患**（`qwen3.8-flash` 蹭泛前缀）——本批外，独立待办在册。
3. **M10 兜底态 reasoning 下拉渲染**——设计沉默面（已披露边界；无槽写风险）——记录不追改。
4. **VSC `fullStatus` 无会话级 TTL 缓存**（CLI 有 60s）——双端不对称，可选后续。
5. **设计档状态行**（`PROVIDER.md:3` / `:441`）——现为「主体已实施 / 增量待批准」；增量已实施并提交 → 待刷新（设计档写权；
   **第 6 批评审窗口内冻结**，窗口关闭后随批处理）。
6. **本机 config 的 `deepseek` 渠道退役名**——用户环境，第 6 批范畴。

### 核销同步清单（D7）

- **状态行**：本档 §1 状态 ✅（原文保留 + 追加裁定表）· 设计档状态行 → 遗留 #5。
- **计数**：设计定稿 **R1–R10 / N1–N4 / M1–M10 / T1–T29 / AC-1..AC-10**（跨两轮设计评审：轮次 1 + 范围追加轮次 2）。
- **指针**：`TODO.md` 条目 → **已核销**（本文同期处置）· 批次档 §2 = 任务书本体 ✅。
- **变更记录**：`PROVIDER.md` / `SESSION.md` / VSC 镜像档 ✅ 各一行。
- **待办勾销**：需求池 `- [ ] 模型清单 provider 化…` → `- [x] ~~…~~`（同期处置）。
- **凭证**：全链零落档 ✅（评审通过只记"pass"）。

**格式整备（父侧 · 2026-09-11——文字逐字保留，仅折行/移余文）**：§3 与 §5 共 9 条 >300 字符行 → 7 条长 bullet 硬折行；
2 条表格行（§3 轮次 2 第 4 行 · §5 R1 行）余文移入「§3-补 4」「§5-补」并留指针；§3 顶部父侧骨架占位行（「过渡期注」）已清。
**核验：本档宽度 0 行超宽、V1/V2/V3 新增违规 0**（同机检余项均属存量与他批在途面——AGENT-LOOP/SESSION/SUBAGENT-ID/TUI 存量 + `POOL-LEDGER` 他批）。

### 状态

**已核销 2026-09-11**——六段齐备，append-only 完结。
