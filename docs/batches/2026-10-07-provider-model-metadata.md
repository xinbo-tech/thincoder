# 2026-10-07 · Provider 上游模型元数据 · 保留与展示
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-07 · 来源 = 用户 2026-10-07 12:05「我觉得应该单独开批吧？这个是provider面的。」（单独立批裁定）+ 12:23「provider 模型列表那个也改吧，应该支持上游的富信息。」（点火——提前并行·点名）——#1005（server 板）。
> 台账 = #1005（server · 归批）。前情 = docs/batches/2026-10-06-console-providers.md §6（已收口 2026-10-06）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**来源**：用户 2026-10-07 12:05「我觉得应该单独开批吧？这个是provider面的。」（单独立批裁定 + 不复用 v2 面）→ 12:23「provider 模型列表那个也改吧，应该支持上游的富信息。」（点火——提前并行，点名）。

## 需求点

上游 `/models` 富字段的**保留 + 展示**（provider 面）——实探清单逐家在册（#1005 台账行；本会话 2026-10-07 12:0x · dev 库 13 家逐家 `GET {base}/models` 全 200）：deepseek（name ∥ context_window ∥ max_output_tokens ∥ input|output_modalities ∥ effort）∥ kimi-code · kimi-enterprise（display_name ∥ type ∥ context_length ∥ supports_* 族 ∥ think_efforts）∥ kimi（context_length ∥ supports_*）∥ ark（name ∥ version ∥ **status（"Shutdown" = 退役在列）**）∥ tokenhub（name ∥ status）∥ dgx-spark vLLM（max_model_len）∥ 基线族（qwen 等六家）= 经典四件。

候选面（点火范围——设计轮细化）：① **保留集定义**（只取**有用途**字段——用途先定）∥ ② **存储形**（模型清单结构最小扩展）∥ ③ **接口带出**（管理面）∥ ④ **显示面**（Provider 详情弹窗模型列表——随 #984 加载态一处落）∥ ⑤ **ark status ⇒ 退役提示**（只提示不自动停用）。

**范围纪律（用户 12:11 裁——驳数据一致性架构提案）**：不建元数据同步/校验/仲裁机制；不照单全存；缺就空着（零兜底值）。

## 合并扫描（点火前池面扫描——#996 纪律）

**并入（1）**：#984（候选段加载态——同组件 `public/views-providers-modals.mjs` 同窗；此前「不并入 v2」之理由〔非同组件〕随本批成立而消解）。

**不并（理由）**：#979（弹窗机制/路由面——非内容面）∥ #993/#976（结构轮——拆分/拆表）∥ #967（运维面——env 注记）∥ #955/#959/#989（条件未至）∥ #1000/#924/#958/#953/#954/#977（文档面——归文档清账批）∥ #1001/#1002-1004（已归 v2 批）。

## 边界（明确不做）

不触 `/v1/models` 对外契约（须设计论证 + 点名方可议）∥ 不触服务模型页/成员页（各有批面——v2 #1003 在动）∥ 不改「发现失败 ⇒ 502 无手填」既有裁定（2026-10-06 21:36）∥ 不建机制层（无同步器/校验器/重试新面）∥ 退役 = 只提示（**不自动停用**——A 面自持操作沿功能点 17 原裁）。

## 设计棒

eng-designer 已 spawn（2026-10-07 12:2x）——**dependsOn #4（v2 修轮）**：共享档（WEBUI/API/STORE）与 v2 名下在飞改动重叠，调度器按 files 串行——本棒在 v2 修轮 settle 后起跑。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（初轮 · 2026-10-07 · 六面（保留集 ∥ 存储形 ∥ 接口 ∥ 显示 ∥ 退役提示 ∥ 加载态）+ 需求侧增量（功能点 24 候补））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 批次任务（条目覆盖）

| 条目 | 类 | 覆盖内容 | 设计落点 | 验收判据 |
|---|---|---|---|---|
| #1005 | 需求 | 上游模型元数据「保留 + 展示」六面：① 保留集白名单（用途先行——四字段 + 逐家来源）② 存储形（`model_meta_json`——v7）③ 接口带出（discover/GET/POST/PATCH）④ 显示形态（候选行富信息）⑤ ark `status` ⇒ 退役提示（只提示）⑥ 需求侧增量全文 | `gateway/API.md` §2.2/§4/§5/§7/§8 ∥ `store/STORE.md` §1–§4 ∥ `webui/WEBUI.md` §2.2/§2.4④/§2.6⑤/§5–§8 | API §5 AC-24 行 ∥ WEBUI §6 AC-24 两行 ∥ STORE §3 v7 判据 |
| #984 | tech | 候选段加载态（首开自动拉取 ∥「刷新候选」在飞期 = 段内 `.hint` 加载文案 + 触发钮 `disabled`；双弹窗一处落——沿 ⑨ 族 canon） | `webui/WEBUI.md` §2.4④/§2.6⑤ | WEBUI §6 AC-24⑤ 行 ∥ 批内件（在飞/完成/失败三态） |

**不在本批**（§1 钉表原样）：#979 ∥ #993/#976（结构轮）∥ #967 ∥ #955/#959/#989（条件未至）∥ #1000/#924/#958/#953/#954/#977（文档清账批）∥ #1001/#1002-1004（归 v2 批——在飞）。合并扫描随 §1（并入 #984——同组件同窗；本设计轮复核成立）。

### 2.2 需求侧增量（报父侧核落 `docs/server/requirements/PROJECT.md`——功能点 24 + AC-24 候选全文）

**功能点 24（Provider 上游模型元数据留存与展示）**：
① **保留集** = 只取**有用途**字段——展示名（`display_name` ∥ `name`）∥ 上下文窗口（`context_window` ∥ `context_length` ∥ `max_model_len`）∥ 图片输入（`supports_image_in` ∥ `input_modalities`）∥ 上游状态（`status`——退役判据）；未收录字段不采；缺就空着（零兜底值、零占位）。
② **留存** = 已开放模型的上游元数据随 provider 落库（`providers.model_meta_json`——v7 段）。
③ **展示** = Provider 详情弹窗模型列表行富信息（次级文本 + 徽标）+ 候选段加载态（并入 #984）。
④ **上游退役提示** = `status` 命中退役词表 ⇒ 行标 + 注行（原文在册）——**只提示，不做自动停用**（开放/停用仍 = 服务模型页自持操作面）。
边界：不建元数据同步/校验/仲裁机制（用户 2026-10-07 12:11 裁）∥ 不照单全存 ∥ `/v1/models` 对外契约零动 ∥ 不做自动停用/自动勾选 ∥ 元数据 = 纯展示面（转发/计费零涉）。

**AC-24（候选·四条）**：① discover 携 `modelMeta`（三上游形逐字段直测；经典四件 ⇒ `{}`）∥ ② 保存求交（携 ⇒ 期望图落库；缺 ⇒ 现存按求交滑动；非对象 ⇒ 400 库零变）∥ ③ 弹窗候选行富信息（有则示 ∥ 零字段零占位 ∥ 存储回落）+ 退役提示（只提示——勾选/保存/派发零涉）∥ ④ 候选段加载态（在飞 `.hint` + 钮禁用）。
判据 = 设计 `gateway/API.md` §5 AC-24 行 ∥ `webui/WEBUI.md` §6 AC-24 行；机检 = 批内件。
（计数行随落：功能点 二十三条 ⇒ **二十四条**；变更记录随落一行——报父侧核落。）

### 2.3 设计档落点

- `docs/server/design/gateway/API.md`：§2.2（端点表四行随正——GET/POST/PATCH/discover 携 `modelMeta`；发现条随正；增「模型元数据（留存图）」全文条）∥ §4（providers 167 ⇒ ≈175 ∥ provider-admin 220 ⇒ ≈258；小计 ⇒ ≈1439）∥ §5（AC-24 行——候补）∥ §7（N27/N28 ∥ B20 ∥ E20）∥ §8（元数据面不做项）∥ 变更记录。
- `docs/server/design/store/STORE.md`：§1（结构版本 6 ⇒ 7）∥ §2（v7 增段——`model_meta_json` 形/写面/读面/消费/圈界）∥ §3（迁移链 v7 判据）∥ §4（db 202 ⇒ ≈226）∥ 变更记录。
- `docs/server/design/webui/WEBUI.md`：§1（越线清单补 `views-providers-modals.mjs`）∥ §2.2（键族登记 +5 键；表体量 zh ≈350 ∥ en ≈353）∥ §2.4④（勾选段重写：行富信息 ∥ 退役提示 ∥ 加载态 ∥ 保存线形；添加弹窗探针同拍）∥ §2.6⑤（行形句随正）∥ §5（视图件 300 ⇒ ≈335 越线在册 + 拆分预案细化 ∥ i18n 两表 ∥ 小计 ⇒ ≈3290）∥ §6（AC-24 两行——候补）∥ §7（KD-SV-45/46）∥ §8（边界随正）∥ 变更记录。

设计内坐标（as-of 本设计轮——实施轮以盘面为准）：`src/gateway/provider-admin.mjs:90-103`（GET 行）∥ `:105-121`（POST）∥ `:123-147`（PATCH）∥ `:161-209`（discover）∥ `src/gateway/providers.mjs:24-50`（`rowToEntry`）∥ `src/store/db.mjs:147-153`（`MIGRATIONS`）∥ `public/views-providers-modals.mjs:18-36`（`renderPicks`）∥ `:137-151`（添加窗探针）∥ `:210-222`（`loadCandidates`）∥ `:249-258`（`renderPicksArea`）∥ `:260-279`（保存）∥ `public/i18n-zh.mjs:182-218` / `public/i18n-en.mjs:178-214`（providers 键区）∥ `public/views-providers.mjs:26-38`（列表取数——零动）。

### 2.4 机制设计摘要（全文在各档）

① **保留集（用途先行）**：四字段——`displayName`（次级文本）∥ `contextWindow`（徽标——上下文窗口）∥ `vision`（徽标——图片输入）∥ `status`（退役判据——仅命中词表才收，原文留档）。逐家来源：上下文 = `context_window`（deepseek）∥ `context_length`（kimi 族）∥ `max_model_len`（dgx-spark vLLM）；视觉 = `supports_image_in`（kimi 族）∥ `input_modalities` 含 `image`（deepseek）；展示名 = `display_name`（kimi-code/enterprise）∥ `name`（deepseek——仅 ≠ 模型名收）；退役 = `status`（ark——实测「Shutdown」；tokenhub 同字段）。未收录（无用途不堆砌）：`max_output_tokens` ∥ 推理档位族（`effort`/`think_efforts`/`thinking_type`/`supports_reasoning`）∥ `supports_video_in` ∥ `modalities`/`limit`（方向/形未明）∥ 噪声族。
② **存储形** = `providers.model_meta_json TEXT NOT NULL DEFAULT '{}'`（**v7 段**——v6 归 v2 批；同文件串行，实施轮以链尾 +1 为准）；形 = `{ "<模型名>": { displayName?/contextWindow?/vision?/status? } }`——≥1 字段才入键、只含开放清单；写面 = 保存求交（键在场 = 期望图（白名单过滤 + 形不符即略）；缺省 = 现存按求交滑动）；发现探针零落库（草稿语义保持）；坏 JSON ⇒ 行数据损坏抛（沿 models/settings 口径）。
③ **接口带出**：discover ⇒ `{ models, modelMeta }`（去重首见——随 models 同集）；GET 行 ⇒ `modelMeta`（恒在场，未存 = `{}`）；POST/PATCH body ⇒ `modelMeta?`（非对象 ⇒ 400）；零新端点 ∥ 零新码 ∥ `/v1/models` 零涉。
④ **显示形态**：候选行 = `label`（勾选 + 模型名 + 次级文本 + 徽标）——数据 = 发现 `modelMeta` ∪ 存储（**逐字段——发现优先 ∥ 存储补齐**；两处皆缺 ⇒ 不出）；值格式化 `xM/xk`；类面 = `hint`/`hint error`（零新类/零新变量——AC-19 canon 不破）；添加弹窗候选同形（同渲染助手）。
⑤ **退役提示（#1005⑤）**：候选 `status` 在场 ⇒ 行标（`upstreamRetiredBadge`）+ 注行（`upstreamRetiredNote`——「模型名 (状态原文)」清单）；**只提示**——勾选/保存/派发零涉（被标记照常可勾、照常服务；停用入口 = 服务模型页自持面不变）。
⑥ **加载态（#984）**：`renderPicks` 增 `loading` 分支——在飞期 = `.hint` 加载文案（`candidatesLoading`）+ 触发钮 `disabled`；完成 ⇒ 候选/空态；失败 ⇒ `.hint error`（重试恢复）；详情窗首开 ∥「刷新候选」∥ 添加窗「获取模型」同径（一处落双窗）。

### 2.5 受影响文件与行数（实读 = 本设计轮；末行无尾空行计；增量 = 设计估）

| 档 | 实读 ⇒ 预估 | 增量 |
|---|---|---|
| `thincoder-server/src/store/db.mjs` | 202 ⇒ ≈214 | v7 段（ALTER + 迁移段）——**顺位 = v2 批 v6 之后** |
| `thincoder-server/src/gateway/providers.mjs` | 167 ⇒ ≈175 | `rowToEntry` 解码 `model_meta_json` |
| `thincoder-server/src/gateway/provider-admin.mjs` | 220 ⇒ ≈258 | `extractModelMeta` ∥ `filterModelMeta` ∥ discover 出图 ∥ GET 行 ∥ POST/PATCH 收 meta |
| `thincoder-server/public/views-providers-modals.mjs` | 300 ⇒ ≈335 | 候选行富信息 ∥ 加载态 ∥ 退役提示 ∥ 保存线形（**越 300 软线在册**——拆分预案细化 = 候选段渲染助手外拆 `views-providers-picks.mjs`，结构轮触发） |
| `thincoder-server/public/i18n-zh.mjs` | 345 ⇒ ≈350 | +5 键 |
| `thincoder-server/public/i18n-en.mjs` | 341 ⇒ ≈353 | +5 键（+v2 同拍 `.one` 7 枚——en 预估 ≈353 含 v2 批） |
| `thincoder-server/package.json` | —— | `prepublishOnly` 链 20 ⇒ 21 件（v2 后 +本批件） |
| 零动面 | —— | `style.css`（224）∥ `views-providers.mjs`（61）∥ `ops/config.mjs`（260）∥ `gateway/routes.mjs`（104）∥ `modal.mjs`（68）——**`/v1/models`/派发/校验单源零改** |
| 批内件 | 新 ≈400 | `docs/batches/2026-10-07-provider-model-metadata.test.mjs`（六面腿）；随正件 = 设计轮实测零（实施轮复核） |

### 2.6 验收对照（六面机检口径——实施轮照此落）

① **保留集**：`extractModelMeta` 直测——deepseek 形（`context_window`+`input_modalities`+`name`）∥ kimi 形（`context_length`+`supports_image_in`+`display_name`）∥ vLLM 形（`max_model_len`）⇒ 逐字段出图；经典四件 ⇒ `{}`；形不符逐项略（`context_window:"1M"` ∥ `status:"online"` ∥ 超长名）。
② **存储形**：空库读数 7 ∥ v6 库升 7 ∥ 幂等再开零变 ∥ `pragma_table_info('providers')` 含 `model_meta_json` 默认 `'{}'`；`rowToEntry` 往返逐值；坏 JSON ⇒ 行数据损坏抛。
③ **接口**：discover 200 `{models, modelMeta}`（富字段逐值 ∥ 经典 ⇒ `{}`）；POST/PATCH 携 ⇒ GET 行逐值 + 求交（提交外滑落 ∥ 非开放不入库）；仅 `models` 删项 ⇒ 现存滑落；非对象 ⇒ 400 库与运行时零变；`/v1/models` + 派发回归全绿。
④ **显示形态**：DOM 桩——行 = `label`[勾选, 名, 次级文本?, 徽标…]（有则示/零字段零占位）；`fmtTokens` 直测（1048576⇒1M ∥ 262144⇒262k ∥ 8192⇒8k）；发现 ∪ 存储逐字段（存储独有在场）；零新类/零新变量/零新悬停（AC-19 canon）；`style.css` 零动。
⑤ **退役提示**：`status` 命中 ⇒ 行标 + 注行（原文在手）；未命中 ⇒ `meta` 无此字段、零显示；被标记模型勾选/保存/派发照常（零停用）。
⑥ **加载态**：在飞 ⇒ 加载文案 + 钮 `disabled`；完成 ⇒ 候选/空态；失败 ⇒ `.hint error` + 重试恢复（既有断言保持）。
门面：行宽 0（`doc-check`）∥ 档目 19 ∥ 20 不变（零新 public 档）∥ 门禁链（v2 后 20 ⇒ 21 件）。

### 2.7 关键决策

KD-SV-45（上游模型元数据 = 白名单留存 + 弹窗展示 + 退役提示（只提示）——`webui/WEBUI.md` §7）∥ KD-SV-46（候选段在飞态 = 静态 `.hint` + 钮禁用——#984）。两行含被否候选与何故否。

### 2.8 上抛与披露

[上抛·知会] 需求侧增量（功能点 24 + AC-24 全文 + 计数行）待父侧核落 `docs/server/requirements/PROJECT.md`；设计档内 AC 行标「候补」（沿 v2 先例——父侧落位后随回收正）。
披露：
① 设计基点 = v2 批（配额 v2 · 成员模型面）在飞——迁移段号以链尾 +1 为准（设计 = v6 后 ⇒ v7）；§4/§5 数值以 v2 落定实读为基 + 本批增量，实施轮回填。v2 设计面（`STORE.md` v6 段 ∥ WEBUI §2.2 键族块 ∥ §5 链）已在盘——本批叠加其上，零改写。
② `views-providers-modals.mjs` 实读恰 300 ⇒ ≈335 越软线——沿先例在册 + 拆分预案细化（本批不触发；触发 = 结构轮——与 #993/#976 同族）。零新 public 档 ⇒ `-console-providers.test.mjs:426` 档目清单（20 档）零随正。
③ 现有门禁 19 件随正件 = 设计轮实测**零**：既有断言全为字段级/子结构级（`models` 逐值 ∥ PATCH body 值形——客户端「空图 ⇒ 省略 `modelMeta` 键」⇒ 原断言保持）；stub 发现响应无 `meta` ⇒ 客户端 `?? {}` 容错；新增键两表同步 ⇒ i18n 键集断言自动过。
④ 上游状态词表（`shutdown`/`retired`/`deprecated`——子串匹配）以 ark 实测「Shutdown」为锚；新值随实探扩（未命中不收不显示——缺就空着）。
⑤ `max_output_tokens` ∥ 推理档位族等未收录 = 明确选择（无展示/动作面——「不堆字段」；如后有用例再收）。
⑥ 存量读数漂移（非本批面，随 #983 回填轮）：`views-providers.mjs` 实读 61 与 §5 链「实读 56 ⇒ ≈64」不符（差 3）；`style.css` 实读 224 与 §5「实读 223」差 1——均在 ±5 惯例内，归 #983 对账。

⑦ 门禁读数（收口实读——`node scripts/doc-check.mjs --root d:/teamcode/thincoder`）：**行宽 = OK**（源域全部 .md 无 >300 字符单行；本批三处超宽（`gateway/API.md` §2.2 发现条 ∥ `webui/WEBUI.md` §2.2 键族行 ∥ §2.4④ 富信息行）已折行收正）；**锚 = FAIL：65 条悬空**（阈值 0——存量 repo 级状态；**零净增**：本批曾 +1（`gateway/API.md` 内短径写法 `ops/config.mjs`）已收正为 `thincoder-server/src/ops/config.mjs`，另收正存量 1 条（`webui/WEBUI.md` §8 内 v2 批书写行 `public/app.mjs` ⇒ `thincoder-server/public/app.mjs`——同档 202/410/423 行同径先例；一致性面小修 · 报告在案）⇒ 66 ⇒ 65）。
   余 65 条 = 存量（desktop/vsc/render-core 等各域分布——非本批写域）——报父侧核路由（文档清账批族）。

### 2.9 更正块（评审轮次 1 逐号点修 · 2026-10-07）

**本块性质**：§2 append-only ⇒ 修正以追加块承载（原文不回改）；**与本块冲突的既有陈述以本块为准**。**零新语义**：无新增机制、无新增要求——只含逐号处置 + 坐标/数值更正（①–⑩ 逐号；设计档侧已 in-place 落）；`docs/server/requirements/PROJECT.md` 本修轮零触。

- **②（db.mjs 口径统一）**：现读实值 = **210**（v6 已落盘——`MIGRATIONS` 链尾 = 6）；v7 终值重估 ⇒ **210 ⇒ ≈218**（+≈8 = ALTER + 迁移段，与 v6 段同构）。§2.3「§4（db 202 ⇒ ≈226）」与 §2.5「202 ⇒ ≈214」均按本值读；§2.5「顺位 = v2 批 v6 之后」改完成态 = **v6 已落盘，v7 顺位 = 链尾 +1**；`store/STORE.md` §4 + 变更记录同拍（in-place）。
- **③（候补标记收正）**：AC-24 已落需求档（`docs/server/requirements/PROJECT.md` 功能点 24 = :109 ∥ AC-24 = :148）；§2.2「**AC-24（候选·四条）**」标记按已落事实读（四条不变）；§2.8 [上抛·知会]「待父侧核落……随回收正」销；设计档两处（`gateway/API.md` §5 ∥ `webui/WEBUI.md` §6）已 in-place 收正为「已落需求档——`docs/server/requirements/PROJECT.md` 验收表」形。
- **④（#984 行判据改指）**：§2.1 #984 行「WEBUI §6 AC-24⑤ 行」⇒ **④（加载态行）**——AC-24 四条、加载态 = ④（⑤ 无对应物）。
- **⑤（「仅 ≠ 模型名」范围）**：口径 = **两来源皆适用**（`display_name` ∥ `name`；`gateway/API.md` §2.2 形为准）；§2.4① 内「`name`（deepseek——仅 ≠ 模型名收）」按本口径读——设计档已 in-place 明写。
- **⑨（测试面在册句）**：§2.5 批内件行补——**测试面沿既有口径不拆**（先例 = 门禁链内 417 行 `docs/batches/2026-10-07-quota-v2-member-models.test.mjs` ∥ 446 行 `docs/batches/2026-10-07-quota-per-model.test.mjs` ∥ 568 行 `docs/batches/2026-10-06-console-provider-redo.test.mjs`——均未拆分；本批件「新 ≈400」沿此口径）。
- **⑩（随正件 = 三件——父侧增项）**：§2.5「随正件 = 设计轮实测零」替正 = **三件**（v7 顶红既有版本 pin——件数不变、非新增档）：
  ① `docs/batches/2026-10-07-quota-v2-member-models.test.mjs`（`[6, 6]` pin ⇒ `[7, 7]`）；
  ② `docs/batches/2026-10-06-server-gateway.test.mjs`（= 6 六处（`:9` ∥ `:164` ∥ `:167–:168` ∥ `:186` ∥ `:201` ∥ `:208`）⇒ 7；失败迁移探针 `:205` ∥ `:207` ∥ `:209` 的 v7 ⇒ **v8**）；
  ③ `docs/batches/2026-10-06-console-completeness-2.test.mjs`（= 6 三处（`:152` ∥ `:173` ∥ `:175`）⇒ 7）。
  §2.6 随拍：随正 = 既有件 pin 更新（门禁链条数不变）；实施轮落。
- **①⑥⑦⑧（设计档侧 · in-place）**：① `displayName` 长度上限 ≤200 字符已定义（`gateway/API.md` §2.2——§2.6①「超长名」子例据此可判，子例保留）∥ ⑥ `webui/WEBUI.md` §2.4④ 保存线补「发现值优先 ∥ 存储补齐」∥ ⑦ 同节添加窗写线明写携 `modelMeta`（探针所得；无探针 ⇒ 省略键）∥ ⑧ `gateway/API.md` §7 N17 预期输出补 `modelMeta`（经典四件 ⇒ `{}`）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

抽查（对照盘面——仅行数/落盘验证）：providers.mjs 167 ∥ provider-admin.mjs 220 ∥ views-providers-modals.mjs 300 ∥ i18n-zh 345 ∥ i18n-en 341 ∥ views-providers.mjs 61 ∥ style.css 224 ∥ 门禁链 20 件——均与标注相符；db.mjs 例外（标注 202 ∥ 现盘 210——v6 已落盘，见 #2）。需求落位核实：`docs/server/requirements/PROJECT.md` 功能点 24（:109）∥ AC-24（:148）已落且与设计逐条一致。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Acceptance criteria | 🟡 | B20 边界例把「`display_name` 超长」（`thincoder/docs/server/design/gateway/API.md:195`）列为 ⇒ 该字段略，批次档 §2.6① 同拍（`thincoder/docs/batches/2026-10-07-provider-model-metadata.md:92`「形不符逐项略（`context_window:"1M"` ∥ `status:"online"` ∥ 超长名）」）；但规范面未定义长度上限——`thincoder/docs/server/design/gateway/API.md:63` 对 `displayName` 只写「仅 ≠ 模型名时收」——阈值缺失 ⇒ 该机检子项不可判定（实现须自造阈值）。 | 在 `gateway/API.md` §2.2「模型元数据」条为 `displayName` 补长度上限（正整数 N——可沿 settings `note` ≤200 字先例），并同拍 B20 ∥ 批次档 §2.6①；若不设限则删该子例。 |
| 2 | Affected-file size annotations | 🟡 | db.mjs 终值三处不一：批次档 §2.3（`thincoder/docs/batches/2026-10-07-provider-model-metadata.md:62`）「§4（db 202 ⇒ ≈226）」∥ 同档 §2.5（:80）「202 ⇒ ≈214」∥ `thincoder/docs/server/design/store/STORE.md` §4（:207）「实读 202 ⇒ ≈214」+「模型元数据批 +≈12 = v7 段（ALTER + 迁移段）」、变更记录（:231）「§4 预算（db 202 ⇒ ≈226）」——§2.5 的 ≈214 缺 v2 批叠加；抽查盘面：db.mjs 现盘 210 行（`thincoder/thincoder-server/src/store/db.mjs:148` `const DDL_V6` ∥ :159「{ v: 6, up: (db) => db.exec(DDL_V6) }」已落盘）≠ 标注基数 202。 | 三处统一为同一口径终值（建议以现盘 210 + v7 增量重估）；§2.5「顺位 = v2 批 v6 之后」随 v6 已落盘改为完成态表述。 |
| 3 | Methodology compliance | 🟡 | 需求侧已落位（`thincoder/docs/server/requirements/PROJECT.md:109` 功能点 24 ∥ :148 AC-24），设计档「候补」标记未收：`thincoder/docs/server/design/gateway/API.md:141`∥`thincoder/docs/server/design/webui/WEBUI.md:452`「候补——报父侧核落 `requirements/PROJECT.md` 验收表」∥ 批次档（:55）「**AC-24（候选·四条）**」∥（:106）「待父侧核落 `docs/server/requirements/PROJECT.md`」——与已落事实相抵（§2.8① 自定「落位后随回收正」——本评审时点未收）。 | 按 AC-23/AC-13 先例收正为「已落需求档——`docs/server/requirements/PROJECT.md` 验收表」形（API §5 ∥ WEBUI §6 两处），批次档 §2.2/§2.8 注随拍。 |
| 4 | Clarity | 🔵 | 批次档 §2.1 #984 行（:42）验收判据引「WEBUI §6 AC-24⑤ 行」——AC-24 四条中加载态 = ④（`thincoder/docs/server/requirements/PROJECT.md:148`「④ 候选段加载态（在飞 `.hint` + 钮禁用）」∥ 批次档 :55 同），§2.4 中加载态 = ⑥（批次档 :74「加载态（#984）」）——⑤ 无对应物。 | 引用改指 ④（或 WEBUI §6 AC-24 续行「加载态分支」句）。 |
| 5 | Clarity | 🔵 | 「仅 ≠ 模型名」的适用范围两处不一：`thincoder/docs/server/design/gateway/API.md:63` 挂在来源集合整体（「来源 `display_name` ∥ `name`——仅 ≠ 模型名时收」）∥ 批次档（:69）只挂在 `name`（deepseek）括注内（「展示名 = `display_name`（kimi-code/enterprise）∥ `name`（deepseek——仅 ≠ 模型名收）」）——按后者字面，kimi 族 `display_name` 与模型名相同时会冗余显示。 | 两处统一范围（建议口径 = 两来源皆「仅 ≠ 模型名时收」），或明示该限定仅指 `name` 源。 |
| 6 | Clarity | 🔵 | 保存线形的逐字段合并未写优先级：`thincoder/docs/server/design/webui/WEBUI.md:165`「`modelMeta` 期望图（存储 ∪ 发现——逐字段合并；空图 ⇒ 省略键）」；显示线同档（:160）明写「逐字段——发现值优先 ∥ 存储补齐」——两处口径不同则保存值与显示值可背离。 | 保存线补「发现值优先 ∥ 存储补齐」（与显示线同源措辞）。 |
| 7 | Clarity | 🔵 | 添加弹窗保存是否携探针所得 `modelMeta` 未明写：`thincoder/docs/server/design/webui/WEBUI.md:157`「写入 = POST 全字段路径（无 `preset` 字段——校验不豁免；契约 = `gateway/API.md` §2.2）」——若不携，新 provider 留存图为空直至下次详情窗保存（与功能点 24②「随 provider 落库」的即时性有隙；AC-24 各点亦未覆盖该径）。 | 补一句「添加窗保存携 `modelMeta`（探针所得——合并/过滤口径同详情窗）」，或明示不携的口径。 |
| 8 | Clarity | 🔵 | `thincoder/docs/server/design/gateway/API.md:171` N17 预期输出仍作「`{models:[…]}`（去重）」——discover 响应形已随正（同档 :53「⇒ `{ models: [...], modelMeta: { "<id>": {…} } }`（留存集——见下「模型元数据」）」∥ N27），N17 未同拍。 | N17 预期输出补 `modelMeta`（经典四件 ⇒ `{}`），与 §2.2/N27 同形。 |
| 9 | Affected-file size annotations | 🔵 | 批内件测试档「新 ≈400」（批次档 :88）越 300 建议线且未携拆分考量（本条款对「源/测试文件」一体列注）；先例 = 门禁链内既有批件 417 行（`thincoder/docs/batches/2026-10-07-quota-v2-member-models.test.mjs`）∥ 446 行（`2026-10-07-quota-per-model.test.mjs`）∥ 568 行（`2026-10-06-console-provider-redo.test.mjs`）（`thincoder/thincoder-server/package.json:13` 链内）均未拆分。 | 按先例在受影响表在册一句（「测试面沿既有口径不拆」），或按条款补拆分考量——二择一使口径显式。 |

计数：🔴 0 ∥ 🟡 3 ∥ 🔵 6（共 9 条）——无 🔴 ⇒ 不阻断。

VERDICT: pass

## §4 用户批准（主 agent）

**§4 用户批准（主 agent）——父侧代签**（用户 2026-10-07 12:25「自动跑」授权——排空模式）。

- **三条件齐备**：① 设计评审 **pass**（§3 轮次 1——🔴 0 ∥ 🟡 3 ∥ 🔵 6）；② 修正轮已落地并逐条核验（修轮 #12——十条 + 三条 changelog；父侧读实核验在案：`gateway/API.md:63`（≤200 ∥ 两来源）∥ `:141` ∥ `:171` ∥ `webui/WEBUI.md:157` ∥ `:165` ∥ `:452` ∥ `store/STORE.md:207`（实读 210 ⇒ ≈218）∥ §2.9 `:118-132`）；③ 设计令牌已签发（值不入档）。
- **批准范围** = 本批实施全链（实施 + 随正三件搬入 + 收口核销 + 提交）。依据登记 = §3 ∥ §2（含 §2.9 更正块）∥ 三设计档 fix 轮面。可撤回。

## §5 实施记录（eng-coder）
**状态行**：实施完成（8 档 + 批内件落位 ∥ 件 6/6 ∥ 舱七件 73/73 ∥ 审计 0🔴 ∥ 代码评审 pass）



**实施记录（eng-coder · 2026-10-07）——交付摘要 / 决策透明表 / 审计与代码评审轮次与终态 / fix 轮**

**① 交付摘要（8 档 + 批内件；行数 = 末内容行实读）**：
- `src/store/db.mjs`（**216**）：`DDL_V7` = `ALTER TABLE providers ADD COLUMN model_meta_json TEXT NOT NULL DEFAULT '{}'` + MIGRATIONS 追段 `{ v: 7, up }` ⇒ 链尾 `SCHEMA_VERSION = 7`。
- `src/gateway/providers.mjs`（**177**）：`rowToEntry` 解码 `model_meta_json`（坏 JSON ⇒ `非 JSON` ∥ 非对象 ⇒ `非对象`——沿 `settings_json` 口径）；出参 `modelMeta`（未存 = `{}` 恒在场）。
- `src/gateway/provider-admin.mjs`（**284**；估 ≈258 ⇒ +26——见域外注①）：导出 `extractModelMeta`（保留集四字段——`displayName`：`display_name` ∥ `name`，非空、≠ 模型名、≤200；`contextWindow`：`context_window` ∥ `context_length` ∥ `max_model_len`，首在场源优先、正整数；`vision`：`supports_image_in === true` ∥ `input_modalities` 含 `image`；`status`：仅命中退役词表 `shutdown`/`retired`/`deprecated`——子串·大小写无关，原文留档）∥ `filterModelMeta`（白名单 + 形不符即略 + 与 `models` 求交；非对象 ⇒ 抛 ⇒ 调用方 `asInvalidRequest` 转 400）；GET 行 +`modelMeta`；POST/PATCH 收 `modelMeta`（POST 缺省 `{}`；PATCH 缺省 = 现存按 `models` 求交滑落；`null` 亦 400——沿 settings 先例）；discover 出 `{models, modelMeta}`（去重首见 ∥ ≥1 字段才入键）。
- `public/views-providers-modals.mjs`（**365**；估 ≈335 ⇒ +30；越 300 软线在册）：导出 `fmtTokens`（≥1e6 ⇒ `xM`（一位小数舍零）∥ ≥1e3 ⇒ `xk`（四舍五入）∥ 原值）∥ `mergeModelMeta`（发现优先 ∥ 存储补齐）；`renderPicks` 增 `meta`/`loading`（loading 优先 ⇒ `candidatesLoading` 文案 + 触发钮禁用）；候选行 = `label`[勾选, 名, · 富项…]（displayName = `hint` span ∥ `metaContext` ∥ `metaVision` ∥ status ⇒ `hint error` 徽标）；退役注行（「模型名 (状态原文)」清单 = `hint error`）——只提示（勾选/保存/派发零涉）；保存线（可编辑面零变更 ⇒ 直接关窗零请求；否则 `models` 全量数组 + `modelMeta` 期望图随携、空图省略键）；添加窗探针随 POST 携图（无探针省略键）。
- `public/i18n-zh.mjs`（**350**）/ `i18n-en.mjs`（**354**）：各 +5 键（`candidatesLoading` ∥ `metaContext` ∥ `metaVision` ∥ `upstreamRetiredBadge` ∥ `upstreamRetiredNote`）。
- `thincoder-server/package.json`（**26 行不增**）：门禁链 20 ⇒ 21 件（本批件入列）。
- `docs/batches/2026-10-07-provider-model-metadata.test.mjs`（**497**；估 ≈400）：六腿（① 抽取三形 + 经典 ⇒ `{}` ② v7 迁移三态 + 往返/坏 JSON ③ 真 HTTP 接口逐值 + 400 库与运行时零变 + `/v1/models` 零涉 ④ DOM 桩：富信息/退役零停用/加载三态/保存线形/添加窗探针 ⑤ `filterModelMeta` 直测 ⑥ i18n 键集 + AC-19 canon + 门禁链 21）。

**零动面（AC-19 canon 不破）**：`views-providers.mjs` ∥ `style.css` ∥ `ops/config.mjs` ∥ `gateway/routes.mjs` ∥ `modal.mjs` 零动；零新类 / 零新 `:root` 变量（件 ⑥ 断言 `:root` 38 ∥ 悬停八条 ∥ 档目 19 ∥ 20）；`/v1/models` 对外契约/派发/校验单源零涉（件 ③ 断言条目键集仍 = `["created","id","object","owned_by"]`）。

**② 随正七件舱（跨批写闸——父侧搬入）**：`.thincoder/tmp/provider-meta-随正/`（7 件改稿 + `映射单.md`）：结构版本 pin 6 ⇒ 7（`-server-gateway` ∥ `-console-completeness-2` ∥ `-quota-v2-member-models` ∥ `-quota-per-model`）∥ 门禁件数 20 ⇒ 21（上述两件 + `-console-list-style` ∥ `-server-auto-update` ∥ `-console-layout`）∥ `"hint error"` 全档计数 15 ⇒ 17（`-console-list-style`——本批 +2 面：退役徽标 ∥ 退役注行）。任务书 §2.9⑩ 列举三件；实证受影集 = 七件（已上抛「随正三件不完整」，父侧确认七件舱方案 + 次序：其 v2 并集先、本舱同名覆盖后）。红基线（盘面态）= 七件 **62/73**（11 处红全为上述 pin）；舱稿 = **73/73** 绿；舱稿 ↔ 盘面逐行差 = 46 行（含 1 新增），零表外。

**③ 判据落位（AC-24①–④）**：① 保留集抽取 + 经典四件 ⇒ `{}`（`provider-admin.mjs` + 件 ①/③）；② 存储/求交（POST 携图 ∥ PATCH 携与不携 ∥ 非对象 400 库与运行时零变——件 ③/⑤）；③ 候选行富信息 + 退役只提示 + 加载态（件 ④ DOM 桩）；④ 双窗保存线（空图省略键 ∥ 非空随携 ∥ 探针随 POST——件 ④）。

**④ 自检读数（命令 + 结果）**：① `node --test docs/batches/2026-10-07-provider-model-metadata.test.mjs`（cwd = `thincoder/`）⇒ **6/6 绿**；② 舱稿七件一次全跑 ⇒ **73/73 绿**；③ 链内其余 13 件 ⇒ **106/106 绿**（受影集恰 = 七件，零外溢）；④ 逐行差核对 = 舱稿 = 盘面 + 仅意图内改动；⑤ 行宽实读：批内件最宽 270（≤300）∥ 档目/键集/门禁链断言全绿。

**⑤ 内部偏差审计（explore · 只读 · 1 轮）**：0 🔴 ∥ 2 🟡 ∥ 2 🔵——实现语义面（AC-24①–④ 逐条 ∥ 无静默简化 ∥ 无未披露越清单）全过；🟡/🔵 全落记录/行账面（§5 未落 ∥ 行账三处超估 ∥ 小计算式不自洽）；另点出边界观察一项（保存线「非空恒携」vs 设计「零变更 ⇒ 直接关窗」）——已判为真实偏差并修（下）。

**⑥ fix 轮（1 轮 · 3 笔）**：① **保存线偏差收正**（`views-providers-modals.mjs:332`——原实现以 `Object.keys(expected).length > 0` 即挂 `modelMeta` ⇒ 发现富化会单独触发一次 PATCH，与 `webui/WEBUI.md:165`「零变更 ⇒ 直接关窗」相抵；修为：先判可编辑面零变更（关窗零请求）、再挂期望图）；② **批内件补「零变更 ⇒ 零新 PATCH」腿**（设计明文而件内未断言——原缺口）；③ 批内件 514 行越 500 硬限 ⇒ 压缩至 497（零覆盖损失）。修后复跑：件 **6/6** ∥ `-console-provider-redo` **8/8** ∥ 舱 `-console-layout` **8/8** 全绿。

**⑦ 独立代码评审（advisor · code · 1 轮）**：**VERDICT pass**（0 🔴 ∥ 4 🟡 ∥ 4 🔵）。🟡 = 非阻断：随正件搬入协调项（核对点 = 舱须含两类 pin）∥ 视图件 365 行软线在册 ∥ i18n 两表软线（#976 拆表在册）∥ 批内件 497 行软线在册；🔵 = 设计预算数三处待回填（`gateway/API.md:121` ≈258 vs 实读 284 ∥ `webui/WEBUI.md:416` ≈335 vs 实读 365）∥ 合并语义「上游撤销字段不覆盖存储值 + UI 无清空径」的设计面口径留白 ∥ `displayName` 源回落（`display_name` 形不符不回落 `name`）与 trim 口径留白 ∥ 批档 §2.9⑩ 件数枚举滞后。**终态 = clean**（无未决 must-fix）。

**⑧ 决策透明表**：① 报错口径 = `asInvalidRequest`（沿 settings 先例——非对象 400）；② `null` 判 400（沿 settings 先例；任务书未明写，取严）；③ 退役词表子串匹配 + 原文留档（设计明文）；④ 候选行分隔符「 · 」覆盖「名 ↔ 首富项」位（设计「项间」字面只约束富项之间——取更可读形，零类零变量）；⑤ displayName 单源优先、不回落（设计留白 → 取简，报设计档）；⑥ 批内件越 500 硬限压缩而非拆档（六腿同源同批；拆档 = 两件入链的连带 pin 成本）；⑦ 随正超任务书枚举（两族 pin 实证，上抛获确认后并入舱）；⑧ 舱稿以 v2 并集搬入后盘面为基（次序 = 父侧 v2 先、本舱后）。

**⑨ 域外注（报父侧，未动）**：① 设计档 §4/§5 预算数三处待回填（`gateway/API.md:121` provider-admin ≈258 vs 实读 284 ∥ `webui/WEBUI.md:416` 视图件 ≈335 vs 实读 365）——归收口回填轮（R14/R16 先例）；② 设计面口径留白三处（合并语义撤销面 ∥ displayName 回落/trim ∥ 候选行分隔符落位）——归设计档下一触碰；③ 批档 §2.9⑩ 件数枚举（三件 ⇒ 七件）待收口轮随正。

## §6 验证与收口（父代理）

**§6 验证与收口（父代理 · 2026-10-07）**

**链条**：设计轮 → 设计评审 pass（§3）→ fix 轮（§2.9 ①–⑩）→ §4 代签（`:161`）→ 实施（8 档 + 批内件六腿——内审修轮 + 代码评审 pass 终态 clean）→ 父侧核验 + 收口。

**父侧核验读数（亲跑 · cwd = `thincoder/`）**：
- **随正七件搬入**（舱 `.thincoder/tmp/provider-meta-随正/`——映射单核对点照守：两类 pin 齐 ∥ 次序 = v2 并集先（提交 31aba50a）、本舱后）⇒ 同名覆盖落 `docs/batches/`；
- **门禁二十一件**（`prepublishOnly` 全跑）：**173 / 173 全绿**（= 前 20 件 167 + 本批六腿 +6；`"hint error"` 计数 17 同拍）——舱红基线 62/73 → 搬入后全绿（11 处 pin 归零，与映射单逐点吻合）；
- **走查（真浏览器 · 假上游三态——父侧自跑）**：① 候选段富行实证 = `mock/rich · Mock Rich Model · 上下文 128k · 视觉`；② 素行零占位 = `mock/plain`；③ **退役注行实证** = 「不在上游发现列表中的已开放模型：mock/gone——停用入口 = 服务模型页」（只提示零停用）；④ 勾选态（开放 ∥ 未开放）∥「刷新候选」∥ 测试连接探针在面；证据件 = `.thincoder/tmp/meta-walk-*.png` ×3 + `meta-walk.json`；
- **设计档回填（父侧笔）**：`gateway/API.md:121`（provider-admin ⇒ **实读 284**）∥ `webui/WEBUI.md:416`（视图件 ⇒ **实读 365**）∥ `WEBUI.md:429` 小计 ⇒ **实读 3345**（Δ+76）；API 小计聚合重算 = #983 域（在册）；
- **前批嵌合入账（按 v2 §6 补二约定）**：`db.mjs`（v6 段）∥ `i18n-zh.mjs`（死键删）∥ `WEBUI.md`/`API.md`/`STORE.md`/`requirements/PROJECT.md`（v2 行）随本批提交一并落盘；
- **API-CONTRACT 重生成 = 延迟**（浏览器工具批在飞；三链全落一笔重跑）。

**处置（评审 🔵/域外注）**：三处设计口径留白（合并语义撤销面 ∥ displayName 回落/trim ∥ 候选行分隔符落位）⇒ **登记入池**（新行——设计档下一触碰批）；§2.9⑩ 枚举「三件」⇒ 实证七件 = **本 §6 为准**（§2 append-only 纪律遵——原文不回改）；视图件 365 ∥ 批内件 497 ∥ i18n 双表 = 软线在册（口径沿批内先例）。

**核销（两行）**：#1005 ∥ #984——在途 → 待核销 → 已核销（随本 §6）。**暂缓批复核**：无。

**提交**：路径限定（产品面 7 档 + 文档面 4 档 + 批档 2 件 + 随正 7 件 = 20 件）；双推。
