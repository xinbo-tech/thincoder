# Thincoder Server · 接口契约（gateway/API）

> 板块 = server ∥ 本档 = gateway 域（http 服务/路由注册 ∥ OpenAI 三面 ∥ 转发 ∥ sse-tap ∥ providers ∥ 错误形）；板总览 = `PROJECT.md`（文档地图 = §3）。
> 需求单源 = `docs/server/requirements/PROJECT.md`（功能点 2 ∥ 3 ∥ 6）；本域回指 = `PROJECT.md` §7（AC-2 ∥ AC-6 判据 = 本档 §5）。
> 建档：2026-10-06（批 `docs/batches/2026-10-06-server-gateway.md` 设计轮；同日补轮——B 案织入 + 三层结构）。

## 1. 路由面（三族 + 兜底）

| 族 | 方法 + 路径 | 鉴权 | 详表 |
|---|---|---|---|
| OpenAI 面 | `POST /v1/chat/completions` ∥ `GET /v1/models` ∥ `POST /v1/embeddings` | 团队 key（`Authorization: Bearer`——唯一接受形） | 本档 §2 |
| provider 管理面 | `GET/POST/PATCH/DELETE /api/admin/providers*` | admin 会话（服务端判定——`user` ⇒ 403） | 本档 §2.2 |
| 账号/自助/管理面 | `/api/*`（成员/用量族——provider 管理面另列） | 会话 cookie + 角色判定 | `accounts/ACCOUNTS.md` §3 ∥ `metering/METERING.md` §3（用量/配额端点） |
| 系统面 | `GET /healthz`（公开——零鉴权只读探活） ∥ `GET /api/system`（会话——版本/更新状态） | 无 ∥ 会话 | 本档 §2.3 |
| 控制台数据面 | `GET /api/overview`（管理总览读数） ∥ `GET /api/admin/embedding` ∥ `POST /api/admin/embedding/test`（向量服务面——探活/试跑） ∥ `GET/PATCH /api/admin/config`（配置面——读写 config.json；`ops/OPS.md` §1） ∥ `POST /api/admin/proxy/test`（代理连通测试——真打；`webui/WEBUI.md` §2.7） | admin 会话（服务端判定——`user` ⇒ 403） | 本档 §2.4 |
| 前端静态面 | `GET /` ∥ `public/**`（`app.mjs` ∥ `nav.mjs` ∥ `views-*` 十一档 ∥ `style.css`） | 公开（页面壳零数据） | `webui/WEBUI.md` §1 |
| 其余 | —— | —— | 404（JSON 错误形 = §3） |

- 分派 = `thincoder-server/src/gateway/server.mjs`（已落盘）注册行制——新端点 = 注册一行（断点列 = `EVOLUTION.md` §1-G1）。
- 团队 key 面全部走 `Authorization: Bearer <key>`（OpenAI 兼容工具默认形——唯一接受形）。

## 2. OpenAI 三面

| 方法 + 路径 | 鉴权 | 语义 |
|---|---|---|
| `POST /v1/chat/completions` | 团队 key | 上游聊天转发（流式 SSE ∥ 非流式 JSON 均透传）；记账；派发命中后过**成员模型禁用准入**（404 `model_not_found`——§2.1/KD-SV-42）与配额准入（429 `quota_exceeded`——§2.1/KD-SV-38）与模型限流准入（429 `rate_limited`——§2.1） |
| `GET /v1/models` | 团队 key | 模型清单（chat 清单——`id` = **对外标识**：配别名 ⇒ 别名 ∥ 未配 ⇒ `provider/model` 前缀名（2026-10-09 alias 批；机制 = §6 KD-SV-59）；**嵌入引擎模型不入本清单**（单独命名空间——嵌入派发面 = §2；2026-10-09 embed 解耦批；机制 = §6 KD-SV-58）；**运行时注册表派生**：开放清单 = 库内 `providers.models`，保存即换表——§2.2；**成员禁用随动滤除**——调用者禁用集不在列（§2.1/KD-SV-42）） |
| `POST /v1/embeddings` | 团队 key | 内网引擎转发（响应透传）；记账；**缺 `embedding` 段 ⇒ 404 `model_not_found`（消息明示未配置——嵌入面禁用态；2026-10-09 embed 解耦批）** |

### 2.1 转发与计量行为（三面共用）

- **派发 = 对外标识精确匹配**（注册表查表——装配期构建 ∥ 保存即换表（§2.2）；**对外标识 = 配了别名 ⇒ 别名 ∥ 未配 ⇒ `provider/model`**（`provider/model` 形 = 首斜杠切分：首段 = provider ∥ 余段 = 上游模型名（可含斜杠）；两段非空）；
  **配了只认别名**（旧 `provider/model` 名（该模型已配别名）⇒ 404 `model_not_found`——消息明示含别名 ∥ 非别名裸名 ⇒ 404 同形）；未命中 ⇒ 404 `model_not_found`；**别名全服唯一**——撞 ⇒ 拒启 ∥ 保存 400（KD-SV-59）∥ **同 provider 内重名 ⇒ 拒启**）——KD-SV-4/59（§6）；
  **解析 = server 面自持**（不沿用核 `parseModelRef` 冒号家族——两套面：仓内他面锚 `provider:model` ∥ 本面锚 `provider/model`）。
- **配额准入（功能点 21——KD-SV-38）**：派发命中后、转发前（与限流准入并列——准入前拒打不落用量不变）；三级解析（成员×模型覆盖 ⇒ 平台 `settings.quotaTokens` ⇒ 不限——覆盖随鉴权行、平台值随运行时快照）；不限 ⇒ **零 SQL 短路**；命中 ⇒ 计数表点查（O(1)——表 = `store/STORE.md` §2 v5 段；维护 = 记账同事务——`metering/METERING.md` §1）。
  超限 ⇒ 429 `quota_exceeded`（message 含模型外标 + 已用/额度；他模型不受累）；**仅 chat**——嵌入面零涉（用户 09:31 裁；旧总额检查已移除）。
- **成员模型禁用准入（功能点 23③——KD-SV-42）**：派发命中后、**配额准入前**检该成员禁用集（随鉴权行——零查询）；被禁 ⇒ 404 `model_not_found`（消息明示「已对该成员禁用」——**零新码**）；**禁用优先于配额**（被禁即拒，不涉配额判定）；`/v1/models` 同判随动（输出 = 开放清单 − 调用者禁用集）；**仅 chat**——嵌入面零涉；机制全文 = `accounts/ACCOUNTS.md` §2.2（存储/写面/与配额关系/审计口径）。
- **模型限流准入（功能点 17 C——KD-SV-35）**：派发命中后、转发前检 per-model RPM/TPM（配额准入之后——同一位点；进程内存 60s 定窗；通过 ⇒ 计次 +1；token 于用量到达计入——失败/断开计次不计 token）；超限 ⇒ 429 `rate_limited` + `Retry-After`（秒——距窗尾）；限值源 = provider `settings`（空 = 不限）；热生效 = 换表链随动；重启归零（软状态）；嵌入面零涉（引擎模型非 provider 模型——配置面 = 系统页）。
- **上游出口代理（逐渠——KD-SV-55）**：条目标 `proxy: true` ∧ 顶层 `proxy.uri` 在案 ⇒ 该渠上游请求（**chat 转发 ∥ 模型发现探针——同判定**）经代理；缺省 ∥ 非真 ∥ 无 uri ⇒ 直连；loopback 目标恒直连（NO_PROXY 语义——D-PX9）；**无全局闸**（逐渠独立——D-PX1）；嵌入 ∥ 更新自检零涉；实现 = `thincoder-server/src/gateway/proxy.mjs`（自持 std——零第三方；TLS 全量）。配置 = `ops/OPS.md` §1；全文 = §6 KD-SV-55。
- **SSE 逐块透传**：中继字节面原样 `pipe`（零改）；客户端断连 ⇒ 中止上游（记 `status='aborted'`）。
- **流式计量注入**：`stream === true` 且未带 `stream_options.include_usage: true` ⇒ 置 true（显式 false 亦覆盖——计量完整性优先）——KD-SV-5（§6）。
- **usage 提取**：旁路 tap 只读扫描 `data:` 行 JSON（行缓冲 ∥ 单行上限 1 MiB ∥ BOM 剥除 ∥ CRLF 容错）——KD-SV-10（§6）；记录面（落库形 ∥ 写入时点）= `metering/METERING.md` §1。
- 含 usage 的帧对消费方无扰（四端核 `readSSE` 对 usage 帧直取后跳）。
- 上游配置（provider 库单源 ∥ `embedding` 段）= `ops/OPS.md` §1 ∥ §2.2。

### 2.2 provider 管理面（控制台——仅 admin）

（端点族 = `/api/admin/providers/*`；判权 = `accounts/ACCOUNTS.md` §3 `requireAdmin` 口径——`user` ⇒ 403 ∥ 无/过期会话 ⇒ 401；错误形 = §3 全码沿用——无新码；写端点 JSON 型门同 §1 前言）

| 方法 + 路径 | 语义 |
|---|---|
| `GET /api/admin/providers` | 列表 `{ providers: [{ id, name, baseURL, apiKey, models, settings, modelMeta, proxy, createdAt, updatedAt }] }`——`settings` = 模型设置映射（见下）；`modelMeta` = 上游模型元数据留存图（见下「模型元数据」）；`apiKey` = 回显形（掩码——见下） |
| `POST /api/admin/providers` | 新增 `{ name, baseURL, apiKey?, models?, modelMeta?, proxy? }` ⇒ `{ ok, id }`；校验不过 ∥ 重名 ⇒ 400（库与运行时零变）；`modelMeta` = 期望图（见下「模型元数据」）；`proxy` = 上游代理旗（缺省 `false`；非布尔 ⇒ 400——见下「上游代理旗」） |
| `PATCH /api/admin/providers/:id` | 修改（字段缺省 = 不动；`apiKey: ""` = 清除；可含 `env:` 引用；`settings` = 模型设置局部映射——键级合并，见下；`modelMeta` = 期望图——过滤 + 与提交 `models` 求交，见下；`proxy` = 布尔直写，缺省 = 不动）；不存在 ⇒ 404 |
| `DELETE /api/admin/providers/:id` | 删除（硬删——用量行零触）；不存在 ⇒ 404 |
| `POST /api/admin/providers/discover` | 模型发现（草稿可用）`{ baseURL, apiKey?, providerId?, proxy? }` ⇒ `{ models: [...], modelMeta: { "<id>": {…} } }`（留存集——见下「模型元数据」）；失败 ⇒ 502 `upstream_error`；`proxy` = 代理判定明传（**明传优先 ∥ `providerId` 条目旗兜底 ∥ 皆无 ⇒ 直连**——与 chat 转发同判定，见 §2.1） |
| `GET /api/admin/providers/presets` | 预设清单（只读——「从预设快速添加」数据源）`{ presets: [{ preset, name, baseURL, models: [] }] }`——全表（起步 21 家；**2026-10-09 清除批：零 `model` 键；`models` = 空清单保留**——模型清单表 = 空表，勾选走「模型发现」）；缺省展开 = `expandProviderEntry`（`thincoder-server/src/ops/presets.mjs`——KD-SV-17）；**表零密钥**——响应无 `apiKey` 字段 |

- **存储 = 库单源**：`providers` 表（`store/STORE.md` §2 v2 段）；`config.json` 的 `providers[]` 降为一次性种子（矩阵 = `ops/OPS.md` §1）。
- **保存即热生效**（用户 2026-10-06 16:01 令）：装配期建 provider 运行时（箱内持注册表）；保存路径 = ① 校验（单源 = `thincoder-server/src/ops/config.mjs` 导出——与配置种子同规）→ ② 建候选注册表（`env:` 解析——缺位 ⇒ 400 不落库）→ ③ 落库 → ④ `runtime.set(候选)`（原子换表）；HTTP 面（`/v1/models` ∥ 派发）读 `runtime.get()`——**零重启**。
- **在途请求口径**：派发时快照（转发闭包持当时 provider 对象）——换表只影响**后续**请求；删除/改名不断在途流。
- **密钥回显形**（永不回明文）：空 ⇒ `""`；`env:` 引用 ⇒ 原文（引用非秘密）；明文 ⇒ `…` + 末 4 字符。密钥值**永不入日志**（日志只带 provider 名/id 与动作）。
- **上游代理旗（`proxy`——台账 #1129）**：条目布尔字段（存储 = v9 列——`store/STORE.md` §2）；写面 = POST/PATCH ∥ 种子条目（两形同携——`ops/OPS.md` §1）；读面 = GET 行 `proxy`；判定与消费 = §2.1 条（**无全局闸**——逐渠独立）；控制台面 = 两窗勾选（`webui/WEBUI.md` §2.4④）；非布尔 ⇒ 400（校验单源 = `thincoder-server/src/ops/config.mjs`）；保存即热生效（构建期注入 `proxyUri` ⇒ 换表——在途照旧）。
- **模型发现**：`GET {baseURL}/models`（Authorization 条件同转发——key 空不发）；**代理条件同转发**（明传 `proxy` ∥ `providerId` 条目旗——同判定；出口 = `proxyFetch`）；超时 10s（常量可覆盖——实现注入口径）；解析 = `data[].id` 字符串集（去重）+ **保留集元数据**（`modelMeta`——见下「模型元数据」条；同响应同集、去重首见）；
  不可达 ∥ 超时 ∥ 非 JSON ∥ 无 `data` ⇒ 502 `upstream_error`（可读消息——控制面提示 + 重试；**无手填兜底**——用户 2026-10-06 21:36 裁定，批 `console-provider-redo`；服务端语义零改）；草稿键经 body 传入**不落库**。
- **模型元数据（留存图——功能点 24：上游富字段保留 + 展示）**：保留集 = **白名单四字段**（用途先行——用户 2026-10-07 12:11 裁「只取有用途字段、不建机制、缺就空着」）——
  `displayName`（展示名；**源 = `display_name` 优先**（在场且 trim 非空）——缺位 ∥ 非字符串 ∥ 空白串 ⇒ **回落 `name`**；两源过同一洁净面（≠ 模型名 ∥ ≤200 字符，沿 settings `note` 先例）——洁净面不过 ⇒ 略（**不再二次回落**）；存储 = 原文（判定用 trim——不回写））∥ `contextWindow`（上下文窗口；来源 `context_window` ∥ `context_length` ∥ `max_model_len`——正整数）∥
  `vision`（图片输入；来源 `supports_image_in === true` ∥ `input_modalities` 含 `image`——仅收 `true`）∥ `status`（上游状态原文；**仅命中退役词表**（`shutdown` ∥ `retired` ∥ `deprecated` 子串——大小写无关）才收，供退役提示）。
  未收录不采（推理档位族 `effort`/`think_efforts`/`thinking_type`/`supports_reasoning` ∥ `supports_video_in` ∥ `max_output_tokens` ∥ `modalities`/`limit`（方向/形未明）∥ 噪声族——无展示/动作面，不堆砌）；形不符 ∥ 缺 ⇒ 略（零兜底值、零占位）。
  形 = `{ "<上游模型名>": { displayName? ∥ contextWindow? ∥ vision? ∥ status? } }`——**≥1 字段才入键**；只含开放清单（`models`）模型。
  写面 = POST/PATCH body `modelMeta`：**键在场 = 期望图**（白名单过滤 + 形不符即略 + 与提交 `models` 求交落库）；**键缺省 = 现存图按 `models` 求交**（删项随之滑落——零孤儿）；非对象 ⇒ 400（库与运行时零变）。
  **撤销面口径**（2026-10-09 补记）：上游不再报某字段 ⇒ 存储值**不被带落**（控制台保存期望图 = 存储 ∪ 发现——发现值优先 ∥ 存储补齐）；**UI 无逐字段清空径**——字段清空仅随 `models` 减项求交滑落。
  读面 = GET 行 `modelMeta`（恒在场——未存 ⇒ `{}`）；发现 = discover 响应 `modelMeta`（与 `models` 同集）。
  落点 = `providers.model_meta_json`（v7——`store/STORE.md` §2）；**圈界** = 纯展示数据：转发 ∥ 派发 ∥ `/v1/models` ∥ 校验单源（`thincoder-server/src/ops/config.mjs`）零涉；不建元数据同步/校验/仲裁机制（用户 12:11 裁）。
- **开放清单 = `models` 字段**（勾选区；**条目两形 = 字符串（无别名）∥ 对象 `{ name, alias }`（配别名）**——`alias` 缺省/空（`null` ∥ `""`）⇒ 归一无别名；数字/布尔/对象/数组 ⇒ 400（§5 AC-29 行）；语义全文 = §6 KD-SV-59）：`/v1/models` 逐项 = **对外标识**（别名 ∥ `provider/model`）；派发只命中开放清单（未开放 ⇒ 404——选择性中继口径保持）。
- **模型设置（`settings`——功能点 17 配置面；用户 21:39/21:40 裁 A/C/D/E；功能点 21 扩配配额）**：形 = `{ "<上游模型名>": { rpm ∥ tpm（正整数 ∥ null） ∥ costIn ∥ costOut（≥0 数 ∥ null） ∥ note（≤200 字 ∥ null） ∥ quotaTokens（≥0 整数 ∥ null——每人每月默认用量） } }`——`null`/缺省 = 未设。
  键 = 上游模型名（与 `models` 同空间；不在 `models` 的键合法——设置随名保留，停用不丢）；`quotaTokens` 消费 = 配额平台层默认（`metering/METERING.md` §2——KD-SV-38）。
  写面 = PATCH 键级合并（请求 `settings` 出现的键 = 整对象替换（值 `null` ⇒ 删键）；未出现键 = 不动——沿 PATCH「字段缺省 = 不动」口径）；**提交线形 = 键 = 上游模型名 ∥ 值 = 该模型完整对象**（全子字段在册；未设字段显式 `null`；清空 = 显式 `null`；草稿初值来源 = GET 行 `settings` 该键值）。
  控制台弹窗 = 单键提交——部分字段保存恒以全对象提交（同键其余字段不丢）；读面 = GET 行内 `settings` 全图；**存储 = `providers.settings_json`（v4——`store/STORE.md` §2/§3）**。
  校验单源 = `thincoder-server/src/ops/config.mjs`（`validateProviderEntry`/`validateProviderEntries` 扩 settings——未知子字段 ∥ 非法值 ⇒ 400，库与运行时零变）；**保存即热生效** = 既有四步链（候选注册表携带 settings ⇒ 换表 ⇒ 限流行取新值——KD-SV-35）；**配置种子零 settings 字段**（控制台单一面——`config.json` `providers[]` 段载入缺省 `{}`）。
- **预设快速添加（通道 = 预设列表端点）**：`GET /api/admin/providers/presets` ⇒ 表单预填（`name`/`baseURL`——用户补 `apiKey` 并经「模型发现」勾选）⇒ 保存走 **POST 全字段路径**；列表端点只读（写路径零新语义）——**预填不豁免校验**（单源 = `thincoder-server/src/ops/config.mjs` 导出；重名 ∥ 非法 ∥ `env:` 缺位照 400）；预设名不进写路径（写入体无 `preset` 字段——无未知预设错误面）；错误 = 401 ∥ 403（同族判权——零新码）。
- 装配接线：gateway 注册行装配期引导运行时（种子导入 → 构建）并返回；provider 管理面注册行接收**同一实例**（换表两族同见）。

### 2.3 系统面（探活 ∥ 版本可见——首版完备化①③）

| 方法 + 路径 | 鉴权 | 语义 |
|---|---|---|
| `GET /healthz` | 无（公开——探针入口；零鉴权只读） | 探活：`{ status, version, uptime, db }`——`status` = `"ok"` ∥ `"degraded"`；`version` = 运行树版本（同 `ready` 行——`ops/OPS.md` §5.4(g)）；`uptime` = 进程运行秒数；`db` = `"ok"` ∥ `"error"`（`SELECT 1` 一探）。正常 ⇒ 200；db 探活失败 ⇒ **503**（同形——`status:"degraded"` ∥ `db:"error"`）。`Cache-Control: no-store`；**不走统一错误信封**（探活响应自含状态）；仅注册 GET（HEAD ∥ POST ⇒ 404）。 |
| `GET /api/system` | 会话（两角色） | 版本与更新状态（控制台数据源——`webui/WEBUI.md` §2.1）：`{ version, update: { mode, lastCheckAt, latest }, embedding: { model } }`——`mode` = 生效档位（`false` ∥ `"notify"` ∥ `"auto"`——钉版抑制后；未就位 ⇒ `null`）；`lastCheckAt` = 最近自检时刻（unix ms ∥ `null` = 未检）；`latest` = 已见新版号 ∥ `null`（无新版 ∥ 未检——自检失败静默同面，`ops/OPS.md` §5.4(a)）；`embedding.model` = 嵌入引擎模型名（调用所需非机密——**地址不在本端点**，admin 面 = §2.4）；**缺 `embedding` 段 ⇒ `null`**（未配置态——控制台向量卡「未配置」；2026-10-09 embed 解耦批）。无 ∥ 过期会话 ⇒ 401 `unauthorized`（同族口径）。 |

- 优先级：两路径均注册路由（分派先于静态兜底——§1）；与 `/v1` ∥ `/api` 族互不重叠。
- 更新状态 = 更新器进程内状态（`thincoder-server/src/ops/update.mjs`——`getStatus()` 导出；入口惰性注入——路由注册先于更新器创建）；自检成功 ⇒ 更新状态（有新 ⇒ 置版号 ∥ 无新 ⇒ 清 `null`）；失败 ⇒ 保前值（静默口径同面）。
- `embedding` 字段 = 配置真值（装配注入——源 `config.embedding.model`；**缺配判据单源 = 运行时 accessor**（`providerRuntime.get().engineModel()`——派发面同判，构建点注入同源等价——2026-10-09 alias 批随正 · 台账 #1152））；**地址不下发**（`baseURL` 归 admin 面——§2.4；用户面只需模型名）；缺段 ⇒ `null`（未配置态——2026-10-09 embed 解耦批）。

### 2.4 控制台数据面（管理总览 ∥ 向量服务——功能点 15①③）

（端点族 = `/api/overview` ∥ `/api/admin/embedding*` ∥ `/api/admin/config` ∥ `/api/admin/proxy/test`；判权 = `requireAdmin` 口径——`user` ⇒ 403 ∥ 无/过期会话 ⇒ 401；错误形 = §3 全码沿用——无新码；写端点 JSON 型门同 §1 前言）

| 方法 + 路径 | 语义 |
|---|---|
| `GET /api/overview` | 管理总览读数（`webui/WEBUI.md` §2.3③）：`{ today: { requests, totalTokens }, members: { count } }`——`today` = 服务器本地自然日窗（界 = 当日 00:00；与用量报表**同源**——同一聚合函数）；`requests` = 行数（含 error/aborted）∥ `totalTokens` = `SUM(total_tokens)`（NULL 不计）。健康/更新两卡不走本端点（前端共享态——`webui/WEBUI.md` §2.3⑤） |
| `GET /api/admin/embedding` | 引擎配置真值：`{ baseURL, model }`（= `config.embedding`——逐值同源）；**`apiKey` 不出响应**（密钥面零下发）；**缺段 ⇒ `{ baseURL: null, model: null }`**（未配置态——2026-10-09 embed 解耦批） |
| `POST /api/admin/embedding/test` | 探活/试跑（单端点——**服务端代发**；引擎 key 代持——浏览器零涉）：body `{ text?, baseURL?, model?, apiKey? }`（缺省 = 内置短探针文本；**标量三项 = 明传优先（草稿口径——KD-SV-54 口径镜像）：在场 ⇒ 按明传值探活（未保存亦可先验）∥ 缺省 ⇒ 运行配置回落**（**掩码/引用回显形（`…`+末 4 ∥ `env:X`）不作明传值**——`apiKey` 探活三态 = 未编辑 ⇒ 不携（落「运行配置回落」） ∥ 编辑 ⇒ 明传 ∥ 清除勾 ⇒ `""`；提交口径 = §2.4 PATCH 行）；`env:` 引用按字面值探发——引用解析面 = 保存/载入）；成功 ⇒ 200 `{ ok: true, dimensions, ms }`（`dimensions` = `data[0].embedding.length` ∥ `ms` = 用时）；失败 ⇒ 200 `{ ok: false, error: { kind, message }, ms? }`——`kind` ∈ `timeout` ∥ `unreachable` ∥ `http_error` ∥ `bad_response`；**不走统一错误信封**（诊断自含状态——沿 `/healthz` 先例）；超时 10s（沿发现家族）；**不落库不计量**（不经 usage 记账路径 ∥ 不查配额）；**缺配且无草稿（三项皆缺省）⇒ 400 `invalid_request_error`**（消息明示嵌入未配置——携草稿（`baseURL` + `model`）⇒ 照常探活；未保存亦可先验；2026-10-09 embed 解耦批） |
| `GET /api/admin/config` | 配置文件面读（文件不热载——生效 = 重启；机制全文 = `ops/OPS.md` §1）：`{ config: { host, port, db, autoUpdate, trustProxy, usageRetentionDays, proxyUri, embedding: { baseURL, model, apiKey } ∥ null, bootstrap: { username } ∥ null } }`——值为**有效值**（文件在场值 ∥ 缺省回填）；密钥面 = `apiKey` 掩码（`env:` 保形 ∥ 明文 ⇒ `…`+末 4 ∥ 空 ⇒ `""`——规则 = §2.2）；`bootstrap.password` 面零列（永不回显）；读档失败 ⇒ 500 |
| `PATCH /api/admin/config` | 配置写（白名单五键——`autoUpdate` ∥ `trustProxy` ∥ `usageRetentionDays`（正整数 ∥ null） ∥ `proxyUri`（`http:` URL ∥ `""` = 清除该段） ∥ `embedding: { baseURL, model, apiKey }`（**子键级 = 缺省 = 不动 ∥ 明填 = 替换——`apiKey: ""` = 显式空**；**掩码/引用回显形（`…`+末 4 ∥ `env:X`）不作明传值**——`apiKey` 三态 = 未编辑 ⇒ 不携（= 不变） ∥ 编辑 ⇒ 明传 ∥ 清除勾 ⇒ `""`））：出现的键 = 应用（未出现 = 不动；未知键 ∥ 空提交 ⇒ 400）；合并原档**保未知键** ⇒ 门 = `resolveEnvRefs` + `validateConfig`（**载入面等价两跳**——写入的文件必可载入；不过 ⇒ 400 原报文 + 文件零变）⇒ **原子写**（同目录 tmp ⇒ `rename` 覆盖；失败 ⇒ 文件零变 + 500）⇒ 审计 `config_update`（detail = 变更键名清单——值永不入）；⇒ `{ ok: true }`；**缺 `embedding` 段 ⇒ 子键合并自动建段**（控制台从无到有创建——缺段档 PATCH 他键照常过门；部分子键 ⇒ 400；2026-10-09 embed 解耦批）∥ **`embedding: null` ⇒ 400**（清空段 = 不做——禁用 = 编辑配置文件）；生效 = 重启（统一标注——`ops/OPS.md` §1） |
| `POST /api/admin/proxy/test` | 上游代理连通测试（控制台系统页「服务配置」卡·连通测试块——**真打**；`webui/WEBUI.md` §2.7）：body `{ uri, target }`（**双必传**——trim 非空；`uri` 须 `http:` URL（口径沿 `validateProxyConfig`——`ops/OPS.md` §1 单源复用）；`target` 须 http(s) URL；缺 ∥ 非法 ⇒ 400 `invalid_request_error`）；服务端经 `proxyFetch(target, { method: "GET", signal }, uri)` 发真实 GET（同传输 ∥ 同 loopback 旁路判定）；成功（收到任一 HTTP 响应——**含非 2xx**）⇒ 200 `{ ok: true, status, ms }`；传输层失败 ⇒ 200 `{ ok: false, error: { kind, message }, ms }`——`kind` ∈ `timeout` ∥ `unreachable`（message 携底层诊断）；**不走统一错误信封**（诊断自含状态——沿 `/healthz`/向量探活先例）；超时 10s（`PROXY_TEST_TIMEOUT_MS`——注册参数可覆盖）；**不落库不计量**（不经 usage/配额/审计路径——失败仅 `log.warn`）；判权 = `requireAdmin`（user ⇒ 403 ∥ 无/过期会话 ⇒ 401） |

- **装配接线**：gateway 注册行一条（同 provider 管理面——`bin/thincoder-server.mjs` 一行注册）。

## 3. 错误形（全码单源）

- 统一形：`{ "error": { "message": "…", "type": "…", "code": "…" } }`。
- 本服务自产：401 `invalid_api_key`（无 key ∥ 未知 ∥ 吊销——不区分，防信息泄露）· 404 `model_not_found`（未配置模型 ∥ 该成员已禁用——消息区分）· 429 `quota_exceeded`（模型超额——message 含模型外标 + 已用/额度值；机制 = `metering/METERING.md` §2）· 429 `rate_limited`（per-model 限流——message 含模型/限值；`Retry-After` 秒头——沿 `too_many_attempts` 先例；机制 = §6 KD-SV-35）·
  400 `invalid_request_error`（body 非 JSON ∥ 缺 model）· 413 `payload_too_large`（请求体超上限——上限常量 32 MiB）· 502 `upstream_error`（上游不可达）。
- 500 `internal_error`（兜底——处理函数自身异常）。
- 账号面（`/api/*`——同形）：401 `unauthorized`（无 ∥ 过期会话）· 401 `invalid_credentials`（登录失败 ∥ 旧密错误——同措辞同耗时）· 403 `forbidden`（角色不足）· 404 `not_found`（成员 ∥ key 不存在）· 429 `too_many_attempts`（登录锁定期——`Retry-After` 头（秒）；两维同文案——`accounts/ACCOUNTS.md` §2）。
- **上游已到达的错误**（4xx/5xx）：状态码与 body **原样透传**（不包不改）；仍记 error 行（token 未知记 NULL）。
- **消息语言口径**：服务端消息 = 中文单语（机器面零改——CLI/curl 消费方口径不变）；控制台按 `code` 前端映射本地化（中文 ∥ English——机制 = `webui/WEBUI.md` §2.2）；上游透传错误照原样（控制台原文回显）。

## 4. 本域文件与行数预算（本域族行）

| 档 | 行数（实读——设计估） | 职责 |
|---|---|---|
| `thincoder-server/src/gateway/server.mjs`（已落盘） | **192 ⇒ ≈197**（实读 2026-10-06——设计估 ≈140；服务模型配置面批 +≈5 = `failRequest` 置 `Retry-After` 头）**⇒ 实读 192（2026-10-07——清账批复读）** | http 服务 ∥ 注册行分派 ∥ body 读限（32 MiB） ∥ 请求日志 |
| `thincoder-server/src/gateway/routes.mjs`（已落盘） | **86 ⇒ ≈100**（实读 2026-10-06——设计估 ≈240；#962 +5 = 读运行时（`runtime.get()`）；服务模型配置面批 +≈14 = 限流准入接线（check + 用量回收口串联））**⇒ 实读 101 ⇒ ≈115**（配额分模型批：配额准入位移（体读前 ⇒ 派发后/转发前） ∥ 两字段传账 ∥ 嵌入面检查移除）**⇒ 实读 104 ⇒ ≈112 ⇒ 实读 111（2026-10-07）**（配额 v2 批落地：禁用准入条 ∥ `/v1/models` 过滤）**⇒ ≈117**（2026-10-09 embed 解耦批：缺配 404 支 ∥ 注释 +≈6——实读待回填） | chat ∥ models ∥ embeddings 三处理 |
| `thincoder-server/src/gateway/forward.mjs`（已落盘） | **185 ⇒ ≈191**（实读 2026-10-06——设计估 ≈190；服务模型配置面批 +≈6 = `onUsage` 回调（用量到达即计入限流窗））**⇒ 实读 196 ⇒ ≈204**（本批：`provider`/`model` 两字段入账 +≈8）**⇒ 实读 201（2026-10-07——清账批复读）⇒ 实读 208**（2026-10-09 代理批：`proxyUri` 参 ∥ 出口换 `proxyFetch`——实读） | 上游 fetch ∥ 流式/非流式透传 ∥ tap 接线 ∥ 断连中止 ∥ 记账号 |
| `thincoder-server/src/gateway/proxy.mjs`（已落盘） | **实读 267**（2026-10-09——本批新增；自持 std 传输；零第三方） | 上游代理传输：`proxyFetch`（fetch-like——无 uri ⇒ 原生 fetch 直连 ∥ https ⇒ CONNECT 隧道 ∥ http ⇒ 经典转发；loopback 旁路；超时族；响应适配）；KD-SV-55 |
| `thincoder-server/src/gateway/sse-tap.mjs`（已落盘） | **90**（实读 2026-10-06——设计估 ≈80） | `data:` 行增量扫描 ∥ usage 提取 ∥ 有界缓冲 |
| `thincoder-server/src/gateway/providers.mjs`（已落盘） | **146 ⇒ ≈165**（实读 2026-10-06——设计估 ≈70；#962 +91 = 行→条目 ∥ 注册表构建（`env:` 解析） ∥ 运行时箱 ∥ 装配引导；服务模型配置面批 +≈19 = `settings` 解码 ∥ 注册表携设置 ∥ `settingsFor`）**⇒ 实读 167 ⇒ ≈175**（模型元数据批：`rowToEntry` 解码 `model_meta_json`）**⇒ 实读 177（2026-10-07——清账批复读）⇒ 实读 184**（2026-10-09 代理批：`proxy` 解码 ∥ 注册表 `proxyUri` 注入 ∥ 种子列——实读）**⇒ 实读 183**（2026-10-09 embed 解耦批：`modelList` 引擎行删——实读）**⇒ ≈208**（2026-10-09 alias 批：条目归一助手 ∥ 别名索引（正/反查）∥ 注册表 ref/派发/清单 +≈25——实读待回填） | provider 注册 ∥ 模型派发 ∥ 派发失败形 ∥ 运行时（§2.2） |
| `thincoder-server/src/gateway/provider-admin.mjs`（已落盘） | **197 ⇒ ≈225**（实读 2026-10-06——#962 设计估 ≈220；行 CRUD ∥ 掩码回显 ∥ 模型发现 ∥ 管理端点注册——§2.2；服务模型配置面批 +≈28 = GET 行 `settings` ∥ PATCH 键级合并 + 校验接线）**⇒ 实读 220 ⇒ ≈258 ⇒ 实读 284（2026-10-07）**（模型元数据批：`extractModelMeta` ∥ `filterModelMeta` ∥ discover 出图 ∥ GET 行 ∥ POST/PATCH 收 meta——§2.2）**⇒ 实读 305**（2026-10-09 代理批：discover `proxy` ∥ GET/POST/PATCH 面 ∥ 出口换——实读）**⇒ ≈322**（2026-10-09 alias 批：别名唯一性集（保存径） ∥ `filterModelMeta` 名字面 ∥ 保存线 +≈17——实读待回填） | provider 管理面（控制台——仅 admin） |
| `thincoder-server/src/gateway/ratelimit.mjs`（已落盘） | **≈90**（设计估）**⇒ 实读 64（2026-10-07——清账批复读）**（进程内 60s 定窗计数（`check` ∥ `record`） ∥ `Retry-After` 计算 ∥ 纯函数可直测；§6 KD-SV-35） | 模型限流（per-model RPM/TPM） |
| `thincoder-server/src/gateway/system.mjs`（已落盘） | **无 ⇒ 55 ⇒ ≈60**（实读 2026-10-06——设计估 ≈70；探活 handler ∥ `/api/system`（版本/更新状态；二轮 +≈5 = `embedding` 字段） ∥ 注册——§2.3）**⇒ 实读 57（2026-10-07——清账批复读）** | 系统面（healthz ∥ system） |
| `thincoder-server/src/gateway/embedding-admin.mjs`（已落盘） | **≈110**（设计估）**⇒ 实读 96（2026-10-07——清账批复读）⇒ 实读 110（2026-10-09——配置控制台批落地后：草稿三项明传优先）**（引擎配置读（真值 ∥ 零密钥） ∥ 探活/试跑单端点（代发 ∥ kind 四归类 ∥ 超时） ∥ 注册——§2.4）**⇒ ≈118**（2026-10-09 embed 解耦批：GET 缺段 null 容形 ∥ 探活缺配 400 +≈8——实读待回填） | 向量服务面（控制台——仅 admin） |
| `thincoder-server/src/gateway/config-admin.mjs`（已落盘） | **无 ⇒ ≈160**（设计估——配置面：GET 文件面读（有效值 ∥ 密钥掩码） ∥ PATCH 白名单合并/校验门/原子写/审计 ∥ 助手导出（合并 ∥ 原子写——批内件直测）；§2.4）**⇒ 实读 182**（2026-10-09 配置控制台批落地后——实读） | 配置面（控制台——仅 admin） |
| `thincoder-server/src/gateway/proxy-admin.mjs`（已落盘——2026-10-09 代理页批） | **无 ⇒ 实读 81**（2026-10-09 代理页批落地后——设计估 ≈95；代理测试面（§2.4）：判权 ∥ 入参轻校验（`validateProxyConfig` 单源复用） ∥ 代打（`proxyFetch` 注入） ∥ kind 二分类 ∥ 自含形；零落库不计量） | 代理连通测试面（控制台——仅 admin） |
| `thincoder-server/src/gateway/overview.mjs`（已落盘） | **≈70 ⇒ 实读 28 ⇒ ≈30**（本批：今日合计读源 = `report.mjs`（`usageTotals` 迁址）——口径零变）**⇒ 实读 27（2026-10-07——清账批复读）** | 管理总览读数（控制台——仅 admin） |
| `thincoder-server/src/gateway/errors.mjs`（已落盘） | **56 ⇒ ≈65**（实读 2026-10-06——设计估 ≈50；#963 +1 = `too_many_attempts` 码；服务模型配置面批 +≈9 = `rate_limited` 码 ∥ `HttpError`/`sendError` 可选 headers（`Retry-After`））**⇒ 实读 63（2026-10-07——清账批复读）** | 错误形构造 ∥ 发送助手（含账号面码） |
| **小计** | **≈770 ⇒ 658 ⇒ 951**（#962 实读：+293）**⇒ 1007**（#963 实读：+56 = system 新 55 ∥ errors +1——口径 = #962 后）**⇒ ≈1192**（二轮 +≈185 = embedding-admin 新 ≈110 ∥ overview 新 ≈70 ∥ system +≈5）**⇒ ≈1363**（服务模型配置面批估）**⇒ ≈1385**（配额分模型批：routes +≈14 ∥ forward +≈8；overview 实读回填）**⇒ ≈1393**（配额 v2 批：routes +≈8）**⇒ ≈1439**（模型元数据批：providers +≈8 ∥ provider-admin +≈38；以 v2 落定实读为基）**⇒ 实读 1362（2026-10-07——清账批逐档复读和）⇒ ≈1605（2026-10-09 代理批：proxy 新档 ∥ forward ∥ providers ∥ provider-admin 四档）⇒ 实读 1664**（2026-10-09——本批四档实读和：proxy 267 ∥ forward 208 ∥ providers 184 ∥ provider-admin 305）⇒ ≈1836（配置控制台批：+≈172 = `config-admin.mjs` 新 ≈160 ∥ `embedding-admin.mjs` ≈+12；余档零动）⇒ 实读增量 **+196**（2026-10-09 配置控制台批落地后：`config-admin.mjs` **182** 新 ∥ `embedding-admin.mjs` **110**）⇒ ≈1847（2026-10-09 embed 解耦批：+≈11 = routes +≈6 ∥ embedding-admin +≈8 ∥ providers −≈3）**⇒ 实读净收正 ≈1845**（embed 批三档实读：routes **114** ∥ providers **183** ∥ `embedding-admin` **117**）**⇒ ≈1889**（2026-10-09 alias 批：+≈44 = providers ≈208 ∥ provider-admin ≈322 ∥ forward ≈210——实读待回填）⇒ ≈1984（2026-10-09 代理页批：+≈95 = `proxy-admin.mjs` 新 ≈95；余档零动——在途批链值以实施实读为准）⇒ 实读增量 **+81**（2026-10-09 代理页批落地后：`proxy-admin.mjs` **81** 新——设计估 ≈95；余档零动） | —— |

## 5. 验收判据（机检面）

| 需求 AC | 设计级判据 | 载体 |
|---|---|---|
| AC-2（功能点 2） | SSE **逐块**：mock 上游两帧间隔——客户端先收帧 1 再等帧 2（证明非整段缓冲）∥ 帧字节逐值一致 ∥ `[DONE]` 透传；**收口轮四端任一实跑一轮**（真机） | 批内件 + 收口轮 |
| AC-6（功能点 6） | mock 引擎（断言流量命中引擎 `baseURL` 的 `/embeddings`）⇒ 响应体透传（维度/条数逐值不变）+ 记账 `endpoint='embeddings'`；**缺 `embedding` 段 ⇒ 服务照起**（载入通过 + 警告一条）**⇒ `/v1/embeddings` ⇒ 404 `model_not_found`（消息明示未配置——零新码）；引擎模型不入 `/v1/models`**（chat 清单零引擎行——派发面零动；2026-10-09 embed 解耦批——用例 = §7 N33/N34/B24/E25） | 批内件 |
| AC-11（功能点 11——控制台 provider/模型管理；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | admin 三态（`user` ⇒ 403 ∥ 无会话 ⇒ 401 ∥ admin 200）∥ **保存即热生效**（POST 后 `/v1/models` 立含 + mock 上游完成一次请求；PATCH 改 `baseURL` ⇒ 下一请求命中新地址；DELETE ⇒ 下一请求 404——零重启；在途流照常收尾）∥ 密钥面（列表掩码不含明文 ∥ 日志零明文 ∥ `env:` 引用原样回显）∥ 发现（mock `/models` ⇒ 清单去重；不可达 ∥ 超时 ∥ 非 JSON ⇒ 502 + 控制面提示/重试——**无手填兜底**（本批收正——用户 21:36 裁定；需求档回笔 = `design/PROJECT.md` §9 R28））∥ 校验单源（非法条目 ∥ 重名 ∥ `env:` 缺位 ⇒ 400 且库与运行时零变）∥ 预设列表（`GET /api/admin/providers/presets` ⇒ 21 家 ∥ 响应零 `apiKey` / 零 `model` 键（`models` = 空清单保留——2026-10-09 清除批）；预填 = 表单起手，写入仍走 POST 全字段 + 单源校验） | 批内件 |
| AC-13（功能点 12——首版完备化①③；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | ① `/healthz`：无鉴权 GET ⇒ 200 `{ status:"ok", version, uptime（数）, db:"ok" }`（`no-store`）∥ db 故障（注入口径）⇒ 503 `degraded` ∥ HEAD/POST ⇒ 404 ∥ 探针不触会话/团队 key 面；③ `/api/system`：无会话 ⇒ 401 ∥ 会话 ⇒ 200 `{ version, update:{ mode, lastCheckAt, latest }, embedding:{ model } }`（假 registry 自检后 `latest`/`mode` 随实况——`"notify"` 可见不自装） | 批内件 |
| AC-15①③（功能点 15——向量服务面 ∥ 管理总览；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | ① mock 引擎：探活/试跑 ⇒ `ok:true` + `dimensions` 逐值（两维向量 ⇒ 2） ∥ **不落库不计量**（usage 行数零增 ∥ 配额零涉） ∥ 不可达 ∥ 超时 ∥ HTTP 非 2xx ∥ 响应形不符 ⇒ `ok:false` + `kind` 四值分类 ∥ `GET /api/admin/embedding` = 配置真值且零 `apiKey` 字段 ∥ `/api/system` 含 `embedding.model`（两角色）且零地址字段；③ `/api/overview`：注入行集 ⇒ `today` 数值逐值 = 用量报表同日窗（同源断言）∥ 空集 ⇒ 0（零错）∥ admin 三态（user ⇒ 403 ∥ 无会话 ⇒ 401）；**缺段面**（2026-10-09 embed 解耦批）：`/api/system` 两角色 `embedding.model = null` ∥ `GET /api/admin/embedding` 两值 `null` ∥ 探活无草稿 ⇒ 400（消息明示）∥ 携草稿 ⇒ 照常 | 批内件 |
| AC-17（功能点 17——模型限流面 ∥ 停用径；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | 派发命中 + 超限 ⇒ 429 `rate_limited` + `Retry-After`（秒 ≥1——距窗尾）∥ 额内 ⇒ 放行 ∥ 窗滚 ⇒ 恢复 ∥ 计数口径（通过即计次 +1；token 于用量到达计入；失败/断开计次不计 token）∥ 保存即热生效（PATCH `settings` ⇒ 下一请求按新限——零重启）∥ 非法限值 ⇒ 400 库与运行时零变 ∥ 重启归零（软状态——在案）∥ 停用径 = PATCH `models` 减项 ⇒ `/v1/models` 随动 + 派发 404 ∥ 嵌入面零涉 | 批内件 |
| AC-21（功能点 21——网关配额检查面；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | 派发命中后/转发前：三级解析（覆盖 ⇒ 平台 ⇒ 不限）∥ 不限 ⇒ 零 SQL（计数探针）∥ 超限 ⇒ 429 `quota_exceeded` + message 含模型/已用/额度 ∥ 额内 ⇒ 放行 ∥ 他模型不受累 ∥ 嵌入零检查 ∥ 计数与记账同事务（明细可重算对账）∥ 保存即热生效（PATCH `settings` ⇒ 下一请求按新值；成员覆盖改行即改）∥ 旧 quota 端点已退役（404）（判据全文 = `metering/METERING.md` §4 AC-21 行） | 批内件 |
| AC-23（功能点 23③——成员模型禁用执行面；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | 被禁模型（成员×模型）⇒ 404 `model_not_found`（消息明示「已对该成员禁用」）且**零用量行**（准入前拒打）∥ 未禁 ⇒ 200 ∥ 禁用先于配额（被禁 ∧ 超额 ⇒ 404 非 429）∥ 他成员不受累 ∥ 即时生效（写后下一请求——无缓存）∥ `/v1/models` 随动滤除（禁后不含 ∥ 恢复后含）∥ 嵌入面零涉 ∥ 零新错误码 | 批内件 |
| AC-24（功能点 24——上游模型元数据留存与展示；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | ① discover 响应 `modelMeta`（保留集逐形：deepseek（`context_window`+`input_modalities`+`name`）∥ kimi 族（`context_length`+`supports_image_in`+`display_name`）∥ vLLM（`max_model_len`）三形直测；经典四件 ⇒ `{}`）∥ ② 保存求交（携 `modelMeta` ⇒ GET 行逐值、非开放模型不入库；仅 `models` ⇒ 现存图按求交滑动）∥ ③ 形不符 ⇒ 逐项略（零兜底）；`modelMeta` 非对象 ⇒ 400 库与运行时零变 ∥ ④ `/v1/models` ∥ 派发 ∥ 校验单源零涉（全回归） | 批内件 |
| 上游代理（台账 #1129——KD-SV-55） | 判定与同判定（chat ∥ discover 两链）：假代理（进程内 CONNECT 替身）命中 + 经代理完成请求 ∥ 无旗 ∥ 无 uri ∥ loopback ⇒ 直连（假代理零命中）∥ SSE 逐块经代理透传（非整段缓冲——mock 两帧间隔）∥ 代理不可达 ⇒ 502 `upstream_error` ∥ 代理路径断连 ⇒ 中止上游 + 记 `status='aborted'`（§2.1 契约零回归）∥ 启动 warn 两条（明文 `http:` ∥ 旗 `true` 缺 uri——触发/文案 = §6 KD-SV-55）∥ `proxy` 字段往返（POST/PATCH/GET ∥ 非布尔 400 库与运行时零变）∥ 热生效（PATCH 旗 ⇒ 下一请求随动；在途照旧） | 批内件 |
| AC-29（功能点 29——服务模型别名；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | ① 配置形：`models` 条目两形（字符串 = 无别名 ∥ 对象 `{name, alias}` = 配别名）；`alias` 缺省/空（`null` ∥ `""`）⇒ 无别名（归一）；非对象非字符串条目 ∥ `name` 缺/空 ∥ `alias` 数字/布尔/对象/数组 ∥ 含 `/` ∥ 首尾空白 ⇒ 400（保存——库与运行时零变）∥ 拒启（种子/载入）∥ ② 对外别名生效（`/v1/models` `id` = 别名 ∥ 请求 `model=别名` ⇒ 命中且转发上游真名（mock 上游 `body.model` 逐值）∥ 旧 `provider/model` 名 ⇒ 404 `model_not_found` 消息含别名；清别名 ⇒ 外标回落 `provider/model`——当即生效）∥ ③ 唯一性（别名撞别名——跨 provider ∥ 含新增项：载入 ⇒ 拒启 ∥ 保存 ⇒ 400 库与运行时零变；别名撞带前缀名——形上不相交（别名无斜杠 ∥ 前缀名恒含斜杠），唯一可能撞法 = 别名含 `/` ⇒ 形校验拒）；用例 = §7 N35/B25/E26 | 批内件 + 收口轮 |
| AC-30（功能点 30②——代理连通测试面；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | 真打（mock 假代理 + mock 目标 ⇒ `ok:true` + `status`/`ms` 逐值 ∥ 假代理命中即证经代理）∥ 代理不可达（死端口）⇒ `ok:false` + `kind=unreachable` ∥ 超时（注入 `timeoutMs`）⇒ `kind=timeout` ∥ loopback 目标 ⇒ 直连（假代理零命中——旁路与生产同判）∥ 非 2xx 照实回读（`ok:true` + 状态值）∥ 入参（缺/空 `uri` ∥ `uri` 非 `http:` ∥ 缺/非法 `target` ⇒ 400 `invalid_request_error`——文件与运行态零变）∥ 判权三态（user ⇒ 403 ∥ 无会话 ⇒ 401 ∥ admin 200）∥ **零落库零计费**（usage 行零增 ∥ 配额零涉 ∥ 审计零行）∥ 自含形（结果 200 体——不走统一错误信封） | 批内件 |
| AC-28（功能点 28——配置控制台写面；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | GET = 文件面值（有效值回填 ∥ 密钥掩码零泄漏 ∥ `bootstrap.password` 面零列）∥ PATCH：白名单（未知键 ⇒ 400）∥ 合并保未知键 ∥ 校验门（非法值 ∥ `env:` 缺位 ⇒ 400 且文件字节零变）∥ 原子写（tmp 零残留 ∥ rename 覆盖）∥ 审计 `config_update`（detail = 键名 ∥ 值零入）∥ 并发（同步段单写者）∥ 写后 GET 回读逐值（round-trip）∥ 草稿探活（test 端点明传优先——缺省回落）∥ **缺段创建**（缺 `embedding` 段 ⇒ PATCH 建段 ⇒ 门通过 ∥ 缺段档 PATCH 他键过门；2026-10-09 embed 解耦批） | 批内件 |

## 6. 关键决策（本域）

| # | 决策 | 理由 | 被否候选与何故否 |
|---|---|---|---|
| KD-SV-4 | **模型派发 = 对外标识精确匹配（配了别名 ⇒ 别名 ∥ 未配 ⇒ `provider/model` 复合键；按 provider 各持 `models` 列表）**——非策略路由 | 多 provider 支持的正确性最小面；**配了只认别名**（一名一形——旧前缀名 404 明示）；**同名模型跨 provider 并存且各自可达**；未命中（含非别名裸名）⇒ 404 `model_not_found`；**同 provider 内重名 ⇒ 拒启**；`/v1/models` = 对外标识清单（别名入面后随正——KD-SV-59） | 前缀通配路由（引入规则语言——越「不做」线）· 单上游写死（不满足「各 provider 的端点」）· 按请求头/参数选 provider（新增客户端契约——四端须改，违「baseURL 指入即用」）· **裸名兜底解析 ⇒ 否（无隐式解析）** |
| KD-SV-5 | **流式计量 = 请求注入 `stream_options.include_usage: true`** + 旁路 tap | OpenAI 兼容端点的流式 usage 只有被请求时才回传；不注入 ⇒ 流式请求全部无 token（AC-3 失效）。规则：`stream === true` 且 `stream_options.include_usage !== true` ⇒ 置 true（显式 false 亦覆盖——计量完整性优先；该字段只附加用量帧）；非流式不动。消费方容忍实证 = 四端核 `readSSE` 对 usage 帧（`choices: []`）直取后跳（`thincoder-core/provider/sse.mjs`） | 不注入 + 流式无计量（AC-3 不达）· 整段缓冲后再解析（违逐块透传）· 请求侧加 `stream:false` 改写（改变客户端语义） |
| KD-SV-10 | **SSE tap = 有界只读扫描**（行缓冲 ∥ 单行上限 1 MiB ∥ BOM 剥除 ∥ CRLF 容错） | 中继字节面原样 `pipe`（零改）；tap 只旁路解析 `data:` 行 JSON 取 `usage`；单行上限防病态膨胀（超限弃该行扫描——中继不受影响） | 全量缓冲解析（违逐块）· 正则抠 `usage`（脆弱——JSON 解析稳）· 无上限缓冲（恶意流可撑内存） |
| KD-SV-30 | **向量服务面 = 配置真值经 admin 端点 + 服务端代探/代试**：`GET /api/admin/embedding`（地址/模型——零密钥）∥ `POST /api/admin/embedding/test`（服务端 `/embeddings` 最小调用——探活与试跑单端点；成败自含形（沿 `/healthz` 先例）；不落库不计量）；`/api/system` 仅下发 `embedding.model`（两角色）——地址不下发用户面 | 引擎地址 = infra 面（admin 全量 ∥ 用户面 = 模型名 + snippet）；浏览器不持引擎 key（代发必需——密钥面零涉）；诊断自含形 = UI 直接渲染失败分类（四 kind——不吞细节）；探活 = 真实调用（`/models` 不保证存在——Ollama/TEI 各异） | 浏览器直连引擎（key 落浏览器——否）· `GET /models` 探活（引擎面不保证——形不符）· 探活并入 `/healthz`（热路径重探 ∥ 语义膨胀）· 探活走 `/v1/embeddings` 记账路径（诊断耗度——不落库不计量在案） |
| KD-SV-35 | **C = per-model 限流（RPM/TPM）**：检查点 = 派发命中后/转发前；窗口 = 进程内存 60s 定窗（通过即计次 +1；token 于用量到达计入）；超限 ⇒ 429 `rate_limited` + `Retry-After`（秒）；限值源 = `settings`（空 = 不限）；热生效 = 换表链（零独立机制）；重启归零（软状态）；计数口径 = 失败/断开计次不计 token | 需求 §2:17 C；单进程（KD-SV-1）下内存计数最简且精确；TPM 用实际用量（token 预估 = 不做项——§8）；429 形沿 `too_many_attempts` 先例（`Retry-After` 秒头）；限值面复用 settings（零新端点/零新存储面——KD-SV-34） | 滑动窗（复杂度无收益——内部工具）· 持久窗/跨重启（软状态即可——重启归零在案）· 并发/连接数限（C 口径 = RPM/TPM）· 跨进程限流（多实例 = 触发项）· 预估式 TPM 准入（违「token 预估」不做项）· 复用 `quota_exceeded` 码（语义不同——月度额度 ≠ 速率） |
| KD-SV-55 | **上游代理 = 逐渠 `proxy` 旗 + 顶层 `proxy.uri`（无全局闸）；实现 = 自持 std 传输（零第三方）**：判定 = 条目标旗 ∧ uri 在案 ⇒ chat 转发 ∥ 模型发现同经代理（loopback 旁路 ∥ 无旗/无 uri ⇒ 直连）；实现 = `thincoder-server/src/gateway/proxy.mjs`（node:http/https 内建 + 自建 CONNECT——std；每请求独立连接；TLS 默认全量校验；超时族 = CONNECT 15s ∥ 头阶段 600s（所沿先例 = 客户端 provider 面 `fetchTimeoutMs` 600s——`docs/core/design/PROVIDER.md:114`；传输面 `opts._headerTimeoutMs` 默认 60s 非所沿）∥ body 空闲 120s；断连中止 = 客户端断连（`opts.signal`）⇒ `proxyFetch` 拆除代理 socket（CONNECT 隧道 ∥ 经典转发两径同）⇒ 上游中止 + 记 `status='aborted'`——§2.1 契约零回归）；配置面 = `ops/OPS.md` §1（顶层段——uri 射程 = `http:` 仅：非对象 ∥ 非法 uri ∥ scheme 非 `http:` ⇒ 拒启）+ provider 条目字段（v9 列 ∥ 管理面 ∥ 种子）；启动 warn 两条（载入期触发——文案 = 中文单行）：① 明文 `http:` uri ⇒「proxy.uri 为明文 http——上游密钥经代理外发（确认代理可信）」；② 任一条目旗 `true` 而 `uri` 缺位 ⇒ 直连 +「条目 proxy: true 而顶层 uri 缺位——该渠直连（旗未生效）」；生效 = 旗随保存热生效 ∥ 顶层 uri 随重启 | 用户 2026-10-09 13:5x 令（「server端也有需要proxy支持，并且provider可以分别指定走不走proxy」——台账 #1129）；语义 = 客户端逐渠旗镜像（D-PX1——API key 经代理可见 ⇒ 默认不得外送）；零第三方红线（沿客户端 std 先例）——不自写 HTTP/1.1 解析（node:http 内建解析健壮：chunked ∥ 边界 ∥ 流式） | 全局闸 ∥ 双门槛（沿客户端否决面）· 第三方代理库（违红线）· 手写解析完整镜像（≈330 行复制——内建面已足；回退在册：组合不可行时退自写解析——同零第三方） |
| KD-SV-58 | **引擎模型退出通用清单（单独命名空间——2026-10-09 embed 解耦批；台账 #1148——用户 17:24）**：`/v1/models` = chat 前缀名清单（零引擎行——`modelList` 删引擎条目）；控制台服务模型页同源派生随之（`deriveModels(providers)` 零引擎行——嵌入行死支删净）；派发面零动（嵌入判据 = 引擎模型单独命名空间——既有）；`/api/system.embedding.model` 仍下发模型名（用户面提示条——非「模型列表」面） | 用户 17:24「嵌入式模型也不应该跟其他provider提供的服务混在一起，模型列表里不要包含嵌入模型」；清单 = 对外服务面（引擎模型不能 chat——派发面本就 404，列 = 死条目）；控制台与 `/v1/models` 同源（单源不改） | 清单保留引擎行 + `owned_by` 标记（用户裁「不要混在一起」——语义仍混）· 嵌入面整体退役（用户裁 = 只剔列表——转发/记账/试跑零涉）· 新端点 `/v1/embeddings/models`（引擎模型单值面已在配置/系统面——零需求） |
| KD-SV-59 | **服务模型别名 = 对外标识可配（2026-10-09 alias 批；台账 #1153——用户 20:32/20:36 令）**：① 配置形 = `models` 条目两形（字符串 = 无别名 ∥ 对象 `{name, alias}`——`alias` 缺省/空（`null` ∥ `""`）⇒ 归一无别名）；别名非空、不含斜杠、无首尾空白（形不符 ⇒ 拒）；② 对外 = 配了只认别名（`/v1/models` `id` ∥ 请求 `model=` 名；旧前缀名 ⇒ 404 消息含别名）；③ 唯一性 = 别名全服唯一（别名 vs 别名——校验层三径：单条内 ∥ 全量批量 ∥ 保存径对既有集；撞 ⇒ 拒启/400）；别名 vs 带前缀名 = 形上不相交（别名无斜杠 ∥ 前缀名恒含斜杠——唯一可能撞法 = 别名含 `/` ⇒ 形校验拒）；④ 内部真名不动（转发 ∥ 存储两字段 ∥ 计数键）；成员面随动 = 配额/禁用键与记账对外标识统一别名形（读面回映射——`metering/METERING.md` §2.3）；⑤ 编辑面 = 控制台服务模型页详情弹窗「别名」字段（`webui/WEBUI.md` §2.4③）；嵌入面零涉；不做别名历史/迁移（改别名 = 当即生效） | 用户 20:32「服务模型需要加一个别名字段，如果配置了，对外模型名称用别名」+ 20:36「别名当然需要唯一，不允许重名……嵌入面不相干」；对象条目 = 库内 JSON 列零迁移（`store/STORE.md` §2 v2 段——旧字符串行天然兼容）；只认别名 = 消「一名两形」歧义；唯一性 = 派发表正确性前提；真名不动 = 转发/记账/对账零涉（回映射 = 读面一处） | 别名与真名并存解析（一名两形——歧义；用户裁 ②）· 别名族带斜杠（与前缀名相撞面）· 新表/新列存别名（单列 JSON 已足——迁移零增）· 别名历史/迁移（用户边界句）· 别名级独立配额/限流配置（键随对外标识自然随动）· 嵌入模型别名（用户裁「嵌入面不相干」） |

## 7. 用例（本域）

| # | 类 | 输入 | 预期输出 |
|---|---|---|---|
| N1 | 正常 | 有效 key + 流式 chat（mock 上游回两帧文本 + 末帧 usage） | 200 SSE 透传；usage 行落库（token = 上游值） |
| N2 | 正常 | 有效 key + 非流式 chat（mock 回 `usage`） | 200 JSON 透传；记账同 N1 |
| N3 | 正常 | 有效 key + embeddings（mock 引擎回 2 条向量） | 200 透传（维度/条数不变）；记账 `endpoint='embeddings'` |
| N4 | 正常 | 有效 key + `GET /v1/models` | 200 列表 = 配置的全部 chat 模型（`provider/model` 前缀形）——**零引擎行**（2026-10-09 embed 解耦批） |
| B1 | 边界 | 客户端已带 `stream_options.include_usage: true` | 不重复注入 ∥ 不改写其它字段；透传照常 |
| B3 | 边界 | 客户端中途断开 | 中止上游请求；记 `status='aborted'`（token 通常 NULL） |
| B5 | 边界 | 流首 BOM ∥ CRLF 行尾 | tap 容错（剥 BOM ∥ trim）——usage 照常提取；透传字节不变 |
| B6 | 边界 | 单行 > 1 MiB（病态流） | tap 弃该行扫描（中继不受影响）；usage 记 NULL |
| E3 | 错误 | 请求 model 不在配置清单 | 404 `model_not_found` |
| E4 | 错误 | body 非 JSON ∥ 缺 `model` | 400 `invalid_request_error` |
| E5 | 错误 | 上游 4xx/5xx | 状态与 body**原样透传**；记 error 行 |
| E6 | 错误 | 上游不可达（连不上/超时） | 502 `upstream_error`；记 error 行 |
| E7 | 错误 | 请求体 > 32 MiB | 413 `payload_too_large`（不转发） |
| N16 | 正常 | admin 会话：`POST /api/admin/providers`（mock 上游）⇒ 立即 `GET /v1/models` 立含新模型 ∥ 经新 provider 完成一次请求 | 零重启生效；记账 ok |
| N17 | 正常 | admin 会话：`POST /api/admin/providers/discover`（mock 上游 `/models` 回 3 个 id） | `{ models:[…], modelMeta:{} }`（去重；经典四件上游 ⇒ `modelMeta` = `{}`——与 §2.2/N27 同形）；勾选集保存后清单/派发按开放清单 |
| N18 | 正常 | admin 会话：`PATCH` 改 `baseURL` 指第二 mock ∥ `DELETE` 一 provider | 下一请求命中新上游 ∥ 被删者下一请求 404（用量行零触） |
| B14 | 边界 | 在途流式请求进行中删除其 provider | 流照常收尾（`ok` 记账）；后续请求 404 |
| B15 | 边界 | 种子四格：空库+段 ⇒ 导入（`env:` 保形）∥ 非空库+段 ⇒ 忽略 + 警告 ∥ 两空 ⇒ 允许起 + 警告 | `/v1/models` 随格：含种子 ∥ 不变 ∥ 空清单（chat 404） |
| E14 | 错误 | `user` ∥ 无会话 ∥ 非法条目 ∥ 重名 ∥ `env:` 缺位 ∥ 不存在 id | 403 ∥ 401 ∥ 400（库与运行时零变）∥ 404 |
| E15 | 错误 | 发现：不可达 ∥ 超时 ∥ 非 JSON | 502 `upstream_error`（可读消息——控制面提示 + 重试；无手填兜底） |
| N19 | 正常 | 无鉴权 `GET /healthz`（正常态） | 200；`{ status:"ok", version, uptime, db:"ok" }`；`no-store` |
| N20 | 正常 | 会话 `GET /api/system`（假 registry 自检报新版后） | 200；`update.latest` = 假版号 ∥ `mode` = 生效档位 |
| B16 | 边界 | `GET /healthz`（db 探活失败——注入口径） | 503；`status:"degraded"` ∥ `db:"error"` |
| E16 | 错误 | `POST /healthz` ∥ `HEAD /healthz` | 404（未注册形——探针面单一） |
| E17 | 错误 | 无会话 `GET /api/system` | 401 `unauthorized` |
| N21 | 正常 | admin + `POST /api/admin/embedding/test`（mock 引擎回两维向量） | 200 `{ ok:true, dimensions:2, ms≥0 }`；usage 行零增；`GET /api/admin/embedding` 回配置真值（零 `apiKey`） |
| N22 | 正常 | admin + `GET /api/overview`（注入今日两行） | `{ today:{ requests:2, totalTokens:和 }, members:{ count } }`——与 `/api/usage/summary` 同日窗同源 |
| B17 | 边界 | 引擎不可达 ∥ 超时 ∥ 非 2xx ∥ 响应无 `data[0].embedding` | `ok:false` + `kind` 四值（`unreachable`/`timeout`/`http_error`/`bad_response`）；服务照常 |
| E18 | 错误 | user ∥ 无会话 ⇒ 三端点（overview ∥ embedding 两） | 403 `forbidden` ∥ 401 `unauthorized` |
| N23 | 正常 | admin：PATCH `models` 减项（停用径）⇒ 立即 `GET /v1/models` 不含该模型 ∥ 派发 ⇒ 404 | 零重启随动；退役径同（服务端口径不涉发现） |
| N24 | 正常 | admin：PATCH `settings`（rpm=1）⇒ 第 1 请求通过 ∥ 第 2 请求 ⇒ 429 `rate_limited` + `Retry-After`（秒 ≥1）∥ 注时钟滚窗 ⇒ 放行 | 热生效（零重启）；定窗计数 |
| N25 | 正常 | admin：PATCH `settings`（tpm）⇒ 用量到达后计入 ∥ 累计超 TPM ⇒ 429 | token 于用量到达计入口径 |
| B18 | 边界 | 失败/断开请求（上游不可达 ∥ 中途断开）；rpm 计数含之；token 不计 ∥ 进程重启 ⇒ 计数归零 | 计次口径；软状态（重启归零在案） |
| E19 | 错误 | `settings` 非法（rpm=0 ∥ costIn=−1 ∥ note 超长 ∥ 未知子字段）⇒ 400 库与运行时零变 ∥ 裸名/未命中 ⇒ 404（派发先于限流） | 校验单源；错误序 |
| N26 | 正常 | 有效 key（成员已禁 `mock/mock-chat`）⇒ 派发该模型 ∥ 派发他模型 ∥ `GET /v1/models` | 404 `model_not_found`（消息含「禁用」）+ 零用量行；他模型 200；清单不含该模型（恢复后回列） |
| B19 | 边界 | 被禁 ∧ 配额已超（同日）⇒ 派发该模型 ∥ 配额已超但未禁 ⇒ 派发 | 404（禁用优先——非 429）；429 `quota_exceeded`（未禁面不变） |
| N27 | 正常 | admin：discover（mock 上游 `/models` 回富字段——`context_window` 1048576 ∥ `input_modalities: ["text","image"]` ∥ `name`） | 200 `{ models, modelMeta }`——`modelMeta[id]` 逐字段 = `{ displayName, contextWindow: 1048576, vision: true }`；经典四件上游 ⇒ `modelMeta: {}` |
| N28 | 正常 | admin：PATCH `models` + `modelMeta`（期望图）⇒ GET 行；再 PATCH 仅 `models` 减项 | 首次 ⇒ 行 `modelMeta` 逐值（非开放模型不入库）；二次 ⇒ 现存图按求交滑动（未减项零动） |
| B20 | 边界 | discover：`context_window: "1M"` ∥ `status: "online"`（未命中词表）∥ `display_name` 超长 ∥ `vision` 非布尔 | 逐项略（该字段不出；`modelMeta` 零占位、零兜底） |
| E20 | 错误 | PATCH `modelMeta` 非对象（数组 ∥ 字符串） | 400 `invalid_request_error`；库与运行时零变 |
| N29 | 正常 | admin：POST provider（`proxy: true`）+ 顶层 `proxy.uri` 在案 + 假代理 + mock 上游 ⇒ chat ∥ discover | 两链均经代理（假代理命中 CONNECT + 请求）；`GET /api/admin/providers` 行 `proxy: true` |
| N30 | 正常 | admin：PATCH `proxy`（false ⇒ true）再发 chat | 下一请求经代理（热生效——零重启）；在途流照旧 |
| B21 | 边界 | baseURL = loopback（`http://127.0.0.1:*` mock）+ 旗 ∥ uri 在案 | 直连（假代理零命中——NO_PROXY 语义） |
| B22 | 边界 | 旗 `true` + 顶层 `proxy` 段缺位 | 直连（零代理——镜像语义；启动 warn 一条在案） |
| E21 | 错误 | 条目 `proxy` 非布尔（`"yes"` ∥ 数组 ∥ 数字）∥ 顶层 `proxy` 非对象（数组 ∥ 数字）∥ 顶层 `proxy.uri` 非法（非字符串 ∥ 空串 ∥ 非 URL ∥ 裸串形 ∥ scheme 非 `http:`——仅 `http:` 收） | 400（保存径——库与运行时零变）∥ 拒启（配置径——fail-closed） |
| E22 | 错误 | 假代理不可达 ∥ CONNECT 拒（非 200） | 502 `upstream_error`（chat ∥ discover 同）；服务照常 |
| N31 | 正常 | admin：`GET /api/admin/config`（文件在场）⇒ `PATCH`（autoUpdate ∥ proxyUri）⇒ 再 `GET` | GET 逐值 = 文件（密钥掩码）∥ PATCH ⇒ `{ ok: true }` ∥ 回读逐值 = 新值 ∥ 未托管键原样保形（保未知键） ∥ 落盘形 = 2 空格缩进 + 末尾换行 ∥ 审计一行（detail = 键名 × 值零入） |
| B23 | 边界 | 文件缺 `autoUpdate`/`usageRetentionDays`（GET）；`usageRetentionDays: null`；`proxyUri: ""` | GET ⇒ 有效值回填（`notify` ∥ 90）∥ null ⇒ 不限（原样）∥ `""` ⇒ `proxy` 段删净（再 GET ⇒ `proxyUri: null`） |
| E23 | 错误 | PATCH：未知键（顶层 ∥ `embedding` 子键）∥ 非法值（`autoUpdate:"yes"` ∥ `usageRetentionDays:0` ∥ `proxyUri:"https://x"` ∥ `embedding.baseURL` 非法） | 400（原报文；文件字节零变；运行态零变） |
| E24 | 错误 | PATCH `embedding.apiKey: "env:NO_SUCH_VAR"`；写盘失败（fs 注入口径） | 400（环境变量缺位——文件零变）∥ 写入失败 ⇒ 500（文件零变 ∥ tmp 零残留） |
| N33 | 正常 | 有效 key：引擎模型在场（`embedding` 段在案）⇒ `GET /v1/models` ∥ `POST /v1/embeddings`（引擎模型名） | 清单 = 仅 chat 前缀名（零引擎行）；嵌入派发照常 200 透传 + 记账（两命名空间互不涉） |
| N34 | 正常 | 配置缺 `embedding` 段（∥ 显式 `null`）⇒ 起服 ∥ 有效 key `POST /v1/embeddings` ∥ 会话 `GET /api/system` ∥ admin `GET /api/admin/config` ⇒ PATCH `{ embedding: { baseURL, model } }` | 服务照常起（`/healthz` 200）；`/v1/embeddings` ⇒ 404 `model_not_found`（消息明示嵌入未配置）；`embedding.model = null`；GET ⇒ `embedding: null` ⇒ PATCH ⇒ 200 ⇒ 回读逐值（从无到有创建——重启生效） |
| B24 | 边界 | 缺配 + admin `POST /api/admin/embedding/test`（无草稿）∥ 同端点携草稿（`baseURL` + `model`——未保存） | 无草稿 ⇒ 400 `invalid_request_error`（消息明示未配置）；携草稿 ⇒ 照常探活（mock 引擎 ⇒ `ok:true` + `dimensions`） |
| E25 | 错误 | PATCH：`embedding: { baseURL }` 缺 `model` ∥ 缺段档 PATCH `trustProxy` ∥ `embedding` 非对象（字符串 ∥ 数组）∥ `embedding: null`（显式清空） | 缺子键 ⇒ 400（文件零变）∥ 缺段档他键 ⇒ 200（门容缺段）∥ 非对象 ⇒ 400 ∥ `null` ⇒ 400（清空段 = 不做——禁用 = 编辑配置文件） |
| N35 | 正常 | admin：PATCH `models` 携对象条目（`{ name:"mock-chat", alias:"fast" }`）⇒ `GET /v1/models` ∥ 有效 key 请求 `model:"fast"` | 清单 `id` = `fast`；请求 200——mock 上游收到 `body.model` = `mock-chat`（上游真名）；GET 行 `models` 保形（对象条目在场） |
| B25 | 边界 | 别名清空（PATCH ⇒ 字符串条目）∥ 未配别名（现形） | 外标当即回落 `provider/model`（清单与派发同拍——零缓存）；未配 = 现形零改 |
| E26 | 错误 | 旧 `provider/model` 名（该模型已配别名）∥ 别名撞别名（POST/PATCH——跨 provider）∥ 种子别名撞 ⇒ 载入 ∥ 别名含 `/` ∥ 条目 `{ name:"" }` ∥ 非对象非字符串条目 | 404 `model_not_found`（消息含别名——明示）∥ 400（库与运行时零变）∥ 拒启（fail-closed）∥ 400/拒启（形校验） |
| N36 | 正常 | admin：`POST /api/admin/proxy/test`（假代理在案 + 目标 mock 回 200） | 200 `{ ok:true, status:200, ms≥0 }`；假代理命中（真打）；usage 行零增 ∥ 审计零行 |
| B26 | 边界 | 目标 = loopback（本机 mock）∥ 非 2xx（404）∥ 代理死端口 ∥ `timeoutMs` 注入口径缩短 | 直连（假代理零命中——NO_PROXY 语义）∥ `ok:true` + `status:404`（照实回读）∥ `ok:false` + `kind=unreachable` ∥ `ok:false` + `kind=timeout` |
| E27 | 错误 | 缺 `uri` ∥ `uri` 空串 ∥ `uri` 非 `http:`（如 `https://…`）∥ 缺 `target` ∥ `target` 非法 URL ∥ user ∥ 无会话 | 400 `invalid_request_error`（消息明示）∥ 400 ∥ 400 ∥ 400 ∥ 400 ∥ 403 `forbidden` ∥ 401 `unauthorized` |

## 8. 本域边界（不做的面）

- 非 OpenAI 协议翻译 ∥ 策略路由（别名 = 标识面已入——KD-SV-59；通配/规则路由仍不做） ∥ 上游重试（失败原样返回——重试语义留给客户端）∥ 并发/连接数限流（C = per-model RPM/TPM 速率限——KD-SV-35；配额 = 额度式双轨在案）∥ 跨进程/多实例限流（计数 = 单进程内存——多实例 = 触发项 `EVOLUTION.md` §2）∥ 限流窗口持久化（重启归零——软状态在案）∥ token 预估（TPM 计数 = 实际用量）∥ 请求体/响应的内容加工（压缩、改写、脱敏——纯透传）∥ CORS（消费方均为服务端工具）。
- 嵌入引擎管理面（引擎起停手动——需求 §4）；多实例/横向扩展 = 触发项（`EVOLUTION.md` §2）。嵌入配置缺位 = 禁用态（404 `model_not_found` 消息明示——零新码；2026-10-09 embed 解耦批）；引擎模型不入通用清单（单独命名空间——KD-SV-58）；控制台删除/清空 `embedding` 段 = 不做（编辑配置文件；界面仅创建/改值）。
- provider 管理面不做：本机 CLI 面（控制台 = 单一面——需求点名）∥ URL 白名单/出口限制（admin 权限自担——内网工具面）∥ 变更历史/回滚（行即现值——无版本化）∥ 渠道/灰度/多版本并存（沿更新面不做项——`ops/OPS.md` §10）。
- 模型元数据面不做：元数据同步/校验/仲裁机制（用户 12:11 裁）∥ 上游状态自动停用/自动勾选 ∥ 保留集外字段（推理档位/视频/输出上限等——无用途不堆砌）∥ 对外 `/v1/models` 元数据带出（须论证 + 点名方可议） ∥ 元数据参与转发/计费（纯展示）。
- 健康/系统面不做：metrics/Prometheus ∥ 深度依赖探活（仅 db 一探） ∥ `unhealthy` 自动处置（外部工具面） ∥ `/api/system` 写面（只读）。
- 控制台数据面不做：引擎试跑历史/存档（一次性读数） ∥ 总览图表（总览 = 数值卡——趋势归用量页） ∥ 引擎地址下发非 admin 面（用户面 = 模型名 + snippet——`webui/WEBUI.md` §2.3①）。
- 代理测试面不做（KD-SV-60——`webui/WEBUI.md` §7）：测试历史/存档 ∥ 测试经记账/配额/审计路径（零落库零计费） ∥ 代理池/多代理 ∥ 代理认证（沿本档 §8 上游代理面） ∥ 目标协议白名单/探针准入（http(s) 即收）；传输语义（KD-SV-55）零变——`proxy.mjs` 零触。
- 成员模型禁用面不做：新错误码（404 复用——消息明示） ∥ 定时/条件禁用 ∥ 嵌入面禁用（零涉） ∥ 禁用变更审计（零增——`accounts/ACCOUNTS.md` §2.2）；禁用状态的成员可见面（只出清单与拒形）。
- 上游代理面不做：全局代理闸 ∥ 环境变量回落（`HTTPS_PROXY` 一族——显式配置面）∥ `insecureTls` opt-in 通道 ∥ 代理认证（`Proxy-Authorization`——如内网代理需认证 ⇒ 停报另议）∥ 代理连接复用/连接池（每请求独立连接）∥ 按目标分层代理（单一 uri）∥ 嵌入面代理（零涉）。
- 别名面不做（2026-10-09 alias 批——KD-SV-59）：别名历史/迁移（改别名 = 当即生效）∥ 别名级独立限流/配额配置（键随对外标识自然随动）∥ 一名多模型/一组多名 ∥ 嵌入面别名（用户裁「嵌入面不相干」）∥ 成员键的存在性/别名交叉校验（键形校验 = 形状面单源——`accounts/ACCOUNTS.md` §2.2）。
- 配置面不做（2026-10-09 配置批）：配置文件热载/运行态注入（生效 = 重启——`ops/OPS.md` §1）∥ `host`/`port`/`db` 写面（部署拓扑项）∥ 配置版本史/回滚 ∥ 写前备份 ∥ 多实例并发写（单写者部署模型）∥ `providers[]`/`bootstrap` 写面（各有其面）。

## 变更记录

- 2026-10-06：建档（批 `docs/batches/2026-10-06-server-gateway.md` 设计轮；同日补轮——B 案织入 + 三层结构）——gateway 域：路由族表 ∥ OpenAI 三面 ∥ 转发与计量行为 ∥ 错误形（全码单源）；KD-SV-4/5/10；用例 N1–N4 ∥ B1/B3/B5/B6 ∥ E3–E7。
- 2026-10-06：实施后回填轮（fix）——§3 补 `internal_error`（500 兜底——处理函数自身异常入表）；§4 行数按实读回填（小计 ≈770 ⇒ 635）。
- 2026-10-06：模型标识口径变更（用户 10:27–10:28）——KD-SV-4 修订（`provider/model` 复合键派发 ∥ 同名跨 provider 并存 ∥ 同 provider 内重名 ⇒ 拒启 ∥ 无隐式解析）；§2 表 `/v1/models` 行与 §2.1 派发行随正。
- 2026-10-06：小收尾轮（fix）——§4 行数实读再收正（providers 40 ⇒ 55 ∥ routes 75 ⇒ 81 ∥ forward 183 ⇒ 185——模型标识 fix 轮随动；小计 ≈770 ⇒ 658）。
- 2026-10-06：控制台 provider/模型管理设计轮（批 `docs/batches/2026-10-06-console-providers.md`——需求 §2:11 ∥ 台账 #962）——§1 路由族表增 provider 管理面行 + 静态面五档 ∥ §2 `/v1/models` 行随正（运行时注册表派生）∥ §2.1 派发行随正 ∥ §2.2 增「provider 管理面」（端点表 ∥ 保存即热生效 ∥ 在途口径 ∥ 密钥回显形 ∥ 模型发现）∥ §4 预算（providers 55 ⇒ ≈150 ∥ routes 81 ⇒ ≈95 ∥ provider-admin 拟新增 ≈220）∥ §5 补 AC-11 候补判据行 ∥ §7 增 N16–N18 ∥ B14/B15 ∥ E14/E15 ∥ §8 增 provider 管理面不做项；决策 = KD-SV-19（`ops/OPS.md` §8）。
- 2026-10-06：fix 轮（评审轮次 1 五条——批 `docs/batches/2026-10-06-console-providers.md` §3）：#1 §2.2 增预设列表端点（`GET /api/admin/providers/presets`——「从预设快速添加」通道：请求/响应/错误形/校验单源衔接）∥ #2 §5 AC-11 行标记收正（已落需求档）。
- 2026-10-06：首版完备化设计轮（批 `docs/batches/2026-10-06-first-release-completeness.md`——需求 §2:12 ∥ 台账 #963）——§1 路由族表增系统面行 ∥ §2.3 增（healthz 探活 ∥ `/api/system` 版本/更新状态）∥ §3 账号面补 429 `too_many_attempts` ∥ §4 预算（system 拟新增 ≈70 ∥ errors +1；小计叠加 ≈1058）∥ §5 补 AC-13 候补行（①③ 面）∥ §7 增 N19/N20 ∥ B16 ∥ E16/E17 ∥ §8 增健康/系统面边界；决策 = KD-SV-23/24（`ops/OPS.md` §8）。
- 2026-10-06：控制台多语言设计轮（批 `docs/batches/2026-10-06-server-i18n.md`——需求 §2:13 ∥ 台账 #965）——§3 增「消息语言口径」行（服务端消息中文单语零改 ∥ 控制台 `code` 映射——机制 = `webui/WEBUI.md` §2.2）；错误形/码面零改。
- 2026-10-06：fix 轮（评审轮次 1 #6——批 `docs/batches/2026-10-06-first-release-completeness.md` §3）：§2.2 删「推翻式」残留（保「用户 2026-10-06 16:01 令」出处）。
- 2026-10-06：AC-13 行候补标记收正（父侧直接执行 · 机械 · 可 revert——已落需求档验收表）。
- 2026-10-06：实施后回填轮（R14——批 `docs/batches/2026-10-06-console-providers.md`）：§4 行数按实读收正（routes **86** ∥ providers **146** ∥ provider-admin **197**（新档）；小计 658 ⇒ **951**）；叠加链同拍（#963 结果值随 re-base）。
- 2026-10-06：实施后回填轮（R16——批 `docs/batches/2026-10-06-first-release-completeness.md`）：§2.3 `mode` 枚举补「未就位 ⇒ `null`」形 ∥ §4 行数按实读收正（system **55**（标记翻正） ∥ errors **56**；小计 ⇒ **1007**）。
- 2026-10-06：控制台可见面二轮设计轮（批 `docs/batches/2026-10-06-console-completeness-2.md`——需求 §2:15 ∥ 台账 #972）——§1 路由族表增控制台数据面行 ∥ §2.3 `/api/system` 行补 `embedding.model`（两角色——地址不下发）+ 随注 ∥ 增 §2.4（管理总览 ∥ 向量服务：三端点语义 ∥ 探活/试跑单端点 kind 四归类 ∥ 不落库不计量）∥ §4 预算（system ⇒ ≈60 ∥ embedding-admin/overview 新档；小计 ⇒ ≈1192）∥ §5 补 AC-15①③ 候补行 ∥ §7 增 N21/N22 ∥ B17 ∥ E18 ∥ §8 边界随正。
- 2026-10-06：fix 轮（评审 #69——批 `docs/batches/2026-10-06-console-completeness-2.md` §3 十项，本档面）：§5 AC-13③ 行响应形补 `embedding`（`{ model }`——两角色下发 ∥ 零地址字段——与 §2.3 同源）。
- 2026-10-06：控制台 Provider 重做设计轮（批 `docs/batches/2026-10-06-console-provider-redo.md`——需求 §2:18）——§2.2 模型发现行收正（失败 ⇒ 提示/重试——无手填兜底，用户 21:36 裁定；服务端语义零改）∥ §5 AC-11 行同拍；端点表零改（零新端点——勾选集经 PATCH `models` 单写）。
- 2026-10-06：服务模型配置面设计轮（批 `docs/batches/2026-10-06-models-config.md`——需求 §2:17 ∥ 台账 #981；裁定 21:39「ACDE」）——§2 chat 行 + §2.1 增模型限流准入（429 `rate_limited` + `Retry-After`）∥ §2.2 增「模型设置（`settings`）」（形/写面/读面/存储/校验/热生效）+ GET/PATCH 两行随正（零新端点）∥ §3 增码 ∥ §4 预算（`ratelimit.mjs` 拟新增 ≈90；routes/forward/providers/provider-admin/errors/server 增量；小计 ⇒ ≈1363）∥ §5 增 AC-17 行 ∥ §6 增 KD-SV-35 ∥ §7 增 N23–N25 ∥ B18 ∥ E19 ∥ §8 边界随正（RPM/并发限流句重写——C 入面）；机制全文 = §2.1 ∥ §6。
- 2026-10-07：配额分模型批设计轮（批 `docs/batches/2026-10-07-quota-per-model.md`——需求 §2:21 ∥ §2:22 ∥ 台账 #990/#991/#992）——§2 chat 行随正（配额准入 = 派发命中后/转发前）∥ §2.1 增配额准入条（三级 ∥ 短路 ∥ 点查 ∥ 429 形；限流条补位点次序）∥ §2.2 settings 形补 `quotaTokens` ∥ §3 `quota_exceeded` 消息补模型外标 ∥ §4 预算（routes 101 ⇒ ≈115 ∥ forward 196 ⇒ ≈204；小计 ⇒ ≈1385）∥ §5 增 AC-21 行 ∥ §8 边界随正（配额 = 额度式双轨在案）；机制全文 = `metering/METERING.md` §2。
- 2026-10-06：fix 轮（评审 #94——批 `docs/batches/2026-10-06-console-provider-redo.md` §3；本档面）：§7 E15 行收正（发现失败 = 提示 + 重试 ∥ 无手填兜底——废止表述删净；与 §2.2/§5 同拍）∥ §1 静态面行档数收正（`views-*` 八档 ⇒ 十档——三档单源）。
- 2026-10-06：fix 轮（评审 #95——批 `docs/batches/2026-10-06-models-config.md` §3；本档面）：§2.2「模型设置」补提交线形（键 = 上游模型名 ∥ 值 = 完整对象——未设/清空 = 显式 `null`；草稿初值 = GET 行 `settings`）∥ §4 两处「本批」改批名（二轮——system 行 ∥ 小计行）。
- 2026-10-07：配额 v2 · 成员模型面批设计轮（批 `docs/batches/2026-10-07-quota-v2-member-models.md`——需求 §2:23 ∥ 台账 #1002/#1003/#1004 + 并入 #1001）——§2 chat 行与 `/v1/models` 行随正（禁用准入 ∥ 成员滤除）∥ §2.1 增禁用准入条（位点/错误形/禁用优先于配额/列表随动）∥ §3 404 行括注（禁用消息区分）∥ §4 routes 实读回基 + 小计 ⇒ ≈1393 ∥ §5 增 AC-23 行 ∥ §7 增 N26/B19 ∥ §8 边界随正；机制全文 = `accounts/ACCOUNTS.md` §2.2。
- 2026-10-07：fix 轮（评审轮次 1——批 `docs/batches/2026-10-07-quota-v2-member-models.md` §3 六发现，本档面）：§5 AC-23 行「候补」标记收正（已落需求档——沿 AC-13/AC-14 先例）。
- 2026-10-07：Provider 模型元数据批设计轮（批 `docs/batches/2026-10-07-provider-model-metadata.md`——台账 #1005 + 并入 #984；用户 12:05/12:23 令）——§2.2 端点表四行随正（GET/POST/PATCH/discover——`modelMeta`）+ 增「模型元数据（留存图）」条 ∥ §4 预算（providers 167 ⇒ ≈175 ∥ provider-admin 220 ⇒ ≈258；小计 ⇒ ≈1439）∥ §5 增 AC-24 候补行 ∥ §7 增 N27/N28 ∥ B20 ∥ E20 ∥ §8 边界随正（存储同拍 = `store/STORE.md` §2 v7 段；展示 = `webui/WEBUI.md` §2.4④）。
- 2026-10-07：fix 轮（评审轮次 1——批 `docs/batches/2026-10-07-provider-model-metadata.md` §3 九发现，本档面）：§2.2 `displayName` 补长度上限（≤200 字符——沿 settings `note` 先例）+「仅 ≠ 模型名」范围明写（两来源皆适用）∥ §5 AC-24 行「候补」标记收正（已落需求档——沿 AC-13/AC-14 先例）∥ §7 N17 预期输出补 `modelMeta`（经典四件 ⇒ `{}`——与 §2.2/N27 同形）。
- 2026-10-07：文档清账批（fix 轮——承批档 `docs/batches/2026-10-07-doc-cleanup.md` §2 · 台账 #983）：§4 逐档实读收正（十一档；`ratelimit` **64** ∥ `embedding-admin` **96** ∥ `overview` **27**——三档「拟新增」标记随正（已落盘））；小计 ⇒ **实读 1362**（逐档复读和）。**零语义**。
- 2026-10-09（**provider-default-model-purge 批 · 设计评审轮 1 修正（fix 轮）· eng-designer**——承批档 `docs/batches/2026-10-09-provider-default-model-purge.md` §3 轮次 1 · 台账 #1122）：批内注记名统一「2026-10-09 清除批」（§2.2 预设端点行 ∥ §5 AC-11 行）。**零新语义**（注记名收正）。明细 = 批档 §2 修复轮块。
- 2026-10-09（**provider-default-model-purge 批 · 实施期发现收正（fix 轮）· eng-designer**——承批档 `docs/batches/2026-10-09-provider-default-model-purge.md` §2 · 台账 #1122；实施期上抛经父侧裁定：端点半形状保留 `models`（空清单））：§2.2 预设端点行样本补 `models: []` + 两键区分半句（`model` 键退场 ∥ `models` 空清单保留）∥ §5 AC-11 行措辞消歧同拍。**零新语义**（响应线形收正——样本漏笔，与实装对齐）。明细 = 批档 §2 补记。
- 2026-10-09（**server-gemini-openai-preset 批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-09-server-gemini-openai-preset.md` §2 · 台账 #1128 ∥ #1129；用户 13:45/13:5x 两令）：§2.1 增**上游出口代理**条（逐渠判定 ∥ 同判定 ∥ loopback 旁路 ∥ 无全局闸；机制全文 = §6 KD-SV-55）∥ §2.2 增「上游代理旗」条 + GET/POST/PATCH/discover 四行字段随正 + presets 行 20 ⇒ **21 家** ∥ §4 预算（`proxy.mjs` 拟新增 ≈200 ∥ forward/providers/provider-admin 增量）∥ §5 增代理判据行 + AC-11 行 21 家随正 ∥ §6 **增 KD-SV-55** ∥ §7 增 N29/N30/B21/B22/E21/E22 ∥ §8 增代理面不做句。**产品码零触（设计轮）**。明细 = 批档 §2。
- 2026-10-09：设计修正轮（fix——批 `docs/batches/2026-10-09-server-gemini-openai-preset.md` §3 评审发现 1/2/6/7，本档面）：§6 KD-SV-55 补两启动 warn（触发/文案）∥ 断连中止契约句（`opts.signal` ⇒ socket 拆除 ⇒ 记 `aborted`）∥ 头阶段 600s 先例钉定（客户端 provider 面 `fetchTimeoutMs`——`docs/core/design/PROVIDER.md:114`）∥ uri 射程（`http:` 仅）；§5 代理行补两 warn 与断连腿；§7 E21 补非对象形态与射程。**零新语义**（评审发现直接导出项）。
- 2026-10-09：配置控制台批设计轮（批 `docs/batches/2026-10-09-server-console-config.md`——台账 #1139；用户 15:51–15:57 三连）——§1 路由族表控制台数据面行增 `GET/PATCH /api/admin/config` ∥ §2.4 端点族随正 + 增两端点行（文件面读 ∥ 白名单写/载入面等价校验门/原子写/审计）+ test 行草稿三项明传优先 ∥ §4 预算（`config-admin.mjs` 新 ≈160 ∥ embedding-admin ⇒ ≈108；小计 ⇒ ≈1844）∥ §5 增 AC-28 行 ∥ §7 增 N31/B23/E23/E24 ∥ §8 增配置面不做项；机制全文 = `ops/OPS.md` §1 + §8 KD-SV-56。**产品码零触（设计轮）**。
- 2026-10-09：设计修正轮（fix——批 `docs/batches/2026-10-09-server-console-config.md` §3 评审发现 4/7，本档面）：§2.4 PATCH 行明写 `embedding` 子键级语义（缺省 = 不动 ∥ 明填 = 替换——`apiKey: ""` = 显式空）+ 掩码/引用回显形提交三态（未编辑 ⇒ 不携 ∥ 编辑 ⇒ 明传 ∥ 清除勾 ⇒ `""`）∥ test 行补探活侧同口径（不作明传值——三态与 PATCH 同）∥ §4 小计算术配平（+≈180 ⇒ +≈172 = 160 + 12 ∥ ≈1844 ⇒ **≈1836**——分项闭式 ∥ 同源随动 = `design/PROJECT.md` §6）。**零新语义**（评审发现直接导出项）。
- 2026-10-09：embed 解耦批设计轮（批 `docs/batches/2026-10-09-server-embedding-decouple.md`——台账 #1147 ∥ #1148；用户 17:24 两条之 1/2）——§1 路由表 `/v1/models` 行与 `/v1/embeddings` 行随正（引擎模型退场 ∥ 缺配 404）∥ §2.3 补缺段 `null` 形 ∥ §2.4 四行随正（GET 缺段两值 null ∥ 探活无草稿 400 ∥ PATCH 缺段建段）∥ §4 预算（routes ⇒ ≈117 ∥ providers ⇒ ≈181 ∥ embedding-admin ⇒ ≈118；小计 ⇒ ≈1847）∥ §5 AC-6/AC-15/AC-28 三行随补 ∥ §6 增 **KD-SV-58** ∥ §7 N4 随正 + 增 N33/N34/B24/E25 ∥ §8 边界随正。**产品码零触（设计轮）**。
- 2026-10-09：设计修正轮（fix——批 `docs/batches/2026-10-09-server-embedding-decouple.md` §3 评审发现 6–9，本档面）：§4 `embedding-admin.mjs` 行按配置控制台批落地实读收正（96 ⇒ **实读 110** ⇒ ≈118——陈值 ≈108 删）∥ §5 AC-28 行「候补」标记收正（已落需求档）∥ §2 表 `/v1/embeddings` 行粗体闭合（零语义）∥ §2.4 PATCH 行 + §7 E25 明写 `embedding: null` ⇒ 400（清空段 = 不做）。**零新语义**（评审发现直接导出项）。
- 2026-10-09（**server-model-alias 批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-09-server-model-alias.md` §2 · 台账 #1153 + 并入 #1008 ∥ #1010 ∥ #1152 ∥ #967 ∥ #1151；需求 §2:29 + AC-29；用户 20:32/20:36 令）：§2 `/v1/models` 行随正（`id` = 对外标识）∥ §2.1 派发行重写（对外标识精确匹配 ∥ 配了只认别名 ∥ 别名全服唯一）∥ §2.2 开放清单条补条目两形 + 模型元数据撤销面口径补记（#1010①）+ `displayName` 源口径补记（#1010②）∥ §2.3 `embedding` 字段判据单源化（运行时 accessor——#1152）∥ §4 预算（providers ⇒ ≈208 ∥ provider-admin ⇒ ≈322；小计 ⇒ ≈1887）∥ §5 增 AC-29 行 ∥ §6 KD-SV-4 随正 + **增 KD-SV-59** ∥ §7 增 N35/B25/E26 ∥ §8 边界随正（别名不做项）。**产品码零触（设计轮）**。
- 2026-10-09：设计修正轮（fix——批 `docs/batches/2026-10-09-server-model-alias.md` §3 评审发现 5②/6①，本档面）：§4 小计链算术平（+≈42 ⇒ **+≈44**——补 `forward` ≈210（与 §4 逐档行 ∥ `design/PROJECT.md` §6 同拍）；≈1887 ⇒ **≈1889**）∥ §2.2 开放清单条 ∥ §5 AC-29 行 ∥ §6 KD-SV-59① 三处 `alias` 口径闭合（归一集 = 缺省 ∥ `null` ∥ `""`；数字/布尔/对象/数组 ∥ 含 `/` ∥ 首尾空白 ⇒ 400）。**零新语义**（评审发现直接导出项）。明细 = 批档 §2 修复轮块。
- 2026-10-09（**console-proxy-page 批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-09-console-proxy-page.md` §2 · 台账 #1158；需求 §2:30 + AC-30；用户 21:06 令）：§1 路由族表控制台数据面行增 `POST /api/admin/proxy/test` ∥ §2.4 端点族随正 + 增代理测试行（双必传 ∥ `validateProxyConfig` 单源复用 ∥ 真打 `proxyFetch` ∥ kind 二分类 ∥ 自含形 ∥ 预算 10s ∥ 零落库不计量）∥ §4 预算（`proxy-admin.mjs` 拟新增 ≈95；小计 ⇒ ≈1984）∥ §5 增 AC-30 行 ∥ §7 增 N36/B26/E27 ∥ §8 增代理测试面不做句；控制台面 = `webui/WEBUI.md` §2.7 ∥ 决策 = KD-SV-60。**产品码零触（设计轮）**。
- 2026-10-09：设计修正轮（fix——批 `docs/batches/2026-10-09-console-proxy-page.md` §3 评审发现 3，本档面）：§1 路由族表前端静态面行 `views-*` 枚数收正（十档 ⇒ **十二档**——配置控制台批 + `views-system-config.mjs` ∥ 代理页批 + `views-proxy.mjs` 各 +1）。**零新语义**（评审发现直接导出项）。明细 = 批档 §2 修复轮块。
- 2026-10-09：实施后回填轮（代理页批——批 `docs/batches/2026-10-09-console-proxy-page.md` · eng-designer）：§4 `proxy-admin.mjs` 行「拟新增」翻正（**实读 81**）∥ 小计实读增量 **+81**。**零语义**（读数 ∥ 标记）。
- 2026-10-10（**console-proxy-back 批 · 设计形式化轮 · eng-designer**——承批档 `docs/batches/2026-10-10-console-proxy-back.md` §2 · 台账 #1199；需求 §2:30 + AC-30 回改；用户 08:22/08:41 令）：§1 路由族表前端静态面行 `views-*` 十二 ⇒ **十一档**（`views-proxy.mjs` 退役）∥ §2.4 代理测试行承载描述收正（「控制台代理页」⇒「控制台系统页「服务配置」卡·连通测试块」——端点/契约零变）∥ §8 代理测试面不做项批名 ⇒ 决策指针（KD-SV-60——`webui/WEBUI.md` §7）。**产品码零触**（形式化轮——码已落）。
