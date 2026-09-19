# 代理出口（PROXY）· 网络出口板块

> 板块 = **网络出口（代理）**——配置形态 · 传输实现 · TLS 校验 · 消费面。实现 = `thincoder-core/proxy.mjs`（融合后形态）。
> 地图与相邻权威 = `docs/core/design/CONFIG.md`（§「越段发现」登记：代理面机制居 `PROXY.md`，本档即其落点）；provider 面 = `docs/core/design/PROVIDER.md`（本档不复制，D2）。
> 双端：CLI 用核内 `thincoder-core/proxy.mjs`（**融合形态**——取 CLI 的 abort 来源标注 + VSC 的坏代理串友好报错，见 `CONFIG.md` 融合表 `proxy.mjs` 行）；VSC 侧经 `@thincoder/core/proxy.mjs` 引用（W10 已迁核——自持镜像 `thincoder-vscode/src/proxy.mjs` 已删）。
> 需求侧 = `docs/core/requirements/CONFIG.md`（代理字段面承载）；CLI 树无逐档需求档（实核）。
> 建档：2026-09-15（**B 式迁移轮 · 第 3 批**——`thincoder-cli/docs/design/PROXY.md` 内容重建入基准层；旧档原地一字不改、留作参照历史；**旧档 §TLS 段与实装相反 ⇒ 按实装现状落笔**——见 §3 与 §8.1）。
> 本档坐标 = **as-of 2026-09-15 实核**（仓根 = `thincoder/`）。

## 1. 定位与配置形态

配置文件 `~/.thincoder/config.json` 的 `proxy` 字段；TUI 入口 = `/config` → Proxy 子菜单（§5）。

```json
{ "proxy": { "uri": "http://127.0.0.1:7890", "web": true, "model": false } }
```

- `uri`：http 代理地址（`url` 字段名也兼容）。旧格式 `"proxy": "http://..."`（裸字符串）兼容，等价于 `web: true, model: false`。
- 归一化：`thincoder-core/config.mjs:199`（`normalizeProxy`）→ `{ uri, web, model }` 或 `undefined`；加载时调用点 `thincoder-core/config.mjs:313`。缺省 `web: true` / `model: false`；无 uri / uri 非字符串 / 非对象类型（数字 / 数组等）一律**丢弃**。
- `web` / `model` 两个开关的**现行消费面**见 §4（与旧档描述不同，已按实装收正）。
- 环境回落：`HTTPS_PROXY` / `HTTP_PROXY` / `ALL_PROXY`——**仅在未配置 `proxy` 字段时生效**（`thincoder-core/proxy.mjs:21`–`:26`），且该路径返回 `model: false`。

## 2. 传输实现（`thincoder-core/proxy.mjs`）

- **`https://` 目标**：HTTP CONNECT 隧道（`tunnelHttps`，`thincoder-core/proxy.mjs:180`）——连代理发 `CONNECT host:port`，隧道上建 TLS，再发请求。响应头到齐即返回，body 为**流式**（SSE 边收边吐；abort 全阶段可中断）。
- **`http://` 目标**：经典代理转发（`tcpConnectProxy` `:230` + `streamHttpResponse(..., absoluteForm=true)`）——TCP 直连代理，请求行发**绝对 URI**。非标准绝对 URI 实现的代理（极少见）不支持。
- **无代理 / 未命中**：原生 `fetch` 直连（`proxyFetch` `:265`–`:266`）。
- 统一出口 `proxyFetch(url, opts, proxyUri)`（`:265`）：无 `proxyUri` → `globalThis.fetch`；`https:` → 隧道；`http:` → 转发。
- 错误形态：坏代理串**友好报错**（`Invalid proxy URI: "…" — expected http://host:port`，`:189` / `:237`——融合自 VSC 侧）。
- 超时语义：CONNECT/TLS 阶段用 `FETCH_TIMEOUT`（15s）；**响应头**用 `opts._headerTimeoutMs`（默认 60s，与直连 600s 语义区分）；**body 空闲**看门狗 `opts._bodyIdleMs`（默认 120s）。

## 3. TLS 证书校验（**按实装收正**）

**现行语义**：CONNECT 隧道内的 TLS 握手**默认全量证书校验**；仅当显式传 `opts.insecureTls === true` 才放行。

```js
// thincoder-core/proxy.mjs:214
const tlsSock = tlsConnect({ socket: sock, servername: target.hostname, rejectUnauthorized: opts?.insecureTls !== true })
```

| 面 | 内容 |
|---|---|
| **旧档原句**（`thincoder-cli/docs/design/PROXY.md:32`） | 「CONNECT 隧道内的 TLS 握手使用 `rejectUnauthorized: false`——**不校验目标站证书**。」 |
| **实装事实** | `thincoder-core/proxy.mjs:214`：`rejectUnauthorized: opts?.insecureTls !== true` ⇒ **默认 true（全量校验）**；`:174`–`:175` 与 `:213` 注释逐字：「TLS 默认全量证书校验（rejectUnauthorized: true）——走代理的流量（含 API key）不得在未验证链路上传输；确需自签 / 内网代理时 opts.insecureTls=true 显式放行」。 |
| **新档写法** | **默认校验**；自签 / 企业 MITM 代理须**显式 opt-in**。 |

- **opt-in 通道**：`insecureTls` 目前**无 config / UI 入口**（实核：全仓仅 `thincoder-core/proxy.mjs` 三处出现，无调用方注入）——它是 `opts` 层契约，为测试与将来接入保留。
- **代价面（现行）**：经代理的 HTTPS 流量对**代理运营方**可见（CONNECT 隧道终止于代理）；若显式放行 `insecureTls`，则失去对「代理 ↔ 目标站」中间人攻击的检出。**敏感 API key 会随请求经过代理**——因此 `model` 代理默认关且需双重开启（§4）。web 工具只拉公开网页，风险面较小。
- 直连路径（无代理）不受本机制影响（走原生 `fetch` 的默认校验）。

## 4. 消费面（谁走代理）

| 开关 | 现行语义 | 落点 |
|---|---|---|
| `model` | **双重开启才生效**——per-provider `proxy: true` **且** 全局 `proxy.model === true`（默认关）。注入时机：启动装配与 `/config` 保存后，写入 `provider.proxyUri`，`chat()` 请求时消费 | 注入 `thincoder-core/proxy.mjs:49`（`injectProxy`，`:52` 判定式）· 调用 `thincoder-cli/src/cli/make-agent.mjs:29`–`:30` · `thincoder-cli/src/tui/cmd-config.mjs:59`–`:61` · 消费 `thincoder-core/provider/core.mjs:417`–`:418` · `provider/anthropic.mjs:104` · `provider/google.mjs:126` · `provider/responses.mjs:439` · `thincoder-core/provider/list-models.mjs:31` · `thincoder-core/generate-title.mjs:88`–`:89` |
| `web` | **不再自动应用到 web 工具**：`fetch` / `websearch` 采**逐次调用**的 `proxy` 工具参数（`args.proxy`），config 的代理**不自动施加**（2026-08-31 裁定）。`web` 字段现行唯一活消费面 = `/config` 的 **Test connection** 探针 | 工具面 `thincoder-core/tools/web.mjs:96` · `:104`–`:106` · `:188` · `:197`–`:198`；探针 `thincoder-core/proxy.mjs:39`（`resolveWebProxy`）· 调用 `thincoder-cli/src/tui/cmd-config.mjs:141` |

> `web` 字段仍可写、仍可在 `/config` 切换（`thincoder-cli/src/tui/cmd-config.mjs:111`），但其对 web 工具的门控已由 2026-08-31 裁定取消——**字段语义与菜单标签存在落差**，见 §8.1 登记。

## 5. `/config` Proxy 子菜单与保存链

```
Set proxy URI…                                 空输入不改动；旧 string 形态自动升级为规范对象
Web tools (fetch/websearch): ON|OFF            即时保存即时生效
Model requests (providers with proxy:true): ON|OFF   保存后重跑 injectProxy，无需重启
Test connection                                经当前生效配置请求 generate_204（5s 超时）
Clear proxy
```

- 落点：`thincoder-cli/src/tui/cmd-config.mjs:104`（`proxyMenu`）· 菜单项 `:109`–`:114`。
- **保存链**：`saveProxy` → `reloadConfig`（`loadConfig` → `injectProxy` → 恢复运行时 provider 选择）——`thincoder-cli/src/tui/cmd-config.mjs:54`–`:61` · `:82`–`:83`。
- 菜单开关必须先有 `uri`（未设置时提示 `Proxy URI not set — use Set proxy URI… first`，`:133`）。

## 6. 机制面（B 式迁移并入——现状路径）

### 6.1 实现坐标（as-of 2026-09-15 实核）

| 面 | 落点 | 实核 |
|---|---|---|
| 配置归一化 | `thincoder-core/config.mjs:199`（`normalizeProxy`）· 调用 `:313` | 在位 |
| 代理解析（含 env 回落） | `thincoder-core/proxy.mjs:21`（`resolveProxyConfig`）· `:39`（`resolveWebProxy`） | 在位 |
| model 注入 | `thincoder-core/proxy.mjs:49`（`injectProxy`） | 在位 |
| TLS 校验判定 | `thincoder-core/proxy.mjs:214` | 默认全量校验 |
| CONNECT 隧道 | `thincoder-core/proxy.mjs:180`（`tunnelHttps`） | 在位 |
| 经典转发 / 流式响应 | `thincoder-core/proxy.mjs:230`（`tcpConnectProxy`）· `:67`（`streamHttpResponse`） | 在位 |
| 统一出口 | `thincoder-core/proxy.mjs:265`（`proxyFetch`） | 在位 |
| web 工具代理参数 | `thincoder-core/tools/web.mjs:96` · `:188` | 逐次调用参数 |
| TUI 子菜单 | `thincoder-cli/src/tui/cmd-config.mjs:104`–`:114` | 在位 |
| VSC 对位实现 | 经 `@thincoder/core/proxy.mjs` 引用（W10 已迁核——镜像已删） · 配置面 `thincoder-vscode/src/config-io.mjs:146` | 同实现 |

### 6.2 测试面

- 代理族单测在 CLI 测试树（`thincoder-cli/test/`）：CONNECT 隧道 / 配置解析 / `normalizeProxy` / 坏代理串报错 / provider 头注入（`provider-headers.test.mjs` 经 `_deps.proxyFetchImpl` 注入替身）。
- 无代理路径 = 原生 `fetch`——单测的唯一网络面（无真网络依赖）。

## 7. 并入的关键决策记录（含否决备选）

| # | 决策 | 理由 / 否决备选 |
|---|---|---|
| D-PX1 | `model` 走代理须**双重开启**（per-provider `proxy: true` **且** 全局 `model: true`），默认关 | API key 经代理可见——默认不得外送；否决「全局一个开关全开」 |
| D-PX2 | `web` 工具采**逐次调用参数**，config 代理不自动施加 | 固定配置会破国内站点（`gitee` / 内网直连被代理劫持）；模型按目标自选。否决「config 固定代理」 |
| D-PX3 | **TLS 默认全量校验**，自签 / MITM 代理须显式 `insecureTls` opt-in | 走代理的流量含 API key，不得在未验证链路上传输；否决默认放行 |
| D-PX4 | env 回落**仅在未配置 `proxy` 字段时**生效，且不代理 model 请求 | env 不可预期；model 代理必须显式。否决「env 也能开 model 代理」 |
| D-PX5 | 坏代理串**友好报错**（融合自 VSC） | 原生 `Invalid URL` 不解释期望形态——调用方可观测文案退化 |
| D-PX6 | CONNECT/TLS 与响应头**分开超时**（15s / 60s） | 共用 15s 会让排队 TTFB > 15s 的 provider 误报超时；否决「一个超时管全程」 |

## 8. 不并项与历史沿革

### 8.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-cli/docs/design/PROXY.md`（CLI 产品档）——**原地保留作参照历史**（保留 ≠ 维护）。下列内容不并入本档：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| **旧档 §TLS 段第 1 句**（`thincoder-cli/docs/design/PROXY.md:32`） | 「`rejectUnauthorized: false`——**不校验目标站证书**」 | **与实装相反**——现行默认全量校验 + `insecureTls` 显式放行（§3）。旧档一字不改（B 式）；照抄即把**错误的安全承诺**写进权威层 |
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

- 2026-09-15（**S2 W10 · VSC 接线**）：§1 与 §6.1 的 VSC 对位行改述为「经核引用」——自持镜像已删（删除记录 = 批次档 `batches/2026-09-15-vsc-core-wiring.md` §5）；机制条文零改。
- 2026-09-15（**B 式迁移轮 · 第 3 批**）：建档——`thincoder-cli/docs/design/PROXY.md` 内容重建入基准层（旧档一字未改、原地作参照历史）。
  **§3 TLS 段按实装收正**（默认全量校验 + `insecureTls` 显式放行——旧档原句与实装相反，三方对照留在 §3 表）。
  **§4 消费面按实装收正**（`web` 字段对 web 工具的门控已由 2026-08-31 裁定取消，现行只活于 Test connection 探针）；坐标改写为现状路径并实核；批次材料 / 状态行 / 变更流水不并（§8）。
