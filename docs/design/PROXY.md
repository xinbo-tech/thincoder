# Proxy 支持（src/proxy.mjs） > 基于代码实际实现梳理。配置入口：`/config` → proxy 子菜单；配置文件 `~/.thincoder/config.json` 的 `proxy` 字段。 ## 配置形态 ```json
{ "proxy": { "uri": "http://127.0.0.1:7890", "web": true, "model": false } }
``` - `uri`：http 代理地址（`url` 字段名也兼容）。旧格式 `"proxy": "http://..."`（裸字符串）兼容，等价于 `web: true, model: false`。
- `loadConfig` 会归一化为 `{ uri, web, model }`（`normalizeProxy`）：缺省 `web: true` / `model: false`；无 uri、uri 非字符串、非对象类型（数字/数组等）一律丢弃。
- `web`（默认开）：web 工具（`fetch` / `websearch`）是否走代理。每次调用时现读，即时生效。
- `model`（默认关）：LLM 请求是否走代理。**双重开启**才生效——同时需要 provider 条目里 `proxy: true` 且全局 `model: true`。注入时机：启动（`assembleAgent`）和 /config 保存后（`injectProxy`），写入 `provider.proxyUri`，`chat()` 请求时消费。
- env 回落：`HTTPS_PROXY` / `HTTP_PROXY` / `ALL_PROXY`。仅在未配置 `proxy` 字段时生效，且 env 路径 **只影响 web 工具**（model 恒为 false，不会代理 LLM 请求）。 ## 传输实现 - **https:// 目标**：HTTP CONNECT 隧道（`tunnelHttps`）——连代理发 `CONNECT host:443`，隧道上建 TLS，再发请求。响应头到齐即返回，body 为流式（SSE 边收边吐，abort 全阶段可中断）。
- **http:// 目标**：经典代理转发——TCP 直连代理，请求行发绝对 URI（`GET http://host/path HTTP/1.1`），由代理解析并转发。非标准绝对 URI 实现的代理（极少见）不支持。
- 无代理 / `web: false`：原生 `fetch` 直连。 ## TLS 证书校验（已知 MITM 面） CONNECT 隧道内的 TLS 握手使用 `rejectUnauthorized: false`——**不校验目标站证书**。这是有意为之：企业代理/自签证书场景下校验会全部失败，而零依赖约束下不引入 CA 包管理。 代价：经过代理的 HTTPS 流量对"代理本身"是可见的，且无法发现代理与目标站之间的中间人攻击。**敏感 API key 会随请求经过代理**——只在信任代理运营方时开启 model 代理（这也是 model 默认关、且需要双重开启的原因之一）。web 工具只拉公开网页，风险面较小。 ## /config proxy 子菜单 ```
Set proxy URI… 空输入不改动；旧 string 形态自动升级
Web tools (fetch/websearch): ON|OFF 即时保存即时生效
Model requests (providers with proxy:true): ON|OFF 保存后重跑 injectProxy，无需重启
Test connection 经当前生效配置请求 generate_204（5s 超时）
Clear proxy
``` 保存路径统一走 `saveProxy → reloadConfig`（saveConfig → loadConfig → injectProxy → 恢复运行时 provider 选择）；运行时 `/model` 切换（未落盘）不会被 /config 保存回滚。selectModel 落盘前会剥离运行时注入的 `proxyUri` 字段。
