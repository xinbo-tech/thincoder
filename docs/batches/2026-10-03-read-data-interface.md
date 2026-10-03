# 2026-10-03 · read-data-interface
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-03 · 来源 = 用户 2026-10-03 23:44 转外部意见（「@指甲长得长」——只读数据接口族：CLI --json ∥ ACP 只读方法 ∥ 桌面）+ 同拍裁定「桌面放弃吧。只做cli」「我说的时那些用户需求」——③ 桌面面裁弃；①②（CLI 命令面 ∥ ACP 面）入批；需求档 `docs/cli/requirements/READ-DATA-INTERFACE.md`（父侧笔 · 已落）。
> 台账 = #886 ∥ #887（cli · 归批）。前情 = 无（独立批——只读数据接口）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**来源与裁定**：用户 2026-10-03 23:44 转外部意见（「@指甲长得长」——统一只读数据接口族：① CLI `ledger list --json` ∥ ② ACP 只读方法 ∥ ③ 桌面同套），同拍裁定「桌面放弃吧。只做cli」+「我说的时那些用户需求」（= 指本需求族，非今晚在飞桌面批）。**判读**：③ 桌面面裁弃；①②（CLI 命令面 ∥ ACP 面——acp 由 cli 程序承载）入批。**待复核**：若用户口径为「连 ② 也不做」⇒ 开批期剔除 ②（设计未进实施，代价低）。

**需求落点**：`docs/cli/requirements/READ-DATA-INTERFACE.md`（父侧笔 · 已落——FR1–FR3 / N1–N3）。台账 = #886 ∥ #887。

**勘验依据**：六面静态勘察（只读 · ≈20 读——要点）：命令面仅 `migrate`/`audit`（`command-table.mjs:154-165`）∥ 核读 API 已在（`ledger-cmd.mjs:20/33` ∥ `ledger.mjs:117`）∥ CLI 零 `--json` 先例 ∥ 库零版本标记（`memory.db` 有 `user_version` 先例可抄）∥ 只读句柄先例 = `ledger-migrate.mjs:30` ∥ ACP 注册 = 四工厂 spread（`acp.mjs:116-122`）+ `ext.mjs:18-73` 先例 ∥ 通知 = `transport.mjs:34` ∥ batch §-状态文件可机读（`batch-skeleton.mjs:34-39` / `:113-126`）∥ 桌面 `batch:status` = manifest phase（非批次档——外部意见措辞更正）。

**边界**：不做桌面（裁）∥ 零写面 ∥ 族定义单源 = `docs/core/design/LEDGER.md` §7（#882 成套）∥ 不动 `ledger migrate`/`audit` 现有语义。

**授权口径**：全自动通道（用户 23:14「都自动跑完」沿——代点火评审 ∥ 派发 ∥ 代签 ∥ 落地）；止点 = 新范围 / 口径裁决 / 破坏性。

## §2 批次任务与设计（eng-designer）
**状态行**：（eng-designer 写入时更新）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>
## §3 设计评审（评审子代理）
## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
