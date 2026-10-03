# 2026-10-03 · read-data-interface
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-03 · 来源 = 用户 2026-10-03 23:44 转外部意见（「@指甲长得长」——只读数据接口族：CLI --json ∥ ACP 只读方法 ∥ 桌面）+ 同拍裁定「桌面放弃吧。只做cli」「我说的时那些用户需求」——③ 桌面面裁弃；①②（CLI 命令面 ∥ ACP 面）入批；需求档 `docs/cli/requirements/READ-DATA-INTERFACE.md`（父侧笔 · 已落）。
> 台账 = #886 ∥ #887（cli · 归批）。前情 = 无（独立批——只读数据接口）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**来源与裁定**：用户 2026-10-03 23:44 转外部意见（「@指甲长得长」——统一只读数据接口族：① CLI `ledger list --json` ∥ ② ACP 只读方法 ∥ ③ 桌面同套），同拍裁定「桌面放弃吧。只做cli」+「我说的时那些用户需求」（= 指本需求族，非今晚在飞桌面批）。**判读**：③ 桌面面裁弃；①②（CLI 命令面 ∥ ACP 面——acp 由 cli 程序承载）入批。**待复核**：若用户口径为「连 ② 也不做」⇒ 开批期剔除 ②（设计未进实施，代价低）。

**需求落点**：`docs/cli/requirements/READ-DATA-INTERFACE.md`（父侧笔 · 已落——FR1–FR3 / N1–N3）。台账 = #886 ∥ #887。

**勘验依据**：六面静态勘察（只读 · ≈20 读——要点）：命令面仅 `migrate`/`audit`（`command-table.mjs:154-165`）∥ 核读 API 已在（`ledger-cmd.mjs:20/33` ∥ `ledger.mjs:117`）∥ CLI 零 `--json` 先例 ∥ 库零版本标记（`memory.db` 有 `user_version` 先例可抄）∥ 只读句柄先例 = `ledger-migrate.mjs:30` ∥ ACP 注册 = 四工厂 spread（`acp.mjs:116-122`）+ `ext.mjs:18-73` 先例 ∥ 通知 = `transport.mjs:34` ∥ batch §-状态文件可机读（`batch-skeleton.mjs:34-39` / `:113-126`）∥ 桌面 `batch:status` = manifest phase（非批次档——外部意见措辞更正）。

**边界**：不做桌面（裁）∥ 零写面 ∥ 族定义单源 = `docs/core/design/LEDGER.md` §7（#882 成套）∥ 不动 `ledger migrate`/`audit` 现有语义。

**授权口径**：全自动通道（用户 23:14「都自动跑完」沿——代点火评审 ∥ 派发 ∥ 代签 ∥ 落地）；止点 = 新范围 / 口径裁决 / 破坏性。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（设计档 docs/cli/design/READ-DATA-INTERFACE.md 落笔 · doc-check 复跑 exit 0 · 待父侧点火评审）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**本批条目（覆盖——需求档 `docs/cli/requirements/READ-DATA-INTERFACE.md` FR1–FR3 ∥ N1–N3）**

| # | 条目 | 承接（设计档章节 ∥ 用例） |
|---|---|---|
| FR1 | CLI `thincoder ledger list --json`：全列 + `schemaVersion`；`evidence` 默认省 / `--full` 给 | §2.3 ∥ §2.7 · RDI-1 ∥ RDI-2 |
| FR2 | 三口径（当前 ∥ `--cwd` ∥ `--family`；空集 exit 0；全程只读） | §2.2 ∥ §2.4 · RDI-3–RDI-6 |
| FR3 | ACP `ledger/list` ∥ `ledger/count` ∥ `batch/list` + 「数据已变更」通知 | §2.5 ∥ §2.6 · RDI-7–RDI-9 |
| N1 | 两出口共用核读出口统一序列化（零 SQL 复刻 ∥ 零表名泄漏） | §2.1 ∥ §2.3 · RDI-7（双出口等值） |
| N2 | `schemaVersion` = `user_version` 标记（写面落标；结构变更同步升号） | §2.3 · RDI-4 |
| N3 | 族口径与 LEDGER.md §7 同源成套（只引不另立） | §2.4 · RDI-5 |

**明确不在本批**：桌面面（用户 2026-10-03 裁定裁弃）∥ 写面（零写命令 / 零变更方法）∥ 协议版本与 `initialize` 形状（零动）∥ 无版本库结构推断 ∥ `ledger/count` 族计数 ∥ CLI 非 `--json` 人性化输出。

**设计档落点**：`docs/cli/design/READ-DATA-INTERFACE.md`（**新建**——与需求档同名成对；归属设计轮定，备选「并入既有档」被否——四邻档各有所主）。地图登记 = `docs/README.md`（**本轮已落**：§1 计数收正 + 变更记录）。

**机制设计（要点——全文 = 设计档 §2 / §3）**
- 只读开库（FR2③）：`openLedger(cwd, { create, readOnly })` 增 readOnly 态——`DatabaseSync(file, { readOnly: true })`（先例 `thincoder-core/ledger-migrate.mjs:30`）+ 零 DDL / ALTER + items 表探针（缺 ⇒ 空账 null）；读面两调用点（`thincoder-core/ledger-cmd.mjs:21` / `:34`）切换只读。
- 统一序列化（N1）：新档 `ledger-read.mjs`——`ledgerExport({ cwd, family, full })` → `{ projects: [{ root, name, schemaVersion, rows }] }`；行 = id + 12 数据列（`DATA_COLUMNS` 单源）；`evidence` 仅 full；行集直用 `ledgerQuery`（零 SQL 复刻）。
- schemaVersion（N2）：`LEDGER_SCHEMA_VERSION = 1`（ledger-db）+ 写面落标 + 读面如实（旧库 = 0）。
- 批次读面（FR3③）：新档 `batch-read.mjs`（`listBatchRecords`）+ `batch-skeleton` 增 `readSectionStatusWord`（§4 / §6 = 字面「无状态词」）；收集器 `collectMarkdownFiles` 转导出复用。
- ACP 面（FR3）：新档 `read-data.mjs`——三方法 + watcher（5s 指纹轮询、可注入；`ledger/changed` ∥ `batch/changed`，params `{ cwd }`）；`thincoder-cli/src/acp.mjs:116` 邻位展开；协议版本 / 能力面零动；动态 import（W8 契约②）。
- 命令面（FR1）：`thincoder-cli/src/command-table.mjs:154` 增 `list` 分支 → `runLedgerList`；严格解析（缺 `--json` / 未知参 ⇒ usage + exit 1）；成功 = stdout 单段 JSON + exit 0。

**受影响文件与行数预算**（现行 = 行数实读 as-of 2026-10-03；Δ = 预期增量）

| 文件 | 现行 | Δ | 预算 | 落点 |
|---|---|---|---|---|
| thincoder-core/ledger-db.mjs | 134 | +31 | ~165 | `:108` openLedger 增 readOnly + 常量 + 落标 |
| thincoder-core/ledger-cmd.mjs | 140 | +4 | ~144 | `:21` / `:34` 切只读 |
| thincoder-core/ledger-read.mjs | 新 | ~150 | ≤300 | ledgerExport + 三口径 + runLedgerList |
| thincoder-core/agent-tools/batch-skeleton.mjs | 174 | +22 | ~196 | `:113` 邻位 readSectionStatusWord |
| thincoder-core/agent-tools/batch-read.mjs | 新 | ~90 | ≤300 | listBatchRecords |
| thincoder-core/agent-tools/batch-lifecycle.mjs | 332 | 0 | 332 | `:62` 收集器转导出 |
| thincoder-core/ledger.mjs | 241 | 0 | 241 | 零编辑（只 import discoverFamily——规避在飞写域） |
| thincoder-cli/src/acp/read-data.mjs | 新 | ~150 | ≤300 | 三方法 + watcher |
| thincoder-cli/src/acp.mjs | 143 | +13 | ~156 | `:116-122` 工厂接线 + watcher 出参 + 启动 |
| thincoder-cli/src/command-table.mjs | 185 | +8 | ~193 | `:154` 分支 + `:162` usage |
| thincoder-cli/src/completions.mjs | 140 | +6 | ~146 | 三套脚本 list 词 |
| thincoder-cli/bin/thincoder.mjs | 178 | +3 | ~181 | `:137` 邻位 USAGE 两行 |
| docs/batches/2026-10-03-read-data-interface.test.mjs | 新 | ~300 | 超即拆 | 批内单测（先红后绿） |
| docs/README.md | 152 | +3 | ~155 | §1 计数 + 变更记录（已落） |
| docs/cli/design/CLI-ENTRY.md | 80 | +3 | ~83 | 实施轮随动（§2 行 + 变更记录） |
| docs/cli/design/ACP-CLIENT.md | 650 | +7 | ~657 | 实施轮随动（§2.1 / §2.2 行 + 变更记录） |
| docs/core/design/LEDGER.md | 509 | +~6 | 515 | 协调（#882 写域让渡后：§2 / §7.1 登记） |

**测试面**：批内单测件 = `docs/batches/2026-10-03-read-data-interface.test.mjs`（名随批档 · 不入仓套件 · 随批留存）；运行 = 自 thincoder/ 仓根 `node --test docs/batches/2026-10-03-read-data-interface.test.mjs`。用例 RDI-1–RDI-12（设计档 §7——可机判 · 先红后绿；RDI-4 = 只读负向锁）。CLI 子进程沙箱 = HOME / USERPROFILE 临时目录（先例 = 批内件同法）。集成面：零动。

**验收对照（回指 FR 判定句——逐条）**

| 判定句 | 机检项 | 用例 |
|---|---|---|
| FR1① parse + schemaVersion | stdout 单段 JSON + 键在场 | RDI-1 |
| FR1② evidence 默认省 / `--full` 给 | 键集对拍 | RDI-2 |
| FR1③ 与核 ledgerQuery 同源同数 | 逐 id 对拍 | RDI-1 |
| FR2① 三范围 | 三读对拍 discoverFamily | RDI-5 / RDI-6 |
| FR2② 空集 exit 0 | `{"projects":[]}` + 码 0 | RDI-3 |
| FR2③ 只读零改 | 旧库哈希等 + 无库不建 + 零 DDL | RDI-4 |
| FR3① 三方法 | 直驱三方法 | RDI-7 |
| FR3② 通知可达 | 变更后捕获 + 无变更零捕获 | RDI-9 |
| FR3③ 状态对拍文件面 | 逐段对拍 | RDI-8 |
| N1 双出口同源 | 载荷深等 | RDI-7 |
| N2 标记 | 写后 1 / 旧库 0 | RDI-4 |
| N3 族同源 | family = discoverFamily 逐项 | RDI-5 |

**关键决策（含被否——全文 = 设计档 §5）**：D-1 输出分组形（否 平铺）· D-2 独立只读开库态（否 写开库+承诺）· D-3 行集单源两开（否 单开内联 SELECT）· D-4 version 如实回读（否 常量回填）· D-5 `--json` 必需 fail-closed（否 人性化可选）· D-6 通知双方法（否 单方法带标志）· D-7 轮询指纹触发（否 本进程写钩子）· D-8 过凭据门（否 免门）· D-9 initialize 零动（否 加能力字段）· D-10 DATA_COLUMNS 直引（否 搬迁）· D-11 ledger.mjs 零编辑（在飞写域规避）· D-12 通知 params 只 cwd（否 携带明细）。

**上抛项**
1. `docs/core/design/LEDGER.md` 登记随动（§2 版本标记 / §7.1 导出面）——该档现属 #882 在飞批写域；请协调让渡后落笔（或随动轮排期）。
2. 词面登记随动（`docs/cli/design/CLI-ENTRY.md` §2 行 ∥ `docs/cli/design/ACP-CLIENT.md` §2.1 / §2.2 行）——实施轮同步落；排期请父侧知悉。
3. 计数收正披露（一致性面 · 已修）：`docs/README.md` §1 前值 `cli/` 14（design 9 + requirements 5）与实际 15（需求档 10-03 已落未登记）不符——本轮随档一并收正为 16（另 + 本设计档；全档总数 50 ⇒ 52）。
4. 口径披露：`docs/core/design/LEDGER.md` §7.4 ⑤ 不变量（不新增命令 / 工具面 ∥ headless 零新增输出）= 展示面机制 v1 语境——与本批新出口板两不相抵（设计档 §1 已书面厘清，备评审复核）。

## §3 设计评审（评审子代理）
## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
