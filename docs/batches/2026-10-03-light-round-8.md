# 2026-10-03 · light-round-8
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-03 · 来源 = 用户 2026-10-03 22:43 转达反馈（附截图）：「之前修过的那个默认模型没设置的问题，用户反馈：还是显示未配置模型，不过不影响使用」——根因 = 桌面 fallback 明示行逐字复用失败词（缺「— 正在使用可用渠道」澄清半句，视觉同错误的）。
> 台账 = #879（desktop · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**本轮 = 轻通道轮八（单笔）**。**披露**：轻通道笔——命中 **①细节/文案 + ②缺陷**（用户当场的话：显示「未配置模型」但可用）∥ **change** = fallback 明示行澄清半句（新键 `composer.send.noDefaultModelFallback`——与 VSC `banner.defaultModelFallback` 同构；**失败词 ∥ 态词分家**）∥ **reach** = `renderer/i18n-views.mjs`（两语 +2 键）· `renderer/composer-sync.mjs`（`providerNotice` 词路由 + 注释）· `renderer/i18n.mjs`（键链 VIEWS 138 ⇒ 139 ∥ HOST 313 ⇒ 314）· 批内件 `docs/batches/2026-10-03-light-round-8.test.mjs`（新档）∥ **rollback = revertable**（单提交）。

**根因（实读）**：`renderer/composer-sync.mjs` `providerNotice`（fallback 态明示行）逐字复用失败词「默认模型未设置或无效」——**缺澄清半句** ⇒ 可运行态读起来像错误（用户反馈「显示未配置模型但能用」——显示与实际相抵）；设计出处 = `docs/desktop/design/COMPOSER.md:123`（#841「逐字复用 #840 键」裁定——本轮 = 该字面收正，设计面随收口形式化入档）。

**走查（先红后绿对 · 实跑）**：
- **红**（修前）：`node --test docs/batches/2026-10-03-light-round-8.test.mjs` ⇒ **EXIT 1**——T1 `actual: '默认模型未设置或无效'` ≠ 期望澄清句（**逐字复现用户所见**）∥ T2 新键缺位 ∥ T3 源扫红。
- **绿**（修后）：同件 **EXIT 0**（T1 行面四态 ∥ T2 两语成对 ∥ T3 词路由不串）。
- **回归**（实跑）：`2026-10-03-desktop-firstrun-provider-notice.test.mjs`（#840）**EXIT 0**（失败词断言保持）∥ `2026-10-03-provider-invalid-unify.test.mjs`（#841）**EXIT 0**。

**冻结**：提交 = 本轮回（随后补记）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（轻通道轮八 · 收口形式化（实况 = 提交 32216ffc；doc-check 复跑 exit 0））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**轻通道轮八（fallback 明示行文案澄清）· 收口链设计形式化（2026-10-03 · initial 轮 · 实况 = 提交 `32216ffc`）**

**① 本批条目（覆盖）**：桌面 composer `fallback` 态明示行词面收正——由「逐字复用 #840 失败键」（`composer.send.noDefaultModel`）改为**新键 `composer.send.noDefaultModelFallback`**（zh「默认模型未设置或无效 — 正在使用可用渠道」∥ en「Default model missing or invalid — using an available channel」——**澄清半句**；**失败词 ∥ 态词分家**）；语义本体 = 既有 #841 设计（态明示行：`fallback` ∧ 非 invalid 类 ⇒ 行在场；判据单源 = `docs/core/design/PROVIDER.md` §6.22）——本批零新机制（词面 ∥ 设计面随收口形式化）。台账 = #879；笔性质 = 轻通道（①细节/文案 + ②缺陷：显示与实际相抵——用户反馈「显示未配置模型但能用」）。

**② 改动面（受影响文件与测试面 · 实读 2026-10-03 · 内容行口径）**：
- `thincoder-desktop/renderer/i18n-views.mjs`（**386**——+6：新键两语键值（`:73` ∥ `:241`）+ 两语类注；键面单源 = ② 组）；
- `thincoder-desktop/renderer/composer-sync.mjs`（**324**——322 ⇒ 324：`providerNotice` 词路由换新键（`:99`）+ 注释随正（`:87-93`）；`failedNotice` 零动（`:78-85`））；
- `thincoder-desktop/renderer/i18n.mjs`（**415**——+3：键数链注续链（`:91-93`）：`VIEWS_DICT` 138 ⇒ 139 ∥ `HOST_DICT` 313 ⇒ 314）；
- 批内件 `docs/batches/2026-10-03-light-round-8.test.mjs`（新档 **83** 行——T1 行面四态 ∥ T2 两语成对（失败词逐字保持）∥ T3 词路由不串；随批留存 · 不进仓套件）；
- 零触面：核件 ∥ VSC ∥ `thincoder-render-core` ∥ 通道面（零新通道）∥ #840 失败词面。

**③ 设计档落点（本段落笔）**：
- `docs/desktop/design/COMPOSER.md` §2 #841 批注——按 **D8** 收正：头引句（`:119`）「承 #840 批注的字面——**零新键**」与项 2（`:123`）「**逐字复用 #840 键**」旧字面删；新裁定落文 = 新键 + **澄清半句**（「— 正在使用可用渠道」——与 VSC `banner.defaultModelFallback` 同构；composer-notice 系无 ⚠ 先例）+ 失败词 ∥ 态词分家（态陈述行，非发送失败行）；
- `docs/desktop/design/COMPOSER.md` §「变更记录」+1 行（`:284`）∥ §3.1 `composer-sync.mjs` 行（`:144`）实读对盘（**324**）已随正；
- `docs/desktop/design/UI.md` §4.1 两行（`:500` ∥ `:501`）实读对盘（**415** ∥ **386**）已随正；§「变更记录」+1 行（`:808`）；
- 契约面（指针随收正无字面残）：`docs/desktop/design/IPC.md` §2「provider 态投影注」——其明示行词面引 `docs/desktop/design/COMPOSER.md` §2 本批注（现解析至新字面）；
- 记录面（frozen · 零追改——D8 历史归记录面）：批档 `docs/batches/2026-10-03-provider-invalid-unify.md`（#841）∥ `docs/batches/2026-10-03-desktop-firstrun-provider-notice.md`（#840）。

**④ 验收对照（= §1 走查读数）**：
- 先红后绿对（实跑）：红 = `node --test docs/batches/2026-10-03-light-round-8.test.mjs` ⇒ **EXIT 1**（T1 `actual: '默认模型未设置或无效'` ≠ 期望澄清句——逐字复现用户所见 ∥ T2 新键缺位 ∥ T3 源扫红）；绿 = 同件 **EXIT 0**（T1 行面四态 ∥ T2 两语成对 ∥ T3 词路由不串）。
- 回归（实跑）：`docs/batches/2026-10-03-desktop-firstrun-provider-notice.test.mjs`（#840）**EXIT 0**（失败词断言保持）∥ `docs/batches/2026-10-03-provider-invalid-unify.test.mjs`（#841）**EXIT 0**。
- 文档面机检（本段复跑）：仓根 `node scripts/doc-check.mjs` ⇒ **exit 0**——「OK(锚): 0 条悬空」∥「OK(行宽): 源域全部 .md 无 >300 字符单行」；行数面差异 **1** 条 = `docs/desktop/design/E2E-TESTING.md:249`（`thincoder-desktop/.gitignore` 表 8 ⇒ 实读 9——**前批在册项 · 非本批**；本批零净增）。
- 三路同源：§1 记录 ↔ 提交 `32216ffc` ↔ 本段——实读四值（`composer-sync.mjs` **324** ∥ `i18n-views.mjs` **386** ∥ `i18n.mjs` **415** ∥ 批内件 **83**）与 §3.1 ∥ §4.1 表值逐一对齐。

**⑤ 决策 ∥ 披露 ∥ 上抛**：
- 决策 = **失败词 ∥ 态词分家**（可运行态明示行必须携澄清半句——「零新键」原则在态词面让位「词实指态」；语义本体不动，只收词面）；
- 披露 = 本轮纯形式化（零产品码触 ∥ 零新机制 ∥ 零新键面引入）；实况 = 提交 `32216ffc`（单提交 · revertable）；
- **上抛项 U-1**：`docs/core/design/PROVIDER.md:433`（§6.22 三端明示表 · 桌面行）仍载旧字面「词 `composer.send.noDefaultModel`（**逐字复用 #840 键**——词面-only）」——同一失效字面之第二处；该档不在本轮派单写面 ⇒ 处置建议 = 同法 D8 收正（词 ⇒ `composer.send.noDefaultModelFallback`）+ 该档变更记录 +1 行——请父侧裁；
- **上抛项 U-2**：`docs/desktop/design/PROJECT.md` §4.1 越层段三档读数未随本批续读（`composer-sync.mjs` **322**（`:404`）∥ `i18n.mjs` **412**（`:389`）∥ `i18n-views.mjs` **380**（`:393`）——越层段非声明节表行，行数面机检未及）；处置建议 = 随文档清账轮 ∥ 该档下次触点续读齐平；
- 需求侧：零改（轻通道笔——无新需求条目；台账 #879 承载）。

## §3 设计评审（评审子代理）
## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
