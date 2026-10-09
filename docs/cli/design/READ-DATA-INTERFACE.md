# 只读数据接口（READ-DATA-INTERFACE）· CLI 面 · 设计

> 板块 = **只读数据接口**——台账与批次档数据对外暴露的**只读出口**：CLI 命令面（`thincoder ledger list --json`）∥ ACP 协议面（`ledger/list` · `ledger/count` · `batch/list` + 数据变更通知）。
> 配对需求档 = `docs/cli/requirements/READ-DATA-INTERFACE.md`（FR1–FR3 ∥ N1–N3——逐条承接；判定句回指 = 本档 §6）。
> 论域文件 = `thincoder-core/ledger-db.mjs`（只读开库 ∥ 版本标记）· `thincoder-core/ledger-read.mjs`（拟新增——统一序列化 + 命令 runner）
> · `thincoder-core/agent-tools/batch-read.mjs`（拟新增——批次档读面）· `thincoder-cli/src/acp/read-data.mjs`（拟新增——ACP 方法族 ∥ 变更观察）
> · `thincoder-cli/src/command-table.mjs`（`list` 分发）· `thincoder-cli/src/completions.mjs` · `thincoder-cli/bin/thincoder.mjs`（USAGE）。
> 建档：2026-10-03（read-data-interface 批 · 设计轮 · eng-designer——承批档 `docs/batches/2026-10-03-read-data-interface.md` §1 · 台账 #886 ∥ #887）。

## 1. 定位与归属

- **落点 = 新配对档**（本档——与需求档同名成对；2026-10-03 设计轮定）。备选「并入既有档」被否：四邻档各有所主（下条），本板块（两出口共用核读出口）在既有档中无承载位（D2——不硬塞）。
- **与四邻档的分界**（D2 单一权威源——本档只写「只读出口」行为，四邻零重述）：
  - 词面（命令树 / 旗标 / 补全发射 / USAGE）= `docs/cli/design/CLI-ENTRY.md`——本批新增词的登记 = 实施轮随动（§4 表）；
  - ACP 通道（传输层 / 处理器划分 / 版本协商 / 通知通道）+ 方法覆盖登记 = `docs/cli/design/ACP-CLIENT.md`——新方法行登记 = 实施轮随动；
  - 台账机制（库键 / 六态 / 写门 / 族定义 §7）= `docs/core/design/LEDGER.md`——本档只引（族口径与 §7 同源成套；N3）；
  - 批次档机制（六段骨架 / 状态词表 / 路径解析）= `docs/core/design/BATCH-RECORD.md` + 代码单源 `thincoder-core/agent-tools/batch-skeleton.mjs`。
- **口径厘清**（两处既有语句——随 #882 让渡后的登记轮同笔收口，上抛项 1）：
  - `docs/core/design/LEDGER.md` §7.8 不变量 ⑤（`docs/core/design/LEDGER.md:361`——不新增工具 / 命令面 ∥ headless 零新增输出）= 台账**展示面机制**的 v1 决策记录语境（自证「机制与 v1 全同」）；本批 = 另册需求档委托的**新出口板**（命令 / 方法 / 通知皆申报面）——两不相抵；
  - 同档 §9 边界（`docs/core/design/LEDGER.md:453`——不新增工具 / 命令 / 快捷键面；不监听文件系统）：同类判读（新出口板 = 委托申报面，非机制自增面）；「不监听文件系统」= 无 `fs.watch` 式事件监听——本批为只读轮询指纹（5s stat 探测，D-7），非监听——两不相抵，如实披露。
- **边界**：本档 = 只读出口；写面（六态写命令 ∥ 批次档写工具）零动。

## 2. 机制设计（决策与理由）

### 2.1 总链

- **两出口共用核读出口统一序列化**（N1）：CLI 与 ACP 都不落 SQL、不碰表名——一律经核只读函数取完整载荷：
  - 台账：`ledgerExport({ cwd, family, full })` → `{ projects: [...] }`（拟新增——`thincoder-core/ledger-read.mjs`）；
  - 批次：`listBatchRecords({ cwd })` → `{ batches: [...] }`（拟新增——`thincoder-core/agent-tools/batch-read.mjs`）。
- 载荷即对外契约（§3）——出口只做「解析入参 → 调核 → JSON 序列化」；序列化零复刻。

### 2.2 只读开库（FR2③ 落点）

- 现读面 `openLedger`（create=false）也跑 DDL + ALTER（`thincoder-core/ledger-db.mjs:124-125`）⇒「读一次 = 写一次结构」，与 FR2③ 相抵。
- 改法：`openLedger(cwd, { create, readOnly })` 增 `readOnly` 态——`new DatabaseSync(file, { readOnly: true })`（先例 = `thincoder-core/ledger-migrate.mjs:30`）+ **零 DDL / 零 ALTER**；items 表缺失探针 ⇒ 视同空账返回 null（观测面保持「空集」，写面零触）。
- 读面两调用点切只读：`ledgerQuery` / `ledgerCount`（`thincoder-core/ledger-cmd.mjs:21` / `:34`）；写面（create=true）语义零变。
- 如实副作用：旧库（缺 `executor` 列）**读**不再自动补列——补列归写面开库；读出行缺列按 null 归一（§2.3）。

### 2.3 统一序列化 + schemaVersion（N1 / N2）

- 载荷单源 = 核 `ledgerExport`：行 = `id` + 12 数据列集（**列集单源 = `DATA_COLUMNS`**——`thincoder-core/ledger-migrate.mjs:18-21`，不另立副本）；`evidence` 仅在 `full=true` 入行（FR1②）；缺列（旧库）⇒ null。
- 行集读 = `ledgerQuery`（零 SQL 复刻——既有核读 API 直用）；版本探针 = 独立只读开库读 `PRAGMA user_version`——两开均只读态。
- `schemaVersion`（N2）：台账库 `user_version` 标记本批新增——常量单源 `LEDGER_SCHEMA_VERSION = 1`（`ledger-db` 档）；写面开库落标（`v < 常量 ⇒ 置`）；读面如实回读（旧库未标 = 0）；库不在 ⇒ 项目不出项（空集）。
- 对外形状与库龄无关（行按 12 列归一出形）——版本号自证结构。

### 2.4 三口径（FR2①）

- 范围 = 当前项目（缺省）∥ `--cwd <dir>` ∥ `--family`。
- 族口径 = `discoverFamily`（`thincoder-core/ledger.mjs:95`——`docs/core/design/LEDGER.md` §7 族定义单源，只引不另立；N3）；`--family` 逐项读族内项目（**不可读跳过**——既有语义），发现序 = current 在前、余按名升序。
- 单范围 = 当前项目一项；无台账（库不在）⇒ `projects: []`（exit 0——FR2②）。
- 输出统一分组形（族态逐项归属——各行 id 键空间按库独立，平铺会撞号；§5 D-1）。

### 2.5 批次档读面（FR3③）

- 核 `listBatchRecords({ cwd, bases })`：文件集 = 基底根（`batchDocBases`——`thincoder-core/agent-tools/batch-paths.mjs:56`）下全部 `*.md`（递归——收集器 `collectMarkdownFiles` 转导出复用，`thincoder-core/agent-tools/batch-lifecycle.mjs:62`）；路径排序稳定；单档读错跳过（尽力面）。
- 各段状态 = 新解析器 `readSectionStatusWord(src, seg)`（`batch-skeleton` 新增）：段头 / 状态行正则 / 词表全消费既有单源常量；`§1`–`§3` / `§5` 给已识别关键词（**终态词优先**——镜像冻结门取值序），无行 / 无命中 ⇒ null；`§4` / `§6` 无词条 ⇒ 字面 `无状态词`（不造词）。
- 词表单源 = `STATUS_WORDS`（`thincoder-core/agent-tools/batch-skeleton.mjs:34-39`）——`batch/list` 与冻结门字面零漂移。

### 2.6 ACP 面（FR3）

- 新模块 `thincoder-cli/src/acp/read-data.mjs`（拟新增）：工厂 `createReadDataHandlers(ctx, { intervalMs })` → `{ handlers, watcher }`；在 `thincoder-cli/src/acp.mjs:116-122` 邻位展开（与 `checkpoint/*` · `memory/*` 工厂同法；`ext` 档零触）。
- 三方法（params / result 见 §3）：`ledger/list` ∥ `ledger/count` ∥ `batch/list`。
- 凭据门 `requireConfigured()`——与既有四族同门（统一访问策略；只读性不改通道门；§5 D-8）。
- 版本面零动：`SUPPORTED_PROTOCOL_VERSIONS` 不变（`thincoder-cli/src/acp/client-caps.mjs:15`）；`initialize` 响应形状零动（方法为附加面，不进能力字段——先例 `checkpoint/*` · `memory/*` 未进能力面；§5 D-9）。
- **变更通知**（挂现有 notify 通道——`thincoder-cli/src/acp/transport.mjs:34` 无 id JSON-RPC，现仅 `session/update`）：
  - `ledger/changed` ∥ `batch/changed`，params `{ cwd }`（信号面——数据经拉取方法取，不随通知喂载荷；`cwd` = 观察域取值——见下）；
  - **观察域 = 服务进程 cwd**——每轮轮询经 `ctx.getCwd()` 求值（与 `params.cwd` 缺省同取值）；非观察项目的变更不产生通知；
  - 观察器 = 轮询指纹：台账 = 库文件 `(exists, mtimeMs, size)`；批次 = `*.md` 集逐档 `(path, mtimeMs, size)`（文件集经 `listBatchRecords` 同源）；
  - 首查立基线（静默）；此后差分 ⇒ 对应通知；默认周期 `WATCH_INTERVAL_MS = 5000`（注入面 `intervalMs`；`unref` 定时器——先例 `thincoder-core/ledger-surface.mjs:62-85`）；
  - 起停 = `runAcpServer` 启、进程终灭；测试直驱 `watcher.check()`（零定时器依赖）。

### 2.7 命令面接线（FR1）

- `thincoder ledger list --json [--full] [--family] [--cwd <dir>]`；`list` 分支加进 `ledger` case（`thincoder-cli/src/command-table.mjs:154-165`——同族 migrate / audit 直引核 runner 先例）；runner = `runLedgerList`（`ledger-read` 档）。
- 严格解析：未知参 / 缺 `--json` ⇒ usage + exit 1（机器面 fail-closed——与 migrate / audit 宽松面刻意不同；§5 D-5）；`--cwd` 空格形（同族先例）。
- 成功 = stdout 单段 JSON（零杂行）+ exit 0（含空集）；解析类错误 ⇒ stderr + exit 1。

## 3. 接口契约

### 3.1 CLI 命令面

```text
thincoder ledger list --json [--full] [--family] [--cwd <dir>]
```

| 旗标 | 含义 | 缺省 |
|---|---|---|
| `--json` | 必需——输出单段 JSON | 缺 ⇒ usage + exit 1 |
| `--full` | 行含 `evidence` | 省 ⇒ 零 `evidence` 键（FR1②） |
| `--family` | 族口径（锚 = `--cwd` ?? 进程 cwd） | 省 ⇒ 当前项目 |
| `--cwd <dir>` | 项目锚（空格形——同族先例） | 省 ⇒ 进程 cwd |

- exit 码：0 = 成功（含空集）；1 = 解析错 / 读错（stderr 一行消息，零栈泄）。

### 3.2 JSON 载荷（冻结形——两出口共用）

```json
{
  "projects": [
    {
      "root": "<绝对路径>",
      "name": "<basename>",
      "schemaVersion": 1,
      "rows": [
        { "id": 7, "kind": "requirement", "status": "在途", "title": "…", "board": "…",
          "req_doc": null, "task_book": "…", "trigger": null, "executor": null,
          "created_at": "…", "updated_at": "…", "closed_at": null }
      ]
    }
  ]
}
```

- 行键集 = `id` + 11 数据列（`kind`…`closed_at`）；`--full` / `full=true` 时 `task_book` 与 `trigger` 之间入 `"evidence"`。
- `schemaVersion` = 该库 `user_version`（0 = 旧库未标；1 = 现行结构——§2.3）；空集 = `{"projects": []}`。
- `root` / `name` 派生写死：`root` = 与库键同源解析的项目根（`resolveProjectRoot(cwd) ?? resolve(cwd ?? ".")`——子目录锚归项目根；同式 = `ledgerDbPath` 键源——`thincoder-core/ledger-db.mjs:50-52`）；`name` = `basename(root)`。

### 3.3 ACP 方法（params / result / 错误）

| 方法 | params | result | 错误 |
|---|---|---|---|
| `ledger/list` | `{ cwd?, family?, full? }` | `{ projects: [...] }`（与 CLI 载荷逐字同形） | `-32602` INVALID_PARAMS（`cwd` 非字符串 / `family`·`full` 非布尔 / 解析类错误转述） |
| `ledger/count` | `{ cwd? }` | `{ count: <number> }`（单源 = 核 `ledgerCount`——未决四态计数） | 同上 |
| `batch/list` | `{ cwd? }` | `{ batches: [ { file, path, sections } ] }` | 同上 |

- `sections` = `{ "§1" … "§6" }` 映射：`§1`–`§3` / `§5` = 已识别关键词 ∥ null；`§4` / `§6` = 字面 `无状态词`（§2.5）。
- `cwd` 缺省 = 服务进程 cwd（`ctx.getCwd()`）；`path` = 绝对路径（`/` 归一）；`file` = basename；`batches` 按路径升序。

### 3.4 通知（挂现有 notify 通道）

| 通知 | 触发 | params |
|---|---|---|
| `ledger/changed` | 观察周期内台账库文件指纹变 | `{ cwd }` |
| `batch/changed` | 观察周期内基底 `*.md` 集指纹变 | `{ cwd }` |

- 观察域 = 服务进程 cwd（每轮 `ctx.getCwd()` 求值——与 `params.cwd` 缺省同取值）；非观察项目的数据变更不通知；`params.cwd` = 观察取值。

### 3.5 核导出面（新增 / 变更）

| 文件 | 面 |
|---|---|
| `thincoder-core/ledger-db.mjs` | + `LEDGER_SCHEMA_VERSION`；`openLedger(cwd, { create, readOnly })` |
| `thincoder-core/ledger-cmd.mjs` | 读面两函数切只读开库（签名零变） |
| `thincoder-core/ledger-read.mjs`（拟新增） | `ledgerExport` · `runLedgerList` |
| `thincoder-core/agent-tools/batch-skeleton.mjs` | + `readSectionStatusWord` |
| `thincoder-core/agent-tools/batch-lifecycle.mjs` | `collectMarkdownFiles` 转导出（零行为变） |
| `thincoder-core/agent-tools/batch-read.mjs`（拟新增） | `listBatchRecords` |
| `thincoder-cli/src/acp/read-data.mjs`（拟新增） | `createReadDataHandlers` · `WATCH_INTERVAL_MS` |

## 4. 受影响文件与行数预算

口径 = 行数实读（as-of 2026-10-03）；Δ = 预期增量；「随动」= 落笔轮次非本轮；模块 = M 族归属（L7 取数面——非 M 族标 `—`）。

| 文件 | 模块 | 现行 | Δ | 预算 | 改动点 |
|---|---|---|---|---|---|
| `thincoder-core/ledger-db.mjs` | M2 | 134 | +31 | ~165 | `openLedger:108` 增 readOnly 态 + items 探针 + 常量 + 落标 |
| `thincoder-core/ledger-cmd.mjs` | M2 | 140 | +4 | ~144 | `:21` / `:34` 两读点切只读 |
| `thincoder-core/ledger-read.mjs`（拟新增） | M2 | — | ~150 | ≤300 | 序列化 + 三口径 + `runLedgerList` |
| `thincoder-core/agent-tools/batch-skeleton.mjs` | M3 | 174 | +22 | ~196 | `:113` 邻位增 `readSectionStatusWord` |
| `thincoder-core/agent-tools/batch-read.mjs`（拟新增） | M3 | — | ~90 | ≤300 | 记录列举 + sections 组装 |
| `thincoder-core/agent-tools/batch-lifecycle.mjs` | M3 | 332 | 0 | 332 | `:62` 收集器转导出（本批零增） |
| `thincoder-core/ledger.mjs` | M2 | 241 | 0 | 241 | 零编辑——只 import `discoverFamily`（规避在飞写域；§5 D-11） |
| `thincoder-cli/src/acp/read-data.mjs`（拟新增） | — | — | ~150 | ≤300 | 三方法 + 观察器 |
| `thincoder-cli/src/acp.mjs` | — | 143 | +13 | ~156 | `:116-122` 工厂接线 + watcher 出参 + 启动 |
| `thincoder-cli/src/command-table.mjs` | — | 185 | +8 | ~193 | `:154` 分支 + `:162` usage 行 |
| `thincoder-cli/src/completions.mjs` | — | 140 | +6 | ~146 | 三套脚本 `list` 词（`:26` / `:73` / `:136`） |
| `thincoder-cli/bin/thincoder.mjs` | — | 178 | +3 | ~181 | `:137` 邻位 USAGE 两行 |
| `docs/batches/2026-10-03-read-data-interface.test.mjs`（拟新增） | — | — | ~300 | 超即拆 | 批内单测（§7） |
| `docs/README.md` | — | ≈154 | 0（本轮已落） | ≈154 | §1 计数收正 + 变更记录（**本轮已落**） |
| `docs/cli/design/CLI-ENTRY.md` | — | 80 | +3 | ~83 | §2 行 + 变更记录（**随动**：实施轮） |
| `docs/cli/design/ACP-CLIENT.md` | — | 650 | +9 | ~659 | §2.1 / §2.2 行 + §3 枚举（`:76` ∥ `:84` 四 ⇒ 五 handler 模块，+ `thincoder-cli/src/acp/read-data.mjs`（拟新增））+ §3.5 模块表（+ 行）+ 变更记录（**随动**：实施轮） |
| `docs/core/design/LEDGER.md` | M2 | 509 | +~6 | 515 | §2 / §7.1 登记（**协调**：#882 在飞写域让渡后——上抛） |

**L7 复核（模块数——口径 = `docs/core/design/BATCH-RECORD.md` §5.1）：** 模块列去重 = **2**（M2 台账 SQLite ∥ M3 批次档生命周期）≤ 2——不拆批（§2 表落表后复核）。

## 5. 关键决策记录（含被否）

- **D-1 输出分组形**（`{ projects: [...] }`——族态逐项归属）∥ 被否：平铺 `{ schemaVersion, items }`——跨库 id 撞号、族态零归属。
- **D-2 只读 = 独立开库态**（readOnly 句柄 + 零 DDL）∥ 被否：复用写开库 +「读后不写」承诺——DDL 已执行，承诺不可机检。
- **D-3 行集单源复用**（`ledgerQuery` + 独立版本探针两开）∥ 被否：单开内联 SELECT——SQL 复刻，破 N1。
- **D-4 schemaVersion = 库标记如实回读**（旧库 0）∥ 被否：常量回填成 1——掩盖未迁移结构（N2 成空文）。
- **D-5 `--json` 必需 + 未知参拒**（fail-closed）∥ 被否：可选 + 人性化文本——输出未定形不可机检（人性面既有 `/ledger`）。
- **D-6 通知双方法**（`ledger/changed` ∥ `batch/changed`）∥ 被否：单 `read-data/changed` 带载荷标志——两族粒度合并又要拆，直给更简。
- **D-7 触发 = 轮询指纹**（5s，可注入）∥ 被否：本进程写工具钩子——漏外部变更，而外部消费者场景的要点正是「别处也在改数据」。
- **D-8 三方法过凭据门** ∥ 被否：免门——同通道内策略分裂（四族同门既有）。
- **D-9 `initialize` 零动** ∥ 被否：加自定义能力字段——schema 无位、先例零，严格客户端风险。
- **D-10 `DATA_COLUMNS` 直引**（零搬迁）∥ 被否：移入 `ledger-db`——本批不搬既有单源（零收益）。
- **D-11 `ledger.mjs` 零编辑**（新面落 `ledger-read.mjs`；直引 `discoverFamily`）∥ 理由：该档现属他批在飞写域；「族出口 re-export」惯例的补记 = 让渡后随动（上抛）。
- **D-12 通知 params 只给 `{ cwd }`** ∥ 被否：携带明细——载荷与拉取面重复，喂送面另有维护债。

## 6. 验收对照（回指 FR1–FR3 ∥ N1–N3 判定句）

| 判定句 | 机检项 | 用例 |
|---|---|---|
| FR1① `--json` 可 parse ∧ 含 `schemaVersion` | stdout 单段 JSON + 键在场 | RDI-1 |
| FR1② 默认零 `evidence` 键 ∥ `--full` 含 | 键集对拍 | RDI-2 |
| FR1③ 行集与核 `ledgerQuery` 同源同数 | 逐 id 对拍 | RDI-1 |
| FR2① 三范围各可核 | 当前 ∥ `--cwd` ∥ `--family` 三读对拍 `discoverFamily` | RDI-5 ∥ RDI-6 |
| FR2② 空库 ⇒ 空集 + exit 0 | `{"projects":[]}` + 码 0 | RDI-3 |
| FR2③ 只读零改 | 旧库读前读后哈希等 ∧ 无库不建库 ∧ 零 DDL | RDI-4 |
| FR3① 三方法可调、回包只读数据 | 直驱三方法 | RDI-7 |
| FR3② 通知在数据变更后可达 | 变更后捕获 + 无变更零捕获 | RDI-9 |
| FR3③ `batch/list` 状态与文件面一致 | 与档面逐段对拍 | RDI-8 |
| N1 双出口同源 | 同夹具两出口载荷深等 | RDI-7 |
| N2 `schemaVersion` 标记 | 写后 = 1 ∥ 旧库读 = 0 | RDI-4 |
| N3 族同源 | family 输出 = `discoverFamily` 逐项 | RDI-5 |

## 7. 用例表（批内单测件——先红后绿）

全例先红（面未存在）；RDI-4 红 = 现行读即改库（负向锁）。夹具 = 临时项目树 + `_setLedgerDirForTest` 注入；CLI 子进程 = HOME ∥ USERPROFILE 沙箱（先例 = 批内件同法）。

| # | 类 | 输入 | 期望 | 先红点 |
|---|---|---|---|---|
| RDI-1 | 正常 | 夹具项目 3 行（混态、经写面建库）+ `ledger list --json` 子进程 | exit 0 · 单段 JSON · `projects[0].schemaVersion` = 1 · 行键集 = id+11 列 · 与核 `ledgerQuery` 逐 id 等 | 命令不存在 |
| RDI-2 | 正常 | 同行带 `evidence`；`--json` vs `--json --full` | 默认零 `evidence` 键 ∥ `--full` 等值含 | 命令不存在 |
| RDI-3 | 边界 | 空项目（无库） | exit 0 · `{"projects":[]}` · stderr 空 | 命令不存在 |
| RDI-4 | 边界 | (a) 旧库（旧 DDL——缺 executor、无 user_version）+ 读前读后哈希；(b) 无库项目读后仍无库；(c) 旧库 `schemaVersion` 读 = 0；(d) 写面开库后 = 1；(e) 文件在盘但非台账库（SQLite 可开、无 `items` 表） | 哈希等 ∥ 无新档 ∥ 0 ∥ 1 ∥ `projects: []` ∧ 文件零改 | 现行读即 DDL / ALTER |
| RDI-5 | 正常 | 容器 + 双项目（A 2 行 ∥ B 3 行 + 无库兄弟）；读 A ∥ `--cwd B` ∥ `--family` | 单范围各出自身 ∥ family = 发现序逐项（对拍 `discoverFamily`）+ 无库兄弟不出项 | 命令不存在 |
| RDI-6 | 边界 | 空容器 `--family` ∥ 族内混不可读库 | `{"projects":[]}` ∥ 不可读跳过 | 命令不存在 |
| RDI-7 | 正常 | 同夹具：CLI 载荷 vs ACP `ledger/list` ∥ `ledger/count` ∥ `batch/list` | 深等 ∥ `count` = 核 `ledgerCount` ∥ batches 形 | 方法不存在 |
| RDI-8 | 正常 | 批基底夹具：全骨架档（§1 进行中 · §2 设计完成）∥ 无状态行档 ∥ 嵌套档 | sections 逐段对拍：§1–§3 / §5 关键词 ∥ null ∥ §4 / §6 = `无状态词` ∥ 嵌套档在列 | 方法不存在 |
| RDI-9 | 正常 | `watcher.check()` 基线 → 核写一行 → check；再改批次档 → check；静默轮 → check | 基线静默 ∥ `ledger/changed` ∥ `batch/changed` ∥ 零新增（params `{cwd}`） | 观察器不存在 |
| RDI-10 | 错误 | `ledger list`（缺 `--json`）∥ `--bogus` | exit 1 + usage（stderr） | 命令不存在 |
| RDI-11 | 错误 | `--cwd <不存在路径>` | exit 1 + 一行消息（零栈泄） | 命令不存在 |
| RDI-12 | 错误 | ACP `ledger/list` `cwd:123` ∥ `family:"yes"` | INVALID_PARAMS（-32602） | 方法不存在 |

## 8. 边界（本档不做）

- 不做写面（零写命令 / 零变更方法）；不改 `ledger migrate` / `audit` 现有语义。
- 不做桌面面（2026-10-03 用户裁定）；不做跨机器 / 远程；不另立族定义（单源 = `docs/core/design/LEDGER.md` §7）。
- 不改协议版本、不动 `initialize` 响应形状（§5 D-9）。
- `schemaVersion` 为对外标记本身——不做无版本库的结构推断。
- 通知 = 变更信号（不携带数据载荷 / 不做增量喂送——§5 D-12）；`ledger/count` 单项目（family 计数不在本批）。

## 9. 落定与实施注意

- **落定**：词面（命令 / 旗标 / 补全 / USAGE）· 输出形 · 错误面 · 退出码 · ACP params / result / error · 通知面——全定（§2 / §3）；**open 项 = 无**。
- **实施注意**：
  1. 与在飞批零撞车（`thincoder-core/ledger.mjs` · `ledger-surface.mjs` 在飞改动）——本批对 `ledger.mjs` 零编辑（D-11）；
  2. 文档随动 = 实施轮同步落（CLI-ENTRY · ACP-CLIENT 词面行；`docs/README.md` 本轮已随档登记）；
  3. `docs/core/design/LEDGER.md` 登记（§2 版本标记 / §7.1 导出面）= #882 写域让渡后随动——上抛排期；
  4. 单测先红后绿（§7）——实施者跑批内件即反馈环（零入仓套件）。

## 变更记录

**2026-10-0x 批次落点指针**（本档涉批——落点表 = 各批档 §2 · 一次性材料承载面）：
**本批（read-data-interface · 2026-10-03）落点表** = `docs/batches/2026-10-03-read-data-interface.md` §2（唯一承载面——一次性批次材料）。

- 2026-10-08（**代码长度上限 500/800 口径更换批 · 实施轮 · eng-coder**——承 `docs/batches/2026-10-08-code-limit-500-800.md` §2 · 台账 #1072）：§4 `batch-lifecycle` 行「存量越顾问线」注删（丙——行留守 · 义务格删）；§4 三处预算格 ≤300 = 闭合批叙述面（B 史实保留 ⇒ 零动）。**零语义外扩**（可 revert）。

- 2026-10-04（**read-data-interface 批 · 修复轮（设计评审 #41 · pass · 🔴0 ∥ 🟡3 ∥ 🔵6 · 九条全采纳）· eng-designer**——承批档 `docs/batches/2026-10-03-read-data-interface.md` §3 轮次 1）：① §1 口径厘清补第二处（`docs/core/design/LEDGER.md:453` §9 边界 + 「不监听文件系统」= 非 `fs.watch` 监听）+ 引用精度收正（「§7.8 不变量 ⑤」= `docs/core/design/LEDGER.md:361`）；② §2.6 ∥ §3.4 写死通知观察域（服务进程 cwd——每轮 `ctx.getCwd()` 求值，与 `params.cwd` 缺省同取值；非观察项目不通知）；③ §3.2 写死 `root` / `name` 派生（与库键同源解析项目根 + basename）；④ §3.3 `ledger/count` 补语义（未决四态计数）；⑤ §4 表增模块列（M2 ∥ M3 · 余 `—`）+ L7 复核行（去重 = 2 ≤ 2——不拆批）+ `docs/README.md` ∥ `docs/cli/design/ACP-CLIENT.md` 两行收正（已落 ∥ 随动落点补 §3 枚举、§3.5 模块表两处）；⑥ §7 RDI-4 补一腿（文件在盘但非台账库 ⇒ `projects: []` ∧ 文件零改）。文档面收正（零语义外扩）。

- 2026-10-03（**read-data-interface 批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-03-read-data-interface.md` §2 · 台账 #886 ∥ #887）：建档——① 只读开库态 + `schemaVersion` 标记（`ledger-db`）；② 统一序列化 + 三口径 + `runLedgerList`（`ledger-read`）；③ `batch/list` 读面（`batch-read` + `batch-skeleton` 新解析器）；④ ACP 三方法 + 变更通知（`read-data`）；⑤ 四邻档分界与随动登记（§1 / §4）。
