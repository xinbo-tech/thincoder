# 2026-10-06 · console-providers
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-06 · 来源 = 用户 2026-10-06 16:01「开啥玩笑！你觉得这是一个产品该干的事儿吗？！」+ 16:04「……都给补齐了」——需求 = 控制台 provider/模型管理（需求档 §2:11 ∥ 台账 #962）。
> 台账 = #962（server · 归批）。前情 = docs/batches/2026-10-06-server-presets.md §6（已收口 2026-10-06）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-06
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**§1 讨论（主 agent）**

**任务与来源**：用户 2026-10-06 16:01「开啥玩笑！你觉得这是一个产品该干的事儿吗？！」（走查控制台后）→ 16:04「……都给补齐了」。需求 = **控制台 provider/模型管理**（需求档 §2:11；台账 #962）：provider 增删改上界面 ∥ 密钥落服务端 ∥ 模型发现（调上游列真实模型）与勾选开放 ∥ 保存生效（**推翻「配置不热载」现状口径**）∥ 与预设面衔接（预设 = 界面快速添加）∥ 与 `config.json` 关系（迁入 ∥ 主从 ∥ 过渡并存 = 设计轮定）。

**现状核查（父侧）**：控制台三视图（`public/views.mjs:2` 自述——登录/我的/管理）无 provider 面（webui 面 grep 零命中）；provider/模型只住 `config.json` + 重启（README §2/§10 实读）；预设形（#960）已落 = 本功能天然起点。

**授权**：本会话既定委托延续（代点火 + 代批准 · 自缚三条同前）。

**边界**：KD-SV-1–18 语义零改（可增决策行）；转发/计量/账号面零改（除 provider 读取源迁移接缝）；发布面零涉；**与在途批串行**：#961 实施在飞（同触 `config.mjs`/README）——实施排队、设计并行。

**范围扩展（用户 2026-10-06 16:13 在飞裁定 · 需求 §2:14 入面——父侧直接执行 · 可 revert）**：**控制台信息架构与导航重规划**一并入本轮（`#31` 已 steer）：功能分组上导航 ∥ 一页一职责（拆「管理」单页堆叠）∥ provider 页长在新 IA 里；#963/#965 控台面服从本轮 IA 定稿（挂点留好）。台账 = #966。本批交付面 = 「控制台：provider/模型管理 + IA/导航重规划」。

**父侧随轮收正（交卷核验——机械类 · 可 revert）**：`WEBUI.md` §5 小计句「public 档数 4 ⇒ 8」⇒「4 ⇒ 9」（差一收正）∥ §6 前端自洽行「档目断言随正（九档）」⇒「（含 favicon.png 共十档）」（目录断言按磁盘全量形）；披露③「favicon 引用现存档缺位」为**陈旧读数**——`public/favicon.png` 已在盘（16:10 父侧落地）、运行实例 `GET /favicon.png` ⇒ 200 实核（非待办）。

**父侧随轮收正（修正轮核验——机械/同步类 · 可 revert）**：① **行宽三处拆行**（doc-check 触面外存量）——需求档 §2:12（458 字符 ⇒ 三行）∥ §2:14（362 字符 ⇒ 两行）∥ `ops/OPS.md` §5.4(c)（356 字符 ⇒ 两行；两档变更记录行在册）；② `gateway/API.md` §5 AC-11 行补**预设列表判据句**（`GET /api/admin/providers/presets` ⇒ 20 家 ∥ 响应零 `apiKey`——与 §2.2 契约同拍；应答 `#35` 披露⑤之问）。③ `#35` 披露①数字口径按实读采纳（**122 ⇒ ≈130**——估值 125 已被 #961 回填取代，改按实读正确）。

**随正清单增补（父侧记 · 2026-10-06 16:5x——跨批机械件，落地 = 父侧 · 可 revert）**：① `docs/batches/2026-10-06-server-auto-update.test.mjs`——`prepublishOnly` 件数断言需随之随正（叠加本批 +本批件后重算；来源 = `#963` 设计轮披露⑤）；② `docs/batches/2026-10-06-server-gateway.test.mjs` ∥ `docs/batches/2026-10-06-server-presets.test.mjs` ∥ `docs/batches/2026-10-06-server-gateway-chat.test.mjs` 三件随正（A 单 `#37` 上抛：旧断言锚旧设计——种子语义/迁移 v2/库单源；补丁清单随其交卷并入；chat 件 = 设计 §2.4 清单外新增项）。落地后由父侧复跑八件/九件取证。

**A 单（`#37`）核验通过（父侧 · 2026-10-06 17:2x）**：① 六档实读（node 绝对路径）——db **124** ∥ config **180** ∥ providers **146** ∥ provider-admin **197** ∥ routes **86** ∥ bin **126**（全 ≤300）✓；② **旧件随正 = 父侧直接执行（跨批 · 机械 · 可 revert）**：三件共 28 处替换（`-gateway.test.mjs` 19 ∥ `-presets.test.mjs` 8 ∥ `-gateway-chat.test.mjs` 1——A 单补丁清单为主，另补头注三处 + 注释两处收正）；③ **复跑取证：八件 70/70 全绿**（原 61/70——9 红全清 ∥ duration ≈12.9s）；④ **`cp-a-smoke.mjs` 父侧亲跑 = 46 PASS / 0 FAIL**（种子四格 ∥ 保存即热生效 ∥ 校验单源 ∥ 发现 ∥ 掩码 ∥ presets ∥ 判权）。A 单交付表第 3 行（旧件回归）随之闭合；R14 回填待 B 单到货后随九件读数一并。

**锚面连带（父侧记 · 2026-10-06 17:2x——doc-check 复核所见）**：实施删 `views.mjs` ⇒ 闸态悬空 +2（`docs/server/design/webui/WEBUI.md:83` ∥ `docs/server/requirements/PROJECT.md:135` 的 `views.mjs` 活引用失去在盘目标）——整档 67 = 65 基线 + 2。处置 = **随 R14 回填收正**（两处改「已退役——拆入 views-* 五档」形，去活引用）——本记在册防漏。

**B 单（`#40`）核验通过（父侧 · 2026-10-06 17:3x）**：九档重排 + 批内件九腿 **9/9** ∥ DOM 冒烟 26/26（自报）∥ 父侧随正 P1/P2 落地（`-auto-update` 件数断言 8⇒9 + 头注两处 ∥ `-webui-deploy` 例改 `nav.mjs` + 档目断言 9∥10 + 短标题随正）⇒ **九件复跑 79/79 全绿**。B §5 行数实读（R14 口径）：index 20 ∥ app 209 ∥ nav 81 ∥ views-auth 29 ∥ views-me 86 ∥ views-admin 137 ∥ views-providers 213 ∥ views-system 15 ∥ style 75 ∥ 批内件 479。R14 回填轮已发（含 `views.mjs` 退役行收正）；`labelKey` 换键面 = i18n 实施单（已发）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（七问逐答落位（存储/密钥 ∥ config 关系+种子矩阵 ∥ 热生效 ∥ 发现+勾选 ∥ 控制台面+IA ∥ 端点权限 ∥ 验收+用例）∥ IA 定稿（侧栏七页 + `nav.mjs` 纯函数 + 旧链重定向）∥ KD-SV-19/20 ∥ doc-check 本批新增悬空 0 ∥ 新增超宽 0 ∥ 旧件随正四件在册）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 轮次定位与本批条目（覆盖）

- 轮次 = **设计轮**（initial）；需求 = `docs/server/requirements/PROJECT.md` §2:11（控制台 provider/模型管理）+ §2:14（控制台 IA 与导航重规划——用户 16:13 范围扩展，§1 收编在册）+ 变更记录相关条；台账 = #962 ∥ #966；批档 §1 在册。
- 交付面 = 「控制台：provider/模型管理 + IA/导航重规划」。条目表（逐条覆盖）：

| # | 条目（需求回指） | 设计落点 | 状态 |
|---|---|---|---|
| 1 | provider 增删改上控制台（界面 CRUD） | `gateway/API.md` §2.2（端点表）∥ `webui/WEBUI.md` §2（`#/admin/providers`） | ✅ 覆盖 |
| 2 | 密钥落服务端形态（掩码 ∥ 永不入日志） | `ops/OPS.md` §1（明文 ∥ `env:` 引用并存）∥ `gateway/API.md` §2.2（回显形） | ✅ 覆盖 |
| 3 | 模型发现（调上游列真实模型）+ 勾选开放 | `gateway/API.md` §2.2（discover 口径 ∥ 开放清单 = `models`） | ✅ 覆盖 |
| 4 | 保存生效（推翻「配置不热载」） | `gateway/API.md` §2.2（保存即热生效 ∥ 在途口径）∥ `ops/OPS.md` §1/§10 收正 | ✅ 覆盖 |
| 5 | 与预设面衔接 | `ops/OPS.md` §1（预设双消费面）∥ `gateway/API.md` §2.2（快速添加） | ✅ 覆盖 |
| 6 | 与 `config.json` 关系（迁入/主从/过渡） | `ops/OPS.md` §1（库单源 + 首启种子四格矩阵 + fail-closed 重定义） | ✅ 覆盖 |
| 7 | 存储形（表/迁移链） | `store/STORE.md` §2 v2 段 ∥ §3 | ✅ 覆盖 |
| 8 | IA：功能分组上导航 ∥ 一页一职责 | `webui/WEBUI.md` §2（侧栏两组七页；管理页拆分） | ✅ 覆盖 |
| 9 | 路由/导航形态（侧栏 ∥ 顶栏 ∥ hash 扩展 ∥ 迁移） | `webui/WEBUI.md` §2（侧栏定稿 ∥ `nav.mjs` 纯函数 ∥ 旧链重定向） | ✅ 覆盖 |
| 10 | provider 页长在新 IA | `webui/WEBUI.md` §2（`#/admin/providers`——IA 内） | ✅ 覆盖 |
| 11 | 挂点：版本可见/接入卡（首版完备化面） | `webui/WEBUI.md` §2（`#/admin/system` 骨架 + 侧栏 meta 槽） | ✅ 覆盖 |
| 12 | 挂点：i18n 文案表（多语言面） | `webui/WEBUI.md` §2（文案单源 = `nav.mjs` label 字段） | ✅ 覆盖 |
| 13 | 预算/拆分（`views.mjs` 244 行） | `webui/WEBUI.md` §5（九档重排 ∥ 单档 ≤300） | ✅ 覆盖 |

- **本批边界（不做）**：KD-SV-1–18 语义零改（增 19/20；KD-SV-9 计数句按 D8 收正——披露 = §2.8）；转发/计量/账号语义零改（除 provider 读取源迁移接缝）；发布面零涉；他批零触；版本面/接入面/多语言**本体** = 首版完备化轮 ∥ 多语言轮（本批只留挂点）；provider 管理不做：CLI 面 ∥ URL 白名单 ∥ 变更历史/回滚 ∥ 渠道/灰度/多版本并存。
- **与在途批串行**：`#961` 实施在飞（同触 `config.mjs` ∥ `bin` ∥ README ∥ `config.example.json` ∥ `package.json`）——**实施排队**（本设计零改其语义面；`autoUpdate` 行保留）；预算/README 数值 = **叠加口径**（注记在各档预算节）。

### 2.2 设计档落点

- 机制全文：provider 管理面 = `gateway/API.md` §2.2；配置种子与 `config.json` 关系 = `ops/OPS.md` §1；IA/导航 = `webui/WEBUI.md` §2。
- 同批随动（本批笔）：`gateway/API.md`（§1/§2/§2.1/§4/§5/§7/§8/变更记录）∥ `ops/OPS.md`（§1/§4/§6/§7/§8/§10/变更记录）∥ `webui/WEBUI.md`（§1–§8 + 变更记录）∥ `store/STORE.md`（§1/§2/§3/§4/变更记录）∥ `accounts/ACCOUNTS.md`（§3 pointer/变更记录）∥ 板档 `PROJECT.md`（§1/§2.1/§2.2/§4/§6/§7/§9/变更记录）。
- `EVOLUTION.md` 零触（评估：无器级新断点——G2 迁移链/G5 配置面为既有断点之使用；provider 面边界归 `gateway/API.md` §8 ∥ `ops/OPS.md` §10）。

### 2.3 机制设计（七问逐答——对批档 §1 任务书问面）

**① 存储与密钥形态**：`providers` 表（迁移 v2——`store/STORE.md` §2）：`name`（唯一 ∥ 无 `/`）∥ `base_url` ∥ `api_key` ∥ `models_json`（JSON 数组 = 开放清单）∥ `created_at/updated_at`。密钥落库 = **明文 ∥ `env:` 引用并存**（管理员的秘密卫生选择：明文 = 部署机文件权限自担；引用 = 秘密只住环境——`env:NAME` 原样存储、构建期解析）；界面回显 = 掩码（`env:` 原文 ∥ 明文 `…`+末 4 ∥ 空）；**永不入日志**；密钥值不进错误消息。

**② 与 `config.json` 关系 + fail-closed 重定义**：**库 = 运行期单源；`providers[]` 降为一次性种子**——四格矩阵 = 库空+段 ⇒ 首启导入（`env:` 引用**保形**入库——种子不物化秘密）；库空+段缺 ⇒ 允许起 + 警告；库非空+段在场 ⇒ 忽略 + 警告；库非空+段缺 ⇒ 正常（全文 = `ops/OPS.md` §1）。fail-closed 重定义：原「`providers` 空 ⇒ 拒启」⇒ **零 provider = 允许态**（服务照常起 + 警告——控制台就是配置路径）；fail-closed 移驻**条目级**（非法/重名/`env:` 缺位 ⇒ 启动拒启 ∥ 保存 400——单一规则函数）。校验单源 = `thincoder-server/src/ops/config.mjs` 导出（配置载入 ∥ 启动构建/种子 ∥ 控制台保存——三径同规）。

**③ 生效方式（选型论证）**：选 **保存即热生效**（推翻「配置不热载」——用户 16:01 令）：装配期建 provider 运行时（内存箱持注册表）；保存 = ① 校验 → ② 建候选注册表（`env:` 解析失败 ⇒ 400 不落库）→ ③ 落库 → ④ **原子换表**（`runtime.set`）——HTTP 面读 `runtime.get()`，**零重启**。被否「保存即重启」：在途流全断 ∥ 无守护场景（前台跑 ∥ 容器外）不可用 ∥ 与自升停机面语义叠加 ∥ 「保存后何时生效」不确定窗。**在途请求口径** = 派发时快照（转发闭包持当时 provider 对象）——换表只影响**后续**请求；删除/改名不断在途流。

**④ 模型发现与勾选开放**：`POST /api/admin/providers/discover`（草稿可用——新增流程可先发现后保存）：体 `{ baseURL, apiKey?, providerId? }`——apiKey 明传（可含 `env:` 引用——服务端解析）∥ 否则取库内该 provider 的 key；调 `GET {baseURL}/models`（Authorization 同转发口径——空不发）；超时 10s（可覆盖常量——注入口径）；解析 `data[].id` 去重。失败（不可达/超时/非 JSON/无 `data`）⇒ 502 `upstream_error`（可读消息）——**UI 手填降级照常可用**（发现非保存前置门）。**勾选开放** = 勾选集存 `models`——`/v1/models` 与派发判据同源（选择性中继口径保持：未开放 ⇒ 404）；发现结果 ∪ 既有开放清单并列入列（存量未发现者保留——防误删）。

**⑤ 控制台面 + IA（范围扩展收编）**：IA 定稿 = **侧栏分组导航 + 一页一职责**（全文 = `webui/WEBUI.md` §2）：我的（`#/me/keys` ∥ `#/me/usage` ∥ `#/me/account`）∥ 管理（`#/admin/members` ∥ `#/admin/providers` ∥ `#/admin/usage` ∥ `#/admin/system`）；旧链重定向（`#/me` ⇒ `#/me/keys` ∥ `#/admin` ⇒ `#/admin/members`）；路由解析 = `nav.mjs` 纯函数（可批内件直测——无 DOM）；窄屏（≤760px）侧栏降级顶条。provider 页（`#/admin/providers`）= 列表 ∥ 增/改/删 ∥ 测试连通 ∥ 从预设快速添加 ∥ 发现/勾选/手填。**挂点**：系统页（版本/更新/接入——首版完备化面骨架）∥ `nav.mjs` 文案单源（多语言面）。

**⑥ 端点与权限**：`/api/admin/providers/*` 五端点（GET 列表 ∥ POST 新增 ∥ PATCH 改 ∥ DELETE 删 ∥ POST discover——`gateway/API.md` §2.2）；权限 = `requireAdmin`（`user` ⇒ 403 ∥ 无/过期 ⇒ 401——服务端判据不变）；错误码全沿用（400/401/403/404/502——零新码）；写端点 JSON 型门同既有。

**⑦ 验收与用例面**：AC-11/AC-12 候选判据 = §2.5；批内件 = §2.4（八腿）。

### 2.4 受影响文件与测试面

- **产品码（实施轮笔——本批零写；行数 = 实读 ⇒ 设计估）**：

| 档 | 变动 | 量 |
|---|---|---|
| `thincoder-server/src/store/db.mjs` | v2 段（`providers` DDL + 迁移段） | 110 ⇒ ≈135（+25） |
| `thincoder-server/src/ops/config.mjs` | 种子语义 ∥ 校验单源导出 ∥ 载入期 `env:` 跳过 | 158 ⇒ ≈173（+15） |
| `thincoder-server/src/gateway/providers.mjs` | 行→条目 ∥ 注册表构建（`env:` 解析）∥ 运行时箱 ∥ 装配引导 | 55 ⇒ ≈150（+95） |
| `thincoder-server/src/gateway/provider-admin.mjs`（拟新增） | 行 CRUD ∥ 掩码回显 ∥ 模型发现 ∥ 管理端点注册 | 无 ⇒ ≈220 |
| `thincoder-server/src/gateway/routes.mjs` | 读运行时（`runtime.get()`） | 81 ⇒ ≈95（+14） |
| `thincoder-server/bin/thincoder-server.mjs` | 运行时引导接线（叠加 #961 后） | +≈8 |
| `thincoder-server/public/index.html` | 侧栏壳容器（重排） | 20 ⇒ ≈26 |
| `thincoder-server/public/app.mjs` | IA 路由表接线 ∥ 视图装配 | 167 ⇒ ≈190（+23） |
| `thincoder-server/public/nav.mjs`（拟新增） | IA 单源：组/项数据 ∥ `resolveRoute` 纯函数 ∥ 侧栏渲染 | 无 ⇒ ≈70 |
| `thincoder-server/public/views.mjs` | **退役拆档（删除）** | 244 ⇒ 0 |
| `thincoder-server/public/views-auth.mjs`（拟新增） | 登录（自 `views.mjs` 拆） | 无 ⇒ ≈30 |
| `thincoder-server/public/views-me.mjs`（拟新增） | 我的三页（key ∥ 用量 ∥ 账户设置） | 无 ⇒ ≈150 |
| `thincoder-server/public/views-admin.mjs`（拟新增） | 成员 ∥ 用量统计两页 | 无 ⇒ ≈130 |
| `thincoder-server/public/views-providers.mjs`（拟新增） | Provider 与模型页（列表/表单/发现/勾选/测试） | 无 ⇒ ≈210 |
| `thincoder-server/public/views-system.mjs`（拟新增） | 系统页骨架（两节 + 空态——挂点） | 无 ⇒ ≈30 |
| `thincoder-server/public/style.css` | 侧栏/分组/活动态/窄屏 | 49 ⇒ ≈95（+46） |
| `thincoder-server/README.md` | §2 种子句 ∥ §6 控制台（四视图 ⇒ IA）∥ §10 热载句收正（叠加 #961 后） | +≈15 |
| `thincoder-server/config.example.json` | 零动（种子示例形保留） | ±0 |
| `thincoder-server/package.json` | `prepublishOnly` 测试清单 +1 件（本批件——件数随 #961 叠加） | +1 件 |

- 产品面合计 **≈+840 行**；全树 **35 ⇒ 41 档**（+7 新档 ∥ −1 退役）；预算表 = 各档 §5/§6（数值叠加口径 = #961 回填后——串行注记）。`README`/`package.json` 为**发布文本面**（实施轮笔）；本设计批零写产品面。
- **旧件随正（实施轮义务——「保持绿或随正 + 披露」沿 #961 先例；归档件收口补丁在册）**：① `docs/batches/2026-10-06-server-gateway.test.mjs`——config 判据（「缺 providers ∥ 空数组」两行 ⇒ 允许态）、db 迁移断言（`SCHEMA_VERSION` 1 ⇒ 2 ∥ 四表 ⇒ 五表 ∥ 失败迁移夹具 `v: 2` ⇒ `v: 3`）、`env:` 解析断言（载入 ⇒ 构建期）、`createProviderRegistry`/`modelList` 调用点；② `docs/batches/2026-10-06-server-gateway-model-ref.test.mjs`——registry/modelList 调用点 3 处；③ `docs/batches/2026-10-06-server-presets.test.mjs`——`apiKey` 断言（解析值 ⇒ 引用形）+ startGateway 加 env 注入口；④ `docs/batches/2026-10-06-server-gateway-webui-deploy.test.mjs`——`public/**` 档目断言（四档 ⇒ 九档）。
- **测试面** = 批内件 `docs/batches/2026-10-06-console-providers.test.mjs`（拟新增——设计估 ≈450 行；腿 = ① 控制台 CRUD 三态（401/403/200）② **保存即热生效**（POST 后 `/v1/models` 立含 + mock 上游完成请求；PATCH 改 `baseURL` ⇒ 下一请求命中新上游；DELETE ⇒ 下一请求 404）③ 在途口径（流跨删除——`ok` 记账）④ 密钥（掩码 ∥ 日志零明文 ∥ discover 草稿键不落库）⑤ discover（成功/失败/超时——假上游）⑥ 种子四格（`env:` 保形）⑦ 校验单源（非法/重名/`env:` 缺位 ⇒ 400 且库与运行时零变）⑧ `nav.mjs` 直测（组/项结构 ∥ 重定向 ∥ 角色默认 ∥ `denied`）+ 静态九档断言）。复跑 = `node --test docs/batches/2026-10-06-console-providers.test.mjs`（cwd = 仓根）；不设 `test/` 树（沿测试纪律）。
- 真机面 = 收口轮（控制台浏览器实走 = 用户面；无新增真机前置）。

### 2.5 验收对照（回指功能点 11 ∥ 功能点 14）

- **AC-11 候选判据**（全文 = `gateway/API.md` §5 行 ∥ 种子行 = `ops/OPS.md` §7 ∥ 控制台行 = `webui/WEBUI.md` §6）：admin 三态 ∥ **保存即热生效**（零重启——POST/PATCH/DELETE 三条即时实证 + 在途流照常收尾）∥ 密钥面（列表掩码不含明文 ∥ 日志零明文 ∥ `env:` 引用原样回显）∥ 发现（mock `/models` ⇒ 清单去重；不可达/超时/非 JSON ⇒ 502 + 手填降级）∥ 校验单源（400 且库与运行时零变）∥ 种子四格（保形导入 ∥ 忽略 + 警告 ∥ 允许起 + 警告）。
- **AC-12 候选判据**（全文 = `webui/WEBUI.md` §6 行）：`nav.mjs` 直测（我的 3 ∥ 管理 4 ∥ admin 组仅 admin ∥ 重定向 ∥ 角色默认 ∥ `denied`）∥ 静态九档在册 ∥ 管理页拆分（成员/用量各一页——单页堆叠消失）∥ 端点级判权回归不变（`user` ⇒ 403——页面显隐非判据）。
- AC 行候补 = 上抛 R13（需求档笔 = 主 agent——沿 AC-9/AC-10 先例）。

### 2.6 关键决策（KD-SV-19/20 行草）

- **KD-SV-19**（全文 = `ops/OPS.md` §8）：provider 配置面 = **库单源 + 保存即热生效**（控制台管理；密钥明文 ∥ `env:` 引用并存——引用保形；`config.json` 的 `providers[]` 降为一次性种子；热生效 = 注册表重建 + 原子换表——在途 = 派发时快照）。被否：保存即重启 ∥ config 主从双向同步 ∥ 全弃 config 段 ∥ `env:` 载入期解析 + 种子物化入库（密钥卫生退化）∥ meta 表种子标记。
- **KD-SV-20**（全文 = `webui/WEBUI.md` §7）：控制台 IA = **侧栏分组导航 + 一页一职责**（我的 3 页 ∥ 管理 4 页；hash `#/<组>/<页>`；旧链重定向；解析 = `nav.mjs` 纯函数；窄屏降级顶条）。被否：顶栏分区 ∥ 不重排 ∥ 框架路由 ∥ 服务端路径路由。

### 2.7 机检读数（D6 读回——`node scripts/doc-check.mjs` · 仓根 · 原始字节落盘避控制台编码）

- **改前基线**（本批首跑）：候选 49425 · 悬空 **62** · 注记豁免 331 · 拟新增 50 · 迁移期引文 303 · 声明源缺位 0；行宽 **2** 条（`ops/OPS.md`（356——#961 在途行）∥ `requirements/PROJECT.md:49`（458——需求档））。
- **改后**（留档 = `.thincoder/tmp/doc-check-final-utf8.txt`）：候选 **49500**（+75——本批新增行）· 悬空 **62**（**零增**）· 注记豁免 331 · 拟新增 **56**（+6——本批新档列报）· 迁移期引文 303 · 声明源缺位 0；行宽 **2**（同上前两条——触面外；OPS 行号 127 ⇒ 132 随本批插行位移）。exit 1 = #958 族 62 悬空 + 2 存量行宽（均非本批触面）。
- **本批触面**：新增闸态悬空 **0** ∥ 新增超宽 **0**（设计自检中本批 2 条超宽（OPS §1 预设条 358 ∥ WEBUI §1 落点 323）已就地拆行闭合——零语义；2 条裸路径 `ops/config.mjs` 悬空 ⇒ 全路径改形闭合）。

### 2.8 披露与顺带项（逐条报告）

- ① **存量行宽 2 条（非本批触面）**：`ops/OPS.md:132`（356——#961 在途内容，实施排队期由该批收）∥ `requirements/PROJECT.md:49`（458——需求档 §2:12 行，主 agent 笔）。
- ② **存量悬空 62 = #958 族**（server basename 碰撞）——本批零增（受影读数口径同 #961 先例）。
- ③ `public/index.html:8` favicon 引用 `/favicon.png` 现存档缺位（404——cosmetic）；用户 16:09 裁 favicon = 桌面 icon（`requirements/PROJECT.md` §2:12 杂项）——文件落地 = 首版完备化面；本批壳重排**保留该引用**（零触）。
- ④ **旧测试件随正四件**（实施轮义务——§2.4 清单）——归档件收口补丁先例在册；本设计批零写。
- ⑤ **KD-SV-9 计数句收正**（一致性面 ∥ D8）：「三视图/四档」句 ⇒ 「哈希路由（IA = §2 ∥ KD-SV-20）/静态档组」——决策本体（vanilla ∥ 零框架 ∥ 零构建）零改；同批 = `PROJECT.md` §1/§2.2/文档地图 webui 行三处计数句随正。
- ⑥ **依赖序（披露）**：`#/admin/system` 骨架先于首版完备化面落地 ⇒ 短暂空态（两节 + 空态文案）；多语言面接手 = `nav.mjs` 文案单源（结构零动）。实施派单定序。
- ⑦ `EVOLUTION.md` G2 断点**首次实际使用**（v1 ⇒ v2 迁移）——评估 = 文档零动（断点按设计使用，非新器级项）。

### 2.9 上抛项

- **R13（需求档回笔——主 agent 笔）**：AC-11 ∥ AC-12 候补行（判据草案 = `gateway/API.md` §5 ∥ `webui/WEBUI.md` §6）。先例 = AC-7–AC-10 回笔。
- **R14（实施后回填轮）**：预算实读（webui 重排 ∥ 新档）∥ 批内件实读 ∥ 旧件随正清单核销。
- 无「停下上抛」触发（§2:11/§2:14 两令 + 批档 §1 边界支撑本设计；零私自扩面；KD-SV-1–18 语义零改——计数句收正已披露）。

### 2.10 勘误追加（评审轮次 1 五条收正——fix 轮 · 2026-10-06）

- **#1 预设快速添加通道**（批侧收正面：item 5 ∥ §2.3⑤ ∥ §2.3⑥ ∥ 测试面腿）：契约全文落 `gateway/API.md` §2.2——**选型 a**：只读预设列表端点 `GET /api/admin/providers/presets` ⇒ `{ presets: [{ preset, name, baseURL, models }] }`（缺省展开 = `expandProviderEntry` 单源 ∥ 表零密钥）；控制台流 = 拉表 ⇒ 预填 ⇒ 补 `apiKey` ⇒ POST 全字段（校验不豁免）；POST 契约零动、写路径零新语义。
  - 覆盖表 item 5 设计落点句「（快速添加）」⇒「（预设列表端点——快速添加通道；全文落位）」。
  - §2.3⑤ 末句补「快速添加通道 = `GET …/presets` 拉表 ⇒ 预填 ⇒ POST 全字段」。
  - §2.3⑥ 计数「五端点」⇒「六端点」（+ 预设列表端点——只读；D3 计数随正）。
  - 测试面八腿 ⇒ 九腿：**⑨ 预设**（端点 ⇒ 全表 20 家 ∥ 缺省展开 ∥ 响应零密钥字段；预填不豁免校验——非法预填 ⇒ 400）。
- **#2 四处「候补」标记（已收正）**：`gateway/API.md` §5 ∥ `webui/WEBUI.md` §6 ∥ 板档 `PROJECT.md` §7 两行 + §9 R13 销项（沿 R7/R9 先例——两行已落 `docs/server/requirements/PROJECT.md` 验收表）；批侧随销 = §2.5 末行「AC 行候补 = 上抛 R13」与 §2.9 R13 条目（同现态：已落 ∥ 已办）。
- **#3 档目断言口径**（§2.4④）：旧件随正行「`public/**` 档目断言（四档 ⇒ 九档）」⇒ 统一口径「UI 代码档 4 ⇒ 9 ∥ 含 favicon 全目录 5 ⇒ 10」——与 `webui/WEBUI.md` §6 前端自洽行同拍。
- **#4 §2.4 bin 行补全基线形**：量列「+≈8」⇒「122 ⇒ ≈130（叠加 #961 后——122 = #961 回填实读；本批 ≈+8）」。
- **#5 测试面补拆分注记**：批内件 ≈450 行（300–500 软线外区间）⇒ 注记「按腿截面可拆（①–⑨ 为可分离截面）∥ 实施中逼近 500 即拆两件」。

### 2.11 R14 回填轮（fix 轮 · 2026-10-06——#962 实施后回填）

**范围** = 域档预算实读收正 ∥ `views.mjs` 退役形 ∥ 批内件实读 ∥ 随正清单核销 ∥ 板档总账随动（点改——全量探索零）。

- `webui/WEBUI.md` §5：九档实读收正（index **20** ∥ app **209** ∥ nav **81** ∥ views-auth **29** ∥ views-me **86** ∥ views-admin **137** ∥ views-providers **213** ∥ views-system **15** ∥ style **75**——六新档「拟新增」⇒「已落盘」标记翻正；小计 558 ⇒ **943**）∥ `views.mjs` 行改退役形（迁移期引文标记——原读数 244 · as-of）∥ 叠加链同拍（#963/i18n 结果值随 re-base——增量 +135/+630 不动）。
- `gateway/API.md` §4：routes **86** ∥ providers **146** ∥ provider-admin **197**（新档——标记翻正）；小计 658 ⇒ **951**。
- `store/STORE.md` §4：db **124**。
- `ops/OPS.md` §6：bin **126** ∥ config **180** ∥ README **146**；小计 1246 ⇒ **1270**；provider 面随动段转回填记录。
- 板档 `PROJECT.md` §6：全树 **4024 行（41 档）**（域级 gateway ⇒ 951 ∥ store ⇒ 124 ∥ webui ⇒ 943 ∥ ops ⇒ 1270；控制台面 +716 = webui +385 ∥ gateway +293 ∥ store +14 ∥ ops +24）；随动表本批行收正（批内件实读 **479**）；§9 R14 销项；对照设计总账承接闭式 ≈3247（+ 控制台面预期 ≈840）随动。
- 随正清单核销（他件——非本席笔；记录在册）：base/presets（父侧 17:1x 落）∥ `-webui-deploy`（父侧落：例改 `nav.mjs` ∥ 档目 9∥10 ∥ 短标题）∥ `-model-ref`（零改）∥ `-chat`（父侧落）∥ `-auto-update`（件数断言 8 ⇒ 9）。
- 机检（D6）：改前悬空 **68** ⇒ 改后 **67**（−1 = 本批触面 `WEBUI.md` 退役行；迁移期引文 303 ⇒ 304）；触面新增悬空 **0** ∥ 行宽零超（PROJECT.md §6 首改 307 超宽 ⇒ 就地拆行闭合）。

**披露（上抛）**：

① 需求档 `requirements/PROJECT.md:137` 的 `public/views.mjs` 仍计悬空——「已退役拆档（2026-10-06），档不在盘」不满足机检豁免形（豁免需「（迁移期引文」+ 史实谓词同现——仓内通行形 = 追加 `（迁移期引文——档已删）`）；需求档 = 主 agent 笔——转呈（本轮零触）。同档 `:75`（`deploy/backup.mjs`——#963 面）亦在悬空列（非本批触面）。
② 他批在途漂移（未改数——「他批在途笔迹漂移——不猜因、不改数」先例）：完备化批实施在写（mtime 17:35–17:38）——`config.mjs` 180 ⇒ 现读 189 ∥ `bin` 126 ⇒ 现读 148 ∥ `update.mjs` 228 ⇒ 现读 239 ∥ `errors.mjs` 55 ⇒ 现读 56 ∥ `system.mjs` 新档在盘 55；本回填按本批在册读数落值，其收正归该批回填轮。
③ 板档 `package.json` 行 25 ⇒ 现读 26（+1 = `2026-10-06-server-dev-script` 轻通道 pen——独立批账内）；本回填零触，归属其收口轮。
④ 派单在册悬空 67 vs 本席改前实测 68——差 +1（本席实读为准；未改数）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审范围**：批 `2026-10-06-console-providers` 设计轮全档（板/域 6 档/需求档/批档）；限制说明：本仓未声明 Project Standards 档与 Document Map——方法论合规按 AGENTS.md（Project Guide）评判、文档归属按设计集自带文档地图（`thincoder/docs/server/design/PROJECT.md` §3）校（均属降级检查）；受影响文件行数注记仅做跨档互检（源档不在评审面，未读）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements coverage / Clarity | 🔴 | 「从预设快速添加」无实现通道：覆盖表 item 5（`docs/batches/2026-10-06-console-providers.md:38`）与批 §2.3⑤（同档:67）、`thincoder/docs/server/design/webui/WEBUI.md:27`、同档:71 均把该面契约指到 `thincoder/docs/server/design/gateway/API.md` §2.2；但该档全档 grep 三种形（预设 ∥ 快速添加 ∥ preset）零命中（实核）——§2.2 端点表实读五端点（`thincoder/docs/server/design/gateway/API.md:43-47`）、POST 体为 `{ name, baseURL, apiKey?, models? }`（同档:44），无预设列表端点、无 `preset` 入参；`thincoder/docs/server/design/ops/OPS.md:38` 与 KD-SV-19（同档:209）称该面「复用 `presets.mjs`」，而 `public/` 为静态直发面（`thincoder/docs/server/design/webui/WEBUI.md:12`「读发 `public/`」）、无构建步、不可达 `src/ops/presets.mjs`——20 家预设表无通道送达前端。实现者只能自造契约外端点（契约面 = §2.2 端点表）或在前端复刻预设表（与 KD-SV-17 自持表/漂移纪律相抵）；批内件八腿（`docs/batches/2026-10-06-console-providers.md:101`）亦无预设腿。 | 在 `gateway/API.md` §2.2 补该面契约（如增预设列表端点，或 POST 体接受 `{preset, …}` 交服务端 `expandProviderEntry` 展开——二选一），并同步 `webui/WEBUI.md` §2/§6、批 §2.3⑤/覆盖表 item 5 及批内件验收腿。 |
| 2 | Doc state（跨档滞后） | 🟡 | AC-11/AC-12「候补」标记陈旧：需求档两行已落（`thincoder/docs/server/requirements/PROJECT.md:67`/`:68`；回笔在册——同档:129「验收表补 **AC-11**」），设计侧四处仍标未办——`thincoder/docs/server/design/gateway/API.md:84`、`thincoder/docs/server/design/webui/WEBUI.md:72`（均「候补行——需求档回笔 = 主 agent 笔」）、`thincoder/docs/server/design/PROJECT.md:151`/`:152`、同档:183（R13「待办」）；沿已办先例（同档:177/:179）应销项。 | 四处「候补行」标记与 R13 收正为「已办」（沿 R7/R9 先例），与需求档现态对齐。 |
| 3 | Doc state（跨档滞后） | 🟡 | 同一测试件的档目断言目标数两说：`thincoder/docs/server/design/webui/WEBUI.md:70`（「档目断言随正（含 favicon.png 共十档——`-webui-deploy` 件）」）vs `docs/batches/2026-10-06-console-providers.md:100`（「`public/**` 档目断言（四档 ⇒ 九档）」）；父侧收正只改了 WEBUI 侧（同档:21「目录断言按磁盘全量形」），§2.4④ 未随正——实施者拿不到唯一目标数（批:101 腿⑧与 `webui/WEBUI.md:72` 另按「静态九档」计）。 | 对齐两处：明确该断言的枚举口径（UI 代码档 9 ∥ 含 favicon 全目录 10），并把批 §2.4④ 与 `webui/WEBUI.md:70` 统一到同一数。 |
| 4 | Affected-file annotations | 🔵 | 批 §2.4 一行未按「实读 ⇒ 预期」注记当前行数：`thincoder-server/bin/thincoder-server.mjs` 量列仅「+≈8」（`docs/batches/2026-10-06-console-providers.md:84`）；当前/叠加后值在 `thincoder/docs/server/design/ops/OPS.md:174` 在册（「本批预期 ≈125」）但表内未给全。 | 补基线+预期形（如「113 ⇒ ≈133（叠加 #961 后）」），与表内其余行同形。 |
| 5 | Affected-file annotations | 🔵 | 批内件 `docs/batches/2026-10-06-console-providers.test.mjs` 设计估 ≈450 行（`docs/batches/2026-10-06-console-providers.md:101`），落 300–500 区间（软线外、硬限内）——设计未带拆分/控幅注记（八腿为可分离截面）。 | 补一行拆分注记（按腿截面可拆 ∥ 实施中逼近 500 即拆两件），使软线区处置显式。 |

**计数**：🔴 1 ∥ 🟡 2 ∥ 🔵 2（共 5 条）

VERDICT: changes-required

### 轮次 2（评审子代理）

**轮次 2（收敛核验）**——范围：逐条重读现行档（`gateway/API.md` ∥ `ops/OPS.md` ∥ `webui/WEBUI.md` ∥ 板 `PROJECT.md` ∥ 需求 `PROJECT.md` ∥ 批档全文）；核验对象 = 轮次 1 五条（fix 轮收正）。

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | `thincoder/docs/server/design/gateway/API.md` | 🔴 | Fixed | §2.2 增只读预设列表端点（第六端点）——`API.md:48`「预设清单（只读——「从预设快速添加」数据源）」∥「**表零密钥**——响应无 `apiKey` 字段」；通道句 `API.md:56`「**预设快速添加（通道 = 预设列表端点）**」（拉表 ⇒ 预填 ⇒ POST 全字段 ∥ 预填不豁免校验）；§5 AC-11 行 `API.md:86` 补「预设列表（`GET /api/admin/providers/presets` ⇒ 20 家 ∥ 响应零 `apiKey` 字段；预填 = 表单起手，写入仍走 POST 全字段 + 单源校验）」；`WEBUI.md:27`「测试/预设快速添加（数据源 = 预设列表端点——契约 = `gateway/API.md` §2.2）」∥ `WEBUI.md:71` 同拍；批 §2.10 #1 勘误在册（批:141「契约全文落 `gateway/API.md` §2.2——**选型 a**：只读预设列表端点」∥ 批:145「测试面八腿 ⇒ 九腿：**⑨ 预设**」）。原「五端点/无预设腿」表述按 append-only 机制由勘误销项。 |
| 2 | 2 | `docs/server/design/gateway/API.md` ∥ `design/webui/WEBUI.md` ∥ 板 `design/PROJECT.md` | 🟡 | Fixed | 四处「候补」标记全收正——`API.md:86` ∥ `WEBUI.md:72` ∥ 板 `PROJECT.md:151`/`:152`（均「已落需求档——`docs/server/requirements/PROJECT.md` 验收表」）∥ 板 `PROJECT.md:183`「**需求档回笔（已办）**」；批 §2.10 #2 随销在册。 |
| 3 | 3 | `docs/server/design/webui/WEBUI.md` ∥ 批档 §2.4 | 🟡 | Fixed | 档目口径统一——`WEBUI.md:70`「档目断言随正（口径 = UI 代码档 9 ∥ 含 favicon 全目录 10——`-webui-deploy` 件）」；批 §2.10 #3（批:147「⇒ 统一口径「UI 代码档 4 ⇒ 9 ∥ 含 favicon 全目录 5 ⇒ 10」」）同拍；§2.4④ 原「四档 ⇒ 九档」经勘误销项。 |
| 4 | 4 | 批档 §2.4 | 🔵 | Fixed | 基线形补全——批 §2.10 #4（批:148「122 ⇒ ≈130（叠加 #961 后——122 = #961 回填实读；本批 ≈+8）」）；与 `ops/OPS.md:175`「**122**（实读 2026-10-06」同拍。 |
| 5 | 5 | 批档 §2.4 | 🔵 | Fixed | 拆分注记补——批 §2.10 #5（批:149「按腿截面可拆（①–⑨ 为可分离截面）∥ 实施中逼近 500 即拆两件」）。 |

**计数**：轮次 1 五条 = **5/5 收正（Fixed）**；未决 = 0（🔴 0 ∥ 🟡 0 ∥ 🔵 0）；新发现 = 0。

VERDICT: pass

## §4 用户批准（主 agent）

**§4 用户批准（主 agent 代签）**——用户 2026-10-06 16:01「开啥玩笑！你觉得这是一个产品该干的事儿吗？！」+ 16:04「……都给补齐了」+ 16:13 IA 令；全链授权沿 §1 自缚三条。

- **三条件齐备**：① 评审 **pass**（§3 轮次 2——轮次 1 五条 5/5 收正核验 ∥ 新发现 0）；② 修正轮已落地并逐条核验（`#35` fix 轮五号收正 + 父侧机械收正：三处行宽拆行 ∥ AC-11 判据补预设句——§1 随记在册）；③ **token 已签发**（值不入档）。
- **批准范围** = 实施轮**两单分治**（face 分治——防跨面串扰）：
  - **A 服务面**（6 档）：`src/store/db.mjs`（迁移 v2——`providers` 表）∥ `src/ops/config.mjs`（种子语义 ∥ 校验单源导出 ∥ 载入期 `env:` 跳过）∥ `src/gateway/providers.mjs`（注册表 ∥ 运行时箱 ∥ 种子导入）∥ `src/gateway/provider-admin.mjs`（新——CRUD ∥ 掩码 ∥ 发现 ∥ presets 端点）∥ `src/gateway/routes.mjs`（读运行时）∥ `bin/thincoder-server.mjs`（运行时引导接线）。
  - **B 前端面 + 文档 + 批内件**（14 档）：`public/` 九档重排（`index.html` ∥ `app.mjs` ∥ `nav.mjs`（新）∥ `views-auth` ∥ `views-me` ∥ `views-admin` ∥ `views-providers` ∥ `views-system`（五新）∥ `views.mjs`（退役）∥ `style.css`）∥ `README.md` ∥ `config.example.json` ∥ `package.json`（prepublishOnly 八 ⇒ 九件）∥ 批内件 `docs/batches/2026-10-06-console-providers.test.mjs`（新——九腿）；**依赖 = A 先落**。
- **依据登记** = §3 轮次 1/2 ∥ §2（设计）∥ 需求 §2:11 / §2:14（AC-11 / AC-12）。可撤回。

## §5 实施记录（eng-coder）

**状态行**：实施完成（A 单六档 ∥ B 单前端九档 + README/package.json + 批内件落位 ∥ 九腿 9/9 绿 ∥ 九件 76/79（3 红 = 两旧件待父侧随正 P1/P2）∥ 审计 + advisor 各 1 轮，终态 clean）

**交付摘要（A 单六档）**：

- `thincoder-server/src/store/db.mjs`——迁移 v2（`providers` 表，STORE §2 逐列照抄；旧库自动升）：DDL_V2 :59-69 ∥ MIGRATIONS :72-75 ∥ `SCHEMA_VERSION`=2 :78。
- `thincoder-server/src/ops/config.mjs`——校验单源导出 `validateProviderEntry` :113-131 ∥ `validateProviderEntries` :133-138（三径：配置载入 :83 ∥ 启动构建 providers.mjs:143 ∥ 控制台保存 provider-admin.mjs:88/109/142）；`providers[].apiKey` 载入不解析 :52（引用保形）；零 provider 允许态 :83。
- `thincoder-server/src/gateway/providers.mjs`——行→条目 :23-39 ∥ `env:` 构建期解析 :48-56 ∥ 注册表 :60-90 ∥ 运行时箱 `get()/set()` :101-107 ∥ 种子导入矩阵四格 :112-128（日志 `providers_imported`/`providers_config_ignored`/`providers_empty`）∥ 装配引导 :133-146。
- `thincoder-server/src/gateway/provider-admin.mjs`（新，197 行）——六端点 :71/:85/:103/:126/:138/:188 ∥ 掩码 :24-29 ∥ 保存四步（校验→候选→落库→换表）:88-97 ∥ 发现（10s 可注入 ∥ 四类失败 502）:138-186 ∥ 判权 requireAdmin（零新码）。
- `thincoder-server/src/gateway/routes.mjs`——注册行引导运行时并返回 :30-32；`/v1/models` :54 与派发 :42 读 `runtime.get()`。
- `thincoder-server/bin/thincoder-server.mjs`——启动链接线 :96-97（gateway 注册行引导 → provider 管理面同实例）。

**决策透明表（实现自由裁量处——逐条披露）**：

| # | 点 | 取值 | 依据 |
|---|---|---|---|
| 1 | 保存路径步骤数 | **四步**（①校验②候选注册表③落库④换表） | 设计 §2.2 四编号原文；任务书手写「五步」为计数误差（内审已收正代码注释） |
| 2 | 零 provider 警告事件名 | `providers_empty`（自定） | 设计只钉消息义，未命名事件 |
| 3 | 管理变更日志事件名 | `provider_created`/`provider_updated`/`provider_deleted`（自定，只带名/id） | 设计只规定日志内容（名/id+动作） |
| 4 | discover 的 `env:` 缺位 | 400（同保存单源规则） | 设计只钉「启动拒启 ∥ 保存 400」；同规则推及草稿键 |
| 5 | 路径 id 解析 | `Number(rawId)` + `Number.isInteger`（非整数 ⇒ 404） | 沿既有账号面同则（`accounts/routes-admin.mjs` 同形） |
| 6 | 掩码短键（≤4 字符明文） | 全量回显（`…`+末 4 字面实现） | API.md §2.2 掩码句字面；加下限属设计面变更 |
| 7 | 种子「段空数组」 | 并入「段缺」格（不警告） | config 归一后不可区分；文档面可注明口径 |
| 8 | 「测试连通」页功能 | 未实现独立端点 | §2.2 六端点表无此面；最贴近 = discover（归设计/前端批） |

**审计与代码评审轮次与终态**：

- 内部 explore 偏离审计：**1 轮**——结论 DEVIATIONS（轻）：2 条记录面发现（§5 未写〔本段即销〕∥ 红点分档计数 6+2+1 修正[原报 5+2+1]）＋ 观察（discover∪既有清单 = B 单渲染口 ∥ 冒烟盲点[已补去重/无 data/非 JSON] ∥ 文案「五步」[已改] ∥ 预算实读）。
- 内部 advisor 代码评审（type=code）：**1 轮**，**VERDICT: pass**（无 🔴；🟡 2 条均非 must-fix：旧件随正协调项 ∥ OPS §4 启动链书写序〔文档面〕；🔵 5 条 optional）。响应表 = 交付报告；**采纳 0 条代码改动**（🔵 各条给出维持现状理由或归设计面）——评审后产品码零改（收敛态 clean；tmp 冒烟件加一条 chat-502 证据腿，非交付面）。
- fix 轮（审计→评审之间，3 处、均非产品语义）：① 注释「五步」⇒「四步」；② 冒烟补腿（discover 去重/无 data/非 JSON）；③ 冒烟脚本稳健化（子进程 stop 竞态、sqlite 句柄关闭、进度落盘）。

**验证读数（本单）**：

- `node --check` 六档全绿；零依赖扫描 = 26 档 / 87 import / 0 违规 / `dependencies` 空。
- tmp 冒烟 `.thincoder/tmp/cp-a-smoke.mjs`（真 bin 子进程 + 临时库 + 随机端口；自清理）终跑 **46 PASS / 0 FAIL**——含：种子四格（保形导入 ∥ 忽略+警告 ∥ 允许起+警告 ∥ 正常）∥ POST 后 `/v1/models` 立含 + 上游完成请求 ∥ PATCH 改 `baseURL` 命中新址 ∥ DELETE 后下一请求 404 + 用量行零触 ∥ PATCH 指已释放端口 ⇒ chat 502（E6 径）∥ 校验 400（非法/重名/env 缺位）且库与运行时零变 ∥ 发现 502/400/去重/草稿键不落库 ∥ 掩码（env 原文 ∥ `…1234`）∥ presets 20 家零 apiKey ∥ 401/403/200 ∥ 日志零明文。
- 八件复跑（cwd=仓根）：`tests 70 ∥ pass 61 ∥ fail 9`——9 红全为旧设计锚（gateway 6 ∥ presets 2 ∥ chat 1），**非产品回归**；本单任务书禁写他批档（写门禁实测拒），随正 = 父侧落地。

**旧件随正补丁清单（父侧原文对表；写门禁：本单不可写他批档）**：

*A. `docs/batches/2026-10-06-server-gateway.test.mjs`（6 处）*

1. :105 名 —— `test("config：fail-closed 校验六判据 ⇒ 拒启", () => {` ⇒ `test("config：fail-closed 校验 ⇒ 拒启 ∥ 零 provider = 允许态", () => {`
2. :110-111 删两行 —— `      ["缺 providers", baseConfig({ providers: undefined }), /providers/],` ＋ `      ["providers 空数组", baseConfig({ providers: [] }), /providers/],` ⇒ 删除
3. :126 后插块（for 循环尾 `}` 之后）——
```js
    // 零 provider = 允许态（fail-closed 移驻条目级——ops/OPS.md §1）
    for (const zero of [baseConfig({ providers: undefined }), baseConfig({ providers: [] })]) {
      const file = writeConfig(dir, zero)
      assert.deepEqual(CONFIG.loadConfig(file, { env: ENV }).config.providers, [], "零 provider ⇒ 允许（空清单）")
    }
```
4. :140 —— `assert.equal(config.providers[0].apiKey, "sk-test-value")` ⇒ `assert.equal(config.providers[0].apiKey, "env:TC_TEST_KEY") // 载入不解析（引用保形——注册表构建期解析）`
5. :150 —— `assert.throws(() => CONFIG.loadConfig(file, { env: {} }), /环境变量缺位：TC_TEST_KEY/)` ⇒
```js
    const kept = CONFIG.loadConfig(file, { env: {} })
    assert.equal(kept.config.providers[0].apiKey, "env:TC_TEST_KEY")
    assert.throws(() => PROVIDERS.createProviderRegistry(kept.config.providers, { env: {} }), /环境变量缺位：TC_TEST_KEY/)
```
6. :158 名 + :161/:162/:164/:180 —— `四表 + 三索引 + user_version=1` ⇒ `五表 + 三索引 + user_version=2`；`SCHEMA_VERSION, 1`⇒`2`；`readVersion(db), 1`⇒`2`；表表加 `"providers"`；`DB.migrate(db), 1`⇒`2`
7. :195/:199/:200/:201/:202 —— `readVersion(second), 1`⇒`2`；夹具 `{ v: 2, … "CREATE TABLE v2_probe" … }` ⇒ `{ v: 3, … "CREATE TABLE v3_probe" … }`；`/迁移失败（v2）/`⇒`/迁移失败（v3）/`；`readVersion(second), 1`⇒`2`；`'v2_probe'`⇒`'v3_probe'`（建议内层 `try/finally` 关库——防 Windows EPERM 掩盖主断言）
8. :213/:233/:247 —— `createProviderRegistry(config)` ⇒ `createProviderRegistry(config.providers, { env: ENV, engineModel: config.embedding.model })`；`createProviderRegistry(slashed)` ⇒ `createProviderRegistry(slashed.providers, { env: ENV })`；`modelList(config)` ⇒ `modelList(registry)`
9. :286 —— `registerGatewayRoutes(routes, { db, config })` ⇒ `registerGatewayRoutes(routes, { db, config, env: ENV })`

*B. `docs/batches/2026-10-06-server-presets.test.mjs`（2 处失效 + 注入口）*

10. :82/:85 —— `async function startGateway({ db, config }) {` ⇒ `{ db, config, env = process.env }`；`registerGatewayRoutes(routes, { db, config })` ⇒ `{ db, config, env }`
11. :176/:218 —— `apiKey: "sk-test-value"` ⇒ `apiKey: "env:TC_TEST_KEY"`（两处）
12. :183/:219 —— `startGateway({ db, config: live })` ⇒ 加 `, env: ENV`；`startGateway({ db, config: CONFIG.loadConfig(file, { env: ENV }).config })` ⇒ 加 `, env: ENV`
13. :194 注释 —— `（env: 已在载入期解析）` ⇒ `（env: 构建期解析）`

*C. `docs/batches/2026-10-06-server-gateway-chat.test.mjs`（1 处——设计 §2.4 清单外新增项）*

14. :405-406 —— 在 `const dead = await freePort()` 与第二网关之间插一行（库单源——改行即换上游）：
```js
    db.prepare("UPDATE providers SET base_url = ? WHERE name = 'mock'").run(`http://127.0.0.1:${dead}/v1`) // 库单源（§2.2）——同库二次装配不再吃 config 段
```
**判定依据（非回归）**：旧版 `routes.mjs:28`（HEAD）`createProviderRegistry(config) // 配置静态，注册期建表`——该件 :382 同库 + :406 换 config 二次装配即依赖此；新设计 OPS §1 矩阵「库非空 + 段在场 ⇒ 忽略 + 警告」+ KD-SV-19 已废该依赖；502 能力未回退（本单冒烟：PATCH 改行指死端口 ⇒ chat 502 实测）。

**披露（上抛）**：

1. 旧件随正 9 处（gateway 6 ∥ presets 2 ∥ chat 1）：逐处补丁见上；父侧落地后复跑取证（批 §4）。
2. 种子导入先提交、构建期 `env:` 缺位 ⇒ 拒启且库留行（无回滚）；重启转「忽略+警告」但仍拒启——建议 README/运维面记录（先修 env 再起）。
3. 并行批在飞（first-release-completeness）——`gateway/API.md` 有其未提交改动，非本单触面（本单文档零笔）。
4. 实读行数（R14 回填口径）：db **124** ∥ config **180** ∥ providers **146** ∥ provider-admin **197** ∥ routes **86** ∥ bin **126**（全 ≤300）。
5. 「测试连通」无独立端点（归设计/前端批）；写端点 JSON 型门（DELETE 亦须 `Content-Type: application/json`）——B 单前端须遵守（server.mjs:168 既有行为）。

### 实施轮 B（前端面 + 文档 + 批内件——本段第二作者块）

**交付摘要（B 单 14 档；依赖 A 单已落——provider-admin/runtime 在盘）**

- `public/` 九档重排（目录十项 = 九 UI 代码档 + `favicon.png`）：
  - `nav.mjs`（新，81 行）——IA 单源：`NAV_GROUPS`（我的 3 ∥ 管理 4 ∥ `adminOnly`）:13-25 ∥ `resolveRoute` 纯函数（别名重定向 ∥ 角色默认 ∥ admin 面 `denied`）:52-61 ∥ `renderSidebar`（品牌 ∥ 组/项/活动态 ∥ meta 槽 + 退出）:64-81；顶层零 DOM（node 可直 import）。
  - `views-auth.mjs`（新，29）登录 ∥ `views-me.mjs`（新，86）keys/usage/account 三页 ∥ `views-admin.mjs`（新，137）members/usage 两页（单页堆叠拆开）∥ `views-providers.mjs`（新，213）列表/增改删/发现/勾选/测试/预设快速添加 ∥ `views-system.mjs`（新，15）两节容器 + 空态（挂点不填内容）。
  - `app.mjs`（209）——七页路由表 :140-148 ∥ 旧链重定向替换 hash :176 ∥ `showSecret`/`usageTable` 两共用助手移入（跨页单源）:58-77 ∣ `index.html`（20）侧栏壳（`aside#nav` + 内容区）∣ `style.css`（75）侧栏/分组/活动态 + ≤760px 顶条媒体查询 :69-75。
  - `views.mjs` 退役（删除；内容拆入五档）。
- `README.md`——§2 `providers[]`「首启种子」句 :44 ∥ `env:` 例外 :47 ∥ 预设双消费面 :54 ∥ fail-closed 去「providers 空」+ 零 provider 允许态 :57-58 ∥ 保存即热生效 :59 ∥ §6 七页 IA + 重定向 + 掩码 :100-106 ∥ §10 文件不热载句 :144。
- `package.json`——`prepublishOnly` 八 ⇒ 九件（+本批件）:13；`config.example.json` 零动（设计 §2.4「种子示例形保留」明示）。
- 批内件 `docs/batches/2026-10-06-console-providers.test.mjs`（新，479 行；九腿 = 9 tests）：① 三态（含 PATCH/DELETE 代表面）② 热生效三径（POST 立见/PATCH 换址/DELETE 404）③ 在途流跨删除 ④ 密钥/日志/草稿键 ⑤ 发现四失败径 + 手填降级 ⑥ 种子四格 ⑦ 校验单源零变 ⑧ nav 直测 + 静态十档/零外链/接线/直发 ⑨ 预设 20 家。

**决策透明表（实现自由裁量——逐条披露）**

| # | 点 | 取值 | 依据/说明 |
|---|---|---|---|
| 1 | `showSecret`/`usageTable` 落点 | 移入 `app.mjs`（ctx 助手单源） | 九档口径不允许新增共享档；app.mjs 既持「渲染助手」职责 + ctx 注入先例（table/fmt* 同径）——实读 app 209（设计 ≈190；含 i18n 口径 ≈230 内） |
| 2 | 「测试连通」径 | `POST /api/admin/providers/discover` + `providerId`（取库内 key） | 设计 §2.2 无独立连通端点（A 单披露⑤；父侧前置注同拍） |
| 3 | `from`/`to` 查询键写法 | 模板字面量（非引号字面量） | D1 件（`2026-10-06-server-gateway.test.mjs:387`）`\bfrom\s*["']…` 扫全树 .mjs——引号形被扫成伪 specifier 于 :394 判红；本单实证对照（引号形 1 命中 ∥ 模板形 0 命中）；原档注释 verbatim 携带 |
| 4 | 编辑态密钥语义 | 留空 = 不修改 ∥ 勾「清除密钥」⇒ `apiKey:""` ∥ 非空 ⇒ 改新值；掩码永不回填输入框 | API.md §2.2 PATCH 语义（字段缺省 = 不动；`""` = 清除）——防掩码被当新值提交 |
| 5 | 发现清单默认勾选 | 勾选 = 既有开放清单；新发现未勾（勾选后入列） | 「勾选开放」为用户动作；并列入列（发现 ∪ 存量——防误删）= 设计原文 |
| 6 | 预设快速添加 UI | 独立小卡（下拉 + 载入预填）⇒ 预填同名表单 | 设计只钉「拉表 ⇒ 预填 ⇒ 补 `apiKey` ⇒ POST 全字段」；校验不豁免（⑨ 腿重名 400 断言） |
| 7 | 系统页空态文案 ∥ nav 组标签措辞 | 文案 = 挂点占位（随后续版本提供）∥ 标签 = nav.mjs 单源 | 设计只钉「两节容器 + 空态」与页路径/职责；措辞 = 实现裁量（i18n 轮改 `labelKey`——挂点注释在档） |

**审计与代码评审轮次与终态**

- 内部 explore 偏离审计：**1 轮**——**CONCLUSION: clean**（四类偏差 0；7 条 = 0 偏离 ∥ 2 观察 ∥ 5 非偏差）。观察两条处置：① 批内件实读行数按 read 口径更正（478 ⇒ 现 479）；② 腿① PATCH/DELETE 三态代表面 ⇒ **已补 2 断言**（现盘 :183-184）。
- 内部 advisor 代码评审（type=code）：**1 轮**，**VERDICT: pass**（0 🔴 ∥ 2 🟡 均非 must-fix ∥ 3 🔵）。处置（响应表 = 交付报告）：🟡① 两旧件随正维持（跨批写门禁 + 父侧在落——P1/P2）；🟡② 批内件 479 行维持（未破 500 硬限、拆预案在册）；🔵③ 行数漂移归 R14 回填；🔵④ views-admin 注释约束**溯源闭合**（实证成立——决策表 #3）；🔵⑤ 档目断言双处同锚维持（WEBUI §6 定 owner = `-webui-deploy` 件；本件 ⑧ 腿 = 设计腿列明的本批验收面）。
- fix 轮：审计后 1 处（腿① 补断言）——**产品码零改**（收敛态 clean；无未决项）。

**验证读数（本单）**

- `node --check`：public 七 .mjs + 批内件全绿。
- 批内件九腿：`node --test docs/batches/2026-10-06-console-providers.test.mjs` ⇒ **9/9 pass / 0 fail**。
- DOM 冒烟（tmp 件 `.thincoder/tmp/cp-b-dom-smoke.mjs`——最小 DOM 垫片 + 真服务端到端）：**26/26 通过**——未登录⇒#/login ∥ admin 登录⇒#/admin/members ∥ 侧栏七页（3+4）+活动态 ∥ 轮换一次性明文 ∥ 旧链两重定向 ∥ 预设预填⇒保存⇒掩码…1234 ∥ 测试连通⇒mock 上游 /models ∥ 删除⇒空态 ∥ 系统页两节 ∥ user 面 denied ∥ 登出/再登录。
- 九件全量回归（cwd=仓根）+ `npm run prepublishOnly`（更新后）：同读数 `tests 79 ∥ pass 76 ∥ fail 3`——3 红全为**两旧件待随正**（非本交付面）：`-auto-update.test.mjs:480`（应列 8 ⇒ 9）∥ `-webui-deploy.test.mjs:239/:274`（`/views.mjs` 用例 + 五档名单 ⇒ 十档）。

**披露（上抛）**

1. **父侧随正两件（P1/P2——写门禁拦截实施面）**：P1 = `docs/batches/2026-10-06-server-auto-update.test.mjs:480` 件数 8 ⇒ 9（头注 `:9`/`:439`「八件」句宜同改）；P2 = `docs/batches/2026-10-06-server-gateway-webui-deploy.test.mjs`——`:239` `["/views.mjs", "views.mjs", "text/javascript"],` ⇒ 新档（建议 `/nav.mjs`）；`:271-274`「五档在册」⇒「九档在册（含 favicon 共十档）」+ 名单 = `["app.mjs", "favicon.png", "index.html", "nav.mjs", "style.css", "views-admin.mjs", "views-auth.mjs", "views-me.mjs", "views-providers.mjs", "views-system.mjs"]`；`:13` 头注「四档在册」句同改。落地后九件即全绿。
2. 行数实读（R14 口径）：index **20** ∥ app **209** ∥ nav **81** ∥ views-auth **29** ∥ views-me **86** ∥ views-admin **137** ∥ views-providers **213** ∥ views-system **15** ∥ style **75**；批内件 **479**（≤500 硬限——余 21）。
3. 批内件近硬限：若后续轮再增断言 ⇒ 按腿截面拆两件（服务面 ①–⑤ ∥ ⑥–⑨）并随正 `prepublishOnly`。
4. `.thincoder/tmp/cp-b-dom-smoke.mjs` = 临时证据件（不入交付；沿先例留 tmp）。
5. `config.example.json` 零动（十四档中此档 = 核验态非改写态——设计明示）。

## §6 验证与收口（父代理）

**§6 验证与收口（父代理 · 2026-10-06 18:4x）**

**核销同步清单（逐项）**：

- **角色表**：§1 主 agent（授权 ∥ 随正 ∥ A/B 核验记录）∥ §2 eng-designer（设计轮 + §2.10 勘误 + §2.11 R14 回填）∥ §3 设计评审（轮 1 changes-required（🔴1 ∥ 🟡2 ∥ 🔵2）→ fix → 轮 2 pass（5/5 Fixed））∥ §4 主 agent 代签（三条件齐备在册）∥ §5 eng-coder（A/B 双单）∥ §6 父代理。
- **修正轮落地前置**：轮 1 五条 5/5 收正并逐条核验 ✓（§3 轮 2）；R14 回填（`#49`）落地 ✓（§2.11）；父侧随正 P1/P2 落地并复跑取证 ✓（§1——九件 **79/79**）；锚面连带（`views.mjs` 退役两处）R14 收正 ✓；需求档 `views.mjs` 行豁免形在盘 ✓（`requirements/PROJECT.md:137`）。
- **搁置清单回核**：本批无搁置 →「无」。
- **暂缓批复核**：**暂缓批复核：无**。
- **用户文档面同拍**：需求档 AC-11 ∥ AC-12 两行已落（R13 已办——§2.10 #2）；§2:11/§2:14 形态定稿句在盘（`:138` 变更记录行）✓。
- **计数**：本批面实读（R14 口径 · as-of 本批）：webui **943** ∥ gateway **951** ∥ store **124** ∥ ops **1270** ∥ 批内件 **479** ∥ 全树 **4024/41 档**。**后续漂移在册**：完备化批 R16 已推进（全树 **4534/44 档**）——各批 as-of 为界，不追改。
- **指针**：R13 已办 ∥ R14 已办（§2.10/§2.11 销项）；悬空面 = #958 族（非本批触面）。
- **变更记录**：板/域六档变更记录行在盘（R14 随车）✓。
- **台账可见面**：`#962` → **待核销**（证据 = 本节 + 提交哈希）；`#966`（IA 扩展——本批收编同交付面）同拍核销。
- **前批遗留核对**：前情 = `server-presets` §6（已收口 ✓）；`#961` 同触面串行处置 ✓（实施排队 + 叠加口径）。
- **真机面**：控制台浏览器实走 = 用户面（留用户）；容器真机 = `#959` 条件窗。

**验证读数（父侧收口核）**：九件 **79/79**（含本批件 9/9）∥ `prepublishOnly` 九件版绿 ✓；完备化批入第十件后 93/93（其批内读数——本行不追改）。

**提交**：**随 server 波统一**（#962 + 完备化 + i18n 三批文件同址叠加——一次提交；避扫入在写同址档）；提交落地后本行回填哈希并 `batch close`。

**提交回填**：产品波 `9d33046a`（33 档——provider 控制台 + 完备化 + i18n 一次提交；双推 origin ∥ github ✓）；文档面（本档 ∥ 设计回填 ∥ 测试档）随 docs 波统一提交（在册）。**收口链全链完成**（§2 设计 → §3 评审 pass → §4 代签 → §6 核销）。
