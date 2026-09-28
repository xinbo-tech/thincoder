# 2026-09-28 · desktop-vsc-align-3
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-28 · 来源 = 用户 2026-09-28 07:13「剩下的你自动跑完吧」授权下父侧自推：射程 = 勘察小修族 25 条（对齐第二批 §1.11 分堆）+ 出处重核（12 项在册/已裁逐条重核出处）+ 相抵两条（审批卡 diff 预览 / 文件链接——需求档 07:11 已收正）；来源表 = `2026-09-28-desktop-vsc-align-2.md` §1.9/§1.10。
> 台账 = #501（docs/desktop/requirements/PROJECT.md · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-28
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 来源与射程（用户 07:13 授权下父侧自推）

用户 2026-09-28 07:13：「剩下的你自动跑完吧。」——射程 = 本批全链 + 后续批自推（授权块与自缚四条 = align-2 §1.13 同文本）。本批 = 勘察实现面第一批：**小修族 25 条 + 出处重核 + 相抵两条**；来源表 = `docs/batches/2026-09-28-desktop-vsc-align-2.md` §1.9 / §1.10（证据原文与两侧 `file:line` 全在彼处 · 本档不复述——D2）。

### 1.2 条目表（小修族 25 条 · 名称索引）

对话流面（align-2 §1.9 行）：1 工具卡结果摘要行 · 2 失败判据红绿 · 3 运行期实时输出 · 5 中止未结算清扫 · 6 流内 `[stopped]` · 7 turnBreak 子回合边界 · 8 恢复帧次序 · 9 错误横幅（详情 + 重试）· 12 台账行 · 13 发送后回底 · 14 advisor 轮次标签 · 15 空态欢迎条；
外围面（align-2 §1.10 行）：1 owner 归属 · 2 提问卡 Enter · 3 提问卡聚焦 · 5 等待审批态 · 6 停止钮角色门 · 7 2s 心跳 · 12 末项删除门 · 14 设置类型加工 · 15 设置 agent 形态 · 22 非栅格拒绝时机 · 23 忙态写门 · 26 发送失败可见性 · 28 中断键两态。

（计数：12 + 13 = **25** ✓ 与 §1.11 分堆一致。）

### 1.3 出处重核面（12 项 · 原则先行）

原则（用户 07:11 裁定 · 需求档变更记录在册）：**不存在「用户的不做」——流程自划的例外一律按对齐办**。重核对象 = align-2 §1.10 表后「在册 / 已裁 12 项」：审批卡形态 / 审批卡置焦 / 任务面板外壳 / 子 agent 块（#496 在批）/ 状态栏段集（D22）/ 会话面板视觉（D18）/ 内容面 21 面（D21 已落）/ 外壳降噪（D24）/ 搜索 Ctrl+F / 滚动四行「各自」/ 零 Esc 层 / 附件条样式。设计轮逐条核**出处**：有用户裁定出处者维持（标出处）；无出处者 ⇒ 按对齐办（入本批或就近批）。**输出 = 逐条「出处 → 处置」表**。

### 1.4 相抵两条（需求档 07:11 已收正）

① **审批卡 diff 预览**（VSC 同款行级 diff——核 `cards/permission.mjs` + `diff.mjs` 现成；桌面 `views/approval.mjs` 零 diff 节点 / 载荷无 diff 键）；② **文件链接点开**（核 `linkifyPaths` + 「打开文件」出暂缓——桌面需宿主打开能力设计）。两条 = 本批实现面（含需求档转正句随动）。

### 1.5 边界与排期

- 与 align-2（六件）/ 外壳降噪（D24）/ 状态栏（D22）/ 视觉对齐（parity）**同片文件面**（`UI.md` · `styles.css` · `views/*` · `renderer/*`）⇒ **设计派单与实施均串行**；设计派单在 align-2 设计落地后（避免两设计师同档并发写）；
- 内容面 D21 值域零动（除明列面）；零新依赖；共享面增量编辑；
- 缺整面族（≈13）与「在册重核」输出的新增面 = 后续批（本授权射程内父侧自推）。

### 1.6 落点

- 台账 = **#501**（待设计 → 在途）；需求档 D 点收正顺延至评审冻结窗解除（外壳降噪评审 id=6 在飞）。

### 1.14 父侧处置登记（2026-09-28 15:0x · 承舱 A §5.1 末段三项）
1. **相抵① 真机验收行裁定 = 收正验收行**（不补来源）：深度 0 门恒两参缝（`thincoder-core/agent/dispatch.mjs:303`）⇒「apply_patch 门见 diff」真机面在桌面不可达；载荷面（四参缝 + `extraKeys` 两键）已按设计单源落地且离线可产。处置 = §6 收口时把该验收行改判「离线可产（载荷面）+ 深度 0 不可达登记」（不引核件改动 · 不扩面）。
2. **档面三处落点随动**（`techInfo` 实落 `turn-face.mjs`（idle-wake 批把结算三径提取后）；台账挂点 = resume 成功径〔父侧裁定 ③〕；§4.2 实读值十档 248∕298∕96∕256∕128∕62∕73∕63∕58∕108）⇒ 回填轮随落。
3. **测试档越层值漂移**（`session-contract` 319 ⇒ 331 · `host-floor` 313 ⇒ 333 · `agent-host` 338 ⇒ 472——皆在册越层档）⇒ 回填轮随落。

### 1.15 父侧处置登记（2026-09-28 15:1x · 承舱 B §5.2 末段五项）
1. **收口舱派发（本回）**：① `thincoder-desktop/renderer/views/approval.mjs`（相抵① 卡面半——`owner` ∕ `diff` 消费；归约半 `events.mjs:46–49` ∕ 样式半 `chat.css:432–459` 已在场——已核）② `thincoder-desktop/test/integration/align3-face.test.mjs`（T-DSK42 ∕ T-DSK43 机检面）+ `test/files.mjs` 登记——dependsOn #27（文件域串行）。
2. `styles.css` 三变量（`--diff-add-bg` ∕ `--diff-add-fg` ∕ `--diff-del-fg`）= **C 舱域**（在飞）。
3. 设计档漂移读数（`events.mjs` **460** ∕ `mount-composer.mjs` **406** ∕ `chat.css` **483** ∕ `chat-tool.mjs` **217** ∕ `app.mjs` **297** ∕ `chat.mjs` **338**（拆出 `chat-chrome` **258**） ∕ `host-floor.test.mjs` **343**）= 回填轮随落（§4.2 就地给数重锚）。
4. 评审轮 2 两 🔵（重试出口无回执钩 · 「第八词」vs「七词闭枚举」字面口径）= 回填轮 ∕ 结算轮处置。
5. 越域披露诸项：新档三件 ∈ 在册拆分预案（在案）· 词键 6 组待 C 舱（在飞）· `core.css` 类名映射对位（设计 `UI.md:378` ∕ `:418` 列——C 舱交付后随 §6 裁重复点）。

### 1.16 父侧待核登记（2026-09-28 15:1x · 派发 #33 时的调度器披露）
- **新事实**：舱 C（#27）声明文件域含 `thincoder-desktop/renderer/views/approval.mjs`（#33 入队注：域冲突 = 该路径）——即相抵① 卡面半**可能有舱**（§1.15-1「无舱认领」判断存疑——B 舱看不见 C 舱任务书，只按盘面判）。
- **处置（既定）**：待 C 交付披露后定——① 卡面已落 ⇒ **steer #33**：「勿重复实现，转验证 ∕ 补漏 ∕ 用例」；② 未落 ⇒ #33 照表落（原任务不动）。
- **另**：C 声明域 ∩ {`test/integration/align3-face.test.mjs` ∕ `test/files.mjs`} = ∅（#33 入队注无其余冲突披露）⇒ #33 项 2 ∕ 3（集成档 + 登记）= 唯一认领，不受影响。

### 1.17 父侧裁定（2026-09-28 15:2x · 舱 C ask 裁决——P14「删键」vs 契约）
- **裁定 = 收正验收行（不扩面）**：「空 / 非数 ⇒ **零发送**（不写盘 · 零乐观改 · 控件回退现值）」——契约与主侧零改；沿 §1.14-1 先例。
- **依据（按盘在案）**：① 契约单源 `docs/desktop/design/IPC.md:242`「`patch` 表达不了删键」；② 核 `thincoder-core/agent-tools/settings.mjs:134–145` 类型表对 `null` ∕ `undefined` 抛错——「显式清除（null）」语义现只对形状表键族，本项六键（`maxTurns` ∕ `subagentTurns` ∕ `poolLimits.*` ∕ `compactThreshold` ∕ `consultTurns` ∕ `consultTimeoutMs`）在类型表；③ 契约既有回退模式 `IPC.md:249`「控件回退回执前值」。
- **端差登记**：VSC 空 / 非数 ⇒ 键删（`Number(v) || undefined` 径）∕ 桌面 ⇒ 零发送——结构性不对称 + 证据 + 本裁定；**消解路 = 主侧写链 + 核清除形扩族（另批 · 新范围——需设计轮）**。
- **文档改判落点**：`docs/desktop/design/UI.md:399` P14 行**收正在落**（父侧直接执行 · 可 revert · 变更记录 +1）；批档 §2.1 项 14 机检字面以本裁定为准（设计者段——不作回改，§6 注记）。

### 1.18 父侧裁定与处置（2026-09-28 15:5x · 承舱 C §5 五项 + 交付）
1. **单源裁定（§5①）= 留 `core.css`**（设计 `docs/desktop/design/UI.md:378` ∕ `:418` 明列「`core.css`（核类名映射）」为落点）⇒ `chat.css:429` ∕ `:430` ∕ `:461` ∕ `:462` 四条同值副本**删**（B 舱点修轮——本回派发：files = `renderer/chat.css`；含注释随动 + 全量 ∕ 冒烟复验）。
2. **拆分 ∕ 续期裁定（§5②）= 续期 + 汇流「拆档批」**：`mount-settings.mjs` **499**（特挂：**任何触碰前先拆**——硬限 500 顶格）· `views/settings-sections.mjs` **357** · `core.css` **346** · `views-head.test.mjs` **356** · `styles.css`（§10 AL 行同族）——集中一批（台账技术待办入册 · trigger = 归批），避免收尾期插重构面；各档窗口重挂「下次触碰批 ∕ 拆档批」。
3. **字面收正（§5③④）= 父侧直接执行 · 可 revert**：`UI.md:401` 第十键 `advisor.effort` ⇒ **`advisor.reasoningEffort`**（依据 = 核 `config.mjs:49` + VSC 写面死键注）· `UI.md:30` ∕ `:426` F-Esc 绑定宿主「面板根 `keydown`」⇒「`document` 级 `keydown`」（实落形 + E2E 为证）——随落。
4. **#33 取消（§5⑤）**：双认领面（approval 卡面 ∕ `align3-face.test.mjs` ∕ `files.mjs` 登记）已由舱 C 全落 ⇒ 原任务清零，取消（零改动——无未审面）。
5. 其余：越域披露诸项接受（`mount-composer.mjs` +2 行导出 = P2 判据单源 · 探针已删〔本回复核〕· `views-harness` 补缝 · `host-floor` ∕ `files.mjs` 登记在册）；§5⑦ 值锁 = 可选，随回填轮登记。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（小修族 25 + 相抵 2 + 出处重核 12——四设计档已落（UI / PROJECT / IPC / E2E）；修正轮 1（评审轮 1）+ 微收正轮（复核轮 2 #17 / #18）已落；doc-check 读数 = 悬空 64 / 行宽 35（净 0）；上抛 6 项见 §2.7）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目（覆盖 = 小修族 25 + 相抵 2 · 出处重核 12 · 台账 #501）

口径 = 需求档 §3.6「对齐口径」（**「对齐」= VSC 的形 + 行为**）+ 用户 07:11 裁定（**不存在「用户的不做」——流程自划的例外一律按对齐办**；需求档 §3.1:51 / §5.1 已收正）。**逐条机制 / 落点 / 判据 / 边界单源 = `docs/desktop/design/UI.md` §1「本批注（对齐第三批 · 小修族 25 + 相抵 2）」**（本段只列条目与验收对照，不复述机制）。

| # | 条目（§1 来源行） | 设计落点（单源） | 验收判据（回指需求） | 边界 |
|---|---|---|---|---|
| 对话流 1 | 工具卡·结果摘要行（§1.9 行 1） | UI.md 本批注项 1 | 机检：`result` 非空 ⇒ 摘要段 = `→ ` + 核 `formatToolSummary` 直取（bash 末行 / `read` N lines / 无摘要零段）；真机：与 VSC 同刻对照 | 既有四段不动；缺摘要 ⇒ 零段 |
| 对话流 2 | 工具卡·失败判据红绿（行 2） | 本批注项 2 | 机检：`(exit code 1)` / 全角 `Error：` ⇒ `ok` 假（`isToolFailure` 单源）；真机：失败卡红 / 成功卡绿 | 展开默认判据零动（错误默认展开既有） |
| 对话流 3 | 运行期实时输出（行 3） | 本批注项 3 | 机检：运行期增量到达 ⇒ 体在场 ∧ 展开（显式旗被清）；真机：长命令边跑边见 | 累积语义（`onToolOutput`）不动；显示面 `capText` 单截断点 |
| 对话流 5 | 中止·未结算卡清扫（行 5） | 本批注项 5 | 机检：`stopped` 终局 ⇒ `status: "interrupted"`（词 = 已中断）；真机：停止后卡不再「执行中…」 | 摘要段不产（端差登记：VSC 硬编码 `→ (interrupted)`） |
| 对话流 6 | 流内 `[stopped]` 痕（行 6） | 本批注项 6 | 机检：`stopped` ⇒ `[data-stopped]` 节点在场 ∧ 词 = `status.stopped`；真机：停止后流尾留痕 | 运行期痕（页读整置即失——非落盘件） |
| 对话流 7 | turnBreak 子回合边界（行 7） | 本批注项 7 | 机检：`turnBreak` ⇒ 游标清点（尾块追加态收束）；真机：推回后文本另起块 | 核 `onTurnEnd` ⊃ VSC 钩子——中断注入支端差登记（§10 BG） |
| 对话流 8 | 恢复帧·推理/正文次序（行 8） | 本批注项 8 | 机检：页读助手条目序 = `[reasoning, assistant, …tools]`；真机：重开既有会话布局 = 推理在上 | 仅次序；块内容零改 |
| 对话流 9 | 错误横幅（详情 + 重试）（行 9） | 本批注项 9 · KD-37 | 机检：`techInfo` 在场 ⇒ `details` 节点；重试钮 = 末 `user` 块在场 ⇔ 在场；点按 ⇒ `msg:send` 重发（零新通道）；真机：错误横幅含 Details + Retry | 重试失败 ⇒ `console.error`（零乐观写）；无末 user 块 ⇒ 零钮 |
| 对话流 12 | 台账行 ledgerNotice（行 12） | 本批注项 12 · KD-38 | 机检：`ev:ledger` 行集 ⇒ `[data-ledger-line]` 逐行（`{text,warn}` 逐字）；真机：开项目后流内台账行 | 周期刷新不在本批（open 行 + §10 BI） |
| 对话流 13 | 滚动·发送后回底（行 13） | 本批注项 13 | 机检：受理 ⇒ `following: true` / `pendingNew: 0`（并笔）；真机：停跟期间发送 ⇒ 回底 | 入队径（忙态）不回底 |
| 对话流 14 | advisor 轮次标签（行 14） | 本批注项 14 | 机检：`advisor` 具名 ⇒ 载荷携 `round` / `model` ⇒ 段文 = `(round N · model)`；真机：advisor 卡头有轮次 | 仅 `advisor` 名；缺 ⇒ 零段 |
| 对话流 15 | 空态·欢迎条（行 15） | 本批注项 15 | 机检：`no-message` ⇒ 三行（抬头 / 文案二值 / 快捷键行）；真机：空会话首屏见欢迎条 | 端差登记：`@` 段随缺面族批补；`no-project` / `no-session` 零动 |
| 外围 1 | 审批卡·owner 归属（§1.10 行 1） | 本批注 P1 | 机检：载荷 `owner` 在场 ⇒ 首行段 = `<owner> · <tool>`；真机：子代理门卡见归属 | 深度 0 ⇒ 缺席 = 既有形 |
| 外围 2 | 提问卡·Enter 提交（行 2） | 本批注 P2 | 机检：非空输入 + Enter ⇒ 提交（复用 `onAnswerDraft`）；真机：一键作答 | IME 组字期零动作；Shift+Enter = 换行 |
| 外围 3 | 提问卡·聚焦两态（行 3） | 本批注 P3 | 机检：卡插入 ⇒ `[data-input="answer"]` 聚焦；作答 `ok` 真 ⇒ 回焦输入区；真机：同 | 失败径零动 |
| 外围 5 | 活动区·等待审批态（行 5） | 本批注 P5 | 机检：`onSubagentApproval` ⇒ `ev:subagent { status:"approval", tool }` ⇒ ⏸ + `sub.awaitingApproval`；真机：子代理等审批可见 | 无块 child 不因审批出生（核态机闸） |
| 外围 6 | 停止钮角色门（行 6） | 本批注 P6 | 机检补例：consult / escalate 族零 `.sub-stop-btn`（核件 `FAMILY_ROLES` 门已在） | **已由「对齐第二批」落地**——本批零实现改动 |
| 外围 7 | 2s 心跳（行 7） | 本批注 P7 | 机检：假钟驱动 ⇒ 在飞块 `refreshBlock` 逐拍 + 清点（unload）；真机：秒数逐 2s 走 | 首个渲染面定时器（清点纪律）；状态行重挂仅 `running` |
| 外围 12 | 末项删除门（行 12） | 本批注 P12 | 机检：会话数 ≤ 1 ⇒ 零删除控件；主侧 `session:delete` ⇒ 拒 `last-session`；真机：单会话无删除钮 | 双闸（渲染面 + 主侧） |
| 外围 14 | 设置面·类型加工（行 14） | 本批注 P14 | 机检：`number` ⇒ `number` 控件 / `boolean` ⇒ `checkbox`；出值规范化（空 / 非数 ⇒ 删键）；真机：布尔 / 数值键可写 | 只读面（敏感 / 非标量）不动 |
| 外围 15 | 设置面·agent 形态（行 15） | 本批注 P15 | 机检：具名控件十键在场 ∧ `change` ⇒ 单键 patch；真机：即改即存 | 表外标量键 = 泛化行兜底（零能力削减）；端差登记 |
| 外围 22 | 附件·非栅格拒时机（行 22） | 本批注 P22 | 机检：`image/svg+xml` 等粘贴 ⇒ 不入条 + 提示行（`paste.unsupportedFormat`）；真机：粘贴即拒 | 主侧判据零动（双闸） |
| 外围 23 | 模型 / 档位忙态写门（行 23） | 本批注 P23 | 机检：位标含 `running` ⇒ 三值控件 `disabled`；真机：在飞不可改 | 控件保位（信息面不撤）；原生 select 无菜单面 |
| 外围 26 | 发送失败可见性（行 26） | 本批注 P26 | 机检：`ok` 假 / 抛 ⇒ 提示行（`composer.send.failed`）+ 文本保留；真机：`provider-invalid` 可见 | 下次成功发送清 |
| 外围 28 | 中断键两态（行 28） | 本批注 P28 | 机检：非在飞 ⇒ `disabled`；真机：空闲不可点 | 锚恒在（端差登记：VSC 隐去） |
| 相抵① | 审批卡 diff 预览 | 本批注 C1 | 机检：载荷 `diff` ⇒ `.diff-preview` 行级差（核三导出）；超阈 ⇒ 摘要 + 计数；真机：apply_patch 门见 diff | 零外部查看器；`--diff-*` 三新增变量 |
| 相抵② | 文件链接点开 | 本批注 C2 · KD-39 | 机检：`links` ⇒ `.file-link[data-path]` ∧ 点按 ⇒ `file:open`；真机：点按开路 | 历史卡零链接（VSC 同径）；行定位不在本批（§10 BH） |

**需求回指**：D3（对话流——恢复帧次序 / `[stopped]` / 错误横幅 / turnBreak / 回底）· D5（审批卡 owner / diff / 置焦）· D6（设置面两件）· D10（台账行）· D13（非栅格即拒）· D19（**文件链接承载——原 KD-RC-5「不承载」收正**）。**需求档笔权在父侧**：本设计只报，不改需求档。
**门（本批实施后应过）**：`node scripts/doc-check.mjs --root .` **净增 0/0**——本设计轮实测：**悬空 64 / 行宽 36**（与盘面既有项持平；本批新增行零悬空 / 零行宽超限——新增件皆带全路径或「（拟新增」标记）。

### 2.2 设计档落点（本批已落）

- `docs/desktop/design/UI.md`：§1 增**本批注（对齐第三批 · 小修族 25 + 相抵 2）**（A 对话流 12 / B 外围 13 / C 相抵 2 / F 重核入本批 2 / D 计数 / E open）+ 行内指针随动九行（对话流 / 工具卡 / 会话头 / 输入区 / 审批呈现 / 提问呈现 / 设置面 / 左列会话行 / 空态）；**状态词行 7 ⇒ 8 词**（+ 已中断）· 借用项 9 同拍 · open 行摘「审批卡置焦执行」补「台账行周期刷新」· 设置面行「零 Esc 绑定」⇒ Esc 关闭；变更记录一行。
- `docs/desktop/design/PROJECT.md`：§2 增 **KD-37**（错误横幅重试 = 端侧重发末 `user` 块）· **KD-38**（台账行 = 开项目链一次）· **KD-39**（文件链接 = 宿主验存链 + `file:open`）；§4.2 增本批行（main 六档 + 新档一 + renderer 拾余档 + 测试面 + 设计档）；§6.1 五行随注（D3 / D5 / D6 / D13 / D19）+ 批注段；§7 增 **T-DSK42 / T-DSK43** 两行 + T-DSK37 块序收正 + T-DSK35 ④ 收正；§10 增 **BF–BI** 四行；变更记录一行。
- `docs/desktop/design/IPC.md`：§1 增 **`ev:ledger`** 行 + `ev:activity` 收**四形**（+ `turnBreak`）；载荷五处增键（`ev:tool-call` `round` / `model` · `ev:approval` `owner` / `diff` · `ev:error` `techInfo` · `ev:tool-result` `links` + `ok` 判据收正）；载荷键集 / 会话键面 / 订阅面三处计数 **十五 ⇒ 十六通道**；§2 增 **`file:open`** 行（白名单 **28 ⇒ 29 项**）；事件映射段随拍；变更记录一行。
- `docs/desktop/design/E2E-TESTING.md`：§4 增 `align3-face.test.mjs` 行（拟新增 · 0 ⇒ ≈160）；§6 增 **T-DSK42 / T-DSK43** 两行 + T-DSK37 块序收正；变更记录一行。

### 2.3 受影响文件与测试面（实施批）

逐档「现行 ⇒ 预期」单源 = `docs/desktop/design/PROJECT.md` §4.2「本批（对齐第三批 · 小修族 25 + 相抵 2）行」（**就地给数——实读 2026-09-28**）。要点：
- **宿主**：`src/main/agent-bridge.mjs`（`isToolFailure` 判据 · `onPermissionRequired` 四参缝 · `onSubagentApproval` · `onTurnEnd` ⇒ `turnBreak` · advisor 采样）；`src/main/agent-host.mjs`（`techInfo` · 台账行触发）；新档 `src/main/file-links.mjs`（验存链）；`session-actions.mjs`（末项门）；`ipc.mjs` / `preload.cjs`（`file:open` · `ev:ledger`）。
- **归约 / 状态**：`renderer/events.mjs`（清扫 / `stopMark` / `turnBreak` / `techInfo` / `ev:ledger` / `APPROVAL_KEYS` 增两键）；`renderer/subagent-reduce.mjs`（`approval` 态）；`renderer/page-read.mjs`（恢复帧次序）。
- **视图 / 挂载**：`views/chat-tool.mjs` · `views/chat.mjs` · `views/chat-guide.mjs` · `views/approval.mjs` · `views/question.mjs` · `views/chrome.mjs` · `views/sessions.mjs` · `views/settings-sections.mjs` · `mount-composer.mjs` · `mount-cards.mjs` · `mount-head.mjs` · `mount-settings.mjs` · `mount-pool.mjs` · `attach.mjs` · `app.mjs`（2s 拍单点）。
- **样式 / 词表**：`renderer/chat.css`（工具头三态色 / 错误横幅 / 停止痕 / 台账行 / diff / 文件链接）· `core.css`（核类名映射）· `styles.css`（diff 三变量）· `i18n.mjs`（≈18 键 × 2 语）。
- **测试面**：原址补例（`views-chat` / `views` / `store` / `views-chrome` / `views-chrome-vocab` / `views-question` / `events-reduce` / `views-statusline` / `agent-host` / `views-chat-text` / `views-activity` / `views-settings` / `settings` / `agent-bridge-subagent` / `events-subagent` / `events-page` / `session-contract` / `views-attach` / `views-locks` / `host-floor`）+ 新档 `test/file-links.test.mjs`（平 node 直测）+ 集成域新档 `test/integration/align3-face.test.mjs`（**T-DSK42 / T-DSK43**）+ `test/files.mjs` 登记行；**D16 义务**：改桌面可见面 ⇒ 验收含真 Electron 用例（本批 = T-DSK42 / T-DSK43 + 人工走查）；用例行随测试档修加——不进设计面条目（2026-09-27 裁定）。
- **同片避让（§1.5）**：`UI.md` / `styles.css` / `views/*` / `renderer/*` 与 align-2 / D24 / D22 **串行**——本设计零触碰在途批段落（增量编辑；基线 = 盘面最新）。

### 2.4 关键决策（本批 · 单源 = `PROJECT.md` §2 KD-37–39）

1. **KD-37 错误横幅重试 = 端侧重发末 `user` 块文本**（零新通道——经输入区既有直发径；被否候选 = 新通道 `msg:retry`）。
2. **KD-38 台账行 = 开项目成功链一次**（`ev:ledger` 宿主自产；周期刷新另裁——消解路 = 与左列信息行复读面并笔）。
3. **KD-39 文件链接 = 宿主验存链 + 核包裹 + `file:open`**（打开能力 = 系统默认程序，行参不施加；被否候选 = 渲染面自析路径 / 端侧直读 fs）。

**实施级决策（体量小不入 KD）**：中断清扫状态词入闭枚举（7 ⇒ 8）；`[stopped]` 痕 / 台账行 = 流内非块节点（沿 `[data-pending]` 先例）；`turnBreak` = 核 `onTurnEnd` 接缝（端差登记）；2s 拍 = 渲染面首个定时器（清点纪律）。

### 2.5 出处重核输出（12 项 · 逐条「出处 → 处置」表）

对象 = `docs/batches/2026-09-28-desktop-vsc-align-2.md` §1.10 表后「在册 / 已裁 12 项」；原则 = 用户 07:11 裁定（**不存在「用户的不做」——流程自划的例外一律按对齐办**）。

| # | 项 | 出处核查 | 处置 |
|---|---|---|---|
| 1 | 审批卡形态（RENDER-CORE §4 行 10/18） | **无用户裁定**（「桌面外壳留存」= 流程自划推演） | 按对齐办 ⇒ **就近批**（卡壳整面：类名 / 首行 / 操作区与核件卡的差）；本批先落 owner / diff / 置焦三增量 |
| 2 | 审批卡真置焦未落（UI.md §1 open 行） | **无**（批 7 修正轮流程自划「未落」） | 按对齐办 ⇒ **入本批**（F-置焦：帧尾对 `data-autofocus="1"` 执行 `focus()`） |
| 3 | 任务 / 计划面板外壳（§4 行 20） | **无**（计划卡已落；goal / 任务面板 = 缺面） | 按对齐办 ⇒ **缺整面族后续批**（goal / 任务面板批） |
| 4 | 子 agent 块形态与归档（#496 / UI.md §2 项 1） | **有用户出处**（06:48 走查「subagents那边显示的样子跟vsc真是没一点相似」） | **维持**（「对齐第二批」已落——本批无改） |
| 5 | 状态栏段集（D22 在批） | **有用户出处**（05:38「屏面为准」裁定） | **维持**（已落地） |
| 6 | 会话面板视觉（D18） | **有用户出处**（04:42 走查「桌面端的会话面板与 vsc 端完全不同」） | **维持**（D21 已落） |
| 7 | 内容面 21 面（D21 已落） | **有用户出处**（同上「样式与 VSC 区别很大」） | **维持** |
| 8 | 外壳降噪（D24 在批） | **有用户出处**（06:30 走查「线条框框太多」） | **维持**（已落地） |
| 9 | 搜索 Ctrl+F「本轮不承载」（§4 行 20 注） | **无**（流程自划） | 按对齐办 ⇒ **后续批**（搜索面 = VSC `search.js` 全件——缺整面族） |
| 10 | 滚动四行「各自」（§4 行 12–15） | **无**（流程自划「各自」） | 逐条：**文件链接** ⇒ **入本批**（相抵②）；滚动 / 回填 / 裁剪三行 = **维持**（桌面机制对齐在册——机检面已覆盖，无可见差） |
| 11 | 零 Esc 层（有意） | **无**（流程自划「有意」） | 按对齐办 ⇒ **入本批**（设置面 Esc 关闭——F-Esc）；其余浮层族（下拉 / 菜单 / 搜索 / 注入模式）桌面零对位面 ⇒ 零动 |
| 12 | 附件条样式（UI.md §1 open 行） | **无**（批 B 流程自划 open） | 按对齐办 ⇒ **随附件面族批**（与「附件入口与发送键」同面；样式值源需 VSC 附件面勘察） |

**汇总**：入本批 **3**（项 2 / 项 10 之文件链接 / 项 11）· 维持 **5**（项 4–8）· 后续批 **3**（项 1 / 3 / 9）· 随族批 **1**（项 12）。**无「用户的不做」留存**——原「不做 diff」/「文件链接不承载」两条已随需求档收正入本批实现面（相抵①/②）。

### 2.6 前提核对（父侧已知事实的复核结果 · 两路只读勘察）

- **工具卡核件在场** ✓（`thincoder-render-core/tool-summary.mjs` / `lib.mjs` `isToolFailure` / `flow/tool-card.mjs` `roundTag`——本批 = 接驳）。
- **owner / diff 缝在场** ✓（核 `agent-tools/child-permission.mjs:42` 四参 `onPermissionRequired` + `diffInfo`；桌面桥未接——**前提修正**：owner 只在子代理门在场，深度 0 无此参）。
- **turnBreak 前提修正** ⚠：**核无 `onSubTurnBreak`**（VSC 自有宿主层钩子）；核同位 = `onTurnEnd`（超集）——按端差登记 + 上抛处理（§2.7）。
- **提问卡核件在场** ✓（`thincoder-render-core/cards/question.mjs:46-48` Enter 判据——桌面端侧同判据落形）。
- **子代理审批链在场** ✓（核 `child-permission.mjs:40-44` `onSubagentApproval` + 核态机 `subblocks/state.mjs:190-201` `status:"approval"`——桌面只差接缝与两键白名单）。
- **台账行产在场** ✓（核 `ledger-surface.mjs` `runLedgerScan` + `ledger.mjs` 行产——桌面 `project-info.mjs` 扩接）。
- **文件链接语义源在场** ✓（VSC `src/extension/file-links.mjs` `extractFileLinks`——多实现面各自落地；桌面零 fs 渲染面铁律不破）。
- **设置面写面在场** ✓（`settings:agent` 通道 + `writeConfigAtomic` 唯一执行体——本批只改视图面与具名面）。

### 2.7 上抛项（实施 / 评审前请父侧知悉）

1. **核 `onTurnEnd` ⊃ VSC `onSubTurnBreak`**（A7 端差 · `PROJECT.md` §10 BG）：中断注入支桌面断块（VSC 不断）——消解路 = 核侧补窄义钩子（另裁）；本批 = 端差登记。
2. **打开文件行定位**（§10 BH）：`shell.openPath` 无行参——`line` 入载荷备用；消解路 = 外部编辑器 CLI 探测（另裁）。
3. **台账行周期刷新**（§10 BI · KD-38）：本批只落开项目链一次——消解路 = 与左列信息行复读面并笔。
4. **审批卡形态整面**（重核表项 1）：卡壳 / 类名 / 操作区与核件卡的差 = 就近批；需裁定面（键盘面 / 锚面取舍）。
5. **渠道计数**：`IPC.md` §1 **十六通道**（含 idle-wake 未落地两通道）· 预载实读 13 ⇒ 本批落地后 16——**以盘面实读复核**（沿 §10 BE 行结算口径）。
6. **`welcome.*` 快捷键行 `@` 段**：随 @-补全缺面族批补（本批按「本端真有之键」落形）。

### 2.8 修正轮 1（评审 §3 轮次 1 · 16 项逐号点修 · eng-designer · 2026-09-28）

**口径**：评审 `Suggestion` 列 = 处置建议，处置执行 = 本座；**1–15 逐条改，16 = 维持**（沿 2026-09-27 裁定——测试档计数注不占设计条目）；禁止范围守住（零实现码改动 / 零需求档与核档触碰 / 零他批面触碰 / 表外零改——表外发现见下「只报未动」）。

**逐号表（号 → 改动 file:line · 行号为改后位）**

1. **取㈠本批落拆**（理由见下）——`docs/desktop/design/PROJECT.md` §4.1 i18n 行 `:164` + 越层段 `:218`（现值 423 ⇒ **470** + 预案落形）· §4.2 本批行 `:452`（**470 ⇒ ≈475** + 新档 `renderer/i18n-views.mjs`（拟新增 · ≈50）；合并点 = `initDict` 装配）· 测试面随动 `:454`（`views-chrome-vocab` 键数链 / `host-floor` `fresh` 臂）· `docs/desktop/design/UI.md` 变更记录 `:547`。
2. `PROJECT.md`：`:166`（chat.mjs 280 ⇒ **341** + 越层注）· `:224`–`:226`（越层段**补登三档**：chat.mjs **341 ⇒ ≈362** · core.css **336 ⇒ ≈350** · settings-sections **291 ⇒ ≈312**——各带预案 + 消解窗口）· `:226`（贴层行 ⇒ **（无）**——chat.mjs 入越层）· `:195`（core.css 259 ⇒ **336**）· `:176`（290 ⇒ **291**）· §4.2 三行预案（`:442` / `:448` / `:453`）。
3. `PROJECT.md` §4.2 增 `suspensions.mjs` 行 `:429`（**113 ⇒ ≈118**——`ev:approval` 载荷两键）；`UI.md` `:368` / `:378` 两处「视图两档」点名（`views/chat.mjs` 组构树 + `chat.css` 组样式）。
4. `docs/desktop/design/IPC.md` 会话族注项 5 `:129` 补 `last-session` 一档；§2 会话族行 `:85` 措辞同拍。
5. `IPC.md` `:16` `ev:subagent`：`status` 闭集补 `approval` + 随行字段补 `tool?`（含清态口径）。
6. `IPC.md` `:30`（十一 ⇒ **十四回调**）/ `:34`（三接缝点名）/ `:138` · `:160` · `:173`（计数收正 = 白名单 **29 项** / **十六通道**）；`UI.md` `:438`（状态词 **7 ⇒ 8 词** + P5 指针）；置焦状态句三处（`UI.md:22` · `PROJECT.md:170` · `:548` ⇒ **本批落 · F-置焦**）。
7. `UI.md` F 块补判据两行（`:424` F-置焦——机检 = `[data-autofocus="1"]` 恰一 + 帧尾执行点；真机 = T-DSK43 ⑥；`:426` F-Esc——机检 = T-DSK43 ⑤ 真 Electron Escape ⇒ 容器清空）。
8. `docs/desktop/design/E2E-TESTING.md` `:179` / `:180` 断言面**二分**（离线可产 / 离线不可产 ⇒ 人工走查 + 父侧真跑闭合）+ `:142` / `PROJECT.md:568` / `:569` / `:500` 同拍；产出路径取③（注入缝 ∥ 改夹具两径**不作**——注入缝 = 产品补缝 ⇒ 沿 E2E 档 §8-6 停手上抛口径；夹具改超本批边界）。
9. 台账行触发落点**定一**：开项目成功链持有面 = **`project-info.mjs`**（`PROJECT.md:432` 承接出站 · `:430` agent-host 行去件 · `:433` ipc 行挂调用；与 `UI.md` 项 12 / `IPC.md:28` 产出方同源——**批档 §2.3 原记法以本表为准**）。
10. `PROJECT.md` §6.1 **D10 行**（`:483`）补本批句 + 批注段 `:499`「五行」⇒ **六行**（D3 / D5 / D6 / D10 / D13 / D19）。
11. 残体清三处：`IPC.md:49` · `PROJECT.md:492`（D19 行）· `:562`（T-DSK35 ④）——改单句现态；收正过程住各档变更记录 + 本记录面。
12. `UI.md` `:417` C2 着装面补 **`data-path` 锚**（E2E 断言锚得源）。
13. `E2E-TESTING.md` 按批读注补本批一行（`:190`）。
14. `IPC.md` `:88` `file:open` 行收**两格**（表头两列对齐；回执 / 实现面并入「载荷语义」格）。
15. `PROJECT.md` `:453` styles.css **493 ⇒ ≈499**（diff 三变量 × 亮暗两套 = +6）+ 硬限余量句（距 500 仅 1 行 ⇒ 越 500 须先拆档）；`:155` 现值 466 ⇒ **493**。
16. **维持**（测试档计数注——2026-09-27 裁定；评审留痕已在 §3）。

**#1 择形理由（取㈠本批落拆）**：470 + ≈38 ⇒ ≈510 **必越 500 硬限**；㈡（压回 ≤500）语义零收缩下需在本体腾 ≥10 行 ⇒ 只剩压注释 / 重排，且落 **500 顶格态**（先例 = `events.mjs` 恰 500 即判「顶格 ⇒ 在册预案本批执行」——顶格态下一批再增即复越）。㈠ 与在册预案同向（词族按视图面拆第二档——消解窗口已到 = 本批即触碰批），落形取**零搬移式**（第二档承本批新增词族，本体零搬移——结构增量最小）；先例 = events / store / page-read 三档拆分均于触碰批执行。硬限消解 = 470 + ≈50 两档均 ≪500。

**门（改后实测）**：`cd thincoder && node scripts/doc-check.mjs --root .` —— 悬空 **64 ⇒ 64**（净 0；新增引用皆落「拟新增」列报面——拟新增 32 ⇒ 38，不入闸）/ 行宽 **36 ⇒ 35**（净 −1——`:224` 折行 + 本轮新增行全部 ≤300）。

**只报未动（表外发现——本轮禁改，请父侧裁）**

① 失效表述同类未列面三处（与 #11 同族，评审未列）：`PROJECT.md:65`（KD-27 行「**文件链接不承载**（暂缓面）」+ 拒绝候选「落文件链接无出口（假控件——KD-RC-5）」——与 D19 收正相抵）· `UI.md:137`（对齐重定位本批注项 3「文件链接不承载（暂缓面——KD-RC-5）」）· `PROJECT.md:625`（§8 本批不做行「搜索面 / 文件链接出口（暂缓面——KD-RC-5）」）。
② §4.1 **系统性滞后**（「对齐第二批」落未回填——本轮仅按发现点修四行）：`PROJECT.md:159` events **494**（盘面实读 **349+1**）· `:161` mount-pool **60**（盘面 **89**）· `:165` store 333 · `:174` activity 248（盘面 **308**）等；计数尾同类 = `:138` ipc「白名单 28 项」· `:153` preload「**26 ⇒ 27 项**」/「白名单十三通道」——建议归 §4.1 回填轮（父侧直接执行先例）。
③ 批档 §2.3 原文「`src/main/agent-host.mjs`（`techInfo` · **台账行触发**）」与修正轮定一落点（`project-info.mjs`）不同源——§2.3 为 append-only 既有行，**以本 §2.8 项 9 为准**（四设计档已同源收正）。

### 2.9 微收正轮（复核轮 2 新发现 #17 / #18 · eng-designer · 2026-09-28）

**口径**：复核轮 2 新发现两件（#17 🟡 `T-DSK42` ⑤ 重分类 · #18 🔵 D.计数补拆分产出——父侧裁定 = 实施前落 · 非阻断）逐号点修；单格 / 单句级，语义零新立（皆已裁口径的随动）；禁止范围守住（零实现码 / 零需求档与核档 / 零他批面 / 不点火 / #19 另派未触碰）。坐标以盘面实读为准（父侧给号两处 = 盘面行 − 4：`PROJECT.md` 568 ⇒ 实质 **572** · 452 ⇒ 实质 **456**）。

**逐号表（号 → 改动 file:line · 行号为改后位）**

1. **#17 · `T-DSK42` ⑤「文件链接」由离线可产改标离线不可产**（与自身边界相抵——夹具 = 会话槽族档仅回放面 ⇒ 历史卡零链接；`docs/desktop/design/UI.md` §1 相抵②边界同径）——落点三处 + 同组枚举随动一处：
   - `docs/desktop/design/E2E-TESTING.md:142`（§4 清单：「文件链接」移出**离线可产断言面**；**离线不可产面**组增列 ⇒ 停止痕 / 文件链接 / 子代理门审批 / 提问卡键焦 / 忙态写门 / 审批卡真置焦）；
   - `docs/desktop/design/E2E-TESTING.md:179`（`T-DSK42` ⑤ 加「——**离线不可产**」标）；
   - `docs/desktop/design/PROJECT.md:572`（`T-DSK42` 行：输入格两列移换（不可产列 + `文件链接`）· ⑤ 同拍加标）；
   - **随动（同组枚举一致 · D3）**：`docs/desktop/design/PROJECT.md:504`（§6.1 批注段「离线不可产面」枚举增列——评审未列，本座按组枚举一致随拍，请父侧复核）。
2. **#18 · D.计数补拆分产出**——`docs/desktop/design/UI.md:430`：「新档 **1**（主侧 `file-links.mjs`）」⇒「新档 **1**（`file-links.mjs`）+ 拆分产出 **1**（`renderer/i18n-views.mjs`（拟新增 · ≈50）——单源 = `docs/desktop/design/PROJECT.md` §4.2）」（「主侧」二字随删——行宽余量；文件身份由两档名 + 单源指针承载）。

**变更记录随拍（三档各一行）**：`docs/desktop/design/E2E-TESTING.md:248` · `docs/desktop/design/UI.md:548` · `docs/desktop/design/PROJECT.md:909`。

**门（改后实测）**：`cd thincoder && node scripts/doc-check.mjs --root .` —— 悬空 **64 ⇒ 64**（净 0）/ 行宽 **35 ⇒ 35**（净 0；四条新行 = 298 / 278 / 229 / 280 ≤ 300）；拟新增 **38 ⇒ 40**（两条「（拟新增」标记行——列报 · 不入闸）。

**只报未动**：#19（§4.1 系统性滞后）未触碰（回填轮另派）；表外零改。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象**：桌面对齐第三批（小修族 25 + 相抵 2 + 出处重核 12）设计 · 轮 1 —— 设计单源 = 本批档 §2 + `thincoder/docs/desktop/design/UI.md`「本批注（对齐第三批 · 小修族）」/ `PROJECT.md`（KD-37–39 / §4.2 / §6.1 / §7 / §10 BF–BI）/ `IPC.md` / `E2E-TESTING.md`；实现码不在射程（标注数值只做文内互核，未与盘上实读对拍）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Affected-file size | 🔴 | `renderer/i18n.mjs` 本批行记 **470 ⇒ ≈520**（`PROJECT.md:448`）：按设计自身标注将越过仓级 500 行硬限（AGENTS.md「≤500 hard limit」）；§4.1 在册预案（词族按视图面拆第二档 · `PROJECT.md:218`）未在本批触发，而本批即该档「下次被触碰的批」（消解窗口已到；先例 = events.mjs「恰 500 = 硬限顶格 ⇒ 在册拆分预案本批执行」）。 | 在本批落拆分（如按视图面把新增词族分置第二档）或在设计内把 i18n 预期压回 ≤500；同笔更新 §4.1 越层段该档现值与预案状态。 |
| 2 | Affected-file size | 🟡 | 跨 >300 线而无拆分预案：`views/settings-sections.mjs` **291 ⇒ ≈312**（`PROJECT.md:444`）· `core.css` **336 ⇒ ≈350**（`PROJECT.md:449`）；`views/chat.mjs` **341 ⇒ ≈362**（`PROJECT.md:438`）与 §4.1「贴 300 层未越 = **280**」登记（`PROJECT.md:224`）互斥。 | 为前两档补「预案 + 消解窗口」并登记进 §4.1 越层段；收正 chat.mjs 的贴层 / 越层登记与数值（既有预案 = 帧尾态刷拆 `chat-chrome.mjs`）。 |
| 3 | Affected-file size / Clarity | 🟡 | §4.2 本批行（`PROJECT.md:421-451`）缺 `src/main/suspensions.mjs` 一行，而设计把该档列为改点（owner / diff 载荷 = `UI.md:388` / `UI.md:414`）；另 `UI.md:368` / `UI.md:378` 落点只写「视图两档」未点名档。 | 补 suspensions.mjs 行（现行 113 = `PROJECT.md:142` + 预期增量）；两处「视图两档」改点名具体档。 |
| 4 | Contract completeness | 🟡 | `session:delete` 末项门新 reason `last-session`（`UI.md:397` · `PROJECT.md:430`）未登记进契约单源——IPC §2「会话族注」项 5 的 reason 分档（`IPC.md:128`）仍为三族、未含该码。 | 在「会话族注」项 5 reason 分档补 `last-session` 一档，并同步 §2 会话族行措辞。 |
| 5 | Contract completeness | 🟡 | `ev:subagent` 值域未随本批收正：`status` 闭集（`IPC.md:16` / `IPC.md:39`）仍六值（无 `approval`）、随行字段列无 `tool`，而设计写 patch `{ status: "approval", …, tool }`（`UI.md:392-393`）。 | 在 §1 `ev:subagent` 行补 `status` 闭集 `approval` 与随行字段 `tool?`（含清态口径）。 |
| 6 | Doc-state consistency | 🟡 | 本批收正后残留未随动引用：`IPC.md:159` / `IPC.md:172`「§1 **十五通道**…白名单面 28 项」与 `IPC.md:137`「白名单 28 项」（§1 现值 = 十六通道 / 29 项 = `IPC.md:35` / `IPC.md:108`）；`IPC.md:30`「**十一回调**」未随本批三处新接缝（`onPermissionRequired` / `onSubagentApproval` / `onTurnEnd`）重计；`UI.md:436`（§2 项 1）「状态词…**7 词**」与状态词行 8 词（`UI.md:16`）互斥；置焦状态句三处仍作「未落（登记 open 行）」——`UI.md:22` · `PROJECT.md:170` · `PROJECT.md:544`——而本批已入册（`UI.md:33`）且 open 行已摘除（`UI.md:35`）。 | 同笔扫平：计数收正三处 + 回调计数；置焦三处改记「本批落 · F-置焦」；§2 项 1 同笔补 P5 指针。 |
| 7 | Acceptance | 🟡 | 重核入本批两件 **F-置焦 / F-Esc** 只有落点、无判据：验收表（本批档 §2.1 · 27 行）不含二者，§7 / E2E 亦零用例（`UI.md:423-424`）。 | 各补机检判据（如帧尾 `focus()` 后 `document.activeElement` = 卡内 `[data-autofocus="1"]`；设置面根 Escape ⇒ `[data-settings]` 退场）或明示登记为走查面。 |
| 8 | Acceptance feasibility | 🟡 | E2E 断言面与隔离契约相抵：`T-DSK42` ②（停止痕 = `msg:interrupt` ⇒ `stopped` 终局后）与 `T-DSK43` ①②③（子代理门审批卡 / 提问卡 / 回合在飞）均须真回合（`E2E-TESTING.md:179-180` · `PROJECT.md:564-565`），而夹具 = 零 provider ⇒ 发送必败（`E2E-TESTING.md:119` + §3.5 第 10–11 步），停止痕又为运行期非落盘件（`UI.md:368`）⇒ 离线不可产生。 | 明示产出路径：声明事件注入缝（沿 `E2E-TESTING.md` §3.4 停手上抛口径）∥ 改夹具 ∥ 该两断言改记「人工走查 + 父侧真跑闭合」（沿桌面空闲唤醒批先例）。 |
| 9 | Consistency | 🟡 | 台账行触发落点两说：`UI.md:377-378` = 主侧 `project-info.mjs` 扩 + `ipc.mjs` / `preload.cjs`；`PROJECT.md:426`（§4.2 agent-host 行）与本批档 §2.3（`2026-09-28-desktop-vsc-align-3.md:89`）= agent-host「台账行触发出站（开项目成功链）」。 | 定一落点（开项目成功链持有面）并两处同源。 |
| 10 | Requirements coverage | 🟡 | 需求回指含 **D10（台账行）**（本批档 §2.1），但 §6.1 D10 行未随注（`PROJECT.md:479` 无本批句）；本批档 §2.2 又自称「五行随注」（D3 / D5 / D6 / D13 / D19）。 | §6.1 D10 行补本批句（流内台账行 = 开项目链一次）或收正需求回指清单。 |
| 11 | Doc hygiene | 🟡 | 规范面残留失效表述（「原 X 退场」形）：`IPC.md:48`（原 `startsWith("Error:")` 口径退场）· `PROJECT.md:488`（原 KD-RC-5「不承载」退场）· `PROJECT.md:558`（原「零节点（KD-RC-5）」退场）——沿 2026-09-18 裁定（历史归记录面 / 批档；先例 = 对齐第二批复核轮「失效表述残体清」）。 | 删残体、改单句现态表述；收正过程住变更记录 / 批档。 |
| 12 | Clarity | 🔵 | E2E 断言用锚 `.file-link[data-path]`（`E2E-TESTING.md:179` · `PROJECT.md:564`）在设计落形面无出处（`UI.md:417` 只落核类名 `span.file-link`）。 | 在 C2 落形补 `data-path` 锚（着装面）或改用已声明锚。 |
| 13 | Doc hygiene | 🔵 | E2E §6 表下「按批读」注未随本批补行（`E2E-TESTING.md:188-190` 止于状态栏 / 账本批），与本批新增 T-DSK42 / T-DSK43 的状态不符。 | 按批读注补本批一行（含「拟新增」态）。 |
| 14 | Doc hygiene | 🔵 | `IPC.md` §2 表头两列（`IPC.md:82`），`file:open` 行实含四格（`IPC.md:87`）——表格形不符。 | 行格数与表头对齐（回执 / 实现面内容并入「载荷语义」格或改表形）。 |
| 15 | Affected-file size | 🔵 | `styles.css` 记 **493 ⇒ ≈497**（+4 · `PROJECT.md:449`）与「diff 三变量」跨亮暗两套的既有口径（`PROJECT.md:155`）不符（≈+6 ⇒ ≈499）——距 500 硬限仅 1–3 行。 | 复核该档增量估算法与距硬限余量（越 500 须先拆档）。 |
| 16 | Affected-file size | 🔵 | §4.2 测试面（`PROJECT.md:450`）只列档名、无现行 / 预期值——沿 2026-09-27 裁定（`PROJECT.md:496`「测试档随修随加——不占设计条目」）；本项仅为核查结论留痕，不主张改例。 | 维持裁定（若要更严：新档给「— ⇒ ≈N」）。 |

**计数**：🔴 1 · 🟡 10 · 🔵 5 · 合计 16（发现表）；阻断项 = 1（#1）。

VERDICT: changes-required

### 轮次 2（评审子代理）

**评审对象（轮 2 · 复核）**：桌面对齐第三批（小修族 25 + 相抵 2 + 出处重核 12）设计——验证修正轮 1（轮 1 十六条 = 1🔴+10🟡+5🔵）逐条落位 + 父侧三处同族收正（KD-27 / UI.md:137 / §8 不做行）+ doc-check 净增读数口径；实现码 / 需求档不在射程。

**一、轮 1 十六条验证（证据 = 本轮盘上实读）**

| 原号 | 结论 | 证据（本轮实读引文） |
|---|---|---|
| 1 🔴 | **已修** | `PROJECT.md:452`：i18n **470 ⇒ ≈475**（合并式一行〔import + 两语展开〕——**本批落拆：新增词族出第二档**）· i18n-views — ⇒ **≈50**……**硬限 500 消解** = 两档 ≪500（+ §4.1 `:164` / `:218` 预案落形同拍） |
| 2 🟡 | **已修** | §4.1 `:225`：core.css（**336 ⇒ ≈350**——预案 = 核类名映射按面拆第二档〔档名实施批定〕）· settings-sections（**291 ⇒ ≈312**——预案 = agent 段拆分出档）；`:226`：随「对齐第二批」落 **341** ⇒ 越层在册〔上行补登〕 |
| 3 🟡 | **已修** | `PROJECT.md:429`：suspensions.mjs **113 ⇒ ≈118**（`ev:approval` 载荷增 `owner` / `diff` 两键）；`UI.md:368` / `:378` 两处已点名（`views/chat.mjs` + `chat.css`） |
| 4 🟡 | **已修** | `IPC.md:129`：`last-session`（**对齐第三批增**——`session:delete` 末项门：会话数 ≤ 1 拒·动作层判）；`:85` 措辞同拍 |
| 5 🟡 | **已修** | `IPC.md:16`：`status` 闭集 = …`approval`（对齐第三批增——子代理等审批）…；随行字段补 `tool?`（对齐第三批增——待审批工具名；`null` = 清态） |
| 6 🟡 | **已修** | `IPC.md:30`「**十四回调**」· `:138` / `:160` / `:173`（白名单 **29 项** / **十六通道**）· `UI.md:438`（状态词出自 §1 闭枚举 **8 词** + P5）· 置焦三处（`UI.md:22` / `PROJECT.md:170` / `:548`）皆「**真置焦执行 = 本批落**」 |
| 7 🟡 | **已修** | `UI.md:424`（F-置焦机检 = `views-approval.test.mjs` 原址补例 + T-DSK43 ⑥）/ `:426`（F-Esc 机检 = T-DSK43 ⑤）判据补落 |
| 8 🟡 | **已修**（一分区残留 = 新 1） | `E2E-TESTING.md:142` / `:179` / `:180` + `PROJECT.md:500` / `:568` / `:569` 断言面二分：**离线不可产面** = 人工走查 + 父侧真跑闭合 |
| 9 🟡 | **已修** | `PROJECT.md:430`：**台账行出站不在此档**——落 `project-info.mjs` 行〔开项目成功链持有面〕；`:432` / `:433` · `IPC.md:28` 同源（§2.3 旧记法以 §2.8 项 9 为准） |
| 10 🟡 | **已修** | `PROJECT.md:483`（D10 行补本批句）；`:499`：需求回指 = D3 / D5 / D6 / **D10** / D13 / D19 **六**行已随注 |
| 11 🟡 | **已修** | `IPC.md:319`（记录）：`:48` 失效口径残体删；`PROJECT.md:492` / `:562` 皆单句现态（无「原…退场」残体） |
| 12 🔵 | **已修** | `UI.md:417`：着装面落 **`data-path` 锚**（值 = 该链接盘上绝对路径——核件不带 ⇒ 端侧着装时落；断言面 = T-DSK42 / T-DSK43） |
| 13 🔵 | **已修** | `E2E-TESTING.md:190` 按批读注补本批一行 |
| 14 🔵 | **已修** | `IPC.md:88` `file:open` 行收两格（回执 / 实现面并入「载荷语义」格） |
| 15 🔵 | **已修** | `PROJECT.md:453`：styles.css **493 ⇒ ≈499**（diff 三变量 × 亮暗两套 = +6〔单变量两套两行〕；距 500 硬限 1 行 ⇒ **越 500 须先拆档**…实施实读越 500 ⇒ 停手上抛） |
| 16 🔵 | **维持**（裁定 · 非阻断） | 沿 2026-09-27 裁定（`PROJECT.md:454`：测试档随修随加——不占设计条目） |

**二、父侧三处同族收正（② · 已核）**：`PROJECT.md:65` KD-27 = **文件链接承载**（「对齐第三批」D19 收正——宿主验存链 + 核包裹 + `file:open`；单源 = 本档 §2 **KD-39**）· `UI.md:137` 同句 · `PROJECT.md:625` §8 不做行已删「文件链接出口」（余「搜索面（暂缓面——KD-RC-5）」；KD-27 被否候选「落文件链接无出口」保留为其被否义，与 KD-39 不抵）——三处同源。

**三、新发现（本轮）**

| # | 严重度 | 文件 | Issue | 证据（本轮实读引文） |
|---|---|---|---|---|
| 新 1 | 🟡 | `E2E-TESTING.md` · `UI.md` | T-DSK42 ⑤「文件链接」归「离线可产」与自身边界相抵——夹具 = 会话槽族档（仅回放面），而「历史卡（页读面）零链接」⇒ `.file-link` 离线不可产（`T-DSK37` 既有断言「路径候选零 `.file-link`」同径） | `E2E-TESTING.md:142`：**离线可产断言面** = 工具卡摘要 / 错误横幅 / 欢迎条 / 文件链接 / 设置面类型加工 / Esc 关闭 · `:179`：⑤ 工具结果含盘上真路径 ⇒ `.file-link[data-path]` 在场 ∧ 点按 ⇒ 零 `pageerror` ∥ `UI.md:419`：边界：历史卡（页读面）零链接（VSC 同径）——修法：⑤（与 §4 清单）改标「离线不可产」并入人工走查 + 父侧真跑闭合 |
| 新 2 | 🔵 | `UI.md` | 本批注 D.计数未随 #1 落拆收正 | `UI.md:430`：新档 **1**（主侧 `file-links.mjs`）——第二档 `renderer/i18n-views.mjs`（`PROJECT.md:452`）未计；修法：改「新档 1 + 拆分产出 1」 |
| 新 3 | 🟡（在册 · 非阻断） | `PROJECT.md` | §4.1 系统性滞后（本座「只报未动 ②」已登记 · 未修） | `:159`（**351 ⇒ 369 ⇒ 500 ⇒ 473 ⇒ 494**）对 §4.2 `:435`（**350 ⇒ ≈378**）· `:161`（**60**）对 `:451`（mount-pool **90 ⇒ ≈92**）· `:138`（白名单 R3 后 **28 项**）/ `:153`（**26 ⇒ 27 项** · 白名单十三通道）对 `IPC.md:109`（**已实给 29 项**）/ `:67`（**十六通道**）· `:141`（九回调）对 `IPC.md:30`（**十四回调**）——建议归 §4.1 回填轮（父侧直接执行先例） |

**四、说明**：③ doc-check 净增读数（批档 §2.8「悬空 **64 ⇒ 64** / 行宽 **36 ⇒ 35**」）——本轮工具面只读、无执行 ⇒ **未复算（unverified）**；文内可核处 = 新增引用皆带「（拟新增）」标记（`PROJECT.md:164` / `:218` / `:452`）。表外（不计严重度）：`SHELL.md:24`「九回调」与 §4.1:141 同源旧值（该档不在本轮射程）。

**计数（轮 2）**：轮 1 十六条 = **15 修复 + 1 维持**；新发现 = **🔴 0 · 🟡 2 · 🔵 1**；阻断项 = **0**。

VERDICT: pass

## §4 用户批准（主 agent）

**§4 父侧代签（用户 2026-09-28 12:29「后续自动跑完吧」全链授权 ✓）**

- **三条件齐备**：① **设计评审 pass**——轨迹 = 轮 1（1🔴 · 10🟡 · 5🔵 = 16 项 · changes-required）→ 修正轮 #17（1–15 逐条落 · #16 维持）→ **复核轮 2 = pass**（0🔴 · 新发现 2🟡+1🔵 = 非阻断——15/16 修复逐条复验 + 父侧三处同族收正在案）；② **修正落地逐条核验** ✓（复核轮逐条写盘复验 + 父侧亲核实读）；③ **token 已签发**（凭据值不落档——沿纪律）。
- **裁定随记**：轮 2 新发现 → **#17（T-DSK42 ⑤ 重分类）· #18（D.计数补拆分产出）= 微收正轮（另派，实施前落）**；**#19（§4.1 系统性滞后）= 回填轮（父侧直接执行先例）**。三件均非阻断。
- **批准范围**：本批设计全量（小修族 25 + 相抵 2 + 出处重核 12 · KD-37–39 · API 面 / 测试面 / 文档面）+ 实施（排 idle-wake 收口后由父侧另派）。
- **自缚四条**：复评再出 🔴 即停 · 验证不过即停 · 新范围或口径裁决即停 · 代签仅三条件齐备。

## §5 实施记录（eng-coder）
**状态行**：实施完成（三舱齐（A 宿主面 ∕ B 归约与对话流面 ∕ C 外围 · 词表 · 样式面）——C 舱收口读数：全量 241/241 绿 ∧ 冒烟 window:true ∧ ok:true；审计 1 轮 + 评审 1 轮（VERDICT pass）+ 自修 2 轮 ⇒ 终态 clean）



### 5.1 宿主面（实施舱 A · 范围 = `src/main/*` + `src/preload/preload.cjs`；renderer 面 = B/C 舱，零触碰）

**落点微调（父侧裁定 ③ · 本舱据以落形）**：`ev:ledger` 出站挂点 = **`session:resume` 成功径**（会话键天然在手：`key = String(receipt.slot)`）；**持有面 = `project-info.mjs` 不变**（扫描 / 行产 / 出站逻辑住该档，`ipc.mjs` 只挂调用）。一次判据（取最小形）已核：渲染面 `resumeOpened` 全仓仅 `renderer/app.mjs:141` 一条调用径 ⇒ 每次开项目恰一次，无需第二判据。

**逐项 → 改动（file:line = 落笔后实读）**

- 对话流 2 失败判据：`src/main/agent-bridge.mjs:29`（核 `isToolFailure` 单源 import）· `:198`（`ok: !isToolFailure(result)`）。
- 对话流 14 advisor 轮次：`agent-bridge.mjs:184-185`（仅 `advisor` 名携两键 · 采样缺 ⇒ 零键）· `src/main/agent-host.mjs:73-79`（`advisorMeta` = `_advisorRound` 活读 +1 ∕ `provider.model`）· `:104`（注入）。
- 对话流 9 错误横幅（宿主半）：`src/main/turn-face.mjs:19-22`（`techInfoOf`）· `:53`（`ev:error` 携 `techInfo`；缺 ⇒ 键缺席）。
- 对话流 7 子回合边界：`agent-bridge.mjs:219`（`onTurnEnd ⇒ ev:activity { event: "turnBreak" }` · 无 `fields`）。
- 对话流 12 台账行：`src/main/project-info.mjs:48-83`（`pushLedgerLines` —— 核 `runLedgerScan` 直取 · 零行零出站 · 扫描 ∕ 出站两段自吞）· `src/main/ipc.mjs:55-58`（`setLedgerEmit` 注入面）· `:145-152`（resume 成功径挂调用）· `src/main/main.mjs:71-74`（`emit` 提取为单点）· `:91`（`setLedgerEmit(emit)`）。
- 外围 1 owner ∕ 相抵① diff：`agent-bridge.mjs:208-209`（四参缝）· `src/main/suspensions.mjs:32-37`（`extraKeys`）· `:55-59` ∕ `:64-69`（两门出站随动）。
- 外围 5 等待审批态：`agent-bridge.mjs:212-216`（`{ status: "approval", role, id, model, tool }`；缺 id ∕ role ⇒ 零投）。
- 外围 12 末项门：`src/main/session-actions.mjs:62-65`（`listSlots ≤ 1 ⇒ last-session`；cwd 空不入档）。
- 相抵② 文件链接：新档 `src/main/file-links.mjs`（`extractFileLinks` :30-53 —— 验存闸 ∕ 去重 ∕ `MAX_LINKS=50` ∕ 无 cwd 相对 token 零判据；`fileOpenTarget` :55-63 —— 非空绝对串判据）· `agent-host.mjs:35` 与 `:105`（`extractLinks` 注入）· `agent-bridge.mjs:192-202`（`ev:tool-result` 增 `links`；空 ∕ 缺 ⇒ 零键）。
- `file:open` 通道：`ipc.mjs:19`（`shell`）· `:107`（HANDLERS 末位）· `:200-210`（`shell.openPath` ⇒ `{ ok, reason }`；非绝对 ∕ 空 ⇒ `bad-path`）· `src/preload/preload.cjs:27`（请求白名单 **28 ⇒ 29**）· `:32`（`EVENT_CHANNELS` **15 ⇒ 16**，`ev:ledger` 末位）。

**测试面**：新档 `test/file-links.test.mjs`（U197 ∕ U198）+ `test/files.mjs:5` 登记；原址补例 = `agent-bridge-subagent`（U196）· `agent-host`（U195 + U86 两臂）· `agent-host-usage`（U133 随动）· `host-floor`（U13 ∕ U74 ∕ U76 ∕ U77 ∕ U95 随动 + U200 接线源面锁）· `session-contract`（U37 ∕ U57 末项门两向 + reason 七值闭集）· `projects`（U27）· `project-info`（U199）。

**读数**：本舱八档（`node --import ./test/rc-resolve.mjs --test …`）= **62 pass ∕ 0 fail**（自修后复跑）；冒烟 `npx electron . --smoke --user-data-dir=<tmp>/userData` = `window:true ∧ ok:true ∧ boot:"ok" ∧ errors:[]`（实跑两次 · 含自修后复跑）。
全量 `npm test`（as-of 收笔）：**221 tests · 217 pass · 4 fail** —— 4 红逐例归因 = **他舱在途**（renderer 面正在被 B ∕ C 舱写入）：`test/views-chat.test.mjs` ∕ `test/views-chat-frame.test.mjs` ∕ `test/views-question.test.mjs` 三档装载失败（`SyntaxError: renderer/views/chat.mjs does not provide an export named 'syncChrome'` = 该档正在途改写）+ `T-DSK37`（集成域同源面）。本舱目标八档 0 红。

**偏离披露（非静默）**：① `techInfo` 落 `turn-face.mjs`（`ev:error` 唯一出站点），设计落点行（UI 项 9 ∕ `PROJECT.md` §4.2 ∕ IPC 产出方坐标）仍记 `agent-host.mjs` —— 档面滞后，代码档头已自述；② `ev:ledger` 挂点 = `session:resume`（上「落点微调」句）vs 档面 `PROJECT.md:445` ∕ `:446` 记 `project:open`；③ 清单外改动两处并报由：`src/main/main.mjs`（+1 import ∕ +1 调用 ∕ `emit` 提取 —— 台账出站面注入所需；内部分歧审计复核判「必要且最小」）· `test/agent-host-usage.test.mjs` ∕ `test/projects.test.mjs`（既有断言随载荷 ∕ 白名单随动 —— 原址补例义务内）。

**自含交付轮次**：内部分歧审计 1 轮（explore）= **无分歧**（四类偏差零命中；两处已声明偏离经复核「如实且已最小化」）；内部代码评审 1 轮（advisor）= **VERDICT pass**（9 行：6🟡 ∕ 3🔵，无 must-fix）；**自修轮 1** = 两项收口（`project-info.mjs:76-81` 出站 try/catch —— 闭合「未处理拒绝 ⇒ `main.mjs:107` fatal」面；`file-links.mjs:62` 加绝对性判据 + `test/file-links.test.mjs:73-76` 补臂）；**终态 = clean**（自修后八档 62/62 绿 + 冒烟复跑绿）。

**待父侧处置（本舱只报未改）**：① 相抵① 验收行「真机：apply_patch 门见 diff」在**深度 0 门不可达**（核深度 0 恒两参缝 = `thincoder-core/agent/dispatch.mjs:303`；VSC 自算 `diffInfo` = `thincoder-vscode/src/agent/execute-tools.mjs:168`）⇒ 实现与设计单源一致，请裁「补来源 ∥ 收正验收行」；② 档面三处落点随动（`techInfo` ∕ 台账挂点 ∕ §4.2 实读值：agent-bridge **248** · agent-host **298** · project-info **96** · ipc **256** · suspensions **128** · turn-face **62** · session-actions **73** · file-links **63**（新档）· preload **58** · main **108**）；③ 测试档越层值随动（`session-contract` **319 ⇒ 331** · `host-floor` **313 ⇒ 333** · `agent-host` **338 ⇒ 472** —— 皆在册越层档 + 拆档预案，值漂移归 §4.1 回填轮）。

### 5.2 归约与对话流面（实施舱 B · eng-coder · 2026-09-28）

**任务书** = 本档 §2（2.1 / 2.3 / 2.4）+ 设计单源 `docs/desktop/design/UI.md` §1「本批注（对齐第三批 · 小修族）」+ 父侧口径裁定「①+②」（凡落本舱文件面的归约与渲染片皆本舱落：`events.mjs` / `page-read.mjs` / `views/chat*.mjs` / `mount-composer.mjs` / `attach.mjs` / `app.mjs` / `chat.css`）。
宿主片（bridge 五缝 / `techInfo` / `round`·`model` 采样 / `ev:ledger` 出站 / `last-session` / `file:open`）= 舱 A（盘面已落 —— 本舱按 `IPC.md` §1 载荷契约消费，宿主档零触碰）。C 舱域（`core.css` / `styles.css` / `i18n*.mjs`）零触碰；`docs/**` 零触碰。

**逐条落点（项 → 改动 file:line · 行号为改后位）**

| 项 | 改动（file:line） |
|---|---|
| 对话流 1 摘要段 | `renderer/views/chat-tool.mjs:98,112`（`→ ` + 核 `formatToolSummary` 直取；摘要空 ⇒ 零段） |
| 对话流 2 红绿 | `renderer/chat.css:54-58`（`.tool-head[data-status=error]` ⇒ `#f14c4c` ∥ `done` ⇒ `#4ec9b0` —— 值源 = VSC 内联色；宿主 `isToolFailure` 半 = 舱 A） |
| 对话流 3 运行期实时输出 | `renderer/events.mjs:128-143`（chunk 到达清显式折叠旗）+ `renderer/views/chat-tool.mjs:66-69`（缺省 ∧ `running`/`error` ⇒ 展开） |
| 对话流 5 中止清扫 | `renderer/events.mjs:292-304,347-349`（`stopped` ⇒ running 工具块就地 `interrupted`）+ `renderer/views/chat-tool.mjs:26-31`（词键 `tool.interrupted`） |
| 对话流 6 停止痕 | `renderer/events.mjs:306-312,350`（`stopMark` 切片）+ `renderer/page-read.mjs:82-89,109-113`（首屏页读整置清点）+ `renderer/views/chat-chrome.mjs:56-59,192-193`（`[data-stopped]` 非块节点 + 锚定建 / 摘）+ `renderer/chat.css:426` |
| 对话流 7 turnBreak | `renderer/events.mjs:328-329`（清游标 · 非回合尾 · 键门同块面） |
| 对话流 8 恢复帧次序 | `renderer/page-read.mjs:57-79`（序 = `[reasoning?, assistant?, …tools]`） |
| 对话流 9 错误横幅 | `renderer/events.mjs:359-363`（`techInfo` 载波）+ `renderer/views/chat.mjs:116-135`（`.error-text` + `details.error-details` + 重试钮）+ `renderer/views/chat.mjs:85-88`（`canRetry` 判据）+ `renderer/app.mjs:168-177,211`（`onRetry` ⇒ 输入区既有直发径重发末 `user` 块）+ `renderer/chat.css:398-423` |
| 对话流 12 台账行 | `renderer/events.mjs:370-386,406`（`ev:ledger` 归约）+ `renderer/views/chat.mjs:83,103-111`（模型 `ledger`）+ `renderer/views/chat-chrome.mjs:62-72,166-178`（`[data-ledger-line]` 组 + 原位换代）+ `renderer/chat.css:429-431` |
| 对话流 13 发送后回底 | `renderer/mount-composer.mjs:201-219`（`appendBlock` + `returnToBottom` 并笔；入队径不回底） |
| 对话流 14 轮次标签 | `renderer/events.mjs:116-126`（`round`/`model` 入块）+ `renderer/views/chat-tool.mjs:75-82,107`（`(round N · model)` 段 —— 同 VSC `ui.js:104-107` 式） |
| 对话流 15 欢迎条 | `renderer/views/chat-guide.mjs:23-26,52-67`（三行：抬头 / 文案二值 / 快捷键行）+ `renderer/chat.css:466-484` |
| 外围 22 非栅格拒 | `renderer/attach.mjs:26-33,47-72,166-178`（栅格四型门 + 拒表去重保序 + 提示行构树）+ `renderer/mount-composer.mjs:296-305`（粘贴即拒 + 采集 / 发送替换清） |
| 外围 26 发送失败可见性 | `renderer/mount-composer.mjs:84-89,109-123,314-330,379-390`（`data-notice="send-failed"` + 文本保留 + 下次成功清） |
| 外围 28 中断键两态 | `renderer/mount-composer.mjs:64-76,127-137`（`busy` 判据 + 两态接线）+ `COMPOSER_KEYS` 增 `tabBadges` |
| P7 2s 拍 | `renderer/heartbeat.mjs`（新档 44 行 —— `refreshLiveBlocks` 拍体 + `createHeartbeat` 定时器封装）+ `renderer/app.mjs:274-287`（单点 `setInterval` + `unload` 清点 + 状态行重挂判据） |
| 相抵② 文件链接 | `renderer/events.mjs:156-160`（`links` 载波）+ `renderer/views/chat-tool.mjs:166-215`（着装 `linkifyResult` / 命中 `fileLinkOf` / 委托 `bindFileLinks`）+ `renderer/views/chat.mjs:220-224,377-381`（帧尾着装两径）+ `renderer/app.mjs:179-187,271-272`（出口 + 委托注册单点）+ `renderer/chat.css:462-464` |
| 相抵① diff 样式半 | `renderer/chat.css:433-459`（`.diff-preview` 族 —— 值源 = VSC `base.css:405-437`；构件面 = #27 舱） |
| 相抵① 归约半 | `renderer/events.mjs:46-49`（`APPROVAL_KEYS` 增 `owner` / `diff`） |
| F-置焦（执行点） | `renderer/views/chat-chrome.mjs:210-218`（帧尾对 `[data-autofocus="1"]` 执行 `focus()` · `_autofocused` 记账幂等）+ `renderer/app.mjs:228-230`（帧出口三径同点 —— 卡由 `paintCards` 后到补一拍） |

**拆分产出（在册预案本批执行）**：`renderer/views/chat-chrome.mjs`（帧尾态刷面 —— `chromeProps` / `syncChrome` / 四尾组构树（摘要 / 消化 / 停止痕 / 台账 / 药丸）/ 插点锚五 / `focusAutofocus`；`renderer/views/chat.mjs` **439 ⇒ 327**；依赖单向（`chat.mjs` → 本档，反向零引用 ⇒ 无环））。

**命令读数（本舱实测）**

- 目标档（`node --import ./test/rc-resolve.mjs --test <档>`，逐档绿）：`events-reduce` 8/8 · `views-chat` 7/7 · `views-chat-frame` 2/2 · `views-chat-guide` 1/1 · `views-chat-text` 3/3 · `views-attach` 5/5 · `views-chrome` 8/8 · `views-chrome-vocab` 1/1 · `views-locks` 4/4 · `host-floor` 10/10 · `events-page` 5/5 · `views-question` 4/4 · `heartbeat` 3/3。
- **全量套件**（`cd thincoder-desktop && node test/run.mjs`）= **234 tests / 234 pass / 0 fail**（含集成域 6 档真 Electron：T-DSK27 / 32 / 37 / 38 / 39 / 40 全绿；基线 220 之外 = 本舱新例 U204–U208 + U201–U203）。
- 冒烟（`npx electron . --smoke --user-data-dir=%TEMP%\align3-smoke\userData`）= `lock:"primary"` ∥ **`window:true`** ∥ `boot:"ok"` ∥ `errors:[]` ∥ **`ok:true`**。
- 行数（内容行）：`events.mjs` 456（≤500 在册例外）· `page-read.mjs` 117 · `views/chat.mjs` 327（越 300 在册 —— 本批执行拆分预案后净降）· `views/chat-chrome.mjs` 258（新档 ≤300）· `views/chat-tool.mjs` 217 · `views/chat-guide.mjs` 79 · `views/attach.mjs` 179 · `mount-composer.mjs` 404（≤500）· `app.mjs` **300** · `chat.css` 484（≤500）· `heartbeat.mjs` 44（新档 ≤300）。

**越域 / 表外披露（逐条带由）**

1. **新档三件（设计预估外）**：`renderer/heartbeat.mjs`（P7 需可直测缝 —— `app.mjs` 为浏览器专属档、测试只做源面扫描）· `renderer/views/chat-chrome.mjs`（在册预案落形）· `test/heartbeat.test.mjs`；连带登记 = `test/files.mjs` + `host-floor.test.mjs` `fresh` 臂（3 行）。
2. **`test/views-question.test.mjs`（C 舱测试面）一行为导入随动**：`syncChrome` 出档后 import 源改 `views/chat-chrome.mjs`（零语义）。
3. **`renderer/views/chat-text.mjs` 删失效边界句**（原「文件链接不承载（KD-RC-5）」—— 相抵② 收正后失效；沿 2026-09-18 失效表述纪律）。
4. **错误横幅文面类名取双类 `block-text error-text`**：保留核 md 容器样式面（`core.css` 五十余条规则以 `.block-text` 为容器选择器）—— 设计字面 `.error-text` 在场；单类方案会丢 md 面样式。
5. **`chat.css` 自带 `ledger-line` / `.warn` / `.file-link` 样式**：设计 §4.2 记其核类名映射归 `core.css`（C 舱域）—— 本舱未触碰 `core.css`（避跨舱），样式在 `chat.css` 自成；若 C 舱补映射 ⇒ 两档重复声明，请父侧裁。
6. **词表 6 新键待 C 舱落**（`tool.interrupted` / `error.retry` / `welcome.*` 四 / `composer.send.failed` / `paste.unsupportedFormat`）：本舱只消费（`i18n.mjs` 零触碰）；用例面经注入缝自携哨兵 ⇒ 不依赖词面到位。
7. **`views-chrome-vocab.test.mjs` 单列 `RETIRED_PENDING_KEYS = ["chat.empty.hint"]`**：欢迎条三行取代单行 hint ⇒ 该键树面消费归零（退役归词表面）；在途键（`PENDING_WORD_KEYS` 八）两向同除 —— 词面到位前后判据同形。
8. **`Details` 字面**（错误横幅 `summary`）：核横幅同字面（`thincoder-render-core/flow/block.mjs:138`），核 / VSC 两源无此词键 ⇒ 计入 vocab 测试 data 白名单；若词表面补键可替换。
9. **`mount-pool.mjs` 未触碰**：设计 §4.2 预记「拍体句柄出」—— 本舱改由 `heartbeat.mjs` 出拍体（可直测 + app 单点），池档零改。
10. **`store.mjs` 零改**：`stopMark` / `ledgerLines` 两切片沿 `susp` / `digest` 先例（归约面自持、缺省容忍、不进 `initialState` 槽位表 —— U75 槽位形锁不动）。

**设计档漂移（报父侧 ∕ 设计笔 · 本舱零改）**：`events.mjs` 456（设计 ≈378）· `mount-composer.mjs` 404（≈392）· `chat.css` 484（≈398）· `views/chat-tool.mjs` 217（≈168）· `attach.mjs` 179（≈162）· `app.mjs` 300（≈285）· `page-read.mjs` 117（≈104）· `views/chat-chrome.mjs` 258（设计预记 ≈60 —— 实际按「帧尾态刷 + 四尾组构树 + 锚 + 置焦」整面出档）· `test/host-floor.test.mjs` 336（>300 咨询线 · 无在册例外登记 —— 含本舱 +4；他批同档亦在写）· 用例档 `views-chat` 451（在册例外 ≤500 ✓）/ `views-chat-frame` 416 / `events-reduce` 417 / `views-locks` 397（均 >300 咨询线，未入例外表）。另：欢迎条文案二值取 `state.settings.configured`，未新增 `CHAT_KEYS` 条目（provider 配置变更不触发对话流重挂 —— 记录面口径）。

#### 5.2.1 自含交付轮次与修轮收口（同日追记）

**轮次**：内部分歧审计 **1 轮**（explore · 四类判据逐条：漏项 / 静默降级 / 越域 / 测试面）⇒ 报 **3 项非阻断**（收束后轮次段丢失 · `stopMark`/`ledgerLines` 未入帧触发表 · `heartbeat.mjs` 未入设计文件表 —— 末项 = 已在册披露）· 零漏项 / 零静默降级 / 零越域证据。**内部代码评审 2 轮**（advisor · 轮 1 = changes-required：**1🔴 + 3🟡 + 8🔵**；轮 2 = 修后逐条复验 ⇒ **VERDICT pass**）。**自修轮 1**（8 项收口）⇒ **终态 = clean**。

**🔴 收口（轮 1 发现 1 · 真缺陷）**：`renderer/events-subscribe.mjs` 订阅表 15 条**无 `ev:ledger`** ⇒ 宿主出站（preload 白名单已 16）与归约写者（`events.mjs:410`）齐而**订阅缺** ⇒ 项 12 全链在生产不可达（机检只覆盖归约 / 构树两半 ⇒ 全绿不可见）。已修：订阅表 15 ⇒ **16**（`ev:ledger` 随 `ev:error` 后，序同桥面表）+ 档头 / 注释计数随拍；并补**机制守卫** = `test/host-floor.test.mjs` U76 增臂「渲染面订阅表 ≡ 桥面 `EVENT_CHANNELS`（序同表 · 两向同集）」（源面机读 —— 此类缺订阅不再可测盲区）。

**其余收口（7 项）**：① 收束过载波（`events.mjs` `ev:tool-result` 承接 `round` / `model` —— 具名 advisor 卡头轮次段结果到达后不消失，补例 `events-reduce` U204）；② `stopMark` / `ledgerLines` 入 `CHAT_KEYS`（两尾组单变触发）；③ 重试谓词单源（`views/chat.mjs` 导出 `retrySourceOf` —— 钮在场判据与出口取文同谓词，防「可点但静默」）；④ 粘贴提示态实际变即重绘（`mount-composer.mjs`）；⑤ `app.mjs` 未用导入 `HEARTBEAT_MS` 收窄；⑥ `page-read.mjs` 未用导入 `sameRecord` 摘除 + 档头依赖句随实；⑦ `chat.css` 同值规则重复段摘除（保 :54/:57 单源，原第二位改指针注）+ 两档注释计数随拍（`events.mjs` 十五 ⇒ 十六）。用例面随动：`events-reduce`（15 ⇒ 16 通道 + 收束载波两臂）· `views-locks`（`chat.mjs` 导出面锁 + `CHAT_KEYS` 锁）· `host-floor`（新增订阅表守卫臂）。

**越域 / 表外追加披露（本轮新增于上文列表之外）**：`renderer/events-subscribe.mjs`（**订阅接线档** —— 不在本舱先前声明面；改动由因 = 为 `ev:ledger` 归约面补缺调用面，属本批项 12 的必要接线，非新功能）· `test/host-floor.test.mjs` +6 行（守卫臂）· `test/events-reduce.test.mjs` / `test/views-locks.test.mjs` 计数与导出面锁随动。

**记录面收正（上文 §5.2 两处随实态修订）**：① 上文「`stopMark` / `ledgerLines` 两切片 …… 不进 `initialState` 槽位表」（披露 10）**成立**，但同段「`CHAT_KEYS` 未新增条目」一句**作废** —— 实态 = 增 `stopMark` / `ledgerLines` 两键、`settings` 不入表（欢迎条文案二值随重挂径）；② 行数读数（修后定稿）：`events.mjs` 460 · `events-subscribe.mjs` 74 · `page-read.mjs` 116 · `views/chat.mjs` **338** · `views/chat-chrome.mjs` 258 · `views/chat-tool.mjs` 217 · `views/chat-guide.mjs` 79 · `views/chat-text.mjs` 132 · `attach.mjs` 179 · `mount-composer.mjs` 406 · `app.mjs` **297** · `heartbeat.mjs` 44 · `chat.css` 483；用例档定稿：`events-reduce` 421 · `views-chat` 451 · `views-chat-frame` 417 · `views-attach` 338 · `views-chrome` 372 · `views-chrome-vocab` 362 · `views-chat-text` 197 · `views-locks` 397 · `host-floor` 343 · `heartbeat` 75 · `files.mjs` 23 · `integration/chat-render` 283 · `views-question` 365。**硬限核查**：全舱改动档 ≤500 ✓（`events.mjs` 460 · `mount-composer.mjs` 406 · `chat.css` 483 三档越 300 咨询线均在册／§4.1 预案）。

**修后命令读数（定稿）**：全量套件 `node test/run.mjs` = **234 tests / 234 pass / 0 fail**（含集成域 6 档真 Electron 全绿；复跑三次稳定 —— 并发负载下行 hover 读数一臂曾偶红，单跑复现绿 = 既有 hover 时序敏感面，非本舱）；冒烟 `npx electron . --smoke --user-data-dir=<tmp>/userData` = `window:true ∧ boot:"ok" ∧ ok:true ∧ errors:[]`（修后复跑）。

**待父侧处置（本舱只报未改 · 修轮复验残留）**：① `chat.css` 三 diff 变量（`--diff-add-bg` / `--diff-add-fg` / `--diff-del-fg`）全仓零定义（`styles.css` 仅 `--diff-del-bg`）⇒ 相抵① diff 双色面不生效，落点归 C 舱 / `styles.css`；② 词表 6 组新键未落（C 舱）—— 消费面已就位、用例自带哨兵；③ 重试出口无回执钩 ⇒ 重试发送失败仅诊断无可见行（评审轮 2 观察项，是否补归父侧裁）；④ `events.mjs:297`「第八词」vs `views/chat-tool.mjs:13`「七词闭枚举」字面计数口径待定源（非本修引入）。

### 5.3 外围与词表样式面（实施舱 C · eng-coder · 2026-09-28）

**任务书** = 本档 §2（2.1 / 2.3 / 2.7）+ 设计单源 `docs/desktop/design/UI.md` §1「本批注（对齐第三批 · 小修族）」项 1 / 2 / 3 / 12 / 14 / 15 / 23 + 相抵① / ② + F-置焦 / F-Esc + `PROJECT.md` §4.2 + `E2E-TESTING.md` §6（T-DSK42 / T-DSK43）。域界 = 舱 C（外围 + 词表 + 样式面）：`renderer/i18n*.mjs` · `renderer/styles.css` · `renderer/core.css` · `renderer/views/{approval,question,sessions,settings-sections,chrome}.mjs` · `renderer/mount-{cards,settings,head}.mjs` + 各自用例档；A 舱（`src/main/*` + preload）与 B 舱（`events.mjs` / `page-read.mjs` / `views/chat*.mjs` / `attach.mjs` / `app.mjs` / `chat.css`）零触碰（例外见偏离 ⑦）。

**逐项 → 改动（file:line = 落笔后实读）**

- 词表 19 键 × 两语：新档 `renderer/i18n-views.mjs`（`VIEWS_DICT` :16-68 —— 四组 = 对话流 6 ∕ 输入区 2 ∕ 审批 1 ∕ 设置面十键）；`renderer/i18n.mjs:33` / `:249`（两语 `...VIEWS_DICT.*` 展开合并 ⇒ `HOST_DICT` 单一持有点 · 合并点仍 = `initDict`）+ 退场一键 `chat.empty.hint`（两语同删）。
- 相抵① 三变量 + 类名映射：`renderer/styles.css:34-37`（暗 · 值 = VSC `webview/base.css:35-38`）/ `:63-66`（亮 · 值 = `:58-61`）· `renderer/core.css:339-345`（核类名映射 · 组外面：`.ledger-line` / `.ledger-line.warn` / `.file-link` / `:focus-visible`）。
- 外围 1 owner ∕ 相抵① diff：`renderer/views/approval.mjs:120-126`（owner 首段 `<owner> · <tool>`；工具名缺 ⇒ 不拼空段；批形零 owner）· 阈值 `:111-113`（`DIFF_PATCH_FLOOR=20` ∕ `DIFF_SAME_FLOOR=12`，严格大于 · 与核 `cards/permission.mjs:32` ∕ `:36` 同值）· 体 `:134-157`（行面 = 核 `patchLineType` ∕ `lineDiff` ∕ `renderDiff` 直取；超阈 ⇒ 只出 header + 计数 `approval.diff.large`）· 卡子序 `:163-188`（[head, changes, diff, exits] · null 占位保留）。
- 外围 2 Enter ∕ 外围 3 聚焦两态：`renderer/views/question.mjs:66-82`（Enter 描述符）· `renderer/mount-cards.mjs:168-173`（泻入既有 `onAnswerDraft` —— 单一实现）· `:141-148`（卡插入 ⇒ 卡内 `[data-input="answer"]` 置焦）· `:62-82`（回执 ok 真 ⇒ 回焦 `[data-input="text"]`；失败零动）· `renderer/mount-composer.mjs:61-63`（`isComposing` 导出 = 组字判据单源）。
- 外围 12 末项删除门（渲染半）：`renderer/views/sessions.mjs:169-173`（`rows.length > 1`）· `:183-186`（常态两控件的落点门 · 单会话零控件）。
- 外围 14 类型加工 ∕ 外围 15 agent 形态：`renderer/views/settings-sections.mjs:30-41`（`NAMED_FIELDS` 十键表 = 键集 ∕ 词键 ∕ 控型三面单源；`consultTimeoutMs` `scale: 60000`）· `:108-130`（泛化兜底行控型三值）· `:143-155`（具名控件行 `data-field-name` + `change`）；`renderer/mount-settings.mjs:56-60`（现态读数表）· `:62-73`（`rowValue`：checkbox ⇒ `.checked` ∕ number ⇒ `Number(v)` ∕ 余原串；空 ∕ 非数 ⇒ `undefined`）· `:75-102`（`agentPatch` 变更集 + 无效行计数 + 逐行诊断）· `:310-311`（保存径：无效行 ⇒ 回退重绘 + 零发送）· `:414-424`（`namedOut` 出值 + `scale` 回毫秒轴）· `:429-440`（`applyNamedField` 单键 patch 即改即存 · 失败 report 零乐观写）· `:461-470`（F-Esc：`document` keydown ⇒ 既有 `closeSettings` 出口，单一实现）。
- 外围 23 忙态写门：`renderer/views/chrome.mjs:57-60`（`busyOf` 单源）· `:64-68`（`headModel.busy`）· `:112-118`（`pickNode` 忙 ⇒ `disabled` + `aria-disabled` 保位）· `:176`（挂载面取忙态）· `renderer/mount-head.mjs:107-112`（写路入口忙判 ⇒ 零通道 + 回退 + 一行诊断）。

**测试面**：新档 `test/views-settings-agent.test.mjs`（U212 —— 自 `views-settings` 拆出：宿主档在册例外触 ≤500 硬限 ⇒ 按在册预案执行拆分）· 新档 `test/integration/align3-face.test.mjs`（T-DSK42 ∕ T-DSK43 · 单窗体两用例共壳 —— 同域 hover 读数对并行实例敏感，两壳体叠加会扰动邻档）；原址补例 = `views-approval`（U209 + 子序 ∕ 索引随动）· `views-question`（U210）· `views-rail-actions`（U211）· `views-head`（U213）· `views-chrome-vocab`（键数链 177 + `ALIGN3_WORD_KEYS` + 超阈 diff 树消费面 + `chat.empty.hint` 除名）· `views-locks`（导出面三档：`chrome.busyOf` ∕ `settings-sections.NAMED_FIELDS` ∕ `mount-composer.isComposing`；`styles.css` 新增变量 14 ⇒ 17）· `views-harness`（假面补缝 `type` ∕ `checked`）· `host-floor`（`i18n-views` ∕ `views-settings-agent` 入 ≤300 臂 + `views-head` 入例外面两向登记）· `files.mjs`（两新档登记）。

**读数**：本舱目标档（`views-approval` / `views-question` / `views-rail-actions` / `views-settings` / `views-settings-agent` / `views-head` / `views-chrome-vocab` / `views-locks` / `host-floor` / `align3-face`）= **全绿**；全量 `npm test` = **241 tests · 241 pass · 0 fail**（自修后连跑两轮同结论）；冒烟 `npx electron . --smoke` = `window:true ∧ boot:"ok" ∧ errors:[] ∧ ok:true`（自修后复跑）。

**偏离披露（非静默）**：
① **设计短名解析**：`UI.md:401` 第十键字面 `advisor.effort` ⇒ 实落 `agent.advisor.reasoningEffort`（核读取键单源；依据 = 核 `config.mjs:49` 顾问覆写族 + VSC 写面 `settings-panel-write.mjs:165`「legacy `advisor.effort`——写而无人读的死键」）——档头登记在册，请设计笔同笔收正字面。
② **`core.css` 由「零改」转为「按设计落映射」**：项 12 ∕ 相抵② 设计落点行明列 `core.css`（核类名映射）⇒ 本舱落 `core.css:339-345`；由此与 B 舱在 `chat.css:429-430` ∕ `:461-462` 的同值规则**重复声明**（B §5.2 披露 5 已预警「若 C 舱补映射 ⇒ 两档重复声明，请父侧裁」）——本舱只报未删（跨舱删除），请父侧裁单源。
③ **F-Esc 绑定宿主**：设计句记「面板根 `keydown`」，实落 **`document`**（点开后面板外焦点在入口钮 ⇒ 绑面板节点收不到键；沿 `views/tabbar.mjs` 加速键先例 ∥ VSC 同径）——E2E T-DSK43 ⑤ 真点开 + Escape ⇒ 清空为证；请设计笔收正「绑定宿主」字面。
④ **行数漂移**（实读 vs §4.2 设计值）：`mount-settings.mjs` **499**（≈452）· `views/settings-sections.mjs` **357**（≈312）· `i18n.mjs` **490**（≈475）· `views/sessions.mjs` **305**（≈306 ✓）· `styles.css` **499**（≈499 ✓）· `core.css` **346**（≈350 ✓）· 新档 `i18n-views.mjs` **69** · `views-settings-agent.test.mjs` **128** · `align3-face.test.mjs` **196** · `views-head.test.mjs` **356**（触发线 ⇒ 入例外面登记）。
⑤ **词键计**：**159 + 19 − 1 = 177**（同批退场一键 `chat.empty.hint` —— `no-message` 帧欢迎条三行取代单行提示，树面消费归零 ⇒ 键面随退；设计 D.计数句 ≈18，行内自注「按盘面实读计，不以计数为门」）。
⑥ **数值 `0` 处置**：裁定面 = 空 ∕ 非数 ⇒ 零发送；数值 **`0` 照发**（核类型表只校 `typeof` ⇒ 值域语义归消费面，端侧零白名单）——U212 ④ 有专臂。
⑦ **越域 / 声明面外改动**：`renderer/mount-composer.mjs` 同档双舱触碰（B 舱 P22 ∕ P26 ∕ P28 面 + C 舱 `isComposing` 导出两行）——落笔区不重叠、两舱用例同绿，归属如需归一请裁；另 `test/views-harness.mjs`（假面补缝 `type` ∕ `checked`，`selfCheck` 不动）· `test/host-floor.test.mjs`（新档入 ≤300 臂 + `views-head` 例外面登记）· `test/files.mjs`（两新档登记）皆为本舱声明面外的最小随动，逐条登记于此。

**自含交付轮次**：内部分歧审计 1 轮（explore）= **4 项发现**（§5.3 未写〔本轮补〕+ 三处文档面：`advisor.effort` 字面 ∕「读回兜底」未实现句 ∕「同名键」口径）⇒ **自修轮 1** 收口（删未实现句 + 收正「键名两形」口径 + 本段落档）；内部代码评审 1 轮（advisor · 25 档）= **VERDICT pass**（6🟡 ∕ 6🔵，零 must-fix）⇒ **自修轮 2** 收口一项（P14 泛化兜底行「控件回退现值 + 零静默」：`mount-settings.mjs:91` 逐行诊断 + `:102` 无效行计数 + `:311` 回退重绘；`test/views-settings-agent.test.mjs:120-128` 补臂）；**终态 = clean**（自修后全量 241/241 绿 + 冒烟绿）。

**待父侧处置（本舱只报未改）**：① 单源裁定 = `core.css` ↔ `chat.css` 重复声明（偏离 ②）；② 拆分 ∕ 续期一次裁清 = `mount-settings.mjs` **499**（顶格 1 行余量 · 在册预案「信息行接线 + 读数供给拆出」· 消解窗口 = 本批）· `views/settings-sections.mjs` **357**（在册越层 + 预案「agent 段拆分」· §4.1 值列待收正）· `core.css` **346**（在册预案「按面拆第二档」· 窗口 = 本批）；③ `UI.md:401` 第十键字面收正；④ F-Esc 绑定宿主字面收正；⑤ **#33 双认领面**：`align3-face.test.mjs` + `files.mjs` 已由本舱落并绿 ⇒ 按 §1.16 分支 ① 转「steer #33：勿重复实现，转验证 ∕ 补漏 ∕ 用例」；⑥ `views-head.test.mjs` **356**（>300 —— 已在 `host-floor.test.mjs:331-335` 例外臂两向登记 + 拆档预案〔阻塞面 = 夹具三件外提共享档〕）；⑦ 可选建议 = diff 族类规则值锁入 U174 族（现值与 VSC `base.css:405-437` 逐值一致，无实值缺陷，仅闭不可见面的静默漂移口）。

### 5.4 点修轮（chat.css ↔ core.css 重复声明消解 · eng-coder · 2026-09-28 · 承 §1.18-1 单源裁定「留 core.css」）

**范围**：只动 `thincoder-desktop/renderer/chat.css`（零触碰 `core.css` / `styles.css` / 其余档；零新增规则；不做全量探索——点修）。

**逐号 → 改动（file:line = 落笔后实读）**

1. **删四条重复规则**（与 `core.css:342`–`:345` 逐字同值；改前坐标 = `chat.css:429` ∕ `:430` ∕ `:461` ∕ `:462`）：删净 —— 改后四类**规则定义**全仓唯一 = `renderer/core.css:342`–`:345`（`.ledger-line` / `.ledger-line.warn` / `.file-link` / `.file-link:focus-visible`）；`chat.css` 内仅剩注释提及（`:427` / `:457`）。
2. **注释随动（零语义）**：`:427`（台账行组 —— 注「类名面 = 核行产口径 `ledger-line` / `.warn`，样式单源 = `core.css` 核类名映射面；行文 = 核行产逐字」）· `:457`–`:458`（文件链接段 —— 注「核类名 `span.file-link`、类名样式单源 = `core.css` 核类名映射面〔本段零规则〕；`data-path` = 出口判据锚。点按 / Enter 出口 = 委托单点（`renderer/app.mjs`）⇒ `file:open`」）。
   - `:457` 的「〔本段零规则〕」= 内部评审 #1 的收口（见下「轮次」）—— 段注后无声明（`:459` 空行、`:460` 直进欢迎条段），标注防「删漏」误读；内嵌注、行数零变。

**保留面（核过未动）**：`.chat-ledger` 容器规则 `:428` · diff 族 `:430`–`:455` · `.chat-stopped` `:425` · 欢迎条族 `:460`–`:479`。

**命令读数（本舱实测）**
- 全量 `cd thincoder-desktop && node test/run.mjs` = **241 tests / 241 pass / 0 fail**（修后复跑）；冒烟 `npx electron . --smoke` = `window:true ∧ boot:"ok" ∧ errors:[] ∧ ok:true`（修后复跑）。
- 全仓 grep（`**/*.css`）：`.ledger-line` ∕ `.ledger-line.warn` ∕ `.file-link` ∕ `.file-link:focus-visible` 规则唯一定义 = `core.css:342`–`:345`（VSC `webview/chat.css` 同名面 = 另一实现面，不在本端单源面）。
- 行数：read 计法 484 ⇒ **480**（内容行 483 ⇒ 479 —— 净 −4 = 删行数自洽）；花括号 81 ∕ 81 平衡；载序核（`renderer/index.html:12`–`:13`：chat.css 先 / core.css 后）⇒ 等特异度下同值声明原本亦由 core.css 胜出 ⇒ 零视觉变。

**轮次与终态**：内部分歧审计 1 轮（explore）= **CLEAN**（漏项 / 静默降级 / 越域 / 设计分歧四类零命中）· 内部代码评审 2 轮（advisor：轮 1 = **VERDICT pass**（5 🔵，零 must-fix）→ **自修轮 1** = 收口 1 项（轮 1 发现 #1：文件链接段补「〔本段零规则〕」标注）→ 轮 2 = 复验 **VERDICT pass**）⇒ **终态 = clean**。

**越域 / 表外披露**：零越域（本轮改动面 = `chat.css` 一档）。评审余 4 项 🔵 只报未改（在本轮禁止面 / 可选面内）：#2 四规则值锁（须触 test 档）· #3 行数越 300 咨询线（在册）· #4 删前对拍件（记录面建议）· #5 批档 `:62` 改前坐标注（docs 档）。**待父侧处置 = 无阻断项。**

## §6 验证与收口（父代理）

### 6.1 亲验（2026-09-28 15:5x · 父侧独立复跑）
- **全量** `cd thincoder-desktop && node test/run.mjs` = **tests 241 ∕ pass 241 ∕ fail 0**（含集成域真 Electron 八案：T-DSK42 ∕ T-DSK43 ∕ T-DSK37 ∕ T-DSK32 ∕ T-DSK40 ∕ T-DSK38 ∕ T-DSK27 ∕ T-DSK39）。
- **冒烟** `npx electron . --smoke` = `window:true ∧ boot:"ok" ∧ errors:[] ∧ ok:true`（node 24.21.0 · sqlite ✓ · floorMet ✓）。
- **机检** `node scripts/doc-check.mjs --root .` = 悬空 64 · 行宽 35（净 0 ∕ 0——与基线同）。
- **交付齐**：舱 A ✓ · 舱 B ✓（+ 点修轮 #34 ✓）· 舱 C ✓；收口舱 #33 取消（双认领面已由 C 全落——§1.18-4）。

### 6.2 验收对照（D16：可见面改 ⇒ 真 Electron 用例）
- 离线可产面**全绿**（T-DSK42 ∕ T-DSK43 两集成新案在本回亲验中实跑通过）。
- **人工走查登记（非阻断）**：T-DSK42②（停止痕 · 真回合面）· T-DSK43①②③（真回合面）——离线不可产（§3 轮次 1 修正 #8 已裁二分），待真机走查（父侧 ∕ 用户）。

### 6.3 未决 ∕ 移交（在册不丢）
- **回填轮（汇批 · 已入册）**：四批实读值（本批 = 舱 A 十档 ∕ 舱 B 七档 ∕ 舱 C 四档 ∕ 点修轮 `chat.css` **480**）+ 测试档漂移（`session-contract` ∕ `host-floor` ∕ `agent-host`）+ BE 行 + KD-34 残值句改述 + `SHELL.md:43` 残体（midturn）+ 「第八词」字面口径（舱 C 两 🔵）——随实施轮终态**一次锚定**。
- **拆档批** = 台账 #510（`mount-settings.mjs` 特挂「触碰前必拆」）。
- **端差消解（另批）**：P14 真删键 = 主侧写链 + 核清除形扩族（§1.17）。
- **在途批（非遗留）**：timer-wake 阶段 2 ∕ midturn——设计已批（评审通过），实施待排（本批后按序）。

### 6.4 收口同步清单（D7）
- 角色表 = 六段齐（父 §1 ∕ 设计者 §2 ∕ 评审 §3 三轮 ∕ 父 §4 ∕ 实施舱 A–C + 点修轮 §5 ∕ 父 §6）；状态行随本收口置；指针（§1.14–§1.18 ∕ §4.1–§4.4 ∕ §5.1–§5.4）全解析；变更记录 = 六档各 +1 笔以上；台账 = 待核销诸桩（随提交核销）+ #510 + 回填轮（已入册）。
- **前批遗留交叉核对**：align-2 ∕ idle-wake = 已收口冻结 ✓；无「条目已结而锚批档未闭」项。
- **本批 = 实施完成 + 亲验通过 ⇒ 已收口 2026-09-28（记录冻结）。**
