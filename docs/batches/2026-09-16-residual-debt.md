# 批 6 · RESIDUAL-DEBT（本波残留债清零）· 2026-09-16

> 前情 = `docs/batches/2026-09-15-{core-defect-fixes,check-tooling-debt,eng-discipline-prompts,cli-async-discard,doc-contract-reconcile}.md`（五批均已收口 2026-09-16；提交 `5b0387b5`）

## §1 需求讨论与裁定（主 agent）

> **批次状态：设计轮待发**（2026-09-16——§1 已落；§2 待 eng-designer）

**交付目标（一句话）**：把本波（批 1–5）收口时**明确登记为「存量 / 对侧 / 机制缺口」的四项残留**一次性清零，使三机检与本产品门禁在**全域**（含 VSC 产品树与 CLI 参照历史树）回到全绿。

### 本批条目（4 条，逐条可验收）

1. **域二 37 条悬空锚**（`thincoder-cli/docs/**` 迁移期参照历史树——引用已删 / 已迁路径；W16 `488c86c9` 删档随动）⇒ 目标：全域 `node scripts/doc-anchors.mjs` **exit 0**（现：仓根 125 档 0 悬空 / CLI 树 99 档 **37 悬空** / VSC 树 99 档 **193 悬空** ⇒ exit 1）。
   **口径候选取舍（设计轮给「方案选型对比」+ 建议，用户裁）**：① 逐档收正（改指现树等价路径）② 逐处加「历史引文」注记（承 N-2 迁移归位形态）③ 机制面新增豁免族（如 N-5「迁移期参照树」整树豁免——**改判据语义 ⇒ 必走设计 + 评审**）。
2. **VSC `T-D9` 红**（`thincoder-vscode/test/async-parity.test.mjs:351`——批 4 的 F4 语义收窄后**对侧钉子断言** `discarded → depInfo = ok` 未同步；实得 `{state:"cancelled"}`；用例标题自标「§5 未决」）⇒ 目标：VSC 该档全绿（对侧测试与核内新语义对齐；核内 = 批 4 `subagent-scheduler.mjs:127`）。
3. **core 侧无慢测层**（核侧 3 用例 **1319.4 / 1545.5 / 1838.6 ms** 超 500ms 归册线而无归册通道：`thincoder-core/package.json` 零 `scripts`、core 树零 `slow*.mjs`、CLI 快层 glob 不扫 core）⇒ 目标：核侧重 IO 用例有归册机制（**建 core 慢层** ∥ **迁 CLI 层**——设计轮给对比 + 建议，用户裁）。
4. **`TUI-COMMANDS.md:87` / `:104` / `:105` 同族枚举漂移**（`/submodel` 4 类 ∥ 实装 5 类含 `eng-designer`；`README.md:134` 同类枚举）+ `README.md:23` 角色枚举（「three roles」）⇒ 目标：现态枚举与实装一致（权威 = `thincoder-cli/src/tui/cmd-submodel.mjs:4` 五槽）。

### 边界（本批不做）

- ① 不改批 1–5 已收口内容（只做上述四项）② 不动 `_merge-backup/`、`_retired-*` 等他批 / 退役树 ③ 不改核内既有语义（本批 = 测层 + 文档面 + 全域锚口径）。
- **参照历史面正文（`thincoder-cli/docs/**`）**：条目 1 的候选 ①②会触该树正文——由设计轮按用户口径裁定后定写域；候选③不触正文。

### 已知事实（供设计省勘察）

- 五批提交 = `5b0387b5`（63 files / +4884 −240）；工作区 clean。
- 三机检现状：宽度 **417 档零超宽** ✅ · 台账 **0 违规** ✅ · 锚 域一 **0 悬空** ✅ / 域二 **37 悬空** ✗。
- VSC 侧 `thincoder-vscode/{src,test}` 本波**零写入**（批 4 红线）；`thincoder-core/` 无 `scripts` 字段（package.json 实测）。
- 相关台账条目：`docs/TODO.md` 技术待办 —— 域二 37 锚 / VSC `T-D9` / VSC 快层 12 例未归册 / core 无慢测层 / `TUI-COMMANDS` 同族枚举（各一条，触发=条件）。
- 对侧测试面参照：批 4 §6「另案」条 + 其 §5 透明度第 5 条。

### 验收口径（初拟——设计轮细化到可机判）

① 全域 `node scripts/doc-anchors.mjs` **exit 0**（域一 + 域二均 0 悬空，或按裁定的豁免口径给出等价判据句）② VSC `run-fast` 该档绿 + `test:full` 对侧红清零 ③ 核侧超阈用例**有归册机制**且快层/全量读数一致 ④ 两档枚举与 `cmd-submodel.mjs` 一致（判据 = grep 计数一致）⑤ 三机检**零新增** + 发布门（`lint → test:full → test:integration`）全绿。

### 用户裁定（2026-09-16 · 按父侧建议——「按建议」）

**裁定 1（条目 1 · 37 悬空锚）= 候选③ 机制加豁免族**

- **限域**：只豁免 `thincoder-cli/docs/**` 参照历史树；**活档域（`docs/**`）一格不放过**。
- **报告面保留（不静默）**：照旧逐条列报（承「符号·宽 = 报告面不入闸」先例），计数可见。
- **到期条件**：该树退役 / 删除时**撤族**（例外必带消解期）。
- **一致性要求**：判据句须与需求档 §1.20 层 **0-2「参照历史面不参与对账」**（批 5 落）对齐——**现状机检与该裁定不一致，本批消除该不一致**。

**裁定 2（条目 3 · core 慢层）= 候选① 建 core 慢层**

- 形态 = `thincoder-core/test/slow.mjs`（`slow()`：快层 skip、全量照跑——与 CLI 同源语义）+ `thincoder-core/package.json` 加 `test` / `test:full` 脚本 + **3 例归册**（实测 1319.4 / 1545.5 / 1838.6 ms）。
- **拦截器必做**（否则建层只是形式）：判据线承 CLI 口径——**归册 500ms / 拦截 800ms**。
- 与「测试与模块同住」不冲突（核侧用例不出核）。

（条目 2 / 条目 4 无需裁：按本节目标与验收口径落。）

### 用户裁定（二 · 2026-09-16 · 设计轮交回的阻断项）

**裁定 3（条目 1 · 族枚举）= 两树**：族 = **两参照历史树**（`thincoder-cli/docs/**` + `thincoder-vscode/docs/**`——与需求档 §1.20 层 0-2 逐字枚举**同集**）；单树读法**作废**（全域 exit 0 在单树下不可达）。**域三（仓根）不入族**——仓根域（即 v5 域一）其 8 条悬空经实核为**假阳性**（`.thincoder` 临时域同名副本扰动 basename 索引），按裁定 4 修判据。

**裁定 4（索引面 · `.thincoder` 排除）= 采纳**：basename 索引排除 `.thincoder/**`（先例 `scripts/doc-anchors-targets.mjs:15` 已含）⇒ 仓根 8 条悬空应清零。此改属**判据修正**（修假阳性）、**不属豁免**。

**裁定 5（CI 覆盖）= 必须**：归册后核侧 3 例在 CI **不得变 skip** ⇒ `.github/workflows/test.yml` 核树步骤补 `THINCODER_TEST_FULL=1`（或等价 full 步骤）——**归册不以丢失 CI 覆盖为代价**。

**连带收正（机械面）**：`scripts/doc-anchors-v5.mjs:6` 判据位指针改指 `docs/core/design/DOC-DISCIPLINE.md` §4.2。

**裁定 6（B1 判据括注 · 设计轮 #9）= 采纳建议**：B1 判据 1 括注「两树 37 / 193」收正为「**默认调用 = CLI 腿 37；193 属 `--engine v5` 强扫读数**」（默认调用下该域走 VSC 引擎 = 报告态）——随设计轮下一笔或实施轮登记落地。

**备注**：VSC 域 193 条悬空由此进本批射程（原 §1 只记 CLU 37——**射程以三域实读为准**）；V3「§3 缺轮次行」红 = 设计评审未发起之预期态，评审落 §3 即清。

### 用户裁定（三 · 2026-09-16）= **文档不受 300/500 行限制**

**用户原话**：「300 行 500 行那是对程序代码的限制，现在你们怎么对文档也搞起这种限制了？」（2026-09-16 16:59）

**裁定**：`≤300 软线 / ≤500 硬限` **只约束程序代码（源 / 测试档）**，**不约束文档**（设计 / 需求 / 批次 / 台账）。
⇒ **评审 #3 发现 #2（🔴 `DOC-DISCIPLINE.md` 510 行 ⇒ 本批拆）撤下**：本档**保持原样、不拆**（510 行合法）；已生成的 `DOC-RULES.md`（200 行，拆出段副本）**已由父侧删除**（原档未减 1 行 ⇒ **零损失还原** ✓）。
**连带（另批处理，不入本批）**：`docs/core/requirements/ENGINEERING-MODE-MECHANISM.md:292`（F12「结构档位硬限无豁免…超限档本批拆」）与各档「体量与拆分规划（R24a）」段中的**文档体量**判据，均按本裁定收正。
**标记**：本条 = **父侧直接记录用户裁定**（非代笔设计内容）。

## §2 批次任务（eng-designer）

**任务书一句话**：清零批 1–5 登记的四项残留——全域文档锚 `exit 0`（参照历史面族口径）· VSC 对侧陈旧钉 · 核树慢测层 · 同族枚举漂移。

**条目与三方一致面**：B1–B4 = §1 条目 1–4 逐条对位。设计面 = `docs/core/design/DOC-DISCIPLINE.md` §4.2.8（+ 验收 §5 A-DD11）与 `docs/core/design/TESTING.md` §1.2（核面入口）。需求回指见各条。

| 条 | 承接（§1） | 落点（设计与实现） | 需求回指 |
|---|---|---|---|
| **B1** | 条目 1（域二 37 悬空锚） | 判据规格 `docs/core/design/DOC-DISCIPLINE.md` §4.2.8；实现 `scripts/doc-anchors-v5.mjs`（族判定 + 索引面 `.thincoder` 排除）+ `scripts/doc-anchors.mjs`（汇总行） | `docs/core/requirements/ENGINEERING-MODE-MECHANISM.md` §1.20 层 0-2（`:312-319`）· F4（`:326`） |
| **B2** | 条目 2（VSC `T-D9` 陈旧钉） | `thincoder-vscode/test/async-parity.test.mjs:351` | 权威实装 = `thincoder-core/agent-tools/subagent-scheduler.mjs:127`；需求档落点承批 4 的 F4 语义收窄，坐标本轮**未复读**（引用 §1:15，标 unverified）——由主 agent 复核 |
| **B3** | 条目 3（core 无慢测层） | 新档 `thincoder-core/test/{slow,slow-gate,run-fast,run-full}.mjs` + `thincoder-core/package.json` 脚本；3 例归册 | `docs/core/requirements/TESTING.md` §3 N1（`:52`）· N3（`:54`）· N4（`:55`）· N5（`:56`） |
| **B4** | 条目 4（同族枚举漂移） | `docs/cli/design/TUI-COMMANDS.md:104-105` · `thincoder-cli/README.md:23` · `:97` · `:134` · `:199-200`（`:97` / `:199-200` = 评审轮 1 #1 补入——同族枚举行补面） | §1 条目 4（需求档**无**对应条目——枚举漂移属对账面；如需登记由主 agent 定） |

#### B1 判据（可机判）

1. `cd thincoder && node scripts/doc-anchors.mjs` ⇒ **exit 0**；输出含族豁免计数行——**复核两腿**（裁定 6）：① 默认腿 = CLI 域 37（`thincoder-vscode` 域缺省走 VSC 引擎——该域命中 0 · 报告态）② 强扫腿 `--engine v5` = 37 + 193。两读数 as-of，允许随清账下降。
2. **活档域零豁免反证**（夹具）：活档域注入悬空坐标 ⇒ 照报 + `exit 1`。
3. 族内命中**逐条列报在场**（不静默）：清单行数与本条汇总计数行一致。
4. 基线档仍为空（族内命中不入基线）；V1–V4 / 宽度 / 台账域零改——**可跑判据**（评审轮 1 #9）：① `node scripts/check-doc-width.mjs` ⇒ 新增违规 0 ② `node scripts/check-ledger.mjs` ⇒ `exit 0` ③ `node scripts/doc-anchors.mjs` ⇒ **exit 0**（= B1-1）——三行 = CI docs 作业（`.github/workflows/test.yml:47-57`）。

#### B2 判据

1. `thincoder-vscode`：`npm run test:full` 该档绿（`async-parity.test.mjs` 全绿）。
2. 断言现态 = 权威实装态（`:351` 断言的 `state` 值 = `subagent-scheduler.mjs:127` 现态）。

#### B3 判据

1. `cd thincoder-core && npm test` ⇒ exit 0（快层：3 例可见 skip、零超阈拦截）；`npm run test:full` ⇒ exit 0（3 例执行通过）。
2. 阈值口径 = 归册 500ms / 拦截 800ms（env `THINCODER_SLOW_GATE_MS` 可覆盖）；快层并发 6（`--test-concurrency=6`）。
3. 归册对象 = 快层慢门**实跑点名**（不预判）；as-of 点名 3 例（实测 1319.4 / 1545.5 / 1838.6 ms）。点名数与 3 不等 ⇒ 如实登记差异，不回填。
4. **CI 覆盖不降**：`.github/workflows/test.yml:46`（核作业裸 `node --test`）改跑全量层——否则 3 例在 CI 变 skip = 覆盖下降。

#### B4 判据

1. 两档枚举与 `thincoder-cli/src/tui/cmd-submodel.mjs:4`（`SUBMODEL_SLOTS`）一致——判据 = 角色名全集逐字 + 槽位数 = 类型数 + 1（全局）。
   **可跑①**：`grep -n "eng-designer" thincoder-cli/README.md` ⇒ `:23` / `:97` / `:134` / `:199-200` 四处行组在场（收正后）。
   **可跑②**：`docs/cli/design/TUI-COMMANDS.md:104-105` 现态「4 种子 agent 类型」/「全局 + 4 类型共 5 个槽位」⇒ 收正为「5 种子 agent 类型」/「全局 + 5 类型共 6 个槽位」。
2. `thincoder-cli/README.md:233`（0.12.11 changelog 行）= **射程外保留**（历史记录不改）⇒ 验收 grep **须限域**，不得以全档 grep 计数为判据。

#### 受影响文件（当前行数 as-of 2026-09-16 + 预计增量——R24a）

| 文件 | 现 | 预计增量 |
|---|---|---|
| `docs/core/design/DOC-DISCIPLINE.md` | 515（`read` 报 516） | +52 ✅ 已落（§4.2.8 + 指针 / 验收 / 用例 / 决策 / 边界 / 读数行 + 裁定同步轮）+4 ✅（评审修正轮——#4 / #6 / #7 / #8 / #10）+1 ✅（宽度收正——§4.2.7 读数行拆分） |
| `docs/core/design/TESTING.md` | 294（`read` 报 295） | +16 ✅ 已落（§1.2 核树面 + 首部权威源行 + §5 TS-8 / TS-9（TS-9 CI 口径）· §7 A-TS12 · §8 边界行 · §10 行数收正）+1 ✅（评审修正轮——变更记录行 · #5） |
| `thincoder-cli/test/doc-anchors.test.mjs` | 348（`read` 报 349——越 300 软线） | +≈20 行（B1 判据 2 活档域反证夹具 + DD-19 / DD-20 用例——评审轮 1 #3）；拆分评估：本批后 ≈370（< 500）——后续增厚前先拆（先行候选 = 夹具 / 子进程族独立成档） |
| `docs/cli/design/TUI-COMMANDS.md` | 162 | ~2 行 |
| `thincoder-cli/README.md` | 471（`read` 报 472） | ~4 行（`:23` / `:97` / `:134` / `:199-200` 同族枚举行逐行收正——行内改、净增 ≈0；`:97` / `:199-200` 系评审轮 1 #1 补入） |
| `scripts/doc-anchors-v5.mjs` | 255 | +≈15（族判定 + 索引面 `.thincoder` 排除 + 判据位指针改指 `docs/core/design/DOC-DISCIPLINE.md` §4.2（`:6`）——§1:61 连带收正） |
| `scripts/doc-anchors.mjs` | 90 | +≈5（族豁免计数行） |
| `thincoder-core/package.json` | 28（`read` 报 29） | +3 行（`test` / `test:full` scripts） |
| `thincoder-core/test/session-slot-write.test.mjs` | 179（`read` 报 180——< 300，安全） | +≈8 行（3 例 `slow(` 归册） |
| `thincoder-core/test/{slow,slow-gate,run-fast,run-full}.mjs` | 新档 | ≈128 行（镜像 CLI 一面、语义同源） |
| `thincoder-vscode/test/async-parity.test.mjs` | 455（`read` 报 456——越 300 软线、距 500 硬限 ≈45 行） | +≈4 行（`:351` 断言收正 + `:336` / `:337-340` / `:349` 注记同步——旧语义「核语义现状 / 差异面 / 待裁」随收正同改——评审轮 1 #3）；拆分评估：本批后 ≈459（距硬限 ≈41 行）——后续增厚前须先拆（切面按用例族定） |
| `.github/workflows/test.yml` | 57（`read` 报 58） | 1 行（核作业入口） |

> 「现」列 = `wc -l` 实读（as-of 2026-09-16——评审轮 1 #3 补；`read` 计数详注各行）。标 ✅ 已落者 = 增量已含于「现」；余者终值 = 现 + 增量。越 300 软线的**代码档**附拆分评估（`doc-anchors.test.mjs` / `async-parity.test.mjs`）；文档档不受 300/500 限（§1 裁定三）。

#### 明确不做（本批）

- 不改批 1–5 已收口内容；不动 `_merge-backup/` / `_retired-*` / `_archive/` / 他批域 / 退役树。
- **不写参照历史面正文**（`thincoder-cli/docs/**` · `thincoder-vscode/docs/**`）——族 = 判定面豁免，非写权变更。
- 不改核内既有语义；VSC 侧仅 1 行测试断言（`src/**` 零写入）。
- 不做「条目 5（11 处 engine 路径改临时域）」——§1 四条条目中无此项（无依据不落地；如确需请另派）。

#### 发现表（发现即报告——处置权归主 agent；2026-09-16 裁定后逐条标注处置）

| # | 发现 | 证据 | 建议处置 |
|---|---|---|---|
| 1 | 域集 = **3 域**（§1 只计 2 域）；`thincoder-vscode` 域 99 档 / **193 悬空**未入账；裁定 1 的限域句只写单树 ⇒ 按单树读则**全域 exit 0 不可达** | §1:13 / :34 / :40 ｜实测三域读数（本批复跑） | 族按 §1.20 层 0-2 **两树**（推荐，理由 = 裁定自身「与 0-2 对齐」义务 + A-DD11 可达性）；**已裁（2026-09-16 · 裁定 3）= 两树**；单树读法作废（设计档已定稿——§4.2.8 判据面登记 ② · A-DD11） |
| 2 | **判据假阳通道**：V5 basename 索引未排除 `.thincoder` ⇒ 临时域同名副本使**判据翻转**（仓根域 8 条悬空全由此因，basename 三对双份） | `scripts/doc-anchors-v5.mjs:48` · `:52` · `:113-116`；对照 `scripts/doc-anchors-targets.mjs:15`（**已含** `.thincoder`） | **已裁（2026-09-16 · 裁定 4）= 采纳**——索引面补 `.thincoder`（两引擎口径统一）；定性 = **判据修正**（修假阳）、非豁免；实装落 `scripts/doc-anchors-v5.mjs`（索引面） |
| 3 | 活档工具档内**改指漂移**：`scripts/doc-anchors-v5.mjs:6` 指 `thincoder-cli/docs/design/ENGINEERING-MODE.md` §2.32.3（参照历史面），而判据现居 `docs/core/design/DOC-DISCIPLINE.md` §4 | `scripts/doc-anchors-v5.mjs:6` · `docs/core/design/DOC-DISCIPLINE.md:199-200` | 机械改指至 `docs/core/design/DOC-DISCIPLINE.md` §4.2（工程工具面机械改；`scripts/**` 不属族遮蔽面）；**已裁（§1:61 连带收正）= 登记入 §2 受影响文件表，实装轮改（本轮不碰脚本）** |
| 4 | 任务书坐标漂移：`:87` 实为「命令分两类」行、**无枚举**（漂移行 = `:104` / `:105`）；`:23` 实指 `thincoder-cli/README.md`（仓根 README 无角色枚举） | `docs/cli/design/TUI-COMMANDS.md:87` · `:104-105` · `thincoder-cli/README.md:23` · `:134` | **已收正**（本节与设计档——as-of 2026-09-16）；实装轮按此落（B4） |
| 5 | §1 内部张力：`:28`「VSC `{src,test}` 本波零写入」∥ `:15` 条目 2 + `:34` ② 要求 VSC 该档绿 | §1:15 / :28 / :34 | **已定（用户裁定 §1:51）**：按条目 2 落（「条目 2 无需裁：按本节目标与验收口径落」）；VSC 侧仅 1 行测试断言 |
| 6 | 核树 CI 以**裸 `node --test`** 调用 ⇒ 归册后 3 例在 CI 变 skip = CI 覆盖下降 | `.github/workflows/test.yml:37-46` | **已裁（2026-09-16 · 裁定 5）= 采纳**：B3-④（核作业改跑全量层——覆盖不降）；验收已入 `docs/core/design/TESTING.md` §7 A-TS12 · §1.2 核树面 |
| 7 | 存量红（非本批引入）：VSC 陈旧钉现态 = 测试红 | `thincoder-vscode/test/async-parity.test.mjs:351` ∥ `thincoder-core/agent-tools/subagent-scheduler.mjs:127` | **已定**：B2 批内收正（存量红——非本批引入） |
| 8 | 批档机制残留：本节上方占位行「_（待写）_」无法由 `batch_segment` 删除（追加语义） | 本档 §2 | **已清（2026-09-16 · 裁定 4 ②）**——占位行已删 |
| 9 | B1 判据 1 括注「两树 37 / 193」在**默认调用**下不同现——`thincoder-vscode` 域走 VSC 引擎（V5 不扫该域）；193 仅 `--engine v5` 强扫口径出现；默认调用族豁免计数行 = CLI 腿（37） | B1-1（本档 §2）｜默认 / 强扫两跑实测（本批复跑） | **已裁（2026-09-16 · 裁定 6）**：B1 判据 1 按两腿收正（默认 = CLI 37；193 属 `--engine v5` 强扫读数）——落点 = 本档 B1-1 + `docs/core/design/DOC-DISCIPLINE.md` §4.2.7 / §4.2.8 / A-DD11 |

**评审轮 1 发现 #2 处置（2026-09-16 · 用户裁定）**：**撤下**——文档档不受 300/500 行硬限（射程 = 代码档，见编码约定「File size」条）；文档体量以各档「体量与拆分规划」节为准。

**验收口径对位（§1:34 ①–⑤）**：① ⇒ B1 判据 1/2/3 · ② ⇒ B2（含 B2-1 绿） · ③ ⇒ B3 · ④ ⇒ B4 · ⑤ ⇒ 三机检零新增 + 发布门（`lint` → `test:full` → `test:integration`——CI docs 作业三行 = `check-ledger` / `check-doc-width` / `doc-anchors` 为其中成员，口径见 B1 判据 4）全绿（核作业入口变更见 B3 判据 4）。

**实施纪律**：B1 落地前先跑一次现态读数（防测错对象）；B2/B4 为文本同步（纯改指 / 枚举对位）；B3 归册对象以实跑点名收口，点名 ≠ 3 时如实登记。

## §3 设计评审（评审子代理）

_（待写）_

### 轮次 1（评审子代理）

**评审对象**：批 6 RESIDUAL-DEBT 设计面（全量）——目标状态＝待评审 · 触发＝user-initiated（排除项：批 1–5 已收口内容 · `5b0387b5`）
**证据说明**：四份在册文档全文已读；另作少量**坐标核读**（均 `read`/`grep` 实读并标注 file:line）：`thincoder-cli/src/tui/cmd-submodel.mjs:4` · `thincoder-cli/README.md:23/:97/:134/:199-200/:233` · `thincoder/docs/cli/design/TUI-COMMANDS.md:86-108` · `thincoder-vscode/test/async-parity.test.mjs:338-352` · `thincoder-core/agent-tools/subagent-scheduler.mjs:112-131` · `scripts/doc-anchors-v5.mjs`（全文）· `scripts/doc-anchors.mjs`（全文）· `scripts/doc-anchors-targets.mjs:15` · `scripts/check-doc-width-core.mjs:14-49` · `scripts/doc-anchors-core.mjs:48` · `.github/workflows/test.yml:36-46` · `thincoder-core/package.json`（全文）· 若干档行数（`read` 口径）。

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Requirements / Scope | 🔴 | **B4 写域漏同族现态枚举行 `thincoder-cli/README.md:97`**——该行仍是 `/submodel` 四类枚举（`picker over global + explore/plan/coder/eng-coder slots`），缺 `eng-designer`；权威 `thincoder-cli/src/tui/cmd-submodel.mjs:4`（`SUBMODEL_SLOTS` = explore / plan / coder / eng-coder / eng-designer 五槽）已验。该行正是批 5 登记的 S5 面（`docs/core/design/DOC-CODE-RECONCILE.md:276`「`README:97` … 4 类 ∥ 实装 5 类 … 待主 agent 裁」）与台账条目指针所指（`docs/TODO.md:45`「设计 §5.1.5 S5 只登记 `README:97` 一处」），而 B4 落点只列 `:23` / `:134`（`docs/batches/2026-09-16-residual-debt.md:78`）、受影响文件表 README 行只记「~2 行」（`:111`）⇒ 落地后 B4 判据 1「两档枚举与 `cmd-submodel.mjs` 一致」（`:101`）仍不成立。同族另有 `README.md:199-200`（prompts 面枚举 `persona-{eng-coder,explore,coder,plan}`，缺 `persona-eng-designer`——该档于 `thincoder-core/prompts/` 实存） | 把 `:97`（及 `:199-200`）纳入 B4 写域并在受影响文件表逐行登记；若有意不收正，须写出显式排除判据句（含理由）并说明 S5 何以仍留账；判据 1 补可跑形态（grep 命令 + 限域 + 命中行表），使「取齐」可机判 |
| 2 | Structure size（验收面） | 🔴 | **`docs/core/design/DOC-DISCIPLINE.md` 实测 511 行（`wc -l` = 510，末行空行）已越 >500 硬限**，且本批自身 +52 为越线笔；但 `:489` 记「本档超 300 软线、**硬限 500 未触**」、`:490` 记「本批增厚越 300 软线 —— **本批不拆、只登记；执行时点 = 下一批**」。硬限无豁免通道：`docs/core/requirements/ENGINEERING-MODE-MECHANISM.md:292`（F12「>500 行硬限**无豁免通道**；超限档**本批拆**」）；同档 `:461`「**拆分面（触发即执行）**：超 500 硬限时按「机制族」切成两档」证明该档位约束同样作用于文档档（该档自身 478 行按此记账） | 本批执行已登记的拆分面（`:491` 候选切面 ①§1–§3 / ②§4 · `:492` 指针改写义务 · `:493` 执行判据），并同步收正 `:489` 的越线读数句（不得留「未触」的假陈述）；若判为不拆，须给出硬限豁免依据（F12 明示无此通道） |
| 3 | Affected-file annotations | 🟡 | 受影响文件表（`:104-120`）**未列本批必然改动的测试档 `thincoder-cli/test/doc-anchors.test.mjs`**（`read` 报 349 行 ⇒ 已越 300 主动拆线；B1 判据 2 的活档域反证夹具与 DD-19 / DD-20 用例须落于此）⇒ 该档行数 / 增量零标注、越线档无拆分评估。另三档「现」列未复读（`:120`）中，`thincoder-vscode/test/async-parity.test.mjs`（`read` 报 456 行 ⇒ 亦越 300 线，距 500 硬限仅约 45 行）与 `thincoder-core/test/session-slot-write.test.mjs`（`read` 报 180 行）的规模判定无法据表完成——`:120`「规模判定不依赖该列」对前者不成立。B2 增量「1 行」低于实际：`:349-350` / `:338-341` 注记仍载「核语义现状 / 差异面 / 待裁」旧语义，随断言收正须同改 | 补 `thincoder-cli/test/doc-anchors.test.mjs` 一行（现 348 · 增量）并对越线档给拆分评估；补三档实读行数（或逐档写明规模判定依据）；B2 增量按「断言 + 相关注记行」记 |
| 4 | Acceptance verifiability | 🟡 | 裁定 6（`:63`）已定「默认调用 = CLI 腿 37；193 属 `--engine v5` 强扫读数」，但该口径只落到设计档 `DOC-DISCIPLINE.md:304`；§2 B1 判据 1（`:82`）仍写「输出含族豁免计数行（as-of 两树 37 / 193）」、§2 发现表第 9 行仍标「**待裁**」（`:141`）、`DOC-DISCIPLINE.md:421`（A-DD11）与 `:320-326`（族后读数表）未带调用口径 ⇒ 默认调用下 A-DD11 的「两产品域命中列报且不入闸（计数行在场）」不可复核（该域缺省走 VSC 引擎 = 命中 0 · 报告态；193 只在 `--engine v5` 强扫出现） | 三处（B1 判据 1 / 发现表第 9 行 / A-DD11 + §4.2.8 读数表）按裁定 6 口径同步收正，并写明「两树列报」的复核两腿各判什么（默认腿 = CLI 37；强扫腿 = 37 + 193） |
| 5 | Doc-state | 🟡 | 核树面在设计档与批次档之间状态不一致：`docs/core/design/TESTING.md:7` 把 `thincoder-core/test/{slow,slow-gate,run-fast,run-full}.mjs` + `package.json` scripts 列为「权威源（实现）… **2026-09-16 落地**」、`:61` 标题「核树面**落地**（批 6 · 2026-09-16）」，而批次档 §2 把同批文件列为**新档**（`:116`「新档 ≈128 行」）。实读：`thincoder-core/test/` 无 `slow*.mjs` / `run-*.mjs`（33 档全为 `*.test.mjs`）、`thincoder-core/package.json`（28 行）**无 `scripts` 键** | 把 `TESTING.md:7` / `:61` 的「落地」改为「设计态 / 待落（本批实施后置为完成态）」，与 §2 新档表述同口径 |
| 6 | Document ownership | 🟡 | 同批三域读数在两处并列：`DOC-DISCIPLINE.md:303-304`（§4.2.7 批 6 复跑读数：125/99/99 档 · 8/37/193 悬空）与 `:320-326`（§4.2.8 族后读数表：同三域同数字）——同一读数两个落点，与 D2「一条机制只在一处详述，其余处只引用不重述」（`DOC-DISCIPLINE.md:16`）不符，且须手工保持同步 | 择一为读数权威处（建议 §4.2.7），另一处改引用（「读数见 §4.2.7」+ 只留族后差异列），删重复数字 |
| 7 | Doc hygiene | 🔵 | `DOC-DISCIPLINE.md:436`（A-DD9 ④）仍载批 2 存量读数「存量悬空 49 条——核面 12 + 旧迁移前树 37」，与 §4.2.7 批 6 三域读数（仓根 8 / CLI 37 / VSC 193；索引面收正后仓根预期 0）不同量 | 该处标 as-of 批 2 轮次或按现读数收正（读数漂移类，不阻断） |
| 8 | Clarity / Feasibility | 🔵 | §4.2.8 生效面行（`:311`）只写「判定输入 = **档路径**（被扫档路径命中族成员前缀 ⇒ 入报告集）」，未定路径**基准根**：V5 引擎按域驱动（`scripts/doc-anchors-v5.mjs:188-193` 定 `scanRoot`、`:205` 用 `relative(scanRoot, f)`；CLI 域 `scanRoot` = `thincoder-cli`，域内相对路径为 `docs/design/...`）⇒ 若按域根相对实现，族前缀 `thincoder-cli/docs/**` 永不命中（族失效 ⇒ B1 判据 1 直接 exit 1） | 在生效面行写明基准 = **仓根相对**（给判据句与形态示例），实现按 `resolve(root)` 侧计算；DD-19 夹具已钉语义，可在用例注记中一并钉基准 |
| 9 | Acceptance verifiability | 🔵 | 验收口径 ⑤ 的「三机检零新增」只有宽度给了可跑判据（`:85` `node scripts/check-doc-width.mjs` 新增 0），台账机检（`scripts/check-ledger.mjs`）与 V1–V4 域只写「零改」；发布门（`lint → test:full → test:integration`）亦只由 `:143` 一句对位，无逐项判据 | 补一列可跑判据（`check-ledger.mjs` exit 0 · CI docs 作业 `node scripts/doc-anchors.mjs` exit 0 · 发布门三步），使 ⑤ 可机判 |
| 10 | Requirements alignment | 🔵 | 需求档 §1.20 层 0-2 除「不参与对账」外还载「命中即登记『重锚至新树落点』**后结案**」与「在账证据数按**重锚后**计数」（`ENGINEERING-MODE-MECHANISM.md:316-317`），设计 §4.2.8 只落「不入违规集 / 不入基线 / 逐条列报」（`:314-315`、`:318`）——同一处置面两档读法未对齐（是否仍负逐条重锚登记义务未明） | 在 §4.2.8 加一句：族内命中是否仍需逐条重锚登记，或明示该义务由层 0 流程承担、机检面不判——避免两档对同一处置给出不同读法 |

**计数：🔴 2 · 🟡 4 · 🔵 4（共 10 条）** —— 🔴 = #1（B4 写域漏 `README.md:97`，与 S5 / 台账指针同址）· #2（`DOC-DISCIPLINE.md` 510 行越 >500 硬限，且 `:489` 记「未触」、`:490` 记「下一批拆」）。

VERDICT: changes-required

### 轮次 2（评审子代理）

**评审对象**：批 6 RESIDUAL-DEBT 设计面 · 轮 2——只验轮 1（§3 轮次 1）十项发现的修正声明（逐条对号 → 落点实读）；新问题按明显缺陷级收录。
**结论：十项修正声明 10/10 成立；新发现 3 条（🟡 1 · 🔵 2——均不阻断）。**
**证据说明**：三份在册文档全文已读（本批档 · `docs/core/design/DOC-DISCIPLINE.md` · `docs/core/design/TESTING.md`）；修正落点坐标核读（均实读并标 file:line）：`thincoder-cli/README.md`（`:23` / `:97` / `:134` / `:199-200` / `:233` ＋尾计数）· `thincoder-cli/src/tui/cmd-submodel.mjs:4` · `docs/cli/design/TUI-COMMANDS.md:104-105`（＋尾计数）· `thincoder-vscode/test/async-parity.test.mjs:336-353`（＋尾计数）· `thincoder-core/agent-tools/subagent-scheduler.mjs:112-131` · `thincoder-core/package.json`（全文）· `thincoder-core/test/session-slot-write.test.mjs:172-180` · `thincoder-cli/test/doc-anchors.test.mjs:338-349` · `scripts/doc-anchors.mjs`（全文）· `scripts/doc-anchors-v5.mjs:1-10 / :44-56 / :108-117 / :245-256` · `scripts/doc-anchors-core.mjs:6` · `scripts/doc-anchors-targets.mjs:15` · `.github/workflows/test.yml`（全文）· `docs/core/requirements/ENGINEERING-MODE-MECHANISM.md:305-332` · `docs/core/design/DOC-CODE-RECONCILE.md:1-45`；受影响文件表全 11 行「现」列逐行复读（read 计数全命中）。

**修正核验台账（逐条对号 → 落点实读）**

| # | 修正声明（轮 1 发现） | 落点实读（证据 file:line） | 结论 |
|---|---|---|---|
| 1 | B4 写域补全（`README:97`/`:199-200` 入域 ＋ 可跑判据） | 本批档 `:87`（B4 落点含 `:97` · `:199-200`，注「评审轮 1 #1 补入」）· `:111`（可跑①：grep `eng-designer` ⇒ 四处行组在场）· `:123`（README 行同记）；实读 `thincoder-cli/README.md:97`（`/submodel` 全局 ＋ explore/plan/coder/eng-coder——4 槽）· `:199-200`（`persona-{eng-coder,explore,coder,plan}` 缺 `persona-eng-designer`）· `:23`（three roles）· `:134` · `:233`（0.12.11 changelog——射程外保留句见本批档 `:113`）；权威 `thincoder-cli/src/tui/cmd-submodel.mjs:4`（五槽）✓；全档 grep `eng-designer` 现 = 0 命中（= 收正前态，与「收正后四处行组」判据自洽） | ✓ 成立 |
| 2 | 拆分项撤下（用户裁定：文档不受行数限制） | 本批档 `:67-74`（裁定三：射程 ＝ 程序代码、原文在档）· `:155`（处置 ＝ 撤下）· `:132`（脚注「文档档不受 300/500 限（§1 裁定三）」）；`DOC-RULES.md` 仓内零匹配（glob）＋ `docs/` grep 仅批次档历史行（射程外）⇒ 已删 ✓；`DOC-DISCIPLINE.md` §7 保持原样、不拆（现 515 / read 516——本批档 `:119` 同记）✓；连带（R24a 文档体量判据收正）显式另批（`:73`）✓ | ✓ 成立 |
| 3 | 受影响文件表补测档 ＋ 实读行数 | 本批档 `:121`（补 `thincoder-cli/test/doc-anchors.test.mjs` 行：348 / read 349 · ＋≈20 · 拆分评估）· `:129`（async-parity：455 / read 456 · ＋≈4 · 注记坐标 `:336` / `:337-340` / `:349`——实读命中）· `:127`（session-slot：179 / read 180）；全 11 行「现」列复读命中：DOC-DISCIPLINE 515/516 · TESTING 294/295 · doc-anchors.test.mjs 348/349 · TUI-COMMANDS 162/163 · README 471/472 · doc-anchors-v5 255/256 · doc-anchors 90/91 · core/package.json 28/29 · session-slot-write 179/180 · async-parity 455/456 · test.yml 57/58 | ✓ 成立（另一处微残见新发现 3） |
| 4 | 裁定 6 两腿口径三处同步 | 本批档 B1-1 `:91`（默认腿 CLI 37 / 强扫腿 37＋193）· 发现表第 9 行 `:153`（已裁）· `DOC-DISCIPLINE.md:425`（A-DD11 复核两腿）· `:303-305`（§4.2.7 口径注：VSC 域缺省走 VSC 引擎 ＝ 命中 0 · 报告态；193 属强扫——case/path/symbol 分档同处）· `:321-323`（§4.2.8 读数表归 §4.2.7）；引擎分派实读 `scripts/doc-anchors.mjs:67`（`basename === "thincoder-vscode" ? "vsc" : "v5"`）＝ 与两腿口径自洽 | ✓ 成立 |
| 5 | 核树面设计态措辞 | `docs/core/design/TESTING.md:7`（首部多实现面行 ＝ 设计态 / 待落 · 本批实施后置为完成态）· `:61`（§1.2 核树面块头同口径）· 变更记录 `:294`（#5 记录行） | ✓ 成立（残留见新发现 2） |
| 6 | 读数去重 | `DOC-DISCIPLINE.md:321-323`（§4.2.8 读数表：引句「数字与调用两腿口径 ＝ 权威处 §4.2.7（D2——本条不重述）」＋ 表只留族后差异列）· 数字单源 `:303-305` | ✓ 成立 |
| 7 | as-of 标注 | `DOC-DISCIPLINE.md:440`（A-DD9 ④：存量 49 条标 **as-of 批 2** ＋「现读数见 §4.2.7」＋射程外声明） | ✓ 成立 |
| 8 | 基准根写明 | `DOC-DISCIPLINE.md:313`（生效面：基准根 ＝ **仓根相对** ＋ 形态示例 ＋「实现按 `resolve(root)` 侧计算」）· `:475`（DD-19 夹具钉基准） | ✓ 成立 |
| 9 | 验收⑤可跑判据 | 本批档 `:94`（B1 判据 4：① check-doc-width 新增违规 0 ② check-ledger exit 0 ③ doc-anchors exit 0——含 #9 标注）；实读 `.github/workflows/test.yml:47-57`（docs 作业；三行 ＝ `:55` / `:56` / `:57`）· `:46`（核作业裸 `node --test`——B3-④ 引用坐标命中）· 本批档 `:157`（⑤ 对位行含发布门三步） | ✓ 成立 |
| 10 | 重锚义务句 | `DOC-DISCIPLINE.md:345`（§4.2.8 判据面登记 ③：族内命中仍按层 0-2 登记重锚后结案——义务归层 0 流程、机检面不判；两档读法统一句）；与需求档 `docs/core/requirements/ENGINEERING-MODE-MECHANISM.md:316-317`（层 0-2 原文 ＋ 判定句）对位一致 | ✓ 成立 |

**新发现（3 条——轮 2 收录）**

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | 修正覆盖 / 写域登记 | 🟡 | §1:61「连带收正（机械面）」＋ §2 受影响文件表只登记 `scripts/doc-anchors-v5.mjs:6` 一处「判据位指针改指」；同类活档工具档指针实读另有 3 处未入登记面：`scripts/doc-anchors.mjs:8`（同文指针——指 `thincoder-cli/docs/design/ENGINEERING-MODE.md` §2.32.3）· `scripts/doc-anchors.mjs:10` 与 `scripts/doc-anchors-core.mjs:6`（指 `thincoder-vscode/docs/design/DOC-CODE-RECONCILE.md` §4——而现役 `docs/core/design/DOC-CODE-RECONCILE.md:6` 已明写「两引擎以 `docs/core/design/DOC-DISCIPLINE.md` §4 为判据权威」）；`doc-anchors-core.mjs` 亦不在受影响文件表（零标注）。1/4 覆盖 ⇒ 实施后同族漂移仍余 3 处 | 同族 4 处指针一并纳入机械改指清单（受影响文件表相应行同步；`doc-anchors-core.mjs` 补一行），统一改指现役权威（`docs/core/design/DOC-DISCIPLINE.md` §4 / 现役 RECONCILE §3）；或写明仅 :6 入域的排除依据（如 VSC 面判据权威另有归属——给判据句）。可加可跑判据：活档工具档「判据位指针零指参照历史面」 |
| 2 | Doc hygiene（#5 落地残留） | 🔵 | `docs/core/design/TESTING.md:266`（§8 边界行）行内引称「§1.2『核树面落地』」为改名前旧称——§1.2 现题已为「核树面（批 6 设计 · 2026-09-16——设计态 / 待落 · 本批实施后置为完成态）」 | 引称按现题收正（或只留「§1.2」不带引名） |
| 3 | Doc hygiene（#3 计数核对） | 🔵 | `docs/core/design/TESTING.md:283`（§10）自档读数「293 行（`wc -l`；`read` 报 294）」低于实读：现 ＝ 294 / read 295（本批复读）；同批两档对同一档两个读数（本批档 `:120` 按 294/295 记） | §10 行数行按现读数收正（或将 as-of 限定为 ＋1 行前） |

**计数：修正核验 10/10 成立 · 新发现 🔴 0 · 🟡 1 · 🔵 2（共 3 条）**

VERDICT: pass

## §4 用户批准（主 agent）

_（待写）_

## §5 实施记录（eng-coder）

_（待写）_

**实施面**（批 6 RESIDUAL-DEBT · 四披露 B1–B4 · 2026-09-16 · 作者 = eng-coder）
**基线**：起点提交 `5b0387b5`（63 文件 / +4884 −240）；本批不动批 1–5 面、不动 `_merge-backup` / `_retired`、不改核内语义。

### B1 活档域反证 + 判据位指针改指权威
- 落地：`thincoder-cli/test/doc-anchors.test.mjs`（两用例：族豁免逐条列报 + 汇总「族豁免：N 条」；`ref` 对齐现役权威）· `scripts/doc-anchors.mjs:8` / `:10` · `scripts/doc-anchors-v5.mjs:6` · `scripts/doc-anchors-core.mjs:6`（四处判据位指针统一改指现役权威 `docs/core/design/DOC-DISCIPLINE.md` §4 / 现役 RECONCILE §3，接 §3 轮 2 新发现 #1）。
- 终态实读（本轮末次跑 `node scripts/doc-anchors.mjs`，默认调用）：**仓根/CLI 域腿** = 「OK(V5): 0 条悬空锚（闸态——阈值 0）✓」＋「V5 汇总：候选 8891 · 悬空 0 · 注记豁免 881」＋**「族豁免：36 条（参照历史面——列报 · 不入闸，两态一致）」**（B1 族机制生效：逐条列报如 `docs/design/AGENT-LOOP.md:25 thincoder-vscode/src/provider.mjs（路径/坐标·族豁免——参照历史面，列报 · 不入闸）`）；**VSC 域腿** = 「FAIL(V5): 3 条悬空锚（闸态——阈值 0）」（悬挂项全在「路径/坐标（V5-A）」类）⇒ 该腿 exit≠0。
- 归属：该 3 条悬空锚**未做 base 对照**（`5b0387b5` 对照本轮未跑）⇒ 归属未定，如实登记为未决项（不得默认「存量」）。

### B2 VSC 面注记收正
- 落地 `thincoder-vscode/test/async-parity.test.mjs`：断言注记整段替换（旧「核语义现状 / 差异面 / 待裁」语义 → 现役 `13/13 exit0` 语义，接 §3 轮 1 #3 与轮 2 复验）；并补**新旧双坐标**（`:350` / `:351` ↔ `thincoder-core/agent-tools/subagent-scheduler.mjs:127-128`）。

### B3 核侧测试分层（慢门 + 快层防漏拦截）
- 新档：`thincoder-core/test/slow.mjs`（33 行）· `slow-gate.mjs` · `run-fast.mjs` · `run-full.mjs` ＋ `thincoder-core/package.json`（`scripts.test` = 快层 / `scripts.test:full` = 全量）＋ `.github/workflows/test.yml:46`（核作业双腿）。
- 终态实读：core 全量**两跑均 exit0**；末次 **`225 tests / 225 pass / 0 fail / 0 skip / exit0`**；快层 default = slow 全 skip（↯ 可见、不隐身）——「test:pass 且超阈」⇔ 未归册（慢层 skip，注册表比对恒等式省略）；拦截阈值 800ms > 归册阈值 500ms（`run-fast.mjs:26` 并发 6 保持不调高）。
- **归册实测差异（如实登记、不回填）**：实读归册 = **5 档 / 12 例**（`slow(` 12 处：`core-modules.test.mjs:28` · `session-slot-write.test.mjs:160/:166/:173` · `tool-seams-agent.test.mjs:106` · `tool-seams.test.mjs:70/:88/:110/:164` · `write-path.test.mjs:91/:119/:216`）；§2 载 as-of 点名 3 例（1319.4 / 1545.5 / 1838.6 ms）。全量层实读：其中 3 例 >800ms（660.9 / 930.7 / 940.8 ms 级别）而 7 例 <500ms（117.7 / 134.7 / 146.3 / 155.2 / 345.9 / 417.1 / 431.9 ms）⇒ 本批按「真 fs / git 子进程 / 定时器族」整族归册（超集），非仅按单例超阈。

### B4 枚举面收正（五槽权威）
- 权威 = `thincoder-cli/src/tui/cmd-submodel.mjs:4`（`SUBMODEL_SLOTS` = explore / plan / coder / eng-coder / eng-designer 五槽）。
- 落地：`thincoder-cli/README.md:23` / `:97` / `:134` / `:199-200`（接 §3 轮 1 #1）＋ `thincoder-cli/docs/design/TUI-COMMANDS.md`（`:86-108` 面）——六处枚举对齐五槽。

### 评审 / 审计轮次与终态
- 内部 explore 分歧审计：**1 轮（阻塞式）已跑**；其报告 9 项文本**本会话摘要后未定位、未逐条核对** ⇒ 该项**终态未裁**，如实标未完成（不凭记忆补写）。
- 内部 advisor 代码评审：**已跑并落地修正**（已核坐标项三项：① 核面新档头行加**域根**（纯显示·判据零改）；② 已落地越 300 软线的**仅登记**处置；③ 读数行禁「exit0 ✓」形态、按实读口径表述）。**逐条原文与全表（#1–#6）本段不复写**（摘要后原文未复读，不凭记忆补造）——完整表随交付报告呈父侧。
- 终态：**未取 clean 结论**（上述两项未复读）⇒ 本段不声明收敛，标 **stalled-on-read**，由父侧裁定。

### 未决 / 未做（如实）
1. VSC 域腿 3 条悬空锚（路径/坐标）归属未核（未跑 base 对照）。
2. 宽度机检末态 = `FAIL(宽度): 5 文件 / 10 行超 300 字符`＋`FAIL(一致性): 3 条违规（V1 段引用 / V2 计数 / V3 批次档 §3）`——未逐条归属（其中 V3 属批次档 §3 评审表行）。
3. 跨批/父侧面：`docs/core/design/TESTING.md:64` / `:266`（旧引名）/ `:283`（自档行数）与 `:61` 状态标记；`docs/core/design/DOC-DISCIPLINE.md:719-730` 引旧行数 348（现 386）。
4. 行数缺口：§2 未登记 `scripts/doc-anchors.mjs` = 91 行 / `-v5.mjs` = 266 行 / `-core.mjs` = 232 行；core 四慢档合计 133 行（§2 ≈128）。
5. 快层历史日志（`.thincoder/tmp/*-fast.log`）存「D-T6 慢门防漏拦截」旧记录（1/2/11/12 例）——历史档、非本刻失败，未逐条归属。

## §6 验证与收口（父代理）

> **收口判词：已收口 2026-09-16**（设计评审轮 1 changes-required → 轮 2 pass → 实施轮交付 → 父侧独立核验 → 核销关链）

### 交付判定（读数为父侧实测）

| 设计条目 | 交付 | 父侧核验 | 判定 |
|---|---|---|---|
| B1 两参照树豁免族 | `scripts/doc-anchors*.mjs` 三档 + CLI 测试逐条/汇总用例 + 判据位指针四处 | `doc-anchors.mjs` 复跑：参照历史面腿 **悬空 0** ✓ + 族豁免列报（36 条）· 主域悬空 3 = 批 9「拟新增」前向引用（**非本批**）✓ | ✅ |
| B2 VSC 注记收正 | `async-parity.test.mjs` 注记 + 双坐标 | **单跑 13/13 pass 0 fail**（T-D9 绿——台账 T-D9 条目可核销） | ✅ |
| B3 核侧慢层 | 核侧 `{slow,slow-gate,run-fast,run-full}.mjs` + package.json + CI 双腿 | `node --test`（快层）复跑 = **pass 217 / fail 0 / skipped 12**（slow 自动 skip ✓ 机制生效）；`run-fast`/`run-full` 用例在场 | ✅ |
| B4 枚举五槽 | README 四处 + TUI-COMMANDS 六处 | 与 `cmd-submodel.mjs:4` 五槽对齐（#23 实读） | ✅ |

### D7 核销同步清单

| 项 | 状态 |
|---|---|
| 角色表 / 段位 | §1 主 agent · §2 eng-designer · §3 评审（轮 2）· §5 eng-coder · §6 父代理 —— 落位齐 |
| 状态行 | 本档 → **已收口 2026-09-16** |
| 计数 | 设计 4 条目（B1–B4）全交付；归册集 12 例（§2 as-of 3 例 ⇒ 超集登记，不回填） |
| 指针 | 设计档（AGENT-LOOP-SUBAGENT / TESTING 相关节）回指在位 |
| 变更记录 | 由设计/实施轮落（§2/§5 在案） |
| 待办勾销 | 台账四条（`VSC T-D9` · `core 侧无慢测层` · `TUI-COMMANDS 同族枚举` · `CLI 域悬空锚 37 条`）→ **核销 → 归档**（父侧同轮） |
| 台账可见面 | 收口行见会话流 |

### 未决（登记 / 触发）

1. **归册差异**：实读归册 12 例（5 档）vs §2 as-of 点名 3 例 ⇒ 整族超集如实登记、未回填 §2（随批 9 实施轮复读）；
2. **子代理内部审计记录面**：#23 上下文压缩致 explore 分歧审计 9 项逐条文本与 advisor #1–#6 全表原文未能复写（处置已落地）⇒ **登记**（记录面缺失，非实现面）；
3. **宽度/一致性红归口**（父侧另轮机械收正）：宽度 5 档 12 行 = 本档 §2/§3 段面 3 行 + 他批档 9 行（归段作者）；一致性 V1 3 条「本档 §7」= **批 12 档**（归 #33 实施轮）；
4. **报告态 5 处 distinct 3**（`docs/design/TOOLS.md:189` A3 + `WEBVIEW.md` A2 ×4——旧树符号/`_advisorScrollDirty` 死码引用）= 参照历史面报告态，归批 11 尾巴面。

**收口结论**：四条目全交付且父侧独立核验通过（族豁免生效 / T-D9 绿 / 慢层机制生效 / 枚举对齐）；闸态红全有归属（他批/段面），非本批笔。
