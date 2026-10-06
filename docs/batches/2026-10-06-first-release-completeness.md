# 2026-10-06 · first-release-completeness
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-06 · 来源 = 用户 2026-10-06 16:04「好歹像个完整的产品！你自己先反省一下，看看还漏了什么，都给补齐了」——需求 = 首版完备化五项（需求档 §2:12 ∥ 台账 #963）。
> 台账 = #963（server · 归批）。前情 = docs/batches/2026-10-06-server-presets.md §6（已收口 2026-10-06）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**§1 讨论（主 agent）**

**任务与来源**：用户 2026-10-06 16:04「thincoder现在也算是小有名气的产品了，你干活能不能要点面子？别这么半不拉拉的就把东西丢出去好吗！好歹像个完整的产品！你自己先反省一下，看看还漏了什么，都给补齐了」。需求 = **首版完备化**（需求档 §2:12；台账 #963）——审计实核六项：① 健康检查面（`/healthz` 全树零命中）∥ ② 登录防爆破（登录尝试零限流——零命中）∥ ③ 控制台版本与更新可见（public 面零版本——零命中）∥ ④ 成员接入指引（无成文——README/控制台实读）∥ ⑤ 部署文档完备（反代样例 ∥ 备份口径——现仅边界句 + 手工 cp）∥ ⑥ 用量保留口径（用量表只增不减——零清理实核）。

**授权**：本会话既定委托延续（代点火 + 代批准 · 自缚三条同前）。

**边界**：既有八件断言零破（或随正 + 披露——沿 #961 先例）；账号/计量/转发**语义**零改（② = 登录面新增防护，认证口径不变；⑥ = 保留窗配置化，查询面不变）；杂项（LICENSE ∥ i18n ∥ favicon）= **待用户裁——不在本批射程**；CI（#964 技术待办 = `.github/workflows` 无 server job）= 工程面父侧直改，随本批收口落。

**杂项三裁落地（用户 2026-10-06 16:09——父侧直接执行 · 可 revert）**：① **LICENSE = MIT** 已落（`LICENSE`（仓根）∥ `thincoder-server/LICENSE`——沿 cli/core/vscode 先例）；② **favicon = 桌面图标**已落（`thincoder-desktop/build/icon.png` ⇒ `thincoder-server/public/favicon.png` + `index.html` link 行；`webui-deploy` 件随正 4 ⇒ 5 档；复跑 6/6 绿；运行实例 GET `/favicon.png` ⇒ **200 · image/png · 2872B** 实核）——**移出本批射程**；③ i18n = 独立入面（#965——不在本批）。

**服从注记（用户 2026-10-06 16:13 · 需求 §2:14）**：控制台 IA 由 #962 轮（`#31`）定稿——本批 ③「控制台版本/更新可见」与 ④「接入指引（控台侧）」的落点须服从其导航结构（设计前先读 `webui/WEBUI.md` 新 IA；如在其设计未落前启动，以「挂点合适处」为暂形并在报告披露）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（六项逐答落位（①healthz ∥ ②登录防护 ∥ ③版本/更新面 ∥ ④接入指引 ∥ ⑤部署文档 ∥ ⑥保留窗）∥ KD-SV-21–25 在册 ∥ doc-check 本批新增悬空 0 ∥ 新增超宽 0（server 域 0/0 实核）；存量 65 = #958 族 62 + #962 在途 3（非本批））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 轮次定位与本批条目（覆盖）

- 轮次 = **设计轮**（initial——重发：前次因设计档冻结窗口收队让位，任务内容不变）；需求 = `docs/server/requirements/PROJECT.md` §2:12（首版完备化六项①–⑥——用户 2026-10-06 16:04 令）+ 变更记录相关条；台账 = #963；批档 §1 在册（六项实核 + 边界 + 杂项三裁 + IA 服从注记）。
- 条目表（逐条覆盖——六项）：

| # | 条目（需求回指 §2:12） | 设计落点 | 状态 |
|---|---|---|---|
| 1 | ① 健康检查面（`/healthz` ∥ 部署接线 ∥ 排障） | `gateway/API.md` §1/§2.3/§5 ∥ `ops/OPS.md` §5.9/§7 ∥ README §12（拟） | ✅ 覆盖 |
| 2 | ② 登录防爆破（退避/锁定 + 事件日志；防枚举保留） | `accounts/ACCOUNTS.md` §2/§3/§5/§6/§7/§8 | ✅ 覆盖 |
| 3 | ③ 控制台版本与更新可见（接 #961 进程内状态） | `webui/WEBUI.md` §2/§2.1/§5/§6 ∥ `gateway/API.md` §2.3 ∥ `ops/OPS.md` §5.4(g) | ✅ 覆盖 |
| 4 | ④ 成员接入指引（控台卡 + README 成文） | `webui/WEBUI.md` §2.1 ∥ README §10（拟） | ✅ 覆盖 |
| 5 | ⑤ 部署文档完备（反代样例 ∥ 备份增强） | `ops/OPS.md` §5.5/§5.6 ∥ README §9/§11（拟） ∥ `thincoder-server/deploy/backup.mjs`（拟新增） | ✅ 覆盖 |
| 6 | ⑥ 用量保留口径（保留窗/清理） | `metering/METERING.md` §1/§4/§6/§7/§8 ∥ `ops/OPS.md` §1 | ✅ 覆盖 |

- **本批边界（不做）**：账号/计量/转发**语义**零改（② = 登录面新增防护——认证口径不变；⑥ = 保留窗配置化——查询面不变）；杂项零涉；他批零触；需求档零笔（AC-13 候补 = 上抛 R15）；不扩面（不做 metrics/Prometheus ∥ 日志轮转 ∥ i18n ∥ 告警外发）；KD-SV-1–20 语义零改（增 21–25，计数句随正）。
- **与在途批串行**：`#962` 实施在飞（实况 = 五档 modified + `thincoder-server/src/gateway/provider-admin.mjs` 新档 untracked——本设计只写设计档、零触产品面；预算 = 叠加口径「#962 回填后」）。
- **CI（#964——工程面父侧直改）一句**：所需 job = `thincoder-server/` 内 `npm run prepublishOnly`（批内件全量 + `node --check`）∥ 仓根 `node scripts/doc-check.mjs`——workflow 全文归 #964。

### 2.2 设计档落点

- 机制全文：① = `gateway/API.md` §2.3 ∥ ② = `accounts/ACCOUNTS.md` §2 ∥ ③ = `webui/WEBUI.md` §2.1（数据面 = `gateway/API.md` §2.3）∥ ④ = `webui/WEBUI.md` §2.1 + README §10 ∥ ⑤ = `ops/OPS.md` §5.5/§5.6 + README §9/§11 ∥ ⑥ = `metering/METERING.md` §1。
- 同批随动（本批笔）：`gateway/API.md`（§1/§2.3/§3/§4/§5/§7/§8/变更记录）∥ `ops/OPS.md`（§1/§4/§5.4(g)/§5.5/§5.6/§5.7/§5.9/§6/§7/§8/§9/§10/变更记录）∥ `accounts/ACCOUNTS.md`（§2/§3/§4/§5/§6/§7/§8/变更记录）∥
  `metering/METERING.md`（§1/§4/§5/§6/§7/§8/变更记录）∥ `webui/WEBUI.md`（§1/§2/§2.1/§5/§6/§8/变更记录）∥ `store/STORE.md`（§3/§6/变更记录）∥ 板档 `PROJECT.md`（§1/§2.1/§2.2/§4/§6/§7/§9/变更记录）。
- `EVOLUTION.md` 零触（评估：G1 注册行制 ∥ G5 配置面之既有断点使用——无器级新触发项）。

### 2.3 机制设计（六项逐答——对批档 §1 任务书问面）

**① `/healthz`（形态 ∥ 落点 ∥ 判据 ∥ 预算）**：`GET` 无鉴权只读（探针入口——零凭据可直调）∥ 返回面 `{ status, version, uptime, db }`（db = `SELECT 1` 一探；失败 ⇒ 503 `status:"degraded"`；`Cache-Control: no-store`；不走统一错误信封；仅注册 GET——HEAD/POST ⇒ 404）∥
优先级 = 注册路由（分派先于静态兜底；与 `/v1` ∥ `/api` 族互不重叠）∥ 部署接线 = Dockerfile `HEALTHCHECK` 单源（compose 不重复声明——镜像继承；interval 30s ∥ timeout 5s ∥ start-period 120s ∥ retries 3——start-period 覆盖壳收敛/装版窗；端口缺省 8787——改端口同步改行）∥ 排障节 = README §12（curl ∥ 503 含义 ∥ unhealthy 标注态不触发重起）∥ 预算 = 新档 `system.mjs` ≈70。

**② 登录防爆破**：**双维内存锁（混合）**——用户名维（提交值——无论是否存在）：连续失败 ≥5 次（窗 15min）⇒ 锁 15min；IP 维 ≥20 次（同窗）⇒ 锁同；任一中锁 ⇒ **429 `too_many_attempts`** + `Retry-After`（剩余秒）+ 固定文案（两维同文案、与用户名存在性无关——**防枚举面保持**；不跑散列——快速拒绝；固定窗不延长）∥
持久化 = **否**（进程内存——重启清零；理由 = 在线爆破窗 = 分钟级 ∥ 零表零写（登录热路径不落库）∥ 重启罕发——接受在案；离线撞库不在防线内）∥ 事件 = `login_throttled`（`username` ∥ `ip` ∥ `dimension` ∥ `retryAfterS`）∥ 清计 = 成功登录（两维）∥ 自助改密（本人用户名维）∥ admin 重置（目标用户名维——HTTP 面；本机 CLI 跨进程不达——残余 ≤ 锁窗，披露）∥
IP 口径 = 对端地址；`trustProxy: true`（新配置键，缺省 false）⇒ 读 `X-Real-IP`（前提 = 端口仅反代可达——防直连伪造）∥ 预算 = 新档 `login-guard.mjs` ≈90 + routes/`routes-admin` 接线 +23。

**③ 控制台版本/更新可见**：数据面 = **`GET /api/system`**（会话——两角色；`{ version, update: { mode, lastCheckAt, latest } }`）——更新器增 `getStatus()` 导出（进程内状态；自检成功 ⇒ 更新（有新置版号/无新清 null）、失败 ⇒ 保前值——静默同面）；入口惰性注入（路由注册先于更新器创建）∥
消费面 = 侧栏 meta 槽（版本——全角色）+ `#/admin/system` 系统页两节（版本与更新 ∥ 成员接入卡——填充 = `webui/WEBUI.md` §2.1）∥ 与 #961 关系 = 消费其进程内状态（ready 行 = 部署面口径——两消费方不同，不相抵）∥ 预算 = `system.mjs` 含于①。

**④ 成员接入指引**：控台卡（admin 系统页）——baseURL（`location.origin` + `/v1`——运行时装配）∥ key 提示（`sk-tc-…` 形——签发 = `#/me/keys`）∥ 四端示例（CLI ∥ VSC ∥ 桌面 ∥ 其他 OpenAI 兼容——字段 = name/baseURL/model/key；model = `provider/model` 形）∥ curl 冒烟一行 ∥
README §10「成员接入」节 = 成员面成文（获得 key ∥ 通用参数 ∥ 四端操作路径——CLI `/provider` 向导 ∥ VSC ⚙ 设置面板 ∥ 桌面设置 → 渠道 ∥ 通用 baseURL——均落共享 `~/.thincoder/config.json`，实核）∥ **落点口径**：控台卡 = admin 面（#962 IA 服从——供分发给成员）；成员面成文 = README（另案披露⑤）。

**⑤ 部署文档完备**：反代 = **nginx 完整段**（选一——KD-SV-25）：要素 = `client_max_body_size 32m`（≥ 服务端请求体上限；默认 1m 会先挡）∥ SSE（`proxy_http_version 1.1` ∥ `proxy_buffering off` ∥ 长 `proxy_read_timeout`）∥ `proxy_set_header X-Real-IP $remote_addr`（set 形——`trustProxy` 消费）∥ TLS 证书位 ∥
备份 = `thincoder-server/deploy/backup.mjs`（拟新增 ≈45——node:sqlite `backup()` **在线一致快照**（WAL 安全、免停写窗）；`--config`/`--out`；时间戳命名）+ systemd 定时器样例（`OnCalendar=daily` ∥ `Persistent=true`）+ 容器路 `docker compose exec` 同命令 ∥ 边界 = 进程内自动备份面不做（部署方自配）；轮转/保留自管。

**⑥ 用量保留**：配置键 `usageRetentionDays`（缺省 **90 天**——论证 = 配额周期 = 月 ⇒ 跨月必需 + 统计回看惯例一季 ⇒ 90 覆盖；`null` = 不限；非正整数/非法 ⇒ 拒启）∥ 清理 = **删除式** `pruneUsage`（`DELETE FROM usage WHERE ts < 界`——走 `idx_usage_ts`）；时机 = **启动一次 + 每 24h**（实现常量——入口接线）∥ 查询面零改（三端点契约不变；窗外行自然不在结果——非错）∥ 预算 = `usage.mjs` +18。

### 2.4 受影响文件与测试面

- **产品码（实施轮笔——本批零写；行数 = 实读 ⇒ 设计估）**：

| 档 | 变动 | 量 |
|---|---|---|
| `thincoder-server/src/gateway/system.mjs`（拟新增） | healthz 探活 ∥ `/api/system`（版本/更新状态） ∥ 注册 | 无 ⇒ ≈70 |
| `thincoder-server/src/gateway/errors.mjs` | +`too_many_attempts` 码 | 55 ⇒ 56 |
| `thincoder-server/src/accounts/login-guard.mjs`（拟新增） | 双维计数 ∥ 锁定/解锁 ∥ 清计四口 ∥ IP 口径 | 无 ⇒ ≈90 |
| `thincoder-server/src/accounts/routes.mjs` | 登录 guard 接线（429 + `Retry-After` + 日志） | 81 ⇒ ≈101 |
| `thincoder-server/src/accounts/routes-admin.mjs` | 重置 ⇒ 清目标用户名锁 | 58 ⇒ ≈61 |
| `thincoder-server/src/ops/config.mjs` | +`trustProxy` ∥ `usageRetentionDays` 校验 | 164 ⇒ ≈178（叠加 #962 后 ≈193） |
| `thincoder-server/src/ops/update.mjs` | 状态导出（`getStatus`） | 228 ⇒ ≈240 |
| `thincoder-server/src/metering/usage.mjs` | +`pruneUsage` | 132 ⇒ ≈150 |
| `thincoder-server/bin/thincoder-server.mjs` | 系统面注册 ∥ 保留清理接线 ∥ 惰性状态访问器 | 122 ⇒ ≈134（叠加 #962 后 ≈142） |
| `thincoder-server/public/views-system.mjs` | 骨架 ⇒ 两节填充（§2.1） | ≈30（#962） ⇒ ≈130 |
| `thincoder-server/public/app.mjs` | 系统取数 ∥ meta 填充 | ≈190（#962） ⇒ ≈200 |
| `thincoder-server/public/nav.mjs` | meta 槽元素 | ≈70（#962） ⇒ ≈75 |
| `thincoder-server/public/style.css` | 卡/示例样式 | ≈95（#962） ⇒ ≈115 |
| `thincoder-server/Dockerfile` | +HEALTHCHECK（§5.9） | 28 ⇒ ≈32 |
| `thincoder-server/docker-compose.yml` | +继承注释 | 19 ⇒ ≈21 |
| `thincoder-server/deploy/backup.mjs`（拟新增） | 在线备份脚本（node:sqlite `backup()`） | 无 ⇒ ≈45 |
| `thincoder-server/README.md` | §10–12 新节 ∥ §9 重写 ∥ §2 两行 ∥ §6/§13 随动 | 142 ⇒ ≈157（#962） ⇒ ≈247 |
| `thincoder-server/config.example.json` | +两键 | 33 ⇒ ≈35 |
| `thincoder-server/package.json` | `prepublishOnly` +1 件（本批件） | 25（行数不变） |

- 产品面合计 **≈+518 行**（gateway +71 ∥ accounts +113 ∥ metering +18 ∥ webui +135 ∥ ops +181）；全树 **41 ⇒ 44 档**（+3 新档：system ∥ login-guard ∥ backup；#962 后口径）。设计批零写产品面。
- **旧件随正（实施轮义务——「保持绿或随正 + 披露」沿先例）**：① `docs/batches/2026-10-06-server-auto-update.test.mjs`——`prepublishOnly` 件数断言（`batchFiles.length, 8` ⇒ 10——叠加 #962 后；#962 §2.4 清单未列该件，建议并入处置）；② `docs/batches/2026-10-06-server-gateway-webui-deploy.test.mjs`——Dockerfile 断言 = 行锚定 regex（本批为**增行**——预期零改；档目断言随 #962）∥ compose 断言 = 增注释行（预期零改）；③ `docs/batches/2026-10-06-server-gateway.test.mjs`——errors 码表加行（预期零改）。
- **测试面** = 批内件 `docs/batches/2026-10-06-first-release-completeness.test.mjs`（拟新增——设计估 ≈450；腿 = ① healthz（200 形 ∥ 503 降级 ∥ HEAD/POST 404 ∥ no-store）② guard（阈值/锁/`Retry-After`/两维同措辞/清计/`trustProxy`）③ `/api/system`（会话门 ∥ 假 registry 状态）④ README 结构断言（成员接入节 ∥ nginx 段 ∥ 备份命令/定时器样例）⑤ `backup.mjs` 实跑（快照生成 + 可开 + 热库在线备份）⑥ `pruneUsage` + config 校验）；>500 即按腿拆两件（沿先例）。
- 真机面 = 收口轮（`docker build` + HEALTHCHECK 实核——`#959` 条件行同窗）。

### 2.5 验收对照（回指功能点 12——六面判据）

- ① `/healthz`：无鉴权 GET ⇒ 200 `{ status:"ok", version, uptime（数）, db:"ok" }`（`no-store`）∥ db 故障 ⇒ 503 `degraded` ∥ HEAD/POST ⇒ 404 ∥ 探针不触会话/团队 key 面（判据全文 = `gateway/API.md` §5 AC-13 行）。
- ② 登录防爆破：5 连败 ⇒ 第 6 次（含正确密码）⇒ 429 + `Retry-After` ∥ 锁窗过后恢复 200 ∥ 成功/改密/重置清计 ∥ 不存在用户名同锁（枚举零差）∥ `trustProxy` 取 `X-Real-IP` ∥ 日志 `login_throttled`（判据全文 = `accounts/ACCOUNTS.md` §5 AC-13② 行）。
- ③④ 控制台：系统页两节在册 ∥ meta 槽版本 ∥ 更新提示接 `latest` ∥ 接入卡（baseURL 运行时 origin ∥ 四端示例 ∥ curl）∥ 零外部引用不破（判据全文 = `webui/WEBUI.md` §6 AC-13③④ 行）。
- ⑤ 部署文档：README 结构断言（成员接入 ∥ nginx 完整段 ∥ 备份命令/定时器）∥ `backup.mjs` 实跑 ⇒ 快照生成 + 可开（含热库在线备份）∥ Dockerfile `HEALTHCHECK` 行在册 ∥ 配置校验拒启（判据全文 = `ops/OPS.md` §7 AC-13 行）。
- ⑥ 用量保留：窗界外删/窗内留（注入时钟）∥ `null` ⇒ 零删 ∥ 启动 + 24h 接线 ∥ 查询面回归零变（判据全文 = `metering/METERING.md` §4 AC-13⑥ 行）。
- AC 行候补 = **上抛 R15**（需求档笔 = 主 agent——沿 AC-9/AC-10/AC-11/AC-12 先例）。

### 2.6 关键决策（KD-SV-21–25 行草——全文 = 各域档）

- **KD-SV-21**（全文 = `accounts/ACCOUNTS.md` §6）：登录防爆破 = 双维内存锁（用户名 5 ∥ IP 20；窗/锁各 15 分钟；429 + `Retry-After`；两维同文案——防枚举保持；成功/改密/重置清计；重启清零）。被否：DB 持久化 ∥ 逐次延迟响应 ∥ 仅用户名维 ∥ 仅 IP 维 ∥ 验证码/外部组件。
- **KD-SV-22**（全文 = `metering/METERING.md` §6）：用量保留 = 配置化保留窗（缺省 90 天；启动 + 24h 删除式清理；`null` = 不限）。被否：全量不做 ∥ 归档表/导出面 ∥ 按行数限 ∥ 外部 cron 清理。
- **KD-SV-23**（全文 = `ops/OPS.md` §8）：健康检查 = `/healthz` 无鉴权只读探活（status/version/uptime/db；503 degraded；接线 = Dockerfile `HEALTHCHECK` 单源）。被否：鉴权式 ∥ 并入 `/v1` 面 ∥ 详细依赖探活 ∥ 非 HTTP 探针。
- **KD-SV-24**（全文 = `ops/OPS.md` §8）：更新可见面 = `GET /api/system`（会话）+ 控制台（meta 槽 ∥ 系统页——更新器 `getStatus()` 导出）。被否：并入 `/api/me` ∥ healthz 携更新字段 ∥ 日志/外发通知。
- **KD-SV-25**（全文 = `ops/OPS.md` §8）：部署文档完备 = README 定稿（反代 = nginx 完整段；备份 = `backup.mjs` 在线快照 + systemd 定时器样例）。被否：caddy ∥ `sqlite3` CLI ∥ 停写窗 `cp` ∥ cron 样例 ∥ 定时器落 `deploy/` 真件。

### 2.7 机检读数（D6 读回——`node scripts/doc-check.mjs` · 仓根 · 实跑复核）

- **改前基线复核**（HEAD worktree 实跑——排除在途批干扰）：候选 49519 · 悬空 **62** · 拟新增 56 · 行宽 **0**（`docs/server` 域悬空 ∅）。
- **本批首跑**：候选 49665 · 悬空 68（其中**本批新增 3** = 裸路径 `deploy/backup.mjs` 三处）· 行宽 **6**（全部本批）· 拟新增 62。
- **改后（终跑）**：候选 49666 · 悬空 **65**（**本批新增悬空 0**——3 处裸路径已改全路径形 + `（拟新增）` 标记闭合）· 行宽 **0**（6 行已拆行闭合——零语义）· 拟新增 65 · 注记豁免 331 · 迁移期引文 303 · 声明源缺位 0。
- **存量 65 口径** = #958 族 62 + **3 条 CLI 引用**（`docs/cli/design/CLI-DEBT.md:79` ∥ `:122` ∥ `TUI-COMMANDS.md:207`——`provider-admin.mjs` basename 碰撞：**#962 实施在飞**新增 `thincoder-server/src/gateway/provider-admin.mjs`（untracked 实核）⇒ 仓内同名 2 份 ⇒ 他档 basename 回退解析失效——**非本批**，披露⑤）。
- exit 1 = 存量闸态（非本批触面；**server 域悬空 0 ∥ 超宽 0** 实核）。

### 2.8 披露与顺带项（逐条报告）

- ① **存量悬空 65（非本批触面）**：#958 族 62 + 上述 3 条 CLI 引用（#962 在途实况——其批收口轮随正或归 #958 清账批）。
- ② **本批自纠 2 项**（设计面自检——已就地闭合，零语义）：3 处裸路径 `deploy/backup.mjs` ⇒ 全路径 + 拟新增标记；6 行超宽 ⇒ 拆行。
- ③ **D8 顺带收正 2 处**（一致性面——已就地闭合）：`ops/OPS.md` §1 启动校验行随拆行删去 revision 残留「取代原『`providers` 空 ⇒ 拒启』」（语义零变——历史在 OPS 变更记录）；板档 §2.1 ops 行陈旧「拟新增」标记随正（update/entrypoint/converge 已落盘——#961 回填漏行）。
- ④ **#962 串行实况**：实施在飞（git status = 五档 modified + 一新档 untracked）；本设计零触产品面；预算/README 数值 = 叠加口径；实施排队。
- ⑤ **成员面接入卡不在（控台侧）**：控台卡 = admin 系统页（#962 IA 服从——批档 §1 服从注记）；成员面成文 = README §10。如用户要「成员登录后也见接入卡」⇒ 后续批在 `#/me/*` 加简版（本批零扩 IA——请裁）。
- ⑥ **旧件随正补件**：`-auto-update` 件 `prepublishOnly` 件数断言（8 ⇒ 10——叠加 #962 后；#962 §2.4 旧件清单未列该件）——建议其实施轮随正，或本批实施轮合并处置。
- ⑦ **`backup.mjs` 不入 npm 包**（`files` 白名单不含 `deploy/`）：npm 路定时器须「自仓库取脚本」（沿 `thincoder-server.service` 模板先例——README §9 注明）。
- ⑧ **CI（#964）所需 job** 一句（见 §2.1——workflow 全文归 #964）。
- ⑨ **杂项零涉**：LICENSE/favicon 已落（§1 在册）；i18n = #965 独立面（本批只留文案口径——直书 + 结构零动）。

### 2.9 上抛项

- **R15（需求档回笔——主 agent 笔）**：AC-13 行候补（判据草案 = 六面行：`gateway/API.md` §5 ∥ `accounts/ACCOUNTS.md` §5 ∥ `webui/WEBUI.md` §6 ∥ `ops/OPS.md` §7 ∥ `metering/METERING.md` §4）。先例 = AC-9–AC-12 回笔。
- **R16（实施后回填轮）**：预算实读（六面增量 ∥ 新三档）∥ 批内件实读 ∥ 旧件随正核销。
- 无「停下上抛」触发（§2:12 令 + 批档 §1 边界支撑本设计；零私自扩面；KD 语义零改——计数句随正已披露）。

## §3 设计评审（评审子代理）
## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
