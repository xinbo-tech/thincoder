# 2026-10-11 · 沙盒管理面 · Docker 管理（容器面 + 镜像族）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-11 · 来源 = 用户 2026-10-11 04:36「还没到直接干盒子里面的东西的时候，我觉得沙盒管理面现在缺口更大，根本没有提供完整的docker管理能力。」+ 04:39「容器面这些可以一起落地。」（批复父侧第一块石头提议：容器面 + 镜像族同批）。
> 台账 = #1265（server · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**§1 讨论（主 agent · 2026-10-11 04:36–04:39）**

**来源（逐字）**：用户 04:36「还没到直接干盒子里面的东西的时候，我觉得沙盒管理面现在缺口更大，根本没有提供完整的docker管理能力。」+ 04:39「容器面这些可以一起落地。」（= 批复父侧「第一块石头 = 镜像族」提议并扩入容器面——两族同批落）。

**本批条目（两族——目标 = 控制台把节点机上的容器与镜像管全，不再需要上机器敲命令行）**：
1. **容器面补齐**（现只有 列表/建/启/停/删）：**详情**（挂载/端口/环境/命令）∥ **日志** ∥ **重启** ∥ **强杀** ∥ **用量**（CPU/内存/磁盘）
2. **镜像族**（现全缺）：**列表** ∥ **拉取** ∥ **删除**（按节点）

**现状实读（2026-10-11 04:38）**：`src/sandbox/routes.mjs` + `public/views-sandbox.mjs` —— 节点（加/删/托管接入）∥ 容器 列表/建/启/停/删；镜像 ∥ 卷 ∥ 网络 ∥ 引擎信息 = 零。

**关键判据与依据**：用户 04:36 定「沙盒管理面 = 完整 docker 管理能力」——本批 = 其第一步（容器面 + 镜像族）；后续族（卷 ∥ 网络 ∥ 引擎）随本批试完再定（一块石头制——用户 04:32 裁）。

**边界（不做）**：`exec`（进盒执行——按你 04:36「盒子里面的东西先不碰」口径，未列本批；要入单说一声）∥ 卷族 ∥ 网络族 ∥ 引擎信息/清理 ∥ 盒子内部开发面（另线）。

**合并扫描**：#1250（镜像构建取源/离线取像——相邻面：其核心 = 构建期 apt 源与 save/load 搬运，本批 = 控制台管理动作，不并，关联在册）；#1259（删节点 confirm UI——节点面不同族，不并）。

**时序**：设计派单等 #187 评审落地——D5 冻结窗覆盖 `WEBUI.md`/`SANDBOX.md`/`API.md`/`STORE.md`/`PROJECT.md` 五档（本批设计正需写这五档）；本批档 = 新文件，不受冻结。

**前情**：无（独立批）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（评审轮 1 八发现逐条落位（见 §2.9；四档变更记录各一笔）；doc-check 单跑：行宽 OK（0 超宽）∥ 锚悬空 8 条（全 core/desktop 面——非本批））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批覆盖（用户 2026-10-11 04:36/04:39 两族同批——台账 #1265）

**容器面补齐（五件）**——在 runner-admin-console 批已落的 列表/建/启/停/删 之上补齐：

| # | 端点 | 语义 | 设计落点 |
|---|---|---|---|
| ① | `GET /api/admin/sandbox/runners/:id/containers/:containerId` | 详情（读时读 `containers/{id}/json`；挂载/端口/环境/命令逐值） | `gateway/API.md` §2.5 新行 ∥ `sandbox/SANDBOX.md` §3 本批块 |
| ② | `GET …/containers/:containerId/logs?tail=N` | 日志（tail 缺省 200、界 1–2000；非 TTY 多路复用解复用；截断 256 KiB） | 同上 |
| ③ | `POST …/containers/:containerId/restart` | 重启（204 ⇒ 200；404/502 同族） | 同上 |
| ④ | `POST …/containers/:containerId/kill` | 强杀（SIGKILL；引擎 409（未运行）⇒ 400 人话——非幂等成功） | 同上 |
| ⑤ | `GET …/containers/:containerId/stats` | 用量（`stats?stream=false&one-shot=true` + `json?size=1` 两读） | 同上 |

**镜像族（三件）**——本批新建档 `image-routes.mjs`：

| # | 端点 | 语义 | 设计落点 |
|---|---|---|---|
| ⑥ | `GET …/runners/:id/images` | 列表（`images/json`；`RepoTags` 缺 ⇒ `[]`） | `gateway/API.md` §2.5 新行 ∥ `sandbox/SANDBOX.md` §3 本批块 |
| ⑦ | `POST …/runners/:id/images/pull` | 拉取（体 `{ image }`——名:标签切分、缺省 `latest`、含 `@` ⇒ 400；超时 10 分钟；失败两形皆收） | 同上 |
| ⑧ | `DELETE …/runners/:id/images` | 删除（体 `{ ref, force? }`——ref 走请求体；409 ⇒ 400 人话引导） | 同上 |

**控制台面**：容器表行内钮 = 详情/启动（停止）/重启/日志/删除；容器详情弹窗（信息段 + 挂载表 + 端口表 + 环境块 + 用量块 + 强杀危险钮）；日志弹窗（`pre` 码面块 + tail 选择 + 刷新）；镜像区 = 镜像表 + 拉取/删除两窗（强制删除勾选——缺省不勾）。落点 = `webui/WEBUI.md` §2.8①。

### 2.2 设计落点（逐档 file:line 锚）

- `docs/server/design/sandbox/SANDBOX.md`：§3 新增「容器面补齐 + 镜像族」块（八端点逐条 + 自加项表六条）∥ §8① 容器区/镜像区随正 ∥ §11 增判据行 + 机检口径句改指针（单源 = `webui/WEBUI.md` §6；陈值「档目 33 ∥ 34」删）∥ §12 增用例（N53–N56 ∥ B47–B50 ∥ E39–E41）∥ §13 预算随正（`routes.mjs` 493 ⇒ ≈496 ∥ `container-routes.mjs` 168 ⇒ ≈330 ∥ `image-routes.mjs` 新 ≈130 ∥ `docker.mjs` 187 ⇒ ≈330）+ 拆分预案收正（首选已执行；余量 ≈4）∥ §14 增 KD-SV-92/93/94/95。
- `docs/server/design/gateway/API.md`：§2.5 前括注补容器面补齐/镜像族错误形句 + 新八行（端点契约单源）；变更记录一行。
- `docs/server/design/webui/WEBUI.md`：§1 静态面（+ 两新档；`views-*` 十三 ⇒ **十五档**）∥ §2.2 增键族登记一条（≈50 键）+ 表体量链随正 ∥ §2.8 标题/形态行改「分三轮落」+ ① 续扩块（详情/日志窗 + 镜像区）+ 拆档缘由句 ∥ §5 预算（拆档落点逐行）+ 档目链 **34 ∥ 35** ∥ §6 档目链各处随正 + 沙盒页行分轮随正 ∥ 变更记录一行。
- `docs/server/design/accounts/ACCOUNTS.md`：§2.1 `sandbox_event` 行 detail 枚举补四 kind（`container_restart` ∥ `container_kill` ∥ `image_pull` ∥ `image_delete`）+ 写入点补 `image-routes.mjs`；**型面计数零增（十三型不变）；CHECK 零动、`store/STORE.md` 零触**。
- `docs/server/design/PROJECT.md`：§2.1 sandbox 行（九档 ⇒ 十档）+ webui 行（档目链 34 ∥ 35；轮数两 ⇒ 三）∥ §3 文档地图 SANDBOX 行 ∥ §4 索引（1–91 ⇒ 1–95）∥ §5 增 KD-SV-92–95（全形四列）∥ §6 本批预算块 + 板级行（在飞两批各 +2）+ 注⑳ ∥ §7 AC-36 行补本批判据指针 ∥ §9 增 R55 ∥ 变更记录一行。

### 2.3 关键决策与自加项

新决策四条（全文 = `sandbox/SANDBOX.md` §14 ∥ 索引 = `design/PROJECT.md` §4/§5）：

- **KD-SV-92** 容器读数三件 = 读时读直取（零缓存零落库——沿 KD-SV-79）；一次采样基线不足 ⇒ `cpuPercent = null`（如实，不假装）。
- **KD-SV-93** 日志 = tail 有界 + 非 TTY 八字节帧头多路复用解复用 + 截断 256 KiB（判不出帧 ⇒ 原样透传）。
- **KD-SV-94** 拉取 = 同步请求 + 超时 10 分钟 + 失败两形皆收（非 2xx ∥ 200 流内 `error` ⇒ 400 携引擎原文）；异步任务/进度流/镜像源不做。
- **KD-SV-95** 镜像删除 = `ref` 走请求体（字符集含 `/`/`:`——路径段不兼容；沿 `DELETE /runners/:id` 体参先例）+ `force` 缺省 false（409 ⇒ 400 人话）。

**设计自加项（逐条带理由——全文表 = `sandbox/SANDBOX.md` §3 本批块）**：① 日志 tail 有界 + 截断 ∥ ② 帧解复用 ∥ ③ 拉取专用超时与两形皆收 ∥ ④ ref 走体 + force 缺省 false ∥ ⑤ 强杀 409 ⇒ 400（非幂等成功）∥ ⑥ 用量一次采样口径。六条均有「为什么 / 不做的代价」两列，未冒充用户口径。

### 2.4 受影响文件与行数预算（估）

| 档 | 现读（2026-10-11） | 本批估 | 备注 |
|---|---|---|---|
| `thincoder-server/src/sandbox/container-routes.mjs` | 168 | ≈330（+≈162） | 容器五件路由 + 校验/错误映射 |
| `thincoder-server/src/sandbox/image-routes.mjs` | —— | ≈130（新档） | 镜像族三件（按族分档——§13 预案①落地） |
| `thincoder-server/src/sandbox/docker.mjs` | 187 | ≈330（+≈143） | 客户端七调用 + 解复用 + 流扫描 + 形校验 |
| `thincoder-server/src/sandbox/routes.mjs` | 493 | ≈496（+≈3） | 镜像族注册一行 + import + 头注；**余量 ≈4——下批触本档前须先拆** |
| `thincoder-server/public/views-sandbox.mjs` | 494 | ≈355（−≈139） | 容器族/镜像族外拆 |
| `thincoder-server/public/views-sandbox-containers.mjs` | —— | ≈300（新档） | 容器区 + 详情/日志/建/删窗 |
| `thincoder-server/public/views-sandbox-images.mjs` | —— | ≈140（新档） | 镜像区 + 拉取/删除窗 |
| `thincoder-server/public/modal.mjs` | 77 | ≈115（+≈38） | 窗体助手四件迁入（`showNote`/`field`/`submitThen`/`confirmModal`——避循环 import） |
| `thincoder-server/public/i18n-{zh,en}-admin.mjs` | 138 ∥ 142 | +≈50/表 | 详情/日志/用量/镜像族键（两表逐键同步） |
| `thincoder-server/public/style.css` | 261（估链） | ≈266（+≈10） | 详情/日志/用量块（零新变量 ∥ 零新悬停规则——AC-19 canon 不破） |

档目：public **31 ∥ 32 ⇒ 34 ∥ 35**（+2 档）；批内件两件：`docs/batches/2026-10-11-sandbox-docker-admin.test.mjs`（估 ≈420——服务面：八路由 ∥ 假 Docker ∥ 帧解复用 ∥ 流内错误扫描 ∥ 审计四 kind）∥ `docs/batches/2026-10-11-sandbox-docker-admin-ui.test.mjs`（估 ≈280——前端面：三窗渲染 ∥ 镜像区 ∥ i18n 键集 ∥ 档目）。门禁件数断言件七件 42 ⇒ **44**；`thincoder-server/package.json` `prepublishOnly` 42 ⇒ **44**。

### 2.5 验收对照（三链一致——§2 条目 = 设计档判据 = 需求条目）

- 需求条目 = 需求档 §5 ①（容器面补齐：详情/日志/重启/强杀/用量）+ 镜像管理（列表/拉取/删除）——**AC-36 段**（沙盒块）；镜像管理原为「本轮不做」句 ⇒ 回笔 = R55①（主 agent 笔）。
- 判据链：`sandbox/SANDBOX.md` §11 本批判据行 ∥ §3 本批块（机制）∥ §12（N53–N56 ∥ B47–B50 ∥ E39–E41）∥ `gateway/API.md` §2.5 新八行（端点契约）∥ `webui/WEBUI.md` §2.8① + §6 沙盒行（控制台机检）∥ `accounts/ACCOUNTS.md` §2.1（审计四 kind）∥ 真机（10.0.0.6——收口轮）。
- 载体：批内件两件 + 收口轮（真机 + 浏览器实走）。

### 2.6 随正件（父侧落——实施轮同拍；以当刻盘面实读为准）

档目断言件九件（+2 名：`views-sandbox-containers.mjs` ∥ `views-sandbox-images.mjs`——31 ∥ 32 ⇒ **34 ∥ 35**）∥ 门禁件数断言件七件（42 ⇒ **44**——注释/断言消息同拍）∥ `thincoder-server/package.json`（`prepublishOnly` 42 ⇒ **44**；两件入链）。逐件名单/断点 = `design/PROJECT.md` §6 注⑳。

### 2.7 披露（不阻塞——逐条供复核）

① 拉取网络现实：Hub 在 `10.0.0.6` 不可达 ∥ 慢源 #1250——如实呈错 + 引擎原文；不加镜像源/重试机制。② `env` 原文可见（含盒内工作区 key——与既有「盒可达 server 整端口」同族残余面；如需掩蔽另轮）。③ 用量一次采样：首采样缺基线 ⇒ `cpuPercent = null`。④ 日志文本截断 256 KiB。⑤ Docker 引擎 `/images/create` 错误形（非 2xx vs 200 流内）未取真机样本——**两形皆收**作覆盖（不对引擎行为下注）。

### 2.8 上抛（[上抛·待裁]——主 agent/评审处置）

① **需求档回笔（R55①）**：`docs/server/requirements/PROJECT.md` §5 ①「本轮不做——镜像管理」行与 AC-36 ⑥ 分期句需回笔（镜像管理 = 本批交付面）；**写法/计数 = 主 agent 定**。② **需求档档目链口径差（R55① 后段）**：该档链未含 admin-agent-chat 批 +1（与设计侧链 31 ∥ 32 ⇒ 32 ∥ 33 差一档）——宜同拍收口。③ **链补登（本批设计侧已办，供核）**：`webui/WEBUI.md` §5 i18n admin 两部件链与 §6 AC-29① 档目链补 admin-agent-chat 批一步（前批漏登——计数一致性面修复，逐处已落）。④ **一致性面修复（本批已办）**：`sandbox/SANDBOX.md` §11 陈值「档目 33 ∥ 34」删（改单源指针）∥ `design/PROJECT.md` §2.1 sandbox 行「五档+三档」陈值收正为九档（补 `container-routes.mjs` 漏登）∥ `routes.mjs` 行陈值 407 收正为 493。

**设计轮产品码零触。**

### 2.9 设计评审轮 1 修正（fix 轮——八条逐条落位）

承批档 §3 轮次 1（0🔴 ∥ 3🟡 ∥ 5🔵——父侧逐条裁决采纳；执行者 = eng-designer）。落位（修复轮后盘面坐标）：

| 号 | 落位（file:line） | 内容 |
|---|---|---|
| 1 | `sandbox/SANDBOX.md:354` | §15 余项：删「镜像管理」（已交付——列表/拉取/删除）；「清单下拉（建容器镜像选择器）」转列余项 |
| 2 | `sandbox/SANDBOX.md:285`(B51) ∥ `:289`(E42) ∥ `:239`(§11 判据行) ∥ `design/PROJECT.md:505`(§7 AC-36 行) | 补两用例（超 256 KiB ⇒ `truncated: true` ∥ 五端点节点不可达 ⇒ 502）+ 用例链随拍（B47–B51 ∥ E39–E42） |
| 3 | `accounts/ACCOUNTS.md:67`（单源） ∥ `sandbox/SANDBOX.md:125` ∥ `:278`(N54) ∥ `:280`(N56) | 四 kind 的 detail 键集钉单源（`kind`+`runnerId`+`containerId` ∥ `kind`+`runnerId`+`image` ∥ `kind`+`runnerId`+`ref`+`force`）——N54/N56「detail 逐值」据此可机检；型面计数零增（十三型不变） |
| 4 | `webui/WEBUI.md:129`–`:130` | §2.2 沙盒批体量链注明链计法（只累沙盒族键；档绝对终值随 §5）——消「≈231 vs ≈313」两说 |
| 5 | `design/PROJECT.md:579`（R55①） | 诊断收正：实际缺口 = 本批 +2 步（需求链已含运行面批/chat 两步）；终值随设计链 ⇒ **36 ∥ 37**（需求档回笔仍归父侧） |
| 6 | `sandbox/SANDBOX.md:298` ∥ `:299` ∥ `design/PROJECT.md:315` | 分项闭式收平（container-routes +≈162：路由注册与头注≈24；image-routes：头注≈15——两档同拍） |
| 7 | `design/PROJECT.md:464`（注⑳） | 补「逐件行数 ⇒ ≤±2（与注⑲ 同件）」 |
| 8 | `webui/WEBUI.md:536` ∥ `:543` | §2.8 两处「本批」改批名（`运行面批落定` ∥ `托管接入增补`） |

四档变更记录各一笔（SANDBOX ∥ WEBUI ∥ ACCOUNTS ∥ PROJECT）。**产品码零触（fix 轮）。** 机检（doc-check 单跑）：行宽 OK（全源域 0 超宽）∥ 锚悬空 8 条（全 core/desktop 面——非本批，与设计轮基线同数）。

**观察（未触——供父侧裁）**：① `webui/WEBUI.md:552` ∥ `:661`（§6 行）——同族「本批」残留两处（评审点 = `:535` ∥ `:542` 两处，此两处不在点上位；「评审未点段落零触」）∥ ② `sandbox/SANDBOX.md:45`——runner 批 19:59 射程句「其余全部不做」行内仍列「镜像管理」（历史射程记录；评审未点——不触，供核）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements/文档状态 | 🟡 | §15 余项仍列「镜像管理（拉取/删除/清单下拉）」为延后（thincoder/docs/server/design/sandbox/SANDBOX.md:352），与本批交付面（SANDBOX.md:110「控制台把节点机上的容器与镜像管全——两族八端点」）相抵；需求侧同句已登记回笔（design/PROJECT.md:579「「本轮不做——镜像管理」行与 AC-36 ⑥ 分期句需回笔」；需求原文 = requirements/PROJECT.md:311「**本轮不做**——排空 ∥ 镜像管理 ∥ 工作区↔容器映射 ∥ 卷删除」）——§15 自身未随正。另：§15 括注含「清单下拉」子项，本批口径 = 列表/拉取/删除 三件；建容器弹窗镜像字段仍为预填文本（webui/WEBUI.md:538「镜像（预填设置 `image` 值）」）——该子项归属收口时宜明确。 | 收口随正 §15：把该项自余项清单删净（历史留变更记录）；并明确「清单下拉」（建容器镜像选择器）归属——并入本批（弹窗改选择器）或转列余项。 |
| 2 | Acceptance | 🟡 | §12 用例未覆盖两条本批路径：① 日志 256 KiB 截断的 `truncated: true` 路径无例（SANDBOX.md:277 只断「（零帧头残渣；`truncated=false`）」）；② 详情/日志/用量/重启/强杀的节点不可达 ⇒ 502 无例（SANDBOX.md:285「详情/日志/用量/重启/强杀目标不存在（引擎 404）」仅覆盖 404；502 仅 E40 拉取面与 B41 既有列表面）。 | 补两条用例：截断路径（超 256 KiB 样件 ⇒ `truncated: true` + 尾句标记）可并入 B47 或新 B 例；新端点 502 可并入 E39 面或新 E 例（代表端点 + 共性映射断言）。 |
| 3 | Clarity/机检 | 🟡 | 新四 kind 的审计 detail 键集无单源：accounts/ACCOUNTS.md:67 形面「`{ kind, workspaceId?, kept?, removed? }`」未含容器/镜像标识键，SANDBOX.md:125 仅 `image_delete` 注「（detail 携 force）」；而 SANDBOX.md:278（N54）判据写「——detail 逐值）」——「逐值」缺依据（既有实现先例携 `runnerId`+`containerId`——spot check：thincoder-server/src/sandbox/container-routes.mjs:163）。 | 在单源处（ACCOUNTS §2.1 形面或 SANDBOX §3 块）钉四 kind 的 detail 键集（runnerId+containerId ∥ image ref+force），使 N54/N56 的「逐值」可机检。 |
| 4 | Clarity(数字链) | 🔵 | webui/WEBUI.md:129 沙盒批体量链未随正——链文「≈141 ⇒ **≈167**（运行面批）⇒ ≈197（托管接入增补）⇒ ≈231（余面批）」与 WEBUI.md:619 同量链「⇒ ≈229（admin-agent-chat 批：+≈32 键——§2.10）⇒ ≈279（sandbox-docker-admin 批（本批）：+≈50 键——容器详情/日志/用量/镜像族）⇒ ≈313（沙盒余面批：+≈34 键——§2.2）」终值两说（231 vs 313）；即两批步（chat +≈32 ∥ 本批 +≈50）未入 129 链（变更记录自称「链补登」——§5 已补，§2.2 未补）。 | 把 129 链与 §5 取齐（或注明该链只计沙盒族键、终值随 §5）。 |
| 5 | 需求档回笔诊断 | 🔵 | design/PROJECT.md:579（R55 ①）第二句「该档档目链未含 admin-agent-chat 批 +1（与设计侧链 31 ∥ 32 ⇒ **32 ∥ 33** 差一档——口径差宜同拍收口）」与需求档现文不符——requirements/PROJECT.md:220 链已含「沙盒运行面批后 **31 ∥ 32** ⇒ admin-agent-chat 批后 **32 ∥ 33** ⇒ 沙盒余面批后 **34 ∥ 35**」；实际缺口 = 本批 +2 步（终值应随设计链 ⇒ 36 ∥ 37）。 | 回笔时以需求档实文为准（补本批 +2 步；余面批终值随设计链对齐）。 |
| 6 | 预算算术 | 🔵 | 分项和不闭：SANDBOX.md:296「+≈162 = 详情≈18 ∥ 日志≈22 ∥ 重启/强杀≈25 ∥ 用量≈28 ∥ 校验/错误映射≈45 ∥ 头注」——已列项和 ≈138（差 ≈24 全压「头注」方平）；SANDBOX.md:297（image-routes ≈130 = 列表≈20 ∥ 拉取≈40 ∥ 删除≈30 ∥ 校验≈25 ∥ 头注）同理（头注 ≈15 方平）。 | 补平分项（或注明余项构成/头注量），沿既有「分项闭式」先例。 |
| 7 | 受影响文件注 | 🔵 | design/PROJECT.md:464（注⑳）随正件清单（档目断言件九件 ∥ 门禁件数断言件七件 ∥ `package.json`）未逐件列「当前行数 ⇒ ≤±N」，转引「与注⑲ 同件」（注⑲ 口径含「逐件行数 ⇒ ≤±2」——design/PROJECT.md:659）；受影响测试档行数注未就地显式。 | 沿注⑲ 补一句「逐件行数 ⇒ ≤±2（与注⑲ 同件）」（或逐件列），使受影响文件注闭合。 |
| 8 | Doc hygiene | 🔵 | webui/WEBUI.md:535「**① 运行面**（**本批落定**——机制 = `sandbox/SANDBOX.md` §3）」与 WEBUI.md:542「**托管接入（本批增补——#1236/#1237）**」的「本批」指前批（runner-admin-console），而同节 WEBUI.md:539/:541 的「本批」指 sandbox-docker-admin——同节「本批」三指。 | 两处改批次名（或日期戳），消同节混指。 |

证据口径：spote check（criteria 8）——routes.mjs 493 ∥ container-routes.mjs 168 ∥ docker.mjs 187 ∥ views-sandbox.mjs ≈493（标注 494，±1 计数口径内） ∥ modal.mjs 77，与标注相符；三个「拟新增」档（image-routes.mjs ∥ views-sandbox-containers.mjs ∥ views-sandbox-images.mjs）未在盘 ✓；窗体助手四件现居 views-sandbox.mjs（:48/:55/:60/:75）——「迁 modal.mjs」路径成立 ✓。

VERDICT: pass

计数：🔴 0 ∥ 🟡 3 ∥ 🔵 5（共 8 条）

## §4 用户批准（主 agent）

**§4 用户批准（主 agent 代签——用户 2026-10-11 05:46「自动跑完」授权）**

- **三条件齐备**：① 设计评审 **#190 = pass**（🔴 0 ∥ 🟡 3 ∥ 🔵 5；轮次 1 全文 = §3）；② **修正轮 #193 已落地并经父侧逐条核验**（八号落位——抽面实读 `SANDBOX.md:285`/`:289`/`:298`/`:299`/`:354` ∥ `ACCOUNTS.md:67` ∥ `WEBUI.md:535`/`:542` ∥ `design/PROJECT.md:579` 等在册；父侧另收同族残句两处 = 直接编辑〔可 revert，WEBUI.md 变更记录已注〕）；③ **token 已签发**（评审 Approved 回执在会话——#190）。
- **授权口径**：用户 05:46「自动跑完」= 全链授权（代点火 ∥ §4 代签 ∥ 修正/实施派发 ∥ 收口核销 ∥ 提交推送 ∥ token 消费）；父侧自缚三条同本仓惯例：新范围 ∥ 用户口径裁决 ⇒ 停并只摆一条；破坏性 ∥ 不可逆 ⇒ 先停；复评再出 🔴 即停。
- **本批射程确认**：两族（容器面补齐五件 ∥ 镜像族三件）+ 控制台面 + 审计四 kind（型面十三型不变、CHECK 零动）；实施 = 单舱派发（14 件；与在飞 chat 批四档共写面——调度器排队，落盘以当刻盘面实读为准）；随正件（档目断言件九件 ∥ 门禁件数断言件七件 + `package.json`）= 父侧实施轮同拍（注⑳）。

## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
