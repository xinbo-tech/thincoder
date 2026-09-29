# 2026-09-29 · parity-closeout
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-29 · 来源 = 用户 2026-09-29 04:19 质问「为啥要每次重新发明轮子」——对位清单（annex-inventory53）未决行全量清账（登记了没清的机制性缺口）。
> 台账 = 无（清账轮——清账表产出后由父侧归账）。前情 = `docs/batches/2026-09-28-flow-vsc-align-annex-inventory53.md`（清单本体——本批 = 其未决行全量清账）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 来源与口径（父侧 · 2026-09-29 04:2x）
- **来源**：用户 04:19 质问「为啥要每次重新发明轮子 ∕ 每次都做不一样的东西」。父侧实证：**对位清单早已登记过这些偏离**——`annex-inventory53` `:27`「队列显示：desktop 未取 `planBusyQueued`，自持镜面」· `:45`「窗内输入路由：重造（载体差异）」，**却无人清账**（annex 非六段档、无清账载体；其行随相关批收口而搁置）——机制性缺口 = **「登记了没清」**。
- **本批 = 清账轮**：annex 未决行全量 → 清账表（状态 ∕ 证据 ∕ 处置 ∕ 落点）；「立即落」小件清单；清单防再腐判据候选（未决行 ⇒ 台账行）。
- **与 #564 批（`docs/batches/2026-09-29-desktop-window-queue-parity.md`）的关系**：该批 = 其中两行（队列显示 ∕ 窗内输入）的**即时落**（首件）；本批 = 其余全量清账。
- **口径**：不实施（清账表 = 任务书产出，实施归后续轮 ∕ 批）；annex 零触（行标注走报告列，父侧落账）。

### 1.2 用户裁定（2026-09-29 04:25 · 父侧录）
- 用户问「**为啥不都修啊？**」⇒ 裁定 = **全修**：清单全部未决行一律修掉，不留挂账——覆盖**重造榜 11 条 ∕ 反向未消费 7 条 ∕ 上提候选 8 条**（含已半落者的端改指尾账）。
- 处置序（父侧）：**#53 清账表落地 → 逐行转单 → 按依赖序实施**（小件横扫 → 队列族 ∕ 卡面 → VSC ∕ CLI 收口核 → 尾账改指）；每行以「勾掉 ∕ 登记例外（三件齐）」收尾，**零挂账**。
- 台账：全修产出逐行落账（父侧笔）。
- 例外口径：仅「真端差候选 7 条」（宿主/平台/产品模型面，各一句由）不在全修射程——已在清单 §3 成文。

### 1.3 裁定修订（2026-09-29 04:26 · 父侧录 · 收回 §1.2 的例外条款）
- 用户质问「真端差 7 处，又以『已成文』拒绝修」⇒ **§1.2 的「真端差 7 条不在全修射程」收回**。判据（在案）：**用户可见端差 = 缺陷；唯一例外 = 宿主能力面（受能力约束、仅一侧具备）且逐条实证；「登记后保留」已废**——「已成文」不是例外理由。
- **处置**：§3 七条**全部重开逐条重审**——① 宿主约束部分逐条点名实证；② 非宿主约束部分（载荷契约 ∕ 策略 ∕ 词键 ∕ 值面 ∕ 结构面）**一律入全修**。已知：⑤ 多会话模型条 = 用户 19:04 已裁收编（非例外，在跑）；⑥ UI 面条 = 整体例外不成立（逐面重审）。
- 已随 `send` 并入 #53 射程（清账表 + 重审表同批出）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成 · 2026-09-29（清账表全量 76 行落盘；抽查两件结论在册；「立即落」∕ 归批分立）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.0 交付形态与口径（清账轮）
- **本批 = 清账轮（只清账不实施）**：交付物 = 本节本身（清账表 ∕ 「立即落」清单 ∕ 归批建议表 ∕ 防再腐判据句）——**不另立设计档**（先例 = `docs/batches/2026-09-28-desktop-flow-vsc-align.md` §2.0）。
- **行坐标 = annex 行号**（`docs/batches/2026-09-28-flow-vsc-align-annex-inventory53.md`）；路径略记：core=`thincoder-core/` · desk=`thincoder-desktop/` · vsc=`thincoder-vscode/` · cli=`thincoder-cli/` · rc=`thincoder-render-core/`。
- **状态五值**：已落 ∕ 半落〔差额点〕 ∕ 未落 ∕ 真端差 ∕ 在途。**处置四值**：核销（已落——零动作）∕ 立即落（父侧直做）∕ 归批（批号见 2.5）∕ 登记例外（宿主面 ∕ 在册裁定）。
- **证据三级标注**：本批实读（2026-09-29 04:2x–04:3x，read ∕ grep ∕ glob）· 「批档」（引自批记录）· 「原引」（未复勘坐标——随 annex 原引行）。
- **边界**：annex 零触（行标注走本节）；产品码 ∕ 三冻结档零触；零实施 ∕ 零测试改动。

### 2.1 本批条目（覆盖）与边界
- **覆盖** = annex 全量未决行：§1 机制对位表 **44 行实点**（annex 交付表记「12 族 40 行」——勘误 2.6-F1）+ 清单区 **32 行**（重造榜 11 ∕ 上提计划 8 ∕ 反向发现 7 ∕ 未核面 6）= **76 行逐行清账**（2.2-A ∕ 2.2-B）。
- **不复**：`:27`（队列显示）· `:45`（窗内输入路由）= 已归 #564 批（在途——`docs/batches/2026-09-29-desktop-window-queue-parity.md` §2–§6 未收）；本批按「在途」登记（2.4-3 收口对照）。
- **不做**：实施；annex 文件改动；超 annex 射程扩面。

### 2.2 清账表（全量 · 76 行）

#### A · annex §1 机制对位表（44 行）

| 行 | 面 | 状态 | 实读证据 | 处置 | 落点 |
|---|---|---|---|---|---|
| :23 | 队表+容量+条目形 | 半落〔VSC ∕ CLI 未迁〕 | core/queued.mjs:20-25（三常量）；desk/queued-input.mjs:18（核直取）；vsc/queued-merge.mjs:15-20（自持）；cli/queued-merge.mjs:19-25（自持）；核档留端句 queued.mjs:13-14 | 归批 | B2 |
| :24 | 合并批计划 | 半落〔同 :23〕 | core/queued.mjs:41-69（planQueuedInput）；desk/queued-input.mjs:48（核调用·零本地副本）；vsc/queued-merge.mjs:50-78；cli/queued-merge.mjs:40-68 | 归批 | B2 |
| :25 | 步边界 pickup | 半落〔策略面三端各持〕 | core/queued.mjs:82-90（取项面已出）+:13-14（策略留端）；desk/turn-chain.mjs:45-52 + 裁 :20-22（KD-40）；vsc/queued-pickup.mjs:31-40；cli/queued-pickup.mjs:12 | 归批 | B2+B6 |
| :26 | 回合尾续发 | 半落〔同 :25〕 | desk/turn-chain.mjs:55-72（continueTurn 自持）；vsc/suspension.mjs:33+queued-pickup.mjs:50；cli/agent-turn.mjs:384（队列递归） | 归批 | B6+B2 |
| :27 | 队列显示 | 在途（#564） | desk/renderer/queue.mjs:15-19（容量常量核单源——R1 残项已落·批档）；#564 档 §2–§6 未收 | 归批（在途） | #564 收口对照 |
| :33 | depth-0 主循环 | 半落〔VSC fork〕 | desk/agent-host.mjs:36/:91（runAgent 核直取）；cli/agent-turn.mjs:17/:187；vsc/src/agent.mjs 在盘（含核叶引用）+ src/agent/* 13 档（glob） | 归批 | B1 |
| :34 | 单回合执行面+三径 | 真端差（端胶水） | desk/turn-face.mjs:27-28/:46；cli/agent-turn.mjs；vsc panel-turn-*（原引） | 登记例外 | 语义核 §6.8（在册） |
| :35 | 回调桥 | 已对齐（映射）+真端差（通道） | desk/agent-bridge.mjs:39-40/:165-168（rc relay 单源直取）；通道=宿主面（IPC ∥ postMessage） | 核销+登记例外 | — |
| :36 | 协议行解析/摘要 | 未落（小面·可选） | desk/agent-bridge.mjs:58/:68（自持）；核 stripEventToken ∕ rc tool-summary（原引） | 归批 | B7 |
| :37 | 阶段函数族 | 半落〔VSC fork〕 | vsc/src/agent/run-stages.mjs+response-stages+context-injections 在盘（glob）；core/agent/run-stages.mjs 在盘；desk∕cli 消费（原引） | 归批 | B1 |
| :43 | 挂起会话驱动 | 半落〔VSC+CLI 未消费——仍真·抽查件〕 | desk/suspension-drive.mjs:22（核 startSuspension 直取）；vsc/suspension.mjs:59/:74/:125/:260（自持）；cli/suspension-drive.mjs:94/:236（自持）；core/agent/suspension.mjs:52/:63/:78/:106/:172（五导出在位） | 归批 | B1 |
| :44 | 池判据/清扫/计数 | 半落〔同上〕 | core/agent/suspension.mjs:52/:63/:78；vsc/suspension.mjs:59/:74/:125；cli/suspension-drive.mjs:73/:94 | 归批 | B1 |
| :45 | 残输入兜底/窗内输入 | 在途（#564） | desk 驱动主面已收口（suspension-drive.mjs:22——核消费）；#564 档在途 | 归批（在途） | #564 收口对照 |
| :46 | 存活 2s 拍 | 半落〔VSC 未迁〕 | core/agent/live-beat.mjs:19（LIVE_HEARTBEAT_MS）；desk/subagent-face.mjs:21/:27（直取+re-export）；vsc/panel-messages.mjs:45/:62（自持） | 归批 | B4 |
| :52 | timer 闩+火面 | 半落〔VSC ∕ CLI 未迁〕 | core/agent/timers.mjs:77/:102（createTimerWatch ∕ fireTimerWake——已出）；desk/timer-watch.mjs:11-15（核直取·零自持闩）；vsc/timer-watch.mjs:28（只取三原语）；cli/timer-watch.mjs:18（同） | 归批 | B3 |
| :58 | 槽清单/end-marker/端名 | 已落 | desk/session-slots.mjs:64/:69（核 re-export；END="desktop"）；vsc END="vscode"（原引） | 核销 | — |
| :59 | 槽装载/落盘 | 已落（核单源+四落点在册） | desk/session-io.mjs:3/:19（核三件直取）；vsc/session-io.mjs:9-13（四落点端壳·marker 走核同名件）；SESSION.md:222/:1123（D-4「VSC 落点」收正） | 核销 | 在册裁定 |
| :60 | 历史页读面 | 已落 | core/history-window.mjs 在盘（glob）；desk pageHistory（原引） | 核销 | — |
| :61 | 会话 GC/索引 | 已落（原缺面已消） | desk/session-maintenance.mjs:4-9（核 session-gc 消费）；desk/session-slots.mjs:205/:213（re-export 三件） | 核销 | — |
| :62 | 台账可见面 | 已落 | desk/project-info.mjs:41/:96（核 buildScan ∕ startLedgerSurface）；vsc/ledger-surface.mjs:31-32 | 核销 | — |
| :68 | 装配序 | 未落 | core/agent/setup.mjs:42（仅 prepareRun 一导出——无装配序）；desk/agent-assemble.mjs:4-15（自持——SHELL.md §4 第三份） | 归批 | B5 |
| :69 | 团队层取值 | 未落 | desk/agent-assemble.mjs:35/:43/:49（teamConfig ∕ gitAuthor ∕ validateProvider 端本地——「不引他端模块」） | 归批 | B5 |

| :75 | 通道注册/分发 | 真端差（宿主传输面） | desk/ipc.mjs + ipc-registry.mjs 在盘（glob；#28 split·批档） | 登记例外 | — |
| :76 | 静态供给/协议 | 真端差（供给机制）+已对齐（同 rc） | desk/protocol.mjs:20-21/:33-37（双根 /rc/ 供给——本批复勘）；rc 包两端消费（原引） | 登记例外 | — |
| :77 | 窗口/菜单/主题/冒烟 | 真端差（宿主面） | desk/window.mjs ∕ main.mjs ∕ host-floor.mjs 在盘（glob） | 登记例外 | — |
| :83 | 回合完成提示 | 半落〔VSC 未迁〕 | core/notify-policy.mjs 在盘；desk/notify.mjs:11（转口）；vsc/notify.mjs:9-11（自持——对位锚） | 归批 | B4 |
| :89 | 贴图落盘 | 半落〔VSC 未迁〕 | core/attachments.mjs:33/:36/:43/:53/:65；desk/attachments.mjs:23/:61（核消费）；vsc/image-handler.mjs（自持·在册差异 5 条 core/attachments.mjs:11-17） | 归批 | B4 |
| :90 | 非视觉降级 | 半落〔desk 未接+VSC 未迁〕 | core/attachments.mjs:113（降级跑者已出+visionReader 缝）；desk/attachments.mjs:14-16/:58-59（文本提示——处置面留端）；vsc/image-handler.mjs:71/:109（自持 runVisionReader） | 归批 | B4 |
| :96 | provider 读写/流程 | 半落〔VSC UI 壳留端〕 | core/provider-flows.mjs 在盘；desk/providers.mjs:24（核消费）；vsc/provider-flows.mjs:10-15（UI 壳+持久化核单源） | 归批 | B4 |
| :97 | 渠道探针/准入 | 已落 | desk/providers.mjs:24（probeAdmission）；vsc/provider-flows.mjs:22（probeChannelModels） | 核销 | — |
| :98 | MCP 面 | 已落 | desk/mcp-servers.mjs:18（核 connect ∕ probe ∕ remove） | 核销 | — |
| :99 | 设置面 UI | 真端差（宿主 UI） | desk/views/settings*.mjs 在盘（glob）；vsc webview settings*.js（原引） | 登记例外 | — |
| :105 | 取消/停止出口 | 已落 | desk/subagent-face.mjs:23/:71（核 executeCancelAction ∕ cancelSyncChild） | 核销 | — |
| :106 | 子代理映射/中继 | 未落（CLI·可选） | cli/subagent-blocks.mjs:20（仅核 relay-prefix；未接 rc）；desk/subagent-reduce.mjs:22（/rc/subblocks/state 消费） | 归批 | B7 |
| :107 | 面板/块渲染 | 已落 | desk/subagent-reduce.mjs:22；vsc webview（原引）；cli 自持归 :106 | 核销 | — |
| :113 | 文件链接 | 半落〔VSC 未迁〕 | core/file-links.mjs 在盘；desk/file-links.mjs:14/:17/:23（核直取+fs 缝）；vsc/file-links.mjs:13/:15（自持） | 归批 | B4 |
| :114 | skills | 半落〔VSC 未迁〕 | core/skills.mjs 在盘；vsc/skills.mjs:5（自持 sync 版）；cli 已消费（原引） | 归批 | B1 |
| :115 | 规则面 | 半落〔增量去留未裁〕 | desk/agent-assemble.mjs:22（discoverRules 核消费）；vsc rules-face.mjs+rules.mjs（.cursor/rules 增量——原引） | 归批 | B7 |
| :116 | i18n | 已裁定（真端差） | 容器归一 ∕ 投影端差 = 在册 D1 裁定；值面校照在册（原引） | 登记例外 | — |
| :117 | 多实例协作（peers） | 半落〔VSC 未收口〕 | core/peer-claims.mjs 等三档在盘；vsc/peer-claims.mjs:2（「VS Code 镜像」自注） | 归批 | B1 |
| :118 | 卡面 | 已落 | desk/renderer/views/approval.mjs:27（/rc/cards/permission 直取）；R1 批档在册 | 核销 | — |
| :119 | 项目面/会话栏 | 已落（模型对齐）+余真端差 | R13-A「VSC 形会话控制」落（批档）；desk/views/session-control.mjs 在盘（glob）；核 session-stale 已消费（原引） | 核销+登记例外（余） | — |
| :120 | 渲染面引导/状态树/归约 | 真端差（状态树）+已对齐（原语） | rc 在盘；desk/store.mjs ∕ events.mjs（原引——未复勘） | 登记例外 | — |
| :121 | VSC-only 宿主特性面 | 真端差（宿主特性） | vsc workspace-guard ∕ loop-sampler ∕ provider-probe-window 等（原引） | 登记例外 | — |

#### B · annex 清单区（重造榜 11 ∕ 上提计划 8 ∕ 反向发现 7 ∕ 未核面 6 = 32 行）

| 行 | 面 | 状态 | 实读证据 | 处置 | 落点 |
|---|---|---|---|---|---|
| :129 | 重造①队列族 | 半落〔同 :23/:24〕 | core/queued.mjs+desk 消费；VSC ∕ CLI 未迁（见 A） | 归批 | B2 |
| :130 | 重造②turn-chain | 半落〔策略留端——KD-40 在册裁〕 | desk/turn-chain.mjs:20-22/:45-72 | 归批 | B6+B2 |
| :131 | 重造③timer 三端 | 半落 | core/agent/timers.mjs:77/:102；desk/timer-watch.mjs:11-15；vsc ∕ cli 自持（同 A :52） | 归批 | B3 |
| :132 | 重造④file-links | 半落 | core/file-links.mjs；desk/file-links.mjs:14/:23；vsc 自持 :13 | 归批 | B4 |
| :133 | 重造⑤attachments | 半落 | core/attachments.mjs:33-65；desk/attachments.mjs:23；vsc 自持 | 归批 | B4 |
| :134 | 重造⑥suspension 窗面（**孤儿**） | 孤儿〔表行 :45 归 #564〕 | 驱动主面 desk 已核消费 suspension-drive.mjs:22；残面随 #564 ∕ B1 | 归批（在途+B1） | #564+B1 |
| :135 | 重造⑦2s 拍 | 半落 | 同 A :46 | 归批 | B4 |
| :136 | 重造⑧notify | 半落 | 同 A :83 | 归批 | B4 |
| :137 | 重造⑨装配序 | 未落 | 同 A :68/:69 | 归批 | B5 |
| :138 | 重造⑩卡面 | 已落 | desk/views/approval.mjs:27；R1 批档 | 核销 | — |
| :139 | 重造⑪queue 镜面（**孤儿**） | 孤儿〔#564 在途〕 | 残项已落 desk/renderer/queue.mjs:15-19 | 归批（在途） | #564 |
| :163 | 上提①队列纯逻辑族 | 半落〔队表+策略留端〕 | core/queued.mjs:20-90（纯逻辑 ∕ 常量 ∕ 合并串 ∕ 取项已落）+:13-14（队表 ∕ 步边界策略留端）；抽查详 2.3 | 归批 | B2+B6 |
| :164 | 上提②timer 闩+火 | 半落 | core/agent/timers.mjs:77/:102；desk 消费 | 归批 | B3 |
| :165 | 上提③附件贴图族 | 半落 | core/attachments.mjs:33/:65/:113；desk 消费 | 归批 | B4 |
| :166 | 上提④file-links | 半落 | core/file-links.mjs；desk/file-links.mjs:23 | 归批 | B4 |
| :167 | 上提⑤装配序 | 未落 | core/agent/setup.mjs:42（无装配序） | 归批 | B5 |
| :168 | 上提⑥存活拍 | 半落 | core/agent/live-beat.mjs:19 | 归批 | B4 |
| :169 | 上提⑦提示策略 | 半落 | core/notify-policy.mjs 在盘；desk/notify.mjs:11 | 归批 | B4 |
| :170 | 上提⑧provider 流程族 | 半落 | core/provider-flows.mjs；desk/providers.mjs:24；vsc UI 壳 | 归批 | B4 |
| :178 | 反①suspension 未消费 | 仍真 | vsc/suspension.mjs:59/:74/:125/:260；cli/suspension-drive.mjs:94/:236 | 归批 | B1 |
| :179 | 反②skills 未消费 | 仍真 | vsc/skills.mjs:5 | 归批 | B1 |
| :180 | 反③peers 镜像 | 仍真 | vsc/peer-claims.mjs:2 | 归批 | B1 |
| :181 | 反④runAgent ∕ run-stages fork | 仍真 | vsc/src/agent.mjs + src/agent/* 13 档 | 归批 | B1 |
| :182 | 反⑤rc/cards（desk） | 已消 | desk/views/approval.mjs:27（R1） | 核销 | — |
| :183 | 反⑥queued-mark planBusyQueued | 部分消解 | 容量常量已接 desk/renderer/queue.mjs:15；planBusyQueued 不消费 = R1 裁①（批档）；余面 #564 在途 | 核销（裁决）+归批（在途） | #564 |
| :184 | 反⑦rc/subblocks（CLI） | 仍真 | cli/subagent-blocks.mjs:20（仅核 relay-prefix） | 归批 | B7 |
| :190a | 未核①vsc agent↔core 逐档 | 仍未核 | vsc src/agent/* 13 档（glob）；逐档对位未做 | 归批（前置勘察） | B1 |
| :190b | 未核②CLI 装配点 ∕ subagent-blocks 内部 | 部分复勘 | CLI 树 prepareRun 零 import（仅 cli/command-interactive.mjs:135 一注释）——装配点仍待细核 | 归批（前置勘察） | B5+B1 |
| :190c | 未核③队列对拍测试 | 查证=不在盘 | vsc/test/ 现 files ∕ run ∕ slow ∕ smoke×2（glob）；desk 测试树随全清令全删（批档）；vsc/queued-merge.mjs:6-8 引 test/queue-visible-vsc.test.mjs = 死指针（F3） | 归批（迁移批重建锁） | B2 |
| :190d | 未核④/rc/ 别名解析 | 已复勘闭合 | desk/protocol.mjs:20-21/:33-37（双根供给+逃逸门） | 核销 | — |
| :190e | 未核⑤queued-merge 尾部 ∕ panel-messages 内部 | 半闭合 | vsc/queued-merge.mjs 全档已复勘（78 行）；panel-messages 内部未复勘 | 归批（顺带） | B2 |
| :192 | 未核⑥行数 ∕ 档数口径 | 勘误 | 实点 44 行（vs 记 40）；vsc src/agent 13 档（vs 记 12） | 报告列 | F1 |

### 2.3 已落抽查结论（任务书点名两件）
1. **`core/queued.mjs` 整族逐项对（:163 上提行）**——**纯逻辑 ✓**（`planQueuedInput` queued.mjs:41-69，与 VSC ∕ CLI 同名同值）· **容量常量 ✓**（MAX_MERGE_ITEMS=8 :20 ∕ MAX_MERGE_CHARS=2000 :21 ∕ QUEUED_MAX_ITEMS=8 :25）· **合并串 ✓**（formatMergedMessages :28-30）· **取项面 ✓**（takeQueuedBatchItem :82-90——桌面按 KD-40 裁定暂不消费 :10-11）· **队表 ✗ 留端**（:13——按键 Map ∕ 单容器归各端）· **步边界 ∕ 尾续发策略 ✗ 留端**（:13-14「步边界守卫与送达面」）。**结论 = :163 行半落**：纯逻辑族 ∕ 常量 ∕ 合并串 ∕ 取项已落；队表+策略面留端（R3 判「载体面不迁」——差额点去留入 B6 裁决）。
2. **:43 行（VSC+CLI 未消费核件——是否仍真）**——**仍真**：desk 已消费（suspension-drive.mjs:22 核 startSuspension）；vsc/suspension.mjs:59/:74/:125/:260 自持 poolLive ∕ sweepSettledToPending ∕ backgroundStatus ∕ suspensionSession；cli/suspension-drive.mjs:94/:236 自持 poolLive ∕ suspensionSession；core 五导出在位（:52/:63/:78/:106/:172）。

### 2.4 「立即落」小件清单（父侧可直接做）
1. **台账行登记**（父侧单点——防再腐判据执行面）：按 2.5 归批表把全部未决行落为台账行（建议簇 = B1–B7 + 例外簇 + #564 对照项）。
2. **勘误注记**（零文件触——annex 零触）：F1 三件（40⇒44 行 ∕ VSC src/agent 12⇒13 档 ∕ 死指针 F3）——父侧在台账行 ∕ 批档注记。
3. **#564 收口对照项**：`:27` ∕ `:45` 两行以 #564 收口为核销点（收口检查时对照本 §2——防「登记了没清」重演）。

### 2.5 归批建议表（父侧裁）
| 批 | 覆盖行 | 说明 ∕ 前置 |
|---|---|---|
| B1 · VSC 收口核（大件） | :33 ∕ :37 ∕ :43 ∕ :44 ∕ :114 ∕ :117 + 反①–④ | 前置 = 未核①勘察；VSC 迁移消费 suspension ∕ skills ∕ peers ∕ 循环+阶段族 |
| B2 · 队列族三端收口 | :23–:26 + 重造① + 未核③⑤ +（#564 收口后两行随动） | 对拍锁重建（未核③）；KD-40 裁定对照 |
| B3 · timer 三端收口 | :52 + 重造③ + 上提② | 核闩+火已出，两端迁移 |
| B4 · VSC 小件迁移族 | :46 ∕ :83 ∕ :89 ∕ :90 ∕ :96 ∕ :113 + 重造④⑤⑦⑧ + 上提③④⑥⑦⑧ | 含 desk 附件降级接入（:90）；F6 在册差异随迁 |
| B5 · 装配序上提 | :68 ∕ :69 + 重造⑨ + 上提⑤ + 未核② | core setup 扩 + 三端消费 |
| B6 · 队列策略面裁决轮 | :25 ∕ :26 策略留端去留 + 重造② + 上提①差额点 | R3「载体面不迁」复核（设计面轮） |
| B7 · 小面可选族 | :36 ∕ :106 ∕ :115 + 反⑦ | 低优先；并入上述批顺带或单列 |
| 例外登记（零批） | :34 ∕ :35 ∕ :75 ∕ :76 ∕ :77 ∕ :99 ∕ :116 ∕ :119 余 ∕ :120 ∕ :121 | 真端差（宿主面 ∕ 在册裁定）——按 F5 补宿主面实证 |
| 在途 | :27 ∕ :45 + 重造⑥⑪ + 反⑥ | #564；收口对照 |

### 2.6 防再腐判据（候选）+ 发现项（上抛）
- **判据句（候选）**：**「annex 类登记面（非六段档）的未决行 ⇒ 当日落为台账行（父侧归账）；行未核销前，其来源批不得随批收口搁置。」**
- **F1** annex 计数勘误：交付表记「12 族 40 行」——实点 **44 行**（本批逐行实点）。
- **F2** vsc `src/agent/*` 现 **13 档**（annex 时点 12——含 agent-state.mjs 等成长）。
- **F3** vsc/queued-merge.mjs:6-8 引对拍锁 `test/queue-visible-vsc.test.mjs`（T-V16-14）**不在盘**——死指针（迁移批重建锁时一并收正）。
- **F4** #564 未收口（§2–§6 空）——`:27` ∕ `:45` 按「在途」登记，收口前不得核销。
- **F5** 「登记例外」各行需按 2026-09-28 18:57 用户口径（用户可见端差=缺陷；唯一例外=宿主能力面须实证）逐条补实证——本表已按宿主面标注；原「多会话标签模型」差已随 R13-A 消除（A :119）。
- **F6** core/attachments.mjs:11-17 在册差异 5 条（阈单位 ∕ 弃项索引 ∕ 合计闸 ∕ 降级判据 ∕ 清理面）随 VSC 迁移轮收正（B4 携带）。

### 2.7 受影响文件与测试面 · 验收对照 · 关键决策
- **受影响文件**：零（清账轮——产品码 ∕ 测试 ∕ annex 零触；本批唯一落盘 = 本 §2）。
- **测试面**：无新增 ∕ 无修改（本批零代码）。
- **验收对照**：① 清账表覆盖 annex 全量未决行（44+32 = 76 行，零遗漏——含机制对位表 ∕ 孤儿 ∕ 上提计划 ∕ 未核面）✓ ② 每行实读证据 + 处置 ✓ ③ 「立即落」与「归批」分立（2.4 ∕ 2.5）✓ ④ §2 落盘 ✓。
- **关键决策**：① 交付形态 = §2 自持（不另立设计档——R3 先例）；② 状态五值 ∕ 处置四值口径（2.0）；③ 证据三级标注（实读 ∕ 批档 ∕ 原引——证据诚实面）；④ annex 零触（勘误走 2.6）。

### 2.8 承 §1.2（04:25 全修裁定——批内落档期间到场）口径映射（零新语义）
- **衔接**：§1.2 定「未决行全修、零挂账；例外仅真端差候选（三件齐）」；本节 = 清账表与该裁定的转单衔接——本表 76 行落点分布（核销 ∕ 转单 B1–B7 ∕ 例外登记 ∕ 报告列）**无悬置行**。
- **归批表（2.5）= 转单底稿**：依赖序建议沿 §1.2——**B4+B7 小件横扫 → B2 队列族（卡面 :118 已落为先例）→ B1+B3+B5 VSC ∕ CLI 收口核 → 尾账改指**（半落行：VSC ∕ CLI 端改指 + 对拍锁重建）。
- **例外簇过表**：本表「登记例外」处（:34 ∕ :35 ∕ :75 ∕ :76 ∕ :77 ∕ :99 ∕ :116 ∕ :119 余 ∕ :120 ∕ :121）与 §1.2 例外面（宿主 ∕ 平台 ∕ 产品模型面）大体吻合；其中 **:34（端胶水）** 与 **:116（i18n——在册已裁定）** 需按三件齐复核（F7）。
- **F7**：例外登记行按 09-28 18:57 口径逐条补「宿主面实证」；三件不齐者随全修入单。

### 2.9 承派单修订 · annex §3「真端差候选 7 条」重审（不得以「已成文」当例外）
- **重审判据**（用户裁定在案）：**用户可见端差 = 缺陷；唯一例外 = 宿主能力面（差异受某能力约束、仅一侧具备），须逐条实证；「登记后保留」已废**。每条 = ① 宿主约束部分（点名能力 ∕ 为何只此一侧）＋ ② 非宿主约束部分（载荷契约 ∕ 策略 ∕ 词键 ∕ 值面 ∕ 结构面——一律判入全修）。
- **随动**：本节修订 2.2-A 的 :75 ∕ :76 ∕ :77 ∕ :83 ∕ :99 ∕ :119 ∕ :120 处置（以本节为准）；归批表增补 B8–B10。

| §3 条 | ① 宿主约束部分（保留——实读点名） | ② 非宿主约束部分（→ 全修） | 落点 |
|---|---|---|---|
| ① window ∕ main ∕ host-floor | Electron 壳本体：单实例锁（main.mjs:70 `requestSingleInstanceLock`）· 原生菜单（window.mjs:65 `Menu.buildFromTemplate`）· 隔离三件套（window.mjs:114 contextIsolation ∕ sandbox ∕ nodeIntegration=false）· 宿主内置 Node 下限+sqlite 探针（host-floor.mjs:9/:29——Electron 捆绑运行时）——均 Electron API ∕ 运行时独有 | 逐条核过：无载荷 ∕ 策略 ∕ 词键 ∕ 值面残留 ⇒ 零全修项 | 登记例外（宿主） |
| ② protocol.mjs | `app://` 特权 scheme 注册 ∕ `protocol.handle` 供给（Electron 独有 API；VSC 供给由宿主 API 承载） | 供给策略值面（白名单 ∕ MIME 表 ∕ 逃逸门序）仅本侧消费、无跨端对位物（供给=基座非用户可见）⇒ 并入宿主约束链 | 登记例外（宿主） |
| ③ ipc.mjs | Electron IPC 传输（ipcMain ∕ preload 白名单注册——ipc.mjs:23/:55 CHANNELS 单源） | **载荷契约面**：通道名 ∕ 载荷形逐通道对位 VSC panel-messages ⇒ **全修** | 归批 B8 |
| ④ notify 平台落子 | 系统通知构造（Electron `Notification` ∥ `vscode.window.showInformationMessage`——两侧宿主 API） | 策略 ∕ 两档判据 ∕ 词键（已在 core notify-policy.mjs）+ **desktop 增档②「子任务完成」去留裁** ⇒ 全修 | 归批 B4 |
| ⑤ projects ∕ sessions ∕ session-actions | 无（模型面非宿主） | 「多会话标签+左列」模型 = **收编在跑（非例外）**：R13-A 左列三档裁撤 + VSC 形会话控制落（批档 §5.16/§5.17）；尾账 = 三档残余逐面核 | 核销（收编）＋尾账 B9 |
| ⑥ 设置面 ∕ 对话流 UI 全族 | 无实质（窗口 ∕ 菜单等壳面归条①） | **不得整体作例外**——逐面重审：用户可见 ⇒ 对齐（在跑线 R7 ∕ R10 ∕ R11 ∕ R12 ∕ R13 已落大半）；内部重复（结构面）⇒ 同全修——余面逐面对位 | 归批 B10 |
| ⑦ host-floor ∕ 冒烟读数 | 壳冒烟探针本体（Electron 启动 ∕ 下限自检——main.mjs 启动序 ∕ host-floor.mjs:21/:40） | 冒烟读数口径（断言值域 ∕ 阈值——与 CLI ∕ VSC 发布面可对照处）⇒ 全修（发布面收口） | 归批 B10 |

- **余例外簇随动**（同判据续审）：:34（端胶水=结构面——三端结算径重复 ⇒ 并 B1 审）· :35（通道=宿主；**载荷契约面随 B8**）· :116（i18n——在册 D1 裁定「容器归一 ∕ 投影端差」：容器已归一；投影端差如用户可见 ⇒ 随 B10 复核）· :121（VSC-only 宿主特性逐档实证：editor-context ∕ file-refs 等受 VSC 编辑器能力约束；loop-sampler ∕ stop-trace 等非约束者随 B1 并审）。
- **归批表增补**：**B8**·IPC 载荷契约对照（§3③ + :35）· **B9**·会话模型尾账（§3⑤）· **B10**·UI ∕ 发布面余面逐面对位（§3⑥⑦ + :99 ∕ :120 随动）。

## §3 设计评审（评审子代理）
## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
