# VSC 文档迁移 · 迁移台账（VSC-MIGRATION-INVENTORY）— VSC 部分

> 部分 = **vsc**（`docs/vsc/`）；本档 = VSC 部分文档面迁移的**台账面**：实点（§3）· 二分表（§4）· 历史档（§5）·
> 待父侧另批（§8）· 实迁记录（§9）· 受影响文件（§10）· 关键决策（§11）· 验收标准（§12）· 体量（§13）· 用例表（§14）· 边界（§15）。
> **拆分登记**：本档 = `VSC-MIGRATION.md` 的拆分产物（批 5——主档 560 行越 500 硬限 ⇒ 按 §13 规划拆）；
> 判据 / 方案选型 / 分批计划 / 待裁 / 变更记录住主档 `VSC-MIGRATION.md`（同层）。**节号承主档原号**（§8B-1 类指针不断）。
> 行数与坐标口径 = as-of 2026-09-15 实核（`readFileSync(...).split("\n").length`，含末行空元素）。

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

> 列义（**批 3 复判后**）：**判** = 活 · 统一面 / 活 · 专有（P2）/ 历史 / 待核（四值列义与复判修订见 §4.4）；**依据** = 主档 §2.1 依据列（①–④）；**动作** = 并入既有 / 新建 / 不迁（就地留）/ 另落 `docs/vsc/`。
> 落点为 `docs/core/…` 的行 = 统一面（P1）——根层无同话题档者批 3 / 批 4 / 批 5 已建（§9.3–§9.5），余者列 §8；落点为 `docs/vsc/…` 的行 = VSC 专有面（批 1 / 批 2 / 批 5 已迁部分）。
> 行数 = as-of 2026-09-15 实核；判 = **复判结论**（批 3——承用户 2026-09-14 21:37 裁定 + `DOC-SYSTEM` §5.1 P1–P5）。

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
| 19 | `ESCALATE.md` | 166 | 活 · 统一面 | ① 根层无同话题档（`docs/core/design/CONSULTATION.md` §8.2 `:215` 越段登记） | **已迁（批 3）** `docs/core/design/ESCALATE.md`（§9.3） |
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
| 33 | `RELEASE.md` | 202 | **活 · 专有（P2）**（复判修订 §4.4-3） | ② 发布通道结构性只属本产品（Marketplace + Open VSX；对端 = npm）⇒ P5「P2 > P1」；CLI 同判 | **另落** `docs/vsc/design/RELEASE.md` → **D1 已裁定（2026-09-15）：VSC 专有面 · 落 `docs/vsc/design/`**（落笔待父侧另派） |
| 34 | `REMOVE-POOL-SNAPSHOT.md` | 77 | 历史 | ② 撤销项（一次性记录——快照机制无场景应撤） | 不迁（就地留） |
| 35 | `SEND-STALL-DISTILL-TUNING.md` | 137 | 活 · 统一面 | ① 根层无同话题档（`CONTEXT-COMPACTION.md` §6.9 为蒸馏本体、时序面无对应） | **已迁（批 3）** `docs/core/design/SEND-STALL-DISTILL.md`（§9.3） |
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
| 47 | `TURN-CAP-CONTINUE.md` | 208 | 活 · 统一面 | ① 根层无同话题档（核侧仅 `AGENT-LOOP.md` §6.1/§6.2 局部）；机制在现行代码在位 | **已迁（批 3）** `docs/core/design/TURN-CAP-CONTINUE.md`（§9.3） |
| 48 | `VSC-PROMPTS.md` | 309 | 待核 → **已销项** | ③ 镜像面——既有裁定 = 原地保留不动（主档 §7） | 不迁（就地留） |
| 49 | `WEBVIEW.md` | 1867 | 活 · 专有 | ④ webview 前端 + 消息协议——VSC 独有（CLI 对偶 = 终端 TUI，两者不镜像） | **已迁（批 2）**——拆三档（§9.2） |
| 50 | `WRITE.md` | 36 | 活 · 统一面 | ① `docs/core/design/WRITE.md` 在位 | **并入既有**（§8B-13） |

### 4.2 需求层（`thincoder-vscode/docs/requirements/` —— 34 档）

| # | 档 | 行 | 判 | 依据 | 动作 / 落点 |
|---|---|---|---|---|---|
| 1 | `ADVISOR-CONVERGENCE.md` | 57 | 活 · 统一面 | ① **核层同名档已由并行 CLI 批建并提交**（`docs/core/requirements/ADVISOR-CONVERGENCE.md`——其 `:8` / §7 登记「VSC 端对位面不并入，触发 = VSC 轮」） | **并入既有**——VSC 端对位面未并 ⇒ §8B-26（批 5 落笔时点复判：原「新建」翻转） |
| 2 | `AGENT-LOOP.md` | 355 | 活 · 统一面 | ① `docs/core/requirements/AGENT-LOOP.md` 在位；该档 §5（`:129`-`:132`）显式登记「VSC 面需求节 ⇒ 归属 `docs/vsc/requirements/`」 | **D3 已裁定（2026-09-15）：维持现状**——VSC 面需求节留 core 档 §5 内（结构变更非本批题）；§8B-18 销项 |
| 3 | `AGENT-PARAMS.md` | 42 | 活 · 统一面 | ① 根层无对应（CLI 台账同判「后续批」） | **已迁（批 4）**——落 `docs/core/requirements/AGENT-PARAMS.md`（§9.4） |
| 4 | `ASYNC-RESULT-CONTAINER.md` | 45 | 活 · 统一面 | ① 根层无对应；机制本体已入 `docs/core/design/AGENT-LOOP.md` §6.7.3（条目未并入） | **并入既有** `docs/core/requirements/AGENT-LOOP.md` → 待父侧另批（§8B-21） |
| 5 | `CHECKPOINT.md` | 49 | 活 · 统一面 | ① `docs/core/requirements/CHECKPOINT.md` 在位（CLI 已对账） | **并入既有**（§8B-23 · VSC 条目面） |
| 6 | `CONSULTATION.md` | 46 | 活 · 统一面 | ① 同上（`docs/core/requirements/CONSULTATION.md` 在位） | **并入既有**（§8B-23） |
| 7 | `CONTEXT-COMPACTION.md` | 46 | 活 · 统一面 | ① 同上 | **并入既有**（§8B-23） |
| 8 | `DESIGN-TOKEN-SETTLEMENT.md` | 42 | 活 · 统一面 | ① 根层无对应（批 5 落笔时点实核） | **已迁（批 5）**——落 `docs/core/requirements/DESIGN-TOKEN-SETTLEMENT.md`（§9.5） |
| 9 | `ENG-TOKEN-BINDING.md` | 48 | 活 · 统一面 | ① 根层无对应（批 5 落笔时点实核） | **已迁（批 5）**——落 `docs/core/requirements/ENG-TOKEN-BINDING.md`（§9.5） |
| 10 | `ENGINEERING-MODE.md` | 133 | 活 · 统一面 | ① **核层同名档已由并行 CLI 批建**（`docs/core/requirements/ENGINEERING-MODE.md` + `ENGINEERING-MODE-MECHANISM.md`） | **并入既有**——VSC 面内容未并 ⇒ 转 §8B |
| 11 | `ESCALATE.md` | 41 | 活 · 统一面 | ① 根层无对应（`CONSULTATION.md` 面级对位 · 条目未并入） | **已迁（批 3）** `docs/core/requirements/ESCALATE.md`（§9.3） |
| 12 | `FEATURES.md` | 21 | **活 · 专有（P2）**（复判修订 §4.4-4） | ② v1 功能范围 = 产品面清单；CLI 同判落 `docs/cli/requirements/` | **另落** `docs/vsc/requirements/FEATURES.md` → **D2 已裁定（2026-09-15）：VSC 专有面 · 落 `docs/vsc/requirements/`**（落笔待父侧另派） |
| 13 | `LOGGING.md` | 37 | 活 · 统一面 | ① `docs/core/requirements/LOGGING.md` 在位（已对账） | **并入既有**（§8B-23） |
| 14 | `MCP.md` | 46 | 活 · 统一面 | ① `docs/core/requirements/MCP.md` 在位（已对账） | **并入既有**（§8B-23） |
| 15 | `MEMORY.md` | 50 | 活 · 统一面 | ① `docs/core/requirements/MEMORY.md` 在位（CLI 台账判「尚有未并 · 整档条目面」） | **并入既有**（§8B-19） |
| 16 | `MULTI-INSTANCE-COLLAB.md` | 44 | 活 · 统一面 | ① 根层无对应（`docs/core/design/WORKSPACE.md` `:83` 越段登记） | **已迁（批 4）**——落 `docs/core/requirements/MULTI-INSTANCE-COLLAB.md`（§9.4） |
| 17 | `NORMAL-MODE.md` | 37 | 活 · 统一面 | ① 根层无对应 | **已迁（批 4）**——落 `docs/core/requirements/NORMAL-MODE.md`（§9.4） |
| 18 | `PHILOSOPHY.md` | 136 | 活 · 统一面 | ① `docs/core/requirements/PHILOSOPHY.md` 在位（CLI 批 2） | **并入既有**（§8B-24） |
| 19 | `PORTABILITY.md` | 51 | 活 · 统一面 | ① 根层无对应（批 5 落笔时点实核） | **已迁（批 5）**——落 `docs/core/requirements/PORTABILITY.md`（§9.5） |
| 20 | `PROJECT.md` | 118 | 活 · 统一面 | ① 根层无对应；档内混装产品级定性与 VSC 专有面（主档 §7.2 D4——批 5 已裁定） | **已迁（批 5）——拆分双落**：产品级定性 ⇒ `docs/core/requirements/PROJECT.md`；VSC 专有面 ⇒ `docs/vsc/requirements/PROJECT.md`（§9.5） |
| 21 | `README.md` | 154 | 历史 | ③ 产品树需求登记表——树降格后退休 | 不迁（就地留） |
| 22 | `RELEASE.md` | 42 | 活 · 统一面 | ① `docs/core/requirements/RELEASE.md` 在位（CLI 批 2） | **并入既有**（§8B-24） |
| 23 | `SEND-STALL-DISTILL.md` | 40 | 活 · 统一面 | ① 根层部分（`CONTEXT-COMPACTION.md` 为机制本体 · 时序条无对应） | **已迁（批 3）** `docs/core/requirements/SEND-STALL-DISTILL.md`（§9.3） |
| 24 | `SESSION.md` | 52 | 活 · 统一面 | ① `docs/core/requirements/SESSION.md` 在位（已对账） | **并入既有**（§8B-23） |
| 25 | `SETTINGS-TOOL.md` | 37 | 活 · 统一面 | ① 根层无对应（`docs/core/design/CONFIG.md` `:105` 越段登记） | **已迁（批 4）**——落 `docs/core/requirements/SETTINGS-TOOL.md`（§9.4） |
| 26 | `STRUCTURE-DEBT.md` | 34 | 活 · 统一面 | ① 根层无对应（设计侧已建） | **已迁（批 4）**——落 `docs/core/requirements/STRUCTURE-DEBT.md`（§9.4） |
| 27 | `SUBAGENT-OBSERVE-SEND.md` | 41 | 活 · 统一面 | ① 根层面级对位（`docs/core/requirements/AGENT-LOOP.md`）· 条目未并入 | **并入既有** → 待父侧另批（§8B-20） |
| 28 | `TESTING.md` | 87 | 活 · 统一面 | ① **核层同名档已由并行 CLI 批建**（`docs/core/requirements/TESTING.md`） | **并入既有**——VSC 面内容未并 ⇒ 转 §8B |
| 29 | `TOOL-OUTPUT-LIMITS.md` | 47 | 活 · 统一面 | ① 根层部分（`docs/core/requirements/TOOLS.md` §4 条目面未并入） | **并入既有** → 待父侧另批（§8B-22） |
| 30 | `TOOLS.md` | 47 | 活 · 统一面 | ① `docs/core/requirements/TOOLS.md` 在位（已对账） | **并入既有**（§8B-23） |
| 31 | `TURN-CAP-CONTINUE.md` | 45 | 活 · 统一面 | ① 根层无对应（核侧仅 AGENT-LOOP §6.1/§6.2 局部） | **已迁（批 3）** `docs/core/requirements/TURN-CAP-CONTINUE.md`（§9.3） |
| 32 | `VERIFY-REDESIGN.md` | 34 | 活 · 统一面 | ① 根层无对应（批 5 落笔时点实核；设计侧 `docs/core/design/VERIFY-REDESIGN.md` 在位） | **已迁（批 5）**——落 `docs/core/requirements/VERIFY-REDESIGN.md`（§9.5） |
| 33 | `VSC-PROMPTS.md` | 46 | 待核 → **已销项** | ③ 镜像面——既有裁定 = 原地保留不动（主档 §7） | 不迁（就地留） |
| 34 | `WEBVIEW.md` | 71 | 活 · 专有 | ④ webview 界面面（对端 = 终端 TUI，异名对位） | **已迁** `docs/vsc/requirements/WEBVIEW.md`（§9.1） |

### 4.3 小计与闭合（D3）

| 判（**复判后**——列义见 §4.4） | 设计 | 需求 | 合计 | 闭合基数 |
|---|---|---|---|---|
| 活 · 统一面（P1 → `docs/core/`） | 30 | 30 | **60** | —— |
| 活 · 专有面（P2 → `docs/vsc/`） | 4 | 2 | **6** | —— |
| 待核（已销项 = 原地保留不动） | 1 | 1 | **2** | —— |
| 历史（就地留） | 15 | 1 | **16** | —— |
| **合计** | **50** | **34** | **84** | = §3 二分底本（84）✓ |

**逐行可复核**：50 = 30+4+1+15 · 34 = 30+2+1+1 · 84 = 60+6+2+16。

**64 档闭合（复判口径 · D3）**：原「活 · 统一面」64（设计 33 + 需求 31）复判后 = **60 仍属统一面**（设计 30 + 需求 30）**+ 2 → 历史**（设计：ASYNC-RESULT-CONTAINER · SUBAGENT-OBSERVE-SEND）**+ 2 → 专有面**（设计：RELEASE · 需求：FEATURES）⇒ **64 = 60 + 2 + 2** ✓（设计 33 = 30+2+1 · 需求 31 = 30+0+1）。

### 4.4 判 / 动作列义与复判修订（批 3）

**判**（四值）：**活 · 统一面**（机制在 ≥2 部分存在 ⇒ 落 `docs/core/`）· **活 · 专有面**（结构性不对称 ⇒ 落 `docs/vsc/`）· **历史**（一次性交付记录 ∨ 已被本树另一档显式取代 ⇒ 就地留）· **待核**（两种读法单列——已销项）。
**动作**（四值）：**并入既有**（根层已有同话题档）· **新建**（根层无同话题档）· **不迁（就地留）** · **另落 `docs/vsc/`**。

**复判修订（4 条——逐条给依据）**：

| # | 档 | 原判 | 复判 | 依据（实核） |
|---|---|---|---|---|
| 1 | `design/ASYNC-RESULT-CONTAINER.md`（87） | 活 · 统一面 | **历史** | ② 机制结论已由 `docs/core/design/AGENT-LOOP.md` §6.7.3（`:332`）与 `:175`（`async-settle.mjs` helper 登记）承载；正文 = 施工骨架 |
| 2 | `design/SUBAGENT-OBSERVE-SEND.md`（79） | 活 · 统一面 | **历史** | ② 契约正文已由 `docs/core/design/AGENT-LOOP.md` §6.7.2（`:297`-`:311`）承载；正文 = 施工骨架 |
| 3 | `design/RELEASE.md`（202） | 活 · 统一面（→ core） | **活 · 专有（P2）** | ② 发布通道只属本产品；CLI 同判 ⇒ 主档 §7.1-D1（**归属待裁**） |
| 4 | `requirements/FEATURES.md`（21） | 活 · 统一面（→ core） | **活 · 专有（P2）** | ② v1 功能范围 = 产品面清单；CLI 同判 ⇒ 主档 §7.1-D2（**归属待裁**） |

**修订 1 / 2 的判据（现状单源化）**：二-2 的「已被本树另一档显式取代」批 3 扩为「**机制结论已由根层活档单源承载**」——两档正文主体 = 某次交付的施工骨架（受影响文件 / 用例表 / 验收 / 变更流水），其机制与契约已住根层 ⇒ **不迁**（就地留参照），不留欠账。

## 5. 历史档（就地留）——为何不迁

历史档**不是垃圾**：`docs/README.md` §2 裁定「旧档不批量搬——保留原地作参照」；树降格后它们 = **迁移期参照历史**（保留 ≠ 维护）。判据（二-2）= 一次性交付记录 ∨ 已被本树另一档显式取代。上一节逐档给了依据列，本节不再重复（D2）。

**一处口径注记**：本节标题与 §4 表的「历史」行指向同一集合（设计 15 + 需求 1 = 16），不另立数。

## 8. 待父侧另批（统一面剩余面）

**背景**：父侧 2026-09-15 收紧口径——判为统一面的 VSC 内容**必须按 B 式并入既有根层档**，**不得另起平行档**（平行档 = 同名分裂 ⇒ 违反 D2）。
为避与并行 CLI 迁移批**同文件互相覆盖**，落笔分两步：**各批只建「根层无同话题档」者**（落笔时点实核），其余逐条列此节，由父侧**串行另派**。

### 8A 新建面（**批 5 收口——18 档全数处置完毕**）

> **时点声明**：本表判 = **各批落笔时点**逐档实核（“核层无同话题档”逐档查阅 `docs/core/{design,requirements}/` 目录）。
> 并行 CLI 迁移批的写入**已实证翻转 7 档取面判据**（其新档已提交 ⇒ 同话题档在位）⇒ 逐档状态如下（批 5 后全数处置）。

| # | 内容（VSC 源档 · 行数） | 判（落笔时点） | 落点 / 去向 | 备注 |
|---|---|---|---|---|
| 1 | `design/DOC-CODE-RECONCILE.md`（488） | **已迁（批 4）** | `docs/core/design/DOC-CODE-RECONCILE.md`（§9.4） | 剔料后落档 206 行 |
| 2 | `requirements/AGENT-PARAMS.md`（42） | **已迁（批 4）** | `docs/core/requirements/AGENT-PARAMS.md`（§9.4） | —— |
| 3 | `requirements/NORMAL-MODE.md`（37） | **已迁（批 4）** | `docs/core/requirements/NORMAL-MODE.md`（§9.4） | —— |
| 4 | `requirements/MULTI-INSTANCE-COLLAB.md`（44） | **已迁（批 4）** | `docs/core/requirements/MULTI-INSTANCE-COLLAB.md`（§9.4） | —— |
| 5 | `requirements/SETTINGS-TOOL.md`（37） | **已迁（批 4）** | `docs/core/requirements/SETTINGS-TOOL.md`（§9.4） | —— |
| 6 | `requirements/STRUCTURE-DEBT.md`（34） | **已迁（批 4）** | `docs/core/requirements/STRUCTURE-DEBT.md`（§9.4） | —— |
| 7 | `design/{ADVISOR-CONVERGENCE 1426 · ENGINEERING-MODE 236 · LEDGER-SELF-CONTAINED 867 · TESTING 283}`（4 档） | **转并入既有** | 核层同名档已由**并行 CLI 批**建（含拆分产物） | VSC 面内容未并 ⇒ 转 §8B；各自须拆分（R24a） |
| 8 | `requirements/{ENGINEERING-MODE 133 · TESTING 87}`（2 档） | **转并入既有** | 核层同名档已由**并行 CLI 批**建 | VSC 面内容未并 ⇒ 转 §8B |
| 9 | `requirements/ADVISOR-CONVERGENCE.md`（57） | **转并入既有**（批 5 落笔时点实核——原判「新建」翻转） | `docs/core/requirements/ADVISOR-CONVERGENCE.md` 已由**并行 CLI 批**建并提交 | VSC 端对位面未并 ⇒ §8B-26；批 5 **跳过新建**（不覆盖他线产物） |
| 10 | `requirements/DESIGN-TOKEN-SETTLEMENT.md`（42） | **已迁（批 5）** | `docs/core/requirements/DESIGN-TOKEN-SETTLEMENT.md`（§9.5） | 纯新建（落笔时点核层无同名档——实核） |
| 11 | `requirements/ENG-TOKEN-BINDING.md`（48） | **已迁（批 5）** | `docs/core/requirements/ENG-TOKEN-BINDING.md`（§9.5） | 同上 |
| 12 | `requirements/PORTABILITY.md`（51） | **已迁（批 5）** | `docs/core/requirements/PORTABILITY.md`（§9.5） | 同上 |
| 13 | `requirements/PROJECT.md`（118） | **已迁（批 5）——拆分双落** | 产品级定性 ⇒ `docs/core/requirements/PROJECT.md`；VSC 专有面 ⇒ `docs/vsc/requirements/PROJECT.md`（§9.5） | 承主档 §7.2 D4 归属疑变的父侧裁定；切分规则 = 产物档 §5.2 |
| 14 | `requirements/VERIFY-REDESIGN.md`（34） | **已迁（批 5）** | `docs/core/requirements/VERIFY-REDESIGN.md`（§9.5） | 纯新建 |

**小计闭合（D3 · 18 档全数处置——批 5 收口）**：**18 = 6（批 4 新建）+ 7（转并入既有——含批 5 翻转的 ADVISOR-CONVERGENCE）+ 4（批 5 新建）+ 1（批 5 拆分双落——源档 1 档 / 产物 2 档）** ✓
（设计 5 = 1 + 4 + 0 · 需求 13 = 5 + 3 + 4 + 1）。**§8A 闭合**——新建面无剩余。

**批 3 已建（不在本节）**：`docs/core/{design,requirements}/{TURN-CAP-CONTINUE,SEND-STALL-DISTILL,ESCALATE}.md`——见 §9.3。

### 8B 并入清单（根层已有同话题档——父侧串行另派 · 26 条）

**口径**（承 §4 表「动作」列的「并入既有」行）：B 式 = 只并**根层缺的内容**，追加在既有结构**之后**、不改既有节序；同一事实只详述一处（D2）。

| # | 内容（VSC 源档 · 行数） | 目标 core 档 | 拟插节 | 依据（实核） |
|---|---|---|---|---|
| 1 | `design/AGENT-LOOP.md`（1571）——VSC 侧接线面（挂起回合 digest / eng-coder 交付协议 / 子代理活动显示 / child permission gate） | `docs/core/design/AGENT-LOOP.md` | §6 机制面之后（新增「VSC 侧接线」节） | 该档 §6 为 CLI 档并入面、无 VSC 接线节；`:134` 已登记一条未并入项 |
| 2 | `design/AGENT-PARAMS-TUNING.md`（114）——VSC 端 explore「30 硬帽」移除现状 | `docs/core/design/AGENT-PARAMS.md` | §4「子代理轮次」+ §6.1 坐标表 | 该档 `:114` §8.2 登记「VSC 端 30 硬帽 ⇒ 归 VSC 轮」；§4 标题即「(CLI 端无专属代码)」⇒ **已并入（批 6）**——§4 注 + §6.3 坐标表 |
| 3 | `design/ARCHITECTURE.md`（266）——VSC 模块地图 + 与 CLI 差异表 | `docs/core/design/ARCHITECTURE.md` | §3 模块地图 / §4 之后 | 该档 `:6` 明载「VSC 侧未迁——VSC 轮并入本档」⇒ **已并入（批 6）**——§3.1 壳层装配地图 + §4.1 差异表 |
| 4 | `design/IMAGE-DOWNGRADE-VISION.md`（130）——贴图降级链 | `docs/core/design/PROVIDER.md` | 新增「图片输入与贴图降级链」节 | 该档 §6 节清单无图片 / 贴图面（实核）；VSC 侧降级链在现行代码在位 |
| 5 | `design/PORTABILITY.md`（458）——VSC 镜像面（分类权威 / 评审注入 / 端差） | `docs/core/design/PORTABILITY.md` | §3 接口契约之后 | 该档 `:6` / `:124` 明载「VSC 端镜像——VSC 轮并入本档」⇒ **已并入（批 6）**——§3.6 坐标表 + §5 测试面 |
| 6 | `design/SESSION.md`（520）——VSC 端会话槽 / 恢复 / GC 接线 | `docs/core/design/SESSION.md` | §6.10 端分离恢复之后 | 该档 §6 为 CLI 面；端差面未并 ⇒ **已并入（批 7）**——§6.15 VS Code 面板装配接线面（切换守卫 / turnSlot / 绑定入口 / 字段往返与 setSlot\* / 标题 A2 / 懒历史分页 / 注入序）· D-SE27–30 |
| 7 | `design/PROVIDER.md`（463）——VSC 端接线（面板 / preset 表 / 编辑器路径） | `docs/core/design/PROVIDER.md` | §6.17 之后 | 同上（§6 为 CLI 面） |
| 8 | `design/MEMORY.md`（325）——VSC 文件式存储 + 向量检索 | `docs/core/design/MEMORY.md` | §6.8 之后 | 该档 §6.2 / §6.3 为 CLI（FTS5 / sqlite）；VSC 实现面未并 ⇒ **已并入（批 7）**——§6.9 VSC 端实现面（文件制现状登记 / 索引有效性 B1–B4 / 工具契约端差）· D-MEM14–15 |
| 9 | `design/CONTEXT-COMPACTION.md`（146）——VSC 端压缩接线与可见性 | `docs/core/design/CONTEXT-COMPACTION.md` | §6.12 实现位置 | 该档 §6.12 为两端落点表；VSC 侧接线未并 ⇒ **已并入（批 7）**——§6.13 VS Code 端接线面（判定点封装 / 基线 / 预算端差 / REVERSE 坐标 / 摘要锚 / 边界重置 2 / webview 四态 / 失败可见化 / 非压缩职责边界）· D-CC17 |
| 10 | `design/MCP.md`（170）——VSC 提及 Settings 面板 MCP 页 | `docs/core/design/MCP.md` | §6.5 配置机制 | 该档 §6.8 为 `/mcp` TUI 面（CLI）；面板面未并 ⇒ **已并入（批 7）**——§6.10 VS Code Settings 面板 MCP 页（config-mcp 读写 / depth-0 装配 / 命连接 / 探活镜像 / 代配差异）· D-MC16 |
| 11 | `design/CHECKPOINT.md`（105）——VSC 触发点 / 恢复入口 / 审批过滤 | `docs/core/design/CHECKPOINT.md` | §6.7 恢复入口 / §6.8 两端统一后形态 | 该档 §6 为 CLI 面；VSC 接线未并 ⇒ **已并入（批 7）**——§6.9 VS Code 端接线面（触发点坐标 / 恢复输出契约 / 只读分类）· D-CP10 |
| 12 | `design/CONSULTATION.md`（161）——VSC 实现接线（digest 消费 / 端级接线） | `docs/core/design/CONSULTATION.md` | §6.4 CLI 实现接线之后 | 该档 §6.4 明标「CLI 实现接线」 ⇒ **已并入（批 7）**——§6.5 VS Code 端级实现接线表（子 agent 构建 / runner / 只读工具集与 main_history / 注册 / 容器 / digest / 驱动中止 / 动作域 / 面板）· D-CO7 |
| 13 | 编辑工具六档（`EDIT` 79 · `EDIT-HELPERS` 72 · `HASHLINE-EDIT` 45 · `INSERT-AFTER` 35 · `APPLY-PATCH` 41 · `WRITE` 36）——VSC 坐标 + VSC 差异（编辑器路径 / range 偏移映射 / 无 dirty 护栏） | `docs/core/design/{EDIT,EDIT-HELPERS,HASHLINE-EDIT,INSERT-AFTER,APPLY-PATCH,WRITE}.md` | 各档「实现单一权威」节 | 该族六档均以 CLI 档并入；VSC 差异面未并 |
| 14 | `design/TOOLS.md`（382）——VSC 适配增强（编辑器 / 语言服务 / webview 审批）+ 审批面 + 描述外部装载 | `docs/core/design/TOOLS.md` | §6.10 之后 | 该档 §6 为 CLI 面；VSC 适配增强未并 |
| 15 | `design/TOOL-OUTPUT-LIMITS-TUNING.md`（139）——VSC 坐标 + 双端测试面 | `docs/core/design/TOOL-OUTPUT-LIMITS.md` | §2 常量表 / §6.2 双端与测试面 | 该档 `:99` 登记「VSC 树档未迁」⇒ **已并入（批 6）**——§6.3 坐标表 |
| 16 | `design/ENG-TOKEN-BINDING-TUNING.md`（115）——VSC slot 多槽写 / 持久化面 | `docs/core/design/ENG-TOKEN-BINDING.md` | §6.1 实现坐标 | 该档 §6.2 为 CLI 侧落地状态；VSC 载体未并 ⇒ **已并入（批 6）**——§6.3 接线表 |
| 17 | `design/DESIGN-TOKEN-SETTLEMENT.md`（109）——VSC 根因（每 run 重建 agent / 死对象）+ D1–D6 | `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` | §6.1 实现坐标 | 该档 §6.2「双端与依赖方向」；VSC 根因面未并 ⇒ **已并入（批 6）**——§6.3 结算接线表 |
| 18 | `requirements/AGENT-LOOP.md`（355）——**VSC 面需求节** | ⚠ ~~归属疑变~~ → **D3 裁定（2026-09-15）：维持现状** | —— | 该 core 档 §5（`:129`-`:132`）显式登记「VSC 面需求节 ⇒ 归属 `docs/vsc/requirements/`」——与 §4.2 原判「落 core」冲突 ⇒ **本行销项不并**（结构变更非本批题·留在 core 档内） |
| 19 | `requirements/MEMORY.md`（50）——VSC 端需求条目 | `docs/core/requirements/MEMORY.md` | §4 需求条目之后（新增「VSC 端」节） | CLI 台账同判「尚有未并 · 整档条目面」⇒ **已并入（批 6）**——§4.7 VSC 端需求条目 |
| 20 | `requirements/SUBAGENT-OBSERVE-SEND.md`（41） | `docs/core/requirements/AGENT-LOOP.md` | §4 需求条目之后 | 该 core 档为根层面级对位；条目未并入 |
| 21 | `requirements/ASYNC-RESULT-CONTAINER.md`（45） | `docs/core/requirements/AGENT-LOOP.md` | 同上 | 机制本体已入设计侧 §6.7.3 |
| 22 | `requirements/TOOL-OUTPUT-LIMITS.md`（47）——64K 阈值与保头保尾条目 | `docs/core/requirements/TOOLS.md` | §4 需求条目之后 | CLI 台账同判「根层部分 · 未并入」⇒ **已并入（批 6）**——§4.5「VSC 端显示层条目」FR-V1/FR-V2（共享条目不重并） |
| 23 | `requirements/CHECKPOINT`（49）· `CONSULTATION`（46）· `CONTEXT-COMPACTION`（46）· `MCP`（46）· `SESSION`（52）· `TOOLS`（47）· `LOGGING`（37）——VSC 端条目面 | 对应 `docs/core/requirements/<板块>.md` | §4 需求条目之后（各档新增「VSC 端」节） | 各 core 档 §4 为 CLI 需求档并入面；VSC 条目未并 |
| 24 | `requirements/PHILOSOPHY.md`（136）· `requirements/RELEASE.md`（42）——VSC 端差异（RELEASE = 双市场通道；PHILOSOPHY = 合并前措辞对账） | `docs/core/requirements/{PHILOSOPHY,RELEASE}.md` | §5 / §4 之后 | 两 core 档为 CLI 需求档并入面 ⇒ **已并入（批 7）**——RELEASE：§5 VSC 端通道面（V-F1–V-F5 / V-N1–V-N3——双市场 = Marketplace + Open VSX）· PHILOSOPHY：**销项零并入**（VSC 版 = 本档旧措辞子集——§7.2 已核登记） |
| 25 | `requirements/FEATURES.md`（21） | ⚠ ~~归属疑变~~ → **D2 裁定（2026-09-15）：VSC 专有面** | —— | 内容 = 本产品 v1 功能范围；CLI 同判落 `docs/cli/requirements/` ⇒ **本行销项不并**——另落 `docs/vsc/requirements/FEATURES.md`（非 core 并入项 · 落笔待父侧另派） |
| 26 | `requirements/ADVISOR-CONVERGENCE.md`（57）——VSC 端对位面（F-A1–F-A12 / N-A1–N-A6 + 端差登记四条） | `docs/core/requirements/ADVISOR-CONVERGENCE.md` | 新增「VSC 端对位面」节（该档 §7 登记面之后） | 该档 `:8` 明载「VSC 端对位面不并入（旧档 §8 / §9 / §13——VSC 面，触发 = VSC 轮）」；§7 逐节登记在案 ⇒ **已并入（批 7）**——§8 VSC 端对位面（F-A1–F-A12 / N-A1–N-A6 + §8.3 对位与端差登记四条）· 档头声明 + §7.2 三行销项 |

**串行纪律**：本节目标在 `docs/core/**` ⇒ 与 CLI 批**同文件竞争**——两批**不得并行**（父侧排队）。

**批 6 收口（2026-09-15 · eng-designer）**：26 = **8（批 6 已并入——#2 / #3 / #5 / #15 / #16 / #17 / #19 / #22）** + **16（未并 · 待后续批）**
+ **2（裁定销项——#18 D3 维持现状不并 · #25 D2 判 VSC 专有面另落，非 core 并入项）** ✓（PROVIDER 目标 #4 / #7 = 他线在写 · 留待下批）。

**批 7 收口（2026-09-15 · eng-designer）**：26 = **8（批 6）** + **8（批 7 已并入——#6 / #8 / #9 / #10 / #11 / #12 / #24 / #26）** + **8（未并 · 待后续批——#1 / #4 / #7 / #13 / #14 / #20 / #21 / #23）** + **2（裁定销项——#18 / #25）** ✓
（#24 = RELEASE 并入 + PHILOSOPHY 销项零并入——§8B 本行；#4 / #7 = PROVIDER 目标 · 他线在写留待下批）。

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

**剔料（先剔一次性材料）**——逐处实核口径：**974 行**（口径 = 档头时点行 + 问题陈述 / 现场核实 / 方案选型 / 受影响文件 / 用例表 / 验收标准 / 边界 + §10.3 逐字 JS 施工形态 + §15 变更记录；逐处清单见批次档 §2）。
前批预估写 846 行——差额 = 口径不同（前批未计 §10 逐字 JS 代码块 27 行与各节头注 / 边界行），**以实核 974 为准**。
**正文素材 = 893 行**（1867 − 974）；三档均低于 300 行软线。**切面取舍理由**（含否决备选）见 `docs/vsc/design/WEBVIEW.md §9`。

**逐档并入 / 不并**：见各落点档的「不并项与历史沿革」节（逐项：旧档节 + 何故）——本表不重复（D2）。

**连带更新**：`docs/vsc/requirements/WEBVIEW.md`（设计侧引用翻转为同层三档——原「`WEBVIEW（VSC 侧）` 未迁」登记销项）。

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

**取面判据**：只取「判为**活档** · 且 `docs/core/` **无同话题档** ⇒ 纯新建」这一类（父侧 2026-09-15 01:49 口径）。
**坐标实核与漂移收正**：6 档内每条 `文件:行` 按现状实核（双端）；漂移处按现状改写。
**新档去重**：蒸馏本体 / 池结算 / 会诊机制不在新档重述（D2）。

### 9.4 批 4（统一面**纯新建**第一批 · 6 档 · 一设计 + 五需求）

**取面判据**：判为**活档** ∧ 落笔时**核层无同话题档** ⇒ 纯新建（父侧口径）。源档**一字未改**（留参照历史）。

| # | 源档（VSC 侧·一字未改） | 行数 | 落点（基准层活档 · 本批新建） | 行数 |
|---|---|---|---|---|
| 1 | `thincoder-vscode/docs/design/DOC-CODE-RECONCILE.md` | 488 | `docs/core/design/DOC-CODE-RECONCILE.md` | 206 |
| 2 | `thincoder-vscode/docs/requirements/AGENT-PARAMS.md` | 42 | `docs/core/requirements/AGENT-PARAMS.md` | 70 |
| 3 | `thincoder-vscode/docs/requirements/NORMAL-MODE.md` | 37 | `docs/core/requirements/NORMAL-MODE.md` | 73 |
| 4 | `thincoder-vscode/docs/requirements/MULTI-INSTANCE-COLLAB.md` | 44 | `docs/core/requirements/MULTI-INSTANCE-COLLAB.md` | 77 |
| 5 | `thincoder-vscode/docs/requirements/SETTINGS-TOOL.md` | 37 | `docs/core/requirements/SETTINGS-TOOL.md` | 71 |
| 6 | `thincoder-vscode/docs/requirements/STRUCTURE-DEBT.md` | 34 | `docs/core/requirements/STRUCTURE-DEBT.md` | 70 |

**批 4 按现状收正**：① DOC-CODE-RECONCILE——引擎宿主改指仓根统一版 · A2 存在域改「合并仓代码面」· 提示词条文改「本仓」；
② STRUCTURE-DEBT——N5「双树」按合并仓收正为单仓单检查；③ 各档坐标全量改写为现状路径并逐条实核。

**批 4 登记（非本批缺陷 · 供父侧）**：① `thincoder-vscode/scripts/reconcile-lookup.mjs:25` 反查域常量为迁移前目录（恒空输出——收正归父侧）；
② 既有 core 档 `docs/core/design/AGENT-PARAMS.md` 档头「需求侧 = 根层**无**对应档」句随批 4 新建需求档**已过期**（一行收正，父侧另派——不动既有 core 档）。

### 9.5 批 5（§8A 剩余纯新建 + `VSC-MIGRATION.md` 拆分）

**取面判据**：§8A「纯新建（未落）」6 档逐档**落笔时点实核**（不照抄批 4 出发点表）——
ADVISOR-CONVERGENCE 目标已被并行 CLI 批建成并提交 ⇒ **跳过新建**转 §8B-26（不覆盖他线产物）；
PROJECT 按父侧裁定（批次任务书）**拆分双落**；余 4 档纯新建。源档**一字未改**（留参照历史）。

| # | 源档（VSC 侧·一字未改） | 行数 | 落点（基准层活档 · 本批新建） | 行数 |
|---|---|---|---|---|
| 1 | `thincoder-vscode/docs/requirements/DESIGN-TOKEN-SETTLEMENT.md` | 42 | `docs/core/requirements/DESIGN-TOKEN-SETTLEMENT.md` | 74 |
| 2 | `thincoder-vscode/docs/requirements/ENG-TOKEN-BINDING.md` | 48 | `docs/core/requirements/ENG-TOKEN-BINDING.md` | 73 |
| 3 | `thincoder-vscode/docs/requirements/PORTABILITY.md` | 51 | `docs/core/requirements/PORTABILITY.md` | 77 |
| 4 | `thincoder-vscode/docs/requirements/VERIFY-REDESIGN.md` | 34 | `docs/core/requirements/VERIFY-REDESIGN.md` | 65 |
| 5 | `thincoder-vscode/docs/requirements/PROJECT.md` | 118 | `docs/core/requirements/PROJECT.md`（产品级定性面） | 83 |
| 6 | （同源——拆分） | 118 | `docs/vsc/requirements/PROJECT.md`（VSC 专有面） | 72 |

**跳过（写明）**：`requirements/ADVISOR-CONVERGENCE.md`（57）——目标核层档已由并行 CLI 批建并提交（其 `:8` / §7 登记「VSC 端对位面不并入，触发 = VSC 轮」）⇒ 转 §8B-26，本批**零写入**该档。

**PROJECT 切分规则（父侧裁定——逐档实核可判）**：跨产品契约（与 CLI 共享磁盘文件 / 协议 / 行为对齐）⇒ core 档；仅本端实现 / 界面 / 宿主面 ⇒ vsc 档。
逐条归属 = 两产物档各自的「不并项与历史沿革」节。**无判不准项**（六行决策表 + 待决策七项 + 时序节逐条可判）。

**本档拆分**：主档 `VSC-MIGRATION.md`（560 行——越 500 硬限）按 §13 规划拆——台账面（§3 / §4 / §5 / §8 / §9 / §10 / §11 / §12 / §13 / §14 / §15）⇒ 本档；
判据 / 方案选型 / 分批计划 / 待裁 / 变更记录留主档。拆分登记写进两档头注。

**坐标实核与漂移收正（批 5）**：4 档纯新建 + PROJECT 双落内每条 `文件:行` 按现状实核——漂移 2 类按现状改写：
settle 落盘块起点（advisor-async）旧档记 364 行 → 现状 363 行；index-discover 两坐标旧档记 126 / 135 行 → 现状 125 / 132 行。
**不引跨域用例号**：6 档零 `T-` 形字面编号（测试面只引 `thincoder-vscode/test/**` 档名）。

### 9.6 批 6（§8B 并入清单第一批 · 8 条）

**取面判据**：§8B 逐条落笔时点实核目标 core 档现态（不照抄拟插节）；**目标含 PROVIDER 者本批跳过**（#4 / #7——他线在写）；**#18 / #25 随批前裁定销项**（D3 维持现状 / D2 VSC 专有面——§8B 本行）；源档**一字未改**。（仍从略：逐档处置 = 逐条实核后并入——(d) 类 / 批次材料逐项入各落点档「不并项」节；坐标漂移按现态改写；零 `T-` 形跨域用例号；并入后逐档 ≤500 ✓。）

| # | 源档（`thincoder-vscode/**`·一字未改） | 行 | 落点（core 档 · 并入） | 落点行（并入后） |
|---|---|---|---|---|
| 2 | `docs/design/AGENT-PARAMS-TUNING.md` | 114 | `docs/core/design/AGENT-PARAMS.md` §4 注 + §6.3 | 141 |
| 3 | `docs/design/ARCHITECTURE.md` | 266 | `docs/core/design/ARCHITECTURE.md` §3.1 + §4.1 | 196 |
| 5 | `docs/design/PORTABILITY.md` | 458 | `docs/core/design/PORTABILITY.md` §3.6 + §5 | 183 |
| 15 | `docs/design/TOOL-OUTPUT-LIMITS-TUNING.md` | 139 | `docs/core/design/TOOL-OUTPUT-LIMITS.md` §6.3 | 165 |
| 22 | `docs/requirements/TOOL-OUTPUT-LIMITS.md` | 47 | `docs/core/requirements/TOOLS.md` §4.5「VSC 端显示层条目」 | 122 |

### 9.7 批 7（§8B 并入清单第二批 · 8 条）

**取面判据**：§8B 逐条落笔时点实核目标 core 档现态（不照抄拟插节）；**目标含 PROVIDER 者本批跳过**（#4 / #7——他线在写）；**#24 PHILOSOPHY 经实核销项零并入**（VSC 版 = core 档旧措辞子集）；源档**一字未改**。（仍从略：逐档处置 = 逐条实核后并入——(d) 类 / 批次材料逐项入各落点档「不并项」节；坐标按现状实核；零 `T-` 形跨域用例号；并入后逐档 ≤500 ✓。）

| # | 源档（`thincoder-vscode/**`·一字未改） | 行 | 落点（core 档 · 并入） | 落点行（并入后） |
|---|---|---|---|---|
| 6 | `docs/design/SESSION.md` | 520 | `docs/core/design/SESSION.md` §6.15 | 364 |
| 8 | `docs/design/MEMORY.md` | 325 | `docs/core/design/MEMORY.md` §6.9 | 366 |
| 9 | `docs/design/CONTEXT-COMPACTION.md` | 146 | `docs/core/design/CONTEXT-COMPACTION.md` §6.13 | 252 |
| 10 | `docs/design/MCP.md` | 170 | `docs/core/design/MCP.md` §6.10 | 221 |
| 11 | `docs/design/CHECKPOINT.md` | 105 | `docs/core/design/CHECKPOINT.md` §6.9 | 212 |
| 12 | `docs/design/CONSULTATION.md` | 161 | `docs/core/design/CONSULTATION.md` §6.5 | 257 |
| 24 | `docs/requirements/RELEASE.md` | 42 | `docs/core/requirements/RELEASE.md` §5（VSC 端通道面） | 83 |
| 26 | `docs/requirements/ADVISOR-CONVERGENCE.md` | 57 | `docs/core/requirements/ADVISOR-CONVERGENCE.md` §8（VSC 端对位面） | 218 |
| 16 | `docs/design/ENG-TOKEN-BINDING-TUNING.md` | 115 | `docs/core/design/ENG-TOKEN-BINDING.md` §6.3 | 144 |
| 17 | `docs/design/DESIGN-TOKEN-SETTLEMENT.md` | 109 | `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` §6.3 | 145 |
| 19 | `docs/requirements/MEMORY.md` | 50 | `docs/core/requirements/MEMORY.md` §4.7 | 172 |
| 22 | `docs/requirements/TOOL-OUTPUT-LIMITS.md` | 47 | `docs/core/requirements/TOOLS.md` §4.5「VSC 端显示层条目」 | 122 |

## 10. 受影响文件清单（R24a）

> 逐批明细已完整承载于批次档 §2（D2——不重复）；本表 = 台账汇总行（档数用量 + 落点面）。批 5 后各行 = 审批式（批 7 详列）。

**批 1**（5 新建 + 2 实修 + 1 append）：`docs/vsc/{requirements/VSC-MIGRATION, design/VSC-MIGRATION, design/SETTINGS, design/PROJECT-SWITCHER, requirements/WEBVIEW}` 新建 · `scripts/{check-doc-width-core,doc-anchors-v5}.mjs` 实修（SCAN_DIRS / V5_SCAN_DIRS）· 批次档 §2 append——明细 = 批次档 §2。

**批 2**（3 新建 + 2 实修 + 1 append）：`docs/vsc/design/{WEBVIEW,WEBVIEW-PROTOCOL,WEBVIEW-INPUT}.md` 新建 · `docs/vsc/requirements/WEBVIEW.md` + `docs/vsc/design/VSC-MIGRATION.md` 实修 · 批次档 §2 append——明细 = 批次档 §2。

**批 3**（6 新建 + 1 实修 + 1 append）：`docs/core/{design/{TURN-CAP-CONTINUE,SEND-STALL-DISTILL,ESCALATE}, requirements/{TURN-CAP-CONTINUE,SEND-STALL-DISTILL,ESCALATE}}.md` 新建 · `docs/vsc/design/VSC-MIGRATION.md` 实修 · 批次档 §2 append——明细 = 批次档 §2。

**批 4**（6 新建 + 1 实修 + 1 append）：`docs/core/{design/DOC-CODE-RECONCILE, requirements/{AGENT-PARAMS,NORMAL-MODE,MULTI-INSTANCE-COLLAB,SETTINGS-TOOL,STRUCTURE-DEBT}}.md` 新建 · `docs/vsc/design/VSC-MIGRATION.md` 实修 · 批次档 §2 append——明细 = 批次档 §2。

**批 5**（7 新建 + 1 实修 + 1 append）：`docs/core/requirements/{DESIGN-TOKEN-SETTLEMENT,ENG-TOKEN-BINDING,PORTABILITY,VERIFY-REDESIGN,PROJECT}.md` + `docs/vsc/requirements/PROJECT.md` + `docs/vsc/design/VSC-MIGRATION-INVENTORY.md` 新建 · `docs/vsc/design/VSC-MIGRATION.md` 实修（拆分收口）· 批次档 §2 append——明细见批次档 §2。

**待落（批 5 后边界外——逐条上报）**：**§8B 并入清单 26 条**（既有 `docs/core/**` 档——批 6 / 批 7 已各并 8 条，余 8 条父侧串行另派）· 待裁 D1–D3（主档 §7.1）· 镜像面判据句补条（`DOC-SYSTEM` §5.1——`docs/core/**`）。

**批 7（§8B 并入第二批——本批）**：

| # | 档 | 当前行数 → 并入后 | 动作 |
|---|---|---|---|
| 40 | `docs/core/design/SESSION.md` | 311 → 364 | 实修——§6.15 新增（VSC 面板装配接线面）· §7 决策 4 行 · §8.2 不并项 4 行 |
| 41 | `docs/core/design/MEMORY.md` | 334 → 366 | 实修——§6.9 新增（VSC 端实现面）· §7 决策 2 行 · §8.2 不并项 3 行 · §9 拆分表 +1 行 |
| 42 | `docs/core/design/CONTEXT-COMPACTION.md` | 225 → 252 | 实修——§6.13 新增 · §7 决策 1 行 · §8.2 不并项 1 行 |
| 43 | `docs/core/design/MCP.md` | 194 → 221 | 实修——§6.10 新增 · §7 决策 1 行 · §8.2 不并项 1 行 |
| 44 | `docs/core/design/CHECKPOINT.md` | 185 → 212 | 实修——§6.9 新增 · §7 决策 1 行 · §8.2 不并项 1 行 |
| 45 | `docs/core/design/CONSULTATION.md` | 235 → 257 | 实修——§6.5 新增 · §7 决策 1 行 · §8.2 不并项 1 行 |
| 46 | `docs/core/requirements/RELEASE.md` | 68 → 83 | 实修——§5 VSC 端通道面新增 + §6 不并项 |
| 47 | `docs/core/requirements/ADVISOR-CONVERGENCE.md` | 172 → 218 | 实修——§8 VSC 端对位面新增 + 档头 / §7.2 销项 |
| 48 | `docs/vsc/design/VSC-MIGRATION-INVENTORY.md` | 499 | 实修——§8B 尾注 · 批 7 收口 · §9.7 · §10 批 7 · §13 |
| 49 | `docs/batches/2026-09-15-vsc-doc-migration.md` | — | **append**——§2（不改 §1） |

## 11. 关键决策记录

| # | 决策 | 依据 / 否决备选 |
|---|---|---|
| D-VM1 | 迁移方式 = **B 式**（旧档留原地 + 内容重建入基准层） | 主档 §1.1——用户 2026-09-14 23:02 裁定 + CLI 轮已落形态；否决 A 式 `git mv`（批次材料随迁）· 纯统计轮 |
| D-VM2 | 二分底本 = `design` + `requirements` 顶层（84 档）；`_archive/` · `prompts/` · `batches/` · 根层 3 档**逐层单列** | §3——口径与 `DOC-SYSTEM` §5.2 的 CLI 侧底本一致（84） |
| D-VM3 | 依据列取值 = ① core 同话题活档 ∥ ② 已被取代 ∥ ③ 核内已单源化 ∥ ④ 结构性不对称 | 主档 §2.1——补 ④（P2 判据的可复核形态） |
| D-VM4 | 迁移期引用 = **引-2**（未迁档用 `名称（VSC 侧）§N`） | 主档 §2.3——`R3`（仓根全路径）**未实装**；现状口径见 `DOC-SYSTEM` §14 T7 |
| D-VM5 | 批 1 只写 `docs/vsc/**`；统一面 64 档**列而不写** | 主档 §1.2 / §8——父侧 2026-09-15 收紧写域（防与 CLI 批同文件互覆盖） |
| D-VM6 | 新建目录同批入射程（两扫描器常量） | §10 批 1 行 6–7——实证「搬档不改射程 ⇒ 无守卫窗口 + 假绿」 |
| D-VM7 | 待核 3 条**不下结论**、零写入 | **已于批 2 销项**（见 D-VM9） |
| D-VM8 | 批 2 切面 = **按面拆三档**（结构+活动区 ∥ 协议+秩序 ∥ 输入+渲染） | §9.2——读者面不同；否决两档（首档实测超 500 硬限）· 否决按批序切（无独立语义面）；取舍详表见 `docs/vsc/design/WEBVIEW.md §9` |
| D-VM9 | 镜像面 3 条（`VSC-PROMPTS` ×2 + `design/prompts/` ×1）**销项**：既有裁定 = 原地保留不动 | 主档 §7——出处：用户裁定「中文设计档原地保留」+「VSC 全押后」 |
| D-VM10 | 批 5 PROJECT **拆分双落**（产品级定性 ⇒ core · VSC 专有面 ⇒ vsc） | 主档 §7.2 D4 + 批次任务书裁定；切分规则 = 跨产品契约 ⇒ core / 仅本端面 ⇒ vsc（产物档 §5.2 逐条登记）；**无判不准项** |
| D-VM11 | `VSC-MIGRATION.md` 拆分切面 = **台账面整体移出**（§3–§5 · §8–§15 ⇒ 本档） | §13——主档只留判据 / 分批计划 / 待裁 / 变更记录；切点零交叉（台账面与判据面无互引正文）；两档均回落至 500 硬限内 |

## 12. 验收标准（逐条回指 F-M / N-M——需求 = `docs/vsc/requirements/VSC-MIGRATION.md`）

| # | 验收标准（机器可验） | 回指 |
|---|---|---|
| **A-VM1** | 实点表逐层档数 + 行数在档；二分表四行 disjoint 加总 = 84 = 底本（§3 / §4.3 双向闭合） | F-M1 |
| **A-VM2** | 二分表 84 行依据列逐行非空；「待核」条各含两种读法 + 依据 | F-M2 · N-M1 |
| **A-VM3** | 落点档 ≥1 档实体在 `docs/vsc/**`，且源档字节零改（`git status` 无 `thincoder-vscode/**`） | F-M3 · N-M6 |
| **A-VM4** | 各落点档含「不并项与历史沿革」节；无状态行 / 无逐批变更流水 | F-M4 |
| **A-VM5** | 落点档内每条 `文件:行` 断言按现状实核（漂移处按现状改写并上报） | F-M5 |
| **A-VM6** | `node scripts/doc-anchors.mjs` **根域悬空 = 0**；`SCAN_DIRS` / `V5_SCAN_DIRS` 含新目录且改后档数 > 改前 | F-M6 · N-M2 · N-M4 |
| **A-VM7** | 新增档无 >300 字符单行（表格行豁免）；无 >500 行档 | N-M3 |
| **A-VM8** | `git status` 改动集 ⊆ 声明的写域 | N-M5 |

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
| **A-VM14** | §4.3 小计四栏 disjoint 加总 = **84** = 底本；且 **64 档子集闭合**（60 仍属统一面 + 2 → 历史 + 2 → 专有面） | F-M8 |
| **A-VM15** | 批 3 新建 6 档在位、逐档 ≤500 行、含「不并项与历史沿革」节、无状态行 / 无逐批流水；坐标按现状实核（§9.3） | F-M3 · F-M4 · F-M5 |
| **A-VM16** | §8B 并入清单逐条含「内容 → 目标 core 档 → 拟插节 → 依据」四要素；且**当批对既有 `docs/core/**` 档零写入**（`git status` 实核） | F-M9 · N-M5 |

### 12.3 批 4（统一面纯新建第一批）验收标准

| # | 验收标准（机器可验） | 回指 |
|---|---|---|
| **A-VM17** | 批 4 新建 6 档在位、逐档 ≤500 行（实测 206 / 70 / 73 / 77 / 71 / 70）· 各档含「不并项与历史沿革」节 · 无状态行 / 无逐批流水 · 坐标按现状实核 | F-M3 · F-M4 · F-M5 |
| **A-VM18** | §8A 逐档「判」非空 + **小计闭合**（批 4 时点：18 = 6 + 6 + 6）；§4 对应行同步为「已迁（批 4）」/「并入既有」 | F-M7 · F-M8 |
| **A-VM19** | 既有 `docs/core/**` 档**零写入**（批 4 `git status` 实核）；`thincoder-vscode/**` 一字未改 | N-M5 · N-M6 |
| **A-VM20** | 三机检：域一锚悬空 0 · 宽度新增违规 0 · 台账 0 | N-M2 · N-M3 |

### 12.4 批 5（§8A 剩余纯新建 + `VSC-MIGRATION.md` 拆分）验收标准

| # | 验收标准（机器可验） | 回指 |
|---|---|---|
| **A-VM21** | 批 5 新建 6 档在位、逐档 ≤500 行（实测 74 / 73 / 77 / 65 / 83 / 72）· 各档含「不并项与历史沿革」节 · 无状态行 / 无逐批流水 · 坐标按现状实核（§9.5） | F-M3 · F-M4 · F-M5 |
| **A-VM22** | §8A 小计闭合（批 5 收口：**18 = 6 + 7 + 4 + 1**）；§4.2 六行同步（ADVISOR-CONVERGENCE 转并入 / 四行「已迁（批 5）」/ PROJECT 拆分双落） | F-M7 · F-M8 |
| **A-VM23** | ADVISOR-CONVERGENCE **跳过新建并写明**（§8B-26 登记）——未覆盖他线产物（`git status` 无该档改动） | F-M9 · N-M5 |
| **A-VM24** | 拆分产物两档在位且**均 ≤500 行**（实测见 §13）；拆分登记写进两档头注 | F-M3 · N-M3 |
| **A-VM25** | PROJECT 拆分逐条可判（切分规则 + 逐条归属落两产物档「不并项」节）；**无判不准硬塞** | F-M2 · N-M1 |
| **A-VM26** | 三机检：域一锚悬空 0（本批 8 档贡献 0）· 宽度新增违规 0 · 台账 0；`git status` 本批 ⊆ 写域（新建 core 需求档 + `docs/vsc/**` + 批次档 §2） | N-M2 · N-M3 · N-M5 |

### 12.5 批 7（§8B 并入清单第二批）验收标准

| # | 验收标准（机器可验） | 回指 |
|---|---|---|
| **A-VM27** | 批 7 并入 8 档逐档 ≤500 行（实测见 §10 批 7：364 / 366 / 252 / 221 / 212 / 257 / 83 / 218）· 各含「不并项与历史沿革」追加（(d) 类逐项登记） | F-M3 · F-M4 · N-M3 |
| **A-VM28** | 坐标按现状实核（本批实核 `thincoder-vscode/src/extension/panel-session.mjs:22,57` · `thincoder-vscode/src/extension/session-slot-write.mjs` · `thincoder-vscode/src/extension/history-window.mjs:22,106` · `thincoder-vscode/src/indexer.mjs:156,170` · `thincoder-vscode/src/compact.mjs:31,115,323,367` · `thincoder-vscode/src/extension/panel-callbacks.mjs:144-152` · `thincoder-vscode/src/agent/setup-reminders.mjs:145,163,194` · `thincoder-vscode/src/tools/git-ext.mjs:55` · `thincoder-vscode/src/tools/shell.mjs:139,148` · `thincoder-vscode/src/tools/git-checkpoint.mjs:31,46` · `thincoder-vscode/src/agent-tools/consult.mjs:29,223` · `thincoder-vscode/src/config-mcp.mjs:12,19,37,63` · `thincoder-vscode/src/extension/panel-mcp.mjs:8,28`） | F-M5 |
| **A-VM29** | 零 `T-` 形跨域用例号（八档零字面跨域编号引）；PHILOSOPHY 销项零并入已核（VSC 版 = core 档子集） | F-M9 · F-M2 |
| **A-VM30** | 三机检：域一锚悬空 0 · 宽度新增违规 0 · 台账 0；`git status` 本批 ⊆ 写域（8 目标 core 档 + INVENTORY + 批次档 §2 append） | N-M2 · N-M3 · N-M5 |

## 13. 体量与拆分规划（R24a）

**主档拆分（批 5 实落）**：`VSC-MIGRATION.md` 批 4 后实测 **560 行**——越 500 行硬限 ⇒ 台账面（§3–§15）移出为本档；判据 / 方案选型 / 分批计划 / 待裁 / 变更记录留主档（切法 = 候选①——台账面与规划面零交叉）。
**拆分后实测**：主档 **131** 行 · 本档 **490 行（批 7 并入后——§10 历史批五表归并压缩为汇总行 + §8B 尾注 / 收口 / §9.7 / §10 批 7 / §12.5 + 坐标补仓根前缀折行）**——均 ≤500 ✓（as-of 2026-09-15 实核）。

## 14. 用例表（正常 / 边界 / 错误）

> 本板块**无运行期代码**（纯文档面 + 两处常量行）⇒ 用例 = **机检谓词在样本档上的行为**，验证方式 = 仓根三机检 + 人工复核。

| # | 类 | 输入 | 期望输出 |
|---|---|---|---|
| 1 | 正常 | `node scripts/doc-anchors.mjs` | 根域汇总 **悬空 0** · `OK(V5)` |
| 2 | 正常 | `node scripts/check-doc-width.mjs` | 「无 >300 字符单行」+ 一致性新增违规不因本批增加 |
| 3 | 正常 | `node scripts/check-ledger.mjs` | 台账两档 `OK` · 0 处违规 |
| 4 | 边界 | 落点档内的未迁档引用（引-2 形态） | V1 不入判；V5-A 路径形态按仓根命中原档 |
| 5 | 边界 | 落点档内的产品树相对坐标（如 `webview/ui.js:445`） | **改写后**为 `thincoder-vscode/webview/ui.js:445` ⇒ 仓根解析命中；未改写形态 = 悬空（反向夹具） |
| 6 | 错误 | **计划产物**写成仓根全路径（`docs/vsc/design/<待建档>.md` 形态——带目录前缀） | V5-A 判**悬空**——**批 1 实证**：初稿 §6 批 2 行的落点即此形态，首跑红 1 处；改为**裸档名**后归零。**结论**：计划产物一律写裸档名 / `<占位>` 形态（判据缺口 = `DOC-SYSTEM` §12 末注「计划产物无合法锚形态」） |

## 15. 边界（本设计不做）

1. **§8B 并入 = 批 6 起逐批落笔**（父侧串行口径——批 6 = 第一批 8 条 · 批 7 = 第二批 8 条：`docs/core/{design,requirements}/` 各目标档按清单并入；余 8 条 = #1 / #4 / #7 / #13 / #14 / #20 / #21 / #23——PROVIDER 目标 #4 / #7 待他线完工）；**`thincoder-vscode/**` 仍零写入**（源档只读参照历史）。
2. **不写产品树**：`thincoder-vscode/**` 零写入（含注释）；`thincoder-cli/**` · `thincoder-core/**` 零写入。
3. **不写台账 / 提示词 / 批次档**：`docs/TODO.md` 零写入；提示词文件零写入；批次档只 append §2。
4. **不 commit、不发起评审**（发起权 = 用户）。
5. **不另裁已销项的待核 3 条**——镜像面 = 原地保留不动（主档 §7）。
6. **不迁批次档 / `_archive/`**（用户 2026-09-14 21:37「批次档不迁」；归档区 = 历史快照）。
7. **本档不含 UI / 交互决策**（迁移规划无界面面）——**显式声明豁免**，非遗漏；落点档各自的 UI 决策随档落档。
