# Thincoder Server · 团队台账（ledger/LEDGER）

> 板块 = server ∥ 本档 = ledger 域（团队台账——团队共享工作台账：数据形 ∥ 两面族端点 ∥ 判权 ∥ 老化 ∥ 审计 ∥ 上送）；板总览 = `docs/server/design/PROJECT.md`（文档地图 = §3）。
> 需求单源 = `docs/server/requirements/PROJECT.md`（功能点 32 ∥ AC-32）；本域回指 = `docs/server/design/PROJECT.md` §7（AC-32 判据 = 本档 §10 ∥ `docs/server/design/webui/LEDGER.md` §4 ∥ `docs/core/design/TEAM-LEDGER.md` §6）。
> 权限模型单源 = `docs/server/design/project/PROJECTS.md` §3（能力矩阵——团队账 = `can.write` 的首个端到端消费者，兑现其 §12 R67）；端点单源 = `docs/server/design/gateway/API.md` §2.10（本档 §5 = 摘要 + 指针）；控制台面 = `docs/server/design/webui/LEDGER.md`；端侧面 = `docs/core/design/TEAM-LEDGER.md`。
> 最近先例 = `docs/server/design/project/PROJECTS.md` §3（B2 能力矩阵——KD-SV-115–128）∥ `docs/core/design/LEDGER.md` §3/§5（本机台账六态与老化判据）；对齐 = 判权与状态语汇逐字沿先例；偏离 = 数据形自持（服务端单表 + 全局编号 + 零离线——需求裁）∥ 仓 = 归一地址（B2 `projects.address` 同形）。

## 1. 定位与形态

- **一句话**：团队共享**一本工作台账**（谁在做什么 ∥ 团队待办 ∥ 老化项 ∥ 交接）——**数据层全局一本**、**键 = git 源**（跨机同仓共享）、**编号 = 全局唯一**（跨本引用可解析）、**住服务端**（登录后可用）。
- **两账独立**（需求 ③）：团队账与本机台账是**两条独立的账**——本机账照旧（离线可用 ∥ 零改）；团队账 = 服务端账；**不做「同一份账随登录换后端」**。
- **形态**：单表（`team_ledger_items`）+ 两面族端点（控制台 `#/me/ledger` ∥ 端侧核工具 `team_ledger`）+ 审计一型（`ledger_event`）+ 库迁移一段（v20）。
- **零离线**（需求 ④）：未登录 ∥ 断网 ⇒ 团队账不可用（明示人话）；**零缓存 ∥ 零本地副本 ∥ 零离线读**。
- **写时零门槛**（需求 ②）：直写服务端——零审批 ∥ 零去重拦截（条目自带来源：谁 ∥ 何时 ∥ 哪个仓）。

## 2. 关键决策（本域）

| # | 决策 | 理由 |
|---|---|---|
| KD-SV-139 | **新立 `ledger` 域**（代码 `src/ledger/` ∥ 档 = 本档；否并入 `project` ∥ `client` 域） | 职责独立（台账本体 ∥ 两族端点 ∥ 老化 ∥ 判权消费——与「项目与权限自身」「客户端接入骨架」不同层）；文档热面隔离（`docs/server/design/project/PROJECTS.md` 多域共触——新域 = 新并发隔离单元）；端点面自成一族（`/api/ledger*` + `/api/client/ledger*`） |
| KD-SV-140 | **数据形 = 单表 `team_ledger_items`**：全局自增编号 ∥ 仓 = 归一地址（B2 `projects.address` 同形）∥ 行形十列（§3） | 「全局一本」（需求 ①：数据层无分本）⇒ 单表 + `AUTOINCREMENT` = **全队一号空间**（跨本引用可解析）；仓 = 跨形归一（`http/https/ssh/scp` 同键——「跨机同仓共享」成立）；行形覆盖需求面点名五件：状态 ∥ 仓 ∥ 归属 ∥ 老化 ∥ 标题+正文 |
| KD-SV-141 | **状态机 ∥ 老化判据 = 沿本机台账逐字**（六态 + `ALLOWED_MIGRATIONS` + `aged = 未决四态 ∧ 行龄(updated_at ?? created_at) > 30 天` + **核销边只有一条 `待核销 → 已核销`**——§4） | AC-32 点名「未决/在途/老化」= 本机台账既有词汇（同判据在 `docs/core/design/LEDGER.md` §3/§5）——同一团队两处账共用一套状态语汇（认知迁移零成本 ∥ 上送无翻译层）；**存储与代码独立**（本域零 import 本机台账模块——「禁混同」靠结构不靠约定） |
| KD-SV-142 | **两面族**：控制台面 `/api/ledger*`（会话 cookie——能力矩阵）+ 端侧面 `/api/client/ledger*`（Bearer 登录 token）——**共享域模块单源**（`src/ledger/items.mjs`） | 判权分族沿全站口径（`/v1` Bearer ∥ `/api/*` cookie ∥ `/api/client/*` Bearer——B1 KD-SV-62 三分；端侧命名空间 B1 已钉「后续团队面同空间扩端点」）；两面 = 薄适配器（校验/判权/序列化），语义单源在域模块 |
| KD-SV-143 | **判权 = B2 项目能力矩阵**（读 = `can.view` ∥ 写 = `can.write`；未授权即不可见——列表零出现 ∥ 直取 404 不辨）+ **未登记仓 ⇒ 拒写** | 需求 §1 前置件（权限与可见性 = 跨面统一判据，含台账）+ `docs/server/design/project/PROJECTS.md` §3 判据 3（`can.write` 消费者 = 团队台账——兑现其 §12 R67 的端到端写动作）；仓 = B2 项目实体 ⇒ 加仓 = admin 专属（AC-44①）——**团队账不为未登记仓建档**（否则绕过项目准入层） |
| KD-SV-144 | **端侧仓标记 = 自动派生**（会话项目根 ⇒ `git rev-parse --show-toplevel` + `git config --get remote.origin.url` ⇒ **原文上送** ⇒ **服务端归一**） | 需求 ①「写时自动带上，不手挑」；**归一单源** = `project/projects.mjs` `normalizeAddress`（域外直引——零复制；触发条件：将来拆域独立 ⇒ 提升为共享件）；端侧零归一实现 ⇒ 两处不可能漂移 |
| KD-SV-145 | **上送 = 工具面组合（零跨账代码路径）**：agent 读本机账 ⇒ `team_ledger` 写团队账（两步显式动作） | 需求 ⑤（显式 ∥ 单向一次性 ∥ 禁自动映射/双向/合并）——**结构保障**：团队模块零 import 本机台账模块（`import` 面机检）；零回写 ∥ 零链接（无 `local_id` 族字段）∥ 零去重（需求 ②）；两账键不同（本地目录 vs git 源）本无自动对应 |
| KD-SV-146 | **审计 = 新增一型 `ledger_event`**（四 kind：`create` ∥ `edit` ∥ `close` ∥ `withdraw`；v20 CHECK 重建——**十五型**） | 写时零门槛 + 共享账 ⇒ 过程留痕是唯一追溯面（谁改的 ∥ 谁撤回的）；沿全站审计纪律（各域状态变更落审计行）；detail 携 `id`/`repo` + `surface`（`console` ∥ `client`——两面写入可辨） |
| KD-SV-147 | **项目删除 × 团队账 = 不级联**（账保留；可见性 = 现存项目行判定） | 账 = 记录（B2 §14 删「项目」≠ 删「该仓的工作记录」）；可见性自然收敛（无项目行 ⇒ 非 admin 不可判 ⇒ 不显示；admin 恒可见）；仓 = 文本键非 FK（沿 B2「无 FK」先例——零孤儿面） |

## 3. 数据形（单表 · 全局编号 · 仓标记）

**表 = `team_ledger_items`**（DDL 单源 = `docs/server/design/store/STORE.md` §2 v20 段）；行形十列：

| 列 | 语义 | 判据 |
|---|---|---|
| `id` | **全局编号**（单表自增——全队一号空间） | 跨仓/跨本引用可解析；界面展示不加前缀 |
| `repo` | **仓标记** = 归一口径 `host[:port]/path`（B2 `projects.address` 同形） | 写时自动带上（端侧派生 ⇒ 服务端归一）；非 FK（KD-SV-147） |
| `status` | 六态：`待讨论` ∥ `待设计` ∥ `在途` ∥ `待核销` ∥ `已核销` ∥ `已废弃` | CHECK 枚举；迁移 = `ALLOWED_MIGRATIONS`（KD-SV-141）；`已核销`/`已废弃` = 归档态 |
| `title` | 标题（谁在做什么） | 建时必填（trim 非空 ∥ ≤200） |
| `detail` | 正文/说明（自由文） | 可空（≤4000；收口不收正文门——见 §4 核销边一条） |
| `owner` | **负责人**（归属；统一用户名键） | 非空（建缺省 = 创建者）；形校验沿 B2（trim 非空 ∥ ≤64 ∥ 无 `/`）；**不要求现存账号**（平台名册可先行——沿 B2 KD-SV-116） |
| `created_by` | 谁（写入者用户名） | 服务端自动（端侧 = token 主体 ∥ 控制台 = 会话主体） |
| `created_at` / `updated_at` / `closed_at` | 何时（ISO 文本） | 老化行龄源 = `updated_at ?? created_at`（KD-SV-141） |

- **数据层无分本**（需求 ①：「全局一本」）——「按仓」仅在视图层（两端视图 + 控制台筛选）。
- **老化**（`aged`）= 计算字段（不入库）：未决四态 ∧ 行龄 > 30 天 ⇒ `true`；时间戳缺/不可解析 ⇒ `false`（零假阳——沿本机台账降级口径）。
- **索引**：`(repo, status)`（筛选主查询）∥ `(owner)`（按负责人筛）。

## 4. 写路径（直写 · 零门槛）

- **建**：`repo`（端侧派生原文 ∥ 控制台选自可见可写项目）+ `title` + `detail?` + `owner?` ⇒ 行落库；`status` 恒 `待讨论`（首态固定——推进走「改」）；`created_by`/`created_at` 服务端填。
- **改**：`title?` ∥ `detail?` ∥ `owner?`（交接 = 换负责人）∥ `status?`（**值域 = 迁移表合法后继**——非法 ⇒ 400 人话）；`updated_at` 随写。
- **收口/撤回**（close）：`status ∈ {已核销, 已废弃}`——`已核销` **只自 `待核销`**（勾销）；`待讨论` / `待设计` / `在途` ⇒ 400 人话（现态点名 + 出路 = 先 `PATCH` 推进到 `待核销` 再收口）；`已废弃` = 任意未归档态（软删除——行保留）。
- **核销边只有一条**：`待核销 → 已核销`。`待讨论` / `待设计 → 已核销` 那条边不存在——四个未决态各代表一件事实（`待设计` = 设计没写 · `在途` = 有人认领在干 · `待核销` = 做完了等结账），一步跨过去等于允许「没设计、没人认领、没验证」的行显示为已结账。判据 = 域模块 `closeItem` 的源态判；判序 = 目标态判 → 行取与写权 → 归档态门 → 源态判（`src/ledger/items.mjs` 的 `closeItem` 语句序；同一条规则的本机台账面 = `docs/core/design/LEDGER.md` §3，两面同序）。
- **不收正文门**：核销只看源态，不看 `detail` —— 结账依据写在 `evidence`（本机台账面）∥ `detail`（本面，自由文），不是收口的前置条件。「条目在别处完成」的走法 = 先推进到 `待核销`，再收口，不给捷径边。
- **终态**：`已核销`/`已废弃` 行再动 ⇒ 400（人话）。
- **零门槛**：无审批 ∥ 无去重拦截（同题两条皆落——需求 ② 明载）。
- **仓不可改**（编辑态）：仓 = 记账键（改了账对不上——沿 `docs/server/design/project/PROJECTS.md` §3 判据 8 同精神）；确需改 ⇒ 撤回后重建。

## 5. 读路径与端点（摘要 + 指针）

| 面 | 端点（四行一件） | 判权 |
|---|---|---|
| 控制台面 | `GET /api/ledger?repo=&status=&owner=` ∥ `POST /api/ledger` ∥ `PATCH /api/ledger/:id` ∥ `POST /api/ledger/:id/close` | 会话 cookie + `can.view`/`can.write`（KD-SV-143） |
| 端侧面 | `GET /api/client/ledger?repo=&status=&owner=` ∥ `POST /api/client/ledger` ∥ `PATCH /api/client/ledger/:id` ∥ `POST /api/client/ledger/:id/close` | 登录 token（Bearer）+ 同上（同一域模块） |

- **过滤三轴**（两面同参）：`repo`（归一后精确匹配 ∥ 缺省 = 不过滤）∥ `status`（六态——枚举外 ⇒ 400）∥ `owner`（用户名精确匹配）。
- **列表响应**：控制台面携 `repos[]`（可见项目 + `canWrite` 读数——筛选选单/新建选单/行写权的**渲法源单源**）；两面同携 `items[]`（行形含 `aged`/`canWrite`）与 `total`（过滤后计数——不设分页：体量级数十）。
- **视图默认当前仓 = 端侧默认**（需求 ①）：端侧工具缺省 `scope = 当前仓`（自动派生——与写路径同源）；控制台 = 全队（`repo` 缺省不过滤）+ 按仓筛（「抹平一本 ∥ 分本视图差」）。
- 端点全文（逐行语义/载荷/错误）= `docs/server/design/gateway/API.md` §2.10（单源）；错误形 = 全码沿用（**零新码**——400/401/403/404 族）。

## 6. 上送（显式 · 单向一次性）

- **径**：agent 读本机账（`ledger` 工具）⇒ 取内容 ⇒ `team_ledger add` 写团队账——**用户指令下的显式两步**（需求 ⑤「用户授权下执行」）。
- **结构保障**（KD-SV-145）：本域代码零 import 本机台账模块（机检 = 本域文件 import 面）；**零回写**（写团队账不改本机行）∥ **零链接**（无来源外键/无对应表）∥ **零自动**（无后台同步/映射/合并路径）。
- **反向同理**：改本机条 ⇒ 团队条零变（反之亦然）——两账各自独立演进。

## 7. 审计

- 型 = `ledger_event`（`docs/server/design/accounts/ACCOUNTS.md` §2.1 事件目录新增行）；四 kind：`create` ∥ `edit` ∥ `close` ∥ `withdraw`（`close` 端点的两种落点分记）。
- detail = `{ kind, id, repo, surface }`（`surface` = `console` ∥ `client`——两面写入可辨）；主体 = 操作者（actorId = 成员 id）。
- 四动作皆落行（读动作零审计——沿全站口径）；保留窗 = 与用量同窗（`usageRetentionDays`——沿 KD-SV-28）。

## 8. 界面承载与端侧承载

- **控制台（周知面）** = `#/me/ledger`（列表 ∥ 按仓/状态/负责人筛 ∥ 新建/编辑/收口/撤回）——全文 = `docs/server/design/webui/LEDGER.md`。
- **端侧（三端）** = 核工具 `team_ledger`（读写经 `/api/client/ledger*`）——三端由**核单源**保障（全文 = `docs/core/design/TEAM-LEDGER.md`）。
- **不做逐端独立面板**（CLI 状态行 ∥ VSC 面板 ∥ 桌面卡片）——承载分工与理由 = `docs/core/design/TEAM-LEDGER.md` §4；如需 ⇒ 另轮三端同做。

## 9. 本域文件与行数预算（本域族行）

| 档 | 行数 | 职责 |
|---|---|---|
| `thincoder-server/src/ledger/items.mjs` | 310 | 域逻辑：入参归一 ∥ 六态迁移校验 ∥ 老化计算 ∥ 可见/写权判定（消费 B2 能力矩阵）∥ 四动作 + 审计行 |
| `thincoder-server/src/ledger/routes.mjs` | 51 | 控制台面（会话 + 能力矩阵；`repos[]` 派生） |
| `thincoder-server/src/ledger/client-routes.mjs` | 50 | 端侧面（Bearer——复用 `requireApiKey`；`repo` 原文归一） |
| `thincoder-server/src/store/migrations/ddl-v12-v20.mjs` | 211 | v20 段（DDL 单源 = `docs/server/design/store/STORE.md` §2 v20 段）；`src/store/db.mjs`（30 行）= 开库/PRAGMA + 迁移链再导出，逐段 DDL 在 `src/store/migrations/` |
| `thincoder-server/bin/thincoder-server.mjs` | 314 | 装配面（注册行制） |
| `thincoder-server/src/agent/run.mjs` | **±0**（`TRIMMED_FACES` 表项同行扩——数组单行；注释同拍——服务端 admin agent 零团队登录 ⇒ 工具不可用；裁剪 = 零 token 税 + 结构不可达） | 服务端 agent 工具裁剪面 |
| `thincoder-server/src/project/projects.mjs` | **±0**（`normalizeAddress` 域外直引——零复制零改） | 归一单源（KD-SV-144） |
| `thincoder-server/src/accounts/audit.mjs` | 121（`AUDIT_TYPES` += `ledger_event`——十五型；头注计数同拍） | 审计型目录（型面单源——`docs/server/design/accounts/ACCOUNTS.md` §2.1 随正） |

- **行数口径**：上表 = 档总行数（**LF 计数** = `split(/\r?\n/)`，与字节侧 `\n` 计数同值——2026-11-02 实读）。不用 `Get-Content … .Count`：它在纯 LF 档上偏低（同一档实测 `.Count` = 289、LF = 310，差 21 行；核侧同错差 140 行）⇒ 换把尺子，别再吃这个亏。**余行仍为旧尺读数**，量法统一轮重读一遍（本域最大 = `items.mjs` 310，已按 LF 校正）；`±0` = 本域零改动档。
- **测试档 = 无**：`thincoder-server` 下 `*.test.mjs` 零档 ⇒ 本域 §11 用例表是判据设计，没有可跑的机检载体。
- **软线读数**：本域各档均低于 500 软线（本域最大 = `src/ledger/items.mjs` 310，LF 口径）；表内另两行 = 跨域读数（装配面 `bin/thincoder-server.mjs` 314 ∥ 域外 `src/project/projects.mjs` 352），本域只记不判。`docs/server/design/store/STORE.md` §4 的 >700 触发线不涉本域。

## 10. 验收判据（AC-32 ①–⑥ 对位）

> **条序映射（一处定音）**：需求分条（`docs/server/requirements/PROJECT.md` §2:32——① 全局编号/仓标记 ∥ ② 直写零门槛（团队账） ∥ ③ 两账独立 ∥ ④ 无离线 ∥ ⑤ 显式上送 ∥ ⑥ 界面维护管理）↔ AC-32 行序（本表左→右——① 两账独立 ∥ ② 登录后可见（含仓标记） ∥ ③ 编号全局 ∥ ④ 直写 ∥ ⑤ 无离线 ∥ ⑥ 显式上送）——两套同号异义：引用「需求 N」= 分条 ∥「AC-32N」= AC 行序。

| 需求 AC | 设计级判据 | 载体 |
|---|---|---|
| AC-32① 两账独立（个人账本机照旧——未登录可用 ∥ 键 = 本地目录） | 本机台账零改（`thincoder-core/ledger*.mjs` 面零 diff——机检 = 既有回归档）；团队账 = 独立表 + 独立工具（无共享存储/无共享代码路径 —— import 面机检）；未登录 ⇒ 团队账明示不可用而本机账照常（用例 N1/B1） | 无测试档（§9）+ 收口轮 |
| AC-32② 团队账登录后可见（三端 + 周知面同源；未决/在途/老化/归属；每条带仓标记——写时自动） | 端侧工具登录态门（未登录/失效/不可达三态人话）；服务端单库同源（控制台面 ∥ 端侧面同模块）；行形携 `status`/`aged`/`owner`/`repo`（四件在列——§3）；仓标记自动（KD-SV-144——用例 N2/N3/B2） | 无测试档（§9）+ 收口轮（三端实走） |
| AC-32③ 编号 = 全局唯一（跨本引用可解析） | 单表 `AUTOINCREMENT`（跨仓两建 ⇒ 编号不复用——用例 N4）；界面与工具面同显 `id` | 无测试档（§9） |
| AC-32④ 写入 = 直写服务端（零门槛 ∥ 零去重拦截） | 写端点无审批/无查重支（同题两条皆落——用例 N5）；403/404 仅来自能力矩阵（非门槛门） | 无测试档（§9） |
| AC-32⑤ 无离线缓存 | 端侧工具零本地持久化（无缓存文件/无落盘路径——机检 = 本域文件零写盘面）；断网/未登录 ⇒ 明示失败（用例 B1/E1）；本机账零涉 | 无测试档（§9）+ 收口轮 |
| AC-32⑥ 个人 ⇒ 团队仅显式上送（零自动映射 ∥ 零双向同步） | 团队模块 import 面零本机台账（机检）；上送 = 两步工具动作（§6）；上送后两账互不影响（用例 E2/E3） | 无测试档（§9） |
| 需求 ⑥ 界面维护管理（列表 ∥ 按仓/状态/负责人筛 ∥ 新建/编辑/收口/撤回） | 控制台面判据 = `docs/server/design/webui/LEDGER.md` §4（逐动作 + 逐筛）；权限感知渲染（`canWrite` 读数——服务端同判） | 无测试档（§9）+ 收口轮（浏览器实走） |

## 11. 用例表（输入/预期——载体见 §9）

| # | 用例 | 判据 |
|---|---|---|
| N1 | 未登录 ⇒ 端侧 `team_ledger query` | 明示「未登录」人话；零网络调用；本机账（`ledger query`）照常可用 |
| N2 | 端侧建一条（cwd 于仓 A——origin 形 `git@host:org/repo.git`） | 落行：`repo` = 归一形 `host/org/repo` ∥ `status` = 待讨论 ∥ `created_by` = token 主体 ∥ `owner` = 创建者（缺省） |
| N3 | 端侧 `query`（缺省 scope） | 仅该仓行；`scope:"team"` ⇒ 跨仓行（编号连续） |
| N4 | 仓 A/仓 B 各建一条 | 编号不重（全局一号空间）；界面/工具同显 |
| N5 | 同题两条先后写 | 两条皆落（零去重）；零门槛（无 403 除权属判定） |
| B1 | 断网 ⇒ 端侧 `query`/`add` | 明示「服务器不可达」失败；零缓存回读（重试不落旧值） |
| B2 | cwd 非 git 仓 ∥ 无 origin ⇒ `add` | 明示「未检出 git 源」人话；零写库 |
| B3 | 仓未登记（B2 项目表无该地址）⇒ `add` | 400 人话（「该仓未登记——请先在控制台登记项目」）；零写库 |
| B4 | 换管理员视角：非成员读该仓条目 | 列表零出现；直取 ⇒ 404 不辨 |
| B5 | `read` 档成员 ⇒ `add`/`update`/`close` | 403 人话；`can.view` 仍真（读面在） |
| B6 | 已归档行（已核销/已废弃）再 `update`/`close` | 400 人话；库零变 |
| B7 | `close` 一条 `待讨论` 行 ∥ 一条 `待设计` 行 ∥ 一条 `在途` 行（都不带 `detail`） | 三条各自 400 人话：核销仅限 `待核销`（现态点名）+ 出路句；行状态零变、`closed_at` 仍空（`待讨论 → 已核销` 这条边不存在，不是正文门） |
| B7b | 同一 `待讨论` 行先 `PATCH status` 推进 `待设计` → `在途` → `待核销`，再 `close` | 三步迁移全过、`close` 通过、`closed_at` 落值（「条目在别处完成」的走法） |
| B8 | 老化：`now` 注入 + 未决行行龄 31 天 / 30 天整 | `aged` = true / false（阈值边界） |
| B9 | 非成员（无 `can.view`）⇒ `add` 该仓 | 404 不辨（措辞 = 「项目不存在或不可见」——同项目面口径；沿 B4/B5 体例）；零写库 |
| E1 | 401（token 失效）∥ 403（无权）∥ 404（不可见）三态 | 三态各明示人话（端侧：失效 ⇒ 「请重新登录」）；零缓存副作用 |
| E2 | 上送后改本机条 | 团队行零变（零回写——字段逐值） |
| E3 | 上送后改/撤团队条 | 本机行零变 |
| E4 | 审计：四动作各一 ⇒ 查审计 | `ledger_event` 四 kind 行在场（`surface` 分列）；载 `id`/`repo` |

## 12. 边界（本域不做面）

- **不做离线缓存**（需求 ③④ 明禁）；**不做「换后端」路径**（个人账/团队账无共享代码路径）。
- 不做**分页 ∥ 导出 ∥ 全文检索**（体量级数十；超量另裁）。
- 不做**看板/统计/趋势/图表**（报表面属 metering 域；如需另立）。
- 不做**评论/附件/@提及/通知**（在场与通知 = 需求 34，另轮）；不做**条目间依赖/父子关系**。
- 不做**逐端独立面板**（CLI 状态行 ∥ VSC 面板 ∥ 桌面卡片——承载 = 核工具 + 控制台页；需另轮三端同做）。
- 不做**服务端管理面 agent 的台账工具**（admin agent 工具面裁剪面 += `team_ledger`——服务端零团队登录，结构不可达）。
- 不做**跨账迁移/导入向导**（上送 = agent 两步动作——无专用导入器）；不做**团队账 → 本机账**回送（需求 ⑤ 明禁双向）。
- 不做**权限模型改造**（判权 = B2 能力矩阵逐字——零新档位/零新表）。

## 13. 上抛/余项

| # | 项 | 类型 | 处置建议 |
|---|---|---|---|
| R74 | **团队台账——披露**：① **披露（判权读法）**：团队账可见/可写 = B2 项目能力矩阵（`can.view`/`can.write`）——「控制台全队」读法 = 数据层一本 + 权限过滤（非「全员可见全量」；非成员项目条目不显示）；仓须先经 B2 登记（加仓 = admin）⇒ 团队账不为未登记仓建档；如用户本意 = 全员无差别可见 ⇒ 翻案点（与需求 §1 前置件裁定相抵面需重裁）∥ ② 判权三态：仓不存 ⇒ 400 人话 ∥ 仓存而无 `can.view` ⇒ 404 不辨（措辞 = 「项目不存在或不可见」）∥ 可见而无 `can.write` ⇒ 403——设计面 = `docs/server/design/gateway/API.md` §2.10/§3 ∥ 本档 §11 B9。 | 披露（上抛——如无异议按设计实施） | 评审/用户复核 |
