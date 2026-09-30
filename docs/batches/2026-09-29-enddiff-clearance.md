# 2026-09-29 · enddiff-clearance（端差清算轮：旧登记十一项 + 受占切换半幅）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-29 · 来源 = 端差全表（#15）+ 用户 17:02 令——无批归属 ④-B 11 项（旧登记·无批无裁）+ ④-C2（受占切换半幅）。
> 台账 = #626–#637（端差清算 · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-29
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 本批（父侧 · 2026-09-29 17:1x）

- **来源** = 端差全表（#15 · ④-B 十一项 + ④-C2）+ 用户 17:02 令；授权 = 13:52 全权。
- **条目（12 行）**：**#626** 中断键两态 · **#627** 文件打开行定位 · **#628** `onTurnEnd ⊃ onSubTurnBreak`（核侧窄义钩子）· **#629** 审批卡形态整面 · **#630** `.sub-desc` 判据面 · **#631** 工具卡中断摘要形 · **#632** @ 文件引用缺面 · **#633** 入队即落盘 · **#634** 设置面失败面 S15 · **#635** 反向差五项 S16 · **#636** 右键菜单条目集 · **#637** 受占切换提示半幅。
- **父侧两裁入档**（先于设计轮定案）：① **#632**（附 B 张力）= 归「缺面族批补」（UI.md:383 为准；closeout §2.9 宿主例外定性不采——三件齐不成立：无宿主约束证据）② **#635** 与 D3 的 #617 同档（`settings-agent.mjs`——实施串行，届盘重读）。
- **口径**：逐项「现行 ⇒ 裁定（消向 ∥ 宿主例外三件齐）⇒ 修法 ⇒ 判据」；**默认方向 = 消（对齐 VSC 形）**；反向差（桌面独有）按先例（项目钮族「本端独有 ⇒ 保留零动」）逐项裁；B9 ∕ B10 = B10 批上抛 U1 ∕ U2 的承接裁定。

### 1.2 授权口径

- 设计 = eng-designer（§2，含逐项裁定）；实施 = eng-coder（评审 + 代签 §4 + token 后，按拆批）；真机腿 = 父侧探针。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（12 行逐条裁定 + 拆批 + 文件表 + 上抛（2.0–2.9）· 评审 #46 修正轮已落（逐号 1..7）· 批 C 文档随动轮已落（2026-09-29））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.0 本批覆盖与口径

- **覆盖** = 台账 #626–#637 十二行全数（逐条裁定见 2.1）；口径 = §1.1（默认消向 ∥ 例外三件齐 ∥ 反向差按项目钮族先例「本端独有 ⇒ 保留零动」，UI.md:168）。
- **届盘实读 2026-09-29 17:1x**（坐标 as-of，实施轮重锚）；**前置发现 F2（登记衰减）**：#626 ∕ #629 的旧登记句所述「现行」已被后批换装替代（输入面板上提批 ∕ 处理流 R1 换接核件）——逐行「现行」列如实标注，收正以届盘为准。
- **本轮零产品码改动**（本档 §2 为唯一交付面）；拆批建议见 2.2；受影响文件表见 2.3。

### 2.1 逐条裁定表（12 行）

| # | 现行（届盘实读 · file:line） | 裁定 | 修法（file:line） | 判据 |
|---|---|---|---|---|
| #626 | **已消解（前提不成立）**：桌面输入面板已换装核件工厂（`thincoder-desktop/renderer/mount-composer.mjs:47` `createComposerPanel`；VSC `webview/input.js:14` 同件）⇒ 中断键两态 = 核件 `thincoder-render-core/composer/panel.mjs:403-404`（`running` ⇒ `display:flex`；否则 `none`）——**两端同件同形（显 ∕ 隐）**，旧登记「桌面恒在+disabled」不成立。旧句 = `docs/desktop/design/UI.md:409`（P28，落点指「composerTree ∕ composerModel 增 busy」= 换装前形态）。 | 消（已达成）——零产品码；文档面收正 | ① `UI.md:409` 句收正（端差登记退场；两态 = 显 ∕ 隐，核件单源）；② `docs/desktop/design/PROJECT.md` T-DSK43 ③ 判据收正（**名面重锚——现盘 `:858`**；「非在飞 ⇒ disabled」⇒ 「非在飞 ⇒ 键隐」——见 F3）；③ 台账 #626 核销（父侧） | 文档面 = 两处无旧形残句；机检面 = 核件档既有（两分支随批单元证据，零新件） |
| #627 | 桌面 `file:open` = `shell.openPath` 无行参（`thincoder-desktop/src/main/ipc.mjs:239-244`）；`line` 载荷不施加（判据面 `file-links.mjs:31-34`，KD-39）；对位 VSC = 打开到行。 | **消（落外部编辑器 CLI 探测）** | ① 新档 `thincoder-desktop/src/main/editor-open.mjs`（≈60–90 行：候选探测 `code` → `code-insiders` → `cursor` → `subl`（`where` ∕ `which` 探测 + memo——沿 `settings-env.mjs` 探测先例 ∕ `shell-candidates.mjs:46` 同式；两臂返回形 = 命中 ⇒ 回显入口路径 ∕ 探测败（未命中）⇒ 空；**spawn 形 = Windows 经 `cmd.exe /d /s /c` 包装**（`where` 命中 `.cmd` shim ⇒ 直 spawn 不可靠——沿 `thincoder-core/mcp/transport-stdio.mjs:30` 先例）· 非 Windows 直 spawn）+ 命令行构造（argv 数组，零 shell 拼接））；② `ipc.mjs:239-244` `fileOpen` 出口 = **单一路径链**（与判据列同述）：命中 ⇒ spawn（参数含行——`--goto path:line`；subl = `path:line`）；未命中 ⇒ `shell.openPath` 兜底恰一次（现状零回归）；spawn 失败 ⇒ 兜底恰一次；全链失败（兜底亦败）⇒ `{ok:false, reason}` 直传（零静默）；③ 载荷形 ∕ 渲染面零改（`line` 既有）；④ 文档面：`UI.md:421` ∕ `:434①` 句收正、`PROJECT.md` §10 BH 行收正（登记（端差）⇒ 消解，沿 #626 ∕ #628 同式）——三靶挂批 B 文档随动清单（2.3） | 机检 = 纯函数面（候选表 ∕ argv 构造 + spawn 形臂：win32 ⇒ `cmd` 包装）+ 注入缝全链（命中 ⇒ spawn 参数含行 ∕ 未命中 ⇒ 兜底恰一次 ∕ spawn 失败 ⇒ 兜底恰一次 ∕ 全链失败 ⇒ `{ok:false, reason}` 零静默）；真机腿点名平台 = **Windows 机位**（有编辑器 CLI ⇒ 点到行；无 CLI ⇒ 系统默认程序兜底、无行定位——预期；非 Windows 机位（若有）= 直 spawn 径 + 同两臂预期）（U-B 确认） |
| #628 | 核 `onTurnEnd` 超集三支 = `thincoder-core/agent/completion.mjs:41/66/84/97/112/140`（六推回点）+ `post-turn.mjs:65`（工具批尾）+ `turn-loop.mjs:226`（工具期中断注入）；桌面 `agent-bridge.mjs:268` 挂 `onTurnEnd` ⇒ turnBreak；VSC `panel-callbacks.mjs:150` 定义 `onSubTurnBreak` 但**核零调用**（全仓实读）⇒ VSC turnBreak 死面（B1 迁移静默丢——**发现 F1**）。 | **消（核侧补窄义钩子）** | ① 核 `completion.mjs` 六点各增 `callbacks.onSubTurnBreak?.()`（零参可选调用——兼容形 = 与 VSC 既有定义同签名，缺省 no-op，CLI 零影响）；② 桌面 `agent-bridge.mjs:266-268` 映射改挂 `onSubTurnBreak`（窄义：中断注入不再产 turnBreak ⇒ 与 VSC 同「不断块」）；③ VSC 零码改（钩子复活——回归修复）；④ 文档随动 `UI.md:370/:434②` · `PROJECT.md` §10 BG · IPC.md `ev:activity` 触发面句 | 机检 = 核单测（六点各触恰一次；`post-turn` 与中断注入两点零触——负向锁）+ 桌面桥用例（`onSubTurnBreak` ⇒ `turnBreak`；`onTurnEnd` 不再产）+ VSC 面板用例（turnBreak 达 webview）；真机 = 推回续跑下片另起块（VSC 复读）· 中断注入两端不断块 |
| #629 | **已消解（前提不成立）**：审批卡已换接核件卡（`thincoder-desktop/renderer/views/approval.mjs:27/:232`；VSC `webview/permission.js:7/:23` 同件）⇒ 卡壳 `.permission-prompt` ∕ 类名 ∕ 操作区 `.permission-prompt-actions` 同源零差；端壳残留（键位胶水 ∕ 置焦锚 ∕ 大 diff 钮退场）皆在册。旧句 = `UI.md:434③`（换接前）。 | 消（已达成）——零产品码；文档面收正 | ① `UI.md:434③` 句退场；② `UI.md:22` 行内残句收正（「可见面修复批修」段 ∕ 「changes 超阈 ⇒ 摘要+计数」句——核卡时代由 `.diff-preview` 全量渲染 + `.view-diff` 退场承载）；③ `UI.md:93` ∕ `:575` 顺笔收正（见 F4）；④ 台账 #629 核销 | 机检 = 卡构造单源（`views/approval.mjs` 零自建卡体）；文档面 = 收正句在位、无 headNode ∕ 超阈残句 |
| #630 | 桌面 `.sub-desc` 判据 = 族容器内 DOM 探针（`thincoder-desktop/renderer/views/pool-subagents.mjs:87`）：族零 `.sub-block` ∧ 无 `.sub-desc`；族容器随会话换代 ∕ 零块帧弃账（`views/activity.mjs:109-112`）⇒ **可跨会话重插**∥ VSC = 面板级旗标（`thincoder-vscode/webview/state.js:42` `_subDescShown`；`activity.js:53-59`；不随 `resetActivity` 复位）。登记 = `UI.md:316`（待裁）。 | **消（对齐 VSC 面板级）** | `views/pool-subagents.mjs:85-95`：判据改挂载根级旗标（`root._subDescShown` 一次置位不重置——root 跨会话 ∕ 跨族重建恒在；app 重载 ⇒ 新 root 归零 = VSC webview 重载同判）；插入点 ∕ 元素形零改；`UI.md:316` 句收正（待裁 ⇒ 已裁 = 消） | 机检 = 视图用例（首枚块出生 ⇒ `.sub-desc` 恰一；跨会话切换 ∕ 零块重建后再出生 ⇒ 零重插——负向锁）；真机 = 切会话后新子 agent 不再重出说明行 |
| #631 | 桌面中断工具卡：状态词 = `tool.interrupted`（`renderer/views/chat-tool.mjs:38`；清扫 = `events-blocks.mjs:132`）；摘要半截缺 ∥ VSC 硬编码 `→ (interrupted)`（`webview/streaming.js:104-113`；与状态词双承载）。登记 = `UI.md:366`。 | **消（补齐摘要半截）** | `views/chat-tool.mjs:97-110` `headSegments`：`status === "interrupted"` ⇒ 摘要槽值 = `(interrupted)`（值源 = VSC 逐字；`→ ` 前缀由既有摘要段格式自带；覆盖 `formatToolSummary` 派生——与 VSC 清扫覆盖同判）；`UI.md:366` 句收正 | 机检 = 视图用例（中止未结算卡：状态段 = 已中断 ∧ 摘要段 = `→ (interrupted)` 逐字；已结算卡零改写）；真机 = 与 VSC 同刻对照 |
| #632 | **缺面（缺陷）**：桌面零 @ 引用注入（`fileRef|at-ref|stripAtRefs` 全树零命中）∥ VSC `src/extension/file-refs.mjs:9/:58`（注入 = `panel-chat.mjs:187`；显示剥离 = `panel-session.mjs:185`；标题源 = `panel-session-write.mjs:139`）。桌面 @ 补全（下拉）**已在位**（`at:complete` 通道 ∕ 核件 atmenu——非缺项）。 | **父侧已裁 = 归「缺面族批补」**（UI.md:383 为准；宿主例外定性不采）——本轮零动作 | 批外（缺面族批补批）设计要点：① 上提候选 = `file-refs.mjs`（零第三方依赖，node:fs ∕ node:path）⇒ 核件 `thincoder-core/file-refs.mjs` 单源 + 两端薄壳（VSC 改指；桌面新接——落点届盘定：注入 = `src/main/turn-driver.mjs:207` 前；剥离 = 恢复面 ∕ 标题源三面同 VSC）；② 判据 = `@<存在文件>` ⇒ 模型输入含 `[File: …]` 围栏块 ∧ 落盘消息携注入形；活面气泡 ∕ 恢复面 ∕ 标题源 = `@path` 简洁形；不存在 ⇒ 原样 | 归批后于补批判据（本轮仅登记 + 要点） |
| #633 | 桌面队条目携图 = 宿主内存 dataURL（`src/main/queued-input.mjs:2-4`；快照不含图 `:39`）；落盘 = 送达面 `attachments.mjs:60-74` ∥ VSC = 入队即 `savePastedImages`（`panel-messages.mjs:154/:159`——路径条目）。登记 = `PROJECT.md` §10 BM。 | **保留零动（不判缺陷；给由）** | 零动作；`PROJECT.md` §10 BM 行补裁注 | 由 = **零用户可见差**——两端送达结果同（路径 + `[Attached images: …]` 指针 + `read_image`）；两端队列皆运行期内存（重启即失）；差仅 = 写盘时机（端实现形态）+ VSC 形另携入队期孤儿文件面。触发条件维持（用户裁定 ∥ 内存面实测越线 ⇒ 另批；届批成本 = 队条目改路径条目 + 队清 ∕ 中止清理面扩——U-F 备选在册） |
| #634 | 桌面失败面 = `settings.notice { scope, text }`（`views/settings.mjs:253-261`；段标 = 段名闭集 `:66-67`；码表 = `REASON_WORD :49-64`，表外原样直传）+ 面板态驻留 ∥ VSC = 顶部 banner 裸串 + 6s 自散 + 面板关时静默丢弃（`webview/settings.js:61-72`；入线 = `chat-messages.js:153`）。上抛承接 = b10 U1。 | **消（方向 = VSC 向桌面形收正）** | **本批交付面 = 仅台账登记（承接 = 台账新行 ∕ 父侧入册）；设计档零动、产品码零动**。VSC 侧（另轮——承接同上）：`webview/settings.js:61-72` 改段标 + 词化码 + 不自散（或至少关面板不丢）；入线需结构载荷（scope ∕ code）——扩展侧失败面随动（届盘核）；桌面侧零动。备选（评审 ∕ 父侧如改裁「桌面向 VSC 形收正」）⇒ 落点 = `views/settings.mjs:253-261` 删段标 ∕ 码表 + 6s 自散（信息降级——U-A） | 判据 = 两端失败面同形（段标 + 词化码 ∕ 不静默丢）——**本批不可验**（随 VSC 侧批落时核） |
| #635 | 反向差五项在盘：泛化兜底行（`views/settings-agent.mjs:135-160` ∕ `:219-222`）+ **删键残**（`mount-settings-segments-agent.mjs:31-33/:34-40/:95-99`——数字行「空 ∕ 非数 ⇒ 零发送」残留；主侧 `settings.mjs:308` null ⇒ 删键已落）· 语言切换（`views/settings.mjs:72-78`）· 渠道档位（`views/settings-sections.mjs:173-188`）· autoThink（`views/settings-agent.mjs:62`）· 手 Verify（`src/main/providers.mjs:152-159`）。VSC 五项皆无（autoThink = VSC 侧 #17 在册）。 | **五项本体 = 保留零动；删键残 = 消** | ① 五项本体零动（由 = 对位令单向（VSC 有 ⇒ 桌面必有；反向未含——需求 §3.6）∥ 项目钮族先例）；② 删键残消：`mount-settings-segments-agent.mjs:34-40`（`rowValue`）∕ `:95-99`（`namedOut`）数值行「空 ∕ 非数 ⇒ `undefined`（零发送）」改「空 ∕ 非数 ⇒ `null`（显式清除 ⇒ 删键回退默认）——对齐 VSC `settings-agent.js:96/:102` 逐字」+ 残句 `:31-33` 收正；③ `UI.md:398-400` ∕ `:403` 收正；④ 与 #617 串行 = 同设置面轮同波（本行落 `mount-settings-segments-agent.mjs` ∕ #617 落 `views/settings-agent.mjs`——不同档、同波串行） | 机检 = 写路用例两臂（空 ∕ 非数 ⇒ 盘键删 + 回读 = 默认值；合法值 ⇒ 写）；五项本体 = 复读在盘；U-D 确认 |
| #636 | 桌面右键菜单 = KD-43 ∕ D27 逐字：可编辑四件 ∕ 选中两件 ∕ 空选零菜单（`src/main/context-menu.mjs:48-60`）∥ VSC = VS Code 工作台内建 webview 菜单（三件 ∕ 无全选——宿主面，扩展零代码；本机构建实读在册）。登记 = `PROJECT.md` §10 BU（待真机比对裁）。 | **保留零动（给由）** | 零动作；`PROJECT.md` §10 BU 行补裁注（「待真机比对裁」⇒ 裁定）；KD-43 不动 | 由 = ①两端菜单各由**宿主**渲染（VS Code 工作台 ∕ Electron 原生）——「消」在 VSC 侧不可达（扩展改不了工作台菜单）；②「全选」 = 反向差（桌面独有，D27 需求位）⇒ 保留零动先例；③空选零菜单 = Chromium 原生约定（无可用动作 ≠ 列灰件）；走查如另有口径 ⇒ 按需求档笔权（主 agent）收正 |
| #637 | 桌面受占切换 = 零消费 `slotOccupancy`（`src/main/session-slots.mjs:64` 转口在盘）；`session-actions.mjs:44-47` 直调 `switchToSlot` ⇒ 切换成立（核内建：受占不认领 + 次存 fork——`thincoder-core/session-lifecycle.mjs:334-342`）但**零告知** ∥ VSC 拒 + 告知（`panel-messages-session.mjs:51-57`）· CLI 提示 + 继续（`cmd-session.mjs:118-120`）。 | **消（补「警告」半幅——CLI 形：切换成立 + 警告）** | ① `session-actions.mjs:44-47` `switchSession` 增 `slotOccupancy` 前置读（经 `./session-slots.mjs` 转口——零算法副本）⇒ 回执增键 `occupied: true`（非受占 ⇒ 键缺席）；② `renderer/mount-sessions.mjs:307-315` `openResult` 受理支：`receipt.occupied === true` ⇒ `showToast(t("session.occupied"))`（既有 toast 设施——沿 `session.openFailed` 先例 `:311`）；③ `renderer/i18n.mjs` 增键 `session.occupied` 两语；④ 文档随动：IPC.md 会话族行回执增键 + `UI.md:28` 会话控制面行注 | 机检 = 动作层用例（受占 ⇒ `occupied:true` ∧ 切换仍成立；非受占 ⇒ 键缺席）+ 渲染面用例（`occupied` ⇒ toast 在场）；真机 = 双进程同项目：A 占 N ⇒ B 切 N ⇒ 切换成立 + 警告在场；词值 = U-E 核定 |

### 2.2 拆批建议（12 项按面拆 · 三批 + 两分流）

| 批 | 面 | 覆盖 | 说明 |
|---|---|---|---|
| **批 A · 核钩子** | 核件 + 两桥 | #628 | 独立小件（核一档六行 + 桌面桥一行映射）；先行（VSC 死面回归同修复——F1）；验收 = 批内件 + 三端复读 |
| **批 B · 桌面码面** | 桌面 main + renderer | #627 ∕ #630 ∕ #631 ∕ #635（代码半幅）∕ #637 | 同端串行；#627 含新档 `editor-open.mjs` + 文档三靶（`UI.md:421` ∕ `:434①` ∕ `PROJECT.md` §10 BH）；#635 删键残随 #617 同波串行（不同档）；#637 含 i18n 增键 + IPC.md 随动；验收 = 批内件 + 真机两腿（编辑器 CLI 机位（**Windows**——判据列命名）∕ 受占双进程） |
| **批 C · 文档面** | 设计档（eng-designer 笔 · 零产品码） | #626 ∕ #629 ∕ #633 ∕ #634 ∕ #635（文档半幅）∕ #636 | 收正句 + 裁注（UI.md ∕ PROJECT.md ∕ IPC.md）；#634 交付面 = 仅台账登记（设计档零动——VSC 侧批另轮）；#635 代码半幅见批 B（随 #617 同波） |
| **批外分流①** | 缺面族批补 | #632 | 父侧已裁归批；本批只登记 + 设计要点（2.1 行）；另批立批 |
| **批外分流②** | VSC 侧设置面批 | #634 对齐面 | 方向 = VSC 向桌面形收正（U-A 确认）；承接 = 台账新行（父侧入册） |

### 2.3 受影响文件表（行数 = 内容行口径 · 届盘实读 2026-09-29 17:1x；增量 = 设计预期，实施轮重锚）

**行数口径注（评审发现 6 · 口径统一）**：本表读数 = 内容行口径（文末换行不计——与文档机检行数面口径同式）；盘面读器显示（`split("\n").length`）对带尾换行档比本表系统 **+1**
（评审对账八档在册——左 = 本表 ∕ 右 = 读器显示：UI.md 708↔709 · PROJECT.md 1325↔1326 · IPC.md 411↔412 · ipc.mjs 322↔323 · agent-bridge 318↔319 · chat-tool 299↔300 · mount-sessions 406↔407 · i18n 393↔394）。
**统一口径 = 内容行口径**；实施轮按统一口径重锚（承表头句——届时逐档重读，不以读器显示为门）。

**批 A（#628）**：`thincoder-core/agent/completion.mjs` **147** ⇒ +6±2（六点各 +1 行）· `thincoder-desktop/src/main/agent-bridge.mjs` **318** ⇒ ±3（`:266-268` 映射改挂 + 注；**越 300 在册**——改面 = 映射改挂 + 注，不触发拆分窗口）· 批内件 `docs/batches/2026-09-29-enddiff-clearance.test.mjs`（新档 · ≈150–250）· 文档 `UI.md`（708）∕ `PROJECT.md`（1325）∕ `IPC.md`（411）句级收正（Δ≈0）。零改（参照面）：`thincoder-core/agent/turn-loop.mjs`（244）· `post-turn.mjs`（66）。
**批 B（#627 ∕ #630 ∕ #631 ∕ #635 代码半幅 ∕ #637）**：新档 `thincoder-desktop/src/main/editor-open.mjs`（≈60–90）· `src/main/ipc.mjs` **322** ⇒ +≤12（**越 300 在册**——改面 = 出口链 + 注，不触发拆分窗口）· `src/main/file-links.mjs` **34** ⇒ ±2（注）· `src/main/session-actions.mjs` **73** ⇒ +≤10 · `src/main/session-slots.mjs` **226** ⇒ ±0（转口已备）· `renderer/mount-sessions.mjs` **406** ⇒ +≤8（**越 300 在册**——改面 = 注 + 三行，不触发拆分窗口）· `renderer/views/pool-subagents.mjs` **127** ⇒ ±5 · `renderer/views/chat-tool.mjs` **299** ⇒ +≤4（**贴 300 线**——落笔后或越线，拆分债注见下）· `renderer/mount-settings-segments-agent.mjs` **154**（读器 155）⇒ ±5（#635 删键残——`:31-33` 残句 + `:34-40` ∕ `:95-99` 空 ∕ 非数 ⇒ null；随 #617 同波串行）· `renderer/i18n.mjs` **393** ⇒ +2（一 key × 两语；**越 300 在册**——改面 = 单键 +2 行，不触发拆分窗口；拆分母批（#614）已落——500 ⇒ 393）· 文档 `IPC.md` ∕ `UI.md` ∕ `PROJECT.md` 句级（#627 三靶：`UI.md:421` ∕ `:434①` ∕ §10 BH）。零改：`renderer/views/approval.mjs`（243）· `context-menu.mjs`（60）。
**批 C（文档面）**：`docs/desktop/design/UI.md`（708）· `docs/desktop/design/PROJECT.md`（1325）——句级收正（逐靶 = 2.1 行「修法」列），零产品码。
**拆分债注**：`chat-tool.mjs` 299 ⇒ 或越 300（顾问线）——预案 = 摘要段派生（`headSegments` ∕ `roundTag`）出档；消解窗口 = 批 B 落笔时（同批顺判）。`mount-sessions.mjs` 406 越线在册（前批登记——本批仅注 ∕ 三行）。核件 `panel.mjs` 440 行越线在册（本批零改）。

### 2.4 关键决策记录（含被否候选）

- **KD-EC-1 · #626 ∕ #629 = 登记衰减（消解）而非修复**：两行旧登记所述形态已被后批换装取代（输入面板上提 ∕ 处理流 R1 换接核件）——裁定按届盘（两端同件）判「已达成」，修法 = 文档面收正。被否：按旧登记字面补「桌面 disabled 两态」（造第三形态——违核件单源）。
- **KD-EC-2 · #628 钩子形 = 新增零参可选调用（`onSubTurnBreak?.()`）而非改 `onTurnEnd` 语义**：兼容形与 VSC 既有定义（`panel-callbacks.mjs:150`）同签名；缺省 no-op（CLI ∕ 桌面未接者零影响）；`onTurnEnd` 超集语义零改（VSC 推送腿依赖）。被否：①核改 `onTurnEnd` 窄化（破 VSC 推送腿 ∕ 桌面既有）；②桌面自消费 `onTurnEnd` 过滤「中断注入支」（端侧造判据——核面双写者）。
- **KD-EC-3 · #627 方向 = 消（探测）而非保留（宿主例外）**：`shell.openPath` 无行参（宿主证据在册），但探测可闭差异；探测 = 既有先例同族（`settings-env.mjs` shell 候选探测）。被否：①保留零动 + 宿主例外三件齐（登记为永久例外——与「尽可能消」令相抵；U-B 备选在册）；②URI 协议直开（`vscode://file/…`——硬绑单一编辑器，非通用）。
- **KD-EC-4 · #630 方向 = 对齐 VSC 面板级（消）而非保留会话级**：默认消向 + 无三件齐（旗标可跨族重建，无宿主约束）。被否：保留会话级「每会话重出说明行」（信息更友好但与 VSC 判据分叉——登记即「待裁」，本轮收口为消）。
- **KD-EC-5 · #631 摘要值 = VSC 逐字硬编码 `(interrupted)`（非词键）**：对齐判旨 = 同观感；先例 = `roundTag` 硬编码格式串（`chat-tool.mjs:75-83`「同 VSC 内联串」）。被否：词键化（zh 出 `→ 已中断`——与 VSC 逐字分叉，反造新端差）。
- **KD-EC-6 · #633 判「非缺陷（保留）」**：差异 = 写盘时机（端实现形态），两端用户可见行为逐点同（送达判决 ∕ 指针 ∕ 降级码 ∕ 重启即失）；触发条件维持。被否：按「形对齐优先」入队即落盘（新落盘面 + 孤儿文件 + 队清 ∕ 中止清理面——成本在册，U-F 备选）。
- **KD-EC-7 · #634 方向 = VSC 向桌面形收正**：桌面形 = 段标 + 词化码 + 面板态驻留（信息更全）；VSC 形 = 裸串 + 6s 自散 + 关面板静默丢弃（信息弱形）。消差 = 收敛到强形（沿 KD-B10-1 先例——方向按在册裁定 ∕ 信息面取舍，非机械「桌面必改」）。被否：桌面向 VSC 形收正（信息降级——U-A 备选在册）。
- **KD-EC-8 · #635 五项本体保留 + 删键残消**：五项 = 反向差（对位令单向未含）⇒ 保留零动；删键残 = 前批在册消解路（`UI.md:400`）的剩余半幅（主侧已落 null ⇒ 删键）⇒ 补渲染面半幅（空 ∕ 非数 ⇒ null）。被否：①五项全消（撤桌面能力——违零能力削减 ∕ 反向先例）；②删键残维持零发送（登记残句永挂——与 B10 W3 消解注相抵）。
- **KD-EC-9 · #636 保留（宿主面固有差）**：两端菜单 = 各宿主渲染面；「消」在 VSC 侧不可达；全选 = 反向差（D27 位）。被否：桌面改三件 ∕ 空选列灰件（削 D27 能力 ∕ 造噪声）。
- **KD-EC-10 · #637 形 = CLI 形（警告 + 继续）而非 VSC 形（拒 + 停）**：核 `switchToSlot` 受占语义 = 切换成立（非面板侧在册表述 = SESSION.md:41「切换成立（警告 + 继续）」）；桌面 ∕ CLI 同走核直转 —— VSC 形（拒）须端层前置门 + 回绑原槽（面板语义），桌面非面板对齐 = CLI。被否：VSC 形（改核受理语义 ∕ 端层造第二门——破「核直转」结构）。

### 2.5 验收对照（三链同源）

- **本批条目** = 台账 #626–#637（12 行）⟺ 本 §2.1 逐条表 ⟺ 设计档登记行（UI.md:316 ∕ :366 ∕ :370 ∕ :383 ∕ :409 ∕ :421 ∕ :434 ∕ §3 项 11；PROJECT.md §10 BG ∕ BH ∕ BM ∕ BU ∕ §7 T-DSK43）；**#634 交付面 = 仅台账登记（承接 = 新行 ∕ 父侧入册）、设计档零动**（其链节住台账面）。
- **判据面** = 2.1 各行「判据」列（机检 = 批内件逐条展开；真机 = 批 B 两腿 + 批 A 复读）；零散文锚；词键值 = U-E。
- **需求侧合规复核（发现两笔 · 非阻塞）**：① 需求档 §3.5 与 UI.md:168 的「本端独有 ⇒ 保留零动」句为口径引用而非重复（零动作）；② 桌面需求档未见「受占切换警告」明文条目——本批裁定 = 核侧 SESSION.md:41 承接（建议主 agent 随动一句——U-H）。

### 2.6 边界（不做）

- **零产品码**（本轮 = 设计轮；§2 为唯一交付面）。
- **不扩面**：#632 补面 ∕ #634 VSC 侧对齐 = 批外分流；他批在飞文件零触（**注**：`ipc.mjs` 有他批在飞观察史（b9 §164 他批观察①——工作树未提交改动）⇒ 批 B 届盘重读 + 串行）。
- **不发明**：#633 ∕ #636 的保留判定不引新机制；#635 删键残随 #617 同波不并行。

### 2.7 上抛项（父侧裁）

- **U-A** #634 方向确认：VSC 向桌面形收正（lean）∥ 桌面向 VSC 形收正（备选——信息降级）。
- **U-B** #627 探测设计确认：候选表（`code` → `code-insiders` → `cursor` → `subl`）∕ spawn 形 = Windows `cmd.exe /d /s /c` 包装（argv 数组零拼接）∕ 兜底 `shell.openPath`；如判越面 ⇒ 降「保留 + 宿主例外三件齐」登记。
- **U-C** #628 核面改动确认：新增 `onSubTurnBreak?.()` = 兼容纯加法；**副效 = VSC turnBreak 复活**（B1 遗留死面修复——F1）。
- **U-D** #635 删键残确认：消（空 ∕ 非数 ⇒ null ⇒ 删键）翻转 P14「零发送」半句——请父侧点头 ∥ 维持零发送另判。
- **U-E** #637 词键 `session.occupied` 两语词值核定（内容权）：建议 zh「该会话正被另一活进程使用——继续将在下次保存时创建新副本」∥ en「This session is in use by another live process — continuing will create a new copy on the next save.」（沿 CLI 语义 `cmd-session.mjs:119`）。
- **U-F** #633 保留判定确认；如坚持消向 ⇒ 成本清单在册（另批）。
- **U-G** #632 转批确认（父侧已裁归「缺面族批补」——本批登记 + 要点；另批立批）。
- **U-H** 需求档随动一句（主 agent 笔）：受占切换「警告 + 继续」桌面承接（沿 SESSION.md:41）。

### 2.8 发现（报告 · 含非阻塞项）

- **F1（回归 · 已入本批修）**：B1 迁移静默丢 VSC `onSubTurnBreak` 调用面 ⇒ VSC turnBreak 死面（webview `chat-messages.js:61` 处理面在盘、宿主钩子零调用者）；本批 #628 修（核补钩子）一并复活。
- **F2（登记衰减 · 四行）**：#626 ∕ #629 旧登记句「现行」已被后批换装取代（2.1 行已如实注）；#630 行内句仍标「待裁」；#633 登记为边界而非缺陷（其「另一裁」见 KD-EC-6）。
- **F3**：`PROJECT.md` T-DSK43 ③（**名面重锚——现盘 `:858`**）判据含旧 P28 形（「非在飞 ⇒ disabled」）——与核件两态（隐）相抵 ⇒ 收正靶（#626）。
- **F4**：`UI.md:22` ∕ `:93` ∕ `:575` 残句（headNode ∕ 「changes 超阈 ⇒ 摘要+计数」——核卡时代已失效）⇒ 收正靶（#629）。
- **F5**：`mount-settings-segments-agent.mjs:31-33` 残句（旧「不可达」口径与 B10 W3 消解注并存）⇒ 收正靶（#635）。
- **F6（口径面）**：「端差全表（#15）」四项（#626 ∕ #629 ∕ #630 ∕ #633）判据源为设计档登记文的字面表述——后批换装后登记文未随动 ⇒ 建议实施批收正时一律以届盘实读为准（沿 F2）。

### 2.9 记录块（决策落档）

- 本 §2 = 本批设计正文（12 行逐条裁定 + 拆批 + 文件表 + 决策 + 上抛）；设计档落点 = `docs/desktop/design/{UI,PROJECT,IPC}.md` 句级收正（随实施波落笔，逐靶 = 2.1 ∕ 2.3）。
- 决策落档 = 本档同日；实施 = 评审 → 代签 §4 → token 后按 2.2 拆批；批外分流（#632 ∕ #634）由父侧入册（台账）。
- 状态行 = 设计完成（2026-09-29）。

### §2 修正块（评审 #46 修正轮 · 2026-09-29 · eng-designer）

**来源** = 本档 §3 轮次 1（评审 #46：pass · 0🔴 ∕ 5🟡 ∕ 2🔵——逐号 1..7 全受理 · 父侧已逐条裁定）。**边界** = 文档面修正：`thincoder-desktop/**` ∕ `thincoder-core/**` ∕ `thincoder-vscode/**` ∕ `thincoder-render-core/**` 实现零触碰（只读核对）· 台账零触碰 · §1 ∕ §3–§6 零触碰；**不做** = 产品码零改 · §3 零改 · 不发起评审（发起权 = 父侧）。**形态** = 「段内就地订正 + 本块逐条记录」并用（订正点已在上文注明；行号 = 本块行之前坐标）。

**逐号落地（1..7）**

1. 【🟡 文档归属】#627 修法列补 ④ 文档面项（`UI.md:421` ∕ `:434①` ∕ `PROJECT.md` §10 BH——登记（端差）⇒ 消解）；三靶挂批 B 文档随动清单（2.2 ∕ 2.3）——批档 `:35` ∕ `:52` ∕ `:64`。
2. 【🟡 行为单值】#627 修法② ∥ 判据列统一为单一路径链：命中 ⇒ spawn（参数含行）；未命中 ⇒ 兜底恰一次；spawn 失败 ⇒ 兜底恰一次；全链失败 ⇒ `{ok:false, reason}` 直传（零静默）——两列同述；批档 `:35`。
3. 【🟡 spawn 形】#627 修法① 明定平台形（Windows 经 `cmd.exe /d /s /c` 包装——沿 `thincoder-core/mcp/transport-stdio.mjs:30` 先例；探测先例补引 `thincoder-core/shell-candidates.mjs:46`；两臂返回形 = 命中 ⇒ 回显入口路径 ∕ 未命中 ⇒ 空）；判据列真机腿点名平台（Windows 机位两臂 + 非 Windows 兜底预期）；连动 = 2.2 批 B 腿名 ∕ U-B 行——批档 `:35` ∕ `:52` ∕ `:96`。
4. 【🟡 归属】2.3 批 B 补 `renderer/mount-settings-segments-agent.mjs`（**154** ⇒ ±5 类注——#635 删键残；评审读数 155 = 读器显示侧，沿 6 号口径注统一）；2.2 批 B 覆盖列补 #635（代码半幅 ∕ 随 #617 同波）；批 C 行收正（#635 = 文档半幅）——批档 `:52` ∕ `:53` ∕ `:64`。
5. 【🟡 层线】三档补层线判（沿 mount-sessions ∕ chat-tool 注形）：`ipc.mjs` 322（越 300 在册——改面 = 出口链 + 注）· `agent-bridge.mjs` 318（越 300 在册——改面 = 映射改挂 + 注）· `i18n.mjs` 393（越 300 在册——改面 = 单键 +2 行；拆分母批 #614 已落）——皆不触发拆分窗口；批档 `:63` ∕ `:64`。
6. 【🔵 漂移】收正靶按名面重锚：`PROJECT.md` T-DSK43 ③（**现盘 `:858`**）——#626 修法② + F3 两处；2.3 增行数口径注（本表 = 内容行口径 ∕ 读器显示系统 +1 ∕ 统一口径 = 内容行口径 ∕ 实施轮重锚）——批档 `:34` ∕ `:59` ∕ `:108`。
7. 【🔵 闭环】① #634 本批交付面点名（**仅台账登记 ∕ 设计档零动、产品码零动**）——#634 行 ∕ 2.2 批 C ∕ 2.5 链三处；② `UI.md:548 邻域` 撤出 2.5 覆盖列（实核归属 = parity-b10-ui S3 条目——上抛行 = `PROJECT.md` §10 CG（`:1028`）· 消解路 = 宿主采样器面另轮 ⇒ 非本批 12 行任一靶面）——批档 `:42` ∕ `:53` ∕ `:83`。

**未做 ∕ 披露**：无未做项（1..7 全落）；披露 = ① 口径注沿用机检行数面既有口径（内容行）——评审对账「系统 −1」按读器显示侧收正为 +1 表述；② 连动 3 处（探测两臂 ∕ U-B ∕ 批 B 腿名）皆自 3 号导出，零新语义；**头行重字 ∕ 句末「。。」= 父侧已自办（非本块面）**。

**读回核实（D6）**：18 处改点逐处读回在案；本轮只写本档（零产品码 · 零设计档 · 零台账）。

### 批 C 文档随动（2026-09-29 · eng-designer · 端差清算轮）

**轮次** = initial（文档面随动）；**写域** = `docs/desktop/design/{UI,PROJECT,IPC}.md` 句级收正 ∕ 裁注（零产品码 · 零他档 · 零新语义 · 不发起评审——父侧门）。行号 = 落笔后届盘实读（UI.md **714** 行 ∕ PROJECT.md **1369** 行 ∕ IPC.md **415** 行——读者显示口径）。

**逐处表（档 → 落点 → 落值）**

| 档 | 落点 | 落值 |
|---|---|---|
| UI.md | :22 审批呈现行 | 超阈残句 ∕ 可见面修复段退场 ⇒ **核卡直消费句**（`.diff-preview` 全量渲染 ∕ `.view-diff` 单径留钮走 `file:open`、`apply_patch` 形钮退场——处理流 R1 换接） |
| UI.md | :28 会话控制面行 | 补**受占件**（目标槽受占 ⇒ 切换仍成立 + toast `session.occupied`；回执增键 `occupied` 载波——#637） |
| UI.md | :90 ∕ :92 ∕ :95（文本段间隔项） | **审批卡首行条退场**（四处 ⇒ 三处——:93 行删）· 池条目坐标收正 | `pool-tree.mjs:102` |
| UI.md | :315（R10 面） | 存差登记退场 ⇒ **消差落定**（判据 = 挂载根级旗标 `root._subDescShown`——与 VSC 面板级同判——#630） |
| UI.md | :365（工具卡中止清扫项） | 端差登记退场 ⇒ **摘要段** = 逐字 `(interrupted)`（值源 = VSC `streaming.js:111`——#631） |
| UI.md | :368 ∕ :369（turnBreak 项） | 钩子改挂 `onSubTurnBreak`（窄义——六推回点）+ **前提差消解句**（#628） |
| UI.md | :402（设置面·agent 形态项） | 端差裁注（泛化兜底行 = 反向差·**保留零动**——#635） |
| UI.md | :408（P28 中断键两态） | 两态 = **显 ∕ 隐**（核件 `thincoder-render-core/composer/panel.mjs:404` 单源——#626） |
| UI.md | :417 ∕ :420（相抵②·文件链接点开项） | 行参面收正 + 端差登记退场 ⇒ **消解**（CLI 探测 `code`→…→`subl`；未命中兜底——#627） |
| UI.md | :432 邻域 | **「E. open / 上抛」三项全消解 ⇒ 段退场**（① #627 ∕ ② #628 ∕ ③ #629） |
| UI.md | 变更记录 :712-713 | 本批一行 |
| PROJECT.md | :884（§7 T-DSK43 ③） | 判据收正——「非在飞 ⇒ `disabled`」⇒ **「非在飞 ⇒ 键隐」**（核件两态——#626） |
| PROJECT.md | :1027（§10 BG） | **已消解**（核增窄义钩子——#628） |
| PROJECT.md | :1028（§10 BH） | **已消解**（CLI 探测；`editor-open.mjs`——#627） |
| PROJECT.md | :1033（§10 BM） | **保留零动**裁注 + 由（零用户可见差——#633） |
| PROJECT.md | :1041（§10 BU） | **保留零动**裁注 + 由（宿主面固有差——#636） |
| PROJECT.md | 变更记录 :1367 | 本批一行 |
| IPC.md | :15 ∕ :42 ∕ :49 ∕ :60 | `ev:activity` `turnBreak` 触发面句收正（`callbacks.onSubTurnBreak`——窄义钩子；#628） |
| IPC.md | :108（§2 会话族行） | 回执增键 **`occupied: true`**（受占切换件——#637） |
| IPC.md | 变更记录 :414 | 本批一行 |

**范围口径（披露 1）**：dispatch 列举 10 靶；按「已知事实①：逐靶 = §2 各条 ④ 文档面项 + §2 修正块」补落同批其余文档靶（#628 的 UI.md:368/:369 ∕ PROJECT §10 BG；#629 的审批呈现行 ∕ 文本段间隔项 ∕ 审批卡形态行；#635 的 :402；#637 的会话控制面行 + IPC 会话族行；#627 的 :417）——全部限三档内、逐条可溯（零新语义）。

**追加两处（一致性面 · 已落 · 披露 2）**：① `UI.md:417` 行参面（#627 裁定直接导出——KD-EC-3 宿主例外方向被否，:417 原句与之相抵）；② `UI.md:92` 坐标收正（`activity.mjs` ⇒ `pool-tree.mjs:102`——死指针）。

**未列入本轮（在盘仍旧 · 披露 3——他轮 ∕ 另判）**：`UI.md:93` 计划行条（`plan.mjs` `rowNode` 已不存在——计划卡核件直消费后内容级陈旧）· `PROJECT.md:79` KD-39（「行参不施加」句与 :1028 已消解相抵）· `PROJECT.md:530`（agent-bridge 行「`onTurnEnd` ⇒ `turnBreak`」）· `PROJECT.md:863` T-DSK21（审批 patch 超阈句）· 档外 `docs/vsc/design/WEBVIEW-PROTOCOL.md:122`（`onTurnEnd` 引）。`IPC.md:377` ∕ 各档变更记录历史行 = 记录面（保留）。

**披露 4**：`UI.md:408`（原 :409）为在册红行改面（536 ⇒ 612 字符）——非新增红（该行基线即 >300）。

**机检（`node scripts/doc-check.mjs` · 落笔后）**：悬空 **161**（= 届盘基线 161——**零新增**）· 行宽 **82 行**（= 基线 82——**零新增**；本批写域差集为空，UI.md 红行集仅按删除位移）· 行数面差异 4 条（turn-driver ∕ turn-face ∕ session-slots ∕ chat-guide——**非本批**）。**本批写域零新增红** ✓。

**读回核实（D6）**：20 处落点 + 行宽复测逐处读回在案（含 :315 一处行宽自检回归已当场收正 309 ⇒ 296）。

**边界**：零产品码 · 零他档 · 不发起评审（父侧门——应 dispatch 口径）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

设计评审 · 对象 = 端差清算轮设计（§2 全量：#626–#637 十二行裁定+修法 + 三批分批 + U-A–U-H 上抛 + F1–F6 发现）
审读 = 档全读 + 盘面抽样复核（约 20 处 file:line 核对：completion.mjs ∕ post-turn.mjs:65 ∕ turn-loop.mjs:226、panel-callbacks.mjs:150、panel.mjs:403-404、UI.md:22/93/316/366/370/383/398-400/403/409/421/434/548/575、PROJECT.md §10 BG/BH/BM/BU ∕ §7 T-DSK43、ipc.mjs:239-244、file-links.mjs:31-34、chat-tool.mjs:38/97-110、pool-subagents.mjs:85-95、activity.mjs:105-118、mount-sessions.mjs:307-315、session-actions.mjs:44-47、session-slots.mjs:64、session-lifecycle.mjs:334-342、settings.mjs:49-67/253-261、settings-agent.js:93-108、context-menu.mjs:48-60、queued-input.mjs:2-4/39、streaming.js:104-113、state.js:42、permission.js:7/23、input.js:14）——前提性结论（#626 ∕ #629 换装已达成、#628 核零调用 ∕ VSC 死面、#630 VSC 面板级旗标、#631 VSC 逐字串、#633 内存队形、#635 主侧删键已落 ∕ VSC null 径、#636 KD-43 条目集、#637 核受占=切换成立）均实读相符。

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | 文档归属（覆盖闭环） | 🟡 | #627「修法」列 ①②③ 全为产品码、无文档面项：其登记句无一获认领——`UI.md:421`「端差登记：VSC 打开到行；桌面打开能力 = 系统默认程序（行参不施加）…消解路 = 外部编辑器 CLI 探测」、`UI.md:434` ①「桌面打开文件的**行定位**（C2 端差）——消解路 = 外部编辑器 CLI 探测」、`PROJECT.md:1002` §10 BH「登记（端差）…消解路 = 外部编辑器 CLI 探测（另裁）」；而 2.5（批档 `:79`）已把 UI.md:421 ∕ §10 BH 列入覆盖 ⇒ 实施后三句陈留（登记态与已实现态相抵）。其余 11 行皆有显式文档靶（#626①/#628④/#629①②③/#630/#631/#633/#635③/#636/#637④）。 | 在 #627「修法」列补 ④ 文档面项：`UI.md:421` ∕ `:434`① 句收正、`PROJECT.md` §10 BH 行收正（登记（端差）⇒ 消解，沿 #626/#628 同式），并把三靶挂入批 B 文档随动清单。 |
| 2 | 验收判据（自洽） | 🟡 | #627 同行两说：修法② 写「零命中 ∕ **spawn 失败 ⇒ `shell.openPath` 兜底**（现状零回归）」，判据却写「注入缝三臂（… ∕ **spawn 失败 ⇒ `{ok:false, reason}` 零静默**）」——同一事件的期望行为不同（兜底起跑 ∥ 失败回执），实施者无法同时满足两列。 | 统一为单一路径链并在两列同述：命中 ⇒ spawn（参数含行）；未命中 ⇒ 兜底恰一次；spawn 失败 ⇒ 兜底恰一次；全链失败（兜底亦败）⇒ `{ok:false, reason}` 直传（零静默）。 |
| 3 | 可行性（平台面） | 🟡 | #627 修法① 只写「候选探测…（`where` ∕ `which` 探测 + memo）+ 命令行构造（**argv 数组，零 shell 拼接**）」，未定 spawn 形：Windows 上 `code` ∕ `cursor` ∕ `subl` 多为 `.cmd` shim（`where` 命中 `…\code.cmd`），直 spawn 的可行性未验证（`.cmd` 直 spawn 的 Node/Electron 侧限制 = 运行期行为，仓内不可验证）；仓内 Windows CLI 调用先例 = `cmd.exe /d /s /c` 包装（`thincoder-core/mcp/transport-stdio.mjs:30`），探测先例 = `execFile("where"` ∕ `"sh" -c command -v)`（`thincoder-core/shell-candidates.mjs:46`）。若直 spawn 即败 ⇒ 静默落 `shell.openPath` 兜底 ⇒ 机检全绿而真机「点到行」在 Windows 面全灭（真机腿未点名平台）。 | 在修法①/② 明定 spawn 形（Windows 经 `cmd` 包装，沿 `transport-stdio.mjs:30` 先例）与探测失败 ∕ 命中两臂返回形；真机腿点名测试平台（或写明非 Windows 机位走兜底及其预期）。 |
| 4 | 受影响文件表（完整性） | 🟡 | #635 产品码半幅无批归属 ∕ 无文件注：2.1 #635 修法② 落 `mount-settings-segments-agent.mjs:34-40 ∕ :95-99`，2.2 批 C 说明称「随批 B ∥ #617 同波」，但批 B 覆盖列 =「#627 ∕ #630 ∕ #631 ∕ #637」（无 #635，批档 `:52`），2.3 批 B 文件表亦无该档（批档 `:60`；盘面实读 155 行，未注行数 ∕ 增量）——与同表逐档带行数+delta 的形不一致。 | 2.3 补 `thincoder-desktop/renderer/mount-settings-segments-agent.mjs`（155 ⇒ ±5 类注），2.2 批 B 覆盖列补 #635（代码半幅）或注明改由 #617 波承载并给行号。 |
| 5 | 受影响文件表（层线） | 🟡 | >300 行被改代码档的拆分复核不齐：`ipc.mjs`（盘读 323 ∕ 设计 322，+≤12）、`agent-bridge.mjs`（319 ∕ 318，±3）、`i18n.mjs`（394 ∕ 393，+2）无拆分 ∕ 免拆注；同表对 `mount-sessions.mjs`（407）有「越 300 在册」、对 `chat-tool.mjs`（300）有拆分债注（批档 `:62`）⇒ 同批内层线标准不一。 | 对三档各补一句层线判（免拆理由 ∕ 债在册 ∕ 拆分窗口），沿 mount-sessions ∕ chat-tool 既有注形。 |
| 6 | 清晰性（数值漂移） | 🔵 | #626 修法②（批档 `:34`）与 F3（批档 `:104`）指 `PROJECT.md:843` T-DSK43；盘面实读该行在 `:858`（③ 含「非在飞 ⇒ `disabled`」句；`:843` = T-DSK27 行）。另：行数口径与盘面存在系统 −1（UI.md 708↔709 · PROJECT.md 1325↔1326 · IPC.md 411↔412 · ipc.mjs 322↔323 · agent-bridge 318↔319 · chat-tool 299↔300 · mount-sessions 406↔407 · i18n 393↔394；completion 147 ∕ session-actions 73 ∕ file-links 34 三档相符）。 | 收正靶按名面重锚（「T-DSK43 ③」）或改 `:858`；行数口径沿档内「实施轮重锚」句统一后再落笔。 |
| 7 | 覆盖表 ∕ 逐条表闭环 | 🔵 | 两处不闭环：① 2.2 批 C 覆盖列含 #634（批档 `:53`），但 2.1 #634 无本批文档靶（承接 = 台账新行 ∕ VSC 侧批；判据「VSC 侧批落时核」⇒ 本批不可验）；② 2.5（批档 `:79`）列 `UI.md:548 邻域` 为覆盖项，2.1 全部「修法」列无落该靶者（`:548` = parity-b10-ui 注 S3 条目邻域）。 | ① 给 #634 的本批交付面点名（如：仅台账登记、设计档零动）或补文档靶；② 给 `:548 邻域` 点名归属（某行 ∕ 新增注项），或从覆盖列移除。 |

档外注（无严重度）：记录头面「来源 = 来源 = 端差全表」重字 ∕ 句末「。。」——非 §2 目标面。
计数：🔴 0 · 🟡 5 · 🔵 2。
VERDICT: pass

## §4 用户批准（主 agent）

**用户批准（父侧代签 · 2026-09-29）**

- **依据** = 用户 2026-09-29 13:52「别等我了，自己跑完」+ 17:02「尽可能消除」令（代点火 + 代批准授权——本批即经此授权点火评审 #46）。
- **三条件核检**：① **评审 pass**——#46（0🔴 · 5🟡 · 2🔵 · pass；§3 在册）② **修正轮落地并经父侧核验**——#54 逐号 1..7 全落（§2 修正块在册）③ **凭证**——评审 #46 已通过（token 在手）。
- **批准射程** = 本批 §2 全量（#626–#637 十二行 + 三批分批 A ∕ B ∕ C）；**不扩面**（批外分流 #632 → `missing-face-family` 批 ∕ #634 = 台账行，均在册）。
- 〔父侧代签 · 记录在案 · 可 revert〕

## §5 实施记录（eng-coder）
**状态行**：实施完成（批 A+B 全落 · 批内件 13/13 · 审计 CLEAN · 评审 pass（0🔴）· fix 0 轮 · 终态 clean）



### 5.0 轮次与终态（eng-coder · 2026-09-29）

- 轮次 = initial（首实现轮）；终态 = **clean**（分歧审计 CLEAN · 代码评审 pass · fix round 0 轮）。
- 面 = 批 A（#628）+ 批 B 码面（#627 ∕ #630 ∕ #631 ∕ #635 代码半幅 ∕ #637）；#635 按父侧裁 (a) 保守形落定（见 5.2）。

### 5.1 交付摘要（逐条 → 落点 → 读数）

| 项 | 落点（file:line · 内容行） | 落形 |
|---|---|---|
| #628 核钩子 | `thincoder-core/agent/completion.mjs:42/68/87/101/117/146`（147 ⇒ **154**）| 六推回点各增零参 `callbacks.onSubTurnBreak?.()`（各紧邻既有 `onTurnEnd` 行；+6 调用 + 注释 1） |
| #628 桌面桥 | `thincoder-desktop/src/main/agent-bridge.mjs:269`（318 ⇒ **319**）| 映射改挂 `onSubTurnBreak` ⇒ `ev:activity{event:"turnBreak"}`；`onTurnEnd` 摘挂（桌面全树零其它引用） |
| #628 VSC | 零码改（`panel-callbacks.mjs:150` 定义 + `webview/chat-messages.js:61` 处理在盘）| 钩子复活（F1 修复）；批内件 A4 端到端证 `turnBreak` 达 webview |
| #627 新档 | `thincoder-desktop/src/main/editor-open.mjs`（新 · **131**）| 候选探测 `code→code-insiders→cursor→subl`（`where` ∕ `sh -c command -v`；成功 memo ∕ 在飞去重 ∕ 绝不抛）+ argv 纯函数（`--goto path:line` ∕ subl `path:line`）+ spawn 形（win32 非 `.exe` ⇒ `cmd.exe /d /s /c` + `windowsVerbatimArguments` + 核 `quoteArg` 单源；余直 spawn）+ 双注入缝 |
| #627 链 | `thincoder-desktop/src/main/ipc.mjs:246-251`（322 ⇒ **330**）| 单一路径链：命中 ⇒ spawn（含行）∕ 未命中 ⇒ 兜底恰一次 ∕ spawn 败 ⇒ 兜底恰一次 ∕ 全链败 ⇒ `{ok:false,reason}` 直传 |
| #627 注 | `thincoder-desktop/src/main/file-links.mjs:26-30`（34 ⇒ **34**）| `line` 施加面收正（探测径 ∕ 未命中无行参 = 预期） |
| #630 | `thincoder-desktop/renderer/views/pool-subagents.mjs:89-92`（127 ⇒ **130**）| `.sub-desc` 判据迁挂载根旗标 `root._subDescShown`（一次置位不重置）；插入点 ∕ 元素形零改；旧族内 DOM 探针退场 |
| #631 | `thincoder-desktop/renderer/views/chat-tool.mjs:100-101`（299 ⇒ **300**）| `status==="interrupted"` ⇒ 摘要槽值逐字 `(interrupted)`（`→ ` 前缀由既有段格式自带；值源 = VSC `streaming.js:111`）；已结算零改写 |
| #635 | `thincoder-desktop/renderer/mount-settings-segments-agent.mjs:30-34/40/100`（154 ⇒ **156**）| 父裁 (a)：数值行零发送**维持**（`undefined`）；残句收正（写入「数值键 null 被核类型表拒」事实）；形状表键族 null 面零动 |
| #637 动作层 | `thincoder-desktop/src/main/session-actions.mjs:48/52`（73 ⇒ **79**）| `slotOccupancy` 切换前前置读（经 `./session-slots.mjs:64` 转口 —— 零算法副本）⇒ 成立回执增键 `occupied:true`（非受占键缺席；槽缺失败信封无键） |
| #637 渲染面 | `thincoder-desktop/renderer/session-wire.mjs:106`（194 ⇒ **199**）| 受理支 `receipt.occupied===true` ⇒ `showToast(t("session.occupied"))`（沿 `session.openFailed` 先例） |
| #637 词面 | `thincoder-desktop/renderer/i18n-views.mjs:80/:224`（328 ⇒ **332**）| `session.occupied` 两语（值 = U-E 核定逐字） |
| 批内件 | `.thincoder/tmp/2026-09-29-enddiff-clearance.test.mjs`（新 · **509**）| 13 用例（A1–A4 · B1–B8+B6b）；跑法 ∕ 运行器面注在档头 |

### 5.2 决策与偏差（透明表）

| 项 | 设计 ∥ 现盘 | 处置 ∕ 法源 |
|---|---|---|
| #637 落点重锚 | 设计坐标 `renderer/mount-sessions.mjs:307-315` ∕ `renderer/i18n.mjs` ⇒ 实落 `renderer/session-wire.mjs:96-110` ∕ `renderer/i18n-views.mjs:78-80/:222-224` | #42 结构轮已把接线面迁出 ∕ 词族第二档为在册增键面；沿设计「坐标 as-of，实施轮重锚」句 —— 语义逐点一致，判**重锚**（审计复核同判） |
| #635 保守形 | 设计修法②「数值行 ⇒ `null`（删键回退默认）」前提**实测不成立**：核 `_checkKnownKeyValue` 类型表对数值已知键 `null` 抛错（实测 `agent.maxTurns` ∕ `agent.poolLimits.engCoder` ∕ `agent.consultTurns` 三键 `ok:false reason="expects number — got null"`、盘零写；`UI.md:400` 原文同判）| **父侧裁 (a)**：撤回数值行改动（零发送维持）+ 仅 F5 残句收正（`UI.md:400` 为法源）；核清除形扩族 = **另批**（父侧已立账）；批内件 B6/B6b 双锁（零发送 + 主侧数值 null 拒之事实） |
| i18n 键落点 | 设计写 `renderer/i18n.mjs` 增键 ⇒ 实落 `renderer/i18n-views.mjs`（+4 行 vs 设计 +2 —— 两语各一行注）| 在册词族分档（`session.*` 族住第二档、合并点仍 `HOST_DICT`）—— 键解析可达（批内件 B8 断言）；链值未续（评审 🔵，沿链自身惯例） |
| 尺寸 | `editor-open.mjs` 131 行（设计估 ≈60–90）· 批内件 509 行（设计估 150–250） | 超估已披露：注释密度对齐档风 ∕ 假 DOM harness + 稳定化处置；预算 ≤300 ∕ 无越线档 |
| 真机腿 | 设计 = 父侧探针（Windows 编辑器 CLI 点位 ∕ 受占双进程）| 本舱不可跑（无 Electron 真机）——如实入披露 |

### 5.3 机检读数（命令 + 结果）

- 批内件：`node --test .thincoder/tmp/2026-09-29-enddiff-clearance.test.mjs` ⇒ **pass 13 ∕ fail 0**（标准形 12 连全绿；另 `--test-isolation=none` 8 连全绿）。
- 既有锁件复跑（16 件 · 改前 ∕ 改后同跑器）：**改前 13/16 绿 ⇒ 改后 11/16 绿**。新增 2 红 = 设计面必然：① `2026-09-29-structure-split-round.test.mjs` B3（迁出块逐字 163 行 ⊃ `openResult`，#637 改动内）② `2026-09-29-i18n-split.test.mjs` A1/A2/A4（冻结值 `VIEWS_DICT` 124 ⇒ 125 · `HOST_DICT` 294 ⇒ 295 · i18n-views 328 ⇒ 332）。**重锚处方**（父侧收位面，先例 =「断言随动 = 父侧」）：B3 基线 `2026-09-29-structure-split-round.baseline.json` `mount.block` 重冻 = 现盘 167 行（起始行 `session-wire.mjs:33`）；i18n-split 基线两语插入 `session.occupied`（`session.deleteConfirm` 后）+ A1/A4 计数随动 + A2 基线序列 +1 条 ∕ 语。
- 他域改前红 3 件（**不修，归因**）：`parity-b1-vsc-core` G6/G7（VSC setup.mjs 行数 298≠299 + 子进程腿）· `core-hygiene-p2` D1/D4（逐字搬移核——后批改动）· `2026-09-28-desktop-subblock-follow` ①/②（核 `initBlockFollow` 四监听 + 手势门换代 —— render-core 域）。
- `node --check` 11 个改档 全 OK；`node scripts/doc-check.mjs`：零处提及本批改档（**零新增红**）；存量 FAIL = 锚 160 悬空 ∕ 行宽 82 行（他域在册）+ 行数差异 1 条（`views/chat.mjs` 284⇒290，非本批）。

### 5.4 披露 ∕ 未做

- **运行器面（新发现）**：本机 Node 24 `node --test` 子进程报告面 stdout 帧竞争 —— 用例内 `console.log` 达量时运行器偶发 `Unable to deserialize cloned data`（用例全绿仍报红；同机既有锁件 `render-perf` 亦罕发一次）；处置 = 批内件读数改走 `process.stderr.write`（12 连稳定），另稳形 `--test-isolation=none`（档头在册）。
- 未做（面外，如实在册）：真机腿（父侧探针）· 文档靶（`UI.md` ∕ `PROJECT.md` ∕ `IPC.md` 随动句 —— 批 C ∕ 另舱，本舱零触）· `#635` 核清除形扩族（另批）。
- 批内件暂存 `.thincoder/tmp/`（终位 `docs/batches/2026-09-29-enddiff-clearance.test.mjs` —— 父侧收位；诊断件 `zz-*` 已全清）。
- 越表改动（如实披露）：`renderer/session-wire.mjs` ∕ `renderer/i18n-views.mjs` 两件（= 5.2 重锚；设计表外但为设计面必然）。

### 5.5 审计与评审（内部轮）

- **分歧审计**（explore 只读 · 单轮）：**CLEAN**（部分实现 ∕ 静默简化 ∕ 文档漂移 ∕ 超批准文件表 四类零；重锚判「坐标重锚、语义一致」；披露核真全真）。
- **代码评审**（advisor · 轮次 1）：**pass** —— 0🔴 ∕ 3🟡 ∕ 3🔵。🟡 皆非 must-fix：`ipc.mjs` 330 行 ∕ `agent-bridge.mjs` 319 行（**在册债**，#628 ∕ #627 增量在计划内）+ §2.1 #635 文档—码面相抵（父裁在案，报告不改，R7e）；🔵 = Windows cmd 包装行待真机（建议真机腿补「路径含空格」两臂）· `chat-tool.mjs` 300 贴线（在册拆分预案，下次触档执行）· i18n 键数链未续（沿链惯例）。
- **fix round**：0 轮（无 must-fix）；终态 = **clean**。

## §6 验证与收口（父代理）

### 6.1 收口（父侧 · 2026-09-29）

- **交付物全落**：**批 A 核钩子**（#628：`completion.mjs` 六推回点 + `agent-bridge.mjs` 改挂 `onSubTurnBreak`；VSC 零码改——钩子复活 ✓）∥ **批 B 桌面码面**（#627 新档 `editor-open.mjs` 131 行 + `ipc.mjs` 单链；#630 `root._subDescShown` 旗标；#631 `(interrupted)` 逐字；**#635 = 父裁 (a)**；#637 受占 toast + i18n 键）∥ **批 C 文档面**（UI.md ∕ PROJECT.md ∕ IPC.md——#61 在册，含追加两处一致性面）。
- **偏差在册（#635 · 设计前提不成立）**：§2 修法② 不可达——核 `_checkKnownKeyValue` 对数值已知键 `null` 拒（实测三键 `ok:false` ∕ 盘零写；`UI.md:400` 原文同判）⇒ 父裁 **(a)**：撤回数值行改动（维持零发送）+ 仅 F5 残句收正；「核清除形扩族」= 另批（台账 **#645**）。
- **批内件（归档）**：`docs/batches/2026-09-29-enddiff-clearance.test.mjs`（509 行 · **父侧收位 ✓**）——复跑 **13/13 绿**。
- **双锁重锚（父侧直接执行 ✓）**：`structure-split-round` B3 基线重冻 163 ⇒ 167 行（+ 基线件收位 `docs/batches/` + 测试路径随正）；`i18n-split` 基线 294 ⇒ 295（`session.occupied` 两语）+ A1 124 ⇒ 125 ∕ A4 328 ⇒ 332——两件复跑 **7/7 ∥ 5/5 绿**。
- **验证**：改前 ∕ 改后同口径（「同红集」律——他域改前红不修）；doc-check 本批写域零新增红（悬空 161 = 基线；F-W15 锚修复 = 另笔）。
- **集成面**：**不新增**（批内件形）。
- **结算同步清单**：① 角色表 ✓ ② 状态行 ✓ ③ 计数 ✓ ④ 指针 ✓ ⑤ changelog ✓（三档）⑥ **台账勾销：#626 ∥ #627 ∥ #628 ∥ #629 ∥ #630 ∥ #631 ∥ #633 ∥ #636 ∥ #637 → 已核销**（两步）；**#632 转缺面族**（其 §6 核销）∥ **#634 ∥ #635 留开**（登记 ∕ 待裁面——evidence 随动）⑦ 前批遗留交叉核：两锁随动 = 本批收位 ✓。
- **遗留（显式）**：#634（S15 落面——后续批）∥ #635（四项待裁）∥ **#648**（本轮只报五点）∥ GUI 真机腿（父侧探针）∥ Windows 路径含空格两臂（探针建议在册）。
- **收口结论**：本批终止。
