# Thincoder Server · 沙盒（sandbox/SANDBOX）

> 板块 = server ∥ 本域 = sandbox（服务端执行沙盒）；本档 = 域档（控制面 + 执行面口径）。
> 需求单源 = `docs/server/requirements/PROJECT.md` §5 沙盒块（#1215 前置硬题）；**控制面/执行面分离 = 用户 2026-10-10 14:00 裁定**（原话：「沙盒可不可以不运行在thincoder-server本机？我们可以考虑外挂几台机器跑沙盒，否则一个节点把服务器干死了就都死了。」）。
> **执行面 = runner（远程 Docker API 节点）**：控制面直调 Docker API ∥ 主机侧强制走 SSH ∥ 集群化 = 用 Docker 自己的集群 ∥ 机器上不驻留我们的进程——用户 2026-10-10 19:52–19:56 定。
> 端点表 = `gateway/API.md` §2.5/§2.7（单源）；表结构全文 = `store/STORE.md` §2 v11–v13 段。
> 建档：2026-10-10（批 `docs/batches/2026-10-10-server-exec-sandbox.md` 设计轮 · eng-designer · 台账 #1224）；执行面随正（批 `docs/batches/2026-10-10-runner-admin-console.md` · 台账 #1252）。

## 1. 形态与两平面

- **一句话**：沙盒 = 容器强制的代码执行隔离件——**盒**（每工作区一个容器）跑在**执行面（runner）**的机器上，由**控制面（server）**编排治理；**server 本机不跑盒**。
- **控制面**（本档）= server 的 sandbox 域：节点登记 ∥ 编排 ∥ 出站规则单源 ∥ 待批队列 ∥ 每工作区凭据 ∥ 审计 ∥ 控制台。
- **执行面 = runner（远程 Docker API 节点）**：控制面**直调 Docker API** 建/起/停/拆盒；**主机侧强制走 SSH**（出站闸 ∥ 卷的磁盘限额）；**机器上不驻留我们的进程**；集群化 = **用 Docker 自己的集群**（Swarm）；**盒级超时/快照 = 控制端（server）自己的定时器（余面批——节点存活 = 读时探活，非定时器面：§14 KD-SV-80）**——用户 2026-10-10 19:52–19:56 定。
- **为什么分离**：单机把盒与 server 放一起 ⇒ 一台机器被盒压死即全死（用户 14:00 原话）；分离后盒的资源耗尽只影响所在节点，server 常驻面不受累。
- **容器唯一形态**（用户 13:43「容器是必须，不要考虑什么退路」）：**无可用节点 ⇒ 仅沙盒功能面不可用**（控制台明示——不降级）。
- **server 启动与运行零依赖沙盒/runner**（用户 14:24 裁定——原话「thincoder server启动应该是不依赖沙盒的，runner应该也只是相关功能不可用。」）：不因缺可用节点 ∥ 沙盒未配置而拒启或降级；缺 ⇒ **仅沙盒功能面不可用**（503 `sandbox_unavailable` + 控制台明示）；网关 ∥ 记账 ∥ 控制台其余页 ∥ 客户面零影响。
- **非目标**（需求块明写）：内核 0day ∥ 侧信道 ∥ 国家级逃逸。

## 2. 对象模型与存储（v11–v13 ∥ v15）

新表（v11 段建表 ∥ v12 重建 runners ∥ v13 增托管接入表 ∥ **v15 增镜像源表——本批**——DDL 全文 = `store/STORE.md` §2 对应段；`db.mjs` 已落盘 **458**——2026-10-11 本批现读）：

| 表 | 内容 | 关键列 |
|---|---|---|
| `sandbox_runners` | 登记的节点 | id ∥ name ∥ address（Docker API 地址）∥ status（active/disabled）∥ runtime_json（连通自检读数）∥ created_at |
| `sandbox_workspaces` | 工作区登记 | id ∥ name ∥ owner_member_id ∥ key_id ∥ key_plain ∥ runner_id（绑定节点）∥ limits_json（每工作区覆写——下条）∥ created_at |
| `sandbox_rules` | 出站规则（单源） | id ∥ kind（cidr/domain）∥ action（allow/deny）∥ target ∥ port ∥ protocol ∥ priority ∥ note ∥ source（default/admin/approval）∥ created_at ∥ created_by |
| `sandbox_pending` | 待批记录（史） | id ∥ runner_id ∥ workspace_id ∥ host ∥ hits ∥ first_seen_at ∥ last_seen_at ∥ status ∥ resolved_at |
| `sandbox_tasks` | 指令队列 | id ∥ runner_id ∥ kind ∥ payload_json ∥ status（queued/done/failed/unsupported）∥ created_at ∥ finished_at ∥ result_json |
| `sandbox_checkpoints` | WIP 快照登记 | id ∥ workspace_id ∥ created_at ∥ size ∥ blob_path ∥ note |
| `sandbox_settings` | 设置（键值——全局默认） | k ∥ v——**键全集与值形 = `gateway/API.md` §2.5（单源）**；「默认单」**不在本表**（= `sandbox_rules` 种子行——§4） |
| `sandbox_onboarding` | 托管接入任务 + 凭据（v13——§3） | id ∥ host ∥ ssh_port ∥ ssh_user ∥ auth_kind ∥ secret_cipher ∥ sudo_cipher ∥ credential_mode ∥ credential_state ∥ name ∥ model ∥ status ∥ step ∥ steps_json ∥ runner_id ∥ created_by ∥ created_at ∥ finished_at（DDL 全文 = `store/STORE.md` §2 v13 段） |
| `image_sources` | 远程镜像源清单（控制台维护——**server 全局**，非按节点） | id ∥ name ∥ address（名 ∥ 址**各自唯一**）∥ created_at ∥ created_by（DDL 全文 = `store/STORE.md` §2 v15 段） |

- **审计**：`audit_events.type` CHECK 重建（v11——沿 v10 表重建先例 `db.mjs:171-192`）——**十型 ⇒ 十二型**（+ `sandbox_rule`（规则增删——detail.action + 规则原文）
  ∥ `sandbox_event`（审批三态/超时 ∥ 盒起停拆 ∥ 节点添加/删除（含连通自检失败行） ∥ 快照——detail.kind）；型面单源 = `accounts/audit.mjs`（已落盘 109 行））。
  **托管接入增补（v13 批）**：`sandbox_event` 增五 kind（`onboarding_start` ∥ `onboarding_exec` ∥ `onboarding_done` ∥ `onboarding_failed` ∥ `onboarding_credential_revoke`；kind 非枚举——CHECK 零动——`accounts/ACCOUNTS.md` §2.1）。
  **镜像源增补（本批）**：`sandbox_event` 增三 kind（`image_source_add` ∥ `image_source_update` ∥ `image_source_delete`——detail 键集 = `accounts/ACCOUNTS.md` §2.1；kind 非枚举——CHECK 零动）。
- **修订号（rulesRev）**：规则/设置变更 ⇒ 全局单调 +1。
- **明文落库**：`sandbox_workspaces.key_plain`（工作区 key 明文——盒每次重建须再注入；先例 = provider key 明文（KD-SV-19）；披露 = §10-D2）。
- **每工作区资源档（覆写）**：`sandbox_workspaces.limits_json`（JSON 对象——键 = `cpus` ∥ `memMb` ∥ `pids` ∥ `diskMb` ∥ `idleTtlMinutes` ∥ `wallclockTtlHours`；缺键 = 随全局默认）；写端点 = PATCH（§9 ∥ `gateway/API.md` §2.5）；**取值序 = 全局默认（`sandbox_settings`）⇒ 逐键叠加工作区覆写（覆写优先）**。
  解析结果 = 建盒/重建时的容器参数（控制面直调 Docker API——§1）；生效 = 下次建盒/重建（运行中盒零触——容器旗不可热改）。
- **容器不落表**（runner-admin-console 批）：容器 = 节点上的 Docker 容器——**Docker 引擎即真源**（读时读 ∥ 动作直调；控制面零镜像 ∥ 零同步机制——§14 KD-SV-79）。

## 3. 节点与容器（最小切片——runner-admin-console 批）

> **本批射程（用户 2026-10-10 19:59 令）**：① 添加节点（登记一台 Docker API 节点）② 创建容器 ③ 启动 ∥ 停止容器 ④ 删除节点（+ 容器删除——提议④）。**其余全部不做**（一行带过：出站闸 ∥ 磁盘限额 ∥ 探针 ∥ 心跳/放置 ∥ Swarm ∥ 快照 ∥ 待批 ∥ 镜像管理 ∥ 工作区↔容器映射 ∥ 卷删除 ∥ 限额/端口/网络 ∥ TLS——§15）。**射程增补（用户 2026-10-10 22:19–22:29）**：托管接入（管理面 agent 执行）——见本 §「托管接入」块。
> **连线口径**：地址 = `http://<host>:<port>`（登记输入归一：缺协议补 `http://`、缺端口补 `2375`；`https:` 拒）；
> **调用恒带版本前缀**（**前缀形 = `v<协商版本>`**——如协商 `1.44` ⇒ 路径 `/v1.44/…`；2026-10-11 真机核：`/1.44/…` = 404 ∥ `/v1.44/…` = 200）；登记时协商 = `max(1.44, MinAPIVersion)`，须 ≤ `ApiVersion`，否则拒登记——提议⑤；**引导步 = 先取无前缀版本读数、再定前缀**——见下）；读类超时 3s ∥ 动作类 15s（常量；测试可注入 `fetchImpl`）。
> **读时探活（非心跳）**：运行面/列表读数 = 请求内现打（并发；无后台定时器 ∥ 无心跳机制——§14 KD-SV-80）。

- **添加节点**（`POST /api/admin/sandbox/runners`——提议①）：入参 `{ name, address }`（名 ≤ 40 字符；地址归一形如上）。
  **连通自检**（引导步 → 协商 → 复读）：① 无前缀 `GET <base>/version` 先取版本读数 ⇒ ② 协商 `ver = max(1.44, MinAPIVersion)` 须 ≤ `ApiVersion`（否则拒）⇒
  ③ `GET <base>/v<ver>/version` 复读全量 `{ Version, ApiVersion, MinAPIVersion, Os, Arch }` ⇒ 通过 ⇒ 落 `sandbox_runners` 行（`status='active'`；`runtime_json` = 自检读数）+ 审计行 `sandbox_event`（`kind=runner_add`）。
  失败（不可达 ∥ 超时 ∥ 非 Docker API 响应 ∥ 版本不兼容）⇒ **502 `upstream_error`** + 逐句人话 + **零落库** + 审计行（`runner_selfcheck_failed`）；重名 ∥ 地址形非法 ⇒ 400。
  **节点侧前置**：节点机 Docker 引擎须监听 TCP（测试机 = `dockerd -H fd:// -H tcp://0.0.0.0:2375` systemd override；前置步已落文——`docs/TEST-ENV-ECS.md` §7「节点接线链」，2026-10-10）；TLS 不做（内网——提议①）。
- **运行面读数**（`GET /api/admin/sandbox/overview`）：每节点现打 `GET <base>/v<ver>/info`（3s ∥ 并发）⇒ 行 = `{ id, name, address, status, online, version, containers: { total, running } ∥ null, selfCheck, createdAt }`（`online=false` ⇒ `version`/`containers` = `null`——离线读数不外推）。
  `status = available ⇔ 至少一个节点在线`（无节点 ⇒ unavailable「无节点注册」；全离线 ⇒ unavailable「节点全部不可达」）；**节点面（添加/删除）恒可用**（不随门禁）。
  写门（`requireSandboxAvailable`——需节点的写路径（工作区创建/动作；规则 ∥ 设置 ∥ 待批裁定不设门）= 静态判据（存在 `active` 节点）；本批零改——实时门统一随重做批）。
- **创建容器**（`POST …/runners/:id/containers`——提议②）：入参 `{ name, image, volume? }`（名 = Docker 容器名形；镜像 = 控制台预填设置 `image` 值（现缺省 `thincoder-sandbox:1`）；卷 = Docker 卷名，空 = 不挂）。
  ⇒ `POST <base>/v<ver>/containers/create?name=<名>`（体 = `{ Image, HostConfig: { Binds: ["<卷>:/workspace"] } }`；卷缺 ⇒ 省略 `HostConfig`）⇒ 201 ⇒ `{ container: { id, name, image, state: "created" } }` + 审计行（`container_create`）。
  引擎 404（无此镜像）∥ 409（名占用）⇒ 400（含引擎原文）；不可达 ⇒ 502。**创建 ≠ 启动**（两动作分列——用户四项逐条）。
- **容器读取与动作**：列表 = `GET …/containers`（读时读 `GET <base>/v<ver>/containers/json?all=1` ⇒ `{ containers: [{ id, name, image, state, status }] }`——名去前导 `/`）。
  **启动** ∥ **停止** = `POST …/containers/:containerId/{start,stop}`（204 ⇒ 200；**304（已启/已停）⇒ 幂等成功**；`t` 不带 = 引擎缺省 10s）∥ **删除** = `DELETE …/containers/:containerId`（`?force=1`——运行中强停强删；**卷不随删**）。
  动作各落审计行（`container_start` ∥ `container_stop` ∥ `container_delete`）；引擎无此容器 ⇒ 404 `not_found`；余 ⇒ 502。
- **删除节点**（`DELETE …/runners/:id`——提议③）：先读承载容器 ⇒ 有容器未给处置 ⇒ 400（「请选保留 ∥ 连删」）∥ `containers:"keep"` ⇒ 只删登记（容器原样留机）∥ `"remove"` ⇒ 逐个强删 ⇒ 全成 ⇒ 删行；**任一失败 ⇒ 502 + 登记行保留**（消息携失败清单）；无容器 ⇒ 直接删行。
  **节点不可达 ⇒ 仅 keep 可过**（连删 ⇒ 502）。**有承载工作区 ⇒ `confirm: true`**（现行为保留——工作区面本批零改）；不存在 ⇒ 404；审计行（`runner_delete`；detail 携 kept/removed）。**删登记 ≠ 动机器**（节点机 ⧺ 容器 ⧺ 卷均原样）。
- **本批提议与自加项**（用户今日三令：自加项必须带理由、禁冒充用户口径——逐条）：

| # | 项 | 来源 | 为什么 | 不做的代价 |
|---|---|---|---|---|
| ① | 连接形 = 直连 Docker API（地址 + 端口；内网；**不做 TLS**） | 父侧提议 | 最小切片——证书面（签发/续期/信任链/节点配置）大于本切片本身；内网 | 不做 TLS 本身的代价明示：2375 明文 = 无鉴权的 root 等价口暴露于网内（限内网；网不可信 ⇒ 必先上 TLS = 另批）；不采纳（先上 TLS）⇒ 切片推不动 |
| ② | 建容器最小形 = 名称 + 镜像 + 卷 三件 | 父侧提议 | 最小可跑（镜像 = 容器之锚；卷 = 数据落点、工作区卷前身）；镜像用现成盒镜像 | 按完整盒参数集（read-only ∥ cap-drop ∥ 每工作区网络 ∥ 限额）⇒ 工作量与设计面远超本切片（用户明令先不上） |
| ③ | 删节点有容器 ⇒ 二选一「保留 ∥ 连删」 | 父侧提议 | 删节点两义（换机 = 容器还想要 ∥ 退役 = 机器要清）——裁量交用户 | 直接删行不动容器 ⇒ 以为删净、机器上留孤儿容器；无问连删 ⇒ 误删运行中容器 = 事故 |
| ④ | 容器删除 = 独立动作（不只随节点连删） | 设计自加 | 「连删」能力已在本切片（节点删除径）；独立成钮 = 生命周期闭环（建了能删） | 仅节点级连删 ⇒ 单个容器删不掉——只能删整个节点，明显别扭 |
| ⑤ | 调用恒带 API 版本前缀（登记时协商） | 设计自加 | 官方文档明示**无版本前缀调用已废弃**（将来移除）；固定档不协商 ⇒ 未来 daemon 抬底即坏 | 裸无前缀 ⇒ 随官方移除一起坏；固定 1.44 —— Docker 29（最低 1.44）恰贴底无余量 |
| ⑥ | 容器动作落审计行（`container_*`） | 设计自加 | 用户既有「过程留痕」口径 + 审计型已备（`sandbox_event`）；一行成本 | 谁建/停了哪个容器无据（排障面） |
| ⑦ | 凭据默认用完即弃（可勾「保留」） | 父侧提议 | 信任最小化（server 不长期持 runner 机入口——#1236 信任面已披露） | 默认保留 ⇒ server 长期持跳板凭据；后续主机侧运维（出站闸批）重填一次 = 代价（如实） |
| ⑧ | 主机指纹 TOFU（首见记录 + 变更停机报告 + 「重新信任」重试） | 父侧提议 | 内网 + 牲口语义（换机/重装换指纹——硬拒须人工疏）；首见记录 = 变更可见 | 不验指纹 ⇒ 网内中间人无感；一切变更硬拒 ⇒ 重装后必人工救 |
| ⑨ | 任务预算（20 分钟 ∥ 60 调用——超限停） | 父侧提议 | 无人值守 LLM 环须有保险丝（时间/花费两面） | 无预算 ⇒ 跑飞烧 token/占线无界 |
| ⑩ | 模型 = 提交时选择（下拉） | 父侧提议 | 显式零隐藏（KD-SV-87）；零新配置面 | 无选择面 ⇒ 不可跑或静默固定（任意） |
| ⑪ | sudo 口令字段（可选——缺省先试免密） | 父侧提议 | 现实（测试机 sudo 需密码——`TEST-ENV-ECS.md` §7）；缺此字段 = 装不动 | 不设 ⇒ 需密码机必败（手工面摩擦） |
| ⑫ | 重启恢复 = `interrupted` + 按模式处置凭据 | 父侧提议 | server 重启/容器重建真会发生（部署链重建容器） | 不处置 ⇒ run 悬挂 + 凭据滞留（「弃」语义破） |
| ⑬ | 「重新信任并重试」入口（指纹变更后） | 父侧提议 | 换机/重装常态（牲口）；免人工翻文件 | 无入口 ⇒ 换机后卡在失败态 |

- **托管接入（本批增补——用户 2026-10-10 22:19–22:29）**：需求 §5「接入两径」①——管理员在控制台只给**主机地址 + 登录方式**（SSH——密钥优选 ∥ 密码亦可），其余全由 **server 端 agent** 做（探明主机实况 → 决定并执行必要操作 → 验证 → 报告——用户 15:00 裁；非固定脚本）；管理员只见三态：**正在装机 ∥ 已就绪 ∥ 失败原因**。agent 机制全文 = `agent/ADMIN-AGENT.md`（工具面五件 ∥ 无人值守裁剪 ∥ 自主边界——**失败处置 = 其 §4**）。

  **步骤表**（步 → 前置检查 → 动作 → 成功判据（可复读读数）→ 失败报告；表 = 期望骨架——agent 按目标机实况定形，KD-SV-83）：

  | # | 步 | 前置检查 | 动作（例——按实况定形） | 成功判据（读数） | 失败报告（停在哪里） |
  |---|---|---|---|---|---|
  | S1 | 受理 | admin 会话 + 表单形合法 | 落 run 行（`running`）+ 凭据入密 + 审计 `onboarding_start` | 运行面「装机中」行可见（run id） | 400 逐字段人话；零落库零动作 |
  | S2 | 登录与探明 | run 在途 | SSH 登录 + 探明脚本（密钥径 = `ssh -i <keyfile> -o BatchMode=yes -o ConnectTimeout=10 -o StrictHostKeyChecking=accept-new user@host -- <脚本>`；**口令径 = `sshpass -e` 形（不带 `BatchMode`——带了直接弃用口令面；`NumberOfPasswordPrompts=1` + `PreferredAuthentications=password` ∥ `PubkeyAuthentication=no`；真机 A/B 核实 2026-10-11——KD-SV-85）**）——读数十项（见下） | exit 0 + 读数十项全列（命令原文/读数入 run 详情——可复读） | 「无法登录：<一句人话>」（认证被拒 ∥ 不可达/超时 ∥ 非 Linux）；宿主零变 |
  | S3 | 定策（无动作） | S2 读数 | 判路径：装运行时（选包管理器/装法）∥ 仅开监听 ∥ 直登；不合前提 ⇒ 停 | 决定句 + 依据读数入 run 详情 | 前提不满足（非 Linux ∥ 无 cgroup v2 ∥ 磁盘不足 ∥ sudo 不可用）⇒ 停下 + 逐句建议 |
  | S4 | 装容器运行时（缺时才走） | S3 判「缺」 | 按实况装（例：Ubuntu ⇒ `sudo apt-get install -y docker.io`；瞬态失败重试 ≤1） | `docker version` 服务端在场 ∥ `systemctl is-active docker` = active（读数记录） | 「安装失败（退出码）：<原文尾>」；**不回滚**（机器现状为准） |
  | S5 | 开 API 监听（未监听时才走） | S3 判「缺监听」+ sudo 可用 | 写 systemd drop-in（`-H tcp://0.0.0.0:2375`）⇒ `daemon-reload` + `restart docker`（既有容器短暂中断——表单预告知） | `systemctl is-active` = active ∧ 本机 `:2375/version` 200（无前缀引导形——实现探活形；两形皆 200，真机核实） | 守护进程未回 ⇒ **撤 drop-in + 复位尝试**再停；撤也败 ⇒ 报警级报告（逐条现状） |
  | S6 | 接 API + 登记 | S4/S5 完成（或本就具备） | 自检 `GET http://<host>:2375/v<ver>/version`（协商 `max(1.44, MinAPIVersion)` ≤ `ApiVersion`）⇒ 落行 + 审计 `runner_add` | 自检读数逐值 ∥ 运行面在列 `online=true` | 「server → 主机 :2375 不可达（安全组/防火墙面）」∥ 版本不兼容 ∥ 重名——零落库 |
  | S7 | 自检与就绪 | 登记在列 | 复读运行面（online ∥ version ∥ 容器 0/0） | 控制台「已就绪」；读数可复读 | 探活失败 ⇒「已登记但当前不可达」+ 原因 |
  | S8 | 收尾与报告 | —— | 终态行 + 审计（`onboarding_done`/`onboarding_failed`）；凭据按模式处置 | 终态可见（已就绪 ∥ 失败原因 + 步读数） | —— |

  **两径覆盖**：裸机 = S1→S2→S3→S4→S5→S6→S7→S8 ∥ 已装 Docker + 已监听 = S1→S2→S3→S6→S7→S8 ∥ 已装未监听 = S1→S2→S3→S5→S6→S7→S8。
  **探明读数十项（S2）**：① OS/发行版 ② 内核/架构 ③ cgroup v2 ④ 内存/磁盘余量 ⑤ systemd ⑥ sudo 可用形 ⑦ Docker 在场与版本（含 API 版本） ⑧ dockerd 监听形（`:2375` 在场与否） ⑨ 包管理器 ⑩ 出网/DNS（取包源可达）。
  **凭据纪律（定形——需求五件照此落）**：**存哪** = server 库（`sandbox_onboarding`——v13）；**加密** = AES-256-GCM（`node:crypto`；密钥 32 字节随机——首用生成落 `data/credentials.key`（0600）；
  **如实披露**：密钥与密文同机——防库拷贝/备份单文件泄漏，不防整机沦陷（外部 KMS = 另立级，不做））；**专用低权账号** = 表单/文档引导（仅安装所需 sudo）；**不硬性校验**（无围栏——15:02 口径；报告如实注明所用账号与是否 root）；
  **可撤销** = 控制台清密列 + 审计（只及 server 侧存留——目标机账号须到机处置）；**每步审计** = 五 kind（起 ∥ `onboarding_exec`（每命令/调用：原文 ∥ 退出码 ∥ 摘要）∥ 成 ∥ 败 ∥ 撤；秘密**掩蔽后才入审计/日志**）；
  **用完即弃** = 提交时二选一——**用完即弃（默认）**：终态即零化（含中断收尾）∥ **保留**：密文留库（供后续主机侧运维——出站闸/限额批；可随时撤销）。
  **网络路径与凭据放置（硬点① 答案）**：server（容器内）→ 目标机 = **出向** TCP（无入向端口——沿需求「server 仍无需任何入向端口」）；两条腿 = `:22`（SSH——传输 = 容器内系统 openssh，KD-SV-85）∥ `:2375`（Docker API——控制面直调，与手工径同路）。
  凭据放置 = 密钥文件写 `data/.ssh/`（0600，随任务清理）∥ 密码经进程环境 `SSHPASS`（`sshpass -e`——不入 argv/ps）∥ sudo 口令经 stdin（`sudo -S`）。镜像侧 = `Dockerfile` 加装 `openssh-client` + `sshpass`（node:24-slim 基座不含——实施轮实读复核）。
  **宿主前提（npm/裸机路——部署面注）**：server 宿主须装 `sshpass`（缺 ⇒ 密码认证必败）——S2 先检本机 `sshpass`（密码形），缺 ⇒ 停 + 报因「宿主缺 `sshpass`——密码认证不可用」（检查并报；`ops/OPS.md` §5.10）。
  **run 态与端点**：run 行（库）+ 读时轮询（无后台常驻；重启 ⇒ `interrupted` + 按模式处置凭据——KD-SV-86）；端点四条 = `gateway/API.md` §2.5「托管接入」行；控制台 = `webui/WEBUI.md` §2.8① ∥ 本档 §8①。
- **手工登记径**（需求 §5 ②——硬化环境用）**保留**（用户 14:59 裁）：即上「添加节点」直填 Docker API 地址。
- **容器面补齐 + 镜像族（本批——sandbox-docker-admin；台账 #1265；用户 2026-10-11 04:36/04:39）**：控制台把节点机上的容器与镜像管全——两族八端点；**沿 KD-SV-79（引擎即真源：读时读 ∥ 动作直调 ∥ 零落库零缓存）**；端点行文 = `gateway/API.md` §2.5；UI 落点 = `webui/WEBUI.md` §2.8①；审计 kind 单源 = `accounts/ACCOUNTS.md` §2.1（型面计数零增——十三型不变）。
  **容器面五件**（在既有 列表/建/启/停/删 之上）：
  - **详情**（`GET …/containers/:containerId`）：`GET <base>/v<ver>/containers/{id}/json`（读类 3s）⇒ `{ container: { id, name, image, state, status, created, startedAt, finishedAt, restartCount, command: { entrypoint, cmd }, env, mounts, ports } }`
    ——挂载 = `Mounts[]`（type/source/destination/mode/rw）∥ 端口 = `NetworkSettings.Ports` 展开（`{ port, hostIp, hostPort }`——未映射 ⇒ hostIp/hostPort = null）∥ 环境 = `Config.Env` 原文 ∥ 命令 = `Config.Entrypoint`/`Config.Cmd`；**零审计**（读动作）。
  - **日志**（`GET …/containers/:containerId/logs?tail=N`）：`GET <base>/v<ver>/containers/{id}/logs?stdout=1&stderr=1&tail=<N>`（读类 3s）⇒ `{ logs, truncated, tail }`
    ——**tail 有界**（缺省 200，范围 1–2000；越界/非数 ⇒ 400）；**非 TTY 容器 = 8 字节帧头多路复用流 ⇒ 解复用后输出**（判据 = 首字节 ∈ {0,1,2} ∧ 1–3 字节零 ∧ 帧长 ≤ 余量；判不出 ⇒ 原样透传——TTY 容器）；文本截断 256 KiB（截断 ⇒ `truncated: true` + 尾句标记）；**零审计**（读动作）。
  - **重启**（`POST …/containers/:containerId/restart`）：`POST <base>/v<ver>/containers/{id}/restart`（动作类 15s；`t` 不带 = 引擎缺省 10s）——204 ⇒ 200；404 ⇒ 404 `not_found`；余 ⇒ 502；审计 `container_restart`。
  - **强杀**（`POST …/containers/:containerId/kill`）：`POST <base>/v<ver>/containers/{id}/kill`（SIGKILL——信号可选不做）——204 ⇒ 200；**引擎 409（未运行）⇒ 400 人话**（「容器未在运行——无需强杀」——≠ stop 的 304 幂等语义）；404 ⇒ 404；余 ⇒ 502；审计 `container_kill`。
  - **用量**（`GET …/containers/:containerId/stats`）：并发两读——`GET <base>/v<ver>/containers/{id}/stats?stream=false&one-shot=true`（CPU/内存）+ `GET …/containers/{id}/json?size=1`（磁盘）⇒ `{ usage: { cpuPercent, memUsed, memLimit, diskRw, diskRoot, sampledAt } }`
    ——`cpuPercent` = `cpuΔ/systemΔ × 在线 CPU 数 × 100`（一次采样基线不足 ⇒ null——如实）；磁盘 = `SizeRw`（可写层）∥ `SizeRootFs`；**零审计**（读动作）。
  **镜像族三件**（按节点）：
  - **列表**（`GET …/images`）：`GET <base>/v<ver>/images/json`（读类 3s）⇒ `{ images: [{ id, tags, size, created }] }`（`RepoTags` 缺/null ⇒ `[]`——UI 呈「无标签」）；零审计。
  - **拉取**（`POST …/images/pull`）：入参 `{ image }`（形 = `名[:标签]`——标签 = 末个 `/` 之后的末个 `:` 起；缺省 `latest`；含 `@`（digest 形）⇒ 400 人话）⇒ `POST <base>/v<ver>/images/create?fromImage=<名>&tag=<标签>`（**超时 10 分钟**——沿 agent 工具面同值；同步请求）⇒ 200 ⇒ `{ ok: true, image, tag }`；
    **失败两形皆收**：引擎非 2xx ⇒ 400（携引擎原文）∥ 200 流内 `error`/`errorDetail` ⇒ 400（携引擎原文）；不可达/超时 ⇒ 502；审计 `image_pull`。
  - **删除**（`DELETE …/images`）：入参 `{ ref, force? }`（`ref` = 镜像 id 或 `名:标签`——字符集 `[A-Za-z0-9][A-Za-z0-9._:/@-]*`（禁空白/`?`/`#`/`%`）；缺/空/形非法 ⇒ 400；**走请求体**——镜像引用字符集含 `/`/`:`，路径段路由不兼容——沿 `DELETE /runners/:id` 体参先例）
    ⇒ `DELETE <base>/v<ver>/images/<ref>?force=<0|1>`（缺省 force=0）⇒ 200 ⇒ `{ ok: true, ref }`；引擎 404（无此镜像）⇒ 404 `not_found`；**409（被容器引用/多标签）⇒ 400 人话**（携引擎原文 + 处置句）；余 ⇒ 502；审计 `image_delete`（detail 键集 = `accounts/ACCOUNTS.md` §2.1）。
  **本批自加项（逐条带理由）**：

  | # | 项 | 来源 | 为什么 | 不做的代价 |
  |---|---|---|---|---|
  | ① | 日志 tail 有界（缺省 200 ∥ 1–2000）+ 文本截断 256 KiB | 设计自加 | 读类 3s ∥ 连接不悬停；日志体量无界 | 整取 ⇒ 大日志拖死连接/界面冻结 |
  | ② | 非 TTY 多路复用流解复用 | 设计自加 | 创建面不设 Tty ⇒ 引擎返回 8 字节帧头流；不解 ⇒ 输出带二进制帧头残渣 | 不解复用 ⇒ 日志窗乱码 |
  | ③ | 拉取专用超时 10 分钟 + 失败两形皆收（非 2xx ∥ 流内 error） | 设计自加（沿 agent 工具面同值） | 取像耗时可分钟级；引擎错误可能藏流内——两形皆收 = 不对引擎行为下注 | 15s ⇒ 正常拉取必超时；不扫流 ⇒ 失败被当成功 |
  | ④ | 镜像删除 `ref` 走请求体 + `force` 缺省 false（UI 勾选才强删） | 设计自加 | 引用字符集含 `/`/`:` ⇒ 路径段不兼容；强删爆炸半径更大（删他物所依） | 路径参数 ⇒ 带斜杠引用不可达；缺省强删 ⇒ 误删面扩大 |
  | ⑤ | 强杀 409 ⇒ 400（非幂等成功） | 设计自加 | stop 的 304 是引擎给的幂等语义；kill 无此语义——如实报（未运行 = 无事可杀） | 假装成功 ⇒ 读数骗人 |
  | ⑥ | 用量 = 一次采样（`one-shot`）+ 磁盘 = inspect `size=1` | 设计自加 | 不加采样器/时序库（新机制——KD-SV-92）；读数如实（基线不足 ⇒ null） | 自建采集面 ⇒ 新机制（本批不做） |

- **镜像源族（本批——sandbox-image-sources；台账 #1274；用户 2026-10-11 09:17 四点 + 09:19 预选）**：控制台管**远程镜像源清单**（增/删/改/列 + 常用源预选）∥ 对可达源列镜像目录（仓库 ∥ 标签）∥ 关键词过滤（本地镜像表 ∥ 源目录清单）。
  **拉取行为零改**（仍由节点引擎拉取——源不写节点 dockerd 配置 ∥ 不注入镜像前缀 ∥ 无默认源）；端点七条 = `gateway/API.md` §2.5（镜像源七行）；存储 = `image_sources`（v15——`store/STORE.md` §2 v15 段）；
  UI 落点 = `webui/WEBUI.md` §2.8①；审计 kind 单源 = `accounts/ACCOUNTS.md` §2.1（型面计数零增——十三型不变）。
  **源清单（四端点 + 预选一）**：
  - **列**（`GET /api/admin/sandbox/image-sources`）：`{ sources: [{ id, name, address, kind, createdAt }] }`；`kind` = **按地址派生**（`hub` ⇔ 主机 ∈ Hub 四别名（`docker.io` ∥ `index.docker.io` ∥ `registry-1.docker.io` ∥ `hub.docker.com`）；余 ⇒ `v2`）——派生不入库（单源 = `address`，零漂移）；零审计（读动作）。
  - **增**（`POST …/image-sources`）∥ **改**（`PATCH …/image-sources/:id`）∥ **删**（`DELETE …/image-sources/:id`）：增/改入参 `{ name, address }`（改 = 键级——出现键 = 应用）；
    ⇒ 200 `{ source }`（删 ⇒ `{ ok: true }`）+ 审计行（`image_source_add` ∥ `image_source_update` ∥ `image_source_delete`——detail 键集 = `accounts/ACCOUNTS.md` §2.1）；不存在 ⇒ 404；形非法/撞名/撞址 ⇒ 400（库零变）。
  - **形**：`name` = 非空（≤40 字符；首尾空白 trim）；`address` = `[http://|https://]主机[:端口]`（缺 scheme ⇒ 补 `https://`；**含路径/查询/空白 ⇒ 400**）；**名与址各自唯一**（撞 ⇒ 400 人话）。
  - **常用源预选**（用户 09:19）：静态表（server 端单源——沿 provider 预设先例 KD-SV-17）；`GET …/image-sources/presets` ⇒ `{ presets: [{ name, address }] }`；**表单只回填名 + 址两字段**（零隐藏语义）；
    清单六条（随设计轮维护——源站关停/换址频繁，需求 ① 原话口径）：Docker Hub（`docker.io`）∥ GitHub Container Registry（`ghcr.io`）∥ Quay（`quay.io`）
    ∥ 阿里云 ACR（`registry.cn-hangzhou.aliyuncs.com`）∥ 华为云 SWR（`swr.cn-north-4.myhuaweicloud.com`）∥ Docker Hub 镜像（DaoCloud——`docker.m.daocloud.io`）。
  **源目录读取（两端点——server 直连源）**：
  - **仓库目录**（`GET …/image-sources/:id/catalog`）∥ **标签清单**（`GET …/image-sources/:id/tags?name=<仓库>&n=<N>`）：读类预算 **10s**（跨公网——沿探活/发现家族；非节点面 3s）；**与节点零涉**（不查沙盒可用性门）。
  - **v2 面**：目录 = `GET <base>/v2/_catalog?n=<N>` ∥ 标签 = `GET <base>/v2/<name>/tags/list?n=<N>`；`name` 形 = 仓库名（小写字母数字 + `._-/` 分隔——形非法 ⇒ 400 **零外呼**；`..`/`?`/`#`/空白/大写 ⇒ 拒（防路径穿越））。
  - **Hub 面**（`kind=hub`）：目录 ⇒ **不支持**（`unsupported`——Hub 官方无全站目录 API，如实报）；标签 = `GET https://hub.docker.com/v2/repositories/<ns>/<repo>/tags?page_size=<min(N,100)>`（**API 主机 = `hub.docker.com`**，与登记址无关；该主机不可达 ⇒ 如实 `unreachable`）；**裸名补 `library/`**（`nginx` ⇒ `library/nginx`——Hub 命名空间惯例）。
  - **匿名 Bearer 挑战**（本机实测 2026-10-11：ghcr ∥ quay ∥ ECR Public ∥ ACR ∥ SWR 皆 401 + `WWW-Authenticate: Bearer`）：401 且挑战可解析 ⇒ 取 `realm?service=&scope=`
    （目录 = `registry:catalog:*` ∥ 标签 = `repository:<name>:pull`）⇒ 匿名换 token（响应键取 `token` ∥ `access_token`）⇒ **携 `Bearer` 复读一次**；**零凭据**（私有源 = 如实拒——本批零凭据面；§15）。
  - **有界**：`n` 缺省 200（范围 1–1000；越界/非数 ⇒ 400）；`truncated` = 远端还有下一页（v2 = `Link: …rel="next"`（实测在） ∥ Hub = `next` 非空）；**不翻页**（有界首页——§15）。
  - **读数形**（自含状态——沿 `/api/admin/proxy/test` 先例；远端事实分类不套统一信封）：成 ⇒ 200 `{ ok: true, kind, repositories ∥ tags, truncated, ms }`；
    败 ⇒ 200 `{ ok: false, error: { kind, message }, ms }`——`kind` ∈ `timeout` ∥ `unreachable` ∥ `auth_required` ∥ `unsupported` ∥ `bad_response`；**空列表非错误**（实测 quay 匿名目录回 `{"repositories":[]}`——如实呈空态）；零审计（读动作）。
  **控制台面**（UI 定形 = `webui/WEBUI.md` §2.8①）：镜像源卡（源表 + 增/改/删弹窗（含预选下拉）+ 目录浏览窗（仓库列表 ∥ 标签列表——两处过滤输入））+ 本地镜像表过滤输入（`views-sandbox-images.mjs`）。
  **本批自加项（逐条带理由——设计侧提议，非用户口径）**：

  | # | 项 | 来源 | 为什么 | 不做的代价 |
  |---|---|---|---|---|
  | ① | 匿名 Bearer 挑战换取（无凭据） | 设计侧提议 | 实测：公开源（ghcr ∥ quay ∥ ECR ∥ ACR ∥ SWR）目录与标签面**均**以 Bearer 挑战应答——不换取则预设清单多数源恒「需认证」 | 仅 Hub 面与匿名开放的自建源可用——② 名存实亡 |
  | ② | 源清单 = **server 全局**（非按节点） | 设计侧提议 | 目录读取发生在 server（server → 源）；按节点 = 清单 × 节点数且复制维护；拉取仍走节点（零耦合） | 同一源重复登记；「在哪个节点上浏览」反成负担 |
  | ③ | 目录/标签有界首页（`n` ≤1000 + `truncated`） | 设计自加 | 远端集合可无界（Hub 单镜像 1339 标签——父侧实测）；读类 10s 不悬停 | 整取 ⇒ 大源拖死连接/界面冻结 |
  | ④ | 目录浏览窗过滤 = 前端（零新端点） | 设计自加 | 已载集合上过滤 = 纯前端（沿审计/用量页过滤先例）；远端无过滤 API | 服务端过滤端点 ⇒ 伪能力（远端不参与），徒增面 |
  | ⑤ | 源目录「一键拉取」（预填拉取窗） | 设计侧提议——**本批不做**（§15；提请裁定） | 浏览 → 取用的自然收口（免手抄引用）；实现 ≈20 行（复用既有拉取窗） | 用户手抄 `<host>/<repo>:<tag>`（错抄 = 白拉一次） |

## 4. 出站规则（单源在本档）

- **两类同表**（需求块）：① **CIDR 规则**（网络层——安全组同形：`allow ∥ deny` × `CIDR` × 端口/协议；零域名依赖）；② **域名规则**（应用层）。**各自可单独使用**（只用 CIDR ∥ 两者并用）。
- **默认全拒**：无允许条目 ⇒ 全拒。
- **默认禁单**：`127.0.0.0/8` ∥ `169.254.0.0/16` = **内置恒拒**（非行——不可改；已裁 U2）∥ RFC1918（`10.0.0.0/8` ∥ `172.16.0.0/12` ∥ `192.168.0.0/16`） ∥ 服务器网段 ∥ 节点自身网段（登记时自动带入）= **种子 deny 行**（`source='default'`——可改可删）。**内网/固定 IP 后端 = 显式加 allow 条目**（零域名依赖——需求块原句；显式 allow 可开种子 deny——§10 U2）。
- **默认单**（开箱可用——**单源 = `sandbox_rules` 种子行**（`source='default'`——可改可删；初始化点 = v11 迁移段一次性写入——不复活）——已裁 U3 = 五条起步）：`registry.npmjs.org` ∥ `github.com` ∥ `*.githubusercontent.com` ∥ `gitee.com` ∥ `*.gitee.com`——装依赖/拉仓无需任何批准。
- **两闸次序**（域名路径——需求块）：域名命中 ⇒ 解析（取全地址）⇒ **每个解析 IP 仍过 CIDR 闸**（否则「白名单域名 + 内网解析」即绕过）。
- **冲突序**：**显式 deny 恒先于 allow**（同一目标两者皆中 ⇒ 拒）；**种子 deny（`source='default'`）≺ 显式 allow**（显式 allow 可开 RFC1918/服务器网段——U2 裁定）；`priority` = 同动作内排序（可读性 + 未来扩展）。
- **通配**（仅域名规则）：单层左通配 `*.example.com`（恰一级子域）；**禁**裸 `*` ∥ TLD 级（`*.com`）∥ 双通配 ∥ IP 段通配；写面校验（非法 ⇒ 400）；控制台通配条目带醒目标记；审计行记原文。
- **生效**：增删 ⇒ `rulesRev` +1 ⇒ **即生效 ∥ 不重建盒**（需求块）；下发与应用机制（主机侧强制走 SSH——§1）随重做批定形。
- **审计**：每次增删一行 `sandbox_rule`（type 单源 = §2）。
- **谁能改**：v1 = admin（会话 `requireAdmin`）；#1216② 权限面落地时在**同一守卫点**换判据（接口已留——§9）。

## 5. 工作区生命周期与节点绑定

- **绑定**：工作区 → 节点**绑定**（卷在节点本地盘——绑定即稳定）；多节点/集群化 = 用 Docker 自己的集群（§1）；无可用节点 ⇒ 控制台明示不可用（不降级）。
- **换机重建**：新盒 = 重克隆仓 + 恢复最近 WIP 快照；无快照 ⇒ 控制台明示「未提交改动将丢」，卷在旧节点保留至人工确认。
- **未提交改动的保护（三层）**：
  1. **卷保留（恒在）**：拆盒（空闲/TTL）**永不删卷**——卷留节点本地盘；
  2. **WIP 快照**（缺省开——已裁 U5）：盒脏（git 未提交/未跟踪）⇒ 打包存 server（`sandbox_checkpoints`——缺省每工作区保留最近 5 份；触发 = 控制端定时器——§1）；恢复 = 新盒套用；
  3. **销毁**：删卷 = 管理员显式确认（控制台示 dirty 与快照态——「明示风险 + 用户可选」）。
  - 快照形 = git 工作区包（stash 提交 + 未跟踪清单；`git ls-files --others --exclude-standard` 口径）；非 git 工作区 ⇒ 跳过 + 控制台标「无保护」。
- **卷**：节点本地盘 `<workspaceRoot>/<ws-id>`；磁盘配额 = 主机侧之一（SSH——§1）。

## 6. 待批队列（首次新域——需求块）

- 盒访问未在白名单的域名 ⇒ **挂起该连接**（缺省 60s）∥ 登记 pending（同 host 去重 + hits++）⇒ 控制台「工作区 X 想访问 Y」。
- 三态（控制台一键）：**批准一次**（放行当次；再访问再批）∥ **批准并记住**（写域名规则——source=approval——即生效）∥ **拒绝**；超时（缺省 60s）⇒ 拒。
- **三次批准同一域**（approve-once 计数——由 `sandbox_pending` 史派生）⇒ 控制台出「建议入默认单」行（一键采纳 = 并入默认单种子）。
- 挂起保持直至裁定到达或超时。
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
  - **运行面**（本批落定——§3）：可用性门（无节点 ∥ 全离线 ⇒ unavailable + 原因；节点面恒可用）∥ 节点表（名 ∥ 地址 ∥ 在线态 ∥ 版本 ∥ 容器（运行/总） ∥ 操作：展开容器 ∥ 删除）∥
    写入口 = **添加节点**（名 + Docker API 地址——连通自检；失败逐句人话 + 审计行）∥ **删除节点**（有容器 ⇒ 二选一「保留 ∥ 连删」；有承载工作区 ⇒ 二次确认）∥ **容器区**（节点行展开：列表（名/镜像/状态）+ 创建（名/镜像/卷三件）+ 启动/停止/重启/删除 + 详情（挂载/端口/环境/命令/用量——弹窗）∥ 日志（弹窗）∥ 强杀（详情窗内危险钮）——§3（本批补齐））∥ **镜像区**（同展开：列表（名/大小/创建）+ 拉取（名[:标签]）+ 删除（确认窗——强制删除勾选）——§3（本批））∥
    **本地镜像表过滤输入**（本批——名/标签关键词；零新端点）∥
    **镜像源卡**（本批——沙盒页新卡（全局面——非按节点）：源表（名 ∥ 地址 ∥ 面型提示）+「添加源」钮（弹窗——预选下拉 + 名/址两输入）+ 行「改/删」+ **目录浏览窗**（仓库列表 ∥ 标签列表——两处过滤输入；五分类读绪如实呈；Hub 源 ⇒ 改走「按名查标签」输入））∥
    **托管接入**（本批增补——§3：钮 + 弹窗（地址 ∥ 端口 ∥ 用户 ∥ 认证 ∥ sudo 口令（可选）∥ 名称（可选）∥ 模型 ∥ 凭据处置）∥ 装机任务区（三态 + 步骤读数展开 + keep 态「撤销凭据」）；在途读时轮询、定终态停）；UI 定形 = `webui/WEBUI.md` §2.8①；
  - **工作区**（列表：名/负责人/绑定 runner/盒状态/dirty/快照/操作：启动/停止/销毁/轮换 key/快照恢复；写入口 = **每工作区覆写**（资源 + TTL：`cpus`/`memMb`/`pids`/`diskMb`/空闲 TTL/墙钟 TTL——行内编辑；生效 = 下次建盒/重建））；
  - **出站规则**（安全组式表：方向（恒出站）∥ 协议 ∥ 端口 ∥ 目标 ∥ 动作 ∥ 优先级 ∥ 备注；增删行内；默认单 = `source=default` 种子行（可改可删））；
  - **待批队列**（实时表 + 三钮 + 「建议入默认单」行；写入口 = 待批超时）；
  - **资源与 TTL**（全局默认：limits（cpus/mem/pids） ∥ 磁盘配额默认 ∥ 空闲 TTL ∥ 墙钟 TTL ∥ 快照周期/保留数 ∥ 镜像名；读数：各节点磁盘余量 ∥ 盒资源占用）；
  - **审计可查**（`sandbox_rule` ∥ `sandbox_event` 过滤视图——数据面 = 审计页同源 + 本卡快捷入口）。
- **每配置项有界面写入口**（必交面判据——用户 14:08）：`sandbox_settings` 逐键 ↔ 卡面对照——`cpus`/`memMb`/`pids`/`diskMb`/`idleTtlMinutes`/`wallclockTtlHours`/`checkpointEveryMinutes`/`checkpointKeep`/`image`/`tmpfsMb` ⇒ 资源与 TTL ∥ `pendingTimeoutSeconds` ⇒ 待批队列。
  默认单 = 出站规则卡内 `source=default` 行（**非设置键**）；**每工作区覆写**（资源 + TTL）⇒ 工作区行；规则条目 ⇒ 出站规则行内增删。**零配置项以「编辑配置文件」收场**（部署拓扑项不涉本设置面）。
- 判权：v1 = `requireAdmin`（会话）；#1216② 到位后换同点（§9）。
- 明示义务：无可用节点 ⇒ disabled + 原因；节点探活失败 ⇒ 红；工作区无保护（非 git/快照失败）⇒ 标。
- **成员面（本人自助——用户 14:56 裁；需求 §5 沙盒块成员面行）**：成员自己的资源须有本人面——首个兑现 = **工作区读面**（承载 = `webui/WEBUI.md` §2.9 `#/me/sandbox`；信号 = `gateway/API.md` §2.7——恒本人过滤）；**待批发起方提示** = `pending` 在场 ⇒ 端侧「等待管理员批准」提示（不得静默挂起——≤60s 窗内可见）；**成员写面**（启动/停止/销毁/轮换）随 #1216 ② 权限模型（本批不做）。

## 9. 端点与判权（表在 API.md——单源）

- 控制台面 = `/api/admin/sandbox/*`（§8 六面对应）；成员面 = `/api/me/sandbox/*`（§8 成员面）。托管接入端点（本批增补——四行：起 ∥ 列表 ∥ 详情 ∥ 撤销凭据）= `gateway/API.md` §2.5；判权 `requireAdmin`；零新码（400/404）。
- 表 = `gateway/API.md` §2.5（控制台面）∥ §2.7（成员面）；错误形 = §3 全码 + **一码新增** `sandbox_unavailable`（503——无可用节点）；节点/容器面（本批——§3）：引擎失败 ⇒ 502 `upstream_error`（消息 = 逐句人话 + 引擎原文）∥ 容器/节点不存在 ⇒ 404 ∥ 形非法/重名/镜像缺/名占用 ⇒ 400（零新码）；判权 = `requireAdmin`（`thincoder-server/src/accounts/session.mjs`）∥ 成员面 = 会话（本人过滤——§8 成员面）。
  镜像源面（本批）＝ `gateway/API.md` §2.5 镜像源七行——判权 `requireAdmin`；零新码（400/404）；目录/标签读数 = 自含状态形（`{ ok, error: { kind, message } }`——沿 `/api/admin/proxy/test` 先例）；零涉沙盒可用性门（源面与节点无关）。

## 10. 已裁决策与读法披露

**已裁（2026-10-10 14:23 用户「都按建议」——逐条 = 原设计建议）：**

| # | 已裁项 | 候选 | 裁定 | 影响 |
|---|---|---|---|---|
| U1 | runner 容器运行时 | A Docker ∥ B Podman ∥ C 两者兼容（适配层） | **Docker**（runner = 远程 Docker API 节点——2026-10-10 19:52 定；控制面直调 Docker API——§1） | 节点接入 + 自检读数 |
| U2 | 内网 CIDR 的口子 | A 硬核恒拒（`127/8` + `169.254/16`）＋ RFC1918/服务器网段 = 默认可被显式 allow 开 ∥ B 四个默认全可开 ∥ C 四个默认全恒拒 | A（内网后端可用诉求成立） | rules 校验 + 求值序 |
| U3 | 默认单内容 | §4 拟定五条 ∥ 增删任意 | 按 §4 五条起步（控制台可改） | 开箱体验（装依赖/拉仓） |
| U4 | 控制台落点 | A server webui 新管理页 ∥ B 并入系统页 ∥ C 三端 | A（一页一职责——沙盒面自持） | webui 页数链 + 实施面 |
| U5 | WIP 快照默认 | A 周期 15 分钟 + 拆前 ∥ B 仅拆前 ∥ C 无（仅卷保留） | A（最小保护） | 节点负载/带宽 |

- U2 读法注：需求块「默认禁单…内网/固定 IP 后端 = 显式加 CIDR 允许条目」与「deny 恒先于 allow」并置——本裁定取「默认 = 种子（可改）；**显式 deny 恒先**；种子 deny ≺ 显式 allow（相对序——§4）」。

**读法披露（用户未异议——不阻塞·按设计实施）：**

- **D1（tmpfs 例外）**：需求块「唯一可写挂载 = 工作区卷」——设计与工具链刚需并置：`/tmp` = tmpfs（内存背书 ∥ 容积封顶 ∥ 非持久）为唯一例外（node/npm 必需）；无持久宿主面写入（盒参数集全文 = §14 KD-SV-73）。
- **D2（key_plain 明文）**：工作区 key 明文落控制面库（§2——盒重建须再注入；先例 KD-SV-19）；键面 = 工作区作用域可吊销——泄露面收于该工作区。
- **D3（盒可达 server 整端口）**：内置允许 = server 网关地址:端口（盒可达该端口全部路径）；控制台/管理面靠会话门禁（盒内无会话）；如需收窄到 /v1 路径级 ⇒ 翻案点（另设专用监听）。
- **D4（复用 key 的残余面）**：工作区 key 作为 `api_keys` 行天然可打 `/api/client/*`（logout/me——自身读面）；收窄（scope 列）= 另轮。

## 11. 验收判据（需求块 → 设计判据）

| 需求（`docs/server/requirements/PROJECT.md` §5 沙盒块） | 设计级判据 | 载体 |
|---|---|---|
| 容器唯一 ∥ 无退路 | 无可用节点 ⇒ status = unavailable + 控制台明示 | 批内件 + 收口轮 |
| 威胁模型五面 | 红队探针套件（判据表随重做批重建——需求 AC-36 ⑦） | 收口轮 |
| 每工作区一盒 ∥ read-only ∥ 唯一可写挂载 ∥ 盒内零密钥 | §14 KD-SV-73 盒参数集 + §7 凭据面 | 批内件 + 收口轮 |
| 出站两类同表 ∥ 默认全拒 ∥ 两闸 ∥ 显式 deny 先 ∥ 通配 ∥ 即生效 ∥ 审计 | rules 校验/求值单测 + 审计行落库断言 | 批内件 + 收口轮 |
| 待批队列（三态 ∥ 60s ∥ 三次建议） | 队列单测 | 批内件 + 收口轮 |
| 资源上限 ∥ 墙钟 TTL ∥ 空闲拆 ∥ 每工作区覆写 | TTL 单测 + 覆写单测（PATCH ⇒ 建盒载荷逐值——N45） | 批内件 + 收口轮 |
| 非目标（0day ∥ 侧信道） | §1 明写不做 | —— |
| 验收 = 红队探针套件 + 正常开发链 | 探针套件（重做批重建）+ 正常开发链用例 | 收口轮 |
| 落地序（先于 #1215）∥ 与 CI 共用执行面 | §14 KD-SV-72 + §15 边界（CI 实现不在本批） | 设计在档 |
| 14:00 裁定（两平面分离 ∥ 无节点不可用 ∥ CI 共用） | §1 ∥ §14 KD-SV-63/71/72 | 设计在档 |
| 管理与配置界面 = 必交面（用户 14:08——六面 + 每项配置有界面写入口） | §8 六面在册（含运行面节点接入：添加/删除 ∥ 连通自检 ∥ 失败审计行）∥ 每配置项有 UI 写入口（`sandbox_settings` 逐键对照表 + 每工作区覆写——§8）∥ 控制台机检口径 = `webui/WEBUI.md` §6 沙盒行（单源——含 `#/admin/sandbox` 路由 ∥ nav 管理项 ∥ 档目链 ∥ i18n `admin.sandbox.*` 两表同步；容器面补齐/镜像族行 = 本批随正） | 批内件 + 收口轮（浏览器实走） |
| 成员面 = 本人自助（用户 14:56——AC-36 ⑧） | §8 成员面（`#/me/sandbox` 本人工作区读 + 待批发起方提示）∥ 信号 = `gateway/API.md` §2.7 | 批内件 + 收口轮（浏览器实走） |
| **最小切片**（runner-admin-console 批——台账 #1252；用户 19:59 四件） | ① 添加节点（自检读数落库逐值 ∥ 失败 ⇒ 502 + 零落库 + 审计行）② 建容器（引擎请求体逐值 ∥ 列表可见）③ 启/停（幂等：304 ⇒ 成功）④ 删节点（保留 ∥ 连删二选一 ∥ 连删失败 ⇒ 行保留）；判据全文 = §3 ∥ §12（N40 ∥ N46–N48 ∥ B41–B43 ∥ E34–E36）；**真机跑**（收口轮——`10.0.0.6`，Docker 29.1.3 ∥ 盒镜像在机）：添节点 ⇒ 在列（online + 版本）；建容器 ⇒ `docker ps -a` 见 `Created` ⇒ 启动 ⇒ `docker ps` 见 `Up` ⇒ 停止 ⇒ `Exited` ⇒ 删 ⇒ 无；删节点「保留」⇒ 容器留机 ∥「连删」⇒ 容器净 + 节点消 | 批内件 + 收口轮（真机） |
| **托管接入**（本批增补——台账 #1236/#1237；用户 22:19–22:29 + 15:00/15:02） | 步骤表两径覆盖（裸机 ∥ 已装——§3；S 序列分叉逐条）∥ 每步成功判据 = 可复读读数（run 详情/审计行）∥ 失败 = 停在哪步 + 人话 + 宿主处置如实 ∥ 凭据五件（加密 ∥ 低权引导 ∥ 可撤 ∥ 审计 ∥ 弃置——§3）∥ 硬点两答案（§3 网络路径 ∥ `agent/ADMIN-AGENT.md` §4 边界）；判据全文 = §3 ∥ §12（N49–N52 ∥ B44–B46 ∥ E37/E38）∥ `agent/ADMIN-AGENT.md` §7 ∥ `gateway/API.md` §2.5 托管接入四行；**真机**（收口轮——无 Docker 机器：只给地址+凭据 ⇒ 「已就绪」+ 每步读数可复读） | 批内件 + 收口轮（真机） |
| **容器面补齐 + 镜像族**（本批——sandbox-docker-admin；台账 #1265；用户 04:36/04:39 两族同批） | 容器五件：详情读数逐值（挂载/端口/环境/命令）∥ 日志（tail 有界 + 非 TTY 帧解复用——零帧头残渣）∥ 重启/强杀（引擎调用逐条 + 审计两 kind）∥ 用量（cpuPercent/内存/磁盘逐值；一次采样口径）；镜像三件：列表逐值 ∥ 拉取（`fromImage`/`tag` 逐值 ∥ 缺省 `latest` ∥ 失败两形 ⇒ 400）∥ 删除（`force` 0/1 逐值 ∥ 409 ⇒ 400 人话）；判据全文 = §3（本批块）∥ §12（N53–N56 ∥ B47–B51 ∥ E39–E42）∥ `gateway/API.md` §2.5 新八行 ∥ `webui/WEBUI.md` §2.8① ∥ §6 沙盒行（本批随正）；审计 kind 面 = `accounts/ACCOUNTS.md` §2.1（型面计数零增）；**真机**（收口轮——10.0.0.6：真容器详/日志/重启/强杀/用量 ∥ 真镜像列/删；拉取视源可达性如实报） | 批内件 + 收口轮（真机） |
| **镜像源族**（本批——sandbox-image-sources；台账 #1274；用户 09:17 四点 ①②③ + 09:19 预选） | 源清单 CRUD（增/删/改/列——形校验拒非法 ∥ 名/址各自唯一 ∥ 每动作一审计行 ∥ 预选六条在册且表单只回填名/址）∥ 源目录可达（v2 目录/标签逐值 ∥ Hub 面标签 + 裸名补 `library/` ∥ 匿名 Bearer 逐跳命中（挑战解析 → 换 token → 复读） ∥ 读绪五分类如实呈（`timeout`/`unreachable`/`auth_required`/`unsupported`/`bad_response`））∥ 过滤生效（本地镜像表 ∥ 仓库列表 ∥ 标签列表——无匹配 ⇒ 空态句）；判据全文 = §3（本批块）∥ §12（N57–N59 ∥ B52–B56 ∥ E43–E45）∥ `gateway/API.md` §2.5 镜像源七行 ∥ `webui/WEBUI.md` §2.8① + §6 沙盒行（本批随正） ∥ `store/STORE.md` §2 v15 段/§3 v15；**收口轮** = 浏览器实走（增/改/删源 + 源目录读取（自建 registry ∥ 公网源按可达性如实）+ 两处过滤） | 批内件 + 收口轮（浏览器实走） |

## 12. 用例（本域）

| # | 类 | 面 | 输入 | 预期输出 |
|---|---|---|---|---|
| N40 | 正常 | 控制面 | 添加节点：名 + Docker API 地址（假 Docker `GET v<ver>/version` 在案）⇒ 连通自检 | `sandbox_runners` 行（name/address/status=active；`runtime_json` = 自检读数逐值 ∥ 协商版本在场）；运行面在列（online=true ∥ 版本）；审计 `sandbox_event`（kind=`runner_add`） |
| N41 | 正常 | 控制面 | 建工作区（负责人）⇒ 建盒 | key 签发（`api_keys` 行名 `sandbox:<ws>`）+ 绑定节点 + 建盒/启动（控制面直调 Docker API——§1） |
| N42 | 正常 | 控制面 | 规则增删各一（`sandbox_rules`） | `rulesRev` +1；**即生效 ∥ 不重建盒**（需求块）；审计 `sandbox_rule` 两行 |
| N43 | 正常 | 控制面 | 待批三态各一次（once ∥ remember ∥ deny） | 挂起 ≤60s；once = 当次放行再访问再挂；remember = 规则入表（source=approval）即生效；审计 `sandbox_event` |
| N45 | 正常 | 控制面 | 建工作区携 `limits`（cpus/memMb）⇒ PATCH 覆写 `cpus` ⇒ 触发重建 | 行 `limits_json` 回读逐值；create/重建 payload 逐值 = 覆写 ∪ 全局默认（未覆写键）；运行中盒零触（仅重建生效） |
| B35 | 边界 | 控制面 | 无可用节点 | 沙盒面 disabled + 原因文本；写动作读数 503 `sandbox_unavailable`（不降级） |
| B36 | 边界 | 控制面 | 域名规则校验：`*.example.com` ∥ `*` ∥ `*.com` ∥ `a.*.com` ∥ IP 段通配 | 首者收；余者 400（写面）——控制台通配条目带醒目标记 |
| B37 | 边界 | 控制面 | 同 host：allow 规则 + deny 规则并存 | 拒（显式 deny 恒先）；priority 只排同动作内 |
| B38 | 边界 | 控制面 | 同一域三次 approve-once | 控制台出「建议入默认单」行；采纳 ⇒ 并入默认单种子 |
| B39 | 边界 | 执行面 | 盒空闲 30 分钟（dirty）∥ 墙钟 24h | 停盒 +（dirty）WIP 快照；卷留；下次使用重建（重克隆 + 快照恢复） |
| B40 | 边界 | 执行面 | 非 git 工作区 | 跳过快照 + 上报；控制台标「无保护」 |
| E29 | 错误 | 控制面 | `user` ∥ 无会话打 `/api/admin/sandbox/*` | 403 ∥ 401 |
| E31 | 错误 | 控制面 | 销毁工作区（dirty 未确认）∥ 轮换后旧 key 再用 | 拒/警示（二次确认要求）；旧 key 再用 ⇒ 401（吊销即断）；轮换 = 拆容器重建（卷保留）后新 key 生效 |
| E33 | 错误 | 执行面 | 盒写超磁盘配额 | ENOSPC（应用可见）；节点盘不破界（配额兜底） |
| N46 | 正常 | 控制面 | 建容器：名/镜像/卷三件（假 Docker `POST v<ver>/containers/create` 在案） | 引擎请求体逐值（`Image` ∥ `Binds`=`<卷>:/workspace`）；200 `{ container }`（id 逐值）；列表含（state=created）；审计行 `container_create` |
| N47 | 正常 | 控制面 | 启 ∥ 停 ∥ 删容器（各一次；启/停各重复一次） | 引擎调用逐条命中（start ∥ stop ∥ DELETE `?force=1`）；204 ⇒ 200 ∥ 304（已启/已停）⇒ 幂等成功；审计行三枚 |
| N48 | 正常 | 控制面 | 删节点三径：有容器 ⇒ `keep` ∥ `remove` ∥ 无处置（无容器 ⇒ 直接删） | keep ⇒ 登记行删、引擎零删调用；remove ⇒ 逐删命中（N 次）⇒ 行删；无处置 ⇒ 400；无容器 ⇒ 直接删行；审计行 `runner_delete`（detail 逐值） |
| B41 | 边界 | 控制面 | 节点不可达（假 Docker 关停） | 运行面 online=false（version/containers = null）；容器列表 ⇒ 502 人话；添节点 ⇒ 502 + 审计 `runner_selfcheck_failed` + 零落库；删节点 = 仅 keep 过（remove ⇒ 502） |
| B42 | 边界 | 控制面 | 自检版本不兼容（`MinAPIVersion` 1.50 ⇒ 协商 > ApiVersion） | 拒登记（502 人话「API 版本不兼容」）；零落库 |
| B43 | 边界 | 控制面 | 删节点连删中途失败（2 容器，第 2 个引擎 500） | 502 + 登记行保留 + 消息携失败清单；已删者如实回报（不假装未删） |
| E34 | 错误 | 控制面 | 添节点：重名 ∥ 地址形非法（`https:` ∥ 空） ∥ `user` ∥ 无会话 | 400 ∥ 400 ∥ 403 ∥ 401 |
| E35 | 错误 | 控制面 | 建容器：镜像不存在（引擎 404）∥ 名占用（409）∥ 节点不可达 | 400（含引擎原文）∥ 400 ∥ 502 |
| E36 | 错误 | 控制面 | 容器动作目标引擎 404（容器不存在——被外部删了） | 404 `not_found` |
| N49 | 正常 | 控制面 | 托管接入·裸机全链（假 ssh + 假 Docker：探明「无 Docker」⇒ 装 ⇒ 开监听 ⇒ 登记） | 步骤序列 S1→S2→S3→S4→S5→S6→S7→S8 逐条在 run 详情；终态 succeeded；每 exec 审计行（命令 ∥ 退出码 ∥ 摘要）；登记行在场 |
| N50 | 正常 | 控制面 | 托管接入·已装并已监听（探明「Docker 在 + `:2375` 在」） | 跳 S4/S5（零装包/零重启调用——假件断言）；终态 succeeded |
| N51 | 正常 | 控制面 | 托管接入·已装未监听 | 仅走 S5（重启恰一次）；终态 succeeded |
| N52 | 正常 | 控制面 | 凭据三态：弃（终态 ⇒ 密列 NULL）∥ 保留（密文在）∥ 撤销（清列 + 审计 `onboarding_credential_revoke`） | 逐态读数逐值；秘密零回显（响应面扫描） |
| B44 | 边界 | 控制面 | 指纹变更（known_hosts 旧值 ≠ 主机现值） | 停（S2）+「主机指纹已变更——确认后重试」人话；「重新信任」后重试过 |
| B45 | 边界 | 控制面 | sudo 不可用（`sudo -n` 败 ∧ 无口令） | 停（S3）+ 建议句；宿主零变 |
| B46 | 边界 | 控制面 | server 重启（run 在途） | 启动收尾：`interrupted` + 审计行 + 凭据按模式（弃 ⇒ 零化）；控制台如实示「被中断」 |
| E37 | 错误 | 控制面 | 认证被拒（假 ssh 恒 1）∥ 不可达（死端口） | S2 停 + 逐句人话；宿主零动作（假件零写断言） |
| E38 | 错误 | 控制面 | Docker API 版本不兼容（`MinAPIVersion` 1.50 ⇒ 协商 > `ApiVersion`） | S6 停 +「版本不兼容」；零落库 |
| N53 | 正常 | 控制面 | 容器详情 + 日志 + 用量三读（假 Docker：`containers/{id}/json` ∥ `/logs`（多路复用流样件） ∥ `/stats?stream=false&one-shot=true` ∥ `/json?size=1` 在案） | 详情逐值（挂载/端口/环境/命令）；日志 = 解复用后文本（零帧头残渣；`truncated=false`）；用量 { cpuPercent, memUsed, memLimit, diskRw } 逐值；**零审计行**（读动作） |
| N54 | 正常 | 控制面 | 重启 ∥ 强杀各一次 | 引擎调用逐条命中（`POST …/restart` ∥ `POST …/kill`）；204 ⇒ 200 `{ ok: true, id }`；审计两行（`container_restart` ∥ `container_kill`——detail 逐值；键集 = `accounts/ACCOUNTS.md` §2.1） |
| N55 | 正常 | 控制面 | 镜像列表 ∥ 拉取（假 Docker：`images/json` ∥ `images/create` 流式 200） | 列表逐值（id/tags/size/created）；拉取引擎入参逐值（`fromImage=<名>` ∥ `tag=<标签>`——缺省 `latest`）；200 `{ ok, image, tag }`；审计 `image_pull` 一行 |
| N56 | 正常 | 控制面 | 镜像删除两形：`ref` = `名:标签`（force 缺省）∥ force:true | 引擎调用逐值（`DELETE /images/<ref>?force=0` ∥ `?force=1`）；200 `{ ok, ref }`；审计 `image_delete`（detail 逐值；键集 = `accounts/ACCOUNTS.md` §2.1） |
| B47 | 边界 | 控制面 | 日志 `tail` 越界（0 ∥ 5000）∥ 非数 ∥ 缺省 | 400（范围人话） ∥ 400 ∥ 200（缺省 tail=200） |
| B48 | 边界 | 控制面 | 强杀未运行容器（引擎 409） | 400 人话「容器未在运行——无需强杀」（非幂等成功——≠ stop 的 304） |
| B49 | 边界 | 控制面 | 删除镜像被引用（引擎 409）∥ `force: true` 同击 | 400（携引擎原文 + 处置句）；force:true ⇒ 引擎 `force=1` 再走 |
| B50 | 边界 | 控制面 | 拉取形非法：空 ∥ 含 `@`（digest）∥ 超长 | 400（逐形人话）；**零引擎调用**（假件断） |
| B51 | 边界 | 控制面 | 日志超 256 KiB（假 Docker 大样件） | `truncated: true` + 尾句标记（文本体 ≤ 256 KiB） |
| E39 | 错误 | 控制面 | 详情/日志/用量/重启/强杀目标不存在（引擎 404） | 404 `not_found` |
| E40 | 错误 | 控制面 | 拉取：引擎非 2xx ∥ 200 流内 `error` 两形 ∥ 节点不可达 | 400（携引擎原文）∥ 400（携引擎原文）∥ 502 `upstream_error` |
| E41 | 错误 | 控制面 | `user` ∥ 无会话 打新八端点 | 403 ∥ 401 |
| E42 | 错误 | 控制面 | 详情/日志/用量/重启/强杀节点不可达（假 Docker 关停——五端点逐打） | 502 `upstream_error`（逐句人话 + 引擎原文） |
| N57 | 正常 | 控制面 | 镜像源增/改/删/列 + 预选（本面零外呼） | 行落库逐值（`address` = 归一形——缺 scheme 补 `https://`）；`kind` 派生逐值（Hub 四别名 ⇒ `hub` ∥ 余 ⇒ `v2`）；审计三行（detail 键集 = `accounts/ACCOUNTS.md` §2.1）；预选端点回六条（名/址两字段） |
| N58 | 正常 | 控制面 | v2 源两读（假 registry：`/v2/_catalog` 200 + `Link` 下一页 ∥ `/v2/<name>/tags/list` 200） | `repositories` ∥ `tags` 逐值；`truncated` = `Link` 在场 ⇒ true；`n` 缺省（引擎入参逐值：`?n=200`）；**零审计**（读动作） |
| N59 | 正常 | 控制面 | Hub 源两读（假 hub：`hub.docker.com/v2/repositories/library/nginx/tags` 200 + `next`） | 裸名 `nginx` ⇒ 路径 `library/nginx` 逐值；`page_size` = `min(n,100)`；目录读 ⇒ `{ ok: false, error: { kind: `unsupported` } }`（人话） |
| B52 | 边界 | 控制面 | 匿名 Bearer 挑战（假 registry：401 + `WWW-Authenticate: Bearer realm=…` ⇒ 假 token 端点 200） | 逐跳命中（挑战解析 ⇒ 换 token ⇒ 携 `Bearer` 复读 ⇒ 200）；scope 逐值（目录 = `registry:catalog:*` ∥ 标签 = `repository:<name>:pull`）；**零凭据**（请求头零 Basic） |
| B53 | 边界 | 控制面 | 源如实回空目录（假 registry：`{"repositories":[]}`——实测 quay 形） | 200 `{ ok: true, repositories: [], truncated: false }` + 控制台空态句（**非错误**）；零异常 |
| B54 | 边界 | 控制面 | `n` 越界（0 ∥ 5000）∥ 非数 ∥ `name` 形非法（大写 ∥ `..` ∥ 空白 ∥ `?`） | 400（逐句人话）；**零外呼**（假件断） |
| B55 | 边界 | 控制面 | 目录接口不支持（假 registry：405 `UNSUPPORTED`——实测 DaoCloud 形） | `{ ok: false, error: { kind: `unsupported`, message: 人话 } }`；控制台就地提示（不改写为「空目录」） |
| B56 | 边界 | 控制面 | 源目录读：远端 200 非 JSON ∥ 形不符（假 registry：HTML 体 ∥ `{"repositories":"x"}`） | `{ ok: false, error: { kind: `bad_response`, message: 人话 } }`；零落库；控制台就地呈 |
| E43 | 错误 | 控制面 | 增/改源：空名 ∥ 名超 40 ∥ 撞名 ∥ 撞址 ∥ 址含路径/空白 | 400（逐形人话）；**库零变**（回读逐行） |
| E44 | 错误 | 控制面 | 源目录读：不可达（死端口）∥ 超时（假件挂起）∥ 401 挑战不可解析 ∥ token 端点 401 ∥ 复读仍 401 | `{ ok: false, error: { kind: `unreachable` ∥ `timeout` ∥ `auth_required` } }`（逐形人话）；零落库；控制台就地呈 |
| E45 | 错误 | 控制面 | `user` ∥ 无会话 打镜像源七端点 ∥ 改/删不存在 id | 403 ∥ 401 ∥ 404 `not_found` |

## 13. 本域文件与行数预算（控制面）

| 档 | 行数（设计估） | 职责 |
|---|---|---|
| `thincoder-server/src/sandbox/routes.mjs`（已落盘 **442**——2026-10-11 实读：净差 ≈51 = 并飞 chat 批抽删节点链 ∥ sandbox-docker-admin 批 +3 行） | **sandbox-docker-admin 批 +3 已入盘；本批（sandbox-image-sources）±0**；余量 ≈58——拆分触发点 = 越 500 软线（下批无需先拆） | 控制台面端点（§8/§9） |
| `thincoder-server/src/sandbox/registry.mjs`（已落盘 **522**——2026-10-10 现读） | **⇒ ≈500**（runner-admin-console 批：runner 面重写（登记/读数/可用性随新模型）∥ `runnerHealth` 删 ∥ `sweepStuckTasks` 去心跳判据；队列/心跳死件不动——实读核过无调用方） | 登记/读数（§3）∥ 队列（§5/§6） |
| `thincoder-server/src/sandbox/docker.mjs`（已落盘 **187**——2026-10-11 现读） | **⇒ ≈330**（本批：+≈143 = 详情/日志（含解复用）/用量两读/重启/强杀/镜像三件/拉取流扫描/形校验 ∥ 常量/头注） | Docker API 客户端（§3） |
| `thincoder-server/src/sandbox/container-routes.mjs`（已落盘 **168**——2026-10-11 现读） | **⇒ ≈330**（本批：+≈162 = 详情≈18 ∥ 日志≈22 ∥ 重启/强杀≈25 ∥ 用量≈28 ∥ 校验/错误映射≈45 ∥ 路由注册与头注≈24） | 容器面路由（§3 家族——拆分档） |
| `thincoder-server/src/sandbox/image-routes.mjs`（已落盘 **132**——2026-10-11 本批现读（在册 ≈130——越估 2）） | **±0**（本批零触） | 镜像族路由（§3） |
| `thincoder-server/src/sandbox/image-sources.mjs`（拟新增——本批） | ≈**170**（设计估——预选表六条 ∥ 地址归一/形校验 ∥ `sourceKind` 派生 ∥ `image_sources` 存取） | 镜像源清单模型（§3） |
| `thincoder-server/src/sandbox/registry-client.mjs`（拟新增——本批） | ≈**230**（设计估——v2 `_catalog`/`tags/list` ∥ Hub 公共 API ∥ 匿名 Bearer 挑战 ∥ 有界/`Link` 截断 ∥ 五分类错误映射；`fetchImpl` 注入 = 测试面） | 远端源客户端（§3） |
| `thincoder-server/src/sandbox/image-source-routes.mjs`（拟新增——本批） | ≈**170**（设计估——七端点：列/预选/增/改/删/目录/标签 ∥ 校验与错误映射 ∥ 头注） | 镜像源端点（§9） |
| `thincoder-server/src/sandbox/ssh.mjs`（拟新增——托管接入增补） | ≈180（设计估——SSH 传输：spawn openssh（key `-i` ∥ `sshpass -e`） ∥ keyfile/known_hosts 落数据目录 ∥ 指纹 TOFU ∥ 超时/输出截断；`execImpl` 注入 = 测试面） | 主机执行传输（§3） |
| `thincoder-server/src/sandbox/onboarding.mjs`（拟新增——托管接入增补） | ≈300（设计估——任务生命周期（起/收尾/重启恢复） ∥ 凭据加解密（AES-256-GCM）∥ 步骤日志 ∥ 任务简报文 ∥ registry 登记桥） | 托管接入任务面（§3） |
| `thincoder-server/src/sandbox/onboarding-routes.mjs`（拟新增——托管接入增补） | ≈130（设计估——四端点：起 ∥ 列表 ∥ 详情 ∥ 撤销凭据；独立成档缘由 = `routes.mjs` 加后 ≈545 逼近 500 软线） | 托管接入端点（§9） |
| `thincoder-server/src/sandbox/rules.mjs`（拟新增） | ≈230 | 规则/待批/修订号（§4/§6） |
| `thincoder-server/src/sandbox/credentials.mjs`（拟新增） | ≈80 | 工作区 key（§7） |
| `thincoder-server/src/store/db.mjs`（已落盘 **458**——2026-10-11 本批现读） | **⇒ ≈490**（本批：v15 段 +≈32——建表 + 两唯一约束 + 迁移段）；**余量 ≈10（500 软线内）——实施后复读；越 500 ⇒ 同轮补拆分预案** | v11–v13 ∥ v15 段（§2） |
| `thincoder-server/src/accounts/audit.mjs`（已落盘 109） | **±0**（本批——三 kind 走 `sandbox_event`，非枚举）；陈值 ≈+3（托管接入批——该批亦 ±0；五 kind 同因） | 十三型（§2） |
| `thincoder-server/src/gateway/errors.mjs`（已落盘 64——2026-10-10 现读） | **±0**（runner-admin-console 批——零新码） | `sandbox_unavailable`（§9） |
| `thincoder-server/bin/thincoder-server.mjs`（已落盘 **189**——2026-10-11 本批现读） | **+≈2**（本批：`image-source-routes` import + 注册行） | import + 注册行 |
| **小计** | **≈+1172 ⇒ 本批 ≈+316**（runner-admin-console 批：routes +≈133 ∥ registry −≈22 ∥ docker 新 ≈170 ∥ db +≈35；errors ∥ bin ±0）**⇒ 增补 ≈+640**（托管接入：ssh 新 ≈180 ∥ onboarding 新 ≈300 ∥ onboarding-routes 新 ≈130 ∥ routes ±≈5 ∥ db +≈25；agent 域另计——`agent/ADMIN-AGENT.md` §6）**⇒ 本批 ≈+438**（sandbox-docker-admin：container-routes +≈162 ∥ image-routes 新 ≈130 ∥ docker +≈143 ∥ routes ±≈3；webui 面 = `webui/WEBUI.md` §5）**⇒ 本批 ≈+604**（sandbox-image-sources：image-sources 新 ≈170 ∥ registry-client 新 ≈230 ∥ image-source-routes 新 ≈170 ∥ db +≈32 ∥ bin +≈2——webui 面 = `webui/WEBUI.md` §5） | —— |

- `routes.mjs` 拆分预案（**首选已执行**——容器面拆 `container-routes.mjs`（已落盘 168）；**实读 442（2026-10-11）——sandbox-docker-admin 批 +3 已入盘；本批（sandbox-image-sources）±0；余量 ≈58**）：**触发点 = 越 500 软线（下批无需先拆）**；**候选拆法**（落域内、端点路径零变）：① 工作区面（工作区四路由 + 视图函数）独立成档（≈150——首选）∥ ② 规则/待批/设置三面独立成档（≈120）。
- `rules.mjs`/`credentials.mjs` 两行「拟新增」= 陈值（两档已落盘）——清账另轮；执行面预算随重做批重建；webui 预算 = `webui/WEBUI.md` §5；批内件预算 = 批档 §2；板账 = `docs/server/design/PROJECT.md` §6。
- 批内件三件（入 server 链）：`docs/batches/2026-10-10-runner-admin-console.test.mjs`（服务面——Docker 客户端 ∥ 路由 ∥ v12 迁移；估 ≈420）∥
  `docs/batches/2026-10-10-runner-admin-console-ui.test.mjs`（前端面——运行面渲染 ∥ nav ∥ i18n 键集；估 ≈260 ⇒ ≈330——+托管接入块）∥
  `docs/batches/2026-10-10-runner-admin-console-agent.test.mjs`（托管接入/agent——假 ssh ∥ 五工具 ∥ 任务生命周期 ∥ 凭据加密/零化 ∥ v13 迁移；估 ≈420）；批档 §2 列全。
- **本批件（sandbox-docker-admin——入 server 链）**：`docs/batches/2026-10-11-sandbox-docker-admin.test.mjs`（服务面——估 ≈420：docker 客户端读数/流解复用/拉取扫描 ∥ 八路由 ∥ 假 Docker）∥
  `docs/batches/2026-10-11-sandbox-docker-admin-ui.test.mjs`（前端面——估 ≈280：容器详情/日志/用量面渲染 ∥ 镜像区 ∥ 弹窗 ∥ i18n 键集 ∥ 档目）。
  **随正件**（父侧落——实施轮同拍）：`docs/batches/2026-10-06-server-gateway-webui-deploy.test.mjs`（档目断言 +2 名——`views-sandbox-containers.mjs` ∥ `views-sandbox-images.mjs`）∥ 门禁件数断言件七件（**45 ⇒ 47**——chat 批三件 + 本批两件；盘面实读）∥ `thincoder-server/package.json`（`prepublishOnly` **45 ⇒ 47**——本批两件入链；盘面实读）。
- **本批件（sandbox-image-sources——入 server 链）**：`docs/batches/2026-10-11-sandbox-image-sources.test.mjs`（服务面——估 ≈420：源清单模型（形校验/名址唯一/预选） ∥ registry-client（v2 与 Hub 两面读 ∥ 匿名 Bearer 挑战 ∥ 有界/`Link` 截断 ∥ 五分类映射） ∥ 七端点 ∥ v15 迁移；假 registry/hub）∥
  `docs/batches/2026-10-11-sandbox-image-sources-ui.test.mjs`（前端面——估 ≈280：镜像源卡渲染 ∥ 增/改/删弹窗（预选回填） ∥ 目录浏览窗（两列表 + 两过滤） ∥ 五分类读绪 ∥ 本地镜像表过滤 ∥ i18n 键集 ∥ 档目）。

## 14. 关键决策（本域）

| # | 决策 | 理由 | 被否候选与何故否 |
|---|---|---|---|
| KD-SV-63 | **两平面分离**：server = 控制面（登记/编排/治理），盒只跑在 runner 节点（远程 Docker API 节点——可多台；集群化 = 用 Docker 自己的集群——§1） | 用户 14:00 裁定（单点被压死即全死）；控制面常驻质量与盒资源耗尽解耦 | 同机跑盒（否——单点故障 + 资源争用） |
| KD-SV-67 | **未提交保护 = 卷保留 ∥ WIP 快照 ∥ 销毁显式确认**（拆盒/停盒永不删卷；快照触发 = 控制端定时器——§1；销毁 = 管理员显式确认） | 工作区状态 = git 仓（可重建），节点本地卷 = 缓存；快照兜住未提交面（需求「停（卷∥快照留存）」——§5 工作区生命周期行） | 卷迁移（跨机传输机制重——否）；无保护（违「别被测试代码打崩」精神——否） |
| KD-SV-68 | **出站 = 两类同表两闸**（CIDR（网络层）+ 域名（应用层），解析后 IP 二查；显式 deny 恒先（种子 deny ≺ 显式 allow——U2）；增删即生效） | 需求块两闸次序与两类同表的直接落地；强制面 = 主机侧走 SSH（§1） | 纯代理（CIDR 直连场景失真——否）；纯网络层（域名不可行——需求块已裁——否） |
| KD-SV-69 | **待批队列 = 三态 + 60s + 三次建议**（需求块：新域挂起 ⇒ 控制台批准一次/记住/拒绝；超时拒；三次批准 ⇒ 建议入默认单） | 需求块 + 行业形（Claude Code 同形） | 一律硬拒（体验差——需求块已否）；自动放行（安全面破——否） |
| KD-SV-70 | **每工作区凭据 = `api_keys` 行**（名 `sandbox:<ws>`；归属负责人；明文存控制面） | 复用客户面 token 面（需求块原句）；校验/记账/配额全链零改；明文 = 盒重建再注入所需（先例 KD-SV-19） | 新 key 族（第二校验面——否）；每次重建新签发（行累积 + 链路抖动——否） |
| KD-SV-71 | **可用性门 = 无可用节点 ⇒ 仅沙盒功能面不可用**（不降级）；**server 启动与运行零依赖沙盒/runner**（用户 14:24——网关 ∥ 记账 ∥ 控制台其余页 ∥ 客户面零影响） | 用户 13:43「不要考虑什么退路」的延续（限于沙盒面）+ 用户 14:24 裁定（server 零依赖） | 降级为直跑进程（否——违容器唯一形态）；server 因缺节点拒启或整站降级（否——违用户 14:24） |
| KD-SV-72 | **执行面共用**（runner 与 CI——用户 14:00 裁定⑦）：CI 与沙盒共用同一执行节点面；接口/形态随重做批定形 | 「跑不受信的仓」本质同——一套节点面 | 另建 CI 专用节点族（节点面翻倍——否） |
| KD-SV-73 | **盒参数集** = read-only 根 + 唯一卷 + tmpfs 例外 + cap-drop + 非 root + 每工作区网络 | 需求块「每工作区一盒 + `--read-only` + 唯一可写挂载」的逐项落地；每工作区网络 = 跨工作区隔离（威胁模型面） | 共享网络（跨工作区可达——否）；特权盒（提权面——否） |
| KD-SV-74 | **磁盘配额 = 项目配额优先 ∥ loopback 备选**（主机侧——SSH 执行；用户 19:52 定） | 项目配额（xfs pquota ∥ ext4 prjquota）零额外设备；loopback 全平台可落但耗 loop 设备 | 无配额（需求块明列——否）；容内自填盘监控（用户态不可靠——否） |
| KD-SV-76 | **网络层闸 = nft 优先 ∥ iptables 备 + 全量重算幂等**（主机侧——SSH 执行；用户 19:52 定） | 主机异构；全量重算避免增量残渣与漂移 | 纯 iptables（旧栈机器兼容但表达弱——备选）；增量改链（残渣风险——否） |
| KD-SV-79 | **容器态不落库**（runner-admin-console 批）：Docker 引擎即真源——读时读（`containers/json`）∥ 动作直调（create/start/stop/DELETE）；控制面零镜像 ∥ 零同步机制 | 双源必漂移（外部 `docker` 命令 ∥ 机器重启 ∥ 别的工具都在改容器）；同步/对账机制 = 白增面（最小切片不取） | 落库镜像表 + 对账（同步机制/陈旧窗口——否）；心跳式上报（用户 19:52 口径已排除——机器上不驻留进程 ∥ 无心跳） |
| KD-SV-80 | **节点存活 = 读时探活（非心跳）**：运行面/读数 = 请求内现打 `GET …/info`（3s ∥ 并发）∥ 动作 = 现打现报；无后台定时器 ∥ 无心跳落库 | 用户 19:52 口径（无自驻进程）；探活只服务展示与当下动作，无独立可用性状态可陈 | 心跳上报（通道已废——否）；常驻探针进程（用户口径排除——否） |
| KD-SV-81 | **Docker API 版本 = 登记时协商 + 调用恒带前缀**：`ver = max(1.44, MinAPIVersion)`，须 ≤ `ApiVersion`（否则拒登记）；版本存 `runtime_json`；**引导步 = 先取无前缀版本读数、再定前缀**（§3 自检）；**前缀形 = `v<ver>`**（如 `/v1.44/…`——2026-10-11 真机核：`/1.44/…` 404 ∥ `/v1.44/…` 200） | 官方文档明示无版本前缀调用已废弃（将移除）；协商 = 老 daemon（min < 1.44）与新 daemon（min ≥ 1.44，如 Docker 29）两头都接得住 | 裸无前缀（官方废弃面——否）；固定档不协商（未来 daemon 抬底即坏——否） |
| KD-SV-83 | **托管接入 = agent 逐案执行**（探明 → 决定 → 执行 → 验证 → 报告——非固定脚本）：步骤骨架在案（§3）∥ 自主 = 技术路线（包管理器/装法/重试 ≤1/次序）∥ 停下报告六边界（agent 档 §4）∥ 失败处置 = 仅撤自改可逆配置（drop-in）∥ 装包不回滚 ∥ 登记失败零宿主回滚 ∥ 预算（20 分钟 ∥ 60 调用） | 用户 15:00/15:02 口径（执行者 = server 端 agent；能力从场景反推）；无人值守须保险丝与停点；「回滚还是停下」= 按动作可逆性分类 | 固定安装脚本（用户已否——「不是固定安装脚本」）；全量回滚（装包卸载更危险——否）；无预算（跑飞面——否） |
| KD-SV-84 | **凭据 = AES-256-GCM + 密钥文件（`data/credentials.key` 0600）+ 默认用完即弃 + 可撤销 + 每步审计（掩蔽）** | 需求凭据纪律五件定形（#1236）；`node:crypto` 零第三方；默认弃 = 信任最小化；如实披露（同机密钥不防整机沦陷；撤销只及 server 侧） | 明文落库（跳板凭据面——否）；外部 KMS（另立级——本批否）；默认保留（长期持凭据——否） |
| KD-SV-85 | **SSH 传输 = 容器内系统 openssh**（密钥 `-i`（0600 文件）+ `BatchMode=yes` ∥ 口令 `sshpass -e`（环境变量——不入 argv；**不带 `BatchMode`**——真机 A/B 核：带 ⇒ 「Permission denied (publickey,password)」∥ 去 ⇒ 登录成功；口令单提示 + 仅口令面））+ 主机指纹 TOFU（accept-new + 首见记录；变更 ⇒ 停 + 「重新信任」重试）+ `.ssh` 落数据目录 | 零第三方运行期依赖（仓纪律——JS 自写 SSH 不现实）；`sshpass -e` = ps 无泄漏形；数据目录 = 容器重建不丢 | 自写 SSH 协议（体量/安全——否）；`-p` 明文 argv（ps 泄漏——否）；不验指纹（网内中间人——否）；硬拒一切指纹变更（重装常态——否） |
| KD-SV-86 | **run 态 = 库行 + 读时轮询**（`sandbox_onboarding` v13——无后台常驻定时器）；重启 ⇒ 在途 `interrupted`（如实收尾 + 凭据按模式处置） | 沿 KD-SV-80（无后台常驻）；部署链真会重建容器（重启恢复必须诚实） | 内存态（刷新即失/重启悬挂——否）；后台监控定时器（无必要常驻——否） |
| KD-SV-92 | **容器读数三件 = 读时读直取**（沙盒 docker 管理批）：详情 = `containers/{id}/json` ∥ 用量 = `stats?stream=false&one-shot=true` + `json?size=1`（`SizeRw`/`SizeRootFs`）∥ 日志 = `logs?tail` 有界（读类 3s）；零缓存零落库 | 沿 KD-SV-79（引擎即真源）；无陈旧窗（外部 `docker` 命令随时改物）；读数如实（一次采样基线不足 ⇒ null——不假装） | 定期采集/缓存表（新机制——否）；用量时序库（另立面——否） |
| KD-SV-93 | **日志 = tail 有界 + 非 TTY 多路复用解复用 + 截断 256 KiB**：解复用判据 = 首字节 ∈ {0,1,2} ∧ 1–3 字节零 ∧ 帧长 ≤ 余量（判不出 ⇒ 原样透传） | 创建面不设 Tty ⇒ 引擎返回 8 字节帧头流；不解复用 ⇒ 输出带二进制残渣；有界 = 读类 3s/连接不悬停 | 强制 Tty 建容器（改既有容器参数——否）；整取无界（拖死连接——否） |
| KD-SV-94 | **拉取 = 同步请求 + 超时 10 分钟 + 失败两形皆收**：引擎非 2xx ∥ 200 流内 `error`/`errorDetail` ⇒ 400 携原文；不做异步任务/进度流（镜像源族 = 独立面——KD-SV-96/97，与拉取路径零耦合） | 取像耗时可分钟级（专用常量——沿 agent 工具面同值）；两形皆收 = 不对引擎行为下注；网络现实如实披露（#1250 另线——零机制） | 15s 动作超时（正常拉取必超时——否）；异步任务 + 轮询（新机制——否）；SSE 进度（新机制——否） |
| KD-SV-95 | **镜像删除 = `ref` 走请求体 + `force` 缺省 false**（`DELETE …/images` 体 `{ ref, force? }`；引擎 409 ⇒ 400 人话引导） | 引用字符集含 `/`/`:`/`@` ⇒ 路径段不兼容；沿 `DELETE /runners/:id` 体参先例；缺省不强删 = 误删爆炸半径最小（409 消息给人话处置） | 路径参数（带斜杠引用不可达——否）；缺省强删（误删面——否） |
| KD-SV-96 | **镜像源清单 = server 全局配置表（`image_sources` v15）+ 与拉取链路零耦合**：源不写节点 dockerd 配置 ∥ 不注入镜像前缀 ∥ 无默认源 ∥ 目录读取 = server 直连源（不走节点 ∥ 不走 `proxy.uri`——本批） | 需求边界「拉取行为不变」（用户 09:17 撤代理后仅剩「管理/浏览」两义）；目录读取发生在 server（server → 源）⇒ 清单位置随读取方；按节点 = 清单 × 节点数（维护复制）且拉取面零消费 | 按节点源清单（重复登记 ∥ 无消费面——否）；源写节点 daemon 配置（改拉取行为——禁）；默认源（零消费面——否）；源读取经节点（节点无目录 API——不可行） |
| KD-SV-97 | **源目录/标签读取 = 标准 v2（`_catalog`/`tags/list`）+ Hub 面（公开 API）+ 匿名 Bearer 挑战 + 有界首页 + 五分类如实报错**（`timeout` ∥ `unreachable` ∥ `auth_required` ∥ `unsupported` ∥ `bad_response`；自含状态形——沿 `/api/admin/proxy/test` 先例） | 本机实测（2026-10-11）：公开源（ghcr ∥ quay ∥ ECR ∥ ACR ∥ SWR）皆 401 + Bearer 挑战 ⇒ 不换取则多数源恒「需认证」；DaoCloud 405 ⇒ `unsupported` 必需；quay 匿名空目录 ⇒ 空非错；Hub 无全站目录 API（官方关闭）⇒ `unsupported` 如实 | 不做 token 换取（预设清单半数不可用——否）；引擎内置 `images/search`（实测已死——否）；Hub 全站目录（官方关闭——不可行）；私有源凭据（本批不做——§15）；统一错误信封（远端事实分类丢——否） |
| KD-SV-98 | **镜像源 UI = 沙盒页新卡（不新开页 ∥ nav 零动）+ 目录浏览弹窗 + 前端过滤（零新端点）**：源表（名/址/面型）∥ 增/改/删弹窗（预选下拉 + 名/址两输入）∥ 浏览窗（仓库列表 ∥ 标签列表——两处过滤输入）∥ 本地镜像表加过滤输入 | 镜像族 UI 家 = 沙盒页（容器区/镜像区同页）；源 = 全局面（非按节点）⇒ 独立卡（非节点展开内）；过滤 = 已载集合纯前端（沿审计/用量页先例）；弹窗复用 `modal.mjs`（KD-SV-31） | 新管理页（nav +1 ∥ 页数链变更 ∥ 一页一职责已足——否）；源卡入节点展开（全局面错位——否）；服务端过滤端点（伪能力——否） |

## 15. 本域边界（不做）

- **镜像源族余项（本批不做——§3）**：私有源凭据（用户名/口令——401 ⇒ 如实报 `auth_required`；本批零凭据面）∥ 源目录「一键拉取」（预填拉取窗——提请裁定；裁定为可 ⇒ 实施轮随批落，≈20 行）
  ∥ 源读取走 `proxy.uri`（本批直连——提请裁定）
  ∥ 保存时探活预校验（读时如实报，不预校验）∥ 子路径源（`https://host/prefix`——形拒）∥ 建容器表单的镜像选择器（清单下拉——与源目录非同件）∥ 源清单与节点的网络可达性交叉校验（server 可达 ≠ 节点可达——如实披露）。
  **已否候选——不排期（非待办）**：默认源语义（零消费面——拉取行为不变；KD-SV-96 被否栏）∥ 分页/排序（有界首页 + `truncated`；§3「不翻页」）∥ 源写入节点 dockerd 配置（改拉取行为——禁；KD-SV-96 被否栏）∥ 按节点源清单（重复登记 ∥ 拉取面零消费；KD-SV-96 被否栏）。

- **CI 实现**（#1216③——与沙盒共用执行面（§14 KD-SV-72）；CI 面不在本批）∥ **#1215 产品面**（web 开发会话 ∥ 移动端 ∥ agent 交互）。
- **盒镜像内容治理**（内容 = 部署面）。
- **入站/端口转发** ∥ **盒间通信**（每工作区独立网络——跨工作区互不可达）。
- **IPv6**（v1 只 IPv4——docker IPv6 关为前置）。
- **项目权限面**（#1216②——接口已留：§4/§9 同守卫点）∥ **多租户** ∥ **per-workspace 独立额度池**（复用成员配额——如需另议）。
- **成员写面**（成员对自己的工作区做启动/停止/销毁/轮换——随 #1216 ② 权限模型；本批只落读面 + 待批提示——§8 成员面）。
- **最小切片余项**（runner-admin-console 批——一行带过，等以后按需再上）：出站闸 ∥ 磁盘限额 ∥ 探针 ∥ 心跳/放置 ∥ Swarm 集群 ∥ WIP 快照 ∥ 待批队列 ∥ 清单下拉（建容器镜像选择器）∥ 工作区↔容器映射（盒）∥ 卷删除 ∥ 资源限额（cpus/mem/pids/磁盘）∥ 端口映射/网络面 ∥ 节点禁用/排空 ∥ TLS（§3 提议①）。
- **托管接入余项（本批不做——§3）**：TLS（`:2375` 明文——沿 §3 提议①）∥ 安全组/防火墙操作（可达性由 S6 自检兜底报告）∥ 节点机既有 Docker 形态的迁移/升级 ∥ 出站闸/磁盘限额后置（随重做批）∥ 批量多机并装 ∥ 任务中途取消。

## 变更记录

- 2026-10-10（**server-exec-sandbox 批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-10-server-exec-sandbox.md` §1 · 台账 #1224；需求 §5 沙盒块 + 用户 14:00 两平面裁定）：建档——两平面形态 ∥ v11 七表 ∥ runner 注册/通道/最小权限 ∥ 放置与牲口语义 ∥ 出站规则单源（两类/两闸/通配/即生效）∥ 待批队列 ∥ 工作区凭据 ∥ 控制台六面（必交面） ∥ 探针套件 P1–P14 ∥ 用例表（N40–N44 ∥ B35–B40 ∥ E29–E33） ∥ 决策 KD-SV-63…72 ∥ 未裁点 U1–U5 + 披露 D1–D4（U1–U5 已于 2026-10-10 14:23 裁定——见 §10）。**产品码零触（设计轮）**。
- 2026-10-10（**server-exec-sandbox 批 · 裁定收正 · eng-designer**——用户 14:23「都按建议」；承批档 `docs/batches/2026-10-10-server-exec-sandbox.md` §1 · 14:23 裁定节）：§10 收正为「已裁决策」（U1–U5 逐行裁定值）∥ §4/§5/§8 三处标签同拍 ∥ D1–D4 保持（用户未异议——按设计实施）。**产品码零触**。
- 2026-10-10（**server-exec-sandbox 批 · 裁定收正 · eng-designer**——用户 14:24 裁定「thincoder server启动应该是不依赖沙盒的」）：§1 补「server 启动与运行零依赖沙盒/runner」句 ∥ §1/§14 可用性门显式限定「仅沙盒功能面不可用」。机制句零改。**产品码零触**。
- 2026-10-10（**server-exec-sandbox 批 · 设计评审轮 1 修正（fix 轮）· eng-designer**——承批档 `docs/batches/2026-10-10-server-exec-sandbox.md` §3 轮次 1 十五发现之 1–14 + 用户当日并入 A 节）：#1 每工作区资源档落机制（`limits_json` ∥ PATCH 写端点 ∥ 取值序 ∥ create 载荷 ∥ N45）∥ #2 默认单单源收正（= `sandbox_rules` 种子行；settings 键撤——§2/§4/§8）∥ #3 冲突序限定「显式 deny 恒先」+ 种子 deny ≺ 显式 allow（§4/§10）∥ #4 轮换 = 卷保留的容器重建（P13 补新 key 半支 ∥ E31 随正）∥ #5 join token 落点 = 进程内存 + 重启作废（N40/E30 随拍）∥ #6 `requireRunner` 守卫落点钉定 + 预算行（session.mjs）∥ #8 AC-36 标记收正（已落需求档）∥ #10 指令悬挂回收（§3 + B41）∥ #13 P8 改结构判据（canary 真值不下行）。A 节 = A1 成员面（§8 成员面 + `#/me/sandbox`）/ A2 加入流程三件 / A3 牵连计数随正（档目 33 ∥ 34）。**零新语义**（评审发现直接导出项 + 用户直令）。
- 2026-10-10（**server-exec-sandbox 批 · checkpoint 通路口径 fix 轮 · eng-designer**——2026-10-10 裁定落档）：§5 上送句补通路口径（octet-stream ∥ 路由级 200 MiB ∥ 流式落盘——`gateway/API.md` §2.6）；§13 B40 保持（未触——与路由上限同值）。**产品码零触**。
- 2026-10-10（**runner-admin-console 批 · 设计档随正 · eng-designer**——承批档 `docs/batches/2026-10-10-runner-admin-console.md` §1 · 台账 #1252；用户 2026-10-10 19:52–19:56 口径「runner = 远程 Docker API 节点」）：执行面重定随正——§1 两平面口径重写 ∥ §3 重写为「节点登记（最小接入面）」（添加/删除 + 连通自检；托管接入 = 需求在册，归 #1236/#1237）∥ §2 列面/审计/修订号随正 ∥ §4/§5/§6 执行机制句清（强制机制归重做批）∥ §8 运行面/§9 端点判权随正 ∥ §10 U1 改判（Docker）∥ §11 判据去探针引用 ∥ §12 红队探针套件删（需求 AC-36 ⑦ 判据待重做批重建）∥ 用例表随正；旧 §13–§16 顺移 ⇒ **§12–§15** ∥ §14 决策面：KD-SV-64/65/66/75 作废、63/67/68/69/71/72 收正、73/74/76 自 `RUNNER.md` 迁入本表 ∥ §13 预算表去执行面条目；`sandbox/RUNNER.md` 已删（迁移期引文——执行面重定）。**产品码零触**。
- 2026-10-10（**runner-admin-console 批 · A 批最小切片设计 · eng-designer**——承批档 `docs/batches/2026-10-10-runner-admin-console.md` §1 · 台账 #1252；用户 19:59 令）：§3 重写为「节点与容器（最小切片）」（添加节点 ∥ 运行面读数 ∥ 建容器 ∥ 容器读取与动作 ∥ 删节点 ∥ 提议与自加项六条＝父侧提议三 + 设计自加三）∥ §2 补「容器不落表」句 ∥ §8① 运行面落定 ∥ §9 节点/容器面错误形一句 ∥ §11 增最小切片判据行（真机 10.0.0.6）∥ §12 增用例（N46–N48 ∥ B41–B43 ∥ E34–E36；N40 收正）∥ §13 预算随正（+ `docker.mjs` 拟新增；批内件两件随正——旧两件已随执行面清除）∥ §14 增 KD-SV-79/80/81 ∥ §15 增最小切片余项。**产品码零触（设计轮）**。
- 2026-10-10（**runner-admin-console 批 · 托管接入（管理面 agent）设计 · eng-designer**——承批档 §2 · 台账 #1236/#1237；用户 22:19–22:29 四句 + 15:00/15:02 裁）：§3 增托管接入块（步骤表 S1–S8 ∥ 两径 ∥ 探明十项 ∥ 凭据定形 ∥ 硬点① 网络路径 ∥ 提议 ⑦–⑬）∥ §2 增 `sandbox_onboarding` 行 + 审计 kind 句 + 版本链（v11–v13）∥ §8①/§9 随正 ∥ §11/§12 增判据与用例（N49–N52 ∥ B44–B46 ∥ E37/E38）∥ §13 预算随正（+ ssh/onboarding/onboarding-routes 三档）∥ §14 增 KD-SV-83/84/85/86 ∥ §15 边界换向（托管装机退出余项、增托管接入余项）。**产品码零触（设计轮）**。
- 2026-10-10（**runner-admin-console 批 · 设计评审轮 1 修正（fix 轮）· eng-designer**——承批档 `docs/batches/2026-10-10-runner-admin-console.md` §3 轮次 1 之 1/3/4/5/11/12）：#1 §1 执行面句探活表述收窄（**盒级超时/快照 = 控制端定时器（余面批）**——节点存活 = 读时探活，与 KD-SV-80 对齐；历史 = 本记录）∥ #3 §14 作废行（KD-SV-64/65/66/75）删净（编号留空档）∥ #4 §13 增 `routes.mjs` 拆分预案（触发点 >500 ∥ 余量 ≈50 ∥ 候选拆法 = 容器面路由独立成档（首选）∥ 节点面备选）∥ #5 §13 routes 行注明托管接入四端点转注册（`bin` ±0）∥ #11 §3 连通自检补引导步（无前缀版本读数 → 协商 → 复读）+ §14 KD-SV-81 同拍 ∥ #12 §3 凭据放置条补宿主前提（`sshpass` 缺 ⇒ S2 停 + 报因——检查并报）。**零新语义**（评审发现直接导出项）。
- 2026-10-11（**runner-admin-console 批 · 真机走查缺陷修复（fix 轮）· 父侧**——承批档 §6 走查记录；真机三连核 `/version`=200 ∥ `/v1.44/version`=200 ∥ `/1.44/version`=404）：**版本前缀形 = `v<ver>`** 随正（§3 连线口径 ∥ §3 自检步/运行面读数/建容器 ∥ §3 S5/S6 判据 ∥ §14 KD-SV-81）；地址归一 scheme 判定收严至 `://`（主机名形地址可入——与「缺协议补 `http://`」对齐）；同拍 = `routes.mjs` 头注。**产品码触 = `docker.mjs` 两处 + `routes.mjs` 头注**。
- 2026-10-11（**runner-admin-console 批 · 真机走查缺陷修复（fix 轮二）· 父侧**——承批档 §6 走查记录；真机 A/B 核）：**口令径去 `BatchMode`**（§3 S2 行 ∥ §14 KD-SV-85）——`BatchMode=yes` 下 openssh 直接弃用口令面（A：`Permission denied (publickey,password)` ∥ B：去之 `LOGIN_OK`）。密钥径保持 `BatchMode=yes`。**产品码触 = `ssh.mjs` 口令径一条**。
- 2026-10-11（**admin-agent-chat 批 · 设计评审轮 1 修正（fix 轮）· eng-designer**——承批档 `docs/batches/2026-10-11-admin-agent-chat.md` §3 轮次 1 之 1–3/5–11）：闸面收净（doc-check 行宽读数）——§3 连线口径行折行（330 ⇒ ≤300；本笔 = 非本批面之闸面清尾——父侧如异议可 revert）。**零语义**。
- 2026-10-11（**sandbox-docker-admin 批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-11-sandbox-docker-admin.md` §1 · 台账 #1265；用户 2026-10-11 04:36/04:39 两族同批）：§3 增「容器面补齐 + 镜像族」块（八端点 ∥ 自加项表六条）∥ §8① 容器区/镜像区随正 ∥ §11 增判据行 + 机检口径句改指针（单源 = `webui/WEBUI.md` §6；陈值「档目 33 ∥ 34」删）∥ §12 增用例（N53–N56 ∥ B47–B50 ∥ E39–E41）∥ §13 预算随正（routes 493 ⇒ ≈496 ∥ container-routes 168 ⇒ ≈330 ∥ image-routes 新 ≈130 ∥ docker 187 ⇒ ≈330）+ 拆分预案收正（首选已执行）∥ §14 增 KD-SV-92–95。**产品码零触（设计轮）**。
- 2026-10-11（**sandbox-docker-admin 批 · 设计评审轮 1 修正（fix 轮）· eng-designer**——承批档 `docs/batches/2026-10-11-sandbox-docker-admin.md` §3 轮次 1 之 1/2/3/6）：#1 §15 余项去「镜像管理」（已交付——列表/拉取/删除）；「清单下拉」（建容器镜像选择器）转列余项 ∥ #2 §12 增 B51（超 256 KiB ⇒ `truncated: true`）∥ E42（五端点节点不可达 ⇒ 502）+ §11 判据行随拍（B47–B51 ∥ E39–E42）∥ #3 删除条 detail 改单源指针（`accounts/ACCOUNTS.md` §2.1）+ N54/N56 键集指针同拍 ∥ #6 §13 两行分项闭式收平（+≈162：路由注册与头注≈24；image-routes：头注≈15）。**零新语义**（评审发现直接导出项）。
- 2026-10-11（**sandbox-image-sources 批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-11-sandbox-image-sources.md` §1 · 台账 #1274；用户 2026-10-11 09:17 四点（④ 撤）+ 09:19 预选）：§3 增「镜像源族」块（源清单四端点 + 预选 ∥ v2/Hub 两面读取 ∥ 匿名 Bearer 挑战 ∥ 有界首页 ∥ 五分类如实读绪 ∥ 自加项表五条）；§2 增 `image_sources` 行（v15）+ 审计三 kind + 读数收正（`db.mjs` 458——本批现读）；§8① 增镜像源卡 + 本地镜像表过滤句；§9 增镜像源面句；§11 增镜像源族判据行；§12 增用例（N57–N59 ∥ B52–B55 ∥ E43–E45）；§13 预算随正（+ 三新档；image-routes/db/bin 三行读数收正）+ 小计链补本批 ≈+604；§14 增 KD-SV-96/97/98 + **KD-SV-94 收正**（去「不做镜像源」半句——镜像源族 = 独立面）；§15 增镜像源族余项行。**产品码零触（设计轮）**。
- 2026-10-11（**sandbox-image-sources 批 · 设计评审轮 1 修正（fix 轮）· eng-designer**——承批档 `docs/batches/2026-10-11-sandbox-image-sources.md` §3 轮次 1 之 1/4/6/7/8/9/10）：#1 §13 routes 行批次名写实（sandbox-docker-admin 批 +3；本批 ±0；`:342`/`:361` 同拍）∥ #4 §12 增 B56（`bad_response`——远端 200 非 JSON/形不符）+ §11 判据行五分类对齐（用例链随拍 B52–**B56**）∥ #6 §13 补本批件两件估（≈420 ∥ ≈280——沿上批之例）∥ #7 §13 audit 行 delta 清单值（**±0**——本批）+ 陈值来源注（托管接入批）∥ #8 `:145` 指涉全限定（`accounts/ACCOUNTS.md` §2.1）∥ #9 §15 已否候选归位（默认源语义 ∥ 分页/排序——不排期，非待办）∥ #10 §13 db 行补余量注（≈10——实施后复读；越 500 ⇒ 同轮补拆分预案）。**零新语义**（评审发现直接导出项）。
