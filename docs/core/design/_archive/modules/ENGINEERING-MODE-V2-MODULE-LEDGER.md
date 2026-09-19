# 工程模式 v2 · 模块设计（M2 台账 SQLite）

> 模块划分权威源 = `docs/core/design/ENGINEERING-MODE-V2.md` §2.2（M2）
> 功能规格 = `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-LEDGER.md`
> 写权 = eng-designer（设计档唯一作者）· 建档 2026-09-17（模块设计轮 · 基础族）
> 状态 = 设计就绪待评审（评审发起权在用户）

## 1. 需求层

### 1.1 总体需求（问题陈述）

v1 的 md 台账（`docs/TODO.md` 扫描器）有三处结构性缺陷：**计数漂移**（md 计数与实体条目手工同步，易失配）、**无事务**（勾销 = 编辑文本，半途中断留脏态）、**无枚举约束**（status/kind 是散文字符串，非法值无机械拦截）。本模块换 **SQLite 单表**（`ledger.db`，项目级、不进 git）作待办总账的单一权威源：六态 CHECK 机械锁死、`COUNT` 单源计数、事务保证收口原子。

### 1.2 功能性需求（回指规格 ②功能点）

| # | 功能点 | 规格依据 |
|---|---|---|
| F1 | items 表 schema（单表 + 三 CHECK 枚举 + 时间戳三列） | ②.1 |
| F2 | 六态状态机：待讨论 → 待设计 → 在途 → 待核销 → 已核销；任意态 → 已废弃 | ②.2 |
| F3 | 查询命令（只读，全角色可见）——替代 v1 `/ledger` 读面 | ②.3 |
| F4 | 写命令（仅主 agent 装配） | ②.4 |
| F5 | 归档 = 软删除语义（已核销 / 已废弃 = 状态值，不物理删行） | ②.5 |
| F6 | 计数单源：`COUNT(*)` WHERE status IN 未决四态 | ②.6 |
| F7 | 落点：项目级 `ledger.db`（不进 git） | ②.7 |

### 1.3 非功能需求

| # | 维度 | 标准 |
|---|---|---|
| N1 | 零第三方依赖 | 仅 `node:sqlite`（Node 24 内建，无需 `--experimental-sqlite`——AC-M2-6 / KD7 实核） |
| N2 | 原子收口 | 勾销 = 事务（`BEGIN`/`COMMIT`，失败 `ROLLBACK`） |
| N3 | 可机判 | 枚举由 CHECK 机械锁死（非法值 INSERT 即拒），不靠应用层校验 |
| N4 | 单一权威源 | 计数 = `COUNT` 单源（无 md 计数面）——AC-M2-3 |
| N5 | 端壳零静态 node:sqlite | `ledger.mjs` 由消费侧**动态 import**，不破 W8 契约②（见 §2.4 KD-M2-3） |

### 1.4 范围边界（本模块不做）

- 不做 manifest（M1，只互指咬合）；不做批次档（M3）；不做 checklist（M7 废除，语义由本模块六态承接）。
- 不做项目归档档搬迁（`docs/TODO-archive.md` 是项目文档约定，不在本模块）。
- 不承载细节展开（台账条目一行一条——细节进需求档 / 批次档）。
- **不新增台账展示面形态**：既有 `ledger-surface.mjs` ×3（状态条 + 启动行 + 变化行）**保留**，只迁数据源（md → SQLite），不造新 UI、不删旧 UI（见 §2.4 KD-M2-6）。
- **不做 `check-ledger` 脚本迁移**（该脚本归 M8 机检引擎删除/替换，本模块仅登记死指针耦合——见 §2.5）。

## 2. 设计层

### 2.1 方案与理由

存储选型（SQLite）已在架构 §2.1 选型 #1 裁定（事务 + CHECK 枚举 + COUNT 单源，`node:sqlite` Node 24 内建零依赖），本模块只做 schema / 命令面 / 状态机 / 接线面的落笔。

**核心方案（就机制本身说清为什么）**：

1. **枚举机械锁死用 CHECK（非应用层）**：`kind` / `status` / `trigger` 三枚举写进建表 DDL 的 CHECK 约束——非法值 INSERT 由 SQLite 引擎拒（AC-M2-2），不靠应用层 if。CHECK 字符串用单引号（KD7 实核）。
2. **六态状态机 = status 列取值 + 状态迁移只在写命令内收敛**：查询面只读 status；写命令 `ledgerAdd`（入待讨论）/ `ledgerUpdate`（迁移）/ `ledgerClose`（勾销→已核销 / 撤回→已废弃）收敛迁移，不散落。**允许迁移表**（`ledgerUpdate` 迁移前判，不在表内 → 拒；`ledgerClose` 源态 ∈ {待核销}（勾销）/ 任意（撤回→已废弃）、目标 ∈ {已核销, 已废弃}——源态边同判，不在表内 → 拒）：

   | 现态 | 允许目标态 |
   |---|---|
   | 待讨论 | 待设计 · 已废弃 |
   | 待设计 | 在途 · 已废弃 |
   | 在途 | 待核销 · 已废弃 |
   | 待核销 | 已核销 · 已废弃 |
   | 已核销 | 已废弃（规格 ②.2「任意态 → 已废弃」字面） |
   | 已废弃 | （终态，无出边） |
3. **计数单源 = 一条 `COUNT` 视图逻辑**（`ledgerCount`）：`SELECT COUNT(*) WHERE status IN ('待讨论','待设计','在途','待核销')`——未决四态即「活条目」口径（台账 `--summary` 收口行同口径）。md 计数面随 `scanGroups`/`summarizeLedger` 删除（AC-M2-3 grep 零命中）。
4. **写命令仅主 agent 装配（fail-closed）**：写命令注册在 `assembleFamilyTools` 的 `depthOnly`（depth === 0）分支——子代理（depth > 0）装配面**根本不挂**写命令（AC-M2-4）。查询命令注册在 `assembleBuiltinTools` 全角色面（AC-M2-3）。
5. **归档 = 软删除**：`ledgerClose` 只 UPDATE status + `closed_at`，不 DELETE 行——已核销 / 已废弃是状态值，物理行保留（外部记忆，AC-M2-5 的「task_book 咬合」是反向门槛，见 §2.2）。

### 2.2 架构 / 接口 / 数据流契约

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

**接口（`thincoder-core/ledger.mjs` 重写，替代 v1 md 读面导出）**：

- `LEDGER_DB_REL` = `"ledger.db"`（常量）；`openLedger(cwd)` → `DatabaseSync` 句柄 + `ensureSchema`（幂等建表）。
- `ledgerQuery({ cwd, status, kind, board })` → SELECT 行集（只读，全角色）；`ledgerCount({ cwd })` → `COUNT(*)` WHERE 未决四态（单源）。
- `ledgerAdd({ cwd, row })` → INSERT（写命令，主 agent）；`ledgerUpdate({ cwd, id, patch })` → UPDATE（写命令，主 agent）；`ledgerClose({ cwd, id, status })` → UPDATE status（已核销/已废弃）+ `closed_at`，事务包裹（写命令，主 agent）。

**展示面数据源迁移（`ledger-surface.mjs` ×3 保留，只换源）**：

- **族发现**（`findProject`/`ledgerChildren`/`discoverFamily`）保留，标记从 `docs/TODO.md`（`LEDGER_REL`）改 `ledger.db`（`LEDGER_DB_REL`）——monorepo 多项目聚合**机制**不变；**发现集**随标记变更（行为变更，见 §2.5）。
- **单项目汇总**（`summarizeLedger` md 扫描）→ `ledgerQuery` + `ledgerCount`（SQLite）——启动行 / 变化行 / 状态位三面机制保留，仅数据源换。
- **行龄源**（`blameAges` git blame 行龄）→ SQLite 时间戳（`created_at`/`updated_at` 距今 > `AGING_DAYS`）——`blameAges` 删除（SQLite 路径无 git blame；行为变更显式登记见 §2.5）。
- **通知去重**（`loadNotifyState`/`saveNotifyState`/`notifyKey`/`NOTIFY_FILE`）保留——送达门 / 一次性去重机制不变。
- **scan 形状契约**：`runLedgerScan` 消费的 scan 形状保留（`pool` / `tech` / `aged` / `thresholdReached` / `actionable` / `root` / `name` / `ledger` 字段面）；SQLite 行 → scan 的组装收敛在 `ledger.mjs` 单一函数（`buildScan`：行集 + `ledgerCount` → scan 对象）；格式 helper（`detailScans` / `formatDetailLine` / `formatMarker` / `planChangeLines`）与 `notifyKey` 键语义（`loadNotifyState` / `saveNotifyState`）签名不变。

**命令面接线（替代 v1 读面 + 新增写面）**：

```text
查询命令（全角色）  ← assembleBuiltinTools（thincoder-core/tools/index.mjs） 动态 import ledger.mjs
写命令（仅主 agent） ← assembleFamilyTools（thincoder-core/agent/family-tools.mjs）depthOnly 分支 动态 import ledger.mjs
```

- 动态 import 是**硬约束**：`ledger.mjs` 静态 import `node:sqlite`，若被 `family-tools.mjs` / `tools/index.mjs` 静态 import，会把 `node:sqlite` 拽进端壳静态面——破 W8 契约②（`family-tools.mjs` 本身即动态 import `agent-tools.mjs` 的先例，见 `setup.mjs:111`）。

### 2.3 受影响文件全清单（当前行数 + 预计增量）

| 文件 | 当前行数 | 变更类型 | 预计增量 | 编辑点（函数级） |
|---|---|---|---|---|
| `thincoder-core/ledger.mjs` | 228 | 重写 | 减 ≤60 / 净增 ≤+90（落地约 310） | 删 md 读面（`scanGroups`/`summarizeLedger`/`blameAges`）；族发现标记改 `ledger.db`；新增 `openLedger`/`ensureSchema` + 查询/写命令族 + scan 组装（`buildScan`）；存量导入迁移步骤（一次性，见 §2.5）；通知去重保留；`EMPTY_FAMILY_LINE` 文案收正（`docs/TODO.md` → `ledger.db`） |
| `thincoder-core/ledger-surface.mjs` | 77 | 修改 | 净增 ≤+30 | `runLedgerScan`（:20-51）数据源 `summarizeLedger`/`blameAges` → `ledgerQuery`/`ledgerCount`；启动行 / 变化行 / 送达门 / 状态位机制保留 |
| `thincoder-core/tools/index.mjs` | 74 | 修改 | 净增 ≤+15 | `assembleBuiltinTools`（:56-73 工具族拼装块）追加查询命令（动态 import `../ledger.mjs`，全角色面） |
| `thincoder-core/agent/family-tools.mjs` | 160 | 修改 | 净增 ≤+20 | `assembleFamilyTools` 的 `depthOnly`（depth===0，:132-138）分支追加写命令族（动态 import `../ledger.mjs`） |
| `thincoder-cli/src/tui/ledger-surface.mjs` | 70 | 修改 | 净增 ≤+20 | 端胶水 `runLedgerScan`（:14-45）数据源 `summarizeLedger`/`blameAges` → `ledgerQuery`；`colors` 渲染缝值不变 |
| `thincoder-vscode/src/extension/ledger-surface.mjs` | 119 | 修改 | 净增 ≤+20 | `scanFamily`（:37-45）数据源 `summarizeLedger`/`blameAges` → `ledgerQuery`；`updateItem` 渲染缝值不变 |
| `thincoder-cli/test/ledger-surface.test.mjs` | 335 | 修改（最小重写——批次档 §4 裁定 5 随 M2 实施批） | 减 ≤80 / 净增 ≤+60 | 数据源断言更新（md 夹具 → SQLite 夹具 + 插行）；scan 形状断言保留（§2.2 形状契约） |
| `thincoder-vscode/test/ledger.test.mjs` | 236 | 修改（最小重写——批次档 §4 裁定 5 随 M2 实施批） | 减 ≤50 / 净增 ≤+40 | 数据源断言更新（md 夹具 → SQLite 夹具 + 插行）；scan 形状断言保留 |
| `.gitignore` | 22 | 修改 | 净增 ≤+1 | 补 `ledger.db` 行（规格 ②.7「不进 git」落点） |

**零改（显式标注）**：`thincoder-cli/src/tui/index.mjs`（483，仍挂载 `startLedgerSurface`）、`thincoder-cli/src/tui/render-frame.mjs`（404，仍消费 `state.ledger`）、`thincoder-vscode/src/extension/chat-panel.mjs`（423，仍调 `initLedgerSurface`）——三档消费展示面不变，数据源迁移发生在展示面内部。

**拆分计划（`thincoder-core/ledger.mjs` 228 → 预计 ~310 行，净增上限 +90）**：重写后略超 300 行建议线（非硬限）。若实现期确认 >300，抽 `ledger-db.mjs`（连接 + `ensureSchema` + DDL，~60 行）与 `ledger-cmd.mjs`（查询/写命令族，~90 行），`ledger.mjs` 只留族发现 + scan 组装 + 通知去重 + 格式化 + re-export（~150 行）。

三包其余文件（`ledger-surface.mjs` ×3、`tools/index.mjs`、`family-tools.mjs`）增量均在 300 行建议线下，无拆分需求。

### 2.4 关键决策记录

| # | 决策 | 理由 |
|---|---|---|
| KD-M2-1 | 枚举锁死 = DDL CHECK（非应用层） | 规格 ②.1 + AC-M2-2；SQLite 引擎拒非法值，无应用层漂移面 |
| KD-M2-2 | 写命令注册在 `family-tools.mjs` `depthOnly` 分支，查询命令注册在 `tools/index.mjs` 全角色面 | 规格 ②.3 / ②.4 + AC-M2-4；「仅主 agent 装配」= 子代理装配面不挂写命令，fail-closed |
| KD-M2-3 | `ledger.mjs` 由消费侧**动态 import**（禁止静态 import） | 架构 §2.3 E1 + W8 契约②；`node:sqlite` 静态面进端壳 = 破 W8（先例：`family-tools.mjs` 动态 import `agent-tools.mjs`） |
| KD-M2-4 | 归档 = 软删除（status 值），无物理 DELETE | 规格 ②.5；已核销/已废弃 = 状态值，物理行保留作外部记忆 |
| KD-M2-5 | 计数 = `ledgerCount` 单源 `COUNT(*) WHERE status IN 四态` | 规格 ②.6 + AC-M2-3；替代 v1 md 计数面，`--summary` 收口行同口径 |
| KD-M2-6 | 展示面保留（数据源迁移 md→SQLite），不删不新增 UI | 架构 §2.2 M2 行（`:88`）对 `ledger-surface.mjs` ×3 判「**修改**」（非删除）——展示面（状态条 + 启动行 + 变化行）是常驻通知面，改源即可；不造 SQLite 计数状态条（越范围） |
| KD-M2-7 | 行龄源 = SQLite 时间戳（`created_at`/`updated_at`），弃 git blame | `blameAges` 只对 md 行有意义，SQLite 路径无 md 行；时间戳更可靠（行为变更显式登记见 §2.5） |

### 2.5 与既有纪律冲突核对

- **`check-ledger` 死指针耦合**：`ledger.mjs` 重写后，`scripts/check-ledger.mjs`（`:40-41` 静态 import `scanGroups`/`summarizeLedger`）与 `check-ledger-core.mjs`（`:16-17`）的 import 悬空；`thincoder-cli/test/ledger.test.mjs` 与 `thincoder-vscode/test/ledger-check.test.mjs`（经 `check-ledger.mjs` 引 `runCheck`）同受影响。
  - 这些文件归 **M8 机检引擎**删除/替换（架构 §2.2 M8「check-ledger 作废」），本模块不迁移；✅ **已裁（批次档 §4 裁定 1）：M2 与 M8 同批实施**——台账迁移 + check-ledger 作废同批落地，无悬空窗口。
- **展示面行龄源迁移（行为变更）**：`blameAges`（git blame 行龄）→ SQLite 时间戳（`created_at`/`updated_at`）。老化判据的「距上次编辑」语义变「距建档/更新」——两者都度量「条目挂账多久」，但阈值边界会略有偏移（显式登记；不阻断本批，阈值取值仍 `AGING_DAYS` 30 天）。
- **测试文件归属切分（M2 → M10 依赖）**：`thincoder-cli/test/ledger-surface.test.mjs`（335 行）与 `thincoder-vscode/test/ledger.test.mjs`（236 行）随本模块数据源迁移**失效**——✅ **已裁（批次档 §4 裁定 5）：被破测试最小重写随 M2 实施批落地**（列入本档 §2.3 受影响文件表）；M10 规格依赖已补 M2（`docs/core/requirements/ENGINEERING-MODE-V2-SPEC-TEST-DISCIPLINE.md`）。
- **架构接线表缺口（观察项）**：✅ 已回补——架构 §2.3 E1 接线表（`:88`）M2 行已补 `tools/index.mjs`（查询命令）与 `family-tools.mjs`（写命令）（父侧收正 2026-09-17），本模块清单与架构一致。
- **族发现标记变更（行为变更）**：发现判据从「有 `docs/TODO.md`」改「有 `ledger.db`」；`ledger.db` 惰性创建（首次 `openLedger`）前的项目不可发现；仅含 v1 `TODO.md` 而无 `ledger.db` 的兄弟项目从族聚合消失。消解：随 M2 实施批，各目标项目首次台账访问即生成 `ledger.db`（发现口径收敛）；本仓清单（全仓相对路径条目）不受影响。
- **v1 `docs/TODO.md` 存量条目处置（数据迁移）**：本仓 v1 台账有未决存量（需求池 19 + 技术待办 3——2026-09-17 实测）。**处置 = 一次性导入**（M2 实施批内迁移步骤：重写前以 v1 扫描机读未决条目 → INSERT `ledger.db`，字段照搬、status 原样映射）——未决条目不丢、追踪连续；已核销 / 已废弃条目不迁移（归档档 `docs/TODO-archive.md` 照旧）。导入后 `docs/TODO.md` 的后续处置（清空 / 归档）属项目文档约定（主 agent 收口），不在本模块。

## 3. 测试层

### 3.1 验收标准（逐条回指规格 AC）

| # | 验收标准 | 回指规格 | 可机判 |
|---|---|---|---|
| AC-1 | 表含六态 status CHECK + kind CHECK + trigger CHECK | AC-M2-1 | ✅ 读 `sqlite_master` schema / INSERT 非法值 → 拒 |
| AC-2 | 非法 `status` 写入 → 拒（CHECK 生效） | AC-M2-2 | ✅ INSERT `status='非法'` → 抛 CHECK 异常；INSERT `status=NULL` → 拒（NOT NULL 兜底——CHECK 对 NULL 不判） |
| AC-3 | 计数 = `COUNT` 单源（无 md 计数面） | AC-M2-3 | ✅ grep `scanGroups`/`summarizeLedger` → 零命中；`ledgerCount` 返回未决四态计数 |
| AC-4 | 写命令非主 agent 装配 → 拒 | AC-M2-4 | ✅ depth>0 装配面无写命令；写命令不存在于子代理工具表 |
| AC-5 | `status IN (在途,待核销)` 且 `task_book` 空 → 拒（咬合） | AC-M2-5 | ✅ INSERT `status='在途'` 缺 `task_book` → 抛 CHECK 异常 |
| AC-6 | `node:sqlite` 在 Node 24 可用（无需 `--experimental-sqlite`） | AC-M2-6 | ✅ 实跑 `import 'node:sqlite'` + `DatabaseSync` + 建表（含 `trigger` 裸列——本批设计轮 2026-09-17 实测通过，node:sqlite · Node 24.18）+ 非法值拒（KD7 已核：通过） |
| AC-7 | 迁移表外状态迁移 → 拒 | ②.2 | ✅ `ledgerUpdate` 待讨论→已核销 → 拒（行不变）；`ledgerClose` 目标 ∉ {已核销, 已废弃} → 拒；`ledgerClose` 源态 = 待讨论 → 拒（勾销仅限待核销） |

### 3.2 用例表（正常 / 边界 / 错误）

| # | 场景 | 输入 | 预期输出 |
|---|---|---|---|
| T1 | 正常：入条目 | `ledgerAdd`（待讨论，完整字段） | 新行入表，id 自增 |
| T2 | 正常：状态迁移 | `ledgerUpdate`（待讨论 → 待设计） | status 更新，`updated_at` 刷新 |
| T3 | 正常：勾销 | `ledgerClose`（→ 已核销） | status 变已核销 + `closed_at` 写入，行保留（软删除） |
| T4 | 边界：未决四态计数 | 混入已核销/已废弃行 | `ledgerCount` 只计未决四态 |
| T5 | 边界：`trigger` 可空 | `trigger=NULL` 行 | 写入通过（CHECK `OR trigger IS NULL`） |
| T6 | 错误：非法 status | INSERT `status='进行中'` | CHECK 拒 |
| T7 | 错误：在途缺 task_book | INSERT `status='在途'` 无 `task_book` | CHECK 拒 |
| T8 | 错误：非主 agent 写 | depth>0 装配面调用写命令 | 命令不存在（拒） |
| T9 | 错误：`status` 为 NULL | INSERT 行缺 `status`（NULL） | NOT NULL 拒（CHECK 不拦 NULL——NOT NULL 兜底） |
| T10 | 错误：迁移表外迁移 | `ledgerUpdate`（待讨论 → 已核销） | 拒（迁移表）；行不变 |

## 4. 变更记录

- 2026-09-17（模块设计轮 · 基础族 · eng-designer）：建档——M2 台账 SQLite 模块设计；items 单表 + 三 CHECK 枚举 + 六态状态机；`ledger.mjs` 重写（读面 SQLite 化 + 写命令）；写命令 `depthOnly` 装配、查询命令全角色面；归档软删除 + 计数 COUNT 单源；验收逐条回指 AC-M2-1..6。
- 2026-09-17（修正轮 · 同批 · eng-designer）：展示面 `ledger-surface.mjs` ×3 由「删除」收正为「修改（数据源迁移）」——架构 §2.2 M2 行（`:88`）判「修改」，展示面保留、只换数据源；补 KD-M2-6 / KD-M2-7（行龄源 git blame → 时间戳）；受影响文件表删去 `index.mjs`/`render-frame.mjs`/`chat-panel.mjs`（转零改），补 M2→M10 测试依赖与架构接线表缺口两项观察。
- 2026-09-17（修正轮 · 清理与机检族 · eng-designer）：§2.1 去「方案选型对比」纪律残留——豁免声明改为直接陈述方案与理由（纪律已废：需求档 §6.2「不强制列候选对比」）；方案内容不变。
- 2026-09-17（修正轮 · 评审发现落地 · eng-designer）：#2 DDL `status`/`kind` 补 NOT NULL（同步架构 §2.3 E1）+ AC-2 扩展 + T9 · #6 测试最小重写随 M2 实施批（受影响文件表补两测试档，§2.5 转已裁）· #8 补允许迁移表（§2.1）+ AC-7/T10 · #9 族发现集行为变更登记（§2.5）· #10 受影响文件表补 `.gitignore` · #14 `trigger` 裸列建表实核通过记录（AC-6）· #15 scan 形状契约（§2.2）· #18 v1 `docs/TODO.md` 存量未决条目一次性导入（§2.5）· #19 `EMPTY_FAMILY_LINE` 文案收正 + 增量口径统一（净增 ≤+N）。
