# 代理出口（PROXY）· 网络出口板块

> 板块 = **网络出口（代理）**——配置形态 · 传输实现 · TLS 校验 · 消费面。实现 = `thincoder-core/proxy.mjs`（融合后形态）。
> 地图与相邻权威 = `docs/core/design/CONFIG.md`（§「越段发现」登记：代理面机制居 `PROXY.md`，本档即其落点）；provider 面 = `docs/core/design/PROVIDER.md`（本档不复制，D2）。
> 双端：CLI 用核内 `thincoder-core/proxy.mjs`（**融合形态**——取 CLI 的 abort 来源标注 + VSC 的坏代理串友好报错，见 `CONFIG.md` 融合表 `proxy.mjs` 行）；VSC 侧经 `@thincoder/core/proxy.mjs` 引用（W10 已迁核——自持镜像 `thincoder-vscode/src/proxy.mjs`（迁移期引文）已删）。
> 需求侧 = `docs/core/requirements/CONFIG.md`（代理字段面承载）；CLI 树无逐档需求档（实核）。
> 建档：2026-09-15（**B 式迁移轮 · 第 3 批**——`thincoder-cli/docs/design/PROXY.md` 内容重建入基准层；旧档原地一字不改、留作参照历史；**旧档 §TLS 段与实装相反 ⇒ 按实装现状落笔**——见 §3 与 §8.1）。
> 本档坐标基准 = **2026-09-15（B 式迁移实核日）**（仓根 = `thincoder/`）；后续轮次逐行收正、随行注 as-of——有注以注为准。

## 1. 定位与配置形态

配置文件 `~/.thincoder/config.json` 的 `proxy` 字段；TUI 入口 = `/config` → Proxy 子菜单（§5）。

```json
{ "proxy": { "uri": "http://127.0.0.1:7890", "web": true } }
```

- `uri`：http 代理地址（`url` 字段名也兼容）——**代理目标本体（非门槛）**；全仓单一 `proxy.uri`。旧格式 `"proxy": "http://..."`（裸字符串）兼容，等价于 `web: true`。
- `model` 键：**已退役**（2026-10-08 裁 A——键随归一键形 ∥ 三端全局面 UI ∥ 写链 ∥ 词表全清；施行已落）。运行期判定不读该键（逐渠独立——§4）；载入归一恒收窄为 `{ uri, web }`。
- 归一化：`thincoder-core/config.mjs:259`（`normalizeProxy`）→ `{ uri, web }` 或 `undefined`；加载时调用点 `thincoder-core/config.mjs:384`。缺省 `web: true`；无 uri / uri 非字符串 / 非对象类型（数字 / 数组等）一律**丢弃**。
- `web` 与**逐渠代理**（渠道条目 `providers[].proxy`）的**现行消费面**见 §4。
- 环境回落：`HTTPS_PROXY` / `HTTP_PROXY` / `ALL_PROXY`——**仅在未配置 `proxy` 字段时生效**（`resolveProxyConfig`——拆档后家位 `thincoder-core/proxy-target.mjs`），且该路径不供模型代理（逐渠旗只对在案 `uri` 生效）。

## 2. 传输实现（`thincoder-core/proxy-transport.mjs` ∥ `thincoder-core/proxy.mjs`）

- **`https://` 目标**：HTTP CONNECT 隧道（`tunnelHttps`，`thincoder-core/proxy-transport.mjs:166`）——连代理发 `CONNECT host:port`，隧道上建 TLS，隧道建立后移交 `streamHttpResponse`（`:205`），再发请求。响应头到齐即返回，body 为**流式**（SSE 边收边吐；abort 全阶段可中断）。
- **`http://` 目标**：经典代理转发（`tcpConnectProxy` `thincoder-core/proxy-transport.mjs:216` + `streamHttpResponse(..., absoluteForm=true)`）——TCP 直连代理，请求行发**绝对 URI**。非标准绝对 URI 实现的代理（极少见）不支持。
- **无代理 / 未命中**：原生 `fetch` 直连（`proxyFetch` `thincoder-core/proxy.mjs:33`）。
- 统一出口 `proxyFetch(url, opts, proxyUri)`（`:33`–`:50`）：无 `proxyUri` → `globalThis.fetch`（**直连分支 = 断流通道建设点**——见下）；`https:` → 隧道；`http:` → 转发。
- **loopback 旁路（2026-10-07 补 · #1026）**：目标为 loopback（`localhost` ∥ `*.localhost` ∥ `127.0.0.0/8` ∥ `::1`——判定 `isLoopbackTarget()` `thincoder-core/proxy-target.mjs:44`；含尾点 ∥ IPv6 括号归一）时，即便在案代理串也**一律直连**
  （`proxyFetch` 入口旁路 `thincoder-core/proxy.mjs:35`；NO_PROXY 语义）。本地网关 / 开发服务（如 `127.0.0.1:8787` 渠道）被塞进企业代理 ⇒ 连接失败 / 403 假红（用户 2026-10-07 案）。
- **拆档（#1037 · 2026-10-08 批——先拆后改）**：原档 303 行越 300 咨询线。落法 = 三段切开：`thincoder-core/proxy-target.mjs`（新——`resolveProxyConfig` ∥ `resolveWebProxy` ∥ `isLoopbackTarget`：目标 ∥ 配置解析面）·
  `thincoder-core/proxy-transport.mjs`（新——`streamHttpResponse` ∥ `tunnelHttps` ∥ `tcpConnectProxy` + `FETCH_TIMEOUT`：传输面）· `proxy.mjs`（留 `injectProxy` + `proxyFetch` 编排 + 兼容再出口 facade——**消费面 import 零改**）。
  三档 = `proxy-target.mjs` 54 ∥ `proxy-transport.mjs` 245 ∥ `proxy.mjs` 50 行（2026-10-08 按盘实读——`proxy-transport.mjs` 含同窗 #1065 集成；≤500 咨询线）。
- 错误形态：坏代理串**友好报错**（`Invalid proxy URI: "…" — expected http://host:port`，`thincoder-core/proxy-transport.mjs:175` / `:223`——融合自 VSC 侧）。
- 超时语义：CONNECT/TLS 阶段用 `FETCH_TIMEOUT`（15s）；**响应头**用 `opts._headerTimeoutMs`（默认 60s——消费面 = **代理分支**；直连面（无 `proxyUri`）无本仓头阶段超时〔纳入 = 设计轮面——在册；同族收窄 = `PROVIDER.md:114`（§6.3）〕）；**body 空闲**看门狗 `opts._bodyIdleMs`（默认 120s）。
- **响应体分块解码（2026-10-08 补 · #1065）**：响应携 `Transfer-Encoding: chunked` 时，传输层按块长帧**剥帧解码**后入 body
  （单点 = `streamHttpResponse`——https 隧道 ∥ http 转发两条代理分支共用：汇流坐标 = `tunnelHttps` `thincoder-core/proxy-transport.mjs:205` ∥ `proxyFetch` `thincoder-core/proxy.mjs:49` 均移交本函数；解码器 = `thincoder-core/proxy-chunked.mjs`）。**流式保形**：边收边吐、只保有帧头（块长行），零整包缓冲
  ——SSE 面 `data:` 行与事件流不受帧字节干扰；终止 = `0` 块（其后 trailer ∥ 余字节读取即弃，body 随 0 块结束）；`Connection: close` 语义不变。
  **畸形帧回退 = 透传**（块长行非十六进制 ∥ 块长数值越界（非安全整数）∥ 块尾非 CRLF ⇒ 停解码、余字节原样吐——不报错、不截断）；判定按 `Transfer-Encoding` 末段 token（大小写不敏感），**头缺席而帧在场（协议违规）不解码**。
  **管线拓扑**：解码器居源 `sock` 与目标 body 之间、**函数式改写**（body 本体零替换——chunked 径 `sock.on('data')` ⇒ `decoder.push(d)` ⇒ `onData` ⇒ `body.write()`（经写门 `!destroyed && !writableEnded`——终止后解码器余出不再入 body，与非 chunked 径 `pipe` 自摘语义齐）；非 chunked 径 `sock.pipe(body)` 不变）。
  **错误面归口（#16 契约零变）**：解码器 = 纯状态机、无自有 `'error'` 面（畸形帧回退透传——不 emit）；body 终止守卫族（`destroyBody` ∥ `_bodyIdleMs` 看门狗 ∥ `terminateBody`）照旧对 body 单点直作、不经解码器；`sock` 级错误沿现径（`thincoder-core/proxy-transport.mjs:141-144` ⇒ `fail` ⇒ `destroyBody`）。
  **行数注记**：新档 `proxy-chunked.mjs` = **102 行** ∥ `streamHttpResponse` 改动面落 `thincoder-core/proxy-transport.mjs`（**219 ⇒ 245 行**）∥ 批内件 = **301 行**（含 C16 CONNECT 腿；按盘记录；明细 = 批档 `docs/batches/2026-10-08-proxy-chunked-frame.md` §2.4 ∥ §2.12）。
  回归面（旧缺此解码）：代理响应体首段携 `<hex>\r\n` 帧 ⇒ 一切走代理的请求 body 污染（模型清单探针 `non-JSON response` ∥ 聊天 SSE 事件被打断——用户 2026-10-08 案）。
- **body 终止守卫（#16 · 崩溃族）**：body = 响应体 `PassThrough`（管线两端 = 源 `sock`（net socket）→ 目标 body；body 建于 `thincoder-core/proxy-transport.mjs:43`；头到齐后写入 = 非 chunked 径 `:109` `sock.pipe(body)` ∥ chunked 径经解码器逐段 `body.write()`——body 本体零替换）
  ——头后失败 ∥ body 空闲看门狗以 `destroy(err)` 终止 body **前**，先挂**永久** no-op `'error'` 监听者
  （单点 `destroyBody(body, err)`——`thincoder-core/stream-destroy.mjs`（已落；proxy ∥ provider 三文件共用）；契约与理由 = §7 D-PX7）。
  无监听者瞬间的 `destroy(err)`（含 pipe 内部监听者触发即自摘后的重发）产生未处理 `'error'` ⇒ `uncaughtException` ⇒ **整个进程被杀**（2026-09-22/23 三份 crash-report 签名 `Response body timeout (idle)` = 此路径——GitHub #16）。
  **消费面语义零变**：在场 ∥ 迟到 `for-await` 消费者仍收原错误；`stream.errored` 保留原错误对象。
  **web `ReadableStream` 断流通道（2026-10-04 补 · 评审轮 1 收正）**：直连 fetch 路径 body = web `ReadableStream`（无 `destroy`）⇒ 断流经**内部 abort 通道**：
  **建设点 = `proxyFetch` 直连分支单点**（无 `proxyUri` 分支：建 `AbortController`、signal 合成 `AbortSignal.any([opts.signal, ctrl.signal])`、经 `IDLE_ABORT` symbol 挂 response；provider 请求出口拓扑 = proxy 两分支唯经 `proxyFetch`、直连面调用点收口恒走 `proxyFetch` ⇒ 单点覆盖两条流式直连链）；
  单点 `terminateBody(response, err)` 对挂有该通道者走 `controller.abort(err)`（fetch body 随之中止——读侧看门狗对直连路径有效）；无通道且非 destroy 形态才 no-op（`destroyBody` 原契约不变）。proxy 路径不变（自有 `_bodyIdleMs` + 可 destroy body）。

## 3. TLS 证书校验

**现行语义**：CONNECT 隧道内的 TLS 握手**默认全量证书校验**；仅当显式传 `opts.insecureTls === true` 才放行。

```js
// thincoder-core/proxy-transport.mjs:200
const tlsSock = tlsConnect({ socket: sock, servername: target.hostname, rejectUnauthorized: opts?.insecureTls !== true })
```

| 面 | 内容 |
|---|---|
| **实装事实** | `thincoder-core/proxy-transport.mjs:200`：`rejectUnauthorized: opts?.insecureTls !== true` ⇒ **默认 true（全量校验）**；`:160`–`:161` 与 `:199` 注释逐字：「TLS 默认全量证书校验（rejectUnauthorized: true）——走代理的流量（含 API key）不得在未验证链路上传输；确需自签 / 内网代理时 opts.insecureTls=true 显式放行」。 |
| **新档写法** | **默认校验**；自签 / 企业 MITM 代理须**显式 opt-in**。 |

- **opt-in 通道**：`insecureTls` 目前**无 config / UI 入口**（实核：全仓仅 `thincoder-core/proxy.mjs` 三处出现，无调用方注入）——它是 `opts` 层契约，为测试与将来接入保留。
- **代价面（现行）**：经代理的 HTTPS 流量对**代理运营方**可见（CONNECT 隧道终止于代理）；若显式放行 `insecureTls`，则失去对「代理 ↔ 目标站」中间人攻击的检出。**敏感 API key 会随请求经过代理**——因此模型请求走代理 = **逐渠道显式开启**（`providers[].proxy`——默认关；§4）。web 工具只拉公开网页，风险面较小。
- 直连路径（无代理）不受本机制影响（走原生 `fetch` 的默认校验）。

## 4. 消费面（谁走代理）

| 开关 | 现行语义 | 落点 |
|---|---|---|
| 模型请求（逐渠 `providers[].proxy`） | **逐渠道独立才生效**——per-provider `proxy: true` **且** `proxy.uri` 在案 ⇒ 该渠模型请求经代理；渠道旗缺席 ⇒ 直连（**无全局闸**——用户 2026-10-07 19:04 裁「2b」；2026-10-08 落）。`uri` = 代理目标本体（非门槛）。注入点 = **二**：① `injectProxy`（CLI ∥ 桌面经核装配；判定式 = 逐渠旗 ∧ `uri`）② VSC `providerFromConfig`（`thincoder-vscode/src/extension/presets.mjs:134`——VSC 运行期自建 provider 自身注入点，2026-10-08 收正） | 注入 ① `thincoder-core/proxy.mjs`（`injectProxy`——拆档后仍住本档）· 调用 `thincoder-core/agent/assemble.mjs:71` ∥ `thincoder-cli/src/tui/cmd-config.mjs:71`（`/config` 保存重载）· ② `thincoder-vscode/src/extension/presets.mjs:134` · 消费 `provider.proxyUri`：`thincoder-core/provider/core.mjs:399` ∥ `provider/list-models.mjs:32` ∥ `thincoder-core/generate-title.mjs:115` ∥ `provider/anthropic.mjs:104` ∥ `provider/google.mjs:127` ∥ `provider/responses.mjs:249/:268/:286` |
| `web` | **不再自动应用到 web 工具**：`fetch` / `websearch` 采**逐次调用**的 `proxy` 工具参数（`args.proxy`），config 的代理**不自动施加**（2026-08-31 裁定）。`web` 字段现行唯一活消费面 = `/config` 的 **Test connection** 探针 | 工具面 `thincoder-core/tools/web.mjs:96` · `:104`–`:106` · `:188` · `:197`–`:198`；探针 `resolveWebProxy`（拆档后家位 `thincoder-core/proxy-target.mjs`）· 调用 `thincoder-cli/src/tui/cmd-config.mjs:149` |
| **server 上游链（探针 ∥ chat 转发——2026-10-09 代理批 · 台账 #1129）** | **逐渠独立镜像（同首行语义）**——条目 `proxy: true` ∧ `uri` 在案 ⇒ 该渠上游请求（chat 转发 ∥ 模型发现）经代理；缺省 ∥ 无 uri ⇒ 直连（**无全局闸**——镜像 D-PX1）；loopback 旁路照旧。实现 = server 树**自持**（零第三方——不 import 核件：KD-SV-2）；机制全文 = `docs/server/design/gateway/API.md` §6 KD-SV-55 | server 侧 2026-10-09 代理批落 |

> `web` 字段仍可写、仍可在 `/config` 切换（`thincoder-cli/src/tui/cmd-config.mjs:121`），但其对 web 工具的门控已由 2026-08-31 裁定取消——**字段语义与菜单标签存在落差**，见 §8.1 登记。

> 例外（2026-10-07 补 · #1026）：**loopback 目标永不经代理**——`localhost` ∥ `*.localhost` ∥ `127.0.0.0/8` ∥ `::1` 命中即直连（核内 `proxyFetch` 入口旁路——见 §2）；VSC 添加渠道表单的 Test connection 探针**经核 `probeTargetOf` 单源**
> （表单「走 proxy」勾选随行——勾 ⇒ 逐渠判定（`proxy: true` ∧ `uri`——2026-10-08 去全局闸）∧ loopback 旁路照旧；未勾 ∥ 缺省 ⇒ 直连，与运行期缺省一致；不取全局 `web` 旗——`thincoder-vscode/src/extension/settings.mjs:232`；三端对齐批（2026-10-07 · 台账 #1027–#1035）收正）。

> 探针字段面（2026-10-08 · #1048①）：探针目标构造单源 `probeTargetOf`（`thincoder-core/provider-flows.mjs:79-90`）目标形**携 `headers`**（仅 plain-object 才携；缺 ∥ 非法 ⇒ 零键——同 `apiKey` 归一律）；
> 来源面 = 盘上条目（准入 ∥ 拉取探针取落盘条目——自带 `headers` 随行）∥ 表单（VSC 添加表单探针——表单无 `headers` 录入位 ⇒ 该径零键）；消费点 = `list-models` 各 format 分支请求头展开（`thincoder-core/provider/list-models.mjs:61` ∥ `:66` ∥ `:82`）。

## 5. `/config` Proxy 子菜单与保存链

```
Set proxy URI…                                 空输入不改动；旧 string 形态自动升级为规范对象
Web tools (fetch/websearch): ON|OFF            即时保存即时生效
Test connection                                经当前生效配置请求 generate_204（5s 超时）
Clear proxy
```

- 落点：`thincoder-cli/src/tui/cmd-config.mjs:114`（`proxyMenu`——2026-10-08 实读）· 菜单项 `:118`–`:124`。
- **保存链**：`saveProxy` → `reloadConfig`（`loadConfig` → `injectProxy` → 恢复运行时 provider 选择）——`thincoder-cli/src/tui/cmd-config.mjs:67`–`:98` · `:106`–`:111`。
- 菜单开关必须先有 `uri`（未设置时提示 `Proxy URI not set — use Set proxy URI… first`，`:142`）。
- 主菜单摘要行 `proxySummary()`（`cmd-config.mjs:42`；消费 `:349` ∥ `:363` ∥ `:388`）——形 = `uri web:on|off`（`model:on|off` 段随 2026-10-08 裁退役）。
- **#1049（CLI 两向导「走 proxy」问句——2026-10-08 裁「补步」· 设计落法）**：两向导 = `thincoder-cli/src/cli/setup-wizard.mjs`（首配——入口 `thincoder-cli/src/command-interactive.mjs:56` ∥ `thincoder-cli/src/cli/distill-command.mjs:44` ∥ `thincoder-cli/src/acp/login.mjs:19`）∥
  `thincoder-cli/src/tui/wizard.mjs`（TUI 首启——`thincoder-cli/src/tui/index.mjs:194` 装配 ∥ `thincoder-cli/src/tui/startup.mjs:238` 触发）；皆在 provider-admin 四流之外。
  **问句形 ≡ add 流既有问句**（`thincoder-cli/src/tui/provider-admin.mjs:74` ∥ `:102` 同形）：正文 `Route this provider's model requests through the proxy` ∥ 两选项 No (direct) / Yes (proxy) ∥ 缺省 No；答 Yes ⇒ 条目 `proxy: true`，No ∥ 缺省 ⇒ 零 `proxy` 键（渠道条目照落）。
  **位置** = 向导末问（全部输入步后、落盘 ∥ 流尾探针前）；**载体各随该档既有输入形**（零新机制）——TUI 向导 = `showPicker` 同形调用（`thincoder-cli/src/tui/wizard.mjs` `finishWizard` 落盘前；经 ctx 注入——`thincoder-cli/src/tui/index.mjs` 装配处随 `openModelPicker` 先例）∥ 首配向导 = 该档既有 readline `ask`（y/N；该档唯一输入机制）。
  **写入点 = 新渠条目 `proxy` 字段**（随各自落盘一次写；探针条目携答案——探针 ≡ 写后运行态，同 #1048② 判据）；**重配语义**（2026-10-08 父裁〔a〕——批档 §5 补步腿报表项 1）：既有渠重配 = **upsert 保留**——答 No ∥ Esc 均零写，不清既有旗；渠级旗写入径配套已齐（形A 删行 + 两向导问句）——零新增债登记（批档 §2.15 ②）。
  **验收/用例面** = 批内件增量腿（两向导双案：答 Yes ⇒ 盘上 `proxy: true` ∥ No ∥ 缺省 ⇒ 零 `proxy` 键——首配向导假 HOME 子进程实跑（沿 T5 驱动器先例）∥ TUI 向导 mock ctx 行为腿）——**已落：W1 ∥ W2**。
  **实施 = 已落**（2026-10-08 · #1049 补步腿）：首配向导 `thincoder-cli/src/cli/setup-wizard.mjs`（109 行——问句 `:62`–`:63` ∥ 探针携答案 `:71` ∥ 写盘 `:90`）∥ TUI 向导 `thincoder-cli/src/tui/wizard.mjs`（256 行——`:192`–`:196`）∥ 装配注入 `thincoder-cli/src/tui/index.mjs:196`。

## 6. 机制面（B 式迁移并入——现状路径）

### 6.1 实现坐标（基准 = 2026-09-15 实核；后续逐行注 as-of——有注以注为准）

| 面 | 落点 | 实核 |
|---|---|---|
| 配置归一化 | `thincoder-core/config.mjs:259`（`normalizeProxy`）· 调用 `:384` | 在位 |
| 代理解析（含 env 回落） | `thincoder-core/proxy-target.mjs`（拆档后家位，现位 `:17-31` ∥ `:34-37`；原 `thincoder-core/proxy.mjs:22` ∥ `:40`） | 在位 |
| model 注入（逐渠判定） | `thincoder-core/proxy.mjs`（`injectProxy`——判定式 = 逐渠旗 ∧ `uri`；拆档后重锚——现位 `:19-24`（2026-10-08 按盘实读）） | 在位 |
| TLS 校验判定 | `thincoder-core/proxy-transport.mjs`（`tunnelHttps` 内——拆档后家位，现位 `:200`；原 `thincoder-core/proxy.mjs:232`） | 默认全量校验 |
| CONNECT 隧道 | `thincoder-core/proxy-transport.mjs`（`tunnelHttps`——拆档后家位，现位 `:166`；原 `thincoder-core/proxy.mjs:198`） | 在位 |
| 经典转发 / 流式响应 | `thincoder-core/proxy-transport.mjs`（`tcpConnectProxy` ∥ `streamHttpResponse`——拆档后家位，现位 `:216` ∥ `:34`；原 `thincoder-core/proxy.mjs:248` ∥ `:85`） | 在位 |
| 响应体分块解码（#1065） | `thincoder-core/proxy-chunked.mjs`（解码器 `createChunkedDecoder`）· 单点 = `proxy.mjs` `streamHttpResponse`（拆档后 = `proxy-transport.mjs`） | 已落（#1065 实施落讫——解码器 102 行） |
| 统一出口 | `thincoder-core/proxy.mjs`（`proxyFetch` 编排——直连分支 = 断流通道建设点；拆档后重锚——现位 `:33-50`（2026-10-08 按盘实读）） | 在位 |
| loopback 旁路（#1026） | `thincoder-core/proxy-target.mjs`（`isLoopbackTarget`——拆档后家位，现位 `:44`）· 旁路点 = `proxy.mjs` `proxyFetch` 入口（现位 `:35`） | 在位 |
| web 工具代理参数 | `thincoder-core/tools/web.mjs:96` · `:188` | 逐次调用参数 |
| TUI 子菜单 | `thincoder-cli/src/tui/cmd-config.mjs:104`–`:114` | 在位 |
| VSC 对位实现 | 经 `@thincoder/core/proxy.mjs` 引用（W10 已迁核——镜像已删）· 配置面 = 核 `config-io.mjs` 引用（VSC 自持副本已退场——实核 2026-10-08）· **运行期注入点 = `thincoder-vscode/src/extension/presets.mjs:134`（`providerFromConfig`——逐渠判定）** | 同实现 |
| body 终止守卫（#16） | `thincoder-core/stream-destroy.mjs`（已落——单点 `destroyBody` ∥ `terminateBody`（web 流 abort 通道）+ `IDLE_ABORT`）· **abort 通道建设点 = `thincoder-core/proxy.mjs` 直连分支（`proxyFetch`——评审轮 1 收正）** · 消费点 `thincoder-core/proxy-transport.mjs:61` ∥ `:74` ∥ `thincoder-core/provider/sse.mjs:207` ∥ `thincoder-core/provider/google.mjs:219` | 本批落位；2026-10-04 扩 abort 通道 |
| server 对位实现（2026-10-09 代理批） | `thincoder-server/src/gateway/proxy.mjs`（自持——`proxyFetch` fetch-like：loopback 旁路 ∥ CONNECT 隧道 ∥ 经典转发 ∥ 超时族；node:http/https 内建 + 自建 CONNECT——std） | 逐渠判定镜像（D-PX1）；机制全文 = `docs/server/design/gateway/API.md` §6 KD-SV-55 |

### 6.2 测试面

- 代理族单测（CONNECT 隧道 / 配置解析 / `normalizeProxy` / 坏代理串报错 / provider 头注入——原 `provider-headers.test.mjs` 经 `_deps.proxyFetchImpl` 注入替身）原在 CLI 测试树（`thincoder-cli/test/`）——**随 2026-09-28 测试树全清重置退场**；实读 2026-10-03：现盘 = `run.mjs` ∕ `slow.mjs` + smoke 三枚，零 `.test.mjs`。
- 现形 = 单元测试档（批内件惯例——名随批档 · 住 `docs/batches/` · 随批留存 · 不随仓套件收集；单测树重建时回迁）。
- 本批新增守卫用例（#16 面）落 `docs/batches/2026-10-03-crash-guards.test.mjs`（已落——批内件惯例）。
- 本批（proxy 逐渠独立 · 2026-10-08）批内件 = `docs/batches/2026-10-08-proxy-per-channel.test.mjs`（**已落**——拆档 ∥ 逐渠判定 ∥ 探针字段面 ∥ 文案面 ∥ 全局面 ∥ 两向导补步；T1–T8 + W1 ∥ W2 = 10/10 绿；**448 行**〔按盘实读〕）。
- 本批（代理分块解码 · 2026-10-08）批内件 = `docs/batches/2026-10-08-proxy-chunked-frame.test.mjs`（已落——用例 C1–C16；枚举落点 = 批档 `docs/batches/2026-10-08-proxy-chunked-frame.md` §2.5 ∥ §2.12 补行——以彼为准）：
  分支标签 = C1–C12 两分支共用层（`streamHttpResponse`——CONNECT ∥ 转发汇流后）∥ C13–C14 转发腿（假代理回放）∥ C16 CONNECT 腿（https 隧道回放）∥ C15 回归腿；帧序列类别 = 单块 ∥ 多块 ∥ 跨包块边界 ∥ 块扩展 ∥ trailer ∥ `0` 块终止 ∥ 畸形回退 ∥ 非分块零动 ∥ 「首字节先于 `0` 块到达」（= C8；零整包缓冲判据）。
- 无代理路径 = 原生 `fetch`——单测的唯一网络面（无真网络依赖）。

## 7. 并入的关键决策记录（含否决备选）

| # | 决策 | 理由 / 否决备选 |
|---|---|---|
| D-PX1 | `model` 走代理 = **逐渠道独立**（per-provider `proxy: true` **且** `proxy.uri` 在案 ⇒ 该渠走代理；默认关），**无全局闸**（2026-10-07 19:04 用户裁「2b」；2026-10-08 批落） | API key 经代理可见——默认不得外送（缺省不写键 ⇒ 直连）；渠道旗 = 唯一运行期判定（用户「每个 provider 单独选」口径）；否决「全局一个开关全开」∥「全局闸 + 渠级旗」双门槛（静默无效 + 与口径相抵）。`proxy.model` 键**已裁退役**（2026-10-08 裁 A——批档 §2.7 项 1） |
| D-PX2 | `web` 工具采**逐次调用参数**，config 代理不自动施加 | 固定配置会破国内站点（`gitee` / 内网直连被代理劫持）；模型按目标自选。否决「config 固定代理」 |
| D-PX3 | **TLS 默认全量校验**，自签 / MITM 代理须显式 `insecureTls` opt-in | 走代理的流量含 API key，不得在未验证链路上传输；否决默认放行 |
| D-PX4 | env 回落**仅在未配置 `proxy` 字段时**生效，且不代理 model 请求 | env 不可预期；model 代理必须显式。否决「env 也能开 model 代理」 |
| D-PX5 | 坏代理串**友好报错**（融合自 VSC） | 原生 `Invalid URL` 不解释期望形态——调用方可观测文案退化 |
| D-PX6 | CONNECT/TLS 与响应头**分开超时**（15s / 60s） | 共用 15s 会让排队 TTFB > 15s 的 provider 误报超时；否决「一个超时管全程」 |
| D-PX7 | `destroy(err)` 前挂**永久兜底 `'error'` 监听者**——单点 `destroyBody`（proxy ∥ provider 三文件复用） | 无监听者瞬间 `destroy(err)` ⇒ 未处理 `'error'` ⇒ 进程被杀（#16）；被否：位点内联（复写三份）∥ `listenerCount('error')===0` 预检（pipe 监听者计数失真）∥ 只 try/catch（捕不到异步 emit）。 |
| D-PX8 | web `ReadableStream` 断流 = **内部 abort 通道**（`IDLE_ABORT` 挂 response；`terminateBody` 分流） | 守卫对 web 流 no-op ⇒ 直连 fetch 看门狗静默失效（crash-guards U-CG-1 · 台账 #878）；**建设点 = `proxyFetch` 直连分支单点**（覆盖两条流式直连链 `readSSE` ∥ `parseGeminiStream`；proxy 两分支不挂——自有 `_bodyIdleMs`；直连面调用点收口恒走 `proxyFetch`）；被否：`ReadableStream.cancel` 面（`for-await` 锁定流上 cancel 拒 TypeError——解锁重构读循环 = 大改）∥ 给直连 fetch 加绝对墙钟（2026-09-01 已裁废——腰斩长任务；idle 语义保留）。 |
| D-PX9 | loopback 目标**永不经代理**（`localhost` ∥ `*.localhost` ∥ `127.0.0.0/8` ∥ `::1`——`isLoopbackTarget()`；`proxyFetch` 入口单点旁路） | 本地网关 / 开发服务（如 `127.0.0.1:8787` 渠道）被企业代理劫持 ⇒ 连接失败 / 403 假红（用户 2026-10-07 案）；NO_PROXY 语义——本地可达性不取决于代理运营方。 |
| D-PX10 | `proxy.mjs` **分档**：`proxy-target.mjs`（配置解析 + loopback）∥ `proxy-transport.mjs`（tunnel/传输）析出；本档留 `injectProxy` + `proxyFetch` 编排 + 兼容再出口 facade | 原档 303 行越 300 咨询线（#1037）；「先拆后改」= 本批本就触碰判定式（避免在越线档上叠加改）；facade 再出口 ⇒ 消费面 import 零改。被否：单档内联压缩注释（治标）∥ 全仓改指新档（调用面波及 ≫ 收益） |
| D-PX11 | 响应体 **chunked 剥帧在传输层单点**（`streamHttpResponse`；解码器 = `proxy-chunked.mjs`）；畸形帧**回退透传**；`content-encoding` 不处置（列册——台账 **#1067**） | 旧缺解码 ⇒ 一切走代理的请求 body 污染（帧字节 `7378\r\n{…` 直入 `text()` ⇒ 探针 `non-JSON response` ∥ SSE 事件被 CRLF+hex 打断——用户 2026-10-08 gemini 案）；判定按头（curl 同代理解得 24315B ⇒ 头在场）；被否：消费点自防（漏面）∥ 启发式嗅探（头缺席而帧在场——易误判）∥ 畸形帧报错 ∥ 截断（违协议代理从「能用」退化；截断在 SSE 面 = 静默丢尾）。 |

## 8. 不并项与历史沿革

### 8.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-cli/docs/design/PROXY.md`（CLI 产品档）——**原地保留作参照历史**（保留 ≠ 维护）。下列内容不并入本档：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| **旧档 §TLS 段第 1 句**（`thincoder-cli/docs/_archive/design/PROXY.md:32`） | 「`rejectUnauthorized: false`——**不校验目标站证书**」 | **与实装相反**——现行默认全量校验 + `insecureTls` 显式放行（§3）。旧档一字不改（B 式）；照抄即把**错误的安全承诺**写进权威层 |
| 旧档 §「配置形态」中 `web` 条目 | 「web 工具（fetch/websearch）是否走代理。每次调用时现读，即时生效」 | **与实装不符**——web 工具已改逐次调用参数（§4）；`web` 字段现行只在 Test connection 探针上活。旧档一字不改 |
| 旧档 §「配置形态」中「env 路径只影响 web 工具」括注 | env 回落的消费者描述 | 同上——env 回落现行只经 `resolveProxyConfig` / `resolveWebProxy` 生效（探针面），不作用于 web 工具 |
| 旧档档头「基于代码实际实现梳理」+ 「文档格式债清理批 A2」注 | 建档语境 / 一次性格式批注 | 批次语境——现行态已入 §1–§6 |
| 旧档 §「/config proxy 子菜单」的菜单全文 | 菜单项文本清单（与现行大体同） | 已按现状实核入 §5（含现行开关文案）；旧档文本不重复保留 |

### 8.2 不并项登记（跨板块 / 一次性材料——**不并**，逐项登记）

| 旧档面 | 内容 | 何故不并（去向 / 触发） |
|---|---|---|
| `selectModel` 落盘剥离运行时 `proxyUri` 的括注 | 一次性实现细节描述 | 实核未得对应代码（`thincoder-cli/src/tui/cmd-config.mjs:321` 的 defaultModel 保存经通用 config 写通道，无 proxy 专属剥离步）——不并（不据未实核的旧句落笔） |
| VSC 侧设计档与面板面 | VSC 树对应文档 / settings 面板代理段 | 按 P2 归 VSC 轮（本批零触碰 VSC 树） |
| 需求侧正文 | 代理字段的需求条目 | 根层承载 = `docs/core/requirements/CONFIG.md`（不新起需求档） |

## 变更记录

**2026-10-0x 批次落点指针**（本档涉批——落点表 = 各批档 §2 · 一次性材料承载面）：
**本批（crash-guards（崩溃族守卫） · 2026-10-03）落点表** = `docs/batches/2026-10-03-crash-guards.md` §2（唯一承载面——一次性批次材料）。
**本批（issue 修复批·一 · 2026-10-04）落点表** = `docs/batches/2026-10-04-issue-fix-round1.md` §2（唯一承载面——一次性批次材料）。
**本批（VSC 渠道代理语义修复 · 2026-10-07）落点表** = `docs/batches/2026-10-07-vsc-provider-proxy-fix.md` §2（唯一承载面——一次性批次材料）。
**本批（proxy 逐渠独立（去全局闸） · 2026-10-08）落点表** = `docs/batches/2026-10-08-proxy-per-channel.md` §2（唯一承载面——一次性批次材料）。
**本批（代理分块解码（chunked 剥帧） · 2026-10-08）落点表** = `docs/batches/2026-10-08-proxy-chunked-frame.md` §2（唯一承载面——一次性批次材料）。

- 2026-09-15（**S2 W10 · VSC 接线**）：§1 与 §6.1 的 VSC 对位行改述为「经核引用」——自持镜像已删（删除记录 = 批次档 `batches/2026-09-15-vsc-core-wiring.md` §5）；机制条文零改。
- 2026-09-15（**B 式迁移轮 · 第 3 批**）：建档——`thincoder-cli/docs/design/PROXY.md` 内容重建入基准层（旧档一字未改、原地作参照历史）。
  **§3 TLS 段按实装收正**（默认全量校验 + `insecureTls` 显式放行——旧档原句与实装相反，三方对照留在 §3 表）。
  **§4 消费面按实装收正**（`web` 字段对 web 工具的门控已由 2026-08-31 裁定取消，现行只活于 Test connection 探针）；坐标改写为现状路径并实核；批次材料 / 状态行 / 变更流水不并（§8）。
- 2026-10-03（**crash-guards 批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-03-crash-guards.md` §2 · 台账 #866（GitHub #16））：§2 补 **body 终止守卫**（`destroy(err)` 前挂永久兜底 `'error'` 监听者——单点 `destroyBody`（拟新增 `thincoder-core/stream-destroy.mjs`））· §6.1 补坐标行 · §7 补 **D-PX7**。**零新语义**（守卫类最小修——流式语义零变）。
- 2026-10-03（**crash-guards 批 · 设计评审轮 1 修正（fix 轮）· eng-designer**——承批档 `docs/batches/2026-10-03-crash-guards.md` §3 轮次 1 发现 1–3）：§6.2 测试面收正（代理族单测原载体随 2026-09-28 测试树全清退场——现形 = 单元测试档（批内件）；本批新增守卫用例落 `docs/batches/2026-10-03-crash-guards.test.mjs`（拟新增））· §2 body 管线两端写实（源 `sock` → 目标 body）· §6.1 消费点补 provider 两坐标（`thincoder-core/provider/sse.mjs:178` ∥ `thincoder-core/provider/google.mjs:203`）。**零新语义**（形态 ∥ 口径收正）。
- 2026-10-03（**crash-guards 批 · 实施窗回填轮 · eng-designer**——承批档 `docs/batches/2026-10-03-crash-guards.md` §5 未闭合项 1 ∥ fix 轮派单（号 1–2））：§2 ∥ §6.1 ∥ §6.2「拟新增」⇒「已落」（单点档 `thincoder-core/stream-destroy.mjs` 35 行 · 批内件 257 行——均已在盘）∥ §6.1 消费点坐标按盘收正（`thincoder-core/proxy.mjs` `:94 ⇒ :95` ∥ `:99 ⇒ :100` · `thincoder-core/provider/sse.mjs` `:178 ⇒ :179` ∥ `thincoder-core/provider/google.mjs` `:203 ⇒ :204`）∥ §2 管线两端坐标同族收正（`:76 ⇒ :77` ∥ `:124 ⇒ :125`——各档 import +1 所致）。**零新语义**（坐标 ∥ 态收正）。
- 2026-10-04（**issue 修复批·一 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-04-issue-fix-round1.md` §2 · 台账 #878）：§2 新增 **web `ReadableStream` 断流通道**（`IDLE_ABORT` + `terminateBody`——直连 fetch 看门狗恢复有效）· §6.1 坐标行扩容（`terminateBody` 入单点）· §7 补 **D-PX8**。**零新语义**（= U-CG-1 残面的修复设计导出项）。
- 2026-10-04（**issue 修复批·一 · 设计评审轮 1 修正（fix 轮）· eng-designer**——承批档 `docs/batches/2026-10-04-issue-fix-round1.md` §3 轮次 1 发现 1）：§2 断流通道段收正——**建设点下移 `proxyFetch` 直连分支单点**（`core.mjs` 请求调用点收口恒走 `proxyFetch`——覆盖两条流式直连链；proxy 两分支零触）· 统一出口行补直连分支注（`:265 ⇒ :266-275`）· §6.1 补建设点 · §7 D-PX8 理由同拍补句。**零新语义**（= 评审发现的直接导出项）。
- 2026-10-07（**VSC 渠道代理语义修复批 · 设计正式化 · eng-designer**——承批档 `docs/batches/2026-10-07-vsc-provider-proxy-fix.md` §2 · 台账 #1026）：§2 补 **loopback 旁路**语义 · §4 补例外注（loopback 永不经代理 + VSC 探针直连）· §6.1 补坐标行 ∥ 同源坐标清扫（proxy.mjs 全族 ∥ config.mjs ∥ provider 两坐标；逐条旧→新见承批档 §2 附）。**零新语义**（缺陷修复的机制收编）。
- 2026-10-07（**三端对齐批（#1027–#1035）· 收口回填 · 父侧直接执行〔可 revert〕**——承批档 `docs/batches/2026-10-07-provider-config-parity.md`）：§4 例外注「VSC 探针亦直连」收正为「**经核 `probeTargetOf` 单源（勾选随行）**」+ 坐标 `thincoder-vscode/src/extension/settings.mjs:229 ⇒ :232`。**零新语义**（= ③′ 探针收敛的表述随正）。
- 2026-10-08（**proxy 逐渠独立批（去全局闸）· 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-08-proxy-per-channel.md` §2 · 台账 #1042（并入 #1037 ∥ #1040 ∥ #1048 ∥ #1049））：§1 归一键形 `model` 段 + 去留注 ∥ §2 补拆档段（#1037）∥ §3 代价面句 ∥ §4 `model` 行 ⇒ 逐渠独立（+ VSC 第二注入点 `thincoder-vscode/src/extension/presets.mjs:134` 点名 + 探针字段面 `headers`——#1048①）∥ §5 /config 重定型待裁标记 ∥ §6.1 拆档坐标计划 ∥ §6.2 批内件指针 ∥ §7 **D-PX1 改写 + D-PX10**。**产品码零触（设计轮）**。明细 = 批档 §2。
- 2026-10-08（**代理分块解码批（chunked 剥帧）· 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-08-proxy-chunked-frame.md` §2 · 台账 #1065）：§2 补「响应体分块解码」条 ∥ §6.1 坐标行 ∥ §6.2 批内件指针 ∥ §7 **D-PX11**；变更记录补涉批指针。**产品码零触（设计轮）**。
- 2026-10-08（**proxy 逐渠独立批（去全局闸）· 设计评审轮 1 修正（fix 轮）· eng-designer**——承批档 `docs/batches/2026-10-08-proxy-per-channel.md` §3 轮次 1 发现 3 ∥ 5 ∥ 6 · 台账 #1042）：
  §4 补 **#1048① 探针字段面**注（`probeTargetOf` 携 `headers`——仅 plain-object；来源面 ∥ 消费点）∥ §1 `model` 键注与 §5 菜单行注收正——**两案映射与分项关系**标注（字面不互指；「案B」行义展开：初值来源 ∥ 落点 ∥ 词表）∥ §5 补 **#1049 落点指针**（评估毕——上抛；承载面 = 批档 §2.7 项 3）。**产品码零触（fix 轮）**。明细 = 批档 §2。
- 2026-10-08（**代理分块解码批（chunked 剥帧）· 设计评审轮 1 修正（fix 轮）· eng-designer**——承批档 `docs/batches/2026-10-08-proxy-chunked-frame.md` §3 轮次 1 发现 1–7 · 台账 #1065）：
  §2 分块条补 **行数注记**（新档 ≈70 ∥ 改动面 +~10/−4 ∥ 批内件 ≈250）∥ **汇流坐标**（`tunnelHttps` `:237` ∥ `proxyFetch` `:302`——实读佐证）∥ **管线拓扑 ∥ 错误面归口**（函数式改写；#16 契约零变）∥ 拆档句三档预估按盘重推（≈55 ∕ ≈205 ∥ ≈50）；§2 隧道条补移交坐标；
  §6.2 用例类别 ⇒ C1–C16（分支标签 + CONNECT 腿 + 首字节判据 + 枚举指针）；§3 规范面收正（标题去 revision 标记；旧句对照移出——保留 = §8.1 ∥ 变更记录）；§1 括注收窄；档头 ∥ §6.1 锚改述（基准实核日 + 逐行 as-of）。**产品码零触（fix 轮）**。
- 2026-10-08（**proxy 逐渠独立批（去全局闸）· 设计评审轮 2 修正（fix 轮）· eng-designer**——承批档 `docs/batches/2026-10-08-proxy-per-channel.md` §3 轮次 2 发现 2 ∥ 8 · 台账 #1042）：§2 同族收窄指针重锚（`PROVIDER.md:102 ⇒ :114`）∥ §4 首行开关列改述（「`model`（逐渠）」⇒「模型请求（逐渠 `providers[].proxy`）」——运行期开关实指）。**产品码零触（fix 轮）**。明细 = 批档 §2。
- 2026-10-08（**三处裸名收形 · 父侧直接执行〔机械 · 可 revert〕**——文档卫生批析出面残项清理）：§4 消费列与变更记录两处的三枚短形名（generate-title ∥ settings ∥ presets 各一枚）⇒ 全路径补全（`thincoder-core/generate-title.mjs:115` ∥ `thincoder-vscode/src/extension/settings.mjs:229 ⇒ :232` ∥ `thincoder-vscode/src/extension/presets.mjs:134`）；generate-title 同名双档歧义实核（VSC 同名档零 `proxyUri`）。**零语义**（引用形收正）。
- 2026-10-08（**proxy 逐渠独立批（去全局闸）· 实施轮设计面回填（fix 轮）· eng-designer**——承批档 `docs/batches/2026-10-08-proxy-per-channel.md` §5 报表项 1 · 台账 #1042 ∥ #1037）：拆档坐标按实施后现盘重锚——§2 五处邻域 + §6.1 表 + 同族旧单档引用随正（`tunnelHttps` `:162` ∥ `streamHttpResponse` 移交 `:201` ∥ `tcpConnectProxy` `:212` ∥ `proxyFetch` `:33` ∥ `isLoopbackTarget` `:44` ∥ 旁路 `:35` ∥ 错误位 `:171`/`:219` ∥ body `:43` ∥ `sock.pipe` `:105` ∥ TLS `:196` ∥ 注释 `:156-157`/`:195`）∥ 三档按盘实读 54 ∥ 241 ∥ 50（`proxy-transport.mjs` 含同窗 #1065 集成）∥ §2 例外注断行（396 ⇒ ≤300）。**产品码零触（fix 轮）· 零新语义**（坐标 ∥ 行数 ∥ 断行）。明细 = 批档 §2.14。
- 2026-10-08（**代理分块解码批（chunked 剥帧）· 实施轮设计面回填（fix 轮）· eng-designer**——承批档 `docs/batches/2026-10-08-proxy-chunked-frame.md` §5.4 回填材料 · 台账 #1065）：实施后按盘回填——§6.1 ∥ §6.2「拟落」⇒「已落」（解码器 **102 行**；批内件 **301 行**）∥ 行数按盘（`proxy-transport.mjs` **245**——219 ⇒ 245）∥ **同因残锚扫正 18 处**（#1065 集成位移 ∥ 融合位残留；逐条 = 批档 §2.13）∥ §7 **D-PX11** 列册指针（台账 **#1067**）∥ §2 补**数值门**（畸形帧枚举）∥ **写门**（管线句）。**产品码零触（回填轮）· 零新语义**（坐标 ∥ 态 ∥ 行数收正）。
- 2026-10-08（**proxy 逐渠独立批（去全局闸）· A/B 三点裁定落定（fix 轮）· eng-designer**——承批档 `docs/batches/2026-10-08-proxy-per-channel.md` §2.15 · 用户 2026-10-08 三点裁（项1 = A ∥ 项2 = 形A ∥ 项3 = 补步）· 台账 #1042 ∥ #1049 ∥ #1037）：**待裁注解除**——§1 `model` 键注 ⇒ 定案单形 A（键退役；施行已落）∥ 归一句去 `model` 支 ∥ §5 菜单块 Model requests 行删（删行形）∥ `proxySummary` 条收述（去 `model` 段 ∥ 消费坐标按盘）∥ §7 D-PX1 尾注收述。**§5 #1049 补步设计落法**（两向导定位 ∥ 问句形 ≡ add 流 ∥ 旗写入点 ∥ 验收面——实施 = 产品腿另轮）。**零新语义**（= 裁定直接导出项）。明细 = 批档 §2.15。
- 2026-10-08（**proxy 逐渠独立批（去全局闸）· as-built 回填轮（fix 轮）· eng-designer**——承批档 `docs/batches/2026-10-08-proxy-per-channel.md` §5 各腿报表（产品 ∥ 测试 ∥ A 案 ∥ 测试补全 ∥ #1049 补步）· 台账 #1042 ∥ #1049）：§5 #1049 条「实施 = 产品腿另轮」⇒ **已落**（两向导坐标 ∥ TUI 装配注入点 `thincoder-cli/src/tui/index.mjs:196`）∥ 补**重配语义**（答 No ∥ Esc 零写——upsert 保留既有旗；2026-10-08 父裁〔a〕）∥ §6.2 批内件「拟落」⇒「已落」（448 行——T1–T8 + W1 ∥ W2；10/10 绿）。**零新语义**（= 各腿报表 ∥ 父裁的直接导出项）；产品码零触（回填轮）。明细 = 批档 §2.4。
- 2026-10-08（**代码长度上限 500/800 口径更换批 · 候窗② 清账轮 · eng-designer**——承批档 `docs/batches/2026-10-08-code-limit-500-800.md` §2 · 台账 #1072）：§2 三档合规标注随口径（`≤300 咨询线` ⇒ `≤500 咨询线`）∥ §2 行数注记残句删（`越 ≤300 咨询线 1 行——批内件不计线（豁免在案）`——301 行 ≤500 ⇒ 越线/豁免前提消失，读数留守）。**零新语义**（线值随口径 ∥ 失效残句删——D8）；产品码零触。明细 = 批档 §2（清账轮块）。
- 2026-10-09（**server 代理批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-09-server-gemini-openai-preset.md` §2 · 台账 #1129；用户 13:5x 令）：§4 增 server 上游链消费行（逐渠镜像——无全局闸）∥ §6.1 增 server 对位实现行（自持 `thincoder-server/src/gateway/proxy.mjs`——零第三方）。**零语义改**（= server 面登记的成文；机制全文 = server 档 `docs/server/design/gateway/API.md` §6 KD-SV-55——本档不复制）。
