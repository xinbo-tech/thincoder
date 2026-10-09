# 2026-10-09 · server-console-config
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-09 · 来源 = 用户 2026-10-09 15:51–15:52 两令（「服务器端proxy.url在哪里设置？代理没给配置界面。」+「任何配置项要给配置界面这他妈的不应该是常识吗？！」）+ 15:57「开批」= 立批；需求源 = 台账 #1139（合并 #1138 ∥ #1123）；定则之提示词面入册已另轮完成（轮档 `docs/batches/2026-10-09-prompt-common-config-ui.md` · #1140）。
> 台账 = #1139（server · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-09
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
**状态行**：实施完成（分舱块在册——服务面舱（5.1–5.5）∥ 部署面舱（交付摘要块 + 补正块 + 防泄收尾块 + git 侧 `backups/` 补行块：`.dockerignore` `backups/` ∥ 仓根 `.gitignore` `.env.*` + `thincoder-server/backups/`——审计/评审 clean）∥ 界面面舱（见其块）；2026-10-09）


### 交付摘要（部署面舱 · eng-coder · 2026-10-09）

- 改动 7 件（逐件落位——坐标 = 落码后盘面）：`thincoder-server/docker-compose.yml`（卷两行 ⇒ `- ./config:/app/config` + `- ./data:/app/data` 目录级 rw ∥ 用法注释随正；20 ⇒ 22 行）∥ `thincoder-server/deploy/docker-entrypoint.sh`（`exec thincoder-server --config /app/config/config.json`；7 行 ±0）∥ `thincoder-server/.dockerignore`（+`config/`；8 ⇒ 9 行）∥ 仓根 `.gitignore`（+`thincoder-server/config/`；+1 行）∥ `thincoder-server/README.md`（容器前提（§2 db 行 · §3 步 3）∥ 配置写面句（§2）∥ 系统页「服务配置卡」（§6）∥ 容器备份命令（§9）；252 ⇒ 256 行）∥ `thincoder-server/package.json`（`prepublishOnly` 31 ⇒ **32**——本批件入链；单行清单 ±0）∥ `thincoder-server/deploy/backup.mjs`（容器路注释随正——**清单外**，见决策表；86 行 ±0）。
- 机检读数：防泄两件命中（`.dockerignore:4` `config/` ∥ `.gitignore:38` `thincoder-server/config/`）∥ `prepublishOnly` 计数 = **32**（JSON.parse + 逐名点算；本批件在盘）∥ compose YAML 解析 OK（`volumes = ['./config:/app/config', './data:/app/data']`；`docker compose config` **未跑**——本机无 docker ⇒ 父侧 ECS 轮代跑）∥ 服务树 `/app/config.json` 残留 = **0**。
- 定向套件（本舱收口面）：`-webui-deploy` **5/6**（唯一红 = `:307` 旧卷行断言）∥ `-server-auto-update` **13/14**（唯一红 = `:469` 旧 entrypoint 断言，遮蔽 `:480` 计数断言）∥ `-first-release-completeness` **14/14** 绿。两处红 = **父侧「随正件」**（本舱禁改——交底禁令）；其余 6 件计数断言（`batchFiles.length, 31`：`-console-list-style:237` ∥ `-console-layout:449` ∥ `-me-usage-charts:225` ∥ `-provider-model-metadata:491` ∥ `-quota-per-model:444` ∥ `-quota-v2-member-models:428`）= 同族随正件（静态核实，未逐跑）。

### 决策透明表（本舱）

| # | 决定 | 依据 | 披露/后果 |
|---|---|---|---|
| 1 | 列表外随正 `deploy/backup.mjs:10`（容器路注释 ⇒ `/app/config/config.json`） | 设计 §5.5:188 同命令已随正；旧路径 = 错误示例 | 行数 ±0（86）；本段登记（代码评审 🔵#2 采纳） |
| 2 | README 写面句按内容完整性交付（+4 行 vs 设计估 +≈12） | 设计 §6 行数自标「实读待回填」；四要素齐（可写/只读/保存语义/重启生效/容器前提） | 行数回填 = 父侧/设计层 |
| 3 | `.dockerignore` 未添 `.env`（构建上下文防泄邻缝） | 交底禁令（勿扩范围）+ 父侧自缚②「新范围 ⇒ 停、只摆那一条」 | 上抛待裁（见下） |
| 4 | 未动测试件/设计档/需求档/他舱文件 | 交底禁令 | 随正件清单（7 计数 + 2 结构断言）已列交底报告 |

### 审计与代码评审（轮次与终态）

- 内部 explore divergence 审计（轮 1）：**CLEAN**——7 件逐件对账：零缺项 ∥ 零静默简化 ∥ 零未披露清单外 ∥ 旧形残留零 ∥ 禁止面零触 ∥ 读数复现（32 ∥ 防泄两件 ∥ 写面声明不破：目录级挂载下同目录 tmp ⇒ rename 成立）。
- 内部代码评审（轮 1）：**pass**——🟡×1（可选·新范围项 = `.dockerignore` 无 `.env`；非 must-fix）+ 🔵×3（登记/报告项）；无 🔴。响应：🟡 ⇒ 上抛父侧裁决（本舱不扩）；🔵#2 ⇒ 本段登记；🔵#3/#4 ⇒ 报告项（相对形 `db` 落位风险——三处披露在案、ECS 步③ 不可省；预算估数 vs 实读——回填轮）。
- fix round：**0 轮**（无 must-fix ⇒ 无自修动作）。终态 = clean。
- 旁证：批档 §2「ECS 侧动作」八步在仓外（父侧部署轮）；`.thincoder/tmp/ecs-compose-fixed.yml:15` 仍持旧卷行（= 步④ 待办）；历史批档旧路径 = append-only 史录（勿回改）。

### 上抛项（父侧）

- **[上抛·待裁] `.dockerignore` 无 `.env` 排除**（构建上下文防泄邻缝）：上下文 = `thincoder-server/`；compose 用法注释（`:5`）与 README §3③ 均指 `.env`（provider keys ∥ bootstrap 口令）放此树内；`Dockerfile:16` `COPY . /tmp/build/` 会把在场 `.env` 带入镜像层（清除走 `:19` 后一 RUN ⇒ 层内留存）⇒ 重建镜像时密钥/口令入层可被 registry 侧提取。本舱按禁令未动；若裁补：`.dockerignore` 添 `.env`（+`.env*`）+ 设计 §5.1 排除清单同拍；**时机建议 = ECS 重建镜像（步①）之前**。
- [上抛·知会] 设计预算 vs 实读：compose ≈24 ⇒ **22** ∥ README ≈264 ⇒ **256**（entrypoint 7 ✓ ∥ `.dockerignore` 9 ✓）——「实读待回填」在案，回填轮收口。
- [上抛·知会] 相对形 `db` 模板（`config.example.json:4`）于容器路会静默落 `./config/data/`（本批已使该目录可写；三处披露在案 + 设计裁 ±0）——**父侧 ECS 步③（db 改绝对形）不可省**。

### 5.1 交付（**服务面舱**——文件 ∥ 实读 2026-10-09）

| 档 | 实读 | 落点 |
|---|---|---|
| `thincoder-server/src/gateway/config-admin.mjs` | **新 182**（设计估 ≈160） | `GET/PATCH /api/admin/config`：写路径五步（白名单 → 合并保未知键 → `resolveEnvRefs`+`validateConfig` 门 → 同目录 tmp ⇒ rename 原子写 → 审计 `config_update`）∥ 助手导出直测面（`mergeConfigPatch` ∥ `writeConfigAtomic` ∥ `configView` ∥ `readConfigFile` ∥ `isMaskEcho`） |
| `thincoder-server/src/gateway/embedding-admin.mjs` | 96 ⇒ **110**（设计估 ≈108） | 探活草稿口径：`resolveProbeTarget`（标量三项明传优先 ∥ 缺省 ⇒ 运行配置回落 ∥ 掩码回显形不作明传值） |
| `thincoder-server/src/accounts/audit.mjs` | 108 ⇒ **109**（设计估 ≈109） | `AUDIT_TYPES` 十型（+ `config_update`） |
| `thincoder-server/src/store/db.mjs` | 231 ⇒ **255**（设计估 ≈256） | v10 段（`audit_events` CHECK 扩型——表重建 SQL 逐字 ∥ 两索引重建）+ 迁移链尾 |
| `thincoder-server/bin/thincoder-server.mjs` | 178 ⇒ **180**（设计估 ≈180） | 配置面注册行 + `configPath` 传递（`loadConfig` 归一出参） |
| `docs/batches/2026-10-09-server-console-config.test.mjs` | **新 518**（设计估 ≈450——含界面面块） | 服务面断言块 A–E（19 用例）；界面面块 = 另舱 append（同件续写） |

### 5.2 机检读数（本舱面）

- `node --check` 六档 ⇒ 全 **OK**（182 ∥ 110 ∥ 109 ∥ 255 ∥ 180 ∥ 518 行）。
- 批内件：`node --test docs/batches/2026-10-09-server-console-config.test.mjs`（自仓库根 `thincoder/`）⇒ **tests 19 ∥ pass 19 ∥ fail 0**。
- 行为面逐腿（③）：白名单五键 ∥ 未知键 400 ∥ 空提交 400 + 文件字节零变 ∥ `"apiKey":""` 显式空 ∥ 掩码回显不携 ∥ 写后 GET 逐值回读 ∥ 审计恰一条（detail = 键名清单、值零入）——全绿。
- v10 迁移：空库直落 10 ∥ v9 库自动升 10（存量行逐值保形 ∥ 两索引 ∥ `config_update` 可写 ∥ 序号连续（新 id = 存量 max+1）∥ 幂等二跑同态）——全绿。
- import 扫描：`thincoder-server/{src,bin,deploy}` 35 档零第三方（`node:` + 相对）——批内件 E1 常驻断言。
- bin 端到端实跑（本机临时档）：起服务 ⇒ 登录 ⇒ GET 200（有效值） ⇒ PATCH 200 `{ok:true}` ⇒ 落盘形 = 2 空格缩进 + 末尾换行 ⇒ 重启 ⇒ 新值生效 + `proxy.uri` 明文 warn 一条 ⇒ `/healthz` 200（零回归）。

### 5.3 决策透明表（实施期判断——设计未逐字钉处）

| 判断 | 取法 | 依据 |
|---|---|---|
| 审计 detail 键名粒度 | 顶层键照名 ∥ `embedding` 拆子键（`embedding.model`） | §2.4「detail = 键名清单」；子键级可读性更佳（N31 输入 autoUpdate ∥ proxyUri 照名） |
| 审计行 = 提交生效键（非值 diff） | 携入即记（值未变亦记） | §2.4「出现的键 = 应用」；diff 面零设计落点 |
| 掩码回显形判据 | `…` 起头 **∧ 长度 ≤5**（= §2.2 掩码「`…`+末 4」逆判） | 防误伤真密钥（`…` 起头长串 = 明传）；顾问评审 #7 收正 |
| 掩码-only 提交 | 400「未携任何可生效的键」 | 掩码不作明传值（§2.4）⇒ 无键生效 ⇒ 循「空提交 ⇒ 400」 |
| `env:` 引用进写路径 | 明传值（经门校验——缺位 ⇒ 400） | E24（`env:NO_SUCH_VAR` ⇒ 400 环境变量缺位）∥ 探活「按字面值探发」 |
| 落盘 = 合并后原档（未解析形） | `env:` 引用/未托管键零物化 | 「保未知键」+ 密钥卫生（写解析形会把 `bootstrap.password` 物化落盘） |

### 5.4 审计与代码评审轮次（自含交付环——终态 clean）

- **内部 explore 偏离审计（轮 1）**：发现 **1 项 🟡（证据腿）**——B1 缺省回填腿与档值同值不可区分（实装回填逻辑实读正确）。**已修复**：B1 拆「在场值透传（非缺省值）」+「缺省回填」两腿 + `embedding` 缺位 ⇒ `null` 支。
- **内部 advisor 代码评审（轮 1）**：**VERDICT: pass**（🔴×0；🟡×1；🔵×6）。逐条处置——
  - 🟡 批内件行数（518 > 500 顾问线）⇒ **免拆登记**（批内件 >500 = 存量免拆类——`docs/batches/2026-10-08-code-limit-500-800.md` §1 存量清单「>500 = 27（全批内件——免拆）」）；界面面 append 后硬限 800 余量在册。
  - 🔵 #5 B32 无机检腿 ⇒ **已补**（B2 内 `loadConfig` 重载腿：落盘档可载入 + 按新值）。
  - 🔵 #7 掩码判据过宽 ⇒ **已收窄**（`…` ∧ 长度 ≤5）+ D1 边界断言（`…` 起头长串 = 明传）。
  - 🔵 #4 `textExcerpt` 整段读体 ⇒ **不改**（既有行；注释自述「读体整段沿同族发现面口径」= 既有设计口径——改动越本舱清单）——上抛父侧路由。
  - 🔵 #2/#6 设计档回填与措辞（`（拟新增）` 翻正 ∥ `gateway/API.md` §2.4 `env:` 括注可读性）⇒ 设计档非本舱写面——**随正件/父侧笔**。
  - 🔵 #3 批档 §2「射程外发现」残句（ACCOUNTS.md 审计面随 v10）⇒ **已解决**：`accounts/ACCOUNTS.md:61` `config_update` 行在盘 ∥ `:209` 变更记录在册——本行即销号登记（父侧无需再派轮）。
- **终态**：**clean**（🔴 零；🟡 免拆登记；🔵 已处置/已明示不做）。

### 5.5 不做面与上抛

- 不做面（照设计）：配置热载/运行态注入 ∥ `host`/`port`/`db` 写面 ∥ 版本史/回滚 ∥ 写前备份 ∥ 多实例并发写；零新依赖；未提交（父侧提交）。
- 上抛（非本舱面）：① 部署面舱（compose 目录级挂载 ∥ entrypoint ∥ README ∥ `.dockerignore` ∥ 仓根 `.gitignore` ∥ `package.json` 门禁清单 31 ⇒ 32）——本舱零触；② 界面面舱随正；③ `textExcerpt` 整段读体（既有行——处置候选 = 另笔）；④ 界面面提交体只读三行不得入 PATCH（未知键 ⇒ 400 整单拒）、向量卡掩码-only 提交 ⇒ 400（A1 钉形）——界面面落码前对齐（交集面，零代码改动建议）。

### 5.4 补 · advisor 复评（轮 2——仅核自修 delta）与服务面舱终态

- **内部 advisor 代码评审（轮 2）**：**VERDICT: pass**——自修三项逐条 **Fixed**：① `isMaskEcho` 收窄（`…` ∧ 长度 ≤5——掩码恒 ≤5 的逆判）∥ ② B2 `loadConfig` 重载腿（B32 = OPS §9 机检化）∥ ③ B1 三腿可区分（在场值透传 ∥ 缺省回填 ∥ `embedding` 缺位 ⇒ `null`——设计在册 = `gateway/API.md` §2.4）。🟡（批内件 518 行）= 免拆登记理由核过（Accepted）；余 🔵 全 Accepted（既有行既口径 ∥ 设计档/父侧笔）；**新患 = 0**。
- **fix round = 1**（轮 1 发现 → 自修三项 + 一处判据收窄 → 轮 2 复评通过）；**服务面舱终态 = clean**（🔴 零 ∥ must-fix 零）。
- 复评同时机检读：config-admin 「新 182」与盘面一致；批内件全档 518 行（末行 `})`）与登记读数一致。

### 补正块（`.dockerignore` 防泄两行——部署面 fix 轮）——eng-coder · 2026-10-09

**缘起**：§5 部署面舱 [上抛·待裁]「`.dockerignore` 无 `.env` 排除」获裁落地；设计 `ops/OPS.md` §5.1 随正件行（`:138`）已由父侧同拍。

- **交付**（单档 · 坐标 = 落码后盘面）：`thincoder-server/.dockerignore` = `:5` `.env` ∥ `:6` `.env.*`（插于 `config/`（`:4`）后——既有条目群内）；9 ⇒ **11** 行（2 注释 + 9 条目）。其余文件零触；未提交。
- **diff 读数**：全档 diff（vs HEAD）= **+3**——前轮未提交 `config/` +1 ∥ 本轮 **+2**（本舱 delta = 单档 +2 行）；`grep` 读数 ⇒ `:5`/`:6` 两行在位。
- **前提核（为什么）**：构建上下文 = `thincoder-server/`；`Dockerfile:16` `COPY . /tmp/build/`，清除动作在 `:19` 后一层 ⇒ 层内留存；`.env` 落点 = 本树（`docker-compose.yml:22` `env_file: .env` ∥ `README.md:93`）⇒ 实质防泄（树内现无 `.env*` 实档——预防性）。
- **定向件**：`docs/batches/2026-10-06-server-gateway-webui-deploy.test.mjs` ⇒ **5/6**（唯一红 = `:307` 旧卷行断言——既有随正件，与本轮无因果；`:302` `.dockerignore` 包含式断言 ⇒ 本轮 +2 行不触发、零回归）。
- **决策透明表**：无——两行逐字照设计（`:138`），零设计外判断。
- **审计与代码评审（自含交付环）**：内部 explore 偏离审计（轮 1）＝ **CLEAN**（① 两行在位 ∥ ② delta = 单档 +2 ∥ ③ 其余零触）；内部 advisor 代码评审（轮 1）＝ **VERDICT: pass**（🔴×0；🟡×1 非 must-fix〔`backups/` 同族残余——设计未覆盖〕；🔵×1〔`OPS.md:233` §6 行数回填滞后〕；射程外注记 3 条）。**fix round = 0 轮**（无 must-fix）。终态 = **clean**。
- **上抛（父侧）**：[上抛·知会] ① `backups/` 防泄残余——旧布局（配置档留树根）下裸机备份默认产出落 `thincoder-server/backups/`（`deploy/backup.mjs:8` `--out` 缺省 = 配置档旁），本档未排除；设计 `:138` 只枚举三项 ⇒ 须设计面裁决（补 `backups/` ∥ 明写「配置档须已迁入 `config/`」——迁移后落 `config/backups/` 已覆盖）；② 回填轮：`OPS.md:233` 实读 ⇒ **11**（现行 ≈9）+ `:237` 小计分项同步；③ 射程外：仓根 `.gitignore:15` = `.env` 不覆盖 `.env.*` 变体（与 `.dockerignore:6` 侧不对称——两防泄通道口径交父侧）；④ 本机无 docker 面 ⇒ `.dockerignore` 深度匹配语义未实证（目标场景 = 上下文根——`README.md:93`，不受影响）。

- 标记补记（补正块）：上列上抛 ① 属 **[上抛·待裁]**（设计面裁决待定——补 `backups/` ∨ 明写「配置档须已迁入 `config/`」二择一）；②③④ = [上抛·知会]。

### 防泄面收尾块（两行·两档——部署面 fix 轮 2）——eng-coder · 2026-10-09

**缘起**：前笔（补正块）上抛两条获裁落地——① [上抛·待裁]「`backups/` 防泄残余」∥ ③「仓根 `.gitignore` `.env` 不覆盖 `.env.*` 变体」；设计 `ops/OPS.md` §5.1 随正件行（`:138`）已由父侧同拍（含 `backups/` 与 `.env.*` 两件；可 revert）。

- **交付**（单笔两行两档 · 坐标 = 落码后盘面）：`thincoder-server/.dockerignore` = `:5` `backups/`（插于 `config/`（`:4`）后）——11 ⇒ **12** 行（2 注释 + 10 条目）∥ 仓根 `.gitignore`（= `thincoder/.gitignore`）= `:16` `.env.*`（插于 `.env`（`:15`）后）——38 ⇒ **39** 行。其余文件零触；未提交。
- **diff 读数**（vs HEAD——含前轮在案差额）：`.dockerignore` 全档 **+4**（前轮在案 +3 = `config/` ∥ `.env` ∥ `.env.*`；本笔 +1 = `backups/`）∥ `.gitignore` 全档 **+2**（前轮在案 +1 = `thincoder-server/config/`（`:39`）；本笔 +1 = `.env.*`）。grep 读数 ⇒ `.dockerignore:5` ∥ `.gitignore:16` 两行在位。
- **前提核（为什么）**：① 旧布局（配置档留树根）下 `deploy/backup.mjs:8` `--out` 缺省 = 配置档旁 `backups/`（本仓现仍旧布局：配置档在 `thincoder-server/config.json`）⇒ 备份产出落构建上下文内（`Dockerfile:16` `COPY . /tmp/build/`——层内留存面）；迁移后落 `config/backups/` 已被 `config/` 覆盖 ⇒ 本补 = 旧布局保险。② `.env.*` 补后与 `.dockerignore:6`/`:7` 两通道口径对称（防 `.env.local`/`.env.bak*` 类误入库）。
- **定向件**：`docs/batches/2026-10-06-server-gateway-webui-deploy.test.mjs` ⇒ **4/6**——两红 = 父侧随正件面（`:274` public 档目列表缺 `views-system-config.mjs`（界面面舱新档、未跟踪——前笔读数 5/6 时该档未落）∥ `:307` 旧卷行断言——部署面舱既存），与本笔两行无因果（`:302` `.dockerignore` 包含式断言 ⇒ 本轮 +1 行不触发、零回归；全仓 `*.test.mjs` 零根 `.gitignore` 断言）。
- **决策透明表**：无——两行逐字照设计（`:138`）+ 父侧放置指令（`config/` 后 ∥ `.env` 行后），零设计外判断。
- **审计与代码评审（自含交付环）**：内部 explore 偏离审计（轮 1）＝ **CLEAN**——四类偏差零（两行在位 ∥ 差额各 +1（锚点位移链收束：`.env`/`.env.*` `:5`/`:6` ⇒ `:6`/`:7`；`thincoder-server/config/` `:38` ⇒ `:39`）∥ 无夹带 ∥ 未提交（reflog 实读：末条 16:49:49 +0800 之后零条目；两档 mtime 17:15 +0800）；审计装配无 git 工具 ⇒ vs HEAD 原始读数由本舱 `git diff` 为准）；内部 advisor 代码评审（轮 1）＝ **VERDICT: pass**（🔴×0；🟡×1 非 must-fix〔git 侧 `backups/` 缺口——协调项，见下〕；🔵×3〔`ops/OPS.md:233` 回填滞后（现值 ⇒ **12**）∥ 本块落盘即销 §5 记录缺环 ∥ `.env.example` 前视卫生——零动作〕）。**fix round = 0 轮**（无 must-fix）。终态 = **clean**。
- **上抛（父侧）**：[上抛·待裁] ① git 侧 `backups/` 缺口——仓根 `.gitignore` 无 `thincoder-server/backups/`（本仓仍旧布局 ⇒ 此刻裸机备份产出 `thincoder-server/backups/gateway-*.db` = 库全量含 provider 密钥与口令散列（`README.md:164`）不在忽略面）；设计 `:138` git 侧只列 `config/` ∥ `.env.*` ⇒ 裁决二择一：补一行 `thincoder-server/backups/`（+ 设计同拍）∥ 明写「旧布局 backups 残余接受」。**[上抛·知会] ② 回填轮**：`ops/OPS.md:233` 实读现值 ⇒ **12**（2 注释 + 10 条目；分项 +4）+ `:237` 小计分项同步——设计档非本舱写面。**[上抛·知会] ③ 射程外**：`.env.*` 覆盖将来 `.env.example` 类模板（现盘零命中、零引用）——若引入模板须反选 `!.env.example`。

### git 侧 backups 补行块（单笔一行——部署面 fix 轮 3）——eng-coder · 2026-10-09

**缘起**：§5 防泄面收尾块 [上抛·待裁] ①「git 侧 `backups/` 缺口」获裁落地（裁决 = 补一行 `thincoder-server/backups/` + 设计同拍）；设计 `ops/OPS.md` §5.1 随正件行（`:138`）已由父侧同拍（含 `thincoder-server/backups/` 项；可 revert）。

- **交付**（单档一行 · 坐标 = 落码后盘面）：仓根 `.gitignore`（= `thincoder/.gitignore`）= `:40` `thincoder-server/backups/`（插于 `thincoder-server/config/`（`:39`）后——thincoder-server 条目群内）；39 ⇒ **40** 行。其余文件零触；未提交。
- **diff 读数**（vs HEAD——含前轮在案差额）：`.gitignore` 全档 **+3** = 前轮在案 **+2**（`.env.*`（`:16`）∥ `thincoder-server/config/`（`:39`））∥ 本笔 **+1**（`backups/`）。grep 读数 ⇒ `:40` 在位；`git check-ignore -v thincoder-server/backups/gateway-20261009-1723.db` ⇒ `.gitignore:40:thincoder-server/backups/` 命中、exit 0；`git ls-files thincoder-server/backups` ⇒ 空（无被跟踪件与忽略面冲突）。
- **前提核（为什么）**：旧布局（配置档留树根——`thincoder-server/config.json` 现仍在树根）下 `deploy/backup.mjs` 缺省产出 = 配置档旁 `backups/`（`:66` `const outDir = resolve(options.out ?? join(baseDir, "backups"))` ∥ `:57` `baseDir: dirname(configPathAbs)`；`:67` 产物 `gateway-<时间戳>.db`）⇒ 裸机备份落 `thincoder-server/backups/gateway-*.db`——库全量，含 provider 密钥与口令散列（`README.md:164`）。迁移（配置入 `config/`）后落 `config/backups/`——已被忽略的 `thincoder-server/config/`（`:39`）覆盖 ✓（本补 = 旧布局保险）；容器路 `data/backups` 由既有 `thincoder-server/data/`（`:37`）覆盖（`deploy/backup.mjs:10` 容器样例 `--out /app/data/backups`）——三布局全链闭合。
- **定向件**：全仓 `*.test.mjs` grep `gitignore` ⇒ 零命中（本笔不触发随正件）。
- **决策透明表**：无——一行逐字照裁决/设计（`:138`）+ 父侧放置指令（`thincoder-server/config/` 行后），零设计外判断。
- **审计与代码评审（自含交付环）**：内部 explore 偏离审计（轮 1）＝ **CLEAN**——三腿零偏离（① 交付对账：恰一行 ∥ 逐字 `thincoder-server/backups/` ∥ 落位 `:40` ∥ 全档其余未动 ② 夹带对账：本笔窗口写面 = 仅 `.gitignore`（mtime 17:24 +0800 实读）∥ reflog 尾条 16:49:49 +0800——零提交 ③ 设计对账：`ops/OPS.md:138` 含项在盘 ∥ `.dockerignore:5` `backups/` 邻面在盘）；内部 advisor 代码评审（轮 1）＝ **VERDICT: pass**（🔴×0；🟡 must-fix×0；🔵×4——① 本块落档时序〔本段即销〕② `ops/OPS.md` §6 回填滞后〔回填轮在册〕③ `.gitignore` 节注/空行沿既有瑕疵（非本笔）④ `check-ignore` 读数建议父侧收口复读〔本舱读数在案〕）。**fix round = 0 轮**（无 must-fix）。终态 = **clean**。
- **上抛（父侧）**：[上抛·知会] ① 回填轮：`ops/OPS.md:233` `.dockerignore` 实读现值 ⇒ **12**（2 注释 + 10 条目）∥ `:237` 小计分项同步——既有滞后（前轮在册），与本笔无因果；② 仓根 `.gitignore` 记账口径（§6 补行 ∨ 明写豁免——先例 `docs/batches/2026-10-06-server-gateway.md:218`）供收口裁。

### 界面面舱 · eng-coder 实施记录（2026-10-09 · 终态 clean）

**交付摘要**（写域 = `thincoder-server/public/**` 八档 + 批内件 F 块；实读行数 = 字节级 `\n` 计）
- 新档 `views-system-config.mjs`（**105** 行）＝系统页「服务配置」卡：只读三行（host/port/db）+ 部署拓扑注 ∥ 可写四项（autoUpdate ∥ trustProxy ∥ usageRetentionDays（正整数 ∥ 「不限」⇒ `null`）∥ proxy.uri）「所见即所存」∥ providers/bootstrap 指针行 ∥ 保存 = `PATCH /api/admin/config` ⇒ flash「已保存——重启服务后生效」∥ 前端先行自校（保留天数）+ 服务端 400 `mapError` 落卡内 ∥ 读档失败 ⇒ 就地错态（`cfgLoadFailed` + `fail` 收口）。
- `views-system.mjs`（**222** 行，175 ⇒ +47）：向量卡重写为配置面——三输入（值 = `GET /api/admin/config` 文件面；API Key 掩码入占位、输入值恒空 ⇒ 掩码恒不作明传值）+ 保存（`embedding` 子键级；apiKey 三态）+ 草稿探活/试跑（标量三项明传优先；`env:` 按字面探发）+ 五节接线（`systemConfigSection(ctx)` 入插）。
- `views-audit.mjs`（**93** 行，91 ⇒ +2）：十型枚举 + `config_update` 详情支 = 键名清单；注释随正「十型」。
- i18n：`i18n-{zh,en}-system.mjs`（各 **153** 行）+29 键/表（system 23 ∥ vector 4 ∥ audit 2——显名 22 + 补 `system.cfgRestartNote`）；`i18n-{zh,en}-admin.mjs`（138/142 ±0）`admin.providers.useProxy` 值改向「系统 → 服务配置」/「System → Server config」；两处「九型」注释随正「十型」。
- `style.css`（**227** ⇒ +1 行）：`.provider-form input[type="checkbox"] { min-width: 0; }`——实测勾选框被 210px 拉伸 ⇒ 修复后 13px。
- 批内件 F 块（`docs/batches/2026-10-09-server-console-config.test.mjs` 519 ⇒ **796** 行 ≤800）：F1 服务配置卡（只读三行不入 PATCH 体 ∥ 四写控件 ∥「不限」⇒ `null` ∥ 非法 ⇒ 不提交+就地提示 ∥ 读档失败就地错态）∥ F2 系统页五节 + 向量卡三输入 + 保存三态 + 草稿探活/试跑体 ∥ F3 审计十型 +`keys` 详情 ∥ F4 i18n 本批 29 键两表在位（非空 ∥ 占位对位）+ `useProxy` 改向 ∥ F5 静态面（新档在册 ∥ 直发 200+`text/javascript` ∥ `public/**` 零外部引用 ∥ 本批三档注释外零 CJK（`fStripComments` 判）∥ `t("…")`  ⊆ 表键）。

**机检读数（终跑）**：`node --test docs/batches/2026-10-09-server-console-config.test.mjs`（仓根）= **tests 24 ∥ pass 24 ∥ fail 0**（A–E 服务面 19 + F 界面面 5）∥ 八档 `node --check` 全绿 ∥ `public/**` 零外部引用（F5 断言）∥ 档目实点 30（.mjs 28）+ favicon = 31 ∥ `prepublishOnly` 链 32 已含本批件。

**浏览器实走**（临时走查器：stub `/api` + 直发 `public/**`；两轮各一次，二次已删、进程已杀、会话已关）：五节渲染 ✓ ∥ 配置卡保存体 `{"autoUpdate":"notify","trustProxy":true,"usageRetentionDays":90,"proxyUri":""}`（**无 host/port/db**）✓ ∥ 向量卡保存体 `{"embedding":{...}}`（未编辑 ⇒ 无 apiKey）∥ 明填 ⇒ 明传 ∥ 清除勾 ⇒ `""` ✓ ∥ flash 文案 ✓ ∥ 「不限」⇒ 天数输入退场 ✓ ∥ 探活/试跑草稿体三态 ✓ ∥ **保存后掩码随新值**（明文 ⇒ `…ft-1` ∥ `env:` ⇒ 原文 ∥ 清除 ⇒ `—`）✓ ∥ **非法保留天数** ⇒ 页内 `.hint error` + 焦点回位（novalidate 收口后；修复前浏览器原生校验挡下提交、设计要求的就地提示不可达——实证：`invalid` 触发 ∥ `submit` 不触发）✓ ∥ 十型下拉 + `config_update` 行详情「键名: autoUpdate, proxyUri」✓ ∥ 中英两语渲染 ✓。

**决策透明表（设计未逐条 given 者 = 本舱裁定）**

| # | 裁定 | 依据 |
|---|---|---|
| D-1 | 补 `system.cfgRestartNote`（第 23 键）统一标注「重启生效（配置文件不热载）」 | §2.1「全部可写项统一标」，键数 ≈23 与实读 23 对齐 |
| D-2 | 只读三行 = `col.item/col.value` 表 + 拓扑注（「改动需编辑配置档并重启」）；指针两行另表 | §2.1 只读面 + 定则例外显式说明 |
| D-3 | 配置卡表单加 `novalidate`（原生 `min=1` 校验会前置于设计要求的「前端先行自校 ⇒ 就地提示」） | §2.1 非法口径；自校 + 服务端 400 双兜不变 |
| D-4 | `invalidHint` 用 `span`（`label` 内容模型 = phrasing content） | HTML 规范；同 `.hint error` canon |
| D-5 | 保存后掩码就地上新，`maskForm` 镜像服务端 `maskApiKey` 三态（空 ⇒ `—` 占位约定 ∥ `env:` ⇒ 原文 ∥ 明文 ⇒ `…`+末 4） | §2.1 掩码回显；顾问轮 1 🟡 + 轮 2 新发现收口 |
| D-6 | `i18n-{zh,en}-system.mjs:123` 注释「九型/nine types」⇒「十型/ten types」 | 本批入第十型——注释随正 |
| D-7 | 档目/计数类断言（`-console-list-style` ∥ `-server-i18n` ∥ `-webui-deploy` 件）不在本舱改 | §2.4「随正件（父侧落）」 |

**轮次与终态**
- 内审（explore · 只读 · **1 轮**）= **clean**：四类偏差（部分实现/静默简化/文档漂移/表外未披露）零发现；收正其 3 条低危观察 + 1 条记录面注记（i18n 九型注释随正 = D-6；批内件行数实读收口 852 ⇒ 796；scratch 披露）。
- 顾问代码评审（sync）：轮 1 = **pass**（🔴0 · 🟡2 可选 · 🔵4）⇒ fix 两项（掩码随保存刷新 + F2 断言；`invalidHint` ⇒ `span`）∥ 轮 2（收正复核）= **pass**（2 项 Fixed 核过；新发现：`env:` 形乐观掩码与服务端规则分歧）⇒ fix（`maskForm` 三态镜像 + F2 `env:` 断言）∥ 轮 3（delta 复核）= **pass**（#7/#8 = Fixed；无新 🔴）。
- **fix round = 3**（≤5 限内）；**终态 = clean**（仓套件不跑——父侧 §6 收口为唯一跑点，遵约）。

**披露（不阻塞）**
1. 写域外零触：`src/**` ∥ 部署面 ∥ 五设计档 ∥ 需求档 ∥ 随正件——零改；scratch = `.thincoder/tmp/console-config-harness.mjs`（现盘无残留）。
2. 随正件影响（父侧）：`-server-i18n`（`JS_FILES` 缺 `views-system-config.mjs`）∥ `-console-list-style`（档目 29⇒30、「hint error」计数 20⇒21）∥ `-server-gateway-webui-deploy`（public 档目列表）——本舱实跑已红、均属父侧随正件面。
3. 未经本舱实证项：`env:` 形掩码断言在本批 F2 在册（服务端口径 = 实读 `maskApiKey` 对齐，非独立用例）；三处压行「无语义」无 diff 快照可复核（仅行号对账自洽）；顾问轮 3 的机检回执有路径解析噪声（引用未匹计数），其正文 VERDICT = pass 为依据。
4. designId：spawn 简报未见值——按「未见」原样带回（写盘全程可用 = token 生效之证）。

## §6 验证与收口（父代理）

### 验证（父侧独立复跑 + 真机走查 · 2026-10-09 17:5x）

- **批内件复跑**：`node --test docs/batches/2026-10-09-server-console-config.test.mjs`（自 `thincoder/` 仓根）⇒ **tests 24 ∥ pass 24 ∥ fail 0**（四舱合卷 A–F）。
- **受影响面全复跑（32 件）**：tests 268 ∥ pass 267 ∥ **red 1**——唯一红 = `2026-10-08-proxy-per-channel` ⑩（TUI 渠道条目 model 缺失；该面树 `thincoder-cli/src/tui/{index,pickers}.mjs` = **dirty——非本批**）⇒ **不属本批面，已路由用户**；除该外部件外全员绿。
- **随正件收正（17 档 · 断言级机械 · 父侧直接执行 · 可 revert）**：门禁链 31⇒32（7 处 + 链注）∥ 档目 30⇒31 / 29⇒30（8 处 + 名单五档 + 全目录注）∥ v10 读点 9⇒10（6 档）∥ 失败迁移探针顶 v11（同协议）∥ 指纹基线两枚随正（zh `12d4ea59…` ∥ en `5aca0563…`；键数 368 ∥ 373 = 拆表 338/343 + 代理批 1 + 本批 +29——8 处题名/注释同拍）∥ `hint error` 计数 20⇒24（新档入扫 +3）。
- **机检**：`node scripts/doc-check.mjs` ⇒ EXIT 0（悬空 0 ∥ 行宽 0 ∥ 行数面差异 0）。
- **ECS 真机部署**：HEAD `d0d4d9a2`（pull 落位）→ 镜像重建 ✓ → 配置迁移（`./config/config.json` ∥ `db=/app/data/gateway.db`）✓ → 卷 `./config:/app/config` ✓ → `up -d` ✓ → 容器 healthy ∥ `/healthz` 200 ∥ `/` 200 ∥ `/views-system-config.mjs` 200 ∥ `/api/admin/config` 401 值守 ✓ ∥ ready 行 `db=/app/data/gateway.db ∥ routes=35`。
- **浏览器实走（admin 会话 · 真机）**：系统页两卡在册——向量卡值 = 文件面（`http://10.0.0.5:11434/v1` ∥ `bge-m3` ∥ Key 占位「留空 = 不修改」）；服务配置卡只读三行含 `db=/app/data/gateway.db`（迁移形 ✓）。**保存往返真打**：闪报「已保存——重启服务后生效」∥ 文件 mtime 17:51:14 ∥ 日志 `config_updated` keys 仅键名（值零入 ✓）∥ `PATCH /api/admin/config → 200`。**探活 = 诚实「引擎不可达：fetch failed」**（ollama 已停——语义正确）。**审计页**：「配置变更」行在位（17:51:14 tcagent，详情 = 键名清单）∥ 类型下拉含「配置变更」∥ tfoot 共 18 项。

### 部署期权限修正（披露）
- 宿主 `thincoder` = **uid 1002** ≠ 容器 uid 1000 ⇒ 宿主侧 `chown -R 1000:1000` 被拒（无 sudo）⇒ 以**容器 root 内** `chown -R 1000:1000 /app/config` 落定 + `chmod 755`——**写面前提闭环**（容器内写测 `WRITE-OK-3` ✓；`config/` = 1000:1000 755）。宿主 `ecs-user` = uid 1000（恰与容器同——`data/` 归属即刻成立）。

### 随批入仓（披露）
- 10-08 结构轮 server 面**遗留未提交件**随本滚入仓：`public/{dom,health}.mjs`（未跟踪）+ `public/app.mjs` 拆分改动——**部署一致性所需**（不带则箱上 pull 后服务必坏）；真机 pull 后已验（ready 行 + 全码面 200）。

### 遗留 / 路由
- `2026-10-08-proxy-per-channel` ⑩ 外部红（对等面 dirty）——已路由，不入本批。
- 设计档预算回填（估 vs 实读）——**待评审冻结解冻后一笔**（compose 20⇒22 ∥ README 252⇒256 ∥ 批内件 518⇒796 ∥ 各服务面档实读）。

**预算回填已办（2026-10-09 · 父侧）**：批面实读增量 ≈**+1246**（产品面 **+450**——估 ≈467 ∥ 批内件 **796**——估 ≈450）；逐档实读 = `design/PROJECT.md` §6 回填行 ∥ `gateway/API.md` §4（`config-admin.mjs` **182**；小计 +196）∥ `webui/WEBUI.md` §5 行尾注（`views-system` **222** ∥ `views-system-config` **105** ∥ `views-audit` **93** ∥ `style.css` **229**；小计 +217）∥ `ops/OPS.md` §6 行尾注（bin **180** ∥ compose **22** ∥ `.dockerignore` **12**；小计 +12）。「遗留/路由」第一条随之销记；「（拟新增）」两处翻「已落盘」。

**暂缓批复核（2026-10-09 · 收口轮）**：无——全库零「暂缓 · 复核条件」活标记（唯一历史标记者 `2026-09-30-core-release` 已于本日复启收口）。

**冻结段残留扫（收口轮）**：本批 §6 未决项零（预算回填、部署、走查、核销全落）；在册它批残留 = 无新增。
