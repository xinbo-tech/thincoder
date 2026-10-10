# 2026-10-10 · team-login-client-access
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-10 · 来源 = 用户 2026-10-10 11:56「开」——B1 批点火（团队协同第二步 · 第一批：客户端登录与接入；承需求 §2:31 + AC-31）。
> 台账 = #1212（server · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 来源与承需求

**来源** = 用户 2026-10-10 11:06–11:56 逐轮裁定（团队协同第二步定向）+ **11:56「开」= B1 批点火**。
**承需求** = `docs/server/requirements/PROJECT.md` §2:31（客户面接入与登录）+ **AC-31**（需求级判据）。
**前情** = 无（本批为团队协同第二步之首批——第二步定案落点见需求档 §1 ∥ §2:31–35）。

### 1.2 用户裁定（原话存档 · as-of 2026-10-10）

- 11:34「端侧肯定要登录，登录以后自动添加server的provider。你不登录，只复用成员key怎么判断启用不启用团队功能？」——① 端侧必须有登录 ② 登录后自动添加指向 server 的 provider ③ **登录态 = 团队功能开关**；父侧「只复用成员 key」案作废。
- 11:35「那肯定是直登啊！」——登录方式 = **直登**（服务器地址 + 用户名 + 密码 ⇒ token 落本地；密码不落盘）。
- 11:42「我认为这几条都很合理。」= 口径四件获批（下节）。

### 1.3 设计输入（口径四件——父侧提案 · 用户 11:42 批准）

| # | 件 | 定形 |
|---|---|---|
| ① | token 形态与生命周期 | 每次登录发一个 token（服务端存哈希 + 端标签如 `CLI@台式机`；列表可撤销）；**不设过期**；退出登录 = 本地删 + 服务端吊销该条 |
| ② | 登出对派生 provider 的处置 | 登录写入/更新一个**标记为「派生」**的固定名条目（如 `team`）；退出 ⇒ 停用/隐藏（**不删标记**），重登自动恢复；用户手工有同名 ⇒ 登录时提示 |
| ③ | 三端入口形 | VSC ∥ 桌面 = 设置页新增「团队」区（地址 + 账号 + 密码 + 登录/退出 + 当前态）；CLI = 同语义命令面入口（形随 CLI 惯例）；**能力与文案同构**（跨端对齐能力与文案，不齐像素） |
| ④ | 未登录态 | **可见但不可用**——团队面留占位/入口（「未登录——登录后可用」+ 去登录）；**不弹窗、不打断**；控制台侧未登录自然不可见 |

### 1.4 范围与纪律（设计须落）

- **面** = 三端（CLI ∥ VSC ∥ 桌面）**同批** + 客户端数据面骨架（`/api/client/*`，认证 = 登录 token）+ server 侧登录面复用（`POST /api/login` 现为控制台 cookie 面——端侧 token 形由设计定）。
- **纪律**：端侧同批（需求 §3）∥ 本机面不夺能力（需求 §3——不做离线缓存）∥ 真实 provider key 只存网关不变。
- **禁**：动个人/团队台账面（B2 范围）∥ team 记忆面（B3）∥ 需求档正文（需求级发现走上抛——父侧笔）。

### 1.5 授权

用户 11:56「开」= **B1 批点火**（设计轮派发）。设计评审点火 ∥ 批准 ∥ 实施派发**逐段待用户**（本批未获全链自动授权）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（修复轮（评审轮次 1 · 十号）∥ 实施期修复轮（舱 A 上抛 · 父侧裁定）逐条落地——供父侧核验）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**批任务与设计（eng-designer · 设计轮 · 2026-10-10——台账 #1212；需求 §2:31 + AC-31；§1 已读；轮次 = 初始轮（设计））**

本块 = 覆盖条目 ∥ 设计要点 ∥ 受影响文件与行数预算 ∥ 验收判据 ∥ 不在本批 ∥ 上抛与披露。

### 一、覆盖需求条目（本批）

- **§2:31（功能点 31——三端登录与接入；AC-31）**——本批全覆盖：① 三端（CLI ∥ VSC ∥ 桌面）登录入口与接入（登录成 ⇒ 该端可直接用团队服务器模型）∥ ② token 面 ∥ ③ 端侧凭据落点 ∥ ④ 退出（吊销）∥ ⑤ 未登录态（登录前明确提示）。
- 判据全文 = `docs/server/design/client/CLIENT.md` §4（服务面）+ `docs/core/design/TEAM.md` §5（端侧面）。

### 二、设计要点（逐条定形——全文在档，本块只收骨架）

1. **token 模型 = 一枚具名成员 key**（KD-SV-61）：`api_keys` 新行——`sk-tc-` + 随机；名 = 端标签（如 `CLI@台式机`；trim ≤40；空 ⇒ 默认名助手）；**无过期天然**（表无过期列）；**不受 20 上限**（服务端签发面不判——沿轮转 ∥ CLI 免限先例）；`/api/client/*` 与 `/v1/*` **同校验单源**（`requireApiKey`）；usage 归因零改（`key_id` 既有列）；**不进 `sessions` 表**（浏览器 cookie 面专属——零迁移，结构版本保持 v10）。
2. **服务端端点**（KD-SV-62——命名空间 `/api/client/*`）：`POST /api/client/login {username,password,label?}` ⇒ `{ok,token,member}`（401 `invalid_credentials` 同措辞同耗时 ∥ 429 `too_many_attempts` + `Retry-After` 沿双维锁）∥ `POST /api/client/logout`（吊销该枚——软删）∥ `GET /api/client/me` ⇒ `{member, token:{label,createdAt}}`；**零新错误码**；审计两型沿用（`login_success`/`login_failure` + `key_issue`/`key_revoke`——detail 携 `surface:"client"`；十型零增）。
3. **登录流程（核单源）**：核散列校验（复用 members verify 面）→ login-guard（复用）→ 签发 key（复用）→ upsert 派生 provider 条目 → 写 config（`writeConfigAtomic` 一次 mutate）。
4. **配置形（端侧）**：顶层 `team` 段 `{server, member{username,name}, label, token}`（token 在场 ⇔ 已登录 = 权威源；**不入 DEFAULTS**）；派生条目 `{name:"team", baseURL:"<server>/v1", apiKey:token, derived:true}` **追加 providers[] 表尾**；退出 ⇒ 摘 apiKey 留 derived（重登恢复）；隐藏判据 `derived && !hasKey`（四消费面各一处过滤）；同名手工条目 ⇒ 登录成 + 提示不覆盖。
5. **三端落点**：CLI = `team` 命令族（login ∥ logout ∥ status；密码隐藏回显（TTY）∥ stdin 行（非 TTY））∥ VSC = 设置面第六卡 ∥ 桌面 = 设置面第 8 段「团队」（三通道 `team:status`/`team:login`/`team:logout`）。
6. **文案同构（三端逐字）**：未登录「未登录——登录后可用」；失败三句（网络不可达 ∥ 用户名或密码错误 ∥ 登录尝试过于频繁）。
7. **决策记录**：KD-SV-61/62（server PROJECT.md §4 索引）+ D-TM1–6（`TEAM.md` §3——含被否候选）。

### 三、受影响文件与行数预算（现行 ⇒ 估；拟新增 = 标「（拟新增）」行）

**服务端**（产品面 ≈+77）：`thincoder-server/src/client/routes.mjs`（拟新增 ≈75；login ∥ logout ∥ me 三处理 + 注册行）∥ `thincoder-server/bin/thincoder-server.mjs` 182 ⇒ ≈184（import ∥ 注册行）；域面 = client 域新立（一档）；accounts ∥ store ∥ gateway ±0；`thincoder-server/package.json` ±0（`prepublishOnly` 清单 38 ⇒ 39——本批件入链）。

**核（thincoder-core/）**：`team.mjs`（拟新增 ≈180）∥ `config.mjs` 495 ⇒ ≈503（`team` 段加载归一 ≈8 行）。

**CLI（thincoder-cli/）**：`src/cli/team-command.mjs`（拟新增 ≈150）∥ `src/command-table.mjs` 192 ⇒ ≈200 ∥ `bin/thincoder.mjs` 188 ⇒ ≈190 ∥ `src/completions.mjs` 143 ⇒ ≈146。

**VSC（thincoder-vscode/）**：`webview/settings-team.js`（拟新增 ≈110）∥ `src/extension/team.mjs`（拟新增 ≈80）∥ `webview/settings.js` 199 ⇒ ≈205 ∥ `src/extension/panel-messages.mjs` 385 ⇒ ≈390 ∥ `src/extension/panel-messages-settings.mjs` 253 ⇒ ≈270 ∥ `src/extension/settings.mjs` 408 ⇒ ≈420 ∥ `src/extension/panel-settings-push.mjs` 121 ⇒ ≈130 ∥ `locales` 296 ⇒ ≈310（+≈14 键/表）。

**桌面（thincoder-desktop/）**：`renderer/views/settings-sections-team.mjs`（拟新增 ≈110）∥ `renderer/mount-settings-team.mjs`（拟新增 ≈80）∥ `src/main/team.mjs`（拟新增 ≈70）∥ `renderer/views/settings.mjs` 436 ⇒ ≈443 ∥ `renderer/views/settings-sections.mjs` 96 ⇒ ≈97 ∥ `renderer/mount-settings.mjs` 264 ⇒ ≈268 ∥ `src/main/ipc-registry.mjs` 94 ⇒ ≈99（+3 HANDLERS）∥ `src/preload/preload.cjs` 85 ⇒ ≈88（+3 CHANNELS）∥ `renderer/i18n-settings.mjs` 156 ⇒ ≈168（+≈12 键）；+3 通道（`team:status`/`team:login`/`team:logout`）。

**批内件（单元测试档——随批次档留存，不进仓套件）**：`docs/batches/2026-10-10-team-login-client-access.test.mjs`（服务面——估 ≈260 行）∥ `docs/batches/2026-10-10-team-login-client-access-ends.test.mjs`（三端面——估 ≈380 行）。

### 四、验收判据（点回需求 AC-31）

- **服务面**（AC-31①②）：`docs/server/design/client/CLIENT.md` §4——login 三态 ∥ token 兼用 `/v1/*` ∥ logout 即吊销（下一请求 401）∥ label ≤40 ∥ 免 20 上限 ∥ 审计两型 ∥ `sessions` 零涉；用例 N37/B27/E28/N39。
- **端侧面**（AC-31③④⑤）：`docs/core/design/TEAM.md` §5——三端入口 ∥ token 落 `~/.thincoder/config.json`（根 `team.token`）∥ 派生 provider 条目（name=team/derived）∥ 未登录态（提示句三端逐字）∥ 退出（吊销 best-effort + 本地清 token）。
- **机检面**：批内件两件（行为面断言）；真机面 = 收口轮（三端各实走：登录 → 模型可用 → 退出）。
- 三端入口逐条：CLI = `docs/cli/design/CLI-ENTRY.md` §2 `team` 行；VSC = `docs/vsc/design/SETTINGS.md` §2.20 ∥ U-S20；桌面 = `docs/desktop/design/SETTINGS.md` §2.21 ∥ §5 T-DSK65 + `docs/desktop/design/IPC.md` §2 三通道行。

### 五、不在本批

- 团队功能其余四面（台账 ∥ 记忆与知识库 ∥ 在场与通知 ∥ 会话协同）= 需求 §2:32–35——各自另轮（`docs/server/design/EVOLUTION.md` §2 顺序在册）。
- 服务端 token 管理面（登录 token 在控制台「我的 · key」页自然可见——不设团队专属管理列）⇒ 如需 ⇒ 另轮。
- 客户端自动重连/续期（token 无过期——机制上不需要）∥ 多服务器并存 ∥ keychain 存储——均不做（`CLIENT.md` §7 ∥ `TEAM.md` §6 边界段；需求变化 ⇒ 翻案点）。

### 六、上抛与披露（[上抛·知会] 设计句读法披露——如无异议按设计实施；详 = `docs/server/design/PROJECT.md` §9 R50）

1. **需求读法披露**：§2:31①「复用既有账号/密码散列与会话机制」本设计读法 = 复用散列校验 + 登录守卫 + token 签发；**`sessions` 表不用**（客户端 token 落 `api_keys`——token 须兼作 /v1 凭据 ∥ 无过期 ∥ 记账归因）。如本意 = `sessions` 表 ⇒ 与「不设过期」「模型可用」两条相抵——需重裁。
2. **存储面披露**：token 明文落 `~/.thincoder/config.json`（0600 先例——沿 provider apiKey 口径；keychain 不用）。
3. **能力面披露**：CLI 密码隐藏回显 = 新建能力（非 TTY 回落 stdin 行读）；端标签自动生成（`端名@主机名`，≤40 裁剪）。
4. **随正件**（父侧落——实施轮同拍，以当刻盘面为准）：`thincoder-server/package.json`（`prepublishOnly` 38 ⇒ 39）+ 门禁件数断言件随正（39 ⇒ 40）+ 桌面 IPC 白名单计数件（48 ⇒ 51）。
5. **部署收尾**（父侧执行）：server 侧零迁移零配置——新代码部署（镜像/进程重建）+ 三端拾新版本；收口轮实走。
6. **同批交叉项**：桌面 IPC 白名单 **48 ⇒ 51**（设计目标态——实施批落；计数件与实例翻正在实施轮同拍）。

**机检读数（本设计轮）**：`node scripts/doc-check.mjs` EXIT 0（悬空 0 ∥ 行宽闸过——读数详见本块尾追记）。

**机检读数追记（设计轮末笔）**：`node scripts/doc-check.mjs` **EXIT 0**——`OK(锚): 0 条悬空（闸态·阈值 0）` ∥ `OK(行宽): 源域全部 .md 无 >300 字符单行` ∥ 汇总 = 候选 55399 · 悬空 0 · 注记豁免 320 · 拟新增 55 · 迁移期引文 326 · 声明源缺位 0 ∥ 用例号 = 候选 2227 · 悬空 0 ∥ 路径/坐标 = 候选 22737 · 悬空 0 ∥ 符号·宽（报告面·不入闸）= 922。

本设计轮内自修两处（均报告）：① `docs/desktop/design/SETTINGS.md` 变更记录行 `src/main/team.mjs` 缺「（拟新增）」标记 ⇒ 悬空 1 条（闸态）——同行补标；② 四处正文行超 300 字符（`IPC.md` 白名单面 ∥ 计数行、桌面 `SETTINGS.md` §4 块、`ACCOUNTS.md` §1 条）⇒ 折行（零语义）。修正后复跑绿。

### 修复轮块（评审轮次 1 · 十号落修——2026-10-10 · eng-designer）

**裁定承据**：批档 §3 轮次 1——发现 2 = 父侧已直接收正需求档（`docs/server/requirements/PROJECT.md` §2:31③ ∥ AC-31——「会话撤销」⇒「登录 token 吊销（`api_keys` 行）」）+ 设计侧回声随正（`docs/server/design/client/CLIENT.md` §4 AC-31⑤ 行标题）；发现 11 = 非问题。**本修复轮 = 号 1 ∥ 3 ∥ 4 ∥ 5 ∥ 6 ∥ 7 ∥ 8 ∥ 9 ∥ 10 ∥ 12**（设计级修正——零机制改；6 ∥ 7 = 钉死句；5「不入菜单」∥ 7「删秒数」= 评审二选一的选定项，由在逐号行内）。

**逐号（号 → 改动——行位以现盘为准）**：

1 → `docs/server/design/PROJECT.md`：§1 落点句「域 6 ⇒ 7 档」+ §2.1「六域」⇒ **七域** + §2.1 表 **+client 域行**；`docs/server/design/EVOLUTION.md`：§1-G4/G6 句明示（第一步六域 + client 域 2026-10-10 B1 批补立）。
3 → `PROJECT.md` §6 本批块 ∥ `docs/core/design/TEAM.md` §4：批内件**两件对账**——服务端单件**入链**（`prepublishOnly` 38 ⇒ 39）∥ -ends 件**不入链**（跨面件无宿主产品链——登记面 = 两档互指）——逐件给由。
4 → `docs/server/design/accounts/ACCOUNTS.md` §2.1：`login_success` ∥ `login_failure` ∥ `key_issue` ∥ `key_revoke` 四行 detail 补 `surface?` + 取值域注（`"client"`——客户端面两写点 ∥ 余面键缺席）。
5 → `docs/desktop/design/SETTINGS.md`：KD-68 ③（复用链 **八行**——+team 行）∥ ④（`SCOPES` **十一**名 ∥ `settings.modal` 十一值 ∥ `SECTIONS` **八段** ∥ 菜单六名派生「去「模型」∥ 去「团队」」∥ 漂移排除句）∥ §2.1 **八段**枚举 ∥ §2.10 复用链八组 ∥ §2.11 现值注两处 ∥ §2.21 闭集随动条 ∥ §3.2 本批块随正（`MODAL_READS` **+1 行**（`team → loadTeam`）∥ `app-menu.mjs` **零改**（团队不入菜单——`SETTINGS_GROUPS` 六名不动）∥ `i18n.mjs` **432 ⇒ ≈433**（键数链注续链）∥ **闭集随动三件处置行**）+ **旧漂移件随正登记**（`docs/batches/2026-10-02-desktop-settings-menu-upgrade.test.mjs` ∥ `docs/batches/2026-10-02-settings-menu-trim.test.mjs`——排除句去「模型」⇒ 去「模型」去「团队」）∥ §4 机检面补闭集随动。
6 → 同档 §2.21 写面：「推 `teamStatus`」⇒「**回执后渲染面复读**」（`team:status` 复读 + provider 列表复读（`loadProviders` 既有读链）——零新推送通道 ∥ IPC 零动）；刷新调用点入 §3.2 行。
7 → `docs/core/design/TEAM.md` §2.5：删「（含等待秒数）」——由 = 秒数无载体（桌面回执 reason 三值闭集；补载体须动 IPC 回执形）+「三句逐字同句」判据优先；三端现即同拍（`docs/vsc/design/SETTINGS.md` §2.20 ∥ 桌面 §2.21 零改）。
8 → `TEAM.md` §4：`config.mjs` 行补越线注（>500 软线 ⇒ 主动拆分评估层）+ 拆分预案指针（`docs/core/design/CONFIG.md` §5 → `CORE-UNIFICATION.md` §2.8.1「核内逐档行数与拆分计划」）。
9 → `CLIENT.md` §1 ∥ `TEAM.md` §7：token 生命周期**已认账**两条——① 累积可预期（每次登录一枚 ∥ 无过期）·清理 = 用户面（key 列表逐把吊销）；② 换 server 重登 ⇒ 旧 server 的 token 不在本机·撤销径 = 旧 server 控制台 key 列表（仅文案；机制零改）。
10 → `docs/cli/design/CLI-ENTRY.md`：论域读数收正当刻实读——`bin/thincoder.mjs` **188** ∥ `src/command-table.mjs` **192** ∥ `src/command-interactive.mjs` **205**（as-of 2026-10-10；与 `TEAM.md` §4 基线同拍——同批两套基线消除）。
12 → `TEAM.md` §2.4 ∥ §3 D-TM3：消费面计数统一「**四消费面**」（与 `docs/core/design/PROVIDER.md` §6.25 同拍）。

**随正（同缺陷邻位——报告在案）**：`PROJECT.md` §1 落点句（域 6 ⇒ 7 档）；`TEAM.md` §3 D-TM3（「三端各一处」⇒「四消费面各一处」）；桌面 §2.11 现值注两处；桌面 KD-68 ③ 复用链（含于号 5）；`TEAM.md` §2.4 行宽折二行（行宽闸）。

**机检**（`node scripts/doc-check.mjs` · 仓根 `thincoder/`）：**EXIT 0**——汇总 = 候选 55468 · **悬空 0** · 注记豁免 320 · 拟新增 56 · 迁移期引文 326 · 声明源缺位 0；分面悬空 = 用例号 0 ∥ 路径/坐标 0 ∥ 符号·窄 0（符号·宽 = 报告面·不入闸——存量 930）；行宽 = 非豁免区带 0 行超 300；行数面 = 差异 4 条（报告态·回填工单——他档：`desktop/UI.md:501` ∥ `desktop/SHELL.md:183` ∥ `desktop/RENDERER.md:338` ∥ `desktop/PACKAGING.md:340`——非本批面）。

**未动（报告——非本轮授权面）**：`docs/desktop/design/IPC.md` §1 `ev:menu` 行「`SCOPES` 七名宽容」计数陈旧（现 10 ∥ B1 后 11）+「= `SECTIONS` 名序去「模型」」派生句 B1 后不精确——登记供父侧择批；`PROJECT.md` §6（2026-10-06 批记录行「板 2 档 + 域 6 档」）= 建档期史句——记录面不回改；档头「设置面板（七段）」与批注边界史句（「七段值面语义」类）= 非定义位未动。

**零新语义**（评审发现的直接导出项）。

### 实施期修复块（2026-10-10 · 舱 A 上抛 · 父侧裁定——eng-designer）

**号** = 实施舱 A `eng-coder#113` 上抛；**由** = `docs/core/design/TEAM.md` §2.2（同名手工 provider ⇒ 登录成 + 就地提示）∥ §2.3（退出网络失败 ⇒ 提示「服务端吊销未达」）**端侧载体缺位**——`docs/desktop/design/IPC.md` §2 三通道回执形 ∥ VSC `teamStatus` 形均无提示字段；**裁定** = 端侧载体加**可选字段**（取实现侧取法；保三端逐字同句判据——不做「仅 CLI 显示」）。
**落点（四处 + 各档变更记录一行）**：① `docs/core/design/TEAM.md` §2.2 ∥ §2.3 ∥ §2.5——返回形 + 端侧就地提示句 + 一次性语义（读面零提示字段）；② `docs/desktop/design/IPC.md` §2 团队族行——`team:login` 回执 `{ ok, reason?, notice? }` ∥ `team:logout` 回执 `{ ok, revokeDelivered? }`（通道集/白名单计数零变）；③ `docs/vsc/design/SETTINGS.md` §2.20——回执/`teamStatus` 形同拍；④ `docs/desktop/design/SETTINGS.md` §2.21——同拍。**核侧核对** = `team.mjs` 落盘版与裁定形一致（`{ ok:true, notice? }` ∥ `{ ok:true, revokeDelivered }` ∥ `teamStatus` 零提示字段——实读）。
**零新语义**（父侧裁定直接导出项）：`CLIENT.md` 零动（本修复不动 server 契约）∥ 零新错误码/提示句 ∥ 产品码零触。**机检读数** = `node scripts/doc-check.mjs` **EXIT 0**——汇总 = 候选 55491 · 悬空 0 · 注记豁免 320 · 拟新增 39 · 迁移期引文 326 · 声明源缺位 0；行宽 = 源域无 >300 字符单行。
**未动（报告——非本轮授权面）**：① 核 `team.mjs` `reason` 实装四值（含 `write_failed`——服务端已应答、本地写盘失败）∥ 失败形 `{ ok: false, reason }`，而档面作「reason 三值」+ 三句出词（无 `write_failed` 对位句）——档-码差一，供父侧择批；② `TEAM.md` §5/§6 未随动（判据/用例未点两字段——不在本轮四落点内）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**设计评审（B1 批 team-login-client-access：两新档 `client/CLIENT.md` ∥ `core/TEAM.md` + 随动 11 档 + 需求 §2:31/AC-31）——发现表 + VERDICT + 计数**

范围 = 在册 13 档全读（含两新档）；声明限制两条：① 无项目标准档 ⇒ 方法学合规以 AGENTS.md 项目指南 + 各档既有建档/变更记录先例判；② 仓根无文档地图 ⇒ Document ownership 降级为「档内/跨档单一权威源（D2 不复制）+ 板档 §3 文档地图」判。档-码对账三项（token 面 ∥ 端点断言 ∥ 受影响文件行数）已逐项核（详见发现 8/10/12 与行数对账）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership（域图） | 🟡 | 服务器板档 §2.1 责任地图仍述「六域 = gateway ∥ accounts ∥ metering ∥ store ∥ webui ∥ ops」（`thincoder/docs/server/design/PROJECT.md:20`）且表内无 client 域行，而 §3 文档地图已作「板 2 + 域 7」（同档 `:71`）——同档两处域集/域数不一，新域目录 `thincoder-server/src/client/` 未入责任地图；`EVOLUTION.md:14` G4 行同句「六域目录自第一步立」。 | 在 §2.1 表补 client 域行（代码 `thincoder-server/src/client/`；职责 = 客户端接入 login/logout/me；域档 = `client/CLIENT.md`）并把「六域」收正为含 client 的计数；G4 行同拍或明示该计数为「第一步六域」的史句。 |
| 2 | Requirements（规范面措辞） | 🟡 | AC-31 判据行仍作「退出 ⇒ 服务端会话撤销 + 团队面关闭」（`thincoder/docs/server/requirements/PROJECT.md:236`），§2:31③ 同句（`:169`），而 §2:31① 已收正为「端侧 token 落账号 key 面」（`:167`）+ 设计按 token（`api_keys` 行）吊销实现、`sessions` 零涉（`CLIENT.md:16`）——「会话」一词在规范面可被读成 `sessions` 表撤销，与已确认读法相抵。 | 把 AC-31 与 §2:31③ 的「会话撤销」逐字收正为「登录 token（`api_keys` 行）吊销」或就地加读法括注（沿 §2:31① 口径），使机检判据不可被读成 `sessions` 表撤销。 |
| 3 | Doc-state（跨档计数） | 🟡 | 批内件件数两处不一：服务器板档 §6 本批行作「批内件一件（`docs/batches/2026-10-10-team-login-client-access.test.mjs`——估 ≈260 行）」（`PROJECT.md:235`），而 `TEAM.md:110` 作「批内件两件：…（服务端面）∥ …-ends.test.mjs（核 + 三端结构面——估 ≈380 行）」（桌面侧亦按 -ends 件登记 = `docs/desktop/design/SETTINGS.md:470`）。 | 两处对账：服务器板面明示仅列服务端单件（`prepublishOnly` 入链件）并把 -ends 件登记为核/端侧批内件，或两处统一计为两件（含 -ends 件归属与是否计入门禁清单）。 |
| 4 | Document ownership（审计目录） | 🟡 | 审计事件目录 detail 列未随本批同步：`ACCOUNTS.md` §2.1 仍作 `{ ip }`（`:55`）/ `{ keyHint }`（`:59`），而本批在 §1 新增条（`:15`）与 `CLIENT.md:17` 均声明「detail 携 `surface:"client"`」——同一机制（审计 detail 形）在 owning 档内两处描述不一，且 `surface` 取值域（仅 client？控制台面缺省？）无定义。 | 在 §2.1 表相关四行 detail 列补 `surface` 字段并给取值域说明（客户端面 = `{ ip, surface:"client" }` / `{ keyHint, surface:"client" }`；余面键缺席），使批内件断言有单源形。 |
| 5 | Document ownership（桌面闭集涟漪） | 🟡 | 桌面加第 8 段后，`SECTIONS` 派生闭集未随动：本档 §2.1 仍枚举「面 = **七段**（渠道 / 模型 / agent 参数 / MCP / env（proxy ∕ shell） / tools（embedding ∥ websearch 两 key + 索引状态行） / models（consult ≤5 ∕ advisor 两 picker）」（`docs/desktop/design/SETTINGS.md:41`）、KD-68 ④ 仍作「菜单发出闭集 = 六名」+ 漂移检测「`SETTINGS_GROUPS` ≡ `SECTIONS` 名序**去「模型」**」（`:29`，镜像件 = `thincoder-desktop/src/main/app-menu.mjs`），而 §2.21 明写「设置面第 8 段「团队」（`SECTIONS` 追加序尾——不重排既有七段）」（`:306`）——`app-menu.mjs`（SETTINGS_GROUPS）∥ `MODAL_READS` ∥ `renderer/i18n.mjs`（键数链注）均未入本批受影响文件表。 | 明写「团队」是否入菜单组项（入 ⇒ `SETTINGS_GROUPS`/`app-menu.mjs` 与菜单闭集计数随正；不入 ⇒ 漂移检测判据补排除句），并把 `app-menu.mjs`、`MODAL_READS` 行、`i18n.mjs` 链注补入受影响文件表（或明示零改并给由）。 |
| 6 | Clarity / Feasibility（桌面刷新面） | 🟡 | 桌面「成 ⇒ 推 `teamStatus` + provider 列表刷新（派生条目随动）」（`docs/desktop/design/SETTINGS.md:307`）无通道载体：`IPC.md` 通道面为闭集——§2 白名单「48 项 ⇒ 51 项」仅三请求通道（`IPC.md:154`），§1 事件面「**二十四通道**一律携 `key`」（`:55`）无团队推送；`ev:config` 自写抑制（写经 `writeConfigAtomic` ⇒ 零推送）——该「推」与本体刷新（含 provider 列表随动的调用点）均无落点入表。 | 把桌面写面收正为「回执后渲染面复读」（沿桌面既有写后复读口径）并点名落点（团队段接线档 + provider 列表刷新调用点），或明确新增推送通道并同步 `IPC.md` 通道/白名单计数。 |
| 7 | Clarity（失败出词载荷） | 🟡 | 「登录尝试过于频繁（含等待秒数）」（`TEAM.md:66`）的秒数无载体：桌面回执「`{ ok, reason? }`」+「reason 三值 = `network` / `credentials` / `rate_limited`」（`IPC.md:145`）不含秒数字段，VSC 同句亦作「登录尝试过于频繁——三句逐字同」（`docs/vsc/design/SETTINGS.md:635`）——core `team.mjs` 错误分类返回形未定义，「逐字同句」与「含等待秒数」无法同时机检。 | 钉定 core `team.mjs` 错误分类返回形（如 `{ kind, retryAfterS? }`）并让三端渲染载荷携秒（或删「含等待秒数」括注），使三端文案同构判据可机检。 |
| 8 | Affected-file annotations（越线） | 🟡 | `thincoder-core/config.mjs` 标注「**495 ⇒ ≈503**」（`TEAM.md:86`）越 500 软线（>500 = 主动拆分评估层），该行未带越线/拆分预案注；`CONFIG.md` §5 仅有指 `CORE-UNIFICATION.md` §2.8.1 的指针（`docs/core/design/CONFIG.md:76` 括注「`thincoder-core/config.mjs`（带拆分计划）」）。 | 在 `TEAM.md` §4 该行补越线注 + 拆分预案指针（沿 `CONFIG.md` §5 指法），或在 `CONFIG.md` §6.4 就地注明 +≈8 后越线及其预案落点。 |
| 9 | Scope / Risk（token 生命周期） | 🟡 | 登录 token 累积与残留无处置且与既有上限相冲：每次登录新签一枚（`CLIENT.md:13`「**不受 20 上限**——沿「轮转 ∥ CLI 不受限」先例 …；不自动清理旧 token」），而自助签发上限为「每成员 **active key ≤ 20**（自助面判据）」（`ACCOUNTS.md:22`）——反复登录可先耗尽 20 ⇒ 控制台自助签发 400、`/api/me` key 清单膨胀；换 server 重登（单登录态覆盖）亦不吊销旧 server 的 token。 | 补一条 token 生命周期处置（同 `label` 登录先吊销旧枚 ∥ 登录 token 单独计数不计入 20 上限 ∥ 明确「累积可预期、由用户面清理」），并把该后果与换 server 重登的旧 token 处置明写为已认账项（含 AC 边界句）。 |
| 10 | Doc-state（读数漂移） | 🔵 | 同一批内两套基线：`CLI-ENTRY.md:7` 论域读数「`thincoder-cli/bin/thincoder.mjs`（壳：argv 预处理 + `USAGE` 常量装配 + 分发入口；**178**）」（as-of 2026-09-29）与 `TEAM.md:89`/`:90` 实读 192 ∥ 188 不一（本批增量基线取后者）。 | 顺手把该行读数收正到当刻实读，或注明「本批基线以 `TEAM.md` §4 为准」，消除同批两套基线。 |
| 11 | Clarity（未证符号） | 🔵 | 设计引用的两个符号/坐标在评审范围内无他处可证（unverified）：「客户端面门面 = 复用 `requireApiKey`（`thincoder-server/src/gateway/routes.mjs:25`）」（`CLIENT.md:14`）与「吊销当前 token 对应 key 行（`revokeKey`——立即生效）」（`CLIENT.md:26`）——在册服务器各档只述 `verifyKey` 与「每请求查库」。 | 实施前就地核对该两符号的导出名与行号（或改述为可核点名的单源入口），以免 ≈75 行预算建在未证门面上。 |
| 12 | Doc-state（计数口径） | 🔵 | 「隐藏判据 = `derived && !hasKey`」的消费面计数不一：`TEAM.md:53` 作「三端各一处过滤」却列 4 处（CLI 模型候选 ∥ CLI provider-admin ∥ VSC `providerStatus` ∥ 桌面 `providerList`），`PROVIDER.md:609` 同面作「四消费面各一处过滤」。 | 两处计数口径统一（「四消费面」），与 `PROVIDER.md` §6.25 逐字同拍。 |

**Out-of-scope note（无严重度）**：① `store/STORE.md` 不在册 ⇒ AC-31② 引用的列名 `api_keys.key_hash`（`CLIENT.md:50`）无法在册内核对（unverified）；② `docs/batches/2026-10-10-team-login-client-access.md`（批档）不在册 ⇒ 各档「口径①②③④」指涉与 R50 披露原文未逐条核；③ `webui/WEBUI.md`/`metering/METERING.md` 不在册 ⇒ 「既有 key 页/列表可撤销」面未核。

计数：🔴 0 ∥ 🟡 9 ∥ 🔵 3（共 12 条）。

VERDICT: pass

## §4 用户批准（主 agent）

## 4. 用户批准（主 agent 记）

**2026-10-10 12:40 · 用户一句「批准」**——B1 批获准进入实施（承父侧批准请求；非代签）。

- **依据（三条件齐备）**：① 设计评审通过（advisor #111——发现表 = §3 轮次 1；🔴0 ∥ 🟡9 ∥ 🔵3；设计令牌已签发，**值不入档**）；② 修复轮十号全落并经父侧逐条核验（§2 修复轮块；父侧**独立复跑** `doc-check` = EXIT 0 ∥ FAIL 行 0；提交 `7d96923a`）；③ 父侧裁定表 12 行全数收敛（Fixed×10 ∥ Not an issue×1 ∥ 附加裁定×1——裁定表在父侧会话面）。
- **批准范围** = §2 全量（server 新域 `client` ∥ 核 `team.mjs` ∥ CLI ∥ VSC ∥ 桌面登录面 ∥ 批内件两件）+ 随正六件（① `prepublishOnly` 38⇒39 ② 门禁件数断言件随正 ③ 桌面 IPC 白名单 48⇒51 ④ 旧漂移件两件排除句 ⑤ `IPC.md` `ev:menu` 行计数 ⑥ 桌面档头「七段」⇒「八段」）。
- **派发计划**（分面串并 · 同设计令牌复用）：**A（核+server）→ B（CLI）∥ C（VSC）∥ D（桌面）→ E（-ends 批内件）**；串行依据 = 端侧消费核 `team.mjs`（先落接口）。
- **父侧保留项**（不派舱）：`IPC.md` `ev:menu` 行计数 ∥ 桌面档头「七段」⇒「八段」（档面单行修正）∥ `API-CONTRACT` 重生成（脚本面）∥ 全链门禁（`prepublishOnly`）与收口轮（含三端实走——R50④⑤）。

## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
