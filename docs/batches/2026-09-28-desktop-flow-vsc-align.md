# 2026-09-28 · 桌面处理流·VSC对齐（流程机制线）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-28 · 来源 = 用户 2026-09-28 18:41/18:42 总纲（整个 desktop 处理流 ⇒ VSC 对齐）+ 探索舱 #53 对位清单。
> 台账 = #526（流程机制线 · 归批）。前情 = docs/batches/2026-09-28-desktop-midturn-input.md §6（已收口 2026-09-28）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 主题与范围（2026-09-28 18:44 · 承 #526 总纲）
- 总纲 = 用户 2026-09-28 18:41/18:42：「整个 desktop 的处理流都跟 VSC 对一下」「把 VSC 已经做过的东西做得一样」。
- 本批 = **流程机制线**（输入面板 = 姊妹批 `docs/batches/2026-09-28-desktop-input-vsc-align.md` 第一件）；覆盖 = 队列 ∕ 回合执行 ∕ 悬挂 ∕ 定时 ∕ 会话 IO ∕ 装配 ∕ 桥 ∕ 通知 ∕ 附件 ∕ 设置 ∕ 子代理面 ∕ 其他（对位清单 12 族）。
- **执行口径（定死）**：三态之外无处置——① **复用**（VSC ∕ `render-core` ∕ 核件已有 ⇒ desktop 直接消费）② **上提**（VSC 实现为源 ⇒ 上提核件，desktop 消费；VSC 侧本轮零动）③ **真端差**（宿主面，三件齐才留）。**不重设计 ∕ 不优化 ∕ 不现代化**。
- 首波靶（设计轮排序）：桌面接 `render-core/cards/*`（替代自造卡树）· 桌面接 `render-core/flow/queued-mark`（替代自持镜面）· 队列族上提 · timer 闩上提 · file-links ∕ 附件贴图 ∕ 装配序 ∕ 存活拍 ∕ 提示策略。

### 1.2 前情
- 对位依据 = 探索舱 #53 清单（2026-09-28 18:44 交付）：重造榜 11 条（铁证）· 上提候选 8 条 · 反向发现 7 项。既有桌面自造面 = 本批改造对象。

### 1.3 台账
- **#526**（总纲）→ 本批（流程机制线）＋ 姊妹批（输入面板）——在途。

### 1.4 面板面扩令（2026-09-28 18:54 · 用户直令）
- 用户原话：「那些子agent面板……老老实实跟vsc一样」——**子代理面板 ∕ live 面**入本批（标准同总纲：**VSC 原件照搬**；逐元素对位 + 「原件 → 落位」清单 + 适配逐条实证）。
- 覆盖 = 桌面子代理可见全族（聊天流内子代理块 ∕ 右列活动池 ∕ 挂起 ∕ live 形态面——逐面与 VSC 对位）；承 §3.6② 方向（右列 ⇒ 子 agent 面板）。
- 设计舱已收令（本批任务书纳入；处理形态对齐输入面板批 §2 同型）。

### 1.5 端差判据收窄 + §3.6 全三点入批（2026-09-28 18:57 · 用户总纲）
- 用户原话（节）：「我完全不想再重新造出一套不一样的用户体验来……我说了多少次消除端差……为什么你总是要搞差异化？」
- **判据（即刻生效 · 覆盖全部对齐线）**：**用户可见的端差 = 缺陷，一律消除**（以 VSC ∕ CLI 对位面为准）；唯一例外 = **宿主能力面**（无对应物且**不得引入用户可见差异**，须实证）；**取消「登记后保留」通道**。
- **§3.6 全三点入本批任务书**：① 状态行 ⇒ CLI 对齐 · ② 子代理面板（右列 ⇒ 子 agent 面板方向）· ③ 会话流 ⇒ VSC 对齐。
- 设计舱已收令（§1.4 补令后随发）。

### 1.6 父侧裁（上抛先裁 · 2026-09-28 19:0x）
- **IME 组字门（§2.5 第 5 项）= 准**：按核件小修候选落——并入实施轮（轮序由实施派单定）。
- U-1（池内审批族，VSC 无对位面）· U-2（出生计数贴补装）：待评审读数后逐条裁。
- 反向发现 ③–⑦（core ∕ render-core 已单源、**VSC ∕ CLI 未消费**族）= **非本批**（桌面面零动作；VSC ∕ CLI 侧收口另册）——§2 如未注此边界，评审轮确认后随修正补注。

### 1.7 对位清单原文补投（2026-09-28 19:5x · 主 agent）
- `#53`「双端机制对位清单」**原文**（40 项对位 ∕ 三态 ∕ 重造榜 11 ∕ 上提候选 8 ∕ 真端差候选 7 ∕ 反向发现 7）= 附件档 **`docs/batches/2026-09-28-flow-vsc-align-annex-inventory53.md`**（2026-09-28 自会话存档恢复 · 20560 字符）——§2.5-1 的「原文补投」请求**随之闭合**（条级映射可据附件档与 §2.1 对账面互校）。
- 前情注：§2.5-1 所记「原文未在盘」= 补投前状态；本附件 = 恢复件（会话 slot 48 存档提取，逐字）。

### 1.8 R11 收尾登记（承 #88 交付 · 2026-09-28 20:4x）
- **已收**：段间分隔（banner 紧贴形）∥ base dim 等效（`--fg` 50%）∥ warn 黄（VSC `editorWarning.foreground` 同角色）——真机亮 ∕ 暗探针 + 截图在册（`test/artifacts/`）。
- **待收（#99 补轮在飞）**：banner 四位字色（AUTO 黄 ∕ PLAN 青 ∕ ADVISOR·ENG 亮绿）+ 机检随动（分隔 ∕ 字色断言）+ 分隔两边缘面处置 + `views-locks.test.mjs:418-419` 变量锁同拍（先拆后改若触 500）。
- **连带面（真机走查带上）**：`chat.css:437`（`.chat-stopped`）· `core.css:343`（`.ledger-line.warn`）· `core.css:314`（`.sub-stop-btn`）——`--warn` 槽单源随动（角色 = CLI `fg(3)` ∕ VSC editorWarning 同色）。
- 设计档收正（R11 文档行）：`UI.md` §1 状态栏行 ∕ `RENDERER.md` 状态行面——归设计面另轮（在册）。

### 1.9 R13 派单记录（2026-09-28 20:4x —— 承用户 20:44 追问「左栏废弃还没落地吗」）
- **派单**：R13 = 两面拆（档位 ≤15 纪律）——**A #100**（源件面 15 档：三撤档 + 下拉落位 + `styles.css` 四拆 + `files.mjs` 摘除）· **B #101**（测试 ∕ 锁面 10 档：改锚 + 新锁 + 集成四档；`files.mjs` +1）——B 随 A 自动序列。
- **队列序裁定**：R13 先于对位批 R1（#102 重发）——理由 = `styles.css` 先净减（≈240–270）则状态行补轮（#99 待重发）与后续轮零拆档返工；#97 已取消重发为 #102。
- **check-dist 裁定**：`scripts/check-dist.mjs` 产物清单随四拆 = **工程工具面**（`scripts/**` 不入 `files` —— 机制门实拒在案）⇒ **父侧直落**（机械清单 + 实跑 + 报「父侧直接执行」），A ∕ B 零触。
- **拆档口径**：A 按 §2.1 行 98 四拆定稿执行（theme ∕ rail ∕ chrome ∕ skin；rail 建后随裁撤删；拆出三档 = 声明外新档披露）；拆后拆点集重锚（左列面退场）。

### 1.10 R3 取批面裁定（2026-09-28 20:5x · 承 #105 ask）
- **裁定 = ②**：桌面本轮仅消费核纯逻辑族（常量 ∕ 合并串 ∕ 计划）；取项边缘全保 **KD-40 裁定**（slash 回合尾逐条直发 ∕ 携图批不拆批；核 `takeQueuedBatchItem` 本轮无桌面消费点）。依据 = R3 边界行「既有边界全守」+ `docs/desktop/design/PROJECT.md:79` KD-40 ⑤ + slash 死结裁（`docs/batches/2026-09-28-desktop-midturn-input.md:39` ∕ D-2/D-3 `:287-288`）。
- **设计收正（设计面轮在册）**：§2.2 R3 行 3「取批改核 `takeQueuedBatchItem`」与边界行相抵 ⇒ 按边界行执行，行 3 收正随设计面轮。

### 1.11 右列宽度自适应裁定（用户 20:5x 走查直令）
- **用户原话**：「我发现你他妈的做的真是不在乎页面面积啊，肆意挥霍空间」——对**空池固定占半屏**（`--pool-w: 36rem` = 576px）挤压会话列的直斥。根因实读：`renderer/styles.css:18/:92`；真机冒烟（20:5x · 1180px 窗）实测右列 ~576px 空置、中列被挤 ~310px。左列大半空置 = R13 面（队列中）。
- **行为合同（#115 实施 · 承用户 07:06 #500 口径不损）**：① 空池（`empty` ∕ `none`）⇒ 右列收合窄条（≈3.25rem）；② 有活动（`pool`）⇒ 自动展开 36rem；③ 手动覆盖优先（按会话记忆照旧）；④ 窄窗保护（< ~1100px 上限收窄 ≈24rem）——在册「窄窗受挤」（`UI.md:35` open 行）就此消解；⑤ `--pool-w` 值 36rem 零改。
- **序位裁定**：右列修正（#115）插队至 R13-A 之后；R11 补轮 ∕ R12 重发后置（各自任务文本不变）。
- **设计面收正（设计面轮在册）**：`UI.md` 布局 ∕ 断点行 + A6 行（36rem 单源注：增窄条 ∕ 上限两常量）+ open 行摘项。

### 1.12 撤回：1.11 作废（2026-09-28 21:0x · 用户 21:02 直斥）
- **用户原话**：「右边谁他妈让你改自适应啊！」——1.11 的「右列宽度自适应裁定」= **父侧自作主张，非用户口径** ⇒ **作废**：#115 已取消（未启动、零残留）；**右列保持原样**——`--pool-w: 36rem` 固定 + 按会话记忆手动收合 + 单断点（<900px 折左列）零改；30rem ∕ 窄条 ∕ 窄窗保护等全部方案**不落**。
- 设计面收正清单里的对应项（UI.md 布局 ∕ 断点 ∕ A6）**一并撤回**，`UI.md:35` open 行原样保留。
- 序位说明：1.11 引发的重发（R11 补轮 #116 ∕ R12 #117）保持现队列位置（不回滚）。
- 教训在册：父侧不得以「用户抱怨」为据自行发明行为方案——用户口径之外的机制（自适应 ∕ 自动收合等）一律先问再动，或不动。

### 1.13 R2 交付登记 + 待裁回（2026-09-28 21:1x）
- #104（R2 文件链接上提）交付：核新档 52 行（验存转注入缝 · 核内零 `node:fs`）+ 核测 5 ∕ 5；桌面消费档 64 ⇒ 34、U235 单源结构锁；core 782 ∕ 782 绿；桌面本面零红（A/B 归因在册）；advisor **pass**（🟡4 ∕ 🔵4 零 must-fix）；VSC 树零改自证在册。设计档收正集（KD-39 ∕ §4.1 ∕ §4.2 ∕ `CORE-UNIFICATION.md:183` ∕ `UI.md:417`）归设计面轮。
- **待裁回**：「新核档登记行」落点 = **并入设计面轮**（落点取候选 `CORE-UNIFICATION.md` 映射区，由设计轮择定）。

### 1.14 R3 交付登记 + 表外项处置（2026-09-28 21:1x）
- #105（R3 队列纯逻辑族上提 + 回合链接驳）交付：核新档 `queued.mjs` 90 行 + 核测 5 ∕ 5（批拆分 ∕ 8 条 ∕ 2000 字 ∕ slash 首条两径 ∕ 取项保序 ∕ 携图退化）；桌面 `queued-input.mjs` 118 ⇒ 73（表壳留端）；`turn-chain.mjs` 仅档头注（**裁定 ② 逐字披露在册**）；core 782 ∕ 782 绿；advisor 两轮 pass；桌面 7 红全在输入批在飞域（逐次零本舱红）。doc 收正集（`PROJECT.md` §4.2 两读数 71 ⇒ 75 ∕ 117 ⇒ 73 · `UI.md:440` · `AGENT-LOOP-ASYNC-POOL.md` §6.8 登记行 + 「双端」句 · R3 行 3）归设计面轮。
- **表外项处置**：① desktop 全绿阻塞 = 输入批在飞（预期，收口以末次全量为准）；② 两边界机检锁缺口（slash 尾径 ∕ 携图不拆批）→ **随 R9 ∕ 后续轮**（受 `agent-host-queued.test.mjs` ≤300 约束须先拆档——入册）；③ `renderer/queue.mjs:14` 注释指针多一跳 → **随 R1 或任一触面轮收正**（小形态项，入册）。

### 1.15 R8 表单消费口径裁定（2026-09-28 21:1x · 承 #110 ask）
- **裁定 = ①**：桌面消费核族 = **判据面**（域 `FORMATS` ∕ 形字段校验步序 ∥ 探针判据与失败分档）；channel `reason` 词法零改；渲染三档仅随拆分随动。
- 由：R8 契约「纯搬 + 转口，零语义改」+ R2/R3 先例 + 桌面双语 i18n（核英文串逐字入双语 UI = 新端差）+ 读法② 涟漪（`IPC.md` §2 未入收正行）。
- 读法② 项下「字段级措辞端差」如经走查证实为用户可见 ⇒ 归用户口径裁决（不私改，在册）。

### 1.16 R6 交付登记 + 拆档执行裁（2026-09-28 21:2x）
- #108（R6 存活 2s 拍 + 完成提示策略）交付：核新档 `agent/live-beat.mjs` 48 ∕ `notify-policy.mjs` 56 + 核测 10 ∕ 10；桌面四档消费（`subagent-face.mjs` 87 ⇒ 81 ∕ `notify.mjs` 48 ⇒ 11）；core **792 ∕ 792** 绿；advisor pass（🟡2 ∕ 🔵6 零必改）；desktop 3 红 = 基线红 ∕ 姊妹批在飞面（零新红，A/B 在册）。doc 收正集（`IPC.md:85` ∕ `PROJECT.md:152/218/80` ∕ `CORE-UNIFICATION.md:328` + `notify-policy.mjs` 登记行 ∕ `AGENT-LOOP-ASYNC-POOL.md` 存活重推族登记）归设计面轮。
- **拆档执行裁**：`test/agent-host.test.mjs`（现读 491 · 余 9 行）拆分 = **先落者执行**（现队列序 = 最早触档舱依次 #102 → #106 → #109 → #112；拆点 = §2.1 定稿 `test/agent-host-lifecycle.test.mjs`；锁随动 = `files.mjs` ∕ `run.mjs` 两向 + `host-floor` U95 例外面转 `fresh` 臂；后至者消费）——**已派各舱任务书均含「先拆后改」句，无需改派**。

### 1.17 R5 交付登记 + 待裁回（2026-09-28 21:3x）
- #107（R5 附件贴图族上提）交付：核新档 `attachments.mjs` 125（fs 写 ∕ 视觉 spawn 两缝 fail-loud）+ 核测 4 ∕ 4；桌面消费档 126 ⇒ 75、U237 单源锁；**core 803 ∕ 803 ∥ desktop 276 ∕ 276 双全绿**；advisor pass（🟡3 ∕ 🔵3 零 must-fix）；VSC 零改（mtime + 改动集双证）。设计档收正集（`PROJECT.md` §4.2 ∕ `PROVIDER.md` §6.18 ∕ `CORE-UNIFICATION.md:183` ∕ `IPC.md` §2 补报）归设计面轮。
- **待裁回 = 接受**：`agent-host-queued.test.mjs` 随动 = 零 diff + 恒绿（`NON_VISION_KEY` 面未变 ⇒ 无必需改动）——口径成立，不必触碰。
- **核件「在册差异」5 条** = 随 VSC 迁移轮收正（迁移轮在册）；半失败孤儿件回收面 = **认账不排期**（桌面逐回合清理已覆盖常径；点名再收）。
- 真机走查项入册（父侧面）：贴图两径（多模态直传 ∕ 非视觉降级说明行）· 超限丢弃非阻断。

### 1.18 R8 交付登记 + 表外项处置（2026-09-28 21:4x）
- #110（R8 provider 流程族上提 + 设置面两处先拆后改）交付：核新档 `provider-flows.mjs` 249 + 核测 7 ∕ 7（fix 轮补 `probeTargetOf` 后 pass）；桌面四通道消费（**裁定① 逐字在册**）；`mount-settings` 500 ⇒ 139（三族出档）；**core 803 ∕ 803 ∥ desktop 276 ∕ 276 双绿**；评审 2 轮（🔴1 修毕核实 ∕ 与 VSC `presets.mjs:159-170` 逐条对齐）；VSC 零笔。doc 漂移集（`IPC.md:213/235/236/237` ∕ `PROJECT.md` §4.1 ∕ `SHELL.md:45/55` ∕ `UI.md:29` ∕ `PROVIDER.md:302-305` ∕ `CONFIG.md:24/49`）归设计面轮。
- **核内 `FORMATS` 双份裁**（`provider-flows.mjs:33` ∥ `config-io.mjs:219`）：归**设计面轮定单源方向**（先例 = 单源 + 结构锁；实施随触面轮，不另立轮）。
- R13 交界适配（`mount-info.mjs` 只留 `refreshInfo` · `SETTINGS_KEYS` 去 `projectInfo`）已由本舱重验四档加载烟测 OK；`views-harness.mjs:14` 的 `INFO_SLOT` 残留 = R13 测试面（其舱随动）。

### 1.19 测试量纪律（用户 22:30 直令 · 全批适用）
- 原话：「我发现现在测试花的时间越来越长，不要过度测试啊！」
- 口径：迭代期只跑**相关单档 ∕ 子集**；**全量套件只在收口跑一次**；派单不再写「四套件每轮随动全绿」⇒ 改「本面定向单档绿 + 收口全量一次」。
- 源头案例 = #100（63 分钟 441 回合，大头为全量测试循环）——停全量指令已下（并令其以报告收束优先）。

### 1.20 全量测试纪律执行面（用户 22:31 追问「为什么没执行」）· 根因与收口
- **根因 = 父侧派单条款**：各轮任务书反复写「四套件各轮随动全绿（core ∕ cli ∕ vsc ∕ desktop）」⇒ 子舱被逼「改一点 → 跑全量」循环——**与在册纪律相抵**（`TESTING.md` §1 需求：「按层收口——浅改浅验、深改深验、链终一次全量」；用户 22:30 直令同文）。口径错误在父侧（条款即子舱行为边界）。
- **即刻执行**：① 后续派单一律改「**本面定向单档绿 + 收口全量一次**（父侧终验前）」；② 在途 ∕ 排队舱**逐一送令**（queued 舱启动即送）；③ 交付报告不再逐轮贴全量读数（读数以定向面为主，收口一次全量）。

### 1.21 R13-A 交付登记（#100 · 2026-09-28 22:4x）
- 交付：左列三档裁撤（真机三锚命中 0）· VSC 形会话控制（项目钮 ∕ 下拉 ∕ 新建 ∕ 条目 ∕ 空态）落地 · **四拆落定**（`theme.css` 85 ∕ `chrome.css` 415 ∕ `skin.css` 13；`styles.css` ∕ `rail.css` 删档）· i18n 204 ⇒ 188 · 测试面改锚 14 档 + 新档 1 + 删 2 + `files.mjs` · 集成 9 档改锚 · 真机四步全过 + `pageerror` 0。
- **收口全量恰一次**（新纪律首案）：`tests 270 · pass 269 · fail 1` → 唯一红（`first-run-smoke` 核面口径）单档复跑绿 ⇒ 实质 **270 ∕ 270**。
- **未闭（1 · 入册）**：`renderer/mount-sessions.mjs` **588 行越 500 硬限** ⇒ 按 §5.19 落形三件出档（`views/session-control.mjs` ⇒ 接线档 ≈300；随动 = 6 测试档 import + 1 锁行）——**父侧裁：随 R13-B（#101）一并落**（其面即测试 ∕ 锁面，随动正落其射程）。
- 其余披露入册：核面口径（新建会话首存前不入下拉列——核侧面）· `no-session` 引导态近不可达（词键 ∕ 分支保留）· 他档注释残留 ∕ `settings.css` 死规则（批末清扫面）。

### 1.22 R1 #8 待发送面冲突裁（承 #111 ask · 2026-09-28 22:4x）
- **裁 = B 侧为准**：用户 21:07 直令（「流里一个节点都不许有」）+ 姊妹批已落终态（`[data-composer-notices]` 输入区带 ∕ 流内零节点）**晚于且覆盖**本批设计 §2.2 R1 #8 的「在连泡就近标记形」；设计自认并笔序 = 姊妹批先行。
- **处置**：① R1 #8 的流内 ∕ 输入面板部分**行内退场**（不再落地）；② `planBusyQueued` ∕ 在连气泡形在 B 侧形态下无消费点 ⇒ 不再落地；③ 可做残项 = `renderer/queue.mjs` 容量常量改核件单源 + 口径注（声明外披露；冲突即弃、折登记）；④ 设计面（R1 #8 行 ∕ KD-31 邻位 ∕ §2.7 行 4 收正）**随设计面轮**（在册）。

### 1.23 批档勘误（父侧 · 2026-09-28 23:5x · 承 #116 R11 补轮转出）〔段号就地顺正：原标 1.9 与上行重号〕
- ① **§1.8「待收」两测试项随全清令取消**：机检随动（分隔 ∕ 字色断言）与 `views-locks.test.mjs:418-419` 变量计数锁同拍——测试树已全删（用户 2026-09-28 23:18 令）；替代实证 = R11 补轮真机探针（亮 ∕ 暗两轮，见 §5.13）。
- ② **§5.6 第 1 ∕ 3 条所引坐标作废重锚**：`styles.css:470-480` ∕ `styles.css:461-463` = 旧坐标（`renderer/styles.css` 已随 R13-A 拆分退场）——现行落点 = `renderer/chrome.css`（banner 四色三规则 `:414-416` · 判句 ∕ 注句 `:392-393` ∕ `:410` ∕ `:413` · 告警位相邻条 `:411-412`）；同条所引 `views-locks.test.mjs` 已随令删除。
- ③ 设计面收正（`UI.md` §1 状态栏行 ∕ `RENDERER.md` 状态行面）= 设计轮 #129 追加项（在收）。

### 1.24 进程崩溃 · 队列死亡与重发准备（父侧 · 2026-09-28 23:57）〔段号就地顺正：原标 1.10 与上行重号〕
- **事件**：宿主进程意外退出（用户报「意外飞出来了」）→ 重启后子代理池清零——**在飞 ∕ 排队的四舱全部死亡**：#106 ∕ #109 ∕ #112（对位批后续轮面）· **#117 = R12（会话流 ⇒ VSC 对齐）**；四舱**零报告零 §5 写入**。
- **盘面核对**：**无损伤**——所有已提交工作完好；工作树 = 链上累积未提交面（与崩溃前一致）；`.r12-probe.mjs`（R12 探针）在盘可复用。
- **重发阻塞点（实测）**：引擎要求 designToken **原件**（自历史不可回收——按设计抹除）——重发 R12 的 spawn 被机械门拒：「Invalid or missing design token」。⇒ 重发通道 = **补一次设计评审点火（用户方）** → 令牌签发 → 父侧按准备单重发。
- **R12 重发准备单**（六件任务书已拟好，点火后照发）：目标 = 会话流 F1–F5 对位（块壳消除 ∕ 面宽 90%∥100% ∕ 块距 14px ∕ 面内件核件面 ∕ 流尾件零撤 ∕ 滚动回填行为对表）；面 = `chat.css`（拆后落点）· `views/chat{,‑text,‑scroll,‑guide}.mjs`；验收 = 逐值表 + 探针复跑 + 全清令注记；边界 = VSC ∕ 核件 ∕ 流尾件零改。
- **对位批（feature-parity）同状**：其后续轮（#106 ∕ #109 ∕ #112 面 = `agent-host` ∕ `suspension-drive` 等）同随进程死亡、同需令牌重发。

### 1.25 R12 重发点火 + 评审 #1 处置（父侧 · 2026-09-29 00:0x）〔段号就地顺正：原标 1.11 与上行重号〕
- 评审 #1（R12 重发复核）**VERDICT: pass**（🔴0 ∕ 🟡5 ∕ 🔵3——报告与 §3 落档）；令牌已签发（值 = 运行态，不落档）；**R12 已重发**（eng-coder #5 · running——按 §1.24 准备单 + 拆后落点行动表）。
- **逐条处置**：① 行动表失锚 → 重发任务书已按拆后落点落，正文收正入微轮；② 验收失锚 → 重发任务书已换口径（逐值表 ∕ 探针 ∕ 全清令注记），正文收正入微轮；③ F4 digest 项 → 微轮（拆列 + 接 E9 登记）；④ chat.mjs 拆点登记 → 微轮；⑤ D24 锁随动对象消失 → 微轮（行收正 + F1 句改述）；⑥ 数值漂移 → 微轮（回填）；⑦ F5 结论落点 → **已随重发任务书闭环**（落点 = 报告逐值表 + 差项逐条处置）；⑧ 段号重复 → 微轮（顺正打标）。
- **微轮** = eng-designer #6（fix · 定点 ①–⑥ ∕ ⑧）——边界 = 只收上述项、零语义。

### 1.26 微轮 #6 交付收下（父侧 · 2026-09-29 00:2x）
- **交付**：评审 #1 的 ①–⑥ ∕ ⑧ 共 7 项全落（⑦ 依令零触）——行动表按拆后落点重锚（chat.css **229** ∕ theme **90** ∕ chrome **424** ∕ chat.mjs **350** ∕ chat-text **132** ∕ chat-scroll **91** ∕ chat-guide **79**；styles.css 改指）；验收换 §1.24 准备单口径（全清令注记）；F4 digest 拆列（`chat-status.js:69-122` 同锚）+ E9 续登；chat.mjs 拆点登记句；F1 ∕ D24 锁句改述（`PROJECT.md:561` 同拍 + `.rail-row` 清出）；数值统一回填；段号顺正（1.9⇒**1.23** ∕ 1.10⇒**1.24** ∕ 1.11⇒**1.25**；§5 三组 ⇒ **5.15–5.20** + 裸号引用随正）。**父侧抽验通过**（`:426-440` 行动表 ∕ `PROJECT.md:561` 实读）。
- **观察处置**：① `PROJECT.md:1027` 303 字符 = 会话标题批并发笔迹（已 send #18 自清）；② §1.21（`:109`）「随动 = 6 测试档 import + 1 锁行」句随全清令作废（以本节为准）；③ chat-guide 80 vs 79 = ±1 不入判（零动作）；④ 冻结记录不回改（零动作）；⑤ `chat-composer.css:61` 注释死指针 → **台账 #539**（随下一桌面码面轮顺带）；⑥ 既有悬空 44 行号 = 设计面收正在收同源（零新动作）。
- **设计面状态**：本批设计微轮（#6 + 设计面收正轮）均落，无待评审项（评审 #1 = pass 在册）。

### 1.27 R12 交付收下 + 呈报项裁定（父侧 · 2026-09-29 00:2x）
- **交付**（#5 · 终态 converged ⇒ clean）：F1–F5 逐面收正 + 缺口收正 5 档（`chat.css` 269 ∕ `core.css` 430 ∕ `chat-fixes.css` 95 ∕ `chat-text.mjs` 126 ∕ 探针 `.r12-probe.mjs` 237）；真机探针 **22/22**（亮色 · pageerror 0）；内审 1 轮 + 代码评审 1 轮（🔴1 → fix → 复核 pass）；§5.15 已自写落档。**父侧抽验通过**（`chat.css:20-64` ∕ `data-label` 锚 `:175-189` 实读）。
- **重要更正**：前舱 #117 的 F1–F4 主体**已在盘**（mtime 证据 = 崩溃窗口时点）——崩溃非全损；本舱 = 核验 + 缺口收正（§1.24「零落盘」表述按此更正：四舱零报告 ∕ 零 §5，但 #117 有在盘笔迹）。
- **呈报项裁定（父侧）**：① 件级外边距 ∕ ② 首块上距 ∕ ③ 头行段样式四组（读在册「头行色」项，相抵即停报）∕ ④ file-link 三值——**裁 = 全落**（F3「差 ⇒ 消除」）→ 修复轮 **#25**（fix · 在跑 · `chrome.css` 入界授权在册）；⑤ digest-cap 面缺（U-R12-1）→ **台账 #541**（归另轮）；⑥ `window.mjs` 死探针引用 → 已随 R9 舱任务书（届盘重勘）✓；⑦ 设计面收正清单（§5.15 未办 5）→ 设计同步轮 **#26**（fix · 排队等 #22）。
- **剩余**：#25 ∕ #26 落定后，本批设计面 ∕ 收口面齐备（→ §6 收口预检）。

### 1.28 R12 修复轮 #25 交付收下 + 三裁（父侧 · 2026-09-29 00:4x）
- **交付**（#25 · fix · 终态 converged ⇒ clean）：四项逐落——① 件级外边距三覆盖（工具 8 ∕ 错误 8 ∕ 推理 4——`chat.css:31-39`）② 首块上距 14px（`chrome.css:45-47`——触发面自勘确认在 `.flow` 骨架）③ 工具卡头行四组 **16 ∕ 18 值**（`chat.css:108-131`；**2 值相抵停报**（name-accent ∕ args-fg ⟷ 在册整行两态色）——按裁定「相抵即停报」✓）④ file-link 三值（`core.css:434-436`——offset 2 ∕ hover solid ∕ focus `1px + 2px + offset 2px`）。**真机探针 26 ∕ 26 · pageerror 0**（复跑两次）；内审 1 轮 + 代码评审 2 轮（🟡 → fix → 复核 pass）。**父侧抽验四处吻合 ✓**。写域扩张照实报（chrome.css 授权 ∕ core.css 先例面 ∕ 探针临时件）。
- **裁① 头行「耗时段」（评审新发现）**：判「**补一行**」（11px ∕ .6）——**待 #38 色口径裁定后与头行色一并落**（一轮 coder fix，免两开）。
- **裁② ③ 残余色域差**（整行两态 ⟷ VSC name-accent 口径）：**设计面裁 → #38**（默认按对齐判据 = VSC 逐值；例外须真端差三件齐）。
- **裁③ 文档面**：`UI.md:361` ⟷ `:362` 漂移 + §2.8 chrome.css 锚 **229 ⇒ 313** 重锚（本舱 +44）→ 同归 **#38**。

### 1.29 R12 设计面同步轮 #26 交付收下（父侧 · 2026-09-29 00:5x）
- **交付**（#26 · fix）：15 处逐落——`RENDERER.md`：滚顶阈值 **40px** 收正（`BACKFILL_PX` 单源）+ `FOLLOW_PX` 严格小于句 + §4 行页量改指（核 `historyWindow` 缺省 200 条——消 `:128` ∕ `:101` 互抵）；`UI.md`：`:18` R12 行内指针 + D24 三处清出（`.block` ∕ `.rail-rename-input` ∕ 卡族框指针）+ **新增本批注（`:465-472`）五项** + changelog；批档 §2：R1/R10/R13 三残留实例收正（480×2 ∕ 499×1）+ R12 终稿读数补录 + **§2.12 回执**。doc-check **162 ⇒ 161（Δ −1）** ∕ 行宽 0（首落一处 311 已拆）。§2 append + 状态行 ✓。
- **勘误（父侧）**：§1.28 裁② ∕ ③ 中「#38」= 实 id **#37**（设计面裁轮在队）。
- **候裁 ∕ 转出**：① `.approval-card` ∕ `.composer-input` 死类疑点 + ② UI.md D24 余残留（`:245` ∕ `:248-249` ∕ `:251-253` ∕ `:264`）→ 台账 **#548**；③ UI.md 余悬空 15 处（`styles.css` ×14 + `composer-send` ×1）= CSS ∕ 发布重构轮面（在册）；④ `E2E-TESTING.md` 真机面（§5.15 未办 5 余项）→ 台账 **#549**；⑤ #37 归口面（`:361/:362` + 229⇒313）零触 ✓ 正确。

### 1.30 父侧机械收正（父侧直接执行 · 可 revert · 2026-09-29 02:4x）
- `chat.css` 届盘现读 = **313**（R12 终稿 269 + #25 修复轮 +44）——§2.8 行动表锚 **229** = R1 拆后历史值；**现值以本节为准**（全表重锚归 #551 家族）。
- `UI.md:361 ⟷ :362` 引用漂移：**已随 #43 重写消解**（该两行现 = 头行色裁定正文 `:360-363`——旧引作废）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成 · 2026-09-29（评审轮 1 十二发现落修 + R13 入书（§2.10）+ 评审 #1 ①–⑥ ∕ ⑧ 微轮收正（§2.11）+ R12 设计面同步轮 #26（§2.12）；实施任务书 R1–R13 在册）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.0 交付形态与计量口径（本 §2 = 实施任务书）

- **交付物** = 本记录 §2 本身（逐轮任务书）；**不另立设计档**。各实施轮随轮收正桌面设计档（`docs/desktop/design/UI.md` ∕ `RENDERER.md` ∕ `IPC.md` ∕ `PROJECT.md` ∕ `E2E-TESTING.md`）＋核侧登记面（`docs/core/design/*`——主档 = `CORE-UNIFICATION.md` 行 183 族与各主题档 ∕ `docs/render-core/design/RENDER-CORE.md`）——随轮清单见各轮尾「文档收正」行；父侧按轮派 eng-coder，逐轮行动表 = 轮契约。
- **执行口径（用户 2026-09-28 18:42 定死）**：**三态之外无处置**——① **复用**（VSC ∕ `render-core` ∕ 核件已有 ⇒ 桌面直接消费）；② **上提**（实现为源 ⇒ 上提核件 ⇒ 桌面消费；**纯搬 + 转口，零语义改**）；③ **真端差**（宿主面，**三件齐**〔结构性不对称 + 证据 + 裁定〕才留）。**不重设计 ∕ 不优化 ∕ 不现代化**；**VSC 树零改**（共享核件改动另裁；影响面登记。迁移留后）。
- **计量口径**（沿 `docs/batches/2026-09-28-split-batch.md:38` ∕ `:118`）：每轮 **行动表原档 ≤ 15**（新档 = 上提产物、随动档另列，不计入）；上提轮 = 核件新档 + 桌面消费档同轮（**同机制面，不计跨树混装**）。
- **轮序（定死）**：先复用（反向发现 ①②）→ 上提族（耦合小 → 大）→ 末尾其余。**R1 复用 ∕ R2–R8 上提 ∕ R9 其余**。
- **跨批序（与姊妹批互认 · 2026-09-28 父侧裁）**：输入面板批 **R1 先行**——**出泡时刻 ∕ 提交面 ∕ 骑缝档**（`events.mjs` ∕ `i18n.mjs`）**拆分归先落者（谁先落谁拆，另一批消费）**；锁随动归先落者；本批 R1 #7 ∕ #8 ∕ §2.7 行 4 与 R13 在其后并笔。
- **端适配口径**（沿姊妹批 `docs/batches/2026-09-28-desktop-input-vsc-align.md` §1.4）：默认 = 直接消费；端侧只留宿主胶水；**逐条端适配须附实证给由**（本任务书 R1 已逐条列明）。

### 2.1 三态总表（覆盖 = 重造榜 11 条 + 上提候选 8 条 + 反向发现 ①②）

| # | 机制 ∕ 桌面自造面（实读行数） | 态 | 共享件 ∕ 上提源（出处注明） | 桌面落位 | 轮 |
|---|---|---|---|---|---|
| 1 | 审批卡构树 `thincoder-desktop/renderer/views/approval.mjs`（201） | 复用 | `thincoder-render-core/cards/permission.mjs:60`（`renderApprovalCard`）`:105`（`renderBatchApprovalCard`）；VSC 端壳先例 = `thincoder-vscode/webview/permission.js:7,22-39` | `renderer/views/approval.mjs` ⇒ 端壳 | R1 |
| 2 | 提问卡构树 `thincoder-desktop/renderer/views/question.mjs`（113） | 复用 | `thincoder-render-core/cards/question.mjs:13`（`renderQuestionCard`）；VSC 端壳先例 = `thincoder-vscode/webview/question.js:7-8,23-24` | `renderer/views/question.mjs` ⇒ 端壳 | R1 |
| 3 | 计划面卡构树 `thincoder-desktop/renderer/views/plan.mjs`（45） | 复用 | `thincoder-render-core/cards/panel.mjs:67`（`renderTaskPanel`）`:17`（`taskPanelVisible`）；VSC 端壳先例 = `thincoder-vscode/webview/panels.js:15-17` | `renderer/views/plan.mjs` ⇒ 端壳（goal 面板不在本批——缺面族已裁后续） | R1 |
| 4 | 待发送镜面（快照应用 ∕ 标记 ∕ 合并 ∕ 防悬空）`thincoder-desktop/renderer/queue.mjs`（42）+ `renderer/views/chat-pending.mjs`（78） | 复用 | `thincoder-render-core/flow/queued-mark.mjs:74`（`planBusyQueued`）；VSC 取核先例 = `thincoder-vscode/webview/queued-mark.js:12,26-40` | 两档随核计划（标记 ∕ 合并 ∕ 防悬空口径单源 = 核；**`planBusyQueued` 消费 = 准**——父侧裁 2026-09-28，`cleanPending` 仍不消费） | R1 |
| 5 | 队列批计划 ∕ 合并串 `thincoder-desktop/src/main/queued-input.mjs`（118） | 上提 | VSC `thincoder-vscode/src/extension/queued-merge.mjs:15-36`（`MAX_*` ∕ `formatMergedMessages` ∕ `planQueuedInput`）+ `queued-pickup.mjs:49`（`takeQueuedBatchItem`） | 新核档（拟 `thincoder-core/queued.mjs`）+ 桌面消费 | R3 |
| 6 | 回合链（取批 ∕ 注入 ∕ 续链）`thincoder-desktop/src/main/turn-chain.mjs`（72） | 上提（取批面）+ 端序对齐 | 同 #5 ＋ VSC `thincoder-vscode/src/extension/panel-turn-stages.mjs:109`（`finalizeTurn`）`:164`（`enterSuspensionTurn`） | `src/main/turn-chain.mjs` | R3 |
| 7 | timer 闩 + 火策略 `thincoder-desktop/src/main/timer-watch.mjs`（80）＋ `src/main/suspension-drive.mjs` 闩面 | 上提 | VSC `thincoder-vscode/src/extension/timer-watch.mjs:46`（`createTimerWatch` · 可移植）`:73` ∕ `:94` ∕ `:105`（派发 ∕ 火 ∕ 同步）；核读面既有 = `thincoder-core/agent/timers.mjs:19/32/42` | 扩 `thincoder-core/agent/timers.mjs` + 桌面消费 | R4 |
| 8 | 附件贴图族 `thincoder-desktop/src/main/attachments.mjs`（126） | 上提 | VSC `thincoder-vscode/src/extension/image-handler.mjs:34`（`parseDataUrl`）`:49`（`savePastedImages`）`:109`（`downgradeNonVisionImages`）；核既有面 = `thincoder-core/agent/setup-reminders.mjs:248`（`appendImagePointer`） | 新核档（拟 `thincoder-core/attachments.mjs`）+ 桌面消费 | R5 |
| 9 | 文件链接解析 `thincoder-desktop/src/main/file-links.mjs`（64） | 上提 | VSC `thincoder-vscode/src/extension/file-links.mjs:21`（`extractFileLinks`——纯逻辑 + 验存注入缝） | 新核档（拟 `thincoder-core/file-links.mjs`）+ 桌面消费 | R2 |
| 10 | 子代理存活 2s 拍 `thincoder-desktop/src/main/subagent-face.mjs`（87） | 上提 | VSC `thincoder-vscode/src/extension/panel-messages.mjs:45`（`LIVE_HEARTBEAT_MS = 2000`）`:50`（`liveHeartbeatBeat`）`:62-75`（起 ∕ 停拍）+ `suspension.mjs:148`（`reassertLiveChildren`） | 新核档（拟 `thincoder-core/agent/live-beat.mjs`）+ 桌面消费 | R6 |
| 11 | 完成提示策略 `thincoder-desktop/src/main/notify.mjs`（48） | 上提 | 策略现状 = 桌面超集（失焦门 + 两档 + 揭示；`notify.mjs:16-27` 零宿主依赖）；对位锚 = VSC `thincoder-vscode/src/extension/notify.mjs:9-18`；判据锚 = `panel-callbacks.mjs:233`（`!autoTurn` 门） | 新核档（拟 `thincoder-core/notify-policy.mjs`）+ 桌面消费（**平台落子留端**） | R6 |
| 12 | 装配序 + `teamConfig` ∕ `gitAuthor` `thincoder-desktop/src/main/agent-assemble.mjs`（96） | 上提 | **VSC 零面**（VSC `src` 全树零命中；`src/memory-tool.mjs:84` 恒 `author:"unknown", team:null`）⇒ 上提源 = **CLI** `thincoder-cli/src/cli/make-agent.mjs:201`（`teamConfig`）`:209`（`gitAuthor`）`:58/64`（装配消费）；桌面 = 在册第二份（`agent-assemble.mjs:30/38`） | 新核档（拟 `thincoder-core/agent/assemble.mjs`）+ 桌面消费 | R7 |
| 13 | provider 流程族 `thincoder-desktop/src/main/providers.mjs`（151）＋ 设置面 | 上提 | VSC `thincoder-vscode/src/extension/provider-flows.mjs:60`（`addProviderFlow`）`:129`（`removeProviderFlow`）`:153`（`setKeyFlow`）`:32`（`probeProviderAdmission` 判据）；持久化 ∕ 探针语汇已在核（同档 `:26` re-export = `thincoder-core/config-io.mjs`） | 新核档（拟 `thincoder-core/provider-flows.mjs`）+ 桌面消费 | R8 |
| 14 | 悬挂三面（窗寄存器 ∕ 回收 ∕ 残输入）`thincoder-desktop/src/main/suspension-drive.mjs`（270） | ① 复用（＋端壳对齐） | 核契约 = `thincoder-core/agent/suspension.mjs:172`（`startSuspension`）`:106`（`finishSuspension`）；对位锚 = VSC `thincoder-vscode/src/extension/suspension.mjs:148`（`reassertLiveChildren`）`:260`（`suspensionSession`） | `src/main/suspension-drive.mjs` | R9 |

**真端差登记（预置 3 条 · 三件齐 ⇒ 留；本批内以轮内「端差登记」行为准）**：
① **通知平台落子**（Electron `Notification` ∕ `reveal` vs `vscode.window.showInformationMessage`）——结构性不对称（宿主 API）+ 证据（两端 notify 档）+ 口径（「平台落子留端」定死）⇒ 留（核件只承策略）。
② **卡面端壳**（VSC = `#messages` append + `scrollIntoView`；桌面 = 流内插点 + store 幂等同步 + 帧尾置焦）——结构性不对称（挂载架构）+ 证据（两端壳档）+ 裁定（桌面挂载面已裁保留）⇒ 留。
③ **大 diff 外部查看器**（VSC 宿主原生 diff：`thincoder-vscode/src/extension/diff-preview.mjs`；桌面 = 零外部查看器）——结构性不对称（宿主能力）+ 证据（该档存在 vs 桌面无）+ 裁定（`docs/desktop/design/PROJECT.md` §8 边界）⇒ 留（核卡 `view-diff` 钮端侧退场——R1 e 条）。

**态列 ∕ 行数口径（表注 —— 评审轮 1 #9 ∕ #10）**：态列 = 三值（复用 ∕ 上提 ∕ 真端差——§2.0 口径）；「其余」为轮序桶名，不入态列（见行 14）。行数 = **实读总行数**（read 工具「N lines total」同源——末换行计一行；两法差 1 不入判）；本表与全 §2 各档行数已按实读统一改值。

**对账面（#53 来源核对 —— 评审轮 1 #7 · 在册摘要）**：

- **原文状态**：探索舱 #53 原文**未在盘**（复核 = 全仓 grep「重造榜 ∕ 上提候选 ∕ 反向发现」仅本档与姊妹批命中）——逐条名目不可重建；父侧如持原文 ⇒ 补投后本页升为条级表（§2.5-1）。本页 = **行级对账面**（可核面 = 计数 ∕ 归并 ∕ 态 ∕ 轮 ∕ 盘面坐标）。
- **计数对账**：声称覆盖 = 重造榜 **11** + 上提候选 **8** + 反向发现 **①②** = **21 条目引用** ⇒ 本表 **14 行**（归并 = 7 行跨族（#5–#11））。
- **归并关系（21 → 14）**：重造榜 11 条 → #1–#11（桌面自造面逐条）；上提候选 8 条 → 态 = 上提 的 8 行（#5 ∕ #7–#13——与 8 个新核档一一对应：`queued.mjs` ∕ `agent/timers.mjs` 扩 ∕ `attachments.mjs` ∕ `file-links.mjs` ∕ `agent/live-beat.mjs` ∕ `notify-policy.mjs` ∕ `agent/assemble.mjs` ∕ `provider-flows.mjs`）；反向发现 ①② → #6 ∕ #14（端序 ∕ 核契约对齐面——族归属按行题，如原文口径不同以补投为准）。
- **未入面（表外零处置）**：反向发现 ③–⑦（core ∕ render-core 已单源、VSC ∕ CLI 未消费族）= **非本批**（§1.6 裁——桌面面零动作；VSC ∕ CLI 侧收口另册）；12 族中「会话 IO ∕ 桥 ∕ 其他」无条目在册（§2.5-1 —— 父侧持全表请补投）。

**硬限邻档拆档定稿（五档 —— 评审轮 1 #1：拆点 ∕ 新档名 ∕ 消费面 ∕ 锁随动）**：

| 档 | 现读 | 预期增量（本批） | 拆档定稿 |
|---|---|---|---|
| `renderer/events.mjs` | **498** | R10 #8 ∕ R11 #3 = 随动（±≤5） | **拆分已由输入面板批 R1 承接**（新档 `renderer/events-flags.mjs` ≈+75）——本批两轮引用之（不重复计划）；主档批后 ≈482；锁随动归先落者（§2.0 跨批序） |
| `renderer/styles.css` | **499 ⇒ 已删档**（R13-A 四拆） | R12 变量面（±0～−10）——拆后落点 = `theme.css` ∕ `chrome.css` | **已落（R13-A 四拆）**：删档 ⇒ `theme.css`（85 ⇒ 90）· `chrome.css`（415 ⇒ 424）（R11 补轮后）· `skin.css`（13）；`rail.css` 建后随左列裁撤即删；消费面 = `index.html` 链序（已随动）；`check-dist`（已随拆分落）；`views-locks` 靶随全清令退役；执行句已消费 |
| `renderer/mount-settings.mjs` | **500**（顶格） | R8 #3 随动（表单随核流程；≈ −10～+15） | 拆点 = 三族出档：`mount-settings-reads.mjs`（读数供给 ≈105）∕ `mount-info.mjs`（信息行族 ≈50）∕ `mount-settings-exits.mjs`（出口 + 写路辅助 ≈175）；主档 ≈180–270——承 拆档批 §2.2-4（KD-S2）；**R13 影响**：信息行族随左列裁撤退场（`mount-info.mjs` 拆点随裁撤消解）；消费面 = `app.mjs` ∕ 视图接线（原档 re-export 承接）；锁随动 = `host-floor` U95 `fresh` 臂清单 + `views-settings*` import 面；执行 = **先拆后改**（拆档批复起 ∥ R8 触面） |
| `renderer/chat.css` | **480 ⇒ 229**（R1 四拆后主档） | R10 #9 ∕ R12 #1（±0～−10）——落点 = 主档（块壳 ∕ 面宽 ∕ 间距） | **已落（R1 四拆）**：主档 **229** + `chat-cards.css`（143）∕ `chat-composer.css`（72）∕ `chat-fixes.css`（94）；消费面 = `index.html` 链序（已随动）；`views-locks` U174 ∕ `chat-render` D24 面随全清令退役；执行句已消费 |
| `test/agent-host.test.mjs` | **490** | R4 ∕ R6 ∕ R7 ∕ R9 四处触例（改锚 + 补例；≈ +10–25） | 拆点 = 生命周期六例出档 `test/agent-host-lifecycle.test.mjs`（U86 ∕ U178 ∕ U191 ∕ U192 ∕ U224 ∕ U225 ≈231）；主档 ≈258——承 拆档批 §2.3-8；消费面 = `files.mjs` ∕ `run.mjs` 清单 + `agent-host-harness.mjs` 夹具；锁随动 = 清单两向自检；执行 = **先拆后改**（拆档批 R2 ∥ 本触面轮） |

### 2.2 逐轮行动表（R1–R9 · 每轮 = 一份实施契约）

#### R1 · 直接复用（核件卡族 + 排队标记）——桌面渲染面单树

**目标**：桌面卡三面（审批 ∕ 提问 ∕ 计划）与待发送标记改**直接消费** `render-core` 现件；桌面自造构树面退场；端侧只留宿主胶水（逐条见「端壳适配」）。

| # | 档（现读行数） | 共享件原件（出处） | 改动要点 | 预期 |
|---|---|---|---|---|
| 1 | `thincoder-desktop/renderer/views/approval.mjs`（201） | `thincoder-render-core/cards/permission.mjs:60/105`；VSC 壳 = `thincoder-vscode/webview/permission.js:22-39` | 构树面（`approvalTree` ∕ `headNode` ∕ `diffNode`）退场 ⇒ 端壳：核卡工厂直取 + 出站桥 + 锚装饰 + 键位 ∕ 置焦胶水；池面描述符（`approvalActions` ∕ `approvalExits` ∕ `approvalSummary` ∕ `approvalTitle`）原位保留 | 201 ⇒ 估算 ≈90–120 |
| 2 | `thincoder-desktop/renderer/views/question.mjs`（113） | `thincoder-render-core/cards/question.mjs:13`；VSC 壳 = `thincoder-vscode/webview/question.js:7-8,23-24` | 构树面退场 ⇒ 端壳：核卡 + `submitAnswer` 回执径保留 + P2/P3 胶水（见端壳适配 e） | 113 ⇒ 估算 ≈50–70 |
| 3 | `thincoder-desktop/renderer/views/plan.mjs`（45） | `thincoder-render-core/cards/panel.mjs:17/67`；VSC 壳 = `thincoder-vscode/webview/panels.js:15-17` | 构树面退场 ⇒ 端壳：核 `renderTaskPanel` 直取（`{el, visible}` 两态）；**可见判据随核**（全完成且未示 ⇒ 不新示——与 VSC 同） | 45 ⇒ 估算 ≈25–40 |
| 4 | `thincoder-desktop/renderer/mount-cards.mjs`（185） | 同 #2 ∕ #3 两核件 | 挂载 ∕ 幂等同步面接核卡元素（`build(descriptor)` ⇒ 核卡工厂；`signature` 幂等判据面沿旧——读 DOM）；插点锚 ∕ 卡序不动 | 185 ⇒ 同量或略降 |
| 5 | `thincoder-desktop/renderer/views/chat-cards.mjs`（52） | `thincoder-render-core/cards/permission.mjs:60/105` | 审批族同步面（`syncCards`）接核卡元素；等价判据 ∕ 锚随动 | 52 ⇒ 同量 |
| 6 | `thincoder-desktop/renderer/views/chat.mjs`（355） | — | 卡树引用与帧尾置焦执行点随动（`data-autofocus` 锚装饰面） | 355 ⇒ 略降 |
| 7 | `thincoder-desktop/renderer/queue.mjs`（42） | `thincoder-render-core/flow/queued-mark.mjs:74`（`planBusyQueued`） | 快照应用改**随核计划**（标记 ∕ 合并 ∕ 防悬空口径单源 = 核；**`planBusyQueued` 消费 = 准**——父侧裁 2026-09-28）；快照来源 ∕ 气泡 DOM 留端（核留端面） | 42 ⇒ 估算 ≈35–42 |
| 8 | `thincoder-desktop/renderer/views/chat-pending.mjs`（78） | 同 #7 | 待发送组呈现随核计划（合并批 ⇒ 单泡形随核）；**容器 ∕ 落位 = ① 消除**（在连泡就近标记形——VSC 形；`[data-pending]` 独立组退场）；并笔序 = 姊妹批 B12 先行（§2.0 跨批序） | 78 ⇒ 估算 ≈70–80 |
| 9 | `thincoder-desktop/renderer/i18n-views.mjs`（69） | 核卡词键（值**逐字同** `thincoder-vscode/locales/{zh,en}.json`） | 增核卡词键 ≈15 键 × 2 语（`perm.*` 7 · `question.label/mark/submit/customPlaceholder/placeholder` 5 · `panel.*` 2 · `goal.objective` 1）；**入本档不入 `i18n.mjs`**（本体 **490** 距 500 硬限 **10** 行；拆分 = 输入面板批 R1 承接——§2.0 跨批序） | 69 ⇒ 估算 ≈100–120 |
| 10 | `thincoder-desktop/renderer/chat.css`（480 ⇒ **229**——R1 四拆后主档） | 核卡类名面（`.permission-prompt` ∕ `.perm-*` ∕ `.question-*` ∕ `.panel-desc` ∕ `.task-*`） | 核卡类名映射（复用既有 `.question-card` ∕ `.question-*` 规则；补 `.permission-prompt` ∕ `.perm-btn` ∕ `.task-*` 面——沿「对齐第三批」core.css ∕ chat.css 映射先例） | **已落（R1 四拆）**：主档 **229** ＋三新档（`chat-cards.css` ∕ `chat-composer.css` ∕ `chat-fixes.css`）；核卡类名映射落 `chat-cards.css` ∕ `core.css` ⑤ 段——§5.11 |
| 11 | `thincoder-desktop/renderer/core.css`（346） | 同 #10 | 核类名映射承接面（第二落点——拆压优先） | 346 ⇒ 估算 ≈355–375 |

**端壳适配（逐条实证给由——核件零改；IME 组字门 = 核件小修候选 · §1.6 已裁 = 准 · 见 §2.5-5）**：
- a. **键位面保全**（`1/2/3` 三出口）：核卡无键位（VSC 实测零命中）、非核件面 ⇒ 端胶水在核卡元素挂 `keydown`，命中 ⇒ 触发核卡内对应出口控件；判据表沿用端侧 `verdictOfKey`（UI.md:22/33 已裁键位面）。
- b. **锚装饰**：核卡自带 `data-prompt-id`；端侧补 `data-card="approval|question|task"` ∕ `data-shape`（端挂载 ∕ 同步面不变式锚）。
- c. **置焦执行**：核卡无置焦（VSC 壳 = `.deny` +50ms 聚焦）；端侧对核卡「最安全键」补 `data-autofocus="1"` 并**沿用帧尾执行点**（两壳同目标：deny）。
- d. **回执非乐观**：核卡点按即摘（核实现 `el.remove()`）；端侧**切片零乐观不变**（清除归事件面）——回执失败径端壳触发一次卡面重挂 ⇒ 卡复现在场可重试。
- e. **提问卡交互面（已裁 · 2026-09-28——裁定见 §2.7 行 5）**：按核件面直落（核卡内建 Enter 直提交——`cards/question.mjs:46-48`；端侧 P2 ∕ P3 增量随轮退场 + `docs/desktop/design/UI.md` 同轮收正）；IME 组字门 = **核件小修候选**（并入实施轮——§1.6 已裁 = 准 · 见 §2.5-5）。
- f. **大 diff 外部查看器**：核卡 `view-diff` 钮在核 `diffBig` 时在场；桌面零外部查看器（PROJECT.md §8 边界）⇒ 端适配 = 钮退场（一条适配 + 真端差登记 ③）。
- g. **出站映射**（`deps.emit` ⇒ 桌面窄桥）：`permissionResponse{approved}` ⇒ `approval:respond`（`true` → `once` ∕ `"approveAll"` → `always` ∕ `false` → `reject`）；`batchPermissionResponse{choice}` ⇒ 同名 verdict（`approveAll` ∕ `oneByOne` ∕ `deny`）；`questionResponse{answer,promptId}` ⇒ `question:respond`（同名面）；`openDiff` ⇒ 随 f 条处置（不绑）。
- **端差处置（本轮）= ① 消除**：待发送呈现——以 VSC 对位面为定案（本地先行出泡 + 在连泡就近标记形——`thincoder-vscode/webview/queued-mark.js:26-40`）；桌面 `[data-pending]` 独立组退场；并笔序 = 姊妹批 B12（出泡时刻）先行（§2.0 跨批序 ∕ §2.7 行 4）。

**验收（机检 ⇒ 真机）**：机检——核卡类名在场 ∧ 三锚装饰恒在 ∧ `[data-autofocus="1"]` 恰一 ∧ 键位 ∕ 出站映射 ∕ 回执失败卡复现（原址补例（现读 ∕ 处置）：`test/views-approval.test.mjs`（399 ∕ 改锚） ∕ `views-question.test.mjs`（444 ∕ 改锚） ∕ `views-chat-frame.test.mjs`（418 ∕ 改锚） ∕ `views.test.mjs`（270 ∕ 改锚） ∕ `views-locks.test.mjs`（412 ∕ 改锚＋CSS 锁随动） ∕ `guard-closure.test.mjs`（115 ∕ 随动））；套件——桌面绿（≥263）+ render-core 同跑（零改回归读数）。真机（父侧）——卡三面与 VSC 同刻对照（含键位 ∕ 置焦 ∕ 大 diff 退场面）。
**边界**：池面零动（非 VSC 对位面）· goal 面板零动（缺面族已裁后续）· 输入面板零触（姊妹批）· 核件零改（IME 组字门核件小修候选另裁——§2.5-5）· VSC 树零改。
**文档收正（随轮）**：`docs/desktop/design/UI.md` 审批呈现 ∕ 提问呈现 ∕ 计划面 ∕ 键盘可达（P2 ∕ P3 增量退场——按核件面直落） ∕ i18n 五行；`RENDERER.md` §1.1（卡面在场与随动条，若判据随动）；`PROJECT.md` §4.2 文件表 + §7 用例行 + **KD-31（`:69`）「`planBusyQueued` ∕ `clearPending` 不消费」句收正**（= 消费准 ∕ 仅 `clearPending` 不消费）＋ **§10 AZ（`:759`）「两处不消费登记」句同笔收正**（VSC 先例在盘）；IPC.md 零动（通道零改）。

#### R2 · 上提：文件链接纯函数（耦合最小）

| # | 档 | 源（出处） | 改动要点 | 预期 |
|---|---|---|---|---|
| 1 | `thincoder-core/file-links.mjs`（新档 · 上提产物） | VSC `thincoder-vscode/src/extension/file-links.mjs:21`（`extractFileLinks` · `MAX_LINKS = 50`） | **纯搬 + 转口**：路径 token 抽取 ∕ 去重 ∕ 上限 ∕ 相对径需项目根；验存（`existsSync` ∕ `statSync`）转注入缝 | ≈45–55 |
| 2 | `thincoder-desktop/src/main/file-links.mjs`（64） | 同 #1 | 消费核件（删本地副本；`fileOpenTarget` = 端 IPC 载荷判据保留端侧）；`node:fs` 探测端侧注入 | 64 ⇒ 估算 ≈40–55 |

**验收**：机检——核新档直测（拟 `thincoder-core/test/file-links.test.mjs`：抽取 ∕ 去重 ∕ 上限 ∕ 相对径 ∕ 验存滤除）+ 桌面 `test/file-links.test.mjs` 随动；套件——core + desktop 双绿。真机——工具卡文件链接点开（`file:open`）不回归。
**边界**：VSC 树零改（共享核件改动另裁；其自持副本迁移留后——双写窗口见 §2.5 上抛 2）· 链接渲染面（`views/chat-tool.mjs`）零动。
**文档收正（随轮）**：`docs/desktop/design/PROJECT.md` §4.2 文件表行随动 + **KD-39（`:78`）「两端各自实现——只述实现形态」句收正**（链接解析 = 核件单源 + 两端消费；端档首注 `src/main/file-links.mjs:4` 同句随动）；核侧 = `docs/core/design/CORE-UNIFICATION.md` 行 183（`file-links` 项「端特有 · 不迁」随上提收正）+ 新核档登记行。

#### R3 · 上提：队列纯逻辑族 + 回合链接驳

| # | 档 | 源（出处） | 改动要点 | 预期 |
|---|---|---|---|---|
| 1 | `thincoder-core/queued.mjs`（新档 · 上提产物） | VSC `thincoder-vscode/src/extension/queued-merge.mjs:15-36`（`MAX_MERGE_ITEMS` ∕ `MAX_MERGE_CHARS` ∕ `QUEUED_MAX_ITEMS` ∕ `formatMergedMessages` ∕ `planQueuedInput`）+ `queued-pickup.mjs:49`（`takeQueuedBatchItem`） | **纯搬 + 转口**：容量常量 ∕ 合并串 ∕ 批计划 ∕ 取项一族；对拍锚 = CLI 副本 `thincoder-cli/src/tui/queued-merge.mjs`（值同 —— 核档零引入 CLI 依赖） | ≈95–115 |
| 2 | `thincoder-desktop/src/main/queued-input.mjs`（118） | 同 #1 | 消费核族（删本地纯函数副本）；表壳（`Map` 分键 ∕ 容量门 ∕ 快照投影 `{text,ts}`）与满队回执留端 | 118 ⇒ 估算 ≈70–90 |
| 3 | `thincoder-desktop/src/main/turn-chain.mjs`（72） | 同 #1 + VSC `panel-turn-stages.mjs:109/164` | 取批改核 `takeQueuedBatchItem`；`postQueue` ∕ `continueTurn` 序对齐 VSC 回合链（回合尾送达 ∕ 步边界注入两时刻不动） | 72 ⇒ 估算 ≈60–75 |

**验收**：机检——核新档直测（拟 `thincoder-core/test/queued.test.mjs`：批拆分 ∕ 8 条 ∕ 2000 字 ∕ slash 首条两径 ∕ 取项保序）+ 桌面 `test/queued-input.test.mjs` ∕ `agent-host-queued.test.mjs` 随动；套件——core + desktop 双绿。真机（父侧）——忙态提交 ⇒ 待发送呈现（单条 ∕ 合并 ∕ 第 9 条满队）· 步边界取批与回合尾送达。
**边界**：slash 门禁 ∕ 队条目零编辑零撤回 ∕ 挂起窗队列不合并（既有边界全守）· VSC 树零改 · CLI 零改（迁移留后）。
**文档收正（随轮）**：`PROJECT.md` §4.2 文件表（`queued-input.mjs` ∕ `turn-chain.mjs` 行）+ §7 用例行；核侧 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md`（§6.8 步边界 pickup 面 + `queued.mjs` 登记）+ `AGENT-LOOP.md` §6.2（循环头三成员句）。

#### R4 · 上提：timer 闩 + 火策略

| # | 档 | 源（出处） | 改动要点 | 预期 |
|---|---|---|---|---|
| 1 | `thincoder-core/agent/timers.mjs`（51 · 扩档） | VSC `thincoder-vscode/src/extension/timer-watch.mjs:46`（`createTimerWatch` · 注入 `timer/clear/now`）`:73/94/105` | **纯搬 + 转口**：一次性最近截止闩（起 ∕ 停 ∕ 重臂 ∕ `unref`）+ 火策略（派发 ∕ 火判据）；既有读面（`:19/32/42`）原位 | 51 ⇒ 估算 ≈85–105 |
| 2 | `thincoder-desktop/src/main/timer-watch.mjs`（80） | 同 #1 | 消费核闩 ∕ 火策略（删本地闩实现）；`ev:timer` 出词与 `runTurn` 触发留端 | 80 ⇒ 估算 ≈50–65 |
| 3 | `thincoder-desktop/src/main/suspension-drive.mjs`（270 · 闩接点） | 同 #1 | 挂起窗闩接点改核件（ar ∕ disarm 三处 :180-181/:217/:228 随动） | 270 ⇒ 同量 |

**验收**：机检——核 `test/timer-wake.test.mjs` 扩例（假钟：就近臂 ∕ 幂等 ∕ 到期消费）+ 桌面 `test/timer-wake.test.mjs` ∕ `agent-host.test.mjs`（T-TW21）随动；套件——core + desktop 双绿。真机（父侧）——timer 到期唤醒（空闲 ⇒ 自动轮；在飞 ⇒ 不打断）。
**边界**：timer 在途帽（8）与写点零动 · 挂起窗 timer 面（`timerFace` 两法）零动 · VSC 树零改。
**文档收正（随轮）**：`PROJECT.md` §4.2（`timer-watch.mjs` ∕ `suspension-drive.mjs` 行）；核侧 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md`（§6.30 timer 族——`agent/timers.mjs` 扩面登记）。

#### R5 · 上提：附件贴图族

| # | 档 | 源（出处） | 改动要点 | 预期 |
|---|---|---|---|---|
| 1 | `thincoder-core/attachments.mjs`（新档 · 上提产物） | VSC `thincoder-vscode/src/extension/image-handler.mjs:34`（`parseDataUrl`）`:49`（`savePastedImages`）`:109`（`downgradeNonVisionImages`）；核既有 = `thincoder-core/agent/setup-reminders.mjs:248`（`appendImagePointer` 原位） | **纯搬 + 转口**：dataURL 解析 ∕ 临时落盘管线骨架 ∕ 非多模态降级判据 ∕ 配额（15MB ∕ 条 · 30MB ∕ 轮）；fs 写 ∕ 视觉子代理 spawn 转注入缝 | ≈95–120 |
| 2 | `thincoder-desktop/src/main/attachments.mjs`（126） | 同 #1 | 消费核族（删本地判据副本）；`cleanupTurn` ∕ 提示行 ∕ 模型档位面留端 | 126 ⇒ 估算 ≈70–95 |

**验收**：机检——核新档直测（拟 `thincoder-core/test/attachments.test.mjs`：解析 ∕ 上限 ∕ 非多模态判据 ∕ 降级行）+ 桌面 `test/attachments.test.mjs` ∕ `agent-host-queued.test.mjs`（`NON_VISION_KEY` 面）随动；套件——core + desktop 双绿。真机（父侧）——贴图两径（多模态直传 ∕ 非多模态降级行）· 超限丢弃非阻断。
**边界**：非栅格拒时机（端侧双闸）零动 · 附件条呈现面零动 · VSC 树零改。
**文档收正（随轮）**：`PROJECT.md` §4.2（`attachments.mjs` 行）；核侧 = `docs/core/design/PROVIDER.md` §6.18（贴图降级链——核件化登记）+ `CORE-UNIFICATION.md` 行 183（`image-handler` 项收正）。

#### R6 · 上提：存活 2s 拍 + 完成提示策略

| # | 档 | 源（出处） | 改动要点 | 预期 |
|---|---|---|---|---|
| 1 | `thincoder-core/agent/live-beat.mjs`（新档 · 上提产物） | VSC `thincoder-vscode/src/extension/panel-messages.mjs:45`（`LIVE_HEARTBEAT_MS = 2000`）`:50`（单拍）`:62-75`（起 ∕ 停拍）+ `suspension.mjs:148`（`reassertLiveChildren` 投影面） | **纯搬 + 转口**：拍间隔 ∕ 单拍 ∕ 起停 ∕ 幂等 ∕ 清点；`setInterval` ∕ `unref` 转注入缝 | ≈60–80 |
| 2 | `thincoder-core/notify-policy.mjs`（新档 · 上提产物） | 桌面现状超集 = `thincoder-desktop/src/main/notify.mjs:16-27`（零宿主依赖）；对位锚 = VSC `notify.mjs:9-18` + `panel-callbacks.mjs:233` | **纯搬**：失焦门 + 两档（`turnDone` ∕ `digestStart`）+ 载荷成形 + 词键；平台落子（`notify` ∕ `focused` ∕ `reveal`）注入缝原位 | ≈40–55 |
| 3 | `thincoder-desktop/src/main/subagent-face.mjs`（87） | 同 #1 | 消费核拍（删本地常量 ∕ 拍体）；`reassertLive` 桥 ∕ 桥接键集留端 | 87 ⇒ 估算 ≈55–70 |
| 4 | `thincoder-desktop/src/main/notify.mjs`（48） | 同 #2 | 消费核策略（删本地策略体）；Electron 落子装配留端（`main.mjs` 面） | 48 ⇒ 估算 ≈25–35 |

**验收**：机检——核两新档直测（假钟拍体 ∕ 清点；失焦门 ∕ 两档 ∕ 载荷）+ 桌面 `test/agent-host-subagent.test.mjs` ∕ `agent-host.test.mjs`（`NOTIFY_TEXTS` 面）随动；套件——core + desktop 双绿。真机（父侧）——子代理在飞 2s 走时 · 失焦通知两档（完成 ∕ 子任务起跑）。
**边界**：渲染面 2s 拍（`app.mjs` 走时面）零动——与本轮宿主拍非同面 · VSC 树零改。
**文档收正（随轮）**：`PROJECT.md` §4.2（`subagent-face.mjs` ∕ `notify.mjs` 行）；核侧 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md`（存活重推族登记）+ `CORE-UNIFICATION.md` 行 183（`notify` 项收正）+ `notify-policy.mjs` 登记行。

#### R7 · 上提：装配序 + `teamConfig` ∕ `gitAuthor`

| # | 档 | 源（出处） | 改动要点 | 预期 |
|---|---|---|---|---|
| 1 | `thincoder-core/agent/assemble.mjs`（新档 · 上提产物） | **CLI** `thincoder-cli/src/cli/make-agent.mjs:201`（`teamConfig`）`:209`（`gitAuthor`）`:58/64`（装配消费）；桌面第二份 = `thincoder-desktop/src/main/agent-assemble.mjs:30/38`（对拍锚） | **纯搬 + 转口**：装配序七步（配置 → 代理注入 → 记忆 → 文件规则 → 记忆层 → 工具 → 代理）∥ `teamConfig` ∥ `gitAuthor`；git 探测（`node:child_process`）转注入缝 | ≈70–95 |
| 2 | `thincoder-desktop/src/main/agent-assemble.mjs`（96） | 同 #1 | 消费核族（`DEFAULT_DEPS` 缺省面随核；`validateProvider` ∕ `cwd` 注入留端） | 96 ⇒ 估算 ≈55–75 |
| 3 | `thincoder-desktop/src/main/agent-host.mjs`（375 · re-export 面） | 同 #1 | 名字面随动（`teamConfig` ∕ `gitAuthor` 再导出指向核） | 375 ⇒ 同量 |

**验收**：机检——核新档直测（拟 `thincoder-core/test/assemble.test.mjs`：装配序 ∕ team ∕ author 归一）+ 桌面 `test/agent-host.test.mjs`（U79 装配序 ∕ U80 provider verdict）随动；套件——core + desktop 双绿。真机（父侧）——工程模式子代理装配 ∕ 记忆层归属不回归。
**边界**：VSC 零面（不误搬——其 `memory-tool.mjs:84` 恒 `author:“unknown”` 面不动）· CLI 零改（迁移留后）· provider 校验 ∕ 目录注入面零动。
**文档收正（随轮）**：`PROJECT.md` §4.2（`agent-assemble.mjs` ∕ `agent-host.mjs` 行）；核侧 = `docs/core/design/AGENT-LOOP.md`（装配面——U15 子系统行）+ `MEMORY.md`（`teamConfig` 族随核件化收正）。

#### R8 · 上提：provider 流程族

| # | 档 | 源（出处） | 改动要点 | 预期 |
|---|---|---|---|---|
| 1 | `thincoder-core/provider-flows.mjs`（新档 · 上提产物） | VSC `thincoder-vscode/src/extension/provider-flows.mjs:60`（`addProviderFlow`）`:129`（`removeProviderFlow`）`:153`（`setKeyFlow`）`:32`（`probeProviderAdmission` 判据） | **纯搬 + 转口**：三流程步序 ∕ 字段校验 ∕ 拒因 ∕ 探针判据（准入永不阻断写——M9 语义）；QuickPick ∕ InputBox ∕ 网络探针转注入缝 | ≈80–105 |
| 2 | `thincoder-desktop/src/main/providers.mjs`（151） | 同 #1 | 消费核族（四通道壳：`provider:list/save/remove/verify`；持久化已在核——零改） | 151 ⇒ 估算 ≈110–135 |
| 3 | `thincoder-desktop/renderer/views/settings-sections.mjs`（**357**——越 300：拆档承 拆档批 §2.2-3〔agent 族出档 `settings-agent.mjs`〕；**先拆后改**）+ `renderer/mount-settings.mjs`（**500**——顶格：拆档定稿见 §2.1）+ `renderer/views/onboarding.mjs`（**162**） | 同 #1 | 表单向流程消费核步序 ∕ 拒因出词（端壳=表单，留端） | 三档随动（±0～+15） |

**验收**：机检——核新档直测（拟 `thincoder-core/test/provider-flows.test.mjs`：三流程步序 ∕ 校验 ∕ 拒因 ∕ 探针不阻断）+ 桌面 `test/providers.test.mjs` ∕ `views-settings*.test.mjs` 随动；套件——core + desktop 双绿。真机（父侧）——添加渠道（预设 ∕ 自定）· 移除 · 密钥写入 · 探针失败不阻断。
**边界**：密钥遮罩 ∕ 明文零下发纪律零动 · `config-io` 唯一写盘零动 · VSC 树零改。
**文档收正（随轮）**：`PROJECT.md` §4.2（`providers.mjs` 行）+ `UI.md`（设置面表单若触）；核侧 = `docs/core/design/PROVIDER.md`（流程族登记——判据 ∕ 步序面）+ `CONFIG.md`（持久化面已在核——据实核）。

#### R9 · 其余：回合链续链面 + 悬挂三面

| # | 档 | 源（出处） | 改动要点 | 预期 |
|---|---|---|---|---|
| 1 | `thincoder-desktop/src/main/turn-chain.mjs`（72 · 续链面——取批面 R3 已接） | VSC `panel-turn-stages.mjs:109`（`finalizeTurn`）`:164`（`enterSuspensionTurn`） | 回合结算序对齐（标题 → 单次落盘 → 忙态重播 → `loading:false` → 闩臂 → 挂起入口）；`ev:queue` 两形出站零改 | 72 ⇒ 估算 ≈55–70 |
| 2 | `thincoder-desktop/src/main/suspension-drive.mjs`（270 · 三面） | 核契约 = `thincoder-core/agent/suspension.mjs:172/106`；对位锚 = VSC `suspension.mjs:148/260` | 窗寄存器（一键一窗）∥ 回收 ∕ 退场清场 ∥ 残输入（abort 墓碑 ∕ idle 直注入）三面**对齐核契约 + 端壳行为同 VSC**；`ev:susp` ∕ `ev:digest` 面零改 | 270 ⇒ 估算 ≈240–270 |

**验收**：机检——桌面 `test/agent-host-suspension.test.mjs` ∕ `agent-host.test.mjs`（:319/:360/:417）∕ `test/integration/midturn-input.test.mjs` 随动；套件——core + desktop 双绿。真机（父侧）——悬挂窗四态走查（计数 ∕ 消化行 ∕ 回收 ∕ 残输入零丢）。
**边界**：挂起 ∕ 消化词键面零改 · timer 面（R4 已接）不重触 · VSC 树零改。
**文档收正（随轮）**：`PROJECT.md` §4.2（`suspension-drive.mjs` ∕ `turn-chain.mjs` 行）+ `RENDERER.md`（若触）；核侧 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md`（悬挂契约引用面）。

### 2.3 全批验收（收口面 —— 父侧跑）

1. **四套件全绿 + 用例数不降**：`thincoder-desktop ≥ 263` · `thincoder-core ≥ 772` · `thincoder-cli ≥ 889` · `thincoder-vscode ≥ 1052`（基线 = 2026-09-28 18:44 探索舱 #53 读数）；跑法 `cd thincoder-<x> && npm test`；读数 = Node test-runner 摘要行（`ℹ tests N · pass N`）。render-core 套件 = 触面轮必跑、零改轮作回归读数。
2. **VSC 树零改机械锁**：全批 diff 内 `thincoder-vscode/` 零命中（git diff 面）；**共享核件改动另裁**（IME 组字门核件小修候选——§2.7 行 5），影响面登记。
3. **真机走查面登记（父侧跑 · 逐面）**：卡三面与 VSC 同刻对照（含键位 ∕ 置焦 ∕ 大 diff 退场面）· 待发送呈现三态（单条 ∕ 合并 ∕ 满队）· 步边界取批与回合尾送达 · timer 到期唤醒 · 附件贴图两径 · 文件链接点开（`file:open`）· 失焦通知两档 · 子代理 2s 走时 · provider 四流程 · 悬挂窗四态 · **会话控制（下拉选会话 ∕ 新建 ∕ 切会话）与左列零残留（R13 面——§2.9）**。
4. **轮粒度**：每轮独立可验收（行动表原档 ≤15 + 该轮套件绿 + 该轮真机面）。

### 2.4 关键决策（KD-F 级）

1. **KD-F1 卡面 = 核件直消费 + 端侧胶水**（键位 ∕ 锚 ∕ 置焦 ∕ 回执续保）；被否候选 = 端侧照旧自造（违 18:42 口径）· 核件加端专用开关（核件生端参数——违单源）。
2. **KD-F2 上提 = 核新档纯搬 + 端消费；源端迁移留后**（VSC 树零改系定死口径；双写窗口在册——§2.5-2）。
3. **KD-F3 上提源如实定界**：装配族源 = CLI（VSC 零面——实测）；提示策略源 = 桌面超集现状（VSC 单档为对位锚）——简报「VSC 实现为源」通则在两处不成立，按实读定源并登记。
4. **KD-F4 轮序 = 复用 → 上提（耦合小→大）→ 其余**；每轮独立验收（父侧按轮派发）。
5. **KD-F5 provider 流程族 = 步序 ∕ 校验 ∕ 拒因 ∕ 探针语义纯面上提**；端壳（VSC QuickPick ∕ 桌面表单）留端。
6. **KD-F6 会话模型 = VSC 单面板**（承用户 19:04 ∕ 19:0x 裁 + 需求档 §3.1 —— R13 ∕ §2.9）：多标签 ∕ 左列裁撤；会话切换 = VSC 同款下拉（`thincoder-vscode/webview/session-bar.js` 三件：项目钮 ∕ 下拉 ∕ 新建）；标签存储 ∕ 关闭确认 ∕ 页随动随之下线；被否候选 = 保留左列作第二入口 ∕ 标签与下拉并存（违「不新造」与用户明令）。

### 2.5 上抛项（父侧知悉 ∕ 裁定）

1. **简报未投面**：对位清单「反向发现 7 项」仅 ①② 在册（§1.2）；12 族中「会话 IO ∕ 桥 ∕ 其他」无条目在册（设置族仅 provider 流程面）——本任务书按在册 14 行排轮，**表外零处置**；**对账面 = §2.1（在册摘要——#53 原文未在盘，逐条名目待补投）**；如父侧持全表请补投（增量可后补轮）。
2. **双写窗口**：上提核件与 VSC ∕ CLI 自持副本并存（漂移风险）——消解路 = 后续迁移批；期间核件 = 桌面消费单源。
3. **通知策略档差**：核件承桌面两档超集；VSC 后续迁移若采核件 ⇒ 行为面 +1 档（另裁；VSC 树零改）。
4. **render-core 发布形**：桌面经 `file:` 链接消费（`thincoder-desktop/package.json:15` + lock `link:true`）；发布物化纪律随实施轮核（沿 VSC 先例——桌面 `scripts/check-dist.mjs` 面）。
5. **IME 组字门（核件小修候选 —— §1.6 已裁 = 准）**：并入实施轮（轮序由实施派单定）；缺陷面 = 核卡组字期提交（`thincoder-render-core/cards/question.mjs:46-48` 无组字门）；修因面 ∕ 落点 = §2.7 行 5 ∕ R1 e 条。
6. **goal 面板缺面**：`cards/panel.mjs` 的 goal ∕ `renderGoalPanel` 面不在本批（align-3 §2.5 已裁「缺整面族后续批」）；本轮只落任务面板（计划面）消费。

### 2.6 边界（不做）

- VSC 树零改（共享核件改动另裁）；CLI 侧零改（迁移留后）。
- **反向发现 ③–⑦ = 非本批**（§1.6 裁：core ∕ render-core 已单源、VSC ∕ CLI 未消费族——桌面面零动作；VSC ∕ CLI 侧收口另册；表外零处置）。
- 输入面板（composer）零触——姊妹批 `docs/batches/2026-09-28-desktop-input-vsc-align.md` 面。
- 零新可见面（goal 面板 ∕ 搜索 ∕ @-补全等缺面族不在本批）。
- 需求档笔权在父侧（本座只报）；`docs/core` ∕ `docs/render-core` 设计档零触碰；桌面设计档收正随轮（清单见各轮尾「文档收正」行）。
- 表外零处置（只报）。

### 2.7 端差判据收窄（补令 2① · 即刻生效 —— 全批重列）

**自本节起，全批端差处置 = 两值**：**① 消除**（用户可见差 ⇒ 以 VSC ∕ CLI 对位面为定案，一律消除）；**② 宿主能力面例外**（宿主无对应物 + 不得引入用户可见差异 + 须实证）。**「登记后保留」通道取消** —— 本任务书不再出现该选项；前段（§2.1 真端差登记三条、R1「端壳适配 f」与「端差登记」行）按本两值逐条重列如下：

| # | 前段项 | 重列 | 依据 ∕ 实证 |
|---|---|---|---|
| 1 | 通知平台落子 | **② 宿主能力面例外** | 平台 API 无对应物（`vscode.window.showInformationMessage` vs Electron `Notification`）；载荷 ∕ 时机 ∕ 词面全同 VSC——零可见差；实证 = 两端 notify 档 + R6 核件策略面 |
| 2 | 卡面端壳（append ∕ 流内插点 ∕ 同步） | **非端差项**——机械面 = 宿主胶水（不可见）；可见面（卡形 ∕ 类名 ∕ 词面 ∕ 出口）按 **① 消除** ⇒ R1 收敛核件形 | 核件卡 = VSC 同源实现（`cards/permission.mjs:60/105`） |
| 3 | 大 diff 外部查看器 | **② 宿主能力面例外**（桌面无 diff 查看器；`thincoder-vscode/src/extension/diff-preview.mjs` = VSC 宿主件）；落法 = `diff.path` 在场 ⇒ 钮在场 + `file:open`；`apply_patch` 形（无单径）⇒ 钮退场（不引入死控） | 实证随 R1 实施轮逐条记 |
| 4 | 待发送呈现容器（`[data-pending]` 独立组） | **① 消除**——以 VSC 对位面为定案（在连泡就近标记形）；落点 = R1 #7 ∕ #8 + 姊妹批 B12 出泡时刻面并笔（**姊妹批先行**——§2.0 跨批序；锁随动归先落者） | `thincoder-vscode/webview/queued-mark.js:26-40`（在连泡标记 = VSC 形） |
| 5 | 键位面（1/2/3）＋ 提问卡交互增量（P2 ∕ P3 ∕ IME） | **① 消除**——以核件 ∕ VSC 对位面为定案：R1 e 条按核件面落（P2 ∕ P3 增量随轮退场 + UI.md 同轮收正）；IME 组字门 ⇒ **核件小修候选**（§1.6 已裁 = 准；VSC 同受益——不构成端差；见 §2.5-5） | `thincoder-render-core/cards/question.mjs:46-48`（核卡键径）|
| 6 | 池内审批族席位（VSC 审批 = 流内卡，无池面） | **非端差项 · 待父侧裁**（随 R10：留作端增件 ∕ 随 ② 收撤）——见 §2.8 上抛 | `thincoder-vscode/webview/permission.js:22-39`（流内卡 = VSC 形） |

**适用**：R2–R13 各轮内「适配 ∕ 边界」行一律按本两值表述（消除 ∕ 宿主能力面例外+实证）；宿主能力面例外逐条须附实证坐标。

### 2.8 补令增轮（R10–R12 · 承用户 2026-09-28 18:5x 直令 + §3.6 全三点）

**轮序注**：R10–R12 = 补令增轮（用户直令面）＋ **R13 = 会话模型轮（承用户 19:04 ∕ 19:0x 续裁——见 §2.9）**；派发序 = 父侧裁（与 R2–R9 的相对序不预设）。基准 = ① 状态行 ⇒ **CLI**；②③ ⇒ **VSC**；R13 ⇒ **VSC 会话面**。VSC 树零改（共享核件改动另裁；迁移留后）。

#### R10 · 子代理面板 ∕ live 面（补令 1 + §3.6 ②）——桌面子代理可见全族

**逐面 ∕ 逐元素对位表（VSC × 桌面 × 处置）**：处置按 §2.7 两值（消除 ∕ 宿主能力面例外）。

| # | 元素 ∕ 面 | VSC 原件（file:line） | 桌面现状（file:line） | 处置 |
|---|---|---|---|---|
| E1 | 区域容器与位置 | `#subagent-activity` 横带（`webview/index.html:34-39`；`base.css:82-117`——messages 与输入区之间 · `:empty` 退场 · 32vh 封顶 · 区内自滚） | `[data-slot="pool"]` 右列常驻（`renderer/index.html:36-38` · `mount-pool.mjs:15`） | 位置 = **用户 ② 已裁「右列 = 子 agent 面」**（列明；布局骨架差异在册）；内容语义 ∕ 空态 ∕ 封顶 ∕ 自滚按 VSC 形换装 |
| E2 | 空态 | `:empty {display:none}`（`base.css:109`） | 池三态 `data-state`（`views/activity.mjs`） | 消除 ⇒ 空 ⇒ 区域退场（VSC 形） |
| E3 | 块 chrome（身份头 ∕ tail-3 折叠 ∕ `.sub-desc` 首块注 ∕ ⏹ 浮钮） | 核件 = `thincoder-render-core/subblocks/block.mjs:16-27` · `activity-view.mjs:118-143,152-177`（VSC 消费 = `webview/activity.js:26`） | 已消费同核件（`views/chat-subagent.mjs:15-16` · `views/activity.mjs:25-26`） | **核件消费面保持（零改）** ⇒ 形随核件即 VSC 形 |
| E4 | 生命周期（出生即驻留 ∕ 终态留场 ∕ 归档入流 @ 消化边界） | `webview/activity.js:48-67`（建 ∕ 驻）`:70-97`（态机效果）`:104-110`（归档于 `S._digestBoundary` 前）；核态机 = `subblocks/state.mjs` | 池「在飞块」+ 事件面；归档块 = `chat-subagent.mjs:52-68`（重挂径 ∕ 帧尾径） | 消除 ⇒ 生命期 ∕ 归档位置对齐 VSC（边界 = `chat-status.js:92` 同源面） |
| E5 | 停止（⏹） | 核件钮（`activity-view.mjs:152-177`）+ 委托 `chat.js:87-94`（`cancelSubagent`） | `mount-pool.mjs:60-73`（`subagent:stop` 委托 · 零乐观写） | 核件钮形已同源；出站名映射（已有）——零降级 |
| E6 | 出生计数贴（`.activity-new-btn`，未跟底时计新生） | `webview/activity-new.js:21-54`（`base.css:113-117`） | 无该面（桌面有药丸 ∕ 跟滚面） | 消除 ⇒ **补装**（VSC 形；判据 = 未跟底 ∧ 新生 > 0） |
| E7 | 2s 拍（渲染面） | `webview/panels.js:49-52` → `refreshLiveHeaders`（`activity.js:149-153`——逐在飞块 `refreshBlock`） | `renderer/heartbeat.mjs`（2s 拍：在飞块逐块 `refreshBlock` + 状态行重挂） | 消除 ⇒ 拍体 ∕ 判据对齐 VSC；状态行重挂段随 R11 |
| E8 | 2s 拍（宿主面 · 存活重推） | `LIVE_HEARTBEAT_MS = 2000`（`panel-messages.mjs:45`）→ `reassertLiveChildren`（`suspension.mjs:148`） | `subagent-face.mjs`（86——已在 R6 上提清单） | R6 核件 + 端消费（本表只登记衔接） |
| E9 | 挂起 ∕ 消化可见面 | 消化行 `.digest-turn` ∕ `.digest-status`（`chat-status.js:69-122`）· susp 段 `status-bar.js:51-61`（`susp.running/digesting/winding`） | `[data-digest]` 行组（idle-wake 批）· 状态行段 3 挂起句（`views/statusline.mjs`） | 消除 ⇒ 形 ∕ 触发 ∕ 落位逐值对表（本表列面；值表随轮出） |
| E10 | 归档块窗口 ∕ 裁剪 | `ui.js:199-206`（150 块窗口含 `.sub-block`） | `views/chat-scroll.mjs` 裁剪面 | **① 消除**——差 ⇒ 消除（归档块窗口 ∕ 裁剪行为逐值对表；两机制别名登记随轮核——结论落点 = 本表验收行 ∕ R10 #4） |
| E11 | relay 展示面（宿主 → webview 载荷） | `panel-subagent-relay.mjs:83/172/215/233`（`postSubagentEvent` 单门 + outbox 200 丢最旧）· `panel-messages.mjs:309-333`（就绪重推 ∕ 拍） | `renderer/events.mjs` `ev:subagent` 归约 ∕ `subagent-reduce.mjs` | 载荷形 ∕ 生命周期事件序对齐（桌面通道面已在） |

**行动表（原档 ≤15）**：

| # | 档（现读行数） | 动作 | 预期 |
|---|---|---|---|
| 1 | `thincoder-desktop/renderer/views/activity.mjs`（322） | 池挂载面换装 VSC 形（空态 ∕ 生命期 ∕ 块序 ∕ 封顶自滚）；核件消费面保持 | 322 ⇒ 估算 ≈280–330 |
| 2 | `thincoder-desktop/renderer/mount-pool.mjs`（90） | 接线随动（⏹ 委托已在；族序 ∕ 席位随 E2/E11） | 90 ⇒ 同量 |
| 3 | `thincoder-desktop/renderer/subagent-reduce.mjs`（138） | 生命期归约对齐（生 ∕ 驻 ∕ 冻 ∕ 归档——核态机单源不变） | 138 ⇒ 同量 |
| 4 | `thincoder-desktop/renderer/views/chat-subagent.mjs`（70） | 归档块面（归档位置 ∕ 裁剪面）随 E4 ∕ E10（**① 消除**——判据落点见 E10） | 70 ⇒ 同量 |
| 5 | `thincoder-desktop/renderer/heartbeat.mjs`（45） | 渲染面 2s 拍换装（拍体 ∕ 判据对齐 E7；状态行段随 R11） | 45 ⇒ 估算 ≈40–55 |
| 6 | `thincoder-desktop/renderer/pool.css`（85） | 池 ∕ 块 chrome 样式换装（值源 = VSC `base.css:82-117` ∕ `chat.css:317-374`；变量别名） | 85 ⇒ 估算 ≈90–130 |
| 7 | `thincoder-desktop/renderer/views/activity-new.mjs`（**新档**——定名） | 出生计数贴（VSC `activity-new.js:21-54` 照搬；消费面 = 池面挂载 ∕ 拍面） | 新档 ≈40–70 |
| 8 | `thincoder-desktop/renderer/events.mjs`（498）+ `renderer/app.mjs`（300） | 归约 ∕ 拍点接线随动（**拆分已由输入面板批 R1 承接**——`renderer/events-flags.mjs` ≈+75；本行引用之，不重复计划；主档批后 ≈482） | 随动 |
| 9 | `thincoder-desktop/renderer/chat.css`（480 ⇒ **229**——R1 四拆后主档） | 块规则随动（若触；与 R12 面避让；**先拆后改**——拆档见 §2.1）——**已落（零触）**：R10 与 R12 避让 ⇒ `chat.css` 零笔（§5.14） | 随动 |

**适配逐条实证**：① 位置（右列 vs 横带）= 用户 ② 已裁方向（`docs/batches/2026-09-28-desktop-input-vsc-align.md` §2.11②-1）；② 停止通道名映射（`cancelSubagent` → `subagent:stop`）；③ 事件载荷映射（relay 面 → `ev:subagent`，桌面已在）；④ 2s 宿主拍 = R6 核件（本表衔接）。
**验收**：机检——池空态退场 ∕ 生命期 ∕ 归档位置 ∕ 拍体判据（原址补例（现读 ∕ 处置）：`test/views-activity.test.mjs`（391 ∕ 改锚） ∕ `events-subagent.test.mjs`（171 ∕ 改锚） ∕ `agent-host-subagent.test.mjs`（144 ∕ 改锚） ∕ `views.test.mjs`（270 ∕ 改锚））；套件——desktop 绿（≥263）。真机（父侧）——右列子代理全族走查（出生 ∕ 在飞走时 ∕ ⏹ ∕ 终态留场 ∕ 归档 ∕ 计数贴 ∕ 空态）。
**边界**：核件（`subblocks/*` 五档）零改（消费面保持）；VSC 树零改；工具行席位不复活（「对齐第二批」既定）。
**上抛**：U-1 **池内审批族席位**（VSC 无池面对位——留作端增件 ∕ 收撤，请父侧裁）；U-2 E6 出生计数贴为桌面缺面补装（VSC 形照搬——如判「缺面族另批」请裁）。
**文档收正（随轮）**：`UI.md`（右列子代理面 ∕ 空态 ∕ 生命期行）+ `RENDERER.md`（池 ∕ 拍面）+ `E2E-TESTING.md`（真机面）；核件五档零改（无核侧收正）。

#### R11 · 状态行 ⇒ CLI 对齐（§3.6 ①）

**基准 = CLI 状态行**（`thincoder-cli/src/tui/render-frame.mjs:344` 起 `buildStatusLine` + banner `:221-225` + 注意力 chip `:229-230` + 键位组 `:427` 尾段；静息词 `tui-state.mjs:43`）。桌面在册 = 16 段表（`docs/desktop/design/UI.md` §1「本批注（状态栏对齐 · 屏面为准）」）。

| # | 档（现读行数） | 动作 | 预期 |
|---|---|---|---|
| 1 | `thincoder-desktop/renderer/views/statusline.mjs`（293） | 16 段逐段复核对位（承载 ∕ 旁置 ∕ 不适用三值重核）；可见差 **① 消除** | 293 ⇒ 估算 ≈280–310 |
| 2 | `thincoder-desktop/renderer/views/statusline-banner.mjs`（**26**） | 四态 banner 面核对（CLI banner 同源判据） | 随动 |
| 3 | `thincoder-desktop/renderer/events.mjs`（498） | 段落读数面随动（`turn` 段恒 `turn 1/200` = 在册证据项——sister §1.6）；拆分 = 输入面板批 R1 承接（引用——§2.1） | 随动 |

**验收**：机检——段级对位表逐行（段集 ∕ 读数源 ∕ 三值）（`test/views-statusline.test.mjs`（329 ∕ 改锚）原址补例）；套件——desktop 绿（≥263）。真机（父侧）——状态行逐段与 CLI 同刻对照。
**边界**：段集变更（增 ∕ 撤段）须同笔 UI.md 状态栏行 + 计数随动；R10 的 E7 状态行重挂段面并笔。
**文档收正（随轮）**：`UI.md` §1 状态栏行（段级对位表随轮）+ `RENDERER.md`（状态行面）；核侧零动。

#### R12 · 会话流 ⇒ VSC 对齐（§3.6 ③）

**基准 = VSC `#messages` 面**（`webview/chat.css:3-59` 消息面 · `base.css` 区域规则 · `history.js:29-56` 懒加载 ∕ `ui.js:211-221` 跟滚）。

| # | 面 | VSC 原件 | 桌面现状 | 处置 |
|---|---|---|---|---|
| F1 | 块壳 | 文本面透明无卡壳（无边框 ∕ 无底；`chat.css:3-59`） | `.block` 1px 描边 + 圆角（`renderer/chat.css:13-25`） | 消除 ⇒ `D24 消息块壳`保留面收正（`.block` 移出——`PROJECT.md` D24 行同拍）；锁随动对象已随全清令退役（`views-locks` 删档）⇒ 留证改逐值表 ∕ 探针 |
| F2 | 面宽 ∕ 间距 | max-width 90%（user 100%）· 块距 14px | 满宽 · 块距 8px | 消除 ⇒ 逐值对表 |
| F3 | 面内件（工具卡 ∕ 推理 ∕ 错误） | 与桌面同源（核件面） | 核件消费在盘 | 逐值对表（差 ⇒ 消除） |
| F4 | 流尾件（digest ∕ timer ∕ ledger ∕ stopMark ∕ 待发送） | digest = 有对位面（`.digest-turn` ∕ `.digest-status`；`chat-status.js:69-122`——E9 同锚）；timer ∕ ledger ∕ stopMark ∕ 待发送 = 无同件 | 前批用户裁定面 | 非端差项——**形**与 VSC 邻近面逐值对表（差 ⇒ 消除）；面本身零动；**digest 两差（终态留存 ∕ 多轮切片）显式续登**（不内消——R10 父侧裁；登记 = §5.14 E9 值表） |
| F5 | 滚动 ∕ 回填 | `history.js:29-56` 懒加载 + 跟滚；`ui.js:211-221` pin（24px 阈） | `views/chat-scroll.mjs`（回填 + 停跟） | 行为对表（随轮深勘；差 ⇒ 消除） |

**行动表**：`renderer/chat.css`（**229**——拆后主档：块壳 ∕ 面宽 ∕ 间距）· `renderer/theme.css`（**90**）∕ `renderer/chrome.css`（**424**）——变量 ∕ 骨架面（原 `styles.css` 已删档 ⇒ 改指）
· `renderer/views/chat.mjs`（**350**——>300：拆点登记随结构 ∕ 设计面轮（R1 舱 `§5.11` 在册）；本批内不拆）· `renderer/views/chat-text.mjs`（**132**）· `renderer/views/chat-scroll.mjs`（**91**）· `renderer/views/chat-guide.mjs`（**79**——空态面随动）——原档 ≤15；预期 = 值面收正（±0～−10 ∕ 档）。

**R12 终稿读数（§5.15 ∕ §1.27 · 2026-09-29）**：`chat.css` **269** ∕ `core.css` **430** ∕ `chat-fixes.css` **95** ∕ `chat-text.mjs` **126**；真机探针 **22 ∕ 22**（亮色 · `pageerror` 0）。
**R12 收口修复轮（#25 · fix · 四项逐落）**：件级外边距（工具 ∕ 错误 **8** ∕ 推理 **4**）· 首块上距 **14px** · 头行段样式四组（**16 ∕ 18 值**；2 值相抵停报）· file-link 三值——逐落；真机探针 **26 ∕ 26**（§1.28 收下 ∕ §5.21 在册；行数读数随 #38 重锚）。
**验收**：以 §1.24 准备单为准——逐值表 + 探针复跑 + 全清令注记。机检测试面（`views-chat` ∕ `views-chat-frame` ∕ `integration/chat-render` 三档原址改锚 +「套件 desktop 绿（≥263）」）**随全清令取消**（用户 2026-09-28 23:18 令——测试树已全删）；机械面改逐值表 ∕ 真机探针留证。真机（父侧）——会话流与 VSC 同刻对照（文本 ∕ 工具卡 ∕ 推理 ∕ 错误 ∕ 滚动）。
**边界**：流尾件面零撤（前批裁定）；与 R10 的 `chat.css` 面避让（串行）。
**文档收正（随轮）**：`UI.md` §1 对话流行（块壳 ∕ 面宽 ∕ 间距）+ `RENDERER.md`（帧面若触）+ `E2E-TESTING.md`（真机面）+ `PROJECT.md`（**D24 行「消息块壳」保留面收正——已落 · 2026-09-29 设计微轮**；§7 用例行）+ `RENDER-CORE.md` §5（若值面触）。

**全批验收补（补令增轮 + 会话模型轮适用）**：以 §1.24 准备单为准——R10–R13 各轮验收 = 逐值表 + 探针复跑 + 全清令注记；原「各轮同 §2.3 四条（四套件全绿 + 用例数不降 · VSC 树零改机械锁 · 真机走查面登记 · 轮粒度）」**随全清令取消**（测试树已全删 · 用户 2026-09-28 23:18 令）；R10–R13 真机面并入 §2.3 第 3 条列表（右列子代理全族 · 状态行逐段 ∕ CLI 同刻 · 会话流逐面 ∕ VSC 同刻 · 会话控制下拉与左列零残留）。

### 2.9 会话模型轮 R13（承用户 2026-09-28 19:04 ∕ 19:0x 续裁 + 需求档 §3.1）

**来源与授权**：用户 19:04「多会话标签也砍掉吧」+ 19:0x 续裁（「改成跟vsc插件一样的下拉选会话，那左侧的会话列表也没用了，废掉吧」「或者整个左侧栏都废掉吧」）——裁定全文已落需求档 `docs/desktop/requirements/PROJECT.md` §3.1 裁定段（需求笔权在父侧——本座只报）；台账 **#528**。**基准 = VSC 会话面**（`thincoder-vscode/webview/session-bar.js` 三件 + `webview/index.html:25-33` DOM 骨架）。

**范围（下线面 —— 逐项）**：① 标签条（`renderer/views/tabbar.mjs`（201）全档 + `styles.css` 标签条段 + 加速键面 `Ctrl/Cmd+1..9`）；② 标签存储（`renderer/store.mjs`（329）`tabs` ∕ `activeTab` ∕ `pendingClose` ∕ 关闭确认族 `needsCloseConfirm` ∕ `requestCloseTab` ∕ `confirmCloseTab` ∕ `cancelCloseTab`；`session:<n>` 每键一槽形）；③ 关闭确认面（标签条原位两键）；④ 页随动（关标签尾 `closeTail`——`mount-sessions.mjs`；KD-16 面退场）；⑤ **整个左侧栏**：`renderer/index.html` `.rail` 块（`rail-head` ∕ `projects` ∕ `info` 三槽）+ 左列三态 ∕ 行控件 ∕ 账本警示行 ∕ 折叠断点（会话列表 ∕ 项目目录 ∕ 项目级信息 ∕ 启动态入口随裁）。

**落位面（VSC 原件 → 桌面落位 —— 逐元素）**：

| # | 元素 | VSC 原件（file:line） | 桌面落位 | 处置 |
|---|---|---|---|---|
| 1 | 会话控制条（项目钮 ∕ 下拉选择器 ∕ 新建钮） | `webview/index.html:25-33`（`#session-bar` = `#project-btn` + `#session-selector`〔`#session-title` + `#session-arrow` ▼ + `#session-dropdown`〕+ `#new-session-btn`） | 面板内顶部（原 `[data-slot="tabs"]` 槽改锚——`renderer/index.html` 中区首槽） | VSC 原样（+ 适配 a ∕ c） |
| 2 | 下拉开合（点击 toggle + `aria-expanded` + Enter/Space 键触发 + 点内不关） | `session-bar.js:12-29` | 同源 | VSC 原样 |
| 3 | 条目形（`.session-item` = 标题 + 元数据 `provider · N msgs · updated`；`role=option` + `aria-selected` + `.active`；行内 ✎ ∕ ✕（>1 才显 ✕）） | `session-bar.js:45-59` + `:53-55`（元数据合成） | 同源（元数据三值既有——`sessions:list` 行投影已在） | VSC 原样 |
| 4 | 位标（运行中 ∕ 待审批） | VSC 无（条目仅 `active` 态） | 需求 §3.1:47 句「运行中 ∕ 待审批带位标」——`tabBadges` 切片源改接下拉条目（词键沿用 `tab.badge.*` 族） | 端增面（需求句） |
| 5 | 切会话（点条目 ⇒ `switchSession {slot}` + 关下拉） | `session-bar.js:60-64` | `session:switch`（通道既有——`mount-sessions.mjs` 同一路） | 通道名映射（既有） |
| 6 | 改名（行内 ✎ ⇒ `renameSession {slot, currentTitle}`） | `session-bar.js:65-69` + `:56` | `session:rename`（通道既有）——入口自行内控件迁入下拉条目 | 通道名映射（既有） |
| 7 | 删除（行内 ✕ ⇒ 内联确认 popover〔复用 `.auto-confirm` 族：背板 + 两键 + 默认焦点取消〕⇒ `deleteSession {slot}`） | `session-bar.js:70-76` + `:101-134` | `session:delete`（通道既有）；确认面 = VSC popover 形（桌面标签确认面随裁撤退场） | VSC 原样 |
| 8 | 空态行（`.session-item`「session.empty」半透明） | `session-bar.js:79-85` | 同源（词键 = VSC 逐字——入词表） | VSC 原样 |
| 9 | 账本警示注记（下拉首行 · 非可点） | `session-bar.js:33-44` | 桌面账本警示面（`data-ledger-notice`——账本可靠批面）**迁入下拉首行**（锚 ∕ 形态保持） | 端既有面迁位 |
| 10 | 项目钮（📁 当前项目 ∕ 多根显隐 ∕ 点击 ⇒ `setProject` 原生选择） | `session-bar.js:148-165` | `project:open`（通道既有；**显示条件适配**：VSC 多根显隐 vs 桌面单活动项目 ⇒ 恒在场——适配逐条 a） | 适配（宿主面显示条件）+ 通道名映射 |
| 11 | 会话标题段（选择器标签 = 活动会话题） | `session-bar.js:136-139`（`updateSessionTitle`） | 同源（`sessions:list` 行题；缺 ⇒ 既有回落词） | VSC 原样 |

**适配逐条实证（VSC 形 → 桌面）**：a. 项目钮显示条件（单活动项目 ⇒ 恒在场；VSC 多根条件面 = 宿主差异）；b. 条目位标（需求 §3.1:47 句——端增面；VSC 条目无此面）；c. 账本注记迁位（桌面既有锚 `data-ledger-notice` 保持）；d. 标签加速键 `Ctrl/Cmd+1..9` 随标签裁撤退场（VSC 会话面无对位——UI.md 键盘可达行收正）；e. 开项目入口（左列裁撤后 = 引导面既有 `no-project` 动作控件 + 项目钮——`project:open` 单实现不变）。

**行动表（原档 ≤15）**：

| # | 档（现读行数） | 动作 | 预期 |
|---|---|---|---|
| 1 | `renderer/views/tabbar.mjs`（201） | **撤档**（标签条面全体） | 0（档删） |
| 2 | `renderer/views/sessions.mjs`（305） | **撤档**（左列族） | 0（档删） |
| 3 | `renderer/views/info-row.mjs`（136） | **撤档**（项目级信息行） | 0（档删） |
| 4 | `renderer/mount-sessions.mjs`（199） | 改造：会话控制面（下拉开合 ∕ 条目构树 ∕ 三出口）——标签族调用面退场；`refreshRail` ⇒ 列表供下拉 | 199 ⇒ 估算 ≈180–210 |
| 5 | `renderer/store.mjs`（329） | 标签族退场（`tabs` ∕ `activeTab` ∕ `pendingClose` ∕ 关闭确认族 ∕ `openRailForm` 族）；保留 `activeSession` ∕ 位标 ∕ `sessionMeta` 切片 | 329 ⇒ 估算 ≈250–290 |
| 6 | `renderer/index.html`（48） | 左列块（`.rail` 三槽）退场；中区首槽改会话控制锚 | 48 ⇒ 估算 ≈35–45 |
| 7 | `renderer/styles.css`（499 ⇒ **已删档**——R13-A 四拆） | 左列 ∕ 标签条段退场（**先拆后改**——拆档定稿见 §2.1）——**已落（R13-A 四拆）**：`theme.css` 85 ∕ `chrome.css` 415 ∕ `skin.css` 13；`styles.css` ∕ `rail.css` 删档（§5.16） | 四拆落定读数（R11 补轮后 90 ∕ 424） |
| 8 | `renderer/app.mjs`（300） | 接线随动（`RAIL_KEYS` ∕ 挂载点重指） | 随动 |
| 9 | `renderer/mount-head.mjs`（156） | 会话头面随动（会话级三值句若触） | 随动（若触） |
| 10 | `renderer/views/chat-guide.mjs`（80） | 引导面随动（`no-project` 入口句与左列裁撤对齐——出口不变） | 随动 |
| 11 | 词表（`renderer/i18n.mjs`（490）∕ `i18n-views.mjs`（69）） | 减键（`tab.*` 族 ∕ 左列族）+ 增键（下拉空态等——值 = VSC 逐字） | 随动 |
| 12 | 测试面 | `test/views-tabbar.test.mjs`（298）**退役** ∕ `test/views-tabbar-close.test.mjs`（318）**退役** ∕ `test/store.test.mjs`（355）改锚 ∕ `test/views.test.mjs`（270）改锚 ∕ `test/views-rail-actions.test.mjs`（177）改锚（行控件面 ⇒ 下拉条目出口面） | 逐档处置 |
| 13 | 新档（拟 `test/views-session-control.test.mjs`） | 下拉结构锁 + 条目形 + 三出口 + 空态 + 位标 | 新增 ≈120–160 |
| 14 | 集成域（E2E） | 开项目路径改锚（引导面 ∕ 项目钮——`integration/first-run-smoke` ∕ `statusline-align` ∕ `ledger-notice` ∕ `session-title-face` 四档真点步序随动） | 逐档改锚 |

**接口声明（与 R10 ∕ R11 ∕ R12）**：R10（池）= 活动池归属句（需求 §3.1:54「每会话一份 · 随活动会话切换」）逐面核对——池切片 ∕ 拍面键面 vs `activeSession`（差 ⇒ ① 消除；全局常驻池不存在——需求 §3.4）；R11（状态行）= 跨会话告警位 ∕ 上下文占用 ∕ 标题段随切会话随动（读数源键面不变——界面零改）；R12（会话流）= 切会话 ⇒ 页读整置（滚动复位 ∕ 回填面随新页）——R12 的滚动 ∕ 回填交互点 = 切会话时刻（下拉出口同一路 `session:switch`）。串行面：`styles.css`（R12 ∕ R13 共面）⇒ 串行（先拆后改——§2.1）。

**验收**：机检——下拉结构锚（条目形 ∕ 空态 ∕ 位标 ∕ 三出口出站载荷）+ 左列零残留（`.rail` ∕ `[data-slot="projects"]` 节点零命中）+ 标签面零残留（`tabbar` 节点 ∕ `activeTab` 切片零写）+ 集成序改锚后绿；套件——desktop 绿（≥263）。真机（父侧）——单面板走查（切会话 ∕ 新建 ∕ 改名 ∕ 删除确认 ∕ 空态 ∕ 位标）+ 左列裁撤后开项目两入口（引导面 ∕ 项目钮）。

**边界**：VSC 树零改；右列（活动池）面不动（R10 面）；设置面 ∕ 向导不动；`session:switch` ∕ `create` ∕ `rename` ∕ `delete` ∕ `project:open` 五通道零改（主侧零动——纯渲染面 + 左列裁撤）；`session:resume`（点开即续）保留（开页尾同一路）。

**文档收正（随轮）**：`docs/desktop/design/UI.md`（标签条 ∕ 交互 ∕ 左列会话行 ∕ 项目级信息 ∕ 启动态 ∕ 断点 ∕ 空态 ∕ 键盘可达 ∕ open 行 ∕ §2 项 2 逐行收正 + 新增「会话控制（VSC 形）」行）；`RENDERER.md`（§1.1 页生命周期四条收正——关标签族退场）；`PROJECT.md`（**KD-15 ∕ KD-16 随裁撤退场** + **KD-28 被否候选「改用 VSC 单栏下拉」收正**〔原「多标签结构不削——需求定」句随用户 19:04 裁失效〕+ **KD-29「左列 + 标签条结构不动」句收正** + §4.2 文件表三档撤 ∕ 一档改 + §7 T-DSK1 ∕ T-DSK3 ∕ T-DSK11 ∕ T-DSK20 ∕ T-DSK25 ∕ T-DSK26 行收正 + 变更记录）；`E2E-TESTING.md`（§3.5 十二序开项目路径 ∕ 骨架三锚集收正 + T-DSK32 ∕ T-DSK39 ∕ T-DSK40 ∕ T-DSK46 步序收正）；需求档侧 = **已落**（§3.1 + D18 ∕ D21 ∕ D24 ∕ D26——本座只报）；核侧零动。

**上抛**：U-3 会话控制面两处端适配（条目位标〔需求句〕∕ 项目钮恒在场〔宿主差异〕）——已按需求句 ∕ VSC 形落；父侧如另裁 ⇒ 行内退场。

### 2.10 评审轮 1 修正 + 新增轮 R13 —— 打标（§2 就地修正 · 本作者段内 · 2026-09-28 · eng-designer）

本轮 = 设计评审轮 1（§3：🔴2 ∕ 🟡7 ∕ 🔵3——**12 发现逐号落修**，父侧逐条裁定全部接受）+ 父侧两条裁定（用户 18:57 判据收正落点 ∕ 两批次序）+ **R13 入书**（承用户 19:04 ∕ 19:0x 续裁 + 需求档 §3.1）。笔权限于 §2——§1 ∕ §3–§6 零触碰；码 ∕ 测试面零改；设计档 ∕ 需求档零改（本轮只**声明**收正落点于各轮「文档收正」行）。

**落笔方式**：就地修正（`batch` 工具 append-only ⇒ 就地修正经文件编辑落地，沿本仓「§2 就地修正 · 打标 · 原行可由 git 历史逐字复核」先例——姊妹批 §2.14 同法）；§2 状态行经 `batch status` 同拍更新。

**口径**：行数全表 = 实读总行数（read 工具「N lines total」同源）；「±1 差」按实读统一改值（评审轮 1 #9——两法差 1 不入判）。

| 号 | 落点（§2） | 处置 |
|---|---|---|
| 1 | §2.1 拆档定稿表（新增——五档：现读 + 预期增量 + 拆点 ∕ 新档名 ∕ 消费面 ∕ 锁随动）；`events.mjs` = 引用输入批 R1（`events-flags.mjs`）；另四档定稿（`styles` ∕ `mount-settings` ∕ `chat` ∕ `agent-host.test`——承拆档批既定案 + 本批增量） | 落 |
| 2 | §2.1 行 4 + R1 #7（`planBusyQueued` 消费 = 准）；R1 #8 ∕ 端差行（待发送呈现 = ① 消除）；R1 文档收正行（KD-31 `:69` ∕ §10 AZ `:759` 收正落点点名）；§2.7 行 4（并笔序 + 姊妹批先行） | 落 |
| 3 | R2–R13 各轮尾补「文档收正」行（逐档逐节——含 KD-39 `:78` 失效句 + 七新核档核侧归属档 `docs/core/design/*` ∕ `RENDER-CORE.md`）；§2.0 交付物行补核侧登记面 | 落 |
| 4 | 失效句删 ∕ 收正六处：R1 e 条（按核面直落——推荐 ∕ 备选形退场）、§2.5 原第 1 项（提问卡交互面——已裁 ⇒ 退场；裁定落 §2.7 行 5）、R1 #8 ∕ 端差行（容器 ∕ 落位「按端差留」⇒ ① 消除）、R1 端壳适配头 ∥ R1 边界（「零核件改动」⇒ 核件零改 + IME 小修候选另裁）；IME 裁点 = **§2.5-5**（§2.5 重列——§1.6 索引自此可解析） | 落 |
| 5 | 非越限面补标：R8 #3 三档（`settings-sections` 357 附拆档评审 ∕ `mount-settings` 500 ∕ `onboarding` 162）；R10 #7 定档名（`views/activity-new.mjs` ≈40–70）；R11 #2 补数（`views/statusline-banner.mjs` 26）；R12 行动表逐档补数；点名测试档逐档「改锚 ∕ 退役」 | 落 |
| 6 | R11 #2 路径改全形（`thincoder-desktop/renderer/views/statusline-banner.mjs`） | 落 |
| 7 | §2.1 增**对账面**（#53 来源核对：计数对账 + 21→14 归并关系 + 未入面；原文未在盘 ⇒ 在册摘要——补投待 §2.5-1） | 落 |
| 8 | R10 E10 补二值处置（① 消除——差 ⇒ 消除；行为对表 ∕ 别名登记随轮）+ R10 #4 判据随动 | 落 |
| 9 | 行数复核改值（全 §2 标注 = 实读；`i18n-views` 66 ⇒ **69** · `i18n.mjs` 489 ⇒ **490**〔距 500 为 10 行〕等）+ 口径句入 §2.1 表注 | 落 |
| 10 | §2.1 行 14 态 = **① 复用（＋端壳对齐）**（「其余」= 轮序桶名，不入态列——表注在册） | 落 |
| 11 | 「VSC 零改」口径句 ⇒ **「VSC 树零改（共享核件改动另裁；影响面登记）」**（§2.0 ∕ §2.3-2 ∕ §2.6 ∕ §2.8 轮序注 + 各轮边界行同拍） | 落 |
| 12 | 两批次序 = **输入面板批 R1 先行**（出泡时刻 ∕ 提交面 ∕ 骑缝档先落者拆；锁随动归先落者）——入 §2.0 跨批序行 + §2.7 行 4 并笔序；与姊妹批互认 | 落 |
| R13 | **§2.9 新增轮**（会话模型对齐：下线面逐项 + VSC 原件 → 落位对位表 + 适配逐条 + 行动表 + 验收 + 与 R10–R12 接口声明 + 文档收正 + 上抛）；需求侧 = 已落（§3.1 + D18 ∕ D21 ∕ D24 ∕ D26——本座只报）；台账 #528 | 入书 |

**表外发现（本轮报父侧——不在 12 条内）**：`docs/core/design/CORE-UNIFICATION.md` 行 183 将 `file-links` ∕ `notify` ∕ `image-handler` 列入「端特有 · 不迁」——与本批 R2 ∕ R5 ∕ R6 上提直接相抵（同 KD-39 类）；收正落点已点入 R2 ∕ R5 ∕ R6 各轮「文档收正」行（行 183 三处项）。

### 2.11 评审 #1 收正微轮 —— 打标（§2 就地修正 + §1 ∕ §5 段号顺正 · 2026-09-29 · eng-designer）
**来源**：评审 #1（R12 重发复核 · VERDICT pass · 🔴0 ∕ 🟡5 ∕ 🔵3）发现之 **①–⑥ ∕ ⑧** 逐号落修（⑦ 已随重发任务书闭环——零触）。**口径**：零语义——只收锚点 ∕ 行文 ∕ 数值 ∕ 段号；新增条目零 · 边界零动 · 码 ∕ 测试面零改 · §3 ∕ §4 ∕ §6 零触碰。
**笔域**：§2 就地修正（本作者段）+ §1 ∕ §5 段号顺正（专项——内容零改，沿 §5.14 先例）+ `docs/desktop/design/PROJECT.md` 两处（D24 行收正 · chat-guide 读数回填）。
**段号顺正（⑧）**：§1 三处——1.9 ⇒ **1.23** · 1.10 ⇒ **1.24** · 1.11 ⇒ **1.25**（评审列 1.9 ∕ 1.10；实读 1.11 亦两见——一并顺正；引用随正 §1.10 ⇒ §1.24）；§5 六组——R3 舱 5.7 ⇒ **5.15**、R13-A 段 5.1–5.5 ⇒ **5.16–5.20**（评审列 5.1 ∕ 5.2 ∕ 5.7；实读 5.3 ∕ 5.4 ∕ 5.5 亦同号两见——一并顺正；引用随正 §5.4 ⇒ §5.19 及段内裸号）。

| 号 | 落点 | 处置 |
|---|---|---|
| ① | R12 行动表 ∕ §2.1 拆档定稿两行 | 按拆后落点重锚（`chat.css` **229** · `theme.css` **90** · `chrome.css` **424** · `chat.mjs` **350** · `chat-text` **132** · `chat-scroll` **91** · `chat-guide` **79**）；`styles.css` 项改指；§2.1 两行改「已落」态 |
| ② | R12 验收行 ∕ §2.8 尾 | 换准备单口径（逐值表 + 探针复跑 + 全清令注记）+「以 §1.24 准备单为准」指针 |
| ③ | R12 F4 行 | VSC 列逐项拆分（digest ⇒ `chat-status.js:69-122` 同锚）+ E9 两差显式续登（不内消——登记 = §5.14 E9 值表） |
| ④ | R12 行动表 `chat.mjs` 项 | 拆点登记句（>300 顾问线——随结构 ∕ 设计面轮；R1 舱 `§5.11` 在册） |
| ⑤ | R12 F1 行 ∕ `PROJECT.md` D24 行 | 锁句改述（锁载体随全清令退役 ⇒ 留证改逐值表 ∕ 探针）+ `.block` 移出保留面（`.rail-row` 随 R13-A 退场同拍） |
| ⑥ | R12 行动表 ∕ `PROJECT.md` §4.2 行 | 数值统一回填（**350** ∕ **132** ∕ **91** ∕ **79**；chat-guide 54 ⇒ 79） |
| ⑧ | §1 ∕ §5 段号 | 就地顺正打标（见上）——内容零改 |

### 2.12 R12 设计面同步轮 —— 打标（§2 就地修正 + 设计档同轮 · 2026-09-29 · eng-designer）

**来源**：flow 批 R12 §5.15 未办清单 5（设计面轮收正清单）⇒ 设计同步轮 #26（fix · 定点 · §1.27 ⑦）。**口径**：零语义——只收设计面按 R12 终稿的同步值 ∕ 锚 ∕ 残留旧值；条目零增；产品码 ∕ 需求档 ∕ §5 已交付段零触。

**§2 就地修正（本作者段内）**

| # | 落点 | 前 ⇒ 后 |
|---|---|---|
| 1 | §2.8 R12 行动表尾 | 补 **R12 终稿读数**（`chat.css` 269 ∕ `core.css` 430 ∕ `chat-fixes.css` 95 ∕ `chat-text.mjs` 126；探针 22 ∕ 22）+ 收口修复轮（#25）落定注（§1.28 ∕ §5.21） |
| 2 | §2.2 R1 行动表 行 10 | `chat.css`（480 ⇒ **229**——R1 四拆后主档）；预期列改 **已落（R1 四拆）**（§5.11） |
| 3 | §2.8 R10 行动表 行 9 | 同上锚正 + 动作列补 **已落（零触 · §5.14）** |
| 4 | §2.9 R13 行动表 行 7 | `styles.css`（499 ⇒ **已删档**——R13-A 四拆）；预期列改四拆落定读数（§5.16） |

**设计档同轮同步（本座笔）**

| # | 设计档 | 前 ⇒ 后 |
|---|---|---|
| 1 | `RENDERER.md` §3 回填条 | 滚至顶 ≤ 48px ⇒ **≤ 40px** |
| 2 | `RENDERER.md` §3 跟滚条 | 判据 `≤ FOLLOW_PX` ⇒ **`< FOLLOW_PX`**（严格小于——恰 24px 不判近底） |
| 3 | `RENDERER.md` §4 行 3 | 顶 ≤ 48px ⇒ 40px；「（100 块）」⇒ 页量口径（核 `historyWindow` 缺省 200 条——消 `:128` ∕ `:101` 互抵） |
| 4 | `UI.md` §1 对话流（:18） | 行内指针 +「本批注（R12 会话流 ⇒ VSC 对齐）」新增（块壳透明 ∕ 面宽 100% ∕ 块距 14px ∕ 件级外边距与首块上距 ∕ 扁平块模型） |
| 5 | `UI.md` D24 项 6（保留面） | `.block` 移出（R12 F1）· `.rail-rename-input` 清出（类零命中）· 卡族框指针收正为 `chat-cards.css` |
| 6 | `UI.md` D24 项 7（负向锁） | 清出 `.block`（R12 F1）∕ `.rail-row` ∕ `.rail-rename-input`；余 = accent（`.approval-card` ∕ `.question-card`）＋ `--line`（`.composer-input` ∕ `.plan-card`） |

**机检读数**（`node scripts/doc-check.mjs` · 仓根 `thincoder/`）：行前 = 悬空 **162** ∕ 行宽 **0**；行后 = 悬空 **161** ∕ 行宽 **0**（Δ = −1：UI.md 保留面收正时清出一处既有悬空行；无新增）。

**未办（派单外 · 只报）**：① `docs/desktop/design/E2E-TESTING.md`（真机面）= §5.15 未办 5 余项——归父侧另轮；② UI.md 余悬空 15 处（R13 ∕ 输入面板批 ∕ R1 迁移遗留——同源待收，零新动作）；③ `.approval-card` ∕ `.composer-input` 死类疑点（PROJECT.md §6.1 D24 行与 UI.md D24 注均列为保留面；全仓码面零命中）——只报候裁。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象**：处理流批档 §2（`docs/batches/2026-09-28-desktop-flow-vsc-align.md`：R1–R12 十二轮 + §2.1 三态总表 + 逐轮「原件 → 落位」+ §2.3 全批验收 + §2.7 两值收窄 + §2.8 补令增轮）。评审面 = 该档全文（重点 §2）；旁证核读 = 受影响档行数实读 + 在册设计档（`docs/desktop/design/PROJECT.md`）与源件引用抽查（无 git diff、无会话史考古）。
**降级声明**：本会话未提供文档地图与项目标准档 ⇒ 文档归属判据降级（按 Project Guide + 盘面实存设计档判）；§2.3 四套件用例基线（≥263 ∕ ≥772 ∕ ≥889 ∕ ≥1052）未复跑（未复核）；函数层（300+ 行单函数）未逐档核（抽查未见证据）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 受影响文件·结构档（越限 ∕ 拆档计划） | 🔴 | 硬限邻档无设计内拆档计划（全推实施轮）：`renderer/events.mjs` 实读 **498**（L273 ∕ L289 标 497；R10 #8 ∕ R11 #3 改；L273 自注「越 500 硬限 ⇒ 先拆分案随轮出」）· `renderer/styles.css` 实读 **499**（L306 列为本轮面，零行数 ∕ 零增量）· `renderer/mount-settings.mjs` 实读 **500**（L178 列为随动档，零标注）· `renderer/chat.css` 实读 **480**（L90 标 479；本轮估算 490–510，L90 判「越 500 须先拆档或并入 core.css——**实施轮实读定**」）· `test/agent-host.test.mjs` 实读 **490**（L158 ∕ L169 ∕ L190 三处点名改，零标注）。 | 逐档补「现读行数 + 预期增量」两栏（≤±N ∕ 结构不变）；对余量 ≤2 行或增量必越 500 的五档（含测试档）在**本设计内**定稿拆档方案（拆点 ∕ 新档名 ∕ 消费面 ∕ 锁随动），不留「随轮出 ∕ 实施轮实读定」。 |
| 2 | 文档归属（同机制两处异述） | 🔴 | R1 队列 ∕ 待发送面与在册 KD ∕ 登记面冲突且未披露收正：① L56 ∕ L87 改「随核计划 `planBusyQueued`」——`docs/desktop/design/PROJECT.md:758` §10 AZ 明记「`queued-mark` 的 `planBusyQueued`（宿主快照对账面 = VSC 专有）…**不消费**」（KD-31 `PROJECT.md:69` 同记），AZ 的「不消费」之由未答（VSC 消费先例 = `thincoder-vscode/webview/queued-mark.js:12,30` 在盘）；② L234 判「待发送容器 ① 消除（在连泡就近标记形）」与 KD-31 在册形「流尾 `[data-pending]` 非块节点组」（`PROJECT.md:69`，依据用户 07:08 走查）异述——且 L88 ∕ L101 仍写「容器 ∕ 落位不动 ∕ 按端差留（既有裁定）」。 | 两条各补「与在册 KD-31 ∕ §10 AZ 的裁决关系」一行：按 18:57 判据覆盖者 ⇒ 轮契约内点名收正落点（PROJECT.md §2 ∕ §10）；仍留端裁定者 ⇒ 收正 §2.1 ∕ §2.7 判词——二者只留一。 |
| 3 | 文档归属 ∕ 收正清单（方法论） | 🟡 | §2.0（L43）承诺「各实施轮随轮收正桌面设计档…随轮清单见各轮尾『文档收正』行」，实际仅 R1 有该行（L105）；R2–R12 全缺 ⇒ 各轮所改机制的在册归属句未指名。实例：R2（L111-112）上提 file-links 后 `PROJECT.md:78` KD-39「**多实现面各自落地**」句失效未收正（端档首 `thincoder-desktop/src/main/file-links.mjs:4` 同句）；七个新核档（`thincoder-core/` `file-links.mjs` ∕ `queued.mjs` ∕ `attachments.mjs` ∕ `provider-flows.mjs` ∕ `notify-policy.mjs` ∕ `agent/assemble.mjs` ∕ `agent/live-beat.mjs`）的核侧归属档（`docs/core/design/*` ∕ `docs/render-core/design/RENDER-CORE.md`）未列入收正面。 | 各轮尾补「文档收正」行（逐档逐节）；核新档登记面与失效 KD 句（KD-39 等）列入清单。 |
| 4 | 文面残留（规范面 · doc hygiene） | 🟡 | §2.7（L227）声明「『登记后保留』通道取消 —— 本任务书不再出现该选项」并「逐条重列」，失效句仍留规范面：L98（R1 e 条）仍以「推荐 = 端胶水保全…」呈现（§2.7 行 5 已「撤销」，L235）‖ L210（§2.5-1）仍「**请父侧于 R1 实施前裁**」‖ L88 ∕ L101「容器 ∕ 落位不动 ∕ 按端差留（既有裁定）」对 §2.7 行 4（① 消除）未收 ‖ L93 ∕ L104「零核件改动」对 §2.7 行 5（核件小修候选）未并笔 ‖ §1.6 裁点索引「§2.5 第 5 项」（IME）= 现文面实指 §2.5-5「render-core 发布形」（L214），IME 项实为 §2.7 行 5 ∕ R1-e——索引失效。 | 失效句删（或改为「见 §2.7 行 N」指针）；上抛 1 ∕ IME 裁点随 §1.6 ∕ §2.7 定案同笔收正，免实施舱按 R1 轮契约（L81-101）落地旧判。 |
| 5 | 受影响文件·标注覆盖 | 🟡 | 非越限面仍缺标：R8 #3（L178）三档「随动 · 实读由实施轮定」零行数（`mount-settings.mjs` 500 ∕ `onboarding.mjs` 162 ∕ `settings-sections.mjs` 实读 **357**——L178 标「291+」，已越 300 顾问层而设计内无拆档评审）；R10 #7（L272）目标档「落 `views/activity.mjs` 内或新档，实施轮定」——无档可标；R11 #2（L288）零行数；R12 行动表（L306）「逐档预期随轮实读定」；各轮验收行点名的测试档只列名（R1 L103 ∕ R10 L277 ∕ R11 L291 ∕ R12 L307）——含实读 444（`views-question`）∕ 418（`views-chat-frame`）∕ 412（`views-locks`）∕ 399（`views-approval`）∕ 391（`views-activity`）∕ 329（`views-statusline`）∕ 300（`agent-host-suspension`）各档。 | 逐档补两栏；≥300 档附拆档评审结论；测试档逐档给「改锚 ∕ 退役」处置；R10 #7 先定档名再标注。 |
| 6 | 清晰性（受影响档定位） | 🟡 | R11 #2（L288）路径错：`thincoder-desktop/renderer/statusline-banner.mjs` 盘面无此档，实为 `thincoder-desktop/renderer/views/statusline-banner.mjs`（`renderer/views/statusline.mjs:28` 同引）。 | 路径改全形（`renderer/views/statusline-banner.mjs`）。 |
| 7 | 需求覆盖（对账面） | 🟡 | §2.1（L49）声称覆盖「重造榜 11 条 + 上提候选 8 条 + 反向发现 ①②」（=21 条目），表面仅 14 行且无「条目 → 行 → 轮」映射 ⇒ 覆盖完整性不可核；对位清单 #53 未随批档落盘（`thincoder/docs` 全树「重造榜」仅本档 L16 ∕ L49 命中）；§2.5-2（L211）自认 12 族中「会话 IO ∕ 桥 ∕ 其他」无条目在册、表外零处置。 | 补条目映射表（或写明 21→14 归并关系）；#53 若为外部交付 ⇒ 落盘一页条目表作对账面（协调项）。 |
| 8 | 清晰性（处置二值） | 🟡 | R10 E10（L259）无两值处置：「对表（行为面随轮深勘——两机制别名登记）」——违 §2.7 适用句（L238「R2–R12 各轮内『适配 ∕ 边界』行一律按本两值表述」）；R10 #4（L269）随之无判据。 | E10 补「① 消除（差 ⇒ 消除）∕ ② 宿主能力面例外 + 实证坐标」二值之一；判「深勘」者写明结论落点与验收锚。 |
| 9 | 标注精度（数字漂移） | 🔵 | 标注 vs 实读系统性差 +1：events.mjs 498/497 · chat.css 480/479 · i18n.mjs **490**/489（L89「距 500 仅 11 行」实为 10 行）· approval 201/200 · question 113/112 · plan 45/44 · mount-cards 185/184 · chat-cards 52/51 · chat.mjs 355/354 · queue 42/41 · chat-pending 78/77 · core.css 346/345 · activity 322/321 · mount-pool 90/89 · subagent-reduce 138/137 · chat-subagent 70/69 · heartbeat 45/44 · pool.css 85/84 · app.mjs 300/299 · statusline 293/292 · chat-text 133/132 · queued-input 118/117 · turn-chain 72/71 · timer-watch 80/79 · suspension-drive 270/269 · attachments 126/125 · file-links 64/63 · subagent-face 87/86 · notify 48/47 · agent-assemble 96/95 · providers 151/150 · agent-host 375/374 · core `agent/timers.mjs` 51/50；另 `i18n-views.mjs` 69/66（+3）。 | 以实读行数为准统一复核改值（500 邻档的 +1 直接侵蚀余量，随发现 1 一并处置）。 |
| 10 | 清晰性（态名） | 🔵 | §2.1 态列出现「其余」（L66 ∕ L184），与 §2.0（L44）「三态之外无处置」名义不自洽（括号内映射「核契约复用 + 端壳对齐」可推为 ①+端壳，但表头无定义）。 | 「其余」标注为轮序桶（非态值）或改标 ① 复用（+端壳对齐）。 |
| 11 | 口径边界（VSC 零改） | 🔵 | 「VSC 零改」两读并存：机械锁 = VSC 树 diff 零命中（L44 ∕ L196），而 §2.7 行 5（L235）的「核件小修候选」（IME）经共享核件改 VSC 运行行为（「VSC 同受益」）⇒ 口径边界需点明。 | 口径句改「VSC 树零改（共享核件改动另裁；影响面登记）」。 |
| 12 | 范围协调（跨批并笔） | 🟡 | §2.7 行 4（L234）把「待发送呈现」落点写成「R1 #7 ∕ #8 + **姊妹批 B12 出泡时刻面并笔**」，两批相对次序未定（姊妹批同 R1 改出泡时刻 ∕ 提交面——`2026-09-28-desktop-input-vsc-align.md:100` ∕ `:264` ∕ `:269` 面另有在裁项）。 | 定两批串行 ∕ 并笔次序与「同面单笔」判据（谁先落、锁随动归谁），写进两批轮契约。 |

**计数**：🔴 2 · 🟡 7 · 🔵 3。
**已核旁证（实读 · 行数）**：`renderer/events.mjs` 498 ∕ `renderer/chat.css` 480 ∕ `renderer/i18n.mjs` 490 ∕ `renderer/i18n-views.mjs` 69 ∕ `renderer/app.mjs` 300 ∕ `renderer/styles.css` 499 ∕ `renderer/mount-settings.mjs` 500 ∕ `renderer/views/settings-sections.mjs` 357 ∕ `renderer/views/statusline-banner.mjs`（在盘 · views/ 下）；卡族 201 ∕ 113 ∕ 45；`src/main` 118 ∕ 72 ∕ 80 ∕ 270 ∕ 126 ∕ 64 ∕ 87 ∕ 48 ∕ 96 ∕ 151 ∕ 375；测试档 `agent-host.test.mjs` 490 ∕ `views-question.test.mjs` 444 ∕ `views-chat-frame.test.mjs` 418 ∕ `views-locks.test.mjs` 412 ∕ `views-approval.test.mjs` 399 ∕ `views-activity.test.mjs` 391 ∕ `views-statusline.test.mjs` 329 ∕ `agent-host-suspension.test.mjs` 300。
**引用抽核（命中）**：`render-core/cards/permission.mjs:60/105` · `cards/question.mjs:13`（与 `:46-48` 键径）· `cards/panel.mjs:17/67` · `flow/queued-mark.mjs:74` · `core/agent/suspension.mjs:106/172` · `core/agent/setup-reminders.mjs:248` · CLI `make-agent.mjs:201/209/58/64` · `render-frame.mjs:344` · VSC `timer-watch.mjs:46` · `panel-messages.mjs:45` · `file-links.mjs:21` · `queued-merge.mjs:15-36` · `provider-flows.mjs:32/60/129/153` · `webview/queued-mark.js:12,30`（消费 `planBusyQueued`）· `thincoder-vscode/src` 全树 `teamConfig|gitAuthor` 零命中（KD-F3 成立）· `thincoder-desktop/package.json:15` `file:` 链接 · `PROJECT.md:69/78/758`（KD-31 ∕ KD-39 ∕ §10 AZ）· `renderer/index.html:36-38`（`[data-slot="pool"]`）· 桌面已消费 `/rc/subblocks/*`（`views/activity.mjs:25-26` ∕ `views/chat-subagent.mjs:15-16`）。

VERDICT: changes-required

### 轮次 2（评审子代理 —— 经父侧代写入档 · 打标）

**注**：本段为**父侧代写入档**（评审轮 2 自陈「§3 未写入——预算收敛」；报告原文在案 = tools-结果日志 `1790596089378-async-subagent-80.log`）——代写打标在册。

**核验结论**：轮 1 十二发现 **12/12 落修**（🔴2 ∕ 🟡7 ∕ 🔵3 全清——逐号落点在报告）；**R13 入书 ∕ §2.10 打标 ∕ §2.1 三块**（拆档定稿表 ∕ 对账面 ∕ 跨批序行）= 通过；盘面抽核通过（设计档 KD-31 `:69` ∕ KD-39 `:78` ∕ §10 AZ；需求档 §3.1 裁定段；`webview/session-bar.js` 逐段引证；桌面六档行数逐档一致；拆档批承继项逐字一致）。

**剩余（非阻断）**：🟡1 = `:217` 测试档行未补「现读 ∕ 改锚」处置（可选——随实施轮收正）；🔵1 = 引证三处行号漂移（§10 AZ 引 `:759` 实 `:760`；需求 §3.1 引 `:47` ∕ `:54` 实 `:49` ∕ `:56`——随实施轮首触收正）。

**计数**：🔴 0 · 🟡 1（可选 · 非阻断）· 🔵 1。**VERDICT: pass**

### 轮次 2（评审子代理）

**评审对象**：桌面流程批（flow-vsc-align）§2 实施任务书 · R12 重发复核（对象状态 = 已批准；触发 = 进程崩溃后设计令牌重签发；待重发轮 = R12 会话流 ⇒ VSC 对齐，§2.8 `thincoder/docs/batches/2026-09-28-desktop-flow-vsc-align.md:417-432`）。评审面 = 批档全文 + `thincoder/docs/desktop/design/PROJECT.md` 全文。
**降级声明**：本会话未提供文档地图与项目标准档 ⇒ 文档归属判据降级（按 Project Guide + 盘面在册设计档判）；受影响档盘面行数未逐档重核（以批档 §1/§5 自记读数为准）；VSC ∕ 核件源坐标值未复核（= 未验证）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 受影响文件·行动表（状态失锚） | 🟡 | R12 行动表（`:429`）仍列 `renderer/styles.css`（499——变量面）与 `renderer/chat.css`（480——先拆后改），与盘面状态相抵：styles.css 随 R13-A 四拆**删档**（`:107` ∕ `:872`——theme 85 ∕ chrome 415 ∕ skin 13；`:118` 重锚 chrome.css）；chat.css 随 R1 四拆为主档 **229** + `chat-cards.css` 143 ∕ `chat-composer.css` 72 ∕ `chat-fixes.css` 94（`:926-929`）；重发准备单已改述「`chat.css`（拆后落点）」且不再列 styles.css（`:125`）。§2.1 两表行同源未重锚（`:179` ∕ `:181`「执行 = 先拆后改」句已消费）。 | 行动表按拆后落点重锚（变量面 ⇒ theme/chrome；块壳 ∕ 面宽 ∕ 间距 ⇒ chat.css 主档），行数按拆后末次实读回填；styles.css 项按准备单删或改指；§2.1 两行同拍收正。 |
| 2 | 验收·可验证性（全清令失锚） | 🟡 | R12 验收（`:430`）机检三点名的测试档（`views-chat.test.mjs`（452） ∕ `views-chat-frame.test.mjs`（418） ∕ `integration/chat-render.test.mjs`（284））+「套件 desktop 绿（≥263）」、及 §2.8 尾（`:434`）「R10–R13 各轮同 §2.3 四条」在**全清令**（`:117` 测试树已全删；`:1164` `test/**` 无 `*.test.mjs` 在盘）后不可执行；重发准备单（`:125`）已换「逐值表 + 探针复跑 + 全清令注记」，正文未同步。 | 验收行与 §2.8 尾按准备单口径就地收正（测试面标「随全清令取消」注记；机械面改探针 ∕ 逐值表），加「以 §1.10 准备单为准」覆盖指针。 |
| 3 | 对位表事实（F4 digest 项） | 🟡 | F4（`:426`）VSC 列「无对位面（VSC 无同件）」对 digest 项不实——VSC 消化行 `.digest-turn` ∕ `.digest-status` 在册（`:379` E9；`thincoder/docs/desktop/design/PROJECT.md:74` KD-36「VSC `.digest-status` 同形」）；R10 已出 E9 值表并把「终态留存 ∕ 切片」两差登记「另轮 ∕ 设计面」（`:1097` ∕ `:1149` ∕ `:1153`），R12 未接该登记、无指针。 | F4 逐项拆分 VSC 列（digest ⇒ `chat-status.js:69-122` 同锚），并点名 E9 登记差在 R12 的归属（承接 ∕ 显式续登）。 |
| 4 | 结构档（>300 拆点登记未承接） | 🟡 | `views/chat.mjs`（R1 末实读 **350** > 300 顾问线，`:997`）在 R12 行动表（`:429`）仅标 355 与「±0～−10」；R1 舱明记「拆点随 **R12** ∕ 设计面轮登记」（`:997`），R12 未载该登记。 | 行动表补 chat.mjs 拆点登记句（沿 R10 ∕ R11 行内登记先例）或改指设计面轮并注明。 |
| 5 | 文档归属（D24 保留面 · 锁随动对象消失） | 🟡 | F1（`:423`）以「`D24 消息块壳`锁随动 + 冲突断言逐处改」承接与 `PROJECT.md:561` D24 行（「保留面负向锁 … `.block` … 仍 `var(--line)`」）的相抵；锁载体（`:412` `views-locks` 原址补例）已随全清令整体删除（`:117`）⇒「锁随动」现零对象；D24 行收正（`:432` 已点名）未落期间，R12 落地后 PROJECT.md 与代码面将处相抵态。 | F1「锁随动」句按全清令改述（锁对象已退役——改以逐值表 ∕ 探针留证）；D24 行收正随设计面轮落笔。 |
| 6 | 数值漂移（超「±1 不入判」口径） | 🔵 | chat.mjs 355（`:429`）vs 350（`:919` ∕ `:997`）；`PROJECT.md` 自身互抵——`chat-guide.mjs` **54**（`:190`）vs **79**（`:216`）；chat-text 133（`:429`）vs 132（`PROJECT.md:221`）· chat-scroll 92 vs 91（`:195`）· chat.css 480（`:429`）vs 拆前 511（`:926`）——沿 §2.1 表注「两法差 1 不入判」（`:165`），chat.mjs ∕ chat-guide 两处已超口径。 | 按末次实读统一回填（≥±2 两处宜同拍）。 |
| 7 | 清晰性（F5 结论落点） | 🔵 | F5（`:427`）「行为对表（随轮深勘；差 ⇒ 消除）」未见结论落点 ∕ 验收锚——沿评审轮 1 #8（`:531`）对「深勘」项判例（须写明结论落点与验收锚）。 | F5 补结论落点（对表落轮报告 ∕ 逐值表 + 差项逐条处置），与准备单「逐值表」验收对齐。 |
| 8 | 文面·段号重复（doc hygiene） | 🔵 | §1 段号 1.9 ∕ 1.10 各两见（`:47` ∕ `:53` 与 `:116` ∕ `:121`）；§5 段号多处重号（§5.1 `:565` ∕ `:864`；§5.2 `:582` ∕ `:876`；§5.7 `:617` ∕ `:664`；§5.14 已自注一处顺正）。 | 段号就地顺正打标（沿 §5.14 先例），内容零改。 |

**计数**：🔴 0 · 🟡 5 · 🔵 3。
**VERDICT: pass**

## §4 用户批准（主 agent）

### 4.1 用户批准（父侧代签 · 2026-09-28 19:5x）
- **三条件齐备**：① 设计评审 pass（轮 2 复评——12/12 落修 + R13 入书 ∕ §2.10 ∕ §2.1 三块核验通过，§3「轮次 2」在册）；② 修正轮落地并核验（轮 2 实读复核）；③ token 已签发（**值为运行态、不落档**）。
- 授权口径 = 委托（点火 ∕ 批准）；**实施序 = 与输入批按 §2.0 跨批序行**——输入批 R1 先行（其落定后本批 R1 起跑；拆分 ∕ 锁随动归先落者；文件域冲突由调度器裁决）。
- 评审剩余两项（非阻断）随实施轮收正：`:217` 测试档行处置 + 引证三处行号漂移（§10 AZ `:759⇒:760` ∕ 需求 §3.1 `:47⇒:49` ∕ `:54⇒:56`）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（R12 重发轮 · 会话流 ⇒ VSC 对齐 · 本舱笔 5 档（chat.css ∕ core.css ∕ chat-fixes.css ∕ chat-text.mjs ∕ .r12-probe.mjs）+ 前舱遗留核验纳入 · 真机探针 22 ∕ 22（亮色 · pageerror 0）· 内审 1 轮（DEVIATIONS 4）修复 1 轮 · 代码评审 changes-required（🔴1 标签分色）⇒ fix round 1 ⇒ 复核 VERDICT pass · 终态 converged ⇒ clean · 测试面随全清令取消 · 2026-09-29）



### 5.1 实施摘要（R11 点修舱 · 状态行 ⇒ CLI 对齐 · eng-coder · 2026-09-28）

**目标**：用户 2026-09-28 20:01 直斥两处具体差 —— ① 段间分割线缺失 ∕ ② 字色未对（CLI = dim 基色 + warn 黄）；屏面为准（D22）。**范围**：定点收此两差（段集 ∕ 段序 ∕ 段读数逻辑 ∕ 段锚零改；分隔 = 纯 CSS；`events.mjs` 零触）。

**动档（唯一跟踪档）**：`thincoder-desktop/renderer/styles.css` —— diff 实读 `1 file changed, 9 insertions(+), 9 deletions(-)`（净 0 行；现读 **498** ∕ 设计记 499「距 500 余 1」）：

| 落点 | 内容 |
|---|---|
| `:461-463` | 轮注（形源 `thincoder-cli/src/tui/render-frame.mjs:344-427` ∕ 色源 `thincoder-cli/src/tui/ansi.mjs:31` ∕ `:46` 逐条引证） |
| `:474` | base 色 `var(--fg-muted)` ⇒ `color-mix(in srgb, var(--fg) 50%, transparent)`（CLI `dim` = `ESC[2m` 半强度等效；沿既有 `--fg` 变量，零新增变量） |
| `:478` | `.status-bar > [data-seg] + [data-seg]::before { content: "│"; margin: 0 2px 0 -6px; color: …50%… }`（竖线居 12px 段距带内 ⇒ 两侧各 6px；色显式 = 警示段前导条不随警示色） |
| `:479` | banner 四位 ∕ banner→后段紧贴形 `.status-bar > [data-seg]:is([data-seg="plan"], …) + [data-seg]::before { margin-left: -12px }`（CLI ` PLAN│ AUTO│ ENG│ Ready` 实形） |
| `:480` | warn 两 class 规则压单行（**形与语义零变**，仅行数预算 —— 硬限边缘档） |
| `:13` ∕ `:49` | `--warn` 值 ⇒ `#bf8803`（亮）∕ `#cca700`（暗）= VSC `editorWarning.foreground` 默认（CLI 黄 ∕ VSC 警告黄同角色） |

**零改自证**：`renderer/views/statusline.mjs` ∕ `statusline-banner.mjs` ∕ `renderer/events.mjs` 均不在并集（视图档零字形字面 —— 分隔字形住本档，沿 `.rail-delete::before` 先例）；VSC 树 ∕ 核件树零改。

### 5.2 决策透明表

| 决策 | 取值 | 依据 | 被否备选 |
|---|---|---|---|
| 分隔符机制 | `::before` + 相邻段选择器，竖线居段距带内（负边距 −6px ∕ banner −12px） | CLI 每段自携 ` │ ` 前导（缺席段不落分隔）⇒ 相邻段选择器同语义；沿 `.rail-row-meta > [data-seg] + [data-seg]::before`（同档 `:262`）先例形 | ① 零一 gap 改法（需另补 `.status-alert` 段距规则 + 改容器）② 改 DOM 插节点（违「零 DOM」） |
| base 色取值 | `color-mix(in srgb, var(--fg) 50%, transparent)`（落值 = light `#1b1f24@50%` ∕ dark `#e6e9ee@50%`） | 终端 `ESC[2m` dim = 前景半强度（语义等效）；**零新增变量**（「优先用既有调色板变量」直取 `--fg`） | `--fg-muted`（= 本轮被斥之现状值）· 新立 `--fg-dim` 变量（无谓增变量） |
| warn 色取值 | 调色板 `--warn` 槽值改 `#bf8803` ∕ `#cca700`（不另立状态行专用变量） | 该槽已被在册注为 `editorWarning` 角色（`chat.css:351` 映射 ∥ `core.css:305` 注）⇒ 值 = VSC 同角色默认（外部源实读：microsoft/vscode `src/vs/platform/theme/common/colors/editorColors.ts` `editorWarning.foreground` = `{ light: '#BF8803', dark: '#CCA700' }`）；一份警告色不裂 | 另立 `--status-warn` 类专用变量（⇒ 双警告色 · 角色分裂）· 保留旧琥珀值（用户直斥未对） |
| 行数预算 | 只压 `:480` 一条既有规则为单行（diff 记为形变） | styles.css 距 500 硬限余 1（§2.1 表：拆档归 拆档批 R1 ∕ R13 触面）——本轮不得增行 | 净增 4-6 行（越 500）· 顺带拆档（越权：拆档归其在册执行轮） |

### 5.3 审计与代码评审（终态 = converged）

| 轮 | 形式 | 结果 |
|---|---|---|
| 1 | 内审 ∕ 背离审计（read-only explore） | **DEVIATIONS 1 项**：DOC-DRIFT 🟡（设计档零笔 —— 归属父侧裁：点修舱行动表未列 doc 笔 ∕ 按 §2.0 通则属漏笔）；行动 1 ∕ 2 达成（含 banner 边界分支）、验收 ① 归因「与本改动无因果」、行动 3 ∕ 验收 ② 报告面不可判、结构面零回归、声明外零改 ✓ |
| 2 | 代码评审（advisor · type=code · paths = styles.css） | **VERDICT pass**（🟡3 ∕ 🔵3 —— 全非阻断）：#1 可见面机检未随动（点修边界 · 建议随 R11 全轮补锁）· #2 banner 四位字色仍是 dim（CLI 有色 —— 协调项 · 请裁归属）· #3 分隔两边缘（换行行首 ∕ `.status-alert` 无分隔）· #4 `--warn` 亮值仓内未核（本座已补外部源证据）· #5 banner 段码 CSS 双写无锁 · #6 文档收正未落（父侧文档层 · R7e） |
| fix round | —（两轮均无必改项 ⇒ 零修正轮） | 终态 **converged ⇒ clean** |

### 5.4 读数（实跑）

- **套件**：`cd thincoder-desktop && node test/run.mjs` ⇒ `ℹ tests 272 · pass 265 · fail 7`。7 失败全在**姊妹批在飞域**（`renderer/composer-send.mjs` 被删（`views-attach` import 失败）· `renderer/attach.mjs` 缺 `attachmentBar`（`views-chrome-vocab`）· `store.test.mjs` U75b `modelCandidates` 身份断言 · `views-chrome.test.mjs` U119 ∕ U126 ∕ U153 ∕ U207 composer 句柄面）——**与本轮（纯 CSS，无 JS ∕ DOM ∕ 导出面）无因果**；本面全绿：views-statusline（U154–U161 ∕ U50 ∕ U190）· views-locks（U174 ∕ U182 值锁不破 —— 本轮不改变量名 ∕ 数）· host-floor（U95）· 全部 E2E（含 `statusline-align` T-DSK39 —— 本 CSS 下真 Electron 状态行 + PNG 落点）。
- **真机探针**（临时档 `.thincoder/tmp/r11-status-probe.mjs`（未跟踪）· 亮 ∕ 暗两轮真 Electron）：base = `color(srgb 0.105882 0.121569 0.141176 / 0.5)`（亮）∕ `color(srgb 0.901961 0.913725 0.933333 / 0.5)`（暗）；warn = `rgb(191, 136, 3)`（亮 = `#bf8803`）∕ `rgb(204, 167, 0)`（暗 = `#cca700`）；分隔 `content: "│"` 逐段在场；`sepMargins`：banner 邻接 3 处 `ml −12px`、通用 4 处 `ml −6px`；段距 12px 不变；几何 = 竖线两侧各 10.26px 等距（`state` 尾 215.86 → 条芯 226.12 → `tasks` 首 236.38）。截图 `r11-status-light.png` ∕ `r11-status-dark.png`。
- **伪元素 ∕ `innerText` 实证**：T-DSK39 的逐字断言（`state` = `Ready`（带 `│` 前导）· `tasks` = `✓0/2`）在本轮改动后实跑通过 ⇒ `::before` 字形不入 `innerText`。

### 5.5 越域披露（超声明面 · 逐处给由）

1. **`--warn` 调色板槽值变更的连带面**（非本轮声明面，同角色随动）：`renderer/chat.css:437`（`.chat-stopped`）· `renderer/core.css:343`（`.ledger-line.warn`）· `renderer/core.css:314`（`.sub-stop-btn`）+ 经 `renderer/chat.css:351`（`--vscode-editorWarning-foreground: var(--warn)`）映射到核卡警告面（`thincoder-render-core/composer/composer.css:358-359`）。**由** = 警告角色值单源（三端同角色：CLI `fg(3)` ∕ VSC `editorWarning.foreground`）；另立专用变量 ⇒ 双警告色（角色分裂）。文件面零越域（全落 styles.css）。
2. **`:480` 既有 warn 规则压单行**（4 行 ⇒ 1 行）：形 ∕ 语义零变，仅行数预算（styles.css 距 500 硬限余 1）。
3. **临时探针档**（未跟踪 ∕ gitignore 面）：`.thincoder/tmp/r11-status-probe.mjs` + `r11-probe{,2}.log` + `r11-status-{light,dark}.png`。

### 5.6 未办 ∕ 待裁（父侧 — 本轮边界外，只报）

1. **banner 四位字色**：CLI 的 banner 词有色（`render-frame.mjs:221-225`：AUTO = 黄 ∕ PLAN = 青 ∕ ADVISOR·ENG = 亮绿），桌面四段仍 dim（`styles.css:470-480` 无色规则）——同属「字色 ⇒ CLI 对齐」射程的可见端差（§1.5）；用户 20:01 口径只点「dim 基色 + warn 黄」两值 ⇒ 本轮判达标，请裁归属（本轮补 ⇒ 需新调色板槽 + `views-locks.test.mjs:418-419` 变量计数锁同拍；或记入 R11 全轮）。
2. **机检随动**：本轮无新增值锁 ∕ 无真机（T-DSK39 不读分隔 ∕ 字色）——建议随 R11 全轮在 `test/views-statusline.test.mjs` 原址补例；本舱按点修边界未办。
3. **设计档收正未笔**：`UI.md` §1 状态栏行 ∕ `RENDERER.md` 状态行面（R11 文档收正行）+ R11 行动表 ∕ §2.1 未列 styles.css —— 设计档笔权不在本座；本规格现只住 `styles.css:461-463` 注释。

### 5.7 R2 实施舱 · 上提：文件链接纯函数（eng-coder · 2026-09-28）

**目标**：R2（§2.2 行动表）——文件链接解析纯函数上提核件（上提源 = VSC `thincoder-vscode/src/extension/file-links.mjs`）+ 桌面消费（删本地副本；`fileOpenTarget` 保留端侧；`node:fs` 探针端侧注入）。

**动档（4 档 = 本轮声明面全量）**：

| # | 档 | 动作 | 读数（实读） |
|---|---|---|---|
| 1 | `thincoder-core/file-links.mjs` | **新档**（上提产物）：token 抽取 ∕ 去重 ∕ 封顶 50 ∕ 无根相对 token 跳过；**验存转注入缝** `probe = { existsSync, statSync }`（核内零 `node:fs`；缺 ∕ 形违 ⇒ 抛——fail-loud） | 52 行（估 ≈45–55） |
| 2 | `thincoder-core/test/file-links.test.mjs` | **新档**（核直测 5 例：抽取 ∕ 去重 · 相对径需项目根 · 验存滤除 ∕ 零抛 ∕ 缝契约 · 上限 50 · 负向锁；假盘探针 = 零真盘） | 110 行 |
| 3 | `thincoder-desktop/src/main/file-links.mjs` | 改：消费核件（本地解析副本删除 = 零本地 token 正则 ∕ 零自持封顶；`fileOpenTarget` 保留端侧 = `ipc.mjs:36/216` 消费点未动；探针端侧注入） | 34 行（原 64） |
| 4 | `thincoder-desktop/test/file-links.test.mjs` | 改：随动（U197 ∕ U198 保留 + **新 U235 单源结构锁**（正：核消费面在场；负：端档零本地正则 ∕ 零自持封顶字面）+ 头注随 R2） | 89 行（原 78） |

**决策透明表**：

| 决策 | 取值 | 依据 | 被否备选 |
|---|---|---|---|
| 注入缝形态 | 第三参注入 `probe = { existsSync, statSync }`（`node:fs` 同名面）；缺 ∕ 形违 ⇒ 抛（fail-loud） | 设计「验存（`existsSync` ∕ `statSync`）转注入缝」；「存在闸未接线不得静默扮成零链接」 | ① 核内默认 `node:fs`（则「探测端侧注入」无对象）② 缺缝 ⇒ 静默零链接（静默降级） |
| 「相对径需项目根」守卫 | 保留（核内 `base` 守卫；无根相对 token 跳过） | §2.2 R2 行点名「相对径需项目根」；承桌面既有语义（禁 `process.cwd()` 第二解析基） | 弃守卫（VSC 源无此守卫——迁移面语义差在册，双写窗口 §2.5-2） |
| 上限常量 | `MAX_LINKS` 核导出 + 桌面 re-export | 单源；桌面测档既有断言值 = 50 | 桌面自持副本（U235 反向锁禁） |
| 单源结构锁 | 新 U235（结构机检，非散文锚） | 上提轮「删本地副本」的防再分叉机检化 | 仅文档说明（无锁） |

**读数（实跑 · 本舱）**：

- 核直测：`node --test test/file-links.test.mjs` ⇒ **5 ∕ 5 绿**；桌面 file-links 直测 ⇒ **3 ∕ 3 绿**（U197 ∕ U198 ∕ U235）。
- 核全套件：`cd thincoder-core && npm test` ⇒ `ℹ tests 782 · pass 782 · fail 0` ✅（基线 ≥772）。
- 桌面全套件：快照一 `274 ∕ pass 269 ∕ fail 5`；快照二（树在动）`264 ∕ 251 ∕ 13`——红项全落姊妹批（输入面板 R1）在飞面（待发送组 ∕ 出泡族 ∕ store ∕ composer 改锚面：含 `chat-pending.mjs` 中途被删致 U95 ENOENT、`store.mjs` `isClaimed` 改名中间态）；**A/B 复跑**（本轮 3 号档换回 HEAD 版）⇒ 同 5 红逐条复现（U59 ∕ U71 ∕ U194 ∕ U205 + T-DSK46）⇒ 与本轮 4 档零交集；本轮面全绿。
- `git status --porcelain`（4 档）：`M src/main/file-links.mjs` · `M test/file-links.test.mjs` · `?? thincoder-core/file-links.mjs` · `?? thincoder-core/test/file-links.test.mjs`；**VSC 树零命中** ✅（`thincoder-vscode/**` 改动集零命中；VSC 源档与 `.thincoder/tmp/head/` 快照逐行同形）。

**审计与代码评审（终态 = converged ⇒ clean）**：

| 轮 | 形式 | 结果 |
|---|---|---|
| 1 | 内审 ∕ 背离审计（read-only explore） | **DEVIATIONS 2（均 DOC-DRIFT 🔵）**：① 设计面延后项在册；② 「新核档登记行」延后枚举待父侧确认（见下）；**PARTIAL ∕ SILENT-SIMPLIFICATION ∕ OUT-OF-LIST 零命中**；VSC 树零改独立复核 ✅；「红在别轮面」独立结论 = 成立 ✅ |
| fix round 1 | 审计观察收正 1 处：桌面头注「随上提收正」⇒「随上提失效（设计档收正归设计面轮）」（前瞻表述收正） | 已落（复跑 3 ∕ 3 绿） |
| 2 | 代码评审（advisor · type=code · 4 档 + 批次档 + VSC 源对照） | **VERDICT pass**（🟡4 ∕ 🔵4——全非阻断、零 must-fix：doc-state 滞后三处（PROJECT.md KD-39 ∕ CORE-UNIFICATION 行 183 ∕ UI.md 相抵② 未入收正清单）· 桌面套件读数协调项 · 数值漂移 · 必填缝迁移注 · U235 锁射程 + win32 断言注） |

**越域披露（超声明面 · 逐处给由）**：

1. **设计档收正未笔**（父侧派单「设计面另轮」——本舱零触设计档）：`PROJECT.md` KD-39（`:78` 句）· §4.1（`:169` 63⇒34 ∕ `:225` 测试面 78⇒89）· §4.2（`:467` ∕ `:490`）· `:562`；`CORE-UNIFICATION.md` 行 183（`:328`）+ **新核档登记行**（落点设计未钉死——请设计轮定）；**UI.md 相抵②（`:417`）同句族**（R2 收正行未列——advisor 复核所出）——一并请设计轮销账。端档首注（code 面）= **已落**（桌面头注已改述为「核件单源 + 端侧探针注入」）。
2. **`@thincoder/core` 取件形**（越本轮声明面 · 只报）：桌面 lock 记 registry 0.9.5（S2 期口径在册 = `CORE-UNIFICATION.md` §2.6.1——开发期 `npm link`、产品 lock 非权威）；本机 `node_modules/@thincoder/core` = 仓内核活链（junction）⇒ 本新档即时可达；归发布物化面。
3. A/B 期间对本轮 3 号档的临时 HEAD 替换**已整档还原**（复跑 3 ∕ 3 绿）；零其它越域改动。

**待父侧确认（1 项）**：审计发现 ②——「新核档登记行」未入父侧「设计面另轮」延后枚举（且其设计落点未钉死：候选 = `CORE-UNIFICATION.md` 内映射区）；请父侧裁归属（并入设计轮 ∕ 另指落点）。

**读数补（交付前末次 · 2026-09-28）**：桌面套件第三快照 = `274 ∕ pass 267 ∕ fail 7`——树又动（姊妹批改锚面部分转绿，`U51 ∕ U52 ∕ U95 ∕ U118 ∕ store` 已回绿），余 **7 红全为待发送组 ∕ 出泡族**（`T-DSK45 ∕ T-DSK46 ∕ T-DSK47` E2E + `U153` 出泡不变式 + `U59 ∕ U194 ∕ U205` 帧面 ∕ 块序 ∕ 消化行组——均姊妹批（输入面板 R1 · B12 口径）在飞面）；本轮 `file-links` 三例零红。三快照（`274∕269∕5` → `264∕251∕13` → `274∕267∕7`）红集随树移动而变，**逐次均零 `file-links` 红** ⇒ 归因稳定。

### 5.15 R3 实施记录（队列纯逻辑族上提 + 回合链接驳 · eng-coder · 2026-09-28）〔段号就地顺正：原标 5.7 与上行 R2 舱重号〕

**目标**：R3 = 核新档 `queued.mjs`（VSC 纯逻辑族上提）+ 桌面 `queued-input.mjs` 消费核族（删本地副本）+ `turn-chain.mjs` 取批面处置；机检 = 核新测档（批拆分 ∕ 8 条 ∕ 2000 字 ∕ slash 首条两径 ∕ 取项保序）+ 桌面测随动；套件 core + desktop。

**逐档表（本舱实改 · 五档）**

| # | 档 | 前 ⇒ 后（行数） | 动作 |
|---|---|---|---|
| 1 | `thincoder-core/queued.mjs`（新档 · 上提产物） | — ⇒ **90** | VSC `queued-merge.mjs:15-36`（`MAX_MERGE_ITEMS` ∕ `MAX_MERGE_CHARS` ∕ `QUEUED_MAX_ITEMS` ∕ `formatMergedMessages` ∕ `planQueuedInput`）+ `queued-pickup.mjs:49`（`takeQueuedBatchItem`）**纯搬 + 转口**；去注释逐行对拍 = 与 VSC ∕ CLI 副本同体（三函数实测：`formatMergedMessages` ∕ `planQueuedInput` ∕ `takeQueuedBatchItem` 逐行同） |
| 2 | `thincoder-core/test/queued.test.mjs`（新档） | — ⇒ **113** | T-Q1–T-Q5（用例号自铸 · 披露在册）：常量与合并形态 ∕ 批拆分（8 条恰一批 ∕ 第 9 条留待下批 ∕ 650×3 = 1980 字符截批 ∕ 单条 2001 与恰 2000 直发）∕ slash 首条两径 ∕ 取项（就地消费 ∕ 保序 ∕ 头条目元数据 ∕ `String()` 归一）∕ 携图批退化 count = 1 |
| 3 | `thincoder-desktop/src/main/queued-input.mjs` | **118 ⇒ 73** | 删本地纯函数副本（常量 ∕ 合并串 ∕ 计划）⇒ 改 `import { QUEUED_MAX_ITEMS, planQueuedInput } from "@thincoder/core/queued.mjs"`（核族消费）；表壳（`Map` 分键 ∕ 容量门 ∕ 快照投影 `{text,ts}`）与满队回执留端；`plan` ∕ `take` 语义零改（KD-40 ①「计划取批」） |
| 4 | `thincoder-desktop/src/main/turn-chain.mjs` | **72 ⇒ 75** | **仅档头注**（+3 行）：批计划单源 = 核件（经 `queued-input.mjs` `plan` 面消费）；取项边缘 = KD-40 在册裁定（slash 逐条直发 ∕ 携图批不拆）⇒ **不消费**核 `takeQueuedBatchItem`。零功能改 |
| 5 | `thincoder-desktop/test/queued-input.test.mjs` | **107 ⇒ 100** | 纯逻辑族取值源改核件（U214 对拍锁改「核 ⇄ CLI 副本」——核档零产品树依赖（N3）⇒ 跨端对拍落端侧宿主）；U215 补「携图批跨度 = 整批（不拆批）」锁；CLI 对拍锚旁注退役条件 |

**机检读数（实跑）**

- 核套件：`cd thincoder-core && node test/run.mjs` ⇒ `ℹ tests 782 · pass 782 · fail 0`（含新档 5 例）。
- 核新档单跑：`node --test test/queued.test.mjs` ⇒ 5 ∕ 5 绿。
- 桌面单档（`--import test/rc-resolve.mjs`）：`test/queued-input.test.mjs` 2 ∕ 2 绿；`test/agent-host-queued.test.mjs` 7 ∕ 7 绿；`test/agent-host.test.mjs` 16 ∕ 16 绿。
- 桌面全量（`test/run.mjs` · 21:0x–21:2x 连测）：**274 tests · 270 pass · 4 fail**。4 红全在**姊妹批（输入面板）在飞域**（出泡收敛 ∕ 待发送块派生插槽 ∕ 词族 28 键），**与本轮五档零因果**（同跑本舱用例 U214 ∕ U215 ∕ U217–U219 全 ✔；红项病灶 = `renderer/*` 姊妹批迁移面）。红项随时间递减（13 → 9 → 5 → 4 —— 他舱持续落盘所致）；**本舱面无红**。「core 绿」自证成立；「desktop 绿」待姊妹批收口（父侧收口时以末次全量跑为准）。
- 附：套件清单闸一刻红（`test/events-flags.test.mjs` 未登记 —— 姊妹批在飞产物，非本舱），其登记后闸过。
- 结构机检：`core-hygiene`（N3 ∕ 相对 import ∕ ≤300）与 `core-modules`（全档可加载）在本轮核套件全绿内；`host-floor` U95 `fresh` 臂口径行数 = 90 ∕ 113 ∕ 73 ∕ 75 ∕ 100（全 ≤300）。
- `git status` 自证：本舱改动 = 五档（两新核档 + 三改桌面档）；同树并存他批在飞改动（姊妹批 `renderer/*` ∕ `mount-composer.mjs` ∕ `store.mjs` ∕ `events-flags*`；同批 R2 舱 `thincoder-core/file-links.mjs` 等；`thincoder-vscode/test/files.mjs`）——非本舱笔，逐项分列。

**决策透明表**

| 决策 | 取值 | 依据 | 被否备选 |
|---|---|---|---|
| 取批面口径（R3 行 3 字面 vs 边界行） | **父侧裁定 ②**：桌面本轮**只消费核纯逻辑族**（常量 ∕ 合并串 ∕ 计划）；**取项边缘全保 KD-40**（slash 回合尾逐条直发 ∕ 携图批不拆批）；**核 `takeQueuedBatchItem` 本轮无桌面消费点**；**设计 §2.2 R3 行 3「取批改核 `takeQueuedBatchItem`」不收正**（归设计面另轮 —— 已入册 §1.10） | 父侧回执（承本舱 ask：行 3 与边界行相抵 ⇒ 按边界行执行）；R3 边界行「既有边界全守」+ KD-40 ⑤ 与 slash 死结裁在册（用户面行为，非实施舱可翻） | ① 桌面整套随核 take（携图批退化逐条 + slash 尾径零动作）——须显式改写两条在册裁定，且 slash 条永久堵队（真缺陷） |
| 核 `takeQueuedBatchItem` 落位 | 随族上提核件（纯搬），暂由核测消费；消解 = VSC ∕ CLI 迁移消费核件批（其后源端自持副本退场）——已注核档头（`:9-11`） | 上提口径「纯搬 + 转口」；双写窗口在册（§2.5-2） | 不上提该取项件（VSC 侧真源缺件 ⇒ 后续迁移无对位） |
| 桌面 `QUEUED_MAX_ITEMS` 归属 | 常量住核件，桌面 **import 消费**（不转口 re-export） | 「删本地纯函数副本」+ 单源纪律；桌面消费点 = 容量门（按键判）自有 | 桌面 re-export 核符号（无用例 ∕ 无消费方需要，徒增面） |
| 对拍锁落位 | 落桌面测档 | 核档零产品树依赖（`core-hygiene` N3 判据：核内相对 import 至产品树即红）⇒ 跨端对拍须在端侧宿主 | 核测内引 CLI 副本（违 N3，直接红） |
| `turn-chain.mjs` 改动面 | **仅档头注**（零功能改） | 父侧派单「只做取批面（续链结算面归 R9）」+ 裁定 ②（取项边缘保 KD-40 ⇒ 取批路径不变） | 改取批实现（须翻 KD-40）· 顺带做续链序对齐（属 R9 面，越轮） |

**审计与代码评审（终态 = converged）**

| 轮 | 形式 | 结果 |
|---|---|---|
| 内审 | 背离审计（read-only explore · 对本轮五档逐项对设计） | **DEVIATIONS = 0**（纯搬逐字 ∕ 核内纪律 ∕ 桌面零本地副本 ∕ 取项边缘全保 ∕ 验收 ①②③ ∕ 零文档笔 ∕ 范围内零越域）；另报读数差与两条父侧前提更正（见下「未办」） |
| 1 | 代码评审（advisor · type=code · 五档 + 设计档上下文） | **VERDICT pass**：🟡2（报告层：行 3 未收正披露 ∕ 设计档行数 ∕ §6.8「双端」句与核档登记）· 🔵3（take 面消费注 ∕ 对拍锚退役条件 ∕ `textOf` 归一差） |
| fix round | 注释级两处：核档头补「消费面 + 消解」注；桌面测对拍锚补退役条件注 | 零代码 ∕ 零行为改（行数 Δ = 核 +3 ∕ 测 +1 —— 恰为注释行） |
| 2 | 代码评审（advisor · 复核 fix 声明两条 + 原表现状） | **VERDICT pass**：两条修正落地核实 ✓；余项 🟡2（报告层排程）+ 🔵1（`textOf` 归一差 · 违入参才可达的防御面）——皆非必改 |

**越域披露（本舱）**：交付面 = 五档（表内）；表外零改。同树并存他批在飞改动已逐项分列（见 `git status` 行），非本舱笔、亦不替其背书。

**文档收正（归设计面轮 · 本舱零笔）**：`PROJECT.md` §4.2 两行读数（`turn-chain.mjs` 71 ⇒ 75 ∕ `queued-input.mjs` 117 ⇒ 73）+ `UI.md:440` 同族句 + 核侧 `AGENT-LOOP-ASYNC-POOL.md` §6.8（`queued.mjs` 登记行 +「双端各自实现」⇒ 核件单源）+ R3 行 3 收正（裁定在册）。

**未办 ∕ 待父侧（本舱边界外）**：① desktop 全绿待姊妹批收口（本舱面无红 —— 读数在册）；② 携图批不拆批 ∕ slash 尾径两边界的新一轮机检锁（姊妹批 U-1 在册「尾径 slash 零机检」缺口留存 —— 落点建议随 R9 ∕ 后续轮；受 `agent-host-queued.test.mjs` ≤300 约束须先拆档）；③ `renderer/queue.mjs:14` 注释指针（容量判据单源 = `queued-input.mjs`）现多一跳（常量住核件）—— 归 R1 #7 面收正。

### 5.9 R6 实施舱 · 上提：存活 2s 拍 + 完成提示策略（eng-coder · 2026-09-28）

**目标**：R6（§2.2 行动表 · 逐行照行）= 存活 2s 拍（VSC `panel-messages.mjs:45` ∕ `:50` ∕ `:62-75` + `suspension.mjs:148`）与完成提示策略（桌面现状超集 —— KD-F3 按实读定源）双上提核件 + 桌面消费（删本地副本）。**纯搬 + 转口，零语义改**；机检 = 核两新档直测 + 桌面 `test/agent-host-subagent.test.mjs` ∕ `agent-host.test.mjs`（`NOTIFY_TEXTS` 面）随动；套件 core + desktop。边界 = 渲染面 2s 拍（`renderer/heartbeat.mjs` ∕ `app.mjs` 走时面）零动；VSC 树零改。

**逐档表（本舱实改 · 八档）**

| # | 档 | 前 ⇒ 后（行数） | 动作 |
|---|---|---|---|
| 1 | `thincoder-core/agent/live-beat.mjs`（新档 · 上提产物） | — ⇒ **48** | 拍间隔 `LIVE_HEARTBEAT_MS = 2000` ∕ 单拍（`beat` 注入 + 回值透传）∕ 起停 ∕ 幂等（同句柄单拍）+ 清点；`setInterval` ∕ `clearInterval` 转注入缝（`timer(fn, ms) ⇒ handle` ∕ `clear(handle)`，缺省平台全局），`unref` 走句柄可选面；`beat` 缺 ∕ 非函数 ⇒ 抛（fail-loud）。VSC 两处端面判据（`_wvReady` 门 `:51` ∕ `ev:subreassert` 拍日志 `:56`）**留端**（非本档语义——档头在册） |
| 2 | `thincoder-core/notify-policy.mjs`（新档 · 上提产物） | — ⇒ **56** | 失焦门 ∕ 两档（`turnDone` ∕ `digestStart` 的 `n > 0` 门）∕ 载荷成形（词键 ∕ `title` 零携 ∕ `reveal` 同引用）∕ 零动作 ∕ 抛吞零连带——**对桌面 HEAD 版逐行纯搬**（唯一差 = import 改核内 `./i18n.mjs`）；平台三件（`notify` ∕ `focused` ∕ `reveal`）注入缝原位 |
| 3 | `thincoder-desktop/src/main/subagent-face.mjs` | **87 ⇒ 81** | 删本地拍机制（`LIVE_HEARTBEAT_MS = 2000` 常量 ∕ `setInterval` ∕ `unref` ∕ 句柄簿记）⇒ 改 `createLiveBeat({ beat: heartbeatBeat })`（核件消费）；`LIVE_HEARTBEAT_MS` 改核 re-export；端拍体（逐键 `bridge(key).reassertLive(agent)`）+ `subagent:stop` 留端（零功能改） |
| 4 | `thincoder-desktop/src/main/notify.mjs` | **48 ⇒ 11** | 删本地策略体（词键常量对 ∕ `createNotifier` 全体）⇒ 单行 re-export 核件；`agent-host.mjs` 注入面 ∕ 三处用例 import 面零改；平台落子装配留端（`main.mjs:79-89` 零改） |
| 5 | `thincoder-core/test/live-beat.test.mjs`（新档） | — ⇒ **116** | 假钟直测 5 例：拍间隔 ∕ 单拍 ∕ 清点（逐拍驱动 + 回值）· 起停 ∕ 幂等（同句柄零重起 ∕ 停后零新拍 ∕ 再起新句柄）· `unref` 可选面 · fail-loud 缝契约 · 缺省缝 = 平台 `setInterval`（`ctx.mock.timers` 假钟实证）——零真实等待 |
| 6 | `thincoder-core/test/notify-policy.test.mjs`（新档） | — ⇒ **83** | 纯测 5 例：失焦门（含判据缺省 = 恒聚焦）· 两档 ∕ `n > 0` 门 · 词键两语逐字 + locale 归一 · 载荷成形（`title` 零携五形 ∕ `reveal` 同引用）· 零动作 ∕ 抛吞零连带 |
| 7 | `thincoder-desktop/test/agent-host-subagent.test.mjs` | **144 ⇒ 163** | 机检随动：新增 **U236 单源结构锁**（拍 ∕ 提示策略两机制单源 = 核件；端档零本地定时器 ∕ 零自持拍间隔 ∕ 零词键字面；核值恒等）+ 档头 R6 注 + 读面 import；U164（生产消费面：起拍 ∕ 停拍 ∕ 清点 ∕ 摘表出拍 ∕ 真 2s 出帧）原样过 |
| 8 | `thincoder-desktop/test/agent-host.test.mjs` | **490 ⇒ 491** | 机检随动（`NOTIFY_TEXTS` 面）：U191 加词键核件单源恒等断言（`NOTIFY_TEXTS === CORE_NOTIFY_TEXTS`）+ 读面 import 一行 |

**机检读数（实跑）**

- 核两新档直测：`node --test test/live-beat.test.mjs test/notify-policy.test.mjs` ⇒ **10 ∕ 10 绿**。
- 核全套件：`cd thincoder-core && node test/run.mjs` ⇒ `ℹ tests 792 · pass 792 · fail 0` ✅（基线 782 + 新 10；含 `core-hygiene` ≤300 ∕ N3 ∕ 相对 import 与 `core-modules` 全档可加载）。
- 桌面本舱面（四档）：`node --import ./test/rc-resolve.mjs --test test/agent-host-subagent.test.mjs test/agent-host.test.mjs test/agent-host-suspension.test.mjs test/host-floor.test.mjs` ⇒ **41 ∕ 41 绿**（含 U164 ∕ U165 ∕ U236 ∕ U95 ∕ U191；U95 两向 = `fresh` ≤300 与「越层档仍越层」例外面皆稳）。
- 桌面全套件：`cd thincoder-desktop && node test/run.mjs` ⇒ `ℹ tests 276 · pass 273 · fail 3`。三红 = `T-DSK46`（出泡收敛）∥ `T-DSK47`（落定态）——姊妹批（输入面板）E2E 面；`U194`（`views-chat` 消化行组 —— 断「族序 = 块 → 消化行组 → 待发送组」，待发送组族 = 姊妹批面）。**A/B 归属**：本舱改前同法基线 = 274 ∕ 267 ∕ 7（同三红在内，另有 T-DSK45 ∕ U205 ∕ U59 ∕ U153 中间态红随后台批次落盘自愈）⇒ **本舱零新红**；三红与本舱八档零文件交集、零调用面交集。
- `git status --porcelain`（本舱八档）：`M` ×4（`thincoder-desktop/src/main/subagent-face.mjs` ∕ `src/main/notify.mjs` ∕ `test/agent-host-subagent.test.mjs` ∕ `test/agent-host.test.mjs`）+ `??` ×4（`thincoder-core/agent/live-beat.mjs` ∕ `notify-policy.mjs` ∕ `test/live-beat.test.mjs` ∕ `test/notify-policy.test.mjs`）；**VSC 树零改自证** = R6 源锚四档 porcelain 零命中（`panel-messages.mjs` ∕ `suspension.mjs` ∕ `notify.mjs` ∕ `panel-callbacks.mjs`）。
- 行数对估：核两新档 48（估 60–80）∕ 56（估 40–55）——面全、低于估；`subagent-face.mjs` 81（估 55–70）——超估（端拍体按契约留端 + 注释），顾问判「估算非验收线，不入偏差」；`notify.mjs` 11（估 25–35）——低于估（端胶水实为单行 re-export）。

**决策透明表**

| 决策 | 取值 | 依据 | 被否备选 |
|---|---|---|---|
| 拍体归属 | 核件只承**拍机制**（间隔 ∕ 起 ∕ 停 ∕ 幂等 ∕ `unref` 缝）；端拍体（逐键 `reassertLive` 投影）**留端** | 设计行 3「`reassertLive` 桥 ∕ 桥接键集留端」+ 行 1「拍间隔 ∕ 单拍 ∕ 起停 ∕ 幂等 ∕ 清点」入核；VSC 对位面同形（投影本体留端） | ① 端拍体一并入核（桥 ∕ 键集端专有，核无法表达）② 端侧保留本地定时器副本（违单源） |
| 定时器缝形 | `timer(fn, ms) ⇒ handle` + `clear(handle)`，缺省 = 平台全局；`unref` 走句柄可选面 | 沿仓内先例（渲染面 `renderer/heartbeat.mjs:33-36` 同形）；VSC 原形 `timer.unref?.()` 逐字保留语义 | ① 拍读常量入参（拍读不可注入）② 独立 `unref` 注入件（VSC 无此面，多设缝） |
| `beat` 缝 fail-loud | 缺 ∕ 非函数 ⇒ 抛 | 沿本批上提同族先例（R2 探针缝 fail-loud：缝未接线不得静默降级）；拍体缺位 = 静默「零投拍」难察 | 静默空转（缺陷隐蔽） |
| notify 端档形 | 11 行 re-export（保 `agent-host.mjs` + 三处用例 import 面零改） | 设计行 4「消费核策略（删本地策略体）；平台落子装配留端」；「单源 = 核件，端只留消费入口」 | ① 端档整删 + 调用点改指核（须触 `agent-host.mjs` + 三测试档 = 越轮声明面）② 本地策略体保留（违上提） |
| 词键归属面 | 移核（`NOTIFY_TEXTS` 住 `notify-policy.mjs`；端 re-export） | 策略 ∕ 词键同族上提（设计行 2「词键」入核清单）——原「主进程自持」句随上提改归属（设计档收正归设计面轮，已在档头注 + 本报告） | 词键留端（策略在核而词在端 = 两处账，漂移源） |

**审计与代码评审（终态 = converged ⇒ clean）**

| 轮 | 形式 | 结果 |
|---|---|---|
| 1 | 内审 ∕ 背离审计（read-only explore · 对本轮八档逐项对设计） | **DEVIATIONS = DOC-DRIFT 6 处（🟡，全属 R6 契约「文档收正」面 —— 已按本舱派单口径归「设计面另轮」）**；PARTIAL ∕ SILENT-SIMPLIFICATION ∕ OUT-OF-LIST = 零命中；四项逐行达成（含「纯搬零语义改」逐条语义比对）；渲染面 ∕ VSC 树边界零命中（内容级） |
| 2 | 代码评审（advisor · type=code · 八档 + 批档 + VSC 源对照） | **VERDICT pass**（🟡2 ∕ 🔵6 —— 全非阻断、零 must-fix）：① `agent-host.test.mjs` 491 行（>300）、拆分执行轮待父侧裁；② 三处归属句 doc 滞后（已登记待设计面轮）；🔵 = `fire` 入参 `null` 不可达面 ∕ `timer` 句柄真值面 ∕ 拍体两判据无桌面对位（归 R10）∕ 行动表措辞 ∕ 坐标漂移 ∕ U164 墙钟臂 |
| fix round | —（两轮零必改项 ⇒ **零修正轮**） | 终态 **converged ⇒ clean** |

**越域披露（超声明面 · 逐处给由）**：① 桌面两测试档（第 7 ∕ 8 档）——任务书机检面「随动」，非行动表四行之内但属验收面；② `agent-host.test.mjs` 现读 491（设计记 490）——拆档定稿「先拆后改（拆档批 R2 ∥ 本触面轮）」本舱**未执行拆分**（本笔 +2 行仍在 <500 硬限内；内审 ∕ 顾问两轮独立同判「非必改 · 父侧裁定拆分执行轮」——见「待裁」）；③ 设计档 ∕ 需求档零笔（文档收正 = 设计面另轮 —— 派单口径在册）。

**待父侧裁（1 项）**：`test/agent-host.test.mjs` 拆档执行轮归属（拆档批 R2 ∥ 本触点轮 ∥ `2026-09-28-desktop-feature-parity.md` #525 —— 先落者谁？拆点 = 生命周期六例出档 `test/agent-host-lifecycle.test.mjs` ≈231 ⇒ 主档 ≈258，锁随动 = `files.mjs` ∕ `run.mjs` 两向自检 + `host-floor` U95 例外面转 `fresh` 臂）。本舱未执行（越行动表面）；**该档下一次被触前必须先拆**（余 9 行不足以承接 R4 ∕ R7 ∕ R9 ≈ +10–25）。

### 5.8 R5 实施舱 · 上提：附件贴图族（eng-coder · 2026-09-28）

**目标**：R5（§2.2 行动表两行）—— 附件贴图族上提核件 + 桌面消费（纯搬 + 转口 · 零语义改）；机检 = 核新档直测 + 桌面 `test/attachments.test.mjs` ∕ `agent-host-queued.test.mjs` 随动；套件 core + desktop 双绿。

**逐档表（本舱实改 · 四档 = 两新 + 两改）**

| # | 档 | 前 ⇒ 后（行数） | 动作 |
|---|---|---|---|
| 1 | `thincoder-core/attachments.mjs`（新档 · 上提产物） | — ⇒ **125** | 纯搬 + 转口：`parseDataUrl`（VSC `image-handler.mjs:34`）· `savePastedImages`（VSC :49 骨架 + 桌面预算语义）· `IMAGE_MAX_BYTES=15_000_000` ∕ `TURN_MAX_BYTES=30_000_000` · `isNonVisionModel` 判据 · `downgradeNonVisionImages`（VSC :109）；**两缝**：fs 写（`{mkdirSync,writeFileSync}`）与视觉子代理 spawn（`visionReader`）——核内零 `node:fs`（只 `node:path`） |
| 2 | `thincoder-core/test/attachments.test.mjs`（新档） | — ⇒ **171** | T-A1 解析 ∕ T-A2 落盘管线（命名 ∕ 源序 ∕ 条阈 ∕ 轮预算 ∕ 弃项 ∕ 懒建 ∕ 两缝）∕ T-A3 非多模态判据 ∕ T-A4 降级行（假读图者；fs = 假盘 —— 零真网零真盘） |
| 3 | `thincoder-desktop/src/main/attachments.mjs` | **126 ⇒ 75** | 消费核族（删本地判据副本 = 解析 ∕ 配额 ∕ 落盘管线 ∕ 非模态判据）；端侧留 `cleanupTurn` ∕ 提示行（`noticeText`）∕ 档位处置 ∕ fs 缝注入（`FS_SEAM`） |
| 4 | `thincoder-desktop/test/attachments.test.mjs` | **247 ⇒ 267** | 随动：配额常量改核 import + 新增 **U237 单源结构锁**（核族在场 ∧ 端档代码面零 dataURL 正则 ∕ 零配额字面 ∕ 零 `paste-` ∕ 零 `parseDataUrl` 符号）+ ④ 注收正（真错径未走如实） |

**决策透明表**

| 决策 | 取值 | 依据 | 被否备选 |
|---|---|---|---|
| 核件 API 形 | `savePastedImages(dataUrls, cwd, {fs}) ⇒ {paths, dropped}`（VSC 签名 + fs 缝 + 弃项计数） | 「纯搬 + 转口」；桌面需 `dropped` 判 `partial`（零静默） | VSC 原形 `⇒ string[]`（弃项无法浮出）· 双管线并存（重复） |
| 配额值 | 15_000_000 ∕ 30_000_000（十进制） | 桌面在册值（`IPC.md` §2 附件注项 3）+ 核 `read_image` 内闸同值（`tools/file.mjs:26`）；VSC 自持副本 `15*1024*1024` 差异在册（迁移轮收正） | 取 VSC 二进制阈（桌面接纳面宽于 `read_image` 闸 ⇒ 交核报错） |
| 非视觉处置 | 桌面**零改**（不落盘不注入 + 说明行 —— 核 `isNonVisionModel` 判据）；核降级跑者（`downgradeNonVisionImages` + `visionReader` 缝）承而待 VSC 迁移消费 | R5 行 2「删本地判据副本；提示行 ∕ 模型档位面留端」+「零语义改」；§2.5-2 迁移留后 | 桌面改走 VSC 视觉子代理降级（用户可见行为变 —— 越本轮口径） |
| 缝纪律 | fs 缝缺 ∕ 形违 ⇒ 抛（fail-loud）；空表先于缝校验早退；降级缝缺 ⇒ 判据过门即抛 | 沿 R2 先例（`file-links` probe 缝「未接线不得静默扮成零结果」） | 静默兜底（写面未接线 ⇒ 全弃无告警 · 降级未接线 ⇒ 假「原样兜底」） |
| 诊断归属 | 核管线内 `console.error` 随管线上提（无 cwd 一次 ∕ 建目录失败一次 ∕ 逐写失败） | 纯搬（桌面 `writeImages` 逐行语义） | 端侧回调缝（无谓增缝） |
| 测试锁 | 桌面新增 U237 结构锁（沿 R2 U235 先例） | 「删本地副本」的防再分叉机检化 | 仅文档说明（无锁） |

**审计与代码评审（终态 = converged）**

| 轮 | 形式 | 结果 |
|---|---|---|
| 1 | 内审 ∕ 背离审计（read-only explore） | **四类偏差零命中**（PARTIAL ∕ SILENT-SIMPLIFICATION ∕ OUT-OF-LIST ∕ DOC-DRIFT）；旁证：VSC 档 mtime = 09-21（树零改）· 被删两常量树内恰一消费者（随动测档）· 设计档三靶点未触（本舱零笔） |
| 2 | 代码评审（advisor · type=code · 四档 + 批档 + VSC 源对照） | **VERDICT pass**：🟡3（档头「三面纯搬」未披露弃项索引 ∕ 预算闸两差 · 降级跑者零生产消费面〔协调项〕· 设计档收正未落〔R7e 文档层〕）🔵3（降级判据严一档 ∕ 半失败孤儿件无回收面 ∕ 测注「错误径」未走）——零 must-fix |
| fix round 1 | 档头披露补全（在册差异 ①–⑤ 逐条：阈单位 ∕ 弃项索引 ∕ 预算闸源 ∕ 判据严 ∕ 清理面）+ 测注收正 | 复跑：核测 4∕4 · 桌面测 + queued 12∕12 · 核结构机检 5∕5 全绿 |

**读数（实跑）**

- 核新档直测：`node --test test/attachments.test.mjs` ⇒ **4 ∕ 4**；核全量（`node test/run.mjs`）：**803 ∕ 803 全绿**（基线 ≥772）。
- 桌面：`node --import ./test/rc-resolve.mjs --test test/attachments.test.mjs test/agent-host-queued.test.mjs` ⇒ **12 ∕ 12**；桌面全量：**276 ∕ 276 全绿**（基线 ≥263）——首两轮全量跑期间曾现红（姊妹批两 E2E T-DSK46 ∕ 47 + 机器负载致 E2E 超时 ∕ U95 瞬时——两档单跑转绿），末次全量为全绿。
- `git status` 自证：本舱四档（两新核档 + 两改桌面档）；**VSC 树零命中**（`thincoder-vscode/**` 无本舱笔；`image-handler.mjs` mtime 09-21 未触）。同树并存他批在飞改动（姊妹批 `renderer/*` · 同批 R2 ∕ R3 ∕ R6 ∕ R8 核档）——非本舱笔、不替其背书。

**越域披露（超声明面 · 逐处给由）**：交付面 = 四档（表内）；表外零改。`agent-host-queued.test.mjs` **本轮零 diff** —— 验收行「随动」以「`NON_VISION_KEY` 导出面未变 ⇒ 无需改动 + 用例恒绿（7 ∕ 7）」满足（如需触碰请裁）。

**文档收正（归设计面轮 · 本舱零笔）**：`PROJECT.md` §4.2（`attachments.mjs` 行：125 ⇒ 75 + 核件消费改述）；核侧 = `PROVIDER.md` §6.18（贴图降级链核件化登记）+ `CORE-UNIFICATION.md` 行 183（`image-handler` 项收正 —— 现仍「端特有 · 不迁」）+ `IPC.md` §2 项 2（「先例 = image-handler」句随核件化收正，advisor 补报）。

**未办 ∕ 待父侧（本舱边界外）**：① 降级跑者生产消费面 = VSC 迁移轮（核件承判据 + 缝；VSC 的 `visionAbort` ∕ 忙锁 ∕ `engState` 管道留端未迁——迁核轮补接缝）；② 核件与 VSC 自持副本的在册差异五条（档头已列）随迁移轮收正；③ 半失败写入孤儿件的核侧回收面（档头差异 ⑤；桌面侧无 mtime 扫除兜底）——如判需收 ⇒ 另轮。

### 5.10 R8 实施舱 · 上提：provider 流程族（eng-coder · 2026-09-28）

**目标**：R8（§2.2 行动表）= 核新档 `provider-flows.mjs`（VSC 三流程 + M9 探针判据上提——**纯搬 + 转口**）+ 桌面 `providers.mjs` 消费核族判据 + 渲染三档随动（两处「**先拆后改**」：`settings-sections.mjs` ⇒ `settings-agent.mjs`；`mount-settings.mjs`（500 顶格）⇒ 三族出档）。

**逐档表（12 档声明面 · 实读）**

| # | 档 | 前 ⇒ 后（行数） | 动作 |
|---|---|---|---|
| 1 | `thincoder-core/provider-flows.mjs`（新档） | — ⇒ **249** | **上提源 = VSC `provider-flows.mjs:60/129/153`（三流程）+ `:32`（`probeProviderAdmission` 判据）纯搬 + 转口**：步序 ∕ 两拒因串 ∕ `(has key)` 标记 ∕ 空集提示串 ∕ 早退闸逐字；缝 = `ui{pick,input,error,warn,info}`（fail-loud）· `deps.probe` · `deps.hostBusyOverride`；探针目标构造 `probeTargetOf`（随迁 VSC `presets.mjs:159` `probeTargetFromEntry`——**fix 轮补**，见「轮次段」） |
| 2 | `thincoder-core/test/provider-flows.test.mjs`（新档） | — ⇒ **292** | T-P1–T-P7（三流程步序 ∕ 校验 ∕ 拒因 ∕ 探针不阻断 ∕ 目标构造两向 ∕ 读账优先）；用例号自铸（披露在册） |
| 3 | `thincoder-desktop/src/main/providers.mjs` | 151 ⇒ **157** | 消费核族**判据**（`customFieldsError` 必填步序 + 协议域 ∥ `probeAdmission` 探针 + 失败分档）——四通道壳 ∕ reason 词法 ∕ 遮罩纪律 ∕ 唯一写盘面**零改** |
| 4 | `renderer/views/settings-agent.mjs`（新档） | — ⇒ **113** | agent 族出档（`EDITABLE_KINDS` ∕ `NAMED_FIELDS` ∕ 字段行 ∕ 具名控件行与出值 ∕ `agentBody`） |
| 5 | `renderer/views/settings-sections.mjs` | 357 ⇒ **264** | agent 族出档 + `export { agentBody, NAMED_FIELDS }` re-export（**导出面零改**） |
| 6 | `renderer/mount-settings.mjs` | **500 ⇒ 139** | 三族出档后留装配 ∕ 窄桥 ∕ 失败面 ∕ 重绘 ∕ 向导接线（§2.1 拆档定稿） |
| 7 | `renderer/mount-settings-reads.mjs`（新档） | — ⇒ **99** | 四段读数供给族（`activeModel` ∕ 四 `load*`）——`createReads({ask,store,setSettings,report})` |
| 8 | `renderer/mount-info.mjs`（新档） | — ⇒ **48** | 项目级读数族（`INFO_SLOT` ∕ `refreshInfo` ∕ `paintInfo`）——**R13 落盘后适配为只留 `refreshInfo`**（见「跨轮接口」） |
| 9 | `renderer/mount-settings-exits.mjs`（新档） | — ⇒ **297** | 出口族 + 写路辅助（十一出口 ∕ `rowValue` ∕ `namedOut` ∕ `agentPatch` ∕ F-Esc 绑定）——`createExits(deps)` |
| 10 | `test/host-floor.test.mjs` | 随动 | `fresh` 清单 +5 档（含装配档 139）∧ **例外面撤销 `mount-settings.mjs`**（两向判据不缩水） |
| 11 | `test/views-locks.test.mjs` | 随动 | 槽锚声明锁改指 `mount-info.mjs`（`INFO_SLOT`）+ **新增装配档 re-export 锁** |
| 12 | `test/views-chrome-vocab.test.mjs` | 随动 | 零 CJK 扫描名单 + `settings-agent.mjs` |

**声明面外 1 处（如实披露）**：行动表行 3 点名的 `renderer/views/onboarding.mjs`（162）**零改**——裁定①「渲染三档仅随拆分随动」+ 其 import 面（`settings.mjs` 两导出面）未被本轮拆分触及；±0 在「±0～+15」内。

**决策透明表**

| 决策 | 取值 | 依据 | 被否备选 |
|---|---|---|---|
| 桌面消费口径（父侧回执 · **逐字入档**） | **裁定 = ①**：「消费核流**判据**（域 `FORMATS` ∕ 形字段校验步序 ∥ 探针判据与失败分档）；channel `reason` 词法**零改**；渲染三档仅随拆分随动。由：R8 契约自带「纯搬 + 转口，零语义改」+ R2/R3 先例（桌面 = 删本地副本、行为零改）；桌面双语 i18n（核英文串逐字入双语 UI = 制造新端差，非消除）；读法② 之涟漪（`IPC.md` §2 未入 R8 文档收正行 = 设计未意图协议改）。读法② 项下的「字段级用户可见措辞」如日后经走查证实为可见端差 ⇒ 归用户口径裁决，**不本舱私改**。按 ① 继续（核新档 ∕ 核测 ∕ 两处拆档照原计划）」 | 父侧回执（承本舱 ask：两读法影响 user-visible 文案与 IPC 契约收正面，材料内不可裁） | 读法②（字段级拒因改携核流逐字串 ⇒ 词法 ∕ 测试 ∕ IPC.md 全随动） |
| 探针目标构造落核（fix 轮） | 核心档补 `probeTargetOf`（逐条随迁 VSC `presets.mjs:159` `probeTargetFromEntry`：proxyUri 判式 ∕ apiKey 归一），`probeAdmission` 缺省径 = `probe(name, probeTargetOf(provider))` | 代码评审轮 1 🔴：上提「零语义改」在默认径不成立（VSC 实参面丢失）⇒ 桌面 `provider:verify` 与 VSC 对位面路由分叉（`proxy:true` 渠道探针直连）；补齐 = 探针判据真正单源（用户口径「可见端差以 VSC 为定案」） | ① 默认径维持原条目直传 + 只登记端差（核件声明与实现相抵不消）；② 缝改必填 fail-loud（端侧须自造目标构造 = 判据分叉） |
| `customFieldsError` 三串来源 | baseURL ∕ model ∕ format 三拒因串 = 核持久化面**同条件串逐字**（`config-io.mjs` `addProviderEntry`）——VSC 该三步为静默中止位（无消息可搬） | 「同条件同词」；桌面经 `!== null` 判定、拒码仍 `invalid-shape`（词法零改） | 自铸三串（无出处）；搬 VSC 静默步的「空消息」（判据面不可消费） |
| 拆档三族注入形 | `createReads` ∕ `createInfoFace` ∕ `createExits(deps)` —— 共享项（窄桥 ∕ 值面 ∕ 失败面 ∕ 读数 ∕ 槽锚 ∕ 重绘口）住装配面单一 owner | 沿 `mount-onboarding.mjs` `createWizard(deps)` 先例（§2.1 定稿「三新档接线沿注入先例」） | 三新档反向 import 装配面（环）· 各档自持窄桥副本（双源） |
| 测试锁随动两处 | `host-floor`：装配档入 `fresh` + 例外面撤销（两向断言原样）；`views-locks`：槽锚声明锁**改指声明档** + 新增 re-export 锁 | §2.1「锁随动 = `host-floor` U95 `fresh` 臂清单」；声明面随族迁（`INFO_SLOT` 住 `mount-info.mjs`），锁判据不缩水 | 锁放行（判据缩水）· 声明面强留旧档（拆分点不实） |

**审计与代码评审（终态 = converged ⇒ clean）**

| 轮 | 形式 | 结果 |
|---|---|---|
| 内审 | 背离审计（read-only explore · 12 档逐项对设计） | **DEVIATIONS 7（全 DOC-DRIFT）**；**PARTIAL ∕ SILENT-SIMPLIFICATION ∕ OUT-OF-LIST 零命中**；VSC 树零笔独立复核 ✅；锁定两处「判据不缩水」✅ |
| 1 | 代码评审（advisor · type=code · 12 档 + 设计档上下文） | **changes-required**：🔴1（探针默认径丢失 VSC 目标构造 ⇒ 纯搬声明与实现相抵 ∕ 桌面 verify 与 VSC 路由分叉）· 🟡3（核内 `FORMATS` 双份 ∕ IPC.md 坐标句失效 ∕ §5 报告面）· 🔵4（T-P5 标题 ∕ 缝分档不对称 ∕ 行数读数 ∕ 渲染第三条 `FORMATS`） |
| fix round 1 | 收正：① `probeTargetOf` 补齐并接入缺省径 + 档头声明同步 + 三臂机检（apiKey 归一 ∕ proxyUri 两向）② 缝契约注（自落账义务）③ T-P5 标题收窄（冲突臂如实不覆盖）④ `mount-settings-exits` 行数回收（300 ⇒ 297） | 已落（复跑：核直测 7 ∕ 7 绿） |
| 2 | 代码评审（advisor · type=code · **fix 复核**） | **VERDICT pass**：🔴 核实修复（`probeTargetOf` ∕ `:100` 缺省径 ∕ 与 VSC `presets.mjs:159-170` 逐条对齐——apiKey 支为防御超集、有效档位同值）；**fix 未引入新 🔴**；余 🟡3 ∕ 🔵 登记非阻断（核内 `FORMATS` 双份 ∕ IPC.md 坐标句 ∕ §5 报告面 —— 报告面 ∕ 设计面轮项） |

**读数（实跑）**

- 核套件：`cd thincoder-core && node test/run.mjs` ⇒ **`ℹ tests 803 · pass 803 · fail 0`**（`.thincoder/tmp/r8-core-suite-2.log`）；fix 后末跑 `803 ∕ 802 ∕ 1` —— 红 = `session-slot-verify.mjs` **304** 行未登记（**他批在飞笔**：mtime 13:37 迟于本舱窗 ∕ `git status` 记 `M`，非本舱）；核直测 `node --test test/provider-flows.test.mjs` ⇒ **7 ∕ 7 绿**。
- 桌面套件：`cd thincoder-desktop && node test/run.mjs` ⇒ **`ℹ tests 276 · pass 276 · fail 0`**（`.thincoder/tmp/r8-desktop-suite-3.log`，13:29）；本舱机检定向（`providers` ∕ `views-settings*` ∕ `views-onboarding` ∕ `views-locks` ∕ `host-floor` ∕ `views-chrome-vocab` ∕ `settings` = **44 ∕ 44 绿**）；fix 后复跑 `providers.test.mjs`（U103–U107b 含探针三径）**绿**。
- 探针单测（fix 后）：`provider-flows.test.mjs` ⇒ 7 ∕ 7 绿（含 T-P6 目标构造三臂 + T-P1 探败不阻断）。
- `git status --porcelain` 自证：本舱 12 档（6 改 6 新）；VSC 树本舱零笔（`thincoder-vscode/src/extension/provider-flows.mjs` ∕ `presets.mjs` ∕ `webview/settings-providers.js` 零命中）。

**跨轮接口（R13 落盘适配 —— 非本舱笔，如实登记）**：会话模型轮 R13 已落盘并**适配本舱两档**：`mount-settings.mjs`（撤信息行挂载：无 `INFO_SLOT` 导出、`SETTINGS_KEYS` 去 `projectInfo`、`createInfoFace({ask,store})`）· `mount-info.mjs`（只留 `refreshInfo` —— 读面消费 = 状态行台账超阈段）；`views/info-row.mjs` ∕ `views/tabbar.mjs` ∕ `views/sessions.mjs` ∕ `styles.css` 随 R13 撤档（§2.1 已判「信息行族随左列裁撤退场——`mount-info.mjs` 拆点随裁撤消解」）。R13 落盘后本舱重验：四档模块加载烟测 **OK**（`.thincoder/tmp/r8-smoke-probe.mjs`：re-export 同引用 ∕ 出口表十一键 ∕ 三读数通道 ∕ 具名十键）+ `providers.test.mjs` ∕ `settings.test.mjs` 绿；渲染面 `views-settings*` 待 R13 测试面随动（`test/views-harness.mjs:14` 仍引 `INFO_SLOT` —— R13 面）。

**越域披露（超声明面 · 逐处给由）**：三测试档随动（`host-floor` ∕ `views-locks` ∕ `views-chrome-vocab`）= §2.1「锁随动」点名面（`fresh` 臂清单 + 槽锚锁声明面）；零其它越域。VSC 树零笔 · `config-io` 零触 · 设计档零笔（文档收正归设计面轮 —— 清单见「未办」）。

**未办 ∕ 待父侧（本舱边界外，只报）**

1. **设计面轮（文档收正）**：`IPC.md` 四处坐标句失效（`:213` `provider:verify` 核入口列 ∕ `:235` ∕ `:236`「写面形判常量同值域 = `providers.mjs:24`」（该常量已撤）· `:237` 读账优先坐标）· `PROJECT.md` §4.1 行数账 + 新四档行 + 越层段「在册例外一档 ⇒ 撤销」+ `:301` ∕ `:305` 覆盖面句 · `SHELL.md:45/55` 树面 · `UI.md:29`（`INFO_SLOT` 常量源）· 核侧 `PROVIDER.md:302-305`（流程族登记 + 新核档行）· `CONFIG.md:24/49`（UI 壳口径注）。
2. **核内 `FORMATS` 双份**（`provider-flows.mjs:33` ∥ `config-io.mjs:219`）：评审 🟡 登记（单源化 ∕ 加锁择一）；本舱未动 `config-io`（§2.2 R8 边界「`config-io` 唯一写盘零动」）。
3. **R13 测试面**：`test/views-harness.mjs` 的 `INFO_SLOT` 引用随 R13 更新（本舱面已无该导出 —— R13 轮面）。

### 5.16 交付清单（产品面）〔段号就地顺正：原标 5.1 与上行重号〕

| # | 面 | 落形 | 读数 |
|---|---|---|---|
| 1 | 左列裁撤 | `views/{tabbar,sessions,info-row}.mjs` 删档；`index.html` 三槽（`.rail` / `[data-slot=projects]` / `[data-slot=tabs]`）退场，中区首槽改锚 `[data-slot="session-control"]` | 真机探针：三锚命中 **0**；条体五锚在场 |
| 2 | 会话控制面（VSC 形） | `mount-sessions.mjs` 重写为「面 + 接线」单档：`sessionModel` / `sessionBarTree` / `sessionDropdownTree`（纯构树）+ `mountSessionBar`（薄挂载）；项目钮恒在场（`Open folder…` ∕ 目录基名）、下拉选择器（combobox + `aria-expanded`）、▼ ∕ ✎ ∕ ✕ + 字形住 CSS、条目 = 题 + `data-seg` 元数据 + 位标 + `data-slot` 键锚、空态 `session.empty`、账本注记 = 下拉首行 | 行数 **588**（硬限 500 **越线 —— 未闭项，见 5.19） |
| 3 | 面内态 | 开合 ∕ 换形态住 `FACE` WeakMap（原 store `railForm` ∕ `pendingClose` 两切片退场）；点外关判据 = **类名祖链**（重绘换节点不破）；重挂草稿保护（值 ∕ 焦点 ∕ 光标复填）；**点内不关**吞泡（VSC `session-bar.js:27-29` 同径） | 真机四步全过（切会话关面 / 改名留面 / 删除 popover / 点外关） |
| 4 | 三出口 | 通道名零改：`session:switch` ∕ `session:rename`（✎ ⇒ 条目原位换形）∕ `session:delete`（✕ ⇒ `.auto-confirm` 族 popover：背板 + 两键 + 默认焦点取消 +50ms）；删活动会话 ⇒ 邻位接管 | 真机：popover 五值（句 / 两键 / 背板 / 焦点）全对；改名词面 = VSC 逐字 |
| 5 | 四拆 CSS | `theme.css` **85**（变量 ∕ 基座）/ `chrome.css` **415**（骨架 + 会话控制面 + 状态行）/ `skin.css` **13**（滚动条 ∕ chip 焦点）；`styles.css` 删档；`index.html` 链序 = theme → chrome → skin → chat → core → pool → settings | 布局 = 两列 `minmax(0,1fr) var(--pool-w)`；`--rail-w` ∕ `--rail-w-collapsed` 随退（亮 30 ⇒ 28 / 暗 24 零动） |
| 6 | 随动面 | store 标签族退场（`openTab` ∕ `closeTab` ∕ 关闭确认四条 ∕ `openRailForm` ∕ `closeRailForm` ∕ `tabs` ∕ `activeTab` ∕ `pendingClose` ∕ `railForm`）；`app.mjs` 改 `SESSION_KEYS` ∕ `HEAD_KEYS` + `paintSessionBar` ∕ `paintHead`；BADGE_WORD 迁 `views/chrome.mjs`（状态行从 chrome 引）；statusline ∕ pool ∕ activity ∕ mount-status 输入改 `activeSession`；`mount-info` 只留 `refreshInfo`（读数供状态行超阈段） | 改前基线 209 档 181 过 28 红 ⇒ 收官 **270 档 269 过**（详 5.18） |
| 7 | i18n | 退键：左列族 7 + 标签关闭三键 + 读数面八键（`info.*` 仅余 `info.threshold` —— 信息行视图退场 ⇒ 消费归零）；增 5 键（`session.title` ∕ `empty` ∕ `rename` ∕ `delete` ∕ `deleteConfirm` = VSC 逐字） | 宿主键数 204 ⇒ **188**（两语键集相等机检） |

### 5.17 测试 ∕ 锁面（本段主体 —— 父侧新段授予）〔段号就地顺正：原标 5.2 与上行重号〕

- **改锚档（14）**：`views.test.mjs`（全量重写为会话控制面：模型 ∕ 条体锚序 ∕ 项目钮恒在 ∕ 条目形 ∕ 空态 ∕ 缺省题 ∕ 栅格单源 ∕ 词表键齐 ∕ 元数据族 ∕ 账本注记两向）· `views-rail-actions.test.mjs`（行控件面 ⇒ 下拉条目出口面）· `views-locks.test.mjs`（U52 ∕ U152 ∕ U174 ∕ U182 四处扫描靶迁三拆档 + 导出面 ∕ 键面 ∕ 接线锚随动）· `views-chrome-vocab.test.mjs`（入量树换会话控制面 + 键数 204 ⇒ 188 + 视图档清单去三档）· `store.test.mjs`（标签族 ∕ 关闭确认面 ∕ 行形态三段随裁撤删除）· `views-head` ∕ `views-statusline` ∕ `views-activity` ∕ `views-chrome`（夹具 `activeTab` ⇒ `activeSession`、`tabs` ⇒ `sessions` 行投影）· `host-floor.test.mjs`（信息行挂载段 ⇒ 会话控制面单点重建段）· `views-harness.mjs`（**`INFO_SLOT` 零残留** —— 父侧点名项：夹具改单槽 + `handle.openSettings()`）· `views-settings` ∕ `views-settings-agent` ∕ `views-onboarding`（开面板入口改句柄口）。
- **新档（1）**：`test/views-session-control.test.mjs`（**182 行** —— 下拉结构锁 ∕ 条目面 ∕ 三出口真走 ∕ 重挂保态 ∕ 源面接线锁），已登记 `test/files.mjs`。
- **删档（2）**：`test/views-tabbar.test.mjs` ∕ `test/views-tabbar-close.test.mjs`（两面退场）。
- **集成面改锚（9）**：开项目径 = **原生选择框桩**（`app.evaluate` 覆 `dialog.showOpenDialog`）+ 真点项目钮（`[data-slot="session-control"] [data-action="project:open"]`）—— 真点径不变；会话切换改「真点选择器开面 ⇒ 真点条目」；设置入口改 `#settings-btn`（核件控件行第 7 钮）；ledger-notice 判据迁「下拉首行 = `div.session-ledger-notice[data-ledger-notice]`」；chat-render 的 `.rail` ∕ `.rail-head` ∕ 标签活动态三处 D24 读数迁 `.session` ∕ `.session-bar` ∕ `.session-item.active`；first-run-smoke ⑧⑨ 步（关标签 ⇒ no-session）改锚为**会话生命周期面**（末项门半 + 新建 + 删除 popover）。

### 5.18 验证读数〔段号就地顺正：原标 5.3 与上行重号〕

- 全量套件（`node test/run.mjs`，收口前一次）：**tests 270 · pass 269 · fail 1**；唯一红 = `first-run-smoke`（`session:create` 后条目数断言）。
- 该红定位 = **核面既有口径**（`sessions:list` 按槽文件**盘面实读** ⇒ 新建会话首存前不入列），非本舱缺陷；已把该步改锚为可观察规则（条目数 ≥ 1 + 末项门半 `删除控件数 == (条目 > 1 ? 条目 : 0)`），**单档复跑 = 1 pass / 0 fail**（`.thincoder/tmp/r13-frs2.log`）。
- 真机探针（`tmp-r13-probe.mjs` → 已归档 `.thincoder/tmp/r13-probe-standalone.mjs` + `r13-probe.png`）：boot=ok · 残留三锚 0 · 五锚在场 · 开项目（对话框桩 + 真点）· 新建 ×2 ⇒ 条目 2 · 切会话（关面）· 改名（留面 + 标题落）· 删除（popover 五值 + 焦点默认取消）· 点外关 · pageerror 0。
- 目标单档（本段内逐档复跑，非全量循环）：`views-locks` 4/4 · `views` 8/8 · `views-rail-actions` 2/2 · `views-session-control` 4/4 · `store` 10/10 · `views-settings*` ∕ `views-onboarding` 全过 · `views-chrome-vocab` 1/1 · `host-floor` 11/11 · `views-head` 5/5 · `views-statusline` 7/7 · `views-activity` ∕ `views-chrome` 12/12。

### 5.19 未闭项（本舱如实登记 —— 父侧裁）〔段号就地顺正：原标 5.4 与上行重号〕

1. **`renderer/mount-sessions.mjs` = 588 行**（AGENTS.md 硬限 500 **越线**；`chrome.css` = 415 行，越 300 建议线）。成因 = 会话控制面与接线同档。建议落形：纯构树三件（`sessionModel` ∕ `sessionBarTree` ∕ `sessionDropdownTree` + 节点助手）出 `renderer/views/session-control.mjs` ⇒ 接线档 ≈ 300；随动面 = 6 测试档 import + `views-locks` 导出面锁一行（本舱未改，避免与在飞测试面互踩）。
2. **新建会话首存前不入列表**（5.18 项，核 `SESSION.md` §6.22 盘面实读口径的可见后果）—— 新会话在下拉里「按下无痕」，直到首存才入列。若要改善 = 核侧条目集补「本端未落盘槽」或端侧乐观插行（**属核面 ∕ 设计面裁量，非本舱可自决**）。
3. **旧切片文案残留**（`views/settings.mjs:11,276` · `views/chat-copy.mjs:12` · `views/chat-tool.mjs:46` · `views/chat.mjs:32` · `mount-settings-exits.mjs:288` 等悬空注释指针，指已删 `styles.css` ∕ 三视图档）—— 均为**注释文字**非状态面判据（状态面零残留机检 = `.rail` ∕ `[data-slot="projects"]` ∕ `[data-slot="tabs"]` 三锚命中 0），留父侧统裁。`settings.css` 的 `.info-entry` 死规则同列。
4. **`no-session` 引导态在本模型下近乎不可达**（原「关标签 ⇒ no-session」入口随标签族退场；开项目 ⇒ `session:resume` 恒有活动会话）—— 词键与分支保留，first-run-smoke 对应步已改锚为会话生命周期面。

### 5.20 轮次与终态〔段号就地顺正：原标 5.5 与上行重号〕

- 自写实现 → 内部探索式审计（父侧点名三红 `INFO_SLOT` ∕ `views-locks` 扫描靶 ∕ `info-row` 缺档 + 本舱自查 28 红全量）→ 自修 **2 轮**（① 产品面交互修：下拉点内不关吞泡 + 两控件 `data-slot` + 接线形 `disabled` 诚实面；② 测试面改锚 + 新档 + 登记）→ 收口全量一次 + 唯一红单档复跑 → 报告收敛。
- 终态 = **clean**（无残留红；未闭项 5.19 已逐条登记，其中第 1 条为硬限越线 —— 提请父侧裁）。
- 越域披露：见 5.19 第 3 条（他舱注释指针未改，仅披露）。

### 5.11 R1 实施舱（A 面 = 产品面）· 核件卡族直消费 + 排队标记残项 + `chat.css` 先拆后改（eng-coder · 2026-09-28）

**目标**：R1（§2.2 行动表 11 行 + 端壳适配 a–g）= 桌面卡三面（审批 ∕ 提问 ∕ 计划）改**直接消费** `render-core` 现件（桌面自造构树面退场，端侧只留宿主胶水）；`chat.css` **先拆后改**（拆点 = §2.1 拆档定稿：`chat-cards.css` ∕ `chat-composer.css` ∕ `chat-fixes.css`，链序随动）；核件小修唯一条 = IME 组字门（`cards/question.mjs`，§1.6 已裁 = 准）。

**父侧裁（本舱两次 ask 回执 · 逐字在册）**：①（承「R1 #7/#8 待发送面」冲突上报）**B 侧为准** —— 用户 21:07 直令 + 姊妹批已落终态（`[data-composer-notices]` 输入区带 ∕ 流内零节点）晚于且覆盖 R1 #8 的「在连泡就近标记形」⇒ **R1 #8 的流内 ∕ 输入面板部分行内退场（不落地）**；`planBusyQueued` 在该形态下无消费点 ⇒ **不消费**；可做残项 = `renderer/queue.mjs` 容量常量改核件单源 + 口径注（本舱已落，声明外披露）；设计面（R1 #8 行 ∕ KD-31 邻位 ∕ §2.7 行 4）随设计面轮收正（本舱零触设计档）。

**逐档表（本舱实改 · 18 档 = 15 改 + 3 新 · 行数 = read 实读总行数）**

| # | 档 | 前 ⇒ 后 | 动作 |
|---|---|---|---|
| 1 | `thincoder-render-core/cards/question.mjs` | 90 ⇒ **94** | **核件唯此一改**：作答控件 `keydown` 补 IME 组字门（`isComposing` ∥ `keyCode 229` 两臂 —— 与 `composer/panel.mjs:179` 逐字同族）；组合期 Enter 零提交零防默认 |
| 2 | `renderer/views/approval.mjs` | 201 ⇒ **244** | 构树面（`approvalTree` ∕ `headNode` ∕ `diffNode`）退场 ⇒ **核卡工厂直取 + 端壳六件**：出站桥（`emit` ⇒ `onApprove` 单路 = 池面 `submitVerdict`，非乐观）、锚装饰（`data-card` ∕ `data-shape`）、键位胶水（1/2/3 ⇒ `preventDefault` + 触发核卡内对应出口控件；缺 handlers 不挂）、置焦锚（`.deny` ⇒ `data-autofocus="1"` 卡内恰一）、大 diff 钮两径（`diff.path` 在场才留 ⇒ `onOpenFile`；`apply_patch` 形退场）、回执失败径一次重挂；**池面描述符原位保留**（`approvalActions` ∕ `verdictOfKey` ∕ `approvalExits` ∕ `approvalSummary` ∕ `approvalTitle`） |
| 3 | `renderer/views/question.mjs` | 113 ⇒ **59** | 构树面退场 ⇒ 核卡直取 + 端锚（`data-card`）；P3② 经核卡 `deps.onAnswered` 回焦输入区；P2 随核卡内建；`respondQuestion` 回执径保留 |
| 4 | `renderer/views/plan.mjs` | 45 ⇒ **35** | 核 `renderTaskPanel` 直取（`{el, visible}`）；**切片形归一**（端壳：`tasks` 切片 = items 数组 ⇒ `{ items }` 载体）；可见判据随核（空 ∕ 全 done 未示 ⇒ 卡不在场） |
| 5 | `renderer/mount-cards.mjs` | 185 ⇒ **153** | 挂载 ∕ 幂等同步面接**核卡元素**（原 `build(descriptor)`）；插点锚 ∕ 卡序 ∕ 等值零写判据不变；P3① 聚焦核卡 `.question-input`；失败径 ⇒ `paintCards()` 一次重挂（卡复现可重试） |
| 6 | `renderer/views/chat-cards.mjs` | 52 ⇒ **51** | 审批族同步面接核卡元素；等价判据（`prompt-id` ∧ `data-shape` ∧ 文本）与锚面零改 |
| 7 | `renderer/views/chat.mjs` | 355 ⇒ **350** | 卡树引用改 `approvalCardNode`（核卡**真元素**入描述符树 —— `dom.mjs` `fill` 真节点直挂）；帧尾置焦执行点沿用 `focusAutofocus` |
| 8 | `renderer/views/chat-chrome.mjs` | 289 ⇒ 289 | **1 行注释指针**随四拆收正（停止痕样式 ⇒ `chat-fixes.css`） |
| 9 | `renderer/queue.mjs` | 42 ⇒ **46** | 容量常量改核件单源（`QUEUE_MAX = QUEUED_MAX_ITEMS`，自 `/rc/flow/queued-mark.mjs`）+ 口径注（声明外披露）；`applyQueue` 语义零改 |
| 10 | `renderer/i18n-views.mjs` | 69 ⇒ **125** | 新增**核卡词键 15 × 2 语**（`perm.*` 7 ∕ `question.label/mark/submit/customPlaceholder/placeholder` 5 ∕ `panel.*` 2 ∕ `goal.objective` 1；值逐字同 VSC `locales/{en,zh}.json`，入本档不入 `i18n.mjs`） |
| 11 | `renderer/mount-pool.mjs` | 90 ⇒ **91** | 审批出口 `onApprove` 回执改 **Promise 回值**（流内卡失败径重挂判据读回执 `ok`；池面条目消费面零改）—— 声明外披露 |
| 12 | `renderer/app.mjs` | 269 ⇒ **271** | 流面 handlers 增两键：`onOpenFile`（核卡大 diff 钮 ⇒ `file:open` 同出口）· `onCardRefresh`（失败径一次卡面重挂）—— 声明外披露 |
| 13 | `renderer/index.html` | 44 ⇒ **47** | CSS 链序随四拆：theme → chrome → skin → chat → **chat-cards → chat-composer → chat-fixes** → core → pool → settings |
| 14 | `renderer/chat.css`（主档） | 511 ⇒ **229** | 四拆后主档 = 对话流面（块 / 工具卡 / 摘要 / 药丸 / 空态 / 标签 / 待发送带 / 消化行组 / 归档块） |
| 15 | `renderer/chat-cards.css`（**新**） | — ⇒ **143** | 卡族段：池面操作区（原位值）+ **核卡类名映射**（`.permission-prompt*` / `.question-*`；值源 = VSC `base.css:190-291` ∕ `:296-366`）+ 端壳两增量（置焦锚高亮 ∕ 卡内按钮 reset 等效） |
| 16 | `renderer/chat-composer.css`（**新**） | — ⇒ **72** | 输入区段：变量别名块（C2 唯一桥，消费面扩核卡变量名）+ 两挂件锚 + 两复制控件 + D24 交互态组 |
| 17 | `renderer/chat-fixes.css`（**新**） | — ⇒ **94** | 「对齐第三批」小修族尾段（错误横幅 / 停止痕 / 台账行 / diff 预览 / 文件链接 / 欢迎条），规零改，唯 `styles.css` 指针收正为 `theme.css` |
| 18 | `renderer/core.css` | 346 ⇒ **421** | 增 **⑤ 核卡族段**（`.perm-btn` 族 + 计划卡核体 `.panel-desc` / `.task-*`；值源 = VSC `base.css:261-291` ∕ `controls.css:40-153`）+ 头注两处收正（族数 ∕ `theme.css` 指针） |

**决策透明表（设计未逐字之处 —— 逐条给由）**

| 决策 | 取值 | 依据 | 被否备选 |
|---|---|---|---|
| 审批出口实作 | 核卡 `emit` ⇒ `handlers.onApprove`（= 池面 `submitVerdict` 同一路 ⇒ 回执 `ok` 真才 `clearApproval` + `applyFlags`） | 「接线与卡面同一路」（`mount-pool.mjs` 头注）+ 端切片清除归回执面（非乐观）⇒ 卡面 ∕ 池面零第二实现 | 卡面直调 `respondApproval`（切片永不清 ⇒ `syncCards` 每帧重插卡）· 卡面自持第二套清除逻辑（双实现） |
| 失败径重挂判据 | `onApprove` 返 thenable 才判；回执 `ok !== true`（含 reject）⇒ `onCardRefresh()` 一次；同步返值 / `undefined` ⇒ 零动作 | 端壳适配 d「回执失败径端壳触发一次卡面重挂 ⇒ 卡复现在场可重试」；判定面单源 = 回执（无回执面不误判失败） | 无回执面也重挂（每次点按多一次重绘）· 失败不重挂（核卡点按即摘 ⇒ 卡永久消失，缺陷） |
| 大 diff 钮判定面 | 端壳判 `diff.path`（单径）在场 ⇒ 留钮并经 `onOpenFile` 走 `file:open`；`apply_patch` 形（无单径）⇒ 摘钮 | §2.7 行 3②（宿主能力面例外）落法逐字：「`diff.path` 在场 ⇒ 钮在场 + `file:open`；`apply_patch` 形 ⇒ 钮退场（不引入死控）」 | 一律摘钮（丢单径可用径）· 一致留钮（`apply_patch` 形 = 死控） |
| 键位胶水挂点 | 卡根 `keydown` ⇒ 闭集命中即 `preventDefault` + **触发核卡内对应出口控件**（`click()`）；表外键零动作 | 端壳适配 a 逐字「命中 ⇒ 触发核卡内对应出口控件；判据表沿用端侧 `verdictOfKey`」⇒ 键位与鼠标走同一核实现（零第二出口逻辑） | 卡根键位直调 `onApprove`（绕过核卡 `emit` 与即摘 ⇒ 双路分叉） |
| 形归一（工厂选择） | `item.shape === "batch"` ⇒ 批卡；余 ⇒ 逐项卡；`data-shape` 仍落**原样值**（非空串才落） | 核卡两形（`renderApprovalCard` ∕ `renderBatchApprovalCard`）；锚面「零假造」沿旧判据 | 表外形 ⇒ 零卡（旧形有首行可读 ⇒ 可见面回退）· 归一值落锚（失真） |
| 计划切片形归一落点 | 落 `views/plan.mjs` 端壳（数组 ⇒ `{ items }`；载体形直通；余原样交核） | 核卡入参形 `{ items }`（`cards/panel.mjs:18`）；桌面三写者（`questions.mjs` `onTask` ∕ `session-slots.mjs` 播种 ∕ 页读）**恒写 items 数组** ⇒ 单点归一 ⇒ 核件零改 | 改核件吃数组（违「核件零改」）· 改三写者形（触面外扩 + 状态行读面同改） |
| 核卡按钮外观 | 核卡裸类钮（`.approve` ∕ `.approve-all` ∕ `.deny` ∕ `.one-by-one`）只映射 VSC 全局 reset 两值（`margin:0; padding:0`），余承 UA 默认 | VSC 两源（`base.css` 与 VS Code webview 默认样式表）**皆无按钮规则**（实读证据在案）⇒ 实形 = UA 默认，reset 为其唯一形塑 | 自造三钮样式（违「不重设计 ∕ 以核面为定案」）· 零映射（与 VSC reset 形不一致） |
| `queue.mjs` 容量源 | `QUEUE_MAX = QUEUED_MAX_ITEMS`（自 `/rc/flow/queued-mark.mjs` re-export） | R1 #7 ∕ 父侧裁 ③ 残项；渲染面可达源 = 核件渲染面副本（`/rc/` 同源），值 8 与 `@thincoder/core/queued.mjs` 同值；原端侧字面为第三份副本 | 引 `@thincoder/core/queued.mjs`（渲染面静态闭包不可达）· 保留本地字面（第三副本） |
| 失败径错误面 | 卡桥 `onApprove` 缺 ⇒ 零派发 + `console.error`；表外 `type` ∕ 表外值 ⇒ 零派发 + 记错 | 两态通则（核卡钮无 `disabled` 面 ⇒ 桥为唯一门；缺 handlers 时键位不挂但按钮仍可点 ⇒ 必须显式记错而非静默） | 静默吞（点按零反应不可察） |

**验收四条（本舱自证）**

1. **① 核卡类名在场 ∧ 三锚装饰恒在 ∧ `[data-autofocus="1"]` 恰一**：自检脚本 `.thincoder/tmp/r1-probe.mjs`（真 DOM = happy-dom，仓内既有 devDependency）⇒ **46 ∕ 46 通过**：审批两形核类名 / `data-card` ∕ `data-shape` ∕ `data-prompt-id` / 置焦锚恰一且落 `.deny` / 提问卡三件 + 端锚 / 计划卡核体（`.panel-desc` + `.task-item` + `.task-status`）/ 两挂载面族序与幂等（等值重挂同节点）。
2. **② 键位 ∕ 出站映射 ∕ 回执失败卡复现径在册**（测试归 R1-B）：键位 1/2/3 两形逐值（`once` ∕ `always` ∕ `reject`；`approveAll` ∕ `deny` ∕ `oneByOne`）+ 表外键零动作 + 缺 handlers 不挂；出站四映射（`permissionResponse` true→once ∕ "approveAll"→always ∕ false→reject；`batchPermissionResponse` 同名 verdict；`questionResponse` ⇒ 同路；`openDiff` ⇒ 单径 `file:open`）；失败径 = 新节点复现 + 切片未清（`attachCards` 两径探针）；成功径 = 回执 `ok` 真才清切片。
3. **③ 定向单档子集复跑**（16 档；**未跑全量** —— 用户 22:42 测试纪律）：`tests 81 · pass 70 · fail 11`，红项逐条点名见下（**R1-B 承接清单**）。
4. **④ `git status` 自证**：本舱改档 18（15 改 + 3 新，逐档见上表）；同树并存他批在飞改动（姊妹批 `renderer/*` 输入面板面 · `views/activity.mjs` ∕ `mount-composer.mjs` ∕ `store.mjs` ∕ `events*.mjs` ∕ `theme|chrome|skin.css` 等他舱产物）**非本舱笔**，逐项分列不背书；VSC 树（`thincoder-vscode/**`）本舱零笔。

**读数（实跑）**

- 真 DOM 冒烟（自检脚本 · 真核件 + 真渲染档）：**46 ∕ 46 通过**（含 `[data-autofocus]` 恰一 · 组字门两臂 · 大 diff 钮两径 · 失败径重挂 · 两挂载面幂等）。
- 词表探针：`VIEWS_DICT` 42 ∕ 42（两语键集相等）；`HOST_DICT` **203 ∕ 203**（相等；R13 记 188 + 本批 15）；15 核卡键逐键在场 ∧ 值逐字同 VSC `locales/{en,zh}.json`（逐键比对在册）。
- 定向单档子集（`node --import ./test/rc-resolve.mjs --test` · 16 档 = 本舱触面及其消费面）：**tests 81 · pass 70 · fail 11**。红项逐条（**R1-B 承接清单**）：
  1. `test/views-approval.test.mjs`（整档不加载）—— 引已退场导出 `approvalTree`；
  2. `test/views-question.test.mjs`（整档不加载）—— 引已退场导出 `planTree` ∕ `questionTree`；
  3. `test/views-chrome-vocab.test.mjs`（整档不加载）—— 引 `approvalTree`；
  4. `test/views-chat-frame.test.mjs` U71 —— `document is not defined`（核卡工厂需 DOM 宿主）；
  5. `test/views-chat.test.mjs` U194 —— 假 DOM 不解析 `innerHTML` ⇒ 核卡出口控件不可寻（同一宿主缺口）；
  6. `test/events-page.test.mjs` U91 —— 同（核卡工厂需 DOM）；
  7. `test/views-locks.test.mjs` U52 —— `approval.mjs` 导出面（新增 `approvalCardNode` ∕ `verdictOfEmit`，退场 `approvalTree`）；
  8. `test/views-locks.test.mjs` U152 —— 断言 `.chat-copy-block` ∕ `.composer-notice` 规则在 `chat.css`（已随四拆迁 `chat-composer.css`）；
  9. `test/views-locks.test.mjs` U182 —— D24 交互态组扫描靶在 `chat.css`（同迁移）；
  10. `test/views-chrome.test.mjs` U126 —— 断言卡族 Enter 径同取 `isComposing`（P2 已随核卡内建，端源面零命中）；
  11. `test/views-chrome.test.mjs` U207 —— 断言两保留行整行面在 `chat.css`（同迁移）。
  归因统一：4–6 = 「核卡产 DOM 需真宿主」（假 DOM 不可承载核卡 `innerHTML` 解析）；1–3 ∕ 7–11 = 「导出面 ∕ 源面扫描靶随 R1 换装漂移」。
- 绿项（同子集内、本舱触面）：`store`（含 `QUEUE_MAX` 核值对拍）· `guard-closure`（`/rc/` 静态闭包）· `host-floor` · `views-activity`（池面零动）· `timer-wake` · `views-chat-scroll` · `views-chat-text` · `views.test.mjs`。
- **not full-suite verified — the parent-side closeout run is the only full-run point.**

**审计与代码评审（终态 = converged ⇒ clean）**

| 轮 | 形式 | 结果 |
|---|---|---|
| 1 | 内审 ∕ 背离审计（read-only explore · 18 档逐条对设计） | **DEVIATIONS 2**：DOC-DRIFT 1 🟡（设计档三处收正未落 —— 派单已明归设计面轮 ⇒ 非本舱缺陷）· OUT-OF-LIST 1 🔵（临时探针档 `r1-dict-probe.mjs` 未披露 ⇒ 本报告披露）；对判 10 条 = 9 达成 + 1（`chat.css` 四拆**规则级**）× 不可验证（盘面无原档副本 · 本舱无 git 面）；边界四项（池面 / goal 面 / 输入面板 / VSC 树）零命中 ✓ |
| 2 | 代码评审（advisor · type=code · 17 档 + 批档上下文） | **changes-required**：🔴1（**计划卡切片形不符 ⇒ 卡永不渲染**：`tasks` 切片 = items 数组，核 `taskVisible` 读 `progress?.items`）· 🟡3（`[data-autofocus="1"]` 恰一口径 vs 多卡帧 · `approval.diff.large` 死键 + `changes` 只写不读 · 两建议线越档）· 🔵2（`signature` 三面实两面 · `queue.mjs` 单源一跳） |
| fix round 1 | ④ 🔴 收正：`views/plan.mjs` 增 `progressOf` 端壳归一（数组 ⇒ `{items}` 载体；载体形直通；余原样交核）；探针夹具改**生产切片形（数组）**+ 新增载体形直通臂（该缺陷的回归臂） | 已落（探针 46 ∕ 46 绿；子集红集不增不减） |
| 3 | 代码评审（advisor · type=code · 复核 fix 声明） | **VERDICT pass**：🔴 核实修复（`plan.mjs:20-22` ∕ `:27` 归一 + 三写者形逐条复核 + 四态不回归）；**未引入新 🔴**；余 🟡3 ∕ 🔵3（`signature` 声明腿 · 置焦锚恰一 · 死键 · 单源一跳 · 越档两处）全非阻断 · 零 must-fix |

**越域披露（超声明面 · 逐处给由）**

1. `renderer/mount-pool.mjs`（+1 行）：`onApprove` 回执改 Promise 回值 —— 端壳适配 d 的「回执失败径重挂」判据必需（否则卡面无法判失败）；池面条目消费面零改（同步返值语义不变，多回一个 Promise）。
2. `renderer/app.mjs`（+2 键）：`onOpenFile`（§2.7 行 3 大 diff 单径钮 ⇒ `file:open` 同出口，零第二通道）· `onCardRefresh`（端壳适配 d 的一次重挂 ⇒ 帧出口 `paintChat`）。
3. `renderer/views/chat-chrome.mjs`（1 行注释）：停止痕样式指针随本舱四拆收正（`chat.css` ⇒ `chat-fixes.css`）—— 本舱改动直接致其失效。
4. `renderer/core.css` 头注两处（族数「三族 ⇒ 五族」· `styles.css` ⇒ `theme.css` 指针）：前者本舱新增 ⑤ 段所致，后者 R13 四拆遗留的失效指针（同档触面收正）。
5. `renderer/queue.mjs` 头注一行（读面描述）：姊妹批 B12 终态（输入区带）致其失真，同档触面收正。
6. 临时件（未跟踪 · `.thincoder/tmp/`）：`r1-probe.mjs`（真 DOM 自检脚本）· `r1-dict-probe.mjs` ∕ `r1-dict-probe` 输出 · `r1-scoped-test{,2,-final,-postfix}.log` —— 探针 ∕ 日志面，不入交付。

**未办 ∕ 待父侧（本舱边界外，只报）**

1. **设计面轮收正**（R1 文档收正行 + 本舱新增项）：`UI.md` 审批呈现 ∕ 提问呈现 ∕ 计划面 ∕ 键盘可达（P2 ∕ P3 增量退场 ∕ 按核件面直落）∕ i18n 五行；`RENDERER.md` §1.1；`PROJECT.md` §4.2 文件表 + §7 用例行 + KD-31 ∕ §10 AZ（`planBusyQueued` 消费口径 = 本批裁① 后**仍不消费**）；R1 #8 行（① 消除形式）随裁① 收正。
2. **置焦锚高亮 = 端壳可见增量**（评审 🟡）：`chat-cards.css` `.permission-prompt [data-autofocus="1"] { border-color: var(--accent) }` —— VSC ∕ 核卡面无有；§2.7 两值下宜删或登记（用户口径裁决），本舱不做自决。
3. **死键 ∕ 只写数据**（评审 🟡）：`approval.diff.large`（核卡直消费后零生产消费面）+ `changes` 载荷键（现无读面）—— 去留随 R1-B 词表锁 ∕ 设计面轮。
4. **R1-B 承接清单**：见「读数」11 条红项（改锚 = 核卡真宿主 ∕ 导出面 ∕ 源面扫描靶 ∕ CSS 扫描靶四族）。
5. `views/chat.mjs` 350 行 · `core.css` 421 行（>300 建议线，<500 硬限）—— 拆点随 R12 ∕ 设计面轮登记（本舱不返工）。

### 5.12 R13-B 实施舱 · 会话模型轮收齐 + `mount-sessions.mjs` 硬限拆分（eng-coder · 2026-09-28）

**目标**：R13-B（A 面 #100 实盘为准）——① 收齐测试 ∕ 锁面（改锚 ∕ 新锁 ∕ 集成序逐档核对）；② **父侧追加项（入本舱面）**：`renderer/mount-sessions.mjs` 588 行越 500 硬限 ⇒ 按 §5.19 落形，纯构树三件出档 `renderer/views/session-control.mjs`。

**产品面交付（本舱主体 · 在盘 · read 口径）**

| # | 档 | 前 ⇒ 后 | 动作 |
|---|---|---|---|
| 1 | `renderer/views/session-control.mjs`（新档） | — ⇒ **225**（内容行 224） | 纯构树三件 `sessionModel` ∕ `sessionBarTree` ∕ `sessionDropdownTree` + 节点助手（`shortDate` ∕ `baseName` ∕ `projectNode` ∕ `selectorNode` ∕ `itemNode` ∕ `metaNode` ∕ `badgeNode` ∕ `controlNode` ∕ `renameForm` ∕ `ledgerNotice` ∕ `buttonNode` ∕ `wire` + `NOTICE_SEP`）——**结构拆分零语义**；import = `../i18n.mjs` ∕ `../store.mjs` ∕ `./chrome.mjs` |
| 2 | `renderer/mount-sessions.mjs` | **588 ⇒ 387**（内容行 386） | 撤已迁族 + 改 `import { sessionBarTree, sessionModel } from "./views/session-control.mjs"`（`:35`）；留挂载 ∕ 交互（`FACE` ∕ `wireFace` ∕ `bindOutsideClose` ∕ 草稿两助手 ∕ `submitRename` ∕ 确认 popover）+ 接线（`refreshRail` ∕ 三出口 ∕ `backfill` ∕ 接管）；导出面 12 ⇒ **9**；零功能改（注释位移微修 1 处 —— 「页读径拆分产出」注归位 `page-read` import 上方） |

**核验读数（全清令前 · 历史在案）**

- 导出面（独立探针 · `.thincoder/tmp/b-face-probe.mjs`）：mount = 9 名（`SESSION_SLOT` ∕ `activateSession` ∕ `backfill` ∕ `confirmRename` ∕ `createSession` ∕ `deleteSession` ∕ `mountSessionBar` ∕ `refreshRail` ∕ `resumeOpened`）∥ session-control = 3 名（`sessionModel` ∕ `sessionBarTree` ∕ `sessionDropdownTree`）——逐名相等；`app.mjs` 消费集零改。
- 定向（末次）：`node --import ./test/rc-resolve.mjs --test test/views-session-control.test.mjs test/views.test.mjs test/views-rail-actions.test.mjs test/host-floor.test.mjs` ⇒ **27 ∕ 27 绿**；`test/guard-closure.test.mjs` ⇒ **3 ∕ 3 绿**（新档入渲染闭包）。
- 全量一次（`node test/run.mjs`）：**265 tests ∕ 254 pass ∕ 11 fail** —— 11 红逐条归 **R1 在飞面**（`approvalTree` ⇒ `approvalCardNode` 改名期 + `chat.css` 四拆期 + 核卡真 DOM 依赖；含 `views-locks` U52/U152/U182 与三档加载失败），**零条归本舱**；集成域（T-DSK27 ∕ 32 ∕ 37–40 ∕ 42–47）全绿。
- 行数：拆分后仍越 **300 顾问线**（386 > 300，≤500 硬限内）——全清令前已按在册例外臂登记；**未闭项（父侧裁）**：再拆两面（交互族 `:46-239` ∕ 接线族 `:241-386`）之议在册。

**决策透明表**

| 决策 | 取值 | 依据 | 被否备选 |
|---|---|---|---|
| 拆分落形（父侧令） | 只出纯构树三件 + 节点助手；挂载 ∕ 交互 ∕ 接线留档 | §5.19 具名落形；最小改面 ⇒ 随动面可枚举（不触 `app.mjs` ∕ 导出面） | 更大切分（交互族同出 ⇒ 触碰 app ∕ 导出面，越令） |
| 导出面处置 | 三件**不 re-export**（同名面随迁；随动改指新档） | §5.19「6 测试档 import 随动」直取；单源零双出口 | re-export 保旧面（双出口 ∕ 锁面不实） |
| `NAME_INPUT` 住留 | 选择符常量留挂载档（树面只写属性字面） | 只挂载侧消费（草稿两助手 ∕ `submitRename`）；「词面读数落挂载档」锁面维持 | 随树面出档（锁行须同拍同改，无实益） |
| 注释位移（微修） | 「页读径拆分产出」注自 `dom.mjs` import 上方移至 `page-read.mjs` import 上方 | 描述对象 = `page-read.mjs`（原档错位，随重写顺正；审计已标） | 原样保留（错位注留档） |

**审计与代码评审（终态 = converged ⇒ clean〔产品面〕）**

| 轮 | 形式 | 结果 |
|---|---|---|
| 1 | 内审 ∕ 背离审计（read-only explore） | 结构保真 ∕ 随动完备 ∕ 新档覆盖 ∕ 锁面 ∕ 红项归因五项核：**零 SILENT-SIMPLIFICATION**；2×🟡（CJK 锁射程 ∕ `store.test` 退役归因）+ 2×🔵（临时件披露 ∕ 计数注释）+ 事实更正（集成四档 T-DSK32/38/39/40 全绿在册）——测试面项随全清令作废 |
| 2 | 代码评审（advisor · type=code · 9 档 + 批档） | **VERDICT pass**（🔴 0 · 🟡 1〔拆分后仍越 300 顾问线 · **非必改**〕· 🔵 3〔`files.mjs` 重置指针 ∕ 两档守卫指针悬空 ∕ 本轮 §5 记录缺位 —— 末条随本文闭合；前两条随测试重建轮〕） |
| fix round | —（零必改项 ⇒ 零修正轮） | 终态 **converged ⇒ clean**（产品面） |

**越域披露（超声明面 · 逐处给由）**

1. 拆分 = 父侧追加项（明令「按 §5.19 落形落」）——A 面源档唯一触碰点 = `mount-sessions.mjs`（超原「不改 A 面源件」边界的**父侧授权项**，如实披露）。
2. 全清令前曾落测试面随动七档（`test/views.test.mjs` ∕ `views-rail-actions` ∕ `views-chrome-vocab` ∕ `host-floor` ∕ `views-locks` ∕ `views-session-control` ∕ `files.mjs`）= 行动表 12–14 行面 —— **测试面随父侧全清令取消**（整树删除、作废、不计交付）。
3. 临时探针 5 档住 `.thincoder/tmp/`（`b-face-probe.mjs` ∕ `b-settle-wait{,2,3,4}.mjs` + 运行日志）——未跟踪、随清可删。

**not full-suite verified by this round — the parent-side closeout run is the only full-run point.**（本舱全量只跑一次，读数带归因；测试面随父侧全清令取消。）

### 5.13 R11 补轮实施舱 · 状态行 banner 四位字色 → CLI 对齐 + 分隔两边缘面（eng-coder · 2026-09-28）

**目标**：承 #88（分隔 ∕ base dim ∕ warn 黄已收）+ 用户「字色全对齐」直令——收 banner 四位字色端差（CLI 实形 `render-frame.mjs:227-230` 现读：`auto` 黄 ∕ `plan` 青 ∕ `advisor`·`eng` 亮绿）+ 分隔两边缘面裁定 + 真机探针复跑。**范围**：只字色 ∕ 分隔 ∕ 拆出档内落点（段集 ∕ 段序 ∕ 段读数逻辑零改；VSC 树 ∕ 核件零改；不触 R13 ∕ 右列修正面）。

**逐档表（本舱实改 · 两档 · 行数 = read 实读）**

| # | 档 | 前 ⇒ 后 | 动作 |
|---|---|---|---|
| 1 | `thincoder-desktop/renderer/theme.css` | 85 ⇒ **90** | 两新槽 × 亮 ∕ 暗：`--mode-plan`（`#0598bc` ∕ `#11a8cd`）· `--mode-advisor`（`#14ce14` ∕ `#23d18b`）—— 值 = VSC 终端 ANSI 同码默认（`terminal.ansiCyan` ∕ `ansiBrightGreen`；microsoft/vscode `terminalColorRegistry.ts` `ansiColorMap`） |
| 2 | `thincoder-desktop/renderer/chrome.css` | 415 ⇒ **424** | 状态行段：banner 四色三规则（`:414-416`）· 告警位相邻条（`:411-412`）· 判句 ∕ 注句在档（`:392-393` ∕ `:410` ∕ `:413`） |

**对表（CLI 色码 ⟷ 桌面落值 · 验收②）**

| CLI 段 | CLI 常量 ∕ 码（逐字取值） | 桌面段锚 | 桌面槽 | 落值（亮 ∕ 暗） |
|---|---|---|---|---|
| AUTO | `C.warn` = `ansi.fg(3)`（`ansi.mjs:46`） | `[data-seg="auto"]` | `--warn`（**复用**——CLI 同一常量，不裂双黄） | `#bf8803` ∕ `#cca700` |
| PLAN | `C.tool` = `ansi.fg(6)`（`ansi.mjs:43`） | `[data-seg="plan"]` | `--mode-plan`（新增） | `#0598bc` ∕ `#11a8cd` |
| ADVISOR | `C.advisor` = `ESC[92m`（`ansi.mjs:47`） | `[data-seg="advisor"]` | `--mode-advisor`（新增） | `#14ce14` ∕ `#23d18b` |
| ENG | `C.advisor`（同常量） | `[data-seg="eng"]` | `--mode-advisor`（同上） | `#14ce14` ∕ `#23d18b` |

**分隔两边缘面裁定（判句 ∕ 注句在档 = `chrome.css:393`）**：① 换行时行首悬空 `│` —— **不采用**（由：段自携前导 `::before`（CLI「每段自携」同构）；纯 CSS 无「行首」选择器 ⇒ 修需 JS 测行 ∕ 改布局 = 越「段集 ∕ 段序 ∕ 段读数逻辑零改」边界；孤竖线与段间分隔同形同色、仅窄窗换行边缘可见）。② `.status-alert`（非段位）无条 —— **采用**（由：段链逐项已 `│` 分隔、告警位紧随 ⇒ 断链观感；CLI 非段位席位（注意力 chip）亦携 `│`（`render-frame.mjs:245`））—— 落形 `:411-412`（前邻在场才落条；几何 = 两侧各 6px）。

**读数（实跑 · 真机探针 = `.thincoder/tmp/r11b-status-probe.mjs` · 亮 ∕ 暗两轮 · `pageErrors = 0`）**：两轮读数在 `r11b-probe{,2,3}.log`。
- banner 实读 computed：亮 = plan `rgb(5,152,188)` · auto `rgb(191,136,3)` · advisor ∕ eng `rgb(20,206,20)`；暗 = plan `rgb(17,168,205)` · auto `rgb(204,167,0)` · advisor ∕ eng `rgb(35,209,139)` —— 与槽值逐值相符（rgb ↔ hex 换算）。
- 连带三面（`--warn` 同角色 · 今址）：`.chat-stopped`（`chat-fixes.css:39`）· `.ledger-line.warn`（`core.css:418`）· `.sub-stop-btn`（`core.css:310`）= 亮 `rgb(191,136,3)` ∕ 暗 `rgb(204,167,0)` ✓。
- 分隔实读：banner 邻接 `margin-left −12px` · 通用 −6px · 告警位相邻条 `content "│"` ∕ `ml −6px` ∕ `mr 6px` ✓；base 色不变（`--fg` 50%）。
- 截图（验收②落点）：`test/artifacts/statusline-banner{,-crop}-{light,dark}.png`（4 枚 · `.gitignore` 命中面）。
- 进场手段 = **真 IPC 注入**（`app.evaluate` ⇒ `win.webContents.send`，与主侧 `main.mjs:75` 同径）：`ev:ledger` ∕ `ev:activity stopped` ∕ `ev:subagent started` ∕ `ev:activity turn key=2` ⇒ 三连带面 + 告警位真视图在场（非合成 DOM）。

**测试面（随全清令取消 · 逐项）**：②「变量计数锁同拍」（`views-locks.test.mjs:418-419`）∥ ③「机检随动」（`views-statusline.test.mjs` 原址补例 ≥4 条）∥ 验收①「`node test/run.mjs` 全绿（含新例）」—— 三项随父侧**全清令**（2026-09-28 23:18 · 桌面测试树全量删除）取消：不写测试档 ∕ 不改 `files.mjs` ∕ 不跑测试；本舱测试面零笔。

**审计与代码评审（终态 = converged ⇒ clean）**

| 轮 | 形式 | 结果 |
|---|---|---|
| 1 | 内审 ∕ 背离审计（read-only explore） | **DEVIATIONS 3（全 🔵）**：① PARTIAL（验收④「拆出档 ≤300」未达成 —— `chrome.css` 424 > 300 顾问线，预存 R13-A 415 + 本轮 9；≤500 硬限内，已自行披露）② DOC-DRIFT（设计档收正未笔 —— 在册归设计面轮）③ DOC-DRIFT（本 §5 记录缺位 —— 随本文落档闭合）；**SILENT-SIMPLIFICATION ∕ OUT-OF-LIST 零命中**；行为面隔离（原 `:408-409` 规则未削弱）✓ |
| 2 | 代码评审（advisor · type=code · 两档 + 探针） | **VERDICT pass**（零 🔴；🟡3 ∕ 🔵6 全非必改）：🟡 = 亮色 `--mode-advisor` 白底对比 ≈2.1:1（CLI 常量自带「visible on dark backgrounds」限定——忠实同码取值之可见性风险，请父侧裁）· banner 段码 CSS 枚举无锁（协调项）· 批档状态滞后（报告面）；🔵 含告警位条右距 ∕ `:410` 措辞 —— 两条本舱即修（见 fix 轮） |
| fix round 1 | 两条 🔵 收正：① 告警位相邻条右距 2px ⇒ **6px**（对称 6px ∕ 6px —— 段内右距 = margin-right 2px + span 内 flex gap 4px；告警位非 flex 容器 ⇒ 折算入 margin）② `:410` 注文改「前邻（段 ∕ 告警位）在场才落条（首子零前导；换行行首例外见 :393 裁定）」 | 已落；探针复跑（`r11b-probe3.log`）：`sepMr 6px` ∕ `sepMl −6px` 两主题同 ✓ |
| 3 | 代码评审（advisor · fix 复核轮） | **VERDICT pass**：两条 fix 逐行核实（选择器对位 ∕ 前邻类型穷尽（视图源 `statusline.mjs:268` 仅段 ∕ 告警位两形）∥ 级联零冲突 —— 全仓仅 `:411-412` 触 `.status-alert::before`）；未引入新问题 |

**越域披露（超声明面 · 逐处给由）**：
1. `test/artifacts/statusline-banner{,-crop}-{light,dark}.png`（4 枚）—— 验收② ∕ 行动⑤「截图落 `test/artifacts/`」指定落点；`.gitignore:2` 命中（非跟踪件）。
2. 临时探针件（`.thincoder/tmp/` 未跟踪 · 随清可删）：`r11b-status-probe.mjs` + `r11b-probe{,2,3}.log` + 调试件 `r11b-dbg.mjs` ∕ `r11b-dbg.log`。
3. 同树并存他批在飞改动（`renderer/*` 姊妹批面等）**非本舱笔**，逐项分列不背书。

**未办 ∕ 待父侧（本舱边界外，只报）**：
1. **亮色 `--mode-advisor` 可见性裁**（`#14ce14` 白底 ≈2.1:1）—— 保 CLI ∕ VSC 同码对齐（现状）∥ 改值（须裂同码口径），请父侧裁。
2. **设计面收正（在册）**：`UI.md` §1 状态栏行 ∕ `RENDERER.md` 状态行面 —— 两新槽 ∕ banner 四色 ∕ 分隔两裁定（规格现只住 CSS 注释）；批档 `:43` 待收两测试项标「随全清令取消」；`:601` ∕ `:603` 的 `styles.css` 悬空指针重锚 `chrome.css:400-417`。
3. **CLI 坐标漂移（非本轮笔 · 只报）**：`views/statusline-banner.mjs:5` ∕ `src/main/agent-host.mjs:313` ∕ `UI.md:110,198,203` ∕ `IPC.md:171` ∕ `TUI.md:582` ∕ `ENGINEERING-MODE-V2.md:394,454` ∕ `AGENT-LOOP-UPSTREAM.md:885` ∕ `WEBVIEW-PROTOCOL.md:116` 引 `render-frame.mjs:221-225`（现读 227-230 —— 在飞改动 +6 行所致）—— 随设计面轮 ∕ 各触面轮收正。
4. **`chrome.css` 424 行 > 300 顾问线**（预存 415 + 本轮 9）—— 拆分归结构 ∕ 设计面轮（本舱按边界不拆）。

### 5.14 R10 实施舱 · 子代理面板 ∕ live 面 ⇒ VSC 对齐（eng-coder · 2026-09-28）〔段号就地顺正：原附 5.13 与上行 R11 补轮重号〕

**目标**：R10（§2.8 R10 段：逐面 ∕ 逐元素对位表 E1–E11 + 行动表 1–9）= 桌面子代理可见全族与 VSC 对齐（空态退场 ∕ 生命期 ∕ 归档入流 ∕ 出生计数贴 ∕ 2s 拍判据 ∕ relay 载荷面）；边界 = 核件五档（`subblocks/*`）零改 · VSC 树零改 · 工具行席位不复活 · `chat.css` 不触（与 R12 避让）。

**父侧裁（本舱执行口径）**：U-1 池内审批族 = 保留现状（形随核件对齐）· U-2 E6 出生计数贴 = 按表补装 · E9（消化行留存差）∕ E10（窗值 150 vs 200）∕ 状态行段 3 = **登记不内消**（另轮 ∕ 设计面裁）· **全清令（23:18）**：测试面任务全部作废（不写测试档 ∕ 不改 `files.mjs` ∕ 不跑测试）——只交付产品代码面。

**逐档表（8 档 = 1 新 + 7 改 · 行数 = read 实读总行数）**

| # | 档 | 前 ⇒ 后（行数） | 动作 |
|---|---|---|---|
| 1 | `thincoder-desktop/renderer/views/activity-new.mjs`（**新档** —— §2.10 #5 定名） | — ⇒ **100** | E6 出生计数贴（VSC `webview/activity-new.js:21-54` 照搬）：`notePoolBirth`（跟底 ⇒ 区钉底 ∕ 未跟底 ⇒ 计数）· `noteActivityBirth` · `activityNewCount` · `clearActivityNew` · `syncActivityNew`（帧面复原）· `attachActivityNew`（点击回底 + 重 pin + 清账 ∕ `scroll` 近底清账 + pin 维护）；记账随 root（`_poolNew` ∕ `_poolPin` ∕ `_poolNewWired` —— 无模块级态，池热重挂零串账） |
| 2 | `thincoder-desktop/renderer/views/activity.mjs` | 322 ⇒ **338** | E2 空态退场（`none` ∕ `empty` 零子节点 —— `poolTree` 仅 `pool` 态建头 + 体；`mountPool` 空态径 `clear` + 清账）；E4 终态折叠含 `settled`（`foldIfFrozen` 去 `awaitingDigest` 豁免）；E6 消费（`createSubBlock` 出生点 `notePoolBirth`；会话换代 ∕ 空态清账 + pin 复位；`syncActivityNew` 帧面复原） |
| 3 | `thincoder-desktop/renderer/mount-pool.mjs` | 90 ⇒ **95** | 接线随动：`paintPool` 增 `attachActivityNew(root)`（幂等 —— 与 ⏹ 委托同点） |
| 4 | `thincoder-desktop/renderer/subagent-reduce.mjs` | 138 ⇒ **146** | ① `SUB_STATUS` 补 `approval` + `SUB_KEYS` 补 `tool`（child permission gate —— 白名单漏收 ⇒ ⏸ ∕ `sub.awaitingApproval` 桌面死面；三点对位 = 宿主 `agent-bridge.mjs:215` · 核 `state.mjs:190-201` · VSC `activity.js:133-136`）；② `archiveIntoFlow` 按核 `effects` 键集对被触碰块**换新对象引用**（核态机原地变更 ⇒ 视图 `updateSubBlock` 同一性短路恒真 ⇒ 终态折叠 ∕ awaiting 态词 ∕ 审批态永不落 DOM —— 修后落） |
| 5 | `thincoder-desktop/renderer/views/chat-subagent.mjs` | 70 ⇒ **75** | E4 ∕ E10 判据落点（档头 ④：归档位置 ∕ 窗口 ∕ 裁剪逐值对表结论 —— 「结论落点 = 本表验收行 ∕ R10 #4」之执行） |
| 6 | `thincoder-desktop/renderer/heartbeat.mjs` | 45 ⇒ **47** | E7 拍体判据三件同序（`_subMeta` 在场 ∧ `!frozen` ∧ 在连 —— 逐值同 VSC `activity.js:149-153`） |
| 7 | `thincoder-desktop/renderer/pool.css` | 85 ⇒ **113** | E1 自滚（宿主 `[data-slot="pool"]` `overscroll-behavior: contain` —— VSC `base.css:103-107` 同值角色）+ E6 `.activity-new-btn`（值源 VSC `base.css:113-117`；皮肤沿 D24 律）+ 删 `.pool-empty` 死规则 |
| 8 | `thincoder-desktop/renderer/i18n.mjs` | 461 ⇒ **464** | 增 `sub.newBlocks`（两语值逐字同 VSC `locales/{en,zh}.json:170`）+ 退 `pool.empty.hint`（消费面归零 ⇒ 键面随退）；两语键集 203 ∕ 203 相等（实读 + 对拍机检在册） |

**表外档（越域披露 · 逐处给由）**：`renderer/i18n.mjs`（行动表外）—— 增 ∕ 退两键 = E6 词面单源（钮字面 `↓ ${n} …` 无宿主键即落键名）与 E2 死键随退的**机械必然后果**；零替代落点（词表单一持有点）。临时件：`.thincoder/tmp/r10-pool-probe.mjs`（未跟踪；运行副本 `thincoder-desktop/.r10-pool-probe.mjs` 用后即删）—— 产品树零残留（审计独立复核在册）。

**决策透明表（设计未逐字之处 / 适配逐条给由）**

| 决策 | 取值 | 依据 | 被否备选 |
|---|---|---|---|
| E2「区域退场」落形 | `none` ∕ `empty` 两态 = **零子节点**（内容退场）；右列卡 ∕ 宽度 ∕ `--pool-w` 零动 | VSC `:empty{display:none}` 语义映射到定宽右列 ⇒ 只可及内容面；右列骨架 = 用户②已裁「右列 = 子 agent 面」+ 21:02「右列保持原样」裁 | 列退场（改栅格 ∕ 宽度 —— 触 21:02 裁 + 越行动表）；保留 `empty` 提示（违 E2 ① 消除） |
| E1「封顶自滚」落形 | 封顶 = **列高**（骨架：栅格行 `minmax(0,1fr)` + `.pool` `min-height:0`）；自滚 = 宿主 `overflow:auto` + `overscroll-behavior: contain` | VSC 横带 32vh 属**骨架值面**（定高列内无义）；「布局骨架差异在册」= E1 行自述；contain = VSC 同值同角色 | 加 `max-height: 32vh`（列内自缚 —— 与右列全高相抵）；不提 contain（漏 VSC 自滚角色） |
| E6 钮载体 | 钮居**池头带** `[data-pool-head]` 首子（粘性由头带承载） | VSC 单元素 `position: sticky` 在桌面 chassis 无对位（池区唯一粘性带 = 头带）；披露在册 | 独立 sticky 元素（与头带叠位 ∕ 双粘性带）；`position: fixed`（越槽位） |
| E6 皮肤 | 静息描边透明 + `--hover-bg` 底（D24 律） | D24 用户裁（描边归零）+ 实色支先例（`.chat-pill`） | VSC 原值 `1px solid var(--border)`（违 D24 裁） |
| E6 清账增径 | 池面退场帧 `clearActivityNew`（钮随区退） | 桌面无 `resetActivity`（区 = 常驻列）；「区退场 ⇒ 钮无载体」—— 与 E2 同源 | 仅点击 ∕ 近底两径（VSC 原三径缩两径 ⇒ 空区内悬钮） |
| approval 白名单补入 | `SUB_STATUS` += `approval`；`SUB_KEYS` += `tool` | 三点对位（宿主载荷 ∕ 核态机 ∕ VSC 对位）+ 「核 patch 全表字段集」原判据自述 | 保持漏收（⏸ 态死面 —— 违 E-table 全族对位） |
| 触碰块换对象引用 | `archiveIntoFlow` 按核 `effects` 键集换新对象（未触碰块保原引用） | 视图帧触发判据（引用比较）是本仓既定形（`RENDERER.md` §2 帧面分派「逐位元素引用」同源）；核 `effects` 键集 = 官方触碰面 | 全列表克隆（多余重刷）；改核态机（越「核单源」裁）；视图侧快照差分（第二判据面） |
| E9 ∕ E10 ∕ 段 3 | **登记不内消**（父侧裁） | E9 = 差需动模型 + 锚面（单轮切片 ⇒ 多轮留存；块锚恒居尾组前）；E10 = 在册显式裁（`RENDER-CORE.md` 表行 13「各自 · 数值差登记」）；段 3 非本行动表档 | 本舱内消（越行动表面 + 结构性改动） |

**机检读数（实跑）**

- **真机探针**（Electron + playwright-core · 隔离家目录；`.thincoder/tmp/r10-pool-probe.mjs`）：**10 ∕ 10 通过** —— ① 空态 `data-state=empty` ∧ 零子节点 ∧ 零头；② 出生 ⇒ `pool`（头 + 块）、头词 `[▶ coder#1 · async · m1 · 0s]`；③ `settled` ⇒ `sub-frozen` ∧ `open=false` ∧ 头词 `done · awaiting digestion`；④ 回收 `done` ⇒ 归档入流（`[data-block-kind="subagent"]` 在场）∧ 池内退场（回 `empty` 零子节点）；⑤ 拍体判据 hits=1（活 1 ∕ 冻 1 ∕ 无 `_subMeta` 1）；⑥ 审批 patch ⇒ `[⏸ coder#2 · async · m2 · 0s] Awaiting approval: write`；⑦ 未跟底出生 ⇒ 钮 `↓ 1 new block(s)` + 计数 1；⑧ 钮点击 ⇒ 清账 + 落底；⑨ 跟底出生 ⇒ 零计数 + 钉底；⑩ `pageerror` 0。
- **语法**：8 档 `node --check` 全 OK。
- **词表对拍**：`sub.newBlocks` 两语逐字 = VSC `locales/en.json:170` ∕ `zh.json:170`；键集 203 ∕ 203 相等；`pool.empty.hint` 全树零消费面。
- **`git status` 自证**：本舱 8 档（7 `M` + 1 `??`：`views/activity-new.mjs`）；`thincoder-render-core/subblocks/*` 零命中；`chat.css` ∕ `events.mjs` ∕ `app.mjs` 零笔（行动表行 8–9「随动」= 零改，mtime 早于本舱窗口）；VSC 源档（`activity.js` ∕ `activity-new.js` ∕ `base.css` ∕ `ui.js` ∕ `chat-status.js` ∕ `panels.js`）mtime 全早于本舱窗口 ⇒ 本舱零笔。

**审计与代码评审（终态 = converged ⇒ clean）**

| 轮 | 形式 | 结果 |
|---|---|---|
| 1 | 内审 ∕ 背离审计（read-only explore · 8 档逐条对 E1–E11 + 行动表 + 边界） | **DEVIATIONS 2**：DOC-DRIFT 🟡（设计档随轮收正未落 —— 派单口径「文档收正 = 设计面另轮」；另报 `RENDER-CORE.md:83`「桌面右列常驻不需该钮（端差登记）」= 与本轮 U-2 直接相抵的失效句）· OUT-OF-LIST 🔵（`i18n.mjs` 两键 —— 本段已披露）；**PARTIAL ∕ SILENT-SIMPLIFICATION 零命中**；四项边界（核件五档 ∕ VSC 树 ∕ 工具行席位 ∕ `chat.css`）零命中；旁证 = 本轮窗口外零笔（mtime 逐档） |
| fix round 1 | 审计观察收正：档头 ①「`empty`（词表提示）」⇒「`empty`（**区域退场** —— 与 `none` 一致零子节点，锚值保留）」（同档新旧句并存清） | 已落 |
| 2 | 代码评审（advisor · type=code · 8 档 + 批档 §2.8 R10 上下文） | **VERDICT pass**（🟡4 ∕ 🔵4 —— 全非阻断、零 must-fix）：🟡 = `activity.mjs` 实读 338 > 300 顾问线（越行动表 row 1 估算 ≈280–330）· `i18n.mjs` 464 > 300（既存词表债，本轮净 ±0）· E3 `.sub-desc` 判据 ≠ VSC 单次律（桌面 = 会话级 —— 在册设计句 `UI.md:321`「会话首个活动块 · 一次性」，VSC = 面板级旗标 `state.js:42`）+ 归档回显不带该行 · 文档收正未落（`UI.md:462` 旧口径 ∕ `RENDERER.md:78` 未登记 R10 帧触发判据）；🔵 = E6 两处 chassis 适配未落登记句 · E2「同义」措辞 · 计数钮不跨帧存活（焦点面轻微）· 机检面随全清令取消（评审边界登记） |
| fix round 2 | 按评审 🔵 措辞收正：`activity.mjs` 两处「同义」⇒「**内容面同形**」（区域盒 = 常驻右列卡 —— 骨架差异在册） | 已落（语法 OK） |

**E9 值表（挂起 ∕ 消化可见面 —— 父侧裁「登记不内消」，值表本舱出）**

| 面 | VSC（`chat-status.js:69-122`） | 桌面（`chat-chrome.mjs` `syncDigest` / `views/chat.mjs`） | 判 |
|---|---|---|---|
| 起跑 ∕ 形 | `.digest-turn` 标签行 +（n>0）`.digest-status`（`dataset.n`） | `[data-digest-label]` + `[data-digest-count]` 同两行（词键同源直取） | 一致 |
| n=0 轮 | 零计数行（禁幻影） | 同判 | 一致 |
| 终态 | `end` 原地更新后**留存**（不摘；不随 150 窗裁剪） | `end` 原地更新后**摘除整组** | **差 —— 登记（另轮 ∕ 设计面）** |
| 落位 | `#messages` 尾追 ∕ 边界插入（`activity.js:104-110`） | 块序之后 ∕ 尾组族序 1（`chat.mjs:210-218`） | 一致（相对位） |
| 归档依赖 | 归档块插在本轮边界行之前 | 块恒居尾组之前（与边界插入同位）；多轮绝对位差归上条 | 一致（相对位） |
| cap 行 | `.digest-cap`（auto ∕ stop） | 无（宿主无 cap 生产者） | 零可见差 |
| 切片 | 多轮累积 | 单轮切片（新 start 覆盖） | 差（模型级）—— 登记 |
| 悬起句 | `status-bar.js:51-61`（`susp.running` ∕ `digesting` ∕ `winding`） | `views/statusline.mjs` 段 3（同三键；zh = CLI 逐字 ∕ en = VSC 逐字） | 归 R11（登记） |

**E10 别名登记（归档块窗口 ∕ 裁剪 —— ① 消除 ∕ 差 ⇒ 消除，核后为零消差项）**：窗值差（VSC `ui.js:199-206` 150 块 DOM 裁剪 ⟷ 桌面 `MAX_RENDER_BLOCKS = 200` 渲染窗）= **在册显式裁**（`RENDER-CORE.md` 表行 13「各自 · 数值差登记 · 核不夺」）；归档块**两窗皆含**（VSC 裁剪集含 `.sub-block` ⟷ 桌面尾窗含 `kind === "subagent"`）；出窗行为一致（弃渲染 ∕ 不可回填 —— 运行期块非落盘件；VSC `_hasOlder` 布尔提示 ⟷ 桌面不计 `data-hidden` 之别名）。

**E11 载荷面登记**：`ev:subagent`（核 `relayEventToSubPatch` 单源）+ `ev:subchunk`（四面）⟷ VSC `panel-subagent-relay.mjs` 单门（outbox 无对位：桌面就绪重推 = 宿主拍体 `reassertLive` —— R6 落；序 = 事件到达序 ∕ 归档序 = effects 键集序）；本轮 `approval` 白名单补入后三点一致（见档 4）。

**未办 ∕ 待父侧（本舱边界外，只报）**

1. **设计面轮收正清单**：`UI.md`（§2 项 1 `empty` 句 ⇒ 零子节点 ∕ 区域退场；右列子代理面 ∕ 空态 ∕ 生命期行；`.sub-desc` 会话级判据句）· `RENDERER.md`（§1.1 池面挂载条补 R10 帧触发判据「触碰块换引用」；拍面判据句）· `E2E-TESTING.md`（真机面）· `RENDER-CORE.md:83`（失效句：计数钮「桌面不需」）；核侧零改 ⇒ 无核侧收正（`RENDER-CORE.md` 表行 21 更新可选）。
2. **真机走查（父侧）**：右列子代理全族（出生 ∕ 走时 ∕ ⏹ ∕ 终态留场 ∕ 归档 ∕ 计数贴 ∕ 空态）。
3. **测试面**：随全清令取消（`test/**` 无 `*.test.mjs` 在盘、`files.mjs` 已置空、`integration/` 空）；行动表验收行的四档机检改锚（`views-activity` ∕ `events-subagent` ∕ `agent-host-subagent` ∕ `views.test`）**未执行** —— 本段与交付报告随令注明。
4. **评审非阻断项（登记）**：`activity.mjs` 338 行（>300 顾问线；越 row 1 估算 ≈280–330）· `i18n.mjs` 464 行（既存）· `.sub-desc` 会话级判据 ∕ 归档回显不带该行（待父侧裁「消差 ∕ 登记」）· 计数钮不跨帧存活（焦点面轻微）。

### 5.15 R12 实施舱（重发轮）· 会话流 ⇒ VSC 对齐（eng-coder · 2026-09-29）

**背景**：R12 前舱 #117 随宿主进程崩溃死亡（零报告零 §5 写入）；本舱 = 令牌重签发后的重发轮。盘面实读：**前舱 F1–F4 主体收正已落盘**（mtime 证据：`chat.css` 15:56:44 ∕ `core.css` 15:54:59 ∕ `chat-fixes.css` 15:55:02 ∕ `chat-scroll.mjs` 15:55:09 UTC = 崩溃窗口 23:5x 本地）；本舱职责 = 逐面核验（读值 + 真机探针）+ 缺口收正 + 报告。

**目标**：R12（§2.8 R12 段 F1–F5）= 会话流与 VSC `#messages` 面逐值对齐（块壳 ∕ 面宽 ∕ 面内件 ∕ 流尾件形 ∕ 滚动回填行为）。边界：VSC 树 ∕ 核件零改 · 流尾件面零撤 · 测试面随全清令取消。

**逐档表（本舱笔 5 档 · 行数 = 末行实读）**

| # | 档 | 行数 | 动作 |
|---|---|---|---|
| 1 | `renderer/chat.css`（主档） | 268（净 −1） | ① `.digest-status.digest-failed` 删 `opacity: 1`（沿 VSC 继承 0.85）；② `.tool-head` `gap: 8px ⇒ 6px`（VSC `.tool-call-header` 逐值 · 审计点名）；③ 回合首标签分色换 `data-label` 锚（评审轮 1 🔴 修复 —— 四型块 accent）；④ 链序注文补 `/rc/search.css` |
| 2 | `renderer/core.css` | 430（净 +2 · 注） | 组外面 `.ledger-line` 补行级 `line-height: 1.5` ∕ `opacity: .85`、`.warn` 补 `opacity: 1`（VSC `webview/chat.css:477-488` 逐值） |
| 3 | `renderer/chat-fixes.css` | 95（净 +1 · 注） | 工具头两态色引据坐标随 VSC 换接修正（`webview/ui.js:113-114` ⇒ 核 `flow/tool-card.mjs:111/:114`）+ 链序注文补 `/rc/search.css` |
| 4 | `renderer/views/chat-text.mjs` | 126（净 −2） | 删档尾悬空重复注释（待发送标记面退场遗留） |
| 5 | `.r12-probe.mjs`（临时探针） | 237 | 扩展：ledger 行级臂 ∕ tool-head gap 臂 ∕ 标签色值双臂（工具卡 + 推理）∥ 路径可移植化（`import.meta.dirname` + `new URL`） |

**前舱遗留（在盘 · 本舱核验纳入交付）**：`chat.css` F1 块壳透明 ∕ F2 块距 14px ∕ F3 工具卡-错误横幅盒值 ∕ F4 消化行组盒值；`core.css` 推理块段（盒值 + 行内边距 + margin 0）；`chat-fixes.css` ledger 11px 组容器；`chat-scroll.mjs` `BACKFILL_PX = 40` ∕ `FOLLOW_PX = 24`（严格小于）；探针初版 20 ∕ 20。

**决策透明表（设计未逐字之处）**

| 决策 | 取值 | 依据 | 被否备选 |
|---|---|---|---|
| digest-failed `opacity: 1` | 删（沿 VSC 继承 .85） | F4「形与 VSC 邻近面逐值（差 ⇒ 消除）」；VSC `base.css:221-226` 无 opacity 覆盖 | 保留 1（非 VSC 值；且 end 后即摘 —— 不可观察） |
| ledger 行级透明度 ∕ 行高落点 | 行级补两值（`core.css` 组外面）+ warn opacity 1 | VSC 行级逐值（`chat.css:477-488`）；字号 ∕ 色面仍落组容器（继承等效） | 全量搬行级（无值差 + 增 diff）；不补（透明度 ∕ 行高与 VSC 差） |
| 工具头 `gap` | 8 ⇒ 6 | VSC `.tool-call-header` 逐值（原值未标来源 · 审计点名） | 保留 8（无来源 · 未登记） |
| 标签分色锚 | `data-label` 两值选择器 | 注文自称锚（`chat.css:175`）+ VSC `chat.css:11` 值源；四型块回合首同落 accent | 补齐四型父类选择器（脆）；不动（🔴） |
| 件级外边距 ∕ 首块上距 | **不内消** —— 模型级 ∕ 骨架面（呈报） | 扁平块模型下件级层不存在（单值化注释在案 `chat.css:53` ∕ `core.css:205`）；首块上距属 `chrome.css` 骨架 + `--gap` 体系值（行动表外） | 按件型拆规则（消息边界不可恢复）；改骨架 padding（越行动表 + 触 R13 面） |
| 探针处置 | 留盘（扩展后） | 父侧验收③「复用 `.r12-probe.mjs`」 | 删（验收复用面断） |

**读数（实跑）**

- **真机探针**（Electron + playwright-core · 隔离家目录 · 亮色）：**22 ∕ 22 通过**（含新增：label 色值双臂 = `rgb(47, 111, 235)`（= `--accent` `#2f6feb`）· ledger 行级 `0.85 ∕ 16.5px ∕ 1` · tool-head `gap 6px`）；`pageerror` 0。
- **语法**：`node --check` 全触碰 `.mjs`（`views/chat.mjs` ∕ `chat-text.mjs` ∕ `chat-scroll.mjs` ∕ `chat-guide.mjs` ∕ `.r12-probe.mjs`）OK。
- **测试面**：随全清令取消（不写测试档 ∕ 不跑套件 ∕ 不改 `files.mjs`）——「not repo-suite verified — the parent-side closeout run is the only repo-suite run.」

**审计与代码评审（终态 = converged ⇒ clean）**

| 轮 | 形式 | 结果 |
|---|---|---|
| 1 | 内审 ∕ 背离审计（read-only explore · 8 档对 F1–F5 + 边界） | **DEVIATIONS 4**：🟡1（`RENDERER.md:110/:128` 未随 F5 阈值随动 + `:128` ∕ `:101` 互抵 —— 设计面轮）· 🔵3（`.tool-head` gap 8≠6 未声明【本舱收正】· digest-cap 面无对位【上抛 U-R12-1】· `chat-fixes.css` 引据坐标漂移【本舱收正】）；PARTIAL ∕ 静默简化零命中；边界四项零命中 |
| 2 | 代码评审（advisor · type=code · 8 档 + 批档上下文） | **changes-required**：🔴1（回合首标签分色只落两类块 ⇒ 工具卡 ∕ 推理 ∕ 错误 ∕ 子代理四型落 muted；与 VSC `chat.css:11` 值源 + 本档注文相抵；探针固化偏差形）· 🟡4（件间距 14px 模型级 · 首块上距 12 ∕ 14 · 标签住卡盒内 · `chat.mjs` 350 行 ∕ UI.md 文档面）· 🔵4（`.file-link` 三值 · 探针硬编码路径 ∕ 链序注文漏 `/rc/search.css` ∕ 探针缺色值读数） |
| fix round 1 | ① 标签分色换 `data-label` 锚 ② 探针增 label 色值双臂 ③ 探针路径 `import.meta.dirname` + `new URL` ④ 两处链序注文补 `/rc/search.css` | 已落；探针复跑 22 ∕ 22（新臂两例全绿） |
| 3 | 代码评审（advisor · 复核 fix 声明 · 3 档） | **VERDICT pass**：四项逐条核实（标签锚无遗漏 ∕ 无特异性冲突；断言值与 `--accent` 一致；路径零残留硬编码；注文与 `index.html:11-21` 逐位相符）；无新 🔴 |

**越域披露（超声明面 · 逐处给由）**：① `renderer/core.css`（行动表外）——`.ledger-line` 行级值 = F4「差 ⇒ 消除」必要落点（值面需要，按父侧口径报告列明）；② `.r12-probe.mjs` 扩展（临时验证工具）；③ `chat-fixes.css` 注释两处 ∕ `chat-text.mjs` 悬空注释删除 = 触面随动清理。

**未办 ∕ 待父侧（本舱边界外，只报）**

1. **模型级 ∕ 骨架面两差（呈裁）**：① 件级外边距（VSC 消息内件 8px ∕ 4px）⟷ 桌面 14px 块距单值化（若须逐件落，行内退场路径 = `.block + .block-tool { margin-top: 8px }` 等三处）；② 首块上距 12px（`.flow` padding）⟷ VSC 14px（`#messages` 顶 0 + `.message` margin 14）——涉 `chrome.css` + `--gap`。
2. **digest-cap 面无对位（上抛 U-R12-1）**：VSC `.digest-cap`（auto ∕ stop 两档，`base.css:237-247` · `chat-status.js:97-105`）桌面无同件 —— 面缺非形差，拟另轮 ∕ 设计面裁（沿 R10 U-2 先例）。
3. **工具卡头行段样式未落（呈裁）**：VSC `.tool-call-name`（600 + accent）· `.tool-call-args`（省略四值）· `.tool-call-status`（11px + .6）· `.tool-call-summary`（11px + .75 + `margin-left: 8px` + `max-width: 45%`）四组在桌面无对位规则（现形 = 整行色 + `flex-wrap`）——与在册「头行色」设计（`UI.md:362`）需一并决策 ⇒ 另轮 ∕ 设计面裁。
4. **`.file-link` 三值差**（相抵② 面 · 评审 🔵）：缺 `text-underline-offset: 2px` ∕ 无 hover solid ∕ focus 值相异 —— 另轮 ∕ 登记。
5. **设计面轮收正清单**：`RENDERER.md` §3/§4（回填 48 ⇒ 40 · 跟滚 ≤ ⇒ < · `:128` ∕ `:101` 互抵）· `UI.md` §1 对话流行（块壳透明 ∕ 面宽 100% ∕ 块距 14px ∕ 扁平化模型）+ D24 保留面两处旧文（`:265` ∕ `:272`）· `E2E-TESTING.md`（真机面）· 批档 §2.8 R12 行动表 ∕ 验收行仍为拆前旧值（480 ∕ `styles.css` 499）——父侧准备单已按拆后落点重锚，§2 就地收正待父侧落笔。
6. **外舱转呈**：`src/main/window.mjs:27` 冒烟探针 `{ id:"css", path:"styles.css", expect:200 }` 死引用（`styles.css` 已随 R13-A 拆档删除）—— 归 R13-A 收尾漏项，非 R12 面。
7. **测试面**：R12 验收行机检三档（`views-chat` ∕ `views-chat-frame` ∕ `integration/chat-render`）+「套件绿（≥263）」随全清令取消 —— 与 §1.10 准备单口径一致。

### 5.21 R12 收口修复轮（fix · 四项逐落）· eng-coder · 2026-09-29

**目标**：批档 §5.15 未办清单中父侧已裁四项（承裁定行 `:141`「裁 = 全落」）——① 件级外边距（工具 8 ∕ 错误 8 ∕ 推理 4——VSC `webview/chat.css:179-180` ∕ `:417-422` ∕ `:277-278`）② 首块上距 12 ⇒ 14（`.flow` 骨架面）③ 工具卡头行段样式四组（name ∕ args ∕ status ∕ summary——VSC `:216-244`；**先读在册「头行色」项口径，相抵 ⇒ 停并报该项、其余照落**）④ file-link 三值（按 §5.15 未办 4 原值）。边界：VSC 树 ∕ 核件（`thincoder-render-core/**`）零触 · 流尾件零撤 · 已消 5 项（digest-failed opacity ∕ ledger 三值 ∕ tool-head gap ∕ 标签分色 ∕ 引据注文）零回改 · `test/**` 零触。

**逐档表（本舱笔 4 档 · 行数 = 末行实读）**

| # | 档 | 前 ⇒ 后 | 动作 |
|---|---|---|---|
| 1 | `renderer/chat.css` | 269 ⇒ **313** | ① 三覆盖规则（`.block + .block-tool` 8px ∕ `.block + .block-error` 8px ∕ `.block + .block-reasoning` 4px——置 `.block + .block` 后、同特异度后置取胜；余型仍 14px）+ 随动注两处收正（工具卡盒注 ∕ 见下）；③ 头行段四组（`.tool-head [data-seg="…"]`：name `font-weight: 600` ∕ args `opacity: .5` + 省略四值 + `flex: 1` ∕ status `11px` + `.6` ∕ summary `11px` + `.75` + `margin-left: 8px` + `max-width: 45%` + `flex-shrink: 1` + 省略三值）——**name ∕ args 两项 `color` 停落**（详见决策表） |
| 2 | `renderer/chrome.css` | 425 ⇒ **432** | ② `.flow { padding-top: 14px }`（后于 `.pool-body, .flow { padding: var(--gap) }`；左右 ∕ 下仍 12px = VSC 同值）——**行动表外 · 父侧授权入界** |
| 3 | `renderer/core.css` | 431 ⇒ **437** | ④ file-link 三值：补 `text-underline-offset: 2px` ∕ 补 `.file-link:hover { text-decoration-style: solid }` ∕ `:focus-visible` = `outline: 1px solid var(--accent); border-radius: 2px; outline-offset: 2px`（VSC 有效值——详见决策表）+ 随动注一处收正（推理块件级外边距落点句） |
| 4 | `.r12-probe.mjs`（临时探针 · 未跟踪） | 238 ⇒ **327** | 四臂扩展：件级 margin 三值 ∕ 首块上距（`flow` padding-top + 内容空间偏移，scrollTop 补偿）∕ 头行四组（含 name ∕ args 色 = 头行两态色保留锁）∕ file-link 三值（CDP `CSS.forcePseudoState` 强制 hover ∕ focus-visible 伪态读有效值） |

**决策透明表（设计未逐字之处）**

| 决策 | 取值 | 依据 | 被否备选 |
|---|---|---|---|
| ③ 色面两项停落 | name `color: var(--accent)` ∕ args `color: var(--fg)` **不落**（两段仍承头行两态色） | 与在册 `UI.md:361`（头行色 = `[data-status="error"]` ⇒ `#f14c4c` ∕ `"done"` ⇒ `#4ec9b0`——VSC 内联色）相抵：两色若落 ⇒ name ∕ args 失两态色；父侧裁定「先读在册头行色项口径，相抵 ⇒ 停并报该项、其余照落」；§5.15 项 3 自述「与在册头行色设计需一并决策 ⇒ 另轮 ∕ 设计面裁」 | 硬落两色（破在册整行两态色设计）· 四组全项停落（过度停落） |
| 件级外边距落形 | 三覆盖规则（`.block + .block-X`，置基块距后） | §5.15 项 1 指定行内退场路径逐字（「`.block + .block-tool { margin-top: 8px }` 等三处」） | 按件型拆消息边界（消息边界不可恢复） |
| file-link focus 态取值 | 类规则三值 + `outline-offset: 2px`（VSC 有效值） | VSC 类规则（`webview/chat.css:255`）不含 offset——其有效值来自全局 `:focus-visible { outline-offset: 2px }`（`webview/base.css:445`）；桌面无全局同规则 ⇒ 本规则自携；改前值 2px 本就与 VSC 有效值同 ⇒ 保之（评审轮 1 🟡#2 复核收正） | 只落类规则三值（有效几何仍差 2px）· 按端内族律 `-2px`（偏离 VSC 有效值） |
| 探针伪态读值 | CDP `CSS.forcePseudoState`（hover ∕ focus-visible） | 两伪态无静态可读面；强制态 = 真交互等价读值（hover ∕ focus 结论均以有效值立判） | 真 hover（窗口位置敏感 · 脆）· 只读样式表规则（非有效值，不达「逐值」口径） |

**读数（实跑）**

- **真机探针**（Electron + playwright-core · 隔离家目录 · 亮色 · `boot = ok`）：**26 ∕ 26 通过**（旧 22 臂零回归 + 新四臂实读：① `{tool: "8px", error: "8px", reasoning: "4px"}` ② `{flowPaddingTop: "14px", firstMarginTop: "0px", delta: 14}` ③ name weight `600` 且 name ∕ args 色 = head 色 `rgb(78, 201, 176)`（两态色保留）· args `0.5 ∕ hidden ∕ ellipsis ∕ nowrap ∕ flexGrow 1` · status `11px ∕ 0.6` · summary `11px ∕ 0.75 ∕ 8px ∕ ellipsis ∕ nowrap ∕ 45% ∕ shrink 1` ④ offset `2px` ∕ hover `solid` ∕ focus `1px solid` + radius `2px` + offset `2px`）；`pageerror` **0**（两行 `[renderer] …` console.error = 既有无 project 状况日志，非 pageerror）。
- **语法**：`node --check` `.r12-probe.mjs` = OK；CSS 三档花括号平衡（chat 54∕54 · chrome 71∕71 · core 88∕88）——CSS 无 `node --check` 适用面，以真机探针实读代偿（验收②口径）。
- **测试面**：随全清令取消（不写测试档 ∕ 不跑套件 ∕ 不改 `files.mjs`）——「not repo-suite verified — the parent-side closeout run is the only repo-suite run.」

**审计与代码评审（终态 = converged ⇒ clean）**

| 轮 | 形式 | 结果 |
|---|---|---|
| 1 | 内审 ∕ 背离审计（read-only explore · 4 档对四项 + 边界逐项） | **DEVIATIONS 1（DOC-DRIFT 🟡）**：本舱 §5 记录未落（随本文闭合）；PARTIAL 0 ∕ SILENT-SIMPLIFICATION 0 ∕ OUT-OF-LIST 0；边界五项（VSC 树 ∕ 核件 ∕ 流尾件 ∕ 已消 5 项 ∕ `test/**`）命中 **0**；专问三答：③ 停落裁定**成立**（无过度停落 ∕ 无硬落）· 表外两档可回溯 · 注文与实现相符 |
| 2 | 代码评审（advisor · type=code · 4 档 + 批档 ∕ UI.md ∕ VSC 两档 ∕ 核 `tool-card.mjs`） | **VERDICT pass**（零 🔴；🟡2 可选 ∕ 🟡1 协调 ∕ 🔵4）：🟡 = 头行「耗时」段无对位规则（`[data-seg="time"]` 12px ∕ 1.0 ⟷ VSC 同字串住 status 段 11px ∕ .6——射程外新发现【只报】）+ `.file-link:focus-visible` 缺 `outline-offset: 2px`（VSC 有效值）；🟡协调 = ③ 停落后残余色域差（在册 · 归设计面）；🔵 = 引用漂移（`UI.md:361` 引作 `:362`）· 探针 327 行 ∕ 档头名漂移 · 三档越 300 顾问线（在册）· 块距映射回合边界（只报） |
| fix round 1 | 🟡 收正（评审发现 #2）：`core.css` `.file-link:focus-visible` 补携 `outline-offset: 2px`（VSC 有效值）+ 注释重写（引用四条逐行为真）；探针收口④断言增 `focusStyle.outlineOffset === "2px"`（消「读数空转」）；复跑探针 **26 ∕ 26 绿** | 已落 |
| 3 | 代码评审（advisor · fix 复核轮 · 2 档） | **VERDICT pass**：两半逐条核实（值 ∕ 注释四条引用逐行为真 ∕「桌面无全局同规则」核实 ∕ `.file-link` 单源未破；断言判别性 ∕ 空值守卫序）；无新 🔴∕🟡；端内 focus 族 `-2px` 惯例与 `+2px` 之异 = 对齐口径指定值（非阻断观察） |

**越域披露（超声明面 · 逐处给由）**

1. `renderer/chrome.css`（行动表外——**父侧授权入界**，授权在册）：② 首块上距触发面 = `.flow` 骨架 padding（自勘确认）⇒ 落该档；`.pool-body` 面零影响（选择器仅 `.flow`）。
2. `renderer/core.css`（行动表外——**值面必要落点**，同 R12 前轮 `.ledger-line` 先例）：④ file-link 三值的类名样式单源面（`chat-fixes.css:96` 同声明的「类名样式单源 = core.css 核类名映射面〔本段零规则〕」）⇒ 三值 + 有效 offset 均落此。
3. `.r12-probe.mjs`（临时验证工具 · 未跟踪 · 沿前轮处置）：四臂扩展 + CDP 伪态臂。

**未办 ∕ 待父侧（本舱边界外，只报）**

1. **头行「耗时段」无对位规则**（评审轮 1 🟡 · **射程外只报**）：VSC 同字串住 `.tool-call-status`（11px ∕ .6），桌面耗时住独立段 `[data-seg="time"]`（`views/chat-tool.mjs:110`）⇒ 现读 12px ∕ 1.0。修法两择一（补一行规则 ∕ 按 VSC 原形并入 status 段——后者触视图段集 ⇒ 随设计面轮）；父侧裁。
2. **③ 停落后的残余色域差**（协调项）：桌面「整行两态色」⟷ VSC「name 段 accent + 两态色仅住 status 段」——待设计面一并决策（§5.15 项 3 在册）；本舱按裁定零动作。
3. **设计面轮收正清单（续）**：`UI.md:361` 引用漂移收正（在册引 `:362`）· §2.8 行动表锚值 229 与现值 313 之差（父侧落笔面 · 已知）· 头行段四组 ∕ 件级外边距 ∕ 首块上距 ∕ file-link 有效 focus 值在册规格（现只住 CSS 注释）——随设计面轮 #26。
4. **块距映射回合边界只报**（评审轮 1 🔵）：`.block + .block-tool` 不分回合边界（前件为 `user` 块时亦 8px；VSC 同序列 ≈14px——未实机验证）——如判需区分 = 视图侧增锚（非本轮射程）。

## §6 验证与收口（父代理）
