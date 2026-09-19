# 工程模式可移植性（FR10–FR15）· 批次记录（2026-09-11）

> 六段 append-only，**一段一作者**：§1 讨论（主 agent）· §2 批次任务（eng-designer）·
> §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder 自写）· §6 验证与收口（父代理）。
> 编制：主 agent（工程模式）· 2026-09-11 · 来源 = 用户 12:44「**那可移植性那条可以做了**」（解冻 9-10 勘察的「先全整明白，再改」）。
> （父侧形态更正 2026-09-12：空占位行已清——实体内容见对应节；空占位 = 残留即先例）

---

## §1 讨论（主 agent 记）

### 需求来源

- 用户 2026-09-10 全量勘察裁定：「**先全整明白，再改**」→ 勘察完成（缺陷登记在案）；
- 用户 2026-09-11 12:44：**「那可移植性那条可以做了」** = 解冻，开工。
- 需求依据 = `docs/requirements/ENGINEERING-MODE.md` **§2（FR10–FR15）** + `docs/requirements/PROJECT.md`；
  勘察登记 = `docs/TODO.md`「**产品可移植性缺陷登记**」节（P1–P28 + 🔵 7 项，逐条带 file:line 与后果）。

### 本批范围（候选——**分割由 designer 勘察后裁定**）

工程模式是**面向任意项目的产品功能**——现行实现含大量**本仓约定硬编码**。勘察分级：

| 家族 | 内容 | 条数 |
|---|---|---|
| **A · 🔴 静默失效** | P1–P10：文档地图探不到即静默跳过 / METHODOLOGY 空 catch / 提示要求读不存在文件 / 代理在用户项目建 ThinCoder 形状 docs 树 / 非 git 项目索引全空 / 扩展名白名单外不可检索 / `^src[\\/]` 锚定致嵌套布局**绕过设计门禁** / 等 | 10 |
| **B · 🟡 降级可见 / 噪声** | P11–P28：含 **P14 活 bug**（`cmd-eng.mjs` 门禁指向已不存在的模板——选项必炸）· 项目根判据单点（`AGENTS.md`）· 工具链白名单 · 父侧维护文件黑名单误伤用户同名文件 / 等 | 18 |
| **C · 🔵 无害 / 仅信息** | 7 项（勘察节末） | 7 |
| **D · 机制面** | FR10–FR15 对应设计（含 FR11 METHODOLOGY 退役面 · FR13「本仓工具不进产品提示词」约束核对） | — |

**范围裁定点（designer A1 后二选一，给理由）**：
① 单批全量（A+B+C+D）；② **A 家族（🔴 静默失效）+ P14 活 bug** 为一批（推荐候选——静默类是"用户不可见不可修"的最危险面），B/C 其余另批。

### 已核事实（供 designer 免重复勘察）

- 勘察表已含逐条 `file:line` + 后果（**只读复核起点** = `docs/TODO.md` 可移植性节，P1–P28；行号 as-of 9-10，需现场复核）。
- 提示词面（P4–P7 · P11–P12）落点 = `src/prompts/*` 双源（`docs/design/prompts/*` 内容权威）；**实现落笔 = eng-coder**（主 agent 内容权 + coder 落笔——D1）。
- 本仓自指面：P7 的 `node scripts/check-doc-width.mjs`（只在本仓存在——**不得写进产品提示词**，FR13 约束；对照 = 第 13 批条目 C 的同类裁定）。
- `METHODOLOGY.md` 已退役（本仓）——P2/P3/P14 与 FR11 同族。

### 范围边界（明确不做）

- 不改第 7–14 批已交付行为面；不碰 POOL-LEDGER 在途面（`docs/TODO.md` 的收拢由该链设计师在飞——**本批设计师对 `docs/TODO.md` 只读**）；
- 不碰 `docs/design/ENGINEERING-MODE.md` 的 §2.26/§2.27（他批已落）与 §3.1 AC45–AC60（他链在途）；
- **不得自行新建档**（必须新建 → 停下打回主 agent；设计档归属由 A1 勘察判定——优先落既有档）。

### 待设计裁定

1. 范围分割（上「范围裁定点」）；
2. 每条家族内 finding 的修法（候选 ≥2 者给选型表）——**修法必须"通用化"而非"再硬编码一个本仓特例"**（判据：任意用户项目 + 本仓自身均正确）；
3. 受影响文件全清单（行数/增量）+ 用例 + AC（逐条回指 FR10–FR15 或勘察条目号）；
4. 提示词面与代码面的分工（内容权/落笔权）；
5. 与既有纪律的冲突核对（FR13 · 双端纪律 · D1）。

### 状态

**已收口 2026-09-11**（用户「那可移植性那条可以做了」）。下一步 = **设计**（spawn eng-designer）。

---

## §2 批次任务（eng-designer 自写）


### 批次任务（eng-designer 自写——2026-09-11）

**目标与理由**：工程模式可移植性修复（CLI 面）——消除 P1–P10 类**静默失效**（评审维度消失 / 门禁绕过 / 索引为空）+ P14 活 bug。
判据 = **通用化**（任意用户项目 + 本仓自身均正确）；禁「再硬编码一个本仓特例」。

**范围裁定（§1 裁定点 ②——本设计定为 ②）**：P1–P10 + P14，含**同点收口** P15（与 P10 同一行块）/ P25（P10 实现面同一性）/ FR14 落实 / FR15 定义面。
**明确出批**：P11–P13、P16–P28、🔵 项 → 批次三；VSC 端实现 → 批次二（镜像清单见设计档 §9；用户如要同批 = 一句话翻转）。

**设计档** = `docs/design/PORTABILITY.md`（逐条修法 / 接口契约 / 逐字文案 / 用例 / AC）；**需求档** = `docs/requirements/PORTABILITY.md`（FR10–FR15 指针 + FR14 落实文本）。

**本批条目（三方一致锚——设计档 §1.3 同表）**：

- PO-1 ← P1：文档地图缺失 → 显式降级（不再静默跳过） · PO-2 ← P2：METHODOLOGY 注入移除 → 声明键 + 降级
- PO-3 ← P3：评审指令文本去 `METHODOLOGY.md` · PO-4 ← P4：advisor-design 提示词去本仓引用
- PO-5 ← P5：纪律层去 docs 树形状 · PO-6 ← P6：纪律层去流程文件假设 · PO-7 ← P7：自指脚本要求移除
- PO-8 ← P8：非 git 索引 walk 回退 + 评审侧降级句 · PO-9 ← P9：索引扩展名扩表 / 可声明 / 未列入可见
- PO-10 ← P10·P25：判据单一权威 + 声明面 + 全接线（含 messages 拆分兑现） · PO-11 ← P14·P15：`/eng` 无前提 + 文案
- PO-12 ← FR14：推进档位契约入需求层

**实现面（3 面并行建议——文件域不相交；②③ dependsOn ①）**：

- 面① 分类核心：`src/conventions.mjs`（新）+ `dispatch` / `repos` / `advisor-settle` / `verify` / `cmd-eng` / `eng` / `config` 注释（PO-10/11）
- 面② 索引：`src/memory/file-walk.mjs`（新）+ `schema` / `code-sync` / `docs` / `code-index` / `cmd-reindex`（PO-8/9）
- 面③ 注入与提示词：`src/advisor/project-context.mjs`（新——第 13 批登记拆分计划兑现）+ `messages` + 六档提示词（PO-1–7）

**受影响文件**：源 16（含新档 3） · 提示词 6（双源） · 测试 4 新（+2 回归） · 文档 2 新；全表（含行数 / 增量）见设计档 §5。
**父侧维护面**（不入 coder `files` 声明）：`docs/README.md`（新板块登记） · `docs/TODO.md`（核销 / 指针） · `AGENTS.md`（本仓自指面声明） · CHANGELOG。

**验收标准**：AC-01–AC-14（设计档 §7——逐条回指 PO / FR）；用例 T-01–T-21（设计档 §6）。
**机器判据**：`npm test` 快层全绿 + `node scripts/check-doc-width.mjs` 新增超宽 0 / 一致性新增违规 0 + 受改文件 ≤500。
**会话级验证方向**（需求 §2 尾）：非 Node / 非 `src` 布局 / 无 `docs/` 树 / 非 git 项目全流程演练（父侧/用户手动面）。

**红线**：① 提示词只动设计档 §4.4 编辑点，既有锚句族零触碰（红线表 = 设计档 §3.5）；
② 不碰他链在途档（`docs/design/ENGINEERING-MODE.md` §2.26/§2.27、`docs/TODO.md` 本体、POOL-LEDGER 面）；
③ 提示词 = 主 agent 内容权 + coder 机械落笔（逐字 = 设计档 §4.4）；④ 派工时以设计档为任务书主体，本段为入口与守则。

**未决面（父侧/用户）**：批次二/三排期（设计档 §1.4） · 本仓 `.thincoder/conventions.json` 是否 dogfood（open-1） · FR10–FR15 正文搬迁归位（§2 → 需求档，父侧裁决）。

### 修正轮（评审轮次 1 后——2026-09-11）

**背景**：设计评审轮次 1（发现表见 §3）VERDICT = changes-required（🔴1 · 🟡7 · 🔵4 = 合计 12）。父侧裁决**全部采纳**；本轮 = 修正轮——**只改文档、不碰实现**（CLI/VSC 实现面零触碰；未 commit、未发起评审）。本段 = §2 面同步（append——与上文冲突处（如「源 16」计数、「用例 T-01–T-21」）以本段为准）。

**12 条逐条落点**（节名定位优先于行号）：

| # | 级别 | 落点 |
|---|---|---|
| 1 | 🔴 | 导出面裁决（迁出、不设 re-export）+ 第 4 导入方换源接线 + `docs/` 前缀换源结论 → 设计档 §3.3（新行 + 导出面裁决段）/ §8① / §5（`src/agent-tools/advisor.mjs` 行） |
| 2 | 🟡 | P7 全删（`check-doc-width` / 本仓 `docs/README.md` 指涉零残留）+ §3.5 公式例外句 + AC-06 措辞 → 设计档 §3.5 / §4.4（`:213–:214` 行）/ §7（AC-06） |
| 3 | 🟡 | CN 镜像补 `docs/design/prompts/advisor-design.md:21` → 设计档 §4.4（编辑清单行 + 中文镜像逐字块） |
| 4 | 🟡 | 三份中文镜像逐字目标文本（十一处落点）→ 设计档 §4.4「中文镜像逐字目标文本」块 |
| 5 | 🟡 | `src/config.mjs` 当前行数补 487 → 设计档 §5 |
| 6 | 🟡 | AC-06 作用域 = 六档编辑面；`discipline-normal.md:13/:32` = 已登记 P11（批次三）→ 设计档 §7（AC-06）/ §9 |
| 7 | 🟡 | 非字符串保守拦截保留注记（:197-198 注释随批更新）+ 未知路径用例 T-22 → 设计档 §3.3 / §6 / §7（AC-03） |
| 8 | 🟡 | 归属判定留痕（预授权原文 / 新板块理由 / FR14 落档理由 / D-1 核销落点）→ 设计档 §1.5（新节） |
| 9 | 🔵 | T-04 反例（`C:\src\app` 祖先段）+「声明修正」择定 → 设计档 §6（T-04）/ §10（open-4） |
| 10 | 🔵 | 行数改准：`messages.mjs` 411→413（§3.4 / §5 / AC-12 同改）· `test/prompts-async-guidance.test.mjs` 418→419 → 设计档 §3.4 / §5 / §7 |
| 11 | 🔵 | 过期注释清理面（`dispatch.mjs:186` · `agent-tools/advisor.mjs:112` · `src/advisor.mjs:5`）→ 设计档 §8⑤ / §5（`src/advisor.mjs` 行） |
| 12 | 🔵 | 检查点引文改准（`Not a git repository — checkpoints unavailable`——`src/tools/git-checkpoint.mjs:41`）→ 设计档 §4.3 / 需求档 §2（FR15 行） |

**修正面附注**：

- **计数同步**：受影响源文件 = **18**（含新档 3——第 4 导入方 `src/agent-tools/advisor.mjs` 与注释面 `src/advisor.mjs` 补入，详见设计档 §5）；用例表 = **T-01–T-22**（新增 T-22）；AC = AC-01–AC-14（计数不变；AC-03 / AC-06 / AC-12 三条改写）。
- **行数口径**：设计档 §5 表 = `split("\n").length`（含末行——`ENGINEERING-MODE.md` §2.26.3/§2.27.3 已裁定口径）；本次改准 = config 487 / messages 413 / test 419；新增行 = advisor.mjs（agent-tools）241 · advisor.mjs 290。
- **三方一致锚不破**：本批条目 PO-1–PO-12 与验收标准回指关系零变化（修正 = 落点级，不改条目/范围）。
- **机检**：`node scripts/check-doc-width.mjs`——宽度新增 0；一致性新增 1 条为 §3（评审段）内一处段引用笔误（把设计档节号误写成自指形态——:112 行；非本修正面内容；§3 为评审段、不属本段落笔面——请父侧处置：改字 or 登记基线）。
- 提示词落地约束不变：逐字目标文本（设计档 §4.4——含 CN 块）为 coder 机械落笔依据；红线锚句族（设计档 §3.5）零触碰。

## §3 设计评审（评审子代理自写）


### 轮次 1（评审子代理）

**核验基础**：三档全文 + 纪律层双源六档 + 相关源码/测试现场逐点核对（dispatch / repos / advisor-settle / verify / messages / code-sync / schema / agent-tools/advisor.mjs / git-checkpoint 等）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 完整性（受影响文件/接线） | 🔴 | §8①（docs/design/PORTABILITY.md:408）宣布 `isDocFile`/`isTempFile` 迁入 `conventions.mjs` 且「导出面不保留双份」，但 §5（:301-312）与 §3.3（:149）未列第 4 个导入方 `src/agent-tools/advisor.mjs`（:11 `import { isDocFile } from "../advisor/repos.mjs"`；:113-118 设计评审文档门禁硬编码 `docs/` 前缀 + 用户可见拒绝文案）；与 §3.1「所有门禁与守卫改为经它判定」（:129）冲突——照字面实现，该 import 链接期报错或 §8① 自相矛盾。 | 显式裁决导出面策略（迁出或保留 re-export），把该文件补入 §5/§3.3 换源，并顺带评估 :113 的 `docs/` 硬编码（至少登记）。 |
| 2 | 一致性 | 🟡 | §4.4 的 P7 改写仍把 `node scripts/check-doc-width.mjs` 与本仓 `docs/README.md` 留在产品提示词（「本产品自研仓 =」标注形态，design/PORTABILITY.md:287），与批次档 §1:36「不得写进产品提示词（FR13 约束）」相抵，也与**设计档** §9:424（`design/PORTABILITY.md`）「替代提示词中移除的自指句」预设矛盾；AC-06:392 的「示例标注除外」又恰好合法化该形态——三处口径需统一。 | 统一口径：按 §1 全删指涉（本仓声明已由 §9 安排入 AGENTS.md），或明确记录该标注形态获父侧/用户同意并对齐 §1/§9 措辞。 |
| 3 | 双源一致 | 🟡 | CN 镜像编辑清单漏 EN:10 对应位：`docs/design/prompts/advisor-design.md:21`（「档位权威 = 纪律层 `discipline-normal.md` 代码结构判据节（原 METHODOLOGY.md 已退役）」）不在 design/PORTABILITY.md:182 所列（:20 · :39 · :54）；EN 侧同句（:10）改写后双源语义分叉（CN 仍指向用户项目不可达的产品文件）。 | 补列 CN:21 为对应改写位（或注明保留理由）。 |
| 4 | 清晰度（落笔流程） | 🟡 | design/PORTABILITY.md:5 声明「提示词文案 = 本设计逐字定稿 + coder 机械落笔」、批次档 :97 红线③同口径，但 §4.4:295 对三份中文镜像只给「按上表逐点对应改写（语义同源、文本自持）」——无逐字目标文本，落笔即内容创作，与 D1 提示词内容权口径不符。 | 为三档中文镜像补逐字文本，或显式授权「coder 拟中文 + 主 agent 核验」并同步红线口径。 |
| 5 | 行数标注 | 🟡 | §5 表 `src/config.mjs` 当前行数 = "—"（design/PORTABILITY.md:312；实测 487 行，>300 档）——缺「当前行数」标注；±1 注释无跨档风险。 | 补 "487"（≤±1）。 |
| 6 | 范围/AC | 🟡 | `src/prompts/discipline-normal.md:13/:32` 与 CN 同款（docs/design/prompts/discipline-normal.md:13/:32）仍含指令性 `docs/README.md` 总地图引用，但 discipline-normal 不在六档编辑面；AC-06（design:392）「指令性引用 = 0」按全仓 grep 判定将不达标、按六档判定需写明作用域；该两行是否已登记为后续批 P 项 = unverified（本批勘察表不在评审范围）。 | 明确 AC-06 作用域；若属未登记的同类缺陷，登记并指明批次归属。 |
| 7 | 清晰度（门禁保全） | 🟡 | `src/agent/dispatch.mjs:196-199` 现行判据含 `typeof p !== "string" ||` 保守拦截分支（:197-198 注释在案），§3.3:149 换源写法未声明保留它，T-06–T-08 无用例——照字面换源有未知路径放行（fail-open）回归风险。 | 注明保留非字符串→保守拦截；T-06/T-07 组补一条用例。 |
| 8 | 文档归属/协调 | 🟡 | 新建双档未见归属判定/打回留痕：批次档 §1:43 要求「不得自行新建档（必须新建 → 停下打回主 agent；优先落既有档）」；且 FR10–FR15 正文仍居 ENGINEERING-MODE.md §2、搬迁归位为父侧裁决项（design:422，requirements/PORTABILITY.md:48-49），FR14 落实文本落新档而由工程模式板块主题（推进档位契约）承载——落档位置缺理由。 | 补一行归属判定与新建授权来源；指明 D8 登记（ENGINEERING-MODE.md §2.26.3 D-1）核销落点。 |
| 9 | 边界/可行性 | 🔵 | 绝对路径段匹配假阳：项目根祖先路径含 `src` 段（如 `C:\src\app`）时全路径判 code（含 docs 与声明逃逸口 `.thincoder/conventions.json`）；T-04（design:364）未覆盖该反例。 | 分类前按项目根相对化，或 T-04 补该反例并注明可声明修正。 |
| 10 | 行数标注抽核 | 🔵 | 抽核吻合：dispatch 480 / repos 173 / verify 292 / cmd-eng 94 / eng 67 / schema 440 / code-sync 374 / docs 413 / code-index 213 / cmd-reindex 44 / 六档提示词 226·154·41·69·56·53；漂移两处：`messages.mjs` 标 411（现场 413）、`test/prompts-async-guidance.test.mjs` 标 418（现场 419）。 | 修两处标注（±1–2）。 |
| 11 | 文档卫生 | 🔵 | 换源/迁移后的过期注释不在清理面：`dispatch.mjs:186`（"root-level docs like METHODOLOGY.md…"）、`src/agent-tools/advisor.mjs:112`、`src/advisor.mjs:5`（"repos.mjs still hosts the doc-file classifier (isDocFile)"）。AC-05 只查 `Read METHODOLOGY.md` 字样，不会暴露它们。 | 随批顺手更正（与 #1 同批处理 advisor.mjs）。 |
| 12 | 事实核验（措辞） | 🔵 | §4.3:258 与需求档 :31 的检查点引文「`Only available inside git repos`」实为 `src/git/checkpoint.mjs:7` 陈旧头注；实际运行时拒绝文案 = `src/tools/git-checkpoint.mjs:41` "Not a git repository — checkpoints unavailable"。「非 git = 明确报错、不改」的语义已核实成立（:41 抛错），仅引文有误。 | 引文改为 `Not a git repository — checkpoints unavailable`（或注明出处）。 |

**无异议项（六问核查）**：① 范围裁定② 与批次档 §1 的委派（designer 二选一 + 推荐②）一致，§1.2 三候选表/§1.4 排序/§9 边界完整；④ AC-01–14 逐条回指 PO/FR 完整（PO-1–12 全覆盖）；⑤「主 agent 内容权 + coder 落笔」流程已写明（例外见 #3/#4）；⑥ 他链零重叠：编辑面不含 ENGINEERING-MODE.md §2.26/§2.27 与 TODO 本体 ✓。

VERDICT: changes-required

计数：🔴 1 · 🟡 7 · 🔵 4（合计 12）。

> 〔父侧代笔（2026-09-11 13:15；17:10 改字——V1 引述字面不再命中）：§3 轮次 1 表内一处段引用勘误——上表发现 #2 行的旧写法（「本档」+§N 形态）改为「设计档 §9:424（`design/PORTABILITY.md`）」；本注不再引述旧字面，V1 源头消除。依据 = 第 8/12 批父侧代笔 §3 同口径。〕

### 轮次 2（评审子代理）

**轮次 2（单轮校验 + 硬性预算）——12 条处置落档核验（0 残遗 / 0 未落 / 0 新增矛盾）**

**核验基础**：设计档 / 需求档 / 批次档 三档本轮现读全文回读；逐条回读声明锚点 + 断言与主张一致性核对；只验不新猎。
**判定①**（AC-06「本产品自研仓 =」示例标注形态除外子句）：**宣留**（非残留）——六档最终文本保留该标注形态（设计档 :296–:301 / :310–:311 / CN 块 :317–:328），该子句与其一致且必要；`check-doc-width` 按 P7 全形态零指涉（:430），不受该子句豁免（三处口径 §3.5 :187 / §4.4 :302–:304 / AC-06 :430 已统一）。
**判定②**（落点断言 vs 主张）：12 条逐条一致；批次档 §2 修正块（:107–:120）映射与设计档落点全部对上，计数同步（源 18 · 用例 T-01–T-22 · AC-03/06/12 改写）三方一致；§3 尾父侧代笔已打标（:159）。

| # | Orig# | File | Severity | Status | Notes |
|---|---|---|---|---|---|
| 1 | #1 | design/PORTABILITY.md :156–:166 · :348 · :446 | 🔴 | Fixed | 第 4 导入方行在位（:157）· 导出面裁决「迁出、不设 re-export——四个导入方全部就地换源」（:164）·「`docs/` 前缀 = 换源退役」（:166）· §5 行 241 ≤±6（:348）· §8① 含第 4 导入方（:446）——四锚互一致 |
| 2 | #2 | :187 · :302–:304 · :430 | 🟡 | Fixed | P7 整句全删（:302–:304「全删本仓指涉、不用『本产品自研仓 =』标注形态」；新句零自指）· 例外句在位（:187）· AC-06「零指涉（全形态）」（:430）· 判定① = 宣留 |
| 3 | #3 | :195 · :321–:323 | 🟡 | Fixed | CN 清单补 `:21`（:195「（:20 · :21 · :39 · :54）」）· CN 块 `:21` ↔ EN `:10` 逐字目标文本在位（:323） |
| 4 | #4 | :313–:330 | 🟡 | Fixed | 「中文镜像逐字目标文本」块在位——三档十一处落点齐（EN/CN 对应；同句处注明「两档同句」） |
| 5 | #5 | :347 | 🟡 | Fixed | `src/config.mjs` 当前行数 = 487、±1（注释） |
| 6 | #6 | :430 · :457 | 🟡 | Fixed | AC-06 作用域 =「六档编辑面内」；`discipline-normal.md:13/:32` 明示「六档编辑面外——不计入 AC-06 作用域」→ 批次三（:457）。P11 登记声明指向 `docs/TODO.md` 勘察表——三档范围外（不可独立核验） |
| 7 | #7 | :156 · :419 · :427 | 🟡 | Fixed | 保留非字符串→保守拦截 + :197-198 注释随批更新（:156）· T-22 用例（:419）· AC-03 收 T-22（:427） |
| 8 | #8 | :59–:64 | 🟡 | Fixed | §1.5（:59 新节）四要素齐：预授权原文 / 新板块理由 / FR14 落档理由 / D-8 核销落点 |
| 9 | #9 | :401 · :470 | 🔵 | Fixed | T-04 补祖先段反例「反例 `C:\src\app\docs\a.md`（祖先含 `src` 段）」→ code + 「声明修正」择定（:401）· open-4 登记相对化不实施（:470） |
| 10 | #10 | :172 · :367 · :383 · :436 | 🔵 | Fixed | messages 413（:172 / :367 / :436）· test 419（:383）；全文无 411/418 残遗 |
| 11 | #11 | :450 · :348–:349 | 🔵 | Fixed | §8⑤ 三处过期注释（`dispatch.mjs:186` · `agent-tools/advisor.mjs:112` · `src/advisor.mjs:5`）· `src/advisor.mjs` 行「±1（过期注释 :5）」（:349） |
| 12 | #12 | :271 · requirements/PORTABILITY.md :31 · :56 | 🔵 | Fixed | 检查点引文 =「`Not a git repository — checkpoints unavailable`——`src/tools/git-checkpoint.mjs:41`」——设计 :271 / 需求 :31 双侧同改 + 需求变更记录（:56） |

VERDICT: pass

计数：残遗 0 · 未落 0 · 新增矛盾 0（🔴 0 · 🟡 0 · 🔵 0）。

## §4 用户批准（主 agent 记）

**2026-09-11 14:05 父侧代签**——用户 12:48 授权（窗口延至 **16:00**——13:12「授权再延长点，到下午四点」）；自缚三条件**齐备**：

- **轮次 1**：**changes-required**（🔴 1 · 🟡 7 · 🔵 4——§3 轮次 1）；
- **修正轮落地**（id=30）经父侧逐条实文核验：**12/12**（🔴 = advisor.mjs 第四导入方 + 导出面裁决「迁出、不设 re-export」+ `docs/` 前缀退役；余 11 条逐项）；
- **轮次 2 = pass**（id=41 收窄重发——12 条落档核验 **0 残遗 / 0 未落 / 0 新增矛盾**；判定① AC-06 除外子句 = **宣留**）；**token 已签发**（值不落档）。

**批准范围**：本批全量（E1——判据单一权威 + 声明面 + 索引回退 + 评审注入面 + 提示词面）——实施域 = 18 源（含新档 3）+ 6 提示词 + 3 新测试。

**遗留（批准时登记）**：① 第 6 条 P11 登记声明的独立核验（需对照 `docs/TODO.md` 勘察表——评审范围外，父侧 §6 收口时确认）；② 评审报告两处范围外注记（review surface 模板串档疑云）——父侧知悉；③ FR10–FR15 正文搬迁归位 = 父侧裁决项（未裁前 §2 为权威）。

## §5 实施记录（eng-coder 自写）


### 实施记录（eng-coder 自写——2026-09-11）

**交付摘要**：三面全量落地——18 源（含新档 3）+ 六档提示词 + 4 新测试；红区零触碰（`ENGINEERING-MODE.md` §2.26/§2.27 · `docs/TODO.md` 本体 · POOL-LEDGER 面 · VSC 端）；未 commit、未发起评审（子代理面）。本会话内闭环 = 实现 → 独立分歧审计（explore）→ fix round → 代码评审（advisor）→ 收敛交付。

**落地清单（实测行数——口径 `split("\n").length` 含末行）**

| 面 | 文件 | 实测 | 交付要点 |
|---|---|---|---|
| ① | `src/conventions.mjs` | 新 224 | 分类唯一权威（`isTempPath`/`isDocPath`/`isCodePath`/`classifyPath`）+ `.thincoder/conventions.json` 声明面（缓存 / 损坏与类型错均可见降级） |
| ① | `src/agent/dispatch.mjs` | 480→490 | 父侧门换源 `isCodePath` + 非字符串保守拦截保留 + hint §4.4 逐字 + 未声明时声明指路 |
| ① | `src/advisor/repos.mjs` | 173→151 | 两条旧谓词迁出（无 re-export）；`hasCodeMutations`/`isDocOnlyChange` 换源 |
| ① | `src/agent-tools/advisor-settle.mjs` | 213→212 | 本地 `isCodePath` 删除，陈旧判定换源 |
| ① | `src/agent-tools/verify.mjs` | 292→272 | `findProjectRoot`/`isUnderSrc` 死代码清；快路径与代码面换源 |
| ① | `src/tui/cmd-eng.mjs` | 94→79 | METHODOLOGY 门禁 + 模板分支 + picker 全删；ON 行改 `→ design-before-code enforced …` |
| ① | `src/agent-tools/eng.mjs` / `src/config.mjs` / `src/agent-tools/advisor.mjs` / `src/advisor.mjs` | 68 / 487 / 241 / 291 | eng 消息去 `in docs/`；config 注释纠正；advisor 文档门换源 + 拒绝文案换新；过期注释清理 |
| ② | `src/memory/file-walk.mjs` | 新 110 | `isSkippedRelPath` 单源 + `walkProjectFiles`（symlink 不跟随 / 上限 20000 / 截断标记） |
| ② | `src/memory/code-sync.mjs` | 374→414 | git 失败分支改 walk 回退；`{entries, unlisted, truncated}`；`indexExtensions` 并集；三处跳过副本归并；`index:unlisted`/`index:truncated` 事件 |
| ② | `src/memory/schema.mjs` / `code-index.mjs` | 440→453 / 213→220 | 扩展名扩表（代码 26 项 + 文档 4 项）+ 语言标签 |
| ② | `src/memory/docs.mjs` / `src/tui/cmd-reindex.mjs` | 413→418 / 44→52 | 返回形态适配 + `unlistedExts` + `/reindex` 声明指路提示行 |
| ③ | `src/advisor/project-context.mjs` | 新 195 | D-1 拆分兑现：项目根/指南/文档地图/标准文档/降级句 helper（§4.4 三句逐字） |
| ③ | `src/advisor/messages.mjs` | 413→300 | 净减 113；re-export 保持既有导出面；P1/P2/P3 落点 + 无 git 降级句 |
| ③ | 六档提示词 | 214/144/42/70/57/54 | §4.4 编辑点 11 处逐字落地（含 CN 块） |
| 测试 | 4 新档 | 180 / 86 / 132 / 134 | T-01–T-22 全落点（T-17 归册 slow——见透明表） |

**AC-01–AC-14 逐条自证（实测）**

| AC | 结果 | 证据 |
|---|---|---|
| AC-01 | ✅ | `thincoder-cli/src` 全量 grep：`^src[\\/]` / 组件式正则副本 = 0（余者仅注释）；唯一实现 = `src/conventions.mjs`。VSC 端同类副本 = 设计 §9 批次二登记面（本批不触） |
| AC-02 | ✅ | `test/portability-classification.test.mjs` T-01–T-05 全绿；`packages/foo/src/x.md` 判 code（T-02） |
| AC-03 | ✅ | T-06/T-07/T-08 + T-22 绿（`src/x.mjs` 拒 / 嵌套 `src` 文档拒 = 反证转绿 / `docs/design/x.md` 放行 / 非字符串保守拦截保持） |
| AC-04 | ✅ | T-05（损坏 + 类型错 → 默认 + warn + 不抛）· T-09（声明后门禁行为切换：`codePaths:["lib"]` → `lib/a.md` 拒、`src/a.md` 放行） |
| AC-05 | ✅ | 两条降级句 + 无 git 句逐字在场（`project-context.mjs:35-37`）；`Read METHODOLOGY.md` 全仓零命中 |
| AC-06 | ✅ | 六档内 `docs/README.md` / `docs/design/<TOPIC>.md` 未标注指涉 = 0（逐行过滤 `本产品自研仓` 标注行——T-20 断言）；`check-doc-width` 六档零指涉 |
| AC-07 | ✅ | 定向回归全绿：`prompts-async-guidance` / `prompts-dual-source` / `batch-segment`（**零改**——与 §5 预测一致）；红线锚句抽核在位（T-20 断言 + 既有档） |
| AC-08 | ✅ | `cmd-eng.test.mjs` T-18（空项目 ON 不崩、picker 探针不触发）+ T-19（OFF 提醒 + token 语义快照） |
| AC-09 | ✅ | T-13/T-14（walk 回退 + 跳过规则 + 截断标记 + 传播）绿；评审无 git 降级句（T-11 断言） |
| AC-10 | ✅ | T-15（扩表 + 语言标签）/ T-16（声明并集 + `unlistedExts` 计数）/ T-17（`/reindex` 声明指路提示行——slow 档，test:full 照跑） |
| AC-11 | ✅ | 门禁/工具文案 `in docs/` 零命中（唯一 `src/acp/bridge.mjs:178` 为 ACP 注释、非文案、非本批面）；声明指路在位（T-09 断言） |
| AC-12 | ✅ | `project-context.mjs` 在位（195）；`messages.mjs` 300 ≤ 500 且净减 113；既有导出面 re-export 保持 |
| AC-13 | ✅ | `requirements/PORTABILITY.md` §3 契约 + T-21（7 条要点） |
| AC-14 | ⚠️ 部分 | 本批文件：新增超宽 0（CN 镜像 :132 曾 307 字符 → 已断行）· 受改文件全 ≤500 · 4 新档全绿。**批级全绿未达**——2 条失败与 3 条一致性新增违规**全部非本批写域**（见下「遗留」；本批自身新增违规 0） |

**批级机检（实测值）**

- `node test/run-fast.mjs`：**463 tests / 449 pass / 12 skip / 2 fail**。两条失败均非本批：① `doc-consistency` T41——V1 违规 2 条（`docs/batches/2026-09-11-PORTABILITY.md` §3 父侧代笔行 :159 **引述**旧错误写法（自指形态：本档「§9」）+ 他批 `2026-09-11-TUI-SELECTION.md`），② `eng-designer-role`
  T40——他批在飞的 `docs/design/ENGINEERING-MODE.md`（已核 **HEAD 版该断言通过**、工作树版失败 ⇒ 非本批引入）。本批 4 新档 14 用例 + 定向回归档（prompts-async-guidance / prompts-dual-source / batch-segment / memory-tool / distill / verify-redesign / config / config-pool）**134/134 绿**。
  机械折行（2026-09-12 形态清零轮）——语义零改
- `node scripts/check-doc-width.mjs`：本批文件**新增超宽 0**（修复过程：CN 镜像 :132 由 307 字符断行至 ≤300）；一致性新增 3 条**全部**在他批/父侧文件（PORTABILITY 批次档 §3 代笔引述 1 条 + TUI-SELECTION 2 条）——本批新增违规 0。
- slow 门：零未归册拦截（T-17 归册 slow 后复核通过）。

**审计与代码评审（本会话内闭环）**

- **独立分歧审计**（explore 子代理，只读）：终态 = 0 🔴 · 1 🟡 · 3 🔵；四类判定 = 越界 **0** · 静默简化 **0** · 文档漂移 1（仅行数预测列）· 记录缺位 1（§5 彼时待写——即本段）；🟡 = 批级机检状态（上面两条非本批失败）。审计明示「AC-01/05/06/11/12 静态核验通过、§4.4 逐字（含 CN 十一处）逐点一致、22 用例全有落点、无第 29 个写域文件」。
- **代码评审**（advisor type=code · 轮次 1）：**VERDICT = changes-required**（🔴1 · 🔵2）。
- **fix round（轮次 1 后·同会话）**：3 条逐条裁决如下。

**评审响应表（逐条裁决）**

| # | Action | Detail |
|---|---|---|
| 1 | Fixed | 🔴 `conventions.json` 逐键类型错静默回落（设计 §3.2 / §4.1「类型错 → 默认 + warn + 日志事件」未落）→ `src/conventions.mjs:128-151`（`typeErrorsOf` 逐键类型校验：codePaths / index.*Extensions 须字符串数组、advisor.* 须字符串）+ `:199-208`（`console.warn` + `logEvent("conventions:error")`，回落语义不变）；`test/portability-classification.test.mjs:110-116`（T-05 类型错拆独立断言：清告警缓冲后 warn 仍须在场——修复前该支被前一场景的 warn 掩盖） |
| 2 | Fixed | 🔵 walk 截断标记丢层（`file-walk.mjs` 承诺 "never silently dropped"）→ `src/memory/code-sync.mjs:132-134`（`listProjectFiles` 收 `opts.maxFiles` 测试缝）+ `:151-161`（传播 `truncated` 至返回 + `logEvent("index:truncated")`）；`test/portability-index.test.mjs:74-77`（T-14 追加 listProjectFiles 级断言） |
| 3 | Deferred | 🔵 CN 镜像 `:140`（R24 挂钩段）保留产品内指涉 + 仓库退役注——设计编辑点表（§3.5 `:193`）未含该行、AC-06 两模式（`:430`）不命中 ⇒ **非违规**；登记于此，收口口径（「有意保留」或「归批次三」）= 父侧 §6 一行登记，本次不改文本（登记即本行） |

**决策透明表（设计面偏离/补充——如实披露）**

| # | 事项 | 说明 |
|---|---|---|
| 1 | `conv.declared` 布尔位 | §4.2 API 表未列——§4.4「未声明约定…时追加声明指路」所需；仅加在 `loadConventions` 返回对象上（键类型面极小） |
| 2 | `listProjectFiles` 收 `opts.maxFiles` + 返回 `truncated` | 评审 🔵 修正所需（测试缝 + 可见性传播）；主契约键 `entries`/`unlisted` 不变 |
| 3 | temp 类在父侧门禁的语义 | 落地序 = 代码段 > temp > 文档扩展名 > code（§3.1 词表）；`src/tmp-*` 仍判 code（沿用「代码段无条件」旧律）；代码段外 `tmp-*` 由旧「拦」变新「不放行（temp）」——与 `hasCodeMutations` 既有 temp 豁免对齐，方向一致 |
| 4 | 行数实测 vs §5 预测 | 超表：`repos` 151（≤±14，实 −22）· `verify` 272（≤±10，实 −20）· `code-sync` 414（≤+25，实 +40 含 fix round）· `schema` 453（≤+8，实 +13）· `conventions` 224（表 ~120，实 +104——文档/注释/类型校验扩写）· `cmd-eng` 79（表「净减 ~25」，实 −15）；余者在表内；全部 ≤500 / 新档 ≤300 |
| 5 | T-13 措辞落地 | 「listProjectFiles 返回两者」= 代码面列表 + 文档面列表并集（签名按请求扩展名集过滤，未变）；端到端索引由 codeSync 断言（原措辞见设计 §6——按实现面收敛） |
| 6 | T-17 归册 slow | `/reindex` = code+doc 两次全量重建（真实 fs + git 子进程），并行快层负载下超 800ms 拦截线（实测 905ms；单跑 ~130ms）——归册不是删除：快层 skip、`test:full` 照跑 |
| 7 | 声明指针动态化 | 门禁后缀 `(code paths: ${conv.codePaths.join(", ")})`——默认态渲染即设计 §4.4 的 `code paths: src`（未声明分支恒为默认值，语义等价） |

**遗留（非本批写域——请父侧 §6 收口时处置）**

1. `doc-consistency` T41 / check-doc-width 一致性：**本批自身 0 新增**；待处置 3 条 = ① `docs/batches/2026-09-11-PORTABILITY.md` §3:159 父侧代笔中**引述**的（自指形态：本档「§9」）② `2026-09-11-TUI-SELECTION.md` 的 2 条（V1 + V2）——均他批/代笔面，本 coder 无写权（一段一作者）。
2. `eng-designer-role` T40 失败 = 他批在飞 `docs/design/ENGINEERING-MODE.md` 引入（HEAD 版通过已验）——归该批收口。
3. 父侧维护面未落：`AGENTS.md` 自指声明（`check-doc-width`，设计 §9:463）· `docs/README.md` 新板块登记 · `docs/TODO.md` 核销（本批只读）· CHANGELOG。
4. 本仓 dogfood（`open-1`）：本批未建 `.thincoder/conventions.json`（默认判据对本仓即正确，与设计 §8③ 一致）。

## §6 验证与收口（父代理自写）

**2026-09-11 18:50 父侧收口**（CLI 面交付——**本批为 CLI 单端**；用户授权窗口 12:48→排空）。

### 父侧验证

- 定向 **134/134 绿**（4 新档 14 用例 + 定向回归）；快层 **463/449/12skip/2 fail**（2 fail = 他链在途：T40 / T41——已核非本批）；
- **父侧抽核**：`conventions.mjs` 223 行（唯一权威 ✓）· `messages.mjs` 299（净减 ✓）· 新档 ×3 在册 ✓ · 新测试 ×3 在册 ✓；
- `check-doc-width`/一致性：本批文件新增 0（§3 代笔行已改字——V1 源头消除）。

### 逐条验收结论

- 设计 AC 面逐条自证 ✓（§5 详表：分类核心/索引/评审注入三面全量落地）；**Simplified 零 · Not done 零**；
- 两轮评审收敛：changes-required（🔴1 逐键类型错静默回落）→ fix 轮 → **轮次 2 = pass** ✓。

### 需求池核销

- 需求池行「工程模式可移植性 FR10–FR15」→ **已核销**（判据单一权威 + 声明面 + 索引回退 + 评审注入面拆分 + 提示词落地）。

### 核销同步清单

- 角色表：无 ✓ · 状态行：§5 两轮收敛 ✓ · 计数：新档 3 + 新测试 3（+回归零改）✓ · 指针：需求 ↔ 设计 §9 ↔ 用例 ✓ · 变更记录：各档 ✓ · 待办：需求池行翻转 ✓ + 父侧维护面（遗留 1）待落

### 遗留项

1. **父侧维护面（待落）**：`AGENTS.md` 自指声明（设计 §9:463）· `docs/README.md` 新板块登记 · CHANGELOG（发布面）；
2. TUI-SELECTION 2 条一致性（他批）· T40 失败（他批在飞）· CN 镜像 :140 保留指涉（§5 登记）；
3. 本仓未建 `.thincoder/conventions.json`（open-1——降级可见路径已验）；
4. **设计 token 已消费（链终）**；commit 待父侧随批提交。
5. **补记（2026-09-11 19:50）**：实施后 as-of 回修补落——`docs/design/PORTABILITY.md:303-313` / `:330-332`（persona `:27`/`:25` 目标行归属修订后现文——实际交付口径）+ 变更记录 `:498`（**#186**，照 VSC 镜像批 #185 同源口径；逐字核验 EN/CN 两端）；另：同档 `:5` 状态行仍为「设计稿（待评审）」（陈旧——本批已收口，**留档待下次触碰**）。
