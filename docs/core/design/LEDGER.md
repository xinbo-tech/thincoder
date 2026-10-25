# 台账机制（LEDGER）· 设计

> 板块：工程模式 / 台账——**待办总账单一权威源（SQLite）** + **台账提醒与可见面（FR24 载体面）**。
> **v2**：存储 = **SQLite 单表**（M2 模块设计语义并入本档——就地更新纪律）。
> **F-LX1 执行者归属**：多实例并存下在途条目记「谁在做」+ 可见面判活展示——schema `executor` 列（§2）· 迁移写语义（§3.1）· 判活展示（§7.3.1）；需求层指针 = `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-LEDGER.md` §2.8 · AC-M2-7/8。
> 需求层指针 = `docs/core/requirements/ENGINEERING-MODE-V2.md` §3（M2 台账 SQLite）· §9。
> 兄弟档：`docs/core/design/LEDGER-SELF-CONTAINED.md`（L4「本仓可解析」判据）· `docs/core/design/DOC-DISCIPLINE.md`（机检引擎）· `docs/core/design/BATCH-RECORD.md`（核销同步清单槽位枚举 = `docs/core/design/DOC-DISCIPLINE.md` D7 行）。
> 落点：用户数据目录键控库 `~/.thincoder/ledger/<sha1(项目根)>[:16].db`（SQLite，工作树外——天然不进 git；用户裁定：不在项目目录）· `thincoder-core/ledger-db.mjs`（DDL / 开库 / 幂等迁移）· `ledger-cmd.mjs`（命令族 + 工具定义）· `ledger.mjs`（族发现 / scan 组装 / 判活解析 / 格式 helper + re-export 单源）· `ledger-surface.mjs` ×3（核机制 + CLI / VSC 端胶水——显示面）。

## 1. 机制目标与范围

需求池的诉求：**一眼看出“哪条需求落地了没有”**，无需遍历文档；条目与任务书**指针咬合**——点开即见任务书 §2 与验收结论。

**范围**：schema / 状态机 / 命令面（查询全角色 + 写仅主 agent）/ 归档软删除 / 计数单源 / 展示面（CLI TUI + VSC 状态栏）+ 收口行。

### 1.1 发现的入账范围（判据 A ∥ 判据 B ∥ 范围外处置）

**本节射程**：本节判的是**台账 ∥ 报告里**的发现登记口径——两面对同一动作同判据；报告面的其余纪律不在此另立一套。

**判据 A（入账范围）**：入账范围 = **任务书 / 任务描述**（含其文件清单与验收标准）；范围之外的观察**不写进报告、不入台账、不上报、不动手**。

- **为什么**：台账是待办面——写进去的每一条都会被当成真事排期。范围外的一次扫视判不了真伪，记下来的只是「疑似」；记一条，排期面就脏一条。范围外的问题归拥有它的那一轮处置，不归本任务。
- **何时适用**：任何角色、任何轮次登记新发现之前；观察落在任务书之外（其他模块、他批 / 他层、本仓之外的档、顺带看到的不一致）即适用。
- **怎么算违反**：把范围外的观察写进报告 / 入台账 / 上报 / 动手改（四不各有其一即违反）。**唯一例外**：该观察挡住或推翻当前任务（任务书写明的前提与事实相抵、依赖的档里的说法与代码相抵、任务做不下去）——那是**当前任务受阻**，按「停下上报」办，不算违规。

**判据 B（「发现」= 验证过的）**：没跑过、没顺过完整调用路径的观察**不是发现，是猜测**——不入台账、不写进报告；写进报告或台账的发现须带**读数**（跑出来 / 数出来的值）或**可复现路径**（跑什么、看到什么）。

- **为什么**：猜测与读数在纸面上长得一样，下游分不出——一条没有读数的「发现」会让下一轮把不存在的缺陷当真去修。
- **何时适用**：任何发现进入报告或台账之前；复核存量条目同用——只有推演、没有读数的条目属猜测。
- **怎么算违反**：报告 / 台账里的发现没有读数、没有可复现路径，或只凭一次扫视的印象。

**验收**：无机械判据（明示）——语义判据归设计评审（同型先例 = `DOC-DISCIPLINE.md` §4.4 语义巡检「判据」行）。

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
- **时间戳三列**：`created_at` / `updated_at` / `closed_at`——行龄源 + 软删除落点。
- **落点**：用户数据目录键控库 `~/.thincoder/ledger/<sha1(规范化项目根绝对路径)>[:16].db`（**键契约 = §2.1**）——项目根仅作关联键，**项目内不留任何文件**（无 .gitignore 负担；用户裁定）；惰性创建（首次写面 `openLedger`；读面库不在 = 空账）。
- **executor 列**（F-LX1 · TEXT 可空）：`sessionId` 文本——**schema 锚定零 CHECK**（会话进程 transient，无值域可锁；语义由 §3.1 写语义保证、活性由 §7.3.1 判活消化）；`ledgerAdd` INSERT 不涉（恒入待讨论、executor NULL）。
- **老库兼容与幂等迁移**（§2 逐字 DDL 为**新库**形态；旧 DDL 建的库无 `executor` 列）——`openLedger` 建表后迁移：
  - 预判：`PRAGMA table_info(items)` 判缺列才 `ALTER TABLE items ADD COLUMN executor TEXT`（幂等——二次打开列已在、零动作零副作用）。
  - 并发窗：两实例同时 ALTER，后到者收 SQLite「duplicate column」错——catch 后 `table_info` **复核**：列在 ⇒ 吞（对手实例已迁），列不在 ⇒ 抛真错。
  - 迁移零行损：ADD COLUMN 纯增量，既有行新列取 NULL。

### 2.1 库键契约与归一

**键式（单源 = `ledger-db.mjs` `ledgerKey(root)`）**：

```
key = sha1(normalizeCwd(resolveLedgerRoot(cwd))).slice(0, 16)
```

- **归一步** = `session-slots.mjs` `normalizeCwd`（Windows 盘符统一大写——**盘符步 = `normalizeCwd` 直调**；分隔符折叠自持）——跨端契约「两端同 cwd 同一 hash」；同契约消费面 = session / checkpoint / traces / peers。
- **`resolve()` 既有规范化**覆盖分隔符（`/`→`\`）· 点段折叠 · 去尾斜杠——归一函数只补**盘符大小写**一维；残差即该断口（VSC `uri.fsPath` 小写盘符 vs CLI `process.cwd()` 大写）。
- **键不变性**：盘符本已大写（CLI 侧）⇒ 归一恒等 ⇒ **CLI 现状键零变**；小写盘符（VSC 侧）并入同键 ⇒ 两端同库。判据 = AC-M2-11。
- **级联面**：`findProject` / `discoverFamily` / `buildScan` 全链随键收敛——**不新增归一函数、不改各调用点**（键只在 `ledgerKey` 一处生成）。
- **单源判据射程**（AC-M2-11 第三分句）：grep 域限**台账键生成面**（`ledgerKey` 所在链）——他面哈希（会话 / checkpoint / 迁移报告等合法同形哈希）**不属本判据**。
- **根解析面（读写同一推导）**：**项目根 = 自「动作目标路径」（目录 = 自身；文件 = 其所在目录；缺省 = 会话锚）沿祖先链取的最近一个「已注册」目录——上溯以会话锚为界、越界即停；不向下取根**——读写**同一判据、同一实现**（判据本体 = `manifest-discovery.mjs` `owningProject`；本档 `resolveLedgerRoot` = 加 `basis` 的形状包装——§3.8「入口表」）。
  - **「已注册」判据（唯一 · 可观测事实）**：该目录**带项目声明档 `PROJECT-MANIFEST.json`**（档在盘）。
  - **台账无第二定义**：项目 = 带 manifest 的目录（`docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MANIFEST.md:68`）——**库在盘不算项目**（库随根走，根不由库定义：「有库无档」的目录 ⇒ 无根 ⇒ 报明）。
    - **三态读数 / 起点 / 无根（`null`）契约 / 边界 = §3.8**（本面只立判据）。
  - **键式随之单源**：`key = sha1(normalizeCwd(resolveLedgerRoot(cwd))).slice(0, 16)`——`ledgerKey` 本体零改（输入恒为根）；盘符本大写 ⇒ CLI 现状键恒等零变。
  - **族发现 ∥ 标记面**：`findProject` 走同一单源、**无选项参数**——容器锚 ∥ 工作区锚 ⇒ 返回 `null` ⇒ 族发现按容器形（**族求和**——§7.2 · AC-M2-18 / AC-M2-19 **零改**）；不存在「调用方自选行为」的开关（起点 / 无根契约 = §3.8）。
- **「工作区根不充当项目」**：锚 = 工作区（`projectRootView` `workspace`——锚自身无档 ∧ 直接子目录中带档者 ≥2）⇒ **该锚不作根**；族发现面按容器形（**零改**）；**写面无根 ⇒ 报明**（**不落锚、不择子目录**——§3.8「无根契约」）。

**不做（边界）**：`realpath` / 符号链接解析；**非盘符段大小写折叠**（POSIX 大小写敏感 + origin 语义——同 `MEMORY.md` §6.11「不做」）；别名路径（subst / junction / 8.3 短名 = 已知限制）。

**路径串等值比较边界（登记 · VSC 侧 `===`）**：台账链路现存字符串等值比较**三处**——`ledger.mjs` `scopeMarkerOf` 范围滤取 `scan.root === family.current.root`（现盘 `:166`——实现式 = 解构后 `s?.root === currentRoot`，本写法为近似形）；`ledger.mjs` `discoverFamily` 的 `p.root !== current.root`，

`ledger-surface.mjs`（核与 VSC 两份）的 `s.root === family.current.root`。
三处均出自**同一 anchor 的单进程同源谱系**，不跨端比较裸路径串；跨端一致性只经**库键**承载。
判定 = 零缺陷、零代码改；守卫 = 新增比较点不得跨端直比裸路径串（须经 `normalizeCwd`）。**验证**：零代码改 ⇒ **无独立守卫用例**——验证 = 静态审计在册（本段）；T22 = **间接守卫**（级联面同契约下游回归：`findProject` 同键——非各 `===` 点的直测）。

**指针**：导出契约 = §7.1；验收 = §8 AC-M2-11 ∥ AC-M2-17（根解析面）；存量收正 = §2.2。

### 2.2 存量迁移（同项目变体键合并 · 命令面）

**命令面**（核内实现 `ledger-migrate.mjs` + CLI 子命令——先例 = `session gc` 的 `--dry-run` / `--confirm` 双档）：

| 命令 | 语义 |
|---|---|
| `thincoder ledger migrate --dry-run` | 只读报告：目标库（键 / 路径 / 行数——**缺档 ⇒ 标「拟建（0 行）」**；**不可读 ⇒ 标「不可读」且 confirm 面将拒跑（fail-closed）、迁移后计数以 `?` 占位**）· 变体源候选（逐源行数 + 状态分布 + mtime；**源不就绪（不可读 / 无 `items` 表 / 缺列）⇒ 行内标「⚠ <拒因>（confirm 面将拒跑）」**）· 计划动作（备份路径 / 拟迁行数 / 迁移后计数）· **指针读数旗**（迁入行携 `task_book` 而解析不成立 ∥ 档不在盘 ⇒ 行内标旗——**读数非门**：该行后续更新零阻，见 §6.1 口径 5）。零写。 |
| `thincoder ledger migrate --confirm` | 执行六步（下）。执行主体 = **父侧 ops**（用户在场；先例 = memory origin 数据面「父侧 ops · 子代理零触碰」）；实施轮自动化面 = `_setLedgerDirForTest` 临时目录夹具。 |
| `thincoder ledger audit` | 只读全目录分类报告（存量残档审计载体——逐键定性 + 处置建议）。 |

**变体键枚举法（单源 = `legacyKeyVariants(root)`）**：候选 = 项目根**盘符大小写翻转拼写**的**原样 `sha1[:16]`**（先例 = `session-migrate.mjs`「盘符两形都试」）。非盘符段不生成变体（§2.1 不做）。

显式 `--from <key>` = **补充源**（用户已知键并入枚举候选、去重）——**取值必须为 16 位小写十六进制键形**（`/^[0-9a-f]{16}$/`，判在目录拼接之前 ⇒ 路径形 / 越目录形取值不落台账目录外档）；**非法键形 / 指名键无对应库 / 不可开 ⇒ 拒跑**（fail-closed，零写；显式指名不静默跳过）。目标键 = `ledgerKey(root)`（归一形）。

**执行六步（`--confirm`）**：

1. **备份（不可省）**：目标库 + 全部源库**文件拷贝**进 `~/.thincoder/ledger-backup/<YYYYMMDD-HHmmss>/`——**备份 / 回收目录 = `ledgerDirPath()` 的兄弟位**（同派生于可覆盖基；`_setLedgerDirForTest` 覆盖后二者同随 ⇒ 夹具根外零写）；**目标库缺档态**：目标键库不存在 ⇒ 视为空目标（0 行、无可备档——报告标「拟建」），迁入步建库建表；读回判据 = 逐档可开 ∧ `COUNT(*)` 同源；失败 ⇒ 拒跑（零写）。
 2. **源就绪与列集判**：源可开 ∧ 含 `items` 表 ∧ **13 数据列核对**（`PRAGMA table_info(items)`）——**缺 `executor` ∥ 缺 `resume_when`**（旧列态；**容忍集 = `{executor, resume_when}`**——两列均为后加可空列）⇒ 该列按 **NULL 映射**照迁；**缺其余任一数据列** ⇒ 拒（列集不可归因，fail-closed）；带 `-wal` / `-shm` 伴生档的源 ⇒ **拒**（fail-closed——单档回收会丢未 checkpoint 数据）。
3. **单事务迁入**：`BEGIN` → 逐行 INSERT（**重发新 id**——目标 `INTEGER PRIMARY KEY` 自增；映射 `源id → 新id` 由 `lastInsertRowid` 采集）→ **事务内读回核验**（逐行 **13 数据列**与源等值——**不含 id**（id 重发）∧ 目标既有行不动）→ `COMMIT`；任一步失败 ⇒ `ROLLBACK`（措辞二分支：既有目标「目标零变、源零动」/ 新建目标「目标零行变、源零动（目标档为本次新建——ROLLBACK 后 0 行空库档残留在原路径）」）。
连接设 `PRAGMA busy_timeout = 3000`（先例 = `memory/schema.mjs` 同值）；忙 ⇒ 明示「另一实例占用」拒跑。
4. **回收源**：源库 rename 进 `~/.thincoder/ledger-trash/<批次>/`（**同可覆盖基**——见步 1；**不 unlink**——先例 = session-gc `sessions-trash`）。
5. **报告**：`ledger-backup/<批次>/migrate-report.json`——迁前 / 迁后计数、逐源逐行 id 映射、跳过行、旗标。
6. **汇总输出**：迁入行数 / 跳过数 / 迁移后目标计数 / 备份与回收路径。

**幂等护栏**：INSERT 前按**全字段等值**跳过目标已有行（崩溃窗重跑不重复）；重跑时源已回收 ⇒ 报「无待迁源」（exit 0）。

**语义保全**：**13 数据列逐字复制**（kind / status / title / board / req_doc / task_book / evidence / trigger / executor / created_at / updated_at / closed_at / resume_when——**不含 id**）；**id 重发**（两库 id 空间重叠——保留原 id 必撞；外部可回查面 = 报告映射 + 源库留档）；零字段改写、零状态改写。**等值比对列集** = 该 13 列（不含 id）。

**审计面（`thincoder ledger audit`）**：逐 `*.db` 出 `{键, 文件, 大小, mtime, 行数, 状态分布, 定性}`；定性枚举 = `目标库` / `变体源` / `空库` / `不可归因（有行）` / `不可归因（读取失败）` / `不可读（坏档）`。

**读取失败态**（并发删除 / 不可 `stat`）该档大小 / mtime / 行数记空（输出 `—` / `?` 占位）、**按档报告不抛**（整命令不中断）。归因法 = **候选根集合**（当前锚项目 + `--root` 追加）的变体键匹配（sha1 不可逆——只做候选生成，不做启发式）。**处置建议**（**只报告零动作**）：非目标 / 非源者保持原位；空库与夹具残库建议**回收目录**而非删。

**边界**：不做跨项目全量一条命令迁移（逐项目锚定）；不自动执行（需 `--confirm`）；不删除存量残档（只报告 + 建议）；不动其他用户态面（sessions / checkpoints / memory / `ledger-notify.json` 历史存量档——零读写）；不做自动回滚（回退 = 从备份拷回 + 重开校验，手工步）。

**指针**：验收 = §8 AC-M2-12 / AC-M2-13 · 用例 T24–T32；CLI 接线 = `thincoder-cli/bin/thincoder.mjs` `case "ledger"`；首跑检测提示（F-LX3）。

## 3. 状态机（六态 + 迁移表）

六态：待讨论 → 待设计 → 在途 → 待核销 → 已核销；任意态 → 已废弃。状态迁移**只在写命令内收敛**（`ledgerAdd` 入待讨论 / `ledgerUpdate` 迁移 / `ledgerClose` 核销→已核销、撤回→已废弃），查询面只读 status。

**收口两源**：已核销的来源 = 待核销（勾销）· **待讨论 / 待设计（追认核销——行 `evidence` 非空，缺 / 全空白则拒）**；**在途 → 已核销 不可跳**（仍经 待核销）。撤回与 `ledger`（update）迁移表零改。
失败文案（逐字——机检断言）：源态不许核销 ⇒ `ledgerClose：核销仅限 待讨论 / 待设计 / 待核销（现态 <X>）`；追认缺 `evidence` ⇒ `ledgerClose：追认核销须带 evidence（现态 <X>）`。

**核销标记门**（轻通道轮次行——判据单源 = `docs/core/design/LIGHT-CHANNEL.md` §2.5）：写入 `已核销` 的三径（`ledgerClose` 单行 ∥ `ledgerCloseBatch` ∥ `ledgerUpdate` 迁移——均经逐行共函数 `applyRowClose` / `applyRowUpdate`）判**结果行标题**携「收尾链待跑」⇒ 拒（批量径落 `skipped` 点名）；撤回（→ 已废弃）不拦。

失败文案（逐字——机检断言）：`ledgerClose：行标题仍携「收尾链待跑」——收尾链未跑完，不许核销（先跑收尾全链，再由父侧清标记）`（update 径前缀 `ledgerUpdate：`、余同）。
标记字面单源 = `ledger-db.mjs` `ROUND_MARKER`。

**允许迁移表**（`ledgerUpdate` 迁移前判；表外 → 拒，行不变）：

| 现态 | 允许目标态 |
|---|---|
| 待讨论 | 待设计 · 已废弃 |
| 待设计 | 在途 · 已废弃 |
| 在途 | 待核销 · 已废弃 |
| 待核销 | 已核销 · 已废弃 |
| 已核销 | 已废弃 |
| 已废弃 | （终态，无出边） |

### 3.1 executor 迁移写语义（F-LX1）

**判位与判序**（挂 `thincoder-core/ledger-cmd.mjs` `applyRowUpdate` 逐行共函数体内：迁移表判**之后**、写门 `assertTaskBookGate` 与 `UPDATE` **之前**——同函数同层，判序 = 迁移表判 → 核销标记门（§3 收口两源块——目标 = `已核销` 才触）→ 本语义（算 executor 目标值）→ 写门 → UPDATE）：计算结果行状态 `to` 的 executor 目标值，随同一 `UPDATE` 落列。

优先级两分句：**进边 = patch 显式值 > sessionId > 行现值兜底 > NULL**；**出边 = 无条件 NULL**（patch 显式值不复活）。

**`null` 口径**：`executor` 的显式 `null` ≡ **略去**——工具层与缺省同分支（取本会话 sessionId 供值），核内取值链对 `null` / 缺键同判（`??` 形，零改）；「可空字段 `null` ≡ 略去」（§3.2）在本字段上无破例。

1. **进入活跃态**（两枚入边：`待讨论 → 待设计`——**批点火边**；`待设计 → 在途`——实施入边）：`executor = patch.executor ?? sessionId ?? 行现值 ?? NULL`。
   - **点火即落归属**：实操点火 = 推「待设计」（批全程行在「待设计」上过——「在途」步常至收口走账才落）⇒ 只保 `待设计 → 在途` 单边时在飞行 executor 恒 `null`；扩至点火边后在飞行行即携本会话归属。
   - `sessionId` = 调用会话，**函数参数注入**——`ledgerUpdate({ …, executorSessionId })`；工具层由 `ledger`（update）execute **动态 import** `getSessionId()`（`session-slots.mjs`——形如 `{pid}-{ts}-{rand}`）供值（决策 K-LX1：纯函数可测 + 零新静态边）。
   - `patch.executor` = `ledger`（update）参数面新增可选字段（接手改写归属入口——见 5）。
   - **行现值兜底**：`已废弃 → 在途` 重启保留原属主（无新实施迹象时归属不漂——非空即留）。
2. **离开「在途」**（`在途 → 待核销` / `在途 → 已废弃`——迁移表仅此两出边；六态**无回退边**，AC-M2-7「回退清除」子句无表内路径承载 ⇒ 语义由出边清除覆盖）：**无条件置 NULL**——patch 显式传 `executor` 也不复活（出边自动语义压 patch）。
3. **其余情形**（无状态迁移的纯字段更新 / 活跃态出入门之外的迁移——如 `待核销 → 已核销`）：executor 按普通补丁字段语义 `patch.executor ?? 行现值`——既有调用（不带 executor）行为零变。
4. **`ledgerClose` 撤回路径**（任意态 → 已废弃——含在途直撤）：UPDATE 同步 `executor = NULL`；核销路径**两源同式零触碰**——勾销（待核销 → 已核销：executor 已在离场迁移清空）与**追认（待讨论 / 待设计 → 已核销：非在途出边，不属 §3.1 ② 自动清空射程）**；`ledgerAdd` 零变。
5. **接手 = 软语义**（executor 信息性非锁——D-MI6 精神）：任何实例经既有 `ledger`（update）改写归属（`executor` 字段或整段状态循环重走）；不设迁移门、不设机械锁。**禁**（父侧必答②裁定）：自动接手 / 自动清 executor / 每回合心跳写共享 SQLite（多进程写竞争 + 绕用户 gate）。

### 3.2 工具层参数守卫

**判据句**：工具层**统一入口 `ledger`**（五 action：写三 = add / update / close ∥ 读二 = query / count）的**运行时入参**在进入核函数**之前**，按**对应 action 声明**（逐字承自前身工具 `parameters`：`required` / `properties[*].type` / `properties[*].enum` / `oneOfRequired`——伪工具对象形）机械校验——非法 ⇒ **拒**（throw；零写、零库动作），文案 = 中文 · 点名字段 + 取值域；

**零 SQLite 原文外泄**（守卫 + 写门判于绑定 / 库动作之前 ⇒ 工具路径下绑定类 / 咬合类原文不可达——缺指针（`null`）/ 空串 `task_book` 经写门拒，其余非法形经 P1–P6 拒；咬合 CHECK = 库级最后防线）。

**统一入口**：适用面 = 统一入口五 action；判据本体（P1–P6 ∥ 字段判据表 ∥ 声明派生）**零改**；**文案前缀渲染规则**（动作级 `ledger(<action>)：` ∥ 入口级 `ledger：`）——本表按该渲染；**入参形态 = 已消费 `action` 的余键**（统一入口判序② 消费——`action` 不入 P2 域）。

**落点**：`thincoder-core/ledger-tools.mjs`（已落——工具定义 + 守卫 helper 的拆分落点）统一入口 `execute` 顶端（守卫 = 工具档单点 helper——`assertToolArgs(tool, args)` **返回**入参对象；消费形 = action 分派后逐 action 以伪工具对象调用 `assertToolArgs(<伪工具>, <余键>)`（已消费 `action`）——helper 机制沿用；「零改」面破例——增布尔分支）；

  判序 = **参数守卫 →（核内）迁移表判 → 写门 → UPDATE**（§3.1 / §6.1 各自判序零变，守卫先于其全部）。

- 理由：① 原始 args（含未知键）只在工具层存在——未知键闭合无法在核函数表达（`row` 已拆解）；② 拒因文案面向**模型**（修向指引），核函数既有文案面向直调面；③ 核函数（`ledgerAdd` / `ledgerUpdate` / `ledgerClose`）函数体零改（「零改」面破例——值计算落核内，与守卫面无关）。

**机制（声明派生——单源）**：守卫消费工具对象自身的 `parameters`——枚举 / 必填 / 类型**不在守卫内复写**（D2：声明即校验，声明改动自动随守卫走）。派生所需两处声明：`ledger(update)` 的声明条目 `status` 属性**补 `enum`**（六态——description 已言明「六态之一」）；**五 action 声明条目** `parameters` 补 `additionalProperties: false`（闭合声明——与「未知键拒」同源宣告；读命令二具同拍）。

**二选一组（`id` ∥ `batch`）**：两字段均**不列裸 `required`**（条件必填无裸必填表达面）——声明面新增组键 `oneOfRequired: [["id","batch"]]`（每子数组内恰携其一），守卫按该键派生组判据 **P7**。
**按形条件判据（`whenPresent` 组键——与 `oneOfRequired` 同层）**：某字段的必填性 ∥ 取值域随本笔另一字段在否而变时，**声明面用 `whenPresent` 表达**，形 =

`whenPresent: [{ when: "<在场字段>", field: "<受判字段>", required: <布尔>, enum: [取值…] }]`。
`when` 字段在本笔入参**在场** ⇒ 该条生效（`required` 按 P3 判、`enum` 按 P5 判并取代基本形取值域）；不在场 ⇒ 本条不生效、按基本形判。
守卫只读声明，**helper 内不写形分支**（与「枚举 / 必填 / 类型不在守卫内复写」同源）。

当下唯一实例 = `ledger(close)`：`whenPresent: [{ when: "batch", field: "status", required: false, enum: ["已核销"] }]`——
批量形 `status` **可空**（缺省 = 勾销单值）· **携则取值域收窄为 `{已核销}`**（§3.3）；字段判据表 `status` 行按形各列一份拒因文案。

**判序与判据**：① 入参缺省 / `null` ⇒ 视作 `{}`；非对象（数组 / 标量）⇒ 拒（P1）。② 未知键 ⇒ 拒（P2——列未知键 + 可用参数集；统一入口面域 = 余键——`action` 已消费）。③ 逐字段（**声明序**）：缺失 ⇒ 拒（P3）→ 类型（非枚举字段）/ 枚举（枚举字段，含错型值）⇒ 拒（P4 / P5）→ `title` 空串 / 全空白 ⇒ 拒（P6）。④ **组判据（声明派生 `oneOfRequired`）**：组内恰携其一 ⇒ 过；同携 / 双缺 ⇒ 拒（P7）。

**字段级 `null` 归属**：必填字段显式 `null` ⇒ 按「缺失」判（P3）；可空字段 `null` ⇒ 放行（`null` ≡ 略去——与 `patch.x ?? 行值` 既有语义同源）。守卫只判不改：零缺省填充、零类型转换、零文本改写（`title` 判空用 trim，落盘取原值）——返回值 = 入参对象（唯一归一 = 判序① 的缺省 / `null` ⇒ `{}`）。读命令二 action 无必填字段（P3 不触）；其拒面 = P1 / P2 / P4 / P5（过滤参数枚举外值——含数组 / 错型值 · `board` / `cwd` 非串 · 未知键 · 入参非对象）。

**文案模板（逐字；前缀 = 工具名`：`——统一入口渲染（动作级 `ledger(<action>)：` ∥ 入口级 `ledger：`）；`<预览>` = `JSON.stringify(值)`，超 80 字符截断加 `…`）**：

| # | 条件 | 文案 |
|---|---|---|
| P1 | 入参非对象 | `<工具>：参数须为对象（收到 <预览>）` |
| P2 | 未知键 | `<工具>：未知参数：<键1> / <键2>（可用参数 = <可用1> / <可用2> / …）` |
| P3 | 必填缺失 | `<工具>：<字段> 缺失（必填<；取值 ∈ {…}>）`——枚举字段带取值域，非枚举必填串带「；非空字符串」，非枚举数字字段仅「必填」 |
| P4 | 类型不符（非枚举字段） | `<工具>：<字段> 非法：<预览>（应为字符串）` / `（应为数字）` / `（应为布尔）` |
| P5 | 枚举不符（含错型值） | `<工具>：<字段> 非法：<预览>（取值 ∈ {…}）` |
| P6 | `title` 空串 / 全空白（两 action 同拒——add 必填面 / update 字段级） | `<工具>：<字段> 为空（必填；非空字符串）`；`ledger(update)` 形 = `<工具>：title 为空（非空字符串）`（字段可空、值不可空） |
| P7 | `id` ∥ `batch` 不恰携其一（同携 / 双缺） | `<工具>：id ∥ batch 须恰携其一（收到 <预览>）` |

**字段判据表**（域 = 各 action 声明面取值；`<v>` = 实际值预览；写三 action 的 `cwd` 均为「可空 · 串」⇒ `<工具>：cwd 非法：<v>（应为字符串）`；文案列 = 统一入口渲染形）：

| 工具 | 字段 | 判据 | 失败文案（逐字） |
|---|---|---|---|
| `ledger(add)` | `kind` | 必填 · ∈ {requirement, tech_todo} | `ledger(add)：kind 缺失（必填；取值 ∈ {requirement, tech_todo}）` · `ledger(add)：kind 非法：<v>（取值 ∈ {requirement, tech_todo}）` |
| `ledger(add)` | `title` | 必填 · 非空串 | `ledger(add)：title 缺失（必填；非空字符串）` · `ledger(add)：title 为空（必填；非空字符串）` · `ledger(add)：title 非法：<v>（应为字符串）` |
| `ledger(add)` | `board` / `req_doc` / `task_book` / `evidence` | 可空 · 串 | `ledger(add)：<字段> 非法：<v>（应为字符串）` |
| `ledger(add)` | `trigger` | 可空 · ∈ {归批, 条件, 认账不排期} | `ledger(add)：trigger 非法：<v>（取值 ∈ {归批, 条件, 认账不排期}）` |
| `ledger(update)` | `id` | **与 `batch` 恰携其一**（组判据 P7——同携 / 双缺 ⇒ 拒）· 数字 | `ledger(update)：id ∥ batch 须恰携其一（收到 <v>）` · `ledger(update)：id 非法：<v>（应为数字）` |
| `ledger(update)` | `status` | 可空 · ∈ 六态 | `ledger(update)：status 非法：<v>（取值 ∈ {待讨论, 待设计, 在途, 待核销, 已核销, 已废弃}）` |
| `ledger(update)` | `title` | 可空 · 串（**值非空串**——空串 / 全空白 ⇒ 拒） | `ledger(update)：title 非法：<v>（应为字符串）` · `ledger(update)：title 为空（非空字符串）` |
| `ledger(update)` | `board` / `req_doc` / `task_book` / `evidence` / `executor` | 可空 · 串 | `ledger(update)：<字段> 非法：<v>（应为字符串）` |
| `ledger(update)` | `evidenceReplace` | 可空 · 布尔（`true` 须与 `evidence` 同传——旗独传 / 新值空白 ⇒ 核面拒；缺省 / `false` = 追加） | `ledger(update)：evidenceReplace 非法：<v>（应为布尔）` |
| `ledger(update)` | `trigger` | 可空 · ∈ {归批, 条件, 认账不排期} | `ledger(update)：trigger 非法：<v>（取值 ∈ {归批, 条件, 认账不排期}）` |
| `ledger(close)` | `id` | **与 `batch` 恰携其一**（组判据 P7——同携 / 双缺 ⇒ 拒）· 数字 | `ledger(close)：id ∥ batch 须恰携其一（收到 <v>）` · `ledger(close)：id 非法：<v>（应为数字）` |
| `ledger(close)` | `status` | **按形判**（声明面 = `whenPresent` 组键·`when: "batch"`）：单行形（携 `id`）**必填** · ∈ {已核销, 已废弃}；批量形（携 `batch`）**可空**（缺省 = 勾销单值）· **携则 ∈ {已核销}** | 单行形：`ledger(close)：status 缺失（必填；取值 ∈ {已核销, 已废弃}）` · `ledger(close)：status 非法：<v>（取值 ∈ {已核销, 已废弃}）`；批量形：`ledger(close)：status 非法：<v>（取值 ∈ {已核销}）` |
| `ledger(close)` | `evidence` | 可空 · 串（**值可空**——追认核销面由 `evidence` 门判**结果值**：缺 / 全空白 ⇒ 拒，文案逐字不变；传入 = 追加缺省） | `ledger(close)：evidence 非法：<v>（应为字符串）` |
| `ledger(close)` | `evidenceReplace` | 同 `ledger(update)`（前缀换 `ledger(close)`） | `ledger(close)：evidenceReplace 非法：<v>（应为布尔）` |
| `ledger(query)` | `status` | 可空 · ∈ 六态 | `ledger(query)：status 非法：<v>（取值 ∈ {待讨论, 待设计, 在途, 待核销, 已核销, 已废弃}）` |
| `ledger(query)` | `kind` | 可空 · ∈ {requirement, tech_todo} | `ledger(query)：kind 非法：<v>（取值 ∈ {requirement, tech_todo}）` |
| `ledger(query)` | `board` / `cwd` / `task_book` | 可空 · 串 | `ledger(query)：<字段> 非法：<v>（应为字符串）` |
| `ledger(query)` | `trigger` | 可空 · ∈ {归批, 条件, 认账不排期} | `ledger(query)：trigger 非法：<v>（取值 ∈ {归批, 条件, 认账不排期}）` |
| `ledger(count)` | `cwd` / `task_book` | 可空 · 串 | `ledger(count)：<字段> 非法：<v>（应为字符串）` |
| `ledger(update)` | `batch` | 可空 · 串（**与 `id` 恰携其一**——同携 / 双缺的判据 / 文案 = `id` 行 P7 组判据） | `ledger(update)：batch 非法：<v>（应为字符串）` |
| `ledger(close)` | `batch` | 同上（前缀换 `ledger(close)`） | `ledger(close)：batch 非法：<v>（应为字符串）` |
| `ledger(add)` / `ledger(update)` | `resume_when` | 可空 · 串（**值非空串**——空串 / 全空白 ⇒ 拒） | `ledger(add)：resume_when 为空（非空字符串）`（update 形前缀换） |

**可空串空串口径**：可空串字段的空串保留既有语义（`patch.x ?? 行值` 下 `""` 为唯一「清值」形——`null` 等同略去）；**例外 = `title` / `task_book` / `evidence` / `resume_when`**（逐项判据与逐字文案 = 本节字段判据表，此处不复写）：`title` 空串 / 全空白两 action 同拒（P6 字段级——无标题即无意义）；

`task_book` 空串 / 全空白由 §6.1 写门承接（**显式空值 ≡ 未指名**——§6.1 口径 3：`在途 / 待核销 / 归批` 行 ⇒ **臂① 拒**；其余状态 = 未指名，放行）；`evidence` 传入 = 追加缺省、空白 ⇒ 拒——清值形退役；`resume_when` 空串 / 全空白 ⇒ 拒（值非空口径同 `title`——§3.4 · 文案 = 字段判据表末行）。

**受影响面（行数 = 现行）**：

- ① 实现：`thincoder-core/ledger-tools.mjs`（已落——五工具定义 + 守卫 helper 三件 + tool 层 `getSessionId` 动态 import；现行行数 = §3.5 表）+ `thincoder-core/ledger-cmd.mjs`（核心函数档；现行行数 = §3.5 表）+ `thincoder-core/ledger.mjs`（re-export 面两源 ±2 行）。
- ② 文档 = 本档。
- ③ 零改面 = `thincoder-core/ledger-db.mjs`（DDL）· `thincoder-core/agent/family-tools.mjs`（装配）· 需求档（`docs/core/requirements/ENGINEERING-MODE-V2-SPEC-LEDGER.md`：补行**已落**——AC-M2-15；设计面零碰）。

**射程**：工具层统一入口 `ledger`（五 action：add / update / close / query / count）。

### 3.3 批级批量迁移与结算

**在册状态（单源）**：本节所述（批级批量迁移与结算）**已落地在册**——落地批 = 台账 #1530 的 P1。
实装坐标 = `thincoder-core/ledger-cmd.mjs:300` `ledgerUpdateBatch` ∥ `:325` `ledgerCloseBatch` ∥ `:288` `resolveBatchRows`（选行单源）∥ `thincoder-core/ledger-tools.mjs:275` / `:281` 按 `batch` 分派（`id` ∥ `batch` 恰携其一 = `:152` / `:168` `oneOfRequired`）。

**判据句**：一个批（批次档）动辄十几行台账行（本仓实测一批 14 行）——**批收口必须一次走完，不随行数相乘**。

**形态**：单行面（`ledger` update / close 携 `id`）**逐字零改**；两**工具 action**（`ledger(update)` / `ledger(close)`）**增可选 `batch` 参**（值形 = 批档指针，与 `task_book` 同形）——**核内函数面单源** = 新导出 `ledgerUpdateBatch` / `ledgerCloseBatch`（§7.1），工具层 `batch` 入参经分发调它们：

| 形 | 语义 |
|---|---|
| `update` + `batch` + `status` | 选出「批 → 行」集（判据见下），**逐行按既有迁移表重判**；表外行 / 门拒行 ⇒ 逐行点名跳过 |
| `update` + `batch`（不携 `status`） | **纯字段补丁**：逐行只写本笔 patch 的字段（`title` / `board` / `req_doc` / `task_book` / `evidence` / `trigger` / `executor`），**`status` 零写**（各行现态不动、迁移表不判）；`executor` = 普通补丁语义（`patch.executor ?? 行现值`——无状态迁移 ⇒ 不自动写 sessionId、不清空，§3.1 ③）；门逐行照判；回执 `status` 键 = `null` |
| `close` + `batch` | **只销已到 `待核销` 的行**（勾销）；`待讨论` / `待设计` / `在途` ⇒ `skipped` 逐行点名；**归档态（`已核销` / `已废弃`）行 ⇒ 静默不计**（不入 `applied`、不入 `skipped`——归档行本非结算对象，点名会让每批重跑刷屏）。**批量形 `status` 可空**（缺省 ⇒ 语义恒 勾销 = `已核销`；携则须 = `已核销`——§3.2 `whenPresent` 组键；拒因文案只列该形取值域） |

**选行判据（单源 = `resolveBatchRows(db, base, batch)`）**：`batch` 值取文件部分（首个 `§` 前子串，trim——§6.1 口径 1 同源），经 `resolveDeclaredRef(base, part)` 解析出基准绝对路径；选**全部** `task_book` 文件部分解析为**同一绝对路径**的行（任意状态、含归档态）。

**`batch` 入参自身门（fail-closed——**本笔指名**判，非结果行门）**：`batch` 值自身须**可解析**（含非空文件部分）∧ 解析后批档**在盘** ⇒ 否则拒（零写）；无匹配行（指针在盘但无行指它）⇒ **不拒**（`applied = []`）。**同一律 = §6.1 臂②**（**本笔指名一个批档 ⇒ 须在盘**）——判的是本笔入参自身（出路恒在本笔入参，不成死锁）；与 §6.2 归批门分属两面（§6.2 判**结果行存在性 + 本笔新指名**，本门判 **`batch` 入参自身**）。

**符号面单源**：批量两函数 = 核内新导出 `ledgerUpdateBatch` / `ledgerCloseBatch`（§7.1）——工具层 `ledger(update)` / `ledger(close)` 的 `batch` 入参经分发调它们；`ledgerUpdate` / `ledgerClose` **签名不含 `batch`**（单行形逐字零改）。

**逐行语义单源**：单行形与批量形**共用同一落笔函数**（`ledgerUpdate` / `ledgerClose` 体内逐行段抽为内部函数 `applyRowUpdate` / `applyRowClose`）——批量只加「选行 + 汇总 + 跳过点名」，**迁移表判 / 写门 / evidence 门逐行照判**（批量不破任一既有门）。

**门拒 ≠ 事务失败（两分句）**：逐行门（迁移表 / §6.1 写门 / evidence 门）抛错 ⇒ **本行捕获**、计入 `skipped`（`why` = 该门拒因文案原文），**其余行照落**；**事务级失败**（`BEGIN` / `COMMIT` 层、库忙、进程中断）⇒ **整批 `ROLLBACK`**（零行改）。故「部分落地」只由逐行门拒产生，「中途失败」不留半批。

**安全阀（不可省 · 禁静默销账）**：**每一枚被跳过的行在回执里逐行点名**（`{ id, from, why }`）——部分落地的批绝不平账。

**回执形**：`{ batch, status, applied: [id…], skipped: [{ id, from, why }] }`；事务包裹（一个 `BEGIN`/`COMMIT`——中途失败整批 ROLLBACK）。

**evidence**：批量形同携可选 `evidence`（`evidenceValue` 同源——逐行追加同一文本；判非空同单行面）。`close --batch` 走**勾销径**（勾销零证据要求）；**追认核销不入批量面**（追认须逐行结账依据，统一文本会造假账）——追认行落 `skipped` 点名，转单行面处理。

**成本（可核）**：N 行批的收口调用数 **改前 2N ⇒ 改后 2**（`update --batch --status 待核销` 1 次 + `close --batch` 1 次）；N=14 实测为据（14 行 = 28 次 ⇒ 2 次）。

### 3.4 条件字段 `resume_when`（`trigger=条件`）

**判据句**：`trigger=条件` 的行须能**一句话写清复启条件**（+ 可选锚）——条件不再埋在 `evidence` 散文里。

**形态**：items 增**可空列** `resume_when TEXT`（自由文本 = 一句话 + 可选**机判锚**）。**可空 ⇒ 存量零破**（老行新列取 NULL）。
**取值形态（条件句字段 + 锚枚举 · 单源）**：`resume_when` = **条件句字段**（自由文本 · 值非空）；句内可选两式**锚 token**（**枚举**，机器可枚举 = 该字段的可判类别）——

① **日期锚** `@YYYY-MM-DD`——**机器可判成立**（该日 ≤ now ⇒ 出口态 `resume_due`，§3.7）；② **事件锚** `@<符号或件名>`——**机器不判成立性**（只作可枚举标记，成立由人核）。
两类皆无 ⇒ 类别 `free`（**可枚举缺席**：机器不判 due，读数面照出「不可机判」）；存量散句行**不强制回填**（零破）——其缺席即 `free`，可被枚举。

**锚判定文法（单一文法 · 单源）**：对 `resume_when` 串**从左到右取首个 `@` 起始 token**（`@` 后非空白连续串；句内位置不限；多锚只取首枚，其余原文照留）——
① token 形合 `^\d{4}-\d{2}-\d{2}$` **且**为真日历日（`Date.parse` 可解析且回写一致）⇒ **日期锚**（机器可判 due）；
② 含 `@` token 而非法日期锚（形不合，或形合而非法日——如 `@2026-02-30` / `@2026-1-1`）⇒ **事件锚**（fail-safe：机器不判 due，零假阳）；

③ 无 `@` token ⇒ `free`。
**在册状态（单源）**：该列**已落地在册**——落地批 = 台账 #1530 的 P5。
实装坐标 = `thincoder-core/ledger-db.mjs:178`（DDL `resume_when TEXT`）∥ `:254` `ensureColumn(db, "resume_when")` ∥ `thincoder-core/ledger-migrate.mjs:20`–`:23` `DATA_COLUMNS` 13 列（`:26` 容忍集含该列）。

**写面**：`ledger` add / update 增可选 `resume_when`（可空 · 串）；空串 / 全空白 ⇒ 拒（值非空口径同 `title`——§3.2 P6 字段级形）。**不强制** `trigger=条件` 行携它（可选——本字段不设闸门）。

**读面**：`query` 行集自然携带（`SELECT *` 纯增量——签名不破）；导出面入 `DATA_COLUMNS`（**已落 · 13 列**——`ledger-migrate.mjs:20`–`:23`）。

**对齐（最近先例）**：批档侧暂缓纪律「暂缓 · 复核条件见批档 §1 状态行」（`docs/core/design/BATCH-RECORD.md` §5.1 L8）——`resume_when` = 同一条件的**账内结构化形**；两处条件文本**各自单源**（账内句不复制批档条件句）。

**schema 版本**：`LEDGER_SCHEMA_VERSION` 1 → 2（新列 = 结构变更 ⇒ 升号——`ledger-db.mjs` 常量注）；老库幂等迁移 `ALTER TABLE items ADD COLUMN resume_when TEXT`（与 `executor` 列同一迁移机制——列迁移抽共件，两列共用一份「复判列在否」逻辑）。

### 3.5 批级操作增量（P1 ∥ P2 指针面 ∥ P4 ∥ P5 ∥ P6）：先例 ∥ 勘察证据 ∥ 受影响面

**在册状态（单源）**：本节登记的增量（P1 ∥ P4 ∥ P5 ∥ P6）**已落地在册**——落地批 = 台账 #1530。

实装坐标 = P1 `thincoder-core/ledger-cmd.mjs:288` / `:300` / `:325` ∥ P4 `:43` / `:101` / `:123`（`EVIDENCE_SOFT_LIMIT` = `thincoder-core/ledger-db.mjs:145`）∥ P5 `thincoder-core/ledger-db.mjs:178` / `:254` ∥ P6 `thincoder-core/ledger-cmd.mjs:98` / `:115` + `thincoder-core/ledger-tools.mjs:180` / `:190`。

**P3（行粒度 ∥ 拆行规则）= 规则面、无代码增量**——判据 = §3.9，本节不另列受影响档。

**落地批（全档单源 = 本表；§6.1 ∥ §6.2 ∥ §8 在册状态同句）**：

| 件（判据面） | 定形 | 落地批 |
|---|---|---|
| **A** 门两臂（§6.1） | 本档 | 台账 **#1550** |
| **归批门**（§6.2 射程扩一枚） | 本档（= 本批 #1530 的 P2(a) 定形：判据 / 文案 / 用例编排） | 台账 **#1550**（与 A 同 helper `assertTaskBookGate`，不可拆落地） |
| **B** 读数 `taskBookOnDisk`（§7.1） | 本档 | 台账 **#1550** |
| **C** 收口重锚（§6.2） | 本档 | 台账 **#1550** |

本批 **#1530** 的实施面 = P1 ∥ P4 ∥ P5 ∥ P6（§3.3 / §3.4 / §5 / §7.1 对应行）——**四项均已落地**（坐标 = 本节「在册状态」行）；**不含上表四件（A / 归批门 / B / C）的实施**——本批对四件只定形，落地批 = #1550。

**先例行（逐项——对齐 ∥ 偏离）**：

- **P1 批级批量（§3.3）**：先例 = 本档单行写命令的「迁移表判 → 写门 → evidence 门」逐行判序（§3.1）；**无同形先例**（「选行 + 汇总 + 跳过点名」在台账面无前例）——对齐 = 既有「逐行照判、门不破」；偏离 = 新增 `batch` 选行与回执汇总（理由 = 批收口调用数 2N ⇒ 2）。
- **P2(a) 归批指针门（§6.2）**：先例 = 本档 §6.1 写门（同 helper `assertTaskBookGate`、同「写入时点门」体例；先例批次 = 台账 #38——§6.1 写门首落 · AC-M2-10）——射程扩一枚（`trigger=归批`），零新机制。**落地批 = #1550**（与 A 两臂同 helper 一并落）；本批 #1530 只定形（上表）。
- **P4 evidence 超限读数（§5）**：先例 = `query` 逐行计算字段 `aged`（本档 §5 老化报告——同形「逐行携、不入库、不入 `DATA_COLUMNS`」；先例批次 = 2026-10-07 批 ledger-tool）。
- **P5 `resume_when`（§3.4）**：先例 = `executor` 可空列（本档 §2——`ALTER` 幂等列迁移，同一机制；先例批次 = executor 可空列 F-LX1——2026-09-21 新增）——已见本节「对齐（最近先例）」行。
- **P6 `task_book` 过滤（§7.1）**：先例 = `ledgerQuery` 既有四枚等值过滤（`status` / `kind` / `board` / `trigger`；先例批次 = 2026-10-07 批 ledger-tool）——本批增第 5 枚，同径（原值等值）。

**勘察证据行**：查过 = 本仓公共源档——`docs/core/design/DOC-DISCIPLINE.md` §4.2.2（声明源解析序）∥ `LEDGER-SELF-CONTAINED.md` §3 / §4.1（L4 声明源例外）∥ `MEMORY.md` §6.15（声明载体单源）∥ `MANIFEST.md` §2.2（`docRoot.batches`）——**相关**（本批 §6.1 口径 4/5 的声明源解析面）。

声明源 = `PROJECT-MANIFEST.json` `index.publicRepos` = **`[]`**（实读 `:61`）⇒ **无仓外声明源可查**（照记）；参考系 = 已移出工作区（`D:\ref\`，树外、不入索引）。**结论 = 无仓外声明源相关**。

**受影响面（现行行数单源 = 本表 · 2026-10-19 node 实读；他节引用现行值一律回指本表，只写本节增量）**：

| 文件 | 现行 | 本批剩余增量（#1550 四件并算） | 终值上界 |
|---|---|---|---|
| `thincoder-core/ledger-cmd.mjs` | 349 | ≤ +40（A 两臂 + 本笔写入面入参 + `taskBookOnDisk` 读数键 + `ledgerBatchRows` / `ledgerReanchorBatch` 两导出） | ≈ 389 |
| `thincoder-core/agent-tools/batch-lifecycle.mjs` | 555（实施后终读 · 2026-10-19） | ≈ +15（出口清单未落半幅——AC-M2-35；C 收口重锚 ≈+25 已落） | ≈ 570 |
| `thincoder-core/ledger-migrate.mjs` | 305 | ≤ +5（旗面文案 + 头注——行为零改） | ≈ 310 |
| `thincoder-core/ledger.mjs` | 159 | ≤ +3（两导出 re-export） | ≈ 162 |
| `thincoder-core/ledger-db.mjs` | 265 | 0（读数不入库；`resume_when` 已落） | 265 |
| `thincoder-core/ledger-tools.mjs` | 321 | 0（`batch` / `task_book` / `resume_when` 声明已落） | 321 |
| `thincoder-core/ledger-read.mjs` | 94 | 0（直引 `DATA_COLUMNS`，随列零改） | 94 |
| `thincoder-core/declaration.mjs` | 379 | 0（`resolveDeclaredRef` 既有导出） | 379 |
| `thincoder-core/tool-docs/ledger.md` | 9 | 换写（query 读数键 + 归批门句；不增行） | 9 |
| `thincoder-cli/src/acp/read-data.mjs` | 147 | 0（`ledgerCount` 三键消费面已落） | 147 |

- **用例**：档 `thincoder-core/test/ledger-batch-ops.test.mjs`（**实施轮新建** ~150–200 行——T92–T98 · T100–T101（含 T94a ∥ T94b）；T99 属 C 落 #1550 档）——**一次性验收（零留档）：随实施轮跑完即删**。
- **文档 / 描述面（模型可见文案——换写）**：本档 §3.3 / §3.4 / §5 / §6.2 / §7.1 / §8 · `thincoder-core/tool-docs/ledger.md`（9 行——`query` 读数键 / `batch` / `task_book` / `resume_when` / count 对象形换写）。
**贴线判（由上表增量直接相加得出 · 两条口径各管各的面）**：`agent-tools/batch-lifecycle.mjs` **现读 555**（实施后终读）+ 剩余 ≤15（出口清单未落半幅）⇒ **≈570**（§3.6 ∥ §3.7 两节增量同档并算），其余档最高 = `ledger-cmd.mjs` **349 + 40 ⇒ ≈389**——全部低于 800 硬线；**500 顾问线**（`AGENTS.md` 全档通用）之上只 `batch-lifecycle.mjs` 一档（现行超 55 行）。

**档位结论 = 两档都不触发拆分**：`batch-lifecycle.mjs` ≈570 < 650 拆分触发；`ledger-cmd.mjs` ≈389 < 500 顾问线。
**拆分触发 = 该档过 650 行**（判据单源 = `docs/core/design/BATCH-RECORD.md` §4.18 贴线判——该档自定的拆分阈值，与 `config.mjs` 同口径）⇒ **本批不拆**。

**顾问项（在册）**：`thincoder-core/agent-tools/batch-lifecycle.mjs` 现读 **555 行** > 500 顾问线——**拆分计划 = 无（未到 650）**：判据 = 拆分触发只为「该档过 650 行」（判据单源 = `docs/core/design/BATCH-RECORD.md` §4.18 贴线判）；555 < 650 ⇒ 不拆、不预留拆分设计；过 650 时按 §4.18 体例拆。

**两口径管辖面（防后来者按 650 反推「500 可越」）**：500 顾问线 / 800 硬线 = `AGENTS.md` 全仓通用档面（软 / 硬）；650 = 批档机制档就「收口体例档多为逐字契约文案」单点放宽的**拆分触发**，**只对 `batch-lifecycle.mjs` 这一档生效，不构成对 500 的先例**——其余档仍按 500 / 800 判。

### 3.6 指针判据重锚增量（§6.1 ∥ §6.2 ∥ §7.1）：先例 ∥ 勘察证据 ∥ 受影响面

**在册状态（单源）**：本节所述（指针判据重锚三件 A / B / C）**未落地在册（在册未落）**——实读证据同 §6.1 / §6.2（`assertTaskBookGate` 旧形 ∥ `ledgerQuery` 无 `taskBookOnDisk` ∥ `batch-lifecycle.mjs` close 径无重锚）；落地批 = 台账 #1550。

**本批增量三件**：**A** 门只判**本笔写入面**（§6.1 两臂——点名非空 / 本笔新指名）∥ **B**「在盘」由门降为**读数**（§7.1 `taskBookOnDisk` 逐行携 + §6.2 收口重锚）∥ **C** 批档收口对未落行**自动重锚**（改 `trigger=条件` + 复启句；`认账不排期` 零触——§6.2）。判据的锚点单源 = §6.1 判据句。

**先例行（逐项——对齐 ∥ 偏离 + 理由）**：

- **判据的锚点（可清理性裁定）**：先例 = `DOC-DISCIPLINE.md` §4.5.1「批档只是批档……批次档必须是能够随时清理掉的」（用户逐字）∥ §4.5.13 规则二「改指 = 写下一个立刻就要断的指针」（批档清理后无「别处」可指）。
  **对齐** = 判据只锚在**命令对象自身可答**的事实（点名非空 / 本笔新指名；实现坐标 = 现门本体 `thincoder-core/ledger-cmd.mjs` `assertTaskBookGate`，已在跑）。
  **偏离** = 不采「把档存在性当门」这一近邻做法（判据形态偏离）——理由 = 档可合法消失 ⇒ 当门则合法账务被拒、而出路正是被拒字段 ⇒ 死锁（用户 2026-10-16 当面指出「盘上的批次档不是稳定存在，不能把这作为判据」）。
- **逐行计算字段（读数形态）**：先例 = 本档 §7.1 `ledgerQuery` 逐行携 `aged`（§5 老化；实现坐标 = `thincoder-core/ledger-cmd.mjs` `ledgerQuery` 的 `aged: isRowAged(r, now)` 计算点；先例批次 = 2026-10-07 批 ledger-tool）∥ `evidenceOversize`（§5 超限读数）——**逐行携、不入库、不入 `DATA_COLUMNS`**。**对齐** = `taskBookOnDisk` 同形（同径计算、存储零变更）。**偏离** = 无。
- **判「本笔入参自身」**：先例 = §3.3 `batch` 入参自身门 ∥ §3.2 工具层参数守卫（判本笔入参；实现坐标 = `thincoder-core/ledger-tools.mjs` `assertToolArgs`，已落——先例批次 = 2026-09-28 守卫族微修批 · 台账 #473）。**对齐** = 门只判本笔自己声明的事实。**偏离** = 门对象由「结果行组合」换成两臂（臂① 结果行存在性 + 臂② 本笔新指名）——理由同首条。
- **收口重锚（C）**：先例 = 批级批量体例（§3.3——取行 + 逐行落笔 + 单事务）∥ `docs/core/design/BATCH-RECORD.md` §4.13（收口回执段：列名单、不阻断冻结）。
  **对齐** = 回执逐行点名 ∥ 不阻断冻结 ∥ 取行单源（实现坐标 = `thincoder-core/agent-tools/batch-lifecycle.mjs` 收口两路共调单源 `reanchorOnClose`——`close` 径 ∥ `status` 写 §1「已收口」径）。

  **偏离** = **只读零写** → **收径自动写行**（放开面 = 收口两路共一处写单源）——理由 = 用户 2026-10-16 10:41 采纳父侧所提 ②（零写报警只报不改，则行仍需人工脱钩）；两项代价用户已知情 = §8 边界 12 修正 + `归批` 意图降级（回执照报）。**被否** = 零写报警 + 建议处置句。
- **无先例宣告**：**A / B = 有本仓在册同形先例**（见上——实现坐标已给）；**C = 本仓首次**（工具径自动写台账行无同形先例——原态「只读零写」是既有边界（`docs/core/design/BATCH-RECORD.md` §8 边界 12），本批放开收口写面即该项代价，用户 2026-10-16 10:41 知情）。

**勘察证据行**：查过 = 本仓公共源档——`docs/core/design/DOC-DISCIPLINE.md` §4.5.1 / §4.5.13（批档可清理性 + 改指禁）∥ `docs/core/design/BATCH-RECORD.md` §4.13 / §8（收口重锚 · 收径写放行）∥ `docs/core/design/LEDGER.md` §5 / §7.1（逐行读数先例）∥ `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-LEDGER.md`（需求面同机制条目）——**相关**。

声明源 = `PROJECT-MANIFEST.json` `index.publicRepos` = **`[]`** ⇒ **无仓外声明源可查**（照记）；参考系 = 已移出工作区（`D:\ref\`，树外、不入索引）。**结论 = 无仓外声明源相关**。

**受影响面（行数 = 现行 · 落笔当刻 node 实读）**：

- **实现**（4 档；本轮 = 设计轮，码面 = 实施轮）：
  - `thincoder-core/ledger-cmd.mjs`（现行 = §3.5——门两臂 + 本笔写入面入参 + `ledgerQuery` 读数键 + 读面导出 `ledgerBatchRows` + 写面导出 `ledgerReanchorBatch`）⇒ 本节增量 +~40
  - `thincoder-core/agent-tools/batch-lifecycle.mjs`（现行 = §3.5——收口两路重锚：取行集 + 调核内重锚单源 + 回执点名；写入经核内单源，工具层零 SQL）⇒ 本节增量 +~25
  - `thincoder-core/ledger-migrate.mjs`（现行 = §3.5——`writeGateFlag` **行为零改**：该旗自始只报告、不拦截（实读 `ledger-migrate.mjs` `writeGateFlag` = 返旗串 ∥ `null`，无写路径分支）；本节只收正**旗面文案 + 头注**，措辞 = 读数语义（旗为读数、不拦任何写入））⇒ 本节增量 ≤ +5（纯文案）
  - `thincoder-core/ledger.mjs`（现行 = §3.5——`ledgerBatchRows` / `ledgerReanchorBatch` re-export）⇒ 本节增量 +3
- **用例**：档 `thincoder-core/test/ledger-pointer-reanchor.test.mjs`（**实施轮新建** ~180–240 行——T99 · T102–T108 · T123–T124；靶向单跑 `node --test test/ledger-pointer-reanchor.test.mjs`）——**一次性验收（零留档）**：随实施轮跑完即删（用户既定「单元测试零留存 · 用毕即删」；该档不复跑、不承载回归）。
- **文档 / 描述面（模型可见文案——换写）**：本档 §2 ∥ §2.2 ∥ §3.2 ∥ §3.4 ∥ §5 ∥ §6.1 ∥ §6.2 ∥ §7.1 ∥ §8 ∥ §9 ∥ 本节 · `thincoder-core/tool-docs/ledger.md`（query 读数键 + 归批门句）。
  另含 `docs/core/design/BATCH-RECORD.md` §4.13 ∥ §4.17 ∥ §7（D-BR29）∥ §8 边界 12 · 需求档 `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-LEDGER.md`（AC-M2-10 / AC-M2-29 / AC-M2-30 / AC-M2-33——**笔归主 agent**）。
- **零改面**（现行行数 = §3.5 表，本节不复写）：`thincoder-core/ledger-db.mjs`（DDL / CHECK / 常量零改，读数不入库）· `thincoder-core/declaration.mjs`（`resolveDeclaredRef` 既有）· `thincoder-core/ledger-tools.mjs`（参数声明面零改）。

**贴线判**：合并口径 = §3.5（同批增量同档并算——本档增量并入后最高 = `batch-lifecycle.mjs` 现读 555（C 已落）+ 15（出口清单未落半幅，§3.7）⇒ ≈570）；拆分触发 = 过 650 行（判据单源 = `docs/core/design/BATCH-RECORD.md` §4.18 贴线判；口径管辖面 = §3.5）⇒ 本档不拆；顾问项登记 = §3.5。

**需求侧对齐注（本轮——笔归主 agent；本席零触 `docs/core/requirements/**`）**：设计侧判据已定，需求侧同形各处应对齐到下列口径（父侧随后落需求面）：

- **AC-M2-10（空值口径）**：应对齐到「**显式空值（`null` / 空串 / 全空白） ≡ 未指名** ⇒ 该判据不触（仅结果行属臂① 射程（`在途 / 待核销 / 归批`）时拒「必填」）；**非空但缺文件部分**（`§2`）⇒ 仍拒」。
- **② 功能点**：应对齐到「`归批` 指针门 / 收口自动重锚 / `taskBookOnDisk` 读数三条**以 AC 承载**（② 不另立条目）」——或补 ② 条目（二选一，由父侧定）。
- **AC-M2-10 ∥ AC-M2-29（「重指照过」句）**：应对齐到「『照过』仅指**旧指针所指档已清不阻该笔写入**；**重指到不在盘档 ⇒ 仍按臂② 拒**」。
- **AC-M2-33（迁移旗半幅）**：需求侧**无需改**（其「迁移 dry-run 同名旗为读数」半幅已在册）；本轮设计侧 AC-M2-33 已补齐对位半幅。

### 3.7 出口面（到期 / 条件成立 ⇒ 分桶读数与轮界清单）

**在册状态（单源）**：**① 机判单源 ∥ ② 盘点读数已落**——落地批 = 台账 #1530 的出口面；

实装坐标 = `thincoder-core/ledger-cmd.mjs:70` `overdueOf` ∥ `:101` `query` 逐行 `overdue` ∥ `:123` `count` 三键 ∥ `thincoder-core/ledger.mjs:103` `buildScan.overdue` ∥ `:121` `scopeMarkerOf` 的 `warn` = `overdue>0 ∨ deadExecutors>0` ∥ `:140` `formatDetailLine` 含 `待处置`。

**③ 轮界清单未落地在册**——实读 `thincoder-core/agent-tools/batch-lifecycle.mjs:504` close 回执无该清单；挂账 = 台账 #1530 出口面剩余（本批实施轮随 C 同径落——§6.2 收口三动作边界）。

**判据句**：池子只进不出的病根在**出口**——入池纪律挡不住（用户 2026-10-16 16:31「堵入口不用想了，不符合模型本能，试过，不成功」）⇒ 出口须做到「**不照做会难看**」：
**超龄行的读数必须必然被看见**，不是「若主 agent 记得自查则可见」。实例证据 = 本会话为恢复会话，主 agent 漏了开局自查，而机器面零提醒 ⇒ 纪律在册、机制为零。
实现三条：① **机判单源**（只由行数据 + 盘面事实，零人记忆）；② **把该数做进既有盘点读数本身**（`count` / `query` / 显示面 L2——不新增一条「自查命令」）；③ **轮界回执附清单**。

**① 机判单源（纯函数 · 单点）**：`overdueOf(row, { now, base })`（新导出，落 `thincoder-core/ledger-cmd.mjs`）——只由行数据 + 盘面事实判；**射程 = 未决四态（`已核销` / `已废弃` ⇒ 恒 `null`——不判）**；返回该行命中的**出口态**（**首中优先** ⇒ 确定性单值；**序 = `resume_due` → `dangling` → `unlabeled` → `aged`**）：

| 出口态 | 判据（只由行数据 ∪ 盘面事实） | 出处 |
|---|---|---|
| `resume_due` | `trigger = 条件` ∧ `resume_when` 日期锚（`@YYYY-MM-DD`）≤ 当日——**比较粒度 = 本地日界**（取 `now` 的本地日期 `YYYY-MM-DD` 与锚日按日比，**当日锚当日即到期**，不按时刻比） | 本设计新增（锚形 = §3.4） |
| `dangling` | `trigger = 归批` ∧ `taskBookOnDisk = false`（所指批档已不在盘） | §6.1 / §7.1 读数（B） |
| `unlabeled` | `trigger IS NULL` ∧ 行龄 > `AGING_DAYS`（30 天） | §5（`NULL` → 未标注）收编 |
| `aged` | 未决四态 ∧ 行龄 > `AGING_DAYS`（30 天） | 既有 `isRowAged`（同档 `:21`）——单源 |

`null` = 无出口态（不判）。四类皆**盘面 / 行值事实**，不含政策判断 ⇒ 机器可判；**机判只产读数与清单，零写**。
**可达性（定序理由）**：`unlabeled`（`trigger IS NULL` ∧ aged）⊆ `aged`（未决 ∧ aged）⇒ **`unlabeled` 必先于 `aged` 判**，否则永不返回；`resume_due` / `dangling` 以 `trigger` 取值互斥（`条件` / `归批`）⇒ 三者相对 `aged` 的先后即上表定序。

**② 做进盘点读数本身（必然可见面）**——单源 = `overdueOf`：

| 面 | 改法 |
|---|---|
| `ledgerCount` | 回报由裸数改 `{ count, overdue, evidenceOversize }`（§7.1）——`overdue` = 未决四态中命中出口态的行数 |
| `ledgerQuery` | 行集逐行携计算字段 `overdue`（值 = 出口态字串 ∥ `null`；不入库、不入 `DATA_COLUMNS`——沿 `aged` 先例） |
| 显示面 L2 | `thincoder-core/ledger.mjs:168` `formatDetailLine` 括号位由 `（老化 <aged>）` 扩为 `（老化 <aged> · 待处置 <overdue>）`——**位扩，非新行**；L1 文本零扩（§7.3.1 契约不动） |
| `buildScan` | 增 `overdue` 键（经 `overdueOf` 单源）；`warn` 聚合口径由 `aged>0 ∨ deadExecutors>0` 扩为 `overdue>0 ∨ deadExecutors>0`（`aged ⊂ overdue` ⇒ 警示色不缩） |
| 收口行 | `--summary` 逐项目 L2 行天然携该数（零新面） |

**为何「必然看见」**：会话开局的状态槽首扫（`runLedgerScan`——端侧自动、**零模型动作**）即渲染 L1/L2 ⇒ 用户面天然出现该数；
`count` 的消费面（收口行 ∥ 显示面 marker ∥ ACP read-data`read-data.mjs:76`）读数一致 ⇒ **任何盘点都带它**；
批收口报告按纪律携台账读数（未决数 前→后）⇒ 超龄数不为 0 而声称「账清了」= **可见的难看**。

**③ 轮界强制清单（批收口回执）**：`batch close`（批档收口径 = `thincoder-core/agent-tools/batch-lifecycle.mjs`）回执附**本批未落行**（§6.2 收口重锚同集）+ **全库超龄行**清单——逐行 `#<id> <出口态> <title>`，附三选一处置指引（办 / 撤 / 降 `认账不排期`——**指引是给行主人的**，机器不代填）。**零写**（除既有 §6.2 重锚）· **不阻断冻结**。`batch create` 不附（开局面由 ② 承担）。

**触点与承接（事实行——防后来者找一个不存在的时点）**：清扫触点三处，**只有两处有机器事件**：

| 触点 | 机器事件 | 出口面承担 |
|---|---|---|
| ① 会话开局 | ✓（会话开 ⇒ 必发生；状态槽首扫） | **主承担**——③ 的活并入此处 |
| ② 批收口 | ✓（批档机制的一步） | 回执清单（③） |
| ③ 会话收尾 | ✗（会话结束那一刻会话内已无人；能看见「上一会话留下什么」的第一个时点 = **下一会话开局**） | **不造事件**——并入 ① |

**无「每轮结束」触点**：用户 2026-10-16 01:10 已自撤「每轮会话语流播报」（F3——理由「太吵」）⇒ 本设计不复活它。

**取舍与代价（如实）**：

1. **既有输出契约变更**：L2 括号位扩一位（§7.3 逐字）+ `warn` 聚合口径扩张 + `buildScan` 形状增键 ⇒ 受影响面 = `formatDetailLine` 单源 + 三端逐字断言（CLI / VSC / 桌面——§7.2 / §7.3.1 既有断言）。
   **为什么值**：这是**唯一不靠模型动作**的必然可见面（状态槽自动渲染）——只在 `count` 加桶仍要有人调 `count`。
2. **消费面**：`ledgerCount` 出参改形 ⇒ 消费面 = 收口行 ∥ 显示面 marker ∥ ACP read-data——三者读同一读数，显示面**零重算**口径不变。
3. **阈值不可配**：`AGING_DAYS` = 30 天常量单源（`ledger-db.mjs:62`），**不做可配开关**——可配会把「同一数在不同端 / 不同人处不一致」带进来，且用户 2026-10-15 已裁「无限机检反感」（可配 = 更多旋钮）。真要改阈值 ⇒ 单点改常量（另轮）。
4. **不自动改行**：机判只产读数与清单；**唯一的机器写 = §6.2 收口重锚（事实句）**——`认账不排期` 机器不代填、`status` 不静默降级（政策判断归行主人——§6.2 既有裁定）。
   「自动降级」在本设计里的落形 = **降为读数桶 + 挂进必然读到的清单**，非静默改行。
5. **残缺（如实）**：③ 无机器事件 ⇒ 会话中途攒下的行只在**下一次开局**被扫（滞后一个会话）；`resume_when` 锚**可选**（无锚 ⇒ 只按 `aged` 判）⇒ 存量散句条件不产生 `resume_due`（不强制回填——§3.4）。

**先例行（逐项——对齐 ∥ 偏离）**：

- **触点挂靠**：先例 = `batch` 工具 close 径既有回执扩展（§6.2 收口重锚——同径、同「回执逐行点名」体例；实现坐标 = `thincoder-core/agent-tools/batch-lifecycle.mjs` close 径）。
  **对齐** = 复用轮界动作；**偏离** = 清单射程由「本批未落行」扩到「全库超龄行」（理由 = 出口面射程是全库池子，非单批）。
- **逐行计算字段**：先例 = `aged` ∥ `evidenceOversize` ∥ `taskBookOnDisk`（逐行携、不入库、不入 `DATA_COLUMNS`；实现坐标 = `ledger-cmd.mjs` `ledgerQuery` 的 `aged: isRowAged(r, now)` 计算点）。**对齐** = 同径；**偏离** = 无。
- **显示面位扩**：先例 = §7.3.1 判活尾段（`executorTail(scan)` 追加段——同 L2 行上后缀位）；实现坐标 = `ledger.mjs` `formatDetailLine`。**对齐** = 同 L2 行、不新行；**偏离** = 尾段条件出现，本设计是**恒显位扩**。
- **「会话开局自动渲染超龄数」= 本仓首次**：既有开局自查是**提示词纪律**（`thincoder-core/prompts/persona-engineering.md` 对应节）+ 收口扫账（同档对应节），**无机器读数面**；本设计把该两条纪律的读数机械落面（纪律本体不改）。
- **会话收尾不造事件**：先例 = `ledgerVariantNotice`（变体键库首跑检测提示——**进程内一次为限**）。**对齐** = 一次性、不造轮次播报；**偏离** = 本设计**连提示都不新增**（只把数做进既有读数）。

**勘察证据行**：查过 = 本仓公共源档——`docs/core/design/PROMPT-SYSTEM.md` §6.20（台账治理纪律增补：开局自查 ∥ 收口扫账）∥ `thincoder-core/prompts/persona-engineering.md` 对应节（两条纪律现形）∥ `docs/core/design/BATCH-RECORD.md` §4.13（收口回执）∥ `docs/core/design/DOC-DISCIPLINE.md` §4.5.1（批档可清理性）——**相关**（触点与承接锚定在既有两条纪律上）。

声明源 = `PROJECT-MANIFEST.json` `index.publicRepos` = **`[]`**（实读 `:61`）⇒ **无仓外声明源可查**（照记）；参考系 = 已移出工作区（`D:\ref\`，树外、不入索引）。**结论 = 无仓外声明源相关**。

**受影响面（行数 = 现行 · 落笔当刻 node 实读）**：

- **实现**（3 档 + 1 描述面）+ **消费面**（1 档）：
  - `thincoder-core/ledger-cmd.mjs`（现行 = §3.5——新导出 `overdueOf` + `ledgerQuery` 读数键 `overdue` + `ledgerCount` 出参改形）⇒ 本节增量 +~30
  - `thincoder-core/ledger.mjs`（现行 = §3.5——`buildScan` 增 `overdue` 键 + `warn` 聚合随扩 + `formatDetailLine` 位扩 + re-export）⇒ 本节增量 +~8
  - `thincoder-core/agent-tools/batch-lifecycle.mjs`（现行 = §3.5——close 径回执附清单；与 §6.2 重锚**同径同回执**，两处增量须并为一次落笔）⇒ 本节增量 +~15
  - `thincoder-core/tool-docs/ledger.md`（9 行——`count` 出参 / `query` 读数键）⇒ 换写
  - `thincoder-cli/src/acp/read-data.mjs`（**147**——`ledger/count` 分支去 `{count:…}` 包装 ⇒ 直传核对象）⇒ ±0（改 1 行）；面 = `ledgerCount` 三键形的 ACP 消费面
- **用例**：档 `thincoder-core/test/ledger-overdue.test.mjs`（**实施轮新建** ~100–150 行——T109–T114；靶向单跑 `node --test test/ledger-overdue.test.mjs`）——一次性验收（零留档：随实施轮跑完即删）。
- **文档 / 描述面（模型可见文案——换写）**：本档 §3.4 ∥ §3.7 ∥ §5 ∥ §6.1 ∥ §6.2 ∥ §7.1 ∥ §7.3 ∥ §8 ∥ §9。
- **零改面**（现行行数 = §3.5 表，本节不复写）：`thincoder-core/ledger-db.mjs`（`AGING_DAYS` 常量单源零改）· `thincoder-core/ledger-tools.mjs`（参数声明面零改）· `thincoder-core/ledger-migrate.mjs`（读数不入 `DATA_COLUMNS`）· 三端渲染面（`ledger-surface.mjs` ×3——端零自算，随核格式化单源）。

**贴线判**：合并口径 = §3.5（本档增量并入后最高 = `batch-lifecycle.mjs` 506 + 25（§3.6）+ 15（本节）⇒ ≈546）；拆分触发 = 过 650 行（判据单源 = `docs/core/design/BATCH-RECORD.md` §4.18 贴线判；口径管辖面 = §3.5）⇒ 本档不拆。

**成本（本档改动引入）**：`ledgerCount` 由 SQL `COUNT(*)`（O(1)）变为**一次 `SELECT` + 逐行判**（O(N) + N 次盘面判）——成本模型与量级判 = §7.2 性能行（单源，本节不重述）。

### 3.8 项目根归属（判据单源 · 三态报明 · 起点 = 目标路径）

**在册状态（单源）**：**已落地在册**——`resolveLedgerRoot`（落地批 = 台账 #1588）；**判据本体真单源 + 不向下取根** = 本批（台账 #1795）。

**判据本体（唯一）**：`thincoder-core/manifest-discovery.mjs` `owningProject(target, boundary)`——自目标沿祖先链取最近带档目录的**唯一实现**。同一个问题「当前项目是哪个」在仓内只有这一处答案；其余入口都是它之上的**形状包装**（`resolveLedgerRoot` 加 `basis` · `projectRootView` 加三态报明 · `resolveProjectRoot` 取其 `.root` · `findProject` 加库位），不含第二套上溯。

**算法（三句）**：

- **起点形**：`target` = 动作目标路径——**目录 = 自身，文件 = 其所在目录**；缺省 = 会话锚。
- **上溯**：`owningProject` 自起点沿祖先链取**最近**带档目录；**上溯以会话锚为界，越界即停**（起点在锚外 ∥ 起点是锚的祖先 ⇒ 无根——与判据本体同界）。
- **不猜**：向上无命中 ⇒ `root` = `null`；**向下只用于描述容器，永不用于取根**——`discoverProjects` 的 `self` / `unique` 读数**不进 `root`**（下辖带档子目录恰一 ∥ 裸仓恰一 ⇒ 仍 `null`）。

**三态（报明读数）**：

| `state` | 条件 | `root` | `candidates` |
|---|---|---|---|
| `ok` | 上溯命中 | 命中的目录 | `[]` |
| `workspace` | 上溯无命中 ∧ `discoverProjects` 报 `workspace`（起点下辖 ≥2 个项目——带档者 ≥2 ∥ 零带档时裸仓 ≥2） | `null` | 按名排序全列 |
| `none` | 其余（含「恰一个子目录」与「裸仓恰一」） | `null` | `[]` |

**不变量（可机判）**：`root` 恒为 `target` 目录自身或其祖先——**永不为 `target` 之下**（含「恰一子项目容器」与「裸仓恰一」两格：`null`，不择子目录）。该不变量使 `projectRootView(p).root` 与「路径是否落在项目内」的判定同值（`outside-project` ∥ 落点判 ∥ 声明面判共用同一读数）。

**谓词**：

- **档臂**：目录带 `PROJECT-MANIFEST.json`（manifest = 项目标记；git 非前提）——实读 `manifest-discovery.mjs:109`。
- 台账面与归属面**同一谓词**（档臂）——台账不引入第二套「什么算项目」（§2.1「台账无第二定义」）。
- 谓词只决定「什么算项目」，**不决定「找不到怎么办」**——无命中都是报明，没有择一。

**入口表（现行坐标 · 全部薄）**：

| 入口 | 坐标 | 形 |
|---|---|---|
| `owningProject(target, boundary)` | `manifest-discovery.mjs:100` | 判据本体（唯一）——祖先链上溯 |
| `projectRootView(cwd)` | `manifest-discovery.mjs:131` | 三态报明：`ok` = 归属命中 ∥ `workspace` = 下辖带档者 ≥2 ∥ `none`（含恰一子目录） |
| `resolveProjectRoot(cwd)` | `manifest-discovery.mjs:145` | 薄委托 `projectRootView(cwd).root` |
| `resolveLedgerRoot(target, boundary)` | `ledger-db.mjs:95` | 形状包装 `owningProject` ⇒ `{ root, basis: 'self' \| 'ancestor' }` ∥ `null` |
| `findProject(anchor)` | `ledger.mjs:49` | 形状包装 ⇒ `{ root, ledger }` ∥ `null` |
| `findGuideRoot(cwd, scopeFiles)` | `advisor/project-context.mjs:54` | **不是**项目根入口：答「评审范围由哪份 `AGENTS.md` 管辖」（标记 = `AGENTS.md`、以 `cwd` 为界）——两问不同，名字不复用 |

**起点（按 action）**：

| action | 起点（优先级从左到右） |
|---|---|
| `add` / `update`（单行 ∥ 批级） | ① 显式 `cwd` 入参 > ② 指针档文件部分（`batch` ∥ `task_book` ∥ `req_doc`）> ③ 会话锚 |
| `close`（单行 ∥ 批级） | ① 显式 `cwd` 入参 > ② 指针档文件部分（`batch` ∥ `task_book`）> ③ 会话锚 |
| `query` / `count` | ① 显式 `cwd` 入参 > ② `task_book` 指针文件部分 > ③ 会话锚（`task_book` 同时是行过滤值） |

- **`cwd` 入参语义**：目标路径（目录或文件）——文件即「本次要改的那个文件」，自其所在目录上溯；**入参在场即起点**（`ledger-tools.mjs:272` / `:278` / `:290` / `:296` / `:298` 逐处 `cwd ?? cwdOf(…指针)`）。
- **指针值 → 起点**：只剥 `§N` 段号（`ledger-tools.mjs:20`–`:23`）；相对路径按会话锚拼接、绝对路径照用（`:34`）——**起点推导不看「绝对」、不看「在盘」**。指针档在盘是 `task_book` / `batch` 的写入门判据（`ledger-cmd.mjs:146` / `:307`），不是起点条件。
- **多起点按优先级择一**：显式 `cwd` 入参在场 ⇒ 以它为起点（它就是本次要改的那个路径）；否则按上表指针 → 会话锚。不自作比对、不自制拒绝形——**回执点名所选起点推出的项目**（`root` 键）。

**无根（`root === null`）契约**：

- **信息不丢**：本体同时给出 `state` 与 `candidates`（容器锚下已注册子目录；≥2 才列）。
- **写面**（`openLedger({create:true})` ∥ `ledgerDbPath`）：抛，文案逐字 = `台账：自 <起点> 未能推导项目根——祖先链无已注册项目（带 PROJECT-MANIFEST.json）`；`state === 'workspace'` 时追加 `；下辖候选项目：<名序全列>`。零落盘、零建库。
- **工具面（模型可见）**：`add` / `update` / `close` / `count` / `query` 起点推导无根 ⇒ **一律抛**——空集与「记到别的项目」在回执上无法区分，静默空集不成立。
- **展示面**（`buildScan` ∥ 族发现）：无根 ⇒ current 项目面 `ledger: null`、该面零行；族面按 `discoverFamily` 枚举后照常出行（`台账：未发现台账。` 仅当族也空）——不取容器为根。

**先例 ∥ 勘察证据行**：

- **判据形态**：先例 = `docs/core/design/MANIFEST.md` §2.9「按用点解析」+ §2.4 KD-M1-30 归属形——同一律（用点路径 → 最近带档祖先，最近者优先）。**对齐**，无偏离。
- **需求出处**：`docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MANIFEST.md` §⑥（`:72` 按用点解析 · `:74` 归属形 · `:76` 发现规则纯向下 = 另问）——本档实现它，不改它。
- **勘察证据**：查过 = `docs/core/design/MANIFEST.md` §2.2 / §2.4 / §2.5 / §2.9 ∥ 本档 §2.1 / §7.2 ∥ 上述需求档 §⑥——**相关**。声明源 = `PROJECT-MANIFEST.json` `index.publicRepos` = **`[]`**（实读）⇒ 无仓外声明源可查；参考系 `D:\ref\` 在工作区外、不入索引。结论 = 无仓外声明源相关。

**受影响面（现行行数 = 本轮 `node` 实测；预期列 = 实施轮目标）**：

| 档 | 现行 | 预期 | 改动面 |
|---|---|---|---|
| `thincoder-core/ledger-db.mjs` | 263 | ≈252 | `resolveLedgerRoot` 改 `owningProject` 薄包装（私有上溯循环删除、签名与 `basis` 语义不变）；`isRegistered` 只留 `ledgerChildren` 消费 |
| `thincoder-core/manifest-discovery.mjs` | 147 | ≈147 | `projectRootView` 取根臂收窄为归属命中（`workspace` / `none` 由 `discoverProjects` 供报明——算法本体零改）；`resolveProjectRoot` 零改（薄委托） |
| `thincoder-core/agent-tools/batch-paths.mjs` | 206 | ≈206 | `:38` 注释随首笔触碰同步（「归属 ∨ 发现」→「归属形 + 起点兜底」）——行为零变 |
| 其余消费面（`ledger.mjs` `findProject` ∥ `ledger-migrate.mjs` ∥ `ledger-variant-notice.mjs` ∥ `agent/light-round.mjs`） | 158 / 306 / 47 / 63 | 零改 | 全部经包装入口取名——无第二判据 |
| `thincoder-core/test/project-root-single-source.test.mjs` | 不在盘 | 新建（PR-1–PR-16） | 一次性单测——随批建 / 跑 / 删 |
| `test/RTM.md` | 119 | 119 | 故事 6 加 6-5 一行（编号先行；用例标题随实施轮 `test('6-5 …')` 落 `test/integration/review-doc-scope.test.mjs`） |
| `docs/core/design/LEDGER.md` | 1065 | 1065 | 本节 ∥ §2.1 ∥ §7.1 ∥ §8（AC-M2-17）∥ §9 随判据改齐 |
| `docs/core/design/MANIFEST.md` | 1198 | ≈1198 | §2.2 契约行 ∥ §2.5 ∥ §2.9 ∥ KD-M1-30 ∥ AC-24 ∥ AC-35 ∥ T45 ∥ T59 随判据改齐 |

- **用例档**：一次性单测 `thincoder-core/test/project-root-single-source.test.mjs`（PR-1–PR-16；零留档——随批建 / 跑 / 删）。靶向单跑 = `node --test thincoder-core/test/project-root-single-source.test.mjs`。
- **文档面**：本档 §2.1 ∥ §3.8 ∥ §7.1（导出面）∥ §7.2 ∥ §8（与本条冲突的判据句随本批改齐）。

**贴线判**：本轮增量后最高 = `ledger-cmd.mjs` ≈350 行（≪ 500 顾问线）⇒ 零拆分义务。

**边界（本面不做）**：向下取根（无候选择一）∥ 起点推导的自动发现（容器锚不猜项目）∥ 发现规则（`discoverProjects` / `discoverRepos`——答「容器下有哪些项目」）∥ 建档流 ∥ 新配置键 ∥ `realpath` / 符号链接解析。

**用例表（一次性单测档 = `thincoder-core/test/project-root-single-source.test.mjs`）**：

| # | 类 | 输入 | 期望 |
|---|---|---|---|
| PR-1 | 正常 | 目标 = 项目内文件 | `state='ok'` ∧ `root` = 项目根 |
| PR-2 | 正常 | 外层带档 ∧ 子目录带档，目标在子项目内 | `root` = 子项目根（近者优先） |
| PR-3 | 边界 | 容器无档 ∧ 恰一子目录带档 | `state='none'` ∧ `root=null` ∧ `resolveProjectRoot` 同 `null`（不向下取根） |
| PR-4 | 边界 | 容器无档 ∧ ≥2 子目录带档 | `state='workspace'` ∧ `root=null` ∧ `candidates` 名序全列 |
| PR-5 | 错误 | 全树无档 | `state='none'` ∧ `root=null`（上溯到盘根停，不抛） |
| PR-6 | 单源 | PR-1–PR-5 五例 | `resolveProjectRoot(t) === projectRootView(t).root` ∧ `resolveLedgerRoot(t)?.root === projectRootView(t).root` 逐例相等（三入口同一判据本体） |
| PR-7 | 台账 | `resolveLedgerRoot(容器)`（恰一已注册子目录） | `null`（不取子目录） |
| PR-8 | 台账·写面 | 容器锚 `ledger add` | 抛无根文案，含起点 + 候选；夹具台账目录零 `.db` |
| PR-9 | 台账·起点 | 锚 = 容器，`task_book` = B 项目内绝对路径 | 行落 B 键控库（`ledgerKey(B 根)`） |
| PR-10 | 台账·起点 | `cwd` 入参 = A ∧ `task_book` 绝对在 B | 起点取显式 `cwd`（优先级最高）；回执 `root` 点名 A 推出的项目——不抛、不比对 |
| PR-11 | 台账·读面 | 容器锚 `ledger query` | 抛无根文案（不再 `[]`）；项目内 `query` 逐字照旧 |
| PR-12 | 回归 | 容器锚 | `findProject` = `null` ∧ `discoverFamily.current` = `null` ∧ 子目录族全列（AC-M2-18 ∥ AC-M2-19 判据零改） |
| PR-13 | 回归 | workspace 锚 + 锚位幽灵键控库 | 不立锚为根（键控库存在不算项目——§2.1「台账无第二定义」） |
| PR-14 | 回归 | `findGuideRoot` 原 `findProjectRoot` 用例 | 行为逐字零变（scope 文件最近 `AGENTS.md`；空 scope ⇒ cwd） |
| PR-15 | 边界 | 锚 = 容器（无档）∧ 恰一裸仓 | `projectRootView` = `none` ∧ `resolveProjectRoot` = `null`（发现读数不进 `root`） |
| PR-16 | 边界 | 目标 = 会话锚的**祖先**且其带档 | `resolveLedgerRoot(target, 锚)` = `null`（不上溯到锚外——与 `owningProject` 同界） |

**集成测试设计（起点 = `test/RTM.md` 故事 6「设计评审的文档范围按项目根受理」——delta 三问）**：

本改动的交互面 = 会话锚 → `projectRootView` / `resolveLedgerRoot` → `owningProject` → 消费点（评审文档范围 `resolveReviewDocPaths`（`review-facts.mjs:80`）· 台账起点）。业务可观察结果 = 同一动作按锚态定去留：项目内照常受理；容器锚（根无档）当场报无根并给期望形，不把下辖子项目当根。

| RTM 行 | 评的组件交互 | 断言的业务可观察结果 | 服务需求 | 本仓入口 | delta |
|---|---|---|---|---|---|
| 6-1 | 评审发起（`documents`）→ `projectRootView(锚)` → `owningProject` 命中 → 文档受理 | 项目内相对 `.md` 被受理，评审读得到 | `docs/core/requirements/ADVISOR-CONVERGENCE.md` §2.3 F18 | 设计评审发起（`advisor` 工具的 `documents`） | 不破（锚在项目内，`ok` 臂读数不变） |
| 6-2 | 同上 → `.md` 类型判 | 项目内代码文件当场拒发 `scope-not-doc`，零实例 | 同上 | 同上 | 不破（判在文档类型面，与取根无关） |
| 6-3 | 绝对形 → `owningProject(文档路径, 锚)` | 项目外文档当场拒发 `outside-project` | 同上 | 同上 | 不破（绝对形不读锚视图——`review-facts.mjs:90`） |
| 6-4 | 文档相对形 → `projectRootView(工作区锚)` ⇒ `workspace` / `root=null` → `no-project-root` | 工作区锚（下辖 ≥2 项目）当场拒发，文案报锚态与期望形 | 同上 | 同上 | 不破（`workspace` 读数与候选列举零改） |
| **6-5 新** | 文档相对形 → `projectRootView(容器锚：根无档、下辖恰一项目)` ⇒ `none` / `root=null` → `no-project-root` | 容器锚当场拒发 `no-project-root`，不把唯一下辖项目当根；文案报期望形 | 同上 + 本节「不变量」 | 同上 | **缺失 → 新增**（本批核心不变量的唯一集成断言行） |

**delta 结论**：破行 **0** · 冗余 **0** · 缺失 **1**（6-5——编号已落 `test/RTM.md` 故事 6；用例标题随实施轮 `test('6-5 …')`）。6-1–6-4 断言的业务可观察结果零改，不修标题、不改判据。

### 3.9 行粒度（一行 = 一个工作对象 · 拆行规则）

**在册状态（单源）**：本节为**规则面**（无代码落地，无机械判据）——落地面 = 台账行的登记与清扫轮；落地批 = 台账 #1530 的 P3。

**判据句**：一条台账行 = **一个可独立闭合的结算单元**（一个工作对象）。`close` 是二值（整行核销 ∥ 整行废弃）——行里混装 N 个工作对象，任一未落则整行永不可闭，账面「未决」与实际工作量脱钩。

**三条规则**：

1. **登记**：一个工作对象一行。同一工作对象的散行归一为族行（判据 = `docs/core/design/PROMPT-SYSTEM.md` §6.23 族行条：成员同批同轮收口——D2 指针，本节不重述）；族行 ≠ 主题伞（主题同、收口不同轮 ⇒ 注记关系，不并）。
2. **清扫（拆行）**：存量麻袋行按**工作对象**拆——判据 = 拆出的每一行能否独立闭合（各自有验收 ∥ 结算路径）；**不按毛病类拆**（按类拆出的行仍跨工作对象、仍闭不上）。成员清单落各行 `title`；拆后原行按处置核销 ∥ 废弃，**不静默删行**。
3. **行内证据**：行内只留「症状 + `file:line` + 指针」，细节进设计档 ∥ 批档（软上限 300 字——§5 `EVIDENCE_SOFT_LIMIT` 读数面，读数非闸门）。

**为什么写进机制档**：这条规则此前只活在逐轮清扫的口径里，于是每轮重新讨论一次「这行该不该拆」；写成判据后，拆与并两向都有一句话可回指——**并**（同对象）与**拆**（异对象）是同一条规则的两面。

**实例（现状证据）**：`#1479`（一行装 8 族 / 40+ 坐标）∥ `#1510`（4 成员并入）——两行即本节要禁的麻袋行：任一成员未落则整行不可闭。

**验收**：**无机械判据（明示）**——「是不是同一个可独立闭合的工作对象」是语义判断，机检只能判形态（`title` 是否携成员清单；`evidence` 是否超限 = §5 读数）。可核半幅 = 清扫轮回执逐行点名拆出集（N 行 → M 行，每行给闭合路径），由设计评审 ∥ 父侧读判。

**先例行（对齐 ∥ 偏离）**：先例 = `docs/core/design/PROMPT-SYSTEM.md` §6.20「单行 = 单结算单元」+ §6.23 族行条（同轴互补：拆 = 不相干项不绑，并 = 同一工作对象不分家；`D-PS33`）。
**对齐** = 同一判据；**偏离** = 本节把它落到台账行的**清扫动作**上（拆哪几行、拆据是什么、拆完怎么落 `title` ∥ `evidence`），并明示无机械判据。

**勘察证据行**：查过 = `docs/core/design/PROMPT-SYSTEM.md` §6.20 ∥ §6.23（`D-PS33`）∥ 本档 §5（evidence 软上限读数）∥ `docs/core/requirements/PROMPT-SYSTEM.md` 功能需求（清账轮三条）——**相关**。
声明源 = `PROJECT-MANIFEST.json` `index.publicRepos` = **`[]`** ⇒ **无仓外声明源可查**（照记）。**结论 = 无仓外声明源相关**。

## 4. 两池分组与计数

- **两池 = kind 枚举**：`requirement`（需求池）/ `tech_todo`（技术待办）——SQLite 行天然分组。
- **计数单源 = `ledgerCount`**（回报 `{ count, overdue, evidenceOversize }`——计数面读 `.count` / `.overdue`，§7.1）：`SELECT COUNT(*) WHERE status IN ('待讨论','待设计','在途','待核销')`——未决四态 = 「活条目」口径（`--summary` 收口行同口径）。计数面 = AC-M2-3（grep `scanGroups`/`summarizeLedger` 零命中）。
- **条目正文一行一条**（语义保留）：SQLite `title` 单行承载，多行细节进需求档 / 批次档（不展开任务细节铁律不变）。

## 5. 归档 / 触发 / 老化

**在册状态（单源）**：本表**五行为未落地在册（在册未落）**——`条件字段 resume_when`（§3.4）∥ `evidence 超限读数`（P4）∥ `出口面`（§3.7）⇒ 落地批 = 台账 **#1530**；`触发字段·归批`（§6.2）∥ `指针在盘读数`（§7.1 · B）⇒ 落地批 = 台账 **#1550**（单源 = §3.5 四件表）；其余四行（归档 ∥ 触发字段 ∥ 老化报告 ∥ 归属与落笔）为实现现状。

| 面 | 契约（v2） |
|---|---|
| **归档** | **软删除**——`ledgerClose` 只 UPDATE `status`（已核销/已废弃）+ `closed_at`（撤回路径另置 `executor = NULL`——§3.1 ④），**不 DELETE 行**（物理行保留作外部记忆）；「已核销/已废弃」= 状态值（`docs/TODO-archive.md` 为历史档不再追加） |
| **触发字段** | `trigger` 三枚举 CHECK：`归批` / `条件` / `认账不排期`（合法选项，区别于遗忘）；取值非三枚举 → INSERT 即拒（CHECK）。`NULL` → 未标注（出口面 `unlabeled` 桶——`trigger IS NULL` ∧ 行龄 > `AGING_DAYS` ⇒ §3.7 判红）——**该半句 = 目标态（未落地在册）** |
| **老化报告（审计模式）** | 行龄源 = SQLite 时间戳（`created_at`/`updated_at` 距今 > `AGING_DAYS`=30 天；SQLite 路径无 md 行、时间戳可靠）。**查询面逐行标记 `aged`**（未决四态 ∧ >30 天） |
| **归属与落笔** | 写命令仅**主 agent** 装配（`family-tools.mjs` depthOnly 分支——子代理装配面不挂写命令，fail-closed）；台账档不入任何子代理 `files` |
| **触发字段·归批**（§6.2） | `trigger=归批` ⇒ `task_book` **必点名**（非空）；**本笔新写** `trigger=归批` ∥ `task_book` ⇒ 该值可解析 ∧ 在盘（写入时点门）；批档此后被清 = 读数（§7.1）不阻账务；批名不再只活在 `evidence` 散文里 |
| **指针在盘读数**（§7.1 · B） | `query` 行集逐行携计算字段 `taskBookOnDisk`（解析成立 ∧ 档在盘；缺指针 / 不可解析 / 档不在盘 ⇒ `false`）——**逐行携、不入库、不入 `DATA_COLUMNS`**（先例 = `aged` / `evidenceOversize`）；**读数非闸门**（不拒任何写入） |
| **条件字段 `resume_when`**（§3.4） | 可空列——`trigger=条件` 行的复启条件（一句话 + 可选锚）；不设闸门 |
| **evidence 超限读数**（P4） | **软上限** `EVIDENCE_SOFT_LIMIT` = 300 字（`ledger-db.mjs` 常量单源——与 `AGING_DAYS` 同居）；**读数非闸门**：`query` 逐行携 `evidenceOversize`、`count` 回报 `evidenceOversize`（超限行数）——写入不拒 |
| **出口面（到期 / 条件成立）**（§3.7） | 机判单源 `overdueOf`——四类出口态**首中优先**（**判定序见 §3.7**；射程 = 未决四态）；**读数非闸门**：`query` 逐行携 `overdue`、`count` 回报 `overdue`、显示面 L2 位扩（`（老化 <aged> · 待处置 <overdue>）`）；**机判零写** |

**暂缓批的行状态**：批档**暂缓**（口径 = `docs/core/design/BATCH-RECORD.md` §5.1 L8——批档侧机读位在 §1 状态行）**不改本库行状态**——挂靠行保持 `在途`（六态零扩 · 迁移表零改 · 写门零触）；暂缓动作的纪律面 = 行 `evidence` 补一行指针「暂缓 · 复核条件见批档 §1 状态行」（条件文本单源 = 批档 §1——本库不复制条件句）；复启 ∕ 核销照既有通道。

## 6. 机检（v2 收编）

- **check-ledger 作废**——台账一致性由 **SQLite CHECK（枚举+咬合）+ `ledgerCount`（计数单源）** 承担；旧脚本 `scripts/check-ledger*.mjs` 归 **M8 机检引擎**删除（架构 §2.2 M8「check-ledger 作废」，无悬空窗口）。
- **L4（本仓可解析）与形态合规 V4** = `docs/core/design/LEDGER-SELF-CONTAINED.md`（跨仓登记面——正交保留）。

### 6.1 写门·指针点名（`task_book` → 批次档）

**在册状态（单源）**：本节的**两臂形态**（判**本笔写入面**）**未落地在册（在册未落）**——实读 `thincoder-core/ledger-cmd.mjs:144` `assertTaskBookGate`（判据体 `:145`–`:151`；三条拒因文案在 `:146` / `:148` / `:151`）仍为旧形（`status ∈ {在途, 待核销}` ⇒ 必填 ∧ 可解析 ∧ **在盘**；无 `trigger=归批` 臂、无「本笔写入面」入参）；

**落地批 = 台账 #1550**（单源 = §3.5 四件表：A 两臂 ∥ B 读数 ∥ C 收口重锚 ∥ 归批门同 helper 一并落；本批 #1530 只定形 P2(a)，不含该门实施）。

**判据句**（架构 E1「咬合判据（两账）」后半幅 · `docs/core/design/ENGINEERING-MODE-V2.md` §2.3）：`task_book` 的判据锚在**命令对象自身能给出答案**的两件事实上——① **点名非空**（`在途 / 待核销` 与 `trigger=归批` 的行必须点名一个任务书）；② **本笔新指名有效**（本笔写进去的那个指针须可解析 ∧ 指向在盘的档）。

**「档此刻在不在盘」不入此判**：批档按设计可随时整体清理（`DOC-DISCIPLINE.md` §4.5.1）——把它当门，合法清档之后凡指该档的行连「改 `status` / 改 `evidence` / 重指」都被拒，而**出路正是被拒的那个字段** ⇒ 死锁；故「在盘」降为**读数**（§7.1 `taskBookOnDisk` · §6.2 收口重锚），门只判**本笔写入面**。

**形态 = 写入时门（两臂，本笔写入面判）**：`thincoder-core/ledger-cmd.mjs` 两条写命令（`ledgerAdd` / `ledgerUpdate`）落盘前按**本笔改动的字段**判：

| 臂 | 触发（本笔写入面） | 判据 |
|---|---|---|
| ① 点名非空 | 结果行 `status ∈ {在途, 待核销}` ∨ 结果行 `trigger = 归批` | 结果行 `task_book` 非空（缺 ⇒ 拒「必填」）；**不判在盘**——存在性是列值事实（不随盘面翻转），DDL 咬合 CHECK 为该半幅的库级防线 |
| ② 新指名有效 | 本笔**新写** `task_book` ∨ 本笔**新写** `trigger = 归批` | 该行绑定的 `task_book`（本笔有 `task_book` 新值取新值，否则取行现值）非空 ∧ 文件部分可解析 ∧ 解析出的档**在盘** |

- 两臂之外**零判**：本笔只改 `status` / `evidence` / 其它字段（不动指针）⇒ 门不触——**旧指针所在的那个档已清掉，不阻任何此类写入**。
- 臂② 判的是**本笔自己指名**的那一笔（此刻这句声明真不真）——同族 = §3.3 `batch` 入参自身门（**本笔指名一个批档 ⇒ 须在盘**）；其出路恒为本笔入参自身（改别的字段 / 改 `trigger` / 重指在盘档）⇒ **不成死锁**。
- 本笔新写空值（`null` / 空串 / 全空白）⇒ **不算「指名」**（臂② 不触）；该行若属臂① 射程（`在途 / 待核销 / 归批`）⇒ 仍拒（点名非空未放宽）——口径单源 = 口径 3。

**落点裁定**：门所在模块 = `thincoder-core/ledger-cmd.mjs`——**`ledgerAdd` / `ledgerUpdate` 两函数体内**，与迁移表判**同函数同层**（判序 = 迁移表判 → 本门 → `UPDATE`）。helper 沿名 `assertTaskBookGate`；入参 = **本笔写入面**（结果行 `status` / `trigger`、`nextTaskBook`、「本笔是否新写 `task_book` / `trigger`」两枚旗）。

覆盖的写入口 = 工具 `ledger`（add / update 两 action——统一入口）；消费侧一律**动态 import 单源档 `thincoder-core/ledger.mjs`**（KD-M2-3——§7.1 的三写命令导出面 = 该档对 `ledger-cmd.mjs` 的 re-export，无第二实现）⇒ 门**不可绕过**。

（`ledgerAdd` 的结果行恒为 `待讨论` ⇒ **臂① 的 `status` 半幅**在该入口当下恒不触发；**臂① 的 `trigger=归批` 半幅（§6.2）与臂② 照判**——add 携 `trigger=归批` ∥ 携 `task_book` 即入门；两入口形态统一，为将来「add 带状态」留位。）

**口径（五条）**：

1. **文件部分 = 首个 `§` 之前的子串**（trim 后）。`§` 之后 = 节号 / 注记，**不参与指针判定**（现盘 13 个取值含三形态——无后缀 · `…md§2` · `…md§1.5（括注）`——全按此口径通过）。
2. **解析基准 = `resolveLedgerRoot(cwd)?.root ?? resolve(cwd ?? ".")`**（**= 根推导单源的同一子表达式**——§2.1 / §3.8；解析基准本身不归一）：`resolve(base, 文件部分)`；绝对路径按 Node `path.resolve` 语义原样取用。工作区锚 ∥ 容器锚下基准 = 推导所得项目根（与库根**同源**——工作区抛退役后不存在「锚与根不一致」的例外态；同日同式子站点清单 = §3.8「协调项」）。
3. **缺指针 / 缺文件部分**（口径单源 = **显式空值 ≡ 未指名**）：`task_book == null` / 空串 / 全空白 ⇒ **臂② 不触**（不算「指名」）；该行若属臂① 射程（`在途 / 待核销 / 归批`）⇒ 由臂① 拒（「必填」文案）。**非空但缺文件部分**（如 `§2`——trim 后首个 `§` 前子串为空）⇒ 确属本笔指名而值不可解析 ⇒ **臂② 拒**（fail-closed）。本笔未指名时两者皆不判（存量行零阻）。
4. **声明源候选**：文件部分**首段 = 项目声明的公共仓目录名**（`index.publicRepos`）⇒ 于该声明根解析余段（值形 ∥ 解析单一定义 = `declaredPublicRoots`）——可核 ⇒ 通过；**未声明**的仓外形态照旧拒（fail-closed 零松）；声明根缺位 ⇒ 照旧拒（严）。判据 / 机制 = `DOC-DISCIPLINE.md` §4.2.2 ⑥ ∥ `LEDGER-SELF-CONTAINED.md` §3 L4③（声明源前缀形 = 记录面有界例外的机械面）。
5. **迁移读数同源**：`ledger migrate` 的**指针读数旗**（`thincoder-core/ledger-migrate.mjs` `writeGateFlag`）与本节**同源解析单点** = `resolveDeclaredRef(base, 文件部分)`（`thincoder-core/declaration.mjs` 导出：① 仓根解析 → ② 声明源前缀解析序）；
   **消费关系**：声明源段 **≤ 消费既有解析单一定义 `declaredPublicRoots`（口径 4）**——**不二写**（同源句 = `MEMORY.md` §6.15「三消费面共用（解析层），不得二写」）；**解析序**（同名多仓取声明序首者）单源 = `DOC-DISCIPLINE.md` §4.2.2（`MANIFEST.md` §2.2 同指）。

   同一条 `task_book` 在**写门臂②**与**迁移旗**上同源解析、表述各异：臂② 判**本笔新指名**（不可核 ⇒ 拒）；旗为**读数**（不可核 ∥ 档不在盘 ⇒ 标旗，**不拦任何写入**——见 §2.2）。**既有拒绝面零改**（判据本体 = 口径 1–4 逐字）；实现 = 实施轮。

**射程** = **本笔写入面**（臂① 结果行存在性 / 臂② 本笔新指名）；此后**零判**——指针之外的字段更新（含 `status` 走完 在途 → 待核销 → 已核销 / 改 `evidence`）**永不因指针被拒**。

**失败文案**（逐字；前缀 = **调用函数名**——工具 `ledger`（update）→ 函数 `ledgerUpdate`、`ledger`（add）→ `ledgerAdd`；与同函数既有两条文案（`ledgerUpdate：行 <id> 不存在` / `…不在允许迁移表`）同前缀）：

`ledgerUpdate：task_book 指向的档不存在：<原值>（解析 = <绝对路径>）` · `ledgerUpdate：task_book 不可解析（缺文件部分）：<原值>` · `ledgerUpdate：task_book 必填（在途 / 待核销 / 归批 须携任务书指针）`（缺指针形——`null` 无原值）。
前两句**只出在本笔新指名**时（新写的值不在盘 / 不可解析 ⇒ 拒）；行现值指向已清档而本笔未指名 ⇒ 不判（读数见 §7.1）。

**缺指针文案单源**：上式第三句 = 结果行缺 `task_book` 的**唯一**拒因文案（全档只此一处定义）——`归批` 与 `在途 / 待核销` 是同一门臂① 的三个入触发条件，**不分文案**；§6.2 归批门 ∥ AC-M2-10 ∥ AC-M2-29 ∥ 用例 T106 均引用本句，不另写。

**边界**：① 不做**事后拒写**（存量指针此后失效不阻其字段更新——档消失只体现为读数 `taskBookOnDisk = false`）；② 不做**仓界判**（指针是否落在仓内 = L4 判据 · `docs/core/design/LEDGER-SELF-CONTAINED.md`——本条目不并）；③ 不改 DDL（存在性无 SQLite 表达面——CHECK 读不到 fs）；④ 不做**存量扫描修复**（读数照出，修复走写命令——§6.2 收口重锚）。

### 6.2 归批指针门（`trigger=归批` 咬合 `task_book`）

**在册状态（单源）**：本节所述（归批门 + 收口重锚）**未落地在册（在册未落）**——实读同 §6.1（门旧形）+ `thincoder-core/agent-tools/batch-lifecycle.mjs` close 径无重锚；**落地批 = 台账 #1550**（单源 = §3.5 四件表：A 两臂 ∥ B 读数 ∥ C 收口重锚 ∥ 归批门同 helper 一并落；本批 #1530 只定形 P2(a)——判据 / 文案 / 用例编排）。

**判据句**：`trigger=归批` 的行**必须点名一个批档**（`task_book` 非空）——「批 → 行」反查（§3.3）与「行 → 批」回指（批档头台账行）双向可解；**本笔声明**该归属时还须**此刻真在盘**（判的是本笔自己指名的那一笔）。批档**此后**被整体清理 ⇒ 不阻任何后续账务（读数照出——§7.1 `taskBookOnDisk` · 本节收口重锚）。

**形态 = §6.1 两臂（单源，本节不重述）**：`trigger = 归批` 已并入 §6.1 两臂的触发条件（臂① 结果行 `trigger = 归批` ⇒ 点名非空；臂② 本笔新写 `trigger = 归批` ⇒ 绑定指针有效——表本体即单源）。本节只承载三件增量——① 归批判据句（上）、② 缺指针拒因文案（单源 = §6.1 失败文案，见下）、③ 收口重锚（C，见下）。

**落点**：`thincoder-core/ledger-cmd.mjs` `assertTaskBookGate`（`ledgerAdd` / `ledgerUpdate` 同门——含批量形 `applyRowUpdate`）；解析单点 = `resolveDeclaredRef`（§6.1 口径 4/5 同源，零二写）。

**失败文案**（单源 = §6.1 失败文案，本节不另立）：缺指针形 = §6.1 载的同一句 `task_book 必填（在途 / 待核销 / 归批 须携任务书指针）`；「指向的档不存在」/「不可解析（缺文件部分）」两句同 §6.1 逐字（**只出在本笔新指名时**）。

**射程与出路（本笔写入面）**：带 `trigger=归批` 的行，其**指针之外**的字段更新（改 `status` / 改 `evidence`）零判零阻；指针所指档已清亦不阻。门 = **写入时点门**——不扫存量、不回改存量行；存量 `归批` 行仅在下次被写时受判，判决 = **该笔写入面**。**出路恒为行主人可自决的动作**：改 `trigger`（改指 `条件` / `认账不排期`）∥ 重指在盘档 ⇒ 二者零阻。

**收口重锚（批档侧 · 自动 · C）**：批档收口 = **两路同一单源**——`batch` close ∥ `status` 写 §1「已收口」（两路同过链完整性门 ∥ 文档机检门，并同样冻结档）；两路共用同一 `reanchorOnClose`、**零二写**；次序 = 状态行写盘之后（五件之 5）。

任一路收口 ⇒ 取本批**未落行**（`task_book` 解析同址指本档 ∧ `status ∈ {待讨论, 待设计, 在途}`——**`待核销` 属已落只待结账，不取**：对它写「须另起批次接手」失实，且核销零触指针 ⇒ 无需脱钩）**自动**改 `trigger=条件`，随携复启句（见下）；`trigger = 认账不排期` 的行**零触**（政策判断已由行主人落定）。
收口回执逐行点名所锚行（`#<id> <status> <title>` → `条件`）；冻结照常完成；无未落行 ⇒ 无该段；一次收口只出一份 `[ledger reanchor]` 清单。

**只锚 `条件`，不锚 `认账不排期`**：`认账不排期` = 把未结工作降级为不排期 = **行主人的政策判断**（算不算数 / 放不放下），机器不代填；`条件` 的复启句 = **机械可造的事实句**（原批已收口 ⇒ 须另起批次接手），只陈述已发生的盘面事实、不含政策判断 ⇒ 机器可代填。 **次序假设**：台账核销（`待核销 → 已核销`）与 `batch` close 无先后约束——取行集（`待讨论 / 待设计 / 在途`）不含 `待核销` / `已核销` ⇒ 核销先于 ∥ 晚于 close 皆零触本机制。

**复启句（句形模板 · 单源）**：`原批 <批名> 已收口，须另起批次接手`——`<批名>` = `batch` 值的文件部分（§6.1 口径 1 同源）；**事实陈述，禁携条件判断 ∥ 处置建议**。

**落点** = 行 `resume_when`（§3.4 条件句字段——**已落地在册**：`thincoder-core/ledger-db.mjs:178` DDL ∥ `:254` `ensureColumn` ∥ `ledger-migrate.mjs:20`–`:23` 13 列）——`trigger=条件` 行的条件句落该列，不再埋进 `evidence` 散文（§3.4 判据句）。

**锚文法相容**（§3.4）：复启句无 `@` token ⇒ 按文法判 `free`（合法类别——机器不判 due、读数面照出「不可机判」）⇒ 不产 `resume_due`（零假阳）；**句内禁写 `@`**（写 `@` 即入事件锚/日期锚分支——前者无害、后者假锚）。
**不覆盖行主条件句**：该列现值非空（行主已写复启条件）⇒ 原值不动、复启句改追加 `evidence`；回执点名该形。

**五件（重锚机制必写）**：

1. **幂等**：逐行判**现值**——本行 `trigger = 条件` ⇒ **零写跳过**（计入 `alreadyAnchored`，不入 `reanchored`）⇒ 重锚单源重跑零行改、零额外写（复启句不重复写 ∥ 追加）。
2. **失败语义**：写入 = **单事务**（同 §3.3 体例）——任一步失败 ⇒ 整集 `ROLLBACK` ⇒ 零行改（「行集部分失败」在写层被消除）；**冻结照常完成**（档面写与台账库分属两存储，不做分布式事务——让台账忙否决收口会把批次卡成收不了口的死锁）；失败**不抛**，经返回形 `failed` 项报出（`failed: null` = 常态 ∥ 失败因串，此时 `reanchored = []`），收口回执把它并入同一回执（点名未重锚集 + 失败因），非静默。
3. **执行人 ∥ 授权面**：写 = `batch` 工具**收口两路**（`close` 径 ∥ `status` 写 §1「已收口」径）内**各一次**动作，与冻结同拍；两路共用同一单源 `reanchorOnClose`（`thincoder-core/agent-tools/batch-lifecycle.mjs`——`status` 径调点 `:486` ∥ `close` 径调点 `:520`，定义 `:531`），零复制逻辑；
授权 = 两路收口均仅 depth-0（主 agent 装配面——§4.13 身份判据 ∥ §4.16 普通面 §1 写域）⇒ **不新增授权面**（子代理无收口路径，亦无台账写命令）；落笔 = 核内单源 `ledgerReanchorBatch`（§7.1），工具层不自写 SQL。
4. **不自阻塞证明**：重锚写 `trigger=条件` + 复启句（落 `resume_when`，值非空；现值非空 ⇒ 追加 `evidence`）——**不新写** `task_book`、**不新写** `trigger=归批` ⇒ §6.1 臂②（本笔新指名）**不触**；
`resume_when` 写值非空 ⇒ §3.4 写面（空串 / 全空白 ⇒ 拒）满足；臂① 只判结果行存在性——被选中行恒由**本档 `task_book`** 解析命中（选行判据即它）⇒ `task_book` 非空 ⇒ 臂① 的 `在途 / 待核销` 半幅亦过；DDL 咬合 CHECK 同满足 ⇒ **零拒**。
5. **次序**：重锚 = **收口那一笔**的**全部拒因通过、§1 状态行改写落盘之后**的一次动作——两路同序位：`status` 径调点 `thincoder-core/agent-tools/batch-lifecycle.mjs:486`（状态行写盘 `:478` 之后）· `close` 径调点 `:520`（写盘 `:515` 之后）。
收口判据收敛为单点 `closingValue`（`:471`，链门 `:472` ∥ 机检门 `:475` 同消费）；收口那一笔被任一拒因拒（身份/段域 ∥ 冻结 ∥ 占位残留 ∥ 链完整性门 ∥ 文档机检门）⇒ **台账零写**（不取行、不改行、不落复启句）。
理由 = 被拒的收口没有收口，「原批已收口」在那时是假事实——先跑重锚就把假句写进账。

**读数是常驻检出面**：`taskBookOnDisk` 逐行携（§7.1）——批档可能**不经收口**就被整体清理（清档随时可发生）⇒ 检出**不依赖批档在盘、不依赖收口时点**：`trigger=归批` 过滤 + 读数 `false` 即读出死指针行，修复走写命令（单行面零阻——§6.1 臂② 只管**本笔新指名**）。

**落点与选行单源**：重锚落点 = `thincoder-core/agent-tools/batch-lifecycle.mjs` **收口两路共调的单源 `reanchorOnClose`**（`close` 径 ∥ `status` 写 §1「已收口」径；零复制、零二写）。

写入 = `ledgerReanchorBatch({ cwd, batch })`（§7.1——内部取集，选行单源 = §3.3 `resolveBatchRows` 解析同址，零二写；幂等跳过 + 单事务）；**回执单源 = 该导出的返回形**（`reanchored` / `alreadyAnchored` / `failed`）——两路均不另调 `ledgerBatchRows` 选行、不二造回执。

**`cwd` 基准**：该调的 `cwd` = **批档所属项目根** = `resolveLedgerRoot(dirname(<batchDoc>))?.root`（= §6.1 口径 2 的同一子表达式，入参换成批档目录——收口两路手上都只有档路径）——**不用会话锚**：会话锚为工作区 ∥ 容器时该式无根（§2.1 / §3.8：以锚为界上溯，锚自身无档 ⇒ `null`）⇒ 调用抛明，不会静默记到别的项目。

**无根支**：`resolveLedgerRoot` 返 `null`（批档目录祖先链无已注册者）⇒ **不取行、不重锚**，`failed` = 「批档所属项目根不可推导」⇒ 收口回执点名（**不停冻结**——同五件之 2 的上报面）；**不落兜底基准**（落 `<项目>/docs/batches` 会让相对形 `task_book` 解析零命中——正是本句要防的静默失败态）。

**收口三动作边界（同一次 `batch` close 上的共存口径 · 单源本节）**：收口时点周边挂三件面，各有单源——**行重锚**（本节 · 自动写：本批未落行 ⇒ `trigger=条件` + 复启句）∥ **批量结算**（§3.3 `ledgerCloseBatch`：只销 `待核销` 行——**行主人显式调用** `ledger(close)` 携 `batch`，不是 close 径的自动动作）∥ **出口清单**（§3.7 ③：本批未落行 + 全库超龄行，只读）。

- **先后**：取行单源 = `ledgerBatchRows`（§7.1）——批量面先建、重锚只消费（零二写）；两批同轮落地时该导出只实现一次，后落者不得另建选行；close 径内重锚与出口清单无次序依赖（重锚不改 `status` ⇒ 清单行集与读数不变），回执合并一份。
- **幂等**：重锚重跑零写（现值已 `条件` ⇒ 跳过，复启句不重复追加）；批量结算重跑零写（销后行已离 `待核销`，再选零行）。
- **冲突裁决**：取行集按状态划分、不相交——`待核销` 归结算（销账：改 `status` / `closed_at`），`待讨论 / 待设计 / 在途` 归重锚（脱钩：改 `trigger` + 追加 `evidence`）⇒ 同一行不会被两边同写；任一方要扩大射程至相交 ⇒ 先改本节取行句并重评，实施轮不得自行裁决。


## 7. 可见面：接口契约（v2 数据源）

### 7.1 单源模块与导出面

**在册状态（单源）**：**未落地在册（在册未落）三处**——`ledgerQuery` 的 **`taskBookOnDisk` 读数键**（B · #1550）∥ `ledgerBatchRows`（新增 · #1550）∥ `ledgerReanchorBatch`（新增 · #1550）。

**已落地（不在未落地清单内）**：`resolveLedgerRoot`（§3.8——实读 `thincoder-core/ledger-db.mjs:100`；落地批 = 台账 #1588）∥ `ledgerQuery` 的 `task_book` 过滤与 `overdue` 读数键、`ledgerCount` 三键出参、`overdueOf`、`ledgerEvidenceOversize`、`ledgerUpdateBatch` / `ledgerCloseBatch`（#1530——实读坐标 = §3.5「在册状态」行）；

`formatDetailLine` 位扩（§3.7——`thincoder-core/ledger.mjs:140`）。落地批号单源 = §3.5 四件表。

- **CLI**：`thincoder-core/ledger.mjs`（SQLite + 纯逻辑，无 TUI 依赖）+ 显示面胶水档。
- **对端**：对端显示面**独立实现、语义同源**（照两轴纪律）+ 各自胶水档。

**导出契约（v2——SQLite 化）**：

| 导出 | 语义 |
|---|---|
| `ledgerDbPath(cwd)` | 项目根 → 键控库路径（sha1(规范化绝对路径) 前 16 位；键式单源 = §2.1） |
| `ledgerKey(root)` | 项目根 → 库键（`sha1(normalizeCwd(root))[:16]`——键式单源，§2.1） |
| `ledgerDirPath()` | 台账库目录（`_setLedgerDirForTest` 覆盖的同一变量——迁移 / 审计面默认根） |
| `runLedgerMigrate(args, …)` / `runLedgerAudit(args, …)` | 存量迁移 / 目录审计命令面（§2.2；CLI 子命令入口） |
| `ledgerVariantNotice({ cwd, dir, locale, exists })`（**新增**） | 变体键库首跑检测提示（命中 ⇒ 单行文案；无 ⇒ `null`；**进程内一次为限**）；导出档 = `thincoder-core/ledger-variant-notice.mjs`（在盘） |
| `openLedger(cwd)` | → `DatabaseSync` 句柄 + `ensureSchema`（幂等建表） |
| `ledgerQuery({ cwd, status, kind, board, trigger, task_book, now })` | SELECT 行集（只读，全角色）——**五枚等值过滤**（`status` / `kind` / `board` / `trigger` / `task_book`——**`task_book` 为原值等值**（列串直比）；与 §3.3 选行的「文件部分解析同址」**两径口径不同、各自单源**）· 行集逐行携计算字段 `aged` ∥ `evidenceOversize` ∥ **`taskBookOnDisk`**（本档 B——`task_book` 文件部分解析成立 ∧ 该档在盘；缺指针 / 不可解析 / 不在盘 ⇒ `false`；不入库、不入 `DATA_COLUMNS`）∥ **`overdue`**（§3.7——出口态字串 ∥ `null`；同上不入库、不入 `DATA_COLUMNS`）· `now` 注入缝（确定性用例） |
| `ledgerCount({ cwd, task_book })` | 回报 **`{ count, overdue, evidenceOversize }`**（出参形扩——原裸数）：`count` = `COUNT(*)` WHERE 未决四态（单源计数）；**`overdue`** = 未决四态中命中出口态的行数（§3.7——机判单源 `overdueOf`）；`evidenceOversize` = 未决四态中超限行数（§5）；`task_book` 等值过滤。**消费面** = 收口行 ∥ 显示面读 `.count` / `.overdue`（零重算） |
| `overdueOf(row, { now, base })`（**新增**） | **出口面机判单源**（§3.7）：返回出口态字串（**值域 · 非序**：`aged` / `resume_due` / `dangling` / `unlabeled`）∥ `null`——射程 = 未决四态（`已核销` / `已废弃` ⇒ 恒 `null`）；只由行数据 + 盘面事实判；**判定序见 §3.7**；消费面 = `ledgerCount` / `ledgerQuery` / `buildScan` 三处（零二写） |
| `ledgerEvidenceOversize({ cwd, task_book })`（**新增**） | `evidence` 超限行数（未决四态 ∧ `String(evidence).length > EVIDENCE_SOFT_LIMIT`）——count 回报读数单源（§5） |
| `ledgerAdd({ cwd, row })` | INSERT（写命令，主 agent）；`row.resume_when` 可空 |
| `ledgerUpdate({ cwd, id, patch })` | UPDATE（写命令，主 agent——迁移表校验）；`patch.evidence` 传值 = 追加缺省、`patch.evidenceReplace` = 布尔覆盖旗。**单行形**（`id`）——批级批量迁移 = `ledgerUpdateBatch`（本表下行） |
| `ledgerClose({ cwd, id, status, evidence, evidenceReplace })` | UPDATE status + `closed_at`，事务包裹（写命令，主 agent）——核销两源 = 待核销（勾销）· 待讨论 / 待设计（追认核销 · `evidence` 必填 · 缺则拒）；在途不可跳；（一跳核销——追认门判结果值）；`evidence` 传值 = 追加缺省、增 `evidenceReplace` 旗。**单行形**（`id`）——批级批量结算 = `ledgerCloseBatch`（本表下行） |
| `ledgerUpdateBatch({ cwd, batch, patch, executorSessionId })` / `ledgerCloseBatch({ cwd, batch, evidence, evidenceReplace })`（**新增**） | 批级批量两单源（§3.3）——`resolveBatchRows` 选行 + `applyRowUpdate` / `applyRowClose` 逐行落笔（与单行形共函数）+ 跳过点名；回 `{ batch, status, applied, skipped }`（工具层 `batch` 入参分发至此） |
| `ledgerBatchRows({ cwd, batch })`（**新增**） | 本批行集（只读，任意状态）——批身份单源 = §3.3 解析同址；`cwd` = 批档所属项目根（§6.2 `cwd` 基准）；逐行携 `taskBookOnDisk`；**失败语义**：`batch` 不可解析 ∥ 无根 ⇒ 抛（同族 `assertBatchArg` 形）；**消费面 = 读面**（审计 / 人工查本批行）——收口两路均不调（回执单源 = `ledgerReanchorBatch`）；零写 |
| `ledgerReanchorBatch({ cwd, batch })`（**新增**） | **收口重锚单源**（写命令，主 agent 面）——取 `ledgerBatchRows` 集（取行 = `status ∈ {待讨论, 待设计, 在途}`——§6.2）→ 滤现值已 `条件` 者（幂等）与 `trigger=认账不排期` 者（零触）→ 逐行改 `trigger=条件` + 复启句落 `resume_when`（现值非空 ⇒ 不覆盖、追加 `evidence`）→ 单事务；回 `{ batch, reanchored, alreadyAnchored, failed }`（`failed` = `null` 常态 ∥ 失败因串（含「批档所属项目根不可推导」）；失败 ⇒ 整集回滚、`reanchored = []`）；`cwd` 同 `ledgerBatchRows`；消费面 = 收口两路（`batch` close ∥ `status` 写 §1「已收口」——§6.2 · C） |
| `findProject(anchor)` | 形状包装 `resolveLedgerRoot(anchor)`（§3.8——无选项）→ `{root, ledger}` / `null`——`root` = **推导所得项目根**（非锚） |
| `resolveLedgerRoot(target, boundary)`（**新增**） | 项目根推导**单源**（§2.1 / §3.8）：**形状包装 `manifest-discovery.mjs` `owningProject`（零第二上溯）**——**上溯**取最近「已注册」目录（含自身；**以会话锚为界、越界即停**）→ `{ root, basis }`（`basis` = `'self'`（自身即根）∥ `'ancestor'`（上溯祖先命中））；界内无已注册者 ⇒ `null`（**不向下找、不猜**）；**无自指**（档判据不经 `ledgerDbPath`）；消费面 = §3.8 表 |
| `ledgerChildren(dir)`（**随迁**——自 `ledger.mjs` 迁入本档） | 目录下**已注册**（档在盘）的直接子目录（目录名升序；惰性枚举 + `MAX_SIBLING_SCAN` 上限——不可读 ∥ 超限 ⇒ 空集）——谓词 = §2.1「已注册」单谓词；消费面 = 族发现 ∥ 轻通道闸候选枚举（同级判据单源）；`ledger.mjs` re-export（公共面形零改） |
| `discoverFamily(anchor)` | `{current, projects}`——current = `findProject`（**祖先支无命中 ⇒ `null`**——容器 ∥ 工作区锚按容器形落子目录族；§7.2）；projects = current + 其同级已注册目录；current 缺 ⇒ **锚本地**枚举（锚自身**已注册**的直接子目录——不沿祖先链上找） |
| `formatMarker(scan)` | §7.3 逐字（**签名与键语义不变**——L1 标记零扩，§7.3.1；**范围限定**：单 scan 逐字模板——范围求和不在本函数，经 `scopeMarkerOf` 委托出文（§7.2）） |
| `scopeMarkerOf(scans, family)`（**新增**） | 标记范围归约（§7.2「标记范围」——L1 取值单源）：`{ marker, warn }` ∕ 空范围 `{ marker: null, warn: false }` |
| `formatDetailLine(scan)` | §7.3 逐字 + **判活尾段**（§7.3.1 三态文案；签名不变——`scan` 携新键） |
| `resolveExecutorStates(scans)`（**新增**） | 在途 executor 判活批量解析（§7.3.1）——`executors` / `deadExecutors` 键组装单源 |

### 7.2 口径契约

- **计数 / 老化 / 阈值 / 可动作**：见 `docs/core/requirements/ENGINEERING-MODE-V2.md` §9（D2 本节不重述）。
- **明细行集** = `{current} ∪ {可动作项目}`（发现序：current 在前，其余按目录名升序）；同项去重。
- **标记范围（L1）**：`current` 在场 ⇒ 仅当前项目（命中但不可读 ⇒ 空范围——不掺兄弟）；否则 ⇒ 族内**已读**项目（不可读跳过——既有语义）；空范围 ⇒ `marker` = `null`（不落 `0·0`）；范围非空 ⇒ 两池**分列求和**（F1——不合并为一数）。三端消费：核拍面写 `state.ledger` · VSC item 直调 `scopeMarkerOf`（端零自算；在场判据 = `marker` 非空）· 桌面 `ev:ledger` `marker` 转发（端零重算）。
    - **范围推导**：`current` 在场 ⇒ 范围 = `scans` 中 `root` = `family.current.root` 的 scan（**项目根自身带档 / 带库** ⇒ `findProject` 命中该根 ⇒ 归属 = 该根自身——只显其自身数，不合计其下项目）；`current` 缺席（容器根锚）⇒ 族 = `discoverFamily` 枚举面 `projects`（**锚本地**：取锚自身**已注册**（档 ∨ 库）的直接子目录——不沿祖先链上找）。
    - **工作区根子例**：命中锚若 `projectRootView` `workspace`（如锚位存量键控库先于写门）⇒ **不充当台账项目**（键控库存在 ≠ 可作项目——判据单源 = §2.1 已注册判据的**库臂排除**）——按容器根形落子目录族（**锚本地**——消静默缺席）；T51 面（**可解析**项目命中但不可读 ⇒ `null`）不受触。
   - **两参对账**：`family` 判归属 ∥ `scans` 载体——范围 = 归属 ∩ 已读（「已读」= 在 `scans` 中：构建期不可读项目已跳过）；`current` 缺席 ⇒ 范围 = `scans` 全体。
   - **文本产出**：`marker` 文本 = 委托 `formatMarker` 逐字模板（求和值入参；`formatMarker` 仍居调用链——§7.1）。
- **标记范围受影响面**：源/测试全清单（现行行数 × 增量——含单元测试档）已登记；贴线判 = 有增量档全列 ≤500 顾问线（最高 `declaration.mjs` 379 行——`ledger.mjs` 187）⇒ 零拆分义务。
- **行龄**：SQLite 时间戳距今（非 git / 无时间戳 → 标「年龄未知」照列、不判老化）。
- **性能**：SQLite 等值过滤走索引；**`ledgerCount` 是 O(N) 逐行判**——一次 `SELECT` 取未决行后逐行算 `overdue`（每行 ≤1 次指针解析 + 1 次 fs 判）与 `evidenceOversize`（同一次遍历，零额外 IO）；**不设缓存**（读数须反映即时盘面）。
  **量级判**：N = 单项目未决行数（本仓现行 O(10²)）⇒ 单次 `count` 为 N 次 `stat` 量级，可接受；行数进 10³ 量级再评估缓存（本节只登记成本模型，不预置旋钮）。

### 7.3 行文本逐字契约（三面同文——CLI / 对端 / 收口行同一 formatter）

| # | 形态 | 逐字模板 | 色 / 态 |
|---|---|---|---|
| L1 状态标记 | 单行 | `台账 <pool>·<tech>`（例 `台账 4·32`）——*pool* ∕ *tech* = **范围求和**（§7.2） | 范围内 `overdue>0 ∨ deadExecutors>0` → 警示色；否则默认 |
| L2 明细行 | 每项目一行 | `台账 <名>：需求池 <pool> · 技术待办 <tech>（老化 <aged> · 待处置 <overdue>）` +（阈值时）` — 可开批` +（判活尾段——§7.3.1） | 该项目 `actionable` → 警示色；否则 dim |

- `<名>` = 项目根目录 basename；数字 = 十进制整数；`<aged>` **恒显**（含 0——自证已检查）；`<overdue>` **同恒显**（含 0——§3.7 出口面恒显位）。
- **收口行输出** = L2 行序列（行集 = 族行）；族空时输出 `台账：未发现台账。`（**仅命令面**——运行时面静默）。
- **状态行位置**：状态段簇**尾**（键位组前）——与既有状态段同簇、同右截优先级。

### 7.3.1 判活展示（executor 三态——F-LX1）

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

**L1 标记文本零扩**：`台账 <pool>·<tech>` 文本不变（§7.3 逐字契约锁定——范围口径 = §7.2）；执行中 / 死亡信息落 L2 尾段。**状态位**：`state.ledger.warn` = **范围内**任一项 `overdue>0 ∨ deadExecutors>0`（`aged ⊂ overdue` ⇒ 警示色不缩；死亡 = 行动级警示——端警示色同源取本值，端零重算；取值单源 = `scopeMarkerOf`，§7.1）。

**core scan 形状新增键**：`inflightExecutors`（`buildScan` 挂——**sync 零变**，K-LX2：三端既有 sync 直调面零破，判活独立 async 单源）/ `executors` · `deadExecutors`（`resolveExecutorStates` 挂载）——端胶水零成本透传。

**端接线**（双端零新探测——判活解析全在核）：

- CLI 胶水（`thincoder-cli/src/tui/ledger-surface.mjs`）**机制归核**——自实现 `runLedgerScan` 删除，动态 import 扩载 `@thincoder/core/ledger-surface.mjs`（CORE-UNIFICATION 机制单源方向；端壳静态链仍不达 node:sqlite——W8 契约②机检守）。
- VSC 端（`thincoder-vscode/src/extension/ledger-surface.mjs`）`scanFamily`（tooltip 径）同挂判活——tooltip 明细行与核 L2 同文。

### 7.4 挂载 / 7.5 对端挂载 / 7.6 收口行 / 7.7 关键决策 / 7.8 不变量

- CLI 挂载（状态槽 / 首扫不抢首帧 / 周期 `unref()`（**兜底**）/ **库变更去抖即扫（写后即时——用户裁定「写了以后就要立即更新」）** / 回合处理期间跳过**仅限定时轮**（变更轮不受挡）/ 空标记零注入 / headless 零改动）· 对端挂载（状态栏 item 无 command / tooltip）· 收口行（`--summary` 命令面 + 核销同步清单「台账可见面（收口行）」槽位）——逐字契约与决策记录（K1–K7 / U1–U6）不在此重述。
- **不变量**：① 无台账 → 零输出零标记 ② 台账档只读（写面 = 主 agent 装配面——**主 agent 写命令 ∥ 收口径 `ledgerReanchorBatch` 代理写**（收口两路各一次动作——同一单源，`docs/core/design/BATCH-RECORD.md` §8 边界 12）；子代理面零写）③ 数字单源 ④ 不新增工具/命令/快捷键面；headless 零新增输出。

## 8. 验收标准（v2——回指 M2 规格 AC）

**在册状态（单源）**：
- **半落地（逐半幅）**：**AC-M2-17**（根解析面——读写同一推导）——上溯 / 界门半幅落地批 = 台账 #1588（`thincoder-core/ledger-db.mjs:95` `resolveLedgerRoot`）；**判据本体单源 + 不向下取根**半幅 = 本批（台账 #1795）——判据本体 = `thincoder-core/manifest-discovery.mjs:100` `owningProject`（§3.8）。
- **已落地在册（#1530 面）**：**AC-M2-26 ∥ AC-M2-27 ∥ AC-M2-28 ∥ AC-M2-31 ∥ AC-M2-32 ∥ AC-M2-34**（批甲面 + 出口面）——实装坐标 = `thincoder-core/ledger-cmd.mjs:300` / `:325` / `:98` / `:115` / `:43` / `:70` / `:123` ∥ `thincoder-core/ledger-db.mjs:145` / `:178` / `:254` ∥ `thincoder-core/ledger-migrate.mjs:20`–`:23`。
- **半落地（逐半幅）**：**AC-M2-35**——显示面 L2 逐字 ∥ `warn` 聚合 ∥ `batch create` 不附（无可附面）∥ 会话收尾不造事件 已落（`thincoder-core/ledger.mjs:121` / `:140`）；**`batch close` 回执清单半幅未落地在册**（实读 `thincoder-core/agent-tools/batch-lifecycle.mjs:504` close 回执无该清单）——挂账 = 台账 #1530 出口面剩余。
- **未落地在册（在册未落）**：**AC-M2-29 ∥ AC-M2-30 ∥ AC-M2-33**（指针判据重锚面）⇒ 落地批 = 台账 #1550（单源 = §3.5 四件表）。
  实读证据（2026-10-19）：`ledger-cmd.mjs:144` `assertTaskBookGate` 仍为旧形（无 `trigger=归批` 臂、无「本笔写入面」入参）∥ `ledgerQuery` 无 `taskBookOnDisk` 键 ∥ `ledger-cmd.mjs` 无 `ledgerBatchRows` / `ledgerReanchorBatch` ∥ `batch-lifecycle.mjs` close 径无重锚。
- **AC-M2-36**（行粒度）= 规则面、无代码落地——判据本体已在 §3.9 在册。

| # | 验收标准（可机判） | 回指 |
|---|---|---|
| AC-M2-1 | 表含六态 status CHECK + kind CHECK + trigger CHECK（读 `sqlite_master` / INSERT 非法值拒） | ②.1 |
| AC-M2-2 | 非法 `status` 写入 → 拒（CHECK）；`status=NULL` → 拒（NOT NULL 兜底） | ②.2 |
| AC-M2-3 | 计数 = `COUNT` 单源（grep `scanGroups`/`summarizeLedger` 零命中；`ledgerCount` = 未决四态） | ②.6 |
| AC-M2-4 | 写命令非主 agent 装配 → 拒（depth>0 装配面不挂写命令） | ②.4 |
| AC-M2-5 | `在途/待核销` 缺 `task_book` → 拒（咬合 CHECK = 库级防线；工具路径下写门先拒） | ②.2 |
| AC-M2-6 | `node:sqlite` Node 24 可用（无需 `--experimental-sqlite`——实测通过） | ②.1 |
| AC-M2-7 | 进入「在途」的迁移带 `executor` = 会话 `sessionId`（函数注入，patch 显式值优先——§3.1）；点火边（`待讨论 → 待设计`）同式自动写；离开「在途」的迁移 `executor` = NULL（`ledgerUpdate` 两出边 + `ledgerClose` 撤回路径） | ②.8（F-LX1）∥ 点火边 |
| AC-M2-8 | `executor` 非空且属主进程已死 → 可见面显示「属主已死，可接手」；探测失败（unknown）→ 不显示死亡（保守——活 / 死 / unknown 三态对照，§7.3.1） | ②.8（F-LX1） |
| AC-M2-9 | 迁移表外状态迁移 → 拒（`ledgerUpdate` 待讨论→已核销拒；`ledgerClose` 目标/源态校验） | ②.2 |
| AC-M2-10 | **写门·指针点名**（§6.1）：**本笔新写** `task_book` ∥ **本笔新写** `trigger=归批` ⇒ 该指针非空 ∧ 文件部分可解析 ∧ 解析出的档在盘（否则拒 throw，行不变，文案逐字）；结果行 `status ∈ {在途, 待核销}` ∥ `trigger = 归批` 而 `task_book` 空 ⇒ 拒（文案逐字 = §6.1 第三句 `task_book 必填（在途 / 待核销 / 归批 须携任务书指针）`）；**本笔未指名**（只改 `status` / `evidence` / 其它字段）⇒ 零判零阻——旧指针所指档已清照样过（含 在途 → 待核销 → 已核销 全链）；**显式空值（`null` / 空串 / 全空白） ≡ 未指名** ⇒ **臂② 不触**（该行属臂① 射程 ⇒ 臂① 拒「必填」）；**非空但缺文件部分**（`§2`）⇒ 臂② 拒；三形态（无后缀 / `§N` / `§N（括注）`）与新写声明源前缀形同判 | §6.1（架构 E1 后半幅） |
| AC-M2-11 | 库键归一：同项目盘符两拼写（`D:\x` / `d:\x`）⇒ `ledgerDbPath` 同库路径；盘符本大写输入键不变（CLI 现状键回归）；键式单源（`ledgerKey` 一处生成——**射程 = 台账键生成面**，该面 grep 无第二份 `sha1` 键式；他面哈希合法、不属本判据） | §2.1 |
| AC-M2-12 | 存量迁移三件套：`--dry-run` 零写报告（源 / 目标 / 行数 / 备份路径）；`--confirm` 先备份（拷贝 + 读回同计数）后单事务迁入（**13 数据列逐条保全**（等值比对列集不含 id——重发）· 事务内读回核验）；重跑幂等（0 新增 / 无待迁源）；源回收进 `ledger-trash`（不删） | §2.2 |
| AC-M2-13 | 审计面只读：逐库定性（目标 / 变体源 / 空库 / 不可归因（有行）/ 不可归因（读取失败）/ 不可读（坏档））+ 候选根集合归因；全目录文件集合 / 大小 / mtime 三不变 | §2.2 |
| AC-M2-14 | 收口两源：待讨论 / 待设计 → 已核销 **直通**（`evidence` 非空）；缺 `evidence` ⇒ 拒（行不变）；在途 → 已核销 ⇒ 拒（不可跳 待核销）；已核销 / 已废弃 现态 ⇒ 拒；撤回路径零改 | ②.2（用例 T33–T36） |
| AC-M2-15 | 工具层参数守卫：写命令三 action（add / update / close——统一入口 `ledger`）非法入参（非对象 / 未知键 / 缺必填（含显式 `null`）/ 错型 / 非枚举 / `title` 空串 / 全空白）⇒ 拒（throw，零写、零库动作）+ 文案逐字（§3.2 P1–P6）；合法形（含复杂文本 / 可空 `null` 字段 / `cwd` 缺省）零回归 | §3.2（需求档补行已落——AC-M2-15） |
| AC-M2-16 | 读命令守卫 + `executor` 空值口径：读命令二 action（query / count——统一入口 `ledger`）非法过滤参数（非对象 / 未知键 / 枚举外值（含数组 / 错型值）/ 错型）⇒ 拒（throw，零库动作）+ 文案逐字（§3.2 P1–P6）；合法形（缺省 / 可空 `null` / 过滤命中）零回归；`ledger(update)` 显式 `executor: null` 与略去同判（进「在途」自动写会话 sessionId——§3.1 优先级链） | §3.1 / §3.2（需求侧补行**已落**——AC-M2-15 射程注 + AC-M2-16） |
| AC-M2-17 | **根解析面（读写同一推导）**：项目根 = 自「动作目标路径」（缺省 = 会话锚 `cwd`）起（含自身）**上溯取最近「已注册」目录**——**上溯以会话锚为界，越界即停**（已注册 = `PROJECT-MANIFEST.json` 在盘；库在盘不算 —— 判据见 §2.1）；**判据本体单源** = `owningProject`（`resolveLedgerRoot` 零第二上溯）；**不向下取根**（起点直接子目录带档者恰一 ∥ 裸仓恰一 ⇒ `null`） |
| AC-M2-18 | **标记 = 当前打开范围合计**（需求 §13.3 第 1 条）：容器根锚（族 ≥1 已读项目）⇒ 标记 = 族内已读项目两池分列求和（`台账 <Σpool>·<Σtech>`）；具体项目锚 ⇒ 仅该项目自己（兄弟零掺——负向锁）；命中但不可读 ∥ 空范围 ⇒ `marker = null`（命中 = **可解析项目**）；`warn` 同范围聚合（范围内 `overdue>0 ∨ deadExecutors>0`——§3.7 口径） | FR24（需求 §13.3 第 1 条「状态行极简标记」） |
| AC-M2-19 | **工作区锚不充当项目**（AC-M2-18 范围面子例）：命中锚 `projectRootView` `workspace`（如锚位存量键控库先于写门）⇒ 按容器根形落子目录族求和——键控库存在 ≠ 可作项目（消静默缺席）；T51 面（**可解析**项目命中但不可读 ⇒ `null`）不受触 | FR24（需求 §13.3 第 1 条「状态行极简标记」· 工作区根子例）——用例 = 登记态（K12 红绿对为载体；号码待定——T56 已占；下次触碰该面时补） |
| AC-M2-26 | **批级批量迁移**（§3.3）：`ledger(update)` 携 `batch`（批档指针）+ `status` ⇒ 选出「批 → 行」集（`task_book` 文件部分经 `resolveDeclaredRef` 解析同址——任意状态），逐行按迁移表重判；表外行 / 门拒行 ⇒ 跳过并逐行点名（`{id, from, why}`）；一个事务包裹；`applied` 计数对；`id` / `batch` 同携 ∥ 双缺 ⇒ 拒（组判据 P7）；`batch` 入参自身可解析 ∧ 批档在盘 ⇒ 否则拒（fail-closed——**本笔指名判**，与 §6.1 臂② 同族） | §3.3 |
| AC-M2-27 | **批级批量结算**（§3.3）：`ledger(close)` 携 `batch` ⇒ **只销已到 `待核销`** 的行（勾销）；`待讨论` / `待设计` / `在途` ⇒ 跳过 + 逐行点名（禁静默销账）；**追认核销不入批量面**；混批（部分落）与纯批两态各一拍（`applied` / `skipped` 计数对） | §3.3 |
| AC-M2-28 | **`task_book` 等值过滤**（§7.1）：`ledger(query)` 增 `task_book` 过滤（与 status / kind / board / trigger 并列为第 5 枚）；`ledger(count)` 同增（现状零过滤 ⇒ 本批只增 `task_book` 一枚）；同值多批互不串（造 3 批各回各集）；非串值 ⇒ 拒（守卫 P4） | §7.1 |
| AC-M2-29 | **归批指针点名门**（§6.2）：`trigger=归批` 的结果行 ⇒ `task_book` 非空（缺 ⇒ 拒，文案 = §6.1 载的同一句——本节不另立，行不变，零写）；**本笔新写** `trigger=归批` ⇒ 绑定指针非空 ∧ 可解析 ∧ 在盘（否则拒）；带 `trigger=归批` 而行指针所指档已清 ⇒ 其 `status` / `evidence` 更新**照过**（本笔未指名 ⇒ 零判）；`在途 / 待核销` 面逐字零回归；批量形同判（`applyRowUpdate`） | §6.2 |
| AC-M2-30 | **收口自动重锚**（§6.2）：收口**两路**（`batch` close ∥ `status` 写 §1「已收口」）**同调单源 `reanchorOnClose`、零二写** ⇒ 未落行（`task_book` 解析同址指本档 ∧ `status ∈ {待讨论, 待设计, 在途}`——`待核销` 属已落只待结账，不取）**自动**改 `trigger=条件` + 复启句落 `resume_when`（§3.4——值非空；该列现值非空 ⇒ 不覆盖、改追加 `evidence`）；`trigger=认账不排期` 行零触；回执逐行点名所锚行、冻结照常；**幂等**（现值已 `条件` ⇒ 零写跳过）；**单事务**（失败整集回滚 + 回执照报）；**次序**（收口那一笔的全部拒因通过、状态行落盘之后才跑——被拒 ⇒ 台账零写）；**一次收口只出一份 `[ledger reanchor]` 清单**（两路不同拍）；**失败经返回形 `failed` 项报出 + 收口回执点名**；全已落 ⇒ 无该段；共存边界（批量结算 / 出口清单）= §6.2「收口三动作边界」 | §6.2 ∥ `docs/core/design/BATCH-RECORD.md` §4.13 |
| AC-M2-31 | **evidence 超限读数**（§5）：`query` 行集逐行携计算字段 `evidenceOversize`（`String(evidence).length > EVIDENCE_SOFT_LIMIT`（300）；缺 / 空 ⇒ false；不入库、不入 `DATA_COLUMNS`）；`count` 回报 `{ count, overdue, evidenceOversize }`（三键形——§7.1；`evidenceOversize` = 未决四态中超限行数）；**写入不拒**（读数非闸门） | §5 |
| AC-M2-32 | **`resume_when` 可空字段**（§3.4）：items 增可空列（`LEDGER_SCHEMA_VERSION` 1 ⇒ 2；老库 `ALTER` 幂等补列、行不损、二次打开零副作用）；`ledger(add / update)` 可携（可空 · 串；空串 / 全空白 ⇒ 拒）；`query` 行集携带；导出面入 `DATA_COLUMNS`（13 列）；不带参零回归（存量行 NULL）；`migrate` 列集容忍集扩为 `{executor, resume_when}` | §3.4 |
| AC-M2-33 | **指针在盘读数**（§6.1 / §7.1）：`query` 行集逐行携计算字段 `taskBookOnDisk`（`task_book` 文件部分经 `resolveDeclaredRef` 解析成立 ∧ 该档在盘 ⇒ `true`；缺指针 / 不可解析 / 档不在盘 ⇒ `false`）；**不入库、不入 `DATA_COLUMNS`**（`DATA_COLUMNS` 13 列零变）；**读数非闸门**（任何写入零阻）；**迁移 dry-run 的读数旗（`writeGateFlag`）同为读数**——不拦任何写入（§2.2 / §6.1 口径 5；验证由 T32 承载）；同夹具「档在盘 → 删档 → 再查」两拍读数翻转 | §7.1（B） |
| AC-M2-34 | **出口面机判单源**（§3.7）：`overdueOf(row, { now, base })` 四类出口态**首中优先**（序 = `resume_due` → `dangling` → `unlabeled` → `aged`；判据逐字 = §3.7 表）；`ledgerCount` 回报含 `overdue`；`query` 逐行携 `overdue`（不入库、不入 `DATA_COLUMNS`）；**写入零阻**（读数非闸门） | §3.7 |
| AC-M2-35 | **出口面可见面与触点**（§3.7）：显示面 L2 逐字含 `（老化 <aged> · 待处置 <overdue>）`（恒显；L1 文本零扩）；`warn` 聚合 = `overdue>0 ∨ deadExecutors>0`；`batch close` 回执附「本批未落行 + 全库超龄行」逐行清单（零写、不阻断冻结）；`batch create` 不附；**会话收尾不造机器事件**（其活并入会话开局——③ → ① 承接） | §3.7 |
| AC-M2-36 | **行粒度 / 拆行规则**（§3.9）：**无机械判据（明示）**——「是不是同一个可独立闭合的工作对象」是语义判断。可机判半幅 = ① 行形态（拆出行的 `title` 携成员清单；`evidence` 超限 = §5 读数）② 拆行后每行能独立走完迁移链（`status` 迁移 ∥ `close` 二值不因成员未落而僵）。判面 = 设计评审 ∥ 父侧读清扫轮回执（N 行 → M 行逐行点名） | §3.9（P3） |

**用例表（摘）**：T1 入条目 → 新行 id 自增 · T2 状态迁移 → status 更新 + `updated_at` 刷新 · T3 勾销 → status 已核销 + `closed_at` 写入、行保留（软删除）· T4 未决四态计数（混入归档行）· T5 `trigger=NULL` 通过 · T6 非法 status 拒 · T7 在途缺 task_book 拒 · T8 非主 agent 写 → 命令不存在 · T9 status NULL 拒 · T10 迁移表外迁移拒（行不变）。

**用例表（续——写门·指针点名）**：T11 `task_book` 三形态（无后缀 / `§2` / `§1.5（括注）`）**本笔新写**且指向在档 → 通过 · T12 **本笔新写**指向不在盘档 → 拒（文案 + 行不变） · T13 **本笔新写** `§2`（非空但缺文件部分）→ 拒（臂②） · T14 本笔未指名（只改 `status` / `evidence`）而指针所指档已清 → 不判（照过）；`待讨论` 行**本笔新写** `task_book`（在档 ⇒ 过 / 不在盘 ⇒ 拒——臂② 全状态射程）。

**用例表（续——执行者归属与判活展示，F-LX1；档 `thincoder-core/test/ledger-executor.test.mjs`；L2 文案断言双端 = `thincoder-cli/test/ledger-surface.test.mjs` / `thincoder-vscode/test/ledger.test.mjs`）**：

- T15 `待设计 → 在途` ⇒ 行 `executor` = 注入 sessionId（兜底链三态各一拍：缺省 / patch 显式 / 行现值兜底）。
- T16 `在途 → 待核销` / `在途 → 已废弃` ⇒ executor NULL（patch 显式传也不复活）。
- T17 `ledgerClose` 在途直撤 ⇒ executor NULL；勾销路径零触碰；纯字段更新不带 executor ⇒ 行值零变。
- T18 旧 DDL 建库 → 打开列补齐、行不损；二次打开幂等零副作用；并发 ALTER 撞「duplicate column」→ 复核列在吞。
- T19 三态对照（注入 `_setProcessProbeTestImpl`）：dead ⇒ L2 带「属主已死，可接手」/ alive + staleDays ≥ 1 ⇒「执行中 <n> · 最长 <d> 天未动」/ unknown（aliveSet null · cmdline 缺行）⇒ 不显死亡。
- T20 inflight 空 ⇒ `resolveExecutorStates` 零 exec 快返；同 pid 二次解析 TTL 内零 exec。

**用例表（续——库键归一与存量迁移；档 `thincoder-core/test/ledger-key-normalize.test.mjs` / `thincoder-core/test/ledger-migrate.test.mjs`）**：

- T21 键归一：同项目两盘符拼写（含 `\` / `/` 混写、尾斜杠）⇒ `ledgerDbPath` 同路径；盘符本大写 ⇒ 键 = 原样 `sha1[:16]`（回归）。
- T22 级联守卫（§2.1 比较边界登记）：`findProject` 以两拼写 anchor ⇒ 命中同一库文件。
- T23 边界：**null / undefined / 空串** cwd 不炸（`resolve(cwd ?? ".")` 只兜此三态；数值 / 对象入参不在本用例射程——由 `path.resolve` 语义照常抛）。
- T24 迁移 dry-run：夹具两库（目标 + 变体源）⇒ 报告含目标键 / 源键 / 逐源行数 / 计划迁入数 / 备份路径；**零写**（目录文件集合与 mtime 不变）+ **夹具根外零写**（备份 / 回收目录同随覆盖基——真实用户目录零触碰）+ **目标不可读子例**（非 sqlite 档）⇒ 显式标「不可读」、迁移后计数 `?` 占位、全输出零 `undefined`。
- T25 迁移执行：源 N 行迁入（新 id 连续）；**13 数据列逐条保全 + id 重发**（等值比对列集不含 id；id 映射入报告）；目标既有行不动；源库进 `ledger-trash/<批次>/`；`ledger-backup/<批次>/` 两档同计数；**夹具根外零写**。
- T26 幂等：同夹具连跑两次 ⇒ 第二次 0 新增（源已回收 ⇒ 「无待迁源」）；总行数 = 首跑后计数（无重复行）。
- T27 fail-closed：源带 `-wal` 伴生档 ⇒ 拒（目标零变、源零动）；备份失败 ⇒ 拒跑；忙（第二连接持写锁）⇒ 明示拒跑（既有目标 ⇒ 措辞「目标零变、源零动」零变）；**新建目标 + 迁入失败**（源行撞目标 CHECK）⇒ ROLLBACK + 残留措辞（「目标档为本次新建——0 行空库档残留在原路径」；不再称「目标零变」）。
- T28 审计：夹具含 目标 / 变体源 / 空库 / 不可归因（有行）/ 不可归因（读取失败）/ 不可读（坏档） 六类 ⇒ 定性正确 + `--root` 归因命中；全目录零删改（文件集合 / 大小 / mtime 三不变）。
- T29 列集就绪判：源库由旧 DDL 建（缺 `executor` 列 ∥ 缺 `resume_when` 列——容忍集 = 该两列）⇒ 该列按 NULL 映射照迁、其余列逐字；源库缺其余任一数据列 ⇒ 拒（目标零变、源零动）。
- T30 目标缺档态：目标键库不存在 ⇒ dry-run 标「拟建（0 行）」；`--confirm` 迁入建库建表、迁后计数 = 源行数；备份面标注目标无可备档。
- T31 `--from <key>`：**取值必须为 16 位小写十六进制键形**（`/^[0-9a-f]{16}$/`——路径形 / 非键形 ⇒ 拒）；显式键补充源 ⇒ 并入候选（与枚举去重）后照六步迁入；指名键无对应库 / 不可开 ⇒ 拒跑（fail-closed，零写）。
- T32 dry-run 指针读数旗：源含 `task_book` 解析不成立 ∥ 档不在盘的行 ⇒ 报告含读数旗（**不拦截**、照迁；**读数非门**——该行后续更新零阻）；dry-run 零写照旧。

**用例表（续——收口两源；档 `thincoder-core/test/ledger-close.test.mjs`）**：

- T33 正常：追认核销直通——待讨论 / 待设计（先行回写 `evidence`）⇒ 已核销 + `closed_at` 写入 + 行保留（软删除）。
- T34 错误：追认核销缺 `evidence`（空 / 全空白两拍）⇒ 拒（文案逐字 + 行不变）。
- T35 错误：在途 → 已核销 ⇒ 拒（文案逐字 + 行不变）；反证 = 在途 → 待核销 → 已核销 两步照旧成功（勾销链零破）。
- T36 边界：已核销 / 已废弃 现态 ⇒ 拒（明确报错）；未知 id ⇒ 拒（既有文案）；追认核销 `executor` 零触碰（哨兵）；待讨论 → 已废弃 照常（撤回零改回归）。

**用例表（续——工具层参数守卫）**：

- T37 正常：三 action 合法形全链（`ledger(add)` → 复杂文本（`file:line` / 引号 / 反引号）逐字落盘 → `ledger(update)`（含迁「在途」带在档指针过写门）→ `ledger(close)`）；可空字段 `null` 通过；`cwd` 缺省径（ctx 供值）通过。
- T38 错误：`ledger(add)` 非法形逐条 ⇒ 文案逐字（P1–P6 全模板）：`{}` / 缺 `kind` / `kind: null`（显式 `null` ⇒ 按缺失判——P3）/ `kind` 非枚举（含数组形）/ `title` 缺 / 空 / 全空白 / 非串 / 可空字段非串 / `trigger` 非枚举 / 未知键（含判序用例——typo `knd` ⇒ 未知键文案先于缺参）/ 入参 `null`（视作 `{}` ⇒ 缺参文案）/ 入参数组（P1）+ 行集不变。
- T39 错误：`ledger(update)` 非法形逐条（`id` 缺 / `id: null`（同判）/ `id` 非数字（含 `"1"`）/ `status` 非六态 / patch 字段非串 / `title` 空串 / 全空白（P6 字段级）/ 未知键）⇒ 文案逐字 + 行不变。
- T40 错误：`ledger(close)` 非法形逐条（`id` 缺 / 非数字 / `status` 缺 / `status` 非 {已核销, 已废弃}）⇒ 文案逐字 + 行不变。
- T41 边界：拒 ⇒ 零库动作（台账目录 / 库档不建）；空串 `task_book` 迁「在途」⇒ 写门拒（既有「不可解析（缺文件部分）」文案）+ 行不变。
- T42 错误：缺指针形——`待设计` 行（`task_book` = `null` 常态）迁「在途」⇒ 写门拒（「必填」文案逐字）+ 行不变（仍 待设计）+ 零 SQLite 原文（中文文案断言）。
- T43 错误：读命令守卫——`ledger(query)` 非法形逐条（`status: 123` / `status: []` / `kind: "bogus"` / `board: 9` / `cwd: 3` / 未知键 / 入参非对象）⇒ 拒（文案逐字 · 零库动作）；`ledger(count)` 同判；合法形（缺省 / 显式 `null` / 合法过滤命中 = 直调核函数等值）零回归。
- T44 边界：`ledger(update)` 显式 `executor: null` ≡ 略去——`待设计 → 在途`（带在档 `task_book`）⇒ 行 `executor` = 本会话 sessionId（`getSessionId()`）；显式串仍优先；非迁移纯字段更新读数零变。

**用例表（续——根解析面；实现面 = `thincoder-core/ledger-db.mjs` `openLedger`；根解析用例 = §3.8 T115–T121）**：
- T46 边界：声明源前缀 `task_book`（实现 = 实施轮）：项目声明 `docs-repo` ⇒ 其内 `x.md`（存在）⇒ 通过；未声明前缀 ⇒ 照旧拒；声明根缺位 ⇒ 拒。
- T55 迁移旗同源（实现 = 实施轮）：声明源前缀 `task_book`（目标档在）⇒ 写门臂② 通过 ∧ 读数旗零旗；未声明前缀 ∥ 声明根缺位 ∥ 目标档缺 ⇒ 本笔新指名同拒（写门）∥ 旗为读数（不拦写入）；仓根形全谱 = 既有断言逐字零变（回归用例）。

**用例表（续——标记范围合计；单元测试档（在位 · 239 行）；夹具 = 临时台账目录注入（`_setLedgerDirForTest`）+ 双项目临时树）**：

- T47 正常：容器根锚（双项目夹具）⇒ `marker` = 两池分列求和（例 `台账 3·4`——两目数值可区分 ⇒ 求和可判）。
- T48 负向锁：具体项目锚（A 目录内）⇒ `marker` = A 自身数（B 的数零掺入）。
- T49 边界：容器根锚下恰一个项目 ⇒ `marker` = 该项目数（同径——零特判）。
- T50 降级：族内不可读项目跳过（余者照常求和）；全不可读 ⇒ `marker = null`（不落 `0·0`）。
- T51 边界：具体项目锚命中但不可读 ⇒ `marker = null`（兄弟零掺入——范围 = current 语义）。
- T52 现状零变：空族（无台账目录）⇒ `marker = null` + `warn = false`。
- T53 正常：`warn` 范围聚合——族内任一项 `aged>0` ⇒ 根锚 `warn = true`；族内项目 `deadExecutors>0`（判活桩注入——同 T19）⇒ 根锚 `warn = true`；无老化 ∥ 无死执行者的具体项目锚 ⇒ `warn = false`（负向锁）。
- T54 端面：桌面 `ledgerMarkerOf` 透传两形（`{ text, warn }` ∕ `null`）；VSC item 源面锁（`scopeMarkerOf` 消费 ∥ 端侧 `formatMarker(current)` 自算零残余）。

**用例表（续——台账工具统一入口；单元测试档（已落））**：

- T77–T91：统一入口五 action 等价 ∥ 弃用壳 ∥ 守卫逐 action 文案（P3 / P5 + P2 / P4 / P6 补）∥ 未知 action ∥ action 缺失 ∥ 装配名集（号段 T77 起）。
**用例表（续——批级批量与反查；单元测试档（新建 `thincoder-core/test/ledger-batch-ops.test.mjs`——靶向单跑 `node --test test/ledger-batch-ops.test.mjs`））**：

**在册状态（单源）**：用例 **T92–T98 · T100–T101**（批甲面；含 T94a ∥ T94b）**未落地在册（在册未落）**——`thincoder-core/test/ledger-batch-ops.test.mjs` 实读**不在盘**（落地后新建）；落地批 = 台账 #1530。T99（收口重锚）= C 面 ⇒ 用例落 #1550 档（见下）。

- T92 正常：纯批收口——同批 N 行（全在 `待核销`）⇒ `close --batch` 一次全销（`applied.length === N` · `skipped.length === 0`）；**直读库**该批行数 = N（按 `task_book` 直查——**非** `ledger(count)`：后者只数未决四态、该批收口后回报 0，两读数口径不同、非矛盾）；**调用数 = 2**（`update --batch` + `close --batch`）。
- T93 安全阀：混批（部分落）——同批三行（`待核销` / `在途` / `待讨论` 各一）⇒ `close --batch` 只销 `待核销` 者（`applied = [该行]`），另两行**逐行点名**（`skipped` = `[{id, from:"在途", why:…}, {id, from:"待讨论", why:…}]`）；库内另两行状态零变。
- T94 边界：`update --batch --status` 逐行判迁移表——同批 `待讨论` ×1（入表）+ `已核销` ×1（出表）⇒ `applied` = 前者、`skipped` 点名后者；批量不破既迁表。
- T94a 错误（逐行门拒 → 跳过）：`update --batch --status 待核销` 而某行 `task_book` 本笔新值不在盘 ⇒ 该行**被写门拒**（§6.1 臂②）⇒ 计入 `skipped`（`why` = 门拒文案原文），**其余行照落**（`applied` 计数对）；库内该行零变。
- T94b 错误（事务级失败 → 整批回滚）：注入写失败（第二连接持写锁——同 T27 手法）⇒ 整批 `ROLLBACK`：`applied` 零行、库内行字节等值、回执报失败因。
- T95 边界：`batch` 无匹配行（指针在盘但无行指它）⇒ `applied = []` · `skipped = []`（零行不报错）；`batch` 指针不可解析 / 档不存在 ⇒ 拒（**`batch` 入参自身门 §3.3**——零写）。
- T96 错误：`id` / `batch` 同携 ∥ 双缺 ⇒ 拒（文案逐字）；`batch` 非串 ⇒ 拒（守卫 P4）。
- T97 正常：`task_book` 过滤逐档隔离——造 3 批（各 `task_book` 指向不同批档）⇒ `query({ task_book: <批A> })` 回 A 集、B / C 零掺；`count({ task_book })` 数目对；`evidenceOversize` 逐行读数与 `count` 读数一致。
- T98 正常：归批门——`add({ trigger:"归批", task_book:"<在盘批档>" })` 通过；**本笔新写** `task_book` ∥ `trigger=归批` 而指针空缺 ∥ 档不在盘 ⇒ 拒（文案逐字）；行指针所指档已清而本笔未指名 ⇒ 更新照过（回归）。
- T100 正常：`resume_when` —— `add` / `update` 携值落行；空串 / 全空白 ⇒ 拒；不带参零回归；旧库（无列）打开 ⇒ ALTER 补列、行不损、二次打开零副作用；`query` 行集携带。
- T101 边界：`evidence` 超限读数——写一行 301 字 `evidence` ⇒ `query` 该行 `evidenceOversize === true`、`count.evidenceOversize === 1`；**写入不拒**（行已落）。

**在册状态（单源）**：用例 **T99 · T102–T108 · T123–T124**（指针判据重锚面）**未落地在册（在册未落）**——`thincoder-core/test/ledger-pointer-reanchor.test.mjs` 实读**不在盘**（落地后新建）；落地批 = 台账 #1550。

**用例表（续——指针判据重锚与读数；单元测试档 = `thincoder-core/test/ledger-pointer-reanchor.test.mjs`（实施轮新建 ~180–240 行——T99 · T102–T108 · T123–T124；靶向单跑 `node --test test/ledger-pointer-reanchor.test.mjs`），一次性验收 · 零留档）**：

- T99 正常（C 收口重锚）：批档收口时本批尚存未落行 ⇒ 库内该行 `trigger = 条件` ∧ `resume_when` = 复启句（`<批名>` = 本档文件部分）∧ 该行读数 `overdue = null`（无 `@` 锚 ⇒ §3.4 判 `free`——不产 `resume_due`）；**该列现值非空的行**（行主条件句在册）⇒ 原值不动 ∧ 复启句追加 `evidence`；**`待核销` 行零触**（属已落——不取、零改）；`trigger = 认账不排期` 的行零触；回执逐行点名 + 冻结照常；全部已落 ⇒ 无该段。

- T102 正常（A 正面）：行指某批档，档清掉后**只改 `status`**（在途 → 待核销 → 已核销 全链）⇒ 三步全过、零拒；只改 `evidence` ⇒ 过；只改 `trigger`（`归批` → `条件`）⇒ 过。
- T103 正常（A 无耦合锁）：同一串写入在「档在盘」与「档已清」两拍各跑一次 ⇒ 成败零差（写入结果与档在否无关）；两拍读数分别为 `true` / `false`。
- T104 正常（臂② 正面）：本笔新写 `task_book` 指向在盘档 ⇒ 过；行现值在盘、本笔新写 `trigger=归批` ⇒ 过（`add` ∥ `update` 两入口）。
- T105 错误（臂② 反面）：本笔新写 `task_book` 指向不在盘档 ∥ **非空缺文件部分（`§2`）** ⇒ 拒（文案逐字，行不变）；**本笔新写空值**（`null` / 空串 / 全空白）= 未指名 ⇒ 臂② 不触（行非臂① 射程 ⇒ 放行）；行现值不在盘、本笔新写 `trigger=归批` ⇒ 拒（同两句文案）。
- T106 错误（臂① 未放宽）：结果行 `status ∈ {在途, 待核销}` ∥ `trigger=归批` 而 `task_book` 空（`null` ∥ 空串 ∥ 全空白）⇒ 拒（文案逐字 = §6.1 第三句 `task_book 必填（在途 / 待核销 / 归批 须携任务书指针）`，行不变）。
- T107 正常（B 读数）：`query` 行集逐行携 `taskBookOnDisk`（档在盘 `true` / 删档后 `false` / 缺指针 `false`）；不入库 ∧ 不入 `DATA_COLUMNS`（13 列零变）；`ledgerBatchRows` 行集同携该键。
- T108 边界（C 幂等 ∥ 失败语义）：对已全为 `条件` 的批再调重锚单源 ⇒ 零行改（行字节等值）、`alreadyAnchored` 计数对；注入台账写失败 ⇒ 整集 `ROLLBACK`（零行改）+ 返回形 `failed` 项 = 失败因 ∧ close 回执点名未重锚集 + **冻结照常完成**（档面收口零回退）（失败注入 = 既有手法：第二连接持写锁 ∥ 临时目录夹具——与 T27 同族；注入点 = 实施轮定）。
- T123 边界（C 次序）：夹具 = 批档 §3 为空（链完整性门拒）∧ 本批一行 `trigger=归批` 指本档 ⇒ `close` 拒 ∧ 该行 `trigger` 仍 `归批`、`evidence` 零追加（台账零写、`failed` 不产）；补 §3 后同档再 `close` ⇒ 该行改 `条件` + 复启句。
- T124 边界（C `cwd` 基准）：工作区锚（项目 A + B）· 批档在 A · A 库一行 ∥ B 库一行各指本档 ⇒ `close` A 的批档 ⇒ A 库该行改 `条件`、B 库字节等值（零改）；`ledgerBatchRows` 取出的是 A 的库行集（非按会话锚收敛所得之根）。

**用例表（续——出口面；单元测试档 = `thincoder-core/test/ledger-overdue.test.mjs`（实施轮新建 ~100–150 行——T109–T114；靶向单跑 `node --test test/ledger-overdue.test.mjs`），一次性验收 · 零留档）**：

**在册状态（单源）**：用例 **T109–T114**（出口面）**未落地在册（在册未落）**——`thincoder-core/test/ledger-overdue.test.mjs` 实读**不在盘**；落地批 = 台账 #1530 的出口面。

- T109 正常：`overdueOf` 四类首中优先（序 = `resume_due` → `dangling` → `unlabeled` → `aged`）——`resume_due`（`trigger=条件` ∧ 日期锚 `@<过去日>`）∥ `dangling`（`trigger=归批` ∧ 批档不在盘）∥ `unlabeled`（`trigger IS NULL` ∧ 行龄 > 30）∥ `aged`（未决 ∧ 行龄 > 30，本拍用 `trigger = 认账不排期`）各一拍；皆不中 ⇒ `null`；归档态 ⇒ `null`（不判）。
- T110 正常：`ledgerCount` 回报 `{ count, overdue, evidenceOversize }`（三值各对 · `overdue ≤ count`）；`ledgerQuery` 行集逐行携 `overdue`；**不入库、不入 `DATA_COLUMNS`**（列集零变）。
- T111 边界：`resume_when` 无锚（`free`）⇒ 该行不产 `resume_due`；事件锚 `@<符号>` ⇒ 不产 `resume_due`（机器不判成立性）；非法日期形（`@2026-02-30` / `@2026-1-1`）⇒ 事件锚（同不产 `resume_due`）；多锚只取首枚（`@2026-02-30 @2026-01-01` 由首枚定类）——各类皆可被枚举读出。
- T112 正常（可见面）：`formatDetailLine` 逐字含 `（老化 <aged> · 待处置 <overdue>）`（恒显，含 0）；`formatMarker`（L1）文本零变；`scopeMarkerOf` 的 `warn` = `overdue>0 ∨ deadExecutors>0`（负向锁：全 0 ⇒ `warn=false`；**正向取证**：仅 `dangling` / `resume_due` 命中——`overdue>0 ∧ aged=0 ∧ deadExecutors=0` ⇒ `warn=true`，旧口径下此格为 `false`）。
- T113 正常（轮界清单）：批档收口 ⇒ 回执含「本批未落行 + 全库超龄行」逐行点名（`#<id> <出口态> <title>`）；`batch create` 回执**不含**该清单；清单**零写**（库内行字节等值）+ 冻结照常完成。
- T114 边界：**写入零阻**——超龄行照常可 `update` / `close`（机判不出现在任何写门）；`aged` 达阈值不使任何写入被拒（读数非闸门）。

## 9. 边界（本档不做）

- 不做 manifest（M1，只互指咬合）；不做批次档（M3）；不做 checklist（M7 废除，语义由本模块六态承接）。
- 不做 `docs/TODO-archive.md` 项目归档档搬迁；不承载细节展开（条目一行一条）。
- 不新增台账展示面形态（`ledger-surface.mjs` ×3 保留——仅 CLI 胶水**机制归核**切 core `runLedgerScan`，渲染面零新增形态）；不造 SQLite 计数状态条。
- 不做 `check-ledger` 脚本迁移（归 M8 删除）。
- 不新增工具/命令/快捷键面；不监听文件系统；不做跨进程缓存 / 全工作区深扫 / 网络面。
- 不写实现代码（ledger.mjs = eng-coder 写域）；不写提示词实体。
- **同级枚举上限**（成本有界）：`MAX_SIBLING_SCAN`——目录项数超限 → 该层候选判空集，退化 current-only；current 缺 → 锚本地枚举（锚自身**已注册**（档 ∨ 库）的直接子目录——不沿祖先链上找）。
- **项目根推导**（§2.1 / §3.8）：不承载「无声明可推」的处置（用户 2026-10-16 18:24：保证面 = **另命题**）——**不设兜底 / 不设冷启动推演**（无根 ⇒ 读面空账 ∥ 写面抛——§3.8「无根契约」）；不新增参数面（`cwd` 保留——它是「动作目标路径」的载体）；不改 `ledgerKey` / 台账语义 / 状态机。
  **族发现同级枚举 = 「已注册」单谓词**（`ledgerChildren` 随迁 `ledger-db.mjs`、谓词放宽——消费面 = 族发现 ∥ `agent/light-round.mjs` 候选枚举，同源；上限与惰性算法零改）；**不动 manifest 面其余判据**：`discoverProjects` / `discoverRepos` 算法本体 ∥ `projectView` 读面五态 ∥ `findGuideRoot` 零改——`manifest-discovery.mjs` 本批只改 `projectRootView` 取根臂（§3.8 受影响面）。
- **判活四不做**（F-LX1）：不做写径探测（`ledgerUpdate` / `ledgerClose` 零判活——判活只落显示面）；不做逐行 exec（一次批量 + 5s TTL 缓存——§7.3.1 性能红线）；不做心跳写共享 SQLite / 自动接手 / 自动清 executor（多进程写竞争 + 绕用户 gate——父侧必答②裁定）；L1 标记文本零扩。
- **库键与迁移**（§2.1 / §2.2）：不做 `realpath` / 符号链接解析；不做**非盘符段大小写折叠**（POSIX 大小写敏感——同 `MEMORY.md` §6.11 口径）；不做别名路径（subst / junction / 8.3）；不做跨项目全量迁移（逐项目锚定）；迁移不自动执行（需 `--confirm`）；存量残档不删除（只报告 + 回收建议）；不动其他用户态面（sessions / checkpoints / memory / `ledger-notify.json` 历史存量档——零读写）。
- **工具层参数守卫**（§3.2）：参数校验射程 = 工具层五入口（写命令三 + 读命令二）；守卫判于核函数之前 ⇒ 核函数体零新增校验（核面改动 = §6.1 写门缺指针 / 空串形——落 `assertTaskBookGate` helper）。
- **标记范围不做**：不改明细行集口径（`当前 ∪ 可动作`——§7.2）；不改族发现 ∕ 同级枚举上限（枚举算法 ∥ `MAX_SIBLING_SCAN` 上限零改；**工作区命中排除** = §2.1 已注册判据的库臂排除；**族发现锚本地**——§7.2）；不合并两池为单数（F1）；不改空值语义（`null` = 无标记——不落 `0·0`）。
- **批级批量不做**（§3.3）：不改六态 / 迁移表本体（批量逐行照判同一表）；不改子代理只读约束（写三 action 仍仅主 agent 装配）；不做「批量追认核销」（追认须逐行结账依据——统一文本会造假账）；不做跨批一次销多批（一批一指针）。
- **归批门不做**（§6.2）：不扫存量 / 不回改存量行（写入时点门）；**不判指针之外的字段**（本笔未指名 ⇒ 零判——旧指针失效不阻账务）；收口重锚不阻断冻结（失败不回退冻结）。
- **收口重锚不做**（§6.2 · C）：只锚**本批未落行**（`status ∈ {待讨论, 待设计, 在途}`——`待核销` 属已落只待结账，不取）∧ **只锚 `条件`**——`trigger = 认账不排期` 的行零触（政策判断归行主人）；不做存量死指针全库批量修复（重锚只随批档**收口**触发——收口两路 = `close` ∥ `status` 写 §1「已收口」，同一单源、零二写、次序 = 状态行写盘之后；存量走写命令 + 读数照出）；复启句落 `resume_when`（§3.4）；**不覆盖行主条件句**（现值非空 ⇒ 复启句追加 `evidence`）。
- **收口动作不二造**（§6.2「收口三动作边界」）：收口两路都跑重锚（写，同一单源）；出口清单（读）只挂 `close` 径；批量结算 = 行主人显式调用、不在收口径内；取行单源 `ledgerBatchRows` 只实现一次（不另建选行）。
- **指针读数不做**（§7.1 · B）：只出逐行读数 `taskBookOnDisk`；不做 `count` 面读数、不做显示面（L1 / L2 / 端胶水）改造、不做全仓扫描式审计（检出面 = `query` 过滤 + 读数）。
- **`resume_when` 不做**（§3.4）：不强制 `trigger=条件` 行携带（可选字段）；不机械校验句内容 / 锚存在性（自由文本）；不复制批档 §1 条件句（两处各自单源）。
- **evidence 超限不做**（§5）：只出读数、不拒写（软上限非闸门——用户裁定「无限机检反感」）。
- **行粒度不做**（§3.9）：不做机械判据（语义面——机检只判形态）；不自动拆行 ∥ 不自动删行（拆行 = 清扫轮动作，主 agent 执行）；不按毛病类拆（拆据恒为工作对象）。
- **出口面不做**（§3.7）：**不为会话收尾造机器事件**（无独立事件——其活并入会话开局）；**不复活「每轮结束播报」**（用户 2026-10-16 01:10 已撤 F3——「太吵」）；**不自动改行**（机判只产读数与清单；`status` 不静默降级、`认账不排期` 不机器代填——政策判断归行主人）；**阈值不可配**（`AGING_DAYS` 常量单源，不加旋钮）；不改 L1 标记文本（§7.3.1 契约不动）。
