# VSC 文档迁移规划（VSC-MIGRATION）· 设计 — VSC 部分

> 部分 = **vsc**（`docs/vsc/`）；本档 = VSC 部分**文档面迁移**的设计（实点 · 二分 · 落点 · 分批 · 验收）。
> 需求侧 = `docs/vsc/requirements/VSC-MIGRATION.md`（F-M1–F-M6 / N-M1–N-M6——**同名成对**，N-b）。
> 判据（本档**不重述**——D2）= `docs/core/design/DOC-SYSTEM.md`：目标结构 §4 · 归属判据 **P1–P5** §5.1 · 命名 **N-a–N-d** §6 · 引用形态 **R1–R5** §7。
> 建档：2026-09-15（**B 式迁移轮 · VSC 第 1 批**）——本档 = 规划 + 本批实迁记录；来源 = 批次档 `docs/batches/2026-09-15-vsc-doc-migration.md` §1（主 agent）。
> 全部行数与坐标 = **as-of 2026-09-15 实核**（口径 = `readFileSync(...).split("\n").length`，含末行空元素）。

## 1. 方案选型对比

### 1.1 迁移方式（承 CLI 轮裁定，此处只做本端的适用性核对）

| # | 候选 | 判据逐项评估 | 取舍（选定代价/权衡） | 结论 |
|---|---|---|---|---|
| 1 | **B 式：旧档留原地一字不改 + 内容重建进基准层活档** | ① 与用户 2026-09-14 23:02 裁定一致（「明显应该是 B」）✓ ② 旧树仍可查（参照历史）✓ ③ 重建时可剔除批次材料（状态行 / 逐批流水）✓ ④ 单笔可 revert（新增档 + 旧档零改）✓ | 代价 = 同一话题短时存在两份文本（权威性由本档 §2.4 定死：基准层活档 = 权威，旧档 = 参照历史，不参与同步） | **选定** |
| 2 | A 式：`git mv` 旧档入基准层 | ① 无重复文本 ✓ ② **迁入即带批次材料**（状态行 / 受影响文件 / 用例表 / 变更流水）⇒ 违反 `DOC-SYSTEM` §4 的活档形态 ✗ ③ 旧树失去参照（用户裁定要留）✗ ④ 与 CLI 轮已落形态不一致（跨部分形态分叉）✗ | — | **否决**（②③④） |
| 3 | 只出统计清单、不实迁（规划与执行分轮） | ① 规划质量可先独立评估 ✓ ② **用户 2026-09-15 00:26 / 00:42 双侧明令「规划与迁移同轮」「禁纯统计空转」** ✗ ③ 规划不经真实迁移检验 ⇒ 落点判据的错漏要等到执行轮才暴露 ✗ | — | **否决**（②③） |

### 1.2 本批可迁面（为什么本批只剩 3 档）

本批的写域被父侧 2026-09-15 收紧为「只许 `docs/vsc/**`」（理由 = 与并行在跑的 CLI 迁移批共用 `docs/core/design/**`，同改即互相覆盖）。故：

| # | 候选面 | 档数 | 结论 |
|---|---|---|---|
| 1 | **VSC 专有面（P2）→ `docs/vsc/`** | 4 | **选定**（本批写域内） |
| 2 | 统一面（P1）→ `docs/core/` | 64 | **本批不写**——列 §8「待父侧另批」（逐条给拟并入目标） |
| 3 | 待核（判不准） | 2 | **本批不写**——列 §7（两种读法 + 依据） |
| 4 | 历史档（就地留） | 14 | **本批不迁**（就地留 = 迁的形式之一，见 §2.2） |

## 2. 接口契约

### 2.1 二分判据（什么是「活」与「历史」——可复核）

| # | 判 | 判据句 | 动作 |
|---|---|---|---|
| **二-1** | **活档** | 该档描述的机制/界面**在现行代码中在位**，且该档是它**在 VSC 树内的现行权威或唯一登记** | ⇒ 迁（内容重建入基准层活档） |
| **二-2** | **历史档** | 该档为**一次性交付记录**（档头自述「已交付核销 / 已实现 / 已批准+已实现」的施工过程稿），或**已被本树另一档显式取代** | ⇒ **就地留**（不迁；树降格后随之为参照历史） |

**依据列取值（逐档必填）**：

| 码 | 判据句 | 形态 |
|---|---|---|
| **①** | `docs/core/` 已有同话题活档 | 给该档路径（承载域） |
| **②** | 已被现行设计取代 | 给对照点（取代者档 + 节，或「档头自述取代」） |
| **③** | 只描述核内已单源化机制 | 给单源档路径 |
| **④** | 结构性不对称（该机制只在本部分存在） | 给机制名（`DOC-SYSTEM` §5.1 P2） |

### 2.2 落点规则（承 P1–P5，此处只给本端映射）

| 分类 | 落点 | 本端实例 |
|---|---|---|
| 活档 · 统一面（机制在 ≥2 部分存在） | `docs/core/<层>/<板块>.md` | VSC webview 之外的全部机制档（§8） |
| 活档 · 专有面（结构性不对称） | `docs/vsc/<层>/<板块>.md` | webview 面 · 配置面板 · 项目切换（§6） |
| 历史档 | **原地不动**（现状路径保留） | 13 设计档 + 1 地图档（§5 表） |
| 流程面（台账 / 批次档 / 地图） | `docs/` 根，**不进三部分**（P3） | 本批零涉及 |

### 2.3 引用形态（迁移期口径——`R3` 落地前）

| # | 被引对象 | 形态 | 机检行为（现状实核） |
|---|---|---|---|
| **引-1** | 已迁入基准层的档 | 裸名 + 节号（同部分同层）∥ 仓根相对全路径（跨部分） | V1 解析（按 basename，域内）；V5-A 排除式 5① 让给 V1 |
| **引-2** | **仍在产品树**的档（未迁） | `名称（VSC 侧）§N`（去 `.md` 去路径——承 `docs/README.md` §2 现状口径）；需给可解析路径时用 `` `thincoder-vscode/docs/...`（VSC 侧） `` | V1 不入判（无 `.md`）；V5-A 路径形态按仓根解析命中 |
| **引-3** | 代码坐标 | 仓根相对路径 + `:行`（如 `thincoder-vscode/webview/ui.js:445`） | V5-A 按仓根解析（`resolveFile` 候选①）——**产品树相对写法迁出后即失效**，故一律改写 |

**R3 落地后的翻转**：`DOC-SYSTEM` §7 选定「跨部分引用 = 仓根相对全路径」；该形态需 V1 扩「带 `/` 的 `.md` 按仓根解析」一支（**现未实装**）。本批按**现状口径**书写（引-2），R3 落地时随迁移批串级扫替。

### 2.4 权威性与维护（B 式的代价处置）

迁移完成后：**基准层活档 = 权威**；产品树旧档 = **参照历史**（保留 ≠ 维护——`docs/README.md` §2）。同一话题在两者同时存在期间，**以基准层为准**；旧档不参与内容同步（「不逐字一致、不加跨面同步依赖」——多实现面纪律）。

## 3. 实点（逐层清点 · as-of 2026-09-15 实核）

> 范围 = `thincoder-vscode/docs/**` 全量 `.md`。**数以实点为准**（本表 = 机读清点结果，不引用任何口述数）。

| 层 | 档数 | 行数 | 说明 |
|---|---|---|---|
| `docs/design/*.md` | **50** | 13404 | 顶层设计板块档（含 `README.md` 地图） |
| `docs/design/_archive/*.md` | **17** | 723 | 归档区（退役 / 历史快照） |
| `docs/design/prompts/*.md` | **15** | 1026 | 中文提示词镜像（15 槽位） |
| `docs/requirements/*.md` | **34** | 2226 | 需求板块档（含 `README.md` 地图） |
| `docs/batches/*.md` | **34** | 8443 | 批次档（**不迁**——用户 2026-09-14 21:37「批次档不迁」） |
| 根层 `docs/*.md` | **3** | 625 | `README.md`（40）· `CAPABILITY_GAP.md`（57）· `COMPETITIVE_ANALYSIS.md`（528） |
| **合计** | **153** | **26447** | —— |

**二分底本（D3 口径）**：二分表底本 = `design`（50）+ `requirements`（34）= **84 档**；
**不在底本内**（逐层单列，逐层已给去向）：`_archive/` 17 · `prompts/` 15 · `batches/` 34 · 根层 3。

## 4. 二分表（84 档 · 逐档）

> 列义：**二分** = §2.1 二-1/二-2；**依据** = §2.1 依据列（①–④）；**落点** = §2.2。
> 落点为 `docs/core/…` 的行 = 统一面（P1）——**本批不写**（§8 待父侧另批）；落点为 `docs/vsc/…` 的行 = 本批写域。
> 行数 = as-of 2026-09-15 实核（口径同首注）。

### 4.1 设计层（`thincoder-vscode/docs/design/` —— 50 档）

| # | 档 | 行 | 二分 | 依据 | 落点 |
|---|---|---|---|---|---|
| 1 | `A2-SUMMARY-PARITY.md` | 66 | 历史 | ② 档头自述「已交付核销」——一次性施工记录 | 就地留 |
| 2 | `ACTIVITY-REWRITE-SIMPLE.md` | 154 | 历史 | ② 档头 `:10` 自述「位置形态已被取代」（2026-09-11 活动区回归批） | 就地留 |
| 3 | `ACTIVITY-SPLIT.md` | 97 | 历史 | ② 档头自述「已交付核销」；现态 = `thincoder-vscode/webview/activity.js` | 就地留 |
| 4 | `ADVISOR-CONVERGENCE.md` | 1426 | 活 | ① CLI 同名对位档（`DOC-SYSTEM` §5.2 列统一面） | `docs/core/design/ADVISOR-CONVERGENCE.md`（待建） |
| 5 | `AGENT-LOOP.md` | 1571 | 活 | ① `docs/core/design/AGENT-LOOP.md` | `docs/core/design/AGENT-LOOP.md` |
| 6 | `AGENT-PARAMS-TUNING.md` | 114 | 活 | ① CLI 同名对位档（§5.2 统一面） | `docs/core/design/AGENT-PARAMS.md`（待建） |
| 7 | `APPLY-PATCH.md` | 41 | 活 | ① `docs/core/design/APPLY-PATCH.md` | `docs/core/design/APPLY-PATCH.md` |
| 8 | `ARCHITECTURE.md` | 266 | 活 | ① CLI 同名档（§5.2 统一面）——两端各一份架构薄枢纽 | `docs/core/design/ARCHITECTURE.md`（待建） |
| 9 | `ASYNC-RESULT-CONTAINER.md` | 87 | 活 | ① CLI 同名对位档（§5.2 统一面） | `docs/core/design/ASYNC-RESULT-CONTAINER.md`（待建） |
| 10 | `CHECKPOINT.md` | 105 | 活 | ① `docs/core/design/CHECKPOINT.md` | `docs/core/design/CHECKPOINT.md` |
| 11 | `CONSULTATION.md` | 161 | 活 | ① `docs/core/design/CONSULTATION.md` | `docs/core/design/CONSULTATION.md` |
| 12 | `CONTEXT-COMPACTION.md` | 146 | 活 | ① `docs/core/design/CONTEXT-COMPACTION.md` | `docs/core/design/CONTEXT-COMPACTION.md` |
| 13 | `DESIGN-TOKEN-SETTLEMENT.md` | 109 | 活 | ① CLI 同名对位档（§5.2 统一面） | `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md`（待建） |
| 14 | `DOC-CODE-RECONCILE.md` | 488 | 活 | ① `DOC-SYSTEM` §5.2 明载其预期落点 = `docs/core/design/`（判据权威上迁） | `docs/core/design/DOC-CODE-RECONCILE.md`（待建） |
| 15 | `EDIT-HELPERS.md` | 72 | 活 | ① `docs/core/design/EDIT-HELPERS.md` | `docs/core/design/EDIT-HELPERS.md` |
| 16 | `EDIT.md` | 79 | 活 | ① `docs/core/design/EDIT.md` | `docs/core/design/EDIT.md` |
| 17 | `ENG-TOKEN-BINDING-TUNING.md` | 115 | 活 | ① CLI 同名对位档（§5.2 统一面） | `docs/core/design/ENG-TOKEN-BINDING.md`（待建） |
| 18 | `ENGINEERING-MODE.md` | 236 | 活 | ① CLI 同名档（§5.2 统一面）——两端各一份 | `docs/core/design/ENGINEERING-MODE.md`（待建） |
| 19 | `ESCALATE.md` | 166 | 活 | ① CLI 同名对位档（§5.2 统一面） | `docs/core/design/ESCALATE.md`（待建） |
| 20 | `GIT-ASYNC.md` | 81 | 历史 | ② 档头自述「已交付核销」；机制正文 = `docs/core/design/SESSION.md` | 就地留 |
| 21 | `HASHLINE-EDIT.md` | 45 | 活 | ① `docs/core/design/HASHLINE-EDIT.md` | `docs/core/design/HASHLINE-EDIT.md` |
| 22 | `IMAGE-DOWNGRADE-VISION.md` | 130 | 活 | ① 双端机制（贴图降级链）——CLI 同源面 | `docs/core/design/PROVIDER.md`（并入·贴图段） |
| 23 | `INSERT-AFTER.md` | 35 | 活 | ① `docs/core/design/INSERT-AFTER.md` | `docs/core/design/INSERT-AFTER.md` |
| 24 | `LEDGER-SELF-CONTAINED.md` | 867 | 活 | ① CLI 同名对位档（§5.2 统一面） | `docs/core/design/LEDGER-SELF-CONTAINED.md`（待建） |
| 25 | `MCP.md` | 170 | 活 | ① `docs/core/design/MCP.md` | `docs/core/design/MCP.md` |
| 26 | `MEMORY.md` | 325 | 活 | ① `docs/core/design/MEMORY.md` | `docs/core/design/MEMORY.md` |
| 27 | `PORTABILITY.md` | 458 | 活 | ① CLI 同名对位档（§5.2 统一面） | `docs/core/design/PORTABILITY.md`（待建） |
| 28 | `PROJECT-SWITCHER.md` | 75 | **活 · 专有** | ④ 多根工作区面板切换——VSC 独有（`thincoder-vscode/src/extension/panel-project.mjs`） | **`docs/vsc/design/PROJECT-SWITCHER.md`（本批实迁）** |
| 29 | `PROVIDER.md` | 463 | 活 | ① `docs/core/design/PROVIDER.md` | `docs/core/design/PROVIDER.md` |
| 30 | `QUEUED-VISIBILITY.md` | 86 | 历史 | ② 被 `ACTIVITY-REWRITE-SIMPLE` 取代（该档 `:137` supersedes 行点名） | 就地留 |
| 31 | `READ-HISTORY-SPLIT.md` | 76 | 历史 | ② 档头自述「已交付核销」；现态 = `thincoder-vscode/src/extension/history-window.mjs` | 就地留 |
| 32 | `README.md` | 141 | 历史 | ③ 产品树 `docs/design/` 的登记表与归属规则——树降格后随之退休 | 就地留 |
| 33 | `RELEASE.md` | 202 | 活 | ① CLI 同名对位档（§5.2 统一面） | `docs/core/design/RELEASE.md`（待建） |
| 34 | `REMOVE-POOL-SNAPSHOT.md` | 77 | 历史 | ② 撤销项（`QUEUED-VISIBILITY` F-3 回退）——一次性记录 | 就地留 |
| 35 | `SEND-STALL-DISTILL-TUNING.md` | 137 | 活 | ① CLI 同名对位档（§5.2 统一面） | `docs/core/design/SEND-STALL-DISTILL.md`（待建） |
| 36 | `SESSION-ACTIVITY-REVISED.md` | 126 | 历史 | ② 被 `ACTIVITY-REWRITE-SIMPLE` 取代（同 supersedes 行） | 就地留 |
| 37 | `SESSION-FLOW-A.md` | 87 | 历史 | ② 一次性交付核销；现行锚 = `WEBVIEW（VSC 侧）` §8 | 就地留 |
| 38 | `SESSION-FLOW-B.md` | 119 | 历史 | ② 同上（B2 已收编入 `WEBVIEW（VSC 侧）` §8.5） | 就地留 |
| 39 | `SESSION-FLOW-C.md` | 100 | 历史 | ② 同上（C 批即 `WEBVIEW（VSC 侧）` §8 现在位正文） | 就地留 |
| 40 | `SESSION-RESTORE-PARITY.md` | 104 | 历史 | ② 档头自述「已交付核销」；现态 = `SESSION（VSC 侧）` + `WEBVIEW（VSC 侧）` | 就地留 |
| 41 | `SESSION.md` | 520 | 活 | ① `docs/core/design/SESSION.md` | `docs/core/design/SESSION.md` |
| 42 | `SETTINGS.md` | 178 | **活 · 专有** | ④ webview 设置面板（5 卡信息架构 + 面板读写链）——VSC 独有面 | **`docs/vsc/design/SETTINGS.md`（本批实迁）** |
| 43 | `SUBAGENT-OBSERVE-SEND.md` | 79 | 活 | ① CLI 同名对位档（§5.2 统一面） | `docs/core/design/SUBAGENT-OBSERVE-SEND.md`（待建） |
| 44 | `TESTING.md` | 283 | 活 | ① CLI 同名对位档（§5.2 统一面） | `docs/core/design/TESTING.md`（待建） |
| 45 | `TOOL-OUTPUT-LIMITS-TUNING.md` | 139 | 活 | ① CLI 同名对位档（§5.2 统一面） | `docs/core/design/TOOL-OUTPUT-LIMITS.md`（待建） |
| 46 | `TOOLS.md` | 382 | 活 | ① `docs/core/design/TOOLS.md` | `docs/core/design/TOOLS.md` |
| 47 | `TURN-CAP-CONTINUE.md` | 208 | 活 | ① CLI 同名对位档（§5.2 统一面） | `docs/core/design/TURN-CAP-CONTINUE.md`（待建） |
| 48 | `VSC-PROMPTS.md` | 309 | **待核** | 见 §7（两种读法） | 待核 |
| 49 | `WEBVIEW.md` | 1867 | **活 · 专有** | ④ webview 前端 + 消息协议——VSC 独有（CLI 对偶 = 终端 TUI，两者不镜像） | `docs/vsc/design/WEBVIEW.md`（**批 2**——见 §6） |
| 50 | `WRITE.md` | 36 | 活 | ① `docs/core/design/WRITE.md` | `docs/core/design/WRITE.md` |

### 4.2 需求层（`thincoder-vscode/docs/requirements/` —— 34 档）

| # | 档 | 行 | 二分 | 依据 | 落点 |
|---|---|---|---|---|---|
| 1 | `ADVISOR-CONVERGENCE.md` | 57 | 活 | ① CLI 同名对位档（§5.2 统一面） | `docs/core/requirements/ADVISOR-CONVERGENCE.md`（待建） |
| 2 | `AGENT-LOOP.md` | 356 | 活 | ① `docs/core/requirements/AGENT-LOOP.md` | `docs/core/requirements/AGENT-LOOP.md` |
| 3 | `AGENT-PARAMS.md` | 42 | 活 | ① CLI 同名对位档 | `docs/core/requirements/AGENT-PARAMS.md`（待建） |
| 4 | `ASYNC-RESULT-CONTAINER.md` | 45 | 活 | ① CLI 同名对位档 | `docs/core/requirements/ASYNC-RESULT-CONTAINER.md`（待建） |
| 5 | `CHECKPOINT.md` | 49 | 活 | ① `docs/core/requirements/CHECKPOINT.md` | `docs/core/requirements/CHECKPOINT.md` |
| 6 | `CONSULTATION.md` | 46 | 活 | ① `docs/core/requirements/CONSULTATION.md` | `docs/core/requirements/CONSULTATION.md` |
| 7 | `CONTEXT-COMPACTION.md` | 46 | 活 | ① `docs/core/requirements/CONTEXT-COMPACTION.md` | `docs/core/requirements/CONTEXT-COMPACTION.md` |
| 8 | `DESIGN-TOKEN-SETTLEMENT.md` | 42 | 活 | ① CLI 同名对位档 | `docs/core/requirements/DESIGN-TOKEN-SETTLEMENT.md`（待建） |
| 9 | `ENG-TOKEN-BINDING.md` | 48 | 活 | ① CLI 同名档 | `docs/core/requirements/ENG-TOKEN-BINDING.md`（待建） |
| 10 | `ENGINEERING-MODE.md` | 137 | 活 | ① CLI 同名档（§5.2 统一面） | `docs/core/requirements/ENGINEERING-MODE.md`（待建） |
| 11 | `ESCALATE.md` | 41 | 活 | ① CLI 同名对位档 | `docs/core/requirements/ESCALATE.md`（待建） |
| 12 | `FEATURES.md` | 21 | 活 | ① CLI 同名对位档 | `docs/core/requirements/FEATURES.md`（待建） |
| 13 | `LOGGING.md` | 37 | 活 | ① `docs/core/requirements/LOGGING.md` | `docs/core/requirements/LOGGING.md` |
| 14 | `MCP.md` | 46 | 活 | ① `docs/core/requirements/MCP.md` | `docs/core/requirements/MCP.md` |
| 15 | `MEMORY.md` | 50 | 活 | ① `docs/core/requirements/MEMORY.md` | `docs/core/requirements/MEMORY.md` |
| 16 | `MULTI-INSTANCE-COLLAB.md` | 44 | 活 | ① CLI 同名对位档 | `docs/core/requirements/MULTI-INSTANCE-COLLAB.md`（待建） |
| 17 | `NORMAL-MODE.md` | 37 | 活 | ① CLI 同名对位档 | `docs/core/requirements/NORMAL-MODE.md`（待建） |
| 18 | `PHILOSOPHY.md` | 136 | 活 | ① CLI 同名对位档 | `docs/core/requirements/PHILOSOPHY.md`（待建） |
| 19 | `PORTABILITY.md` | 51 | 活 | ① CLI 同名对位档 | `docs/core/requirements/PORTABILITY.md`（待建） |
| 20 | `PROJECT.md` | 118 | 活 | ① CLI 同名对位档 | `docs/core/requirements/PROJECT.md`（待建） |
| 21 | `README.md` | 154 | 历史 | ③ 产品树 `docs/requirements/` 的登记表——树降格后随之退休 | 就地留 |
| 22 | `RELEASE.md` | 42 | 活 | ① CLI 同名对位档 | `docs/core/requirements/RELEASE.md`（待建） |
| 23 | `SEND-STALL-DISTILL.md` | 40 | 活 | ① CLI 同名对位档 | `docs/core/requirements/SEND-STALL-DISTILL.md`（待建） |
| 24 | `SESSION.md` | 52 | 活 | ① `docs/core/requirements/SESSION.md` | `docs/core/requirements/SESSION.md` |
| 25 | `SETTINGS-TOOL.md` | 37 | 活 | ① CLI 同名对位档 | `docs/core/requirements/SETTINGS-TOOL.md`（待建） |
| 26 | `STRUCTURE-DEBT.md` | 34 | 活 | ① CLI 同名对位档 | `docs/core/requirements/STRUCTURE-DEBT.md`（待建） |
| 27 | `SUBAGENT-OBSERVE-SEND.md` | 41 | 活 | ① CLI 同名对位档 | `docs/core/requirements/SUBAGENT-OBSERVE-SEND.md`（待建） |
| 28 | `TESTING.md` | 87 | 活 | ① CLI 同名对位档 | `docs/core/requirements/TESTING.md`（待建） |
| 29 | `TOOL-OUTPUT-LIMITS.md` | 47 | 活 | ① CLI 同名对位档 | `docs/core/requirements/TOOL-OUTPUT-LIMITS.md`（待建） |
| 30 | `TOOLS.md` | 47 | 活 | ① `docs/core/requirements/TOOLS.md` | `docs/core/requirements/TOOLS.md` |
| 31 | `TURN-CAP-CONTINUE.md` | 45 | 活 | ① CLI 同名对位档 | `docs/core/requirements/TURN-CAP-CONTINUE.md`（待建） |
| 32 | `VERIFY-REDESIGN.md` | 34 | 活 | ① CLI 同名对位档 | `docs/core/requirements/VERIFY-REDESIGN.md`（待建） |
| 33 | `VSC-PROMPTS.md` | 46 | **待核** | 见 §7（异名对位 `PROMPT-SYSTEM`——两种读法） | 待核 |
| 34 | `WEBVIEW.md` | 71 | **活 · 专有** | ④ webview 界面面（对端 = 终端 TUI，异名对位） | **`docs/vsc/requirements/WEBVIEW.md`（本批实迁）** |

### 4.3 小计与闭合（D3）

| 分类 | 设计 | 需求 | 合计 | 闭合基数 |
|---|---|---|---|---|
| 活 · 统一面（P1 → `docs/core/`） | 33 | 31 | **64** | —— |
| 活 · 专有面（P2 → `docs/vsc/`） | 3 | 1 | **4** | —— |
| 待核（§7） | 1 | 1 | **2** | —— |
| 历史（就地留） | 13 | 1 | **14** | —— |
| **合计** | **50** | **34** | **84** | = §3 二分底本（84）✓ |

**逐行可复核**：50 = 33+3+1+13 · 34 = 31+1+1+1 · 84 = 64+4+2+14。

## 5. 历史档（就地留）——为何不迁

历史档**不是垃圾**：`docs/README.md` §2 裁定「旧档不批量搬——保留原地作参照」；树降格后它们 = **迁移期参照历史**（保留 ≠ 维护）。判据（二-2）= 一次性交付记录 ∨ 已被本树另一档显式取代。上一节逐档给了依据列，本节不再重复（D2）。

**一处口径注记**：本节标题与 §4 表的「历史」行指向同一集合（设计 13 + 需求 1 = 14），不另立数。

## 6. 分批计划（批序 · 每批 ≤6 档 · 写域）

| 批 | 内容 | 源档数 | 落点 | 写域 | 状态 |
|---|---|---|---|---|---|
| **批 1** | VSC 专有面（P2）**可迁部分** | 3 | `docs/vsc/design/SETTINGS.md` · `docs/vsc/design/PROJECT-SWITCHER.md` · `docs/vsc/requirements/WEBVIEW.md` | `docs/vsc/**` | **本批已落**（§9 记录） |
| **批 2** | `WEBVIEW（VSC 侧）`（1867 行）——**必拆** | 1 | 计划产物两名 = `WEBVIEW.md` + `WEBVIEW-PROTOCOL.md`（**未建**——按计划产物形态写裸档名，不写仓根路径；see §14 用例 6） | `docs/vsc/design/**` | 待排（**需先拆**——见下） |
| **批 3+** | 统一面（P1）**64 档**——分组并入 `docs/core/` | 64 | §8 逐条给定 | `docs/core/**` | **待父侧另批**（父侧 2026-09-15 收紧写域） |
| **收尾批** | 产品树两份地图（`design/README.md` · `requirements/README.md`）随树降格处置 | 2 | —— | 父侧 | 待排 |

**批 2 的拆分规划（本批先给，执行时照办）**：`WEBVIEW（VSC 侧）` 实测 **1867 行**（超 500 硬限 ⇒ **必拆**）。
实核其构成：**一次性批次材料 846 行**（7 处焊接进来的批设计段——各含问题陈述 / 方案选型 / 受影响文件 / 用例表 / 验收标准 / 边界），**正文 1013 行**（含 75 行变更记录）。
⇒ 迁移做法 = 先剔批材料（按 §2.1 二-1 只重建**机制与契约**）+ 按面拆两档：
布局 / 文件结构 / 消息流 / 活动块 / 组件（§1–§6 + §12–§14）→ `WEBVIEW.md`；消息协议 / 消息秩序 / 输入面 / 转义 / 输入历史（§7–§11）→ `WEBVIEW-PROTOCOL.md`。
**拆后各档仍超 500 ⇒ 再拆第三档（活动区面）**——执行批以实测决定，不预设。

## 7. 待核（判不准——**不静默归类**）

| # | 档 | 读法 A | 读法 B | 依据（两侧各自可见） |
|---|---|---|---|---|
| 1 | `design/VSC-PROMPTS.md`（309） | **P1 统一面**——提示词系统在两部分都有；CLI 对位档 = `PROMPT-SYSTEM`（`DOC-SYSTEM` §5.2 列统一面）⇒ 落 `docs/core/design/PROMPT-SYSTEM.md` | **P2 专有面**——本档承载的是「本端双源 + 端特有差异」（`docs/design/prompts/` 中文权威 ↔ `src/prompts/` 英文落地），属端实现面 ⇒ 落 `docs/vsc/design/VSC-PROMPTS.md` | A：档头自述「异名/同名对位」+ §5.2 统一面名单；B：`DOC-SYSTEM` §6 N-d（正本 ↔ 落地档不同域）+ `docs/design/README.md`「镜像差异表」9 行 |
| 2 | `requirements/VSC-PROMPTS.md`（46） | **P1**——同上（需求层对位 `PROMPT-SYSTEM（CLI 仓·需求）`） | **P2**——需求正文是「本端 15 档双源 + 端特有段」的实现面登记 | 同上；另：`PROMPT-SYSTEM` 正本已落 `docs/core/design/prompts/`（15 档）——**待裁点** = 产品树中文镜像是否需要独立活档，或即参照历史 |
| 3 | `design/prompts/*.md`（15 档 · 1026 行） | **历史**——正本已在 `docs/core/design/prompts/`（15 档），产品树副本 = 迁移期参照历史 | **P2**——「镜像差异表」登记的 9 处端差是**活信息**，无其他住处 | 差异登记表住 `thincoder-vscode/docs/design/README.md`（该档本身已判历史）⇒ 差异信息存在**孤岛风险**，须一并裁 |

> **待核不下结论**：三条均须**用户/主 agent 裁定**后方可迁（本批零写入）。判据缺口：`DOC-SYSTEM` §5.1 的 P1/P2 对「镜像面」无专条——建议随 §8 声明面批次补一条「**镜像面**（正本在 core、产品树副本 = 参照历史）」判据句。

## 8. 待父侧另批（统一面 64 档——本批**不写**）

**背景**：父侧 2026-09-15 收紧本批写域为「只许 `docs/vsc/**`」——理由 = 与并行在跑的 CLI 迁移批（写 `docs/core/design/**`）目标文件可能重合。凡判为统一面的 VSC 档 ⇒ **本批零写入**，逐条列此节，由父侧**串行另派**。

**分布**（逐档目标见 §4 表的「落点」列——此处不重述，D2；本节只给**分组**与**需新建的 core 档清单**）：

| 组 | 档数 | 目标 |
|---|---|---|
| 已有 core 同名活档（并入该档） | 14 | `docs/core/design/` 的 AGENT-LOOP · APPLY-PATCH · CHECKPOINT · CONSULTATION · CONTEXT-COMPACTION · EDIT · EDIT-HELPERS · HASHLINE-EDIT · INSERT-AFTER · MCP · MEMORY · PROVIDER · SESSION · TOOLS · WRITE；`docs/core/requirements/` 的 AGENT-LOOP · CHECKPOINT · CONSULTATION · CONTEXT-COMPACTION · LOGGING · MCP · MEMORY · SESSION · TOOLS |
| **需新建**的 core 档 | 50 | §4 表中落点标「（待建）」者——两产品对位档先并在 core 建一份，VSC 侧内容随批并入 |

**串行纪律**：本组目标在 `docs/core/**` ⇒ 与 CLI 批**同文件竞争**——两批**不得并行**（父侧排队）。

## 9. 本批实迁记录（批 1）

| # | 源档（VSC 侧·一字未改） | 行数 | 落点（基准层活档） | 行数 | Δ |
|---|---|---|---|---|---|
| 1 | `thincoder-vscode/docs/design/SETTINGS.md` | 178 | `docs/vsc/design/SETTINGS.md` | 128 | -50 |
| 2 | `thincoder-vscode/docs/design/PROJECT-SWITCHER.md` | 75 | `docs/vsc/design/PROJECT-SWITCHER.md` | 97 | +22 |
| 3 | `thincoder-vscode/docs/requirements/WEBVIEW.md` | 71 | `docs/vsc/requirements/WEBVIEW.md` | 91 | +20 |

**逐档并入 / 不并**：见各落点档的「不并项与历史沿革」节（逐项：旧档节 + 何故）——本表不重复（D2）。

## 10. 受影响文件清单（R24a）

| # | 档 | 当前行数 | 预计增量 | 动作 |
|---|---|---|---|---|
| 1 | `docs/vsc/requirements/VSC-MIGRATION.md` | 0（新建） | +46 | **新建**——需求档（F-M1–F-M6 / N-M1–N-M6） |
| 2 | `docs/vsc/design/VSC-MIGRATION.md`（本档） | 0（新建） | +329 | **新建**——设计档（实点 / 二分 / 分批 / 验收） |
| 3 | `docs/vsc/design/SETTINGS.md` | 0（新建） | +128 | **新建**——B 式重建（源 = VSC 树 `SETTINGS.md`） |
| 4 | `docs/vsc/design/PROJECT-SWITCHER.md` | 0（新建） | +97 | **新建**——B 式重建 |
| 5 | `docs/vsc/requirements/WEBVIEW.md` | 0（新建） | +91 | **新建**——B 式重建 |
| 6 | `scripts/check-doc-width-core.mjs` | 287 | +0（常量行内改） | **实修**——`SCAN_DIRS` 加 `docs/vsc/design` · `docs/vsc/requirements` |
| 7 | `scripts/doc-anchors-v5.mjs` | 256 | +0（常量行内改） | **实修**——`V5_SCAN_DIRS` 同上 |
| 8 | `docs/batches/2026-09-15-vsc-doc-migration.md` | 35 | +本档 §2 | **append**——§2（不改 §1） |

**待落（本批边界外——逐条上报）**：§8 的统一面 64 档（`docs/core/**`）· §7 待核 3 条（裁定后）· 批 2 的 WEBVIEW 拆分（`docs/vsc/design/**`）。

**拆分规划（R24a）**：本档为新建规划档，其体量实测见 §13。

## 11. 关键决策记录

| # | 决策 | 依据 / 否决备选 |
|---|---|---|
| D-VM1 | 迁移方式 = **B 式**（旧档留原地 + 内容重建入基准层） | §1.1——用户 2026-09-14 23:02 裁定 + CLI 轮已落形态（跨部分形态一致）；否决 A 式 `git mv`（批次材料随迁）· 纯统计轮 |
| D-VM2 | 二分底本 = `design` + `requirements` 顶层（84 档）；`_archive/` · `prompts/` · `batches/` · 根层 3 档**逐层单列** | §3——口径与 `DOC-SYSTEM` §5.2 的 CLI 侧底本一致（84）；判据 = 二分表只收「板块档」 |
| D-VM3 | 依据列取值 = ① core 同话题活档 ∥ ② 已被取代 ∥ ③ 核内已单源化 ∥ ④ 结构性不对称 | §2.1——承用户任务书的 ③ 项并要求，补 ④（P2 判据的可复核形态） |
| D-VM4 | 迁移期引用 = **引-2**（未迁档用 `名称（VSC 侧）§N`） | §2.3——`R3`（仓根全路径）**未实装**（V1 缺「带 `/` 的 `.md` 按仓根解析」支）；现状口径见 `DOC-SYSTEM` §14 T7 |
| D-VM5 | 本批只写 `docs/vsc/**`；统一面 64 档**列而不写** | §1.2 / §8——父侧 2026-09-15 收紧写域（防与 CLI 批同文件互覆盖） |
| D-VM6 | 新建目录同批入射程（两扫描器常量） | §10 行 6–7——今晚实证「搬档不改射程 ⇒ 无守卫窗口 + 假绿」 |
| D-VM7 | 待核 3 条**不下结论**、零写入 | §7——任务书明令「判不准 ⇒ 单列待核，不静默归类」 |

## 12. 验收标准（逐条回指 F-M / N-M）

| # | 验收标准（机器可验） | 回指 |
|---|---|---|
| **A-VM1** | 实点表逐层档数 + 行数在档；二分表四行 disjoint 加总 = 84 = 底本（§3 / §4.3 双向闭合） | F-M1 |
| **A-VM2** | 二分表 84 行依据列逐行非空；「待核」3 条（§7）各含两种读法 + 依据 | F-M2 · N-M1 |
| **A-VM3** | 落点档 ≥1 档实体在 `docs/vsc/**`，且源档字节零改（`git status` 无 `thincoder-vscode/**`） | F-M3 · N-M6 |
| **A-VM4** | 各落点档含「不并项与历史沿革」节；无状态行 / 无逐批变更流水 | F-M4 |
| **A-VM5** | 落点档内每条 `文件:行` 断言按现状实核（本批发现源档坐标漂移 2 处 ⇒ 按现状改写，见 §2.4 注） | F-M5 |
| **A-VM6** | `node scripts/doc-anchors.mjs` **根域悬空 = 0**；`SCAN_DIRS` / `V5_SCAN_DIRS` 含新目录且改后档数 > 改前 | F-M6 · N-M2 · N-M4 |
| **A-VM7** | 新增档无 >300 字符单行（表格行豁免）；无 >500 行档 | N-M3 |
| **A-VM8** | `git status` 改动集 = `docs/vsc/**` + `scripts/**` 两处常量行 + 批次档 §2（无其他） | N-M5 |

## 13. 体量与拆分规划（R24a）

**实测行数**：本档 **329 行**（新建 · 终稿实核）——**已超 300 行软线，低于 500 行硬限 ⇒ 给拆分规划，不强制拆**。
**拆分面（已激活）**：超线主因 = §4 二分表（84 行表体 + 小计）。
**拆分规划** = 二分表随迁移推进**移入独立迁移台账**（计划产物裸名 = `VSC-MIGRATION-INVENTORY.md`——产物未建，按计划产物形态写裸档名），
规划档只留：判据（§2）· 分批计划（§6）· 待核（§7）· 待父侧另批（§8）· 受影响文件与决策（§10–§11）。**拆分执行点 = 批 3 起（二分表需逐批补「已迁」列时）**（承 `DOC-SYSTEM` §11 的同一拆分口径）。

## 14. 用例表（正常 / 边界 / 错误）

> 本板块**无运行期代码**（纯文档面 + 两处常量行）⇒ 用例 = **机检谓词在样本档上的行为**，验证方式 = 仓根三机检 + 人工复核。

| # | 类 | 输入 | 期望输出 |
|---|---|---|---|
| 1 | 正常 | `node scripts/doc-anchors.mjs` | 根域汇总 **悬空 0** · `OK(V5)` |
| 2 | 正常 | `node scripts/check-doc-width.mjs` | 「无 >300 字符单行」+ 一致性新增违规不因本批增加 |
| 3 | 正常 | `node scripts/check-ledger.mjs` | 台账两档 `OK` · 0 处违规 |
| 4 | 边界 | 落点档内的未迁档引用（引-2 形态） | V1 不入判；V5-A 路径形态按仓根命中原档 |
| 5 | 边界 | 落点档内的产品树相对坐标（如 `webview/ui.js:445`） | **改写后**为 `thincoder-vscode/webview/ui.js:445` ⇒ 仓根解析命中；未改写形态 = 悬空（反向夹具） |
| 6 | 错误 | **计划产物**写成仓根全路径（`docs/vsc/design/<待建档>.md` 形态——带目录前缀） | V5-A 判**悬空**（该 basename 仓内计数 0 且路径不解析）——**本批实证**：初稿 §6 批 2 行的落点即此形态，首跑红 1 处；改为**裸档名**后归零。**结论**：计划产物一律写裸档名 / `<占位>` 形态（判据缺口 = `DOC-SYSTEM` §12 末注「计划产物无合法锚形态」——本批又一头实证） |

## 15. 边界（本设计不做）

1. **不写 `docs/core/**`**（父侧 2026-09-15 收紧）——统一面 64 档只列不写。
2. **不写产品树**：`thincoder-vscode/**` 零写入（含注释）；`thincoder-cli/**` · `thincoder-core/**` 零写入。
3. **不写台账 / 提示词 / 批次档**：`docs/TODO.md` 零写入；提示词文件零写入；批次档只 append §2。
4. **不 commit、不发起评审**（发起权 = 用户）。
5. **不裁定待核 3 条**（§7 只给读法与依据）。
6. **不迁批次档 / `_archive/`**（用户 2026-09-14 21:37「批次档不迁」；归档区 = 历史快照）。
7. **本档不含 UI / 交互决策**（迁移规划无界面面）——**显式声明豁免**，非遗漏；落点档 SETTINGS / PROJECT-SWITCHER 各自的 UI 决策随档落 §「UI / 交互决策落档」。

## 16. 变更记录

- 2026-09-15（**B 式迁移轮 · VSC 第 1 批**）：建档——实点（§3）· 二分表（§4 · 84 档逐档）· 待核（§7）· 分批计划（§6）· 待父侧另批（§8）· 本批实迁记录（§9）；同批实修两扫描器射程（`SCAN_DIRS` / `V5_SCAN_DIRS`）。
