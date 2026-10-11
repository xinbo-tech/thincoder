# 2026-10-11 · sandbox-image-sources（镜像源族）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-11 · 来源 = 用户 2026-10-11 09:17 三点（镜像源管理 ∥ 源目录清单 ∥ 查找筛选）+ 09:19 补点（常用源预选）+ 09:20「开始吧，自动跑。」。
> 台账 = #1274（server · 归批）。前情 = docs/batches/2026-10-11-sandbox-docker-admin.md §6（已收口 2026-10-11；本批 = 其镜像面之外的源族补充）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 2026-10-11 09:17–09:20 · 需求讨论与授权（主 agent）

- **来源与入册**：用户 09:17 四点（① 镜像源管理 ② 列源上镜像目录 ③ 查找筛选 ④ 拉取走 proxy？）+ 09:19 一点（增源表单提供常用镜像源预选）；**④ 用户当场撤**（原话「走代理这个就算了」）⇒ 本批射程 = **①②③ + 预选**。需求落点 = `docs/server/requirements/PROJECT.md` §2:38 + AC-38（同轮入册：提交 `5e4979bb` ∥ `f4dfec48` 双推）；台账 **#1274**。
- **范围（本批 = 功能点 38，不多不少）**：① 控制台可管理远程镜像源清单（增/删/改/列 + 常用源预选；每源 = 名称 + 地址）∥ ② 对可达源列镜像目录（仓库 ∥ 标签）∥ ③ 本地镜像表与源目录的查找筛选。**边界**：拉取走代理不做；拉取行为本身不变（仍由节点引擎拉取）。
- **平台事实（本刻实测，设计不得超卖）**：Docker Hub 全站目录/搜索 API 官方关闭（对 Hub 至多「已知镜像的标签列表」——经代理实测 nginx tags 通，1339 条）；引擎内置 `images/search` 实测空回（已死不可作兜底）；自建 registry ∥ Harbor ∥ 云厂商 registry 按标准 v2 接口可达。
- **授权（用户 09:20 原话「开始吧，自动跑。」）**：本批**设计评审点火权** ∥ **§4 用户批准权（代签）** ∥ **修正/实施轮派发** ∥ **收口核销与提交**——均委托父侧自动执行，直至本批收口。**父侧自缚三条（本仓惯例·先例同形）**：① 代签仅当三条件齐备（评审 pass 0🔴 ∧ 修正轮已落地并逐条核验 ∧ token 已签发），每次代签在 §4 写明「父侧代签（用户 09:20 授权）+ 依据」；② 新范围 ∥ 用户口径裁决 ⇒ 停下、只摆那一条；③ 破坏性/不可逆 ⇒ 先停。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（评审轮 1 修正（fix 轮）十号逐条落位（本段末块）——待父侧核验）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**设计轮交付（eng-designer · 2026-10-11）**

**批次**：sandbox-image-sources（沙盒镜像源族）· 台账 #1274 · 需求档 `docs/server/requirements/PROJECT.md` §2:38 + 验收表 AC-38 · 用户口径 2026-10-11 09:17（四点；其中「拉取经代理」一点用户当场撤回）+ 09:19（常用源预选）。

### 本批覆盖的需求条目（回指需求档）

1. **① 镜像源 CRUD + 常用预选**：控制台增/删/改/列远程镜像源（名 + 地址；名 ∥ 址**各自唯一**；地址归一 `[http(s)://]主机[:端口]`）+ 常用源预选六条（表单只回填名/址两字段）。
2. **② 源目录清单**：对可达源读**仓库目录**（v2 `_catalog`）+ **标签清单**（v2 `tags/list`；Hub 面走公开 API）；读绪**如实**（`timeout` ∥ `unreachable` ∥ `auth_required` ∥ `unsupported` ∥ `bad_response`）。
3. **③ 搜索/过滤**：本地镜像表过滤（名/标签）+ 源目录浏览窗两处过滤（仓库列表 ∥ 标签列表）——纯前端 ∥ 零新端点。
4. **预选清单**（用户 09:19 原话口径）：六条 = Docker Hub ∥ ghcr.io ∥ quay.io ∥ 阿里云 ACR ∥ 华为云 SWR ∥ DaoCloud 镜像（随设计轮维护）。
5. **边界（用户撤回项落纹）**：**拉取行为零改**——源不写节点 dockerd 配置 ∥ 不注入镜像前缀 ∥ 无默认源；「拉取经代理」已撤回 ⇒ 不入本批。

### 明确不在本批（清单全文 = `docs/server/design/sandbox/SANDBOX.md` §15 首条）

私有源凭据 ∥ 源目录「一键拉取」（预填拉取窗——**提请裁定**；裁定为可 ⇒ 实施轮随批落，≈20 行）∥ 源读取走 `proxy.uri`（**提请裁定**）∥ 分页/翻页/排序 ∥ 源写入节点配置 ∥ 默认源语义 ∥ 按节点源清单 ∥ 保存时探活预校验 ∥ 子路径源 ∥ 建容器表单镜像选择器（「清单下拉」——与源目录**非同一件**）。

### 设计落点（设计 8 项全落——落档，不在本段复述接口细节）

- 机制全文 = `docs/server/design/sandbox/SANDBOX.md` §3（本批块：做法与理由 ∥ 用例 ∥ 边界 ∥ 自加项逐条带理由）+ §11 判据行 ∥ §12 用例 ∥ §13 预算 ∥ §14 决策 ∥ §15 边界。
- 接口契约 = `docs/server/design/gateway/API.md` §2.5（镜像源七行 ∥ 读类 10s ∥ 自含状态形）；存储 = `docs/server/design/store/STORE.md` §2 v15 段/§3 v15/§4；审计 = `docs/server/design/accounts/ACCOUNTS.md` §2.1；控制台 = `docs/server/design/webui/WEBUI.md` §2.8①/§5/§6；决策索引 = `docs/server/design/PROJECT.md` §4/§5/§6/§7（AC-38 行）。
- **关键决策（三条新增）**：KD-SV-96（源清单 = server 全局配置表 v15 + 与拉取链路零耦合）∥ KD-SV-97（读取 = 标准 v2 + Hub 面 + 匿名 Bearer 挑战 + 有界首页 + 五分类如实报错）∥ KD-SV-98（UI = 沙盒页新卡 + 目录浏览弹窗 + 前端过滤）。
- **设计侧自加项**（逐条带理由，非用户口径）= 同档 §3 表五条：匿名 Bearer 挑战换取 ∥ 源清单 server 全局 ∥ 有界首页（`n` 1–1000 + `truncated`）∥ 浏览窗过滤纯前端 ∥ 「一键拉取」（列为不做项）。

### 受影响文件（产品码；行数 = 设计估；既有件读数 = 2026-10-11 现读）

| # | 文件 | 现状 | 本批 |
|---|---|---|---|
| 1 | `thincoder-server/src/sandbox/image-sources.mjs` | 拟新增 | ≈170 |
| 2 | `thincoder-server/src/sandbox/registry-client.mjs` | 拟新增 | ≈230 |
| 3 | `thincoder-server/src/sandbox/image-source-routes.mjs` | 拟新增 | ≈170 |
| 4 | `thincoder-server/src/store/db.mjs` | 458 | ⇒ ≈490（v15 段 +≈32） |
| 5 | `thincoder-server/bin/thincoder-server.mjs` | 189 | ⇒ ≈191（import + 注册行） |
| 6 | `thincoder-server/public/views-sandbox-image-sources.mjs` | 拟新增 | ≈230 |
| 7 | `thincoder-server/public/views-sandbox-images.mjs` | 118 | ⇒ ≈138（过滤输入） |
| 8 | `thincoder-server/public/views-sandbox.mjs` | 372 | ⇒ ≈380（挂载） |
| 9 | `thincoder-server/public/i18n-{zh,en}-sandbox.mjs` | 147 ∥ 147 | ⇒ ≈177/表（+≈30 键） |
| 10 | `thincoder-server/public/style.css` | 261 | ⇒ ≈265（零新变量） |
| 11 | 随正件 = 批内件两件 + `thincoder-server/package.json`（`prepublishOnly` **47 ⇒ 49**）+ 档目断言件 + i18n 键集件 | —— | 清单 = `docs/server/design/PROJECT.md` §6 本批行 |

服务端合计 ≈+604 ∥ webui 合计 ≈+272（逐项 = 上表 ∥ `docs/server/design/webui/WEBUI.md` §5 小计链）。

### 验收判据（逐条回指需求条目——机检面）

| 需求条目 | 判据 | 明细（单源） |
|---|---|---|
| ① CRUD + 预选 | 源清单四端点逐值（形校验 ∥ 名/址唯一 ∥ 400/404）+ 每动作一审计行 + 预选端点回六条 | `docs/server/design/sandbox/SANDBOX.md` §12 N57 ∥ B54 ∥ E43/E45 ∥ `docs/server/design/gateway/API.md` §2.5 镜像源五行 |
| ② 源目录 | v2 两读逐值（含 `Link` 截断）+ Hub 两读（裸名补 `library/`）+ 匿名 Bearer 逐跳 + 四态如实（超时/不可达/认证/不支持） | 同档 §12 N58/N59 ∥ B52/B53/B55 ∥ E44 |
| ③ 过滤 | 三处过滤生效（本地镜像表 ∥ 仓库列表 ∥ 标签列表）+ 无匹配空态句；零新端点 | `docs/server/design/webui/WEBUI.md` §6 镜像源族行 ∥ 同档 §3「控制台面」句 |
| 边界（拉取零改） | 拉取链路零触（`image-routes.mjs` ±0 ∥ `docker.mjs` ±0 ∥ 无前缀注入 ∥ 无默认源） | `docs/server/design/sandbox/SANDBOX.md` §3 首句 ∥ KD-SV-96 |
| 存储 | v15 段判据（空库直落 15 ∥ v14 升后 15 ∥ 幂等 ∥ 五列 ∥ 两 UNIQUE 拒重 ∥ 存量表零变） | `docs/server/design/store/STORE.md` §3 v15 行 |
| 审计 | 三 kind detail 键集逐值 + 型面计数零增（**十三型**） | `docs/server/design/accounts/ACCOUNTS.md` §2.1 `sandbox_event` 行 |
| 收口 | 浏览器实走（增/改/删源 + 源目录读取（自建 registry ∥ 公网源按可达性如实）+ 三处过滤）+ 批内件两件 | `docs/server/design/sandbox/SANDBOX.md` §11 本批行 |

### 闸面读数（设计轮——`node scripts/doc-check.mjs`）

- 行宽（≤300）：**0 条**（本批新写 11 行先超、已折行收净）。
- 锚点悬空：**25 条**——全在 `docs/core`（2）∥ `docs/desktop`（22）∥ `docs/render-core`（1）三域，**本批未触三域 ⇒ 非本批引入**；闸态 FAIL 由该 25 条构成（提请主代理裁）。
- 用例号悬空 0 ∥ 符号·窄悬空 0 ∥ 声明源缺位 0。
- **产品码零触（设计轮）。**

### 发现（列报——不静默修复项）

1. 需求档档目链需 +1：`docs/server/requirements/PROJECT.md` AC-12/AC-14 行「36 ∥ 37」⇒ 本批后应为「**37 ∥ 38**」∥ 余面批「39 ∥ 40」（**需求档笔属主代理**——本批未改）。
2. i18n 拆分**已执行**（盘上 `i18n-{zh,en}-sandbox.mjs` 各 147 行）而设计档原记「执行 = 实施轮」⇒ 本批读数收正（admin 174 ∥ 178）。
3. 读数差（设计估 vs 本批现读）：`db.mjs` ≈450 ⇒ **458** ∥ `views-sandbox.mjs` ≈355 ⇒ **372** ∥ `views-sandbox-images.mjs` ≈140 ⇒ **118**——逐项已在档行收正。

### 设计评审轮 1 修正（fix 轮——十号逐条落位；2026-10-11）

承批档 §3 轮次 1（🔴 0 ∥ 🟡 4 ∥ 🔵 6——父侧十号全裁修正；执行者 = eng-designer）。落位（修复轮后盘面坐标）：

| 号 | 落位（file:line） | 内容 |
|---|---|---|
| 1 | `sandbox/SANDBOX.md:343` ∥ `:362` | §13 routes 行批次名写实（sandbox-docker-admin 批 +3；本批 ±0）；与 §13 小计同口径 |
| 2 | `gateway/API.md:389` | 变更记录补本批条（§2.5 前括注 + 镜像源七行；同源随动 = SANDBOX/STORE/ACCOUNTS/WEBUI/design PROJECT——设计轮补记） |
| 3 | `webui/WEBUI.md:136`–`:137` | §2.2 补键族登记条（sandbox-image-sources 批——+≈30 键/表；零退役；表体量随文） |
| 4 | `sandbox/SANDBOX.md:334`（B56） ∥ `:276`（§11 行） | 补 B56（`bad_response`——远端 200 非 JSON/形不符）+ §11 判据句五分类对齐；用例链 B52–B56 随拍（`webui/WEBUI.md:674` ∥ `design/PROJECT.md:516`） |
| 5 | `webui/WEBUI.md:640` ∥ `design/PROJECT.md:475` ∥ §2 表下小计行 | 小计收正：webui **≈+322**（复算 = 分项和：230 + 20 + 8 + 30×2 + 4）——三处同拍 |
| 6 | `sandbox/SANDBOX.md:370`–`:371` ∥ §2 表 #11 行 | 批内件两件估 ≈420 ∥ ≈280（沿上批之例） |
| 7 | `sandbox/SANDBOX.md:357` | §13 audit 行 delta 清单值（**±0**——本批）+ 陈值来源注（托管接入批） |
| 8 | `sandbox/SANDBOX.md:145` | 「detail 键集 = §2.1」⇒ 全限定（`accounts/ACCOUNTS.md` §2.1） |
| 9 | `sandbox/SANDBOX.md:407` | §15 已否候选归位（默认源语义 ∥ 分页/排序——不排期，非待办） |
| 10 | `sandbox/SANDBOX.md:356` | §13 db 行补余量注（≈10——实施后复读；越 500 ⇒ 同轮补拆分预案） |

**记录收正三笔（本块取代 §2「受影响文件」表 #11 行 ∥ 该表下小计行 ∥「验收判据」表 ② 行对应表述）**：① webui 合计 **≈+322**（复算 = 分项和；三处同拍 = `webui/WEBUI.md` §5 ∥ `design/PROJECT.md` §6 ∥ 本段）；② 批内件两件估 **≈420 ∥ ≈280**（沿上批之例；`prepublishOnly` 47 ⇒ 49 不变）；③「验收判据」表 ② 行「四态如实（超时/不可达/认证/不支持）」⇒ **五分类**（+ `bad_response`——#4 同拍）。

四档变更记录各一笔（`sandbox/SANDBOX.md:435` ∥ `gateway/API.md:389` ∥ `webui/WEBUI.md:821` ∥ `design/PROJECT.md:677`）。**产品码零触（fix 轮）**。机检（doc-check 单跑）：行宽 OK（区带豁免在效——变更记录）∥ 锚悬空 25（全在 core/desktop/render-core 三域——本批未触，与设计轮基线同数；用例号悬空 0）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

设计评审（sandbox-image-sources 批 · 射程 = SANDBOX.md §3 镜像源族块（本批）+ 随动五档 + 需求档 §2:38/AC-38）——发现表：

| # | 类别 | 级别 | 发现 | 建议 |
|---|------|------|------|------|
| 1 | 受影响文件标注 | 🟡 | SANDBOX.md §13 routes.mjs 行标「本批 +3 已入盘」（`sandbox/SANDBOX.md:342` ∥ `:361`），但本批小计（`:359`）与本批总账（`design/PROJECT.md:474`）均不含 routes.mjs——「本批」实指上一批（sandbox-docker-admin，其小计内含「routes ±≈3」），本批读者会误判 routes.mjs 需 +3 行 | 该行批次名写实（如「sandbox-docker-admin 批 +3 已入盘」）+ 补本批口径（±0）；行 ∥ 小计取同口径 |
| 2 | 方法论合规（随动） | 🟡 | 本批改了 `gateway/API.md` §2.5（`:119` 前括注 + `:139`–`:145` 七行），但本档变更记录无本批条目——末条 = admin-agent-chat 批（`gateway/API.md:388`）；前批 sandbox-docker-admin 有对应条目（`:387`） | 补一条 2026-10-11 变更记录（增镜像源七行 + 前括注 + 同源随动清单） |
| 3 | 文档归属（随动） | 🟡 | `webui/WEBUI.md` §2.2 键族登记链止于上一批（`:135` = sandbox-docker-admin 批），本批 +≈30 键/表无登记条；本批 changelog（`webui/WEBUI.md:818`）只列 §2.8/§5/§6；键量仅见 §5 行（`:630` ∥ `:636`）与 §6 行（`:672`） | 在 §2.2 补「键族登记（sandbox-image-sources 批——两表逐键同步）」条（镜像源卡/增改删弹窗/目录浏览窗/五分类读绪；sandbox 两部件 +≈30/表） |
| 4 | 验收判据 | 🟡 | 五分类错误有一类无用例：`bad_response`（`sandbox/SANDBOX.md:158` 列五 kind）在 §12 无专测——E44（`:335`）只断 `unreachable`/`timeout`/`auth_required`、B55（`:333`）断 `unsupported`；判据行亦只写「不可达/认证失败/不支持三态」（`:276`） | 补一条用例（远端 200 非 JSON/形不符 ⇒ `{ ok: false, error: { kind: "bad_response" } }`），或把声明收窄到有用例者 |
| 5 | 数值漂移 | 🔵 | webui 小计 ≈+272 与分项和不符：230（新档）+20+8+30×2+4 = 322（`webui/WEBUI.md:638` ∥ `design/PROJECT.md:475`——两处同值，故非跨档矛盾，是同一算式的错值） | 复算取齐（272 或 322 之一） |
| 6 | 受影响文件标注 | 🔵 | 本批两件批内件（`docs/batches/2026-10-11-sandbox-image-sources.test.mjs` ∥ `…-ui.test.mjs`）在射程档内无行数估：§13 批内件条目止于上一批（`sandbox/SANDBOX.md:366`–`:367` 估 ≈420/≈280），总账仅具名（`design/PROJECT.md:476`）；若估落批档 §2（§13 `:362` 声明「批内件预算 = 批档 §2」——该档不在本评审射程，未核） | 在 §13/总账补两件估（沿上批 ≈420/≈280 之例）或补指针句 |
| 7 | 文档卫生 | 🔵 | `sandbox/SANDBOX.md:356`（audit.mjs 行）delta 栏自相抵：`≈+3（托管接入：±0——五 kind 走 sandbox_event，非枚举）`；本批口径应为 ±0（`design/PROJECT.md:474`：`audit.mjs` ∥ `errors.mjs` ∥ `image-routes.mjs` ±0） | 该栏清成单值（±0）并注明陈值来源 |
| 8 | 清晰度（指涉） | 🔵 | `sandbox/SANDBOX.md:145` 写「detail 键集 = §2.1」——无档名限定（本档无 §2.1 节）；同族处均带档名（`:38` ∥ `:127` 用 `accounts/ACCOUNTS.md` §2.1） | 改成全限定指涉 |
| 9 | 需求覆盖（口径） | 🔵 | 需求把「默认源」形态委于设计轮（`requirements/PROJECT.md:207`）；设计裁定「无默认源」（`sandbox/SANDBOX.md:140` ∥ `:395` KD-SV-96 被否栏），但 §15 仍以「余项（本批不做）」同列（`:402`；分页/排序亦然——`:156` 已给「不翻页」裁定）——同一项两种处置口径（已否 ∥ 顺延） | 统一标记（如「已否候选——不排期」），免被读作待办 |
| 10 | 受影响文件标注（余量） | 🔵 | `db.mjs` 458 ⇒ ≈490（`sandbox/SANDBOX.md:355` ∥ `store/STORE.md:434`）——500 软线内但余量 ≈10 行；本批未附拆分预案（规则：>500 才须） | 实施轮复读；若落 ≥500 行，同轮补拆分预案 |

射程外注（不判级）：需求 §5:319 写「**已落：排空**（runner-admin-console 批）」与 `sandbox/SANDBOX.md:411` 余项表「节点禁用/排空」相抵——建议对账（不在本评审目标 = 需求档 §2:38/AC-38）。

核实通过项（不列级）：七端点计数四处同口径（SANDBOX `:140`/`:142`/`:276` ∥ API §2.5 `:119`/`:139`–`:145` ∥ design/PROJECT `:516`）；v15 DDL/两唯一约束（STORE `:390`–`:398`）∥ 三 kind（ACCOUNTS `:67`）∥ 型面十三型零增；预选六条两档逐值同（SANDBOX `:148`–`:149` ∥ API `:140`）；AC-38 三面逐条有设计落点；档目链 36 ∥ 37 ⇒ 37 ∥ 38 三档同链；文件体量全在 500 软线内（无越档）。

计数：🔴 0 ∥ 🟡 4 ∥ 🔵 6（合计 10）

VERDICT: pass

## §4 用户批准（主 agent）

### 用户批准（父侧代签——用户 2026-10-11 09:20「开始吧，自动跑。」授权）

- **代签依据（三条件齐备）**：① 设计评审 **pass**（#201 · 🔴 0 ∥ 🟡 4 ∥ 🔵 6——发现表/VERDICT = §3 轮次 1）✓；② 修正轮 #202 十号全落 + **父侧逐号核验**（读回修复后盘面 = SANDBOX `:334`/`:343`/`:356`/`:357`/`:362`/`:370`–`:371`/`:407` ∥ API `:389` ∥ WEBUI `:136`–`:137`/`:640` ∥ design/PROJECT `:475`/`:516`）✓；③ 凭据已签发（值不落档）✓。
- **父侧直执行小修一笔（可 revert）**：SANDBOX.md §15「源写入节点 dockerd 配置 ∥ 按节点源清单」两条自「余项」移入「已否候选——不排期」组（= #202 报告观察项之裁决——同 KD-SV-96 被否栏；零新语义、列表级）。
- **实施派发** = eng-coder（全量文件表 = 批档 §2；随正件（档目断言件 ∥ i18n 键集件 ∥ 门禁件数断言件七件 47 ⇒ 49 ∥ `package.json` `prepublishOnly` 47 ⇒ 49）= 父侧实施轮同拍落）。

## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
