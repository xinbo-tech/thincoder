# 2026-10-25 · 集成测试统一归位：各端目录 → 仓根 test/integration/（推翻 N22）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-25 · 来源 = 用户 2026-10-25 10:00 指令：「集成测试现在在thincoder本身被放在各端目录下了，非常难找，我希望统一放在规范位置」+ 10:02 裁定推翻 N22 原理据：「集成测试本来就是要测集成场景，只测包内的是单元测试」。
> 台账 = #1781（TESTING · 归批）。前情 = 2026-10-25-closeout-marker-gate.md（在途）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-25

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

### 轮次 1（评审子代理）

评审对象 = `thincoder/docs/core/design/TESTING.md` + `thincoder/docs/core/requirements/TESTING.md`（设计评审，全档通读；仓根 = `thincoder/`，评审上下文中的相对路径实指该仓内路径）。

已核面：需求覆盖（§7 A-TS1–20 ∕ §11.10 AC-RTM ∕ §12.5 AC-IU1–9 逐条回指 F/N 条目）· 集成测试设计段（§12.9 从 RTM 读表出 delta，破行 0 ∥ 冗余 0 ∥ 缺失 0 带理由；§11.16 持 D-3 缺失答案）· 先例对齐行（头行 :13 ∕ §10.3 :481 ∕ §11.1 :547 ∕ §11.16 :791 ∕ §11.17 :901 ∕ §12.1 :959）· 公共源勘察行（:14 ∕ :483–485 ∕ :549 ∕ :793–798 ∕ :903 ∕ :960）· 既有件三问（:487–491 ∕ :694–696）· 受影响文件行数 ∕ Δ 标注（§10.1 ∕ §10.2 ∕ §10.3 ∕ §11.8 ∕ §12.3 五表齐）。

抽查实录（对盘）：`thincoder-cli/test/run.mjs` 51 行（标注 51 ✓）；`.github/workflows/test.yml` `:18` ∕ `:34` = `npm test`、`:46` ∕ `:58` ∕ `:70` = `npm run prepublishOnly`（标注 ✓）；集成 5 档在盘、`anthropic-tool-roundtrip.test.mjs` = 365 行 ∕ `unbooked-pen.test.mjs` = 264 行（§12.3 标注 ✓）；15 例标题已改号为 `test('<编号> …')` 与 §11.16 映射逐条对位 ✓；§11.17 三处提示词文案已逐字落地（persona :137–141 ∕ advisor :52–61）✓；`@thincoder/core` specifier 实读 = **3 档 7 处**（advisor-timeout-hot:22–24 ∕ browser-start-window:35–36 ∕ web-backend-404:18–19）——§12.3 表称「2 档 5 处」，计数不符（见发现 2）。

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Acceptance criteria | 🟡 | `docs/core/design/TESTING.md:1015`（AC-IU7）两个反引号串逐字相同（`` `test/RTM.md` 0 命中 ∧ `test/RTM.md` 各 1 处``）——机判不可执行，自相矛盾 | 按 §12.3 同档行（:992）的意图改：前半 = 旧形 `` `<package>/test/RTM.md` `` 0 命中，后半 = 仓根裸路径 `` `test/RTM.md` `` 各 1 处 |
| 2 | Clarity | 🟡 | §12.3 受影响文件表（:982）称 import 改写「2 档 5 处 `@thincoder/core/` specifier」；盘落实读 = **3 档 7 处**（advisor-timeout-hot.test.mjs:22–24 ∕ browser-start-window.test.mjs:35–36 ∕ web-backend-404.test.mjs:18–19） | 更正计数为 3 档 7 处；受影响档清单本身完整（5 档在列），仅 Δ 描述失真 |
| 3 | Doc-state lag | 🟡 | 份数口径跨节滞后：§11.8（:670「已裁 = 每端一份」）与 §11.12 O-1（:745「每端一份」）未标注 2026-10-25 推翻，而需求档 N22（requirements/TESTING.md:226）与本档 §12 已记推翻与「仓内一份」现行态 | 在 O-1 行与 §11.8 该行加推翻指针（→ §12 ∕ N22），历史裁定保留但标明已被推翻 |
| 4 | Doc hygiene | 🟡 | 需求档 F34 行（requirements/TESTING.md:199）在 3 列表格里写了 4 格——末格「与 F10 的关系」（含「不再有『不需变』这一出口」裁定）在 Markdown 渲染时会被丢弃 | 把「与 F10 的关系」段移出表格为行后注，或拆行并入「说明」格 |
| 5 | Doc-state lag | 🔵 | §7 A-TS9（:278，cli `npm test` exit 0 ∧ `ℹ tests 15`）∕ A-TS18（:287，门 = `npm test` 单入口）仍为 §12 前语义；§12.8 随正清单未含 §7 | 在 §12.8 清单补 §7 行，或给 A-TS9 ∕ A-TS18 加「§12 后按 AC-IU4 ∕ AC-IU1 读」随正注 |
| 6 | Numeric drift | 🔵 | §11.8（:675）集成 5 档快照 345∥245∥99∥108∥132 与 §12.3（:982）实测 365∥264∥109∥119∥142 不符；抽验两档证明 §12.3 为现量 | 以 §12.3 为现量；§11.8 行补「落笔时快照」注（§10.3 :467 已有同款声明面） |
| 7 | Numeric drift | 🔵 | `docs/RELEASE.md` 行坐标两节不一致：§10.3（:478）作 `:100` ∕ `:183`，§12.3（:994）作 `:110` ∕ `:220`；何者为现量未核（该档在评审域外） | 实施轮落笔前对盘重取行坐标 |

限制声明：评审上下文未提供项目标准档与文档地图——方法学符合性与文档归属按 AGENTS.md 判（`thincoder/docs/core/design/` 为权威设计面，两档落位正确，无新建碎档）；上述发现全部位于两份评审域内文档，域外文件仅以只读抽查支撑行数标注核验。

VERDICT: pass（🔴 0 · 🟡 4 · 🔵 3）

## §4 用户批准（主 agent）

**状态行**：已批准 2026-10-25（整批令「评审后自动跑完吧」覆盖批准门——评审 pass（#15）+ 修正已落 = 批准面满足）

**批准范围**：§12 全件——仓根归位（5 档迁移 + 仓根 runner + RTM 三合一）· 包级 runner 面（cli 空集说明器 ∥ vsc 摘集成面 ∥ desktop 头注）· CI/发布门接线 · 提示词三处随正 · 指针随正清单（§12.8）。

## §5 实施记录（eng-coder）
**状态行**：实施完成 2026-10-25



### 实施记录（eng-coder · 2026-10-25）

**改动面（全部落盘，语法全绿）**：

| 文件 | 改动 |
|---|---|
| `test/integration/*.test.mjs`（5 档） | 自 `thincoder-cli/test/integration/` 迁入（git mv 保 rename）；3 档 7 处 `@thincoder/core/**` specifier ⇒ `../../thincoder-core/**` 仓根相对路径（advisor-timeout-hot 3 ∥ browser-start-window 2 ∕ web-backend-404 2——评审发现 2 的实读计数）；2 档 `CLI_ENTRY` 重锚 `join(HERE,"..","..","thincoder-cli","bin","thincoder.mjs")` |
| `test/run.mjs`（仓根，新建 51 行） | 逐段同构原 cli 版：单层 glob `test/integration/*.test.mjs` + SC-1 反查（域 = 仓根 `test/` 树）+ SC-2 软链拒绝 + SC-5 空集非零 |
| `test/RTM.md`（新建） | 三份合一：H2 端节（CLI ∥ VS Code ∥ Desktop）；CLI 节 5 故事节 15 行自原 `thincoder-cli/test/RTM.md` 原样迁入；vsc ∥ desktop 节 = 骨架「尚无集成用例」；异常与更正 ∕ 签署面各一份（签署面产品标识列三端——KD-U6） |
| `thincoder-cli/test/run.mjs` | 改写为空集说明器（同构核版形：SC-1 零目标集合反查 + SC-2 + exit 1 + 仓根指引文案） |
| `thincoder-vscode/test/run.mjs` | 摘集成清单面（删 integration import ∕ 检查②集成分支 ∕ 检查③零混入 ∕ spawn 拼接）；单元清单面不动 |
| `thincoder-vscode/test/integration/files.mjs` + 目录 | 删除；cli ∥ vsc 空 `test/integration/` 目录删除 |
| `thincoder-desktop/test/run.mjs` | 头注集成域句随正（±1 行） |
| `.github/workflows/test.yml` | cli job 测试步 ⇒ `cd .. && node test/run.mjs`（仓根单 runner；vsc job 不动——全档 `npm test` 仅剩 vsc :35 一处） |
| `thincoder-cli/scripts/release-check.mjs` | 集成步 ⇒ `join(ROOT,"..","test","run.mjs")`；头注顺序句随正 |
| 提示词三档 | `<package>/test/RTM.md` ⇒ `test/RTM.md`（各 1 处，目标串 = 设计 §11.17 围栏内文字） |

**清单外改动（披露）**：三份旧 `*/test/RTM.md` 删除——§12.2「三份合一」的当然面（留着即双持漂移）；§12.3 受影响文件表未单列此行。

**验收读数（全部实测，2026-10-25）**：

| AC | 读数 |
|---|---|
| AC-IU1 | 仓根 `node test/run.mjs` ⇒ exit 0 ∧ `ℹ tests 15` ∕ `pass 15` ∕ `fail 0` ∕ `skipped 0`（4-3 本机有 Chromium 实跑过） |
| AC-IU2 | 探针 `test/__probe.test.mjs` ⇒ exit 1 ∧ `uncollected test file` ∧ 零 `ℹ tests` 行；删档复原 |
| AC-IU3 | 清空集成目录 ⇒ exit 1 ∧ `no integration test set`；复原后全绿 |
| AC-IU4 | `cd thincoder-cli && npm test` ⇒ exit 1 ∧ 说明含仓根指引 ∧ 无 `zero tests = green`；cli 包内探针 ⇒ `uncollected test file`（U-IU4） |
| AC-IU5 | vsc `npm test` ⇒ exit 0（tests 27 ∕ pass 27）；desktop `npm test` ⇒ exit 0（空清单直通 = 面差①既有读数，未变） |
| AC-IU6 | 一次性对账脚本（`docs/batches/2026-10-25-integration-unify.check.mjs`，用毕即删）：`rows 15 titles 15` ∧ 四列表全 `[]` ∧ `bad-column-rows 0` |
| AC-IU7 | 三档 `<package>/test/RTM.md` 0 命中 ∧ 裸路径各 1 处；`node scripts/prompt-refs-check.mjs` ⇒ 绿（命中 0） |
| AC-IU8 | CI 档 cli job 内 `npm test` 0 次，测试步 = 仓根 `node test/run.mjs` |
| AC-IU9 | 全部改动 `.mjs` `node --check` 绿（10 档）；`node --test test/integration/web-backend-404.test.mjs` 直达 ⇒ 3/3 绿 |

**单元测试档**：本批唯一一次性读数脚本 = AC-IU6 对账脚本——已跑（读数上表）、已删（用毕即删）。

**doc_check**：gate PASS（4 档：test/RTM.md + 提示词三档）。

**说明**：RTM CLI 节 4-3 行 = 原样迁入（§12.2「原样迁入」）；本日全量跑 skipped 0（4-3 实跑通过），「通过」与最新执行一致。面差①②（vsc ∥ desktop ∥ render-core runner）不在本批——续挂 runner 面批不变。

**审计修正轮 1（内部 explore 分歧审计）**：发现 1 项——`thincoder-desktop/test/integration/` 空目录在盘（mtime 2026-09-28，先于本批），设计 §12.2「desktop 本无该目录」的前提与盘不符；按 KD-U5 同一理由（空壳会被读者当现役位）删除该空目录。**设计档漂移报告（设计席档，未代改）**：§12.2 空目录行「desktop 本无该目录」失实——本批已删；§12.3 受影响文件表未列此目录。其余 13 项全对齐；清单外改动零新增。审计轮次 = 1，终端态 = clean。

**内部 advisor 代码评审（轮 1）**：VERDICT = pass（🔴 0）。实施面与设计 §12 逐条对位核验通过。协调项（父侧 ∕ 设计席笔域，非本实施缺陷）：① §12.8 他档随正清单未落（AGENT-PARAMS.md:89 ∥ BROWSER-TOOL.md:582 ∥ PROVIDER.md:1175 ∥ LIGHT-CHANNEL.md 六处 ∥ PROMPT-SYSTEM.md:204/:4322 仍指旧路径；RELEASE.md:110/:220 父侧笔未落）——批条目 7 的 doc_check PASS 判据依赖这些笔域落笔；② 勘察漏项：API-CONTRACT.md:4467 ∥ PROMPT-SYSTEM.md:3591 引本批删除的 vsc `test/integration/files.mjs`，未入 §12.8 清单。🔵 两项：TESTING.md :539/:725/:956 族残余滞后（设计席修正轮面）；`.thincoder/tmp/rtm-anchor-probe*.md` 探针残留（卫生项，出处 unverified）。

**终端态 = clean**：审计 1 轮（1 分歧 → 修正轮 1 已改）＋ 评审 1 轮 pass；修正轮 1 后零残余分歧。

## §6 验证与收口（父代理）

## 验证与收口

**父侧亲跑验收**：

| 判据 | 读数 |
|---|---|
| AC-IU1 仓根 15 例全绿 | `node test/run.mjs` ⇒ tests 15 · pass 15 · fail 0（亲跑 2026-10-25 11:22） |
| AC-IU4 cli 空集说明器 | `cd thincoder-cli && npm test` ⇒ exit 1 + 「the integration set lives at the repository root」指引（亲跑） |
| AC-IU7 提示词三处 | `<package>/test/RTM.md` 0 命中 ∧ 裸路径各 1 处（eng-coder 实测 + prompt-refs-check 绿） |
| doc_check | 五档（TESTING 设计/需求 · doc_check.md · RELEASE.md · 仓根 RTM.md）全 0 命中（亲跑） |

**评审链**：设计评审 #15 pass（0🔴 4🟡 3🔵——裁决表：4 修 + 1 父侧笔 + 1 补注 + 1 Deferred）；eng-coder 内部 explore 审计 1 轮 + advisor 代码评审 1 轮 pass（🔴 0）。

**修正轮**：① 评审修正 5 处（AC-IU7 串 · import 计数 · 份数旧表述 ×2 · F34 表格多格）；② 实施移交修正 3 组（§12.8 他档指针 · 死指针 ×2 · 设计档残余滞后——设计席修正轮 #17 全落，存量段太长 98 段父侧清零后 §2 补写）。

**测试行**：① 本批无批内单测档（runner/迁移面，验收全部走机检命令）· ② 集成集现量 **15 例 / 窗口 50–100**，本批 = 搬迁不改量（增删 0，位置变）。

**核销**：#1781。
