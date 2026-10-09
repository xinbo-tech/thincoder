# 2026-10-09 · server-console-config
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-09 · 来源 = 用户 2026-10-09 15:51–15:52 两令（「服务器端proxy.url在哪里设置？代理没给配置界面。」+「任何配置项要给配置界面这他妈的不应该是常识吗？！」）+ 15:57「开批」= 立批；需求源 = 台账 #1139（合并 #1138 ∥ #1123）；定则之提示词面入册已另轮完成（轮档 `docs/batches/2026-10-09-prompt-common-config-ui.md` · #1140）。
> 台账 = #1139（server · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**用户裁定（2026-10-09 16:19）**：问「host/port/db 是啥？」+ 答后裁「**这几个只读吧。**」——`host` ∥ `port` ∥ `db` = **只读展示**（定则「例外须显式说明并经用户裁」履行完毕）。设计 §2.1 例外面照此定稿（零改）；写面维持配置文件 + 重启路（设计 `ops/OPS.md` §1「配置写面」块）。

**授权（2026-10-09 16:20）**：用户「**自动跑完**」——射程 = 本批全链自动：① 设计评审点火权（代点火）② §4 批准权（代签）③ 修正轮/实施轮派发 ④ 收口核销 ∥ 提交 ∥ 推送 ∥ token 耗 ∥ 部署收尾（ECS 镜像重建 + 重收敛 + 浏览器实走——设计 §9 R46④ 在册）；排空模式（无时限，到收口）。

**父侧自缚三条（本仓惯例 · 先例同形）**：① 代签仅当三条件齐备（评审 pass 0🔴 ∧ 修正轮已落地并逐条核验 ∧ token 已签发）；② 新范围 ∥ 用户口径裁决 ⇒ 停、只摆那一条；③ 破坏性/不可逆（数据 ops ∥ 强杀 ∥ 外仓写）⇒ 先停。**注**：ECS 测试箱镜像重建 + v10 迁移 = 本批已声明射程内（R46④ 在案）——按常规部署动作执行。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（修复轮 1 已落——评审 #1–#11 逐号收正（含 🔴 容器路挂载形）；机检 EXIT 0；待复评（轮 2））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目（覆盖——台账 #1139 全部缺口 ∥ 并入 #1138 ∥ #1123）

- 覆盖 ① **配置项全量可视/可写**（用户定则「任何配置项必须有配置界面」——15:51–15:57 三连）：host/port/db（只读展示——定则例外显式说明）∥ autoUpdate ∥ trustProxy ∥ usageRetentionDays ∥ proxy.uri ∥ embedding.{baseURL,model,apiKey}。
- 覆盖 ② **代理界面**（#1138 并入）：proxy.uri 写面（系统页「服务配置」卡）+ provider 勾选框文案改向（「走代理」提示指向「系统 → 服务配置」——界面文案不得指向界面外入口）。
- 覆盖 ③ **WEBUI.md「拟新增」翻正**（#1123——机械面）：**复核结论 = 盘面零「拟新增」残留**——目标十行（`dom.mjs` ∥ `health.mjs` ∥ i18n 八部件）实读在场（`webui/WEBUI.md` §5；逐行复核）；翻正动作 = 无（原报坐标 :487/:488/:506–:514 为晨间报告时点坐标系，现盘不重现该场景）。
- 覆盖 ④ **审计面**：新事件型 `config_update` 入册（v10 迁移——`audit_events` CHECK 扩型表重建）+ 审计页十型。
- 本批不做（外显）：配置热载/运行态注入 ∥ host/port/db 写面 ∥ 配置版本史/回滚 ∥ 写前备份 ∥ 多实例并发写（不做面 = 各域档 §8/§10）。

### 2.2 设计档落点（已落盘——逐处）

- `docs/server/design/ops/OPS.md`：§1 增「配置写面」块（可写/只读项表 ∥ 文件面读写 ∥ 写路径五步 ∥ 重启生效统一 ∥ 单写者）∥ §5.1 门禁件数 31 ⇒ **32** ∥ §6 预算（bin ⇒ ≈180 ∥ README ⇒ ≈262 ∥ 小计 +≈12）∥ §7 增 AC-28 判据行 ∥ §8 增配置面不做项 ∥ §8 增 **KD-SV-56** ∥ §9 增 B32（写后重启生效）∥ 变更记录 +1。
- `docs/server/design/gateway/API.md`：§1 路由表控制台数据面行 ∥ §2.4 端点族 + 两端点行（`GET` ∥ `PATCH /api/admin/config`）+ `POST /api/admin/embedding/test` 行补草稿三项明传优先 ∥ §4 预算（`config-admin.mjs`（本批新增）≈160 ∥ embedding-admin ⇒ ≈108；小计 ⇒ ≈1844）∥ §5 增 AC-28 行 ∥ §7 增 N31/B23/E23/E24 ∥ §8 增配置面不做项 ∥ 变更记录 +1。
- `docs/server/design/webui/WEBUI.md`：§1 静态面（+ `views-system-config.mjs`——JS 二十八档）∥ §2 IA 表系统行 ∥ §2.1 五节重写（+「服务配置」卡 ∥ 向量卡配置面）∥ §2.2 键族登记（+29 键/表 ∥ `useProxy` 改值）∥ §2.3① 随正 ∥ §2.4④ 勾选框文案改向 ∥ §5 预算（新档 ≈130 ∥ `views-system` ⇒ ≈230 ∥ i18n 两表 ⇒ ≈151/表；小计 ⇒ ≈3975）∥ §6 增 AC-28 两行 + AC-15① 补配置面 + 档目链十二处随正（**30 ∥ 31**）∥ §8 增不做面 ∥ 变更记录 +1（含 #1123 复核句）。
- `docs/server/design/store/STORE.md`：§1 结构版本 9 ⇒ **10** ∥ §2 标题随正 + 增 v10 增段（`audit_events` CHECK 扩型——表重建 SQL 逐字 ∥ 语义/圈界）∥ §3 迁移链补 v10 段（判据）∥ §4 预算（db 实读 231 ⇒ ≈256）∥ 变更记录 +1。
- `docs/server/design/PROJECT.md`：§2.1 gateway 行十二 ⇒ **十三**档（+ `config-admin.mjs`）∥ webui 行二十九 ⇒ **三十**档（+ `views-system-config.mjs`）∥ §4 索引增 KD-SV-56（标题 1–55 ⇒ 1–56）∥ §6 添本批预算行 ∥ §9 增 R46（需求档回笔 ∥ 随正件 ∥ 披露 ∥ 部署收尾）∥ 变更记录 +1。
- **需求档（主 agent 笔——本设计不改）**：回笔清单 = §9 R46①（功能点 28 + AC-28 + 计数 二十七条 ⇒ 二十八条 + AC-15① 微调建议 + 变更记录）。

### 2.3 机制设计（摘要——全文 = 各域档）

- **形态 = 文件面读写 + 重启生效**（KD-SV-56）：GET `/api/admin/config` 读 config.json（有效值——文件值 ?? 缺省回填；密钥掩码 = `env:` 保形 ∥ 明文 ⇒ `…`+末 4 ∥ 空 ⇒ `""`；bootstrap 口令面零列）；PATCH 白名单五键（未知键 ⇒ 400），合并原档**保未知键**（`proxyUri: ""` ⇒ 删 `proxy` 段），门 = `resolveEnvRefs` + `validateConfig`（**载入面等价两跳**——写入的文件必可载入），**原子写**（同目录 tmp ⇒ `rename` 覆盖；落盘形 = 2 空格缩进 + 末尾换行同现档），失败 ⇒ 文件零变；单写者（进程内同步 + 部署单实例；跨进程并发 = 不做）。
- **生效口径 = 全部可写项统一「重启生效」**（文件不热载——OPS §10 不破；本批不做运行态注入）。父侧前提纠正（设计轮实读）：`autoUpdate` **非按拍读取**——`update.mjs` 建器时快照（:170–173 邻）；信任 proxy/usageRetentionDays/embedding 等运行时读者在本批亦随重启（统一语义，零真值表分叉）。
- **控制台面**：系统页五节（版本/更新 ∥ 接入卡 ∥ 向量服务 ∥ **服务配置**（只读三行 ∥ 可写四项 ∥ providers/bootstrap 指针行 ∥ 保存）∥ 服务健康）；向量卡 = 配置面（三输入 ∥ 保存 ∥ **草稿探活**——`POST /api/admin/embedding/test` 标量三项明传优先（KD-SV-54 口径镜像）；未保存亦可先验）。
- **审计**：`config_update`（`AUDIT_TYPES` +1；`audit_events` CHECK 扩型——v10 表重建；detail = 键名清单、**值永不入**）；写盘成功后一条（审计失败 ⇒ warn，不反噬已落盘事实）。
- **i18n**：+29 键/表（`system.*` 配置族 ≈23 ∥ `vector.*` 4 ∥ `audit.*` 2）+ `admin.providers.useProxy` 两表值改。

### 2.4 受影响文件与测试面

- 产品面 ≈+470：**新增** `src/gateway/config-admin.mjs` ≈160 ∥ `public/views-system-config.mjs` ≈130；**改** = `embedding-admin.mjs` 96 ⇒ ≈108 ∥ `accounts/audit.mjs` 108 ⇒ ≈109 ∥ `store/db.mjs` 231 ⇒ ≈256 ∥ `bin/thincoder-server.mjs` 178 ⇒ ≈180 ∥ `views-system.mjs` 175 ⇒ ≈230 ∥ `views-audit.mjs` 91 ⇒ ≈94 ∥ `i18n-{zh,en}-system.mjs` 122 ⇒ ≈151/表 ∥ `i18n-{zh,en}-admin.mjs` 138 ∥ 142 ⇒ ±0 ∥ `style.css` 228 ⇒ ≈232 ∥ `README.md` 252 ⇒ ≈262 ∥ `config.example.json` ±0 ∥ `package.json` ±0（`prepublishOnly` 清单 31 ⇒ **32**）。
- 档目 = 29 ∥ 30 ⇒ **30 ∥ 31**（+ `views-system-config.mjs` 一档）。
- 批内件：`docs/batches/2026-10-09-server-console-config.test.mjs`（估 ≈450 行——helper 直测 ∥ 端点机检 ∥ v10 迁移 ∥ i18n 键集 ∥ 零 CJK 扫描面；入链 31 ⇒ 32）。
- 随正件（父侧落——实施轮同拍）：档目断言件十件（结构轮注⑫①名单——列表 + `views-system-config.mjs`）∥ 门禁件数断言件（31 ⇒ 32）∥ v10 读点（`-server-gateway` 等）；名单以实施当刻盘面为准。

### 2.5 验收对照（AC-28——候补行；判据域档）

- `webui/WEBUI.md` §6 AC-28 两行（① 页形/全项∥② 值渲染 = 文件面∥③ 保存往返 + 非法 400 零变∥④ 重启标注统一∥⑤ 密钥掩码∥⑥ 草稿探活∥⑦ 审计∥⑧ 文案改向；续行 = 机检口径）。
- `gateway/API.md` §5 AC-28 行（GET 文件面 ∥ PATCH 白名单/保未知键/校验门/原子写/审计/round-trip；用例 = §7 N31/B23/E23/E24）。
- `ops/OPS.md` §7 AC-28 行（写路径机检 ∥ 写后 GET 回读逐值 ∥ 单写者 ∥ 生效标注）∥ §9 B32（写后重启 ⇒ 启动按新值）。
- 与需求档同拍：功能点 28 + AC-28 = 主 agent 回笔（§9 R46①）。

### 2.6 关键决策

- **KD-SV-56**（全文 = `ops/OPS.md` §8）：配置控制台 = 文件面读写 + 重启生效 + 原子写 + 校验单源 + 单写者；host/port/db 只读（定则例外显式）。被否候选：运行态注入（部分热生效——逐消费点快照差异 ⇒ 语义碎片 + 触「不重构 config 加载」红线）· 内存主/文件辅（双源漂移）· host/port/db 可写（改端口 = 自断 ∥ 改库 = 迁移）· 版本史/回滚（零需求新存储面）· 写前备份（部署面 §5.5 已有）。
- 附带决策：审计型 `config_update`（v10 表重建——CHECK 不可改；detail 仅键名）；探活草稿口径沿 KD-SV-54 镜像；新档拆解（views-system-config——300 软线）。

### 2.7 自检

- 需求五元素（需求档 = 主 agent 笔）：本批 = 候补回笔（R46①）；设计不阻塞。
- 设计 8 项齐：① 途径与理由（KD-SV-56 全文）② 接口契约（API §2.4 两端点 + 数组形逐字）③ 受影响文件清单（§2.4——逐档现值 + 预期增量；跨档无一破 500）④ 关键决策（KD-SV-56 + 附带）⑤ 验收回指（§2.5 三域档行）⑥ 用例（API §7 N31/B23/E23/E24 ∥ OPS §9 B32）⑦ 边界（OPS §10 ∥ API §8 ∥ WEBUI §8）⑧ UI 决策已落（页面形态/交互全定——无 open 项）。
- 三链一致：批档条目（§2.1）= 设计判据（§2.5）= 需求候补回笔清单（R46①）——同源。
- 写作纪律：零修订式表达（无删除线/「已改判」尸体）；引用 = doc:section。

### 2.8 上抛项（提请评审/用户留意——如无异议按设计实施）

- ① **生效口径 = 统一「重启生效」**（含 trustProxy/usageRetentionDays/embedding 等运行时逐请求读者——本批不做运行态注入）；若要求部分热生效 ⇒ 翻案点（逐项真值表 + 运行态注入机制另议）。
- ② `GET /api/admin/embedding`（运行值读取）UI 消费者退场（配置面读取改经 `/api/admin/config`——端点契约零动、零退役）；是否收敛退役 = 另议。
- ③ #1123 复核 = 盘面零「拟新增」残留（十行实读在场）；如按原报坐标复核将不重现（坐标系 = 晨间报告时点）。
- ④ 需求档 AC-15① 微调建议（向量卡读法 = 配置面 + 草稿探活）——随回笔（R46①）。

### 2.9 机检读数（设计交付前——`node scripts/doc-check.mjs`）

- **闸态**：悬空 **0**（OK 锚——阈值 0）∥ 本批面行宽 **零**（交付前六处机械拆行——`PROJECT.md` §6 预算块 ∥ `OPS.md` §1/§5.1 ∥ `WEBUI.md` §2.1/§2.2——零语义）∥ 拟新增 29 件（含本批两新档 `config-admin.mjs` ∥ `views-system-config.mjs`——列报 · 不入闸）。
- **遗留（非本批面——上抛父侧路由）**：`docs/core/design/PROMPT-SYSTEM.md:563`（328 字符）∥ `:876`（438 字符）——两行超宽既存（非本批改动；core 文档面，本舱不写）。
- 批档注记：§2 首块「（本批新增）」措辞与设计档二处同拍改「（拟新增）」（锚检豁免标记）——零语义。

### 修复轮 1（设计评审轮次 1 #1–#11 逐号收正）——eng-designer · 2026-10-09

承 §3 轮次 1（changes-required：🔴×1 ∥ 🟡×4 ∥ 🔵×6 = 11 项——全数采纳）。逐号落点（坐标 = 修复后当刻盘面）：

- **#1（🔴）容器路挂载形收正**——`ops/OPS.md`：§5.1 样例卷行 ⇒ `- ./config:/app/config`（目录级 rw；单文件挂载下原子写（同目录 tmp ⇒ `rename`）换不了挂载点 ⇒ 保存必失败——形改后该未验证面消解）+
  增「容器路配置形（写面前提）」注（`:137-139`：配置档 = `/app/config/config.json`（entrypoint 传 `--config`） ∥ 容器路 `db` 取绝对值 `/app/data/gateway.db` ∥ 随正件（`.dockerignore` ∥ 仓根 `.gitignore`） ∥ 既有部署迁移四步）；
  §1 `:64` 补写面前提句 ∥ §1 `:116`/`:118` 随正 ∥ §5.3 `:153` 卷句随正 ∥ §5.5 `:188` 备份命令 ⇒ `--config /app/config/config.json` ∥ §5.7 `:202-203` Docker 路 ③ 步随正（`config/` 目录 ∥ chown ∥ db 绝对形）。
  形选说明：取 `/app/config`（评审建议形 = `/config`；评审授权具体形自定——取与既有 `/app/data` 同根，部署面语义单根）。
- **#2**——`ops/OPS.md` §8 `:270` 补 **KD-SV-56** 行（决策/理由/被否候选——素材 = §2.6 + §1 块）——全档六处「§8 KD-SV-56」引注解悬。
- **#3**——`webui/WEBUI.md:129` 类型下拉 ⇒「全部 + **十型**」+ 详情模板补 `keys` 支（配置变更键名清单）。
- **#4**——`gateway/API.md:102`（PATCH 行）明写 `embedding` 子键级语义（缺省 = 不动 ∥ 明填 = 替换——`apiKey: ""` = 显式空）+ 掩码/引用回显形三态（未编辑 ⇒ 不携 ∥ 编辑 ⇒ 明传 ∥ 清除勾 ⇒ `""`）；
  `gateway/API.md:100`（test 行）补探活侧同口径 ∥ `webui/WEBUI.md:53`/`:54` 同拍（三态 + 探活侧不携 ⇒ 运行配置回落）。
- **#5**——`design/PROJECT.md` §6 增**注⑬**（`:270-276`——随正件逐一登记：档目断言件十件 ∥ 门禁件数断言件七件（31 ⇒ 32） ∥ v10 读点 ∥ 逐件实读 2026-10-09 ⇒ ≤±N；新批内件一件 ≈450 行）；
  §6 本批块 `:194` 末补「随正件/批内件行数注 = 注⑬」∥ §9 R46② `:372` 补行数注指针 ∥ `webui/WEBUI.md:557` AC-28 续「清单 = §6 本批行」⇒「清单/行数注 = §6 注⑬」（实际落点）。
- **#6**——`store/STORE.md:12` 版本枚举补 v9 条（`providers.proxy`——server 代理批）。
- **#7**——算术配平：`gateway/API.md:133` 小计 +≈180 ⇒ **+≈172**（= 160 + 12——分项闭式）∥ ≈1844 ⇒ **≈1836**；`webui/WEBUI.md:527` 小计 ⇒ **≈3978**（+≈250 = 130+55+58+3+4）；
  同源随动 = `design/PROJECT.md:188`（gateway ≈+172 ∥ 产品面 ≈+467）∥ `:192`（ops ≈+19）∥ `ops/OPS.md:237`（小计 +≈19）。
- **#8**——`design/PROJECT.md` `:194`/`:195` 重复行删一（保留行并收正）。
- **#9**——`design/PROJECT.md:200` 板级行随正到现值链（`30 ⇒ 31 ⇒ **32 件**`；组成式 =「后续各批 18 ⇒ 19 件——本批件入链」——与 §6 本批行 `:193` ∥ `ops/OPS.md:109-110` 同拍；机读实核 = `package.json` 现册 **31** 件 + 本批件）。
- **#10**——`webui/WEBUI.md:510` `views-audit.mjs` 行补本批增量（实读 91 ⇒ ≈94——十型接 +≈3）。
- **#11**——`webui/WEBUI.md:538` AC-15① 删「配置真值行」（无设计落点元素——配置面 + 草稿探活替代读法）。

**实施轮（eng-coder）产品面改动清单（本修轮只列不动）**：

- `thincoder-server/docker-compose.yml`：卷两行 ⇒ `- ./config:/app/config` + `- ./data:/app/data`；用法注释随正（备好 `./config/`（内含 config.json——目录须可写）；`db` 写 `/app/data/gateway.db`）。
- `thincoder-server/deploy/docker-entrypoint.sh`：`exec thincoder-server --config /app/config/config.json`（±0 行）。
- `thincoder-server/README.md`：容器路配置目录前提（可写挂载 ∥ `db` 绝对形）随正。
- `thincoder-server/.dockerignore`：+ `config/`（构建上下文防泄）∥ 仓根 `.gitignore`：+ `thincoder-server/config/`（自仓运行场景）。
- `thincoder-server/config.example.json`：±0（零改——容器路 `db` 绝对形在部署步/README 注明）。

**ECS 侧动作（父侧部署轮照办——测试箱 `~/thincoder-server-deploy/`）**：

1. 重建镜像（含 entrypoint 新路径——先决）：`docker build -t <registry>/thincoder-server:<tag> .`（构建上下文 = `thincoder-server/`）。
2. `mkdir -p config && mv config.json config/config.json`（配置档入目录）。
3. 改 `config/config.json`：`"db": "/app/data/gateway.db"`（绝对形）。
4. 改 `docker-compose.yml` 卷两行 ⇒ `- ./config:/app/config` + `- ./data:/app/data`（注释随正）。
5. `chown -R 1000:1000 ./config`（`./data` 已 chown 保持）。
6. `docker compose up -d` ⇒ `docker compose ps` 见 `(healthy)`。
7. 浏览器实走（AC-28 收口项）：`#/admin/system` 服务配置卡改一项 ⇒ 保存 ⇒ flash「已保存——重启服务后生效」⇒ 重启复核值仍在；向量卡草稿探活一次。
8. 失败面备查：保存 500 ⇒ 核 `./config` 权限 ∥ 挂载行；`docker compose logs` 见 `config_update` 审计行（detail = 键名清单）。

**机检（修复后 · 2026-10-09）**：`node scripts/doc-check.mjs` ⇒ **EXIT 0**——锚（闸态）0 悬空 ∥ 行宽 OK ∥ 行数面差异 0；拟新增 29（原样）。写入面 = 五设计档 + 本段；产品档/需求档零触（需求档回笔 = R46①——主 agent 笔）。

- 补正（交底自查——2026-10-09）：① 上文 #2 句「六处引注」应作**七处**（`ops/OPS.md` :64 ∥ `ops/OPS.md` 变更记录 ∥ `gateway/API.md` 变更记录 ∥ `webui/WEBUI.md` 变更记录 ∥ `design/PROJECT.md` :143 ∥ :194 ∥ :429）——全部解悬（KD-SV-56 行在盘）。
- **射程外发现（供父侧路由——本修轮未写）**：`accounts/ACCOUNTS.md` 审计面未随 v10——§2.1 事件目录十型表缺 `config_update` 行（与 `store/STORE.md:234`「语义与写入点 = `accounts/ACCOUNTS.md` §2.1」∥ STORE 变更记录「同源随动 = `accounts/ACCOUNTS.md` §2.1（事件型/写入面）」两处自述不符）；同档多处「九型」表述待随正（`:21` ∥ `:64` ∥ `:124`/`:125` ∥ `:138` KD-SV-28）。处置候选 = 另轮收口（五档射程外，勿静默夹带）。

- ECS 侧动作补记（#1 续）：如 `~/thincoder-server-deploy/docker-compose.yml` 仍持 `entrypoint:` 覆盖件（R43② 绕行残留）⇒ 一并移除——否则 entrypoint 新 `--config` 路径不生效（保存必失败）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

评审对象 = 五档设计（`webui/WEBUI.md` ∥ `gateway/API.md` ∥ `ops/OPS.md` ∥ `store/STORE.md` ∥ `design/PROJECT.md`）+ 批档 §2；逐档实读 + 抽查预算注释 + 跨档引用核对（机检面：悬空引用、计数、行数注）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Feasibility | 🔴 | 容器路配置档只读挂载与新写面互斥：compose 样例 `ops/OPS.md:132` = `- ./config.json:/app/config.json:ro`，而写面落点即该档（`ops/OPS.md:63`「原子写（同目录 tmp ⇒ `rename` 覆盖」；`gateway/API.md:102` PATCH ⇒ 原子写）；本批未改样例（`ops/OPS.md:232`「+≈12（配置控制台批：bin +≈2 ∥ README +≈10；余档 ±0」）、未写「配置档须可写」前提；收口项含容器路浏览器实走（批档 `docs/batches/2026-10-09-server-console-config.md:11` ∥ `docs/server/design/PROJECT.md:366` R46④）⇒ 该部署下 AC-28③「保存 ⇒ 文件落盘」不可达（失败面 = 500 + 文件零变——功能不可用；本机单测不暴露）。 | 把 compose 样例的配置档挂载改为可写（目录级挂载为宜——`chown 1000:1000` 注同拍 `ops/OPS.md:133`），并在部署清单/README 补「配置档须可写」前提；或显式声明容器路写面前提与失败面（二择一落一款）。rw 单文件挂载下 `rename` 覆盖可行性一并核（未验证——非本档可证）。 |
| 2 | Document ownership | 🟡 | KD-SV-56 行在 `ops/OPS.md` §8 缺失（§8 表 8 行止于 `ops/OPS.md:264` KD-SV-53），而多处把「§8 KD-SV-56」当决策全文落点：`ops/OPS.md:64`「决策 = §8 KD-SV-56」、`ops/OPS.md:335`、`gateway/API.md:259`、`webui/WEBUI.md:668`、`docs/server/design/PROJECT.md:143`（载体列 = `ops/OPS.md` §8）、`PROJECT.md:194`/`:195`、`PROJECT.md:424`；批档 §2.2（`docs/batches/2026-10-09-server-console-config.md:29`「§8 增 **KD-SV-56**」）与 §2.6 同称——指针全悬空。 | 在 `ops/OPS.md` §8 表补 KD-SV-56 行（决策/理由/被否候选——素材 = 批档 §2.6 已在盘）；或把各引注统一改指实际落点（勿两存互异）。 |
| 3 | Document ownership | 🟡 | 审计面在规范面未随正（同机制两处描述不同）：`webui/WEBUI.md:129` 仍「类型下拉（全部 + 九型）」+ 详情模板「（IP ∥ 维度 ∥ key 提示形 ∥ 角色）」，而本批定案 = 十型（`webui/WEBUI.md:557`「十型表接（`config_update` 键 ∥ 详情模板 `keys` 支）」、`webui/WEBUI.md:103`「`audit.*` 两键（`type.config_update`/`keys`）」；`store/STORE.md:234` 明指消费落点 = §2.3④）。 | `webui/WEBUI.md` §2.3④ 随正为「全部 + 十型」并在详情模板列举补 `keys` 支（与 §2.2 键族/§6 AC-28 续/STORE v10 同拍）。 |
| 4 | Clarity | 🟡 | `embedding` 子键三态未钉：`gateway/API.md:102` 只写顶层「出现的键 = 应用（未出现 = 不动；未知键 ∥ 空提交 ⇒ 400）」+「`apiKey: ""` = 显式空」，未明写子键缺省语义；UI 面依赖它——`webui/WEBUI.md:53`「留空 = 不变 ∥ 清除勾 = 显式空」、`webui/WEBUI.md:54` 自动探活「按表单草稿值探活（标量三项明传优先」、`gateway/API.md:100`「在场 ⇒ 按明传值探活（未保存亦可先验）∥ 缺省 ⇒ 运行配置回落」+「`env:` 引用按字面值探发」——掩码/引用态字段（`…`+末 4 ∥ `env:X`）在探活/保存时算不算「在场」无判据（一读法 = 字面值当明传值送出 ⇒ 探活/保存误伤）。 | 明写「缺省 = 不动 ∥ `""` = 显式空 ∥ 明填 = 替换」的子键级语义，并钉掩码字段的提交/探活规则（未编辑 ⇒ 不携 `apiKey`（落「运行配置回落」）∥ 编辑 ⇒ 明传 ∥ 清除勾 ⇒ `""`）。 |
| 5 | Affected-file annotations | 🟡 | 随正件（待改测试件）登记悬空 + 缺行数注：`webui/WEBUI.md:557`「旧件随正（档目断言件 ∥ 门禁件数件 31 ⇒ 32 ∥ v10 读点——清单 = `design/PROJECT.md` §6 本批行）」，但 `docs/server/design/PROJECT.md` §6 本批块（`:188`–`:195`）只列产品档 + 批内件，无随正件清单、无逐件「现行行数 + 预期增量（≤±N）」注（实际清单 = 批档 `docs/batches/2026-10-09-server-console-config.md:49` ∥ `PROJECT.md:366` R46②）。 | 在 `design/PROJECT.md` §6 补本批随正件注（逐件「实读 ⇒ ≤±N」或「行数 ±0——断言文本就地收正」——沿注⑩/注⑫先例），并把 AC-28 续的「清单」指针改指实际落点（§9 R46② 或 §6 注）。 |
| 6 | Doc hygiene | 🔵 | `store/STORE.md:12` 版本枚举跳号：v8 之后直接列 v10（缺 v9「`providers.proxy`——server 代理批」条），同一行却引「（详见 §2 v7/v8/v9 段）」。 | §1 版本枚举补 v9 条（`providers.proxy`——server 代理批）。 |
| 7 | Clarity | 🔵 | 小计算术两处不齐：`webui/WEBUI.md:527` 分项（+130 ∥ +55 ∥ +58 ∥ +3 ∥ +4 = +250）对前值 ≈3728 应为 ≈3978，标 ≈3975（差 3）；`gateway/API.md:133`「+≈180 = `config-admin.mjs` 新 ≈160 ∥ `embedding-admin.mjs` ≈+12」分项和 = +172 对实读 1664 应为 ≈1836，标 ≈1844（差 8）。 | 两处按分项配平（改总值或改分项值——二择一，回填轮实读收口）。 |
| 8 | Doc hygiene | 🔵 | `docs/server/design/PROJECT.md:194` 与 `:195` 两行逐字重复（同一条本批预算行）。 | 删重复行；如原意为两条不同内容 ⇒ 拆写。 |
| 9 | Doc hygiene | 🔵 | `docs/server/design/PROJECT.md:201` 板级行「`prepublishOnly` 清单 29 ⇒ 30 件」与本批行 `PROJECT.md:193`「`prepublishOnly` 清单 31 ⇒ **32**」及 `ops/OPS.md:109`「30 ⇒ 31 ⇒ **32 件**」不齐（滞一版）。 | 板级行件数随正到现值链（与 §6 本批行/OPS §5.1 同拍）。 |
| 10 | Affected-file annotations | 🔵 | `webui/WEBUI.md:510` `views-audit.mjs` 行缺本批增量（应为 实读 91 ⇒ ≈94——本批「十型接」；该增量已在小计 `WEBUI.md:527`「`views-audit.mjs` +≈3」与 `PROJECT.md:190`「⇒ ≈94（十型接）」在册）⇒ 同表逐行标注不齐。 | 行内补本批增量注（+≈3 ⇒ ≈94——与 §6 续行/小计同式）。 |
| 11 | Clarity | 🔵 | `webui/WEBUI.md:538` AC-15① 行仍列「配置真值行」（与「配置面（本批……」并列），而 §2.1 向量卡已无独立只读真值行（R46① 亦记「AC-15① 微调建议（向量卡 = 配置面（可编辑）+ 草稿探活替代「配置真值行」读法）」——`docs/server/design/PROJECT.md:366`）⇒ 验收行含无设计落点的元素。 | 删「配置真值行」，或明写其为配置面内的只读展示位（与 §2.1 同拍）。 |

VERDICT: changes-required
计数：🔴×1 ∥ 🟡×4 ∥ 🔵×6（发现 11 项；🔴 = 容器路写面互斥——须先收口再实施）

### 轮次 2（评审子代理）

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | ops/OPS.md | 🔴 | Fixed | 容器路挂载形收正——卷行 = `- ./config:/app/config`（「目录级 rw——写面原子写（同目录 tmp ⇒ `rename`）须之」，`ops/OPS.md:132`）+ `ops/OPS.md:137`「挂载 = `./config` **目录级 rw**——单文件挂载下原子写（同目录 tmp ⇒ `rename`）换不了挂载点 ⇒ 保存必失败」+ `ops/OPS.md:64`「**写面前提 = 配置档所在目录可写**（容器路 = 配置目录级可写挂载——§5.1；裸机 = 部署者自管）」+ 随正件（`.dockerignore` ∥ 仓根 `.gitignore`，`ops/OPS.md:138`）+ 迁移四步（`ops/OPS.md:139`）+ 部署清单 ③/备份命令（`ops/OPS.md:202`/`:188`）+ §6 预算（compose ⇒ ≈24 ∥ `.dockerignore` ⇒ ≈9 ∥ 小计 +≈19）+ `design/PROJECT.md:372` R46④ 补「挂载形迁移」。AC-28③ 收口链闭合。 |
| 2 | 2 | ops/OPS.md | 🟡 | Fixed | `ops/OPS.md:270` 新增 KD-SV-56 行（决策全集 + 被否候选「单文件挂载维持（保存必失败——挂载形与写面互斥）」）；`ops/OPS.md:64`「决策 = §8 KD-SV-56」与 `design/PROJECT.md:143` 载体指针均解悬。 |
| 3 | 3 | webui/WEBUI.md | 🟡 | Fixed | `webui/WEBUI.md:129` 随正：「类型下拉（全部 + **十型**）」+ 详情模板补 `keys`（「详情——按型模板渲染（IP ∥ 维度 ∥ key 提示形 ∥ 角色 ∥ `keys`（配置变更键名清单））」）——与 §2.2 键族/§6 AC-28 续/`store/STORE.md:234` 同拍。 |
| 4 | 4 | gateway/API.md | 🟡 | Fixed | `gateway/API.md:102` 明写「**子键级 = 缺省 = 不动 ∥ 明填 = 替换——`apiKey: ""` = 显式空**」+ 三态（未编辑 ⇒ 不携 ∥ 编辑 ⇒ 明传 ∥ 清除勾 ⇒ `""`；掩码/引用回显形不作明传值）；`gateway/API.md:100` 探活侧同口径（「在场 ⇒ 按明传值探活（未保存亦可先验）∥ 缺省 ⇒ 运行配置回落」）；`webui/WEBUI.md:53` 卡面三态同拍。 |
| 5 | 5 | webui/WEBUI.md ∥ design/PROJECT.md | 🟡 | Fixed | `webui/WEBUI.md:557` 指针改「清单/行数注 = `design/PROJECT.md` §6 注⑬」；`design/PROJECT.md:270`–`:276` 注⑬在盘（随正件三族 + 逐件「实读 ⇒ ≤±N」，如 `:274`「逐件行数（实读 2026-10-09 ⇒ 预期增量）：`-console-completeness-2` **504** ⇒ ≤±8」）；本批块 `:194` 同指针。 |
| 6 | 6 | store/STORE.md | 🔵 | Fixed | `store/STORE.md:12` 版本枚举补 v9 条（「v9 增 provider 上游代理旗（`providers.proxy`——server 代理批）」）——v8 ⇒ v9 ⇒ v10 连续。 |
| 7 | 7 | webui/WEBUI.md ∥ gateway/API.md | 🔵 | Fixed | `webui/WEBUI.md:527` 小计改 ≈3978（+≈250 = 130+55+58+3+4；对前值 ≈3728 闭式）；`gateway/API.md:133` 改 ≈1836（+≈172 = `config-admin.mjs` 新 ≈160 ∥ `embedding-admin.mjs` ≈+12；对实读 1664 闭式）；`design/PROJECT.md:188`–`:193` 产品面 ≈+467（172+1+25+250+19）同拍。 |
| 8 | 8 | design/PROJECT.md | 🔵 | Fixed | 重复行删一：`design/PROJECT.md:194` 收于「随正件/批内件行数注 = 注⑬。」，`:195` = 「※ 2026-10-07 各批（…）的总账行未回填——**滞账在册（§9 R40②）**；」——无重复。 |
| 9 | 9 | design/PROJECT.md | 🔵 | Fixed | 板级行随正：`design/PROJECT.md:200`「`prepublishOnly` 清单 30 ⇒ 31 ⇒ **32 件**」（`:201` 续「（八 + #962/#963/i18n/#972 件 + 后续各批 18 ⇒ 19 件——本批件入链）」）——与 `:193`「31 ⇒ **32**」及 `ops/OPS.md:109`–`:110` 同链。 |
| 10 | 10 | webui/WEBUI.md | 🔵 | Fixed | `webui/WEBUI.md:510` 行内补本批增量「⇒ ≈94（2026-10-09 配置控制台批：`config_update` 十型接 +≈3——实读待回填）」——与 §6 续行/小计/`design/PROJECT.md:190` 同拍。 |
| 11 | 11 | webui/WEBUI.md | 🔵 | Fixed | `webui/WEBUI.md:538` AC-15① 行删「配置真值行」（现「① 向量卡（**配置面（本批——§2.1：三输入 + 保存 → `/api/admin/config`——重启生效；草稿探活）** ∥ …」）——无设计落点元素清零。 |
| 12 | (new) | ops/OPS.md ∥ design/PROJECT.md | 🔵 | New | 新增的仓根 `.gitignore` 随正件只在域档登记（`ops/OPS.md:138`「仓根 `.gitignore` 添 `thincoder-server/config/`（自仓运行场景）」），未进板级 §6 账：本批块仅列 `.dockerignore`（`design/PROJECT.md:192`「`.dockerignore` 实读 **8** ⇒ ≈9（+1 = `config/` 排除）」），注⑬与随动表 `.gitignore` 行（`design/PROJECT.md:216`「追加两行：`thincoder-server/data/` ∥ `thincoder-server/config.json`」）均未随正（旧行随配置档迁入 `config/` 成陈项，「添 ⇒ 改/删」口径可一并核）。登记口径差，不影响功能。 |
| 13 | (new) | design/PROJECT.md | 🔵 | New | 板 §7 三行档目链尾未延（域档侧已带「本批后 30 ∥ 31」）：`design/PROJECT.md:294`（AC-12「…⇒ 结构轮后 **29 ∥ 30**）」∥ `:298`（AC-16 同）∥ `:300`（AC-18「档目 18/19 ⇒ 配置面批后 **19 ∥ 20** ⇒ 结构轮后 **29 ∥ 30**」）；对应 `webui/WEBUI.md:533`「⇒ **30 ∥ 31**（本批——`views-system-config.mjs`）」——汇总行一步之差。 |

VERDICT: pass
计数：前表 11 项 = Fixed 11/11（🔴1 ∥ 🟡4 ∥ 🔵6 全数落位）；本轮新患 = 🔵×2；未决 🔴 = 0。

## §4 用户批准（主 agent）

**用户批准（代签）**：2026-10-09 16:20 用户「**自动跑完**」（授权射程 = 本批全链自动——含 §4 批准权〔代签〕）。

**三条件齐备**：① 设计评审 **pass**（轮 1 = changes-required 🔴×1；**轮 2 = Approved**——11/11 全数落位、新患 🔵×2 非阻断；评审全文 = §3 轮次 1/2）；② **修正轮已落地并逐条核验**（修复轮 §2 逐号落点 + 父侧抽验：`doc-check` **EXIT 0** ∥ OPS 卷行 `./config:/app/config` ∥ KD-SV-56 行 `ops/OPS.md:270` ∥ WEBUI「十型」`webui/WEBUI.md:129` ∥ 子键三态 `gateway/API.md:102` 实读在位；复评轮 2 确认 11/11 Fixed）；③ **token 已签发**（评审 Approved 回执在会话——凭据不入档）。

**裁定口径在案**：`host`/`port`/`db` 只读（用户 16:19「这几个只读吧。」——定则「例外须经用户裁」闭环）∥ 生效 = 统一「重启生效」∥ §2.8 上抛 ①②③④ 按设计实施（无异议）。

⇒ **放行**：实施轮点火（eng-coder ×3——服务面 ∥ 界面面 ∥ 部署面，文件域分派在册）；随正件十件族 = 父侧落（实施同拍）；ECS 侧动作八步 = 父侧部署轮照办。

## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
