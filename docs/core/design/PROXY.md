# 代理出口（PROXY）· 网络出口板块

> 板块 = **网络出口（代理）**——配置形态 · 传输实现 · TLS 校验 · 消费面。实现 = `thincoder-core/proxy.mjs`。
> 地图与相邻权威 = `docs/core/design/CONFIG.md`；provider 面 = `docs/core/design/PROVIDER.md`（本档不复制，D2）。
> 双端：CLI 用核内 `thincoder-core/proxy.mjs`（取 CLI 的 abort 来源标注 + VSC 的坏代理串友好报错——见 `CONFIG.md` 融合表 `proxy.mjs` 行）；VSC 侧经 `@thincoder/core/proxy.mjs` 引用。
> 需求侧 = `docs/core/requirements/CONFIG.md`（代理字段面承载）。

## 1. 定位与配置形态

配置文件 `~/.thincoder/config.json` 的 `proxy` 字段；TUI 入口 = `/config` → Proxy 子菜单（§5）。

```json
{ "proxy": { "uri": "http://127.0.0.1:7890", "web": true } }
```

- `uri`：http 代理地址（`url` 字段名也兼容）——**代理目标本体（非门槛）**；全仓单一 `proxy.uri`。旧格式 `"proxy": "http://..."`（裸字符串）兼容，等价于 `web: true`。
- `model` 键：**已退役**。运行期判定不读该键（逐渠独立——§4）；载入归一恒收窄为 `{ uri, web }`。
- 归一化：`thincoder-core/config-normalize.mjs:78`（`normalizeProxy`）→ `{ uri, web }` 或 `undefined`；加载时调用点 `thincoder-core/config.mjs:287`。缺省 `web: true`；无 uri / uri 非字符串 / 非对象类型（数字 / 数组等）一律**丢弃**。
- `injectProxy` 判定同源同函数：`normalizeProxy(config?.proxy)?.uri ?? null`——`""` ∥ 空对象 ∥ 非法型 ⇒ 零注入
  （`!= null` 过闸后的 env 回供理论口封死——模型代理永不吃 env，D-PX4 判据加强）。
- `web` 与**逐渠代理**（渠道条目 `providers[].proxy`）的**现行消费面**见 §4。
- 环境回落：`HTTPS_PROXY` / `HTTP_PROXY` / `ALL_PROXY`——**仅在未配置 `proxy` 字段时生效**（`resolveProxyConfig` `thincoder-core/proxy-target.mjs`），且该路径不供模型代理（逐渠旗只对在案 `uri` 生效）。

## 2. 传输实现（`thincoder-core/proxy-transport.mjs` ∥ `thincoder-core/proxy.mjs`）

- **`https://` 目标**：HTTP CONNECT 隧道（`tunnelHttps`，`thincoder-core/proxy-transport.mjs:219`）——连代理发 `CONNECT host:port`，隧道上建 TLS，隧道建立后移交 `streamHttpResponse`（`:258`），再发请求。响应头到齐即返回，body 为**流式**（SSE 边收边吐；abort 全阶段可中断）。
- **`http://` 目标**：经典代理转发（`tcpConnectProxy` `thincoder-core/proxy-transport.mjs:269` + `streamHttpResponse(..., absoluteForm=true)`）——TCP 直连代理，请求行发**绝对 URI**。非标准绝对 URI 实现的代理（极少见）不支持。
- **无代理 / 未命中**：原生 `fetch` 直连（`proxyFetch` `thincoder-core/proxy.mjs:36`）。
- 统一出口 `proxyFetch(url, opts, proxyUri)`（`:36`–`:53`）：无 `proxyUri` → `globalThis.fetch`（**直连分支 = 断流通道建设点**——见下）；`https:` → 隧道；`http:` → 转发。
- **loopback 旁路**：目标为 loopback（`localhost` ∥ `*.localhost` ∥ `127.0.0.0/8` ∥ `::1`——判定 `isLoopbackTarget()` `thincoder-core/proxy-target.mjs:44`；含尾点 ∥ IPv6 括号归一）时，即便在案代理串也**一律直连**
  （`proxyFetch` 入口旁路 `thincoder-core/proxy.mjs:38`；NO_PROXY 语义）。本地网关 / 开发服务（如 `127.0.0.1:8787` 渠道）被塞进企业代理 ⇒ 连接失败 / 403 假红。
- **三档形态**：`thincoder-core/proxy-target.mjs`（`resolveProxyConfig` ∥ `resolveWebProxy` ∥ `isLoopbackTarget`：目标 ∥ 配置解析面）·
  `thincoder-core/proxy-transport.mjs`（`streamHttpResponse` ∥ `tunnelHttps` ∥ `tcpConnectProxy` + `FETCH_TIMEOUT`：传输面）· `proxy.mjs`（留 `injectProxy` + `proxyFetch` 编排 + 兼容再出口 facade——**消费面 import 零改**）。
  三档 = `proxy-target.mjs` ∥ `proxy-transport.mjs` ∥ `proxy.mjs`（≤500 软线）。
- 错误形态：坏代理串**友好报错**（`Invalid proxy URI: "…" — expected http://host:port`，`thincoder-core/proxy-transport.mjs:228` / `:276`）。
- 超时语义：CONNECT/TLS 阶段用 `FETCH_TIMEOUT`（15s）；**响应头**用 `opts._headerTimeoutMs`（默认 60s——消费面 = **代理分支**；直连面（无 `proxyUri`）无本仓头阶段超时〔纳入 = 设计轮面——在册；同族收窄 = `PROVIDER.md:114`（§6.3）〕）；**body 阶段一个窗**：`opts._bodyIdleMs`（默认 120s，首字节之前与之后同一个窗；该面分首 chunk 窗不在本期——另批，边界与事实面见 `docs/core/design/TIMEOUT-DIGEST.md` §7 ∥ §8）。
- **响应体分块解码**：响应携 `Transfer-Encoding: chunked` 时，传输层按块长帧**剥帧解码**后入 body
  （单点 = `streamHttpResponse`——https 隧道 ∥ http 转发两条代理分支共用：汇流坐标 = `tunnelHttps` `thincoder-core/proxy-transport.mjs:258` ∥ `proxyFetch` `thincoder-core/proxy.mjs:52` 均移交本函数；解码器 = `thincoder-core/proxy-chunked.mjs`）。**流式保形**：边收边吐、只保有帧头（块长行），零整包缓冲

  ——SSE 面 `data:` 行与事件流不受帧字节干扰；终止 = `0` 块（其后 trailer ∥ 余字节读取即弃，body 随 0 块结束）；`Connection: close` 语义不变。

  **畸形帧回退 = 透传**（块长行非十六进制 ∥ 块长数值越界（非安全整数）∥ 块尾非 CRLF ⇒ 停解码、余字节原样吐——不报错、不截断）；判定按 `Transfer-Encoding` 末段 token（大小写不敏感），**头缺席而帧在场（协议违规）不解码**。

  **管线拓扑**：解码器居源 `sock` 与目标 body 之间、**函数式改写**（body 本体零替换——chunked 径 `sock.on('data')` ⇒ `decoder.push(d)` ⇒ `onData` ⇒ **推入 body 前最后一级可写流**（带 CE = 解压器，否则 = body；经写门 `!destroyed && !writableEnded`——终止后解码器余出不再入 body，与非 chunked 径 `pipe` 自摘语义齐）；非 chunked 无 CE 径 `sock.pipe(body)` 不变（带 CE ⇒ 推送分支接解压器）。）

  **错误面归口（契约零变）**：解码器 = 纯状态机、无自有 `'error'` 面（畸形帧回退透传——不 emit）；body 终止守卫族（`destroyBody` ∥ `_bodyIdleMs` 看门狗 ∥ `terminateBody`）照旧对 body 单点直作、不经解码器；`sock` 级错误沿现径（`thincoder-core/proxy-transport.mjs:194-197` ⇒ `fail` ⇒ `destroyBody`）。
- **响应体内容编码解压**：TE 剥帧后接**解压阶段**（单 token 且已列编码——gzip ∥ x-gzip ⇒ gunzip ∥ deflate ⇒ inflate ∥ br ⇒ brotli；`node:zlib`；`deflate` = RFC1950 zlib 包裹形，非合规裸形（RFC1951）不支持 ⇒ 走明错误径、不透传）。
  `identity` ∥ 头缺席 ∥ 未知编码 ∥ 多 token 列表 ⇒ **透传零动**；**不发 `Accept-Encoding`**（请求头零改——上游自发压缩才走本阶段，请求面语义不变）。

  零输入（空体 + CE 在场）⇒ 不解压（sawInput 门——零误报：空 gunzip 结束会抛 `unexpected end of file`）；**解压失败 ⇒ body 以明错误终止**

  （部分解码已发生——无「原字节」可回退；错误形 = `Response body decompression failed (content-encoding: …)`）。落点 = `streamHttpResponse`（`thincoder-core/proxy-transport.mjs:128-139`；chunked ∥ 非 chunked 两径同点）；解压器 ⇒ body 走 `pipe`（自带背压）。
- **chunked 径背压传播 + 停止门**：暂停级 = **body 前最后一级可写流**（带 CE = 解压器 ∥ 无 CE = body；`thincoder-core/proxy-transport.mjs:90-98` `pushDownstream`）
  ——`write()` 返 false ⇒ 暂停上游源 `sock`（推送分支 `:144` ∥ `:149`），排空 ⇒ 恢复（背压旗幂等；带 CE 时恢复信号在解压器 `'drain'`、无 CE 时在 body `'drain'`）。

  **看门狗复位源扩 `drain`**（`:161`——排空 = 消费进度信号，防「暂停期无数据到达 ⇒ 误杀慢而健康的消费者」）；消费方永停摆 ⇒ 照旧 `bodyIdleMs` 断流。

  **停止门**（`:170-173`——评审 F3）：body 终止（watchdog ∥ abort ∥ 消费方 destroy）时上游仍在暂停态 ⇒ `resume()` + `destroy()` 源（被暂停的 sock 不因 body 消亡自行关闭——悬挂口闭合）。

  与非 chunked 径 `pipe` 语义对齐（pipe 自带 pause/drain）；非 chunked 无 CE 径零动。
- **body 终止守卫（崩溃族）**：body = 响应体 `PassThrough`（管线两端 = 源 `sock`（net socket）→ 目标 body；body 建于 `thincoder-core/proxy-transport.mjs:50`；头到齐后写入 = 非 chunked 无 CE 径 `:153` `sock.pipe(body)` ∥ chunked 径经解码器逐段推入（带 CE = 解压器）——body 本体零替换）
  ——头后失败 ∥ body 空闲看门狗以 `destroy(err)` 终止 body **前**，先挂**永久** no-op `'error'` 监听者

  （单点 `destroyBody(body, err)`——`thincoder-core/stream-destroy.mjs`（已落；proxy ∥ provider 三文件共用）；契约与理由 = §7 D-PX7）。

  无监听者瞬间的 `destroy(err)`（含 pipe 内部监听者触发即自摘后的重发）产生未处理 `'error'` ⇒ `uncaughtException` ⇒ **整个进程被杀**。

  **消费面语义零变**：在场 ∥ 迟到 `for-await` 消费者仍收原错误；`stream.errored` 保留原错误对象。

  **web `ReadableStream` 断流通道**：直连 fetch 路径 body = web `ReadableStream`（无 `destroy`）⇒ 断流经**内部 abort 通道**：

  **建设点 = `proxyFetch` 直连分支单点**（无 `proxyUri` 分支：建 `AbortController`、signal 合成 `AbortSignal.any([opts.signal, ctrl.signal])`、经 `IDLE_ABORT` symbol 挂 response；provider 请求出口拓扑 = proxy 两分支唯经 `proxyFetch`、直连面调用点收口恒走 `proxyFetch` ⇒ 单点覆盖两条流式直连链）；

  单点 `terminateBody(response, err)` 对挂有该通道者走 `controller.abort(err)`（fetch body 随之中止——读侧看门狗对直连路径有效）；无通道且非 destroy 形态才 no-op（`destroyBody` 原契约不变）。proxy 路径不变（自有 `_bodyIdleMs` + 可 destroy body）。

## 3. TLS 证书校验

**现行语义**：CONNECT 隧道内的 TLS 握手**默认全量证书校验**；仅当显式传 `opts.insecureTls === true` 才放行。

```js
// thincoder-core/proxy-transport.mjs:253
const tlsSock = tlsConnect({ socket: sock, servername: target.hostname, rejectUnauthorized: opts?.insecureTls !== true })
```

| 面 | 内容 |
|---|---|
| **实装事实** | `thincoder-core/proxy-transport.mjs:253`：`rejectUnauthorized: opts?.insecureTls !== true` ⇒ **默认 true（全量校验）**；`:213`–`:214` 与 `:252` 注释逐字：「TLS 默认全量证书校验（rejectUnauthorized: true）——走代理的流量（含 API key）不得在未验证链路上传输；确需自签 / 内网代理时 opts.insecureTls=true 显式放行」。 |
| **新档写法** | **默认校验**；自签 / 企业 MITM 代理须**显式 opt-in**。 |

- **opt-in 通道**：`insecureTls` 目前**无 config / UI 入口**（实核：全仓仅 `thincoder-core/proxy.mjs` 三处出现，无调用方注入）——它是 `opts` 层契约，为测试与将来接入保留。
- **代价面（现行）**：经代理的 HTTPS 流量对**代理运营方**可见（CONNECT 隧道终止于代理）；若显式放行 `insecureTls`，则失去对「代理 ↔ 目标站」中间人攻击的检出。**敏感 API key 会随请求经过代理**——因此模型请求走代理 = **逐渠道显式开启**（`providers[].proxy`——默认关；§4）。web 工具只拉公开网页，风险面较小。
- 直连路径（无代理）不受本机制影响（走原生 `fetch` 的默认校验）。

## 4. 消费面（谁走代理）

| 开关 | 现行语义 | 落点 |
|---|---|---|
| 模型请求（逐渠 `providers[].proxy`） | **逐渠道独立才生效**——per-provider `proxy: true` **且** `proxy.uri` 在案 ⇒ 该渠模型请求经代理；渠道旗缺席 ⇒ 直连（**无全局闸**）。`uri` = 代理目标本体（非门槛）。注入点 = **二**：① `injectProxy`（CLI ∥ 桌面经核装配；判定式 = 逐渠旗 ∧ `uri`）② VSC `providerFromConfig`（`thincoder-vscode/src/extension/presets.mjs:134`——VSC 运行期自建 provider 自身注入点） | 注入 ① `thincoder-core/proxy.mjs`（`injectProxy`——拆档后仍住本档）· 调用 `thincoder-core/agent/assemble.mjs:71` ∥ `thincoder-cli/src/tui/cmd-config.mjs:45`（`/config` 保存重载）· ② `thincoder-vscode/src/extension/presets.mjs:134` · 消费 `provider.proxyUri`：`thincoder-core/provider/core.mjs:399` ∥ `provider/list-models.mjs:32` ∥ `thincoder-core/generate-title.mjs:115` ∥ `provider/anthropic.mjs:104` ∥ `provider/google.mjs:127` ∥ `provider/responses.mjs:249/:268/:286` |
| `web` | **不再自动应用到 web 工具**：`fetch` / `websearch` 采**逐次调用**的 `proxy` 工具参数（`args.proxy`），config 的代理**不自动施加**。`web` 字段现行唯一活消费面 = `/config` 的 **Test connection** 探针 | 工具面 `thincoder-core/tools/web.mjs:96` · `:104`–`:106` · `:188` · `:197`–`:198`；探针 `resolveWebProxy`（`thincoder-core/proxy-target.mjs`）· 调用 `thincoder-cli/src/tui/cmd-config-menus.mjs:58` |
| **server 上游链（探针 ∥ chat 转发）** | **逐渠独立镜像（同首行语义）**——条目 `proxy: true` ∧ `uri` 在案 ⇒ 该渠上游请求（chat 转发 ∥ 模型发现）经代理；缺省 ∥ 无 uri ⇒ 直连（**无全局闸**——镜像 D-PX1）；loopback 旁路照旧。实现 = server 树**自持**（零第三方——不 import 核件：KD-SV-2）；机制全文 = `docs/server/design/gateway/API.md` §6 KD-SV-55 | server 侧自持实现 |

> `web` 字段仍可写、仍可在 `/config` 切换（`thincoder-cli/src/tui/cmd-config-menus.mjs:50`），但其对 web 工具的门控已取消——**字段语义与菜单标签存在落差**。

> 例外：**loopback 目标永不经代理**——`localhost` ∥ `*.localhost` ∥ `127.0.0.0/8` ∥ `::1` 命中即直连（核内 `proxyFetch` 入口旁路——见 §2）；VSC 添加渠道表单的 Test connection 探针**经核 `probeTargetOf` 单源**
> （表单「走 proxy」勾选随行——勾 ⇒ 逐渠判定（`proxy: true` ∧ `uri`）∧ loopback 旁路照旧；未勾 ∥ 缺省 ⇒ 直连，与运行期缺省一致；不取全局 `web` 旗——`thincoder-vscode/src/extension/settings.mjs:232`）。

> 探针字段面：探针目标构造单源 `probeTargetOf`（`thincoder-core/provider-flows.mjs:79-90`）目标形**携 `headers`**（仅 plain-object 才携；缺 ∥ 非法 ⇒ 零键——同 `apiKey` 归一律）；
> 来源面 = 盘上条目（准入 ∥ 拉取探针取落盘条目——自带 `headers` 随行）∥ 表单（VSC 添加表单探针——表单无 `headers` 录入位 ⇒ 该径零键）；消费点 = `list-models` 各 format 分支请求头展开（`thincoder-core/provider/list-models.mjs:61` ∥ `:66` ∥ `:82`）。

> 配置写径归一：`proxy` 形 = **两键**（`{ uri, web }`）——`model` 键**零回读零保留**；CLI 写径 `seturi` **写即归一**
> （`raw.proxy = { uri: newUri, web: … }`——两键重建，不「原样保留」旧对象 ⇒ 残键随一次写清零 · `thincoder-cli/src/tui/cmd-config-menus.mjs:45-47`）∥ `toggleweb` 在归一态两键上翻转（`cmd-config-menus.mjs:52`）∥ `clear` 整键删（`cmd-config-menus.mjs:72`）；桌面 ∥ 种子同两键
> （投影 = `thincoder-desktop/renderer/views/settings.mjs` ∥ 种子 = `thincoder-desktop/renderer/store.mjs`——单源 = `docs/desktop/design/SETTINGS.md` §2.20）。归一语义本体单源 = 核 `normalizeProxy`（`thincoder-core/config-normalize.mjs:78`——§6.1 行）；菜单与保存链 = §5。

## 5. `/config` Proxy 子菜单与保存链

```
Set proxy URI…                                 空输入不改动；旧 string 形态自动升级为规范对象
Web tools (fetch/websearch): ON|OFF            即时保存即时生效
Test connection                                经当前生效配置请求 generate_204（5s 超时）
Clear proxy
```

- 落点：`thincoder-cli/src/tui/cmd-config-menus.mjs:22`（`createProxyMenu`）· 菜单项 `:28`–`:34`。
- **保存链**：`saveProxy` → `reloadConfig`（`loadConfig` → `injectProxy` → 恢复运行时 provider 选择）——`thincoder-cli/src/tui/cmd-config.mjs:41`–`:75`（`reloadConfig`）· `:83`–`:88`（`saveProxy`）。
- 菜单开关必须先有 `uri`（未设置时提示 `Proxy URI not set — use Set proxy URI… first`，`:142`）。
- 主菜单摘要行 `proxySummary()`（`cmd-config.mjs:16`；消费 `:125` ∥ `:142` ∥ `:170`）——形 = `uri web:on|off`。
- **CLI 两向导「走 proxy」问句（设计落法）**：两向导 = `thincoder-cli/src/cli/setup-wizard.mjs`（首配——入口 `thincoder-cli/src/command-interactive.mjs:56` ∥ `thincoder-cli/src/cli/distill-command.mjs:44` ∥ `thincoder-cli/src/acp/login.mjs:19`）∥
  `thincoder-cli/src/tui/wizard.mjs`（TUI 首启——`thincoder-cli/src/tui/index.mjs:194` 装配 ∥ `thincoder-cli/src/tui/startup.mjs:238` 触发）；皆在 provider-admin 四流之外。

  **问句形 ≡ add 流既有问句**（`thincoder-cli/src/tui/provider-admin.mjs:74` ∥ `:102` 同形）：正文 `Route this provider's model requests through the proxy` ∥ 两选项 No (direct) / Yes (proxy) ∥ 缺省 No；答 Yes ⇒ 条目 `proxy: true`，No ∥ 缺省 ⇒ 零 `proxy` 键（渠道条目照落）。

  **位置** = 向导末问（全部输入步后、落盘 ∥ 流尾探针前）；**载体各随该档既有输入形**（零新机制）——TUI 向导 = `showPicker` 同形调用（`thincoder-cli/src/tui/wizard.mjs` `finishWizard` 落盘前；经 ctx 注入——`thincoder-cli/src/tui/index.mjs` 装配处随 `openModelPicker` 先例）∥ 首配向导 = 该档既有 readline `ask`（y/N；该档唯一输入机制）。

  **写入点 = 新渠条目 `proxy` 字段**（随各自落盘一次写；探针条目携答案——探针 ≡ 写后运行态）；**重配语义**（父裁〔a〕）：既有渠重配 = **upsert 保留**——答 No ∥ Esc 均零写，不清既有旗；渠级旗写入径配套已齐（形A 删行 + 两向导问句）——零新增债登记。

  **验收/用例** = 单元测试档增量用例（两向导双案：答 Yes ⇒ 盘上 `proxy: true` ∥ No ∥ 缺省 ⇒ 零 `proxy` 键——首配向导假 HOME 子进程实跑（沿 T5 驱动器先例）∥ TUI 向导 mock ctx 行为用例）——**已落：W1 ∥ W2**。

  **实施 = 已落**：首配向导 `thincoder-cli/src/cli/setup-wizard.mjs` ∥ TUI 向导 `thincoder-cli/src/tui/wizard.mjs` ∥ 装配注入 `thincoder-cli/src/tui/index.mjs`。

## 6. 机制面

### 6.1 实现坐标

| 面 | 落点 | 实核 |
|---|---|---|
| 配置归一化 | `thincoder-core/config-normalize.mjs:78`（`normalizeProxy`）· 调用 `thincoder-core/config.mjs:287` | 在位 |
| 代理解析（含 env 回落） | `thincoder-core/proxy-target.mjs`（现位 `:17-31` ∥ `:34-37`） | 在位 |
| model 注入（逐渠判定） | `thincoder-core/proxy.mjs`（`injectProxy`——判定式 = 逐渠旗 ∧ `uri`，归一化单源 `normalizeProxy`；现位 `:22-27`） | 在位 |
| TLS 校验判定 | `thincoder-core/proxy-transport.mjs`（`tunnelHttps` 内——现位 `:253`） | 默认全量校验 |
| CONNECT 隧道 | `thincoder-core/proxy-transport.mjs`（`tunnelHttps`——现位 `:219`） | 在位 |
| 经典转发 / 流式响应 | `thincoder-core/proxy-transport.mjs`（`tcpConnectProxy` ∥ `streamHttpResponse`——现位 `:269` ∥ `:41`） | 在位 |
| 响应体分块解码 | `thincoder-core/proxy-chunked.mjs`（解码器 `createChunkedDecoder`）· 单点 = `thincoder-core/proxy-transport.mjs` `streamHttpResponse` | 已落 |
| 内容编码解压 | `thincoder-core/proxy-transport.mjs`（`streamHttpResponse` 内——TE 剥帧后接，现位 `:128-139`；chunked ∥ 非 chunked 两径同点） | 已落 |
| 背压传播 + 停止门 | `thincoder-core/proxy-transport.mjs`（`pushDownstream` ∥ 推送分支 ∥ 看门狗复位 ∥ 停止门——现位 `:90-98` ∥ `:144` ∥ `:161` ∥ `:170-173`） | 已落 |
| 统一出口 | `thincoder-core/proxy.mjs`（`proxyFetch` 编排——直连分支 = 断流通道建设点；现位 `:36-53`） | 在位 |
| loopback 旁路 | `thincoder-core/proxy-target.mjs`（`isLoopbackTarget`——现位 `:44`）· 旁路点 = `proxy.mjs` `proxyFetch` 入口（现位 `:38`） | 在位 |
| web 工具代理参数 | `thincoder-core/tools/web.mjs:96` · `:188` | 逐次调用参数 |
| TUI 子菜单 | `thincoder-cli/src/tui/cmd-config-menus.mjs:22`–`:79` | 在位 |
| VSC 对位实现 | 经 `@thincoder/core/proxy.mjs` 引用 · 配置面 = 核 `config-io.mjs` 引用 · **运行期注入点 = `thincoder-vscode/src/extension/presets.mjs:134`（`providerFromConfig`——逐渠判定）** | 同实现 |
| body 终止守卫 | `thincoder-core/stream-destroy.mjs`（已落——单点 `destroyBody` ∥ `terminateBody`（web 流 abort 通道）+ `IDLE_ABORT`）· **abort 通道建设点 = `thincoder-core/proxy.mjs` 直连分支（`proxyFetch`）** · 消费点 `thincoder-core/proxy-transport.mjs:71` ∥ `:102` ∥ `thincoder-core/provider/sse.mjs:207` ∥ `thincoder-core/provider/google.mjs:219` | 已落位 |
| server 对位实现 | `thincoder-server/src/gateway/proxy.mjs`（自持——`proxyFetch` fetch-like：loopback 旁路 ∥ CONNECT 隧道 ∥ 经典转发 ∥ 超时族；node:http/https 内建 + 自建 CONNECT——std） | 逐渠判定镜像（D-PX1）；机制全文 = `docs/server/design/gateway/API.md` §6 KD-SV-55 |

### 6.2 测试

- 代理族单元测试（CONNECT 隧道 / 配置解析 / `normalizeProxy` / 坏代理串报错 / provider 头注入）：现盘 CLI 测试树（`thincoder-cli/test/`）= `run.mjs` ∕ `slow.mjs` + smoke 三枚，零 `.test.mjs`。
- 现形 = 单元测试档（沿单元测试档惯例——名随批 · 随批留存 · 不随集成测试树收集）。
- 守卫用例（body 终止族）落单元测试档（已落——沿单元测试档惯例）。
- （逐渠独立）单元测试档（**已落**——拆档 ∥ 逐渠判定 ∥ 探针字段面 ∥ 文案面 ∥ 全局面 ∥ 两向导补步；T1–T8 + W1 ∥ W2 = 10/10 绿）。
- （代理分块解码）单元测试档（已落——用例 C1–C16）:
  分支标签 = C1–C12 两分支共用层（`streamHttpResponse`——CONNECT ∥ 转发汇流后）∥ C13–C14 转发用例（假代理回放）∥ C16 CONNECT 用例（https 隧道回放）∥ C15 回归用例；帧序列类别 = 单块 ∥ 多块 ∥ 跨包块边界 ∥ 块扩展 ∥ trailer ∥ `0` 块终止 ∥ 畸形回退 ∥ 非分块零动 ∥ 「首字节先于 `0` 块到达」（= C8；零整包缓冲判据）。
- 无代理路径 = 原生 `fetch`——单元测试的唯一网络面（无真网络依赖）。

## 7. 关键决策记录

| # | 决策 | 理由 |
|---|---|---|
| D-PX1 | `model` 走代理 = **逐渠道独立**（per-provider `proxy: true` **且** `proxy.uri` 在案 ⇒ 该渠走代理；默认关），**无全局闸**（用户裁「2b」） | API key 经代理可见——默认不得外送（缺省不写键 ⇒ 直连）；渠道旗 = 唯一运行期判定（用户「每个 provider 单独选」口径）。`proxy.model` 键**已裁退役** |
| D-PX2 | `web` 工具采**逐次调用参数**，config 代理不自动施加 | 固定配置会破国内站点（`gitee` / 内网直连被代理劫持）；模型按目标自选 |
| D-PX3 | **TLS 默认全量校验**，自签 / MITM 代理须显式 `insecureTls` opt-in | 走代理的流量含 API key，不得在未验证链路上传输 |
| D-PX4 | env 回落**仅在未配置 `proxy` 字段时**生效，且不代理 model 请求 | env 不可预期；model 代理必须显式 |
| D-PX5 | 坏代理串**友好报错**（融合自 VSC） | 原生 `Invalid URL` 不解释期望形态——调用方可观测文案退化 |
| D-PX6 | CONNECT/TLS 与响应头**分开超时**（15s / 60s） | 共用 15s 会让排队 TTFB > 15s 的 provider 误报超时 |
| D-PX7 | `destroy(err)` 前挂**永久兜底 `'error'` 监听者**——单点 `destroyBody`（proxy ∥ provider 三文件复用） | 无监听者瞬间 `destroy(err)` ⇒ 未处理 `'error'` ⇒ 进程被杀 |
| D-PX8 | web `ReadableStream` 断流 = **内部 abort 通道**（`IDLE_ABORT` 挂 response；`terminateBody` 分流） | 守卫对 web 流 no-op ⇒ 直连 fetch 看门狗静默失效（crash-guards U-CG-1）；**建设点 = `proxyFetch` 直连分支单点**（覆盖两条流式直连链 `readSSE` ∥ `parseGeminiStream`；proxy 两分支不挂——自有 `_bodyIdleMs`；直连面调用点收口恒走 `proxyFetch`） |
| D-PX9 | loopback 目标**永不经代理**（`localhost` ∥ `*.localhost` ∥ `127.0.0.0/8` ∥ `::1`——`isLoopbackTarget()`；`proxyFetch` 入口单点旁路） | 本地网关 / 开发服务（如 `127.0.0.1:8787` 渠道）被企业代理劫持 ⇒ 连接失败 / 403 假红；NO_PROXY 语义——本地可达性不取决于代理运营方。 |
| D-PX10 | `proxy.mjs` **分档**：`proxy-target.mjs`（配置解析 + loopback）∥ `proxy-transport.mjs`（tunnel/传输）析出；本档留 `injectProxy` + `proxyFetch` 编排 + 兼容再出口 facade | 三档分单责；facade 再出口 ⇒ 消费面 import 零改 |
| D-PX11 | 响应体 **chunked 剥帧在传输层单点**（`streamHttpResponse`；解码器 = `proxy-chunked.mjs`）；畸形帧**回退透传**；`content-encoding` 列册转**已处置**（⇒ D-PX12） | 帧字节 `7378\r\n{…` 直入 `text()` ⇒ 探针 `non-JSON response` ∥ SSE 事件被 CRLF+hex 打断（须剥帧）；判定按头 |
| D-PX12 | 响应体 **`content-encoding` 解压单点**（`streamHttpResponse`——TE 剥帧后接，chunked ∥ 非 chunked 两径同点）：单 token 已知编码 ⇒ 解压（gzip ∥ x-gzip ⇒ gunzip ∥ deflate ⇒ inflate ∥ br ⇒ brotli）；`identity` ∥ 头缺席 ∥ 未知 ∥ 多 token 列表 ⇒ 透传；**零输入（空体）不解压**（sawInput 门）；解压失败 ⇒ body 明错误终止；**不发 `Accept-Encoding`** | 上游自发压缩（未请仍压缩）⇒ 消费面得明文（探针 JSON.parse 成功 ∥ SSE 事件可解） |
| D-PX13 | **chunked 径背压传播**：暂停级 = body 前最后一级可写流（带 CE = 解压器 ∥ 无 CE = body），`write()` 返 false ⇒ 暂停上游源，排空 ⇒ 恢复（旗守卫幂等）；**看门狗复位源扩 `drain`**（readable ∪ drain）；**停止门**：body 终止时上游仍在暂停态 ⇒ 恢复 + 销毁源 | 与非 chunked 径 `pipe` 同语义对齐；冻结顾虑 =「背压暂停期无数据到达 ⇒ 看门狗误杀慢而健康的消费者」——排空信号 = 消费进度；消费方永停摆 ⇒ 照旧 `bodyIdleMs` 断流（不新增悬挂口——停止门闭合） |
