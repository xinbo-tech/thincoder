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

### 设计未裁点裁定（2026-10-10 14:23）

**用户原话：「都按建议」**（回应父侧呈报的五点未裁表 + 设计侧建议）⇒ 五点全部按设计建议定案：

| # | 未裁点 | 裁定（= 设计建议） |
|---|---|---|
| U1 | runner 容器运行时 | **Docker ∥ Podman 双兼容**（检测序 docker ⇒ podman） |
| U2 | 内网 CIDR 口子 | **回环 + `169.254.0.0/16` 恒拒**；RFC1918 **可被显式 allow 开** |
| U3 | 默认出站单 | **五条起步**（控制台可改） |
| U4 | 控制台落点 | **独立管理页**（server webui `#/admin/sandbox`） |
| U5 | WIP 快照默认 | **周期 15 分钟 + 拆盒前** |

四条披露（D1–D4：tmpfs `/tmp` 例外 ∥ `key_plain` 明文落库 ∥ 盒可达网关整端口 ∥ 工作区 key 残留 `/api/client/*` 读面）用户未异议 ⇒ 按设计实施。

父侧同拍：设计档 §10 的「未裁点」标签与承批档 §2 上抛表按本裁定翻「已裁」（发设计席点修轮）。

### 全链授权（2026-10-10 15:04）

**用户原话：「那后续自动跑吧。」**——批级全链授权（沿本仓先例：「自动跑完」= 设计评审点火 ∥ §4 代签 ∥ 修正/实施派发 ∥ 收口核销与提交推送，射程内自动沿用）。

**父侧自缚停条件（四条——命中即停并报）**：① 复评再出新 🔴 即停；② 验证不过即停；③ 需新范围即停（越本批条目面的新要求 ⇒ 停下上抛）；④ §4 代签仅在三条件齐备时进行（评审 pass + 修正落地并逐条核验 + token 签发；凭据值不落档）。

**本批在飞与排程**：修复轮 #136（评审 14 发现 + A 节）在飞 ⇒ 交卷 ⇒ 父侧核验 ⇒ 设计追加轮（#1236 托管接入 ∥ #1237 agent 执行能力——15:02 收正：先由设计席从装机场景**反推能力清单**）⇒ 评审（含新面）⇒ pass 与修正闭环 ⇒ §4 代签 ⇒ 实施派发（eng-coder）⇒ 收口。

**收口的硬前置（如实：本条不因授权而消失）**：**验收 = P1–P14 红队探针 + 正常开发链，须在真 runner 机上跑**——现今无 runner 主机在册 ⇒ 实施后「服务器侧 + 控制台侧」可验部分先行，**真机项作为收口前置挂在 §6**（不假装通过）。

### 修复轮 #136 核验 + 计数同拍 + 评审轮 2 点火（2026-10-10 15:1x——父侧 · 承 15:04 全链授权）

**① 修复轮 #136 核验（内容级）**：号 1–14 + A 节逐号落点抽查在位（SANDBOX §2-§15 ∥ RUNNER §3/§4.1/§9 ∥ API §2.5/§2.6/§2.7 ∥ STORE v11 段+审计段 ∥ WEBUI §2.3/§2.8/§2.9/§6 ∥ OPS §5.10）；**机检 = `node scripts/doc-check.mjs` EXIT 0（父侧亲跑两遍：修复轮交卷后 + 计数同拍后）**；产品码零触 ✓。

**② 上抛处置（两条）**：㈠ 需求档 AC-12/AC-14 计数（我的 3 ⇒ 4 ∥ 档目 32∥33 ⇒ **33∥34**）= **父侧笔域，已当场落**（`requirements/PROJECT.md:215/:217`）；㈡ `design/PROJECT.md` 陈值六处（`:31` 档数+views 数 ∥ `:66` 十一页⇒十二页 ∥ `:261` ∥ `:395` ∥ `:434` AC-36 标记 + 「显式 deny 先」）= **纯机械随正，父侧直接执行（可 revert）**，已落；其变更记录链（`:576`）= 历史面 ⇒ 不动（记录面不回溯）。

**③ A1 新档裁定**：`views-me-sandbox.mjs`（成员沙盒页 `#/me/sandbox`——只读）**保留为独立档**（一页一职责；并入既有档 = 又一处"随便找个地方一丢"）——档目 33 ∥ 34 生效；`WEBUI.md` §2.9 + API §2.7（`GET /api/me/sandbox/workspaces`——恒本人过滤）在位。

**④ 连带同拍**：nav 我的 3 ⇒ **4** ∥ 管理 8 ∥ 侧栏十二页（`#/login` + 我的四 + 管理八）；档目断言件列表补 `views-me-sandbox.mjs`。

**⑤ 评审轮 2 点火**：`advisor(type=design)` = **#138**（在飞；对象 = 六档 + 需求档；轮次 2 = 复核前表 + A 节新面；`batchDoc` 已挂 ⇒ 发现与 VERDICT 由评审席逐字写入本档 §3）。

### 收正（2026-10-10 15:17）：授权范围无「先例」依据

本节「全链授权」条中「**沿本仓先例**：…」句**作废**（用户 15:16 追问「哪个先例？」⇒ 父侧自纠）——授权范围**只由两件构成**：① 用户原话（「那后续自动跑吧。」）；② 父侧自缚四条停条件。**无先例依据**——本仓铁律 = 先例 ∥ 存量 ∥ 已落形态**不构成依据**，例外唯一依据 = 可机判判据句。此后本档不得再引「先例」作准绳（描述性引用仅限在册决策，且须标 = 在册决策）。

### 父侧注（2026-10-10 15:57）：控制面实施验收 + 设计面待办

- **#140 交付验收 ✓**：批内件 **22/22**（父侧复跑 `node --test docs/batches/2026-10-10-server-exec-sandbox.test.mjs`——腿 E31 ∥ H ∥ J B27 ∥ I 原文可见）∥ `node --check` 全绿（抽查 4 档）∥ 内部审计 1 + 代码评审 3 轮终态 clean ∥ §5 已自写。**越声明披露**：`package.json` prepublishOnly（= 设计计划面 §2:137/PROJECT:330 ✓）∥ `accounts/audit.mjs`（§2 表内 ✓）∥ 上送通路第 3 点 `readStreamBody` 原语（作业令列 2 点实为 3 点，实测 +68 行）——如实。
- **父侧裁决（逐条）**：① 悬挂回收「按放置改派」——**采实施侧读法**（同 runner 复联 = 自动 ∥ 跨机改派 = 操作面（删机流程）；卷在 runner 本地盘 ⇒ 自动跨机迁移会绕过 WIP 快照保护，不做）✓；② 「无保护」承载——**判：事件记录承载 + 展示派生**（静止态 = 「最近一次快照事件 = 跳过/失败」；无需新盒字段）——形态由设计席定；③ 快照 blob 落 `<库档目录>/checkpoints/`、**不入备份面**——知悉，与备份/恢复的口径（行在 blob 无）待载。
- **设计面待办（随 #147 执行面交卷，合并为一轮 fix/回填轮）**：ⓐ 悬挂回收读法一句收正；ⓑ 「无保护」载体定形；ⓒ 快照 blob × 备份面口径；ⓓ 实施后回填（`gateway/API.md`/`store/STORE.md`/`sandbox/SANDBOX.md` §14「实读待回填」行——读数 = 批档 §5.4/§5.11）；ⓔ `registry.mjs` **512** > 500 软线（拆分计划留档，随回填记载）。

### 父侧注（2026-10-10 16:21）：设计回填轮列表 +1（用户 16:19 问）

- ⓕ **「每成员工作区数上限」无设计**（用户 16:19 问：「开得多了会把资源吃光」——自动休眠已答（空闲 30 分钟停盒 ∥ 墙钟 24h 兜底 ∥ 卷恒留，机制在册 `RUNNER.md` §3）；**缺口 = 一个成员能申请多少个工作区没有上限**）。归 **#1216 ② 权限模型**（申请数 ∥ 谁批）；回填轮一并核（若 #1216 ② 未定则在本批设计面明标「候 #1216 ②」）。
- ⓖ 顺拍：`webui/WEBUI.md` §2.9 空态句「由管理员创建」（承 16:08 用户生命周期口径「成员申请」——现值相抵）——与本轮 ⓐ–ⓔ 并单收正。

### 父侧注（2026-10-10 16:44）：回填轮列表 +2（#147 交卷上抛）

- ⓗ **数值回填**（#147 报：九档 ≈2318 实际 vs 估 1910 ∥ 批内件拆三件 ∥ 发布门 40 ⇒ 41 项 ∥ `PROJECT.md`／`SANDBOX.md` 仍述「两件/38⇒40」）——归回填轮（含父侧笔域 `PROJECT.md` 与设计席 `SANDBOX.md`）。
- ⓘ **「无保护」载体**（= 原 ⓑ 同项——#147 再证：周期/超限跳过无上行通道，载体形态待设计席定形）——并单收正。
- 另记：#147 轮2 🟡（join 名冲突 + SQLite 原文外透）**由父侧轻通道亲办**（原拟另派 fix 轮——设计 token 实测不可用；缺陷修复面，改动与读数见下条）。

### 轻通道笔（2026-10-10 16:47 · 主 agent）：join 重名面缺陷修复

- **披露**：**此笔 = 轻通道**（缺陷修复面——实现与设计「join 面逐句人话」口径相抵：重名时把 SQLite 原文透给操作者）。
- **来源** = #147 轮2 上抛 🟡（服务端 sandbox 面，非其本档）⇒ 设计 token 已不可用（实测 spawn 被拒）⇒ 父侧亲办。
- **改动**：`thincoder-server/src/sandbox/registry.mjs:230-242`（INSERT 包 try/catch：`UNIQUE … sandbox_runners.name` ⇒ 人话 `runner 名「<名>」已存在——请改用 --name …或在控制台清理旧记录`；其余错误原样抛）+ 批内件 `…-runner-io.test.mjs` 腿 G 补断言（重名 join ⇒ 400 人话 ∧ 零 `UNIQUE|sandbox_runners|Sqlite`）。**可达 / 回滚** = 可 revert（两处点改）。
- **走查读数**：`node --test`（两件）⇒ **14/14 绿 · EXIT 0**（新断言在腿 G 内 ⇒ 非空转：修前该断言的两条正则均不命中）。
- **冻结**：本笔生效；随本批收口（§6）核销。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（两域档 SANDBOX.md ∥ RUNNER.md + 六档随动 + 本档 B1–B14；14:23/14:24 裁定收正落档（§10 ⇒ 已裁决策 ∥ §1/§14 可用性门限定 + 零依赖句）；doc-check 复跑 EXIT 0）
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

【fix 轮补记（2026-10-10 14:23 ∥ 14:24 裁定落档——用户「都按建议」+「thincoder server启动应该是不依赖沙盒的」）】

- **U1–U5 五条已于 2026-10-10 14:23 裁定**（用户「都按建议」= 设计建议逐条获准）——逐条裁定值见 §1 · 14:23 裁定节（本表不重复叙述）。设计档同拍收正：`docs/server/design/sandbox/SANDBOX.md` §10（标题/导语/表头/五行 ⇒「已裁决策」）+ §4/§5/§8 三处标签 ∥ `docs/server/design/sandbox/RUNNER.md` §4.1/§7 两处标签。本节保留设计轮原文（append-only——文中「未裁点」字样 = as-of 设计轮状态，均已由本补记 + §1 标注裁定）。
- **server 启动零依赖沙盒（用户 14:24）**：`docs/server/design/sandbox/SANDBOX.md` §1 补「server 启动与运行零依赖沙盒/runner」句；§1/§14 可用性门显式限定「仅沙盒功能面不可用」；`docs/server/design/sandbox/RUNNER.md` §2 同拍互引。机制句零改。
- **披露 D1–D4**：用户未异议 ⇒ 按设计实施（设计档披露段保持）。
- doc-check（`node scripts/doc-check.mjs` · 仓根 `thincoder/`）复跑 = EXIT 0（锚 0 悬空 ∥ 行宽 OK——2026-10-10 收正轮读数）。

【fix 轮补记——设计评审轮 1 修正（2026-10-10）· eng-designer】

- **来源** = 批档 §3 轮次 1（十五发现：1–14 采纳 ∥ 15 既定声明零动作）+ 用户 14:56 直令并入 A 节（A1 成员面 ∥ A2 加入流程三件 ∥ A3 牵连计数同拍）。**零新语义**（发现直接导出项 + 用户直令）；产品码零触。
- **落档六档**（逐档变更记录各留一行；机制全文 = 各档对应节）：
  1. `sandbox/SANDBOX.md`：#1 每工作区覆写落机制（`limits_json` ∥ PATCH 写端点 ∥ 取值序 = 全局默认 ⇒ 逐键覆写 ⇒ create 载荷；N45）· L35-36 ∥ #2 默认单单源 = `sandbox_rules` 种子行（settings 撤键）∥ #3 冲突序限定「显式 deny 恒先 + 种子 deny ≺ 显式 allow」（§4/§10）∥ #4 轮换 = 卷保留的容器重建（P13 补新 key 半支 ∥ E31 随正）∥ #5 join token 落点 = 进程内存（重启作废）+ 失败三态人话 + 失败审计行——L41 ∥ #6 `requireRunner` 守卫落点 = `accounts/session.mjs`（预算行 ≈+12——L210）∥ #8 AC-36 标记收正 ∥ #10 指令悬挂回收（幂等回 `queued` ∥ `exec` ⇒ `failed`——L49；B41）∥ #11 预算归属句 ∥ #13 P8 结构判据（canary 真值不下行）∥ #14 settings 值形逐键；A1/A2 成员面 + 加入流程三件（§8——L104/L108）。
  2. `sandbox/RUNNER.md`：#3 恒拒/种子分列 + 显式 deny 恒先 ∥ #4 env 行轮换注 ∥ #6「取值来源」句（create 载荷已解析——L43）∥ #9 PIN 建连（以已校验 IP 建连——不再重解析 ∥ SNI/Host 携原域名——L67）+ KD-SV-75（L138）∥ `package.json` 预算行（bin 第二入口——L124）。
  3. `gateway/API.md`：#1 `PATCH /api/admin/sandbox/workspaces/:id`（L124——键级合并/`null` 删键/生效面）∥ #2 settings 行重写（值形逐键；「默认单」非本表）∥ #5 join 行补落点 + #5/#6 三态人话与失败审计 ∥ #8 AC-36 标记收正 ∥ #11 §1 方法面补全 + 前端静态面行 `views-*` ⇒ 十四档（L20）∥ #12 `errors.mjs` 实读 64 收正（L186）+ 小计 §13 ⇒ §14 ∥ **增 §2.7 沙盒成员面**（L147——单端点、恒本人过滤）。
  4. `store/STORE.md`：#2 v11 段 `limits_json` 列（L263）+ settings 注释收正 + ③ 种子注（L317——本段一次性写入、不复活）∥ #12 §3 判据补行（L347——种子八行 + 覆写列）∥ v10 段消费句收正（审计页现状十二型——L238）。
  5. `webui/WEBUI.md`：#7 审计十型 ⇒ **十二型**（下拉 + 映射集 + 两型模板——L153/L537）∥ #1/#14 工作区写入口 = 每工作区覆写（§2.8）∥ #8 AC-36 标记收正 ∥ A1 **增 §2.9 我的·工作区**（L540——`views-me-sandbox.mjs` 拟新增 ≈120——L583；`me.sandbox.*` 键）∥ A3 牵连计数（档目 ⇒ **33 ∥ 34** ∥ 我的 4 ∥ 管理 8 ∥ 小计 ⇒ ≈+833——L598/L606）。
  6. `ops/OPS.md`：#6 `bin` 第二入口（L115）∥ #5 装机三步 ③ 加入流程三件（可复制命令 ∥ 有效期可见 ∥ 失败逐句人话 + 失败审计行——L229）。
- **机检**（验收 ④）= `node scripts/doc-check.mjs` ⇒ **EXIT 0**（锚 0 悬空 ∥ 行宽 0 超 300 ∥ 行数面差异 1 条 = 报告态）。
- **上抛（越出本轮六档，未触）**：`design/PROJECT.md` :261/:395（档目 32 ∥ 33 陈值）/ :434（AC-36「待需求档落」旧标记 + 「deny 先」）/ :576（变更记录链值——历史面）/ §1 定位句（侧栏十一页）/ §2.1 webui 行（三十三档 ∥ `views-*` 十四档 ∥ 全目录三十四档）—— 需「父侧落」或另开一轮 ∥ `requirements/PROJECT.md` AC-12（我的 3 ⇒ 4 ∥ 沙盒批后 32 ∥ 33）∥ AC-14（32 ∥ 33）—— 需求档 = 父侧笔，未触。

【fix 轮补记——checkpoint 通路口径裁定落档（2026-10-10 15:3x）· eng-designer】

- **来源** = 实现轮上抛（设计相抵：快照上送 ≤200 MiB（`sandbox/RUNNER.md` §6 ∥ `sandbox/SANDBOX.md` §13 B40）vs 网关全局 `Content-Length > 32 MiB ⇒ 413`（`thincoder-server/src/gateway/server.mjs` ∥ `gateway/API.md` §3）——>32 MiB 二进制两说相抵；**两轮设计评审均未覆盖此点**）+ 父侧裁定（五要点：① octet-stream 仅此路由豁免 JSON 门 ② 路由级 200 MiB（超 ⇒ 413——沿用现码）③ 流式落盘 ④ 鉴权沿用 runner 令牌 ⑤ 零第三方依赖不变；判 A 面——不抬全局 ∥ 不砍快照）。**零新语义**（裁定直接导出项）；产品码零触。
- **落档四档**（逐条 = 交付报告）：
  1. `gateway/API.md`：§2.6 checkpoint 行补通路口径 ∥ §3 413 句补路由级例外 ∥ §4 `server.mjs` 行随拍（实读 192 ⇒ ≈206——+≈14）∥ §5 沙盒行 + §7 增 B27（E7 通则保持）。
  2. `sandbox/RUNNER.md` §6：上送口径同拍（octet-stream 流式体 ∥ 路由级上限 200 MiB——与本地跳过阈值同值）。
  3. `sandbox/SANDBOX.md` §5：上送句补通路口径；§13 B40 保持（未触——与路由上限同值）；§14 未列 gateway 档（「如该表列 gateway 档」条件未命中——无随拍项）。
  4. `design/PROJECT.md`：§5 增 **KD-SV-77**（全形四列）∥ §4 索引标题 1–76 ⇒ **1–77** + 索引行 ∥ §2 无适用行（架构总览未涉写门/体限句——已核）。
- **预算追记**：`gateway/server.mjs` 实读 192 ⇒ **≈+14**（门豁免 ∥ 路由级限）⇒ ≈206；本批产品面小计 ≈+3998 ⇒ **≈+4012**（§6 板账块与 total 行随实施轮回填——本单未触其余面）。
- **残差/上抛（未触——报告面）**：① `ops/OPS.md` §5.6 nginx 样例 `client_max_body_size 32m`——runner 通道若经反代 ⇒ >32 MiB 上送被先挡（收口轮真机前宜裁）；② `accounts/ACCOUNTS.md:91` ∥ `client/CLIENT.md:22` ∥ `metering/METERING.md:61` 三处前言「写端点仅收 application/json」（含「分派层统一」）在该豁免后属全局表述残留（建议后续轮点修）；③ 实施轮随码随拍 = `server.mjs` 头注/注释（32 MiB 句）∥ `requiresJsonWrite`/`exceedsBodyLimit` 路由化。
- **机检** = `node scripts/doc-check.mjs`（仓根 `thincoder/`）⇒ **EXIT 0**（0 悬空 ∥ 0 超宽——FAIL 零行）。

【fix 轮补记——与 core 关系裁定落档（2026-10-10 15:3x）· eng-designer】

- **来源** = 父侧裁定（2026-10-10 15:28——用户指示 + 评估结论）「共有机制从核引；服务端专有域自持」；更正对象 = 原设计把 KD-SV-2（论证仅覆盖网关面）写成全树禁令（`design/PROJECT.md:14` ∥ `:71`——论证射程 ≪ 禁令射程）。**零新语义**（口径与范围收正）；产品码零触；其余档零触（`gateway/API.md` 等 = 另一单 #141）。
- **落档一档**（逐条 = 交付报告；行号 = 收正后实读）：
  1. `docs/server/design/PROJECT.md`：§1 零依赖句（`:14`——零第三方运行期依赖；删全树不引核句）∥ §2.3 裁定形（`:71–72`——逐面 + 判据一句；`:73–74` 原两句经核相容未触）∥ §4 索引 KD-SV-2 行范围限定「网关（provider 层）不引」（`:97`）+ 增 KD-SV-78 行（`:173`；标题 `:92` 1–77 ⇒ **1–78**）∥ §5 KD-SV-2 行同限定（`:180`）+ 增 KD-SV-78 全形行（`:182`）∥ §7 非功能行随正（`:441`）∥ 变更记录行（`:583`）。
- **报告面发现（未触——#141 射程）**：`ops/OPS.md:45` ∥ `:49` ∥ `:284` 与 `webui/WEBUI.md:647` 四处 KD-SV-2 引用仍按全树/宽读法书写（「运行时 import 被 KD-SV-2 禁」类）——建议 #141 一并收正。
- **机检** = `node scripts/doc-check.mjs`（仓根 `thincoder/`）⇒ **EXIT 0**（锚 0 悬空 ∥ 行宽 0 超 300 ∥ 行数面差异 1 条 = 既有报告态）；本档 `不 import ∥ 全树 import ∥ import 仅` grep = 0 命中。

**【fix 轮补记 · 残差对齐（收口前；同族三支合并）· eng-designer · 2026-10-10】**

- **来源（父侧两拍，同轮）**：① 本批 §2 残差项 ①/②（KD-SV-77 路由级豁免入册后的收口前对齐）；② 评审 #143 交卷点出的 KD-SV-2 同族残留（KD-SV-78 裁定后换依据——四处按旧口径书写，与新裁定相抵；**换依据，不删观点**）。**零新语义**（三支均为已裁事项的残差对齐）；产品码零触。
- **残差项 ① · 反代层（路由级豁免落形）**：
  - `docs/server/design/ops/OPS.md:202-203`（§5.6 反代样例 ①）——**择形 = 按 location 分路由**：缺省 `client_max_body_size 32m` 保持（其余路由从严）∥ 快照路由例外 = `location = /api/runner/checkpoint` 块 `client_max_body_size 200m`（= 路由级上限 200 MiB 同值——`gateway/API.md` §2.6；≤200 MiB 上送不被反代先挡）。
  - **择形判据**（父侧委任项）：快照通道 ≤200 MiB 上送不被反代先挡 ∥ 豁免面不扩（全站默认仍 32m——与 KD-SV-77「全局 32 MiB 通则不动」同判）。**被否 = 全局抬 ≥200 MiB**（放宽全部路由的反代层首闸——最宽解）。
  - `docs/server/design/ops/OPS.md:290`（§8 KD-SV-25 行同拍：body 上限 = 缺省 32m ∥ 快照路由 200m）。
- **残差项 ② · 端点 JSON 门例外括注（三处同字）**：`docs/server/design/accounts/ACCOUNTS.md:91` §3 ∥ `docs/server/design/client/CLIENT.md:22` §2 ∥ `docs/server/design/metering/METERING.md:61` §3——**例外** = `POST /api/runner/checkpoint`（octet-stream——`gateway/API.md` §2.6）。
- **评审 #143 · KD-SV-2 同族引核收正**：`docs/server/design/ops/OPS.md:45` ∥ `:49`（§1 预设覆盖面行 ∥ 漂移纪律行）∥ `:285`（§8 KD-SV-17 行）∥ `docs/server/design/webui/WEBUI.md:647`（§7 KD-SV-34 行）——「被 KD-SV-2 禁」/「KD-SV-2」⇒ **引核口径 KD-SV-78**（KD-SV-2 范围 = 网关（provider 层）面——`design/PROJECT.md` §5）；自持快照口径（KD-SV-17 ∥ 对照取数 = 只读、非运行期依赖）零变。
- **变更记录行（五档）**：`ops/OPS.md:384-385`（两行）∥ `accounts/ACCOUNTS.md:231` ∥ `client/CLIENT.md:84` ∥ `metering/METERING.md:171` ∥ `webui/WEBUI.md:764`。
- **机检**：`node scripts/doc-check.mjs`（仓根 `thincoder/`）⇒ **EXIT 0**（锚 0 悬空 ∥ 行宽 0 超 300 ∥ 行数面差异 1 条 = 报告态〔既有〕）。
- **写面**：上述五档 + 本 §2 段；**零触** = 产品码 ∥ sandbox 四档（他单已落）∥ 登录面批八档（冻结）∥ `design/PROJECT.md`（KD-SV-78 他单已落）。
- **残差/上抛（报告面，本单未触）**：① `thincoder-server/README.md:226` 完整样例仍 `client_max_body_size 32m;`——真机实际消费面（= OPS §5.6「完整样例 = README §11」所指），**产品面/另轮同拍**；同拍注意批断言件 `docs/batches/2026-10-06-first-release-completeness.test.mjs:354`（现断 `client_max_body_size 32m`——默认行保留该字面 ⇒ 现断言不破；若 README 增 200m 路由行 ⇒ 断言面评估随行）。② `server.mjs` 头注/注释 32 MiB 句 = 实施轮随码随拍（前块在册）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 需求覆盖 | 🔴 | 需求明列「⑤ **资源与 TTL 配置**：全局默认 ∥ 每工作区覆写。」（`thincoder/docs/server/requirements/PROJECT.md:297`），两档也各自声明了写入口——「写入口 = 每工作区资源档 cpus/mem/pids/diskMb」（`thincoder/docs/server/design/sandbox/SANDBOX.md:95`）∥「写入口 = 每工作区资源档（cpus/mem/pids/diskMb）」（`thincoder/docs/server/design/webui/WEBUI.md:527`）——但该机制在对象模型、端点表、执行面三处均无落点：`sandbox_workspaces` 列无资源/TTL 承载（`thincoder/docs/server/design/store/STORE.md:255`），API §2.5 创建体仅 `{ name, ownerMemberId, requiredLabels? }`、全表无写端点（`thincoder/docs/server/design/gateway/API.md:122`），RUNNER 资源取值全为全局设置项（如「限额（设置项 `diskMb`）」（`thincoder/docs/server/design/sandbox/RUNNER.md:75`））。 | 给「每工作区资源档」落三件（承载列 ∥ 写端点 ∥ runner 取值序——含 create 载荷字段）；或按需求口径明撤该写入口并同步 §8 ∥ WEBUI §2.8 ∥ 需求 ⑤ 行——二选一、单源对齐。 |
| 2 | 文档归属/一致性 | 🔴 | 「默认单」的存储/改径两述并存、无对账句：SANDBOX §2 把「默认单」列为 `sandbox_settings` 键（`thincoder/docs/server/design/sandbox/SANDBOX.md:30`——「待批超时 ∥ 默认单 ∥ 镜像名 ∥ 加入令牌 TTL」）——STORE v11 注释与 API settings 行同拍（`thincoder/docs/server/design/store/STORE.md:309` ∥ `thincoder/docs/server/design/gateway/API.md:126`）；同档 §8 又把「默认单 = `source=default` 行可改」写作 `sandbox_rules` 行为（`thincoder/docs/server/design/sandbox/SANDBOX.md:96`），STORE 的 `source` CHECK 含 `default`（`thincoder/docs/server/design/store/STORE.md:274`）、B38 用「采纳 ⇒ 并入默认单种子」（`thincoder/docs/server/design/sandbox/SANDBOX.md:182`）。 | 定点唯一存储与改径（settings 键 ∥ rules 行二选一），另一处删/随正；若两存为有意，补同步句（写入点 ∥ rulesRev 触发 ∥ 审计落型 ∥ runner 全量拉取形）。 |
| 3 | 一致性/求值序 | 🔴 | 出站冲突序两述不一：§4 述无条件「**冲突序**：**deny 恒先于 allow**（同一目标两者皆中 ⇒ 拒）」（`thincoder/docs/server/design/sandbox/SANDBOX.md:54`），同档 §10 U2 读法注取「deny 恒先仅对显式 deny」（`thincoder/docs/server/design/sandbox/SANDBOX.md:121`）、执行面同拍「显式 deny 恒先于 allow」（`thincoder/docs/server/design/sandbox/RUNNER.md:56`）；§4 又与「内网/固定 IP 后端 = 显式加 allow 条目」（`thincoder/docs/server/design/sandbox/SANDBOX.md:51`）并置——种子 deny（RFC1918 等）＋显式 allow 的裁定两处相反，按 §4 字面实现即与 U2 裁定相抵。 | 把 §4 冲突序句限定为「显式 deny 恒先」，并把「种子 deny ≺ 显式 allow」的相对序写进同一求值序（RUNNER §4.1 随拍）。 |
| 4 | 清晰度/可行性 | 🟡 | 轮换新 key 的注入机制缺：「吊销旧 key（`revokeKey`）+ 签发新 + 随指令下发（无需重建盒即可下次调用生效）」（`thincoder/docs/server/design/sandbox/SANDBOX.md:86`），但工作区 key 走创建期 env 注入（`thincoder/docs/server/design/sandbox/RUNNER.md:40` 的 `OPENAI_API_KEY=<工作区 key>`）——容器 env 运行期不可变，新 key 到达盒内的路径未述；P13 只覆盖旧 key 401 半支（`thincoder/docs/server/design/sandbox/SANDBOX.md:164`）。 | 明写注入路径（如新 key 落卷内文件 + 盒内读取约定；或口径收正为「轮换后重建盒生效」），并给 P13 补「新 key 可用」半支。 |
| 5 | 覆盖/清晰度 | 🟡 | join 令牌的一次性状态无落点：流程述「一次性 ∥ 缺省 30 分钟有效」（`thincoder/docs/server/design/sandbox/SANDBOX.md:38` ∥ `thincoder/docs/server/design/gateway/API.md:120`），但 v11 七表只存 runner 令牌 hash（`thincoder/docs/server/design/store/STORE.md:245`），无 join 令牌承载；E30 需「join token 过期 ∥ 复用 ∥ 伪造」（`thincoder/docs/server/design/sandbox/SANDBOX.md:186`）之判据状态——落点（内存 ∥ 表）与重启作废语义未定。 | 钉落点与语义（进程内存 + 重启作废明写，沿登录防护计数先例；或落表），E30/N40 判据随拍。 |
| 6 | 清晰度/触点注释面 | 🟡 | 新守卫落点未钉：「独立守卫 `requireRunner`——沿 `requireAdmin` 形」（`thincoder/docs/server/design/sandbox/SANDBOX.md:39` ∥ `thincoder/docs/server/design/sandbox/SANDBOX.md:107`「`requireRunner`（新守卫——§3）」），§14 预算表（`thincoder/docs/server/design/sandbox/SANDBOX.md:191`）未列 `thincoder-server/src/accounts/session.mjs`、亦未列守卫独立档；第二入口 `thincoder-runner` 的包面注册行（`package.json` bin 面）亦未入任一预算表（该档未读——unverified）。 | 钉守卫落点（现档落 ⇒ 补当前行数 + 增量注释；新档落 ⇒ 入预算表）；包面注册行补入触点（或明写归发布面批）。 |
| 7 | 文档状态（随动） | 🟡 | WEBUI 内部随动两处未收：§2.3④ 审计过滤仍「类型下拉（全部 + **十型**）」（`thincoder/docs/server/design/webui/WEBUI.md:151`），而 v11 已「十型 ⇒ 十二型」（`thincoder/docs/server/design/store/STORE.md:313`）且 §2.8 已称「增两型模板」（`thincoder/docs/server/design/webui/WEBUI.md:535`）；§2.2 错误映射集枚举未含新码（枚举止于「`too_many_attempts` ∥ `rate_limited`（模型限流——429）」（`thincoder/docs/server/design/webui/WEBUI.md:79`）），而 §2.8 称「新码 `sandbox_unavailable`（503）入 `err.*` 映射集」（`thincoder/docs/server/design/webui/WEBUI.md:533`）。 | 两处随正（十型 ⇒ 十二型；映射集枚举补 `sandbox_unavailable`）。 |
| 8 | 文档状态（跨档标记） | 🟡 | 「建议编号 AC-36——待需求档落」标记已过期：API §5 沙盒行（`thincoder/docs/server/design/gateway/API.md:193`）与 WEBUI §6 沙盒行（`thincoder/docs/server/design/webui/WEBUI.md:621`）仍标待落，而需求档已落 AC-36（`thincoder/docs/server/requirements/PROJECT.md:244`「功能点 36（执行沙盒——#1215 前置硬题；2026-10-10 沙盒批回笔）」）。 | 两行标记收正为「已落需求档」（或去注记），与 PROJECT.md AC-36 行同拍。 |
| 9 | 清晰度（安全机制） | 🟡 | 代理层求值未钉「校验后连接不重解析」：§4.2 述「每个解析 IP 过 CIDR 闸」「全过 ⇒ 连接」（`thincoder/docs/server/design/sandbox/RUNNER.md:66`）——连接若按域名重解析（CONNECT 语义），校验—连接间的解析差（DNS rebinding）可绕过两闸，与「禁单/deny 命中 ⇒ 拒」的防绕过表述相抵（威胁模型含 SSRF 打内网/云元数据）。 | 明写以已校验 IP 建连（PIN）+ Host/SNI 携带口径；或明写不处理重解析的理由与风险登记。 |
| 10 | 清晰度（边界） | 🟡 | 指令悬挂无回收口径：`sandbox_tasks` 具 `status`/`claimed_at`（`thincoder/docs/server/design/sandbox/SANDBOX.md:28`），但 runner 死亡/排空（牲口语义下常态——排空仅述「runner 收旗后停盒（在跑指令收尾）」（`thincoder/docs/server/design/sandbox/SANDBOX.md:64`））后已领任务的超时回收/重派/控制台可见均未述（仅 create 明写幂等（`thincoder/docs/server/design/sandbox/RUNNER.md:43`））。 | 补 claimed 超时与回收/重派判据（含非幂等 kind 的处置）与控制台可见口径。 |
| 11 | 文档卫生 | 🔵 | 指针/枚举三处笔误：API §4 小计行把 sandbox 域预算指为「预算 = `sandbox/SANDBOX.md` §13 ∥ `sandbox/RUNNER.md` §9」（`thincoder/docs/server/design/gateway/API.md:175`——§13 = 用例节，预算实为 §14）；SANDBOX §14 称「webui ∥ deploy ∥ 批内件预算 = 批档 §2」（`thincoder/docs/server/design/sandbox/SANDBOX.md:206`——WEBUI §5 ∥ RUNNER §9 已列各该预算）；API §1 沙盒控制台面行只列「`GET/POST /api/admin/sandbox/*`」（`thincoder/docs/server/design/gateway/API.md:17`）而 §2.5 含 PATCH/DELETE（他族行均列全方法）。 | 三处随正（§13 ⇒ §14；归属句与实列对齐；方法列表补全）。 |
| 12 | 数值漂移 | 🔵 | `gateway/errors.mjs` 行数两读不一：SANDBOX §14 标「（已落盘 64）」（`thincoder/docs/server/design/sandbox/SANDBOX.md:202`）vs API §4 标「实读 63（2026-10-07——清账批复读）⇒ ≈66（server-exec-sandbox 批：`sandbox_unavailable` +≈2——实读待回填）」（`thincoder/docs/server/design/gateway/API.md:174`）。 | 择一实读并两档同拍（顺带把 ≈66 实读回填）。 |
| 13 | 备注（探针可执行性） | 🔵 | P8 canary 来源未明：跑法为 runner 侧 `thincoder-runner probe --workspace <id> --probe <P#>`（`thincoder/docs/server/design/sandbox/SANDBOX.md:148`），判据用「全盒扫描真 provider key 串作 canary」（`thincoder/docs/server/design/sandbox/SANDBOX.md:159`）——真值若随探针下行，provider 密钥（网关代持面）须达 runner 机；若无真值，则「零命中」不可机检。 | 明写 canary 取值形与通道（或改结构性判据：密钥形态扫描 + env 白名单比对），并随写与密钥面纪律的相容句。 |
| 14 | 备注（接口形） | 🔵 | `sandbox_settings` 值形未定：列为 `v TEXT NOT NULL`（`thincoder/docs/server/design/store/STORE.md:310`）——limits/默认单 等复合值与标量的序列化形、GET/PATCH 逐键读写形未述（§8 逐键 UI 写入口已在册）。 | 补值形对照（键 → 形 ∥ JSON 序列化口径）并入 API §2.5 settings 行。 |
| 15 | 备注（评审基准） | 🔵 | 评审上下文未声明项目标准档与文档地图（六档自引 `design/PROJECT.md` §3 为文档地图——域外档未读）：方法学合规按 AGENTS.md 与在档惯例判定；文档归属仅按六档互校——判据覆盖受限（声明在案）。 | ——（基准限制声明，无改法）。 |

计数：🔴 3 ∥ 🟡 7 ∥ 🔵 5（合计 15）。

VERDICT: changes-required

### 轮次 2（评审子代理）

复核对象（轮次 2）= 轮次 1 发现 #1–#14 + A 节三件（A1 成员面 ∥ A2 加入流程三件 ∥ A3 牵连计数）之修复复核。逐号核验结论：#1–#14 全部在位（#1 每工作区资源档 = `limits_json` + `PATCH /workspaces/:id` + create 载荷取值序 + N45 ∥ #2 默认单单源 = `sandbox_rules` 种子行（settings 撤键）∥ #3 显式 deny 恒先 + 种子 deny ≺ 显式 allow ∥ #4 轮换 = 卷保留重建 + P13 两半支 ∥ #5 join token 落点 = 进程内存（重启作废）∥ #6 `requireRunner` 落点 + 预算行 + `package.json` bin 行 ∥ #7 十二型 + 映射集补码 ∥ #8 AC-36 标记收正 ∥ #9 PIN 建连 ∥ #10 指令悬挂回收 + B41 ∥ #11 §14 指针/方法面/归属句三处 ∥ #12 `errors.mjs` 64 两档同拍 ∥ #13 P8 结构判据 ∥ #14 settings 值形逐键）；A1/A2 在位（`#/me/sandbox` + `GET /api/me/sandbox/workspaces` 恒本人过滤 + 待批提示；加入令牌三件四档同拍）；A3 主链在位（档目 33 ∥ 34 ∥ nav 我的 4 ∥ 管理 8）——残差见下表。无 🔴。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 数值漂移（计数面·A3 残差） | 🟡 | A1 成员页（`#/me/sandbox`）入册后需求档两处页数未随正：`thincoder/docs/server/requirements/PROJECT.md:60` 仍为「我的三页」+「侧栏合计 ⇒ **十一页**」、`:65` 链尾仍为「⇒ **十一页**（2026-10-10 沙盒批——执行沙盒管理页）」；同档 AC-12 已为「我的 **4**（2026-10-10 沙盒批——成员沙盒页 `#/me/sandbox`）」「**8**（2026-10-10 沙盒批——执行沙盒页）」、设计档为「**覆盖范围**：十二页 + 登录」（`thincoder/docs/server/design/webui/WEBUI.md:82`）⇒ 现行值应为 12（我的四 + 管理八）——A3「牵连计数随正」之残留。 | 两处收正：§2:13「我的四页 ∥ 侧栏合计 ⇒ 十二页」；§2:14 链尾沙盒步「⇒ 十二页（管理页 + 成员页）」——与 AC-12 ∥ WEBUI.md §2.2 对齐。 |
| 2 | 数值漂移（i18n 键族计数） | 🔵 | 沙盒批 i18n 计数两处未对账：① system 部件口径不一——「（system 部件 +2/表）」（`thincoder/docs/server/design/webui/WEBUI.md:125` ∥ `:536`）vs「（沙盒批：审计两型 +≈4 键）」（`:592` ∥ `:597`）与小计「i18n system 两部件 +≈4/表」（`:598`）；② 新码已列映射集「`sandbox_unavailable`（沙盒不可用——503）」（`:80`），但键族登记 shell 部件仅「（shell 部件 +2）」（`:125`——nav 两键）——`err.sandbox_unavailable` 未入任何计数位。 | ① 两口径择一对账（审计两型 = 2 键 ⇒ +2/表；若详情模板另需键名 ⇒ 补登）；② shell 计入 `err.sandbox_unavailable` 或明写免计口径——表体量/小计同拍。 |
| 3 | 清晰度（术语/承载） | 🔵 | 「端侧」措辞与承载面不一致：需求「其端侧可见「等待管理员批准」类提示」（`thincoder/docs/server/requirements/PROJECT.md:307`）、设计「**待批发起方提示** = `pending` 在场 ⇒ 端侧「等待管理员批准」提示」（`thincoder/docs/server/design/sandbox/SANDBOX.md:108`；同句承载 = 「承载 = `webui/WEBUI.md` §2.9 `#/me/sandbox`」）；而仓内「端侧」= CLI ∥ VSC ∥ 桌面（`requirements/PROJECT.md:262`「任何端侧能力面必须在**同一批**落齐 CLI ∥ VSC ∥ 桌面」）——单读可解为三端提示面（本批未做、不在射程）。 | 措辞统一为「成员侧（控制台成员页）」；或明写三端提示条目随 #1215/端侧批——免实施轮按「端侧」误扩面。 |
| 4 | 清晰度（#1 收正残口） | 🔵 | RUNNER 值源句未随 #1 收正：`thincoder/docs/server/design/sandbox/RUNNER.md:76` 仍写「每工作区 project id + 限额（设置项 `diskMb`）」，同档取值序已定「资源/TTL 相关旗值 = create 指令 payload（控制面已解析：全局默认 ⇒ 逐键叠加工作区覆写——`SANDBOX.md` §2）；runner 侧零回落逻辑」（`:43`）——单读 §5 ① 易误读为恒取全局值（覆写失效）。 | §5 ① 补注「值 = create 载荷（覆写优先）」或去「设置项」括注——与 §3 取值来源句同拍。 |
| 5 | 文档卫生（措辞移位） | 🔵 | `thincoder/docs/server/design/webui/WEBUI.md:546`「**不做**：成员写面；待批裁定/出站规则（admin 面——§2.8）；盒内交互；多语言键族 = `me.sandbox.*`（两表逐键同步——en 零 CJK）。」——i18n 键族为正项（键族登记 `:124` ∥ §5 `:590`/`:595` 在册），并入「不做」清单后单读与在册事实相抵。 | 拆为独立「文案」句（沿 §2.8 `:536` 结构）或移出「不做」清单。 |
| 6 | 备注（评审基准） | 🔵 | 评审上下文未声明项目标准档与文档地图（工作区结构 = AGENTS.md；判据 = 本批复评各档互校 + 域目录惯例）——方法学合规与文档归属的判据覆盖受限（声明在案）。 | ——（基准限制声明，无改法） |

域外注（无严重度）：① 需求档 AC-36 ⑨/⑩（托管接入 ∥ server 端 agent 执行者）在册而两域档尚无对应落点——据批档排程属后续设计轮，本复核不判；② `design/PROJECT.md`、批档与批内件等域外档不在本复核射程（仅作上下文参照）。

计数：🔴 0 ∥ 🟡 1 ∥ 🔵 5（合计 6）

VERDICT: pass

## §4 用户批准（主 agent）

**§4 用户批准（主 agent 代签）**——用户 2026-10-10 15:04「那后续自动跑吧。」全链授权（自缚四条在 §1）。

- **三条件齐备** ✓：① 评审 **pass**（§3 轮次 2——🔴 0 ∥ 🟡 1 ∥ 🔵 5；轮次 1 = changes-required（🔴3）⇒ 修正轮 #136 落地 + 父侧逐号核验 ✓）；② 修正落地并逐条核验 ✓（抽查 + `doc-check` EXIT 0 亲跑）；③ **token 已签发** ✓（凭据值不落档——沿纪律）。
- **依据**：轮 1 发现 14 + A 节三件全清（🔴 归零）；轮 2 新发 🟡1（需求档页数/措辞残差——**父侧笔域当场 Fixed**：§2:13 我的四页+十二页 ∥ §2:14 十二页 ∥ 成员面句「端侧」⇒「成员侧」）+ 🔵5（**非阻断**——i18n 计数对账 ∥ RUNNER 值源括注 ∥ WEBUI「不做」清单措辞 ∥ 基准声明；并入下一设计增量轮）。位次：i18n 计数对账中「系统部件 +2/表」为正确值。
- **实施**：控制面/服务面 = eng-coder（本档 §5 记录其落点）；执行面（runner）∥ webui 页 = 后续单。**真机验收（P1–P14）** = 收口轮前置（现无 runner 机 ⇒ 不假装通过——挂 §6）。

## §5 实施记录（eng-coder）

**状态行**：实施完成（审计 1 轮 + 代码评审 3 轮（末轮 pass）；终态 clean；仓套件待父侧收口轮）

### 5.1 面与文件（逐档实读）

**新增（5 控制面档 + 批内件）**：

| 档 | 行数（实读） | 设计估 | 角色 |
|---|---|---|---|
| `thincoder-server/src/sandbox/rules.mjs` | 436 | ≈230 | 规则单源/校验/审计/修订号/求值序 ∥ 待批队列（§4/§6） |
| `thincoder-server/src/sandbox/registry.mjs` | 513 | ≈250 | runner 注册/健康/可用性 ∥ 放置 ∥ 任务队列（含悬挂回收）∥ 设置与覆写 ∥ 盒读数/载荷（§3/§5/§8） |
| `thincoder-server/src/sandbox/runner-api.mjs` | 362 | ≈230 | `/api/runner/*`：join/心跳/长轮询/上报/待批登记/快照上送+取回（§3） |
| `thincoder-server/src/sandbox/routes.mjs` | 424 | ≈270 | `/api/admin/sandbox/*` 六面 + `/api/me/sandbox/workspaces`（§8/§9） |
| `thincoder-server/src/sandbox/credentials.mjs` | 32 | ≈80 | 工作区 key（签发/轮换/吊销——复用 accounts 面） |
| `docs/batches/2026-10-10-server-exec-sandbox.test.mjs` | 795 | ≈480 | 批内件（22 例；腿 A–J——见档头射程） |

**改（设计 11 件中 5 件 + 2 例外，均在本报告逐条列明）**：

| 档 | 实读 | 设计估 | 改动点 |
|---|---|---|---|
| `src/store/db.mjs` | 365（255 ⇒ +110） | ≈+90 | v11 段：七表 DDL + 审计 CHECK 重建（十型 ⇒ 十二型）+ 种子八行（deny 3 ∥ allow 5）；`MIGRATIONS` 追 `{ v: 11 }` 一段 |
| `src/accounts/session.mjs` | 109（96 ⇒ +13） | ≈+12 | `requireRunner` 第三门（沿 `requireAdmin` 形；runner 令牌只对 `/api/runner/*` 有效） |
| `src/accounts/audit.mjs` | 114（109 ⇒ +5） | ≈+3 | `AUDIT_TYPES` 十型 ⇒ 十二型（+`sandbox_rule`/`sandbox_event`）——**越单件（父侧 11 文件表外）**：型面单源需与 v11 DDL CHECK 同集，理由 = 不改则该批两新型无法写（CHECK 拒） |
| `src/gateway/errors.mjs` | 65（64 ⇒ +1） | ≈+2 | `sandbox_unavailable`（503——KD-SV-71） |
| `bin/thincoder-server.mjs` | 190（182 ⇒ +8） | ≈+6 | 两面注册行（`registerSandboxRoutes` ∥ `registerRunnerApiRoutes`）+ 3 行注释 |
| `src/gateway/server.mjs` | 257（192 ⇒ +65） | ≈+14（KD-SV-77 轮） | **写面 +1 档（父侧开工令）**：见 5.2 |
| `package.json` | ±0 | ±0 | `prepublishOnly` 清单 39 ⇒ 40（本批件入链；单行清单行数零变） |

### 5.2 checkpoint 通路口径（KD-SV-77——承父侧「上送通路开工令」逐条）

**① `POST /api/runner/checkpoint` 收 `application/octet-stream`（仅此路由豁免 JSON 门）** —— `server.mjs` 的 `requiresJsonWrite` 头部加一路由判（`isCheckpointUpload`）；`/api/*` 其余写端点型门零动（E7 判据保持）。

**② 路由级上限 200 MiB ⇒ 超 = 413 `payload_too_large`** —— `MAX_CHECKPOINT_BYTES = 200 MiB` 常量 + `bodyLimitFor(method, pathname)`（缺省 32 MiB）；分派层 `exceedsBodyLimit(req, limit)` 路由化（原为全局常量）；**其余路由 32 MiB 零松动**。

**③ 流式落盘（不整块缓冲）** —— 新增 `readStreamBody(req, { limit, onChunk })`（`server.mjs`——`readJsonBody` 的流式姊妹；逐块交调用方；超限 ⇒ 413 + 余体丢弃）；runner-api 侧边收边写 `<blob>.part`，写缓冲满 ⇒ `req.pause()` + `drain` 后 `resume()`（背压），**完整落盘后才 renameSync 入位**（半截档 = `.part`——取回面看不见）；异常路径 `out.destroy()` + 删 `.part`（超限 ⇒ 零落盘、零残档）。**本条为 server.mjs 的第 3 个改动点（父侧开工令列 2 点——原语落 body 读面同档 = 单源；实测 +≈42 行，见 5.4 面积差异）**。

**④ 鉴权沿用 `requireRunner`**；**⑤ 零第三方依赖**（`node:fs`/`node:path` 原生）。

**元数据通道（设计未钉——实施定）**：`workspaceId` 走 query（`?workspaceId=<id>&note=<text≤200>`）——体 = 不透明字节流，query/头是仅余的元数据通道；取回面（`GET /api/runner/checkpoint/:id`）照旧回落环头（`X-Checkpoint-*`）。**落盘位（设计未钉——实施定）**：`<库档目录>/checkpoints/ws<id>-<ts>-<rand>.blob`（`checkpointDirFor(config)`；单数据目录口径——与 `config.db` 同根）。**保留份数**：入位后按 `sandbox_checkpoints` 逆序保留 `checkpointKeep`（缺省 5）份——超出行删 + 档删。**审计**：`sandbox_event`（`detail.kind = "checkpoint"`，携 size/keep/dropped——SANDBOX §2 审计序列「快照」）。

**server.mjs 改动点清单（父侧要求列清）**：① 头注两处（32 MiB 句 ⇒ 「32 MiB；快照路由 200 MiB」+ 路由级豁免段）；② 三常量/助手（`MAX_CHECKPOINT_BYTES` ∥ `CHECKPOINT_UPLOAD_PATH` ∥ `isCheckpointUpload` ∥ `bodyLimitFor`）；③ `requiresJsonWrite` 豁免支；④ `exceedsBodyLimit` 参数化 + 分派点传 route 限；⑤ `readStreamBody` 新增（≈42 行）。

### 5.3 解释性读法（设计留白处的实施判定——逐条披露）

| # | 读法 | 依据/理由 |
|---|---|---|
| R1 | 盒状态存 `sandbox_runners.runtime_json` 心跳块：`{ version, runtime, runtimeAvailable, diskFreeMb, boxes }`；`labels_json = { labels, maxBoxes }` | 七表零盒承载（盒是瞬时面）；陈旧性由 `last_heartbeat_at` + health 明示（档头注） |
| R2 | `rulesRev` = 进程内存单调计数（重启复位 ⇒ runner 侧「不等即全量」） | SANDBOX §2「全局单调 +1」无落表要求；软状态族与 join 令牌/待批簿记同族 |
| R3 | 工作区名 ≤30 字符（`sandbox:<名>` key 名 ≤40）+ **名全局唯一**（`sandbox_workspaces.name` UNIQUE） | 名入 key 名（accounts 面 40 上限）；重名 ⇒ 400（控制台列表可读） |
| R4 | `rotate-key` = 吊销旧 + 签发新 + 入队 `destroy{deleteVolume:false}` + `create` + `start`（卷保留） | §7 + E31/P13；旧 key 重建前即失效（401） |
| R5 | `destroy` 需 `confirm: true`（dirty 时报文携快照数警示）+ 吊销工作区 key + 入队 `destroy{deleteVolume:true}` | E31「二次确认」；§7「销毁 ⇒ 吊销」 |
| R6 | join 三态人话（过期 ∥ 已用过 ∥ 令牌不对）+ 失败审计（kind = `runner_join_failed`）+ 只存 sha256 | §3/E30 明文 |
| R7 | 待批裁定经 poll 下发（「已下发」簿记 = 进程内存；重启 ⇒ 至多重发一次，按 id 幂等） | §6「≤1s 级下发」；软状态族同 R2 |
| R8 | 悬挂回收 = `claimed` 逾期（5 分钟常量）∧ runner 失联（3 拍缺）⇒ 幂等 kind 回 `queued`（`claimed_at` 留作重派标记）/ `exec` ⇒ `failed` + 原因 | §3 + B41 |
| R9 | `pending` 去重键 = workspace × host（大小写不敏感）open 行 ⇒ `hits++`；超时 = `first_seen_at` 超 `pendingTimeoutSeconds` ⇒ 懒惰结算（读面/裁定时顺手扫） | §6 + B38（三次批准建议由史派生） |
| R10 | 规则求值 rank：① 内置恒拒（127/8 ∥ 169.254/16——非行）② 显式 deny ③ 显式 allow ④ 种子 deny ⑤ 种子 allow ⑥ 默认拒；`priority` = 同 rank 内排序 | §4 冲突序（显式 deny 恒先 ∥ 种子 deny ≺ 显式 allow）；**同源 deny 恒先于同源 allow**（未明文处——沿「deny 恒先」通例） |
| R11 | 域名规则禁 IP 字面量（含 CIDR 形）；域名至少两级标签（`*.com` 类拒）；通配仅单层左 | B36 用例的形态外推（IP 段走 CIDR 规则） |
| R12 | 未放置工作区的动作（runner 在场但无满足/满盒）⇒ 503 `sandbox_unavailable` + 人话原因 | B35 写门同码；语义 = 暂不可执行（不降级） |
| R13 | 设置变更审计 = **`config_update`**（既有型；detail = 键名清单——值永不入） | SANDBOX §2 审计序列未列设置——用配置控制台既有的 config 变更型面（不新造 `sandbox_event` kind）；沿 `config-admin.mjs:175` 口径 |
| R14 | runner 删机（`DELETE /api/admin/sandbox/runners/:id`）：在绑工作区未确认 ⇒ 400；确认 ⇒ 在途指令作废（failed）+ 解绑 + 删行 + 重放置 | API §2.5「要求工作区已重建或 confirm: true 丢弃」 |
| R15 | 快照保留份数、`tmpfsMb`、`image`、`checkpointEveryMinutes` 等设置键缺省值 = 实施定值（控制台可改） | API §2.5 键全集/值形；缺省值未钉（§8 读数面） |
| R16 | 快照 `blob_path` 落 `<库档目录>/checkpoints/`（单数据目录）；备份面（`deploy/backup.mjs`）只覆盖库档——WIP 快照不入备份 | 设计未钉落点；披露：快照 = WIP 保护（三层之第二层），非持久资产 |

### 5.4 与设计的差异 / 面积

- **面积**：五新档 1767 行（估 1060——越估 707）；`db.mjs` +110（估 +90）；`server.mjs` +65（KD-SV-77 轮估 +14——差因 = 流式读体原语（`readStreamBody`，≈42 行）不在父侧改动点清单内，见 5.2）；`test.mjs` 795 行（估 ≈480；**≤800 自约达成**——2026-10-08 批 K2「新写批内件自约 ≤800」；越线源 = 22 例覆盖 + 逐条判据注释）。
- **零语义降级**：设计件全部落地；无「简化近似」（逐条对照 = §5.5 判据映射）。
- **段外披露**：`accounts/audit.mjs`（越单件——理由见 5.1）；`gateway/server.mjs`（父侧开工令授权）；两处实施读法（元数据通道/落盘位 = 设计未钉，5.2）。
- **未做（非本批）**：runner 执行面（`src/runner/**` + `bin/thincoder-runner.mjs` + `-runner.test.mjs`）——设计归执行面另批；`webui` 静态十四档（§2.8/§2.9——前端面另批）；真机探针 P1–P14（收口轮）。

### 5.5 验收判据映射（SANDBOX §11/§13 ↔ 腿）

N40/N41/N42/N43/N44(服务侧半)/N45 ∥ E29/E30/E31/E32(服务侧半) ∥ B27/B35/B36/B37/B38/B40(路由级上限)/B41 ∥ P11(下发零重建)/P12(裁定下发)/P14(可用性门) —— 逐条落腿：A(迁移/种子/十二型) · B(join 三态/心跳/长轮询) · C(建工作区/覆写/放置) · D(可用性门/E32) · E(B36/N42/B37 + 设置面) · F(N43/B38/P12) · G(B41) · H(E29/E31/成员面 §2.7) · J(B27/E7 通则) · I(链自检)。用例表 N44（runner 重启采纳既有盒）= 执行面；P1–P10/P13 真机支 = 收口轮。

### 5.6 验证读数

- `node --test docs/batches/2026-10-10-server-exec-sandbox.test.mjs`（cwd = `thincoder/`）：**22 例全绿**（含腿 J 新增 1 例）。
- `node --check` 逐档：11 档全绿（五新档 + db/audit/session/errors/bin + 批内件）。
- 残留清理：`.thincoder/tmp/sandbox-ckpt-*` 零残留（批内件自清）；`data/checkpoints` 零创建（生产缺省仅在真上送时建）。
- **仓套件不跑**（父侧收口轮唯一跑点——沿纪律）。

### 5.7 轮次与终态（待补：审计/评审后回填）

- 自查修正轮（实施中）：① `MIGRATIONS` 漏追 v11 段（首跑红「空库读数 10」）② 批内件夹具两处（无体 POST 缺 content-type 被型门 400；`createMember` 返回 `{ member }` 取值错）③ 求值序测例自身写错（种子 allow 误标 source=admin）④ 悬挂回收例序断言改多重集 ⑤ 设置面/快照面补两腿（E2/J）。
- explore 分歧审计：待跑。advisor 代码评审：待跑。**终态：待定**。

### 5.8 修正轮 1（explore 分歧审计 + 自查——2026-10-10）

**审计读数**：四类偏差 = ① 部分实现 1（🔵）∥ ② 静默简化 0 ∥ ③ 文档漂移 0 ∥ ④ 表外未披露 0；十项重点核查逐项「一致」（含 DDL 逐列 ∥ 端点逐行 ∥ 求值序六 rank 未简化 ∥ 长轮询非退化 ∥ 流式为真 ∥ 常量全在）。

| # | 发现（源） | 处置 |
|---|---|---|
| F1 | 自查（审计未及——执行面）：`readStreamBody` settle 后残余块仍交 `onChunk` ⇒ 超限路径上「已销毁写流被再写」（Writable 无 listener 的 `error` ⇒ 炸进程） | **修**：settle 后 `data`/`end` 摘下（`error` 留守）+ `onData` 首行 `settled` 短路（残余块丢弃）；批内件腿 J 增断言「多块超限（256 KiB vs 注入限 1 KiB）⇒ 413 ∥ 零 `.part` 残档 ∥ 服务存活（后续请求 200）」 |
| F2 | 自查：落盘收口用 `out.end(resolve)`（早于 fd 释放）+ 异常路径 `rmSync` 可能撞 Windows EBUSY | **修**：收口改「`close`（fd 已放）后定论 + 早挂 `error` 监听（`outError` 终判）」；异常路径 `destroy` ⇒ 等 `close` ⇒ 再删 `.part` |
| F3 | 审计 #2（未披露读法）：动态网段 deny 粒度 | **补披露 = R17**（见下） |
| F4 | 审计 #1（🔵 边界）：悬挂回收「按放置改派」支 | **补披露 = R18 + 待裁**（见下；不动机制——理由见 R18） |
| F5 | 审计备注（报告面） | **修**：`accounts/audit.mjs` 实为批档 §2:135「既有（改）」表内（§5.1「越单件」系承父侧 11 档口述——按 §2 表 = 表内，无越界）；§5.6 枚举漏列 `gateway/server.mjs`（实为 **12 档全绿**，审计已独立复核） |
| F6 | 父侧裁定（2026-10-10 回执） | `package.json` 的 `prepublishOnly` 本批件入链 = **保留**（设计档 §2:137「38 ⇒ 40」+ `PROJECT.md:330` 板级行）；bin 第二入口 `thincoder-runner` 归执行面单——**未触** |

**R17（补披露——动态网段 deny 粒度）**：join 时按连接对端地址（runner 自身）与本地地址（服务器）各取 **/24** 带入种子 deny 行（`source='default'`——可改可删）；回环/未指定地址豁免（127.0.0.0/8 已由内置恒拒覆盖，不入规则表）。粒度取 /24（设计只写「网段」）：与「安全组同形」口径一致，且 /24 是内网段的最小自然单位。

**R18（补披露 + 待裁——悬挂回收的「按放置改派」支）**：设计 SANDBOX §3:49 原文 = 「回 `queued` 重派（**同 runner 复联 ∥ 按放置改派**）」。实施落点读法 = 二分触发：① **同 runner 复联** = 自动（回收后仍绑原 runner，其复联即 poll 领走——已实现）；② **按放置改派** = 操作面路径（删机 `DELETE /api/admin/sandbox/runners/:id` ⇒ 在途指令作废 + 工作区解绑 + `tryPlacePending` 按放置重入队 create/start；或工作区 destroy/重建）。**不做自动跨机改派**，理由 = 卷在 runner 本地盘（§5「绑定即稳定」），跨机 = **换机**（重克隆 + WIP 快照恢复）——自动触发会在 45s 网络抖动上搬走全部工作区且绕过快照保护（数据丢失面）；设计的换机语义本身是操作面流程。**该支的自动/人工归属请设计席裁一句**——本档按上读法留档。

**面积（修后实读）**：`server.mjs` 260（+68）∥ `runner-api.mjs` 365 ∥ `registry.mjs` 512 ∥ `routes.mjs` 423 ∥ `rules.mjs` 435 ∥ `credentials.mjs` 31 ∥ `db.mjs` 364（+109）∥ `audit.mjs` 113（+4）∥ `session.mjs` 108（+12）∥ `errors.mjs` 64（+0——`sandbox_unavailable` 行占位替换）∥ `bin/thincoder-server.mjs` 189（+7）∥ 批内件 **799**（≤800 ✓）。

**验证（修后）**：`node --test …` = **22 例全绿**；`node --check` 12 档全绿。

### 5.9 修正轮 2（advisor 代码评审轮次 1——verdict = pass；5 🟡 + 5 🔵 逐条处置）

**评审结论**：无 🔴；开工令五条逐条在位（型门豁免 ∥ 路由级 200 MiB ∥ 流式落盘 ∥ `requireRunner` ∥ 零第三方）；设计面（`API.md:143` §2.6 ∥ `:161` §3 例外句 ∥ `:238` B27）与实装一致。**修后验证**：`node --test` = **22 例全绿**（含新增断言）；`node --check` 全绿。

| 发现号 | 严重度 | 处置 |
|---|---|---|
| #1 registry.mjs 512 行 > 500（advisory） | 🟡 | **带拆分计划留档**（本轮不拆 = 文件表冻结 + 非阻断）：拆点 = 「runner 面（注册/心跳/健康/可用性/放置）」∥「任务队列 + 设置/覆写/盒读数载荷」两档——本档下次实质改动时执行 |
| #2 快照写失败路径不收敛（早发 `error`+`close` ⇒ 收口等待永不触发 ∥ 背压后写错 ⇒ `drain` 不可达 ⇒ 读体不 settle） | 🟡 | **修**：`out` 的 `error` 处理器补 `req.resume()`（读体侧必收敛——不再悬停）；收口改「`out.closed` 已真 ⇒ 跳过等待」+ `outError` 终判（写失败 ⇒ 不入位）；异常路径统一 `destroy` ⇒ 等 `close` ⇒ 删 `.part` |
| #3 缺完整性核对（半截档可能入位/登记） | 🟡 | **修**：入位前核对 —— 声明 `content-length` ≠ 实收 ⇒ 400「上送不完整」；`req.complete === false` ⇒ 同判（连接中断）；两者皆在 `renameSync` 之前 |
| #4 自动带入网段 deny 行无审计、`rulesRev` 静默 +1（设计 SANDBOX §4:61 无条件「每次增删一行」） | 🟡 | **修**：`ensureSegmentDeny` 补 `sandbox_rule` 审计行（`actor = \"auto\"`、`detail = { action: \"create\", rule }`——与行内 `created_by = 'auto'` 同源）；批内件腿 E 增断言（自动项一行审计 ∥ 同目标幂等零重复） |
| #5 「无保护」明示义务无承载（`SANDBOX.md:107` + B40 ⇄ 盒条目仅 `{workspaceId, state, stopReason, dirty}`） | 🟡 | **上抛待裁（未改码）**：载体未钉 ⇒ 候选 = ① 盒条目加 `protection` 字段 ∥ ② `stopReason`/`STOP_REASONS` 词表扩 ∥ ③ `sandbox_event.kind` 上报；涉及 `API.md` §2.6 report 行 + `webui` 控制台标——请设计席裁一句（执行面/控制台批的接口面） |
| #6 长轮询定时器未清（被唤醒的那次留 ≤25s ref 定时器） | 🔵 | **修**：`clearTimeout`（`finally`）+ `timer.unref?.()` |
| #7 `errors.mjs` 注释陈值（32 MiB——路由级例外未注） | 🔵 | **修**：注释补「快照上送路由 200 MiB——§2.6 路由级例外」 |
| #8 分派预检常量面 vs 路由注入限不同源 | 🔵 | **注释厘清**（`bodyLimitFor` 档注：预检面 = 常量单源 ∥ 流内面 = 路由自身限；生产两层同值）；机制零改 |
| #9 所有权判据在 `runner_id = NULL`（删机解绑/换机窗口）放行 | 🔵 | **落口径注释**（换机取回面须可达——`runner-api.mjs` 上送/取回两面同句）；机制零改（与「换机 = 重克隆 + 快照恢复」相容） |
| #10 批内件 799 行贴近 ≤800 自约 + 评审基准声明（项目标准档未声明 ∥ 本轮未重跑批内件的独立复核） | 🔵 | **记**：≤800 自约在效（增例前先拆档）；本轮评审的 22 例读数为静态核对 + 批档自述（未独立复跑——收口轮套件跑为唯一独立跑点） |

**面积（修后实读）**：`runner-api.mjs` 383（+18——三修一注）∥ `rules.mjs` 438（+2——审计行）∥ `registry.mjs` 512 ∥ `server.mjs` 260 ∥ `errors.mjs` 64 ∥ 批内件 799。

**评审轮次与终态**：explore 分歧审计 = 1 轮（1 低severity 边界项 + 1 未披露读法 ⇒ 已在 §5.8 处置）；advisor 代码评审 = 轮次 1（pass；上表 10 项处置）⇒ 轮次 2 = 待跑（复核本表修项）。**终态：待定**。

### 5.10 修正轮 3（advisor 代码评审轮次 2——verdict = pass；13 行：4 修项复核全 Fixed ∥ 5 项 Accepted ∥ 3 新项）

**轮次 2 复核读数**：修项 #2/#3/#4/#6/#7 逐条复核 = **Fixed**（连线逐值在盘）；#1/#5/#8/#9/#10 = Accepted（留档/上抛/注释/记录——理由与档一致）；新发现 3 项（#11 🟡 ∥ #12 🔵 ∥ #13 🔵）处置如下。

| 轮 2 新项 | 严重度 | 处置 |
|---|---|---|
| #11 写失败残序：「先 error 后压」序未收口（错误处理只放行当刻余体；其后到达的块仍 `out.write` ⇒ 已毁流返回 false ⇒ `req.pause()` + 等一个永不来的 `drain` ⇒ 读体不 settle ∥ `.part` 残档无清理） | 🟡 | **修**：`onChunk` 首行加护栏 —— `if (outError \|\| out.destroyed) return`（写失败/流已毁 ⇒ 不再写、不再暂停：余体直弃，读体必收敛 ⇒ `outError` 终判 ⇒ 不入位 + 清残档）。**回归位 = 批内件腿 J ④2**（多块超限 256 KiB：413 ∥ 零残档 ∥ 服务存活）——同族错误面收敛的邻位断言 |
| #12 异常路径无回归用例（写失败 ∥ 声明长 ≠ 实收 | 🔵 | **部分处置 + 披露**：④2 腿已覆盖「流内超限 + 错误面收敛 + 零残档 + 服务存活」；**写失败注入**（只读目录/ENOSPC）需新增 fs 层注入机制（无现成面）——判据 = 验证投入 ∝ 失效代价（单行护栏；失效形 = 请求悬停至 socket 超时，非数据面）⇒ 本轮补机制不做，如实披露；「声明长 ≠ 实收」腿 = 客户端无法在不被 Node 拒绝的前提下构造（同披露） |
| #13 记录面漂移两处 | 🔵 | **修**：① 取回面补同口径注句（`runner-api.mjs` GET 面 —— 记录「两面同句」现为真）；② 数值更正：`rules.mjs` 改后 **438**（§5.8 记改前 435）⇒ **+3**（1 行码 + 2 行档注），§5.9:419 括注「+2」作废，以本行为准 |

**面积（轮 3 后实读）**：`runner-api.mjs` **385**（+2）∥ `rules.mjs` 438 ∥ `registry.mjs` 512 ∥ `routes.mjs` 423 ∥ `credentials.mjs` 31 ∥ `db.mjs` 364 ∥ `audit.mjs` 113 ∥ `session.mjs` 108 ∥ `errors.mjs` 64 ∥ `bin/thincoder-server.mjs` 189 ∥ `gateway/server.mjs` 260 ∥ 批内件 **799**。

**验证（轮 3 后）**：`node --test …` = **22 例全绿**；`node --check` 12 档全绿。

**轮次与终态**：explore 分歧审计 1 轮（1 边界项 + 1 未披露读法 ⇒ §5.8 处置）∥ advisor 代码评审 2 轮（轮 1 pass + 5🟡/5🔵；轮 2 pass + 3 新项）∥ 自查/修正 3 轮（§5.8 ∥ §5.9 ∥ §5.10）。**终态：clean**（轮 2 = 末次评审 pass；轮 3 改动 = 1 行护栏 + 1 行注句 + 记录更正，均随本轮披露）。

### 5.11 修正轮 4（advisor 代码评审轮次 3——§5.10 三处声明复核；verdict = pass）

**复核读数**：三处声明逐一在盘且成立——① 护栏 `runner-api.mjs:279` `if (outError || out.destroyed) return` + 收敛链闭合（`:271` 放行 ⇒ `:300` 终判 ⇒ `:307` 清残档；`renameSync` 在 :301，异常恒先于入位）；② 取回面注句 `:348` 与上送面 `:261` 同句（两面判据同形，记录「两面同句」现为真）；③ `rules.mjs` 438 = §5.8 记 435 + 3，§5.9:419 旧括注「+2」已明文作废。轮 2 项 #12（异常路径无回归）「部分处置 + 披露」理由成立（Accepted——写失败注入需新增 fs 层接缝；④2 邻位断言在位）。

**新发现 1 项（🔵 记录面——更正以本行为准）**：§5.10:423 计数行「13 行：4 修项复核全 Fixed ∥ 5 项 Accepted ∥ 3 新项」与正文 :425「修项 #2/#3/#4/#6/#7 逐条复核 = Fixed」（5 项）不一致，且 4 + 5 + 3 = 12 ≠ 13 ⇒ **该计数行作废；本轮 13 行 = 5 修项 + 5 收项 + 3 新项（以 §5.10 正文枚举为准）**。

**验证（轮 4 后）**：`node --test docs/batches/2026-10-10-server-exec-sandbox.test.mjs` = **22 例全绿**；`node --check` 12 档全绿。

**轮次与终态（终）**：explore 分歧审计 **1 轮**（1 边界项 + 1 未披露读法 ⇒ §5.8 处置）∥ advisor 代码评审 **3 轮**（轮 1 pass：5🟡 + 5🔵；轮 2 pass：3 新项；轮 3 pass：§5.10 三声明成立 + 1 🔵 记录面）∥ 自查/修正 **4 轮**（§5.8 ∥ §5.9 ∥ §5.10 ∥ 本节）。**终态 = clean**。

**父侧收口须接**：① 仓套件不跑（父侧收口轮唯一跑点）；② 设计档回填面 = `API.md`/`STORE.md`/`SANDBOX.md` §14 的「实读待回填」行（本批各档实读见 §5.4/§5.8/§5.9/§5.10 面积行）；③ 待裁 2 项 = R18（悬挂回收「按放置改派」支的自动/人工归属）∥ #5「无保护」承载面（三候选 + 涉及 `API.md` §2.6 与控制台/执行面批）。

### 5.12 执行面（runner）实施记录（eng-coder · 2026-10-10）

**状态行**：实施完成（explore 分歧审计 1 轮 + advisor 代码评审 2 轮（末轮 pass）；终态 clean；真机探针面挂 §6 收口轮）

#### 面与文件（逐档实读）

**新增（九档 + 入口 + deploy 两档）**：

| 档 | 行数（实读） | 设计估（RUNNER §9） | 角色 |
|---|---|---|---|
| `src/sandbox/runner/daemon.mjs` | 413 | ≈260 | 主循环（心跳 15s ∥ 长轮询 ∥ 指令分派 ∥ 排空 ∥ 规则落地 ∥ 周期快照 ∥ outbox）（§2） |
| `src/sandbox/runner/client.mjs` | 121 | ≈160 | 通道客户端（join/heartbeat/poll/report/pending/快照两向 + 退避）（§2） |
| `src/sandbox/runner/runtime.mjs` | 271 | ≈200 | 容器运行时适配 + doctor 八项 + 探测序（§7） |
| `src/sandbox/runner/boxes.mjs` | 384 | ≈290 | 盒生命周期/参数集/采纳/TTL 双计时/exec（§3） |
| `src/sandbox/runner/egress.mjs` | 393 | ≈330 | 出站闸代理 + 域名求值 + PIN + 待批挂起（§4.2） |
| `src/sandbox/runner/netfilter.mjs` | 200 | ≈230 | 链生成/应用/自检（§4.1——KD-SV-76） |
| `src/sandbox/runner/quota.mjs` | 109 | ≈150 | 磁盘配额两机制（§5——KD-SV-74） |
| `src/sandbox/runner/checkpoint.mjs` | 167 | ≈140 | WIP 打包/恢复（§6） |
| `src/sandbox/runner/probe.mjs` | 263 | ≈150 | 探针执行器 P1–P14（§10） |
| `bin/thincoder-runner.mjs` | 209 | ≈120 | CLI：join/run/doctor/probe/image（§2/§7） |
| `deploy/sandbox/Dockerfile` | 12 | ≈35 | 盒镜像（node:24-slim 基座 + git/curl + 非 root uid 1000） |
| `deploy/thincoder-runner.service` | 19 | ≈30 | systemd unit（§8） |
| **九档小计** | **≈2318** | ≈1910 | 越估 ≈+408（逐档均 <500 软线 ✓） |

**改（表内 3 档）**：

| 档 | 实读 | 设计估 | 改动点 |
|---|---|---|---|
| `thincoder-server/package.json` | ±0 行 | ≈+1 | `bin` 第二入口 `thincoder-runner`（KD-SV-64）+ `prepublishOnly` 清单两测试件入链（清单 40 ⇒ **41 项**） |
| `thincoder-server/README.md` | 258 ⇒ 272 | ≈+60 | §11 nginx 样例增 `location = /api/runner/checkpoint`（`client_max_body_size 200m` + `proxy_request_buffering off`）+ 样例下说明句（与 ops/OPS.md §5.6 择形同拍）；**缺省 32m 行保留**（其余路由从严——批断言件 `2026-10-06-first-release-completeness.test.mjs:354` 字面不破） |
| `docs/batches/2026-10-10-server-exec-sandbox-runner*.mjs`（批内件） | 868 ⇒ **三件**（471 ∥ 195 ∥ 180） | ≈450（一件） | 超「新写批内件自约 ≤800」⇒ 按腿 A–F ∥ 腿 G–I ∥ 共享夹具拆三件（用例 14 例守恒；两测试件均入 `prepublishOnly`；夹具档 `node --test` 不收集） |

#### 解释性读法（设计留白处的实施判定——逐条披露）

| # | 读法 | 依据/理由 |
|---|---|---|
| R19 | 代理层对 **IP 字面量目标**按 CIDR 规则同序裁定（无条目 ⇒ 拒）；设计句「直连 IP 目标不经代理」按「代理不引入域名面」读 | §4.1 ③ 与 §4.2 的接缝；盒 env 恒带 `HTTP_PROXY` ⇒ IP 直发也会到代理面，此处若放行即绕闸（防绕闸读法——零放行语义新增） |
| R20 | `start` 重建判据 = 载荷指纹（image/tmpfsMb/limits/network/env）变 ∨ 曾起过 ⇒ 重建；同载荷 ∧ 未曾起 ⇒ 直启（create⇒start 序列零 churn） | §3「容器旗不可热改 ⇒ 新载荷生效 = 下次建盒/重建」+ B39「下次使用重建」 |
| R21 | **零回落**：create 载荷的资源/TTL/env 旗值缺键/非法 ⇒ 抛（指令上报 failed——不静默取缺省）；**唯一例外** = 采纳面（runner 重启，载荷不可得 ⇒ 本档缺省 `ADOPT_TTL_FALLBACK`，有明文注释）；墙钟基准 = 容器 `inspect .Created`（重启不顺延盒龄） | §3:43「runner 侧零回落逻辑」 |
| R22 | 快照跳过上报口径：**任务面**（`sandbox.checkpoint`）= result 携 `{skipped, reason}` 上行；**周期/拆前/排空面** = runner 日志 + 盒 `dirty` 读数（心跳盒条目） | §6「跳过 + 上报」在周期面无可载通道（report 为任务面专属）；「无保护」载体 = 父侧待裁在册（本档 §1:82 ② ∥ §5.9 #5） |
| R23 | 纯未跟踪改动的打包：`stash create` 空（不含未跟踪）但 `ls-files --others` 非空 ⇒ **仍打包**（`stash: null` + 未跟踪项），不再误报 `clean` | §6「+ 未跟踪清单打包」；否则 dirty 面（未跟踪独占）零保护 |
| R24 | 探针口径：无参/无机/无读数 ⇒ `skip`（不假报）；P9 双面 = 他盒卷路径 ENOENT + 他盒容器 IP 不可达 | §10 + SANDBOX §12 判据表（P9「盒 A 访问盒 B 的卷路径/网络地址」） |
| R25 | env 面：`NO_PROXY`（+小写）= 生命线直连（盒→server 网关不经闸）；P8 白名单 = **注入面**（§3 env 行）∪ **镜像固有面**（PATH/HOSTNAME/PWD/SHLVL/_/TERM/LANG） | §4.1 ③「内置项 = server 网关 ip:port（模型调用生命线）」⇒ 该流向不经代理；镜像固有项非注入面（不列则 P8 恒 FAIL） |
| R26 | 无规则缓存时不发 `rulesRev`（发 `{}`） | 服务器 rev 为进程内存计数、重启复位 ⇒ 首轮必须让它判「不等」而发全量；携 0 会成假同拍 |
| R27 | 指令载荷回补 `workspaceId`（`registry.claimTasks` 把它从 payload 摘出，投递形 = `{id, kind, workspaceId, payload}`） | 两侧契约同拍（`src/sandbox/registry.mjs` 剥离 ↔ `daemon.mjs:199` 回补） |

#### 验证读数

- `node --test docs/batches/2026-10-10-server-exec-sandbox-runner.test.mjs`（cwd = `thincoder/`）：**14 例全绿**（腿 A–F 10 例——盒参数集/env/生命周期/TTL+exec/求值序/代理真 socket/两网层面/配额/检查点真 git）。
- `node --test docs/batches/2026-10-10-server-exec-sandbox-runner-io.test.mjs`：**4 例全绿**（腿 G–I——真控制面互操作：真网关 ∥ 真库 ∥ 真 runner-api 路由 × 假容器运行时；join ⇒ 领指令 ⇒ 上报 ⇒ 规则 ⇒ 快照 ⇒ 排空全链）。
- `node --check`：九档 + `bin` + 批内件三件全绿（无语法面差异）。
- `doctor` 实跑（本机 = Windows，无容器面）：八项逐条 FAIL（核心 5 项）⇒ `核心项失败——拒跑` + **EXIT 1**（E32 语义按拒跑落地）；`probe` / `image` 无运行时 ⇒ 明示报错 + EXIT 1（不静默）。
- **未验（如实）**：真机面 = P1–P14 逐条读数 ∥ 两平面真强制（nft/iptables 真链）∥ 配额真应用 ∥ docker/podman 双运行时 —— 本环境无 runner 机 ⇒ 挂 §6 收口轮（不假装通过）。
- 残留清理：`.thincoder/tmp` 批内临时件全清（21 项；首轮 2 个 ckpt 目录因 `.git` 只读位 EPERM 未删，逐层 chmod 后清）。

#### 与设计的差异 / 面积

- **面积**：九档 ≈2318（估 ≈1910）；批内件三件 846（估 ≈450 一件）；`README.md` 272（+14）；`package.json` 两处随动（bin 第二入口 + prepublishOnly 两件入链）。
- **零语义降级**：设计件全落地（两闸 ∥ 待批三态 ∥ 配额两机制 ∥ TTL 双计时 ∥ 检查点 ⟳ 恢复 ∥ doctor 八项 ⟥ 拒跑 ∥ 探针 P1–P14 注册齐 ∥ 未知 kind ⇒ unsupported ∥ 退避 1s→30s）。
- **披露（表内/越表）**：① README §11（本档 §2:143 部署面行内）；② 批内件拆三件（设计估一件 ≈450——理由 = ≤800 自约；含夹具支撑档）；③ `package.json` `prepublishOnly` 清单项数 40 ⇒ 41（数值待父侧回填）。

#### 轮次与终态（终）

- **explore 分歧审计 1 轮**（10 项：3🟡 ∥ 7🔵，无 🔴）⇒ 逐条处置：修 5（未跟踪独占不入包 ∥ P9 双面读数 ∥ 零回落 ∥ 墙钟基准 ∥ 自检接线）+ 披露 2（R19 IP 目标读法 ∥ R25 env 白名单面）+ 记录 2（「批档在册」由本节承载 ∥ 数值漂移回填）+ 清理 1（临时残留）。
- **advisor 代码评审 2 轮**：轮 1 = **changes-required**（4🔴 ∥ 3🟡 ∥ 4🔵——🔴 = 代理错误面引用了未定义标识符 ∥ iptables 建链全量重算非幂等 ∥ 建盒后不重算网络层链 ⇒ 新盒仅落 Docker 缺省放行 ∥ 批内件 868 行 > 800）⇒ 全修 + 补回归断言（iptables 非空工作区连跑两次 ∥ 建盒即入链 `ws<id>_fwd`）；轮 2 = **pass**（四条 🔴 逐条复核在盘；新增 1 条 🟡 = join 缺省名重名面——建议非 must-fix）。
- **修后复跑**：两测试件 **14 例全绿**；`node --check` 全绿。
- **终态：clean**。
- **父侧收口须接**：① 真机面（P1–P14 + 两平面真强制）——挂 §6；② 「无保护」载体定形（本档 §1:82 ② ∥ §5.9 #5 在册）；③ 数值回填（九档 ≈2318 ∥ 批内件三件 ∥ `prepublishOnly` 41 项）；④ 轮 2 新 🟡（join 缺省名重名）——服务端冲突兜接随机后缀 ∥ 明示 `--name` 二选一（服务端面 = 他单；runner 侧注释本轮已收正）。

## §6 验证与收口（父代理）
