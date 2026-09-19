# 2026-09-18 · 蒸馏调用前缀复用（#47）

## §1 讨论（主 agent）

**状态行**：✅ 已收口 2026-09-18（提交 `0c239c0`；8/8 例 · 三包 342/676/600 全绿 · clean；AC8 真机读数 unverified）

### 1.1 批件（用户 2026-09-18 04:46「都开了吧」）

| # | 条目 | 实况 |
|---|---|---|
| ① | **台账 #47**：`explore-distill.mjs:105` 蒸馏调用**零前缀复用**（`EXPLORE_SUMMARY_PROMPT` 单条 user、无前缀 ⇒ 命中 ≈0）——压缩续写**同族**，量级 ~10–17K prompt/次 | 修法 = **同式改**（对齐压缩 v2/v3：同声明面 + `reasoningEffort` 同源） |

### 1.2 路径

**设计轮（eng-designer）** → 评审 → 实施（eng-coder）。**依赖 = 压缩批 v3 定形**（修法同构复制——设计可先行，实施待 v3 落地读数）。

### 1.3 边界

- **禁触**：提示词面（`EXPLORE_SUMMARY_PROMPT` 文本）· `provider/**` · 数据面 · 冻结批档。
- 判据 = 真机蒸馏调用 `cached / prompt` 读数（对照改前 ≈0）。

### 1.4 台账

- **#47**。

## §2 批次任务与设计修订（eng-designer）

### 2.0 设计轮交付（eng-designer · 2026-09-18 · initial 轮）

设计已落 **`docs/core/design/CONTEXT-COMPACTION.md` §6.15 + §7 D-CC21 + §6.9 H1 指针/签名收正 + 变更记录**（本档 426 → 511 行；**评审轮 1 收正后 = 508 行** · `wc -l`）。机制条文不复制入本档（D2）——下列各表 = 本批**任务书**。

### 2.1 本批覆盖的条目

| 条目 | 来源 | 本批判定 |
|---|---|---|
| #47 蒸馏调用零前缀复用（命中 ≈0） | 台账 tech_todo（2026-09-17T18:07Z 登记） | 本批修复（**同式改**——与压缩线 §6.14 v2/v3 逐件同构） |

**本批不含**（明示）：蒸馏**替换面 / 触发阈值**（设计档 §6.9 H1 不动）· 提示词面（`EXPLORE_SUMMARY_PROMPT` 文本——上抛主 agent）· `provider/**` · 压缩面（`context.mjs`）· 数据面 · 冻结批档 / `_archive/**` / 参照树。

### 2.2 修后形态（设计定稿 · 机制条文 = 设计档 §6.15）

```
messages = [ {role:"system", content: extras.systemPrompt},        // 与回合请求同字节
             ...history.slice(0, lastBlockEnd),                    // 中段真身消息（原样引用——不拷贝/不截断）
             {role:"user", content: EXPLORE_SUMMARY_PROMPT} ]      // 尾部指令（唯一新增面）
tools    = extras.tools           // 与回合同一声明面；不随 tool_choice（§6.14 分区实测）
provider = {...agent.provider, thinking: null}   // 不覆盖 reasoningEffort ⇒ 与回合侧同源（v3 形态）
```

- 前缀（可复用面）= `tools` 声明 + `system` + `history[0, lastBlockEnd)`；未命中面 = 尾部指令一条（+ ≤255 块对齐残余）。
- `lastBlockEnd` = 本 run 最后一个探索块的 `end`（与替换面同一 blocks 数组——不新增第二处切割判据）。
- 形态构造面**单源**：复用 `thincoder-core/compress-form.mjs` 的 `buildCompressMessages(history, cut, systemPrompt, instruction)`——**不设第二构造点**（D2）；该模块头注随批收正。
- **序列化面退役**：`serializeExplorationMessages` + `safeSliceUTF16` 引用（`explore-distill.mjs:13`）随批删除；`text-budget.mjs` 仍有 memory 族消费方（`memory/core.mjs:15`）⇒ 非末位消费。
- 替换面不变（note 插首块位 / 块整体丢弃 / 非块保留 / `_fullHistory` 不触 / 失败静默 N3）。

### 2.3 受影响文件表（as-of 设计轮 · `wc -l` 口径；**Δ / 行数按 §5 实测收正**——2026-09-18 漂移收正轮）

| # | 文件 | 现况 | Δ | 改动性质 |
|---|---|---|---|---|
| 1 | `thincoder-core/explore-distill.mjs` | 156 → **152** 行（实测 · §5） | 净 **−4**（实测——删序列化面 ≈ −19 / 头注 +2；设计预测 ≈ −6 未达） | 调用形态改会话续写（`buildCompressMessages` + `tools` + 不覆盖 effort）+ `extras` 透传链 |
| 2 | `thincoder-core/compress-form.mjs` | 21 行 | +≈3 | 头注收正：声明两消费点（零逻辑改） |
| 3 | `thincoder-core/agent.mjs` | 428 行 | +1 | 调用点 `:346` 透传 `{ systemPrompt, tools: toolSchemas }` |
| 4 | `thincoder-core/test/explore-distill-form.test.mjs` | 新档 **257** 行（实测 · §5） | **+257**（设计预测 ≈200；<300 软线 ✓ ⇒ 免登记） | 形态 / 前缀性质 / 声明面 / effort 同源 / 退化面 / 替换面回归（先红→后绿） |
| 5 | `thincoder-vscode/src/explore-distill.mjs` | 53 → **55** 行（实测 · §5） | **+2**（实测；设计预测 +≈4） | 适配器透传 `extras`（调用期适配；**端形向后兼容——在 `agent`（第 5）之后追加第 6 位 `extras`**（核形 = 第 5 位）——父侧直改·可 revert · 承复核轮发现 1）+ 头注端形签名行同步（`:11`） |
| 6 | `thincoder-vscode/src/agent/run-stages.mjs` | 379 行 | +1 | `fireEndOfRunDistill`（`:260-262`）加 `extras` 形参透传 |
| 7 | `thincoder-vscode/src/agent.mjs` | 485 行 | +1 | 发射点 `:372` 传 `{ systemPrompt, tools: toolSchemas }` |
| 8 | `docs/core/design/CONTEXT-COMPACTION.md` | 426 → 511 → **508** 行（评审轮 1 收正后 · `wc -l`） | 本档 | §6.15 + D-CC21 + §6.9 H1 指针 + §6.14 行数沿革 + 变更记录 |

**尺寸档状态注（评审 #6 · as-of 设计轮）**：`thincoder-core/agent.mjs` 428 行——内 `runAgent`（`:96`–`:428` ≈333 行）= **函数档 >300**（本批 +1 ⇒ 未跨界、无拆分计划义务；把下次触碰该函数面的拆分预期前置）。
`thincoder-vscode/src/agent.mjs` 485 行 = **距 500 硬限余 15 行**（本批 +1 ⇒ 486 · 余 14）；其余均在软线内：核 `explore-distill.mjs` 156 · `compress-form.mjs` 21 · VSC `agent/run-stages.mjs` 379 · VSC 适配器 53 · 新用例档 ≈ +200（<300 软线 ⇒ 免登记）。

**零改动（逐处核实）**：`thincoder-core/context.mjs` · `thincoder-core/provider/**`（`chat` 签名与发送面不变）· `thincoder-core/text-budget.mjs` · `thincoder-cli/**`（TUI 只 flush `_pendingDistill`）· 提示词面。测试入口 `thincoder-core/test/run.mjs` = `test/*.test.mjs` 单层 glob ⇒ 新档免登记。

### 2.4 验收判据（逐条回指 #47 · 机判形式）

| AC | 判据 | 机判方式 |
|---|---|---|
| AC1 形态 | 请求 = `[system, ...history.slice(0, lastBlockEnd) 原样, 指令]`；末条 `role="user"` 且 `content === EXPLORE_SUMMARY_PROMPT` | 用例 1（fetch 桩捕获 body；含**单源深等锁**——评审 #4） |
| AC2 前缀性质 | 请求去末条后与 `[{system}, ...agent.history]` 的同长前缀**逐元素深等** ⇒ 前缀可复用 | 用例 2（同一夹具双构造） |
| AC3 声明面 | `body.tools` = 回合同一数组（深等）；**无** `body.tool_choice` | 用例 3 |
| AC4 参数同源 | `provider.reasoningEffort="max"` ⇒ `body.reasoning_effort="max"`；未配置 ⇒ 字段缺省；`body.thinking` 恒不发（`thinking:null`） | 用例 4（两态） |
| AC5 覆盖边界 | 请求**含**末块全部 tool 消息；末块**之后**的尾部消息不进请求 | 用例 5 |
| AC6 替换面回归 | note 插首块位、块全丢、非块消息保留、`_fullHistory` 长度不变 | 用例 8 |
| AC7 失败静默 | `chat` 抛错 / `content` 空 ⇒ 返回 null ⇒ `agent.history` 引用与内容不变、不触发 `onDistilled` | 用例 7 |
| AC8 **真机读数（本批判定句）** | `"stage":"distill"` 轨迹行 `usage.prompt_cache_hit_tokens / usage.prompt_tokens ≥ 0.9`（对照改前 **0/18 = 0%**；判定格口径 = 注 A——评审 #5） | 取证 = `~/.thincoder/traces/<date>/*.jsonl`（人工核；前置闸 = 同会话回合调用命中 ≥0.9） |
| AC9 机检零新增 | `node scripts/doc-check.mjs` 按档归属零新增 | 本席复跑：设计轮——本档悬空 **12 条 = 改前同集**；行宽 **1 行 `:303`（既有）**·评审轮 1 收正后——设计档悬空 **12 条（同集）**·行宽 **1 行（既有）**；批档不在机检扫描域（manifest `anchors.exclude` 含 `batches`）⇒ 不列报 |

**注 A（AC8 判定格口径 · 评审 #5 补）**：判定格取**中大型前缀会话**（前缀占请求主体）——命中率结构上限 ≈ 前缀 /（前缀 + 未命中面），未命中面 = 尾部指令一条 + ≤255 块对齐残余；小前缀会话**不作判定格**（够不到 0.9 属结构性，非机制未生效），如需折算按 `(prompt − 未命中面) / prompt` 口径。

### 2.5 用例表（正常 / 边界 / 错误 + 输入 / 期望输出）

| # | 场景 | 输入 | 期望输出 |
|---|---|---|---|
| U1 | 正常 · 形态（**先红格**） | history 含 3 探索块 + extras{systemPrompt, tools} | `messages[0].role==="system"`（= 回合 systemPrompt 逐字节）· 末条 = 指令 · 中间 = `history.slice(0,lastBlockEnd)` 原样引用 ＋ **单源深等锁**（注 B） |
| U2 | 正常 · 前缀性质 | 同上 | 请求去末条 = `[{system},...history]` 同长前缀（逐元素深等） |
| U3 | 正常 · 声明面 | tools 传回合同一数组 | `body.tools` 深等、`body.tool_choice` 缺省 |
| U4 | 边界 · 参数同源 | `reasoningEffort:"max"` / 未配置 两态 | 前者 `body.reasoning_effort="max"`、后者缺省；`body.thinking` 两态皆缺省 |
| U5 | 边界 · 切点覆盖 | 末块之后追加一条非块消息（如收尾 assistant） | 请求含末块 tool 消息、不含该尾部消息 |
| U6 | 边界 · 退化（无 extras） | `extras` 缺省 | 无 system 头、不发 `tools`；形态 = 「history 前缀 + 指令」，正确性不变（替换仍落） |
| U7 | 错误 · 失败静默 | 桩抛错 / 桩返空 content | 返回 null；`history` 不变；`onDistilled` 零触发 |

**注 B（U1 单源深等锁 · 评审 #4 补）**：用例 1 增 `deepEqual(body.messages, buildCompressMessages(history, lastBlockEnd, SYS, EXPLORE_SUMMARY_PROMPT))`——形态构造单源（D2）+ 序列化面退役同锁；同式先例 = `thincoder-core/test/compress-form.test.mjs:107`。

### 2.6 先红方案

- **离线（实施轮落）**：`thincoder-core/test/explore-distill-form.test.mjs`（`globalThis.fetch` 桩——先例 `thincoder-core/test/compress-form.test.mjs:114-151`）。修前形态下 U1/U2/U3/U4 **必红**（修前 `messages[0].role === "user"`、无 `tools`、`reasoning_effort` 恒缺省）；修后转绿。
- **真机（非 CI 门禁）**：跑一轮 ≥3 条探索结果的会话 ⇒ 读 `"stage":"distill"` 轨迹行（AC8）；对照基线 = 本批设计轮自采 18 次全 0。

### 2.7 依赖 · 上抛项 · 发现（逐条）

1. **依赖已解除（收正 §1.2）**：派单记「实施待压缩 v3 落地」——实况 = **v3 已落地**（提交 `c38176e0` + 文档收正 `c51e08e7`，生产口径 **92.86% / 93.65%**，`thinking:null` 保留）⇒ 实施**无前置阻塞**。
2. **上抛 · 提示词面（主 agent 笔）**：`EXPLORE_SUMMARY_PROMPT` 尾行 `Exploration log:` 在真身形态下指向空 ⇒ 摘要质量风险（先例 = 压缩线定稿「The conversation above…」整句替换 + 删 `Work log:` 行）；**非实施前置**（形态与 AC8 不依赖文本），但建议实施轮前定稿。
3. **上抛 · 需求档条目缺位（主 agent 笔 · 三方一致性缺口）**：`docs/core/requirements/CONTEXT-COMPACTION.md` §2.1 现只有压缩续写条目（派生 · 非用户原话），**无 #47 蒸馏条目** ⇒ 「批档 §2 = 设计档 AC = 需求档条目」三链缺一环。建议照先例补一条（判定句同 AC8：同会话回合命中 ≥0.9 时蒸馏轨迹 `cached / prompt ≥ 0.9`）。
4. **发现 · 量级收正**：批件记「~10–17K prompt / 次」；自采实测 = **1.5–11.7K**（18 次 · 区间端点 1478 / 11694）。
5. **发现 · 蒸馏机制**零用例覆盖**（全仓 `test/**` 无 `summarizeRunExplorations` / `[Exploration summary]` 断言）⇒ 本批新用例档为首个覆盖点。
6. **发现 · 同族零前缀调用（出批观察 · 本批不碰）**：`agent-tools/goal.mjs:65`（goal 独立评审——单条 user）· `auto-think.mjs:77`（分类——system+user 无 history）· `generate-title.mjs`（自有 fetch 通路）。
7. **发现 · `MEMORY.md` §D-MEM16「先例」引用**（`:493` 引 `explore-distill.mjs:13` 作 `safeSliceUTF16` 消费先例）随本批序列化面退役而**语义变旧**（该函数仍有 memory 族消费方 ⇒ 声明本体不假）——低危，建议随下次触碰该档时补一行注记。

### 2.8 设计评审轮 1 收正（eng-designer · 2026-09-18 · fix 轮）

**口径**：§3 轮次 1 发现表 **7 条**（🔴0 · 🟡3 · 🔵4）按**发现号逐条落位**——`Suggestion` 列 = 评审员处置建议、处置执行人 = 本席；父侧已裁定全部接受。**只定点改，无全量重勘**。逐条落位见下表（坐标为收正后现状）。

| # | 处置 | 落点 |
|---|---|---|
| 1 🟡 | 受影响文件表改**单一权威位**：设计档 §6.15 表 → 指针（指向本档 §2.3——任务书），设计档只留落点族 + 边界；`compress-form.mjs` 读数统一 **21 行**（§6.14 同批收正 + 新增「行数沿革」行：实施轮 as-of 20 行 ⇒ v2 收正扩写头注 +1 行 = 21 行） | 设计档 §6.15 受影响块 `:415-420` · §6.14 `:308-309` |
| 2 🟡 | 质量风险表「请求体量」行 + 退化面 1 补 **miss 面成本量级**（单次 miss = 前缀量级**全价**，频度 ≈18 次/半日 ⇒ 较修前 1.5–11.7K/次 放大约一个前缀量级）；替换原「成本面口径同 §6.14」转述（该项措辞是「成本略升」——量级不同，故单列） | 设计档 `:397` · `:404` |
| 3 🟡 | 退化面 1 增 **服务端接受度登记**（与 §6.14 取证项同源：真身 `role:"tool"` 消息 + **不带** `tools` 声明的那一格）；并明示该格**仅直调 / 测试可达**（生产两端接线后核调用点与 VSC 发射点均传 `extras`）⇒ **免真机取证**，离线面由新用例档覆盖；实施轮若实测真机可达（400）⇒ 上抛 | 设计档 `:405` |
| 4 🔵 | 用例 1 增**单源深等锁**：`deepEqual(body.messages, buildCompressMessages(history, lastBlockEnd, SYS, EXPLORE_SUMMARY_PROMPT))`（形态构造单源 D2 + 序列化面退役同锁）；同式先例 = `thincoder-core/test/compress-form.test.mjs:107`（本席读码核实）；AC1 机判方式同步 | 本档 §2.5 注 B `:102` · §2.4 AC1 `:78` |
| 5 🔵 | AC8 判定句补**判定格口径**：判定格取**中大型前缀会话**；结构上限 ≈ 前缀 /（前缀 + 未命中面），未命中面 = 尾部指令一条 + ≤255 块对齐残余；小前缀会话不作判定格，折算口径 `(prompt − 未命中面) / prompt` | 本档 §2.4 注 A `:88` · 设计档 `:411` |
| 6 🔵 | 受影响表加**尺寸档状态注**：核 `agent.mjs` 428 行内 `runAgent`（`:96`–`:428` ≈333 行）= **函数档 >300**（本批 +1 未跨界、无拆分义务，拆分预期前置）· VSC `agent.mjs` 485 行**距 500 硬限余 15 行**（+1 ⇒ 486 · 余 14） | 本档 §2.3 注 `:69-70` |
| 7 🔵 | 「端形不变」→「**端形向后兼容（增第 5 形参 `extras`）**」（设计档原表已随 #1 改指针，措辞落于指针块 `:418`）；**适配器头注端形签名行**（`thincoder-vscode/src/explore-distill.mjs:11`）同步 = **实施面代码 ⇒ 本轮回抛**（派单禁触）——已登记为 §2.3 #5 的 Δ（+≈3 ⇒ **+≈4**，交 coder 落地） | 本档 §2.3 #5 `:64` · 设计档 `:418` |

**机检读数（本席复跑 · `node scripts/doc-check.mjs` · cwd = `thincoder/`）**：判据项 5 · 扫描域 docs · 138 档；汇总 = 候选 13848 · 悬空 **252** · 注记豁免 24 · 拟新增 4 · 迁移期引文 1；行宽 **4 行**。
**本席两档零新增** ✓：设计档悬空 **12 条 = 改前同集**（逐条锚集合比对一致，仅行号位移 −5/−6）；设计档行宽 **1 行 `:303`（既有 433 字符，非本批）**；批档**不在机检扫描域**（manifest `anchors.exclude` = `_archive` / `batches`）⇒ 不列报。设计档收正后 **508 行**（`wc -l`）。

**复勘发现（登记 · 本批不认领）**：
1. `thincoder-core/test/compress-form.test.mjs` 实测 **285 行**（`wc -l`）vs 设计档 §6.14 `:311` 记 **213 行** ⇒ 存量读数漂移（他批 v2/v3 轮扩写所致）；按派单 ㈢「存量读数（他批漂移）本轮不做」⇒ 只登记不代改。
2. 机检**仓总量面不可归因**：本席两次复跑之间悬空 283 → 252（并行线在写——`DOC-SYSTEM.md` / `DOC-CODE-RECONCILE.md` 等档行号位移、`scripts/*.mjs` 族悬空退场）；本席判据 = 「本席两档零新增」。
3. 评审 #5 示例算术注：其所举「前缀 ≈2.3K + 指令 ≈0.2K ⇒ ≈82%」按给定值算得 ≈92%（≥0.9）；**结构论证仍成立**（未命中面占比更高的小前缀会话够不到 0.9）——本席按「结构上限公式」落笔，未复述示例数值。

**越界声明（无）**：本轮改动仅设计档 + 本批档两档（另 #7 适配器头注 = 回抛 coder 项）；未触提示词面 / 需求档 / 实施面代码 / `_archive/**` / 参照树。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

### 设计评审 · 蒸馏调用前缀复用（#47）· 发现表

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership | 🟡 | 受影响文件表逐行重复两处（设计档 `thincoder/docs/core/design/CONTEXT-COMPACTION.md:412-423` ↔ 批次档 `thincoder/docs/batches/2026-09-18-distill-prefix.md:56-69`），已现读数分叉：同档 §6.14 记 `compress-form.mjs` 「落盘 20 行」（`CONTEXT-COMPACTION.md:308`）vs §6.15 表「21 行」（`:417`）——本席实测（read 逐行）= 21 行 | 表保留单一权威位（任务书归批次档），设计档改指针；`compress-form.mjs` 读数统一为 21 行（§6.14 处同批收正） |
| 2 | Acceptance criteria | 🟡 | 未命中（无前缀可复用）面的成本量级未登记：退化面 1 仅写「仅命中折扣」（`CONTEXT-COMPACTION.md:403`）、质量风险表写「成本面口径同 §6.14」（`:396`），而 §6.14 对应措辞是「成本略升」（`:254`）——蒸馏线修前 prompt 仅 1.5–11.7K（`:358`）、频度 ≈18 次/半日（`:361`），miss ⇒ 前缀量级全价，与「略升」不同量级 | 退化面 1 / 质量风险表补一行 miss 面量级（对照修前 1.5–11.7K ⇒ 前缀量级 × ~18 次/半日），与命中收益并列陈述 |
| 3 | Feasibility | 🟡 | 退化面 1 断言「正确性不变」（`CONTEXT-COMPACTION.md:403`），但 `extras` 缺省格 = 真身 `role:"tool"` / `tool_calls` 消息 + **不带** `tools` 声明——同形态在压缩线被列为实施轮必得读数（`CONTEXT-COMPACTION.md:285-291`）；U6「替换仍落」（批次档 `:94`）只在 fetch 桩上成立 | 退化面 1 增一句与 §6.14 取证项同源的服务端接受度登记，或明示该格仅直调 / 测试可达 ⇒ 免真机取证 |
| 4 | Acceptance criteria | 🔵 | U1–U7（批次档 `:87-95`）未把「形态构造单源（D2）」纳入机判；压缩线先例 = 直接深等纯函数产物（`thincoder-core/test/compress-form.test.mjs:107`） | 用例 1 增同式断言 `deepEqual(body.messages, buildCompressMessages(history, lastBlockEnd, SYS, EXPLORE_SUMMARY_PROMPT))`——同时把序列化面退役锁进机判 |
| 5 | Acceptance criteria | 🔵 | AC8 判定句 `cached / prompt ≥ 0.9`（批次档 `:82`）未注前缀量级下限：按设计自身口径（未命中面 = 尾部指令 + ≤255 块对齐残余，`CONTEXT-COMPACTION.md:379`），小前缀会话结构性低于 0.9（前缀 ≈2.3K、指令 ≈0.2K ⇒ ≈82%），易被误读为机制未生效 | 判定句补「判定格取中大型前缀会话」注，或改按（prompt − 未命中面）/ prompt 口径判定 |
| 6 | Affected-file size annotations | 🔵 | 受影响表未登记尺寸档状态：`thincoder-core/agent.mjs`（428 行）内 `runAgent`（`:96`–`:428`）= ≈333 行单函数（函数档 >300）；`thincoder-vscode/src/agent.mjs` 485 行距 500 硬限仅 15 行。本批各 +1 ⇒ 未跨界、无拆分计划义务 | 在受影响表加一行状态注（函数档 >300 / 距硬限余量），把下次触碰的拆分预期前置 |
| 7 | Clarity | 🔵 | 「端形不变」（批次档 `:64` / 设计档 `:420`）与同格「+≈3 适配器透传 `extras`」并存——按透传链（发射点 → `fireEndOfRunDistill` → 适配器 → 核）适配器端形须增形参（向后兼容）；适配器头注以端形签名为契约叙述（`thincoder-vscode/src/explore-distill.mjs:11`），「端形不变」易读作签名零改 | 措辞改「端形向后兼容（增形参 `extras`）」，并同步适配器头注的端形签名行（`:11`） |

**已核实（本席逐处读码）**：修前坐标 `explore-distill.mjs:13`（`safeSliceUTF16` import）/ `:72-84`（序列化面）/ `:104-105`（`chat({...provider, thinking:null, reasoningEffort:null})` 单条 user）· `findExplorationBlocks` 的 `end` = 绝对下标且不含末尾（`explore-distill.mjs:50-70`：`end = j` 指向 tool 串之后）⇒ `slice(0, blocks.at(-1).end)` 含末块全部 tool 消息 · `buildCompressMessages(history, tailStart, systemPrompt, instruction)` 签名（`compress-form.mjs:15-21`）· 回合请求形态 `[{system}, ...history]` + `tools: toolSchemas`（`agent.mjs:230/240-241`）· 调用点 `:346` 与两处 `extras` 来源均在同作用域（`agent.mjs:125` / `thincoder-vscode/src/agent.mjs:109`）· v3 已落地（`context.mjs:401-403`：`{...agent.provider, thinking:null}` + `buildCompressMessages` + `tools: extras?.tools`、无 `tool_choice`、不覆盖 effort）· `safeSliceUTF16` 非末位消费（`memory/core.mjs:15,179`）· 新档免登记（`test/run.mjs:8` 单层 glob）· 现况行数 156 / 21 / 428 / 53 / 379 / 485 与 `wc -l` 口径一致。

**未复跑（无执行面，标 unverified）**：AC8 真机轨迹读数 · AC9 `scripts/doc-check.mjs` 读数 · 轨迹档与探针原始日志（不在仓内）。

**计数：🔴 0 · 🟡 3 · 🔵 4**

VERDICT: pass

### 轮次 2（评审子代理）

**设计评审 · 蒸馏前缀批（#47）· 复核轮（轮 2）· 发现表**

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Clarity | 🟡 | 轮 1 第 7 条收正引入的序数不实：批次档 `docs/batches/2026-09-18-distill-prefix.md:64`（§2.3 #5）写「端形向后兼容——**增第 5 形参** `extras`」，而 VSC 适配器现况端形已为 5 参（`thincoder-vscode/src/explore-distill.mjs:27` = `(history, runStartLen, provider, signal, agent = null)`；其头注契约行 `:11` 同记 5 参）⇒ 追加的 `extras` 只能是**第 6 位**；「第 5 形参」仅对核形成立（`thincoder-core/agent.mjs:346` 现调用 `(agent, callbacks, signal, depth)` ⇒ 第 5 位 = `extras`；设计档 `CONTEXT-COMPACTION.md:136` 签名同）。误读风险 = 实施轮把 `extras` 插第 5 位 ⇒ `agent` 被顶到第 6 位、`thincoder-vscode/src/agent/run-stages.mjs:262` 的 5 实参调用错位（适配器载体面失载 ⇒ VSC 端静默退到退化面；而退化面「仅直调 / 测试可达 ⇒ 免真机取证」的前提正是该链路成立） | 措辞标明「形」的归属：核形 = 第 5 位 `extras`（`agent.mjs:346` 追加第 5 实参）；端形 = **在 `agent` 之后追加第 6 位** `extras`（`agent` 仍居第 5、`run-stages.mjs:262` 旧实参序不变）——或去序数，只写「追加形参 `extras`」 |

**轮 1 七条落位复核（逐条读档 + 读码核实 · 无 🔴）**：① 设计档 `:415` 受影响表 → 指针（单一权威位 = 批次档 §2.3）+ `:417` 只留落点族 + `:420` 边界，§6.14 `:308-309` 读数统一 **21 行** + 行数沿革行（实施轮 20 ⇒ v2 头注 +1 = 21）——两档读数实测一致（`compress-form.mjs` 逐行读完）✓ ② 设计档 `:397` 质量风险表「请求体量」行 + `:404` 退化面 1 均补 miss 面量级（前缀量级全价 × ≈18 次/半日），原「成本面口径同 §6.14」转述已移除 ✓ ③ 设计档 `:405` 退化面 1 服务端接受度登记 + 「仅直调 / 测试可达」+ 免真机取证 + 真机 400 上抛 ✓，前提链路核实成立（核 `agent.mjs:125` 作用域含 `systemPrompt` / `toolSchemas` ⇒ `:346` 可透传；VSC `agent.mjs:109` 同 ⇒ `:372` 可透传；`run-stages.mjs:260-262` = 唯一发射点）✓ ④ 批次档 `:102` 注 B 单源深等锁 + `:78` AC1 同步 ✓；先例坐标 `thincoder-core/test/compress-form.test.mjs:107` 逐字核实（= `assert.deepEqual(body.messages, buildCompressMessages(history, 24, SYS, SUMMARIZE_PROMPT), …)`）✓ ⑤ 批次档 `:88` 注 A + 设计档 `:411` 判定格口径 ✓（结构上限公式 = 前缀 /（前缀 + 未命中面）；未复述被证伪的示例数值——复勘 3 披露准确：按其所举 2.3K / 0.2K 算得 92% ≥ 0.9）✓ ⑥ 批次档 `:69-70` 尺寸档状态注 ✓；读数核实 = 核 `agent.mjs` 428 行（`runAgent` `:96`–`:428` = 333 行）、VSC `agent.mjs` 485 行（+1 ⇒ 486 · 余 14）✓ ⑦ 措辞改「端形向后兼容」落位（设计档 `:418` 无序号 / 批次档 `:64` 含序号）+ 头注 `:11` 交 coder（Δ +≈3 ⇒ +≈4）✓——序数不实见上表 #1。

**尺寸档 / 读数抽检（criterion 8）**：核 `explore-distill.mjs` 156 · `compress-form.mjs` 21 · 核 `agent.mjs` 428 · VSC 适配器 53 · VSC `agent/run-stages.mjs` 379 · VSC `agent.mjs` 485 · 设计档 508——逐条与档内读数一致 ✓；新档 `thincoder-core/test/explore-distill-form.test.mjs` 在 `test/` 下不存在（无 `*distill*`）⇒「新档」属实 ✓；`test/run.mjs:29-33` 单层 glob 反查判定属实 ⇒ 新档免登记 ✓。

**批准依据**：用户 2026-09-18 04:46「都开了吧」= 全批授权；评审轮 pass + 修正轮 7 条 + 复核轮 PASS（余 1 🟡 已父侧直改）。

## §5 实现（eng-coder）

**落档说明**：本段 = **fix 轮补投**——initial 轮 `batch_segment` 因档内缺 `## §5` 骨架被结构性拒（本席未自建标题、未改档，已如实披露）；本轮父侧补骨架后按原报告核心补投，正文 ≡ initial 轮交付报告核心。**本 fix 轮零代码 / 零文档改动**。

**轮次与终态**：initial 实施轮（eng-coder）· 内部发散审计 1 轮 = **零发散（clean）** · 代码评审 1 轮 = **VERDICT pass**（无 🔴、无必改 🟡） · **fix round = 0** · **终态 = clean**。

**一、先红 / 后绿（8 例）**
- 新档 `thincoder-core/test/explore-distill-form.test.mjs`（257 行）：改前源码实跑 = **6 红 2 绿**（用例 1–6 红；用例 7 失败静默 / 用例 8 替换面回归 = 回归例先绿）→ 改后 = **8/8 绿**。
- 用例 1 含**单源深等锁**：`deepEqual(body.messages, buildCompressMessages(history, lastBlockEnd, SYS, EXPLORE_SUMMARY_PROMPT))`（先例 `thincoder-core/test/compress-form.test.mjs:107`）。
- U1–U7 逐条落格（+ AC6 替换面回归 = 用例 8）：形态 / 前缀性质 / 声明面 / effort 同源两态 / 切点覆盖 / 退化面 / 失败静默——逐条有断言。

**二、AC1–AC7 逐条对照（+ AC8 unverified）**

| AC | 对照读数 |
|---|---|
| AC1 形态 | ✅ 用例 1：`[system(=extras.systemPrompt)] + history[0, lastBlockEnd) 原样 + 指令`；末条 `role=user` 且 `content === EXPLORE_SUMMARY_PROMPT`；单源深等锁同断言 |
| AC2 前缀性质 | ✅ 用例 2：请求去末条 = `[{system}, ...history]` 同长前缀（逐元素深等） |
| AC3 声明面 | ✅ 用例 3：`body.tools` 与回合请求出站值逐字节同值（深等）、无 `tool_choice`（对照面亦不发） |
| AC4 参数同源 | ✅ 用例 4：两态——`reasoningEffort:"max"` ⇒ `body.reasoning_effort="max"`；未配置 ⇒ 缺省；`body.thinking` 恒不发 |
| AC5 覆盖边界 | ✅ 用例 5：末块（并行 ×2）tool 消息全含；末块之后的尾部消息不进请求 |
| AC6 替换面回归 | ✅ 用例 8：note 插首块位 / 块全丢（零 tool、零 tool_calls 残留）/ 非块保留 / `_fullHistory` 引用与内容不触 |
| AC7 失败静默 | ✅ 用例 7：抛错（既有重试语义 1+MAX_RETRIES 不变）与空 content 双态 ⇒ 无收缩返回、`history` 同一引用零改写、`onDistilled` 零触发 |
| AC8 真机读数 | ⚠️ **unverified**——`"stage":"distill"` 轨迹行 `cached / prompt ≥ 0.9`：本席无真机会话面，**未复跑、未编造**；对照基线 = 设计轮自采 18/18 = 0%；取证口径 = 本档 §2.4 注 A（中大型前缀会话） |

**三、改动清单（7 档 · file:line + 行数前后 · `wc -l` 口径）**

| # | 文件 | 行数 | 落点 |
|---|---|---|---|
| 1 | `thincoder-core/explore-distill.mjs` | 156 → **152**（净 −4；设计预测 ≈−6） | 头注 `:2-11` 收正 · import `:15` 换 `buildCompressMessages`（删 `safeSliceUTF16`）· 序列化面旧 `:72-84` 整体退役 · 切点 `:89`（`blocks.at(-1).end`）· 形态 `:98-100` · 签名 `:141`（第 5 位 `extras`） |
| 2 | `thincoder-core/compress-form.mjs` | 21 → **24**（+3 = 预测） | 头注 `:6-8` 声明第二消费点（函数体 `:18-24` 零改） |
| 3 | `thincoder-core/agent.mjs` | 428 → **429**（+1 = 预测） | `:345` 注释 + `:346-347` 第 5 实参 `{ systemPrompt, tools: toolSchemas }`（作用域 `:125`） |
| 4 | `thincoder-core/test/explore-distill-form.test.mjs` | 新档 **257** 行（预测 ≈200 · ≤300 软线 ✓） | 8 例 + fetch 桩 + 夹具 |
| 5 | `thincoder-vscode/src/explore-distill.mjs` | 53 → **55**（+2；设计预测 +≈4） | 头注 `:7` / `:11-14` 两形签名 + 序数 · `:29` 第 6 形参 · `:39` 核调第 5 位透传 |
| 6 | `thincoder-vscode/src/agent/run-stages.mjs` | 379 → **380**（+1 = 预测） | `:258` JSDoc + `:261` 形参 + `:263` 透传 |
| 7 | `thincoder-vscode/src/agent.mjs` | 485 → **486**（+1 = 预测） | `:372-373` 发射点随带 extras（作用域 `:109`） |

- **序数纪律**：核形第 5 位 = `extras`（`agent.mjs:346`）；端形在 `agent`（第 5）**之后追加第 6 位**（适配器 `:29`、`run-stages.mjs:261/263` 旧实参序不变）；头注两端签名行均同步。
- **禁触面零触碰**：提示词文本 / `provider/**` / 数据面 / `context.mjs` / `ledger-cmd.mjs` / `docs/**` / `_archive/**` / 参照树；审计确认**无表外改动**。
- **尺寸与收集面**：429 / 486 / 380 三条上限一格未越；新档 257 行（<300 软线 ⇒ **免登记**）；`test/run.mjs:29-34` 单层 glob 收集域内（实跑 8 例），未加任何清单。

**四、三包读数 + 机检读数**
- `thincoder-core npm test` → **tests 342 / pass 342 / fail 0**（新档 8 例在收集域内实跑 ✓）
- `thincoder-cli npm test` → **tests 676 / pass 676 / fail 0**；`npm run lint` ✓
- `thincoder-vscode npm test` → **tests 600 / pass 600 / fail 0**（终态复跑）；`npm run lint` ✓
- `node scripts/doc-check.mjs`（cwd = `thincoder/`）→ 汇总 = 候选 13941 · 悬空 **70** · 注记豁免 39 · 拟新增 4 · 迁移期引文 203；行宽 **4 行**（均既有）。**本批 7 档零命中 ⇒ 按档归属零新增**（改前设计轮读数 悬空 252 → 现 70 = 他批退场，非本批）。

**五、审计与代码评审（会话内跑完）**
- **发散审计（explore 子代理 · 1 轮 · 终态 clean）**：无 PARTIAL / 无静默简化 / 无表外改动；①–⑨ 逐条 ✓（形态 / 声明面 / 透传链无错位 / 退化面 / 替换面 / 退役彻底性 / 尺寸 / 文档漂移）。
- **代码评审（advisor · 1 轮 · VERDICT: pass）**：5 项发现（🟡3 · 🔵2，无 🔴、无必改 🟡）——① 轨迹体积副作用未在 §6.15 登记（🟡 登记项 → 父侧笔）② 提示词位置/文本不匹配的上抛未闭环（🟡 主 agent 内容权；设计明示非实施前置）③ >300 行尺寸档 advisory（既有裁定，不重开）④ 退化面 4 无离线用例（🔵 不采纳：性质由构造保证；§2.5 用例表 = 契约，禁自创）⑤ AC8 / AC9 unverified（AC9 本席已补跑；AC8 明示 unverified）。
- **fix round = 0**（审计 / 评审均 pass，无修正轮）。

**六、决策透明表（D1–D4）**

| # | 决策 | 理由 |
|---|---|---|
| D1 | 失败返回值维持既有 `undefined` | 不因字面改行为（`if (!next) return` 既有语义） |
| D2 | 核档头注 +2 行 ⇒ 净 −4（非预测 −6） | 头注收正的信息面显式落笔（单源声明随批） |
| D3 | 适配器原位替换不注水（+2，非预测 +≈4） | 改动面以正确性为准，不凑设计估算 |
| D4 | 新档 257 行（8 例含桩 / 夹具 / 回归） | 覆盖面 = §2.4 AC + §2.5 用例表逐条，非凑行数 |

**七、未复跑项（unverified · 明示）**
- **AC8 真机轨迹读数**（`~/.thincoder/traces/<date>/*.jsonl` 的 `stage:"distill"` 行 `cached / prompt`）——无真机会话面，**未复跑、未编造**；建议父侧按 §2.4 注 A 口径（中大型前缀会话）取证。
- 审计侧的独立复跑（其无 shell 面）：未跑 `wc -l`、未跑测试——其读数与本席实测互证一致。

**八、文档漂移登记（不代改 · docs 属本批禁触域）**
- `SEND-STALL-DISTILL.md:32/:35/:86/:89` 坐标（含 VSC 侧 `:154` 对 55 行档 · 既有漂移）
- 设计档 `:169`（`explore-distill.mjs:21` ⇒ 现 **:23**）
- 设计档 `:136` H1 签名行未标「核形」（端形第 6 位易误读）
- `AGENT-LOOP-SUBAGENT.md:809`（`:148` ⇒ 现 `:144`）
- `AGENT-LOOP.md:32`（截断面已随本批退役）
- `MEMORY.md:493`（§2.7-7 已预登记）
- 本档 §2.3 三行 Δ 与实测分叉（核 −4 vs 预测 −6；适配器 +2 vs +≈4；新档 257 vs ≈200）
- 本档 §2.4 AC6 行「用例 6」应为「用例 8」（用例 6 实为退化面）

（以上漂移均为父侧 / 设计席的笔——本席只报不改。）

## §6 验证与收口（父代理）

**收口（2026-09-18）**：

- **验收**：新档 8 例——改前 **6 红 2 绿** → 改后 **8/8**（用例 1 = 单源深等锁 `deepEqual(body.messages, buildCompressMessages(...))`，先例 `compress-form.test.mjs:107`）；AC1–AC7 逐条对照· **AC8（真机轨迹读数）= 实施轮无真机会话面 ⇒ 如实标 `unverified`（未复跑、未编造）**——取证口径 = §2.5 注 A（中大型前缀会话 · `cached / prompt ≥ 0.9`；对照基线 = 设计轮自采 18/18 = 0%）。
- **读数**：三包全量绿（core **342** · cli **676** · vsc **600**）· 机检按档归属零新增 · **尺寸三上限未越**（核 `agent.mjs` **429** ≤429 · VSC `agent.mjs` **486** ≤486 · VSC `run-stages.mjs` **380** ≤380）。
- **提交**：`0c239c0`（7 档 · +295/−34）。
- **终态**：审计 1 轮零发散 · 代码评审 1 轮 pass（🟡3 · 🔵2，无 🔴、无必改）· fix 0 · **clean** · §5 已写入（4934 字符）。
- **残留（登记/路由）**：① **文档漂移 7 处**（`SEND-STALL-DISTILL.md:32/:35/:86/:89`（含 VSC `:154`）· 设计档 `:169`（`:21` ⇒ 现 **`:23`**）· 设计档 `:136` H1 签名行未标「核形」· `AGENT-LOOP-SUBAGENT.md:809`（`:148` ⇒ **`:144`**）· `AGENT-LOOP.md:32`（截断面已随本批退役）· `MEMORY.md:493`（§2.7-7 已预登记））⇒ **待收正轮** ② **批档自报分叉**：§2.3 三行 Δ（核 **−4** vs 预测 −6 · 适配器 **+2** vs +≈4 · 新档 **257** vs ≈200）与 §2.4 AC6 行「用例 6」应为「**用例 8**」——**实测值以 §5 为准**（§5 已落 **152 / 24 / 429 / 257 / 55 / 380 / 486**）③ AC8 真机取证待有真机会话时补。
- **三账**：台账 **#47** 已核销；批档冻结；收口日期 2026-09-18。

**未复跑（标 unverified）**：AC8 真机轨迹读数 · §2.8 的 `scripts/doc-check.mjs` 机检读数（悬空 252 / 行宽 4 行 / 汇总 13848）· `wc -l` 本身（无 shell 面——本席按 read 行号口径核对，与本轮各读数逐条一致；尾随空行口径不可离线判定）。

**域外登记（无严重级 · 不参与本轮判据）**：批次档 `:106` / 设计档 `:413` 的先例范围引用 `thincoder-core/test/compress-form.test.mjs:114-151` 未落在 fetch 桩定义处（桩 = `:64-78`，`:114-151` 为用例 1 尾 + 用例 2–4 体）——该引用不属轮 1 七条目标，仅登记。

**计数：🔴 0 · 🟡 1 · 🔵 0**

VERDICT: pass
