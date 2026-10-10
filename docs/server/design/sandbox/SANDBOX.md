# Thincoder Server · 沙盒（sandbox/SANDBOX——控制面）

> 板块 = server ∥ 本域 = sandbox（服务端执行沙盒）；本档 = 域档·**控制面**；执行面 = 同域 `RUNNER.md`。
> 需求单源 = `docs/server/requirements/PROJECT.md` §5 沙盒块（#1215 前置硬题）；**控制面/执行面分离 + runner farm = 用户 2026-10-10 14:00 裁定**（原话：「沙盒可不可以不运行在thincoder-server本机？我们可以考虑外挂几台机器跑沙盒，否则一个节点把服务器干死了就都死了。」）。
> 端点表 = `gateway/API.md` §2.5/§2.6（单源）；执行强制细节 = `RUNNER.md`；表结构全文 = `store/STORE.md` §2 v11 段。
> 建档：2026-10-10（批 `docs/batches/2026-10-10-server-exec-sandbox.md` 设计轮 · eng-designer · 台账 #1224）。

## 1. 形态与两平面

- **一句话**：沙盒 = 容器强制的代码执行隔离件——**盒**（每工作区一个容器）跑在**执行面（runner farm）**的机器上，由**控制面（server）**编排治理；**server 本机不跑盒**。
- **控制面**（本档）= server 的 sandbox 域：编排（任务队列）∥ runner 注册与健康 ∥ 放置 ∥ 出站规则单源 ∥ 待批队列 ∥ 每工作区凭据 ∥ 审计 ∥ 控制台。
- **执行面**（`RUNNER.md`）= runner：跑盒 ∥ 本地强制（网络闸 ∥ 出站闸代理 ∥ 资源 ∥ TTL）∥ 执行命令 ∥ WIP 快照上送。runner = **牲口**（可 join ∥ 排空 ∥ 替换——§5）。
- **为什么分离**：单机把盒与 server 放一起 ⇒ 一台节点被盒压死即全死（用户 14:00 原话）；分离后盒的资源耗尽只影响所在 runner，server 常驻面不受累。
- **容器唯一形态**（用户 13:43「容器是必须，不要考虑什么退路」）：runner 无容器运行时 ⇒ 该 runner 拒跑（`RUNNER.md` §7）；**无 runner 注册 ⇒ 仅沙盒功能面不可用**（控制台明示——不降级）。
- **server 启动与运行零依赖沙盒/runner**（用户 14:24 裁定——原话「thincoder server启动应该是不依赖沙盒的，runner应该也只是相关功能不可用。」）：不因缺容器运行时 ∥ 缺 runner 注册 ∥ 沙盒未配置而拒启或降级；缺 ⇒ **仅沙盒功能面不可用**（503 `sandbox_unavailable` + 控制台明示）；网关 ∥ 记账 ∥ 控制台其余页 ∥ 客户面零影响（与「服务器重启/runner 重启均不断盒」`RUNNER.md` §2 同向）。
- **非目标**（需求块明写）：内核 0day ∥ 侧信道 ∥ 国家级逃逸。

## 2. 对象模型与存储（v11）

新表（v11 段——`thincoder-server/src/store/db.mjs`（已落盘 255 行）追一段；DDL 全文 = `store/STORE.md` §2 v11 段）：

| 表 | 内容 | 关键列 |
|---|---|---|
| `sandbox_runners` | 注册的 runner | id ∥ name ∥ token_hash ∥ labels_json ∥ status（active/draining/drained/disabled）∥ runtime_json（自检读数）∥ last_heartbeat_at ∥ created_at |
| `sandbox_workspaces` | 工作区登记 | id ∥ name ∥ owner_member_id ∥ key_id ∥ key_plain ∥ runner_id（绑定）∥ required_labels_json ∥ limits_json（每工作区覆写——下条）∥ created_at |
| `sandbox_rules` | 出站规则（单源） | id ∥ kind（cidr/domain）∥ action（allow/deny）∥ target ∥ port ∥ protocol ∥ priority ∥ note ∥ source（default/admin/approval）∥ created_at ∥ created_by |
| `sandbox_pending` | 待批记录（史） | id ∥ runner_id ∥ workspace_id ∥ host ∥ hits ∥ first_seen_at ∥ last_seen_at ∥ status ∥ resolved_at |
| `sandbox_tasks` | 指令队列（runner 领取） | id ∥ runner_id ∥ kind ∥ payload_json ∥ status ∥ created_at ∥ claimed_at ∥ finished_at ∥ result_json |
| `sandbox_checkpoints` | WIP 快照登记 | id ∥ workspace_id ∥ created_at ∥ size ∥ blob_path ∥ note |
| `sandbox_settings` | 设置（键值——全局默认） | k ∥ v——**键全集与值形 = `gateway/API.md` §2.5（单源）**；「默认单」**不在本表**（= `sandbox_rules` 种子行——§4） |

- **审计**：`audit_events.type` CHECK 重建（v11——沿 v10 表重建先例 `db.mjs:171-192`）——**十型 ⇒ 十二型**（+ `sandbox_rule`（规则增删——detail.action + 规则原文）∥ `sandbox_event`（审批三态/超时 ∥ 盒起停拆 ∥ runner 注册/排空/删除 ∥ join 失败（`runner_join_failed`） ∥ 快照——detail.kind）；型面单源 = `accounts/audit.mjs`（已落盘 109 行））。
- **修订号（rulesRev）**：规则/设置变更 ⇒ 全局单调 +1——runner 按修订号拉全量（§4 下发判据）。
- **明文落库**：`sandbox_workspaces.key_plain`（工作区 key 明文——盒每次重建须再注入；先例 = provider key 明文（KD-SV-19）；披露 = §10-D2）。
- **每工作区资源档（覆写）**：`sandbox_workspaces.limits_json`（JSON 对象——键 = `cpus` ∥ `memMb` ∥ `pids` ∥ `diskMb` ∥ `idleTtlMinutes` ∥ `wallclockTtlHours`；缺键 = 随全局默认）；写端点 = PATCH（§9 ∥ `gateway/API.md` §2.5）；**取值序 = 全局默认（`sandbox_settings`）⇒ 逐键叠加工作区覆写（覆写优先）**。
  解析结果随 create/重建指令 payload 下发（runner 侧零回落逻辑）；生效 = 下次建盒/重建（运行中盒零触——容器旗不可热改）。

## 3. runner 注册与通道（最小权限）

- **注册**：控制台生成**加入令牌**（一次性 ∥ 缺省 30 分钟有效——设置项 `joinTtlMinutes`；**落点 = server 进程内存**（token hash → `{expiresAt, consumed}`）——**重启 ⇒ 未兑换令牌作废**（重生成即可；沿登录防护计数先例））⇒ 控制台随给**可复制整条命令**（含 server 地址）+ **有效期可见**（§8 运行面）⇒ runner 按命令兑换**runner 令牌**（runner 本机存 0600 ∥ 服务器存 sha256）⇒ 落 `sandbox_runners` 行。
- **join 失败 = 逐句人话**（过期 ∥ 已用过 ∥ 令牌不对——三态区分）**+ 失败审计行**（`sandbox_event`——detail.kind = `runner_join_failed`）。
- **鉴权**：runner 令牌 = Bearer，**只对 `/api/runner/*` 有效**（独立守卫 `requireRunner`——**落点 = `thincoder-server/src/accounts/session.mjs`**（沿 `requireAdmin` 形——同档第三门；§14 预算行在册））；不入 `api_keys` ⇒ 不能打 `/v1`、不能打 `/api/*` 其余面（最小权限——用户 14:00 裁定⑤）。
- **心跳**：15s 周期——携带：版本 ∥ runtime 自检读数（容器运行时/网络工具/配额机制）∥ 盒清单与状态 ∥ 磁盘余量 ∥ 排空旗；3 拍缺 ⇒ 标 unhealthy（控制台红），恢复自动转回。
- **领取**：长轮询 `POST /api/runner/poll`（等待 ≤25s；携本机 rulesRev）⇒ 响应 `{指令[], rulesRev（变则全量规则）, 待批裁定[], drain}`。
- **上报**：`POST /api/runner/report`（指令结果 ∥ 盒状态变化）；待批登记 = `POST /api/runner/pending`；快照上送 = `POST /api/runner/checkpoint`；快照取回 = `GET /api/runner/checkpoint/:id`（重建用）。
- **版本面**：注册/心跳携 runner 版本；与 server 不一致 ⇒ 控制台警示（升级 = 重装重启；runner 自动更新 = 不做——§16）。
- **离线行为**：server 不可达 ⇒ runner 继续跑盒（沿最后已知规则；待批一律超时拒）；新指令无 ⇒ 控制台按 unhealthy 明示为盲区。
- **任务模型（runner 与 CI 共用——用户 14:00 裁定⑦）**：指令 = `{id, kind, workspaceId, payload}`，kind 可扩；本批 = `sandbox.*`（create/start/stop/destroy/exec/checkpoint/restore）；CI 批（#1216③）加 `ci.*` kind——**同一套注册/心跳/领取/上报通道**（本批只留此接口，不实现 CI）。
- **指令悬挂回收**：`claimed` 逾期（缺省 5 分钟——常量）∧ runner 失联（3 拍缺 = unhealthy）⇒ 回收——**幂等 kind**（create/start/stop/destroy/checkpoint/restore）⇒ 回 `queued` 重派（同 runner 复联 ∥ 按放置改派）；**非幂等 kind（`exec`）⇒ `failed`** + `result` 明示原因（不自动重跑——副作用不可复现）；控制台工作区行可见（`queued`（重派中）∥ `failed`（原因））。

## 4. 出站规则（单源在本档——强制在 RUNNER.md）

- **两类同表**（需求块）：① **CIDR 规则**（网络层——安全组同形：`allow ∥ deny` × `CIDR` × 端口/协议；零域名依赖）；② **域名规则**（应用层——经 runner 的出站闸代理）。**各自可单独使用**（只用 CIDR ∥ 两者并用）。
- **默认全拒**：无允许条目 ⇒ 全拒。
- **默认禁单**：`127.0.0.0/8` ∥ `169.254.0.0/16` = **内置恒拒**（非行——不可改；已裁 U2）∥ RFC1918（`10.0.0.0/8` ∥ `172.16.0.0/12` ∥ `192.168.0.0/16`） ∥ 服务器网段 ∥ runner 自身网段（注册时自动带入）= **种子 deny 行**（`source='default'`——可改可删）。**内网/固定 IP 后端 = 显式加 allow 条目**（零域名依赖——需求块原句；显式 allow 可开种子 deny——§10 U2）。
- **默认单**（开箱可用——**单源 = `sandbox_rules` 种子行**（`source='default'`——可改可删；初始化点 = v11 迁移段一次性写入——不复活）——已裁 U3 = 五条起步）：`registry.npmjs.org` ∥ `github.com` ∥ `*.githubusercontent.com` ∥ `gitee.com` ∥ `*.gitee.com`——装依赖/拉仓无需任何批准。
- **两闸次序**（域名路径——需求块）：域名命中 ⇒ 解析（取全地址）⇒ **每个解析 IP 仍过 CIDR 闸**（否则「白名单域名 + 内网解析」即绕过）。
- **冲突序**：**显式 deny 恒先于 allow**（同一目标两者皆中 ⇒ 拒）；**种子 deny（`source='default'`）≺ 显式 allow**（显式 allow 可开 RFC1918/服务器网段——U2 裁定）；`priority` = 同动作内排序（可读性 + 未来扩展）。
- **通配**（仅域名规则）：单层左通配 `*.example.com`（恰一级子域）；**禁**裸 `*` ∥ TLD 级（`*.com`）∥ 双通配 ∥ IP 段通配；写面校验（非法 ⇒ 400）；控制台通配条目带醒目标记；审计行记原文。
- **生效**：增删 ⇒ `rulesRev` +1 ⇒ 随 poll 下发 ⇒ runner 应用（CIDR ⇒ 防火墙链重算 ∥ 域名 ⇒ 代理规则热换）——**不重建盒**（需求块）。
- **审计**：每次增删一行 `sandbox_rule`（type 单源 = §2）。
- **谁能改**：v1 = admin（会话 `requireAdmin`）；#1216② 权限面落地时在**同一守卫点**换判据（接口已留——§9）。

## 5. 放置策略与牲口语义

- **放置**：工作区 → runner **绑定**（卷在 runner 本地盘——绑定即稳定）；首置 = 标签满足（`required_labels ⊆ runner labels`）的健康 runner 中取盒数最少者；无满足者 ⇒ 排队等待 + 控制台明示（不做降级放置）。
- **容量**：runner 注册携 `{labels, maxBoxes}`；超限 ⇒ server 不再放置。
- **排空（drain）**：控制台一键 ⇒ 停止新放置 ∥ runner 收旗后停盒（在跑指令收尾）∥ 卷保留 ∥ 拆盒前 WIP 快照（§6）∥ 状态 draining ⇒ drained。
- **替换/退役（decommission）**：显式动作（二次确认）——要求：其工作区已重建到新机 ∥ 或确认丢弃（控制台明示 dirty 清单与快照情况）。
- **换机重建**：新盒 = 重克隆仓 + 恢复最近 WIP 快照；无快照 ⇒ 控制台明示「未提交改动将丢」，卷在旧机保留至人工确认。
- **未提交改动的保护（三层）**：
  1. **卷保留（恒在）**：拆盒（空闲/TTL/排空）**永不删卷**——卷留 runner 本地盘；
  2. **WIP 快照**（缺省开——已裁 U5）：盒脏（git 未提交/未跟踪）⇒ 周期（缺省 15 分钟）+ 拆盒前 + 排空前打包上送 server（`sandbox_checkpoints`——缺省每工作区保留最近 5 份；上送口径 = `gateway/API.md` §2.6：octet-stream 流式体 ∥ 路由级上限 200 MiB ∥ 流式落盘）；恢复 = 新盒下载套用；
  3. **销毁**：删卷 = 管理员显式确认（控制台示 dirty 与快照态——「明示风险 + 用户可选」）。
  - 快照形 = git 工作区包（stash 提交 + 未跟踪清单；`git ls-files --others --exclude-standard` 口径）；非 git 工作区 ⇒ 跳过 + 控制台标「无保护」。
- **卷**：runner 本地盘 `<workspaceRoot>/<ws-id>`（runner 配置项）；磁盘配额 = `RUNNER.md` §5。

## 6. 待批队列（首次新域——需求块）

- 盒访问未在白名单的域名 ⇒ runner **挂起该连接**（缺省 60s）∥ 登记 pending（同 host 去重 + hits++）∥ 上报 server ⇒ 控制台「工作区 X 想访问 Y」。
- 三态（控制台一键）：**批准一次**（放行当次；再访问再批）∥ **批准并记住**（写域名规则——source=approval——即生效）∥ **拒绝**；超时（缺省 60s）⇒ 拒。
- **三次批准同一域**（approve-once 计数——由 `sandbox_pending` 史派生）⇒ 控制台出「建议入默认单」行（一键采纳 = 并入默认单种子）。
- 裁定经 poll 下发（≤1s 级）；runner 本地保持挂起直至裁定到达或超时。
- 审计：`sandbox_event`（kind=approval——三态 + timeout + host + workspace）。

## 7. 盒内凭据（每工作区）

- **签发**：工作区创建 ⇒ server 签发一枚**工作区 key**（`api_keys` 行——名 `sandbox:<workspace>`；复用 accounts key 面 `accounts/keys.mjs:85-93`；**不判 20 上限**——沿 CLI/登录先例 `keys.mjs:19`）；明文存 `sandbox_workspaces.key_plain`（§2）。
- **归属**：owner_member_id（工作区负责人）——模型用量/配额走**既有成员三级配额链**（零新配额机制）；记账按 key 归因（`usage.key_id` 存量列）⇒ 控制台按工作区可查。
- **吊销/轮换**：工作区销毁 ∥ 控制台「轮换」⇒ 吊销旧 key（`revokeKey`）+ 签发新 + **拆容器重建**（**卷保留**——新 key 于重建时注入 env；容器 env 运行期不可变 ⇒ 无「不重建即生效」路径）；重建前旧 key 已失效（401）。
- **盒内形态**：容器 env 注入——`OPENAI_BASE_URL=http://<server>:<port>/v1` ∥ `OPENAI_API_KEY=<workspace key>`（+ TC_* 别名随实施）；**盒内零服务器密钥**（真 provider key 绝不入盒——网关代持）。
- **网络路径**：盒 → server 网关地址:端口 = **内置允许**（不算用户规则——模型调用生命线）；server 其余面 = 会话门禁（盒内无会话）+ 登录防爆破门在（读法披露 = §10-D3）。

## 8. 控制台面

- **落点（已裁 U4）**：server webui 新管理页「沙盒」`#/admin/sandbox`；**非壳页**（卡多——沿看板页先例，不扩「钉表五页」）。
- 卡面（**六面**——必交面（用户 14:08 行）：运行面 ∥ 工作区 ∥ 出站规则 ∥ 待批队列 ∥ 资源与 TTL ∥ 审计可查）：
  - **运行面**（可用性门：无 runner/无运行时 ⇒ disabled + 原因文本 ∥ runner 清单：名/状态/标签/版本/自检读数/排空钮/退役钮；写入口 = 加入令牌生成——一次性；生成 ⇒ **token + 有效期可见 + 整条可复制命令**（含 server 地址，复制钮沿 `showSecret` 件）；join 失败 ⇒ 审计卡可见失败行）；
  - **工作区**（列表：名/负责人/绑定 runner/盒状态/dirty/快照/操作：启动/停止/销毁/轮换 key/快照恢复；写入口 = **每工作区覆写**（资源 + TTL：`cpus`/`memMb`/`pids`/`diskMb`/空闲 TTL/墙钟 TTL——行内编辑；生效 = 下次建盒/重建））；
  - **出站规则**（安全组式表：方向（恒出站）∥ 协议 ∥ 端口 ∥ 目标 ∥ 动作 ∥ 优先级 ∥ 备注；增删行内；默认单 = `source=default` 种子行（可改可删））；
  - **待批队列**（实时表 + 三钮 + 「建议入默认单」行；写入口 = 待批超时）；
  - **资源与 TTL**（全局默认：limits（cpus/mem/pids） ∥ 磁盘配额默认 ∥ 空闲 TTL ∥ 墙钟 TTL ∥ 快照周期/保留数 ∥ 镜像名；读数：各 runner 磁盘余量 ∥ 盒资源占用）；
  - **审计可查**（`sandbox_rule` ∥ `sandbox_event` 过滤视图——数据面 = 审计页同源 + 本卡快捷入口）。
- **每配置项有界面写入口**（必交面判据——用户 14:08）：`sandbox_settings` 逐键 ↔ 卡面对照——`cpus`/`memMb`/`pids`/`diskMb`/`idleTtlMinutes`/`wallclockTtlHours`/`checkpointEveryMinutes`/`checkpointKeep`/`image`/`tmpfsMb` ⇒ 资源与 TTL ∥ `pendingTimeoutSeconds` ⇒ 待批队列 ∥ `joinTtlMinutes` ⇒ 运行面。
  默认单 = 出站规则卡内 `source=default` 行（**非设置键**）；**每工作区覆写**（资源 + TTL）⇒ 工作区行；规则条目 ⇒ 出站规则行内增删。**零配置项以「编辑配置文件」收场**（部署拓扑项不涉本设置面）。
- 判权：v1 = `requireAdmin`（会话）；#1216② 到位后换同点（§9）。
- 明示义务：无 runner ⇒ disabled + 原因；runner unhealthy ⇒ 红；工作区无保护（非 git/快照失败）⇒ 标。
- **成员面（本人自助——用户 14:56 裁；需求 §5 沙盒块成员面行）**：成员自己的资源须有本人面——首个兑现 = **工作区读面**（承载 = `webui/WEBUI.md` §2.9 `#/me/sandbox`；信号 = `gateway/API.md` §2.7——恒本人过滤）；**待批发起方提示** = `pending` 在场 ⇒ 端侧「等待管理员批准」提示（不得静默挂起——≤60s 窗内可见）；**成员写面**（启动/停止/销毁/轮换）随 #1216 ② 权限模型（本批不做）。

## 9. 端点与判权（表在 API.md——单源）

- 控制台面 = `/api/admin/sandbox/*`（§8 六面对应）；runner 面 = `/api/runner/*`（§3——端点表七行）。
- 表 = `gateway/API.md` §2.5（控制台面）∥ §2.6（runner 面）∥ §2.7（成员面）；错误形 = §3 全码 + **一码新增** `sandbox_unavailable`（503——无 runner/无可用运行时）；判权 = `requireAdmin`（`thincoder-server/src/accounts/session.mjs`）∥ `requireRunner`（新守卫——落点同档，§3）∥ 成员面 = 会话（本人过滤——§8 成员面）。

## 10. 已裁决策与读法披露

**已裁（2026-10-10 14:23 用户「都按建议」——逐条 = 原设计建议）：**

| # | 已裁项 | 候选 | 裁定 | 影响 |
|---|---|---|---|---|
| U1 | runner 容器运行时 | A Docker ∥ B Podman ∥ C 两者兼容（适配层） | C（检测序 docker ⇒ podman；适配层薄——`runner/runtime.mjs`（拟新增）） | runner 部署面 + 自检读数 |
| U2 | 内网 CIDR 的口子 | A 硬核恒拒（`127/8` + `169.254/16`）＋ RFC1918/服务器网段 = 默认可被显式 allow 开 ∥ B 四个默认全可开 ∥ C 四个默认全恒拒 | A（内网后端可用诉求成立；探针 P3 仍成立） | rules 校验 + 求值序 + P3 |
| U3 | 默认单内容 | §4 拟定五条 ∥ 增删任意 | 按 §4 五条起步（控制台可改） | 开箱体验（装依赖/拉仓） |
| U4 | 控制台落点 | A server webui 新管理页 ∥ B 并入系统页 ∥ C 三端 | A（一页一职责——沙盒面自持） | webui 页数链 + 实施面 |
| U5 | WIP 快照默认 | A 周期 15 分钟 + 拆前 ∥ B 仅拆前 ∥ C 无（仅卷保留） | A（牲口语义下最小保护） | runner 负载/带宽 |

- U2 读法注：需求块「默认禁单…内网/固定 IP 后端 = 显式加 CIDR 允许条目」与「deny 恒先于 allow」并置——本裁定取「默认 = 种子（可改）；**显式 deny 恒先**；种子 deny ≺ 显式 allow（相对序——§4）」。

**读法披露（用户未异议——不阻塞·按设计实施）：**

- **D1（tmpfs 例外）**：需求块「唯一可写挂载 = 工作区卷」——设计与工具链刚需并置：`/tmp` = tmpfs（内存背书 ∥ 容积封顶 ∥ 非持久）为唯一例外（node/npm 必需）；无持久宿主面写入（`RUNNER.md` §3）。
- **D2（key_plain 明文）**：工作区 key 明文落控制面库（§2——盒重建须再注入；先例 KD-SV-19）；键面 = 工作区作用域可吊销——泄露面收于该工作区。
- **D3（盒可达 server 整端口）**：内置允许 = server 网关地址:端口（盒可达该端口全部路径）；控制台/管理面靠会话门禁（盒内无会话）；如需收窄到 /v1 路径级 ⇒ 翻案点（另设专用监听）。
- **D4（复用 key 的残余面）**：工作区 key 作为 `api_keys` 行天然可打 `/api/client/*`（logout/me——自身读面）；收窄（scope 列）= 另轮。

## 11. 验收判据（需求块 → 设计判据）

| 需求（`docs/server/requirements/PROJECT.md` §5 沙盒块） | 设计级判据 | 载体 |
|---|---|---|
| 容器唯一 ∥ 无退路 | 无 runner ⇒ status = unavailable + 控制台明示；runner doctor 失败 ⇒ 拒跑（P14） | 批内件 + 收口轮 |
| 威胁模型五面 | 红队探针 §12（P1–P9）逐条读数 | 收口轮（真机 runner） |
| 每工作区一盒 ∥ read-only ∥ 唯一可写挂载 ∥ 盒内零密钥 | `RUNNER.md` §3 创建参数表 + P6/P8 | 批内件 + 收口轮 |
| 出站两类同表 ∥ 默认全拒 ∥ 两闸 ∥ 显式 deny 先 ∥ 通配 ∥ 即生效 ∥ 审计 | rules 校验/求值单测 + P4/P11/P12 + 审计行落库断言 | 批内件 + 收口轮 |
| 待批队列（三态 ∥ 60s ∥ 三次建议） | 队列单测 + P12 | 批内件 + 收口轮 |
| 资源上限 ∥ 墙钟 TTL ∥ 空闲拆 ∥ 每工作区覆写 | P5/P7 + TTL 单测（假 runtime）+ 覆写单测（PATCH ⇒ 建盒载荷逐值——N45） | 批内件 + 收口轮 |
| 非目标（0day ∥ 侧信道） | §1 明写不做 | —— |
| 验收 = 红队探针套件 + 正常开发链 | §12 全套 + P10 | 收口轮 |
| 落地序（先于 #1215）∥ 与 CI 共用 runner | §3 任务 kind 可扩 + §16 边界（CI 实现不在本批） | 设计在档 |
| 14:00 裁定（两平面 ∥ 注册鉴权 ∥ 放置 ∥ 牲口 ∥ 最小权限 ∥ 无 runner 不可用 ∥ CI 共用） | §3–§5 + §9 双守卫 + 对应探针 | 批内件 + 收口轮 |
| 管理与配置界面 = 必交面（用户 14:08——六面 + 每项配置有界面写入口） | §8 六面在册（含运行面加入流程三件：可复制命令 ∥ 有效期可见 ∥ join 失败逐句人话 + 失败审计行）∥ 每配置项有 UI 写入口（`sandbox_settings` 逐键对照表 + 每工作区覆写——§8）∥ 控制台机检口径 = `webui/WEBUI.md` §6 沙盒行（含 `#/admin/sandbox` 路由 ∥ nav 管理 8 ∥ 档目 33 ∥ 34 ∥ i18n `admin.sandbox.*` 两表同步） | 批内件 + 收口轮（浏览器实走） |
| 成员面 = 本人自助（用户 14:56——AC-36 ⑧） | §8 成员面（`#/me/sandbox` 本人工作区读 + 待批发起方提示）∥ 信号 = `gateway/API.md` §2.7 | 批内件 + 收口轮（浏览器实走） |

## 12. 红队探针套件（逐条：跑法 ∥ 期望读数）

跑法 = `thincoder-runner probe --workspace <id> --probe <P#>`（拟新增——经控制台触发）；读数 = 逐条 PASS/FAIL 行（收口轮留档）。

| # | 探针 | 跑法（盒内） | 期望读数 |
|---|---|---|---|
| P1 | 宿主文件面不可达 | 读 `/etc/passwd` ∥ `/etc/shadow` ∥ 宿主独有路径 | passwd 仅盒内账户（宿主用户名零命中）；shadow 拒；宿主路径 ENOENT |
| P2 | curl 本机端口拒 | `curl -m 3 <runner 宿主 IP>:22`（及闸外端口） | 超时/拒；盒内 `127.0.0.1` = 盒自身（宿主回环不可达） |
| P3 | 云元数据拒 | `curl -m 3 http://169.254.169.254` | 超时/拒（禁单恒拒） |
| P4 | 非白名单出站拒 | `curl https://<未列域>` | 挂起 ⇒ 待批出现 ⇒（不批）超时 ⇒ 403 |
| P5 | fork 炸弹被杀 | `:(){ :\|:& };:` | 盒存活；进程数封顶（pids-limit 读数） |
| P6 | 写 `/` 拒 | `touch /x` | read-only 文件系统错 |
| P7 | 填盘拒 | 超配额写工作区 | 配额处 ENOSPC；宿主盘不涨破界；盒存活 |
| P8 | 盒内零密钥断言 | 盒内 env 逐项对照白名单（`HOME`/`OPENAI_BASE_URL`/`OPENAI_API_KEY`/`HTTP(S)_PROXY`/`TC_*`）+ 全盒文件面密钥形态扫描（`sk-` 族 ∥ 长随机串） | 白名单外零环境变量；文件面零密钥形态命中；工作区 key 在场（应然） |
| P9 | 跨工作区读拒 | 盒 A 访问盒 B 的卷路径/网络地址 | ENOENT ∥ 不可达（每工作区独立网络） |
| P10 | 正常开发链通过 | 拉仓 ⇒ `npm install` ⇒ `npm test` ⇒ 网关模型调用（工作区 key）⇒ 停/起盒文件在 | 各步通过；用量按 key 归因入账 |
| P11 | 规则热生效 | 增 CIDR allow ⇒ 盒直连 ∥ 增 deny ⇒ 即断 | 不重建盒；即效 |
| P12 | 待批三态 | 三态各一次 + 一次超时 | 一次 = 当次放行再访问再挂 ∥ 记住 = 不再挂 ∥ 拒/超时 = 403 |
| P13 | 吊销即断 ∥ 轮换重建 | 轮换工作区 key（拆容器重建——卷保留）⇒ 旧 key 调用；重建完成后新 key 调用 | 旧 key ⇒ 401；重建后新 key 可用（用量归新 key 行） |
| P14 | 无 runner 不可用 | 停 runner ⇒ 控制台/端点读数 | disabled + 原因（503 `sandbox_unavailable`） |

- **P1–P10** = 需求块字面所列（读 `/etc/passwd` 拒 ∥ curl 本机端口拒 ∥ 云元数据拒 ∥ 非白名单出站拒 ∥ fork 炸弹被杀 ∥ 写 `/` 拒 ∥ 填盘拒 ∥ 盒内零密钥断言 ∥ 跨工作区读拒 ∥ 正常开发链通过）；**P11–P14** = 本设计增（均对应需求块条目：即效/待批/吊销/可用性门）。
- P8 判据 = 结构性（白名单比对 + 形态扫描）——**canary 真值（真 provider key）不下行 runner**（密钥面纪律：真 key 只存网关——runner 面零真值）。
- 跑前提：一台真 runner（容器运行时 + 网络工具 + 配额机制齐——`RUNNER.md` §7）；P4/P12 用缩短的待批超时跑（设置项）。

## 13. 用例（本域——两平面）

| # | 类 | 面 | 输入 | 预期输出 |
|---|---|---|---|---|
| N40 | 正常 | 控制面 | 控制台生成 join token（随给可复制整条命令 + 有效期显示）⇒ runner `join` | `sandbox_runners` 行诞生（runner token 只存 hash——sha256）；心跳后控制台运行面在列；join token 落点 = 进程内存（重启作废——重生成即可） |
| N41 | 正常 | 控制面 | 建工作区（负责人 + 标签）⇒ 放置 | key 签发（`api_keys` 行名 `sandbox:<ws>`）+ 绑定满足标签的最少盒 runner + create/start 指令入队并被领取 |
| N42 | 正常 | 控制面 | 规则增删各一（`sandbox_rules`） | `rulesRev` +1 ⇒ 随 poll 下发 ⇒ runner 应用（**不重建盒**）；审计 `sandbox_rule` 两行 |
| N43 | 正常 | 控制面 | 待批三态各一次（once ∥ remember ∥ deny） | 挂起 ≤60s；once = 当次放行再访问再挂；remember = 规则入表（source=approval）即生效；审计 `sandbox_event` |
| N44 | 正常 | 执行面 | runner 重启（盒在跑） | 按 label 采纳既有盒（零重建）；server 复通后心跳/领取恢复 |
| N45 | 正常 | 控制面 | 建工作区携 `limits`（cpus/memMb）⇒ PATCH 覆写 `cpus` ⇒ 触发重建 | 行 `limits_json` 回读逐值；create/重建 payload 逐值 = 覆写 ∪ 全局默认（未覆写键）；运行中盒零触（仅重建生效） |
| B35 | 边界 | 控制面 | 无 runner 注册 ∥ runner doctor 核心项失败 | 沙盒面 disabled + 原因文本；写动作读数 503 `sandbox_unavailable`（不降级） |
| B36 | 边界 | 控制面 | 域名规则校验：`*.example.com` ∥ `*` ∥ `*.com` ∥ `a.*.com` ∥ IP 段通配 | 首者收；余者 400（写面）——控制台通配条目带醒目标记 |
| B37 | 边界 | 控制面 | 同 host：allow 规则 + deny 规则并存 | 拒（显式 deny 恒先）；priority 只排同动作内 |
| B38 | 边界 | 控制面 | 同一域三次 approve-once | 控制台出「建议入默认单」行；采纳 ⇒ 并入默认单种子 |
| B39 | 边界 | 执行面 | 盒空闲 30 分钟（dirty）∥ 墙钟 24h | 停盒 + 拆前 WIP 快照（dirty）；卷留；下次使用重建（重克隆 + 快照恢复） |
| B40 | 边界 | 执行面 | 非 git 工作区 ∥ 快照 > 200 MiB | 跳过快照 + 上报；控制台标「无保护」 |
| B41 | 边界 | 控制面 | runner 领指令后失联（3 拍缺 + `claimed` 逾期） | 幂等 kind ⇒ 回 `queued` 重派；`exec` ⇒ `failed` + 原因（不自动重跑）；控制台工作区行可见 |
| E29 | 错误 | 控制面 | `user` ∥ 无会话打 `/api/admin/sandbox/*`；runner 令牌打 `/api/*` 其余面 | 403 ∥ 401；runner 令牌 ⇒ 401（最小权限） |
| E30 | 错误 | 控制面 | join token 过期 ∥ 复用 ∥ 伪造 | 400（**逐句人话**：过期 ∥ 已用过 ∥ 令牌不对）+ 失败审计行（`sandbox_event`）；`/api/runner/*` 无令牌 ⇒ 401 |
| E31 | 错误 | 控制面 | 销毁工作区（dirty 未确认）∥ 轮换后旧 key 再用 | 拒/警示（二次确认要求）；旧 key 再用 ⇒ 401（吊销即断）；轮换 = 拆容器重建（卷保留）后新 key 生效（P13） |
| E32 | 错误 | 执行面 | doctor 核心项失败（无容器运行时 ∥ 无网络工具 ∥ 无配额机制 ∥ IPv6 路由在场） | 拒跑（进程退出 + 原因上报——控制台明示） |
| E33 | 错误 | 执行面 | 盒写超磁盘配额 | ENOSPC（应用可见）;宿主盘不涨破界（配额兜底） |

## 14. 本域文件与行数预算（控制面）

| 档 | 行数（设计估） | 职责 |
|---|---|---|
| `thincoder-server/src/sandbox/routes.mjs`（拟新增） | ≈270 | 控制台面端点（§8/§9） |
| `thincoder-server/src/sandbox/runner-api.mjs`（拟新增） | ≈230 | `/api/runner/*`（§3） |
| `thincoder-server/src/sandbox/registry.mjs`（拟新增） | ≈250 | 注册/放置/任务队列（§3–§5） |
| `thincoder-server/src/sandbox/rules.mjs`（拟新增） | ≈230 | 规则/待批/修订号（§4/§6） |
| `thincoder-server/src/sandbox/credentials.mjs`（拟新增） | ≈80 | 工作区 key（§7） |
| `thincoder-server/src/accounts/session.mjs`（已落盘 96） | ≈+12 | `requireRunner` 守卫（§3——沿 `requireAdmin` 形） |
| `thincoder-server/src/store/db.mjs`（已落盘 255） | ≈+90 | v11 段（§2） |
| `thincoder-server/src/accounts/audit.mjs`（已落盘 109） | ≈+3 | 十二型（§2） |
| `thincoder-server/src/gateway/errors.mjs`（已落盘 64——2026-10-10 现读） | ≈+2 | `sandbox_unavailable`（§9） |
| `thincoder-server/bin/thincoder-server.mjs`（已落盘 182） | ≈+6 | import + 注册行 |
| **小计** | **≈+1172** | —— |

- 执行面（含 deploy 两档）预算 = `RUNNER.md` §9（`package.json` bin 面行在册）；webui 预算 = `webui/WEBUI.md` §5；批内件预算 = 批档 §2；板账 = `docs/server/design/PROJECT.md` §6。
- 批内件两件（均入 server 链）：`docs/batches/2026-10-10-server-exec-sandbox.test.mjs`（服务面——估 ≈480） ∥ `docs/batches/2026-10-10-server-exec-sandbox-runner.test.mjs`（执行面——估 ≈450）；批档 §2 列全。

## 15. 关键决策（本域）

| # | 决策 | 理由 | 被否候选与何故否 |
|---|---|---|---|
| KD-SV-63 | **两平面分离**：server = 控制面（编排/治理），盒只跑在 runner farm（可多台 ∥ 横向加 ∥ 排空替换） | 用户 14:00 裁定（单点被压死即全死）；控制面常驻质量与盒资源耗尽解耦 | 同机跑盒（否——单点故障 + 资源争用）；server 直连 docker（否——同因） |
| KD-SV-64 | **runner = 同包第二入口**（`thincoder-runner` bin——同一 npm 包）+ 注册制（join token → runner token）+ 心跳/长轮询通道 + 最小权限（`/api/runner/*` 专用守卫） | 一个制品两个角色：版本锁步（协议面同提交演进）、零新增打包面；令牌化通道贴合牲口运维（一条命令 join） | 独立包 `@thincoder/runner`（版本偏斜 + 打包面翻倍——否）；server 反向拨入 runner（外网/NAT 面复杂——否） |
| KD-SV-65 | **runner 鉴权 = Bearer 令牌**（join 一次性兑换；sha256 落库 `sandbox_runners.token_hash`） | 零 PKI 机制、贴合零第三方依赖纪律；LAN 面 + 反代 TLS（部署面）已足 | mTLS（私有 CA/证书轮换机制 = 新运维面——后置；如需 ⇒ 反代层加） |
| KD-SV-66 | **放置 = 工作区↔runner 绑定 + 容量标签 + 最少盒数** | 卷在 runner 本地盘 ⇒ 绑定即稳定；标签面向异构机队；最少盒数 = 均衡 | 纯负载均衡（卷移动成本被忽略——否）；随机（不可预期——否） |
| KD-SV-67 | **未提交保护 = 三层**（卷恒不删 ∥ 周期+拆前 WIP 快照 ∥ 销毁二次确认） | 牲口语义下「状态 = git 仓（可重建）」，本地卷 = 缓存；快照兜住未提交面 | 卷迁移（跨机传输机制重——否）；无保护（违「别被测试代码打崩」精神——否） |
| KD-SV-68 | **出站 = 双实现两闸**（网络层 CIDR + 代理层域名，解析后 IP 二查；显式 deny 恒先（种子 deny ≺ 显式 allow——U2）；修订号下发即生效） | 需求块两闸次序与两类同表的直接落地；网络层保 CIDR 零域名依赖，代理层保域名与漂移 IP | 纯代理（CIDR 直连场景失真——否）；纯网络层（域名不可行——需求块已裁——否） |
| KD-SV-69 | **待批队列 = 挂起 + 三态 + 60s + 三次建议** | 需求块 + 行业形（Claude Code 同形）；挂起在 runner、裁定经 server | 一律硬拒（体验差——需求块已否）；自动放行（安全面破——否） |
| KD-SV-70 | **每工作区凭据 = `api_keys` 行**（名 `sandbox:<ws>`；归属负责人；明文存控制面） | 复用客户面 token 面（需求块原句）；校验/记账/配额全链零改；明文 = 盒重建再注入所需（先例 KD-SV-19） | 新 key 族（第二校验面——否）；每次重建新签发（行累积 + 链路抖动——否） |
| KD-SV-71 | **可用性门 = 无 runner ∥ 无运行时 ⇒ 仅沙盒功能面不可用**（不降级）；**server 启动与运行零依赖沙盒/runner**（用户 14:24——网关 ∥ 记账 ∥ 控制台其余页 ∥ 客户面零影响） | 用户 13:43「不要考虑什么退路」的延续（限于沙盒面）+ 用户 14:24 裁定（server 零依赖） | 降级为直跑进程（否——违容器唯一形态）；server 因缺 runner/运行时拒启或整站降级（否——违用户 14:24） |
| KD-SV-72 | **任务通道 kind 可扩（runner 与 CI 共用）** | 用户 14:00 裁定⑦：「跑不受信的仓」本质同——一套机队一套通道 | 另建 CI 专用 runner 族（机队翻倍——否） |

## 16. 本域边界（不做）

- **CI 实现**（#1216③——本批只留 kind 与通道接口）∥ **#1215 产品面**（web 开发会话 ∥ 移动端 ∥ agent 交互）。
- **runner 自动更新**（升级 = 重装重启；收敛机制另议）∥ **盒镜像内容治理**（内容 = 部署面）。
- **入站/端口转发** ∥ **盒间通信**（每工作区独立网络——跨工作区互不可达）。
- **IPv6**（v1 只 IPv4——docker IPv6 关为前置，`RUNNER.md` §7）。
- **项目权限面**（#1216②——接口已留：§4/§9 同守卫点）∥ **多租户** ∥ **per-workspace 独立额度池**（复用成员配额——如需另议）。
- **成员写面**（成员对自己的工作区做启动/停止/销毁/轮换——随 #1216 ② 权限模型；本批只落读面 + 待批提示——§8 成员面）。
- **指令重派中的幂等/非幂等细则**（重派上限/退避等——按 §3 常量落地即可；如需可调 ⇒ 另议）。

## 变更记录

- 2026-10-10（**server-exec-sandbox 批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-10-server-exec-sandbox.md` §1 · 台账 #1224；需求 §5 沙盒块 + 用户 14:00 两平面裁定）：建档——两平面形态 ∥ v11 七表 ∥ runner 注册/通道/最小权限 ∥ 放置与牲口语义 ∥ 出站规则单源（两类/两闸/通配/即生效）∥ 待批队列 ∥ 工作区凭据 ∥ 控制台六面（必交面） ∥ 探针套件 P1–P14 ∥ 用例表（N40–N44 ∥ B35–B40 ∥ E29–E33） ∥ 决策 KD-SV-63…72 ∥ 未裁点 U1–U5 + 披露 D1–D4（U1–U5 已于 2026-10-10 14:23 裁定——见 §10）。**产品码零触（设计轮）**。
- 2026-10-10（**server-exec-sandbox 批 · 裁定收正 · eng-designer**——用户 14:23「都按建议」；承批档 `docs/batches/2026-10-10-server-exec-sandbox.md` §1 · 14:23 裁定节）：§10 收正为「已裁决策」（U1–U5 逐行裁定值）∥ §4/§5/§8 三处标签同拍 ∥ D1–D4 保持（用户未异议——按设计实施）。**产品码零触**。
- 2026-10-10（**server-exec-sandbox 批 · 裁定收正 · eng-designer**——用户 14:24 裁定「thincoder server启动应该是不依赖沙盒的」）：§1 补「server 启动与运行零依赖沙盒/runner」句 ∥ §1/§14 可用性门显式限定「仅沙盒功能面不可用」。机制句零改。**产品码零触**。
- 2026-10-10（**server-exec-sandbox 批 · 设计评审轮 1 修正（fix 轮）· eng-designer**——承批档 `docs/batches/2026-10-10-server-exec-sandbox.md` §3 轮次 1 十五发现之 1–14 + 用户当日并入 A 节）：#1 每工作区资源档落机制（`limits_json` ∥ PATCH 写端点 ∥ 取值序 ∥ create 载荷 ∥ N45）∥ #2 默认单单源收正（= `sandbox_rules` 种子行；settings 键撤——§2/§4/§8）∥ #3 冲突序限定「显式 deny 恒先」+ 种子 deny ≺ 显式 allow（§4/§10）∥ #4 轮换 = 卷保留的容器重建（P13 补新 key 半支 ∥ E31 随正）∥ #5 join token 落点 = 进程内存 + 重启作废（N40/E30 随拍）∥ #6 `requireRunner` 守卫落点钉定 + 预算行（session.mjs）∥ #8 AC-36 标记收正（已落需求档）∥ #10 指令悬挂回收（§3 + B41）∥ #13 P8 改结构判据（canary 真值不下行）。A 节 = A1 成员面（§8 成员面 + `#/me/sandbox`）/ A2 加入流程三件 / A3 牵连计数随正（档目 33 ∥ 34）。**零新语义**（评审发现直接导出项 + 用户直令）。
- 2026-10-10（**server-exec-sandbox 批 · checkpoint 通路口径 fix 轮 · eng-designer**——2026-10-10 裁定落档）：§5 上送句补通路口径（octet-stream ∥ 路由级 200 MiB ∥ 流式落盘——`gateway/API.md` §2.6）；§13 B40 保持（未触——与路由上限同值）。**产品码零触**。
