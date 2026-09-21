# 2026-09-21 · tool-discipline
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-21 · 来源 = 用户 2026-09-21 22:47 双提问（task 列表停用 + 词面错误设计根源）。
> 台账 = #214/#215（TOOLS.md · 归批）。前情 = docs/batches/2026-09-21-busy-injection.md（在途——本批与其并行；无文件交集）。
## §1 讨论（主 agent）
**状态行**：进行中——F10 + F11 三面（A enum 化 / B 参数补齐归一化 / C 占位机检）已落 §1，进设计轮
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**本批条目**（需求档 `docs/core/requirements/TOOLS.md` F10 + F11 · 台账 #214/#215 · 板块 TOOLS/TOOLING）：

| # | 条目 | 一句话 |
|---|---|---|
| F10 | task 工程模式停用 | `agent.engineering = true` ⇒ task 机械拒（plan/escalate 同款门）；普通模式零变 |
| F11-A | batch status enum 化 | `value` 按段词表 enum（STATUS_WORDS 单源 `batch-skeleton.mjs:30`）+ 独立 note 字段——散文与机器语义分离 |
| F11-B | create 参数补齐/归一化 | 补 `source` 参数填来源占位；`prev` 传入自动剥「前情 = 」前缀；`<BATCH-ID>` 占位 create 时清除 |
| F11-C | 占位符残留机检 | append/status 落笔时档内 `<...>` 模板占位 ⇒ 拒绝并列清单 |

**起因与授权**：用户 22:47 双提问——①「task 列表不适应人机子 agent 高度并行交互，工程模式该停用」②「词面错误是否有设计根源，参数结构化/enum 化是否有用」。父侧实勘归因（agent-tools 模式门控先例全扫 + 本会话五例词面错分层：①②机制层 / ③⑤归一化缺失 / ④参数覆盖缺口）呈结论 → **用户 22:49「可以，开始把」= 本批点火授权**。

**关键判据**：① 五例实证：§1 状态行「讨论已收口」误触发冻结门（本日实录）· status 双关键词被拒 · 「**状态行**：**状态行**：」双前缀 · `<BATCH-ID>`/`<讨论来源>` 残留 · 「前情 = 前情 =」双前缀；② 硬证据 = 词面纪律 2026-09-20 已入记忆仍重犯 ⇒ 散文纪律防不住此类 ⇒ 机判（项目哲学「纪律防不住的地方上机判」——冻结门/spawn 门/designToken 门同源）；③ 对照面 = 台账六态 enum（`ledger_update status=已核销`）本会话零事故——enum 化有效性有实证；④ 模式门控先例：plan.mjs:36 · subagent-actions.mjs:348 · 角色 enum 按模式过滤（subagent.mjs:249-263）。

**红线**：batch 六段 append-only / 一段一作者 / 冻结门语义零变；task 普通模式行为零变（不移注册不加开关）；散文纪律句不删（机判叠加不替代）；铁律 3 提示词分支 = PROMPT-SYSTEM 板块（设计裁定是否本批带上，不带则登记另案）。

**排除面**：台账工具自身不动（已 enum）；eng/plan/escalate 既有门零改；在飞两批（exit-claim-release / busy-injection）不受影响——本批实施窗口避开其 spawn 冲突（batch 工具改动落在核 agent-tools，与两批文件域交集 = batch-lifecycle/batch-skeleton 仅本批触碰）。

## §2 批次任务与设计（eng-designer）
**状态行**：（eng-designer 写入时更新）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>
## §3 设计评审（评审子代理）
## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
