# 2026-10-06 · console-providers
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-06 · 来源 = 用户 2026-10-06 16:01「开啥玩笑！你觉得这是一个产品该干的事儿吗？！」+ 16:04「……都给补齐了」——需求 = 控制台 provider/模型管理（需求档 §2:11 ∥ 台账 #962）。
> 台账 = #962（server · 归批）。前情 = docs/batches/2026-10-06-server-presets.md §6（已收口 2026-10-06）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**§1 讨论（主 agent）**

**任务与来源**：用户 2026-10-06 16:01「开啥玩笑！你觉得这是一个产品该干的事儿吗？！」（走查控制台后）→ 16:04「……都给补齐了」。需求 = **控制台 provider/模型管理**（需求档 §2:11；台账 #962）：provider 增删改上界面 ∥ 密钥落服务端 ∥ 模型发现（调上游列真实模型）与勾选开放 ∥ 保存生效（**推翻「配置不热载」现状口径**）∥ 与预设面衔接（预设 = 界面快速添加）∥ 与 `config.json` 关系（迁入 ∥ 主从 ∥ 过渡并存 = 设计轮定）。

**现状核查（父侧）**：控制台三视图（`public/views.mjs:2` 自述——登录/我的/管理）无 provider 面（webui 面 grep 零命中）；provider/模型只住 `config.json` + 重启（README §2/§10 实读）；预设形（#960）已落 = 本功能天然起点。

**授权**：本会话既定委托延续（代点火 + 代批准 · 自缚三条同前）。

**边界**：KD-SV-1–18 语义零改（可增决策行）；转发/计量/账号面零改（除 provider 读取源迁移接缝）；发布面零涉；**与在途批串行**：#961 实施在飞（同触 `config.mjs`/README）——实施排队、设计并行。

**范围扩展（用户 2026-10-06 16:13 在飞裁定 · 需求 §2:14 入面——父侧直接执行 · 可 revert）**：**控制台信息架构与导航重规划**一并入本轮（`#31` 已 steer）：功能分组上导航 ∥ 一页一职责（拆「管理」单页堆叠）∥ provider 页长在新 IA 里；#963/#965 控台面服从本轮 IA 定稿（挂点留好）。台账 = #966。本批交付面 = 「控制台：provider/模型管理 + IA/导航重规划」。

**父侧随轮收正（交卷核验——机械类 · 可 revert）**：`WEBUI.md` §5 小计句「public 档数 4 ⇒ 8」⇒「4 ⇒ 9」（差一收正）∥ §6 前端自洽行「档目断言随正（九档）」⇒「（含 favicon.png 共十档）」（目录断言按磁盘全量形）；披露③「favicon 引用现存档缺位」为**陈旧读数**——`public/favicon.png` 已在盘（16:10 父侧落地）、运行实例 `GET /favicon.png` ⇒ 200 实核（非待办）。

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

## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
