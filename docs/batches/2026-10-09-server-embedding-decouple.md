# 2026-10-09 · server-embedding-decouple
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-09 · 来源 = 用户 2026-10-09 17:24 三条（第 1/2 点）——「这个约束不合理，不应该强制必须配置以后才能启动」+「嵌入式模型也不应该跟其他provider提供的服务混在一起，模型列表里不要包含嵌入模型」；17:26「可以，开」立批。承会话 16:20 排空授权（父侧自缚三条同前）。。
> 台账 = #1147+1148（server · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-09
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**批次条目（用户 2026-10-09 17:24 三条之 1/2——17:26「可以，开」立批）**：

- **条目 ①（台账 #1147）嵌入配置不强制**：`embedding` 段可缺——服务照常启动；缺时嵌入面给明确禁用语义（具体形 = 设计轮定：`/v1/embeddings` 错误码 ∥ 控制台向量卡「未配置」态 ∥ 系统面 accessor 空值面）。
- **条目 ②（台账 #1148）嵌入模型不入通用模型列表**：`/v1/models` 与控制台服务模型页（同源）剔除引擎模型（现状 = `providers.mjs:127-130` 裸名混入——N4 既有口径）；派发面（`routes.mjs:91` 单独命名空间）不动；四端消费面随动核。
- **条目 ③（用户同刻第 3 点）** = 在飞批 `2026-10-09-server-console-config` 面（向量卡配置面——#6 落码中），**不并入本批**（父侧 17:25 已回帖确认读法）。

**关键判据（父侧实读在案）**：`config.mjs:107-109`（缺段拒启——原话「配置缺 embedding 段（baseURL ∥ model——必填）」）；`providers.mjs:127-130`（清单含引擎模型原样）；`bin/thincoder-server.mjs:145/148`（启动路径只读配置、零探引擎——引擎可不在线语义不变）。

**授权口径**：用户 17:26「可以，开」；承会话 16:20 排空授权——全链自动（代点火 ∥ §4 代签 ∥ 派发 ∥ 收口核销提交推送 ∥ token 耗），**父侧自缚三条同前**（代签仅三条件齐备 ∥ 新范围/口径裁决即停 ∥ 破坏性即停）。

**边界（父侧预判，设计轮可修正）**：不引入嵌入引擎进程管理（起停仍手动）∥ 不改 provider 派发的 chat 语义 ∥ 与在飞批 `server-console-config` 的实施面零文件交集（实施串行化由调度器处理）。

**授权补充（2026-10-09 17:28）**：用户「**这个也自动跑完吧。**」——本批全链自动：① 设计评审点火权（代点火）② §4 批准权（代签）③ 修正轮/实施轮派发 ④ 收口核销 ∥ 提交 ∥ 推送 ∥ token 耗；排空模式（无时限，到收口）。**父侧自缚三条（本仓惯例 · 先例同形）**：代签仅三条件齐备（评审 pass 0🔴 ∧ 修正轮已落地并逐条核验 ∧ token 已签发）∥ 新范围/用户口径裁决 ⇒ 停、只摆那一条 ∥ 破坏性/不可逆（数据 ops ∥ 强杀 ∥ 外仓写）⇒ 先停。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（两条目（台账 #1147/#1148）判据落五档 ∥ fix 轮 1 已落（评审 #1–#9 逐号收正）∥ 批内件一件（估 ≈300 行）∥ doc-check EXIT 0 ∥ 待复评（评审轮 2））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

## 2. 批次任务与设计（eng-designer · 2026-10-09 · 设计轮 initial）

**本批 = 嵌入面解耦两条目**（用户 2026-10-09 17:24 两条之 1/2；台账 #1147 ∥ #1148）——设计落盘五处已办（`ops/OPS.md` ∥ `gateway/API.md` ∥ `webui/WEBUI.md` ∥ `design/PROJECT.md`；逐处 = §2.2/§2.10）；**产品码零触（设计轮）**。

### 2.1 本批覆盖（需求条目 → 判据）

| # | 条目（台账） | 设计形 | 判据回指 |
|---|---|---|---|
| ① | #1147——`embedding` 段可缺（服务照起 + 嵌入面禁用语义） | 缺位 ∥ `null` ⇒ 归一 `null`（服务照常起 + 启动警告一条）；`/v1/embeddings` ⇒ 404 `model_not_found`（消息明示未配置——**零新码**）；在场严格校验保持；控制台向量卡「未配置」态 + 保存创建；`GET /api/admin/embedding` 缺段两值 `null`；探活无草稿 ⇒ 400（携草稿照常） | `gateway/API.md` §5 AC-6 行 ∥ §7 N34/B24/E25；`ops/OPS.md` §7 AC-6 行 ∥ §9 B33/B34/E22 |
| ② | #1148——引擎模型剔出 `/v1/models` 与控制台服务模型页 | `modelList` 删引擎条目（清单 = chat 前缀名）；`deriveModels(providers)` 去引擎行（死支删净——`quotaOf` 嵌入「—」支 ∥ `embedNote` ∥ i18n 键 −1/表）；**派发面零动**；`/api/system.embedding.model` 保留下发（用户面提示条——非「模型列表」面） | `gateway/API.md` §5 AC-6 行 ∥ §7 N33；`webui/WEBUI.md` §6 AC-17①/AC-23② |

**显式不含**：嵌入面整体退役 ∥ 控制台删除/清空 `embedding` 段 ∥ `/api/system` 的 `embedding` 字段移除 ∥ `GET /api/admin/embedding` 端点退役 ∥ 引擎进程起停管理 ∥ 新错误码（零）。

### 2.2 设计结论（接口契约 · 决策 + 理由）

- **配置载入（`ops/config.mjs` `validateConfig`）**：`raw.embedding` 缺位 ∥ `null` ⇒ `embedding: null`（不再抛）；**非对象非 `null`**（字符串/数组/数字/布尔）⇒ 拒启（fail-closed，报错提示「对象 ∥ `null`」两形）；**在场 ⇒ 现校验保持**（须对象；`baseURL` http(s) ∥ `model` 非空串 ∥ `apiKey` 可空）——理由 = 「未配置」与「配错」两义分离，后者仍 fail-closed。
- **启动告警（`loadConfig` warnings +1）**：缺段 ⇒ 一条「嵌入引擎未配置（config.json 缺 embedding 段）——/v1/embeddings 禁用；配置后重启生效」；服务照常起（`/healthz` 200——启动路径探引擎零涉，既有语义）。bin 打印 warnings 现件已通用（`bin/thincoder-server.mjs:98` 逐条 `log.warn`）——**零改**。
- **嵌入派发（`routes.mjs` `/v1/embeddings`）**：引擎签名 = `config.embedding?.model ?? null`；`null` ⇒ **404 `model_not_found`** + 消息明示未配置（零新码——沿既有错误族）；在场 ⇒ 现行链路零动（转发/记账/透传/记账 `endpoint='embeddings'`）。
- **系统面**：`/api/system` ⇒ `embedding: { model: null }`（现件 `embedding?.model ?? null` 已容——零改）；`GET /api/admin/embedding` 缺段 ⇒ `{ baseURL: null, model: null }`（现件直解引用 `config.embedding` ⇒ 缺段 TypeError——**须改 `?.`**）。
- **探活/试跑（`POST /api/admin/embedding/test`）**：缺配 ∧ 无草稿（`baseURL`/`model` 未明传）⇒ **400 `invalid_request_error`**（消息明示未配置 + 可在表单携草稿先验）；携草稿 ⇒ 照常探活（未保存亦可先验——KD-SV-54 口径镜像）。
- **配置写面（`GET/PATCH /api/admin/config`）**：`embedding` 子键合并现件已容缺段（`isObject(config.embedding) ? … : {}`）⇒ **缺段档保存 = 从无到有创建**；门 = 载入面等价两跳（随 validateConfig 改）⇒ **缺段档 PATCH 他键照常过门**；部分子键（仅 `baseURL` ∥ 仅 `model`）⇒ 400（在场须完整——载入门判）；缺段档 GET ⇒ `embedding: null`（现件已形）。
- **清单面（`providers.mjs` / `views-models.mjs`）**：`modelList` 删引擎条目（`registry.engineModel()` accessor 保留——派发面仍在用）；`deriveModels(providers)` 去第二参（调用点两处：`views-models.mjs:78` ∥ `views-admin.mjs:254`——后者现传 `null` 随正）。
- **控制台 UI（`views-system.mjs` 向量卡）**：缺段 ⇒ 三输入空 ∥ 状态行「未配置」∥ **不自动探活**（避免无谓 400）∥ 提示句「填写并保存后启用（重启生效）」；填写后「重新检测」/试跑按草稿照常；保存 = 创建段（同一 PATCH）。i18n：+2 键/表（`vector.unconfigured` ∥ `vector.unconfiguredHint`）。
- **四端消费面核（② 的对外影响）**：四端经核 `list-models.mjs` 拉 `GET {baseURL}/models` 取候选 ⇒ ② 后候选 = chat 清单（引擎裸名退场）；核侧解析面（`data[].id`）零改；CLI/VSC/desktop 零引擎模型依赖（引擎模型不能 chat——派发面本就 404，原列 = 死条目）。

### 2.3 受影响文件清单（产品码——实施轮）

| 档 | 现读 | 预期 | 本批增量 |
|---|---|---|---|
| `thincoder-server/src/ops/config.mjs` | 实读 **301** | ≈306 | 嵌入可选分支 ∥ 告警一行（+≈5） |
| `thincoder-server/src/gateway/routes.mjs` | 实读 **111** | ≈117 | 缺配 404 支 + 注释（+≈6） |
| `thincoder-server/src/gateway/embedding-admin.mjs` | 实读 **110** | ≈118 | GET 缺段 null 容形 ∥ 探活缺配 400（+≈8） |
| `thincoder-server/src/gateway/providers.mjs` | 实读 **184** | ≈181 | `modelList` 引擎行删（−≈3） |
| `thincoder-server/public/views-models.mjs` | 实读 **216** | ≈208 | `deriveModels` 去引擎行 ∥ 死支删净（−≈8） |
| `thincoder-server/public/views-admin.mjs` | 实读 **331** | ±0 | 调用点去参（一行改） |
| `thincoder-server/public/views-system.mjs` | 配置批后 ≈230 | ≈245 | 缺段「未配置」态（+≈15——自动探活跳过） |
| `i18n-{zh,en}-system.mjs` ∥ `i18n-{zh,en}-admin.mjs` | 见 `WEBUI.md` §5 | +2/表 ∥ −1/表 | 新 2 键 ∥ 退 1 键（`admin.models.embedNote`） |
| `thincoder-server/README.md` | 实读 **256** | ≈258 | 嵌入可选句（+≈2） |
| `thincoder-server/config.example.json` | ±0 | ±0 | 示例段保留（可选后仍为推荐形） |

产品面合计 ≈+27；零新档（档目 30 ∥ 31 不变）；`package.json` ±0（`prepublishOnly` 清单 32 ⇒ **33**——本批件入链；以实施当刻盘面为准）。

### 2.4 关键决策记录（KD-SV-57 / KD-SV-58——全文 = 设计档）

- **KD-SV-57**（`ops/OPS.md` §8）：嵌入配置可选 = 禁用态 + 控制台可从无到有创建。被否：保持必填（用户 17:24 裁否）· 503 `service_unavailable` 新码（零新码纪律 + 家族沿袭）· 缺配静默 200/空向量（谎报）· 客户端直连引擎回落（拆面）· 控制台删段（写面仅创建/改值）。
- **KD-SV-58**（`gateway/API.md` §6）：引擎模型退出通用清单（单独命名空间）。被否：保留行 + `owned_by` 标记（用户裁「不要混在一起」）· 嵌入面整体退役（裁 = 只剔列表）· 新端点 `/v1/embeddings/models`（零需求）。

### 2.5 验收判据（三链 = 需求档（待回笔）↔ 设计档 ↔ 批档）

- **设计档（已落盘）**：`gateway/API.md` §5 AC-6 行（缺段三态 + 清单零引擎行）+ §7 N33/N34/B24/E25；`ops/OPS.md` §7 AC-6 行 + §9 B33/B34/E22；`webui/WEBUI.md` §6 AC-15①/AC-17①/AC-23②/AC-28⑨；`design/PROJECT.md` §7 AC-6/AC-15/AC-17 行。
- **批内件（实施轮新建）**：`docs/batches/2026-10-09-server-embedding-decouple.test.mjs`（估 ≈300 行）——载入容缺（警告一条）∥ 404 形（消息明示）∥ 探活 400 ∥ 建段往返 ∥ PATCH 他键过门 ∥ 清单零引擎行 ∥ 派生零引擎行 ∥ 非对象拒启/400。
- **收口轮（父侧）**：浏览器实走（向量卡「未配置」→ 创建 → 重启生效）；ECS 重收敛后 `/v1/models` 实读零引擎行（可选）。

### 2.6 边界（不做）

引擎进程起停管理（手动——不变）∥ 控制台删除/清空 `embedding` 段（缺段 = 编辑配置文件；界面仅创建/改值）∥ 嵌入面新错误码（404 复用——零新码）∥ 嵌入面整体退役 ∥ `/api/system` 字段移除 ∥ `GET /api/admin/embedding` 端点退役 ∥ 嵌入模型在通用清单的任何展示位（`/v1/models` 与模型页皆零行）。

### 2.7 需求档回笔清单（主 agent 笔——`docs/server/requirements/PROJECT.md`）

1. **功能点 6**（`:38` 区）：补「配置 = `embedding` 段（**可缺**——缺 ⇒ 服务照起；嵌入面禁用语义 = `/v1/embeddings` ⇒ 404 `model_not_found` 消息明示未配置，控制台向量卡「未配置」态可创建）；**嵌入模型不入通用模型列表**（单独命名空间）」。
2. **功能点 15①**（`:60` 区）：向量卡句补「缺段 ⇒「未配置」态（不自动探活；填写保存即创建）」。
3. **功能点 17**（`:71` 区）：列表句补「（嵌入引擎模型不入本清单——单独命名空间）」。
4. **功能点 21②**（`:107` 区）：**删「嵌入行 = —」**（嵌入模型不入列表——本批裁）。
5. **AC-6**（`:153`）：补判据「缺 `embedding` 段 ⇒ 服务照常起；`/v1/embeddings` ⇒ 404 `model_not_found`（消息明示未配置——零新码）∥ 引擎模型不入 `/v1/models`（chat 清单零引擎行——派发面零动）」。
6. **AC-15①**（`:163`）：向量卡句补「缺段「未配置」态 + 创建」。
7. **AC-28**（`:180`）：补「⑨ 缺段创建（向量卡未配置态 ⇒ 保存即建段；缺段档 PATCH 他键过门）」。
8. **变更记录** +1 行（2026-10-09 · 嵌入面解耦 · 用户 17:24 两条之 1/2）。
9. **计数**：功能点/AC 编号**零增**（均 = 收正既有条目）——条数不变显式。

### 2.8 披露 / 落修 / 上抛（报告项）

- **[上抛·待裁] 披露（不阻塞）**：`/api/system.embedding.model` 保留下发（用户面提示条——非「模型列表」面）∥ `GET /api/admin/embedding` 端点保留（UI 消费者已退场——契约零动）∥ 控制台删除/清空 `embedding` 段不做（缺段 = 编辑配置文件）——如用户意图不同 ⇒ 回笔。
- **落修（一致性面——登记）**：`design/PROJECT.md` §7 补 AC-27/AC-28 两行滞账（前两批漏登——沿 R40② 先例；不改任何语义，纯登记）。
- **随正件（父侧落——实施轮同拍）**：十件断言件（旧「引擎模型入清单/入页」断言面，清单与坐标 = `design/PROJECT.md` §6 注⑭）+ `thincoder-server/package.json`（32 ⇒ 33）。
- **部署收尾（父侧——ECS，可选）**：镜像重建 + 重收敛 + `/v1/models` 实走核对（模型清单零引擎行）。

### 2.9 与在飞批交集（`2026-10-09-server-console-config`——差异表；实读核）

| 交集面 | 在飞批（实读） | 本批 | 判定 |
|---|---|---|---|
| 向量卡（`views-system.mjs`） | 配置面 + 草稿探活（约 17:2x 落盘） | 「未配置」态叠加（缺段分支） | 同卡同节叠加——**实施序建议：其在先** |
| `config-admin.mjs` 合并/门 | 子键合并（已容缺段——实读 `isObject ? … : {}`） | 门随 validateConfig 改（缺段过门） | 相容——零行改动预期（以实施实读为准） |
| i18n `system` 部件 | +≈29 键 | +2 键（`vector.unconfigured*`） | 相容（键不重名） |
| 控制台门/探活 | 探活草稿三项明传优先 | 无草稿且缺配 ⇒ 400 分支 | 同层叠加（其口径不变） |
| `/v1/models`、`providers.mjs`、`embedding-admin.mjs`、`ops/config.mjs` | 零触 | 本批面 | 零冲突 |

### 2.10 机检读数与设计落点

- **`node scripts/doc-check.mjs` ⇒ EXIT 0**（悬空 0 ∥ 行宽 0（本批首检 1 行超宽 `design/PROJECT.md:283` ⇒ 机械拆行后复检 0）∥ 行数面差异 0）。
- **设计落点（逐档）**：`ops/OPS.md` §1（`embedding` 行「必填是⇒否」+ 启动校验句 + 配置写面块 ∥ §7 AC-6 行 ∥ §8 **KD-SV-57** ∥ §9 B33/B34/E22 ∥ §10 不做项 ∥ 变更记录）∥ `gateway/API.md` §1（两路由行）∥ §2.3（缺段 `null`）∥ §2.4（GET/test/PATCH 三行）∥ §4（rows/providers/embedding-admin/小计）∥ §5（AC-6/AC-15/AC-28）∥ §6 **KD-SV-58** ∥ §7（N4 改写 + N33/N34/B24/E25）∥ §8 ∥ 变更记录 ∥ `webui/WEBUI.md` §2.1（向量卡未配置态）∥ §2.2（键族 +2/−1）∥ §2.4③（列表/详情/不做）∥ §5（三行预算）∥ §6（AC-15①/AC-17①/AC-23②/AC-28 两行）∥ §8 ∥ 变更记录 ∥ `design/PROJECT.md` §4（索引 1–58）∥ §6（预算块 + 注⑭）∥ §7（AC-6/AC-15/AC-17 + AC-27/AC-28 落修）∥ §9 R47 ∥ 变更记录。

**fix 轮 1（承 §3 轮次 1 —— 评审发现 #1–#9 逐号收正）· eng-designer · 2026-10-09**

承 §3 轮次 1（changes-required：🔴#1 ∥ 🟡#2–6 ∥ 🔵#7–9——九项全数采纳；两处择一自裁 = #3（不渲染）∥ #9（400），记在对应行）。坐标 = 修复后当刻盘面。

| 号 | 级 | 收正内容 | 落点（file:line） |
|---|---|---|---|
| #1 | 🔴 | KD-SV-32 列表组成去 `embedding.model`（嵌入引擎模型退场——零引擎行，与 KD-SV-58 同拍） | `webui/WEBUI.md`:571 ∥ `design/PROJECT.md`:119 |
| #2 | 🟡 | 配额列死支「嵌入行 ⇒「—」」删净 | `webui/WEBUI.md`:219 |
| #3 | 🟡 | 缺配态定义（自裁 = 提示条**不渲染**——成员面不呈「未配置」态） | `webui/WEBUI.md`:27 ∥ :119-120 ∥ :541 |
| #4 | 🟡 | 注⑭补逐件「实读 2026-10-09 ⇒ ≤±N」注（十件）+ 本批 i18n 四部件现读（153 ⇒ ≈155 ∥ 138 ∥ 142 ⇒ ≈137 ∥ 141）+ `views-admin.mjs` ±0 注 | `design/PROJECT.md`:287-289 ∥ :199 ∥ `webui/WEBUI.md`:523/:524/:528/:529 ∥ :506 |
| #5 | 🟡 | 七件门禁件数断言（32 ⇒ **33**——注释同拍）登记 + 板级/§5.1 链收正（⇒ 33 件；组成式 18 ⇒ 19 ⇒ 20 件） | `design/PROJECT.md`:287 ∥ :206-207 ∥ `ops/OPS.md`:112-113 |
| #6 | 🟡 | 配置控制台批落地实读收正基数（陈值删）：96 ⇒ **实读 110** ⇒ ≈118 ∥ 252 ⇒ **实读 256** ⇒ ≈258 | `gateway/API.md`:129 ∥ `ops/OPS.md`:239 |
| #7 | 🔵 | 「候补——需求档落点 = 主 agent」六处收正「已落需求档」（AC-6 ∥ AC-28×3 ∥ AC-26×2——先批滞留同笔清；需求档 :153/:178/:180 已在盘） | `ops/OPS.md`:259/:260 ∥ `gateway/API.md`:149 ∥ `webui/WEBUI.md`:557/:559 ∥ `design/PROJECT.md`:322 |
| #8 | 🔵 | `/v1/embeddings` 行粗体闭合（行尾补 `**`——零语义） | `gateway/API.md`:28 |
| #9 | 🔵 | `embedding: null` ⇒ **400** 明写（自裁 = 清空段不做——禁用 = 编辑配置文件） | `gateway/API.md`:102/:220 ∥ `ops/OPS.md`:67 |

变更记录：四设计档各 +1 行——`webui/WEBUI.md`（#1/2/3/4/7）∥ `design/PROJECT.md`（#1/4/5/7）∥ `gateway/API.md`（#6–9）∥ `ops/OPS.md`（#5–7 ∥ 9）。

机检（修复后 · 2026-10-09）：`node scripts/doc-check.mjs` ⇒ **EXIT 0**——锚 0 悬空（闸态）∥ 行宽 0 超 300（区带豁免在效）∥ 行数面差异 0。写入面 = 四设计档 + 本段；需求档 ∥ `metering/METERING.md` ∥ 配置控制台批预算块零触。待复评（评审轮 2）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

设计评审（批 server-embedding-decouple——设计轮；对象 = 四设计档 + 需求档回笔；五档全读；无项目标准档 ∥ 无文档地图声明 = 判据降级面）

| # | 类别 | 严重度 | 发现 | 建议 |
|---|---|---|---|---|
| 1 | 文档归属 | 🔴 | `webui/WEBUI.md:570`（§7 KD-SV-32）与板级索引 `design/PROJECT.md:119` 仍载「列表 = `providers` 展平 + `embedding.model`——与 `/v1/models` 同源」，而 KD-SV-58（`gateway/API.md:161`）∥ `webui/WEBUI.md:217` ∥ §6 AC-17①（`webui/WEBUI.md:542`）定「控制台服务模型页零引擎行」——同一机制（服务模型页清单组成）两处描述不一（本批改点未扫 KD-SV-32/索引行） | 收正 `webui/WEBUI.md:570` 与 `design/PROJECT.md:119` 两行（清单组成去 `embedding.model`），与 KD-SV-58 同拍；WEBUI 变更记录补记 |
| 2 | 文档卫生 | 🟡 | `webui/WEBUI.md:218` 配额列残留死支「嵌入行 ⇒「—」」——同行前半句已述「**嵌入引擎模型不入本列表**」，且需求档同款失效表达式已按 R47 删净（`requirements/PROJECT.md:283`「§2:21② 删「嵌入行 = —」（**失效表达式**——嵌入行已不存在）」） | 删该半句（与 §2.4③ 前半句 ∥ §6 AC-23② 同拍），死支零残留 |
| 3 | 清晰度 | 🟡 | 缺配态（`gateway/API.md:86`「**缺 `embedding` 段 ⇒ `null`**」）下用户面提示条渲染未定义：`webui/WEBUI.md:119` 述「模型名经 `/api/system` 的 `embedding.model` 下发」、`webui/WEBUI.md:540` 判据「用户面提示条（模型名——零地址）」——管理面「未配置」态有判据，成员面零判据 | 补 null 支（隐藏/降级）口径并同拍 AC-15① 判据；`webui/WEBUI.md:27` 路由行随注 |
| 4 | 受影响文件注（8） | 🟡 | 注⑭（`design/PROJECT.md:283`）十件随正件只给坐标，缺「现读 ⇒ ≤±N」逐件行数注（先例 = 注⑫ `design/PROJECT.md:273`「逐件行数（实读 2026-10-08 ⇒ 预期增量）」）；i18n 四部件仅给「`i18n-{zh,en}-system.mjs` +2/表 ∥ `i18n-{zh,en}-admin.mjs` −1/表」（`design/PROJECT.md:199`）无现读，域档 §5 三行未随正（`webui/WEBUI.md:523` 仍 ≈151 ∥ `:522`/`:527` 仍 138 ∥ 142） | 按先例补逐件「实读 ⇒ ≤±N」注；i18n 四部件与 `views-admin.mjs` ±0 在域档 §5 行补注 |
| 5 | 方法论 | 🟡 | 本批 `package.json` 32 ⇒ 33（`design/PROJECT.md:200`）但七件门禁件数断言（32 ⇒ 33——注释同拍）未入注⑭/§6 随正件登记（先例 = 注⑬② ∥ `design/PROJECT.md:177`「门禁件数断言七件 N ⇒ N+1——注释同拍」）；板级行（`design/PROJECT.md:206`「`prepublishOnly` 清单 30 ⇒ 31 ⇒ **32 件**」）与 `ops/OPS.md:113`（「**32 件**（八 + #962/#963/i18n/#972 件 + 后续各批 18 ⇒ 19 件——本批件入链）」）现值链未同拍 | 补登记七件门禁件数断言随正（32 ⇒ 33）并入 §6/注⑭；板级行与 `ops/OPS.md` §5.1 链补「⇒ 33」+ 组成式「19 ⇒ 20 件」 |
| 6 | 受影响文件注（8） | 🟡 | 同批行数基两处不一：`design/PROJECT.md:197`「`embedding-admin.mjs` 实读 **110** ⇒ ≈118」vs `gateway/API.md:129`「⇒ ≈108（本批：草稿三项明传优先 +≈12——实读待回填）」；`design/PROJECT.md:198`「`README.md` 实读 **256** ⇒ ≈258」vs `ops/OPS.md:239`「⇒ 实读 252」∥「⇒ ≈264（配置控制台批：§6 控制台节随正 ∥ 配置写面句 +≈10」 | 统一基数（配置批已落 ⇒ 域档两行回填实读；未落 ⇒ 板级行两值标估），两档同拍 |
| 7 | 文档状态 | 🔵 | 「候补——需求档落点 = 主 agent」标记未随 AC 落盘收正：`ops/OPS.md:259`（AC-6——需求行已在盘 `requirements/PROJECT.md:153`「**缺段 ⇒ 404 `model_not_found` 明示未配置（服务照常启动）**」）∥ `gateway/API.md:149` ∥ `ops/OPS.md:260` ∥ `webui/WEBUI.md:558`（AC-28——需求行已在盘 `requirements/PROJECT.md:180`；板级行已收正 = `design/PROJECT.md:321`「已落需求档」）；另 `webui/WEBUI.md:556` ∥ `design/PROJECT.md:319`（AC-26——先批滞留） | 五处标记收正为「已落需求档」（先例 = 弹窗批/配置面批 fix 轮）；AC-26 两处同笔清 |
| 8 | 文档卫生 | 🔵 | `gateway/API.md:28`（`/v1/embeddings` 行）粗体标记未闭合（行内仅一处 `**`） | 行尾补 `**`（零语义） |
| 9 | 清晰度 | 🔵 | PATCH `embedding: null` 判定未列：载入面 null = 合法禁用态（`ops/OPS.md:38`「**缺位 ∥ `null` = 禁用态**」），写面 E25 只列「非对象（字符串 ∥ 数组）」（`gateway/API.md:220`），而「清空 `embedding` 段 = 不做」（`gateway/API.md:225`） | 明写 `embedding: null` 的判定（400 ∥ 允许），消清空面歧义 |

范围外注（无严重度）：同族「候补」标记亦见 `metering/METERING.md:85`（不在本评审清单）。

计数：🔴×1 ∥ 🟡×5 ∥ 🔵×3（共 9 条；🔴 = #1，须先解）

VERDICT: changes-required

### 轮次 2（评审子代理）

轮 2（复评——fix 轮 #13 后核 9 号收正；五档全文重读 + 明面件抽读）：

| # | Orig# | 落点 | 严重度 | 状态 | 核验 |
|---|---|---|---|---|---|
| 1 | 1 | `webui/WEBUI.md:571` ∥ `design/PROJECT.md:119` | 🔴 | Fixed | 两处去 `embedding.model`——「列表 = `providers` 展平——嵌入引擎模型退场（零引擎行——KD-SV-58…）」∥「零引擎行——KD-SV-58」；与 KD-SV-58/§2.4③/§6 AC-17① 同拍 |
| 2 | 2 | `webui/WEBUI.md:219` | 🟡 | Fixed | 配额列死支「嵌入行 ⇒「—」」删净（行止于「未设 ⇒「不限」（`common.quotaUnlimited`）；与 F 组单源…」） |
| 3 | 3 | `webui/WEBUI.md:27`/:120/:541 | 🟡 | Fixed | 「缺段（`embedding.model = null`）⇒ 整条不渲染——成员面不呈「未配置」态」三处同拍（AC-15① 判据含） |
| 4 | 4 | `design/PROJECT.md:199`/:288-289 ∥ `webui/WEBUI.md:506`/:523/:524/:528/:529 | 🟡 | Fixed | 注⑭ 补逐件「实读 ⇒ ≤±N」（十件）+ 门禁件数断言七件登记；i18n 四部件现读入档——抽读盘面逐值相符（i18n-{zh,en}-system 末行 :153/:153 ∥ -admin :138/:142；`-server-gateway-chat` 末行 :499） |
| 5 | 5 | `design/PROJECT.md:206`/:287 ∥ `ops/OPS.md:112-113` | 🟡 | Fixed | 门禁链 30 ⇒ 31 ⇒ 32 ⇒ 33 件（组成式 18 ⇒ 19 ⇒ 20 件）；七件断言 32 ⇒ 33 登记 |
| 6 | 6 | `gateway/API.md:129` ∥ `ops/OPS.md:239` ∥ `design/PROJECT.md:197-198` | 🟡 | Fixed | 基数统一实读 110/256——抽读盘面：`embedding-admin.mjs` 末行 :110 ∥ `README.md` 末行 :256 |
| 7 | 7 | `ops/OPS.md:259`/:260 ∥ `gateway/API.md:149` ∥ `webui/WEBUI.md:557`/:559 ∥ `design/PROJECT.md:322` | 🔵 | Fixed | 六处「候补——需求档落点 = 主 agent」收正为「已落需求档」（需求档 AC-6/AC-26/AC-28 在盘） |
| 8 | 8 | `gateway/API.md:28` | 🔵 | Fixed | 粗体闭合（行内 `**` 成对） |
| 9 | 9 | `gateway/API.md:102`/:220 ∥ `ops/OPS.md:67`/:315 | 🔵 | Fixed | PATCH `embedding: null` ⇒ 400 三处同拍 |
| 10 | (new) | `ops/OPS.md:226`/:240 | 🔵 | New | §6 `config.mjs` 行止于「实读 301」、小计止于 console 批「+≈19」——未带本批增量（板级 `design/PROJECT.md:198` 有「301 ⇒ ≈306」）；非 fix 引入，可与 console 批回填同笔收 |

计数：🔴×0 ∥ 🟡×0 ∥ 🔵×1（第 10 行——非阻塞；9 号全 Fixed）。

VERDICT: pass

## §4 用户批准（主 agent）

### 用户批准（主 agent 代签 · 2026-10-09 18:1x）

- **授权依据**：用户 2026-10-09 17:28「这个也自动跑完吧」= 新批全链自动（代点火 ∥ 代签 ∥ 派发 ∥ 核销）——§1 授权在案（自缚三条同前）。
- **评审链**：评审 #12（轮 1）= changes-required（9 条：🔴1 ∥ 🟡5 ∥ 🔵3）→ eng-designer fix 轮 #13 逐号收正 → **评审 #14（轮 2）= pass**（9 号全部 Fixed 核讫；新 🔵 一条 = OPS §6 两行注位——父侧已就地收：`config.mjs` 行补「⇒ ≈306」∥ 小计补「⇒ +≈7」）。
- **批准对象**：批 `2026-10-09-server-embedding-decouple` 设计（四设计档 + 需求档回笔）：① embedding 段可选 ⇒ 缺位/`null` = 禁用态（服务照起 + 启动警告；`/v1/embeddings` 404 `model_not_found` 明示；缺段档 PATCH 可创建；向量卡「未配置」态）；② 引擎模型退出通用清单（`/v1/models` = chat 前缀名清单；控制台同源派生随之）。机制全文 = KD-SV-57（`docs/server/design/ops/OPS.md` §8）∥ KD-SV-58（`docs/server/design/gateway/API.md` §6）。
- **派发**：eng-coder（initial）——产品面 14 档 + 批内件一件（`views-system.mjs`/`views-system-config.mjs` 二择落位——未配置态承载档以实读为准）≈15 档；随正件十件 = 父侧随收（不在派发面）。
- **范围红线**：`routes.mjs` 派发面零动 ∥ 零新依赖 ∥ 他批面零触。

## §5 实施记录（eng-coder）
**状态行**：实施完成（17/17 pass；回归子集失败全数归属随正件旧断言面；审计+评审判定 clean/pass）



**交付摘要**（本批两件：台账 #1147 嵌入面可选化 ∥ #1148 引擎模型退场；产品面 14 档 + 批内件 1 件）

- `src/ops/config.mjs`：嵌入段可选归一（缺位 ∥ `null` ⇒ `null`；非对象非 `null` ⇒ 拒启，报错明示「对象 ∥ null」两形）+ `normalizeEmbedding` 单源（配置载入 ∥ PATCH 门两径）+ `loadConfig` 缺段警告恰一条（文案逐字沿设计）。
- `src/gateway/routes.mjs`：`/v1/embeddings` 缺段守卫（404 `model_not_found`，消息明示未配置；零新码）；原派发判断行文本原样、仅下移一行，转发链零动。
- `src/gateway/embedding-admin.mjs`：GET 缺段两值 `null`；`resolveProbeTarget` 容 `null` runtime（回落值归 `null`）；缺配 ∧ 无草稿 ⇒ 400 `invalid_request_error`（携 `baseURL`+`model` 草稿照常探活）。
- `src/gateway/providers.mjs`：`modelList` 引擎行删净；引擎签名 `engineModel()` 保留（派发面消费）。
- `public/views-system.mjs`：向量卡未配置态（三输入空 ∥ 状态行「未配置」∥ 不自动探活 ∥ 提示句在册 ∥ 保存 = 创建段）；在场「先探后载值」自动探活体 `{}` 不回归；读档失败回落探活（不标未配置）。
- `public/views-models.mjs`：`deriveModels(providers)` 去第二参、引擎行 ∥ `quotaOf` 死支 ∥ 弹窗 `embedNote` 块删净；`public/views-admin.mjs` 调用点随正。
- `public/views-me.mjs`：成员面提示条 `model === null` ⇒ 整条不渲染（AC-15①——**设计落位表外档**，见决策表①）。
- i18n 四件：system 两表 `vector.unconfigured` ∥ `vector.unconfiguredHint`（+2）∥ admin 两表 `admin.models.embedNote` 退役（−1）；消费点零残留。
- `thincoder-server/package.json`：`prepublishOnly` 清单 32 ⇒ 33（本批件入链）。`thincoder-server/README.md`：嵌入段可选语义（§2 表缺位 ∥ `null` = 禁用态 ∥ §10 向量节）。
- 批内件：`docs/batches/2026-10-09-server-embedding-decouple.test.mjs`（实读 **579** 行；17 例：A1–A3 载入族 ∥ B1–B2 派发族 ∥ C1–C2 清单族 ∥ D1–D3 控制台数据面 ∥ E1–E6 界面/i18n/文案面 ∥ F1 依赖扫描）。

**验证读数**

- 批内件：`node --test docs/batches/2026-10-09-server-embedding-decouple.test.mjs` ⇒ **17/17 pass**（含事后补齐 2 条覆盖腿：D2 混填按字段回落 ∥ E1 en 新键零 CJK）。
- 回归子集（改动面直接相关）：`-server-console-config` **30/30** ✓ ∥ `-server-i18n` ✓ ∥ `-first-release-completeness` ✓ ∥ `-me-usage-charts-ui` ✓ ∥ `-models-config` ∥ `-me-keys-redo-ui` ∥ `-server-presets` ∥ `-server-gateway-webui-deploy` ∥ `-console-providers` 系 ∥ `-server-gateway-accounts/-metering` 等 ✓；失败全部落「引擎模型入清单/入页」旧断言面 + 门禁件数 32 ⇒ 33（随正件十件 = 父侧收，本批零写）。
- 静态：14 档 `node --check` 全 OK；批内件 F1（12 档 import）零第三方；E6（注释外零 CJK ∥ `t()` 字面量 ⊆ 表键）✓；`scripts/doc-check.mjs` 唯一 FAIL = `docs/server/design/PROJECT.md:196` 行宽（745 字符；`git status` 零改 ⇒ 存件、非本批写面）——**范围外发现，父侧裁**。
- 未跑：全仓套件（归父侧收口轮）∥ `prepublishOnly`（十件随正未落 ⇒ 必红，父侧同拍）。

**决策透明表**

① `public/views-me.mjs` 属设计落位表外：AC-15① 要求「成员面提示条缺段不渲染」，设计仅在行为面在册（`webui/WEBUI.md` §6 AC-15①），文件表/预算注未列本档；不改则判据无实现面 ⇒ 改 2 行（注释 + `if (model === null) return null`）并在此披露。
② `routes.mjs` 缺段判据取 `providerRuntime.get().engineModel()`（沿批档 §2.2「accessor 保留——派发面在用」），非设计 §2.1 字面 `config.embedding?.model ?? null`；两者在仓内全部构建点同源等价（`providers.mjs:181` ∥ `provider-admin.mjs:129`）。评审判 🔵 潜伏项，本批不改（🔵 出口 = 下批/台账）。
③ 批内件行数实读 579（设计估 ≈450）：**单件不拆**（设计档「批内件一件」+ 仓先例「越 500 软线…免拆（≤800）」）；评审列 🟡 advisory（非阻塞）。
④ 探活 400 判据 = `target.baseURL === null ∥ target.model === null`（任一归 `null`）；`apiKey` 空串属合法探发（不判 400）——沿 §2.4「标量三项明示优先」。
⑤ README 实读 256 行（净 ±0；设计估 ≈258）：语义确已落地（§2 表 ∥ §6 一条 ∥ §10），估差挂父侧回填。
⑥ `config-admin.mjs` 本批零改（设计「现件已满足」）：`embedding: null` 天然 400（非对象门）∥ 缺段档 PATCH 他键过门（门 = `validateConfig` 容缺段）∥ 缺段档建段子键合并——批内件 D3 逐条钉住。

**审计与代码评审轮次与终态**

- 发散审计（explore · 1 轮）：PARTIAL ∥ SILENT-SIMPLIFICATION ∥ DOC-DRIFT 三类**零发现**；列表外改动 1 条（= 决策表①，判「已报告可接受」）；轻覆盖缺口 2 条 → 本轮已补（D2 混填腿 ∥ E1 en 零 CJK）；硬边界复核（`routes.mjs` 派发行 ∥ 零第三方 ∥ `docs/server/**` 零写 ∥ 十件随正零写 ∥ 他批面零触）✓。
- 代码评审（advisor type=code · 1 轮）：`VERDICT: pass` —— 0 🔴 ∥ 1 🟡（批内件 579 行越 500 软线，advisory 非阻塞）∥ 3 🔵（未配置态「用法」行取 `—` 与禁用语义相抵 ∥ README 行数估差 ∥ `routes.mjs` 同源假设潜伏项）。
- fix round：**1 轮**（仅批内件覆盖补齐；产品面零改）；评审后零改（🔵 按规则出口下批/台账；🟡 非阻塞）。
- 终态：**clean**。

## §6 验证与收口（父代理）

### 验收与收口（父侧 · 2026-10-09）

**验证读数（收口轮亲跑）**

- 批内件 `docs/batches/2026-10-09-server-embedding-decouple.test.mjs`：**17/17 pass**（`node --test` 亲跑）。
- 随正件 **16 件**（反证清单收正）：**121/121 pass**。
- 门禁全链 `npm run prepublishOnly`（**33 件**链）：**277 跑 · exit 0**。
- `scripts/doc-check.mjs`：**EXIT 0**（悬空 0 ∥ 行宽 0 超 300）；本收口轮收正 `design/PROJECT.md:196` 回填行超宽（745 字符 ⇒ 折三行）。
- 实施轮随记：14 档 `node --check` ✓ ∥ 零第三方 import ✓（批内件 F1 腿）。

**随正件清单（16 件）**

- 设计注⑭十件：`-server-gateway`（清单 5⇒4 + 零引擎行断言换形）∥ `-server-gateway-chat` ∥ `-server-gateway-model-ref` ∥ `-console-provider-redo-runtime` ∥ `-console-providers` ∥ `-models-config-ui`（行序 3⇒2 ∥ confirm 拒段行序随动）∥ `-console-completeness-2`（`vector.` 键族 24⇒26）∥ `-console-modals`（NEW_KEYS 除名 ∥ derive 去参 ∥ 行序）∥ `-provider-model-metadata` ∥ `-quota-v2-member-models`（列表滤除断言翻转 ∥ 行序）。
- 名单外六件（实读补齐）：`-console-list-style` ∥ `-server-auto-update` ∥ `-console-layout`（模型页 tfoot 夹具 2⇒1；me/usage 夹具保持 3——本轮一次误改已自查回退）∥ `-me-usage-charts` ∥ `-quota-per-model` ∥ `-server-public-structure`（指纹双枚重锚 zh `444706c6…` ∥ en `1878488d…`；键数 368∥373 ⇒ **369∥374**）。
- 两处未登记断点（实施轮上抛）：`-server-public-structure:59` ∥ `-console-completeness-2:457`——本轮同收。
- 门禁件数断言七件（32⇒33）：`-console-list-style` ∥ `-server-auto-update` ∥ `-console-layout` ∥ `-me-usage-charts` ∥ `-provider-model-metadata` ∥ `-quota-per-model` ∥ `-quota-v2-member-models`——全收（注释/件名同拍）。

**预算回填**：产品面实读增量 ≈**+23**（估 ≈+27）∥ 批内件 **579 行**（估 ≈300）∥ 逐档实读落 `design/PROJECT.md:203-205`。

**评审余项出口**：code 评审（advisor · 实施轮）3🔵——README 行数估差 = 随回填收（实读 ±0）；「用法」行语义 ∥ routes 同源假设 = 入台账 **#1151 ∥ #1152**（归批）。

**自裁两处（已在场报与 §4 代签随记）**：缺段时成员面提示条不渲染 ∥ PATCH `embedding: null` ⇒ 400；如用户另裁 = 改点极小。

**暂缓批复核**：无（全库零活标记）。**前批遗留核对**：无（console ∥ ECS 两批已收口冻结）。

**结算行（收口轮）**

- 台账：#1147 ∥ #1148 → **已核销**；未决四态 = **89**（🔵 余项两行入池 = #1151 ∥ #1152）。
- 提交：`b51e511c`（33 档 · +802/−139 = 实现 14 ∥ 批内件 1 ∥ 随正件 16 ∥ 设计回填 1 ∥ 记录 1）——双推 origin/github ✓。
- 记录冻结 = 本收口动作（`batch close`）；暂缓批复核 = 无。
