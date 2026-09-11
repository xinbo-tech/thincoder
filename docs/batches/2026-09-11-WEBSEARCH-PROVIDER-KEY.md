# websearch.provider 死键处置（Gitee #IKEI3M 副面）· 批次记录（2026-09-11）

> **搬迁注记（LEDGER-SELF-CONTAINED 批——拆分）**：本档对端（VSC）份已由 VSC 仓 `docs/batches/2026-09-11-WEBSEARCH-PROVIDER-KEY（VSC 仓）` 逐字承载（D10——零改写）；本档保留本仓份。
> 移出条目（对端份）清单：§2 实施域 VSC 3 档 + 审计轮对端面（as-of `:146`）——条目计数（对端份 / 本仓份）= 5 / 3（判据 = `docs/design/LEDGER-SELF-CONTAINED.md` §8.3 拆分表）。

> 六段 append-only，一段一作者。编制：主 agent · 2026-09-11 17:35 · 来源 = 评估 id=48 勘出 + 用户 13:52「开批，issue都别留着，及时处理」。

---

## §1 讨论（主 agent 记）

### 本批条目（1 条）

| # | 条目 | 内容 |
|---|---|---|
| **A1** | **`config.websearch.provider` 死键处置** | 评估 id=48 实测：`src/config.mjs:103-106` 声明 `websearch.provider`，但代码只读 `apiKey`（`src/tools/web.mjs:49`）——**全仓无 `.provider` 读取点**（死键）。现状后端 = Tavily（凭 `apiKey` 触发）+ Bing RSS/HTML 兜底（`web.mjs:12-42/:70-84/:109-119`）。**父侧裁定（二选一交设计裁）**：① 接线为后端选择（枚举 + 分发）；② 移除该死键（含配置文档面）。判据 = 与 Gitee #IKEI3M（DeepSeek 搜索端点——**待外部证据**）未来面的衔接 + 用户配置兼容 + D2（不重述语义）。 |

### 已核事实（id=48）
- `web.mjs:48-68`（Tavily 触发面）· `:12-42/:70-84/:109-119`（Bing 兜底）；`config.mjs:103-106`（死键声明）。
- IKEI3M 主体（DeepSeek 官方搜索后端）= **阻塞待外部**（已评论索端点文档）——**不属本批**。

### 待设计裁定
1. 二选一选型（接线 vs 移除——含候选 ≥2 对比：若接线，枚举取值面/默认/兼容）；
2. 若接线：后端分发点（web.mjs 内）+ 配置校验面；
3. 受影响文件全清单（行数/增量）+ 用例/AC（死键读取面机验）+ 既有 websearch 测试零伤；
4. 与配置文档面（README/模板）同步范围。

### 范围边界（明确不做）
- 不做 DeepSeek 端点实现（待外部）；不改搜索语义/兜底链；不得新建档（必须 → 打回）。

### 状态
**已收口**（用户批准开批）。下一步 = 设计。

---

## §2 批次任务（eng-designer 自写）

_（待写——eng-designer）_

**状态：任务书就绪**（2026-09-11——设计已落档，待设计评审 · 实施者 = eng-coder / 设计 token 门）。本 §2 = coder 任务书本体（不另写副本）。

**落档位置**：需求 `docs/requirements/TOOLS.md` §2 F6 · §3 N8 · §4 边界 · 变更记录（已落）· 设计 `docs/design/TOOLS.md` §11（选型 §11.2 / 处置 §11.3 / 文件表 §11.4 / 决策 §11.5 / AC §11.6 / 用例 §11.7 / 边界 §11.8——已落）。

**一、覆盖条目（三方一致清单——本 §2 = 设计档 AC 回指 = 需求档条目）**

| 需求条目 | 本批内容 | 设计档 | 验收 |
|---|---|---|---|
| §2 **F6**（`websearch` 后端选择面单一） | `provider` 死键移除——申报面收敛为 `{ apiKey }`；读取面零残留；后端链（Tavily 触发 / Bing 兜底）零改 | §11.2 / §11.3 | AC-1 · AC-2（T1–T4 · T7–T8） |
| §3 **N8**（配置面诚实） | 文档面（README 模板）+ 两端写入面同批收口；遗留值零消费兼容 | §11.3 / §11.4 | AC-3 · AC-4 · AC-7（T2 · T5 · T6） |
| 零回归（批次边界） | 快层全量 + 两仓 `check-doc-width` + doc-consistency 新增 0 | §11.6 | AC-6 |

**二、§1 待裁 4 问——裁定结论**

1. 二选一选型 = **移除死键**（候选 3 对比表 + 判据逐项：设计 §11.2；接线方案已否决）。
2. “若接线：分发点 / 校验面” = **N/A**（选定分支非接线）——对应收口面 = 删除面（声明 / 文档 / 两端写入面）。
3. 受影响文件全清单 = 设计 §11.4（CLI 面 5 + VSC 面 3 + 父侧 2）；用例 / AC = 设计 §11.6 / §11.7；**既有 websearch 测试零命中**（`test/` 无 websearch 工具测试档——仅 `prompts-async-guidance` 提示词文本锚 + `settings.test.mjs` 遮罩样例引用 `websearch.apiKey`，均不在改动面）。
4. 配置文档面同步 = README 配置模板删 1 行（`README.md:159`）+ 两档需求 / 设计（已由 designer 落毕——本批）。

**三、不在本批（明确排除）**——设计 §11.8：搜索语义 / 兜底链零改（`src/tools/web.mjs` 零改）· DeepSeek 搜索端点（Gitee #IKEI3M 主体——待外部证据）· 遗留值剥离 / 迁移 / 写回 · `settings` 键特判 · 工具描述文本 · VSC 面板文案 / UI · 不新建文档档。

**四、受影响文件**（详见设计 §11.4 表）

- CLI：`src/config.mjs`（487 行——删 1 行）· `README.md`（472 行——删 1 行）· 新档 `test/websearch-config.test.mjs`（T1–T8 · ~80 行）
- VSC（纳入 or 拆批待裁——荐同批）：`src/extension/settings.mjs` · `src/agent/setup.mjs` · `test/agent-lifecycle-singleton.test.mjs`；VSC 文档面零同步（VSC 档未申报该键——已核）
- 文档 2 档已落（designer）；父侧：`CHANGELOG.md` / `docs/TODO.md` 记账（不入 coder files 域）

**五、验收标准**——AC-1..AC-7（逐条见设计 §11.6）。跑法：`cd thincoder && node --test test/websearch-config.test.mjs` · `npm test`（快层）· `node scripts/check-doc-width.mjs`（新增 0）；VSC 面追加 VSC 仓同跑。

**六、待父侧裁定 / 排程**

1. **VSC 镜像面：纳入本批 or 拆镜批**——荐纳入（防“CLI 删、VSC 继续播种”的假收口——设计 D-4）；拆批亦可（本批 CLI 面独立成立，镜批直取设计 §11.4）。
2. `CHANGELOG.md` 注记（父侧收口面）；`docs/TODO.md`——本批源自评估 id=48 快车道（用户 13:52「开批」），未入需求池 = 无状态推进项；如需台账索引行，收口时补。

**七、父侧核销 / 冻结提示**：本批 = Gitee #IKEI3M 副面（主体仍待外部证据）；设计评审在飞期间本档与设计档冻结（D5——改档即 stale）。

### 修正轮同步（2026-09-11——设计评审轮次 1 后；eng-designer 自写；本追加与上文本冲突时以本追加为准）

**背景**：设计评审（轮次 1）**pass**：🔴 0 · 🟡 1 · 🔵 7（发现表见 §3）。本修正轮逐条落修 **8/8**——只动文档（设计档 §11 + 本 §2），实现面零改、零新语义。

**一、覆盖表（修正版——替代上文「一、覆盖条目」表；🟡#1 对齐：补 AC-5 · T2 归回 N8 行）**

| 需求条目 | 本批内容 | 设计档 | 验收 |
|---|---|---|---|
| §2 **F6** | `provider` 死键移除——申报面收敛为 `{ apiKey }`；读取面零残留；后端链（Tavily 触发 / Bing 兜底）零改 | §11.2 / §11.3 | AC-1 · AC-2 · AC-5（T1 · T3 · T4 · T7 · T8） |
| §3 **N8** | 文档面（README 模板）+ 两端写入面同批收口；遗留值零消费兼容 | §11.3 / §11.4 | AC-3 · AC-4 · AC-7（T2 · T5 · T6） |
| 零回归（批次边界） | 快层全量 + 两仓 `check-doc-width` + doc-consistency 新增 0 | §11.6 | AC-6 |

**二、裁定回写（🔵#8）**：VSC 镜像面 = **纳入本批（已裁，2026-09-11）**——替代上文「六、1」的「待父侧裁定」；设计 §11.4 注 / §11.5 D-4 已同步回写。

**三、逐条落点（设计档 `docs/design/TOOLS.md` §11）**

- 🟡#1 覆盖表对齐 = 本追加「一、」表（补 AC-5 与 T7/T8；F6 行原「T1–T4」中的 T2 移出——T2→AC-4 归 N8 行）。
- 🔵#2 AC-7 验证载体注（§11.6 AC-7 行）：磁盘/快照子句 = 代码走查（写点/快照点）+ 残留清扫产出（§11.7 注）；测试绿 = `cd thincoder-vscode && npm test`。
- 🔵#3 T2 行为等价机验（§11.7 T2 行）：A/B 双配置——A 段去遗留键后与 B 段 deepEqual + `apiKey` 等值（D-2 保留语义下整段 deepEqual 不成立，取去键等值）。
- 🔵#4 扫描枚举单源（§11.7 新注）：4 形态（点 / 括号 / 解构 / 单行申报）+ 排除面明确；AC-2 / T3 / T7 引用同源。
- 🔵#5 T6 对齐 AC-3（§11.7 T6 行）：补 `apiKey` 子句。
- 🔵#6 T5 符号面核实（§11.7 T5 行）：`_buildShapeTable` 已核为导出符号（`src/agent-tools/settings.mjs:265`）· 纯派生（`:54-58`）· 测试先例（`test/settings.test.mjs:19`）——假设成立，无须新增受影响行。
- 🔵#7 残留清扫注（§11.7 新注）：两仓 `src` + 文档面（含 `docs/`）配置域 provider 清扫，产出并入 §5 验收记录。
- （核出项）VSC 播种点回填：`src/agent/setup.mjs` 兜底字面量 **3 处**（`:119` / **`:221`** / `:243`——原列 2 处，`:221` 为漏列）→ 设计 §11.3 / §11.4 表已修正。

**四、影响面**：受影响文件清单（§11.4）除 `setup.mjs` 行修正外零变（CLI 5 + VSC 3 + 父侧 2）；实现任务书（上文「四」「五」）范围不变——VSC 面按「已裁：纳入」执行。

### 单行修正轮（2026-09-11——设计评审轮次 2 后；eng-designer 自写；本追加与上文本冲突时以本追加为准）

**落修（设计档 `docs/design/TOOLS.md:136` §11.1 单行）**：轮次 2 表 #1 残遗收口——「另两个兜底字面量同携该键」→「另三处（`:119` / `:221` / `:243`）兜底字面量同携该键」，与同档 `:164`「3 处字面量」· `:186`「3 处：`:119` / `:221` / `:243`」对齐；零其它语义、零实现面（D6 回读已核）。

## §3 设计评审（评审子代理自写）

_（待写——评审子代理）_

### 轮次 1（评审子代理）

评审：第 36 批 §2 + 设计 `thincoder/docs/design/TOOLS.md` §11（11.1–11.8）+ 变更记录 + 需求 `thincoder/docs/requirements/TOOLS.md` F6/N8/§4——对象声明 5 项重点核逐条过卷；无 🔴。计数：🔴 0 · 🟡 1 · 🔵 7 · 计 8。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 三方一致（可追溯性） | 🟡 | 批次档 §2 覆盖表第 1 行把「T1–T4 · T7–T8」挂在 F6 的「AC-1 · AC-2」之下（thincoder/docs/batches/2026-09-11-WEBSEARCH-PROVIDER-KEY.md:45），但设计回指为 T2→AC-4 与 T7/T8→AC-5（thincoder/docs/design/TOOLS.md:218、thincoder/docs/design/TOOLS.md:223、thincoder/docs/design/TOOLS.md:224），且 AC-5（回指 F6——thincoder/docs/design/TOOLS.md:209）未出现在 §2 任一行的 AC 枚举中——跨档回指映射不齐（§2 已自兜底「AC-1..AC-7 逐条见设计 §11.6」——thincoder/docs/batches/2026-09-11-WEBSEARCH-PROVIDER-KEY.md:64，实际风险低） | 解除冻结后对齐 §2 行 1 的验收枚举（补 AC-5、T2 归属指回 N8 行），或反向在设计 AC-5 行注明归属——回指表单源化 |
| 2 | 验收标准（AC-7 验证载体） | 🔵 | AC-7 三子句（保存后磁盘 websearch 段无 provider / 读面快照无该字段 / VSC 测试绿——thincoder/docs/design/TOOLS.md:211）未逐条指名验证载体；受影响表行 8 仅列「夹具同步」（thincoder/docs/design/TOOLS.md:187）。VSC 仓测试面不在本评审读取范围（unverified；夹具需同步本身暗示现有套件断言写入内容） | §4/解除冻结时给 AC-7 注验证载体（指名 VSC 测试/断言，或标注「代码走查 + VSC 仓测试全绿」）——闭合 §2「VSC 面追加 VSC 仓同跑」的落点 |
| 3 | 验收标准（N8 等价句） | 🔵 | N8 判定句第二合取「行为与未设置一致」（thincoder/docs/requirements/TOOLS.md:35）无直接断言——AC-4/T2 只断「不抛 ∧ apiKey 原样」（thincoder/docs/design/TOOLS.md:208、thincoder/docs/design/TOOLS.md:218）；等价性靠 AC-2 零读取结构性隐含 | T2 扩为「带遗留键 vs 无该键」两份配置的 loadConfig 结果对照（websearch 段 deepEqual）——一行成本把判定句机验化 |
| 4 | 清晰性（扫描面枚举） | 🔵 | 扫描面枚举两处不一致：AC-2 三形态「点访问 / 括号访问 / 解构」（thincoder/docs/design/TOOLS.md:206）vs T7 四探针「点访问 / 括号 / 解构 / 单行声明」（thincoder/docs/design/TOOLS.md:223）——「单行声明」探针暗示扫描器或覆盖声明位；AC 与 T 未单源 | 在 §11.7 注一处权威枚举（含是否覆盖声明位/字面量串），AC-2/T3/T7 引用同一枚举——防实现面按各自读法标定 |
| 5 | 验收标准（AC↔T 逐字） | 🔵 | T6 弱于 AC-3：AC-3 要求「websearch 段在（含 apiKey）」（thincoder/docs/design/TOOLS.md:207），T6 只断「有 `"websearch"` 段」（thincoder/docs/design/TOOLS.md:222） | T6 补 apiKey 子句，与 AC-3 逐字对齐（防段内 apiKey 被清仍过测） |
| 6 | 可行性（T5 符号假设） | 🔵 | T5/AC-4 依赖 `_buildShapeTable` 可导入且纯派生自 DEFAULTS（thincoder/docs/design/TOOLS.md:208、thincoder/docs/design/TOOLS.md:221；派生点标注 settings 模块 `:58`）——符号导出面/纯派生性在本评审读取范围外（unverified）；若符号私有或表内存在钉死项，受影响表将缺 CLI settings 档一行。AC-6 快层全量可令误差显性化（thincoder/docs/design/TOOLS.md:210） | 实施首跑先核符号面；私有则改走公开语义断言（settings 查询路径）并回填受影响表 |
| 7 | 完备性（残留提及） | 🔵 | 文档/代码两查钉的是精确串 `"provider": "tavily"`（thincoder/docs/design/TOOLS.md:207、thincoder/docs/design/TOOLS.md:222）——README 注释/散文中不含该精确串的 provider 残留可同时逃过两查；VSC 仓无仓级复查（仅 3 个列名点）。「CLI 文档面仅 README」「VSC 播种面仅 3 点」为 as-of 断言（unverified） | 实施时两仓 + docs 各做一次配置域 provider 残留清扫，产出并入验收记录——廉价完备性证据 |
| 8 | 文档状态（裁定回写） | 🔵 | 父侧已裁「VSC 镜像面纳入本批」（对象声明），但设计 §11.4 注仍写「同批收口 = 荐——父侧可裁拆镜批」（thincoder/docs/design/TOOLS.md:189），批次档 §2 六仍列「待父侧裁定」（thincoder/docs/batches/2026-09-11-WEBSEARCH-PROVIDER-KEY.md:68）——实质无分歧（所荐即所裁），属裁定未回写 | §4 批准/解除冻结时回写「纳入本批（已裁）」——防实施者误判 VSC 面在域与否 |

VERDICT: pass

### 轮次 2（评审子代理）

校验：第 36 批轮次 2（单轮校验——只核修正轮 8 条落点 + 1 核出项，映射 = §2 修正块 :73-99）。

逐条核过：
- 🟡#1 覆盖表对齐（批次 :77-83）= F6→AC-1·2·5（T1·T3·T4·T7·T8）✓ · T2→N8 行（AC-4）✓
- 🔵#2 `TOOLS.md:211` ✓ · #3 `:218` ✓ · #4 `:226-228`＋`:206`/`:219`/`:223` ✓ · #5 `:222` ✓ · #6 `:221` ✓ · #7 `:230` ✓ · #8 `:189`＋`:196` ✓
- 核出项：`:164`/`:186`（播种 3 处）✓ · `:245-246` ✓ · §11.4 行 5 = 247 行（126+121 吻合；实测 247 行吻合）✓

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Doc-state（核出项残遗） | 🟡 | 播种点计数未全域同步——`docs/design/TOOLS.md:136`（§11.1）仍写「另两个兜底字面量同携该键」（setup.mjs），与同档 :164「3 处字面量」· :186「3 处：`:119` / `:221` / `:243`」及批次 :96「兜底字面量 3 处」不一致（修正轮声明落点仅 §11.3/§11.4——批次 :96）。 | 将 :136「另两个」改「另三处（`:119` / `:221` / `:243`）」，与 :164/:186 对齐（一行改，父侧落）。 |

计数：🔴 0 · 🟡 1 · 🔵 0 · 计 1。

VERDICT: pass

## §4 用户批准（主 agent 记）

**2026-09-12 02:10 父侧代签**——用户 12:48 授权（13:38 延展至排空）；三条件齐备：轮次 1 pass（🟡1 · 🔵7）→ 修正 8/8 + 核出项（播种 3 处回填）→ 轮次 2 pass（残遗 🟡1）→ **单行修正落定经核**（`:136`「另三处（:119/:221/:243）」——与 :164/:186 对齐）→ **token 已签发**（值不落档）。

**批准范围**：实施域 6 档（CLI 3 + VSC 3）：`src/config.mjs`（−1）· `README.md`（−1）· 新档 `test/websearch-config.test.mjs`（T1–T8）· `thincoder-vscode/src/extension/settings.mjs`（−2）· `thincoder-vscode/src/agent/setup.mjs`（±3——3 处字面量）· `thincoder-vscode/test/agent-lifecycle-singleton.test.mjs`（±1）。

**遗留（批准时登记）**：① 父侧排程：残留清扫产出并入 §5 验收记录；② commit 待父侧。

## §5 实施记录（eng-coder 自写）

_（待写——eng-coder）_

**状态：clean**（内部偏离审计 clean · 内部代码评审 pass（🔴 0 · 🟡 0 · 🔵 3）· 交付验收 AC-1–AC-7 已核 · 实测口径 = read-tool 行数（内容行 + 尾行），内容行数括注）。实施者 = eng-coder（设计 token 门）。as-of 2026-09-11。

### 一、落笔（6 档——逐档实测）

| # | 档 | 文件 | 改动 | 交付后实测 | 净变化（实测） |
|---|---|---|---|---|---|
| 1 | CLI 声明 | `src/config.mjs` | `DEFAULTS.websearch` 删 provider 行 + 注释合并（§11.3 目标形态逐字） | 497 行（内容 496） | 0（设计预计 −1） |
| 2 | CLI 文档 | `README.md` | 配置模板删 `"provider": "tavily",` 行（websearch 段两注释保留） | 472 行（内容 471） | −1 ✓ |
| 3 | CLI 测试 | `test/websearch-config.test.mjs` | 新建——T1–T8（§11.7 逐条） | 111 行（内容 110） | 新建 |
| 4 | VSC 写/读面 | `thincoder-vscode/src/extension/settings.mjs` | 写点删 `ws.provider = "tavily"`（:138-143）；快照 `{provider,hasKey}` → `{hasKey}`（:130-134） | 349 行（内容 348） | −1（设计预计 −2） |
| 5 | VSC 兜底 | `thincoder-vscode/src/agent/setup.mjs` | 3 处字面量去 provider：`:119` / `:221` / `:243`（逐点位改） | 463 行（内容 462） | 0（±3 ✓） |
| 6 | VSC 夹具 | `thincoder-vscode/test/agent-lifecycle-singleton.test.mjs` | `:45` 夹具同步（与 `setup.mjs:119` 同形） | 431 行（内容 430） | 0（±1 ✓） |

### 二、交付验收透明表（AC-1–AC-7——判据源 = 设计 §11.6）

| AC | 判据（机验） | 证据 | 结论 |
|---|---|---|---|
| AC-1 | `DEFAULTS.websearch` 键集 == `{ apiKey }`（deepEqual） | T1 绿；`src/config.mjs:104-107` | ✓ |
| AC-2 | `src/**/*.mjs` 扫描 0 命中 ∧ `web.mjs` 含逐字读取 | T3/T4 绿；`src/tools/web.mjs:49` = `ctx?.agent?.config?.websearch?.apiKey` | ✓ |
| AC-3 | README 无 `"provider": "tavily"` ∧ 段在（含 apiKey） | T6 绿；`README.md:157-161` | ✓ |
| AC-4 | 遗留配置不抛 ∧ apiKey 原样；键表脱表 | T2/T5 绿（`_buildShapeTable(DEFAULTS)["websearch.provider"] === undefined`） | ✓ |
| AC-5 | 反证：探针必命中 ∧ 合法样本零误报 | T7 绿（4 形态 5 探针）· T8 绿（2 负例） | ✓ |
| AC-6 | 快层零新增失败 · 两仓 doc-width 新增 0 · doc-consistency 新增 0 | 本批文件新增 0（详三/四）；仓级 5 条 V1/V2 + 18 行宽度违规全部为他批在途档 | 本档 ✓（仓级见三） |
| AC-7 | VSC 保存后磁盘无 provider · 快照无该字段 · VSC 测试绿 | 写点/快照点代码走查 + 实证脚本（clean 路径零 provider）+ 残留清扫 + VSC 452/0/7 | ✓（遗留值 nuance 见五） |

### 三、测试实测（先落盘再查——log 均落 `%TEMP%`，不直读管道）

| 跑法 | 结果（log） |
|---|---|
| `cd thincoder && node --test test/websearch-config.test.mjs` | 8 pass / 0 fail（246ms） |
| `cd thincoder && npm test`（快层全量 ×2） | run2：tests 519 / pass 504 / fail 1——唯一 fail = `doc-consistency` T41（新增 5 条全在他批档：ACP-CHANNEL-FIXES / PORTABILITY / TUI-SELECTION）；run1 另见 2 负载型 flake（`activity-debloat` / `input-lock`——隔离单跑 10/10、4/4 绿复核）+ slow-gate 2 例（`portability-index`，他批）（cli-fast.log / cli-fast2.log） |
| `cd thincoder-vscode && npm test` | tests 459 / pass 452 / fail 0 / skipped 7（9.8s）（vsc-fast.log） |
| `node scripts/check-doc-width.mjs`（CLI 仓） | 宽度 11 文件/18 行 + 一致性新增 5 条——**全部他批在途档**；本批 3 档文档面零命中（dw-cli.log） |
| `node scripts/check-doc-width.mjs`（VSC 仓） | OK 宽度（67 文件）· 一致性新增 0 · 存量 33（dw-vsc.log） |

### 四、残留清扫产出（设计 §11.7 注——并入本条验收记录）

- `thincoder/src`：**0 命中**（websearch↔provider 语法关系）；Tavily 实现/注释 = 后端名（保留）。
- `thincoder-vscode/src`：**0 命中**（`agent-state.mjs:92` = `cfg.websearch` 透传，无键面）。
- 文档面：`thincoder/README.md` 0 命中；`thincoder/docs/` 命中 = 设计 TOOLS.md §11 / 需求 TOOLS.md F6·N8 / 本批次档（决策与历史记录——预期保留）。
- ⚠ 域外命中 2 处（**父侧裁定项；本批未改——超批准 6 档域**）：
  1. `thincoder-vscode/README.md:66`——配置模板仍申报 `"provider": "tavily",`（与 §2「VSC 档未申报该键——已核」断言不符；N8 文档面洞）。
  2. `thincoder-vscode/webview/settings-state.js:21`——JSDoc 类型注解仍含 `provider?`（零功能影响：webview 只读 `hasKey`）。

### 五、偏差披露（设计 §11.4 预计 vs 实测）

1. `src/config.mjs` 净 0（预计 −1）：差值来源 = §11.3 目标形态块保留独立注释行（逐字照目标形态，未压同行）；绝对数 497 vs as-of 487 属他批在途改动（本批方向 −1 类，安全）。
2. `settings.mjs` 净 −1（预计 −2）：读面「去字段」为同行改写（注释与 return 各改 1 行、行数不变）——语义逐字达标；写面 −1 已落。
3. `README.md` 内容 471 行（as-of 472，−1 → 预期 471）：−1 已落（模板无 provider 行）；绝对数与他批在途/as-of 时点相关。
4. AC-7 遗留值 nuance（D-2 已接受）：磁盘配置**原带** provider 时，面板保存 key 后该遗留值原样保留（零写回、零剥离）——实证脚本：A 场景保留、B/C/D（无遗留）零 provider；与 §11.3 遗留值语义一致，非缺陷。
5. 既有测试面零伤：`settings.test.mjs` 遮罩样例（`websearch.apiKey`）与 `prompts-*` 文本锚均未触碰。

### 六、内部审计与代码评审（§18 自含交付协议——本会话内完成）

- **偏离审计**（explore 只读）：**clean**——四类偏差（PARTIAL / SILENT-SIMPLIFICATION / DOC-DRIFT / OUT-OF-LIST）零；其 3 观察项已逐条落：行数漂移 → 本条五 · webview JSDoc → 本条四 · 清扫落档 → 本条四。
- **代码评审**（advisor code，同步）：**pass**——🔴 0 · 🟡 0 · 🔵 3（裁决表见七）。

### 七、评审裁决表（advisor 发现 → 处置）

| # | Action | Detail |
|---|---|---|
| 1 | Deferred | T6 段切分健壮性（🔵 可选，`test/websearch-config.test.mjs:88`）——现 README 实况绿；T1–T8 按设计「逐字」锁定，加固留父侧定 |
| 2 | Deferred | T4 名字「唯一」vs 存在性断言（🔵 可选，`test/websearch-config.test.mjs:73-74`）——与设计 §11.7 T4 行一致；改名/计数断言留父侧定 |
| 3 | Not an issue | `config.mjs` 行数漂移（🔵）——本批净 0、方向安全；+10 归他批在途；500 硬限提示已由本条一/五记录 |

### 八、边界遵守（设计 §11.8）

`src/tools/web.mjs` 零改 · 工具描述/提示词零改 · 遗留值零剥离/校验/特判 · VSC 面板 UI 零改 · 不 commit · 不发起链上评审。批准域 6/6 档落齐，零超域改动（域外 2 处残留仅报告未改——见四）。

### 审计修正轮（2026-09-11——父侧裁定：域外 2 处「修」；eng-coder 自写）

**背景**：上轮 §5 四「⚠ 域外命中 2 处（父侧裁定项；本批未改——超批准 6 档域）」裁定 = **修**（2/2）。
复用同 designId+token；只改两处；读面 / 写点零其它改动；不 commit、不发起评审。

**一、落点（2 档——git diff 实测）**

| # | 档 | 改动 | 证据 |
|---|---|---|---|
| 1 | `thincoder-vscode/README.md` | websearch 配置模板删 `"provider": "tavily",` 行（原 :66——与 CLI README 同款） | git diff：−1 行；段内 `"apiKey"` 保留（模板仍成立） |
| 2 | `thincoder-vscode/webview/settings-state.js` | JSDoc 类型注解去 `provider?: string`（:21）→ `{ hasKey?: boolean }` | git diff：−1 词；node --check OK；与实际读面一致（`settings-tools.js:50/:104` 仅读 `.hasKey`——「零功能影响」复核成立） |

**二、终扫证据（两仓配置域 provider 残留——三查）**

- **4 形态语法关系扫描**（点 / 括号 / 解构 / 单行申报；枚举与测试单源）：`thincoder/src` 0 · `thincoder-vscode/src` 0 · `thincoder-vscode/webview` 0——源码域合计 0。
- **段级**（T6 语义扩展到 VSC README）：两 README `"websearch": {` 段内 provider 零出现 · `apiKey` 在 · 4 形态行命中 0。
- **精确串 `"provider": "tavily"` 全树**：**VSC 仓 0 命中**；CLI 仓 3 档 = `test/websearch-config.test.mjs`（T7 负例探针）· `docs/design/TOOLS.md` §11（决策记录）· 本批次档（历史记录）——均为记录面，配置模板 / 代码面 0。
- 附带：`thincoder-vscode/package.json` 无 websearch / provider 键面（VSC 配置 schema 零申报）；webview `provider?` 软残留 0。

**三、验证实测（先落盘再查——log 落 `%TEMP%`）**

| 跑法 | 结果（log） |
|---|---|
| `cd thincoder-vscode && npm test` | tests 466 / pass 459 / fail 0 / skipped 7（8.2s——ws36-vsc-fix2.log） |
| `node scripts/check-doc-width.mjs`（VSC 仓） | OK 宽度（67 文件）· 一致性新增 0 · 存量 33（ws36-vsc-dw.log） |
| `cd thincoder && node --test test/websearch-config.test.mjs` | 8 pass / 0 fail（204ms——ws36-cli-fix.log） |

注：VSC 全量首跑（ws36-vsc-fix.log）见 1 fail = `prompts-mirror-anchors`（⑦ en↔en 字面串，他批在途编辑面的瞬时态）——同分钟直查该档 7 条字面串两仓全在 · 单跑 9/9 绿 · 全量复跑绿；本批两档均不在该测试读取域，判为非本批面。

**四、红线遵守**：只改 2 处 · 读面 / 写点零其它改动 · CLI 仓本轮零改动 · 不 commit · 不发评审。

## §6 验证与收口（父代理自写）

**2026-09-12 05:30 父侧收口**（用户授权窗口 12:48→排空）。

### 父侧验证

- 定向 **8/8**（CLI）· VSC **466/459/0** · VSC 宽度 OK；
- **父侧抽核**：VSC README provider 零 ✓ · `settings-state.js` JSDoc 已清 ✓ · **精确串 VSC 仓 0 档** ✓；
- 内部：代码评审 pass（🔵3——含 T6 段切分）→ 审计修正轮 2/2（三查终扫）；报告面 5 项全落。

### 逐条验收结论

- **AC-1——AC-7 全绿**（残留清扫含文档面——VSC README 洞已补）；**Simplified 零 · Not done 零**；偏差如实（§2「已核」为假已修正——以实际清扫为准）。

### 核销同步清单

- 角色表：无 ✓ · 状态行：§5 clean ✓ · 计数：6+2 档实测 ✓ · 指针：设计 §11.7 ↔ 用例 ✓ · 待办：四项（下）✓

### 遗留项

1. **需求池登记**（TODO——拟录文本见批 §2 §10）；
2. `config.mjs` 497 行拆分立项（距硬限 3 行——父侧排程）；
3. 文档层数字刷新（测档 111/设计行数）；VSC `shell` 镜像面（另批）；
4. **设计 token 已消费（链终）**；commit 待父侧随批提交。
