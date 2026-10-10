# 团队客户端（TEAM）· 登录与接入

> 板块归属 = **核心统一**（阶段二「一个核 + 两个薄壳」延伸——团队客户端面：三端共用机制）；本档 = 该机制设计档。
> 需求单源 = `docs/server/requirements/PROJECT.md` §2:31 + AC-31（本批需求锚 = `docs/batches/2026-10-10-team-login-client-access.md` §1）。
> 服务面单源 = `docs/server/design/client/CLIENT.md`（端点 ∥ token 机制——本档不复制）；配置系统 = `docs/core/design/CONFIG.md`（`team` 段指针 = §6.4）；渠道与模型 = `docs/core/design/PROVIDER.md`（派生条目 = §6.25）。
> 建档：2026-10-10（**team-login-client-access 批（B1）· 设计轮 · eng-designer** · 台账 #1212）。

## 1. 定位与边界

- **承载**：端侧团队登录机制——登录 ∥ 退出 ∥ 登录态读面（三端共用逻辑）；派生 provider 条目（登录写入 / 退出停用）；端标签生成；登录/退出对 `~/.thincoder/config.json` 的写面。
- **核模块**：`thincoder-core/team.mjs`（拟新增——三端共用单源：CLI ∥ VSC ∥ 桌面同 import）。
- **不承载**：服务端逻辑（= `client/CLIENT.md`）∥ 团队功能面本身（台账 ∥ 记忆 ∥ 在场 ∥ 会话——后续批）∥ 提供者传输/模型解析（= `PROVIDER.md`）。
- **纪律**：明文密码零落盘（请求内存即弃）∥ 本机面不夺能力（未登录 ⇒ 本机功能照常）∥ 无离线缓存（需求 §3）。

## 2. 机制面

### 2.1 配置形（`~/.thincoder/config.json`）

**`team` 段（顶层——登录态单源）**：

| 键 | 形 | 语义 |
|---|---|---|
| `team.server` | 字符串 ∥ null | 服务地址（归一形——去尾斜杠；缺协议补 `http://`） |
| `team.member` | `{ username, name }` ∥ null | 上次登录身份快照（显示面 ∥ 表单预填） |
| `team.label` | 字符串 ∥ null | 本机本端 token 标签（如 `CLI@台式机`） |
| `team.token` | 字符串 ∥ null | **登录 token——在场 ⇔ 已登录**（权威源） |

**派生 provider 条目（`providers[]` 内——固定名 `team`）**：形 = `{ name:"team", baseURL:"<server>/v1", apiKey:"<token>", derived:true }`——「标记为派生」= `derived: true` 字段；`apiKey` = `team.token` 的派生镜像（同一次写盘落）；**条目恒在**（首次登录后——退出不删，摘 `apiKey`）；**不删标记**（口径②）。

- **单写者**：仅登录/退出流程写 `team` 段与派生条目（`writeConfigAtomic` 一次 mutate——核既有写盘执行体；端侧零自写盘，三端同源）。
- **加载归一**：`loadConfig` 归一 `team` 段（形不符 ⇒ null——软失败不阻启动；沿 `proxy` 段先例）。
- **登录态判据**：`loggedIn` ⇔ `team.token`（trim 非空）。**= 团队功能开关**（后续各面消费本判据——口径④）。
- **`team` 段不入 `DEFAULTS`**（沿 `providers` / `proxy` 先例）：不进入 settings 工具的已知键面（**未知键原样通过**——agent 可写、零类型校验；工具不主动写 `team` 段；`thincoder-core/agent-tools/settings.mjs:144`）；`team.token` 若经读面到达 = 敏感段词表天然遮罩（`thincoder-core/agent-tools/settings.mjs:22`）。

### 2.2 登录流程（三端同构）

1. 收集：服务器地址 + 用户名 + 密码（+ 本端标签自动生成 = `端名@主机名`——`node:os` `hostname()`；总长 ≤40 裁剪）。
2. 请求：`POST <server>/api/client/login`（形 = `client/CLIENT.md` §2）。
3. 成 ⇒ 一次写盘：`team` 段（server/member/label/token）+ 派生条目 upsert（按名 `team` + `derived` 定位——有则更新，无则**追加 `providers[]` 表尾**——不劫持既有回退序）。
4. 败 ⇒ 分类出词（网络不可达 ∥ 凭据错 ∥ 锁定期 ∥ 本机配置写入失败）——零写盘。

**同名手工条目冲突**（口径②）：`providers[]` 内已有非派生 `team` 条目 ⇒ 登录仍成（数据面可用），但**不写派生条目**；**返回形** = `{ ok: true, notice: "manual-name-conflict" }`（**码不携文**——`notice` 仅本冲突时在场；提示文本 = 端侧 i18n）。
  端侧收 `notice` ⇒ **登录当刻就地提示**「已存在同名 provider「team」——未自动添加；请改名或删除后重登」（三端逐字同句——§2.5）；**不覆盖、不弹窗、不阻断**。

### 2.3 退出流程

1. `POST <server>/api/client/logout`（携 token——best-effort：网络不可达 ⇒ 仍清本地）；**返回形** = `{ ok: true, revokeDelivered: boolean }`——缺席 = true（服务端吊销已送达）；`false` ⇒ **退出当刻就地提示**「服务端吊销未达」（三端逐字同句——§2.5）。
2. 一次写盘：`team.token` 摘除（server/member/label 留存——表单预填 ∥ 当前态显示）；派生条目停用 = **摘 `apiKey`**（条目与 `derived` 标记保留——重登自动恢复）。
3. 团队面关闭 = `loggedIn` 归假（后续面随动）；派生条目不可用（无 key ⇒ 运行时解析天然跳过——持 key 判据单源 = `docs/core/design/PROVIDER.md` §6.22）。

### 2.4 派生条目的可见性（停用/隐藏）

- **可用性**：派生条目无 `apiKey` ⇒ 不参与运行时解析（`hasKey` 既有判据——零新代码）；不触发「渠道无效」类提示（回退序跳过）。
- **列表可见性**：`derived === true` ∧ 无 key ⇒ 从 provider 列表/模型候选面隐藏（**四消费面各一处过滤**：CLI 模型候选（`thincoder-cli/src/tui/model-picker.mjs`） ∥ CLI provider-admin ∥ VSC `providerStatus`（`thincoder-vscode/src/extension/settings.mjs`）∥
  桌面 `providerList`（`thincoder-desktop/src/main/providers.mjs`）——与 `docs/core/design/PROVIDER.md` §6.25 同拍）；**登录态下在场**（正常参与，key 掩码显示）。
- **不自动改**：不写 `defaultModel` ∥ 不切换当前会话模型 ∥ 不动既有手工条目（登录唯一副作用 = §2.2 两处写）。

### 2.5 三端同构面（能力与文案）

| 面 | CLI | VSC | 桌面 |
|---|---|---|---|
| 入口 | `thincoder team`（login/logout/status——词面 = `docs/cli/design/CLI-ENTRY.md` §2） | 设置面板「团队」卡（第 6 卡） | 设置面板「团队」段 |
| 字段 | 服务器地址 ∥ 用户名 ∥ 密码（地址/用户名可旗标注入；密码 = 隐藏回显（TTY）/ stdin 行（非 TTY）） | 同三字段（密码 `type=password`） | 同三字段 |
| 登录动作 | `team login` | 卡内「登录」钮 | 段内「登录」钮 |
| 退出动作 | `team logout` | 卡内「退出登录」钮 | 段内同钮 |
| 当前态 | `team status`（未登录 ∥ 已登录：server + member + label） | 卡内状态行 | 段内状态行 |
| 未登录提示 | 「未登录——登录后可用」+ 指引进登录 | 同句 | 同句 |
| 失败出词 | 网络不可达 ∥ 用户名或密码错误 ∥ 登录尝试过于频繁 ∥ 本机配置写入失败 | 同四句 | 同四句 |
| 一次性提示 | 同名冲突（登录当刻）：「已存在同名 provider「team」——未自动添加；请改名或删除后重登」；吊销未达（退出当刻）：「服务端吊销未达」 | 同两句（卡内就地提示） | 同两句（段内就地提示） |

**失败理由域（失败形 `{ ok:false, reason }`——四值单源）**：`network` ⇔「网络不可达」∥ `credentials` ⇔「用户名或密码错误」∥ `rate_limited` ⇔「登录尝试过于频繁」∥ `write_failed`（本机配置落盘失败）⇔「本机配置写入失败」。

**`reason` 判据（核心分类单源）**：不可达 ∥ 其余状态 ⇒ `network` ∥ 401 ⇒ `credentials` ∥ 429 ⇒ `rate_limited` ∥ 本机配置写盘失败 ⇒ `write_failed`（逐值对位；端侧只做「理由→句」映射，不自创分类）。

**文案同构判据**：「未登录提示」∥「失败出词」（四句）∥ 两条**一次性提示**（同名冲突 ∥ 吊销未达）三端**逐字同句**（VSC/桌面 = zh i18n 键值逐字相等；CLI = 单语直出同句）；**读面零提示字段**——CLI `team status` ∥ VSC `teamStatus` ∥ 桌面 `team:status` 不带提示字段（两提示 = 一次性事件——登录/退出当刻就地显示，不随状态复显）。

## 3. 关键决策记录

| # | 决策 | 理由 / 否决备选 |
|---|---|---|
| D-TM1 | **登录态单源 = `team` 段（`token` 在场）；派生条目 = 派生物**（apiKey 镜像） | 「派生」语义正向（登录 → provider）；后续数据面读 `team.token` 不依赖 provider 条目存亡；被否：以「派生条目 apiKey 在场」为登录态（语义倒置；手工删条目 ⇒ 登录态失） |
| D-TM2 | **退出 ⇒ 条目保留（摘 apiKey）+ `derived` 标记保留**；provider 面零新字段 | 口径②「停用/隐藏（不删标记）」直译；零新字段（apiKey 空缺即不可用——既有判据）；被否：加 `disabled` 字段（跨端列表/解析全链各加判据——面大收益零） |
| D-TM3 | **隐藏判据 = `derived && !hasKey`**（列表/候选面） | 登录态（有 key）照常可见可用；退出后单条过滤规则（四消费面各一处）；被否：登录态下也隐藏（用户不可见登录带来的渠道——诊断面差） |
| D-TM4 | **同名手工条目 ⇒ 提示不覆盖** | 用户既有配置零破坏（登录不夺本机面）；数据面不受累（token 独立）；被否：自动覆盖（静默毁用户条目）· 阻断登录（数据面明明可用） |
| D-TM5 | **端标签 = `端名@主机名` 自动生成**（≤40 裁剪） | 口径①示例形；零输入字段（口径③字段表三件）；被否：表单加标签字段（面增） |
| D-TM6 | **密码问句 = CLI 隐藏回显（TTY）/ stdin 行（非 TTY）** | 对齐 VSC/桌面 `type=password` 能力（文案同构）；非 TTY 保留脚本化直登径；被否：`--password` 旗标（shell 历史泄漏）· 明文回显 |

## 4. 受影响文件与行数预算

| 域 | 档 | 行数（实读——设计估） |
|---|---|---|
| core | `thincoder-core/team.mjs`（拟新增） | **≈180**（设计估——登录 ∥ 退出 ∥ 状态 ∥ 标签 ∥ 条目 upsert/停用 ∥ 地址归一 ∥ 错误分类） |
| core | `thincoder-core/config.mjs`（已落盘） | **495 ⇒ ≈503**（实读——`team` 段加载归一 +≈8；**越 500 软线 ⇒ 主动拆分评估层**——拆分预案指针 = `docs/core/design/CONFIG.md` §5（核内落点行数）→ `docs/core/design/CORE-UNIFICATION.md` §2.8.1「核内逐档行数与拆分计划」） |
| core | `thincoder-core/config-io.mjs`（已落盘） | **282**（实读——零改：写面复用 `writeConfigAtomic`） |
| CLI | `thincoder-cli/src/cli/team-command.mjs`（拟新增） | **≈150**（设计估——三子命令 ∥ 旗标 ∥ 隐藏回显读件） |
| CLI | `thincoder-cli/src/command-table.mjs`（已落盘） | **192 ⇒ ≈200**（实读——+import +case） |
| CLI | `thincoder-cli/bin/thincoder.mjs`（已落盘） | **188 ⇒ ≈190**（实读——USAGE 两行） |
| CLI | `thincoder-cli/src/completions.mjs`（已落盘） | **143 ⇒ ≈146**（实读——三套补全 `team` 词面） |
| VSC | `thincoder-vscode/webview/settings-team.js`（拟新增） | **≈110**（设计估——团队卡：表单 ∥ 登录态 ∥ 提示行） |
| VSC | `thincoder-vscode/webview/settings.js`（已落盘） | **199 ⇒ ≈205**（实读——合成式 ∥ 词 ∥ init 面） |
| VSC | `thincoder-vscode/src/extension/team.mjs`（拟新增） | **≈80**（设计估——status/login/logout 三处理体） |
| VSC | `thincoder-vscode/src/extension/panel-messages.mjs`（已落盘） | **385 ⇒ ≈390**（实读——+3 case） |
| VSC | `thincoder-vscode/src/extension/panel-messages-settings.mjs`（已落盘） | **253 ⇒ ≈270**（实读——+3 处理体） |
| VSC | `thincoder-vscode/src/extension/settings.mjs`（已落盘） | **408 ⇒ ≈420**（实读——teamStatus 读面 + push 点） |
| VSC | `thincoder-vscode/src/extension/panel-settings-push.mjs`（已落盘） | **121 ⇒ ≈130**（实读——teamStatus 推送） |
| VSC | `thincoder-vscode/locales/en.json` ∥ `zh.json`（已落盘） | **296 ∥ 296 ⇒ ≈311 ∥ ≈311**（实读——+≈15 键/表） |
| 桌面 | `thincoder-desktop/renderer/views/settings-sections-team.mjs`（拟新增） | **≈110**（设计估——团队段体） |
| 桌面 | `thincoder-desktop/renderer/views/settings.mjs`（已落盘） | **436 ⇒ ≈443**（实读——SECTIONS + 分派） |
| 桌面 | `thincoder-desktop/renderer/views/settings-sections.mjs`（已落盘） | **96 ⇒ ≈97**（实读——re-export） |
| 桌面 | `thincoder-desktop/renderer/mount-settings-team.mjs`（拟新增） | **≈80**（设计估——读 ∥ 出口 ∥ 草稿保真） |
| 桌面 | `thincoder-desktop/renderer/mount-settings.mjs`（已落盘） | **264 ⇒ ≈268**（实读——SCOPES + 装配） |
| 桌面 | `thincoder-desktop/src/main/team.mjs`（拟新增） | **≈70**（设计估——三通道处理体） |
| 桌面 | `thincoder-desktop/src/main/ipc-registry.mjs`（已落盘） | **94 ⇒ ≈99**（实读——+3 HANDLERS） |
| 桌面 | `thincoder-desktop/src/preload/preload.cjs`（已落盘） | **85 ⇒ ≈88**（实读——+3 CHANNELS） |
| 桌面 | `thincoder-desktop/renderer/i18n-settings.mjs`（已落盘） | **156 ⇒ ≈169**（实读——+≈13 键） |

- 批内件两件（跨档集——件数口径与服务端板档 §6 本批块对拍）：服务端单件 = `docs/batches/2026-10-10-team-login-client-access.test.mjs`（估 ≈260——**入 server 链**（`prepublishOnly` 38 ⇒ 39））∥ 本册件 = `docs/batches/2026-10-10-team-login-client-access-ends.test.mjs`（核 + 三端结构面——估 ≈380；**不入链**——跨面件无宿主产品链）。
- `thincoder-core/agent-tools/settings.mjs` ±0（`team` 不入 `DEFAULTS`——工具面零改）。

## 5. 验收判据（端侧面——回指 AC-31 ①–⑤）

| 判据 | 载体 |
|---|---|
| ① 三端登录入口在册：CLI `team login` ∥ VSC 团队卡 ∥ 桌面团队段（地址 + 账号 + 密码三字段各在） | 批内件（结构机检）+ 收口轮三端实走 |
| ② token 落本地 ∥ 明文密码零落盘：登录成 ⇒ `team.token` 在场 ∥ 派生条目 `apiKey` 同值；实读 config.json 零密码字段 | 批内件 |
| ③ 自动 provider ∥ 模型可用：登录成 ⇒ `providers[]` 现 `team` 条目（`derived:true` ∥ baseURL = `<server>/v1` ∥ apiKey = token——同盘读）；模型面 = 该 token 对 `/v1/models` 可通；收口轮实走一轮 | 批内件 + 收口轮 |
| ④ 未登录 ⇒ 团队面不启用：`loggedIn === false`；三端未登录态渲染（提示句逐字同）；派生条目无 key ⇒ 列表隐藏（§2.4 判据） | 批内件 + 收口轮 |
| ⑤ 退出 ⇒ 服务端吊销 + 团队面关闭：落盘后 `team.token` 摘除 ∥ `apiKey` 摘除且 `derived` 保留 ∥ 服务端该 token 下一请求 ⇒ 401（服务面判据 = `client/CLIENT.md` §4） | 批内件 + 收口轮 |

## 6. 用例（本域 · 批内件）

| # | 用例 | 判据 |
|---|---|---|
| N1 | 登录成 ⇒ 一次写盘：`team` 四键在场 ∥ 派生条目在场（表尾）；两处同值 | 批内件（写盘面 = 临时 config 路径 + 本地 HTTP 桩） |
| B1 | 同名手工 `team` 条目 ⇒ 登录成 + 提示 + 手工条目逐字零改（零覆盖） | 批内件 |
| E1 | 登录败（网络不可达 ∥ 401 ∥ 429）⇒ 零写盘 + 分类出词；本机配置写盘失败 ⇒ `write_failed`（零假成功） | 批内件 |
| N2 | 退出 ⇒ token 摘除 ∥ apiKey 摘除 ∥ `derived` 保留 ∥ 服务端收到吊销请求；网络失败 ⇒ 本地照清 + 提示 | 批内件 |
| B2 | 派生条目无 key ⇒ 三端列表过滤判据（纯函数）判真 ∥ 有 key 判假 | 批内件 |
| E2 | 地址归一：缺协议补 `http://` ∥ 尾斜杠去 ∥ 尾 `/v1` 去；label 裁剪 ≤40 | 批内件 |

## 7. 边界（不做）

- 不做 TUI 斜杠命令（`/team`——随团队面入 TUI 时另批） ∥ 不做登录 token 管理面（清单/吊销 = 控制台 key 页 ∥ CLI key 命令——既有面） ∥ 不做多账号/多服务器切换（单登录态） ∥ 不做离线缓存 ∥ 不做授权码/device-flow（已搁置）。
- **已认账（token 生命周期——口径①）**：累积可预期（每次登录一枚 ∥ 无过期 ∥ 不自动清理）——清理 = 用户面（key 列表逐把吊销——既有面）；换 server 重登（单登录态覆盖）⇒ 旧 server 的 token 不在本机——撤销径 = 旧 server 控制台 key 列表（`webui/WEBUI.md` §2.3⑥ ∥ `GET /api/me` ∥ CLI `key revoke`）。
- 不改 `memory.team`（B3 面） ∥ 不动 personal/project 记忆 ∥ 不自动改 `defaultModel` ∥ 不切换会话模型 ∥ 不动手工 provider 条目。

## 变更记录

- 2026-10-10（**team-login-client-access 批（B1）· 设计轮 · eng-designer**——承 `docs/batches/2026-10-10-team-login-client-access.md` §1 · 台账 #1212）：建档——定位与边界 ∥ 机制面（`team` 段 ∥ 派生条目 ∥ 登录/退出流程 ∥ 可见性 ∥ 三端同构）∥ 决策 D-TM1–6 ∥ 受影响文件预算（24 行）∥ 验收判据（AC-31 ①–⑤）∥ 用例 ∥ 边界。实施 = 本批实施轮。
- 2026-10-10（**team-login-client-access 批（B1）· 设计评审轮 1 修正（fix 轮 · 发现 3 ∥ 7 ∥ 8 ∥ 9 ∥ 12）· eng-designer**——承批档 §3 轮次 1 · 台账 #1212）：§4 批内件对账（服务端单件入链 ∥ 本册件不入链）+ `config.mjs` 行越线注与拆分预案指针 ∥ §2.5 删「（含等待秒数）」（秒数无载体——三句逐字同判据保持；三端已同拍）∥ §2.4 ∥ §3 D-TM3 消费面计数统一「四消费面」（与 `PROVIDER.md` §6.25 同拍）∥ §7 增 token 生命周期已认账两条。**零新语义**（评审发现的直接导出项）。
- 2026-10-10（**team-login-client-access 批（B1）· 实施期设计相抵修复 · eng-designer**——承批档 `docs/batches/2026-10-10-team-login-client-access.md` §2 实施期修复块 · 台账 #1212）：§2.2 ∥ §2.3 补**返回形 + 端侧就地提示**句（`notice: "manual-name-conflict"` 仅同名冲突时在场 ∥ `revokeDelivered`——缺席 = true）∥ §2.5 增**一次性提示**行 + 判据扩（三端逐字同句 ∥ 读面零提示字段）。**零新语义**（父侧裁定直接导出项）。
- 2026-10-10（**team-login-client-access 批（B1）· 实施期档-码差一修复（`write_failed` 补设计）· eng-designer**——承批档 `docs/batches/2026-10-10-team-login-client-access.md` §2 实施期修复块 · 台账 #1212；父侧裁定 = 保留第四值并补设计——写盘失败须真报警；第四句用词 = 「本机配置写入失败」）：§2.5 新增**失败理由域四值句**（`network` / `credentials` / `rate_limited` / `write_failed`——本机配置落盘失败；与出词四句同序对位）+ 出词表补第四句 + 判据行同拍。**零新语义**（父侧裁定直接导出项）。明细 = 批档 §2 实施期修复块。
- 2026-10-10（**team-login-client-access 批（B1）· 实施期收尾小修 · eng-designer**——承批档 `docs/batches/2026-10-10-team-login-client-access.md` §2 实施期修复块 · 台账 #1212）：§2.2 步 4 分类出词补第四值（本机配置写入失败）∥ §2.5 补 **`reason` 判据句**（核心分类单源）∥ §6 E1 补写盘失败位（`write_failed`）；
  §2.1 `team` 段行措辞收正（未知键原样通过——与 settings 工具实装对齐）∥ §4 i18n 估数随第四句顺正（VSC **+≈15 键/表** ∥ 桌面 **+≈13 键**）。**零新语义**（父侧派发项直接导出）。明细 = 批档 §2 实施期修复块。
