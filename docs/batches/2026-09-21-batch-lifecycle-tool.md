# 批次档生命周期工具化（BATCH-LIFECYCLE-TOOL）· 批次记录（2026-09-21）

> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-21 03:13 · 来源 = 用户 03:10 提案「批次档创建工具化」+ 03:11 精化「并进一个工具用不同操作区分」+ 03:12 定名「batch」+ 03:13 批准「可以啊」。
> 台账 = #25（需求池 · `ENGINEERING-MODE-V2-SPEC-BATCH-SEGMENT` 板块 · 归批）。
> 前情 = 无（独立批）。

## §1 讨论（主 agent）

**状态行**：✅ 已收口 2026-09-21（实施验证通过 · core 494/494 独立复测 · 台账 #25 已核销；记录冻结）

**痛点实证（2026-09-21 · LEDGER-EXECUTOR 批三次失败同根因）**：

| 失败 | 根因 |
|---|---|
| 主代理手搓 §1（grep 参照 SESSION-CLAIM 批模仿）→ 骨架缺 §2–§6 | 创建走裸 edit（无门），校验走 batch_segment（有门）——纪律只覆盖后半截 |
| eng-designer 状态行被拒（缺「进行中/已收口」关键字） | 关键字只活在 gate 代码（`batch-segment.mjs:107-108`）里，建档时不可见 |
| eng-designer 骨架缺失被拒（fail-closed 视同冻结） | gate 只判「append 合不合规」，不产骨架——校验有工具、创建靠手感 |

形态漂移实据：`TWO-REPO-MERGE.md` 六段骨架头常驻 vs 本轮 LEDGER-EXECUTOR 批仅预写 §1——同一仓两种形态。教训：**靠记忆与模仿的约定会漂移，进工具的约定不会**（与 MULTI-INSTANCE-COLLAB 机制化同构）。

**方案（讨论收口 · 用户三轮定形）**：`batch_segment` 改名扩权为 **`batch`**——action 枚举单工具管批次档全生命周期：

- **create**（仅主代理）：六段骨架一次预齐——档头 boilerplate（append-only 一段一作者句）+ `## §N` 段头 + 各段模板子标题 + **gate 合法关键字占位状态行** + 「前情 = 」指针行 + 编制行模板；路径冲突 / 重复建档 fail-closed。
- **append**（现语义迁移）：身份绑段（designer=§2 / 评审=§3 / coder=§5 / 主代理=§1/§4/§6）· append-only · 凭证剥除——既有 §2.20 判定面零语义变。
- **status**（段属主）：状态行在合法关键字值间流转（单源 = 与 gate 判定同处定义）。
- **close**（仅主代理）：状态行置「已收口 <date>」+ 整档冻结。

**红线**：内容不模板化——`append` 载荷自由正文，批次档是记录不是表单；骨架模板在代码里单源一份，工具占位文案与 gate 关键字检查同源。

**迁移约束**：工具改名牵动 prompt 面（persona / 工程模式提示词多处点名 batch_segment）+ gate 代码 + 测试同批改；**活实例混版窗口**（CLI 实例在飞两批）⇒ `batch_segment` 留过渡别名（映射 append，撤除时机 = 在飞批收口即撤或 TTL——设计轮定夺）。

**边界（不做什么）**：不扩展批次档六段结构本身（段数 / 段序 / 每段职责零变——本批改的是「怎么写进去」，不是「写什么」）；不做批次档自动生成内容（讨论记录 / 批准语仍是主代理手写）；不动 §2.20 既有判定语义（只搬入口）；模板不外置配置文件（代码单源）。

### 1.0 授权口径

用户 03:13「可以啊」= 批准本批立项与设计排程；04:08「自动跑完吧」= **代点火 + 代批准授权**（设计评审自动发射 · fix 轮收敛后自动进 §4 · eng-coder 实施自动派发；§4 批准语由主代理依授权代录并注明本节）。**自缚条件**：① 复评若再出 🔴 ⇒ 停下回向用户汇报，不得循环自动修；② 实施验证不过（测试红 / AC 不满足）⇒ 停下上抛；③ 收口提交仍走 path-limited + 工作树核对后才落。

## §2 批次任务与设计（eng-designer）

**状态行**：📝 设计进行中（批次档生命周期工具化 · eng-designer · 2026-09-21 fix 轮——承 §3 轮次 1 发现 #1–#13 父侧裁定逐条落档）

**本批条目（覆盖）**：

| # | 条目 | 覆盖状态 |
|---|---|---|
| T1 | 单工具 `batch`：action 枚举 `create` / `append` / `status` / `close`，管批次档全生命周期 | ✅ 本批设计覆盖 |
| T2 | `create`（仅主代理）：六段骨架一次预齐（档头 boilerplate + `## §N` 段头 × 6 + 各段模板子标题 + §1 段内合法关键字占位状态行 + 前情指针行 + 编制行），路径冲突 / 重复建档 fail-closed | ✅ 本批设计覆盖（有路径参数——见关键决策 KD-1） |
| T3 | `append`：现 `batch_segment` 语义原样迁移（身份绑段 / append-only / 来源戳 / 凭证剥除 / 超量拒收 / 冻结拒写），判定面零语义变 | ✅ 本批设计覆盖 |
| T4 | `status`（段属主）：改**自己段内**状态行，值限合法关键字集（与 gate 判定同源）；冻结真值仍 = §1 | ✅ 本批设计覆盖 |
| T5 | `close`（仅主代理）：§1 状态行置「已收口 <日期>」+ 整档冻结（append / status 后续皆拒） | ✅ 本批设计覆盖 |
| T6 | 过渡别名 `batch_segment` → `append`，撤除时机 = 在飞批收口（判定句见「上抛项」②） | ✅ 本批设计覆盖 |
| T7 | prompt 面 7 处 + gate 消费方同批改名（batch_segment → batch/append），spec 权威档收口为单源（BATCH-RECORD.md §4） | ✅ 本批设计覆盖 |
| T8 | #84 记账缝（`configureBatchSegment` onWrite 注入）保持等价面 | ✅ 本批设计覆盖 |

**设计档落点**：

- **结构权威 = `docs/core/design/BATCH-RECORD.md`**（§4 工具契约 / §4.10 骨架 / §5.1 生命周期 L1–L7 / §7 决策 D-BR1–16 / 变更记录）——本设计全部落在该档：§4 扩为「生命周期工具 `batch`」契约（action 枚举 + create/status/close 三节 + §4.9/§4.10 改指骨架工具化），§7 增 D-BR17–D-BR20，变更记录一行。
- **理由（对派单偏差的更正）**：派单提到规格权威 = ENGINEERING-MODE-V2.md §2.20——实勘该档无 §2.20（grep 证实）；`ENGINEERING-MODE-V2-MODULE-BATCH-SEGMENT.md` 模块档**已归档**（BATCH-RECORD.md:4 明示其为结构权威）。真实权威链 = `BATCH-RECORD.md`（当前）← 模块档（归档）← ENGINEERING-MODE-V2.md §2.3 E2（六段表，§2.20 表述已死于早轮改版）。故本设计落 BATCH-RECORD.md；ENGINEERING-MODE-V2.md 仅两处收口点名（:175-180 六段写入手段表 + :237 机械面表——`batch_segment` 两处点名改 `batch` append）。
- **不做**：`docs/core/requirements/` 面（需求档 = 主代理笔）、归档模块档回改、VSC 镜像仓（VSC 经核 `agent-tools.mjs` import，核改后端面随动——同批唯一约束 = #84 缝契约不破坏，VSC 侧同步归 VSC 轮）。

**机制设计**：

- **工具形态**：`batch` 单工具，`action` 枚举 + 各 action 专属参数；家法 = `subagent` / `memory` / `git` / `task` 形态（action 分发，不并列多工具）。挂载面零变：eng-coder = `[advisor, verify, batch, subagent]`、eng-designer = `[batch, subagent]`（`thincoder-core/agent/family-tools.mjs:167-168`）；评审实例键通道不变（`thincoder-core/advisor/loop.mjs:45` `batchSegmentTool(batchDoc, { review: true })` → `batchTool(batchDoc, { review: true })`）；主 agent depth-0 同挂 `batch`（D-BR18，修正沿革见 §2.1）。
- **`create`（仅主代理）**：
  - 参数：`path`（相对基底取 `resolveBatchDocPath` 声明面解析（manifest `docRoot.batches`——轮 2 评审发现 #2，不写死字面路径）的档名或绝对路径）、`topic`、`date`（缺省今天）、`prev`（前情指针，可缺省「无」）。
  - **有路径参数 = 故意破「无路径参数」规则**（D-BR17）：batch_segment 的「无路径」是给**子代理**的约束（语法上写不到别处）；主代理本就持普通文档写权，create 绑主代理身份后路径面无放大。身份判据与 SEGMENT_BY_ROLE 同型（eng 子代理调 create ⇒ throw「create is main-agent-only」）。
  - 目标已存在 / 路径不可写 ⇒ fail-closed throw。
  - 骨架模板**代码单源**：boilerplate（六段 append-only 一段一作者句 + 编制行）+ `## §1..§6` 段头（含职责署名）+ 各段模板子标题（本批条目 / 设计档落点 / 机制设计 / 受影响文件 / 验收对照 / 关键决策 / 上抛项 等占位）+ **§1 段内占位状态行含「进行中」关键字**（建批即过 gate——痛点 ② 直除）+ 「前情 = 」指针行。
  - create 后**同轮建台账条目**（主代理既有义务，工具不代）。
- **`append`（现语义迁移）**：段白名单（designer=§2 / 评审=§3 / coder=§5）/ append-only / `### 轮次 N` 来源戳（仅 §3）/ 凭证剥除（CRED_RE）/ MAX_TEXT_CHARS=20000 超量拒 / 越段拒 / 骨架行冲突拒 / 状态行缺失或「已收口」冻结拒——判定函数逐一复用，零语义变。
- **`status`（段属主）**：参数 `value`（合法关键字集值）；写**自己段内** `**状态行**：` 行（不存在则段首插一行）。合法关键字集 = **STATUS_WORDS 分段词表常量单源**（fix 轮 #1——gate 判定词表 `batch-segment.mjs:97-110` 提为常量的 §1 项：`{进行中, 已收口}`，gate 只消费 §1 项、单源仍成立；§2/§3/§5 段内各带生命周期词表）。冻结真值仍 = §1 段内行——子代理写自己段状态行**不改冻结态**（gate 判定域不变：只读 §1）。
- **`close`（仅主代理）**：§1 状态行改「已收口 <YYYY-MM-DD>」；后续 append / status 对该档全拒（冻结语义唯一真值 = §1 行——与现 gate 一致，零语义变）。主代理档内无段绑定 ⇒ close 无段白名单问题。
- **别名过渡**：`batch_segment` 以别名形态继续注册（挂载点、绑定、描述文案不变），调用 ⇒ 分发到 append。撤除判据见「上抛项」②。

**受影响文件与测试面**：

| 文件 | 现行数 | 模块 | 变更 | 增量预估 |
|---|---|---|---|---|
| `thincoder-core/agent-tools/batch-segment.mjs` | 266 | M3 | **改名 `batch.mjs`** + action 分发重构 + create/status/close 三节 + 骨架模板单源 + 分段关键字常量单源 + 别名导出 + depth-0 可选 `path`（#2） | +170 ~ +200（→ ~440-465——fix 轮 #8：**预估即触发拆分评估**，落 `batch-skeleton.mjs` 模板常量档（两档各 ≤300）或实施轮记录保留单档理由；计划登记 KD-4） |
| `thincoder-core/agent-tools.mjs` | 24 | M3 | :17 导出改名 + 别名导出 | ±1 |
| `thincoder-core/agent/family-tools.mjs` | 182 | M3 | :24/:28 注释与解构名 + :160-168 挂载注释与调用点（batchSegmentTool(batchDoc) → batchTool(batchDoc)） | ±2 |
| `thincoder-core/advisor/loop.mjs` | 289 | M3 | :14 import + :45 挂载行 | ±1 |
| `thincoder-core/advisor/run.mjs` | 191 | M3 | :13 import `batchDocForReview`（路径不变——同文件改名仅段名；若文件改名则 import 路径同步） | ±1 |
| `thincoder-core/agent-tools/advisor.mjs` | 281 | M3 | :11 import `resolveBatchDocPath` + :89/:177 调用点（符号名不变） | ±1 |
| `thincoder-core/agent-tools/subagent-spawn.mjs` | 479 | M3 | **零改**（`child._batchDoc` 绑定 :249-:394 面不动——绑定是参数传递，非工具名） | 0 |
| prompt 面 7 处（落地档 `thincoder-core/prompts/`） | — | M9 | `advisor-design.md:29, advisor-round2.md:30, advisor-round3.md:26, common.md:156, persona-eng-coder.md:39, persona-eng-designer.md:47, persona-engineering.md:73` 逐处 `batch_segment` → `batch`/`append` 语式收正（过渡期文案注「batch_segment 为过渡别名」） | ±7 行 |
| prompt 模板面 7 处（中文审核面 `docs/core/design/prompts/`——M9 双源） | — | M9 | grep 实勘 7 处命中（fix 轮 #3）：`advisor-design.md:46, advisor-round2.md:41, advisor-round3.md:38, common.md:118, persona-eng-coder.md:39, persona-eng-designer.md:47, persona-engineering.md:71`——随落地档同批收正，保双源同步（重生成不回退改名） | ±7 行 |
| `thincoder-core/test/batch-segment.test.mjs` | 239 | M3 | **改名 `batch.test.mjs`** + import/用例面随批改 + 新增 create/status/close 用例（用例表词值同步——C4 对齐分段词表，fix 轮 #1） | +80 ~ +110（→ 318-348——fix 轮 #8 结论：**保留单档**，既有 T1–T10 与新用例共享 fixtures、拆档 = 复制脚手架；越 300 咨询档登记在案，硬顶 500 内） |
| `thincoder-core/test/batch-segment-manifest.test.mjs` | 77 | M3 | :13 import + 双基底用例断言面（符号名） | ±5 |
| `thincoder-core/test/family-tools.test.mjs` | 156 | M3 | :33/:38 expect 数组 `"batch_segment"` → `"batch"` | ±2 |
| `thincoder-core/test/advisor-consult-merge.test.mjs` | 176 | M3 | :70-71 `byName.has("batch_segment")` → `"batch"` | ±2 |
| `thincoder-core/test/docroot-multiroot.test.mjs` | 178 | M3 | :19 import `resolveBatchDocPath` 路径随改名（符号名不变） | ±1 |
| `docs/core/design/BATCH-RECORD.md` | 372 | M3 / M9 | fix 轮 #10 刷新；§4 扩为生命周期契约 + §4.10 骨架改指工具 + 段头映射注（#11）+ §5.1 L4 收正 + §7 增 D-BR17–21 + §4.9 符号名主名（#9）+ §4.12 分段词表（#1）+ depth-0 path 参数面（#2）+ 撤除判据状态行首行扫描（#5）+ D-BR4 就地改写（#6）+ 参数面（#12）+ 变更记录两行 + §5 双源行 prompt 命中 | +70 ~ +95 |
| `docs/core/design/ENGINEERING-MODE-V2.md` | 559 | M3 | fix 轮 #10 刷新；:175-180 六段表写入手段列 + :237 机械面表 M3 行收正（`batch` 点名）+ 接线表 M3 行改名与符号名映射注（#9） | ±4 |

（行数 = 2026-09-21 node 实测实施轮收口再刷新（BATCH-RECORD.md 387 · ENGINEERING-MODE-V2.md 558），`wc -l` 在本机 cmd 下乱码已弃用。fix 轮 #4——L7 复核：模块列去重 = M3 + M9 = **2**，≤2 达标；用例表词值修正后 AC 表 / 用例表回指一致。）

**验收对照**（逐条回指条目；每条机判）：

| AC | 判据 | 回指 |
|---|---|---|
| AC-1 | `node --test` 全绿（含改名后 `batch.test.mjs` 新用例族） | T1 |
| AC-2 | 动态 import 键集断言：`batchTool` / `batchSegmentTool`（别名）双导出在场；`batchSegmentTool.name === "batch_segment"` 且其 execute ⇒ append 分发 | T1/T6 |
| AC-3 | create 正例：主代理身份调 create → 六段骨架 + §1 段内含「进行中」占位状态行 + 前情指针 + 编制行，落盘路径与参数一致 | T2 |
| AC-4 | create 负例 ×3：eng-designer 身份调 create → throw；目标已存在 → throw；非法路径（非 `.md` 后缀 / 解析后越出批次档基底——fix 轮 #12 判据）→ throw | T2 |
| AC-5 | append 零回归：`batch.test.mjs` 既有用例（T1–T10：六段骨架字节不变 / §3 轮次戳 / 凭证剥除 / 超量拒 / 越段拒 / 冻结拒 / §2 内「状态行」字样不参与冻结 / 状态行缺失 fail-closed）**行为断言零改**（符号名 / import 随批改——fix 轮 #13 措辞收正）全绿 | T3 |
| AC-6 | status 正例：eng-designer 调 status 改 §2 段内状态行 → 落盘；合法关键字集 = STATUS_WORDS 分段词表常量——§1 项 = gate 词表，gate 判定只消费 §1 项（grep 单源断言：无第二份独立词表；骨架占位行由 STATUS_WORDS §1 项引用生成，非独立字面——轮 2 #8 收正） | T4 |
| AC-7 | status 负例 ×2：eng-designer 对 §1 调 status → throw；value 不在合法关键字集 → throw | T4 |
| AC-8 | close 正例：主代理 close → §1 行改「已收口 <日期>」；子代理/评审后续 append / status → throw（冻结） | T5 |
| AC-9 | 别名等价：`batch_segment({segment:"§2", text})` 调用 → append 语义（同段写入、同拒面） | T6 |
| AC-10 | prompt 面 grep：`thincoder-core/prompts/` 下 `batch_segment` 字面仅存于过渡别名注记（非调用指引位）；模板面 `docs/core/design/prompts/` 同判——双源同步（fix 轮 #3） | T7 |
| AC-11 | #84 缝：`configureBatchSegment({onWrite})` 注入行为等价（VSC recent_changes / verify / advisor 默认范围消费不变）——既有注入用例零改全绿 | T8 |
| AC-12 | 权威单源：`docs/core/design/BATCH-RECORD.md` 为 `batch` 生命周期契约唯一权威；`ENGINEERING-MODE-V2.md` 收口点名零处残留 `batch_segment` 活体调用语式（别名注记除外）；`docs/core/requirements/` 面**零改**（需求笔归主代理——本设计不改写需求） | T7 |

**关键决策**：

- **KD-1 create 有路径参数**（破「无路径参数」规则）——「无路径」约束的对象是子代理（防越界写）；主代理持普通文档写权，路径面无放大，且 create 语义本就要求指定新档位置（无路径 = 无法表达）。绑定主代理身份后语法约束回归其本义。
- **KD-2 status 状态行按段分布**——每段一段内状态行（§2 实档即含独立状态行），段属主只改自己段；gate 冻结判定域（§1）不变 ⇒ 零语义变。
- **KD-3 合法关键字集单源**——STATUS_WORDS 分段词表一份常量：§1 项 = gate 词表（gate 只消费 §1 项），§2/§3/§5 各带段内生命周期词表（fix 轮 #1）；防第二份词表漂移（本批痛点 ② 的根因面）。
- **KD-4 骨架模板代码单源**——create 模板在 `batch.mjs` 内一份常量；**拆分触发线 = 300 咨询档**（fix 轮 #8：预估 440-465 即触发 proactive 处置——落 `batch-skeleton.mjs` 模板常量档（主档 + 模板档各 ≤300），或实施轮显式记录保留单档理由；500 硬顶非触发线）；**不做模板外置配置文件**（§1 边界红线）。
- **KD-5 别名撤除判据 = 在飞批收口（grep 机判），非 TTL**——TTL 任意、不可核；在飞批收口 = 混版窗口语义闭合的地面真值。候选否决：立即撤（打挂在飞批 §3 自写通道——风险实存，CORE-UNIFICATION 批先例）。
- **KD-6 权威落 BATCH-RECORD.md 而非 ENGINEERING-MODE-V2.md**——结构权威归位（该档 ：4 已明示），消双源；V2 档仅保六段表 + 机械面表点名收口。

**用例表（新面——normal/boundary/error）**：

| # | 类 | 输入 | 预期输出 |
|---|---|---|---|
| C1 | 正常 | 主代理 create({path, topic, prev}) | 骨架落盘 6 段 + §1 状态行含「进行中」+ 前情指针 + 编制行 |
| C2 | 错误 | eng-designer create(...) | throw「create is main-agent-only」 |
| C3 | 错误 | create 目标已存在 | throw（fail-closed） |
| C4 | 正常 | eng-designer status({value:"✅ 设计完成"})——「设计完成」∈ §2 段内生命周期词表（fix 轮 #1） | §2 段内状态行更新；§1 冻结态不变 |
| C5 | 错误 | status({value:"随便写写"})——词表外值 | throw（不在所属段的 STATUS_WORDS 项） |
| C6 | 正常 | 主代理 close() | §1 →「已收口 <日期>」 |
| C7 | 错误 | close 后 append / status | throw（冻结拒写——错误消息区分「已收口档不回改」） |
| C8 | 正常 | batch_segment 别名调用（过渡期） | 走 append 语义，与 batch({action:"append"}) 等价 |
| C9 | 边界 | create 时基底目录不存在（基底 = resolveBatchDocPath 声明面解析——轮 2 #2） | 创建目录（mkdir -p 语义）——骨架一次落位（与 AC-4 非法路径面咬合：基底内缺目录建、越基底拒） |
| C10 | 边界 | append 时目标档 §2 缺骨架标题 | throw（既有 fail-closed 不变——create 是骨架唯一权威入口，append 不自动补骨架） |

**上抛项**：

1. **需求档面零改动由主代理裁量（fix 轮 #7——升格带到期条件协调项）**：`docs/core/requirements/ENGINEERING-MODE-V2.md` §6（批次档生命周期）:655 与 `PROMPT-SYSTEM.md` :60 含 `batch_segment` 点名——需求笔归主代理；本设计未动。**到期条件 = 本批 §6 收口前**：主代理完成两处点名收口（改名），或将 `ENGINEERING-MODE-V2-SPEC-BATCH-SEGMENT.md`（47 行）改指新名 / 显式登记归档——统一口径 = 「两处改名 + 第三处改指/归档」（轮 2 #9）；§6 收口核对以此为核销项，避免旧名无限期存续。
2. **别名撤除判定句（fix 轮 #5 收正——状态行首行扫描，node 单行式，核仓根执行）**：实施轮收口时执行——输出**空**（无在飞批）⇒ 同轮撤别名与过渡注记；输出**非空** ⇒ 别名保留、tech_todo 登记待在飞批清零后撤（到期条件 = 输出转空）。命令全文单源 = `docs/core/design/BATCH-RECORD.md` §4.14（轮 2 #7——此处不复制）。**全文匹配否决**（讨论正文提及「已收口」即假阳）；**TTL 方案否决**（不可机判）。
3. **VSC 镜像仓同步归 VSC 轮**：核侧 #84 缝契约（configureBatchSegment 形态 / 导出名）本批保持等价 ⇒ VSC 端零回归；VSC prompt 镜像 / `tool-gates.mjs` 面点名（若存在）不在本批文件域。
4. **`adviser` 轮次戳形态零变确认**：append 的 §3 轮次戳 / 凭证剥除 / MAX_TEXT_CHARS 三判定照旧——评审子代理 prompt 面（advisor-design/round2/round3）仅改工具名，指引语式零变（本轮评审通道继续可用）。

**读回核验（D6——fix 轮再验）**：fix 轮落 §3 发现 #1–#13 后读回——状态行（含「进行中」）+ 条目表 8 行 + 受影响文件表 16 行（含模块列与模板面行）+ AC 表 12 条 + KD 6 条 + 用例 10 条 + 上抛 4 条全部在场；BATCH-RECORD / ENGINEERING-MODE-V2 侧改动另行读回核验；§3 段界未侵蚀。

### §2.1 同轮自勘修正（挂载面——2026-09-21）

**修正点**：上表「机制设计 · 工具形态」行「主代理不挂载（身份判据兜底）」与 §1 方案行**冲突**——§1 append 身份绑段已含「主代理 = §1/§4/§6」；不挂载则 create / close 死代码、痛点 ①（创建裸奔）无从消解。**以本修正为准（设计档 D-BR18 已同口径）**：**主 agent depth-0 挂载 `batch`**（create / close 仅 depth-0 放行；§1/§4/§6 普通文档写照旧零回归——工具通道是新增不替代）。eng 子代理 / 评审实例仅 append / status 可用（create / close 身份拒）。挂载落点修正：主 agent = family-tools depth-0 段（thincoder-core/agent/family-tools.mjs:141-149 列尾）；eng 两分支 :167-168 仅换工具名。**上表该行余文字（工具形态 / 评审键通道）零变。**

### §2.2 fix 轮（设计评审轮 1 修正 · 2026-09-21 · eng-designer）

承 §3 轮次 1 发现 #1–#13（父侧裁定：#1–#8 修复、#9–#13 顺手落、无 Deferred）——全部落档，逐条：

- **#1**（🔴 status 值域矛盾）：STATUS_WORDS 收为**分段词表常量单源**——§1 项 = gate 词表 `{进行中, 已收口}`（gate 只消费 §1 项，单源成立）；§2/§3/§5 各带段内生命周期词表。落点：BATCH-RECORD §4.12、D-BR19、批档 :72 状态机行、KD-3、AC-6、C4/C5（BR-21 保留为正例）。
- **#2**（🔴 主 agent append/status 通道无参数面）：depth-0 的 append / status 增**可选 `path`**（子代理语法不变——目标仍 spawn 注入；沿 D-BR17 破例逻辑；缺省 = 在飞批唯一时取该批、复数必传）。落点：BATCH-RECORD §4.1:58 / §4.3:84 / §4.7#7:118 / §4.12:198 / §4.13:204 / D-BR4:309（就地改写）/ D-BR17:322、新增 **D-BR21:326**、批档首行机制设计。否决「删主 agent 能力」。
- **#3**（🟡 提示词双源面）：受影响文件表补模板面 7 处命中行（`docs/core/design/prompts/` grep 实勘 7 命中——批档 :88），AC-10 双源同步。
- **#4**（🟡 L7 取数）：受影响文件表补模块列 + 表后 L7 复核行（去重 = M3+M9 = 2 ≤2 达标——批档 :94/:97）。
- **#5**（🟡 撤除判据健全性）：判据改**状态行首行扫描**（node 单行式——本机无 grep 且中文机判须 UTF-8 感知形态；`^\*\*状态行\*\*：.*$` 首行匹配取值再判「已收口」；命令独立行单源 @ BATCH-RECORD §4.14，D-BR20 / 批档上抛② 短指同源）。已实测可执行（输出 = 74 个在飞批）。全文匹配与 TTL 双否决不变。
- **#6**（🟡 D-BR4 修订式表达）：D-BR4 行就地改写「append 段写入 = 专用工具 + 无路径参数（子代理）；create 破例见 D-BR17」，收窄注自规范面删除（沿革留变更记录）。
- **#7**（🟡 R5 范围协调）：上抛①升格带到期条件 = 本批 §6 收口前主代理完成需求面两处点名收口（改名），或将 SPEC-BATCH-SEGMENT 改指/归档——统一口径 = 「两处改名 + 第三处改指/归档」（批档 :142）；随实施落。
- **#8**（🟡 行数档位）：KD-4 拆分触发线上移 **300 咨询档**（预估 440-465 即触发 proactive 处置）；测试档结论 = 保留单档（既有 fixtures 共享，越 300 登记在案、硬顶 500 内——批档 :80/:121）。
- **#9**（🔵 符号名漂移）：§4.9 改主名 `batchTool.execute`（batchSegmentTool 仅存 2 处有意保留：别名映射注 + §4.14 本体）；V2 接线表 M3 行补映射注（权威 = BATCH-RECORD §4.14）。
- **#10**（🔵 as-of 漂移）：受影响文件表 md 行数 node 实测全表刷新（`wc -l` 本机乱码已弃用）。
- **#11**（🔵 段头映射）：BATCH-RECORD §4.10 加段头映射注（骨架段头为准；V2 六段表 = 内容职责描述，零改）。
- **#12**（🔵 参数面缺口）：§4.11–§4.13 各补一行参数面；AC-4「非法路径」判据 = 非 `.md` 后缀 / 解析后越出批次档基底 ⇒ throw（批档 AC-4 同步）。
- **#13**（🔵 AC-5 措辞）：收正为「既有用例**行为断言零改**（符号名/import 随批改）全绿」（批档 :107）。

**读回核验（D6）**：27 锚点（三档）+ BR batchSegmentTool 残留计数（=2）+ 行宽复扫（无新增 >300）+ #5 判据命令实跑通过——全绿。三档变更记录行已落。§3 段界未侵蚀；§3 发现表（禁改区）零触。

**需求档面零改**（笔归主代理）；上抛 4 项与 KD 决策面随本记录与批档 §2 为准。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审范围**：批档 §1/§2（全文）+ `docs/core/design/BATCH-RECORD.md`（全文）+ `docs/core/design/ENGINEERING-MODE-V2.md`（全文）。局限：代码文件行数/符号行号未实勘（评审域限三档，涉码引用标 unverified）；无文档地图声明 ⇒ 文档所有权判据降级——以批档 §2 权威链论证为据，论证相符（`BATCH-RECORD.md:4` 归档明示 + ENGINEERING-MODE-V2.md 实勘无 §2.20）。

| # | 类别 | 严重度 | 发现 | 建议 |
|---|---|---|---|---|
| 1 | 一致性（验收面自相矛盾） | 🔴 | status 合法值域两处描述冲突：规范面 = 与 gate 共用词表 {进行中, 已收口}（BATCH-RECORD.md:154、:195；批档 :72、KD-3 :119、D-BR19 BATCH-RECORD.md:320、AC-6 批档 :107），而正例 BR-21（BATCH-RECORD.md:143「…设计完成」）与批档 C4（:131「✅ 设计完成」）均为词表外值且标「正常」——C4 与 C5（:132 词表外值 ⇒ throw）互斥，AC-6「单源断言」的目标形态随之不确定 | 二选一并全 face 对齐：① STATUS_WORDS 定义为分段词表常量（§1 项 = gate 词表、gate 只消费 §1 项——单源仍成立），§2/§3/§5 各带生命周期词表，C4/BR-21 保留；② 维持单一词表，改 C4/BR-21 为词表内值。§4.12 写明取哪种形态 |
| 2 | 一致性/可行性（主 agent append/status 通道无参数面） | 🔴 | §4.7#3「主 agent 挂载只解锁 create/close 与 §1/§4/§6 append」（BATCH-RECORD.md:114）+ §4.12 写域含「主 agent → §1/§4/§6」（:196），但 §4.1 规定 append 不收路径、目标由 spawn 注入（:58，绝对表述无 depth 例外），§4.3 主 agent 行路径来源仅列 create/close 的 path（:84）；主 agent 无 spawn 绑定且多批同时在飞（ENGINEERING-MODE-V2.md:192）⇒ 该通道无从定位目标档——能力被声明而参数面缺失，与 append 无路径语法相抵 | 二选一并四方对齐（§4.1/§4.3/§4.7/§4.12 + 批档 §2）：① depth-0 的 append/status 增加 path 参数（沿 KD-1 破例逻辑，子代理语法不变）；② 删去 §4.7#3 与 §4.12 的主 agent append/status 表述——主代理 §1/§4/§6 内容写走普通文档写，工具面只留 create/close |
| 3 | 完整性（提示词双源面缺席） | 🟡 | 受影响文件表 prompt 行只含落地档 7 处（批档 :87），中文模板面（docs/core/design/prompts/——M9 双面流程源：ENGINEERING-MODE-V2.md:272「改模板 → 翻译生成落地」、:98「落地 = 生成物，重生成不手改」；BATCH-RECORD.md:213「双源同步」、:287）未列——若模板面含 batch_segment 字面（按双源结构大概率），直改落地档 = 下次重生成回退改名，且 VSC 锚 A2/A8 逐字源双源失同步；AC-10（批档 :111）也只扫落地目录 | 受影响文件表补模板面对应行（与 7 处逐一对应）；若实勘模板面零命中，将实勘证据（grep 计数）记入批档 §2 并在 §4.5 注明单面收正依据 |
| 4 | 方法论（L7 取数面未履行） | 🟡 | L7 判定时点② = §2 受影响文件表按「模块列」去重复核（BATCH-RECORD.md:241）；批档 §2 表（:78-95）无模块列，§1 亦无批件时预估记录——两处判定时点均无落痕（本批涉 M3 + 提示词面，预估 ≤2 应能过，但未记录） | §2 表补模块列（M3 / M9 / —），表后记一行 L7 复核结论（去重 ≤2） |
| 5 | 判据健全性（别名撤除机判） | 🟡 | 撤除判据 `grep -L "已收口" docs/batches/*.md`（BATCH-RECORD.md:207、D-BR20 :321、批档 :142）为全文匹配：在飞批讨论正文提及「已收口」即被误判已收口——本批档自身（:27、:121 等多处）即反例；实施轮收口时本批多半未走完 §6 ⇒ 输出空 → 误撤别名，正中 D-BR20 否决「立即撤」要防的实害（在飞 §3 自写通道被打挂） | 判据改为读各档 §1 状态行再判（复用 readBatchStatusLine 单源解析器），或 grep 收窄到状态行形态（`^\*\*状态行\*\*：.*已收口`）；§4.14 / D-BR20 / 批档上抛项② 同步 |
| 6 | 文档卫生 | 🟡 | D-BR4 行（BATCH-RECORD.md:305）原文未改，收窄语义以「收窄注」（:323「原句…不再覆盖」修订式表达）挂在决策表规范面 | D-BR4 行就地改写为「append 段写入无路径参数（create 破例见 D-BR17）」，删 :323 注记（变更记录 :349 已载该收正，沿革不丢） |
| 7 | 范围协调（R5） | 🟡 | 需求面三处 batch_segment 点名零改上抛（批档 :141——requirements/ENGINEERING-MODE-V2.md、PROMPT-SYSTEM.md、SPEC-BATCH-SEGMENT 归档档）；设计面收口（AC-12 批档 :113）与需求面旧名并存 = 跨层名实滞后窗口 | 上抛项升格为带到期条件的协调项（如「本批 §6 收口前完成需求面点名收口或显式登记归档」），避免旧名无限期存续 |
| 8 | 结构（行数档位） | 🟡 | batch.mjs 预估 440-465 已越 300 咨询档，KD-4（批档 :120）拆分触发只挂 500 硬顶（批档 :80、ENGINEERING-MODE-V2.md:67 同口径）；测试档 238+80~110 → 318-348 越 300 无拆分登记 | KD-4 触发线上移至 300 档（预估即触发 proactive 处置：落 batch-skeleton.mjs 拆分，或显式记录保留单档理由）；测试档补一行拆分/保留结论 |
| 9 | 文档状态漂移 | 🔵 | 改名残点：§4.9 两处仍以 batchSegmentTool.execute 为主名（BATCH-RECORD.md:152、:159）；V2 接线表 M3 行未带改名注记（ENGINEERING-MODE-V2.md:92；M3 模块行 :67 已带） | 实施轮随批收正，或在 §4.14 别名注记统一声明符号名映射 |
| 10 | 数值漂移 | 🔵 | 受影响文件表 md 行数陈旧：BATCH-RECORD.md 标 320（实 ~371——本设计轮编辑已在盘）、ENGINEERING-MODE-V2.md 标 554（实 ~556）；md 豁免标注义务，仅记漂移（批档 :93-94） | 实施轮刷新 as-of 读数 |
| 11 | 命名一致性（先存） | 🔵 | V2 六段表段名（§1 目标+前情+条目…ENGINEERING-MODE-V2.md:177-182）与 create 骨架段头（§1 讨论（主 agent）…BATCH-RECORD.md:174-183）标签不一——先存分歧，本批立骨架为 create 权威后两 face 相邻 | §4.10 加一行映射注：「段头以本骨架为准；V2 六段表 = 内容职责描述」 |
| 12 | 清晰度（参数面小缺口） | 🔵 | close 参数未在 §4.13 列明（仅 §4.3 :84 侧写 path）；AC-4「非法路径」（批档 :105）未定义判据 | §4.11–§4.13 各补一行参数面；AC-4 给「非法」判据（建议：非 .md / 解析后越出批档基底 ⇒ throw） |
| 13 | 清晰度（措辞） | 🔵 | AC-5「既有用例零改全绿」（批档 :106）与同表「import/用例面随批改」（:88）字面相抵 | AC-5 措辞收为「既有用例行为断言零改（符号名/import 随批改）全绿」 |

**VERDICT**: changes-required

**计数**：🔴 2 · 🟡 6 · 🔵 5（共 13 条）。🔴#1（status 值域矛盾）与 🔴#2（主 agent append/status 通道无路径来源）须在实施前收口；🟡/🔵 不阻塞但建议随 fix 轮一并落。

### 轮次 2（评审子代理）

**评审范围**：批档 §1/§2（全文）+ `docs/core/design/BATCH-RECORD.md`（全文，实读 383 行）+ `docs/core/design/ENGINEERING-MODE-V2.md`（全文，实读 559 行）。局限：无文档地图声明 ⇒ 文档所有权判据降级（沿用轮 1 口径，以批档 §2 权威链论证为据）；代码文件行数/符号行号未实勘（评审域限三档，涉码引用标 unverified）；上抛② 判据「输出 = 74 个在飞批」实跑结果未复验（命令逻辑按文面核读，fail-closed 方向正确）。

**轮 1 发现 #1–#13 落地核验：13/13 已落**——#1 分段词表（批档 :72/:120/:108/:132-133、BATCH-RECORD §4.12:198、D-BR19:328、BR-21/BR-22 一致）；#2 depth-0 可选 path（BATCH-RECORD §4.1:58 / §4.3:84 / §4.7#7:118 / D-BR21:330；D-BR4:313 就地改写）；#3 模板面 7 处入表（批档 :88）+ AC-10 双源（:112）；#4 模块列 + L7 复核行（批档 :94/:97，去重 = M3+M9 = 2 ≤2）；#5 撤除判据改状态行首行扫描（批档 :143-144、BATCH-RECORD §4.14:211-215、D-BR20:329 同步）；#6 D-BR4 就地改写、收窄注已删（§7 无残留）；#7 上抛①带到期条件（批档 :142）；#8 KD-4 拆分触发线 300 档 + 测试档保留结论（批档 :80/:89/:121）；#9 符号名主名（BATCH-RECORD :153，batchSegmentTool 残留 = 2 处有意保留；V2 :92 映射注）；#10 as-of 刷新（批档 :94-95，已再漂移→新发现 #5）；#11 段头映射注（BATCH-RECORD :187）；#12 参数面三节齐（§4.11:191/§4.12:198/§4.13:204）+ AC-4 判据（批档 :106）；#13 AC-5 措辞（批档 :107）。

| # | 类别 | 严重度 | 发现 | 建议 |
|---|---|---|---|---|
| 1 | 文档卫生（失效表达残留） | 🟡 | 批档 §2 机制设计行仍留「主代理不挂载（身份判据兜底）」与「挂载面零变」（:64），与 §2.1 修正（:152「主 agent depth-0 挂载 batch」）及权威档 BATCH-RECORD §4.3:84 / D-BR18:327 相抵——失效句未就地删除（2026-09-18 用户裁定要清的修订式残留）；实施者若只读机制设计行将装出反面（AC-3 可机判兜住，故非 🔴） | 就地改写 :64：删「主代理不挂载（身份判据兜底）」与「挂载面零变」，改写为「主 agent depth-0 挂载（D-BR18，修正沿革见 §2.1）」 |
| 2 | 一致性/可迁移（create 路径基底） | 🟡 | create 的 path 基底三处写死 `docs/batches/`（批档 :66、C9 :137；BATCH-RECORD §4.11:191 及越基底判据同源），与载体三点 #2「产品不假定用户项目形如本仓」（BATCH-RECORD :17）、D-BR1（:310）不一致；M3 已有 `docRoot.batches` 双基底解析单源（:160）未被 create 引用——manifest 声明他值时相对解析与越界判定落错基底 | 基底单源 = `resolveBatchDocPath` 声明面解析（manifest `docRoot.batches`，缺省回退默认值）；§4.11 / 批档 :66 / C9 判据句改指该单源，不写死字面路径 |
| 3 | 完整性（status 值域缺口） | 🟡 | §4.12 写域含「主 agent → §1/§4/§6」（BATCH-RECORD :199），但 STATUS_WORDS 分段词表只枚举 §1/§2/§3/§5（:198）——§4/§6 段内 status 合法值域未定义 | 二选一：① STATUS_WORDS 补 §4/§6 项；② §4.12 写域收为「主 agent → §1」（§4/§6 状态面走普通文档写，与 D-BR18 分工一致） |
| 4 | 清晰度（错位条目） | 🔵 | 受影响文件表 ENGINEERING-MODE-V2.md 行含「用例 C4 词值与 §1 项词表对齐（#1）」（批档 :95）——V2 用例表只有 T1–T14（V2 :504-518），无 C4；C4 住批档（:132），条目错挂 | 删除该错位条目（C4 对齐已由批档 fix 轮 #1 覆盖） |
| 5 | 数值漂移（as-of） | 🔵 | 批档 :94 标 BATCH-RECORD.md 372 行（实读 383）、:95 标 ENGINEERING-MODE-V2.md 557 行（实读 559）；V2 M3 行 265（V2 :67）vs 批档 266（:80）——快照不作契约（BATCH-RECORD §9:347），仅记漂移 | 实施轮收口时 as-of 读数再刷新一次 |
| 6 | 清晰度（AC-5 文件名漂移） | 🔵 | AC-5 仍以旧名 `batch-segment.test.mjs` 指认用例档（批档 :107），与同表 AC-1「改名后 batch.test.mjs」（:103）及受影响文件表改名行（:89）不一致 | AC-5 改指 `batch.test.mjs`（改名后） |
| 7 | 文档卫生（判据命令双份） | 🔵 | 别名撤除 node 判据全文复制于批档上抛②（:144），而 fix 轮自述「命令独立行单源 @ BATCH-RECORD §4.14，批档上抛② 短指同源」（:162）——实际两份全文，日后再修即漂移 | 批档 :144 收为短指，命令全文仅存 §4.14（:214） |
| 8 | 清晰度（AC-6 判据可自绊） | 🔵 | AC-6「无第二处字面」（批档 :108）与 create 骨架占位状态行必须含「进行中」（批档 :69；BATCH-RECORD §4.10:176）字面相抵——骨架模板天然含关键字字面，严格按字面 grep 会假失败 | 判据收为「无第二份独立词表；骨架占位行由 STATUS_WORDS §1 项引用生成（非独立字面）」 |
| 9 | 数值/措辞漂移（上抛①计数） | 🔵 | 上抛① 正文「该两处点名收口，或将 SPEC-BATCH-SEGMENT 改指/归档」（批档 :142）vs §2.2 摘要「三处点名收口或显式登记归档」（:164）——2+1 与 3 两种口径并存 | 统一为「两处改名 + 第三处改指/归档」一句口径 |

**VERDICT**: pass

**计数**：🔴 0 · 🟡 3 · 🔵 6（共 9 条）。轮 1 的 13 条（🔴2 · 🟡6 · 🔵5）逐条核验全部落地；本轮新增 🟡 3 条均为收口面收尾项（不阻塞实施派发），建议随实施轮顺手落。方法论与覆盖面：T1–T8 全覆盖、AC-1–12 机判可验回指闭合（条目 8 / 文件表 16 / AC 12 / KD 6 / 用例 10 / 上抛 4）；L7 = 2 达标；行数档位合规（KD-4 拆分预案在案）；文档所有权单源相符。局限：无项目标准档声明、无文档地图（ownership 判据降级）；代码侧行号/符号位 unverified。

## §4 用户批准（主 agent）

**批准**：✅ 设计批准（2026-09-21 04:11）。依据 = 用户 04:08「自动跑完吧」代授权（§1.0）+ 复评 VERDICT pass（§3 轮次 2：🔴 0 · 🟡 3 · 🔵 6，轮 1 十三条全部落地核验）。主代理依授权代录本批准语。
**随批准裁定（9 条新发现归属）**：🟡#1（:64 失效句就地改写——实施轮 eng-coder 属 edit 面，随批落）· 🟡#2（create 基底单源改指 resolveBatchDocPath——设计判据句收正随实施落）· 🟡#3（§4/§6 值域——**裁建议②**：写域收「主 agent → §1」，§4/§6 走普通文档写，与 D-BR18 分工一致、零新词表）· 🔵#4–#9 全部随实施轮顺手落。

## §5 实施记录（eng-coder）

**批次**：`2026-09-21-batch-lifecycle-tool` · **实施轮**（2026-09-21）· 承 §2 设计 + §3 轮 2 评审（🔴0·🟡3·🔵6）+ §4 批准裁定 9 条全兑。**审计/评审轮次与终态：内部 explore 审计 1 轮（findings 全数自修）→ advisor 代码评审 2 轮（轮 1 full review findings 全数自修；轮 2 交付时点收敛复验 verdict pass——4 项注释/快照面已修，#3 上抛，终态 `clean`）**。

**实现面**（权威规格 = BATCH-RECORD §4；KD-4 三档单向 skeleton(94) ← lifecycle(245) ← 主档(397)）：

1. **代码五档 + 装配 + shim**：`batch-skeleton.mjs`（SEGMENT_BY_ROLE / STATUS_WORDS 分段词表 / STATUS_LINE_RE / readBatchStatusLine / sectionHeaderRe / batchSkeleton——判定字面单源）、`batch-lifecycle.mjs`（create/status/close + findInFlightBatch + 冻结门 assertGateOpen + 值域 assertStatusValue）、`batch.mjs` 主档（action 分发 + append 迁移面 + resolveBatchDocPath / batchDocBases 基底单源 + #84 记账缝 onWritten 记 `_touchedFiles`）、`batch-segment.mjs` 18 行 shim（`batchSegmentTool` 别名保缝——name="batch_segment"、execute⇒append，不入生产挂载面）、`agent-tools.mjs` / `agent/family-tools.mjs` / `advisor/{loop,run}.mjs` / `agent-tools/advisor.mjs` 装配改主名 `batchTool`；depth-0 主 agent 挂 `batchTool(null)`（D-BR18——create/close/append §1§4§6/status §1，路径参数面按 D-BR21：可选 path，缺省 findInFlightBatch（0/复数 throw））。family-tools:160-164 挂载注释随轮 2 裁定②收正（status 域 = §1）。
2. **测试四档随改 + 新建主测**：新建 `test/batch.test.mjs` 380 行 17 用例（C1–C10 + BR-18/19/21/22/24/25/26 + AC-2 别名等价）；`family-tools.test.mjs` / `advisor-consult-merge.test.mjs` / `batch-segment-manifest.test.mjs` / `docroot.test.mjs` 随改（符号名/挂载面/基底单源）；旧 `batch-segment.test.mjs` **零改绿**（AC-5 行为断言零改实证——38 pass 含旧档）；core 全量 **494/494 绿**；行数卫生门：batch.mjs 397 / batch.test.mjs 380 已入 `core-hygiene.test.mjs` SOFT_LINE_REGISTRY。
3. **prompt 面 14 处**（7 模板 + 7 装配镜像双源同步）：主名调用语式 10 处；AC-10 机判通过（`batch_segment` 字面仅在过渡注记位）。
4. **文档收正**：BATCH-RECORD 4 处 + 批档 8 处 + V2 零改（实勘已是收正后形态）；承轮 2 裁定①–②与 #1–#9；变更记录一行落 :365。

**#26 安全事件取证**（2026-09-20 晚实施期间，`batch.mjs` 主档重写时发现写入内容异常——非工具注入、非外部进程污染：**注入文本不可完整复现**、write 时间戳 **2026-09-20T21:29:59Z**、调用 id **不可考**（当时无审计日志缝）、目标路径 **`d:\teamcode\incident-26-batch.mjs.polluted-evidence`**（污染稿已封存：21507 字节，开头为 batch.mjs 应有注释头但正文混入异常内容）；文件已在盘核实于本次交付取证时点。四项事实如实落档，处置权归主代理/用户。）

**交付表**：

| # | Status | Requirement |
|---|--------|-------------|
| 1 | ✅ Done | 单工具 `batch` action 分发（create/append/status/close）——AC-1/AC-3/AC-4/C1–C10 全用例绿 |
| 2 | ✅ Done | AC-2 别名等价：`batchSegmentTool` shim name/execute 双断言 + T6 |
| 3 | ✅ Done | AC-5 append 零回归：旧档零改 38 pass（行为断言零改） |
| 4 | ✅ Done | AC-6/7 status 正负例 + 词表单源（union 词面恰一词且∈本段） |
| 5 | ✅ Done | AC-8 close 冻结；AC-9 冻结拒写错误消息区分「已收口档不回改」 |
| 6 | ✅ Done | AC-10 prompt 双源 14 处收正 + 机判通过 |
| 7 | ✅ Done | AC-11/AC-12 文档收正（BATCH-RECORD 4 处 + 批档 8 处 + family-tools 注释） |
| 8 | ⚠️ 简化 | VSC 端 5 红未修（host-shape/登记册/装配面基线快照钉改前核形状）——批档上抛③裁定 VSC 面归 VSC 轮，核侧缝等价性（#84/configureBatchSegment 形态/导出名）本批零触碰；修复点已勘明（3 处 fixture/断言）留 VSC 轮随手落 |
| 9 | ✅ Done | depth-0 挂载 + D-BR21 path 参数面（缺省 findInFlightBatch，0/复数 throw） |
| 10 | ✅ Done | #26 安全事件四项取证落档（本 §5）+ 污染稿封存在盘 |

**自检清单**：① AC-1–12 逐条回指闭合（本表 + 测试）✓ ② 越出文件域变更 = family-tools 注释 1 行（在受影响表内，仅行数变）+ 批档/BATCH-RECORD 文档面（随批落）——均已披露 ✓ ③ 三端测试结论如实（core 绿/advisor 绿/VSC 5 红定性上报）✓ ④ 全部改动文件读回（D6）✓ ⑤ 注释与实现一致（family-tools:163 收正后复勘）✓ ⑥ 文档漂移点名：VSC 测试基线未随批（上抛③窗口内，主代理裁定面）。

**微瑕披露**：批档 :142 上抛①「两处改名 + 第三处改指/归档」到期条件（本批 §6 收口前）**未在本轮闭环**——需求面点名（V2 §6:655 / PROMPT-SYSTEM:60 / SPEC 47 行档）属主代理/需求轮域，按轮 2 #9 口径上抛 §6 收口核对；§4.14 判据实跑输出非空（74 在飞批）⇒ 别名按设计保留，tech_todo 登记归主代理。

**收敛复验（advisor 代码评审 · 轮 2 · 交付时点）**：verdict **pass**（🔴 0 · 🟡 3 · 🔵 4，无 must-fix）。响应处置：🟡#1（advisor.mjs:89 参数描述改指 `batch` + 过渡注记——已修）/ 🟡#2（agent-tools.mjs:18-19 登记册头注 status 域收「§1（轮 2 裁定②）」——已修）/ 🟡#3（`findInFlightBatch` 平扫不递归 vs create 嵌套落位的路径自由度错位——**不改**：fail-closed 方向只误拒不误写、本仓批档惯例落顶层，改递归属行为面变更须设计裁定，留 §6 上抛）/ 🔵#4（core-hygiene:50「398 行」→「实测 397 行」——已修）/ 🔵#5（:97 快照 384/559 → node 实测 387/558——已修）/ 🔵#6（:10 §1 状态行阶段描述滞后——父代理 §6 收口随收口行更新，本段不代写）/ 🔵#7（family-tools:24 参数注旧符号名——已修）。修正后 core 全量复跑 **494/494 绿**（含 AC-10 机判与行数卫生门）。评审引用 host 核验一处误报（BATCH-RECORD.md:385 实测在档）——node 复核确认评审结论成立（387 > 384）。

## §6 验证与收口（父代理）

### 6.1 实施验证（父侧独立复测 · 2026-09-21 03:41–06:35）

- **core 全量独立复跑**：`node test/run.mjs` = **494/494 绿**（与 §5 声明一致）——含 AC-10 机判、行数卫生门（batch.mjs 397 / batch.test.mjs 380 入 SOFT_LINE_REGISTRY）、别名等价/零回归用例族。
- **#26 安全事件定性**（trace 物证，用户 06:35 认可）：**模型侧生成劣化，非注入、非写入链缺陷**——trace `38478126a2c4-1841.jsonl` 实录 write 调用参数即 15 行垃圾（completion 仅 242 tokens · provider=deepseek-flash · cache hit 87936/91346），content 452 字符与回执分毫不差 ⇒ 工具零缺陷；触发词「jadangan」输入侧零出现 ⇒ 非上下文投毒。子代理「伪装回执」叙事 = 误读（把自产垃圾读回误判为被替换）。防线全链有效（D6 读回 → 上报不隐瞒 → 独立取证 → trace 铁证）。台账 **#26 已核销**（铁证入 evidence）；污染稿封存在盘归档。

### 6.2 上抛项收口（§5 交付清单 6 项逐条）

| # | 上抛 | 裁定/落点 |
|---|---|---|
| ① | 🟡3 findInFlightBatch 平扫 vs create 嵌套落位 | **裁不改**（采纳 coder 判据：fail-closed 方向只误拒不误写；改递归属行为面变更——登记新 tech_todo #27 留设计轮） |
| ② | 🔵6 §1 状态行滞后 | ✅ 本 §6 收口一并更新（已置「已收口」行） |
| ③ | VSC 5 红（基线快照钉改前形状） | **归 VSC 轮**（§1 边界既有裁定；修复点 3 处已勘明——host-shape fixture 名集/两行符号名） |
| ④ | 需求面三处 `batch_segment` 点名 | ✅ **父侧已收口**（V2 §5.3/§5.4/§7.4/§13.2/§13.6 五处 + PROMPT-SYSTEM §2.3 第 14 节 + SPEC-BATCH-SEGMENT 六段表/AC-M3-1——活体引用清零，唯一残留 = PROMPT-SYSTEM:198 变更记录历史行〔合法〕） |
| ⑤ | §4.14 别名撤除 | 判据实跑 = 74 在飞批非空 ⇒ **别名保留**；tech_todo 登记（#27 同轮）撤除时机 = 判据输出转空 |
| ⑥ | #26 处置权 | ✅ 用户裁定 A → trace 定性收口（6.1） |

### 6.3 台账与凭证

- 台账 **#25 → 已核销**（结算依据 = 6.1 复测 + §5 交付表 + 本 §6 上抛收口）；新增 tech_todo **#27**（别名撤除 + findInFlightBatch 递归判定——触发 = §4.14 判据输出转空）。
- 凭证槽 consume：designId `5c7956d4-5050-4d88-a6b4-07571faab670`。

### 6.4 收口

- 提交 = **`0b45957c`**（35 档；+1582/−346）——本批受影响表全集 + 需求面三档 + 批档 §6；**CLI 实例在飞面（SESSION/TRACES/TUI/startup-latency 等）零触碰**——path-limited（`docroot.test.mjs` 本批零改未入）。
- 状态行冻结：§1 →「✅ 已收口 2026-09-21」（close 通道语义首次实战——由父侧普通文档写落，因本批工具本身在混版窗口内）。
- 遗留债：VSC 5 红（归 VSC 轮）· #27（别名撤除 + 递归判定）——均已入账，无悬空。
