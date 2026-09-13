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

- **范围**：设计档 §2.15 S0–S3b——S0 全量备份（`git clone --mirror` 至仓外 + 未跟踪产物归档）与清理 · S1 CLI 顶层条目 `git mv` 至 `thincoder/` · S2 `git subtree add --prefix=thincoder-vscode` 并入 VSC 历史 · S3 仓根配置与总览 + CI 迁仓根 · S3b **旧 VSC 仓远端置归档 / 只读——不可逆，置前须用户确认**（设计档 §2.15 S3b）。
- **S2 并入前必验项**（设计档 §2.3 / §2.15 S2——必在副本仓先跑）：tag 行为实测（`subtree add` 干跑 + `git tag -l` 并入前后对比）与 graft 追溯实测（`git log --follow -m -- thincoder-vscode/package.json` + 跨搬迁档 `git blame` 抽查）——命令与输出逐字记录，结论落实施批 §5（供 T-M8 基准）。单 `--follow`（未给 `-m`）在 graft 合并提交上返回空——见设计档 §2.3 / §3.1 T-M4。
- **触碰面**：设计档 §2.14「结构搬迁」·「仓根级」·「CI」·「清理」行 + §2.9 / §2.10；产品 `src/**` 零改动（F7）。
- **验收**：§3 = T-M1 · T-M4 · T-M7 · T-M8 · T-M13 · T-M14 · T-M15 · T-M16 · T-M18；两产品测试（与迁移前基线一致）；三机检按 N3「机检不退化」口径（统一版落位 = S4）。
- **依赖**：无前置（设计档 §4 表）；本批为批 2–4 的前置。

### 批 2 · 机制退役（S4）

- **范围**：设计档 §2.15 S4——**首项 = 批 1 补正：产品级 `thincoder/.gitignore` 落位（内容与依据见设计档 §2.10）+ 探针验证 `git check-ignore` 命中**；
  R1–R9 · R16 判据删除 + 统一三档落位（档名 / 位置 / 执行根 / 扫描域两态——§2.5）+ 连带测试档与调用点处置（§2.14「测试」行 + VSC `package.json` `doc:check`——§2.8）+ `doc-impact.mjs` 措辞改写 + **本板块两档锚退场注记**（§2.5 尾条）+ 现行文档非命令形态脚本引用随批处置（§2.5 登记面）。
- **前置**：批 1 完成（硬依赖——见段首批序约束）；S2 必验记录在案（批 1 产出）。
- **触碰面**：设计档 §2.4 R1–R9 / R16 行 + §2.5 + §2.14「机检脚本（删改）/（新增）/ 测试（R1–R10 · R16 连带面）」行。
- **验收**：§3 = T-M5 · T-M6 · T-M9 · T-M10 · T-M11 · T-M17 · T-M20 · T-M21 · T-M22；三机检（仓根统一版）；两产品测试（调用点改指后全绿）。
- **依赖**：批 1（硬依赖）；本批为批 3 / 批 4 的前置（S 步连续——设计档 §2.15）。

### 批 3 · 提示词与文档（S5–S6）

- **范围**：设计档 §2.15 S5–S6——S5 提示词跨仓机制层退役（§2.7 分层处置）+ VSC `test/prompts-mirror-anchors.test.mjs` 跨仓断言段删（R10——单仓版双源守卫保留）+ 两产品 `AGENTS.md` 镜像约定段改写（R11）；S6 纪律句改写（R12–R15——含两产品 `docs/README.md` 自持段、提示词自持节两副本与端差句）+ R16 连带文档面退场注记 + 本板块两档复跑 V5 + 非命令形态引用登记面复核。
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
| 2 | 文件大小标注（criterion 8） | 🟡 | 受影响表未给上述被改文件的行数与 delta：`thincoder-vscode/test/doc-anchors.test.mjs`（实测末行 363——>300 行档位）· `thincoder/test/doc-consistency.test.mjs`（实测末行 310——>300 行档位）· 其余各档同缺；`thincoder/scripts/doc-impact.mjs`（§2.4 明言「随批改写措辞即可」——design:114）连行都未入表。 | 逐档补现况行数 + 预计 delta（净删为主）+ >300 行档的拆分审视结语；`doc-impact.mjs` 补入「机检脚本（删改）」行。 |
| 3 | 受影响面 / 文档处置 | 🟡 | 两产品 `AGENTS.md` 未入 §2.14 文档行（design:271）与 R 清单：CLI `AGENTS.md:21` / VSC `AGENTS.md:15`「镜像提示词约定」段＝跨仓机制叙述（byte-identical 约束已取消 / 「两端各自照抄」/ VSC 侧带 `thincoder/scripts/…`、`thincoder/docs/…` 路径指针）——按 F4 收窄口径（requirements:31）与 R11 需明示处置，否则该段在合并后仍以「本仓库 / thincoder-vscode」仓别键存活。 | 两档 AGENTS.md 纳入 R11/R12 处置面 + §2.14 文档行：写明改写范围（镜像约定段）或「不动 + 理由」。 |
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
| S1 | `1d450d2d887b184203a2397f01eb6c42541e1aed` | `git mv` CLI 顶层 13 项 → `thincoder/`（566 文件全 rename，0 insert/0 delete；`.gitattributes` / `.gitignore` 留仓根） | `reset --hard 406369f9` |
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
| `git log --follow --oneline -- thincoder/src/log.mjs` | 6 条（含 S1 搬迁提交 + 原提交）——CLI 侧跨搬迁归属连续 |

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
实测 `git check-ignore -v thincoder/.thincoder/tmp/x.txt` → **未命中**（exit 1），建探针文件后 `git status --porcelain` 报 `?? thincoder/.thincoder/tmp/`（可被误提交）。
对照：VSC 产品自带子目录 `.gitignore`，`thincoder-vscode/.thincoder/tmp/w.txt` 命中其 `.gitignore:7` ⇒ VSC 侧不受影响。
**本批未自造修法**（§2.14 仓根级清单只列 `.gitattributes`/`.gitignore`，无产品级新增项）；候选修法：(a) 增产品级 `thincoder/.gitignore`（§2.10「各产品子目录内可保留自有规则」已允许）；(b) 两条规则改非锚定形态（`**/.thincoder/index/` 等）。

**#3（🟡 §2.9「全域文档机检 step」未落地 · 转批 2）**：§2.9 要求仓根工作流增设「全域调用 step（统一脚本扫合并仓全域）」。
统一三档脚本按 §2.15 = S4（批 2）落位，本批此刻仓根 `scripts/` 不存在 ⇒ 该 step 若现在加即**knowingly 红**（违反「三机检 + 测试失败项不得带病推进」）。
本批按任务书 S3 落地**两产品各一 job**（CLI job 按 D11 补齐：`npm install` / `npm test` / `npm run lint`，与 VSC job 同构），**未加全域 step**——建议批 2（S4）落统一脚本同批补该 step（T-M28 为批 4 验收）。

**#4（🔵 迁移前既有环境红 · 非本批引入）**：CLI `test:full` 4 红 / VSC `test:full` 3 红 + `test:integration` 1 红，全部为 Windows `%TEMP%` 内只读 `.git` 对象的 teardown `EPERM`；
且**残留目录会污染后续轮次**（`ledger-*/doc-impact-*` 残留被 `discoverFamily` 当作同级项目 → 追加 `ERR_ASSERTION` 假红——已复现并定位）。
基线对照均在清残留后取得，前后一致。修复属产品测试面（F7 禁改运行逻辑；测试档改属批 2 R 计划面）⇒ 本批不动、如实上报。

#### 六、明示未做项

- **S3b**（旧 VSC 仓远端置归档/只读）：**未执行**（不可逆 + 设计内置用户确认门）。未 push、未改任何远端设置、未改旧 VSC 仓工作目录。
- **批 2–4 面**：R1–R9/R16 判据删除、统一三档脚本落位、提示词/文档纪律句改写、仓根全域机检 step、全量发布链演练——均未触碰（`thincoder/scripts/*` 与 `thincoder-vscode/scripts/*` 保持原样，判据零改）。
- **`thincoder-vscode/package.json` 的 `repository`**：未改（T-M7 ✓）。
- 本地为跑门禁在 `thincoder-vscode/` 执行过一次 `npm install`（`package-lock.json` 哈希 9b901c7c… 前后一致、git status 干净）；`node_modules/` 为该产品自有且被忽略，不进版本控制。


---

### 批 2 · 机制退役（S4）· 实施记录（eng-coder 自写 · 2026-09-13——前轮上下文崩溃后收窄续跑轮）

**范围**：设计档 §2.15 S4；批 2 验收 = §3 T-M5 · T-M6 · T-M9 · T-M10 · T-M11 · T-M17 · T-M20 · T-M21 · T-M22。
**执行根**：合并仓根 `d:\teamcode\thincoder`；产品域 = `thincoder/` · `thincoder-vscode/`。
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
| 批 1 补正 `.gitignore` | ✅ 已提交（`57087021`）；探针复核 `git check-ignore -v thincoder/.thincoder/tmp/probe.txt` → 命中 `thincoder/.gitignore:2:/.thincoder/tmp/` |
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
需注记面 = 设计档 `docs/design/TWO-REPO-MERGE.md` §2.4 **R1–R9 · R16 各行内的旧脚本坐标**（`thincoder/scripts/doc-anchors.mjs:73/:32/:173/:188-190/:31/:199` 等已删档行号）+ §2.14「机检脚本（删改）」行 + §2.5 内旧档名提及。
机器侧暂由 `MERGED_SCRIPTS` 并入映射兜底（V5 悬空 0）；语义层注记建议随 S6（与 #1 并批）。

**#4（🔵 范围外观察）**：`thincoder/docs/TODO.md` 存在父侧未提交改动（需求池 +1 条：「子 agent 需要上下文压缩机制」）——未入本批、未动；按「各仓自持」纪律其收口归父侧。

**#5（🔵 自审 + advisor 未执行）**：轮次预算收窄（父侧指示「优先收口落地」）——本批**未跑**内部 explore 审计与 advisor 代码评审；建议下一轮补跑，射程 = 批 2 全量（含 `66a1962a`）。

## §6 验证与收口（父代理自写）
