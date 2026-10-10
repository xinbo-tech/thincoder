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
**状态行**：（eng-designer 写入时更新）
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

## §3 设计评审（评审子代理）
## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
