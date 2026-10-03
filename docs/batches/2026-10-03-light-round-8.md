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
**状态行**：（eng-designer 写入时更新）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>
## §3 设计评审（评审子代理）
## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
