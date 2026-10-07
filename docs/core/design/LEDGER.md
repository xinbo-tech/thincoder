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

**范围**：schema / 状态机 / 命令面（查询全角色 + 写仅主 agent）/ 归档软删除 / 计数单源 / 展示面（CLI TUI + VSC 状态栏，数据源迁移）+ 收口行。

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
- **咬合 CHECK**：`在途 / 待核销` 必带 `task_book`（任务书指针——与 M3 批次档互指）——DDL 只承载**非空**半幅；**「指向档存在」半幅 = 写门**（§6.1 · AC-M2-10）——工具路径下缺指针（`null`）亦由写门先拒；DDL CHECK = 库级防线。
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

- **归一步** = `session-slots.mjs` `normalizeCwd`（Windows 盘符统一大写——**盘符步 = `normalizeCwd` 直调**；分隔符折叠自持）——跨端契约「两端同 cwd 同一 hash」；同契约消费面 = session / checkpoint / traces / peers。
- **`resolve()` 既有规范化**覆盖分隔符（`/`→`\`）· 点段折叠 · 去尾斜杠——归一函数只补**盘符大小写**一维；残差即本批断口（VSC `uri.fsPath` 小写盘符 vs CLI `process.cwd()` 大写）。
- **键不变性**：盘符本已大写（CLI 侧）⇒ 归一恒等 ⇒ **CLI 现状键零变**；小写盘符（VSC 侧）并入同键 ⇒ 两端同库。判据 = AC-M2-11。
- **级联面**：`findProject` / `discoverFamily` / `buildScan` 全链随键收敛——**不新增归一函数、不改各调用点**（键只在 `ledgerKey` 一处生成）。
- **单源判据射程**（AC-M2-11 第三分句）：grep 域限**台账键生成面**（`ledgerKey` 所在链）——他面哈希（会话 / checkpoint / 迁移报告等合法同形哈希）**不属本判据**。
- **根解析面（歧义拒——2026-10-02 · #828）**：根式兜底（`resolve(cwd ?? ".")`）**只属「无项目」（none）**——建档流语义；**歧义（≥2 候选）⇒ 不产键**：`openLedger`（存取入口单点）显式拒——列候选 + 指明显式项目根（判定 = `projectRootView`——`manifest-discovery.mjs` 新导出；文案族「项目不可解析」）。消「静默回退到锚」双面症（缺省空读 / 错写落锚）。键式函数本体（`ledgerKey`）零改。

**不做（边界）**：`realpath` / 符号链接解析；**非盘符段大小写折叠**（POSIX 大小写敏感 + origin 语义——同 `MEMORY.md` §6.11「不做」）；别名路径（subst / junction / 8.3 短名 = 已知限制）。

**路径串等值比较边界（登记 · VSC 侧 `===`）**：台账链路现存字符串等值比较**三处**——（#882 批增）`ledger.mjs` `scopeMarkerOf` 范围滤取 `scan.root === family.current.root`（现盘 `:166`——实现式 = 解构后 `s?.root === currentRoot`，本写法为近似形）；`ledger.mjs` `discoverFamily` 的 `p.root !== current.root`，
`ledger-surface.mjs`（核与 VSC 两份）的 `s.root === family.current.root`。
三处均出自**同一 anchor 的单进程同源谱系**，不跨端比较裸路径串；跨端一致性只经**库键**承载。
判定 = 零缺陷、零代码改；守卫 = 新增比较点不得跨端直比裸路径串（须经 `normalizeCwd`）。**验证面**：零代码改 ⇒ **无独立守卫用例**——验证 = 静态审计在册（本段）；T22 = **间接守卫**（级联面同契约下游回归：`findProject` 同键——非各 `===` 点的直测）。

**指针**：导出契约 = §7.1；验收 = §8 AC-M2-11 ∥ AC-M2-17（根解析面）；存量收正 = §2.2。

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

**边界**：不做跨项目全量一条命令迁移（逐项目锚定）；不自动执行（需 `--confirm`）；不删除存量残档（只报告 + 建议）；不动其他用户态面（sessions / checkpoints / memory / `ledger-notify.json` 历史存量档——去重机制退役随深清，零读写）；不做自动回滚（回退 = 从备份拷回 + 重开校验，手工步）。

**指针**：验收 = §8 AC-M2-12 / AC-M2-13 · 用例 T24–T32；CLI 接线 = `thincoder-cli/bin/thincoder.mjs` `case "ledger"`；首跑检测提示（F-LX3）= §12。

## 3. 状态机（六态 + 迁移表）

六态：待讨论 → 待设计 → 在途 → 待核销 → 已核销；任意态 → 已废弃。状态迁移**只在写命令内收敛**（`ledgerAdd` 入待讨论 / `ledgerUpdate` 迁移 / `ledgerClose` 核销→已核销、撤回→已废弃），查询面只读 status。

**收口两源（2026-09-25 本批）**：已核销的来源 = 待核销（勾销）· **待讨论 / 待设计（追认核销——行 `evidence` 非空，缺 / 全空白则拒）**；**在途 → 已核销 不可跳**（仍经 待核销）。撤回与 `ledger`（update）迁移表零改。
失败文案（逐字——机检断言面）：源态不许核销 ⇒ `ledgerClose：核销仅限 待讨论 / 待设计 / 待核销（现态 <X>）`；追认缺 `evidence` ⇒ `ledgerClose：追认核销须带 evidence（现态 <X>）`。

**允许迁移表**（`ledgerUpdate` 迁移前判；表外 → 拒，行不变）：

| 现态 | 允许目标态 |
|---|---|
| 待讨论 | 待设计 · 已废弃 |
| 待设计 | 在途 · 已废弃 |
| 在途 | 待核销 · 已废弃 |
| 待核销 | 已核销 · 已废弃 |
| 已核销 | 已废弃 |
| 已废弃 | （终态，无出边） |

### 3.1 executor 迁移写语义（F-LX1 · 2026-09-21；2026-10-07 批 ledger-tool 扩点火入边——§13.3）

**判位与判序**（挂 `thincoder-core/ledger-cmd.mjs` `ledgerUpdate` 函数体内：迁移表判**之后**、写门 `assertTaskBookGate` 与 `UPDATE` **之前**——同函数同层，判序 = 迁移表判 → 本语义（算 executor 目标值）→ 写门 → UPDATE）：计算结果行状态 `to` 的 executor 目标值，随同一 `UPDATE` 落列。

优先级两分句：**进边 = patch 显式值 > sessionId > 行现值兜底 > NULL**；**出边 = 无条件 NULL**（patch 显式值不复活）。

**`null` 口径（2026-09-28 · 台账 #474）**：`executor` 的显式 `null` ≡ **略去**——工具层与缺省同分支（取本会话 sessionId 供值），核内取值链对 `null` / 缺键同判（`??` 形，零改）；「可空字段 `null` ≡ 略去」（§3.2）在本字段上无破例。

1. **进入活跃态**（两枚入边：`待讨论 → 待设计`——**批点火边**；`待设计 → 在途`——实施入边）：`executor = patch.executor ?? sessionId ?? 行现值 ?? NULL`。
   - **点火即落归属**（2026-10-07 批 ledger-tool 扩面）：实操点火 = 推「待设计」（批全程行在「待设计」上过——「在途」步常至收口走账才落）⇒ 只保 `待设计 → 在途` 单边时在飞行 executor 恒 `null`；扩至点火边后在飞行行即携本会话归属。因由与边界 = §13.3。
   - `sessionId` = 调用会话，**函数参数注入**——`ledgerUpdate({ …, executorSessionId })`；工具层由 `ledger`（update）execute **动态 import** `getSessionId()`（`session-slots.mjs`——形如 `{pid}-{ts}-{rand}`）供值（决策 K-LX1：纯函数可测 + 零新静态边）。
   - `patch.executor` = `ledger`（update）参数面新增可选字段（接手改写归属入口——见 5）。
   - **行现值兜底**：`已废弃 → 在途` 重启保留原属主（无新实施迹象时归属不漂——非空即留）。
2. **离开「在途」**（`在途 → 待核销` / `在途 → 已废弃`——迁移表仅此两出边；六态**无回退边**，AC-M2-7「回退清除」子句无表内路径承载 ⇒ 语义由出边清除覆盖）：**无条件置 NULL**——patch 显式传 `executor` 也不复活（出边自动语义压 patch）。
3. **其余情形**（无状态迁移的纯字段更新 / 活跃态出入门之外的迁移——如 `待核销 → 已核销`）：executor 按普通补丁字段语义 `patch.executor ?? 行现值`——既有调用（不带 executor）行为零变。
4. **`ledgerClose` 撤回路径**（任意态 → 已废弃——含在途直撤）：UPDATE 同步 `executor = NULL`；核销路径**两源同式零触碰**——勾销（待核销 → 已核销：executor 已在离场迁移清空）与**追认（待讨论 / 待设计 → 已核销：非在途出边，不属 §3.1 ② 自动清空射程）**；`ledgerAdd` 零变。
5. **接手 = 软语义**（executor 信息性非锁——D-MI6 精神）：任何实例经既有 `ledger`（update）改写归属（`executor` 字段或整段状态循环重走）；不设迁移门、不设机械锁。**禁**（父侧必答②裁定）：自动接手 / 自动清 executor / 每回合心跳写共享 SQLite（多进程写竞争 + 绕用户 gate）。

### 3.2 工具层参数守卫（2026-09-27 快车道修复 · Gitee #IKIQGK / 台账 #472）

**背景（本节因何而立）**：写命令三 action（add / update / close——统一入口 `ledger`）的模型入参此前无运行时校验——`parameters` 的 required / enum **只宣告不强制**（providers don't enforce；同款注记先例 = `thincoder-core/agent-tools/subagent-actions.mjs:358`「多 action schema 的 required 只是建议」）。

漏参 / 错型若无运行时守卫则直落 SQLite 绑定或 CHECK（复现实读）：`kind` 缺失 ⇒ `Provided value cannot be bound to SQLite parameter 1.`（无中文、无字段名——issue 原报）。
枚举外值与数组形同族：`kind` 非枚举 ⇒ `CHECK constraint failed: kind IN ('requirement','tech_todo')`（外泄 DDL 原文）；数组形 ⇒ `Unknown named parameter '0'`。

**判据句**：工具层**统一入口 `ledger`**（五 action：写三 = add / update / close ∥ 读二 = query / count；前身 = 五工具——2026-09-28 扩面）的**运行时入参**在进入核函数**之前**，按**对应 action 声明**（逐字承自前身工具 `parameters`：`required` / `properties[*].type` / `properties[*].enum`——§11.3 伪工具对象形）机械校验——非法 ⇒ **拒**（throw；零写、零库动作），文案 = 中文 · 点名字段 + 取值域；
**零 SQLite 原文外泄**（守卫 + 写门判于绑定 / 库动作之前 ⇒ 工具路径下绑定类 / 咬合类原文不可达——缺指针（`null`）/ 空串 `task_book` 经写门拒，其余非法形经 P1–P6 拒；咬合 CHECK = 库级最后防线）。

**统一入口收正（2026-10-05 批 · 收正点）**：适用面重述「五工具 → 统一入口五 action」；判据本体（P1–P6 ∥ 字段判据表 ∥ 声明派生）**零改**；**文案前缀渲染规则 = §11.3**（动作级 `ledger(<action>)：` ∥ 入口级 `ledger：`）——本表已按新渲染收正；**入参形态 = 已消费 `action` 的余键**（统一入口判序② 消费——`action` 不入 P2 域；§11.3）。

**落点**：`thincoder-core/ledger-tools.mjs`（已落——工具定义 + 守卫 helper 的拆分落点；读数 = §11.8）统一入口 `execute` 顶端（守卫 = 工具档单点 helper——`assertToolArgs(tool, args)` **返回**入参对象；消费形 = action 分派后逐 action 以伪工具对象调用 `assertToolArgs(<伪工具>, <余键>)`（已消费 `action`——§11.3）——helper 机制沿用；「零改」面破例 = #1006 批增布尔分支（§13.9））；
  判序 = **参数守卫 →（核内）迁移表判 → 写门 → UPDATE**（§3.1 / §6.1 各自判序零变，守卫先于其全部）。

- 理由：① 原始 args（含未知键）只在工具层存在——未知键闭合无法在核函数表达（`row` 已拆解）；② 拒因文案面向**模型**（修向指引），核函数既有文案面向直调面；③ 核函数（`ledgerAdd` / `ledgerUpdate` / `ledgerClose`）函数体零改（「零改」面破例 = #1006 批——值计算落核内，与守卫面无关，§13.9）。
- 落选（被拒方案）：核函数层守卫（照 §6.1 写门同层落）——写门守**数据不变量**（任意调用面须守），参数守卫守**模型调用契约**（只在工具边界成立）；且未知键判无法下沉。

**机制（声明派生——单源）**：守卫消费工具对象自身的 `parameters`——枚举 / 必填 / 类型**不在守卫内复写**（D2：声明即校验，声明改动自动随守卫走）。派生所需两处声明收正（同批同档）：`ledger(update)` 的声明条目 `status` 属性**补 `enum`**（六态——原缺，description 已言明「六态之一」）；**五 action 声明条目** `parameters` 补 `additionalProperties: false`（闭合声明——与「未知键拒」同源宣告；读命令二具同拍——2026-09-28）。

**判序与判据**：① 入参缺省 / `null` ⇒ 视作 `{}`；非对象（数组 / 标量）⇒ 拒（P1）。② 未知键 ⇒ 拒（P2——列未知键 + 可用参数集；统一入口面域 = 余键——`action` 已消费，§11.3）。③ 逐字段（**声明序**）：缺失 ⇒ 拒（P3）→ 类型（非枚举字段）/ 枚举（枚举字段，含错型值）⇒ 拒（P4 / P5）→ `title` 空串 / 全空白 ⇒ 拒（P6）。
**字段级 `null` 归属**：必填字段显式 `null` ⇒ 按「缺失」判（P3）；可空字段 `null` ⇒ 放行（`null` ≡ 略去——与 `patch.x ?? 行值` 既有语义同源）。守卫只判不改：零缺省填充、零类型转换、零文本改写（`title` 判空用 trim，落盘取原值）——返回值 = 入参对象（唯一归一 = 判序① 的缺省 / `null` ⇒ `{}`）。读命令二 action 无必填字段（P3 不触）；其拒面 = P1 / P2 / P4 / P5（过滤参数枚举外值——含数组 / 错型值 · `board` / `cwd` 非串 · 未知键 · 入参非对象）。

**文案模板（逐字；前缀 = 工具名`：`——统一入口渲染 = §11.3（动作级 `ledger(<action>)：` ∥ 入口级 `ledger：`）；`<预览>` = `JSON.stringify(值)`，超 80 字符截断加 `…`）**：

| # | 条件 | 文案 |
|---|---|---|
| P1 | 入参非对象 | `<工具>：参数须为对象（收到 <预览>）` |
| P2 | 未知键 | `<工具>：未知参数：<键1> / <键2>（可用参数 = <可用1> / <可用2> / …）` |
| P3 | 必填缺失 | `<工具>：<字段> 缺失（必填<；取值 ∈ {…}>）`——枚举字段带取值域，非枚举必填串带「；非空字符串」，非枚举数字字段仅「必填」 |
| P4 | 类型不符（非枚举字段） | `<工具>：<字段> 非法：<预览>（应为字符串）` / `（应为数字）` / `（应为布尔）` |
| P5 | 枚举不符（含错型值） | `<工具>：<字段> 非法：<预览>（取值 ∈ {…}）` |
| P6 | `title` 空串 / 全空白（两 action 同拒——add 必填面 / update 字段级） | `<工具>：<字段> 为空（必填；非空字符串）`；`ledger(update)` 形 = `<工具>：title 为空（非空字符串）`（字段可空、值不可空） |

**字段判据表**（域 = 各 action 声明面取值；`<v>` = 实际值预览；写三 action 的 `cwd` 均为「可空 · 串」⇒ `<工具>：cwd 非法：<v>（应为字符串）`；文案列 = 统一入口渲染形——前缀规则 = §11.3）：

| 工具 | 字段 | 判据 | 失败文案（逐字） |
|---|---|---|---|
| `ledger(add)` | `kind` | 必填 · ∈ {requirement, tech_todo} | `ledger(add)：kind 缺失（必填；取值 ∈ {requirement, tech_todo}）` · `ledger(add)：kind 非法：<v>（取值 ∈ {requirement, tech_todo}）` |
| `ledger(add)` | `title` | 必填 · 非空串 | `ledger(add)：title 缺失（必填；非空字符串）` · `ledger(add)：title 为空（必填；非空字符串）` · `ledger(add)：title 非法：<v>（应为字符串）` |
| `ledger(add)` | `board` / `req_doc` / `task_book` / `evidence` | 可空 · 串 | `ledger(add)：<字段> 非法：<v>（应为字符串）` |
| `ledger(add)` | `trigger` | 可空 · ∈ {归批, 条件, 认账不排期} | `ledger(add)：trigger 非法：<v>（取值 ∈ {归批, 条件, 认账不排期}）` |
| `ledger(update)` | `id` | 必填 · 数字 | `ledger(update)：id 缺失（必填）` · `ledger(update)：id 非法：<v>（应为数字）` |
| `ledger(update)` | `status` | 可空 · ∈ 六态 | `ledger(update)：status 非法：<v>（取值 ∈ {待讨论, 待设计, 在途, 待核销, 已核销, 已废弃}）` |
| `ledger(update)` | `title` | 可空 · 串（**值非空串**——空串 / 全空白 ⇒ 拒） | `ledger(update)：title 非法：<v>（应为字符串）` · `ledger(update)：title 为空（非空字符串）` |
| `ledger(update)` | `board` / `req_doc` / `task_book` / `evidence` / `executor` | 可空 · 串 | `ledger(update)：<字段> 非法：<v>（应为字符串）` |
| `ledger(update)` | `evidenceReplace` | 可空 · 布尔（`true` 须与 `evidence` 同传——旗独传 / 新值空白 ⇒ 核面拒〔§13.9〕；缺省 / `false` = 追加） | `ledger(update)：evidenceReplace 非法：<v>（应为布尔）` |
| `ledger(update)` | `trigger` | 可空 · ∈ {归批, 条件, 认账不排期} | `ledger(update)：trigger 非法：<v>（取值 ∈ {归批, 条件, 认账不排期}）` |
| `ledger(close)` | `id` | 必填 · 数字 | `ledger(close)：id 缺失（必填）` · `ledger(close)：id 非法：<v>（应为数字）` |
| `ledger(close)` | `status` | 必填 · ∈ {已核销, 已废弃} | `ledger(close)：status 缺失（必填；取值 ∈ {已核销, 已废弃}）` · `ledger(close)：status 非法：<v>（取值 ∈ {已核销, 已废弃}）` |
| `ledger(close)` | `evidence` | 可空 · 串（**值可空**——追认核销面由 `evidence` 门判**结果值**：缺 / 全空白 ⇒ 拒，文案逐字不变；传入 = 追加缺省——§13.9） | `ledger(close)：evidence 非法：<v>（应为字符串）` |
| `ledger(close)` | `evidenceReplace` | 同 `ledger(update)`（前缀换 `ledger(close)`——§13.9） | `ledger(close)：evidenceReplace 非法：<v>（应为布尔）` |
| `ledger(query)` | `status` | 可空 · ∈ 六态 | `ledger(query)：status 非法：<v>（取值 ∈ {待讨论, 待设计, 在途, 待核销, 已核销, 已废弃}）` |
| `ledger(query)` | `kind` | 可空 · ∈ {requirement, tech_todo} | `ledger(query)：kind 非法：<v>（取值 ∈ {requirement, tech_todo}）` |
| `ledger(query)` | `board` / `cwd` | 可空 · 串 | `ledger(query)：<字段> 非法：<v>（应为字符串）` |
| `ledger(query)` | `trigger` | 可空 · ∈ {归批, 条件, 认账不排期} | `ledger(query)：trigger 非法：<v>（取值 ∈ {归批, 条件, 认账不排期}）` |
| `ledger(count)` | `cwd` | 可空 · 串 | `ledger(count)：cwd 非法：<v>（应为字符串）` |

**新增拒面（本批生效——取舍理由随行）**：① 空串 / 全空白 `title` ⇒ 拒（台账条目无标题即无意义；**两 action 同拍**——`ledger(update)` 值面同拒，`title` 不适用空串清值语义）；② 未知键 ⇒ 拒（取舍：「不理会」= 打错键静默丢字段（半写 / 无写无感）比拒更危险——本仓 fail-closed 口径）；
③ 非数字 `id` ⇒ 拒（不静默按数值命中）；④ 非串 / 错型值 ⇒ 拒（原文案外泄面收口）；⑤ 入参 `null` / 非对象 ⇒ 拒（`null` 视作 `{}` ⇒ 走缺参文案）；⑥ `cwd` 非串 ⇒ 拒。
⑦ **读面过滤参数非法 ⇒ 拒**（不再静默空集——`status: 123` / `kind: "bogus"` 现值 = 空集、`status: []` = 绑定原文；取舍：空集与「库不在 = 空账」不可区分 = 虚假读数，fail-closed 可见为上）；⑧ `executor` 显式 `null` ≡ 略去（工具层同缺省分支取 sessionId——§3.1 `null` 口径句）。逐条对照（旧形 ⇒ 新形）与探针实读 = 批档 §2。

**可空串空串口径**：可空串字段的空串保留既有语义（`patch.x ?? 行值` 下 `""` 为唯一「清值」形——`null` 等同略去）；**例外 = `title` / `task_book` / `evidence`**：`title` 空串 / 全空白两 action 同拒（P6 字段级——无标题即无意义）；`task_book` 空串 / 全空白由 §6.1 写门承接（在途 / 待核销 ⇒ 拒）；`evidence` 传入 = 追加缺省、空白 ⇒ 拒——清值形退役（#1006 批 · §13.9）。

**受影响面（读数 as-of 2026-09-28；行数 = 现行 ⇒ 预期）**：

- ① 实现（本批拆分落地）：拆分后 = `thincoder-core/ledger-tools.mjs`（已落 · 实读 **187**——五工具定义 + 守卫 helper 三件 + tool 层 `getSessionId` 动态 import）+ `thincoder-core/ledger-cmd.mjs`（298 行 ⇒ 核心函数档 ≈140 行）+ `thincoder-core/ledger.mjs`（214 行 ⇒ re-export 面两源 ±2 行）。
  拆分触发 = `ledger-cmd.mjs` 298 行贴 300 顾问线，本批增量（读面守卫 ×2 + `additionalProperties` ×2）必越线 ⇒ 按既有登记「下一增量轮先审视拆分」落地。
- ② 用例 = 档 `thincoder-core/test/ledger-args-guard.test.mjs`（**已随 2026-09-28 测试树全清退场——档不在盘**；原读数 198 行 · as-of 2026-09-28——T37–T44；本批增量 = T43 / T44 ⇒ ≈240 行；照 `thincoder-core/test/ledger-close.test.mjs`（同样已随 09-28 全清退场；原 153 行）同规模形）。
- ③ 文档 = 本档 + 批档 §2。
- ④ 零改面 = `thincoder-core/ledger-db.mjs`（DDL）· `thincoder-core/agent/family-tools.mjs`（装配）· 需求档（`docs/core/requirements/ENGINEERING-MODE-V2-SPEC-LEDGER.md`：补行**已落**——AC-M2-15 + 变更记录 2026-09-27（父侧）；本批设计面零碰）。

**射程**：工具层统一入口 `ledger`（五 action：add / update / close / query / count；前身 = 五工具）。

## 4. 两池分组与计数

- **两池 = kind 枚举**：`requirement`（需求池）/ `tech_todo`（技术待办）——SQLite 行天然分组，替代 v1 md 的「## 组标题识别」。
- **计数单源 = `ledgerCount`**：`SELECT COUNT(*) WHERE status IN ('待讨论','待设计','在途','待核销')`——未决四态 = 「活条目」口径（`--summary` 收口行同口径）。v1 md 计数面（`scanGroups`/`summarizeLedger`）删除（AC-M2-3 grep 零命中）。
- **条目正文一行一条**（语义保留）：SQLite `title` 单行承载，多行细节进需求档 / 批次档（不展开任务细节铁律不变）。

## 5. 归档 / 触发 / 老化

| 面 | 契约（v2） |
|---|---|
| **归档** | **软删除**——`ledgerClose` 只 UPDATE `status`（已核销/已废弃）+ `closed_at`（撤回路径另置 `executor = NULL`——§3.1 ④），**不 DELETE 行**（物理行保留作外部记忆）；「已核销/已废弃」= 状态值（替代 v1「勾销后移入归档档」——md 移档语义随存储消亡；`docs/TODO-archive.md` 为历史档不再追加） |
| **触发字段** | `trigger` 三枚举 CHECK：`归批` / `条件` / `认账不排期`（合法选项，区别于遗忘）；`NULL` → 审计面「待处置」（不判红）；取值非三枚举 → INSERT 即拒（CHECK） |
| **老化报告（审计模式）** | 行龄源 = SQLite 时间戳（`created_at`/`updated_at` 距今 > `AGING_DAYS`=30 天）——**弃 git blame**（SQLite 路径无 md 行；时间戳更可靠）。「距上次编辑」语义变「距建档/更新」——两者都度量「挂账多久」，阈值边界略有偏移（行为变更已登记）。**查询面逐行标记 `aged`**（未决四态 ∧ >30 天——2026-10-07 批新增，见 §13.4） |
| **归属与落笔** | 写命令仅**主 agent** 装配（`family-tools.mjs` depthOnly 分支——子代理装配面不挂写命令，fail-closed）；台账档不入任何子代理 `files` |

**暂缓批的行状态（2026-09-29 · 批 batch-mechanics · 台账 #559）**：批档**暂缓**（口径 = `docs/core/design/BATCH-RECORD.md` §5.1 L8——批档侧机读位在 §1 状态行）**不改本库行状态**——挂靠行保持 `在途`（六态零扩 · 迁移表零改 · 写门零触）；暂缓动作的纪律面 = 行 `evidence` 补一行指针「暂缓 · 复核条件见批档 §1 状态行」（条件文本单源 = 批档 §1——本库不复制条件句）；复启 ∕ 核销照既有通道。

## 6. 机检面（v2 收编）

- **check-ledger 作废**：v1 的 md 机检（L1 指针可解析 / L2 计数 / L3 形态六判据）随存储消亡——台账一致性由 **SQLite CHECK（枚举+咬合）+ `ledgerCount`（计数单源）** 承担；旧脚本 `scripts/check-ledger*.mjs` 归 **M8 机检引擎**删除（架构 §2.2 M8「check-ledger 作废」，同批落地无悬空窗口）。
- **L4（本仓可解析）与形态合规 V4** = `design/LEDGER-SELF-CONTAINED.md`（跨仓登记面——正交保留）。

### 6.1 写门·指针存在性（`task_book` → 批次档；2026-09-18 新增 · 台账 #38）

**判据句**（架构 E1「咬合判据（两账）」后半幅 · `design/ENGINEERING-MODE-V2.md` §2.3）：`task_book` 指向的**批次档必须存在**。

**形态 = 写入时门（非扫描面）**：`thincoder-core/ledger-cmd.mjs` 两条写命令（`ledgerAdd` / `ledgerUpdate`）落盘前判**结果行**——`status ∈ {在途, 待核销}` ⇒ 判 `task_book`：`null`（缺指针）⇒ 拒（「必填」文案）；非 `null` ⇒ 解析其文件部分，**缺文件部分（`§2` / 空串 / 全空白）/ 非文件 ⇒ throw**（行不变；判位与迁移表拒同层）。

**落点裁定（2026-09-18 · 评审发现 #4）**：门所在模块 = `thincoder-core/ledger-cmd.mjs`——**`ledgerAdd` / `ledgerUpdate` 两函数体内**，与迁移表判**同函数同层**（判序 = 迁移表判 → 本门 → `UPDATE`）。
覆盖的写入口 = 工具 `ledger`（add / update 两 action——统一入口）；消费侧一律**动态 import 单源档 `thincoder-core/ledger.mjs`**（KD-M2-3——§7.1 的三写命令导出面 = 该档对 `ledger-cmd.mjs` 的 re-export，无第二实现）⇒ 门**不可绕过**。（`ledgerAdd` 的结果行恒为 `待讨论`——INSERT 硬编码 ⇒ 门在该入口当下恒不触发；两入口形态统一，为将来「add 带状态」留位。）

**口径（三条）**：

1. **文件部分 = 首个 `§` 之前的子串**（trim 后）。`§` 之后 = 节号 / 注记，**不参与存在性判定**（现盘 13 个取值含三形态——无后缀 · `…md§2` · `…md§1.5（括注）`——全按此口径通过）。
2. **解析基准 = `resolveProjectRoot(cwd) ?? resolve(cwd ?? ".")`**（**= 库键式的同一子表达式**——键式另加 `normalizeCwd` 一步，见 §2.1 键式单源；解析基准本身不归一）：`resolve(base, 文件部分)`；绝对路径按 Node `path.resolve` 语义原样取用。（父侧直改·可 revert · 承写门 fix 轮 O1 收正——原口径写「调用 `cwd`」在容器根形态与库键自相矛盾；2026-09-25 批改述「逐字同源」——键在子表达式外另有 `normalizeCwd`）。
   **#828 批补注**（2026-10-02）：歧义锚 ⇒ 上游 `openLedger` 先拒（本门该态不可达）；其余态两式同值——「同源」关系不变。
3. **缺指针 / 缺文件部分**：`task_book == null`（缺指针）⇒ 拒（「必填」文案）；`§2` / 空串 / 全空白（缺文件部分）⇒ 不可解析 ⇒ **拒**（fail-closed，同状态行解析先例）。
4. **声明源候选**（2026-10-02 · #832）：文件部分**首段 = 项目声明的公共仓目录名**（`index.publicRepos`）⇒ 于该声明根解析余段（值形 ∥ 解析单一定义 = `declaredPublicRoots`）——可核 ⇒ 通过；**未声明**的仓外形态照旧拒（fail-closed 零松）；声明根缺位 ⇒ 照旧拒（存在性要求——严）。判据 / 机制 = `DOC-DISCIPLINE.md` §4.2.2 ⑥ ∥ `LEDGER-SELF-CONTAINED.md` §4 L4③（声明源前缀形 = 记录面有界例外的机械面）。
5. **迁移旗同源**（2026-10-04 · #834 · 设计轮）：`ledger migrate` 的**写门风险旗**（`thincoder-core/ledger-migrate.mjs` `writeGateFlag`）与本节判据**同源**——共享解析单点 = `resolveDeclaredRef(base, 文件部分)`（`thincoder-core/declaration.mjs` 新导出：① 仓根解析 → ② 声明源前缀解析序）；
   **消费关系**：声明源段 **≤ 消费既有解析单一定义 `declaredPublicRoots`（口径 4）**——**不二写**（同源句 = `MEMORY.md` §6.15「三消费面共用（解析层），不得二写」）；**解析序**（同名多仓取声明序首者）单源 = `DOC-DISCIPLINE.md` §4.2.2（`MANIFEST.md` §2.2 同指）。
   同一 `task_book` 在写门与迁移旗**同判**——声明源前缀形（可核）⇒ 写门放行 ∧ 迁移旗零旗；未声明 ∥ 声明根缺位 ∥ 目标档缺 ⇒ 两处同拒 / 同旗。**既有拒绝面零改**（判据本体 = 口径 1–4 逐字）；实现 = 本批实施轮（待 #51 写域收口后派发）。

**射程** = **结果行状态**属 `{在途, 待核销}` 的写入；`待讨论 / 待设计` 行带任意 `task_book` 不判（判据句只管在途 / 待核销——逐字）。

**失败文案**（逐字；前缀 = **调用函数名**——工具 `ledger`（update）→ 函数 `ledgerUpdate`、`ledger`（add）→ `ledgerAdd`；与同函数既有两条文案（`ledgerUpdate：行 <id> 不存在` / `…不在允许迁移表`）同前缀）：
`ledgerUpdate：task_book 指向的档不存在：<原值>（解析 = <绝对路径>）` · `ledgerUpdate：task_book 不可解析（缺文件部分）：<原值>` · `ledgerUpdate：task_book 必填（在途 / 待核销 须携任务书指针）`（缺指针形——`null` 无原值）。

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
| `ledgerVariantNotice({ cwd, dir, locale, exists })`（**新增**） | 变体键库首跑检测提示（§12——命中 ⇒ 单行文案；无 ⇒ `null`；**进程内一次为限**）；导出档 = `thincoder-core/ledger-variant-notice.mjs`（拟新增——本批实施轮落盘） |
| `openLedger(cwd)` | → `DatabaseSync` 句柄 + `ensureSchema`（幂等建表） |
| `ledgerQuery({ cwd, status, kind, board, trigger, now })` | SELECT 行集（只读，全角色）——本批增：`trigger` 等值过滤（§13.2）· 行集逐行携计算字段 `aged`（§13.4）· `now` 注入缝（确定性用例面） |
| `ledgerCount({ cwd })` | `COUNT(*)` WHERE 未决四态（单源计数） |
| `ledgerAdd({ cwd, row })` | INSERT（写命令，主 agent） |
| `ledgerUpdate({ cwd, id, patch })` | UPDATE（写命令，主 agent——迁移表校验）；#1006 批：`patch.evidence` 传值 = 追加缺省、`patch.evidenceReplace` = 布尔覆盖旗（§13.9） |
| `ledgerClose({ cwd, id, status, evidence, evidenceReplace })` | UPDATE status + `closed_at`，事务包裹（写命令，主 agent）——核销两源 = 待核销（勾销）· 待讨论 / 待设计（追认核销 · `evidence` 必填 · 缺则拒）；在途不可跳；#998 增可选 `evidence` 参（一跳核销——追认门判结果值，§13.1）；#1006 批：`evidence` 传值 = 追加缺省、增 `evidenceReplace` 旗（§13.9） |
| `findProject(anchor)` | 向上（含自身）最近的**已注册台账**目录（用户目录键控库存在）→ `{root, ledger}` / `null` |
| `discoverFamily(anchor)` | `{current, projects}`——current = `findProject`（**歧义命中 ⇒ `null`**——按容器形落子目录族；§7.2 歧义根子例）；projects = current + 其同级含台账目录 |
| `formatMarker(scan)` | §7.3 逐字（**签名与键语义不变**——L1 标记本批零扩，§7.3.1；**范围限定**：单 scan 逐字模板——范围求和不在本函数，经 `scopeMarkerOf` 委托出文（§7.2）） |
| `scopeMarkerOf(scans, family)`（**新增**） | 标记范围归约（§7.2「标记范围」——L1 取值单源）：`{ marker, warn }` ∕ 空范围 `{ marker: null, warn: false }` |
| `formatDetailLine(scan)` | §7.3 逐字 + **判活尾段**（§7.3.1 三态文案；签名不变——`scan` 携新键） |
| `resolveExecutorStates(scans)`（**新增**） | 在途 executor 判活批量解析（§7.3.1）——`executors` / `deadExecutors` 键组装单源 |

### 7.2 口径契约

- **计数 / 老化 / 阈值 / 可动作**：见 `requirements/ENGINEERING-MODE-V2.md` §9（继承：原 MECHANISM §1.18——D2 本节不重述）。
- **明细行集** = `{current} ∪ {可动作项目}`（发现序：current 在前，其余按目录名升序）；同项去重。
- **标记范围（L1 · 2026-10-03 定形）**：`current` 在场 ⇒ 仅当前项目（命中但不可读 ⇒ 空范围——不掺兄弟）；否则 ⇒ 族内**已读**项目（不可读跳过——既有语义）；空范围 ⇒ `marker` = `null`（不落 `0·0`）；范围非空 ⇒ 两池**分列求和**（F1——不合并为一数）。三端消费：核拍面写 `state.ledger` · VSC item 直调 `scopeMarkerOf`（端零自算；在场判据 = `marker` 非空）· 桌面 `ev:ledger` `marker` 转发（端零重算）。
   - **范围推导**：`current` 在场 ⇒ 范围 = `scans` 中 `root` = `family.current.root` 的 scan（**容器根自身带台账** ⇒ `findProject` 含自身命中 ⇒ 归属 = 具体项目锚——只显其自身数，不合计其下项目）；`current` 缺席（容器根锚）⇒ 族 = `discoverFamily` 既有枚举面 `projects`（向上（含锚）最近「含台账子目录」层取其子目录——枚举算法零改）。
   - **歧义根子例（轻通道轮 · 2026-10-04）**：命中锚若 `projectRootView` `ambiguous`（如锚位存量键控库先于 #828 写门）⇒ **不充当台账项目**（键控库存在 ≠ 可作项目）——按容器根形落子目录族（消静默缺席）；T51 面（**可解析**项目命中但不可读 ⇒ `null`）不受触。
   - **两参对账**：`family` 判归属 ∥ `scans` 载体——范围 = 归属 ∩ 已读（「已读」= 在 `scans` 中：构建期不可读项目已跳过）；`current` 缺席 ⇒ 范围 = `scans` 全体。
   - **文本产出**：`marker` 文本 = 委托 `formatMarker` 逐字模板（求和值入参；`formatMarker` 仍居调用链——§7.1）。
- **标记范围批（#882）受影响面**：源/测试全清单（现行行数 × 增量——含批内单测件）= 批档 `docs/batches/2026-10-03-ledger-family-aggregate.md` §2.4；贴线判 = 本批有增量档全列 ≤300 顾问线（最高 241——`ledger.mjs`·实读）⇒ 零拆分义务。
- **行龄**：SQLite 时间戳距今（非 git / 无时间戳 → 标「年龄未知」照列、不判老化）。
- **性能**：SQLite `COUNT` / 索引查询替代 v1 的 git blame 全档扫描。

### 7.3 行文本逐字契约（三面同文——CLI / 对端 / 收口行同一 formatter）

| # | 形态 | 逐字模板 | 色 / 态 |
|---|---|---|---|
| L1 状态标记 | 单行 | `台账 <pool>·<tech>`（例 `台账 4·32`）——*pool* ∕ *tech* = **范围求和**（§7.2） | 范围内 `aged>0 ∨ deadExecutors>0` → 警示色；否则默认 |
| L2 明细行 | 每项目一行 | `台账 <名>：需求池 <pool> · 技术待办 <tech>（老化 <aged>）` +（阈值时）` — 可开批` +（判活尾段——§7.3.1） | 该项目 `actionable` → 警示色；否则 dim |

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
4. **异步形态**：`runLedgerScan` 变 **async**（await 判活解析）——读面不得同步 exec 占住事件循环（D-MI14）；端胶水调用点补 await（**CLI 单端**——VSC 径改直落 `scanFamily`，零核 surface 调用点）。

**三态文案（L2 尾段——`formatDetailLine` 追加，三面同文单源）**：

| 态 | 尾段 |
|---|---|
| `deadExecutors > 0` | `（属主已死 <n>，可接手）`——**dead 优先**（行动项压信息项） |
| 死 0 · inflight > 0 · 最长 staleDays ≥ 1 | `（执行中 <n> · 最长 <d> 天未动）`——陈旧在途标注（父侧必答②；行龄源 = 既有 `updated_at`，零新状态） |
| 死 0 · inflight > 0 · staleDays < 1 | `（执行中 <n>）` |
| inflight = 0 | 无段——**既有逐字断言零破** |

逐条目「属主 X · N 天未动」明细 = `executors[]` 元素（端 tooltip / 后续展示面按需渲染）；查询行 = `ledger`（query）行集自然携带 `executor` + `updated_at` 原始字段（SELECT * 纯增量——签名不破）。**工具行不做判活**（K-LX4：判活时点性强——工具行保数据保真，判活展示归格式化径）。

**L1 标记文本零扩**：`台账 <pool>·<tech>` 文本不变（§7.3 逐字契约锁定——范围口径 = §7.2）；执行中 / 死亡信息落 L2 尾段。**状态位**：`state.ledger.warn` = **范围内**任一项 `aged>0 ∨ deadExecutors>0`（死亡 = 行动级警示——端警示色同源取本值，端零重算；取值单源 = `scopeMarkerOf`，§7.1）。

**core scan 形状新增键**：`inflightExecutors`（`buildScan` 挂——**sync 零变**，K-LX2：三端既有 sync 直调面零破，判活独立 async 单源）/ `executors` · `deadExecutors`（`resolveExecutorStates` 挂载）——端胶水零成本透传。

**端接线**（双端零新探测——判活解析全在核）：

- CLI 胶水（`thincoder-cli/src/tui/ledger-surface.mjs`）**机制归核**——自实现 `runLedgerScan` 删除，动态 import 扩载 `@thincoder/core/ledger-surface.mjs`（CORE-UNIFICATION #174 机制单源方向；端壳静态链仍不达 node:sqlite——W8 契约②机检守）。
- VSC 端（`thincoder-vscode/src/extension/ledger-surface.mjs`）`scanFamily`（tooltip 径）同挂判活——tooltip 明细行与核 L2 同文。

### 7.4 挂载 / 7.5 对端挂载 / 7.6 收口行 / 7.7 关键决策 / 7.8 不变量

- CLI 挂载（状态槽 / 首扫不抢首帧 / 周期 `unref()` / 回合处理期间跳过本轮 / 空标记零注入 / headless 零改动）· 对端挂载（状态栏 item 无 command / tooltip）· 收口行（`--summary` 命令面 + 核销同步清单「台账可见面（收口行）」槽位）——**机制与 v1 全同**（数据源迁移发生在展示面内部），逐字契约与决策记录（K1–K7 / U1–U6）沿用本档 v1 文本，不重述。
- **不变量**：① 无台账 → 零输出零标记 ② 台账档只读（唯一写面 = 主 agent 写命令）③ 数字单源 ④ 不新增工具/命令/快捷键面；headless 零新增输出。

## 8. 验收标准（v2——回指 M2 规格 AC）

| # | 验收标准（可机判） | 回指 |
|---|---|---|
| AC-M2-1 | 表含六态 status CHECK + kind CHECK + trigger CHECK（读 `sqlite_master` / INSERT 非法值拒） | ②.1 |
| AC-M2-2 | 非法 `status` 写入 → 拒（CHECK）；`status=NULL` → 拒（NOT NULL 兜底） | ②.2 |
| AC-M2-3 | 计数 = `COUNT` 单源（grep `scanGroups`/`summarizeLedger` 零命中；`ledgerCount` = 未决四态） | ②.6 |
| AC-M2-4 | 写命令非主 agent 装配 → 拒（depth>0 装配面不挂写命令） | ②.4 |
| AC-M2-5 | `在途/待核销` 缺 `task_book` → 拒（咬合 CHECK = 库级防线；工具路径下写门先拒） | ②.2 |
| AC-M2-6 | `node:sqlite` Node 24 可用（无需 `--experimental-sqlite`——实测通过） | ②.1 |
| AC-M2-7 | 进入「在途」的迁移带 `executor` = 会话 `sessionId`（函数注入，patch 显式值优先——§3.1）；点火边（`待讨论 → 待设计`——2026-10-07 本批增 · §13.3）同式自动写；离开「在途」的迁移 `executor` = NULL（`ledgerUpdate` 两出边 + `ledgerClose` 撤回路径） | ②.8（F-LX1 · 2026-09-21）∥ 点火边 · 2026-10-07 本批（§13.3） |
| AC-M2-8 | `executor` 非空且属主进程已死 → 可见面显示「属主已死，可接手」；探测失败（unknown）→ 不显示死亡（保守——活 / 死 / unknown 三态对照，§7.3.1） | ②.8（F-LX1 · 2026-09-21 本批） |
| AC-M2-9 | 迁移表外状态迁移 → 拒（`ledgerUpdate` 待讨论→已核销拒；`ledgerClose` 目标/源态校验） | ②.2 |
| AC-M2-10 | `在途 / 待核销` 行缺 `task_book`（`null`）或文件部分**不可解析 / 不存在** → 拒（throw，行不变）；存在 ⇒ 通过（含 `§N` / `§N（括注）` 形态；**声明源前缀形**（#832）同判——可核 ⇒ 通过） | §6.1（架构 E1 后半幅 · 台账 #38；#832 扩） |
| AC-M2-11 | 库键归一：同项目盘符两拼写（`D:\x` / `d:\x`）⇒ `ledgerDbPath` 同库路径；盘符本大写输入键不变（CLI 现状键回归）；键式单源（`ledgerKey` 一处生成——**射程 = 台账键生成面**，该面 grep 无第二份 `sha1` 键式；他面哈希合法、不属本判据） | §2.1 |
| AC-M2-12 | 存量迁移三件套：`--dry-run` 零写报告（源 / 目标 / 行数 / 备份路径）；`--confirm` 先备份（拷贝 + 读回同计数）后单事务迁入（**12 数据列逐条保全**（等值比对列集不含 id——重发）· 事务内读回核验）；重跑幂等（0 新增 / 无待迁源）；源回收进 `ledger-trash`（不删） | §2.2 |
| AC-M2-13 | 审计面只读：逐库定性（目标 / 变体源 / 空库 / 不可归因（有行）/ 不可归因（读取失败）/ 不可读（坏档））+ 候选根集合归因；全目录文件集合 / 大小 / mtime 三不变 | §2.2 |
| AC-M2-14 | 收口两源：待讨论 / 待设计 → 已核销 **直通**（`evidence` 非空）；缺 `evidence` ⇒ 拒（行不变）；在途 → 已核销 ⇒ 拒（不可跳 待核销）；已核销 / 已废弃 现态 ⇒ 拒；撤回路径零改 | ②.2（2026-09-25 本批 · 用例 T33–T36） |
| AC-M2-15 | 工具层参数守卫：写命令三 action（add / update / close——统一入口 `ledger`）非法入参（非对象 / 未知键 / 缺必填（含显式 `null`）/ 错型 / 非枚举 / `title` 空串 / 全空白）⇒ 拒（throw，零写、零库动作）+ 文案逐字（§3.2 P1–P6——前缀面 §11.3）；合法形（含复杂文本 / 可空 `null` 字段 / `cwd` 缺省）零回归 | §3.2（2026-09-27 快车道修复 · Gitee #IKIQGK / 台账 #472；需求档补行已落——AC-M2-15 + 变更记录 2026-09-27（父侧）） |
| AC-M2-16 | 读命令守卫 + `executor` 空值口径（2026-09-28 · 台账 #473 / #474）：读命令二 action（query / count——统一入口 `ledger`）非法过滤参数（非对象 / 未知键 / 枚举外值（含数组 / 错型值）/ 错型）⇒ 拒（throw，零库动作）+ 文案逐字（§3.2 P1–P6）；合法形（缺省 / 可空 `null` / 过滤命中）零回归；`ledger(update)` 显式 `executor: null` 与略去同判（进「在途」自动写会话 sessionId——§3.1 优先级链） | §3.1 / §3.2（需求侧补行**已落**——AC-M2-15 射程注 + AC-M2-16 新增，2026-09-28（父侧）） |
| AC-M2-17 | **根解析面歧义拒**（2026-10-02 · #828）：歧义锚（≥2 候选——`projectRootView` `ambiguous` 态）⇒ `openLedger` 显式拒——**零写**（库档不建 / 不落行）+ 列候选（全列按名排序）+ 显式项目根指引；`ok` / `none` 两态零回归（none ⇒ `resolve(cwd ?? ".")` 兜底照旧）。断言 = 按族锚（「项目不可解析」——不逐字形） | §2.1（根解析面 · fix 轮） |
| AC-M2-18 | **标记 = 当前打开范围合计**（2026-10-03 · 需求 §13.3 第 1 条修订）：容器根锚（族 ≥1 已读项目）⇒ 标记 = 族内已读项目两池分列求和（`台账 <Σpool>·<Σtech>`）；具体项目锚 ⇒ 仅该项目自己（兄弟零掺——负向锁）；命中但不可读 ∥ 空范围 ⇒ `marker = null`（命中 = **可解析项目**）；`warn` 同范围聚合（范围内 `aged>0 ∨ deadExecutors>0`） | FR24（需求 §13.3 第 1 条「状态行极简标记」· 2026-10-03） |
| AC-M2-19 | **歧义锚不充当项目**（2026-10-04 轻通道轮——AC-M2-18 范围面子例）：命中锚 `projectRootView` `ambiguous`（如锚位存量键控库先于 #828 写门）⇒ 按容器根形落子目录族求和——键控库存在 ≠ 可作项目（消静默缺席）；T51 面（**可解析**项目命中但不可读 ⇒ `null`）不受触 | FR24（需求 §13.3 第 1 条「状态行极简标记」· 歧义根子例）——用例 = 登记态（K12 红绿对为载体；号码待定——T56 已占；随 `docs/batches/2026-10-03-ledger-family-aggregate.test.mjs` 下次触碰补） |

**用例表（摘）**：T1 入条目 → 新行 id 自增 · T2 状态迁移 → status 更新 + `updated_at` 刷新 · T3 勾销 → status 已核销 + `closed_at` 写入、行保留（软删除）· T4 未决四态计数（混入归档行）· T5 `trigger=NULL` 通过 · T6 非法 status 拒 · T7 在途缺 task_book 拒 · T8 非主 agent 写 → 命令不存在 · T9 status NULL 拒 · T10 迁移表外迁移拒（行不变）。

**用例表（续——写门·指针存在性）**：T11 `task_book` 三形态（无后缀 / `§2` / `§1.5（括注）`）指向在档 → 通过 · T12 指向不在册档 → 拒（文案 + 行不变）· T13 `task_book` 缺文件部分 → 拒 · T14 待讨论行带任意 `task_book` → 不判（射程 = 结果行状态）。

**用例表（续——执行者归属与判活展示，F-LX1 · 2026-09-21 本批；新档 `thincoder-core/test/ledger-executor.test.mjs`——**已随 2026-09-28 测试树全清退场（档不在盘）**；L2 文案断言双端 = `thincoder-cli/test/ledger-surface.test.mjs` / `thincoder-vscode/test/ledger.test.mjs`——**同随退场（档不在盘）**）**：

- T15 `待设计 → 在途` ⇒ 行 `executor` = 注入 sessionId（兜底链三态各一拍：缺省 / patch 显式 / 行现值兜底）。
- T16 `在途 → 待核销` / `在途 → 已废弃` ⇒ executor NULL（patch 显式传也不复活）。
- T17 `ledgerClose` 在途直撤 ⇒ executor NULL；勾销路径零触碰；纯字段更新不带 executor ⇒ 行值零变。
- T18 旧 DDL 建库 → 打开列补齐、行不损；二次打开幂等零副作用；并发 ALTER 撞「duplicate column」→ 复核列在吞。
- T19 三态对照（注入 `_setProcessProbeTestImpl`）：dead ⇒ L2 带「属主已死，可接手」/ alive + staleDays ≥ 1 ⇒「执行中 <n> · 最长 <d> 天未动」/ unknown（aliveSet null · cmdline 缺行）⇒ 不显死亡。
- T20 inflight 空 ⇒ `resolveExecutorStates` 零 exec 快返；同 pid 二次解析 TTL 内零 exec。

**用例表（续——库键归一与存量迁移，2026-09-25 批；新档 `thincoder-core/test/ledger-key-normalize.test.mjs` / `thincoder-core/test/ledger-migrate.test.mjs`——**已随 2026-09-28 测试树全清退场（档不在盘）**）**：

- T21 键归一：同项目两盘符拼写（含 `\` / `/` 混写、尾斜杠）⇒ `ledgerDbPath` 同路径；盘符本大写 ⇒ 键 = 原样 `sha1[:16]`（回归）。
- T22 级联守卫（§2.1 比较边界登记）：`findProject` 以两拼写 anchor ⇒ 命中同一库文件。
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

**用例表（续——收口两源，2026-09-25 本批；档 `thincoder-core/test/ledger-close.test.mjs`——**已随 2026-09-28 测试树全清退场（档不在盘）**；原读数 153 行 · as-of 2026-09-28）**：

- T33 正常：追认核销直通——待讨论 / 待设计（先行回写 `evidence`）⇒ 已核销 + `closed_at` 写入 + 行保留（软删除）。
- T34 错误：追认核销缺 `evidence`（空 / 全空白两拍）⇒ 拒（文案逐字 + 行不变）。
- T35 错误：在途 → 已核销 ⇒ 拒（文案逐字 + 行不变）；反证 = 在途 → 待核销 → 已核销 两步照旧成功（勾销链零破）。
- T36 边界：已核销 / 已废弃 现态 ⇒ 拒（明确报错）；未知 id ⇒ 拒（既有文案）；追认核销 `executor` 零触碰（哨兵）；待讨论 → 已废弃 照常（撤回零改回归）。

**用例表（续——工具层参数守卫，2026-09-27 快车道修复 / 2026-09-28 扩读面；档 `thincoder-core/test/ledger-args-guard.test.mjs`——**已随 2026-09-28 测试树全清退场（档不在盘）**；原读数 198 行 · as-of 2026-09-28；本批增量 = T43 / T44 ⇒ ≈240 行）**：

- T37 正常：三 action 合法形全链（`ledger(add)` → 复杂文本（`file:line` / 引号 / 反引号）逐字落盘 → `ledger(update)`（含迁「在途」带在档指针过写门）→ `ledger(close)`）；可空字段 `null` 通过；`cwd` 缺省径（ctx 供值）通过。
- T38 错误：`ledger(add)` 非法形逐条 ⇒ 文案逐字（P1–P6 全模板）：`{}` / 缺 `kind` / `kind: null`（显式 `null` ⇒ 按缺失判——P3）/ `kind` 非枚举（含数组形）/ `title` 缺 / 空 / 全空白 / 非串 / 可空字段非串 / `trigger` 非枚举 / 未知键（含判序用例——typo `knd` ⇒ 未知键文案先于缺参）/ 入参 `null`（视作 `{}` ⇒ 缺参文案）/ 入参数组（P1）+ 行集不变。
- T39 错误：`ledger(update)` 非法形逐条（`id` 缺 / `id: null`（同判）/ `id` 非数字（含 `"1"`）/ `status` 非六态 / patch 字段非串 / `title` 空串 / 全空白（P6 字段级）/ 未知键）⇒ 文案逐字 + 行不变。
- T40 错误：`ledger(close)` 非法形逐条（`id` 缺 / 非数字 / `status` 缺 / `status` 非 {已核销, 已废弃}）⇒ 文案逐字 + 行不变。
- T41 边界：拒 ⇒ 零库动作（台账目录 / 库档不建）；空串 `task_book` 迁「在途」⇒ 写门拒（既有「不可解析（缺文件部分）」文案）+ 行不变。
- T42 错误：缺指针形——`待设计` 行（`task_book` = `null` 常态）迁「在途」⇒ 写门拒（「必填」文案逐字）+ 行不变（仍 待设计）+ 零 SQLite 原文（中文文案断言）。
- T43 错误：读命令守卫——`ledger(query)` 非法形逐条（`status: 123` / `status: []` / `kind: "bogus"` / `board: 9` / `cwd: 3` / 未知键 / 入参非对象）⇒ 拒（文案逐字 · 零库动作）；`ledger(count)` 同判；合法形（缺省 / 显式 `null` / 合法过滤命中 = 直调核函数等值）零回归。
- T44 边界：`ledger(update)` 显式 `executor: null` ≡ 略去——`待设计 → 在途`（带在档 `task_book`）⇒ 行 `executor` = 本会话 sessionId（`getSessionId()`）；显式串仍优先；非迁移纯字段更新读数零变。

**用例表（续——根解析面（歧义拒），2026-10-02 批（#828）；实现面 = `thincoder-core/ledger-db.mjs` `openLedger`）**：
- T45 错误：歧义锚（tmp 夹具——双带档子目录）⇒ 缺省径拒（读 / 写五工具同门）——**零写**（台账目录 / 库档不建 / 不落行）+ 文案含候选全列（绝对路径——按名排序）；none 态夹具 ⇒ 兜底键零改（既有空读行为回归）。
- T46 边界：声明源前缀 `task_book`（#832——实现 = 本批实施轮）：项目声明 `docs-repo` ⇒ 其内 `x.md`（存在）⇒ 通过；未声明前缀 ⇒ 照旧拒；声明根缺位 ⇒ 拒。
- T55 迁移旗同源（#834——实现 = 本批实施轮）：声明源前缀 `task_book`（目标档在）⇒ 写门通过 ∧ `writeGateFlag` 零旗；未声明前缀 ∥ 声明根缺位 ∥ 目标档缺 ⇒ 两处同判（拒 ∥ 旗）；仓根形全谱 = 既有断言逐字零变（回归腿）。

**用例表（续——标记范围合计，2026-10-03 批（#882）；批内单测件 = `docs/batches/2026-10-03-ledger-family-aggregate.test.mjs`（在位 · 239 行 · as-of 2026-10-04）；夹具 = 临时台账目录注入（`_setLedgerDirForTest`）+ 双项目临时树）**：

- T47 正常：容器根锚（双项目夹具）⇒ `marker` = 两池分列求和（例 `台账 3·4`——两目数值可区分 ⇒ 求和可判）。
- T48 负向锁：具体项目锚（A 目录内）⇒ `marker` = A 自身数（B 的数零掺入）。
- T49 边界：容器根锚下恰一个项目 ⇒ `marker` = 该项目数（同径——零特判）。
- T50 降级：族内不可读项目跳过（余者照常求和）；全不可读 ⇒ `marker = null`（不落 `0·0`）。
- T51 边界：具体项目锚命中但不可读 ⇒ `marker = null`（兄弟零掺入——范围 = current 语义）。
- T52 现状零变：空族（无台账目录）⇒ `marker = null` + `warn = false`。
- T53 正常：`warn` 范围聚合——族内任一项 `aged>0` ⇒ 根锚 `warn = true`；族内项目 `deadExecutors>0`（判活桩注入——同 T19）⇒ 根锚 `warn = true`；无老化 ∥ 无死执行者的具体项目锚 ⇒ `warn = false`（负向锁）。
- T54 端面：桌面 `ledgerMarkerOf` 透传两形（`{ text, warn }` ∕ `null`）；VSC item 源面锁（`scopeMarkerOf` 消费 ∥ 端侧 `formatMarker(current)` 自算零残余）。

**用例表（续——台账工具统一入口，2026-10-05 批（#923）；批内件 = `docs/batches/2026-10-05-ledger-unification.test.mjs`（拟新增——本批实施轮落盘）；明细表 = §11.11）**：

- T77–T91：统一入口五 action 等价 ∥ 弃用壳 ∥ 守卫逐 action 文案（P3 / P5 + P2 / P4 / P6 补）∥ 未知 action ∥ action 缺失 ∥ 装配名集（号段首用未占用连续段 T77 起——旧 T1–T12 撞号已消）。

## 9. 边界（本档不做）

- 不做 manifest（M1，只互指咬合）；不做批次档（M3）；不做 checklist（M7 废除，语义由本模块六态承接）。
- 不做 `docs/TODO-archive.md` 项目归档档搬迁；不承载细节展开（条目一行一条）。
- 不新增台账展示面形态（`ledger-surface.mjs` ×3 保留——本批仅 CLI 胶水**机制归核**切 core `runLedgerScan`，渲染面零新增形态）；不造 SQLite 计数状态条。
- 不做 `check-ledger` 脚本迁移（归 M8 删除）。
- 不新增工具/命令/快捷键面；不监听文件系统；不做跨进程缓存 / 全工作区深扫 / 网络面。
- 不写实现代码（ledger.mjs = eng-coder 写域）；不写提示词实体。
- **同级枚举上限**（成本有界）：`MAX_SIBLING_SCAN`——目录项数超限 → 该层候选判空集，退化 current-only；current 缺 → 继续向上求候选。
- **判活四不做**（F-LX1 · 2026-09-21 本批）：不做写径探测（`ledgerUpdate` / `ledgerClose` 零判活——判活只落显示面）；不做逐行 exec（一次批量 + 5s TTL 缓存——§7.3.1 性能红线）；不做心跳写共享 SQLite / 自动接手 / 自动清 executor（多进程写竞争 + 绕用户 gate——父侧必答②裁定）；L1 标记文本零扩。
- **库键与迁移**（§2.1 / §2.2 · 2026-09-25 批）：不做 `realpath` / 符号链接解析；不做**非盘符段大小写折叠**（POSIX 大小写敏感——同 `MEMORY.md` §6.11 口径）；不做别名路径（subst / junction / 8.3）；不做跨项目全量迁移（逐项目锚定）；迁移不自动执行（需 `--confirm`）；存量残档不删除（只报告 + 回收建议）；不动其他用户态面（sessions / checkpoints / memory / `ledger-notify.json` 历史存量档——去重机制退役随深清，零读写）。
- **工具层参数守卫**（2026-09-27 快车道修复 · 2026-09-28 扩读面 · §3.2）：参数校验射程 = 工具层五入口（写命令三 + 读命令二）；守卫判于核函数之前 ⇒ 核函数体零新增校验（核面改动 = §6.1 写门缺指针 / 空串形——落 `assertTaskBookGate` helper）。
- **标记范围批（2026-10-03 · #882）不做**：不改明细行集口径（`当前 ∪ 可动作`——§7.2）；不改族发现 ∕ 同级枚举上限（枚举算法 ∥ 同级上限零改；**歧义命中排除** = 2026-10-04 轻通道轮加——§7.2）；不合并两池为单数（F1）；不改空值语义（`null` = 无标记——不落 `0·0`）。

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
- 2026-09-25（**批 ledger-governance · 设计轮** · eng-designer——承批档 `docs/batches/2026-09-25-ledger-governance.md` §1 · 台账 #332）：
  §3 补**收口两源**（追认核销：待讨论 / 待设计 → 已核销——`evidence` 必填 · 在途不可跳）+ 两条失败文案逐字；§3.1 ④ 收正为「核销路径两源同式零触碰」；§7.1 `ledgerClose` 行 + §8 AC-M2-14 + 用例表 T33–T36（新档 `thincoder-core/test/ledger-close.test.mjs`（拟新增））。
- 2026-09-25（**批 ledger-governance · 评审修正轮 1（发现 #3）** · eng-designer——承批档 `docs/batches/2026-09-25-ledger-governance.md` §3 轮次 1）：§5 归档行与 §3.1 ④ 对齐——补注「（撤回路径另置 `executor = NULL`——§3.1 ④）」（补注形——保「只 UPDATE」主体句不动）；**语义零改**（同档内部张力收口）。
- 2026-09-27（**快车道修复 · Gitee #IKIQGK / 台账 #472** · eng-designer——批档 `docs/batches/2026-09-27-ledger-add-guard.md`）：新增 **§3.2 工具层参数守卫**（声明派生机制 + 判序 + 文案模板 P1–P6 + 字段判据表 + 新增拒面登记 + 受影响面 + 开放项）；§6.1 口径 ③ 补**空串形**（在途 / 待核销 + 空串 `task_book` 落 DDL CHECK 原文的收正——探针实读）；
  §8 增 **AC-M2-15** 与用例表 T37–T41；§9 增守卫射程边界行。
- 2026-09-27（**快车道修复 · 设计评审轮 1 修正** · eng-designer——承批档 `docs/batches/2026-09-27-ledger-add-guard.md` §3 轮次 1 发现 1–6 父侧裁定）：§6.1 写门**补缺指针形**（`task_book == null` ⇒ 拒——「必填」文案；空串形同拍）+ 失败文案第三条；
  §3.2 判据句可达性收正（绑定类 / 咬合类原文在工具路径下不可达——经写门 / P1–P6 拒；咬合 CHECK = 库级最后防线）· `title` 空串 / 全空白扩为**字段级两工具同拒**（P6）· 判序③补字段级 `null` 归属 · 落点补消费形（`execute` 首句 `args = assertToolArgs(Tool, args)`）；
  §8 AC-M2-10 / AC-M2-15 行随动 + 用例 T42（T38 / T39 补 `null` / `title` 拍）；§9 核面改动行随动；需求档补行已落（父侧）——本档零碰。
- 2026-09-28（**守卫族微修批 · 设计轮** · eng-designer——承 `docs/batches/2026-09-28-guard-face-micro.md` §1 · 台账 #473 / #474）：§3.2 守卫扩读面（判据句改五工具 · 落点改拆分后工具档 · 字段判据表增 `ledger_query` / `ledger_count` 行 · 新增拒面⑦⑧ · 受影响面① 拆分落地 · 射程改五入口 · 开放项句落定）；§3.1 增 `null` 口径句；§8 增 AC-M2-16；用例表增 T43 / T44 + 档名在位于标记收正；§9 边界行随动。
- 2026-09-28（**守卫族微修批 · 设计评审轮 1 修正** · eng-designer——fix 轮；承 `docs/batches/2026-09-28-guard-face-micro.md` §3 轮次 1 发现 1 / 3 / 4 / 5 / 7 / 10）：
  §3.1 优先级句收口为两分句（进边 / 出边——去「统一」歧义）；§3.2 受影响面收正（`ledger.mjs` 移出零改面 · 用例档单一读数「在位 · 198 行 ⇒ 本批 ≈240 行」· 状态标记一式「待建 / 在位 + as-of」）；§8 删重编号溯源注四处 · AC-M2-16 回指补「需求侧补行已落」· 用例表档注随动。零新语义。
- 2026-09-29（**批 batch-mechanics · 设计轮 · eng-designer**——承 `docs/batches/2026-09-29-batch-mechanics.md` §1 · 台账 #559）：§5 增**暂缓批的行状态**句——暂缓不改行状态（行保持 `在途`）+ `evidence` 指针行（条件文本单源 = 批档 §1）。**零机制语义**（六态 ∕ 迁移表 ∕ 写门零改）。
- 2026-09-29（**residuals-round2 批 · 文档面实施轮 · eng-designer**——承批档 `docs/batches/2026-09-29-residuals-round2.md` §2 #585）：§2.1 归一步 ∕ 级联面句收正——`notifyKey` 盘符步 = `normalizeCwd` 直调、分隔符折叠自持（内联盘符归一退役）。**零新语义**（输出逐字节不变）。
- 2026-10-02（**会话锚解析修复批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-02-manifest-resolution-fix.md` §1 · 台账 #828）：§2.1 增「根解析面（歧义拒）」条——歧义锚不产键 / `openLedger` 显式拒（列候选）；§6.1 口径 2 补注（歧义 ⇒ 上游先拒，同源关系不变）。**键式本体零改**（实现 = 本批实施轮）。
- 2026-10-02（**会话锚解析修复批 · fix 轮（评审轮次 1 发现 1–8 · 父侧 8/8 采纳）· eng-designer**——承批档 `docs/batches/2026-10-02-manifest-resolution-fix.md` §3）：§8 增 **AC-M2-17**（根解析面歧义拒——零写 + 列候选；断言 = 按族锚「项目不可解析」）+ 用例 **T45**；§2.1 指针行补指 AC-M2-17。**键式 / 写门语义零改**（拒绝面 = `openLedger` 上游——实现 = 本批实施轮）。

- 2026-10-02（**公共仓读取批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-02-public-repo-read.md` §2 · 台账 #832）：§6.1 口径增**第 4 条 声明源候选**（文件部分首段 = 声明公共仓目录名 ⇒ 于该声明根解析——可核通过；未声明 ∥ 缺位照旧拒）+ §8 **AC-M2-10** 补声明源同判句 + 用例表增 **T46**。**既有拒绝面零改**；实现 = 本批实施轮。
- 2026-10-03（**ledger-family-aggregate 批 · 设计轮 · eng-designer**——承 `docs/batches/2026-10-03-ledger-family-aggregate.md` §1 · 台账 #882）：§7.1 增导出 `scopeMarkerOf(scans, family)`；§7.2 增「标记范围」条（L1 = 当前打开范围合计——具体项目 ∕ 容器根族合计）；§7.3 L1 行 ∥ §7.3.1 状态位句随动；§8 增 AC-M2-18 + 用例表 T47–T54；§9 增边界行。**实现 = 本批实施轮**（VSC item 面随动一处；CLI ∕ 桌面零改——纯透传）。
- 2026-10-03（**ledger-family-aggregate 批 · 设计评审轮 1 修正** · eng-designer——fix 轮；承批档 `docs/batches/2026-10-03-ledger-family-aggregate.md` §3 轮次 1 发现 1–3 ∥ 5–7（发现 4 ∥ 8 = 需求档笔——父侧已办））：§7.2 标记范围条补**范围推导 ∥ 两参对账 ∥ 容器根自身带台账归属**明文 + `marker` 文本**委托 `formatMarker` 逐字模板**句 + 受影响面指针（表住批档 §2.4；零贴线 ⇒ 零拆分）；§7.1 `formatMarker` 行补**范围限定括注**；§8 AC-M2-18 回指改可解析形态（需求 §13.3 第 1 条「状态行极简标记」）· T53 补死执行者腿 · T54「三态」改「两形」。**语义零改**（归约语义 ∥ 判据本体 ∥ 用例断言对象零动）。
- 2026-10-04（**issue 修复批·五 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-04-issue-fix-round5.md` §1 · 台账 #834）：§6.1 增**口径 5（迁移旗同源）**——共享解析单点 `resolveDeclaredRef`（`thincoder-core/declaration.mjs` 新导出）；§8 增用例 **T55**。**既有拒绝面零改**；实现 = 本批实施轮（待 #51 写域收口后派发）。
- 2026-10-04（**issue 修复批·五 · fix 轮（评审 #70 发现 3 ∥ 8 · 父侧全采纳）· eng-designer**——承批档 `docs/batches/2026-10-04-issue-fix-round5.md` §3 轮次 1）：§6.1 口径 5 补**消费关系**（声明源段 ≤ 消费 `declaredPublicRoots`——不二写）+ **解析序回指单源**（`DOC-DISCIPLINE.md` §4.2.2）；§8 用例改号 **T47 ⇒ T55**（消 #882 批 T47–T54 撞号）。**原判据零改**（单源关系明写 ∥ 编号收正）。
- 2026-10-04（**轻通道轮 · 收尾形式化 · eng-designer**——承批档 `docs/batches/2026-10-04-light-ledger-ghost-root.md` §1 · 台账 #899）：§7.2「标记范围」条补**歧义根子例**（歧义命中不充当台账项目——键控库存在 ≠ 可作项目；按容器根形落子目录族；T51 面不受触）+ §8 增 **AC-M2-19** · AC-M2-18 补「命中 = 可解析项目」限定；§7.1 `discoverFamily` 行 ∥ §9 边界句 ∥ §8 用例表件标记（拟新增 ⇒ 在位 · 239 行）随动。**语义 = 已落修复的形式化**（实现 = `thincoder-core/ledger.mjs:21` ∥ `:96-102`；红绿对 ∥ 走查读数 = 批档 §1）；需求档零改。
- 2026-10-04（**流尾台账行组退役批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-04-stream-ledger-lines-retire.md` §2 · 台账 #913）：**变化行面（L3 ∥ L4）∥ 送达门 ∥ 去重档（`notifyKey` ∥ `loadNotifyState` ∥ `saveNotifyState` ∥ `NOTIFY_FILE` ∥ `planChangeLines` 族）随三端行推线面退役——零残留深清**：§7.1 导出表删一行 ∥ §7.2 删「条目键派生 ∥ 变化检测 / 送达门 / 去重档 schema」两条 ∥ §7.3 删 L3 ∥ L4 ∥ §7.3.1 端接线两行随正（CLI 去 `colors` 注 ∥ VSC 端自持 tooltip 径）∥ §7.4 挂载句收正 ∥ §7.8 不变量（去「变化行送达门」·「唯一写面」句收）∥ §2.1 归一链 ∥ T22 行随正；§1 范围句随动。**保留面** = L1 ∥ L2 ∥ 状态位 ∥ 标记范围（§7.2）。明细 = 批档 §2。
- 2026-10-04（**流尾台账行组退役批 · 修正轮（评审 #40 · 父裁 = 全采纳）· eng-designer**——承批档 `docs/batches/2026-10-04-stream-ledger-lines-retire.md` §3 轮次 1 · 台账 #913）：§2.2 ∥ §9 两名「`ledger-notify.json` 存量」按**历史存量档**措辞收正（零读写）∥ §9 #882 不做 bullet 涉改（设计轮已落）随本行补载 ∥ §7.3.1 await 句收 **CLI 单端**（VSC 径改直落 `scanFamily`）。**零新语义**。明细 = 批档 §2 修正块。
- 2026-10-05（**批 ledger-tool-unification · 设计轮 + 修正轮（七组收正）· eng-designer**——承批档 `docs/batches/2026-10-05-ledger-unification.md` §1 · 台账 #923）：新增 **§11 台账工具统一入口**（五散开工具 → 单入口 `ledger`——装配面终值 ∥ 守卫按 action 适配 ∥ 弃用壳 ∥ tool-docs 处置与计数随动 ∥ 测试面 ∥ 文档面清单）；修正轮收正 §11 七组 + 机检面闭合（唯一路径形 + 拟新增标注）+ §3.2 / §8 名称面（`ledger(<action>)：` 前缀渲染）+ §3 / §3.1 / §6.1 / §7.3.1 轻收正。**实现 = 本批实施轮**。明细 = 批档 §2 修正块。
- 2026-10-05（**批 ledger-tool-unification · 修正轮（评审轮次 1 发现 1–10 · 父裁 = 全采纳）· eng-designer**——承批档 `docs/batches/2026-10-05-ledger-unification.md` §3 轮次 1）：§11.3 钉守卫入参形态（已消费 `action` 的余键——§3.2 / §11.11 三处同文）+ §11.10 KD-unif-8；§11.8 增量收敛（`ledger-tools.mjs` +≈75 ⇒ 估 ≈265）+ 读数收正（common.md 170 ∥ persona-engineering.md 195）+ 计数簇（需求侧 PROMPT-SYSTEM 补入 ∥ design 侧 `:23` 补列）+ API-CONTRACT 行入表；§11.11 用例改号 T1–T12 ⇒ T77–T88 + 增 T89–T91（P2 / P4 / P6——首用未占用连续段）+ §8 登记映射；§8 两处在树引用补退役标记。**判据本体零改**；明细 = 批档 §2 修正块。
- 2026-10-05（**批 ledger-tool-unification · 实施中裁定（评审轮次 2 后）· eng-designer**——承批档 `docs/batches/2026-10-05-ledger-unification.md` §2 修正块（实施舱 #29 上报 → 父侧 01:2x 裁定）：§11.2 补**只读分类**句（全量变体 `readonly: false` + `isReadonlyAction`（`action ∈ {query, count}` ⇒ true）∥ 只读变体 `readonly: true`）+ **残留两条**登记（钩子覆盖不到的工具级 `readonly` 消费点——不改他档无法消）；§11.10 增 KD-unif-9。**零其他语义**；明细 = 批档 §2 修正块。
- 2026-10-05（**批 ledger-tool-unification · 实施后同步（微轮）· eng-designer**——承批档 `docs/batches/2026-10-05-ledger-unification.md` §5（#29 产品面 · #30 随动面）+ 父侧核验读数（api-contract 2878 条 · doc-check 悬空 0 · 批内件 18/18）：§11.2 两处收正——re-export 面补 `ledgerReadTool` 第二名（实读 `thincoder-core/ledger.mjs:191`）∥ 残留条口径改「行为影响面两条 + 同判据两处零影响」（四行号俱列；末句改「实施轮登记 = 批档 §5（#29）」）；§11.8 自指行读数收正（702 ⇒ 710——末行号法）。**零其他语义**；明细 = 批档 §2 微块。
- 2026-10-05（**批 ledger-variant-db-notice · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-05-ledger-variant-db-notice.md` §1 · 需求 §②.10 F-LX3 / 台账 #935）：新增 **§12 变体键库首跑检测提示**（检测判据 = 文件存在 · 提示面 = TUI 启动 opts 承载一行 · 核内一次为限 · 全径静默；用例 U-VN1–U-VN6 / 验收 A-VN1–A-VN6——批内编号，§8 不增行）+ §7.1 导出行 + §2.2 指针行。**实现 = 本批实施轮**；编号撞车上抛 = 批档 §2。明细 = 批档 §2。
- 2026-10-05（**批 ledger-variant-db-notice · 设计评审轮 1 修正（评审 #3 发现 1–4 · 父裁逐号落修）· eng-designer**——承批档 `docs/batches/2026-10-05-ledger-variant-db-notice.md` §3 轮次 1）：§12 全节 AC 引用改终值 **AC-M2-20**（17/18/19 已占用——需求侧连避；§12.6 编号注记终局句）∥ §12.7 headless 面收口为单源结论（TUI 为限——机器消费面纪律 + §7.8 不变量「headless 零新增输出」同向）∥ §12.1 KD-VN1 理由① 括注收窄为与 §2.2 同读的分述（空库 ⇒ 迁移照回收；坏档 / `-wal` ⇒ confirm 面拒跑、audit 定性）∥ API-CONTRACT 判定 = 新档导出入生成区（实施轮重跑——批档 §2 修正块）。**判据本体 / 用例 / 验收内容零改**。明细 = 批档 §2 修正块。
- 2026-10-07（**批 ledger-tool · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-07-ledger-tool.md` §1 · 台账 #998）：新增 **§13 工具面改造批**（① `close` 携 evidence 一跳 ∥ ② `query` trigger 过滤 ∥ ③ executor 点火入边自动写 ∥ ④ 查询面 `aged` 逐行标记）+ §3.1 进边扩为两枚（点火边入列）∥ §3.2 字段判据表增 close.evidence / query.trigger 两行 ∥ §5 老化行补查询面标记指针；§13.5 含受影响文件 / §13.6 用例 U-LT* / 验收 A-LT* / §13.7 决策 / §13.8 边界。**实现 = 本批实施轮**；需求侧编号候补 = AC-M2-21…24（主 agent 笔）。

- 2026-10-07（**批 ledger-tool · 设计评审修正轮 1（发现 1–9）· eng-designer**——承批档 `docs/batches/2026-10-07-ledger-tool.md` §3 轮次 1）：§7.1 导出契约两行随 §13 收正（`trigger` / `now` / `evidence` / `aged`）；§8 AC-M2-7 补点火边；§11.3 查询行枚举补 `trigger` + 新增字段注（close / query 声明 = 前身逐字 + 增量——防实现按「逐字」复制致新参被 P2 判未知键拒）；§13.3 可见面口径句；§13.5 受影两件核验行（`ledger-unification` = 零改 ∥ `carryover-15` = 不编辑）+ `ledger-cmd` 行补 ③ + 批内件规模收一（≈200–260）。**机制 / 参数语义零改**（仅文档面收正）；发现 10 = 接受现形。

- 2026-10-07（**批 ledger-evidence-semantics · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-07-ledger-evidence-semantics.md` §1 · 台账 #1006）：新增 **§13.9 `evidence` 语义修正**（`update` ∥ `close` 传入 = 追加缺省——旧空直写 / 新值空白拒 / 「｜」零空格拼接 ∥ 布尔覆盖旗 `evidenceReplace: true` 同传——旗独传拒 ∥ close 追认门零变）+ §13.1 机制式随正（值计算 / 判序）∥ §3.2 判据表增 `evidenceReplace` 两行 + 可空串空串口径例外句增 `evidence` ∥ §7.1 两行随正；用例 U-LT11–U-LT18 / 验收 A-LT7 / KD-LT5。**实现 = 本批实施轮**；需求侧编号候补 = AC-M2-25（主 agent 笔）。

- 2026-10-07（**批 ledger-evidence-semantics · 设计评审修正轮 1（发现 1/2/3/4/6——受理落修；5 父侧笔 / 7 收口轮）· eng-designer**——承批档 `docs/batches/2026-10-07-ledger-evidence-semantics.md` §3 轮次 1）：判序收正（拒面① 明写判于值计算阶段、先于追认门——`:924` / `:930–932`；U-LT17 补行态注 `:967`）∥ §3.2 P4 模板行增第三型「（应为布尔）」+ 随动清单同拍（`:177` / `:944`）∥ §3.2 落点句（`:159`）与 §11.3 新参注（`:581`）改述「本批破例 + 新形态」（档头注 `thincoder-core/ledger-tools.mjs:8` = 实施轮落点）∥ `:986` 改述「已落（AC-M2-25 · 需求档 `:83`）」。**零新语义**（仅文档面收正）。明细 = 批档 §2 修轮更正块。

## 11. Ledger-tool unification（2026-10-05 · 批档 `docs/batches/2026-10-05-ledger-unification.md`）

**目标**：五散开工具 → 单入口 `ledger`（action = add / update / close / query / count），内部路由既有 `.cmd` 模块；**外部行为零变**（除错误消息前缀面——§11.3）。
**需求字面**（用户 00:22「合并成一个用操作分」）⇒ **模型面恰一名 `ledger`**（终值清单 = §11.1）；旧五名降为 code 面弃用壳、不入装配面（§11.4）。

### 11.1 装配面终值（[装配点 × 前 → 后]）

| 装配点 | 前（现行） | 后（终值） |
|---|---|---|
| `thincoder-core/tools/index.mjs`（`assembleBuiltinTools`——全角色基础集） | `ledger_query` · `ledger_count` 两条注册（动态 import 核 `thincoder-core/ledger.mjs`） | 两条移除——ledger 登记面整体迁家族段（§11.2） |
| `thincoder-core/agent/family-tools.mjs`（家族段——depth-0 段 + 各子代理角色段） | depth-0：`ledger_add` · `ledger_update` · `ledger_close` 三条注册 | depth-0：`ledger` **全量变体**一条（五 action）；depth>0（全部角色段——含 consult / 兜底）：`ledger` **只读变体**一条（action 仅 query / count） |
| `thincoder-vscode/src/agent/tool-table.mjs`（`buildToolTable` 基础集——端侧自持面） | `ledger_query` · `ledger_count` 两条（动态 import 核 `thincoder-core/ledger.mjs` 追加入 `baseTools`） | 两条移除——ledger 面随核家族段（装配取核；端侧自持项清零） |

**模型面工具名终值清单（可机检——恰一名 `ledger`）**：

- **depth-0 面**：`ledger`（action ∈ {add, update, close, query, count}）——写面全量；
- **depth>0 面**：`ledger`（action ∈ {query, count}）——写三 action **schema 级不可达**（AC-M2-4 语义保持：写命令不挂子代理装配面——机械不可达，不降为运行期门）；
- **旧五名**（`ledger_add` / `ledger_update` / `ledger_close` / `ledger_query` / `ledger_count`）**不入任何装配面**——仅 code 面弃用壳（§11.4）；
- **机械判据**：任一装配面名集含 `ledger` 恰一次 ∧ 与五旧名零交 ∧ 面内零重名（先例 = #70 registry 断言）。

### 11.2 统一入口对象与两变体

- `ledgerTool`（新导出，落 `thincoder-core/ledger-tools.mjs`）：`name: "ledger"`；description = `DESC("ledger")`（新档见 §11.5）；`parameters` = 并集 schema（`action` 枚举 + 五 action 参数并集）——per-action 必填由运行时守卫裁（§11.3）。
- **两变体**（先例 = `subagent` 工具 depth 面变体：同名单对象、schema 窄化、两形永不同装配）：全量（五 action）∥ 只读（二 action——`parameters.properties.action.enum` = {query, count}）。
- **只读分类（实施中裁定——2026-10-05）**：全量变体 `readonly: false` + 工具对象动作级谓词钩子 `isReadonlyAction(args)`（`action ∈ {query, count}` ⇒ true）；只读变体 `readonly: true`。
  依据 = 「外部行为零变」（旧 `ledger_query` / `ledger_count` = `readonly: true`——planMode 放行 ∥ 免审批；消费点 `thincoder-core/agent/dispatch.mjs:58` / `:156` 经 `readonlyActionOf`） + 仓内既定模式（工具面动作谓词钩子优先 ∕ 核名面谓词回落——先例 = `git` / `memory` / `subagent`；`thincoder-core/agent/dispatch-gates.mjs:121-123`；KD-unif-9）。
- **残留登记（钩子覆盖不到的工具级 `readonly` 消费点——不改他档无法消；如实登记，不扩面）**：行为影响面两条 + 同判据两处零影响（四行号俱列）：
  行为影响面——① Phase-2 读调用转串行（旧读二可批并行——`thincoder-core/agent/dispatch.mjs:244-245`）；② `record-results` verify 失效记账对读调用生效（`thincoder-core/agent/record-results.mjs:89`）；
  同判据零影响（已核）——③ 写前快照（ledger 入参无 `path`/`file` ⇒ `undo-stack.mjs` 即返——`thincoder-core/agent/dispatch-run.mjs:69`）；④ 只读子代由 depth>0 家族段重挂只读变体 ⇒ 能力等价（`thincoder-core/agent/helpers.mjs:369`）。实施轮登记 = 批档 §5（#29）。
- **execute 路由**：首判 `action` → 调本档既有静态导入（`:10`）的对应核函数（`ledgerAdd` / `ledgerUpdate` / `ledgerClose` / `ledgerQuery` / `ledgerCount`）——核函数与 `.cmd` 档**零改**；包装细节（`cwd` 缺省 `cwdOf(ctx)` · `JSON.stringify` 缩进 · `getSessionId()` 动态 import）携自原工具 execute **逐字保留**。
- **等价判据**：五 action 出参 = 原五工具路径逐字等价（批内件腿 1——§11.6）。
- **re-export 面**：`thincoder-core/ledger.mjs:191` 增 `ledgerTool` + `ledgerReadTool` 两名导出行（消费面 = §11.1 两装配点）。

### 11.3 守卫适配（action 判据表 + 文案前缀规则——[收正点]）

**并集 schema 的必填缺口**：单对象 `parameters` 不表达 per-action required（providers 不强制——§3.2 背景同款）；运行时按 action 裁。
**实现形（伪工具对象）**：每 action 一份声明条目 = 该 action 前身旧工具 `parameters` **逐字**；守卫消费形 = `assertToolArgs`（helper **零改**——本批破例 = #1006 批增布尔分支，§13.9）喂伪工具对象 `{ name: "ledger(<action>)", parameters: <该 action 声明> }` ⇒ 既有「前缀 = tool.name」机制直接产出 `ledger(<action>)：…`。
**入参形态（分派后——缝钉死）**：`action` 键在判序②**已消费**（`const { action, ...rest } = args` 形）——喂伪工具守卫 = **余键 `rest`**（`action` 键**不入 P2 域**；P2 未知键判域 = 余键集）。伪声明「前身逐字」零改——否决「伪声明并入单值 `action` 属性」（破声明源「逐字」不变量 ∥ 触 helper 语义面；KD-unif-8）。
**本批新增字段注（2026-10-07 · §13.1 / §13.2）**：`close` / `query` 两行声明 = 前身逐字 **+ 本批新增参**（`evidence` ∥ `trigger`——皆可选，必填列零变）——守卫面必随：缺注则实现按「逐字」复制前身声明，新参被 P2 判未知键拒（§3.2 P2）；#1006 批再增：`update` / `close` 两行各增 `evidenceReplace`（同式——§13.9）；余下 add / count 两行照旧逐字零变。
**判序**：① 入参归一（P1 同式）→ ② 入口级 `action` 判（P3 缺失 / P5 非法——消费 `action`）→ ③ 分派后以**已消费 `action` 的余键**喂该 action 伪工具对象走 P2–P6（§3.2 同文——P2 域 = 余键）。

**按 action 判据表**：

| action | 必填 | 枚举字段 | 声明源（逐字） |
|---|---|---|---|
| add | kind · title | kind · trigger | 前身 `ledger_add` 的 `parameters` |
| update | id | status · trigger | 前身 `ledger_update` 的 `parameters` |
| close | id · status | status | 前身 `ledger_close` 的 `parameters` |
| query | （无） | status · kind · trigger | 前身 `ledger_query` 的 `parameters` |
| count | （无） | （无） | 前身 `ledger_count` 的 `parameters` |

**文案前缀规则（逐字）**：入口级判据（入参非对象 / `action` 缺失 / `action` 非法）⇒ 前缀 `ledger：`；分派后动作级判据（P2–P6 全族）⇒ 前缀 `ledger(<action>)：`——例 `ledger(add)：kind 缺失（必填；取值 ∈ {requirement, tech_todo}）` · `ledger(query)：status 非法：<v>（取值 ∈ {…}）`；`action` 非法之取值域 = **该装配面** action 枚举（depth-0 五值 / depth>0 二值）。
**与 §3.2 / §8 的关系（收正点）**：判据本体（P1–P6 模板 ∥ 字段判据表 ∥ 声明派生机制）**零改**——单源仍在 §3.2；本批收正面 = ① §3.2 适用面重述「五工具 → 统一入口五 action」；② §3.2 表内文案前缀按上规则收正（同批已落）；③ §8 守卫相关 AC / 用例名称面随动（同批已落）。§6.1 写门失败文案前缀 = **调用函数名**（`ledgerUpdate：…`）——制度不同径，零改。

### 11.4 旧名弃用壳（code 面——不入装配）

| 壳 export | 对应 action | 行为 |
|---|---|---|
| `ledgerAddTool` | add | `execute` 抛弃用错误——文案含旧名 + `ledger`（action=add）指引 + 零库动作 |
| `ledgerUpdateTool` · `ledgerCloseTool` · `ledgerQueryTool` · `ledgerCountTool` | update · close · query · count | 同上（逐名对应） |

- 壳 `description` = **静态弃用行**（不经 `DESC`——旧五档退场后 DESC 加载必炸；`loadToolDoc` 缺档 throw 语义零改、壳面规避）。
- 弃用壳文案逐字 = 实施轮落定；判据 = 含旧名 ∧ 含 `ledger` ∧ 对应 action 指引 ∧ 零库动作（批内件腿 2 断言）。

### 11.5 tool-docs 处置（五档退场 + 新档 + 计数随动）

- `tool-docs/ledger_add.md` · `ledger_close.md` · `ledger_count.md` · `ledger_query.md` · `ledger_update.md` 五档**退场**（迁移期引文——本批实施轮删档；要点并入新档；壳 description 静态化见 §11.4 ⇒ DESC 加载面不触）。
- `thincoder-core/tool-docs/ledger.md`（拟新增——本批实施轮落盘）：五 action 统一描述（合并五档要点——两池词表等逐字保留）；`DESC("ledger")` 单解析面；**预算面**：单档 ≤ 五旧档合计（读数 as-of 2026-10-05 = 499 字符）——描述预算零恶化。
- **计数随动（52 ⇒ 48——D3；as-of 2026-10-05 实读）**：
  - 机检面 = `thincoder-vscode/scripts/check-vsix.mjs` `EXPECT["tool-docs"]`（档数注记同随）；
  - 文档计数簇 = `docs/core/design/CORE-UNIFICATION.md`（`:65` · `:80` · `:86` · `:96` · `:1011` · `:1016` · `:1018` · `:1039` · `:1061` · `:1556` · `:1557`）
    · `docs/core/design/PROMPT-SYSTEM.md`（`:21` · `:23` · `:164` · `:203` · `:312`）· `docs/core/design/TOOLS.md`（`:280`）
    · `docs/core/requirements/CORE-UNIFICATION.md`（`:19` · `:117`）· `docs/core/requirements/PROMPT-SYSTEM.md`（`:12` · `:194` · `:210`——「24 档工具描述」陈旧读数随本批收正 48）
    · `docs/RELEASE.md`（`:33` · `:95`）。
- **预算机检面**：`scripts/tool-schema-size.mjs` 面 3 枚举项 `inst:ledgerQuery` / `inst:ledgerCount` ⇒ `inst:ledger`（单条）；档数读数随动（重跑为准）。

### 11.6 测试面（批内件 + 现役扫描）

- **批内件（拟新增——本批实施轮落盘）= `docs/batches/2026-10-05-ledger-unification.test.mjs`**（随批档）——五腿：
  - 腿 1 五 action 对旧核函数等价（出参 = 直调核函数 / 原工具路径逐字）；
  - 腿 2 弃用壳行为（五旧名 execute ⇒ 抛 + §11.4 判据 + 零库动作）；
  - 腿 3 守卫逐 action 文案（add 缺 kind / update 缺 id / close 缺 id·status / query·count 枚举外值 ⇒ `ledger(<action>)：…` 逐字；入口级三判 ⇒ `ledger：…`；P2 未知键（`action` 不入未知列——已消费，§11.3）/ P4 错型 / P6 `title` 空——三面补齐）；
  - 腿 4 未知 action（`{action:"foo"}` ⇒ 入口级拒——P5 形文案）；
  - 腿 5 装配名集断言（depth-0 与 depth>0 两形——判据 = §11.1）。
- **现役套件扫描（as-of 2026-10-05）**：五端测试树（core ∥ cli ∥ vscode ∥ desktop ∥ render-core）旧五名与 ledger 工具面**零命中** ⇒ 无随动项；core 测试树现为零用例（2026-09-28 全清重置——零用例即绿）。
- **旧批件登记（不回改）**：`docs/batches/2026-09-29-tools-carryover-15.test.mjs`（52 档计数 + 逐档 description 对拍——本批后不再重跑绿）· `docs/batches/2026-09-29-residuals-round2.test.mjs`（W8 契约② 现载体——导出面**超集判**（缺名必零）+ 退场锁 ⇒ 新增 `ledgerTool` 导出**不受触**）。
- **常驻机判随动**：`scripts/prompt-refs-check.mjs`（域含 tool-docs 与双提示词面）——新档与提示词面改动须零命中（工具名不在 J1/J2/J3 射程——零登记）；`node scripts/doc-check.mjs` **入闸悬空 = 0**（本档 §11 原三处已闭——唯一路径形 + 拟新增标注；「列报 · 不入闸」报告态不计）。

### 11.7 文档 / 提示词面清单（逐面裁定）

| 面 | 裁定 | 说明 |
|---|---|---|
| `thincoder-core/prompts/common.md` | 更新（实施轮） | 读面引用 `ledger_query` / `ledger_count` ⇒ `ledger`（action=…）形 |
| `thincoder-core/prompts/persona-engineering.md` | 更新（实施轮） | `ledger_close` 引用 ⇒ `ledger`（action=close）形 |
| `docs/core/design/prompts/common.md` | 更新（实施轮——双面同拍，先例 = ledger-governance 批 L1/L2） | 与部署面逐字对齐 |
| `docs/core/design/prompts/persona-engineering.md` | 更新（实施轮——双面同拍） | 同上 |
| `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-LEDGER.md` | 更新（需求档笔 = 主 agent——父侧随动） | L29 `ledger_update`；L69 写命令三工具名；L70 读命令二名 + `ledger_update.executor` |
| `docs/core/design/TOOLS.md` | 更新（设计档笔——随实施轮） | §6.11：计数（52 ⇒ 48）+ 接线句改统一入口终值（VSC 坐标随现档） |
| `docs/core/design/CORE-UNIFICATION.md` | 更新（随实施轮） | 端差接线行（名称面 + 坐标收正：旧档 setup.mjs ⇒ 现档 `tool-table.mjs`）+ 计数簇（§11.5） |
| `docs/core/design/PROMPT-SYSTEM.md` · `docs/core/requirements/PROMPT-SYSTEM.md` | **保留为历史**（除计数簇外） | 给由：2026-09-25 裁定注记 = 记录面（叙述该批收正动作——不改）；计数簇随 §11.5 |
| `docs/core/design/LEDGER.md` 自身 | 名称面收正（本批——§3.2 / §8 同批收正；§3 / §3.1 / §6.1 / §7.3.1 轻收正） | 判据本体零改 |

### 11.8 受影响文件与测试面（现行 = 实读 2026-10-05；Δ = 实施轮以实读为准）

| 文件 | 现行 | Δ | 改动 |
|---|---|---|---|
| `thincoder-core/ledger-tools.mjs` | 189 | +≈75（估 ≈265） | 新 `ledgerTool`（两变体 + 并集派生 + 路由 + 入口判）；五工具 wrap 为壳 |
| `thincoder-core/tools/index.mjs` | 80 | −3 | 移除 ledger 读二注册与动态 import |
| `thincoder-core/agent/family-tools.mjs` | 188 | +≈6 | depth-0 换 `ledger` 全量；depth>0 各角色段挂读变体（动态 import——W8 零破） |
| `thincoder-core/ledger.mjs` | 194 | +1 | re-export 增 `ledgerTool`（头注随动） |
| `thincoder-vscode/src/agent/tool-table.mjs` | 191 | −3 | 移除端侧读二自持项 |
| `thincoder-vscode/scripts/check-vsix.mjs` | 101 | ~1 | `EXPECT["tool-docs"]` 52 ⇒ 48（注记同随） |
| `scripts/tool-schema-size.mjs` | 96 | ~2 | 面 3 枚举改 `inst:ledger` |
| `thincoder-core/tool-docs/ledger.md` | 新（拟新增） | — | 五 action 统一描述（§11.5） |
| `thincoder-core/tool-docs/ledger_*.md` ×5 | 五档 | −5 档 | 退场（§11.5） |
| `thincoder-core/prompts/common.md` | 170 | ~1 | L158 引用改写 |
| `thincoder-core/prompts/persona-engineering.md` | 195 | ~1 | L167 引用改写 |
| `docs/core/design/prompts/common.md` | 128 | ~1 | L116 同拍 |
| `docs/core/design/prompts/persona-engineering.md` | 199 | ~1 | L167 同拍 |
| `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-LEDGER.md` | 98 | ~3 行 | L29 / L69 / L70 名称面 |
| `docs/core/design/TOOLS.md` | 1232 | ~2 | §6.11 计数 + 接线句 |
| `docs/core/design/CORE-UNIFICATION.md` | 2066 | ~12 | 接线行 + 计数簇 |
| `docs/core/design/PROMPT-SYSTEM.md` | 659 | ~5 | 计数簇 |
| `docs/core/requirements/CORE-UNIFICATION.md` | 204 | ~2 | 计数簇 |
| `docs/core/requirements/PROMPT-SYSTEM.md` | 275 | ~3 | 计数簇（「24 档工具描述」收正 48——需求档笔 = 主 agent；`:12` · `:194` · `:210`） |
| `docs/RELEASE.md` | 421 | ~2 | 计数簇 |
| `docs/core/design/API-CONTRACT.md` | 2980 | 生成区随动 | 重跑生成器（§11.9——生成区唯一笔） |
| `docs/core/design/LEDGER.md` | 前 592 ⇒ 落档 710（实施后同步实读——末行号法；+5 = 实施中裁定轮，本笔 +3） | 本档 | §11 + §3.2 / §8 名称面 + 变更记录 |
| `docs/batches/2026-10-05-ledger-unification.test.mjs` | 新（拟新增） | 估 ≈260 | 批内件（§11.6——五腿） |

**跨文件极限**：`thincoder-core/ledger-tools.mjs` 估 ≈265 行 ≤300 顾问线（零拆分义务）；若实施轮实装越线 ⇒ 拆分预案 = 统一入口出档（先例 = 2026-09-28 拆分）。余档均小。

### 11.9 接口索引面（API-CONTRACT）与工程随动

- **读数（as-of 2026-10-05）**：工具对象导出**在册**——`docs/core/design/API-CONTRACT.md` 生成区（五工具行 + `thincoder-core/ledger.mjs` re-export 命名组行）；语义区未列工具对象（零动）。
- **处置**：实施轮重跑生成器 `node scripts/api-contract.mjs --write`（生成区唯一笔——工程工具面；新 `ledgerTool` 行 + 行号随动；先例 = bash 批导出行组随动）；语义区零动（工具对象非语义区键；核函数零改）。

### 11.10 关键决策

| KD | 决策 | 否决方案 |
|---|---|---|
| KD-unif-1 | action = add / update / close / query / count | 过去式 / 数字代号 |
| KD-unif-2 | 旧名保留壳 → 抛弃用警告（不入装配） | 立即移除 / 双份完整实现 / 五旧一新并行 |
| KD-unif-3 | 路由内部、`.cmd` 零改 | 改 `thincoder-core/ledger-cmd.mjs` 签名 |
| KD-unif-4 | 提示词 / 文档面随实施轮改写（面清单 = §11.7） | 延迟不登 / 本设计轮改产品面 |
| KD-unif-5 | tool-docs 五档退场 + 新档承接（计数 ⇒ 48） | 旧档留弃用行（53）/ 旧档不动 |
| KD-unif-6 | 读面随家族段（两变体同名单对象）——基集清零 | 基集留读面（与 depth-0 全量变体必撞名） |
| KD-unif-7 | 文案前缀 = `ledger(<action>)：`（伪工具对象实现形） | 单前缀 `ledger：`（分不出动作）/ 改 `assertToolArgs` |
| KD-unif-8 | 守卫入参 = 已消费 `action` 的余键（声明源「前身逐字」保持） | 伪声明并入单值 `action` 属性（破「前身逐字」） |
| KD-unif-9 | 只读分类 = 全量变体 `readonly: false` + `isReadonlyAction`（`action ∈ {query, count}` ⇒ true）∥ 只读变体 `readonly: true` | 一刀切 `readonly: true`（写 action 被当读放行——破「外部行为零变」）∥ 一刀切 `readonly: false` 无钩子（读二旧行为不保——破「外部行为零变」） |

### 11.11 验收用例（T 表——批内件腿映射）

| TC | 场景 | 输入 | 期望输出 |
|---|---|---|---|
| T77 | 正常：查询零过滤 | `{action:"query"}` | 同原 `ledger_query` 行集（核 `ledgerQuery` 直调等价） |
| T78 | 正常：查询带过滤 | `{action:"query", status:"在途"}` | 同原 `ledger_query` 在途行集 |
| T79 | 正常：计数 | `{action:"count"}` | `{count: N}`（未决四态） |
| T80 | 正常：入条目（守卫锚） | `{action:"add", kind:"requirement", title:"test"}` | `{id: X, status:"待讨论"}`（守卫面 = 余键——`action` 已消费，§11.3） |
| T81 | 正常：更新 | `{action:"update", id:1, status:"待设计"}` | 同原 `ledger_update` 出参 |
| T82 | 正常：核销 | `{action:"close", id:1, status:"已核销"}` | 同原 `ledger_close` 出参 |
| T83 | 错误：未知 action（入口级） | `{action:"foo"}` | throw `ledger：action 非法："foo"（取值 ∈ {add, update, close, query, count}）` |
| T84 | 错误：add 缺必填（守卫锚） | `{action:"add"}` | throw `ledger(add)：kind 缺失（必填；取值 ∈ {requirement, tech_todo}）`（余键 {} ⇒ P3 形——§11.3） |
| T85 | 错误：query 枚举外值 | `{action:"query", status:"invalid"}` | throw `ledger(query)：status 非法："invalid"（取值 ∈ {待讨论, 待设计, 在途, 待核销, 已核销, 已废弃}）` |
| T86 | 旧名壳：add | `ledgerAddTool.execute(…)` | throw 弃用文案（含旧名 + `ledger`（action=add）指引；零库动作） |
| T87 | 旧名壳：query | `ledgerQueryTool.execute(…)` | throw 弃用文案（同上） |
| T88 | 错误：action 缺失 | `{}` | throw `ledger：action 缺失（必填；取值 ∈ {add, update, close, query, count}）` |
| T89 | 错误：未知键（P2——`action` 不入未知列） | `{action:"add", kind:"requirement", title:"x", knd:"y"}` | throw `ledger(add)：未知参数：knd（可用参数 = cwd / kind / …）`——列零 `action`（已消费——§11.3） |
| T90 | 错误：错型（P4） | `{action:"update", id:"1"}` | throw `ledger(update)：id 非法："1"（应为数字）` |
| T91 | 错误：`title` 空 / 全空白（P6） | `{action:"add", kind:"requirement", title:"  "}` | throw `ledger(add)：title 为空（必填；非空字符串）` |

（号段 = 首用未占用连续段 **T77 起**——实核 2026-10-05；守卫面入参 = 已消费 `action` 的余键（§11.3）——T80 / T84 / T89 为锚。）

### 11.12 边界（本设计 NOT doing）

- **不改业务逻辑**：路由不改变 `thincoder-core/ledger-cmd.mjs` 任何函数行为；五核函数（`ledgerAdd` / `ledgerUpdate` / `ledgerClose` / `ledgerQuery` / `ledgerCount`）零改。
- **不改可见面**：`ledger-surface.mjs`（CLI / VSC / 桌面显示面）直接 import 核函数，不涉工具面。
- **不改 `thincoder-core/ledger-db.mjs`**：schema / DDL / 迁移零碰。
- **不做运行期 depth 门**：写面不可达保持 **schema 级**（不降为 execute 门）。
- **不并行留旧装配**：旧五名不入任何装配面（与「合并成一个」字面一致——终值面唯一名 `ledger`）。
- **不改 API-CONTRACT 语义区**（生成区随实施轮重跑——§11.9）；**不动桌面端**（零自持工具装配面——随核装配）。

## 12. 变体键库首跑检测提示（F-LX3 · 2026-10-05 · 批档 `docs/batches/2026-10-05-ledger-variant-db-notice.md`）

**动因**：GitHub #19 请求②——旧产物持续写入小写盘符变体键（实读 21 库中 10 为变体键、约 130 条搁浅）；键归一（§2.1）修复已入版但用户无发现途径。
**需求** = `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-LEDGER.md` §②.10（F-LX3）+ §④ AC-M2-20；台账 #935。
**目标**：升级到含键归一的版本后，**当前项目根**的存量变体键库不再无声搁浅——CLI 主入口启动时自动发现并单行引导（`thincoder ledger audit` 查看 ∥ `thincoder ledger migrate` 收正）；**只提示，零自动动作**。

### 12.1 检测语义（判据句）

- **输入** = 当前项目根：`resolveProjectRoot(cwd) ?? resolve(cwd ?? ".")`——与 `planLedgerMigration` 的根式**同一子表达式**（检测出的源集 ≡ `migrate` 的变体源集：同根式 / 同枚举 / 同过滤；`--from` 补充源不属检测面）。
- **变体键枚举** = `legacyKeyVariants(root)`（`thincoder-core/ledger-migrate.mjs:42-45`——**检测面零新建哈希式**，键式单源）；再过滤 `k !== ledgerKey(root)`（小写盘符入参时翻转拼写 ≡ 归一后主键——主库不自报「变体」）。
- **「变体键库在盘」判据 = 文件存在**（`statSync(p).isFile()`——与 `migrate` 源枚举的过滤同判据）。理由：① 提示与 `migrate` 源集同判据——提示 ⇒ 该源皆有既定处置（分述：空库 ⇒ `migrate` 照回收；坏档 / `-wal` ⇒ confirm 面拒跑（fail-closed——§2.2）、走 `thincoder ledger audit` 定性）；② **零开库**（不读行数——启动期不触 SQLite、不建 WAL）；③ 坏档 / 空库恰是最需人工处置的形态（判据若读行数，不可读档将落入静默分支 = 漏报）。
- **主库在否均提示**：判定不依赖主键档是否存在（数据只在变体库时更属搁浅）。命中（非空）⇒ 成立；无 ⇒ 零动作零输出。

### 12.2 提示面（落点链 / 时机 / 一次为限 / 文案）

**落点链**（先例 = R25 `crashNotice`——bin 侧计算 → `startTUI` opts 承载 → `showStartup` 渲染）：

| 步 | 落点 | 动作 |
|---|---|---|
| ① 计算 | `thincoder-cli/src/command-interactive.mjs` `tuiCommand`（`startTUI` 调用前——邻 `crashNotice` 计算处） | 动态 import `@thincoder/core/ledger-variant-notice.mjs` → `ledgerVariantNotice({ cwd: agent.cwd, locale: agent.config?.locale })`；import ∥ 调用整段 try 包住（静默降级） |
| ② 承载 | `tuiCommand` → `startTUI(agent, { …, ledgerVariantNotice })` | opts 新键（`string ∥ undefined`——与 `crashNotice` 同形） |
| ③ 渲染 | `thincoder-cli/src/tui/startup.mjs` `showStartup`（邻 `opts.crashNotice` 行之后） | `if (opts.ledgerVariantNotice) pushLine(opts.ledgerVariantNotice, C.warn)`——恰一行 |

**时机** = TUI 启动屏（首帧前完成；不阻塞启动）；**每进程至多一次** = **核内闩**（一次为限）：新档模块级 `noticeChecked`——**首唤检测、后唤零动作返回 `null`**（「每进程」= ESM 模块实例的天然粒度）；重置缝 `_resetLedgerVariantNoticeForTest()`（先例 = `_resetLedgerDirForTest`）。理由：调用面（TUI 启动恰一次）是结构事实——结构事实随未来调用面漂移；闩在核 = 单一权威面 + 可直测。

**文案（逐字——i18n 键 `ledger.variantDbNotice`，zh ∥ en 两语；单源 = `thincoder-core/i18n.mjs` `CORE_MESSAGES` 新键）**：

| 语言 | 逐字 |
|---|---|
| zh | `检测到本项目的存量变体键台账库（升级遗留，数据可能未并入当前库）：thincoder ledger audit 查看；thincoder ledger migrate 收正` |
| en | `Legacy variant-key ledger DB found for this project (pre-upgrade; rows may be outside the current ledger): thincoder ledger audit to inspect; thincoder ledger migrate to reconcile` |

- 内文含收正路径 `thincoder ledger audit` ∥ `thincoder ledger migrate`（AC-M2-20 判据逐字面）；单行（无换行）。
- 新键沿 `digest.residue` 先例（注释携批 / 台账号；CLI 直取 `t(key, {}, locale)`）；**locale** = `agent.config?.locale`（透传 `t()`——`zh-CN` 归一 `zh`；缺省 = 容器缺省 `en`）——语言取值缝先例 = `notify-policy.mjs` `langOf`。

### 12.3 静默降级（全径）

- **核内**：`ledgerVariantNotice` 函数体全径 try/catch——任何异常（根解析 / 探针 / 文案解析）⇒ 返回 `null`，零抛。
- **调用面**：`tuiCommand` 的 import + 调用段独立 try——import 失败（模块缺席等）⇒ 不传 opts。
- **绝不阻塞 / 绝不中断启动**：检测 = 一次动态 import + 至多一次 `statSync`（有界；不遍历目录、不开库、零写）。

### 12.4 接口面（改前 → 改后）

| 面 | 改前 | 改后 |
|---|---|---|
| `thincoder-core/ledger-variant-notice.mjs`（拟新增——本批实施轮落盘） | —（无档） | 导出 `ledgerVariantNotice({ cwd = process.cwd(), dir = ledgerDirPath(), locale = "en", exists = 默认探针 })` → `string ∥ null`；`_resetLedgerVariantNoticeForTest()`；`exists` = 测试注入缝（先例 = `ensureExecutorColumn` 的 `exists` 参数；默认探针 = `statSync(p).isFile()` 吞错形） |
| `thincoder-core/i18n.mjs` | 无 `ledger.*` 键 | `CORE_MESSAGES` 增 `ledger.variantDbNotice`（zh ∥ en 逐字 = §12.2） |
| `thincoder-cli/src/command-interactive.mjs` | `startTUI(agent, { …, crashNotice })` | 增 `ledgerVariantNotice`（计算段 = §12.2 ①） |
| `thincoder-cli/src/tui/startup.mjs` | `showStartup` 渲染 `opts.crashNotice` | 增渲染 `opts.ledgerVariantNotice`（恰一行） |
| `thincoder ledger migrate ∥ audit`（命令分发 + 核 `ledger-migrate.mjs`） | — | **零改**（语义 / 输出零变——提示只指路） |

- W8 契约②：新档静态链入 `ledger-migrate.mjs`（node:sqlite）⇒ 消费侧**动态 import**（CLI 调用面按此落型；端壳静态闭包零新入边）。
- 检测面零新建哈希式：键式直引 `ledgerKey`（`thincoder-core/ledger-db.mjs:41-43`）∥ 变体枚举直引 `legacyKeyVariants`（`thincoder-core/ledger-migrate.mjs:42-45`）——不二写。

### 12.5 用例表（U-VN*——批内件 `docs/batches/2026-10-05-ledger-variant-db-notice.test.mjs`（拟新增——本批实施轮落盘））

| # | 类型 | 输入 | 期望输出 | 回指 |
|---|---|---|---|---|
| U-VN1 | 正常·变体对夹具（两拍） | 夹具 = 临时台账目录 + 项目根（测试注入缝）；变体键档在盘（键 = 翻转拼写原样 `sha1[:16]`——**非库文件亦计**）：① 主键档不在 ② 主键档在场 | ①② 均 ⇒ 单行文案（逐字 = §12.2——zh ∥ en 两语各断言；含 `thincoder ledger audit` ∧ `thincoder ledger migrate`） | §②.10 检测 / AC-M2-20 句 1 |
| U-VN2 | 边界·零输出（两拍） | ① 仅主键档在场 ② 台账目录空 / 无目录 | 均 ⇒ `null`（零动作零输出） | AC-M2-20 句 2 |
| U-VN3 | 错误·抛错注入 | `exists` 注入抛错函数 | ⇒ `null` ∧ 零抛（静默降级） | §②.10 降级 / AC-M2-20 句 3 |
| U-VN4 | 边界·每进程至多一次 | 同进程：变体对夹具连唤两次 → 重置缝 → 再唤 | 第 1 次文案 ∥ 第 2 次 `null` ∥ 重置后再出 | AC-M2-20 句 4 |
| U-VN5 | 边界·负向锁（翻转拼写 ≡ 主键） | 小写盘符拼写项目根 ∧ 该键档在场 | ⇒ `null`（`k !== ledgerKey(root)` 过滤——主库不自报「变体」） | §12.1 过滤口径 |
| U-VN6 | 集成·启动面渲染腿 | `showStartup` 最小 ctx 直驱：① `opts.ledgerVariantNotice` 在场 ② 缺省 | ① 恰一行（= 该文案）② 零行；附接线静态锁（计算段 ∥ 渲染句在盘） | AC-M2-20「启动提示恰一行」 |

### 12.6 验收对照（A-VN*——逐条回指需求 §②.10 / §④）

| # | 判据（可机判） | 回指 |
|---|---|---|
| A-VN1 | 检测判据：当前项目根存在变体键库（沿 `legacyKeyVariants` ∧ `k !== 主键` ∧ 文件在盘）⇒ 成立；主库在 / 不在两分支同判——U-VN1 绿 | §②.10 检测 / AC-M2-20 句 1 |
| A-VN2 | 提示面：恰一行 ∧ 逐字含 `thincoder ledger audit` ∥ `thincoder ledger migrate` ∧ 文案 = i18n 键 `ledger.variantDbNotice`（zh ∥ en 逐字 = §12.2——核容器单源，零第二副本）——U-VN1 / U-VN6 绿 | §②.10 提示 / AC-M2-20 句 1 |
| A-VN3 | 零输出：单库 / 无库 ⇒ 零动作零输出——U-VN2 绿 | AC-M2-20 句 2 |
| A-VN4 | 静默降级：检测报错 ⇒ 启动照常零报错（`null` 零抛 ∥ import 失败不传 opts）——U-VN3 绿 | §②.10 降级 / AC-M2-20 句 3 |
| A-VN5 | 每进程至多一次（核内闩 + 重置缝）——U-VN4 绿 | AC-M2-20 句 4 |
| A-VN6 | 零回归与机检：`ledger-migrate.mjs` / `runLedgerMigrate` / `runLedgerAudit` 零改（静态判）；批内件全绿；`node scripts/doc-check.mjs` exit 0（本批触碰档零新增悬空） | 边界（§12.7）/ 批档自身约束 |

**编号注记**：本批验收以批内编号 **A-VN1–A-VN6**（用例 U-VN1–U-VN6）承载——设计档 §8 模块级编号面本批不增行；回指 = 需求 §②.10 F-LX3 / §④ AC-M2-20。
需求侧 F-LX3 验收 = **AC-M2-20**（17/18/19 均已占用，连避至 20——2026-10-05 逐号对读终裁；需求档变更记录在案）。

### 12.7 边界（本批不做）

- **只提示零动作**：不自动迁移 / 不删档 / 不建库 / 零写（收正 = 用户显式跑 `thincoder ledger migrate`）。
- **提示面 = CLI 交互主入口（TUI 启动）为限**：桌面 / VSC 启动面不做（#19 可见面裁决）；headless `chat` / `acp` 面不做（2026-10-05 裁定——机器消费面纪律：机器面零新增输出；与 §7.8 不变量句「headless 零新增输出」（`:364`）同向：本面不做 ⇒ headless 零新增输出保持）。
- **不改 `ledger migrate` / `ledger audit` 既有语义**（命令面、输出、迁移六步、审计定性零改）。
- **不新增哈希式**；**不做变体键反推根**（哈希不可逆——只对当前项目根正向计算）；**检出面不含 `--from` 补充源 / `--root` 候选根**。
- **不阻塞启动**：检测有界（一次动态 import + 至多一次 `statSync`）；失败全径静默。
- **不做全局 / 多项目扫描**（逐项目锚定——同 §2.2 迁移面口径）；不做交互 / 弹窗。

### 12.8 关键决策

| KD | 决策 | 否决方案 |
|---|---|---|
| KD-VN1 | 「在盘」判据 = 文件存在（零开库） | 读行数（开库读——坏档 / 空库漏报 + 启动期触 SQLite） |
| KD-VN2 | 检测 / 文案落新档 `thincoder-core/ledger-variant-notice.mjs`（拟新增——本批实施轮落盘） | 并入 `ledger-migrate.mjs`（+≈30 ⇒ 约 330 越 300 顾问线）∥ 并入 `ledger-db.mjs`（与 migrate 成环） |
| KD-VN3 | 一次为限 = 核内闩（+ 重置缝） | 调用面结构事实（随未来调用面漂移、无直测面） |
| KD-VN4 | 承载 = opts 拷贝 + `showStartup` 渲染（`crashNotice` 同款） | `showStartup` 内计算（sync 面不可动态 import）∥ 独立启动器（超面） |
| KD-VN5 | 文案单源 = i18n 键（zh ∥ en；locale = `agent.config?.locale`） | CLI 内联字面（第二副本）∥ 固定中文（违 i18n 单源） |
| KD-VN6 | 提示面 = CLI TUI 启动为限 | headless / ACP / VSC / 桌面同步提示（噪声 + 面差） |

## 13. 台账工具面改造批（2026-10-07 · 批档 `docs/batches/2026-10-07-ledger-tool.md` · 台账 #998）

**背景（本批因何而立）**：工具面四处摩擦——① `close` 无 `evidence` 参数（追认核销须两跳：先 `update` 补证据、再 `close`）∥ ② `query` 无 `trigger` 过滤 ∥ ③ 批点火时 executor 不落（见 §13.3 现状核实）∥ ④ 老化（>30 天行龄）查询面无直出（须人算）。四项均**增量**：六态 / 迁移表 / 写门 / DDL 零改。

### 13.1 ① `close` 携 `evidence`（一跳核销）

- **参数面**：`ledger(close)` 增可选 `evidence`（串）——`{ action:"close", id, status, evidence? }`；缺省 = 行现值不变（**向后兼容**：不带该参的既有调用行为零变）。
- **语义**：核函数 `ledgerClose({ cwd, id, status, evidence, evidenceReplace })`——事务内 `nextEvidence` = 值计算（**#1006 批改追加缺省 / 覆盖旗——§13.9**）；**追认口 `evidence` 门判 `nextEvidence`**（非空 / 非全空白——缺 / 全空白 ⇒ 拒，文案逐字不变）；`UPDATE` 落 `nextEvidence`。勾销 / 撤回路径同携（值语义 = §13.9）。
- **效果**：追认核销（待讨论 / 待设计 → 已核销）= 一跳（原「`update` 补证据 → `close`」两跳收敛）。
- **判序**：源态判 → 值计算 → `evidence` 门 → 新值判（#1006 批增——§13.9）→ UPDATE（参数守卫先于全部——§3.2）。

### 13.2 ② `query` 按 `trigger` 过滤

- **参数面**：`ledger(query)` 增可选 `trigger`（∈ {归批, 条件, 认账不排期}）；缺省 = 不过滤。
- **语义**：`ledgerQuery({ …, trigger })` 增一等值 WHERE 支（与 status / kind / board 同式并取）。
- **边界（如实）**：`trigger = NULL`（无触发）过滤**不做**（批面未列——需要时另议）；读面过滤非法值 = P5 拒（§3.2 既有面）。

### 13.3 ③ executor 点火入边自动写（F-LX1 进边扩面）

**现状核实（本批设计轮实读）**：`executor` 自动写自 F-LX1（2026-09-21）已落，但**只覆盖 `待设计 → 在途` 单枚入边**；实操点火形态 = `待讨论 → 待设计`（行在「待设计」上过整段批程——本仓 2026-10-06/07 批实读：#985–#987 收口走账、#992 等设计在飞行皆然）⇒ 在飞行 executor 恒 `null`，多实例「谁在做」不可见。

- **契约（§3.1 ① 扩面）**：**进边集 = {`待讨论 → 待设计`（批点火边）, `待设计 → 在途`（实施入边）}**——两枚入边同式 `executor = patch.executor ?? sessionId ?? 行现值 ?? NULL`（批进入活跃面即落归属；设计段 ∥ 实施段同可见）。
- **可见面口径（本批界定）**：契约句「设计段 ∥ 实施段同可见」= **行集原始字段面**——点火期（待设计）归属经 query 逐行 `executor` 可见（SELECT * 直出）；**L1 标记 ∥ L2 判活尾段**（§7.3.1——executor 收集限「在途」）**不扩至点火期**——显示面扩面 = 本批不做（需要时另议）。
- **零变面**：出边（`在途 → 待核销` / `→ 已废弃`）无条件 NULL；`ledgerClose` 撤回置 NULL ∥ 核销两源零触碰（§3.1 ④）——**核销自「待设计」的追认行保留点火 executor**（如实痕迹；与勾销行 `null` 形的差异 = 路径差、非缺陷，如实登记）。
- **工具面**：`update` 的 `executor` 参数描述随动（「进入待设计 / 在途自动写本会话；出在途 / 撤回清空」）。

### 13.4 ④ 查询面逐行老化标记（`aged`）

- **契约**：`ledgerQuery` 行集逐行携计算字段 `aged: boolean`——**判真 = 未决四态（`PENDING_STATUSES`）∧ 行龄 > `AGING_DAYS`(30) 天**；行龄源 = `updated_at ?? created_at`（§5 同源）；时间戳缺 / 不可解析 ⇒ `false`（零假阳降级）。
- **常量单源收正**：`AGING_DAYS` 定义迁 `thincoder-core/ledger-db.mjs`（枚举常量档）；`ledger.mjs` 同名 re-export（公共面零变；消 `ledger-cmd ↔ ledger.mjs` 新环）。
- **范围界定（与 §7.3 `aged` 的差异为有意）**：本标记 = 逐行「挂账 >30 天」triage 面（未决态全域——需求池 ∥ 技术待办一律）；§7.3 `aged` = 可动作计数（技术待办 ∧ 无触发——「未定去向」口径）。两面判据不同、各有其用；不互斥、不互替。
- **输出面**：查询 action 出参自动携（行集直出）；`ledgerExport` 白名单（DATA_COLUMNS）零涉 ⇒ CLI `ledger list --json` / ACP 载荷零变（`aged` 不入导出）。`now` 可注入（`ledgerQuery({ …, now })`——确定性用例面）。

### 13.5 受影响文件与测试面（读数 as-of 2026-10-07；Δ = 实施轮以实读为准）

| 文件 | 现行 | 预期 | 改动 |
|---|---|---|---|
| `thincoder-core/ledger-tools.mjs` | 252 | ≈258 | ①③④ 参数面与描述（close.evidence ∥ query.trigger ∥ update.executor 句）；`close` 路由携 evidence |
| `thincoder-core/ledger-cmd.mjs` | 133 | ≈150 | ② WHERE 支 ∥ ④ `aged` 计算（`now` 注入）∥ ① `ledgerClose` evidence 参 ∥ ③ 点火入边（`resolveExecutorTarget` 边集扩面——§13.3） |
| `thincoder-core/ledger-db.mjs` | 168 | ≈171 | `AGING_DAYS` 迁入（常量单源） |
| `thincoder-core/ledger.mjs` | 194 | ≈194 | `AGING_DAYS` 改 re-export（公共面零变） |
| `thincoder-core/tool-docs/ledger.md` | 6 | ≈8 | close ∥ query ∥ update-executor 句（描述文本单点） |
| 批内件 `docs/batches/2026-10-07-ledger-tool.test.mjs` | 新 | ≈200–260 | §13.6 用例——随批归档，不进仓套件 |
| `docs/batches/2026-10-05-ledger-unification.test.mjs` | 232 | ±0（核讫零改） | 无随正点——P2 参数清单断言在 add 面（T89——本批 add 清单零变）；close / query 无清单断言（T77–T82 = 核直调对拍，双侧同移） |
| `docs/batches/2026-09-29-tools-carryover-15.test.mjs` | 262 | ±0（不编辑） | 退役档（留档不再复跑 · `勿修`）——「不回改」登记延伸（§11.6）；subagent schema pin 漂移随登记承接 |

受影既有批件（先例 = 批件随正）：两件均**零改**（详上表末两行）——unification = 无随正点（P2 清单断言在 add 面——本批 add 零变）∥ carryover-15 = 退役档「不回改」（§11.6 登记延伸——不编辑）。
零改面：`ledger-db.mjs` DDL ∥ `ledger-executors.mjs` ∥ `ledger-read.mjs` ∥ `ledger-migrate.mjs` ∥ `agent/family-tools.mjs`（装配）∥ 命令行面。

### 13.6 用例（U-LT*——批内件承载；§8 模块级编号本批不增行）与验收对照（A-LT*）

| 用例 | 场景 | 期望 |
|---|---|---|
| U-LT1 | 追认核销一跳：`close{ id, status:已核销, evidence:"…" }`（行 = 待设计） | 成功；行 evidence = 参数值、status = 已核销 |
| U-LT2 | 追认缺证据（无参 / 全空白） | 拒——文案逐字（既有）；行不变 |
| U-LT3 | 勾销携 evidence（待核销 → 已核销） | 成功；证据落值（内容不判） |
| U-LT4 | 向后兼容：`close` 不带 evidence | 与既有行为逐字等价（两跳面零破） |
| U-LT5 | `query{ trigger:归批 }`（三枚举逐一） | 仅对应 `trigger` 行 |
| U-LT6 | `query{ trigger:"bogus" }` | P5 拒（`ledger(query)：trigger 非法…`） |
| U-LT7 | 点火写：`update{ id, status:待设计 }`（注入 sessionId） | executor = sessionId；`待设计 → 在途` 保持 / 更新 |
| U-LT8 | 优先级与零变面：patch 显式 > sessionId；出边清空；撤回清空；核销两源零触碰 | 逐拍对照 F-LX1 既有语义 |
| U-LT9 | `aged` 判真：未决 + 行龄 >30 天（`now` 注入） | `aged:true`；≤30 天 / 已归档 / 时间戳缺 ⇒ `false` |
| U-LT10 | 导出零涉：`ledgerExport` 行集 | 无 `aged` 键（DATA_COLUMNS 白名单） |

| 验收 | 判据（回指） | 用例 |
|---|---|---|
| A-LT1 | ① 一跳核销成立 ∧ 追认门零松（缺证据仍拒） ∧ 向后兼容 | U-LT1–U-LT4 |
| A-LT2 | ② trigger 过滤成立 ∧ 非法值拒 ∧ 缺省不过滤 | U-LT5–U-LT6 |
| A-LT3 | ③ 点火入边落 executor ∧ 既有进出边语义零变 | U-LT7–U-LT8 |
| A-LT4 | ④ `aged` 判真 / 判假全拍 ∧ 导出面零涉 | U-LT9–U-LT10 |
| A-LT5 | 禁止面自检：六态 / 迁移表 / 写门 / DDL / 装配 / 命令行面零改（静态判）；批内件全绿；`doc-check` exit 0 | — |
| A-LT6 | 描述面：`tool-docs/ledger.md` 与 `update.executor` 句随动（单点）；四端装配共享同源（零端副本） | — |

需求侧编号候补（主 agent 笔）：`ENGINEERING-MODE-V2-SPEC-LEDGER.md` 增 §行 + AC-M2-21…24（20 已占用——连避）。

### 13.7 关键决策

| KD | 决策 | 否决 |
|---|---|---|
| KD-LT1 | executor 进边扩至**点火边**（待讨论 → 待设计） | 只保 F-LX1 单边（实操点火不动「在途」边——观察面缺口照旧）∥ 改提示词让行骑「在途」（提示词面 / 实操改道——非本批面） |
| KD-LT2 | `close` evidence = 可选参 + 事务内落值 + 门判**结果值** | 为 close 自动造证据 ∥ 全 close 强制要求证据 |
| KD-LT3 | `aged` 计算住核 `ledgerQuery`（常量迁 `ledger-db.mjs`） | 工具层算（常量双源 / 环）∥ 沿 §7.3「无触发」口径（错误射程——逐行 triage 要全域未决） |
| KD-LT4 | `trigger` 只做三枚举过滤（NULL 过滤不做） | 加 `null` 过滤（批面未列——夹带） |

### 13.8 边界（本批不做）

- 六态 / 迁移表 / DDL / 写门 / 装配面 / 命令行面零改；字段族零增（`aged` = 计算字段，不入库）。
- 不做 `trigger = NULL` 过滤；不做 query 排序参数（批面未列）。
- executor 不引入自动接手 / 心跳 / 清槽扩展（§3.1 ⑤ 既有禁止面不变）。
- 老化不做趋势 / 报表（仅逐行布尔标记）。

### 13.9 `evidence` 语义修正——追加缺省 + 布尔覆盖旗（2026-10-07 · 批档 `docs/batches/2026-10-07-ledger-evidence-semantics.md` · 台账 #1006）

**背景（因何而立）**：`update` / `close` 的 `evidence` 传值语义从未定义（§3.2 仅「可空 · 串」）——实现按 `patch.evidence ?? 行值` 填空 = **静默整体替换**；调用侧「自拼原文」成习，一次漏拼即无声灭失出处。事故样本 = 2026-10-07 七行（#988 / #994 / #995 / #1001–1004）原文被顶掉、父侧手工还原。用户 12:20 定型「默认追加」、12:21 点火；覆盖旗形态 = 父侧定裁 **A（布尔旗与值同传）**（2026-10-07 设计轮回执）。

**语义（update ∥ close 同式；`add` 零变——新行直写无旧值）**

- **追加（缺省）**：传入 `evidence`（非 `null`——`null` ≡ 略去，§3.2 既有口径；close 侧勾销 ∥ 追认 ∥ 撤回三径同携）⇒ 旧值非空：值 = `旧 + "｜" + 新`（**「｜」两侧零空格直接相接**——房规形 = 「。｜【」块摞块，实材三处核讫 = #885 ∥ #922 ∥ #1006 evidence 逐字）；旧值空（`null` ∥ 空串 ∥ 全空白）⇒ 直写新值（零分隔符残留）；两值逐字落行（不裁 / 不判内容）。
- **覆盖（显式）**：`{ evidence: 完整新文, evidenceReplace: true }`（**旗与值同传**——沿 `edit` `replace_all` 先例）⇒ 整段替换（旧文零保留）。
- **拒面（两枚——文案逐字）**：① **旗独传**（`evidenceReplace: true` ∧ `evidence` 缺 / `null`）⇒ 拒——`ledgerUpdate：evidenceReplace 须与 evidence 同传（缺新文）`；close 同式（前缀换 `ledgerClose`）。② **新值全空白**（追加 ∥ 覆盖两径同判）⇒ 拒——`ledgerUpdate：evidence 为空（非空字符串）`；close 同式。
- **close 门判照旧**：追认口 `evidence` 门判**结果值**（缺 / 全空白 ⇒ 拒——`ledgerClose：追认核销须带 evidence（现态 <X>）` 文案逐字不变）；拒面①（旗独传）判于**值计算阶段**（追认门之前——无新文可算，先拒）；拒面②落位于追认门**之后** ⇒ 追认 + 空白（旧空）先中追认门（U-LT2 零变）。
- **清值形退役（如实）**：`evidence:""` 原为唯一「清值」形（§3.2 可空串空串口径）——随空白判 ⇒ 拒（本次修正对象；彻底改写 = 覆盖旗 + 新全文）。
- **核内旗判**：只认 `=== true`（其余值 = 追加——类型严判在工具层 `（应为布尔）`）。

**判序（既有判位零动；新判面落位如下）**

- update：迁移表判 → 本语义（executor 目标值 + **evidence 值计算（含两拒面）**）→ 写门 → UPDATE。
- close：目标集判 → 行取 → 源态判 → **值计算（追加 / 覆盖——拒面① 旗独传判于此）** → 追认门（原样）→ **拒面②（新值空白）** → UPDATE。
- 工具层参数守卫先于全部（§3.2）。

**兼容声明**

- 不带 `evidence` 的既有调用行为零变（行值不变 ∥ 判行值）；`evidenceReplace` = 新增参（缺省 / `false` = 追加——无旧行为可破）。
- 带 `evidence` 的行为 = **本次修正对象**（破坏性缺省 ⇒ 追加缺省）；上批件 `docs/batches/2026-10-07-ledger-tool.test.mjs` U-LT1 / U-LT3 值断言在新语义下同值（旧值空 ⇒ 直写）——零改零破；U-LT2 / U-LT3 / U-LT4 面零变（父裁）。

**声明面随正（实施轮落）**

- `thincoder-core/ledger-tools.mjs`：① update / close 两声明各增 `evidenceReplace`（`type:"boolean"`）+ `evidence` 描述改写（追加缺省 / 旧空直写 / 空白拒 / 覆盖旗同传）；② 并集 schema 两属性同增（两变体共享形态零变）；③ 合并句（`:157`）改写；④ close 路由携 `evidenceReplace`；
⑤ 守卫 helper 增布尔分支——**「零改」面破例（理由随行）**：声明含 `type:"boolean"` 必判，不判则 `"true"` 串静默落追加模式（双态歧义 = 本批打击面）；文案 `（应为布尔）`，判据点 = §3.2；⑥ 档头注（`thincoder-core/ledger-tools.mjs:8`）「helper `assertToolArgs` 零改」句随正——同 ⑤（本批破例：增布尔分支）。
- `thincoder-core/tool-docs/ledger.md`：update 行 ∥ close 行补传值语义全文（模型面单点——追加 / 覆盖 / 两拒面）。
- 本档：§3.2 字段判据表增 `evidenceReplace` 两行 + P4 模板行增第三型「（应为布尔）」+ 落点句（`:159`）与 §11.3 新参注（`:581`）收正（本批破例 + 新形态）+ 可空串空串口径例外句增 `evidence`；§7.1 两行签名 / 注随正；§13.1 机制式随正（`:831` / `:833`）。

**受影响文件与测试面（读数 as-of 2026-10-07；Δ = 实施轮以实读为准）**

| 文件 | 现行 | 预期 | 改动 |
|---|---|---|---|
| `thincoder-core/ledger-cmd.mjs` | 153 | ≈170 | 值计算 helper（追加 / 覆盖 + 两拒面——两函数同源）∥ `ledgerUpdate` 消费 `patch.evidenceReplace` ∥ `ledgerClose` 增参 + 判位（两档均 <300 顾问线——零拆分） |
| `thincoder-core/ledger-tools.mjs` | 254 | ≈268 | 两声明 × 2 键 ∥ 并集 2 属性 ∥ 描述 ×3 ∥ close 路由 ∥ 守卫布尔分支 |
| `thincoder-core/tool-docs/ledger.md` | 6 | ≈7 | update ∥ close 两行 |
| 批内件 `docs/batches/2026-10-07-ledger-evidence-semantics.test.mjs` | 新 | ≈180–240 | 用例 U-LT11–U-LT18——随批归档、**不进仓套件**；复跑 = 仓根（`thincoder/`）`node --test docs/batches/2026-10-07-ledger-evidence-semantics.test.mjs` |
| `docs/core/design/LEDGER.md` | 909 | 本档 | §13.9 + §13.1 / §3.2 / §7.1 随动 + 变更记录 |
| 零改面 | — | — | `ledger-db.mjs` ∥ `ledger-read.mjs` ∥ `ledger-migrate.mjs` ∥ `ledger-surface.mjs` ∥ `ledger-executors.mjs` ∥ 六态 / 迁移表 / DDL / 写门 ∥ 装配面 ∥ 命令行面 ∥ `add` 面 |

**用例（U-LT11–U-LT18——批内件承载；编号沿 U-LT 族顺延）与验收（A-LT7）**

| 用例 | 场景 | 期望 |
|---|---|---|
| U-LT11 | update 追加：旧值非空 + `evidence:"新注"` | 值逐字 = `旧｜新注`（例 = `【旧】甲。｜【新】乙`——零空格） |
| U-LT12 | update 旧空直写：旧 = `null` ∥ `""` ∥ 全空白 | 值 = `新注`（零分隔符残留） |
| U-LT13 | update 覆盖：`{evidence:"完整新文", evidenceReplace:true}`（旧非空） | 值 = `完整新文`（旧文零保留）；`evidenceReplace:false` ≡ 缺省（追加） |
| U-LT14 | 旗独传拒（负例）：`{evidenceReplace:true}`（evidence 缺 / `null`） | 拒——`ledgerUpdate：evidenceReplace 须与 evidence 同传（缺新文）`；行不变 |
| U-LT15 | 新值空白拒（负例）：`""` ∥ `"   "`（追加 ∥ 覆盖两径） | 拒——`ledgerUpdate：evidence 为空（非空字符串）`；行不变 |
| U-LT16 | close 同法：勾销 / 追认携 evidence（旧非空 ⇒ 追加逐字；旧空 ⇒ 直写）；覆盖旗 ⇒ 整段替换 | 逐腿断言值 / 状态 / `closed_at` |
| U-LT17 | close 负例（追认 ∥ 勾销两行态同判）：旗独传 ⇒ 新文案（判于值计算阶段、先于追认门）∥ 勾销 + 空白 ⇒ 新文案 ∥ 追认 + 空白（旧空）⇒ 原文案逐字（U-LT2 面零变） | 三面逐字；行不变 |
| U-LT18 | 兼容零变：update / close 不带 evidence ∥ 不带旗；`add` 三径零变；上批件 U-LT1–U-LT4 抽跑 | 逐字等价（行值不变 ∥ 判行值） |

| 验收 | 判据（回指） | 用例 |
|---|---|---|
| A-LT7 | 追加缺省成立（update ∥ close）∧ 拼接 / 直写逐字 ∧ 覆盖旗整段替换 ∧ 两拒面逐字（旗独传 ∥ 空白）∧ close 追认门零变 ∧ 兼容零变 ∧ 上批件零破 | U-LT11–U-LT18 |

**关键决策**

| KD | 决策 | 否决 |
|---|---|---|
| KD-LT5 | 覆盖 = 布尔旗与值同传（`{evidence, evidenceReplace:true}`——沿 `edit` `replace_all` 先例） | 独立值槽（`evidenceReplace:"全量新文"`——名实错位）∥ 独立 annotate action（用户 12:20 议而弃——参名仍 `evidence`、雷在原位；动因 = 失败代价不对称：忘旗 ⇒ 多留旧文可见可修，非无声灭失） |

**边界（本批不做）**

- 不新增 action；不做「新文含旧文自动判」/ 去重 / 魔法（拼接 = 纯字面）。
- close 既有判序与追认门判零改；六态 / 迁移表 / DDL / 写门 / 装配面零动。
- 不触 ledger 其余模块；需求档零碰（需求侧增量报父侧）；界面 / 交互面无（工具面参数语义）。

**需求侧增量与纪律翻面（主 agent 笔）**：`docs/core/requirements/ENGINEERING-MODE-V2-SPEC-LEDGER.md` 补行 + AC = **已落（AC-M2-25 · 需求档 `:83`）**；纪律翻面物 = 运行记忆条「自拼原文」⇒「只传新注」（**无 persona 句**——core 全树「自拼」零命中）；已登记随动项（批档 §2），落点 = 批收口 §6 父侧记录 + 实现落地后翻面。

