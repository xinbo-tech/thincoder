# 团队客户端（TEAM）· 登录与接入

> 板块归属 = **核心统一**（阶段二「一个核 + 两个薄壳」延伸——团队客户端面：三端共用机制）；本档 = 该机制设计档。
> 需求单源 = `docs/server/requirements/PROJECT.md` §2:31 + AC-31（本批需求锚 = `docs/batches/2026-10-10-team-login-client-access.md` §1）。
> 服务面单源 = `docs/server/design/client/CLIENT.md`（端点 ∥ token 机制——本档不复制）；配置系统 = `docs/core/design/CONFIG.md`（`team` 段指针 = §6.4）；渠道与模型 = `docs/core/design/PROVIDER.md`（派生条目 = §6.25）。
> 建档：2026-10-10（**team-login-client-access 批（B1）· 设计轮 · eng-designer** · 台账 #1212）。

## 1. 定位与边界

- **承载**：端侧团队登录机制——登录 ∥ 退出 ∥ 登录态读面（三端共用逻辑）；派生 provider 条目（登录写入 / 退出停用）；端标签生成；登录/退出对 `~/.thincoder/config.json` 的写面。
- **核模块**：`thincoder-core/team.mjs`（已落——三端共用单源：CLI ∥ VSC ∥ 桌面同 import）。
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
| 入口（登/退） | `thincoder team`（argv——login/logout/status；词面 = `docs/cli/design/CLI-ENTRY.md` §2）∥ 首启向导两路 ∥ 会话内 `/team` 命令族 | 首启板两路 ∥ 状态栏团队 item（点击 ⇒ 登/退流）∥ 命令面板 `thincoder.team` | 首启向导两路 ∥ 状态栏团队段（点击 ⇒ 就地登/退面板） |
| 字段 | 服务器地址 ∥ 用户名 ∥ 密码（地址/用户名可旗标注入；密码 = 隐藏回显（TTY）/ stdin 行（非 TTY）；TUI 内 = 掩码回显） | 同三字段（密码 `type=password`） | 同三字段 |
| 登录动作 | `team login` ∥ `/team login` ∥ 向导「登录团队服务器」卡 | 首启板团队卡 ∥ item 点击流 | 向导团队卡 ∥ 状态段面板 |
| 退出动作 | `team logout` ∥ `/team logout` | item 点击流「退出登录」 | 面板「退出登录」钮 |
| 当前态 | `team status` ∥ `/team status`（活校验附） | item tooltip ∥ 卡内状态行 | 段悬停 ∥ 面板详情 ∥ 卡内状态行 |
| 未登录提示 | 「未登录——登录后可用」+ 指引进登录 | 同句 | 同句 |
| 失败出词 | 网络不可达 ∥ 用户名或密码错误 ∥ 登录尝试过于频繁 ∥ 本机配置写入失败 | 同四句 | 同四句 |
| 一次性提示 | 同名冲突（登录当刻）：「已存在同名 provider「team」——未自动添加；请改名或删除后重登」；吊销未达（退出当刻）：「服务端吊销未达」 | 同两句（登/退面就地提示） | 同两句（登/退面就地提示） |
| 常显面（2026-10-10 增） | 状态行状态段簇尾：已登录 ⇒ ` │ <成员>@<主机>`（主机 = `URL.host`）；未登录 ⇒ **零注入**（逐字节等价负控）；已失效 ⇒ 段转「已失效——重新登录」警示色 | 状态栏 item：已登录 ⇒ 成员名（tooltip = 服务器 + 端标签）；未登录 ⇒ 入口「登录团队服务器」；已失效 ⇒ 警示色「已失效——重新登录」 | 状态栏段：已登录 ⇒ 成员名（悬停 = 服务器）；未登录 ⇒ 入口段「登录团队服务器」；已失效 ⇒ 警示色「已失效——重新登录」 |
| 设置面（管理 · 2026-10-10 收正） | 无设置卡（argv ∥ 命令族即管理面） | 「团队」卡 = 管理面：端标签 ∥ 详情（server ∥ member ∥ label）；**零登/退控件**；「轮换」= 另裁项（无端侧可达机制——本批零控件） | 「团队」段 = 管理面：同左形 |

**失败理由域（失败形 `{ ok:false, reason }`——四值单源）**：`network` ⇔「网络不可达」∥ `credentials` ⇔「用户名或密码错误」∥ `rate_limited` ⇔「登录尝试过于频繁」∥ `write_failed`（本机配置写入失败）⇔「本机配置写入失败」。

**`reason` 判据（核心分类单源）**：不可达 ∥ 其余状态 ⇒ `network` ∥ 401 ⇒ `credentials` ∥ 429 ⇒ `rate_limited` ∥ 本机配置写入失败 ⇒ `write_failed`（逐值对位；端侧只做「理由→句」映射，不自创分类）。

**文案同构判据**：「未登录提示」∥「失败出词」（四句）∥ 两条**一次性提示**（同名冲突 ∥ 吊销未达）三端**逐字同句**（VSC/桌面 = zh i18n 键值逐字相等；CLI = 单语直出同句）；**读面零提示字段**——CLI `team status` ∥ VSC `teamStatus` ∥ 桌面 `team:status` 不带提示字段（两提示 = 一次性事件——登录/退出当刻就地显示，不随状态复显）。

### 2.6 登录态校验与吊销感知（`teamVerify`——2026-10-10 登录面补全批）

**动机**：token 被服务端吊销（控制台 key 页吊销 ∥ 其他路径）后，本地 `team.token` 仍在场 ⇒ 三端照显「已登录」（现三端零处理——用户 2026-10-10 14:46 同族裁定链；本批补）。

- **核件**：`teamVerify()`（`thincoder-core/team.mjs` 本批新增）——`GET <server>/api/client/me`（Bearer = `team.token`；端点单源 = `docs/server/design/client/CLIENT.md` §2）；
  返回**三值闭集**：`{ state: "valid" }`（200）∥ `{ state: "invalid" }`（401——token 被吊销 ∥ 无效）∥ `{ state: "unreachable" }`（网络不可达 ∥ 其他非 401 失败）。**只读**——零写盘、零状态（调用面持结果）。
- **触发点制**（不设周期轮询——零新定时器）：① 启动一次（`team.token` 在场时）；② 登/退面开合时（桌面面板开 ∥ VSC item 点击流起手）；③ CLI `/team status` 活校验。
- **态模型**：`loggedIn`（本地判据——§2.1）× `verify` 四值（`null` 未验 ∥ `valid` ∥ `invalid` ∥ `unreachable`）。显示三态（**判序写死**）：**未登录**（`loggedIn` 假——**首判**；`verify` 值不参与渲染）∥ **已登录**（`loggedIn` 真 ∧ `verify ≠ invalid`）∥ **已失效**（`loggedIn` 真 ∧ `verify === invalid`——token 在场被吊销）。
  `unreachable` ∥ `null` ⇒ 按已登录显示（**离线容忍——不假报失效**；401 单判）。
  **`verify` 清位**（与首判同拍——不变式 = token 缺席 ⇒ `verify` 不存续）：logout 落盘（token 摘除）⇒ 即清 ∥ 状态复读（`team:status` ∥ `/team status` ∥ item 读）见 token 缺席 ⇒ 清。
- **词形**（核字典键）：`status.team.invalid` = zh「已失效——重新登录」∥ en「Session expired — log in again」——各端经自身 `t()` 出词（零自铸字面；CLI 现渲缺省 en——沿 `docs/cli/design/TUI.md` §7.7 观察①同注）。
- **引导重登**：桌面 ∥ VSC = 点击即登录面（表单/流；server ∥ 用户名预填自留存值）；CLI = `/team login`（`/team status` 出「已失效——重新登录」句）。重登成 ⇒ `verify` 清（新 token 新判）。

## 3. 关键决策记录

| # | 决策 | 理由 / 否决备选 |
|---|---|---|
| D-TM1 | **登录态单源 = `team` 段（`token` 在场）；派生条目 = 派生物**（apiKey 镜像） | 「派生」语义正向（登录 → provider）；后续数据面读 `team.token` 不依赖 provider 条目存亡；被否：以「派生条目 apiKey 在场」为登录态（语义倒置；手工删条目 ⇒ 登录态失） |
| D-TM2 | **退出 ⇒ 条目保留（摘 apiKey）+ `derived` 标记保留**；provider 面零新字段 | 口径②「停用/隐藏（不删标记）」直译；零新字段（apiKey 空缺即不可用——既有判据）；被否：加 `disabled` 字段（跨端列表/解析全链各加判据——面大收益零） |
| D-TM3 | **隐藏判据 = `derived && !hasKey`**（列表/候选面） | 登录态（有 key）照常可见可用；退出后单条过滤规则（四消费面各一处）；被否：登录态下也隐藏（用户不可见登录带来的渠道——诊断面差） |
| D-TM4 | **同名手工条目 ⇒ 提示不覆盖** | 用户既有配置零破坏（登录不夺本机面）；数据面不受累（token 独立）；被否：自动覆盖（静默毁用户条目）· 阻断登录（数据面明明可用） |
| D-TM5 | **端标签 = `端名@主机名` 自动生成**（≤40 裁剪） | 口径①示例形；零输入字段（口径③字段表三件）；被否：表单加标签字段（面增） |
| D-TM6 | **密码问句 = CLI 隐藏回显（TTY）/ stdin 行（非 TTY）** | 对齐 VSC/桌面 `type=password` 能力（文案同构）；非 TTY 保留脚本化直登径；被否：`--password` 旗标（shell 历史泄漏）· 明文回显 |
| D-TM7 | **吊销感知 = 显式活校验（`teamVerify` 三值）+ 触发点制**（启动 ∥ 面开合 ∥ `/team status` 活查）；**不设周期轮询**；`unreachable` 不判失效 | 零新定时器（沿「不做常驻仪表」先例）；离线容忍（网络错 ≠ 吊销——401 单判）；被否：周期轮询（成本 ∥ 无效流量）；「本地照旧显示」不处理（用户裁定 = 需「已失效 + 引导重登」） |
| D-TM8 | **登/退入口移出设置面**——设置卡/段 = 管理面（label ∥ 详情；零登/退）；主界面直达面（状态段/项 ∥ `/team`）承载登/退 | 用户 2026-10-10 14:46 裁（登/退不得要求先钻设置）+「两处不互抄」（各端需求卷）；被否：设置卡保留登/退（互抄 ∥ 违裁） |

## 4. 受影响文件与行数预算

| 域 | 档 | 行数（现行 ⇒ 实读（实施落盘）） |
|---|---|---|
| core | `thincoder-core/team.mjs`（已落） | **196**（实施落盘——登录 ∥ 退出 ∥ 状态 ∥ 标签 ∥ 条目 upsert/停用 ∥ 地址归一 ∥ 错误分类） |
| core | `thincoder-core/config.mjs`（已落盘） | **495 ⇒ 509**（实施落盘——`team` 段加载归一 +14；**越 500 软线 ⇒ 主动拆分评估层**——拆分预案指针 = `docs/core/design/CONFIG.md` §5（核内落点行数）→ `docs/core/design/CORE-UNIFICATION.md` §2.8.1「核内逐档行数与拆分计划」） |
| core | `thincoder-core/config-io.mjs`（已落盘） | **282**（实读——零改：写面复用 `writeConfigAtomic`） |
| CLI | `thincoder-cli/src/cli/team-command.mjs`（已落） | **239**（实施落盘——三子命令 ∥ 旗标 ∥ 三态输入面：TTY 可见 ∥ TTY 隐藏回显 ∥ 非 TTY 行读 + 粘性 EOF 兜底） |
| CLI | `thincoder-cli/src/command-table.mjs`（已落盘） | **192 ⇒ 201**（实施落盘——+import +`case "team"`） |
| CLI | `thincoder-cli/bin/thincoder.mjs`（已落盘） | **188 ⇒ 190**（实施落盘——USAGE 两行 ∥ 头注「九薄命令族」） |
| CLI | `thincoder-cli/src/completions.mjs`（已落盘） | **143 ⇒ 156**（实施落盘——三套补全 `team` 词面） |
| CLI | `thincoder-cli/src/tui/model-picker.mjs`（已落盘） | **324**（实施落盘——`isDerivedProviderHidden` 再出口 ∥ 两处过滤（模型候选 ∥ 槽位面）；`Remove provider…` 守卫改用过滤后计数——设计表缺行，补登） |
| CLI | `thincoder-cli/src/tui/provider-admin.mjs`（已落盘） | **248**（实施落盘——`isDerivedProviderHidden` 谓词单源 ∥ 三流过滤（remove ∥ key ∥ context）——设计表缺行，补登） |
| VSC | `thincoder-vscode/webview/settings-team.js`（已落） | **141**（实施落盘——团队卡：两态 ∥ 控件绑定 ∥ 回执出词 ∥ 密码面） |
| VSC | `thincoder-vscode/webview/settings.js`（已落盘） | **199 ⇒ 203**（实施落盘——+import ∥ 第 6 卡序尾合成 ∥ `bindTeamControls()`） |
| VSC | `thincoder-vscode/webview/chat-messages.js`（已落盘） | **271 ⇒ 278**（实施落盘——三 `case` 接线：`teamStatus` ∥ `teamLoginResult` ∥ `teamLogoutResult`） |
| VSC | `thincoder-vscode/src/extension/team.mjs`（已落） | **34 ⇒ ≈44**（登录面补全批设计估——+`teamVerify` 转口（转口四件）；实施落盘回填）；前读 **34**（实施落盘——核转口三件：`teamStatus` ∥ `teamLogin` ∥ `teamLogout`——零状态） |
| VSC | `thincoder-vscode/src/extension/panel-messages.mjs`（已落盘） | **385 ⇒ 389**（实施落盘——+import 名 +2 `case`（`teamLogin` ∥ `teamLogout`——读面纯推送，无上行请求）） |
| VSC | `thincoder-vscode/src/extension/panel-messages-settings.mjs`（已落盘） | **253 ⇒ 281**（实施落盘——+`handleTeamLogin` ∥ `handleTeamLogout`（成 ⇒ 先推 `teamStatus` + `providerStatus` 再发回执）） |
| VSC | `thincoder-vscode/src/extension/settings.mjs`（已落盘） | **408 ⇒ 420**（实施落盘——+隐藏判据一处（`providerStatus`）∥ `pushTeamStatus`（推送点）） |
| VSC | `thincoder-vscode/src/extension/panel-settings-push.mjs`（已落盘） | **121 ⇒ 124**（实施落盘——两条推送链调用（快照族拍）；推送点住 `thincoder-vscode/src/extension/settings.mjs`） |
| VSC | `thincoder-vscode/locales/en.json` ∥ `zh.json`（已落盘） | **296 ∥ 296 ⇒ 310 ∥ 310**（实施落盘——+14 键/表） |
| 桌面 | `thincoder-desktop/renderer/views/settings-sections-team.mjs`（已落） | **118**（实施落盘——段体两态 ∥ 结果行六句 ∥ 草稿标记） |
| 桌面 | `thincoder-desktop/renderer/views/settings.mjs`（已落盘） | **436 ⇒ 448**（实施落盘——`SECTIONS` +1（序尾）∥ 段模型 team 切片 ∥ 段分派支） |
| 桌面 | `thincoder-desktop/renderer/views/settings-sections.mjs`（已落盘） | **96 ⇒ 100**（实施落盘——`teamBody` re-export） |
| 桌面 | `thincoder-desktop/renderer/mount-settings-team.mjs`（已落） | **131**（实施落盘——`createTeam`：状态读 ∥ 两出口 ∥ 写成功复读两调用点 ∥ 开面复位） |
| 桌面 | `thincoder-desktop/renderer/mount-settings.mjs`（已落盘） | **264 ⇒ 292**（实施落盘——`MODAL_READS` +1 行（`team → loadTeam`）∥ `SCOPES` 派生随动 ∥ team 读/出口装配） |
| 桌面 | `thincoder-desktop/src/main/team.mjs`（已落） | **35**（实施落盘——核转口三件：状态 ∥ 登录 ∥ 退出——零状态零自写盘） |
| 桌面 | `thincoder-desktop/src/main/ipc-registry.mjs`（已落盘） | **94 ⇒ 99**（实施落盘——+3 HANDLERS） |
| 桌面 | `thincoder-desktop/src/preload/preload.cjs`（已落盘） | **85 ⇒ 87**（实施落盘——+3 CHANNELS） |
| 桌面 | `thincoder-desktop/renderer/i18n-settings.mjs`（已落盘） | **156 ⇒ 190**（实施落盘——+15 键） |
| 桌面 | `thincoder-desktop/src/main/providers.mjs`（已落盘） | **302 ⇒ 311**（实施落盘——隐藏判据一处：`derived ∧ 无 key` ⇒ 滤除（`providerList`）——设计表缺行，补登） |
| core | `thincoder-core/team.mjs`（**登录面补全批增**） | **196 ⇒ ≈240**（+`teamVerify`——服务端校验三值（valid ∥ invalid ∥ unreachable）；实施落盘回填） |
| core | `thincoder-core/i18n.mjs`（**登录面补全批增**） | **113 ⇒ ≈120**（+`status.team.invalid` 两语） |

- 批内件三件（跨档集——件数口径与服务端板档 §6 本批块对拍）：服务端单件 = `docs/batches/2026-10-10-team-login-client-access.test.mjs`（实施落盘 **305**——**入 server 链**（`prepublishOnly` 38 ⇒ 39））∥ 本册件 = `docs/batches/2026-10-10-team-login-client-access-ends.test.mjs`（核 + 三端结构面——实施落盘 **410**；**不入链**——跨面件无宿主产品链）∥
  桌面面单件 = `docs/batches/2026-10-10-team-login-client-access-desktop.test.mjs`（实读 **364**；**不入链**——桌面包无 `prepublishOnly` 链）。
- `thincoder-core/agent-tools/settings.mjs` ±0（`team` 不入 `DEFAULTS`——工具面零改）。

## 5. 验收判据（端侧面——回指 AC-31 ①–⑤）

| 判据 | 载体 |
|---|---|
| ① 三端登录入口在册：CLI `team login` ∥ VSC 团队卡 ∥ 桌面团队段（地址 + 账号 + 密码三字段各在） | 批内件（结构机检）+ 收口轮三端实走 |
| ② token 落本地 ∥ 明文密码零落盘：登录成 ⇒ `team.token` 在场 ∥ 派生条目 `apiKey` 同值；实读 config.json 零密码字段 | 批内件 |
| ③ 自动 provider ∥ 模型可用：登录成 ⇒ `providers[]` 现 `team` 条目（`derived:true` ∥ baseURL = `<server>/v1` ∥ apiKey = token——同盘读）；模型面 = 该 token 对 `/v1/models` 可通；收口轮实走一轮 | 批内件 + 收口轮 |
| ④ 未登录 ⇒ 团队面不启用：`loggedIn === false`；三端未登录态渲染（提示句逐字同）；派生条目无 key ⇒ 列表隐藏（§2.4 判据） | 批内件 + 收口轮 |
| ⑤ 退出 ⇒ 服务端吊销 + 团队面关闭：落盘后 `team.token` 摘除 ∥ `apiKey` 摘除且 `derived` 保留 ∥ 服务端该 token 下一请求 ⇒ 401（服务面判据 = `client/CLIENT.md` §4） | 批内件 + 收口轮 |

**登录面补全批（2026-10-10）增判据（回指桌面 D11 ∥ CLI F19 ∥ F20 ∥ VSC F-W20 ∥ F-W21 · 台账 #1229–#1232）**：

| 判据 | 载体 |
|---|---|
| ⑥ 首启两路：三端首启首屏两路并列（图形端两卡 ∥ CLI 三行列表；都不预选；「以后再说」第三态在场）+ 同屏换取表单 + 「← 换一种方式」回退；登录成 ⇒ 即用（模型面就绪——模型选定面 = 各端既有面） | 批内件（三端各面）+ 收口轮三端实走 |
| ⑦ 常显：已登录 ⇒ 三端常显面可见成员（服务器 = 悬停/tooltip/行内 —— 见 §2.5 常显面行）；未登录 ⇒ 图形端入口段 ∥ CLI 零注入（逐字节等价负控）；已失效 ⇒ 三端「已失效——重新登录」 | 批内件 + 收口轮 |
| ⑧ 直达登/退：登/退不经设置面完成（桌面段面板 ∥ VSC item 流 ∥ CLI `/team`）；设置面团队卡/段 = 管理面（label ∥ 详情；零登/退控件） | 批内件 + 收口轮 |

## 6. 用例（本域 · 批内件）

| # | 用例 | 判据 |
|---|---|---|
| N1 | 登录成 ⇒ 一次写盘：`team` 四键在场 ∥ 派生条目在场（表尾）；两处同值 | 批内件（写盘面 = 临时 config 路径 + 本地 HTTP 桩） |
| B1 | 同名手工 `team` 条目 ⇒ 登录成 + 提示 + 手工条目逐字零改（零覆盖） | 批内件 |
| E1 | 登录败（网络不可达 ∥ 401 ∥ 429）⇒ 零写盘 + 分类出词；本机配置写入失败 ⇒ `write_failed`（零假成功） | 批内件 |
| N2 | 退出 ⇒ token 摘除 ∥ apiKey 摘除 ∥ `derived` 保留 ∥ 服务端收到吊销请求；网络失败 ⇒ 本地照清 + 提示 | 批内件 |
| B2 | 派生条目无 key ⇒ 三端列表过滤判据（纯函数）判真 ∥ 有 key 判假 | 批内件 |
| E2 | 地址归一：缺协议补 `http://` ∥ 尾斜杠去 ∥ 尾 `/v1` 去；label 裁剪 ≤40 | 批内件 |
| N3 | `teamVerify` 三值：200 ⇒ `valid`；401 ⇒ `invalid`；网络不可达 ⇒ `unreachable`（不判失效——离线容忍） | 批内件（HTTP 桩） |
| B3 | 吊销 → 重登：`invalid` 态 ⇒ 重登成 ⇒ `verify` 清 ∥ 新 token 落盘；旧 token 下一请求 401 | 批内件 + 收口轮 |

## 7. 边界（不做）

- 不做登录 token 管理面（清单/吊销 = 控制台 key 页 ∥ CLI key 命令——既有面；**token 轮换同理——无端侧可达机制，另裁项**：设置卡「轮换」本批零控件——见批档 §2 未裁点） ∥ 不做多账号/多服务器切换（单登录态） ∥ 不做离线缓存 ∥ 不做授权码/device-flow（已搁置） ∥ 不做周期轮询校验（校验 = 触发点制——§2.6） ∥ 不做团队面板（状态 = 常显段/项；入口 = 登/退面） ∥ 不做新文案（四句失败句 ∥ 未登录句 ∥ 两条一次性提示沿用逐字；新态词仅「已失效——重新登录」）。
- **已认账（token 生命周期——口径①）**：累积可预期（每次登录一枚 ∥ 无过期 ∥ 不自动清理）——清理 = 用户面（key 列表逐把吊销——既有面）；换 server 重登（单登录态覆盖）⇒ 旧 server 的 token 不在本机——撤销径 = 旧 server 控制台 key 列表（`webui/WEBUI.md` §2.3⑥ ∥ `GET /api/me` ∥ CLI `key revoke`）。
- 不改 `memory.team`（B3 面） ∥ 不动 personal/project 记忆 ∥ 不自动改 `defaultModel` ∥ 不切换会话模型 ∥ 不动手工 provider 条目。

## 变更记录

- 2026-10-10（**team-login-client-access 批（B1）· 设计轮 · eng-designer**——承 `docs/batches/2026-10-10-team-login-client-access.md` §1 · 台账 #1212）：建档——定位与边界 ∥ 机制面（`team` 段 ∥ 派生条目 ∥ 登录/退出流程 ∥ 可见性 ∥ 三端同构）∥ 决策 D-TM1–6 ∥ 受影响文件预算（24 行）∥ 验收判据（AC-31 ①–⑤）∥ 用例 ∥ 边界。实施 = 本批实施轮。
- 2026-10-10（**team-login-client-access 批（B1）· 设计评审轮 1 修正（fix 轮 · 发现 3 ∥ 7 ∥ 8 ∥ 9 ∥ 12）· eng-designer**——承批档 §3 轮次 1 · 台账 #1212）：§4 批内件对账（服务端单件入链 ∥ 本册件不入链）+ `config.mjs` 行越线注与拆分预案指针 ∥ §2.5 删「（含等待秒数）」（秒数无载体——三句逐字同判据保持；三端已同拍）∥ §2.4 ∥ §3 D-TM3 消费面计数统一「四消费面」（与 `PROVIDER.md` §6.25 同拍）∥ §7 增 token 生命周期已认账两条。**零新语义**（评审发现的直接导出项）。
- 2026-10-10（**team-login-client-access 批（B1）· 实施期设计相抵修复 · eng-designer**——承批档 `docs/batches/2026-10-10-team-login-client-access.md` §2 实施期修复块 · 台账 #1212）：§2.2 ∥ §2.3 补**返回形 + 端侧就地提示**句（`notice: "manual-name-conflict"` 仅同名冲突时在场 ∥ `revokeDelivered`——缺席 = true）∥ §2.5 增**一次性提示**行 + 判据扩（三端逐字同句 ∥ 读面零提示字段）。**零新语义**（父侧裁定直接导出项）。
- 2026-10-10（**team-login-client-access 批（B1）· 实施期档-码差一修复（`write_failed` 补设计）· eng-designer**——承批档 `docs/batches/2026-10-10-team-login-client-access.md` §2 实施期修复块 · 台账 #1212；父侧裁定 = 保留第四值并补设计——写盘失败须真报警；第四句用词 = 「本机配置写入失败」）：§2.5 新增**失败理由域四值句**（`network` / `credentials` / `rate_limited` / `write_failed`——本机配置落盘失败；与出词四句同序对位）+ 出词表补第四句 + 判据行同拍。**零新语义**（父侧裁定直接导出项）。明细 = 批档 §2 实施期修复块。
- 2026-10-10（**team-login-client-access 批（B1）· 实施期收尾小修 · eng-designer**——承批档 `docs/batches/2026-10-10-team-login-client-access.md` §2 实施期修复块 · 台账 #1212）：§2.2 步 4 分类出词补第四值（本机配置写入失败）∥ §2.5 补 **`reason` 判据句**（核心分类单源）∥ §6 E1 补写盘失败位（`write_failed`）；
  §2.1 `team` 段行措辞收正（未知键原样通过——与 settings 工具实装对齐）∥ §4 i18n 估数随第四句顺正（VSC **+≈15 键/表** ∥ 桌面 **+≈13 键**）。**零新语义**（父侧派发项直接导出）。明细 = 批档 §2 实施期修复块。
- 2026-10-10（**team-login-client-access 批（B1）· 设计面登记与估数补齐 · eng-designer**——承批档 `docs/batches/2026-10-10-team-login-client-access.md` §2 实施期修复块 · 台账 #1212）：**§4** VSC 块 +`webview/chat-messages.js` 行（**271 ⇒ ≈276**——三 `case` 接线 ≈+5，舱 C 披露补登记）
  ∥ **§2.5** `reason` 判据句 ∥ **§6** E1 判据位措辞同字（「本机配置写盘失败」⇒「本机配置写入失败」——与句面同字）。**零新语义**。明细 = 批档 §2 实施期修复块。
- 2026-10-10（**team-login-client-access 批（B1）· 实施后回填轮 · eng-designer**——承批档 `docs/batches/2026-10-10-team-login-client-access.md` §5 · 台账 #1212）：**§4** 表全量按现盘实读收正（四块 25 行改「现行 ⇒ 实读（实施落盘）」+ 补登三缺行 `thincoder-cli/src/tui/model-picker.mjs` **324** ∥ `thincoder-cli/src/tui/provider-admin.mjs` **248** ∥ `thincoder-desktop/src/main/providers.mjs` **302 ⇒ 311**；批内件 **305** ∥ **410**）∥ **§2.5** 括注同字（「落盘」⇒「写入」）∥ **§1** 去「（拟新增）」。**零新语义**（读数 ∥ 登记）。明细 = 批档 §2 实施后回填块。
- 2026-10-10（**login-entry-completion 批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-10-login-entry-completion.md` §1 · 台账 #1229–#1232；用户 14:33–14:46 连续四提 + 14:48 点火）：§2.5 增**入口（登/退）∥ 常显面 ∥ 设置面（管理）**三行并按新面收正四行（登录/退出动作 ∥ 当前态 ∥ 一次性提示括注）∥ 增 **§2.6 登录态校验与吊销感知**（`teamVerify` 三值 ∥ 触发点制 ∥ 态模型 ∥ 词形 ∥ 引导重登）∥ §3 增 **D-TM7**（校验制）∥ **D-TM8**（登/退移出设置面）∥ §4 增 core 两行（`team.mjs` ∥ `i18n.mjs`）∥ §5 增补全批判据 ⑥⑦⑧ ∥ §6 增 N3 ∥ B3 ∥ §7 边界收正（`/team` 已落句退场；增轮换另裁 ∥ 零轮询 ∥ 零新文案三条）。**产品码零触（设计轮）**。
- 2026-10-10（**login-entry-completion 批 · 设计评审轮 1 修正（fix 轮 · 发现 10）· eng-designer**——承批档 `docs/batches/2026-10-10-login-entry-completion.md` §3 轮次 1 · 台账 #1229–#1232）：§2.6 态模型判序写死（未登录首判——`verify` 值不参与渲染）+ `verify` 清位补全（logout 落盘 ∥ 状态复读见 token 缺席）。**零新语义**（评审发现的直接导出项）。
- 2026-10-10（**login-entry-completion 批 · 设计评审轮 2 修正（fix 轮 · 发现 2）· eng-designer**——承批档 `docs/batches/2026-10-10-login-entry-completion.md` §3 轮次 2 · 台账 #1229–#1232）：§4 VSC 块 `thincoder-vscode/src/extension/team.mjs` 行补**现行 ⇒ 预期**（**34 ⇒ ≈44**——+`teamVerify` 转口（转口四件）；前读 34 保留）。**零新语义**（评审发现的直接导出项）。明细 = 批档 §2 fix 轮补记。
