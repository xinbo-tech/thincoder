> **变更史——正文冻结**（2026-09-10 文档重组批）：本档为一次实施批的过程记录或已被取代的旧权威档，
> 内容 as-of 交付时点，**不作为现状依据**。现状见 `docs/README.md` 地图指向的板块权威档。

# 文档目录结构重组（DOC-REORG——施工设计）

> 板块：文档基建（`docs/` 目录结构与文档规范）。
> 需求源：`docs/README.md`（规范已落档——§1 目录 / §2 规范 / §4 归属四问）+ `docs/TODO.md` 需求池同名条。
> 状态：**已批准（评审 pass 2026-09-10，13 条发现全采纳）——待用户批准实施**。
> 本档自身即批次档——批尾入 `docs/design/_archive/`（遵循本批制定的冻结规则，见 §9.4 批尾项）。

---

## 1. 问题陈述

`docs/design/` 现混装三类文档，读者无法判断哪句还算数：

| 类 | 形态 | 病 |
|---|---|---|
| 板块权威档 | 承载"现状"的机制/架构档 | 与另两类平铺——无结构边界 |
| 批次档 | 一次实施批的过程记录（已交付） | 交付后与现状档混放，读作现状 |
| 变更史档 | 已被取代的旧权威档 | 头注写"已被取代"，位置仍在现行区 |

实测症状（勘察 2026-09-10）：

1. **状态行互相矛盾**：`PROMPT-SYSTEM.md:10` 自述"需求待评审/待批准"，而施工档归属行称其"已批准
   （2026-09-10）"（`PROMPT-IMPL-1-TEXT.md:3`、`PROMPT-IMPL-2-CODE.md:3`、`PROMPT-IMPL-3-TEST-MIGRATE.md:3`），
   地图称"施工档三件已交付归档"（`docs/design/README.md:39`）——三处三种说法；三施工档**自身**状态行
   仍写"待评审/待批准"（`PROMPT-IMPL-1-TEXT.md:4`、`PROMPT-IMPL-2-CODE.md:4`、`PROMPT-IMPL-3-TEST-MIGRATE.md:7`）。
2. **地图自相矛盾**：`docs/design/README.md:39` 声明 `PROMPT-DECOUPLING.md` 已被取代，`:48` 又把它登记为
   "提示词架构"现存板块档。
3. **权威链悬空**：`PHILOSOPHY.md:144`、`ADVISOR-CONVERGENCE.md:21,196` 的权威指向 `METHODOLOGY.md`——
   而该档已自declared退役。

## 2. 方案选型对比

**主方案（存量深度）**

| 候选 | 判据 | 取舍 | 结论 |
|---|---|---|---|
| ① 全量迁移（47 权威档三层全拆 + 批次档归档） | 一步到位 | 47 次内容手术——与本批"只做结构"目标不符，风险与工时失控 | **否决** |
| ② 新老划断（新档按新规范，存量不动） | 零风险 | 上文三处症状全不解决——矛盾继续存在 | **否决** |
| ③ **只迁权威档 + 批次/变更史档冻结入档** | 结构一次到位；内容按新老划断 | 存量权威档的内容拆分延后（可接受——拆档是内容工作，随时可做） | **选定** |

**批次档去处（三选）**

| 候选 | 取舍 | 结论 |
|---|---|---|
| 甲 留 `design/` 原位 + 加冻结头注 | 零搬迁，但 `design/` 仍混装——看不出权威边界 | **否决** |
| 乙 **→ `design/_archive/`** | 目录一眼分清现状/历史；需改一批引用指针 | **选定** |
| 丙 → 新目录 `docs/batches/` | 多一级目录；`_archive/` 已存在且语义相符 | **否决** |

**冻结 vs 删除（对旧"独立保留"政策的处置）**：地图旧政策对已实现专题注"同板块独立保留"。
本批用**冻结**（保留文档、标"正文冻结、不作现状依据"）而非删除——"保留"承诺不违背（冻结 ≠ 删除），
但读者不再误读为现状。

## 3. 迁移清单

### 3.1 入 `docs/design/_archive/`（35 档 / 3450 行）

**A 组——已交付批次档（24 档）**

| 档 | 行 | 档 | 行 | 档 | 行 |
|---|---|---|---|---|---|
| PROMPT-IMPL-1-TEXT.md | 112 | DOC-REWRITE.md | 86 | RESIZE-MOUSE-LEAK-FIX.md | 86 |
| PROMPT-IMPL-2-CODE.md | 83 | DOC-REWRITE-LARGE.md | 71 | TUI-STDERR-CAPTURE.md | 84 |
| PROMPT-IMPL-3-TEST-MIGRATE.md | 81 | DOC-REWRITE-VSC.md | 71 | TRACE-STORE-VSC.md | 56 |
| BATCH-3-STRUCTURE.md | 70 | DOC-CLEANUP-BATCH.md | 117 | INPUT-LOCK-BEHAVIOR-REVISED.md | 78 |
| BATCH-4-DOC-CLEANUP.md | 72 | DOC-SWEEP-2026-09-09.md | 82 | QUICKFIX-BATCH-2.md | 76 |
| CODE-HARDENING-BATCH.md | 101 | DOC-REORG-VSC.md | 87 | ISSUE-FIX-BATCH.md | 79 |
| SYSTEM-SPLIT-BATCH.md | 68 | MODEL-MERGE-SESSION.md | 150 | MODEL-400-FIX.md | 74 |
| STRUCTURE-DEBT-BATCH-5-6.md | 109 | STRUCTURE-DEBT-BATCH-7.md | 63 | DUAL-END-TRUNCATION.md | 75 |

**B 组——变更史档（5 档）**：`METHODOLOGY.md`(190) · `PROMPT-DECOUPLING.md`(171) ·
`MAIN-DESIGN-ENHANCE.md`(99) · `PROMPT-ATTENTION-RESTRUCTURE.md`(163) ·
`PROMPT-ATTENTION-RESTRUCTURE-SPLIT-PLAN.md`(265)

**C 组——批记录型（机制正文已他移权威档，档内剩批过程；6 档）**：
`ADVISOR-VERDICT-TEMPLATE.md`(60) · `ASYNC-RESIDUE-FIX.md`(78) · `SCHEDULER-DYNAMIC-DOMAIN.md`(67) ·
`SYNC-CANCEL.md`(109) · `INPUT-LOCK-ASYNC.md`(105) · `ENG-SESSION-PROVIDER-CLEANUP.md`(112)

> C 组地图行注现为"同板块独立保留"——入档后**地图行注同步改为指向其机制权威档**
> （ASYNC-RESIDUE-FIX→AGENT-LOOP §7.5/§7.7/§7.7.1；SCHEDULER-DYNAMIC-DOMAIN→AGENT-LOOP §10.1/§10.2；
> SYNC-CANCEL→AGENT-LOOP §7.2；INPUT-LOCK-ASYNC→AGENT-LOOP §9/§11.3 + TUI.md §4/§8；
> ENG-SESSION-PROVIDER-CLEANUP→无他移权威——保留自身为机制叙述）。
> `ADVISOR-VERDICT-TEMPLATE.md` 的裁决行本体在 `src/prompts/advisor-*.md`——地图行注同步标注。

**搬迁方式**：`git mv`（保留历史），不重写内容——仅追加冻结头注（§6）。

### 3.2 留 `docs/design/`（52 档 .md）

- **板块权威档 47 档**（ARCHITECTURE / REQUIREMENTS / FEATURES / PHILOSOPHY / SESSION /
  CONTEXT-COMPACTION / RELEASE / AGENT-LOOP / TURN-CAP-CONTINUE / ENGINEERING-MODE /
  ADVISOR-CONVERGENCE / TOOLS / MCP / SETTINGS-TOOL / VERIFY-REDESIGN / EDIT / HASHLINE-EDIT /
  INSERT-AFTER / APPLY-PATCH / WRITE / EDIT-HELPERS / MEMORY / CHECKPOINT / LOGGING / TUI /
  TUI-INPUT-BOX / TUI-TOOL-OUTPUT / PROVIDER / PROXY / ACP-CLIENT / CONSULTATION / ESCALATE /
  TESTING / MULTI-INSTANCE-COLLAB / STRUCTURE-DEBT / DESIGN-TOKEN-SETTLEMENT /
  ASYNC-RESULT-CONTAINER / SUBAGENT-OBSERVE-SEND / PROMPT-SYSTEM + 四对 REQUIREMENTS/TUNING
  （AGENT-PARAMS / TOOL-OUTPUT-LIMITS / ENG-TOKEN-BINDING / SEND-STALL-DISTILL））
- **在途设计档 3 档**（`POOL-CONFIG-UNIFIED` / `QUICKFIX-BATCH-3` / `SUBAGENT-ID-COUNTER-AGENT`——
  设计待评审未实施，冻结不适用）
- `README.md`——转**过渡副本**（§4）；本档 `DOC-REORG.md`——批尾入档（§9.4）

> 计数口径（全目录对账）：顶层 `.md` 实测 **87** = 迁走 35 + 留 52（47 + 3 + README + 本档）。

### 3.3 不动

`design/_archive/` 现有 17 档 · `design/prompts/` 14 档（提示词中文模板源——权威源，勿被整目录搬迁带走）·
`docs/guides/` · `docs/TODO.md`。

## 4. 地图迁移（三步——过渡期不产生降级）

`design/README.md`（87 行）三段内容 → 新宿主：

| 段 | 去向 |
|---|---|
| 板块 → 文档映射表（含归档标注） | `docs/README.md` §4（填空占位；表格行重排，避免搬运长行） |
| 核心纪律 / 归属规则 | 并入 `docs/README.md` §3（规范）/ §5（归属四问）（去重——新规范已覆盖，重复部分不复制） |
| 变更记录 | 并入 `docs/README.md` 变更记录 |

**三步（顺序即依赖）**：

1. 地图内容迁入 `docs/README.md` §4（+ 去重 + 变更记录）——新权威就位。
2. `design/README.md` 转**过渡副本**：保留地图正文 + 顶部加一行过渡注
   （"地图权威已上移 `docs/README.md`；本档为过渡副本，批尾删除"）。
   理由：`src/advisor/messages.mjs:250-254` 现读该路径并把**文件全文**注入 advisor 作 "## Document Map" 段
   （评审第 7 维 Document ownership 的依据）——若在此处改成几行指针，过渡期该维度实质**降级**；
   保留正文则零降级。内容与 `docs/README.md` §4 同源（同一次迁移产物），无漂移风险。
3. **批尾**（§9.4 T1 代码改指新路径后）**删除** `design/README.md`——避免"两处地图"漂移源长期存在。

## 5. 引用更新清单（文档/提示词面——本批内做）

### 5.1 活体设计档（13 档 / 17 处）

| 档:行 | 现状 | 改 |
|---|---|---|
| `AGENT-LOOP.md:631` | 文档地图 = `docs/design/README.md` | 定义改指 `docs/README.md` |
| `AGENT-LOOP.md:633` | "任何代码变更都在 `docs/design/` 落文档" | 落文档域扩为 `docs/`（requirements + design） |
| `CHECKPOINT.md:150` | "文档地图：`docs/design/README.md` 登记本板块" | 改指 `docs/README.md` §4 |
| `SETTINGS-TOOL.md:6,132` | 关联行 + 受影响文件表中的地图路径 | 同上 |
| `STRUCTURE-DEBT.md:3` | 权威源指向 `docs/design/README.md` | 同上 |
| `STRUCTURE-DEBT.md:64` | "地图自身违反格式纪律"债条（L1/2/39/43） | **勾销**——地图上移后债对象不存在（注：现地图已无 >300 字符行，该债条本已过时） |
| `ENGINEERING-MODE.md:242` | 勘察 checklist 句内"（查 docs/design/README.md 地图" | 改指 `docs/README.md`（与 §5.2 的 `discipline-engineering.md:47` 同句，同批同改） |
| `AGENT-PARAMS-REQUIREMENTS.md:4` | 关联行含地图路径 | 改指 `docs/README.md` |
| `AGENT-PARAMS-TUNING.md:5` | 关联行含地图路径 | 同上 |
| `TOOL-OUTPUT-LIMITS-REQUIREMENTS.md:4` | 关联行 `README.md`（文档地图） | 改措辞为 `docs/README.md`（总地图） |
| `TOOL-OUTPUT-LIMITS-TUNING.md:5` | 同上 | 同上 |
| `SEND-STALL-DISTILL-TUNING.md:5` | 同上 | 同上 |
| `POOL-CONFIG-UNIFIED.md:93` | 受影响文件表行 `| docs/design/README.md | CLI | doc 豁免 |` | 改指 `docs/README.md`（在途档——只改路径串，不动状态） |
| `PHILOSOPHY.md:144` | 权威链指向 `METHODOLOGY.md`（↑入档） | 改指纪律层 `src/prompts/discipline-engineering.md`「文档规范」节 + `docs/README.md` |
| `ADVISOR-CONVERGENCE.md:21,196` | 权威链指向 `METHODOLOGY.md`（档位判据 >300/>500 / 行数标注义务 F-R24a） | 改指**实际承载处**：纪律层 `src/prompts/discipline-engineering.md:26`（## 文档规范）→ `:38`（受影响文件行数标注）+ `src/prompts/discipline-normal.md:49-50`（代码结构判据）。**不得**指 `docs/README.md` §2.5——该节是"代码变更落文档"，不含档位/行数判据 |

### 5.2 提示词（双源各 3 文件 / 共 6 文件）

| 文件 | 处 | 改 |
|---|---|---|
| `src/prompts/discipline-normal.md:13,32` | 地图路径 ×2 | `docs/README.md` |
| `src/prompts/discipline-engineering.md:47,182` | 勘察 checklist 地图路径 + 文档宽度判据权威源 | 同上 |
| `src/prompts/advisor-design.md:9` | 第 7 维 Document ownership 的地图路径 | 同上 |
| `src/prompts/advisor-design.md:5,10` | 准则 3「遵循项目 METHODOLOGY.md 吗」+ 准则 8「Tier authority = 项目 METHODOLOGY.md 代码结构节」 | METHODOLOGY 退役 → 改指纪律层（`discipline-engineering.md` 文档规范节 + `discipline-normal.md` 代码结构判据节） |
| `docs/design/prompts/discipline-normal.md:13,32,216` | 同源中文模板 | 同 src（**先改模板再回填 src**——双源流程） |
| `docs/design/prompts/discipline-engineering.md:107,110` | R24 挂钩节引 METHODOLOGY + 落文档域 | 地图路径 + METHODOLOGY 引用改指纪律层 |
| `docs/design/prompts/advisor-design.md:16,21,50` | 地图路径 + 准则 3/8 的 METHODOLOGY 引用 + 引用格式示例档路径 | 同上；示例换非搬迁档 |

### 5.3 仓级文件

| 文件:行 | 改 |
|---|---|
| `AGENTS.md:10` | "**本项目没有独立于设计文档的需求文件**"——与 `docs/README.md:11/24`（需求层独立成档）冲突；改为"需求层 `docs/requirements/` + 设计层 `docs/design/`（存量按新老划断迁移）" |
| `AGENTS.md:12` | "设计文档在 `docs/design/`" → 需求/设计双目录表述 |
| `AGENTS.md:14` | 逐档权威地图链接与路径 → `docs/README.md` |
| `docs/README.md` §4 | 填空（迁入板块登记表，表格行重排）；§2 补归属规则去重结果 |

### 5.4 不更新（明确排除）

- 批次档/变更史档**内部**的历史引用（冻结即不改——避免扰动历史快照）
- `_archive/` 既有 17 档内的旧路径引用（AGENT-LOOP R7f：`_archive/` 不在判定面）
- `CHANGELOG.md` 历史条目、git 历史
- **VSC 仓全部**（另立后续批——VSC 地图自洽，不受 CLI 地图搬迁影响）
- `.thincoder/index/manifest.json`（生成物—见 §5.5）

### 5.5 索引缓存处置

`.thincoder/index/manifest.json` 含 `docs/design/*.md` 路径条目（如 `METHODOLOGY.md` 等已搬迁档）。
本批**不手改**：该索引为生成物，搬迁后按既有机制重建即收敛。**若重建非自动**，批尾补一步重建
（批尾项 T4——实施时先核重建是否自动，自动则 T4 直接勾销）。

## 6. 冻结头注格式（统一——35 档各追加一段）

```markdown
> **变更史——正文冻结**（2026-09-10 文档重组批）：本档为一次实施批的过程记录或已被取代的旧权威档，
> 内容 as-of 交付时点，**不作为现状依据**。现状见 `docs/README.md` 地图指向的板块权威档。
```

已自带"已被取代"头注的档（B 组）——冻结注**追加在其后**，不替换原注（原注含取代关系细节）。

## 7. 受影响文件清单（R24：行数 + 预计增量）

### 7.1 移动（内容不改，仅加冻结头注）

35 档 / 3450 行 → 各 +3 行（冻结注 + 空行）= **+105 行**；路径变更 `docs/design/<档>` →
`docs/design/_archive/<档>`。

### 7.2 修改（活体文档 + 提示词 + 仓级）

| 文件 | 现行数 | 预计增量 |
|---|---|---|
| `docs/README.md` | 70 | +110（§3 板块登记表迁入 + §2 归属规则去重 + 变更记录） |
| `docs/design/README.md` | 87 | +1（过渡注一行；批尾整档删除） |
| `docs/design/AGENT-LOOP.md` | 722 | ±4（两处路径/域表述；**超 500 软档债已存在——本批不拆**，另立项） |
| `docs/design/ENGINEERING-MODE.md` | 351 | ±1 |
| `docs/design/CHECKPOINT.md` | 250 | ±1 |
| `docs/design/ADVISOR-CONVERGENCE.md` | 232 | ±2 |
| `docs/design/STRUCTURE-DEBT.md` | 183 | -2（债条勾销） |
| `docs/requirements/PHILOSOPHY.md` | 175 | ±1 |
| `docs/design/SETTINGS-TOOL.md` | 135 | ±2 |
| `docs/design/POOL-CONFIG-UNIFIED.md` | 130 | ±1 |
| `docs/design/SEND-STALL-DISTILL-TUNING.md` | 99 | ±1 |
| `docs/design/AGENT-PARAMS-TUNING.md` | 86 | ±1 |
| `docs/design/TOOL-OUTPUT-LIMITS-TUNING.md` | 116 | ±1 |
| `docs/design/TOOL-OUTPUT-LIMITS-REQUIREMENTS.md` | 43 | ±1 |
| `docs/design/AGENT-PARAMS-REQUIREMENTS.md` | 41 | ±1 |
| `src/prompts/discipline-normal.md` | 245 | ±2 |
| `src/prompts/discipline-engineering.md` | 195 | ±2 |
| `src/prompts/advisor-design.md` | 36 | ±3 |
| `docs/design/prompts/discipline-normal.md` | 248 | ±3 |
| `docs/design/prompts/discipline-engineering.md` | 122 | ±2 |
| `docs/design/prompts/advisor-design.md` | 66 | ±4 |
| `AGENTS.md` | 69 | ±3 |
| `docs/TODO.md` | 386 | ±8（需求池勾销 + 批尾/后续项登记） |
| `docs/design/PROMPT-SYSTEM.md`（实施后迁 `requirements/`） | 294 | ±1（状态行统一） |
| `docs/design/ESCALATE.md` | 179 | -1（重复条删除） |
| `.thincoder/index/manifest.json` | 生成物 | 重建（§5.5） |

> 全部对象均为 `.md`／生成物——按 `docs/README.md` §3 与项目文档行宽规则，**无代码文件**；
> `AGENT-LOOP.md` 722 行超软档为既有债，非本批引入。

### 7.3 新增

`docs/requirements/`（目录 + `README.md` 说明档：三层归属与"新老划断"迁移规则；
首批权威档需求层拆分不在本批）。**不含代码**——本批零代码改动（代码面全部移至 §9.4 批尾）。

## 8. 验收标准

### 8.1 逐条回指需求

| # | 验收 | 验证方式 |
|---|---|---|
| AC1 | 35 档全部位于 `docs/design/_archive/`，各带冻结头注 | 目录列举 + 头注字符串断言（35/35） |
| AC2 | `docs/design/` 顶层 `.md` = **52**：47 权威 + 3 在途 + `README.md`（过渡副本）+ 本档 `DOC-REORG.md` | 计数断言（口径见 §3.2 注） |
| AC3 | `docs/design/_archive/` = **52** 档（原 17 + 新 35） | 计数断言 |
| AC4 | `docs/design/README.md` 保留地图正文 + 顶部过渡注（指向 `docs/README.md`） | 内容断言（过渡注串 + 登记表首行） |
| AC5 | 板块登记表已入 `docs/README.md` §4；无"待迁移"占位 | 内容断言 |
| AC6 | §5 所列引用处全部改指新路径 | grep `docs/design/README.md`：**活体档零命中**；例外仅限 §5.4 豁免面（`_archive/` 既有档、冻结档内部历史引用、CHANGELOG、VSC 仓）与 `docs/design/README.md` 过渡副本自身 |
| AC7 | 提示词双源一致：模板与 src 的路径串同步（6 文件） | grep 对比 |
| AC8 | **`_archive/` 既有 17 档 + `CHANGELOG.md` 零 diff**；新迁 35 档 diff 面 = 每档仅 +3 行头注（无正文改动） | git diff 范围检查 |
| AC9 | 无内容篡改：搬迁为 `git mv` + 头注追加（除 §5/§7 列明处外零内容 diff） | `git diff --stat` 核对 |
| AC10 | 规范一致性：`docs/README.md` §3 与纪律层文档规范节关键句一致 | 关键句 grep 对比（如"按板块组织文档，不按功能点拆"、"同一机制只在一处详述"两串在两侧均命中） |
| AC11 | `docs/requirements/` 目录 + `README.md` 说明档存在（说明三层归属与新老划断） | 路径存在 + 内容断言 |
| AC12 | `PROMPT-SYSTEM.md` 状态行统一（"已批准、施工①②③已交付"，不再出现"待评审/待批准"） | 内容断言 |
| AC13 | `ESCALATE.md` 变更记录去重：L177/L178 同串出现次数 = 1 | 重复检测断言 |
| AC14 | 本档 `DOC-REORG.md` 批尾入 `_archive/` 并带冻结头注 | 批尾项 T5 完成后核 |

### 8.2 用例表（迁移批的边界/错误条件）

| 类 | 输入 | 预期输出 |
|---|---|---|
| 正常 | 35 档逐个 `git mv` + 追加冻结注 | 目标位置存在、源位置不存在、diff = +3 行 |
| 边界·重名 | 目标 `_archive/` 已存在同名档 | **不得覆盖**——停下报告（勘察已确认当前零重名） |
| 边界·双源不一致 | 模板与 src 路径串改后比对不等 | 以模板为准回填 src；仍不等 → 报告为双源漂移 |
| 错误·缺档 | §3.1 清单中的档在磁盘不存在 | 停下报告，不跳过（清单以磁盘勘察为源） |
| 错误·stub 缺失 | 交接期 `design/README.md` 被误删 | 从 `docs/README.md` §4 重建过渡副本（advisor 注入面不可缺） |

### 8.3 预期红灯（已知且接受）

`test/prompts-async-guidance.test.mjs:63,77` 从磁盘读 `docs/design/MAIN-DESIGN-ENHANCE.md` —— 该档入档后
ENOENT。用户裁定"红就红"——批尾以**解耦**方式根治（§9.4 T2：断言改读 `src/prompts/discipline-engineering.md`
真字节源，实测 A1/A3 子条全在）。**本批不预先改测试**。

## 9. 本批不做 / 批尾项 / 既有缺陷

### 9.1 顺序纪律（用户裁定）

**任何代码改动都在文档批完成之后**——设计/讨论阶段不碰代码；文档面全部落地并通过验收后，才执行 §9.4。

### 9.2 本批不做（范围边界）

- 代码文件任何改动（`src/**`、`test/**`、`scripts/**`）
- 47 权威档的内容拆分（需求层拆分按新老划断——碰到哪迁哪）
- VSC 仓文档重组
- 旧锚悬空清理（AGENT-LOOP 节号重排遗留）
- `.thincoder/index/manifest.json` 手改（§5.5）

### 9.3 另立后续项（记 `docs/TODO.md`）

- **47 权威档需求层拆分 + 四对 `*-REQUIREMENTS/*-TUNING` 归位核查**（`docs/README.md:43` 把 `*-TUNING`
  列为批次档命名——四对的归档/留驻判定需一次专门核查）
- **VSC 仓文档重组**（地图上移、批次档归档、双仓命名对齐）
- **AGENT-LOOP 节号重排遗留旧锚悬空**（`CONSULTATION.md:4,151,166,170` 引 §25/§25.3；
  `ESCALATE.md:4,146,161,165,172` 引 §19/§25；`ARCHITECTURE.md:74` 引 §18——均实存已不存）
- `AGENT-LOOP.md`（722 行）超档拆分
- **双源漂移**（本批勘察新发现）：`src/prompts/discipline-engineering.md`(195 行) 与中文模板(122 行)
  结构不一致——模板缺「推进档位收口」「交付链收口」「Multi-Task Parallelism」节，且仍存「R24 挂钩」节
  （src 已删）。PROMPT-SYSTEM §2 的"中文模板 = 权威源"与现状不符——需一次对齐核查
- `src/prompts/discipline-engineering.md:60` 残留维护者注（"METHODOLOGY 退役改写版"）——按编写纪律第 15 条清理

### 9.4 批尾项（文档批验收通过后执行）

| # | 项 | 说明 |
|---|---|---|
| T1 | `src/advisor/messages.mjs:245-250`（+VSC 镜像）改读 `docs/README.md` | 带旧路径 fallback（兼容未重组的下游项目）；改后执行 T5 删除 `design/README.md` 过渡副本 |
| T2 | `test/prompts-async-guidance.test.mjs:63,77` **解耦** | 断言改读 `src/prompts/discipline-engineering.md`（真字节源）——**根治**"文档搬家测试红"，非改路径 |
| T3 | 代码/测试注释里写死文档路径的去路径化（约 9 处：`src/advisor/truncate.mjs:3`、`src/tools/file.mjs:108`、`src/provider/errors.mjs:91`、`src/tui/suspension-drive.mjs:24`、`src/agent-tools/subagent-actions.mjs:175`、测试头注组） | 只留档名/标志名，路径交给地图——防止下次重组再断 |
| T4 | `.thincoder/index/manifest.json` 重建（若非自动） | 实施时先核是否自动重建；自动则勾销 |
| T5 | 删除 `docs/design/README.md` 过渡副本 + 本档 `DOC-REORG.md` 入 `_archive/`（带冻结头注） | 完成 §4 三步收官与 AC14 |

> T1–T4 属代码面——按 §9.1 **在文档批验收后**执行；届时经工程模式实现链（eng-coder + 设计 token）。
> T5 为纯文档动作，文档批内完成（本档入档 + 过渡副本删除须在 T1 之后——依赖 T1 已改指新路径）。

## 10. 实施记录（2026-09-10——文档面已执行）

### 10.1 已执行

- 批次 4a：`PROMPT-SYSTEM.md` 整档迁 `requirements/`（档位=需求/目标蓝图——§3 装配逻辑 +
  §7 批次史属设计层随档保留）；引用面 4 处同步（README/TODO/本档）

- 35 档 `git mv` → `docs/design/_archive/` + 冻结头注（每档 +3 行）
- 建 `docs/requirements/` + `README.md`（说明档）
- 地图三步：登记表迁入 `docs/README.md` §4；`design/README.md` 转过渡副本（正文保留 + 顶部过渡注）；批尾删除待 T1 后
- 引用更新：活体档 13 档 / 17 处 + 提示词双源 6 文件 + `AGENTS.md` 3 处（含 `:10` 需求基线句）
- 顺手修：`PROMPT-SYSTEM.md` 状态行（AC12）、`ESCALATE.md` 变更记录去重（AC13）

### 10.2 实施偏差（已落档）

| # | 偏差 | 说明 |
|---|---|---|
| D1 | 冻结头注位置 = **档首**（统一），§6 原措辞为"B 组追加在既有'已被取代'注之后" | 实现取档首插入（更醒目、全部 35 档形态一致）；原注一字未动（未替换） |
| D2 | AC6 剩余命中 1 处：`src/advisor/messages.mjs:245`（代码注释） | 属批尾项 T1 覆盖面——文档批验收时仍在（非疏漏） |
| D3 | 实施中修正超宽行 4 处 | 我引入的 2 处（`ADVISOR-CONVERGENCE.md:196`、`ENGINEERING-MODE.md:36`）+ 新档 2 处（`docs/README.md`、`docs/TODO.md`）——均已降至 ≤300 |

### 10.3 实施中发现（设计缺口——提请设计更新）

- **`scripts/check-doc-width.mjs` 扫描域 = `docs/design/`**（含 `_archive/` 豁免）：不覆盖 `docs/requirements/` /
  `docs/README.md` / `docs/TODO.md`——§2.7 的宽度纪律对新目录**无机械约束**。
  提议：新增批尾项 **T6**（默认扫描域 `docs/design` → `docs`，或双域）。属代码面——按 §9.1 批尾执行。
- **既有格式债（非本批引入）**：checker 现报 **4 文件 / 9 行**超宽——`AGENT-LOOP.md`×3、`SESSION.md`×3、
  `SUBAGENT-ID-COUNTER-AGENT.md`×1、`TUI.md`×2。本批未动（提议另立清理项）。

### 10.4 批尾代码面实施记录（eng-coder 交付——clean，L2 280/280 全绿）

| 项 | 结果 |
|---|---|
| T1 advisor 地图注入 | **Done**——优先 `docs/README.md` + 旧路径 fallback（候选列表）；注释同步 |
| T2 测试解耦 | **Done**——A1/A3 断言源 → `src/prompts/discipline-engineering.md`（真字节源），断言串不变；**2 红归零** |
| T3 注释去路径 | **Done**——15 处（5 src + 10 test）纯注释，零逻辑改动 |
| T4 索引核查 | **Done（无需动作）**——`.thincoder/index/` 是 DB 化前死产物（mtime 2026-07-29，全仓零读写点）；活体索引 `~/.thincoder/memory.db` 启动增量同步自动收敛 |
| T5 过渡副本删除 | **Done**——`docs/design/README.md` 已删；docs/ 下 README 唯一 |
| VSC 镜像 | **Not done（按用户裁定"只 CLI 仓"延后）**——设计 T1 行"（+VSC 镜像）"与 §5.4 冲突，以 §5.4/用户裁定为准；VSC 侧重组时一并做 |

### 10.5 批尾移交父侧的跟进项

1. 真断链 1 处：`src/tui/wrapped-spawn.mjs:1` 注释指向已入档的 TUI-STDERR-CAPTURE.md；另有约 12 处带 `docs/design/` 前缀的注释（指现行档）——扫尾项
2. `test/prompts-async-guidance.test.mjs:186,193` 仍以硬路径读 ESCALATE/AGENT-LOOP（现行档未搬故不红）——后续解耦项
3. `messages.mjs`（402 行）、`file.mjs`（470）、`subagent-actions.mjs`（470）超 300 行——既有结构债
4. 死产物目录 `.thincoder/index/` 登记删除
5. T6（check-doc-width 扫描域）——**未做，待用户裁**

## 变更记录

- 2026-09-10：建档（勘察①②双份报告 + 用户四项裁定：只 CLI 仓 / 只动结构 / METHODOLOGY 入档修引用 /
  待定组 6 档入档；代码改动全部移至批尾）。
- 2026-09-10：评审 pass（13 条发现全采纳）——补 §5.1 两行（ENGINEERING-MODE/POOL-CONFIG）、
  §5.3 AGENTS.md:10、§5.2 advisor-design METHODOLOGY 引用、§5.5 索引处置、AC2 计数口径（52）、
  AC4 过渡副本承载正文（避免 advisor 第 7 维降级）、AC8 收窄、AC11–AC14 新增、§8.2 用例表、
  §2/§9.2 计数口径统一（39→47）、§5.1 标题计数（13 档/17 处）、§7.2 补齐行数、ADVISOR-CONVERGENCE
  新权威目标更正（不得指 docs/README.md §3.5）、问题陈述 #1 措辞按实测更正。
- 2026-09-10：**用户批准——文档面已实施**（§10 实施记录：35 档搬迁 + 地图三步 + 引用更新 +
  顺手修；偏差 D1-D3 已落档；发现 check-doc-width 扫描域缺口——提请新增批尾项 T6）。
- 2026-09-10：**批尾代码面已实施并收口**（§10.4：T1-T5 全 Done——eng-coder clean，L2 280/280 全绿；
  §10.5 跟进项 5 条移交父侧）。**本批收口，本档入档冻结（AC14 ✓）**。
