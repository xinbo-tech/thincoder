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
| **引-1** | 已迁入基准层的档 | 裸名 + 节号（同部分**同层**）∥ **带层前缀**（同部分跨层，`design/X.md §N` / `requirements/X.md §N`——承 `DOC-SYSTEM` §7 R2）∥ 仓根相对全路径（跨部分） | V1 解析（按 basename，域内）；V5-A 排除式 5① 让给 V1 |
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

> 列义（**批 3 复判后**）：**判** = 活 · 统一面 / 活 · 专有（P2）/ 历史 / 待核（四值列义与复判修订见 §4.4）；**依据** = §2.1 依据列（①–④）；**动作** = 并入既有 / 新建 / 不迁（就地留）/ 另落 `docs/vsc/`。
> 落点为 `docs/core/…` 的行 = 统一面（P1）——**根层无同话题档者本批已建 6 档**（§9.3），余者列 §8；落点为 `docs/vsc/…` 的行 = VSC 专有面（批 1 / 批 2 已迁部分）。
> 行数 = as-of 2026-09-15 实核（口径同首注）；判 = **复判结论**（批 3——承用户 2026-09-14 21:37 裁定 + `DOC-SYSTEM` §5.1 P1–P5）。

### 4.1 设计层（`thincoder-vscode/docs/design/` —— 50 档）

| # | 档 | 行 | 判 | 依据 | 动作 / 落点 |
|---|---|---|---|---|---|
| 1 | `A2-SUMMARY-PARITY.md` | 66 | 历史 | ② 档头自述「已交付核销」——正文 = 施工骨架（需求/设计/受影响文件/验收） | 不迁（就地留） |
| 2 | `ACTIVITY-REWRITE-SIMPLE.md` | 154 | 历史 | ② 档头 `:10` 自述「位置形态已被取代」（2026-09-11 活动区回归批） | 不迁（就地留） |
| 3 | `ACTIVITY-SPLIT.md` | 97 | 历史 | ② 档头自述「已交付核销」；现态 = `thincoder-vscode/webview/activity.js` | 不迁（就地留） |
| 4 | `ADVISOR-CONVERGENCE.md` | 1426 | 活 · 统一面 | ① **核层同名档已由并行 CLI 批建**（`docs/core/design/ADVISOR-CONVERGENCE.md` + `ADVISOR-GUARDS.md`）；机制在现行代码在位（`thincoder-vscode/src/advisor/`） | **并入既有**——VSC 面内容未并 ⇒ 转 §8B（须拆分） |
| 5 | `AGENT-LOOP.md` | 1571 | 活 · 统一面 | ① `docs/core/design/AGENT-LOOP.md` 在位（670 行）——其 §6 为 CLI 档并入面 | **并入既有** → 待父侧另批（§8B-1） |
| 6 | `AGENT-PARAMS-TUNING.md` | 114 | 活 · 统一面 | ① `docs/core/design/AGENT-PARAMS.md` 在位；该档 `:114` 登记「VSC 端 30 硬帽 ⇒ 归 VSC 轮」 | **并入既有** → 待父侧另批（§8B-2） |
| 7 | `APPLY-PATCH.md` | 41 | 活 · 统一面 | ① `docs/core/design/APPLY-PATCH.md` 在位 | **并入既有**（§8B-13） |
| 8 | `ARCHITECTURE.md` | 266 | 活 · 统一面 | ① `docs/core/design/ARCHITECTURE.md` 在位；该档 `:6` 明载「VSC 侧未迁——VSC 轮并入本档」 | **并入既有** → 待父侧另批（§8B-3） |
| 9 | `ASYNC-RESULT-CONTAINER.md` | 87 | **历史**（复判修订 §4.4-1） | ② 机制结论已由 `docs/core/design/AGENT-LOOP.md` §6.7.3（`:332`）+ `:175`（`async-settle.mjs` helper 登记）承载；正文 = 施工骨架 | 不迁（就地留） |
| 10 | `CHECKPOINT.md` | 105 | 活 · 统一面 | ① `docs/core/design/CHECKPOINT.md` 在位 | **并入既有**（§8B-11） |
| 11 | `CONSULTATION.md` | 161 | 活 · 统一面 | ① `docs/core/design/CONSULTATION.md` 在位；其 §6.4 明标「CLI 实现接线」 | **并入既有**（§8B-12） |
| 12 | `CONTEXT-COMPACTION.md` | 146 | 活 · 统一面 | ① `docs/core/design/CONTEXT-COMPACTION.md` 在位 | **并入既有**（§8B-9） |
| 13 | `DESIGN-TOKEN-SETTLEMENT.md` | 109 | 活 · 统一面 | ① `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` 在位 | **并入既有**（§8B-17） |
| 14 | `DOC-CODE-RECONCILE.md` | 488 | 活 · 统一面 | ① 根层无同话题档；`docs/core/design/DOC-SYSTEM.md` §5.2（`:164`）明载其预期落点 = `docs/core/design/` | **已迁（批 4）**——落 `docs/core/design/DOC-CODE-RECONCILE.md`（§9.4） |
| 15 | `EDIT-HELPERS.md` | 72 | 活 · 统一面 | ① `docs/core/design/EDIT-HELPERS.md` 在位 | **并入既有**（§8B-13） |
| 16 | `EDIT.md` | 79 | 活 · 统一面 | ① `docs/core/design/EDIT.md` 在位 | **并入既有**（§8B-13） |
| 17 | `ENG-TOKEN-BINDING-TUNING.md` | 115 | 活 · 统一面 | ① `docs/core/design/ENG-TOKEN-BINDING.md` 在位 | **并入既有**（§8B-16） |
| 18 | `ENGINEERING-MODE.md` | 236 | 活 · 统一面 | ① **核层同名档已由并行 CLI 批建**（`docs/core/design/ENGINEERING-MODE.md` 等四档）；机制在现行代码在位 | **并入既有**——VSC 面内容未并 ⇒ 转 §8B（须拆分） |
| 19 | `ESCALATE.md` | 166 | 活 · 统一面 | ① 根层无同话题档（`docs/core/design/CONSULTATION.md` §8.2 `:215` 越段登记） | **本批新建** `docs/core/design/ESCALATE.md`（§9.3） |
| 20 | `GIT-ASYNC.md` | 81 | 历史 | ② 档头自述「已交付核销」；机制正文 = `docs/core/design/SESSION.md` | 不迁（就地留） |
| 21 | `HASHLINE-EDIT.md` | 45 | 活 · 统一面 | ① `docs/core/design/HASHLINE-EDIT.md` 在位 | **并入既有**（§8B-13） |
| 22 | `IMAGE-DOWNGRADE-VISION.md` | 130 | 活 · 统一面 | ① `docs/core/design/PROVIDER.md` 在位；该档 §6 节清单无图片 / 贴图面（实核） | **并入既有**（§8B-4） |
| 23 | `INSERT-AFTER.md` | 35 | 活 · 统一面 | ① `docs/core/design/INSERT-AFTER.md` 在位 | **并入既有**（§8B-13） |
| 24 | `LEDGER-SELF-CONTAINED.md` | 867 | 活 · 统一面 | ① **核层同名档已由并行 CLI 批建**（`docs/core/design/LEDGER-SELF-CONTAINED.md` + `LEDGER.md`） | **并入既有**——VSC 面内容未并 ⇒ 转 §8B（必拆） |
| 25 | `MCP.md` | 170 | 活 · 统一面 | ① `docs/core/design/MCP.md` 在位 | **并入既有**（§8B-10） |
| 26 | `MEMORY.md` | 325 | 活 · 统一面 | ① `docs/core/design/MEMORY.md` 在位 | **并入既有**（§8B-8） |
| 27 | `PORTABILITY.md` | 458 | 活 · 统一面 | ① `docs/core/design/PORTABILITY.md` 在位；该档 `:6`/`:124` 明载「VSC 轮并入本档」 | **并入既有**（§8B-5） |
| 28 | `PROJECT-SWITCHER.md` | 75 | 活 · 专有 | ④ 多根工作区面板切换——VSC 独有（`thincoder-vscode/src/extension/panel-project.mjs`） | **已迁** `docs/vsc/design/PROJECT-SWITCHER.md`（§9.1） |
| 29 | `PROVIDER.md` | 463 | 活 · 统一面 | ① `docs/core/design/PROVIDER.md` 在位 | **并入既有**（§8B-7） |
| 30 | `QUEUED-VISIBILITY.md` | 86 | 历史 | ② 被 `ACTIVITY-REWRITE-SIMPLE` 取代（该档 `:137` supersedes 行点名） | 不迁（就地留） |
| 31 | `READ-HISTORY-SPLIT.md` | 76 | 历史 | ② 档头自述「已交付核销」；现态 = `thincoder-vscode/src/extension/history-window.mjs` | 不迁（就地留） |
| 32 | `README.md` | 141 | 历史 | ③ 产品树 `docs/design/` 的登记表与归属规则——树降格后随之退休 | 不迁（就地留） |
| 33 | `RELEASE.md` | 202 | **活 · 专有（P2）**（复判修订 §4.4-3） | ② 发布通道结构性只属本产品（Marketplace + Open VSX；对端 = npm）⇒ P5「P2 > P1」；CLI 同判 | **另落** `docs/vsc/design/RELEASE.md` → **归属疑变 · 待裁**（§7） |
| 34 | `REMOVE-POOL-SNAPSHOT.md` | 77 | 历史 | ② 撤销项（一次性记录——快照机制无场景应撤） | 不迁（就地留） |
| 35 | `SEND-STALL-DISTILL-TUNING.md` | 137 | 活 · 统一面 | ① 根层无同话题档（`CONTEXT-COMPACTION.md` §6.9 为蒸馏本体、时序面无对应） | **本批新建** `docs/core/design/SEND-STALL-DISTILL.md`（§9.3） |
| 36 | `SESSION-ACTIVITY-REVISED.md` | 126 | 历史 | ② 被 `ACTIVITY-REWRITE-SIMPLE` 取代（同 supersedes 行）；余为沿革 | 不迁（就地留） |
| 37 | `SESSION-FLOW-A.md` | 87 | 历史 | ② 一次性交付核销；现行锚 = `WEBVIEW（VSC 侧）` §8 | 不迁（就地留） |
| 38 | `SESSION-FLOW-B.md` | 119 | 历史 | ② 同上（B2 已收编入 `WEBVIEW（VSC 侧）` §8.5） | 不迁（就地留） |
| 39 | `SESSION-FLOW-C.md` | 100 | 历史 | ② 同上（C 批即 `WEBVIEW（VSC 侧）` §8 现在位正文） | 不迁（就地留） |
| 40 | `SESSION-RESTORE-PARITY.md` | 104 | 历史 | ② 档头自述「已交付核销」；现态 = `SESSION（VSC 侧）` + `WEBVIEW（VSC 侧）` | 不迁（就地留） |
| 41 | `SESSION.md` | 520 | 活 · 统一面 | ① `docs/core/design/SESSION.md` 在位 | **并入既有**（§8B-6） |
| 42 | `SETTINGS.md` | 178 | 活 · 专有 | ④ webview 设置面板（5 卡信息架构 + 面板读写链）——VSC 独有面 | **已迁** `docs/vsc/design/SETTINGS.md`（§9.1） |
| 43 | `SUBAGENT-OBSERVE-SEND.md` | 79 | **历史**（复判修订 §4.4-2） | ② 契约正文已由 `docs/core/design/AGENT-LOOP.md` §6.7.2（`:297`-`:311`，observe / send 契约与载荷表）承载；正文 = 施工骨架 | 不迁（就地留） |
| 44 | `TESTING.md` | 283 | 活 · 统一面 | ① **核层同名档已由并行 CLI 批建**（`docs/core/design/TESTING.md` + `E2E-HARNESS.md`）；机制在现行代码在位（测试基建族） | **并入既有**——VSC 面内容未并 ⇒ 转 §8B |
| 45 | `TOOL-OUTPUT-LIMITS-TUNING.md` | 139 | 活 · 统一面 | ① `docs/core/design/TOOL-OUTPUT-LIMITS.md` 在位；该档 `:99` 登记「VSC 树档未迁」 | **并入既有**（§8B-15） |
| 46 | `TOOLS.md` | 382 | 活 · 统一面 | ① `docs/core/design/TOOLS.md` 在位 | **并入既有**（§8B-14） |
| 47 | `TURN-CAP-CONTINUE.md` | 208 | 活 · 统一面 | ① 根层无同话题档（核侧仅 `AGENT-LOOP.md` §6.1/§6.2 局部）；机制在现行代码在位 | **本批新建** `docs/core/design/TURN-CAP-CONTINUE.md`（§9.3） |
| 48 | `VSC-PROMPTS.md` | 309 | 待核 → **已销项** | ③ 镜像面——既有裁定 = 原地保留不动（§7） | 不迁（就地留） |
| 49 | `WEBVIEW.md` | 1867 | 活 · 专有 | ④ webview 前端 + 消息协议——VSC 独有（CLI 对偶 = 终端 TUI，两者不镜像） | **已迁（批 2）**——拆三档（§9.2） |
| 50 | `WRITE.md` | 36 | 活 · 统一面 | ① `docs/core/design/WRITE.md` 在位 | **并入既有**（§8B-13） |

### 4.2 需求层（`thincoder-vscode/docs/requirements/` —— 34 档）

| # | 档 | 行 | 判 | 依据 | 动作 / 落点 |
|---|---|---|---|---|---|
| 1 | `ADVISOR-CONVERGENCE.md` | 57 | 活 · 统一面 | ① 根层无对应（`docs/core/design/CONSULTATION.md` §8.2 越段登记——条目未并入） | **新建** `docs/core/requirements/ADVISOR-CONVERGENCE.md` → 待父侧另批（§8A） |
| 2 | `AGENT-LOOP.md` | 355 | 活 · 统一面 | ① `docs/core/requirements/AGENT-LOOP.md` 在位；该档 §5（`:129`-`:132`）显式登记「VSC 面需求节 ⇒ 归属 `docs/vsc/requirements/`」 | **归属疑变 · 待裁**（§7）——VSC 面节另落；本批零写入 |
| 3 | `AGENT-PARAMS.md` | 42 | 活 · 统一面 | ① 根层无对应（CLI 台账同判「后续批」） | **已迁（批 4）**——落 `docs/core/requirements/AGENT-PARAMS.md`（§9.4） |
| 4 | `ASYNC-RESULT-CONTAINER.md` | 45 | 活 · 统一面 | ① 根层无对应；机制本体已入 `docs/core/design/AGENT-LOOP.md` §6.7.3（条目未并入） | **并入既有** `docs/core/requirements/AGENT-LOOP.md` → 待父侧另批（§8B-21） |
| 5 | `CHECKPOINT.md` | 49 | 活 · 统一面 | ① `docs/core/requirements/CHECKPOINT.md` 在位（CLI 已对账） | **并入既有**（§8B-23 · VSC 条目面） |
| 6 | `CONSULTATION.md` | 46 | 活 · 统一面 | ① 同上（`docs/core/requirements/CONSULTATION.md` 在位） | **并入既有**（§8B-23） |
| 7 | `CONTEXT-COMPACTION.md` | 46 | 活 · 统一面 | ① 同上 | **并入既有**（§8B-23） |
| 8 | `DESIGN-TOKEN-SETTLEMENT.md` | 42 | 活 · 统一面 | ① 根层无对应 | **新建** → 待父侧另批（§8A） |
| 9 | `ENG-TOKEN-BINDING.md` | 48 | 活 · 统一面 | ① 根层无对应 | **新建** → 待父侧另批（§8A） |
| 10 | `ENGINEERING-MODE.md` | 133 | 活 · 统一面 | ① **核层同名档已由并行 CLI 批建**（`docs/core/requirements/ENGINEERING-MODE.md` + `ENGINEERING-MODE-MECHANISM.md`） | **并入既有**——VSC 面内容未并 ⇒ 转 §8B |
| 11 | `ESCALATE.md` | 41 | 活 · 统一面 | ① 根层无对应（`CONSULTATION.md` 面级对位 · 条目未并入） | **本批新建** `docs/core/requirements/ESCALATE.md`（§9.3） |
| 12 | `FEATURES.md` | 21 | **活 · 专有（P2）**（复判修订 §4.4-4） | ② v1 功能范围 = 产品面清单；CLI 同判落 `docs/cli/requirements/` | **另落** `docs/vsc/requirements/FEATURES.md` → **归属疑变 · 待裁**（§7） |
| 13 | `LOGGING.md` | 37 | 活 · 统一面 | ① `docs/core/requirements/LOGGING.md` 在位（已对账） | **并入既有**（§8B-23） |
| 14 | `MCP.md` | 46 | 活 · 统一面 | ① `docs/core/requirements/MCP.md` 在位（已对账） | **并入既有**（§8B-23） |
| 15 | `MEMORY.md` | 50 | 活 · 统一面 | ① `docs/core/requirements/MEMORY.md` 在位（CLI 台账判「尚有未并 · 整档条目面」） | **并入既有**（§8B-19） |
| 16 | `MULTI-INSTANCE-COLLAB.md` | 44 | 活 · 统一面 | ① 根层无对应（`docs/core/design/WORKSPACE.md` `:83` 越段登记） | **已迁（批 4）**——落 `docs/core/requirements/MULTI-INSTANCE-COLLAB.md`（§9.4） |
| 17 | `NORMAL-MODE.md` | 37 | 活 · 统一面 | ① 根层无对应 | **已迁（批 4）**——落 `docs/core/requirements/NORMAL-MODE.md`（§9.4） |
| 18 | `PHILOSOPHY.md` | 136 | 活 · 统一面 | ① `docs/core/requirements/PHILOSOPHY.md` 在位（CLI 批 2） | **并入既有**（§8B-24） |
| 19 | `PORTABILITY.md` | 51 | 活 · 统一面 | ① 根层无对应 | **新建** → 待父侧另批（§8A） |
| 20 | `PROJECT.md` | 118 | 活 · 统一面 | ① 根层无对应 | **新建** → 待父侧另批（§8A） |
| 21 | `README.md` | 154 | 历史 | ③ 产品树需求登记表——树降格后退休 | 不迁（就地留） |
| 22 | `RELEASE.md` | 42 | 活 · 统一面 | ① `docs/core/requirements/RELEASE.md` 在位（CLI 批 2） | **并入既有**（§8B-24） |
| 23 | `SEND-STALL-DISTILL.md` | 40 | 活 · 统一面 | ① 根层部分（`CONTEXT-COMPACTION.md` 为机制本体 · 时序条无对应） | **本批新建** `docs/core/requirements/SEND-STALL-DISTILL.md`（§9.3） |
| 24 | `SESSION.md` | 52 | 活 · 统一面 | ① `docs/core/requirements/SESSION.md` 在位（已对账） | **并入既有**（§8B-23） |
| 25 | `SETTINGS-TOOL.md` | 37 | 活 · 统一面 | ① 根层无对应（`docs/core/design/CONFIG.md` `:105` 越段登记） | **已迁（批 4）**——落 `docs/core/requirements/SETTINGS-TOOL.md`（§9.4） |
| 26 | `STRUCTURE-DEBT.md` | 34 | 活 · 统一面 | ① 根层无对应（设计侧已建） | **已迁（批 4）**——落 `docs/core/requirements/STRUCTURE-DEBT.md`（§9.4） |
| 27 | `SUBAGENT-OBSERVE-SEND.md` | 41 | 活 · 统一面 | ① 根层面级对位（`docs/core/requirements/AGENT-LOOP.md`）· 条目未并入 | **并入既有** → 待父侧另批（§8B-20） |
| 28 | `TESTING.md` | 87 | 活 · 统一面 | ① **核层同名档已由并行 CLI 批建**（`docs/core/requirements/TESTING.md`） | **并入既有**——VSC 面内容未并 ⇒ 转 §8B |
| 29 | `TOOL-OUTPUT-LIMITS.md` | 47 | 活 · 统一面 | ① 根层部分（`docs/core/requirements/TOOLS.md` §4 条目面未并入） | **并入既有** → 待父侧另批（§8B-22） |
| 30 | `TOOLS.md` | 47 | 活 · 统一面 | ① `docs/core/requirements/TOOLS.md` 在位（已对账） | **并入既有**（§8B-23） |
| 31 | `TURN-CAP-CONTINUE.md` | 45 | 活 · 统一面 | ① 根层无对应（核侧仅 AGENT-LOOP §6.1/§6.2 局部） | **本批新建** `docs/core/requirements/TURN-CAP-CONTINUE.md`（§9.3） |
| 32 | `VERIFY-REDESIGN.md` | 34 | 活 · 统一面 | ① 根层无对应（设计侧已建） | **新建** → 待父侧另批（§8A） |
| 33 | `VSC-PROMPTS.md` | 46 | 待核 → **已销项** | ③ 镜像面——既有裁定 = 原地保留不动（§7） | 不迁（就地留） |
| 34 | `WEBVIEW.md` | 71 | 活 · 专有 | ④ webview 界面面（对端 = 终端 TUI，异名对位） | **已迁** `docs/vsc/requirements/WEBVIEW.md`（§9.1） |

### 4.3 小计与闭合（D3）

| 判（**复判后**——列义见 §4.4） | 设计 | 需求 | 合计 | 闭合基数 |
|---|---|---|---|---|
| 活 · 统一面（P1 → `docs/core/`） | 30 | 30 | **60** | —— |
| 活 · 专有面（P2 → `docs/vsc/`） | 4 | 2 | **6** | —— |
| 待核（§7——已销项 = 原地保留不动） | 1 | 1 | **2** | —— |
| 历史（就地留） | 15 | 1 | **16** | —— |
| **合计** | **50** | **34** | **84** | = §3 二分底本（84）✓ |

**逐行可复核**：50 = 30+4+1+15 · 34 = 30+2+1+1 · 84 = 60+6+2+16。

**64 档闭合（复判口径 · D3——小计必须与 64 闭合）**：原「活 · 统一面」64（设计 33 + 需求 31）复判后 = **60 仍属统一面**（设计 30 + 需求 30）**+ 2 → 历史**（设计：ASYNC-RESULT-CONTAINER · SUBAGENT-OBSERVE-SEND）**+ 2 → 专有面**（设计：RELEASE · 需求：FEATURES）⇒ **64 = 60 + 2 + 2** ✓（设计 33 = 30+2+1 · 需求 31 = 30+0+1）。

### 4.4 判 / 动作列义与复判修订（批 3）

**判**（四值）：**活 · 统一面**（机制在 ≥2 部分存在 ⇒ 落 `docs/core/`）· **活 · 专有面**（结构性不对称 ⇒ 落 `docs/vsc/`）· **历史**（一次性交付记录 ∨ 已被本树另一档显式取代 ⇒ 就地留）· **待核**（两种读法单列——§7 已销项）。
**动作**（四值）：**并入既有**（根层已有同话题档）· **新建**（根层无同话题档）· **不迁（就地留）** · **另落 `docs/vsc/`**。

**复判修订（4 条——逐条给依据）**：

| # | 档 | 原判 | 复判 | 依据（实核） |
|---|---|---|---|---|
| 1 | `design/ASYNC-RESULT-CONTAINER.md`（87） | 活 · 统一面 | **历史** | ② 机制结论已由 `docs/core/design/AGENT-LOOP.md` §6.7.3（`:332`）与 `:175`（`async-settle.mjs` helper 登记）承载；正文 = 施工骨架 |
| 2 | `design/SUBAGENT-OBSERVE-SEND.md`（79） | 活 · 统一面 | **历史** | ② 契约正文已由 `docs/core/design/AGENT-LOOP.md` §6.7.2（`:297`-`:311`）承载；正文 = 施工骨架 |
| 3 | `design/RELEASE.md`（202） | 活 · 统一面（→ core） | **活 · 专有（P2）** | ② 发布通道只属本产品；CLI 同判 ⇒ 见 §7.1-D1（**归属待裁**） |
| 4 | `requirements/FEATURES.md`（21） | 活 · 统一面（→ core） | **活 · 专有（P2）** | ② v1 功能范围 = 产品面清单；CLI 同判 ⇒ 见 §7.1-D2（**归属待裁**） |

**修订 1 / 2 的判据（现状单源化）**：二-2 的「已被本树另一档显式取代」本轮扩为「**机制结论已由根层活档单源承载**」——两档正文主体 = 某次交付的施工骨架（受影响文件 / 用例表 / 验收 / 变更流水），其机制与契约已住根层 ⇒ **不迁**（就地留参照），不留欠账。

## 5. 历史档（就地留）——为何不迁

历史档**不是垃圾**：`docs/README.md` §2 裁定「旧档不批量搬——保留原地作参照」；树降格后它们 = **迁移期参照历史**（保留 ≠ 维护）。判据（二-2）= 一次性交付记录 ∨ 已被本树另一档显式取代。上一节逐档给了依据列，本节不再重复（D2）。

**一处口径注记**：本节标题与 §4 表的「历史」行指向同一集合（设计 13 + 需求 1 = 14），不另立数。

## 6. 分批计划（批序 · 每批 ≤6 档 · 写域）

| 批 | 内容 | 源档数 | 落点 | 写域 | 状态 |
|---|---|---|---|---|---|
| **批 1** | VSC 专有面（P2）**可迁部分** | 3 | `docs/vsc/design/SETTINGS.md` · `docs/vsc/design/PROJECT-SWITCHER.md` · `docs/vsc/requirements/WEBVIEW.md` | `docs/vsc/**` | **本批已落**（§9 记录） |
| **批 3** | 统一面（P1）64 档**复判** + 纯新建第一批（3 板块设计 / 需求成对） | 6 | `docs/core/{design,requirements}/{TURN-CAP-CONTINUE,SEND-STALL-DISTILL,ESCALATE}.md` | `docs/core/**` | **本批已落**（§9.3 记录） |
| **批 4** | 统一面**纯新建**（落笔时核层无同话题档者） | 6 | `docs/core/{design,requirements}/{DOC-CODE-RECONCILE,AGENT-PARAMS,NORMAL-MODE,MULTI-INSTANCE-COLLAB,SETTINGS-TOOL,STRUCTURE-DEBT}.md` | `docs/core/**` | **本批已落**（§9.4） |
| **批 5+** | 统一面剩余（纯新建未落 6 · 转并入既有 6 · 并入清单 25 条） | 37 | §8A / §8B 逐条给定 | `docs/core/**` | **待父侧另批**（串行——避与 CLI 批同文件覆盖） |
| **批 3+** | 统一面（P1）**64 档**——分组并入 `docs/core/` | 64 | §8 逐条给定 | `docs/core/**` | **待父侧另批**（父侧 2026-09-15 收紧写域） |
| **收尾批** | 产品树两份地图（`design/README.md` · `requirements/README.md`）随树降格处置 | 2 | —— | 父侧 | 待排 |

**批 2 拆分规划 → 实落结果（本批已执行）**：`WEBVIEW（VSC 侧）` 实测 **1867 行**（超 500 硬限 ⇒ 必拆）。

**剔料（先剔一次性材料）**——逐处实核口径：**974 行**（口径 = 档头时点行 + 问题陈述 / 现场核实 / 方案选型 / 受影响文件 / 用例表 / 验收标准 / 边界 + §10.3 逐字 JS 施工形态 + §15 变更记录；逐处清单见批次档 §2）。
前批预估写 846 行——差额 = 口径不同（前批未计 §10 逐字 JS 代码块 27 行与各节头注 / 边界行），**以实核 974 为准**。
**正文素材 = 893 行**（1867 − 974）；重建后按面拆**三档**（预规划两名 → 实测需三档）：

| # | 落点（实落·已建） | 行数 | 覆盖源节 |
|---|---|---|---|
| 1 | `docs/vsc/design/WEBVIEW.md` | 262 | §1–§6 · §12 · §13 · §14（结构与活动区面 + 块头形态） |
| 2 | `docs/vsc/design/WEBVIEW-PROTOCOL.md` | 271 | §4 · §7 · §8 · §14.3（协议 · 秩序/忙态 · digest · 状态行对位） |
| 3 | `docs/vsc/design/WEBVIEW-INPUT.md` | 156 | §9 · §10 · §11（输入面 · 消息渲染契约） |

三档均低于 300 行软线（预判「拆后仍超 500」未成立——剔料后正文压缩至 ≤ 271 行/档）。**切面取舍理由**（含否决备选）见 `docs/vsc/design/WEBVIEW.md` §9。

## 7. 待核（**已销项**——既有裁定）

> 本节原列 3 条「判不准 ⇒ 待裁」（批 1 零写入）。**2026-09-15 父侧按既有裁定销项**：镜像面（`design/prompts/` 15 档 + `VSC-PROMPTS` 两档）= **原地保留不动**（出处：用户裁定「中文设计档原地保留」+「VSC 全押后」）⇒ 本部分迁移**不碰**、**不再列为待裁**。

| # | 档 | 裁定 | 理由 |
|---|---|---|---|
| 1 | `design/VSC-PROMPTS.md`（309） | **原地保留不动** | 镜像面——既有裁定（中文设计档原地保留 + VSC 全押后）；批 1 的两读法（P1 / P2）不再需要择一 |
| 3 | `design/prompts/*.md`（15 档 · 1026 行） | **原地保留不动** | 同上（正本已在 `docs/core/design/prompts/`） |

### 7.1 待裁（批 3 新增——**归属疑变 3 条**）

**为何入待裁而非本批自定**：3 条的**判**均唯一（不属「判不准」），但 3 条均改变**归属（落点）** —— 属**语义面**（“归属变化”），不得由写稿方自行定案 ⇒ 单列待裁。

| # | 档 | 原判落点 | 疑变后落点 | 依据（实核） |
|---|---|---|---|---|
| D1 | `design/RELEASE.md`（202） | `docs/core/design/` | `docs/vsc/design/`（P2） | 发布通道结构性只属本产品（Marketplace + Open VSX；对端 = npm）——P5「P2 > P1」；CLI 同判（`docs/core/design/DOC-MIGRATION.md` §2.1 第 31 行 → `docs/cli/design/RELEASE.md`） |
| D2 | `requirements/FEATURES.md`（21） | `docs/core/requirements/` | `docs/vsc/requirements/`（P2） | v1 功能范围 = 产品面清单；CLI 同判（同上 §2.2 第 14 行 → `docs/cli/requirements/FEATURES.md`） |
| D3 | `requirements/AGENT-LOOP.md`（355） | `docs/core/requirements/AGENT-LOOP.md`（原地） | **VSC 面需求节** ⇒ `docs/vsc/requirements/` | 该 core 档 §5（`:129`-`:132`）自述「旧档 §3 / §5 / §8 / §13（VSC 面需求节）……**归属面为 VSC 部分（`docs/vsc/requirements/`）**」——与本档原判相悖 |

**D1 / D2 的连带**：两档若定判为 P2，则 §4.1 / §4.2 对应行的「动作」随之改为「另落 `docs/vsc/**`」——**不在本批写域**，本批零写入（已按疑变预登记于表内）。
**D3 的连带**：core 档已明载其归属，与本档原判相悖——**两读法均已登记，不静默归类**；定判后同批收正 core 档的登记句（触发 = 父侧）。

### 7.2 批 4 复判的归属疑变（新增一条）

| # | 档 | 原判落点 | 疑变后落点 | 依据（实核） |
|---|---|---|---|---|
| D4 | `requirements/PROJECT.md`（118） | `docs/core/requirements/PROJECT.md` | **待裁**（档内混装产品级定性与 VSC 专有面） | 档内「会话流时序对齐」节的 owning board = webview 面（P2）⇒ 该节归 `docs/vsc/**`；余下产品级定性面与 CLI 侧同名档（产品定性更完整、**未迁**）重叠 ⇒ 落点与切分属**归属面**（语义面）——批 4 **零写入** |
| 3 | `design/prompts/*.md`（15 档 · 1026 行） | **原地保留不动** | 同上（正本已在 `docs/core/design/prompts/`） |

**未销的判据缺口（登记，非待裁）**：`DOC-SYSTEM` §5.1 的 P1/P2 对「镜像面」无专条——建议随 §8 声明面批次补一条判据句（目标档 `docs/core/**`，**本批零写入**）。

## 8. 待父侧另批（统一面剩余面——本批零写入）

**背景**：本批写域（父侧 2026-09-15 **01:49 更正口径**）= 「只建 `docs/core/**` 尚不存在的档」——判为统一面的 VSC 内容**必须按 B 式并入既有根层档**，**不得另起平行档**（平行档 = 同名分裂 ⇒ 违反 D2）。
为避与并行 CLI 迁移批**同文件互相覆盖**，落笔分两步：**本批只建「根层无同话题档」者**，其余逐条列此节，由父侧**串行另派**。

### 8A 新建面剩余（**批 4 复判后**——18 档全数处置 · 剩余 6 档）

> **时点声明**：本表 = **as-of 2026-09-15 批 4 落笔前**逐档实核（“核层无同话题档”逐档查阅 `docs/core/{design,requirements}/` 目录）。
> 并行 CLI 迁移批的写入**已实证翻转 6 档取面判据**（其新档已提交 ⇒ 同话题档在位）⇒ 本表按落笔时点复判，逐档状态如下。

| # | 内容（VSC 源档 · 行数） | 判（批 4 复判） | 落点 / 去向 | 备注 |
|---|---|---|---|---|
| 1 | `design/DOC-CODE-RECONCILE.md`（488） | **本批新建** | `docs/core/design/DOC-CODE-RECONCILE.md`（§9.4） | 剔料后落档 206 行（< 300 软线，无需拆分规划） |
| 2 | `requirements/AGENT-PARAMS.md`（42） | **本批新建** | `docs/core/requirements/AGENT-PARAMS.md`（§9.4） | 与既有核层设计档成对 |
| 3 | `requirements/NORMAL-MODE.md`（37） | **本批新建** | `docs/core/requirements/NORMAL-MODE.md`（§9.4） | 与提示词系统面相邻（核层无同名档） |
| 4 | `requirements/MULTI-INSTANCE-COLLAB.md`（44） | **本批新建** | `docs/core/requirements/MULTI-INSTANCE-COLLAB.md`（§9.4） | —— |
| 5 | `requirements/SETTINGS-TOOL.md`（37） | **本批新建** | `docs/core/requirements/SETTINGS-TOOL.md`（§9.4） | —— |
| 6 | `requirements/STRUCTURE-DEBT.md`（34） | **本批新建** | `docs/core/requirements/STRUCTURE-DEBT.md`（§9.4） | N5 双树口径随迁收正 |
| 7 | `design/{ADVISOR-CONVERGENCE 1426 · ENGINEERING-MODE 236 · LEDGER-SELF-CONTAINED 867 · TESTING 283}`（4 档） | **转并入既有** | 核层同名档已由**并行 CLI 批**建（含拆分产物） | VSC 面内容未并 ⇒ 转 §8B；各自须拆分（R24a） |
| 8 | `requirements/{ENGINEERING-MODE 133 · TESTING 87}`（2 档） | **转并入既有** | 核层同名档已由**并行 CLI 批**建 | VSC 面内容未并 ⇒ 转 §8B |
| 9 | `requirements/{ADVISOR-CONVERGENCE 57 · DESIGN-TOKEN-SETTLEMENT 42 · ENG-TOKEN-BINDING 48 · PORTABILITY 51 · PROJECT 118 · VERIFY-REDESIGN 34}`（6 档） | **纯新建（未落）** | 逐档同名 `docs/core/requirements/<板块>.md` | 待父侧另批；PROJECT 另见 §7.2 D4 |

**小计闭合（D3 · 18 档全数处置）**：**18 = 6（本批新建）+ 6（转并入既有）+ 6（纯新建未落）** ✓（设计 5 = 1 + 4 + 0 · 需求 13 = 5 + 2 + 6）。

**批 3 已建（不在本节）**：`docs/core/{design,requirements}/{TURN-CAP-CONTINUE,SEND-STALL-DISTILL,ESCALATE}.md`——见 §9.3。

### 8B 并入清单（根层已有同话题档——**本批零写入**，父侧串行另派 · 25 条）

**口径**（承 §4 表「动作」列的「并入既有」行）：B 式 = 只并**根层缺的内容**，追加在既有结构**之后**、不改既有节序；同一事实只详述一处（D2）。

| # | 内容（VSC 源档 · 行数） | 目标 core 档 | 拟插节 | 依据（实核） |
|---|---|---|---|---|
| 1 | `design/AGENT-LOOP.md`（1571）——VSC 侧接线面（挂起回合 digest / eng-coder 交付协议 / 子代理活动显示 / child permission gate） | `docs/core/design/AGENT-LOOP.md` | §6 机制面之后（新增「VSC 侧接线」节） | 该档 §6 为 CLI 档并入面、无 VSC 接线节；`:134` 已登记一条未并入项 |
| 2 | `design/AGENT-PARAMS-TUNING.md`（114）——VSC 端 explore「30 硬帽」移除现状 | `docs/core/design/AGENT-PARAMS.md` | §4「子代理轮次」+ §6.1 坐标表 | 该档 `:114` §8.2 登记「VSC 端 30 硬帽 ⇒ 归 VSC 轮」；§4 标题即「(CLI 端无专属代码)」 |
| 3 | `design/ARCHITECTURE.md`（266）——VSC 模块地图 + 与 CLI 差异表 | `docs/core/design/ARCHITECTURE.md` | §3 模块地图 / §4 之后 | 该档 `:6` 明载「VSC 侧未迁——VSC 轮并入本档」 |
| 4 | `design/IMAGE-DOWNGRADE-VISION.md`（130）——贴图降级链 | `docs/core/design/PROVIDER.md` | 新增「图片输入与贴图降级链」节 | 该档 §6 节清单无图片 / 贴图面（实核）；VSC 侧降级链在现行代码在位 |
| 5 | `design/PORTABILITY.md`（458）——VSC 镜像面（分类权威 / 评审注入 / 端差） | `docs/core/design/PORTABILITY.md` | §3 接口契约之后 | 该档 `:6` / `:124` 明载「VSC 端镜像——VSC 轮并入本档」 |
| 6 | `design/SESSION.md`（520）——VSC 端会话槽 / 恢复 / GC 接线 | `docs/core/design/SESSION.md` | §6.10 端分离恢复之后 | 该档 §6 为 CLI 面；端差面未并 |
| 7 | `design/PROVIDER.md`（463）——VSC 端接线（面板 / preset 表 / 编辑器路径） | `docs/core/design/PROVIDER.md` | §6.17 之后 | 同上（§6 为 CLI 面） |
| 8 | `design/MEMORY.md`（325）——VSC 文件式存储 + 向量检索 | `docs/core/design/MEMORY.md` | §6.8 之后 | 该档 §6.2 / §6.3 为 CLI（FTS5 / sqlite）；VSC 实现面未并 |
| 9 | `design/CONTEXT-COMPACTION.md`（146）——VSC 端压缩接线与可见性 | `docs/core/design/CONTEXT-COMPACTION.md` | §6.12 实现位置 | 该档 §6.12 为两端落点表；VSC 侧接线未并 |
| 10 | `design/MCP.md`（170）——VSC 提及 Settings 面板 MCP 页 | `docs/core/design/MCP.md` | §6.5 配置机制 | 该档 §6.8 为 `/mcp` TUI 面（CLI）；面板面未并 |
| 11 | `design/CHECKPOINT.md`（105）——VSC 触发点 / 恢复入口 / 审批过滤 | `docs/core/design/CHECKPOINT.md` | §6.7 恢复入口 / §6.8 两端统一后形态 | 该档 §6 为 CLI 面；VSC 接线未并 |
| 12 | `design/CONSULTATION.md`（161）——VSC 实现接线（digest 消费 / 端级接线） | `docs/core/design/CONSULTATION.md` | §6.4 CLI 实现接线之后 | 该档 §6.4 明标「CLI 实现接线」 |
| 13 | 编辑工具六档（`EDIT` 79 · `EDIT-HELPERS` 72 · `HASHLINE-EDIT` 45 · `INSERT-AFTER` 35 · `APPLY-PATCH` 41 · `WRITE` 36）——VSC 坐标 + VSC 差异（编辑器路径 / range 偏移映射 / 无 dirty 护栏） | `docs/core/design/{EDIT,EDIT-HELPERS,HASHLINE-EDIT,INSERT-AFTER,APPLY-PATCH,WRITE}.md` | 各档「实现单一权威」节 | 该族六档均以 CLI 档并入；VSC 差异面未并 |
| 14 | `design/TOOLS.md`（382）——VSC 适配增强（编辑器 / 语言服务 / webview 审批）+ 审批面 + 描述外部装载 | `docs/core/design/TOOLS.md` | §6.10 之后 | 该档 §6 为 CLI 面；VSC 适配增强未并 |
| 15 | `design/TOOL-OUTPUT-LIMITS-TUNING.md`（139）——VSC 坐标 + 双端测试面 | `docs/core/design/TOOL-OUTPUT-LIMITS.md` | §2 常量表 / §6.2 双端与测试面 | 该档 `:99` 登记「VSC 树档未迁」 |
| 16 | `design/ENG-TOKEN-BINDING-TUNING.md`（115）——VSC slot 多槽写 / 持久化面 | `docs/core/design/ENG-TOKEN-BINDING.md` | §6.1 实现坐标 | 该档 §6.2 为 CLI 侧落地状态；VSC 载体未并 |
| 17 | `design/DESIGN-TOKEN-SETTLEMENT.md`（109）——VSC 根因（每 run 重建 agent / 死对象）+ D1–D6 | `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` | §6.1 实现坐标 | 该档 §6.2「双端与依赖方向」；VSC 根因面未并 |
| 18 | `requirements/AGENT-LOOP.md`（355）——**VSC 面需求节** | ⚠ **归属疑变（待裁——§7）** | —— | 该 core 档 §5（`:129`-`:132`）显式登记「VSC 面需求节 ⇒ 归属 `docs/vsc/requirements/`」——与本档 §4.2 原判「落 core」冲突 |
| 19 | `requirements/MEMORY.md`（50）——VSC 端需求条目 | `docs/core/requirements/MEMORY.md` | §4 需求条目之后（新增「VSC 端」节） | CLI 台账同判「尚有未并 · 整档条目面」 |
| 20 | `requirements/SUBAGENT-OBSERVE-SEND.md`（41） | `docs/core/requirements/AGENT-LOOP.md` | §4 需求条目之后 | 该 core 档为根层面级对位；条目未并入 |
| 21 | `requirements/ASYNC-RESULT-CONTAINER.md`（45） | `docs/core/requirements/AGENT-LOOP.md` | 同上 | 机制本体已入设计侧 §6.7.3 |
| 22 | `requirements/TOOL-OUTPUT-LIMITS.md`（47）——64K 阈值与保头保尾条目 | `docs/core/requirements/TOOLS.md` | §4 需求条目之后 | CLI 台账同判「根层部分 · 未并入」 |
| 23 | `requirements/CHECKPOINT`（49）· `CONSULTATION`（46）· `CONTEXT-COMPACTION`（46）· `MCP`（46）· `SESSION`（52）· `TOOLS`（47）· `LOGGING`（37）——VSC 端条目面 | 对应 `docs/core/requirements/<板块>.md` | §4 需求条目之后（各档新增「VSC 端」节） | 各 core 档 §4 为 CLI 需求档并入面；VSC 条目未并 |
| 24 | `requirements/PHILOSOPHY.md`（136）· `requirements/RELEASE.md`（42）——VSC 端差异（RELEASE = 双市场通道；PHILOSOPHY = 合并前措辞对账） | `docs/core/requirements/{PHILOSOPHY,RELEASE}.md` | §5 / §4 之后 | 两 core 档为 CLI 需求档并入面 |
| 25 | `requirements/FEATURES.md`（21） | ⚠ **归属疑变（待裁——§7）** | —— | 内容 = 本产品 v1 功能范围；CLI 同判落 `docs/cli/requirements/` ⇒ 原判「落 core」需裁 |

**串行纪律**：本节目标在 `docs/core/**` ⇒ 与 CLI 批**同文件竞争**——两批**不得并行**（父侧排队）。

## 9. 实迁记录

### 9.1 批 1（VSC 专有面可迁部分）

| # | 源档（VSC 侧·一字未改） | 行数 | 落点（基准层活档） | 行数 | Δ |
|---|---|---|---|---|---|
| 1 | `thincoder-vscode/docs/design/SETTINGS.md` | 178 | `docs/vsc/design/SETTINGS.md` | 128 | -50 |
| 2 | `thincoder-vscode/docs/design/PROJECT-SWITCHER.md` | 75 | `docs/vsc/design/PROJECT-SWITCHER.md` | 97 | +22 |
| 3 | `thincoder-vscode/docs/requirements/WEBVIEW.md` | 71 | `docs/vsc/requirements/WEBVIEW.md` | 91 | +20 |

### 9.2 批 2（`WEBVIEW（VSC 侧）` 拆分 + 实迁）

| # | 源档（VSC 侧·一字未改） | 行数 | 落点（基准层活档 · 本批新建） | 行数 |
|---|---|---|---|---|
| 1 | —（同一源档三档共用） | 1867 | `docs/vsc/design/WEBVIEW.md` | 262 |
| 2 | `thincoder-vscode/docs/design/WEBVIEW.md` | 1867 | `docs/vsc/design/WEBVIEW-PROTOCOL.md` | 271 |
| 3 | —（同源） | 1867 | `docs/vsc/design/WEBVIEW-INPUT.md` | 156 |

**逐档并入 / 不并**：见各落点档的「不并项与历史沿革」节（逐项：旧档节 + 何故）——本表不重复（D2）。

**连带更新**：`docs/vsc/requirements/WEBVIEW.md`（设计侧引用翻转为同层三档——原「`WEBVIEW（VSC 侧）` 未迁」登记销项）；本节 §4.1 第 49 行 + §6 批 2 行 + §9.2 本表。

### 9.3 批 3（统一面 64 档复判 + 纯新建第一批 · 6 档）

**复判**：§4.1 / §4.2 逐档行「判」列 = 复判结论；修订 4 条见 §4.4；小计闭合见 §4.3。

**实迁（6 档 · 三板块设计 / 需求成对 · 源档一字未改）**：

| # | 源档（VSC 侧·一字未改） | 行数 | 落点（基准层活档 · 本批新建） | 行数 |
|---|---|---|---|---|
| 1 | `thincoder-vscode/docs/design/TURN-CAP-CONTINUE.md` | 208 | `docs/core/design/TURN-CAP-CONTINUE.md` | 129 |
| 2 | `thincoder-vscode/docs/design/SEND-STALL-DISTILL-TUNING.md` | 137 | `docs/core/design/SEND-STALL-DISTILL.md` | 130 |
| 3 | `thincoder-vscode/docs/design/ESCALATE.md` | 166 | `docs/core/design/ESCALATE.md` | 155 |
| 4 | `thincoder-vscode/docs/requirements/TURN-CAP-CONTINUE.md` | 45 | `docs/core/requirements/TURN-CAP-CONTINUE.md` | 73 |
| 5 | `thincoder-vscode/docs/requirements/SEND-STALL-DISTILL.md` | 40 | `docs/core/requirements/SEND-STALL-DISTILL.md` | 72 |
| 6 | `thincoder-vscode/docs/requirements/ESCALATE.md` | 41 | `docs/core/requirements/ESCALATE.md` | 69 |
**取面判据（为何是这 6 档）**：只取「判为**活档** · 且 `docs/core/` **无同话题档** ⇒ 纯新建」这一类（父侧 2026-09-15 01:49 口径）；
其余「应并入既有 core 档」的内容**本批零写入**——逐条列 §8B，由父侧串行另派落笔。三板块各取设计 + 需求成对（N-b 镜像同名）。
**坐标实核与漂移收正**：6 档内每条 `文件:行` 按现状实核（双端）；漂移处按现状改写（见各档「变更记录」与 §4.4 注）。
**新档去重**：蒸馏本体 / 池结算 / 会诊机制不在新档重述——分别指向 `CONTEXT-COMPACTION.md` §6.9 · 核侧 `async-settle.mjs` · `CONSULTATION.md`（D2）。

### 9.4 批 4（统一面**纯新建**第一批 · 6 档 · 一设计 + 五需求）

**取面判据（为何是这 6 档）**：判为**活档** ∧ 落笔时**核层无同话题档** ⇒ 纯新建（父侧口径）；其余逐条列 §8A / §8B。
源档**一字未改**（留参照历史）。

| # | 源档（VSC 侧·一字未改） | 行数 | 落点（基准层活档 · 本批新建） | 行数 |
|---|---|---|---|---|
| 1 | `thincoder-vscode/docs/design/DOC-CODE-RECONCILE.md` | 488 | `docs/core/design/DOC-CODE-RECONCILE.md` | 206 |
| 2 | `thincoder-vscode/docs/requirements/AGENT-PARAMS.md` | 42 | `docs/core/requirements/AGENT-PARAMS.md` | 70 |
| 3 | `thincoder-vscode/docs/requirements/NORMAL-MODE.md` | 37 | `docs/core/requirements/NORMAL-MODE.md` | 73 |
| 4 | `thincoder-vscode/docs/requirements/MULTI-INSTANCE-COLLAB.md` | 44 | `docs/core/requirements/MULTI-INSTANCE-COLLAB.md` | 77 |
| 5 | `thincoder-vscode/docs/requirements/SETTINGS-TOOL.md` | 37 | `docs/core/requirements/SETTINGS-TOOL.md` | 71 |
| 6 | `thincoder-vscode/docs/requirements/STRUCTURE-DEBT.md` | 34 | `docs/core/requirements/STRUCTURE-DEBT.md` | 70 |

**逐档并入 / 不并**：见各落点档的「不并项与历史沿革」节（逐项：旧档节 + 何故）——本表不重复（D2）。

**本批按现状收正（逐条）**：① DOC-CODE-RECONCILE——引擎宿主改指仓根统一版（产品侧六档脚本已随合并批退役）· A2 存在域改「合并仓代码面」· 提示词条文改「本仓」；
② STRUCTURE-DEBT——N5「双树 / 两仓各自检查」按合并仓收正为单仓单检查；③ 各档坐标全量改写为现状路径并逐条实核（`thincoder-vscode/**` · `thincoder-core/**` · `thincoder-cli/**` · `scripts/**`）。

**本批登记（非本批缺陷 · 供父侧）**：① `thincoder-vscode/scripts/reconcile-lookup.mjs` 的反查域常量仍为迁移前目录（`:25`）⇒ 但前恒空输出（收正归父侧）；
② 既有 core 档 `docs/core/design/AGENT-PARAMS.md` 档头「需求侧 = 根层**无**对应档」句随本批新建需求档**已过期**（一行收正，父侧另派——本批不动既有 core 档）。

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

**批 2（本批）受影响文件**：

| # | 档 | 当前行数 | 动作 |
|---|---|---|---|
| 9 | `docs/vsc/design/WEBVIEW.md` | 0（新建） | **新建**——262 行（源档结构与活动区面） |
| 10 | `docs/vsc/design/WEBVIEW-PROTOCOL.md` | 0（新建） | **新建**——271 行（协议 · 秩序 · 忙态 · 状态行） |
| 11 | `docs/vsc/design/WEBVIEW-INPUT.md` | 0（新建） | **新建**——156 行（输入面 · 消息渲染契约） |
| 12 | `docs/vsc/requirements/WEBVIEW.md` | 91 | 实修——设计侧引用翻转（§5.2 登记销项） |
| 13 | `docs/vsc/design/VSC-MIGRATION.md`（本档） | 378 | 实修——§4.1 行 49 · §6 批 2 · §7 销项 · §9.2 · §10 · §12.1 · §13 |
| 14 | `docs/batches/2026-09-15-vsc-doc-migration.md` | 35 | **append**——§2（不改 §1） |

**批 3（本批）受影响文件**：

| # | 档 | 当前行数 | 动作 |
|---|---|---|---|
| 15 | `docs/core/design/TURN-CAP-CONTINUE.md` | 0（新建） | **新建**——源 = VSC 树同名档（208 行） |
| 16 | `docs/core/design/SEND-STALL-DISTILL.md` | 0（新建） | **新建**——源 = VSC 树 `SEND-STALL-DISTILL-TUNING.md`（137 行） |
| 17 | `docs/core/design/ESCALATE.md` | 0（新建） | **新建**——源 = VSC 树 `ESCALATE.md`（166 行） |
| 18 | `docs/core/requirements/TURN-CAP-CONTINUE.md` | 0（新建） | **新建**——源 = VSC 树同名需求档（45 行） |
| 19 | `docs/core/requirements/SEND-STALL-DISTILL.md` | 0（新建） | **新建**——源 = VSC 树同名需求档（40 行） |
| 20 | `docs/core/requirements/ESCALATE.md` | 0（新建） | **新建**——源 = VSC 树同名需求档（41 行） |
| 21 | `docs/vsc/design/VSC-MIGRATION.md`（本档） | 378 | 实修——§4 / §6 / §8 / §9 / §10 / §12 / §13 / §16 |
| 22 | `docs/batches/2026-09-15-vsc-doc-migration.md` | — | **append**——§2（不改 §1） |

**批 4（本批）受影响文件**：

| # | 档 | 当前行数 | 动作 |
|---|---|---|---|
| 23 | `docs/core/design/DOC-CODE-RECONCILE.md` | 0（新建） | **新建**——206 行（源 = VSC 树同名档 488 行） |
| 24 | `docs/core/requirements/AGENT-PARAMS.md` | 0（新建） | **新建**——70 行（源 = VSC 树同名需求档 42 行） |
| 25 | `docs/core/requirements/NORMAL-MODE.md` | 0（新建） | **新建**——73 行 |
| 26 | `docs/core/requirements/MULTI-INSTANCE-COLLAB.md` | 0（新建） | **新建**——77 行 |
| 27 | `docs/core/requirements/SETTINGS-TOOL.md` | 0（新建） | **新建**——71 行 |
| 28 | `docs/core/requirements/STRUCTURE-DEBT.md` | 0（新建） | **新建**——70 行 |
| 29 | `docs/vsc/design/VSC-MIGRATION.md`（本档） | 499 | 实修——§4 / §6 / §7 / §8A / §9.4 / §10 / §12.3 / §13 / §16 |
| 30 | `docs/batches/2026-09-15-vsc-doc-migration.md` | — | **append**——§2（不改 §1） |

**待落（本批边界外——逐条上报）**：**§8A 新建面剩余 18 档**（`docs/core/**`）· **§8B 并入清单 25 条**（既有 `docs/core/**` 档——**本批零写入**，父侧串行另派）· 镜像面判据句补条（`DOC-SYSTEM` §5.1——`docs/core/**`）。

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
| D-VM7 | 待核 3 条**不下结论**、零写入 | §7——任务书明令「判不准 ⇒ 单列待核，不静默归类」——**已于批 2 销项**（见 D-VM9） |
| D-VM8 | 批 2 切面 = **按面拆三档**（结构+活动区 ∥ 协议+秩序 ∥ 输入+渲染） | §6——读者面不同（结构面 / wire 契约 / 端点契约）；否决两档（首档实测超 500 硬限）· 否决按批序切（无独立语义面）；取舍详表见 `docs/vsc/design/WEBVIEW.md` §9 |
| D-VM9 | 镜像面 3 条（`VSC-PROMPTS` ×2 + `design/prompts/` ×1）**销项**：既有裁定 = 原地保留不动 | §7——出处：用户裁定「中文设计档原地保留」+「VSC 全押后」；本批**不碰**、**不再列为待裁** |

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

### 12.1 批 2（`WEBVIEW（VSC 侧）` 拆分）验收标准

| # | 验收标准（机器可验） | 回指 |
|---|---|---|
| **A-VM9** | 拆分产物三档在位且逐档 ≤500 行（实测 258 / 271 / 156）· 各档 ≤300 行软线 | F-M3 · N-M3 |
| **A-VM10** | 三档「不并项与历史沿革」节在场（逐项：旧档节 + 何故）· 无状态行 / 无逐批流水 | F-M4 |
| **A-VM11** | 三档内每条 `文件:行` 断言按现状实核（源档漂移处按现态改写） | F-M5 |
| **A-VM12** | 三机检原样读数：域一悬空 0 · 宽度新增违规 0 · 台账 0；`git status` ⊆ 声明的写域 | N-M2 · N-M3 · N-M5 |

### 12.2 批 3（统一面 64 档复判 + 纯新建第一批）验收标准

| # | 验收标准（机器可验） | 回指 |
|---|---|---|
| **A-VM13** | §4.1 / §4.2 逐档行的 **判** 与 **动作** 两列非空、取值在枚举内；复判修订逐条给依据（§4.4） | F-M7 · N-M1 |
| **A-VM14** | §4.3 小计四栏 disjoint 加总 = **84** = 底本；且 **64 档子集闭合**（60 仍属统一面 + 2 → 历史 + 2 → 专有面，见 §4.3 闭合法） | F-M8 |
| **A-VM15** | 本批新建 6 档在位、逐档 ≤500 行、含「不并项与历史沿革」节、无状态行 / 无逐批流水；坐标按现状实核（§9.3） | F-M3 · F-M4 · F-M5 |
| **A-VM16** | §8B 并入清单逐条含「内容 → 目标 core 档 → 拟插节 → 依据」四要素；且**本批对既有 `docs/core/**` 档零写入**（`git status` 实核） | F-M9 · N-M5 |

### 12.3 批 4（统一面纯新建第一批）验收标准

| # | 验收标准（机器可验） | 回指 |
|---|---|---|
| **A-VM17** | 6 档新建在位、逐档 ≤500 行（实测 206 / 70 / 73 / 77 / 71 / 70）· 各档含「不并项与历史沿革」节 · 无状态行 / 无逐批流水 · 坐标按现状实核 | F-M3 · F-M4 · F-M5 |
| **A-VM18** | §8A 逐档「判」非空 + **小计闭合**（18 = 6 本批新建 + 6 转并入既有 + 6 纯新建未落）；§4 对应行同步为「已迁（批 4）」/「并入既有」 | F-M7 · F-M8 |
| **A-VM19** | 既有 `docs/core/**` 档**零写入**（`git status` 实核）；`thincoder-vscode/**` 一字未改 | N-M5 · N-M6 |
| **A-VM20** | 三机检：域一锚悬空 0 · 宽度新增违规 0 · 台账 0 | N-M2 · N-M3 |

## 13. 体量与拆分规划（R24a）

**实测行数**：本档 **560 行**（批 4 更新后实核——口径 = `readFileSync(...).split("\n").length`）——**已越 500 行硬限 ⇒ 按规则必须拆**。
**本批未拆·原由**：拆分产物 = 新增档（计划产物裸名 = `VSC-MIGRATION-INVENTORY.md`）——**超出本批写域**（批 4 写域 = 只建 `docs/core/**` 新档 + 本档实修）⇒ **请父侧授权另派**（逐条列报告）。
**拆分规划** = 二分表（§4）+ 实迁记录（§9）随迁移推进**移入独立迁移台账**；规划档只留：判据（§2）· 分批计划（§6）· 销项与待裁（§7）· 待父侧另批（§8）· 受影响文件与决策（§10–§11）。
**切法候选**：① §4 + §9 整体移出台账（推荐——两节自成闭环、与规划面零交叉）；② 仅 §8B 并入清单移出。**判据** = 组内同面 / 切点零交叉 / 两档均回落至 300 行软线内（承 `DOC-SYSTEM` §11 的同一拆分口径）。

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
5. **不另裁待核 3 条**——已按既有裁定销项（§7：镜像面 = 原地保留不动）。
6. **不迁批次档 / `_archive/`**（用户 2026-09-14 21:37「批次档不迁」；归档区 = 历史快照）。
7. **本档不含 UI / 交互决策**（迁移规划无界面面）——**显式声明豁免**，非遗漏；落点档 SETTINGS / PROJECT-SWITCHER 各自的 UI 决策随档落 §「UI / 交互决策落档」。

## 16. 变更记录

- 2026-09-15（**B 式迁移轮 · VSC 第 1 批**）：建档——实点（§3）· 二分表（§4 · 84 档逐档）· 待核（§7）· 分批计划（§6）· 待父侧另批（§8）· 本批实迁记录（§9）；同批实修两扫描器射程（`SCAN_DIRS` / `V5_SCAN_DIRS`）。

- 2026-09-15（**B 式迁移轮 · VSC 第 2 批**）：`WEBVIEW（VSC 侧）`（1867 行，超 500 硬限）**拆分 + 实迁**——先剔一次性批次材料（实核 921 行）
  + 按面拆三档（`WEBVIEW.md` 258 / `WEBVIEW-PROTOCOL.md` 271 / `WEBVIEW-INPUT.md` 156）；§4.1 第 49 行改「已迁（批 2）」· §6 批 2 行 + 拆分规划改实落结果 ·
  §7 待核 3 条**销项**（既有裁定 = 原地保留不动）+ D-VM8/D-VM9 · §9 改实迁记录（9.1/9.2）· §10 补批 2 受影响文件 · §12.1 批 2 验收标准 · §13 体量实核；
  连带翻转 `docs/vsc/requirements/WEBVIEW.md` 的设计侧引用。

- 2026-09-15（**B 式迁移轮 · VSC 第 3 批**——统一面 64 档「活 / 历史」复判 + 当场迁第一批）：
  §4.1 / §4.2 表列义改 **判**（活·统一面 / 活·专有 / 历史 / 待核）与 **动作**，逐档复判完成；复判修订 4 条见 §4.4；
  §4.3 小计按复判重算并给 **64 档闭合**；§6 批 3 行标**已落**（6 档）+ 批 4+ 行；
  §8 改为「待父侧另批」= 8A 新建面剩余 + **8B 并入清单**（逐条：内容 → 目标 `docs/core/…` 档 + 拟插节 + 依据）；
  §9.3 本批实迁记录；§10 补批 3 受影响文件；§12.2 批 3 验收标准；§13 体量实核。

- 2026-09-15（**B 式迁移轮 · VSC 第 4 批**——统一面**纯新建**第一批）：
  §4.1 / §4.2 十行动作改判（6 行 → 「已迁（批 4）」· 6 行 → 「并入既有」——并行 CLI 批已建同名核层档）；§6 分批计划改批 4（已落）+ 批 5+；
  §7 补 D4（PROJECT 归属疑变）+ 形态收正；**§8A 重写为逐档判表 + 小计闭合**（18 = 6 + 6 + 6）；§9.4 本批实迁记录；§10 批 4 受影响文件；
  §12.3 批 4 验收标准；§13 体量实核（本批更新后**已越 500 硬限** ⇒ 拆分规划 + 上报）。
