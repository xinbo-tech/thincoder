# 2026-09-22 · session-index
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-22 · 来源 = 用户 2026-09-22 09:25「可以，都按建议」（#205 会话索引库——a 立批 · 设计先行；承 09:21 台账消化与父侧推荐）。
> 台账 = #205（会话索引库 · 立批 · 设计先行）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**批件（用户 2026-09-22 09:25「可以，都按建议」——#205 · a 立批 · 设计先行）**

**条目**：会话存储评估结论的落地——**主存不迁库**（双线文件 = 真源）；**加派生索引库**：`node:sqlite` · 从 `.d/` record 段**增量建** · **可重建**（丢 / 坏 = 重生成，同 `memory.db` 模式）⇒ 一击解决 `read_history` 两大洞：**C 超大会话全拒**（>200k 行 / >50k 消息整档拒）+ **E 跨会话检索**（不知目录时不可答），并令 B（`tool_calls` 带参数）/ A（可回查锚）变廉价。

**边界**：主存语义**零改**（身份校验 / 隔离 quarantine / 崩溃半行恢复 / 200 条内存窗不动）；索引 = **派生面**（零权威 · 可重建）；不引入第三方依赖（`node:sqlite` 零依赖）；双端（CLI + VSC）。

**关联**：#204（B/C/E）——C/E 随本案消解、B 随触碰；本案证据与评估全文 = 台账 #205。

**链**：§2 设计（方案 + 索引 schema + 增量建 / 重建策略 + 查询面改造 + 用例面）→ §3 评审 → §4 批准 → 实施 → §6。

**用户授权（2026-09-22 09:29「都自动跑吧」）**：本批链上——① 设计评审点火权 ② §4 用户批准权（代签）③ 修正轮 / 实施轮派发 ④ 收口核销（提交 / 推送 / 台账迁移）——均**委托父侧自动执行**，至本批收口。**父侧自缚**：① 代签仅当「评审 pass（0 🔴）∧ 修正轮已落地并逐条核验 ∧ token 已签发」三条件齐备；② 每次代签在 §4 写明「父侧代签（用户 09:29 授权）+ 依据（评审 id / 核验结论 / 发现处置表）」；③ 需**新范围**或**用户口径裁决** ⇒ 停下（不因授权扩张射程）。

**设计轮核验 + 上抛裁定（父侧 · 2026-09-22 09:3x）**

- **核验**：七面 + 零依赖声明 + 机检零新增 ✓；关键取舍 7 项均有据（双路取源 = 实测 464 槽仅 **13 档含段** ⇒ 只认 sidecar 则 E 面只剩 13 会话覆盖）。
- **🔴 需求档相抵 = 已收正（主 agent 落笔）**：`docs/core/requirements/SESSION.md` §4.3 增 **F-R19c / F-R19d** + NF-R19 性能句收正（索引优先 · 主存回落）+ §4.4 边界句收正（「不改 JSON 读取路径」→「保留为回落面」）+ 变更记录 +1。
- **🟡 需求侧条目缺口 = 已补**（F-R19c / F-R19d 携判定句与边界）。
- **面外①（`.d` 孤儿 1,119 个 · gc 后缀表不含 `.d`）= 入册**（新台账条目 · 归批）。
- **面外②（`read-history.mjs:36-37` 死指针·引已退役 VSC 镜像档）= 并入本批实施面**（该档在本批受影响表内——随触去引）。
- **面外③（VSC 零 `_recordStore` ⇒ VSC 档恒无 sidecar；行扫护栏对现有槽空转）= 记录面**（§6 记；不动作）。
- **收口义务**：3 处 `（拟新增` 逐字标记 = **收口轮须撤**（列报面标记不入终态）；`DS-E47` 笔误设计席已自纠。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（台账 #205 · 设计档落点 = docs/core/design/SESSION.md §6.19 + §7 D-SE43–D-SE47；上抛 6 项已逐项处置（🔴 两项需求档相抵 = 主 agent 2026-09-22 已收正；🟡 F-R19c / F-R19d 已补；🔵 三项 = 入册 / 并入实施面 / 记录面）；评审轮 1 发现 2–15 修正已落（见本段修正块））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**本批条目（覆盖）**

| # | 条目 | 来源 | 本批判定 |
|---|---|---|---|
| 1 | 会话派生索引库：`node:sqlite` · 从记录段（sidecar）增量建 · 可重建 · 主存零改 | 台账 #205 · 批件 §1（用户 09:25「可以，都按建议」） | 覆盖（设计 → 实施） |
| 2 | **C 洞**：`read_history` 超大会话整档拒（> 200k 行 / > 50k 消息）→ 索引查询面消解 | 台账 #204 残项 C（#205 承接） | 覆盖 |
| 3 | **E 洞**：跨会话检索（不知目录时零检索面）→ 新增 `path:"all"` | 台账 #204 残项 E（#205 承接） | 覆盖 |
| 4 | **B**：`tool_calls` 带参数（现状只回名字） | 台账 #204 残项 B | 覆盖（schema `tool_calls` 表 + 输出形） |
| 5 | **A**：回执可回查锚 | 台账 #204 残项 A | **零新增语义**（发现面既有形 + `all` 行携 `file`；A 本体归 context-tool 批） |
| 6 | 判据线：主存零改 · 零第三方依赖 · 双端（索引住核） | 批件 §1 | 覆盖（机检条见验收对照） |

**不在本批**：#204 的 D（子代理自查面——归 context-tool 批）· `.d` 孤儿目录清运 · 索引自动清理 / 淘汰 · 向量 / 语义检索 · 裸 v1 `{hash}.json` 索引 · `/session` 列表与 TUI 翻页改走索引。

**设计档落点**（长期面——本批已落）

- 新增 `docs/core/design/SESSION.md` **§6.19**（问题形态实测 / 形态 / schema 四表 + FTS / 取源与水位三规则 / 重建面与自愈 / 查询面路由表 / 边界情形表 / 验收回指 / 不做）。
- 收正两处 + 一处指针：§6.13（参数扩展 `all` + 护栏射程 = 回落路径面）· §6.14（read_history 契约条：索引命中 ⇒ SQL 检索，未命中 ⇒ 回落 JSON + 既有护栏）· §5 补本批落点指针。
- §7 补 **D-SE43–D-SE47**（索引库形态 / schema 与取源双路 / 水位增量 / 重建与不迁移 / 查询面与语义分面）；§7 标题计数同步（D-SE1–D-SE47）。

**机制要点（摘要——判据句全文 = §6.19，D2 不复制）**

- 单库 `~/.thincoder/session-index.db`（`node:sqlite` · WAL + `busy_timeout` 3000ms · 测试缝 `_setSessionIndexDirForTest`）；**零权威**（只读主存、绝不写回 sessions 树、可重建）。
- 取源 **双路**（实测之据）：`<槽文件>.d/` 含段 ⇒ `src=sidecar`（增量）；否则 `src=json`（槽 JSON `history` 一次性）——本机 464 槽中仅 13 档含段（108.9MB = 语料主体），其余 451 档无 sidecar（VSC 端不绑记录存储 + §6.14 前老档）。
- 增量 = 水位四列 `(seg_n, seg_bytes, seg_mtime, tail_hash)` + 三规则（段号跳过 / 偏移追加（只落完整行）/ 重写检出；等长改写靠尾哈希）；幂等（无源变 ⇒ 零读零写）；单事务 `BEGIN IMMEDIATE`。
- 触发三点（均不触主存档）：查询前懒保证 · 启动窗外延迟拍（`scheduleSessionIndexPass`，3s 起，单趟 ≤ 2s 且 ≤ 40 会话）· 显式命令。
- 查询面 = **索引优先 + 主存回落**（回落面 = 既有路径 + 两道护栏逐字保留）；`keyword` 语义分面：单会话 = 子串（`LIKE`，契约不变）∥ `all` = FTS 词 / 短语（`buildFtsQuery` 单源）。
- 重建 = 打开即验 + 缺失建 / 失败改名 `session-index.db.corrupt-<ts>` 保留 + 新建（开箱自愈）；**不做迁移**（索引可丢弃）。
- `tool_calls` 输出形改 `[{name, arguments}]`（`arguments` 上限 300 字符 = 存储面同值）；工具描述与用例同步。

**受影响文件表（逐档读数 · 设计轮实测 as-of 2026-09-22；行数口径 = `split("\n")` 去尾空行）**

| 档 | 现状行数 | 预期增量 | 面 |
|---|---|---|---|
| `thincoder-core/session-index.mjs` | 新档 0 | ~300（DB 打开 / DDL / schema / 查询与 FTS 检索 / 测试缝） | 核 · 新 |
| `thincoder-core/session-index-build.mjs` | 新档 0 | ~300（会话枚举 / 水位增量 / 会话重建 / 自愈 / 延迟拍 / 清行） | 核 · 新 |
| `thincoder-core/session-index-cmd.mjs` | 新档 0 | ~90（`runSessionIndex`：`--rebuild` / `--status` + 摘要行） | 核 · 新 |
| `thincoder-core/fts-text.mjs` | 新档 0 | ~40（`segmentCJK` / `buildFtsQuery` / `FTS_TOKEN_MAX` 单源外提） | 核 · 新 |
| `thincoder-core/memory/schema.mjs` | 460 | −2（改 re-export；零行为变更） | 核 · 改 |
| `thincoder-core/memory/core.mjs` | 318 | −2（同上） | 核 · 改 |
| `thincoder-core/agent-tools/read-history.mjs` | 309 | +70…110（路由 / SQL / 描述文本） | 核 · 改（双端同源） |
| `thincoder-cli/bin/thincoder.mjs` | 448 | +15…25（`case "session"` 分发 `gc` / `index` + USAGE 行） | CLI 壳 · 改 |
| `thincoder-vscode/extension.mjs` | 190 | +8…12（命令注册 + 启动拍） | VSC 壳 · 改 |
| `thincoder-vscode/package.json` | 138 | +4（contributes.commands 一块） | VSC 壳 · 改 |
| `thincoder-vscode/src/extension/session-index-command.mjs` | 新档 0 | ~40（端壳命令——`session-gc-command.mjs` 同族） | VSC 壳 · 新 |
| `thincoder-core/test/session-index.test.mjs` | 新档 0 | ~300（建 / 增量 / 幂等 / 重建 / 自愈 / 并发 / 清行 / 零改快照） | 测试 · 新 |
| `thincoder-cli/test/read-history-guard.test.mjs` | 83 | +60…90（C 索引命中 / E `all` / 回落实例保留） | 测试 · 改 |

**跨档线拆分预案**：三新档设计预算 ≈300（advisory 线）——`session-index.mjs` 超线即按「DDL / 打开与自愈」∥「查询与 FTS 检索」二分；`session-index-build.mjs` 超线即按「枚举与水位增量」∥「重建 / 拍 / 清行」二分（硬限 500 前必拆）。

**关键决策（全文 + 否决备选 = §7 D-SE43–D-SE47）**

- **D-SE43**：加派生索引库、**不迁主存**（否决：主存迁库 / 每 cwd 一库 / 库住 sessions 树）。
- **D-SE44**：schema 四表 + FTS；**取源双路**（否决：只认 sidecar——覆盖只剩 13 档）；`tool_calls` 独立表；FTS 语言单源外提 `fts-text.mjs`。
- **D-SE45**：水位四列 + 三规则 + 幂等单事务；触发三点；**拍挂端壳**（否决：`pushReal` 挂钩（触主存档）/ 每次查询全量重建）。
- **D-SE46**：打开即验 + 改名保留自愈 + `--rebuild` / `--status` 双端命令；**不做迁移**（否决：静默删坏库 / 保留迁移路径）。
- **D-SE47**：索引优先 + 主存回落；`path:"all"`；`keyword` 语义分面；`tool_calls` 带参数（否决：`all` 面用子串扫描 / 全库统一改 FTS 语义（= 既有契约变更））。

**用例表（建 / 增量 / 重建 / 大会话 / 跨会话 / 并发；输入 → 期望输出 · 逐条机检）**

| # | 场景 | 输入 | 期望（断言） |
|---|---|---|---|
| T-1 | 建库 | 夹具：sidecar 会话（3 段 / 250 条）+ JSON-only 会话（40 条）+ 含 `tool_calls` 的 assistant 行 | `sessions` 2 行；`messages` 290 行；逐条 `(idx, ts, role, content)` 与源相等；`tool_calls` 行数 = 声明数、`args` 逐字 |
| T-2 | 增量追加 | 向末段追加 1 条（`appendFileSync`）→ 再 sync | `messages` 291 行；新行 `idx = 旧 total`；其余行 `rowid` 不变；段读计数增量 = 1 |
| T-3 | 幂等 | 无源变连跑两次 | 行数 / 水位 / `pass_at` 不变；读字节增量 = 0 |
| T-4 | 段轮转 | 追至跨 100 条边界 | 行数 = 源条数；`seg` 列跨段取值正确 |
| T-5 | 段重写（materialize 面） | 删 `.d` 目录 → 依槽 JSON 重建同内容段 | 行数不增（`UNIQUE(sid, idx)` 零冲突）；水位回落再前进 |
| T-6 | 等长改写 | 改写末段（同字节数 / 异内容） | `tail_hash` 命中 ⇒ 末段重建；新文本 keyword 命中、旧文本不命中 |
| T-7 | 源消失清行 | 删槽文件 + `.d` → prune | 该 `sid` 行 0（级联） |
| T-8 | **大会话查询（C）** | 夹具 > 50,000 消息的 JSON 单行槽 → 建索引 | `read_history({path: 该文件, keyword})` 返回 JSON 数组（**非** `TOO_LARGE`） |
| T-9 | 大会话未索引（回落不回归） | 同夹具，库内无该行 | 返回逐字 `{"error":"session too large — refine keyword or since/until"}` |
| T-10 | **跨会话检索（E）** | 两 cwd 夹具各含关键词 | `{path:"all", keyword}` 两 cwd 均命中；每行 `session.file` 在场且可回查；`limit` / `direction` 生效 |
| T-11 | 过滤矩阵等价 | 同一夹具 + 同一过滤器（role / tool / since / until） | 索引路径与 JSON 回落路径结果逐条相等 |
| T-12 | **删库自愈** | 删 `session-index.db`（含 `-wal` / `-shm`） | 下次查询 / ensure 自动重建：新库出现 + 行数 = 源条数 + 查询成功 |
| T-13 | 坏库自愈 | 库文件写入垃圾字节 | `.corrupt-<ts>` 现场保留 + 新库重建；查询成功（无错误抛出） |
| T-14 | 命令面 | `runSessionIndex(["index","--status"])` / `["index","--rebuild"]` | 退出码 0；摘要行逐字锚；`--rebuild` 后行数 = 全量 |
| T-15 | 并发 | 两 `openSessionIndex` 句柄同库交错 sync | 无异常；行数正确（无重复 / 无丢失） |
| T-16 | 主存零改 | 建索引前后 sessions 树快照 | 每文件「路径 / 字节 / mtime」三元组不变 |
| T-17 | 零依赖 | 三端 `package.json` + 新档 import 面 | `dependencies` 无新增；新档仅 `node:` / 仓内相对路径 |
| T-18 | FTS 语义（`all`） | CJK 双字词 / ASCII 词 / 纯标点 keyword | CJK 短语命中（逐字间隔）；纯标点 ⇒ 退化 `LIKE` 命中 |

**验收对照（AC 逐条机检 · 回指条目）**

| AC | 判据（机检） | 回指 | 用例 |
|---|---|---|---|
| AC-1 | 建库后 `sessions` / `messages` / `tool_calls` 行数与内容对拍相等；schema 四表 + `index_meta` 在位 | 条目 1 | T-1 |
| AC-2 | `tool_calls` 行含 `args`（逐字）且输出形 `[{name, arguments}]`（`arguments` ≤300 字符） | 条目 4 | T-1 / T-11 |
| AC-3 | 增量恰增 1 行（其余 `rowid` 不变）；连跑两次零读零写 | 条目 1 | T-2 / T-3 / T-4 / T-5 / T-6 |
| AC-4 | **删索引后可自愈重建**（删库 / 坏库 ⇒ 行数复原、查询可用）；`--rebuild` / `--status` 读数正确；删源级联清 | 条目 1 | T-12 / T-13 / T-14 / T-7 |
| AC-5 | 超大会话（> 50,000 消息）经索引可答；未索引同档仍逐字 `TOO_LARGE` | 条目 2 | T-8 / T-9 |
| AC-6 | `path:"all"` 跨 cwd 命中且行携 `session.file`（回查锚） | 条目 3 / 5 | T-10 / T-18 |
| AC-7 | **主存零改**：`session-store.mjs` / `session.mjs` 零 diff + sessions 树三元组快照不变；**零新依赖**（三端 `dependencies` 零新增）；双端命令注册机检（CLI `case "session"` / VSC contributes + 处理体） | 条目 1 / 6 | T-16 / T-17 |
| AC-8 | 双句柄并发 sync：零异常 + 行数正确 | 条目 1 | T-15 |
| AC-9 | 三端测试全绿（核 / CLI / VSC） | 条目 6 | 全表 |

**边界（本批不做）**：不迁主存（双线文件 = 真源，§6.14 语义零动）· 不做向量 / 语义检索（不引 embedding）· 不改 `read_history` 默认路径与 `cwd:` 发现面 · 不改两道护栏与错误文案（回落面逐字保留）· 不复刻其他消费面（`/session` 列表 / TUI 翻页 / `listSlots` 仍走主存）· 不索引裸 v1 `{hash}.json`（本机 0 档）· 不做 `.d` 孤儿目录清运 · 不做索引自动清理 / 淘汰 · 不做库的跨端同步协议（索引 = 本机派生品）· 不实施（本批 = 设计轮）。

**上抛项（一律报出——不自行处置）**

| # | 类 | 事实（`file:line`） | 建议处置 |
|---|---|---|---|
| 1 | 🔴 需求档相抵（语义面 · 主 agent 笔域） | `docs/core/requirements/SESSION.md:145` §4.4「范围边界（不做）」含「不改 `read_history` 跨会话 `path=` 的 JSON 读取路径与护栏」——本批恰以索引优先改该路径（护栏降为回落面）；同行未标批界，读作持久条 | 需求档收正为「护栏 = 回落路径面（射程收窄）」+ 本批条目入档 |
| 2 | 🔴 需求档相抵（同上） | `docs/core/requirements/SESSION.md:122` NF-R19「性能 = v1 逐文件流式读（**无索引**）」 | 同上收正（现态 = 索引优先 + 回落） |
| 3 | 🟡 需求侧条目缺口 | 需求档 §4.3 仅 F-R19a/b 两句（无 C/E 逐条功能点与判定句）；本批 AC-5 / AC-6 现无需求侧回指行 | 请主 agent 在 `docs/core/requirements/SESSION.md` 补条目（五要素：C 超大会话可答 / E 跨会话检索 / 索引零权威可重建 / 零依赖 / 主存零改） |
| 4 | 🔵 面外（存储泄漏 · 另案） | 实测：`.d` 孤儿目录 **1,119 个**（槽文件已消失）——`session gc` 残留后缀表（`thincoder-core/session-gc.mjs:51-59`）不含 `.d` ⇒ 永不清运 | 另册（`session gc` 后缀表扩展轮）——不在本批 |
| 5 | 🔵 面外（产品码注释死指针） | `thincoder-core/agent-tools/read-history.mjs:36-37` 头注引「`thincoder-vscode/src/agent-tools/read-history.mjs` 双端同构镜像」——该档实不存在（VSC 现经 `thincoder-vscode/src/agent-tools/index.mjs:8` 转口核登记册） | 随 `read-history.mjs` 本次触碰一并去引（本批「零语义」注释面收正，或另册） |
| 6 | 🔵 实况登记（设计之据） | VSC 面零 `_recordStore` 绑定（全仓 `thincoder-vscode/**` 对该符号零命中）⇒ VSC 档恒无 sidecar；且行扫护栏（200k 行）对本机全部槽**空转**（槽 JSON 单行——物理行数 0）⇒ 生效护栏仅消息数一道 | 仅登记（前者 = 本批双路取源之据；后者 = 护栏口径是否收正 ⇒ 另案） |

**修正块（设计评审轮 1 · 2026-09-22 · eng-designer——承本档 §3 轮次 1；发现 2–15 逐条落位；以本块为准）**

| # | 处置 | 落位（写后读回 · file:line） |
|---|---|---|
| 2 | 收正 | 设计档 §7 `D-SE25`（`docs/core/design/SESSION.md:658`）——跨会话面标「2026-09-22 由 D-SE47 / §6.19 接管」；否决理由射程对齐 = 索引对 sidecar **只读**（零写回 / 记录存储解释权单点不动） |
| 3 | 收正 | 设计档 §6.19 触发点①（`:578-579`）——懒保证射程 = **有段档（`src=sidecar`）**；`src=json` 档免 ensure；成本上界 = 每次查询 ≤1 段读 + 一次水位写（单事务） |
| 4 | 收正 | `pass_at` 语义钉定 = **最近一次实际写入（变更）时刻**（无源变零写、不推进）——设计档 `index_meta` 行（`:558`）+ `--status` 文案（`:586`）；T-3 断言（`pass_at` 不变）按此语义成立、原样保留（三处一致） |
| 5 | 补行 | 受影响表补两位测试承载档（下节表）——T-14 / T-17 / AC-7 各有 CLI / VSC 落点 |
| 6 | 收正 | 设计档 §6.13 缺省句（`:234`）射程限定（参数面零行为变化 + 输出形例外）；§6.9 返回行（`:189`）写入 `tool_calls` 形 |
| 7 | 收正 | 设计档 §6.19 边界情形表补 `all` 覆盖行（`:622`）+ 路由表 `all` 行（`:599`）同步（覆盖信号 = 工具描述句 + `--status`） |
| 8 | 收正 | 设计档 §6.19 头部（`:530`）+ 验收回指（`:624-626`）补 F-R19c / F-R19d；AC 回指列补（本块末） |
| 9 | 收正 | 设计档 §6.19 边界表等长改写行（`:615`）补检测窗残余（漏检条件 + 自愈路径） |
| 10 | 收正 | 设计档 §6.19 边界表退化路径行（`:620`）——元字符字面转义 / 全匹配边界 / 成本口径；T-18 期望收正（本块末） |
| 11 | 收正 | 设计档 §6.19 补 FTS 同删义务条（`:563-564`）——四条删除路径逐条列明 + 删除单点函数收口 + 不取外内容表 / 触发器取舍 |
| 12 | 收正 | 设计档 §6.19 `messages` 表（`:555`）删冗余 `INDEX(sid, idx)`（`UNIQUE(sid, idx)` 兼作查询主索引） |
| 13 | 补行 | 受影响表补 >300 档拆分审视行（下节表）——`read-history.mjs` / `thincoder-cli/bin/thincoder.mjs` |
| 14 | 登记 | 设计档 §6.19 补 FTS5 可行性实证（`:562`）——`thincoder-core/memory/schema.mjs:3` / `:130` 等 + `thincoder-core/memory/core.mjs:95` |
| 15 | 标注 | 本段状态行已更新（上抛 6 项 = 逐项处置态；🔴 两项 = 主 agent 2026-09-22 已收正）；追加行不复指已消解项 |

**受影响表补行（#5 / #13——行数口径同原表 `split("\n")` 去尾空行）**

| 档 | 现状行数 | 预期增量 | 面 |
|---|---|---|---|
| `thincoder-cli/test/session-index-cli.test.mjs` | 新档 0 | ~90（T-14 命令面：`--status` / `--rebuild` 摘要行 + 退出码；AC-7 CLI 侧 + T-17 CLI 侧依赖面） | 测试 · 新 |
| `thincoder-vscode/test/session-index-command.test.mjs` | 新档 0 | ~60（AC-7 VSC 侧：contributes.commands 块 + 处理体接线 + 端壳档转口机检；T-17 VSC 侧依赖面） | 测试 · 新 |
| `thincoder-core/test/session-index.test.mjs`（补注） | 新档 0 | ~300（T-17 主承载：三端 `package.json` 依赖面零新增 + 三新档 import 面机检） | 测试 · 新 |
| `thincoder-core/agent-tools/read-history.mjs`（拆分审视 · #13） | 309 | +70…110 ⇒ 379…419：**不另立档**（增量内聚单档；触发点 = 实施读数 ≥ 470 ⇒ SQL / FTS 检索面外提 agent-tools 面新档） | 核 · 改 |
| `thincoder-cli/bin/thincoder.mjs`（拆分审视 · #13） | 448 | +15…25 ⇒ 463…473：**不拆**（增量 = `case "session"` 分流 + USAGE 两处；命令实现在核 `session-index-cmd.mjs`）；触发点 = 实施读数 ≥ 480 ⇒ 命令分发表外提（另案） | CLI 壳 · 改 |

**T-18 期望收正（#10）**：CJK 短语命中（逐字间隔）；纯标点 / 全空白 ⇒ 退化 `LIKE`（元字符按字面转义——`%` 命中含 `%` 的消息，非全匹配；全空白 = 近全匹配、`LIMIT` 截断）。

**AC 回指补（#8）**：AC-5 → +**F-R19c**；AC-6 → +**F-R19a / F-R19d**；AC-4 → +**F-R19d**（零权威可重建）；AC-7 → +**F-R19d**（主存零改）。

**#3 追加钉定**：懒保证不含 `src=json` ⇒ T-8 / T-10 夹具的「建索引」前置 = ② 延迟拍 / ③ `--rebuild` 面（非查询期 ensure）；T-9 = 未索引档回落护栏语义（不变）。

**机检读数（本席写后实测）**：`cd thincoder && node scripts/doc-check.mjs --root .` ⇒ 悬空 **17**（改动前实测基线同值 17）· 行宽 **16**（改动前实测 17）——本批 authored 行**零新增**；**另注**：派单所述基线「悬空 16 / 行宽 12」与实测不符（差异项全在本批写域外他档存量，逐条见交付报告）。
**行号口径（父侧直接执行 · 机械口径注 · 可 revert · 2026-09-22）**：本修正块落位列的 `file:line` = 写回时点快照（本块续写后已位移）——§6.19 / §7 目标现为 **+6**（D-SE25 `:658`→`:664` · 触发点① `:578-579`→`:584-585` · `index_meta` `:558`→`:564` · `--status` `:586`→`:592` · 路由 `all` `:599`→`:605` · 边界 `:622`→`:628` · 回指 `:624-626`→`:630-632` · `:615`→`:621` · `:620`→`:626` · `:563-564`→`:569-570` · `:555`→`:561` · `:562`→`:568`），§6.9 / §6.13 目标为 **+1**（`:189`→`:190` · `:234`→`:235`）；以现读为准（评审轮 2 🔵#2 处置）。

**收口轮补行（父侧裁定 · 2026-09-22 · 承本档 §5 未决上抛 1／2／3／4）**

**受影响表补行（行数口径 = `split("\n")` 去尾空行 · 实施实测）**

| 档 | 现状行数 | 预期增量 | 面 |
|---|---|---|---|
| `thincoder-core/session-index-query.mjs` | **102** | 实施已落地（新档终态） | 核 · 新 · **拆分产物 · 预案授权**（`session-index.mjs` 二分——查询与 FTS 检索面） |
| `thincoder-core/session-index-pass.mjs` | **95** | 实施已落地（新档终态） | 核 · 新 · **拆分产物 · 预案授权**（`session-index-build.mjs` 二分——有界趟 / 全量重建 / 清行 / 延迟拍） |

**设计档收口落位（逐条 · 写后读回 · `docs/core/design/SESSION.md` · 行号 as-of 本行时点）**

| # | 项 | 落位 |
|---|---|---|
| 1 | §6.19 形态行补拆分产物两档行（102 / 95）+ 双端单源档列补全 | `:553`–`:555` |
| 2 | FTS5 实证指针按现读重指（`fts-text.mjs` 单源 + 两档 re-export 面） | `:570`–`:571` |
| 3 | 撤 3 处「（拟新增」标记（终态即现态） | `:553` / `:556` / `:596` |
| 4 | 边界表登记两处 delta（非 ASCII 折大小写 · 拍尾清行段不受 40 界） | `:630` / `:633` |
| 5 | `all` 首建路径按触发点①读法收正（句内相抵收正——不留并存陈述） | `:632` |
| 6 | 源档损坏 ⇒ 查询期不清行（清行 = 重建 / 趟面职责；查询路径零写纪律） | `:799`（变更记录 +1 行） |

**机检读数（本席写后实测）**：`node scripts/doc-check.mjs --root .` ⇒ 悬空 **4** / 行宽 **3**（与开工前实跑同值——本批 authored 行零新增；行宽 3 行 = `docs/core/design/BATCH-RECORD.md:358` / `:365` + `docs/vsc/design/VSC-DEBT.md:267`，均在写域外）；`grep -c "（拟新增" docs/core/design/SESSION.md` = **0**。

**另注（未在本轮 6 项授权内 ⇒ 未动作 · 报父侧）**：本档 §5 决策表 #3 建议设计席把退化 `LIKE` 触发条件写成「keyword 无字母 / 数字」（实现判据 = `FTS_USABLE`，`thincoder-core/session-index-query.mjs:25` / `:85`）；设计档 `docs/core/design/SESSION.md:629` 现表述为「`buildFtsQuery` 返回空串 ⇒ 退化」——纯标点 keyword（如 `%`）上两表述分叉（`buildFtsQuery('%')` 返回非空串而 FTS 零命中）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements | 🔴 | 需求档 §4.4 F-S4 第二句（`docs/core/requirements/SESSION.md:133`）仍写「跨会话 `path=` **保持读槽文件 JSON**（投影全量——兼容不变）」，与本批设计相抵：§6.14 收正句为「索引命中 ⇒ SQL 检索」（`docs/core/design/SESSION.md:258`）、§6.19 路由表同判（`docs/core/design/SESSION.md:589`）。本批已对同族两处收正（NF-R19 `docs/core/requirements/SESSION.md:124`、§4.4 边界句 `:147`），F-S4 漏收正 ⇒ 同一机制（跨会话读取路径）两处写法相反；设计档 §6.19 头部（`docs/core/design/SESSION.md:527`）还把 F-S4 列为本批需求依据。 | 按 NF-R19 / §4.4 边界句同口径收正 F-S4 第二句（索引优先 + 主存回落射程），并在需求档变更记录同批登记。 |
| 2 | Document ownership | 🔴 | 设计档 §7 D-SE25（`docs/core/design/SESSION.md:648`）仍以活跃决策形态写「本会话检索走存储、跨会话保持 JSON」，其否决理由含「避免『外部 slot 的 sidecar 解释权』扩展面」；本批 D-SE47（`docs/core/design/SESSION.md:670`）与 §6.19 取源双路（`:562` · D-SE44 `:667`）恰改该路径且要读各槽 sidecar，档内无收正 / 被取代标记，批档落点清单（`docs/batches/2026-09-22-session-index.md:52`）亦未列此项 ⇒ 同一机制两处相反裁定，且被新设计触动的否决理由原样留在册。 | 在 D-SE25 上补收正 / 被取代标记，并使其否决理由与 §6.19 取源双路的射程对齐（外部 sidecar 读取面的边界与理由）。 |
| 3 | Clarity | 🟡 | 触发点①「懒保证」写「查询前对目标会话（`path=<文件>`）/ 当前会话（`all`）`ensure`（单会话 ≤1 段读）」（`docs/core/design/SESSION.md:572`），但多数会话为 `src=json`（464 槽中 451 档无 sidecar——`docs/batches/2026-09-22-session-index.md:57`），其 ensure 必然是一次整档 JSON 读、超出「≤1 段读」成本口径；若查询时确会对未索引档 ensure，则 T-9（`docs/batches/2026-09-22-session-index.md:104`）「库内无该行 ⇒ 逐字 `TOO_LARGE`」不可达（查询会先把它索引掉）。 | 明确懒保证的取源覆盖面与成本上界（是否含 `src=json`；超限档是否免 ensure），使触发点① 与 T-8 / T-9 相容。 |
| 4 | Acceptance | 🟡 | T-3（`docs/batches/2026-09-22-session-index.md:98`）断言「无源变连跑两次 ⇒ `pass_at` 不变」，而 `index_meta.pass_at`（`docs/core/design/SESSION.md:555`）与 `--status` 的「上次 pass 时刻」（`:578`）读作「最近一次 pass 时刻」⇒ 语义冲突：更新则 T-3 失败，不更新则 `--status` 读数陈旧。 | 钉定 `pass_at` 语义（最近变更 vs 最近执行）并在 schema 注释 / `--status` 文案 / T-3 断言三处一致。 |
| 5 | Acceptance | 🟡 | 用例表 T-14 命令面（`docs/batches/2026-09-22-session-index.md:109`）/ T-17 零依赖（`:112`）与 AC-7 的「双端命令注册机检」（`:125`）在受影响文件表（`:66-80`）无承载档：表内测试行仅核 `session-index.test.mjs` 与 CLI `read-history-guard.test.mjs`，VSC 侧（`extension.mjs` 命令注册 + `session-index-command.mjs`）零测试档 ⇒ 该三条判据无可落点的机检载体。 | 在受影响表补列承载 T-14 / T-17 / AC-7 命令注册机检的测试档（CLI 与 VSC 各一位，或并入既有 VSC 命令测试档），并标注现状行数 / 增量。 |
| 6 | Clarity / Document ownership | 🟡 | §6.13 收正句称「**本会话缺省 = 零行为变化**」（`docs/core/design/SESSION.md:234`），但本批把 `tool_calls` 输出形改为 `[{name, arguments}]`（`:594` · AC-2 `docs/batches/2026-09-22-session-index.md:120`）；该形由共用行构造产出 ⇒ 缺省面（不传 `path`）同样受影响。且 §6.9 返回行（`docs/core/design/SESSION.md:189`）仍只写「`tool_calls` 概要」，未随输出形变更收正。 | 限定「零行为变化」射程（仅参数面路由），并把输出形变更写入 §6.9 返回行（或明确其为共用面并同步工具描述 / 用例）。 |
| 7 | Acceptance | 🟡 | E 面（`all`）语义 = 「全部**已索引**会话」（`docs/core/design/SESSION.md:591`），覆盖靠启动拍（≤40 会话 / 趟，`:572`）与显式 `--rebuild`（`:578`）爬升；边界情形表（`:601-613`）无「未索引会话 ⇒ `all` 面零命中」行，查询输出也不带覆盖信号 ⇒「未索引」被读成「不存在」（假阴性），与需求 §4.3 F-R19d「任意历史会话可被找回」（`docs/core/requirements/SESSION.md:123`）留有落差。 | 在边界情形表登记覆盖语义（`all` 面 = 已索引面 + 首建路径），并给出模型侧可辨的覆盖信号落点（工具描述 / 输出头 / `--status` 指引）。 |
| 8 | Clarity | 🟡 | 需求侧新增条目 F-R19c / F-R19d（`docs/core/requirements/SESSION.md:122-123`）无设计档指针，设计档两处回指仍只列旧句：§6.19 头部「需求 = §4.3 F-R19a · §4.4 F-S4」（`docs/core/design/SESSION.md:527`）与验收回指行（`:615`）⇒ C / E 两面的需求↔设计回指链缺环（F-R19c / F-R19d 在设计档与批档中零引用）。 | 在 §6.19 头部 / 验收回指行与批档 AC 回指列补 F-R19c / F-R19d（并可按 F-CR / F-XR 同式给需求条目加设计档指针）。 |
| 9 | Clarity | 🔵 | 等长改写检出仅靠末段尾 4KB 的 `tail_hash`（`docs/core/design/SESSION.md:563`），而边界表行（`:607`）与 D-SE45（`:668`）表述为「等长改写即检出」：同尺寸 + 尾 4KB 相同、仅前段被改写的重写会漏检（旧行残留至全量重建）。 | 在边界情形表登记该检测窗残余（漏检条件 + 自愈路径 = 下趟重置 / `--rebuild`）。 |
| 10 | Clarity | 🔵 | 纯标点 / 无 FTS 词元 keyword 退化为 `LIKE '%原文%'`（`docs/core/design/SESSION.md:612`），未说明 `%` / `_` 通配元字符处理 ⇒ 形如 `%` 的 keyword 退化为全匹配，且该路径正是 FTS 分面要避开的全库扫描成本面。 | 登记退化路径的元字符转义 / 全匹配边界与成本口径（边界情形表 + T-18 期望）。 |
| 11 | Clarity | 🔵 | `messages_fts` 取「无触发器」自持（`docs/core/design/SESSION.md:554`），但各删除面（区间删行 / 会话级重建 `:568` / 级联清 `:569` / `--rebuild`）的 FTS 同删义务未逐条列明；漏删 ⇒ 残留 FTS 行产出指向不存在消息的命中（T-6 `docs/batches/2026-09-22-session-index.md:101` 仅覆盖末段改写一路）。 | 在写面判据句列明各删除路径的 FTS 同步删除义务（或说明改用外内容表 / 触发器的取舍）。 |
| 12 | Scope | 🔵 | `messages` 表同时声明 `UNIQUE(sid, idx)` 与 `INDEX(sid, idx)`（`docs/core/design/SESSION.md:552`）——同列序重复索引，无额外查询收益。 | 保留 `UNIQUE(sid, idx)` 或说明重复索引的用途。 |
| 13 | Scope | 🔵 | 跨档线拆分预案（`docs/batches/2026-09-22-session-index.md:82`）只覆盖三个新档；`read-history.mjs`（309 → 379…419，`:74`）与 `thincoder-cli/bin/thincoder.mjs`（448 → 463…473，`:75`）已在 300 行 advisory 线以上继续增长，档内无这两档的拆分审视结论（按设计自报数字仍在 500 行硬限内；本轮未与磁盘对拍行数）。 | 在受影响表补 >300 档的拆分审视结论（含 `read-history.mjs` 路由 / SQL 面是否另立档）。 |
| 14 | Feasibility | 🔵 | FTS5 是本设计 FTS 面（`docs/core/design/SESSION.md:554`）的前提，档内无实证（间接证据仅 `FTS_TOKEN_MAX` / `buildFtsQuery` 自 memory 面外提，`:545`）；`node:sqlite` 内置 SQLite 是否编入 FTS5 无法在本次评审范围内核验（`unverified`）。 | 在批档 / 设计登记一句可行性实证（memory.db 已在用 FTS5 或其等价面），避免实施轮装配期才发现不可用。 |
| 15 | Methodology | 🔵 | §2 状态行（`docs/batches/2026-09-22-session-index.md:32`）仍写「上抛 6 项（其中 🔴 两项 = 需求档 SESSION.md:122/:145 与本批意图相抵）」，而同档 §1 追加记录（`:24`）已载两项「已收正」⇒ 记录面残留待办式表述，后续读者易把已消解项读成在办 🔴。 | 在 §2 状态行 / 追加行标注两项上抛的处置状态（已收正），使记录面不再指向已消解项。 |

**评审范围与限界**（同报告）：① 本评审按声明只读三份文档——受影响文件表的行数、设计档引用的源码 `file:line`（`read-history.mjs:50/:54/:175/:192`、`session-gc.mjs:51-59`、`read-history.mjs:36-37` 等）未与磁盘对拍，一律按档内自报证据接受（`unverified`）；criterion 8 的行数「对拍」降级为档内自洽 + 档间一致检查。② 文档地图与项目标准文档未声明 ⇒ criterion 7（document ownership）按档内自带指针链（设计档 §5 落点表 / §6.x 逐批节 + 需求档 §2.x / §4.x + 批档 §1–§6）与 AGENTS.md 判定。③ 未发现 revision-style 残留（无删除线 / 「原为…改为…」式表述）；「拟新增」标记 3 处已由批档 §1 登记为收口轮撤退义务。

VERDICT: changes-required
计数：🔴 2 · 🟡 6 · 🔵 7（共 15）

### 轮次 2（评审子代理）

**轮 2 核验摘要（核验修正轮 1 · 2026-09-22）**：轮次 1 全部 **15 项**（2 🔴 / 6 🟡 / 7 🔵）逐项按现态复核 = **全数落位**（证据 = 本轮 fresh read 逐条引行，见下表）；新发现 **2 项（均 🔵——非阻断）**。零 🔴 / 零 🟡 残留。

**核验表（轮次 1 · 15 项 → 现态证据）**

| Orig# | 项 | 状态 | 本轮证据（fresh read 引行） |
|---|---|---|---|
| 1 | 🔴 F-S4 跨会话读径相抵 | Fixed | `docs/core/requirements/SESSION.md:135`: "- **F-S4（read_history 走盘）**：本会话检索（无 `path`）读记录存储；跨会话 `path=` **索引优先 + 主存回落**（索引命中 ⇒ 索引检索；索引不可用 / 库内无行 ⇒ 既有槽文件 JSON 读径与护栏——逐字保留、零回归）。"（+ 变更记录 `:177`） |
| 2 | 🔴 D-SE25 无取代标记 | Fixed | `docs/core/design/SESSION.md:664`: "| D-SE25 | 本会话检索走存储；跨会话面 = **索引优先 + 主存回落**（2026-09-22 由 D-SE47 / §6.19 接管该面） | 边界对齐（§6.19）：索引对 sidecar **只读**…⇒「外部 slot 的 sidecar 解释权」零扩张；原「`path=` 换轨收益低」判断已由 C / E 两洞消解（D-SE43） |" |
| 3 | 🟡 懒保证射程 / 成本 | Fixed | `…design/SESSION.md:584`: "① **懒保证**——查询前对目标会话（`path=<文件>`）/ 当前会话（`all`）`ensure`；**射程 = 有段档（`src=sidecar`）**…"；`:585`: "**`src=json` 档免 ensure**…"（+ 批档 `:175` 追加钉定） |
| 4 | 🟡 `pass_at` 语义 | Fixed | `…design/SESSION.md:564`: "…`pass_at`（**最近一次实际写入（变更）时刻**——无源变的 pass 零写、不推进）…"；`:592` `--status` 文案"上次变更时刻（`pass_at`——无源变零写、不推进）" |
| 5 | 🟡 用例无测试承载档 | Fixed | `docs/batches/2026-09-22-session-index.md:165`: "| `thincoder-cli/test/session-index-cli.test.mjs` | 新档 0 | ~90（T-14 命令面…；AC-7 CLI 侧 + T-17 CLI 侧依赖面） | 测试 · 新 |"；`:166` VSC 侧档 |
| 6 | 🟡 `tool_calls` 形 vs 零行为变化 | Fixed | `…design/SESSION.md:235`: "**本会话缺省 = 参数面零行为变化**（路由零改——既有调用全不传 path）；**输出形例外** = `tool_calls` 带参数（§6.19 D-SE47——与缺省面共用行构造 ⇒ 缺省面同受；§6.9 已同步）。"；`:190` §6.9 返回行含 "`tool_calls` = `[{name, arguments}]`" |
| 7 | 🟡 `all` 覆盖面语义 | Fixed | `…design/SESSION.md:628`: "| `all` 面无命中（会话未入索引） | `all` = **已索引会话面**——未入索引会话该面零命中（≠ 不存在…）；首建路径 = ② 延迟拍 / ③ `--rebuild`；模型侧覆盖信号 = 工具描述 `path` 句…+ `--status` 覆盖计数 |"；`:605` 路由行同步 |
| 8 | 🟡 F-R19c / F-R19d 回指缺环 | Fixed | `…design/SESSION.md:536`: "> 需求 = `docs/core/requirements/SESSION.md` §4.3（F-R19a 跨会话检索 · **F-R19c** · **F-R19d**）· §4.4（F-S4 记录存储面）…"；`:630` 验收回指引 F-R19c / F-R19d；`docs/core/requirements/SESSION.md:125` 补设计落点行；批档 `:173` AC 回指补 |
| 9 | 🔵 `tail_hash` 检测窗残余 | Fixed | `…design/SESSION.md:621`: "…**检测窗残余** = 同尺寸 ∧ 尾 4KB 相同（仅前段被改）⇒ 漏检、旧行残留——自愈 = …/ 显式 `--rebuild` |" |
| 10 | 🔵 退化 `LIKE` 元字符 | Fixed | `…design/SESSION.md:626`: "…**元字符按字面**（`%` / `_` / `\` 转义 + `ESCAPE '\'`）⇒ keyword 恒字面匹配…**成本口径** = `messages` 全扫上界…；T-18 期望同步 = 批档 `:171` |
| 11 | 🔵 FTS 同删义务 | Fixed | `…design/SESSION.md:569`: "- **FTS 同删义务（写面判据句）**：…逐条列明——① 区间删行…② 会话级重建…③ 级联清…④ `--rebuild`（清四表）。"；`:570` 单点函数 + 取舍 |
| 12 | 🔵 冗余 `INDEX(sid, idx)` | Fixed | `…design/SESSION.md:561`: "…`UNIQUE(sid, idx)`（兼作查询主索引——同列序不重复建）/ `INDEX(ts)` / `INDEX(name)` | …" |
| 13 | 🔵 >300 档拆分审视 | Fixed | 批档 `:168`: "| `thincoder-core/agent-tools/read-history.mjs`（拆分审视 · #13） | 309 | +70…110 ⇒ 379…419：**不另立档**（…触发点 = 实施读数 ≥ 470 ⇒ SQL / FTS 检索面外提…） | 核 · 改 |"；`:169` bin/thincoder.mjs 行同步 |
| 14 | 🔵 FTS5 可行性实证 | Fixed | `…design/SESSION.md:568`: "- **FTS5 可行性（同装配先例）**：`node:sqlite` 装配的 FTS5 已在用——`thincoder-core/memory/schema.mjs:3` 头注「node:sqlite + FTS5、零依赖」…⇒ 本库无新依赖、无需实施期探测。" |
| 15 | 🔵 §2 状态行残留 | Fixed | 批档 `:32`: "**状态行**：设计完成（…上抛 6 项已逐项处置（🔴 两项需求档相抵 = 主 agent 2026-09-22 已收正；🟡 F-R19c / F-R19d 已补；🔵 三项 = 入册 / 并入实施面 / 记录面）；评审轮 1 发现 2–15 修正已落（见本段修正块））" |

**本轮发现表（新增 · 2 项——均 🔵，非阻断）**

| # | Orig# | File | Severity | Status | Notes |
|---|---|---|---|---|---|
| 1 | (new) | `docs/core/design/SESSION.md` | 🔵 | New：同族残留（修正轮覆盖两处，第三处口径现与已收正面分叉） | `docs/core/design/SESSION.md:657`: "| D-SE18 | 跨会话检索 = **`read_history` 加参数**（非新工具） | 检索族已多（5 工具选错）——单工具扩展 + 消歧总纲，本会话缺省零行为变化 |"——与已收正的 `:235`（"**本会话缺省 = 参数面零行为变化**…**输出形例外** = `tool_calls` 带参数…缺省面同受"）并列时口径不一（`tool_calls` 形变更同触缺省面）。**建议**：给 D-SE18 同款限定（参数面）+ 输出形例外指针，闭合该族。 |
| 2 | (new) | `docs/batches/2026-09-22-session-index.md`（§2 修正块 · 落位列） | 🔵 | New：修正块新内容——"写后读回" 行号与现态漂移，不可复现 | `:146`: "| 2 | 收正 | 设计档 §7 `D-SE25`（`docs/core/design/SESSION.md:658`）——跨会话面标「2026-09-22 由 D-SE47 / §6.19 接管」… |"——现态 D-SE25 在 `docs/core/design/SESSION.md:664`（658 现为 D-SE19 行）；`§6.19` 目标统一 **+6**（`:578-579` → 现 `:584-585` · `:622` → 现 `:628` · `:624-626` → 现 `:630-632` · `:563-564` → 现 `:569-570`），`§6.9` / `§6.13` 目标 **+1**（`:189` → 现 `:190` · `:234` → 现 `:235`）。**建议**：落位列标 as-of 快照口径，或按现态刷新一次。 |

**评审范围与限界**（同报告）：① 按声明只读三文档——修正块 / §6.19 引的源码坐标（`memory/schema.mjs:3/:130/:177/:239/:281`、`memory/core.mjs:95`、`read-history.mjs:50/:54/:175/:192` 等）未与磁盘对拍（`unverified`）；② 文档地图与项目标准文档未声明 ⇒ document ownership 按档内指针链 + AGENTS.md 判定；③ 轮次 1 的 §3 记录（本档 `:183-204`）为历史快照，其行号引文按当时档态为真，未随现态改写（正确）。

VERDICT: pass
计数：🔴 0 · 🟡 0 · 🔵 2（本轮新增）；轮次 1 的 15 项 = 全数落位（0 遗留）

## §4 用户批准（主 agent）

**批准（代签 · 2026-09-22 · 主 agent）**

- **授权依据** = 用户 2026-09-22 09:29「都自动跑吧」（hygiene / structure / triage / session-index 四批 = 点火 + 代签 + 派发 + 收口全自动）；**自缚条件三项齐备**：① 评审 pass ✅（轮 2 · 0🔴 0🟡 2🔵）② 修正落地核验 ✅（轮 1 的 15 项逐项现态复核 = 全数落位；🔵#2 父侧直接执行已落 · 🔵#1 待 #28 冻结窗解除后落，均为非阻断注）③ token 已签发 ✅。
- **批准对象** = 本批 §2 设计面（§6.19 机制 + §6.13 / §6.14 收正 + §7 D-SE43–D-SE47）；实施 = §2 受影响表全档（含补行两测档）。
- **实施前已知项**：① 台账 #205 收口时核销；② 3 处「（拟新增」标记 = 收口轮撤退义务（§1 `:29`）；③ #227（`.d` 孤儿泄漏）已另册；④ 实施轮开工前 doc-check 实跑为闸（口径见 §2 修正块）。

## §5 实施记录（eng-coder）
**状态行**：✅ 实施完成 2026-09-22（机制全量落地；三套件绿（核 563 / CLI 801 / VSC 938）· doc-check 本批零新增；内部审计轮 1 与代码评审轮 1（VERDICT pass，0 must-fix）终态 converged）



**交付摘要（2026-09-22 · eng-coder · 会话索引批实施轮）**

§6.19 机制**全量落地**：派生索引库（`node:sqlite` · 单库 `~/.thincoder/session-index.db` · 零权威 · 可重建）+ 取源双路 + 水位增量（四列三规则）+ 重建自愈（打开即验 / `.corrupt-<ts>` 保留）+ 查询面路由（索引优先 + 主存回落 + `path:"all"`）+ 触发三点（懒保证 / 延迟拍双端挂点 / 显式命令）；C / E 两洞消解、`tool_calls` 带参（`[{name, arguments}]` ≤300）。AC-1…AC-8 逐条有机检承载，AC-9 = 三套件读数（下）。

**改动档与实测读数（换行符口径 = `split("\n").length-1`）**

| 档 | 基线 | 实测 | 面 |
|---|---|---|---|
| `thincoder-core/session-index.mjs` | 新 | 285 | 打开 / DDL / schema / 写原语（含 FTS 同删单点）/ 测试缝 |
| `thincoder-core/session-index-query.mjs` | 新 | 102 | 查询与 FTS 检索（拆分产物 · 见决策表 #1） |
| `thincoder-core/session-index-build.mjs` | 新 | 298 | 枚举 / 取源 / 段读原语 / 水位三规则 / 单会话 ingest + 重建 / 懒保证 |
| `thincoder-core/session-index-pass.mjs` | 新 | 95 | 有界趟 / 全量重建 / 清行 / 延迟拍（拆分产物） |
| `thincoder-core/session-index-cmd.mjs` | 新 | 61 | `runSessionIndex`（`--status` / `--rebuild` / 无参=status / 错用拒） |
| `thincoder-core/fts-text.mjs` | 新 | 41 | `segmentCJK` / `buildFtsQuery` / `FTS_TOKEN_MAX` 单源外提 |
| `thincoder-core/memory/schema.mjs` | 460 | 453 | `segmentCJK` 外提 + re-export（零行为变更） |
| `thincoder-core/memory/core.mjs` | 318 | 304 | `buildFtsQuery` 外提 + re-export |
| `thincoder-core/agent-tools/read-history.mjs` | 309 | 407 | 索引优先路由 + `all` + tool_calls 带参 + 描述收正 + 头注死指针去除 |
| `thincoder-core/test/session-index.test.mjs` | 新 | 298 | T-1…T-18（10 组） |
| `thincoder-core/test/session-index-boundary.test.mjs` | 新 | 129 | 边界情形表补行（拆分产物） |
| `thincoder-cli/bin/thincoder.mjs` | 448 | 466 | `case "session"` 分发 index/gc + USAGE 两行 + 白名单分支启动拍 + 头注 |
| `thincoder-cli/test/read-history-guard.test.mjs` | 83 | 228 | await 化 + T-8/T-9/T-10/T-11/T-12 + 源已删边界 + AC-2 上限 |
| `thincoder-cli/test/session-index-cli.test.mjs` | 新 | 126 | T-14 三态 + AC-7 CLI 机检 + T-17 CLI 侧 + 触发点②拍 |
| `thincoder-vscode/extension.mjs` | 190 | 201 | 命令注册 + 启动拍挂点 |
| `thincoder-vscode/package.json` | 138 | 142 | contributes.commands +1（`thincoder.sessionIndexRebuild`） |
| `thincoder-vscode/src/extension/session-index-command.mjs` | 新 | 43 | VSC 命令处理体（核索引面**动态 import**） |
| `thincoder-vscode/test/session-index-command.test.mjs` | 新 | 100 | 处理体行为 + 接线机检 + T-17 VSC 侧 |
| `thincoder-vscode/test/files.mjs` | 130 | 132 | 新测档登记（**表外必改**——VSC runner 硬门） |

**三套件 + 机检读数（本席实跑）**

- `cd thincoder-core && npm test` ⇒ **563 pass / 0 fail**（基线 541）；
- `cd thincoder-cli && npm test` ⇒ **801 pass / 0 fail**（基线 787）；
- `cd thincoder-vscode && npm test` ⇒ **938 pass / 0 fail**（基线 926）；
- `node scripts/doc-check.mjs --root .` ⇒ 本批 diff **零文档档** ⇒ 新增 **0**。开工前实跑基线 = **悬空 16 / 行宽 12**（候选 20987 · 注记豁免 43 · 拟新增 13 · 迁移期引文 214）；收尾读数 = 悬空 4 / 行宽 2（降幅来自同仓并行批的文档收正，逐项清单不含本批任何档；批档 §2 所记「悬空 17 / 行宽 16」与本席实测不同）。
- 抖动登记（**面外**）：`test/spawn-system-block.test.mjs`（并行批新建档）在全量跑中两次 EPERM（其 `afterEach` 对 `spawn-block-*` 临时目录 `rmSync`），单跑与随后两次全量跑均绿 ⇒ 环境性抖动（Windows 临时目录句柄 / 防护扫描）；`test/session-release-shell.test.mjs`（并行批在飞档）曾一次红（`chat-panel.mjs` 的 `onDidDispose` 与其夹具不符），复跑已由该批收正。两档均不在本批交付面。

**决策透明表（超设计面 / 表外项——逐条给理由）**

| # | 项 | 设计依据 | 说明 |
|---|---|---|---|
| 1 | 拆出 `session-index-query.mjs` / `session-index-pass.mjs` | 批档 §2「跨档线拆分预案」（超 300 即二分） | 实施中实测 `session-index.mjs` 306 / `session-index-build.mjs` 409 越 advisory 线 ⇒ 按设计预案二分（DDL·打开与自愈 ∥ 查询与 FTS 检索；枚举与水位增量 ∥ 重建·拍·清行），四档收敛为 285/102/298/95（均 ≤300，无 >300 登记义务）。**表外项**：受影响表与设计 §6.19 形态行未列此两档（收口轮补行——见未决 1）。 |
| 2 | 单会话索引路径排序键 = `idx`（会话内序） | §6.19 只钉 `all` 面 = ts 升序；单会话面排序未钉 | JSON 面按 `history` 数组序（= 会话内序）；实测 ts 非单调夹具下两路顺序分叉 ⇒ 取 `idx` 使 T-11「过滤矩阵等价」逐条相等成立；`all` 面仍 ts（无 ts 行恒末尾）。 |
| 3 | 纯标点 keyword 走 LIKE 的触发判据 = 「含字母 / 数字」（`FTS_USABLE`） | §6.19 边界表「`buildFtsQuery` 返回空串 ⇒ 退化 LIKE」+ 同表「`%` 命中含 `%` 的消息」 | 两半句只能用「有无 unicode61 词元」调和（实测 `buildFtsQuery("%")` 为非空串而 FTS 零命中）；取该读法后 T-18（`%` / `_` 按字面）成立。建议设计席把触发条件写成「keyword 无字母 / 数字」。 |
| 4 | `all` 面查询前对**当前会话** ensure（射程仍 = 有段档） | §6.19 触发点①明列「当前会话（`all`）ensure」 | 与 §6.19 边界表「`all` 首建路径 = ② / ③」并存（设计句内相抵——审计 🟡#1）：实现取触发点①读法（`src=json` 档零动作 ⇒ 零成本）；无绑定 / 无槽 ⇒ 跳过。 |
| 5 | 打开自愈把 `-wal` / `-shm` 一并改名保留；失败句柄先关再改名 | §6.19「现场改名 … 保留 + 新建」 | 残 WAL 会挂到新库 ⇒ 三件套同改名；未关闭句柄使 Windows 改名失败（自愈整链失效）⇒ 失败路径先 `close()` 再抛。 |
| 6 | 源已删 ⇒ 懒保证先清该会话行（`dropSessionRows` 单点） | §6.19 边界表「源文件已删（库内仍有行）⇒ `ensure` 先清该会话行 ⇒ 走回落路径」 | 设计明列行，实施补齐并加机检（`thincoder-cli/test/read-history-guard.test.mjs` 源已删边界用例）。 |
| 7 | **表外必改档**：`thincoder-vscode/test/files.mjs` +2 行 | 无（runner 硬门） | `thincoder-vscode/test/run.mjs:53-55` 无漏登记反查：盘上 `*.test.mjs` 未登记即 fail ⇒ 新测档必须入册；如实披露。 |
| 8 | 测试档拆分：`thincoder-core/test/session-index-boundary.test.mjs` | 先例 = core-hygiene 登记注释（`test/batch.test.mjs` 拆出 `test/batch-placeholder-gate.test.mjs`） | 主测档 298/300 无余量 ⇒ 边界表补行按行数纪律拆邻档（核侧单层 glob 自动收集，无需登记）。 |

**审计与代码评审轮次与终态**

- **内部偏离审计（explore · 只读）** 轮次 1 ⇒ 0🔴 / 2🟡 / 3🔵；处置 = 🟡#1（`all` 面 ensure 缺）已补实现并机检；🔵#4（AC-2 截断分支零机检）已补用例；🔵#5（边界表六行缺夹具）已补 5 条（新邻档）；🟡#2（拆分两档未登记）与 🔵#3（设计档 §6.19 FTS5 实证指针因本批 re-export 位移失解）为文档面 ⇒ 报父侧（本席只读，不代改）。
- **内部代码评审（advisor · code）** 轮次 1 ⇒ **VERDICT pass**，0🔴 / 5🟡 / 3🔵，**全部未标 must-fix**；🟡 明细 = ① 源档损坏 ⇒ 陈旧索引行不清（设计边界表行为分叉——待父侧裁：清行 or 登记残余）②③ `read-history.mjs` 407 行 / `bin/thincoder.mjs` 466 行超 300（批档 §2 已裁定不拆、触发点 ≥470 / ≥480 未达）④ 拆分两档未入受影响表 ⑤ 3 处「（拟新增」标记 = 已登记收口义务；🔵 = keyword 折大小写轴（`LIKE` ASCII-only ∥ 回落面正则 `/i`）未覆盖 · 拍尾清行段未受 40 会话界约束 · VSC 命令 import 失败仅控制台痕。**终态 = converged**（无 must-fix ⇒ 不再开修轮）。
- 引用面注：advisor 的 `[host-verified] 0/5 citations match` 系其相对路径解析所致（声明根 `D:\teamcode` 下无 `thincoder-core/`，实际在 `D:\teamcode\thincoder\`）；涉 `memory/{schema,core}.mjs` 外提「零行为变更」本席另有实证 = 两函数对 16 例语料逐例等值 + `memory.mjs` 名面在位 + core 套件绿。

**fix round（实施内自修正，非评审轮）**

- R-1 `ORDER BY (m.ts IS NULL), m.ts, m.idx DESC` 只作用末项 ⇒ 方向缀逐项渲染（单会话取端 / `all` 窗口取端均修正）；
- R-2 打开失败后的未关闭句柄致 Windows 改名失败（自愈整链失效）⇒ `openRaw` 失败先 `close()` 再抛；
- R-3 单会话索引排序键改 `idx`（决策表 #2）；
- R-4 `readHistoryTool.execute` 曾整体 async ⇒ 既有同步调用面（`session-store.test.mjs` 三处 / integration 一处）破 ⇒ 改「缺省 / `cwd:` 面同步返回 string，索引面返回 `Promise<string>`」（装配面一律 `await`，`dispatch.mjs` 同款）；
- R-5 补装 CLI 会话型命令白名单分支的延迟拍（设计明列挂点，首轮漏装）。

**未决上抛（父侧 / 设计席笔域，本席不代改）**

1. 设计档 §6.19 形态行与批档受影响表未列 `session-index-query.mjs` / `session-index-pass.mjs` ⇒ **收口轮补行**（行数 + 面）；
2. 设计档 §6.19 的 FTS5 实证指针（`memory/schema.mjs:130/:177/:239/:281` · `memory/core.mjs:95`）因本批 re-export 位移失解 ⇒ 按现读重指；
3. 设计档 3 处「（拟新增」标记 ⇒ **收口轮撤**（批档 §1 已登记义务）；
4. 待裁定：① 源档损坏是否在查询期清行（评审 🟡#1）；② 设计边界表是否登记「非 ASCII 折大小写」delta 与「拍尾清行段不受 40 界约束」（评审 🔵）；③ 设计句内相抵（触发点① 的 `all` ensure ∥ 边界表「`all` 首建 = ②/③」）以本席实现读法为准，还是改写触发点①。

## §6 验证与收口（父代理）

**§6 验证与收口（主 agent · 2026-09-22）**

**核验**：① 抽核落点实读——`thincoder-core/session-index.mjs:22` `SESSION_INDEX_DB_NAME = "session-index.db"` + `:115`/`:120` 自愈链（`.corrupt-<epochms>` · 含 `-wal`/`-shm`）✓；CLI `bin/thincoder.mjs:434` `case "session"` → `:439` `if (args[0] === "index")` → `:440` 动态 import ✓（gc 面原样保留 ✓）。② 三包套件 **563 / 801 / 938 全绿** + AC-1…AC-9 逐条承载（T-1…T-18）= 采信交付报告实跑（子代理内部协议已审——审计 0🔴 · 代码评审 pass 0🔴）。③ `doc-check` = 本批零文档档 ⇒ 零新增 ✓。

**裁定**：① 上抛 1–3 = 由 **id=37** 落（§6.19 + 批档 §2 补两档行 · FTS5 指针重指 · 撤 3 处「拟新增」）✓；② 上抛 4① 源档损坏 = **查询期不清行**（清行 = 重建 / 趟面职责——查询路径零写纪律）✓；③ 上抛 4② 两 delta = **已登记**（`:630` 非 ASCII 折大小写 · `:633` 拍尾清行段不受 40 界）✓；④ 上抛 4③ 句内相抵 = **以触发点① 为准**（`:632` 已收正 · 无并存陈述）✓；⑤ id=37 发现 3（退化判据分叉）= **以实现读法为准**（判据 = 无 unicode61 可用词元 = `FTS_USABLE`；`:629` 父侧已收正）✓；⑥ id=37 发现 5（`:553` 双端单源列补全五档）= 接受（项 1 面内）✓；⑦ id=37 发现 2（`:789` 既有悬空锚 = basename 不唯一）= **记录面 B 判**（hygiene §2.11 在册残差）⇒ 零触碰 ✓。

**收口同步**：状态行 = 收口待提交（提交随四批联合收口）；台账 **#205** 销项随联合收口；design 槽（`f70f438b`）随联合收口消费；`.thincoder/tmp/` 探针副本 = 保留（先红证据载体）。
