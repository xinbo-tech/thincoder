# 文档迁移台账（DOC-MIGRATION）· CLI 树 84 档二分与落点

> 归属 = **文档体系板块**（`docs/core/design/DOC-SYSTEM.md` 的下游执行表）；本档 = **CLI 树 84 档的逐档二分（活 / 历史）+ 落点 + 批次分组**的唯一权威表。
> 判据（**本节不复制**）→ `docs/core/design/DOC-SYSTEM.md` §5.1（P1–P5 归属判据句）· §4（目标目录结构）· §6（命名规则）。
> 迁法（用户 2026-09-14 裁定「**明显应该是 B**」）= **旧档留原地一字不改 + 内容补写 / 重建进根层**。
> 底本口径 = `thincoder-cli/docs/design/*.md`（47）+ `thincoder-cli/docs/requirements/*.md`（37）= **84 档**（不含 `design/prompts/` · `design/_archive/` · `docs/batches/`）。
> 依据口径 = 逐条 `file:line` 实核（as-of **2026-09-15**；§9 复跑收正 = 2026-09-16）；根层基准 = `docs/core/{design,requirements}/`（现 **49 + 38** 档——2026-09-16 复跑；见 §9.3 A21）。
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
| 1 | ACP-CLIENT | **本批迁** | 活——根层无同话题档；实装 `thincoder-cli/src/acp/` 在位；VSC 无实现（结构性不对称）；本批实核：relay 文法模块居 `thincoder-core/agent/relay-prefix.mjs`（核包重构后） | 已落 `docs/cli/design/ACP-CLIENT.md` |
| 2 | ADVISOR-CONVERGENCE | **本批迁** | 活——根层无对应（`docs/core/design/CONSULTATION.md` §8.2 越段登记）；= advisor 评审收敛设计权威；1570 行超硬限 ⇒ 按「收敛本体 ⇄ 边缘守卫」拆两档 | 已落 `docs/core/design/ADVISOR-CONVERGENCE.md` + `docs/core/design/ADVISOR-GUARDS.md` |
| 3 | AGENT-LOOP | **本批迁** | 未并入面（评审对象锚 / R1–R7 铁律 / byte-identical 取消 / 普通模式轻量审计）已并入；飞刀面由 `ESCALATE.md`（第 3 批已落）承载 | 已并入 `docs/core/design/AGENT-LOOP.md`（§6.17）+ 拆分面 `docs/core/design/AGENT-LOOP-SUBAGENT.md` · `docs/core/design/AGENT-LOOP-ASYNC-POOL.md`（§6.18 / §6.19） |
| 4 | AGENT-PARAMS | **本批迁** | 活——根层无对应（`AGENT-LOOP.md` §6.1 仅覆盖 maxTurns 默认；`timeoutMs` 面无主）；三参数默认值经实核（`thincoder-core/advisor/compaction.mjs:36` · `thincoder-core/config.mjs:36` · `thincoder-core/agent/helpers.mjs:25`） | 已落 `docs/core/design/AGENT-PARAMS.md` |
| 5 | APPLY-PATCH | **本批迁** | 根层无正文（`TOOLS.md` §8.2 登记「正文已拆到各工具权威档」= 无档名指针）；VSC 同名对位 | 已落 `docs/core/design/APPLY-PATCH.md` |
| 6 | ARCHITECTURE | **本批迁** | 活——根层原无架构总览载体（硬约束 / 设计原则 / 模块地图）；§3 模块地图为迁移前 `src/**` 树形态 ⇒ 照现状**重写** | 已落 `docs/core/design/ARCHITECTURE.md` |
| 7 | ASYNC-RESULT-CONTAINER | 历史 | 机制结论已全文入 `docs/core/design/AGENT-LOOP.md` §6.7.3（D2–D6 覆盖面）；余为批材料 | 不迁（就地留参照） |
| 8 | CHECKPOINT | 已清 | 对账：CLI §2–§8 ↔ 根层 §6.1–§6.8 + §7（§5.5 与附录由根层 §8.2 登记不并） | 无动作 |
| 9 | CONSULTATION | 已清 | 对账：CLI §2.1–§2.6 ↔ 根层 §6.1–§6.4 + §7 | 无动作 |
| 10 | CONTEXT-COMPACTION | 已清 | 对账：CLI §1–§12 ↔ 根层 §6.1–§6.12（D1–D13 / H1 / E1 全在场） | 无动作 |
| 11 | CRASH-REPORTS | **本批迁** | 活——根层无对应；实装 `thincoder-cli/src/crash-reports.mjs` · `src/heap-watch.mjs` 在位；VSC 无此面；**状态行漂移按现状收正**（三批机制均已实装—测试档在位） | 已落 `docs/cli/design/CRASH-REPORTS.md` |
| 12 | DESIGN-TOKEN-SETTLEMENT | **本批迁** | 活——根层无对应；代码注释直引其 D3（`thincoder-core/token-ttl.mjs:20`）；结算面坐标经实核 | 已落 `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` |
| 13 | EDIT-HELPERS | **本批迁** | 根层无档名（`TOOLS.md` §6.6 末「共享 helper 权威 = 编辑辅助面」）；VSC 同名对位 | 已落 `docs/core/design/EDIT-HELPERS.md` |
| 14 | EDIT | **本批迁** | 同编辑族（`TOOLS.md` §8.2 登记）；VSC 同名对位 | 已落 `docs/core/design/EDIT.md` |
| 15 | ENG-TOKEN-BINDING | **本批迁** | 活——根层无对应；旧档 §4/§5 口径陈旧（单值镜像 vs D3 已退役）——**已随迁按现状收正**（旧句入落点档 §8.1） | 已落 `docs/core/design/ENG-TOKEN-BINDING.md` |
| 16 | ENGINEERING-MODE | **本批迁** | 活——根层无对应（`AGENT-LOOP.md` §8.2 缺档登记）；= 工作流机制判据权威；3030 行超硬限 ⇒ 按机制族拆四档 | 已落 `docs/core/design/{ENGINEERING-MODE,BATCH-RECORD,DOC-DISCIPLINE,LEDGER}.md` |
| 17 | ESCALATE | **本批迁** | 同名根档已由 VSC 批 3 建；CLI 侧独有面（TUI 接线 / relay 前缀 CLI 形 / 撞墙继续 CLI 通道）逐节对账并入 | 已并入 `docs/core/design/ESCALATE.md`（§5 / §6；(d) 类入 §8.1） |
| 18 | HASHLINE-EDIT | **本批迁** | 同编辑族；VSC 同名对位（`thincoder-vscode/src/tools/hashline-edit.mjs:12`）（W14 已迁核——自持镜像已删，现体 = 核 `thincoder-core/tools/file.mjs`） | 已落 `docs/core/design/HASHLINE-EDIT.md` （迁移期引文） |
| 19 | INSERT-AFTER | **本批迁** | 同编辑族；VSC 同名对位（`thincoder-vscode/src/tools/more-file.mjs:12`）（W14 已迁核——自持镜像已删，现体 = 核 `thincoder-core/tools/file.mjs`） | 已落 `docs/core/design/INSERT-AFTER.md` （迁移期引文） |
| 20 | LEDGER-SELF-CONTAINED | **本批迁** | 活——根层无对应（`WORKSPACE.md` §8.2 越段登记）；自持机制的唯一活载体；1033 行超硬限 ⇒ 台账机制面（L1–L3 与可见面）另立 `docs/core/design/LEDGER.md` | 已落 `docs/core/design/LEDGER-SELF-CONTAINED.md` |
| 21 | LOGGING | 已清 | 对账：CLI §2.1–§2.5 ↔ 根层 §6.1–§6.4（未并面已登记） | 无动作 |
| 22 | MCP | 已清 | 对账：CLI §1–§9 ↔ 根层 §6.1–§6.9（文案级残余见 §4 注） | 无动作 |
| 23 | MEMORY | 已清 | 对账：CLI §1–§10 ↔ 根层 §6.1–§6.8（常量与 `uid` 切分逐句同） | 无动作 |
| 24 | MULTI-INSTANCE-COLLAB | **本批迁** | 设计侧根层无档（需求侧同名根档已由 VSC 批 4 建）⇒ 纯新建；坐标逐条实核 | 已落 `docs/core/design/MULTI-INSTANCE-COLLAB.md`（新建） |
| 25 | POOL-CONFIG-UNIFIED | **本批迁** | 配置面机制已实装（`thincoder-core/config.mjs:63` 三键 4/4/4；双读取器 `subagent-async.mjs:94` / `advisor-async.mjs:168`） | 已并入 `docs/core/design/CONFIG.md` §6.1 |
| 26 | PORTABILITY | **本批迁** | 活——可移植性机制现行且根层零覆盖（分类裁判单源 `thincoder-core/conventions.mjs` 等，逐条实核） | 已落 `docs/core/design/PORTABILITY.md`（择机制面重建） |
| 27 | PROMPT-SYSTEM | **本批迁** | 未并入面（双源落地流程 / 装配实现事实 / byte-identical 取消）已并入（设计侧）；分层 / 命名法 / 装配矩阵 = 需求侧 §4（req 档同步并入） | 已并入 `docs/core/design/PROMPT-SYSTEM.md` §6–§8 |
| 28 | PROVIDER | 已清 | 对账：CLI §1–§16 / §21 / §23 ↔ 根层 §6.1–§6.17 | 无动作 |
| 29 | PROXY | **本批迁** | 活——根层无正文（`CONFIG.md` §8.2 越段登记）；**§TLS 段与实装相反**（实装默认全量校验 + `insecureTls` 显式放行，`thincoder-core/proxy.mjs:214`）⇒ **按实装收正**；另 §web 消费面同陈旧（实装 = 逐次调用参数） | 已落 `docs/core/design/PROXY.md`（§3 / §4 按实装收正） |
| 30 | QUICKFIX-BATCH-3 | 历史 | 批档形态（需求→设计→用例→验收）；批已闭环；F-1 / F-2 由他批落地 | 不迁（就地留）；**F-3 / F-4 未落且无承载 ⇒ 须回写台账**（父侧） |
| 31 | RELEASE | **本批迁** | 活 · **CLI 面（P2）**——npm 发布面结构性只属 CLI（P5「P2 > P1」压过 VSC 同名对位档）；与需求档层归属不对称（见落点档档头注） | 已落 `docs/cli/design/RELEASE.md` |
| 32 | SEND-STALL-DISTILL | **本批迁** | 同名根档已由 VSC 批 3 建；CLI 独有面（TUI 保存回调接线 / 退出 flush 有界等待）并入 | 已并入 `docs/core/design/SEND-STALL-DISTILL.md`（§2.3 / §2.6 / §3） |
| 33 | SESSION | 已清 | 对账：CLI §1–§14 ↔ 根层 §6.1–§6.14 | 无动作 |
| 34 | SETTINGS-TOOL | **本批迁** | 设计侧根层无档（需求侧同名根档已由 VSC 批 4 建）⇒ 纯新建；null 形状表 / parseValue 去引号裁定按现行实装落笔 | 已落 `docs/core/design/SETTINGS-TOOL.md`（新建） |
| 35 | STRUCTURE-DEBT | **本批迁** | 活 · **统一面**（横切总账 / 分批入口路由）——旧债逐条实核后按现状重建：现行债入「现行债」节、已消解项入「已消解」节（防回潮） | 已落 `docs/core/design/STRUCTURE-DEBT.md` |
| 36 | SUBAGENT-ID-COUNTER-AGENT | 历史 | 已交付闭环（台账已核销）；机制已入核代码（`thincoder-core/agent-tools/subagent-scheduler.mjs`） | 不迁；取号公式句 ⇒ 后续批并入 `docs/core/design/AGENT-LOOP.md` 子代理池节 |
| 37 | SUBAGENT-OBSERVE-SEND | 历史 | 契约正文已入 `docs/core/design/AGENT-LOOP.md` §6.7.2 | 不迁（就地留参照） |
| 38 | TESTING | **本批迁** | 活——根层无对应（`CORE-UNIFICATION.md` 仅作跨树承载指针）；995 行超硬限 ⇒ 端到端 harness 另立一档 | 已落 `docs/core/design/TESTING.md`（+ `docs/core/design/E2E-HARNESS.md`——**该档 2026-09-15 已删除**） （迁移期引文） |
| 39 | TOOL-OUTPUT-LIMITS | **本批迁** | 活——根层无对应（`AGENT-LOOP.md` §6.16 显式外指「工具输出上限系（CLI 仓·设计）」）；常量与坐标经实核 | 已落 `docs/core/design/TOOL-OUTPUT-LIMITS.md` |
| 40 | TOOLS | 已清 | 对账：根层 §6.1–§6.10 ↔ CLI §1–§11（根层反多 `timer` 校验句） | 无动作 |
| 41 | TUI-INPUT-BOX | **本批迁** | 活——根层无对应；CLI 专有面（输入框键契约）；**二态混装已收口**（第 31 批设计已实装——`state.interruptPrompt = { chars, cursor }`） | 已落 `docs/cli/design/TUI-INPUT-BOX.md` |
| 42 | TUI-TOOL-OUTPUT | **本批迁** | 活——根层无对应；CLI 专有面（行间区块）；VSC 工具卡非同机制 | 已落 `docs/cli/design/TUI-TOOL-OUTPUT.md` |
| 43 | TUI | **本批迁** | 活——根层无对应（1529 行超硬门）；VSC 对位面 = webview 族（非同机制）；**本批按读者面拆三档** | 已落 `docs/cli/design/{TUI,TUI-COMMANDS,TUI-SESSION-VIEW}.md` |
| 44 | TURN-CAP-CONTINUE | **本批迁** | 同名根档已由 VSC 批 3 建；CLI 独有面（`runWithContinue` 骨架 / TUI 继续通道 / 消费链坐标 / D-19 族决策）并入 | 已并入 `docs/core/design/TURN-CAP-CONTINUE.md`（§1–§5） |
| 45 | TWO-REPO-MERGE | **本批迁** | 活 · **统一面**（架构级机制档）——退役清单 / 仓根状态 / 完成判据 / phase 2 通道**描述现行仓形态** | 已落 `docs/core/design/TWO-REPO-MERGE.md`（一次批次材料入不并节） |
| 46 | VERIFY-REDESIGN | **本批迁** | 活——根层无正文（`TOOLS.md` §6.7 verify 行 + D-V5 快路径仅契约要点）；契约 / guard / 双端坐标经实核 | 已落 `docs/core/design/VERIFY-REDESIGN.md` |
| 47 | WRITE | **本批迁** | 同编辑族（`TOOLS.md` §8.2 登记）；VSC 同名对位（`thincoder-vscode/src/tools/file.mjs:74`） | 已落 `docs/core/design/WRITE.md` |

### 2.2 需求档（`thincoder-cli/docs/requirements/` · 37）

| # | 档 | 判 | 依据（file:line 实核） | 动作 / 落点 |
|---|---|---|---|---|
| 1 | ACP-CLIENT | **本批迁** | 活——根层无对应；单端面（VSC 仓无 ACP 实现） | 已落 `docs/cli/requirements/ACP-CLIENT.md` |
| 2 | ADVISOR-CONVERGENCE | **本批迁** | 条目未并入（F1–F17 / F27–F29 + N1–N11 / N19–N21）；VSC 端对位面（旧 §8 / §9 / §13）按 P2 不并 | 已落 `docs/core/requirements/ADVISOR-CONVERGENCE.md`（**新建**——与设计侧同名成对） |
| 3 | AGENT-LOOP | **本批迁** | CLI 侧全并：B 轮条目面 + 本批两并入面（`SUBAGENT-OBSERVE-SEND` → §4.7 · `ASYNC-RESULT-CONTAINER` → §4.8）；4 个 VSC 面节维持 P2（归 VSC 轮） | 已并入 `docs/core/requirements/AGENT-LOOP.md` §4.7 / §4.8 |
| 4 | AGENT-PARAMS | **本批迁** | 同名根档已由 VSC 批 4 建；逐节对账**零实质缺口**（FR1–FR3 / N1–N4 ⇒ F-AP1–F-AP4 / N-AP1–N-AP4 全覆） | 已并入 `docs/core/requirements/AGENT-PARAMS.md`（零新增正文；(d) 类入 §5.1） |
| 5 | ASYNC-RESULT-CONTAINER | **本批迁** | 机制本体已入设计侧（现 `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.7.3）；条目并入需求侧 | 已并入 `docs/core/requirements/AGENT-LOOP.md` §4.8 |
| 6 | CHECKPOINT | 已清 | 对账：CLI §1–§4 ↔ 根层 §4.1–§4.3 | 无动作 |
| 7 | CONSULTATION | 已清 | 对账：CLI ↔ 根层 §4.1–§4.3 | 无动作 |
| 8 | CONTEXT-COMPACTION | 已清 | 对账：CLI ↔ 根层 §4.1–§4.2（含 2026-09-11 修订括注） | 无动作 |
| 9 | CRASH-REPORTS | **本批迁** | 活——根层无对应；自述 VSC 端无此面 | 已落 `docs/cli/requirements/CRASH-REPORTS.md` |
| 10 | DESIGN-TOKEN-SETTLEMENT | **本批迁** | 同名根档已由 VSC 批 5 建；逐节对账**零实质缺口**（R1–R4 ⇒ F-D1 / F-D4+F-D5 / N-D3 / N-D1） | 已并入 `docs/core/requirements/DESIGN-TOKEN-SETTLEMENT.md`（§4 对位句更新；(d) 类入 §6.1） |
| 11 | ENG-TOKEN-BINDING | **本批迁** | 同名根档已由 VSC 批 5 建；编号承旧档零改号；旧档 FR6 口径陈旧（与现行 echo 机制不符）按现状收正并登记 | 已并入 `docs/core/requirements/ENG-TOKEN-BINDING.md`（(d) 类入 §5.1） |
| 12 | ENGINEERING-MODE | **本批迁** | 活——根层无对应（1003 行超硬限 ⇒ 按「工作流本体 ⇄ 机制面」拆两档） | 已落 `docs/core/requirements/_archive/ENGINEERING-MODE.md` + `docs/core/requirements/_archive/ENGINEERING-MODE-MECHANISM.md` |
| 13 | ESCALATE | **本批迁** | 逐节比对**零实质缺口**（全部要素已由 §1 / F-E1–F-E5 / §4 承载） | 已对账并入 `docs/core/requirements/ESCALATE.md`（零新增文本） |
| 14 | FEATURES | **本批迁** | 活 · **CLI 面（P2）**——内容为 CLI 能力全览（含 TUI / slash 命令面） | 已落 `docs/cli/requirements/FEATURES.md`（清点面按现行登记面收正） |
| 15 | LOGGING | 已清 | 对账：CLI ↔ 根层 §4.1–§4.3（1 处文本级降级 —— 见 §4 注） | 无动作 |
| 16 | MCP | 已清 | 对账：CLI §1–§4 ↔ 根层 §4.1–§4.4 | 无动作 |
| 17 | MEMORY | **本批迁** | 整档条目面已并入（F1–F14 / F-M1–F-M3 + N1–N9 / N-M1–N-M3） | 已并入 `docs/core/requirements/MEMORY.md` §4 |
| 18 | MULTI-INSTANCE-COLLAB | **本批迁** | 同名根档已由 VSC 批 4 建；F1–F5 / N1–N4 零缺口；旧档 §2 外部写感知（F6 / N5 / N6）= VSC 设置面板面（P2）不并 | 已并入 `docs/core/requirements/MULTI-INSTANCE-COLLAB.md`（P2 面登记 §5.2） |
| 19 | NORMAL-MODE | **本批迁** | 同名根档已由 VSC 批 4 建；CLI 档与装配面**不同题**（普通模式产品行为需求）⇒ 全量并入为 §5–§6 | 已并入 `docs/core/requirements/NORMAL-MODE.md`（F1–F10 / N1–N10 / F-N1.1–F-N1.6） |
| 20 | PHILOSOPHY | **本批迁** | 活 · **统一面**（三观 = 最高层需求；提示词正本已归 `docs/core/design/prompts/`） | 已落 `docs/core/requirements/PHILOSOPHY.md` |
| 21 | PORTABILITY | **本批迁** | 同名根档已由 VSC 批 5 建；FR10–FR15 正文现居 `docs/core/requirements/ENGINEERING-MODE.md` §2（指针不重述——D2）；接受方向表 + FR14 落实文本并入 | 已并入 `docs/core/requirements/PORTABILITY.md`（§5；(d) 类入 §6.1） （迁移期引文） |
| 22 | PROJECT | **本批迁** | 同名根档已由 VSC 批 5 建（其档头自注「迁入时对账合并」）；产品级定性面全量并入为 §5 | 已并入 `docs/core/requirements/PROJECT.md`（§5 对账合并——用户裁定②） |
| 23 | PROMPT-SYSTEM | **本批迁** | 蓝图条目已并入（分层模型 / 命名法 / 内容大纲 / 编写纪律 15 条 / 装配逻辑 / 归属判定）；§8–§10 批面登记不并 | 已并入 `docs/core/requirements/PROMPT-SYSTEM.md` §4 |
| 24 | RELEASE | **本批迁** | 活 · **统一面**（发布流程 = 跨产品板块主题）；**与设计档层归属不对称**（设计 = CLI 面）——两侧档头互注配对档位置 | 已落 `docs/core/requirements/RELEASE.md` |
| 25 | SEND-STALL-DISTILL | **本批迁** | 对账并入：N3 CLI 中止形态（退出 flush / Stop 不中止蒸馏） | 已并入 `docs/core/requirements/SEND-STALL-DISTILL.md`（余面现有正文已载） |
| 26 | SESSION | 已清 | 对账：CLI ↔ 根层 §4.1–§4.4 | 无动作 |
| 27 | SETTINGS-TOOL | **本批迁** | 同名根档已由 VSC 批 4 建；缺口（F-ST7 值解析裁定 / 热应用细节 / 无静默判据 / 持久性边界 / CLI 边界族）并入；§4 错误边界行按双端实装收正 | 已并入 `docs/core/requirements/SETTINGS-TOOL.md`（§2–§4；(d) 类入 §5.1） |
| 28 | STRUCTURE-DEBT | **本批迁** | 同名根档已由 VSC 批 4 建；逐节对账**零实质缺口**（F1–F4 / N1–N5 ⇒ F-SD1–F-SD4 / N-SD1–N-SD5）；旧 N5 双树口径确认为合并前措辞（随迁收正项销项） | 已并入 `docs/core/requirements/STRUCTURE-DEBT.md`（旧句登记 §5.1） |
| 29 | SUBAGENT-OBSERVE-SEND | **本批迁** | 条目并入（F1 / F2 + N1–N4）；契约正文已入设计侧（现 `AGENT-LOOP-SUBAGENT.md` §6.7.2） | 已并入 `docs/core/requirements/AGENT-LOOP.md` §4.7 |
| 30 | TESTING | **本批迁** | 活——根层无对应 | 已落 `docs/core/requirements/TESTING.md` |
| 31 | TOOL-OUTPUT-LIMITS | **本批迁** | 条目并入（FR1–FR6 / N1–N5）；设计侧第 3 批已落 | 已并入 `docs/core/requirements/TOOLS.md` §4.5 |
| 32 | TOOLS | 已清 | 对账：CLI §1–§4 ↔ 根层 §4.1–§4.4 | 无动作 |
| 33 | TUI-TOOL-OUTPUT | **本批迁** | 活——根层无对应；CLI 专有面 | 已落 `docs/cli/requirements/TUI-TOOL-OUTPUT.md` |
| 34 | TUI | **本批迁** | 活——根层无对应；CLI 专有面；**设计侧拆五档而需求侧一档**（层归属不对称——双侧已互注） | 已落 `docs/cli/requirements/TUI.md` |
| 35 | TURN-CAP-CONTINUE | **本批迁** | 对账并入：F7 跨段累计编号 + N6 零机制改动（并整 F3 重复行） | 已并入 `docs/core/requirements/TURN-CAP-CONTINUE.md` §2 / §3 |
| 36 | TWO-REPO-MERGE | **本批迁** | 活 · **统一面**（同设计侧） | 已落 `docs/core/requirements/TWO-REPO-MERGE.md` |
| 37 | VERIFY-REDESIGN | **本批迁** | 同名根档已由 VSC 批 5 建；**落点两读已经用户裁定 = 并入同名根档**；逐节对账**零实质缺口** | 已并入 `docs/core/requirements/VERIFY-REDESIGN.md`（零新增正文；(d) 类入 §5.1） |

## 3. 待核（**已清空** —— 2026-09-15 裁定后全部定判）

**去向**：原 9 档（两种读法单列）已由**用户 2026-09-15 裁定**逐档定判，并**同批实迁**——判与落点见 §2.1 / §2.2 对应行的「判」与「动作 / 落点」列（本表不再另立——D2 单一权威源）。
裁定前的两读法（历史 / 活 · P1 / P2 / P3）与逐档依据 = 一次性裁定材料，留痕入 `docs/batches/` 迁移批次档 §2（本批）；各档「依据」列已按裁定后的**现状实核**改写。
**层归属不对称登记**：`RELEASE` 两档跨部分成对（设计 = `docs/cli/design/` · 需求 = `docs/core/requirements/`）——各自档头互注配对档位置（防读者以为漏档）。

**迁移注意项（判栏无分歧 ⇒ 不入上表）**：`design/TUI-INPUT-BOX.md` 二态混装（当前态 + §8 / §9 目标态）——落点 P2 无分歧；**已收口（2026-09-15 第 6 批）**：第 31 批设计已实装 ⇒ 落点档按**单态现行契约**重建（收口记录 = `docs/batches/2026-09-14-doc-migration.md` §2 第 6 批）。

## 4. 对账：已并入的 11 板块

| # | 板块 | 设计侧 | 需求侧 |
|---|---|---|---|
| 1 | AGENT-LOOP | **本批迁**（对象锚 → 子档 §6.18 / 铁律 → §6.19 / 轻量审计 → §6.17 / byte-identical → 提示词板 §6.4；飞刀 → `ESCALATE.md`） | **本批迁**（CLI 侧全并；4 个 VSC 面节维持 P2） |
| 2 | MEMORY | 已清 | **本批迁**（整档条目面并入 §4） |
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
| 本批迁（已入根层） | 34 | 30 | **64** |
| 已清 | 9 | 7 | **16** |
| 尚有未并 | 0 | 0 | **0** |
| 历史（不迁） | 4 | 0 | **4** |
| 待核 | 0 | 0 | **0** |
| 后续批 | 0 | 0 | **0** |
| **总** | **47** | **37** | **84** |

**闭合校验**：设计 34+9+0+4+0+0 = 47 ✓ · 需求 30+7+0+0+0+0 = 37 ✓ · 合计 64+16+0+4+0+0 = 84 ✓（= §1 实点；与 `DOC-SYSTEM.md` §5.2 计数口径一致）。
**「本批迁」口径**：= 截至 2026-09-15 **已迁入根层的活档合计**（第 1 批 6 + 第 2 批 9 + 第 3 批 6 + 第 4 批 6 + 第 5 批 13 + 第 6 批 9 + **尾部真批 15 = 64**）——本栏随迁移推进**单调递增、不重置**。
**小计收正（D3——以逐行实核为准）**：上一版印刷值「尚有未并 4 / 后续批 33」与逐行实计不符（实计 = **5 / 32**）——本版按逐行重算收正，并完成本批变化（尚有未并 5 → **0**；后续批 32 → **24**）。

## 6. 后续批分组建议（活档剩余 **0** 档——全部落地）

| 批 | 组 | 档 | 备注 |
|---|---|---|---|
| 批 2 | **机制小档（P1 · 各 ≤200 行）** | design：TOOL-OUTPUT-LIMITS · AGENT-PARAMS · VERIFY-REDESIGN · DESIGN-TOKEN-SETTLEMENT · ENG-TOKEN-BINDING · PROXY | **已落（2026-09-15 第 3 批）**——六档全迁 `docs/core/design/`；PROXY §TLS 安全语义已按实装收正（`thincoder-core/proxy.mjs:214`） |
| 批 3 | **大档拆分（一档一批）** | design：ENGINEERING-MODE（3030）· ADVISOR-CONVERGENCE（1570）· LEDGER-SELF-CONTAINED（1033）· TESTING（995）· req：ENGINEERING-MODE（1003）· TESTING（177） | **已落（2026-09-15 第 4 批）**——四档设计侧拆为 9 档、需求侧拆为 3 档（均落 `docs/core/{design,requirements}/`）；逐档 ≤500 |
| 批 4 | **并入既有档的未并面** | design：AGENT-LOOP · PROMPT-SYSTEM · POOL-CONFIG-UNIFIED ⇒ CONFIG；req：MEMORY · AGENT-LOOP · PROMPT-SYSTEM · ADVISOR-CONVERGENCE · ASYNC-RESULT-CONTAINER · ESCALATE · SEND-STALL-DISTILL · SUBAGENT-OBSERVE-SEND · TURN-CAP-CONTINUE · TOOL-OUTPUT-LIMITS | **已落（2026-09-15 第 5 批）**——十三源档全并（含 AGENT-LOOP 拆分面 + ADVISOR-CONVERGENCE 需求档新建）；并入面 = 追加节，不新起档（防同名分裂） |
| 批 5 | **CLI 专有面（P2）** | design：TUI · TUI-INPUT-BOX · TUI-TOOL-OUTPUT · ACP-CLIENT · CRASH-REPORTS；req：TUI · TUI-TOOL-OUTPUT · ACP-CLIENT · CRASH-REPORTS | **已落（2026-09-15 第 6 批）**——九源档全迁 `docs/cli/{design,requirements}/`（设计侧 7 档产物：TUI 按读者面拆三档）；`docs/cli/` 目录与两扫描器射程前置已于第 2 批满足 |
| 批 6a | **其余 P1 活档（设计侧）** | ESCALATE · MULTI-INSTANCE-COLLAB · SETTINGS-TOOL · SEND-STALL-DISTILL · TURN-CAP-CONTINUE | **已落（2026-09-15 尾部真批）**：ESCALATE / SEND-STALL-DISTILL / TURN-CAP-CONTINUE 并入 VSC 批 3 同名根档；MULTI-INSTANCE-COLLAB / SETTINGS-TOOL 设计侧纯新建。 |
| 批 6b | **其余 P1 活档（需求侧）** | AGENT-PARAMS · DESIGN-TOKEN-SETTLEMENT · ENG-TOKEN-BINDING · MULTI-INSTANCE-COLLAB · NORMAL-MODE · PORTABILITY · PROJECT · SETTINGS-TOOL · STRUCTURE-DEBT · VERIFY-REDESIGN（10 档——TESTING 已于第 4 批迁出，原列举属印刷残留） | **已落（2026-09-15 尾部真批）**：十档全并入 VSC 批 4 / 批 5 同名根档；VERIFY-REDESIGN 落点两读经**用户裁定 = 并入同名根档**。 |
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

## 9. 迁移收尾（批 11 · 收口口径与未落尾巴落点——两迁移批共用）

**问题陈述**：两迁移批（`2026-09-14-doc-migration.md` · `2026-09-15-vsc-doc-migration.md`）正文主体已吸收，但 §3–§6 段仍为「待写」占位（未达 L4，`BATCH-RECORD.md:157`）；2026-09-16 三态盘查出 12 条未落尾巴（CLI 7 + VSC 5）与「phase 2：核心统一」判据缺口 G1–G10。本设计 = ① 两档收口段口径 ② 尾巴十二条落点 ③ phase-2 终态判据。

### 9.1 收口段口径（两档共用）

- **口径** = 「已吸收 + 尾巴移交 `docs/batches/2026-09-16-migration-wrapup.md`」；正文不回改；尾巴零丢项（逐条 = 已消 / 指向批 11 / 指向后继）。
- §3：免设独立轮——一行「原轮无独立设计评审；评审面并入批 11 §3」（执笔 = 批 11 评审实例；缺则父侧代写并打标）。
- §4 / §5：各一行——§4「收口裁定 = 批 11 设计 §9 + 用户批准见批 11 §4」（主 agent）；§5「实施主体已载于本档 §2 各轮；收口轮无新增实施」（父侧）。
- §6：**收口判词**（口径句 + 三机检读数行 + 尾巴指针表）+ 状态行「已收口 2026-09-16」+ 冻结（L4）（父侧）。
- **判不出 4 条处置（CLI 3 + VSC 1）**：身份源 = explore#13 盘查表（未落档——§9.8⑤ 同款）；落档后逐条对齐「并入本批尾巴（组数 +N，D3 同步）」或「显式裁出（附理由）」，不猜补；收口判词按「已吸收 + 尾巴移交（12 组）」先行。
- **称谓注**：本档「父侧」= 批 11 批次档「主 agent」——同一执行主体，两称互注、不逐处改写。
- 判据：两档 §6 非空 + 状态行含「已收口」；VSC 档 `:763`–`:777` 四段占位、CLI 档 `:945` 起 §6 在位（§3–§5 以实读补齐或新起）。

### 9.2 方案选型对比

| # | 决策点 | 候选 | 取舍 | 结论 |
|---|---|---|---|---|
| 1 | 设计宿主 | ① 本档 §9 ② `BATCH-RECORD.md` §5.1 扩展 ③ 新档 | ① 已有则更新；本档 §6 = 迁移后续批天然前身 ② L1–L6 机制已定型，本批只是实例应用 ③ 违一板块一档 | ① 选定 |
| 2 | 收口段落点 | ① 两档就地带 §6 ② 合并新档 ③ 回改正文 | ① 合 L4 冻结姿态 ② 复制违 D2 ③ 回改禁（L4） | ① 选定 |
| 3 | A20 落点 | ① 基准层补写 ② 只登记 ③ 回改只读面 | ③ 违只读红线（`thincoder-cli/docs/**`）② 现行值无家 | ① 选定（`DOC-DISCIPLINE.md` §4.2.7 追加条） |
| 4 | phase-2 终态 | ① 核销 ② 在途 + 唯一差项 | ① S3 退出五项未齐（「三机检 exit 0」不成立）② 可机判 | ② 选定 |
| 5 | B24 承接面 | ① 本批 ② 批 6 ③ 批 7 ④ 新批 | ① 口径级承接（族内列报·不入闸；树只读）②③ 其范围已定型、不新收承接 ④ 无独立交付目标（L1 不成立） | ① 选定 + 触发 = 条件（树退役 ⇒ 撤族） |

### 9.3 尾巴十二条落点表（CLI 7 + VSC 5 · **权威表**——批 11 §2 两表 = 摘要视图，不一致以本表为准）

| # | 条 | 处置 | 落点 | 触发 / 到期 |
|---|---|---|---|---|
| A10 | 设计面欠账收正轮（无开工记录） | 复核成立 + 登记；本批不自行开轮 | 两档 §6 一行 + `docs/TODO.md`（父侧 = 主 agent） | 归批（下一设计面批）；轮开工后销 |
| A20 | AC/T-V5-16「三元素」⇏ 九元素 | 基准层补写；只读面不回改 | `DOC-DISCIPLINE.md` §4.2.7 追加条 + 两档 §6 一行 | 本批闭环；射程脆性 = 测试断言仍为逐字快照（A23 面） （机检豁免——用例退场登记） |
| A21 | 地图未登 `core/design` 差集（复跑 = **27**） | 补登 + 计数收正（D3） | `docs/README.md` §4（补登块 `:65` 起 + 计数核对 `:70`） | 本批闭环；复跑 = **双向等式**（实档数 = 地图数——命令 / 读数见下注）；两数落两档 §6 + README 留证 |
| A22 | VSC 全量 1 例红（`thincoder-vscode/test/doc-anchors.test.mjs:173` · T-DC6②） | 复跑 = 锚工具 VSC 两腿 0 悬空；归属裁 = 测试面（非文档面） | 两档 §6 读数行 + `docs/TODO.md`（登记）+ 本 §9 | 归批（测试面）；转绿后销 （机检豁免——用例退场登记） |
| A23 | `:190` 域关系守卫仍住 `slow()` | 登记（测试面；补入单入口属 5 行断言外——原待父侧点头） | 两档 §6 一行 + `TODO.md` | 归批（测试面）；守卫随单入口可跑（`slow` 纯别名）后销 |
| A24 | VSC 档旧读数与折行注并置 | 变注（零改写只增行）+ 结案行 | VSC 档 `:115` 后一行（执笔 = 主 agent 裁）+ 该档 §6 | 本批闭环 |
| A27 | 「一致面 ⇄ 语义面」裁决缺失（`:255` 三条 + 同型 4 处） | 请主 agent 裁决（收正成立 / 打回 revert） | 批 11 §6 + 两档 §6 一行 | 主 agent 裁决；销 or revert 后结 |
| B17–B20 | 收口段面四项 | 按 §9.1 统一处置（零丢项） | VSC 档 §6 | 本批闭环；B17/B18/B20 身份对齐见 §9.8⑤ |
| B21 | 源档与现状冲突（语义面） | 请父侧确认活档口径 = 以现状为准（只读不回改） | VSC 档 §6 一行 | 确认后闭环 |
| B24 | 「产品树降格批」不存在 · 68 处承接 | 裁 = 本批口径承接（族内列报·不入闸） | VSC 档 §6 一行 + 本 §9 | 条件（树退役 ⇒ 撤族/再处） |
| B19 | 批次档 §2 超宽 3 行 | 已消（`:32/:34/:36` 折行已落 · 逐字节同；`:122` 注在位） | VSC 档 §6 一行「已消」 | 闭环（本批确认） |
| G9 | 引擎声明面 schema 跨档不可验 | 明标出射程（登记，不做伪校验） | 本 §9 + 判据面登记 | 条件（若立声明面校验器再覆盖） |

### 9.4 phase-2 改判（G1–G10 处置）

判据源 = `CORE-UNIFICATION.md:411-412`（S3 进入 / 退出五项）+ `BATCH-RECORD.md:157`（L4）。**已知**：S3 进入条件已达（CLI 待迁 0 · VSC 已收口形态）；S3 无载体档。

- **终态 = 维持在途**。唯一剩余差项 = **「S3 退出之一『三机检 exit 0』未达」**（可机判 · 逐腿读数 + 归属 · as-of 2026-09-16 实施轮复跑）：
  - 锚腿 = `scripts/doc-check-anchors.mjs` exit 1——根层域 **3 条**悬空（全在 `DOC-DISCIPLINE.md` 面——V6 判据测试档拟新增·实施轮创建，未创建故悬空；复跑 5 条 → 终核 3 条：`VSC-DEBT.md` 面 2 已消——随在飞面浮动）⇒ 归属 = **族实装面**（V6 实施轮创建后归零）+ 在飞面；
  - 宽度腿 = `scripts/doc-check-width.mjs` exit 1——**5 文件 12 行**（他作者 / 在飞面为主；评审轮读数 = 7 行 → 修正轮 8 行 → 实施轮 12 行）⇒ 归属 = **在飞 / 他作者面**（逐档机械折行）；
  - 台账腿 = `check-ledger.mjs` exit 1——**1 条**（`TODO-archive.md:287` L4 证据路径不可解析——台账面 / 批 6 核销面；基线 0 条）；
  - 一致性 V1–V3 = **4 条**（他作者 / 在飞面——`2026-09-16-doc-length-rule-repeal.md`「本档 §7」×3 + `2026-09-16-residual-debt.md` ×1；本批新增 = **0**）；锚腿另列报告态读数「命中 5 处 · distinct 3（A1 0 / A2 4 / A3 1）」——锚工具自标「报告态」（读数随在飞面浮动），不入闸；三腿 = 三机检全集，无未列项。
- G1：显式裁为**并入本批**（载体 = 批 11 条目 4）；S3 后续开工另起新批（L1）。G3/G4：G3 归上差项；G4 = 族实装面验收口径——**复跑现状 3 条**（随在飞面浮动）；落点 `DOC-DISCIPLINE.md` §4.2.9（实装轮）。
- G5：落点 = `CORE-UNIFICATION.md` 对外契约节（S3 开工核验面），本批登记落点即毕。G6/G7：逐条身份以盘查表为准（未落档——§9.8⑤），落点 = `TODO.md` + 对应判据档。G8：登记根因句 =「文档面条目缺默认承接面；本批即补位实例」。
- G2/G10：**编号同名、语义待并**（`VERIFY-REDESIGN.md:100/:116` 的「G10 双端同」与盘查 G10 是否同源未证）——登记待并，不得误并。

### 9.5 验收标准（回指批 11 §1 条目 1–4 · 全部可机判）

| AC | 回指 | 判据 | 复跑 |
|---|---|---|---|
| AC-1 | 条目 1 | 两档 §6 非空 + 状态行「已收口 2026-09-16」+ 尾巴指针计 = 12（= 条目分组数；谓词与逐档期望数见下注） | 逐档按指针行 pattern（含「→ 批 11 §9.3」）计数：CLI 7 / VSC 5 |
| AC-2 | 条目 2 / 3 | 尾巴表 12 行（= 条目分组数，见 AC-1） = §1 枚举（7 + 5）；每行含落点与触发 / 到期 | 表行计数 |
| AC-3 | 条目 4 | 终态行在位 + 单一差项句可机判：三腿读数齐（锚 exit 1 · 3 条 / 宽度 exit 1 · 12 行 / 台账 exit 1 · 1 条）+ 逐项归属（锚 = 族实装面；宽度 = 在飞 / 他作者面；台账 = 台账面 / 批 6 核销面）+ 与 §9.4 逐字对齐 | 三命令复跑对读（锚默认双腿：根层域 exit 1 · 参照面腿 0）；终态行落点 = §9.4 + `docs/TODO.md`（行样见下注） |
| AC-4 | 验收④ | 本批新增 = 0（宽度 / V1–V3 / 锚——基线 / 限域 / 处置见下注） | 三机检命令（见批 11 §2；宽度 = `scripts/doc-check-width.mjs`） |
| AC-5 | 验收⑤ | 「193/37」= 批 6（RESIDUAL-DEBT）实读两参照树悬空读数（CLI 37 / VSC 193——`docs/batches/2026-09-16-residual-debt.md:13` / `:63` / `:145`——全量证据行）；实核 = **有据**（裁定 3 两树 + 裁定 6 两腿口径已在轮）；现态 = 两树腿 **0/0**（强扫腿复跑：族豁免 CLI 36 / VSC 188 条列报）；批 6 联动收正 = 无需 | 强扫腿复跑（`--engine v5`）+ 两档 §6 读数行（回指本行全量证据行） |

**AC 补充注（修正轮 R1 · as-of 2026-09-16 复跑）**：
- **AC-1 谓词**：指针行样式 = 含「→ 批 11 §9.3」；逐档期望计数 = CLI 7 / VSC 5，合计 12 = **条目分组数**（唯一 ID = 14——B19 双面）；计数命令 = 逐档按该 pattern 计数；阈值随 §9.8⑤ 身份对齐按 D3 同步。
- **AC-3 终态行样**：`phase 2：核心统一 = 在途（差项 = 「S3 退出之一『三机检 exit 0』未达」——见 DOC-MIGRATION.md §9.4；as-of 2026-09-16）`——落 `docs/TODO.md`（主 agent）。
- **AC-4 基线**（as-of 2026-09-16 实施轮复跑——后续复跑与此对读）：宽度 = 5 文件 12 行（评审轮 7 行 → 修正轮 8 行 → 实施轮 12 行）· V1–V3 = 4 条（他作者 / 在飞面——`2026-09-16-doc-length-rule-repeal.md`「本档 §7」×3 + `2026-09-16-residual-debt.md` ×1；本批新增 = 0）· 锚根层域 = 3 条（复跑 5 条 → 终核 3 条：`VSC-DEBT.md` 面 2 已消）。
- **AC-4 限域**：宽度 = `scripts/doc-check-width.mjs` 之 `SCAN_DIRS`（`docs/{design,requirements,batches,core/design,core/requirements}`；表格行豁免）；V1–V3 = 同域全档；锚 = 根层八目录 + 参照面腿；根文件（`docs/TODO*.md`）超宽行不在闸域。
- **AC-4 处置**：他作者 / 在飞面 = 逐档归其作者 / 父侧机械折行；本档段面 2 行（批档 §1 / §3）= 归段作者；§2 / §9 面新增 = 0。
- **A21 复跑 · 正向腿（实档 → 地图）**：`node -e "const fs=require('fs');const m=fs.readdirSync('docs/core/design').filter(f=>f.endsWith('.md'));const r=fs.readFileSync('docs/README.md','utf8');console.log(m.length, m.filter(f=>!r.includes(f)).length)"`
  ——as-of 2026-09-16 读 = `49 27`；补登后实测 = **`49 0`**（2026-09-16 实施轮复跑——A21 验收读数；两数留证 = `docs/README.md` §4）。
- **A21 复跑 · 反向腿（路径形态引用）**：`node -e "const fs=require('fs');const r=fs.readFileSync('docs/README.md','utf8');const n=[...new Set([...r.matchAll(/core\/design\/([A-Za-z0-9._-]+\.md)/g)].map(x=>x[1]))];console.log(n.filter(f=>!fs.existsSync('docs/core/design/'+f)).length)"`
  ——as-of 2026-09-16 读 = `0`；补登后复跑 = `0`（实施轮）。

**现态非本批因（明列 · as-of 2026-09-16 实施轮复跑）**：
- 宽度 exit 1 = **5 文件 12 行**——他作者 / 在飞面为主（评审轮 7 行 → 修正轮 8 行 → 实施轮 12 行）；本档段面 **2 行**（批档 §1 / §3 各 1 行）= 归段作者机械折行。
- 锚根层域 exit 1 = **3 条**（全在 `DOC-DISCIPLINE.md` 面 3——`:34` / `:51` / `:737` 三行：V6 判据测试档拟新增·未创建；`VSC-DEBT.md` 面 2 已消——复跑不再列报）——族实装面 + 在飞面；参照面腿 = 0（族豁免列报不入闸）。
- 台账 exit 1 = **1 条**（`TODO-archive.md:287` L4 证据路径不可解析——台账面 / 批 6 核销面）· 一致性 V1–V3 = **4 条**（两批档「本档 §7」4 处——他作者 / 在飞面）。
- 发布门全绿 = 差项（AC-3），非本批阻断；本批 §2 / §9 面新增 = 0。

### 9.6 用例表（文档批口径 = 结构机检）

| 用例 | 输入 | 期望输出 |
|---|---|---|
| 正常 · 收口段 | 两档 §6 落笔后 | 判词 + 12 指针 + 状态行在位；计数 = 12 |
| 边界 · 已消行 | B19 / A22 行 | 「已消 / 读数 0」形态在位，无悬空指针 |
| 错误 · 丢项 | 任一尾巴无落点 | 计数 ≠ 12 ⇒ 红（收口不得落笔） |

### 9.7 边界（本设计不做）

不碰源码 / 测试（`:190` · `:173` · 5 行逐字快照 = 测试面批）；不碰台账（`TODO.md` = 主 agent）；不碰提示词；不碰参照历史面正文（`thincoder-cli/docs/**` · `thincoder-vscode/docs/**` = 只读）；不改批 1–10 已收口正文；不夹带新语义。

### 9.8 未决 / open

① A24 变注执笔（父侧 / designer——主 agent 裁）② A27 三条裁决 ③ B21 活档口径确认（建议 = 以现状为准）④ G1 载体裁量复核（并入本批 vs 另立 S3 档）⑤ 盘查表未落档：B17 / B18 / B20 与 G2 / G6 / G7、『判不出』4 条（CLI 3 + VSC 1——处置句见 §9.1）逐条身份缺载体——执行前由主 agent 补入或裁出（不得猜补）。

## 10. v1 文档退役批（台账 #22）· 归档形执行方案（2026-09-18）

**问题陈述**：两产品树 `docs/**`（VSC **136 活面 / 153 含归档** · CLI **142 / 192**）是 B 式迁移留下的**参照历史**（`docs/README.md` §2 政策）。
形态 / 四条判据 / 四条前提 / 执行窗口承 `docs/vsc/design/VSC-MIGRATION.md` §2.5（该档**前提 1** 已由用户 2026-09-18 03:28 裁定解除——原「原地保留不动」销项被取代）。
本设计交付**可执行方案**（逐树清单 §10.3 · 引用面处置 §10.4 · 执行步骤 §10.5 · 验收 §10.6）；**执行由父侧在用户点火窗口内发起**——设计交付 ≠ 执行。

### 10.1 方案与理由（落点 = 单归档根；活跃面入、既有归档原地）

**选型口径**：三候选均以**仓树副本沙箱**实跑 `node scripts/doc-check.mjs`（副本 = `.thincoder/tmp/retire-sim/{R2,R3,R4}`，扣 `node_modules`/`.git`），读数 = 迁后机检**新增悬空行**。

| # | 候选（落点形态） | 取舍 | 结论 |
|---|---|---|---|
| 1 | **活跃面 → `docs/_archive/<原相对路径>`**；既有 `<层>/_archive/**` **原地不动** | 结构恒等（**树内**相对引用按构造仍成立——越出 `docs/` 的相对锚 as-of 实扫 **0 处**，见 §10.7 前置枚举用例）· 单一归档根 · 实测 **+52 行** | **选定** |
| 2 | 整树（含既有归档）→ `docs/_archive/**` | 与「禁触 `_archive/**` 既有内容」相抵；指向既有归档档的 **5 行**失解 ⇒ 实测 **+57 行** | 否决（代价更高 + 触既有归档） |
| 3 | 逐层归档（`design/_archive/` · `requirements/_archive/` · `batches/_archive/` 分别并入） | 与候选 1 同读数（+52），但归档面散落 4–5 处、跨层相对引用（`../design/X.md`）失真、需新开 4 个 `_archive` 根 | 否决（形态） |

**基线读数**（as-of 2026-09-18 05:0x 实读）：仓根 `node scripts/doc-check.mjs` = 候选 1/3 = **339** · 候选 2 = **344** · 现状基线 = **287**（锚悬空；行宽 5 行、与三候选无关）。

### 10.2 落点规则与接口契约（机检可核）

| 项 | 规则 |
|---|---|
| **迁移集** | `thincoder-{vscode,cli}/docs/**` 全量 `.md` ∧ 路径不含 `_archive` 段——实核 **136 / 142 档**（两树均无 `.md` 外的杂项档，`walkAll` 实核） |
| **目标路径** | `thincoder-{vscode,cli}/docs/_archive/<原 docs/ 相对路径>`——**恒等映射**（结构 / 档名 / 正文全保持） |
| **迁移动作** | `git mv`（纯 rename）——**参照历史树内容一字不改**（零字节 diff；正文行数与内容均不变） |
| **零改面** | 既有归档（VSC `design/_archive/` **17 档** · CLI `design/_archive/` **50 档**）原地不动；两产品树其余非 `docs/` 面零触碰 |
| **发布面** | CLI `thincoder-cli/package.json:25`（`files` = `bin/` · `src/` · `README.md` · `CHANGELOG.md` · `LICENSE`）不含 `docs/` ✓ · VSC `.vscodeignore` 含 `docs/**` ✓ ⇒ **打包零影响**（本批零改两文件） |
| **机检声明面** | **零改**（实核 `PROJECT-MANIFEST.json:20-33`）：`scanDirs` = `docs` · `anchors.domain` = `docs` · `anchors.exclude` 已含 `_archive` · `lineWidth` = 300 · `exemptions` 空。两产品树本不在源域（§2.5 前提 3）；`_archive` 亦已在 `SKIP_DIRS`（`scripts/doc-check-anchors.mjs:53`）⇒ 迁入即出机检域 |

### 10.3 逐树清单（源目录 → 目标目录；右列档名 = 逐档清单）

`<前缀>` = `thincoder-vscode/docs/`（VSC）∥ `thincoder-cli/docs/`（CLI）；**逐档目标路径 = `_archive/` + 原相对路径 + 原档名**（恒等，由本表唯一确定）。

| 树 | 源目录 | 目标目录 | 档数 | 行数 |
|---|---|---|---|---|
| VSC | `batches/` | `_archive/batches/` | 34 | 8,443 |
| VSC | `design/` | `_archive/design/` | 50 | 13,458 |
| VSC | `design/prompts/` | `_archive/design/prompts/` | 15 | 1,026 |
| VSC | `requirements/` | `_archive/requirements/` | 34 | 2,232 |
| VSC | `docs/` 根（`README.md` · `CAPABILITY_GAP.md` · `COMPETITIVE_ANALYSIS.md`） | `_archive/`（同名） | 3 | 625 |
| VSC | **小计** | —— | **136** | **25,784** |
| CLI | `batches/` | `_archive/batches/` | 41 | 17,744 |
| CLI | `design/` | `_archive/design/` | 47 | 19,851 |
| CLI | `design/prompts/` | `_archive/design/prompts/` | 15 | 1,012 |
| CLI | `requirements/` | `_archive/requirements/` | 37 | 4,350 |
| CLI | `guides/` | `_archive/guides/` | 1 | 72 |
| CLI | `docs/` 根（`README.md`） | `_archive/`（同名） | 1 | 257 |
| CLI | **小计** | —— | **142** | **43,286** |

**逐档名单（136 / 142 两列：源档 → 目标档）** = **批档 §2 在册**（一次性批次材料——本档只留规则与计数，D2 单一权威源：`docs/batches/2026-09-18-v1-retire.md` §2）。
**清单机核（复跑命令 · 期望输出见 §10.6 AC-1）**：
`node -e "const fs=require('fs');for(const t of ['thincoder-vscode','thincoder-cli']){let a=0,r=0;const w=d=>{for(const n of fs.readdirSync(d)){const p=d+'/'+n;fs.statSync(p).isDirectory()?w(p):(/\/_archive\//.test(p)?r++:a++)}};w(t+'/docs');console.log(t,a,r)}"`

**phase-1 三档处置（open ③ **已结清：暂留原地 · 生效读数 139 / 50** · 父侧裁定 2026-09-18 05:3x）**：CLI 树清单原含 phase-1 三档 = `batches/2026-09-13-TWO-REPO-MERGE.md` · `design/TWO-REPO-MERGE.md` · `requirements/TWO-REPO-MERGE.md`——依 `docs/README.md` §3 现行政策「**暂留原地**」⇒ **本批不含**（原地不动；改期 = 两仓合并 phase 1 完成后另议）：

- **生效读数（迁移集口径）**：三档自**迁移集**剔除 ⇒ 迁移集 = **139 档**（142 − 3）；**S0 侧实读仍为 `thincoder-cli 142 50`**（§10.3 机核命令读磁盘现状——迁移集 ≠ 读数）；**S7 终态 = `thincoder-cli 3 189`**（活面留 3 档 · 归档面 50 + 139 = 189）；
- 原「迁」臂不取（政策未变；如改期另裁）——本块收正 = 父侧直接执行（可 revert）。

**清单计数口径**：**迁移集 = 136 / 139**（三档留原地 ⇒ 自迁移集剔除；142 / 50 = 读数口径）；**机核读数 = S0 `136 17` / `142 50` ⇒ S7 `0 153` / `3 189`**；与批档 §2.3（一）逐名清单同源（D2）。

### 10.4 引用面核（迁后转悬空 **52 引用**（= 50 行） · 逐族处置）

**口径**：源域 = 仓根 `docs/**` 扣 `_archive/` 与 `batches/`；读数 = **沙箱实跑引擎**（287 → 339 ⇒ 逐行差集 **52 引用**）。**单位**：引用 = 行内退役树引用条数（同行 2 条计 2）；**52 引用 = 50 行**（差 2 = `AGENT-LOOP.md:43`/`:224` 双引用行）。**分量**（按引用档所在域逐档求和）：`docs/core/**` **37**（行 35）· `docs/vsc/**` **15**（行 15）——全在闸态。

**残类口径（引擎未报红的域内前缀行——登记 · 非本批射程 · 修正轮补）**：本批改指射程 = **仅引擎红色差集 52 引用**（族 A/B/C）。
域内（源域同前）**含退役树前缀而不报红**的行（判据 = 逐行含 `thincoder-{vscode,cli}/docs` 子串；`docs/vsc/design/VSC-MIGRATION.md:92` 自承此类 = 「由唯一 basename 索引救回（不红、但为陈旧指针）」）**零动作 + 列报为已知遗留**：

| 面 | 复跑命令（命令 A） | as-of 2026-09-18 05:5x 复跑读数 |
|---|---|---|
| 域内退役树前缀行 | `node -e "const fs=require('fs');let n=0;const w=d=>{for(const x of fs.readdirSync(d)){const p=d+'/'+x;if(fs.statSync(p).isDirectory()){if(!/_archive$/.test(x)&&p!=='docs/batches')w(p)}else if(p.endsWith('.md'))for(const l of fs.readFileSync(p,'utf8').split('\n'))if(/thincoder-(vscode|cli)\/docs/.test(l))n++}};w('docs');console.log(n)"` | **663 行**（**工具** = `node -e` 内联·同格命令；**射程** = 源域 `docs/**` 扣 `_archive`-尾目录与 `docs/batches/`；**as-of 2026-09-18 05:5x**——分量：`docs/core/**` 479 · `docs/vsc/**` 58 · `docs/cli/**` 48 · `docs/TODO*.md` 72 · `docs/README.md` 6）——其中**本批改指面内带前缀者 36 行**（= §10.4 逐族明细坐标行内带前缀者，同刻复扫；`docs/core` 29 / `docs/vsc` 7）⇒ **残类 = 627 行**（`docs/core/**` 450 · `docs/vsc/**` 51 · `docs/cli/**` 48 · `docs/TODO*.md` 72 · `docs/README.md` 6）。漂移：05:2x 读 = 661 ⇒ 残类 624（447 · 51 · 48 · 72 · 6）；读数随他笔在飞面浮动，逐次以 S0 复跑为准 |

- **到期条件 = 命令 A 读数回 0**（残类被清扫完毕 ⇒ 本登记销项）；逐行明细 = S0 复跑输出（一次性材料 ⇒ 落批档 §5）。
- **引-D（`docs/TODO*.md`）· 引-E（口径外）** 另有各族处置行（本段不重复——D2）；残类**不进 52 引用射程** = 本批不改不登逐行。

| 族 | 判据句 | 引用 | 处置 |
|---|---|---|---|
| **引-A 史实指针** | 引用对象 = 被退役档**本身**：行含出处 / 来源 / 「自 … 并入 / 切出」/ 变更记录 / 迁移台账清单 / 引用面自述「参照历史」 | **44** | **改指归档形全路径**（`thincoder-{vscode,cli}/docs/_archive/<原相对路径>`）——**措辞零改**（D4 指针纪律：形态更新，非内容改写） |
| **引-B 现态断言** | 行对 v1 档作**现行效力**断言（「相邻权威」/「判据权威」/「条款住址」等现态语）⇒ 该断言随退役失效 | **4** | **改指 canonical 活档**（`docs/core/**` 同话题档：`ENGINEERING-MODE.md` · `ENG-TOKEN-BINDING.md`）∥ 无同话题活档者 ⇒ 归档形改指 + 行内**退场注记**（语义句，非引擎标记族） |
| **引-C 旧形态消歧** | anchor = 迁移前根形态 `docs/design/<X>.md`（无树前缀、本仓任何形态下均不存在） | **4** | 改指归档形**全路径**（按对象所属树补前缀），不得保留歧义形态 |
| **引-D 台账面** | `docs/TODO.md` · `docs/TODO-archive.md` 内的同类引用（迁后同转悬空） | （≈58 行，口径外） | **本批零动作**——两档 = 退役历史台账（`docs/README.md` §1），且**不入机检源域**（`scripts/doc-check-targets.mjs:17` `LEDGER_NAMES` 档名判）⇒ 不产闸面红；笔权 = 主 agent |
| **引-E 口径外引用** | 仓根 `README.md`（5 行 · product-text 面）· 两产品 `AGENTS.md` / `src` / `webview` 注释 · 产品 `test/**` 头注（合计 **35 行 / 20 档**） | 35 行 | **本批零动作 + 登记**（不在 §2.5 引用面口径；笔权与处置归父侧；产品 `test/**` 头注为注释非断言——实核 `advisor-chain-guards.test.mjs:277-300` 的 `thincoder-*/docs/...` 为**测试自建临时夹具**，非读真树，零断裂） |

**逐族明细（= 执行轮改指清单 · `file:line` 逐条）**：族 A/C 的 **48 引用** = 下列 **19 档**（行号 as-of 2026-09-18 05:0x；其中 5 处坐标随他笔漂移——批档 §2.6 新证据 ⑤，S0 复跑时对齐）——
`docs/core/design/AGENT-PARAMS.md:85/:138` · `BATCH-RECORD.md:284` · `CONFIG.md:91/:96/:138/:146` · `CONSULTATION.md:99` · `CORE-UNIFICATION.md:567/:603/:1656` ·
`DOC-CODE-RECONCILE.md:134` · `DOC-DISCIPLINE.md:505/:902` · `DOC-SYSTEM.md:22` · `ENG-TOKEN-BINDING.md:171` · `I18N.md:75` · `LEDGER.md:187` ·
`PORTABILITY.md:5/:148` · `SEND-STALL-DISTILL.md:8/:114/:147` · `TOOL-OUTPUT-LIMITS.md:104/:160` · `docs/core/requirements/AGENT-LOOP.md:43×2/:127/:142/:224×2` ·
`NORMAL-MODE.md:129` · `TWO-REPO-MERGE.md:65` · `docs/vsc/design/VSC-MIGRATION-INVENTORY.md:149/:150/:201/:203/:214/:215/:219/:220/:275/:337/:340/:357/:371/:372` · `docs/vsc/design/VSC-MIGRATION.md:126`。
族 B 的 **4 引用** = `docs/core/design/DOC-SYSTEM.md:279` · `ENG-TOKEN-BINDING.md:5/:85` · `docs/core/requirements/TWO-REPO-MERGE.md:53`。

**与 §2.5 估算的对账（口径差 · D3）**：§2.5 记「迁后转悬空 **111 行** = 38 + 73，其中 **58 行**落 `docs/TODO-archive.md` ⇒ 闸态 53（`docs/core` 45 + `docs/vsc` 8）」；
该数 = **行级引用面估算**（口径 = 行含 `thincoder-{vscode,cli}/docs` 子串；含非锚行与台账面）。本设计改以**闸面实测**为准：**52 引用**（单位见上；`docs/core` **37** + `docs/vsc` **15**——按引用档所在域逐档求和）。两数同量级（53 vs 52），**验收一律以复跑读数判**。

**分量归属差异成因（修正轮补）**：§2.5 的分量（45 + 8）按**行级子串估算**归堆（不分对象树 ∧ 含基线即红行与台账面）；本设计按**引用档所在域逐档求和** ⇒ 分量易位（`docs/core` 45→37 · `docs/vsc` 8→15）。原印「38 + 14」= 沙箱读的一次落档归堆，与逐档求和差 **1 引用** 的域归属（`docs/vsc/design/VSC-MIGRATION.md` 面一条）⇒ **以逐档求和为准**。

**禁出路**：**不得**以「迁移期引文」族标记（字面单源 = `docs/core/design/DOC-DISCIPLINE.md` §4.2.10——**他档不复述字面**，见该节「标记字面单源」段）
作为本批 52 引用的处置——本批引用**迁后在位**（可解析 ⇒ 无悬空可列报），且该族定位 = **存量旧址 / 已删**的后视承载（不用于可解析引用）；本批处置 = **改指**（路径可解析、零标记）。

### 10.5 执行步骤（逐步可核验 · **一树一轮一提交**——S0–S7 按树参数化）

**轮次结构（§2.5 前提 2「单批规模」的消解方式 · 修正轮补）**：本方案**按树切两轮**——每轮独立走 S0–S7 并**各自提交**（提交 = **该轮树迁移 + 该轮引用份额 + 该轮测试 / 文档改笔**）；§2.5 前提 2 记的「136 档 `git mv` + 247 行改指 + 57 行措辞改 + 一处测试族重定宿主」按轮**减半**（247 / 57 = 行级估算口径；每轮实际改笔 = 该轮份额，见 §10.4 对账）。

- **轮 A（VSC 树）**：`thincoder-vscode/docs/**` 迁移（136 档）+ 该轮份额（被引对象 = VSC 树者）+ `thincoder-vscode/test/prompts-mirror-anchors.test.mjs` 改指 + 文档改笔（含**共享档**）。
- **轮 B（CLI 树）**：`thincoder-cli/docs/**` 迁移（**139 档**——phase-1 三档按 §10.3「已结清」块（`:341`–`:346`）留原地）+ 该轮份额（被引对象 = CLI 树者）+ `thincoder-cli/test/prompts-dual-source.test.mjs` 改指 + 文档改笔。

**份额切分（52 引用 · 单位与 §10.4 同）**：规则 = 按**被引对象所属树**归属（引-A / 引-C 按对象归档位 · 引-B 按对象树）；**轮 A / 轮 B 各自的份额数在 S3 按 §10.4 逐族明细逐行判定并记入批档 §5**（同一行双引用而分属两树者 ⇒ 该行两轮各改一处；**两轮合计 = 52 引用** = 判据）。原印「VSC 20 行 / CLI 17 行 / 引-C 13 引用」**销项**：单位未定义 ∧ 13 与族表「引-C = 4 引用」互斥（不可复现）——设计轮不预印估算数。
**共享改笔**：`docs/README.md`（首部层级定位 + §2 政策行）落**轮 A 一次改毕**（两树同句）——轮 B 只核不发笔。

| # | 步骤（逐轮 · `<树>` = 该轮树 · `<份额>` = 该轮引用份额） | 判据 / 读数 |
|---|---|---|
| S0 | **前置读数**：`node scripts/doc-check.mjs`（记 `汇总` 行）；`git status --porcelain`（记在途面）；**越树相对锚枚举**（§10.7 用例） | 基线锚悬空数落批档 §5；**在途文档债批未收口 ⇒ 不点火**（§2.5 执行窗口条件）；相对锚非 0 ⇒ 登记为已知遗留 |
| S1 | **建归档根（`<树>`）**：`mkdir <树>/docs/_archive/` 含子目录 `design/` · **`design/prompts/`** · `requirements/` · `batches/`（**两树皆需**）· `guides/`（CLI 专有） | 目录在位 |
| S2 | **迁移**（`git mv`，**逐档**）：按 §10.3 清单把**该轮树** 136 ∥ 142 档移入 `_archive/` + 原相对路径；**既有 `<层>/_archive/**` 不动** | `git status` 全为 `R`（rename）；`git diff --stat` = **零内容行**（纯 rename）；该轮树 `docs/` 下除 `_archive/` 与既有 `design/_archive/` 外为空 |
| S3 | **引用改写（`<份额>`）**：按 §10.4 族 A/B/C 逐行处置该轮份额（族 A/C 路径改指 · 族 B 改指 canonical / 退场注记）；轮 A + 轮 B 合计 = 52 引用 | 改后 52 行全部可解析；**新增悬空 = 0** |
| S4 | **测试面处置**（§2.5 前提 2；前置枚举 = **三包** `test/**`（VSC / CLI / core）检索退役树前缀）：① `thincoder-vscode/test/prompts-mirror-anchors.test.mjs`（153 行 · 结构不变 · **3–4 处**——档内同串全量替换 + 逐处复核：镜像路径字面同串 ×2–3 + 扫描根 ×1）——③ 镜像源（`:39`）改指 `docs/_archive/design/prompts` · ⑤ 扫描根（`:53`）改指 `docs/_archive/`（判据不变、**不得静默空扫描**）；② `thincoder-cli/test/prompts-dual-source.test.mjs`（122 行 · 结构不变 · 1 处路径常量 + 2 处断言坐标）——`:44` / `:49` / `:51` 读 CLI 镜像档 ⇒ **同族改指**（轮 B · 判据不变）；③ 枚举余项 = 注释类（出处注 / 内部注——非断言、不读树）⇒ 引-E 登记 · 零动作 | 逐档**非空扫描判定**（改指后扫描根非空：15 档集合 / 存在性 / 头注格式断言在位）；`node --test <两档>` 逐档 pass（① 3 用例 ③/⑤/⑨-3）；AC-5 差值式全量兜底 |
| S5 | **声明面核**：`PROJECT-MANIFEST.json` `checkConfig` **零改**（§10.2 行 6）；`npm run doc:check`（VSC 包内 = `node ../scripts/doc-check.mjs --root ..`，台账 #49 口径）与仓根同读数 | 逐键对读 = 基线；包内读数 = 仓根读数 |
| S6 | **文档收正**（同笔）：① `docs/README.md` 首部层级定位 + §2 政策行——产品 `docs/**` 状态「迁移期参照历史」→「**v1 参照历史（已归档 `_archive/`）**」；② `docs/vsc/design/VSC-MIGRATION.md` §2.4 降格声明 + §2.5 加**执行注**（本方案 = 本档 §10 · 执行窗口 = 用户点火）；③ 两档变更记录各一行 | 三处落笔在位；引用面无悬空 |
| S7 | **终态读数 + 提交（逐轮）**：复跑 `node scripts/doc-check.mjs`；`git commit`（**该轮**：迁移 + 该轮份额 + 该轮测试 / 文档改笔） | 见 §10.6 AC-4/AC-5；AC-1 的 `R` 对断言按轮读数（轮 A 136 / 两轮合计 **275** = 136 + 139） |

### 10.6 验收标准（回指台账 #22 · VSC-MIGRATION §2.5 判据 · 全部可机判）

| AC | 回指 | 判据 | 复跑 |
|---|---|---|---|
| AC-1 清单闭合 | 台账 #22 · §2.5 判据 3 | 迁移集 = **136 / 139**（CLI 已剔 phase-1 三档——§10.3「已结清」块）· 既有归档 **17 / 50** 原地在位 · 归档后 **VSC** `docs/` 下仅 `_archive/` + 既有 `design/_archive/`；**CLI 侧例外**（三档留原地）：`docs/` 下 = `_archive/` + 既有 `design/_archive/` + `batches/` / `design/` / `requirements/` **三目录各 1 档**（`TWO-REPO-MERGE.md`）· **映射恒等**（每个 `R` 对目标 == 源档树内 `docs/` 相对路径加 `_archive/` 前缀） | §10.3 机核命令——**S0 基线**（迁移前·实读磁盘）：`thincoder-vscode 136 17` / `thincoder-cli 142 50`（CLI 读数含留原地三档——**迁移集 = 139**）；**S7 终态**（迁移后）：`thincoder-vscode 0 153` / `thincoder-cli 3 189`（`153 = 136 + 17` · `189 = 50 + 139`）；＋ **`R` 对断言**（AC 补充注 ①） |
| AC-2 一字不改 | §2.5 判据 2（参照历史保留语义） | `git diff --stat -M` = 纯 rename（零 `+`/`-` 内容行）；逐档行数不变（25,784 / 43,286） | `git show --stat --find-renames` |
| AC-3 引用面闭合 | §2.5 影响面表 | §10.4 **52 引用**（= 50 行）**全部可解析**（改指归档形 / canonical）；**零新增标记**（「迁移期引文」计数 **≤ S0 基线**——设计轮读数 = 1） | `node scripts/doc-check.mjs` 逐行核 + `汇总` 的「迁移期引文」计数 |
| AC-4 零新增 | 批档 §2 验收 ⑤ | 终态 `汇总` 悬空 = **S0 基线值**（本批新增 **0**）· 行宽不增（差值式——**读数标与漂移说明 = AC 补充注 ②**） | 前后两次 `node scripts/doc-check.mjs` 对读 |
| AC-5 测试 | §2.5 前提 2 | **差值式**：终态套件结果 vs **S0 基线** ⇒ **无新增失败**（绝对全绿不作判据——**既有红以 S0 基线为准，不假定具体档**）；**③/⑤ 重定宿主两例列必过项**（`prompts-mirror-anchors.test.mjs` 的 ③ 镜像源 / ⑤ 扫描根）+ 轮 B 同族例（`prompts-dual-source.test.mjs`） | S0 / S7 两次 `npm test` 对读（VSC 包；CLI 包随轮 B）+ 逐档 `node --test` |
| AC-6 发布面 | §10.2 行 5 | CLI `package.json` / VSC `.vscodeignore` **零改**（`git status` 不含两文件） | `git status --porcelain` |
| AC-7 声明面 | §10.2 行 6 | `checkConfig` 五键**零改**（D3：键清单 = 列表长度） | `git diff PROJECT-MANIFEST.json` 空 |

**AC 补充注（修正轮 · as-of 2026-09-18 05:2x）**：

| 注 | 内容 |
|---|---|
| ① AC-1 `R` 对断言（映射恒等机核） | 命令 = `node -e "const{execSync}=require('child_process');const R=execSync('git diff --name-status -M',{encoding:'utf8'}).trim().split('\n').filter(l=>l.startsWith('R')).map(l=>l.split(/\s+/));console.log('R 对',R.length,'错配',R.filter(p=>p[1].indexOf('/docs/')<0||p[2]!==p[1].slice(0,p[1].indexOf('/docs/'))+'/docs/_archive/'+p[1].slice(p[1].indexOf('/docs/')+6)).length)"`——期望 `R 对 275 错配 0`（轮 A 后 = 136 / 两轮合计 = **275** = 136 + 139——三档留原地不入迁移集）；非零 ⇒ 红（防「移进错误子目录」型全过：计数不变 ∧ 纯 rename ∧ 源树为空三判据同过）。已 staged 时该命令加 `--cached` |
| ② AC-4 读数标与漂移 | 读数标记 = **工具**（`scripts/doc-check.mjs` 锚腿悬空 / `scripts/doc-check-width.mjs` 行宽）· **射程**（`checkConfig.scanDirs` = `docs`——两产品树不在域）· **as-of**；同批各处读数不一致 = **他笔在飞面漂移**（§9.3 A21 面 = 5 文件 12 行 · 2026-09-16 复跑；§10.1 = 行宽 5 行 · 05:0x；批档 §2 = 行宽 6 行 · 05:1x；**修正轮 1 窗口（同 as-of 05:2x）两次复跑**：悬空 **288** / 行宽 **5 行**（批档 §2.6）与悬空 **285** / 行宽 **6 行**（批档 §2.4 AC-⑤）——两读数并存即他笔在飞面的漂移本身）⇒ 判据 = **差值式**，逐次以 S0 复跑为基线，不与他次读数比大小 |
| ③ AC-5 测试面全集 | 枚举口径 = **三包** `test/**`（VSC / CLI / core）逐行检索退役树前缀（§10.5 S4）；as-of 05:5x 实扫 = **VSC 14 行 · CLI 10 行 · core 1 行**；命中 = **读取类两档**（①②）+ **注释类余项**（③）；`thincoder-vscode/test/doc-anchors.test.mjs`（评审轮 1 发现 7 引 §9.3 A22）**现不存在**（三包 `test/**` 实核；该路径 git 历史在册）⇒ 该条不构成本批测试面 |

### 10.7 用例表（文档批口径 = 结构机检）

| 用例 | 输入 | 期望输出 |
|---|---|---|
| 正常 · 迁移 | S2 逐档 `git mv` 后 | `git status` 全 `R`；归档树结构 = 原结构（§10.3 表逐目录对位） |
| 边界 · 既有归档 | 指向 `thincoder-cli/docs/design/_archive/ARCHITECTURE-v2.md` 的 5 行（`ARCHITECTURE.md:27` 等） | 仍可解析（既有归档原地）⇒ 不产新悬空 |
| 边界 · 同名集合 | `design/prompts/` 15 档（两树同名） | 迁后 ③ 断言（核包 15 ↔ 归档镜像 15 同名集合相等）仍成立 |
| 错误 · 漏迁 | 迁移集少 N 档 | AC-1 机核读数 ≠ 136 / 139（S0 `136 17` / `142 50` ⇒ S7 `0 153` / `3 189`）⇒ 红 |
| 错误 · 触既有归档 | 既有 `_archive/**` 被移动 / 改动 | AC-1 ＋ AC-2 双红 |
| 错误 · 标记出路 | 52 引用改用 `docs/core/design/DOC-DISCIPLINE.md` §4.2.10 该族标记结案（标记字面单源 = 该节定义位——D2） | AC-3 红（标记计数 > S0 基线） |
| 前置枚举 · 越树相对锚 | S0 对两树 `docs/**`（非 `_archive`）的 `.md` 扫描**相对锚**——markdown 链接 `](…)` 解析结果**出该树 `docs/`** 者（含指向产品代码 / 邻树 / 仓根的写法） | as-of 2026-09-18 05:2x 实扫 = **0 处**（VSC 0 · CLI 0；口径 = `.md` 链接形态，反引号内路径串不入扫描）；复跑 0 处 ⇒ 过；**非 0 ⇒ 逐条登记为已知遗留**（迁后失效、正文一字不改 ⇒ 不改指、不入闸） |

### 10.8 边界（本设计不做）

**不执行**（执行窗口 = 用户点火 · 父侧发起）；不碰 `_archive/**` 既有内容；不碰两产品树 `docs/` 外任何面（`AGENTS.md` / `src` / `webview` / `test` 头注 = 引-E 登记）；
不碰台账两档（`docs/TODO.md` · `TODO-archive.md` = 主 agent 笔）；不碰需求档（父侧笔）；不碰提示词面（`docs/core/design/prompts/**` 与两产品镜像均为对象外）；
不碰 `checkConfig` / `SKIP_DIRS`（声明面零改）；不改 `_archive` 内文本（含既有归档与迁入档）；不夹带新语义（族 B 的 4 行例外仅 = 现态断言失效的处置）。
不改两产品树**正文**——含**树内越树相对锚**（as-of 实扫 0 处，§10.7 前置枚举）与域内含退役树前缀的**残类陈旧指针**（**627 行**——不改 · 不逐一登，§10.4 残类口径 + 到期条件）。

### 10.9 open / 未决

① **执行窗口点火**（用户 / 父侧——§2.5 窗口：在途文档债批收口 ∧ 用户点火）；② **族 B 4 行的措辞落笔**（改指 canonical vs 退场注记——执行轮按 §10.4 判据择一，若涉语义转换则回父侧）；③ **`docs/README.md` §3 待迁清单**的 phase-1 三档（`TWO-REPO-MERGE*`）——**已结清：暂留原地**（父侧裁定 2026-09-18 05:3x；生效读数 139 / 50——§10.3 已结清块）。

## 变更记录

- 2026-09-18（**判据面收正批（#64 ③）· eng-designer**——承 `docs/batches/2026-09-18-arbiter-face.md` §1）：§10.4 **禁出路行**收正为**节号指针**形态（字面单源 = `docs/core/design/DOC-DISCIPLINE.md` §4.2.10 定义位——他档不复述字面）；§10.7 用例表「标记出路」行同法去字面重述。
  **历史信息转入本条**（原 §10.4 修订式句删——D8）：本设计原引「到期条件 = 标记数回 **0**」；该口径已收正为**不设「回 0」期**（判据单源 = `docs/core/design/DOC-DISCIPLINE.md` §4.2.10 到期条件行 · 2026-09-18 判据面收正批）；本设计的 52 引用处置不变（改指 · 零标记）。可 revert。

- 2026-09-18（**v1 文档退役批（台账 #22）· 设计修正轮 2 · eng-designer**）：§10 按设计评审轮 2（PASS · 🟡 4 / 🔵 8 = 12 条）逐条收正（报告「号 → file:line」= 批档 §2.7）：
  裁定传导——§10.3 已结清块（标题带生效读数 139 / 50；S0 实读保留 `142 50` + 迁移集 = 139；S7 终态 `3 189`）· §10.6 AC-1 结构判据补 CLI 例外句 + S7 `0 153` / `3 189` · `R` 对期望 **278 → 275**（补充注 ①、S7 行）· §10.5 轮 B 档数 142 → 139 并改指 §10.3 已结清块 · §10.9③ 改「已结清」；
  计数与单位——§10.4 定义单位（引用 / 行；52 引用 = 50 行）+ 分量改**逐档求和 37 + 15**（原印 38 + 14 = 沙箱读，存档）· 命令 A 择一 `\|` → `|` 并同批重跑落标（663 / 改指面内 36 行 / 残类 627）· §10.5 份额切分改「S3 逐行判定 + 两轮合计 = 52 引用」（原印 20 / 17 / 13 销项）· 逐族明细 18 → **19 档**；
  其余——§10.6 AC-5 括注改「既有红以 S0 基线为准」· 补充注 ② 补悬空两读数与漂移 · 注③ 枚举改**三包** `test/**`（带实扫读数）· S4 ① 处数改 **3–4 处（同串全量替换）** · §9 命令名与实存脚本对齐（`scripts/doc-check-anchors.mjs` / `scripts/doc-check-width.mjs`；`check-ledger.mjs` 注「随单引擎作废」）。

- 2026-09-18（**v1 文档退役批（台账 #22）· 设计修正轮 1 · eng-designer**）：§10 按设计评审轮 1（PASS · 🟡 11 / 🔵 3 = 14 条）逐条收正（报告「号 → file:line」= 批档 §2.6）：
  §10.1 候选 1 理由补「树内」限定 + 越树锚实扫 0 处；§10.3 补**待裁三档**标记（open ③ · 142 ⇄ 139 / 50）；§10.4 补**残类口径**（域内前缀行 661 / 残类 624 · 到期条件 · 命令 A）+ 引-A 树名收正 + 对账补**分量归属成因**；
  §10.5 改「**一树一轮一提交**」并补**轮次结构**（前提 2 消解 · 份额切分）+ S1 目录清单补 `design/prompts/`（`batches/` 两树皆需）+ S4 补**测试面前置枚举**与两档处置（新登 `thincoder-cli/test/prompts-dual-source.test.mjs`）；
  §10.6 AC-1 并列 S0 / S7 两读数 + `R` 对断言 · AC-3 改「零**新增**标记」· AC-4 补读数标与漂移 · AC-5 改**差值式** + 必过项（AC 补充注 ①②③）；§10.7 补**越树相对锚前置枚举**用例；§10.8 补残类 / 相对锚边界句。

- 2026-09-18（**v1 文档退役批（台账 #22）· 设计轮 · eng-designer**）：新增 **§10 v1 文档退役批 · 归档形执行方案**——落点选型 §10.1（三候选沙箱实跑：选定 +52 / 否决 +57）· 规则与接口契约 §10.2 · 逐树清单 §10.3 ·
  引用面 52 行逐族处置 §10.4 · 执行步骤 S0–S7 §10.5 · 验收 AC-1–AC-7 §10.6 · 用例 §10.7 · 边界 §10.8 · open §10.9；形态与判据承 `docs/vsc/design/VSC-MIGRATION.md` §2.5（不重述，D2）；逐档名单 = 批档 §2（D2）。

- 2026-09-16（**批 11 · 实施轮 · eng-designer**）：A20 落 `DOC-DISCIPLINE.md` §4.2.7 判据面登记追加条（「三元素 ⇏ 九元素」——基准层补写 · 参照面不回改）；A21 落 `docs/README.md` §4（core/design 补登 27 档 + 计数核对行）；
  §9 读数 as-of 复跑收正（锚 3 条行号顺移 · 宽度 = 5 文件 12 行 · 台账 = 1 条（台账面）· V1–V3 = 4 条（他作者面）· A21 双向 = `49 0`）+ §8 行数重核。

- 2026-09-16（**批 11 · 修正轮 R1 · eng-designer**）：§9 按评审轮 1 发现收正——§9.1 补判不出 4 条处置 + 称谓注；§9.3 A10 / A21 / A22 跨表对齐（差集 27 · 双向等式 · `TODO.md` 落点 · 权威表头）；
  §9.4 差项句收正（三腿逐读 + 归属）· G4 口径（10 = 时点读数）；§9.5 AC-1 谓词 / AC-3 判据与落点 / AC-4 基线限域处置 / AC-5 全量证据行 + AC 补充注；
  `:7` 根层基准复跑收正（49 + 38）；三腿 + 报告态读数 as-of 复跑收正（锚 3 条——修正轮复跑 5 → 3：`VSC-DEBT.md` 面 2 已消 · 宽度 8 行 · 台账 0 · 报告态 5 处 / distinct 3）；
  A21 双向命令对（`49 27` / `0`）+ AC-3 报告态注 + AC-4 基线 as-of 写明 + 批 11 §2 A21 摘要同步 + AC-5 族豁免读数标注（CLI 36 / VSC 188）+ AC-3 终态行样逐字对齐 §9.4。

- 2026-09-16（**批 11 · 迁移收尾（设计轮）· eng-designer**）：新增 **§9 迁移收尾**（收口口径 §9.1 · 选型 5 项 §9.2 · 尾巴十二条落点 §9.3 · phase-2 改判 §9.4 · 验收 §9.5 · 用例 §9.6 · 边界 §9.7 · open §9.8）；§8 行数重核。

- 2026-09-15（**迁移批 · 尾部真批（断点续作）· 15 档并入收口 · eng-designer**）：§2.1 五行（第 17 / 24 / 32 / 34 / 44 行）
  + §2.2 十行（第 4 / 10 / 11 / 18 / 19 / 21 / 22 / 27 / 28 / 37 行）「后续批」→「**本批迁**」（逐行补实核依据 + 落点）；§5 小计重算闭合（本批迁 49 → **64** · 后续批 15 → **0**——清零）；§6 批 6a / 6b 行标**已落**、批 7 残留行销项、标题 15 → **0**；§1 根层基准档数按现状收正（17+17 → 50+37——2026-09-16 复跑再正 = 49 + 38，见 §9.3 A21）；§8 行数重核。
  **本批实迁 15 档**：设计 5（ESCALATE / SEND-STALL-DISTILL / TURN-CAP-CONTINUE 并入 VSC 批 3 同名根档；MULTI-INSTANCE-COLLAB / SETTINGS-TOOL 纯新建）· 需求 10（全并入 VSC 批 4 / 批 5 同名根档；VERIFY-REDESIGN 落点经用户裁定 = 同名根档；PROJECT 按其档头自注对账合并）。
  **断点续作事实**：前轮子代理（SSE 断流）落笔中途死亡，15 档部分落笔未经审计；本轮逐档全量审计后补完（五处悬空锚 + 一处超宽行 + 一处 V1 段引用 + 两处不并登记缺行 + 三处行数口径收正）并收口台账。三机检：域一悬空 **0** · 宽度 / 一致性新增违规 **0** · 台账 **0**。

- 2026-09-15（**迁移批 · 尾部批 · 实核与转形态登记 · eng-designer**）：**本批 0 档实迁**——取材 5 档（需求侧 DESIGN-TOKEN-SETTLEMENT / ENG-TOKEN-BINDING / PORTABILITY / PROJECT / VERIFY-REDESIGN）在落笔窗口内被并轮 **VSC 批 5** 同名新建（磁盘现态 = 他线版本）⇒ 按「不抢」纪律全数跳过、本批产物回转（restore）。
  §2.1 五行（第 17 / 24 / 32 / 34 / 44 行）+ §2.2 十行（第 4 / 10 / 11 / 18 / 19 / 21 / 22 / 27 / 28 / 37 行）判栏**保持「后续批」**，动作列按现状改写为「**并入既有**（同名根档已由 VSC 批 3 / 批 4 / 批 5 建）」；§2.2 第 37 行（VERIFY-REDESIGN）落点两读**待父侧裁定**。
  §6 批 6a 补 ESCALATE（一致性收正——原缺分组）· 批 6b 剔 TESTING 印刷残留并注记全量转形态；§5 小计**不变**（49 / 15 仍闭合）；§8 行数重核。
- 2026-09-15（**迁移批 · 第 6 批 · CLI 专有面（P2）· eng-designer**）：§2.1 五行（第 1 / 11 / 41 / 42 / 43 行）+ §2.2 四行（第 1 / 9 / 33 / 34 行）「后续批」→「**本批迁**」（逐行补现状实核依据 + 落点）；§3 迁移注意项标**已收口**（TUI-INPUT-BOX 二态混装）；§5 小计重算闭合（本批迁 40 → **49** · 后续批 24 → **15**）；§6 批 5 行标**已落**、标题 24 → **15 档**；§8 行数重核。
- 2026-09-15（**S2 W14 落地 · eng-coder**——承 `docs/batches/2026-09-15-vsc-core-wiring.md` §2 W14）：§2.1 表第 18 / 19 行（HASHLINE-EDIT / INSERT-AFTER）VSC 对位坐标补迁核注——VSC 自持档
  （`thincoder-vscode/src/tools/{hashline-edit.mjs, more-file.mjs}`）随 W14 删，现体 = 核 `thincoder-core/tools/file.mjs`；S2 W14 单元 = VSC 工具实现面迁核（批次档 §2）；机制条文零改。
  **本批实迁 9 源档 ⇒ 11 产物档**（全落 `docs/cli/`）：设计 7（TUI 按读者面**拆三档** + TUI-INPUT-BOX + TUI-TOOL-OUTPUT + ACP-CLIENT + CRASH-REPORTS）· 需求 4（TUI / TUI-TOOL-OUTPUT / ACP-CLIENT / CRASH-REPORTS）。
  **逐档要点**：TUI（1529 行超硬门）⇒ 拆 `TUI` / `TUI-COMMANDS` / `TUI-SESSION-VIEW`；TUI-INPUT-BOX 二态混装按「第 31 批已实装」收口为**单态现行契约**；CRASH-REPORTS 状态行漂移按现状收正；ACP-CLIENT 两处坐标按现状收正（question 可用性行载体 = `thincoder-cli/src/prompt-injections.mjs`；relay 文法模块 = `thincoder-core/agent/relay-prefix.mjs`）。
  **层归属不对称登记**：TUI 设计侧 5 档（含既有的 TUI-INPUT-BOX / TUI-TOOL-OUTPUT）⇄ 需求侧 1 档——双侧档头互注。
- 2026-09-15（**迁移批 · 第 5 批 · 并入既有 · eng-designer**）：§2.1 三行（第 3 / 25 / 27 行）+ §2.2 十行（第 2 / 3 / 5 / 13 / 17 / 23 / 25 / 29 / 31 / 35 行）「尚有未并 / 后续批」→「**本批迁**」（逐行补实核依据 + 落点）；
  §4 对账两行更新；§5 小计重算闭合（本批迁 27 → **40** · 尚有未并 5 → **0** · 后续批 32 → **24**——并将上一版印刷值 4 / 33 按逐行实计收正为 5 / 32）；§6 批 4 行标**已落**、标题 33 → **24**；§8 行数重核。
  **本批实迁 13 源档**：design 3（AGENT-LOOP 拆分面 + PROMPT-SYSTEM + POOL-CONFIG-UNIFIED ⇒ CONFIG）· req 10（MEMORY / AGENT-LOOP / PROMPT-SYSTEM / ADVISOR-CONVERGENCE（新建）/ ESCALATE / SEND-STALL-DISTILL / SUBAGENT-OBSERVE-SEND / TURN-CAP-CONTINUE / TOOL-OUTPUT-LIMITS（⇒ req/TOOLS §4.5）/ ASYNC-RESULT-CONTAINER）。

- 2026-09-15（**迁移批 · 第 4 批 · 四个大档拆分 + 实迁** · eng-designer）：§2.1 四行（第 2 / 16 / 20 / 38 行）+ §2.2 两行（第 12 / 30 行）「后续批」→「**本批迁**」（ADVISOR-CONVERGENCE · ENGINEERING-MODE · LEDGER-SELF-CONTAINED · TESTING · req/ENGINEERING-MODE · req/TESTING——逐行补现状实核依据 + 落点）；§6 批 3 行标**已落**（档名补 req 两档）、标题档数 39 → **33**。
  §5 小计重算闭合（本批迁 21 → **27** · 后续批 39 → **33**；设计 21 / 需求 6）；§5 口径行补第 4 批；§8 行数重核。
  **本批实迁 6 档**（皆超 500 硬限 ⇒ 先拆后迁）——`design/ENGINEERING-MODE`（3030）⇒ `docs/core/design/` 四档（ENGINEERING-MODE · BATCH-RECORD · DOC-DISCIPLINE · LEDGER）；
  `design/ADVISOR-CONVERGENCE`（1570）⇒ 两档（ADVISOR-CONVERGENCE · ADVISOR-GUARDS）；`design/LEDGER-SELF-CONTAINED`（1033）⇒ 一档；`design/TESTING`（995）⇒ 两档（TESTING · E2E-HARNESS——后者 **2026-09-15 已删除**）；
  `req/ENGINEERING-MODE`（1003）⇒ 两档（ENGINEERING-MODE · ENGINEERING-MODE-MECHANISM）；`req/TESTING`（177）⇒ 一档。
  产物 12 档**逐档 ≤500**（实测 191–380）；坐标全量改现状路径（检查器改指仓根 `scripts/` · 运行期模块改指 `thincoder-core/**` · 测试/入口改指 `thincoder-cli/**`）；一次性材料（逐批设计记录 / 受影响文件 as-of 快照 / 用例与 AC 编号集 / 状态行）逐档登记入各档「不并项与历史沿革」。
- 2026-09-18（**失效表达清理批 · 本批直接执行 · 可 revert**——承用户 2026-09-18 裁定「修订式表达很害人，失效的表达一定要删掉」）：删除失效表达（不留划改残留）——档头 as-of 注「原记 50 + 37」句 · §2.1 第 37 行「原登记…作废」括注 · §6 批 6a / 6b 两行划改段 + 批 7 残留行；
  §9.3 A21「原记『另 12 档』」句 · §9.4 台账腿「随单引擎作废」括注 + G4「原记『10 条』」句。历史沿革 = 本档既有历史段 + 批档 `docs/batches/2026-09-18-stale-expression-purge.md`。
- 2026-09-15（**迁移批 · 第 3 批 · 机制小档 6 档实迁** · eng-designer）：§2.1 六行「后续批」→「**本批迁**」（AGENT-PARAMS · DESIGN-TOKEN-SETTLEMENT · ENG-TOKEN-BINDING · PROXY · TOOL-OUTPUT-LIMITS · VERIFY-REDESIGN——逐行补现状实核依据 + 落点）；§6 批 2 行标**已落**、标题档数 45 → 39。
  §5 小计重算闭合（本批迁 15 → 21 · 后续批 45 → 39；设计 17 / 需求 4）；§5 口径行补第 3 批；§8 行数重核。
  **本批实迁 6 档**（全落 `docs/core/design/`）：TOOL-OUTPUT-LIMITS · AGENT-PARAMS · VERIFY-REDESIGN · DESIGN-TOKEN-SETTLEMENT · ENG-TOKEN-BINDING · PROXY。
  **按现状收正两处**（登记于各落点档 §8.1）：PROXY §TLS 安全语义（旧档与实装相反）+ PROXY §web 消费面（web 工具已改逐次调用参数）；ENG-TOKEN-BINDING §4/§5 口径（单值镜像已退役 / 宿主模块已拆）。
- 2026-09-15（**迁移批 · 第 2 批 · 待核 9 档收口 + 实迁** · eng-designer）：§3 待核**清空**（原 9 档经用户裁定逐档定判并同批实迁——判与落点入 §2.1 / §2.2 对应行；裁定前两读法入批次档 §2）；§5 小计重算闭合（待核 9 → 0；本批迁 6 → 15）并补「本批迁」口径行；§6 批 5 备注改「前置已满足」（`docs/cli/` 已建 + 射程已扩）；§1 判栏取值改六类并标「待核已清空」；§8 行数收正。
  **本批实迁 9 档**：`docs/core/design/` 的 ARCHITECTURE · PORTABILITY · STRUCTURE-DEBT · TWO-REPO-MERGE，`docs/cli/design/` 的 RELEASE，`docs/cli/requirements/` 的 FEATURES，`docs/core/requirements/` 的 PHILOSOPHY · RELEASE · TWO-REPO-MERGE。
- 2026-09-15（**迁移批 · 二分 + 当场迁第一批 · eng-designer**）：建档——承 `DOC-SYSTEM.md` §11 拆分规划，把该档 §5.2 初分类表精化搬入本档并逐档补证据（`file:line`）；新增 §5 小计闭合 · §6 后续批分组；§3 待核 9 档（两种读法）；第一批已迁 6 档（编辑工具族——见 §2.1 第 5 / 13 / 14 / 18 / 19 / 47 行）。
- 2026-09-20（**库存清账批 · v1 测试门词面收正 · eng-designer**——承 `docs/batches/2026-09-20-residual-sweep-batch.md` §2 · 台账 #128）：§9.3 A23 行词面收正（补入单入口 / 守卫随单入口可跑后销——v2 `slow` 纯别名）。**零新语义**。
