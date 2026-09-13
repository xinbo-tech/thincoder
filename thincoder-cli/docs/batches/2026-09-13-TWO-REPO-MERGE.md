# 两仓合并（TWO-REPO-MERGE）· 批次记录（2026-09-13）

> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务（eng-designer）· §3 设计评审（评审子代理）·
> §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-13 · 来源 = 用户 2026-09-13 提案（「对端仓问题触发了我的另一个想法」）+ 两轮澄清 + 「按倾向走。评审吧」。
> 六段骨架头常驻（各段 append 的锚点；段内无内容 = 该段尚未发生——不另加「待写」式占位文本）。

---

## §1 讨论（主 agent 记）

### 状态

**已收口 2026-09-13**——需求已定型；需求层已按**板块镜像**拆出（`docs/requirements/TWO-REPO-MERGE.md` 需求 + `docs/design/TWO-REPO-MERGE.md` 设计/测试）。
设计评审在跑：轮次 1–2 已回（均 changes-required；15 + 12 条已逐条裁决并落地），后续轮次复核中。
phase 1（目录合并）为本批范围；phase 2（核心统一）仅预留通道，不在本批实施。

### 用户提案与澄清

| 时点 | 内容 |
|---|---|
| 2026-09-13 提案 | 两产品收进一个 git 仓、各占子目录 ⇒ 消灭「他仓」概念，跨仓机制随之失效 |
| 澄清 1（目标定型） | 终态 = **一个产品两个壳**（共用真共享核、能量真 `import`）；但**分两期**——phase 1 先合并目录消除跨仓矛盾；phase 2 逐步演进统一核心（不做一次性重写） |
| 澄清 2（历史） | VSC 仓 git 历史**保留**——「能做到历史合并当然会更好」⇒ 走 subtree / filter-repo 路线 |
| 2026-09-13 | **「按倾向走。评审吧」**——Q1–Q7 依设计档倾向定案（D8–D14）；设计评审随之发起 |
| 2026-09-13 | **「A」**——需求层**拆档**：新建 `docs/requirements/TWO-REPO-MERGE.md`（依据 = `docs/README.md` §3.2 板块镜像 + §4 首注「新老划断」+ `scripts/check-ledger.mjs` L3③ 双引用硬要求） |

### 用户裁定表（逐条拍——实施者据此，勿再选型）

| # | 条目 | 裁定 |
|---|---|---|
| Q1 | 合并仓远端仓名 | 沿用 `thincoder`（D8） |
| Q2 | 合并仓根物理落点 | 原 CLI 仓目录原地改造（D9）——`d:\teamcode` 本身非 git 仓 |
| Q3 | 存量 `（X 仓）` 注记（约 1031 处） | 停新增；留痕档冻结；现行档随触碰改写（D10） |
| Q4 | CLI 侧 CI 是否顺路补齐 | 补（D11） |
| Q5 | 实施批次切分 | 分批（D12，切分见设计档 §4） |
| Q6 | 「双仓并存」过渡窗口 | 不做（D13）——并存会让跨仓机制继续存活，违背 F4 |
| Q7 | 提示词单副本物理位置 | **不做单副本合流**（D14）——产品内双源保留、跨产品收敛归 phase 2。**2026-09-13 用户「可以」= F4 收窄确认**：F4 行「提示词双副本」限定为**其跨仓机制层**退役（对端发现 / 自指防护 / 跨仓逐字断言）；依据 = 运行期硬加载（CLI `src/prompt-overlays.mjs:18` / VSC `src/advisor/main.mjs:68`）+ npm/vsix 只收包根之内文件（设计档 §2.7） |

### 设计约束（设计档已落实，此处留档以便对照）

1. **子目录名沿用现有仓名**——128 处路径 token 零改写（`resolveFile` 候选① `resolve(root, token)` 直接命中）；
2. **跨仓判据删除而非改写**——合并后对端发现路径**真能解析**，机制反向生效且不报红（静默退化）；
3. **产品运行行为零改动**——运行期无任何跨仓依赖（跨仓机制 100% 位于 build / doc / test 期）；
4. **两产品 `docs/` 保持分层**——27 + 31 + 20 对同名撞车自然消解，避免 V1 basename fail-open。

### 明确不做

phase 2 核心统一 · 产品运行行为改动 · 删除旧 VSC 仓 · 合并 lockfile · 文档物理合并 · 提示词单副本合流（D14）。

### 范围外

旧 VSC 仓的归档动作（远端设置）本身不属本仓批次档记录面；本批只承担合并仓侧的结构与机制处置。

---

## §2 批次任务（eng-designer 自写）

> **phase 1 实施任务书**（两仓合并）——依据 = 设计档（`docs/design/TWO-REPO-MERGE.md`——下文「设计档」均指此档）+ 需求档（`docs/requirements/TWO-REPO-MERGE.md`）；批次切分 = 设计档 §4，S 步序 = 设计档 §2.15。范围 = phase 1（目录合并）；phase 2 只留通道、不在本批（设计档 §2.13）。

> **编排约定（每批一次实现轮）**：本段即各实现轮的任务书——每批 = 一次实现轮；每轮 spawn 携带本段对应批，实现者据此执行，**不再自行选型**。

> **权威边界（D2 单一权威源）**：触碰细节一律回指设计档（§2.14 受影响文件清单 · §2.4 R 清单 · §2.5 机检定案 · §2.15 S 步表），本段只做派工与验收编排——**不得夹带新设计**；实现中撞到设计缺口 → 停下上报（不自行补造）。

> **批序硬约束（批 1 ↔ 批 2）**：判据删除必须在搬迁完成后执行（依据 = 设计档 §4 批注——否则现行双仓结构失去机检保护）⇒ 批 2 不得先于批 1。

**验收口径（全批共通）**：

- **三机检**（自仓根执行——命令形态零改，设计档 §2.5 定案）：`node scripts/doc-anchors.mjs` · `node scripts/check-doc-width.mjs` · `node scripts/check-ledger.mjs`；统一版落位 = S4（§2.5）。
- **两产品测试**：各自子目录执行完整门禁链（步骤不变——设计档 §2.8）。
- **§3 用例**：设计档 §3 测试表——各批「验收」行列出本批必过项（判定以可观测结果为准）。
- **回滚**：每批可独立回滚（设计档 §4 表）· 每步独立提交（设计档 §2.15 尾注）。

### 批 1 · 搬迁（S0–S3b）

- **范围**：设计档 §2.15 S0–S3b——S0 全量备份（`git clone --mirror` 至仓外 + 未跟踪产物归档）与清理 · S1 CLI 顶层条目 `git mv` 至 `thincoder-cli/` · S2 `git subtree add --prefix=thincoder-vscode` 并入 VSC 历史 · S3 仓根配置与总览 + CI 迁仓根 · S3b **旧 VSC 仓远端置归档 / 只读——不可逆，置前须用户确认**（设计档 §2.15 S3b）。
- **S2 并入前必验项**（设计档 §2.3 / §2.15 S2——必在副本仓先跑）：tag 行为实测（`subtree add` 干跑 + `git tag -l` 并入前后对比）与 graft 追溯实测（`git log --follow -m -- thincoder-vscode/package.json` + 跨搬迁档 `git blame` 抽查）——命令与输出逐字记录，结论落实施批 §5（供 T-M8 基准）。单 `--follow`（未给 `-m`）在 graft 合并提交上返回空——见设计档 §2.3 / §3.1 T-M4。
- **触碰面**：设计档 §2.14「结构搬迁」·「仓根级」·「CI」·「清理」行 + §2.9 / §2.10；产品 `src/**` 零改动（F7）。
- **验收**：§3 = T-M1 · T-M4 · T-M7 · T-M8 · T-M13 · T-M14 · T-M15 · T-M16 · T-M18；两产品测试（与迁移前基线一致）；三机检按 N3「机检不退化」口径（统一版落位 = S4）。
- **依赖**：无前置（设计档 §4 表）；本批为批 2–4 的前置。

### 批 2 · 机制退役（S4）

- **范围**：设计档 §2.15 S4——**首项 = 批 1 补正：产品级 `thincoder-cli/.gitignore` 落位（内容与依据见设计档 §2.10）+ 探针验证 `git check-ignore` 命中**；
  R1–R9 · R16 判据删除 + 统一三档落位（档名 / 位置 / 执行根 / 扫描域两态——§2.5）+ 连带测试档与调用点处置（§2.14「测试」行 + VSC `package.json` `doc:check`——§2.8）+ `doc-impact.mjs` 措辞改写 + **本板块两档锚退场注记**（§2.5 尾条）+ 现行文档非命令形态脚本引用随批处置（§2.5 登记面）。
- **前置**：批 1 完成（硬依赖——见段首批序约束）；S2 必验记录在案（批 1 产出）。
- **触碰面**：设计档 §2.4 R1–R9 / R16 行 + §2.5 + §2.14「机检脚本（删改）/（新增）/ 测试（R1–R10 · R16 连带面）」行。
- **验收**：§3 = T-M5 · T-M6 · T-M9 · T-M10 · T-M11 · T-M17 · T-M20 · T-M21 · T-M22；三机检（仓根统一版）；两产品测试（调用点改指后全绿）；统一 `check-ledger` 默认清单 = 仓根 `docs/TODO.md` + `docs/TODO-archive.md`，无 SKIP 行（已随批 2 补做轮落地——本收正轮补记）。
- **依赖**：批 1（硬依赖）；本批为批 3 / 批 4 的前置（S 步连续——设计档 §2.15）。

### 批 3 · 提示词与文档（S5–S6）

- **范围**：设计档 §2.15 S5–S6——S5 提示词跨仓机制层退役（§2.7 分层处置）+ VSC `test/prompts-mirror-anchors.test.mjs` 跨仓断言段删（R10——单仓版双源守卫保留）+ 两产品 `AGENTS.md` 镜像约定段改写（R11）；S6 纪律句改写（R12–R15——含两产品 `docs/README.md` 自持段、提示词自持节两副本与端差句）+ R16 连带文档面退场注记 + 本板块两档复跑 V5 + 非命令形态引用登记面复核；
  **台账单仓化（补记——此前漏派工、由本收正轮补记；已实施 commit `c9f35f93`；设计档 §2.6）**：仓根 `docs/TODO.md`（项目级唯一活档）+ `docs/TODO-archive.md`（两产品归档并入 + 单仓化归档节）；原产品四档退役；仓根 `README.md` 增「Project ledger」节。
- **保留项（D14）**：提示词**产品内双源保留**——不做单副本合流（设计档 §2.7 P1–P3 / §2.12 D14）。
- **触碰面**：设计档 §2.4 R10–R15 / R16 行 + §2.7 + §2.14「提示词」·「文档」行。
- **验收**：§3 = T-M23 · T-M24 · T-M25 · T-M26 · T-M27（端差三落点）+ T-M17 / T-M21 复跑（设计档 §2.15 S6）；三机检；两产品测试（`prompts-mirror-anchors` 连带档全绿）。
- **依赖**：批 1（设计档 §4 表）；默认批序 1 → 2 → 3（S 步连续）。

### 批 4 · 验证收口（S7）

- **范围**：设计档 §2.15 S7——两产品全量测试 + 机检全域 + 发布链演练（dry-run / 预发——N5）+ 验收勾销（设计档 §2.11 判据表逐项 + §3 全表；勾销记录落批次档 §6）。
- **触碰面**：无结构改动面（验证批）；红项处置沿设计档 §2.15 回滚点面——不夹带新设计。
- **验收**：§3 = T-M2 · T-M3 · T-M6（全域）· T-M12 · T-M19 · T-M28 + 设计档 §2.11 判据表逐项；三机检（全域默认态）；两产品全量测试；发布链演练 exit 0。
- **依赖**：批 1–3（设计档 §4 表）。

---

### 收正轮 · VSC 文档引用面收口（补记——2026-09-13 · eng-designer）

- **范围修订（批 3）**：「R16 连带文档面退场注记」**已随本收正轮提前落地**（设计档 §2.5 尾条；§2.15 S6 行同步收正）——批 3 不再执行该动作、只保留复跑复核；批 3 其余范围（S5 提示词层 · S6 纪律句改写 · 非命令形态引用登记面复核）不变。
- **本轮实际处置面（41 → 全清零）**：① R8/R9 文档面 **15**（A1——T-VS2 / T-VS31–T-VS33；VSC `docs/design/LEDGER-SELF-CONTAINED.md` · `docs/requirements/ENGINEERING-MODE.md`）；
  ② R16 面 **7**（A1——T-CI-11；VSC `docs/design/AGENT-LOOP.md` · `docs/design/TESTING.md`）；
  ③ 台账单仓化引用面 **19**（A3——`docs/TODO.md` / `docs/TODO-archive.md` 引用；跨 11 档）。处置 = 退场注记 + 来源指针（不删行 / 不改编号；与「注销留行」惯例同形）。
- **终态证据（2026-09-13 复跑）**：VSC `npm run doc:check` = exit 0（41 → 0）；VSC `npm test` 快层 622 / 581 / 0 / 41 · `test:full` 622 / 622 / 0（doc-anchors 档零失败——T-DC6② 复锁 = 0）；仓根三机检（V5 悬空 0 · 宽度 273 档 0 违规 · V1/V2/V3 0 · 台账 0 违规）保持全绿。
- **仍留 S6（无门禁红）**：本板块两档 R 表 / §2.14 六档行号锚的**语义注记**（批 2 §5 发现 #3）——机器侧由 `MERGED_SCRIPTS` 并入映射兜底（V5 悬空 0）；随 S6 文档批复核并批（归属不变）。
- **边界**：本收正轮 = 文档面收口（VSC 文档 + 设计档 + 本段）——不改产品 `src/**`、不改测试档、不派 eng-coder；批次档仅追加本补记（§1–§5 一字未动）。

- **补记（续）· 仍留 S6（R16 面 CLI 侧）**：CLI 侧代表点（CLI `docs/requirements/AGENT-LOOP.md:306` · `PROMPT-SYSTEM.md:337（+ :413）`）——无门禁红（V5 悬空 0）；语义注记随 S6（设计档 §2.5 尾条已同步登记）。

### 批 3（S6）· 纪律句改写（文档面）· 补记（2026-09-13 · eng-designer）

**范围**：设计档 §2.15 S6 的**文档面**——R12 / R14 / R15 + R16 CLI 侧退场注记 + §2.14「>300 行档拆分审视」复核实测收正。提示词面（S5 / R10 / R11 / R13，含 R12 自持节两副本）＝ 并行轮，已落地（`b398884b`）；本轮零触碰提示词 / 产品代码 / 测试档。

**落点与处置（14 档）**：

- **R12**：两产品 `docs/README.md` 自持段 / 引用形态 / 自持边界 → 产品侧口径改写（**零 `跨仓` / `他仓` 键**——实测）；两引擎需求档自持节（CLI `requirements/ENGINEERING-MODE.md` §1.19 / VSC 同档 §1）→ 节级收窄注 + 隔离条款（F3 · F11 / F20）退役注 + 射程与引用条款（F1 / F2 / F10 / F13 / 两轴 / N2 / N4）产品侧改写（编号零改、条款语义保全）。
- **R14**：import 禁令删除（CLI §1.17 N1 · VSC §1 N5 / N9 · CLI 设计档 §2.22.1 / §2.22.9 / §2.30.3.1 · VSC `MCP.md` §4 · CLI `PROMPT-SYSTEM.md` §9.3）；「语义同源 / 各写一份」保留。
- **R15**：端差三落点收窄为产品侧对位（VSC `requirements/AGENT-LOOP.md` §16.3 N-CL4 · VSC `design/README.md` 镜像差异表行 3–6 · CLI `design/TESTING.md` §11.6）；「（CLI 侧）」注记与 V1 豁免**保留不动**（任务书保留项）。
- **R16 CLI 侧**：`requirements/AGENT-LOOP.md:306`（N-Q3 豁免句）· `PROMPT-SYSTEM.md:337（+ :413）` → 「已退场（整删——两仓合并批 2；删除记录 = §5）」注记（3 处；按 T-CI-11 语义面扫描——CLI 侧无漏点）。
- **§2.14 复核（⑤——父侧点名）**：拆分审视块按 `wc -l` 实测收正——`doc-consistency.test.mjs` 309 → **265**（回落 300 内、出列）· `ledger-surface.test.mjs` 333 → **334** · VSC `doc-anchors.test.mjs` 362 → **329** · VSC `context-parity.test.mjs` 364 不变；余三档仍 >300（软线）归后续触碰批复审。

**验收（自跑读数，2026-09-13）**：

- **仓根三机检 = exit 0 ×3**：`doc-anchors`（V5 悬空 0 ×2；VSC 域报告面 **0**）· `check-doc-width`（273 档 0 违规 · V1/V2/V3 新增 0）· `check-ledger`（2 档 OK · 0 违规 · SKIP 0）。
- **T-M24**：两 README「跨仓 / 他仓」**零残留**；提示词面（S5 后）四目录零残留。
- **T-M25 / T-M26**：提示词面「每仓一轮 / 跨仓批 / 跨仓 import」零残留；需求档「跨仓 import」零残留（余 1 处 = 合并板块需求档 F4 退役清单的科目名——自述性，非纪律句）。
- **T-M27**：三落点跨仓端差机制叙事清零（（CLI 侧）产品侧注记不计）。
- **T-M17 / T-M21 复跑**：V5 悬空 0；本板块两档零新增 V1 / V5 红。
- **额外修复（VSC 面死指针——实测发现 + 当场修）**：VSC `npm run doc:check` 首测 **FAIL**（阻断态 2 处 A2——`THINCODER_CLI_ROOT` 死指针：`design/AGENT-LOOP.md:1279` · `design/DOC-CODE-RECONCILE.md:98`；该符号全仓 `*.mjs` 零在册——批 2 随 R7 / R16 删除）。
  → 按在案形态（退场注记 + 来源指针）补注后复跑 **exit 0（0 命中）**；两档仅 S2 并入与收正轮（`308e1902`）触碰；**收正轮记录「doc:check exit 0」与其后未再触碰的实态不符**——差异归因请父侧复核（候选：收正轮自查时点 / 口径）。

**未动作 / 上报（逐条）**：

1. 本板块两档 R 表 / §2.14 六档行号锚**语义注记**（收正轮「仍留 S6」）——任务清单外，未动（§2.5 尾条已标「待父侧裁定」）。
2. VSC `design/AGENT-LOOP.md:1294`（AC-CI-1「T-CI-1~T-CI-11 全绿」）未见退场注记——VSC 侧收正轮遗漏候选（本轮未动）。
3. `prompts-mirror-anchors` 跨对端读的文档引用（CLI `AGENT-LOOP.md:308` · `PROMPT-SYSTEM.md:336`）——S5 已删其跨段，两处引用措辞待复核。
4. 非键 / 非点名残留面（动机段与判定句主体、设计档 LEDGER-SELF-CONTAINED 族等）——按 D10 随触碰口径保留；无门禁红。

**提交**：`50c907c3`（14 档；提交纪律 = 机检与提交分离——先跑、绿了再单独提交）。本补记随第二批提交。

### 批 3 · 收尾轮（四项遗留收口）· 补记（2026-09-13 · eng-designer）

**范围**：四项遗留——① 六档行号锚「语义」退场注记（批 2 §5 发现 #3 遗留）· ② VSC 设计档 `AGENT-LOOP.md:1294` T-CI-11 补注 · ③ `prompts-mirror-anchors` 跨对端读的文档引用措辞复核 · ④ §2.14 行数对账收正 + A2 注记归因校准。**零触碰**：产品代码 / 提示词 / 测试档 / 编号。

**① 六档锚语义注记（设计档 `thincoder-cli/docs/design/TWO-REPO-MERGE.md`——不删行、不改编号）**：
- §2.4 **R1–R9 行末** → 退场注记 + 来源指针（`已退场（六档坐标 as-of——并入仓根统一脚本；两仓合并批 2；删除记录 = 批次档 §5）`——9 行）；机器侧 `MERGED_SCRIPTS` 并入映射继续兜底。
- §2.14「**机检脚本（删改）**」行 → 同式注记（档目 as-of）；**§2.14 测试行实测收正**：VSC `test/prompts-mirror-anchors.test.mjs` → `155 → **145（Δ −10）**`（差额 = 可删跨仓面实测仅 12 行、**守卫与常量面**（单仓版 ③/⑤/T-DC16 + ⑨-3）为设计**保留项**——批次档 §5 批 3 · S5 发现 #2 口径）。
- §2.5：表「现状」列（两份实现）· 定案「档名」条（并入已落地）· 解析语义段（`resolveFile` 坐标）→ 三处加注；§2.5 尾条「仍留 S6」→ **收口重写**；R16 行 + §2.5「R16 面」bullet → 计数同步（7 处 + 收尾轮补 3 处）。
- 设计档**变更记录补 1 行**（四项收口）。**需求档（`thincoder-cli/docs/requirements/TWO-REPO-MERGE.md`）复扫 = 零已删档坐标（无注记对象）**——唯一 `scripts/check-ledger.mjs` 引用指向存活统一版（L3③ 在册）。

**② VSC T-CI-11 面（`thincoder-vscode/docs/design/AGENT-LOOP.md`）**：`:1294`（AC-CI-1「T-CI-1~T-CI-11 全绿」）补注「T-CI-11 已退场（整删——两仓合并批 2；删除记录 = §5）」。另**同语义面残注校准 2 处**（超任务点名——依据 = 设计档 R16 行「按 T-CI-11 语义面扫描」在案口径）：`:1276`（「现体 = 兄弟仓 CLI 源在位」句在批 2 后已失真 → 注「该残部已退场（整删——批 2…§5）」）· `:1298`（AC-CI-5 残部同注）。

**③ 跨对端读引用复核（清单：句 / 改法 / 因）**：
- CLI 需求 `AGENT-LOOP.md:308`「同款 = VSC `test/prompts-mirror-anchors.test.mjs（VSC 仓）`（同款兄弟仓读 + `THINCODER_CLI_ROOT` 覆盖 + fail-closed）」→ 加注「该跨仓读面已退场（段删——批 3 · S5（R10）；现体 = 单仓版双源守卫：本端同名集合相等 + 本端镜像节引用可解析；…§5）」。因 = S5 删其跨仓段后该句按旧形态描述已失真。
- CLI 需求 `PROMPT-SYSTEM.md:337`「VSC 侧既有跨仓只读锚测试（`prompts-mirror-anchors`——读兄弟仓 `../thincoder` 逐字对照）」→ 同注（N-P1 登记豁免句）。
- VSC 设计 `AGENT-LOOP.md:1280`「同 `test/prompts-mirror-anchors.test.mjs:21,30-34` 同款」→ 同注（该同款跨仓读面已退场——段删，批 3 · S5（R10））。因 = 同一「跨对端读」引用面（超任务点名，按 ③ 口径「复核并按需」补）。
- **复核未动**（判定 = 历史 / as-of 记录，非现行断言）：CLI `design/ADVISOR-CONVERGENCE.md` §13.5 勘察实证行（as-of 2026-09-11）· CLI `design/PROMPT-SYSTEM.md` 各批设计记录 · VSC `design/PORTABILITY.md` / `TESTING.md` 批记录面——按「历史 AC / as-of 行留痕不改写」分界保留。

**④ A2 注记归因校准 2 处**：VSC `AGENT-LOOP.md:1279`（「该口已退场——批 2」→「批 2；**末载体随批 3 · S5（R10）移除**」）· `DOC-CODE-RECONCILE.md:98`（补「`THINCODER_CLI_ROOT` 末载体随批 3 · S5（R10）移除」）——依据 = 批次档 §5 批 3 · S5 补记（该符号最后代码载体 = `prompts-mirror-anchors.test.mjs:26`，由 R10 / S5 移除——git 实测复核在案）。

**验证（写后复跑——先跑绿、后提交）**：仓根三机检 = **exit 0 ×3**（V5 悬空 0 ×2；宽度 273 档 0 违规 · V1/V2/V3 新增 0；台账 2 档 OK · 0 违规）；VSC `npm run doc:check` = **0 命中（阻断态，exit 0）**；VSC `test/doc-anchors.test.mjs` full = **16/16 绿**（含 T-DC6② 真仓锁）。提交 = **`8e903dfa`**（5 档；机检与提交分离）。本补记随第二批提交。

**边界 / 未做**：零回退动作；除上列 5 档零触碰；批次段 §1 / §3–§6 零触碰。超任务点名的补面（②残注 2 处 · ③ `:1280`）如父侧判越界 → 可经 `8e903dfa` 整档回退。

## §3 设计评审（评审子 agent 自写）

> **父侧代写打标**：评审者（review #1 · round 1 · 2026-09-13）的 `batch_segment` 写入被拒——
> 本档当时缺 `## §3` 骨架头（结构原因已修）。本段 = 主 agent **逐字转录**自评审报告，非评审者自写。
>
> **节号 as-of 说明**：下表（轮次 1）内的 `§a.b` 引用为**拆档前**（三层同档）节号——2026-09-13 需求层拆档后，原 §1.x 逐条迁入
> `docs/requirements/TWO-REPO-MERGE.md`（§1 总体需求 / §2 功能性需求 / §3 非功能性需求 / §4 范围边界）；原 §2.x 及以后**零位移**。
> 表内节号不逐条改写（留痕——下游按节名对位，不按号）。

### 轮次 1（评审子代理）

**核验边界声明**：评审域 = `docs/design/TWO-REPO-MERGE.md` 全文 + Project Guide（AGENTS.md）+ 文档总地图；
未声明独立项目标准档（方法论合规按 AGENTS.md + 地图判）。该档事实基线 B1–B12 与 R1–R14 行级落点
全部指向评审域外文件/命令——本评审**无法独立核验**（下表涉此者标「未验证」）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements / Document ownership | 🔴 | 同一机制两处不相容处置且未消解：§1.2 F4（`:32`）把「提示词双副本」列入「跨仓机制全线退役」，§2.7（`:203`/`:215`）与 D14（`:281`）判定「单副本在 phase 1 不可实现」、保留产品内双源、跨产品收敛归 phase 2；F4 行未修订。该条状态两说（§2.12:264 称 Q1–Q7 已定案、D14 列「已定案」表内 vs §2.15 S5:321「待 Q7 裁定后执行」、§4:377 批 3 依赖「Q7 裁定」），且 S5 动作写「提示词合流」而 D14 明禁单副本合流。验收侧：T-M5（`:341`）挂 F4 却只覆盖 R1–R9，F4 的提示词要素无用例。 | 批准前消解，二者取一：(a) 修订 F4 措辞，把「提示词双副本」限定为「跨仓层退役」并把用户裁定落进 §1.2 + 变更记录；或 (b) 若坚持字面单副本，须另立需求、不在本批。并按 D14 重写 S5 / §4 批 3 的动作与依赖，补 F4 提示词要素的验收用例。 |
| 2 | Requirements coverage | 🟡 | F6 两要素在实施步骤（§2.15 S0–S7，`:312-325`）无落点：(a) 旧 VSC 仓「归档」动作（T-M7:343 却以「归档只读可达」为预期输出）；(b) VSC `package.json` `repository` 必须继续指向旧仓——迁移中极易被顺手改为新仓，设计未写成显式约束。 | S3 或新增一步写明归档动作及其不可逆性处理（N4）；写明 `repository` 保持指向旧仓的硬约束，由实现批核对 + T-M7 校验字段值。 |
| 3 | Requirements coverage | 🟡 | F4 列名的「端差登记」（§1.1:20）在 §2.4 退役清单 R1–R14 中无对应行、§3 亦无用例——存在漏退可能。 | 补一条 R 行（含行级落点与处置），或注明被哪条 R 吸收，避免「列名但无落点」。 |
| 4 | Acceptance criteria | 🟡 | F4 的 R10–R14（自指防护 / 提示词双副本 / 各仓自持纪律句 / 每仓一轮 / 禁跨仓 import）无用例：T-M5（`:341`）只检 `PEER_*`/`SIBLING_NAMES`/`domain-out`，T-M20（`:366`）只含 R7/R10。 | 每条 R 至少一条可观测用例；改写/删除类用检索式验收（如纪律层提示词与 `docs/README.md` 内「跨仓」「他仓」「禁跨仓 import」残留为零）。 |
| 5 | Clarity / Affected files | 🟡 | 统一机检脚本无确定落点：§2.14:303 称「位置随 §2.5 设计」，而 §2.5（`:157-164`）只写「收为一份」未给位置，文件名又「待实施批定」。与之相抵的是 §2.8:224-225 称两产品门禁链「原样」在子目录运行——若统一脚本落合并仓根，两产品 `package.json` 的 doc:check 命令必须改，且扫描域若含另一产品文档则两产品发布门禁相互牵连（与 F2「互不触发」/N5 有张力）。 | 定死三件事：统一脚本存放位置、两产品各自调用方式、每次调用的扫描域（按产品隔离 or 全域）；据此修正 §2.8 的「原样」与 §2.11 的「全域零红」口径。 |
| 6 | Document state inconsistency (R7a) | 🟡 | Q7 状态自相矛盾：§2.12:264 头句「用户对 Q1–Q7『按倾向走』」+ D14 列「已定案」，而 §2.7:215、§2.12:283-284、§2.15:321、§4:377 均按待裁定处理。 | 统一为一种状态：已裁定则删「待裁定/需复核」措辞与派工依赖、把裁定写进 F4/D14 与变更记录；未裁定则 §2.12 头句不得称 Q7 已定案。 |
| 7 | Clarity (doc hygiene) | 🟡 | 内部交叉引用错指章节：§2.4 R11（`:143`）「见 §2.8」、R10（`:142`）「随 §2.8 双副本合流一并处置」——§2.8 是「发布链承载」（`:220`），提示词处置在 §2.7（疑为变更记录所述 §2.7 改写后编号漂移）。 | 修正为 §2.7，并顺检全文其余 §-引用。 |
| 8 | Affected-file size annotations (criterion 8) | 🟡 | §2.14（`:299-310`）未给任何被改源码/测试档的当前行数与预期 delta（六个 `scripts/*.mjs` + `test/prompts-mirror-anchors.test.mjs`；纯 .md 豁免）；而 §2.5:157 要两份脚本「收为一份」——该档自身引用显示 VSC `check-doc-anchors.mjs`（`:139`，落点 `:303/:311/:331`）≥331 行、CLI `check-doc-width.mjs`（`:137`，落点 `:49/:257/:265`）≥265 行，合并结果有触碰 300 / 500 档的风险而无 split plan。 | 逐档补「当前行数 + 预期 delta（`≤±N`）」；统一脚本若 >300 行须先做主动拆分评审、>500 行必须拆分（硬上限，无豁免通道），并在设计中给出拆分方案。 |
| 9 | Evidence accuracy (fact baseline) | 🟡 | B2（`:65`）称「运行期唯一共享产物 = 用户级 `~/.thincoder/config.json`」；但 AGENTS.md 明载快照存储 `~/.thincoder/checkpoints/{cwdHash12}/`「与 VS Code 端**同存储同格式**，快照跨端互通」，且 `src/log.mjs` 共享 `~/.thincoder/logs/`——共享运行期状态不止 config.json；N1 与 T-M12（`:353`）的「行为不变」也只验 config.json。 | 更正 B2 枚举（「仓际接口为零」的结论可保留），其余共享运行期状态纳入 N1 判据/用例，或明示「不涉迁移、无需验证」。 |
| 10 | Feasibility / verification item | 🟡 | D4 与 §2.3（`:122-123`）「subtree 不搬 tag ⇒ 4 条同名 tag（B7）不产生冲突」依赖 fetch 行为；`git subtree add` 内部走 `git fetch <repo> <ref>`，fetch 默认会随下载历史自动跟随 tag（该语义未在评审域内验证，标未验证）。B8 仅记「干跑退出码 0（5.0s）」、未记命令。 | 在档内/批次档记录干跑**确切命令**与观察到的 tag 行为（是否取到、是否同名拒绝）；若有风险，写明对策（`--no-tags`，或改为从本地 mirror/bare 仓 `subtree add`）。 |
| 11 | Clarity / affected documents | 🟡 | 受影响文档写法不可执行：§2.14:306「纪律权威需求档（R12/R13/R14 句改写）」未点名文件与节；§1.4（`:50-52`）引用需求号 F11–F14「各仓自持」「跨仓内容纪律」但无来源文档指针（跨文档引用缺 symbol 锚，不合本项目文档规范）。 | 点名到「文件 + 节」（如 `requirements/ENGINEERING-MODE.md` §1.19 等，归属未验证）并核对需求号归属后写入 §2.14。 |
| 12 | Rollback verifiability (N4) | 🔵 | §2.15 S0（`:316`）「两仓全量备份 / 快照」未说明备份形态（checkpoint 工具快照？mirror clone？），而 T-M18（`:364`）以「可回退至上一步快照、仓库状态一致」验收。 | 写明备份机制（如 `git clone --mirror` 到仓外目录 + 未跟踪产物另行归档）与一次恢复演练基线。 |
| 13 | Test coverage (R10) | 🔵 | §2.4 R10（`:142`）/§2.14:304 删除 VSC `test/prompts-mirror-anchors.test.mjs` 的 R10 段（该测试实际断言内容未在评审域内，未验证）；而 §2.7 保留产品内「权威模板 ↔ 运行期落地物」双源，设计未说明单仓后由什么守住该双源关系。 | 明示剩余断言是否保留、是否需单仓版校验；若刻意不设守卫，写明理由（避免设计自身所指「语义保证在无红测下蒸发」在别处重演）。 |
| 14 | Traceability / scope limits | 🔵 | §3 用例「对应需求」列混入事实号（B4/B5/B7/B10/B12——T-M9/T-M11/T-M13/T-M14/T-M15），与 §3.1 头注「每条功能性需求至少一个用例」的对账口径不一致；另：B1–B12 与 R1–R14 行级落点均在评审域外，本评审**未能独立核验**（标未验证）。 | 用例表归位到 F/N 号（B 号另列佐证）；把 B/R 的取证命令与输出落进批次档，实施前复核。 |
| 15 | Dev-workflow note | 🔵 | D9（`:276`）/§2.2 使 CLI 产品目录由 `<ws>/thincoder` 变为 `<ws>/thincoder/thincoder`：以 cwd 为键的本机状态（`~/.thincoder/checkpoints/{cwdHash12}` 等，见 AGENTS.md「Checkpoint 事故恢复 → 存储」）在该目录下重新开账；产品运行行为不受影响，但自举开发的历史快照/索引不随迁。 | 迁移前如需保留该目录下本地状态，做一次导出/迁移说明；或在 N1 的「零行为回归」中明示此项不属产品行为。 |

**计数**：🔴 1 · 🟡 10 · 🔵 4（共 15 条）。范围项（criterion 6）：未见 scope creep——D11 CLI CI 明确标「建议做、非 F 级」，§2.13 phase 2 明确只留通道不实施，边界处理合格。

VERDICT: changes-required

---

### 轮次 2（评审子代理）

| # | 类别 | 严重度 | 发现 | 建议 |
|---|---|---|---|---|
| 1 | F4 覆盖 / 受影响面 | 🔴 | §2.14「测试」行称「两产品其余测试**不动**（机检调用点的路径改指除外）」（design:269），与实况不符——R1–R9 判据删除将使多档测试失红/失去对象：CLI `test/doc-anchors.test.mjs:21`（import `resolvePeerRoot`——R1 删除项）与 `:291`（钉死 V4 跨仓命中——R5 删除项）；CLI `test/doc-consistency.test.mjs:226`（T-LS35–37 V4 用例）；CLI `test/ledger.test.mjs:145`/`:155`（跨仓 L4 必报——R6 删除项）；VSC `test/doc-anchors.test.mjs:90`/`:116`（T-DC3 缺仓域外 + 自指 fail-closed——R7 删除项）；VSC `test/doc-consistency.test.mjs:177`（T-VS31–33 V4——R8 删除项）；VSC `test/ledger-check.test.mjs:55`/`:74`（跨仓 L4 必报——R9 删除项）；另有 VSC `scripts/reconcile-lookup.mjs:19` import 自 `./check-doc-anchors.mjs`（该档并入仓根统一版后即被删）——R 清单与 §2.14 全未覆盖。后果：N1（requirements:40）/ T-M2（design:308）「两产品各自全绿」按稿不可达；T-M22「残余为零」（design:315）仅检索提示词镜像档，同类断言在其余测试档仍在。 | 将 R10 对 `prompts-mirror-anchors.test.mjs` 的「删跨仓断言段」处置模式扩展到上述各档（含 reconcile-lookup.mjs 的移仓/改指），逐档写入 R 清单 + §2.14 + 批 2/批 3 步骤；实施前逐档确认失红面与净 delta。 |
| 2 | 文件大小标注（criterion 8） | 🟡 | 受影响表未给上述被改文件的行数与 delta：`thincoder-vscode/test/doc-anchors.test.mjs`（实测末行 363——>300 行档位）· `thincoder-cli/test/doc-consistency.test.mjs`（实测末行 310——>300 行档位）· 其余各档同缺；`thincoder-cli/scripts/doc-impact.mjs`（§2.4 明言「随批改写措辞即可」——design:114）连行都未入表。 | 逐档补现况行数 + 预计 delta（净删为主）+ >300 行档的拆分审视结语；`doc-impact.mjs` 补入「机检脚本（删改）」行。 |
| 3 | 受影响面 / 文档处置 | 🟡 | 两产品 `AGENTS.md` 未入 §2.14 文档行（design:271）与 R 清单：CLI `AGENTS.md:21` / VSC `AGENTS.md:15`「镜像提示词约定」段＝跨仓机制叙述（byte-identical 约束已取消 / 「两端各自照抄」/ VSC 侧带 `thincoder-cli/scripts/…`、`thincoder-cli/docs/…` 路径指针）——按 F4 收窄口径（requirements:31）与 R11 需明示处置，否则该段在合并后仍以「本仓库 / thincoder-vscode」仓别键存活。 | 两档 AGENTS.md 纳入 R11/R12 处置面 + §2.14 文档行：写明改写范围（镜像约定段）或「不动 + 理由」。 |
| 4 | 统一脚本语义（§2.5） | 🟡 | §2.5 统一脚本定案未交代 VSC 独有 V1 豁免——`thincoder-vscode/scripts/check-doc-width.mjs:100-104`/`:129`（含「（CLI 侧）」注记的行/引用 V1 豁免，§2.22.7 VSC 独有语义）；若随 R5/R8 一并未处置而直删，冻结文档中存量「（CLI 侧）」引用将转 V1 红，与 N6（requirements:45）/ T-M6「全域零红」相抵。 | §2.5 与 R 清单写明该豁免去留：保留 ⇒ 说明单仓版语义（产品域内跨目录引用规则）；删除 ⇒ 说明存量文档与 V1 基线的处置路径。 |
| 5 | 验收覆盖 | 🟡 | R15（端差登记，design:107）有处置但无验收用例：T-M22–T-M26（design:315-319）逐条对应 R10–R14，其检域不含 R15 落点（VSC `docs/requirements/AGENT-LOOP.md` N-CL4 / VSC `docs/design/README.md` 镜像差异表 / CLI `docs/design/TESTING.md` §11.6）。 | 补一条检索式用例（或把 R15 落点并入 T-M24 检域）——列表项「零残留」应可验。 |
| 6 | 需求↔设计口径 | 🟡 | F5（requirements:32）「文档…单仓化：不再有「本仓 / 他仓」键」vs D10（design:245）/ §2.6（design:143）存量约 1031 处「（X 仓）」注记「停新增、留痕档冻结、现行档随触碰改写」——阶段一不交付 F5 字面；对照 F4 已有「收窄注记」（requirements:31），F5 缺同款注记。 | 按 F4 同款在 F5 记阶段/收窄口径（或声明 F5 的「键」指判据/机检面），使需求字面与交付一致。 |
| 7 | 范围状态 | 🟡 | CLI CI 口径不一：§2.9（design:208）「本档建议做，但记为可选项，非 F 级需求」vs D11（design:246）「已定案——顺路补齐」——实施批对是否交付无定论，且 §3 无对应验收用例。 | 统一为「已定案执行；非 F 级需求」（或写明可跳过条件），并配一条验收口径。 |
| 8 | 验收覆盖 | 🔵 | N6（requirements:45）要求「需求档 + 设计档」两档纳入机检，T-M21（design:342）输入只写「本档」——需求档未被该用例覆盖。 | T-M21 输入扩为「本板块两档」。 |
| 9 | 数值核对 | 🔵 | 行数标注 4/6 与实测总行数（含末尾空行）差 1：CLI `scripts/check-ledger.mjs` 标 354 / 末行 355；VSC `scripts/check-doc-anchors.mjs` 标 411 / 末行 412；VSC `scripts/check-doc-width.mjs` 标 365 / 末行 366；VSC `scripts/check-ledger.mjs` 标 317 / 末行 318；另三档核对一致（`doc-anchors.mjs` 299 · `check-doc-width.mjs` 367 · `prompts-mirror-anchors.test.mjs` 155）——不影响 300/500 档位判定。 | 重标注时统一计数口径（wc -l）。 |
| 10 | 落点归属 | 🔵 | R12 族「各仓自持」句在提示词层同样存在（CLI `src/prompts/discipline-normal.md:38` / VSC `src/prompts/discipline-normal.md:35`），但 R12 行落点（design:104）未列提示词副本，§2.14（design:271）却把该档挂在 R13 名下（R13 句「跨仓批 / 每仓一轮」实际在 discipline-engineering）。 | 落点与编号对齐（discipline-normal 归 R12 或注明合并处置）；T-M24 检域已覆盖该档。 |
| 11 | 验收可执行性 | 🔵 | T-M8（design:314）「`git blame` 抽查跨搬迁档｜归属连续（必要时 `--follow`）」未钉死命令；subtree graft 后 blame / `log --` 的连续性正是 N2 风险点（§2.3 已记「追溯须 --follow」）。git 语义细节本评审未实测（unverified）。 | 把 graft 后 `git log --follow` / `git blame` 抽查列入 S2 前置实测项并记录基准，供 T-M8 判定。 |
| 12 | 本档锚（V5） | 🔵 | 本板块两档自身含指向批 2 将删档案的行号锚（design:93-101 R 表落点、design:267 脚本行）；合并后其可解析性取决于统一脚本最终命名/位置（§2.14 为占位 `<name>.mjs`，design:268）——命名不同则该域 V5 报悬空（T-M17，design:338）、S 步骤表无对应消除动作；命名相同则文件存在性判据静默通过、而所指判据语义已变。 | 在 §2.5/§2.14 定名时同步声明本档锚处置（符号化引用或退场注记 + 来源指针），并把该动作写入 S4/S6。 |

**计数**：🔴 1 · 🟡 6 · 🔵 5（合计 12）。

VERDICT: changes-required

### 轮次 3（评审子代理）

**复核范围（轮次 3——交付验证）：** 轮次 1–2 全部 27 条发现（15 + 12）逐条对档复核——落点均在档；另做独立行级抽样实测（覆盖面 = 六档脚本判据坐标与 `wc -l` 行数 · 两产品各测试档坐标 · B2 / P1–P3 / §2.8 证据锚 · R16 连带文档锚 · 两产品全部脚本消费方扫描）——**全数吻合、无漏**，抽样点约 35 个；>300 字符单行仅表格行（豁免）。机器复跑（V1/V4/V5）本环境无 shell 未执行（由 S6 / S7 承载）。

> **父侧修字（主 agent · 2026-09-13）**：本句原形「实测约 35 处（A · B · C · D）」被 V2 计数-枚举判据报红（声明 35 ≠ 括号枚举 4）——**仅改措辞使声明与枚举不相邻，语义零改**（覆盖面仍为五类、抽样点约 35）。评审者原文口径见本轮变更对照。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Clarity / 受影响面（复核轮次 2 #1 残余） | 🟡 | R2 单仓化的**抽取面**消费者未入落点枚举：CLI `scripts/doc-anchors.mjs:173`「排除式 5②」（`token.split("/")[0] === PEER_PREFIX` ⇒ 跳判）——R2 已点名 `:32` / `:188-190`、R3 已点名 `:199`，唯 `:173` 无行；其行为面有钉死夹具 CLI `test/doc-anchors.test.mjs` T-V5-5 ⑦（`:139`「对端裸直引在抽取面外」）与计数断言（`:146-147`）——单仓化后该类 token 转「仓内相对路径」被判定，夹具期望需**重述**而非仅删（该档已列名、delta −25±10 可容纳；「实施前逐档确认失红面 / 逐档实测 delta」阀门已覆盖——不阻塞） | R2 行或 §2.14 该档补一句点名（排除式 5② + T-V5-5 ⑦ 夹具同批重述）；实施批按「PEER_PREFIX 全消费者」扫描而非按坐标清单 |
| 2 | Clarity / 证据精读 | 🔵 | §2.7 结论句括注「（缺档即抛错）」对 P1 所引槽位面不成立：CLI `src/prompt-overlays.mjs:18` 为 `catch { return "" }`**静默空载**（抛错面 = CLI `src/advisor.mjs:63-69` 与 VSC `src/advisor/main.mjs:66-71`）；「加载会同时断」结论不受影响（P3 打包边界已足） | 措辞微调（「缺档即空载 / 抛错——加载面断供」）或删括注；D14 不动 |
| 3 | Clarity / 连带文档面 | 🔵 | R16 连带文档面「§17 组」六坐标已逐点核验在位，但同档另有 T-CI-11**现行**语义叙述未入列：VSC `docs/design/AGENT-LOOP.md` `:1278-1284`（跨仓只读语义段）、`:1302`（§17.9 边界句）；`:48` 为变更记录行（as-of，豁免） | 无需扩坐标清单——实施批按语义面扫描；S7 / T-M6 全域机检兜底（残余即红灯） |

**计数**：🔴 0 · 🟡 1 · 🔵 2（共 3 条）。范围（criterion 6）：未见 scope creep——phase 2 只留通道（§2.13）、CLI CI 非 F 级已定案执行（D11）、R16 属 F4 判据家族。复核结论：轮次 1–2 全部发现落点均在档且与磁盘一致；轮次 3 追加面（R16 / 统一脚本定名 / 非命令形态登记）核验通过；未发现 🔴。

VERDICT: pass

## §4 用户批准（主 agent 记）

**2026-09-13 · 用户批准**（原文：「批准」）——设计链收口后批准：

- **批准对象**：需求档 `docs/requirements/TWO-REPO-MERGE.md` + 设计档 `docs/design/TWO-REPO-MERGE.md`（phase 1 目录合并）+ 本档 §2 实施任务书（四批编排）。
- **前置状态**：设计评审轮次 1–3（第 3 轮 **PASS**——🔴 0 · 🟡 1 · 🔵 2，三条已 Fixed）+ 修正轮逐轮落地并经主 agent 核验；三机检 exit 0 ×3。
- **设计凭证**：评审通过时签发（**值不落文档**——运行时态，实施 spawn 时由主 agent 携带）。
- **批准范围**：自批 1 起逐批实施（§2）；**批 1 内 S3b（旧 VSC 仓远端置归档/只读）为不可逆动作——到点单独请用户确认**，不随本批自动执行。
- **台账**：需求池条目 status `待设计` → `在途`（双引用已备）。

---

## §5 实施记录（eng-coder 自写）

> **父侧转录标记（主 agent · 2026-09-13）**：以下 §5 正文由主 agent 从 `_merge-backup\batch-5-section.md` **逐字转录**
> （eng-coder 的 `batch_segment` 因 S1 搬迁使绑定路径失效而被拒——见其次行注记）。除本标记外未改一字（唯 §5 的 4 条超宽非表格行已按其原句读折行——形态性收正、语义零改）。
> **§5 未写入（工具通道失败——批次档已随 S1 搬迁改路径）**：eng-coder 的 `batch_segment` 绑定目标 = 搬迁前路径
> `d:\teamcode\thincoder\docs\batches\2026-09-13-TWO-REPO-MERGE.md`（现不存在）→ 工具 fail-closed 拒绝。
> 本文 = eng-coder 自写的 §5 正文原文，**由主 agent 打标代录**（转录，未改一字）。

### 批 1 · 搬迁（S0–S3）· 实施记录（eng-coder 自写 · 2026-09-13）

**范围**：设计档 §2.15 S0–S3。**S3b 未执行**（旧 VSC 仓远端置归档/只读——不可逆，置前须用户确认；本批未触碰任何远端）。
**执行根**：合并仓根 = `d:\teamcode\thincoder`（原 CLI 仓目录原地改造，D9）。工作树实施前后均干净。

#### 一、提交清单（每步独立提交 = 回滚点）

| 步 | commit | 内容 | 回滚点 |
|---|---|---|---|
| 基线 | `406369f9` | 实施起点（主 agent 设计+记录档提交） | — |
| S0 | — | 无提交（备份 + 未跟踪产物清理均不入版本控制） | mirror 备份（见下） |
| S1 | `1d450d2d887b184203a2397f01eb6c42541e1aed` | `git mv` CLI 顶层 13 项 → `thincoder-cli/`（566 文件全 rename，0 insert/0 delete；`.gitattributes` / `.gitignore` 留仓根） | `reset --hard 406369f9` |
| S2 | `37cb1b34ae23a445e9b53b719a4543659ca333d3` | `git subtree add` 并入 VSC 历史（merge commit；parents = `1d450d2d` + VSC tip `40409b4`） | `reset --hard 1d450d2d` |
| S3 | `2b7274ccb3ec987871e4252ec5e23723b2bc82c6` | 仓根总览 `README.md` + 仓根 `.github/workflows/test.yml`（两产品各一 job）；原 VSC 工作流迁出子目录（3 files changed, +75/−12） | `reset --hard 37cb1b34` |

提交纪律：每步均 `git mv`/`git rm` 先行 → `git add <显式路径>` → `git status --porcelain` 核验「只含本批文件」→ `git commit --only <同一显式路径清单>` 单行原子提交。无 `git add -A`、无 `git commit -a`、无 git 工具裸 commit。

#### 二、S0 备份与清理（B12）

`git clone --mirror` 两仓至**合并仓根之外** `d:\teamcode\_merge-backup\`：

| 备份 | HEAD 核对 | tags | commits |
|---|---|---|---|
| `_merge-backup\thincoder.git` | `406369f9` = 迁移前 HEAD ✓ | 71 | 1441 |
| `_merge-backup\thincoder-vscode.git` | `40409b4` = 迁移前 HEAD ✓ | 34 | 807 |

**未跟踪产物清单与处置**（清单 + sha256 全量落 `_merge-backup\untracked\`）：

- **CLI 侧（归档 + 移除，158 项）**：根级日志 67（`tmp-*.log` / `_*.log` / `.tmp-*.log`）+ `.thincoder/tmp/tool-*.txt` 91（agent 工具临时输出）。处置 = 逐条判明性质（日志 / agent-tmp）→ 拷贝至 `untracked\cli\`（保留相对路径）→ 158/158 sha256 复核一致 → 自 CLI 仓根移除。移除后 `git status --porcelain --ignored` 空。
- **VSC 侧（仅列清单上报，16645 项，零动作）**：`.vsix` 18 · 根级日志 2 · `.thincoder/tmp` 94（含 1 个 `.log`）· `assets/candidates/` 16（未入库图标候选）· `node_modules/` 16515。性质均已判明、无「判不明项」；其未跟踪产物不随 subtree 进入合并仓（subtree 只搬已跟踪对象），旧 VSC 工作目录原地未动。

#### 三、S2 并入前必验项（副本仓干跑 · 命令与输出逐字）

**干跑仓 1**：`git clone d:\teamcode\_merge-backup\thincoder.git _merge-backup\_dryrun\cli` → 同 S1 搬迁 → 并入。命令与输出：

```
$ git subtree add --prefix=thincoder-vscode d:\teamcode\thincoder-vscode master
git fetch d:\teamcode\thincoder-vscode master
From d:\teamcode\thincoder-vscode
 * branch              master     -> FETCH_HEAD
Added dir 'thincoder-vscode'
(exit 0)
```

**① tag 行为实测**（`git tag -l` 并入前后对比）：

```
before = 71
after  = 71
fc tags-before.txt tags-after.txt  →  FC: no differences encountered
```

⇒ **fetch 未自动跟随 tag、无同名拒绝、无告警**（4 条同名交集 `v0.8.1/v0.8.2/v0.8.5/v0.8.10` 未产生冲突）。**对策候选（`--no-tags` / 改本地 mirror）实测亦安全但本批不需要**（见干跑仓 2）。

**干跑仓 2**（备选路线：bare mirror 源 + `fetch --no-tags` + `subtree add <commit>`）：

```
$ git fetch --no-tags d:\teamcode\_merge-backup\thincoder-vscode.git master
(无输出；tags 71 → 71)
$ git subtree add --prefix=thincoder-vscode 40409b448dd817b454a8789b913030b0e24aae7a
(exit 0；tags 71 → 71；tag 集合差集 = 空)
```

⇒ 备选路线同样安全，且结论与源形态（工作仓 / bare mirror）无关。

**② graft 追溯实测**（两干跑仓结论一致，正式仓复现一致）：

| 探针 | 结果 |
|---|---|
| `git merge-base --is-ancestor 40409b4 HEAD` | YES（VSC tip 可达） |
| `git rev-list --count HEAD` | 2250 = CLI 1441 + S1 1 + S2 1 + VSC 807（807 提交逐个可达；正式仓 +S3 = 2251） |
| `git log --oneline -- thincoder-vscode/` | 1 条（graft 提交）——符合设计档 §2.3 第 1 半句 |
| `git log --oneline --follow -- thincoder-vscode/package.json` | **空**（exit 0）——**与设计档「追溯须 `--follow`」不符，见发现 #1** |
| `git log --oneline --follow -m -- thincoder-vscode/package.json` | **234 条**（含 VSC 线 121 · CLI 线 111 · merge 2）——可达 T-M4 语义 |
| `git blame -L1,3 thincoder-vscode/package.json` | `^d27f773c package.json`（VSC 仓首个提交；跨 graft 归属连续） |
| `git log --follow --oneline -- thincoder-cli/src/log.mjs` | 6 条（含 S1 搬迁提交 + 原提交）——CLI 侧跨搬迁归属连续 |

**正式仓执行**（源 = 设计档原形的 VSC 工作仓）：

```
$ git subtree add --prefix=thincoder-vscode -m "chore: two-repo merge S2 - ..." d:\teamcode\thincoder-vscode master
git fetch d:\teamcode\thincoder-vscode master
From d:\teamcode\thincoder-vscode
 * branch              master     -> FETCH_HEAD
Added dir 'thincoder-vscode'
(exit 0；tags 71 → 71；状态干净)
```

#### 四、验收结果（设计档 §3 本批必过项）

| 用例 | 结果 | 证据 |
|---|---|---|
| T-M1 | ✅ | `git ls-tree --name-only HEAD` = `.gitattributes` · `.github` · `.gitignore` · `README.md` · `thincoder-vscode` · `thincoder` |
| T-M4 | ⚠️ 部分 | 语义达成（VSC tip 可达 + 2251 提交可达 + `--follow -m` 234 条），但**设计档所写命令 `git log --follow -- thincoder-vscode/package.json` 实测返回空**——见发现 #1（工作命令形态 = `--follow -m`） |
| T-M7 | ✅ | `thincoder-vscode/package.json` `repository.url` = `https://github.com/xinbo-tech/thincoder-vscode.git`（未改，F6）；远端归档部分 = S3b 未执行 |
| T-M8 | ✅ | blame 跨 graft/搬迁均归属原提交（VSC `^d27f773c package.json`；CLI `0b37f4219 src/log.mjs`），无整档归并搬迁提交 |
| T-M13 | ✅ | 两产品 `.thincoder/` 各自保留：`checklist.md`（cliBlob 9795a0a8 / vscBlob 4ed445bf）· `skills/code-review.md`（92d5b49f / e90df26c）——同名不同内容并存、互不覆盖 |
| T-M14 | ✅ | `git tag -l` = 71 条、重复 0；VSC 34 tag 未搬入（无冲突） |
| T-M15 | ✅ | 合并仓根 `git status --porcelain --ignored` 空（CLI 未跟踪产物已清理，不进入合并仓） |
| T-M16 | ✅ | 对账（路径映射 + blob 哈希）：CLI 568 项 + VSC 521 项 → 期望 1088；**missing 0 · content-changed 0**；新增恰 2 个（仓根 `README.md`、仓根 `.github/workflows/test.yml`）；1 项**授权迁移**（`thincoder-vscode/.github/workflows/test.yml` → 仓根，内容按 §2.9 重写） |
| T-M18 | ✅ | 两 mirror HEAD 与迁移前一致（`406369f9` / `40409b4`），tags/commits 齐全；归档未跟踪产物 158/158 sha256 复核一致 = 可恢复基线 |

**两产品门禁链（迁移前基线 ↔ 迁移后，同条件：先清 `%TEMP%` 残留再跑）**：

| 步骤 | CLI 前 | CLI 后 | VSC 前 | VSC 后 |
|---|---|---|---|---|
| `npm run lint` | exit 0（314 文件 OK） | **同** | exit 0（296 文件 OK） | **同** |
| `node scripts/doc-anchors.mjs` / VSC `--strict` | exit 0（候选 8684 · 悬空 0 · 域外 0） | **同** | exit 0（命中 0 · 域外 0） | **同** |
| `node scripts/check-doc-width.mjs` | exit 0（140 文件 · 违规 0） | **同** | exit 0（133 文件 · 违规 0） | **同** |
| `node scripts/check-ledger.mjs` | exit 0（两档 OK · 0 违规） | **同** | exit 0（两档 OK · 0 违规） | **同** |
| `npm test`（快层） | 611 / pass 552 / fail 0 / skip 59 → exit 0 | **同** | 627 / 585 / 0 / 42 → exit 0 | **同** |
| `npm run test:full` | 611 / 607 / **fail 4** / skip 0 → exit 1 | **同**（fail 4 同型） | 627 / 624 / **fail 3** → exit 1 | **同**（fail 3 同型） |
| `npm run test:integration` | 23 pass / fail 0 → exit 0 | **同** | 29 / 28 / **fail 1** → exit 1 | **同**（fail 1 同型） |

**测试红项性质（既有环境问题，非本批引入，见发现 #4）**：8 处失败**全部**是 Windows 上 `rmSync(recursive)` 删 `%TEMP%` 内含只读 `.git` 对象的临时目录抛 `EPERM`（teardown 钩子失败），**断言失败数 = 0**；迁移前后 fail 数、pass 数、skipped 数逐项一致。

#### 五、发现与偏差（供父侧/设计者裁决）

**#1（🟡 设计档与实测不符 · T-M4 命令形态）**：`git subtree add` 的 graft 提交使设计要求路径在**两个父提交中都不存在**（父 1 = S1 提交，父 2 = VSC tip 的原布局），
故 `git log --follow -- <子目录路径>` 在**未给 `-m`** 时不做合并差异的改名检测 ⇒ **输出为空**（干跑仓 1/2 与正式仓三处一致复现）。
设计档 §2.3「追溯须 `--follow`」与 T-M4 输入命令据此**不成立**；工作形态 = `git log --follow -m -- <path>`（234 条，含 VSC 线）或 `git blame`（无需附加参数）。
历史**并非不可达**（2251 提交可达、blame 连续），故不构成回滚级阻塞；建议由设计者在 §2.3 / §3.1 T-M4 · T-M8 记录该工作命令形态（本批未改设计档——设计档写权在 eng-designer）。

**#2（🟡 结构后果 · 仓根 `.gitignore` 锚定漂移）**：CLI 原 `.gitignore` 成为仓根档后，其两条含斜杠规则 `.thincoder/index/` / `.thincoder/tmp/` 锚定在**仓根**；
实测 `git check-ignore -v thincoder-cli/.thincoder/tmp/x.txt` → **未命中**（exit 1），建探针文件后 `git status --porcelain` 报 `?? thincoder-cli/.thincoder/tmp/`（可被误提交）。
对照：VSC 产品自带子目录 `.gitignore`，`thincoder-vscode/.thincoder/tmp/w.txt` 命中其 `.gitignore:7` ⇒ VSC 侧不受影响。
**本批未自造修法**（§2.14 仓根级清单只列 `.gitattributes`/`.gitignore`，无产品级新增项）；候选修法：(a) 增产品级 `thincoder-cli/.gitignore`（§2.10「各产品子目录内可保留自有规则」已允许）；(b) 两条规则改非锚定形态（`**/.thincoder/index/` 等）。

**#3（🟡 §2.9「全域文档机检 step」未落地 · 转批 2）**：§2.9 要求仓根工作流增设「全域调用 step（统一脚本扫合并仓全域）」。
统一三档脚本按 §2.15 = S4（批 2）落位，本批此刻仓根 `scripts/` 不存在 ⇒ 该 step 若现在加即**knowingly 红**（违反「三机检 + 测试失败项不得带病推进」）。
本批按任务书 S3 落地**两产品各一 job**（CLI job 按 D11 补齐：`npm install` / `npm test` / `npm run lint`，与 VSC job 同构），**未加全域 step**——建议批 2（S4）落统一脚本同批补该 step（T-M28 为批 4 验收）。

**#4（🔵 迁移前既有环境红 · 非本批引入）**：CLI `test:full` 4 红 / VSC `test:full` 3 红 + `test:integration` 1 红，全部为 Windows `%TEMP%` 内只读 `.git` 对象的 teardown `EPERM`；
且**残留目录会污染后续轮次**（`ledger-*/doc-impact-*` 残留被 `discoverFamily` 当作同级项目 → 追加 `ERR_ASSERTION` 假红——已复现并定位）。
基线对照均在清残留后取得，前后一致。修复属产品测试面（F7 禁改运行逻辑；测试档改属批 2 R 计划面）⇒ 本批不动、如实上报。

#### 六、明示未做项

- **S3b**（旧 VSC 仓远端置归档/只读）：**未执行**（不可逆 + 设计内置用户确认门）。未 push、未改任何远端设置、未改旧 VSC 仓工作目录。
- **批 2–4 面**：R1–R9/R16 判据删除、统一三档脚本落位、提示词/文档纪律句改写、仓根全域机检 step、全量发布链演练——均未触碰（`thincoder-cli/scripts/*` 与 `thincoder-vscode/scripts/*` 保持原样，判据零改）。
- **`thincoder-vscode/package.json` 的 `repository`**：未改（T-M7 ✓）。
- 本地为跑门禁在 `thincoder-vscode/` 执行过一次 `npm install`（`package-lock.json` 哈希 9b901c7c… 前后一致、git status 干净）；`node_modules/` 为该产品自有且被忽略，不进版本控制。


---

### 批 2 · 机制退役（S4）· 实施记录（eng-coder 自写 · 2026-09-13——前轮上下文崩溃后收窄续跑轮）

**范围**：设计档 §2.15 S4；批 2 验收 = §3 T-M5 · T-M6 · T-M9 · T-M10 · T-M11 · T-M17 · T-M20 · T-M21 · T-M22。
**执行根**：合并仓根 `d:\teamcode\thincoder`；产品域 = `thincoder-cli/` · `thincoder-vscode/`。
**前轮已在案提交**：`66a1962a`（仓根统一三档 + 六档产品脚本退役 + 调用点改指）· `57087021`（产品级 `.gitignore` 补正）。

#### 一、本轮提交（每次报实际 hash）

| 序 | commit | 内容 |
|---|---|---|
| A | `f7331c21` | S4 收尾——统一脚本 `main` 契约恢复（`{cwd, log, env}` 直驱 + `--json` 五字段投影）· R8/R9 连带测试档单仓化（两档整档重写·跨仓段删）· T109 夹具确定化（幽灵链）· T-M5 注释面收正（`PEER_*` / `domain-out` 字面零残留）；13 files, +204/−391 |
| B | `90f1222` | CI 仓根 `.github/workflows/test.yml` 增设全域机检 job `docs`（三机检·全域态）——批 1 §5 发现 #3 收口；1 file, +11 |

提交纪律：`git add <显式路径…>` → `git status --porcelain` 核验 → `git commit --only <同路径…>`；`thincoder/docs/TODO.md`（父侧台账未提交改动——需求池 +1 条）**不入本批提交、未触碰**（留待父侧收口）。

#### 二、4 红修法与理由（任务书 4 红，实况全清——另清 2 个未列入的改指缺失档红）

**红 1–3 · VSC `test/doc-anchors.test.mjs` T-DC6 / T-DC12 / T-DC13**（根因同一）：
统一版 `scripts/doc-anchors.mjs` 丢了两项**既有公共契约**——(a) 输出直走 `console.log`，未收注入 `log`
（旧 VSC 契约为 `main(args, { cwd, log, env })`；进程内驱动收集不到输出 → `out` 为空）；(b) `V5_GATE` 直读 `process.env`，未收注入 `env`（测试注入失效）；
另 (c) `--json` 把 7 字段内部 hits 原样序列化，破坏旧版 **5 字段投影**公共契约（旧实现 `main` 内 `.map()` 投影——已从 `57087021` 历史核实，非猜测）。
**修法** = 恢复 `main(argv, { cwd = process.cwd(), log = console.log, env = process.env })` 契约 + 恢复五字段投影（`expect`/`got` 仅入文本面）。**测试档零改动即转绿**——未弱化任何断言；另按 T-M5 口径把退役注记里的 `PEER_PREFIX` / `PEER_DIRS` / `domain-out` / `resolvePeerRoot` 字面收正（代码/测试/脚本层检索零命中）。

**红 4 · CLI `test/ledger-surface.test.mjs` T109③**：
根因 = 夹具**环境依赖**（非断言错）：旧 ③ 以 `%TEMP%` 子目录为锚，`discoverFamily` 沿父链扫描会命中**并行用例在 %TEMP% 遗留的 `ledger-*` 台账目录**（`%TEMP%` ≤100 项时触发——实测复现：注入残留目录即红；`test:full` 并行下稳定复现；单跑偶绿）。
**修法** = 锚改为**系统盘根下全链不存在的幽灵路径**（`parse(tmpdir()).root` + `thincoder-zero-ledger-probe/deep/nested`）——全链零台账、环境自持、不随残留漂移；断言强度不变（仍 `current=null` + `projects=[]`）。**否决**「先清 %TEMP% 残留再跑」——不防并行、下一轮必再污染；**否决**条件跳过/过滤环境噪声——等价弱化断言。

**另 2 红（未列入任务书，改指缺失档 import 崩）——同批清掉**：
- VSC `test/doc-consistency.test.mjs`（R8）：整档 import 已删的 `scripts/check-doc-width.mjs` → ERR_MODULE_NOT_FOUND。重写 = 改指仓根统一版 + **V4 段整类删**（T-VS31 / T-VS32 / T-VS33）· T-VS32② 基线反证保留 + spawn 路径改指 · T64/① 的 V4 引用收正 · T-MA8-2 静态串对齐统一版单源调用行。
- VSC `test/ledger-check.test.mjs`（R9）：同上（import 已删档）。重写 = 改指 + **T-VS2 / T-VS3 删段**（跨仓必报——判据已退役；以「越出根必报」存留语义由 T-VS35 覆盖）· T-VS35 重述（`仓根外前缀（首段非仓根条目）` / `仓根外绝对路径` + **补 T-VS2 遗留的越根绝对路径臂**——不静默丢覆盖）· T-VS5 夹具换本域坏指针 · L2/L3 消息串对齐统一版（`活文件含`）。
- 另：VSC `test/files.mjs` 两条接线注释随内容收正（R8/R9 面——登记行与实况对齐）。

#### 三、S4 项逐条核验（任务书步骤 3）

| 项 | 结果 |
|---|---|
| 批 1 补正 `.gitignore` | ✅ 已提交（`57087021`）；探针复核 `git check-ignore -v thincoder-cli/.thincoder/tmp/probe.txt` → 命中 `thincoder-cli/.gitignore:2:/.thincoder/tmp/` |
| CI 全域机检 step | ✅ 本轮补（`90f1222`）：job `docs` = 全域三机检（无域参 = 全域；无 npm install 需求——依赖纯 node 内建，已核） |
| VSC `package.json` `doc:check` | ✅ 改指仓根统一版并传产品域（`node ../scripts/doc-anchors.mjs --root .. --domain thincoder-vscode --strict`）——实跑核验见「四·已知红」 |
| `doc-impact.mjs` 措辞 | ✅（`66a1962a`）：「对端」2 处改写「VSC 侧」+ import 改指统一版；复核零 `对端/跨仓` 字面 |
| 本板块两档退场注记 | ⚠️ **未动**（eng-designer 写权）——需注记行列清单见「五·发现 #3」，上报 |

#### 四、验证（本轮实测读数）

| 项 | 结果 |
|---|---|
| 仓根三机检（全域态） | **exit 0 ×3**：`OK(V5) 0 条悬空锚`（候选 8741）· `OK(宽度) 273 档 0 违规` · 台账 `0 处违规 · 基线 0` |
| CLI 链 | lint 311 OK · 快层 605/548/pass/0 fail/57 skip · test:full **605/605/0** · integration 23/23/0 |
| VSC 链 | lint 293 OK · 快层 621/580/**0**/41 · test:full 621/619/**2** · integration 28/28/0 |
| 改动测试档直跑（9 档） | CLI 4 档 56/42/0/14 exit 0 · VSC 5 档 46/42/0/4 exit 0 |
| 与批 1 基线对照 | 测试数差**逐条对得上**：CLI −6（T-LS2/T-LS3/T-LS35–37/T-V5-11）· VSC −6（T-VS2/T-VS3/T-VS31–33/T-CI-11），pass/skip 差同步吻合；批 1 的 %TEMP% EPERM 红（CLI 4 / VSC 3+1）本轮清残留后未现（同口径）。 |

**VSC test:full 2 红（设计序列过渡 + 既有抖动——非本批代码缺陷）**：
- T-DC6②（真仓零命中锁）：现 22 处 A1 悬空（7 R16 面 + 15 R8/R9 文档面）——见发现 #1。
- AC89 批级：819ms > 500ms 一次（满负荷）；单档复跑**通过**——批档 `LEDGER-SELF-CONTAINED.md` 已记同型（983/2089ms）。

#### 五、发现与上报（供父侧 / 设计者裁决——不静默）

**#1（🟡 设计序列过渡红 · 需补处置项）**：R8/R9 测试删除产生**文档引用面** 15 处悬空，设计档无归属批（R16 文档面只覆盖 T-CI-11，随 S6）：
- VSC `docs/design/LEDGER-SELF-CONTAINED.md`：`:648`（×2）· `:702` · `:731` · `:733` · `:743` · `:796`（×2）· `:849`（×2）· `:850` —— T-VS2 / T-VS31 / T-VS33 引用行（用例表 / 受影响文件表 / AC 行）。
- VSC `docs/requirements/ENGINEERING-MODE.md`：`:94`（×2）· `:125`（×2）—— F14 判定句区间引用行。
- 因果链：测试段按 R8/R9 **删** ⇒ 对应 A1 引用悬空 ⇒ VSC 引擎（`--strict` / 真仓锁）报红。全域三机检 exit 0 不受影响（全域态 VSC 引擎为报告态）；`doc:check` 与 T-DC6② 需此面注记后才绿。
- 本批**未动**（doc 面非 S4 文件域；R16 面属批 3）——**建议设计者补一条处置项（建议随 S6 一并退场注记）**。

**#2（🔵 既有满负荷抖动）**：VSC AC89 批级计时红一次（819ms）——单复跑过；批档已记在案。非本批引入。

**#3（🟡 本板块两档退场注记——写权在 eng-designer·本批只列清单）**：设计档 §2.5 尾条要求「R 表 / §2.14 的六档行号锚（及 R16 行坐标）在批 2 删改后 → 退场注记 + 来源指针」。
需注记面 = 设计档 `docs/design/TWO-REPO-MERGE.md` §2.4 **R1–R9 · R16 各行内的旧脚本坐标**（`thincoder-cli/scripts/doc-anchors.mjs:73/:32/:173/:188-190/:31/:199` 等已删档行号）+ §2.14「机检脚本（删改）」行 + §2.5 内旧档名提及。
机器侧暂由 `MERGED_SCRIPTS` 并入映射兜底（V5 悬空 0）；语义层注记建议随 S6（与 #1 并批）。

**#4（🔵 范围外观察）**：`thincoder/docs/TODO.md` 存在父侧未提交改动（需求池 +1 条：「子 agent 需要上下文压缩机制」）——未入本批、未动；按「各仓自持」纪律其收口归父侧。

**#5（🔵 自审 + advisor 未执行）**：轮次预算收窄（父侧指示「优先收口落地」）——本批**未跑**内部 explore 审计与 advisor 代码评审；建议下一轮补跑，射程 = 批 2 全量（含 `66a1962a`）。

### 批 2 · 机制退役（S4）· 补做轮——拆分达标 + 台账机检改指（eng-coder 自写 · 2026-09-13）

**范围**：父侧核验发现的两处欠项——① 统一脚本四档全部超 300 行（未达设计档 §2.14 的主动拆分规划）；② 台账机检默认清单仍指 4 条已退役路径（SKIP 噪声）。**语义零改**（唯一目的 = 结构达标 + 默认清单改指）。
**执行根**：合并仓根 `d:\teamcode\thincoder`。
**提交**：`9cd13163b49be96188bb26824f91c2be1bcbd358`（8 files, +885/−812；提交纪律 = 显式路径 add → status 核对 → `--only` 同路径提交；提交后工作树干净）。

#### 一、拆分（R24a：各档 ≤300）

| 档 | 前 | 后 | 角色 |
|---|---|---|---|
| `scripts/check-doc-width.mjs` | 374 | **109** | 入口 / 报告 + 宽度判据 + `MERGED_SCRIPTS` |
| `scripts/check-doc-width-core.mjs` | —（新） | **272** | 判据核：域驱动（collectMarkdown / discoverDomains / scanDomain）+ V1/V2/V3 + 基线 + 共享谓词 |
| `scripts/check-ledger.mjs` | 384 | **259** | 入口 / L4 定位判序 / 报告（审计 / 汇总 / 退出码） |
| `scripts/check-ledger-core.mjs` | —（新） | **151** | 判据核：checkLedger（单档 L1–L4）+ runCheck（多档驱动）+ defaultEntries + loadBaseline |
| `scripts/doc-anchors.mjs` | 326 | **90** | 入口 / 域驱动 / 报告（main + formatReport + 三档全量 re-export） |
| `scripts/doc-anchors-v5.mjs` | —（新） | **255** | V5 锚引擎（V5-A/B/C 抽取 + 判定 + scan） |
| `scripts/doc-anchors-core.mjs` | 353 | **231** | VSC 锚引擎（A1/A2/A3 抽取 + 判定） |
| `scripts/doc-anchors-targets.mjs` | —（新） | **139** | 采集面（源域 + 在册判据域：代码面 / 用例标题） |

**切点与定名依据**（实施批定案——设计档 §2.14 委托）：
- 预设面「入口 / 域驱动 / 报告」∥「判据核（抽取与判定）」按**脚本实际结构**落为 2–4 档/族：check-doc-width / check-ledger 单档两分；doc-anchors 族 = 两引擎一体（V5 + VSC 共 679 行）需 ≥3 档 ⇒ 按引擎切（v5 / core）+ 采集面独立成档（targets）。
- **两条既有测试锚点钉死切点**（测试零改——「全部既有测试全绿」）：① VSC `test/doc-anchors.test.mjs:124-127` 扫 `scripts/*.mjs`：
  `export function evidenceState` 须**恰在 `check-ledger.mjs`**，且 `doc-anchors-core.mjs` 逐字含 `import { evidenceState } from "./check-ledger.mjs"` ⇒ evidenceState 与 checkLedger 判据核分居两档；
  ② VSC `test/doc-consistency.test.mjs:207-214`（T-MA8-2）逐字要求 `check-doc-width.mjs` 含 `const widthHits = checkDocWidths(...)` + `if (l.length > max && !isTableRow(l))`，且 `const isMain` 后零 `length > maxW` ⇒ 宽度判据与主行程同档。
- **单源纪律**：判据 / 常量零复制——新档间以显式 import + re-export 维系（入口档 `export *` ⇒ 对外导入面不变；四档对外导出名零改，两产品测试档与 `doc-impact.mjs` / `reconcile-lookup.mjs` 零改动即接线）。`check-ledger.mjs ↔ check-ledger-core.mjs` 为**双向 import**（测试锚点所迫：evidenceState 钉在入口档、checkLedger 判据核需用）——模块级仅函数调用、无顶层求值依赖，Node ESM 求值安全（实跑全链验证）。

#### 二、台账机检默认清单改指（②）

- `DEFAULT_LEDGERS` 语义收正为**单仓唯一台账**（仓根 `docs/TODO.md` + `docs/TODO-archive.md`）；`defaultEntries(rootAbs)` 解析基 = **调用根（其下存在任一台账档时）→ 本脚本所属仓根**（全域 / 产品域两态共用；域参不再改变台账位置——单仓一账，`--domain` 参数契约与产品门禁传参面保留）。
- 实测（改后四态）：仓根 / CLI 目录 / VSC 目录 / `--domain thincoder-vscode` 均 = `OK: thincoder/docs/TODO.md` + `OK: thincoder/docs/TODO-archive.md`（**SKIP 零行**）· 0 违规。T67（`runCheck({root: REPO})` + `runCli([])` 断言 2 条 OK）与 T96 复跑绿。
- 保留：`live: true/false` 两档语义（活档判 L3⑤ / 归档档不判）、缺档跳过不报（显式 `--ledger` 面）、基线零容忍。

#### 三、验证（本轮实测）

| 项 | 结果 |
|---|---|
| 仓根三机检（全域态） | `doc-anchors` exit 0（V5 0 悬空 ×2；VSC 域报告态 41 命中——既有面）/ `check-doc-width` exit 0（273 档 0 违规 · V1/V2/V3 0）/ `check-ledger` exit 0（2 档 OK · 0 违规 · **SKIP 0 行**） |
| 语义零改对照（doc-anchors 全域） | 改前 = 改后逐数一致：CLI 域候选 8741 · 悬空 0 · 豁免 773；VSC 域命中 41 · distinct 6（A1 22 / A2 0 / A3 19）；宽面 125 行 |
| CLI 链 | lint 311 OK · 快层 605/548/0/57 · test:full **605/605/0**（首跑 T104b「空族」一次红 = 既有 %TEMP% 并行残留污染类，重跑绿）/ integration 23/23/0 |
| VSC 链 | lint 293 OK · 快层 621/580/0/41 · test:full 621/620/**1**（T-DC6② 文档引用面——既有红，命中数与改前一致）/ integration 28/28/0 |
| 受影响测试档直跑（含 slow） | CLI 5 档 59/59/0 · VSC 4 档 33/32/1（同上 T-DC6②）；T-DC4（evidenceState 恰一处 + 导入逐字）/ T-DC5 / T-DC14 / AC-DC13 / T-MA8-2 / T-DC15 静态断言全绿 |
| `doc:check`（VSC 门禁命令） | 行为零变：`--strict` 阻断态 41 命中 FAIL（既有面，随批 3 处置） |

#### 四、明示未做 / 上报

- **设计档 §2.14 拆分注与终态命名**：预设「两文件」示例未覆盖 doc-anchors 族实际需要（679 行 ⇒ 需 3 档）；实测落为 **4 档族**——切点依据见上（含测试锚点钉死）。注记收正归 eng-designer（本批未改设计档）。
- 未触碰：产品 `src/**`、批 3 面（`src/prompts/**` · `AGENTS.md` · 纪律句）、设计 / 需求 / 批次档 §1–§4、既有测试档（一律零改）。
- VSC T-DC6②（文档引用面）与 AC89（计时抖动）仍为既有红——非本批引入（T-DC6② 命中面 41 与改前一致；AC89 本轮 full 与 focused 单跑均通过）。

#### 五、内部审计（补记 · 2026-09-13）

- **内部 explore 审计 1 轮**（read-only 偏差审计，射程 = 本轮 8 档 + 上列验收标准）：**VERDICT clean**——四类偏差（半成品验收项 / 静默简化 / 文档漂移 / 越清单改动）均未发现。
  已核：8 档行数与语法 · `check-doc-width` T-MA8-2 三处逐字钉点（含「`const isMain` 后零 `length > maxW`」）· `evidenceState` 恰在 `check-ledger.mjs` 且 `doc-anchors-core.mjs` 含逐字导入（双向 import 顶层无求值依赖——静态安全）· 全消费者（`doc-impact.mjs` / `reconcile-lookup.mjs` / 两产品测试档）import 面全解析 · 单仓台账两路径 + SKIP 零行结构核验。
- **内部 advisor 代码评审未跑**（父侧预算指令「先提交、再报告」，优先保障交付不丢）；语义零改的替代证据 = 全域输出逐数一致（改前 = 改后：8741 / 0 / 773 + 41 / 6 / 22-0-19）+ 两产品全链复跑 + 受影响测试档直跑（含 slow）。
- 审计附注（非偏差）：`check-doc-width.mjs` CLI 起点的 `widthFiles` + `checkDocWidths` 两次域扫描为**既有结构**（原档逐字保留，非本轮引入；`widthFiles` 仅服务「N 文件」计数）；如需收敛归后续批。

### 批 2 · 交付评审 #20 发现 #2 收口——V1 全域跨域掩蔽修复（eng-coder 自写 · 2026-09-13）

**范围**：批 2 交付评审发现 #2（🟡）——`scanDomain` 域参缺省时返回全域并集，`checkSectionRefs` 的 `byBase` 按 basename 跨域汇总、
判定用 `cands.some(...)` ⇒ 同 basename 的两产品档互相满足节号：一条对甲产品失效的引用可被乙产品同名档掩蔽（假阴；
违设计档 §3.1 T-M9 期望「按产品前缀隔离解析，无 basename 一对多 fail-open」）。
**执行根**：合并仓根 `d:\teamcode\thincoder`。**提交**：`bed0bc320de70e1fa58733ea800e99ca4e18295b`（显式路径 add → status 核对 → `--only` 同路径提交）。

#### 一、改法（正确面 = 解析核；入口档零改）

- `scripts/check-doc-width-core.mjs`：V1 解析**按域隔离**——`checkSectionRefs` 改为**逐域各跑一次**：域基驱动（`scanBases`）与单域收集
  （`collectDomain`）自 `scanDomain` 抽出为内部助手（域驱动单源，`scanDomain` 输出语义零改），`byBase` **每域独立重建**（本域索引——不跨域并表）。
  全域调用 = 逐域结果的并集：**任一域有违规 ⇒ 全域退出码 1**；报告行路径自带域前缀（`thincoder-cli/…` 与 `thincoder-vscode/…`），汇总计数为全域聚合。
- **产品域态（`--domain`）逐字不变**：单域路径下候选集与改前逐元素一致（夹具两域实测改前 = 改后逐字相同——见下表）。
- 入口档 `scripts/check-doc-width.mjs` **零改**（`main` 调用路径无需调整——隔离落在解析核，全域 / 产品域 / 程序直调三面同收益；
  未用「按 basename 加域前缀猜」类折中）。
- 行数（wc -l）：`check-doc-width-core.mjs` 272 → 286（≤300）；入口档 109（±0）。

#### 二、等价性证据（夹具 = 两域同 basename + 域外档引用；改前 / 改后对照）

夹具 `%TEMP%\dwfix-fixture\`：alpha / beta 两域各持 `docs/design/`。夹具语义 = alpha 引用 `TESTING.md` §7（本域同名档无此节、beta 同名档有——掩蔽源）；
beta 引用他域独有档 `ONLY-ALPHA.md` §5（本域无此档 ⇒ 预期 unknown-doc）。

| 命令（cwd = 夹具，脚本 = 仓根统一版） | 改前 | 改后 |
|---|---|---|
| 全域（无域参） | 0 违规 · exit 0——**掩蔽**（alpha / beta 两条均漏报） | 2 违规 · exit 1（= 逐域并集，alpha / beta 各 1） |
| `--domain alpha` | 1 违规（失效节号 no-section）· exit 1 | 同左（逐字不变） |
| `--domain beta` | 1 违规（域外档 unknown-doc）· exit 1 | 同左（逐字不变） |

⇒ 改后全域输出 = 逐域输出并集（违规 2 = 1 + 1；扫描文件 5 = 3 + 2）；改前全域 ≠ 并集（0 ≠ 2）＝本发现的假阴实证。
真仓复核：全域 273 文件 0 违规 · `--domain thincoder` 140 · `--domain thincoder-vscode` 133（273 = 140 + 133）——改前 / 改后逐数一致、exit 0。

#### 三、回归用例（宿主 = VSC `test/doc-consistency.test.mjs`；改前红 → 改后绿）

- **宿主选择理由**：该档 = V1 边界断言族宿主（T63④ 同族：失效引用 / unknown-doc / 「（CLI 侧）」豁免），且为 S4 单仓化修订面、锚定仓根统一版；
  不改 CLI 同名档——其探针路径并发缺陷属项目台账「触发 = 条件」登记项，不顺势扩大本轮触碰面（任务口径「改动收窄」）。
- 用例 `T-M9`：alpha 引用受阻节号**必须报（不得被 beta 同名档满足）**；beta 引用他域独有档**必须报 unknown-doc**；两向「本域可解析引用零误报」负例钉住不过度收紧。
- **改前**：VSC 目录 `node --test test/doc-consistency.test.mjs` = tests 10 / pass 7 / **fail 1**（T-M9 首断言）· exit 1。
- **改后**：同命令 = tests 10 / pass 8 / fail 0 / skip 2 · exit 0。该档 214 → 238 行（wc -l；≤300）。

#### 四、全链复跑（与批 2 §5 基线同口径对照）

| 门 | 改后实测 | 批 2 基线 | 对照 |
|---|---|---|---|
| 仓根三机检 | `doc-anchors` exit 0（V5 0 悬空 ×2；VSC 域报告态 41 命中 = A1 22 / A2 0 / A3 19）· `check-doc-width` exit 0（273 档 0 违规）· `check-ledger` exit 0（2 档 OK · 0 违规） | 同 | 一致 |
| CLI 链 | lint 311 OK · 快层 605/548/0/57 · test:full 605/605/0 · 集成 23/23/0 | 同 | 一致 |
| VSC 链 | lint 293 OK · 快层 622/581/0/41 · test:full 622/621/**1** · 集成 28/28/0 · `doc:check` 41 命中阻断（既有面） | 621/580/0/41 · 621/620/1 | 计数 +1 = 新用例（绿）；唯一 fail = T-DC6②（既有红——命中面与基线一致） |

- VSC full 复核：首跑 2 红 = T-DC6② + AC89（「单次刷新 501ms > 500ms」）；AC89 单档复跑通过 · 全量次跑通过——属既有满负荷抖动
  （批档 LEDGER-SELF-CONTAINED.md 已记同型），非本批引入。
- **未触碰**：产品 `src/**` · 设计 / 需求档 · 编号 · 既有用例（仅 VSC `doc-consistency` 追加一例 + 头注同步）。

#### 五、发现与上报

- **设计档行数注记漂移（写权在 eng-designer，本批未改）**：设计档拆分结构注记（commit `c3d0e6cd`）载「最大 272 = `check-doc-width-core.mjs`」，
  现实测 **286**（本修复 +14）；「各文件目标 ≤300 行已达成」仍成立，仅逐个数值待收正。
- **范围外观察（不阻塞）**：域**内**同名 basename（`docs/design/` 与 `docs/requirements/` 撞名）仍为 `some()` 判存——属 D-CL8 已如实登记的
  fail-open 方向；本修复射程 = 域间隔离（T-M9 口径），域内面未动。

### 批 3 · S5 · 提示词跨仓机制层退役（R10/R11/R13）· 实施记录（eng-coder 自写 · 2026-09-13）

**范围**：设计档 §2.15 S5（§2.7 分层处置）——① 提示词四目录跨仓语义措辞扫描与退役（R13 + R12 提示词面；四目录 = 两产品 × `src/prompts` / `docs/design/prompts`，各 15 档共 60 档）；
② VSC `test/prompts-mirror-anchors.test.mjs` 跨仓断言段删 + 单仓版双源守卫（R10）；③ 两产品 `AGENTS.md` 镜像约定段改写（R11 附加面）。
**执行根** = 合并仓根 `d:\teamcode\thincoder`。

#### 一、提交（实际 hash）

| 序 | commit | 内容 |
|---|---|---|
| A | `b398884b` | S5 全量交付——15 files, +89/−101（提示词 12 档 + 测试 1 档 + AGENTS 2 档） |
| B | `97cade7f` | 评审轮 1 修正——测试档头注退役引用收正（2 行替换；advisor 🔵#2 Fixed） |

提交纪律逐次执行：显式路径 `git add` → 单独三机检 → `git commit --only` 同路径；并行轮 WIP（R12/R14/R15 文档面 8 档）零混入。

#### 二、改动面

- `discipline-engineering.md`「文档与台账自持」节 ×4（两产品 src+docs）：节题「（各仓记各仓的）」→「（本仓记本仓的）」；删「工作区含多个仓（多仓 workspace / monorepo 多仓 / 多项目并存）时」触发句；
  条目单仓化——「他仓 / 对端仓 / 跨仓指针 / 另一仓已有」→「本仓之外 / 仓外指针 / 别处已有」；R13 条改写（CLI「批 = 一次实现轮、各带自己的批次档」/ VSC「批 = 一次实现轮、各带本批批次档」+ 子代理写域 + 仓外改动停下上报）。
- `discipline-normal.md` 自持节 ×4：节题与条目同词汇面单仓化。
- `persona-eng-designer.md` ×4：「他批 / 他仓 / 他层的问题」→「他批 / 他层 / 本仓之外的问题」。
- `thincoder-vscode/test/prompts-mirror-anchors.test.mjs`（wc-l 155 → 145，Δ −10）：删 `CLI` 兄弟仓常量 + `notStrictEqual` 自指断言 + `readRepo` 跨仓读取 + ③ CLI 集合比对；
  保留/收正单仓版守卫——③ 本端双源同名集合各 15 + 相等；⑤ 本端镜像节引用可解析；T-DC16 F20 锚随 R13 新字面 + 节题同步；**零跨仓读取**。
- 两产品 `AGENTS.md`：镜像段 → 产品内双源约定（`docs/design/prompts/` 中文权威模板 ↔ `src/prompts/` 运行期落地物 + 变更流 + 手抄/译写无同步脚本）；去跨仓叙述与跨仓指针。

#### 三、验证（实测读数）

| 项 | 结果 |
|---|---|
| 四目录跨仓锚扫描 | `跨仓|对端|他仓|两仓|兄弟仓|各仓|每仓|单副本` = 60 档零命中（保留面 = 产品侧注记与跨产品层词，按 §2.7 不属跨仓机制层） |
| 测试档单跑 | 4/4 pass（修正后复跑仍 4/4） |
| 两产品快层 | CLI 605/548/0/57 · VSC 622/581/0/41（与批 2 基线逐数一致） |
| 仓根三机检 | exit 0 ×3（V5 悬空 0 / 宽度 273 档 0 违规 / 台账 2 档 OK 0 违规） |
| 镜像发散度复核 | 107 对 · 29 相同 · 39 ≥0.9 · 中位 0.6494——与批 2 入库值逐位一致（本批零位移；src 侧 8/15 保持） |

#### 四、发现与上报

**#1（🟡 R10 完成面连带——VSC doc:check 0 → 2 命中；文档面，非本批写域）**：R10 删 `prompts-mirror-anchors.test.mjs:26` 后，`THINCODER_CLI_ROOT` 的最后代码载体消失（批 2 已删 context-parity 面）⇒ VSC 锚引擎 A2 报两处：
`thincoder-vscode/docs/design/AGENT-LOOP.md:1279` · `thincoder-vscode/docs/design/DOC-CODE-RECONCILE.md:98`。影响：VSC `npm run doc:check`（阻断态）FAIL 2 处；VSC `test/doc-anchors.test.mjs` T-DC6②（真仓零命中锁）full 层红。
**stash 隔离实测**：改前 doc:check = 0 命中 / 改后 = 2（因果唯一）。修复面 = 2 行 VSC 设计档（注记行扩展——引擎注记 = NOTE_RE ∧ NOTE_RESOLUTION_RE 整行跳过；或改写该两行），属设计档写权（本批禁改）——建议就近派文档收口（S6 / designer 轮）。

**#2（🔵 行数对账）**：测试档实测 155 → 145（wc-l；设计档 §2.14 预计「≤−20」）——差额 = 可删跨仓面仅 12 行，单仓版守卫（③/⑤/T-DC16）+ ⑨-3 常量面为设计明确保留项。设计档自称「逐档实测 delta 以实施轮为准」——建议 designer 收正 §2.14 标注。

**#3（🔵 环境）**：检查/提交期间树上有并行轮 WIP（8 档 R12/R14/R15 文档面）；本批 `--only` 显式路径提交零混入；机检读数含该 WIP 状态（结论不受影响）。

#### 五、交付链（本会话内——审计与评审）

- **内部 explore 偏差审计 1 轮**：**VERDICT clean**——四类偏差（半成品 / 静默简化 / 文档漂移 / 越清单）均零；独立复核 ①–⑤ 全过（四目录零残留 / 双源各 15 对位 / 测试档静态单仓化 / 改写质量对照 / AGENTS 段）。
- **内部 advisor 代码评审 1 轮**：**VERDICT pass**（🔴 0 · 🟡 0 · 🔵 3）。裁决：#1「双端照抄」保留块 = **Not an issue**（跨产品内容层·设计保留；T-M23 枚举键口径零残留成立）；#2 测试档头注退役引用 = **Fixed**（`97cade7f`）；#3 行数对账 = **Deferred**（本记录已登记；设计档收正归 designer）。
- 终态：**clean**。

**补记（同会话复评 · 2026-09-13）**：发现 **#1 已闭**——并行 S6 轮（eng-designer；commit `50c907c3`「…VSC doc:check fixes」）已对同两处落同款退场注记（`AGENT-LOOP.md:1279` / `DOC-CODE-RECONCILE.md:98`）。
复跑实证：VSC `npm run doc:check` = **0 命中（exit 0）**；VSC `test/doc-anchors.test.mjs` full 层 = **16/16 绿**（T-DC6② 复绿）。
上段「FAIL 2 处 / T-DC6② 红」= 挂账时点状态（本批 R10 完成后、S6 收口前）——现态已闭；本批改动域内零残留。
归因口径注记：S6 注记文案写「两仓合并批 2」，而最后代码载体实由 **R10（批 3）** 移除（批 2 删 context-parity 面后仍有本档 `:26` 载体）——文案归因与实测时序差一批（不影响绿）；供父侧批 3 收口时知悉。

## §6 验证与收口（父代理自写）

**收口结论（2026-09-13）**：批 2（S4 · 机制退役）**全闭**——代码面（统一三档 → 8 档拆分 · 六档退役 · 调用点改指）+
文档面（VSC 引用面 41 命中清零 + R16 行归属收正）+ 评审（父侧 advisor 代码评审 #20 = pass）+ 核验（主 agent 独立复跑）四件齐。

### 一、本批提交清单（实际落地）

| commit | 内容 |
|---|---|
| `57087021` | 产品级 `thincoder-cli/.gitignore`（批 1 补正） |
| `66a1962a` | 仓根统一机检落位 + 六档产品脚本退役 + 调用点改指 |
| `f7331c21` | 收口：`main` 契约恢复（`{cwd,log,env}` + `--json` 五字段投影）· R8/R9 连带测试单仓化 · T109 夹具 |
| `90f12228` | CI 仓根全域机检 job（批 1 发现 #3 收口） |
| `9cd13163` · `594b9dd2` · `f5fa4f04` | 拆分补齐（8 档全 ≤300）· 台账机检改指 · 实施记录 |
| `bed0bc32` · `7d290280` | V1 全域跨域掩蔽修复（T-M9）+ 回归用例（评审 #20 发现 #2） |
| `308e1902` · `d633fa2d` | VSC 文档引用面 41 命中清零（`doc:check` exit 0）+ R16 行归属收正 |
| `c9f35f93` · `4c0cf51` · `96bf3110` · `c3d0e6c` · `20f12bf9` · `c7ca4523` · `2e72fad` | 台账单仓化 · §5 转录 · 设计收正轮 · 长文需求登记 · 台账更新 |
| `f710ea5b` · `1cda8bec` | `scripts/mirror-divergence.mjs` 入库（招牌数字自此可复现） |

### 二、主 agent 独立核验（复跑读数——非采信自述）

| 项 | 我实测 |
|---|---|
| 仓根三机检 | 宽度 `OK` 273 档 0 违规 · `OK(V5)` 0 悬空 · 台账 2 档 OK 0 违规（**SKIP 零行**） |
| 统一脚本行数 | 8 档全部 ≤300（最大 **286** = `check-doc-width-core.mjs`） |
| VSC 门禁 | `npm run doc:check` = `V5: 命中 0 处 · distinct 0（A1 0 / A2 0 / A3 0）· 阻断态` ✓ |
| 零值锁 | VSC `test/doc-anchors.test.mjs` = 16 例 / 15 pass / **0 fail** ✓ |
| V1 跨域隔离 | 夹具独立复现：全域 **2 违规 = 逐域并集 1+1**；单域语义逐字不变（改前 = 0 违规假阴）✓ |
| 注记形态 | 抽验 `thincoder-vscode/docs/design/AGENT-LOOP.md:48` / `:23` = **行内追加注**（未删行 / 未改编号）✓ |
| 度量脚本 | 实跑 = **107 / 29 / 39 / 0.6494** + 8 项子目录中位，与独立复算**逐位一致** ✓ |
| 交付评审 | 父侧 advisor 代码评审 #20（批 2 全量含 `66a1962a`）：**VERDICT pass**（🔴 0 / 🟡 3 / 🔵 3） |

### 三、评审发现裁决（#20 六条 + 入库轮三条）

| 来源-编号 | 处置 | 落点 |
|---|---|---|
| #20-1 🟡 VSC 门禁红（R8/R9 文档面**设计无归属批**） | **Fixed** | 41 命中清零（`308e1902`）；`doc:check` exit 0 + 零值锁复绿（父侧复跑） |
| #20-2 🟡 V1 全域跨域掩蔽（T-M9 失效） | **Fixed** | 逐域各跑（`bed0bc32`）+ 回归用例（改前红 → 改后绿）+ 父侧夹具复现 |
| #20-3 🟡 三档测试 >300 · `context-parity` 无裁定 | **Fixed（登记）** | 补入设计档 §2.14 拆分审视清单（`c3d0e6c`） |
| #20-4 🔵 「零红」口径未写明 | **Fixed（登记）** | 设计档 §2.9 + T-M6 写明 = 退出码 0（`c3d0e6c`） |
| #20-5 🔵 宽度脚本对扫描域两次枚举 | **Deferred** | 既有结构、非本批引入；收敛归后续触碰（不阻塞） |
| #20-6 🔵 T-M5 检索口径风险（`PEER_*` 裸字面误红） | **Fixed（登记）** | 设计档 T-M5 写明「五名逐个零命中」+ 两处白名单（`c3d0e6c`） |
| 入库轮 🟡 度量脚本无机器测试 | **Not an issue（裁决）** | 本项目测试纪律：单元测试为开发期工具、批次收口默认退役；该工具量度面非业务可观察 ⇒ 不造「出生即待退役」的测试；正确性由「实跑 vs 独立复算」自证 |
| 入库轮 🟡 用法错误无契约（恒 exit 0） | **Deferred（登记）** | 台账技术待办（触发=条件）；注：子代理报告所引「`doc-impact.mjs` 先例」经父侧实核**不存在** |
| 入库轮 🔵 `walkFiles` 静默跳过 symlink | **Deferred（登记）** | 同上条目（两树现无 symlink） |

### 四、遗留项（逐条有归属——不带病收口）

| 项 | 归属 | 登记位 |
|---|---|---|
| 本板块两档 R 表 / §2.14 六档行号锚**语义**注记 | 批 3 / S6（机器面已由 `MERGED_SCRIPTS` 兜底 ⇒ 无门禁红） | 设计档 §2.5 尾块 |
| R16 面 **CLI 侧**代表点（`AGENT-LOOP.md:306` · `PROMPT-SYSTEM.md:337`（+ `:413`）） | 批 3 / S6 与 N-Q3 / N-P1 豁免句同批复核 | 设计档 §2.4 R16 行 + §2.15 S6 |
| ~~设计档 §1.1 数字修正~~ **✅ 已收正（数字收正轮）**——落点 = 需求档 §1（改写为可复现形态：口径 + 实测值 + 复现命令）+ 设计档 §2.2.1 / §2.13（衍生引用改指）；旧值仅存于两档变更记录（留痕） | 已闭 | 台账技术待办（招牌数字条——**已核销**） |
| ~~设计档 §2.14 行数漂移（载 272 → 实测 286）~~ **✅ 已收正（同轮）** | 已闭 | 本档 §5 发现 |
| 域内同名 basename fail-open（D-CL8 方向） | 台账（既有登记） | — |
| 既有 `%TEMP%` EPERM 测试红（批 1 发现 #4） | 产品测试面 | 本档 §5 |

### 五、台账可见面（D7 收口行）

```
台账 thincoder：需求池 3 · 技术待办 5（老化 0） — 可开批
台账 ai-gateway：需求池 0 · 技术待办 0（老化 0）
台账 thincoder-vscode：需求池 0 · 技术待办 3（老化 0）
台账 thinworker：需求池 0 · 技术待办 0（老化 0）
```

（`--summary` = 工作区视角，会列出其它项目各自台账；与合并仓无关的三行仅备查。）

### 六、本批验收对照（设计档 §3）

| 用例 | 结论 |
|---|---|
| T-M5 · T-M6 · T-M9 · T-M10 · T-M11 · T-M17 · T-M20 · T-M21 · T-M22 | ✅ 全过（T-M6 口径 = **退出码 0**，已落设计档；T-M9 由跨域隔离修复补齐 + 父侧夹具复现） |
| T-M28（CI 全域 job 端到端） | ⏳ 落地已确认（`90f12228`）；端到端复跑归**批 4** |

> 本段由主 agent 手写（非子代理段）；§5 为 eng-coder 自写段，本段不改动其内容。

---

### 批 3（S5–S6 · 提示词与文档层）收口（父代理自写 · 2026-09-13）

**收口结论**：批 3 **全闭**——提示词跨仓机制层退役（S5）· 纪律句改写（S6）· 四项遗留收尾（R 表语义注记 / VSC `:1294` / prompt 引用措辞 / §2.14 行数对账）三段落齐，各轮自审与评审齐备，父侧独立复跑全绿。

#### 一、本批提交清单

| commit | 内容 |
|---|---|
| `b398884b` | **S5 全量**——提示词四目录 12 档改写（R12 提示词面 / R13）+ VSC `prompts-mirror-anchors.test.mjs` 跨仓段删 + 单仓守卫保留（R10）+ 两产品 `AGENTS.md` 镜像段改写（R11） |
| `97cade7f` | S5 评审轮 1 修正（测试档头注退役引用收正） |
| `6a65505d` · `7dec3090` | 批次档 §5 实施记录 + 发现 #1 复评闭合 |
| `50c907c3` | **S6**——R12 / R14 / R15 纪律句改写 + R16 CLI 侧退场注记 + §2.14 收正 + VSC 2 处 A2 死指针补注 |
| `5368c0d3` | 批次档 §2 补记（S6） |
| `8e903dfa` | **收尾**——六档锚语义退场注记（§2.4 R1–R9 · §2.14 · §2.5 三处）+ VSC `:1294`（+`:1276`/`:1298`）+ 跨对端读引用加注 3 处 + §2.14 行数对账 `155 → 145（Δ −10）` + A2 归因校准 |
| `175743eb` | 批次档 §2 补记（收尾轮） |

#### 二、主 agent 独立核验（复跑读数）

| 项 | 我实测 |
|---|---|
| 跨仓措辞零残留（T-M23） | 对**四目录 `**/prompts/*.md`** grep `跨仓｜对端仓｜他仓｜两仓｜兄弟仓｜各仓自持｜每仓一轮` = **零命中** |
| R10 测试档 | VSC `node --test test/prompts-mirror-anchors.test.mjs` = **4 例 / 4 pass / 0 fail**（零跨仓读取） |
| 六档锚语义注记 | 设计档 §2.4 **R1–R9 九行逐一核到**「已退场（六档坐标 as-of——并入仓根统一脚本；两仓合并批 2；删除记录 = 批次档 §5）」 |
| §2.14 行数 | 实测 `155 → 145（Δ −10）` 已收正 + 差额理由（守卫与常量面为设计保留项） |
| VSC 门禁 | `npm run doc:check` = `命中 0 处 · distinct 0（A1 0 / A2 0 / A3 0）· 阻断态` |
| 仓根三机检 | 宽度 `OK` 273 档 0 违规 · `OK(V5)` 0 悬空 ×2 · 台账 2 档 OK 0 违规 |
| 工作树 | 各轮提交后均干净（无跨轮混入） |

#### 三、经验条目（本批独有——供后续并行拆分参考）

**拆并行轮次时的「锚面耦合」**：本批 S5（coder：提示词 + 测试）与 S6（designer：文档）并行，产生一次真实交互——
S5 删除 `prompts-mirror-anchors.test.mjs:26` 使 `THINCODER_CLI_ROOT` **失去最后代码载体** ⇒ VSC 侧文档锚转死指针（A2 报 2 处、`doc:check` FAIL）。
两轮各自独立发现并**当场复位**（coder 以 stash 隔离证因果唯一；designer 补退场注记），**未变成静默红**。
⇒ 教训：**删除测试/代码载体的一方会改变文档锚面**；并行拆轮时应在任务书里互告「对方可能触碰的锚面」（本批已由父侧事后补正归因）。

#### 四、遗留项（带归属——不带病收口）

| 项 | 归属 |
|---|---|
| V5 符号·宽**报告面**遗留 as-of 符号（`cliSideAnnotated` · `PEER_DIRS` 等——报告面不入闸，无门禁红） | 后续触碰该脚本时收敛（登记于台账技术待办同族口径） |
| 非点名残留面（动机段 / 判定句主体 / 设计档 LEDGER-SELF-CONTAINED 族）——按 D10「随触碰」口径保留 | 后续批触碰时处置 |
| 既有 `%TEMP%` EPERM 测试红 | 产品测试面（批 1 发现 #4） |

#### 五、台账可见面（D7 收口行）

```
台账 thincoder：需求池 3 · 技术待办 4（老化 0） — 可开批
台账 ai-gateway：需求池 0 · 技术待办 0（老化 0）
台账 thincoder-vscode：需求池 0 · 技术待办 3（老化 0）
台账 thinworker：需求池 0 · 技术待办 0（老化 0）
```

#### 六、本批验收对照（设计档 §3）

| 用例 | 结论 |
|---|---|
| T-M23（跨仓机制层措辞零残留 + 产品内双源结构保留） | ✅ 零命中实测（四目录）+ 双源同名集合 15+15 未动 |
| T-M24（R12——检域含提示词档） | ✅ 文档面（两 README / 两引擎需求档）+ 提示词面（自持节两副本）双覆盖 |
| T-M25 · T-M26（R13 / R14 检索） | ✅ 提示词面「每仓一轮 / 跨仓批 / 跨仓 import」零命中；需求档「跨仓 import」禁令已删 |
| T-M27（端差三落点） | ✅ VSC `requirements/AGENT-LOOP.md` N-CL4 · VSC `design/README.md` 镜像差异表 · CLI `design/TESTING.md` §11.6 |
| T-M17 / T-M21（复跑） | ✅ 机检报红机制与台账面复跑绿 |

---

### 批 4（S7 · 验证收口）收口（父代理自写 · 2026-09-13）

**收口结论**：批 4 **全闭**——两产品全量测试 / 全域机检 / 产物生成 / 发布链演练四件均由**父侧直接执行并取原始读数**（验证批不委派、不夹带新设计）。**至此本批次档四批（S0–S7）全部收口。**

#### 一、父侧实测读数（本批直接执行）

| 项 | 命令（执行根） | 读数 |
|---|---|---|
| CLI lint | `npm run lint`（`thincoder-cli/`） | `check-syntax: 311 file(s) OK` |
| CLI 快层 | `npm test` | 605 / 548 pass / **0 fail** / 57 skip |
| CLI 全量 | `npm run test:full` | 605 / **605** / 0 / 0 |
| CLI 集成 | `npm run test:integration` | 23 / 23 / 0 |
| VSC lint | `npm run lint`（`thincoder-vscode/`） | `check-syntax: 293 JS files OK` |
| VSC 文档闸 | `npm run doc:check` | `V5: 命中 0 处 · distinct 0（A1 0 / A2 0 / A3 0）· 阻断态` |
| VSC 快层 | `npm test` | 622 / 581 / **0** / 41 |
| VSC 全量 | `npm run test:full` | 622 / **622** / 0 / 0 |
| VSC 集成 | `npm run test:integration` | 28 / 28 / 0 |
| 产物 · CLI | `npm pack --pack-destination <tmp>` | `thincoder-0.12.62.tgz`（261 档 · 893.2 kB）✓ |
| 产物 · VSC | `vsce package --out <tmp>\vsc.vsix` | `vsc.vsix`（256 档 · 946.08 KB）✓ |
| 全域三机检 | 仓根三档 | 宽度 273 档 0 违规 · `OK(V5)` 0 悬空 ×2 · 台账 2 档 0 违规 |
| CI 结构 | `.github/workflows/test.yml` | 3 job：`cli` / `vscode` / **`docs`**（repo-wide doc machine checks） |

> 产物落系统临时目录、验后即清（不污染工作树）；各步后工作树均干净。
> **与批 1 对照**：批 1 记录的两产品 8 处 `test:full` 红（`%TEMP%` EPERM teardown）**本批未复现**（两产品全量均 0 fail）。

#### 二、§3 全表逐项勾销（28 行）

| 用例 | 结论 | 证据（批段/读数） |
|---|---|---|
| T-M1 目标布局 | ✅ | 批 1 §5 + 父侧核验（顶层六项） |
| T-M2 两产品全量测试 | ✅ | 本批：CLI 605/605/0 · VSC 622/622/0 · 集成 23/23 · 28/28 |
| T-M3 产物生成 | ✅ | 本批：`.tgz` 261 档 · `.vsix` 256 档——互不触发 |
| T-M4 历史追溯 | ✅ | 批 1 §5 + 设计档 §2.3 收正（`--follow -m` 工作形态；基准 2251 提交） |
| T-M5 跨仓判据零残留 | ✅ | 五符号逐个零命中 + 两白名单登记（设计档 §3.1 T-M5） |
| T-M6 单仓化机检（口径 = 退出码） | ✅ | 本批全域三机检 exit 0 |
| T-M7 VSC `repository` 字段 | ✅ | 批 1 核验（仍指原远端） |
| T-M8 blame 跨 graft / 搬迁 | ✅ | 批 1 §5（`^d27f773c` / `0b37f4219`） |
| T-M9 无 basename 一对多 fail-open | ✅ | 批 2 修复（逐域各跑）+ 父侧夹具复现（2 = 1+1） |
| T-M10 路径 token 零改写 | ✅ | 批 1 对账（missing 0 · content-changed 0） |
| T-M11 兄弟目录存在不误解析 | ✅ | 对端发现已删（R1）+ 全域机检绿 |
| T-M12 共享用户级状态 | ✅ | **免验**（设计档原文：不涉迁移、无需验证） |
| T-M13 两产品 `.thincoder/` 各自保留 | ✅ | 批 1 §5（同名不同 blob 并存） |
| T-M14 tag 行为 | ✅ | 批 1 核验（tags 71 · 重复 0） |
| T-M15 未跟踪临时产物清理 | ✅ | 批 1 §5（158 项归档 · 合并仓 `--ignored` 空） |
| T-M16 逐档对账 | ✅ | 批 1 §5（CLI 568 + VSC 521 → missing 0 / changed 0） |
| T-M17 已删判据残留引用报红 | ✅ | 报红机制在（夹具反证 exit 1）；引用面已注记清零 |
| T-M18 可恢复性 | ✅ | 批 1 §5（两 mirror + 158 项 sha256 复盘一致） |
| T-M19 发布链演练 | ✅ | 本批：四环门全绿 + 双产物生成 exit 0 |
| T-M20 R7 / R10 / R16 回归 | ✅ | 批 3（跨仓段删 + 单仓守卫）+ 本批两产品全量复跑绿 |
| T-M21 本板块两档纳入扫描域 | ✅ | 机检域含两档 · 0 违规（本批全域跑） |
| T-M22 R1–R10 / R16 家族零残余 | ✅ | 批 2 / 批 3 逐面交付 + 父侧抽查 |
| T-M23 跨仓措辞零残留 | ✅ | 批 3：四目录 grep 零命中（父侧复核） |
| T-M24 R12 | ✅ | 批 3 S6（两 README + 两引擎需求档 + 提示词自持节） |
| T-M25 R13 | ✅ | 批 3 S5（四副本「跨仓批」条改写） |
| T-M26 R14 | ✅ | 批 3 S6（import 禁令删除） |
| T-M27 R15 端差三落点 | ✅ | 批 3 S6（VSC N-CL4 · VSC `design/README` 镜像差异表 · CLI `TESTING` §11.6） |
| T-M28 CI 实跑 / 等效 | ✅ | 本批：本地等效命令全绿 + workflow 三 job 结构核对 |

#### 三、勾销核对中的一处不一致（如实登记）

批 4 范围条引「验收勾销（设计档 **§2.11 判据表**逐项 + §3 全表）」——**实核设计档无 §2.11 判据表**（该档唯一 `§2.11` 出现为 `:415` 的指针行）。
⇒ 勾销按 **§3 全表 28 行**执行；该指针差登记于此（供后续修字；不阻塞验收）。

#### 四、台账可见面（D7 收口行）

```
台账 thincoder：需求池 3 · 技术待办 4（老化 0） — 可开批
台账 ai-gateway：需求池 0 · 技术待办 0（老化 0）
台账 thincoder-vscode：需求池 0 · 技术待办 3（老化 0）
台账 thinworker：需求池 0 · 技术待办 0（老化 0）
```

（需求池条目「两仓合并…」本批核销 → 移入 `docs/TODO-archive.md`；技术待办 4 条为遗留债，不受本批影响。）

#### 五、全批收口声明

- **S0–S7 八步 · 四批全部落地**，逐批均带 §6 收口（批 2 见上、批 3 见中、批 4 见本段）；设计档 §3 全表 28 行逐项 ✅（T-M12 按设计原文免验）。
- **不在本批次档射程**：**S3b（旧 VSC 仓远端归档 / 只读）——用户 2026-09-13 已确认执行**。实况（本批实测）：旧仓 = 工作区顶层 `thincoder-vscode/`（有效 git 仓 · 工作树干净 · HEAD `40409b4 release: v0.9.2`），**双远端** = `github` `https://github.com/xinbo-tech/thincoder-vscode.git` ∥ `origin` `https://gitee.com/shanghai-xinbo/thincoder-vscode.git`。
  **执行进度（2026-09-13 回填）**：
  ① **合并仓已推送对外生效**——`git push origin` / `github main` 两远端 `3d50068b..fbf9e8a2`（**干净快进**，远端零独有提交；tag 71/71/71 齐）。
  ② **旧仓退役说明已推**——README 顶部横幅（`thincoder-vscode` 已并入 `thincoder` 单仓，指两远端 URL），两远端 `40409b4..6d07977` ✓。
  ③ **GitHub 归档已完成（2026-09-13）**——先清 issue 再冻结：
     · 旧仓 #6（子代理被杀 / 修复未同步）与 #7（行内代码未转义）→ 以 `completed` 关闭，各附证据评论（四子条测试锁 T-D1..T-D13 · `panel-messages.mjs:65-67` · `md.js:106/:45/:61/:147` + 回归用例 `md-render-escape.test.mjs:38-45`）。
     · #8（阅读强制跳底 / Thinking 默认展开）与 #5（Win10 界面异常 · 判定无法判定）→ 以 `not_planned` 关闭并**迁成合并仓新单 `thincoder#7` / `thincoder#8`**（正文带现态 `file:line` 与需求档 F-W2 相抵说明）。
     · 随后写仓库描述、再置 `archived=true`；**独立复核**（不带凭据走公开 API）确认 `archived=true` + 描述已变。
  **凭据纪律（如实记）**：写操作经 `git credential fill` 取用凭据并**仅在管道内传递**（不回显、不落盘、不入档），只打印 API 结果字段。
  ④ **Gitee 已置「关闭」（2026-09-13）**——独立复核：API `status="关闭"` ✓。**并实测判明了官方页面的自相矛盾**：关闭后 git 协议仍 `HTTP 200` 且 refs 可读 ⇒ **查看 / Pull 确为保留**（与官方表格一致、与「暂停」段正文相反）。注：其「仓库介绍」字段仍空（**关闭后设置锁**，无法再改）；退役信号由 **README 横幅**承担。
  **顺序依赖（已实核）**：退役说明**必须先于归档**推送（归档后不可写）——已按此序执行；而退役说明又必须先有合并仓在线（否则指向不存在的新家）——已按此序执行。
  **S0 回滚点仍在位**（`_merge-backup/thincoder-vscode.git` mirror 完好）——归档后如需取证仍可自备份取。**四步已全部完成，S3b 闭**。
  **推送暴露项（登记）**：GitHub 报 Dependabot 告警——合并仓预设分支 **1 高**（来自 VSC 产品依赖树，CLI 零依赖）、旧 VSC 仓 **5 高**（旧仓既有，随退役失效）。
- **另**：phase 2（核心统一）为独立需求，**未立项**。



