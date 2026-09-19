# 台账机制（LEDGER）· 设计

> 板块：工程模式 / 台账——**待办总账单一权威源（SQLite）** + **台账提醒与可见面（FR24 载体面）**。
> **v2 就地更新**（2026-09-17 退役批）：存储 **md 台账 → SQLite 单表**（M2 模块设计语义并入本档；原旁路档 `_archive/modules/ENGINEERING-MODE-V2-MODULE-LEDGER.md` 已归档 `_archive/modules/`——§6.3 就地更新纪律）。
> 需求层指针 = `requirements/ENGINEERING-MODE-V2.md` §3（M2 台账 SQLite）· §9（继承机制：台账提醒与可见面 = 原 MECHANISM §1.18）。
> 兄弟档：`design/LEDGER-SELF-CONTAINED.md`（L4「本仓可解析」判据）· `design/DOC-DISCIPLINE.md`（机检引擎）· `design/BATCH-RECORD.md`（核销同步清单槽位枚举 = `design/DOC-DISCIPLINE.md` D7 行）。
> 落点：用户数据目录键控库 `~/.thincoder/ledger/<sha1(项目根)>[:16].db`（SQLite，工作树外——天然不进 git；2026-09-17 用户裁定：不在项目目录）· `thincoder-core/ledger.mjs`（查询/写命令单源）· `ledger-surface.mjs` ×3（显示面，数据源迁移）。

## 1. 机制目标与范围

需求池的诉求：**一眼看出“哪条需求落地了没有”**，无需遍历文档；条目与任务书**指针咬合**——点开即见任务书 §2 与验收结论。

**v2 换存储的三处结构缺陷（v1 md 台账）**：计数漂移（md 计数与实体条目手工同步）· 无事务（勾销 = 编辑文本，中断留脏态）· 无枚举约束（status/kind 散文字符串，非法值无机械拦截）。**SQLite 单表**一次性解决：六态 CHECK 机械锁死、`COUNT` 单源计数、事务保证收口原子。

**范围**：schema / 状态机 / 命令面（查询全角色 + 写仅主 agent）/ 归档软删除 / 计数单源 / 展示面（CLI TUI + VSC 状态栏与 chat 流，数据源迁移）+ 收口行。

## 2. 存储与 schema（v2——SQLite 单表）

**表 schema（`ledger.mjs` `ensureSchema` 建表 DDL）**：

```sql
CREATE TABLE IF NOT EXISTS items (
  id         INTEGER PRIMARY KEY,
  kind       TEXT NOT NULL CHECK(kind IN ('requirement','tech_todo')),
  status     TEXT NOT NULL CHECK(status IN ('待讨论','待设计','在途','待核销','已核销','已废弃')),
  title      TEXT NOT NULL,
  board      TEXT,
  req_doc    TEXT,
  task_book  TEXT,
  evidence   TEXT,
  trigger    TEXT CHECK(trigger IN ('归批','条件','认账不排期') OR trigger IS NULL),
  created_at TEXT,
  updated_at TEXT,
  closed_at  TEXT,
  CHECK (status NOT IN ('在途','待核销') OR (task_book IS NOT NULL AND task_book <> ''))
)
```

- **三 CHECK 枚举**（`kind` / `status` / `trigger`）= 机械锁死——非法值 INSERT 由 SQLite 引擎拒（AC-M2-1/2），不靠应用层校验；`status` NOT NULL 兜底（CHECK 不拦 NULL）。
- **咬合 CHECK**：`在途 / 待核销` 必带 `task_book`（任务书指针——与 M3 批次档互指）——DDL 只承载**非空**半幅；**「指向档存在」半幅 = 写门**（§6.1）。
- **时间戳三列**：`created_at` / `updated_at` / `closed_at`——行龄源（替代 v1 git blame）+ 软删除落点。
- **落点**：用户数据目录键控库 `~/.thincoder/ledger/<sha1(项目根绝对路径)>[:16].db`——项目根仅作关联键，**项目内不留任何文件**（无 .gitignore 负担；2026-09-17 用户裁定收正）；惰性创建（首次写面 `openLedger`；读面库不在 = 空账）。

## 3. 状态机（六态 + 迁移表）

六态：待讨论 → 待设计 → 在途 → 待核销 → 已核销；任意态 → 已废弃。状态迁移**只在写命令内收敛**（`ledgerAdd` 入待讨论 / `ledgerUpdate` 迁移 / `ledgerClose` 勾销→已核销、撤回→已废弃），查询面只读 status。

**允许迁移表**（`ledgerUpdate` 迁移前判；表外 → 拒，行不变）：

| 现态 | 允许目标态 |
|---|---|
| 待讨论 | 待设计 · 已废弃 |
| 待设计 | 在途 · 已废弃 |
| 在途 | 待核销 · 已废弃 |
| 待核销 | 已核销 · 已废弃 |
| 已核销 | 已废弃 |
| 已废弃 | （终态，无出边） |

## 4. 两池分组与计数

- **两池 = kind 枚举**：`requirement`（需求池）/ `tech_todo`（技术待办）——SQLite 行天然分组，替代 v1 md 的「## 组标题识别」。
- **计数单源 = `ledgerCount`**：`SELECT COUNT(*) WHERE status IN ('待讨论','待设计','在途','待核销')`——未决四态 = 「活条目」口径（`--summary` 收口行同口径）。v1 md 计数面（`scanGroups`/`summarizeLedger`）删除（AC-M2-3 grep 零命中）。
- **条目正文一行一条**（语义保留）：SQLite `title` 单行承载，多行细节进需求档 / 批次档（不展开任务细节铁律不变）。

## 5. 归档 / 触发 / 老化

| 面 | 契约（v2） |
|---|---|
| **归档** | **软删除**——`ledgerClose` 只 UPDATE `status`（已核销/已废弃）+ `closed_at`，**不 DELETE 行**（物理行保留作外部记忆）；「已核销/已废弃」= 状态值（替代 v1「勾销后移入归档档」——md 移档语义随存储消亡；`docs/TODO-archive.md` 为历史档不再追加） |
| **触发字段** | `trigger` 三枚举 CHECK：`归批` / `条件` / `认账不排期`（合法选项，区别于遗忘）；`NULL` → 审计面「待处置」（不判红）；取值非三枚举 → INSERT 即拒（CHECK） |
| **老化报告（审计模式）** | 行龄源 = SQLite 时间戳（`created_at`/`updated_at` 距今 > `AGING_DAYS`=30 天）——**弃 git blame**（SQLite 路径无 md 行；时间戳更可靠）。「距上次编辑」语义变「距建档/更新」——两者都度量「挂账多久」，阈值边界略有偏移（行为变更已登记） |
| **归属与落笔** | 写命令仅**主 agent** 装配（`family-tools.mjs` depthOnly 分支——子代理装配面不挂写命令，fail-closed）；台账档不入任何子代理 `files` |

## 6. 机检面（v2 收编）

- **check-ledger 作废**：v1 的 md 机检（L1 指针可解析 / L2 计数 / L3 形态六判据）随存储消亡——台账一致性由 **SQLite CHECK（枚举+咬合）+ `ledgerCount`（计数单源）** 承担；旧脚本 `scripts/check-ledger*.mjs` 归 **M8 机检引擎**删除（架构 §2.2 M8「check-ledger 作废」，同批落地无悬空窗口）。
- **L4（本仓可解析）与形态合规 V4** = `design/LEDGER-SELF-CONTAINED.md`（跨仓登记面——正交保留）。

### 6.1 写门·指针存在性（`task_book` → 批次档；2026-09-18 新增 · 台账 #38）

**判据句**（架构 E1「咬合判据（两账）」后半幅 · `design/ENGINEERING-MODE-V2.md` §2.3）：`task_book` 指向的**批次档必须存在**。

**形态 = 写入时门（非扫描面）**：`thincoder-core/ledger-cmd.mjs` 两条写命令（`ledgerAdd` / `ledgerUpdate`）落盘前判**结果行**——`status ∈ {在途, 待核销}` 且 `task_book` 非空 ⇒ 解析其文件部分，**不可解析 / 非文件 ⇒ throw**（行不变；判位与迁移表拒同层）。

**落点裁定（2026-09-18 · 评审发现 #4）**：门所在模块 = `thincoder-core/ledger-cmd.mjs`——**`ledgerAdd` / `ledgerUpdate` 两函数体内**，与迁移表判**同函数同层**（判序 = 迁移表判 → 本门 → `UPDATE`）。
覆盖的写入口 = 工具 `ledger_add` / `ledger_update`；消费侧一律**动态 import 单源档 `thincoder-core/ledger.mjs`**（KD-M2-3——§7.1 的三写命令导出面 = 该档对 `ledger-cmd.mjs` 的 re-export，无第二实现）⇒ 门**不可绕过**。（`ledgerAdd` 的结果行恒为 `待讨论`——INSERT 硬编码 ⇒ 门在该入口当下恒不触发；两入口形态统一，为将来「add 带状态」留位。）

**口径（三条）**：

1. **文件部分 = 首个 `§` 之前的子串**（trim 后）。`§` 之后 = 节号 / 注记，**不参与存在性判定**（现盘 13 个取值含三形态——无后缀 · `…md§2` · `…md§1.5（括注）`——全按此口径通过）。
2. **解析基准 = `resolveProjectRoot(cwd) ?? resolve(cwd ?? ".")`**（**与台账库关联键逐字同源**——`ledger-db.mjs:31` `ledgerDbPath` 同表达式）：`resolve(base, 文件部分)`；绝对路径按 Node `path.resolve` 语义原样取用。（父侧直改·可 revert · 承写门 fix 轮 O1 收正——原口径写「调用 `cwd`」在容器根形态与库键自相矛盾）
3. **缺文件部分**（`§2` / 全空白）⇒ 不可解析 ⇒ **拒**（fail-closed，同状态行解析先例）。

**射程** = **结果行状态**属 `{在途, 待核销}` 的写入；`待讨论 / 待设计` 行带任意 `task_book` 不判（判据句只管在途 / 待核销——逐字）。

**失败文案**（逐字；前缀 = **调用函数名**——工具 `ledger_update` → 函数 `ledgerUpdate`、`ledger_add` → `ledgerAdd`；与同函数既有两条文案（`ledgerUpdate：行 <id> 不存在` / `…不在允许迁移表`）同前缀）：`ledgerUpdate：task_book 指向的档不存在：<原值>（解析 = <绝对路径>）` · `ledgerUpdate：task_book 不可解析（缺文件部分）：<原值>`。

**选型理由（为何在台账侧、而非机检引擎侧）**：
① 与已落半幅（咬合 CHECK）**同层同生命周期**——同一条判据句的两半劈到两层 = 两套失败面、两处维护；
② 台账库在用户数据目录（工作树外、按项目根 sha1 键控），机检引擎源域 = `docs/**` 的 .md——接库即给引擎新增 DB 依赖面（W8 契约②动态 import）；
③ 既有裁定「台账一致性由 SQLite schema 承接、`check-ledger*` 作废**不并入**机检引擎」——实存处 = 机检引擎头注（`scripts/doc-check.mjs`）+ `design/ENGINEERING-MODE-V2.md` §2.2 M8 行与 M8 落点段 + 原 KD-M8-2（归档 `_archive/modules/ENGINEERING-MODE-V2-MODULE-MACHINE-CHECK.md`）；引擎侧落点 = 反转该裁定。

**边界**：① 不做**事后审计**（条目写入后档改名 / 归档不在射程——本判据是写入时点门）；② 不做**仓界判**（指针是否落在仓内 = L4 判据面 · `design/LEDGER-SELF-CONTAINED.md`——本条目不并）；③ 不改 DDL（存在性无 SQLite 表达面——CHECK 读不到 fs）。

**射程连带效果与出路（2026-09-18 · 评审发现 #8）**：门按**结果行**判 ⇒ 带不存在 / 不可解析指针的 `在途 / 待核销` 行，其上**任何**更新（含与指针无关的字段）都被同一门拒——**出路 = 先修 `task_book` 或把行迁出射程**（已核销 / 已废弃）。实现轮**不得**为此加「按字段放行」的特例豁免（放行 = 门破）。

## 7. 可见面：接口契约（v2 数据源）

### 7.1 单源模块与导出面

- **CLI**：`thincoder-core/ledger.mjs`（SQLite + 纯逻辑，无 TUI 依赖）+ 显示面胶水档。
- **对端**：对端显示面**独立实现、语义同源**（照两轴纪律）+ 各自胶水档。

**导出契约（v2——SQLite 化）**：

| 导出 | 语义 |
|---|---|
| `ledgerDbPath(cwd)` | 项目根 → 键控库路径（sha1(规范化绝对路径) 前 16 位——替代 v1 `LEDGER_DB_REL` 项目内标记） |
| `openLedger(cwd)` | → `DatabaseSync` 句柄 + `ensureSchema`（幂等建表） |
| `ledgerQuery({ cwd, status, kind, board })` | SELECT 行集（只读，全角色） |
| `ledgerCount({ cwd })` | `COUNT(*)` WHERE 未决四态（单源计数） |
| `ledgerAdd({ cwd, row })` | INSERT（写命令，主 agent） |
| `ledgerUpdate({ cwd, id, patch })` | UPDATE（写命令，主 agent——迁移表校验） |
| `ledgerClose({ cwd, id, status })` | UPDATE status + `closed_at`，事务包裹（写命令，主 agent） |
| `findProject(anchor)` | 向上（含自身）最近的**已注册台账**目录（用户目录键控库存在）→ `{root, ledger}` / `null` |
| `discoverFamily(anchor)` | `{current, projects}`——current = `findProject`；projects = current + 其同级含台账目录 |
| `formatMarker(scan)` / `formatDetailLine(scan)` / `planChangeLines(prev, summary)` / `loadNotifyState` / `saveNotifyState` | §7.3 逐字（**签名与键语义不变**——展示面保留，只换数据源） |

### 7.2 口径契约

- **计数 / 老化 / 阈值 / 可动作**：见 `requirements/ENGINEERING-MODE-V2.md` §9（继承：原 MECHANISM §1.18——D2 本节不重述）。
- **明细行集** = `{current} ∪ {可动作项目}`（发现序：current 在前，其余按目录名升序）；同项去重。
- **条目键派生**（去重档 `aged` 集元素）：键 = 条目 `title` **归一化文本**——去首尾空白 + 连续空白折叠为单空格（SQLite 行天然单行，无需去条目前缀）。**位置无关**；**title 变更** = 键变 → 按新条目计；两端同规则（去重档跨端共享）。
- **变化检测（去重）/ 送达门 / 去重档 schema**：与 v1 同口径（`{version:1, ledgers:{…}}`；缺失 / 坏 JSON → 空态；temp + rename）。
- **行龄**：SQLite 时间戳距今（非 git / 无时间戳 → 标「年龄未知」照列、不判老化）。
- **性能**：SQLite `COUNT` / 索引查询替代 v1 的 git blame 全档扫描。

### 7.3 行文本逐字契约（三面同文——CLI / 对端 / 收口行同一 formatter）

| # | 形态 | 逐字模板 | 色 / 态 |
|---|---|---|---|
| L1 状态标记 | 单行 | `台账 <pool>·<tech>`（例 `台账 4·32`） | `aged>0` → 警示色；否则默认 |
| L2 明细行 | 每项目一行 | `台账 <名>：需求池 <pool> · 技术待办 <tech>（老化 <aged>）` +（阈值时）` — 可开批` | 该项目 `actionable` → 警示色；否则 dim |
| L3 变化行·老化 | 每事件一行 | `台账变化：<名> 老化首次越线 <n> 条（超 30 天未处置）：<t1>；<t2>；<t3>`（标题 = 条目首段粗体；**无粗体段 → 回退 = 归一化文本前 20 字**；>3 条时第三项后接 `；…`） | 警示色 |
| L4 变化行·阈值 | 每事件一行 | `台账变化：<名> 需求池达阈值（<pool> 条）— 可开批` | 警示色 |

- `<名>` = 项目根目录 basename；数字 = 十进制整数；`<aged>` **恒显**（含 0——自证已检查）。
- **收口行输出** = L2 行序列（行集 = 族行）；族空时输出 `台账：未发现台账。`（**仅命令面**——运行时面静默）。
- **状态行位置**：状态段簇**尾**（键位组前）——与既有状态段同簇、同右截优先级。

### 7.4 挂载 / 7.5 对端挂载 / 7.6 收口行 / 7.7 关键决策 / 7.8 不变量

- CLI 挂载（状态槽 / 首扫不抢首帧 / 周期 `unref()` / 回合处理期间跳过本轮 / 空标记零注入 / 启动行门 / headless 零改动）· 对端挂载（状态栏 item 无 command / tooltip / webview `ledgerNotice` / 启动行投递门 = webview 就绪）· 收口行（`--summary` 命令面 + 核销同步清单「台账可见面（收口行）」槽位）——**机制与 v1 全同**（数据源迁移发生在展示面内部），逐字契约与决策记录（K1–K7 / U1–U6）沿用本档 v1 文本，不重述。
- **不变量**：① 无台账 → 零输出零标记 ② 台账档只读（唯一写面 = 去重档 + 主 agent 写命令）③ 数字单源 ④ 变化行送达门 ⑤ 不新增工具/命令/快捷键面；headless 零新增输出。

## 8. 验收标准（v2——回指 M2 规格 AC）

| # | 验收标准（可机判） | 回指 |
|---|---|---|
| AC-M2-1 | 表含六态 status CHECK + kind CHECK + trigger CHECK（读 `sqlite_master` / INSERT 非法值拒） | ②.1 |
| AC-M2-2 | 非法 `status` 写入 → 拒（CHECK）；`status=NULL` → 拒（NOT NULL 兜底） | ②.2 |
| AC-M2-3 | 计数 = `COUNT` 单源（grep `scanGroups`/`summarizeLedger` 零命中；`ledgerCount` = 未决四态） | ②.6 |
| AC-M2-4 | 写命令非主 agent 装配 → 拒（depth>0 装配面不挂写命令） | ②.4 |
| AC-M2-5 | `在途/待核销` 缺 `task_book` → 拒（咬合 CHECK） | ②.2 |
| AC-M2-6 | `node:sqlite` Node 24 可用（无需 `--experimental-sqlite`——实测通过） | ②.1 |
| AC-M2-7 | 迁移表外状态迁移 → 拒（`ledgerUpdate` 待讨论→已核销拒；`ledgerClose` 目标/源态校验） | ②.2 |
| AC-M2-8 | `在途 / 待核销` 行的 `task_book` 文件部分**不可解析 / 不存在** → 拒（throw，行不变）；存在 ⇒ 通过（含 `§N` / `§N（括注）` 形态） | §6.1（架构 E1 后半幅 · 台账 #38） |

**用例表（摘）**：T1 入条目 → 新行 id 自增 · T2 状态迁移 → status 更新 + `updated_at` 刷新 · T3 勾销 → status 已核销 + `closed_at` 写入、行保留（软删除）· T4 未决四态计数（混入归档行）· T5 `trigger=NULL` 通过 · T6 非法 status 拒 · T7 在途缺 task_book 拒 · T8 非主 agent 写 → 命令不存在 · T9 status NULL 拒 · T10 迁移表外迁移拒（行不变）。

**用例表（续——写门·指针存在性）**：T11 `task_book` 三形态（无后缀 / `§2` / `§1.5（括注）`）指向在档 → 通过 · T12 指向不在册档 → 拒（文案 + 行不变）· T13 `task_book` 缺文件部分 → 拒 · T14 待讨论行带任意 `task_book` → 不判（射程 = 结果行状态）。

## 9. 边界（本档不做）

- 不做 manifest（M1，只互指咬合）；不做批次档（M3）；不做 checklist（M7 废除，语义由本模块六态承接）。
- 不做 `docs/TODO-archive.md` 项目归档档搬迁；不承载细节展开（条目一行一条）。
- 不新增台账展示面形态（`ledger-surface.mjs` ×3 保留，只迁数据源）；不造 SQLite 计数状态条。
- 不做 `check-ledger` 脚本迁移（归 M8 删除）。
- 不新增工具/命令/快捷键面；不监听文件系统；不做跨进程缓存 / 全工作区深扫 / 网络面。
- 不写实现代码（ledger.mjs = eng-coder 写域）；不写提示词实体。
- **同级枚举上限**（成本有界）：`MAX_SIBLING_SCAN`——目录项数超限 → 该层候选判空集，退化 current-only；current 缺 → 继续向上求候选。

## 10. 不并项与历史沿革

| 面 | 内容 | 何故不并 |
|---|---|---|
| **v1 md 台账机制**（原 §2 条目契约 / §3 状态机 md 面 / §4 md 分组识别 / §6 L1–L3 机检契约） | md 行形态 / 「一行一条」机检 L3① / 组标题识别 / status= 行内取值 / 勾销移归档档 | **v2 SQLite 替代**——枚举 CHECK / kind 列 / 软删除承接同语义；L1–L3 机检随 check-ledger 作废（M8）。历史文本留 git 历史 |
| v1 导出面（`scanGroups` / `summarizeLedger` / `blameAges` / `LEDGER_REL`） | md 扫描 / git blame 行龄 / md 标记 | SQLite 化（`ledgerQuery` / `ledgerCount` / 时间戳 / `LEDGER_DB_REL`） |
| 逐批设计记录 / 受影响文件 as-of 快照 / 逐批用例编号（T67–T110 / AC45–AC90） | 批次材料 | 流水归 `docs/batches/` + git 历史；机制级用例已重编入 §8 |
| 两仓台账收拢的一次性执行清单（含 v1 `docs/TODO.md` 存量 22 条一次性导入 `ledger.db`） | 迁移执行材料 | 一次性；台账 = 主 agent 写域 |
| 对端实现坐标（VSC 仓文件路径与行数） | 逐文件落点 | P2 产品面 ⇒ 归对端轮（本档保留机制原则与导出契约） |

## 变更记录

- 2026-09-15（**迁移批 · 第 4 批 · 大档拆分实迁** · eng-designer）：自 `thincoder-cli/docs/_archive/design/ENGINEERING-MODE.md` 切出并重建——承载原 §2.24（需求池指针台账 · L1–L3 机检）+ §2.30（台账提醒与可见面）+ §2.31（各仓自持指针）的机制面；坐标全量改现状路径。
- 2026-09-17（**v2 就地更新 · 退役批** · 主 agent）：M2 模块设计语义融合——存储 md → SQLite（§2 schema / §3 状态机+迁移表 / §4 kind+COUNT 单源 / §5 软删除+时间戳老化 / §6 机检收编 / §7 接口 SQLite 化 / §8 AC-M2 验收）；可见面三面机制与逐字契约保留；v1 md 机制入 §10 历史沿革；原旁路档 `_archive/modules/ENGINEERING-MODE-V2-MODULE-LEDGER.md` 归档 `_archive/modules/`。
- 2026-09-18（**批 判据/纪律三连 · 条目 #38** · eng-designer）：新增 §6.1 **写门·指针存在性**（`task_book` → 批次档；写入时门 + `§` 解析口径 + 失败文案 + 选型理由 + 边界）；§2 咬合 CHECK 行补非空 / 存在性半幅分层句；§8 增 AC-M2-8、用例表增 T11–T14。
- 2026-09-18（**批 判据/纪律三连 · 设计评审修正轮 1** · eng-designer——fix 轮；承批档 §3 发现 #4 / #5 / #7 / #8）：§6.1 补 **落点裁定**（门 = `ledger-cmd.mjs` 两函数体内 · 覆盖写入口 = 两工具 · 消费侧单一入口 ⇒ 不可绕过）· 失败文案前缀**定名 = 函数名**（附工具名↔函数名对应）· 选型理由③ 引用改指**实存处**（引擎头注 / M8 行 · 落点段 / 原 KD-M8-2 归档档）· 补「**射程连带效果与出路**」段。
