# 2026-10-07 · VSC 渠道代理语义修复
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-07 · 来源 = 用户 2026-10-07 17:58 原话「provider 走不走 proxy 是每个 provider 单独选的」（直斥 403 案）+ 17:59「你先把这个问题开始修!」。
> 台账 = #1026（vscode · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-07
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 笔 1（轻通道 · 缺陷修复）——「测试连接」代理语义修复

**披露**（落笔前定性）：本笔 = 轻通道，命中三条之②「缺陷修复——实现与既有源头相抵」。
源头两侧：① 用户 2026-10-07 17:58 原话「provider 走不走 proxy 是每个 provider 单独选的」；
② 运行期语义 `thincoder-vscode/src/extension/presets.mjs:131-135`（`entry.proxy ∧ proxyCfg.model`
双重门槛，缺省直连）。旧实现 `settings.mjs:224-226` 取全局 `config.proxy.web` 旗。
回退 = revertable（单笔提交，见 §6 收口面）。

**改动**（两档源码 + 一测试件）：
- `thincoder-vscode/src/extension/settings.mjs:220-233`：`testProviderConnection` 不再取全局
  `config.proxy.web`——添加渠道表单 = 尚未落盘的条目 ⇒ 与运行期缺省一致 = 直连（`proxyUri: null`）。
- `thincoder-core/proxy.mjs`：新增 `isLoopbackTarget()`（`localhost` ∥ `*.localhost` ∥ `127.0.0.0/8`
  ∥ `::1`；含尾点 ∥ IPv6 括号归一）；`proxyFetch` 入口对 loopback 目标一律旁路代理串（NO_PROXY 语义）。
- `docs/batches/2026-10-07-vsc-provider-proxy-fix.test.mjs`（随批档存档）。

**走查（红 → 绿对，逐条实跑）**：
- 红（修前）：3 用例 3 fail；其中②原样复现用户案——loopback 目标被送进代理：
  `Proxy CONNECT failed (ECONNREFUSED)`（生产侧代理应答即 403，服务端零请求）。
- 绿（修后）：`node --test docs/batches/2026-10-07-vsc-provider-proxy-fix.test.mjs` = 3/3 pass。
- 语法门：两源码档 `Syntax OK`；core ∥ VSC 自测清单 = 空清单（2026-09-28 全清重置）⇒ 无存量回归面。

**冻结**：本笔冻结——后续改动开新笔。收口 = 全链一次（设计化 → 独立评审 → 批准 → 核销）。

### 1.2 用户面终验（2026-10-07 18:04 · 用户实测）

用户原话：「server我测通了，在vsc端能够会话了。」——本笔修复的用户面验收 ✓。

服务器流水佐证（8787 实例，逐条实读）：18:01 渠道添加（glm）+ `POST /api/admin/providers/discover` 200
→ 18:01:23 渠道保存 → 18:01:29~36 `GET /v1/models` 200 ×5（VSC 侧拉列表——修复前此面必 403 零请求）
→ 18:02:16~18:03:58 `POST /v1/chat/completions` 200 ×7（真实会话轮：3~11s，上游生成在跑）。

**本笔状态**：已冻 + 用户面通过。收口链（设计化 → 独立评审 → 批准 → 核销）待用户发令。

### 1.3 评审与裁决（2026-10-07 18:3x · 父侧）

- **独立评审**（advisor code · 代点火 · 自动跑授权内）：**VERDICT: pass**。0🔴；🟡×5 ∥ 🔵×2。
- **裁决**：发现 2/3/4/8 → **派设计修复轮**（§2 设计正式化 ∥ PROXY.md 收编 loopback 旁路语义 ∥ 行号清扫 `:49/:52/:77/:125/:214` → `:67/:70/:94/:142/:232` ∥ 测试件用途注释）；发现 5/6 → 落账 **#1037/#1038**（体量咨询线，随下次触碰拆）；发现 1 → 非本笔缺陷（表单探针 +`proxy` 形参 = 三端对齐批在途覆盖，`docs/vsc/design/SETTINGS.md:493`）；发现 7 → 产品码注释口径改述，移作三端对齐批实现轮同面携带（已记 parity 档 §1.6）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（2026-10-07 · 本笔正式化落盘 + PROXY.md 收编（含坐标清扫））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

本段 = 本批设计正式化（轻通道批 · 收口链设计步）——承 §1.1 / §1.2 已冻状态。

### 2.1 本批条目（覆盖）

本批 = 一笔（轻通道 · 缺陷修复 · 已冻）：**VSC「测试连接」代理语义修复 + 核内 loopback 旁路**。台账 = #1026（vscode · 归批）。
- 覆盖：① VSC 添加渠道表单 `testProviderConnection` 直连化（不再取全局 `config.proxy.web` 旗）；② 核内 `proxyFetch` loopback 旁路（`isLoopbackTarget`——NO_PROXY 语义）。
- 定性 = 缺陷修复（实现与既有源头相抵）——**零新语义**；语义单源 = §1.1（用户 2026-10-07 17:58 原话锚在档）。
- 范围外：provider 配置三端对齐批（另批另档）不在本批——本段只写本笔。

### 2.2 设计档落点

`docs/core/design/PROXY.md`（网络出口板块）：
- §2 传输实现——补 **loopback 旁路**语义（判定族 + 旁路点）；
- §4 消费面——补例外注：loopback 目标永不经代理 + VSC 探针直连；
- §6.1 实现坐标——增 `isLoopbackTarget` 坐标行 ∥ 同源坐标清扫（proxy.mjs 全族 + config.mjs 归一点 + 守卫行两坐标）；
- 变更记录——补本批落点行 + 变更流水。
需求档面：`docs/core/requirements/CONFIG.md`（代理字段面承载）——本笔为缺陷修复，无需求新增 / 变更；源头 = 用户原话（锚 §1.1）。

### 2.3 机制设计（引用 §1.1——不复写全文）

- **探针面**：添加渠道表单 = 尚未落盘的条目 ⇒ 与运行期缺省一致 = 直连（`proxyUri: null`）；旧实现取全局 `config.proxy.web` 旗 = 与用户裁定相抵（缺陷点）。
- **核内面**：`isLoopbackTarget()` 判定（`localhost` ∥ `*.localhost` ∥ `127.0.0.0/8` ∥ `::1`；含尾点 ∥ IPv6 括号归一；解析失败 ⇒ false）；`proxyFetch` 入口单点旁路——loopback 目标即便在案代理串也一律直连。
- **运行期语义零变**：provider 走代理仍须双重门槛（per-provider `proxy: true` ∧ 全局 `proxy.model === true`；默认关）。

### 2.4 受影响文件与测试面

| 文件 | 行数（as-of 2026-10-07 实读） | 本笔改动 |
|---|---|---|
| `thincoder-core/proxy.mjs` | 303 | `isLoopbackTarget()` 新增（`:45`–`:60`；`:50` 导出）· `proxyFetch` 入口旁路（`:288`） |
| `thincoder-vscode/src/extension/settings.mjs` | 403 | `testProviderConnection` 直连（`:229`——`proxyUri: null`） |
| `docs/batches/2026-10-07-vsc-provider-proxy-fix.test.mjs` | 95 | 批内单测 3 用例（随批档存档） |

- 测试面：批内单测档 1 份（3 用例——loopback 判定 ∥ 旁路 ∥ 探针直连）；存量回归面 = 空清单（2026-09-28 测试树全清重置——无存量用例）。
- 文档面（本日正式化）：`docs/core/design/PROXY.md`——§2 ∥ §4 ∥ §6.1 ∥ 变更记录。

### 2.5 验收对照

| # | 验收项 | 判据（机器可验） | 结果 |
|---|---|---|---|
| 1 | loopback 判定正确、不误伤 | 用例①（命中族 ∥ 近似串不误伤） | pass |
| 2 | loopback 目标带代理串仍直连 | 用例②（死代理串 ⇒ 200 + 模型列表） | pass |
| 3 | 探针不取全局 `web` 旗 | 用例③（temp 配置死代理在案 ⇒ 探针直连拉出列表） | pass |
| 4 | 用户面终验 | 用户 2026-10-07 18:04 实测 + 服务器流水（§1.2） | 通过 |
| 5 | 语法门 | 两源码档 `Syntax OK` | pass |

- 用例 1–3 = 单测档实跑 `node --test docs/batches/2026-10-07-vsc-provider-proxy-fix.test.mjs` = 3/3 pass（§1.1 走查记录）。

### 2.6 关键决策

- **K1 · loopback 旁路收在核内单点**：`proxyFetch` 入口判定（非各调用点自防）——全部消费面（探针 ∥ provider 请求 ∥ web 工具）一次覆盖；判定 = NO_PROXY 惯例 + 归一（尾点 ∥ IPv6 括号）。理由：本地网关 / 开发服务走企业代理 = 连接失败 / 403 假红（用户案）。
- **K2 · 探针直连取自运行期缺省**：未落盘条目 ⇒ 无 per-provider 勾选可带 ⇒ 与运行期缺省（直连）一致；不复用全局 `web` 旗。后续「已存在渠道的行内测试」须带 name 走同一判定（实现注释已标注）。

### 2.7 上抛项

无。

### 2.8 附：同源坐标清扫对照（旧 → 新 · as-of 2026-10-07 实读）

| 文件 | 位点 | 旧 | 新 |
|---|---|---|---|
| proxy.mjs | `resolveProxyConfig`（范围） | `:21`–`:26` | `:22`–`:27` |
| proxy.mjs | `resolveWebProxy` | `:39` | `:40` |
| proxy.mjs | `injectProxy` / 判定式 | `:49` / `:52` | `:67` / `:70` |
| proxy.mjs | `streamHttpResponse` | `:67` | `:85` |
| proxy.mjs | body 建立 | `:77` | `:94` |
| proxy.mjs | `destroyBody` 消费点 ×2 | `:95` / `:100` | `:112` / `:117` |
| proxy.mjs | `sock.pipe(body)` | `:125` | `:142` |
| proxy.mjs | TLS 注释句 | `:174`–`:175` | `:192`–`:193` |
| proxy.mjs | `tunnelHttps` | `:180` | `:198` |
| proxy.mjs | 坏代理串报错（隧道） | `:189` | `:207` |
| proxy.mjs | TLS 安全默认注释 | `:213` | `:231` |
| proxy.mjs | TLS 判定行 ∥ §3 代码块注 | `:214` | `:232` |
| proxy.mjs | `tcpConnectProxy` | `:230` | `:248` |
| proxy.mjs | 坏代理串报错（转发） | `:237` | `:255` |
| proxy.mjs | `proxyFetch`（统一出口） | `:265`–`:266` ∥ `:266-275` | `:286` ∥ `:286`–`:303` |
| config.mjs | `normalizeProxy` ∥ 调用（§1 ∥ §6.1 两处） | `:199` / `:204` ∥ `:313` / `:323` | `:259` ∥ `:384` |
| provider/sse.mjs | `terminateBody` 消费点 | `:179` | `:207` |
| provider/google.mjs | `terminateBody` 消费点 | `:204` | `:219` |

- 核对口径 = 旧（文档原文数值） → 新（2026-10-07 实读行）；依据 = 逐档实读（proxy.mjs 全文 ∥ config.mjs 定向读 ∥ sse ∥ google = 定点搜 + 邻行语境）。
- 未复核面（非本笔同源——如疑漂移另行派单）：cmd-config.mjs ∥ web.mjs ∥ provider/core · anthropic · responses · list-models · generate-title ∥ make-agent ∥ config-io。
- 新增（非清扫）：`isLoopbackTarget` `:45`–`:60`（`:50` 导出）∥ 旁路点 `:288`——§6.1 坐标行（本批）。

### 2.9 交付注记（行数）

- 测试件（`docs/batches/2026-10-07-vsc-provider-proxy-fix.test.mjs`）：2.4 表内 95 = 用途注释落盘前实读；产出 D（用途注释一行）落盘后现行 = **96 行**。

## §3 设计评审（评审子代理）
## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）

**收口 2026-10-07（#1026 · 轻通道轮 · 全链完成）**

- **链**：§1 笔（已冻）→ §2 设计正式化（设计完成）→ 独立评审（advisor code · **VERDICT: pass** · 0🔴）→ 裁决（🟡×5 ∥ 🔵×2 八条全处置）→ **父侧代签**（自动跑授权 · 三条件：① 评审 pass ✓ ② 修正落地核验 ✓〔PROXY.md 收编 + 18 行清扫 ∥ 测试件注释 ∥ §2 落盘——父侧逐处实读〕③ token = n/a〔本批无 eng-coder 段：实施面 = 父侧直执行，记 §1〕）→ 核销。
- **验证读数（父侧亲跑）**：`node --test docs/batches/2026-10-07-vsc-provider-proxy-fix.test.mjs` ⇒ **3 pass / 0 fail**（288ms）；用户面验收在案（§1.2 原话：VSC 端可会话）。
- **提交**：`e739f817`（实现 + 记录）· `bbad1944`（§1.2）· 本收口笔（PROXY.md 收编/清扫/`D-PX9` ∥ 测试件注释 ∥ 本档 §2/§6）——推 origin(gitee) ∥ github。
- **结算指针**：台账 **#1026 已核销**（basis = 本档 §1–§2 ∥ 评审 pass ∥ 3/3 ∥ `e739f817`）；遗留 = #1037/#1038（体量咨询线）∥ #1039（a11y 条件行）∥ parity 档 §1.6 携带项（`settings.mjs:225` 注释口径——随实现轮）。
- **前批遗留交叉核**：无（独立批）。
- **收口件**：批内单测档随档存档（3 用例——loopback 判定 ∥ 旁路 ∥ 探针直连）；集成面 = 无涉。
- **附记（父侧直执行 · 可回退）**：PROXY.md §7 补 `D-PX9`（loopback 旁路决策行——单行表级零新语义；理由引 §2 ∥ §4 已载面）。
