# 2026-10-06 · first-release-completeness
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-06 · 来源 = 用户 2026-10-06 16:04「好歹像个完整的产品！你自己先反省一下，看看还漏了什么，都给补齐了」——需求 = 首版完备化五项（需求档 §2:12 ∥ 台账 #963）。
> 台账 = #963（server · 归批）。前情 = docs/batches/2026-10-06-server-presets.md §6（已收口 2026-10-06）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-06
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**§1 讨论（主 agent）**

**任务与来源**：用户 2026-10-06 16:04「thincoder现在也算是小有名气的产品了，你干活能不能要点面子？别这么半不拉拉的就把东西丢出去好吗！好歹像个完整的产品！你自己先反省一下，看看还漏了什么，都给补齐了」。需求 = **首版完备化**（需求档 §2:12；台账 #963）——审计实核六项：① 健康检查面（`/healthz` 全树零命中）∥ ② 登录防爆破（登录尝试零限流——零命中）∥ ③ 控制台版本与更新可见（public 面零版本——零命中）∥ ④ 成员接入指引（无成文——README/控制台实读）∥ ⑤ 部署文档完备（反代样例 ∥ 备份口径——现仅边界句 + 手工 cp）∥ ⑥ 用量保留口径（用量表只增不减——零清理实核）。

**授权**：本会话既定委托延续（代点火 + 代批准 · 自缚三条同前）。

**边界**：既有八件断言零破（或随正 + 披露——沿 #961 先例）；账号/计量/转发**语义**零改（② = 登录面新增防护，认证口径不变；⑥ = 保留窗配置化，查询面不变）；杂项（LICENSE ∥ i18n ∥ favicon）= **待用户裁——不在本批射程**；CI（#964 技术待办 = `.github/workflows` 无 server job）= 工程面父侧直改，随本批收口落。

**杂项三裁落地（用户 2026-10-06 16:09——父侧直接执行 · 可 revert）**：① **LICENSE = MIT** 已落（`LICENSE`（仓根）∥ `thincoder-server/LICENSE`——沿 cli/core/vscode 先例）；② **favicon = 桌面图标**已落（`thincoder-desktop/build/icon.png` ⇒ `thincoder-server/public/favicon.png` + `index.html` link 行；`webui-deploy` 件随正 4 ⇒ 5 档；复跑 6/6 绿；运行实例 GET `/favicon.png` ⇒ **200 · image/png · 2872B** 实核）——**移出本批射程**；③ i18n = 独立入面（#965——不在本批）。

**服从注记（用户 2026-10-06 16:13 · 需求 §2:14）**：控制台 IA 由 #962 轮（`#31`）定稿——本批 ③「控制台版本/更新可见」与 ④「接入指引（控台侧）」的落点须服从其导航结构（设计前先读 `webui/WEBUI.md` 新 IA；如在其设计未落前启动，以「挂点合适处」为暂形并在报告披露）。

**父侧裁定（评审轮 1——`#41` pass · 2026-10-06 17:1x）**：十二条逐条——#1–#12 **全部采纳**，随完备化修正轮（fix）落地（#1 = 角色面定案注句 ∥ #5 = 软线拆分预案 ∥ #11 = 回退句 ∥ #12 = 引用勘误；其余按各条建议）；落定后逐条核验转 Fixed，再走 §4。裁定明细见回复表（#1–#12）。

**fix 轮（`#43`）核验通过 + 父侧三处残余清算（2026-10-06 17:2x）**：十二条逐处回读落位 ✓（含 AC-13③④ 角色面句 ∥ 停机清周期 ∥ 十件 ∥ +35 闭式 ∥ host 注 ∥ 恢复步 ∥ 惰性清理 ∥ 回退句）；父侧机械清算三笔（均「父侧直接执行 · 机械 · 可 revert」，变更记录在册）：① `requirements/PROJECT.md` §2:13 拆行（327 字符 ⇒ 四行——行宽破面清零，承 `#43` 披露①）∥ ② `ops/OPS.md` KD-SV-19 删「推翻式」残留（披露② 裁定 = 清——全档「推翻式」归零）∥ ③ 板档 `PROJECT.md` §6 总账导数随正（≈3250 ⇒ ≈3247——#7 连带）。**本批设计面（修正后）静止**——待 §4。

**需求档回笔落地（父侧 · 2026-10-06 17:3x · 机械 · 可 revert）**：AC-13 行落需求验收表（六面判据——`requirements/PROJECT.md:75`）；**R15 销项**（板档 §9 已办）；六档候选标记收正（「候补——需求档回笔」⇒「已落需求档——验收表」——含各档变更记录 +1 行：OPS ∥ API ∥ ACCOUNTS ∥ WEBUI ∥ 板档）。

**服务面分单 1（`#46`）到货核验（父侧 · 2026-10-06 17:5x）**：九档落位（system **55** 新 ∥ errors **56** ∥ login-guard **119** 新 ∥ routes **98** ∥ routes-admin **61** ∥ config **189** ∥ update **239** ∥ usage **147** ∥ bin **148**）；八件 70/70 + 冒烟 26 项（自报）；实现期两处 `??` 吞值（`trustProxy: null` ∥ `usageRetentionDays: null`）由审计捕获并修。**待办在册**：① R16 回填项 = `gateway/API.md` §2.3 `mode` 枚举补「未就位 ⇒ `null`」形 ∥ `metering/METERING.md` §1 补「启动 fail-closed ∥ 周期 fail-open」句（代码跟设计、档面未收——随 R16）；② `config.example.json` 两键（`trustProxy` ∥ `usageRetentionDays`）= 分单 2 面（已 steer）；③ `-auto-update` 件数断言 9 ⇒ 10 = 分单 2 落地后父侧随正。

**订正（同轮 · node 口径复核）**：#46 九档实读核讫——system 55 ∥ errors 56 ∥ login-guard 119 ∥ routes 98 ∥ routes-admin 61 ∥ config 189 ∥ update 239 ∥ usage 147 **全部逐值吻合**；**bin = 153**（交卷报 148——其计数末窗差 5；R16 以实读为准）。另记：本机 bash（PowerShell）`Get-Content` 计数与 node/read 工具两次实测系统性不一致——**行数复核一律 node 口径**。

**分单 2（`#47`）到货核验 + 父侧随正（2026-10-06 18:1x）**：十一档落位（views-system **59** ∥ app **219** ∥ nav **82** ∥ style **83** ∥ Dockerfile **34** ∥ compose **20** ∥ backup **86**（新）∥ README **240** ∥ example **35** ∥ package.json（prepublishOnly **十件**）∥ 批内件 **497**）；随正落 = `-auto-update` 件数断言 9 ⇒ **10**（含头注两处）；**复跑取证：九件 79/79 全绿 ∥ `npm run prepublishOnly` 93/93 全绿**。R16 回填轮已发（`#53`——两处措辞收正 + 两条 upthrow 收正 + 全链预算实读）。

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

### 2.10 勘误追加（评审轮次 1 十二条收正——fix 轮 · 2026-10-06）

本块 = §2 勘误面（append-only——上列各节既有行不动，不一致处以此为准）。范围：十二号逐号落位（设计档五档 + 本档三处勘误）；零产品码 ∥ 零需求档笔 ∥ 他批零触。

- **§2.4 bin 行**（`thincoder-server/bin/thincoder-server.mjs`）：变更列追加「（含停机清周期）」（#2——停机链同拍 = `ops/OPS.md` §4）。
- **§2.4 测试面行**（批内件 ≈450）：≈450 越 300 软线 ⇒ 可按腿截面拆两档（①–③ ∥ ④–⑥）；>500 必拆（沿先例）（#5）。
- **§2.7 末行**：引用「披露⑤」⇒「披露①」（#12——存量悬空 65 = §2.8①）。
- **落位表（十二号——file:line）**：#1 = `webui/WEBUI.md` §2.1 注句 + §6 AC-13③④ 行 ∥ #2 = `ops/OPS.md` §4 停机链 + 本块 §2.4 勘误 ∥ #3 = `ops/OPS.md` §5.1（八件 ⇒ 十件） ∥ #4 = 板档 `PROJECT.md` §6（views-* +25 ⇒ +35） ∥ #5 = 本块 §2.4 勘误 ∥ #6 = `ops/OPS.md` §1 + `gateway/API.md` §2.2（删「推翻式」——保「用户令」出处）。
- **落位表（续）**：#7 = 板档 §6（ops ≈765 ⇒ ≈762；合计 ≈3220 ⇒ ≈3217） ∥ #8 = `ops/OPS.md` §5.9 容器 `host` 注 ∥ #9 = `ops/OPS.md` §5.5 恢复步 + §7 AC-13⑤ ∥ #10 = `accounts/ACCOUNTS.md` §2 惰性清理句 ∥ #11 = `ops/OPS.md` §5.5 回退句 ∥ #12 = 本块 §2.7 勘误。

### 2.11 勘误追加（R16 回填轮——2026-10-06）

本块 = §2 勘误面（append-only——上列各节既有行不动，不一致处以此为准）。范围：域档预算实读收正（五域 + 板档）∥ 批内件实读 ∥ 两处措辞收正 ∥ 两条在册 upthrow 收正 ∥ 随正核销记录；零产品码 ∥ 零测试档 ∥ 零需求档 ∥ 他批零触。

- **域档预算实读收正（两单合计）**：gateway 域 system **55**（标记翻正） ∥ errors **56**——小计 **1007**；accounts 域 login-guard **119**（标记翻正） ∥ routes **98** ∥ routes-admin **61**——小计 **632**；ops 域 update **239** ∥ config **189** ∥ bin **153** ∥ Dockerfile **34** ∥ compose **20** ∥ backup **86**（标记翻正） ∥ README **240** ∥ config.example **35**——小计 **1506**；metering 域 usage **147**——小计 **233**；webui 域 views-system **59** ∥ app **219** ∥ nav **82** ∥ style **83**——小计 **1006**；板档 §6 全树 **4534 行（44 档）**；批内件实读 **497**。逐处 file:line = 各域档 §4/§5/§6 + 板档 §6（明细见 R16 交付报告）。
- **package.json 行数按盘收正**：父侧交底 25；盘上实读 **26**（git 实核——工作树未提交增量 `dev` 脚本行 +1，HEAD 版 25 行）；板档 §6 已按盘收正（总账 4024 ⇒ **4534**）。
- **§2.3④ 措辞收正（#47 披露②——实现侧实核面）**：① 「CLI `/provider` 向导」⇒ 实命令名 = `/model` ⇒ `Add provider…`（`thincoder-cli/src/tui/slash-commands.mjs:45` ∥ `thincoder-cli/src/tui/model-picker.mjs:138`）；② 「字段 = name/baseURL/model/key」⇒ 实键 = `apiKey`（`thincoder-core/config-io.mjs`）；波及面 = `webui/WEBUI.md` §2.1 同句（已随正）。
- **在册 upthrow 收正（#46 披露②——代码跟设计、档面未收）**：① `gateway/API.md` §2.3 `mode` 枚举补「未就位 ⇒ `null`」形；② `metering/METERING.md` §1 补「启动 fail-closed ∥ 周期 fail-open」句。
- **随正核销记录（非本档笔）**：① `docs/batches/2026-10-06-server-auto-update.test.mjs:480` 件数断言 9 ⇒ 10 已落（父侧——实读在盘 `batchFiles.length, 10`）；② `thincoder-server/README.md` §3（Docker 路 ⑤ 补 `(healthy)` 半句——分单 2 §5.10 列外微改项，设计 README 变动行未含 §3，登记在案）。
- **本轮机检（R16 终跑——`node scripts/doc-check.mjs --root d:/teamcode/thincoder`）**：悬空 **65**（本批触面**新增 0**——改前后逐行对差：新增 0）∥ 行宽 **0**（新增 0）∥ 拟新增 53 ⇒ **50**（−3 = i18n 三档到盘转解析——非本批）∥ 迁移期引文 305；exit 1 = 存量闸态（非本批触面）。
- **另记（他批实况——非本批）**：i18n 三档已在盘（i18n 批接线在飞，`views-system.mjs` 窗口内 59 ⇒ 60）；i18n 面收正（三档实读 ∥ 接线增量）归 R18；本块未计（全树口径 = 在册表）。
- **收束**：五域 + 板档变更记录 +1 已落；§9 R16 销项（板档）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

评审对象（声明范围内）= `docs/server/design/`（板 2 档之板档 + 域 6 档：ops/OPS.md ∥ gateway/API.md ∥ accounts/ACCOUNTS.md ∥ metering/METERING.md ∥ webui/WEBUI.md ∥ store/STORE.md）∥ `docs/server/requirements/PROJECT.md` ∥ 本批档。判据 = 设计评审八维；🔴 0 ⇒ 通过。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements coverage | 🔵 | 更新提示可见面收窄到 admin：需求 §2:12③ 文句为「顶栏/页脚版本 + 更新可用提示」（`thincoder/docs/server/requirements/PROJECT.md:49`）；设计把更新提示只落在 admin 系统页（`thincoder/docs/server/design/webui/WEBUI.md:43`），meta 槽仅版本（`thincoder/docs/server/design/webui/WEBUI.md:34`）——依据已在 KD-SV-24 理由列「系统页 = admin（动作方）；meta 槽 = 全角色（版本非敏感）」（`thincoder/docs/server/design/ops/OPS.md:240`） | 若意图为全角色可见更新提示 ⇒ meta 槽在 `latest` 在场时补一行提示；若维持 admin-only ⇒ 在 AC-13③ 判据行与披露中注明角色面收窄 |
| 2 | Clarity | 🟡 | 新周期定时器的停机清理未落文：停机链只写「优雅收尾（停收新连 ∥ 关闭库）」（`thincoder/docs/server/design/ops/OPS.md:84`），批档 bin 增量注记只列「保留清理接线」（`thincoder/docs/batches/2026-10-06-first-release-completeness.md:84`）；同形态先例 = 更新循环的「停机清循环」（`thincoder/docs/server/design/ops/OPS.md:197`）。未清 `setInterval` 持活事件循环 ⇒ 优雅停机路径不退出 | 停机链与 bin 增量注记补「清周期定时器（更新循环 ∥ 保留清理同法）」一行 |
| 3 | Document ownership | 🟡 | `ops/OPS.md:92` 仍写「批内件八件——本批 +1」，与批档声明的件数链（`thincoder/docs/batches/2026-10-06-first-release-completeness.md:97`：`batchFiles.length, 8` ⇒ 10）不同拍——本批落定后门禁件数应为十 | §5.1 收正为十件（或改口径：引用 `package.json` 清单，免逐批改数） |
| 4 | Document ownership | 🟡 | 预算链分解不闭合：`thincoder/docs/server/design/PROJECT.md:134` 列「views-* +25」，`thincoder/docs/server/design/webui/WEBUI.md:87` 为「views-auth +15」+「各 +5」（= +35）；同式 550+30+10+25+5 = 620 ≠ 630 | 收正为「views-* +35」（或逐档列，与域档同拍） |
| 5 | Affected-file annotations | 🟡 | 批内件 `docs/batches/2026-10-06-first-release-completeness.test.mjs` 设计估 ≈450（`thincoder/docs/batches/2026-10-06-first-release-completeness.md:98`）——已越 300 软线，但设计只给硬限预案「>500 即按腿拆两件（沿先例）」 | 按六腿补软线拆分预案（如 ①②③ ∥ ④⑤⑥ 两档）或写明单档压线理由 |
| 6 | Doc hygiene | 🟡 | 「推翻式」残留仍在规范面：`thincoder/docs/server/design/ops/OPS.md:57`「推翻原「改配置 + 重启 ∥ 配置不热载」口径」∥ `thincoder/docs/server/design/gateway/API.md:52`「推翻「配置不热载」」——本批已在同节清掉同形残留（`thincoder/docs/batches/2026-10-06-first-release-completeness.md:130` 披露③） | 同法删去两处引号内失效口径（「用户令」出处保留；历史留变更记录） |
| 7 | Document ownership | 🔵 | ops 预算预估值两档不一致：`thincoder/docs/server/design/PROJECT.md:128`「≈765 ⇒ 1246」vs `thincoder/docs/server/design/ops/OPS.md:212`「≈762 ⇒ 1246」（实读列一致 = 1246） | 两档取一（若取 762 ⇒ 合计 ≈3220 随正为 ≈3217） |
| 8 | Feasibility | 🔵 | 容器路健康链路未注记：探针固定 `fetch('http://127.0.0.1:8787/healthz')`（`thincoder/docs/server/design/ops/OPS.md:188`）要求容器内 `host` 为 0.0.0.0/回环；§5.7 清单（`thincoder/docs/server/design/ops/OPS.md:178`）与 §5.9 端口注（`thincoder/docs/server/design/ops/OPS.md:189`）只提端口同步，未提 `host` 取值（0.0.0.0 于 `thincoder/docs/server/design/ops/OPS.md:29` 仅「仅单接口机可接受」警告，未禁） | 部署注记补「容器路 `host` 取 0.0.0.0（容器单接口——警告可接受），探针方可达」或让探针随 `host` 装配 |
| 9 | Clarity | 🔵 | 备份面缺「恢复」成文：§5.5 只有生成/定时器/边界（`thincoder/docs/server/design/ops/OPS.md:160`–`:166`），§5.4(e) 只写「回滚前建议先备份」（`thincoder/docs/server/design/ops/OPS.md:154`） | README §9 备份节补恢复步（停服 → 以快照替换库 + 清 `-wal`/`-shm` 伴档 → 起服），并进 AC-13⑤ 结构断言 |
| 10 | Clarity | 🔵 | 双维计数桶的过期清理/容量口径未明（双维计数 = `thincoder/docs/server/design/accounts/ACCOUNTS.md:21`；口面四口 = `thincoder/docs/server/design/accounts/ACCOUNTS.md:23`；KD-SV-21 = `thincoder/docs/server/design/accounts/ACCOUNTS.md:82`） | 补一句惰性过期清理（读写时清扫过期桶）或容量上限 |
| 11 | Feasibility | 🔵 | `node:sqlite` 的 `backup()` 为设计断言（`thincoder/docs/server/design/ops/OPS.md:163`「node 自带（零外部工具依赖）」）——本评审范围内 unverified（仅列档可读，未读源码/未实跑） | 实施轮以批内件「`backup.mjs` 实跑」判据兜底；若 API 不可用 ⇒ 回退停写窗快照方案并回笔设计 |
| 12 | Clarity | 🔵 | 批档内部交叉引用错位：`thincoder/docs/batches/2026-10-06-first-release-completeness.md:123` 写「披露⑤」，对应项实为 §2.8①（存量悬空 65——`:128`）；§2.8⑤ 是成员接入卡项（`:132`） | 引用改为「披露①」 |

评审范围限制（随本表在案）：① 未声明项目标准档 ⇒ 方法学按 `AGENTS.md` + 本设计集自身规范判；② 未找到文档地图 ⇒ 归属维按本集自带地图（`thincoder/docs/server/design/PROJECT.md:71` §3）与镜像指针纪律判——六项机制各有单源、零新建档承载既有章节，未见违例；③ 行数/增量按文档内链条互验（§6 总账 ↔ 域档 ↔ 批档 §2.4 全链相加一致），未对源码树实读复核（评审范围仅列档）。

计数：🔴 0 ∥ 🟡 5 ∥ 🔵 7；VERDICT: pass

## §4 用户批准（主 agent）

**§4 用户批准（主 agent 代签）**——用户 2026-10-06 16:04「thincoder现在也算是小有名气的产品了……看看还漏了什么，都给补齐了」（+ 16:09 杂项三裁）；全链授权沿 §1 自缚三条。

- **三条件齐备**：① 评审 **pass**（§3 轮次 1——🔴0 ∥ 🟡5 ∥ 🔵7，十二条全裁定）；② 修正轮已落地并逐条核验（`#43` fix 轮 12/12 + 父侧三处残余清算：需求档 §2:13 拆行 ∥ `OPS.md` KD-SV-19 残留删 ∥ 板档总账导数 ≈3247——§1 随记在册）；③ **token 已签发**（值不入档）。
- **批准范围** = 实施轮**一单**（19 档 + 批内件）：`src/gateway/system.mjs`（新——healthz ∥ `/api/system`）∥ `src/gateway/errors.mjs`（+码）∥ `src/accounts/login-guard.mjs`（新）∥ `src/accounts/routes.mjs` ∥ `src/accounts/routes-admin.mjs` ∥ `src/ops/config.mjs` ∥ `src/ops/update.mjs`（`getStatus`）∥ `src/metering/usage.mjs` ∥ `bin/thincoder-server.mjs` ∥ `public/views-system.mjs` ∥ `public/app.mjs` ∥ `public/nav.mjs` ∥ `public/style.css` ∥ `Dockerfile` ∥ `docker-compose.yml` ∥ `deploy/backup.mjs`（新）∥ `README.md` ∥ `config.example.json` ∥ `package.json` ∥ 批内件 `docs/batches/2026-10-06-first-release-completeness.test.mjs`（新——六腿）。
- **依据登记** = §3 轮次 1 ∥ §2（设计 + §2.10 勘误）∥ 需求 §2:12（AC-13 六面——回笔在册）。可撤回。
- **待办在册**：R15 需求档回笔（AC-13 行——父侧笔）∥ R16 实施后回填 ∥ 实施派发（排队——在 #962 B 单后；>15 档 ⇒ 按面分单）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（分单 2/2 部署·前端面十一档落位 ∥ 批内件 14/14 ∥ 九件回归 78/79（1 红 = 父侧在册件数随正项）∥ 偏差审计 1 轮 + 代码评审批 1 轮（pass）——终态 clean）



### 5.1 交付摘要（服务面分单 1/2——九档落位）

服务面六项（①/healthz ∥ ③/api/system ∥ ②登录防爆破 ∥ 配置两键 ∥ 更新器状态导出 ∥ ⑥用量保留清理 ∥ 启动/停机接线）**九档全部落位**——`node --check` 9/9 绿 ∥ 既有八件 70/70 保持 ∥ tmp 冒烟三件全绿（读数见 5.4）。

**改动（file:line——逐档）**

| # | 档 | 改动 | 关键锚 |
|---|---|---|---|
| 1 | `thincoder-server/src/gateway/system.mjs`（新 55 行） | `/healthz`（无鉴权 GET；200/503；no-store；仅注册 GET ⇒ HEAD/POST 404）∥ `/api/system`（会话门；`{version, update}`）∥ 注册函数导出 | `:15` probeDefault ∥ `:20` NO_UPDATE_STATUS ∥ `:26` registerSystemRoutes ∥ `:35` /healthz ∥ `:51` /api/system |
| 2 | `thincoder-server/src/gateway/errors.mjs`（55⇒56） | +`too_many_attempts`（429）码 | `:20` |
| 3 | `thincoder-server/src/accounts/login-guard.mjs`（新 119 行） | 双维内存锁（用户名 5 ∥ IP 20；窗=锁=15min）∥ 四口（check/recordFailure/recordSuccess/clearUsername）∥ IP 口径（trustProxy ⇒ X-Real-IP）∥ 惰性清理 ∥ 常量导出 ∥ 锁触发日志 | `:9`–`:12` 常量 ∥ `:16` clientIp ∥ `:30` createLoginGuard ∥ `:80` check ∥ `:94` recordFailure ∥ `:102` clearUsername ∥ `:108` recordSuccess ∥ `:119` defaultLoginGuard |
| 4 | `thincoder-server/src/accounts/routes.mjs`（81⇒98） | login 接线 guard（429 + Retry-After + 不跑散列 + 双维计数/清计）∥ 改密清本人用户名维 | `:40` THROTTLED_MESSAGE ∥ `:45`–`:66` login ∥ `:88` 改密清计 |
| 5 | `thincoder-server/src/accounts/routes-admin.mjs`（58⇒61） | 重置 ⇒ 清目标用户名维 | `:17` guard 注入 ∥ `:57` clearUsername |
| 6 | `thincoder-server/src/ops/config.mjs`（180⇒189） | +`trustProxy`（缺省 false；非布尔拒启）∥ +`usageRetentionDays`（缺省 90；正整数或 null；非法拒启）∥ 常量导出 | `:18` DEFAULT_USAGE_RETENTION_DAYS ∥ `:83`–`:90` 两键校验 ∥ `:114` 归一出参 |
| 7 | `thincoder-server/src/ops/update.mjs`（228⇒239） | +`getStatus()`（`{mode, lastCheckAt, latest}`——自检成功才更新；失败保前值；静默同面） | `:176`–`:177` 状态 ∥ `:184`–`:188` 自检更新 ∥ `:234` getStatus ∥ `:238` 导出 |
| 8 | `thincoder-server/src/metering/usage.mjs`（132⇒147） | +`pruneUsage`（删除式；null 零删；返回删除数）∥ +`USAGE_PRUNE_INTERVAL_MS`（24h） | `:13` 周期常量 ∥ `:78` pruneUsage |
| 9 | `thincoder-server/bin/thincoder-server.mjs`（126⇒148） | 保留清理接线（启动一次 + 24h）∥ 停机清周期（更新循环 ∥ 保留清理同法）∥ 系统面注册 + 惰性访问器 ∥ 登录守卫注入（两注册面共用） | `:73`/`:80`–`:82` 停机清周期 ∥ `:104` 启动清理 ∥ `:105`–`:112` 24h 周期 ∥ `:113` version ∥ `:114` loginGuard ∥ `:123` 系统面注册 ∥ `:136` 启动失败回收服务 |

### 5.2 决策透明表（设计未钉处——取径与理由）

| 点 | 设计未钉处 | 取径 | 理由 |
|---|---|---|---|
| `too_many_attempts` 的 `type` | API.md §3 只钉 429 + code | `rate_limit_error` | errors.mjs 头注「未钉处沿 OpenAI 惯例」；429 限流惯例形（`code` 才是判据） |
| 守卫形（口面四口） | §2 只列四口 + 时钟可注入 | 工厂 `createLoginGuard({now, log, threshold…})` + 模块级 `defaultLoginGuard` 缺省实例 | 工厂 = 时钟可注入（批内件）+ 状态隔离；缺省实例 = 两注册面（login ∥ 重置清计）免传即同拍；入口（bin）显式注入带 `log` 的实例 |
| 未就位（更新器未创建）之 `/api/system` 形 | 批档 §2.3 =「未就位 ⇒ 全 `null` 形」 | `{mode:null, lastCheckAt:null, latest:null}` | 跟批档；API.md §2.3 `mode` 枚举未含 null ⇒ 已上抛 doc 层（评审轮 1 #2 Accepted） |
| 保留清理失败口径 | 设计只钉时机（启动一次 + 24h） | 启动一次 fail-closed（抛 ⇒ startup_failed + 退出码 1）∥ 周期 fail-open（`usage_prune_failed` warn 续跑） | 入口既有失败口径（启动 fail-closed）∥ 周期清理不反噬服务；档面留痕已上抛（评审轮 1 #5 Accepted） |
| `pruneUsage` 缺省窗 | METERING §1 只钉缺省 90 天 | 缺省参数引 `DEFAULT_USAGE_RETENTION_DAYS`（config.mjs） | 90 单源（配置面 = 缺省单源） |

### 5.3 审计与代码评审轮次与终态

- **内部偏差审计（explore 只读）· 1 轮**：逐点核验 10 项 ⇒ **1 条 🟡**（`config.mjs:83` `trustProxy: null` 被 `??` 静默吞成 `false`——设计「非布尔 ⇒ 拒启」字面未达）⇒ 已修（`=== undefined` 显式判定 + 冒烟补 null 断言）；其余九面「与设计一致」。
- **advisor 代码评审 · 轮 1（全审）**：**VERDICT pass**——6 条 🔵（无 🔴/🟡）。
- **fix 轮**（对照 6 条逐条收正）：① bin 启动失败路径增 `app?.server?.close()`（防「收连接但库已关」半挂态）∥ ②/③ login-guard 两处注句（窗=锁须成对同取；默认实例进程内共享、测试须显式注入）∥ ④ `recordSuccess` 收敛为「一次 sweep + 双桶直删」∥ ⑤/⑥ 两条档面项（`mode:null` 枚举未收 ∥ 清理失败口径未留痕）= **上抛 doc 层**（非本轮代码可修，评审判 Accepted）。
- **advisor 代码评审 · 轮 2（fix 核验）**：**VERDICT pass**——4 项 Fixed（①③④⑥ 对应上列）+ 2 项 Accepted 关闭；新问题扫描零（修复面未见崩溃/丢数据/逻辑错）。
- **终态：`clean`**（无 🔴/🟡 未决；两条 doc 层项在案上抛）。

### 5.4 验证读数（本单）

- `node --check`：九档 **9/9 绿**。
- 既有八件复跑（`node --test docs/batches/2026-10-06-server-{gateway,gateway-accounts,gateway-metering,gateway-chat,gateway-webui-deploy,gateway-model-ref,presets,auto-update}.test.mjs`）：**70 tests ∥ pass 70 ∥ fail 0**（exit 0）。〔注：开工基线为 67/70——3 红系 #962 在途态（package.json 第九件 + `public/` 拆档）所致，非本单；#962 侧随正后本单收尾复跑转全绿。〕
- tmp 冒烟（`.thincoder/tmp/frc-svc-smoke/`——临时件、用完披露）：
  - `smoke-http.mjs`（**16 项**）：healthz 200（形 + no-store）∥ 503 degraded（注入探活失败）∥ HEAD/POST 404 ∥ 零凭据直调 ∥ `/api/system` 401/200（假状态注入）∥ 5 连败 ⇒ 429 + Retry-After=900s + 两维同文案 ∥ 他用户名不锁 ∥ IP 维 20 连败 ⇒ 429 ∥ 成功清计 ∥ 固定窗不延长（30 重试 ⇒ 仍 840s）∥ 惰性清理（锁尽即清计）∥ 四口 ∥ `pruneUsage` 删 1 留 1 / null 零删 ∥ config 缺省与拒启矩阵。
  - `probe-details.mjs`（**3 项**）：`login_throttled` 两维行形逐字段 ∥ `pruneUsage` 计划 = `SEARCH usage USING COVERING INDEX idx_usage_ts`。
  - `smoke-bin.mjs`（**7 项**，子进程 + 假 registry）：healthz 实探 ∥ `/api/system` 401/200（自检后 `latest=9.9.9`/`lastCheckAt` 就位——惰性访问器）∥ 实服务 5 连败 ⇒ 429 + `login_throttled` 日志行 ∥ 周期注册 `[86400000, 21600000]`（24h 保留 + 6h 自检）∥ SIGINT ⇒ shutdown/stopped + 周期清除裁决 ok + 退出码 0 ∥ 启动保留清理实删（91 天前删、1 天前留）。
- 零依赖扫描：九档 import 仅 `node:`/相对（既有 `依赖面` 件随八件复跑绿）。

### 5.5 披露（上抛父侧）

1. **doc 层两条**（评审轮 1 #2/#5——代码跟设计、档面未收）：`gateway/API.md` §2.3 的 `mode` 枚举未含「未就位 ⇒ `null`」形；`metering/METERING.md` §1 未见「启动 fail-closed ∥ 周期 fail-open」口径句。建议随 R16 回填轮落。
2. **`config.example.json` 未见两新键**（`trustProxy` / `usageRetentionDays`）——该档不在本单声明（归分单 2/回填），提请父侧确认归属。
3. **行数超设计估**：`login-guard.mjs` 119（设计 ≈90）、`bin` 148（设计 ≈142）、`config` 189（≈193 口径内）——回填轮随正。
4. **分单 2 面确认未实现**（Dockerfile HEALTHCHECK ∥ compose 注释 ∥ `deploy/backup.mjs` ∥ README §9–12 ∥ 控制台两档 ∥ `config.example.json` 两键 ∥ 批内件六腿）——按声明不在本单射程。
5. **tmp 冒烟件在盘未清**：`.thincoder/tmp/frc-svc-smoke/{smoke-http.mjs, smoke-bin.mjs, bin-proc.mjs, probe-details.mjs}`（临时面、未入 git）——保留作读数证据，如需清理请裁。

### 5.6 交付摘要（分单 2/2——部署/前端面十一档落位）

分单 2 面**十一档全部落位**：控制台系统页两节 + meta 槽版本行 ∥ `HEALTHCHECK` 接线 ∥ `deploy/backup.mjs`（新——在线快照）∥ README 部署面四节 ∥ 两随动件 ∥ 批内件六腿。`node --check` 新增/改动 JS 全绿 ∥ 批内件 **14/14** ∥ 九件回归 **78/79**（1 红 = 父侧在册随正项，见 5.10①）∥ `npm run prepublishOnly` **92/93**（同一红）。

**改动（file:line——逐档）**

| # | 档 | 改动 | 关键锚 |
|---|---|---|---|
| 1 | `thincoder-server/public/views-system.mjs`（15⇒59） | 两节填充：版本与更新（当前版本/档位/最近自检 + `latest` 两态提示）∥ 成员接入卡（运行时 origin + `/v1` ∥ key 提示 ∥ 四端 ∥ curl） | `:14` versionSection ∥ `:17`–`:19` lastCheckAt（null=未检） ∥ `:28` 更新提示 ∥ `:32` accessSection ∥ `:34` `location.origin` ∥ `:47`/`:51` 示例 ∥ `:54` renderSystem |
| 2 | `thincoder-server/public/app.mjs`（209⇒219） | `state.system` + `loadSystem()`（装配取一次；失败留空）∥ meta 槽 version 传参 ∥ 登出清缓存 | `:21`–`:29` 状态/取数 ∥ `:187` 取数接线 ∥ `:188` renderSidebar version ∥ `:205`–`:206` 登出清 |
| 3 | `thincoder-server/public/nav.mjs`（81⇒82） | meta 槽数据挂点（`version` 可选入参——缺省/空 ⇒ 留空静默；label 字面量面零动） | `:63`–`:66` 签名 ∥ `:79` 版本行 |
| 4 | `thincoder-server/public/style.css`（75⇒83） | 系统页样式（`.snippet` ∥ `.card h4` ∥ `.update-tip` ∥ `.end-list`/`.end-name`） | `:68`–`:74` |
| 5 | `thincoder-server/Dockerfile`（28⇒34） | `HEALTHCHECK` 逐字（§5.9：30s/5s/120s/3 ∥ `CMD node -e "fetch(…/healthz)…"`）+ 端口/`host`/标注态注 | `:28`–`:31` 注 ∥ `:32` HEALTHCHECK 行 |
| 6 | `thincoder-server/docker-compose.yml`（19⇒20） | healthy 继承注记（零结构改——不重复声明 healthcheck） | `:11` |
| 7 | `thincoder-server/deploy/backup.mjs`（新 86） | `node:sqlite` `backup()` 在线快照（源库只读开——零触）∥ `--config`/`--out` ∥ 缺省 out = 配置档旁 `backups/` ∥ 时间戳命名 ∥ 同秒拒写 ∥ `db` 的 `env:` 引用照配置契约解析 ∥ 退出码 0/1 | `:23` stamp ∥ `:29` parseArgs ∥ `:44` resolveDbPath（`:52` env:） ∥ `:62`–`:70` runBackup ∥ `:64` 同秒拒写 ∥ `:74`–`:80` 入口 |
| 8 | `thincoder-server/README.md`（142⇒240） | §9 备份与恢复重写（命令/定时器/恢复四步/回退句/权限）∥ §10 成员接入（新）∥ §11 反代与 TLS（nginx 完整段，三件齐）∥ §12 排障（探活/503/healthy/端口）∥ §13 边界（原 §10 改名）∥ §2 两行 + 例两键 ∥ §3 ⑤ healthy 半句 ∥ §4 停机补句 ∥ §6 系统页收正 | `:139` §9 ∥ `:180` §10 ∥ `:200` §11 ∥ `:222` §12 ∥ `:232` §13 |
| 9 | `thincoder-server/config.example.json`（33⇒35） | +`trustProxy: false` ∥ +`usageRetentionDays: 90` | `:6`–`:7` |
| 10 | `thincoder-server/package.json`（25 行数不变） | `prepublishOnly` 九 ⇒ 十（+本批件） | `:13` |
| 11 | `docs/batches/2026-10-06-first-release-completeness.test.mjs`（新 497） | 批内件六腿 14 用例 | ①`:124`/`:136` ∥ ②`:155`–`:252` ∥ ③`:258`/`:285` ∥ ④`:334`/`:374` ∥ ⑤`:390`/`:419` ∥ ⑥`:462`/`:481` |

### 5.7 决策透明表（设计未钉处——取径与理由）

| 点 | 设计未钉处 | 取径 | 理由 |
|---|---|---|---|
| 备份同秒重跑 | §5.5 只钉「时间戳命名 ∥ 退出码 0/非零」 | **拒写退出 1**（`目标已存在`） | 同秒覆盖 = 静默销毁上一份快照（数据面风险）；拒写 = 显式失败（README 成文；批内件断言） |
| `/api/system` 取数时机 | §2.1 只钉「启动装配时取一次」 | 会话就绪后**首个已登录路由**取一次；登出清缓存 | boot 时可能无会话（登录页）⇒ boot 取必 401 空置；一次/会话窗 + 登出重取 = 同目的（无重复请求） |
| 接入卡四字段展示形 | §2.1 只钉「字段 = name/baseURL/model/key」 | 单个四字段 JSON 样例 + 四端路径清单（而非四份重复样例） | 卡片面窄——同四字段重复四次不可读；「四端示例」以端 × 路径逐条在册 |
| 密钥字段名 | 同上（字面 `key`） | `apiKey`（读入 JSON 实键） | 客户端实契约 `providers[].apiKey`（`thincoder-core/config-io.mjs`）；写 `key` 会给出不可用的抄写样例（披露 5.10②） |
| CLI 进入路径 | §2.3④ 字面「`/provider` 向导」 | `/model` ⇒ `Add provider…` | CLI 无 `/provider` 命令（`slash-commands.mjs:45`/`model-picker.mjs:138` 实核——披露 5.10②） |
| `db` 的 `env:` 引用 | §5.5 未提 | 照 §1 配置契约解析（缺位 ⇒ 明确报错） | 服务端 `config.mjs` 即解析（唯一例外 `providers[].apiKey`）——不解析会让合法配置的备份静默失败（代码评审批 #1 收正） |

### 5.8 审计与代码评审轮次与终态

- **内部偏差审计（explore 只读）· 1 轮**：silent-simplification **0** ∥ out-of-list **0**；2 条文档面漂移（`apiKey` vs 字面 `key`；`/model` vs 字面 `/provider`——**均为实现侧正确、档面字面失准**）；软点 3 处 → 就地加固 2（① 腿① 断言非空前置 ∥ ② 恢复步补 `-shm` 断言），1 在案（同秒拒写为时序窗重试式——可偶发红、不会假绿）。
- **advisor 代码评审 · 轮 1（全审）**：**VERDICT pass**——🔴 0 ∥ 🟡 5 ∥ 🔵 5。
- **fix 轮（逐条收正）**：#1 🟡 `backup.mjs` `db` 字面读（`env:` 合法配置静默失败）⇒ **Fixed**（`resolveDbPath` 解 `env:` + 缺位抛；批内件补 2 断言）∥ #2 🟡 件数断言协调项 ⇒ **Accepted**（父侧在册——按令未触测试档）∥ #3 🟡 批内件 497 行（>300 软线）⇒ **Accepted**（<500 硬限；单档压线理由 = 六腿同源同批，拆档收益低于同批复跑成本）∥ #4 🟡 `prepublishOnly` 全树 `node --check` 口径差 ⇒ **Accepted**（#961 遗留、非本单引入；档面/父侧择一）∥ #5 🟡 批档 `/provider`/`key` 措辞 ⇒ **Accepted**（实现取实核面；档面措辞收正 = 上抛 5.10②）∥ #6–#9 🔵 ⇒ **Fixed**（README §9 权限行 ∥ §2 例补两键 ∥ §4 停机补句 ∥ 接入卡去反引号）∥ #10 🔵 预算估值漂移 ⇒ **Accepted**（R16 回填在册）。
- **终态：`clean`**（🔴 0 ∥ 🟡 无 must-fix；两在案上抛 = 5.10① 件数随正（父侧）+ 5.10② 批档措辞收正）。

### 5.9 验证读数（分单 2/2）

- `node --check`：本单 JS 5 档（`views-system.mjs` ∥ `app.mjs` ∥ `nav.mjs` ∥ `deploy/backup.mjs` ∥ 批内件）**全绿**。
- 批内件（`node --test docs/batches/2026-10-06-first-release-completeness.test.mjs`）：**tests 14 ∥ pass 14 ∥ fail 0**（六腿逐项见 5.6 #11）。
- 九件回跑（`node --test …-{gateway,-accounts,-metering,-chat,-webui-deploy,-model-ref,presets,auto-update,console-providers}.test.mjs`）：**tests 79 ∥ pass 78 ∥ fail 1**——唯一红 = `-auto-update.test.mjs:480` 件数断言（`应列九件：10`，父侧在册随正项）；其余 78 全绿（基线 79/79，差集恰为该断言）。
- `npm run prepublishOnly`（九件 + 本批件）：**tests 93 ∥ pass 92 ∥ fail 1**（同一断言）——件数随正落定即应转 93/93。
- tmp 冒烟（`.thincoder/tmp/frc-deploy-smoke/frc-deploy-smoke.mjs`）：**17/17**（热库在线快照含 WAL 行 ∥ 冷库 ∥ 产物自足单件 ∥ 源库零触 ∥ 同秒拒写 ∥ 退出码矩阵 ∥ `stamp`/`parseArgs`/`resolveDbPath` 直测）；同判据已固化进批内件腿⑤。
- 零依赖/外链：`public/**` 外链扫描**零命中**；全树 import 仅 `node:`/相对（既有「依赖面」件随九件回跑绿）——零新依赖（`backup.mjs` = `node:sqlite` 内建）。

### 5.10 披露（上抛父侧）

1. **件数断言（父侧在册——本单未触）**：`package.json:13` 现列十件 ⇒ `docs/batches/2026-10-06-server-auto-update.test.mjs:480` 的 `batchFiles.length, 9` 须随正为 10。受此影响九件回归与 `prepublishOnly` 现读数各含 1 红（均为该断言）；本单按令只改 `package.json`、零触测试档 —— 随正落定后请以实跑读数收口。
2. **批档措辞两处待 doc 层收正**（实现侧取实核面，非 R2 偏离）：① §2.3④「CLI `/provider` 向导」——CLI 实为 `/model` ⇒ `Add provider…`（`thincoder-cli/src/tui/slash-commands.mjs:45` ∥ `model-picker.mjs:138`）；② 同处「字段 = name/baseURL/model/key」——实键 = `apiKey`（`thincoder-core/config-io.mjs`；README/接入卡按实键书写）。
3. **设计未钉处取径两条**（5.7 在案）：备份同秒拒写（不覆盖）∥ `/api/system` 取数时机 = 会话就绪后首个已登录路由取一次（登出清缓存重取）。
4. **行数实读（回填轮用）**：`views-system` **59** ∥ `app` **219** ∥ `nav` **82** ∥ `style` **83** ∥ `Dockerfile` **34** ∥ `compose` **20** ∥ `deploy/backup.mjs` **86** ∥ `README` **240** ∥ `config.example.json` **35** ∥ `package.json` **26** ∥ 批内件 **497**（<500 硬限——单档压线理由见 5.8 #3）。
5. **tmp 冒烟件在盘未清**：`.thincoder/tmp/frc-deploy-smoke/{frc-deploy-smoke.mjs, _run.log}`（临时面、未入 git）——保留作读数证据，如需清理请裁。
6. **列外微改 1 处（披露）**：`README.md` §3 Docker 路 ⑤ 补 `(healthy)` 半句（随 `ops/OPS.md` §5.7⑤ 同拍——设计 README 变动行未含 §3）。

## §6 验证与收口（父代理）

**§6 验证与收口（父代理 · 2026-10-06 18:5x）**

**核销同步清单（逐项）**：

- **角色表**：§1 主 agent（两单核验 ∥ 随正 ∥ R16 派发记录）∥ §2 eng-designer（设计轮 + §2.11 R16 回填勘误）∥ §3 设计评审（轮 1 pass：🔴0 ∥ 🟡5 ∥ 🔵7——12 条全裁定）∥ §4 主 agent 代签 ∥ §5 eng-coder（分单 1/2 + 2/2）∥ §6 父代理。
- **修正轮落地前置**：① §3 轮 1 12 条——fix 轮 `#43` 12/12 落地并核验 ✓；② 两 doc 层 upthrow（`API.md` §2.3 `mode` 空形 ∥ `METERING.md` §1 口径句）= R16 收正 ✓（`#53` 交卷在案）；③ `config.example.json` 两键 = 分单 2 落 ✓；④ `-auto-update` 件数断言 9⇒10 = 父侧落 + 复跑 ✓（九件 **79/79** ∥ `prepublishOnly` **93/93**）。
- **搁置清单回核**：「无」。
- **暂缓批复核**：**暂缓批复核：无**。
- **用户文档面同拍**：AC-13/AC-14 回笔在盘（需求档 18/18——早轮）；批档 §2.11 勘误（措辞两处 + upthrow 两条 + 随正核销）✓。
- **计数**：R16 实读在册（全树 **4534/44 档**；五域收正）；批内件 **497**（<500 硬限；单档压线理由 = §5.8 #3 在案）。
- **指针**：R15 已办 ✓ ∥ R16 已办 ✓（板档 `:201`）；R17（i18n 面 AC-14 行）随 i18n 批 §6。悬空面 = #958 族 65（基线态——非本批触面）。
- **变更记录**：六档 +1 行 ✓（R16 随车）。
- **台账可见面**：`#963` → **待核销**（证据 = 本节 + 提交）；`#964`（CI 补 server job）= **本波落地**（父侧直接执行 · 工程工具面 · 可 revert：`.github/workflows/test.yml` +`server` job——`working-directory: thincoder-server` ⇒ `npm run prepublishOnly` 门禁（零依赖免 install）；等价命令本机实跑 **93/93** ✓；提交随波）；`#967`（种子边角注记）= 留（窗口过——README `:51` 已载「缺位 ⇒ 启动拒启 ∥ 保存 400」；残 nuance「库行留存 · 无回滚 · 先修 env 再起」= 随运维面下次触碰）；`#959` = 条件窗留（环境就绪）。
- **前批遗留核对**：前情 = 无（独立批）；`#961` 同触面串行处置 ✓；`#962` 同波 service 面 README/config 同址叠加——一次提交处置。
- **真机面**：`docker build` + HEALTHCHECK 实核 = **#959 条件窗**（本机无 Docker）；控制台走查 = 用户面（留用户）。

**验证读数（父侧收口核）**：九件 **79/79** ∥ `npm run prepublishOnly`（十件）**93/93** ∥ `node --check` 全绿 ∥ R16 机检触面新增悬空 0/超宽 0；批内件 **14/14**。

**提交**：随 server 波统一（#962 + 本批 + i18n 一次提交）；落地后回填哈希并 `batch close`。

**提交回填**：产品波 `9d33046a`（33 档——含本批 `.github/workflows/test.yml` +server job；双推 origin ∥ github ✓）；文档面（本档 ∥ 设计回填 ∥ 测试档）随 docs 波统一提交（在册）。**收口链全链完成**（§2 设计 → §3 评审 pass → §4 代签 → §6 核销）。
