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
| 前端静态面 | `GET /` ∥ `public/**`（`app.mjs` ∥ `nav.mjs` ∥ `views-*` 五档 ∥ `style.css`） | 公开（页面壳零数据） | `webui/WEBUI.md` §1 |
| 其余 | —— | —— | 404（JSON 错误形 = §3） |

- 分派 = `thincoder-server/src/gateway/server.mjs`（已落盘）注册行制——新端点 = 注册一行（断点列 = `EVOLUTION.md` §1-G1）。
- 团队 key 面全部走 `Authorization: Bearer <key>`（OpenAI 兼容工具默认形——唯一接受形）。

## 2. OpenAI 三面

| 方法 + 路径 | 鉴权 | 语义 |
|---|---|---|
| `POST /v1/chat/completions` | 团队 key | 上游聊天转发（流式 SSE ∥ 非流式 JSON 均透传）；记账 |
| `GET /v1/models` | 团队 key | 模型清单（chat = `provider/model` 前缀名清单 ∪ 嵌入引擎模型——**运行时注册表派生**：开放清单 = 库内 `providers.models`，保存即换表——§2.2） |
| `POST /v1/embeddings` | 团队 key | 内网引擎转发（响应透传）；记账 |

### 2.1 转发与计量行为（三面共用）

- **派发 = `provider/model` 复合键精确匹配**（注册表查表——装配期构建 ∥ 保存即换表（§2.2）；**首斜杠切分**：首段 = provider ∥ 余段 = 上游模型名（可含斜杠）；两段非空；裸名不解析；未命中 ∥ 裸名 ⇒ 404 `model_not_found`——提示带前缀形；**同 provider 内重名 ⇒ 拒启**）——KD-SV-4（§6）；**解析 = server 面自持**（不沿用核 `parseModelRef` 冒号家族——两套面：仓内他面锚 `provider:model` ∥ 本面锚 `provider/model`）。
- **SSE 逐块透传**：中继字节面原样 `pipe`（零改）；客户端断连 ⇒ 中止上游（记 `status='aborted'`）。
- **流式计量注入**：`stream === true` 且未带 `stream_options.include_usage: true` ⇒ 置 true（显式 false 亦覆盖——计量完整性优先）——KD-SV-5（§6）。
- **usage 提取**：旁路 tap 只读扫描 `data:` 行 JSON（行缓冲 ∥ 单行上限 1 MiB ∥ BOM 剥除 ∥ CRLF 容错）——KD-SV-10（§6）；记录面（落库形 ∥ 写入时点）= `metering/METERING.md` §1。
- 含 usage 的帧对消费方无扰（四端核 `readSSE` 对 usage 帧直取后跳）。
- 上游配置（provider 库单源 ∥ `embedding` 段）= `ops/OPS.md` §1 ∥ §2.2。

### 2.2 provider 管理面（控制台——仅 admin）

（端点族 = `/api/admin/providers/*`；判权 = `accounts/ACCOUNTS.md` §3 `requireAdmin` 口径——`user` ⇒ 403 ∥ 无/过期会话 ⇒ 401；错误形 = §3 全码沿用——无新码；写端点 JSON 型门同 §1 前言）

| 方法 + 路径 | 语义 |
|---|---|
| `GET /api/admin/providers` | 列表 `{ providers: [{ id, name, baseURL, apiKey, models, createdAt, updatedAt }] }`；`apiKey` = 回显形（掩码——见下） |
| `POST /api/admin/providers` | 新增 `{ name, baseURL, apiKey?, models? }` ⇒ `{ ok, id }`；校验不过 ∥ 重名 ⇒ 400（库与运行时零变） |
| `PATCH /api/admin/providers/:id` | 修改（字段缺省 = 不动；`apiKey: ""` = 清除；可含 `env:` 引用）；不存在 ⇒ 404 |
| `DELETE /api/admin/providers/:id` | 删除（硬删——用量行零触）；不存在 ⇒ 404 |
| `POST /api/admin/providers/discover` | 模型发现（草稿可用）`{ baseURL, apiKey?, providerId? }` ⇒ `{ models: [...] }`；失败 ⇒ 502 `upstream_error` |
| `GET /api/admin/providers/presets` | 预设清单（只读——「从预设快速添加」数据源）`{ presets: [{ preset, name, baseURL, models }] }`——全表（起步 20 家）；缺省展开 = `expandProviderEntry`（`thincoder-server/src/ops/presets.mjs`——KD-SV-17）；**表零密钥**——响应无 `apiKey` 字段 |

- **存储 = 库单源**：`providers` 表（`store/STORE.md` §2 v2 段）；`config.json` 的 `providers[]` 降为一次性种子（矩阵 = `ops/OPS.md` §1）。
- **保存即热生效**（用户 2026-10-06 16:01 令）：装配期建 provider 运行时（箱内持注册表）；保存路径 = ① 校验（单源 = `thincoder-server/src/ops/config.mjs` 导出——与配置种子同规）→ ② 建候选注册表（`env:` 解析——缺位 ⇒ 400 不落库）→ ③ 落库 → ④ `runtime.set(候选)`（原子换表）；HTTP 面（`/v1/models` ∥ 派发）读 `runtime.get()`——**零重启**。
- **在途请求口径**：派发时快照（转发闭包持当时 provider 对象）——换表只影响**后续**请求；删除/改名不断在途流。
- **密钥回显形**（永不回明文）：空 ⇒ `""`；`env:` 引用 ⇒ 原文（引用非秘密）；明文 ⇒ `…` + 末 4 字符。密钥值**永不入日志**（日志只带 provider 名/id 与动作）。
- **模型发现**：`GET {baseURL}/models`（Authorization 条件同转发——key 空不发）；超时 10s（常量可覆盖——实现注入口径）；解析 = `data[].id` 字符串集（去重）；不可达 ∥ 超时 ∥ 非 JSON ∥ 无 `data` ⇒ 502 `upstream_error`（可读消息——UI 手填降级照常）；草稿键经 body 传入**不落库**。
- **开放清单 = `models` 字段**（勾选区）：`/v1/models` 逐项 = `provider/model`；派发只命中开放清单（未开放 ⇒ 404——选择性中继口径保持）。
- **预设快速添加（通道 = 预设列表端点）**：`GET /api/admin/providers/presets` ⇒ 表单预填（`name`/`baseURL`/`models`——用户补 `apiKey`）⇒ 保存走 **POST 全字段路径**；列表端点只读（写路径零新语义）——**预填不豁免校验**（单源 = `thincoder-server/src/ops/config.mjs` 导出；重名 ∥ 非法 ∥ `env:` 缺位照 400）；预设名不进写路径（写入体无 `preset` 字段——无未知预设错误面）；错误 = 401 ∥ 403（同族判权——零新码）。
- 装配接线：gateway 注册行装配期引导运行时（种子导入 → 构建）并返回；provider 管理面注册行接收**同一实例**（换表两族同见）。

### 2.3 系统面（探活 ∥ 版本可见——首版完备化①③）

| 方法 + 路径 | 鉴权 | 语义 |
|---|---|---|
| `GET /healthz` | 无（公开——探针入口；零鉴权只读） | 探活：`{ status, version, uptime, db }`——`status` = `"ok"` ∥ `"degraded"`；`version` = 运行树版本（同 `ready` 行——`ops/OPS.md` §5.4(g)）；`uptime` = 进程运行秒数；`db` = `"ok"` ∥ `"error"`（`SELECT 1` 一探）。正常 ⇒ 200；db 探活失败 ⇒ **503**（同形——`status:"degraded"` ∥ `db:"error"`）。`Cache-Control: no-store`；**不走统一错误信封**（探活响应自含状态）；仅注册 GET（HEAD ∥ POST ⇒ 404）。 |
| `GET /api/system` | 会话（两角色） | 版本与更新状态（控制台数据源——`webui/WEBUI.md` §2.1）：`{ version, update: { mode, lastCheckAt, latest } }`——`mode` = 生效档位（`false` ∥ `"notify"` ∥ `"auto"`——钉版抑制后；未就位 ⇒ `null`）；`lastCheckAt` = 最近自检时刻（unix ms ∥ `null` = 未检）；`latest` = 已见新版号 ∥ `null`（无新版 ∥ 未检——自检失败静默同面，`ops/OPS.md` §5.4(a)）。无 ∥ 过期会话 ⇒ 401 `unauthorized`（同族口径）。 |

- 优先级：两路径均注册路由（分派先于静态兜底——§1）；与 `/v1` ∥ `/api` 族互不重叠。
- 更新状态 = 更新器进程内状态（`thincoder-server/src/ops/update.mjs`——`getStatus()` 导出；入口惰性注入——路由注册先于更新器创建）；自检成功 ⇒ 更新状态（有新 ⇒ 置版号 ∥ 无新 ⇒ 清 `null`）；失败 ⇒ 保前值（静默口径同面）。

## 3. 错误形（全码单源）

- 统一形：`{ "error": { "message": "…", "type": "…", "code": "…" } }`。
- 本服务自产：401 `invalid_api_key`（无 key ∥ 未知 ∥ 吊销——不区分，防信息泄露）· 404 `model_not_found`（未配置模型）· 429 `quota_exceeded`（超额——message 含已用/额度值；机制 = `metering/METERING.md` §2）· 400 `invalid_request_error`（body 非 JSON ∥ 缺 model）· 413 `payload_too_large`（请求体超上限——上限常量 32 MiB）· 502 `upstream_error`（上游不可达）。
- 500 `internal_error`（兜底——处理函数自身异常）。
- 账号面（`/api/*`——同形）：401 `unauthorized`（无 ∥ 过期会话）· 401 `invalid_credentials`（登录失败 ∥ 旧密错误——同措辞同耗时）· 403 `forbidden`（角色不足）· 404 `not_found`（成员 ∥ key 不存在）· 429 `too_many_attempts`（登录锁定期——`Retry-After` 头（秒）；两维同文案——`accounts/ACCOUNTS.md` §2）。
- **上游已到达的错误**（4xx/5xx）：状态码与 body **原样透传**（不包不改）；仍记 error 行（token 未知记 NULL）。
- **消息语言口径**：服务端消息 = 中文单语（机器面零改——CLI/curl 消费方口径不变）；控制台按 `code` 前端映射本地化（中文 ∥ English——机制 = `webui/WEBUI.md` §2.2）；上游透传错误照原样（控制台原文回显）。

## 4. 本域文件与行数预算（本域族行）

| 档 | 行数（实读——设计估） | 职责 |
|---|---|---|
| `thincoder-server/src/gateway/server.mjs`（已落盘） | **192**（实读 2026-10-06——设计估 ≈140） | http 服务 ∥ 注册行分派 ∥ body 读限（32 MiB） ∥ 请求日志 |
| `thincoder-server/src/gateway/routes.mjs`（已落盘） | **86**（实读 2026-10-06——设计估 ≈240；#962 +5 = 读运行时（`runtime.get()`）） | chat ∥ models ∥ embeddings 三处理 |
| `thincoder-server/src/gateway/forward.mjs`（已落盘） | **185**（实读 2026-10-06——设计估 ≈190） | 上游 fetch ∥ 流式/非流式透传 ∥ tap 接线 ∥ 断连中止 ∥ 记账号 |
| `thincoder-server/src/gateway/sse-tap.mjs`（已落盘） | **90**（实读 2026-10-06——设计估 ≈80） | `data:` 行增量扫描 ∥ usage 提取 ∥ 有界缓冲 |
| `thincoder-server/src/gateway/providers.mjs`（已落盘） | **146**（实读 2026-10-06——设计估 ≈70；#962 +91 = 行→条目 ∥ 注册表构建（`env:` 解析） ∥ 运行时箱 ∥ 装配引导） | provider 注册 ∥ 模型派发 ∥ 派发失败形 ∥ 运行时（§2.2） |
| `thincoder-server/src/gateway/provider-admin.mjs`（已落盘） | **无 ⇒ 197**（实读 2026-10-06——#962 设计估 ≈220；行 CRUD ∥ 掩码回显 ∥ 模型发现 ∥ 管理端点注册——§2.2） | provider 管理面（控制台——仅 admin） |
| `thincoder-server/src/gateway/system.mjs`（已落盘） | **无 ⇒ 55**（实读 2026-10-06——设计估 ≈70；探活 handler ∥ `/api/system`（版本/更新状态） ∥ 注册——§2.3） | 系统面（healthz ∥ system） |
| `thincoder-server/src/gateway/errors.mjs`（已落盘） | **56**（实读 2026-10-06——设计估 ≈50；本批 +1 = `too_many_attempts` 码） | 错误形构造 ∥ 发送助手（含账号面码） |
| **小计** | **≈770 ⇒ 658 ⇒ 951**（#962 实读：+293）**⇒ 1007**（#963 实读：+56 = system 新 55 ∥ errors +1——口径 = #962 后） | —— |

## 5. 验收判据（机检面）

| 需求 AC | 设计级判据 | 载体 |
|---|---|---|
| AC-2（功能点 2） | SSE **逐块**：mock 上游两帧间隔——客户端先收帧 1 再等帧 2（证明非整段缓冲）∥ 帧字节逐值一致 ∥ `[DONE]` 透传；**收口轮四端任一实跑一轮**（真机） | 批内件 + 收口轮 |
| AC-6（功能点 6） | mock 引擎（断言流量命中引擎 `baseURL` 的 `/embeddings`）⇒ 响应体透传（维度/条数逐值不变）+ 记账 `endpoint='embeddings'` | 批内件 |
| AC-11（功能点 11——控制台 provider/模型管理；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | admin 三态（`user` ⇒ 403 ∥ 无会话 ⇒ 401 ∥ admin 200）∥ **保存即热生效**（POST 后 `/v1/models` 立含 + mock 上游完成一次请求；PATCH 改 `baseURL` ⇒ 下一请求命中新地址；DELETE ⇒ 下一请求 404——零重启；在途流照常收尾）∥ 密钥面（列表掩码不含明文 ∥ 日志零明文 ∥ `env:` 引用原样回显）∥ 发现（mock `/models` ⇒ 清单去重；不可达 ∥ 超时 ∥ 非 JSON ⇒ 502 + 手填降级）∥ 校验单源（非法条目 ∥ 重名 ∥ `env:` 缺位 ⇒ 400 且库与运行时零变）∥ 预设列表（`GET /api/admin/providers/presets` ⇒ 20 家 ∥ 响应零 `apiKey` 字段；预填 = 表单起手，写入仍走 POST 全字段 + 单源校验） | 批内件 |
| AC-13（功能点 12——首版完备化①③；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | ① `/healthz`：无鉴权 GET ⇒ 200 `{ status:"ok", version, uptime（数）, db:"ok" }`（`no-store`）∥ db 故障（注入口径）⇒ 503 `degraded` ∥ HEAD/POST ⇒ 404 ∥ 探针不触会话/团队 key 面；③ `/api/system`：无会话 ⇒ 401 ∥ 会话 ⇒ 200 `{ version, update:{ mode, lastCheckAt, latest } }`（假 registry 自检后 `latest`/`mode` 随实况——`"notify"` 可见不自装） | 批内件 |

## 6. 关键决策（本域）

| # | 决策 | 理由 | 被否候选与何故否 |
|---|---|---|---|
| KD-SV-4 | **模型派发 = `provider/model` 复合键精确匹配（按 provider 各持 `models` 列表）**——非别名 ∥ 非策略路由 | 多 provider 支持的正确性最小面：配置查表 ≠「模型别名/路由」（不做项所指）；**同名模型跨 provider 并存且各自可达**；未命中（含裸名——不解析）⇒ 404 `model_not_found`（提示带前缀形）；**同 provider 内重名 ⇒ 拒启**（防笔误）；`/v1/models` = 带前缀名清单 | 前缀通配路由（引入规则语言——越「不做」线）· 单上游写死（不满足「各 provider 的端点」）· 按请求头/参数选 provider（新增客户端契约——四端须改，违「baseURL 指入即用」）· **裸名兜底解析 ⇒ 否（无隐式解析）** |
| KD-SV-5 | **流式计量 = 请求注入 `stream_options.include_usage: true`** + 旁路 tap | OpenAI 兼容端点的流式 usage 只有被请求时才回传；不注入 ⇒ 流式请求全部无 token（AC-3 失效）。规则：`stream === true` 且 `stream_options.include_usage !== true` ⇒ 置 true（显式 false 亦覆盖——计量完整性优先；该字段只附加用量帧）；非流式不动。消费方容忍实证 = 四端核 `readSSE` 对 usage 帧（`choices: []`）直取后跳（`thincoder-core/provider/sse.mjs`） | 不注入 + 流式无计量（AC-3 不达）· 整段缓冲后再解析（违逐块透传）· 请求侧加 `stream:false` 改写（改变客户端语义） |
| KD-SV-10 | **SSE tap = 有界只读扫描**（行缓冲 ∥ 单行上限 1 MiB ∥ BOM 剥除 ∥ CRLF 容错） | 中继字节面原样 `pipe`（零改）；tap 只旁路解析 `data:` 行 JSON 取 `usage`；单行上限防病态膨胀（超限弃该行扫描——中继不受影响） | 全量缓冲解析（违逐块）· 正则抠 `usage`（脆弱——JSON 解析稳）· 无上限缓冲（恶意流可撑内存） |

## 7. 用例（本域）

| # | 类 | 输入 | 预期输出 |
|---|---|---|---|
| N1 | 正常 | 有效 key + 流式 chat（mock 上游回两帧文本 + 末帧 usage） | 200 SSE 透传；usage 行落库（token = 上游值） |
| N2 | 正常 | 有效 key + 非流式 chat（mock 回 `usage`） | 200 JSON 透传；记账同 N1 |
| N3 | 正常 | 有效 key + embeddings（mock 引擎回 2 条向量） | 200 透传（维度/条数不变）；记账 `endpoint='embeddings'` |
| N4 | 正常 | 有效 key + `GET /v1/models` | 200 列表含配置的全部 chat 模型（`provider/model` 前缀形）+ 引擎模型 |
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
| N17 | 正常 | admin 会话：`POST /api/admin/providers/discover`（mock 上游 `/models` 回 3 个 id） | `{models:[…]}`（去重）；勾选集保存后清单/派发按开放清单 |
| N18 | 正常 | admin 会话：`PATCH` 改 `baseURL` 指第二 mock ∥ `DELETE` 一 provider | 下一请求命中新上游 ∥ 被删者下一请求 404（用量行零触） |
| B14 | 边界 | 在途流式请求进行中删除其 provider | 流照常收尾（`ok` 记账）；后续请求 404 |
| B15 | 边界 | 种子四格：空库+段 ⇒ 导入（`env:` 保形）∥ 非空库+段 ⇒ 忽略 + 警告 ∥ 两空 ⇒ 允许起 + 警告 | `/v1/models` 随格：含种子 ∥ 不变 ∥ 空清单（chat 404） |
| E14 | 错误 | `user` ∥ 无会话 ∥ 非法条目 ∥ 重名 ∥ `env:` 缺位 ∥ 不存在 id | 403 ∥ 401 ∥ 400（库与运行时零变）∥ 404 |
| E15 | 错误 | 发现：不可达 ∥ 超时 ∥ 非 JSON | 502 `upstream_error`（可读消息——手填降级可用） |
| N19 | 正常 | 无鉴权 `GET /healthz`（正常态） | 200；`{ status:"ok", version, uptime, db:"ok" }`；`no-store` |
| N20 | 正常 | 会话 `GET /api/system`（假 registry 自检报新版后） | 200；`update.latest` = 假版号 ∥ `mode` = 生效档位 |
| B16 | 边界 | `GET /healthz`（db 探活失败——注入口径） | 503；`status:"degraded"` ∥ `db:"error"` |
| E16 | 错误 | `POST /healthz` ∥ `HEAD /healthz` | 404（未注册形——探针面单一） |
| E17 | 错误 | 无会话 `GET /api/system` | 401 `unauthorized` |

## 8. 本域边界（不做的面）

- 非 OpenAI 协议翻译 ∥ 模型别名/策略路由 ∥ 上游重试（失败原样返回——重试语义留给客户端）∥ RPM/并发限流（配额 = 额度式，非限速）∥ token 预估 ∥ 请求体/响应的内容加工（压缩、改写、脱敏——纯透传）∥ CORS（消费方均为服务端工具）。
- 嵌入引擎管理面（引擎起停手动——需求 §4）；多实例/横向扩展 = 触发项（`EVOLUTION.md` §2）。
- provider 管理面不做：本机 CLI 面（控制台 = 单一面——需求点名）∥ URL 白名单/出口限制（admin 权限自担——内网工具面）∥ 变更历史/回滚（行即现值——无版本化）∥ 渠道/灰度/多版本并存（沿更新面不做项——`ops/OPS.md` §10）。
- 健康/系统面不做：metrics/Prometheus ∥ 深度依赖探活（仅 db 一探） ∥ `unhealthy` 自动处置（外部工具面） ∥ `/api/system` 写面（只读）。

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
