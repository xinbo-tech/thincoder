# 工程模式 v2 · 阶段 1.5（Function Spec 全拆）批次档

> 前情 = `docs/batches/2026-09-17-engine-mode-v2-arch.md`（已收口 2026-09-17——架构设计批准）

## §1 本批目标与条目（主 agent）

**交付目标**：按架构设计（`docs/core/design/ENGINEERING-MODE-V2.md` §2.2 模块划分 M1–M10）拆出 **10 份 Function Spec**（模块级需求）——每模块一份，交 designer 核对合规后进模块设计。

**落点**：`docs/core/requirements/`（沿用现有目录与命名风格，见架构设计权威源 §2.2）。

**本批条目**（10 条——M1–M10 各一份 Function Spec）：

| # | 条目 | 模块（架构设计 §2.2） | 需求依据 |
|---|---|---|---|
| 1 | `ENGINEERING-MODE-V2-SPEC-MANIFEST.md` | M1 项目状态档 manifest | v2 §5.1 · §6 · §9 |
| 2 | `ENGINEERING-MODE-V2-SPEC-LEDGER.md` | M2 台账（SQLite） | v2 §5.2 |
| 3 | `ENGINEERING-MODE-V2-SPEC-BATCH-SEGMENT.md` | M3 批次档六段 | v2 §5.3 |
| 4 | `ENGINEERING-MODE-V2-SPEC-WRITE-GATE.md` | M4 写权门禁 | v2 §7 · §8.5 |
| 5 | `ENGINEERING-MODE-V2-SPEC-DELEGATION.md` | M5 委派与 spawn 门 | v2 §8.1–8.2 · §9.3 |
| 6 | `ENGINEERING-MODE-V2-SPEC-REVIEW-CREDENTIAL.md` | M6 评审凭证 | v2 §8.5 |
| 7 | `ENGINEERING-MODE-V2-SPEC-CHECKLIST-REMOVAL.md` | M7 checklist 废除 | v2 §5.2 · §10.1 |
| 8 | `ENGINEERING-MODE-V2-SPEC-MACHINE-CHECK.md` | M8 机检引擎 | v2 §8.7 |
| 9 | `ENGINEERING-MODE-V2-SPEC-PROMPT-PIPELINE.md` | M9 提示词单向生成 | v2 §8.4 |
| 10 | `ENGINEERING-MODE-V2-SPEC-TEST-DISCIPLINE.md` | M10 测试纪律 | v2 §8.6 |

**功能规格五要素**（每份）：① 模块目标（为谁解决什么问题）② 功能点（逐条可验收）③ 边界（明确不做什么）④ 验收（逐条可机判）⑤ 依赖（上游模块 / 被依赖方）。

**范围边界（本批不做）**：
- 只出 Function Spec（模块级需求），**不做模块设计、不写实现代码**（模块设计 = 后续批）。
- 需求原文只引用不改写；不改架构设计档、不改 v1 老档。
- 委托开发方法论（v2 §4）→ 阶段 2，本批不展开。

**同批继续（2026-09-17 主 agent 裁定——「先按现有流程把设计落地」）**：本批交付扩展为**「M1–M10 设计阶段」** = 10 份 Function Spec + 10 份模块设计（Module Design）。规格（需求层）→ 模块设计（设计层）同属一交付目标（设计做完），不另起批。

**模块设计条目**（10 条，落点 `docs/core/design/modules/ENGINEERING-MODE-V2-MODULE-*.md`）：

| 波 | 条目 | 依赖 |
|---|---|---|
| 一 | M1 manifest · M2 台账 | M1/M2 为其余模块上游 |
| 二 | M3 批次档 · M6 评审凭证 · M7 checklist 废除 · M8 机检 · M9 提示词 · M10 测试 | 仅依赖 M1 |
| 三 | M4 写权门禁 · M5 委派门 | 依赖 M6 / M4 |

**模块设计五要素**：① 问题陈述 ② 方案与理由（就方案本身说清为什么这么设计——不强制列候选对比）③ 受影响文件全清单（源/测试标当前行数 + 预计增量，**含两端接线面**）④ 验收标准逐条回指 Function Spec ⑤ 变更记录（一行注记）。

**写权**：Function Spec = 主 agent（v2 §7.1 写权矩阵——需求文档归主 agent）。designer 核对合规（五要素齐、具体到可设计），不合规打回。

**状态行**：🔄 进行中——规格已全拆（10 份，2026-09-17）· 模块设计第一波（M1+M2）进行中（#51）。

---

## §2 本批任务书（eng-designer）

_（designer 核对合规后写）_

**交付目标**：按 Function Spec 产出 **M1 manifest / M2 台账** 的模块设计（Module Design），落点两份模块设计档 + 本段 §2。已按五要素（问题陈述 / 方案与理由 / 受影响文件全清单（行数 + 增量 + 两端接线面）/ 验收逐条回指规格 / 变更记录）落笔。

### 覆盖条目（2 条 → 2 档）

| # | 条目 | 设计档落点 | 规格 AC 覆盖 |
|---|---|---|---|
| 1 | M1 项目状态档 manifest | `docs/core/design/modules/ENGINEERING-MODE-V2-MODULE-MANIFEST.md` | AC-M1-1..5 |
| 2 | M2 台账（SQLite） | `docs/core/design/modules/ENGINEERING-MODE-V2-MODULE-LEDGER.md` | AC-M2-1..6 |

### 显式不在本批（out-of-batch）

- **不写实现代码**（eng-coder 职责，后续批）。
- **不改架构设计档 / 规格档 / v1 老档 / 代码**。
- **不做台账展示面新形态**（`ledger-surface.mjs` ×3 随 md 读面删除，替代 UI 未落点——待主 agent 裁）。
- **不做 `check-ledger` 脚本迁移**（归 M8 机检引擎删除/替换，本批仅登记死指针耦合）。
- **不代 M8 落测试删除**（`ledger.test.mjs` 归 M8，`ledger-surface.test.mjs` 随本批——两文件归属切分见 M2 档 §2.5）。

### 受影响文件（本批产物）

| 文件 | 动作 | 说明 |
|---|---|---|
| `docs/core/design/modules/ENGINEERING-MODE-V2-MODULE-MANIFEST.md` | 新建 | M1 模块设计 |
| `docs/core/design/modules/ENGINEERING-MODE-V2-MODULE-LEDGER.md` | 新建 | M2 模块设计 |
| `docs/batches/2026-09-17-engine-mode-v2-specs.md` | 追加 §2 | 本任务书段 |

（两份模块设计档内的「受影响文件」表另列**实现期**接线面文件 + 行数 + 增量——那是设计交付内容，非本批改动。）

### 验收标准（逐条回指规格，可机判）

| # | 验收判据 | 回指 |
|---|---|---|
| A1 | 每份模块设计档含五要素（问题陈述 / 方案与理由 / 受影响文件全清单含行数+增量+两端接线面 / 验收逐条回指 / 变更记录） | §1 五要素 |
| A2 | 验收标准逐条回指 Function Spec 的 AC 号（M1→AC-M1-1..5 · M2→AC-M2-1..6），每条可机判 | 三方条目一致 |
| A3 | 受影响文件表每行标 `当前行数 + 预计增量`，越档文件（近 500 硬上限）带拆分计划 | R24a |
| A4 | 设计档无 >300 字符单行，正常换行与分隔（人类可读） | 写文档纪律 |
| A5 | 本段 §2 与 §1 条目 / 两档验收回指条目三方一致（2 条 ↔ 2 档 ↔ 2 组 AC） | 三方条目一致 |
| A6 | M2 schema 三 CHECK 枚举 + `task_book` 咬合 CHECK + 计数 COUNT 单源在档内逐字可核 | AC-M2-1..6 |

### 待主 agent 确认的观察项（本批未自行裁决）

1. **M2 ↔ M8 落地时序**：M2 重写删除 md 读面导出（`scanGroups`/`summarizeLedger` 等）后，`scripts/check-ledger.mjs` + `check-ledger-core.mjs`（M8 删除目标）的静态 import 悬空。**需裁：M2 与 M8 同批落地，或 M2 保留临时兼容 shim**。本批未自行裁决。
2. **台账展示面新形态**：`ledger-surface.mjs` ×3 + CLI/VSC 渲染接线随 md 读面删除后，agent 待办可见性由「启动面板常驻显示」改为「主动查台账命令」——**行为变更显式登记**；新展示面（若有）形态与落点需主 agent 裁。
3. **架构 §2.2 M1 行「五键」计数漂移**：✅ 已收正（架构 :64 已改七键，含 `version` + `promptsLanding`）——本观察项过期，仅留档。

**状态行**：🔄 进行中——规格已全拆（10 份，2026-09-17）· 模块设计第一波（M1+M2）§2 已落笔，待评审（#51）。

### §2 修正（eng-designer · 2026-09-17 修正轮）

M2 设计自核发现展示面归属误判，已收正并同步本段：

1. **展示面「删除」→「修改（数据源迁移）」**：架构 §2.3 E1 接线表（`:88`）M2 行对 `ledger-surface.mjs` ×3 判「**修改**」（非删除）。原 §2「不做台账展示面新形态（×3 随 md 读面删除）」作废——展示面（状态条 + 启动行 + 变化行）**保留**，只换数据源（md → SQLite）。CLI `index.mjs`/`render-frame.mjs`、VSC `chat-panel.mjs` 由「修改（删接线）」转为**零改**。原观察项 2（展示面新形态待裁）随之**作废**（无需主 agent 裁新展示面）。
2. **测试归属切分收正**：`thincoder-cli/test/ledger-surface.test.mjs`（335 行）与 `thincoder-vscode/test/ledger.test.mjs`（236 行）由「随本批删除」改为「**随数据源迁移失效 → 归 M10 测试模块重写**」。原 §2「不代 M8 落测试删除」表述不变，但 M8 删除目标现明确为 `check-ledger` 两脚本 + `thincoder-cli/test/ledger.test.mjs`（266 行）+ `thincoder-vscode/test/ledger-check.test.mjs`（151 行）。

### 新增观察项（待主 agent 确认）

4. **行龄源迁移（行为变更）**：展示面「老化」判据由 git blame（`blameAges` 行龄）迁为 SQLite 时间戳（`created_at`/`updated_at`）——阈值语义「距上次编辑」→「距建档/更新」，边界略有偏移。已在 M2 档 §2.5 显式登记（不阻断，阈值仍 `AGING_DAYS` 30 天）。
5. **M2 → M10 事实依赖**：M2 落地即破 `ledger-surface.test.mjs` / `ledger.test.mjs`（VSC）两测试档，而架构 §2.2 M10 行标「独立简化，无依赖」。**需裁：最小测试重写折回 M2，还是维持 M2→M10 依赖顺序**。
6. **架构接线表缺口**：架构 §2.3 E1 接线表（`:88`）M2 行未列命令注册文件 `tools/index.mjs`（查询命令）+ `family-tools.mjs`（写命令），但规格 ②.3/②.4 与架构 `:166` 都要求命令面。M2 档已按规格补入这两文件（不阻断，交架构侧核对是否回补接线表）。

### §2 本批任务（eng-designer 段）

**交付目标**：工程模式 v2 修正轮——设计评审发现逐条落入 M1/M2 模块设计档 + 架构档（§2.3 E1 / KD7）。父侧派单裁定：**本轮落地 #1/#2/#3/#6/#8/#9/#10/#11/#12/#13/#14/#15/#17/#18/#19，跳过 #4/#5/#7/#16（父侧已直接收正）**。

**本批条目（设计评审发现处置）**：

| # | 条目 | 验收 |
|---|---|---|
| 1 | M1 指针校验落点（✅ 父侧裁定 2026-09-17：**接受方案②**——`validateManifest(obj, { cwd } = {})` 可选 cwd 验指针；理由 = KD-M1-5 判据单源：readManifest/writeManifest 共用同一校验入口，方案①会使 writeManifest 落盘无指针校验或重复实现） | `validateManifest(obj, { cwd } = {})` 双参（第二参可选）+ 传 cwd 时指针可解析 |
| 2 | M2 DDL `status`/`kind` 补 NOT NULL（CHECK 对 NULL 不判——兜底）+ 同步架构 §2.3 E1 | 两档 DDL 均含 `NOT NULL CHECK` |
| 3 | M1 `requireManifest` 符号落地（钩子入口 = `readManifest(cwd)`） | §2.1 数据流含 `requireManifest(cwd)` |
| 6 | M2 受影响文件表补两测试档（最小重写随 M2 实施批——§4 裁定 5） | 表含 `ledger-surface.test.mjs`/`ledger.test.mjs` 两行 |
| 8 | M2 补允许迁移表 + AC-7/T10 | `ledgerUpdate` 迁移前判表；`ledgerClose` 目标 ∈ {已核销, 已废弃} |
| 9 | M2 族发现标记变更（TODO.md → ledger.db）行为变更登记 §2.5 | 发现集随标记变更显式在案 |
| 10 | M2 受影响文件表补 `.gitignore`（`ledger.db` 行） | 表含 `.gitignore` 行 |
| 11 | M1 `docRoot` 子键缺失 fallback = 整键缺失（递归缺键） | 补默认值后校验再通过 |
| 12 | M1 `initManifest` 无条件落盘背书（写门缺省拒已机械兜底） | 不重复依赖 userInitiated 标志 |
| 13 | M1 七键校验常量 / 整档缺失 vs 缺键两分 / writer 门 / 初始化走同一写门 | ①-④ 四处落地 |
| 14 | M2 `trigger` 裸列保留（不加引号不改名）+ 实测记录 | AC-6 记录实测通过 |
| 15 | M2 scan 形状契约（`buildScan` 组装收敛 + 字段面保留） | §2.2 scan 形状契约条 |
| 17 | M1 规格引用修形为 D2 可解析指针 | §2.1 引 ENGINEERING-MODE-MECHANISM.md §1.15 |
| 18 | M2 v1 `docs/TODO.md` 存量未决条目一次性导入（数据迁移） | §2.5 处置条：机读未决 → INSERT `ledger.db` |
| 19 | M2 `EMPTY_FAMILY_LINE` 文案收正 + 增量口径统一（净增 ≤+N） | 受影响文件表全改净增 ≤ 口径 |

**受影响文件**：
- `docs/core/design/modules/ENGINEERING-MODE-V2-MODULE-MANIFEST.md`（16 处）
- `docs/core/design/modules/ENGINEERING-MODE-V2-MODULE-LEDGER.md`（17 处）
- `docs/core/design/ENGINEERING-MODE-V2.md`（4 处：E1 DDL NOT NULL / 状态机注记 / KD7 已实核 / 变更记录）

**验收标准**：逐发现号回指（号 → 改动 file:line，见设计者交付报告）；三档变更记录齐；回读核对通过（D6）。

## §3 设计评审记录（评审子代理）

_（待写）_

### 轮次 1（评审子代理）

## 评审范围与方法

评审对象 = M1/M2 模块设计（`ENGINEERING-MODE-V2-MODULE-MANIFEST.md` + `ENGINEERING-MODE-V2-MODULE-LEDGER.md`），对照架构 §2.2、M1/M2 Function Spec、批次档 §1/§2/§4。全部受影响文件行数与编辑点锚标已逐一实盘抽核（ledger.mjs 228 ✓ · core ledger-surface 77 ✓ · tools/index.mjs 74 ✓ · family-tools 160 ✓ · CLI/VSC surface 70/119 ✓ · make-agent 172 ✓ · setup.mjs 449 ✓ · check-ledger*.mjs 260/152 ✓ · 测试四档 335/236/266/151 ✓ · 零改三档 483/404/423 ✓ —— 全部与设计标注一致）。

## 发现表

| # | 类别 | 级别 | 问题 | 建议 |
|---|---|---|---|---|
| 1 | Clarity/可行性 | 🔴 | M1 契约自相矛盾：`validateManifest(obj)` 定为「纯校验（不落盘，不读 fs）」（MODULE-MANIFEST.md:69），但 AC-4（:111）与 T6（:123）均判 `validateManifest` 对「指向不存在批次档」返回 `ok:false`——指针可解析（规格 ②.6「指向存在的批次档」）必须读 fs，无 fs 的纯函数不可实现该判据。机制级描述矛盾，实现/测试无法同时满足两处。 | 二选一并同步全文：① 指针校验落 `readManifest(cwd)`（有 cwd），`validateManifest` 只做形状校验，AC-4/T6 判据对象改 `readManifest`；② 给 `validateManifest` 增可选 cwd/resolver 参数并删「不读 fs」括注。同步 §2.1.1、§2.2、AC-4、T6。 |
| 2 | Clarity/边界 | 🟡 | M2 DDL `status`/`kind` CHECK 未加 NOT NULL（MODULE-LEDGER.md:65-66）——SQLite 中 CHECK 表达式对 NULL 求值为 NULL（不拒），NULL 行可 INSERT，绕开六态锁与 task_book 咬合，且 `ledgerCount` 的 `WHERE status IN (四态)` 静默漏计。AC-M2-2 只测非法非空值，测不到此洞。 | DDL 改 `status TEXT NOT NULL CHECK(...)`、`kind TEXT NOT NULL CHECK(...)`；补边界用例（INSERT status=NULL → 拒）。架构 §2.3 E1 schema（ENGINEERING-MODE-V2.md:153-154）同款问题，同步建议。 |
| 3 | Clarity | 🟡 | M1 流图与钩子调用 `requireManifest(cwd)`（MODULE-MANIFEST.md:58-60、75-76），但接口清单（:63-71）只定义 readManifest/validateManifest/initManifest/writeManifest——符号未定义，实现者须猜。 | 统一符号（如 readManifest），或在接口清单补 `requireManifest` 契约（= readManifest + 缺失标记初始化）。 |
| 4 | Doc-state | 🟡 | M1 §2.5「五键计数漂移」注记已过期（:100）：架构盘面已收正为六键（ENGINEERING-MODE-V2.md:64），批次 §4 裁定 3「已修」（2026-09-17-engine-mode-v2-specs.md:125）。注记描述的状态与盘面不符。 | 删除该注记或改为已收正记录。 |
| 5 | Doc-state | 🟡 | M2 §2.5 check-ledger 时序仍写「待主 agent 裁」（MODULE-LEDGER.md:134），批次 §4 裁定 1 已裁「M2 + M8 同批实施」（:124）。 | 回写裁定结论（M2+M8 同批落地，无悬空窗口，不留 shim），删「待裁」。 |
| 6 | Doc-state/完整性 | 🟡 | M2 §2.5 测试归属仍写「待主 agent 裁」（MODULE-LEDGER.md:136-137），批次 §4 裁定 5 已裁「最小测试重写随 M2 实施批落地」（:127）。按该裁定 M2 实施批将改 `thincoder-cli/test/ledger-surface.test.mjs`（335）与 `thincoder-vscode/test/ledger.test.mjs`（236），但 §2.3 受影响文件表不含任何测试档——行数+增量标注缺失。 | 回写裁定；两测试档以「最小重写（M2 批内）」列入受影响文件表并标行数与预计增量。 |
| 7 | Doc-state | 🟡 | M2 §2.5 接线表缺口注记已过期（:138）：架构盘面已回补命令注册文件（ENGINEERING-MODE-V2.md:88），批次 §4 裁定 6「父侧已补」（:128）。 | 删除该观察项或改为已回补记录。 |
| 8 | Clarity | 🟡 | M2 六态状态机迁移合法性未收敛：`ledgerUpdate({cwd,id,patch})` 未限定允许迁移集，可直接「待讨论→已核销」绕过状态机（②.2）；DDL CHECK 只锁枚举成员。设计未声明迁移序是机判还是行为面。 | §2.1 补允许迁移表（在写命令内机械收敛）或显式声明迁移序为行为面约束及理由；对应调整 AC/用例。 |
| 9 | 完整性 | 🟡 | 族发现标记从 docs/TODO.md 改 ledger.db 是未登记的行为变更：实测 `LEDGER_REL = join("docs","TODO.md")`（thincoder-core/ledger.mjs:29）是 findProject/ledgerChildren 的发现标记（:67、:91）。改后只有 ledger.db 而无 TODO.md 的兄弟项目从族聚合消失、ledger.db 惰性创建前项目不可发现。设计称「聚合不变」仅指机制，未登记发现集变化。 | §2.5 补登记该行为变更（或说明无影响——如全部目标项目随 M2 实施批即生成 ledger.db）。 |
| 10 | 完整性 | 🟡 | 「ledger.db 不进 git」（规格 ②.7）无落点机制：实测 thincoder/.gitignore（1-23 行）无 ledger.db 条目，设计受影响文件清单亦无 .gitignore 行。 | 受影响文件表补 `.gitignore` 一行（`ledger.db`）或指定其他不进 git 的落点机制。 |
| 11 | Clarity | 🟡 | M1 docRoot 子键缺键 fallback 粒度未定义：AC-M1-3/T3 只覆盖整个 `docRoot` 键缺失；docRoot 存在但缺五子键之一时（补子键 vs 判 schema 错）未定义，而 MANIFEST_SCHEMA 含「docRoot 五键」存在性判据。 | 明确子键缺 = 与整键缺同语义补默认值（还是拒），补一条边界用例。 |
| 12 | Note | 🔵 | M1 `initManifest(cwd)` 无条件落盘、不经 `writer` 闸（与 §2.1.3「写门 = writeManifest 的 writer 闸」并存）；当前仅壳面装配点调用，实务无洞，但 AC-M1-5 对 initManifest 无机械背书。 | 说明 initManifest 主 agent 归属靠「仅主 agent 装配点调用」背书，或给 initManifest 也挂 writer 参数。 |
| 13 | Note | 🔵 | VSC 钩子 `hydrateRun` 是 per-run 水合（实测 setup.mjs:96、368、401 锚标全对），且子代理经 setupAgentRun → hydrateRun（depth>0）；「缺档拒进」分支对子代理水合路径的语义（子代理不能初始化——写门拒）未讨论。 | 钩子注明仅 depth===0 执行缺档初始化分支，depth>0 走「拒」即可。 |
| 14 | Note | 🔵 | M2 DDL `trigger` 作裸列名（MODULE-LEDGER.md:72）——TRIGGER 是 SQLite 关键字；AC-6「KD7 已核：通过」未明示实核的建表 DDL 含该裸列。unverified。 | KD7 实核记录点明「含 trigger 裸列的建表 DDL 通过」；若语法拒，列名改 `trigger_kind` 或引号包裹。 |
| 15 | Note | 🔵 | 展示面依赖面比设计枚举更宽：实测 CLI surface（tui/ledger-surface.mjs:9-45）与核 surface（ledger-surface.mjs:15-51）还消费 detailScans/formatDetailLine/formatMarker/planChangeLines/notifyKey——scan 对象形状（pool/tech/aged/agedKeys/agedTitles/thresholdReached/actionable/root/name/ledger）SQLite 化后须保留或同步改面；设计只提「族发现+通知去重+格式化+re-export」，未钉形状契约。 | §2.2 补一行形状契约：ledgerQuery/ledgerCount 输出如何组装成既有 scan 形状（或列出格式 helper 入参形状变更清单）。 |
| 16 | Note | 🔵 | setup.mjs 449 + ~12 ≈ 461，贴近 500 硬限；项目惯例（架构 §2.2）把 430–490 行档标「拆分候选」，本设计未注记。 | 受影响文件表 setup.mjs 行加「拆分候选」注记（与 dispatch/spawn/scheduler 同口径）或说明不动理由。 |
| 17 | Note | 🔵 | M1 `writeManifest` 落盘前是否跑 validateManifest 未定义（可写入非法 manifest）；KD-M1-4 引「单一权威源 D2」符号在评审范围内不可查证（unverified）。 | 明确 writeManifest = validate → write（拒非法）或声明不校验理由；D2 引用改可解析档章号。 |
| 18 | Note | 🔵 | v1 `docs/TODO.md` 存量未决条目去向未定义：openLedger 幂等建表从空表开始，规格 ③ 只排除 TODO-archive.md 搬迁，TODO.md 存量迁移未提。 | 明确存量条目导入/丢弃/随 v1 归档弃置，裁定后登记 §2.5。 |
| 19 | Note | 🔵 | ledger.mjs:27 `EMPTY_FAMILY_LINE` 文案含「docs/TODO.md」需随迁移收正（设计未列）；ledger.mjs 增量标注「-60 ~ +90」是区间式非「≤±N」规范，且 228+90=318 与拆分计划正文「~310」微差。 | 受影响文件表编辑点补 EMPTY_FAMILY_LINE 文案收正；增量标注改「净增 ≤+90 / 减 ≤60，落地约 310」统一口径。 |

## 计数与结论

- 🔴 Critical：1（#1 M1 validateManifest 指针校验 vs 纯函数无 fs 机制级矛盾）
- 🟡 Advisory：10（#2–#11）
- 🔵 Note：9（#12–#19）
- 实盘抽核：受影响文件行数与函数级锚标全部与盘面一致，无虚标。

VERDICT: changes-required —— 1 项 🔴 阻断：M1 设计 §2.2 接口契约（validateManifest 不读 fs）与 §3.1 AC-4 / §3.2 T6（validateManifest 判悬空指针）互斥，按机制级描述矛盾规则须先收正再实施。

### 轮次 2（评审子代理）

| # | Orig# | File | Severity | Status | Notes |
|---|---|---|---|---|---|
| 1 | 1 | MODULE-MANIFEST.md | — | Fixed | 原契约互斥已消：:69 改 `validateManifest(obj, { cwd } = {})`（形状恒做、传 cwd 加指针校验、读 fs 显式开启），:114 AC-4 与 :127 T6 均判 `validateManifest(obj, { cwd })`，:50 §2.1.1「传 `cwd` 时」——机制自洽。但落点选方案②，与派单方案①冲突 → 见新 #2。 |
| 2 | (new) | MODULE-MANIFEST.md / 批次档 | 🔴 | New | 派单与落盘互斥：批次档 :122 派「方案①——`validateManifest(obj)` 单参 + `readManifest(cwd)` 验指针」；设计落地方案②（:69 双参可选 cwd 内验指针；:98 KD-M1-5「指针校验落 `validateManifest` 的可选 `cwd` 参数（非…`readManifest` 内联）」）。同机制（指针校验落点）在两档描述不一致，验收逐字核对不通过；亦与轮 2 触发语「已按方案①修复」矛盾。二选一收正（回退①或父侧改验收为②）。 |
| 3 | 2 | MODULE-LEDGER.md | — | Fixed | :74-75 `kind TEXT NOT NULL CHECK(...)` / `status TEXT NOT NULL CHECK(...)`；:161 AC-2 补 NULL 兜底；:180 T9；架构 E1 :155-156 + :166 同步。 |
| 4 | 3 | MODULE-MANIFEST.md | — | Fixed | :70 `requireManifest(cwd)` → 装配钩子入口 = `readManifest(cwd)` 契约补齐。 |
| 5 | 4 | MODULE-MANIFEST.md | — | Fixed | :103 改「✅ 已收正——架构 §2.2 M1 行已改七键…本模块按七键落笔一致」。 |
| 6 | 5 | MODULE-LEDGER.md | — | Fixed | :147「✅ 已裁（批次档 §4 裁定 1）：M2 与 M8 同批实施…无悬空窗口」。 |
| 7 | 6 | MODULE-LEDGER.md | — | Fixed | :149「✅ 已裁（§4 裁定 5）…」；受影响文件表 :122-123 补两测试档（335/236 行 + 减/增标注）。 |
| 8 | 7 | MODULE-LEDGER.md | — | Fixed | :150「✅ 已回补——架构 §2.3 E1 接线表（`:88`）M2 行已补…」。 |
| 9 | 8 | MODULE-LEDGER.md | — | Fixed | :53 补允许迁移表（ledgerUpdate 迁移前判）；:166 AC-7；:181 T10。残留源态边洞见新 #22。 |
| 10 | 9 | MODULE-LEDGER.md | — | Fixed | :97「发现集随标记变更（行为变更，见 §2.5）」+ :151 行为变更登记与消解。 |
| 11 | 10 | MODULE-LEDGER.md | — | Fixed | :124 受影响文件表补 `.gitignore`（22 行 · 净增 ≤+1 · 补 `ledger.db` 行）。 |
| 12 | 11 | MODULE-MANIFEST.md | — | Fixed | :71「`docRoot` / `checkConfig` 子键缺 → 与整键缺同语义…不拒」+ :23 F4 + :124 T3b + :113 AC-3。 |
| 13 | 12 | MODULE-MANIFEST.md | — | Fixed | :72 `initManifest(cwd, { writer = 'subagent' } = {})` → 经写门缺省拒；:115 AC-5 同一闸。 |
| 14 | 13 | MODULE-MANIFEST.md | — | Fixed | :78「初始化分支仅 `depth === 0` 执行…`depth > 0`…仅拒、不初始化」。 |
| 15 | 14 | MODULE-LEDGER.md | — | Fixed | :165 AC-6「建表（含 `trigger` 裸列——本批设计轮 2026-09-17 实测通过，node:sqlite · Node 24.18）」；架构 :339 KD7 已实核记录。 |
| 16 | 15 | MODULE-LEDGER.md | — | Fixed | :101 scan 形状契约（字段面保留 + `buildScan` 组装收敛 + 格式 helper 签名不变）。 |
| 17 | 16 | MODULE-MANIFEST.md | — | Fixed | :86 setup.mjs 行加「拆分候选——449+12≈461 近 500 硬限…」。 |
| 18 | 17 | MODULE-MANIFEST.md | — | Fixed | :73「落盘前先 `validateManifest(manifest, { cwd })`（`ok:false` → 拒落盘）」；:97 D2 改 `docs/core/requirements/ENGINEERING-MODE-MECHANISM.md` §1.15。 |
| 19 | 18 | MODULE-LEDGER.md | — | Fixed | :152 v1 存量「处置 = 一次性导入」（机读未决 → INSERT，字段照搬、status 原样映射）。 |
| 20 | 19 | MODULE-LEDGER.md | — | Fixed | :116「`EMPTY_FAMILY_LINE` 文案收正」+ 增量口径全表「减 ≤60 / 净增 ≤+90」等。 |
| 21 | (new) | MODULE-MANIFEST.md | 🟡 | New | T2 与缺省拒闸矛盾：:122「manifest 缺失 + `initManifest(cwd)` \| 写默认七键档，返回默认 manifest」vs :72「…缺省拒（fail-closed）」——不带 writer 应拒。连带 :59 流图与 :77 CLI 钩子未标 writer（VSC :78 已标 `{ writer: 'main' }`）。建议 T2 补 `{ writer: 'main' }`、CLI 钩子补 writer。 |
| 22 | (new) | MODULE-LEDGER.md | 🟡 | New | ledgerClose 不判源态边：:53「`ledgerClose` 目标 ∈ {已核销, 已废弃}」+ :166 AC-7 只测目标集——待讨论行可经 ledgerClose 直达已核销，绕过允许迁移表（勾销语义应仅 待核销→已核销）。建议补源态边判或声明勾销仅限待核销。 |
| 23 | (new) | 批次档 | 🔵 | New | :97 观察项 3「…六键不符。本批按六键落笔」已过期——现架构 :64 与规格 ②.1 :13 均七键（promptsLanding 并入）；§4 裁定 3 为历史快照。 |
| 24 | (new) | MODULE-MANIFEST.md | 🔵 | New | :66 `MANIFEST_SCHEMA` 括注未列 `activeBatch` / `promptsLanding` 判据，架构 E1 :148 要求校验器含「promptsLanding 存在、activeBatch 指针可解析」判据。 |
| 25 | (new) | SPEC-LEDGER.md | 🔵 | New | ②.1 字段表 `kind`/`status` 行（:16-17）未标 NOT NULL，设计 DDL 与架构 E1 已收紧为 NOT NULL——需求/设计层细粒度漂移。 |
| 26 | (new) | MODULE-MANIFEST.md | 🔵 | New | readManifest 管线顺序未钉：:68「读 + `validateManifest(obj, { cwd })` + 补默认值」与批次档 :129 验收「补默认值后校验再通过」的补后重校验步骤未显式化。 |

计数：🔴 1（新）· 🟡 2（新）· 🔵 4（新）；上一轮 20 项（1 🔴 + 10 🟡 + 9 🔵）全部落地——原 🔴 契约互斥已消，但落点选方案②与派单方案①互斥（机制级跨档矛盾）。

VERDICT: changes-required

### 轮次 3（评审子代理）

轮 3 收敛验证（严格只验证轮 2 的表）：

| # | Orig# | File | Severity | Status | Notes |
|---|---|---|---|---|---|
| 1 | 2 | MODULE-MANIFEST.md / 批次档 | 🔴 | Fixed | 批次档 :122 已改「✅ 父侧裁定 2026-09-17：**接受方案②**…\| `validateManifest(obj, { cwd } = {})` 双参（第二参可选）+ 传 cwd 时指针可解析」；设计 :69 与 KD-M1-5 :98 本就方案②——两档机制描述一致，派单/落盘互斥消解。 |
| 2 | 21 | MODULE-MANIFEST.md | 🟡 | Fixed | T2 :122 已改「manifest 缺失 + `initManifest(cwd, { writer: 'main' })`」；流图 :59「`initManifest(cwd, { writer: 'main' })` 写默认档」；CLI 钩子 :77「壳面走 `initManifest(cwd, { writer: 'main' })`」——三处与 :72 接口缺省拒闸一致。 |
| 3 | 22 | MODULE-LEDGER.md | 🟡 | Fixed | :53 补「`ledgerClose` 源态 ∈ {待核销}（勾销）/ 任意（撤回→已废弃）、目标 ∈ {已核销, 已废弃}——源态边同判」；AC-7 :166 补「`ledgerClose` 源态 = 待讨论 → 拒（勾销仅限待核销）」——勾销源态洞已堵，与允许迁移表边一致。 |
| 4 | 23 | 批次档 | 🔵 | Fixed | :97 已改「✅ 已收正（架构 :64 已改七键，含 `version` + `promptsLanding`）——本观察项过期，仅留档」。 |
| 5 | 24 | MODULE-MANIFEST.md | 🔵 | Fixed | :66 已改「`MANIFEST_SCHEMA`（…`promptsLanding` 存在、`activeBatch` 指针可解析（传 `cwd` 时）、`version` 数值）」——与架构 E1 :148 枚举一致。 |
| 6 | 25 | SPEC-LEDGER.md | 🔵 | Fixed | :16-17 已改 `kind TEXT NOT NULL CHECK(...)` / `status TEXT NOT NULL CHECK(...)`——规格/设计/架构三档 DDL 口径一致。 |
| 7 | 26 | MODULE-MANIFEST.md | 🔵 | Fixed | :68 已改「读 + `validateManifest(obj, { cwd })`；缺键 → 产 `missingKeys`（非拒）→ 补默认值 → 再校验通过」——管线顺序显式化，与批次 :129 验收「补默认值后校验再通过」一致。 |

轮 1 的 20 项（1 🔴 + 10 🟡 + 9 🔵）本轮顺带抽核仍为 Fixed（修复行未被父侧收正改动）。

计数：剩余 🔴 0 · 🟡 0 · 🔵 0——轮 2 的 7 项全部落地，无新增。

VERDICT: pass

## §4 核验与裁决（主 agent）

**#51 交回裁定（2026-09-17）**：M1+M2 模块设计 Done；**KD7 实核通过**（`node:sqlite` v24.18/19 双版本可用，无需 flag——AC-M2-6 过）。

| # | 观察 | 裁定 |
|---|---|---|
| 1 | M2 ↔ M8 落地时序（`check-ledger` import 悬空） | **M2 + M8 同批实施**（台账迁移 + `check-ledger` 作废同批落地，无悬空窗口） |
| 3 | 架构 M1 括注五键计数漂移 | ✅ 已修（六键） |
| 4 | 行龄源迁移（git blame → SQLite 时间戳） | 接受——行为变更已显式登记，老化阈值不变（30 天） |
| 5 | M2 → M10 事实依赖（M2 破 M10 测试） | **被破测试的最小重写随 M2 实施批落地**；M10 spec 依赖已补 M2 |
| 6 | 架构接线表 M2 行漏列命令注册文件 | 父侧已补（`tools/index.mjs` + `family-tools.mjs`） |

## §5 实施记录（eng-coder）

_（待写）_

**交付摘要（M1 manifest 实现批）**：M1 项目状态档 manifest 全量落地——核心模块 `thincoder-core/manifest.mjs`（新，198 行，零依赖）导出 `MANIFEST_REL / MANIFEST_SCHEMA / DEFAULT_MANIFEST / readManifest / validateManifest / initManifest / writeManifest / requireManifest`；CLI `make-agent.mjs` `assembleAgent` 钩子（cwd 后、createAgent 前）+ VSC `setup.mjs` `hydrateRun` 钩子（`agent.cwd` 后、injectRunContext 前，初始化仅 `depth===0`）两端接线；单测 `thincoder-core/test/manifest.test.mjs`（16 用例覆盖 AC-M1-1..5 + T1..T7）+ VSC 两测试档副产物守卫（`manifestPreexisted` 记账、`afterEach` 只清本用例新建者）。

**关键决策（实现期）**：
1. 空串指针加固（评审发现 #5 采纳）：`validateManifest` 指针判据由「字符串 + 存在」收紧为「非空字符串 + 存在」——`join(cwd,"")` 解析到 cwd 目录本身、`existsSync` 恒真，原判据放过空串指针。已改 `manifest.mjs:100-107` + 用例 AC-M1-4c。
2. 非对象嵌套键测试补齐（评审发现 #6 采纳）：`docRoot: "not-an-object"` → 与整键缺同语义（missingKeys 记 `docRoot`、整键补默认）——用例 AC-M1-3d。
3. 文件大小三告警（#1/#2/#3）不处置：`setup.mjs` 464 行拆分裁决已由设计档 :86 预立（增量再涨需拆，本轮未触发）；两测试档为既有套件档，拆分属既有债务——归父侧裁，非本批范围。
4. 设计档行数漂移（#4）与 spec ②.3 交互面落实方式（#9）为文档层事项——设计档写权归 eng-designer，交父侧派修正轮，本批不动设计档。

**审计与代码评审轮次**：
- explore 分歧审计 1 轮：VERDICT clean——五锚逐条对码核验（七键 schema / fail-closed 两分 / 写门 writer==='main' / 子代理不传播 / VSC depth 门），四类偏差（PARTIAL/SILENT-SIMPLIFICATION/DOC-DRIFT/OUT-OF-LIST）零发现。
- advisor 代码评审 1 轮：VERDICT pass——9 条（🟡×3 可选文件大小、🔵×6），无 🔴；#5/#6 已修，其余裁决见下。

**决策透明表**（评审发现号 → 裁决）：

| # | 裁决 | 落地 |
|---|---|---|
| 1 setup.mjs 464 行 >300 | Deferred | 设计档 :86 预立拆分裁决（增量再涨需拆），本轮未触发——父侧备案 |
| 2 lifecycle-singleton 测试档 487 行 | Deferred | 既有套件档拆分债务，非本批缺陷——父侧裁 |
| 3 setup-reminders 测试档 303 行 | Deferred | 同 #2（M1 +3 行跨过 300 建议线，<500 硬限） |
| 4 设计档行数漂移（+~12 vs +18/+15） | Deferred | 文档层——eng-designer 写权，随下次修订收正 |
| 5 activeBatch 空串过指针校验 | Fixed | `manifest.mjs:100-107` 非空判 + AC-M1-4c 用例（16/16 绿） |
| 6 docRoot 非对象分支无直达测试 | Fixed | AC-M1-3d 用例（16/16 绿） |
| 7 VSC invalid 分支无 VSC 级测试 | Not an issue | 设计 §3 测试层只要求 core 级；core 已覆盖 invalid 路径，VSC 为透传 |
| 8 slow 用例真仓根 manifest 写/删竞态 | Not an issue | grep 确认无并发写者，守卫当前有效；若未来增并发写者再改 tmp 夹具 |
| 9 spec ②.3「定阶段+盘家底」vs 静默默认初始化 | Not an issue | 设计 §2.1 #4 裁定壳面职责（R7b 设计>规格），与设计一致 |

**验证**：core 单测 16/16 pass；VSC `setup-reminders` 13/13 + `agent-lifecycle-singleton` 13/13（slow 层按闸跳过）；VSC fast 521 pass + full 570 pass/1 pre-existing fail（T-DC6 ② 文档锚漂移，零代码面）；CLI full 637 pass/2 pre-existing fail（T67/T96 TODO 台账锁）；副产物守卫持稳（真仓根 `PROJECT-MANIFEST.json` 跑后缺席）。

**修正轮**：1 轮（评审 #5/#6 采纳修复——`manifest.mjs` 指针非空判 + 测试两用例；回跑 core 16/16、VSC 两档 13/13+13/13 全绿）。

**终态：clean**（审计 clean + 评审 pass + 修正轮 1 轮已收敛）。

## 交付摘要（eng-coder · M2 台账 SQLite 实施批）

**交付面**：设计档 `docs/core/design/modules/ENGINEERING-MODE-V2-MODULE-LEDGER.md` §2.3 受影响文件全清单 + §3 验收标准（AC-1..7 / T1–T10）。

**落地文件**（全部语法检查 ✓）：

- `thincoder-core/ledger-db.mjs`（新建，~170 行）：连接 + `ensureSchema` DDL（单表 items · 三 CHECK 枚举 · task_book 咬合 CHECK）+ `ALLOWED_MIGRATIONS` + `PENDING_STATUSES` + `nowIso` + `openLedger`（幂等）。静态 import `node:sqlite`（消费侧动态 import——KD-M2-3/W8 契约②）。
- `thincoder-core/ledger-cmd.mjs`（新建，~180 行）：`ledgerQueryTool`/`ledgerCountTool`（读面，全角色）+ `ledgerAddTool`/`ledgerUpdateTool`/`ledgerCloseTool`（写面，主 agent）。
- `thincoder-core/ledger.mjs`（重写，~150 行）：删 md 读面（`scanGroups`/`summarizeLedger`/`blameAges`）；族发现标记 `docs/TODO.md` → `ledger.db`；`buildScan` SQLite 组装；通知去重保留；re-export。
- `thincoder-core/ledger-surface.mjs`（+8）：`runLedgerScan` 数据源 → `ledgerQuery`/`ledgerCount`；启动行/变化行/送达门/状态位机制保留。
- `thincoder-core/tools/index.mjs`（+9）：`assembleBuiltinTools` 注册 `ledger_query`/`ledger_count`（动态 import，全角色面）。
- `thincoder-core/agent/family-tools.mjs`（+6）：`depthOnly` 分支注册写命令族（动态 import 且**仅 depth===0 载入**）。
- `thincoder-cli/src/tui/ledger-surface.mjs` / `thincoder-vscode/src/extension/ledger-surface.mjs`：端胶水数据源迁移（渲染缝值不变）。
- `thincoder-cli/test/ledger-surface.test.mjs`（307 行）/ `thincoder-vscode/test/ledger.test.mjs`（~244 行）：md 夹具 → SQLite 夹具（`ledgerAdd` + 时间戳回拨）；scan 形状断言保留。
- `.gitignore`：补 `ledger.db` / `ledger.db-*`。

**运行时验收**（AC-M2-1..6 全绿）：DDL/enum CHECK 机锁、非法枚举拒、未决四态 COUNT 单源、写命令仅 depth===0（结构性核验）、软删除保留、`node:sqlite` 无 flag 可用。

## 决策透明表（评审发现 → 处置）

| 发现号（轮 1） | 严重度 | 处置 | 落地证据 |
|---|---|---|---|
| #4 ledgerQueryTool status 缺 enum | 🔵 | Fixed | `ledger-cmd.mjs:90` 补六态 enum（与 DDL CHECK 逐字同集，运行时核对 ✓） |
| #5 family-tools 无条件下游载入 ledger 链 | 🔵 | Fixed | `family-tools.mjs:30` 改 `depth === 0 ? await import(...) : {}`——子代理路径零载入 |
| #6 VSC T107 无台账锚易并行假红 | 🔵 | Fixed | `ledger.test.mjs:135` 改盘根幽灵路径（同 CLI T109③ 夹具） |
| #7 两测试档头注假指针（§3.2 T97–T110 / §3.1 AC80–AC90 不存在） | 🔵 | Fixed | 两头注改引 `§3 测试层（AC-1..7 / T1–T10）` + 注明 T9x/AC8x = v1 遗留编号保号 |
| #1 check-ledger 悬空链（M8 域） | 🟡 must-fix | Dispatched（父侧协调） | **不在 M2 写域**（设计 §2.5 裁定 1：归 M8 删除）。两套件现红均源于此悬空——收口前必须落地 M8 删除或拆悬空注册 |
| #2 ledgerUpdate 待核销→已核销 不写 closed_at | 🟡 optional | Deferred（设计层裁定） | 实现按设计文本原样（§2.1 #5 将 closed_at 绑定 ledgerClose）；「ledgerUpdate 也写」或「收窄迁移表」二选一需 eng-designer 定——**建议选项 (a)（归档态入边即写 closed_at），与 KD-M2-4「归档=软删除（写 closed_at）」语义一致** |
| #3 CLI 测试档 307 行建议拆分 | 🟡 advisory | Deferred（可选重构） | 在设计预算内（减 ≤80 / 净增 ≤+60 → 上限 395）；拆分无功能收益，建议不拆 |

**新增父侧协调项（本轮发现）**：`normAbs` 断链——`thincoder-core/agent-tools/advisor.mjs:14`（M，非本批文件）import `write-gate.mjs` 缺失的 `normAbs` re-export（write-gate 批在途 WIP：`write-gate.mjs:28` 仅 import 未 re-export）→ core family-tools/tool-registry 6 用例失败。**非 M2 文件、非本批改动**，归 write-gate 批或父侧处置。

## 审计与代码评审轮次与终态

- **内部 divergence 审计**（explore 子代理，1 轮）：六锚（DDL / API / 接线 / 迁移表 / 软删除 / 动态 import）静态核验全过；design-vs-code 一致。
- **内部 advisor 代码评审 轮 1**：VERDICT changes-required（0 🔴；1 🟡 must-fix = #1 协调项；3 🟡 optional/advisory；3 🔵）——7 发现。
- **fix round 1**：落 #4/#5/#6/#7 四件（M2 写域内）；#1 转父侧协调（M8 域）；#2 转设计层裁定；#3 建议不拆。
- **内部 advisor 代码评审 轮 2**（核验 #4–#7）：VERDICT **pass**——四件全 FixeD，host-verified 5/5 引用逐字命中，无新引入问题。
- **终态**：M2 范围内 **clean**（零 M2 可归因失败）；批次级收口受两外部项阻塞（#1 M8 悬空 + normAbs 断链），均非本批文件。

## 验证

- CLI `node --test test/ledger-surface.test.mjs`：**12/12 ✓**；VSC `node --test test/ledger.test.mjs`：**10/10 ✓**；`ledger-cmd` enum 运行时核对 = DDL 六态逐字一致 ✓；全部改动档 `node --check` ✓。
- core `family-tools`/`tool-registry` 6 失败 = 全为外部 normAbs 断链（见上），非 M2 可归因。

## §6 验证与收口（父代理）

_（待写）_
