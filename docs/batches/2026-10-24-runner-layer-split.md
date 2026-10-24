# 2026-10-24 · runner 层分离：集成一条命令、单测单档直跑、空集非绿
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-24 · 来源 = 用户 2026-10-24 19:18「第三条我不同意。那个工具错的」+ 19:20「该删要删啊」——runner 把单测与集成混在一条命令，且空集报绿。
> 台账 = #1764（TESTING · 归批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-24
<§1 模板占位：本批条目 / 关键判据 / 授权口径>
## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（修正轮：上抛 3 裁 = 纳入本批；核门改语法门（设计侧已落））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

**状态行**：设计完成（2026-10-24）

**本批条目（覆盖）**

| # | 条目 | 覆盖判据 | 设计落点 |
|---|---|---|---|
| B1 | cli runner 分层：`npm test` 只跑集成层，单元层无入口 | F1 · F3 · F5 · F12 | design §10.3 分层 · A-SL1–A-SL3 |
| B2 | core runner 空集非零 + 说明文案 | AC-M10-4 · N20 | design §10.3 核仓口径 · A-SL4–A-SL5 |
| B3 | 收集面反查随窄面重指（错位档 fail-closed） | F6 · AC-M10-4 | design §10.3 自检 ① · A-SL2 · A-SL5 |

**明确不在本批**

- 集成用例本身（cli 5 档 15 例）零改。
- `.github/workflows/test.yml` 零改（CI 面）——核两 job 随语义变红，处置 = 另轮 CI 面批（design §10.3 受影响文件行）。
- VSC ∥ desktop 两 runner 的空集守卫（面差登记在案——design §10.3 面差登记；落地前其空集读数不得引用为「已验」）。
- 单元测试档形态与寿命（F6 ∥ F8 零改）。

**现状与缺陷（file:line）**

- ① cli 混层：`thincoder-cli/test/run.mjs:50` 一条 spawn 同时收 `test/*.test.mjs` 与 `test/integration/*.test.mjs`；实测 `cd thincoder-cli && node test/run.mjs` ⇒ tests 15 · pass 15 · fail 0 · exit 0 · duration ≈14.2s。cli 顶层单元层现盘零档（`test/` = `integration/` + `run.mjs` + `slow.mjs`）。
- ② core 空集报绿：`thincoder-core/test/run.mjs:42-45` 零档 ⇒ 打印 `ℹ test manifest is empty — zero tests = green (2026-09-28 full reset).` + exit 0；实测 `cd thincoder-core && node test/run.mjs` 逐字命中，exit 0。core `test/` 现盘 = `run.mjs` + `slow.mjs`。

**设计档落点**：`docs/core/design/TESTING.md` §10.3（执行层分离与空集处置，现行）+ §1.1 测试入口表 + §2.3 入口读数 + §4.2 ∕ §4.3 收集面 + §7 A-TS9 ∕ A-TS12 ∥ A-TS20 + §10 F1 ∥ F5 ∥ AC-M10-4；同批随正 5 处兄弟档指针（PROVIDER ∥ BROWSER-TOOL ∥ TOOLS ∥ LIGHT-CHANNEL ∥ AGENT-LOOP-UPSTREAM）。

**机制设计（一句话）**：`npm test` 的目标集合收窄为集成层单层 glob；单元测试档只走 `node --test <档>`；两个 runner 的启动前自检保留并把反查重指到窄收集面；目标集合为空 ⇒ exit 1 + 说明文案（cli 说「集成集为空」、核说「本包无集成集，N20」）。

**受影响文件与测试覆盖**

| 文件 | 现（行） | 期望 Δ |
|---|---|---|
| `thincoder-cli/test/run.mjs` | 51 | ≈ −4 ∕ +6 |
| `thincoder-core/test/run.mjs` | 49 | ≈ −6 ∕ +8 |
| `thincoder-cli/test/slow.mjs` | 7 | 0 |
| `thincoder-cli/package.json` | 44 | 0 |
| `thincoder-core/package.json` | 55 | 0 |
| `.github/workflows/test.yml` | 81 | 0（不改 CI 面） |
| `docs/core/design/TESTING.md` | 693（现行） | 本席已落 |
| 兄弟档指针 5 处 | — | 本席已落 |

**验收对照**：design §10.3 A-SL1–A-SL6（逐条机判）+ §7 A-TS20 回指。

**关键决策**：KD-1–KD-5 见 design §10.3。核心两条：① `npm test` 单义化（只留集成层）；② 空集在 cli ∥ 核两面都非零（同一判据，不留同型洞）。

**上抛项（待裁）**

1. **需求档与设计目标相抵**：`docs/core/requirements/TESTING.md:118`「`npm test`（单入口）全绿——重建期基线语义 = 空清单零用例即绿」+ `:99`「`npm test` = 空清单零用例绿」与目标语义（空集非零）正面相反——需求档笔 = 主 agent，本席未改。
2. **spec 一格两义**：`docs/core/requirements/ENGINEERING-MODE-V2-SPEC-TEST-DISCIPLINE.md:31` 判据列写「空集不读作绿——无集成用例时跑命令须非零退出」，同一行「方式」列写「跑命令 → 期望 exit 0」——需求档笔 = 主 agent。
3. **CI 与发布钩后果**：核两 job 的 `npm test` 步（`.github/workflows/test.yml:46` ∥ `:58`）变红；`thincoder-core/package.json:16` `prepublishOnly = npm test` ⇒ 核发布钩将拒绝发布。本批不改 CI 面（派单明令），处置 = 另轮 CI 面批（撤核 test job ∥ 改语法门）。

**修正轮 · 2026-10-24（上抛 3 裁决落地）**

> 本块取代上方 §2 中关于 CI ∥ 核发布钩 ∥ 面差处置的三处行：「明确不在本批」的「`.github/workflows/test.yml` 零改」行 · 受影响文件表的 `thincoder-core/package.json` 与 `.github/workflows/test.yml` 两行 · 上抛项 3。判据与设计落点以本块为准。

**裁决**：上抛 3 = 纳入本批（主 agent 裁：不改 CI 的代价是核包永远发布不出去，是真伤害，不是噪音）。

**新增条目**

| # | 条目 | 覆盖判据 | 设计落点 |
|---|---|---|---|
| B4 | 核包不设测试门：`npm test` = 空集说明器（非门）；`prepublishOnly` ∥ CI 核两 job = 语法门 | A-SL7 · A-SL8 · AC-M10-4 | design §10.3 核包终态三件 |
| B5 | 面差登记转可执行收口路径（VSC ∥ desktop 两面：空集直通 + 分层未落） | design §10.3 面差登记表 | design §10.3 面差登记 |

**条目修正**

| # | 修正 |
|---|---|
| B2 | 判据补一条：核 `npm test` 非零 **且** 该非零不进任何门——核门 = 语法门（核包既不自称已验，也不永远红） |

**cli CI job（第二面）**：零改确认——`npm test` 收窄为只跑集成后，CI 跑它就是收口门；集成 5 档 15 例自带 HOME 隔离 ∥ 脚本化 provider（零外网），CI 不需加步（判据 = A-SL9）。

**受影响文件补行**（承上表）

| 文件 | 现（行） | 期望 Δ | 判据 |
|---|---|---|---|
| `thincoder-core/package.json` | 55 | 0（1 行替换） | `prepublishOnly` = `node scripts/check-syntax.mjs`（原 `npm test`） |
| `thincoder-core/scripts/check-syntax.mjs` | 0（不存在） | +≈55（新建） | 包根递归 `*.mjs` 逐档 `node --check`；失败列档 + exit 1 |
| `.github/workflows/test.yml` | 81 | 0（2 行改） | `:46` ∥ `:58` 步 `npm test` ⇒ `npm run prepublishOnly`；其余四 job 零触 |
| `docs/RELEASE.md` | 389 | 2 行（父侧路由） | `:100` ∥ `:183` 核钩陈述随正 |

**明确不在本批（修订）**

- CI 面不再是零改：核两 job 的一步在本批改；cli ∥ vscode ∥ server ∥ docs 四 job 零改。
- VSC ∥ desktop 两 runner 的空集守卫与分层仍不在本批——收口路径见 design §10.3 面差登记（坐标 ∥ 判据 ∥ 挂账 ∥ 删除条件）。
- 不变三项：集成用例零改 · 单元测试档形态与寿命零改 · runner 本体实现 = 实施轮的笔（核 runner 的 exit 1 语义零改）。

**设计落点**：`docs/core/design/TESTING.md`——§1.1 入口表 · §1.2 核树面 · §2.3 读数表 · §10 发布钩句 · §10.3 核包终态 ∥ 受影响文件 ∥ A-SL7–A-SL9 ∥ 面差登记 · §7 A-TS12 ∥ A-TS20。

**修正轮 2 · 2026-10-24（设计评审轮次 1：1 🔴 + 8 🟡 + 1 🔵 逐条处置）**

> 评审表 = 批档 §3（轮次 1）；`Suggestion` 列 = 评审员建议，逐条处置的执行人 = 本席（eng-designer），全部接受。
> 本轮边界：不改 runner 本体 ∥ CI ∥ `package.json`（实施轮的笔）；需求档 §4 一行 = 主 agent 的笔（见 2）。
> 编号以本块为准，号 → 改动 file:line：

| 号 | 处置 | 改动 file:line |
|---|---|---|
| 1 🔴 | 收集面 ∥ ① 文案权威定在一处 = §10.3：新增「收集面权威」句；§10.2 ④-2 的 glob 括注改写为指 §10.3；判据 5 样例三行收为两行（VSC 单元 ∥ 集成），CLI ∥ 核文案唯一 home = §10.3 ①（旧的「move it into test/ …」串已删，不再有第二个逐字样例）；受影响文件表补同档同步面一行 | `docs/core/design/TESTING.md:427` · `:386` · `:394-402` · `:481` |
| 2 🟡 | 裁决 = **改需求档**（选项 A）：§10.3 增「需求口径」句——收窄 = 需求 §4 同批修订，需求档笔 = 主 agent；未随正前两档不一致（缺口登记在此）。建议措辞：`test/integration/` = 集成收集根；`test/` 其他位置 ∥ `docs/batches/` = 非执行面（目录分界即执行层划分） | 设计侧 `:429`；需求侧待落 `docs/core/requirements/TESTING.md:122` |
| 3 🟡 | 面差补第三面 render-core：新增证据行（包根有 `test` script ∥ `test/run.mjs:74-78` 空集直通 ∥ `:81` 单层收集 ∥ 顶层单元档 `model-menu-pure.test.mjs`）；收口路径两行→三行；§2.3 措辞「这两面」→ 三面；档头多实现面补 render-core | `:513-523` · `:93` · `:8` |
| 4 🟡 | A-TS9 按包拆：cli = exit 0 ∧ `ℹ tests 15`；核 = exit 1 ∧ `requirement N20`（非门，语法门另判 A-SL7）；vsc ∥ desktop ∥ render-core = 面差前按现行读数且不得引为「已验」，落地后空集 ⇒ exit 1 + 说明 | `:280` |
| 5 🟡 | 受影响文件表加 as-of（2026-10-24 · `wc -l`）并逐行重读：cli 51 · 核 49 · slow 6（原 7）· cli pkg 44 · core pkg 55 · test.yml 80（原 81）· docs/RELEASE.md 388（原 389）· 本档 708（原记 620）；§10.3 表 = 全档唯一现量面，§10.2 与 §11.8 的「现」列改为指本表；vsc 69 ∥ desktop 49 ∥ render-core 83 记入面差表 | `:469-481` · `:406-411` · `:664` |
| 6 🟡 | §10.3 补先例行：对位 §10.1 ∥ §10.2 增量体式 · 实施坐标 = 本节受影响文件表 · 先例批 = 无（理由同 §11.1）· 偏离 = 无 | `:483` |
| 7 🟡 | §10.3 补勘察行：已查 docs 两树 ∥ `test.yml:70`（server job 已有 `npm run prepublishOnly` 同形先例）∥ 四包 scripts ∥ 仓内两份 check-syntax；外部公共源 = 本批未引（零新用法） | `:485` |
| 8 🟡 | `check-syntax.mjs` 三问式：existing = cli ∥ vsc 两份（消费者点名到 `lint` ∥ CI ∥ `vscode:prepublish`）· name 逐字 · 复用形 = 同构实例（各包自持）⇒ 核 = 第三实例 64 行；`+≈55` 改 `+64`；补「压不更短」理由 | `:487` · `:478` |
| 9 🟡 | 立跨节编号表 SC-1…SC-5（id ∥ 语义 ∥ 代码落点 ∥ 本批 ∥ 失败串唯一 home），§10.2 ∥ §10.3 以 id 互指；明记 `②'` 与 `①` = **同一段代码**（cli `test/run.mjs:23-41` ∥ 核 `:22-39`），不是一个故障两段实现 | `:442-459` |
| 10 🔵 | 面差挂账带复查触发：下一批 runner 面批立项时必核；任一面的空集读数被要求引用为「已验」时立即回本表核对 | `:513-523` |

**未落 / 待裁**

- 需求档 §4:122 修订 = 主 agent（本席无需求档写权）。其落地前，需求 §4 括注与设计 §10.3 不同口径——两档不一致这一点已写进设计侧（`:429`）。
- runner 本体 ∥ CI ∥ `package.json` ∥ `docs/RELEASE.md` = 实施轮（eng-coder），本席零改。

**修正轮的验证读数**

- `doc_check(mode:"gate")` 跑 `docs/core/design/TESTING.md`（708 行，whole）：`DOC-CHECK GATE: PASS`，0 条命中。
- 现量逐行重读命令 = `node -e` 逐档 split 计数（等价 `wc -l`，末行空行计入），2026-10-24；读数见 5 号行。

**修正轮 3 · 2026-10-24（设计评审轮次 2：1 🔴 + 2 🟡 + 1 🔵 逐条处置）**

> 评审表 = 批档 §3（轮次 2）；`Suggestion` 列 = 评审员建议，逐条处置的执行人 = 本席（eng-designer），全部接受。
> 本轮边界：不改 runner 本体 ∥ CI ∥ `package.json`（实施轮的笔）。
> 编号以本块为准，号 → 改动 file:line：

| 号 | 处置 | 改动 file:line |
|---|---|---|
| 11 🔴 | A-RC3 与 F2 的核包表述按 §10.3 收正。A-RC3 改为「零假阳 = 健康树面自检不误报」：cli（集成 5 档 15 例、`test/` 顶层零档）⇒ `npm test` exit 0 ∧ 零 `uncollected test file`；核（`test/` 零 `*.test.mjs`）⇒ 零 `uncollected test file`、出口 = 空集说明（exit 1 ∧ `requirement N20`）；VSC = 面差 ② 未落、读数不引为「已验」。旧「VSC 61 单元 + 12 集成 / CLI 77 / 核 42 全收集）⇒ 三包 exit 0」整句删除——盘上实读 VSC 单元清单 5 档（`thincoder-vscode/test/files.mjs:8`）∥ 集成清单 0 档（`thincoder-vscode/test/integration/files.mjs:2`）⇒ 旧计数为失效快照。F2「CLI 与核 glob」改「CLI = 单层 glob · 核 = 零目标集合 · VSC 显式清单」；同句在 §10.2 出界段重复一次，同改 | `docs/core/design/TESTING.md:411` · `:326` · `:416` |
| 12 🟡 | 口径按需求 §4 那句统一——「这不是按目录划分执行层，而是同一条门的两种失败面」；「需求档笔 = 主 agent；未随正前，两档不一致（缺口登记 = 批档 §2）」整句删除（需求 `docs/core/requirements/TESTING.md` §4 已修订并回指 §10.3 SC 表） | `docs/core/design/TESTING.md:429` |
| 13 🟡 | 「唯一现量面」改为实际范围：本节两表（受影响文件表 ∥ 面差登记表）= 全档唯一现量面；其他节的读数列 = 该节落笔时快照或指向本节。§10.1 受影响文件表 lead-in 标快照；§10.2 三行与 §11.8 行的「唯一现量面」标签撤走（指向不变） | `docs/core/design/TESTING.md:469` · `:356` · `:408-410` · `:664` |
| 14 🔵 | 本档自身行数不落固定读数（「708」删除——行数随改笔变化）：改「—（本档自身；行数随本节改笔变化，不落固定读数）」 | `docs/core/design/TESTING.md:481` |

**修正轮 3 的验证读数**

- `doc_check(mode:"gate")` 跑 `docs/core/design/TESTING.md`（whole）：`DOC-CHECK GATE: PASS`，0 条命中。
- 反查读数（改笔前）：`grep`「核 glob」= §10 两处（`:326` ∥ `:416`），均改；「708」1 处（`:481`），已删；「目录分界即执行层划分」1 处（`:429`），已换口径。

**修正轮 3 · 补充（取代上方过期行）**

- 上方「未落 / 待裁」第 1 条已失效：需求 `docs/core/requirements/TESTING.md` §4 已修订（收集根 = `test/integration/`，且回指设计 §10.3 SC 表）——该行「其落地前，需求 §4 括注与设计 §10.3 不同口径」不再成立，设计侧口径 = 本轮 12 号处置。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

### 评审对象
类型 = 设计评审 · 目标 = `docs/core/design/TESTING.md` §10.3 执行层分离与空集处置（分层 · 核仓终态 · 空集非零 · 面差登记）· 状态 = 待评审 · 触发 = 批内全链。
评审范围文件（全读）：`docs/core/design/TESTING.md`（708 行）· `docs/core/requirements/TESTING.md`（249 行）。
限制：无项目标准档、无文档地图（Document ownership 判据降级——按 AGENTS.md 与评审判据判）；受影响文件表内的代码档现量未抽查（评审范围限定两档，相关断言标 unverified）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership | 🔴 | 同一机制（CLI ∥ 核 runner 的收集面与 ① 故障文案）两处互不相容：§10.2:386 写「CLI = 两层 glob · 核 = 单层 glob」，§10.2:399 的核样例行写「this runner collects a single level」（即核收 `test/*.test.mjs`）；§10.3:424 写「单层 glob，零第二层」，§10.3:441 写「核 = 零目标集合，任何 `*.test.mjs` 都是错位」（§2.3:92 同 §10.3）。§10.2:394 又把三行样本定为「完整样例（逐字：前缀 + 故障类型 + 括注 + `<rel>`）」＝AC 断言对象 ⇒ 同一 ① 故障有两个「逐字」串（§10.2:398「move it into test/ or test/integration/」vs §10.3:441「unit test files live in docs/batches/」）。后果：核用户按 §10.2:399 指引把档「上移进 test/」后仍按 §10.3:441 判错位（死循环指引）；写文案断言时无从选串 | 把收集面与 ① 文案的权威定在一处（建议 §10.3 或其上一节「收集面」），把 §10.2 判据 5 样例行与 ④-2 的 glob 括注标为被取代／同批改写；受影响文件表补同档同步面一行（`docs/core/design/TESTING.md` §10.2）或写明无需同步的理由 |
| 2 | Requirements | 🟡 | 需求 §4:122 的边界句「`test/` 树 = 集成测试收集根〔单根约定〕」与「`test/integration/` 子目录分界属寿命划分…非执行层划分（见 F12）」被 §10.3 反向落地（§10.3:420「执行层分离」· §10.3:424 只收 `test/integration/*.test.mjs` · A-SL2:472 要求 `test/__probe.test.mjs` ⇒ exit 1）。设计未记录该反转，受影响文件表也无需求档 ⇒ 两档各持一种「收集根」读数 | 二选一并落成一处：或改需求 §4:122 括注为收窄后口径（需求档进同步面），或在 §10.3 明记「本条收窄覆盖 §4 括注」＋理由，使单根约定不再视为现行 |
| 3 | Requirements（面差登记完整性） | 🟡 | 面差登记自称覆盖「VSC ∥ 桌面两面」（§10.3:491），删除条件为「两面 ①② 落地」（§10.3:499）；而 §2.3:93 同一行实际列三个包（vscode ∥ desktop ∥ render-core）并同样标「旧空集直通（exit 0）」。render-core 属核仓、按 N20 无集成集（§4:143「核仓（`thincoder-core` ∥ `thincoder-render-core`）不设集成测试集」）⇒ 其空集语义也须非零并说明，设计未给判据亦未说明出界 | 补第三行面差（坐标 ∥ 目标 ∥ 判据 ∥ 挂账路径），或写明 render-core 无 `test` 入口／不适用并附证据；同时把 §2.3「这两面」措辞与实际列出的三个包对齐 |
| 4 | Acceptance criteria | 🟡 | A-TS9（:280）要求「有集成集的包 `npm test` exit 0（cli ∥ vsc ∥ desktop）」，而 §2.3:100 记「vscode ∥ desktop = 集成目录在、零例档」，面差 ① 落地目标又是「空清单 ⇒ exit 1 + 说明」（§10.3:495）⇒ 面差落地后同一条 AC 与本设计的落地目标互相否定，收口时任一边判红 | A-TS9 按面包拆（cli = exit 0；核 = 非零并说明；vsc ∥ desktop = 面差落地前按现行读数、落地后按「无集 ⇒ 非零」），使 AC 随面差状态有唯一判法 |
| 5 | Affected-file annotations（判据 8） | 🟡 | 同一文件的「现」读数两处矛盾：`thincoder-cli/test/run.mjs` §10.2:410「**10**」vs §10.3:458「51」；`thincoder-core/test/run.mjs` §10.2:411「**9**」vs §10.3:459「49」（10 + ≈14 ≠ 51，非 as-of 差可解释）；`thincoder-vscode/test/run.mjs` §10.2:409「54」而 §10.3:495 引其 `:63-67`（超出现量）。另本档 §11.8:640 记「⇒ **620 行**」，盘上本档实读 708 行 ⇒ Δ 承诺不可核 | 受影响文件表统一加「as-of（日期 ∥ 命令）」并逐行重读现量；旧节的「现」标成快照，或让 §10.3 表成为唯一现量面 |
| 6 | Methodology（判据 9） | 🟡 | §10.3 无「先例对齐」行：档头「先例对齐（单元测试档寿命口径）」（:13）对象是寿命口径（对位节 §3.1 ∥ §3.3），§11.1:519 另持有自己的先例行；§10.3 的增量体式（分层 ∥ 核仓终态 ∥ 空集 ∥ 面差）无先例坐标与偏离理由 | 按档内既有形态补一行：对位节 = §10.1 ∥ §10.2 的增量体式 · 实施坐标 = §10.3 受影响文件表 · 先例批 = 无（理由同 §11.1）；偏离处写明理由 |
| 7 | Methodology（判据 10） | 🟡 | §10.3 无「公共源勘察」行：档头 :14 的勘察对象记明为「对象 = 仓内两档寿命措辞」，§11.1:521 只覆盖 RTM 面 ⇒ §10.3 的对外决策（CI 两 job 改步 ∥ `prepublishOnly` 门面 ∥ Actions 用法）无勘察记录 | 补一行勘察记录，点名查过哪些源与结论；「无相关」也写，并给对象范围 |
| 8 | Existing-piece（判据 11） | 🟡 | 新增件 `thincoder-core/scripts/check-syntax.mjs`（§10.3:463「0（不存在） | +≈55（新建）」）只答「本路径不存在」，无三问式答复；而本档 §10:331 自记仓内已有同职能件（「`lint` 是语法门（node --check）非测试门」，CI 两作业 + VSC `vscode:prepublish` 消费）。（该脚本盘上确切路径 ∥ 内容 = unverified——本次只读两档） | 三问式补一句（`existing: <路径>（不可复用因 …）` ∥ `none found: <查过范围>`），并说明 +≈55 行不能压成更短形的理由 |
| 9 | Clarity | 🟡 | 检查项编号跨节撞号且身份未定：§10.1 用 ③-1 ∥ ③-2，§10.2 用 ④-1 ∥ ④-2 且内含「②'」，§10.3:439-444 另立 ①–④ 表；§10.2 的「②' 无漏收集」与 §10.3 的「① 收集面反查」判据几乎同义（§10.2:386 vs §10.3:441），未说二者是同一段代码还是两段 ⇒ 同一故障的文案例有两个家 | 立一份检查项稳定编号表（id ∥ 语义 ∥ 既有∕新增 ∥ 失败串唯一 home），§10.2 ∥ §10.3 之间以 id 互指 |
| 10 | Scope（🔵） | 🔵 | 面差 ①② 的挂账只写「主 agent 建行」（§10.3:498），无期龄 ∥ 复查触发面；删除条件依赖一个尚未排期的 runner 面批次 ⇒ 未落地不可见 | 挂账时带一个复查触发（如「下次 runner 面批次立项时必核」） |

计数：🔴 1 · 🟡 8 · 🔵 1（共 10 行）。
VERDICT: changes-required

### 轮次 2（评审子代理）

## 复核（第 2 轮）· `docs/core/design/TESTING.md` §10.3 — 上一轮 10 条逐条核 + 新增问题

范围（全读）：`docs/core/design/TESTING.md`（733 行）· `docs/core/requirements/TESTING.md`（250 行）。

| # | Orig# | 文件:行 | 严重度 | 状态 | 说明 |
|---|-------|---------|--------|------|------|
| 1 | 1 | design:423 ∥ :386 ∥ :401 ∥ :459 | 🔴 | Fixed | 收集面已收为单一权威：:427「本节 = 收集面 ∥ 空集语义的**唯一权威陈述面**」；§10.2:386 括注改写为「口径 = §10.3（cli = `test/integration/*.test.mjs` 单层 · 核 = 零目标集合）」；:401「**CLI ∥ 核的收集面故障文本唯一 home = §10.3 ①**——本表不复制」；:459「**`②'` 与 `①` 是同一段代码，不是两段**」。旧「CLI = 两层 glob · 核 = 单层 glob」与核样例行已不在档。 |
| 2 | 2 | requirements:122 | 🟡 | Fixed | 需求 §4 改写成单根约定：「收集根 = `test/integration/`（单根约定：集成测试档只住这里）；`test/` 的其它位置一律判错位、`docs/batches/` 的单元测试档不入收集」，与 §10.3 收集根同口径（残留措辞差 = 新 #12）。 |
| 3 | 3 | design:513 ∥ :520 ∥ :523 ∥ §2.3:93 | 🟡 | Fixed | 面差扩为三面：「**面差登记**（VSC ∥ 桌面 ∥ render-core 三面——含可执行收口路径与复查触发…）」；:520 补 render-core 证据（`model-menu-pure.test.mjs` 判错位、归宿由该批定）；:523「本行删除条件 = 三面 ①② 落地」；§2.3:93「空集守卫未落**这三面**（面差登记 = §10.3 三行）」。 |
| 4 | 4 | design:280 | 🟡 | Fixed | A-TS9 已按包拆：「`npm test` **按包判**：**cli** = exit 0 ∧ `ℹ tests 15`…；**核** = exit 1 ∧ `requirement N20` 说明…；**vsc ∥ desktop ∥ render-core** = 面差落地前按现行读数且**不得引用为「已验」**，落地后 = 空集 ⇒ exit 1 + 说明」。 |
| 5 | 5 | design:469 ∥ :481 ∥ §11.8:664 | 🟡 | Fixed | 现量面归一：:469「**本表 = 全档唯一现量面**——§10.2 ∥ §11.8 的「现」列只指本表」；§10.2 三行现量改「见 §10.3 受影响文件表（唯一现量面）」；§11.8 撤走 411/620 数字改快照注（残留 = 新 #13/#14）。 |
| 6 | 6 | design:483 | 🟡 | Fixed | 先例对齐行在位：「对位设计节 = **§10.1 ∥ §10.2** 的增量体式…实施坐标 = 本节受影响文件表；先例批 = **无**…偏离：无」。 |
| 7 | 7 | design:485 | 🟡 | Fixed | 公共源勘察行在位且点名源：`docs/**` ∥ `.github/workflows/test.yml`（`:70` 同形先例）∥ 四包 `package.json` ∥ 仓内既有语法门实现；结论「外部公共源 = 本批未引」。 |
| 8 | 8 | design:487 ∥ :478 | 🟡 | Fixed | 既有件三问补齐：`existing: thincoder-cli/scripts/check-syntax.mjs` ∥ `thincoder-vscode/scripts/check-syntax.mjs`、name 逐字、复用形 = 同构实例（各包自持），并给「压不到更短」理由；:478 Δ 改 `+64（新建；逐行同构 cli 版 64 行）`。 |
| 9 | 9 | design:449-459 | 🟡 | Fixed | 立了跨节唯一 id 表（SC-1…SC-5：语义 ∥ 代码落点 ∥ 本批 ∥ 失败串唯一 home），并明说 ②'/① 同一段代码 ⇒ 编号撞号与「同一故障两个文案家」已闭。 |
| 10 | 10 | design:521-523 | 🔵 | Fixed | 收口路径带 `trigger = 归批`、复查触发（「下一批 runner 面批立项时必核」）与删除条件 ⇒ 挂账有期龄面。 |
| 11 | (new) | design:411 ∥ :326 ∥ :444 ∥ :496 | 🔴 | New | **核仓收集面/退出码仍在两处互否。** :411「A-RC3：零假阳——VSC 61 单元 + 12 集成 / CLI 77 / 核 42 全收集）⇒ 三包 `npm test` exit 0（回归）」 vs :444「核 = 零目标集合，任何 `*.test.mjs` 都是错位」、:496「⇒ **exit 1** ∧ 输出含 `requirement N20`」、§7 A-TS9/A-TS12 同判 exit 1；:326 仍写「CLI 与核 glob」。两条 AC 不可能同时绿 ⇒ 按 A-RC3 收口必假红，按 A-SL4 收口则 A-RC3 恒假。 |
| 12 | (new) | design:429 ∥ requirements:122 | 🟡 | New | 框架句互否 + 进程陈述过期：:429「**同批修订**——目录分界即执行层划分」 vs 需求「**这不是按目录划分执行层**，而是同一条门的两种失败面」；同处仍称「需求档笔 = 主 agent；未随正前，两档不一致（缺口登记 = 批档 §2）」，而需求 :122 已修订并回指本档 §10.3 SC 表。 |
| 13 | (new) | design:361 ∥ :517 ∥ :469 | 🟡 | New | 「全档唯一现量面」名不副实：§10.1:361 仍自持现量「\| `thincoder-vscode/test/run.mjs` \| 52 \| +2 → **实测 54**」，与 :517「`thincoder-vscode/test/run.mjs:63-67`（69 行）」对同一文件两个读数；:469 的权威声明只列 §10.2 ∥ §11.8，未含 §10.1。 |
| 14 | (new) | design:481 | 🔵 | New | 同档同步面行自记现量 `708`，而本档本轮读取 = 733 行（修复新增先例对齐 ∥ 勘察 ∥ 三问 ∥ SC 表后未回改）⇒ 「唯一现量面」里唯一一行数字就是旧值。 |

**计数**：🔴 1 · 🟡 2 · 🔵 1 新增；上轮 10 条 = 10 Fixed。

VERDICT: changes-required

### 轮次 3（评审子代理）

### 第 3 轮复核 · docs/core/design/TESTING.md §10.3（仅核 11–14）

| # | Orig# | 文件 | 严重度 | 状态 | 说明 |
|---|-------|------|--------|------|------|
| 1 | 11 | design §10.2:411 ∥ §10:326 | 🔴 | Fixed | A-RC3 已改写为**按包读数**：`:411` 现为「cli（集成 5 档 15 例、`test/` 顶层零档）⇒ `npm test` exit 0 ∧ 零 `uncollected test file`；核（`test/` 零 `*.test.mjs`）⇒ 零 `uncollected test file`、出口 = 空集说明（exit 1 ∧ `requirement N20`——§10.3 A-SL4）」——「核 42 全收集 ⇒ 三包 `npm test` exit 0」句已不在档；§10 F2 `:326` 的「CLI 与核 glob」改为「核 = 零目标集合（不跑用例，exit 1 + `requirement N20` 说明——§10.3）」。与 §10.3 SC-1（`:444`）∥ A-SL4（`:496`）∥ §7 A-TS9（`:280`）同口径，两条 AC 不再互否。 |
| 2 | 12 | design:429 ∥ requirements:122 | 🟡 | Fixed | `:429` 现为「本节的收集面收窄 = 需求 §4 的同批修订（**已随正**）——收集根 = `test/integration/`（单根约定）；**这不是按目录划分执行层**，而是同一条门的两种失败面」——与需求 `:122`「**这不是按目录划分执行层**」同句同向；旧「目录分界即执行层划分」与「未随正前，两档不一致（缺口登记 = 批档 §2）」两句均已删除。 |
| 3 | 13 | design §10.1:356 ∥ :469 ∥ :517 | 🟡 | Fixed | 权威面已收窄且 §10.1 已自标快照：`:469: **本节两表（受影响文件表 ∥ 面差登记表）= 全档唯一现量面**——其他节的读数列 = 该节落笔时的快照或指向本节的指针，不读作现量`；§10.1 表头 `:356: （本表读数 = 本条目落笔时快照；现量见 §10.3）`。故 `:361` 的「实测 54」与 `:517` 的「（69 行）」不再是两个并列现量。 |
| 4 | 14 | design:481 | 🔵 | Fixed | `708` 已换为「—（本档自身；行数随本节改笔变化，不落固定读数）」——自指行数不再冒充现量。 |

**承上轮（无回归）**：1–10 号 = Fixed（本轮复核 `§10.2:386 ∥ :401` · `§10.3:427 ∥ :459 ∥ :483 ∥ :485 ∥ :487 ∥ :521-523` · `§2.3:93` · `§7 A-TS9` · `§11.8:664` 均在位且同口径）。
**本轮计数**：prior 4/4 fixed · 新增 🔴 0 · 🟡 0 · 🔵 0（第 3 轮窗口关闭，仅核 11–14，不开新案）。

VERDICT: pass

## §4 用户批准（主 agent）

**批准依据**：用户 2026-10-24 19:44（`#1764` 开批）为整批令；22:15「都做吧，后续都自动推进」为批次级放行。设计评审链：轮 1 changes-required（1 🔴 + 8 🟡 + 1 🔵）→ 修正 → 轮 2 changes-required（1 🔴 + 2 🟡 + 1 🔵）→ 修正 → 轮 3 pass（token `7d117263-…`）→ 实施（`#64`）。

## §5 实施记录（eng-coder）
**状态行**：实施完成



**本批落点（file:line · Δ）**

| 落点 | 改动 | Δ（行，末行换行计入） |
|---|---|---|
| `thincoder-cli/test/run.mjs` | 收集面收窄为 `test/integration/*.test.mjs` 单层；SC-1 反查改判 `test/integration/`；SC-5 空集 ⇒ exit 1 + `no integration test set …`；spawn 增 `cwd: root`（自检与收集同基准） | 51 → 50 |
| `thincoder-core/test/run.mjs` | 无目标集合（不跑用例）；`test/` 下任何 `*.test.mjs` ⇒ exit 1 + `uncollected test file`；常态出口 exit 1 + `requirement N20` 说明 | 49 → 40 |
| `thincoder-core/scripts/check-syntax.mjs`（新建） | 包根递归 `*.mjs`（跳 `.` 前缀 ∥ `node_modules`），逐档 `node --check`，失败列档 + exit 1，成功 `check-syntax: N file(s) OK`；逐行同构 cli 版 | 0 → 59 |
| `thincoder-core/package.json:16` | `prepublishOnly`: `npm test` → `node scripts/check-syntax.mjs`（`test` script 零改） | 0（1 行替换） |
| `.github/workflows/test.yml:46` ∥ `:58` | 核两 job 步 `npm test` → `npm run prepublishOnly`；其余四 job 零触 | 0（2 行改） |

**未触（派单明令）**：两档 `test/slow.mjs` · VSC ∥ desktop ∥ render-core 三 runner · `thincoder-cli/package.json` · `docs/**`（`docs/RELEASE.md:100` ∥ `:183` = 父侧路由）。

**验收读数（A-SL1–A-SL9 逐条单跑；未跑全量套件）**

| # | 命令 | 读数 |
|---|---|---|
| A-SL1 | `cd thincoder-cli && npm test` | exit 0 · `ℹ tests 15` · `ℹ pass 15` |
| A-SL2 | 落 `test/__probe.test.mjs` 后 `node test/run.mjs`；删档复原 | exit 1 · 含 `uncollected test file` · 零 `ℹ tests` 行 |
| A-SL3 | 清空 `test/integration/` ⇒ 跑 ⇒ 复原 | 空集 exit 1 · 含 `no integration test set` · 零 `ℹ tests`；复原 exit 0 · `ℹ tests 15` |
| A-SL4 | `cd thincoder-core && node test/run.mjs` | exit 1 · 含 `requirement N20` · 不含 `zero tests = green` |
| A-SL5 | 核落 `test/__probe.test.mjs`；删档复原 | exit 1 · 含 `uncollected test file` |
| A-SL6 | `node --test docs/batches/2026-10-19-zerowrite-criterion.test.mjs` | exit 0 · `ℹ tests 7` · `ℹ pass 7` |
| A-SL7 | `cd thincoder-core && npm run prepublishOnly`；`npm publish --dry-run` | exit 0 · `check-syntax: 275 file(s) OK`；dry-run 跑过 prepublishOnly，输出零 `no integration test set` ∥ 零 `zero tests = green`（dry-run 自身 exit 1 = 版本占用守卫 `You cannot publish over the previously published versions: 0.10.10`，与门无关） |
| A-SL8 | `grep` `test.yml` | `npm test` 仅 `:18`（cli）∥ `:34`（vscode）= 2 次；核两 job `:46` ∥ `:58` = `npm run prepublishOnly` |
| A-SL9 | `git diff .github/workflows/test.yml` | 只有核两 job 两个 hunk；cli job 零行改；`cd thincoder-cli && npm test` = A-SL1 读数 |

**附带读数**：从仓根 `node thincoder-cli/test/run.mjs` ⇒ exit 0 · `ℹ tests 15`（`cwd: root` 修复后基准确）。

**自查与两轮独立复核**

- 内部 divergence 审计（explore，只读）：CLEAN——A-SL1–A-SL9 逐条对位、五个改动档与声明清单一致、无越界档；提 1 条 in-pen nit（核 runner 头注沿用 cli「runner 只收集 *.test.mjs」），已改。
- 代码评审轮次 1（advisor）：VERDICT pass · 0 🔴 · 5 🟡 · 2 🔵，🟡/🔵 全 non-must-fix。
- 自查修正 1 处（评审 4 号，in-pen）：`thincoder-cli/test/run.mjs:49` spawn 增 `cwd: root`——自检 walk 用 `import.meta.url` 推出的 root，收集却继承进程 cwd，两半基准可不同；修后 A-SL1/A-SL2/A-SL3 全部复跑复绿。
- 代码评审轮次 2（advisor，仅核 fix claim）：fix 已验证、无新问题，VERDICT pass。终态 = clean（2 轮收敛）。

**未修（非本笔 / 已接受的取舍，逐条理由）**

- 评审 5 号（核 `check-syntax.mjs` 空集 fail-open：`files.length === 0` 仍打印 OK + exit 0）：设计明令「逐行同构 cli 版」，形承先例；该输入未在真实面出现（包根不可读时脚本自身也读不到）——不加未要求的防御分支。
- 评审 7 号（`test/integration/.x.test.mjs` 点号档逃过 SC-1，而 glob 不匹配前导点）：极窄手造面；改则超出设计对 SC-1 的语义，留 runner 面批。
- 评审 1 ∥ 6 号（设计档面）：`docs/core/design/TESTING.md` 的 478 行 ∥ 487 行目标集合自相矛盾（「包根递归」vs「逐行同构 cli 版、无需裁剪」）；另有三处数值漂移（478 行的 64 行 ∥ 474 行的 49 行 ∥ 457 行的核 `:41-45`）——设计档笔，未改。
- 评审 2 号（跨档陈述）：`docs/RELEASE.md` 的 100 行 ∥ 183 行仍写核钩 = `npm test`（设计已登记父侧路由）；另两档 AC 行未被设计登记——`docs/core/design/MODEL-SPECS.md` 的 291 行 ∥ `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` 的 350 行要求核入口全绿，新语义下永不可满足——需求 ∥ 设计档笔，未改。
- 评审 3 号（发布门文案）：`thincoder-cli/scripts/release-check.mjs` 的 3 行 ∥ 92 行 ∥ 93 行用户可见文案仍写「单元 + 集成 + slow 全量」，而它调的 runner 只跑集成层；设计 §10.3 边界明令本批不改该档——另轮处置。

**doc_check（交付门）读数**：本节写入后跑 `doc_check(mode:"gate")` 于本档——首轮命中 10 条（其中 5 条在本节「未修」段：裸档名 + 304 字符长行），本节已修正为工程根可解析路径并拆行；复跑 = `REFUSED（命中 5 条）`，5 条全部落在 §2 ∥ §3（`:111` ∥ `:121` 的裸 `docs/RELEASE.md`、`:156` 的 `docs/...` 前缀不可解析、`:204` 的裸 `docs/core/requirements/TESTING.md`）——非本节笔，父侧路由。

## §6 验证与收口（父代理）

## 验证与收口

**父侧复核（独立复跑，不采信报告）**

| 项 | 命令 | 读数 |
|---|---|---|
| cli 集成层 | `cd thincoder-cli && node test/run.mjs` | **exit 0** · `ℹ tests 15` · `pass 15` · `fail 0` |
| 核空集说明器 | `cd thincoder-core && node test/run.mjs` | **exit 1** · 含 `requirement N20` · 不含 `zero tests = green` |
| 核语法门 | `cd thincoder-core && npm run prepublishOnly` | **exit 0** · `check-syntax: 275 file(s) OK` |
| 改动面 | `git diff --stat` | 4 档（`test.yml` +4/−4 · cli runner 27 · core runner 35 · `package.json` 1）+ 新建 `check-syntax.mjs` |

**批内单测档**：无（本批改 runner 本体，用例即 A-SL1–A-SL9 的一次性读数，已在上表与 §5 逐条记录）。

**集成场景 = 无新增（记明理由）**：改动是测试入口的分层，不改变任何用户可见业务行为；cli 现有 15 例即回归面，收口跑一次全绿。

**收口测试行**：① 本批无单测档（一次性读数见上表）· ② 集成集现量 **15 例 / 窗口 50–100**，本批增删 **0**。

**未完成事项（已入台账，不在此处悬空）**
- `#1770`：`MODEL-SPECS.md:291` ∥ `AGENT-LOOP-ASYNC-POOL.md:350` 的 AC 仍要求核入口全绿（现恒 exit 1，不可满足）；`thincoder-cli/scripts/release-check.mjs:3/92/93` 的用户可见文案仍写「单元 + 集成 + slow 全量」。
- `#1767`：`docs/RELEASE.md:100`/`:183` 仍写核钩 = `npm test`。
- 设计档 `TESTING.md` §11.8「现（行）」列与实测不符（prompts 151/138/345 vs 150/137/342 等）——已由 RTM 批的 §2.4 用实测覆盖并注明。
