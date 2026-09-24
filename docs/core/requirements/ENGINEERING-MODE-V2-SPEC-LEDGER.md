# Function Spec · M2 台账（SQLite）

> 模块划分权威源 = `docs/core/design/ENGINEERING-MODE-V2.md` §2.2（M2）

## ① 模块目标

把 v1 的 md 台账（计数漂移、无事务、无枚举约束）换成 **SQLite 单表**——待办总账的单一权威源：六态 CHECK 机械锁死、COUNT 单源计数、收口事务保证原子。

## ② 功能点

1. **items 表 schema**（单表 + status 枚举，归档 = 状态子集）：

   | 字段 | 说明 |
   |---|---|
   | `id` | INTEGER PRIMARY KEY |
   | `kind` | TEXT NOT NULL CHECK(kind IN ('requirement','tech_todo')) |
   | `status` | TEXT NOT NULL CHECK(status IN ('待讨论','待设计','在途','待核销','已核销','已废弃')) |
   | `title` | NOT NULL——需求句 / 待办句（一行一条，不展开细节） |
   | `board` | 归属板块 |
   | `req_doc` | 需求档指针（需求类：`<档> §X`） |
   | `task_book` | 任务书指针（在途 / 待核销必填：批次档 §2） |
   | `evidence` | `file:line` + 症状（技术类最小证据行） |
   | `trigger` | CHECK(trigger IN ('归批','条件','认账不排期') OR NULL) |
   | `executor` | 执行者归属（F-LX1 · 2026-09-21 新增）：`sessionId` 文本；**在途写入 / 离开在途清除**——状态翻「在途」时记当前会话，核销 / 废弃 / 回退时清空；可空（老数据 / 历史行 NULL） |
   | 时间戳 | `created_at` · `updated_at` · `closed_at` |

2. **六态状态机**：待讨论 → 待设计 → 在途 → 待核销 → 已核销（勾销入归档）；任意态 → 已废弃（撤回 / 批次废弃）。
3. **查询命令**（只读，全角色可见）——替代 v1 `/ledger` 读面。
4. **写命令**（仅主 agent 装配）。
5. **归档 = 软删除语义**：已核销 / 已废弃 = 状态值，不物理删行。
6. **计数单源**：`SELECT COUNT(*) WHERE status IN (未决四态)`。
7. **落点**：项目级 `ledger.db`（不进 git）。
8. **执行者归属（F-LX1 · 2026-09-21 新增）**：多实例并存下，在途条目记「谁在做」——
   - **写入**：状态迁移进入「在途」时，写当前会话 `sessionId` 到 `executor`；离开「在途」（→ 待核销 / → 已废弃）即**清除**（置 NULL）。
   - **可见面**：`/ledger` 查询与状态行显示执行者；`executor` 非空时**判活展示**——属主进程活着 ⇒ 正常显示；已死 ⇒ 显示「（属主已死 &lt;n&gt;，可接手）」（L2 尾段形态）；进程探测失败 ⇒ 保守显示（不显示死亡，防误判——D-MI10 不对称沿用）。
   - **存储零新建**：字段挂在既有 items 单表（台账库本就按项目根共享）——不建平行存储（MULTI-INSTANCE-COLLAB N-MI1 吻合）。

9. **库键归一与跨端一致（F-LX2 · 2026-09-25 新增）**：库键 = `sha1(normalizeCwd(项目根绝对路径))[:16]`——
   - **归一步** = `session-slots.mjs` `normalizeCwd`（Windows 盘符统一大写；跨端契约同 session / checkpoint / traces / peers）；`resolve()` 既有规范化覆盖分隔符 / 点段 / 去尾斜杠；**非盘符段不折叠**（POSIX 大小写敏感——同 `MEMORY.md` §6.11「不做」）；`realpath` / 别名路径不做。
   - **不变性**：CLI 侧（盘符本大写）键零变；VSC 侧（`uri.fsPath` 小写盘符）并入同键 ⇒ **两端同库**（痛点实证 = 同项目双库 `02a338af…` / `16012aba…`）。
   - **存量面**：变体键合并迁移（`thincoder ledger migrate --dry-run|--confirm`：备份 → 单事务迁入（id 重发）→ 事务内读回 → 源回收 `ledger-trash` 不删）· 残档审计（`thincoder ledger audit`：只读逐库定性 + 处置建议；只报告零动作）。

## ③ 边界（不做什么）

- 不做 manifest（M1，只互指咬合）；不做批次档（M3）；不做 checklist（M7 废除，语义由本模块六态承接）。
- 不做项目归档档搬迁（`docs/TODO-archive.md` 是项目文档约定，不在本模块）。
- 不承载细节展开（台账条目一行一条——细节进需求档 / 批次档）。

## ④ 验收（逐条可机判）

| # | 判据 | 方式 |
|---|---|---|
| AC-M2-1 | 表含六态 status CHECK + kind CHECK + trigger CHECK | 读 schema / 尝试非法值 |
| AC-M2-2 | 非法 `status` 写入 → 拒（CHECK 生效） | INSERT 非法值 → 期望拒 |
| AC-M2-3 | 计数 = `COUNT` 单源（无 md 计数面） | grep 计数实现 |
| AC-M2-4 | 写命令非主 agent 装配 → 拒 | 非主 agent 写 → 期望拒 |
| AC-M2-5 | `status IN (在途,待核销)` 且 `task_book` 为空 → 拒（咬合） | INSERT 缺 task_book → 期望拒 |
| AC-M2-6 | `node:sqlite` 在 Node 24 可用（无需 `--experimental-sqlite`） | 实跑 import + 建表 |
| AC-M2-7 | 进入「在途」的迁移带 `executor` = 会话 `sessionId`；离开「在途」的迁移 `executor` = NULL | ledgerUpdate 迁移在途 → 行含 executor；→ 待核销 / 已废弃 → executor 为空 |
| AC-M2-8 | `executor` 非空且属主进程已死 → 可见面显示「属主已死，可接手」；探测失败 → 不显示死亡（保守） | 判活展示用例（活 / 死 / 探测失败三态对照） |
| AC-M2-9 | 迁移表外状态迁移 → 拒（行不变）——**原 AC-M2-7 重编承接**（2026-09-21 执行者批，语义零变） | `ledgerUpdate` / `ledgerClose` 目标 / 源态校验 |
| AC-M2-10 | `在途 / 待核销` 行的 `task_book` 指向档不存在 / 不可解析 → 拒（throw，行不变）——**原 AC-M2-8 重编承接**（2026-09-21 执行者批，语义零变） | 写门指针存在性用例（T11–T13） |
| AC-M2-11 | 库键归一：同项目盘符两拼写（`D:\x` / `d:\x`）⇒ `ledgerDbPath` 同库路径；盘符本大写输入键不变（CLI 现状键回归）；键式单源（`ledgerKey` 一处生成——grep 无第二份哈希式） | case 变体同键试例 + 键回归 |
| AC-M2-12 | 存量迁移三件套：`--dry-run` 零写报告（源 / 目标 / 行数 / 备份路径）；`--confirm` 先备份（拷贝 + 读回同计数）后单事务迁入（**12 数据列逐字 + id 重发** · 事务内读回核验）；重跑幂等（0 新增 / 无待迁源）；源回收进 `ledger-trash`（不删） | 迁移用例组（T24–T32） |
| AC-M2-13 | 审计面只读：逐库定性（目标 / 变体源 / 空库 / 不可归因（有行）/ 不可归因（读取失败）/ 不可读（坏档））+ 候选根集合归因；全目录文件集合 / 大小 / mtime 三不变 | 审计用例 |

> AC-M2-6 = KD7 实核（M2 实现前必验；失败则重开存储选型）。

## ⑤ 依赖

- **上游**：无（原 M1 `activeBatch` 指针咬合——2026-09-17 用户裁定撤除；咬合保留面 = 条目 `task_book` ⇄ 批次档状态行，档面直读）。
- **下游**：M4（写门装配）· M8（台账一致性由本模块 schema 承接——`check-ledger` 作废）。

## 需求依据

v2 §5.2（台账）· §5.4（条目字段）· 架构设计 §2.3 E1（表结构 + 两账咬合）· KD1 / KD7。

## 变更记录

- 2026-09-21（**批 LEDGER-EXECUTOR · 需求新增 · 父侧**——承用户 02:37 讨论「实例间互相通讯有意义吗」+ 02:46 批准「P0 马上开始 · P1 记入台账」）：新增 **F-LX1 执行者归属**（schema `executor` 字段 + 进入/离开在途的写入/清除语义 + 可见面判活展示 + 存储零新建）；验收 **AC-M2-7 / AC-M2-8**。痛点实证 = CLI 实例在途 #45/#51 无「谁在做」（台账 #24）。P1（跨实例意图认领层）= 台账 #23（条件触发，缓建）。
- 2026-09-25（**批 ledger-key-normalize · 需求新增 · 父侧**——承用户 04:22 问诊「VSC 端答需求池已清空」+ 04:26 同类审计 + 04:27「修复吧」）：新增 **F-LX2 库键归一与跨端一致**（键式接 `normalizeCwd` + 存量迁移命令面 + 残档审计面）；验收 **AC-M2-11 / AC-M2-12 / AC-M2-13**（同批细化：AC-M2-13 枚举 = 实现六态字面：目标 / 变体源 / 空库 / 不可归因（有行）/ 不可归因（读取失败）/ 不可读（坏档））。
  同时补记 **AC-M2-9 / AC-M2-10**（2026-09-21 执行者批重编承接两行——该批只落 7/8 至本档，9/10 缺位属三账链补齐）。痛点实证 = 同项目双库（`~/.thincoder/ledger/` `02a338af…` 285 行 vs `16012aba…` 28 行 · VSC 小写盘符路径）。批档 = `docs/batches/2026-09-25-ledger-key-normalize.md`。
