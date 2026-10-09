# 2026-10-10 · desktop-behavior-residues
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-10 · 来源 = 用户 2026-10-10 03:49「不认自设条件——等条件的一起拿出来清理」+ 清账二遍 = 桌面行为面 9 条（#805 ∥ #809 ∥ #831 ∥ #912 ∥ #914 ∥ #979 ∥ #1039 ∥ #1041 ∥ #1071）。
> 台账 = #805（desktop · 归批）。前情 = docs/batches/2026-10-10-ledger-full-triage.md（已收口 2026-10-10 · 清账二遍）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-10
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**状态行**：🔄 进行中（设计轮已发）

**直令**：用户 2026-10-10 03:49「不认自设条件——等条件的一起拿出来清理」——本批 = 清账二遍·桌面行为面；授权 = 会话全自动沿用。

**条目（9）**：
- `#805`：重启通道可靠性——「全链真测 ∥ 或退役」裁定 + 执行（拉起腿/单实例锁/端口残留/schtasks 255）。
- `#809`：slash `/help` 标签加粗违 D29——`thincoder-desktop/renderer/chat-fixes.css:50` `font-weight: 600` ⇒ 400 + 既有色位承担强调。
- `#831`：桌面 `ledgerRead` 错冒泡——实测呈现 + 捕获/提示 ∥ 明收诚实拒。
- `#912`：挂起窗零帧漏点（`src/main/suspension-drive.mjs:173-204 ∥ :245`）——可达性实证 ∥ 防御修。
- `#914`：合帧窗视口补偿（`renderer/app.mjs:191` 读门）——封口候选二式择一。
- `#979`：弹窗跨路由留驻（`modal.mjs` `closeActiveModal()` + `route()` 起点调用）。
- `#1039`：粘顶头 a11y（`settings.css:53` 粘顶块——`scroll-padding-top` 缺位）。
- `#1041`：首启板 custom 径 key 被弃（`webview/onboarding.js:56-64`）——交棒预填 ∥ 先分支后校验。
- `#1071`：M604 件覆盖缺口 2 腿（nth 消歧 ∥ 跨形切换——`docs/batches/2026-09-29-desktop-rebuild-fidelity-M604.test.mjs`）。

**边界**：桌面 `renderer/**` ∥ `src/main/**` ∥ `webview/**` ∥ chat-fixes.css + 上列测试件；不触他批落点（`#1167` VSC `specs.mjs` ∥ 七簇在飞面）。

**授权口径**：会话全自动（03:07「全自动」+ 03:49 清账二遍令）——设计 → 评审（用户点火）→ 批准 → 实施。

**父裁（2026-10-10）**：① `#805` 裁定 = **退役** ✓（杀宿主不可自证 + 任务 255 事实 + 手动路径已文档化——执行三步按 §2；不重开「真测」）；② 伴生面（重启三步纪律卡 ∥ 手册句随正）= 随实施臂同拍；③ `#1071` 两腿 = 父侧笔（跨批门禁——落讫入 §6）；④ §1 边界句枚举不全（server/VSC 两档坐标随正 + temp/计划任务）——按设计执行，本行随正；⑤ 仓根四份 `desktop-test*.log` = 已删（父侧 · 工程工具面）；⑥ M604 件 >500 延续 = #1060 父裁在册 ✓。

**父裁（2026-10-10 · 评审 #72 changes-required 回执）**：🔴1 ∥ 🟡7 ∥ 🔵6 逐条——F1（#912 链尾帧使 `docs/batches/2026-09-29-desktop-window-queue-parity.test.mjs:228` 恰四帧整序断言变红）⇒ **取收窄案**：链尾帧只落弃件径（墓碑出口 ∥ `!stillHeld` 断点 `suspension-drive.mjs:211-215`），全消费径零增帧 ⇒ T5 序不变、零跨批改；若收窄案不可行（须写明理由）⇒ 改落「表 16 增 T5 断言更新行（跨批件 · 父侧笔类；编号 = F3 重编号后）」并对齐六帧口径 ∥ 🟡 F2..F8（A1 扫描集 ∥ `turn-driver.mjs:143` 入表 ∥ 读/写门称法 ∥ 七腿⇒八腿 ∥ 表 16 行数 ⇒ delta ∥ 复跑清单四件 ∥ 协调项维持）逐条收正 ∥ 🔵 F9..F14 随正或「维持」。**修复轮 = eng-designer #83**（fix）；报告回后复评（round 2）。

**父侧代办（2026-10-10 · #1071 两腿落讫）**：① M604 件 `:271` 缺口注收正：「两形同刷矩阵 —— 登记；nth 消歧 ∥ 跨形切换 —— 已补腿，2026-10-10 #1071」（父侧笔）；② 两腿实落 = `M-604a·nth 消歧（同标记键双例并存）`（绿）∥ `M-604a·跨形切换折返`——**实测发现**：设计原断「键入值经第二闸往返保真」与实读相抵（折返后 `'' !== 'draft-name'`——值不跨形携带）；**父裁**：沿本件 `M-604b·作用域锁` 判例（身份换 ⇒ 键不达 ⟺ 旧草稿零回写）判「**换形净起步**」为正确语义 ⇒ 腿按**负向锁**落；设计措辞收正 = 修轮 **#98**（若相反裁定 ⇒ 产品缺陷另立）；③ 实读：`node --test docs/batches/2026-09-29-desktop-rebuild-fidelity-M604.test.mjs` = **10/10 绿**（496.8ms）；④ parity 件 `:9 ∥ :75` 标题族「五帧 ⇒ 六帧」已落（父侧笔）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（九条逐条在册（§2.1）；关键裁定 9 条（§2.2）；受影响文件 24 行（§2.3）；#1071 两腿 + 标题族 = 父侧笔；产品码与设计档本轮零写；修正轮（评审 #72）逐号收正——F1 取收窄案；#1071 书面对齐实读——换形净起步收正（修轮））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**§2 批次任务与设计（eng-designer · 2026-10-10 · 设计轮）**

**来源** = 本档 §1（主 agent 讨论轮 ∥ 用户点名）+ 台账九行（#805 ∥ #809 ∥ #831 ∥ #912 ∥ #914 ∥ #979 ∥ #1039 ∥ #1041 ∥ #1071）。**写域（本轮）= 本 §2**——产品码 ∥ 设计档本轮零写（纯设计轮；设计档随动载荷见 §2.3，实施轮落）。
**坐标口径** = `file:line` 设计轮现读（2026-10-10）；行数 = 内容行数（`split("\n").length − 1`）。
**点读回执（九条全现读 · 与 §1 旧记差异逐处）**：#809 落点 = `chat-fixes.css:46`（§1 旧记 `:50` —— 现读值以此为准）；#831 = `project-info.mjs:39`（`ledgerRead`，无 try/catch）∥ 核抛点 = `thincoder-core/ledger-db.mjs:151`（稳定锚句「项目不可解析」）；#912 = `suspension-drive.mjs:200-231`（`resumeResidual`）∥ `window-queue.mjs:77`（`drain`，零帧）∥ `:91-97`（`clear`，非空才发帧）；#914 = `app.mjs:192`（读门 `sealFrame`）∥ `:199`（写门——ΔH）∥ `:197-199`（补偿算式 `compensateTop`）∥ 受理点 = `session-wire.mjs:86-92` ∥ 帧件 = `thincoder-render-core/flow/frame.mjs`（`flush` = 同步 `fire`）；#979 = `public/modal.mjs`（**无 `closeActiveModal` 导出**）∥ `public/app.mjs:132`（`route()` 起点）；#1039 = `settings.css:13-25`（滚动层）∥ `:44-58`（粘顶块）∥ `settings-modal.css:16-34`（滚动层）∥ `:38-43`（粘顶块）——两滚动层皆无 `scroll-padding-top`（全仓零命中）；#1041 = `webview/onboarding.js:55-68`（key 校验早于 custom 分支 ⇒ 交棒丢键）∥ `settings-provider-dialog.js:179-191`（开框重置清 `#pa-key`）；#1071 = M604 件 **526** 行（8 例）+ 缺口注 `:271`；#805 = `.thincoder/tmp/restart-desktop.cmd`（22 行）∥ 计划任务 `\thincoder-restart`（上次结果 **255** · 就绪/启用）。

### 2.1 逐条落地表（九条 · 动作 ∥ 落点 ∥ 期望 ∥ 机检法）

| # | 台账 | 动作（设计裁定 + 落点） | 期望 | 机检法 |
|---|---|---|---|---|
| 1 | #809 | D29 逃逸收口：`thincoder-desktop/renderer/chat-fixes.css:46` 规则 `.chat-help .help-label` ⇒ `font-weight: 400; color: var(--accent);`——强调改**色位通道**（沿 D29「说话人标签 ∥ 工具名 = accent」既有先例；`:43-44` 注句「标签加重」⇒「标签 accent」随正）。根因 = `/help` 面（2026-10-01）设计于 D29（2026-09-30）扫描之后 ⇒ 600 未入清册 | 桌面 CSS 零 `font-weight > 400`（D29 ② 面全绿）；帮助三层不失：标签 = `--accent` ∥ 组行 = `--fg-muted` ∥ 命令行 = `--fg` | 批内件 A1（桌面 CSS 全扫——扫描集 = `renderer/` 全 13 档〔`theme ∥ chrome ∥ session-list ∥ skin ∥ chat ∥ chat-cards ∥ chat-composer ∥ chat-fixes ∥ core-markdown ∥ core ∥ pool ∥ settings ∥ settings-modal`〕**减豁免两核档**（`core-markdown.css` ∥ `core.css`——markdown 修饰层语义保留（`UI.md:406-407`）；两档现读命中均修饰层：`core-markdown.css:35-40 ∥ :147 ∥ :162` ∥ `core.css:72`）⇒ **扫 11 档**；判据 = 扫面 `font-weight` 值 ∈ {500,600,700} 零命中——**修前红恰一处 = `chat-fixes.css:46`（600）**，修后绿）+ A2（`.help-label` 规则含 `400` ∧ `var(--accent)`；`--accent` 在册 = `renderer/theme.css:15`）+ 真机 CDP：`/help` ⇒ 标签行 computed `font-weight: 400` + 色 = accent 值 |
| 2 | #831 | **明收诚实拒**（产品语义零改）：歧义 cwd ⇒ 核 `buildScan` 抛「项目不可解析」（`ledger-db.mjs:151`）经 `project-info.mjs:39` `ledgerRead` 直传 IPC 拒绝。**捕获/提示支被否**——渲染面零消费（`IPC.md:307` 复核收正批「项目级读数两通道渲染面零消费」）⇒ 加捕获 = 无消费的死面；且「直传拒绝」= 本仓既有纪律（沿 `approval:respond`「未装配 ⇒ fail-loud 直传拒绝」先例）。落点 = `project-info.mjs` 档头注 +2 行（诚实拒在案）+ 设计档 `IPC.md:304 ∥ :307` 行注 | 拒绝面 = 稳定锚句「项目不可解析」（fail-loud；零静默 0 值）；文档在案；未来消费面拿到真因 | 批内件 B（平 node 直调 `ledgerRead`：歧义夹具 ⇒ 拒 ∧ 消息含锚句 ∥ 正常项目 ⇒ `ok` ∥ 无项目 ⇒ `{ok:false,reason:"no-project"}`；夹具沿 #828 件歧义锚构造）+ **实测呈现**（CDP：`window.thincoder.invoke("ledger:read",{cwd:"d:\\teamcode"})` ⇒ 拒绝读数落档） |
| 3 | #912 | 残值续发链**帧面收口**（防御修出案）：① `window-queue.mjs` 增定点 API `emitState(key)`（状态形 · 快照整置 · 幂等；= 内部 `emit` 的公开面，零第二帧构造）∥ ② `suspension-drive.mjs` `resumeResidual`（`:200-231`）**弃件径两出口**（墓碑 `return` 前 ∥ `!stillHeld` 断点 `:211-215`）各补一次**链尾状态帧**——弃余件零帧漏点消（倾出后未消费即弃 ⇒ 镜面亦恒收口）；**全消费正常径零增帧**（弃件径之外不出帧——逐条消费帧已收口）∥ ③ 诊断行计数收正（leg `!stillHeld`：`dropped = items.length`（取批后余量）⇒ **取批前余量**——含已取未达批）∥ ④ `clear` 零条零帧 = **保留**（无状态变更 ⇒ 零帧；非漏点——每次状态变更皆出帧 ⇒ 空 `pending` ⟺ 上帧快照已空）。**可达性披露**：中止落点在窄 await 窗（机制推证，未实证）——本修 = 防御性收口（成本 = 两行） | 镜面无幽灵：任意中止 ∥ 零起跑径收束后 `ev:queue` 终值 = 实况（`items` 整置为真）；弃余计数 = 全量；**全消费正常径零增帧**（`ev:queue` 序列与修前一致——他批件 T5 恰四帧整序保位） | 批内件 C（平 node `createSuspensionDrive` + 假注入（`postQueue` 记账）：**弃件径**——队列有件 ⇒ 关窗 ⇒ 倾出后墓碑 ⇒ 断言末帧 = 状态形 ∧ `items` 空 ∧ 弃余计数含取批；**全消费径 ⇒ 帧序零增**（与既有序列逐帧同——他批件 T5 恰四帧整序保位）；**红灯基线** = 修前同径「倾出后墓碑 ⇒ 零帧」）+ **枚举随动同拍**：`五帧 ⇒ 六帧`（口径：推点类 6 ∥ 物理站点 7——链尾状态帧类两站点 = 墓碑出口 ∥ `!stillHeld` 断点；逐处，见 §2.3） |
| 4 | #914 | 回填收束帧**受理点同步落帧**（封口式②）：`thincoder-desktop/renderer/app.mjs:268`（`onBackfill: backfill`）⇒ `onBackfill: () => { backfill(); frame.flush() }`——受理帧（`inFlight: true`）同步落账 ⇒ 随后回执帧成「上帧在飞 ∧ 本帧坍落 ∧ 非跟滚」收束帧 ⇒ `:192` 读门 ∥ `:199` 写门 ∥ `:197-199` 补偿算式**逐字零改**。**被否①**＝读门放宽为「帧含 `build` ∧ 非跟滚 ∧ ΔH≠0」：`build` 帧全族触发 ⇒ 尾部长高帧误补偿（读位下跳）；门语义从「回填收束」漂为「任意构建」。**被否②**＝改 `page-read` 回执侧：回执与受理同 tick ⇒ 合帧窗仍在（`frame.flush` = 既有 API，零新面） | 长会话触顶回填 ⇒ 视口零跳（摘 ∥ 插头部件后读区起点保持）；合帧窗下收束帧可判 | 批内件 D（真 `createFrameMerge`（`/rc/` 解析）+ 真 store 纯动作 rig：同一时序两臂——无 `flush` ⇒ 门不可达（红）∥ 有 `flush` ⇒ 门可达（绿））+ 真机条件腿（长会话（`hasOlder`）触顶 ⇒ 回填前后 `scrollTop` 与 `scrollHeight` 增量相符；现场无长会话 ⇒ 登记待读，沿「离线不可产面」先例） |
| 5 | #979 | 控制台弹窗路由收口：`thincoder-server/public/modal.mjs` 增导出 `closeActiveModal()`（幂等；无在场 ⇒ 零动作；内部 = 既有收口径单源，零第二关闭实现）∥ `public/app.mjs:132` `route()` 起点调用——退到弹窗所在页 ⇒ 弹窗必关（不再悬浮于已换内容之上）；覆盖面含 `rerender()`（语言切换）与 `boot()` 的 hashchange 径（同门） | 任意路由切换（hash 前进 ∥ 后退 ∥ 直改）后 DOM 零弹窗残留；`body` 面 ∥ 焦点回归常态 | 批内件 E（module 形：`closeActiveModal` 在导出集 ∥ 无在场幂等零抛）+ 真机浏览器走查（开弹窗 ⇒ 后退/前进 ⇒ 断言零弹窗 DOM + 新路由已渲；截图留档） |
| 6 | #1039 | 粘顶头 a11y 补 `scroll-padding-top`（**两滚动层同拍**）：`settings.css:13-25`（`[data-slot="settings"]`）∥ `settings-modal.css:16-34`（`.settings-modal`）各增 `scroll-padding-top: calc(var(--fs) * var(--lh) + 2 * var(--gap));`——头行 ≈27px（一行 18.2 + 内距 8 + 边 1）+ 余量 ≈15px（焦点环 ∥ 视觉留白）；沿 #819 ∥ #1030 粘顶批同形（两批定形头行，本笔补 a11y 面）。**被否**：仅键盘态补（`scroll-padding` 无媒体钩，不可判）∥ 头行改非粘顶（撤既有批语义） | 键盘 Tab ∥ 焦点滚入 ⇒ 目标件不被粘顶头遮挡（顶距 ≥ 头底）；鼠标滚动观感零变（**结构推证**：`scroll-padding` 只介入滚入对位、对滚动手势零介入——不设读数项） | 批内件 F（源面：两规则含 `scroll-padding-top` + 值形；`--gap` 在册 = `theme.css:20`）+ 真机（CDP：设置面 ∥ 组弹窗面各聚焦末位控件 ⇒ `focused.top ≥ head.bottom` 读数） |
| 7 | #1041 | 首启板 custom 交棒收口（两候选**同笔**）：① **分支前移**——custom 分支先于 key 校验（现 `:57-58` 前置校验挪至分支后）；弹窗键面 = 「键可选」（`settings.keyOptional`）⇒ 板面不再强制键 ∥ ② **交棒携 key 预填**——`onboarding.js:63` ⇒ `window._openAddProviderDialog?.({ key })`；`settings-provider-dialog.js:179` ⇒ `openAddProviderDialog({ key = "" } = {})`——开框重置序（`:184-188`）**之后**落预填（缺省 `{}` ⇒ 余两调用点（`input.js:35` ∥ `settings-providers.js:147`）行为零变）。只取①不取② = 键仍弃（用户仍须重输）⇒ 未收口 | custom 径：板面键入的 key 随交棒入框（零重输）；空键 ⇒ 照常交棒（框内可补——与「键可选」一致） | 批内件 G（happy-dom 真 webview 径：板面填键 + custom ⇒ 提交 ⇒ 断言弹窗 `#pa-key` 值 = 板面键（**修前红**：值为空）∥ 负向：无参开框 ⇒ `#pa-key` 空 ∥ 预设径零改）+ 真机（VSC webview 走查：custom 交棒 ⇒ 框内键在） |
| 8 | #1071 | M604 件两缺口腿补（**落讫 = 父侧笔**——子代理跨批写门禁在册（`write-gate.mjs:148-171`「cross-batch batch-record write」；先例 = residue-sweep #1059「原档拒写 ⇒ 父侧落讫」））：① **nth 消歧腿**——同标记键双例并存（页槽 ∥ 工具段弹窗体 `[data-key-input="embedding"]`）跨两轮重绘各保己值（`view-state.mjs` 捕获 `nth` 机制实证；单形化后无自然复现位）∥ ② **跨形切换腿**——M-604a 腿尾补折返断言（custom ⇒ preset ⇒ custom：跨形切换折返 = **换形净起步**（旧形草稿零回写——身份换 ⇒ 键不达，沿 `M-604b·作用域锁` 先例）；≈10 行）∥ 同笔：件头缺口注 `:271` 收正（缺口 2 ∥ 3 ⇒ 已补）+ `五帧` 族标题随 #912 收正（`2026-09-29-desktop-window-queue-parity.test.mjs:9 ∥ :75` ⇒ 「六帧」） | M604 件 8 ⇒ **10 例全绿**（缺口腿不再空档）；标题族与帧计数同拍 | 父侧跑 `node --test docs/batches/2026-09-29-desktop-rebuild-fidelity-M604.test.mjs` ⇒ **10/10**（跨形切换腿返回形 = 空值断言——「换形净起步」）；`…-window-queue-parity.test.mjs` ⇒ 全绿（标题族收正后） |
| 9 | #805 | **重启通道退役**（裁定 = 退役，见 §2.2 KD-3）：① 删 `.thincoder/tmp/restart-desktop.cmd`（temp 件；**先录后删**——22 行全文抄入本批 §5 执行记录）∥ ② 删计划任务 `\thincoder-restart`（`schtasks /delete /tn thincoder-restart /f`）∥ ③ 保留 `scripts/desktop-debug.cmd`（仓件——调试实例启动唯一入口）∥ ④ focus 探针族（`focus-probe` ∥ `focus-guard` ∥ `win-ctl`）留盘（通用可复用） | 计划任务零残留；temp 脚本零残留；单实例面保活并有读数；**拉起腿 ∥ 端口残留随退役消解**（台账 `#805` 四面逐项对勾） | `schtasks /query /tn thincoder-restart` ⇒ **找不到**（exit ≠ 0）；`Test-Path .thincoder/tmp/restart-desktop.cmd` ⇒ `False`；**单实例面实测** = `node_modules\.bin\electron.cmd . --smoke` ⇒ `{"lock":"secondary",…}` exit 0（活体持锁 ⇒ 第二实例**零新窗** ∥ **零弹框**（`--smoke` 径）；既有窗口唤起照旧——`second-instance` ⇒ `restore` ∥ `show` ∥ `focus`） |

### 2.2 关键裁定（KD-D1–KD-D9；被否候选随行）

- **KD-D1（#914 封口式）= ② 受理点补 `frame.flush()`**。理由：门语义保真（收束帧判据零改）∥ 补偿算式零改 ∥ `flush` = 既有 API ∥ 误触发面零（只多一帧）。被否 ①（读门放宽）——逐由见 2.1 行 4。
- **KD-D2（#912 修形）= 链尾状态帧（弃件径两出口：墓碑出口 ∥ `!stillHeld` 断点）+ 计数收正**；**全消费正常径零增帧**（逐条消费帧已收口 ⇒ 他批件 T5 恰四帧整序断言保位）；`drain` 本体 ∥ 签名零改（他批件 `…-window-queue-parity.test.mjs:97` 调用面保持）；`clear` 零条零帧保留（推理见 2.1 行 3）。被否：`drain` 内出帧（须改签名 ⇒ 破他批件既有调用）∥ 只补墓碑径（`!stillHeld` 径同漏——取批后弃件同需收口）∥ `start(...)` 前出帧（全消费径亦出 ⇒ 破 T5 恰四帧整序断言——`…-window-queue-parity.test.mjs:228`）。
- **KD-D3（#805）= 退役**。理由：① 唯一使用者 = agent 自身，宿主 = 桌面实例本身 ⇒ 使用即自杀，全链真测后无人可读回（结构性不可自证）；② 对口调查（假死 ∥ 焦点冻结）2026-10-01 已收口（`docs/batches/2026-10-01-desktop-focus-freeze.md:232` 事故与处置在册）；③ 通道现状 = 计划任务上次结果 **255**（失败在册）——留「看似可用」的失败通道 = 未来会话再次自杀的诱因；④ 手动路径可靠且已文档化（`scripts/desktop-debug.cmd`）。被否：全链真测（杀本会话 ∥ 读数无人补读）∥ 只修不测（残留失败通道）∥ 只删脚本留任务（任务指向缺失脚本 = 更坏）。
- **KD-D4（#831）= 明收诚实拒**（捕获/提示支被否——逐由见 2.1 行 2；「静默 0」= 既有缺陷类，回退它才是坑）。
- **KD-D5（#979）= `closeActiveModal()` 导出 + `route()` 起点调用**（单一收口门）。被否：仅在 hashchange 监听处关（`rerender()` 语言切换径漏）∥ 逐视图自关（N 处第二实现）。
- **KD-D6（#1041）= 交棒预填 + 分支前移（两候选同笔）**；只取一 = 未收口（逐由见 2.1 行 7）。
- **KD-D7（#809）= 色位 = `--accent`**（沿「说话人标签 ∥ 工具名 = accent」先例；零新色槽——D29 硬约束）。被否：`--fg` 直留（强调全失——标签与命令行同形）∥ 新色槽（违 D29）。
- **KD-D8（#1071）= 两腿落 M604 原档（父侧笔）+ 缺口注同笔收正**；不落本批件（腿面碎片化 = 缺陷）。被否：另建本批专属件 ∥ 本批 coder 直改他批件（写门禁拒——先例在册）。
- **KD-D9（#1039）= 两滚动层同值**（`calc(var(--fs) * var(--lh) + 2 * var(--gap))`）——头行同源（同一 `.settings-head` 规则族）⇒ 一个值两处。被否：逐层实测取不同值（两值无据）。

### 2.3 受影响文件表（现行 ⇒ 预期 · 内容行数 · 设计轮实读）

**产品码（实施轮）**

| # | 档 | 现行 ⇒ 预期 | 面 |
|---|---|---|---|
| 1 | `thincoder-desktop/renderer/chat-fixes.css` | 120 ⇒ ≈121（值改 + 注句随正） | #809 |
| 2 | `thincoder-desktop/renderer/settings.css` | 304 ⇒ ≈306（+`scroll-padding-top` 声明 ∥ 注释；**越 300 咨询线在册**） | #1039 |
| 3 | `thincoder-desktop/renderer/settings-modal.css` | 49 ⇒ ≈50 | #1039 |
| 4 | `thincoder-desktop/renderer/app.mjs` | 336 ⇒ ≈338（装配点包装 + 注） | #914 |
| 5 | `thincoder-desktop/src/main/window-queue.mjs` | 103 ⇒ ≈110（+`emitState` ∥ 档头帧枚举注「五帧 ⇒ 六帧」） | #912 |
| 6 | `thincoder-desktop/src/main/suspension-drive.mjs` | 335 ⇒ ≈340（**弃件径两出口**出帧 ∥ 计数捕获行 ∥ 注） | #912 |
| 7 | `thincoder-desktop/src/main/turn-driver.mjs` | 236 ⇒ 236（注句「五帧 ⇒ 六帧」——结构不变类） | #912 |
| 8 | `thincoder-desktop/src/main/project-info.mjs` | 169 ⇒ ≈171（档头注——诚实拒在案；**零行为改**） | #831 |
| 9 | `thincoder-vscode/webview/onboarding.js` | 82 ⇒ ≈86（分支前移 + 携参 + 注） | #1041 |
| 10 | `thincoder-vscode/webview/settings-provider-dialog.js` | 266 ⇒ ≈270（`openAddProviderDialog({ key })` + 预填落点 + 注） | #1041 |
| 11 | `thincoder-server/public/modal.mjs` | 68 ⇒ ≈74（+`closeActiveModal` 导出） | #979 |
| 12 | `thincoder-server/public/app.mjs` | 192 ⇒ ≈195（import + `route()` 起点调用 + 注） | #979 |
| 13 | `.thincoder/tmp/restart-desktop.cmd` ∥ 计划任务 `\thincoder-restart` | 在盘 ⇒ **删**（先录后删——§5 抄全文） | #805 |

**测试件**

| # | 档 | 现行 ⇒ 预期 | 面 |
|---|---|---|---|
| 14 | `docs/batches/2026-09-29-desktop-rebuild-fidelity-M604.test.mjs` | 526 ⇒ ≈556（+2 腿 + 注随正；越 500 硬限在册（#1060 父裁不拆，延续）；§5 回填实测值） | #1071（**父侧笔**） |
| 15 | 新档 `docs/batches/2026-10-10-desktop-behavior-residues.test.mjs` | 0 ⇒ ≈300（A1–A2 ∥ B ∥ C ∥ D ∥ E ∥ F ∥ G 八腿面） | 全批（本批 coder 可写——自身批次伴随件） |
| 16 | `docs/batches/2026-09-29-desktop-window-queue-parity.test.mjs` | **463 ⇒ ≈464**（标题族「五帧」⇒「六帧」两处（`:9 ∥ :75`）；结构零变；§5 回填实测；**父侧笔**） | #912 随动 |

**设计档（随动载荷 · 实施轮落）**

| # | 档 | 现行 ⇒ 预期 | 面 |
|---|---|---|---|
| 17 | `docs/desktop/design/IPC.md` | 558 ⇒ ≈562（§1 `ev:queue` 行：帧枚举「五帧 ⇒ 六帧」（推点类 6 ∥ 站点 7）+ 推点「链尾状态帧」（弃件径）；§2 `ledger:read` 行 ∥「设置族与项目级信息族注」：歧义 ⇒ 拒绝直传（诚实拒）行注；变更记录 +1） | #912 ∥ #831 |
| 18 | `docs/desktop/design/COMPOSER.md` | 338 ⇒ ≈340（KD-40 ⑥ 帧点枚举 5 ⇒ 6 随动 + 变更记录） | #912 |
| 19 | `docs/desktop/design/RENDERER.md` | 552 ⇒ ≈554（回填收束条补「受理径同步落帧（`frame.flush`）——收束帧判据保位」+ 变更记录） | #914 |
| 20 | `docs/desktop/design/UI.md` | 820 ⇒ ≈823（D29 本批注项 2 清册 +1 条（帮助行族标签 = accent ∥ 400）+ slash 注项 8 措辞收正（「标签加重」⇒「标签 accent 强调——D29 色位通道」）+ 变更记录） | #809 |
| 21 | `docs/desktop/design/SETTINGS.md` | 566 ⇒ ≈569（§2.12 项 2 增 a11y 行（两滚动层 `scroll-padding-top`）+ §3.1 行数随动（settings.css ∥ settings-modal.css）） | #1039 |
| 22 | `docs/vsc/design/SETTINGS.md` | 861 ⇒ ≈864（§2.16 ② 首启板交棒句收正（携 key 预填 ∥ 分支前移）+ 坐标随动（`:62 ⇒ :63`——现读）+ 变更记录） | #1041 |
| 23 | `docs/server/design/webui/WEBUI.md` | 720 ⇒ ≈722（§2.4① 弹窗组件条增「路由切换 ⇒ 关闭在场弹窗（`closeActiveModal()` 于 `route()` 起点）」+ 变更记录） | #979 |
| 24 | `docs/vsc/design/WEBVIEW-PROTOCOL.md` | 坐标同拍收正（`:488` 交棒调用位 `:62 ⇒ :63`；零语义） | #1041 随动 |

### 2.4 测试面（必要件 —— 只列必要）

1. **本批批内件（新档 · 表 15）**：八腿 = A1 ∥ A2（#809 两腿：扫描面 ∥ 规则面）· B（#831）· C（#912）· D（#914）· E（#979）· F（#1039）· G（#1041）——**先红后绿**：C ∥ D ∥ G 三腿修前各跑一遍，红灯基线证据落 §5；其余为源面 ∥ 形面锁。
2. **他批件复跑（受影响面回归 · 真跑一次）**：`…-M604.test.mjs`（父侧笔后 10/10）∥ `…-window-queue-parity.test.mjs`（**先跑一次确认修后仍绿**——该件帧面断言三处：T1 `:80` ∥ `:108-111`（帧数）· T5 `:228`（恰四帧整序）；收窄案 ⇒ 全消费径零增帧 ⇒ 三处保位，弃件径不在该件射程）∥ `2026-10-02-light-round-6.test.mjs`（弹窗头行粘顶件——`settings-modal.css` 触碰面随跑）∥ **VSC ∥ server 窄触面他批件（五件——VSC 两档 ∥ server 两档的直读件；已核相容）**：`2026-10-07-provider-config-parity-vsc.test.mjs`（`:121-125` 复开清键 ∥ `:300` 交棒源锁 ∥ V9 行为腿 `:297-324`）∥ `2026-10-09-provider-default-model-purge-vsc.test.mjs`（`:112-113` 真档 import）∥ `2026-10-08-server-public-structure.test.mjs`（`:132-139`）∥ `2026-10-06-console-completeness-2.test.mjs`（`:478-479`）∥ `2026-10-09-console-proxy-page.test.mjs`（`:445-447`）——断言与改动相容（清键序保留 ∥ 只增 `route()` 起点调用）；随跑一次（红 ⇒ 收正）。
3. **仓套件**：桌面 `test/` 空清单（`files.mjs` 空）——**不写 ∥ 不改 ∥ 不跑**；收口跑 = 父侧唯一跑点。
4. **真机读数**（父侧 ∥ 用户走查面）：① #809 `/help` 标签 computed 读数 ∥ ② #1039 两宿主 Tab 遮挡读数 ∥ ③ #831 歧义拒绝读数（锚句逐字）∥ ④ #979 后退/前进零弹窗残留（截图）∥ ⑤ #1041 VSC custom 交棒键在 ∥ ⑥ #914 长会话回填零跳（条件腿）∥ ⑦ #805 `--smoke` 单实例读数。
5. **不做**：不为八腿各建整合用例（整合套件随业务面 ∥ 不随本批）∥ 无「文档句存在性」类断言（行为形 ∥ 结构机检形）。

### 2.5 验收对照（AC ↦ 台账 · 逐条回指）

| AC | 台账 | 判据（机检先行；真机读数 = 父侧闭合） |
|---|---|---|
| AC-1 | #809 | 批内件 A1 ∥ A2 绿 + 真机 ① 读数落 §5 |
| AC-2 | #831 | 批内件 B 绿 + 真机 ③ 拒绝读数落档（含锚句逐字） |
| AC-3 | #912 | 批内件 C 绿（红灯基线在档——含全消费径零增帧锁）+ 枚举随动「六帧（推点类 6 · 站点 7）」逐处落实（`IPC.md` ∥ `COMPOSER.md` ∥ 四代码注释点：`window-queue.mjs:13` ∥ `suspension-drive.mjs:11 ∥ :42` ∥ `turn-driver.mjs:143`——表 5 ∥ 6 ∥ 7） |
| AC-4 | #914 | 批内件 D 绿（两臂）+ 真机 ⑥ 或登记待读 |
| AC-5 | #979 | 批内件 E 绿 + 真机 ④ 读数/截图 |
| AC-6 | #1039 | 批内件 F 绿 + 真机 ② 两宿主读数 |
| AC-7 | #1041 | 批内件 G 绿（先红后绿）+ 真机 ⑤ |
| AC-8 | #1071 | M604 件 10/10（父侧跑）+ 标题族随动收正——**前置项：两腿落讫 ∥ 标题族收正（父侧笔 · 跨批写门禁）；缺位 ⇒ 本 AC 不闭合——§6 收口对勾** |
| AC-9 | #805 | 任务查询「找不到」+ `Test-Path` False + `--smoke` 读数 + §5 脚本全文留档 |
| AC-10 | 全批 | 产品码 ∥ 测试件 `node --check` 全绿；批内件复跑全绿；设计档 17–24 落讫（回读核） |

### 2.6 上抛 ∥ 报告 ∥ 边界

**上抛**
- [上抛·知会] ① **§1 边界句枚举不全（报告 · 不改）**：§1 `:24` 边界列「桌面 `renderer/**` ∥ `src/main/**` ∥ `webview/**` ∥ chat-fixes.css」——本批实含 server 两档（#979）∥ VSC 两档（#1041）∥ `.thincoder/tmp` + 计划任务（#805）三条超句；设计按其题面执行（不改 §1——主 agent 笔）。
- [上抛·知会] ② **#805 退役的伴生面**：重启三步纪律卡（记忆）∥ 任何手册提到该通道的句子需随删改——不在本批写域。
- [上抛·知会] ③ 仓根四份 `desktop-test*.log`（e2e 日志残留）——工程工具面，父侧裁（本批零触）。
- [上抛·知会] ④ #979 邻面「一次性明文写入脱链的秘密区」= 本批零涉（登记勿混）。
- [上抛·待裁] ⑤ #805 若父侧不采「退役」而采「真测」：本设计需重开对应行（真测 = 杀本会话 + 读数他补——结构不可自证，故未按真测出案）。

**报告（发现 · 逐条）**
1. §1 坐标三处与现读不符（已按现读执行）：`chat-fixes.css:50 ⇒ :46` ∥ `suspension-drive.mjs:173-204 ⇒ :200-231` ∥ `settings.css:53 ⇒ :44-58`（粘顶块族）。
2. `docs/vsc/design/SETTINGS.md:484` ∥ `WEBVIEW-PROTOCOL.md:488` 载 `onboarding.js:62`——现读 `:63`（随动入表 22 ∥ 24）。
3. `…-window-queue-parity.test.mjs` 标题「五帧」= #912 后旧计数（表 16 收正）。
4. `clear` 零条零帧 = **非漏点**（推理见 2.1 行 3）——台账 #912 第三腿不另修。
5. #912 可达性 = 机制推证（未实证）——修 = 防御性；真机若不可达 ⇒ 该腿只保机检面（登记）。
6. 桌面 `test/` 空清单（仓套件零覆盖桌面面）；本批机检全住批内件（口径不变）。
7. M604 件 526 > 500（#1060 父裁不拆在册）；本批 +2 腿 ≈556——越限延续登记（不拆）。
8. **旧话语收正登记**（评审 #72 🔵13 处置 = 维持——登记已达）：三处——「五帧」（表 5 ∥ 6 ∥ 7 + 表 16）∥「标签加重」（表 20）∥ `onboarding.js:62 ⇒ :63`（表 22 ∥ 24）；实施轮落笔随正 ∥ grep 复核（坐标同报告 2 ∥ 3）。

**边界（不做）**：不做 #912 可达性诱捕装置 ∥ 不做 #805 全链真测 ∥ 不建 VSC ∥ server 测试基座 ∥ 不动 `thincoder-core`（#912 修在端侧驱动；核件 `queued.mjs` 零改）∥ 不动 `thincoder-render-core`（#914 用既有 `flush`）∥ 不做 #979 秘密区面 ∥ 不改 #1039 头行形态 ∥ 不动 prompts。

**零触确认（实施轮）**：`thincoder-core/**` ∥ `thincoder-render-core/**` ∥ `thincoder-cli/**` ∥ prompts 全树 ∥ 桌面 `test/**`（不写 ∥ 不改 ∥ 不跑）∥ `scripts/desktop-debug.cmd` ∥ focus 探针族（`focus-probe` ∥ `focus-guard` ∥ `win-ctl`）∥ 他批在飞面（#1167 VSC `specs.mjs` ∥ 七簇）——以上零触；**窄触例外**（表内逐行在册）：VSC 全树仅 `webview/onboarding.js ∥ webview/settings-provider-dialog.js` 两档；server 全树仅 `public/modal.mjs ∥ public/app.mjs` 两档；VSC ∥ server 设计档仅表 22 ∥ 23 ∥ 24 三行；桌面 `src/main/turn-driver.mjs` 仅注句一线（表 7）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**设计评审 · 轮次 1（对象 = 本档 §2 · 待评审）**

**判据降级声明**：审查上下文未给项目标准档；`Document ownership` 判据因无文档地图而降级（见发现 13）。以下全部断言均以现读盘面为依据（`file:line` 为设计轮现读）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Acceptance criteria ∕ Feasibility | 🔴 | #912「链尾状态帧」按 §2 写法（本档 `:46`「两出口（墓碑 `return` 前 ∥ `start(...)` 前）各补一次**链尾状态帧**」+ §2.2 KD-D2 `:57`）在**全消费的正常径**亦出帧：`suspension-drive.mjs:230` 的 `start(...)` 是 T5 残值续发径必经点（池空 ⇒ 零重开仍走 `:230`），而既有他批件 `docs/batches/2026-09-29-desktop-window-queue-parity.test.mjs:228` 断言**恰四帧整序**（`[["state",1],["delivered",0],["state",1],["delivered",0]]`；帧由 `:66` `postQueue = (key, delivered = null) => frames.push({ key, delivered, items: … })` 逐帧记账）⇒ 增第 5 帧即该断言失败。而 §2.3 行 15（`:91`）只列「标题族」改句、§2.4 项 2（`:109`）明写「先跑一次确认修后仍绿（该件 T1 无帧数断言（现读 `:97-99`））」——该影响核只覆盖 T1 的 `:97-99` 区（确无帧断言），T5 整序断言未入视野（T1 另有 `:80` ∥ `:111` 帧数断言）。 | 择一收束：① 表 15 增该件 T5 断言递进的登记行（该档为跨批件——与既有行 13 ∥ 15 同规），使「六帧」随动与该件判据同拍；② 或把链尾帧收窄到**弃件径**（墓碑出口 ∥ `!stillHeld` 断点 `suspension-drive.mjs:211-215`），全消费径零增帧（T5 序不变）——此时 A ∥ C 两腿判据与 `:46` 期望列须同步收窄。 |
| 2 | Acceptance criteria ∕ Clarity | 🟡 | A1（`:44`）判据 =「12 档桌面 CSS 扫描：`font-weight` 值 ∈ {500,600,700} 零命中」，但既未点名 12 档，也未带 D29 的 markdown 豁免：现盘 `core-markdown.css:35-40` ∥ `:147` ∥ `:162` 与 `core.css:72` 仍载 600/700（标题 ∥ `th` ∥ `strong` 修饰层），`renderer/` 实有 **13** 档 `.css`，而 D29 自有清册的源扫描腿在册为 **11 档**（`docs/desktop/design/UI.md:425`）、豁免单源 = `UI.md:406`（自有文字零粗体）∥ `UI.md:407`（markdown 修饰层语义保留）⇒ 按字面实现，#809 修后 A1 仍红。 | 在 A1 写明扫描集构成（逐档点名，或「D29 清册 11 档 + 新增档」式）与豁免规则（markdown 修饰行 ∥ 两核档排除），使「修前红 ∥ 修后绿」唯一可判。 |
| 3 | Affected-file annotations ∥ Clarity | 🟡 | 帧枚举「五帧」代码面共四处在册：`window-queue.mjs:13`、`suspension-drive.mjs:11` ∥ `:42`、`turn-driver.mjs:143`（`postQueue: chain.postQueue, // 窗队五帧出站`）；§2.3 只列前两档（行 5 `:76` ∥ 行 6 `:77`），`turn-driver.mjs` 既不在表内、也不在零触例外清单（`:149`）⇒ AC-3（`:120`）「枚举随动…逐处落实（IPC.md ∥ COMPOSER.md ∥ 三代码注释）」的第三处无法从表内反解。 | 表 3 增 `thincoder-desktop/src/main/turn-driver.mjs` 行（现行行数 ⇒ 预期；注句改「六帧」= 结构不变类）并纳入窄触例外；或明写该注释不在本批枚举面（登记随动）。 |
| 4 | Clarity | 🟡 | 同一道门两种称法：`:38` ∥ `:47` 把 `app.mjs:192` 称「写门」、`:197-199` 称「补偿算式」；而代码自身注句 `thincoder-desktop/renderer/app.mjs:191` 判据 =「读门 = 上帧在飞 ∧ 本帧坍落 ∧ 非跟滚（收束沿先例 = `nextWindow`）；写门 = 高度净增 ΔH ≠ 0」——`sealFrame`（`:192`）是**读门**、ΔH 门在 `:199`；§1 `:18` 亦作「`renderer/app.mjs:191` 读门」。 | 统一为读门 = `:192` ∥ 写门 = `:199`（含 `:38` 回执句与 §2.1 行 4「被否①＝写门放宽」句），免实现面按错门定位。 |
| 5 | Methodology compliance ∥ Doc hygiene | 🟡 | `:108`（§2.4 项 1）与 `:90`（表 14 面列）仍写「七腿」，其枚举实为八项（A1 ∥ A2 ∥ B ∥ C ∥ D ∥ E ∥ F ∥ G）；收正只落末尾块 `:151`（「以本块为准」）⇒ 规范面（测试面 ∥ 受影响表）残留失效计数，读者须回读尾块才知真值。 | 两处计数词直改「八腿」（尾块随并入或撤），使规范面自足。 |
| 6 | Affected-file annotations | 🟡 | 表 15（`:91`，`…-window-queue-parity.test.mjs`，**将被改**）未标现行行数 ⇒ 预期（现读 **463** 内容行；`:9` ∥ `:75` 标题族改句）；表 23（`:104`，纯 `.md`——免标）同缺。 | 补「463 ⇒ ≈464（标题措辞；结构不变）」式行数 ⇒ delta 注（与表 5 ∥ 6 同规）。 |
| 7 | Acceptance criteria ∥ Scope | 🟡 | §2.4 项 2（`:109`）复跑清单只列三件，但本批窄触的 VSC 两档 ∥ server 两档被他批件直读：`2026-10-07-provider-config-parity-vsc.test.mjs:121-125`（复开 ⇒ key 清空）∥ `:300`（交棒调用源锁）∥ V9 行为腿（`:297-324` 装真链开框 + 焦点）；`2026-10-09-provider-default-model-purge-vsc.test.mjs:112-113`（真档 import）；`2026-10-08-server-public-structure.test.mjs:132-139` ∥ `2026-10-06-console-completeness-2.test.mjs:478-479` ∥ `2026-10-09-console-proxy-page.test.mjs:445-447`（server `public/app.mjs` 源锁）⇒ 回归面缺登记（逐条核读：上列断言与设计改动相容——清键序保留 ∥ 只增 import 与 `route()` 起点调用）。 | 项 2 增列「VSC 两档 ∥ server 两档相关他批件」复跑行，或明写「已核相容、不跑」依据，使受影响面回归穷尽可查。 |
| 8 | Scope（协调项 · 非缺陷） | 🟡 | 表 13 ∥ 15 与 AC-8 的落讫面在本批 coder 写域外（跨批写门禁 `thincoder-core/agent/write-gate.mjs:148-171`：`underBase` 覆盖批次目录、`isOwnBatchCompanion` 仅放行自身批次伴随件——词干族判据 `:128-129`）；§1 父裁③ 已在册，风险 = 该项缺位则 AC-8（M604 10/10 ∥ 标题族收正）无法闭合。 | 收口验证清单把「两腿落讫 + 标题族收正」列为 AC-8 前置项（§6 对勾）。 |
| 9 | Clarity | 🔵 | `:52` 期望列「活体持锁 ⇒ 第二实例零窗；不触活体 ∥ 不占口」与源不符：`--smoke` 非主实例径仍走单实例交棒——`thincoder-desktop/src/main/main.mjs:94-96` 注句「交棒主实例（下方 `second-instance` ⇒ 唤醒既有窗口）」∥ `:110-114`（`win.restore()` ∥ `win.show()` ∥ `win.focus()`）⇒ 既有窗口会被唤起（零新窗 ∥ 零弹框成立）。 | 措辞收正为「零新窗 ∥ 零弹框（既有窗口唤起照旧）」。 |
| 10 | Clarity | 🔵 | `:46` ∥ `:120` 的计数随动写作「五帧 ∥ 五推点 ⇒ 六帧 ∥ 六推点」，但新帧落**两站点**（墓碑出口 ∥ `start(...)` 出口）⇒ 帧类 6、站点 7；枚举处若按站点计数即与文案冲突。 | 枚举句注明口径（帧类 6 ∥ 站点 7，或把两出口记为一推点类）。 |
| 11 | Acceptance criteria | 🔵 | `:49` 期望列含「鼠标滚动观感零变」，但机检 ∥ 真机两腿只判键盘焦点几何（`focused.top ≥ head.bottom`）——该句无对应读数项（未证实 ∥ 未否证）。 | 增一条滚动手感读数项（或标为推证）。 |
| 12 | Affected-file annotations | 🔵 | 表 13（`:89`）526 ⇒ ≈556 仍越 500 咨询线（#1060 父裁不拆在册，`:31` ∥ `:145`）；表 14 新档 ≈300 在限内。 | 按在册裁定延续；§5 回填实测值。 |
| 13 | Document ownership | 🔵 | 判据降级（无文档地图）：归属穷尽性不可核；可见面 = 本设计改既有单源档（IPC.md ∥ COMPOSER.md ∥ RENDERER.md ∥ UI.md ∥ 两 SETTINGS.md ∥ WEBUI.md ∥ WEBVIEW-PROTOCOL.md），未见「为既有章节另起新档」。 | 落笔时对旧话语（「五帧」「标签加重」「onboarding.js:62」）做一次 grep 收正 ∥ 登记（§2.6 报告 2 ∥ 3 已覆盖两处坐标）。 |
| 14 | Requirements coverage | 🔵 | 台账 #805 枚举四面（拉起腿 ∥ 单实例锁 ∥ 端口残留 ∥ schtasks 255），AC-9（`:126`）只机检任务 ∥ 脚本 ∥ 单实例读数三面；「拉起腿 ∥ 端口残留」仅由退役隐含消解，无显式条目。 | 行 9 期望列补一句「拉起腿 ∥ 端口残留随退役消解」，便于台账逐项对勾。 |

**计数**：🔴 1 · 🟡 7（含 1 协调项）· 🔵 6 —— 共 14。

**已核通过面（随记）**：#809 落点（`chat-fixes.css:46` = `.chat-help .help-label { font-weight: 600; }`；`--accent` = `theme.css:15`）∥ #831 链（`project-info.mjs:39` 无 try/catch ⇒ `ledger-db.mjs:151` 锚句「项目不可解析」；`ledger.mjs:116-117` `buildScan` ⇒ `ledgerQuery`；渲染面零消费 = `IPC.md:307`）∥ #979（`modal.mjs` 无 `closeActiveModal` 导出、`:16` 单例槽、`:47-59` 收口径幂等；`app.mjs:132` `route()` 四入口 `:72` ∥ `:119` ∥ `:188` ∥ `:189`）∥ #1039（两滚动层 `settings.css:13-25`/`:54-55` ∥ `settings-modal.css:16-34`/`:38-43`；`--gap = 12px` ⇒ `calc(14px * 1.3 + 2 * 12px) = 42.2px` ≥ 头底 27.2px）∥ #1041（`onboarding.js:57-58` ∥ `:59-65` ∥ `:63`；`settings-provider-dialog.js:179` ∥ `:184-188` ∥ `:264`；余两调用点 `input.js:35` ∥ `settings-providers.js:147`；`settings.keyOptional` = `locales/zh.json:110`）∥ #914（`app.mjs:188-199` ∥ `:268`；`store.mjs:171-174` 置 inFlight ∥ `:176-180` 清；`frame.mjs:62` `flush() { fire() }` 同步）∥ #912 机制（`window-queue.mjs:77` `drain` 零帧 ∥ `:91-97` `clear` 非空才发；`suspension-drive.mjs:200-231` 两出口 ∥ `:207` ∥ `:211-215` ∥ `:226-230`；`dropped` 在 `:208` 取批后取值）∥ #1071（M604 件 526 行、`:271` 缺口注、`:272` M-604a 腿；写门禁前提可核）∥ #805（`--smoke` 径 `main.mjs:86` ∥ `:106`；`.thincoder/tmp/verify-smoke.log:2` 载 `{"smoke":1,"lock":"secondary",…}`；`scripts/desktop-debug.cmd` 在盘）∥ 行数注（表 1–11：120 ∥ 304 ∥ 49 ∥ 336 ∥ 103 ∥ 335 ∥ 169 ∥ 82 ∥ 266 ∥ 68 ∥ 192 全对；桌面 ∥ VSC `test/files.mjs` 均空清单）。

VERDICT: changes-required

### 轮次 2（评审子代理）

**设计评审 · 轮次 2（对象 = 本档 §2 · 修复轮回执「F1 取收窄案」后复评）**——原 14 条逐条核销（现读盘面）+ 新增 2 条。

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | 本档 §2（`:48` ∥ `:59`） | 🔴 | **Fixed** | 收窄案已落：`:48`「**弃件径两出口**（墓碑 `return` 前 ∥ `!stillHeld` 断点 `:211-215`）各补一次**链尾状态帧**…**全消费正常径零增帧**（弃件径之外不出帧——逐条消费帧已收口）」；`:59` 并把旧式入被否「`start(...)` 前出帧（全消费径亦出 ⇒ 破 T5 恰四帧整序断言——`…-window-queue-parity.test.mjs:228`）」。现读实证（`thincoder-desktop/src/main/suspension-drive.mjs`）：`:207`「`if (abortTombstones.has(entry.key)) { dropped = items.length; break } // 续发期中止 ⇒ 停链`」∥ `:211`「`if (!stillHeld) { // 窗后零起跑判据：零起跑 ∧ 不重投（条目已摘——不复位；消费帧已出——不追回）`」→ `:214`「`break // 停链（占位被摘 ⇒ 零起跑——链径现式）`」∥ `:226`「`if (abortTombstones.delete(entry.key)) { // 续发期中止（含末轮后落位）：停链 + 零接管`」→ `:230`「`start(entry.key, entry.agent, { cwd: entry.cwd })`」⇒ 新帧只落两弃件站点。全消费径零增帧对拍：T5 `:228` 恰四帧整序（`:224` `await until(() => runs.length === 2)` 后断言）不受影响；该件全部帧断言逐处核读保位（`:80` ∥ `:95` ∥ `:108-111` ∥ `:112` ∥ `:211` T4 = abort→清队径（`drain` 空 ⇒ `:202` 早退）∥ `:435` ∥ `:454` T9-⑤ = 过滤形）。全仓 `evict` 扫：唯一 hold 弃件 rig = 该件 T9 ⇒ 无第二处受影响。 |
| 2 | 2 | 本档 §2.1 行 1（`:46`） | 🟡 | Fixed | A1 现述扫描集逐档点名（「扫描集 = `renderer/` 全 13 档〔`theme ∥ chrome ∥ session-list ∥ skin ∥ chat ∥ chat-cards ∥ chat-composer ∥ chat-fixes ∥ core-markdown ∥ core ∥ pool ∥ settings ∥ settings-modal`〕**减豁免两核档**」）⇒「⇒ **扫 11 档**」+「**修前红恰一处 = `chat-fixes.css:46`（600）**，修后绿」；本轮全仓 grep 复核：13 档中 {500,600,700} 命中仅 `chat-fixes.css:46: .chat-help .help-label { font-weight: 600; }` 与两豁免档（`core-markdown.css:35-40 ∥ :147 ∥ :162` ∥ `core.css:72`）——与记录一致 ✓。 |
| 3 | 3 | 本档 §2.3 行 7（`:80`）∥ `:153` ∥ `:123` | 🟡 | Fixed | 表 7「236 ⇒ 236（注句「五帧 ⇒ 六帧」——结构不变类）」+ 零触例外「桌面 `src/main/turn-driver.mjs` 仅注句一线（表 7）」+ AC-3「四代码注释点：`window-queue.mjs:13` ∥ `suspension-drive.mjs:11 ∥ :42` ∥ `turn-driver.mjs:143`——表 5 ∥ 6 ∥ 7」；实读该档末行 = `236	}` ✓（236 内容行）。 |
| 4 | 4 | 本档 §2（`:40` ∥ `:49`） | 🟡 | Fixed | 「#914 = `app.mjs:192`（读门 `sealFrame`）∥ `:199`（写门——ΔH）」∥「⇒ `:192` 读门 ∥ `:199` 写门 ∥ `:197-199` 补偿算式**逐字零改**」——与源对拍（`renderer/app.mjs:191`「读门 = 上帧在飞 ∧ 本帧坍落 ∧ 非跟滚（收束沿先例 = `nextWindow`）；写门 = 高度净增 ΔH ≠ 0」；`:192` `const sealFrame = root !== null && chatScroll !== null && prev?.history?.inFlight === true && state.history?.inFlight !== true && state.following !== true`；`:199` `if (t1.scrollHeight !== t0.scrollHeight) root.scrollTop = compensateTop({ prevTop: t0.scrollTop, prevHeight: t0.scrollHeight, nextHeight: t1.scrollHeight })`）✓。 |
| 5 | 5 | 本档 §2.4 项 1（`:111`）∥ 表 15（`:93`） | 🟡 | Fixed | 「**本批批内件（新档 · 表 15）**：八腿 = A1 ∥ A2（#809 两腿：扫描面 ∥ 规则面）· B（#831）· C（#912）· D（#914）· E（#979）· F（#1039）· G（#1041）」∥ 表 15「0 ⇒ ≈300（A1–A2 ∥ B ∥ C ∥ D ∥ E ∥ F ∥ G 八腿面）」——「七腿」仅存 `:30` 收正表述「七腿⇒八腿」（非规范面残留）✓。 |
| 6 | 6 | 本档 §2.3 行 16（`:94`） | 🟡 | Fixed | 「**463 ⇒ ≈464**（标题族「五帧」⇒「六帧」两处（`:9 ∥ :75`）；结构零变；§5 回填实测；**父侧笔**）」——现行行数 ⇒ delta 注落位 ✓。 |
| 7 | 7 | 本档 §2.4 项 2（`:112`） | 🟡 | Fixed | 复跑清单增「**VSC ∥ server 窄触面他批件（五件——VSC 两档 ∥ server 两档的直读件；已核相容）**」+ 五档逐条坐标（`2026-10-07-provider-config-parity-vsc` ∥ `2026-10-09-provider-default-model-purge-vsc` ∥ `2026-10-08-server-public-structure` ∥ `2026-10-06-console-completeness-2` ∥ `2026-10-09-console-proxy-page`）✓。 |
| 8 | 8 | 本档 AC-8（`:128`） | 🟡 | Fixed | 「—**前置项：两腿落讫 ∥ 标题族收正（父侧笔 · 跨批写门禁）；缺位 ⇒ 本 AC 不闭合——§6 收口对勾**」= 协调项入验收链 ✓。 |
| 9 | 9 | 本档 §2.1 行 9（`:54`） | 🔵 | Fixed | 「（活体持锁 ⇒ 第二实例**零新窗** ∥ **零弹框**（`--smoke` 径）；既有窗口唤起照旧——`second-instance` ⇒ `restore` ∥ `show` ∥ `focus`）」= 措辞收正 ✓。 |
| 10 | 10 | 本档 §2.1 行 3（`:48`）∥ AC-3（`:123`） | 🔵 | Fixed | 「（口径：推点类 6 ∥ 物理站点 7——链尾状态帧类两站点 = 墓碑出口 ∥ `!stillHeld` 断点；逐处，见 §2.3）」∥「枚举随动「六帧（推点类 6 · 站点 7）」逐处落实」✓。 |
| 11 | 11 | 本档 §2.1 行 6（`:51`） | 🔵 | Fixed | 取「标为推证」支：「鼠标滚动观感零变（**结构推证**：`scroll-padding` 只介入滚入对位、对滚动手势零介入——不设读数项）」✓。 |
| 12 | 12 | 本档 §2.3 行 14（`:92`）∥ §2.6 报告 7（`:148`） | 🔵 | Accepted | 「526 ⇒ ≈556（+2 腿 + 注随正；越 500 硬限在册（#1060 父裁不拆，延续）；§5 回填实测值）」——延续登记有据（裁定在册，不重开）✓。 |
| 13 | 13 | 本档 §2.6 报告 8（`:149`） | 🔵 | Accepted | 「**旧话语收正登记**（评审 #72 🔵13 处置 = 维持——登记已达）：三处——「五帧」（表 5 ∥ 6 ∥ 7 + 表 16）∥「标签加重」（表 20）∥ `onboarding.js:62 ⇒ :63`（表 22 ∥ 24）；实施轮落笔随正 ∥ grep 复核」——非修理由成立（登记已达）✓。 |
| 14 | 14 | 本档 §2.1 行 9（`:54`） | 🔵 | Fixed | 「**拉起腿 ∥ 端口残留随退役消解**（台账 `#805` 四面逐项对勾）」✓。 |
| 15 | (new) | 本档 §1（`:30`）∥ §2.4 项 2（`:112`） | 🔵 | New | 父裁摘要「🟡 F2..F8（A1 扫描集 ∥ `turn-driver.mjs:143` 入表 ∥ 读/写门称法 ∥ 七腿⇒八腿 ∥ 表 16 行数 ⇒ delta ∥ 复跑清单四件 ∥ 协调项维持）逐条收正」 vs 规范面「**VSC ∥ server 窄触面他批件（五件——VSC 两档 ∥ server 两档的直读件；已核相容）**」——同机件计数漂移（明细五件为准，原 F7 亦五件）⇒ 摘要计数词收正「五件」或改指 §2.4 明细。 |
| 16 | (new) | 本档 §2.4 项 2（`:112`） | 🔵 | New | 「该件帧面断言三处：T1 `:80` ∥ `:108-111`（帧数）· T5 `:228`（恰四帧整序）；收窄案 ⇒ 全消费径零增帧 ⇒ 三处保位，弃件径不在该件射程）——实读：该件帧面断言不止三处（`:80` ∥ `:95` ∥ `:108-111` ∥ `:112` ∥ `:211` ∥ `:435` ∥ `:454`），且 T9-⑤ 即弃件腿（`:438`「// ⑤ 残续发径同判：占位被摘 ⇒ 零起跑 + 落盘件自清 + 停链（不重投）」，`:454`「`assert.equal(e.frames.filter((f) => f.delivered?.text === "乙").length, 1, "不重投（消费帧恰一枚——不复位 ∕ 不追回）")`」= 过滤形）⇒ 结论保位（新帧不入任何恰形断言），表述宜收正为「弃件腿断言为过滤形 ⇒ 新帧不入计数」。 |

**计数**：🔴 0（原 1 = Fixed）· 🟡 7（全 Fixed）· 🔵 6（4 Fixed · 2 Accepted）· 新增 🔵 2 —— 未决 🔴 0。
**已核独证面（本轮现读）**：桌面 13 档 CSS grep（豁免档外零 {500,600,700}）∥ `turn-driver.mjs` 末行 236 ∥ `app.mjs:191-199` 门称 ∥ `suspension-drive.mjs:200-231` 两站点 ∥ parity 件 T1/T4/T5/T9 帧断言逐处 ∥ 全仓 `evict` 扫（唯一弃件 rig = parity T9）。

VERDICT: pass

## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
**状态行**：实施完成（先红后绿（红 6/10 → 绿 10/10）∥ #805 退役读数全绿 ∥ 他批件 61 绿 + 2 外因红）



**§5 实施记录（eng-coder · 2026-10-10 · 桌面行为残渣批）**

**一句话**：九条逐条落讫（#809 ∥ #831 ∥ #912 ∥ #914 ∥ #979 ∥ #1039 ∥ #1041 ∥ #1071（父侧笔，前置已落）∥ #805 退役执行）；批内件**先红后绿**（红 6/10 → 绿 10/10）；他批件复跑 = 61 绿 + 2 处**外因红**（证据坐标见「三」）。

**一、改动清单（file 级）**

产品码（12 档 + 1 退役项）：

| 档 | 改动 |
|---|---|
| `thincoder-desktop/renderer/chat-fixes.css` | `:46` `.chat-help .help-label`：`font-weight: 600` ⇒ `400` + `color: var(--accent)`；注句「标签加重」⇒「标签 accent」（#809） |
| `thincoder-desktop/renderer/settings.css` | `[data-slot="settings"]` 滚动层 + `scroll-padding-top: calc(var(--fs) * var(--lh) + 2 * var(--gap))`（#1039） |
| `thincoder-desktop/renderer/settings-modal.css` | `.settings-modal` 滚动层 + 同值 `scroll-padding-top`（#1039） |
| `thincoder-desktop/renderer/app.mjs` | `onBackfill: backfill` ⇒ `onBackfill: () => { backfill(); frame.flush() }` + 注（#914；读/写门 ∥ 补偿算式逐字零改） |
| `thincoder-desktop/src/main/window-queue.mjs` | +`emitState(key)`（= `emit` 公开面）+ 档头帧枚举注「五帧 ⇒ 六帧」 |
| `thincoder-desktop/src/main/suspension-drive.mjs` | `resumeResidual` 弃件径两出口各 +`queue.emitState(key)`；`dropped = before`（取批前余量）；档头注（#912） |
| `thincoder-desktop/src/main/turn-driver.mjs` | 注句「五帧 ⇒ 六帧」（结构零变） |
| `thincoder-desktop/src/main/project-info.mjs` | 档头注：诚实拒在案（行为零改 —— #831） |
| `thincoder-vscode/webview/onboarding.js` | custom 分支前移（键校验之后）+ `_openAddProviderDialog?.({ key })`（#1041） |
| `thincoder-vscode/webview/settings-provider-dialog.js` | `openAddProviderDialog({ key = "" })` + 重置序后预填 `#pa-key` |
| `thincoder-server/public/modal.mjs` | +`closeActiveModal()` 导出（幂等单源；无在场 ⇒ 零动作） |
| `thincoder-server/public/app.mjs` | import + `route()` 起点 `closeActiveModal()` 调用 |
| `.thincoder/tmp/restart-desktop.cmd` ∥ 计划任务 `\thincoder-restart` | **删除**（#805 退役；全文见「四」） |

测试件：`docs/batches/2026-10-10-desktop-behavior-residues.test.mjs`（新档 · 10 例 = A1 ∥ A2 ∥ B ∥ C1 ∥ C2 ∥ C3 ∥ D ∥ E ∥ F ∥ G）。
设计档（8 档随动 = 表 17–24）：`docs/desktop/design/{IPC,COMPOSER,RENDERER,UI,SETTINGS}.md` · `docs/vsc/design/{SETTINGS,WEBVIEW-PROTOCOL}.md` · `docs/server/design/webui/WEBUI.md`（变更记录行 + 行数面回填）。
语法面：全部改动档 `node --check` 绿（lint 面 10/10 记录在案）。

**表外增项（1 项 · 全披露）**：`docs/desktop/design/ACTIVITY.md:139` 行数面回填（`suspension-drive.mjs` 335 ⇒ 340）——该档不在表 17–24，因本批改动其行数 ⇒ 同拍回填，零新语义。另三处行数面回填（`COMPOSER.md:153` window-queue 103 ⇒ 108 ∥ `RENDERER.md:328` app.mjs 336 ⇒ 338 ∥ `UI.md:504` project-info 169 ⇒ 171）落在表内档。

**二、逐腿读数（先红后绿 —— 复现轮 2026-10-10 05:0x）**

**复现法（披露）**：实施轮原「修前红」读数在上下文压缩后不可物化 ⇒ 本段以**定点回退复现**补录：四档字节备份（`.thincoder/tmp/redbase/`）→ 定点回退（suspension-drive 两发帧行 + 计数行 ∥ app.mjs 包装行 ∥ onboarding 分支序 + 携参 ∥ dialog `{key}` 形 + 预填行）→ 跑 → 复原（复原后哈希逐档 True，四档全核）。

**红灯**（`node --test docs/batches/2026-10-10-desktop-behavior-residues.test.mjs`）⇒ `# tests 10 · # pass 6 · # fail 4`：

- **C1**（`:198`）：`末帧 = 状态形（链尾收口 —— 实读 {"key":"1","delivered":{"text":"你排队了 2 条消息：\n1. 乙\n2. 丙\n——一次处理","ts":…},"items":[]}）` ⇒ 弃件径零状态帧（末帧残留消费形）——红 ✓
- **C2**（`:226`）：诊断行 `— 2 accepted message(s) dropped`（= 取批后余量；期望 3 = 含已取未达件）——红 ✓
- **D**（`:277`）：`onBackfill` 包装源锁缺位（AssertionError，实读全文 = 无包装版 `onBackfill: backfill`）——红 ✓
- **G**（`:332`）：`键随交棒预填（trim 后逐字） '' !== 'sk-welcome'`（空键早退 ⇒ 框内零预填）——红 ✓
- 余 6 例（A1 ∥ A2 ∥ B ∥ C3 ∥ E ∥ F）红轮即绿：与设计表「先红后绿」口径一致（设计 §2.4 项 1 = 仅 C ∥ D ∥ G 三腿要求红灯基线，其余为源面 ∥ 形面锁；三例名中「修前红」注 = 修前态构造性红登记，不逐再回退复算）。

**绿灯**（复原后同命令）⇒ `# tests 10 · # pass 10 · # fail 0`（duration ≈ 1.08s）——先红后绿对完整。

**三、他批件复跑**（设计 §2.4 项 2；命令 = `node --test --test-reporter=tap <files>`；parity 件须带 `--import ./thincoder-desktop/test/rc-resolve.mjs`（R3b 预载）——首跑漏预载 ⇒ 误红「`Cannot find module 'D:\rc\subblocks\state.mjs'`」，已更正复跑）

| 件 | 读数 |
|---|---|
| `2026-09-29-desktop-rebuild-fidelity-M604.test.mjs` | **10/10 绿** ✓ |
| `2026-09-29-desktop-window-queue-parity.test.mjs` | **8/9 绿** —— T7 红（**外因**）：失败行源（B21）期望 `'queue-full'`，实读 `{ kind: null, reason: 'queue-full', source: 'msg:send' }` ⇒ 形变源 = `renderer/composer-wire.mjs:76`（他批未提交改动，`git status` = `M`）；**T9（弃件 ∥ 挂起腿 —— 本批射程）绿** ✓ |
| `2026-10-02-light-round-6.test.mjs` | 全绿 ✓ |
| `2026-10-07-provider-config-parity-vsc.test.mjs` | 全绿 ✓ |
| `2026-10-09-provider-default-model-purge-vsc.test.mjs` | 全绿 ✓ |
| `2026-10-08-server-public-structure.test.mjs` | **5/6 绿** —— ① 键集指纹 zh 漂移（**外因**）：期望 `bf12e7e…` 实读 `e36e90e…` ⇒ i18n 表被他批改动（`i18n-zh-*.mjs` 全 `M`）；本批 server 面改动 = **+11 行、零键**（`modal.mjs` +9 ∥ `app.mjs` +2）✓ |
| `2026-10-06-console-completeness-2.test.mjs` | 全绿 ✓ |
| `2026-10-09-console-proxy-page.test.mjs` | 全绿 ✓ |

**四、#805 退役执行**（AC-9 读数 · 2026-10-10 05:1x 现读）

- ① `schtasks /query /tn thincoder-restart` ⇒ **exit 1** · stderr「错误: 系统找不到指定的文件。」（任务零残留）；
- ② `Test-Path .thincoder/tmp/restart-desktop.cmd` ⇒ **`False`**；`Get-ChildItem .thincoder\tmp -Filter "restart-*"` ⇒ 零命中；
- ③ 单实例面实测（活体持锁 ⇒ 第二实例零新窗 ∥ 零弹框；既有窗口唤起照旧）：`cd thincoder-desktop; node_modules\.bin\electron.cmd . --smoke` ⇒ **exit 0** · `{"smoke":1,"lock":"secondary","window":false,"node":"24.21.0","sqlite":false,"floorMet":false,"protocol":{"served":0,"blocked":0,"probes":[]},"boot":"none","configKeys":0,"channels":[],"errors":[],"ok":true}`（在场活体 = PID 18396「ThinCoder」窗口）；
- ④ **脚本全文留档（22 行 · 先录后删）**：

```cmd
@echo off
rem restart-desktop.cmd — 桌面实例重启到调试口（9224+9225）并自动双面挂探针——焦点假死测量用（台账 #787）
rem 用法：双击；或 Task Scheduler 通道脱树代跑（父侧）——但：重启动作 = 「杀腿 + 拉起腿」两段，历史上连挂三次（2026-10-01）。须：① 在飞子舱清零（subagent status）② 用户点头 ③ 重启后核活（进程 + 端口）——三者缺一者禁用本脚本。
rem 日志：本脚本同目录 restart-desktop.log
setlocal
cd /d "%~dp0"
set LOG="%~dp0restart-desktop.log"
rem PID 动态解析（2026-10-01 事故后修：旧版硬编码 PID 13276 = 陈值——杀腿必空放）；含窗口的 electron = 桌面实例。
powershell -NoProfile -Command "Get-Process electron -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1 | ForEach-Object { $_.Id }" > "%~dp0restart-pid.txt"
set /p APP_PID=<"%~dp0restart-pid.txt"
if not defined APP_PID (echo [restart-desktop] %DATE% %TIME% WARN: no desktop window found — skip kill >> %LOG% 2>&1) else (echo [restart-desktop] %DATE% %TIME% killing tree of PID %APP_PID% (dynamic) >> %LOG% 2>&1 & taskkill /PID %APP_PID% /T /F >> %LOG% 2>&1)
timeout /t 4 /nobreak >nul
echo [restart-desktop] starting new instance via desktop-debug.cmd (CDP 9224 + inspect 9225) >> %LOG% 2>&1
start "" "%~dp0..\..\scripts\desktop-debug.cmd"
echo [restart-desktop] waiting 12s for boot, then arming probes >> %LOG% 2>&1
timeout /t 12 /nobreak >nul
cd /d "%~dp0..\.."
node .thincoder\tmp\focus-probe.mjs arm >> %LOG% 2>&1
timeout /t 2 /nobreak >nul
node .thincoder\tmp\focus-probe.mjs main-arm >> %LOG% 2>&1
echo [restart-desktop] %DATE% %TIME% done — probes armed (renderer 9224 ∥ main 9225) >> %LOG% 2>&1
（第 22 行为空行）
```

**全文来源披露**：该件为 temp 件（不入 git —— `.gitignore:21` `.thincoder/tmp*`），实施轮读取后全文不可再物化（上下文压缩）⇒ 上列全文经会话轨迹恢复（`traces/2026-10-10/38478126a2c4-616.jsonl` 所载 2026-10-10 03:53 设计轮现读）；行数口径 = 22（第 22 行空行 ∥ 内容行 21）——与批档 §2 记载「22 行」一致。**残余风险**：03:53 读数至删除间差异不可机检（该件不在版本面），按零处理并在此披露。

**五、上抛 ∥ 边界**

- [上抛·知会] ① **真机读数面**（#809 CDP 标签 computed ∥ #1039 两宿主 Tab 遮挡 ∥ #831 歧义拒绝锚句 ∥ #979 后退/前进零弹窗截图 ∥ #1041 VSC custom 交棒键在 ∥ #914 长会话回填零跳）——按设计 §2.4 项 4 = 父侧 ∥ 用户走查面；本批机检面全绿，本段未跑真机（无 CDP 会话在场）。
- [上抛·知会] ② **#1071 两腿 + parity 标题族 = 父侧笔**（§1 父裁已载落讫）；本批零触。
- [上抛·知会] ③ **parity T7 ∥ server-public-structure ① = 他批在飞面红**（证据坐标见「三」）——本批零触、不修。
- 边界（本批零动）：`thincoder-core/**` ∥ `thincoder-render-core/**` ∥ `scripts/desktop-debug.cmd` ∥ focus 探针族 ∥ 桌面 `test/**`（空清单，不跑）。

**六、审计与评审轮次 ∥ 终态**

- **内部偏差审计（explore · 轮 1 · 2026-10-10）**：逐条核 8 项「一致」（含批内件 10/10、行数面 ∥ 档随动一致、旧话语活面零残留）；DEVIATIONS 2 条 = ① §5 空（本段已补 —— 正文落本节）∥ ② `ACTIVITY.md` 行数面回填超表（已披露 —— 见「一、表外增项」）。2 条均可判非缺陷（① 记录面补录 ∥ ② 表外增项全披露）。
- **内部代码评审（advisor · code · 轮 1）**：待跑（结果随后续 append 落本节）。

**六（续）、内部代码评审（advisor · code · 轮 1 · 2026-10-10 05:2x）**

评审对象 = 12 产品档 + 批内件（声明排除面 = 他批在飞（`composer-wire.mjs` ∥ i18n 表 ∥ #1071 父侧笔））。**裁决 = pass**：🔴 0 · 🟡 2（均非必改）· 🔵 3（可选）。响应表（逐条）：

| # | 发现 | 级别 | 处置 | 理由 / 动作 |
|---|---|---|---|---|
| 1 | 六条 AC 的「真机读数」面未闭合（AC-1① ∥ AC-2③ ∥ AC-4⑥ ∥ AC-5④ ∥ AC-6② ∥ AC-7⑤） | 🟡（协调项 · 非缺陷） | 认可 · 不改码 | 设计明写父侧闭合面（§2.5 表头「机检先行；真机读数 = 父侧闭合」∥ §2.4 项 4 = 父侧 ∥ 用户走查面）——已录上抛①；§6 收口按 AC 逐条对勾或登记待读（#914 ⑥ 沿「离线不可产面」先例）。 |
| 2 | `suspension-drive.mjs:143` 直呼 `postQueue` 无守卫（与同档契约句 :36「缺省 ⇒ 零出站 ∕ 无附件径」相抵；`emit` 侧已有守卫 = window-queue.mjs:42） | 🟡（报告 · 非必改；生产装配恒注入 ⇒ 当前不可达） | 登记 · 本批不改 | 改之 = 越设计面（§2.1 行 3 改动集 = `emitState` 两行 + 计数行 + 注；此点为**既有面**），交父侧裁或另批收口——已录上抛④。 |
| 3 | 批内件 `settle(60)` 挂钟屏障（:38；调用 :197 ∥ :222） | 🔵 | 不采纳（保留现状） | 确定性命中：所候链路 = **纯微任务**（`makeDrive` 注入假 `timer`/`clear` —— 零真实闩；无 I/O）⇒ 宏任务边界前微任务必然全部崩平，60ms 非概率量；且保断言精度（失败读数 = 具体断言串，非「until timeout」）。 |
| 4 | `settings.css:10` 档头自述「实读 **304** 行」滞后（本批 +2 行后现值 306） | 🔵 | **采纳 · 已改** | `:10` 随正「实读 **306** 行……（2026-10-10 #1039 增两行后随正）」——与 `SETTINGS.md:329` 注册值 **306** 同拍；改后复跑批内件 **10/10 绿**（duration ≈ 1.36s）。 |
| 5 | 两弃件出口同一运行内可出两帧同值状态帧（`suspension-drive.mjs:217 ∥ :232`） | 🔵（按设计 · 登记） | 维持 · 登记 | 按设计（§2.1 行 3「两出口…各补一次」）+ `emitState` = 快照整置幂等（window-queue.mjs:100-102）⇒ 镜面无害；**后续若立弃件径帧断言：按「≥1 状态帧 ∧ 末帧为状态形」立，勿立恰一帧**。 |

**终态 = clean**（评审轮 1 = pass；响应轮 = 收正 1 处（发现 4）+ 3 条不采纳/维持各带理由 + 1 条协调项在册；无 🔴 ∥ 无必改 🟡；无跨档编辑）。

改后复核读数：批内件 `node --test docs/batches/2026-10-10-desktop-behavior-residues.test.mjs` ⇒ `# tests 10 · # pass 10 · # fail 0`（2026-10-10 05:2x）。

**七、补记（回读核 · 2026-10-10 05:3x）**

- **上抛 ④（补，响应表发现 2 的正身）**：`suspension-drive.mjs:143` 直呼 `postQueue` 无守卫（与同档契约句 :36 相抵）——**既有面**，本批零触；候 = 父侧裁或另批收口（建议挂技术待办：二式择一 = 该行走 `queue.emit(...)` 单源守卫 ∥ 就地补 `typeof` 卫）。
- **他批件复跑计数收正**（正文「一句话」的 61/2 为含误红轮口径，正读如下）：并集 = **71 例 · 69 绿 · 2 红**——7 件（除 parity）= 62 例 · 61 绿 · 1 红（`server-public-structure` ① i18n 指纹 · 外因）∥ parity（带 `--import` 预载复跑）= 9 例 · 8 绿 · 1 红（T7 · 外因）；首跑 parity 的文件级「load 失败」= 漏预载**我侧误红**，不计入。
- **doc 面同拍核**：`settings.css` 修后实读 **306** = `SETTINGS.md:329` 注册值 ✓（发现 4 的收正闭环）。

## §6 验证与收口（父代理）

**交付物**：11/12 实施面 ✅（eng-coder #96；第 12 项 = 真机读数六项——走查面 · 登记待读）—— `#809` 标签色位 ∥ `#831` 台账歧义拒绝（锚句直传）∥ `#912` 弃件径链尾状态帧 + 计数收正 ∥ `#914` 回填收束帧门 ∥ `#979` 弹窗路由收口（`closeActiveModal` + `route()` 起点）∥ `#1039` 两滚动层 `scroll-padding-top` 同值 ∥ `#1041` 首启板交棒（分支前移 + 键预填）∥ `#1071` 两腿（父侧笔·前落）∥ `#805` 退役执行（任务查询 + 脚本 `Test-Path False` + `--smoke` exit 0；全文 22 行留档 §5）∥ 设计档随动 8 档 + 表外 1（`ACTIVITY.md:139`——披露）；批内件先红后绿 **10/10**。

**父侧验证读数**：批内件 **10/10 绿**（父侧实跑 · 1469ms）∥ 他批件复跑 8 件 = **71 例 · 69 绿 · 2 红（外因）**——**父侧随正一处**：parity 件 `:316` 断言随 `failure()` 记录形（`composer-wire.mjs:297` `failure: () => failed`；`#1121` 修③ 后记录对象 `{reason,kind,source}`）⇒ 该件复跑 **9/9 绿**（rc-resolve 预载）；余 1 红 = `2026-10-08-server-public-structure` ① i18n 指纹（#92 在飞面——待其落定复跑对勾）。

**评审终态**：advisor 代码评审 1 圆 = **pass**（🔴0 ∥ 🟡2 非必改 ∥ 🔵3）；响应轮收正 1 处（`settings.css:10` 自述行数 304⇒306，与 `SETTINGS.md:329` 同拍；复跑 10/10）；探索审计 1 圆（8 项一致；2 偏差 = §5 空〔本段补〕+ ACTIVITY.md 行数面〔披露〕）；终态 = clean。

**上抛处置**：① 真机读数六项（#809 CDP 标签 ∥ #1039 Tab 遮挡 ∥ #831 拒绝锚句 ∥ #979 零弹窗截图 ∥ #1041 VSC 交棒 ∥ #914 长会话回填）⇒ **登记待读**（用户走查面——不阻收口）∥ ② `suspension-drive.mjs:143` `postQueue` 无守卫 ⟷ 契约句 `:36`（生产装配恒注入 ⇒ 当前不可达）⇒ 入账（二式择一）∥ ③ parity T7 ⇒ 父侧已随正（见上）∥ ④ temp 件（红基线备份/探针/tap 读数）随 temp 区处置。

**结算**：#805 ∥ #809 ∥ #831 ∥ #912 ∥ #914 ∥ #979 ∥ #1039 ∥ #1041 ∥ #1071 ⇒ 核销（evidence = 本档 + 10/10 读数）。**待办**：波尾 scoped commit；真机六项走查（用户面）。
