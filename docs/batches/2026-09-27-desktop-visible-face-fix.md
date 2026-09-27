# 2026-09-27 · 桌面端可见面修复
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-27 · 来源 = 用户 2026-09-27 19:05「可以，先建这个批跑起来」（承父侧同日真机评估：集成冒烟 2/2 + 全量 167/167 + mock provider 全流程走查 ⇒ 五条可见面缺陷入账 #457–#461）。
> 台账 = #457–#461（归批 · 桌面端可见面）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-27

### 1.1 条目与口径（父侧 · 2026-09-27 19:0x ✓）

**来源** ✓：用户 19:05「可以，先建这个批跑起来」（承父侧 18:57–19:05 真机评估，读数见 §1.2）。

**本批一句话**：修桌面端**可见面**五条已确证缺陷（视觉 / 交互 / 状态刷新），口径 = **对齐 CLI / VSC 既有语义**（需求 `docs/desktop/requirements/PROJECT.md` §3.1:45/:47「与 CLI / 扩展端同一份」+ §3.5:78 用户 2026-09-26 原话「功能至少应该跟 cli/vsc 对齐」+ §7 A2 三端共享契约零回归），不新增功能面。

**条目（五件 · 台账 #457–#461 · 归批触发）**：

| # | 缺陷（台账） | 判据线（机器可检 · 设计面细化） |
|---|---|---|
| 1 | #457 输入区五类零 CSS：`.composer` / `.composer-input` / `.composer-interrupt` / `.chat-copy-block` / `.chat-copy-last` 在 renderer 四 CSS 档零规则 | ① 五类在 renderer CSS 档有规则（文本级机检）；② 真 Electron 实测：输入区 textarea 撑满中区可缩、Stop 与两复制控件形态可辨（非空默认按钮）；③ 截图走查 |
| 2 | #458 活流不落用户块（活流 ↔ `history:page` 回放不一致） | **口径 = 对齐两端**（两端先例见 §1.2）：发送后 user 块在对话流在场（内容逐字）∧ 与回放块序一致；**出泡时序**（提交即出 ∥ 回执真后出）由设计轮按「三端同义 ∧ 既有判据不缩水」裁——**约束**：T-DSK32 ⑪ 现断言「失败 ⇒ 零假回合（`data-blocks === 0`）」，若改「提交即出泡」须同笔收正该判据（零缩水改写） |
| 3 | #459 回合尾 `data-streaming="1"` 不清（游标 `▌` 常驻） | 回合尾三径（`done` / `stopped` / `ev:error`）后对话流零 `[data-streaming="1"]` |
| 4 | #460 文本段零间隔族（裸文本子 ⇒ flex `gap` / `space-between` 静默失效）：toolHead / labelNode / approval-head / plan-row 四处 | 四处渲染面相邻文本段实测有间隔（Range 读 x 间隔 > 0）∥ 设计裁定的分隔形（逐处给形） |
| 5 | #461 信息行陈旧：开项目不触发 `refreshInfo` ⇒ 恒显启动期「No project open」 | 开项目（openDir ∥ 最近目录）后 `[data-slot="info"]` 不再是启动期 `no-project` 失败串（有读数即刷；真无读数面须有判据） |

### 1.2 证据与读数（父侧真机实测 · 2026-09-27 18:57–19:05 ✓）

- **冒烟读数**：集成 2/2 pass（T-DSK32 首启引导 12 序 4.3s · T-DSK27 设置面 4.1s）；全量 **167/167** pass · 0 fail（7.35s）。
- **评估方法**（临时件 · 不落产品树）：真 Electron（playwright-core）+ 本地 mock OpenAI 兼容 provider（隔离家）；真跑「开项目 → 建会话 → 文本回合 → 工具回合 → 设置面 → 窄窗」；截图 9 张落 `.thincoder/tmp/desktop-shots/`；全程零 pageerror。
- **关键读数**：textarea **161×21px** inline-block（中区 606px）· 回合尾 `data-streaming="1"` 常驻 · toolHead 四文本段 x 首尾相接 · 开项目后 info 行仍 `data-state="error"` + notice「No project open」· 活流两轮后 blocks=4 零 user 块。
- **两端先例（#458 对齐面 · 父侧实读 ✓）**：CLI = `thincoder-cli/src/tui/agent-turn.mjs:91-94`（非 autoTurn 回合在流内画 `❯ You:` + 用户文本）；VSC = `thincoder-vscode/webview/send.js:54,73`（`addUser` 本地出泡——排队路出泡即标记 `pending`）+ `webview/chat-messages.js:52`（`userMessage` 回声 → `addUser`）+ `webview/ui.js:136-149`（`.message.user` 气泡 = `❯ <user>:` 标签 + 正文）。
- 各条 file:line 坐标 = 台账 #457–#461 `evidence` 列。

### 1.3 边界（不在本批）

- **#426 窄窗左列**——消解形 = 左列折叠**交互**（交互面新功能）⇒ 留册（窗口 = 视图交互批）；裁量默认 = 不并入。
- **#440 真代码块面**——新渲染设计面（围栏切分 / 高亮），另裁。
- **核（`thincoder-core/**`）零触碰**；需求档笔 = 父侧（设计轮只报不改）。
- **测试档 / 真机冒烟不作为设计面条目**（用户 2026-09-27 裁定）——判据线在设计面写，测试档随实施落。

### 1.4 授权与门

**授权口径** ✓：用户 19:05 立批 +「跑起来」= 设计轮点火授权；**设计评审点火 + §4 批准**按常规（用户侧门）；实施舱按流程派。

### 1.5 设计轮产出核验与三项上抛裁定（父侧 · 2026-09-27 19:20 ✓）

**核验** ✓（父侧实读：设计三档 diff 逐段 + §2 逐段——非采信自报）：五件条目 ↔ 判据线 ↔ 设计档落点三链齐；#458 裁决（受理即出）理由 + 边界在场（失败径 = 零块 + 稿留，T-DSK32 ⑩⑪ 原形不动 ⇒ **零缩水**）；「本批零 IPC 契约改动」✓（`thincoder-desktop/src/main/**` / `src/preload/**` 零改）；行数预算与越层登记随动 ✓。

**裁定（§2.7 三上抛）**：

- **AD（两越层档拆档）⇒ 续期** ✓：本批**不拆**——沿批 A / 批 B「披露 + 登记 + 不夹带结构改动」先例；两档预案已补登（`events.mjs` ⇒ `questions.mjs` · `mount-composer.mjs` ⇒ `composer-send.mjs`），消解窗口 = 该两档下次被触碰的批（`docs/desktop/design/PROJECT.md` §4.1 越层段在册）。
- **AC（需求侧建议）⇒ 补** ✓（已落 · **父侧直接执行** · 需求档笔权 · 可 revert）：`docs/desktop/requirements/PROJECT.md` §4 D3 判据列补「发送后用户消息在对话流在场（与回放块序一致，对齐 CLI / VSC）」+ 变更记录行同笔（`:111` / `:179`）。
- **AB（非视觉降级径一行差）⇒ 维持登记** ✓：本批不动 IPC 回执形（消解路已在册 = 回执携入会话文本 · 另裁）。

**下一步** ✓：设计评审（点火权 = 用户）⇒ pass ⇒ §4 ⇒ 实施舱。

### 1.6 设计评审轮 1 裁定与修正轮（父侧 · 2026-09-27 19:3x ✓）

**评审轮 1 = `changes-required`**（🔴1 · 🟡7 · 🔵3 = 11 条 · 逐字在 §3 ✓ 父侧实读复核）。**父侧逐条裁定**（承「不采信自报」）：

| # | Action | Detail |
|---|--------|--------|
| 1 | **Not an issue** | D16 的「真 Electron 使用面用例」义务**在验收面成立、在设计面不成立**——用户 2026-09-27 18:31 裁定：测试档（含 E2E 用例）**不作为设计面条目**（随修随加；设计→评审→批准→派舱只管产品行为）。评审引为「先例」的 T-DSK32 全链恰是该裁定所斥的慢路。**验收义务保留**（父侧真跑闭合）；需求档 D16 该句括注已随动收正（父侧笔 · 去「设计单源」指针；`docs/desktop/requirements/PROJECT.md:124` + 变更记录）。 |
| 2 | **Dispatched** | `PROJECT.md` §10 AC 行 ⇒「已随动」+ §2.7 上抛 2 状态注（修正轮）。 |
| 3 | **Not an issue** | 测试档零标注 = **按裁定正确**（测试档不作为设计面条目）；测试面增量走实施轮随修随加 + 实施后对账轮按盘回填（既定机制）。 |
| 4 | **Not an issue**（实核反驳） | 游标块型闭集实为 **{assistant}**：`renderer/chat.css:34`（规则仅 `.block-assistant`）· `renderer/views/chat.mjs:87`（锚仅 `kind === "assistant"`）· `renderer/events.mjs:97`（仅助手活块带 `streaming: true`；工具 / 错误块无 · 推理块仅页径且不带）⇒ 「助手文本段收束」点名完整。 |
| 5 | **Dispatched** | `UI.md` 「KD-13 先例」悬空 ⇒ 改指 §4.1 分档先例（或删括注）。 |
| 6 | **Dispatched** | `appendBlock` 实核 = **既有纯动作**（`renderer/store.mjs:73` 导出 · `events.mjs` 四处已消费）⇒ 账目无变化；修正轮就地点名「（既有）」。 |
| 7 | **Dispatched** | #460 判据面二分收正（平 node = 自动面 · rect 间隔 = 真机）；宿主测试档不落设计面（见 #3）。 |
| 8 | **Dispatched** | ① 补非活动键径判据（零写 · `blocks` 引用不变）；② 「切回整置」括注收正为限定形 + 在飞回合切回窗口登记观察（实核：`history:page` 读 `session-slots.mjs:123`/`:145` `loadSlotFile` · 槽落盘在回合尾 `agent-host.mjs:214`/`:219`）。 |
| 9 | **Dispatched** | 措辞统一「尾块（= 本回合首个块）」（`UI.md:87` · `PROJECT.md:317`）。 |
| 10 | **Dispatched** | §8 补本批「不做」行（#426 ∕ #440 ∕ 核零触碰）。 |
| 11 | **Not an issue** | 评审限制说明（无标准档 / 文档地图；盘上数值未核）——已知边界；盘面数值随实施轮 / 对账轮核。 |

**修正轮** ⇒ eng-designer **fix 轮**（点修 7 条：#2 / #5 / #6 / #7 / #8 / #9 / #10 · 派单三句齐）⇒ 落地后父侧逐号核验 ⇒ **复审（轮 2）点火权 = 用户**。

### 1.7 修正轮核验与两处记录面收复（父侧 · 2026-09-27 19:3x ✓）

**核验** ✓（父侧实读七处落点，非采信自报）：#2 → `PROJECT.md:402`（AC = 已随动）· #5 → `UI.md:77`（改指 §4.1 分档先例句）· #6 → `RENDERER.md:73`（`appendBlock`「既有纯动作」+ 坐标）· #7 → `UI.md:99`（判据二分）· #8 → `UI.md:85-86` / `:88` + `PROJECT.md:404`（AE 观察行）· #9 → `UI.md:88` / `PROJECT.md:317`（「尾块（= 本回合首个块）」）· #10 → `PROJECT.md:367`（§8 本批「不做」行）；三档变更记录行在位 ✓。

**修正轮两处清单外发现 —— 父侧处置** ✓（**父侧直接执行** · 机械 · 零语义 · 可 revert）：
- ① **`RENDERER.md` 变更记录丢行**（设计轮替换而非追加）：已按 `git show HEAD` 原文恢复（「批 B 追加轮 · 实施后对账轮」行——现迹 `RENDERER.md:148`）。**父侧上轮核验漏检此丢行，本轮由修正轮实读捕回** ✓（记一笔：父侧核验教训）。
- ② **`UI.md:176` 变更记录笔误**（「七处行**未**补」与实态相抵）：已收正为「七处行补」（零语义）。

**判决** ✓：修正轮 **7/7** 落地 + 两处记录面收复 ⇒ 设计面可复审（**轮 2 点火权 = 用户**）。

### 1.8 复审（轮 2）结果与 §4 待批（父侧 · 2026-09-27 19:4x ✓）

**复审（§3 轮次 2）= `pass`** ✓：🔴 0 · 新增 0 条；十项核验全过（7 点修 #2 / #5 / #6 / #7 / #8 / #9 / #10 + 两处记录面收复 + 需求档 D3/D16 随动行）——发现表逐字在 §3（`### 轮次 2（评审子代理）`）。
**父侧抽读复核** ✓：宿主机检「0/20 引文不符」告警判 **误报**（沿本仓同型先例——路径形解析归因；`requirements/PROJECT.md:178` 一条报「file unreadable」可佐）；承重引文抽读在位（`UI.md:99` 判据二分 · `PROJECT.md:402` AC 行）。
**发现项结清** ✓：轮 1 十一条全数结清（7 落地 + 4 父裁定）；轮 2 零新增 ⇒ 设计面定稿。
**§4**：待用户批准（点火权 = 用户）；批准后派实施舱（eng-coder · 单舱 · renderer 九档 + 测试面随修随加 · 令牌值不落档）。

### 1.9 实施舱中断与续跑（父侧 · 2026-09-27 20:0x）

**事件** ✓：实施舱 #99 于 20:05 因 infra 中断（provider 余额 402——`Insufficient Balance`，非设计 / 代码冲突）——**无交付报告**，交付协议未完成。
**已落实核** ✓（`git diff --numstat`）：九档 renderer 全有实质 diff（`chat.css` +45/−1 · `events.mjs` +24/−7 · `mount-composer.mjs` +19/−5 · `mount-settings.mjs` +3/−3 · `app.mjs` +6/−2 · `views/chat-tool.mjs` +14/−5 · `views/activity.mjs` +13/−7 · `views/approval.mjs` +8/−4 · `views/plan.mjs` +7/−4）——**完成度未知**（前舱未报告）。
**恢复动作** ✓：续跑舱重派（round = initial · 全量收核——逐档读现状对 §2 判据线核缺口 + 全量测试 + 交付报告，报告须区分「前舱已落 / 本轮补正」）。

### 1.10 授权（父侧 · 2026-09-27 20:08 ✓）

用户 20:08「**后续自动跑完吧**」= **全链授权**（循本仓既有全自动先例）：设计评审点火 / §4 代签 / 修正·实施派发 / 收口核销提交推送——全部父侧自动执行（含真机冒烟亲跑与交付评审节点）。
**父侧自缚**：① 代签仅三条件齐备（评审 pass〔0 🔴〕∧ 修正轮落地并逐条核验 ∧ token 已签发）；② 复评再出 🔴 即停；③ 验证不过即停；④ 需**新范围**或**用户口径裁决** ⇒ 停下（不因授权扩张射程）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（五件（#457–#461）逐条判据线 + 设计档三处落盘（UI / RENDERER / PROJECT）；上抛三项 = 越层拆档 / 需求侧建议 / 降级径一行差）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 覆盖条目（五件 · 台账 #457–#461 · 判据线逐条给「怎么测得出」）

| # | 台账 | 条目（缺陷） | 判据线（机器可检） |
|---|---|---|---|
| 1 | #457 | 输入区五类零 CSS（`.composer` / `.composer-input` / `.composer-interrupt` / `.chat-copy-block` / `.chat-copy-last` 在 renderer 四 CSS 档零规则） | ① 文本级：`thincoder-desktop/renderer/chat.css` 含五选择器各 ≥1 条规则；② 真机：`.composer` 内 `textarea` 宽撑满中区余宽 ∧ 窄窗不溢（`min-width: 0`）∧ 三控件非空形态（边框在场 + 可见字形 / 词：Stop 词 + 复制面 `⧉`）；③ 截图走查（composer 区） |
| 2 | #458 | 活流不落用户块（活流 ↔ `history:page` 回放不一致） | ① 单元：`msg:send` 回执 `ok` 真 ∧ 键 = 活动会话 ⇒ `store.blocks` 尾块 = `{ kind: "user", text }`（恰一块；`data-blocks` +1）；② 单元：回执 `ok` 假 ∥ 抛 ∥ 键 ≠ 活动会话 ⇒ `blocks` 引用不变；③ 树面：`div.block[data-block-kind="user"]` 在场且文本逐字；④ 真机：发送后流内首块 = 该用户块（内容逐字 · 块序与同会话 `history:page` 回放一致）；⑤ 失败径：`data-blocks="0"` ∧ 稿逐字留（T-DSK32 ⑩⑪ **原形不动**） |
| 3 | #459 | 回合尾 `data-streaming="1"` 不清（游标 `▌` 常驻） | ① 单元：带 `streaming` 尾块 + `done` ∥ `stopped` ∥ `ev:error` 任一 ⇒ 归约态零 `streaming` 真项；② 单元：`ev:tool-call` 入场 ⇒ 前序助手段 `streaming` 清（段界）；③ 真机：回合尾三径后流内 `[data-streaming="1"]` 计数 = 0（锚已摘——经块面引用变更触发帧） |
| 4 | #460 | 文本段零间隔（裸文本子 ⇒ flex `gap` / `space-between` 静默失效）：toolHead / labelNode / approval-head / plan-row 四处 | ① 单元：四处相邻文本段各为独立 `[data-seg]` 元素（段数 = 在场段数；缺席段零节点）；② 真机：相邻 `[data-seg]` 元素 rect 间隔 > 0（Range 读 x——父侧读数法复测）；③ 计划行两段对置（`space-between` 生效） |
| 5 | #461 | 信息行陈旧（开项目不触发 `refreshInfo`） | ① 单元：`attachSettings` 返回含 `refreshInfo` 句柄 ∧ `openDir` 成功链（`project:open` 回执 ⇒ `refreshRail()` 之后）调用（调用序可断言）；② 真机：开项目后 `[data-slot="info"]` 不再呈启动期 `no-project` 串（`data-state` ≠ `error` ∧ 读数节点在场——有读数即刷）；③ 真无读数面（读通道失败）⇒ 失败串 = 该读 reason（非 `no-project`——既有面不动） |

### 2.2 设计档落点（形态 / 工艺 / 账目三面 · 三档已落盘）

- 形态单源 = `docs/desktop/design/UI.md` §1 **本批注**（五项：输入区样式落点与关键尺寸 · 用户块出泡 · 游标清点 · 文本段逐处形 · 信息行复读）+ §1 七处行「本批修」指针（对话流 / 输入区 / 工具卡 / 审批呈现 / 计划面 / 项目级信息 + §2 项 1）；
- 工艺面 = `docs/desktop/design/RENDERER.md` §1.1 三条（用户块写者与出泡时刻 / 流式游标清点两族 / 文本段行形态通则）；
- 账目面 = `docs/desktop/design/PROJECT.md` §2 **KD-23 / KD-24** · §4.1 值列九行 + 越层段预案补登 · §4.2 三行 · §6.1 D3 / D10 · §7 T-DSK22 · §10 AB / AC / AD。

### 2.3 机制设计（五条 · 逐条给形）

1. **#457 输入区样式**——落点 = `thincoder-desktop/renderer/chat.css`（**既有档 · 不新立档**：增量 ≲45 行，该档 254 ⇒ ≲300）；形：根 `.composer` = 单行 flex（wrap · `gap: 8px` · `padding: 10px 12px` · `border-top: 1px solid var(--line)`）· 输入框 `.composer-input` = `flex: 1`（撑满）+ `min-width: 0`（可缩）+ `min-height` + `resize: vertical` + 既有文本控件面 · 三控件（`.composer-interrupt` / `.chat-copy-block` / `.chat-copy-last`）= 同一控件单形（沿 `.chat-backfill` / `.approval-action` 家族）· 复制面字形住 CSS `content`（`"⧉"`——视图档零字形字面律）· 提示行 / 附件条 = 整行（`flex: 1 1 100%`；附件条**内部**尺寸仍 open）。
2. **#458 用户块出泡**——写者 = 发送面（`thincoder-desktop/renderer/mount-composer.mjs` 两径：直发 / 回合尾 flush）；时刻 = `msg:send` 回执 `ok` **真**（受理即出）；块形 = `{ kind: "user", text }`（与回放块同形——无 `id` / 无 `status`）；文本 = 提交文本逐字；键门 = 回执键 = 现刻 `activeSession`；入队径出泡延至 flush 受理面（**不出未受理块**）；写入走 `appendBlock`（`renderer/store.mjs` 纯动作）。
3. **#459 游标清点**——两族 = ① 回合尾三径（`done` / `stopped` ∨ `ev:error`）② 段界（`ev:tool-call` 入场）；清点落归约面块面（`thincoder-desktop/renderer/events.mjs`——**须产生块面引用变更** ⇒ `blocks` 键变 ⇒ 帧触发 ⇒ 就地更新摘 `data-streaming` 锚；旁路态无刷新径 = 缺陷成因）。
4. **#460 文本段**——通则 = 行内 ≥2 文本段 ⇒ 逐段包元素（`span[data-seg="<段码>"]`；段缺席 ⇒ 零节点）；段码表 = `toolHead`〔`name` / `args` / `status` / `time`〕· `labelNode`〔`title` / `status`〕· `headNode`〔逐项 `name` / `args` / `status`；批形 `count` / 逐名 `name`〕· `rowNode`〔`title` / `status`〕；四处同取「逐段包元素」（被否 = 改分隔形；逐处理由 = `docs/desktop/design/UI.md` §1 本批注项 4）。
5. **#461 信息行复读**——触发点 = `thincoder-desktop/renderer/app.mjs` `openDir` 成功链（`project:open` 回执 ⇒ `await refreshRail()` **之后**补一步复读）；句柄 = `thincoder-desktop/renderer/mount-settings.mjs` 把 `refreshInfo` 一并出（沿 `paintInfo` 同面导出）；向导步 3 现有调用保留（幂等——同一 handle，判据不缩水）。

### 2.4 受影响文件与测试面

**产品面（renderer 九档 · 核零触碰 · `src/main/**` 与 `src/preload/**` 零改——**本批不动 IPC 契约：`msg:send` 回执形不动**）**：

| 文件 | 改动 | 预算（内容行数） |
|---|---|---|
| `thincoder-desktop/renderer/chat.css` | 输入区五类 + 两附属行 + 复制面字形 | **254 ⇒ ~296** |
| `thincoder-desktop/renderer/mount-composer.mjs` | 用户块两径出泡（直发 / flush）+ 键门 | **348 ⇒ ~362**（越 300——预案补登见 §4.1） |
| `thincoder-desktop/renderer/events.mjs` | 游标清点两族 + 辅助 | **351 ⇒ ~363**（越 300——预案补登见 §4.1） |
| `thincoder-desktop/renderer/app.mjs` | 设置面句柄捕获 + 开项目链复读一步 | **247 ⇒ ~251** |
| `thincoder-desktop/renderer/mount-settings.mjs` | `refreshInfo` 入导出句柄面 | **426 ⇒ ~427**（在册例外续期不变） |
| `thincoder-desktop/renderer/views/chat-tool.mjs` | `toolHead` 四段逐段包元素 | 126 ⇒ ~131 |
| `thincoder-desktop/renderer/views/activity.mjs` | `labelNode` 两段逐段包元素 | 171 ⇒ ~176 |
| `thincoder-desktop/renderer/views/approval.mjs` | `headNode` 逐段包元素 | 150 ⇒ ~155 |
| `thincoder-desktop/renderer/views/plan.mjs` | `rowNode` 两段逐段包元素 | 41 ⇒ ~45 |

**测试面（随实施落——判据线已在设计面写定，本段只列触点）**：归约面（游标清点两族——平 node 直测）· 四处视图面（段包树形断言）· 发送面（`submitDraft` / `flushTurnTail` 用户块两径 + 键门 + 失败零块）· 输入区树面（用户块 + 五类样式锚）· 设置面（`refreshInfo` 句柄与 `openDir` 链调用序）· 集成（T-DSK32 十二序复测——**失败径断言原形不动**）。`test/files.mjs` 无需增档（零新档）。

### 2.5 验收对照（条目 → 判据 → 设计档落点）

| 条目 | 判据（§2.1） | 设计档落点 |
|---|---|---|
| #457 | ① ② ③ | `UI.md` §1 本批注项 1 · `PROJECT.md` §4.1 `chat.css` 行 |
| #458 | ①–⑤ | `RENDERER.md` §1.1 用户块条 · `UI.md` §1 本批注项 2 · `PROJECT.md` §2 KD-23 · §7 T-DSK22 |
| #459 | ① ② ③ | `RENDERER.md` §1.1 游标清点条 · `UI.md` §1 本批注项 3 · `PROJECT.md` §2 KD-24 |
| #460 | ① ② ③ | `RENDERER.md` §1.1 文本段通则条 · `UI.md` §1 本批注项 4 |
| #461 | ① ② ③ | `UI.md` §1 本批注项 5 · `PROJECT.md` §6.1 D10 |

三链同源：本表 = 设计档落点 = 台账 #457–#461（条目面同源）；无新增需求条目（五条皆既有面修复），故无需求档回指新增。

### 2.6 关键决策（单源 = 设计档 KD 表）

- **KD-23 用户块出泡时刻 = `msg:send` 回执 `ok` 真（受理即出）**——理由：受理判据 = 回执（`bad-key` / `provider-invalid` ⇒ 回合未启 ⇒ 会话无此条），「活流块 ⟺ 该条已受理」使活流与回放同源；有序性 = 回执先于该回合首个带块事件（实读 `thincoder-desktop/src/main/agent-host.mjs:186-228`：`run(...)` 非 await 起跑后立即 `return { ok: true }`）。**边界写死**：失败（`ok` 假 ∥ 抛 ∥ 形不合）⇒ **零 user 块入流** + 稿逐字留（T-DSK32 ⑩⑪ 原形不动）；入队径出泡延至 flush `ok` 真；键门非活动会话 ⇒ 零写；非视觉降级径一行差 = 登记（`PROJECT.md` §10 AB，带消解路）。
- **KD-24 游标清点两族**（回合尾三径 ∪ 段界 `ev:tool-call`）——只清回合尾 = 半量（工具运行期游标常驻于已收束文本段 = 同族缺陷）；清点须走块面引用（旁路态不触发帧 ⇒ DOM 锚无刷新径）。
- 被否候选逐条在册：提交即出（VSC 形——本端无 `markPending` 标记机制 + 队列不按会话分键）· 提交即出 + 回执假回滚（新「撤回」语义）· 提交即出 + 失败留块（违 ⑪ 且造活流 / 回放不一致）· 只清回合尾 · 帧尾扫 DOM 摘锚。

### 2.7 上抛项（父侧裁）

1. **两越层档被本批触碰**——`events.mjs`（351 ⇒ ~363）· `mount-composer.mjs`（348 ⇒ ~362）；拆档 = 结构改动 ⇒ 预案补登（`questions.mjs` ∕ `composer-send.mjs`）+ **本批执行 ∥ 续期**归父侧裁（登记 = `PROJECT.md` §10 AD · §4.1 越层段）。
2. **需求侧建议（只报不改）**——需求 §4 D3 判据列未明写「发送后用户消息在对话流在场」（现由 §3.5:78 用户原话承接）；补 ∥ 不补 = 父侧裁（登记 = `PROJECT.md` §10 AC）。
3. **降级径一行差（边界登记）**——非视觉降级径：活流块 = 提交文本，回放含说明行；消解路 = 回执携入会话文本（须动 IPC 回执形——另裁）（登记 = `PROJECT.md` §10 AB）。

### 2.8 自检读数（设计档落盘实读 · 2026-09-27）

- `docs/desktop/design/UI.md`：**176 行**（+44 / −7；§1 七处指针 + 本批注五项 + 变更记录一行）；
- `docs/desktop/design/RENDERER.md`：**147 行**（+9 / −1；§1.1 三条款 + 变更记录一行）；
- `docs/desktop/design/PROJECT.md`：**551 行**（+40 / −12；§2 两 KD + §4.1 九行 + 越层段 + §4.2 三行 + §6.1 两行 + §7 一行 + §10 三行 + 变更记录一行）；
- **SHELL 树随动核对**：零新档 / 零删档 / 零改名 ⇒ `docs/desktop/design/SHELL.md` §1 树**不动**（核对通过 · 不改）；
- **行宽自检**：本批新增行皆 ≤300（三档既有超宽行 = 既有表格行，未增列）；互指核对：`PROJECT.md` §4.2 三行 ↔ `UI.md` §1 本批注 ↔ `RENDERER.md` §1.1 三条 ↔ 本段（§2）四处指针互指一致。

### 2.9 修正轮 1 状态注（设计评审 §3 轮次 1 · 父侧 §1.6 全裁采纳）

**范围**：七条点修（#2 / #5 / #6 / #7 / #8 / #9 / #10）落设计三档（`docs/desktop/design/UI.md` / `docs/desktop/design/RENDERER.md` / `docs/desktop/design/PROJECT.md`——各档变更记录行同笔）；产品码 / 测试档 / 需求档零触碰。逐号落点 = 交付报告（父侧逐号核验）· 各档变更记录。

**被取代条目覆盖声明**（本块对 §2 前块的取代；旧行保留不改）：

- **§2.7 上抛 2**（记法「需求缺口（登记）· 父侧裁：补 ∕ 不补（两可）」）⇒ **已随动**：需求档 D3 判据列补句 + 变更记录（`docs/desktop/requirements/PROJECT.md:111` / `:179`——**父侧直接执行 · 需求档笔权**）；本档 §10 **AC** 行随动转「已随动」（沿同档 AA 行记法）。

**不涉**：§2.7 上抛 1 / 3（父侧裁 = 续期 ∕ 维持登记——本批不动）；#1 / #3 / #4 / #11（父侧裁 Not an issue——零改）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

| # | 类别 | 严重度 | 问题 | 建议 |
|---|------|--------|------|------|
| 1 | 需求覆盖 | 🔴 | D16 常设条款「凡改桌面可见面 ⇒ 验收须含一条真 Electron 使用面用例」（`docs/desktop/requirements/PROJECT.md:124`）未被本批承接：五件（#457–#461）全为可见面修复，而设计明示 T-DSK32 ⑩⑪「原形不动」（`docs/desktop/design/PROJECT.md:61` · `:549`），§7 用例表 / §4.1 集成两行（`:159` / `:160`）/ §4.2 均无新增或扩展真 Electron 用例登记（先例 = 批 B 追加轮为该批可见面变更补 T-DSK32 全链落账） | 补一条真 Electron 使用面用例（新 T-DSK 号 ∕ 扩展 T-DSK32 断言序），同笔登记 §4.1 集成行值 + §4.2 `E2E-TESTING.md` 行；若不补 ⇒ 按 §10 上抛格式登记该义务处置 |
| 2 | 文档一致性 | 🟡 | §10 **AC** 行仍滞留「需求缺口（登记）· 父侧裁：补 ∕ 不补（两可）」（`docs/desktop/design/PROJECT.md:401`），而需求档 D3 判据**已补句**（`docs/desktop/requirements/PROJECT.md:111` + 变更记录 `:179` 载「父侧裁『补』」）——设计档与需求档状态相抵（滞后轮） | AC 行转「**已随动**（需求侧 2026-09-27 落）」（沿同档 AA 行记法），保留指向 D3 判据落点的一行指针 |
| 3 | 影响面行数标注 | 🟡 | 本批触碰的**测试档零标注**：§4.1 用例模块行与各测试行无「本批修」指针与增量（对照批 B 设计轮逐档记「+~N——贴层判据」= `PROJECT.md:527`）；且五件判据（机检）的宿主测试档未点名——#458 块面尾块断言 · #459 归约态零 `streaming` 真项（`events-reduce` 现值 **285**，+≈12 即贴 300）· #460 四处构树改形面 · #457 CSS 规则面 · #461 开项目复读链 | 补测试档名单 + 现值 ⇒ ~N 与各判据宿主点名（如 `events-reduce` **285** ⇒ ~297 贴层）；贴 / 越 300 者随拆分层记账（`store` **334** 在册预案窗口随动） |
| 4 | 清晰度 | 🟡 | #459 段界族 ② 只点名「**助手文本段**收束」（`docs/desktop/design/UI.md:89` / `docs/desktop/design/RENDERER.md:73`），判据也只「前序**助手段**同零」（`UI.md:91`）；「可带 `streaming` 游标」的块型闭集未声明，而尾段挂载条未限块型（`RENDERER.md:93`「就地更新尾块（文本 + `data-streaming` 锚）」）——推理段 ∕ 其它块型同病时清点不完整（残留同族缺陷） | 明写游标块型闭集（若仅助手文本 ⇒ 就地点名并给依据），或把 ② 改为「前序任一含游标块零化」并同步判据 |
| 5 | 清晰度 | 🟡 | `docs/desktop/design/UI.md:77`「分档理由沿 **KD-13** 先例」为悬空误指——KD-13 = `locale` 端无关偏好键（`docs/desktop/design/PROJECT.md:50`），与分档无关；实际先例住 §4.1（`PROJECT.md:122` / `:123` / `:155`「分档理由 = `styles.css` 实读 284 贴 300 层」） | 改指 §4.1 分档先例句（带路径全名），或删括注 |
| 6 | 影响面 ∕ 清晰度 | 🟡 | #458 写入径点名 `appendBlock`（`docs/desktop/design/RENDERER.md:72`），但该符号在本批四档仅出现一处，且 `store.mjs` 无本批触碰标注（`docs/desktop/design/PROJECT.md:131`）——「新增纯动作 ∕ 既有动作」未明：若新增 ⇒ 影响面账漏一档（`store.mjs` **313** 越层档，触碰须随预案窗口） | 就地点名该纯动作为新增 ∕ 既有；若新增 ⇒ 补 §4.1 `store.mjs` 行增量并在越层段补登预案窗口 |
| 7 | 验收判据 | 🟡 | #460 判据（机检）含**布局测量**「相邻 `[data-seg]` 元素 rect 间隔 > 0（Range 读 x）」（`UI.md:98`）——现自动面（平 node ∕ 假 DOM：`RENDERER.md:51`「挂载函数不进自动面」）无布局不可执行，宿主用例未点名；对照同注项 1 同类测量归「真机」（`UI.md:83`） | 判据面二分：平 node 可测部分（全段元素 · 段数 = 在场段数 · 缺席零节点）归自动面并点名测试档；rect 测量归真机 ∕ 真 Electron 用例并点名宿主 |
| 8 | 验收判据 | 🟡 | #458 **键门径无判据**：正文载「非活动 ⇒ 零写——该条在切回时由页回执整置」（`UI.md:85` / `RENDERER.md:71`），机检只覆盖「键 = 活动会话」径（`UI.md:87` / `PROJECT.md:317`）；且「切回整置」与该条入页回执的时点关系未定（档内证据：槽落盘在回合尾——`PROJECT.md:109` `saveAgentSlot` 行） | 补非活动键径判据（`blocks` 引用不变 · 零写）并界定「切回」与该条入页回执的时点关系（或按既有格式登记为观察） |
| 9 | 判据措辞 | 🔵 | #458 块位措辞两面不一：机检 =「`blocks` **尾块**」（`UI.md:87`），T-DSK22 clause 与真机 =「**首块**」（`PROJECT.md:317` · `UI.md:87` 真机句）——有历史会话中「首块」不成立 | 统一为「尾块（= 本回合首个块）」 |
| 10 | 方法学 | 🔵 | §8 无本批「不做」行（`PROJECT.md:355-366` 各批皆有此行；本批射程外三件〔#426 ∕ #440 ∕ 核零触碰〕现只住评审声明） | 补本批「不做」行（沿逐批行例），防后续读者将射程外项当活工单 |
| 11 | 评审限制 | 🔵 | 本评审未见项目标准档与文档地图声明（方法学合规 ∕ 文档归属按 AGENTS.md + 四档自洽性判）；行数标注仅做跨档一致性核对——盘上数值未核（评审范围 = 四档，未读盘上源码） | 如须盘上数值核对 ⇒ 评估加盘面抽查 |

VERDICT: changes-required
计数：🔴 1 · 🟡 7 · 🔵 3（共 11 条）

### 轮次 2（评审子代理）

**轮次 2 核验（范围 = 声明面：7 条点修落地 #2/#5/#6/#7/#8/#9/#10 + 父侧两处记录面收复 + 需求档 D3/D16 随动行 + 新增问题扫查；轮 1 已裁 Not an issue 的 #1/#3/#4/#11 不在改动核验面）**

| # | Orig# | 文件 | 严重度 | Status | Notes |
|---|---|---|---|---|---|
| 1 | #2 | `docs/desktop/design/PROJECT.md` | 🟡 | **Fixed** | §10 AC 行转「已随动」——`:402`：「已随动（需求侧 2026-09-27 落——`docs/desktop/requirements/PROJECT.md:111` D3 判据 + `:179` 变更记录）」·「收口 ✓（本档 §2 KD-23 同源）」；与需求档 D3 补句（`:111`）+ 变更记录（`:179`）一致 |
| 2 | #5 | `docs/desktop/design/UI.md` | 🟡 | **Fixed** | 项 1（`:77`）：「分档理由 = `docs/desktop/design/PROJECT.md` §4.1 分档先例句〔`styles.css` 实读 284 贴 300 层〕」——KD-13 悬空误指已除；§4.1 该先例句在位（`:122` / `:123` / `:155`） |
| 3 | #6 | `docs/desktop/design/RENDERER.md` | 🟡 | **Fixed** | 用户块条（`:73`）：「写入走 `appendBlock`（**既有**纯动作——`thincoder-desktop/renderer/store.mjs:73` 导出，归约面 `thincoder-desktop/renderer/events.mjs:21` / `:97` / `:105` / `:220` 四处已消费；`pendingNew` 语义同源）」——§4.1 `store.mjs` 行无增量账目，自洽 |
| 4 | #7 | `docs/desktop/design/UI.md` | 🟡 | **Fixed** | 项 4 判据二分（`:99`）：「① 自动面（平 node）= 四处子节点全为 `[data-seg]` 元素 ∧ 段数 = 在场段数 ∧ 缺席段零节点；② 真机 = 四处相邻 `[data-seg]` 元素 rect 间隔 > 0（Range 读 x——沿项 1 同类测量记法）」 |
| 5 | #8 | UI.md · RENDERER.md · design/PROJECT.md | 🟡 | **Fixed** | ① 非活动键径判据（UI `:88`：「键 ≠ 活动会话 ⇒ **零写** · `blocks` 引用不变」）；② 「切回整置」收正为限定形（UI `:86`：「**在飞回合内切回** ⇒ 本回合用户块随回合尾落盘后、于下次页读在场」；RENDERER `:72` 同）；③ 登记观察（PROJECT `:404` **AE** 行：「在飞回合内切回 ⇒ 本回合用户块不在页读（#458 键门径窄窗——页复读只含已落盘态）」·「登记观察（窄窗 · 无数据丢失）」） |
| 6 | #9 | UI.md · design/PROJECT.md | 🔵 | **Fixed** | 块位措辞统一「尾块（= 本回合首个块）」（UI `:88` · PROJECT T-DSK22 `:317`）；全档无未限定「首块」残留 |
| 7 | #10 | `docs/desktop/design/PROJECT.md` | 🔵 | **Fixed** | §8 补行（`:367`）：「- **本批（可见面修复批）不做**：#426 窄窗左列折叠**交互**（窗口 = 视图交互批）· #440 真代码块面（围栏切分 / 语言高亮——另裁，同 §10 Y）· 核（`thincoder-core/**`）零触碰。」 |
| 8 | 父侧收复① | `docs/desktop/design/RENDERER.md` | — | **Verified** | §1.1 三条款（`:71–77`）带尾句完整、修正记录 `:150` 在位——无孤句 / 断句残留可察（逐字比对不可行——本轮无 diff 面） |
| 9 | 父侧收复② | `docs/desktop/design/UI.md` | — | **Verified** | 本批注五件 + §1 七处「本批修」指针完整、修正记录 `:178–179` 在位——无残痕可察（同上限制） |
| 10 | 随动行 | `docs/desktop/requirements/PROJECT.md` | — | **Verified** | D3 `:111` 补句 + `:179` 记录；D16 `:124` 括注收正（去「设计单源」指针 · 加用户裁定注）+ `:180` 记录——四处皆在、无相抵 |
| 11 | #1 / #3 / #4 / #11 | — | — | **关闭（父裁定 §1.6）** | 声明明示不在改动核验面，未重审；#1 相关记录面收正已单独核（第 10 行） |

**新增问题（修正引入）**：未发现——七条点修与两处收复未见新 🔴/🟡 级问题；UI ⟷ RENDERER ⟷ PROJECT ⟷ 需求档跨档一致性抽查无相抵。

**出界备注（无严重度 · 不参与裁定）**：① `docs/desktop/requirements/PROJECT.md:178` 行括号未闭合——「…**自本行起 D 表 = D1–D16**；」后无「）」，疑丢尾（是否本批编辑所致不可判——无 diff 面）；② `docs/core/requirements/PORTABILITY.md` 在评审面列出——内容 = 工程模式写门放行批（#462）F9，与本批无交集，未评；③ 源码坐标 / 行数估值只做档内一致性核对——盘面未核（设计评审面 · 源码零触碰）。

VERDICT: pass
计数：修正核验 10/10 通过（7 点修 + 2 收复 + 1 随动行）；新增 0 条（🔴 0 · 🟡 0 · 🔵 0）。

## §4 用户批准（主 agent）

**2026-09-27 19:52 · 用户批准** ✓（用户 19:49「批」）。

**批准依据** ✓：① 设计评审两轮——轮 1 = changes-required（11 条：7 落地 + 4 父裁定）⇒ 复审轮 2 = **pass**（🔴0 · 新增 0）；② 修正轮 #95 落地经父侧逐号核验 + 两处记录面收复 + §1.8 定稿；③ 设计凭证已签发（凭证值按纪律不落档）。
**批准范围** ✓：五件（#457–#461）+ 记录面随动；设计面 = `docs/desktop/design/{UI,RENDERER,PROJECT}.md` 本批修条款 + 需求档 D3/D16 随动行；**实施 = 单舱（eng-coder）**。
**用户侧验收线（D16）** ✗：凡改桌面可见面 ⇒ 验收须含一条真 Electron 使用面用例——**父侧亲跑 = 闭合点**（不再只靠假 DOM / 单测）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（续跑舱：九档产品码全量收核 + 测试面九档补齐 + fix round 1（events.mjs 键门）· 全量 171/171 · 审计 CLEAN · 评审两轮收敛）



### 5.1 交付摘要（续跑舱 · 全量收核 —— 「前舱已落 / 本轮补正」逐项区分）

**范围**：五件（#457–#461）· 产品面九档（前舱已落）+ 测试面九档（本轮落）· 零 IPC 契约改动（`src/**` / `index.html` 零触碰）· 零新档（`test/files.mjs` 未动）。

**「前舱已落」实核**（逐档读现状对 §2.1 判据线）：九档改动与判据线逐条相符，**唯一缺口** = `events.mjs` 回合尾清点未过块面键门（见 fix round）；其余零缺。

**「本轮补正」**：
- 测试面新用例四块：#457 五类 + 两附属行 CSS 规则与 #461 开项目链复读序（`test/views-locks.test.mjs` U152）· #458 用户块出泡两径（`test/views-chrome.test.mjs` U153：受理即出 / 键门零写 / 失败零块 / 树面随动）· #459 游标清点两族（`test/events-reduce.test.mjs`：三径 + 段界 + 非活动键/无命中两臂）· #461 信息行复读口（`test/views-onboarding.test.mjs`：句柄面 + 幂等直调 + 读失败面）；
- 既有用例随新形收正（零语义缩水）：`views-chrome` U119/U126 假 store 补 `blocks: []`（新写径要求真实态形）· `views-locks` U52 导出面锁补 `segNode`；
- 夹具：#461 复读口经 `test/views-harness.mjs` `mountFace` 出 `handle`（`attachSettings` 回值）。

**fix round 1**（源于内部 advisor 代码评审 🔴）：`events.mjs` `onActivity` 回合尾径的游标清点**补块面键门**（`forActive(state, ev) ? clearCursor(tail) : tail` —— 与 `onError` / `onToolCall` 同形；档头判据句同笔收正）；反向用例落 `events-reduce` 「非活动键回合尾 ⇒ 块面零写」臂。**判别力实证** = 变异探针：临时摘除键门 ⇒ 该臂必红（`streaming: true → false`），恢复后复绿。

**读数**（实跑）：`cd thincoder-desktop && node test/run.mjs` ⇒ **171 / 171 pass · 0 fail**（含真 Electron 两例：T-DSK32 首启冒烟 · T-DSK27 设置面；167 ⇒ 171 = +4 新用例）。`cd thincoder && node scripts/doc-check.mjs --root .` ⇒ 本实施轮**零新增**（本轮零改 docs；桌面相关命中 14 条皆设计轮在册的「拟新增」标记；全盘 49 悬空 / 32 超宽行皆既有、与本批无关）。
**真机面判据（各条 ②③ · 需求 D16）留父侧亲跑闭合** —— 本轮不代跑：`#457` 输入框宽撑满 + 三控件非空形态与截图走查 · `#458` 发送后流内尾块逐字与回放块序一致 · `#459` 回合尾后 `[data-streaming="1"]` 计数 0 · `#460` 四处相邻 `[data-seg]` rect 间隔 > 0 与计划行对置 · `#461` 开项目后 `info` 行不再呈启动期 `no-project` 串（本轮 E2E 已旁证：开项目后 `batch:status` 复读行由 1 次变 2 次）。

### 5.2 决策透明表

| # | 决策点 | 取形与理由 | 披露面 |
|---|---|---|---|
| D1 | 前舱九档是否重写 | **不重写** —— 逐档读现状对判据线核缺口，仅补发现的一处（key-gate）+ 测试面；判据：「禁止 silent deviation」= 现状达标即保持 | 本段 + 交付报告 |
| D2 | 测试面落点 | 全落**既有档**（`test/files.mjs` 零增档 · 零新档 —— 沿 §2.4「无需增档」）；#458 面落 `views-chrome`（输入区族同居）· #459 落 `events-reduce`（归约面）· #457+#461 落 `views-locks`（源面锁 · 文本级判据）· #461 句柄面落 `views-onboarding`（设置/向导族同居） | 本段 |
| D3 | 键门修形 | 取 `onError` / `onToolCall` 同形（`forActive` 三元），非新机制、非新导出 ⇒ 面不变 | 本段 5.1 |
| D4 | 行数预算 | 新增后测试三档触 300 层界（`views-chrome` / `views-approval` / `events-reduce` 皆恰 300 内容行）—— 取「压到 ≤300」而非「新档拆出」（新档违 §2.4）；两档由 314/306 收回 300 | 只报不改项 + 交付报告 |
| D5 | 只报不改（3 条） | ① `app.mjs` 复读步在 `opened()` 成功判之前（判据字面 =「回执 ⇒ refreshRail() 之后」⇒ 合规；语义无害 · 幂等）；② 两测试档恰在 300 层界（若「≥300」口径 ⇒ 对账轮宜登记层界档）；③ 设计档 §4.1 值列漂移（events 363→**369** · chat-tool 131→**135** · activity 176→**177**；测试档按盘）—— 归「实施后对账轮按盘回填」 | 交付报告 |
| D6 | 越声明 | 产品面零越声明（九档内）；测试面九档内；临时件 `.thincoder/doc-check-after.txt`（读数留档用）会话内已删 ⇒ 树面零残留 | 本段 + 交付报告 |

### 5.3 审计与代码评审轮次与终态

- **内部背离审计（explore · 只读）**：**CLEAN** —— 四类偏差（PARTIAL / SILENT-SIMPLIFICATION / DOC-DRIFT / OUT-OF-LIST）零命中；观察项 5 条（`align-items: flex-end` 附加非替代 · §4.1 值列归对账轮 · 真机项按设计分工留父侧 · doc-check 读数留档 · E2E 产物 PNG 属 gitignore 运行期产物）。
- **内部 advisor 代码评审轮 1**：`changes-required`（🔴 1 条 = `onActivity` 清点无键门，含后果链与可达性证据；🟡 3 条 = 两测试档越 300 + 产品三档在册越层；🔵 4 条 = §4.1 值列漂移 / `openDir` 复读时机 / U152 文本索引代理 / U153 调用计数耦合）。
- **修复轮**：🔴 修复（见 5.1 fix round 1）；🟡 两条测试越层收回 300（另一条 = 在册越层，按父侧裁不重开）；🔵 两条收正（U152 锚调用行形 · U153 改显式闸门变量）、两条登记不改。
- **内部 advisor 代码评审轮 2**：**pass** —— 八条上游逐项核（Fixed ×5 / Open-在册 ×1 / Open-optional ×2）、新增问题零；边界注 = 两测试档恰 300 内容行（按「>300」口径不再命中）。
- **终态 = `clean`（已收敛）** —— 审计 CLEAN + 评审两轮收敛（pass）；无未决 must-fix。

### 5.4 文件与读数（本轮实际触碰）

产品面：`thincoder-desktop/renderer/events.mjs`（本轮 +1 行 = 键门修复与判据句；行数 369）；其余八档 = 前舱已落、本轮**零改**。
测试面：`test/views-harness.mjs` 162 · `test/views-locks.test.mjs` 160 · `test/views-onboarding.test.mjs` 176 · `test/views-chrome.test.mjs` 300 · `test/views-chat.test.mjs` 271 · `test/views-activity.test.mjs` 228 · `test/views-approval.test.mjs` 300 · `test/views-question.test.mjs` 364 · `test/events-reduce.test.mjs` 300（口径 = 内容行数）。

## §6 验证与收口（父代理）

### 6.1 实施核验（父侧亲跑 + 实读）

- 全量套件亲跑：`cd thincoder/thincoder-desktop && node test/run.mjs` ⇒ **tests 171 · pass 171 · fail 0**（含真 Electron 两例 T-DSK27 / T-DSK32——T-DSK32 十二序输出在场）。
- 关键落点实读 ✓：`renderer/events.mjs:218-219`（判据句）· `:228`（回合尾键门 `forActive(state, ev) ? clearCursor(tail) : tail`——前舱唯一缺口，续跑舱补正）；其余八档 diff 与 §5 逐条相符。
- 舱内终态：背离审计 **CLEAN**；advisor 代码评审 轮 1 changes-required（🔴1 键门 + 🟡3 + 🔵4）→ 修复轮（含变异探针实证）→ **轮 2 pass / clean**（零新增）。

### 6.2 D16 真机走查（父侧亲跑 · 探针实证 —— 闭合点）

真 Electron 直驱（playwright-core `_electron` · 隔离夹具家 + 本地 stub provider 真回合 · 零出网；探针 = tmp 面一次性，读数已录、脚本已删）：

| 面 | 读数 |
|---|---|
| **#457** 几何 / CSS | 根 = `display: flex` · `flex-wrap: wrap` · `gap: 8px` · `border-top: 1px` ✓ ｜ 输入框 = `flex-grow: 1` · `min-width: 0` · 宽 521px · `resize: vertical` ✓ ｜ 三控件单形 = `border: 1px` · `padding-left: 10px` ✓ ｜ 复制面字形 = `::before content: "⧉"` ✓ |
| **#458** 用户块出泡 | 真回合（stub provider）块序 = **user → tool → assistant**；用户块 = 本回合首个块 · 文本逐字 ✓ · `msg:send failed` 零行 ✓ |
| **#459** 游标清点 | 回合尾后 `[data-streaming="1"]` = **0** ✓ |
| **#460** 段元素矩形 | 工具头四段（`name` / `args` / `status` / `time`）同头相邻 rect 间隔 = **[8, 8, 8] px**（全 &gt; 0）✓ |
| **#461** 信息行复读 | 开项目前 `[data-info]` = `error`（「No project open」）⇒ 开项目后 = `ready`（Requirements 0 / Tech todos 0 / Aged 0）✓ |
| 全程 | pageerror 零 · 发送失败零 ✓ |

### 6.3 只报不改三项裁定

| # | 裁定 |
|---|---|
| ① `app.mjs:127-128` 复读步位 | **Not an issue**——判据字面「回执 ⇒ `refreshRail()` 之后补复读」实读在位（`:127` → `:128`）；幂等；向导步双读为设计在册 |
| ② 两测试档恰 300 行 | **边界内**——口径 =「&gt;300 触发」（300 不含）；对账零动作 |
| ③ §4.1 值列漂移 | **Fixed**（**父侧直接执行**〔例外②③〕 · 可 revert）：`events.mjs` **369** · `views/chat-tool.mjs` **135** · `views/activity.mjs` **177** 按盘回填 + §10 AD 行同判 + 变更记录（`:555`） |

### 6.4 D7 结算面

- 角色表：§1 父侧 · §2 eng-designer · §3 评审 · §4 父侧（用户批准）· §5 eng-coder · §6 父侧 ✓。
- 计数：条目 5 件（#457–#461）全 ✅；过程件 = 修正轮 1 + 续跑 1 + 记录面收复 2 + 实施后对账 1。
- 指针：需求档 D3/D16（`docs/desktop/requirements/PROJECT.md:111` / `:124`）· 设计三档 ✓ 可解析。
- 台账：#457–#461（在途 → 待核销 → **已核销**）。
- 前批遗留交叉核：批 B / 首启冒烟批均已收口 ✓（无未收口锚）。
- 提交：单笔路径限提交 + 推送 origin（见收口动作）。
