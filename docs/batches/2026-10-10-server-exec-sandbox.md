# 2026-10-10 · server-exec-sandbox
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-10 · 来源 = 用户 2026-10-10 12:36 提（原话「感觉如果考虑团队开发的话就得考虑沙盒了，否则服务器有点危险，别被测试代码打崩了。」）⇒ 13:41 问细化（「沙盒怎么做你有啥更进一步的想法吗？」）⇒ 13:43 裁（「容器是必须，不要考虑什么退路」）⇒ 13:49 裁（「先按照这个做，白名单是可以再添加的吧？」）⇒ 13:50 问（「支持通配符？」）⇒ 13:51 提（「感觉有问题，这么做会很麻烦，你看一下别家是怎么做的」）⇒ 13:54 提（「我反正觉得用域名限制不合理，应该用ip地址段更符合行为习惯，有点像阿里云的安全组配置。」）⇒ 13:55 裁「可以」（= 点火：独立小批，先于 #1215 服务端开发）；口径已落需求档 `docs/server/requirements/PROJECT.md` §5 #1215 沙盒块（威胁模型五面 ∥ 每工作区一盒 ∥ 盒内零服务器密钥 ∥ 出站两类规则（CIDR + 域名）∥ 待批队列 ∥ 资源与 TTL ∥ 非目标 ∥ 验收 = 红队探针套件）。
> 台账 = #1224（server · 归批）。前情 = 无（独立批——与 B1 团队登录批无承接关系）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 批件（点火 2026-10-10 13:55）

**交付目标**：服务端**执行沙盒**——容器强制的代码执行隔离件（服务端开发【#1215 第三步】的前置硬题）。本批 = 设计 + 实现（隔离运行面 ∥ 出站规则引擎 ∥ 待批队列 ∥ 红队探针验收件）。

**依据（用户逐句裁定——口径已落 `docs/server/requirements/PROJECT.md` §5 #1215 沙盒块）**：

| 时点 | 用户原话 | 落点 |
|---|---|---|
| 12:36 | 「如果考虑团队开发的话就得考虑沙盒了，否则服务器有点危险，别被测试代码打崩了。」 | 沙盒 = 前置硬题 |
| 13:43 | 「容器是必须，不要考虑什么退路。」 | **容器唯一形态；无容器 ⇒ 功能不启用**（不降级） |
| 13:49 | 「先按照这个做，白名单是可以再添加的吧？」 | 出站默认全拒 + 白名单（可增删） |
| 13:50 | 「支持通配符？」 | 单层左通配 + 解析后 IP 二查 |
| 13:51 | 「感觉有问题，这么做会很麻烦，你看一下别家是怎么做的。」 | 行业比对 ⇒ 补**待批队列** |
| 13:54 | 「我反正觉得用域名限制不合理，应该用ip地址段更符合行为习惯，有点像阿里云的安全组配置。」 | 出站**两类规则同表**：CIDR（安全组同形）+ 域名 |
| 13:55 | 「可以」 | 点火（独立小批、先于 #1215） |

**本批判据来源（单源）**：`docs/server/requirements/PROJECT.md` §5 #1215 沙盒块（威胁模型 ∥ 容器强制 ∥ 每工作区一盒 + 盒内零服务器密钥 ∥ 出站两类规则 + 两闸次序 + 待批队列 + 通配 ∥ 资源与 TTL ∥ 非目标 ∥ 验收 = 红队探针套件 + 正常开发链）。

**不并批（点火前台账扫描——同面扫描理由在册）**：

- **#1215 服务端开发**（第三步候补）——**不并**：本批 = 执行隔离件（安全基础设施），#1215 = 产品面（web 端开发会话 ∥ 移动端）；顺序 = 本批**先于** #1215（用户 12:36 定「前置硬题」）。接口面：本批交付的盒 + 待批队列，是 #1215 的执行底座。
- **#1216 ③ CI 集成**——**不并**：同「跑不受信的仓」本质，**共用 runner 接口**（本批留接口，CI 批消费）；不同批面（CI = 钩子与同步，沙盒 = 隔离与出站），且 #1216 有独立的前置件（权限面）。
- **#1224** = 本批的台账行（req_doc 指针 = §5 沙盒块）。

**授权口径**：设计 → 评审（用户点火）→ 批准 → 实施（eng-coder）；文档面 = 需求档（主 agent）∥ 设计档（eng-designer）∥ 本档 §1/§4/§6（主 agent）。

**父侧已备的实测证据（设计轮直接取用，勿重跑）**：本机 DNS 读数（2026-10-10）——`registry.npmjs.org` ⇒ Cloudflare `104.16.x.x` ∥ `raw.githubusercontent.com` ⇒ `185.199.108-111.133`（GitHub Pages 段）∥ `github.com` ⇒ Azure `20.205.243.x` ∥ `gitee.com` ⇒ `180.76.199.x`（证明「公网服务 IP 共享且漂移」⇒ 域名规则不可省）；行业形实读——Claude Code 沙盒档（`code.claude.com/docs/en/sandboxing`：allowedDomains 默认空 ∥ 新域名提示批准 ∥ 解析到本机地址自动拒 ∥ 硬锁 `failIfUnavailable`）∥ Codex（默认断网，云端仍走内部白名单）∥ 云沙盒 E2B ∥ Modal ∥ microsandbox（域名/CIDR 白名单 + 私网默认封）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（两域档 SANDBOX.md ∥ RUNNER.md + 六档随动 + 本档 B1–B14；doc-check 待复跑读数收口）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 批次任务（本批条目——覆盖）

需求单源 = `docs/server/requirements/PROJECT.md` §5 沙盒块（#1215 前置硬题）；**14:00 追加裁定**（用户原话：「沙盒可不可以不运行在thincoder-server本机？我们可以考虑外挂几台机器跑沙盒，否则一个节点把服务器干死了就都死了。」）= 控制面/执行面分离 + runner farm——原「部署形态」未裁点按此收为**已裁**。

| # | 条目 | 需求指针 | 设计落点 |
|---|---|---|---|
| B1 | 两平面形态（server 控制面 ∥ runner 执行面农场；server 不跑盒） | §5:285 + 14:00 裁定① | `sandbox/SANDBOX.md` §1/§5 |
| B2 | runner 注册/鉴权/心跳/健康/容量标签 + 工作区→runner 放置 | 14:00 裁定② | `SANDBOX.md` §3/§5 |
| B3 | 容器运行面（盒参数 ∥ read-only ∥ 卷 ∥ 生命周期 ∥ TTL ∥ 采纳） | §5:287/:296 | `sandbox/RUNNER.md` §3 |
| B4 | 盒内凭据（每工作区 key 签发/吊销/配额；模型调用经网关接口） | §5:287 | `SANDBOX.md` §7 |
| B5 | 出站规则引擎（两类同表 ∥ 默认全拒 ∥ 禁单 ∥ 两闸次序 ∥ 通配 ∥ 即生效 ∥ 审计） | §5:288–294 | `SANDBOX.md` §4 + `RUNNER.md` §4 |
| B6 | 待批队列（挂起 ∥ 三态 ∥ 60s 超时 ∥ 三次建议） | §5:295 | `SANDBOX.md` §6 + `RUNNER.md` §4.2 |
| B7 | 资源上限（cpus/memory/pids/磁盘配额） | §5:296 | `RUNNER.md` §3/§5 |
| B8 | 牲口语义 + 未提交改动保护（三层） | 14:00 裁定③ | `SANDBOX.md` §5 + `RUNNER.md` §6 |
| B9 | runner→server 通道最小权限（只领取/上报） | 14:00 裁定⑤ | `SANDBOX.md` §3/§9 |
| B10 | 控制台面（**六面**：运行面/工作区/出站规则/待批队列/资源与 TTL/审计可查 + 每配置项 UI 写入口——2026-10-10 14:08 必交面随正 ∥ 见 B14） | §5:292 + 14:00 裁定④ | `SANDBOX.md` §8 |
| B11 | 红队探针套件 + 正常开发链（P1–P14） | §5:298 | `SANDBOX.md` §12 + `RUNNER.md` §10 |
| B12 | 部署前置清单 + 自检（宿主需什么 ∥ 怎么自检） | 14:00 裁定 + §5:296 | `RUNNER.md` §7/§8 |
| B13 | 与 CI 共用 runner 接口（只留接口，不实现 CI） | §5:299 + 14:00 裁定⑦ | `SANDBOX.md` §3/§15 |

**明确不在本批**：CI 实现（#1216③）∥ #1215 产品面（web 开发会话 ∥ 移动端）∥ #1216② 项目权限（只留同守卫点）∥ runner 自动更新 ∥ 盒镜像内容治理 ∥ IPv6 ∥ per-workspace 独立额度池。

### 设计档落点

- **新域 `sandbox`（域目录镜像代码域 `thincoder-server/src/sandbox/`——server 设计档惯例）两档**：
  - `docs/server/design/sandbox/SANDBOX.md`（**控制面**：两平面 ∥ v11 七表 ∥ runner 通道 ∥ 放置/牲口 ∥ 规则单源 ∥ 待批 ∥ 凭据 ∥ 控制台 ∥ 探针 ∥ 决策 KD-SV-63…72 ∥ 未裁点 U1–U5 + 披露 D1–D4）；
  - `docs/server/design/sandbox/RUNNER.md`（**执行面**：守护/通道 ∥ 盒参数集 ∥ 出站强制两实现 ∥ 磁盘配额 ∥ WIP 检查点 ∥ doctor ∥ 部署 ∥ 决策 KD-SV-73…76）。
  - 落点自定回报 = 未用拟名 `design/SANDBOX.md` 平铺——按「代码/文档同拍三层结构」（`PROJECT.md` §2.1 + `EVOLUTION.md` §1-G4）落域目录；且两平面受众/前置不同 ⇒ 域内拆两档。
- **板账随动（本批已落）**：`PROJECT.md`（域表/地图/索引/总账/AC 行）∥ `store/STORE.md`（v11 + 归域）∥ `webui/WEBUI.md`（新页 + 档目链）∥ `gateway/API.md`（§2.5/§2.6 + §3 新码）∥ `ops/OPS.md`（runner 部署）∥ `accounts/ACCOUNTS.md`（十二型）∥ `EVOLUTION.md`（G4 域数）。
- **需求档（主 agent 笔）**：回笔建议四条——见 §上抛。

### 机制设计（要点——全文在两域档，此处只列骨架）

- 形态：控制面（server：编排/注册/放置/规则/待批/凭据/审计/控制台）+ 执行面（runner：跑盒 + 本地强制）；**无 runner ⇒ 功能不可用**（无退路延续）。
- 通道：join token（一次性）→ runner token（Bearer，仅 `/api/runner/*`，独立守卫）∥ 心跳 15s ∥ 长轮询领取 ∥ 上报；任务 kind 可扩（CI 共用）。
- 存储：v11 七表（runners/workspaces/rules/pending/tasks/checkpoints/settings）+ 审计 CHECK 重建（十型 ⇒ 十二型：`sandbox_rule` + `sandbox_event`）。
- 盒：每工作区一盒一网络；read-only 根 + 唯一卷 + tmpfs 例外（披露 D1）；cap-drop + 非 root + pids/mem/cpu 旗；空闲/墙钟双 TTL。
- 出站：网络层（CIDR——每工作区桥链默认拒 + allow 集）+ 代理层（域名——CONNECT/HTTP 闸代理，解析后 IP 二查；不 MITM）；deny 恒先；通配单层左；修订号下发即生效；待批挂起三态。
- 凭据：每工作区 key = `api_keys` 行（名 `sandbox:<ws>`；归属负责人；明文存控制面——披露 D2）；盒内仅此 key（零服务器密钥）；模型调用 = 网关 baseURL + env 注入。
- 牲口：卷恒留 ∥ WIP 快照（周期 15 分钟 + 拆前）∥ 销毁二次确认；换机 = 重克隆 + 快照恢复。

### 受影响文件与行数预算（产品面）

| 面 | 档 | 行数预算 |
|---|---|---|
| 控制面 | `thincoder-server/src/sandbox/routes.mjs`（拟新增） | ≈270 |
| 控制面 | `thincoder-server/src/sandbox/runner-api.mjs`（拟新增） | ≈230 |
| 控制面 | `thincoder-server/src/sandbox/registry.mjs`（拟新增） | ≈250 |
| 控制面 | `thincoder-server/src/sandbox/rules.mjs`（拟新增） | ≈230 |
| 控制面 | `thincoder-server/src/sandbox/credentials.mjs`（拟新增） | ≈80 |
| 执行面 | `thincoder-server/src/sandbox/runner/` 九档（daemon/client/runtime/boxes/egress/netfilter/quota/checkpoint/probe——均拟新增） | ≈1910 |
| 执行面 | `thincoder-server/bin/thincoder-runner.mjs`（拟新增） ∥ `deploy/sandbox/Dockerfile`（拟新增） ∥ `deploy/thincoder-runner.service`（拟新增） | ≈120 ∥ ≈35 ∥ ≈30 |
| 既有（改） | `thincoder-server/src/store/db.mjs`（实读 255） ∥ `accounts/audit.mjs`（实读 109） ∥ `gateway/errors.mjs`（实读 64） ∥ `bin/thincoder-server.mjs`（实读 182） | ≈+90 ∥ ≈+3 ∥ ≈+2 ∥ ≈+6 |
| webui | `public/views-sandbox.mjs`（拟新增） ∥ `public/views-sandbox-egress.mjs`（拟新增） ∥ `nav.mjs`（实读 88） ∥ `app.mjs`（实读 192） ∥ `i18n-zh-admin.mjs`（实读 142） ∥ `i18n-en-admin.mjs`（实读 145） ∥ `style.css`（实读 233） | ≈270 ∥ ≈240 ∥ +1 ∥ +3 ∥ ≈+60 ∥ ≈+60 ∥ ≈+12 |
| 部署面 | `thincoder-server/README.md`（实读 258） ∥ `package.json`（实读 26——bin +1 ∥ prepublishOnly 38 ⇒ 40） | ≈+60 ∥ ±0 |
| 批内件 | `docs/batches/2026-10-10-server-exec-sandbox.test.mjs`（服务面——估 ≈480） ∥ `docs/batches/2026-10-10-server-exec-sandbox-runner.test.mjs`（执行面——估 ≈450） | 两件 |
| 产品面小计 | —— | ≈**+3720**（估） |

- 探针套件 = 产品件（`runner/probe.mjs`）；**真机跑 = 收口轮**（前置 = 一台合标 runner——`RUNNER.md` §7）。
- 全树总账/档目链 = `PROJECT.md` §6（本批行）；既有断言随正 = §上抛（随正件）。

### 验收对照（需求块 → 设计判据 → 载体）

| 需求（§5 沙盒块） | 设计级判据 | 载体 |
|---|---|---|
| 容器唯一 ∥ 无退路 ∥ 无 runner 不可用 | `SANDBOX.md` §1/§11 + P14（503 `sandbox_unavailable` + 控制台明示） | 批内件 + 收口轮 |
| 威胁模型五面（仓内码/agent/越界/SSRF/资源耗尽） | 探针 P1–P9 逐条读数（`SANDBOX.md` §12） | 收口轮（真机） |
| 每工作区一盒 ∥ read-only ∥ 唯一卷 ∥ 盒内零密钥 | `RUNNER.md` §3 参数表 + P6/P8 | 批内件 + 收口轮 |
| 出站两类 ∥ 默认全拒 ∥ 两闸 ∥ 通配 ∥ deny 先 ∥ 即生效 ∥ 审计 | rules 校验/求值单测 + P4/P11/P12 + 审计行断言 | 批内件 + 收口轮 |
| 待批队列（三态 ∥ 60s ∥ 三次建议） | 队列单测 + P12 | 批内件 + 收口轮 |
| 资源上限 + 墙钟 TTL + 空闲拆 | P5/P7 + TTL 单测（假 runtime） | 批内件 + 收口轮 |
| 验收 = 红队探针 + 正常开发链 | `SANDBOX.md` §12 全套 + P10 | 收口轮 |
| 落地序（先于 #1215）∥ CI 共用 | §3 任务 kind 可扩 + §15 边界（CI 实现不在本批） | 设计在档 |
| 14:00 裁定七面 | `SANDBOX.md` §3–§5/§9/§11 + 对应探针 | 批内件 + 收口轮 |

### 关键决策

KD-SV-63…76（十四条）——控制面十条（`SANDBOX.md` §14：两平面 ∥ 同包第二入口 ∥ 令牌鉴权 ∥ 放置绑定 ∥ 三层保护 ∥ 双实现两闸 ∥ 待批三态 ∥ 工作区 key ∥ 可用性门 ∥ kind 可扩）+ 执行面四条（`RUNNER.md` §11：盒参数集 ∥ 磁盘配额 ∥ 出站闸代理 ∥ 网络层实现）。

### 上抛项

**未裁点（候选 ∥ 建议 ∥ 影响——待用户批准）：**

| # | 未裁点 | 候选 | 建议 |
|---|---|---|---|
| U1 | runner 容器运行时 | A Docker ∥ B Podman ∥ C 两者兼容（适配层） | C（检测序 docker ⇒ podman） |
| U2 | 内网 CIDR 口子 | A 硬核恒拒（127/8+169.254/16）＋默认可被显式 allow 开 ∥ B 全默认可开 ∥ C 全恒拒 | A |
| U3 | 默认单内容 | `SANDBOX.md` §4 五条 ∥ 增删任意 | 五条起步（控制台可改） |
| U4 | 控制台落点 | A server webui 新管理页 ∥ B 系统页并入 ∥ C 三端 | A |
| U5 | WIP 快照默认 | A 周期 15 分钟 + 拆前 ∥ B 仅拆前 ∥ C 无 | A |

**披露（不阻塞——按设计实施）：** D1 tmpfs `/tmp` 例外 ∥ D2 `key_plain` 明文落库 ∥ D3 盒可达 server 网关整端口 ∥ D4 工作区 key 残余 `/api/client/*` 读面（全文 = `SANDBOX.md` §10）。

**需求档回笔建议（主 agent 笔）：** ① §5 沙盒块补 14:00 裁定句（两平面分离/农场/牲口/最小权限/无 runner 不可用/CI 共用）；② 验收表增沙盒行（建议 AC-36——判据 = 本域两档 §11/§12）；③ AC-12 ∥ §2:13 ∥ §2:14 页数链随正（管理 7 ⇒ 8 ∥ 侧栏 10 ⇒ 11——本批新管理页）；④ AC-28 审计「十型」⇒ 十二型（v11 重建）。

**随正件（父侧——跨批写门禁；实施轮同拍，断点以当刻盘面为准）：** ① 档目断言十件（`public/` [31 ∥ 30] ⇒ [33 ∥ 32]——名单 = `WEBUI.md` §6 链各档）；② nav 清单四件（管理 7 ⇒ 8）；③ i18n 键集断言件（新键族 `admin.sandbox.*`——两表同增）；④ 门禁件数断言七件（N ⇒ N+2——本批两件入链）；⑤ v11 读点（`-server-gateway` 等——版本断言族）；⑥ 审计型面断言（十型 ⇒ 十二型——审计页/批量件）。

【设计轮补记 2（2026-10-10——必交面行随正 ∥ 预算算术收正 ∥ doc-check 悬空修复）】

- **① 必交面随正（需求 §5 沙盒块已增「管理与配置界面 = 必交面」行——用户 14:08 提，六面清单）**：条目表增 **B14 = 管理与配置界面（必交面）**——落点 = `sandbox/SANDBOX.md` §8 六面（运行面 ∥ 工作区 ∥ 出站规则 ∥ 待批队列 ∥ 资源与 TTL ∥ 审计可查）+ **每配置项有 UI 写入口**（`sandbox_settings` 逐键 ↔ 卡面对照表——零配置项以「编辑配置文件」收场）∥ 控制台机检口径 = `webui/WEBUI.md` §6 沙盒行（含 `#/admin/sandbox` 路由 ∥ nav 管理 8 ∥ 档目 32 ∥ 33 ∥ i18n `admin.sandbox.*` 两表同步 ∥ 审计两型模板）；判据 = 批内件 + 收口轮（浏览器实走）。
  - 同拍（上抛·知会）：B1–B13 条目表中的「控制台五卡」读数随正为**六面**（载体 = `SANDBOX.md` §8/§11 ∥ `gateway/API.md` §2.5 ∥ `webui/WEBUI.md` §2.8/§6）。
- **② 预算算术收正（设计轮自查）**：产品面总 ≈+3720 ⇒ **≈+3998**（逐面核对：控制面 ≈+1161 ∥ 执行面 ≈+2095 ∥ 既有改 ≈+101 ∥ webui ≈**+682**（原 646——漏计 `views-audit.mjs` +≈8 与 `i18n-{zh,en}-system.mjs` +≈4/表） ∥ 部署面 ≈+60）；webui 逐项 = `views-sandbox.mjs` 新 ≈290（六面卡） ∥ `views-sandbox-egress.mjs` 新 ≈240 ∥ `nav.mjs` +1 ∥ `app.mjs` +3 ∥ i18n admin 两部件 +≈60/表 ∥ i18n system 两部件 +≈4/表 ∥ `views-audit` +≈8 ∥ `style.css` +≈12。**③ 段号随正**：`SANDBOX.md` 增用例节 ⇒ §13–§16（原 13–15）；`RUNNER.md` §10 增用例指针。
- **④ doc-check 悬空修复（闸面）**：`SANDBOX.md` 两处 `accounts/session.mjs:91-95` ⇒ 改引全路径 `thincoder-server/src/accounts/session.mjs`（无坐标——坐标尾不参与存在性判）；其余 `（拟新增）` 档引用 = 列报面（设计轮预期——不入闸）。

## §3 设计评审（评审子代理）
## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
