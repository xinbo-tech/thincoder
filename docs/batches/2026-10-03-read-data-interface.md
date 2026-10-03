# 2026-10-03 · read-data-interface
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-03 · 来源 = 用户 2026-10-03 23:44 转外部意见（「@指甲长得长」——只读数据接口族：CLI --json ∥ ACP 只读方法 ∥ 桌面）+ 同拍裁定「桌面放弃吧。只做cli」「我说的时那些用户需求」——③ 桌面面裁弃；①②（CLI 命令面 ∥ ACP 面）入批；需求档 `docs/cli/requirements/READ-DATA-INTERFACE.md`（父侧笔 · 已落）。
> 台账 = #886 ∥ #887（cli · 归批）。前情 = 无（独立批——只读数据接口）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-04（RDI 12/12 ∥ 父侧复跑 EXIT 0 ∥ 代签在册）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**来源与裁定**：用户 2026-10-03 23:44 转外部意见（「@指甲长得长」——统一只读数据接口族：① CLI `ledger list --json` ∥ ② ACP 只读方法 ∥ ③ 桌面同套），同拍裁定「桌面放弃吧。只做cli」+「我说的时那些用户需求」（= 指本需求族，非今晚在飞桌面批）。**判读**：③ 桌面面裁弃；①②（CLI 命令面 ∥ ACP 面——acp 由 cli 程序承载）入批。**待复核**：若用户口径为「连 ② 也不做」⇒ 开批期剔除 ②（设计未进实施，代价低）。

**需求落点**：`docs/cli/requirements/READ-DATA-INTERFACE.md`（父侧笔 · 已落——FR1–FR3 / N1–N3）。台账 = #886 ∥ #887。

**勘验依据**：六面静态勘察（只读 · ≈20 读——要点）：命令面仅 `migrate`/`audit`（`command-table.mjs:154-165`）∥ 核读 API 已在（`ledger-cmd.mjs:20/33` ∥ `ledger.mjs:117`）∥ CLI 零 `--json` 先例 ∥ 库零版本标记（`memory.db` 有 `user_version` 先例可抄）∥ 只读句柄先例 = `ledger-migrate.mjs:30` ∥ ACP 注册 = 四工厂 spread（`acp.mjs:116-122`）+ `ext.mjs:18-73` 先例 ∥ 通知 = `transport.mjs:34` ∥ batch §-状态文件可机读（`batch-skeleton.mjs:34-39` / `:113-126`）∥ 桌面 `batch:status` = manifest phase（非批次档——外部意见措辞更正）。

**边界**：不做桌面（裁）∥ 零写面 ∥ 族定义单源 = `docs/core/design/LEDGER.md` §7（#882 成套）∥ 不动 `ledger migrate`/`audit` 现有语义。

**授权口径**：全自动通道（用户 23:14「都自动跑完」沿——代点火评审 ∥ 派发 ∥ 代签 ∥ 落地）；止点 = 新范围 / 口径裁决 / 破坏性。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（设计档 docs/cli/design/READ-DATA-INTERFACE.md · 设计评审 #41（轮次 1）九条收正 · doc-check 复跑 exit 0 · 待父侧复核）
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

**修复轮（设计评审 #41 收正 · 九条全采纳 · 2026-10-04 · eng-designer）**

父侧裁定 = 九条全采纳；逐条落点（设计档 = `docs/cli/design/READ-DATA-INTERFACE.md`——行号 = 修复后盘上读数）：

| # | 严重度 | 处置 | 设计档落点 |
|---|---|---|---|
| 1 | 🟡 | §4 表 ACP-CLIENT 行随动落点补两处：§3 枚举（`:76` ∥ `:84`——四 ⇒ 五 handler 模块，+ `acp/read-data.mjs`（拟新增））+ §3.5 模块表（+ 行）；Δ +7 ⇒ +9 · 预算 ~657 ⇒ ~659 | `:171` |
| 2 | 🟡 | §2.6 ∥ §3.4 写死通知观察域（服务进程 cwd——每轮 `ctx.getCwd()` 求值，与 `params.cwd` 缺省同取值；非观察项目变更不通知） | `:66-67` ∥ `:136` |
| 3 | 🟡 | §1 口径厘清补第二处（`docs/core/design/LEDGER.md:453` §9 边界——「不监听文件系统」= 非 `fs.watch` 监听）+ #882 让渡登记轮衔接语 | `:18-20` |
| 4 | 🔵 | 引用收正「§7.4 ⑤」⇒「§7.8 不变量 ⑤」（`docs/core/design/LEDGER.md:361`）——本档上抛项 4 原文按本块收正 | `:19` ∥ 本块 |
| 5 | 🔵 | §7 RDI-4 补一腿（文件在盘但非台账库——SQLite 可开、无 `items` 表 ⇒ `projects: []` ∧ 文件零改） | `:217` |
| 6 | 🔵 | §4 表 README 行改「现行 ≈154 · Δ 0（本轮已落）」——实读 = 154（内容行口径——与全表同口径；评审记 155 = 尾随空行并入口径） | `:169` |
| 7 | 🔵 | §3.3 `ledger/count` 行补语义（未决四态计数——单源 = 核 `ledgerCount`） | `:123` |
| 8 | 🔵 | §3.2 写死 `root` / `name` 派生（与库键同源解析项目根——`resolveProjectRoot(cwd) ?? resolve(cwd ?? ".")`；`name` = basename） | `:116` |
| 9 | 🔵 | §4 表增模块列（本批 = M2 ∥ M3；余 `—`）+ L7 复核行（去重计数 = 2 ≤ 2——不拆批） | `:154-172` ∥ `:174` |

- **L7 模块面（受影响文件归类——补批档本表模块标注）**：M2 = `ledger-db.mjs` ∥ `ledger-cmd.mjs` ∥ `ledger-read.mjs`（拟新增）∥ `ledger.mjs` ∥ `docs/core/design/LEDGER.md`；M3 = `batch-skeleton.mjs` ∥ `batch-read.mjs`（拟新增）∥ `batch-lifecycle.mjs`；余 `—`。复核 = 2 ≤ 2 ⇒ 不拆批（判定时点 = §2 表落表后复核；口径 = `docs/core/design/BATCH-RECORD.md` §5.1）。
- **验收**：仓根 `node scripts/doc-check.mjs` 修复轮复跑 = **exit 0**（锚 0 悬空 ∥ 行宽闸 OK）。
- 说明：本轮回填 = 文档面收正（零语义外扩）；设计档 §4 表 + 变更记录同笔落——本档仅追加本块（§1 ∥ §3–§6 零触）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

| # | 类别 | 严重度 | 发现 | 建议 |
|---|------|--------|------|------|
| 1 | 文档归属 | 🟡 | ACP-CLIENT.md 随动登记点不全：设计 §1（`docs/cli/design/READ-DATA-INTERFACE.md:15`）自述「ACP 通道（传输层 / **处理器划分** / 版本协商 / 通知通道）」归该档，但 §4 表（`:165`）只列「§2.1 / §2.2 行 + 变更记录」；新增第五模块 `acp/read-data.mjs` 后，`docs/cli/design/ACP-CLIENT.md:76` ∥ `:84`「handler 正文 = 四个模块」与 §3.5 模块表（`:135` 起）将与实装相抵。 | 随动行补 §3 枚举 / §3.5 模块表两处（四 ⇒ 五模块，+ `read-data.mjs` 行），或把 §4 表随动落点写明覆盖这两处。 |
| 2 | 清晰度 | 🟡 | 变更通知的观察域与 `params.cwd` 取值时点未写死（设计 `:63-67` ∥ `:125-131`）：观察范围 = 服务进程 cwd 快照 ∥ 每查 `ctx.getCwd()`；方法面可带任意 `cwd`（`:118-123`）而通知面覆盖范围零定义（单 cwd 模型下两面不对称——外部消费者不知会收到哪个项目的通知）。 | 写死观察 cwd 取值规则（建议 = 服务进程 cwd、随 `ctx.getCwd()` 每轮求值）并与 `params.cwd` 同取值；写明非观察项目的变更不通知。 |
| 3 | 文档状态 | 🟡 | LEDGER.md 口径披露不完整：设计 §1（`:18`）只厘清 §7.4/§7.8 ⑤ 一处；同档 §9 边界行（`docs/core/design/LEDGER.md:453`「不新增工具/命令/快捷键面；不监听文件系统」）同属本批触及的既有语句，未入披露；「不监听文件系统」与 5s stat 指纹轮询（D-7）的关系未明写。 | 口径披露段补 §9:453 一条（并注明轮询指纹 ≠ `fs.watch` 监听），与 #882 让渡后的登记轮同笔收口。 |
| 4 | 引用精度 | 🔵 | 「§7.4 ⑤」引用不精确：⑤ 不变量实住 `LEDGER.md:361`（`:358` 标题行名为「7.4 挂载 / … / 7.8 不变量」——该行属 §7.8）；设计 `:18` ∥ 批档 §2 上抛项 4 两处同引。 | 引用改「§7.8 不变量 ⑤」（或 §7.4–§7.8 区）。 |
| 5 | 验收覆盖 | 🔵 | §2.2 新增分支「items 表缺失探针 ⇒ 空账 null」（`:33`）无对应用例：RDI-4 四腿（a–d）只覆盖旧库 / 无库 / 版本读 / 版本写。 | RDI-4 补一腿：文件在盘但非台账库 ⇒ `projects: []` ∧ 文件零改。 |
| 6 | 行数标注（判据 8） | 🔵 | `docs/README.md` 状态口径不一：§4 表（`:163`）「152 ∥ +3 ∥ ~155」按待落呈现，而 §9（`:232`）∥ 批档 §2 均称本轮已落——盘上现读 **155** 行（收正痕迹 = `docs/README.md:16` ∥ `:96`），已落增量被再计一次。 | 该行改「现行 ≈155 · Δ 0（本轮已落）」或标「已落」状态。 |
| 7 | 清晰度 | 🔵 | 冻结载荷 `ledger/count` 语义未写明：`{ count }` 单源 = 核 `ledgerCount` = 「未决四态」计数（`thincoder-core/ledger-cmd.mjs:32-37`），非总行数——对外契约行（设计 `:119`）只给形状未给语义，外部消费者易误读。 | §3.3 该行补一句语义（未决四态计数——与 `ledgerCount` 同义）。 |
| 8 | 清晰度 | 🔵 | 单范围载荷 `root` / `name` 派生规则未写死（§3.2 `:99-100` 只给形）：子目录锚下可读作解析后项目根 ∥ 锚 cwd 字面——两种读法均可实现且结果不同。 | 写死派生（建议根 = 与库键同源解析后项目根；`name` = 其 basename）。 |
| 9 | 方法合规 | 🔵 | L7 取数面未落：本批受影响文件落台账（M2）∥ 批次档生命周期（M3）两模块族（`docs/core/design/ENGINEERING-MODE-V2.md:66` ∥ `:67`）——去重计数 = 2 ≤ 2 不触发拆批；但 §2/§4 表无模块列、无 L7 复核行（`docs/core/design/BATCH-RECORD.md` §5.1 L7 口径，`:291` ∥ `:296-297`）。 | 表加模块列（非 M 族行标 `—`）并落一行复核结论（计数 = 2 ≤ 2，不拆批）。 |

计数：🔴 0 ∥ 🟡 3 ∥ 🔵 6。
VERDICT: pass

## §4 用户批准（主 agent）

**父侧代签（用户 2026-10-04 00:31「都自动跑」——点火 / 代签 / 派发 / 收口全自动授权；自缚三条件齐备）**

- ① **设计评审 pass** ✓：评审 #41（pass）+ 收正轮 #44 九条全落（设计档 + 批档 §2 终态）；
- ② **修正落地核验** ✓：实施 #51 交付 —— 批内件 RDI-1–RDI-12 **12/12 先红后绿**（红基线逐腿实拍：RDI-4(a) 负向锁「读一次=写一次结构」现形）；**父侧复跑 EXIT 0** ✓；真 `thincoder acp` stdio 端到端过（initialize → ledger/count → batch/list → 真通道收 `ledger/changed` + `batch/changed`）；内部偏离审计 1 轮（四类偏差均无）+ 内部代码评审 2 轮均 pass（终态 clean）；`doc-check` exit 0；
- ③ **token 已签发** ✓（值不入档，纪律照守）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（11 代码面 ∥ 批内件 ∥ 随动两档全落 · 先红 12/12 → 后绿 12/12 · 内审 1 轮 + 代码评审 2 轮均 pass · 终态 clean）


### 实施摘要（承批档 §2 任务书 ∥ 设计档 §3 冻结契约 · 2026-10-04 · eng-coder）

11 个代码面 + 批内件 + 2 随动档全落形——零语义外扩 ∥ 零在飞写域触碰（`ledger.mjs` 零编辑 D-11 ∥ `DATA_COLUMNS` 零搬迁 D-10 ∥ `initialize` 零动 D-9 ∥ 通知 params 只 `{cwd}` D-12）。批内件运行 = 自 `thincoder/` 仓根 `node --test docs/batches/2026-10-03-read-data-interface.test.mjs`（≈45s；不入仓套件）。

### 逐文件改动表（file:line = 落笔后实读）

| 承接 | 文件 | 落点 |
|---|---|---|
| FR2③ ∥ N2 | `thincoder-core/ledger-db.mjs` | `:60` `LEDGER_SCHEMA_VERSION = 1`；`:111-124` `openReadOnly`（只读句柄 + sqlite_master items 探针缺 ⇒ null）；`:127-130` `markSchemaVersion`；`:139` `openLedger(cwd, { create, readOnly })`；`:152` 只读分支；`:158` 写面落标 |
| FR2③ | `thincoder-core/ledger-cmd.mjs` | `:22` / `:36` `ledgerQuery` / `ledgerCount` 两读点切 `{ readOnly: true }`（签名零变） |
| FR1 ∥ FR2 ∥ N1–N3 | `thincoder-core/ledger-read.mjs`（新 · 94 行） | `:28-36` `exportRow`（键集 = `DATA_COLUMNS` 单源；evidence 仅 full；缺列 null）；`:39-47` `readProject`（两开均只读：版本探针 + `ledgerQuery`）；`:50-63` `ledgerExport`（单范围 = 解析根一项 ∥ family = `discoverFamily` 发现序、不可读跳过）；`:65` LIST_USAGE；`:70-94` `runLedgerList`（严格解析 / 单段 JSON / 错误面单行） |
| FR3③ | `thincoder-core/agent-tools/batch-skeleton.mjs` | `:138-154` `readSectionStatusWord`（段头 / 状态行正则 / 词表全消费单源；终态词优先；§4/§6 字面「无状态词」） |
| FR3③ | `thincoder-core/agent-tools/batch-lifecycle.mjs` | `:63` `collectMarkdownFiles` 转导出（零行为变；注释 +1 行——现读 333 内容行） |
| FR3③ | `thincoder-core/agent-tools/batch-read.mjs`（新 · 37 行） | `:22-36` `listBatchRecords`（bases 缺省 = `batchDocBases`；`/` 归一 + 路径升序；单档读错跳过） |
| FR3 ∥ N1 | `thincoder-cli/src/acp/read-data.mjs`（新 · 127 行） | `:17` `WATCH_INTERVAL_MS`；`:52-87` 三方法（凭据门 + 参数类型校验 + INVALID_PARAMS 转述）；`:92-110` watcher（`inflight` 守卫 + 指纹差分 + `ctx.notifyRef` 到发）；`:113-124` start（unref）/ stop |
| FR3 | `thincoder-cli/src/acp.mjs` | `:36` 工厂 import；`:119` 建面；`:127` handlers spread；`:132` `watcher` 出参；`:148` `built.watcher.start()` |
| FR1 | `thincoder-cli/src/command-table.mjs` | `:164` `list` 分支（`:166` `runLedgerList(args.slice(1))`）；`:169` family usage 行 + list 形 |
| FR1 词面 | `thincoder-cli/src/completions.mjs` | `:27` bash 子命令词；`:30` bash list 旗标；`:63` / `:76` zsh 描述 + list 分支；`:99` / `:138` / `:140` fish 词 + list 旗标行 |
| FR1 词面 | `thincoder-cli/bin/thincoder.mjs` | `:139-140` USAGE 两行 |
| RDI-1–12 | `docs/batches/2026-10-03-read-data-interface.test.mjs`（新 · 429 行） | 12 例全表（RDI-1 `:95` … RDI-12 `:429`） |
| 随动登记 | `docs/cli/design/CLI-ENTRY.md` | `:16` §1 属主行（ledger 族拆分指针）；`:42` §2 `list` 行；`:78` 变更记录 |
| 随动登记 | `docs/cli/design/ACP-CLIENT.md` | `:47` §2.1 方法行；`:55` §2.2 通知行；`:78` / `:83` / `:87` 五模块枚举；`:140` 入口行收正（+ `watcher` 出参）；`:145` §3.5 模块表行；`:655` 变更记录 |

### 测试读数（先红后绿 · 零网络 ∥ 零真实 LLM）

- **先红（实施前 · 面未存在相位）**：RDI-1–RDI-12 = **12/12 红**。红因逐腿：RDI-1/2/3/5/6/10/11 = 命令面不存在（`ledger list` 走 family usage exit 1）；**RDI-4(a) = 现行核读即 DDL/ALTER**——旧库哈希 `ce23109403f6dc109c2391917fa09f195181abda` → `e24007cfd08736ff5b36fcfe4b0de451a8bb6e6f`（负向锁成立）；RDI-7/8/12 = ACP 方法面不存在；RDI-9 = watcher 出参不存在。
- **后绿（实施后复跑）**：**12/12 绿**——RDI-1 exit 0 · schemaVersion 1 · 单段 JSON · 与核逐 id 等；RDI-2 键集 12/13 + 剥 evidence 深等；RDI-3 `{"projects":[]}` + stderr 空；RDI-4 哈希等 + 版本 0→1 + 非台账库空集零改 + 零伴生档；RDI-5 family 与 `discoverFamily` 对拍逐项等；RDI-6 空族空集 + 混不可读跳过；RDI-7 CLI/ACP 载荷深等 + count 同源 + batches 形；RDI-8 files=full/plain/nested + 逐段词表；RDI-9 基线静默 + 两通知 + 静默轮零新增；RDI-10 两腿 exit 1 + usage；RDI-11 单行 + 零栈泄；RDI-12 三条 -32602。**修复轮后复跑仍 12/12 绿。**
- **端到端探针（真 stdio · 零网络）**：真 `thincoder acp`——initialize（`protocolVersion:1`，形状零动）→ `ledger/count` = `{count:2}`（过凭据门）→ `batch/list` 实读 → 数据变更后真通道收 `ledger/changed` + `batch/changed`（params 只 `{cwd}`）——`runAcpServer` → `watcher.start` 接线证据。探针件 `.thincoder/tmp/rdi-acp-smoke.mjs` 用毕即删。
- **CLI 冒烟**：`--help` 含 list 两行；bash/zsh/fish 补全含 list 词 + 旗标；bash 发射件 `bash -n` = OK。

### 修复轮（自查 3 处 + 评审修复 2 条）

| # | 触发 | 修复 | 证据 |
|---|---|---|---|
| 1 | 落形自查（RDI-8 红捕获） | `batch-read.mjs` 段号传参错形（`"§1"` 字符串 ⇒ 数形 1–6；`STATUS_WORDS` 键形错配致全段线「无状态词」） | RDI-8 红转绿 |
| 2 | 落形自查 | 批内件两处断言收正：逐列对拍只对发射键集（默认零 evidence 键）；`ledgerCount` 期望 = 未决四态 2（已核销不计） | RDI-1 红转绿 |
| 3 | doc-check 闸捕获 | `CLI-ENTRY.md:15` 349 字符越行宽闸 ⇒ 拆两行 | 行宽闸转 OK |
| 4 | 代码评审 🔵（错误面） | `ledger-read.mjs:91` 错误消息折叠单行（多行诊断 ⇒ 单行、内容零丢；单行消息零回归） | 实拍：不存在路径 stderr 1 行；歧义锚（双带档子目录）stderr 由多行转 1 行（候选清单保留） |
| 5 | 代码评审 🔵（观察器） | `read-data.mjs:92/95-96/109` `inflight` 守卫（先例 `ledger-surface.mjs` 同形；置位在首个 await 前、`finally` 复位） | RDI-9 复跑绿 |

### 内审与代码评审（轮次与终态）

- **偏离审计（read-only explore 子代理 · 1 轮）**：四类偏差（部分实现 / 静默简化 / 文档漂移 / 超文件表）**均无**；8 项验收判定全过（「先红后绿运行史 ∥ doc-check ∥ 仓套件」三项因审计工具面限制转呈）；无存活超范围改动。观察项 5 条（O1 批内件 429 行越顾问线 / O2 batch-lifecycle 行数微差 / O3 审计时点 §5 为空 / O4 tmp 件 / O5 CLI-ENTRY 超声明改动点已披露）——全部落本记录与交付报告。
- **代码评审（内部 advisor · 2 轮）**：round 1 全量 = **pass**（🔴0 · 🟡2〔均不阻塞：batch-lifecycle 存量越 300 顾问线 ∥ 批内件 429 行越设计自定「~300」预算——未越 500 硬限〕· 🔵7）；修复轮（上表 #4/#5 两条 🔵 建议落地）→ round 2 修复核验 = **pass**（19/19 引文核验通过；无新缺陷；两修复点及邻域逐行实读）。**终态 = clean**（两轮均 pass、无未决 🔴）。
- 评审其余 🔵（轮询成本属设计自定耦合之代价 / CLI-ENTRY 读数 as-of 快照 / 批档 §2 数值行他段写域 / FR3 批次级经 `sections["§1"]` 承载 / 档头计数口径）——不阻塞、逐条进交付报告；其中批档 §2 数值行属他段写域（本段不可改），CLI-ENTRY 读数随下轮刷新。

### 验收对照读数（本实施轮实跑）

- ① 批内件 RDI-1–RDI-12 先红后绿：**成立**（先红 12/12 · 后绿 12/12；修复轮后复跑仍绿）。
- ② 只读闸（旧库哈希等 ∧ 无库不建 ∧ 零 DDL）：**成立**（RDI-4 五腿 (a)–(e) 全绿）。
- ③ `node scripts/doc-check.mjs`：末次复跑 = **exit 0**（锚 0 悬空 ∥ 行宽闸 OK；首跑 FAIL 由本批 `CLI-ENTRY.md` 超宽行引起——已拆行修复；中途他批在飞档 `docs/desktop/design/PANEL-READBACK.md` 曾短暂产生非本批闸失败，已由其写域方修复、非本批文件）。
- ④ 行数：新档 ledger-read 94 ∥ batch-read 37 ∥ read-data 127 ≤300；批内件 429（<500 硬限；越设计「~300」预算——见决策表 1）；batch-lifecycle 333（存量、零行为变）；余档 ≤241；`ledger.mjs` 241 = 零编辑。
- ⑤ ACP-CLIENT 随动：§3 枚举四 ⇒ 五模块（`:78` / `:83` / `:87`）+ §3.5 模块表行（`:145`）**在档**。

### 边界遵守

在飞写域零触（design-token-echo 批 ∥ `ENG-TOKEN-BINDING.md` ∥ advisor-design 提示词与核内件 —— 本批零触；desktop 面零触）；`thincoder-core/ledger.mjs` 零编辑（D-11，只 import `discoverFamily`）；`DATA_COLUMNS` 零搬迁（D-10）；`initialize` 零动（D-9）；通知 params 只 `{cwd}`（D-12）。`docs/core/design/LEDGER.md` 登记（§2 面别 / §7.1 导出面）= 上抛协调项（#882 让渡后随动），本批未触。

### 决策透明表（实施中自主判定——父侧可裁）

| # | 判定 | 读法依据 |
|---|---|---|
| 1 | 批内件 429 行 > 设计自定「~300」预算——**不拆**（单件全表；拆分 = 对设计文件表的外扩） | 批档验收口径「超 500 = 拆」；评审 🟡/🔵 建议二择一——取「记录接受」路（本表即记录） |
| 2 | 单范围读「坏档（非 SQLite）」⇒ 转 exit 1（读错）；族范围不可读 ⇒ 跳过 | 设计 §2.4 只写族面「不可读跳过」；§3.1 明列「读错 ⇒ exit 1」；单范围按最近读法 |
| 3 | 观察域（`ctx.getCwd()`）变化 ⇒ 新域静默立基线 | 设计「首查立基线（静默）∥ 非观察项目不通知」的最近读法（域切换 = 新观察目标的首查） |
| 4 | `--cwd` 值以 `--` 打头 ⇒ 视同缺值拒（fail-closed 边界读法） | §2.7 严格解析（未知参拒）的边界延伸 |
| 5 | 三套补全除「list 词」外补登 list 四旗标 | CLI-ENTRY §3 横深对齐契约（三套须覆盖 §2 表内旗标词面）；设计 Δ 预算内 |
| 6 | 错误面折叠单行 / watcher `inflight` 守卫 = 评审 🔵 建议的「改码」路（非「记例外」路） | 评审 round 1 建议其一；折叠即 §3.1 契约句的落形 |
| 7 | 旧批内件 `2026-09-30-defect-fixes-cli.test.mjs` 的字面快照断言（bash ∥ fish「migrate audit」行）随词表演进失效——**未改该件**，归父侧 | 他批留存物；改动 = 重写历史 |

## §6 验证与收口（父代理）

**收口判词：已收口 2026-10-04**（设计（#25→#39 收正→#42 补笔→#44 九条）→ 评审 #41 pass → 实施 #51 → 父侧核验 → 本节核销 → 签入）

- **交付判据链**：RDI-1–12 **12/12 先红后绿**（父侧复跑 EXIT 0 ✓）∥ 只读闸五腿全绿（旧库哈希等 ∧ 无库不建 ∧ 零 DDL）∥ 真 stdio E2E 过 ∥ 内部审计/评审双 clean ∥ `doc-check` exit 0 ∥ 两档随动登记在档（CLI-ENTRY `:16/:42/:78` ∥ ACP-CLIENT `:47/:55/:78/:83/:87/:140/:145/:655`）。
- **父侧复核项**：`#886 ∥ #887` 需求面逐条对表（交付表 FR1–FR3 + N1–N3 + 验收①–⑤ 全 ✅）；`docs/core/design/LEDGER.md` 登记 = 上抛协调项（本批未触，与设计档 §9 注意 3 一致——归批 #885 系家族）。
- **残余（非阻断 · 在册）**：① 批内件 429 行越设计自定「~300」预算（<500 硬限——取「记录接受」路，§5 决策表在档）；② `batch-lifecycle.mjs` 333 行 = 存量越顾问线（本批 +1 注释，零行为变）；③ 旧批内件 `2026-09-30-defect-fixes-cli.test.mjs` 字面快照断言随词表演进失效——**已挂台账（认账不排期）**；④ 评审遗留 🔵 六项（观察器全读代价 ∥ CLI-ENTRY 读数 as-of ∥ 批档 §2 数值分叉〔§2=他段写域〕∥ FR3 承载形 ∥ acp.mjs:6 计数口径）——均为非阻断观察，随相关面下次触碰对表。
- **用户门**：无（只读接口随核/CLI 发布生效）。
- **结算**：台账 #886 ∥ #887 核销 ∥ 签入 + 本次收口 `docs/batches/2026-10-03-read-data-interface.md`。
