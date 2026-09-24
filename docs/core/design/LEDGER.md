# 台账机制（LEDGER）· 设计

> 板块：工程模式 / 台账——**待办总账单一权威源（SQLite）** + **台账提醒与可见面（FR24 载体面）**。
> **v2 就地更新**（2026-09-17 退役批）：存储 **md 台账 → SQLite 单表**（M2 模块设计语义并入本档；原旁路档 `_archive/modules/ENGINEERING-MODE-V2-MODULE-LEDGER.md` 已归档 `_archive/modules/`——就地更新纪律）。
> **F-LX1 执行者归属**（2026-09-21 本批并入）：多实例并存下在途条目记「谁在做」+ 可见面判活展示——schema `executor` 列（§2）· 迁移写语义（§3.1）· 判活展示（§7.3.1）；需求层指针 = `requirements/ENGINEERING-MODE-V2-SPEC-LEDGER.md` §2.8 · AC-M2-7/8。
> 需求层指针 = `requirements/ENGINEERING-MODE-V2.md` §3（M2 台账 SQLite）· §9（继承机制：台账提醒与可见面 = 原 MECHANISM §1.18）。
> 兄弟档：`design/LEDGER-SELF-CONTAINED.md`（L4「本仓可解析」判据）· `design/DOC-DISCIPLINE.md`（机检引擎）· `design/BATCH-RECORD.md`（核销同步清单槽位枚举 = `design/DOC-DISCIPLINE.md` D7 行）。
> 落点：用户数据目录键控库 `~/.thincoder/ledger/<sha1(项目根)>[:16].db`（SQLite，工作树外——天然不进 git；2026-09-17 用户裁定：不在项目目录）· `thincoder-core/ledger-db.mjs`（DDL / 开库 / 幂等迁移）· `ledger-cmd.mjs`（命令族 + 工具定义）· `ledger.mjs`（族发现 / scan 组装 / 判活解析 / 格式 helper + re-export 单源）· `ledger-surface.mjs` ×3（核机制 + CLI / VSC 端胶水——显示面）。

## 1. 机制目标与范围

需求池的诉求：**一眼看出“哪条需求落地了没有”**，无需遍历文档；条目与任务书**指针咬合**——点开即见任务书 §2 与验收结论。

**v2 换存储的三处结构缺陷（v1 md 台账）**：计数漂移（md 计数与实体条目手工同步）· 无事务（勾销 = 编辑文本，中断留脏态）· 无枚举约束（status/kind 散文字符串，非法值无机械拦截）。**SQLite 单表**一次性解决：六态 CHECK 机械锁死、`COUNT` 单源计数、事务保证收口原子。

**范围**：schema / 状态机 / 命令面（查询全角色 + 写仅主 agent）/ 归档软删除 / 计数单源 / 展示面（CLI TUI + VSC 状态栏与 chat 流，数据源迁移）+ 收口行。

## 2. 存储与 schema（v2——SQLite 单表）

**表 schema（`ledger-db.mjs` `DDL` 常量——`openLedger` 幂等执行 + 老库列迁移）**：

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
  executor   TEXT,
  created_at TEXT,
  updated_at TEXT,
  closed_at  TEXT,
  CHECK (status NOT IN ('在途','待核销') OR (task_book IS NOT NULL AND task_book <> ''))
)
```

- **三 CHECK 枚举**（`kind` / `status` / `trigger`）= 机械锁死——非法值 INSERT 由 SQLite 引擎拒（AC-M2-1/2），不靠应用层校验；`status` NOT NULL 兜底（CHECK 不拦 NULL）。
- **咬合 CHECK**：`在途 / 待核销` 必带 `task_book`（任务书指针——与 M3 批次档互指）——DDL 只承载**非空**半幅；**「指向档存在」半幅 = 写门**（§6.1 · AC-M2-10）。
- **时间戳三列**：`created_at` / `updated_at` / `closed_at`——行龄源（替代 v1 git blame）+ 软删除落点。
- **落点**：用户数据目录键控库 `~/.thincoder/ledger/<sha1(规范化项目根绝对路径)>[:16].db`（**键契约 = §2.1**）——项目根仅作关联键，**项目内不留任何文件**（无 .gitignore 负担；2026-09-17 用户裁定收正）；惰性创建（首次写面 `openLedger`；读面库不在 = 空账）。
- **executor 列**（F-LX1 · 2026-09-21 本批新增，TEXT 可空）：`sessionId` 文本——**schema 锚定零 CHECK**（会话进程 transient，无值域可锁；语义由 §3.1 写语义保证、活性由 §7.3.1 判活消化）；`ledgerAdd` INSERT 不涉（恒入待讨论、executor NULL）。
- **老库兼容与幂等迁移**（§2 逐字 DDL 为**新库**形态；旧 DDL 建的库无 `executor` 列）——`openLedger` 建表后迁移：
  - 预判：`PRAGMA table_info(items)` 判缺列才 `ALTER TABLE items ADD COLUMN executor TEXT`（幂等——二次打开列已在、零动作零副作用）。
  - 并发窗：两实例同时 ALTER，后到者收 SQLite「duplicate column」错——catch 后 `table_info` **复核**：列在 ⇒ 吞（对手实例已迁），列不在 ⇒ 抛真错。
  - 迁移零行损：ADD COLUMN 纯增量，既有行新列取 NULL。

### 2.1 库键契约与归一（2026-09-25 批 · 台账 #286）

**键式（单源 = `ledger-db.mjs` `ledgerKey(root)`）**：

```
key = sha1(normalizeCwd(resolveProjectRoot(cwd) ?? resolve(cwd ?? "."))).slice(0, 16)
```

- **归一步** = `session-slots.mjs` `normalizeCwd`（Windows 盘符统一大写）——跨端契约「两端同 cwd 同一 hash」；同契约消费面 = session / checkpoint / traces / peers。
- **`resolve()` 既有规范化**覆盖分隔符（`/`→`\`）· 点段折叠 · 去尾斜杠——归一函数只补**盘符大小写**一维；残差即本批断口（VSC `uri.fsPath` 小写盘符 vs CLI `process.cwd()` 大写）。
- **键不变性**：盘符本已大写（CLI 侧）⇒ 归一恒等 ⇒ **CLI 现状键零变**；小写盘符（VSC 侧）并入同键 ⇒ 两端同库。判据 = AC-M2-11。
- **级联面**：`findProject` / `discoverFamily` / `buildScan` / 去重档 `notifyKey` 全链随键收敛——**不新增归一函数、不改各调用点**（键只在 `ledgerKey` 一处生成；`notifyKey` 的路径归一保持自身单源）。
- **单源判据射程**（AC-M2-11 第三分句）：grep 域限**台账键生成面**（`ledgerKey` 所在链）——他面哈希（去重档 / 会话 / checkpoint / 迁移报告等合法同形哈希）**不属本判据**。

**不做（边界）**：`realpath` / 符号链接解析；**非盘符段大小写折叠**（POSIX 大小写敏感 + origin 语义——同 `MEMORY.md` §6.11「不做」）；别名路径（subst / junction / 8.3 短名 = 已知限制）。

**路径串等值比较边界（登记 · VSC 侧 `===`）**：台账链路现存字符串等值比较两处——`ledger.mjs` `discoverFamily` 的 `p.root !== current.root`，
`ledger-surface.mjs`（核与 VSC 两份）的 `s.root === family.current.root`。
两侧均出自**同一 anchor 的单进程同源谱系**，不跨端比较裸路径串；跨端一致性只经**库键与 `notifyKey`** 承载。
判定 = 零缺陷、零代码改；守卫 = 新增比较点不得跨端直比裸路径串（须经 `normalizeCwd` / `notifyKey`）。**验证面**：零代码改 ⇒ **无独立守卫用例**——验证 = 静态审计在册（本段）；T22 = **间接守卫**（级联面同契约下游回归：`findProject` / `notifyKey` 同键——非两处 `===` 点的直测）。

**指针**：导出契约 = §7.1；验收 = §8 AC-M2-11；存量收正 = §2.2。

### 2.2 存量迁移（同项目变体键合并 · 命令面 · 2026-09-25 批）

**问题**：键收正只改**未来键**——收正前已按两种盘符拼写沉淀的**变体键库**（同一项目两本）不会自动合并；其中一本的内容在另一拼写启动时不可见（半可见）。存量需**一次性迁移**（并入归一后键库）。

**命令面**（核内实现 `ledger-migrate.mjs` + CLI 子命令——先例 = `session gc` 的 `--dry-run` / `--confirm` 双档）：

| 命令 | 语义 |
|---|---|
| `thincoder ledger migrate --dry-run` | 只读报告：目标库（键 / 路径 / 行数——**缺档 ⇒ 标「拟建（0 行）」**；**不可读 ⇒ 标「不可读」且 confirm 面将拒跑（fail-closed）、迁移后计数以 `?` 占位**）· 变体源候选（逐源行数 + 状态分布 + mtime；**源不就绪（不可读 / 无 `items` 表 / 缺列）⇒ 行内标「⚠ <拒因>（confirm 面将拒跑）」**）· 计划动作（备份路径 / 拟迁行数 / 迁移后计数）· **写门风险旗**（迁入行属 `在途/待核销` 且 `task_book` 不可解析 / 指向档不存在 ⇒ 该行后续更新将拒于 §6.1 写门）。零写。 |
| `thincoder ledger migrate --confirm` | 执行六步（下）。执行主体 = **父侧 ops**（用户在场；先例 = 2026-09-18 memory origin 数据面「父侧 ops · 子代理零触碰」）；实施轮自动化面 = `_setLedgerDirForTest` 临时目录夹具。 |
| `thincoder ledger audit` | 只读全目录分类报告（存量残档审计载体——逐键定性 + 处置建议）。 |

**变体键枚举法（单源 = `legacyKeyVariants(root)`）**：候选 = 项目根**盘符大小写翻转拼写**的**原样 `sha1[:16]`**（收正前键式 = 无归一哈希；先例 = `session-migrate.mjs`「盘符两形都试」）。非盘符段不生成变体（§2.1 不做）。
显式 `--from <key>` = **补充源**（用户已知键并入枚举候选、去重）——**取值必须为 16 位小写十六进制键形**（`/^[0-9a-f]{16}$/`，判在目录拼接之前 ⇒ 路径形 / 越目录形取值不落台账目录外档）；**非法键形 / 指名键无对应库 / 不可开 ⇒ 拒跑**（fail-closed，零写；显式指名不静默跳过）。目标键 = `ledgerKey(root)`（归一形）。

**执行六步（`--confirm`）**：

1. **备份（不可省）**：目标库 + 全部源库**文件拷贝**进 `~/.thincoder/ledger-backup/<YYYYMMDD-HHmmss>/`——**备份 / 回收目录 = `ledgerDirPath()` 的兄弟位**（同派生于可覆盖基；`_setLedgerDirForTest` 覆盖后二者同随 ⇒ 夹具根外零写）；**目标库缺档态**：目标键库不存在 ⇒ 视为空目标（0 行、无可备档——报告标「拟建」），迁入步建库建表；读回判据 = 逐档可开 ∧ `COUNT(*)` 同源；失败 ⇒ 拒跑（零写）。
2. **源就绪与列集判**：源可开 ∧ 含 `items` 表 ∧ **12 数据列核对**（`PRAGMA table_info(items)`）——**仅缺 `executor`**（旧 DDL 正常态）⇒ 该列按 **NULL 映射**照迁；**缺其余任一数据列** ⇒ 拒（列集不可归因，fail-closed）；带 `-wal` / `-shm` 伴生档的源 ⇒ **拒**（fail-closed——单档回收会丢未 checkpoint 数据）。
3. **单事务迁入**：`BEGIN` → 逐行 INSERT（**重发新 id**——目标 `INTEGER PRIMARY KEY` 自增；映射 `源id → 新id` 由 `lastInsertRowid` 采集）→ **事务内读回核验**（逐行 **12 数据列**与源等值——**不含 id**（id 重发）∧ 目标既有行不动）→ `COMMIT`；任一步失败 ⇒ `ROLLBACK`（措辞二分支：既有目标「目标零变、源零动」/ 新建目标「目标零行变、源零动（目标档为本次新建——ROLLBACK 后 0 行空库档残留在原路径）」）。
连接设 `PRAGMA busy_timeout = 3000`（先例 = `memory/schema.mjs` 同值）；忙 ⇒ 明示「另一实例占用」拒跑。
4. **回收源**：源库 rename 进 `~/.thincoder/ledger-trash/<批次>/`（**同可覆盖基**——见步 1；**不 unlink**——先例 = session-gc `sessions-trash`）。
5. **报告**：`ledger-backup/<批次>/migrate-report.json`——迁前 / 迁后计数、逐源逐行 id 映射、跳过行、旗标。
6. **汇总输出**：迁入行数 / 跳过数 / 迁移后目标计数 / 备份与回收路径。

**幂等护栏**：INSERT 前按**全字段等值**跳过目标已有行（崩溃窗重跑不重复）；重跑时源已回收 ⇒ 报「无待迁源」（exit 0）。

**语义保全**：**12 数据列逐字复制**（kind / status / title / board / req_doc / task_book / evidence / trigger / executor / created_at / updated_at / closed_at——**不含 id**）；**id 重发**（两库 id 空间重叠——保留原 id 必撞；外部可回查面 = 报告映射 + 源库留档）；零字段改写、零状态改写。**等值比对列集** = 该 12 列（不含 id）。

**审计面（`thincoder ledger audit`）**：逐 `*.db` 出 `{键, 文件, 大小, mtime, 行数, 状态分布, 定性}`；定性枚举 = `目标库` / `变体源` / `空库` / `不可归因（有行）` / `不可归因（读取失败）` / `不可读（坏档）`。
**读取失败态**（并发删除 / 不可 `stat`）该档大小 / mtime / 行数记空（输出 `—` / `?` 占位）、**按档报告不抛**（整命令不中断）。归因法 = **候选根集合**（当前锚项目 + `--root` 追加）的变体键匹配（sha1 不可逆——只做候选生成，不做启发式）。**处置建议**（本批**只报告零动作**）：非目标 / 非源者保持原位；空库与夹具残库建议**回收目录**而非删。as-of 读数 = 批档 §2。

**边界**：不做跨项目全量一条命令迁移（逐项目锚定）；不自动执行（需 `--confirm`）；不删除存量残档（只报告 + 建议）；不动其他用户态面（sessions / checkpoints / memory / `ledger-notify.json` 存量）；不做自动回滚（回退 = 从备份拷回 + 重开校验，手工步）。

**指针**：验收 = §8 AC-M2-12 / AC-M2-13 · 用例 T24–T32；CLI 接线 = `thincoder-cli/bin/thincoder.mjs` `case "ledger"`。

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

### 3.1 executor 迁移写语义（F-LX1 · 2026-09-21 本批新增）

**判位与判序**（挂 `thincoder-core/ledger-cmd.mjs` `ledgerUpdate` 函数体内：迁移表判**之后**、写门 `assertTaskBookGate` 与 `UPDATE` **之前**——同函数同层，判序 = 迁移表判 → 本语义（算 executor 目标值）→ 写门 → UPDATE）：计算结果行状态 `to` 的 executor 目标值，随同一 `UPDATE` 落列。

统一优先级：**patch 显式值 > 自动语义（进 = sessionId / 出 = NULL）> 行现值兜底 > NULL**。

1. **进入「在途」**（`待设计 → 在途`——迁移表唯一入边）：`executor = patch.executor ?? sessionId ?? 行现值 ?? NULL`。
   - `sessionId` = 调用会话，**函数参数注入**——`ledgerUpdate({ …, executorSessionId })`；工具层由 `ledger_update` execute **动态 import** `getSessionId()`（`session-slots.mjs`——形如 `{pid}-{ts}-{rand}`）供值（决策 K-LX1：纯函数可测 + 零新静态边）。
   - `patch.executor` = `ledger_update` 参数面新增可选字段（接手改写归属入口——见 5）。
   - **行现值兜底**：`已废弃 → 在途` 重启保留原属主（无新实施迹象时归属不漂——非空即留）。
2. **离开「在途」**（`在途 → 待核销` / `在途 → 已废弃`——迁移表仅此两出边；六态**无回退边**，AC-M2-7「回退清除」子句无表内路径承载 ⇒ 语义由出边清除覆盖）：**无条件置 NULL**——patch 显式传 `executor` 也不复活（出边自动语义压 patch）。
3. **其余情形**（无状态迁移的纯字段更新 / 非在途出入门的迁移——如 `待讨论 → 待设计`）：executor 按普通补丁字段语义 `patch.executor ?? 行现值`——既有调用（不带 executor）行为零变。
4. **`ledgerClose` 撤回路径**（任意态 → 已废弃——含在途直撤）：UPDATE 同步 `executor = NULL`；勾销路径（待核销 → 已核销）零触碰（executor 已在离场迁移清空）；`ledgerAdd` 零变。
5. **接手 = 软语义**（executor 信息性非锁——D-MI6 精神）：任何实例经既有 `ledger_update` 改写归属（`executor` 字段或整段状态循环重走）；不设迁移门、不设机械锁。**禁**（父侧必答②裁定）：自动接手 / 自动清 executor / 每回合心跳写共享 SQLite（多进程写竞争 + 绕用户 gate）。

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
2. **解析基准 = `resolveProjectRoot(cwd) ?? resolve(cwd ?? ".")`**（**= 库键式的同一子表达式**——键式另加 `normalizeCwd` 一步，见 §2.1 键式单源；解析基准本身不归一）：`resolve(base, 文件部分)`；绝对路径按 Node `path.resolve` 语义原样取用。（父侧直改·可 revert · 承写门 fix 轮 O1 收正——原口径写「调用 `cwd`」在容器根形态与库键自相矛盾；2026-09-25 批改述「逐字同源」——键在子表达式外另有 `normalizeCwd`）
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
| `ledgerDbPath(cwd)` | 项目根 → 键控库路径（sha1(规范化绝对路径) 前 16 位——替代 v1 `LEDGER_DB_REL` 项目内标记；键式单源 = §2.1） |
| `ledgerKey(root)` | 项目根 → 库键（`sha1(normalizeCwd(root))[:16]`——键式单源，§2.1） |
| `ledgerDirPath()` | 台账库目录（`_setLedgerDirForTest` 覆盖的同一变量——迁移 / 审计面默认根） |
| `runLedgerMigrate(args, …)` / `runLedgerAudit(args, …)` | 存量迁移 / 目录审计命令面（§2.2；CLI 子命令入口） |
| `openLedger(cwd)` | → `DatabaseSync` 句柄 + `ensureSchema`（幂等建表） |
| `ledgerQuery({ cwd, status, kind, board })` | SELECT 行集（只读，全角色） |
| `ledgerCount({ cwd })` | `COUNT(*)` WHERE 未决四态（单源计数） |
| `ledgerAdd({ cwd, row })` | INSERT（写命令，主 agent） |
| `ledgerUpdate({ cwd, id, patch })` | UPDATE（写命令，主 agent——迁移表校验） |
| `ledgerClose({ cwd, id, status })` | UPDATE status + `closed_at`，事务包裹（写命令，主 agent） |
| `findProject(anchor)` | 向上（含自身）最近的**已注册台账**目录（用户目录键控库存在）→ `{root, ledger}` / `null` |
| `discoverFamily(anchor)` | `{current, projects}`——current = `findProject`；projects = current + 其同级含台账目录 |
| `formatMarker(scan)` | §7.3 逐字（**签名与键语义不变**——L1 标记本批零扩，§7.3.1） |
| `formatDetailLine(scan)` | §7.3 逐字 + **判活尾段**（§7.3.1 三态文案；签名不变——`scan` 携新键） |
| `resolveExecutorStates(scans)`（**新增**） | 在途 executor 判活批量解析（§7.3.1）——`executors` / `deadExecutors` 键组装单源 |
| `planChangeLines(prev, summary)` / `loadNotifyState` / `saveNotifyState` | §7.3 逐字（**签名与键语义不变**——展示面保留，只换数据源） |

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
| L2 明细行 | 每项目一行 | `台账 <名>：需求池 <pool> · 技术待办 <tech>（老化 <aged>）` +（阈值时）` — 可开批` +（判活尾段——§7.3.1） | 该项目 `actionable` → 警示色；否则 dim |
| L3 变化行·老化 | 每事件一行 | `台账变化：<名> 老化首次越线 <n> 条（超 30 天未处置）：<t1>；<t2>；<t3>`（标题 = 条目首段粗体；**无粗体段 → 回退 = 归一化文本前 20 字**；>3 条时第三项后接 `；…`） | 警示色 |
| L4 变化行·阈值 | 每事件一行 | `台账变化：<名> 需求池达阈值（<pool> 条）— 可开批` | 警示色 |

- `<名>` = 项目根目录 basename；数字 = 十进制整数；`<aged>` **恒显**（含 0——自证已检查）。
- **收口行输出** = L2 行序列（行集 = 族行）；族空时输出 `台账：未发现台账。`（**仅命令面**——运行时面静默）。
- **状态行位置**：状态段簇**尾**（键位组前）——与既有状态段同簇、同右截优先级。

### 7.3.1 判活展示（executor 三态——F-LX1 · 2026-09-21 本批新增）

**判据单源**：`thincoder-core/process-probe.mjs` `ownerState(pid, { aliveSet, cmds })` **三态**（`alive` / `dead` / `unknown`）——调用面不得复刻判据；D-MI10 不对称沿用：`unknown` ⇒ **不显示死亡**。

**executor → pid 解析** = sessionId 首段整数（`peer-instances.mjs` `groupSlotSessions` 同款解析——`Number.parseInt(sessionId.split("-")[0], 10)`）；pid 不可解析 ⇒ `unknown`。

**批量与缓存口径（父侧必答①——性能红线）**：

1. **一次批量**：核内新增 `resolveExecutorStates(scans)`（`ledger.mjs` 导出——组装单源）：
   - 收集各 scan 的 `inflightExecutors`（在途且 executor 非空集）→ pid 去重 → **一次 `probeOwnersAsync` 束**（≤1 批量判活 + ≤1 批量 cmdline——D-MI3 / N-MI3：**禁止逐行 exec**）。
   - 逐 executor `ownerState` → 每 scan 挂 `executors: [{executor, pid, end, state, staleDays}]` + `deadExecutors: n`；`end` = cmdline 可得时的 `classifyEnd` 值。
   - `staleDays` = 该 executor 所在行 `updated_at ?? created_at` 距今天数（向下取整；时间戳缺 → null——「N 天未动」标注源，零新状态）。
2. **TTL 缓存**：解析结果按 pid 缓存（模块级 Map——**5s TTL，与 `peer-instances.mjs` `PEER_PROBE_TTL_MS` 同源口径**；peer 惰性缓存先例）；TTL 内重复解析零 exec。**无在途 executor ⇒ 零 exec 快返**（不探、不缓存）。
3. **零写径探测**：判活只落显示面——`ledgerUpdate` / `ledgerClose` 写路径零探测（父侧必答①）。
4. **异步形态**：`runLedgerScan` 变 **async**（await 判活解析）——读面不得同步 exec 占住事件循环（D-MI14）；端胶水调用点补 await（CLI / VSC）。

**三态文案（L2 尾段——`formatDetailLine` 追加，三面同文单源）**：

| 态 | 尾段 |
|---|---|
| `deadExecutors > 0` | `（属主已死 <n>，可接手）`——**dead 优先**（行动项压信息项） |
| 死 0 · inflight > 0 · 最长 staleDays ≥ 1 | `（执行中 <n> · 最长 <d> 天未动）`——陈旧在途标注（父侧必答②；行龄源 = 既有 `updated_at`，零新状态） |
| 死 0 · inflight > 0 · staleDays < 1 | `（执行中 <n>）` |
| inflight = 0 | 无段——**既有逐字断言零破** |

逐条目「属主 X · N 天未动」明细 = `executors[]` 元素（端 tooltip / 后续展示面按需渲染）；查询行 = `ledger_query` 行集自然携带 `executor` + `updated_at` 原始字段（SELECT * 纯增量——签名不破）。**工具行不做判活**（K-LX4：判活时点性强——工具行保数据保真，判活展示归格式化径）。

**L1 标记零扩（本批裁定）**：`台账 <pool>·<tech>` 文本不变（§7.3 逐字契约锁定）；执行中 / 死亡信息落 L2 尾段。**状态位扩**：`state.ledger.warn = aged>0 || deadExecutors>0`（死亡 = 行动级警示——CLI 渲染端与 VSC item 警示底色判据同扩；L1 文本仍零变）。

**core scan 形状新增键**：`inflightExecutors`（`buildScan` 挂——**sync 零变**，K-LX2：三端既有 sync 直调面零破，判活独立 async 单源）/ `executors` · `deadExecutors`（`resolveExecutorStates` 挂载）——端胶水零成本透传。

**端接线**（双端零新探测——判活解析全在核）：

- CLI 胶水（`thincoder-cli/src/tui/ledger-surface.mjs`）**机制归核**——自实现 `runLedgerScan` 删除，动态 import 扩载 `@thincoder/core/ledger-surface.mjs` + `colors = C`（TUI 色表）注入（CORE-UNIFICATION #174 机制单源方向；端壳静态链仍不达 node:sqlite——W8 契约②机检守）。
- VSC 端（`thincoder-vscode/src/extension/ledger-surface.mjs`）调用点补 await；`scanFamily`（tooltip 径）同挂判活——tooltip 明细行与 chat 流 L2 同文。

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
| AC-M2-7 | 进入「在途」的迁移带 `executor` = 会话 `sessionId`（函数注入，patch 显式值优先——§3.1）；离开「在途」的迁移 `executor` = NULL（`ledgerUpdate` 两出边 + `ledgerClose` 撤回路径） | ②.8（F-LX1 · 2026-09-21 本批——旧 AC-M2-7 重编 AC-M2-9 让位） |
| AC-M2-8 | `executor` 非空且属主进程已死 → 可见面显示「属主已死，可接手」；探测失败（unknown）→ 不显示死亡（保守——活 / 死 / unknown 三态对照，§7.3.1） | ②.8（F-LX1 · 2026-09-21 本批——旧 AC-M2-8 重编 AC-M2-10 让位） |
| AC-M2-9 | 迁移表外状态迁移 → 拒（`ledgerUpdate` 待讨论→已核销拒；`ledgerClose` 目标/源态校验）——**原 AC-M2-7 重编承接**（2026-09-21 本批，语义零变） | ②.2 |
| AC-M2-10 | `在途 / 待核销` 行的 `task_book` 文件部分**不可解析 / 不存在** → 拒（throw，行不变）；存在 ⇒ 通过（含 `§N` / `§N（括注）` 形态）——**原 AC-M2-8 重编承接**（2026-09-21 本批，语义零变） | §6.1（架构 E1 后半幅 · 台账 #38） |
| AC-M2-11 | 库键归一：同项目盘符两拼写（`D:\x` / `d:\x`）⇒ `ledgerDbPath` 同库路径；盘符本大写输入键不变（CLI 现状键回归）；键式单源（`ledgerKey` 一处生成——**射程 = 台账键生成面**，该面 grep 无第二份 `sha1` 键式；他面哈希合法、不属本判据） | §2.1 |
| AC-M2-12 | 存量迁移三件套：`--dry-run` 零写报告（源 / 目标 / 行数 / 备份路径）；`--confirm` 先备份（拷贝 + 读回同计数）后单事务迁入（**12 数据列逐条保全**（等值比对列集不含 id——重发）· 事务内读回核验）；重跑幂等（0 新增 / 无待迁源）；源回收进 `ledger-trash`（不删） | §2.2 |
| AC-M2-13 | 审计面只读：逐库定性（目标 / 变体源 / 空库 / 不可归因（有行）/ 不可归因（读取失败）/ 不可读（坏档））+ 候选根集合归因；全目录文件集合 / 大小 / mtime 三不变 | §2.2 |

**用例表（摘）**：T1 入条目 → 新行 id 自增 · T2 状态迁移 → status 更新 + `updated_at` 刷新 · T3 勾销 → status 已核销 + `closed_at` 写入、行保留（软删除）· T4 未决四态计数（混入归档行）· T5 `trigger=NULL` 通过 · T6 非法 status 拒 · T7 在途缺 task_book 拒 · T8 非主 agent 写 → 命令不存在 · T9 status NULL 拒 · T10 迁移表外迁移拒（行不变）。

**用例表（续——写门·指针存在性）**：T11 `task_book` 三形态（无后缀 / `§2` / `§1.5（括注）`）指向在档 → 通过 · T12 指向不在册档 → 拒（文案 + 行不变）· T13 `task_book` 缺文件部分 → 拒 · T14 待讨论行带任意 `task_book` → 不判（射程 = 结果行状态）。

**用例表（续——执行者归属与判活展示，F-LX1 · 2026-09-21 本批；新档 `thincoder-core/test/ledger-executor.test.mjs`；L2 文案断言双端 = `thincoder-cli/test/ledger-surface.test.mjs` / `thincoder-vscode/test/ledger.test.mjs`）**：

- T15 `待设计 → 在途` ⇒ 行 `executor` = 注入 sessionId（兜底链三态各一拍：缺省 / patch 显式 / 行现值兜底）。
- T16 `在途 → 待核销` / `在途 → 已废弃` ⇒ executor NULL（patch 显式传也不复活）。
- T17 `ledgerClose` 在途直撤 ⇒ executor NULL；勾销路径零触碰；纯字段更新不带 executor ⇒ 行值零变。
- T18 旧 DDL 建库 → 打开列补齐、行不损；二次打开幂等零副作用；并发 ALTER 撞「duplicate column」→ 复核列在吞。
- T19 三态对照（注入 `_setProcessProbeTestImpl`）：dead ⇒ L2 带「属主已死，可接手」/ alive + staleDays ≥ 1 ⇒「执行中 <n> · 最长 <d> 天未动」/ unknown（aliveSet null · cmdline 缺行）⇒ 不显死亡。
- T20 inflight 空 ⇒ `resolveExecutorStates` 零 exec 快返；同 pid 二次解析 TTL 内零 exec。

**用例表（续——库键归一与存量迁移，2026-09-25 批；新档 `thincoder-core/test/ledger-key-normalize.test.mjs` / `thincoder-core/test/ledger-migrate.test.mjs`）**：

- T21 键归一：同项目两盘符拼写（含 `\` / `/` 混写、尾斜杠）⇒ `ledgerDbPath` 同路径；盘符本大写 ⇒ 键 = 原样 `sha1[:16]`（回归）。
- T22 级联守卫（§2.1 比较边界登记）：`findProject` 以两拼写 anchor ⇒ 命中同一库文件；`notifyKey` 同键。
- T23 边界：**null / undefined / 空串** cwd 不炸（`resolve(cwd ?? ".")` 只兜此三态；数值 / 对象入参不在本用例射程——由 `path.resolve` 语义照常抛）。
- T24 迁移 dry-run：夹具两库（目标 + 变体源）⇒ 报告含目标键 / 源键 / 逐源行数 / 计划迁入数 / 备份路径；**零写**（目录文件集合与 mtime 不变）+ **夹具根外零写**（备份 / 回收目录同随覆盖基——真实用户目录零触碰）+ **目标不可读子例**（非 sqlite 档）⇒ 显式标「不可读」、迁移后计数 `?` 占位、全输出零 `undefined`。
- T25 迁移执行：源 N 行迁入（新 id 连续）；**12 数据列逐条保全 + id 重发**（等值比对列集不含 id；id 映射入报告）；目标既有行不动；源库进 `ledger-trash/<批次>/`；`ledger-backup/<批次>/` 两档同计数；**夹具根外零写**。
- T26 幂等：同夹具连跑两次 ⇒ 第二次 0 新增（源已回收 ⇒ 「无待迁源」）；总行数 = 首跑后计数（无重复行）。
- T27 fail-closed：源带 `-wal` 伴生档 ⇒ 拒（目标零变、源零动）；备份失败 ⇒ 拒跑；忙（第二连接持写锁）⇒ 明示拒跑（既有目标 ⇒ 措辞「目标零变、源零动」零变）；**新建目标 + 迁入失败**（源行撞目标 CHECK）⇒ ROLLBACK + 残留措辞（「目标档为本次新建——0 行空库档残留在原路径」；不再称「目标零变」）。
- T28 审计：夹具含 目标 / 变体源 / 空库 / 不可归因（有行）/ 不可归因（读取失败）/ 不可读（坏档） 六类 ⇒ 定性正确 + `--root` 归因命中；全目录零删改（文件集合 / 大小 / mtime 三不变）。
- T29 列集就绪判：源库由旧 DDL 建（缺 `executor` 列）⇒ 该列按 NULL 映射照迁、其余 11 列逐字；源库缺其余任一数据列 ⇒ 拒（目标零变、源零动）。
- T30 目标缺档态：目标键库不存在 ⇒ dry-run 标「拟建（0 行）」；`--confirm` 迁入建库建表、迁后计数 = 源行数；备份面标注目标无可备档。
- T31 `--from <key>`：**取值必须为 16 位小写十六进制键形**（`/^[0-9a-f]{16}$/`——路径形 / 非键形 ⇒ 拒）；显式键补充源 ⇒ 并入候选（与枚举去重）后照六步迁入；指名键无对应库 / 不可开 ⇒ 拒跑（fail-closed，零写）。
- T32 dry-run 写门风险旗：源含 `在途 / 待核销` 且 `task_book` 不可解析 / 指向档不存在的行 ⇒ 报告含风险旗（**不拦截**、照迁）；dry-run 零写照旧。

## 9. 边界（本档不做）

- 不做 manifest（M1，只互指咬合）；不做批次档（M3）；不做 checklist（M7 废除，语义由本模块六态承接）。
- 不做 `docs/TODO-archive.md` 项目归档档搬迁；不承载细节展开（条目一行一条）。
- 不新增台账展示面形态（`ledger-surface.mjs` ×3 保留——本批仅 CLI 胶水**机制归核**切 core `runLedgerScan`，渲染面零新增形态）；不造 SQLite 计数状态条。
- 不做 `check-ledger` 脚本迁移（归 M8 删除）。
- 不新增工具/命令/快捷键面；不监听文件系统；不做跨进程缓存 / 全工作区深扫 / 网络面。
- 不写实现代码（ledger.mjs = eng-coder 写域）；不写提示词实体。
- **同级枚举上限**（成本有界）：`MAX_SIBLING_SCAN`——目录项数超限 → 该层候选判空集，退化 current-only；current 缺 → 继续向上求候选。
- **判活四不做**（F-LX1 · 2026-09-21 本批）：不做写径探测（`ledgerUpdate` / `ledgerClose` 零判活——判活只落显示面）；不做逐行 exec（一次批量 + 5s TTL 缓存——§7.3.1 性能红线）；不做心跳写共享 SQLite / 自动接手 / 自动清 executor（多进程写竞争 + 绕用户 gate——父侧必答②裁定）；L1 标记文本零扩。
- **库键与迁移**（§2.1 / §2.2 · 2026-09-25 批）：不做 `realpath` / 符号链接解析；不做**非盘符段大小写折叠**（POSIX 大小写敏感——同 `MEMORY.md` §6.11 口径）；不做别名路径（subst / junction / 8.3）；不做跨项目全量迁移（逐项目锚定）；迁移不自动执行（需 `--confirm`）；存量残档不删除（只报告 + 回收建议）；不动其他用户态面（sessions / checkpoints / memory / `ledger-notify.json` 存量）。

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
- 2026-09-21（**批 LEDGER-EXECUTOR · F-LX1 设计轮** · eng-designer）：§2 schema 加 `executor` 列（零 CHECK）+ 老库幂等迁移（`table_info` 预判 + ALTER catch 复核）；§3.1 新增 **executor 迁移写语义**（进在途写 sessionId / 出在途清 NULL / `ledgerClose` 撤回同步 / 接手软语义 + 陈旧在途展示）；
  §7.1 导出面 + `resolveExecutorStates` · §7.3.1 新增**判活展示**（`ownerState` 三态单源 · 一次批量 + 5s TTL 缓存 · L2 尾段三态文案 · L1 零扩 · CLI 胶水机制归核）；
  §8 AC-M2-7/8 换新语义（F-LX1），旧 AC-M2-7/8 **重编 AC-M2-9/10 承接**（语义零变——对齐需求档 2026-09-21 新增）；§9 判活四不做；用例表增 T15–T20。
- 2026-09-25（**批 ledger-key-normalize · 设计轮** · eng-designer——承批档 §1.1 台账 #286）：新增 **§2.1 库键契约与归一**（键式单源 `ledgerKey` · `resolve()` 残差分析 · CLI 键零变 / VSC 收敛 · 非盘符段不折叠 · 路径串比较边界登记）
  + **§2.2 存量迁移**（变体键枚举法 · 六步执行 · 幂等护栏 · 审计面 · 边界）；§2 落点行键式收正 + §7.1 增三行导出（另 `ledgerDbPath` 行收正）+ §8 增 AC-M2-11/12/13 与 T21–T28 + §9 边界补「库键与迁移」行。
- 2026-09-25（**批 ledger-key-normalize · 设计评审轮 1 修正** · eng-designer——fix 轮；承批档 §3 发现 1–13 父侧裁定）：保全口径统一 **12 数据列 + id 重发**（步 3 / 语义保全 / AC-M2-12 / T25——等值列集不含 id）；步 1 补备份 / 回收目录**同可覆盖基** + 目标缺档态、步 2 补**列集就绪判**（仅缺 `executor` ⇒ NULL 映射，余缺 ⇒ 拒）；
  `--from` 语义收正 + AC-M2-11 单源判据**射程收限** + T23 收窄三态 + §6.1 口径 2 改述（键式子表达式）+ §2.1 比较边界补验证面；用例 +T29–T32。
- 2026-09-25（**批 ledger-key-normalize · 实施后设计收正（#88）** · eng-designer——承批档 §5.7 上抛 1（同轮实施四项 = `--from` 键形守卫 / 审计读取失败态 / dry-run 目标不可读定形 / 新建目标残留文案）——设计档两处补句）：
  §2.2 `--from` 句补**键形拒条件**（`/^[0-9a-f]{16}$/` 判在目录拼接之前 ⇒ 路径形 / 越目录形取值不落台账目录外档；非法键形 / 无库 / 不可开 ⇒ 拒跑）；
  §2.2 审计面枚举补第 6 态 **`不可归因（读取失败）`**（并发删除 / 不可 `stat` ⇒ 大小 / mtime / 行数记空、按档报告不抛）。
- 2026-09-25（**批 ledger-key-normalize · 同族枚举一致性收正（#95）** · eng-designer——承批档 §2.14 旁支观察 1/3/4 + 2（设计档半）父侧裁定 · fix 轮）：
  T31 行补**取值键形**（16 位小写十六进制）与**路径形 / 非键形两拒态**；AC-M2-13 与 T28 枚举收正——**`不可归因（读取失败）`** 入列（六形全列，与 §2.2 / 需求档同形），T28 计数随列改（「五类」→「六类」——D3）。
- 2026-09-25（**批 ledger-key-normalize · 同族滞后闭合（#98 列报 4 + 闭合面对读余项 3）** · eng-designer——承批档 §2.16 · fix 轮）：步 3 补**新建目标分支文案**（与实现两分支同源）· dry-run 行补**目标不可读标记 + 源不就绪标记** · T24 补不可读子例 · T27 补新建目标残留措辞子例；
  对读余项 A/B/C（源侧确认标记同概念 · 写门风险旗两形「不可解析 / 指向档不存在」· 拒（零写）伞称与用例断言对齐）一次收齐——**结论 = §2.2 / §8 / §9 全表对读无余项**。（本行 = 父侧直接执行补记 · 可 revert）
