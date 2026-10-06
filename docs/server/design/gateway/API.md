# Thincoder Server · 接口契约（gateway/API）

> 板块 = server ∥ 本档 = gateway 域（http 服务/路由注册 ∥ OpenAI 三面 ∥ 转发 ∥ sse-tap ∥ providers ∥ 错误形）；板总览 = `PROJECT.md`（文档地图 = §3）。
> 需求单源 = `docs/server/requirements/PROJECT.md`（功能点 2 ∥ 3 ∥ 6）；本域回指 = `PROJECT.md` §7（AC-2 ∥ AC-6 判据 = 本档 §5）。
> 建档：2026-10-06（批 `docs/batches/2026-10-06-server-gateway.md` 设计轮；同日补轮——B 案织入 + 三层结构）。

## 1. 路由面（三族 + 兜底）

| 族 | 方法 + 路径 | 鉴权 | 详表 |
|---|---|---|---|
| OpenAI 面 | `POST /v1/chat/completions` ∥ `GET /v1/models` ∥ `POST /v1/embeddings` | 团队 key（`Authorization: Bearer`——唯一接受形） | 本档 §2 |
| 账号/自助/管理面 | `/api/*` | 会话 cookie + 角色判定 | `accounts/ACCOUNTS.md` §3 ∥ `metering/METERING.md` §3（用量/配额端点） |
| 前端静态面 | `GET /` ∥ `/app.mjs` ∥ `/views.mjs` ∥ `/style.css` | 公开（页面壳零数据） | `webui/WEBUI.md` §1 |
| 其余 | —— | —— | 404（JSON 错误形 = §3） |

- 分派 = `thincoder-server/src/gateway/server.mjs`（已落盘）注册行制——新端点 = 注册一行（断点列 = `EVOLUTION.md` §1-G1）。
- 团队 key 面全部走 `Authorization: Bearer <key>`（OpenAI 兼容工具默认形——唯一接受形）。

## 2. OpenAI 三面

| 方法 + 路径 | 鉴权 | 语义 |
|---|---|---|
| `POST /v1/chat/completions` | 团队 key | 上游聊天转发（流式 SSE ∥ 非流式 JSON 均透传）；记账 |
| `GET /v1/models` | 团队 key | 模型清单（chat = `provider/model` 前缀名清单 ∪ 嵌入引擎模型——配置派生） |
| `POST /v1/embeddings` | 团队 key | 内网引擎转发（响应透传）；记账 |

### 2.1 转发与计量行为（三面共用）

- **派发 = `provider/model` 复合键精确匹配**（配置查表——**首斜杠切分**：首段 = provider ∥ 余段 = 上游模型名（可含斜杠）；两段非空；裸名不解析；未命中 ∥ 裸名 ⇒ 404 `model_not_found`——提示带前缀形；**同 provider 内重名 ⇒ 拒启**）——KD-SV-4（§6）；**解析 = server 面自持**（不沿用核 `parseModelRef` 冒号家族——两套面：仓内他面锚 `provider:model` ∥ 本面锚 `provider/model`）。
- **SSE 逐块透传**：中继字节面原样 `pipe`（零改）；客户端断连 ⇒ 中止上游（记 `status='aborted'`）。
- **流式计量注入**：`stream === true` 且未带 `stream_options.include_usage: true` ⇒ 置 true（显式 false 亦覆盖——计量完整性优先）——KD-SV-5（§6）。
- **usage 提取**：旁路 tap 只读扫描 `data:` 行 JSON（行缓冲 ∥ 单行上限 1 MiB ∥ BOM 剥除 ∥ CRLF 容错）——KD-SV-10（§6）；记录面（落库形 ∥ 写入时点）= `metering/METERING.md` §1。
- 含 usage 的帧对消费方无扰（四端核 `readSSE` 对 usage 帧直取后跳）。
- 上游配置（providers ∥ embedding 段）= `ops/OPS.md` §1。

## 3. 错误形（全码单源）

- 统一形：`{ "error": { "message": "…", "type": "…", "code": "…" } }`。
- 本服务自产：401 `invalid_api_key`（无 key ∥ 未知 ∥ 吊销——不区分，防信息泄露）· 404 `model_not_found`（未配置模型）· 429 `quota_exceeded`（超额——message 含已用/额度值；机制 = `metering/METERING.md` §2）· 400 `invalid_request_error`（body 非 JSON ∥ 缺 model）· 413 `payload_too_large`（请求体超上限——上限常量 32 MiB）· 502 `upstream_error`（上游不可达）。
- 500 `internal_error`（兜底——处理函数自身异常）。
- 账号面（`/api/*`——同形）：401 `unauthorized`（无 ∥ 过期会话）· 401 `invalid_credentials`（登录失败 ∥ 旧密错误——同措辞同耗时）· 403 `forbidden`（角色不足）· 404 `not_found`（成员 ∥ key 不存在）。
- **上游已到达的错误**（4xx/5xx）：状态码与 body **原样透传**（不包不改）；仍记 error 行（token 未知记 NULL）。

## 4. 本域文件与行数预算（本域族行）

| 档 | 行数（实读——设计估） | 职责 |
|---|---|---|
| `thincoder-server/src/gateway/server.mjs`（已落盘） | **192**（实读 2026-10-06——设计估 ≈140） | http 服务 ∥ 注册行分派 ∥ body 读限（32 MiB） ∥ 请求日志 |
| `thincoder-server/src/gateway/routes.mjs`（已落盘） | **81**（实读 2026-10-06——设计估 ≈240） | chat ∥ models ∥ embeddings 三处理 |
| `thincoder-server/src/gateway/forward.mjs`（已落盘） | **185**（实读 2026-10-06——设计估 ≈190） | 上游 fetch ∥ 流式/非流式透传 ∥ tap 接线 ∥ 断连中止 ∥ 记账号 |
| `thincoder-server/src/gateway/sse-tap.mjs`（已落盘） | **90**（实读 2026-10-06——设计估 ≈80） | `data:` 行增量扫描 ∥ usage 提取 ∥ 有界缓冲 |
| `thincoder-server/src/gateway/providers.mjs`（已落盘） | **55**（实读 2026-10-06——设计估 ≈70） | provider 注册 ∥ 模型派发 ∥ 派发失败形 |
| `thincoder-server/src/gateway/errors.mjs`（已落盘） | **55**（实读 2026-10-06——设计估 ≈50） | 错误形构造 ∥ 发送助手（含账号面码） |
| **小计** | **≈770 ⇒ 658** | —— |

## 5. 验收判据（机检面）

| 需求 AC | 设计级判据 | 载体 |
|---|---|---|
| AC-2（功能点 2） | SSE **逐块**：mock 上游两帧间隔——客户端先收帧 1 再等帧 2（证明非整段缓冲）∥ 帧字节逐值一致 ∥ `[DONE]` 透传；**收口轮四端任一实跑一轮**（真机） | 批内件 + 收口轮 |
| AC-6（功能点 6） | mock 引擎（断言流量命中引擎 `baseURL` 的 `/embeddings`）⇒ 响应体透传（维度/条数逐值不变）+ 记账 `endpoint='embeddings'` | 批内件 |

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

## 8. 本域边界（不做的面）

- 非 OpenAI 协议翻译 ∥ 模型别名/策略路由 ∥ 上游重试（失败原样返回——重试语义留给客户端）∥ RPM/并发限流（配额 = 额度式，非限速）∥ token 预估 ∥ 请求体/响应的内容加工（压缩、改写、脱敏——纯透传）∥ CORS（消费方均为服务端工具）。
- 嵌入引擎管理面（引擎起停手动——需求 §4）；多实例/横向扩展 = 触发项（`EVOLUTION.md` §2）。

## 变更记录

- 2026-10-06：建档（批 `docs/batches/2026-10-06-server-gateway.md` 设计轮；同日补轮——B 案织入 + 三层结构）——gateway 域：路由族表 ∥ OpenAI 三面 ∥ 转发与计量行为 ∥ 错误形（全码单源）；KD-SV-4/5/10；用例 N1–N4 ∥ B1/B3/B5/B6 ∥ E3–E7。
- 2026-10-06：实施后回填轮（fix）——§3 补 `internal_error`（500 兜底——处理函数自身异常入表）；§4 行数按实读回填（小计 ≈770 ⇒ 635）。
- 2026-10-06：模型标识口径变更（用户 10:27–10:28）——KD-SV-4 修订（`provider/model` 复合键派发 ∥ 同名跨 provider 并存 ∥ 同 provider 内重名 ⇒ 拒启 ∥ 无隐式解析）；§2 表 `/v1/models` 行与 §2.1 派发行随正。
- 2026-10-06：小收尾轮（fix）——§4 行数实读再收正（providers 40 ⇒ 55 ∥ routes 75 ⇒ 81 ∥ forward 183 ⇒ 185——模型标识 fix 轮随动；小计 ≈770 ⇒ 658）。
