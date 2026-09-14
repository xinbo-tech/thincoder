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

**判栏取值**（四态 + 一类）：**本批迁**（活档 · 已入根层）· **已清**（根层已有同话题活档 · 无未并内容）· **尚有未并**（根层有同话题活档但仍有 CLI 侧内容未并入）· **历史**（已被现行设计取代 / 批档形态 ⇒ 不迁）· **待核**（两种读法 · 见 §3）· **后续批**（活档 · 本批未迁）。

**落点列**：已落者写具体档路径；未落者只写**目录**（目标档尚不存在——不写假路径，避机检假锚）。

## 2. 二分表（逐档 84 行）

### 2.1 设计档（`thincoder-cli/docs/design/` · 47）

| # | 档 | 判 | 依据（file:line 实核） | 动作 / 落点 |
|---|---|---|---|---|
| 1 | ACP-CLIENT | 后续批 | 根层无同话题档；实装 `thincoder-cli/src/acp/` 在位；VSC 无实现（结构性不对称） | **P2** ⇒ 后续批 `docs/cli/design/` |
| 2 | ADVISOR-CONVERGENCE | 后续批 | 根层无对应（`docs/core/design/CONSULTATION.md` §8.2 越段登记）；= advisor 评审收敛设计权威 | **P1** ⇒ 后续批 `docs/core/design/`（须拆分） |
| 3 | AGENT-LOOP | **尚有未并** | 根层已有同话题活档；未并入面 = 评审对象锚 / R1–R7 铁律 / 飞刀机制 / byte-identical 取消 / 普通模式轻量审计 | 后续批**并入既有** `docs/core/design/AGENT-LOOP.md` |
| 4 | AGENT-PARAMS | 后续批 | 根层无对应（`AGENT-LOOP.md` §6.1 仅覆盖 maxTurns 默认；`timeoutMs` 面无主） | **P1** ⇒ 后续批 `docs/core/design/` |
| 5 | APPLY-PATCH | **本批迁** | 根层无正文（`TOOLS.md` §8.2 登记「正文已拆到各工具权威档」= 无档名指针）；VSC 同名对位 | 已落 `docs/core/design/APPLY-PATCH.md` |
| 6 | ARCHITECTURE | **待核** | §3 模块地图列 `src/**`（模块已入核）⇒ 活 / 历史两读 | 见 §3 |
| 7 | ASYNC-RESULT-CONTAINER | 历史 | 机制结论已全文入 `docs/core/design/AGENT-LOOP.md` §6.7.3（D2–D6 覆盖面）；余为批材料 | 不迁（就地留参照） |
| 8 | CHECKPOINT | 已清 | 对账：CLI §2–§8 ↔ 根层 §6.1–§6.8 + §7（§5.5 与附录由根层 §8.2 登记不并） | 无动作 |
| 9 | CONSULTATION | 已清 | 对账：CLI §2.1–§2.6 ↔ 根层 §6.1–§6.4 + §7 | 无动作 |
| 10 | CONTEXT-COMPACTION | 已清 | 对账：CLI §1–§12 ↔ 根层 §6.1–§6.12（D1–D13 / H1 / E1 全在场） | 无动作 |
| 11 | CRASH-REPORTS | 后续批 | 根层无对应；实装 `thincoder-cli/src/crash-reports.mjs` 在位；VSC 无此面 | **P2** ⇒ 后续批 `docs/cli/design/`（状态行漂移须收正） |
| 12 | DESIGN-TOKEN-SETTLEMENT | 后续批 | 根层无对应；代码注释直引其 D3（`thincoder-core/token-ttl.mjs:20`） | **P1** ⇒ 后续批 `docs/core/design/` |
| 13 | EDIT-HELPERS | **本批迁** | 根层无档名（`TOOLS.md` §6.6 末「共享 helper 权威 = 编辑辅助面」）；VSC 同名对位 | 已落 `docs/core/design/EDIT-HELPERS.md` |
| 14 | EDIT | **本批迁** | 同编辑族（`TOOLS.md` §8.2 登记）；VSC 同名对位 | 已落 `docs/core/design/EDIT.md` |
| 15 | ENG-TOKEN-BINDING | 后续批 | 根层无对应；旧档 §4 口径陈旧（单值镜像 vs D3 已退役）——须随迁同步 | **P1** ⇒ 后续批 `docs/core/design/` |
| 16 | ENGINEERING-MODE | 后续批 | 根层无对应（`AGENT-LOOP.md` §8.2 缺档登记）；= 工作流机制判据权威 | **P1** ⇒ 后续批（3030 行 · 须拆分） |
| 17 | ESCALATE | 后续批 | 根层部分（`AGENT-LOOP.md` §6.7.2 / §6.7.3）；主面 `CONSULTATION.md` §8.2 越段登记 | **P1** ⇒ 后续批 `docs/core/design/` |
| 18 | HASHLINE-EDIT | **本批迁** | 同编辑族；VSC 同名对位（`thincoder-vscode/src/tools/hashline-edit.mjs:12`） | 已落 `docs/core/design/HASHLINE-EDIT.md` |
| 19 | INSERT-AFTER | **本批迁** | 同编辑族；VSC 同名对位（`thincoder-vscode/src/tools/more-file.mjs:12`） | 已落 `docs/core/design/INSERT-AFTER.md` |
| 20 | LEDGER-SELF-CONTAINED | 后续批 | 根层无对应（`WORKSPACE.md` §8.2 越段登记）；自持机制的唯一活载体 | **P1** ⇒ 后续批（1033 行 · 须拆分） |
| 21 | LOGGING | 已清 | 对账：CLI §2.1–§2.5 ↔ 根层 §6.1–§6.4（未并面已登记） | 无动作 |
| 22 | MCP | 已清 | 对账：CLI §1–§9 ↔ 根层 §6.1–§6.9（文案级残余见 §4 注） | 无动作 |
| 23 | MEMORY | 已清 | 对账：CLI §1–§10 ↔ 根层 §6.1–§6.8（常量与 `uid` 切分逐句同） | 无动作 |
| 24 | MULTI-INSTANCE-COLLAB | 后续批 | 根层无对应（`WORKSPACE.md` §8.2 越段登记）；双端语义对位 | **P1** ⇒ 后续批 `docs/core/design/` |
| 25 | POOL-CONFIG-UNIFIED | 后续批 | 根层无正文（`CONFIG.md` §8.2 登记「在途设计档」）；机制已实装（`thincoder-core/config.mjs:63`） | **P1** ⇒ 后续批**并入** `docs/core/design/CONFIG.md` |
| 26 | PORTABILITY | **待核** | 批设计稿 vs 机制载体两读 | 见 §3 |
| 27 | PROMPT-SYSTEM | **尚有未并** | 根层同名档仅覆盖核内裁决行；CLI 侧含分层 / 命名法 / 装配面（未并入面逐节在案） | 后续批**并入既有** `docs/core/design/PROMPT-SYSTEM.md` |
| 28 | PROVIDER | 已清 | 对账：CLI §1–§16 / §21 / §23 ↔ 根层 §6.1–§6.17 | 无动作 |
| 29 | PROXY | 后续批 | 根层无正文（`CONFIG.md` §8.2 越段登记）；**§TLS 段与现行实现相反**（现行默认校验 + `insecureTls` 显式放行） | **P1** ⇒ 后续批（**先更正安全语义再迁**） |
| 30 | QUICKFIX-BATCH-3 | 历史 | 批档形态（需求→设计→用例→验收）；批已闭环；F-1 / F-2 由他批落地 | 不迁（就地留）；**F-3 / F-4 未落且无承载 ⇒ 须回写台账**（父侧） |
| 31 | RELEASE | **待核** | P1 / P2 两读 | 见 §3 |
| 32 | SEND-STALL-DISTILL | 后续批 | 根层部分（`CONTEXT-COMPACTION.md` §6.9 为蒸馏本体；异步时序无对应） | **P1** ⇒ 后续批 `docs/core/design/` |
| 33 | SESSION | 已清 | 对账：CLI §1–§14 ↔ 根层 §6.1–§6.14 | 无动作 |
| 34 | SETTINGS-TOOL | 后续批 | 根层无正文（`CONFIG.md` §8.2 越段登记；`TOOLS.md` §6.10 仅一句） | **P1** ⇒ 后续批 `docs/core/design/` |
| 35 | STRUCTURE-DEBT | **待核** | 活 / 历史混合 + P1 / P3 两读 | 见 §3 |
| 36 | SUBAGENT-ID-COUNTER-AGENT | 历史 | 已交付闭环（台账已核销）；机制已入核代码（`thincoder-core/agent-tools/subagent-scheduler.mjs`） | 不迁；取号公式句 ⇒ 后续批并入 `docs/core/design/AGENT-LOOP.md` 子代理池节 |
| 37 | SUBAGENT-OBSERVE-SEND | 历史 | 契约正文已入 `docs/core/design/AGENT-LOOP.md` §6.7.2 | 不迁（就地留参照） |
| 38 | TESTING | 后续批 | 根层无对应（`CORE-UNIFICATION.md` 仅作跨树承载指针） | **P1** ⇒ 后续批（995 行 · 须拆分） |
| 39 | TOOL-OUTPUT-LIMITS | 后续批 | 根层无对应（`AGENT-LOOP.md` §6.16 显式外指「工具输出上限系（CLI 仓·设计）」） | **P1** ⇒ 后续批 `docs/core/design/` |
| 40 | TOOLS | 已清 | 对账：根层 §6.1–§6.10 ↔ CLI §1–§11（根层反多 `timer` 校验句） | 无动作 |
| 41 | TUI-INPUT-BOX | 后续批 | 根层无对应；CLI 专有面 | **P2** ⇒ 后续批 `docs/cli/design/` |
| 42 | TUI-TOOL-OUTPUT | 后续批 | 同上 | **P2** ⇒ 后续批 `docs/cli/design/` |
| 43 | TUI | 后续批 | 同上（1529 行）；VSC 对位面 = webview 族（非同机制） | **P2** ⇒ 后续批（须拆分） |
| 44 | TURN-CAP-CONTINUE | 后续批 | 根层部分（`AGENT-LOOP.md` §6.1 / §6.2）；四执行体统一语义无对应 | **P1** ⇒ 后续批 `docs/core/design/` |
| 45 | TWO-REPO-MERGE | **待核** | phase 1 已闭环；P3 / P2 两读 | 见 §3 |
| 46 | VERIFY-REDESIGN | 后续批 | 根层无正文（`TOOLS.md` §6.7 verify 行 + D-V5 快路径仅契约要点） | **P1** ⇒ 后续批 `docs/core/design/` |
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
| 12 | ENGINEERING-MODE | 后续批 | 根层无对应（1003 行） | **P1** ⇒ 后续批（须拆分） |
| 13 | ESCALATE | 后续批 | 根层面级（`CONSULTATION.md` + `AGENT-LOOP.md`）· 条目未并入 | **P1** ⇒ 后续批并入既有 |
| 14 | FEATURES | **待核** | 非三层档（自述「从属于代码」）⇒ P2 / 不迁两读 | 见 §3 |
| 15 | LOGGING | 已清 | 对账：CLI ↔ 根层 §4.1–§4.3（1 处文本级降级 —— 见 §4 注） | 无动作 |
| 16 | MCP | 已清 | 对账：CLI §1–§4 ↔ 根层 §4.1–§4.4 | 无动作 |
| 17 | MEMORY | **尚有未并** | 根层同名档无需求条目节；CLI 侧整档条目面未并（三层记忆 / N1–N4 / VSC 向量索引 / `~` 展开 / 检索上界） | 后续批**并入既有** `docs/core/requirements/MEMORY.md` |
| 18 | MULTI-INSTANCE-COLLAB | 后续批 | 根层越段登记（`WORKSPACE.md` §4 末 / §8.2） | **P1** ⇒ 后续批 `docs/core/requirements/` |
| 19 | NORMAL-MODE | 后续批 | 根层无对应（与提示词系统面相邻） | **P1** ⇒ 后续批 `docs/core/requirements/` |
| 20 | PHILOSOPHY | **待核** | 非三层档（自述「三观不在三层之内」）⇒ P1 / 落根两读 | 见 §3 |
| 21 | PORTABILITY | 后续批 | 根层无对应（正文居 CLI `design/ENGINEERING-MODE.md` §2 FR10–FR15） | **P1** ⇒ 后续批 `docs/core/requirements/` |
| 22 | PROJECT | 后续批 | 根层无对应；产品级定性 | **P1** ⇒ 后续批 `docs/core/requirements/` |
| 23 | PROMPT-SYSTEM | **尚有未并** | 根层同名档仅含 F8 + 两条回填；CLI 侧分层模型 / 装配矩阵 / 命名法 / 编写纪律未并入 | 后续批**并入既有** `docs/core/requirements/PROMPT-SYSTEM.md` |
| 24 | RELEASE | **待核** | P1 / P3 两读 | 见 §3 |
| 25 | SEND-STALL-DISTILL | 后续批 | 根层部分（`CONTEXT-COMPACTION.md` §4.2 为机制本体；时序条未并入） | **P1** ⇒ 后续批并入既有 |
| 26 | SESSION | 已清 | 对账：CLI ↔ 根层 §4.1–§4.4 | 无动作 |
| 27 | SETTINGS-TOOL | 后续批 | 根层越段登记（`CONFIG.md` §8.2） | **P1** ⇒ 后续批 `docs/core/requirements/` |
| 28 | STRUCTURE-DEBT | 后续批 | 根层无对应（`:29` N5 仍为合并前措辞——须随迁收正） | **P1** ⇒ 后续批 `docs/core/requirements/` |
| 29 | SUBAGENT-OBSERVE-SEND | 后续批 | 根层面级对位 · 条目未并入 | **P1** ⇒ 后续批并入既有 |
| 30 | TESTING | 后续批 | 根层无对应 | **P1** ⇒ 后续批 `docs/core/requirements/` |
| 31 | TOOL-OUTPUT-LIMITS | 后续批 | 根层部分（`TOOLS.md` §4.3 N5——64K 阈值与保头保尾未并入） | **P1** ⇒ 后续批并入既有 |
| 32 | TOOLS | 已清 | 对账：CLI §1–§4 ↔ 根层 §4.1–§4.4 | 无动作 |
| 33 | TUI-TOOL-OUTPUT | 后续批 | 根层无对应 | **P2** ⇒ 后续批 `docs/cli/requirements/` |
| 34 | TUI | 后续批 | 根层无对应 | **P2** ⇒ 后续批 `docs/cli/requirements/` |
| 35 | TURN-CAP-CONTINUE | 后续批 | 根层部分 | **P1** ⇒ 后续批并入既有 |
| 36 | TWO-REPO-MERGE | **待核** | 两读（同设计侧） | 见 §3 |
| 37 | VERIFY-REDESIGN | 后续批 | 部分面已被 `TOOLS.md` D-V5 接管 | **P1** ⇒ 后续批并入既有 |

## 3. 待核（9 档——判不准者单列，不静默归类）

| # | 档 | 读法甲 | 读法乙 | 依据 |
|---|---|---|---|---|
| 1 | design/ARCHITECTURE.md | **历史**：§3 模块地图 / §4 接口速览已被 `CORE-UNIFICATION.md` §2.5 事实基线与各子系统档取代 | **活**：架构总览 + 硬约束 + 设计原则在根层无载体 ⇒ 照现状改写后落 `docs/core/design/`（P1） | §3 模块地图列 `src/agent.mjs` / `src/tools/` 等（模块已入 `thincoder-core/`） |
| 2 | design/PORTABILITY.md | **活**：可移植性声明面机制现行、根层零覆盖 ⇒ 迁 `docs/core/design/` | **历史**：批设计稿已交付；机制归 CLI `design/ENGINEERING-MODE.md` §2 FR10–FR15（其正文搬迁已是登记待裁项） | 档首自述批属性；变更流水含实施后 as-of 回修 |
| 3 | design/RELEASE.md | **P1**：VSC 树有同名对位档（语义对位） | **P2**：npm 发布面结构性只属 CLI（P5「P2 > P1」） | VSC 树同名档在位；门禁 = CLI 包 `prepublishOnly` |
| 4 | design/STRUCTURE-DEBT.md | **P1**（承 `DOC-SYSTEM.md` §5.2 初分类列统一面） | **P3** 流程面：档自述「横切总账 / 分批入口路由」，含批次编排路线 | 活 / 历史亦混合（部分节已消解） |
| 5 | design/TWO-REPO-MERGE.md | **P3** 流程面（一次性迁移时序日志 ⇒ `docs/batches/`）——该档不描述任何产品机制 | **P2**（承 `DOC-SYSTEM.md` §5.2 既有初分类「CLI 面」） | 闭环证据：`docs/TODO-archive.md` 记 phase 1 全闭核销 |
| 6 | req/FEATURES.md | **P2**：内容为 CLI `src/` 功能全览（含 TUI / slash 命令） | **不迁**：CLI 地图自述「功能全览不属三层、从属于代码」⇒ 迁入即造第二权威源 | `thincoder-cli/docs/README.md` 档位说明 |
| 7 | req/PHILOSOPHY.md | **P1**：承初分类列统一面；提示词正本已归 `docs/core/design/prompts/` | **落位存疑**：非三层档（自述「三观不在三层之内」）⇒ 或落部分根 / 项目根 | 同上 |
| 8 | req/RELEASE.md | **P1**：承初分类列统一面 | **P3**：发布为项目级流程（与台账 / 批次档同类） | 门禁 = CLI 包 `prepublishOnly` |
| 9 | req/TWO-REPO-MERGE.md | **P3**（时序日志） | **不迁**（`docs/README.md` §3 记「已闭环批 · 参照 · 暂留原地」） | 同第 5 行 |

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
| 本批迁 | 6 | 0 | **6** |
| 已清 | 9 | 7 | **16** |
| 尚有未并 | 1 | 3 | **4** |
| 历史（不迁） | 4 | 0 | **4** |
| 待核 | 5 | 4 | **9** |
| 后续批 | 22 | 23 | **45** |
| **总** | **47** | **37** | **84** |

**闭合校验**：设计 6+9+1+4+5+22 = 47 ✓ · 需求 7+3+4+23 = 37 ✓ · 合计 6+16+4+4+9+45 = 84 ✓（= §1 实点；与 `DOC-SYSTEM.md` §5.2 计数口径一致）。

## 6. 后续批分组建议（活档剩余 45 档）

| 批 | 组 | 档 | 备注 |
|---|---|---|---|
| 批 2 | **机制小档（P1 · 各 ≤200 行）** | design：TOOL-OUTPUT-LIMITS · AGENT-PARAMS · VERIFY-REDESIGN · DESIGN-TOKEN-SETTLEMENT · ENG-TOKEN-BINDING · PROXY | PROXY 须**先更正 §TLS 安全语义**（现行实现与旧档相反） |
| 批 3 | **大档拆分（一档一批）** | design：ENGINEERING-MODE（3030）· ADVISOR-CONVERGENCE（1570）· LEDGER-SELF-CONTAINED（1033）· TESTING（995） | 每档须先出 R24a 拆分规划（拆分动作独立于搬迁） |
| 批 4 | **并入既有档的未并面** | design：AGENT-LOOP · PROMPT-SYSTEM · POOL-CONFIG-UNIFIED ⇒ CONFIG；req：MEMORY · AGENT-LOOP · PROMPT-SYSTEM · ADVISOR-CONVERGENCE · ASYNC-RESULT-CONTAINER · ESCALATE · SEND-STALL-DISTILL · SUBAGENT-OBSERVE-SEND · TURN-CAP-CONTINUE · TOOL-OUTPUT-LIMITS | 并入面 = 追加节，不新起档（防同名分裂） |
| 批 5 | **CLI 专有面（P2）** | design：TUI · TUI-INPUT-BOX · TUI-TOOL-OUTPUT · ACP-CLIENT · CRASH-REPORTS；req：TUI · TUI-TOOL-OUTPUT · ACP-CLIENT · CRASH-REPORTS | 须先**新建 `docs/cli/`** 并把该目录加进两扫描器射程（`V5_SCAN_DIRS` · `SCAN_DIRS`）——搬档不改射程 = 无守卫窗口 |
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

**实测行数**：本档 **203 行**（根层新建 · 含 84 行逐档表）——低于 300 行软线，无需拆分规划；若后续批执行记录再入本档，须改行数口径并重评。

## 变更记录

- 2026-09-15（**迁移批 · 二分 + 当场迁第一批 · eng-designer**）：建档——承 `DOC-SYSTEM.md` §11 拆分规划，把该档 §5.2 初分类表精化搬入本档并逐档补证据（`file:line`）；新增 §5 小计闭合 · §6 后续批分组；§3 待核 9 档（两种读法）；第一批已迁 6 档（编辑工具族——见 §2.1 第 5 / 13 / 14 / 18 / 19 / 47 行）。
