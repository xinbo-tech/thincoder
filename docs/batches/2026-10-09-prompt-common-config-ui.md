# 2026-10-09 · prompt-common-config-ui
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-09 · 来源 = 用户 2026-10-09 15:54–15:56 两令（「这种常识你还是先进提示词面」+「这是常识，不仅仅针对工程模式」）——#1139 定则之提示词面入册（common 槽）；轻通道轮（缺陷修复：提示词面缺用户定则）。
> 台账 = #1140（core · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 笔 1（2026-10-09 · 轻通道——缺陷修复）

- **交底**：本笔 = 轻通道（缺陷修复：提示词面缺用户定则——用户 15:54「这种常识你还是先进提示词面，免得我每次都要骂一遍」+ 15:56「不不不，这是常识，不仅仅针对工程模式」）｜改动：`common.md` 两面插入「产品常识（Product common sense）」节 ×1 条｜触面：2 档｜可 revert。
- **落点判定**：common 槽（非工程纪律层——两模式 + 全子代理共读；`prompt-overlays.mjs` 槽位矩阵 engineering ∥ eng-coder ∥ eng-designer 三面均载）。
- **改动**：`docs/core/design/prompts/common.md:22-23`（中文审核面——内容权威）∥ `thincoder-core/prompts/common.md:25-26`（英文运行面；桌面 `node_modules/@thincoder/core` = Junction 直通）。规则全文 =「配置项必须有配置界面：同批给界面写面（载入期项标「重启生效」）；例外须显式说明经用户裁——『它一直是配置文件项』不构成例外；界面提示文案不得指向界面外入口」。
- **走查（真跑）**：`assemblePrompt("engineering")`（`thincoder-core/prompt-overlays.mjs` 实调）= 91488 字符，含「产品常识（Product common sense）」截面 + 英文规则句（`Every config item must have a config UI`）✓；zh 正文仅居 docs 面（预期）。
- **定版**：待收尾全链（设计形式化 → 独立评审 → 批准 → 核销）——**未核销**。

## §2 批次任务与设计（eng-designer）
**状态行**：（eng-designer 写入时更新）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>
## §3 设计评审（评审子代理）
## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
