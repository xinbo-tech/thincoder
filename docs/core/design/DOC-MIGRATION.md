# 文档迁移台账（DOC-MIGRATION）· CLI 树 84 档二分与落点

> 归属 = **文档体系板块**（`docs/core/design/DOC-SYSTEM.md` 的下游执行表）；本档 = **CLI 树 84 档的逐档二分（活 / 历史）+ 落点 + 批次分组**的唯一权威表。
> 判据（**本节不复制**）→ `docs/core/design/DOC-SYSTEM.md` §5.1（P1–P5 归属判据句）· §4（目标目录结构）· §6（命名规则）。
> 迁法（用户 2026-09-14 裁定「**明显应该是 B**」）= **旧档留原地一字不改 + 内容补写 / 重建进根层**。
> 底本口径 = `thincoder-cli/docs/design/*.md`（47）+ `thincoder-cli/docs/requirements/*.md`（37）= **84 档**（不含 `design/prompts/` · `design/_archive/` · `docs/batches/`）。
> 依据口径 = 逐条 `file:line` 实核（as-of **2026-09-15**）；根层基准 = `docs/core/{design,requirements}/`（现 17 + 17 档）。
> 建档：2026-09-15（**eng-designer**——本批「二分 + 当场迁第一批」）；来源 = 原 `DOC-SYSTEM.md` §5.2 初分类表的**精化与证据补全**（承该档 §11 拆分规划）。

## 1. 口径与实点

| 面 | 底本目录 | 实点 |
|---|---|---|
| 设计档 | `thincoder-cli/docs/design/` | **47** |
| 需求档 | `thincoder-cli/docs/requirements/` | **37** |
| **合计** | —— | **84**（与 `DOC-SYSTEM.md` §5.2 计数口径逐格闭合） |

**判栏取值**（六类）：**本批迁**（活档 · **已入根层**——含历批已迁档，口径见 §5）· **已清**（根层已有同话题活档 · 无未并内容）· **尚有未并**（根层有同话题活档但仍有 CLI 侧内容未并入）· **历史**（已被现行设计取代 / 批档形态 ⇒ 不迁）· **待核**（两种读法单列——**已于 2026-09-15 裁定并清空**，见 §3）· **后续批**（活档 · 尚未迁）。

**落点列**：已落者写具体档路径；未落者只写**目录**（目标档尚不存在——不写假路径，避机检假锚）。

## 2. 二分表（逐档 84 行）

### 2.1 设计档（`thincoder-cli/docs/design/` · 47）

| # | 档 | 判 | 依据（file:line 实核） | 动作 / 落点 |
|---|---|---|---|---|
| 1 | ACP-CLIENT | 后续批 | 根层无同话题档；实装 `thincoder-cli/src/acp/` 在位；VSC 无实现（结构性不对称） | **P2** ⇒ 后续批 `docs/cli/design/` |
| 2 | ADVISOR-CONVERGENCE | **本批迁** | 活——根层无对应（`docs/core/design/CONSULTATION.md` §8.2 越段登记）；= advisor 评审收敛设计权威；1570 行超硬限 ⇒ 按「收敛本体 ⇄ 边缘守卫」拆两档 | 已落 `docs/core/design/ADVISOR-CONVERGENCE.md` + `docs/core/design/ADVISOR-GUARDS.md` |
| 3 | AGENT-LOOP | **尚有未并** | 根层已有同话题活档；未并入面 = 评审对象锚 / R1–R7 铁律 / 飞刀机制 / byte-identical 取消 / 普通模式轻量审计 | 后续批**并入既有** `docs/core/design/AGENT-LOOP.md` |
| 4 | AGENT-PARAMS | **本批迁** | 活——根层无对应（`AGENT-LOOP.md` §6.1 仅覆盖 maxTurns 默认；`timeoutMs` 面无主）；三参数默认值经实核（`thincoder-core/advisor/compaction.mjs:36` · `thincoder-core/config.mjs:36` · `thincoder-core/agent/helpers.mjs:25`） | 已落 `docs/core/design/AGENT-PARAMS.md` |
| 5 | APPLY-PATCH | **本批迁** | 根层无正文（`TOOLS.md` §8.2 登记「正文已拆到各工具权威档」= 无档名指针）；VSC 同名对位 | 已落 `docs/core/design/APPLY-PATCH.md` |
| 6 | ARCHITECTURE | **本批迁** | 活——根层原无架构总览载体（硬约束 / 设计原则 / 模块地图）；§3 模块地图为迁移前 `src/**` 树形态 ⇒ 照现状**重写** | 已落 `docs/core/design/ARCHITECTURE.md` |
| 7 | ASYNC-RESULT-CONTAINER | 历史 | 机制结论已全文入 `docs/core/design/AGENT-LOOP.md` §6.7.3（D2–D6 覆盖面）；余为批材料 | 不迁（就地留参照） |
| 8 | CHECKPOINT | 已清 | 对账：CLI §2–§8 ↔ 根层 §6.1–§6.8 + §7（§5.5 与附录由根层 §8.2 登记不并） | 无动作 |
| 9 | CONSULTATION | 已清 | 对账：CLI §2.1–§2.6 ↔ 根层 §6.1–§6.4 + §7 | 无动作 |
| 10 | CONTEXT-COMPACTION | 已清 | 对账：CLI §1–§12 ↔ 根层 §6.1–§6.12（D1–D13 / H1 / E1 全在场） | 无动作 |
| 11 | CRASH-REPORTS | 后续批 | 根层无对应；实装 `thincoder-cli/src/crash-reports.mjs` 在位；VSC 无此面 | **P2** ⇒ 后续批 `docs/cli/design/`（状态行漂移须收正） |
| 12 | DESIGN-TOKEN-SETTLEMENT | **本批迁** | 活——根层无对应；代码注释直引其 D3（`thincoder-core/token-ttl.mjs:20`）；结算面坐标经实核 | 已落 `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` |
| 13 | EDIT-HELPERS | **本批迁** | 根层无档名（`TOOLS.md` §6.6 末「共享 helper 权威 = 编辑辅助面」）；VSC 同名对位 | 已落 `docs/core/design/EDIT-HELPERS.md` |
| 14 | EDIT | **本批迁** | 同编辑族（`TOOLS.md` §8.2 登记）；VSC 同名对位 | 已落 `docs/core/design/EDIT.md` |
| 15 | ENG-TOKEN-BINDING | **本批迁** | 活——根层无对应；旧档 §4/§5 口径陈旧（单值镜像 vs D3 已退役）——**已随迁按现状收正**（旧句入落点档 §8.1） | 已落 `docs/core/design/ENG-TOKEN-BINDING.md` |
| 16 | ENGINEERING-MODE | **本批迁** | 活——根层无对应（`AGENT-LOOP.md` §8.2 缺档登记）；= 工作流机制判据权威；3030 行超硬限 ⇒ 按机制族拆四档 | 已落 `docs/core/design/{ENGINEERING-MODE,BATCH-RECORD,DOC-DISCIPLINE,LEDGER}.md` |
| 17 | ESCALATE | 后续批 | 根层部分（`AGENT-LOOP.md` §6.7.2 / §6.7.3）；主面 `CONSULTATION.md` §8.2 越段登记 | **P1** ⇒ 后续批 `docs/core/design/` |
| 18 | HASHLINE-EDIT | **本批迁** | 同编辑族；VSC 同名对位（`thincoder-vscode/src/tools/hashline-edit.mjs:12`） | 已落 `docs/core/design/HASHLINE-EDIT.md` |
| 19 | INSERT-AFTER | **本批迁** | 同编辑族；VSC 同名对位（`thincoder-vscode/src/tools/more-file.mjs:12`） | 已落 `docs/core/design/INSERT-AFTER.md` |
| 20 | LEDGER-SELF-CONTAINED | **本批迁** | 活——根层无对应（`WORKSPACE.md` §8.2 越段登记）；自持机制的唯一活载体；1033 行超硬限 ⇒ 台账机制面（L1–L3 与可见面）另立 `docs/core/design/LEDGER.md` | 已落 `docs/core/design/LEDGER-SELF-CONTAINED.md` |
| 21 | LOGGING | 已清 | 对账：CLI §2.1–§2.5 ↔ 根层 §6.1–§6.4（未并面已登记） | 无动作 |
| 22 | MCP | 已清 | 对账：CLI §1–§9 ↔ 根层 §6.1–§6.9（文案级残余见 §4 注） | 无动作 |
| 23 | MEMORY | 已清 | 对账：CLI §1–§10 ↔ 根层 §6.1–§6.8（常量与 `uid` 切分逐句同） | 无动作 |
| 24 | MULTI-INSTANCE-COLLAB | 后续批 | 根层无对应（`WORKSPACE.md` §8.2 越段登记）；双端语义对位 | **P1** ⇒ 后续批 `docs/core/design/` |
| 25 | POOL-CONFIG-UNIFIED | 后续批 | 根层无正文（`CONFIG.md` §8.2 登记「在途设计档」）；机制已实装（`thincoder-core/config.mjs:63`） | **P1** ⇒ 后续批**并入** `docs/core/design/CONFIG.md` |
| 26 | PORTABILITY | **本批迁** | 活——可移植性机制现行且根层零覆盖（分类裁判单源 `thincoder-core/conventions.mjs` 等，逐条实核） | 已落 `docs/core/design/PORTABILITY.md`（择机制面重建） |
| 27 | PROMPT-SYSTEM | **尚有未并** | 根层同名档仅覆盖核内裁决行；CLI 侧含分层 / 命名法 / 装配面（未并入面逐节在案） | 后续批**并入既有** `docs/core/design/PROMPT-SYSTEM.md` |
| 28 | PROVIDER | 已清 | 对账：CLI §1–§16 / §21 / §23 ↔ 根层 §6.1–§6.17 | 无动作 |
| 29 | PROXY | **本批迁** | 活——根层无正文（`CONFIG.md` §8.2 越段登记）；**§TLS 段与实装相反**（实装默认全量校验 + `insecureTls` 显式放行，`thincoder-core/proxy.mjs:214`）⇒ **按实装收正**；另 §web 消费面同陈旧（实装 = 逐次调用参数） | 已落 `docs/core/design/PROXY.md`（§3 / §4 按实装收正） |
| 30 | QUICKFIX-BATCH-3 | 历史 | 批档形态（需求→设计→用例→验收）；批已闭环；F-1 / F-2 由他批落地 | 不迁（就地留）；**F-3 / F-4 未落且无承载 ⇒ 须回写台账**（父侧） |
| 31 | RELEASE | **本批迁** | 活 · **CLI 面（P2）**——npm 发布面结构性只属 CLI（P5「P2 > P1」压过 VSC 同名对位档）；与需求档层归属不对称（见落点档档头注） | 已落 `docs/cli/design/RELEASE.md` |
| 32 | SEND-STALL-DISTILL | 后续批 | 根层部分（`CONTEXT-COMPACTION.md` §6.9 为蒸馏本体；异步时序无对应） | **P1** ⇒ 后续批 `docs/core/design/` |
| 33 | SESSION | 已清 | 对账：CLI §1–§14 ↔ 根层 §6.1–§6.14 | 无动作 |
| 34 | SETTINGS-TOOL | 后续批 | 根层无正文（`CONFIG.md` §8.2 越段登记；`TOOLS.md` §6.10 仅一句） | **P1** ⇒ 后续批 `docs/core/design/` |
| 35 | STRUCTURE-DEBT | **本批迁** | 活 · **统一面**（横切总账 / 分批入口路由）——旧债逐条实核后按现状重建：现行债入「现行债」节、已消解项入「已消解」节（防回潮） | 已落 `docs/core/design/STRUCTURE-DEBT.md` |
| 36 | SUBAGENT-ID-COUNTER-AGENT | 历史 | 已交付闭环（台账已核销）；机制已入核代码（`thincoder-core/agent-tools/subagent-scheduler.mjs`） | 不迁；取号公式句 ⇒ 后续批并入 `docs/core/design/AGENT-LOOP.md` 子代理池节 |
| 37 | SUBAGENT-OBSERVE-SEND | 历史 | 契约正文已入 `docs/core/design/AGENT-LOOP.md` §6.7.2 | 不迁（就地留参照） |
| 38 | TESTING | **本批迁** | 活——根层无对应（`CORE-UNIFICATION.md` 仅作跨树承载指针）；995 行超硬限 ⇒ 端到端 harness 另立一档 | 已落 `docs/core/design/TESTING.md` + `docs/core/design/E2E-HARNESS.md` |
| 39 | TOOL-OUTPUT-LIMITS | **本批迁** | 活——根层无对应（`AGENT-LOOP.md` §6.16 显式外指「工具输出上限系（CLI 仓·设计）」）；常量与坐标经实核 | 已落 `docs/core/design/TOOL-OUTPUT-LIMITS.md` |
| 40 | TOOLS | 已清 | 对账：根层 §6.1–§6.10 ↔ CLI §1–§11（根层反多 `timer` 校验句） | 无动作 |
| 41 | TUI-INPUT-BOX | 后续批 | 根层无对应；CLI 专有面 | **P2** ⇒ 后续批 `docs/cli/design/` |
| 42 | TUI-TOOL-OUTPUT | 后续批 | 同上 | **P2** ⇒ 后续批 `docs/cli/design/` |
| 43 | TUI | 后续批 | 同上（1529 行）；VSC 对位面 = webview 族（非同机制） | **P2** ⇒ 后续批（须拆分） |
| 44 | TURN-CAP-CONTINUE | 后续批 | 根层部分（`AGENT-LOOP.md` §6.1 / §6.2）；四执行体统一语义无对应 | **P1** ⇒ 后续批 `docs/core/design/` |
| 45 | TWO-REPO-MERGE | **本批迁** | 活 · **统一面**（架构级机制档）——退役清单 / 仓根状态 / 完成判据 / phase 2 通道**描述现行仓形态** | 已落 `docs/core/design/TWO-REPO-MERGE.md`（一次批次材料入不并节） |
| 46 | VERIFY-REDESIGN | **本批迁** | 活——根层无正文（`TOOLS.md` §6.7 verify 行 + D-V5 快路径仅契约要点）；契约 / guard / 双端坐标经实核 | 已落 `docs/core/design/VERIFY-REDESIGN.md` |
| 47 | WRITE | **本批迁** | 同编辑族（`TOOLS.md` §8.2 登记）；VSC 同名对位（`thincoder-vscode/src/tools/file.mjs:74`） | 已落 `docs/core/design/WRITE.md` |

### 2.2 需求档（`thincoder-cli/docs/requirements/` · 37）

| # | 档 | 判 | 依据（file:line 实核） | 动作 / 落点 |
|---|---|---|---|---|
| 1 | ACP-CLIENT | 后续批 | 根层无对应；单端面 | **P2** ⇒ 后续批 `docs/cli/requirements/` |
| 2 | ADVISOR-CONVERGENCE | 后续批 | 根层面级（`CONSULTATION.md` 面清单）· 条目未并入 | **P1** ⇒ 后续批并入既有 |
| 3 | AGENT-LOOP | **尚有未并** | 根层有活档；未并入面 = 4 个 VSC 面节（根层显式登记为不并 · 归 VSC 轮） | 对账完成（VSC 面按 P2 另判） |
| 4 | AGENT-PARAMS | 后续批 | 根层无对应 | **P1** ⇒ 后续批 `docs/core/requirements/` |
| 5 | ASYNC-RESULT-CONTAINER | 后续批 | 根层面级对位（机制本体已入设计侧 §6.7.3）· 条目未并入 | **P1** ⇒ 后续批并入既有 |
| 6 | CHECKPOINT | 已清 | 对账：CLI §1–§4 ↔ 根层 §4.1–§4.3 | 无动作 |
| 7 | CONSULTATION | 已清 | 对账：CLI ↔ 根层 §4.1–§4.3 | 无动作 |
| 8 | CONTEXT-COMPACTION | 已清 | 对账：CLI ↔ 根层 §4.1–§4.2（含 2026-09-11 修订括注） | 无动作 |
| 9 | CRASH-REPORTS | 后续批 | 根层无对应（`thincoder-cli/docs/requirements/CRASH-REPORTS.md` 自述 VSC 端无此面） | **P2** ⇒ 后续批 `docs/cli/requirements/` |
| 10 | DESIGN-TOKEN-SETTLEMENT | 后续批 | 根层无同话题档 | **P1** ⇒ 后续批 `docs/core/requirements/` |
| 11 | ENG-TOKEN-BINDING | 后续批 | 根层无对应 | **P1** ⇒ 后续批 `docs/core/requirements/` |
| 12 | ENGINEERING-MODE | **本批迁** | 活——根层无对应（1003 行超硬限 ⇒ 按「工作流本体 ⇄ 机制面」拆两档） | 已落 `docs/core/requirements/ENGINEERING-MODE.md` + `docs/core/requirements/ENGINEERING-MODE-MECHANISM.md` |
| 13 | ESCALATE | 后续批 | 根层面级（`CONSULTATION.md` + `AGENT-LOOP.md`）· 条目未并入 | **P1** ⇒ 后续批并入既有 |
| 14 | FEATURES | **本批迁** | 活 · **CLI 面（P2）**——内容为 CLI 能力全览（含 TUI / slash 命令面） | 已落 `docs/cli/requirements/FEATURES.md`（清点面按现行登记面收正） |
| 15 | LOGGING | 已清 | 对账：CLI ↔ 根层 §4.1–§4.3（1 处文本级降级 —— 见 §4 注） | 无动作 |
| 16 | MCP | 已清 | 对账：CLI §1–§4 ↔ 根层 §4.1–§4.4 | 无动作 |
| 17 | MEMORY | **尚有未并** | 根层同名档无需求条目节；CLI 侧整档条目面未并（三层记忆 / N1–N4 / VSC 向量索引 / `~` 展开 / 检索上界） | 后续批**并入既有** `docs/core/requirements/MEMORY.md` |
| 18 | MULTI-INSTANCE-COLLAB | 后续批 | 根层越段登记（`WORKSPACE.md` §4 末 / §8.2） | **P1** ⇒ 后续批 `docs/core/requirements/` |
| 19 | NORMAL-MODE | 后续批 | 根层无对应（与提示词系统面相邻） | **P1** ⇒ 后续批 `docs/core/requirements/` |
| 20 | PHILOSOPHY | **本批迁** | 活 · **统一面**（三观 = 最高层需求；提示词正本已归 `docs/core/design/prompts/`） | 已落 `docs/core/requirements/PHILOSOPHY.md` |
| 21 | PORTABILITY | 后续批 | 根层无对应（正文居 CLI `design/ENGINEERING-MODE.md` §2 FR10–FR15） | **P1** ⇒ 后续批 `docs/core/requirements/` |
| 22 | PROJECT | 后续批 | 根层无对应；产品级定性 | **P1** ⇒ 后续批 `docs/core/requirements/` |
| 23 | PROMPT-SYSTEM | **尚有未并** | 根层同名档仅含 F8 + 两条回填；CLI 侧分层模型 / 装配矩阵 / 命名法 / 编写纪律未并入 | 后续批**并入既有** `docs/core/requirements/PROMPT-SYSTEM.md` |
| 24 | RELEASE | **本批迁** | 活 · **统一面**（发布流程 = 跨产品板块主题）；**与设计档层归属不对称**（设计 = CLI 面）——两侧档头互注配对档位置 | 已落 `docs/core/requirements/RELEASE.md` |
| 25 | SEND-STALL-DISTILL | 后续批 | 根层部分（`CONTEXT-COMPACTION.md` §4.2 为机制本体；时序条未并入） | **P1** ⇒ 后续批并入既有 |
| 26 | SESSION | 已清 | 对账：CLI ↔ 根层 §4.1–§4.4 | 无动作 |
| 27 | SETTINGS-TOOL | 后续批 | 根层越段登记（`CONFIG.md` §8.2） | **P1** ⇒ 后续批 `docs/core/requirements/` |
| 28 | STRUCTURE-DEBT | 后续批 | 根层无对应（`:29` N5 仍为合并前措辞——须随迁收正） | **P1** ⇒ 后续批 `docs/core/requirements/` |
| 29 | SUBAGENT-OBSERVE-SEND | 后续批 | 根层面级对位 · 条目未并入 | **P1** ⇒ 后续批并入既有 |
| 30 | TESTING | **本批迁** | 活——根层无对应 | 已落 `docs/core/requirements/TESTING.md` |
| 31 | TOOL-OUTPUT-LIMITS | 后续批 | 根层部分（`TOOLS.md` §4.3 N5——64K 阈值与保头保尾未并入） | **P1** ⇒ 后续批并入既有 |
| 32 | TOOLS | 已清 | 对账：CLI §1–§4 ↔ 根层 §4.1–§4.4 | 无动作 |
| 33 | TUI-TOOL-OUTPUT | 后续批 | 根层无对应 | **P2** ⇒ 后续批 `docs/cli/requirements/` |
| 34 | TUI | 后续批 | 根层无对应 | **P2** ⇒ 后续批 `docs/cli/requirements/` |
| 35 | TURN-CAP-CONTINUE | 后续批 | 根层部分 | **P1** ⇒ 后续批并入既有 |
| 36 | TWO-REPO-MERGE | **本批迁** | 活 · **统一面**（同设计侧） | 已落 `docs/core/requirements/TWO-REPO-MERGE.md` |
| 37 | VERIFY-REDESIGN | 后续批 | 部分面已被 `TOOLS.md` D-V5 接管 | **P1** ⇒ 后续批并入既有 |

## 3. 待核（**已清空** —— 2026-09-15 裁定后全部定判）

**去向**：原 9 档（两种读法单列）已由**用户 2026-09-15 裁定**逐档定判，并**同批实迁**——判与落点见 §2.1 / §2.2 对应行的「判」与「动作 / 落点」列（本表不再另立——D2 单一权威源）。
裁定前的两读法（历史 / 活 · P1 / P2 / P3）与逐档依据 = 一次性裁定材料，留痕入 `docs/batches/` 迁移批次档 §2（本批）；各档「依据」列已按裁定后的**现状实核**改写。
**层归属不对称登记**：`RELEASE` 两档跨部分成对（设计 = `docs/cli/design/` · 需求 = `docs/core/requirements/`）——各自档头互注配对档位置（防读者以为漏档）。

**迁移注意项（判栏无分歧 ⇒ 不入上表）**：`design/TUI-INPUT-BOX.md` 二态混装（当前态 + §8 / §9 目标态）——落点 P2 无分歧；迁时须按该档 §9.6 收口。

## 4. 对账：已并入的 11 板块

| # | 板块 | 设计侧 | 需求侧 |
|---|---|---|---|
| 1 | AGENT-LOOP | **尚有未并**（评审对象锚 / 铁律 / 飞刀 / byte-identical / 轻量审计） | **尚有未并**（4 个 VSC 面节——根层登记为不并） |
| 2 | MEMORY | 已清 | **尚有未并**（整档需求条目面未并） |
| 3 | SESSION | 已清 | 已清 |
| 4 | PROVIDER | 已清 | CLI 侧无档（需求层同档承载） |
| 5 | TOOLS | 已清 | 已清 |
| 6 | MCP | 已清（文案级残余：`maskToken` 阈值 / 逐传输必填字段） | 已清 |
| 7 | TRACES | CLI 侧无档（两侧均无） | CLI 侧无档 |
| 8 | LOGGING | 已清 | 已清（1 处文本级降级：挂起期输入事件 v1 不记——句未并） |
| 9 | CONSULTATION | 已清 | 已清 |
| 10 | CONTEXT-COMPACTION | 已清 | 已清 |
| 11 | CHECKPOINT | 已清 | 已清 |

**口径**：已清 = 无独有机制 / 条目；尚有未并 = 根层缺实质内容（后续批并入）；「文案级 / 文本级」残余 = 不足以判未并，但如实登记。

## 5. 小计闭合（与 §1 实点总数对齐）

| 判 | 设计 47 | 需求 37 | 合计 |
|---|---|---|---|
| 本批迁（已入根层） | 21 | 6 | **27** |
| 已清 | 9 | 7 | **16** |
| 尚有未并 | 1 | 3 | **4** |
| 历史（不迁） | 4 | 0 | **4** |
| 待核 | 0 | 0 | **0** |
| 后续批 | 12 | 21 | **33** |
| **总** | **47** | **37** | **84** |

**闭合校验**：设计 21+9+1+4+0+12 = 47 ✓ · 需求 6+7+3+0+0+21 = 37 ✓ · 合计 27+16+4+4+0+33 = 84 ✓（= §1 实点；与 `DOC-SYSTEM.md` §5.2 计数口径一致）。
**「本批迁」口径**：= 截至 2026-09-15 **已迁入根层的活档合计**（第 1 批 6 + 第 2 批 9 + 第 3 批 6 + **第 4 批 6 = 27**）——本栏随迁移推进**单调递增、不重置**；后续批执行时只递增本栏与递减「后续批」栏，其余栏不动。

## 6. 后续批分组建议（活档剩余 33 档）

| 批 | 组 | 档 | 备注 |
|---|---|---|---|
| 批 2 | **机制小档（P1 · 各 ≤200 行）** | design：TOOL-OUTPUT-LIMITS · AGENT-PARAMS · VERIFY-REDESIGN · DESIGN-TOKEN-SETTLEMENT · ENG-TOKEN-BINDING · PROXY | **已落（2026-09-15 第 3 批）**——六档全迁 `docs/core/design/`；PROXY §TLS 安全语义已按实装收正（`thincoder-core/proxy.mjs:214`） |
| 批 3 | **大档拆分（一档一批）** | design：ENGINEERING-MODE（3030）· ADVISOR-CONVERGENCE（1570）· LEDGER-SELF-CONTAINED（1033）· TESTING（995）· req：ENGINEERING-MODE（1003）· TESTING（177） | **已落（2026-09-15 第 4 批）**——四档设计侧拆为 9 档、需求侧拆为 3 档（均落 `docs/core/{design,requirements}/`）；逐档 ≤500 |
| 批 4 | **并入既有档的未并面** | design：AGENT-LOOP · PROMPT-SYSTEM · POOL-CONFIG-UNIFIED ⇒ CONFIG；req：MEMORY · AGENT-LOOP · PROMPT-SYSTEM · ADVISOR-CONVERGENCE · ASYNC-RESULT-CONTAINER · ESCALATE · SEND-STALL-DISTILL · SUBAGENT-OBSERVE-SEND · TURN-CAP-CONTINUE · TOOL-OUTPUT-LIMITS | 并入面 = 追加节，不新起档（防同名分裂） |
| 批 5 | **CLI 专有面（P2）** | design：TUI · TUI-INPUT-BOX · TUI-TOOL-OUTPUT · ACP-CLIENT · CRASH-REPORTS；req：TUI · TUI-TOOL-OUTPUT · ACP-CLIENT · CRASH-REPORTS | **前置已满足（2026-09-15 第 2 批）**：`docs/cli/` 已建且 `docs/cli/design` + `docs/cli/requirements` 已入两扫描器射程（`V5_SCAN_DIRS` · `SCAN_DIRS`）——搬档不改射程 = 无守卫窗口 |
| 批 6a | **其余 P1 活档（设计侧）** | MULTI-INSTANCE-COLLAB · SETTINGS-TOOL · SEND-STALL-DISTILL · TURN-CAP-CONTINUE | 逐批 ≤6 档拆细 |
| 批 6b | **其余 P1 活档（需求侧）** | AGENT-PARAMS · DESIGN-TOKEN-SETTLEMENT · ENG-TOKEN-BINDING · MULTI-INSTANCE-COLLAB · NORMAL-MODE · PORTABILITY · PROJECT · SETTINGS-TOOL · STRUCTURE-DEBT · TESTING · VERIFY-REDESIGN | 同上（逐批 ≤6 档） |
| 批 7 | **待核裁定后落地** | §3 各档（先由父侧 / 用户裁定读法） | 裁定前不动 |

## 7. 不并项与历史沿革（本台账层）

### 7.1 历史沿革（(d) 类——**不并**）

> 本台账的前身 = `docs/core/design/DOC-SYSTEM.md` §5.2 初分类表（2026-09-14 建档）——**该表已被本档 §2 取代**（判据句仍住该档 §5.1，本档不复制）。

| 旧表节 | 内容 | 何故不并 |
|---|---|---|
| `DOC-SYSTEM.md` §5.2 的档名穷举行 | 三行并列档名清单 | 形态不可逐档挂依据 / 动作——现改为逐档一行的二分表 |
| 初分类「待核」列的 3 档 | 代理倾向与判读分歧 | 已逐档复核：POOL-CONFIG-UNIFIED 撤销待核（机制面确证 P1）· QUICKFIX-BATCH-3 与 SUBAGENT-ID-COUNTER-AGENT 转判历史 |

### 7.2 不并项登记（跨板块 / 一次性材料——**不并**，逐项登记）

| 面 | 内容 | 何故不并（去向 / 触发） |
|---|---|---|
| 各批的搬迁记录 | 逐批执行流水 | 一次性批次材料——归批次档（`docs/batches/`） |
| VSC 树档的二分 | `thincoder-vscode/docs/**` | 段序裁定「CLI 先全完 ⇒ 才动 VSC」——触发 = VSC 轮 |
| 产品树 `_archive/` 与 `batches/` | 归档 / 时序日志 | 不进二分底本（§1 口径已排除） |

## 8. 体量与拆分规划（R24a）

**实测行数**：本档 **214 行**（as-of 2026-09-15 第 4 批实核 · 含 84 行逐档表）——低于 300 行软线，无需拆分规划；若后续批执行记录再入本档，须改行数口径并重评。

## 变更记录

- 2026-09-15（**迁移批 · 第 4 批 · 四个大档拆分 + 实迁** · eng-designer）：§2.1 四行（第 2 / 16 / 20 / 38 行）+ §2.2 两行（第 12 / 30 行）「后续批」→「**本批迁**」（ADVISOR-CONVERGENCE · ENGINEERING-MODE · LEDGER-SELF-CONTAINED · TESTING · req/ENGINEERING-MODE · req/TESTING——逐行补现状实核依据 + 落点）；§6 批 3 行标**已落**（档名补 req 两档）、标题档数 39 → **33**。
  §5 小计重算闭合（本批迁 21 → **27** · 后续批 39 → **33**；设计 21 / 需求 6）；§5 口径行补第 4 批；§8 行数重核。
  **本批实迁 6 档**（皆超 500 硬限 ⇒ 先拆后迁）——`design/ENGINEERING-MODE`（3030）⇒ `docs/core/design/` 四档（ENGINEERING-MODE · BATCH-RECORD · DOC-DISCIPLINE · LEDGER）；
  `design/ADVISOR-CONVERGENCE`（1570）⇒ 两档（ADVISOR-CONVERGENCE · ADVISOR-GUARDS）；`design/LEDGER-SELF-CONTAINED`（1033）⇒ 一档；`design/TESTING`（995）⇒ 两档（TESTING · E2E-HARNESS）；
  `req/ENGINEERING-MODE`（1003）⇒ 两档（ENGINEERING-MODE · ENGINEERING-MODE-MECHANISM）；`req/TESTING`（177）⇒ 一档。
  产物 12 档**逐档 ≤500**（实测 191–380）；坐标全量改现状路径（检查器改指仓根 `scripts/` · 运行期模块改指 `thincoder-core/**` · 测试/入口改指 `thincoder-cli/**`）；一次性材料（逐批设计记录 / 受影响文件 as-of 快照 / 用例与 AC 编号集 / 状态行）逐档登记入各档「不并项与历史沿革」。
- 2026-09-15（**迁移批 · 第 3 批 · 机制小档 6 档实迁** · eng-designer）：§2.1 六行「后续批」→「**本批迁**」（AGENT-PARAMS · DESIGN-TOKEN-SETTLEMENT · ENG-TOKEN-BINDING · PROXY · TOOL-OUTPUT-LIMITS · VERIFY-REDESIGN——逐行补现状实核依据 + 落点）；§6 批 2 行标**已落**、标题档数 45 → 39。
  §5 小计重算闭合（本批迁 15 → 21 · 后续批 45 → 39；设计 17 / 需求 4）；§5 口径行补第 3 批；§8 行数重核。
  **本批实迁 6 档**（全落 `docs/core/design/`）：TOOL-OUTPUT-LIMITS · AGENT-PARAMS · VERIFY-REDESIGN · DESIGN-TOKEN-SETTLEMENT · ENG-TOKEN-BINDING · PROXY。
  **按现状收正两处**（登记于各落点档 §8.1）：PROXY §TLS 安全语义（旧档与实装相反）+ PROXY §web 消费面（web 工具已改逐次调用参数）；ENG-TOKEN-BINDING §4/§5 口径（单值镜像已退役 / 宿主模块已拆）。
- 2026-09-15（**迁移批 · 第 2 批 · 待核 9 档收口 + 实迁** · eng-designer）：§3 待核**清空**（原 9 档经用户裁定逐档定判并同批实迁——判与落点入 §2.1 / §2.2 对应行；裁定前两读法入批次档 §2）；§5 小计重算闭合（待核 9 → 0；本批迁 6 → 15）并补「本批迁」口径行；§6 批 5 备注改「前置已满足」（`docs/cli/` 已建 + 射程已扩）；§1 判栏取值改六类并标「待核已清空」；§8 行数收正。
  **本批实迁 9 档**：`docs/core/design/` 的 ARCHITECTURE · PORTABILITY · STRUCTURE-DEBT · TWO-REPO-MERGE，`docs/cli/design/` 的 RELEASE，`docs/cli/requirements/` 的 FEATURES，`docs/core/requirements/` 的 PHILOSOPHY · RELEASE · TWO-REPO-MERGE。
- 2026-09-15（**迁移批 · 二分 + 当场迁第一批 · eng-designer**）：建档——承 `DOC-SYSTEM.md` §11 拆分规划，把该档 §5.2 初分类表精化搬入本档并逐档补证据（`file:line`）；新增 §5 小计闭合 · §6 后续批分组；§3 待核 9 档（两种读法）；第一批已迁 6 档（编辑工具族——见 §2.1 第 5 / 13 / 14 / 18 / 19 / 47 行）。
