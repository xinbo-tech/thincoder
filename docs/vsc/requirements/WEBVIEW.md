# WEBVIEW（webview 界面面）— 需求 · VSC 部分

> 部分 = **vsc**（`docs/vsc/`）；板块 = **webview 界面面**——本部分 UI 面（面板主界面：对话流 / 活动区 / 工具卡 / 输入面 / 状态面）。
> 对端 UI 面 = 终端 TUI（**异名对位**）——两端形态不镜像（端差逐条登记见 §4）。
> **设计侧 = 同层三档**——`design/WEBVIEW.md`（结构与活动区 · 块头形态）· `design/WEBVIEW-PROTOCOL.md`（消息协议 · 秩序/忙态 · 状态行）· `design/WEBVIEW-INPUT.md`（输入面 · 消息渲染契约）——**已由批 2 迁入基准层**（拆分记录 = `docs/vsc/design/VSC-MIGRATION.md` §6 · §9.2）。
> 本档**不重述**的权威源（D2）：webview 族节（行内转义 / 活动区回归 / live 块 UX / 活动区收口）= `AGENT-LOOP（VSC 侧·需求）` §10 / §12 / §14 / §16；完整输出落盘 = `TOOL-OUTPUT-LIMITS（VSC 侧）`。
> 来源 = `thincoder-vscode/docs/requirements/WEBVIEW.md`（VSC 产品树）——**原地一字未改，留作参照历史**（保留 ≠ 维护）。
> 建档：2026-09-15（**B 式迁移轮 · VSC 第 1 批**）；坐标 = as-of 2026-09-12 实测 + 2026-09-15 迁移批实核（坐标一律改写为仓根相对路径）。

## 1. 总体需求

VSC 面板使用者在 webview 主界面完成全部交互：对话流、子代理活动、工具执行与历史回读必须**可见、可滚动、可回读**——
流式输出看着像活的（跟尾）、上滚阅读不被打断、历史能翻到底。
webview 只做 UI 渲染与用户交互；agent 循环与工具执行在 extension host（职责边界 = UI 适配层，经 `postMessage` 单向通信——`design/WEBVIEW.md` §1）。

## 2. 功能性需求

| # | 需求 | 判定句（验收语义） | 范围边界（不做） |
|---|---|---|---|
| F-W1 | **布局与活动区驻留**：垂直序 = 会话栏 → 消息区 → 活动区（子代理 / consult / advisor-async 活动块）→ 面板区 → 输入区；活动块**全程驻留**（live 固定可见，不随消息流滚动丢失）；终态消化回收后**归档落流**（消息区，形态不变）。证据 = `design/WEBVIEW.md` §2 / §5 · `thincoder-vscode/webview/activity.js` · `thincoder-vscode/webview/activity-view.js` | 活动区为空 → 零高隐藏（CSS `:empty`，零 JS）；live 块在区内固定可见（消息区滚动不影响）；回收后块以同形落 `#messages`（归档块）；区居民 = live + awaitingDigest（有界）。用例 = `thincoder-vscode/test/activity-flow.test.mjs` / `activity-closure.test.mjs` / `async-visibility.test.mjs` | 不改块头字段语义（字段表 = `design/WEBVIEW-PROTOCOL.md` §6.2）；不做浮动 / 弹窗形态；不复活旧 DOM-move 链（设计 = `design/WEBVIEW.md` §6 D-W4） |
| F-W2 | **流式跟随与滚动**：消息区默认钉底（流式跟随尾部）；上滚解钉（阅读历史不被打断）；回底复钉；悬浮回底钮；活动区块内容区独立跟滚。证据 = `thincoder-vscode/webview/ui.js:445-489` · `thincoder-vscode/webview/scroll.js:13-33` · `thincoder-vscode/webview/activity.js:115-135` · `thincoder-vscode/webview/streaming.js:27-65` | 钉底态下流式帧到达 → 视口保持贴底；上滚（距底 ≥24px——近底判据同源）→ 解钉（帧应用不再拉底）；回底 / 点回底钮 → 复钉；两层独立（消息区 / 活动区互不拉扯）。用例 = `thincoder-vscode/test/activity-live-ux.test.mjs` | 不做 `scrolled N` 状态串（端差——回底钮替代，本档 §4）；不逐 chunk 强制同步布局（见 §3 N-W3） |
| F-W3 | **历史懒加载**：打开会话只加载首窗（分页 200）；滚动近顶自动拉更早页；prepend 后视口锚定保持（正在读的行不跳）；无更早页不再请求。证据 = `thincoder-vscode/webview/history.js:23-87` · `thincoder-vscode/webview/state.js:63/89` · `thincoder-vscode/webview/ui.js:465-476` · `thincoder-vscode/src/extension/history-window.mjs:22` | 首渲 = 200 条 + `hasOlder` 真值（`HISTORY_PAGE_SIZE === 200` 断言）；`scrollTop ≤ 40` → 发 `loadOlder`（before 锚 = 已渲染外层消息的最早 `data-idx`）；prepend 后 `scrollTop = 原值 + scrollHeight 增量`（视口顶保持）；`hasOlder=false` → 零请求。用例 = `thincoder-vscode/test/history-window.test.mjs` / `session-boot.test.mjs` / `history-restore.test.mjs` | 不做计数行「… N more …」（端差——加载指示器形态，本档 §4）；live 消息无 idx（永不污染窗口——锚只取外层消息） |
| F-W4 | **工具调用卡**：每次工具调用产出一张卡（头 = 工具名 + 参数摘要 + 状态词）；执行中输出**流式追加**进卡体（长命令可看）；完成 → 状态 + 耗时 + 末行摘要，成功折叠 / 错误展开；恢复会话的完成卡与活卡终态同形。证据 = `thincoder-vscode/webview/ui.js:216-254/303` · `thincoder-vscode/webview/tool-card-restore.mjs:23` · `thincoder-vscode/webview/chat.js:139-160` · `thincoder-vscode/webview/lib.js:27-30` | `toolCall` → 卡（名 + args 前 80 字符 + 状态词）；`toolOutput` → 追加且卡展开（卡体超 64K 截断加注）；`toolResult` → 成功折叠（含耗时与末行摘要 ≤80）/ 错误保持展开；恢复卡折叠语义与活卡对齐。用例 = `thincoder-vscode/test/history-restore.test.mjs`（恢复面——含 live 对齐断言）；活卡面（`toolCall`/`toolOutput`/`toolResult` 接收）**现无专属用例**（原 `chat-panel.test.mjs` 内覆盖随 2026-09-07 测试清空退场——非拆档迁出面；缺口登记 = 本档 N-W5） | 卡体不保留全文（全文在会话记录——`TOOL-OUTPUT-LIMITS（VSC 侧）` 面）；不做 `│ ` 前缀行间区块形态（端差，本档 §4） |
| F-W5 | **输入面 Enter 语义**：Enter 发送；组合期（IME）Enter 归输入法；`@` 下拉打开时 Enter 只接受建议；运行中拒发可见提示。证据 = `thincoder-vscode/webview/input.js:75-85` · `thincoder-vscode/webview/send.js` | 组合期 Enter → 零发送（不 preventDefault）；`@` 下拉打开 → Enter 归 autocomplete；busy 发送 → 拒发 + 可见提示；其余 Enter → 发送。用例 = `thincoder-vscode/test/webview-input-enter.test.mjs` | 不改 send 出口守卫（拒发门禁保持——只改按钮可见性，设计 = `design/WEBVIEW-PROTOCOL.md` §4.4） |
| F-W6 | **输入历史与多行竖移**：↑↓ 判定五态（IME 组合期 → `@` 下拉让位 → 历史态恒历史 → 单行任意位置 → 多行边界门）；草稿 stash；不劫持原生竖移。证据 = `thincoder-vscode/webview/input.js:86-110` · `design/WEBVIEW-INPUT.md` §2 | 历史态（`_historyIdx ≠ -1`）↑↓ 恒历史（连续上溯与回落）；多行非边界位置零劫持（原生竖移保留）；边界门 = 首行行首 ↑ / 末行行末 ↓ 触发；草稿恢复。用例 = `thincoder-vscode/test/webview-input-history.test.mjs` | 不引入列记忆状态；不跨出输入框（不滚动会话） |
| F-W7 | **忙态与消化轮可见指示**：忙态收敛（turnState）；停止钮常显；消化轮起跑可见（`.digest-status` 三态）；状态行段位（工具 / 耗时 / `turn N/M` / ✦reasoning / token——对位表 = `design/WEBVIEW-PROTOCOL.md` §6.1）。证据 = `thincoder-vscode/webview/chat.js:351-405` · `thincoder-vscode/webview/status-bar.js` · `design/WEBVIEW-PROTOCOL.md` §5 | digest 起跑 / 收尾两态渲染幂等（ok 旗标时序）；Stop 期间常显；状态行对位表逐项落位；端差项（ctx 绝对数 / `scrolled N` / attention chip / 键位提示）保持登记态（本档 §4）。用例 = `thincoder-vscode/test/webview-turnstate.test.mjs` / `digest-visibility.test.mjs` / `status-line.test.mjs` | 不做 attention chip（端差登记）；不做 `scrolled N`；不改发送门禁 |

| F-W8 | **设置面快照打开必达**：打开设置页（`openSettings` / `initSettings`）时，除 agentSettings / providerStatus / mcpStatus / models 外，全部已配快照——**proxySettings · websearchSettings · indexStatus**——必须在该拍到达（推送或拉取）；不得等「保存某设置 / 跑一回合 / 外部改 config」才补。证据 = 只读审计 id=90 表 3（`thincoder-vscode/webview/settings.js:60-76` ⇄ `thincoder-vscode/src/extension/panel-messages.mjs:405`） | 新窗口 / Reload 后**直接**打开设置页 ⇒ 三个快照到达且渲染真值（已配置项不回显为空 / 不假阴性）；拟新增 `settings-open-snapshots.test.mjs`（**修复前必红**） | 不改「build 只在 openSettings 调用」既有语义（SETTINGS-REORG P3）；不新增协议形态（沿用既有 type 与 `_pushSettings` / `_pushSettingsLight`） |
| F-W9 | **控件级回填（收到即刷活控件，不重建整卡）**：四处「只存 SS」面必须回填活控件——三处消费函数 `settings-env.js:66-69`（shellCandidates）· `:71-73`（proxySettings）· `settings-tools.js:293-295`（websearchSettings）+ **一处扩面** `updateIndexStatus`（`settings-tools.js:297-300`——现只重绘 `#index-status` / Build 钮，不触 `#row-embed`）；对照正例 = `settings-providers.js:244-253` / `settings-tools.js:297-300`。**另登记不修**：`updateAgentSettings`（`settings-agent.js:172-174`）同属「只存 SS」——其回填缺口随 P2-3 同族处置（消解路径 = 差异提交 / 到期 = agent 卡下次触碰；评审 id=96 发现 3 裁定） | 面板打开时触发 light/full 推送 ⇒ 控件显示新值；随后改动任一控件 ⇒ 发回值 = 屏幕新值（旧值回写零发生）；拟新增 `settings-refill.test.mjs` | 不恢复整卡重建（丢半填输入——P2-6 登记）；不改推送时机（只补回填与打开到达） |
| F-W10 | **空值不得静默清除既有配置**：change-to-save 只在**用户实际编辑过**该控件后发值——「快照未达 / 从未编辑」的控件不得以默认或空渲染值回写；「URI 清空 = 清除代理」语义保留，但必须由**显式用户动作**触发。证据 = `settings-env.js:37-52` + `thincoder-vscode/src/extension/settings.mjs:246-257`（`:249-250` 空 uri ⇒ `delete raw.proxy`） | ① 快照未达时 blur/Enter 任一代理控件 ⇒ **零写盘**（`config.json` 逐字不变）；② 显式清空 ⇒ 才删除；③ 每条「空 / null ⇒ delete」路径逐条列册 + 判据（proxy 整块 · agent 卡 `null` · poolLimits 逐键 · 元素缺席形态 = P2-4）；拟新增 `settings-empty-no-write.test.mjs`（**修复前必红**） | 不改 extension 侧删除语义（设计档明载）；不改单击即删（设计意图——文末登记） |
| F-W11 | **Shell 控件接线或移除（现为死线）**：`#sh-select` / `#sh-custom`（`settings-env.js:27-31`）有渲染、无 change 绑定、全仓无发送方；extension 侧 `saveShellSettings`（`panel-messages.mjs:460-463` + `settings-panel-write.mjs:158-165`）因此为死 handler ⇒ 二选一：接线（change → `saveShellSettings` → 写盘 + 回填）或移除控件 + 清死 handler | 选择 / 输入 shell ⇒ 写盘 + 回填；或 webview 全树 `grep sh-select` 零命中且 `saveShellSettings` 已按 F-W12 处置 | 不改 `config.shell` 语义与既有校验（`config-io` 面） |
| F-W12 | **收发面对表零未处置（本批新清算）**：新增 **4 个**反向死 handler（`panel-messages.mjs:320` `settings` · `:322` `saveCustomProvider` · `:372` `saveEmbeddingConfig`① · `:460` `saveShellSettings`）+ 1 个无消费者推送（`panel-mcp.mjs:137` `mcpReconnected`）逐条处置（删 / 补消费者 / 登记）——口径同 N-W7。① = 设计轮实测增列（父侧 17:4x 收正，原记 3） | 逐条进 `design/WEBVIEW-PROTOCOL.md` §13 表（**父侧裁定：§13 独立节——避免本轮改红既有 §12 协议机检 + `userMessage` 双同名**）；删除项按**实质**零残留（`grep` 命中按实质判——**留痕注释 / 同族同名不计**；原「全树 `grep` 零命中」字面不可达，修正轮 id=102 收正）；结构机检零未处置 | 不新增协议语义；`settings` case 若为备用入口 ⇒ 登记（不删）并写明触发条件 |

| F-W17 | **密钥 / 令牌类删除须二次确认（用户 2026-09-18 21:09 裁定「最好确认一下」）**：界面上密钥/令牌只显 `****` ⇒ 删除**不可逆**（原文不可复得，只能回服务商重取）——不满足既有 P5「可逆才单击即删」的前提。**实测入口册（设计轮 id=108 收正——原括注不实）**：live 密钥类 **2** = `settings-tools.js:270`（websearch ✕）· `:283`（嵌入 ✕）；死 handler **1** = `settings-providers.js:56-58` `_delKey`（零 UI 调用 ⇒ 一并过门）；**provider 行 ✕ = 须确认类**（用户 2026-09-19 08:11 裁定 A——删行连带删其 `apiKey` 原文 ⇒ 不可复得；载体 `settings-providers.js:185`（卡 HTML **`data-name` 承载**）+ `:229-246`（卡级装配位绑定）+ `:48-49`（取消重建位）· 动作 `:67-69` · 消息 `removeProvider`——**载体形态已收正**（2026-09-19：原「行内 onclick / `:182` / `:64-66`」为改判前坐标））；**MCP server 行 ✕ = 须确认类**（用户 22:21 改判——载体 `settings-tools.js:187` 生成 / `:191-195` 绑定）；**模型菜单 footer「Remove provider」= 须确认类（入口册 #6/6）**（2026-09-19 20:5x 实核——`webview/model-picker.js:25` 直发 `removeProvider`（无 name ⇒ 宿 QuickPick 选）· 渲染位 `model-menu.js:128-134`；与 settings 面同判据）；**MCP token/headers 无删除钮**（唯一路径 = 表单清空保存 `config-mcp.mjs:52-54` ⇒ 维持登记）；掩码位 = `settings-tools.js:267` / `:280`（设计轮 id=113 实测收正——坐标 +7）。**判据句**：所有**密钥 / 令牌 / 凭证类**删除入口（**以上述实测册为准，不以枚举字面为准**——新增入口 fail-closed 入册）⇒ 点击后**必须有一次显式确认**；**所有删除入口**（密钥 / 令牌 / MCP 行 / provider 行 / 模型菜单入口）均须过一次显式确认——「单击即删」类**已空域**（用户 2026-09-19 08:11 裁定 A；provider 行与模型菜单入口均因删除后 `apiKey` 原文不可复得而同类） | 点击密钥类 ✕ ⇒ 出现确认（形式由设计裁：行内二次点击 / 弹确认框），确认后才发删除消息；取消 ⇒ 零发值。非密钥类入口**亦全入确认门**（2026-09-19 收正——原「单击即删在位」**作废**） | 不改宿主删除语义（§2.8 路径册）；**不新增「撤销机制」**（用户 21:07 口径：属加机器，不取）；i18n 双语文案在册 |
| F-W18 | **面板初始化零同步阻塞（2026-09-18 深夜实害 + 用户裁定「修吧」）**：面板初始化推送链（`webviewReady` → `_pushStatus` / `_pushSettingsLight` / `openSessionContent`，含 `getAgentSettings` 打开拍）路径上不得有同步子进程冻结事件循环——第一实害点 = `shellCandidates()` 的 `spawnSync("where", …)` 三连（缓存每次宿主重启必冷；本机实测 0.51 / 0.48 / 0.81 s 每发）；会话认领链的探测形态面归核（= `MULTI-INSTANCE-COLLAB（核）` **F-MI7**）。证据 = 22:56 重载窗口：扩展宿主 14.4 s 日志静默（`exthost.log` 22:56:21.6→35.98），同期 10 渠道 `/models` 探针全数 15 s 超时 ⇒ 设置页全红；独立子进程采样同窗 100+ 轮网络全绿。坐标 = `thincoder-vscode/src/extension/settings.mjs:57-88` · `panel-messages-settings.mjs:182`（`handleGetShellCandidates` 现役）· `panel-messages.mjs:236`（分派）· `chat-panel.mjs:321` / `:354`（推送函数） | 初始化窗口（webview 创建 → 推送链完成）内宿主事件循环无可观测 ≥2 s 静默（机判 = exthost 日志静默窗 / 探针存活读数）；`shellCandidates` 路径零 `spawnSync` / `execSync`（代码机检）；shell 候选列表行为等价（既有用例全绿） | 不改推送协议与推送序契约（`SETTINGS.md` §2.8「序 = 契约」保持）；不改 shell 候选语义；不改 UI 版式 |
| F-W19 | **渠道探针失败不固化 + 可自愈（2026-09-18 深夜实害 + 同裁）**：宿主繁忙窗口（初始化 / 重载）内的 `/models` 探针失败不得固化为行内「不可用」展示态——准入展示态（`thincoder-core/provider/list-models.mjs:117-127` 进程内存 Map）现无自愈路径：一经 `recordAdmission` 写入即残留至下次重探（设置页开关只读快照、不重探），并把「宿主被冻」误报为「渠道不可用」。证据 = 22:23 / 22:47 / 22:56 三轮重载窗口全部全红（`aborted due to timeout` ×10）+ 模型下拉退化为 fallback 面；同期独立采样网络全绿 | ① 网络正常 + 重载 ⇒ 设置页全绿（或短暂失败后自愈恢复）；② 初始化窗口内失败渠道在重探成功后可清除（重探触发 = 设计裁定：窗口内延迟重试 / 面板获焦重探 / 设置页再开重探——择一或并，须给判据）；③ 失败原因可区分（探针超时 / 体坏 / 宿主忙——展示面可分辨） | 不改 15 s 探针预算与 M9 准入语义；不改「失败不缓存」既有语义（本条 = 补自愈触发与窗口抑制）；不改 UI 版式 |

| F-W13 | **批权限卡必须可释放**：`permission-gate.mjs:92` 发 `batchPermissionRequest`（**不带 `promptId`**）⇒ `webview/permission.js:86-117` 卡无 `data-prompt-id`；Stop 时 `:95-99` 只出队 + `resolve("deny")`、**零 postMessage**（逐项卡三路释放均经 `:27-35 releasePermission` 发 `permissionWithdrawn`）；消费侧 `chat.js:256-262` 只删 `[data-prompt-id]` | 同响应 ≥2 非只读工具（§16 D-B1 合并询问）⇒ 卡在屏 ⇒ Stop/Ctrl+I ⇒ **卡消失**（或转已拒绝态）；剩余按钮点击**零静默无效**（现 `panel-messages.mjs:315` `shift()` 空队 ⇒ `entry?.resolve` no-op）；拟新增用例 | 不改合并询问语义（§16 D-B1）；不改逐项卡路径 |
| F-W14 | **回合中改模型须落盘（不得静默覆盖）**：`panel-messages.mjs:139` 立即写槽，而回合尾两处落盘（`panel-chat.mjs:329` · `panel-callbacks.mjs:305`）掷回合起点 `slotStamp`（`panel-chat.mjs:227-229`）⇒ `panel-session.mjs:135` stamp 优先 ⇒ **回合内选择被静默覆盖**；UI 仍显新值直到下次 `models` 推送才静默回退；下一回合仍按 echo 跑（`turn-model.mjs:22` 试运行 = 能跑不粘）；模型/推理按钮**零忙态门** | 触发：`_turnState==="running"`（含 digest/susp）时点模型/推理按钮 ⇒ **无静默覆盖**（选择持久，或按钮显式忙态禁用——二选一） | **与在飞配置页批同域（`panel-messages.mjs`）⇒ 须其让位后实施**；不改 `turn-model.mjs` 试运行语义；不改槽原语 |
| F-W15 | **`@file` 展开不得污染人读线（口径待裁）**：`panel-chat.mjs:246 injectAtRefs` 的展开文本（`file-refs.mjs:34-42`）随 `pushReal` **同进人读线** ⇒ 恢复回读（`thincoder-core/history-window.mjs:130` 原样透传）显示**文件正文**，与活面 `@路径` 不一致；人读线 = CLI 共文件 | 发含 `@路径` 的消息 ⇒ Reload / 切回 ⇒ 恢复面与活面同形；**口径二选一先裁**：A 恢复剥离展开 / B 活面同步展开 | 不改 `injectAtRefs` 展开本体（模型输入语义）；不改人读线存储本体 |
| F-W16 | **工具非零退出可见性（CLI 对位）**：`tools/bash.mjs:225-227` 失败结果非 `Error:` 前缀 ⇒ `webview/ui.js:291` `isError=/^Error[:：]/` 判成功 ⇒ **绿色 + 自动折叠**；摘要 `ui.js:276-283` 的 `WRAPPER` 显式过滤 `(exit code …)` ⇒ 折叠面读作 `(empty)`；**CLI 对位**（`tool-summaries.mjs:60-68`）把退出状态拼进摘要；**spawn 失败（无退出码）同族入册**（2026-09-19 收正）+ **判据单源/产者坐标收正**（原证据坐标 = 修复前时点值：`ui.js:291` 现为注释行，判据 = `ui.js:295` `isToolFailure` ← `lib.js:91-96`；`WRAPPER` 现 `ui.js:276-287`；产者两处 = 核 `tools/bash.mjs:183-198` · 宿主 `src/tools/shell.mjs:242-281`） | 非零退出 ⇒ 可见面有失败信号（卡色 / 展开 / 摘要含退出码——至少一）；与 CLI 口径一致或按端差登记（二选一） | 不改核 `dispatch.mjs:445` 的 `ok:true` 上游语义（设计意图 I-8）；卡色判据可另定（§16） |

**并入条目 · 异步任务可见性（VSC 面板 live 块出生可靠性——2026-09-18 收敛 · 编号承旧档）**

> 源 = 迁移期参照档 `thincoder-cli/docs/_archive/requirements/AGENT-LOOP.md` §3（F-A1–F-A5 / NFR-A1–A3——归属面 = VSC 部分）；收敛触发已到期 = 面板 live 块缺陷复发批触碰本档。
> **复发实据（2026-09-18 23:1x）**：异步 `eng-designer` 跑 20 分钟面板 live 区零块（用户实见；调度层正常 ⇒ 丢失在投递 / 呈现链）；同族登记 = `docs/batches/2026-09-17-subagent-zero-block.md` §2.7；批 = `docs/batches/2026-09-18-init-block.md`。

| # | 需求 | 说明 | 范围边界（不做） |
|---|---|---|---|
| F-A1 | 出生必达（自愈） | 任何后台任务在面板上必然出现其 live 块——扩展侧投递链对「webview 未就绪窗口」的消息零丢失（队列入链），webview 就绪 / 清屏后以**状态再断言**（存活任务逐条重发出生事件）自愈 | 不做跨 reload 恢复已死任务的块；不做存量历史回填 |
| F-A2 | 终态必现 | 任何后台任务的终态（done/settled/error/cancelled/terminated/failed）必然呈现在其块上：块缺失时先补块再折叠（never-born 终态防御），不得静默 no-op | 不建重复块（同身份幂等）；不复活已折叠块；answered 例外：无块 no-op（回复走 digest 呈现） |
| F-A3 | 块身份唯一 | 同一 webview 生命周期内块身份键与任务实例一一对应：出生事件遇**已冻结的同名条目**必须建立新一代块（接管键），不得让新任务永久不可见；重名发生必须可留痕 | 不改频道命名法（`sub:<role>#<id>`）；不引入 id 之外的实例序号 |
| F-A4 | 控制面不降级 | 任何「重建 / 补发」路径产生的块必须保留完整控制面与首见元数据：⏹ 取消（`pool:true` 语义）、async/sync 标记、model、startedAt | 不改 ⏹ 的可见性判据（running + pool + family 角色） |
| F-A5 | 清屏可恢复 | 会话清屏（`clearMessages`——boot / loadSession 必经）后仍存活的后台任务必须重新出现为 live 块，且满足 F-A4 | 不重推已消化历史块 |

| # | 维度 | 标准 | 度量方式 |
|---|---|---|---|
| NFR-A1 | 零回归 | live→frozen 两态机 / 冻结幂等守卫 / 150 窗裁剪 / tombstone 丢弃语义零变化；不重做池快照重推 | 既有 `activity-flow` / `webview-turnstate` / `chat-panel` 测试全绿 |
| NFR-A2 | 可诊断 | 每一次「出生事件被守卫丢弃 / 同名接管 / 补块」留一条可断言痕迹（webview 侧结构化日志 + 主侧投递日志）——复发可凭痕迹定位，不再不可诊断 | 用例断言痕迹发生；`grep` 断言痕迹调用点在位 |
| NFR-A3 | 可机器验证 | 每条验收由 happy-dom 驱动**真 webview 模块**或桩面板驱动**真 extension 模块**机判 | 新增用例全绿 + 反例（修前红）可复现 |

**明确不做**：不改 CLI TUI 块机制（CLI 无 webview；09-17 批已修）；不改核侧发射面（E1 已证无缺陷）；不做「已 settle 且已 digest」任务回填（呈现面 = digest 文本）。

**会话界面审计（id=98）登记（不修——消解路径 + 到期条件在册）**

- **P2-1** `ctx.activeSession` 死写（`chat.js:195` 写 / 全树零读） · **P2-2** `S._llmCalls` 死计数（`send.js:31` + `status-bar.js:83` 写 / 零读）⇒ 消解 = 下次触碰该档时清；到期 = 相应档下次修改。
- **P2-3** idle 状态行残留 `turn N/M`（`streaming.js:173` `finish()` 只清 `_turnStart`；`_turnFrame` 仅 `clearMessages` 清）⇒ 消解 = `finish()` 同清；到期 = 状态行面下次触碰。
- **P2-4** `@` 下拉 Escape 后迟到结果重开（`autocomplete.js:37` 自行 `display:block` + `_atActive=true`）⇒ 消解 = 请求失效标记；到期 = autocomplete 面下次触碰。
- **P2-5** 恢复路径嵌套工具卡缺 `→ 摘要` 表头段（`tool-card-restore.mjs:39-43` vs 活卡 `ui.js:304-315`）⇒ 登记（F-W4 只约束折叠语义）。
- **P2-6** 裁剪窗不含 `.ledger-line` / `.digest-*` / `.error-banner` / `#compress-status`（`ui.js:446-454` 只统计 4 类）⇒ 消解 = 扩裁剪族；到期 = N-W2 面下次触碰。
- **P2-7** 索引进度 statusText 无失败清除路径（`panel-index.mjs:196` 弹窗不补发 `done`）⇒ 消解 = 失败补发清除；到期 = 索引面下次触碰。
- **P2-8** webview 重载撞在飞回合（`panel-session.mjs:154-159` 置 `_agent=null` + abort 蒸馏）⇒ 登记（跨 reload 恢复 = 既定不做 I-7）。

**设计意图（id=98 判定 · 勿误修）**：I-1 Send running 隐藏 / Stop 只显 running · I-2 会话族忙态拒收（warning 明示）· I-3 `_chat` 释放窗拒收（AC-S2）· I-4 digest 每轮独立元素（D-P7）· I-5 恢复卡 pretty JSON args 块
· I-6 归档块随消息窗出入（§14 T-CL9）· I-7 不做子代理块跨 reload 恢复 · I-8 非零退出上游 `ok:true`（`dispatch.mjs:445`）· I-9 单击即删 / 空值清代理（属配置页面）· I-10 台账行 / 压缩行落流不落状态区。

**本批登记（不修——消解路径 + 到期条件在册）**

- **P2-3 默认值物化**：`settings-agent.js:16-23` / `:66-67` / `:78-130` 用硬编码回退渲染且一次提交全部字段 ⇒ 首次改动即把默认值钉进 `config.json`（与核 `DEFAULTS` 现同值，故今天无行为差）。消解路径 = 差异提交（只发被编辑字段）；到期 = agent 卡下次触碰。
- **P2-4 元素缺席 ≡ 显式清空**：`settings-agent.js:123-125`（`|| null`）+ `settings-panel-write.mjs:129-138`（显式 null ⇒ delete）⇒ 改动 agent 卡任一控件会删掉手写 `agent.advisor.effort`。消解路径 = 缺席字段发 `undefined`；到期 = 同上。
- **P2-5 保存面零校验**：`thincoder-vscode/src/extension/settings.mjs:246-256` 只 trim + 非空 ⇒ 可落盘缺 scheme 的 URI，错误延后到每次请求才抛（`thincoder-core/proxy.mjs:184-190`）。消解路径 = URI 形态校验前置到保存；到期 = 代理面下次触碰。
- **P2-6 providers 卡重建清空半填表单**：`settings-providers.js:237-242` ⇒ 后台准入变化会丢未落盘输入。消解路径 = 重建前保留在编输入；到期 = providers 面下次触碰。
- **P2-7 面板关闭时 `providerError` 不可见**：`webview/chat.js:208` → `settings.js:47-58` ⇒ 配置写入失败在 UI 无痕。消解路径 = 关闭态转系统级提示；到期 = 下批。

**明属设计意图（勿误修）**：单击即删（`webview/settings.js:43`——**限可重填类**；不可复得类按 F-W17 过一次显式确认——2026-09-19 收正）· 「URI 清空 = 清除代理」（设计明载——VSC 归档档 `SETTINGS-PANEL-2`）· 面板推送不重建卡（SETTINGS-REORG P3）。

**语义边界（2026-09-19 用户追问后落定）**：上述清单的用途 = **防止把 A 改坏去修 B**，**不得用于驳回用户报的症状**——**登记现状 ≠ 冻结决定**（用户 09-18 23:32「怎么会按设计意图不修」）。

**已结清（2026-09-18 21:09 用户裁定 → F-W17）**：key / token 在 UI 中只显 `****` ⇒ 删除后原文不可复得 ⇒ **入确认门**（详见 §2 F-W17 与 21:1x 变更记录）——本项不再待裁。

## 3. 非功能性需求

| # | 维度 | 标准 | 度量方式 |
|---|---|---|---|
| N-W1 | 零依赖零构建 | webview 侧纯浏览器标准 API——无 npm 运行时依赖、无打包器（约束面 = `design/WEBVIEW.md` 头注） | `package.json` 零运行时依赖 + `npm run lint` 全绿；webview 目录零构建产物 |
| N-W2 | DOM / 内存有界 | 消息窗上限 150 块（含归档块——`thincoder-vscode/webview/ui.js:468-476`）；卡体上限 64K（`thincoder-vscode/webview/lib.js:27-30`）；离屏消息 / 工具卡跳过 layout/paint（`thincoder-vscode/webview/chat.css:474-475`）；活动区居民有界（live + awaitingDigest——设计 = `design/WEBVIEW.md` §5.1） | 常量在位（逐处源码锚）；长会话回归：裁剪后 `data-idx` 锚可将历史拉回（`thincoder-vscode/test/history-restore.test.mjs`） |
| N-W3 | 流式渲染性能 | 帧应用走 rAF 脏集路径——不逐 chunk 强制同步布局（`thincoder-vscode/webview/ui.js:449-450` 抄「写超值不读 scrollHeight」；`thincoder-vscode/webview/streaming.js:27` 注释） | 源码锚 + `thincoder-vscode/test/activity-live-ux.test.mjs`（帧应用不丢 / 节流重排） |
| N-W4 | 分页与恢复对位 | `HISTORY_PAGE_SIZE === 200`（`thincoder-vscode/src/extension/history-window.mjs:22`——跨端首窗对齐）；恢复保真（帧序 / 工具卡 / 时间戳形态） | 常量断言 = `thincoder-vscode/test/history-window.test.mjs`；`history-restore.test.mjs` 全绿 |
| N-W5 | 可机判 | 每条功能需求有既有用例面（活动族 / 输入族 / 历史族 / 状态族）；**登记在案的例外 1 条**：F-W4 活卡面现无专属用例——**消解路径** = 活卡面（`toolCall`/`toolOutput`/`toolResult` 接收）补测；**到期条件** = WEBVIEW 面下次被触碰时 / 下批收口前（依据 = `ENGINEERING-MODE（VSC 侧·需求）` §1.3 F14 第三子条）；测试档登记入 `thincoder-vscode/test/files.mjs`（清单制） | `node test/run-fast.mjs` 全绿 + 档名在册；登记在案的例外 1 条（消解路径 + 到期条件在位） |
| N-W6 | 端差显式 | 各端独立实现、语义同源；端差逐条登记（本档 §4），不静默（同规 = `AGENT-LOOP（VSC 侧·需求）` §16 N-CL4） | §4 表逐行在位；无未登记放行通道（`ENGINEERING-MODE（VSC 侧·需求）` §1.3 F14） |
| N-W7 | 收发面对表零未处置 | host → webview 全部**顶级**消息判别式（`type` / `name`）逐条登记：发射点 `file:line` / 分发或消费位 `file:line` / 处置（`活`·`删`·`补`）——**无未处置项**；无生产者族（死码）当批删除且零悬空引用；`补` 行（host 缺发射）登记 + 转技术待办（带消解期），不在本批新增协议语义 | 表在 `design/WEBVIEW-PROTOCOL.md` §12；结构机检 = `thincoder-vscode/test/protocol-coverage.test.mjs`（拟新增 · 复跑零未处置）；被删标识符全树 `grep` 零命中；`npm test` 绿 |

| N-W8 | 配置面防数据丢失可机判 | 三条**先红后绿**用例在案且修复前必红：① 打开路径快照到达（F-W8）② 未编辑控件的空值零写盘（F-W10）③ 推送后旧值不回写（F-W9）。既有 `test/smoke-settings.mjs:70-78` 在 `openSettings()` 前手工灌 SS 的手法 = 掩盖源 ⇒ **不得沿用**；`saveProxySettingsFromPanel` / `proxySettings` / `handleSetProviderProxy` 现零测试命中 ⇒ 本批补测并登记入 `thincoder-vscode/test/files.mjs` | 三条新用例 `node --test` 全绿（修复前必红）+ `npm test` 绿 + `files.mjs` 含新档 |

## 4. 对位与端差登记（对位 = `TUI（CLI 侧·需求）` + `TUI-TOOL-OUTPUT（CLI 侧·需求）`）

> 读法：逐行对位 CLI 需求行 → 本端对位 → 端差；「等价」= 语义同源且形态对位；端差 = 各端形态差异（登记不静默）。
> 端差判据以本端实测与 `design/WEBVIEW-PROTOCOL.md` §6.1 · §6.2 对位表为准；对端行号以其文档为准（本档不代述对端正文）。TTO = `TUI-TOOL-OUTPUT（CLI 侧·需求）`（下文行标简写）。

| CLI 行（对位参照） | 本端对位 | 端差（登记） |
|---|---|---|
| TUI F1–F5（跟随 / 暂停 / 锚定补偿 / 恢复 / 滚动入口） | F-W2 | 入口 = 滚动容器 + 悬浮回底钮（对端 = PgUp/PgDn + 滚轮）；`scrolled N` 不做（钮替代）；锚定补偿面 = 历史 prepend（`thincoder-vscode/webview/history.js:58-61`）——追加不位移 DOM 视口 |
| TUI F6（懒加载） | F-W3 | 触发 = 滚动近顶（`scrollTop ≤ 40`）；页大小 200（两端对齐——N-W4）；数据源 = 宿主会话记录（磁盘为准） |
| TUI F7（头部分页标记） | F-W3（加载指示器） | 本端 = `loadOlder` 加载指示（`thincoder-vscode/webview/history.js:23/33`）+ `hasOlder` 门；无「N more」计数行 |
| TUI F8（子代理嵌套活动显示） | F-W1 | 块形态 = 活动区驻留 + 收口落流两态（设计 = `design/WEBVIEW.md` §5.1）；嵌套行随外层块（`thincoder-vscode/webview/ui.js:38` 注释口径）；不做嵌套独立小节 |
| TUI F9（picker 附注渲染） | 本端无全屏 picker——模型选择 = 下拉部件（`thincoder-vscode/webview/model-picker.js` / `model-menu.js`） | 形态端差：全屏列表 vs 下拉 / 面板；无 80 列渲染预算概念 |
| TUI F10（选择面分工与契约） | question 卡（`thincoder-vscode/webview/question.js`）+ 模型下拉 + 设置对话框 | 各端组件面自持（不镜像）；交互契约差异登记于各端设计 |
| TUI F11（输入框方向键编辑） | F-W6 | 语义同源（同款竖移规则——对端文档明载其口径引本端同款）；呈现载体各端自持 |
| TUI F12（`/advisor` 子菜单） | advisor 配置面 = 设置面板（`thincoder-vscode/webview/settings-models.js` advisor 区） | 命令子菜单（对端）vs 面板表单（本端）——入口形态端差 |
| TUI F13（attention 态） | 本端对位 = 工具条按钮 active + plan 徽标 + 权限 / 提问卡流内可见 | **端差（明确登记）：attention chip 不做**（设计 = `design/WEBVIEW-PROTOCOL.md` §6.1）；无系统级通知 / 闪烁 |
| TUI N1–N2（滚动 / 加载不卡） | N-W3 / N-W2 | 机制端差：终端渲染缓存 vs DOM 窗口化 + 离屏跳过 |
| TUI N3（跨端对齐） | N-W4 | 等价（分页常量两端对齐 200） |
| TUI N4（零依赖） | N-W1 | 等价（两端同政策） |
| TUI N5–N6（防刷屏 / 省略计数真值） | 块折叠形态（冻结头 + tail——设计 = `design/WEBVIEW-PROTOCOL.md` §6.2） | 冻结头 + tail-3 同形态保持（等价）；本端截断标记不含计数（`thincoder-vscode/webview/lib.js:30` 注文本）——「省略 N 行」体系端差 |
| **本端 F-W15**（`@file` 展开面） | 人读线 = **两端共文件**（CLI 同读该线） | **端差（登记 2026-09-18）**：本端取**端侧显示边界剥离**（`stripAtRefs`——恢复回读 + 标题面还原简洁形，`thincoder-vscode/src/extension/panel-session.mjs`）；**CLI 面渲染仍显 `[File: …]` 展开文**（同源人读线、未随本端剥离）——是否随端处置待裁 |
| **本端 F-W16**（工具失败可见面） | 对位 = `TTO`（工具输出上限系） | **端差（登记 2026-09-18）**：① **卡态语义为本端独有**（红 / 保持展开 / 摘要含退出状态三信号——CLI 无卡态）；② **成功面不拼 `(exit code 0)`**（CLI 摘要侧拼退出状态；本端仅失败面拼非零状态） |
| TUI N7（选择面行宽预算） | —（本端无 cols 固定宽面） | 不适用：面板自适应宽度；预算式不入本端 |
| TUI N8（方向键编辑约束） | F-W6 | 等价（零列记忆两端同）；载体 = 浏览器输入框原生编辑 + 判定五态 |
| TUI N9（attention 零侵入） | —（随 F13 行） | attention chip 不做（登记态）；无空闲重绘面 |
| TUI N10（显示层内存有界） | N-W2 | 口径端差：对端 = 各载体字符额度族；本端 = 块窗 150 + 卡体 64K + 离屏跳过（DOM 面） |
| TTO FR1–FR3（行间区块 / 滚动内容 / 完成行） | F-W4 | 形态端差：卡片（折叠 / 展开）vs 行间区块（`❯` / `│` 前缀）；完成语义同（done / 失败 + 耗时 + 摘要） |
| TTO FR4（完整输出落盘） | `TOOL-OUTPUT-LIMITS（VSC 侧·需求）`（本档不重述——D2）；呈现面 = 卡体预览 | 无端差（同机制——本端已自持对位档） |
| TTO NFR1（区块渲染性能） | N-W3 | 等价（增量路径） |
| TTO NFR2（单一输出入口） | 消息族 `toolCall` / `toolOutput` / `toolResult`（`thincoder-vscode/webview/chat.js:139-141`） | 接口形态端差：宿主回调 vs postMessage 消息族 |

## 5. 不并项与历史沿革

### 5.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-vscode/docs/requirements/WEBVIEW.md`（VSC 产品档）——**原地保留作参照历史**。下列内容**不并入本档**：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 头注「本仓自持需求档」建档依据段 | 建档依据（F11 / §8.6 建档规则） | 时点材料——需求已住基准层，自持理由不再需要 |
| 头注「实测口径 as-of 2026-09-12」 | 时点口径行 | 时点材料——本档首注已给口径 |
| 旧档 §5「变更记录」（2 条：建档 / N-W5 收正） | 逐批流水 | 历史叙述——本档自有变更记录 |

### 5.2 迁移期状态登记（**非**不并项——须随批收口）

| # | 事项 | 现状 | 收口点 |
|---|---|---|---|
| 1 | 设计侧三档（`design/WEBVIEW.md` · `WEBVIEW-PROTOCOL.md` · `WEBVIEW-INPUT.md`）**已迁入基准层**（批 2） | 本档 §1 / §2 的设计节引用已翻转为**同层引用**（`design/<档>.md` §N——`docs/core/design/DOC-SYSTEM.md` §7 R2 层前缀形态） | 本批已收口 |
| 2 | `AGENT-LOOP（VSC 侧·需求）` §10 / §12 / §14 / §16 未迁入基准层 | 同上 | 统一面批次（`docs/core/requirements/AGENT-LOOP.md` 并入后翻转） |
| 3 | 测试档路径按仓根写（`thincoder-vscode/test/...`） | 已按现状改写（产品树仍在） | 产品树降格后随批收口 |

## 变更记录

- 2026-09-15（**B 式迁移轮 · VSC 第 1 批**）：建档——`thincoder-vscode/docs/requirements/WEBVIEW.md` 内容重建入基准层（旧档一字未改、原地作参照历史）；坐标改写为仓根相对现状路径（代码 / 测试档锚全部加 `thincoder-vscode/` 前缀）；设计节与对位档引用改用迁移期现状口径（§5.2）；时点材料与逐批流水入 §5.1。

- 2026-09-15（**B 式迁移轮 · VSC 第 2 批**）：设计侧引用**翻转**——源档 `WEBVIEW（VSC 侧）`（1867 行）已拆三档迁入基准层
  （`design/WEBVIEW.md` · `design/WEBVIEW-PROTOCOL.md` · `design/WEBVIEW-INPUT.md`），本档 §1 / §2 / §4 的设计节引用改同层引用（R2 层前缀）；
  §5.2 第 1 条**收口**；漂移坐标按现态收正（`chat.js` 353-390 → 351-405 · `chat.css` 471 → 474-475）。

- 2026-09-16（批 7）：§3 新增 **N-W7**（收发面对表零未处置——表落 `design/WEBVIEW-PROTOCOL.md` §12；机检 = `thincoder-vscode/test/protocol-coverage.test.mjs`（拟新增））。
- 2026-09-18（**配置面接线缺陷批 · 父侧直接执行 · 可 revert**——台账 #89；来源 = 只读审计 id=90）：新增 **F-W8–F-W12**（快照打开必达 / 控件级回填 / 空值不得静默清除 / Shell 控件接线或移除 / 收发面对表零未处置）+ **N-W8**（三条先红后绿用例）；另登记 P2-3…P2-7 五条（消解路径 + 到期条件在册）与三条设计意图（勿误修）；**待用户裁 1 项**（key / token 单击即删）在册。
- 2026-09-18 17:4x（**父侧直接执行 · 承设计轮 id=92 实测上抛**）：**F-W12 计数收正 3 → 4**（增列 `saveEmbeddingConfig`（`panel-messages.mjs:372`））+ 落点收正（§12 → **§13 独立节**，理由 = 并入 §12 会本轮改红既有协议机检 + `userMessage` 双同名）。
- 2026-09-18 18:0x（**父侧直接执行 · 承会话界面审计 id=98**——台账 #90）：新增 **F-W13–F-W16**（批权限卡可释放 / 回合中改模型须落盘 / `@file` 展开不得污染人读线（口径待裁）/ 工具非零退出可见性（CLI 对位））+ **登记八条 🔵**（死写 / 死计数 / idle 残留轮次 / `@` 下拉重开 / 恢复卡缺摘要段 / 裁剪窗缺口 / 索引进度残留 / reload 撞在飞回合）+ **设计意图十条**（勿误修）；审计结论 = 🔴 0 · 🟠 4 · 🔵 8。
- 2026-09-18 21:0x（**端差收尾 · 父侧直接执行 · 可 revert**——承会话界面批 §2.6 #10 + 评审 id=104 发现 10）：§4 表补**两行端差登记**——① **F-W15 的 CLI 端面**（本端取端侧剥离；CLI 渲染仍显 `[File: …]` 展开文——是否随端处置待裁）② **F-W16 两条**（卡态语义本端独有；成功面不拼 `(exit code 0)`）。
- 2026-09-18 21:1x（**父侧直接执行 · 可 revert**——用户 21:09 裁定）：新增 **F-W17**（密钥/令牌类删除须二次确认——不满足 P5「可逆才单击即删」的前提；非密钥类保持单击即删；不取撤销机制）；配置页批「待用户裁 1 项」**由此结清**。
- 2026-09-18 22:2x（**父侧直接执行 · 可 revert —— 用户 22:21 改判**）：「**mcp 删除那个还是要确认一下好**」⇒ **MCP server 行 ✕ 改入确认门**（原登记 ②「保持单击即删」**作废**）：删整条时其 token 同亡、不可复得 ⇒ 不满足 P5「可逆才单击即删」的前提；**provider 行 ✕ 保持单击即删**（重填 URL/名即可逆）。新批 = `docs/batches/2026-09-18-vsc-mcp-delete-confirm.md`。
- 2026-09-18 22:1x（**父侧直接执行 · 可 revert —— 用户 22:13「可以」= 四条默认裁定落册**）：① **F-W16 第三卡面**（`webview/ui.js:359-392` `buildToolHistory` 孤儿卡）⇒ **登记另批**（设计只点名「活卡 + 恢复卡」两卡面）；② **MCP server 行**（删整条时其 token 一并消失）⇒ **保持单击即删**（承 09-18 21:09 裁定 B——用户确认口径）；张力在册待复议；
  ④ **F-W15 的 CLI 端面**（渲染仍显 `[File: …]`）⇒ **不随端**（单核语义、两端各自呈现——端差档案结案）。
  ③ **MCP token/headers 表单清空保存**（`config-mcp.mjs:52-54`）⇒ **不算「删除按钮」判据域**（表单语义 ≠ 删除动作）⇒ 维持登记；
- 2026-09-18 21:2x（**父侧直接执行 · 承设计轮 id=108 实测上抛 1/2/3**）：**F-W17 括注按实测收正**（live 2 + 死 handler 1 + MCP token/headers 无删除钮——原括注四类不实；掩码位收正）；**MCP server 行归类张力登记**（删整条时其 token 一并消失，而本档归「可逆类」——按用户 21:09 裁定 B 执行，张力入册待复议）。
- 2026-09-18 23:4x（**父侧直接执行 · 可 revert**——用户 23:33「live 区毛病一起修了」）：§2 新增**并入条目 F-A1–F-A5 / NFR-A1–A3**（异步任务可见性——自迁移期参照档 §3 收敛入基准层，编号承旧档；复发实据在册）；批 = `docs/batches/2026-09-18-init-block.md`。
- 2026-09-19 08:1x（**父侧直接执行 · 可 revert —— 用户 08:11 裁定 A**）：**provider 行 ✕ 亦入确认门**（逐字「**A，也入。**」）——删行连带删其 `apiKey` 原文（`config-io.mjs:201-208` 写 / `:262-277` 整条 filter）⇒ 不可复得 ⇒ 与 MCP 行同判据；
  **F-W17 判据句与产出格收正**（原「非密钥类保持单击即删」/「非密钥类行为零回归」**两处作废**）；「单击即删」类自此**为空域**。新批 = `docs/batches/2026-09-19-vsc-provider-delete-confirm.md`。
- 2026-09-19 20:5x（**父侧直接执行 · 可 revert**）：**实测入口册补第六行**（模型菜单 footer「Remove provider」——载体 `webview/model-picker.js:25` 直发 `removeProvider`（无 name ⇒ 宿 QuickPick 选）· 渲染位 `model-menu.js:128-134`；同消息第二载体、与 settings 面同判据入确认门）；**计数口径定案 = 册序**（本入口 = 入口册 #6/6，「不计死 handler」的口径作废）。批 = `docs/batches/2026-09-19-vsc-model-menu-delete-confirm.md`（设计评 pass id=142）。
