# 2026-10-01 · 测试清单收口
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-01 · 来源 = 用户 2026-10-01 全自动代选授权（材料推荐 ②）+ 取证批 #792 材料。
> 台账 = #792（core · 归批）。前情 = docs/batches/2026-10-01-test-manifest-evidence.md（取证轮——材料在档 · #792；本批 = 决策 + 收口）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-01
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**批次性质**：测试清单批收口（#792 后续）——按**已裁 ②「认账为骨架」**（用户 2026-10-01 全自动代选授权）：单元面不重建（登记为账）+ 文档面收正 5 面 + 集成面按 N8 起步 3~9 例（用例实施 = 独立批）。

**关键判据**：认账 = 系统级唯一权威面（`docs/core/design/TESTING.md` §2.3——包级只引用不重述）∥ 复跑口径 = 单档直跑（`node --test docs/batches/<档>.test.mjs`）∥ 集成例数窗 3–9 ∥ 验收 = 五包 `node test/run.mjs` 读数 + 文档面读回。

**授权口径**：来源 = 取证批 #792（评审 pass）+ 全自动代选；设计 = eng-designer（已落 · §2 读回核讫）；**评审 = 点火中**（父侧按授权代发）；§4 代签 = 父侧。

**上抛（8 条 · 要点）**：#792 标题「四包」⇒ 核销时点随正 ∥ 仓外 `d:\teamcode\AGENTS.md` = 越仓另轮（只报）∥ vsc 清单档头指针 N10⇒N19 = 接线批零语义 ∥ ③④ 自检仅 render-core 有（材料收窄）∥ `:462` 记录面不收正 ∥ cli `AGENTS.md:35` 残句 = 供评审酌 ∥ 五包集成域实空精读 ∥ §1 占位（本条即补）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（#792 二择「认账为骨架」——认账落账（TESTING.md §2.3）+ 5 面收正给句（§2.3）+ 集成起步定形（§5.1）；修正轮 1（findings 1–3）已落——修正块 = §2.9；实施 = 文档收正 ∥ 集成例另批）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 轮次、口径与禁面（initial · 收口轮——「认账为骨架」）

**本笔条目（覆盖）**：B1 认账文书（落点 + 句式——§2.2）· B2 文档面收正 5 面（逐面给句——§2.3）· B3 集成起步定形（§2.4）· B4 受影响面与验收（§2.5–§2.6）。
**明确不在本批**：集成用例建设（另批——本设计即其设计书，实施免再设计轮）· 仓外面 `d:\teamcode\AGENTS.md:30/:34`（父侧另轮——越仓纪律）· 单元面重建（① 路——已裁不做：F8 ∥ §1.21 级改判，非事故修复）。

- **轮次** = initial（收口轮——#792 二择裁后）。**授权口径** = 用户 2026-10-01 **全自动代选 ②**（材料推荐；取证批 `docs/batches/2026-10-01-test-manifest-evidence.md` F1–F5 修复后终版在档）。
- **设计档落点** = `docs/core/design/TESTING.md`——**§2.3 现行态认账** + **§5.1 起步批量** + §7 两行（A-TS17/A-TS18）+ TS-10 + 变更记录行（**本设计轮已落**；465 ⇒ **505** 行）。
- **禁面执行**：产品码零触 ✓（5 面均系包级文档——product-text face，实施归 eng-coder 流程）；仓套件零写 ✓（集成例 = 另批）；批档 §1/§4/§6 零触 ✓；台账面零写 ✓；仓外文件零触 ✓。

### 2.2 认账文书（B1——落点与句式）

**落点（设计定形）**：系统级 = **设计档 §2.3**（唯一权威陈述面——D2）；包级 = 5 面文档携重置注并引 §2.3（不各自重述系统句）。否选「各包 README 各自重述系统句」（D2 违）∥「只改包级」（系统级无权威面）。

**句式（四件——已落 §2.3）**：
① **五包读数表**：cli ∥ desktop ∥ vscode = 收集面自检 + 空清单守卫直通；core = 同态；**render-core = ③④ 自检先跑**（自检可红）。
② **复跑口径句**：单档直跑 `node --test docs/batches/<档>.test.mjs`（平 node；取件按 §2.2 挂载面）——按需 ∥ 定向复跑，零新增命令。
③ **「认账 ≠ 丢弃」句**：批内件总体统留——含锁族 36 件 ∥ 断代/勿复跑件 14 件（as-of 2026-10-01）；零处置动作（零删 ∥ 零移 ∥ 零改注）。
④ **集成欠账显式句**：现量 0 ∥ 起步 = §5.1 ∥ F12 发布门欠账可见 ∥ F9 窗口读数随收口测试行 ②半带出。

### 2.3 文档面收正 5 面（B2——逐面落点 + 给句）

给句 = 逐字权威（实施按此落；标点 ∥ 空格从原档形；面 1/5 中文注（vsc `AGENTS.md:129` 先例同形）· 面 2/3/4 英文档体）。

**面 1 · `thincoder-cli/AGENTS.md:35`**（Testing policy 行——行内一处替换 + 行尾新增一行）：
- 行内 OLD：`——单元（\`test/*.test.mjs\`）+ 集成（\`test/integration/\`——业务验收场景）+ slow 全跑（`
- 行内 NEW：`——单元 ∕ 集成两收集面（单元槽按制空置——单元档一律随批次本地、不进套件；集成档 = \`test/integration/\`——业务验收场景）+ slow 照跑（`
- 新增行（该行后）：「**2026-09-28 全清重置（用户令）**：存量用例全退役——本包套件清单现为空（零用例即绿）；重建规则 = 单元档随批次本地（`docs/batches/`——不进套件）、集成档业务设立（`test/integration/`——窗口 50–100）。现行态认账 = `docs/core/design/TESTING.md` §2.3。」

**面 2 · `thincoder-cli/README.md:204 ∥ :221`**（**:462 不触**——0.7.4 沿革行 = 记录面，见 §2.7 KD-3）：
- `:204` OLD：`test/               node:test offline unit tests (npm test)` ⇒ NEW：`test/               suite entry (npm test) — integration set; unit tests = batch-local files (docs/batches/)`
- `:221` OLD：`npm test                          # offline unit tests (node:test, with local mock servers)` ⇒ NEW：`npm test                          # repo suite (integration set, offline) — empty manifest after the 2026-09-28 reset; unit tests = docs/batches/`

**面 3 · `thincoder-core/README.md:85`**：
- OLD：`` `npm test` runs the offline unit suite; it runs again on release through `prepublishOnly`. ``
- NEW：`` `npm test` runs the repo suite entry (`node test/run.mjs`); after the 2026-09-28 full reset the suite manifest is empty (zero tests = green — collection self-checks still run). Unit tests live as batch-local files under `docs/batches/` in the repository. It runs again on release through `prepublishOnly`. ``

**面 4 · `thincoder-desktop/AGENTS.md:13`**：
- OLD：`npm test           # test suite (test/run.mjs — explicit manifest, see test/files.mjs)` ⇒ NEW：`npm test           # suite entry (test/run.mjs — explicit manifest test/files.mjs; empty after the 2026-09-28 reset — zero tests = green; unit tests = docs/batches/, integration scenarios = test/integration/)`

**面 5 · `thincoder-vscode/AGENTS.md:130 ∥ :131`**：
- `:130` OLD：`**Full suite**: \`npm test\` — the single entry: unit + integration + slow all run in one go (no separate fast/full/integration scripts).` ⇒ NEW：`**Repo suite**: \`npm test\` — the single entry: the registered set runs in one go (slow runs as-is; no separate fast/full/integration scripts). After the 2026-09-28 reset both manifests are empty — zero tests = green.`
- `:131` 行内替换：`they run inside \`npm test\`（\`test/integration/\` + 其清单 \`test/integration/files.mjs\`，统一 runner \`test/run.mjs\` 驱动）` ⇒ `registered in \`test/integration/files.mjs\`, they run inside \`npm test\`（\`test/integration/\` + 其清单，统一 runner \`test/run.mjs\` 驱动）`

### 2.4 集成起步定形（B3——选例 ∥ 落位 ∥ 门 ∥ 接线）

**定形落点** = 设计档 **§5.1 起步批量**（**本设计轮已落**——四要素齐）。**用例实施 = 独立批**（理由：本批验收形 = 文档面读回 + 五包读数；三前端驱动面（脚本化 provider ∥ 宿主 mock ∥ 真 Electron）工作量独立成轮；§5.1 已含四要素 ⇒ 实施批免再设计轮）。※该分界可逆——父侧裁。

- **选例** = 场景① 普通模式完整工具流（需求 F13 点名必选）× 三前端各自实例化（F14）；三态齐全；例数窗 **3–9**；选例原则 = 用户可见入口 ∥ 业务场景（需求 §1.1——不从单元档转换，F8）。
- **落位** = 三前端 `test/integration/<场景名>.test.mjs`；核仓零集成（需求 §3 N20）。
- **接线** = cli 两层 glob 自动收（零清单档）∥ vsc 登记 `test/integration/files.mjs` ∥ desktop 登记 `test/files.mjs`（单册）——空清单守卫非空即让位，**runner 零改动**。
- **门** = `npm test` 单入口全绿（§10 F1；不新增入口/script）；收口跑 = 父侧恰一次（需求 F3）。

### 2.5 受影响文件与测试面

| 档 | 现行（as-of 2026-10-01） | Δ | 实施人 |
|---|---|---|---|
| `docs/core/design/TESTING.md` | 465 行 | **⇒ 505（+40）——已落**（本设计轮） | eng-designer |
| `thincoder-cli/AGENTS.md` | 65 行 | +1 新行 + `:35` 行内替换 | eng-coder |
| `thincoder-cli/README.md` | 539 行 | ±0（`:204 ∥ :221` 行内替换；`:462` 不触） | eng-coder |
| `thincoder-core/README.md` | 90 行 | ±0（`:85` 行内替换） | eng-coder |
| `thincoder-desktop/AGENTS.md` | 24 行 | ±0（`:13` 行内替换） | eng-coder |
| `thincoder-vscode/AGENTS.md` | 135 行 | ±0（`:130 ∥ :131` 行内替换） | eng-coder |

**测试面**：本批零新增用例（集成例 = 另批）；实施后验收读数 = 五包 `node test/run.mjs`（空清单态——见 §2.6 G4）。另：机检交付读数——`node scripts/doc-check.mjs` 对 TESTING.md：本笔新增零红（交付检查发现本笔新增 1 行宽 + 2 坐标，已自纠并复核）；既有红盆地（锚 ∥ 行宽——他批在册）不属本笔。

### 2.6 验收对照

| # | 判据 | 命令 ∥ 读法 |
|---|---|---|
| G1 | 认账在档（§2.3 四件句齐） | 读回 `docs/core/design/TESTING.md` §2.3 |
| G2 | 5 面收正逐面落地 | 逐面读回；陈旧串零命中（`offline unit tests` ∥ `offline unit suite` ∥ `Full suite`——UTF-8 式扫描，5 面域） |
| G3 | 起步定形在档（§5.1 四要素齐） | 读回 §5.1 |
| G4 | 五包读数 | `cd thincoder-<p> && node test/run.mjs` ×5 ⇒ 空清单行 + exit 0（render-core 含 ③④ 自检在先） |
| G5 | 禁面 | 产品码 ∥ 批档 §1/§4/§6 ∥ 台账 ∥ 仓外 零触（逐项核） |

### 2.7 关键决策

| # | 决策 | 理由 · 否选 |
|---|---|---|
| KD-1 | 认账落点 = 设计档 §2.3（系统级单源）+ 5 面携注引之 | 否选「各包重述系统句」（D2 违）∥「只改包级」（系统级无权威面） |
| KD-2 | 集成用例实施 = 独立批 | 本批 = 收口（文档面）；用例建设（三前端驱动面）独立成轮；§5.1 定形已足 ⇒ 免再设计轮。否选「并入本批」——两风险面混装（※可逆——父侧裁） |
| KD-3 | `thincoder-cli/README.md:462`（0.7.4 沿革行）= 记录面不收正 | 「旧字面留记录面」既裁（设计档 §10 先例同判）——收正面 = 现行态声明 |
| KD-4 | 起步选例 = 场景① | 需求 F13 点名必选 + 三端共面（主路径）+ 用户可见入口；否选「场景⑦配置选路」等——非点名、覆盖面窄于主路径 |
| KD-5 | 复跑口径零新机制 | 单档直跑 + §2.2 取件——不建命令/脚本（第二入口 = 漂移源同判） |

### 2.8 上抛项（findings · 逐条）

1. **台账 #792 标题仍「四包」**（实测五包——取证轮 §2.7-1 已上抛、未收正；台账面 = 父侧）。#792 核销时点建议 = 集成批收口时（「起步」要件以落地为完整）——父侧酌。
2. **仓外面** `d:\teamcode\AGENTS.md:30 ∥ :34`——命令面陈旧 + 仓外（非 git 仓）⇒ 父侧另轮；本笔零触。
3. **VSC 集成清单档头指针偏差**：`thincoder-vscode/test/integration/files.mjs:1` 引「N10」——窗口 50–100 实为 **N19**（现引非窗口条目）；随集成接线批同拍收正（零语义；本笔零触）。
4. **材料收窄（实测）**：取证批「core ∥ render-core 常驻 ③④ 自检」——实测**仅 render-core** 有 ③④；core runner 无 ③④（实读 `thincoder-core/test/run.mjs`：②' ∥ ②'' + 空清单守卫）；§2.3 读数表已按实测分列。
5. **材料句内沿革行**：`thincoder-cli/README.md:462` 在取证清单内——本设计判「记录面不收正」（KD-3）；如父侧另判，修正轮可并收。
6. **`thincoder-cli/AGENTS.md:35` 句内残句**：「改 session / checkpoint / memory / git-index 等面后同样跑此入口」与现行分层（需求 F1 舱内 ∥ F3 收口跑）读感相抵——材料射程外，本笔未裁（供评审/父侧酌）。
7. **描述精度**：材料「五包 `test/integration/` 实空」精读 = cli ∥ core ∥ render-core **集成目录未建**（非"空目录"；核仓按 N20 不设集成域）∥ desktop（空目录）∥ vscode（仅清单档）——§2.3 已按精读落。
8. **§1 段占位未填**（体例面——授权口径 = 派单 + 档头来源行；建议父侧补填）。

**引注形说明**：§2.3 个别给句内的反斜杠+反引号组合 = 嵌套引注转义（实文为单反引号）；实施与评审按原档实形逐字对齐（空白 ∥ 标点以原档为准）。

### 2.9 评审修正块（轮 1 · findings 1–3——逐号：现 ⇒ 新）

**口径**：源 = 本档 §3 轮次 1（🔴1 ∥ 🟡1 ∥ 🔵1）+ 父侧逐条裁收（#1 残句一并收正；#2 取「补指针」不取收窄；#3 复算后取「改挂口径」）。原档文字未动（append-only）——本块为修正面，与 §2.3 原给句冲突处以本块为准；**面 1–5 产品树文档零触**（落笔归实施轮——eng-coder 按本块给句逐字落）。零新语义（纯收正）。

**#1（🔴）· 面 1 行内替换扩容——残句一并收正**（落点 = `thincoder-cli/AGENTS.md:35`；给句面 = §2.3 `:44-47`）

- 残句 现：`改 session / checkpoint / memory / git-index 等面后同样跑此入口；`
- 残句 新：`改动验证按分层纪律——舱内只跑改动面相关单元测试（不得逐轮跑仓套件）；仓套件（收口跑）在链末恰一次、不在 eng-coder 链内（见 \`docs/core/design/TESTING.md\` §1.1）；`
- 面 1 给句自此 = 三件齐：① 行内处 1（§2.3 原给句，原样）② 行内处 2（残句——本块「残句 新」）③ 行后新增行（§2.3 原给句，原样——已携 §2.3 指针）。
- 判据：该行收正后与 `docs/core/design/TESTING.md` §1.1 逐句零相抵（舱内 = 改动面相关单元测试、不得逐轮跑仓套件；仓套件（收口跑）= 链末恰一次、不在 eng-coder 链内）。
- **§2.8-6 处置（已裁 → 落法）**：残句**已裁**——纳入面 1 行内替换（扩容）；**落法** = 实施轮按「残句 新」落笔（承接 = 本批实施轮；「供评审/父侧酌」句就此收口，不另悬置）。
- 连带（零扩面）：A-TS17 三串判据（`offline unit tests` ∥ `offline unit suite` ∥ `Full suite`）不变——残句收正不新增判据串。

**#2（🟡）· 面 2–5 给句末补指针**（§2.2 ∥ KD-1 口径不变——不取收窄选项）

指针形 = 面 1 新增行同式（英文档体 = `current state: <档> §2.3`；中文注面 = 「现行态认账 = <档> §2.3」）；**路径形按各档既有活指针文风**：cli README ∥ desktop ∥ vsc = `../docs/…`（vsc `:128`「权威 = \`../docs/core/design/TESTING.md\` §10」同形先例）；core README = 仓根式 `docs/…`（档内「in the repository under \`docs/core/design/\`」同形）；面 1 原样（指针已在 §2.3 给句内）。

- 面 2 · `thincoder-cli/README.md:204`——现：`test/               suite entry (npm test) — integration set; unit tests = batch-local files (docs/batches/)` ⇒ 新：`test/               suite entry (npm test) — integration set; unit tests = batch-local files (docs/batches/) — current state: ../docs/core/design/TESTING.md §2.3`
- 面 2 · `thincoder-cli/README.md:221`——现：`npm test                          # repo suite (integration set, offline) — empty manifest after the 2026-09-28 reset; unit tests = docs/batches/` ⇒ 新：`npm test                          # repo suite (integration set, offline) — empty manifest after the 2026-09-28 reset; unit tests = docs/batches/ — current state: ../docs/core/design/TESTING.md §2.3`
- 面 3 · `thincoder-core/README.md:85`——现：`` `npm test` runs the repo suite entry (`node test/run.mjs`); after the 2026-09-28 full reset the suite manifest is empty (zero tests = green — collection self-checks still run). Unit tests live as batch-local files under `docs/batches/` in the repository. It runs again on release through `prepublishOnly`. `` ⇒ 新：`` `npm test` runs the repo suite entry (`node test/run.mjs`); after the 2026-09-28 full reset the suite manifest is empty (zero tests = green — collection self-checks still run). Unit tests live as batch-local files under `docs/batches/` in the repository — current state: `docs/core/design/TESTING.md` §2.3. It runs again on release through `prepublishOnly`. ``
- 面 4 · `thincoder-desktop/AGENTS.md:13`——现：`npm test           # suite entry (test/run.mjs — explicit manifest test/files.mjs; empty after the 2026-09-28 reset — zero tests = green; unit tests = docs/batches/, integration scenarios = test/integration/)` ⇒ 新：`npm test           # suite entry (test/run.mjs — explicit manifest test/files.mjs; empty after the 2026-09-28 reset — zero tests = green; unit tests = docs/batches/, integration scenarios = test/integration/) — current state: ../docs/core/design/TESTING.md §2.3`
- 面 5 · `thincoder-vscode/AGENTS.md:130`——现：`**Repo suite**: \`npm test\` — the single entry: the registered set runs in one go (slow runs as-is; no separate fast/full/integration scripts). After the 2026-09-28 reset both manifests are empty — zero tests = green.` ⇒ 新：`**Repo suite**: \`npm test\` — the single entry: the registered set runs in one go (slow runs as-is; no separate fast/full/integration scripts). After the 2026-09-28 reset both manifests are empty — zero tests = green（现行态认账 = \`../docs/core/design/TESTING.md\` §2.3）。`

**#3（🔵）· `docs/core/design/TESTING.md` 两处读数对盘（已落——本修正轮；该档 505 ⇒ 507 行）**

- 复算读数（2026-10-01 · 取证批 §2.9 口径；cwd = 仓根）：批内件 = **118 件 ∥ 2,255,834 B**（原载 111——同日已漂移）；锁族（件含「锁」∧不含「快照」）= **38 件**（原载 36——随批流动）；断代/勿复跑 = **14 件**（复算一致——不触）。
- `:92` 现（该处段）：`——as-of 2026-10-01：111 件；` ⇒ 新（该处段）：`` ——as-of 2026-10-01；件数随批流动、不落固定读数——复算口径 = 取证批 `docs/batches/2026-10-01-test-manifest-evidence.md` §2.9：逐档计数、后缀即匹配式； ``
- `:94` 现（该处段）：`含锁族 36 件 ∥ 断代/勿复跑件 14 件（as-of 2026-10-01；判据式 = 件内「锁」∧非「快照」∕「断代」∨「勿复跑」——复算口径 = 取证批 \`docs/batches/2026-10-01-test-manifest-evidence.md\` §2.9）` ⇒ 新（该处段）：`含锁族 ∥ 断代/勿复跑件 14 件（as-of 2026-10-01；判据式 = 件内「锁」∧非「快照」∕「断代」∨「勿复跑」——复算口径 = 取证批 \`docs/batches/2026-10-01-test-manifest-evidence.md\` §2.9；锁族计数随批流动、不落固定读数）`
- 取向 = 「改挂口径、不给实数」——「唯一权威陈述面」避过期读数（读数随批流动；本日复算读数在案见上）。`TESTING.md` 变更记录随动一行 = 该档变更记录首行（2026-10-01 · 设计评审修正轮 1——已落）。
- 机检：本笔对 `docs/core/design/TESTING.md` 零新增红（行宽 288 ∥ 锚 119——与改前基线逐数一致；该档既有红盆地他批在册，不属本笔）。

**净效果**：本块 = 本修正轮唯一落点（append）；面 1–5 产品树文档零触（实施轮落笔）；`docs/core/design/TESTING.md` 两处读数句 + 变更记录行（本修正轮已落）；产品码 ∥ 批档 §1/§4/§6 ∥ `scripts/**` ∥ 台账 ∥ 仓外零触。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership / 机制级描述不一致 | 🔴 | `thincoder-cli/AGENTS.md:35` 行尾遗留句「改 session / checkpoint / memory / git-index 等面后同样跑此入口」与 `docs/core/design/TESTING.md:22-23` §1.1 分层纪律（舱内「不得逐轮跑仓套件（收口跑）」；仓套件 = 链终恰一次、不在 eng-coder 链内——F1 ∥ F3）对同一机制（改动后何时 ∕ 由谁跑测试入口）给出不同做法。本批面 1（`docs/batches/2026-10-01-test-manifest-settlement.md:44-47`）正改该行却只改前段，该残句仅以 `:113`（§2.8-6）「与现行分层……读感相抵——材料射程外，本笔未裁（供评审/父侧酌）」挂起未裁 ⇒ 收正落地后同一机制两处描述仍并存（且 A-TS17 对该面声称「无陈旧声明」）。 | 将残句一并纳入面 1 的行内替换（与舱内 ∕ 链终分层对齐）；或在设计内落一条显式裁定（理由 + 承接批），不以「供酌」悬置——机制级描述不一致属「必须先解」类。 |
| 2 | Document ownership（D2 引用链） | 🟡 | §2.2 `:32` ∥ KD-1 `:100` 定形「包级 = 5 面文档携重置注并**引 §2.3**（不各自重述系统句）」，但给句中仅面 1 新增行落有 §2.3 指针；面 2/3/4/5（`:49-62`）的新句只转述现状（「empty after the 2026-09-28 reset」「unit tests = docs/batches/」等）而无 §2.3 指针——与 `TESTING.md:82`「包级文档引本块、不各自重述」的口径不符：系统级单源的引用链在 4/5 面缺失，包级面成为「转述而无指针」的准第二陈述面。 | 二择一收口：面 2–5 的给句末补短指针（如「现行态认账 = `docs/core/design/TESTING.md` §2.3」）；或把 §2.2 ∕ KD-1 的表述收窄为「面 1 携注引 §2.3，余面只报现状」，使定形与给句一致。 |
| 3 | Acceptance criteria / 数量漂移 | 🔵 | `docs/core/design/TESTING.md:92` 载「`docs/batches/*.test.mjs`——as-of 2026-10-01：**111 件**」，实测现盘 **118 件**（glob ∥ ls 双读；同日已漂移 7 件——13 档为 2026-10-01 当日批件）；`:94`「锁族 36 件」未能按文中判据式独立复算（抽查中「锁」在批内件叙述里广布，判据面宽于 36——按 unverified 记），仅「断代/勿复跑件 14 件」逐件复核一致（14/14）。 | 收口读回前复算总件数（或改挂「按取证批 §2.9 复算口径」不给实数）——「唯一权威陈述面」宜避过期读数；`§2.3` 既有 as-of 标注可保留为口径声明。 |

**计数**：🔴 1 ∥ 🟡 1 ∥ 🔵 1
**VERDICT: changes-required**

### 轮次 2（评审子代理）

**轮 2 —— 逐号验证（复审：轮 1 表 #1–#3）**

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | `docs/batches/2026-10-01-test-manifest-settlement.md:123-130` ∥ `thincoder-cli/AGENTS.md:35` | 🔴 | ✅ Fixed（设计面——落笔随实施轮） | §2.9 #1 把残句纳入面 1 行内替换（扩容）：「残句 新」=「改动验证按分层纪律——舱内只跑改动面相关单元测试（不得逐轮跑仓套件）；仓套件（收口跑）在链末恰一次、不在 eng-coder 链内（见 `docs/core/design/TESTING.md` §1.1）；」——与 `docs/core/design/TESTING.md:22-23` §1.1 逐句对齐；`:129` 已裁句：「残句**已裁**——纳入面 1 行内替换（扩容）……承接 = 本批实施轮……不另悬置」。残句现串与盘上 `thincoder-cli/AGENTS.md:35` 逐字一致（该行仍载旧文「改 session / checkpoint / memory / git-index 等面后同样跑此入口；」——按 `:121`「面 1–5 产品树文档零触」属既定落法，实施轮逐字落）。 |
| 2 | 2 | `docs/batches/2026-10-01-test-manifest-settlement.md:132-140` | 🟡 | ✅ Fixed | 面 2–5 五处给句末补指针（cli README `:204 ∥ :221` ∥ core README `:85` ∥ desktop AGENTS `:13` ∥ vsc AGENTS `:130`）；指针形 ∥ 路径形规则 = `:134`（面 1 原样）；§2.2 ∥ KD-1 口径保留（不取收窄）。各档路径先例实读相合：cli README `:60`（`../docs/cli/design/ACP-CLIENT.md`）∥ core README `:86`（`docs/core/design/`）∥ desktop AGENTS `:23`（`../docs/desktop/design/`）∥ vsc AGENTS `:128`（`../docs/core/design/TESTING.md` §10）。 |
| 3 | 3 | `docs/core/design/TESTING.md:92 ∥ :94 ∥ :451` | 🔵 | ✅ Fixed | `:92` 已改「件数随批流动、不落固定读数——复算口径 = 取证批 … §2.9」；`:94` 已改「含锁族 ∥ 断代/勿复跑件 14 件（……；锁族计数随批流动、不落固定读数）」；§2.9 `:144` 复算读数在案（批内件 = **118 件 ∥ 2,255,834 B**——与现盘复核实测一致；锁族 38 件；断代/勿复跑 14 件不触）；`:451` 变更记录行在位；该档 505 ⇒ 507 行与实读一致。 |

**抽检（本轮实读）**：`^.{300,}$` 对 TESTING.md 零命中（与「零新增红」相容）；三条陈旧串现仅存于待改四行（`thincoder-cli/README.md:204 ∥ :221` ∥ `thincoder-core/README.md:85` ∥ `thincoder-vscode/AGENTS.md:130`）——A-TS17 ∥ G2 实施后零命中可达；受影响 6 档行数标注（65 ∥ 539 ∥ 90 ∥ 24 ∥ 135 ∥ 507）与实读一致。

**计数**：🔴 0 ∥ 🟡 0 ∥ 🔵 0（轮 1 三项全数收口；本轮零新发现）
**VERDICT: pass**

## §4 用户批准（主 agent）

**代签（父侧 · 2026-10-01）**：依据 = 用户全链自动授权 + 评审轮 1（changes-required——1🔴 ∥ 1🟡 ∥ 1🔵）+ 修复轮 1（§2.9 修正块落定）+ **复审轮 2 = pass**（0🔴 ∥ 0🟡 ∥ 0🔵——三项全数收口，本轮零新发现）。**批准范围** = §2 全（**以 §2.9 修正面为准**）：① 认账文书（`docs/core/design/TESTING.md` §2.3——已落）∥ ② 面 1–5 产品树文档收正（5 档 6 行：残句收正（分层纪律）+ 五处 §2.3 指针——实施轮逐字落）∥ ③ 集成起步（TESTING.md §5.1 已落；用例实施 = 独立批）∥ ④ 验收 = G2 陈旧串零命中 + 文档面读回（实施舱）∥ 五包读数 + 收口（父侧）。**遗留（不阻断）**：`#792` 标题「四包」⇒ 核销时点随正（上抛①）。实施 = eng-coder 单舱（5 档产品树文档 · 任务书 = §2.3 ∥ §2.9 给句）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（eng-coder · 5 档 6 行 + 面 1 新增 1 行逐字落 · 字节级对拍全中 · 分歧审计/代码评审 = clean（fix round 0））


**交付摘要（收正面 = 5 档 6 行 + 面 1 行后新增 1 行——逐字落；给句源 = §2.3 ∥ §2.9，冲突处以 §2.9 为准）**

| 面 | 档 · 行 | 落法 | 行数 |
|---|---|---|---|
| 面 1 | `thincoder-cli/AGENTS.md:35` | 两处行内替换（① §2.3:46 单元槽句 ② §2.9:126 残句新 = 分层纪律句——§2.8-6 残句收正就此落） | 65 ⇒ 66 |
| 面 1 | `thincoder-cli/AGENTS.md:36` | 行后新增 1 行（§2.3:47——携 `docs/core/design/TESTING.md` §2.3 指针） | +1 |
| 面 2 | `thincoder-cli/README.md:204 ∥ :221` | 行内替换 + §2.9:136/:137 指针尾（`../docs/…` 形） | ±0 |
| 面 3 | `thincoder-core/README.md:85` | 行内替换 + §2.9:138 指针尾（仓根式 `docs/…`） | ±0 |
| 面 4 | `thincoder-desktop/AGENTS.md:13` | 行内替换 + §2.9:139 指针尾（`../docs/…` 形） | ±0 |
| 面 5 | `thincoder-vscode/AGENTS.md:130` | 行内替换 + §2.9:140 指针尾（中文注形） | ±0 |

**机检读数（实施舱 · 2026-10-01）**

- **逐字核验 = 字节级**：六行替换 + 新增 1 行，与批档 §2.3 ∥ §2.9 给句（程序化提取、`\`` 转义还原为单反引号）逐行**字节相等**——全中；五档全文 vs 修改前快照（OS 临时目录备份）对拍 = 「仅预期改动」逐档相等（零夹带）。
- **陈旧串零命中**：`offline unit tests` ∥ `offline unit suite` ∥ `Full suite`——五档全域 0 命中（另扫 `node:test offline` ∥ `test/*.test.mjs` ∥ `slow 全跑` ∥ `改 session / checkpoint` 亦 0）。
- **行数对账**：cli AGENTS 65 ⇒ 66 内容行（+1）；cli README 539 ∥ core README 90 ∥ desktop AGENTS 24 ∥ vsc AGENTS 135——±0。
- **未触面实测**：`thincoder-cli/README.md:462`（记录面——KD-3）∥ `thincoder-vscode/AGENTS.md:131`——逐字未动。
- **机检域核对**：`PROJECT-MANIFEST.json` `checkConfig.scanDirs = ["docs"]` ⇒ 五档（产品树）不在锚 ∥ 行宽判集内（零机检红可预期）；新行最长 = core README:85（366 字符）——域外。

**决策透明表**

| # | 决策 | 理由 · 披露 |
|---|---|---|
| D1 | `thincoder-vscode/AGENTS.md:131` **不触** | §2.3:60/:62 ∥ §2.5:82 载 `:130 ∥ :131` 两处替换给句；§4:182 批准面 = 「5 档 6 行：残句收正（分层纪律）+ 五处 §2.3 指针」，任务书 = 「收正面 = 6 行 + 面 1 行后新增 1 行 ∥ `:131` 不触」。实施按批准面 6 行落——`:131` 给句未落。**上抛（审计 ∥ 评审双独立标出）**：批档 §2.3/§2.5 与 §4 计数相抵、该项未闭合——请父侧 §6 二择一留痕：① 补落（1 行内替换，零新语义）∥ ② 裁作废并在 §2.3/§2.5 标注（勿悬空） |
| D2 | 面 1 新增行落**列 0**（无缩进、无项目符号） | §2.3:47 给句原文即无缩进——「逐字」优先落笔；vsc `:129` 先例为 2 空格续行形（渲染差 = 零：Markdown lazy continuation 同段吸收）。如需与先例严格同形 = 给句改面（非实施偏离——勿静默改） |
| D3 | `docs/core/design/TESTING.md` 只读引用 | 禁面（本舱零写）；指针落点 §2.3 ∥ §1.1 实测在档（TESTING.md:79 ∥ :16） |

**审计与代码评审轮次与终态**

| 轮 | 通道 | 读数 | 处置 |
|---|---|---|---|
| 审计 · 轮 1 | 内部分歧审计（explore · 只读） | 逐字 ∥ 陈旧串 ∥ 越面 ∥ 行数——四类全 PASS，零分歧；附注 2 条（`:131` 残留 ∥ §5 待写） | `:131` 并入 D1；§5 = 本条 |
| 代码评审 · 轮 1 | 内部代码评审（advisor · code） | **pass**（0 🔴 ∥ 1 🟡 ∥ 1 🔵）；🟡 = `:131` 残留（明标**非 must-fix**——申报靶 7 行已逐字落地，属批档内未闭合项，处置归父侧，同 D1）；🔵 = 面 1 新增行列 0 缩进注（明标「本批无需改动」——逐字令） | 零 must-fix ⇒ **fix round = 0** |

**终点态 = clean**（零 must-fix ∥ 零回滚 ∥ 零返工；五档改动全部落盘且经字节级对拍）。
备注：advisor 报告尾附主机引注核验标 0/5 未命中（其引注为片段式——核验器按整行匹配口径所致）；实质读数（逐字 ∥ 零陈旧串 ∥ 行数）已由实施舱字节级对拍独立复核在案（见上「机检读数」），评审结论不变。

**测试面**：本批零新增用例（集成例 = 另批）；纯文档改动（`*.md`/`AGENTS.md`）按本仓约定免跑测试；仓套件（收口跑）= 父侧恰一次（G4）——本舱未跑（§1.1 分层纪律：不在 eng-coder 链内逐轮跑）。

## §6 验证与收口（父代理）

**§6 验证与收口（父侧 · 2026-10-01）**

**验收核验（终态 —— 全数过）**：① 面 1–5 落地 = 6 行替换 + 面 1 行后新增 1 行（实施舱逐字对拍 **7/7 字节相等** ∥ 全文对拍「仅预期改动」零夹带）；② 陈旧串扫描（`offline unit tests` ∥ `offline unit suite` ∥ `Full suite`）五档域 **零命中**；③ 行数对账：cli AGENTS 65 ⇒ **66**（+1）∥ 余四档 ±0 ∥ `thincoder-cli/README.md:462`（记录面 KD-3）未触；④ **五包读数（父侧亲跑 · 2026-10-01 18:5x）**：cli ∥ core ∥ desktop ∥ vscode ∥ render-core = **5/5**「test manifest is empty — zero tests = green」exit 0（发布门现行态）；⑤ 审计/评审链：分歧审计 1 轮（四类全 PASS）→ 顾问代码评审 pass（0🔴 ∥ 1🟡 ∥ 1🔵）→ **fix round 0** → 终态 clean。

**父侧裁定（实施舱披露逐项）**：① 面 5 `thincoder-vscode/AGENTS.md:131`——**裁作废（不补落）**：以 §2.9 修正面为准（`:131` = 接线陈述、非现状转述 ⇒ 按派单不触）；§2.3 ∕ §2.5 旧列的 `:131` 给句随 §2.9 为准，不再补落、不悬空（本行即闭合留痕）。② 面 1 新增行缩进 0 = 给句原文（不静默改——维持）。③ 评审引注核验 0/5 = 工具整行口径产物（字节级对拍独立复核在案——结论不变）。

**验收对照（§2.6）**：陈旧串零命中（G2）✓ ∥ 文档面读回 ✓ ∥ 五包读数（父侧亲跑）✓ ∥ 收口（本笔）✓；集成起步（TESTING.md §5.1）已落——**用例实施 = 独立批**（在册）。

**遗留**：① `#792` 标题「四包」——随本笔核销按五包现档正（不另立）；② 集成套件重建 = 随发布窗口另行立项（需求 F12 欠账显式段在册）；③ 产品树五档不在行宽/锚判集（`scanDirs = ["docs"]`）——机检零红可预期在案。**未结新债**：无。

**台账**：#792 → 已核销（本笔落）。**收口**：记录冻结（close 随本笔）。
