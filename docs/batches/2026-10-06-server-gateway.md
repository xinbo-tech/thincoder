# 2026-10-06 · thincoder-server 第一步 token 网关（设计轮）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-06 · 来源 = 用户 2026-10-06 07:39「server 我打算启动了」+ 07:55「就这些」（需求收口 ⇒ 设计开批）。
> 台账 = #909（server · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 本批定位

- **来源**：用户 2026-10-06 07:39「server 我打算启动了」→ 07:43–07:55 需求讨论（六问六答）→ 07:55「就这些」= 需求收口。
- **本批** = thincoder-server 第一步（token 网关）的**设计轮**——需求单源 = `docs/server/requirements/PROJECT.md`（五要素已齐：六功能点 ∥ 验收 AC-1–AC-6 ∥ 依赖段）。
- **落点**：新板块——代码 `thincoder/thincoder-server/`；设计档 `docs/server/design/`（已入 manifest docRoot——2026-10-06）。
- **设计任务**：六条功能点的架构与实现方案——统一入口 ∥ OpenAI 兼容面 ∥ 计量 ∥ 配额 ∥ 凭证管理 ∥ 向量接入面；含 API 面 ∥ 存储 ∥ 密钥面 ∥ 看板形态 ∥ 依赖决策（是否复用 core 的 provider 层——设计轮定）∥ 受影响文件清单 ∥ 验收映射。
- **边界（本批不做）**：第二步「团队协同」；server 入发布序列（后续轮再定）；其它板块文档零触。
- **授权**：用户「启动了」+ 需求收口——设计轮启动（评审点火权仍在用户）。
- **台账** = #909（待设计——任务书指针 = 本档）。

### 1.2 讨论补记（设计轮在飞期间的裁决与转达——2026-10-06 08:0x）

设计初版（≈1950 行预算）交卷后，用户在设计补轮在飞期间追加六令（均已转达补轮 id 2）：

| 时刻 | 令 | 落点 |
|---|---|---|
| 08:04 | **B 案（轻量账号体系）入第一步**（账号 ∥ 角色 ∥ 登录 ∥ 管理页） | 需求 §2:7；设计补轮织入 |
| 08:05 | **自助改密 = 在** | 需求 §2:7 |
| 08:06 | **admin 重置成员密码 = 在** | 需求 §2:7 |
| 08:09 | **前端 = vanilla 静态文件**（零框架 ∥ 零构建 ∥ 零外链；三视图；判权全在后端） | 设计补轮 |
| 08:11 | **增长规划令**——server = 长期平台；留对断点 ∥ 触发条件式 ∥ 不预建 | 需求 §3；设计「增长与演进」节 |
| 08:12 | **文档拆分令**——按域拆档，不许挤单档（并发零冲突） | 设计档结构（本次补轮内执行） |

设计补轮 = B ∥ 前端 ∥ 增长节 ∥ 文档拆分 四路合一。

### 1.3 结构层令（用户 2026-10-06 08:14——设计补轮在飞期间）

- **三层结构令**：现（板 → 档）两层不足——**按经验须三层（板 → 域 → 档）**，方能将并发冲突降到足够低；各域下将来还会再拆，故**域目录从第一步就立**，未来拆分落在域内（零跨域动）。
- **适用范围 = 代码树与文档树同拍**（模块镜像——沿本仓体例）：代码 `thincoder-server/src/<域>/<档>.mjs`；文档 `docs/server/design/<域>/<档>.md`（板级 = `PROJECT.md` ∥ `EVOLUTION.md` 留顶层）。
- **域划分（拟——设计补轮定案）**：gateway（代理主链：http/路由/转发/透传/providers/错误形）∥ accounts（key ∥ 账号 ∥ 会话 ∥ 密码）∥ metering（记账 ∥ 配额 ∥ 查询）∥ store（库/迁移——被 accounts 与 metering 共用）∥ webui（页面路由 ∥ HTML ∥ 静态）∥ ops（配置 ∥ 日志 ∥ 运维 CLI）。
- 已转达设计补轮（id 2：七档拆分令升级为**三层树**同一补轮内落）。

### 1.4 授权（**父侧代点火 + 代批准 · 全链 · 2026-10-06 08:32**）

用户原话：「**点火。自动跑完**」⇒ 本批全链——**设计评审点火权 + §4 批准权（代签）+ 修正轮/实施轮派发 + 收口核销 ∥ 提交 ∥ 推送**——均委托父侧自动执行，至本批完结（排空模式 · 无时限）。

**父侧自缚三条**（本仓惯例 · 先例同形）：① 代签仅当三条件齐备（评审 pass〔0🔴〕∧ 修正轮已落地并逐条核验 ∧ token 已签发）；② 新范围（射程外）或用户口径裁决 ⇒ 停下、只摆那一条；③ 破坏性/不可逆动作（数据 ops ∥ 强杀 ∥ 外仓写）先停。

**射程** = 本批（server 网关设计 → 实施 → 收口）——不自动扩到他批/新批。

**D1 到货记（父侧核验 + 决策——2026-10-06 09:1x）**

- **核验读数（父侧亲跑）**：批内件 **13/13 pass**（EXIT=0）∥ `.gitignore` +2 行（`git diff --stat` 实读）∥ 交付报告实读（十档 + 随动）——**D1 到货成立**（§5 实施记录在册）。
- **任务书误修正（父侧自认 · 可 revert 于派单层）**：D1 任务书 `private: true` 与设计单源（`ops/OPS.md:73` ∥ `PROJECT.md:116`「可发布形——`private` 撤」）相抵——D1 按设计收正（撤 `private` + 补 `prepublishOnly`）+ 独立代码评审判 🔴 后处理；**D1 判对**。D3/D4 派单已重发修正（`#14`/`#15` 取消 ⇒ `#16`（D3）∥ `#17`（D4）续链）。
- **决策：测试档按域分文件**（D1 件 437 行近 500 硬限）——新档按阶段落：`…-accounts.test.mjs`（D2）∥ `…-chat.test.mjs`（D3）∥ `…-webui-deploy.test.mjs`（D4）；原基档保持不动（D1 件）。
- **上抛五项处置**：① `internal_error` 表外码 ⇒ 随「实施后设计回填轮」补（设计 §3 表行）；② 预算回填（bin 96/≈50 等实读）⇒ 同轮；③ `/v1/models` 鉴权 = D2 接入（AC-1 收口前核）；④ 拆档 ⇒ 已决（上条）；⑤ 收口轮前置（真实上游 + 内网引擎可达）⇒ 收口轮向用户报备。
- **待派**：实施后设计回填轮（① ② + 实施面读数）——待 D2–D4 全落后（eng-designer · fix round 形）。

**补记（D2 在飞裁定——2026-10-06 09:17）**：`ops/OPS.md:55` CLI 用法 `key issue <member> [--label <l>]` 与表形单源（`store/STORE.md:30–38` `api_keys` 无 label 列）冲突——**裁 = B**：本阶段 CLI 不提供 `--label`（零消费方 ∥ 免触 D1 冻结表形 ∥ 需求面无据）；OPS §3 该参数过设 ⇒ 收正一行入「实施后设计回填轮」（与 ① ② 同轮）。

**D2 到货记（父侧核验 + 裁定——2026-10-06 09:3x）**

- **核验读数（父侧亲跑）**：三件 **28/28 pass**（EXIT=0）∥ CLI 冒烟实读 ——**D2 到货成立**（§5 在册）；测试档 = 再拆 metering 档（accounts 493 ∥ metering 188；D1 件零改）。
- **上抛处置**：① `/v1/models` 鉴权 = **判归 D3**（D2 写域不含 providers.mjs + D1 冻结件压「无 key ⇒ 200」）——已向 D3（`#16`）续注：接入 AC-1 三态 + **授权解锁两处**（`providers.mjs` ∥ `gateway.test.mjs:388–390` 断言改 401）；② 预算回填 ∥ ③ 设计 §8 序不一致 ∥ ④ `--label` 行 ∥ ⑤ 密码无上界（裁：接受——无 DoS 面，回填轮可选注明）⇒ 入「实施后设计回填轮」；⑥ 记录面旧述 = 历史段不追改；⑦ `/v1` 端到端归 D3 接线后复跑（收口轮终验）。
- **D4 重排**：`#17` 取消 ⇒ `#18`（D4——补：前端写请求一律带 JSON 头（D2 型门口径）∥ `package.json` 勿动 ∥ 回归命令四件）。

**D3 到货记（父侧核验——2026-10-06 10:0x）**

- **核验读数（父侧亲跑）**：四件 **37/37 pass**（EXIT=0）∥ 流式冒烟（首帧 162ms ∥ 门控 ~135ms ∥ 放行即达——非整段缓冲成立）+ gzip 探针 ——**D3 到货成立**（§5.9–5.12 在册）；终态 clean（审计 0 ∥ 评审两轮 pass）。
- **授权面落位**：models 注册迁并 routes（防双主——D1 §5.2-④ 预告）∥ D1 件断言「无 key ⇒ 200」已改 401 三态（`:272–282` + 同源点）∥ `.thincoder/tmp/d3-chat-stream-smoke.mjs` = 冒烟证据件（tmp 域）。
- **回填轮清单补**：`server.mjs` 178/≈140 ∥ D1 件 460（+23 = 授权改笔）∥ `errors.mjs:5` 阶段标记 ∥ 行数漂移全表（设计 §6/§9 回填）。
- **D4（`#18`）在飞**（末段：控制台 + embeddings + 部署五件）——全树收官即在。

**D4 到货记 + 全树终验（父侧——2026-10-06 10:2x）**

- **核验读数（父侧亲跑）**：五件 **43/43 pass**（EXIT=0）∥ `node --check` 全树 22 档零失（CHECK_FAILS=0）∥ `npm pack --dry-run` 27 档入包（exit 0；零残留 tgz 实核）——**全树 31 档（2720 行）交付成立**。
- **交付面**：webui 五件 + embeddings 增量 + 部署五件 + README；静态/控制台冒烟（真实进程 + DOM 垫片 22/22）；环境未验证项 = Docker/systemd/浏览器真机（收口轮真机面）。
- **已派**：实施后回填轮（`#19` eng-designer——七条：`internal_error` 码表 ∥ 行数回填（2720 vs ≈3250）∥ §8 序 ∥ `--label` ∥ Docker `build` 步 + env 落点 ∥ 密码无上界注明 ∥ 阶段标记收面）。
- **收口轮前置（用户面）**：真实上游 key + 内网嵌入引擎可达（AC-2/AC-6 真机）∥ Docker build/compose ∥ systemd verify（AC-8 真机面）。

**代码修正轮（#20 斜杠形）到货记（父侧核验 + 裁定——2026-10-06 10:5x）**

- **核验读数（父侧亲跑）**：六件 **44/44 pass**（EXIT=0）∥ `providers.mjs` 实读（首斜杠切分 ∥ 裸名 404 提示前缀形 ∥ 前缀名清单 ∪ 引擎模型）——**到货成立**（§5.18 在册）。
- **拆档披露照准**：第六件 `-model-ref`（155 行——同名跨 provider 可达正路 ∥ 前缀未命中 404 ∥ 记账可分）；chat 件回落 498（≤500）——「按域分文件」政策延伸，无误。
- **上抛处置**：① provider `name` 校验缺口（重名 ∥ 含 `/`）∥ ② 记账 `model` = 对外标识语义注 ∥ ③ 行数账再收正（providers 55 ∥ routes 81 ∥ forward 185 ∥ README 119 ∥ chat 498 ∥ 新件 155）⇒ **已派小收尾轮（#21 eng-designer）**；① 的产品码（config 校验）随其后的 code 轮落。
- **遗留**：收口轮前置（用户面）= 真上游 key ∥ 内网引擎可达 ∥ Docker/systemd 真机。

**代码修正轮（#22 provider 名校验）到货记 + 终验收读（父侧——2026-10-06 11:1x）**

- **核验读数（父侧亲跑）**：六件 **48/48 pass**（EXIT=0）∥ 全树 `node --check` 28 档零失——**#22 到货成立**（§5.19 在册）。
- **上抛处置**：① name 首尾空白（裁 = 字面保留——各自可达非歧义；文档注半句可选）∥ ② 入口退出码例（接受——共享出口已被既有入口用例覆盖）∥ ③ 行数账漂移（config 139⇒154 ∥ ops 小计 683⇒698 ∥ 合计 2720⇒2735 ∥ 总账 2745⇒2760 ∥ model-ref 155⇒194）⇒ **并入收口轮机械收正**（父侧直接执行 · 计数类）。
- **已点火**：收口独立评审（code 面——全树 + 设计/需求/批档）。
- **收口轮前置（用户面）**：真上游 key ∥ 内网引擎可达 ∥ Docker/systemd 真机（向用户报备中）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（实施后回填轮（①–⑦）∥ 口径变更增补（⑧）∥ 小收尾轮（①–③：provider name 校验条 ∥ 记账 model 语义注 ∥ 行数账再收正）已逐条落位；doc-check：本批触面零悬空 ∥ 行宽 0（他批 58 悬空在册 #958；行数面差异 13 = 桌面声明面））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目（覆盖）

- 需求单源 = `docs/server/requirements/PROJECT.md`（六功能点 ∥ AC-1–AC-6 ∥ 依赖段 ∥ 不做项）——本批 = 设计轮，逐条覆盖：功能点 1 统一入口（→ 设计 §2.3 团队 key 面 + §2.4 配置面）· 功能点 2 OpenAI 兼容面（→ §2.1 路由面 + KD-SV-5）· 功能点 3 计量（→ §2.5 存储面 + §2.7 查询面）· 功能点 4 配额（→ KD-SV-6 + §2.2 错误形）· 功能点 5 凭证管理（→ §2.3 + §2.6 运维 CLI + §2.4）· 功能点 6 向量接入面（→ §2.1 + §2.4 embedding 段）。
- **本批边界（不做）**：第二步「团队协同」（另轮）∥ server 入发布序列（后续轮）∥ 四端代码/文档与 core/他板档零触（设计 §4.2「零触碰」）。

### 2.2 设计档落点

- `docs/server/design/PROJECT.md`（**新建**——设计单源）；档名沿板块镜像 N-b：需求 `PROJECT.md` ↔ 设计 `PROJECT.md`。
- 相关档：需求 `docs/server/requirements/PROJECT.md`（只读合规面）；批档（本档）。

### 2.3 机制设计（终值摘要——单源 = 设计档 `docs/server/design/PROJECT.md`）

- **形态** = 单进程 Node 服务（`node:http` + `node:sqlite`）——模块八件：入口 ∥ 路由 ∥ 鉴权 ∥ 上游转发 ∥ 计量 ∥ 配额 ∥ 看板 ∥ 运维 CLI（设计 §1.2）。
- **存储** = `node:sqlite`（`DatabaseSync` ∥ WAL ∥ `user_version=1`）——三表：`members` ∥ `api_keys`（sha256 hash 存储、软删吊销） ∥ `usage`（成员 × 模型 × 时段 × token 行）——设计 §2.5。
- **密钥面** = 团队 key `sk-tc-…`（明文只签发一次 ∥ 轮转 = 新签 + 吊销旧）；上游 provider key = 配置档 `config.json`（支持 `env:` 引用——真实 key 可只住环境变量）；最小面，改配重启。设计 §2.3 ∥ §2.4。
- **依赖决策** = **不 import `thincoder-core/*`**——核 provider 层（`thincoder-core/provider/sse.mjs`）为消费型客户端器件（累积 ∥ 回调 ∥ 多协议），与字节级中继 + SSE 逐块透传相抵；自持 sse-tap（≈80 行）覆盖 usage 提取。设计 KD-SV-2。
- **OpenAI 兼容面** = `/v1/chat/completions`（SSE 逐块透传 + 旁路 tap；流式注入 `stream_options.include_usage`）∥ `/v1/models` ∥ `/v1/embeddings`（内网引擎转发——地址配置面）。设计 §2.1 ∥ KD-SV-5。
- **看板** = 只读 JSON（`/api/members` ∥ `/api/usage`——明细行含成员 × 模型 × 时段 × token）+ 单文件内嵌页（零外部资源）；`admin.token` 门禁（缺省 ⇒ 关闭）。设计 §2.7。
- **验收映射** = AC-1–AC-6 → 九条设计级判据（设计 §5）；用例表 = N1–N5 ∥ B1–B6 ∥ E1–E7（设计 §6）。

### 2.4 受影响文件与测试面

- **新树 `thincoder-server/`** 19 档（预算合计 **≈1950 行**；逐档行数预算 = 设计 §4.1——全部 ≤300 软线内，无拆分预案需求）。
- **既有随动**：`thincoder/.gitignore` +2 行（`thincoder-server/data/` ∥ `thincoder-server/config.json` 不入库）。
- **测试面** = 批内件 `docs/batches/2026-10-06-server-gateway.test.mjs`（拟新增——平 node + mock 上游直测：config/auth/quota/sse-tap/forward/routes ∥ 依赖面扫描）；不设 `test/` 树；收口轮 = 父侧真机（AC 实跑 ∥ 四端任一实际接入一轮 ∥ 仓根机检）。
- **机检读数**：`node scripts/doc-check.mjs` **exit 0**（悬空 0；本档「拟新增」列报 = 前向引用——不入闸，设计内预期）。

### 2.5 验收对照（回指需求 §2 AC 表）

- AC-1 → 401（无/错/吊销 key）+ 有效 key 完成请求（batch 件）｜AC-2 → SSE 逐块（帧间隔判定 ∥ 字节一致）+ 四端任一实跑（收口轮）｜AC-3 → usage 行落库且 token 与上游回传逐值相等｜AC-4 → 超额 429 + 可读提示 ∥ 额内放行｜AC-5 → 吊销后下一请求即 401｜AC-6 → 引擎命中 + 响应透传（维度/条数不变）+ 记账。逐条机检面 = 设计 §5 表。

### 2.6 关键决策（KD-SV-1–11——全文 = 设计 §3）

- 1 单进程单服务 ∥ 2 不引 core（含 provider 层） ∥ 3 `node:sqlite` ∥ 4 精确模型清单派发（非别名/策略路由） ∥ 5 `include_usage` 注入 ∥ 6 配额 = 成员月度 token 累计·准入检查 ∥ 7 凭证面 = 本机 CLI（写）+ token 门看板（读） ∥ 8 计量 = 请求终结后单条 INSERT ∥ 9 看板 = 单文件内嵌页 ∥ 10 sse-tap = 有界只读扫描 ∥ 11 key 逐请求查库（无缓存——吊销即时）。被否候选与被否理由逐条在册（设计 §3）。

### 2.7 上抛项（全文 = 设计 §9）

- **R1** 第六部分（server）地图登记（`docs/README.md` + `docs/core/design/DOC-SYSTEM.md`——父侧面为常例；本批零触他板档）｜**R2** 需求留白三处已定形的披露（额度单位/周期 ∥ provider key 配置形态 ∥ 看板门禁——如用户意图不同 ⇒ 回笔需求或改设计）｜**R3** 收口轮环境前置（真实上游可达 + 内网嵌入引擎）｜**R4** 批内件写面先例（受阻 ⇒ 落 `.thincoder/tmp/` 父侧 copy）｜**R5** 发布序列后续轮。

### 2.8 补轮修订（B 案织入 + 三层结构 + 增长与演进 · fix 轮 · 2026-10-06）

- **轮次定位**：fix 轮（点改——B 相关面 + 用户补丁，其余照初版）；补丁沿用户 08:04–08:14 裁定：① admin 重置成员密码 = **在**（08:06）② 前端路线 = **vanilla 静态文件**（08:09——`public/` 四档：零框架 ∥ 零构建 ∥ 零外部资源；判权全在后端）③ **增长与演进**（08:11 架构令——断点 ∥ 触发条件式 ∥ 不预建）④ **三层结构**（08:14 结构令——板 → 域 → 档；代码/文档同拍；替代 08:12 七档拆分令）。
- **设计档结构（新——`docs/server/design/`）**：**板 2 档** = `PROJECT.md`（总览：定位/架构总览/模块边界与责任地图/文档地图/决策索引/文件与验收总账/交付面） ∥ `EVOLUTION.md`（扩展点 G1–G6 ∥ 触发式演进 ∥ 不预建）；**域 6 档** = `gateway/API.md` ∥ `accounts/ACCOUNTS.md` ∥ `metering/METERING.md` ∥ `store/STORE.md` ∥ `webui/WEBUI.md` ∥ `ops/OPS.md`。**代码树同拍** = `src/<域>/<档>.mjs`（入口 `bin/` 与静态 `public/` 除外）；域目录自第一步立 ∥ 拆分落域内（零跨域动 ∥ 零路径重排）。
- **本批条目（覆盖——增量）**：需求功能点 7 → `accounts/ACCOUNTS.md`（主）+ `webui/WEBUI.md`；需求 §3 增长规划条 → `EVOLUTION.md`；AC-7（七判据——含重置）= `accounts/ACCOUNTS.md` §5（需求档回笔 = §9-R7）。
- **终值修订（取代 §2.3 摘要之看板句）**：看板面 ⇒ **控制台（登录制）**——会话 cookie（`HttpOnly` ∥ `SameSite=Strict` ∥ 7 天绝对）∥ 角色分面 = user 自助（key 轮转 ∥ 本人用量 ∥ 改密）∥ admin 管理（成员 ∥ 配额 ∥ 吊销 ∥ 重置 ∥ 全队用量）；`admin.token` 门禁设计由登录制取代（KD-SV-7 改——点名）；端点单源 = `accounts/ACCOUNTS.md` §3 ∥ `metering/METERING.md` §3。
- **关键决策（增量）**：KD-SV-7 改（登录制页面 + 本机 CLI 兜底）∥ KD-SV-9 改（vanilla 静态面）∥ KD-SV-12 会话形 = HttpOnly cookie ∥ KD-SV-13 散列 = scrypt（N=16384/r=8/p=1——异步）∥ KD-SV-14 admin 重置 = 在（一次性临时密码 + 吊销该成员全部会话）∥ KD-SV-15 首启 = `bootstrap` 幂等；决策索引（KD-SV-1–15 → 各档）= `PROJECT.md` §4。
- **受影响文件（增量——按三层树）**：设计档八档（板 2 + 域 6）；代码树归域（域目录自第一步立；初版平铺布局 `src/routes/*` ∥ `dashboard.mjs` 由域树取代——终值 = 各域档）；行数预算总账 ≈1950 ⇒ **≈3110**（全树 27 档；逐域小计 = 各域档表）。
- **机检读数**：`node scripts/doc-check.mjs` **exit 0**（悬空 0 ∥ 行宽 0——补轮后复跑）；首跑曾出 2 缺陷（1 悬空 + 1 超宽——均本补轮引入、当轮修复）。
- **遗留**：§2.3 摘要之「看板 = 只读 JSON + `admin.token` 门禁」等旧述由本期修订取代——终值以设计档（板 2 + 域 6）为准。

### 2.9 补记（部署面薄面落 · 用户 2026-10-06 08:21 令）

- **部署面**：自「后续设计定」翻为薄面落定——`ops/OPS.md` §5：① 分发 = 拷即跑（零依赖 ⇒ 免 `npm install`；clone/rsync；更新 = pull）② 守护 = systemd unit（`Restart=always` ∥ 开机自启 ∥ journald 收 stdout——模板 = `thincoder-server/deploy/thincoder-server.service`（拟新增））③ 配置 = `config.json`（不入 git）+ env（provider keys ∥ `bootstrap` 口令）④ 升级 = pull + restart ∥ 回滚 = 前一提交 checkout + restart ⑤ 备份 = SQLite 单文件（停写窗 cp ∥ `.backup` 口径——手工最小面）⑥ TLS = 内网 HTTP（HTTPS 如需 = 前置反代）⑦ 首部署清单 7 步（Node ≥24 → clone → config → env → 首启建 admin → systemd → 携 key `curl /v1/models` ⇒ 200）⑧ 目标机/OS 占位（内网 Linux；Windows ⇒ 守护面换写法）。
- **同步面**：`PROJECT.md` §2.1（ops 行 + `deploy/`）∥ §6（ops ≈675 ⇒ 合计 ≈3130 ⇒ 总账 ≈3160；28 档）∥ 变更记录；`accounts/ACCOUNTS.md` §2 交叉指针（OPS §4 ⇒ §5）；`ops/OPS.md` §10 边界收正（开机自启/崩溃自愈 = 已落，不再列不做）。
- **机检读数（终态）**：`node scripts/doc-check.mjs` **exit 0**（悬空 0 ∥ 行宽 0）；期间两轮修正（config.json 标记缺失 ∥ `bin/thincoder-server.mjs` 标记缺失 + 1 超宽行——均当轮闭环）。

### 2.10 补记二（部署方案重写 · 用户 2026-10-06 08:24 令）

- **终值修订（取代 §2.9 之①分发 ∥ ②守护 ∥ ④升级 ∥ ⑦清单段；③配置 ∥ ⑤备份 ∥ ⑥TLS ∥ ⑧占位沿用——终值一律以 `ops/OPS.md` §5 为准）**：分发 = **两路**——① **npm 发布**：`package.json` 转可发布形（撤 `private` ∥ `@thincoder/server`（拟——发布轮验 scope/占用；更优命名可上抛） ∥ `files` 白名单（bin ∥ src ∥ public ∥ config.example.json ∥ README.md） ∥ `bin` = `thincoder-server` ∥ `prepublishOnly` 门禁；装机 = `npm i -g`；发布序列 = 定向——`RELEASE.md` 扩展 = 发布面轮，不在本批）② **Docker**：`Dockerfile` ∥ `.dockerignore` ∥ `docker-compose.yml`（`restart: unless-stopped` ∥ 卷 config/data ∥ `env_file`；registry ∥ 镜像名 ∥ 首版号 = 待定占位）。
- **守护两路并列**：裸机 = systemd（unit 模板保留——「npm i -g + systemd」装机） ∥ 容器 = restart 策略（无 systemd 依赖）。
- **同步面**：`ops/OPS.md` §5 重写（两版首部署清单）∥ §6 文件表（+`Dockerfile` ≈30 ∥ `.dockerignore` ≈10 ∥ `docker-compose.yml` ≈30；README ≈140；小计 ≈765）∥ `PROJECT.md` §6（ops ≈765 ⇒ 合计 ≈3220 ⇒ 总账 ≈3250；31 档）∥ 头注范围注（入发布序列 = 定向）∥ §9 上抛与报告项（R1–R7——含 R5 发布序列 ∥ R7 需求档回笔三处）。
- **机检读数（终态二）**：`node scripts/doc-check.mjs` **exit 0**（悬空 0 ∥ 行宽 0）。

### 2.11 修复轮（评审轮次 1 六条——逐号落位 · fix 轮 · 2026-10-06）

- **轮次定位**：fix 轮（点改——六条发现逐号落位，其余照 §2.8–§2.10 终值）；来源 = 本档 §3 轮次 1（🔴1 ∥ 🟡3 ∥ 🔵2——父侧逐条复核属实、全采纳）。
- **号 → 改动（file:line 终值）**：
  - **① 🔴 管理面 key 枚举**：`docs/server/design/accounts/ACCOUNTS.md:34`（`GET /api/members` 行补「各成员 key 清单（`[{ "id", "hint" }]`——提示形 + id；仅列未吊销）」）∥ `:71`（§6 增 KD-SV-16——不设 `/api/members/:id/keys` 子资源）∥ `:83`（§7 增 N11——admin 吊销正路 ⇒ 该 key 下一请求 401）∥ `docs/server/design/webui/WEBUI.md:19`（管理视图数据源句——吊销控件数据源）∥ `docs/server/design/PROJECT.md:103`（§4 索引增 KD-SV-16；标题 1–15 ⇒ 1–16）。
  - **② 🟡 AC-8 零映射**：`docs/server/design/PROJECT.md:138`（§7 补 AC-8 行——判据 = `ops/OPS.md` §7；载体 = 收口轮）∥ `docs/server/design/ops/OPS.md:146`（§7 补 AC-8 判据行——pack dry-run ∥ docker build + compose 起停 ∥ unit 安放可启）。
  - **③ 🟡 R7 滞留**：`docs/server/design/PROJECT.md:161`（§9 R7 销项——三子项均已办（需求档回笔 2026-10-06 在册）；R6 处置列「= R7」死指针就地改「已办」——一致性面连带、已报告）。
  - **④ 🟡 集群路由零落点**：`docs/server/design/EVOLUTION.md:23`（§2 增「集群模型感知路由」触发行——触发 = 集群（DGX-spark）就位；决策点 = 组语义与 KD-SV-4 精确清单的关系；台账 #955 互指）。
  - **⑤ 🔵 ops 行缺档**：`docs/server/design/PROJECT.md:30`（§2.1 ops 行补列 `config.example.json` ∥ `README.md`——与域预算表 ≈765 对齐）。
  - **⑥ 🔵 .gitignore 行**：`docs/server/design/PROJECT.md:122`（§6 随动表——路径改仓根相对 `.gitignore`（仓根）；量列补「现行 35 行 ⇒ 预期 37 行（+2）」）。
- **披露（二择一论证）**：① 端点形态取「扩 `GET /api/members` 行内附清单」——一次装配管理页（表 + 吊销控件同响应）∥ 与 `GET /api/me` 同形 ∥ 端点面零增；否「子资源 `GET /api/members/:id/keys`」（N+1 请求 ∥ 无其它消费方）——KD-SV-16 全文在册。② 集群路由取「设计落点」而非「住台账」——与派发层（KD-SV-4）直接相干，EVOLUTION §2 是开批时设计侧唯一入口；台账 #955 = 需求池行，两者互指。
- **机检读数**：`node scripts/doc-check.mjs` **exit 0**（悬空 0 ∥ 行宽 0；候选 49313 · 拟新增 81——修复轮后复跑）。
- **边界**：需求档零笔（只读——回笔已在册）∥ 他批/他段零触 ∥ 产品码零写。

### 2.12 实施后回填轮（七条逐号落位 · fix 轮 · 2026-10-06）

- **轮次定位**：fix 轮（实施后回填——实测读数入设计档 + 六处小收面；触发 = 批档 §5.4 ∥ §5.8 ∥ §5.12 ∥ §5.16 上抛归批；行数单源 = §5 各段实读列表 + §5.17 口径补正——本作者本轮逐档复测（内容行数 ∥ 文末换行不计）与 §5.17 同值）。
- **号 → 改动（file:line 终值）**：
  - **① `internal_error` 入表**：`gateway/API.md:40`（§3 补 500 兜底行——处理函数自身异常；实读 = `thincoder-server/src/gateway/errors.mjs:21`）。落位时 L39 追加即 325 字符超宽 ⇒ 当轮拆行闭环（L39 复原枚举 ∥ 500 独立成行——复跑行宽 0）。
  - **② 行数实读回填**：`PROJECT.md:114`（口径 ∥ 全树 **2720 行 ∥ 31 档**）∥ `:116`（板级 ≈30 ⇒ 25）∥ `:117`（各域 ≈770/570/260/175/680/765 ⇒ 635/493/218/110/558/681；合计 ≈3220 ⇒ 2695 ∥ 总账 ≈3250 ⇒ 2720）∥ `:125`（批内件：实读 460 行 + 按域拆档四件 493/188/496/318）；域表六处：`gateway/API.md:46–54` ∥ `accounts/ACCOUNTS.md:45–52` ∥ `metering/METERING.md:39–44` ∥ `store/STORE.md:75–77` ∥ `webui/WEBUI.md:13+34–41` ∥ `ops/OPS.md:128–140`。行式 = 实读值（实读日期——设计估）；小计 ∥ 汇总 = 「预算 ⇒ 实读」。
  - **③ §8 实施序收面**：`PROJECT.md:148`（新行「实施序（派单为准）」——实施 = 四阶段：骨架 → 账号与计量 → 聊天链 → 控制台/向量/部署；「实施顺序建议」= 设计时划分、仅参考——非执行序）。
  - **④ `--label` 收正**：`ops/OPS.md:56`（`key issue <member>` 行撤 `[--label <l>]`——本批不提供；与 `src/ops/cli.mjs` 实装、README 同形）。
  - **⑤ OPS 两处可跑性**：`ops/OPS.md:102`（§5.3 裸机路 env 落点 = systemd `EnvironmentFile`（缺省 `/etc/thincoder-server.env`——unit 模板在册））∥ `:120`（§5.7 Docker 路 6 ⇒ 7 步——补 `docker build` 步）。
  - **⑥ 密码上界注明**：`accounts/ACCOUNTS.md:20`（§2 补「长度不设上界（已审定：无 DoS 面）」——「注明」支）。
  - **⑦ 阶段标记（设计侧）**：设计面唯一阶段标记 = §8（随 ③ 收面）；全库代码标记扫面 = bin ∥ providers ∥ server ∥ quota ∥ usage 各注均与四阶段派单号一致（无动作）；`errors.mjs:5`「（非本档面——D4）」为唯一与派单号不一致者 ⇒ 不触产品码 + 上抛（见披露②）。
- **披露**：① 行式 = 文件行「实读值（实读日期——设计估）」（沿桌面板块 §5.1 已声明体例；粗体实读居首——他日可入 `checkConfig.lineCounts` 声明面），小计 ∥ 汇总 = 「≈预算 ⇒ 实读」；② `errors.mjs:5` 残标 + `:21` 行内「待设计 §3 补记」注（① 落地后成历史）——产品码零触，随下一个开产品码的笔收面（段号删 ∥ 改稳定引用——与 routes.mjs 档头 D3 收面同形）；③ `PROJECT.md:110` KD-SV-2 行内「≈80」未动（不改 KD 决策口径——非表内数；sse-tap 实读 90 在 API §4 表）；④「（拟新增）」标记未动（全树已交付——该标记收面非本项射程）。
- **机检读数**（`node scripts/doc-check.mjs` · 仓根 · 终态复跑）：exit 1（他批悬空驱动）；**本批触面：悬空 0 ∥ 行宽 0**；汇总 = 候选 49324 ∥ 悬空 **58**（core 30 ∥ desktop 25 ∥ cli 1 ∥ render-core 1 ∥ vsc 1——他批新树 basename 碰撞，台账 #958 在册）∥ 注记豁免 329 ∥ 拟新增 52 ∥ 迁移期引文 303 ∥ 声明源缺位 0；server 域 2 条 = 「（拟新增）」列报不入闸（非本轮引入）；行数面：差异 13（声明面 = 桌面域——本批零触）。
- **边界**：产品码零写 ∥ 需求档零笔 ∥ 批档 §1/§3/§4/§5 零笔 ∥ 他批零触；决策面：KD-SV-1–16 零改（唯一例外 = ⑧ 明令 KD-SV-4 随正）。

### 2.13 增补（⑧ 模型标识口径变更 · 用户 10:27–10:28 · 同轮落位）

- **口径**：模型标识 = `provider/model`（**斜杠形**——用户 10:28；**首斜杠切分** ∥ 首段 = provider ∥ 余段 = 上游模型名（可含斜杠）∥ 两段非空 ∥ 裸名不解析；**server 面自持解析**——与核 `parseModelRef` 冒号家族两套面）；`/v1/models` = 带前缀名清单；同名模型跨 provider **并存且各自可达**；**同 provider 内重名 ⇒ 拒启**（原「跨 provider 重名 ⇒ 拒启」收正）；否决备选补「裸名兜底解析 ⇒ 否（无隐式解析）」。
- **号 → 改动（file:line 终值）**：`gateway/API.md:24`（§2 `/v1/models` 行）∥ `:29`（§2.1 派发行——复合键 ∥ 首斜杠切分 ∥ 两套面）∥ `:67`（KD-SV-4 修订）∥ `:78`（N4 前缀形）∥ `PROJECT.md:91`（§4 索引 KD-SV-4 行）∥ `ops/OPS.md:33`（§1 `models` 格——对外标识）∥ `:37–38`（§1 校验改「同 provider 内重名」∥ 补对外标识句）。
- **对表**：需求档（父侧已收正 `docs/server/requirements/PROJECT.md:105`——只读核过，零触）；产品码（`providers.mjs` ∥ `config.example.json` ∥ 批内件断言 ∥ `README.md`）零触 ⇒ **待 code fix 轮**（上抛）。
- **机检**：同 2.12 终态（增补 + 拆行后复跑——行宽 0 ∥ 本批触面悬空 0）。

### 2.14 小收尾轮（三条逐号落位 · fix 轮 · 2026-10-06）

- **轮次定位**：fix 轮（点改——三条逐号落位，不做全面重审）；来源 = 本档 §5.18 上抛①②③（评审两条 🟡 + 一条 🔵——均非 must-fix）。
- **号 → 改动（file:line 终值）**：
  - **① provider `name` 校验条**：`ops/OPS.md:37`（§1 启动校验枚举补三判据——`name` 缺/空 ∥ 含 `/` ∥ 重名（providers 间）；违 ⇒ 非零退出 + 明确报错——与「同 provider 内模型重名」并列、fail-closed 沿既有体例）∥ `:38`（补判据缘由行——对外标识 `provider/model` 首斜杠切分：`name` 缺/空 ∥ 含 `/` ⇒ 前缀形不可解析（清单列示而派发 404）；重名 ⇒ 派发歧义）。
  - **② 记账 `model` 列语义注**：`metering/METERING.md:11`（§1 行形段后补——`model` 列 = **对外标识**（`provider/model` 前缀形——记账以对外标识记；上游余段不单独入账））。
  - **③ 行数账再收正**：`gateway/API.md:49`（routes **75 ⇒ 81**）∥ `:50`（forward **183 ⇒ 185**）∥ `:52`（providers **40 ⇒ 55**）∥ `:54`（小计 **≈770 ⇒ 658**）∥ `ops/OPS.md:140`（README **117 ⇒ 119**）∥ `:141`（小计 **≈765 ⇒ 683**）∥ `PROJECT.md:114`（全树 **2720 ⇒ 2745 行**——31 档）∥ `:117`（gateway 635 ⇒ 658 ∥ ops 681 ⇒ 683；合计 **2695 ⇒ 2720** ⇒ 总账 **2745**）∥ `:125`（批内件 **五件 ⇒ 六件**——基准件 **460 ⇒ 486** ∥ 拆档五件：accounts 493 ∥ metering 188 ∥ chat 498 ∥ webui-deploy 321 ∥ 新 `-model-ref` 155）。
- **核读（本作者逐档复测——内容行数 ∥ 文末换行不计）**：全树 31 档合计 **2745**（与 PROJECT.md 总账一致）；providers 55 ∥ routes 81 ∥ forward 185 ∥ README 119；批内件六件 = 486/493/188/498/321/155；其余三域表（accounts ∥ store ∥ webui）逐行核 = 与实读一致（零漂移——未动）；「预算 ⇒ 实读」体例沿 #19 已建形。
- **机检读数**（`node scripts/doc-check.mjs --root d:/teamcode/thincoder`——终态复跑）：**本批触面零悬空 ∥ 行宽 0**；整档悬空 **58**（他批在册 #958——core ∥ desktop ∥ cli ∥ render-core ∥ vsc）∥ 拟新增列报 52（server 域 2 条 = `config.json`「拟新增」——沿 #19，非本轮引入）∥ 声明源缺位 0；行数面差异 **13** = 桌面声明面（本批零触）。
- **边界**：产品码零写（① 的 `config.mjs` 加固 = 随后的 code 轮）∥ 需求档零笔 ∥ 批档 §1/§3/§4/§5 零笔 ∥ 他批零触；决策面 KD-SV-1–16 零改（① 为配置准入面补条——单源 OPS §1；与 KD-SV-4 派发语义无冲突）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Requirements coverage ∥ Clarity | 🔴 | 管理面「吊销 key」无数据来源（页面吊销路径不可按设计实现）：`webui/WEBUI.md:19` 原文「设额度 ∥ 吊销 key ∥ 重置密码」声明控件；吊销端点按 `keyId` 寻址（`accounts/ACCOUNTS.md:36` 原文「吊销指定 key（立即生效）」），但管理面成员数据源不返回 key 清单（`accounts/ACCOUNTS.md:34` 原文「全队成员 + 额度 + 本月已用」）；本人 key 清单仅自助面（`accounts/ACCOUNTS.md:31` 原文「+ 本人 key 清单（提示形）」）；`/api/usage` 行形仅含 `keyHint`（`metering/METERING.md:27`）——admin 无法取得 `:keyId`。需求把吊销归页面管理写面（`requirements/PROJECT.md:39` 原文「admin 登录管成员/配额/吊销（现看板升级为受门禁的管理页）」） | 在管理面补成员 key 枚举：`GET /api/members` 附 key 清单（提示形 + id）或新增 `GET /api/members/:id/keys`；并补一条正路用例（admin 吊销 ⇒ 该 key 下一请求 401） |
| 2 | Requirements coverage ∥ Acceptance criteria | 🟡 | 需求 AC-8（分发与部署）在设计集零映射：`requirements/PROJECT.md:54` 判据原文「`npm pack --dry-run` 通过（`files` 白名单齐 ∥ 零 install 步）∥ `docker build` 成功 + compose 起停通 ∥ systemd unit 安放可启」；设计 `PROJECT.md:126`「验收对照（需求 §2 验收表 → 判据域档）」AC 行止于 AC-7（`PROJECT.md:136`），其后仅非功能三行与文档面行（`PROJECT.md:137–140`）；`ops/OPS.md:145` 验收判据仅一行（原文「`host` 必填（缺失 ⇒ 拒启——fail-closed）」）；全设计集 grep 无 AC-8 ∥ npm pack ∥ docker build 字样 | 在 `PROJECT.md` §7 补 AC-8 行（判据 = `ops/OPS.md` §5），并在 `ops/OPS.md` §7 落机检判据行（pack dry-run ∥ docker build ∥ compose 起停 ∥ unit 安放可启）与载体 |
| 3 | Documentation state | 🟡 | 设计 `PROJECT.md:160` R7 行仍把「需求档回笔」列为待办（处置列原文「父侧回笔」），而需求档变更记录已记该回笔完成并含 AC-8 增补（`requirements/PROJECT.md:104` 原文「验收表补 **AC-7**（B 案七判据 ∥ `accounts/ACCOUNTS.md` §5）∥ **AC-8**（分发与部署）两行」）——报告面滞留旧态 | 将 R7 行收面为已办（或改写为仅列未办项），并把 AC-8 落点并入 §7 对照 |
| 4 | Requirements coverage ∥ Evolution | 🟡 | 需求 §5 后续议题「内部算力集群的**模型感知路由**归本件（模型名 → 后端组 ∥ 组内挑实例——集群就位时开批，台账在册）」（`requirements/PROJECT.md:87`）在设计集零落点——设计全集无「集群/模型感知路由/后端组」字样；`EVOLUTION.md` §2 触发表仅三行（`EVOLUTION.md:22` 原文「**多实例**（≥2 实例 ∥ 进程外前置）」/团队协同/对外面） | 在 EVOLUTION §2 补触发行（触发 = 集群就位 ∥ 决策点 = 派发层扩展方式——与 KD-SV-4 精确清单的关系），或注明该议题住台账、设计不落点 |
| 5 | Document consistency | 🔵 | `PROJECT.md:30` ops 行只列「`thincoder-server/src/ops/` 三档（config ∥ log ∥ cli）+ 部署档组」，未含 `config.example.json`（`ops/OPS.md:133`）与 `README.md`（`ops/OPS.md:138`）——二者计入 ops ≈765（`OPS.md:139`），责任地图与域预算表不完全对齐 | §2.1 ops 行补列这两档（或注明预算表含附属档） |
| 6 | Affected-file annotations | 🔵 | 既有随动表 `.gitignore` 行（`PROJECT.md:121`）仅给增量「+2 行」、无现行行数；路径「`thincoder/.gitignore`」为工作区相对，与设计内仓根相对惯例（同表 `thincoder-server/data/`）混用 | 统一为仓根相对写法并补现行行数（或注明非 source/test 档豁免口径） |

计数：🔴 1 ∥ 🟡 3 ∥ 🔵 2

VERDICT: changes-required

### 轮次 2（评审子代理）

## 轮次 2（复核）——发现表

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | accounts/ACCOUNTS.md ∥ webui/WEBUI.md ∥ design/PROJECT.md | 🔴 | Fixed | 管理面 key 枚举补记核实：`accounts/ACCOUNTS.md:34`「全队成员 + 额度 + 本月已用 + 各成员 key 清单（`[{ "id", "hint" }]`——提示形 + id；仅列未吊销）」；KD-SV-16（`accounts/ACCOUNTS.md:71`「**管理面 key 枚举 = `GET /api/members` 成员行内附清单**（提示形 + id；仅列未吊销）——不设 `/api/members/:id/keys` 子资源」）；正路用例 N11（`accounts/ACCOUNTS.md:83`「admin 会话 + `GET /api/members`（取成员行内 key id）→ `POST /api/members/:id/keys/:keyId/revoke`」）；页面数据源句（`webui/WEBUI.md:19`「各成员 key 清单——提示形 + id，吊销控件数据源」）；索引行（`design/PROJECT.md:103`「管理面 key 枚举 = 成员行内附清单（提示形 + id）」） |
| 2 | 2 | design/PROJECT.md ∥ ops/OPS.md | 🟡 | Fixed | AC-8 映射核实：`design/PROJECT.md:138`「AC-8（功能点 8——分发与部署）」行判据 =「`ops/OPS.md` §7 判据（`npm pack --dry-run` 通过——`files` 白名单齐 ∥ 零 install 步；`docker build` 成功 + compose 起停通；systemd unit 安放可启）」；`ops/OPS.md:146`「`npm pack --dry-run` 通过（`files` 白名单齐 ∥ 零 install 步）∥ `docker build` 成功 + compose 起停通 ∥ systemd unit 安放可启（`systemd-analyze verify` ∥ `enable --now` 后 `is-active`——unit 模板 = §5.2）」 |
| 3 | 3 | design/PROJECT.md | 🟡 | Fixed | R7 销项核实：§9 表现 R1–R6（R6 处置 =「需求档回笔已办（2026-10-06——需求档变更记录在册）」）；变更记录 `design/PROJECT.md:167`「#3 §9 R7 销项（需求档回笔已办——2026-10-06）」；设计集内无其它 R7 引用（grep 核） |
| 4 | 4 | EVOLUTION.md | 🟡 | Fixed | 集群路由触发行核实：`EVOLUTION.md:23`「**集群模型感知路由**（模型名 → 后端组 ∥ 组内挑实例——需求 §5 定案；台账 #955 在册）｜内部算力集群（DGX-spark）就位——就位时开批｜派发层扩展方式——组语义（模型名 → 后端组）与 KD-SV-4 精确清单派发的关系」 |
| 5 | 5 | design/PROJECT.md | 🔵 | Fixed | §2.1 ops 行核实：`design/PROJECT.md:30`「模板/说明档（`thincoder-server/config.example.json` ∥ `thincoder-server/README.md`）（拟新增）」——与 `ops/OPS.md` §6 预算表对齐 |
| 6 | 6 | design/PROJECT.md | 🔵 | Fixed | `.gitignore` 行核实：`design/PROJECT.md:122` 路径「`.gitignore`（仓根）」；行数「现行 35 行 ⇒ 预期 37 行（+2）」 |

新问题：无（未发现修复引入的 🔴/🟡——无崩溃/数据丢失/逻辑错误类）。

计数：Fixed 6 ∥ Accepted 0 ∥ Unfixed 0 ∥ New 0
VERDICT: pass
（token/designId 不写入批档——凭证机械剥离）

## §4 用户批准（主 agent）

**父侧代签（用户 2026-10-06 08:32「点火。自动跑完」全链授权）**

- **三条件齐备**：① 评审 **pass**（§3 轮次 2——轮次 1 六条 = Fixed 6 ∥ New 0；复审判定 = 六条修复逐项核验落位）；② 修正轮已落地并逐条核验（父侧回读 + 轮次 2 复评）；③ **token 已签发**（评审回执——值不入档）。另注 = 轮次 2 首飞（`#8`）挂死——已取消并重发（`#11`）；取消轮无 token 残留。
- **批准范围** = 实施轮（四阶段 D1–D4 串行派遣——沿设计 §8 顺序；每阶段 ≤15 档写域）：全树 31 档 ≈3250 行 + 批内件 + `.gitignore` +2 行。
- **依据登记** = §3（轮次 1/2）∥ §2 补轮 ∥ 本档状态行。可撤回（用户任何时点否决 ⇒ 实施止付 ∕ 回滚）。

## §5 实施记录（eng-coder）
**状态行**：实施完成 2026-10-06（D1–D4 全落；10-06 两 fix 轮（§5.18 模型标识 ∥ §5.19 provider name 校验）：六件 48/48 绿 ∥ explore 审计 0 偏差 ∥ advisor 1 轮 pass ∥ 终态 clean）



### 5.1 轮次定位与交付面（D1/4 骨架 · round initial）

- **本阶段 = D1/4**（设计 §8 序列首段）：配置 ∥ 库 ∥ 日志 ∥ 错误形 ∥ HTTP 服务与路由注册制 ∥ provider 注册与模型派发 ∥ 配置模板；产出 = 可启动骨架 + 批内件起步。**不落** D2–D4 面（鉴权 ∥ 配额 ∥ 计量 ∥ CLI ∥ 转发 ∥ SSE ∥ 看板 ∥ 部署）——全树恰九档 + 批内件，越界面零触。
- **十档落位（实读行数 vs 预算）**：`thincoder-server/package.json` 25（≈30）∥ `bin/thincoder-server.mjs` 96（≈50——超，见 5.2）∥ `src/ops/config.mjs` 139（≈150）∥ `src/ops/log.mjs` 35（≈35）∥ `src/store/db.mjs` 110（≈175）∥ `src/gateway/errors.mjs` 55（≈50）∥ `src/gateway/server.mjs` 145（≈140）∥ `src/gateway/providers.mjs` 44（≈70）∥ `config.example.json` 28（≈40）∥ 批内件 `docs/batches/2026-10-06-server-gateway.test.mjs` 437（无预算）。全部 ≤300 软线。
- **既有随动**：`.gitignore`（仓根）+2 行（`thincoder-server/data/` ∥ `thincoder-server/config.json`；现行 35 ⇒ 37——与设计 §6 预期一致）。
- **机检读数**：`node --check` 8 档全绿；`node --test docs/batches/2026-10-06-server-gateway.test.mjs` **13/13 绿**；`npm pack --dry-run` exit 0（9 档入包 ∥ 白名单外零入）；`npm run prepublishOnly` exit 0；依赖面扫描 **14 条 import 仅 `node:`/相对**，`dependencies` 无字段。
- **启动冒烟实跑**：无 `--config` ⇒ exit 1 + `startup_failed`「缺少 --config」；合法 config ⇒ `ready`（host/port/db/routes 单行 JSON）+`GET /v1/models` 200 + 逐请求一行日志（method/path/status/ms）；信号 ⇒ `shutdown`+`stopped`+exit 0（**Windows 平台注记**：`process.kill(pid,'SIGTERM')` 为强制终止、不投递 handler——优雅路径读数 = 子进程内 `process.emit('SIGTERM')` 驱动同一 handler；Linux 生产面 = 真信号）。

### 5.2 决策透明表（本阶段的自选口径与披露）

| # | 项 | 决定 | 依据 ∥ 影响 | 回退 |
|---|---|---|---|---|
| 1 | package.json `private` | **撤 `private` + 补 `prepublishOnly`**（评审 🔴 收正） | 设计单源 `ops/OPS.md:73`「转可发布形——撤 `private`」（本批只做包体）+ `PROJECT.md:116`；**与任务书「private: true（可发布形转正 = 发布面轮）」相抵**——按设计收正并披露；如父侧仍要暂留 ⇒ 回滚 = 2 行 | 反向加回 `"private": true` |
| 2 | package.json `version` | `0.1.0`（占位） | `npm pack` 无 version 即拒（AC-8 前置实跑核）；版本号定案 = 发布面轮 | 发布面轮改号 |
| 3 | package.json `files` 白名单 | 采用（bin ∥ src ∥ public ∥ config.example.json ∥ README.md） | 设计 §6；护 `config.json`/`data/` 不入包（打包面实读：9 档） | — |
| 4 | `/v1/models` 处理器 + 注册行落点 | 落 `providers.mjs`（清单 = 配置派生，同域） | D1 文件单无 `routes.mjs`（设计 §4 表终值归它）；D4/D5 建 routes.mjs 时可迁并——勿双主 | 迁档 = 移函数 + 注册行一行 |
| 5 | `/v1/models` 无鉴权 | 本阶段直通（原型） | 设计 §8 鉴权 = 后续分期；代码注释 + 批内件断言注记（「团队 key 接线落地后改无 key ⇒ 401」）；收口前须带 key | 后续分期接线 |
| 6 | `internal_error`（500 兜底） | 纳入错误表（表外） | 设计 §3 全码表无此行——处理函数异常须有兜底形，不静默换形；**待设计 §3 补记（父侧）** | 表随设计补记 |
| 7 | 路由注册表支持 `:参数` | 支持（段形捕获） | accounts/metering 端点表（`/api/members/:id/…`）需之；D1 注册行制可用即可用 | — |
| 8 | `readJsonBody` 边界 | settle 后保留 `error` 监听（后续套接字错误空转不抛）+ `readableEnded` 二次调用守卫（抛 500） | 评审 🔵 收正（防断连时序抛 / 防二次调用悬停） | — |
| 9 | `closeApp` 停机上界 | `graceMs` = 10s ⇒ 强制断连（`shutdown_forced` 日志） | 评审 🔵 收正（防流式长连无限拖停；设计 §4 只定义停收新连 ∥ 关库） | 参数可调 |
| 10 | `db.mjs` 未含「语句封装」 | 延后（D1 无消费方） | 设计预算表职责含之——归 D2+ 各域自持查询；轮末按实读回填 | — |
| 11 | config `db: ":memory:"` | 直通 | 测试面注入缝（STORE.md 曾否内存存储 = 运维面口径；如防误配可在校验面拒——待父侧口径） | 加一行校验 |
| 12 | 批内件 437 行 > 300 建议线 | 保持单档 + 拆档计划 | D2–D5 用例续增将越 500 硬限——拆档（按域）须在 D2 前决策 | 拆档 = 按域切分 |
| 13 | bin 96 行 vs 预算 ≈50 | 超（+92%） | 超出量 = argv 双形/USAGE ∥ 启动失败清理 ∥ 信号接线 ∥ `closeApp` 上界；**行为无缺**——预算回填见 5.4 上抛 | 可裁（可拆装配函数出档） |

### 5.3 审计与评审轮次与终态

- **内部偏差审计（explore 只读）**：发现表 1 条 🟡（`internal_error` 表外码——与评审合并处置）；DDL 逐字对照 **0 差异**（四表 + 三索引 + 四 PRAGMA）；越界面 0；依赖面 0；漂移候选 a–e 五条实核 ⇒ 违规成立 1（同上）、4 条判「计划内过渡态」。
- **独立代码评审（advisor · code）**：🔴1 ∥ 🟡3 ∥ 🔵5 ⇒ **VERDICT changes-required**。收正轮 1（本段）：① 🔴 package.json 撤 `private` + 补 `prepublishOnly`（实跑 `npm run prepublishOnly` exit 0）② 🔵 分期标签（providers/bin 注「后续分期」）③ 🔵 `readJsonBody` 边界两条 ④ 🔵 `closeApp` 上界 ⑤ 🟡 批内件 `/v1/models` 断言加注记（鉴权落地同轮改）。余：🟡 `internal_error` 设计补记（父侧）∥ 🟡 测试档拆档决策（D2 前）∥ 🔵 请求日志断连面（D4 接线时补）——均已登记归属。
- **终态 = clean**（🔴 已收正 ∥ 协调项 3 条各归其主、无滞留无名项）。

### 5.4 交卷读数（收正轮后复跑）与上抛

- 复跑：`node --check` 8 档全绿 ∥ 批内件 13/13 绿 ∥ `npm pack --dry-run` exit 0 ∥ `npm run prepublishOnly` exit 0 ∥ 冒烟四读数（见 5.1）。
- **上抛（父侧处置）**：① **设计 §6/OPS §6 预算回填**（实读行数 = 5.1；bin 超预算已在册）② `internal_error` 入 `gateway/API.md` §3 补记 ③ **任务书 vs 设计冲突点**（`private`）已按设计收正——如要反向保留请指示（2 行回滚）④ 批内件拆档决策（D2 前）⑤ 收口轮前置：真实上游 + 内网嵌入引擎可达（AC-2/AC-6）∥ 本机 Node = v24.19.0。

### 5.5 轮次定位与交付面（D2/4 · 账号与计量域 · round initial）

- **本阶段** = D2/4（父侧派发：账号与计量域——登录制与记账面可跑）：accounts 五档 ∥ metering 三档 ∥ `ops/cli.mjs` 七命令 ∥ 接线改笔（`gateway/server.mjs` 写端点型门 ∥ `bin` bootstrap + 三域注册行 ∥ `package.json` 门禁）∥ 批内件 **两件新增**（`-accounts` ∥ `-metering`）。**不落** D3/D4 面（转发 ∥ SSE ∥ 看板 ∥ 部署）。
- **十档落位（实读行数 vs 预算）**：`accounts/keys.mjs` 98（≈120）∥ `members.mjs` 161（≈90——超，见 5.8-②）∥ `session.mjs` 95（≈90）∥ `routes.mjs` 81（≈150）∥ `routes-admin.mjs` 58（≈120）∥ `metering/usage.mjs` 132（≈130）∥ `quota.mjs` 27（≈50）∥ `metering/routes.mjs` 59（≈80）∥ `ops/cli.mjs` 179（≈240）∥ 接线：`gateway/server.mjs` 162（≈140）∥ `bin/thincoder-server.mjs` 111（≈50——D1 超已在册）。全部 ≤300 软线。
- **既有随动**：`.gitignore` +2 行已由 D1 落位（复核确认——本阶段零改）。
- **交付面（全档）**：新 9 档（accounts 五 + metering 三 + cli）× 接线 3 档（server ∥ bin ∥ package.json）× 批内件 2 档（`docs/batches/2026-10-06-server-gateway-accounts.test.mjs` 493 ∥ `-metering.test.mjs` 188；D1 件 437 零改）。

### 5.6 决策透明表（本阶段自选口径与披露）

| # | 项 | 决定 | 依据 ∥ 影响 | 回退 |
|---|---|---|---|---|
| 1 | CLI `key issue --label` | **裁 = B**（父侧 09:1x 裁定）——本阶段不提供；无迁移 v2、无表形动 | OPS §3 该参数过设（零消费方 ∥ 表形单源无 label 列）；该行收正入「设计回填轮」（父侧在册） | 若改判 A ⇒ 迁移 v2 + CLI 落 label |
| 2 | 成功响应体形（设计留白处自选） | `/api/me` ∥ 成员行同形 `{id,name,username,role,quotaTokens,usedTokens,keys[{id,hint}]}`；login `{ok,member}`；rotate `{id,hint,plain}`；建成员 `{id,name,username,role,tempPassword}`；reset `{id,tempPassword}`；quota `{id,quotaTokens}`；成功统一 200 | ACCOUNTS §3 只钉语义未钉体形；本人面 ∥ 管理面同形（KD-SV-16）便于前端一次装配 | 形随 D4 前端按需微调 |
| 3 | 重名 ⇒ 400 `invalid_request_error`；吊销幂等 | 全码表无 409——就近取 400；`key revoke` 已吊销 ⇒ 幂等 200（行保留纪律） | gateway/API.md §3 全码表（closed）；软删语义 | — |
| 4 | 写端点型门 = **严格**（缺 `Content-Type` 亦 400） | `/api/*` 非 GET/HEAD 一律要求 `application/json`（允许 `; charset` 参数）；落分派层（server.mjs）统一 | §3 前言「仅收 application/json」+ 跨站第二道（无体型请求 = 跨站可直发形）；D4 前端所有写（含无体）须带 JSON 头 | 若放宽（缺型放行无体）⇒ 1 行条件 |
| 5 | `/api/usage` `member` 过滤 | 全数字 ⇒ id；否则按展示名；未命中 ⇒ 空集（−1 哨兵） | 设计只写「过滤：member」未钉编码 | — |
| 6 | CLI `member passwd` = 重置语义 | 吊销该成员**全部**会话（同 KD-SV-14 口径）；`key revoke` 幂等提示 | OPS §3「本机兜底」+ 与页面同库同语义 | — |
| 7 | metering 查询键模板字面量 | `key(\`from\`)` 等（规避冻结 D1 件扫描正则 `\bfrom\s*["']` 的误报）；档内注释在案 | 见 5.8-③；行为等价 | D1 件解锁轮改回常规写法 |
| 8 | 修复轮三笔 + 两条断言（评审 🔵 收正） | ① `quota.mjs` 缺成员守卫 ② `members.mjs` 散列参数越界/抛错 ⇒ false（防 500） ③ `cli.mjs` 选项缺值 ⇒ 报错（防静默重置） | advisor 轮 1 🔵#6/#7/#8；轮 2 逐条 Fixed；新增断言两条收口 | — |
| 9 | `package.json` 改笔（清单外） | `prepublishOnly` 收三件批内件（原仅 D1 件） | OPS §5「批内件冒烟」门禁意图；单行、可回退 | 反向删 metering 一项 |

### 5.7 审计与评审轮次与终态

- **内部偏差审计（explore · 只读）**：四类（部分实现 ∥ 静默简化 ∥ 文档漂移 ∥ 越清单）**0 条**；披露级 4 条——全部处置：① 预算超（在册→5.8）② `prepublishOnly` 漏 metering 件（当轮已补）③ 批档记录面收正建议（父侧）④ 模板字面量耦合（在册→5.6-7）。
- **独立代码评审（advisor · code）轮 1**：无 🔴；🟡4（/v1/models 鉴权协调项 ∥ OPS `--label` 文档态 ∥ 设计 §8 序不一致 ∥ 批内件软线——**均非 must-fix**）∥ 🔵10 ⇒ **VERDICT pass**。
- **轮 2（修复验证）**：三笔修复逐条 **Fixed**（含回归面核：`keys.mjs:41` 成员形 ∥ CLI 唯一 spawn 点 ∥ 正常编码串过新界）；另出 2 条覆盖缺口（守卫与 catch 分支无断言）⇒ **当轮收口**（追加断言各一条，复跑绿）；**VERDICT pass**。
- **终态 = clean**（🔴 0 ∥ must-fix 0；协调/文档态项归父侧回填轮与 D3 归属裁定）。

### 5.8 交卷读数（复跑）与上抛

- **复跑读数**：`node --test` 三件 **28/28 绿**（437/493/188 行，全 ≤500）∥ `node --check` 服务树 13 `.mjs` 全绿 ∥ CLI 冒烟实跑（`member add` → `key issue` → `key list` → `member quota` → `member list` → `key revoke`——读数原样在册）∥ 零依赖扫描（D1 件扫描面自动覆盖新档）∥ `prepublishOnly` 含三件。
- **验收命令（对父侧终值）**：`node --test docs/batches/2026-10-06-server-gateway.test.mjs docs/batches/2026-10-06-server-gateway-accounts.test.mjs docs/batches/2026-10-06-server-gateway-metering.test.mjs`（自 `thincoder/` 仓根）——**较原两件命令 +1 档**：新档单件曾达 616 行超 500 硬限 ⇒ 按「按域分文件」令再拆（accounts ∥ metering）。
- **上抛（父侧处置）**：① **`/v1/models` 鉴权**：批档 §1.4-③ 指定「D2 接入」——本阶段写域不含 `providers.mjs`，且冻结 D1 件正压「无 key ⇒ 200」（`test.mjs:388–390`）⇒ 建议判归 D3 并解锁该断言改写（两处须同轮授权）∥ ② **预算回填**（实读 = 5.5；`members.mjs` +71%）∥ ③ **OPS §3 `--label` 行**收正（回填轮在册）∥ ④ **设计 §8 序**（五段建议 vs 四阶段派单）收面 ∥ ⑤ 密码长度无上界（加界须设计行）∥ ⑥ 批档记录面旧述（「/v1/models 鉴权 = D2 接入」等）以父侧最新口径为准。

### 5.9 轮次定位与交付面（D3/4 · 聊天链 · round initial）

- **本阶段** = D3/4（父侧派发：聊天代理链——`/v1/chat/completions` 全链可跑 ∥ mock 上游可测；**增补①**：`/v1/models` 鉴权判归 D3——解锁 `providers.mjs` + D1 件断言两处授权改笔）。**产出**：`src/gateway/sse-tap.mjs` ∥ `forward.mjs` ∥ `routes.mjs`（chat/models 两面；embeddings = 后续阶段同档增量）∥ `server.mjs` 接线改笔（断连请求日志面）∥ 批内件新档 `docs/batches/2026-10-06-server-gateway-chat.test.mjs`；`bin` ∥ `package.json` 联动改笔（清单外，见 5.10）。**不落** embeddings ∥ webui/部署（后续阶段）。
- **落位与实读行数（vs 预算）**：`sse-tap.mjs` **91**（≈80——微超）∥ `forward.mjs` **183**（≈190）∥ `routes.mjs` **46**（≈240）∥ `server.mjs` **178**（≈140——D2 已 162 在册；+16 = 断连日志块 :54-69）∥ `providers.mjs` **41**（≈70——迁出注册行）∥ `bin/thincoder-server.mjs` **111**（注册行对换，零增行）∥ 批内件 `…-chat.test.mjs` **496**（≤500 硬限）∥ D1 件 **460**（授权改笔 +23，原 437）。全部 ≤300 软线。
- **七步链逐条接线**（PROJECT §2）：[2] 鉴权 → [3] 配额准入 → [4] body→model 精确派发 → [5] 转发（真 key 代持）→ [6] 逐块透传 + 旁路 tap → [7] 终结单条落库（`routes.mjs:31-39` ∥ `forward.mjs`）。
- **行为要点**：KD-SV-5 注入（`stream===true` 且 `include_usage!==true` ⇒ 置 true；显式 false 亦覆盖；非流式不动）∥ KD-SV-10 有界 tap（单行上限 1 MiB 弃行续扫 ∥ BOM 剥除 ∥ CRLF 容错）∥ SSE 逐块透传字节零改 ∥ 上游 4xx/5xx 状态码与 body 原样透传 + error 行（token NULL）∥ 断连 ⇒ 中止上游 + `status='aborted'` ∥ 未命中 404 `model_not_found` ∥ 不可达 502 `upstream_error` ∥ 体 >32 MiB ⇒ 413 ∥ 准入前拒打不落用量。

### 5.10 决策透明表（本阶段自选口径与披露）

| # | 项 | 决定 | 依据 ∥ 影响 | 回退 |
|---|---|---|---|---|
| 1 | `/v1/models` 注册迁并 | `providers.mjs` 的 `registerModelsRoute` 删除；两面注册与鉴权归 `routes.mjs`（OpenAI 面统一登记） | ① 授权名下；设计 §4 表（routes = chat ∥ models ∥ embeddings 三处理）+ D1 §5.2-④「建 routes.mjs 时迁并——勿双主」 | 迁回 = 移函数 + 注册行一行 |
| 2 | `bin` 改笔（清单外） | 注册行对换 `registerGatewayRoutes(routes, { db, config })` | 迁并的机械必然（不换则启动即失败）；零增行 | 反向对换 |
| 3 | `package.json` prepublishOnly（清单外） | 第 4 件 `…-chat.test.mjs` 入发布门禁 | D2 先例（§5.6-9 同形单行）；chat 件头注「四件一并」互证 | 反向删一项 |
| 4 | `server.mjs` 断连日志面 | `finish`/`close` 双监听 + `logged` 守卫（断连行带 `aborted: true`；未发头 status 记 null） | D1 §5.3 遗留「请求日志断连面」（原注 D4 接线时补）；`finish` 对断连不触发，不补则该请求无行 | 删 16 行块 |
| 5 | 请求体重序列化（非流式 ∥ 已注入流） | parse→stringify（语义等值）；字节零改承诺面 = 响应中继 | [4] 派发须解析 body；设计字节零改面 = SSE 透传——披露 | — |
| 6 | 上游请求头最小面 | 仅 `content-type` + provider 真 key | 设计未钉出站头清单；「不认识内容」最小面 | 按需加头 |
| 7 | 上游超时 | 依赖 fetch 内建（未自设数值）；「连不上」形已测 E6 | 设计未给数值——不新造常量 | — |
| 8 | gzip/解码假设 | 档头钉死：中继体 = fetch 解码后字节 ⇒ 不回 `content-encoding`（探针实证 Node v24.19.0：gzip 上游经 fetch 到手即明文 JSON） | advisor 🔵#5「写死假设」路径；行为零改 | 若需透传压缩 ⇒ 另议 |
| 9 | 拒打不落用量 | 401/429/400/404/413 无 usage 行（仅进入转发的请求落行） | 设计借鉴经验「拒打不落用量」（PROJECT 头注）+ 表约束 | — |

### 5.11 审计与评审轮次与终态

- **内部偏差审计（explore · 只读）**：四类 **0 ∥ 0 ∥ 3 ∥ 0**——③ 三条均低/提示级且全部披露：`bin` ∥ `package.json`（① 迁并的机械必然与先例同形）∥ smoke 脚本（tmp 证据件）；13 项设计元素逐条齐备（file:line 在案）；七步链七步实接；九档语法复跑全绿。
- **独立代码评审（advisor · code）轮 1**：无 🔴；🟡1（批内件超 300 软线——在册债，非 must-fix）∥ 🔵4（档头阶段标记不可解 ∥ 404 形双构造 ∥ E4 非 JSON 覆盖缺口 ∥ 响应头/解码假设）⇒ **VERDICT pass**。
- **轮 2（修复验证）**：四笔逐条 **Fixed**（引用逐行复核：`routes.mjs:2/38` ∥ `forward.mjs:10-12` ∥ chat 件 `:392-394`）；#1 **Accepted**（在册债，R3 不升格）；**新问题 0** ⇒ **VERDICT pass**。
- **终态 = clean**（🔴 0 ∥ must-fix 0）。

### 5.12 交卷读数与上抛

- **复跑读数**：四件 `node --test docs/batches/2026-10-06-server-gateway{,-accounts,-metering,-chat}.test.mjs` **37/37 绿（exit 0）** ∥ `node --check` 全改动档绿 ∥ `npm run prepublishOnly` exit 0（含四件）∥ 零依赖扫描：服务树 19 `.mjs` ∥ 63 import 全 `node:`/相对 ∥ `dependencies` 空。
- **流式冒烟实跑（验收④）**：`node .thincoder/tmp/d3-chat-stream-smoke.mjs`（真实 CLI 进程 + mock 上游门控）——上游发首帧@155ms → 客户端收@162ms → 客户持帧 ~135ms 后放行 → 上游第二帧@298ms → 收毕@299ms；usage 行 [3,4,7]；请求日志 1 行 ⇒ **非整段缓冲成立**。
- **上抛（父侧处置）**：① **预算回填**（实读 = 5.9；`server.mjs` +38 vs 预算 ∥ `sse-tap.mjs` +11 微超）∥ ② **D1 件行数回填**（批档 §5.5 记 437 ⇒ 实读 460——① 授权改笔 +23）∥ ③ `errors.mjs:5` 阶段标记（与 routes 档头同源——回填轮一并收）∥ ④ **批档 D3 到货面记录**（父侧 ① 授权披露等）∥ ⑤ 批内件软线余量 ≈4 行（后阶段续增用例前须预拆）。

### 5.13 轮次定位与交付面（D4/4 · 控制台 + 向量面 + 分发部署 · round initial）

- **本阶段** = D4/4（父侧派发 `#18`）：① 控制台前端三视图（vanilla 静态面——判权全在后端）② `/v1/embeddings` 增量（内网引擎转发 ∥ 响应透传 ∥ 记账 `endpoint='embeddings'`）③ 部署五件（npm/Docker/systemd）④ 批内件新档 `-webui-deploy`。**产出**：新增 10 件 + 批内件新档 1 件 + 改笔 3 档（`gateway/routes.mjs` embeddings ∥ `gateway/server.mjs` 静态面接线 ∥ `bin/thincoder-server.mjs` 静态面装配——末者清单外接线改笔，已披露）。
- **落位与实读行数（vs 预算）**：`src/webui/static.mjs` **78**（≈70——微超）∥ `public/index.html` **21**（≈40）∥ `public/app.mjs` **168**（≈180）∥ `public/views.mjs` **244**（≈270；未超 300 ⇒ 无 `views-admin.mjs` 拆分）∥ `public/style.css` **50**（≈120）∥ `deploy/thincoder-server.service` **32**（≈40）∥ `Dockerfile` **17**（≈30）∥ `.dockerignore` **8**（≈10）∥ `docker-compose.yml` **15**（≈30）∥ `README.md` **118**（≈140）∥ `src/gateway/routes.mjs` **75**（原 46——embeddings 增量）∥ `src/gateway/server.mjs` **192**（原 178——静态面兜底 +14）∥ `bin/thincoder-server.mjs` **113**（原 111——装配 +2）∥ 批内件新档 **318**（≤500 硬限；>300 软线——在册债）。全树核数 **31 档**（对照设计 §4.1 四表 + 板级）。
- **行为要点**：静态面 = 注册路由后 GET/HEAD 兜底（`/v1/*` ∥ `/api/*` 不走静态面）∥ `/` ⇒ `index.html` ∥ mime 表（`.mjs` ⇒ `text/javascript`）∥ `Cache-Control: no-cache` ∥ 防穿越（`..`/`.`/空段 ∥ `\` ∥ NUL ∥ 非法百分号 ∥ `startsWith(root+sep)` 双保险——Windows 盘符相对形亦拒）∥ HEAD 头齐体免。前端 = 哈希三视图（URL 规范化：根 ∥ 未知 hash ⇒ 落 `#/login`/`#/me`）∥ 写请求（含无体写）一律 JSON 头 + JSON 体（D2 型门）∥ 渲染全 `textContent`/文本节点（零 HTML 串）∥ 401 回 `#/login`；凭据类 401（`invalid_credentials`）不误报会话过期（服务端文案照显 ∥ 表单原位）∥ 403 显示服务端文案。embeddings = 鉴权 → 配额 → `body.model` 引擎模型精确匹配（非 ⇒ 404 不转发不落行）→ 原样转发（无注入）→ 透传 + 记账。

### 5.14 决策透明表（本阶段自选口径与披露）

| # | 项 | 决定 | 依据 ∥ 影响 | 回退 |
|---|---|---|---|---|
| 1 | 静态面在分派层的落点 | 路由未命中 + GET/HEAD + 非服务面路径 ⇒ `staticSite.serve` 兜底；`staticSite` 缺省 `null`（纯 API 面——既有测试不受扰） | 设计钉「`/v1/*` ∥ `/api/*` 优先于静态面」；注册行制只适定路径，静态档 = 任意文件名 ⇒ 兜底形最贴合 | 迁为通配注册行（需扩路由表——无收益） |
| 2 | `bin` 装配接线（清单外） | `+import createStaticSite` + 传参 2 行 | 静态面须在装配面接进服务（D3 先例同形：清单外机械必然）；越清单已披露 | 反向删 2 行 |
| 3 | embeddings 无 KD-SV-5 注入 ∥ 恒非流式 | `payload: body` 原样；`streaming: false`（usage 从响应体 JSON 拾取） | KD-SV-5 注入规则只属 chat 流式（`stream === true`）；嵌入请求无流式契约（N3 判据 = 非流式透传） | 若引擎出现流式嵌入 ⇒ 按 `body.stream` 走 streaming 径（1 行） |
| 4 | 嵌入模型未命中口径 | `body.model !== config.embedding.model` ⇒ 404 `model_not_found` | KD-SV-4 精确名清单同口径于引擎面（E3 判据） | 放宽 ⇒ 删 1 条件行 |
| 5 | 前端查询键模板字面量 | `params.set(\`from\`, …)`（沿 D2 §5.6-7 先例） | 冻结 D1 件扫描正则 `\bfrom\s*["']` 误报规避（`"from",` 字面形会撞）；行为等价；档内注释在案 | D1 件解锁轮改回常规写法 |
| 6 | 登录失败文案（explore 审计 A1） | `fail()` 对 `invalid_credentials` 不走会话过期径——服务端文案照显 ∥ 不跳转清表单 | 401 凭据类与会话过期类语义不同；设计（WEBUI §3 语境）未钉文案 | 单条件行 |
| 7 | 轮换后 key 清单回注（explore 审计 A2） | `renderKeys` 读 `ctx.state.member`（refresh 后新清单） | 旧 key 即时退场（与轮转语义一致） | — |
| 8 | 路由入口异常护栏（advisor 🔵#5） | `navigate`/`hashchange`/`boot` 三处 `route().catch(fail)` | 装配异常走 flash 不静默白屏；核对无死循环面（fail 终点渲染零 API 调用） | — |

### 5.15 审计与评审轮次与终态

- **内部偏差审计（explore · 只读）**：四类 **0 ∥ 0 ∥ 0 ∥ 0**；越清单 1（`bin` 接线改笔——已披露、最小性核实通过：净 +2 行）∥ 临时证据件 4 件（`.thincoder/tmp/`——静态冒烟 ∥ DOM 冒烟 ∥ 两份读数日志）。观察 4 条处置：A1（登录失败文案被通用 401 径吞）⇒ **当轮修**；A2（轮换后清单滞后）⇒ **当轮修**；A3（D4 §5 记录）⇒ 本段在落；A4（prepublishOnly 未含第五件）⇒ 发布面收紧项（在册）。
- **独立代码评审（advisor · code）**：无 🔴；🟡2（批内件 318 行超软线——在册债 ∥ OPS §3 `--label` 文档态——回填轮在册）∥ 🔵5（README Docker 清单缺 build 步 ∥ README npm 路 env 落点未点名 ∥ `route()` 无 catch ∥ static.mjs 预算漂移 ∥ Dockerfile 无 USER）⇒ **VERDICT pass**；🔵#3（route 护栏）**当轮收正**。
- **轮 2（修复验证）**：🔵#5 逐点核实 **Fixed**（三入口 `route().catch(fail)` 落实 ∥ 无死循环面 ∥ 无新异常面）；新问题 0 ⇒ **VERDICT pass**。
- **终态 = clean**（🔴 0 ∥ must-fix 0）。

### 5.16 交卷读数与上抛

- **复跑读数**：五件 `node --test docs/batches/2026-10-06-server-gateway{,-accounts,-metering,-chat,-webui-deploy}.test.mjs` **43/43 绿（exit 0）**（四档 37 + 新档 6）∥ `node --check` 全树 22 `.mjs` 全绿 ∥ `npm pack --dry-run` exit 0（**27 档入包**——白名单外零入 ∥ 无 install 步）∥ 零依赖扫描：68 import 全 `node:`/相对 ∥ `dependencies` 空 ∥ `public/**` 零外部引用（无 http(s):// ∥ 无 @import）。
- **静态冒烟实跑**（`.thincoder/tmp/d4-static-smoke.mjs`——真实 CLI 进程 + 真实 config）：`/` ⇒ 200 `text/html` ∥ `/app.mjs` ⇒ 200 `text/javascript` ∥ `/views.mjs` ⇒ 200 ∥ `/style.css` ⇒ 200 `text/css`（四者 `cache=no-cache`）∥ `/nope.css` ⇒ 404 `not_found` ∥ `/v1/nope` ⇒ 404 ∥ 穿越 `..%2F..%2Fpackage.json` ⇒ 404 且不泄包名；就绪行 routes=15。
- **控制台冒烟实跑**（DOM 垫片 + mock /api——`.thincoder/tmp/d4-console-dom-smoke.mjs`）：三视图全流程 **22 检全过**（登录失败文案 ∥ 登录 ∥ 我的 ∥ 轮换一次性明文 ∥ 清单回注 ∥ 改密 ∥ 管理（吊销/建成员/重置/用量过滤）∥ 登出）。
- **环境未验项（如实披露）**：本机无 Docker ∥ 无 systemd ⇒ `docker build` ∥ `compose 起停` ∥ unit `systemd-analyze verify`/`enable --now` 未实跑（AC-8 真机面 = 收口轮；测试档已落静态结构断言）∥ 浏览器真机未跑（以 DOM 垫片冒烟代证）。
- **上抛（父侧处置）**：① **预算回填**（实读 = 5.13；`static.mjs` +8 vs ≈70）∥ ② **README/设计两处可跑性缺口**（Docker 路清单缺 build 步 ∥ npm 路 env 落点未点名——两处均与 `ops/OPS.md` §5.7/§5.3 同源，建议入「实施后设计回填轮」）∥ ③ **发布面收紧**：`prepublishOnly` 未含第五件（受「package.json 勿动」约束未动——发布轮补）∥ ④ **任务书口径核对**：任务书「回归命令四件」vs 批内件头注「D4 起五件一并」——本阶段实跑 = 五件（含新档），请父侧对表。

### 5.17 行数口径补正（append-only —— §5.13 部分行数 ±1 为计尾行差异）

- **口径**：统一以「内容行数（末尾换行不计）」复读全树（回填轮以本节为准）。
- **逐档（终值）**：`src/webui/static.mjs` **78** ∥ `public/index.html` **20** ∥ `public/app.mjs` **167** ∥ `public/views.mjs` **244** ∥ `public/style.css` **49** ∥ `deploy/thincoder-server.service` **32** ∥ `Dockerfile` **16** ∥ `.dockerignore` **7** ∥ `docker-compose.yml` **15** ∥ `README.md` **117** ∥ `src/gateway/routes.mjs` **75** ∥ `src/gateway/server.mjs` **192** ∥ `bin/thincoder-server.mjs` **113** ∥ 批内件新档 **318**。
- **全树**：31 档 ∥ 合计 **2720** 行（对照设计总账 ≈3250——实施前估值，回填轮收正）。
- §5.13 中 index.html/app.mjs/style.css/Dockerfile/.dockerignore/README.md 六处 +1 系尾行计法差异，以本节为终值。

### 5.18 模型标识 fix 轮（`provider/model` 复合键 · 逐号定点 · 2026-10-06）

- **轮次定位**：fix 轮（产品码面——逐号定点，不做全面重审）；来源 = 用户 10:24–10:28 令 → 设计侧落位（§2.13）⇒ 本产品码轮。范围 = ①–⑦（providers ∥ routes/forward ∥ config ∥ config.example ∥ README ∥ 批内件 ∥ 阶段标记收面）；**排除面守约**：鉴权 ∥ 配额 ∥ 中继透传 ∥ 记账机制（写入路径/时点/行形）零改——记账 `model` 列取值随本口径（披露 1）。
- **号 → 落位（file:line 终值）**：
  - **①** `thincoder-server/src/gateway/providers.mjs:13-18`（`splitModelRef` 首斜杠切分 ∥ 两段非空）∥ `:30-40`（`dispatch`：命中 ⇒ `{ provider, model }`——余段 = 上游模型名；裸名/未命中 ⇒ 404 `model_not_found`，message 提示带前缀形）∥ `:48-55`（`modelList` = 带前缀名清单 ∪ 引擎模型）。
  - **②** `thincoder-server/src/gateway/routes.mjs:39-46`（chat：派发 + `model` = 对外标识（记账）∥ `upstreamModel` = 余段（上游体））∥ `:64-66`（embeddings 对 `registry.engineModel()`——引擎面 = 单独命名空间）∥ `thincoder-server/src/gateway/forward.mjs:169-185`（`forwardChat`：上游体 = `{ ...body, model: upstreamModel }`——KD-SV-5 注入不改）。
  - **③** `thincoder-server/src/ops/config.mjs:71-85`（`seenInProvider` 逐 provider 判重——同 provider 内重名 ⇒ 拒启；跨 provider 同名 ⇒ 放行）。
  - **④** `thincoder-server/config.example.json:14` ∥ `:20`（bailian ∥ internal 同列 `deepseek-v3`——同名跨 provider 示范）。
  - **⑤** `thincoder-server/README.md:40`（models 格口径）∥ `:44-45`（标识句）∥ `:46`（校验句）。
  - **⑥** 批内件四件（三改 + 一新）：`…-gateway.test.mjs` 486（同 provider 内重名拒（跨 provider 同名放行）∥ 复合键派发单件 ∥ `/v1/models` 前缀名）∥ `…-chat.test.mjs` 498（请求 `mock/mock-chat` → 上游 `mock-chat` → 记账 `mock/mock-chat`；裸名 404 带前缀提示）∥ `…-webui-deploy.test.mjs` 321（chat 前缀名不占引擎面 ⇒ 404）∥ **新档** `…-model-ref.test.mjs` 155（同名跨两 provider 各自可达正路（两请求分别命中各自上游 ∥ 上游 model = 余段 ∥ 各自真 key）+ 前缀形未命中 404 + 清单 = 前缀名 + 记账可分）。
  - **⑦** `thincoder-server/src/gateway/errors.mjs:5`（「（非本档面——D4）」⇒ 稳定引用「转发面行为——forward.mjs；API.md §3」）∥ `:21`（「待设计 §3 补记」⇒「API.md §3 表行」）。核面：`routes.mjs` 档头无同类标记（grep 零命中）；bin ∥ server ∥ quota ∥ usage 各注与派单号一致（沿 #19 判「无动作」）；`providers.mjs` 档头「D3 迁并」段号随 ① 重写收面（同 ⑦ 类——披露 4）。
- **决策透明（自选口径与披露）**：
  1. **记账 `model` 列 = 对外标识（`provider/model`）**——设计未逐字钉死（`metering/METERING.md` §1 只写「模型」列）；取「模型标识」单源口径 + 同名跨 provider 可分性；回退 = `routes.mjs:43` 传参一处。
  2. **上游请求体 `model` = 首斜杠余段**——设计句「余段 = 上游模型名」+「各自可达」的功能必然（上游不认前缀）；回退 = 不剥前缀（`forward.mjs:183` 一处）。
  3. **批内件拆档**：`…-chat` 496 + 本轮断言随动（+58）将达 554 ⇒ 按「测试档按域分文件 · 新档按阶段落」（§1.4）+「续增用例前须预拆」（§5.12-⑤）立本 fix 轮新档 `…-model-ref.test.mjs`（155），`…-chat` 回落 498（≤500 硬限）；复跑集 = 五件 ⇒ **六件**（原五件命令亦全绿）。已向父侧投递中途披露（note——可驳回，回退 = 用例回并）。
  4. `…-chat` 头注运行集随正（「D4 起五件」⇒「本 fix 轮起六件一并」——D4 §5.16-④ 遗留对表项，随本件收）；`providers.mjs` 档头「D3 迁并」段号收面（见 ⑦）。
- **审计与评审轮次与终态**：
  - **内部偏差审计（explore · 只读）**：①–⑦ 逐条落位核（file:line 在案）∥ 两处设计留白自洽核 ∥ 零删失静态核（用例 13 ∥ 9 ∥ 6 ∥ 1）∥ 依赖面/语法面全清；**代码偏差 0**；唯一发现 = 批档 §5 本轮记录未落（🟡 协调）⇒ **本段落笔即闭**；另观察 = provider `name` 校验留白（上抛①）∥ chat 余量 ≈2 行（在册）。
  - **独立代码评审（advisor · code · 1 轮）**：**VERDICT pass**（🔴 0 ∥ must-fix 0）；🟡4 = ① provider `name` 未校验（重名 ∥ 含 `/`）⇒ 清单列示但派发 404 的设计缺口（非 must-fix）② 记账列语义设计未钉 ③ 批内件超 300 软线（在册债，不升格）④ 批档 §5 记录未落（= 上项）；🔵1 = 行数账漂移。处置：① ② ⑤ 号项 **上报**（上抛①②③）；③ **接受**（在册债）；④ **本段修复**。
  - **终态 = clean**（🔴 0 ∥ must-fix 0；协调/报告项各归其主）。
- **机检读数（复跑）**：六件 `node --test docs/batches/2026-10-06-server-gateway{,-accounts,-metering,-chat,-webui-deploy,-model-ref}.test.mjs` **44/44 绿（exit 0）**；`node --check` 全树 22 档 + 批内件 4 档 = 26 档 **CHECK_FAILS=0**；零依赖扫描通过（批内件「依赖面」用例——全树 import 仅 `node:`/相对 ∥ `dependencies` 空）。
- **上抛（父侧/设计回填处置）**：① **provider `name` 校验留白**（重名 ∥ 含 `/` ⇒ 拒启候选——`ops/OPS.md` §1 校验清单 + `config.mjs` 一行加固；审计观察 + 评审 #1 同源）② **记账列语义钉死**（`metering/METERING.md` §1 补「`model` = 对外标识 `provider/model`」注；历史行口径可选）③ **行数账收正**（providers 40⇒55 ∥ routes 75⇒81 ∥ forward 183⇒185 ∥ README 117⇒119 ∥ 新档 155 未入账 ∥ chat 496⇒498——设计 §4/§6 ∥ 批档行数面）④ `package.json` prepublishOnly 未含第五件/新档（发布面轮——沿 D4 §5.16 上抛③）。

### 5.19 provider `name` 校验 fix 轮（三判据落位 · 逐号定点 · 2026-10-06）

- **轮次定位**：fix 轮（产品码面——逐号定点，不做全面重审）；来源 = 本档 §2.14-①（设计落位：`ops/OPS.md:37–38`）+ §5.18 上抛①（评审 #1 同源）⇒ 本产品码轮。范围 = ① `ops/config.mjs` 三判据 ② 用例四例（`-model-ref` 件）；**排除面守约**：派发 ∥ 清单 ∥ 透传 ∥ 鉴权 ∥ 配额 ∥ 记账零触；校验既有判据语义零改。
- **号 → 落位（file:line 终值）**：
  - **①** `thincoder-server/src/ops/config.mjs:72`（`seenProviderNames`——providers 间判重）∥ `:76-78`（`requireProviderName` 调用 ∥ 重名 throw ∥ add）∥ `:125-134`（`requireProviderName`：缺/空 `:127-129` ∥ 含 `/` `:130-132`）；消息含位点（`providers[i].name`）∥ 名回显（含 `/` ∥ 重名）∥ 缘由（前缀形不可解析 ∥ 派发歧义）∥ 「拒启」——与既有模型重名判据（`:84`）同构。
  - **②** `docs/batches/2026-10-06-server-gateway-model-ref.test.mjs`：头注射程 ⑤（`:11`）∥ 四例——缺/空（缺键 ∥ 空串 ∥ 空白串——`:174-178`）∥ 含 `/`（名回显——`:180-182`）∥ 重名（位点 = 第二个——`:184-186`）∥ 正路（三名放行 ∥ 名原样保留——`:188-194`）。
- **决策透明（自选口径与披露）**：
  1. **缺/空消息明确化**：替换既有 `requireString` 通用文案（`须为非空字符串`）为 `缺/空（…前缀形不可解析；拒启）`——**拒绝集合不变**（缺/空/非串仍拒），仅文案承载缘由；旧文案全库零断言（grep 核）。
  2. **判重 = 原值精确匹配**（不 trim ∥ 不折叠大小写）：与派发面字面等值同口径（`providers.mjs:35`）；空白形名（`" up-a "`）仍各自可达、非歧义 ⇒ 不立新判据（超设计闭集——任务书「只加这一组」）；「名原样保留」已由正路例固化（见上抛①）。
  3. **用例落点** = `-model-ref` 件（沿任务书「优先」+ 同族题面）；`-gateway` 件**零触**（486 行 ∥ 余量 14——未动其体量）。
  4. **用例面 = 抛出面**（`validateConfig` throw + 消息断言）；非零退出 = 共享出口（`bin` catch ⇒ `exitCode=1`——既有入口用例覆盖该机制）——未加子进程例（沿任务书用例面 = 三负一正；见上抛②）。
- **审计与评审轮次与终态**：
  - **内部偏差审计（explore · 只读 · 1 轮）**：四类 **0 ∥ 0 ∥ 0 ∥ 0**；三判据 ∥ 用例实效（防假绿） ∥ 既有判据零改 ∥ 越清单逐项 file:line 核过（写窗 mtime 核 + 六件夹具名交叉核 = 零误伤）；复跑面 = 审计装配无执行位 ⇒ 静态计数 48 例与读数互证；观察 2 条（行数账 ordering ∥ name 判据先于 baseURL——设计未规定次序）非缺陷。审计时点本段落未落 = 已知 ordering（前轮同形）——**本段落笔即闭**。
  - **独立代码评审（advisor · code · 1 轮）**：**VERDICT pass**（🔴 0 ∥ must-fix 0）；🔵3 = ① name 不 trim（空白形缝——**接受**：超设计闭集不立新判据；上抛①）② 三判据未落入口退出码例（**接受**：沿任务书用例面；上抛②）③ 行数账漂移（**上报**；上抛③）；评审只读未复跑（其声明）——读数面以本段复跑为准。
  - **终态 = clean**（🔴 0 ∥ must-fix 0 ∥ 零修复轮——三项 🔵 各归其主）。
- **机检读数（复跑）**：六件 `node --test docs/batches/2026-10-06-server-gateway{,-accounts,-metering,-chat,-webui-deploy,-model-ref}.test.mjs` **48/48 绿（exit 0）**（44 旧 + 4 新）；定向单件先跑 5/5 绿；`node --check` 服务树 22 档 + 批内件 6 档 = **28 档 CHECK_FAILS=0**；零依赖扫描 = 批内件「依赖面」用例（`-gateway.test.mjs:371`）随六件绿。
- **行数读数**（口径 = 内容行数 ∥ 文末换行不计——同 §5.17）：`config.mjs` **139 ⇒ 154**（+15）∥ `-model-ref.test.mjs` **155 ⇒ 194**（+39）；均 ≤300 软线（500 硬限未触）。
- **上抛（父侧/回填轮处置）**：① **name 首尾空白口径**（评审 🔵#1——裁 = 字面保留（超设计闭集不立新判据）；可选：设计 §1 注半句 ∥ 回填轮裁 trim）∥ ② **入口退出码例**（评审 🔵#2——可选补强；本轮到货 = 抛出面断言，非零退出走共享出口）∥ ③ **行数账漂移**（评审 🔵#3——设计回填轮收正：`ops/OPS.md:132` config **139 ⇒ 154** ∥ `:141` 小计 **683 ⇒ 698** ∥ `design/PROJECT.md:117` ops **683 ⇒ 698** ∥ 合计 **2720 ⇒ 2735** ∥ 总账 **2745 ⇒ 2760** ∥ `:125` `-model-ref` **155 ⇒ 194**）。

## §6 验证与收口（父代理）

**§6 验证与收口（主 agent）**

**来路**：用户 2026-10-06 07:5x–08:32 服务器网关令（含 B 案账号 ∥ npm+Docker 分发 ∥ 增长规划）+「点火。自动跑完」全链授权 → 批 §1 开批 → 设计八档（板 2 + 域 6）→ 评审 §3 轮次 1（changes-required：🔴1 ∥ 🟡3 ∥ 🔵2）→ 修复轮（六条）→ 评审 §3 轮次 2（**pass**——首飞 `#8` 挂死已取消，重发 `#11`）→ §4 父侧代签 → **实施四阶段 D1–D4**（含中途修正：`#14`/`#15` 取消重发；`--label` 裁 B；`/v1/models` 鉴权判归 D3）→ **斜杠形口径变更**（用户 10:24–10:28：设计轮 `#19` 增补⑧ → 代码轮 `#20` → 小收尾 `#21` → provider 名校验 `#22`）→ 收口评审 `#23`（**pass**——🔴0 ∥ 🟡3 非 must-fix ∥ 🔵6）→ 本段。

**验证读数（父侧亲跑）**：
- 批内件六件：**48/48 pass**（EXIT=0——多轮复跑）。
- 全树 `node --check`：服务树 22 档 + 批内件 6 档 = **28 档零失**。
- `npm pack --dry-run`：**27 档入包**（白名单外零入）；`npm run prepublishOnly`（收口轮补全六件后）= exit 0（实跑）。
- 零第三方依赖：import 全 `node:`/相对 ∥ `dependencies` 空。
- 冒烟（交付报告在册）：静态四读数 ∥ 控制台 DOM 22/22 ∥ 流式两帧间隔（首帧 162ms ∥ 门控 ~135ms——非整段缓冲）∥ CLI 全命令实跑。

**收口评审（`#23`）九条裁决**：

| # | Action | Detail |
|---|---|---|
| 1 | Fixed | 发布门禁收全六件（`package.json:12`）；「全树逐档 `node --check`」字面形 = 发布面轮收紧项（导入图 + bin 检查已覆盖） |
| 2 | Deferred | AC-2/6/8 真机读数——待用户环境（见下「真机面」） |
| 3 | Deferred | 四件批内件 >300 软线（486/493/498/321——在册债；≤500 硬限内） |
| 4 | Fixed | README Docker 路 6⇒7 步（补 `docker build`——`README.md:62`） |
| 5 | Fixed | README npm 路第 3 步补 env 落点（`/etc/thincoder-server.env` ∥ `EnvironmentFile`——`README.md:56`） |
| 6 | Fixed | 行数账五处收正（config ⇒154 ∥ ops 小计 ⇒698 ∥ 合计 ⇒2735 ∥ 总账 ⇒2760 ∥ `-model-ref` ⇒194） |
| 7 | Fixed | 「（拟新增）」全扫面（8 档 49 处 →「已落盘」+ 5 处复合形收口） |
| 8 | Fixed | 全码表断言补 `internal_error: 500`（runtime 探针未加——12 行 catch-all 读面已核；随下次触碰可选） |
| 9 | Deferred | 新板块 `AGENTS.md`（软约定——模块图单源 = 设计 `PROJECT.md` §2.1；随下次产品笔可选补） |

（第 1/4/5/6/7/8 项 = 父侧直接执行 · 机械类 · 逐处对表 · 可 revert。）

**真机面（待用户环境——挂账）**：AC-2（真上游 SSE + 四端任一）∥ AC-6（内网引擎 embeddings）∥ AC-8（`docker build` ∥ compose 起停 ∥ systemd 安放——本机无 Docker/systemd）。用户交件后补跑，读数回填台账 `#909` evidence（批档已冻）；**`#909` 保持「待核销」直至真机面回填**。

**测试面**：① 本批批内件六件（随批留存——复跑 = `node --test docs/batches/2026-10-06-server-gateway*.test.mjs` 六件命令）；② 集成场景 = **无**（新仓面；进仓套件 = 发布面轮议题）。

**遗留 / 移交**：真机面三项（上）∥ 四件 >300 软线（归批）∥ `AGENTS.md`（可选）∥ prepublishOnly「全树检查」字面（发布面轮）。

**收口**：批次档冻结；全树 + 设计/需求 + 本档 = 提交携带（下条记）。
