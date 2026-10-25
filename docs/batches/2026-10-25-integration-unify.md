# 2026-10-25 · 集成测试统一归位：各端目录 → 仓根 test/integration/（推翻 N22）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-25 · 来源 = 用户 2026-10-25 10:00 指令：「集成测试现在在thincoder本身被放在各端目录下了，非常难找，我希望统一放在规范位置」+ 10:02 裁定推翻 N22 原理据：「集成测试本来就是要测集成场景，只测包内的是单元测试」。
> 台账 = #1781（TESTING · 归批）。前情 = 2026-10-25-closeout-marker-gate.md（在途）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（全链——新机制 ∕ 方向变更）

**需求（用户 2026-10-25 10:00 + 10:02 裁定）**：集成测试从各端目录（`thincoder-{cli,vscode,desktop}/test/integration/`）统一归位到**仓根 `test/integration/`**。RTM 同址一份（仓根 `test/RTM.md`，按端分节）。原裁「每端一份」（N22）推翻——用户原话：「集成测试本来就是要测集成场景，只测包内的是单元测试」。「零跨包引用」约束生产码，不约束测试码。

**需求档已改**（父侧笔，本批前置）：`docs/core/requirements/TESTING.md` N20（`:115`）· N22（`:226`）· F29（`:221`）· §4 收集根（`:122`）。

**现状面**：仅 CLI 有用例——`thincoder-cli/test/integration/` 5 档 15 例；VSC ∕ desktop 为空目录。搬迁面 = 5 档 + 三份 RTM + 三个 runner 收集路径 + 设计档 / 提示词 / RELEASE 的指向面。

**待设计定**：仓根 runner 形（单 runner 收集仓根 test/integration/，还是各端 runner 改指）∥ 用例 import 路径改写形 ∥ RTM 三合一段节形 ∥ 空目录去留。
## §2 批次任务与设计（eng-designer）
**状态行**：设计完成 2026-10-25（设计 = docs/core/design/TESTING.md §12 + 同档既有节随正；doc_check PASS（0 命中））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

### 本批条目（覆盖 ⇄ 验收对照）

设计档落点 = `docs/core/design/TESTING.md` §12（方案理由 §12.1 ∥ 接口契约 §12.2 ∥ 受影响文件 §12.3 ∥ 关键决策 §12.4 ∥ 验收 §12.5 ∥ 用例表 §12.6 ∥ 边界 §12.7 ∥ 指针清单 §12.8 ∥ RTM delta §12.9）＋ 同档既有节随正（头两行 ∥ §1 表 ∥ §3.1 表 ∥ §4.2 ∥ §4.3 ∥ §5.1 ∥ §10.3 ∥ §11.2–§11.6 ∥ §11.15 ∥ §11.16 建表结构句 ∥ §11.17）。

| # | 条目（覆盖） | 验收（机判，全文 = 设计 §12.5） |
|---|---|---|
| 1 | 5 档集成用例迁仓根 `test/integration/`（`@thincoder/core/**` specifier ⇒ 仓根相对路径；`import.meta.url` 派生常数重锚） | AC-IU1 ∥ AC-IU9 |
| 2 | 仓根 runner `test/run.mjs` 新建（单层 glob + SC-1 反查 + SC-2 软链拒绝 + SC-5 空集非零；逐段同构 cli 版） | AC-IU1–AC-IU3 |
| 3 | 包级面：cli runner 转空集说明器（同核仓口径）· vsc runner 摘集成清单面（删 `test/integration/files.mjs`）· desktop 头注随正 · cli ∕ vsc 空 `test/integration/` 目录删除 | AC-IU4 ∥ AC-IU5 |
| 4 | RTM 三合一 = 仓根 `test/RTM.md`（H2 端节；CLI 节 15 行原样迁入；vsc ∥ desktop 节骨架；编号端节内唯一；签署面一份） | AC-IU6 |
| 5 | 执行面接线：CI cli job 测试步改仓根 `node test/run.mjs`；`release-check.mjs` 集成步改指仓根 | AC-IU8 ∥ AC-IU1 |
| 6 | 提示词三处 `<package>/test/RTM.md` ⇒ 仓根裸路径（最终文字 = 设计 §11.17 三节围栏内；落地 = eng-coder） | AC-IU7 |
| 7 | 设计档 ∕ RELEASE 指向面随正（清单 = 设计 §12.8；`docs/RELEASE.md:110` ∕ `:220` = 父侧笔） | doc_check PASS |

**不在本批**：§10.3 面差①②（VSC ∕ desktop ∥ render-core runner 单元分层——续挂 runner 面批）∥ §5.1 起步批量（场景① × 三前端，编号 `6-1`–`6-3` 已定、归批不变）∥ desktop E2E 基建 ∥ 他档既已悬空指针（所指档先于本批不在盘）。

**三方一致**：批条目（本表）= 设计 §12.5 回指条目（需求 F5 ∕ F12 ∕ F29 ∕ F30 ∕ N20 ∕ N22 ∕ §4 收集根）= 需求档条目（`docs/core/requirements/TESTING.md` 同号——本批前置已由父侧随正）。

**机检注**：RTM 总表实施轮才建档，机检门判「档不在盘 = 档缺」⇒ 设计档散文面暂以 `<仓根>/test/RTM.md` 占位形代指（先例 = §11.8 的 `<包>/test/RTM.md` 形；注 = 设计 §12.1 指针形注），建档后修正轮归一裸路径。[上抛·知会] 需求档 `:221`（F29）已含裸路径 `test/RTM.md`——实施轮建档前，父侧对需求档跑 doc_check 会命中同一档缺；处置同此注（建档即解）。

**上抛项**：无待裁。[上抛·知会] §10.3 ∕ §11.8 的受影响文件旧表 = 各批落笔快照；§10.3 表头已标注「仓根归位后的现量面 = §12.3」，旧表不逐行改写（快照性质，非现行陈述）。

## §3 设计评审（评审子代理）
## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
