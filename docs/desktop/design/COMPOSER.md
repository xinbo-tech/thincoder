# 桌面设计 · 输入区（COMPOSER）

> **域**：输入区（composer）——文本输入 ∥ 控件行 ∥ 附件 ∥ 发送 ∥ 忙态队列 ∥ 挂起窗输入 ∥ @ 文件引用 ∥ 斜径命令面——本域设计单源档。
> **导航**：`docs/desktop/design/PROJECT.md`（总览 · 共享决策）∥ `IPC.md`（通道与载荷）∥ `SHELL.md`（壳与树）∥ `UI.md`（壳面形态）∥ `RENDERER.md`（渲染工艺）∥ `CHAT.md`（对话流）∥ `COMPOSER.md`（本档）∥ `ACTIVITY.md`（活动池与消化面）∥ `SESSIONS.md` ∥ `SETTINGS.md` ∥ `MENU.md` ∥ `PACKAGING.md` ∥ `E2E-TESTING.md`（端到端测试基建）∥ `WEB-QUICKCHECK.md`
> **来源**：自 `docs/desktop/design/PROJECT.md` §2（KD-17 ∥ KD-18 ∥ KD-19 ∥ KD-21 ∥ KD-31 ∥ KD-40 ∥ KD-51 ∥ KD-52）∥ `docs/desktop/design/UI.md` §1（本域批注块）迁入（as-of 2026-10-02）；原址各留一行指针。
> **迁移状态**：波 2a 迁入 = KD 行（八行）+ UI 块（钉死表逐项）；**域内余项皆已迁入**（§4.1 族行 ∥ §4.2 批块——切片 3；§4/§5/§6 域行——切片 4 终篇）——见 §3/§4/§5/§6（记录在册）。
> **需求侧**：需求分卷（`docs/desktop/requirements/`）行号以现文为准；本档 D 号引用 = 需求卷条目号（查卷口 = `docs/desktop/requirements/PROJECT.md` §4 **D 表索引**；本域卷 = `docs/desktop/requirements/COMPOSER.md`）。

## 1. 关键决策（迁移自 PROJECT.md §2）

| 号 | 决策 | 依据 | 被否候选 |
|---|---|---|---|
| KD-17 | **`effort` 的会话级载体 = 槽数据文件顶层字段**（`null` = 未设 ⇒ 回落渠道默认）；`provider` / `model` 两键入参**不新增字段**——映射既有 `activeProvider` / `activeModel`；`newSlotData` 产 `effort: null`；`saveSession` 字段表**须携 `effort`**（缺之 ⇒ 下一次回合保存把槽写面结果整对象抹除——实读 `thincoder-core/session.mjs:120-138` 现表无该键）；老槽无键 ⇒ 按 `null` 容忍（**禁回填**——沿 `createdBy` 先例） | 需求档 §3.1:47（会话级三值 = **会话级**状态 · D6）——须随槽持久化、且与 CLI / 扩展端**同一份**槽；核现无该键的槽写出口（既有四钥 = `autoApprove` / `planMode` / `engineering` / `advisor.guard`）⇒ 端侧只剩两条错路：落 config（全局态——切一处波及全部会话）∥ 自建副本（跨端互写失守）；判据单源 = `docs/core/design/SESSION.md` §6.21 判据句 1 / 5 | 落 config 全局态（需求明写「会话级」）· 端自建槽副本（第二份存储）· 老槽回填（违批 A 已裁的禁回填先例） |
| KD-18 | **档位枚举化 = 双面**：设置面 = 全局默认（`模型与档位`段 `select`，写 `settings:agent`）∥ 会话级 = 输入区控件行（写槽）；枚举**单源** = 核 `specForModel(model).reasoningEffortEnum`（**逐模型取**——不落全局一份表）；端侧候选面 = `model:list` 回执**逐模型元素投影 `{ id, effortEnum, thinkOff }`** + `provider:list`（`thinkOff` = off 可达判据——单源 = 核 `thinkOffPath`）；表外档位字面串 ⇒ **归一 `null`**（未设——写面不预校验）；`null` 仅允许 `effort` 一键；`provider` 变更须**同送 `model`**（槽双字段恒非空）；**⑥ 设置面半（批 B 设计修订轮）**：写面 = `settings:agent` **意图级载荷** `{ tier: { provider, model, level } }`（**非键级 `patch`**——表不了删键 + 渲染面零键名）；键协议 = 统一式（先清不相容记号〔`thinking` 值 deep-equal `thinkOffShape(spec)` 时删〕再按档落形——判据单源 = 核 `thinkOffShape` / `thinkOffPath`）；`"none"` 不作独立档（由 `off` 承载）；现值 = `provider:list` 行投影 `effort`（离线 · 零探针）；**表外现值 ⇒ 自成一选项**（不吞）；`defaultModel` 缺 / 模型段空 ⇒ 控件零节点；拒绝面两码 `bad-level` / `unknown-provider`（零写）——**单源 = `docs/desktop/design/IPC.md` §2「档位控件注」** | 需求档 §3.5 项 6 逐字「自由文本 ⇒ 枚举选项」；枚举值域逐模型不同 ⇒ 端侧自持一份表必错（第二值域 = 漂移面）；候选面须离线可用（先例 = `thincoder-vscode/src/extension/settings.mjs:207-213`）；**缺口闭合** = 端 `model:list` 现仅回 `{ ok, models }`（实读 `thincoder-desktop/src/main/settings.mjs:118-129`）⇒ 补逐模型 `effortEnum` / `thinkOff` 投影（主进程引核函数 = 零副本，沿 `listModels` 转口先例）；⑥ = 设置面档位属**渠道条目级默认**（逐模型精确控制 = 会话级档位）；写后投影恒等为编辑器面硬要求（deep-equal 清记号判据之由——与 CLI 的差有意：CLI 只清 `null` 字面，范围由其评审 #1 圈定） | 端侧自持族别表（第二份值域）· 自由文本保留（需求明写收枚举）· 渲染面直引核（渲染面零 Node ⇒ 守卫 T-DSK16 红）· 全档共用一份 effort 表（逐模型值域不同）· 不补 `model:list` 投影 · 候选面恒含 off（不可达模型写后归一 `null`——两族在候选面不可区分）· tier 载荷走键级 `patch`（删键不可表达 · 渲染面须知键机制）· `"none"` 列独立候选（与 `off` 同义重复——`off` 族判据正看它）· 表外现值归一 `Auto`（吞值 · 写面回读不恒等）· 现值另开探针读（离线面可破——行投影即可） |
| KD-19 | **施加径 = 写盘 → 重施**（`loadAgentSlot`）单点；**在飞**（`flights.has(key)`）⇒ 拒 `busy`、**零写** | 施加面唯一 = 核 `applySession`（判据单源 = `docs/core/design/SESSION.md` §6.21 判据句 4——三端共用）；端侧内存态不手改（第二施加面 = 漂移）；回合在飞时改 provider / 模型 ⇒ 同会话前后分属两模型（回合一致性失守）；写盘后不重施 ⇒ 活动会话读数与内存态分叉 | 端侧直改内存态（第二施加面）· 在飞静默接受（回合内混模型）· 写盘后不重施 |
| KD-21 | **附件 = 渲染面零 fs**：`paste` 取剪贴板图像 → `FileReader` 转 `dataURL` ⇒ 随 `msg:send` 载荷 `images`（**dataURL 串数组**——严格串形，A1 收正）→ 主进程落盘 + 核 `appendImagePointer` 深 import（**核零改**）；**非视觉模型前置门**（核 spec `multimodal` 判据 · parity-b4 对齐 VSC 面）⇒ 先落盘 + 降级跑者（成功 = 描述注文 ∕ 失败 = 说明行，回执携 `degraded`）；单图上限 **15MB** | 沙箱渲染面零 Node ⇒ 无 fs（KD-3）；落盘与指针段住核（先例 = CLI / VSC 同径）⇒ 端侧零第二份实现；上限与弃项判据单源 = `docs/desktop/design/IPC.md` §2「附件注」（本档不重述） | 渲染面直写文件（越 KD-3）· 端侧自建落盘 + 指针格式（第二份实现 / 跨端不可读）· 静默丢图（须出 `degraded` 提示行） |
| KD-31 | **排队可见面 = 输入区上方待发送带（非流内）+ 队列按会话分键**（2026-09-28「对齐第二批」项 2）：忙态提交 ⇒ 待发送件住**输入区上方待发送带**（**非流内块**——派生：`pending` 镜面非空判据；消费时刻恰一枚真块入流）；队列 = **宿主单源**（`pending` 切片 = `ev:queue` 快照镜面——「回合中插入」批收正：原三纯动作带键与 flush 目标随本地队列退场；单源 = 本档 **KD-40**）；右列「队列」族**零写者 · 席位保留** | 用户 06:52「queued跑到右边Activity区去了」+ 07:08「排队中的时候要先是在输入区的上面，不是在右边」；待发送件随会话归属（带面随活动会话）⇒ 队列须带键（兼修「切会话错发」缺陷面）；核 `queued-mark` 直消费（`markPending` / `paintLabel` 两导出） = 标记形与标签两形态单源；`planBusyQueued` / `clearPending` 不消费（登记 = PROJECT.md §10 AZ） | **队列保全局未分键**（切会话漂页 + flush 错发他键）；**待发送件作块入 `blocks`**（页读整置即漂——与 slice 双记账）；**右列队列族继续承载**（违 07:08 原话）；**右列队列族摘除**（父侧 §1.8「回归本义」口径 = 席位不撤——摘除候选被否） |
| KD-40 | **忙态入队 = 宿主单源 + 步边界取批注入 + 回合尾续发（渲染面镜面）**（回合中插入批 · 2026-09-28 · 台账 #509）：① 队列 = 宿主按会话键内存表（`thincoder-desktop/src/main/queued-input.mjs`——容量 8 按键判 ∕ 计划取批（合并 ≤8 条 ∧ ≤2000 字符 + 合并形态 = CLI ∕ VSC 同值）∥ 条目 `{ text, ts, images? }`）；② 受理 = `send` 忙态入队（回执 `{ ok: true, queued: true }`；满 ⇒ `queue-full`）+ `turn-face.mjs` 传 `consumeQueuedInput`（**缝只接不改**——核 `thincoder-core/agent/turn-loop.mjs:90-93`（三拆前 `thincoder-core/agent.mjs:244-247`）；用户回合传 ∕ 消化轮不传；**timer 轮（`timerTurn` 真）同按 `autoTurn` 分流**——`autoTurn` 真 ⇒ 与消化轮同、缝不传，队列留待该轮回合尾续发）= `pushReal` 普通 user 消息（不中断 · 下一步生效）；③ 消费两时刻 = 步边界（同上报）∥ 回合尾（结算后队非空 ⇒ 宿主续发；队空 ⇒ 既有 `takeOver` 接管——**队列先于接管**；**续发起跑前查在飞表**——已有在飞 ⇒ 零续发，队列留待该回合结算点——单驱动器不变量）；④ 渲染面 `pending` 切片 = 宿主快照镜像（写者 = `ev:queue` 归约；`history:page` 回执 `queue` 键 = 冷启重建）+ **回合尾 flush 携行退役（`onTurnTail` 窄口存续——标题刷新消费面不动）**（防双写者重复投递）；⑤ 附件 = **留队**（条目携图；**步边界整批让位；送达径携图退化逐条**（逐条保图文同投）；送达面 `prepareTurnAttachments` 判决，`degraded` 随消费回执浮出）；**⑥ 挂起窗输入队共镜（挂起窗径批增——本批）**：窗内受理 ∕ 窗内消费 ∕ 残输入续发 ∕ 窗中止清队 ⇒ 同 `ev:queue` 帧（快照整置；消费回执 `delivered`）——**本批补：步边界消费并入窗面（窗优先：`suspension.stepBoundaryPickup ∥ chain.stepBoundaryPickup`——消费点五帧）∥ 窗消费按核计划取批（合并批 ∕ 携图退化逐条——载体数组单一 `inputQueue: entry.pending`：受理 ∕ 消费 ∕ 残值 ∕ 清队零第二写者）**——**两源（忙态队 ∪ 窗输入队）按键互斥**（窗开 ⇒ 忙态队已尽；窗内提交走窗径）⇒ 单镜无歧义；并源单点 = `turn-driver.mjs` `queueView`（链 `postQueue` 全帧 ∥ `history:page` `queue` 键）；**内存载体不合并**（两态两缝——沿被否行）；会话中止（`dispose` ∕ 切项目）⇒ **在飞回合中止 + 在飞表清**（`flights`——实读落点 = `thincoder-desktop/src/main/agent-host.mjs:320-321` ∕ `:335-336`）+ 队清 + 零续发；**边界（slash 尾径）**：步边界 ∥ 回合尾同判即消费（**计划首动作即消费**——slash ⇒ 单条直发 · 保序 · 不合并 · 零静默丢；**斜杠提交面拦截、不进队**（单源 = 本档 §2「斜径命令面批注」；队列侧 = **防御语义保留**） | 用户 14:08 走查「会话中插入用户指令的功能在桌面端也丢了」+ 设计三要素（不中断 ∕ 下一步生效 ∕ 内容不拆）；① 步边界回调只在宿主进程内可触（`runAgent` 宿主直跑）——队列若仍住渲染面则机制不可达（现状 = 只到回合尾）；② 两端同源：CLI `thincoder-cli/src/tui/queued-pickup.mjs:22-34` ∕ VSC `thincoder-vscode/src/agent.mjs:210` + `thincoder-vscode/src/extension/panel-turn-loop.mjs:106`（`autoTurn ? null : …`）；③ 队列快照 = VSC `pushBusyQueued` 同法（宿主权威 + 端侧镜像）；④ 留队 = 端差默认消灭（VSC 条目携图）且闭「文本引用附件被分离投递」错配 | **队列仍住渲染面（本地入队 + 回合尾 flush）**——步边界不可达（宿主读不到渲染面队列；「本地判忙 + 宿主判忙」两判据点必然漂移）；**渲染面 flush 保留与宿主续发并存**——双写者 ⇒ 同条重复投递；**拆行（文本入队 · 附件留输入区）**——内容错配（模型收到「看这个」而图未至）；**拒（携附件一律 `busy`）**——阻塞用户意图 + 与 VSC 分叉；**入队即落盘（VSC `savePastedImages` 形）**——桌面落盘面现只在送达点，入队即落盘 = 新落盘面 + 队清 ∕ 中止清理面（登记 = PROJECT.md §10 **BM**）；**窗口队列与忙态队合并**——窗输入面（核件 `pushInput` · 文本单形）语义不同（唤醒 ∕ 消化轮优先序），合并 = 两态两缝混同（本批：仅**显示面共镜**——载体不合并） |
| KD-51 | **@ 文件引用 = 核单源（`thincoder-core/file-refs.mjs`——`injectAtRefs` ∕ `stripAtRefs` 同档）+ 两端薄壳（探针注入）**（缺面族批补 · 2026-09-29 · 台账 #632）：① 注入位 = 用户回合起跑前单点（`thincoder-desktop/src/main/turn-face.mjs` `executeTurn`——`autoTurn` 不扫；resume 复用同一 body ⇒ 恰一次）；② 剥离位 = 恢复面（`thincoder-desktop/src/main/session-slots.mjs` `pageHistory`）∥ 标题源（核 `thincoder-core/generate-title.mjs` 读源——`stripAtRefs` 同件）；③ 文本形逐字冻结（regex ∕ 4000 截断 ∕ `[File: …]` 围栏 ∕ 摘要块——上提零语义改） | 语义同源 = `thincoder-core/file-refs.mjs`——上提后核单源；两端薄壳 = 探针注入——**只述实现形态**（形式沿 KD-39 收正先例）；成对契约不可劈（`stripAtRefs` fail-closed 判据逐字依赖注入输出格式——语法与其逆变换同住一处）；先例 = `file-links`（R2 上提 + parity-b4 改指）；**有意分歧给据（免登记）**：解析基 VSC = `_cwd() ∥ process.cwd()` ∥ 桌面 = `projects.currentCwd()`（无根 ⇒ 原样返回）——零用户可见差（两基同义 = 会话项目根 ∥ 工作区根）+ 无根态两臂皆不可达 ⇒ 登记豁免 | 被否：**双端各持**（成对契约劈开 ∕ 漂移无同步面）· **两步形**（双写窗口期 = 在册债形态）· **宿主例外**（父侧已裁不采——非宿主约束、属缺面） |
| KD-52 | **#543 携文容量档 = 忙态队同档；队满拒收可见形 = 入口预检回执 + toast + 文本不吞**（桌面收尾批 · 2026-09-29 · 台账 #656 · 批 `docs/batches/2026-09-29-desktop-carryover.md`）：① 容量档 = `QUEUED_MAX_ITEMS`（核件单源——携文入队与忙态队同表同判，不另立档）；② 拒收判点 = `interrupt` 入口（cap 询问待答 ∧ `message` 非空）**先执入队判**（`queued.add` 权威面）——满 ⇒ 整调用回 `{ ok:false, reason:"queue-full" }`，**零中止**（询问在场 ∕ 回合照旧 ∕ 零丢失）；③ 端侧可见形 = 核件 toast `input.slotFull`（词键复用——i18n 零增；先例 = 忙态径 `thincoder-render-core/composer/panel.mjs:304-306`）+ 文本回注输入框（先例 = VSC 无工作区拒发面「保留文本 + 瞬时 toast」——`docs/vsc/design/WEBVIEW-INPUT.md` §1 C-B2-5 ∕ §7 U-I7；对应 #543 文本零丢口径）；④ 入队单点 = interrupt 入口（cap 态判定）；`onCapCancelled` 退为核结算通知（零二次入队） | #543「用户输入零丢失」口径：静默丢 = 缺陷面（原形 = 零入队 ∕ 零帧——用户不可知）；对位 = 忙态径满队面（核 `thincoder-render-core/composer/panel.mjs:304-306` toast `input.slotFull` ∥ CLI `thincoder-cli/src/tui/key-handler-busy.mjs`）；真机可达 = 撞帽询问待答期 ∥ 队满（8 条）——补遗轮 #91 在册 | **维持静默**（违 #543 口径）；**出帧面（新 `ev:*` ∕ `ev:queue` 加标记）**（协议面增量——主侧本有同步回执位可承载）；**溢出放行**（容量档失守）；**拒收只提示不保留文本**（半量——文本仍丢） |

（**KD-25**（状态行 ∥ 段集）**KD-30**（状态栏对齐）两行涉输入区面仅「提示不入段」句——行全文留 `docs/desktop/design/PROJECT.md` §2 原址（单源保持；涉句不迁——不双载）。）


## 2. 界面形态与交互（迁移自 UI.md §1 · 本域批注块）

**本批注（回合中插入 · 步边界 pickup · 2026-09-28）**：本注定形桌面端「回合进行中插入用户指令」（用户 2026-09-28 14:08 走查「会话中插入用户指令的功能在桌面端也丢了」）——B1 宿主接缝 ∕ B2 渲染面时序 ∕ B3 附件边界三面；条目 = `docs/batches/2026-09-28-desktop-midturn-input.md` §1；决策单源 = `docs/desktop/design/PROJECT.md` §2 **KD-40**；台账 #509。

1. **队列单源 = 宿主（主进程）**——忙态提交 ⇒ `msg:send` **一律交宿主任判**（受理判据 = 宿主在飞表；渲染面**不再本地判忙入队**）：受理 ⇒ 回执 `{ ok: true, queued: true }` ⇒ **消费前流内零块**（待发送件住输入区上方带——项 4 形态；消费时刻入流恰一枚）；满队（第 9 条，按键判）⇒ 回执 `{ ok: false, reason: "queue-full" }` + 失败行（词键 `composer.send.failed`）+ **本地块退流** + 稿留输入历史（`↑` 召回）。
   镜面：`pending: { [会话键]: string[] }` 切片 = **宿主快照镜像**（条目 = 文本串——A9 收正）（写者 = `ev:queue` 归约；权威 = 宿主队列）；冷启 ∕ 重载重建 = `history:page` 回执 `queue` 键（首屏读）。
   落点：`thincoder-desktop/src/main/queued-input.mjs`（已落 · 实读 **78**（2026-09-29——队列取项边缘收正批后）——队列 + 计划取批：合并常量 8 ∕ 2000 与合并形态同 CLI ∕ VSC 值）· `thincoder-desktop/src/main/agent-host.mjs`（受理路由 + 续发链）· `thincoder-desktop/src/main/turn-face.mjs`（`consumeQueuedInput` 传参）；
   `thincoder-desktop/renderer/queue.mjs`（快照应用）· `thincoder-desktop/renderer/events.mjs` + `thincoder-desktop/renderer/events-subscribe.mjs`（`ev:queue` 订阅与归约）。
   判据：**机检** = 宿主用例（在飞提交 ⇒ 入队 + 回执形；第 9 条 ⇒ `queue-full` 零入队）+ 归约用例（快照整置 ∕ 消费回执）+ 计划面值对拍锁（与 CLI 副本同值）；
   **真机** = 忙态提交 ⇒ 气泡在场 ∧ 段 14 读数 = 1（**零 `busy` 拒面**）。
2. **消费两时刻（步边界注入 ∥ 回合尾送达）**——步边界 = 核循环头缝（`consumeQueuedInput`——**缝只接不改**）：用户回合传回调（系统轮 ∕ 消化轮不传；**timer 轮（`timerTurn` 真）同按 `autoTurn` 分流**——`autoTurn` 真 ⇒ 与消化轮同、缝不传，队列留待该轮回合尾续发）、取批按计划（**统一语义 = 计划首动作即消费**——`slash` ⇒ 单条即消费〔见项 5〕）、注入 = `pushReal` 普通 user 消息（**不中断**：在飞工具 ∕ signal 零触碰 · 下一步生效）；
   回合尾 = 结算（三径同判据）后队非空 ⇒ 宿主**续发**（起跑前查在飞表——已有在飞 ⇒ 零续发；取批 ⇒ 普通回合送达，递归至队空）⇒ 队空才进既有挂起窗接管（**队列先于接管**）；会话中止（`dispose` ∕ 切项目）⇒ 队清 + 零续发。
   呈现（两时刻同形）：`ev:queue` 消费回执 ⇒ 待发送带该项退场 ∧ 同帧用户块入流（**消费恰一枚**——本径零本地块）；段 14 读数随镜面。
   **渲染面回合尾 flush 携行随本批退场（`onTurnTail` 窄口存续——标题刷新消费面不动）**（双写者会造同条重复投递）。
   判据：**机检** = 宿主用例（步边界注入 ⇒ 历史尾 = `user` ∧ 批 ≥2 合并一次消费；结算后续发 ∕ 队空接管 ∕ 中止零续发）+ 归约用例（回执 ⇒ 气泡摘 + 尾块 = `user`）；**真机** = 忙态发两条 ⇒ 首条于下一步边界后可见（用户块 + 气泡交接）∧ 末条随回合尾送达。
3. **附件边界 = 留队（条目携图 · 步边界让位 · 送达面判决）**——条目可携 `images`（**dataURL 串数组**原样——A1 收正）；**批内含图 ⇒ 步边界不消费**（同步缝不可落盘 ∕ 降级）⇒ 留队待回合尾送达面：`prepareTurnAttachments`（既有面——落盘 ∕ 非视觉降级 ∕ 弃项）判决，降级码随消费回执 `delivered.degraded` 浮出（零静默）；气泡显示文本（图随条目走——两端同形；`dataURL` 不回传渲染面）。
   理由 = 端差默认消灭（VSC 条目携图 = 同语义面）；拆行 ⟹「文本引用附件被分离投递」内容错配；拒 ⟹ 阻塞用户意图 + 与 VSC 分叉。被否：拆行 ∕ 拒 ∕ 入队即落盘（VSC `savePastedImages` 形——桌面落盘面现只在送达点；入队即落盘 = 新落盘面 + 队清 ∕ 中止清理面；**登记消解径 = `docs/desktop/design/PROJECT.md` §10 BM**）。
   判据：**机检** = 宿主用例（携图条目 ⇒ 步边界不消费 ∧ 结算续发送达 ⇒ 附件面被调 + `degraded` 随回执）；**真机** = 忙态携图提交 ⇒ 气泡在场（文本）⇒ 回合尾送达后模型侧得图指引。
4. **形态零改面**：待发送带 ∕ 段 14 ∕ 满队提示 ∕ 右列「队列」族席位——形态与既有判据零改，只换**来源**（镜面）；待发送带两形态（单条 ∕ 多条标签——词键 `chat.pending.*`；逐条原文 `[data-raw]` ∕ 尾标记）与交接纪律照旧（`docs/desktop/design/UI.md` §1「本批注（对齐第二批 · 六件）」项 2）。
5. **边界（不做）**：斜杠文本入队门禁零改（**统一语义 = 计划首动作即消费**——`slash` 首条步边界 ∥ 回合尾同判即消费（单条 · 保序 · 不合并 · 零静默丢））；**斜杠提交面拦截、不进队**（单源 = 本档「斜径命令面批注」；队列侧 = **防御语义保留**）；队条目零编辑 ∕ 零撤回（既有）；队列 = 宿主运行期内存（重启即失）；挂起窗队列（`pushInput`）与忙态队**不合并**（两态两缝——载体不合并；窗内提交径 = 本档「挂起窗径批注」）；通知面零扩档。

**D3 计数（本批）**：条目 = **B1–B3** 三条；形态行触碰 = 输入区行 + 表行 14 + UI 大批注项 2（机制句收正）；新通道 **1**（`ev:queue`——单源 = `docs/desktop/design/IPC.md` §1）；新档 **1** + 拆分产出 **1**（`composer-send.mjs`（已落 · 实读 **70**）——在册预案本批落形）。

**本域·对齐第三批 B 三项（附件 ∥ 发送失败 ∥ 中断键）**

22. **附件·非栅格拒绝时机**——现状：先显缩略图、发出才知被丢（`partial`）。对齐形：**粘贴即拒**——栅格四型（png / jpeg / gif / webp）之外（含 `image/svg+xml` / `image/heic` / `image/bmp`）⇒ 不入条 + 提示行（词键 `paste.unsupportedFormat` 值逐字同 VSC——含 `${type}`）；
   提示行 = `composer-notice` 单形（`data-notice="attach-unsupported"`），下次成功采集 / 发送替换清。落点 = `thincoder-desktop/renderer/attach.mjs` + `mount-composer.mjs`。边界：主侧判据（`parseDataUrl`）零动（双闸——渲染面拒先达）。
26. **错误·发送失败可见性**——现状：只 `console.error`。对齐形：直发失败（`ok` 假 / 抛）⇒ 输入区提示行（`data-notice="send-failed"`；词键 `composer.send.failed` 带 `${reason}`）+ 文本保留；下次成功发送清。落点 = `mount-composer.mjs` + `i18n.mjs`。判据 = 机检（失败 ⇒ 提示行 ∧ 文本留）+ 真机（`provider-invalid` 可见）。
28. **输入区·中断键两态**——两态 = **显 ∕ 隐**——在飞（本会话位标含 `running`）⇒ 显；否则 ⇒ 隐（核件 `thincoder-render-core/composer/panel.mjs:404`——`running` ⇒ `display:flex` ∕ 否则 `none`；输入面板 = 核件工厂，两端同件同形）。
   **挂起窗在飞档**：消化 ∕ 唤醒轮在飞 ⇒ 该轮即普通回合面（`ev:activity` `turn` 帧 ⇒ 位标含 `running`）⇒ 显（中断 = 回合级——单源 = `docs/desktop/design/IPC.md` §2 `msg:interrupt` 窗内支）；
   窗空闲等待期（无在飞回合）⇒ 隐（通道级防线 = `{ok:false, reason:"idle"}`——键面零死控）——**判据单源 = 位标切片含 `running`**（`thincoder-desktop/renderer/views/chrome.mjs` `busyOf`——与输入区忙态同式；`suspActiveOf` = 出泡抑制面判据，非本键判据面）。落点 = `thincoder-desktop/renderer/mount-composer.mjs`（输入面板 = 核件工厂 `createComposerPanel`——两态住核件）。

**本批注（挂起窗径「消费前流内零块」· 2026-09-29）**：本注定形挂起窗（子代理在跑 ∕ 主回合已收）内插入的处置——「消费前流内零块」纪律**全输入径**落定（running 径已合规；本批补 susp 径 + queue-full 边角）；
   用户 2026-09-29 03:18 走查（「为什么现在还是我一回车直接就进流了」）；台账 #561；批档 = `docs/batches/2026-09-29-desktop-susp-queue.md`；决策 = `docs/desktop/design/PROJECT.md` §2 **KD-40 ⑥**（+ KD-23 ∕ KD-34 收正）。

1. **窗内提交 = 消费前流内零块 ∧ 待发送带在场**——宿主窗内受理回执携 `queued: true`（受理入队、消费前不入流）；窗队入排队镜面（`ev:queue` **两源共镜**：忙态队 ∪ 挂起窗输入队——按键互斥）；渲染面窗内提交**零本地块**（`onUserEcho` 抑制面判据 = `busyOf ∨ suspActiveOf`——`suspActiveOf` = 本批判据单源）；滞后竞态径由回执**退流**兜底（终态恒零块）。
2. **消费时刻入流恰一枚**——窗内消费（`driveTurn` 用户回合）∥ 残输入续发 ⇒ `ev:queue` 消费回执（`delivered`）⇒ 用户块入流（`delivered` 单写者；本径零本地块 ⇒ 与本地块零重复）；带该项同帧退场；段 14 读数随镜面。
3. **queue-full 反径（`msg:send` 忙态直发径）**——在飞队满 + 直发径（判忙滞后）⇒ 回执 `queue-full` ⇒ **本地块退流**（零块）+ 失败行在场（`[data-notice="send-failed"]`）+ 稿留输入历史（`↑`）；重试成功恰一枚（判据 = KD-23 失败径原句）；cap 询问待答径（`msg:interrupt`）处置另立 = `docs/desktop/design/UI.md` §1 输入区行第三面（决策 = `docs/desktop/design/PROJECT.md` §2 **KD-52** ③）。
4. **判据（真机 · 父侧闭合）**：窗内插话 ⇒ 流内零用户块 ∧ 待发送带在场 ∧ 窗落定消费 ⇒ 恰一枚入流；`queue-full` 径 ⇒ 零流内块 + 失败可见；**VSC 零回归** = 核件 `thincoder-render-core/**` 与 `thincoder-vscode/**` 零改（结构性判据）。
5. **边界**：窗内队容量不增 ∕ 载体不合并（两态两缝）∥ 满队 toast ∕ 词键零改 ∕ 通道零新 ∕ 测试面（全清令）——**仓套件不写 ∕ 不改 ∕ 不跑；批档本地用例随批留存**（不入仓套件）；段 14 = **形态零改 · 源并两源**（判据面 2026-09-29 扩四路——`docs/desktop/design/UI.md` §1「本批注（桌面重建保真 + 留端清算族 · 2026-09-29）」）。

**本批注（窗队列 VSC 逐点对齐 · 2026-09-29）**：本批 = 挂起窗输入队列的宿主面**逐点对齐 VSC 实盘**（规格本体 = `thincoder-vscode/src/extension/panel-messages.mjs:96-121` `pushBusyQueued`：两载体合计快照 ∕ 受理 + 五消费点 + 握手重推推送点）；台账 #564；批档 = `docs/batches/2026-09-29-desktop-window-queue-parity.md`（逐点对齐表 = 该档 §2.2）；
   承接 #561 批已定形的受理 ∕ 消费 ∕ 清标 ∕ 合泡语义——本批补携图面与逐点核账。

1. **窗内携图对齐（载具层携图）**——窗条目形 `{ text, ts, images? }`（与忙态队条目同形）；窗内提交携附件 ⇒ **同受理**（回执 `{ ok: true, queued: true }`）；送达面（窗内消费 ∕ 残输入续发）逐条过 `prepareTurnAttachments` 判决 ⇒ 降级码随 `delivered.degraded` 浮出（与忙态径同判据）；`busy` 档收窄为窗径竞态防御（窗已摘——实际不可达）。图不入快照（既有）。
2. **标记 ∕ 清标 ∕ 合泡语义（对齐 VSC）**——逐条标记 = 带面逐条（`[data-pending-item][data-raw]`）；清标 = 快照整置（消费 ∕ 中止清队即清）；合泡 = 消费回执 `delivered.text` 单写者入流恰一枚（= VSC `merged` 同义位）；窗径单条消费（批合并差登记驱动收口）。
3. **停滞显形（三端同查）**——在飞回合停滞 VSC ∕ CLI ∕ 桌面**均无**专门可见面（无看门狗 ∕ 无超时提示）；三端停滞期既有面同形（桌面 = loading + `ev:susp` 挂起句 + `ev:digest` 行 + 段 5 耗时）⇒ 停滞检测面登记为**跨端需求（另账）**，本端零发明。
4. **边界**——驱动语义（窗载具步边界取批 ∕ 消费批合并）零改（对位清单另账）；窗内队容量不增；核件 ∕ VSC ∕ `thincoder-render-core` 零改。
5. **判据（机检 ∕ 真机 · 父侧闭合）**——① **窗内携图受理**：窗内提交（携附件）⇒ 同受理回执 `{ ok: true, queued: true }` ∧ 待发送带在场（`[data-pending-item][data-raw]` = 提交文本逐字）∧ 图不入快照（快照 = 文本串数组——A9 收正）；② **送达面判决**：消费时刻（窗内消费 ∕ 残输入续发）图随回合送达——`prepareTurnAttachments` 判决 ⇒ 落盘 + 指针段（非视觉 ⇒ 说明行）；
   ③ **`degraded` 浮出**：判决降级 ⇒ 随消费回执 `delivered.degraded` 在场（零静默）；④ **窗内消费恰一枚**：带该项退场 ∧ 流内恰一枚用户块（本径零本地块——与本地块零重复）；**机检面** = 随批单元证据（**批档本地用例随批留存**——载体 = `docs/batches/2026-09-29-desktop-window-queue-parity.test.mjs`（T1–T9） · 不入仓套件；全清令：仓套件不写 ∕ 不改 ∕ 不跑）；**真机** = 人工走查 + 父侧真跑闭合（D16 义务）。

**本批注（@ 文件引用对齐 · 2026-09-29）**：本注定形桌面 @ 文件引用面对齐 VSC 形（注入 ∕ 剥离 ∕ 欢迎条词值 ∕ 判据 ∕ 计数——五项）；来源 = 缺面族批补批（`docs/batches/2026-09-29-missing-face-family.md` §2；台账 #632）；决策单源 = `docs/desktop/design/PROJECT.md` §2 **KD-51**（本注只述端侧形态与锚，不重述机制）。

1. **注入（模型输入面）**——用户回合起跑前单点 = `thincoder-desktop/src/main/turn-face.mjs` `executeTurn`（`:87`）：`body` 住续跑循环外 ⇒ resume 复用同一 body（**恰一次注入**）；`autoTurn` 系统轮不扫（timer ∕ 消化 ∕ 上行三径）。
   取值 = `projects.currentCwd()`（无根 ∥ 非串 ⇒ 原样返回——防御臂）；注入器 = 端薄壳 `thincoder-desktop/src/main/file-refs.mjs`（核单源 = `thincoder-core/file-refs.mjs`——探针注入）。
   活面气泡 ∕ 待发送带 ∕ 队镜面恒原文（注入只在 `run` 入参——三显示面零污染）。
2. **剥离（显示面）**——恢复面 = `thincoder-desktop/src/main/session-slots.mjs` `pageHistory`（user 消息文本过核件 `stripAtRefs`；首屏 ∕ 回填同门；assistant ∕ tool 零动）∥ 标题源 = 核 `thincoder-core/generate-title.mjs` 读源处剥离（标题不得由 `[File: …]` 正文生成）。
   盘面 ∕ 机读线零触碰（注入形 = 落盘形——只剥离显示面）；落点同位 = `thincoder-vscode/src/extension/panel-session.mjs:185`。
3. **欢迎条词值（U-A 核定 · 登记兑现）**——`welcome.shortcuts` 两语补 `@` 段：zh = 「输入 @ 引用文件 · Enter 发送 · Shift+Enter 换行」∥ en = 「Type @ for file references · Enter to send · Shift+Enter for newline」（plain-text 形；词条落点 = `thincoder-desktop/renderer/i18n-views.mjs`）。
4. **判据**——机检 = 批内件 **9/9 绿**（实件落点 = `.thincoder/tmp/2026-09-29-missing-face-family.test.mjs`；归档收位随父侧）；真机 = 五腿（注入哨兵复述 · 切回剥离形 · 负向零围栏 · VSC 回归复读 · 欢迎条首屏）= 父侧探针。
5. **计数（D3）**——词键 **0** 增退（`welcome.shortcuts` 值面收正）· 通道 **0** · 白名单 **0** · 段集零改；新档 **1**（`thincoder-desktop/src/main/file-refs.mjs` **19**）+ 核件 **1**（`thincoder-core/file-refs.mjs` **103**——上提单源，两端共享）。

**本批注（slash 命令面 · 2026-10-01 · 台账 #761）**：本注定形桌面 composer 的**斜杠命令面**（用户 2026-10-01 02:23 走查「桌面敲 `/model` 无反应」+「要啊」+「开批」；批档 = `docs/batches/2026-10-01-desktop-slash-commands.md`；机制单源 = `docs/render-core/design/RENDER-CORE.md` §2 **KD-RC-12** ∥ §5 条 6）。本注只述端侧触发 ∥ 命令 ∥ 回落 ∥ 忙态面与判据，不重述核件机制。

1. **触发判据（同 CLI）**：提交文本 `trim()` 后首字符为 `/` ⇒ **斜径**（`thincoder-desktop/renderer/slash-commands.mjs`（已落）表解析——命令名大小写不敏感 ∥ 别名解析）；非首字符（含 `foo /model` 形）= 普通消息（照既有径不改）。**无活动会话** ⇒ 同发送守卫（toast `workspace.required` + 文本保留）。
2. **本端在册命令（5 条 + 别名 3 · 全部 ⊆ CLI 表——不得自创）**：`/model`（开模型菜单——与控件行模型钮**同一菜单、同一函数**；别名 `/m`）· `/auto`（= AUTO 钮径——含开启内联确认门）· `/plan`（= PLAN 钮径——含 ENG×PLAN 互斥）· `/eng`（= ENG 钮径——含宿主入口门）；别名 `/p` ⇒ `/plan`；**`/help`**（流内打印形——命令面可发现性入口；别名 `/h`；形 ∥ 判据 = 本注项 8）。其余 22 条 CLI 命令逐条处置（另批 13 ∥ 不做 9）= 批档 §2.4。
3. **执行与消费面**：命中 ⇒ **本地面执行、不进消息径**（**零消息径上行** = 零 `msg:send` ∥ `queuedUserMessage` 上行、零用户块、零 loading、零 `onTurnStart` ∥ `onUserEcho`；**模式三钮动作照走 `session:flags`——同钮径不变**）；
   **已受理**（已执行 ∨ 二段交互在场——`/auto` 确认 popover 径同判）⇒ 清框 + 入输入历史（`↑` 可召回）；**未受理**（门拒 ∥ 携参不支持）⇒ 文本保留。**未知命令** ⇒ **不发送**（CLI 同判）+ toast `slash.unknown: <名>` + 文本保留。
4. **忙态 ∥ 挂起期（同钮门）**：`/model` 非 `idle`（`running` ∥ `susp`）拒 + toast `slash.busy`、文本保留（= 模型钮 `disabled` 同判据）；`/auto` ∥ `/plan` ∥ `/eng` 三钮无忙态门 ⇒ 命令可执行（同钮径）；`/plan` 在 ENG 态拒 ⇒ 复用词键 `toolbar.planDisabled`。**机制差异在册**：CLI 忙态对斜杠全吞——桌面取「命令面与钮面同门」（一致性优先；差异登记 = 批档 §2.3）。
5. **词键（三键 + 增量六键 × 2 语——落 `thincoder-desktop/renderer/i18n-views.mjs` 第二档，经注册面进核字典）**：`slash.unknown`（**值随增量收正**——en `Unknown command: ${name} (/help for available commands)`（CLI `thincoder-cli/src/tui/slash-commands.mjs:130` 前段逐字）；zh `未知命令：${name}（/help 查看可用命令）`）·
  `slash.busy`（en `Unavailable while the turn is running — try again when it finishes`；zh `回合运行中不可用——请等回合结束后重试`）· `slash.args`（en `This command does not take arguments here`；zh `此命令在此不接受参数`）；
   **增量六键（`/help` 面——消费面 = 端装配面 `printHelp` 口经核 `formatHelp` 取词）**：`slash.help.label`（en `❯ Help`——CLI 逐字；zh `❯ 帮助`）∥ `slash.desc.model`（en `select model & manage providers`；zh `选择模型并管理渠道`）∥ `slash.desc.auto`（en `toggle auto-approve`；zh `切换自动批准`）∥
   `slash.desc.plan`（en `toggle plan mode (design first, then implement)`；zh `切换计划模式（先设计，再实现）`）∥ `slash.desc.eng`（en `toggle engineering mode — strict methodology enforcement`；zh `切换工程模式——严格方法论约束`）∥ `slash.desc.help`（en `this list`；zh `本清单`）——**en 值皆 CLI desc 逐字**（读 CLI 源档机检）。
6. **判据**：机检 = 批内件（解析 ∥ 别名 ∥ 回落 ∥ 表纪律 ∥ `/help` 行集 ∥ 行族画件——`docs/batches/2026-10-01-desktop-slash-commands.test.mjs`）；
   真机 = 走查 ≥ 七腿（`/model` ⇒ 菜单在场 ∧ 输入框清空 ∥ `/nope` ⇒ toast **携 `/help` 指引** ∧ 文本留 ∥ 忙态 `/model` ⇒ 拒 ∧ 文本留 ∥ `/plan` ⇒ 钮态翻转 ∥ `/auto` ⇒ 确认 popover 在场 ∧ 输入框清空（受理径）∥ 忙态 `/plan` ⇒ 钮态翻转 ∥
   **`/help` ⇒ `[data-help]` 行族在场（标签 ∥ 组 ∥ 命令行三段）∧ 回底 ∧ `data-blocks` 不变**）——**全表（含携参拒 ∥ 无会话守卫 ∥ ENG 态 `/plan` 拒 ∥ `/help` 面）= 批档 §2.7 ∥ §2.10**。
7. **边界（不做）**：键位补全（Tab——Web 焦点键，接管需用户裁定）· 其余 22 条命令（另批 ∥ 不做——逐条处置 = 批档 §2.4）· 携参直切（`/model p:m`——另批候选）· **VSC 命令面零接缝**（不传 `deps.slash` ⇒ 行为零变）。
8. **`/help` 面（增量 · 2026-10-01 用户直斥「你他妈的help都没有」+「去看 cli 的斜杠命令代码，别自己生造」；依据 = CLI `cmd-help.mjs` 实盘形）**：**流内打印形**——标签 `❯ Help` ∥ 组序（Agent → System，CLI 同序）∥ 命令行 `名字 (别名)  描述` 逐行；**禁浮层 ∥ 禁 toast 主体 ∥ 禁交互式列表**（CLI 实盘零交互）。
   内容单源 = **表本体**（核 `formatHelp` 表→行集 ∥ 端 `printHelp` 口承载）；行族 `[data-help]` = 流内非块节点（尾组槽位：台账行组后 ∥ 卡序列前——`data-blocks` 不变式零破 ∥ 重挂径槽位固定零位次记忆）；生命周期 = 运行期痕（首屏页读整置即失——同 `[data-timer]` 族）；
   受理径 = 清框 + 入历史 + **回底**；无忙态门（打印零状态写）；未知反馈携 `/help` 指引；别名 `/h` 在册。逐面 = 批档 §2.10（CLI 实盘对位表 ∥ E10–E13）。

**本批注（首跑渠道提示修复 —— `provider-invalid` 词面真因化 · 2026-10-03 · 台账 #840）**：本注定形输入区发送失败行的 `provider-invalid` 词面——真因分类 → 词。
批档 = `docs/batches/2026-10-03-desktop-firstrun-provider-notice.md` §2；契约面 = `docs/desktop/design/IPC.md` §2 `msg:send` 行；设置 ∕ 向导面 = `docs/desktop/design/SETTINGS.md` §2.14。

1. **回执携分类**：`msg:send` 失败回执 `provider-invalid` 另携 `providerKind`（闭集 `defaultModel` ∥ `provider`）——失败态载体（`thincoder-desktop/renderer/composer-wire.mjs` `recordFailure`）由裸串改携 `{ reason, kind }`；`failure()` 单消费点 = 本域 `renderer/composer-sync.mjs`。
2. **类 → 词**（`thincoder-desktop/renderer/composer-sync.mjs` `failedNotice`）：`kind === "defaultModel"`（缺 ∥ 无效 `defaultModel`）⇒ **词 = 新键 `composer.send.noDefaultModel`**（zh `默认模型未设置或无效` ∥ en `Default model missing or invalid`——状态陈述）；
   余（无渠道可解析 ∥ 条目结构不全 ∥ 分类缺）⇒ 现键 `composer.send.noProvider` 逐字不动（VSC 基准词）∥ 纯文本行照旧；余码仍 `composer.send.failed` + `${reason}`。
3. **可修链**：模型菜单选取（候选 = `model:catalog` **全渠扇出**，不依赖激活渠道）⇒ 会话槽写（`session:prefs`，既有）⇒ 装配后**槽复验**（新 —— `thincoder-desktop/src/main/agent-host.mjs` `assembleAndLoad`：
   `loadAgentSlot` 后 `if (agent._providerInvalid) validateProvider(agent, agent.config)`，CLI 同型）⇒ 下次发送放行。
   **指路避死端**：设置面「模型与档位」段候选按激活渠道取数（`renderer/mount-settings-reads.mjs:33-39` / `:74-78`），本态零候选 ⇒ 不作指路。
4. **判据**：**界面语句必须指向真实可修的下一步**（用户 12:56 走查原话精神）——「缺 key」误导句消；console 失败行逐字不动（E2E 锚 `[composer] msg:send failed: provider-invalid`）；词表单源 = `renderer/i18n-views.mjs`（两语成对，键集相等机检）。
5. **边界**：`composer.send.noProvider` 值 ∥ 行形 ∥ 锚（`data-notice="send-failed"`）∥ 清位纪律（下次成功发送清）零改；核件 ∥ VSC 零触。

**本批注（无效渠道态逻辑归一 —— fallback 明示行 · 2026-10-03 · 台账 #841）**：本注定形 composer 提示带上**态明示行**——「可运行 ∧ 无有效 `defaultModel`」（`fallback`）态的端侧呈现
（判据单源 = `docs/core/design/PROVIDER.md` §6.22；承 #840 批注的字面——**零新键**）。批档 = `docs/batches/2026-10-03-provider-invalid-unify.md` §2；契约面 = `docs/desktop/design/IPC.md` §2「provider 态投影注」。

1. **数据面**：`history:page` 回执（会话打开）∥ `msg:send` 回执（发送刷新）∥ **设置写回执**（`settings:agent` ∥ `provider:save` 成功回执——**第三刷新点**；实落写点三处 = `thincoder-desktop/src/main/settings.mjs:230` ∥ `:330` ∥ `thincoder-desktop/src/main/providers.mjs:181`）
   新增 `providerState` 键（形 = `{ state, channel, model, reason, invalidReason }`）；渲染面落 store 切片（写点与 `meta` 同族）⇒ 提示带重派生（`paintNotices`）。
2. **行面**：`state === "fallback"` ∧ **非 invalid 类**（合成式 = `state === "invalid"` ∨ `providerInvalidReason` 非空——单源 = `doc:PROVIDER.md:§6.22`）⇒ 本行在场——词 = `composer.send.noDefaultModel`（**逐字复用 #840 键**，词为**态陈述行**，非发送失败行）；
   行锚 = `data-notice="provider-fallback"`（机检面——与失败行锚 `send-failed` 分判）；`state === "ok"` ⇒ 零行（负向锁——invalid 类除外）；invalid 类 ⇒ 本行零行（归发送失败行——#840 面）。
3. **行序**：提示带尾（现序 [待发送? ∥ 降级? ∥ 失败?] 零动，本行追加于带尾）。
4. **清位**：`state` 转 `ok` 的一次 `msg:send` 回执到达 ⇒ 行退场；**第三刷新点（评审发现 7）**：设置写回执（`settings:agent` ∥ `provider:save` 成功回执；实落写点三处 = `thincoder-desktop/src/main/settings.mjs:230` ∥ `:330` ∥ `thincoder-desktop/src/main/providers.mjs:181`）携 `providerState` ⇒ 同点落切片（渲染面三出口）⇒ 行随重派生
   （设置面修好 `defaultModel` 后**即时**退场——不再等下次发送 / 开页；零新通道——回执内字段）。
5. **边界**：#840 的失败词路由零改；`providerKind` 判据换源（「渠表非空」→「有持 key 渠道」——全无 key 态出真·无 key 词）记于批档 §2 受影响表，不另立面。核件 ∥ VSC 零触。

## 3. 文件账（本域）

### 3.1 本端文件清单与行数预算（本域族行 · 迁自 `PROJECT.md` §4.1——逐字）

| 文件 | 预估行数 | 说明 |
|---|---|---|
| `thincoder-desktop/src/main/queued-input.mjs`（「回合中插入」批新档） | **78**（实读 2026-10-01——复核扫面收正批实施后（90 ⇒ 78——M6：原语 ∥ 档头句删）；更前实读 2026-09-29——桌面收尾批（#656）后；队列取项边缘收正批后：`peek` ∕ `take` 核件形取项 + `plan` 形收正） | 宿主队列单源（队列 + 计划取批 + 核件形取项——单源 = 本档 §1 **KD-40**） |
| `thincoder-desktop/src/main/window-queue.mjs`（在册预案落形 · 合并实施轮新档） | **103**（实读 2026-09-29——队列取项边缘收正批后：步边界取批（`stepPickup`）+ 五帧） | 窗队投影 ∕ 帧构造面出档（自 `thincoder-desktop/src/main/suspension-drive.mjs` 拆出——越 300 预案落形；面 = 条目形 ∕ 窗队投影 ∕ 五帧 ∕ 步边界取批 ∕ 送达面〔`prepare ⇒ degrade`——与 `turn-chain.mjs` 同判据〕；零宿主依赖（`postQueue` ∕ `prepare` ∕ `degrade` 三注入）⇒ 平 node 直测；单源 = 本档 §3.2 本批行） |
| `thincoder-desktop/src/main/attachments.mjs`（批 B） | **107**（实读 2026-09-29——输入面板上提后） | 附件落盘面（批 B 新档——渲染面 `dataURL` → 主进程落文件 + 核 `appendImagePointer` 锚点）；语义 / 上限 / 清理时点单源 = `docs/desktop/design/IPC.md` §2「附件注」 |
| `thincoder-desktop/src/main/file-refs.mjs`（@ 文件引用对齐批新档） | **19**（实读 2026-09-29） | 端薄壳（核单源 = `thincoder-core/file-refs.mjs`）：`node:fs` 三件探针 + 核件注入转口 + `stripAtRefs` re-export；消费面 = 注入缝（`turn-driver.mjs`）∥ 恢复面剥离（`session-slots.mjs`） |
| `thincoder-desktop/src/main/at-complete.mjs`（R1 输入面板移植新档） | **74**（实读 2026-09-29） | `at:complete` 文件枚举过滤（@ 前缀剥离 → 项目树枚举 → 过滤 → 封顶 20；零改 `file-links.mjs`） |
| `thincoder-desktop/renderer/queue.mjs`（对齐第二批拆分产出） | **40**（实读 2026-09-29——宿主镜面收正后余快照应用） | 队列面出档（三纯动作 + `QUEUE_MAX`——自 `thincoder-desktop/renderer/store.mjs`） |
| `thincoder-desktop/renderer/mount-composer.mjs` | **299**（实读 2026-10-03——无效渠道态逻辑归一批（#841）实施落盘（297 ⇒ 299——`COMPOSER_KEYS` 补 `providerState`（第三刷新点重派生闭环）；**贴 300 层在册**（+1 行即越线——`docs/desktop/design/PROJECT.md` §4.1 贴层段））；前读 **297**（实读 2026-10-02——菜单体系批实施落盘（296 ⇒ 297）；前读 **296**（实读 2026-10-01——**#761 落盘后**（`formatHelp` import ∥ `printHelp` 口 ∥ deps 键））；前读 **276**（实读 2026-09-30——扁平化 v4 迁行（+15）后；前读 261（桌面收尾批（#656）后 ∥ 模型菜单全渠批 +1））） | 输入区挂载出档（自 `thincoder-desktop/renderer/app.mjs` 拆出——批 A）：两态落形 · Enter / Shift+Enter 键位 · 忙态入队（受理交宿主任判——「回合中插入」批收正）· 满队提示（按键判）；**批 B**：附件条挂载（根锚 `data-attachments`——构树 / 采集住 `thincoder-desktop/renderer/attach.mjs`）+ 附件随 `msg:send` 载荷 `images` 出口 + `degraded` 提示行；**模型菜单全渠批**：`refreshCandidates` 透传导出（`sync.refreshCandidates`——`:243`）+ 句柄注；形态单源 = `docs/desktop/design/UI.md` §1 输入区行（批 B 注项 2） |
| `thincoder-desktop/renderer/composer-wire.mjs`（输入逻辑收正轮拆分产出） | **276**（实读 2026-10-03——无效渠道态逻辑归一批（#841）实施落盘（266 ⇒ 276——三路成功回执落切片（`sendDirect` ∥ `healLate` ∥ `sendQueued`——键缺席 ⇒ 零写））；前读 **266**（实读 2026-10-03——首跑渠道提示修复批（#840）实施落盘（262 ⇒ 266——失败载体 `{ reason, kind }`（`providerKind` 透传——`failure()` 单消费点）+ 注））；前读 **262**（实读 2026-10-01——**#764 落盘后**（退流一作业点 `cut` + 摘空并 `build`）；前读 **254**（实读 2026-09-29——桌面收尾批（#656 `queue-full` 可见形消费缝）后；desktop-residuals-round3 波 B（#613）后）） | 输入区写面出档（通道往返归一 + 逐类型出站 handler：`msg:send` ∕ `msg:interrupt` ∕ `at:complete` ∕ `session:prefs` ∕ `session:flags` ∕ footer 三出口；本地先行块登记与退流 ∕ 失败态行源） |
| `thincoder-desktop/renderer/composer-sync.mjs`（#510 留守拆档产出） | **322**（实读 2026-10-03——无效渠道态逻辑归一批（#841）实施落盘（306 ⇒ 322——`providerNotice` 态明示行（`fallback` ∧ 非 invalid 类 ⇒ 带尾行——词 `composer.send.noDefaultModel` 逐字复用）+ 清位面）；前读 **306**（实读 2026-10-03——首跑渠道提示修复批（#840）实施落盘（302 ⇒ 306——`providerKind` 类路由（词面-only）+ 载体 `{ reason, kind }` 消费））；**越 300** ⇒ 越层在册——见 `docs/desktop/design/PROJECT.md` §4.1 越层段（本批 = 续期）；前读 **302**（实读 2026-09-29——口子清零二轮（引导形路由 + 注释收正）后）） | 输入面板随动派生面（自 `thincoder-desktop/renderer/mount-composer.mjs` 拆出——`state` 读面 + 忙态 ∕ 守卫派生 + 模式位推送 + 候选面 + 两挂件锚窄刷（提示带 ∕ 末条复制控件）+ `syncPanel`）；**本批（复制面对齐）**：`syncLastCopy` 族与 `writeText` / `tailOf` deps 随摘；**模型菜单全渠批**：候选面重写（`land` ∕ `fetchCatalog` ∕ `startRetryChain` ∕ `syncCandidates` ∕ `pushModels` ∕ `refreshCandidates`）+ 旧端差登记注删（该端差本批闭合）；形态单源 = `docs/desktop/design/UI.md` §1 输入区行 |
| `thincoder-desktop/renderer/attach.mjs`（批 B） | **54**（实读 2026-09-29——输入面板上提后） | 附件采集与构树纯函数（输入区 `paste` → `FileReader` → `dataURL` 条目集 + 移除控件；**零 fs** ⇒ 平 node 直测）；形态单源 = `docs/desktop/design/UI.md` §1 输入区行（批 B 注项 2） |
| `thincoder-desktop/renderer/chat-composer.css` | **136**（实读 2026-10-01——扁平化随动收口批（#713）落盘后（138 ⇒ 136）；更前实读 2026-09-30——门回填（排版覆盖段等近批随动）；前读 70（扁平化 v3+v4 覆盖段后）∕ 48；未越 300） | 输入区段样式（自 `thincoder-desktop/renderer/chat.css` 四拆）：变量别名块（C2 唯一桥）+ 提示行锚 + 扁平化覆盖段（v3 圆角 ∥ v4 迁行）；面板族本体单源 = 核件 `composer/composer.css`——**本批（复制面对齐）**：两控件族 + `⧉` 字形 + 尾锚规则随摘 |

**行数面机检**：本表迁出后，`checkConfig.lineCounts`（`PROJECT-MANIFEST.json`）读取面 = `docs/desktop/design/PROJECT.md` §4.1（运行根单读）——本表行按同值同步；后续本域新档由落盘批在本表补行（沿 §4.1 纪律）。
**原址指针**：本族各行在 `docs/desktop/design/PROJECT.md` §4.1 已改一行指针（as-of 2026-10-02）。

### 3.2 现有文件改动 · 批块（本域 · 迁自 `PROJECT.md` §4.2——逐字；块内「本档」类回指已按新落点改指）

**本批（挂起窗径批 ∥ 窗队列批 · 已实施——#119 合并实施轮）行「实读落值」**（实读 2026-09-29——内容行数口径；两批同触面**串行实施**（合并实施轮）⇒ 合并给数；机制 ∕ 判据单源 = **KD-23**（`docs/desktop/design/CHAT.md` §1） ∕ **KD-34**（`docs/desktop/design/ACTIVITY.md` §1） ∕ **KD-40 ⑥**（本档 §1）
  · `docs/desktop/design/UI.md` §1「本批注（挂起窗径「消费前流内零块」· 2026-09-29）」∕「本批注（窗队列 VSC 逐点对齐 · 2026-09-29）」；批档 = `docs/batches/2026-09-29-desktop-susp-queue.md` ∕ `docs/batches/2026-09-29-desktop-window-queue-parity.md`）：

| 文件 | 实读落值（构成） | 批 |
|---|---|---|
| `thincoder-desktop/src/main/suspension-drive.mjs` | **326**（实读 2026-09-29——#119 合并实施轮后；**越 300**（≤500 硬限内）⇒ 越层在册 + 拆分已执行：窗队 ∕ 帧构造面出档 `thincoder-desktop/src/main/window-queue.mjs`（**91**）仍未回线 ⇒ 拆分预案 = 窗内时效 ∕ 时序守卫面出档（≈30 行）· 消解窗口 = 该档下次**结构性**触碰的批（注释 ∕ 坐标 ∕ 词值 ∕ 行级小修不计）；构成 = 注入转口（`postQueue` ∕ `prepare` ∕ `degrade`）· `pushInput(key, text, images)` 受理 · 窗内消费 ∕ 残续发调用点 · 窗中止清队 · `inputSnapshot` 读面） | 挂起窗径批 ∥ 窗队列批 |
| `thincoder-desktop/src/main/turn-driver.mjs` | **291**（实读 2026-09-29——#119 合并实施轮后；届盘按盘收正 = 队列取项边缘收正批；构成 = 挂起支回执 `queued` · `queueView` 并源 · `queueSnapshot` 读面 · 窗支携图受理 ∕ `createSuspensionDrive({ prepare })` 注入；差额含并行批先落） | 挂起窗径批 ∥ 窗队列批 |
| `thincoder-desktop/renderer/views/chrome.mjs` | **198**（实读 2026-09-29——#119 合并实施轮后；`suspActiveOf`——`busyOf` 邻位导出） | 挂起窗径批 |
| `thincoder-desktop/renderer/composer-wire.mjs` | **176**（实读 2026-09-29——#119 合并实施轮后；`sendDirect` 队形支退流 + 挂起空闲复位 · 失败径退流 · `noteEcho` null 登记） | 挂起窗径批 |
| `thincoder-desktop/renderer/mount-composer.mjs` | **243**（实读 2026-09-29——#119 合并实施轮后；`onUserEcho` 抑制面扩 susp + 恒登记 · wire deps `suspIdleOf`） | 挂起窗径批 |
| `thincoder-desktop/renderer/composer-sync.mjs` | **188**（实读 2026-09-29——#119 合并实施轮后；`turnState` 改用 `suspActiveOf`） | 挂起窗径批 |
| `thincoder-desktop/src/main/turn-chain.mjs` | **99**（实读 2026-09-29——#119 合并实施轮届盘；**零改**——帧构造单点保位） | 挂起窗径批 |
| 核件 ∕ VSC ∕ `thincoder-render-core` | **0**（结构性零改——两批同判；实读 2026-09-29） | 双批 |
| 测试面 | 全清令：**仓套件不写 ∕ 不改 ∕ 不跑；批档本地用例随批留存（不入仓套件）**；验收 = 判据句 + 真机读数——父侧闭合 | 双批 |
| `docs/desktop/design/{PROJECT,IPC,UI,RENDERER}.md` | 本批设计落定（已落——KD-23 ∕ KD-34 ∕ KD-40 ⑥ · IPC `ev:queue` ∕ `msg:send` 两行 · UI 两本批注 + 输入区行 · RENDERER §1.1） | 双批（已落） |

**本批（队列取项边缘收正批 · #621–#625 + N1 出档 · 2026-09-29）行「实读落值」**（实读 2026-09-29——内容行数口径；机制 ∕ 判据单源 = 本档 §1 KD-40 ①⑤⑥（收正句）· `docs/desktop/design/UI.md` §1 本批注（斜杠边界句“统一语义”句）· `docs/vsc/design/WEBVIEW-INPUT.md` §1 C-B2-6 细则⑧（收正句）；批档 = `docs/batches/2026-09-29-queue-pickup-edge.md` §2 ∕ §2.10）：

| 文件 | 实读落值（构成） | 批 |
|---|---|---|
| `thincoder-desktop/src/main/suspension-drive.mjs` | **337**（窗面接线（步边界取批 ∕ 窗优先组合）+ 容量满判（`"full"`）+ 残值按批 + 时序守卫面出档（⇒ `suspension-guard.mjs`）——**仍越 300** ⇒ 越层在册 + 预案更新 = 窗内时效面出档） | 队列取项边缘收正批 |
| `thincoder-desktop/src/main/suspension-guard.mjs`（新档） | **27**（`guardedDeliver`——hold 占位守卫序列出档；纯结构搬） | 同 |
| `thincoder-desktop/src/main/queued-input.mjs` | **78**（`peek` ∕ `take` 核件形取项 + `plan` 形收正（`slash` ∕ `entries` 退役）——73 ⇒ 78） | 同 |
| `thincoder-desktop/src/main/window-queue.mjs` | **103**（步边界取批 `stepPickup` + 五帧；`take`（find-by-text）退役——91 ⇒ 103） | 同 |
| `thincoder-desktop/src/main/turn-chain.mjs` | **99**（步边界 slash 即消费 + 尾径核件取项（`peek` ∕ `take`）——±0） | 同 |
| `thincoder-desktop/src/main/turn-driver.mjs` | **291**（步边界缝组合（窗优先）+ 窗支回执三态——287 ⇒ 291） | 同 |
| 核 ∕ VSC ∕ CLI 同批档 | 核 `queued.mjs` **90 ⇒ 90**（slash 单条取 + 头注 ∕ JSDoc 收正）· VSC `queued-merge` **26 ⇒ 11** ∕ `queued-pickup` **58 ⇒ 42** ∕ `panel-turn-stages` **250 ⇒ 250** ∕ `suspension` **290 ⇒ 290**（收编归核_导入改指 + 注释收正）· CLI 两档注释收正（零码改） | 同 |
| 测试面 | 全清令：**仓套件不写 ∕ 不改 ∕ 不跑；批档本地用例随批留存（不入仓套件）**；验收 = 判据句 + 真机读数——父侧闭合 | 同 |
| `docs/desktop/design/{PROJECT,UI}.md` + `docs/vsc/design/WEBVIEW-INPUT.md` | 本批设计档收正（已落——KD-40 ①⑤⑥ 句 + UI 斜杠边界句 + WEBVIEW-INPUT 细则⑧） | 同 |

**本批（桌面 slash 命令 · 设计轮 · 2026-10-01 · 台账 #761 · 批 `docs/batches/2026-10-01-desktop-slash-commands.md`）行「现行 ⇒ 预期」**（实读 2026-10-01——内容行数口径（文末换行不计）；
  机制 ∕ 判据单源 = `docs/render-core/design/RENDER-CORE.md` §2 **KD-RC-12** ∥ §5 条 6 ∥ `docs/desktop/design/UI.md` §1「本批注（slash 命令面 · 2026-10-01）」；**设计轮——产品码零触**）：

| # | 档 | 现行 ⇒ 预期 | 面 |
|---|---|---|---|
| 1 | `thincoder-desktop/renderer/slash-commands.mjs`（已落） | — ⇒ **65**（实读 2026-10-02——命令表 4 条 + 别名 2——全调 `ctx.actions`；零第二实现） | 端表层 |
| 2 | `thincoder-desktop/renderer/mount-composer.mjs` | **276 ⇒ ≈282**（+import + `slash` deps 一处装配） | 装配面 |
| 3 | `thincoder-desktop/renderer/i18n-views.mjs` | **336 ⇒ 348**（+3 键 × 2 语 + ⑬ 组注——实读 2026-10-01；**越 300 在册**——键行 = 非结构性触碰 ⇒ 续期；预案 = 词族按视图面续拆——见 `PROJECT.md` §4.1 行） | 词面 |
| 4 | 核包（`thincoder-render-core/`） | `thincoder-render-core/composer/slash.mjs`（已落）**43** · `thincoder-render-core/composer/panel.mjs` **439 ⇒ 489**（实读 2026-10-01——硬限余 **11**；越 500 先落在册拆档）· `thincoder-render-core/composer/model-menu.mjs` **448 ⇒ 456**（实读 2026-10-01；**越 300 在册**——续期说明：提取 + 导出（≈+12 · 机械提取零新面 ⇒ 非结构性触碰）；拆分预案 = 菜单族按段出档；消解窗口 = 该档下次结构性触碰的批——单源 = `docs/render-core/design/RENDER-CORE.md` §6 本批随动段）· `thincoder-render-core/composer/controls.mjs` **205 ⇒ 219**（实读 2026-10-01）——逐档 = `docs/render-core/design/RENDER-CORE.md` §6 本批随动段 | 核面 |
| 5 | 批内件 | `docs/batches/2026-10-01-desktop-slash-commands.test.mjs`（已建成 · 425 行——解析 ∥ 别名 ∥ 回落 ∥ 表纪律；随批留存 · 不进仓套件） | 全批 |
| 6 | 设计档 | 本档 §3.2（本块）· `docs/desktop/design/UI.md` §1 输入区行 + 表行 15 + 本批注 + 变更记录 · `docs/render-core/design/RENDER-CORE.md` §2 KD-RC-12 + §5 + §6 + §9 + 变更记录 | 全批 |

零触面：`renderer/composer-wire.mjs` ∥ `renderer/composer-sync.mjs` ∥ `renderer/app.mjs` ∥ `index.html` ∥ `composer.css` ∥ `docs/desktop/design/IPC.md`（**零新通道**）∥ CLI 全树 ∥ VSC 全树 ∥ `thincoder-core`。

**本批（桌面 slash 命令 · `/help` 增量 · initial 轮 · 2026-10-01② · 台账 #761 · 批 `docs/batches/2026-10-01-desktop-slash-commands.md` §2.10）行「现行 ⇒ 实读（实施落盘 · 父侧回填 2026-10-01）」**（实读 2026-10-01②——内容行数口径（文末换行不计）；
  机制 ∕ 判据单源 = `docs/render-core/design/RENDER-CORE.md` §2 KD-RC-12 增量句 ∥ §5 条 6 ∥ `docs/desktop/design/UI.md` §1 本批注项 8 ∥ `docs/desktop/design/RENDERER.md` §1.1 帮助行族条；**实施落盘（#86）· 父侧回填**）：

| # | 档 | 现行 ⇒ 预期 | 面 |
|---|---|---|---|
| 1 | `thincoder-render-core/composer/slash.mjs` | **43 ⇒ 69**（实读；+`formatHelp` 表→行集 ∥ 组序常量） | 核面 |
| 2 | `thincoder-render-core/composer/panel.mjs` | **489（零触 · 实读同值**——打印口 = 端侧表构造期闭包注入；`deps.slash`/`ctx` 零改 ∥ 硬限余 11 保持） | 核面 |
| 3 | `thincoder-desktop/renderer/slash-commands.mjs` | **41 ⇒ 65**（实读；4 条补 `group`/`descKey` + `/help` 条（别名 `/h`）） | 端表层 |
| 4 | `thincoder-desktop/renderer/mount-composer.mjs` | **283 ⇒ 296**（实读；+`formatHelp` import ∥ `printHelp` 口 ∥ deps 装配补键） | 装配面 |
| 5 | `thincoder-desktop/renderer/store.mjs` | **307 ⇒ 322**（实读；+`helpLines` 槽 ∥ `setHelpLines` 纯动作；**越层在册——结构性触碰 ⇒ 拆档评估窗口触发；处置 = **父侧裁 2026-10-01 = 续期**（其后 #764 再触 ⇒ 见 `PROJECT.md` §4.2 流面对账重写批块）**） | 状态树 |
| 6 | `thincoder-desktop/renderer/views/chat-chrome.mjs` | **221 ⇒ 252**（实读；+`helpGroupNode` ∥ `syncHelp` ∥ `helpAnchorOf` ∥ 锚链四件随动） | 帧刷面 |
| 7 | `thincoder-desktop/renderer/views/chat-model.mjs` | **105 ⇒ 117**（实读；+`help` 字段 ∥ `helpLinesOf`） | 模型面 |
| 8 | `thincoder-desktop/renderer/views/chat-tree.mjs` | **151 ⇒ 153**（实读；帮助行族入树——台账行组后） | 构树面 |
| 9 | `thincoder-desktop/renderer/views/compress-status.mjs` | **75 ⇒ 75**（实读；`compressAnchorOf` 链补） | 锚面 |
| 10 | `thincoder-desktop/renderer/frame-dispatch.mjs` | **53 ⇒ 53**（实读；`CHAT_KEYS` += `helpLines`） | 帧分派 |
| 11 | `thincoder-desktop/renderer/page-read.mjs` | **282 ⇒ 293**（实读；+`clearHelpLines`——运行期痕五清） | 页读面 |
| 12 | `thincoder-desktop/renderer/i18n-views.mjs` | **348 ⇒ 362**（实读；+6 键 × 2 语 + ⑬ 组注；**越 300 在册**——键行 = 非结构性触碰 ⇒ 续期） | 词面 |
| 13 | `thincoder-desktop/renderer/i18n.mjs` | **401 ⇒ 404**（实读；键数链回填：`VIEWS_DICT` 129 ⇒ 135 ∥ `HOST_DICT` 302 ⇒ 308） | 词面 |
| 14 | `thincoder-desktop/renderer/chat-fixes.css` | **118 ⇒ 124**（实读；帮助行族三行类） | 样式面 |
| 15 | 批内件 | `docs/batches/2026-10-01-desktop-slash-commands.test.mjs` **345 ⇒ 425**（实读；+腿 8–11；既有腿随动收正——别名集 + `/h` ∥ `/help` 条 ∥ `slash.unknown` 新值） | 全批 |

零触面：`renderer/composer-wire.mjs` ∥ `renderer/composer-sync.mjs` ∥ `renderer/app.mjs` ∥ `index.html` ∥ `docs/desktop/design/IPC.md`（**零新通道**）∥ CLI 全树 ∥ VSC 全树 ∥ `thincoder-core`。

**余量**：零（§6.1 域行 ∥ §7 用例行 ∥ §10 上抛行 已随切片 4（终篇）迁入——见 §4/§5/§6）；`i18n-composer.mjs`（跨域词面——留 `PROJECT.md` §4.1）。

## 4. 验收回指（需求卷条目 → 本域面 · 判据全文——迁自 `PROJECT.md` §6.1 本域行 · as-of 2026-10-02）

| 需求 | 机检判据（点回需求卷） | 验证面 |
|---|---|---|
| **D6** | provider → 模型两级选择生效；档位与 effort 菜单回执与槽值一致（批 9 落：`model:list` 候选集 = 核 `listModels` 投影 · `settings:agent` 写入后回读同值——用例面 = 随批单元证据）；**批 B 落**：三值入槽（`session:prefs` ⇒ 槽往返不丢 · 改一处不波及他会话 · 在飞拒 `busy` 零写）+ 档位枚举化（设置面 `select` = 全局默认 ∥ 输入区控件行 = 会话级；候选 = `model:list` 逐模型元素投影（`effortEnum` + `thinkOff`——off 在场判据）+ `provider:list`；表外档位字面串 ⇒ 归一 `null`（未设）——本档 §1 **KD-17 / KD-18 / KD-19**）；**批 B · ⑥（档位控件设计修订轮）**：设置面现值 = `provider:list` 行投影 `effort`（离线）· 表外现值自成一选项 · `defaultModel` 缺 / 模型段空 ⇒ 控件零节点 · 写面 = 意图级载荷 `{ tier }`（`bad-level` / `unknown-provider` 两码零写）——单源 = `docs/desktop/design/IPC.md` §2「档位控件注」；**对齐第三批**：agent 段具名控件 + 即改即存 + 三控型（类型加工）——`docs/desktop/design/SETTINGS.md` §2.3 ∥ §2.4（P14 ∥ P15 ∥ F-Esc）；**模型菜单全渠批**：一级 provider 行 = 全渠（有 key ∧ 探通 ⇒ 行 ∕ 探不通 ⇒ 零行 + `unavailable` ∕ 零 key ⇒ 零行——判据全式 = `docs/desktop/design/IPC.md` §2「模型清单注」）+ 行序 = 配置序 + 失败渠零行 + 会话切换 ⇒ 模型钮随会话（缓存重推——零取数）——单源 = `docs/desktop/design/SETTINGS.md` §1 **KD-44–KD-46** | T-DSK7 / T-DSK28 / T-DSK31 / **R1–R7**（本批真机条目） |
| **D13** | 附件随 `msg:send` 载荷 `images` 维度发出一（贴图 / 粘贴 ⇒ 附件条在场 · 空 ⇒ 零节点）；非视觉模型 ⇒ 回执携 `degraded` 且提示行在场（不静默丢图）；**对齐第三批**：非栅格**粘贴即拒**（栅格四型之外不入条 + `paste.unsupportedFormat` 提示行——本档 §2（对齐第三批 · B22））；**代码块复制（2026-09-29 收正）= 核件 Copy 钮唯一**（`pre.code-block` 内 `.code-copy-btn`——自建两控件退场；单源 = `docs/desktop/design/CHAT.md` §2（复制面对齐 VSC 批注项 2）） | T-DSK30 |
| **D25** | 忙态提交 ⇒ 按会话键入队（回执 `queued`）+ 步边界取批注入（`consumeQueuedInput`——`pushReal` 不中断 · 下一步生效）+ 回合尾续发兜底；队列 = 宿主单源 + `pending` 镜面（快照 `ev:queue`）；附件条目携图（步边界让位 · 送达面判决）——单源 = 本档 §1 **KD-40** ∕ 本档 §2（回合中插入批注）；机检 ∕ 真机面 = 本档 §4（回合中插入批块 ∥ 窗队列批块）（携图受理 ∕ 送达面判决 ∕ `degraded` 浮出） | T-DSK45 · T-DSK48 + 本批注机检面 |

**跨档／存量条目（本域半边）**：**D22** 三值居所 = 输入区控件行（主条 = `docs/desktop/design/PROJECT.md` §6.1 **D22** 行（UI 域）；本域半边 = 本档 §2 控件行）· **需求 §3.5 项 6**（档位枚举——单源 = `docs/desktop/design/IPC.md` §2「档位控件注」）· **#543**（用户输入零丢失——KD-52 ②③；真机 = 撞帽询问待答期 ∥ 队满（8 条）——补遗轮 #91 在册）· **D14 族**（输入面板 = 核件工厂（KD-21）；真机走查（父侧闭合——D16 义务））。

（§6.1 本域行全三条已迁讫；跨档／存量条目列上。）

**回合中插入批（验收面 · 2026-09-28 · 全文迁入）**：需求回指 = **D25**「回合中插入（步边界 pickup）」（已落——`docs/desktop/requirements/PROJECT.md:162` / `:237`）；设计单源 = 本档 §1 **KD-40** ∕ 本档 §2（回合中插入批注）；**自铸披露 = 批档 §5**；
机检面 = **midturn 用例族 U217–U226**（U216 空位不回收）——拆分档 **`thincoder-desktop/test/agent-host-queued.test.mjs`**（U217–U219 · U221–U223 · U226——在飞入队 ∕ 步边界取批 ∕ 续发链 ∕ 中止清队 ∕ 缝缺席负向锁 ∕ 中止墓碑三查位；原址 `thincoder-desktop/test/agent-host.test.mjs` 触 500 硬限 ⇒ 在册预案「门面用例拆出 + 装配假面 harness 共享」本批落形；
  假面共享档 = `agent-host-harness.mjs`）+ `thincoder-desktop/test/agent-host.test.mjs`（U224 / U225——中止墓碑消费面两例）+ **新档 `thincoder-desktop/test/queued-input.test.mjs`**（U214–U215——计划面平 node 直测 + 与 CLI 副本值对拍）+
  `thincoder-desktop/test/events-reduce.test.mjs`（**U220**——`ev:queue` 归约两形）+ `thincoder-desktop/test/store.test.mjs`（队列切片锁随动）；
真机面 = **T-DSK45**（集成域新档——真 Electron：忙态发两条 ⇒ 首条步边界注入可见 + 气泡交接 + 段 14 读数；D16 义务）；测试档随修随加——不占设计条目（2026-09-27 裁定）。

**窗队列 VSC 逐点对齐批（验收面 · 2026-09-29 · 全文迁入）**：需求回指 = **D25**（本批 = 挂起窗径携图 ∕ 受理同形 ∕ 消费恰一枚三面同判——需求卷 `docs/desktop/requirements/COMPOSER.md`）；设计单源 = `docs/desktop/design/ACTIVITY.md` §1 **KD-34**（载具层携图）∥ 本档 §2（窗队列 VSC 逐点对齐批注）（含判据项 5）；
机检面 = 随批单元证据（**批档本地用例随批留存**——载体 = `docs/batches/2026-09-29-desktop-window-queue-parity.test.mjs`（T1–T9） · 不入仓套件；全清令：仓套件不写 ∕ 不改 ∕ 不跑）；
真机面 = **T-DSK48**（窗内携图提交 ⇒ 受理回执 ∧ 待发送带在场；消费 ⇒ 恰一枚入流 + 图随回合送达 + `degraded` 浮出）+ **核件 ∕ VSC ∕ `thincoder-render-core` 零改**（结构性判据）；**离线不可产面**（真 provider 回合 ⇒ 附件送达判决）= 人工走查 + 父侧真跑闭合（D16 义务）；测试档随修随加——不占设计条目（2026-09-27 裁定）。

**斜径命令面批（验收面 · 2026-10-01 · 台账 #761 · 全文迁入）**：需求回指 = **D34**（斜杠命令族——行为标杆 = CLI 实形；本批 5 条 + 别名 3）；设计单源 = 批档 `docs/batches/2026-10-01-desktop-slash-commands.md` §2 ∥ `docs/render-core/design/RENDER-CORE.md` §2 **KD-RC-12** ∥ §5 条 6 ∥ 本档 §2（slash 命令面批注）；
机检面 = 批内件 `docs/batches/2026-10-01-desktop-slash-commands.test.mjs`（**已建成 · 425 行 · 18 例全绿**——腿 1–9（含腿 6A–6J 面板拦截假 DOM 实跑）；随批留存 · 不进仓套件）；
真机面 = **T-DSK56**（真 Electron：`/model` 开菜单 ∥ `/help` 流内打印 ∥ 回落 toast + 文本保留）；**离线不可产面**（真交互 ∥ 真菜单 ∥ 真 provider 回合）= 人工走查 + 父侧真跑闭合（**D16 义务**）；测试档随修随加——不占设计条目（2026-09-27 裁定）。

## 5. 用例（本域 · 全文迁自 `PROJECT.md` §7 涉行 · as-of 2026-10-02）

| 用例 | 场景 | 输入 | 预期输出 | 机检面 / 落点 |
|---|---|---|---|---|
| T-DSK7 | 正常 · 模型与档位 | 改 provider → 改模型 → 改推理档位 | 输入区控件行三值更新（渠道 → 模型两级选择 · 档位列表随模型）；切会话再切回仍为该会话值（槽往返不丢） | — |
| T-DSK22 | 正常 · 输入区与中断 | 在活动会话输入文本 → Enter；另一例 Shift+Enter；另一例回合在飞时 Enter；另一例回合错误后再 Enter | Enter ⇒ 发出一条消息并清空输入区；Shift+Enter ⇒ 只换行不发；忙态 ⇒ 该文本**入宿主队**（回执 `{ ok: true, queued: true }`；**可见面 = 输入区上方待发送带**——非流内）且输入区清空；**消费两时刻 = 步边界注入 ∕ 回合尾续发**（注入径 = 普通 user 消息落历史 · 不中断 · 下一步生效；**取文本面 = 条目 `text` 逐字原样**——零显示串副本 / 零第二字段；`queue-full` ∥ 消费失败 ∥ 抛 ⇒ 留队 + `console.error`〔可见面 = 待发送带留场〕）——单源 = 本档 §1 **KD-40**；发送失败 ⇒ 文本保留 + `console.error`；错误终局 ⇒ 本键 `running` 清 + 位落 `done`；**可见面修复批修（#458）**：直发 ∥ 队列消费回执 `ok` 真 ⇒ 该条作为用户块入流（**尾块 = 本回合首个块** · 文本逐字）；失败 ⇒ 零块（原判据不动） | — |
| T-DSK23 | 边界 · 队列上限 | 连续在飞态下投满条数 > `QUEUE_MAX` | 达上限后提示行落地且**该条不入队**（回执 `queue-full`；队长不增、输入文本保留）；提示词出自词表键；**消费失败 ∕ 续发失败 ⇒ 该条留队**（队长不降 + `console.error`——零静默丢条） | — |
| T-DSK28 | 边界 · 会话级偏好隔离 | 两会话（A 活动 / B 非活动）各改 provider / 模型 / 档位（含 `off` 与 `Auto` 各一例；另例：不可 `off` 模型——off 选项缺席）；另例：B 回合在飞时提交；另例：提交表外档位字面串；另例：只送 `provider`（不携 `model`）；另例：槽不可读 / 键不合法 | ① 各值只落本槽（`session:prefs` 回执 `meta` ⇒ 就地刷本行 · 不整页重挂 · 零乐观写）；② 切标签回读 = 各自槽值（互不波及）；③ 改 A 不改 B（B 只写盘——内存态不动）；④ 在飞 ⇒ 拒 `busy` · 槽不可读 ⇒ 拒 `slot-missing` · 键不合法 ⇒ 拒 `bad-key`——三径皆**零写**且失败缺 `meta` 键；⑤ 表外档位字面串 ⇒ 归一 `null`（未设——原非 `null` 亦置 `null`）、其余键照改；⑥ 槽往返不丢（`effort` 随 `saveSession` 落盘；老槽无键 ⇒ `null` 容忍 · 零回填）；⑦ 只送 `provider` ⇒ 拒 `model-required` 且**零写**（模型候选随动 = T-DSK7） | — |
| T-DSK48 | 正常 · 挂起窗队列携图（D25 续） | 真 Electron：① 挂起窗在场时输入区提交文本 + 附件 ② 窗落定消费后观察入流与送达 ③ 另例换非视觉模型 | ① 回执 `{ ok: true, queued: true }` ∧ 待发送带 `[data-pending-item][data-raw]` = 提交文本逐字 ∧ 流内零块（`data-blocks` 不变）∧ 图不入快照 ② 消费 ⇒ 带项退场 ∧ 流内**恰一枚**用户块 ∧ 图随回合送达（落盘 + 指针段） ③ 降级码 `"non-vision"` 随消费回执 `delivered.degraded` 浮出（零静默）；核件 ∕ VSC ∕ `thincoder-render-core` 零改（结构性判据） | 机检面 = 随批单元证据（**批档本地用例随批留存**——载体 = `docs/batches/2026-09-29-desktop-window-queue-parity.test.mjs`（T1–T9） · 不入仓套件；全清令：仓套件不写 ∕ 不改 ∕ 不跑）；真机面 = 父侧真跑闭合（D16 义务）；用例号自铸披露 = `docs/desktop/design/PROJECT.md` §10 **BX**（留原址） |
| T-DSK56 | 正常 / 边界 · 斜径命令面（D34 · 真 Electron） | 真 Electron：① 提交 `/model`（另例别名 `/m`）；② 提交 `/help`（另例别名 `/h`）；③ 提交未知命令 `/nope`；④ 携参 `/model x`；⑤ 忙态 `/model` ∥ `/plan` | ① 模型菜单开出（与模型钮**同一菜单同一门**——`.mm-overlay` 在场）∧ 输入框清空 ∧ 零消息上行（零 user 块）∧ `↑` 可召回；② 流内帮助行族 `[data-help]` 在场（三段形：标签 ∥ 组行 ∥ 命令行——内容 = 端表本体经核 `formatHelp`）∧ 回底；重开会话 ⇒ 行族失（运行期痕五清——负判）；③ 回落 = toast「未知命令：/nope」+ 提交文本保留（不发送）；④ 携参 ⇒ `slash.args` 拒 + 文本保留；⑤ 忙态 `/model` ⇒ `slash.busy` 拒（文本保留），忙态 `/plan` ⇒ 钮态翻转（同钮门） | 机检面 = 批内件 `docs/batches/2026-10-01-desktop-slash-commands.test.mjs`（**已建成 · 425 行 · 18 例全绿**——腿 6A–6J 假 DOM 拦截面）；真机面 = 父侧真跑闭合（**D16 义务**）；用例号自铸披露 = `docs/desktop/design/PROJECT.md` §10 **DF**（留原址） |

（本域用例全文迁讫（T-DSK7 ∥ 22 ∥ 23 ∥ 28 ∥ 48 ∥ 56）；T-DSK30 ∥ T-DSK43（附件 ∥ 复制 ∥ Esc 混装）∥ T-DSK16（守卫）与 T-DSK32（夹具先例）为跨域 ∕ 他档条目，留 `docs/desktop/design/PROJECT.md` §7 原址。批内件（单元测试档）随批次档留存。）

## 6. 上抛（本域 · 迁自 `PROJECT.md` §10 涉行 · as-of 2026-10-02）

| 行 | 项 | 类型 | 处置建议 |
|---|---|---|---|
| **AZ** | 核件消费面两处不消费登记：`queued-mark` 的 `planBusyQueued`（宿主快照对账面 = VSC 专有）/ `clearPending`（桌面交接 = 节点换代，非原地清标）· 核 **effects 表不逐条执行**（端面动作由模型态幂等派生——`connectedOf` / `regionOf` 由模型字段供给） | 登记（非缺口） | 单源 = `docs/desktop/design/UI.md` §1「本批注（对齐第二批 · 六件）」项 2 / 5；如判须逐条执行 ⇒ 另裁 |
| **BM** | 排队面三边界登记：① 队条目携图 = 宿主内存（`dataURL` 原样——与渲染面提交前同量级）· ② 气泡显示文本（图不入快照 ∕ 不回传渲染面——两端同形）· ③ 队列 = 运行期切片（重启即失；与 BA 行同族） | **保留零动**（已裁——端差清算批 · 2026-09-29：非缺陷） | 由 = **零用户可见差**——两端送达结果同（路径 + `[Attached images: …]` 指针 + `read_image`）；两端队列皆运行期内存（重启即失）；差仅 = 写盘时机（端实现形态）+ VSC 形另携入队期孤儿文件面。消解路维持（触发条件 = 用户裁定 ∥ 内存面实测越线 ⇒ 另批；届批成本 = 队条目改路径条目 + 队清 ∕ 中止清理面扩） |
| **BB** | 桌面 turn-cap 续跑（R3 ∕ #505 已落）：用户回合撞帽 ⇒ 「继续？」询问（复用既有待决门）⇒ 同意 ⇒ 换代 controller + `resume:true` 重入（不重推用户消息）∕ 拒 ⇒ `stopped`；`autoTurn`（消化 ∕ 上行 ∕ timer 轮）⇒ cap 即收口（零自续） | **已落**（R3——2026-09-29） | 承载 = `thincoder-desktop/src/main/turn-face.mjs`（撞帽三径）+ `thincoder-desktop/src/main/turn-driver.mjs`（换代重入）；待答期 ↑Ctrl+I 携消息 ⇒ 入队 + 回合判 `stopped`（**#543 已落**——2026-09-29 补遗轮；**队满限定 = 零入队 + 零中止 + 可见形**——本档 §1 **KD-52** ②③）；单源 = `docs/core/requirements/TURN-CAP-CONTINUE.md` |

（上列三行全文已齐平；余（BX ∥ DF 等自铸披露）留 `docs/desktop/design/PROJECT.md` §10 原址。）

## 变更记录

- 2026-10-02：**建档（波 2a · 渲染族迁移）**——自 `docs/desktop/design/PROJECT.md` §2 迁入 **KD-17 ∥ KD-18 ∥ KD-19 ∥ KD-21 ∥ KD-31 ∥ KD-40 ∥ KD-51 ∥ KD-52**（八行逐字；原址各留一行指针）+ 自 `docs/desktop/design/UI.md` §1 迁入本域批注块（回合中插入注 ∥ 挂起窗径注 ∥ 窗队列 VSC 逐点对齐注 ∥ @ 文件引用注 ∥ 斜径命令面注 ∥ 对齐第三批 B22/B26/B28——逐字；原址各留一行指针）+ §6 上抛三行（AZ ∥ BM ∥ BB）。**余量未迁**（KD-25 ∥ KD-30 涉句 ∥ §3 族行 ∥ §4.2 批块 ∥ §4/§5/§6 余行）——随「2c 前置步 · 文件账分片轮」承接（本批 §2 记录在册）。零新语义（搬迁 ∥ 值收正）。
- 2026-10-02（**波 2a 补轮 · eng-designer**）：**行宽回线**——本档 8 条超 300 字符行按语义边界折行（∥ 分隔处 ∥ 句读处）；零语义改。
- 2026-10-02（**文档体系重组批（DOC-MIGRATION）· 2c 前置步 · 文件账分片轮（续 · #35）· eng-designer**——承批档 `docs/batches/2026-10-02-doc-structure-reorg.md` §2 · 台账 #813）：**§3.1 新立**（本域族行 **11** 行——自 `PROJECT.md` §4.1 逐字迁入；原址各改一行指针）∥ **§3.2 新立**：批块 **4 块**（挂起窗径批 ∥ 窗队列批 ∥ 队列取项边缘收正批 ∥ slash 命令批 + `/help` 增量——迁自 §4.2；块内「本档」类回指按新落点改指；三处块头超宽行当场折行 ≤300）。**零新语义**（迁移 ∥ 指针）。
- 2026-10-02（**文档体系重组批（DOC-MIGRATION）· 2c 前置步 · 文件账分片轮（切片 4 · 终篇）· eng-designer**——承批档 `docs/batches/2026-10-02-doc-structure-reorg.md` §2 · 台账 #813）：**§4/§5/§6 域行全文迁讫**——§4 收 D6 ∥ D13 ∥ D25 三行全文 + 批块三（回合中插入批 ∥ 窗队列 VSC 逐点对齐批 ∥ 斜径命令面批——迁自 `docs/desktop/design/PROJECT.md` §6.1；原址各改一行指针）+ 跨档／存量条目列 ∥ §5 收 T-DSK7 ∥ 22 ∥ 23 ∥ 28 ∥ 48 ∥ 56 六行全文（迁自 §7）∥ §6 收 AZ ∥ BM ∥ BB 三行全文齐平（迁自 §10）。**零新语义**（迁移 ∥ 指针）。
- 2026-10-02（**文档体系重组批（DOC-MIGRATION）· 波 3 · 终扫轮 · eng-designer**——承批档 `docs/batches/2026-10-02-doc-structure-reorg.md` §2 · 台账 #813）：需求侧活面指针收正（需求分卷后形态——「需求档 §4」类表述 ⇒「需求卷」（查卷口 = `docs/desktop/requirements/PROJECT.md` §4 **D 表索引**））；记录面 ∥ as-of 零追改。**零新语义**（指针）。
- 2026-10-03（**首跑渠道提示修复批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-03-desktop-firstrun-provider-notice.md` §2 · 台账 #840）：§2 增本批注（`provider-invalid` 词面真因化——`providerKind` 分类 → `composer.send.noDefaultModel` + 动作钮 `composer.send.chooseModel` ⇒ `openModelMenu`；槽复验链）；**产品码零触（设计轮）**。明细 = 批档 §2。
- 2026-10-03（**无效渠道态逻辑归一（provider-invalid-unify）批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-03-provider-invalid-unify.md` §2 · 台账 #841）：§2 增本批注（fallback 态明示行——`providerState` 载荷 ∥ 复用 #840 键与钮 ∥ 行序与清位）；**产品码零触（设计轮）**。机制单源 = `docs/core/design/PROVIDER.md` §6.22。
- 2026-10-03（**首跑渠道提示修复批 · 修正轮 #7（用户 13:43 更正——13:09 口径系拼音误打）· eng-designer**——承批档 `docs/batches/2026-10-03-desktop-firstrun-provider-notice.md` §2 更正块 · 台账 #840）：本批注收正为**词面-only** 终形（`composer.send.noDefaultModel`——状态陈述）；动作面（`composer.send.chooseModel` ∥ handler ∥ 样式规则）作废；同笔收净 #841 明示行批注之同源引用（父侧「四档全域」裁）。**产品码零触（修正轮）**。明细 = 批档 §2 更正块。
- 2026-10-03（**首跑渠道提示修复批 · 实施后文档面回填轮（§3.1 两行走读齐平）· eng-designer**——承批档 `docs/batches/2026-10-03-desktop-firstrun-provider-notice.md` §2 ∥ §5 · 台账 #840）：§3.1 两行实读对盘（`composer-wire.mjs` **262 ⇒ 266**——失败载体 `{ reason, kind }` ∥ `composer-sync.mjs` **302 ⇒ 306**——类路由（词面-only））；越层在册句随正（续期——引 `docs/desktop/design/PROJECT.md` §4.1 越层段）。**零新语义**（读数）。明细 = 批档 §5。
- 2026-10-03（**无效渠道态逻辑归一（provider-invalid-unify）批 · 实施后回填轮 · eng-designer**——承批档 `docs/batches/2026-10-03-provider-invalid-unify.md` §2 ∥ §5 · 台账 #841）：本批注两项收正——行面补**行锚 `data-notice="provider-fallback"`**（机检面）；第三刷新点收窄为**实落写点三处**（`thincoder-desktop/src/main/settings.mjs:230` ∥ `:330` ∥ `providers.mjs:181`——设计按盘回归；不取 `ask()` 边界形：盘上无该机制）；§3.1 三行走读齐平（`mount-composer` **297 ⇒ 299**（贴 300 层在册）∥ `composer-wire` **266 ⇒ 276** ∥ `composer-sync` **306 ⇒ 322**）。**零新语义**（读数 ∥ 坐标）。明细 = 批档 §2 回填轮块。
- 2026-10-03（**无效渠道态逻辑归一（provider-invalid-unify）批 · 修正轮 #9（评审轮 1 · 发现 4 ∥ 7）· eng-designer**——承批档 §3 轮次 1 · 台账 #841）：本批注收正——数据面载荷补 `invalidReason`（合成式可算）∥ 行面判据改 **`fallback` ∧ 非 invalid 类**（合成式单源 = `doc:PROVIDER.md:§6.22`）∥ 清位补**第三刷新点**（设置写回执——`settings:agent` ∥ `provider:save` 成功回执携 `providerState` ⇒ 即时退场）。**产品码零触（修正轮）**。