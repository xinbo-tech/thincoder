# 2026-10-09 · server-gemini-openai-preset
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-09 · 来源 = 用户 2026-10-09 13:45 令「我希望server端提供openai协议的gemini provider」+ 13:47「没问题，三端看到不是问题」（三端可见放行）+ 13:47「点火吧」（点火）——台账 #1128 · 归批。
> 台账 = #1128（server · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：进行中（两件（#1128 gemini-openai 预设 ∥ #1129 proxy 支持）——设计轮 #27 排队（dependsOn #25 防双写）；评审点火/§4 = 用户）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**§1 讨论（主 agent · 2026-10-09）**

**来源与授权（用户逐字）**：13:45「我希望server端提供openai协议的gemini provider」；13:47「没问题，三端看到不是问题」（三端可见放行）；13:47「点火吧」（点火）。台账 #1128（server · 归批）。

**盘面（父侧实读）**：server 预设表 20 家零 gemini（`thincoder-server/src/ops/presets.mjs:12-33`——核表 OpenAI 子集快照，口径 `:6-8`）；核表 `gemini` = `format:"google"` 原生形（`thincoder-core/config-presets.mjs:30`——被快照排除的原因）；Google 官方 OpenAI 兼容端点 = `https://generativelanguage.googleapis.com/v1beta/openai`（OpenAI 形：`/chat/completions` + Bearer key；父侧联网核实 2026-10-09——**待验（无 key）**，沿 `huawei`/`opencode-go` 先例标注）。

**方案（用户已确认）**：核表新增 `gemini-openai` 行（`{ baseURL: …/v1beta/openai, desc: … }`——**零 `format` 键 = OpenAI 形** ⇒ 自动入 server 子集 20⇒21）；现有 `gemini`（原生）零动；三端可见 = 明示可接受。命名沿 `opencode-go-anthropic` 协议后缀先例。

**落点预计（设计轮收正）**：核表行 + server 表同步 + 随正面（`OPS.md` 名单 ∥ server 漂移件 ∥ `MODEL-SPECS.md` P-1 计数 ∥ 核表计数 24⇒25 ∥ 相关设计档 §6.11/§6.21 面 ∥ 需求档计数 = 主 agent 笔）+ 跨批牵连（清除批 server 件计数 20⇒21——跨批面按先例父侧落地）。

**授权口径**：本批 = 点火（用户 13:47）。评审点火权 / §4 批准 = 用户（设计完成后请点——沿全流程）。

**父侧自缚**：射程 = 本条（预设数据行 + 随正面；零代码逻辑改）。真硬门（破坏性/不可逆 ∥ 新范围 ∥ 口径裁决）停并只摆那一条。

**补充令（用户 13:5x「另外，server端也有需要proxy支持，并且provider可以分别指定走不走proxy。」）**：新增条目（台账 #1129）**并入本批**——合并依据：同面（server 配置/上游面）∥ 同意图（gemini 可达——代理需求同源）∥ 同评审面 ⇒ 一设计轮一审。要点：① server 侧 proxy 支持（上游链两面：模型发现探针 ∥ chat 转发——逐渠判定，「同判定」沿客户端 KD-75⑤ 口径）；② 逐渠 `proxy` 旗（沿客户端既有语义镜像：`providers[].proxy: true` 真值落键 + 全局 `proxy { uri }` 单源 = `docs/core/design/PROXY.md` §4；缺省/非真 ⇒ 直连）；③ **实现红线 = server 树零第三方依赖**——代理实现沿客户端既有 std 先例镜像（违则停报待裁）；④ 配置形/控制台面 = 设计轮给判据。**射程更新**：本批 = 两件（gemini 预设行 = 数据面 ∥ proxy 支持 = 代码面）。

**授权更新（用户 2026-10-09 13:49「后续自动跑完」）**：本批升级为**全链自动**——设计评审代点火 ∥ §4 代签（父侧自缚三条件：评审 pass〔0🔴〕∧ 修正轮落地并逐条核验 ∧ token 已签发）∥ 修正轮 ∥ 实施派发 ∥ 收口 · 核销 · 提交 · 推送 · token 耗。真硬门（破坏性/不可逆 ∥ 新范围 ∥ 口径裁决）仍停并只摆那一条。

**父侧酌核（#31 修正轮观察 2 裁定 · 2026-10-09 14:2x）**：跨批件 `docs/batches/2026-10-09-provider-default-model-purge-server.test.mjs` 随正口径 = **全数**——实读 8 行 9 处（硬断言 2 处 `:110`/`:169` + 标题/头注 7 处），§2 原注「四处」以本裁为准（计数以实读为据；收口落笔时按 9 处清）。观察 1（OPS §9 E21 行式）与 3（桌面行数面 4 条——他实例在途）＝接受/避让，零动。

**父侧裁（#32 前置两发现 · 2026-10-09 14:3x）**：① 核测试 `thincoder-core/test/config-presets.test.mjs` 引用作废（档不在盘——2026-09-28 测试树全清退场；任务书该行失误）——该项验收改「tmp 稿直跑 + `node --check`」代。② 跨批随正面 = **五件**（`2026-10-06-server-presets` ∥ `2026-10-09-provider-default-model-purge-server` ∥ `2026-10-09-provider-default-model-purge-core` ∥ `2026-10-04-opencode-go-preset` ∥ `2026-10-06-console-providers`）——全 tmp 稿 + 父侧机械覆盖（原位零触）；console-providers 在 server 链上**必绿**（不采「预期红+as-of 注」先例）。

**父侧补记（#32 二次披露 + 覆盖复跑 · 2026-10-09 14:4x）**：① 五件随正性质更正——`2026-10-06-server-presets` ∥ `2026-10-04-opencode-go-preset` 各含**一处必要结构适配**（E11 名单判据整名化 ∥ G-4 键序期望重写）；其余三件（purge-server ∥ purge-core ∥ console-providers）纯计数行改（#32 §5 全数载明）。② 覆盖复跑发现**第 6 件**：`2026-09-29-provider-config-family.test.mjs`（H-1/H-2 断言 24 键——+1 键致红）——父侧直改 4 处（:4 注 ∥ :10 ∥ :45/:47 ∥ :73——24⇒25 + `gemini-openai` 注）+ 复跑复绿；随正件总计 **六件**。

**父侧收正（补记勘误 · 2026-10-09 14:4x）**：前记第 6 件「直改 4 处」收正 = **5 处**——补 `:59` 键集期望（+`gemini-openai`；覆盖复跑二轮发现，非计数句）；第 6 件复跑 **13/13 全绿**（tap 读数）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（2026-10-09：设计档 8 档落盘 + 修正轮（评审 1/2/3/5/6/7 六条）落位 + doc-check EXIT 0（锚 0 ∥ 行宽 0））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 批次任务与设计（eng-designer）

**设计轮（initial）· 2026-10-09 · 两件在册（台账 #1128 ∥ #1129——用户 13:45/13:5x 两令）**
设计档落盘 = server 五档（`ops/OPS.md` ∥ `gateway/API.md` ∥ `store/STORE.md` ∥ `webui/WEBUI.md` ∥ `design/PROJECT.md`）＋核三档（`PROVIDER.md` ∥ `MODEL-SPECS.md` ∥ `PROXY.md`）。**产品码零触（设计轮）**；行号 = 2026-10-09 落盘实读（以当刻盘面为准）。

#### ① 批次条目表（两件——逐件）

| # | 条目（台账） | 交付面 | 设计落点（file:line——2026-10-09 盘读） |
|---|---|---|---|
| 1 | **#1128 · gemini-openai 预设**（用户 13:45 令「我希望server端提供openai协议的gemini provider」；父侧裁 = 三端可见） | 核表新行 `gemini-openai`（24 ⇒ 25 键）+ server 预设表同步（20 ⇒ 21）+ 计数九面随正 | 核表插入点 = `thincoder-core/config-presets.mjs:30`（`gemini` 行后插行——`baseURL` = `https://generativelanguage.googleapis.com/v1beta/openai`；零 `format` ∥ 零 thinking/reasoningEffort/maxTokens——「不设 = 不发」D-13；「待验」注沿 huawei/opencode-go 先例）——**实读 53 行 ⇒ ≈56**；server 表插入点 = `thincoder-server/src/ops/presets.mjs:22`（`openai` 后插同值——子集序）——**实读 51 ⇒ ≈53**；计数落点（设计面已随正）= `docs/server/design/ops/OPS.md`（名单行 ∥ §6 presets 行 ∥ §7 AC-9 行 ∥ §8 KD-SV-17）∥ `docs/server/design/gateway/API.md`（presets 端点行 ∥ §5 AC-11 行）∥ `docs/server/design/PROJECT.md:104` ∥ `docs/core/design/PROVIDER.md:189` 与 `:356-357`（25 preset 名单）∥ `docs/core/design/MODEL-SPECS.md:661/:663`（P-1/P-3 = 25）；**其余落点**（产品面/跨批——实施与父侧面）：`thincoder-server/README.md:53`（起步 21 家）∥ `thincoder-server/src/ops/presets.mjs` 头注两处 ∥ `docs/batches/2026-10-06-server-presets.test.mjs:123`（20 ⇒ 21——本批实施）∥ `docs/batches/2026-10-09-provider-default-model-purge-server.test.mjs`（四处 20 ⇒ 21——父侧）∥ `thincoder-cli/README.md` ∥ `thincoder-vscode/README.md`（计数文案——实施轮）∥ 需求档（主 agent） |
| 2 | **#1129 · server proxy + 逐渠旗**（用户 13:5x 令「server端也有需要proxy支持，并且provider可以分别指定走不走proxy」） | 语义 = 客户端逐渠旗镜像（D-PX1——无全局闸；密钥经代理可见 ⇒ 默认不外送）；配置形 = 顶层 `proxy: { uri }` + 逐渠 `proxy` 布尔；实现 = 新档 `src/gateway/proxy.mjs`（自持 std 传输——零第三方） | 机制全文 = `docs/server/design/gateway/API.md` §6 **KD-SV-55**；配置面 = `docs/server/design/ops/OPS.md` §1（顶层段 + 条目字段）；转发条 = `API.md` §2.1 + 「上游代理旗」条 + discover 行；存储 = `docs/server/design/store/STORE.md` §2 v9 段 + §3 v9 链行；控制台 = `docs/server/design/webui/WEBUI.md` §2.4④ 两窗勾选；核侧登记 = `docs/core/design/PROXY.md` §4 消费行 + §6.1 对位实现行 |

#### ② 机制设计（件②——定稿摘要；全文 = `gateway/API.md` §6 KD-SV-55）

**配置形**：顶层 `proxy: { "uri": "http://host:port" }`（config.json ∥ 非 URL ⇒ **拒启**——server fail-closed；与客户端「静默丢弃」差异在案；明文 http ⇒ 启动 warn 一条；生效 = 重启）。逐渠 `providers[].proxy` = 布尔（缺省 false；非布尔 ⇒ 拒启 ∥ 保存 400——单源 = `ops/config.mjs`）；存储 = v9 列（列级 ALTER——表不重建；存量行 `0`）。

**判定（两链同判定）**：旗 `true` ∧ uri 在案 ⇒ 经代理（chat 转发 ∥ 模型发现）；loopback 目标恒直连（NO_PROXY 语义——沿 D-PX9）；旗 true 缺 uri ⇒ 直连 + 启动 warn 一条（**设计加项**——密钥外发风险提示）。

**实现**：`gateway/proxy.mjs`（≈200 行）——node:http/https 内建 + 自建 CONNECT（https 目标）∥ 经典转发（http 目标）∥ `proxyFetch` fetch-like 适配层；TLS 默认全量；每请求独立连接；超时族 = CONNECT 15s ∥ 头阶段 600s ∥ body 空闲 120s（沿客户端先例值）。零第三方（KD-SV-2 禁核 import）。**退路** = 自写解析镜像核侧（同零第三方）；两者皆不可行才停报。

**接线**：① `forward.mjs`——`forwardRequest(…, { proxyUri })`（dispatch 时快照；嵌入面不传）；② `providers.mjs`——注册表构建期注入 `proxyUri`（装配 ∥ 保存两构建点同源；条目解码 `proxy: row.proxy === 1`；种子列随行）；③ `provider-admin.mjs`——discover body `proxy?`（明传优先 ∥ providerId 条目旗兜底）+ GET/POST/PATCH 字段面；④ 控制台两窗勾选（保存变更才携 ∥ 测试/刷新探针随携——先验连通；+1 i18n 键/表；列表不加列）。

**边界（不做）**：全局闸 ∥ env 回落（`HTTPS_PROXY` 一族）∥ `insecureTls` ∥ 代理认证 ∥ 连接池 ∥ 分层代理（单一 uri）∥ 嵌入面代理。

#### ③ 受影响文件（全清单——预算明细 = `docs/server/design/PROJECT.md` §6 本批预算行）

server 树：`src/gateway/proxy.mjs`（**新档** ≈200）∥ `src/gateway/forward.mjs` 201 ⇒ ≈210 ∥ `src/gateway/providers.mjs` 177 ⇒ ≈195 ∥ `src/gateway/provider-admin.mjs` 284 ⇒ ≈300 ∥ `src/ops/config.mjs` ≈260 ⇒ ≈278 ∥ `src/ops/presets.mjs` 51 ⇒ ≈53 ∥ `src/store/db.mjs` ≈224 ⇒ ≈234 ∥ `public/views-providers-modals.mjs` 376 ⇒ ≈395 ∥ `public/i18n-zh-admin.mjs` ∥ `public/i18n-en-admin.mjs`（+1 键/表）∥ `config.example.json` 35 ⇒ ≈37 ∥ `README.md` 247 ⇒ ≈259 ∥ `package.json`（`prepublishOnly` 30 ⇒ **31**——本批件入链）。
核树：`thincoder-core/config-presets.mjs` 53 ⇒ ≈56。
测试：批内件一件（拟新增 `docs/batches/2026-10-09-server-gemini-openai-preset.test.mjs`——假代理回放（进程内 CONNECT 替身）∥ v9 迁移（空库 9 ∥ v8 升 9 ∥ 幂等）∥ 端点字段往返 ∥ gemini-openai 行 ∥ 计数 21）；随正件 = `docs/batches/2026-10-06-server-presets.test.mjs:123`（20 ⇒ 21——本批实施落）；跨批件 = `docs/batches/2026-10-09-provider-default-model-purge-server.test.mjs`（四处 20 ⇒ 21——父侧落）。

#### ④ 验收对照（三链同源）

| 条目 | 判据（设计级——机检面） | 载体 |
|---|---|---|
| #1128 | OPS §7 AC-9 行子句（名单含 `gemini-openai`）∥ 漂移件 21 家 ∥ 预设行实读（`baseURL` 逐值） | 批内件 |
| #1129 | API §5 代理判据行（假代理命中 ∥ 直连三支（无旗/无 uri/loopback）∥ SSE 逐块经代理 ∥ `proxy` 字段往返 ∥ 非布尔 400 ∥ 热生效）∥ OPS §7 代理行（配置面）∥ WEBUI §6 AC-18 子句 | 批内件 + 收口轮（浏览器实走） |

#### ⑤ 上抛与登记

- **[上抛·知会] 需求档回笔（主 agent 笔）**：`docs/server/requirements/PROJECT.md` §2:9 计数「起步 20 家」⇒ **21 家** + 新增**功能点 27（server 上游代理——逐渠 `proxy` 旗）** + AC 行（判据 = `gateway/API.md` §5 代理行）+ 变更记录；`docs/core/requirements/PROJECT.md` C3 计数 24 ⇒ 25。= `design/PROJECT.md` §9 R45①。
- **[上抛·知会] 跨批件（父侧机械落）**：purge 件四处 `20 ⇒ 21`；三端 README 文案面 = R45③（实施轮）。
- **设计加项披露**（评审可剔）：① 控制台「走代理」勾选入批（防手改 config.json 怪形；若裁最小配置文件面 ⇒ 砍 webui 面即可）；② 旗 true 缺 uri ⇒ 启动 warn 一条；③ TLS 默认全量（「经代理 key 可见」认账——沿客户端口径）。
- **登记**：`db.mjs` 实读 ≈224（尾读）∥ `config.mjs` 实读 ≈260——终值以实施实读为准（回填轮收正）。

**设计轮状态**：设计档全部落盘（server 五档 + 核三档）；收口机检 = `node scripts/doc-check.mjs`（EXIT 0 为判）。

**设计轮自检（2026-10-09）**：`node scripts/doc-check.mjs` 实跑 **EXIT 0**——锚悬空 0（闸态）∥ 行宽 0（源域全部 .md 无 >300 字符单行）；设计档三链对照（批档案目 = 设计档验收指回 = 需求档条目）已按 §2 ④ 表落定；「拟新增」件（批内件 `docs/batches/2026-10-09-server-gemini-openai-preset.test.mjs`）待实施轮落盘。

### 设计修正轮落位（评审轮 1 · 发现 1/2/3/5/6/7——2026-10-09 · 执行人 = eng-designer）

**本补记 = 终形（设计与批档以本补记对应设计档为真源）。** 父侧裁定 = 六条（1/2/3/5/6/7）全采纳；4 号（协调项）保持登记——本轮零动；零新语义（全部 = 评审发现直接导出项）；产品码 ∥ 测试件 ∥ §1 ∥ R45②③ 零触（docs-first）。

**逐号落点（号 → 改动 file:line；坐标 = as-of 本补记）**：

1. **1 号（两启动 warn 归属面）** → `docs/server/design/ops/OPS.md:34`（§1 `proxy` 行——两 warn 触发 + 文案指针 + 校验射程）∥ `:244`（§7 上游代理行补两 warn 判据）；`docs/server/design/gateway/API.md:156`（§6 KD-SV-55 正文补两 warn：① 明文 `http:` uri——密钥外发提示（**保留**：设计意图确认；与批档 `:45`/`:47` 取一真源达成）∥ ② 旗 `true` 缺 uri ⇒ 直连 + warn（旗未生效））∥ `:145`（§5 行补两 warn 判据）。
2. **2 号（断连中止契约）** → `docs/server/design/gateway/API.md:156`（KD-SV-55 补契约句：客户端断连 `opts.signal` ⇒ `proxyFetch` 拆除代理 socket（CONNECT ∥ 经典转发两径同）⇒ 上游中止 + 记 `status='aborted'`——§2.1 契约零回归）∥ `:145` + `docs/server/design/ops/OPS.md:244`（两验收行各补「代理路径断连」腿）。
3. **3 号（三测试件行数注——本块补）**：新批内件 `docs/batches/2026-10-09-server-gemini-openai-preset.test.mjs`——**规模估 ≈350**；随正件 `docs/batches/2026-10-06-server-presets.test.mjs`——实读 **347** ⇒ **结构不变**（值改 `20 ⇒ 21` 行内——行数零变）；跨批件 `docs/batches/2026-10-09-provider-default-model-purge-server.test.mjs`——实读 **180** ⇒ **结构不变**（同上——行数零变）。
5. **5 号（MODEL-SPECS 残留子句）** → `docs/core/design/MODEL-SPECS.md:661`：「标题「21 条」→「24 条」」**收正为当前步差 =「24 条」→「25 条」**（与计数 25 一致）；该档仅此一处（勿他触——变更记录未加行，轨迹 = 本块）。
6. **6 号（E20/E21 射程）** → `docs/server/design/ops/OPS.md:283`（E20 补非对象形态（数组 ∥ 数字）+ scheme 射程）∥ `docs/server/design/gateway/API.md:206`（E21 同拍）；同拍 = OPS §1 行 ∥ KD-SV-55（射程 = `http:` 仅——`https:` 代理串 ⇒ 拒启；免「校验通过、传输不支持」边角）。
7. **7 号（头阶段 600s 先例钉定）** → `docs/server/design/gateway/API.md:156`：超时族注改「头阶段所沿先例 = 客户端 provider 面 `fetchTimeoutMs` 600s（`docs/core/design/PROVIDER.md:114`）；传输面 `opts._headerTimeoutMs` 默认 60s 非所沿」（免实施侧 60s/600s 二择）。

**机检**：`node scripts/doc-check.mjs` ⇒ EXIT 0（锚 0 ∥ 行宽 0——2026-10-09 复跑实读；行数面报告态差异 4 条 = 桌面树在途改动（他批动静）——与本轮三档零涉）。
**零触面（显式）**：产品码 ∥ 测试件 ∥ 批档 §1 ∥ R45②③（跨批件 ∥ 三端 README——按原登记） ∥ 4 号协调项；MODEL-SPECS 除 `:661` 外零触。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**设计评审 · 2026-10-09 · 射程 = 8 设计档（OPS ∥ API ∥ STORE ∥ WEBUI ∥ server PROJECT ∥ PROVIDER ∥ MODEL-SPECS ∥ PROXY）+ 批档全读；源树实读不在射程**

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Clarity（归属面） | 🟡 | 两项启动 warn 未落设计档归属面：「明文 http ⇒ 启动 warn 一条；生效 = 重启」仅现于批档 `docs/batches/2026-10-09-server-gemini-openai-preset.md:45`；「旗 true 缺 uri ⇒ 直连 + 启动 warn 一条」（批档 `:47`）在设计档仅以「启动 warn 一条在案」（`docs/server/design/gateway/API.md:205`）被引用——`docs/server/design/ops/OPS.md:34` 配置面行与 KD-SV-55（`docs/server/design/gateway/API.md:156`）无触发条件/文案面，§5 代理判据行（`docs/server/design/gateway/API.md:145`）与 §7 代理行（`docs/server/design/ops/OPS.md:244`）无对应判据 | 两项 warn 的触发与文案形态补入归属面（`ops/OPS.md` §1 ∥ KD-SV-55 正文）并登记用例；若「明文 http」warn 非设计意图 ⇒ 从批档撤除（设计与批档取一真源） |
| 2 | Acceptance criteria | 🟡 | 代理路径断连/中止语义未定形：「客户端断连 ⇒ 中止上游（记 `status='aborted'`）」（`docs/server/design/gateway/API.md:38`）在出口换 `proxyFetch` 后如何传导（`opts.signal` → socket 拆除）无契约句；验收面缺断连腿（§5 行 `:145` ∥ §7 行 `:244` 只覆盖 命中/直连三支/SSE 逐块/不可达 502/字段往返/热生效） | KD-SV-55 正文补断连中止契约句；验收行列一条代理路径断连腿（中止上游 + 记 `aborted`——既有 §2.1 契约零回归） |
| 3 | 受影响文件行数注 | 🟡 | 测试面三件无行数注：新批内件「拟新增 `docs/batches/2026-10-09-server-gemini-openai-preset.test.mjs`」（批档 `:59`）无规模估；随正件 `docs/batches/2026-10-06-server-presets.test.mjs`（`:123` `20 ⇒ 21`）与跨批件 `docs/batches/2026-10-09-provider-default-model-purge-server.test.mjs`（四处 `20 ⇒ 21`）无现读数/≤±N 注（两件均为值改） | 三件各补行数注：新件给规模估；两随正件给「结构不变」或 ≤±N |
| 4 | Scope（协调项） | 🟡 | 协调项登记（非缺陷）：① 需求档回笔（server 功能点 27 + AC 行 + §2:9 计数 20⇒21 ∥ core C3 24⇒25——`docs/server/design/PROJECT.md:354` R45①）② 跨批件机械改值（R45②）③ 三端 README 计数（R45③）④ 控制台勾选浏览器实走（`docs/server/design/webui/WEBUI.md:533`）——四项均未落盘 | 保持登记；落地时序按 R45 三子项与收口轮排期执行（本文不动） |
| 5 | Doc hygiene | 🔵 | `docs/core/design/MODEL-SPECS.md:661`（P-1 用例行）内残留旧迁移子句「标题「21 条」→「24 条」」与同行计数 25 不同步；所涉 CLI/VSC 测试档已标「档不在盘」（迁移期引文） | 下次触碰 §9 时修剪该子句或收正为当前步差，与 25 一致 |
| 6 | Clarity | 🔵 | 顶层 `proxy.uri` 校验射程未明：E20（`docs/server/design/ops/OPS.md:283`）与 E21（`docs/server/design/gateway/API.md:206`）列「非 URL ∥ 空串 ∥ 裸串形」，未覆盖 `https://` 代理串（合法 URL 但传输为裸 TCP 连代理）与非对象形态（数组/数字） | 明写可接受 scheme 集（如仅 `http:`）与非对象形态处置，免「校验通过、传输不支持」边角 |
| 7 | Clarity | 🔵 | 头阶段 600s 注「沿客户端先例值」（`docs/server/design/gateway/API.md:156`）在客户端有两值先例：传输面「**响应头**用 `opts._headerTimeoutMs`（默认 60s——消费面 = **代理分支**」（`docs/core/design/PROXY.md:36`）∥ provider 面「**响应头阶段**用 `fetchTimeoutMs`（默认 600s」（`docs/core/design/PROVIDER.md:114`） | 注文钉定所沿先例（provider 面 600s），免实施侧 60s/600s 二择 |

计数：🔴 0 ∥ 🟡 4 ∥ 🔵 3。
核过面（无发现）：批档 §2③ 行数注与 API §4 ∥ OPS §6 ∥ STORE §4 ∥ WEBUI §5 ∥ PROJECT §6 逐值相符（forward 201⇒≈210 ∥ providers 177⇒≈195 ∥ provider-admin 284⇒≈300 ∥ config ≈260⇒≈278 ∥ presets 51⇒≈53 ∥ db ≈224⇒≈234 ∥ views-providers-modals 376⇒≈395 ∥ README 247⇒≈259 ∥ package 30⇒31）；无档越 500/800 结构档（零拆分计划义务）；计数面 20⇒21（server 五档）∥ 24⇒25（核三档）落点齐全且逐值自洽；文档归属 = 各档既有主面（KD-SV-55 住 gateway/API.md §6、配置面住 ops/OPS.md §1、存储在 store/STORE.md、控制台在 webui/WEBUI.md、核侧登记 PROXY.md）——无新建档、无机制面双述。
限制：无项目标准档与文档地图声明（方法学据 AGENTS.md + 评审判据核；归属按各档自述板块与跨档一致性核）；源树实读不在射程。

VERDICT: pass

## §4 用户批准（主 agent）

**2026-10-09 14:2x 父侧代签** —— 依据 = 用户 13:49「后续自动跑完」（全链授权在册——§1 授权更新行）。

**自缚三条件逐条核验**：① 设计评审 **pass**（#30——🔴 0 ∥ 🟡 4 ∥ 🔵 3；§3 在册）；② 修正轮（#31）**1/2/3/5/6/7 六条落地并经父侧核验**（抽读：`ops/OPS.md:34` 两 warn 指针+射程 ∥ `gateway/API.md:156` 断连契约+先例钉定+两 warn 文案 ∥ `MODEL-SPECS.md:661` 计数 25——核讫）；③ **token 已签发**（值不落档——运行时凭证；评审 Approved 回执在案）。

**批准范围**：本批全量——件① `gemini-openai` 预设行 + 计数随正；件② server 代理 + 逐渠旗（KD-SV-55）。

**实施口径**：双舱并行（舱① = 核表行 + server 同步 + 文案面 + 两跨批件 tmp 稿；舱② = proxy 传输 + 存储 v9 + 端点 + 控制台 + 批内件 + 链 +1；dependsOn 舱①）；跨批两件（purge server 件 9 处 ∥ 10-06 漂移件）按 §1 裁定父侧机械落。

## §5 实施记录（eng-coder）
**状态行**：实施完成（件① 在册 ∥ 件② 已交付（12 档实读 · 批内件 19/19 · tmp 19 件待父侧覆盖）2026-10-09）



**实施轮交付（eng-coder · 2026-10-09 · 件① `gemini-openai` 预设行 · 台账 #1128）**

**产品面（5 档——原位已落）**
- `thincoder-core/config-presets.mjs:31-34`——`gemini`（:30）后插注释块（3 行：同 key 两形态 ∥「待验（无 key——未实拉 `/models`）」∥ `thinking`/`reasoningEffort`/`maxTokens` 不设 = 不发（D-13））+ `"gemini-openai": { baseURL: "https://generativelanguage.googleapis.com/v1beta/openai", desc: "Gemini (Google) — OpenAI-compatible side (same key as gemini)" }`（零 `format` 键；全表 25 键；`presetToEntry` :61-66 零改）。
- `thincoder-server/src/ops/presets.mjs:23`——`openai`（:22）后同值行（子集序）；头注 20⇒21 两处（:2/:11）；快照口径注补「2026-10-09 本批同步 + `gemini-openai`」（:7）。全表 21 键。
- `thincoder-cli/README.md:20`——twenty-four ⇒ twenty-five + 枚举补「Gemini (OpenAI-compatible — same key)」。
- `thincoder-vscode/README.md:22`——24 ⇒ 25 + 枚举同补；`:90` Supported Providers 表补行（Default Model 格 = `—`；沿 2026-10-04「表 +2 行」先例）。
- `thincoder-server/README.md:53`——起步 20 家 ⇒ 21 家。

**tmp 稿（`.thincoder/tmp/2026-10-09-server-gemini-openai-preset/` 5 件——原位零触 ∥ 父侧机械覆盖源；同名同径）**

| 件 | 行数 | 直跑 | 覆盖内容 |
|---|---|---|---|
| 2026-10-06-server-presets.test.mjs | 347 ⇒ 349 | 8/8 | :123 计数 ⇒ 21 + E11 排除面判据子串判 ⇒ 整名判（+2 行） |
| 2026-10-09-provider-default-model-purge-server.test.mjs | 180（零变） | 5/5 | 8 行 9 处 20 ⇒ 21（沿 §1 :31 裁「全数」） |
| 2026-10-09-provider-default-model-purge-core.test.mjs | 362（零变） | 17/17 | 3 处 24 ⇒ 25（:8/:97/:99） |
| 2026-10-04-opencode-go-preset.test.mjs | 162 ⇒ 164 | 6/6 | 计数 5 处 24 ⇒ 25 + G-4 键序期望重写（+2 行） |
| 2026-10-06-console-providers.test.mjs | 479（零变） | 9/9 | 3 处 20 ⇒ 21（:14/:455/:464） |

**原位五件读数（改后预期红——覆盖后转绿）**：10-06 件 6/8（:123 ∥ :266）∥ purge-server 3/5（:110/:169）∥ purge-core 16/17（:99）∥ opencode-go 5/6（:99）∥ console-providers 8/9（:464）。

**第 6 面（父侧直改·已落）**：`docs/batches/2026-09-29-provider-config-family.test.mjs`——5 处 24 ⇒ 25 + `gemini-openai` 注（:4/:10/:45/:47/:59/:73）；复跑 13/13 绿（§1 :31/:33）。我侧零笔（复核读数一致）。

**实读（供收口回填）**：核表 62 ⇒ 66 行（读面；设计注「53 ⇒ ≈56」= 误读——53 = 表体闭括号行号）∥ server 表 51 ⇒ 52 行（设计注「51 ⇒ ≈53」——实 52）∥ 10-06 件 347 ⇒ 349（+2）∥ 10-04 件 162 ⇒ 164（+2）∥ `OPS.md:239`「已落盘 347 行」随覆盖按 349 收正 ∥ 批档 `:48`/`:66` ∥ `PROJECT.md:182` 三处同随。

**评审轮次与终态**
- 审计（explore · 1 轮）：偏离 1 = 披露缺口（opencode-go 件 G-4 键序重写未在首则上报内）⇒ 上抛更正 + 本节/终报载明；四类代码偏差（部分实现 ∥ 静默简化 ∥ 文档漂移 ∥ 清单外改动）全零。终态 = clean。
- advisor 代码评审（2 轮）：轮 1 = changes-required（F1 = 第 6 面缺——读取与父侧落盘竞态；F2 = VSC 表行缺（可选）；F3/F4/F5 = 记录面/头注）⇒ 处置：F1 父侧已落（复核 13/13）∥ F2/F4 补笔（:90/:7）∥ F3/F5 记录面（实读入上）⇒ 轮 2 = **pass**（终态 clean）。

**决策透明表**

| # | 决策 | 依据 |
|---|---|---|
| 1 | 「待验」注落注释行（非 desc） | 沿 huawei `:42-44` ∥ opencode-go `:49-54` 先例（任务书「desc 携」与先例矛盾——取先例，已披露） |
| 2 | E11 判据子串判 ⇒ 整名判（10-06 件） | 不重写必红（`gemini` ⊂ `gemini-openai` 前缀；实跑复现「排除面入列：gemini」） |
| 3 | G-4 键序期望重写（10-04 件） | 不重写必红（旧 22 序 `deepEqual`） |
| 4 | VSC 表行 = 补（`—` 格） | 2026-10-04 先例「Supported Providers 表 +2 行」；渠道零模型 ⇒ `—` |
| 5 | server 头注补快照同步句 | 对齐 `OPS.md:45` 设计面（评审判 🔵——采纳） |
| 6 | F3/F5 记录面不回笔 | 设计档零触 = 本轮纪律；实读入本节 + 终报（收口回填） |
| 7 | 误建 workspace 级空目录（`D:\teamcode\.thincoder\tmp\…`） | 建后即删（零残留）；正位 = 仓根 `.thincoder/tmp/…` |

**实施轮交付（eng-coder · 2026-10-09 · 件② server 代理 + 逐渠 `proxy` 旗 · 台账 #1129）**

**产品面（12 档——原位已落；行数 = 本块实读）**

- `thincoder-server/src/gateway/proxy.mjs`（**新档** **267** 行——设计估 ≈200）：`proxyFetch`（fetch-like——无 uri ⇒ 原生 fetch 直连 ∥ https ⇒ CONNECT 隧道 ∥ http ⇒ 经典转发）+ `isLoopbackTarget`（NO_PROXY 四族）+ 超时族 15s/600s/120s + TLS 全量 + 每请求独立连接 + abort 拆 socket；零第三方（node:http/net/tls）。
- `src/gateway/forward.mjs` 201 ⇒ **208**（`proxyFetch` 出口 ∥ `proxyUri` 形参 + 派发时快照 ∥ 契约注）。
- `src/gateway/providers.mjs` 177 ⇒ **184**（注册表 `proxyUri` 注入（旗 ∧ uri）∥ `rowToEntry` `proxy: row.proxy === 1` ∥ 种子列）。
- `src/gateway/provider-admin.mjs` 284 ⇒ **305**（GET/POST/PATCH 字段面 ∥ discover `proxy?` 明传优先 + 条目旗兜底 + 非布尔 400 ∥ 构建点 `proxyUri` 同源）。
- `src/ops/config.mjs` 260 ⇒ **301**（`validateProxyConfig`（非对象/空串/非 URL/scheme 非 `http:` ⇒ 拒启）∥ 两启动 warn 逐字 ∥ 条目布尔校验）。
- `src/store/db.mjs` 224 ⇒ **231**（v9 列级 ALTER `providers.proxy INTEGER NOT NULL DEFAULT 0` ∥ 入链）。
- `public/views-providers-modals.mjs` 376 ⇒ **385**（两窗「走代理」勾选 ∥ 探针恒随携 ∥ 添加窗勾才携 ∥ 详情窗初值 = 行旗、变更才携）。
- `public/i18n-zh-admin.mjs` **138** ∥ `public/i18n-en-admin.mjs` **142**（各 +1 键 `admin.providers.useProxy`——键数 338 ⇒ **339** ∥ 343 ⇒ **344**；`admin.` 域界 ⇒ 落 `*-admin` 表）。
- `config.example.json` 35 ⇒ **38**（+3 = `proxy` 段 `:8`-`:10`——设计注 ≈37）。
- `README.md` 247 ⇒ **252**（配置表 `proxy` 行 + §2「上游代理」三条 + 控制台勾选句——设计注 ≈259）。
- `package.json`（`prepublishOnly` 30 ⇒ **31** 件——批内件入链）。

**批内件（1 件——新档）**：`docs/batches/2026-10-09-server-gemini-openai-preset.test.mjs`——**735 行**（设计估 ≈350）；19 例（A 配置面 4 ∥ B v9 存储 3 ∥ C 端点往返 2 ∥ D 发现判定 3 ∥ E 转发 5 ∥ F1 预设行 1 ∥ F2 控制台两窗桩 DOM 1）；直跑 **19/19 绿**。越 500 咨询线（AGENTS.md「≤ 500 lines advisory」——**未越 800 硬限**）⇒ 明示受理，理由 = 单件共享夹具（假代理 ∥ 假直达上游 ∥ 自签证书 ∥ `seedChat`）+ 批内件不入仓套件（零维护外溢）+ 拆件将复制夹具（净损）；父侧若裁拆 ⇒ 需一轮。

**tmp 稿（19 件——原位零触 ∥ 父侧机械覆盖源；同名同径；逐件按稿直跑绿）**

| # | 件（`docs/batches/`） | 覆盖内容 | 直跑 |
|---|---|---|---|
| 1 | 2026-10-06-server-presets.test.mjs | 三处 `deepEqual` 期望 + `proxy: false`（`:176`/`:218`/`:300`）——件① 稿续改 | 8/8 |
| 2 | 2026-10-06-server-gateway.test.mjs | v8 ⇒ 9 六处 + 失败迁移探针 v9 ⇒ **v10**（连带探针表 `v10_probe`）+ 头注 v9 史 | 13/13 |
| 3 | 2026-10-06-console-completeness-2.test.mjs | v8 ⇒ 9 五处 | 6/6 |
| 4 | 2026-10-07-me-keys-redo.test.mjs | v8 ⇒ 9 四处 | 7/7 |
| 5 | 2026-10-07-provider-model-metadata.test.mjs | v8 ⇒ 9 五处 + 门禁 30 ⇒ 31 三处 | 6/6 |
| 6 | 2026-10-07-quota-per-model.test.mjs | v8 ⇒ 9 五处 + 门禁三处 | 7/7 |
| 7 | 2026-10-07-quota-v2-member-models.test.mjs | v8 ⇒ 9 五处 + 门禁三处 | 12/12 |
| 8 | 2026-10-06-console-list-style.test.mjs | 门禁 30 ⇒ 31 三处 | 7/7 |
| 9 | 2026-10-06-server-auto-update.test.mjs | 门禁三处（`:9`/`:439`/`:480`） | 14/14 |
| 10 | 2026-10-07-console-layout.test.mjs | 门禁两处 | 8/8 |
| 11 | 2026-10-07-me-usage-charts.test.mjs | 门禁两处 | 3/3 |
| 12 | 2026-10-06-console-provider-redo.test.mjs | 输入面扫描三处排除复选框 + 探针体两处 + `proxy: false` | 5/5 |
| 13 | 2026-10-06-console-provider-redo-runtime.test.mjs | 探针体一处 + `proxy: false` | 3/3 |
| 14 | 2026-10-09-server-console-testkey-fix.test.mjs | 十处探针体 + `proxy: false` + 头注 ⑥ 行 | 5/5 |
| 15 | 2026-10-08-server-public-structure.test.mjs | 指纹基线两枚按盘重算 + 键数 338/343 ⇒ 339/344 + 标题/注释语义（「键集指纹——基线随增键批同拍随正」） | 6/6 |
| 16 | 2026-10-09-provider-default-model-purge-server.test.mjs | 件① 稿（零差异——已覆盖） | 5/5 |
| 17 | 2026-10-09-provider-default-model-purge-core.test.mjs | 件① 稿（零差异） | 17/17 |
| 18 | 2026-10-04-opencode-go-preset.test.mjs | 件① 稿（零差异） | 6/6 |
| 19 | 2026-10-06-console-providers.test.mjs | 件① 稿（零差异） | 9/9 |

**原位读数（覆盖前——15 件红；覆盖后转绿）**：server-gateway 11/13 ∥ server-presets 5/8 ∥ server-auto-update 13/14 ∥ console-completeness-2 5/6 ∥ console-list-style 6/7 ∥ console-provider-redo 3/5 ∥ console-provider-redo-runtime 2/3 ∥ console-layout 7/8 ∥ quota-per-model 5/7 ∥ quota-v2-member-models 10/12 ∥ provider-model-metadata 4/6 ∥ me-keys-redo 6/7 ∥ me-usage-charts 2/3 ∥ server-public-structure 5/6 ∥ server-console-testkey-fix 0/5（26 ✖——逐件断言核实 = 表内五类面：v9 迁移六件 ∥ 门禁件数七件 ∥ 探针体三件 ∥ 预设计数三件 ∥ i18n 键指纹一件）。批内件原位 19/19 绿；覆盖后全链 31 件预期全绿（未跑——覆盖属父侧动作；逐稿直跑已绿）。

**评审轮次与终态**

- 审计（explore · 1 轮）：四类偏离（部分实现 ∥ 静默简化 ∥ 文档漂移 ∥ 清单外改动）**全零**；非四类备注 2 条 = ① F2 块误嵌 F1 `try` 体（结构瑕疵——**已收正**：`:576-577` 补 F1 收尾、F2 复归顶层件，收正后复跑 19/19 绿）∥ ② 记录面 §5 缺件②块（本块落）。终态 = **clean**。
- advisor 代码评审（1 轮）：**VERDICT pass**（🔴 0 ∥ 🟡 2 ∥ 🔵 3）。🟡① 批内件 735 行越 500 咨询线（处置 = 明示受理——见上）∥ 🟡② 记录面（§5 缺件② + tmp 计数三处互异：§5「5 件」∥ §1 补记「六件」∥ 评审声明「15 件」vs 盘读 **19 件**——本表以盘读为单源）。🔵① 设计档注停留估值（`gateway/API.md:121`「（拟新增）」∥ `:130`「实读待回填」）→ 回填轮；🔵② `config.example.json` 实读 38 vs 注 ≈37；🔵③ 看门狗仅在 'readable' 重置（`proxy.mjs:144`）——机制推证（未实跑）：影响面 = 上游突发后静默 >120s ∧ 下游仍排空（缓冲 ≤ HWM ≈16KB）之窗口，与设计「body 空闲 120s」实质同形 ⇒ 受理；建议后续批补慢消费者腿。无 must-fix ⇒ 终态 = **clean**。

**决策透明表**

| # | 决策 | 依据 |
|---|---|---|
| 1 | 跨批 15 件 = tmp 稿（不原位直改） | 写门禁实读拒（「cross-batch batch-record write … belongs to a different batch」——跨批件原位写被拒）+ 件① 先例（父侧机械覆盖） |
| 2 | 批内件加 F2 腿（桩 DOM ≈160 行） | 验收表 #1129 列「WEBUI §6 AC-18 子句」、批内件为其机检载体；收口轮浏览器实走为主证 |
| 3 | gateway 件失败迁移探针 v9 ⇒ v10（连带 `v10_probe`） | 真链尾已占 v9（重复版本号 ⇒ 该腿不再触发 = 必红）；「段内回滚」语义零变 |
| 4 | console-provider-redo 输入面扫描排除复选框（三处） | 新勾选 = 复选框（初判「预设径输入面 = 仅 apiKey」2 ≠ 1 红）；其余判据零变 |
| 5 | i18n 键名 `admin.providers.useProxy` 落 `*-admin` 表 | 2026-10-08 拆表域界（`admin.` 前缀 ⇒ admin 分域） |
| 6 | 详情窗「走代理」= 独立 `.provider-form` 行 + `label.key-clear` | 零新样式（沿用清除密钥族）；代价 = `key-clear` 勾选窗内两枚（清除密钥首 ∥ 走代理次）——既有 `findNode` 单取面仍命中清除密钥（文档序），零随正；新增断言按序取 |
| 7 | 指纹件按盘重算 + 标题语义改「键集指纹」 | +1 键必改指纹；「拆表零语义」保留为「基线随增键批同拍随正」注 |
| 8 | 覆盖集以盘读 19 件为单源（非「5/15 件」） | 三处计数互异（见评审 🟡②）；盘读 = 唯一可机械核 |

**上抛与登记（供父侧）**

- [上抛·知会] **tmp 19 件 = 父侧机械覆盖动作**（覆盖前 15 件在盘红）；覆盖后 `npm run prepublishOnly`（链 31 件）= 收口门禁。
- [上抛·知会] 设计档 件② 行数注/「拟新增」标记待回填（`gateway/API.md:121`/`:130` ∥ `ops/OPS.md:214`/`:217`）——doc face 非我面。
- [上抛·知会] 看门狗 'readable' 语义（🔵③）未实跑——建议收口轮浏览器实走观察或后续批补慢消费者腿；若要入账，请父侧落台账行（台账非我写面）。
- [上抛·知会] 批内件 735 行越 500 咨询线——明示受理（理由在册）；父侧若裁拆件 ⇒ 需一轮。

## §6 验证与收口（父代理）

**§6 验证与收口（父代理 · 2026-10-09）**

**验证读数（父侧亲跑）**

- 全链 31 件（`thincoder-server` · `npm run prepublishOnly`）= **tests 236 ∥ pass 236 ∥ fail 0 ∥ skipped 0**（含本批代理全族 D1–D3 ∥ E1–E5 ∥ F1–F2；`--check` 三档随链通过）。
- tmp 19 件 → `docs/batches/` **覆盖落**（父侧机械动作；19/19 逐件实读；覆盖前 15 件在盘红 ⇒ 覆盖后全链绿）。
- `node scripts/doc-check.mjs` = **EXIT 0**（锚悬空 0 ∥ 行宽 0 ∥ 行数面差异 0——回填与连带面收正后复跑实读）。
- ECS（10.0.0.5）：pull `556c4754` → 镜像重建 `9b4d33ffb359` → 容器 **healthy**；`/healthz` = `{"status":"ok","version":"0.1.0","db":"ok"}`；镜像内 `…/@thincoder/server/src/gateway/proxy.mjs` 在位（`proxyFetch` ×3）；控制台资产在服（`views-providers-modals.mjs` 命中 `proxy` ×12 ∥ `i18n-zh-admin.mjs` 命中「代理」）。

**回填（父侧直笔 · 机械 · 可 revert）**

- 件② 行数注 10 处：`gateway/API.md:120/:121/:123/:124/:130`（**208** ∥ **267** ∥ **184** ∥ **305** ∥ 小计 **实读 1664**）∥ `ops/OPS.md:212/:214/:217/:225/:251`（**301** ∥ **52** ∥ **38** ∥ **252** ∥ 52 行）——「拟新增 / ≈估 / 实读待回填」清零。
- `347 ⇒ 349` 两处（`ops/OPS.md:239` AC-9 判据行 ∥ `PROJECT.md:210` 文件表行）+ `PROJECT.md:179-184` 预算块补「实施后回填（实读）」句。
- 行宽一处收正（`gateway/API.md:37` 304 ⇒ 299——全路径化后回压）。

**件② 连带面（9 处旧锚翻红 → 收正）**：新档 `proxy.mjs` 使全仓 basename `proxy.mjs` 自「唯一」变「多数」⇒ 原借唯一性豁免的 9 处旧锚悬空——`API.md:37`（全路径化）∥ `PROXY.md:5/:116/:118/:119/:120`（`thincoder-core/proxy.mjs` 全路径化）∥ `CONFIG.md:34` ∥ `CORE-UNIFICATION.md:841` ∥ `SETTINGS.md:747`（迁移期引文标记——目标档已拆/已删，史实对）；收正后 doc-check 0 悬空。机理 = 锚解析「repo basename 唯一 ⇒ 通过」豁免（`scripts/doc-check-anchors.mjs:192`）——**新增同名档应预见此面**（同 +1 键族连带的先例）。

**浏览器实走（F2）= 未达（口令阻塞——环境面，非缺陷）**：控制台登录需 admin 口令；审计实读 = admin `password_change` @ 2026-10-09T03:16Z（今晨用户侧动作；另建 `liwei` 管理员）⇒ `.env` 引导值失效。**未重置**（免碰用户凭据）；替代核验 = 服务资产面（上）+ 批内 F2 桩测（绿）。补走窗口 = 用户给口令 ∥ 授权重置。

**需求侧（R45①）= 设计轮已落**：`docs/server/requirements/PROJECT.md` 功能点 27（`:133`）+ AC-27（`:173`）+ 变更记录（`:274`）；`docs/core/requirements/PROJECT.md` C3 全集 25（`:30`）+ 记录（`:166`）。

**台账 / 槽**：#1128 ∥ #1129 → 核销（evidence = 本档 ∥ 提交 `556c4754` ∥ ECS 镜像 `9b4d33ffb359`）；设计槽已耗（链终）。暂缓批复核：无（本批无暂缓标记）。

**上抛处置**：🔵③ 看门狗 'readable' → 台账 tech_todo（trigger 条件）；🟡①（批内件 735 行越咨询线）明示受理在册 ∥ 🟡②（记录面计数互异）以 §5 表盘读 19 件为单源 + 本节为终读。
