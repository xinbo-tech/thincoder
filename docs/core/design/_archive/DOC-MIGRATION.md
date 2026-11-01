# 文档迁移台账（DOC-MIGRATION）· CLI 树 84 档二分与落点

> 归属 = **文档体系板块**（`docs/core/design/DOC-SYSTEM.md` 的下游执行表）；本档 = **CLI 树 84 档的逐档二分（活 / 历史）+ 落点 + 批次分组**的唯一权威表；并载后续迁移执行方案（§10 v1 文档退役 ∥ §11 桌面端设计档按域拆分 ∥ §12 R2 层前缀引称迁移执行表）。
> 判据（**本节不复制**）→ `docs/core/design/DOC-SYSTEM.md` §5.1（P1–P5 归属判据句）· §4（目标目录结构）· §6（命名规则）。
> 迁法（用户裁定「**明显应该是 B**」）= **旧档留原地一字不改 + 内容补写 / 重建进根层**。
> 底本口径 = `thincoder-cli/docs/design/*.md`（47）+ `thincoder-cli/docs/requirements/*.md`（37）= **84 档**（不含 `_archive/` 下的提示词档 · `design/_archive/`）。
> 依据口径 = 逐条 `file:line` 坐标；根层基准 = `docs/core/{design,requirements}/`（见 §9.3 A21）。
## 1. 口径与实点

| 面 | 底本目录 | 实点 |
|---|---|---|
| 设计档 | `thincoder-cli/docs/design/` | **47** |
| 需求档 | `thincoder-cli/docs/requirements/` | **37** |
| **合计** | —— | **84**（与 `DOC-SYSTEM.md` §5.2 计数口径逐格闭合） |

**判栏取值**（六类）：**已迁**（活档 · **已入根层**——含历批已迁档，口径见 §5）· **已清**（根层已有同话题活档 · 无未并内容）· **尚有未并**（根层有同话题活档但仍有 CLI 侧内容未并入）· **历史**（已被现行设计取代 / 批档形态 ⇒ 不迁）· **待核**（两种读法单列——**已清空**，见 §3）· **后续批**（活档 · 尚未迁）。

**落点列**：已落者写具体档路径；未落者只写**目录**（目标档尚不存在——不写假路径，避机检假锚）。

## 2. 二分表（逐档 84 行）

### 2.1 设计档（`thincoder-cli/docs/design/` · 47）

| # | 档 | 判 | 依据（file:line） | 动作 / 落点 |
|---|---|---|---|---|
| 1 | ACP-CLIENT | **已迁** | 活——根层无同话题档；实装 `thincoder-cli/src/acp/` 在位；VSC 无实现（结构性不对称）；relay 文法模块居 `thincoder-core/agent/relay-prefix.mjs` | 已落 `docs/cli/design/ACP-CLIENT.md` |
| 2 | ADVISOR-CONVERGENCE | **已迁** | 活——根层无对应（`docs/core/design/CONSULTATION.md` §8.2 越段登记）；= advisor 评审收敛设计权威 | 已落 `docs/core/design/ADVISOR-CONVERGENCE.md` + `docs/core/design/ADVISOR-GUARDS.md` |
| 3 | AGENT-LOOP | **已迁** | 未并入面（评审对象锚 / R1–R7 铁律 / byte-identical 取消 / 普通模式轻量审计）已并入；飞刀面由 `ESCALATE.md` 承载 | 已并入 `docs/core/design/AGENT-LOOP.md`（§6.17）+ 拆分面 `docs/core/design/AGENT-LOOP-SUBAGENT.md` · `docs/core/design/AGENT-LOOP-ASYNC-POOL.md`（§6.18 / §6.19） |
| 4 | AGENT-PARAMS | **已迁** | 活——根层无对应（`AGENT-LOOP.md` §6.1 仅覆盖 maxTurns 默认；`timeoutMs` 面无主）；三参数默认值（`thincoder-core/advisor/compaction.mjs:36` · `thincoder-core/config-defaults.mjs:18` · `thincoder-core/agent/helpers.mjs:25`） | 已落 `docs/core/design/AGENT-PARAMS.md` |
| 5 | APPLY-PATCH | **已迁** | 根层无正文（`TOOLS.md` §8.2 登记「正文已拆到各工具权威档」= 无档名指针）；VSC 同名对位 | 已落 `docs/core/design/APPLY-PATCH.md` |
| 6 | ARCHITECTURE | **已迁** | 活——根层原无架构总览载体（硬约束 / 设计原则 / 模块地图）；§3 模块地图 = 现行 `src/**` 结构 | 已落 `docs/core/design/ARCHITECTURE.md` |
| 7 | ASYNC-RESULT-CONTAINER | 历史 | 机制结论已全文入 `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.7.3（D2–D6 覆盖范围）；余为批材料 | 不迁（就地留参照） |
| 8 | CHECKPOINT | 已清 | 对账：CLI §2–§8 ↔ 根层 §6.1–§6.8 + §7（§5.5 与附录由根层 §8.2 登记不并） | 无动作 |
| 9 | CONSULTATION | 已清 | 对账：CLI §2.1–§2.6 ↔ 根层 §6.1–§6.4 + §7 | 无动作 |
| 10 | CONTEXT-COMPACTION | 已清 | 对账：CLI §1–§12 ↔ 根层 §6.1–§6.12（D1–D13 / H1 / E1 全在场） | 无动作 |
| 11 | CRASH-REPORTS | **已迁** | 活——根层无对应；实装 `thincoder-cli/src/crash-reports.mjs` · `thincoder-cli/src/heap-watch.mjs` 在位；VSC 无此面 | 已落 `docs/cli/design/CRASH-REPORTS.md` |
| 12 | DESIGN-TOKEN-SETTLEMENT | **已迁** | 活——根层无对应；代码注释直引其 D3（`thincoder-core/token-ttl.mjs:20`） | 已落 `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` |
| 13 | EDIT-HELPERS | **已迁** | 根层无档名（`TOOLS.md` §6.6 末「共享 helper 权威 = 编辑辅助面」）；VSC 同名对位 | 已落 `docs/core/design/EDIT-HELPERS.md` |
| 14 | EDIT | **已迁** | 同编辑族（`TOOLS.md` §8.2 登记）；VSC 同名对位 | 已落 `docs/core/design/EDIT.md` |
| 15 | ENG-TOKEN-BINDING | **已迁** | 活——根层无对应 | 已落 `docs/core/design/ENG-TOKEN-BINDING.md` |
| 16 | ENGINEERING-MODE | **已迁** | 活——根层无对应（`AGENT-LOOP.md` §8.2 缺档登记）；= 工作流机制判据权威 | 已落 `docs/core/design/{ENGINEERING-MODE,BATCH-RECORD,DOC-DISCIPLINE,LEDGER}.md` |
| 17 | ESCALATE | **已迁** | 同名根档已建；CLI 侧独有面（TUI 接线 / relay 前缀 CLI 形 / 撞墙继续 CLI 通道）逐节对账并入 | 已并入 `docs/core/design/ESCALATE.md`（§5 / §6；(d) 类入 §8.1） |
| 18 | HASHLINE-EDIT | **已迁** | 同编辑族；现体 = 核 `thincoder-core/tools/file.mjs` | 已落 `docs/core/design/HASHLINE-EDIT.md` |
| 19 | INSERT-AFTER | **已迁** | 同编辑族；现体 = 核 `thincoder-core/tools/file.mjs` | 已落 `docs/core/design/INSERT-AFTER.md` |
| 20 | LEDGER-SELF-CONTAINED | **已迁** | 活——根层无对应（`WORKSPACE.md` §8.2 越段登记）；自持机制的唯一活载体 | 已落 `docs/core/design/LEDGER-SELF-CONTAINED.md` |
| 21 | LOGGING | 已清 | 对账：CLI §2.1–§2.5 ↔ 根层 §6.1–§6.4（未并面已登记） | 无动作 |
| 22 | MCP | 已清 | 对账：CLI §1–§9 ↔ 根层 §6.1–§6.9（文案级残余见 §4 注） | 无动作 |
| 23 | MEMORY | 已清 | 对账：CLI §1–§10 ↔ 根层 §6.1–§6.8（常量与 `uid` 切分逐句同） | 无动作 |
| 24 | MULTI-INSTANCE-COLLAB | **已迁** | 设计侧根层无档（需求侧同名根档已建）⇒ 纯新建 | 已落 `docs/core/design/MULTI-INSTANCE-COLLAB.md`（新建） |
| 25 | POOL-CONFIG-UNIFIED | **已迁** | 配置面机制已实装（`thincoder-core/config-defaults.mjs:46` 三键 4/4/4；双读取器 `subagent-async.mjs:94` / `advisor-async.mjs:168`） | 已并入 `docs/core/design/CONFIG.md` §6.1 |
| 26 | PORTABILITY | **已迁** | 活——可移植性机制现行且根层零覆盖（分类裁判单源 `thincoder-core/conventions.mjs` 等） | 已落 `docs/core/design/PORTABILITY.md`（择机制面重建） |
| 27 | PROMPT-SYSTEM | **已迁** | 未并入面（设计文档 → 代码落地流程 / 装配实现事实 / byte-identical 取消）已并入（设计侧）；分层 / 命名法 / 装配矩阵 = 需求侧 §4 | 已并入 `docs/core/design/PROMPT-SYSTEM.md` §6–§8 |
| 28 | PROVIDER | 已清 | 对账：CLI §1–§16 / §21 / §23 ↔ 根层 §6.1–§6.17 | 无动作 |
| 29 | PROXY | **已迁** | 活——根层无正文（`CONFIG.md` §8.2 越段登记）；**§TLS 段按实装**（默认全量校验 + `insecureTls` 显式放行，`thincoder-core/proxy.mjs:214`）；§web 消费面 = 逐次调用参数 | 已落 `docs/core/design/PROXY.md` |
| 30 | QUICKFIX-BATCH-3 | 历史 | 批档形态（需求→设计→用例→验收） | 不迁（就地留）；**F-3 / F-4 未落且无承载 ⇒ 须回写台账**（父侧） |
| 31 | RELEASE | **已迁** | 活 · **统一面**——核 + CLI / VSC / 桌面三端统一发布计划（单档承载 · 单主线）；设计 ∥ 需求不分离 ⇒ 落仓根 | 已落 `docs/RELEASE.md`（仓根层） |
| 32 | SEND-STALL-DISTILL | **已迁** | 同名根档已建；CLI 独有面（TUI 保存回调接线 / 退出 flush 有界等待）并入 | 已并入 `docs/core/design/SEND-STALL-DISTILL.md`（§2.3 / §2.6 / §3） |
| 33 | SESSION | 已清 | 对账：CLI §1–§14 ↔ 根层 §6.1–§6.14 | 无动作 |
| 34 | SETTINGS-TOOL | **已迁** | 设计侧根层无档（需求侧同名根档已建）⇒ 纯新建；null 形状表 / parseValue 去引号裁定按现行实装落笔 | 已落 `docs/core/design/SETTINGS-TOOL.md`（新建） |
| 35 | STRUCTURE-DEBT | **已迁** | 活 · **统一面**（横切总账 / 分批入口路由）——现行债入「现行债」节、已消解项入「已消解」节（防回潮） | 已落 `docs/core/design/STRUCTURE-DEBT.md` |
| 36 | SUBAGENT-ID-COUNTER-AGENT | 历史 | 机制已入核代码（`thincoder-core/agent-tools/subagent-scheduler.mjs`） | 不迁；取号公式句入 `docs/core/design/AGENT-LOOP.md` 子代理池节 |
| 37 | SUBAGENT-OBSERVE-SEND | 历史 | 契约正文已入 `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.7.2 | 不迁（就地留参照） |
| 38 | TESTING | **已迁** | 活——根层无对应（`CORE-UNIFICATION.md` 仅作跨树承载指针） | 已落 `docs/core/design/TESTING.md` |
| 39 | TOOL-OUTPUT-LIMITS | **已迁** | 活——根层无对应（`AGENT-LOOP.md` §6.16 显式外指「工具输出上限系（CLI 仓·设计）」）；常量与坐标 = `thincoder-cli/src/**` 实装面 | 已落 `docs/core/design/TOOL-OUTPUT-LIMITS.md` |
| 40 | TOOLS | 已清 | 对账：根层 §6.1–§6.10 ↔ CLI §1–§11（根层反多 `timer` 校验句） | 无动作 |
| 41 | TUI-INPUT-BOX | **已迁** | 活——根层无对应；CLI 专有面（输入框键契约）；**二态混装已收口** | 已落 `docs/cli/design/TUI-INPUT-BOX.md` |
| 42 | TUI-TOOL-OUTPUT | **已迁** | 活——根层无对应；CLI 专有面（行间区块）；VSC 工具卡非同机制 | 已落 `docs/cli/design/TUI-TOOL-OUTPUT.md` |
| 43 | TUI | **已迁** | 活——根层无对应；VSC 对位面 = webview 族（非同机制） | 已落 `docs/cli/design/{TUI,TUI-COMMANDS,TUI-SESSION-VIEW}.md` |
| 44 | TURN-CAP-CONTINUE | **已迁** | 同名根档已建；CLI 独有面（`runWithContinue` 骨架 / TUI 继续通道 / 消费链坐标 / D-19 族决策）并入 | 已并入 `docs/core/design/TURN-CAP-CONTINUE.md`（§1–§5） |
| 45 | TWO-REPO-MERGE | **已迁** | 活 · **统一面**（架构级机制档）——退役清单 / 仓根状态 / 完成判据 / phase 2 通道**描述现行仓形态** | 已落 `docs/core/design/TWO-REPO-MERGE.md` |
| 46 | VERIFY-REDESIGN | **已迁** | 活——根层无正文（`TOOLS.md` §6.7 verify 行 + D-V5 快路径仅契约要点）；契约 / guard / 双端坐标 = `VERIFY-REDESIGN.md` 契约面 | 已落 `docs/core/design/VERIFY-REDESIGN.md` |
| 47 | WRITE | **已迁** | 同编辑族（`TOOLS.md` §8.2 登记） | 已落 `docs/core/design/WRITE.md` |

### 2.2 需求档（`thincoder-cli/docs/requirements/` · 37）

| # | 档 | 判 | 依据（file:line） | 动作 / 落点 |
|---|---|---|---|---|
| 1 | ACP-CLIENT | **已迁** | 活——根层无对应；单端面（VSC 仓无 ACP 实现） | 已落 `docs/cli/requirements/ACP-CLIENT.md` |
| 2 | ADVISOR-CONVERGENCE | **已迁** | 条目未并入（F1–F17 / F27–F29 + N1–N11 / N19–N21）；VSC 端对位面（旧 §8 / §9 / §13）按 P2 不并 | 已落 `docs/core/requirements/ADVISOR-CONVERGENCE.md`（**新建**——与设计侧同名成对） |
| 3 | AGENT-LOOP | **已迁** | CLI 侧全并：B 轮条目面 + 两并入面（`SUBAGENT-OBSERVE-SEND` → §4.7 · `ASYNC-RESULT-CONTAINER` → §4.8）；4 个 VSC 面节维持 P2（归 VSC 轮） | 已并入 `docs/core/requirements/AGENT-LOOP.md` §4.7 / §4.8 |
| 4 | AGENT-PARAMS | **已迁** | 同名根档已建；逐节对账**零实质缺口**（FR1–FR3 / N1–N4 ⇒ F-AP1–F-AP4 / N-AP1–N-AP4 全覆） | 已并入 `docs/core/requirements/AGENT-PARAMS.md`（零新增正文；(d) 类入 §5.1） |
| 5 | ASYNC-RESULT-CONTAINER | **已迁** | 机制本体已入设计侧（现 `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.7.3）；条目并入需求侧 | 已并入 `docs/core/requirements/AGENT-LOOP.md` §4.8 |
| 6 | CHECKPOINT | 已清 | 对账：CLI §1–§4 ↔ 根层 §4.1–§4.3 | 无动作 |
| 7 | CONSULTATION | 已清 | 对账：CLI ↔ 根层 §4.1–§4.3 | 无动作 |
| 8 | CONTEXT-COMPACTION | 已清 | 对账：CLI ↔ 根层 §4.1–§4.2 | 无动作 |
| 9 | CRASH-REPORTS | **已迁** | 活——根层无对应；自述 VSC 端无此面 | 已落 `docs/cli/requirements/CRASH-REPORTS.md` |
| 10 | DESIGN-TOKEN-SETTLEMENT | **已迁** | 同名根档已建；逐节对账**零实质缺口**（R1–R4 ⇒ F-D1 / F-D4+F-D5 / N-D3 / N-D1） | 已并入 `docs/core/requirements/DESIGN-TOKEN-SETTLEMENT.md`（§4 对位句更新；(d) 类入 §6.1） |
| 11 | ENG-TOKEN-BINDING | **已迁** | 同名根档已建；编号承旧档零改号 | 已并入 `docs/core/requirements/ENG-TOKEN-BINDING.md`（(d) 类入 §5.1） |
| 12 | ENGINEERING-MODE | **已迁** | 活——根层无对应 | 已落 `docs/core/requirements/_archive/ENGINEERING-MODE.md` + `docs/core/requirements/_archive/ENGINEERING-MODE-MECHANISM.md` |
| 13 | ESCALATE | **已迁** | 逐节比对**零实质缺口**（全部要素已由 §1 / F-E1–F-E5 / §4 承载） | 已对账并入 `docs/core/requirements/ESCALATE.md`（零新增文本） |
| 14 | FEATURES | **已迁** | 活 · **CLI 面（P2）**——内容为 CLI 能力全览（含 TUI / slash 命令面） | 已落 `docs/cli/requirements/FEATURES.md` |
| 15 | LOGGING | 已清 | 对账：CLI ↔ 根层 §4.1–§4.3（1 处文本级降级 —— 见 §4 注） | 无动作 |
| 16 | MCP | 已清 | 对账：CLI §1–§4 ↔ 根层 §4.1–§4.4 | 无动作 |
| 17 | MEMORY | **已迁** | 整档条目面已并入（F1–F14 / F-M1–F-M3 + N1–N9 / N-M1–N-M3） | 已并入 `docs/core/requirements/MEMORY.md` §4 |
| 18 | MULTI-INSTANCE-COLLAB | **已迁** | 同名根档已建；F1–F5 / N1–N4 零缺口；旧档 §2 外部写感知（F6 / N5 / N6）= VSC 设置面板面（P2）不并 | 已并入 `docs/core/requirements/MULTI-INSTANCE-COLLAB.md`（P2 面登记 §5.2） |
| 19 | NORMAL-MODE | **已迁** | 同名根档已建；CLI 档与装配面**不同题**（普通模式产品行为需求）⇒ 全量并入为 §5–§6 | 已并入 `docs/core/requirements/NORMAL-MODE.md`（F1–F10 / N1–N10 / F-N1.1–F-N1.6） |
| 20 | PHILOSOPHY | **已迁** | 活 · **统一面**（三观 = 最高层需求） | 已落 `docs/core/requirements/PHILOSOPHY.md` |
| 21 | PORTABILITY | **已迁** | 同名根档已建；接受方向表 + FR14 落实文本并入 | 已并入 `docs/core/requirements/PORTABILITY.md`（§5；(d) 类入 §6.1） |
| 22 | PROJECT | **已迁** | 同名根档已建（其档头自注「迁入时对账合并」）；产品级定性面全量并入为 §5 | 已并入 `docs/core/requirements/PROJECT.md`（§5 对账合并——用户裁定②） |
| 23 | PROMPT-SYSTEM | **已迁** | 蓝图条目已并入（分层模型 / 命名法 / 内容大纲 / 编写纪律 15 条 / 装配逻辑 / 归属判定）；§8–§10 批面登记不并 | 已并入 `docs/core/requirements/PROMPT-SYSTEM.md` §4 |
| 24 | RELEASE | **已迁** | 活 · **统一面**（发布流程 = 跨产品板块主题）；设计 ∥ 需求不分离 ⇒ 单档 | 已落 `docs/RELEASE.md`（同 §2.1 :31 档） |
| 25 | SEND-STALL-DISTILL | **已迁** | 对账并入：N3 CLI 中止形态（退出 flush / Stop 不中止蒸馏） | 已并入 `docs/core/requirements/SEND-STALL-DISTILL.md`（余面现有正文已载） |
| 26 | SESSION | 已清 | 对账：CLI ↔ 根层 §4.1–§4.4 | 无动作 |
| 27 | SETTINGS-TOOL | **已迁** | 同名根档已建；缺口（F-ST7 值解析裁定 / 热应用细节 / 无静默判据 / 持久性边界 / CLI 边界族）并入；§4 错误边界行按双端实装 | 已并入 `docs/core/requirements/SETTINGS-TOOL.md`（§2–§4；(d) 类入 §5.1） |
| 28 | STRUCTURE-DEBT | **已迁** | 同名根档已建；逐节对账**零实质缺口**（F1–F4 / N1–N5 ⇒ F-SD1–F-SD4 / N-SD1–N-SD5）；旧 N5 双树口径 = 合并前措辞 | 已并入 `docs/core/requirements/STRUCTURE-DEBT.md` |
| 29 | SUBAGENT-OBSERVE-SEND | **已迁** | 条目并入（F1 / F2 + N1–N4）；契约正文已入设计侧（现 `AGENT-LOOP-SUBAGENT.md` §6.7.2） | 已并入 `docs/core/requirements/AGENT-LOOP.md` §4.7 |
| 30 | TESTING | **已迁** | 活——根层无对应 | 已落 `docs/core/requirements/TESTING.md` |
| 31 | TOOL-OUTPUT-LIMITS | **已迁** | 条目并入（FR1–FR6 / N1–N5） | 已并入 `docs/core/requirements/TOOLS.md` §4.5 |
| 32 | TOOLS | 已清 | 对账：CLI §1–§4 ↔ 根层 §4.1–§4.4 | 无动作 |
| 33 | TUI-TOOL-OUTPUT | **已迁** | 活——根层无对应；CLI 专有面 | 已落 `docs/cli/requirements/TUI-TOOL-OUTPUT.md` |
| 34 | TUI | **已迁** | 活——根层无对应；CLI 专有面；**设计侧五档 · 需求侧一档**（层归属不对称——双侧已互注） | 已落 `docs/cli/requirements/TUI.md` |
| 35 | TURN-CAP-CONTINUE | **已迁** | 对账并入：F7 跨段累计编号 + N6 零机制改动 | 已并入 `docs/core/requirements/TURN-CAP-CONTINUE.md` §2 / §3 |
| 36 | TWO-REPO-MERGE | **已迁** | 活 · **统一面**（同设计侧） | 已落 `docs/core/requirements/TWO-REPO-MERGE.md` |
| 37 | VERIFY-REDESIGN | **已迁** | 同名根档已建；**落点两读已经用户裁定 = 并入同名根档**；逐节对账**零实质缺口** | 已并入 `docs/core/requirements/VERIFY-REDESIGN.md`（零新增正文；(d) 类入 §5.1） |

## 3. 待核（**已清空**）

**去向**：判与落点见 §2.1 / §2.2 对应行的「判」与「动作 / 落点」列（本表不再另立——D2 单一权威源）。
**统一面档登记**：`RELEASE` = **单档** `docs/RELEASE.md`（仓根层 · 核 + 三端统一发布计划）——**不分 design / requirements 两层**，故不计入 R2 / R3 同名面。

## 4. 对账：已并入的 11 板块

| # | 板块 | 设计侧 | 需求侧 |
|---|---|---|---|
| 1 | AGENT-LOOP | **已迁**（对象锚 → 子档 §6.18 / 铁律 → §6.19 / 轻量审计 → §6.17 / byte-identical → 提示词板 §6.4；飞刀 → `ESCALATE.md`） | **已迁**（CLI 侧全并；4 个 VSC 面节维持 P2） |
| 2 | MEMORY | 已清 | **已迁**（整档条目面并入 §4） |
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
| **已迁**（已入根层） | 34 | 30 | **64** |
| 已清 | 9 | 7 | **16** |
| 尚有未并 | 0 | 0 | **0** |
| 历史（不迁） | 4 | 0 | **4** |
| 待核 | 0 | 0 | **0** |
| 后续批 | 0 | 0 | **0** |
| **总** | **47** | **37** | **84** |

**闭合校验**：设计 34+9+0+4+0+0 = 47 ✓ · 需求 30+7+0+0+0+0 = 37 ✓ · 合计 64+16+0+4+0+0 = 84 ✓（= §1 实点；与 `DOC-SYSTEM.md` §5.2 计数口径一致）。
**「已迁」口径**：= **已迁入根层的活档合计**——本栏随迁移推进**单调递增、不重置**。

## 9. 迁移收尾（收口口径与未落尾巴落点——两迁移轮共用）

### 9.1 收口段口径（两档共用）

- **口径** = 「已吸收 + 尾巴移交批 11」；正文不回改；尾巴零丢项（逐条 = 已消 / 指向批 11 / 指向后继）。
- §3：免设独立轮——一行「原轮无独立设计评审；评审面并入批 11 §3」（执笔 = 批 11 评审实例；缺则父侧代写并打标）。
- §4 / §5：各一行——§4「收口裁定 = 批 11 设计 §9 + 用户批准见批 11 §4」（主 agent）；§5「实施主体已载于本档 §2 各轮；收口轮无新增实施」（父侧）。
- §6：**收口判词**（口径句 + 三机检读数行 + 尾巴指针表）+ 状态行「已收口 2026-09-16」+ 冻结（L4）（父侧）。
- **判不出 4 条处置（CLI 3 + VSC 1）**：身份源 = 盘查表；落档后逐条对齐「并入本节尾巴（组数 +N，D3 同步）」或「显式裁出（附理由）」，不猜补；收口判词按「已吸收 + 尾巴移交（12 组）」先行。
- **称谓注**：本档「父侧」= 批 11 批次档「主 agent」——同一执行主体，两称互注、不逐处改写。
- 判据：两档 §6 非空 + 状态行含「已收口」。

### 9.2 方案选型（决策点）

| # | 决策点 | 选定 | 理由 |
|---|---|---|---|
| 1 | 设计宿主 | 本档 §9 | 已有则更新（本档 = 迁移后续天然前身） |
| 2 | 收口段落点 | 两档就地带 §6 | 合 L4 冻结姿态 |
| 3 | A20 落点 | 基准层补写（`DOC-DISCIPLINE.md` §4.2.7 追加条） | 现行值无家 |
| 4 | phase-2 终态 | 在途 + 唯一差项 | S3 退出五项未齐；可机判 |
| 5 | B24 承接面 | 本节 | 口径级承接（族内列报·不入闸；树只读）+ 触发 = 条件（树退役 ⇒ 撤族） |

### 9.3 尾巴十二条落点表（CLI 7 + VSC 5 · **权威表**——批 11 §2 两表 = 摘要视图，不一致以本表为准）

| # | 条 | 处置 | 落点 | 触发 / 到期 |
|---|---|---|---|---|
| A10 | 设计面欠账收正轮 | 复核成立 + 登记；不自行开轮 | 两档 §6 一行 + `docs/TODO.md`（父侧 = 主 agent） | 归批（下一设计面批）；轮开工后销 |
| A20 | AC/T-V5-16「三元素」⇏ 九元素 | 基准层补写；只读面不回改 | `DOC-DISCIPLINE.md` §4.2.7 追加条 + 两档 §6 一行 | 本节闭环；射程脆性 = 测试断言仍为逐字快照（A23 面） |
| A21 | 地图未登 `core/design` 差集 | 补登 + 计数收正（D3） | `docs/README.md` §4（补登块 `:65` 起 + 计数核对 `:70`） | 本节闭环；复跑 = **双向等式**（实档数 = 地图数） |
| A22 | VSC 全量 1 例红（T-DC6②） | 归属裁 = 测试侧（非文档侧） | 两档 §6 读数行 + `docs/TODO.md`（登记）+ 本 §9 | 归批（测试）；转绿后销 |
| A23 | 域关系守卫仍住 `slow()` | 登记（测试；补入单入口属 5 行断言外——原待父侧点头） | 两档 §6 一行 + `TODO.md` | 归批（测试）；守卫随单入口可跑（`slow` 纯别名）后销 |
| A24 | VSC 档旧读数与折行注并置 | 变注（零改写只增行）+ 结案行 | VSC 档 `:115` 后一行（执笔 = 主 agent 裁）+ 该档 §6 | 本节闭环 |
| A27 | 「一致面 ⇄ 语义面」裁决缺失 | 请主 agent 裁决（收正成立 / 打回 revert） | 批 11 §6 + 两档 §6 一行 | 主 agent 裁决；销 or revert 后结 |
| B17–B20 | 收口段面四项 | 按 §9.1 统一处置（零丢项） | VSC 档 §6 | 本节闭环；B17/B18/B20 身份对齐见 §9.8⑤ |
| B21 | 源档与现状冲突（语义面） | 请父侧确认活档口径 = 以现状为准（只读不回改） | VSC 档 §6 一行 | 确认后闭环 |
| B24 | 「产品树降格」不存在 · 68 处承接 | 裁 = 本节口径承接（族内列报·不入闸） | VSC 档 §6 一行 + 本 §9 | 条件（树退役 ⇒ 撤族/再处） |
| B19 | 超宽 3 行 | 已消 | VSC 档 §6 一行「已消」 | 闭环 |
| G9 | 引擎声明面 schema 跨档不可验 | 明标出射程（登记，不做伪校验） | 本 §9 + 判据登记 | 条件（若立声明面校验器再覆盖） |

### 9.4 phase-2 改判（G1–G7 · G9–G10 处置）

判据源 = `CORE-UNIFICATION.md:411-412`（S3 进入 / 退出五项）+ `BATCH-RECORD.md:157`（L4）。**已知**：S3 进入条件已达（CLI 待迁 0 · VSC 已收口形态）；S3 无载体档。

- **终态 = 维持在途**。唯一剩余差项 = **「S3 退出之一『三机检 exit 0』未达」**（可机判 · 逐项归属：锚 = 族实装面 / 在飞面 · 宽度 = 在飞 / 他作者面 · 台账 = 台账面 · 一致性 V1–V3 = 在飞面）：
- G1：显式裁为**并入本节**（载体 = 批 11 条目 4）；S3 后续开工另起新轮（L1）。G3/G4：G3 归上差项；G4 = 族实装面验收口径（归实装侧 `scripts/doc-check-anchors.mjs`）。
- G5：落点 = `CORE-UNIFICATION.md` 对外契约节（S3 开工核验面），本节登记落点即毕。G6/G7：逐条身份以盘查表为准（§9.8⑤），落点 = `TODO.md` + 对应判据档。
- G2/G10：**编号同名、语义待并**（`VERIFY-REDESIGN.md:100/:116` 的「G10 双端同」与盘查 G10 是否同源未证）——登记待并，不得误并。

### 9.5 验收标准（回指批 11 §1 条目 1–4 · 全部可机判）

| AC | 回指 | 判据 | 复跑 |
|---|---|---|---|
| AC-1 | 条目 1 | 两档 §6 非空 + 状态行「已收口 2026-09-16」+ 尾巴指针计 = 12（= 条目分组数；谓词与逐档期望数见下注） | 逐档按指针行 pattern（含「→ 批 11 §9.3」）计数：CLI 7 / VSC 5 |
| AC-2 | 条目 2 / 3 | 尾巴表 12 行（= 条目分组数，见 AC-1） = §1 枚举（7 + 5）；每行含落点与触发 / 到期 | 表行计数 |
| AC-3 | 条目 4 | 终态行在位 + 单一差项句可机判：三腿读数齐 + 逐项归属（锚 = 族实装面；宽度 = 在飞 / 他作者面；台账 = 台账面）+ 与 §9.4 逐字对齐 | 三命令复跑对读（锚默认双腿：根层域 exit 1 · 参照面腿 0）；终态行落点 = §9.4 + `docs/TODO.md`（行样见下注） |
| AC-4 | 验收④ | 新增 = 0（宽度 / V1–V3 / 锚——基线 / 限域 / 处置见下注） | 三机检命令（见批 11 §2；宽度 = `scripts/doc-check-width.mjs`） |
| AC-5 | 验收⑤ | 「193/37」= 两参照树悬空读数（CLI 37 / VSC 193）；现态 = 两树悬空 **0/0**（族豁免列报） | 强扫复跑（`--engine v5`）+ 两档 §6 读数行（回指本行全量证据行） |

**AC 补充注**：
- **AC-1 谓词**：指针行样式 = 含「→ 批 11 §9.3」；逐档期望计数 = CLI 7 / VSC 5，合计 12 = **条目分组数**（唯一 ID = 14——B19 两个子项）；计数命令 = 逐档按该 pattern 计数；阈值随 §9.8⑤ 身份对齐按 D3 同步。
- **AC-3 终态行样**：`phase 2：核心统一 = 在途（差项 = 「S3 退出之一『三机检 exit 0』未达」——见 DOC-MIGRATION.md §9.4）`——落 `docs/TODO.md`（主 agent）。
- **AC-4 限域**：宽度 = `scripts/doc-check-width.mjs` 之 `SCAN_DIRS`（`docs/{design,requirements,batches,core/design,core/requirements}`；表格行豁免）；V1–V3 = 同域全档；锚 = 根层八目录 + 参照面；根文件（`docs/TODO*.md`）超宽行不在闸域。
- **AC-4 处置**：他作者 / 在飞面 = 逐档归其作者 / 父侧机械折行；本档段面 = 归段作者。

### 9.6 用例表（文档批口径 = 结构机检）

| 用例 | 输入 | 期望输出 |
|---|---|---|
| 正常 · 收口段 | 两档 §6 落笔后 | 判词 + 12 指针 + 状态行在位；计数 = 12 |
| 边界 · 已消行 | B19 / A22 行 | 「已消 / 读数 0」形态在位，无悬空指针 |
| 错误 · 丢项 | 任一尾巴无落点 | 计数 ≠ 12 ⇒ 红（收口不得落笔） |

### 9.7 边界（本设计不做）

不碰源码 / 测试（5 行逐字快照 = 测试批）；不碰台账（`TODO.md` = 主 agent）；不碰提示词；不碰参照历史面正文（`thincoder-cli/docs/**` · `thincoder-vscode/docs/**` = 只读）；不改已收口正文；不夹带新语义。

### 9.8 未决 / open

① A24 变注执笔（父侧 / designer——主 agent 裁）② A27 三条裁决 ③ B21 活档口径确认（建议 = 以现状为准）④ G1 载体裁量复核（并入本节 vs 另立 S3 档）⑤ 盘查表未落档：B17 / B18 / B20 与 G2 / G6 / G7、『判不出』4 条（CLI 3 + VSC 1——处置句见 §9.1）逐条身份缺载体——执行前由主 agent 补入或裁出（不得猜补）。

## 10. v1 文档退役 · 归档形执行方案

形态 / 四条判据 / 四条前提 / 执行窗口承 `docs/vsc/design/VSC-MIGRATION.md` §2.5。
本设计交付**可执行方案**（逐树清单 §10.3 · 引用面处置 §10.4 · 执行步骤 §10.5 · 验收 §10.6）；**执行由父侧在用户点火窗口内发起**——设计交付 ≠ 执行。

### 10.1 方案与理由（落点 = 单归档根；活跃面入、既有归档原地）

| # | 候选（落点形态） | 取舍 | 结论 |
|---|---|---|---|
| 1 | **活跃面 → `docs/_archive/<原相对路径>`**；既有 `<层>/_archive/**` **原地不动** | 结构恒等（**树内**相对引用按构造仍成立）· 单一归档根 | **选定** |

### 10.2 落点规则与接口契约（机检可核）

| 项 | 规则 |
|---|---|
| **迁移集** | `thincoder-{vscode,cli}/docs/**` 全量 `.md` ∧ 路径不含 `_archive` 段——**136 / 142 档**（两树均无 `.md` 外的杂项档） |
| **目标路径** | `thincoder-{vscode,cli}/docs/_archive/<原 docs/ 相对路径>`——**恒等映射**（结构 / 档名 / 正文全保持） |
| **迁移动作** | `git mv`（纯 rename）——**参照历史树内容一字不改**（零字节 diff；正文行数与内容均不变） |
| **零改面** | 既有归档（VSC `design/_archive/` **17 档** · CLI `design/_archive/` **50 档**）原地不动；两产品树其余非 `docs/` 面零触碰 |
| **发布面** | CLI `thincoder-cli/package.json:25`（`files` = `bin/` · `src/` · `README.md` · `CHANGELOG.md` · `LICENSE`）不含 `docs/` ✓ · VSC `.vscodeignore` 含 `docs/**` ✓ ⇒ **打包零影响**（零改两文件） |
| **机检声明面** | **零改**（`PROJECT-MANIFEST.json:24-38`）：`scanDirs` = `docs` · `anchors.domain` = `docs` · `anchors.exclude` 已含 `_archive` · `lineWidth` = 300 · `exemptions` 空。两产品树本不在源域（§2.5 前提 3）；`_archive` 亦已在 `SKIP_DIRS`（`scripts/doc-check-anchors.mjs:53`）⇒ 迁入即出机检域 |

### 10.3 逐树清单（源目录 → 目标目录；右列档名 = 逐档清单）

`<前缀>` = `thincoder-vscode/docs/`（VSC）∥ `thincoder-cli/docs/`（CLI）；**逐档目标路径 = `_archive/` + 原相对路径 + 原档名**（恒等，由本表唯一确定）。

| 树 | 源目录 | 目标目录 | 档数 | 行数 |
|---|---|---|---|---|
| VSC | `batches/` | `_archive/batches/` | 34 | 8,443 |
| VSC | `design/` | `_archive/design/` | 50 | 13,458 |
| VSC | `design/` 下的提示词档 | `_archive/` 下的提示词档 | 15 | 1,026 |
| VSC | `requirements/` | `_archive/requirements/` | 34 | 2,232 |
| VSC | `docs/` 根（`README.md` · `thincoder-vscode/docs/_archive/CAPABILITY_GAP.md` · `thincoder-vscode/docs/_archive/COMPETITIVE_ANALYSIS.md`） | `_archive/`（同名） | 3 | 625 |
| VSC | **小计** | —— | **136** | **25,784** |
| CLI | `batches/` | `_archive/batches/` | 41 | 17,744 |
| CLI | `design/` | `_archive/design/` | 47 | 19,851 |
| CLI | `design/` 下的提示词档 | `_archive/` 下的提示词档 | 15 | 1,012 |
| CLI | `requirements/` | `_archive/requirements/` | 37 | 4,350 |
| CLI | `guides/` | `_archive/guides/` | 1 | 72 |
| CLI | `docs/` 根（`README.md`） | `_archive/`（同名） | 1 | 257 |
| CLI | **小计** | —— | **142** | **43,286** |

- **逐档名单（源档 → 目标档）**：本档只留规则与计数（D2 单一权威源）。
- **清单机核**（复跑命令 · 期望输出见 §10.6 AC-1）：
  `node -e "const fs=require('fs');for(const t of ['thincoder-vscode','thincoder-cli']){let a=0,r=0;const w=d=>{for(const n of fs.readdirSync(d)){const p=d+'/'+n;fs.statSync(p).isDirectory()?w(p):(/\/_archive\//.test(p)?r++:a++)}};w(t+'/docs');console.log(t,a,r)}"`

**phase-1 三档处置（open ③ **已结清：暂留原地 · 生效读数 139 / 50** · 父侧裁定）**：CLI 树清单原含 phase-1 三档（批次档 · `design/TWO-REPO-MERGE.md` · `requirements/TWO-REPO-MERGE.md`）——依 `docs/README.md` §3 现行政策「**暂留原地**」⇒ **不含**（原地不动；改期 = 两仓合并 phase 1 完成后另议）：

- **迁移集口径**：三档自**迁移集**剔除 ⇒ 迁移集 = **139 档**（142 − 3）；归档后 CLI 侧 = 活面 3 档 · 归档面 50 + 139 = 189；
- 原「迁」分支不取（政策未变；如改期另裁）。

**清单计数口径**：**迁移集 = 136 / 139**（三档留原地 ⇒ 自迁移集剔除；142 / 50 = 读数口径）；**机核读数 = S0 `136 17` / `142 50` ⇒ S7 `0 153` / `3 189`**；与逐名清单同源（D2）。

### 10.4 引用面核（迁后转悬空 **52 引用**（= 50 行） · 逐族处置）

**口径**：源域 = 仓根 `docs/**` 扣 `_archive/` 与 `batches/`；读数 = **沙箱实跑引擎**逐行差集。**单位**：引用 = 行内退役树引用条数（同行 2 条计 2）；**52 引用 = 50 行**（差 2 = `AGENT-LOOP.md:43`/`:224` 双引用行）。**分量**（按引用档所在域逐档求和）：`docs/core/**` **37**（行 35）· `docs/vsc/**` **15**（行 15）——全在闸态。

**残类口径（引擎未报红的域内前缀行——登记 · 非本节射程）**：本节改指射程 = **仅引擎红色差集 52 引用**（族 A/B/C）。
域内（源域同前）**含退役树前缀而不报红**的行（判据 = 逐行含 `thincoder-{vscode,cli}/docs` 子串；先例 = `docs/vsc/design/VSC-MIGRATION.md` §1.4 归档形态现状）**零动作 + 列报为已知遗留**：

| 面 | 复跑命令（命令 A） |
|---|---|
| 域内退役树前缀行 | `node -e "const fs=require('fs');let n=0;const w=d=>{for(const x of fs.readdirSync(d)){const p=d+'/'+x;if(fs.statSync(p).isDirectory()){if(!/_archive$/.test(x))w(p)}else if(p.endsWith('.md'))for(const l of fs.readFileSync(p,'utf8').split('\n'))if(/thincoder-(vscode|cli)\/docs/.test(l))n++}};w('docs');console.log(n)"`（工具 = `node -e` 内联·同格命令；射程 = 源域 `docs/**` 扣 `_archive`-尾目录与批次目录） |

- **到期条件 = 命令 A 读数回 0**（残类被清扫完毕 ⇒ 本登记销项）。
- **引-D（`docs/TODO*.md`）· 引-E（口径外）** 另有各族处置行（本段不重复——D2）；残类**不进 52 引用射程** = 不改不登逐行。

| 族 | 判据句 | 引用 | 处置 |
|---|---|---|---|
| **引-A 史实指针** | 引用对象 = 被退役档**本身**：行含出处 / 来源 / 「自 … 并入 / 切出」/ 变更记录 / 迁移台账清单 / 引用面自述「参照历史」 | **44** | **改指归档形全路径**（`thincoder-{vscode,cli}/docs/_archive/<原相对路径>`）——**措辞零改**（D4 指针纪律：形态更新，非内容改写） |
| **引-B 现态断言** | 行对 v1 档作**现行效力**断言（「相邻权威」/「判据权威」/「条款住址」等现态语）⇒ 该断言随退役失效 | **4** | **改指 canonical 活档**（`docs/core/**` 同话题档）∥ 无同话题活档者 ⇒ 归档形改指 + 行内**退场注记**（语义句，非引擎标记族） |
| **引-C 旧形态消歧** | anchor = 迁移前根形态 `docs/design/<X>.md`（无树前缀、本仓任何形态下均不存在） | **4** | 改指归档形**全路径**（按对象所属树补前缀），不得保留歧义形态 |
| **引-D 台账面** | `docs/TODO.md` · `docs/TODO-archive.md` 内的同类引用（迁后同转悬空） | （≈58 行，口径外） | **零动作**——两档 = 退役历史台账（`docs/README.md` §1），且**不入机检源域**（`scripts/doc-check-targets.mjs:17` `LEDGER_NAMES` 档名判）⇒ 不产闸面红；笔权 = 主 agent |
| **引-E 口径外引用** | 仓根 `README.md`（5 行 · product-text 面）· 两产品 `AGENTS.md` / `src` / `webview` 注释 · 产品 `test/**` 头注（合计 **35 行 / 20 档**） | 35 行 | **零动作 + 登记**（不在 §2.5 引用面口径；笔权与处置归父侧；产品 `test/**` 头注为注释非断言，零断裂） |

- **逐族明细（= 执行轮改指清单 · `file:line` 逐条）**：族 A/C 的 **48 引用** = 下列 **19 档**。
- **坐标注**：下列 `file:line` = 迁移执行前定位；两树退役闭合后所指引用已改指归档形（`thincoder-{vscode,cli}/docs/_archive/**`）或随档收正 ⇒ **现盘行号不再对应**。
- **7 处越界**：`AGENT-PARAMS.md:138` ∥ `CORE-UNIFICATION.md:1656` ∥ `I18N.md:75` ∥ `SEND-STALL-DISTILL.md:114/:147` ∥ `TOOL-OUTPUT-LIMITS.md:160` ∥ `docs/vsc/design/VSC-MIGRATION.md:126`；现行状态 = `docs/README.md` §2。
- **逐档坐标清单头（族 A/C 19 档）**：
  - 核设计档一：`docs/core/design/AGENT-PARAMS.md:85/:138` · `BATCH-RECORD.md:284` · `CONFIG.md:91/:96/:138/:146` · `CONSULTATION.md:99` · `CORE-UNIFICATION.md:567/:603/:1656`
  - 核设计档二：`DOC-CODE-RECONCILE.md:134` · `DOC-DISCIPLINE.md:505/:902` · `DOC-SYSTEM.md:22` · `ENG-TOKEN-BINDING.md:173` · `I18N.md:75` · `LEDGER.md:187`
  - 核设计档三与核需求档：`PORTABILITY.md:5/:148` · `SEND-STALL-DISTILL.md:8/:114/:147` · `TOOL-OUTPUT-LIMITS.md:104/:160` · `docs/core/requirements/AGENT-LOOP.md:43×2/:127/:142/:224×2`
  - 其余：`NORMAL-MODE.md:129` · `TWO-REPO-MERGE.md:65` · `docs/vsc/design/VSC-MIGRATION.md:126`。
族 B 的 **4 引用** = `docs/core/design/DOC-SYSTEM.md:279` · `ENG-TOKEN-BINDING.md:5/:85` · `docs/core/requirements/TWO-REPO-MERGE.md:53`。

**禁出路**：**不得**以行级标记豁免代处置——引用**迁后在位**（可解析 ⇒ 无悬空可列报）；处置 = **改指**（路径可解析、零标记）。

### 10.5 执行步骤（逐步可核验 · **一树一轮一提交**——S0–S7 按树参数化）

**轮次结构**：本方案**按树切两轮**——每轮独立走 S0–S7 并**各自提交**（提交 = **该轮树迁移 + 该轮引用份额 + 该轮测试 / 文档改笔**）；§2.5 前提 2 的批量估算按轮**减半**（每轮实际改笔 = 该轮份额）。

- **轮 A（VSC 树）**：`thincoder-vscode/docs/**` 迁移（136 档）+ 该轮份额（被引对象 = VSC 树者）+ 文档改笔（含**共享档**）。
- **轮 B（CLI 树）**：`thincoder-cli/docs/**` 迁移（**139 档**——phase-1 三档按 §10.3「已结清」块留原地）+ 该轮份额（被引对象 = CLI 树者）+ 文档改笔。

**份额切分（52 引用 · 单位与 §10.4 同）**：规则 = 按**被引对象所属树**归属（引-A / 引-C 按对象归档位 · 引-B 按对象树）；**轮 A / 轮 B 各自的份额数在 S3 按 §10.4 逐族明细逐行判定并记账**（同一行双引用而分属两树者 ⇒ 该行两轮各改一处；**两轮合计 = 52 引用** = 判据）。
**共享改笔**：`docs/README.md`（首部层级定位 + §2 政策行）落**轮 A 一次改毕**（两树同句）——轮 B 只核不发笔。

| # | 步骤（逐轮 · `<树>` = 该轮树 · `<份额>` = 该轮引用份额） | 判据 / 读数 |
|---|---|---|
| S0 | **前置读数**：`node scripts/doc-check.mjs --root .`（记 `汇总` 行）；`git status --porcelain`（记在途面）；**越树相对锚枚举**（§10.7 用例） | 基线锚悬空数入册；**在途文档债未收口 ⇒ 不点火**（§2.5 执行窗口条件）；相对锚非 0 ⇒ 登记为已知遗留 |
| S1 | **建归档根（`<树>`）**：`mkdir <树>/docs/_archive/` 含子目录 `design/`（其下 **`prompts/`**）· `requirements/` · `batches/`（**两树皆需**）· `guides/`（CLI 专有） | 目录在位 |
| S2 | **迁移**（`git mv`，**逐档**）：按 §10.3 清单把**该轮树** 136 ∥ 142 档移入 `_archive/` + 原相对路径；**既有 `<层>/_archive/**` 不动** | `git status` 全为 `R`（rename）；`git diff --stat` = **零内容行**（纯 rename）；该轮树 `docs/` 下除 `_archive/` 与既有 `design/_archive/` 外为空 |
| S3 | **引用改写（`<份额>`）**：按 §10.4 族 A/B/C 逐行处置该轮份额（族 A/C 路径改指 · 族 B 改指 canonical / 退场注记）；轮 A + 轮 B 合计 = 52 引用 | 改后 52 行全部可解析；**新增悬空 = 0** |
| S4 | **测试处置**（§2.5 前提 2；前置枚举 = **三包** `test/**`（VSC / CLI / core）检索退役树前缀）：① VSC 镜像锚对位单测档（153 行 · 结构不变 · **3–4 处**——档内同串全量替换 + 逐处复核：镜像路径字面同串 ×2–3 + 扫描根 ×1）——③ 镜像源改指 `_archive/` 下的提示词档目录 · ⑤ 扫描根改指 `docs/_archive/`（判据不变、**不得静默空扫描**）；② CLI 双源对位单测档（122 行 · 结构不变 · 1 处路径常量 + 2 处断言坐标）——两处断言读 CLI 镜像档 ⇒ **同族改指**（轮 B · 判据不变）；③ 枚举余项 = 注释类（出处注 / 内部注——非断言、不读树）⇒ 引-E 登记 · 零动作 | 逐档**非空扫描判定**（改指后扫描根非空：15 档集合 / 存在性 / 头注格式断言在位）；`node --test <两档>` 逐档 pass（① 3 用例 ③/⑤/⑨-3）；AC-5 差值式全量兜底 |
| S5 | **声明面核**：`PROJECT-MANIFEST.json` `checkConfig` **零改**（§10.2 行 6）；`npm run doc:check`（VSC 包内 = `node ../scripts/doc-check.mjs --root ..` 口径）与仓根同读数 | 逐键对读 = 基线；包内读数 = 仓根读数 |
| S6 | **文档收正**（同笔）：① `docs/README.md` 首部层级定位 + §2 政策行——产品 `docs/**` 状态「迁移期参照历史」→「**v1 参照历史（已归档 `_archive/`）**」；② `docs/vsc/design/VSC-MIGRATION.md` §2.4 降格声明 + §2.5 加**执行注**（本方案 = 本档 §10 · 执行窗口 = 用户点火）；③ 两档变更记录各一行 | 三处落笔在位；引用面无悬空 |
| S7 | **终态读数 + 提交（逐轮）**：复跑 `node scripts/doc-check.mjs --root .`；`git commit`（**该轮**：迁移 + 该轮份额 + 该轮测试 / 文档改笔） | 见 §10.6 AC-4/AC-5；AC-1 的 `R` 对断言按轮读数（轮 A 136 / 两轮合计 **275** = 136 + 139） |

### 10.6 验收标准（回指 VSC-MIGRATION §2.5 判据 · 全部可机判）

| AC | 回指 | 判据 | 复跑 |
|---|---|---|---|
| AC-1 清单闭合 | §2.5 判据 3 | 迁移集 = **136 / 139**（CLI 已剔 phase-1 三档——§10.3「已结清」块）· 既有归档 **17 / 50** 原地在位 · 归档后 **VSC** `docs/` 下仅 `_archive/` + 既有 `design/_archive/`；**CLI 侧例外**（三档留原地）：`docs/` 下 = `_archive/` + 既有 `design/_archive/` + `batches/` / `design/` / `requirements/` **三目录各 1 档**（`TWO-REPO-MERGE.md`）· **映射恒等**（每个 `R` 对目标 == 源档树内 `docs/` 相对路径加 `_archive/` 前缀） | §10.3 机核命令——**S0 基线**（迁移前·实读磁盘）：`thincoder-vscode 136 17` / `thincoder-cli 142 50`（CLI 读数含留原地三档——**迁移集 = 139**）；**S7 终态**（迁移后）：`thincoder-vscode 0 153` / `thincoder-cli 3 189`（`153 = 136 + 17` · `189 = 50 + 139`）；＋ **`R` 对断言**（AC 补充注 ①） |
| AC-2 一字不改 | §2.5 判据 2（参照历史保留语义） | `git diff --stat -M` = 纯 rename（零 `+`/`-` 内容行）；逐档行数不变（25,784 / 43,286） | `git show --stat --find-renames` |
| AC-3 引用面闭合 | §2.5 影响面表 | §10.4 **52 引用**（= 50 行）**全部可解析**（改指归档形 / canonical）；**零新增标记** | `node scripts/doc-check.mjs --root .` 逐行核 |
| AC-4 零新增 | 验收 ⑤ | 终态 `汇总` 悬空 = **S0 基线值**（新增 **0**）· 行宽不增（差值式——**读数标与漂移说明 = AC 补充注 ②**） | 前后两次 `node scripts/doc-check.mjs --root .` 对读 |
| AC-5 测试 | §2.5 前提 2 | **差值式**：终态集成测试结果 vs **S0 基线** ⇒ **无新增失败**（绝对全绿不作判据——**既有红以 S0 基线为准，不假定具体档**）；**③/⑤ 重定宿主两例列必过项**（VSC 镜像锚对位档的 ③ 镜像源 / ⑤ 扫描根）+ 轮 B 同族例（CLI 双源对位档） | S0 / S7 两次 `npm test` 对读（VSC 包；CLI 包随轮 B）+ 逐档 `node --test` |
| AC-6 发布面 | §10.2 行 5 | CLI `package.json` / VSC `.vscodeignore` **零改**（`git status` 不含两文件） | `git status --porcelain` |
| AC-7 声明面 | §10.2 行 6 | `checkConfig` 五键（= 声明面五项——`§10.2` 行 6）**零改**（**D3**：键清单 = 列表长度） | `git diff PROJECT-MANIFEST.json` 空 |

**AC 补充注**：

| 注 | 内容 |
|---|---|
| ① AC-1 `R` 对断言（映射恒等机核） | 命令 = `node -e "const{execSync}=require('child_process');const R=execSync('git diff --name-status -M',{encoding:'utf8'}).trim().split('\n').filter(l=>l.startsWith('R')).map(l=>l.split(/\s+/));console.log('R 对',R.length,'错配',R.filter(p=>p[1].indexOf('/docs/')<0||p[2]!==p[1].slice(0,p[1].indexOf('/docs/'))+'/docs/_archive/'+p[1].slice(p[1].indexOf('/docs/')+6)).length)"`——期望 `R 对 275 错配 0`（轮 A 后 = 136 / 两轮合计 = **275** = 136 + 139——三档留原地不入迁移集）；非零 ⇒ 红（防「移进错误子目录」型全过：计数不变 ∧ 纯 rename ∧ 源树为空三判据同过）。已 staged 时该命令加 `--cached` |
| ② AC-4 读数标与漂移 | 读数标记 = **工具**（`scripts/doc-check.mjs` 锚检查悬空 / `scripts/doc-check-width.mjs` 行宽）· **射程**（`checkConfig.scanDirs` = `docs`——两产品树不在域）；同批各处读数不一致 = **他笔在飞面漂移** ⇒ 判据 = **差值式**，逐次以 S0 复跑为基线，不与他次读数比大小 |
| ③ AC-5 测试全集 | 枚举口径 = **三包** `test/**`（VSC / CLI / core）逐行检索退役树前缀（§10.5 S4）；命中 = **读取类两档** + **注释类余项** |

### 10.7 用例表（文档批口径 = 结构机检）

| 用例 | 输入 | 期望输出 |
|---|---|---|
| 正常 · 迁移 | S2 逐档 `git mv` 后 | `git status` 全 `R`；归档树结构 = 原结构（§10.3 表逐目录对位） |
| 边界 · 既有归档 | 指向 `thincoder-cli/docs/design/_archive/ARCHITECTURE-v2.md` 的 5 行（`ARCHITECTURE.md:27` 等） | 仍可解析（既有归档原地）⇒ 不产新悬空 |
| 边界 · 同名集合 | `_archive/` 下的提示词档 15 档（两树同名） | 迁后 ③ 断言（核包 15 ↔ 归档镜像 15 同名集合相等）仍成立 |
| 错误 · 漏迁 | 迁移集少 N 档 | AC-1 机核读数 ≠ 136 / 139（S0 `136 17` / `142 50` ⇒ S7 `0 153` / `3 189`）⇒ 红 |
| 错误 · 触既有归档 | 既有 `_archive/**` 被移动 / 改动 | AC-1 ＋ AC-2 双红 |
| 错误 · 标记出路 | 52 引用改用行级标记豁免结案 | AC-3 红（引用须可解析——改指为正解） |
| 前置枚举 · 越树相对锚 | S0 对两树 `docs/**`（非 `_archive`）的 `.md` 扫描**相对锚**——markdown 链接 `](…)` 解析结果**出该树 `docs/`** 者（含指向产品代码 / 邻树 / 仓根的写法） | 实扫 = **0 处**（VSC 0 · CLI 0；口径 = `.md` 链接形态，反引号内路径串不入扫描）；复跑 0 处 ⇒ 过；**非 0 ⇒ 逐条登记为已知遗留**（迁后失效、正文一字不改 ⇒ 不改指、不入闸） |

### 10.8 边界（本设计不做）

**不执行**（执行窗口 = 用户点火 · 父侧发起）。

- **不碰既有内容**：不碰 `_archive/**` 既有内容；不碰两产品树 `docs/` 外任何面（`AGENTS.md` / `src` / `webview` / `test` 头注 = 引-E 登记）。
- **不碰他笔面**：不碰台账两档（`docs/TODO.md` · `TODO-archive.md` = 主 agent 笔）；不碰需求档（父侧笔）；不碰提示词面（`thincoder-core/prompts/**` 为对象外）。
- **不改声明面**：不碰 `checkConfig` / `SKIP_DIRS`（声明面零改）；不改 `_archive` 内文本（含既有归档与迁入档）；不夹带新语义（族 B 的 4 行例外仅 = 现态断言失效的处置）。
- **不改产品树正文**：含**树内越树相对锚**（§10.7 前置枚举）与域内含退役树前缀的**残类陈旧指针**（不改 · 不逐一登，§10.4 残类口径 + 到期条件）。

### 10.9 open / 未决

① **执行窗口点火**（用户 / 父侧——§2.5 窗口：在途文档债批收口 ∧ 用户点火）；② **族 B 4 行的措辞落笔**（改指 canonical vs 退场注记——执行轮按 §10.4 判据择一，若涉语义转换则回父侧）；③ **`docs/README.md` §3 待迁清单**的 phase-1 三档（`TWO-REPO-MERGE*`）——**已结清：暂留原地**（父侧裁定；生效读数 139 / 50——§10.3 已结清块）。

## 11. 桌面端设计档按域拆分 · 执行方案

判据 = `docs/core/design/DOC-DISCIPLINE.md` §3.14（M-2 ∥ M-3 成片命中）+ §3.16（本条工序单源——**不重述**，D2）；触发先例登记 = 桌面端设计档拆分先例。

**来源**：用户令（按域分界原则落提示词体系——§11.7）。

### 11.1 目标结构（14 档域清单）

域清单 = **候选形状**——行级归属（KD 行 ∥ UI 块）以波 0 届盘逐行钉死为准（§11.10 open ①）；本表给域边界与现址锚。

| # | 目标档（`docs/desktop/design/`） | 域 | 内容边界（现址锚） |
|---|---|---|---|
| 1 | `PROJECT.md`（降格 · 总览） | 总览 + 跨域决策 + 索引 | 现 §1（`:13`）· §2 跨域三条（KD-1 ∥ KD-4 ∥ KD-42——余 63 行按域迁）· §3（`:142`）收编为全库索引 · §8 边界（`:1667`）· 变更记录（`:1818–2283` 整块转「迁移前历史段」） |
| 2 | `SHELL.md`（保持） | 壳与宿主面 | 现 `SHELL.md` 全档 ∥ `PROJECT.md` §2：KD-2 ∥ 3 ∥ 7 ∥ 43 ∥ 53 ∥ 54 ∥ 59 · §4.1 宿主族行 · §4.2 宿主族块 · §6.1 D31 行 · §7 T-DSK53 · §10 CP ∥ CQ ∥ CY |
| 3 | `IPC.md`（保持） | 主↔渲染通道 | 现 `IPC.md` 全档 ∥ `PROJECT.md` §2 通道行 · §4.1 ipc ∥ preload 行 · 白名单计数句 |
| 4 | `SESSIONS.md`（新） | 会话族 | KD-5 ∥ 9 ∥ 15 ∥ 16 ∥ 28 ∥ 41 ∥ 56 · `UI.md` 会话控制面行（`:28`）+ 会话族注（`:132` 表行 ∥ `:152` ∥ `:206`）· §4.1 会话族行 · §6.1 D1 ∥ D2 ∥ D18 ∥ D23 ∥ D26 行 · §7 会话族用例 · §10 CU |
| 5 | `CHAT.md`（新） | 对话流与卡面 | KD-8 ∥ 14 ∥ 22 ∥ 23 ∥ 24 ∥ 37 ∥ 39 · `UI.md` 对话流（`:18`）∥ 审批（`:21`）∥ 提问（`:22`）∥ 计划（`:23`）∥ 目标（`:24`）∥ 工具卡（`:25`）行 + 相关注（`:66` ∥ `:342` 对话流面 ∥ `:455` ∥ `:464` ∥ `:506`）· §6.1 D3 ∥ D5 ∥ D19 相关行 · §7 对话族用例 |
| 6 | `COMPOSER.md`（新） | 输入区 · 队列 · 三值 | KD-17 ∥ 18 ∥ 19 ∥ 21 ∥ 31 ∥ 40 ∥ 51 ∥ 52 · `UI.md` 输入区行（`:19`）+ 会话面四件注附件 ∥ 三值项（`:38–53`）∥ `:426` ∥ `:520` ∥ `:528` ∥ `:569` · §6.1 D6 ∥ D13 ∥ D25 ∥ D34 行 · §7 输入族用例 |
| 7 | `ACTIVITY.md`（新） | 活动池 · 子代理 · 挂起消化 | KD-26 ∥ 32 ∥ 33 ∥ 34 ∥ 35 ∥ 36 ∥ 47 ∥ 55 ∥ 58 ∥ 60 ∥ 62 · `UI.md` §2 项 1（`:649`）∥ 子 agent 块注（`:487` ∥ `:496`）· `PROJECT.md` §2.2（`:117`）· §6.1 D4 ∥ D20 ∥ D28 ∥ D30 ∥ D35 行 · §7 活动族用例 · §10 CZ ∥ DA ∥ CR |
| 8 | `SETTINGS.md`（新） | 设置与首启 | KD-10 ∥ 11 ∥ 12 ∥ 13 ∥ 44 ∥ 45 ∥ 46 ∥ 49 ∥ 66（KD-45 ∥ 46 的通道半 ∥ 渲染半随行核）· `UI.md` 设置面（`:29`）∥ 首启向导（`:30`）∥ 启动态（`:27`）行 + `:554` ∥ `:628` · §6.1 D7 ∥ D8 ∥ D9 ∥ D11 ∥ D16 ∥ D37 行 · §7 设置族用例 · §10 CH |
| 9 | `MENU.md`（新） | 菜单体系 | KD-65 · `UI.md` 菜单注（`:619`）· §6.1 D36 行 · §7 T-DSK57 · §10 DG |
| 10 | `UI.md`（降格 · 总则） | 界面总则 · 状态行 · 视觉基线 | 保留：布局（`:14`）∥ 断点（`:15`）∥ 状态词（`:16`）∥ 交互（`:17`）∥ 状态栏（`:20`）∥ 键盘可达（`:32`）∥ i18n（`:33`）∥ 主题（`:31`）+ 视觉族注（`:186` ∥ `:221` ∥ `:447` ∥ `:537` ∥ `:546` ∥ `:590`）· KD-20 ∥ 25 ∥ 29 ∥ 30 ∥ 38 ∥ 57 ∥ 61 · §7 状态行族用例 |
| 11 | `RENDERER.md`（保持） | 渲染工艺 | 现 `RENDERER.md` 全档 ∥ KD-27 ∥ 48 ∥ 50 ∥ 63 · §6.1 D19 机制半 |
| 12 | `PACKAGING.md`（新） | 打包与发行 | `PROJECT.md` §5（`:1329–1411`）全段 ∥ KD-6 ∥ 64 · §4.1 打包族行 · §6.1 D12 ∥ D32 行 · §7 T-DSK14 ∥ T-DSK55 · §10 DE |
| 13 | `E2E-TESTING.md` | 测试基建 | 保持（零迁） |
| 14 | `WEB-QUICKCHECK.md` | web 快筛 | 保持（零迁） |

**跨档计数热点消除（O-2 实例）**：五档档头的 `需求侧 D1–D37` 范围计数**摘除**、改稳定指针；档数枚举（「设计侧 N 档」类）只住总览档索引节（单源）；`§4.1 本端文件清单与行数预算` 行族按域拆、每域档自持族账。

**档名查重结果**：14 名中唯 `SETTINGS.md` 与既有 `docs/vsc/design/SETTINGS.md` 同名——域内（`docs`）裸名引用面**零命中**（命中仅在闸域外）⇒ 处置 = 引用一律全路径形态（N-c 扩用），无需改名。

- **同名面判据（R2 ∥ R3）**：同一部分内 design ↔ requirements **同名成对** ⇒ 判 **R2**（带层前缀 `design/X.md` ∥ `requirements/X.md`）；该档名在 **≥2 个部分**出现 ⇒ 判 **R3**（仓根相对全路径 `docs/<部分>/<层>/X.md`）；两判同中者判 **R3**。判据句住 `design/DOC-SYSTEM.md` §7 的 R2 ∥ R3 两行——本条不重述（**D2**）。
- **本例（`SETTINGS.md`）**：跨 `desktop` ∥ `vsc` 两部分 ⇒ 判 **R3**——与上行「引用一律全路径形态」**同向**。

### 11.2 迁法规则（实例口径 —— 工序单源 = §3.16 O-5，不重述）

本方案实例面三件：① **基线件**（迁移前 `doc-check` 读数 + 逐档计数表——冻结为相对判据基线）；② **改指表**（跨档引用清单——逐波产出、随波销项；锚形态对策：编号锚 ∥ 节名锚优先，`:line` 仅 as-of）；③ **保位形态**（原址一行「→ `<域档名>` §节」；原址零正文副本）。

**剪枝位置（钉死）**：原址剪枝 = **每域闭环收尾步**——域内「建/收编 → 剪枝 → 改指 → 复跑」一步完成，**不设后置统一剪枝**；波内并行面 = **域档**（各域目标档互异），**共享档（`PROJECT.md` ∥ `UI.md`）剪枝段 = 串行段**（文件级调度——O-4）。

**剪枝操作纪律**：区间置换**降序**（防行号漂移）∥ **内容锚**定位（不以行号为唯一锚）∥ 终态 **grep** 复核。

### 11.3 需求档分卷提案（同轮设计;执行 = 主 agent 笔）

现 `docs/desktop/requirements/PROJECT.md`（302 行 · D1–D37）按域分卷：

| 卷（`docs/desktop/requirements/`） | D 行 |
|---|---|
| `SESSIONS.md` | D1 ∥ D2 ∥ D18 ∥ D23 ∥ D26 |
| `CHAT.md` | D3 ∥ D5 ∥ D19 |
| `COMPOSER.md` | D6 ∥ D13 ∥ D25 ∥ D34 |
| `ACTIVITY.md` | D4 ∥ D20 ∥ D28 ∥ D30 ∥ D35 |
| `SETTINGS.md` | D7 ∥ D8 ∥ D9 ∥ D11 ∥ D16 ∥ D37 |
| `MENU.md` | D36 |
| `PACKAGING.md` | D12 ∥ D32 |
| `UI.md` | D10 ∥ D15 ∥ D17 ∥ D21 ∥ D22 ∥ D24 ∥ D29 ∥ D33 |
| `SHELL.md` | D27 ∥ D31 |
| 总览（`PROJECT.md` 留） | 模块目标 · 边界 · 非功能 · 依赖 + D 表索引 |

D14（E2E）归属届盘定（`E2E-TESTING` 镜像 ∥ 总览——分卷执行波判）。**37 行零遗漏零重复** = 分卷验收判据（§11.8 AC-6）；表 = 提案，主 agent 可裁。

### 11.4 执行波次

| 波 | 内容 | 笔权 ∥ 验收 |
|---|---|---|
| 波 0 · 前置（同窗） | 届盘逐行实读（KD 行 ∥ UI 块级归属钉死）· 基线件（§11.2 ①）· 档名查重复核 · 改指清单初扫 | 执行批（eng-designer）· 父侧书证；产出 = 基线件 + 钉死表 |
| 波 1 · 样板两域 | `MENU.md` + `PACKAGING.md` 建 + 对应内容迁出（验证两类迁法：行级 KD ∥ 整段） | 执行批；验收 = §11.8 AC-2 单域判 |
| 波 2a · 渲染族 | `CHAT` ∥ `COMPOSER` ∥ `ACTIVITY` 建 + `RENDERER` 收编 | 同波内域档零交 + 共享档（`PROJECT.md` ∥ `UI.md`）剪枝段串行（文件级调度——O-4）；验收 = AC-1 ∥ AC-2 |
| 波 2b · 会话设置壳族 | `SESSIONS` ∥ `SETTINGS` 建 + `SHELL` ∥ `IPC` 收编 | 同上（四域同判：域档零交 + 共享档剪枝段串行） |
| 波 2c · 降格收尾 | `UI.md` 降格 + `PROJECT.md` 降格（索引 ∥ 跨域 ∥ 历史段） | 顺序执行（须各域闭环先齐——域档全 ∧ 剪枝已落）；验收 = AC-1 ∥ AC-3 |
| 波 3 · 需求分卷 + 收尾 | 需求分卷（主 agent）· 索引 ∥ 地图改指收尾（§11.5 ③）· 终扫 | 主 agent + 执行批；验收 = AC-6 ∥ AC-1 |

避让：各波开工前按在飞批文件域调度（`docs/desktop/**` 冻结窗在批——D5 照旧）；同波并行 = 允许（域档零交；共享档剪枝段串行），波间 = 顺序。

### 11.5 机检随动清单

| # | 面 | 内容 | 笔权 |
|---|---|---|---|
| ① | 扫描域 | 新档自动入 `checkConfig.scanDirs`（`docs` 全深）——零声明改；内容过锚 ∥ 宽门 | —（零改） |
| ② | 档头 | 跨档范围计数摘除（§11.1 热点消除行） | 执行批 |
| ③ | 索引 ∥ 映射 | `docs/README.md` §1 ∥ §4 行、`DOC-SYSTEM.md` §4 第四部分段（现「设计侧五档」句**已陈旧**——实为七档；随迁移波一并收正为 14 档）、各档头互指行（验收 = AC-1） | 执行批 ∥ 父侧 |
| ④ | 锚检查 | 每波 `doc-check` 相对判据（基线 = 波 0 件）；保位指针 ∥ 新档名解析 | 执行批 |
| ⑤ | 评审面 | 文档 scope 按域收窄（`documents` 列表）——零改，既有机制 | —（零改） |

### 11.6 并发验证矩阵

| 面 | 现状 | 拆分后（预计） | 判 |
|---|---|---|---|
| 设计决策面 | `PROJECT.md` §2 单档 66 行 KD——每笔设计必动 | 各域 KD 行落各域档；总览只留跨域三条 | 消 |
| 界面形态面 | `UI.md` 933 行——渲染四族 + 设置 + 菜单全挤一档 | 各域档分持；`UI` = 总则 + 状态行 + 视觉基线 | 消 |
| 档头计数面 | 五档档头同写 `D1–D37` | 档头摘除（稳定指针） | 消 |
| 文件账 ∥ 批块 | `PROJECT.md` §4.1 ∥ §4.2 单档巨块 | 各域档自持 | 消 |
| 评审 scope | 同 scope 第二发拒发（菜单 ∥ 设置实证） | 域集互异 ⇒ 并行评审（`docSetKey` 不同） | 消 |
| 同域两批 | — | 同域档交集非空 ⇒ 串行 | 残（正确语义） |
| 共享真实文件（如 `window.mjs`） | — | 两批触同一文件 ⇒ 文件级调度串行 | 残（正确） |

**反例（预期不消）**：菜单批 ∥ 用户最大化批——两批真实共触 `window.mjs` ⇒ 串行 = 正确（文件级调度即判面）；同域两批串行 = 预期（O-4）。

### 11.7 提示词随动（按域分界原则落提示词体系）

**落点**：`thincoder-core/prompts/discipline-engineering.md`（唯一副本）「文档纪律」族——新子节「按域分界（创建即留并行面）」，插入位 = 「板块归属与归属判定四问」子节后（`:92–:99` 段尾）；规则详述 = `DOC-DISCIPLINE.md`「按域分界」节。

**措辞草案（逐字固化——正本 · 中文）**：

> ### 按域分界（创建即留并行面）
>
> - **创建或改组任何工作面（文档为主）时，先按「域」划界**：谁跟谁总是一起动 ⇒ 同一份档；谁跟谁从不同时动 ⇒ 分开写。
> - **热点面最小化**：不让一份档（或一个节）成为多路不相干工作的必经之处——共享面只承真正共享的事实；随多路工作变动的计数、枚举行从共享档上摘走，每个数只住一处。
> - **并行写者错开**：两件互不相干的工作各自只写各自的档面；同一面只放同一类工作。
> - **一句话判据**：并行进行的两个任务会不会写到同一个文件——会 ⇒ 再分界；分不开 ⇒ 同域顺位（串行）＝预期，不是缺陷。
> - **改组已有内容时**：逐字搬迁（重组不改字），原位留一行指针、不留副本；计数随内容对拍守恒。

**措辞草案（逐字固化——落地 · 英文）**：

> ### Partition by domain (leave parallel room at creation time)
>
> - **When creating or reorganizing any work surface (docs above all), partition by domain first**: things that always move together ⇒ one document; things that never move together ⇒ separate documents.
> - **Minimize hot surfaces**: never let one document (or one section) become the mandatory stop for several unrelated workstreams — a shared surface carries only genuinely shared facts;
>   move counters and enumerations that shift with several workstreams off the shared document — every number lives in exactly one place.
> - **Stagger parallel writers**: two unrelated workstreams write only their own surfaces; one surface hosts one class of work.
> - **One-line criterion**: would two tasks running in parallel write the same file — if yes ⇒ split further; if it cannot be split ⇒ same-domain sequencing (serial) = expected, not a defect.
> - **When reorganizing existing content**: move text verbatim (restructuring changes no wording); leave a one-line pointer at the old site — no duplicate copy; counts reconcile against the moved content.

**随动面**：① 落笔 = EN 一档（本设计轮零写提示词，实施轮 coder 落）；② 计数——两档无「N 节」类外露计数；③ 指针——他档行号引用位于插入位之上（`docs/core/design/TOOLS.md:782` 的 `:6` ∥ `:35`）⇒ 零漂；`PROMPT-SYSTEM.md:115` 族 = 分叉分析登记（他面文件，零随动）；④ 笔权 = eng-coder 独笔（内容依据 = 本节设计）；⑤ 波次 = 实施波（本设计轮**零写提示词**）。

### 11.8 验收（逐条回指 §3.16）

| # | 判据 | 回指 |
|---|---|---|
| AC-1 | 14 档域清单逐档在位 ∧ 每档过 `doc-check`（零悬空 ∥ 零区带外超宽）∧ 索引 ∥ 地图指向齐（§11.5 ③） | O-1 ∥ O-3 |
| AC-2 | 逐波迁移零语义——逐域闭环、波末已迁域全闭合（剪枝 = 域收尾步，§11.2）：`doc-check` 相对判据（新增悬空 0 ∥ 区带外新增超宽 0）∧ 计守恒对拍逐项全等 ∧ 保位指针解析命中 ∧ 原址零正文副本 | O-5 |
| AC-3 | 机检随动三件（§11.5 ①② + §11.1 档名查重行）落齐：扫描域零声明改 ∧ 档头计数摘除 ∧ 档名查重过 | O-6 |
| AC-4 | 并发面实测：夹具 = 菜单批 `{MENU, SHELL, IPC, COMPOSER}` ∥ 设置批 `{SETTINGS}`——拆分后写域交集 = ∅ ∧ 评审 `docSetKey` 互异（复跑 = `docSetKey(两集, cwd)` 对拍——导出 = `thincoder-core/agent-tools/review-facts.mjs`；现状同 scope 拒发 = 对照基线）；矩阵「消」行 ≥2 组逐行实证 | O-4 |
| AC-5 | 提示词 EN 落（`thincoder-core/prompts/` 一档）∧ 零新悬空引用 ∧ 无外露计数 | §11.7 |
| AC-6 | 需求分卷与 D 行全集对拍（37 行零遗漏零重复——分卷执行波判） | §11.3 |

- **AC-4 复跑口径**（cwd = thincoder）：两集各跑 `docSetKey(集, '.')` 对拍（导出 = `thincoder-core/agent-tools/review-facts.mjs`）——键异 ⇒ 并行放行；对照 = 现状两笔同 scope（`PROJECT.md` +5）⇒ 键同 ⇒ 拒发。
- **复跑命令**：
  `node -e "import('./thincoder-core/agent-tools/review-facts.mjs').then(m=>{const p='docs/desktop/design/';console.log(m.docSetKey([p+'MENU.md',p+'SHELL.md',p+'IPC.md',p+'COMPOSER.md'],'.')!==m.docSetKey([p+'SETTINGS.md'],'.'))})"`

### 11.9 用例表（结构机检口径——正常 ∥ 边界 ∥ 错误）

| 类 · 名字 | 夹具 | 期望 |
|---|---|---|
| 正常 · 单域迁移 | 样板域（`MENU` + `PACKAGING`）迁移 | 保位指针解析命中 ∧ 计守恒全等 ∧ `doc-check` 零新增 |
| 边界 · 跨域块 | 块内项分属两域（如 `PROJECT.md` §2.2 ∥ `UI.md` 批注块） | 按项边界拆迁（逐字）∧ 两域档合计守恒 ∧ 原址零残留正文 |
| 错误 · 迁移断点 | 半波停写（已完成域闭合——含剪枝；未迁域原样） | 逐域闭环 ⇒ 允许（断点落在域边界）；域未闭合（正文两处并存——剪枝未落）⇒ 违规（重跑该域） |
| 正常 · 机检对照 | 每波迁后复跑 | 新增悬空 0 ∧ 区带外新增超宽 0（相对基线） |

### 11.10 边界（本设计不做）

**不执行**：本方案 = 设计轮产物（执行 = 后续波次批——点火照旧）；`docs/desktop/**` 与菜单批档**零触**（D5 冻结窗）；提示词面**零写**（实施波落）；产品码 ∥ `scripts/**` 零触。不拆 `E2E-TESTING` ∥ `WEB-QUICKCHECK`；不动 core ∥ cli ∥ vsc 各树（M-6 逐触发）。**不预建空档**（未触发域不建——M-6）。

### 11.11 open / 未决

① KD 行 ∥ UI 块级归属在波 0 逐行钉死前为**候选**（本表 = 域边界 + 现址锚形状）；② 需求分卷表 = 提案（主 agent 裁）；③ `SETTINGS.md` 同名处置 = 全路径形态（§11.1 查重行）；④ 变更记录整块留原址的「迁移前（≤ 迁移日）」标记形态——波 0 定形；⑤ `DOC-DISCIPLINE.md` §3.14 既有「`DOC-SYSTEM.md` §3.4 行 M-2 实例」登记不变（零随动）。


## 12. R2 层前缀引称迁移 · 执行表（全树 332 行 / 140 组）

> 主题 = 引称按 `DOC-SYSTEM.md` §7 R2 形（同部分跨层同名对 ⇒ 带层前缀）迁移——本节 = 该迁移的**唯一执行表**（跨分批 1–6 多轮执行）。
> 判据句单源 = `docs/core/design/DOC-SYSTEM.md` §7（R1 / R2 / R3 三行 + 计数口径 + 例外条 + R2 ∥ R3 分工句）——本节**不重述判据**（**D2**），只载口径 / 计数 / 逐组表 / 分批序。
> 核法 = **人读**（用户裁：R2 属语义约定，不设机检）。

**扫描口径（实测 · 非转抄）**：域 = `docs/<部分>/{design,requirements}/**`（扣 `_archive`）；命中 = 裸名 token `X.md`（token 内**不含 `/`**）后**紧随坐标**（`§N` ∥ `:N`）；面 = **R2**（该部分 design ↔ requirements 同名对）∥ **R3**（`X.md` 在 **≥2 个部分**出现）；两判同中时计 **R3**；**逐行计数**（同行重复 token 去重）。

**`_archive` 不计**：同名对基数不含 `_archive`——`core` 两侧 `_archive/ENGINEERING-MODE.md` 成对 ⇒ 计入则 `core` 35 / 合计 53，扣后 34 / 52（差 1 对全在 `_archive`）。判据单源 = `design/DOC-SYSTEM.md` §7 计数口径。

**坐标口径**：行号列 = 设计轮实测快照（已过时，不当执行依据）——行号随各档编辑漂移，迁移轮须逐处**改前回读**；本表自身行号随本节增段同步收正。

**本表非引称**：表内「被引」列 = 裸档名列（与「行号」列分栏，非同格），属**登记表形态** ⇒ 不判 R2 / R3（判据住 `docs/core/design/DOC-SYSTEM.md` §7 例外条）。

**计数**

| 面 | 可动 | 禁区（原） | 合计 |
|---|---|---|---|
| R2（纯） | 210 | 65 | 275 |
| R3（纯） | 28 | 10 | 38 |
| R2+R3 | 18 | 1 | 19 |
| **合计** | **256 行 / 114 组** | **76 行 / 26 组** | **332 行 / 140 组** |

**读法**：本表 = **原始扫描分类**；逐组表按 KD-3（两判同中归 R3）⇒ 其「面」列只出现 `R2` / `R3` 两值（同一处只判一遍）。两表同源——计数表看**原始面**，逐组表看**处置面**。
**按部分（行）**：`cli` 2 · `core` 262 · `desktop` 3 · `server` 13 · `vsc` 52。**同名对 52 对**（cli 5 · core 34 · desktop 10 · server 1 · vsc 2）。

**R2 改写规则（判据句 · 禁「视情况」）**：现写法三式——① 两段反引号 `` `X.md` §N `` ∥ ② 单段 `` `X.md §N` `` ∥ ③ 坐标式 `` `X.md`:N ``——改后一律 = **层前缀档名 + 原坐标**：`design/X.md §N` ∥ `requirements/X.md §N` ∥ `requirements/X.md:N`。

**层归属**：引称方与被引档同层 ⇒ 该层（设计档互引 ⇒ `design/`）；需求档回指设计档 ⇒ `design/`。

**R3 改写规则**：`docs/<部分>/<层>/X.md §N`（**仓根相对全路径** · 层 = 被引档所在层）。

**层判定的实证例外（逐条 · 非推测）——五条**
- `core/design/MANIFEST.md:334` ⇒ `requirements/PORTABILITY.md:63`（FR11 = 需求侧）
- `core/design/TESTING.md:6` ⇒ `requirements/TOOLS.md §4.7`（`§4.7` 实居 `docs/core/requirements/TOOLS.md:120`）
- `core/requirements/PROMPT-SYSTEM.md:28/32/33/34/47` ⇒ `requirements/ENGINEERING-MODE-V2.md`（句作「v2 需求」）
- `core/requirements/TOOLS.md:124/149` ⇒ `requirements/TESTING.md §6/§6.2`
- `core/requirements/TESTING.md:181/183/188/210/232` ⇒ `requirements/TOOLS.md §4.7`

**逐组表（可动 114 组 = 实迁移 113 组 + 出射程 1 组 · 表列 = 源档 ∥ 被引 ∥ 面 ∥ 改后前缀 ∥ 行号）**

| 源档（`docs/` 下相对） | 被引 | 面 | 改后 | 行号 |
|---|---|---|---|---|
| `cli/requirements/READ-DATA-INTERFACE.md` | `LEDGER.md` | R3 | `docs/core/design/LEDGER.md` | 18 |
| `cli/requirements/TUI.md` | `TUI.md` | R2 | `design/` | 36 |
| `core/design/ADVISOR-CONVERGENCE.md` | `CONTEXT-COMPACTION.md` | R2 | `design/` | 404 |
| `core/design/AGENT-LOOP-ASYNC-POOL.md` | `AGENT-LOOP.md` | R2 | `design/` | 14 36 871 1004 1087 |
| `core/design/AGENT-LOOP-SUBAGENT.md` | `AGENT-LOOP.md` | R2 | `design/` | 101 350 407 410 |
| `core/design/AGENT-LOOP-SUBAGENT.md` | `CONFIG.md` | R2 | `design/` | 647 |
| `core/design/AGENT-LOOP-SUBAGENT.md` | `DESIGN-TOKEN-SETTLEMENT.md` | R2 | `design/` | 49 |
| `core/design/AGENT-LOOP-SUBAGENT.md` | `TESTING.md` | R2 | `design/` | 273 330 |
| `core/design/AGENT-LOOP-SUBAGENT.md` | `TOOLS.md` | R2 | `design/` | 672 |
| `core/design/AGENT-LOOP.md` | `CONTEXT-COMPACTION.md` | R2 | `design/` | 276 458 |
| `core/design/AGENT-LOOP.md` | `CORE-UNIFICATION.md` | R2 | `design/` | 6 163 167 456 460 |
| `core/design/AGENT-LOOP.md` | `MEMORY.md` | R2 | `design/` | 461 |
| `core/design/AGENT-LOOP.md` | `MULTI-INSTANCE-COLLAB.md` | R2 | `design/` | 467 |
| `core/design/AGENT-LOOP.md` | `PORTABILITY.md` | R2 | `design/` | 288 |
| `core/design/API-CONTRACT.md` | `TOOLS.md` | R2 | `design/`（出射程——见下） | 814 |
| `core/design/BASH-EXECUTOR-FACE.md` | `CORE-UNIFICATION.md` | R2 | `design/` | 90 |
| `core/design/BATCH-RECORD.md` | `TOOLS.md` | R2 | `design/` | 64 229 239 244 347 517 |
| `core/design/BROWSER-TOOL.md` | `TOOLS.md` | R2 | `design/` | 33 |
| `core/design/CHECKPOINT.md` | `CORE-UNIFICATION.md` | R2 | `design/` | 6 64 |
| `core/design/CHECKPOINT.md` | `TOOLS.md` | R2 | `design/` | 104 |
| `core/design/CONFIG.md` | `ADVISOR-CONVERGENCE.md` | R2 | `design/` | 96 |
| `core/design/CONFIG.md` | `CORE-UNIFICATION.md` | R2 | `design/` | 6 57 59 72 |
| `core/design/CONSULTATION.md` | `CORE-UNIFICATION.md` | R2 | `design/` | 6 85 89 |
| `core/design/CONTEXT-COMPACTION.md` | `CORE-UNIFICATION.md` | R2 | `design/` | 6 37 |
| `core/design/CONTEXT-COMPACTION.md` | `PROVIDER.md` | R2 | `design/` | 41 57 |
| `core/design/CONTEXT-COMPACTION.md` | `SESSION.md` | R2 | `design/` | 104 |
| `core/design/CONTEXT-COMPACTION.md` | `TOOLS.md` | R2 | `design/` | 354 |
| `core/design/CORE-UNIFICATION.md` | `AGENT-LOOP.md` | R2 | `design/` | 744 769 |
| `core/design/CORE-UNIFICATION.md` | `TOOLS.md` | R2 | `design/` | 796 |
| `core/design/DESIGN-TOKEN-SETTLEMENT.md` | `ENG-TOKEN-BINDING.md` | R2 | `design/` | 94 |
| `core/design/ENG-TOKEN-BINDING.md` | `DESIGN-TOKEN-SETTLEMENT.md` | R2 | `design/` | 195 |
| `core/design/ENGINEERING-MODE-V2.md` | `PROMPT-SYSTEM.md` | R2 | `design/` | 295 297 |
| `core/design/ENGINEERING-MODE-V2.md` | `SESSION.md` | R2 | `design/` | 329 |
| `core/design/I18N.md` | `CORE-UNIFICATION.md` | R2 | `design/` | 6 38 42 |
| `core/design/LEDGER-SELF-CONTAINED.md` | `PROMPT-SYSTEM.md` | R2 | `design/` | 146 |
| `core/design/LEDGER.md` | `MEMORY.md` | R2 | `design/` | 65 268 379 654 |
| `core/design/LOGGING.md` | `CONFIG.md` | R2 | `design/` | 100 |
| `core/design/LOGGING.md` | `CORE-UNIFICATION.md` | R2 | `design/` | 6 41 |
| `core/design/MANIFEST.md` | `DESIGN-TOKEN-SETTLEMENT.md` | R2 | `design/` | 332 |
| `core/design/MANIFEST.md` | `LEDGER.md` | R3 | `docs/core/design/LEDGER.md` | 331 686 |
| `core/design/MANIFEST.md` | `LIGHT-CHANNEL.md` | R2 | `design/` | 332 |
| `core/design/MANIFEST.md` | `MEMORY.md` | R2 | `design/` | 123 125 280 683 |
| `core/design/MANIFEST.md` | `PORTABILITY.md` | R2 | `design/`（`:334` 例外 ⇒ `requirements/`） | 280 296 334 358 |
| `core/design/MANIFEST.md` | `PROMPT-SYSTEM.md` | R2 | `design/` | 240 |
| `core/design/MANIFEST.md` | `TOOLS.md` | R2 | `design/` | 331 |
| `core/design/MCP.md` | `CORE-UNIFICATION.md` | R2 | `design/` | 6 19 47 |
| `core/design/MEMORY.md` | `AGENT-LOOP.md` | R2 | `design/` | 812 |
| `core/design/MEMORY.md` | `CORE-UNIFICATION.md` | R2 | `design/` | 6 20 73 |
| `core/design/MEMORY.md` | `PORTABILITY.md` | R2 | `design/` | 804 |
| `core/design/MEMORY.md` | `PROMPT-SYSTEM.md` | R2 | `design/` | 800 |
| `core/design/MODEL-BENCH.md` | `CONFIG.md` | R2 | `design/` | 105 |
| `core/design/MODEL-SPECS.md` | `PROVIDER.md` | R2 | `design/` | 467 1400 1413 1442 |
| `core/design/MODEL-SPECS.md` | `SETTINGS.md` | R3 | `docs/vsc/design/SETTINGS.md` | 1415 |
| `core/design/MULTI-INSTANCE-COLLAB.md` | `SESSION.md` | R2 | `design/` | 23 45 66 71 75 298 320 321 |
| `core/design/MULTI-INSTANCE-COLLAB.md` | `TOOLS.md` | R2 | `design/` | 144 |
| `core/design/PROMPT-SYSTEM.md` | `CONFIG.md` | R2 | `design/` | 593 710 |
| `core/design/PROMPT-SYSTEM.md` | `CORE-UNIFICATION.md` | R2 | `design/` | 6 144 |
| `core/design/PROMPT-SYSTEM.md` | `ENGINEERING-MODE-V2.md` | R2 | `design/` | 880 |
| `core/design/PROMPT-SYSTEM.md` | `MEMORY.md` | R2 | `design/` | 377 |
| `core/design/PROMPT-SYSTEM.md` | `SETTINGS-TOOL.md` | R2 | `design/` | 798 |
| `core/design/PROMPT-SYSTEM.md` | `TOOLS.md` | R2 | `design/` | 307 |
| `core/design/PROVIDER.md` | `CORE-UNIFICATION.md` | R2 | `design/` | 6 57 |
| `core/design/PROXY.md` | `PROVIDER.md` | R2 | `design/` | 36 |
| `core/design/SESSION.md` | `CORE-UNIFICATION.md` | R2 | `design/` | 6 24 42 60 |
| `core/design/SESSION.md` | `MULTI-INSTANCE-COLLAB.md` | R2 | `design/` | 91 |
| `core/design/SESSION.md` | `PROVIDER.md` | R2 | `design/` | 192 |
| `core/design/SETTINGS-TOOL.md` | `MULTI-INSTANCE-COLLAB.md` | R2 | `design/` | 31 |
| `core/design/TESTING.md` | `TOOLS.md` | R2 | `requirements/`（`§4.7` 实居需求档） | 6 |
| `core/design/TOOLS.md` | `AGENT-LOOP.md` | R2 | `design/` | 282 |
| `core/design/TOOLS.md` | `BROWSER-TOOL.md` | R2 | `design/` | 904 1185 |
| `core/design/TOOLS.md` | `CONTEXT-COMPACTION.md` | R2 | `design/` | 170 |
| `core/design/TOOLS.md` | `CORE-UNIFICATION.md` | R2 | `design/` | 6 85 146 771 |
| `core/design/TOOLS.md` | `PROMPT-SYSTEM.md` | R2 | `design/` | 258 |
| `core/design/TRACES.md` | `AGENT-LOOP.md` | R2 | `design/` | 44 |
| `core/design/TRACES.md` | `CORE-UNIFICATION.md` | R2 | `design/` | 6 40 |
| `core/design/WORKSPACE.md` | `CORE-UNIFICATION.md` | R2 | `design/` | 6 63 |
| `core/requirements/AGENT-LOOP.md` | `AGENT-LOOP.md` | R2 | `design/` | 23 247 |
| `core/requirements/CHECKPOINT.md` | `CHECKPOINT.md` | R2 | `design/` | 24 |
| `core/requirements/CONFIG.md` | `CONFIG.md` | R2 | `design/` | 23 26 |
| `core/requirements/CONSULTATION.md` | `CONSULTATION.md` | R2 | `design/` | 21 |
| `core/requirements/CONTEXT-COMPACTION.md` | `CONTEXT-COMPACTION.md` | R2 | `design/` | 22 25 29 |
| `core/requirements/ENGINEERING-MODE-V2-SPEC-LEDGER.md` | `MEMORY.md` | R2 | `design/` | 41 |
| `core/requirements/I18N.md` | `I18N.md` | R3 | `docs/core/design/I18N.md` | 24 |
| `core/requirements/LOGGING.md` | `LOGGING.md` | R2 | `design/` | 20 |
| `core/requirements/MCP.md` | `MCP.md` | R3 | `docs/core/design/MCP.md` | 21 |
| `core/requirements/MEMORY.md` | `MEMORY.md` | R2 | `design/` | 24 |
| `core/requirements/MEMORY.md` | `MULTI-INSTANCE-COLLAB.md` | R2 | `design/` | 201 |
| `core/requirements/PROMPT-SYSTEM.md` | `ENGINEERING-MODE-V2.md` | R2 | `requirements/` | 28 32 33 34 47 |
| `core/requirements/PROMPT-SYSTEM.md` | `PROMPT-SYSTEM.md` | R2 | `design/` | 59 216 |
| `core/requirements/PROVIDER.md` | `PROVIDER.md` | R2 | `design/` | 20 24 25 31 |
| `core/requirements/SESSION.md` | `SESSION.md` | R2 | `design/` | 22 39 |
| `core/requirements/TESTING.md` | `TOOLS.md` | R2 | `requirements/` | 181 183 188 210 232 |
| `core/requirements/TOOLS.md` | `TESTING.md` | R2 | `requirements/` | 124 149 |
| `core/requirements/TOOLS.md` | `TOOLS.md` | R2 | `design/` | 23 62 63 64 65 66 68 69 |
| `core/requirements/TRACES.md` | `TRACES.md` | R2 | `design/` | 20 |
| `core/requirements/WORKSPACE.md` | `WORKSPACE.md` | R2 | `design/` | 23 |
| `desktop/design/ACTIVITY.md` | `PROJECT.md` | R3 | `docs/desktop/design/PROJECT.md` | 116 |
| `desktop/design/SESSIONS.md` | `PROJECT.md` | R3 | `docs/desktop/design/PROJECT.md` | 142 163 |
| `server/design/accounts/ACCOUNTS.md` | `PROJECT.md` | R3 | `docs/server/requirements/PROJECT.md` | 4 |
| `server/design/agent/ADMIN-AGENT.md` | `PROJECT.md` | R3 | `docs/server/design/PROJECT.md` | 6 41 540 613 |
| `server/design/client/CLIENT.md` | `PROJECT.md` | R3 | `docs/server/requirements/PROJECT.md` | 4 |
| `server/design/gateway/API.md` | `PROJECT.md` | R3 | `docs/server/requirements/PROJECT.md` | 4 |
| `server/design/ledger/LEDGER.md` | `PROJECT.md` | R3 | `docs/server/requirements/PROJECT.md` | 4 |
| `server/design/mcp/MCP.md` | `PROJECT.md` | R3 | `docs/server/design/PROJECT.md` | 89 |
| `server/design/metering/METERING.md` | `PROJECT.md` | R3 | `docs/server/requirements/PROJECT.md` | 4 |
| `server/design/ops/OPS.md` | `PROJECT.md` | R3 | `docs/server/requirements/PROJECT.md` | 4 |
| `server/design/project/PROJECTS.md` | `PROJECT.md` | R3 | `docs/server/requirements/PROJECT.md` | 4 |
| `server/design/webui/WEBUI.md` | `PROJECT.md` | R3 | `docs/server/requirements/PROJECT.md` | 4 |
| `vsc/design/VSC-DEBT.md` | `PROJECT.md` | R3 | `docs/vsc/requirements/PROJECT.md` | 13 15 145 146 147 151 152 195 197 421 459 |
| `vsc/design/VSC-DEBT.md` | `WEBVIEW.md` | R2 | `design/` | 14 149 150 196 224 |
| `vsc/design/WEBVIEW-PROTOCOL.md` | `I18N.md` | R3 | `docs/core/design/I18N.md` | 275 |
| `vsc/design/WEBVIEW-PROTOCOL.md` | `SETTINGS.md` | R3 | `docs/vsc/design/SETTINGS.md` | 115 120 122 124 390 413 415 451 463 496 497 |
| `vsc/design/WEBVIEW-PROTOCOL.md` | `WEBVIEW.md` | R2 | `design/` | 50 92 101 190 200 210 216 246 262 263 266 271 311 315 316 319 320 329 363 424 427 500 501 |
| `vsc/requirements/WEBVIEW.md` | `SETTINGS.md` | R3 | `docs/vsc/design/SETTINGS.md` | 33 |

**出射程 1 组（不改 .md · 不改源码）**：`core/design/API-CONTRACT.md:814`（被引 `TOOLS.md`）——命中落在**生成区**（`API-CONTRACT.md:10`「生成器唯一笔——勿手改」· `:12` 重跑 = `node scripts/api-contract.mjs --write`），文本源 = 代码注释（`thincoder-core/agent.mjs:42`）⇒ 手改 .md 即被重跑覆盖、改源码越本批边界 ⇒ **出迁移射程**。⇒ **实迁移面 = 331 行 / 139 组**。

**禁区表（26 组 / 76 行 · 原在途批射程内 —— 该批已收口 ⇒ 解除，可迁）**

| 源档（`docs/` 下相对） | 被引 | 面 | 改后 | 行号 |
|---|---|---|---|---|
| `core/design/DOC-DISCIPLINE.md` | `AGENT-LOOP.md` | R2 | `design/` | 264 378 389 390 391 392 393 394 395 401 409 1496 1627 |
| `core/design/DOC-DISCIPLINE.md` | `CHAT.md` | R3 | `docs/desktop/design/CHAT.md` | 944 |
| `core/design/DOC-DISCIPLINE.md` | `CORE-UNIFICATION.md` | R2 | `design/` | 210 1626 |
| `core/design/DOC-DISCIPLINE.md` | `DESIGN-TOKEN-SETTLEMENT.md` | R2 | `design/` | 1235 |
| `core/design/DOC-DISCIPLINE.md` | `DOC-SYSTEM.md` | R2 | `design/`（两处引称本体 = 层前缀形） | 521 522 723 726 1389 1501 1503 1544 1546 |
| `core/design/DOC-DISCIPLINE.md` | `PROMPT-SYSTEM.md` | R2 | `design/` | 521 522 606 1501 1503 1505 |
| `core/design/DOC-DISCIPLINE.md` | `SETTINGS.md` | R3 | `docs/desktop/design/SETTINGS.md` | 944 |
| `core/design/DOC-DISCIPLINE.md` | `TESTING.md` | R2 | `design/` | 264 |
| `core/design/DOC-DISCIPLINE.md` | `TOOLS.md` | R2 | `design/` | 522 606 1501 1503 1505 |
| `core/design/DOC-MIGRATION.md` | `AGENT-LOOP.md` | R2 | `design/` | 29 41 64 289 |
| `core/design/DOC-MIGRATION.md` | `CONFIG.md` | R2 | `design/` | 54 310 |
| `core/design/DOC-MIGRATION.md` | `CONSULTATION.md` | R2 | `design/` | 310 |
| `core/design/DOC-MIGRATION.md` | `CORE-UNIFICATION.md` | R2 | `design/` | 195 310 |
| `core/design/DOC-MIGRATION.md` | `DOC-SYSTEM.md` | R2 | `design/` | 14 151 311 462 536 |
| `core/design/DOC-MIGRATION.md` | `ENG-TOKEN-BINDING.md` | R2 | `design/` | 311 314 |
| `core/design/DOC-MIGRATION.md` | `I18N.md` | R3 | `docs/core/design/I18N.md` | 311 |
| `core/design/DOC-MIGRATION.md` | `LEDGER.md` | R3 | `docs/core/design/LEDGER.md` | 311 |
| `core/design/DOC-MIGRATION.md` | `PORTABILITY.md` | R2 | `design/` | 312 |
| `core/design/DOC-MIGRATION.md` | `PROJECT.md` | R3 | `docs/desktop/design/PROJECT.md` | 395 396 400 405 470 473 526 |
| `core/design/DOC-MIGRATION.md` | `PROMPT-SYSTEM.md` | R2 | `design/` | 505 |
| `core/design/DOC-MIGRATION.md` | `SEND-STALL-DISTILL.md` | R2 | `design/` | 312 |
| `core/design/DOC-MIGRATION.md` | `TOOLS.md` | R2 | `design/` | 30 38 39 71 72 |
| `core/design/DOC-MIGRATION.md` | `TWO-REPO-MERGE.md` | R2 | `design/` | 313 |
| `core/design/DOC-MIGRATION.md` | `VERIFY-REDESIGN.md` | R2 | `design/` | 200 |
| `core/design/DOC-MIGRATION.md` | `WORKSPACE.md` | R2 | `design/` | 45 |
| `core/design/DOC-SYSTEM.md` | `PROMPT-SYSTEM.md` | R2 | `design/` | 143 |

**逐处判 5 组 → 定案（按被引档的实际指向）**
- `DOC-DISCIPLINE.md:944` 的 `CHAT.md` ∥ `SETTINGS.md` = **桌面域设计档清单**（同列 `ACTIVITY.md:147` 等）⇒ `docs/desktop/design/CHAT.md` ∥ `docs/desktop/design/SETTINGS.md`。
- `DOC-MIGRATION.md:311` 的 `I18N.md` ∥ `LEDGER.md` = **本档核心设计档清单**（同列 `DOC-CODE-RECONCILE.md:134` 等）⇒ `docs/core/design/I18N.md` ∥ `docs/core/design/LEDGER.md`。
- `DOC-MIGRATION.md:395/396/400/405/470/473/526` 的 `PROJECT.md` = **§11 桌面端拆分面**（`SHELL.md` / `IPC.md` / `PACKAGING.md` 行内）⇒ `docs/desktop/design/PROJECT.md`。

**分批顺序（依据 = 写者冲突 ∥ 面大小）**

| 批 | 部分 | 行数 | 依据 |
|---|---|---|---|
| 1 | `server` | 13 | 面小 · **无在途写者** · R2 / R3 同轮（`PROJECT.md` 一次定形） |
| 2 | `desktop` | 3 | 同上 |
| 3 | `vsc` | 52 | 有**正向夹具**（`docs/vsc/requirements/WEBVIEW.md:5` 已写 `design/WEBVIEW.md`、`:142` 明文引 R2 形 ⇒ 零改，可作对齐样板）· R3 面最大 |
| 4 | `cli` | 2 | 同第 1 批 |
| 5 | `core` 可动 | 186 | 面最大；**76 行原在在途批射程内——该批已收口 ⇒ 条件解除** |
| 6 | `core` 禁区 | 76 | 随第 5 批同轮 |
