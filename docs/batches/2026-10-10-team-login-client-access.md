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

**档-码差一修复（`write_failed` 补设计——父侧已裁 · eng-designer）**：**号** = 上轮报告 `eng-designer#118` 待裁项 1；**由** = 核 `team.mjs` 失败形实装 `reason` **四值**（`network` ∥ `credentials` ∥ `rate_limited` ∥ `write_failed`——本机配置落盘失败），而档面作「reason 三值」（`docs/desktop/design/IPC.md` §2 团队族行）+ 出词三句（无第四句对位）——档-码差一，父侧已裁；**裁定** = 保留第四值并补设计（写盘失败须真报警——并入既有理由之一 = 误导，禁）；第四句形随三句（短语形）——用词「本机配置写入失败」（三端逐字同句判据照旧；i18n 键归端侧）；**落点（四处 + 各档变更记录一行）** = ① `docs/core/design/TEAM.md` §2.5——失败理由域句（四值单源；**§2.5 原无该句**——现盘「reason 三值」仅存 `IPC.md`，按裁定单源落此）+ 出词表第四句 + 判据行同拍；② `docs/desktop/design/IPC.md` §2 团队族行——`reason` 三值 ⇒ 四值（逐值列全）+「词三句」⇒「词四句」；③ `docs/vsc/design/SETTINGS.md` §2.20——失败出词补第四句；④ `docs/desktop/design/SETTINGS.md` §2.21——同拍（四句列全）。**机检读数** = `node scripts/doc-check.mjs` **EXIT 0**——汇总 = 候选 55504 · 悬空 0 · 注记豁免 320 · 拟新增 39 · 迁移期引文 326 · 声明源缺位 0；行宽 = 源域无 >300 字符单行（区带豁免在效）；行数面差异 4 条（报告态——非本批面）。**零新语义**（父侧裁定直接导出项）：产品码零触（`write_failed` 实装零改）∥ `docs/server/design/client/CLIENT.md` 零动（server 契约零涉）∥ 三句既有用词零改 ∥ 零第五值。**未动（报告——非本轮授权面）**：`TEAM.md` §2.2 步 4 分类出词括注 ∥ §6 E1 用例括注（网络不可达 ∥ 401 ∥ 429——未含 `write_failed`）——不在本轮四处内，供父侧择批。

**实施期收尾小修（2026-10-10 · 父侧派发——#119 自报「到不了」两项 + 代码评审记一项 + 父侧机制钉死一项 · eng-designer）**：
**号** = ① `docs/core/design/TEAM.md` §2.2 步 4 分类出词括注未含 `write_failed` ② 同档 §2.5 无 `reason` 判据句（分类无单源）③ 同档 §6 E1 用例括注未含写盘失败位 ④ 同档 §2.1 `team` 段行「agent 不可写」与 settings 工具实装相抵 ⑤ `docs/vsc/design/SETTINGS.md` §2.20 i18n 估数未随第四句顺正；
**由** = `write_failed` 四值口径在档面三处未补齐 ∥ 措辞核读（`settings.mjs` 实装 = 未知键原样通过——非「不可写」：据此收措辞、行为零改）∥ 第四句 +≈1 键（i18n 估数顺正）；
**落点** = ① 同档 §2.2 步 4（补第四值「本机配置写入失败」）② 同档 §2.5（补判据句——核心分类单源）③ 同档 §6 E1（补写盘失败位：`write_failed` + 零假成功）④ 同档 §2.1 行（措辞收正——未知键原样通过）⑤ VSC §2.20（+≈14 ⇒ +≈15）+ 同档 §4 两行 i18n 估数顺正（VSC ≈311 ∥ 桌面 ≈169）+ 两档变更记录一行；
**零新语义 ∥ 行为零改**（父侧派发项直接导出；产品码零触；`docs/desktop/design/IPC.md` ∥ 桌面 `SETTINGS.md` 零动）；
**机检读数** = `node scripts/doc-check.mjs` **EXIT 0**——汇总 = 候选 55509 · 悬空 0 · 注记豁免 320 · 拟新增 27 · 迁移期引文 326 · 声明源缺位 0；行宽 = 源域无 >300 字符单行（区带豁免在效）；行数面差异 6 条（报告态——非本批面）；
**未动（报告——非本轮授权面）** = 桌面 `docs/desktop/design/SETTINGS.md` §3.2 两处 i18n 估数（`+≈12 键` ∥ `156 ⇒ ≈168`——与 VSC 同理应 +1 顺正（+≈13 ∥ ≈169）；本轮零动待父侧同步）。

### B1 设计面登记与估数补齐（修复轮 · 2026-10-10 · eng-designer）

**号** = ① 桌面 `docs/desktop/design/SETTINGS.md` §3.2 两处 i18n 估数未随第四句顺正（`156 ⇒ ≈168` ∥ `+≈12 键`——#120 报告未动项）；② 设计 §4 VSC 表未列 `thincoder-vscode/webview/chat-messages.js`（舱 C 上抛）；③ 本批五新消息无 `docs/vsc/design/WEBVIEW-PROTOCOL.md` §3.2 行（舱 C 上抛）；④ 判据位「本机配置写盘失败」与句面「本机配置写入失败」一字微差（#120 披露）。

**由** = 第四句 +≈1 键顺正欠账 ∥ `chat-messages.js` = webview 唯一消息分发表（`window.addEventListener("message")` 单点、三 `case` 接线 ≈+5）∥ §3.2「新增／变更一律入本节登记表」纪律 ∥ 用户可见句 = 「本机配置写入失败」（判据侧随正——同一档内一致）。

**落点（号 → 改动，行位以现盘为准）**：
1 → 桌面 `SETTINGS.md` §3.2 本批块两处——`156 ⇒ ≈169` ∥ `+≈13 键`（与 `TEAM.md` §4 同拍）。
2 → **落点校正**：派单写 `docs/vsc/design/SETTINGS.md` §4——实查该档 §4 = 不并项与历史沿革、全档无受影响文件表；「设计 §4 VSC 表」（舱 C 披露原文）按盘面 = `docs/core/design/TEAM.md` §4（受影响文件与行数预算）——VSC 块 +`webview/chat-messages.js` 行（**271 ⇒ ≈276**——三 `case` 接线 ≈+5）。
3 → `WEBVIEW-PROTOCOL.md` §3.2 **+行 27–31**（`teamStatus` ∥ `teamLogin` ∥ `teamLogout` ∥ `teamLoginResult` ∥ `teamLogoutResult`——方向 / 载荷 / 回执面在册）+ 计数三处同拍（标题 ∥ 纪律行 ∥ §7 D-P11）。
4 → `TEAM.md` §2.5 `reason` 判据句 ∥ §6 E1——「本机配置写盘失败」⇒「本机配置写入失败」（与句面同字）。
+ 三档变更记录一行（桌面 `SETTINGS.md` ∥ `TEAM.md` ∥ `WEBVIEW-PROTOCOL.md`）。

**零新语义**（父侧派发项直接导出）：产品码零触 ∥ `docs/desktop/design/IPC.md` 零动 ∥ `TEAM.md` §2 机制句零动（仅 ④ 同字面）∥ 零新消息 / 字段 ∥ §12 / §13 对表行随实施后重出（在册）。

**机检读数** = `node scripts/doc-check.mjs` **EXIT 0**——汇总 = 候选 55548 · 悬空 0 · 注记豁免 320 · 拟新增 27 · 迁移期引文 326 · 声明源缺位 0；行宽 = 源域无 >300 字符单行（区带豁免在效：变更记录 ∥ 历史沿革）；行数面 = 差异 11 条（报告态——含在飞实施读数漂移）。首跑悬空 1（本轮自修：新增行 27 发射点短形路径 ⇒ 全前缀 `thincoder-vscode/src/extension/settings.mjs`——复跑 0）。

**未动（报告——非本轮四项）**：① `TEAM.md` §2.5 域句括注「（本机配置落盘失败）」= 语义注（非句面用词）——未动（如需同字 ⇒ 示下）；② 桌面 §3.2 `mount-settings.mjs` **264 ⇒ ≈269** 与 `TEAM.md` §4 同档行 **264 ⇒ ≈268** 估数差一；③ `TEAM.md` §4 本批 VSC 两行与在飞实装读数存差（`panel-messages.mjs`「+3 case」vs 现盘两 `case` ∥ `panel-settings-push.mjs`「teamStatus 推送」vs 现盘 push 点住 `settings.mjs`）——#115 在飞、未证，供收口轮核；④ 批档 §2 初稿「三、受影响文件」VSC 行同缺 `chat-messages.js`——非本轮四处，供父侧择批。

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
**状态行**：实施完成（四舱交付块全落（5.A ∥ 5.B ∥ 5.C ∥ 5.D）；舱 B（CLI）· 审计零分歧 ∥ 评审 pass ×3 ∥ fix 2）



### 5.A · 舱 A（核 + server）· eng-coder · 2026-10-10

**范围**：派发计划 A 舱——server `client` 新域（`/api/client/*`）∥ 核 `team.mjs` 单源 ∥ 核 `config.mjs` `team` 段加载归一 ∥ 批内件（服务端面）。三端（B/C/D）与本册 `-ends` 批内件不在本舱；`IPC.md ev:menu` 行 ∥ 桌面档头 ∥ `API-CONTRACT` 重生成 = 父侧保留项。

**交付（四档 + 批内件）**：

| # | 档 | 动作 | 实读行数 | 对设计预算 |
|---|---|---|---|---|
| 1 | `thincoder-server/src/client/routes.mjs` | 新建（login ∥ logout ∥ me 三处理——复用 members/keys/guard/audit 单源） | **77** | ≈75（+2） |
| 2 | `thincoder-server/bin/thincoder-server.mjs` | +import 行 +注册行（共享 `loginGuard`） | 182 ⇒ **184** | ≈184 ✓ |
| 3 | `thincoder-server/package.json` | `prepublishOnly` 清单 38 ⇒ **39**（本批件入链；单行清单行数零变） | 在册 | ✓ |
| 4 | `thincoder-core/team.mjs` | 新建（登录 ∥ 退出 ∥ 状态 ∥ 标签 ∥ 派生条目 upsert/停用 ∥ 地址归一 ∥ 分类 ∥ 写盘单源） | **195** | ≈180（+15） |
| 5 | `thincoder-core/config.mjs` | `normalizeTeamSection` + `loadConfig` 归一行；不入 `DEFAULTS` | 495 ⇒ **510** | ≈503（+7——越 500 软线档面在册 + 拆分预案） |
| 6 | `docs/batches/2026-10-10-team-login-client-access.test.mjs` | 新建（服务端面批内件 10 例——入链） | **306** | ≈260（+46） |

**随正**：① `prepublishOnly` 38 ⇒ 39（本舱落）；② 七件门禁计数断言件 38 ⇒ 39——**本舱被系统写界拒绝（跨批兄弟件），已上抛；父侧已落讫**（父侧读数：清单 39 ∥ 断言 39 ∥ 缺档 0）。

**决策透明表（本舱裁量面）**：

| # | 决策点 | 取法 | 依据 |
|---|---|---|---|
| 1 | 端标签「端名」来源（档未钉） | 取**进程端名缝** `sessionEnd()`（cli/vscode/desktop）+ `node:os` `hostname()` ⇒ `端名@主机名`，≤40 裁剪；显式 `label` 同口径裁剪 | TEAM.md §2.2 步 1；端名单源 = `session-slots.mjs:115`；显式裁剪 = 评审发现修正（防服务端 400 误报网络不可达） |
| 2 | 失败分类边界（档仅列三类） | 不可达 ∥ DNS/TLS ∥ 超时 ∥ 非 401/429 应答 ⇒ `network`；200 而形不符（无 token）⇒ `network` | 三值闭集（TEAM.md §2.2 步 4）——档未穷举面取保守归并 |
| 3 | `write_failed` 第四值（档-码差一） | 实装保留——本地写盘失败（mtime 冲突 ∥ 畸形档）≠ 网络/凭据/限流；不产物假「登录成功」 | 父侧裁定保留 + 设计侧补句在办（端侧三舱对位句由父侧协调；本舱不自证文案） |
| 4 | 写入口根形守卫（档未涉） | mutate 首行 `assertWritableRoot`：非对象/数组根 ⇒ 拒写 ⇒ 归 `write_failed` | `writeConfigAtomic` 不校验根形（数组根 mutate 静默落空 ⇒ 假成功）；本档 0 值「不产出假成功」 |
| 5 | 登录/退出请求超时 | `AbortSignal.timeout(15_000)` ⇒ 超时归 `network` | 沿核内既有超时先例（auto-think ∥ generate-title ∥ embedding）；防悬挂 |
| 6 | 写盘路径 | `persistRaw`（= `writeConfigAtomic` + 路径缝）一次 mutate——端侧零自写盘 | TEAM.md §2.1「写盘 = writeConfigAtomic 一次 mutate」 |
| 7 | 上抛已裁项：D-TM4 ∥ §2.3 提示端侧载体缺位 | 核返回 `{ ok:true, notice?:"manual-name-conflict" }` ∥ 退出 `{ ok:true, revokeDelivered:boolean }`（`notice` 携码不携文） | 父侧 2026-10-10 裁定（端侧载体由设计修复轮补；三端文件本舱零触） |

**验证读数（全实跑）**：
- 批内件 **10/10 绿**（`node --test docs/batches/2026-10-10-team-login-client-access.test.mjs`，自 `thincoder/` 仓根）：N37 ∥ B27 三态（同措辞 ∥ 5 连败 429 + `Retry-After` ∥ label 三态）∥ N39 token 兼用 ∥ 20 上限豁免 ∥ E28 吊销即判 ∥ 审计四型 `surface:"client"` + 控制台键缺席 + 十型零增 ∥ v10 零迁移 + `sessions` 零涉 ∥ 链自检。
- 核面探针 **30/30 绿**（`.thincoder/tmp/2026-10-10-b1-core-probe/probe.mjs`——临时区诊断件，非批内件）：三态分类 ∥ 地址归一四例 ∥ 标签生成/裁剪 ∥ 派生条目形/表尾/停用/恢复 ⟂ 同名手工 notice 零覆盖 ∥ 退出两态（`revokeDelivered` true/false）∥ 根形守卫 ∥ 审计/库面读数。
- 归一化面 **5/5 绿**（一次性脚本）：形不符 ⇒ null ∥ 键级 trim ⟂ member 浅形 ∥ 完好段 + 派生条目消费链 ∥ `team` 不入 `DEFAULTS`。
- 真入口启动自检 **5/5 绿**（`boot-check.mjs`）：`bin/thincoder-server.mjs` + 临时 config——`ready` 行 ∥ `/healthz` 200 ∥ 三端点活体（400 ∥ 401 ∥ 401）。
- 语法：五档 `node --check` 全 OK。

**审计与代码评审轮次与终态**：
- **内部分歧审计（只读 explore · 阻塞 ×1）**：结论 = **零分歧**（四类 PARTIAL ∥ SILENT-SIMPLIFICATION ∥ DOC-DRIFT ∥ OUT-OF-LIST 各 0）；独立复证 = 五档 `node --check` 全绿；限制如实登记 = 该席位无执行面 ⇒ 未复跑测试（「全绿」为提交方实跑读数 + 断言文本实读）。
- **代码评审（advisor · code ×1 · 阻塞）**：**VERDICT: pass**（🟡1 + 🔵3，无 🔴）。fix round（评审后就地 ×2——均为评审自身建议项，随即复跑）：① `routes.mjs` 头注链路序收正（守卫先行 = 实装序）；② `team.mjs` 显式 `label` 同口径裁剪 ≤40。登记不动作两条：🟡 `config.mjs` 越 500 软线（档面已注越线 + 拆分预案——非 must-fix）∥ 🔵 行数预算漂移（`team.mjs` 195 ∥ 批内件 306——收口/回填轮按实读收正）。
- **终态 = clean**（审计零分歧 ∥ 评审 pass ∥ 评审后修正两处已复跑读数在册）。

### 5.C · 舱 C（VSC）· eng-coder · 2026-10-10

**范围**：派发计划 C 舱——VSC 设置面第 6 卡「团队」（两态：登录表单 ∥ 已登录态）+ 插件团队转口 + 登录/退出消息链 + 派生条目隐藏判据（`providerStatus` 一处过滤）+ 双语文案（14 键/表）。含表外必要接线一件（`webview/chat-messages.js`——消息分发单点，已上抛、父侧裁定继续实装、设计侧随补 #121）。核 ∥ server ∥ CLI ∥ 桌面 ∥ -ends 批内件 = 其他舱；设计档正文（`WEBVIEW-PROTOCOL.md` §3.2 五行登记 ∥ 受影响文件表补登）= 设计侧 #121，本舱零触。

**交付（八档 + 表外一件）**：

| # | 档 | 动作 | 实读行数（物理行口径） | 对设计预算 |
|---|---|---|---|---|
| 1 | `thincoder-vscode/src/extension/team.mjs` | 新建（核转口：`teamStatus`/`teamLogin`/`teamLogout`——零状态零副作用） | **34** | ≈80（三处理体实际落 `panel-messages-settings.mjs`） |
| 2 | `thincoder-vscode/webview/settings-team.js` | 新建（第 6 卡：两态渲染 ∥ 控件绑定 ∥ 回执出词 ∥ 就地重绘两门 ∥ 密码面） | **141** | ≈110 |
| 3 | `thincoder-vscode/src/extension/settings.mjs` | +import +隐藏判据（一处过滤）+ `pushTeamStatus` | 408 ⇒ **420** | ≈420 ✓ |
| 4 | `thincoder-vscode/src/extension/panel-settings-push.mjs` | +import +两条推送链调用（快照族拍） | 121 ⇒ **124** | ≈130 |
| 5 | `thincoder-vscode/src/extension/panel-messages-settings.mjs` | +import +`handleTeamLogin` ∥ `handleTeamLogout`（成 ⇒ 先推 `teamStatus` + `providerStatus` 再发回执） | 253 ⇒ **281** | ≈270 |
| 6 | `thincoder-vscode/src/extension/panel-messages.mjs` | +import 名 +2 case（`teamLogin` ∥ `teamLogout`——读面纯推送，无上行请求） | 385 ⇒ **389** | ≈390（实为 2 case，设计估 3） |
| 7 | `thincoder-vscode/webview/settings.js` | +import +第 6 卡序尾合成 + `bindTeamControls()` | 199 ⇒ **203** | ≈205 ✓ |
| 8 | `thincoder-vscode/locales/{zh,en}.json` | +14 键/表（未登录句 ∥ 状态行 ∥ 四失败句 ∥ 两提示句 ∥ 六标签） | 296 ⇒ **310/310** | ≈311（+≈15 估——实 14：逐字句全在，差 1 为估差） |
| 9 | `thincoder-vscode/webview/chat-messages.js`（表外·已披露） | +import 三函数 +3 case（`teamStatus`/`teamLoginResult`/`teamLogoutResult`） | 272 ⇒ **278** | 设计无预算行（#121 随补） |

**决策透明表（本舱裁量面）**：

| # | 决策点 | 取法 | 依据 |
|---|---|---|---|
| 1 | 团队态推送点 | `pushTeamStatus(panel)` 住 `settings.mjs`（vscode panel 级，镜像 `pushStatus`）；`panel-settings-push.mjs` 两条链调用（light 中置 agentSettings 之前 ∥ full 中置 shellCandidates 后） | §2.20 读面 = 推送；agentSettings 末位 = 打开等待器唯一触发拍不变量 |
| 2 | 无 `getTeamStatus` 上行 | 读面纯推送（快照族拍 + 登录/退出成拍）——不新增第三上行 | §2.20 写面只列 `teamLogin`/`teamLogout` 两条上行 |
| 3 | 端侧零自写盘 | handler 直调 `./team.mjs`（纯转口核）——不触 `config-io` 写面 | §2.20「端侧零自写盘」 |
| 4 | 成拍推送序 | 先推 `teamStatus` + `providerStatus` **再**发回执（同拍三消息序） | 一次性提示须落新态卡面（登录/退出当刻） |
| 5 | 隐藏判据位置 | `providerStatus()` 循环内 `if (entry.derived === true && !configured) continue`（`labels` 同循环后段同滤） | `TEAM.md` §2.4「四消费面各一处」——VSC = `providerStatus` |
| 6 | 快照载体 | 档内模块级 `_teamStatus`（父侧已裁 `settings-state.js` 零改） | 免动 `settings-state.js`（评审 🔵④登记两载体并存） |
| 7 | 重绘两门 | 变更门（JSON 比对，镜像 `updateProviderStatus`）+ 聚焦跳绘门（U-S10 同判）；面板未开 ⇒ 零动作 | §2.20 重建制 + U-S10（评审 🔵⑤登记收敛条件） |
| 8 | 密码面 | 零 trim 上行 ∥ 零缓存 ∥ 重建即清（重绘恒重建 DOM） | §2.20 密码面 |
| 9 | 请求容错 | 面板未开 ∥ 元素缺席 ⇒ 可选链零抛错（守卫容 `document.activeElement` 为 undefined） | 防推送早于建面（smoke 桩面无 activeElement） |

**验证读数（全实跑）**：
- 语法：`node --check` 八档全 OK（`team.mjs` ∥ `settings.mjs` ∥ `panel-settings-push.mjs` ∥ `panel-messages-settings.mjs` ∥ `panel-messages.mjs` ∥ `settings-team.js` ∥ `settings.js` ∥ `chat-messages.js`）；两 locale `JSON.parse` 过 + 键集对账 308/308 同集（14 键同位）。
- 逐字对账：7 条设计句（未登录句 ∥ 四失败句 ∥ 两提示句）对 `docs/core/design/TEAM.md` ∥ `docs/vsc/design/SETTINGS.md` 原文 `includes` 核——**7/7 逐字相等**。
- 临时区探针 **50/50 绿**（`.thincoder/tmp/b1-vsc-probe/probe.mjs`——诊断件，非批内件）：卡面/载荷/出词/守卫 26 ∥ 宿主链 20（登录三态 ∥ 退出两态 ∥ 隐藏判据两态 ∥ 消息序与盘面）∥ 接线源锁 4。
- 既有 smoke 件：`test/smoke-settings.mjs` 现盘 **red**——崩点 `webview/settings-providers.js:191`（本批零改档）+ 该测试 document 桩缺 `querySelector`（测试件本批零改）⇒ **既有红，与本批零因果**（守卫线属 #1053 批 2026-10-09 落；smoke 上次触碰 2026-09-30）；补桩后同件 **SMOKE-OK 绿**（预载件 `.thincoder/tmp/b1-vsc-probe/preload-doc-queryselector.mjs`——仅测试时补桩，产品码零动）。补桩小修归父侧择批。
- 未跑：仓套件（VSC 两清单现为空——按纪律归父侧收口拍）。

**关键披露**：
1. 表外必要接线 = `webview/chat-messages.js`（三 case 唯一落点）——已上抛、父裁「继续实装 + 设计侧随补」；如实披露即合规。
2. 设计侧两项在途（#121）：`WEBVIEW-PROTOCOL.md` §3.2 五行登记 ∥ 受影响文件表补登（`chat-messages.js`）——本舱零触。
3. 行数偏差（实读 ⇒ 预算）：`team.mjs` 34 ⇒ ≈80 ∥ `settings-team.js` 141 ⇒ ≈110 ∥ `panel-messages-settings.mjs` 281 ⇒ ≈270 ∥ `panel-settings-push.mjs` 124 ⇒ ≈130；均 < 500 硬限。
4. 消息计数（面板估「+3 case」实为 2——读面无上行 request）∥ settings 处理体 2（设计估 +3）。
5. designId：未随任务书到达本席 ⇒ 无值可回显（令牌值零字）。

**审计与代码评审轮次与终态**：
- **内部分歧审计（只读 explore · 阻塞 ×1）**：结论 = **零分歧**（PARTIAL ∥ SILENT-SIMPLIFICATION ∥ DOC-DRIFT ∥ OUT-OF-LIST 四类各 0）；独立复证 = 六档 `node --check` 全绿 + 逐字句/隐藏判据/消息链实读；限制如实登记 = 无执行面 ⇒ 未复跑测试；并独立复核出 smoke 既有红一条（与本批零因果——读数在册）。
- **代码评审（advisor · code ×1）**：**VERDICT: pass**（🔴 0 ∥ 🟡 3 ∥ 🔵 3）。fix round = **0**（无 must-fix 项）：三 🟡 = ① 登录成拍不刷模型候选面（模型面唯一来源 = `fullStatus` 的 `models` 载荷——实现与 §2.20 写面一致，时点取舍归父侧/设计侧 ∥ 收口轮口径）② `WEBVIEW-PROTOCOL.md` §3.2 五行登记（设计侧 #121）③ `chat-messages.js` 表补登（设计侧 #121）；三 🔵 = ① 快照载体两制（`_teamStatus` vs `SS`）② 两门收敛条件未明示 ③ 两处行数读数 vs 设计估。
- **终态 = clean**（审计零分歧 ∥ 评审 pass ∥ 零 must-fix ⇒ 零修正轮；评审后未再触产品码）。

### 5.D · 舱 D（桌面 · 设置第 8 段「团队」）· eng-coder · 2026-10-10

**范围**：派发计划 D 舱——桌面设置面第 8 段「团队」（两态 + 结果行）∥ 三新档（核转口 ∥ 段体 ∥ 装配）∥ 段集与闭集随动（`SECTIONS` ∥ `SCOPES` ∥ `MODAL_READS`）∥ 通道三件套（`preload.cjs` ∥ `ipc-registry.mjs` ∥ `ipc.mjs` 档头计数）∥ 隐藏判据一处（`providerList`）∥ i18n 十五键两语 ∥ 批内件（桌面面）。非本舱：跨批 `docs/batches/*.test.mjs` 随正（写界拒）∥ `-ends` 件 ∥ `IPC.md ev:menu` 行与桌面档头单行（父侧保留项）∥ 核 ∥ server ∥ CLI ∥ VSC。

**交付（九随动 + 三新 + 批内件一件）**：

| # | 档 | 动作 | 实读行数 | 对设计预算 |
|---|---|---|---|---|
| 1 | `thincoder-desktop/src/main/team.mjs` | 新建（核转口三件：状态 ∥ 登录 ∥ 退出——零状态零自写盘） | **35** | ≈70（纯转口——低估 35） |
| 2 | `thincoder-desktop/renderer/views/settings-sections-team.mjs` | 新建（段体两态 ∥ 结果行六句 ∥ 草稿标记） | **118** | ≈110（+8） |
| 3 | `thincoder-desktop/renderer/mount-settings-team.mjs` | 新建（`createTeam`：状态读 ∥ 登录/退出两出口 ∥ 写成功复读两调用点 ∥ 开面复位） | **131** | ≈80（+51） |
| 4 | `thincoder-desktop/renderer/views/settings.mjs` | `SECTIONS` +1（序尾）∥ 段模型 team 切片 ∥ 段分派支 ∥ 档头**八段** | 436 ⇒ **448** | ≈443（+5） |
| 5 | `thincoder-desktop/renderer/views/settings-sections.mjs` | re-export `teamBody` | 96 ⇒ **100** | ≈97（+3） |
| 6 | `thincoder-desktop/renderer/mount-settings.mjs` | `MODAL_READS` +1 行 ∥ `SCOPES` 十一 ∥ `createTeam` 装配 ∥ handlers 合并 ∥ `openSettings` 包装 ∥ `refreshSettings` +`loadTeam` ∥ 组开复位 | 264 ⇒ **292** | ≈269（+23） |
| 7 | `thincoder-desktop/renderer/i18n-settings.mjs` | +15 键两语（62 ⇒ **77**） | 156 ⇒ **190** | ≈169（+21；键 +15 vs 估 +13） |
| 8 | `thincoder-desktop/renderer/i18n.mjs` | 键数链注续链（62 ⇒ 77 ∥ 323 ⇒ 338 + 前批未续计订正） | 432 ⇒ **436** | ≈433（+3） |
| 9 | `thincoder-desktop/src/main/ipc-registry.mjs` | +3 HANDLERS（末位 49–51）∥ 档头计数 48 ⇒ 51 | 94 ⇒ **99** | ≈99 ✓ |
| 10 | `thincoder-desktop/src/preload/preload.cjs` | +3 CHANNELS（末位三）∥ 定序注 ∥ 档头计数随动 | 83 ⇒ **87** | ≈88（−1） |
| 11 | `thincoder-desktop/src/main/ipc.mjs`（**越设计文件表**） | 档头计数 48 ⇒ 51（与随正③ 计数件同族） | 297 ⇒ **299** | 无预算行（已在册报告） |
| 12 | `thincoder-desktop/src/main/providers.mjs`（**设计表缺行**） | +`isHiddenDerived` 过滤（隐藏判据一处——`derived ∧ 无 key` ⇒ 滤除） | 302 ⇒ **311** | 无预算行（三表缺行——上抛） |
| 13 | `docs/batches/2026-10-10-team-login-client-access-desktop.test.mjs` | 新建（桌面面批内件 **10 例**——含跨端 zh 逐字同句腿） | **345** | 设计名册只列 `-ends` 件（名册差——上抛） |

**随正**：③ 桌面 IPC 白名单计数件（48 ⇒ 51，七件断言 48/47）——**被系统写界拒绝（跨批兄弟件），已上抛**（与舱 A ② 同因）；④ 两旧漂移件排除句（`2026-10-02-desktop-settings-menu-upgrade.test.mjs:204` ∥ `2026-10-02-settings-menu-trim.test.mjs:103/:107`——去「模型」⇒ 去「模型」去「团队」）——**同上被拒，上抛**；⑤⑥ = 父侧保留项（本席零触，见披露 4）。

**决策透明表（本舱裁量面）**：

| # | 决策点 | 取法 | 依据 |
|---|---|---|---|
| 1 | 开面即读的落点 | 装配口包装 `openSettings`（`exits.openSettings` 原样 + `loadTeam`）——不动 `mount-settings-exits.mjs`（不在设计文件表） | §2.21 ⑤「开（两径）⇒ 本组读取链」∥ KD-68；越文件清单在册 |
| 2 | 出口表合并 | `Object.assign(exits.handlers, team.handlers)`——单一 `exits.handlers` 表，对外零改 | 「唯一 handler 表」纪律（页 ∥ 弹窗两面同表） |
| 3 | 结果行载体 | `settings.team.notice` 段切片（登录/退出**当刻就地**）——不用面板级 `settings.notice`（留给各段 `report`） | §2.21 ④「失败 ⇒ 就地错误行」∥ 三端逐字句 |
| 4 | 一次性提示清除 | 开面两径（页 ∥ 弹窗）`resetNotice()` 清（切片余键并持）；`loadTeam` 复读**零清**（读面零提示字段） | §2.21 ⑤「本组面态复位（限本组）」∥ ④ |
| 5 | 表单空字段分类兜底（档未穷举） | 无地址 ⇒ `network`；凭据不全 ⇒ `credentials`——**两径零发送** | 保守归并（沿 5.A 决策 2 同法） |
| 6 | 成员显示值 | `member.name ?? member.username ?? null`（两缺 ⇒ 空，零假造） | `TEAM.md` §2.1 成员形（`name` 可缺） |
| 7 | 无 in-flight 态 | 不加 pending 门（连点两次会发两次 `team:login`）——设计未作要求，既有 provider 写面同式 | 评审 🔵 登记（可选收敛） |
| 8 | i18n en 三句 | 收正为与 VSC en 同句（`Failed to write local config` ∥ `…not added automatically; rename or delete it…` ∥ `Server revocation not delivered`） | 评审 🔵④ 建议；zh 判据已逐字达，en 无钉取跨端一致 |
| 9 | 批内件另立 | 桌面面批内件 `…-desktop.test.mjs`（与设计名册 `-ends` 并列） | 单测「随批留存」纪律：本舱改动期反馈环留档 |

**验证读数（全实跑）**：

- 批内件 **10/10 绿**（`node --test docs/batches/2026-10-10-team-login-client-access-desktop.test.mjs`，自 `thincoder/` 仓根）：词面十五键两语 + 跨端 zh 七句逐字 ∥ 八段序尾 ∥ 未登录表单三字段 + 草稿标记（地址 ∥ 用户名携、**密码不携**）∥ 已登录状态行三读 + 退出钮 ∥ 结果行六句 + 段态门 ∥ 装配七径（开面随读 ∥ 弹窗读链恰一通道 ∥ 表外组拒 ∥ 登录 ∥ 退出 ∥ 失败 ∥ 空表单门两态）∥ 隐藏判据两态 ∥ 通道三件套（51 ∥ 末位三 ∥ HANDLERS 闭合 ∥ 三档头 ∥ 订阅面 24 零动）∥ 转口档直调四态。
- 临时区探针 **23/23 + 9/9 绿**（`.thincoder/tmp/2026-10-10-b1-desktop-probe/probe.mjs` ∥ `probe2.mjs`——诊断件，非批内件）：段形 ∥ i18n ∥ 装配 ∥ 隐藏判据 ∥ 通道闭合 ∥ 转口四态。
- 桌面定向跑（新红逐件归因；**pre-B1 基线 = `git stash` 本舱十档后同仓实测**，排除他舱在场干扰）：B1 新红全部为「闭集/计数随动件」——`model-menu-parity:117` ∥ `parity-b10-ui-w2:505/:508/:511/:514` ∥ `parity-b10-ui-w3:555/:556/:560/:563` ∥ `desktop-residuals:379` ∥ `menu-system:286-288` ∥ `subagent-panel-live-face:323/:324` ∥ `parity-b8-ipc:42` ∥ `menu-upgrade:171/:204 ∥ :271/:278-279` ∥ `settings-menu-trim:103/:107` ∥ `add-dialog-unify-desktop:166`（SCOPES 十 ⇒ 十一）∥ 计数与键数件（`channel-tier-retire:173/:174` ∥ `attach-file-support:363/:364` ∥ `i18n-split:58/:120/:123`——`SETTINGS_DICT` 62 ⇒ 77 ∥ `HOST_DICT` 322 ⇒ 338 ∥ `settings.mjs` 437 ⇒ 448 ∥ `settings-sections.mjs` 96 ⇒ 100）；**与本批零因果的预存红**（pre-B1 同红，实测）：`settings-layout` 3 条 ∥ `trim:134` ∥ `menu-upgrade:505` ∥ `w3:116`（S11/T8 agent 投影）∥ `residuals:322`（M-679b——假 DOM `querySelectorAll` 桩缺）∥ `channel-tier-retire:165`（HOST 322 ⇒ 323 前批漂移）∥ `attach-file-support:341`（VIEWS 149 ⇒ 150 前批漂移）∥ `i18n-split` 四腿（A1/A2/A4/A6）∥ 抖动腿 `attach-file-support:107/:117`（时敏，两跑异））；恒绿对照片 `provider-config-parity-desktop` 6/6 ∥ `light-round-6` 3/3。
- 语法：十三档 `node --check` 全 OK；预载档 CJS `require` 过 + `CHANNELS` 51 ∥ `EVENT_CHANNELS` 24 实读。
- 未跑：仓套件（按纪律归父侧收口拍）。

**关键披露**：

1. **越出清单（已报告）**：`src/main/ipc.mjs` 档头计数（越设计文件表——与随正③ 计数件同族）∥ `renderer/mount-settings.mjs` 加装开面包装与组开复位（同档表内，行数超估）∥ 新增批内件一件（设计名册只列 `-ends`）。
2. **设计表缺行（上抛）**：`src/main/providers.mjs` 系 B1 实改件（隐藏判据一处——`TEAM.md` §2.4 ∥ §4 指名「桌面 `providerList`」），但 `TEAM.md` §4 ∥ `SETTINGS.md` §3.2 ∥ `IPC.md` §3.1 三表均无该件行，且 `IPC.md` 该件行载 302（实读 311）——建议回填轮补入表与行数账。
3. **跨批随正被拒（上抛）**：③ 白名单计数件（七件断言 48/47）+ i18n 键数件（`2026-09-29-i18n-split` 基线 322 条内零 `settings.team.*` 新键 ⇒ 与现 `HOST_DICT` 338 不等）——`docs/batches/*.test.mjs` 属他批，系统写界拒（实测两件拒收）；父侧择批落。
4. **本席曾误改一处并已回退**：曾据「随正⑤」将 `docs/desktop/design/IPC.md:39` 的 `SCOPES` 计数收正为「十一」；随即发现该项为**父侧保留项**（§2 父侧保留项行「`IPC.md` `ev:menu` 行计数 ∥ 桌面档头单行修正」），即行回退——现盘 byte 复原（`git status -- docs/desktop/design/IPC.md` 干净）；⑤⑥ 仍归父侧，零残留。
5. **实读 vs 设计估（回填轮按实读收正）**：`mount-settings-team.mjs` 131 ⇒ 估 ≈80（+51——档头注 12 ∥ 归一 helpers ∥ 表单现读 ∥ 状态读 ∥ 两出口 ∥ 复位，全为判据面所必需）∥ `i18n-settings.mjs` +21 行、键 **+15**（估 +13）∥ `mount-settings.mjs` +23 ∥ `src/main/team.mjs` −35（估按含逻辑体估、实为纯转口）∥ `settings-sections-team.mjs` +8；皆 < 500 软线。
6. **零改确认**：`src/main/app-menu.mjs`（`SETTINGS_GROUPS` 六名不动——团队不入菜单）∥ `renderer/mount-settings-exits.mjs`（不在设计文件表）——两件现盘零 B1 痕迹。

**审计与代码评审轮次与终态**：

- **内部分歧审计（只读 explore · 阻塞 ×1）**：结论 = **DEVIATIONS（报告级，零阻断）**——PARTIAL 1（④ 两旧漂移件随正被写界拒——上抛在案）∥ DOC-DRIFT 1（`providers.mjs` 三表缺行 + 行数账未随动）∥ SILENT-SIMPLIFICATION 0 ∥ OUT-OF-LIST 0（**无未报告越出项**）；独立复证 = 十三档 `node --check` 全绿 + A–J 逐条实读；限制如实登记 = 该席位无执行面 ⇒ 未复跑测试（读数均提交方实跑）。
- **代码评审（advisor · code ×1 · 阻塞）**：**VERDICT: pass**（🔴 0 ∥ 🟡 2 ∥ 🔵 4）。**fix round = 1**：🔵④（en 三句与 VSC en 同句）就地收正 + 批内件补「跨端 zh 逐字同句」腿（`A2` 腿）——随即复跑批内件 **10/10 绿**、两探针绿；其余登记不动作：🟡① `providers.mjs` 表缺行（父侧/设计侧笔）∥ 🟡② 批内件名册登记与 `-ends` 去重（父侧）∥ 🔵③ 行数/键数估漂（回填轮）∥ 🔵⑤ 无在途门（可选）∥ 🔵⑥ `i18n.mjs:27` 键数链机检指针指向 `thincoder-desktop/test/views-chrome-vocab.test.mjs`（现盘不存在——存量行，登记）。
- **终态 = clean**（审计零阻断偏差 ∥ 评审 pass ∥ fix 1 已复跑；评审后产品码零再触——除已复跑的 i18n 三句收正）。

### 5.B · 舱 B（CLI）· eng-coder · 2026-10-10

**范围**：派发计划 B 舱——CLI 侧 `team` 命令族（login ∥ logout ∥ status：旗标 ∥ 问句 ∥ 隐藏回显 ∥ 逐字文案）∥ 注册三处（`command-table.mjs` ∥ `bin/thincoder.mjs` USAGE ∥ `completions.mjs` 三套）∥ 派生条目隐藏判据两消费面（`model-picker.mjs` ∥ `provider-admin.mjs`）。非本舱：核 ∥ server（舱 A）∥ VSC（舱 C）∥ 桌面（舱 D）∥ 批内件（其他舱范畴）∥ 设计档正文（禁改）∥ 跨批锁件（写界拒——上抛）。

**交付（六档）**：

| # | 档 | 动作 | 实读行数 | 对设计预算 |
|---|---|---|---|---|
| 1 | `thincoder-cli/src/cli/team-command.mjs` | 新建（三子命令 ∥ 旗标解析 ∥ 三态输入面：TTY 可见 ∥ TTY 隐藏回显 ∥ 非 TTY 行读 + 粘性 EOF 兜底 ∥ 四失败句 + 两提示句逐字映射） | **239** | ≈150（+89——输入面三态 ∥ 粘性兜底 ∥ 逐字映射） |
| 2 | `thincoder-cli/src/command-table.mjs` | +import +`case "team"`（`exitSoon(code)`） | 192 ⇒ **201** | ≈200（+1） |
| 3 | `thincoder-cli/bin/thincoder.mjs` | USAGE +2 行 ∥ 白名单外命令注列举 +`team` ∥ 头注「九薄命令族」 | 188 ⇒ **190** | ≈190 ✓ |
| 4 | `thincoder-cli/src/completions.mjs` | 三套 `team` 词面（bash 顶层 + `case "$prev"` ∥ zsh 顶层 + `$words[2]` ∥ fish 顶层 + 子命令 + 旗标） | 143 ⇒ **156** | ≈146（+10——设计估 +3） |
| 5 | `thincoder-cli/src/tui/model-picker.mjs`（**设计表缺行**） | +import/再出口 ∥ 两处过滤（模型候选 ∥ 槽位面）∥ `Remove provider…` 守卫改用过滤后计数 | **324** | 无预算行（上抛） |
| 6 | `thincoder-cli/src/tui/provider-admin.mjs`（**设计表缺行**） | +import `hasKey` + `isDerivedProviderHidden` 谓词（单源）∥ 三流过滤（remove ∥ key ∥ context） | **248** | 无预算行（上抛） |

**决策透明表（本舱裁量面）**：

| # | 决策点 | 取法 | 依据 |
|---|---|---|---|
| 1 | 未登录态出口码 | `logout` ∥ `status` 未登录 ⇒ 未登录句 + 指引，出口 **0**（幂等）；失败 ⇒ 出口 1 | 未登录 = 状态面非错误；fail-closed 仅对未知参/缺子命令 |
| 2 | 输出流分派 | 结果行 = stdout；问句 ∥ 失败句 ∥ 一次性提示 = stderr | 问句先例 = `setup-wizard.mjs`；提示须落登录/退出当刻（读面零提示字段） |
| 3 | 非 TTY 输入面 | stdin 行读 + 读完补行尾；EOF ⇒ **粘性**标志（后续读取恒取空串 ⇒ 上层凭据门分类出词，不静默/不悬挂） | 评审轮 1 🟡① 修正；「不产出假成功」同族 |
| 4 | 空旗标 | `--server ""`/纯空白 ⇒ 视同缺省回落问句 | 评审轮 1 🔵⑤ 修正——失败理由与实际对位 |
| 5 | 隐藏判据单源 | `isDerivedProviderHidden(provider)` 定义于 `provider-admin.mjs`，`model-picker.mjs` 再出口（同引用）；「持 key」= 核 `model-ref.mjs` `hasKey` | `TEAM.md` §2.4 ∥ `PROVIDER.md` §6.25/§6.22（trim 非空单源） |
| 6 | Remove 守卫 | `agent.providers.length > 1` ⇒ 过滤后可见数 | 防「唯一可移除项被隐 ⇒ 菜单开空表」死路 |
| 7 | 文案口径 | 固定句（未登录句 ∥ 四失败句 ∥ 两提示句）逐字中文；问句/结果行英文 | `TEAM.md` §2.5 单源；`notice` 携码不携文（CLI 映射文本） |

**验证读数（全实跑）**：

- 语法：六档 `node --check` 全 OK。
- 临时区探针 **53/53 绿**（`.thincoder/tmp/2026-10-10-b1-cli-probe/probe.mjs`——诊断件，非批内件）：隐藏判据真值表 ∥ 两消费面过滤行为 ∥ 六句逐字 ∥ 注册面 ∥ 补全发射。
- 端到端 **49 检查全绿**（同目录 `e2e.mjs`——进程内桩 HTTP `login` ∥ `logout`，CLI 真入口子进程 + 沙箱 HOME/USERPROFILE）：`status` 三读（未登录/已登录/退出后）∥ `login`（管道密码）⇒ config 派生条目形 ∥ `logout`（Bearer 吊销 + token 摘除 + 派生条目摘 key；`revokeDelivered` 面）∥ 重登 upsert ∥ 同名手工条目零覆盖 + 一次性提示逐字 ∥ 错凭据/网络不可达失败句逐字 ∥ usage 四态 ∥ `--help` 两行 ∥ 空旗标回落问句 ∥ EOF 空输入/半程（出口 1 + 失败句，不静默/不悬挂）。
- 补全真壳腿：`bash -n` 出口 0 ∥ source 冒烟（`complete -F _thincoder thincoder`）∥ 逐态驱动（`team→login logout status` ∥ `team login --→--server --user` ∥ 顶层含 `team`）。zsh ∥ fish 本机不可得（真壳未跑——沿既有先例）。
- 真 HOME 读数：`thincoder team status`（未登录）= 「未登录——登录后可用」+ 指引行，出口 0；`team login --badflag` ⇒ usage（stderr）+ 出口 1。
- 既有件复跑：批内件 **10/10** ∥ `session-carryover-cli-vsc` **11/11** ∥ `provider-config-parity-cli` **4/4** ∥ `provider-default-model-purge-cli` **8/8** 绿；`defect-fixes-cli` **3/5**（2 红 = 本批补全词面变更所致）∥ `crossline-clearance-cli` **3/4**（1 红——含 #894 前置红）；两件修正副本复跑 **5/5** ∥ **4/4** 绿（同目录 `fixed-*.test.mjs`）；`structure-split-2` **1/5**（4 红 = 前置红，改动前同读数）。
- 未跑：仓套件（按纪律归父侧收口拍）。

**关键披露**：

1. **设计表缺行（上抛）**：`model-picker.mjs` ∥ `provider-admin.mjs` 系判据必触件（`TEAM.md` §2.4「四消费面」CLI 两侧 + 派发任务书要点），但 `TEAM.md` §4 CLI 表仅四行（少此两行）；桌面 `src/main/providers.mjs` 同族缺行（舱 D 在册）——建议回填轮补入表与行数账。
2. **跨批锁件被写界拒（上抛）**：`2026-09-30-defect-fixes-cli.test.mjs`（词表 +`team` ∥ bash/zsh 分派计数 2⇒3）∥ `2026-09-30-crossline-clearance-cli.test.mjs`（`"migrate audit list"` ∥ fish 子命令行 ∥ 顶层词表 +`team` ∥ zsh ledger literal——其中两处为 #894 前置陈旧）——修正副本已验绿，条文在报告（父侧落）。
3. 行数偏差 vs 设计估：`team-command.mjs` 239 ⇒ 估 ≈150（+89）∥ `completions.mjs` 156 ⇒ 估 ≈146（+10）；均 < 500 软线。
4. 注释枚举收正两处：`command-table.mjs` 头注「八⇒九薄命令族」∥ `bin/thincoder.mjs` 白名单列举 +`team`；评审轮 2 New 行（`bin/thincoder.mjs:26` 同句「八」残留）于轮 3 前收正为「九」。
5. `structure-split-2` 前置红 4/5（冻结行数/sha 陈旧 + ENOENT，涉其它档）——非本舱；本批仅使其 model-picker 行数读数 324（该件本已红）。
6. designId：未随任务书到达本席 ⇒ 无值可回显（令牌值零字）。
7. 临时区诊断件留存（探针 ∥ e2e ∥ 桩 ∥ 两修正副本 ∥ 完成面驱动脚本）——非产品树。

**审计与代码评审轮次与终态**：

- **内部分歧审计（只读 explore · 阻塞 ×1）**：结论 = **零分歧**（PARTIAL ∥ SILENT-SIMPLIFICATION ∥ DOC-DRIFT ∥ OUT-OF-LIST 四类各 0）；独立复证 = 六档 `node --check` 全绿 + 六句逐字双向比对 + 零自写盘 ∥ 命令面无越界 ∥ `hasKey` 复用 ∥ 补全三套实读；限制如实登记 = 该席位无执行面 ⇒ 未复跑测试（「全绿」为提交方实跑读数 + 断言文本实读）。
- **代码评审（advisor · code · 阻塞 ×3 轮）**：轮 1 = **VERDICT: pass**（🔴 0 ∥ 🟡 2 ∥ 🔵 3）。**fix round 1**：① 非 TTY EOF 粘性标志 + TTY `askVisible` close 兜底 ② 空旗标视同缺省 ③ 两处注释枚举收正——随即复跑（`node --check` 6/6 ∥ 探针 53/53 ∥ e2e 49 检全绿 ∥ 既有件同读数）；🟡② `TEAM.md` §4 缺行 ⇒ 上抛（不动档）∥ 🔵③ 行数漂移 ⇒ 登记（收口/回填轮收正）。轮 2 = **VERDICT: pass**（6 行：4 Fixed ∥ 2 Accepted ∥ 1 New——`bin/thincoder.mjs:26` 同句残留）。**fix round 2**：`bin/thincoder.mjs:26`「八⇒九」+ 复跑（`node --check` 出口 0 ∥ `team status` 出口 0）。轮 3 = **VERDICT: pass**（唯一变更点验证收正 ∥ 代码面零「八薄命令族」残留 ∥ 前轮各条无回退）。
- **终态 = clean**（审计零分歧 ∥ 评审 pass ×3 ∥ fix 2 已复跑；评审后产品码变更仅 `bin/thincoder.mjs:26` 注释一行且已复跑）。

## §6 验证与收口（父代理）
