# 2026-10-02 · 公共仓读取（文档 ∥ 模块——发现 · 检索 · 读侧纪律）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-02 · 来源 = 用户 2026-10-02 23:40（挂需求）→ 23:47（扩展公共模块仓）→ 23:48（自持约束追问）→ 23:49「开始」；台账 #832；全链自动（用户 22:35 多仓授权）。
> 台账 = #832（PROMPT-SYSTEM.md · 归批）。前情 = 无（独立批——多仓机制家族读侧补面；承台账 #832）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-03
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**2026-10-02 23:40–23:49 · 需求讨论（主 agent 整理）**

**用户原话链**：23:40「帮我挂一个跨仓文档的需求，我们经常会把一些公共的文档放在独立的文档仓里，但是现在用户反映在做业务实现的时候 agent 经常会不去读公共文档仓的文档，只看本仓的。」→ 23:47「有时候也不止是文档，也会出现公共模块仓的问题，代码层面也有类似的问题。」→ 23:48「现有的文档各仓自持的约束会不会也是造成问题的原因之一？」→ 23:49「开始」（立批令）。

**父侧诊断（实读——台账 #832 evidence 全文在册）**：
- **A 检索面双锁（机械根因）**：① 语料 = 单一根（写侧 origin = 绝对项目根——`memory/schema.mjs:305`；同步 walk 只遍历该 dir）；② 读面按 origin **等值**过滤（`memory/docs.mjs:105-108` `AND origin = ?`——doc ∥ code 同构）⇒ 公共仓的行**不入语料 ∥ 查出也被滤掉**。
- **B 声明面零位**：无「公共仓」声明概念（grep 全零）。
- **C 行为面零句 + 自持反向拉**：提示词无「实施前查公共仓」纪律；自持家族全写侧、无禁读，但三处助长「只看本仓」（工作区模型向内 ∥「被拒 = 正确行为」的回避训练 ∥「别处已有」式反向句——逐句核见台账 #832）。
- **D 视角面**：会话锚 = 业务仓；公共仓 = 工作区兄弟目录，不在 cwd 视野。
- **能力面排除**：file 工具可读任意路径——能力不是瓶颈。

**修法收敛（本批设计面 · 三条 + 对句）**：
① **声明位**——公共仓（文档 ∥ 模块）的发现方式（manifest ∥ 工作区级 ∥ 约定位置——设计定）；
② **检索接入**——声明源纳入检索（多根 ∥ 第二 origin ∥ 读面放开；轻量 fallback = 直读）；
③ **读侧纪律句**——「实施/设计前查声明源」+ **自持读侧对句**（「自持管写；读取不限」）+「跨仓只经接口」界句（管耦合不管读取）。

**边界（不做）**：不做跨仓写 ∥ 不做自动同步 ∥ 不新造索引系统。
**验收方向（设计定形）**：多仓实景——公共仓在场时，业务实现会话出现「读取公共仓内容」的可抽查证据（文档 ∥ 模块两侧各 ≥1 例）。

**授权与链位**：全链自动（用户 22:35 多仓授权 + 23:49「开始」）——设计 → 评审 → 修正 → §4 代签 → 实施 → 收口签入；自缚三条照旧（代签三条件 ∥ 新范围停 ∥ 破坏性停）。设计轮 = eng-designer 已派。

**#828 签入 errata（父侧 · 2026-10-02 23:5x）**：会话锚解析修复批（`docs/batches/2026-10-02-manifest-resolution-fix.md`）收口提交 = **`442dacf2`**（15 档，双远端；其档已冻结，哈希落此邻域）。

**2026-10-02 23:47 – 2026-10-03 00:04 · 讨论续（用户四裁 · 主 agent 记）**：
- **23:47 扩展**：公共**模块仓**同病（代码层同问题）——需求升为「公共仓读取（文档 ∥ 模块）」；父侧诊断四层（检索双锁 ∥ 声明面 ∥ 行为面 + 自持反向拉 ∥ 引用面）见台账 #832。
- **23:48 自持追问**：判 = 自持家族全写侧、无禁读，但三处助长「只看本仓」（认知层成因）；修法 = 读侧对句「自持管写；读取不限」+ #827 界句。
- **23:54 引用裁决**：跨仓引用 = **必须支持的合法形态**（硬性要求）——声明位兼作引用解析根 + 记录面有界例外；设计不得裁「不并」。
- **23:59–00:04 发现/维护模型（用户 00:04「嗯，这样我觉得应该可行」= 确认）**：**默认 = 工作目录树纳入检索**（零配置可用；标准排除 `.git` ∥ `node_modules` ∥ 构建产物）；`index.publicRepos` 降为**可选微调位**（越界源 ∥ 排除 ∥ 优先级）；**清单归 agent 托管**（机件面——用户零管理）；**软降级**（源缺位 ⇒「未核」列报，不炸）。三态判据：**核**（cwd 内 ∥ 已声明）∥ **未核**（声明源缺位）∥ **红**（越 cwd 且未声明）。

**设计轮** = `#19`（在跑；四条 steer 已入）。

**授权（用户 2026-10-03 00:05「后续这部分也全自动落地吧」）**：本批全链自动——设计 → 代点火评审 → 修正轮 ∥ §4 代签（三条件齐备才签）→ 实施 → 复核 → 收口签入。自缚三条照旧：① 代签三条件（评审 pass 0🔴 ∧ 修正已落地并逐条核验 ∧ token 已签发）；② 新范围 ∥ 用户口径裁决 ⇒ 停；③ 破坏性 ∥ 不可逆 ⇒ 先停。

**父侧直笔（标记 · 可 revert——2026-10-03 00:2x）**：`docs/core/design/DOC-DISCIPLINE.md:70` 规范文本指路收正——原「规范文本 = `docs/README.md` §3.7 规则表增一条」中的 §3.7 已不存在（现盘核：`docs/README.md` 153 行 · 无 §3.7 ∥ 无「跨仓」字样）⇒ 改指 **本节**（原承载 as-of 注 + 现行承载 = 本节 ∥ `LEDGER-SELF-CONTAINED.md` §5.1）。依据 = 修正轮 `#21` 报告项②（同轮披露）；机械指路级（零新增语义）。

**归属裁决（父侧 · 2026-10-03 00:3x——承 `#23` 上抛）**：**CN 提示词落笔 = eng-coder**（依据三源：D1 矩阵「prompts = 主 agent 内容权 + eng-coder 落笔」∥ `docs/core/design/PROMPT-SYSTEM.md:156`「起草 = eng-designer → 确认 → eng-coder 机械落笔」∥ 角色文本「不改提示词文件——提示词（含中文模板）= 产品代码」）。**本批 CN 面改派 eng-coder（`#26`）**；承 `#827`/`#830` 批次「CN = eng-designer」派发 = **父侧路由错误**（其内容面均逐行核验无误——路由自本批起纠正，记忆已入册）。`#23` 上抛 = 正确执行（依纪律不自行选边）。

**父侧直接执行（标记 · 可 revert——2026-10-03 00:5x）**：工程工具面两档直笔落地——`scripts/doc-check-anchors.mjs`（解析序 **⑥ 声明源候选** + 抽取面声明前缀例外 + 入参 `declaredRoots`——单一定义 = `declaredPublicRoots`）∥ `scripts/doc-check.mjs`（传参 + 报告行「声明源缺位——未核 · 不入闸」+ 汇总字段「声明源缺位 N」）。依据 = 批档 §2.2④ ∥ §2.5 行 10–11 ∥ `DOC-DISCIPLINE.md` §4.2.2/§4.2.5 ∥ D-V5-13（设计语义逐条兑现——非新语义）。行数 = 355（≤362 上界）∥ 93（≤97）。**核实跑**：批内件 **5/5 全绿**（④ 腿转绿——三态兑现）∥ `doc-check --root .` 悬空 0 · 行宽 OK · 新字段在位 ∥ `prompt-refs-check` 零命中。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（修正轮 1 已落 ∥ 微修正轮 3 已落（#24 🟡① 普通面补锚——§2.9 两行随正 ∥ §6.15 随正；读数随正 2 处；§2.3 Δ 随正；doc-check exit 0 ∥ 悬空 0））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**2026-10-02 · 设计轮（initial）· eng-designer**

本批 = **公共仓读取（文档 ∥ 模块——发现 · 检索 · 读侧纪律 · 跨仓引用）**。件源核对：spawn 派单（含两条 steer + 用户 23:54 裁定「跨仓引用必须可支持」）∥ §1 讨论段实读 ✓ ∥ 台账 #832（在途）✓；用户原话链 = 23:40 → 23:47 → 23:48 → 23:49「开始」→ 23:54（硬性要求）。

### 2.0 任务书（覆盖 ∥ 边界 ∥ 笔路 ∥ 测试面）

**覆盖 = 六件**（任务表 = §2.4；每条带验收）：① 声明位——`index.publicRepos` 入 schema（值形 ∥ 解析单一定义——父侧钉一）；② 检索接入——写侧三入口声明根集展开（一层）+ 读侧 origin 集；③ 读侧纪律句——双面四档（CN ∥ EN × 工程 ∥ 普通）；④ 跨仓引用合法形——解析（机检三态——父侧钉二）+ 记录面有界例外 + 文本面（V4）；⑤ 验收实景——文档 ∥ 模块各 ≥1 例 + 跨仓引用可核例；⑥ §2 就位 + 设计档落点（§2.5——本席笔·本轮已落盘）。

**边界（不做）**：不做跨仓写 ∥ 不做自动同步（不 clone / 不 pull / 不跨仓搬内容）∥ 不新造索引系统（复用既有 origin ∥ 同步 ∥ 读面）∥ 不加机械门 ∥ 不动 `thincoder.com`（仓外——零触）∥ 既有判据语义零改（新增候选置后 / 单 origin 快径零行为 / 写侧各仓自持零改）。

**笔路**：设计 7 档 = 本席（本轮已落盘）∥ CN 提示词正本（`docs/core/design/prompts/**` = 文档面 ⇒ 实施轮 eng-designer 笔）∥ EN 运行面（`thincoder-core/prompts/**` = 产品代码面 ⇒ 实施轮 eng-coder 笔——M9 翻译回写非 cp）∥ 核 / 脚本（实施轮 eng-coder）∥ 需求面（主 agent 笔——§2.8-U1）。

**测试面**：批内件（随批档存——声明投影 / 同步展开 / 读面集 / 引用三态 / 写门 T46）∥ 提示词双面一次性逐行比对（落地档 ↔ §2.3 围栏块）∥ 机检（refs / ## / 行宽 / doc-check——§2.7）。

### 2.1 现状实读（file:line 证据——本席亲读）

- **检索面双锁**：写侧 origin 单根 = `thincoder-core/agent/assemble.mjs:84`（`memory.codeOrigin = cwd`）+ 同步 walk 只遍历该 dir（`memory/docs.mjs:26` ∥ `memory/code-sync.mjs:124`）；读侧等值过滤 = `memory/docs.mjs:105-108` ∥ `memory/code-search.mjs:26-29`（`AND origin = ?`；游标键随过滤 = `:136` ∥ `:57`）⇒ 公共仓行不入语料 ∥ 查出被滤。
- **schema 已备多 origin**：`memory/schema.mjs:320-333`（v8——`code_chunks` PK `(origin, path, line_start)`）∥ `:359-372`（doc 同）；per-origin 锚键 = `memory/code-sync.mjs:21`（`last_indexed_commit:<归一键>`）。
- **声明面**：`index` 族现态三子键 = `manifest-schema.mjs:48`；投影 = `declaration.mjs:75-96`（`buildDeclaration`）；缺省八键档 = `manifest-schema.mjs:27-50`。
- **同步入口四调用点**（端面——本批零改）：CLI `thincoder-cli/src/tui/startup.mjs:277-308` ∥ `/reindex` `cmd-reindex.mjs:25-40` ∥ 桌面 `thincoder-desktop/src/main/index-status.mjs:59-65` ∥ VSC `thincoder-vscode/src/extension/panel-index.mjs:187-194`——均「gitSync → 回退 codeSync+docSync」形。
- **读面消费**：每回合召回 `agent/setup.mjs:112`（docSearch）+ B3 计数行 `:115-122`。
- **锚机检**：解析序 = `scripts/doc-check-anchors.mjs:162-177`（`resolveFile` 四候选 + basename 索引）；抽取排除 = `:143-146`（占位 / 点目录 / 多扩展段——声明前缀 token 现会被「多扩展段」误跳过之面）；入口 = `scripts/doc-check.mjs:49-65`（manifest 已读 + `checkAnchors(base, cfg, {gate, root})`）。
- **记录面**：写门 = `thincoder-core/ledger-cmd.mjs:52-60`（`assertTaskBookGate`）；自持句 CN = `docs/core/design/prompts/discipline-engineering.md:110-111`（item 1）∥ `:125`（item 12）∥ `discipline-normal.md:36-38`；EN = `thincoder-core/prompts/discipline-engineering.md:113-114` / `:128` ∥ `discipline-normal.md:36-38`。
- **提示词计数基线（本席复跑）**：CN engineering 169 / ## 8 · CN normal 204 / ## 6 · EN engineering 177 / ## 8 · EN normal 208 / ## 6。
- **先例**：R3 仓根全路径 `DOC-SYSTEM.md:208` ∥ R4 出射程 `:209` ∥ E1–E5 / L4 `LEDGER-SELF-CONTAINED.md:153-175 / 132-147` ∥ 解析序 ④ 前缀剥离 `DOC-DISCIPLINE.md:934`。

### 2.2 机制设计（五项——判据句 + 受影响文件）

#### ① 声明位——`index.publicRepos`（单源 · 值形 ∥ 解析单一定义）

- **载体**：`PROJECT-MANIFEST.json → index.publicRepos`（**嵌 index 族**——顶层键族与默认档计数零扰动；缺省 `[]` ⇒ 全链零行为变化）。
- **值形（父侧钉一）**：**从本仓根可解析的路径**（相对 ∥ 绝对同收；同级 `../` 合法）；归一 = trim · `\`→`/` · 首部 `./` 剥离 · 去尾斜杠 · 去重保序；**元素层宽容 ∕ 数组层 fail-closed**（同 `excludePaths` 款）。
- **解析单一定义**：新导出 `declaredPublicRoots(cwd)`（`thincoder-core/declaration.mjs`——`resolve(decl.root, p)` + 归一 + 去重保序）——**检索同步 ∥ 读面 origin 集 ∥ 引用解析三消费面共用，不得二写**；缺位存在性判（`existsSync`）归消费面。
- **判据句**：AC-37（`MANIFEST.md` §3.1——缺键补默认 + `missingKeys` 含 `index.publicRepos`；非数组 ⇒ `errors`；`["./x/","",7]` ⇒ 归一 `["x"]`）；缺省 ⇒ 声明读数与基线等值。
- **受影响文件**：`manifest-schema.mjs` · `declaration.mjs` · `conventions.mjs`（转口）· `manifest.mjs`（头注）。
- **落点**：`MANIFEST.md` §2.2 三族块 + §2.4 **KD-M1-35** + §3.1 **AC-37**（本轮已落）。

#### ② 检索接入——写侧展开（一层）+ 读侧 origin 集

- **写侧（同步展开）**：三入口（`codeSync` ∥ `docSync` ∥ `gitSync`）对**声明根集**逐根处理（入口 dir + 声明公共仓）——公共仓与入口同款（增量可行 ⇒ 增量（per-origin 锚既有），否则全扫）；**展开只做一层**（不递归）；各根自持其声明与行预算（WARN ∕ CAP 逐 origin 独立）；**声明根缺位 ⇒ 整根跳过**（展开前判存在性——不扫不删：存量行保留 + 一行 `logEvent`）；入口 dir 的 `gitSync` null 契约保持（回退链由调用方兜底——公共仓随回退展开覆盖）。
- **读侧（origin 集）**：`docSearch` ∥ `codeSearch` 过滤集 = 项目 origin ∪ 声明公共仓 origin（各经 `normalizeOrigin`）；**单 origin（未声明 / 无项目）⇒ 逐字零行为**；多 origin ⇒ `origin IN (…)` + 游标回全 PK（`scanVectors` 契约——等值前缀列消失即回全 PK，同「无过滤」款）；`agent/setup.mjs` 每回合召回与 B3 计数行同用该集。
- **判据句**：L-6.15-2（两 origin 各有行 / 增量只动改动文件 / 第三仓零行 = 不递归 / 缺位 ⇒ 零行零错 ∧ 存量零变 ∧ logEvent）∥ L-6.15-3（三 origin 命中集 / 无声明 ⇒ 与基线逐字等值）。
- **受影响文件**：`memory/code-sync.mjs` · `memory/docs.mjs` · `memory/code-search.mjs` · `agent/setup.mjs`——**端面四调用点零改**（核内吸收）。
- **落点**：`MEMORY.md` §6.15 + §7 **D-MEM29 ∥ D-MEM30** + §8.3 一行（本轮已落）。

#### ③ 读侧纪律句——双面四档（逐字 = §2.3 围栏块 A ∥ B）

- **三句 + 落点**：① 自持读侧对句（「自持管写；读取不限」+「实施 / 设计前先查声明源」）——工程 ∥ 普通各自自持节续项；② 界句（#827 item 12 尾随「本句管耦合、不管读取」）；③ 记录面声明源例外（item 1「仓外指针同样禁止」后随——声明公共仓可引、仓名前缀形可核）。
- **四问归属**：读侧句 = 「该模式下怎么干活」的操作规则 ⇒ **两模式各自纪律层**（自持家族既有落点——#827 判例同向）；不落公共层（非两模式逐句都要的协作基础）· 不落人格层（非角色边界）。
- **判据句**：一次性比对（落地档 ↔ §2.3 围栏块逐行全等）∥ refs 零命中 ∥ ## = 8/8/6/6 不变 ∥ CN 新行 ≤128（实测 59 / 92 / 98 / 87）。
- **受影响文件**：`docs/core/design/prompts/discipline-engineering.md`（169 → +2）· `discipline-normal.md`（204 → +1）∥ EN 同两档（177 → +2 · 208 → +1）。
- **落点**：`PROMPT-SYSTEM.md` §6.15 + §7 **D-PS20 ∥ D-PS21** + §6.1 应用实例（本轮已落）。

#### ④ 跨仓引用合法形（steer 硬性要求 · 全形态覆盖）

- **形态**：**`<声明仓目录名>/<仓内相对路径>`**（如 `docs-repo/x.md` ∥ `shared-mods/src/lib.mjs:42`——文档 / 代码同形；证据面可携 `:N` 坐标；**节号不判**——路径存在性为判据面，节号面登记为边界）；声明仓目录名 = 声明路径末段（归一形）；同名多仓 ⇒ 声明序首者（确定性）。
- **解析（机检面）**：`scripts/doc-check-anchors.mjs` 解析序**置后追加**候选 ⑥（首段命中声明仓名 ⇒ 于声明根解析余段——既有已解析 token 零改，绿面零动）；抽取面例外（声明前缀 token 免「多扩展段」模式串排除——repo 名含点号形态可引）；入参面（`checkAnchors` ∥ `scanDocAnchors` 增声明根集——由已读 manifest 计算传入；**与 `declaredPublicRoots` 单一定义同源**，脚本侧 import，不得二写）。
- **三态（父侧钉二——独立可核谓词）**：① `声明源在场 ∧ 目标档在` ⇒ **可解析（核绿）**；② `声明源缺位` ⇒ **未核列报（报告面，不入闸）**——报告行 + 汇总行增字段「声明源缺位 N」；③ `未声明前缀` ⇒ **既有序判照旧（悬空红）**；另：`在场 ∧ 目标档缺` ⇒ 悬空照红（真悬空）。**声明 ≠ 豁免标记**（无行级标记参与；声明源 = 解析源——不得互代）。
- **记录面有界例外**：L4③（`LEDGER-SELF-CONTAINED.md` §4——指针 / 证据可落声明源；未声明照旧 `[L4]`）+ 写门口径 4（`LEDGER.md` §6.1——`task_book` 声明源前缀形可核通过；缺位照旧拒）+ §5.1 声明源形块（合法可核坐标；**登记 / 归属零松**——#827 一仓一档照旧）+ §6.2 行为面增量注。
- **文本面**：`DOC-DISCIPLINE.md` §4.2.6 V4 行「声明源前缀形 = 合规坐标」；`DOC-SYSTEM.md` §7 **R6** 行（跨仓 · 已声明公共仓——登记行）。
- **判据句**：L-6.15-4（三态各一例）∥ `LEDGER.md` **T46** ∥ `DOC-DISCIPLINE.md` **D-V5-13**。
- **受影响文件**：`scripts/doc-check-anchors.mjs`（解析 + 抽取 + env 入参）· `scripts/doc-check.mjs`（传参 + 报告行 / 汇总字段）· `thincoder-core/ledger-cmd.mjs`（写门候选）。

#### ⑤ 实景验收（任务表第 6 行——验收详表 = §2.4）

多仓实景（公共仓在场）：业务实现会话出现「读取公共仓内容」可抽查——**文档侧 ≥1 例**（检索命中声明源行 ∥ 直读声明源文档）· **模块侧 ≥1 例**（检索命中 ∥ 直读声明源代码）· **跨仓引用可核例 ≥1**（`docs-repo/x.md` 形引用在 doc-check 下核绿）。实景主体（哪个仓声明哪个公共仓）= 用户侧裁定（§2.8-U2）。

### 2.3 双面逐字草案（一次性材料——落地档 ↔ 本块一次性比对基线；CN 正本 ∥ EN 运行面）

围栏块 A（`discipline-engineering.md`「文档与台账自持」节——CN ∥ EN）：

```text
A. discipline-engineering.md（自持节：item 1 续行 + item 12 句尾并入 + item 14 新增）
[A-CN-1]（CN 现 :111「……（本仓自持由 schema 校验）。」后新增一行）
   **声明源例外**——项目 manifest 声明的公共仓**可引**（仓名前缀形——可核）；其余仓外指针照禁。
[A-CN-2]（CN 现 :125 item 12 句尾并入）
12. **跨仓只经接口耦合**：各仓自持设计 / 实现 / 收口；**接口坐标 + 用户门是唯一耦合面**；**签入按仓各自进行**。**本句管耦合、不管读取**——声明源照查照读。
[A-CN-3]（CN 现 :126 item 13 后新增）
14. **自持管写；读取不限**——自持约束只辖写侧；**项目 manifest 声明的公共仓（文档 ∥ 模块）照查照读**——**实施 / 设计前先查声明源**；**读 ≠ 写 ≠ 耦合**。
[A-EN-1]（EN 现 :114「……(repo-self-containment is enforced by schema).」后新增一行）
   **Declared-source exception** — public repos declared in the project manifest **may be cited** (repo-name prefix form — verifiable); every other out-of-repo pointer stays banned.
[A-EN-2]（EN 现 :128 item 12 句尾并入）
12. **Cross-repo coupling goes through the interface only**: each repo self-contains its design / implementation / closeout; **interface coordinates + the user's gate are the only coupling surface**; **commits happen per repo, each on its own**. **This clause governs coupling, not reading** — declared sources are read as usual.
[A-EN-3]（EN 现 :129 item 13 后新增）
14. **Self-containment governs writes; reading is unrestricted** — the self-containment rules cover the write side only; **public repos (docs ∥ modules) declared in the project manifest are checked and read as usual** — **check the declared sources before implementing / designing**; **reading ≠ writing ≠ coupling**.
```

围栏块 B（`discipline-normal.md`「文档体系自持」节——items 1-2 后新增 item 3）：

```text
B. discipline-normal.md（自持节 item 3 新增）
[B-CN]（CN 现 :38 item 2 后新增）
3. **自持管写；读取不限**——自持约束只辖写侧；**项目 manifest 声明的公共仓（文档 ∥ 模块）照查照读**——**动手前先查声明源**；**读 ≠ 写**。
[B-EN]（EN 现 :38 item 2 后新增）
3. **Self-containment governs writes; reading is unrestricted** — the self-containment rules cover the write side only; **public repos (docs ∥ modules) declared in the project manifest are checked and read as usual** — **check the declared sources before starting work**; **reading ≠ writing**.
```

**双面对应（落点表）**：

| # | 面 | 档 | 落点 | 现读数 | Δ |
|---|---|---|---|---|---|
| 1 | CN 正本 | `docs/core/design/prompts/discipline-engineering.md` | 自持节：item 1 +1 行 ∥ item 12 句尾并入 ∥ item 14 两行 | 169 | +3 |
| 2 | EN 运行面 | `thincoder-core/prompts/discipline-engineering.md` | 同（A-EN-1–3） | 177 | +3 |
| 3 | CN 正本 | `docs/core/design/prompts/discipline-normal.md` | 自持节 item 3 两行 | 204 | +2 |
| 4 | EN 运行面 | `thincoder-core/prompts/discipline-normal.md` | 同（B-EN） | 208 | +2 |

逐字对应：CN ↔ EN = 语义对等翻译（M9）；同一语言面 = 落地档 ↔ 本块一次性比对（批次收尾核对步——输出入 §5）。

### 2.4 验收对照（任务表——每条带验收 · 回指）

| # | 本批条目（覆盖） | 验收（可核） |
|---|---|---|
| 1 | 声明位：`index.publicRepos`（schema + 投影 + `declaredPublicRoots` 单一定义）——**微调位、非钥匙** | `MANIFEST.md` **AC-37** ∥ L-6.15-1 ∥ 缺省 `[]` 零行为（对拍） |
| 2 | 检索接入（写侧）：三入口声明根集展开（一层；缺位跳过） | L-6.15-2 ∥ 端面四调用点零改（源码面） |
| 3 | 检索接入（读侧）：origin 集 + 计数行；默认 = cwd 树（既有基线） | L-6.15-3 ∥ 单 origin 逐字零行为（对拍） |
| 4 | 读侧句：双面四档（默认来源句 + 维护句 = agent 托管——§2.9 替换行） | 一次性比对全等（§2.3 围栏块 A ∥ B + **§2.9 替换行**）∥ refs 零命中 ∥ ## = 8/8/6/6 不变 ∥ CN 行宽 |
| 5 | 跨仓引用：合法形 + 解析 + 记录面例外 + 三态（红 = 越出 cwd 且未声明） | L-6.15-4（三态各一例）∥ `LEDGER.md` **T46** ∥ V4 行 ∥ **R6** 行 ∥ **实景：跨仓引用可核例 ≥1** |
| 6 | 实景验收：读公共仓内容可抽查 | **文档侧 ≥1 例 + 模块侧 ≥1 例**（检索命中声明源行 ∥ 直读声明源内容——§2.2⑤）；「只看本仓」复现率下降 |

**需求侧回指** = `docs/core/requirements/PROMPT-SYSTEM.md` #832 块（「验收（待定形）」⇒ 本表实形；开放点 ①–⑤ 结清清单 = §2.8-U1）；**三链同源** = §2 条目 ∥ 设计档判据 ∥ 需求块（待主 agent 落 U1 后闭）。

### 2.5 设计档落点（本轮已落 · D6 回读）与受影响文件

**设计档 7 档**（读数 = 落笔后实测）：

| # | 档 | 读数（前 → 后） | 落点 |
|---|---|---|---|
| 1 | `docs/core/design/MANIFEST.md` | 860 → **866** | §2.2 三族块（publicRepos 行）/ 元素层句 · §2.2 DEFAULT_MANIFEST 行 · §2.4 **KD-M1-35** · §3.1 **AC-37** · 变更记录 |
| 2 | `docs/core/design/MEMORY.md` | 719 → **752** | **§6.15 新增**（病灶 ∥ 单源声明 ∥ **默认来源/微调位** ∥ 值形单一定义 ∥ 三机制 ∥ 判据腿 L-6.15-1–4 ∥ 边界）· §7 **D-MEM29 ∥ D-MEM30** · §8.3 一行 · 变更记录 |
| 3 | `docs/core/design/PROMPT-SYSTEM.md` | 625 → **646** | **§6.15 新增**（读侧句 ∥ **来源模型 cwd 默认+声明微调** ∥ 四问归属 ∥ 双源落点 ∥ 机检面 ∥ 边界）· §7 **D-PS20 ∥ D-PS21** · §6.1 应用实例 · 变更记录 |
| 4 | `docs/core/design/DOC-DISCIPLINE.md` | 1641 → **1649** | §4.2.1 排除式例外 · §4.2.2 **⑥ 声明源候选 + 三态/细节** · §4.2.5 未核报告条 · §4.2.6 V4 行 · §4.5 **D-V5-13** · 变更记录 |
| 5 | `docs/core/design/LEDGER-SELF-CONTAINED.md` | 330 → **340** | §4 **L4③** · §5.1 **声明源形块** · §6.2 增量注 · §7 **D22** · 变更记录 |
| 6 | `docs/core/design/DOC-SYSTEM.md` | 437 → **438** | §7 **R6** 行 · 变更记录 |
| 7 | `docs/core/design/LEDGER.md` | 485 → **489** | §6.1 口径 4 · §8 AC-M2-10 · 用例 **T46** · 变更记录 |

**实施面**（现行读数 = 落笔前；Δ = 预计；笔 = 实施轮）：

| # | 档 | 现行 | Δ | 内容 |
|---|---|---|---|---|
| 1 | `thincoder-core/manifest-schema.mjs` | 164 | +~12 | `index.publicRepos` 缺省 + 形态判据 |
| 2 | `thincoder-core/declaration.mjs` | 173 | +~22 | 投影 + `declaredPublicRoots` |
| 3 | `thincoder-core/conventions.mjs` | 173 | +1 | 转口保名 |
| 4 | `thincoder-core/manifest.mjs` | 251 | +~2 | 头注 |
| 5 | `thincoder-core/memory/code-sync.mjs` | 258 | +~30 | 根集展开 + 单根内胆 |
| 6 | `thincoder-core/memory/docs.mjs` | 222 | +~15 | 同（doc 侧） |
| 7 | `thincoder-core/memory/code-search.mjs` | 138 | +~12 | 读面 origin 集 |
| 8 | `thincoder-core/agent/setup.mjs` | 267 | +~5 | B3 计数行 origin 集 |
| 9 | `thincoder-core/ledger-cmd.mjs` | 131 | +~10 | 写门声明源候选 |
| 10 | `scripts/doc-check-anchors.mjs` | 327 | +~35 | ⑥ 候选 + 抽取例外 + 入参 |
| 11 | `scripts/doc-check.mjs` | 91 | +~6 | 传参 + 未核报告/汇总字段 |
| 12 | CN 提示词 2 档 | 169 ∥ 204 | +3 ∥ +2 | §2.9 替换行（工程 ∥ 普通） |
| 13 | EN 提示词 2 档 | 177 ∥ 208 | +3 ∥ +2 | 同（M9） |
| 14 | 批内件（新档 · 随批档存） | — | 新 | 五组腿（§2.7） |

### 2.6 关键决策（含否决——全文 = 各设计档 KD 行）

- **KD-1** 声明位 = `index.publicRepos` 嵌 index 族（否决：顶层新键——计数族连带 · 工作区级档——新机制 + 跨仓协调面 · 约定位置——隐式不可核）→ `MEMORY.md` D-MEM29 ∥ `MANIFEST.md` KD-M1-35。
- **KD-2** 接入形 = 多根同步 + 读面 origin 集，复用既有 origin 机制（否决：读面全放开——跨项目污染 · 只直读——纪律单腿 · 第二索引——新系统）→ D-MEM30。
- **KD-3** **值形 ∥ 解析单一定义** = `declaredPublicRoots`（三消费面共用——父侧钉一）。
- **KD-4** 引用形 = 「声明仓目录名 + 仓内相对路径」；解析序**置后追加**（绿面零动）（否决：`..` 相对——不可移 / 不可核 · 仓别后缀形——新语法 · 裸全路径——不可定位）→ D-V5-13。
- **KD-5** 三态 = 核 ∥ 未核（报告面·不入闸）∥ 红（**越出 cwd 且未声明**）；**声明 ≠ 豁免标记**（父侧钉二 + steer 三 ④）。
- **KD-6** 记录面有界例外 = 坐标级（登记 / 归属零松——#827 照旧）→ D22 ∥ L4③ ∥ `LEDGER.md` §6.1-4。
- **KD-7** 提示词落点 = 两模式纪律层各自自持节（否决：公共层——非两模式逐句都要 · 新节——计数扰动 · 单侧——普通侧 = 业务实现主场景）→ D-PS20 ∥ D-PS21。
- **KD-8** **默认来源 = cwd 树；声明 = 微调**（steer 三 定调 · 用户 00:04 确认；否决：声明为钥匙——用户不可托管 / 缺省即不可见）——维护 = agent（句面），**不造工具 ∥ 不加机械门**。
- **KD-9** 实现 = **核内吸收**（端面四调用点零改）。
- **KD-10** 全形态覆盖、**不分期**（父侧裁——引用形态 = 硬性要求）。

### 2.7 机检口径（设计轮实测）

- `node scripts/prompt-refs-check.mjs` ⇒ **命中 0**（提示词面 84 档 ∥ 代码面 409 档——本席复跑）。
- `node scripts/doc-check.mjs` ⇒ **exit 0**：悬空 **0**（闸态阈值 0）∥ 行宽 OK ∥ 行数面差异 2 条（**既有报告态**——工单清单，非本批档）。本批 authored 修正史：初跑 6 条示例 token 悬空 + 5 行超宽（300+）⇒ 已修（示例拆分书写 ∥ 折行）；复跑 = 上述 exit 0。
- **一次性比对**（实施轮）：落地档 ↔ §2.3 围栏块 A ∥ B + **§2.9 替换行**——逐行全等（输出入 §5）；CN 新行 ≤128（草测：A-CN-1 59 ∥ A-CN-2 92 ∥ A-CN-3′ 两行 ∥ B′ 两行——实施轮复核）。
- **批内件**（实施轮落——随批档存）：① 声明投影 ② 同步展开 ③ 读面集 ④ 引用三态 ⑤ 写门 T46（五组腿；回指 = §2.4 验收列）。

### 2.8 上抛项（主 agent / 父侧域）

- **U1（需求笔 · 主 agent）**：`docs/core/requirements/PROMPT-SYSTEM.md` #832 块收正——「验收（待定形）」⇒ 实形（= §2.4）；开放点结清：① 发现方式 = manifest `index.publicRepos`（**微调位**）＋**默认来源 = cwd 树**；② 读取面分层 = 检索接入（文档 ∥ 代码同款）；「消费发布包 vs 读源」= 读源为默认面（`node_modules` 本在 SKIP_DIRS——发布包面不入射程，登记）；③ 对句已落（含维护句）；④ 载体 = manifest（单源）；⑤ 引用形态 = 声明源前缀形 + 记录面有界例外 + 三态。附一句：登记块建议补「设计定形 = 批档 §2」指针。
- **U2（裁 · 主 agent / 用户）**：实景验收主体——哪些仓声明哪些公共仓（如 `thincoder` 是否声明 `thincoder.com`——本批**零自宣**；实景可用业务仓 / 夹具替代）。`thincoder.com` = 仓外（本批零触）。
- **U3（登记 · #802 关联）**：新键继承「未知键静默丢弃」（#802 在册）——键名写错（如 `publicrepos`）静默回落；建议 #802 提级评估（本批不并）。
- **U4（登记 · 别名路径）**：声明值经 junction / subst 别名进入时 origin 归一不覆盖（§6.11 既有登记）——建议声明用真路径拼写。
- **U5（登记 · 模块消费面）**：本批射程 = 读源（声明仓树）；已装包（`node_modules`）文档面不入索引——如需，另裁。
- **U6（观察 · 端面零改自证）**：四同步调用点全部经核入口——实施轮以「任一端构建后声明源行出现在核库」抽查为证。
- **U7（观察 · 普通侧维护句写权面）**：普通纪律 item 3′ 含「随手补清单」半句（agent 托管），普通模式 manifest 维护面为本批新面——如判越界 ⇒ 可单点撤该半句（可 revert）。

### 2.9 steer 补块（四裁落位 + §2.3 替换行——本块为准）

**四裁 → 落位**：① 引用形态硬性要求（用户 23:54）→ §2.2④ ∥ §2.4-5（全形态覆盖、不分期）；② 钉一（值形 ∥ 解析单一定义）→ `MEMORY.md` §6.15 值形段 ∥ `MANIFEST.md` KD-M1-35 ∥ §2.2①；③ 钉二（三态独立谓词）→ `DOC-DISCIPLINE.md` §4.2.2 ∥ L-6.15-4；④ steer 三 定调（默认来源 = cwd ∥ 声明 = 微调 ∥ agent 托管 ∥ 软降级——用户 00:04 确认）→ `MEMORY.md` §6.15 默认来源段 ∥ `PROMPT-SYSTEM.md` §6.15 来源模型段 ∥ §2.2①；红对象 = 越出 cwd 且未声明 → §2.2④ ∥ L-6.15-4-③。

**替换行（§2.3 围栏块 A ∥ B 对应行以本块为准；双面对应表 Δ 随正：engineering +3（item 1 续行 1 ∥ item 14 两行）∥ normal +2（item 3 两行））**：

```text
[A-CN-3′]（替换 §2.3 的 [A-CN-3]；CN 现 :126 item 13 后新增两行）
14. **自持管写；读取不限**——自持约束只辖写侧：**工作目录树下的内容默认可查可读可引**；**越出工作目录的源按声明查**（项目 manifest `index.publicRepos`）。
    **实施 / 设计前先查声明源**；**发现缺源 ∥ 噪声 ⇒ 随手补清单**（轻动作）；**读 ≠ 写 ≠ 耦合**。
[A-EN-3′]（替换 [A-EN-3]；EN 现 :129 item 13 后新增两行）
14. **Self-containment governs writes; reading is unrestricted** — the self-containment rules cover the write side only; **content under the working directory is searchable, readable and citable by default** — **sources beyond the working directory are read per the declaration** (project manifest `index.publicRepos`).
    **Check the declared sources before implementing / designing**; **missing sources or noise ⇒ top up the list as you go** (a light action); **reading ≠ writing ≠ coupling**.
[B-CN′]（替换 §2.3 的 [B-CN]；CN 现 :38 item 2 后新增两行）
3. **自持管写；读取不限**——自持约束只辖写侧：**工作目录树下的内容默认可查可读可引**；**越出工作目录的源按声明查**（项目 manifest `index.publicRepos`）。
    **动手前先查声明源**；**发现缺源 ∥ 噪声 ⇒ 随手补清单**（轻动作）；**读 ≠ 写**。
[B-EN′]（替换 [B-EN]；EN 现 :38 item 2 后新增两行）
3. **Self-containment governs writes; reading is unrestricted** — the self-containment rules cover the write side only; **content under the working directory is searchable, readable and citable by default** — **sources beyond the working directory are read per the declaration** (project manifest `index.publicRepos`).
    **Check the declared sources before starting work**; **missing sources or noise ⇒ top up the list as you go** (a light action); **reading ≠ writing**.
```

未替换者 = [A-CN-1] ∥ [A-CN-2] ∥ [A-EN-1] ∥ [A-EN-2]（照 §2.3 原文）。

**§2.9 补记（终读）**：三态③ 全文以「`越出 cwd ∧ 未声明` ⇒ 照旧判（悬空红）」为准（替换 §2.2④ 与 L-6.15-4 的旧表述；设计档已按新表述落定）；替换行 CN 行宽实测 = **100 ∥ 64 ∥ 99 ∥ 54**（≤128 ✓）；本段 READ-BACK = 批档 257 行 · 状态行在册（D6 核讫）。

**2026-10-03 · 修正轮 1（评审 #20 发现 1–8 · 父侧全采纳）· eng-designer**

**逐号处置（号 → 改动，读回 D6 在册）**：

1. 🔴 两形态射程写死（声明源前缀形 vs §2 旧形态规范）——`docs/core/design/DOC-DISCIPLINE.md`：`:62`（V4 行补「声明源前缀形除外」）∥ `:68`（「加仓前缀」句限定 V1 面）∥ `:70–71`（契约补射程句）∥ `:72–74`（新增「两形态射程」块——①（仓别）形 = 文本规范形／未声明仓；② 声明源前缀形 = 合法可核坐标／声明仓——携 `.md`／路径前缀照旧合规；覆盖关系明写）∥ `:76`（「后续选项（登记）」⇒ 已以声明源路兑现——他仓扫描根 = 声明根）∥ `:1003`（§4.2.6 V4 行补「两形态射程」指路）；`docs/core/design/LEDGER-SELF-CONTAINED.md`：`:112` ∥ `:157` ∥ `:167–172` 枚举后新增「声明源前缀命中 = 除外」段（三处随正）。
2. 🟡 多 origin 查询形钉死——`docs/core/design/MEMORY.md:598`（**逐 origin 分趟**——单 origin 等值 ⇒ 游标键 `["path","line_start"]`；不取「IN + 全 PK 游标」形（D-MEM22 否决形同构相邻）；合并与趟序／到达序无关——并列定序 = PK 元组升序）+ `:608`（L-6.15-3 补**计划腿**——`runChunkedQuery` 缝 + `EXPLAIN QUERY PLAN` 读数形：趟数／单 origin 等值谓词／游标键／无 TEMP B-TREE／合并确定性）。
3. 🟡 两层输出定义钉死（值形 = 归一后相对串（声明投影）∥ 解析 = 绝对根集（`normalizeOrigin` 消费））——`MEMORY.md:591–592` ∥ `d:\teamcode\thincoder\docs\core\design\MANIFEST.md:284`（KD-M1-35 补两层定义——细则单源 = `MEMORY.md` §6.15）；判据腿各指其层——`MEMORY.md:604`（L-6.15-1 标「断值形层」+ 解析层消费腿指路）∥ `MANIFEST.md:604`（AC-37 标「值形层」）。
4. 🟡 `MEMORY.md:612`（§6.15 边界段）补包面边界句——读源为默认面；发布包／已装包（`node_modules` 树）不入射程（SKIP_DIRS 既有排除——登记；如需消费另裁）。需求块结清（U1）= 父侧笔——本轮未动。
5. 🟡 批档 §2.5 实施面表随正 = 下条「2.5-随正」块。
6. 🟡 `MANIFEST.md:128` ∥ `:282`（KD-M1-33）∥ `:602`（AC-33——同类相邻补正）指路随正为 `declaration.mjs`（2026-10-01 core 拆分批自 `conventions.mjs` 迁出——经其转口可达；实况核 = `PORTABILITY.md` §2）。
7. 🔵 `PROMPT-SYSTEM.md:389` 行宽读数按实测回填——A-CN-1 59 ∥ A-CN-2 92 ∥ 替换行 100 ∥ 64 ∥ 66 ∥ 54（以批档 §2.9 为准）。
8. 🔵 判据面措辞收正——`DOC-DISCIPLINE.md:938` ∥ `MEMORY.md:610`（L-6.15-4③）：「越出 cwd ∧ 未声明」⇒ **「不可解析 ∧ 未声明」**（cwd 口径留存行为面句；§2.9 补记旧措辞以本轮为准）。

**读回与机检**：8 处逐处回读在册（含标记复读）；设计档 5 档变更记录各 +1 行；`node scripts/doc-check.mjs` 复跑 ⇒ **exit 0 ∥ 悬空 0 ∥ 行宽 OK**。

**2.5-随正（发现 5）**：实施面表 **Δ 列按上界形读**（`+~N` ⇒ `≤ +N`）；行 10 `scripts/doc-check-anchors.mjs` 327 ⇒ **≤ +35**（≤ 362——越 300 软线；未越 500 硬限）。**>300 处置（行 10）**：方案 = 抽取族（`extractAnchors` ∥ `codeSpanIdentifiers` ∥ `pointerRanges` + 注记／占位／抽取正则常量族）拆出邻档 `scripts/doc-check-anchors-extract.mjs`（拟新增——纯结构搬移零语义；缝 = re-export 保消费面〔`doc-check.mjs` ∥ 用例〕零改）；触发条件 = 越 500 硬限，或下一次触碰该档的批（触碰批复核：越限 ⇒ 拆；未越限 ⇒ 回填行数账）。其余代码档增量后峰值 ≤288（`code-sync.mjs`——<300 在界内）。

**2026-10-03 · 设计微修正轮 3（`#24` 内部评审 🟡①——普通面补锚 · 父侧裁决采纳；+ §2.3 Δ 随正 追单）· eng-designer**

**逐号处置（号 → 改动，读回 D6 在册）**：

1. 🟡 **普通面「声明源」无锚**（`#24` 报告·响应表 #1；父侧裁决 = **采纳**——选项①补锚，非从简）——本档 `:248` [B-CN′] ∥ `:251` [B-EN′] 两行「按声明查」/「read per the declaration」后半句补锚（逐字）：`（项目 manifest \`index.publicRepos\`）` ∥ `(project manifest \`index.publicRepos\`)`（与 [A-CN-3′]/[A-EN-3′] 同形；两行其余逐字不动）；**重复面随正** = `docs/core/design/PROMPT-SYSTEM.md:381`（§6.15 机制摘要含该半句——补同形锚）+ 读数随正 2 处（本档 `:257` ∥ `PROMPT-SYSTEM.md:389`——替换行 CN 行宽 66 ⇒ **99**，D3 直接派生 · ≤128 保持）+ `PROMPT-SYSTEM.md` 变更记录 +1 行。
2. 🟡 **§2.3「双面对应（落点表）」Δ 残留随正**（承 `#26` 范围外注记① · 父侧追单）——`:151` +2 ⇒ **+3** ∥ `:153` +1 ⇒ **+2**（父侧点名两行）；同笔随正 `:152` ∥ `:154`（同表同残——EN 两面同值 **+3 ∥ +2**）+ `:151`/`:153` 描述半句「item 14 +1 行」/「item 3 +1 行」⇒「两行」（与 §2.9 `:238` 分解语「item 1 续行 1 ∥ item 14 两行 ∥ item 3 两行」及 §5 实测 169 ⇒ 172 ∥ 204 ⇒ 206 一致）。
3. **U7 定裁（入档）**：普通侧维护句（「随手补清单」半句）＝**保留**——用户 2026-10-03 00:04 已批「清单归 agent 托管」⇒ 不越界；**U7 结**。

**读回与机检**：全部落点（`:248` ∥ `:251` ∥ `:257` ∥ `:151–:154` ∥ `PROMPT-SYSTEM.md:381` ∥ `:389` ∥ 变更记录行）逐处回读在册；一次性比对（§2.9 两行）= **新旧仅锚差异** ✓（行宽复测 = 100 ∥ 64 ∥ 99 ∥ 54 ≤128 ✓）；`node scripts/doc-check.mjs` 复跑 ⇒ **exit 0**（闸态悬空 0 ∥ 行宽 OK ∥ 行数面差异 2 条 = 既有报告态）；`node scripts/prompt-refs-check.mjs` ⇒ 命中 0。

**待落（后续 coder 微轮 · 非本席笔）**：普通面提示词实体两档现盘无锚——`docs/core/design/prompts/discipline-normal.md:39` ∥ `thincoder-core/prompts/discipline-normal.md:39`（随 coder 微轮落锚——§5 一次性比对按新源复跑；工程两档已带锚 = `:128` ∥ `:131`，无须动）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**设计评审（评审子代理 · 轮 1）——审查对象 = 批档 §2（设计自述）∥ 设计档 7 档增量（MANIFEST §2.2/KD-M1-35/AC-37 · MEMORY §6.15/L-6.15-1–4/D-MEM29-30 · PROMPT-SYSTEM §6.15/D-PS20-21 · DOC-DISCIPLINE §4.2.1/§4.2.2⑥/§4.2.5/§4.2.6-V4/D-V5-13 · LEDGER-SELF-CONTAINED L4③/§5.1/D22 · DOC-SYSTEM R6 · LEDGER §6.1-4/AC-M2-10/T46）**

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership | 🔴 | 同一机制（跨仓引用合法形态）两处描述相抵：`docs/core/design/DOC-DISCIPLINE.md` §2 的 V4 定义（`:62`「正文引用他仓文档的形态须在**封闭枚举 E1–E5** 内——枚举外即红」）与 V1 跨仓边界契约（`:71`「引用他仓文档**不得写 `X.md §N` 形态**——写「名称（仓别）§N」…：去 `.md` 后缀、去路径前缀」· `:68`「加仓前缀也无效」· `:73`「后续选项（登记）」）本批零随正；而同批新增 `DOC-DISCIPLINE.md:1000`「声明源前缀形（§4.2.2 ⑥）= 合规坐标」· `docs/core/design/DOC-SYSTEM.md:211` R6（声明源前缀形 = 跨仓合法形）· `docs/core/design/LEDGER-SELF-CONTAINED.md:178` 声明源形块（合法形 = 声明仓目录名 + 仓内相对路径——携 `.md`、携路径前缀，正为 §2 所禁形）——且 `:1000` 自身仍以 §2 为「形态规范」（同行使两读法并存） | 随正 §2 `:62` / `:66–73`（连同 `LEDGER-SELF-CONTAINED.md:157` 归一化句 / `:167–172` 判红规则枚举）：明写声明源前缀形的定位（合法坐标）及它与（仓别）形态各自的射程；`:73`「后续选项（登记）」收正为已以声明源路兑现（他仓扫描根 = 声明根；不得硬编码已满足） |
| 2 | Feasibility / Clarity | 🟡 | 多 origin 读面契约过薄：`MEMORY.md:597` 以「`origin IN (…)` + 游标回**全 PK**…同「无过滤」款」一句带过；而 `thincoder-core/memory/scan.mjs:14–17` 头注与 `MEMORY.md:634` D-MEM22 登记的否决形 = 「全 PK 元组 + 前导列等值并存 ⇒ 每块从头扫起 = **静默二次方**」——多 origin 形（前导列 IN 约束 + 全 PK 元组）与之同构相邻，未见计划级取证或判据腿（L-6.15-3 只判命中集） | 钉死多 origin 查询形（候选：逐 origin 分趟——单 origin 等值 ⇒ 键 `["path","line_start"]`；合并与到达序无关）并在 L-6.15-3 补计划腿（计划读数形态判据） |
| 3 | Clarity | 🟡 | `declaredPublicRoots(cwd)`「值形 ∥ 解析单一定义」（`MEMORY.md:591` ∥ `MANIFEST.md:284`）与判据腿读数层不一：定义 = `resolve(decl.root, p)` + 归一 + 去重（输出应为绝对根集），而 L-6.15-1（`MEMORY.md:602`）与 AC-37（`MANIFEST.md:604`）断言的是**相对形投影**（`["../docs-repo","../mods"]` / `["x"]`）——「值形归一」与「解析」两层各自输出什么、各腿断言哪层未钉死 | 明写两层输出定义并让两条判据腿各指其层：值形 = 归一后相对串（声明投影）；解析 = 绝对根集（`normalizeOrigin` 消费面） |
| 4 | Requirements | 🟡 | 需求块「验收（待定形）」（`docs/core/requirements/PROMPT-SYSTEM.md:123`）与开放点②（`:119`，含「消费发布包 vs 读源」边界）未结清；设计把结清内容放在批档 §2.8-U1（`:222`）/U5（`:226`）＝一次性面，`MEMORY.md` §6.15「边界」段（`:608`）未载该包面边界（读源为默认面 ∥ 已装包不入射程）——协调项（非缺陷） | 把结清内容回填需求块（= 批档 §2.8-U1 项）；同时在 `MEMORY.md` §6.15 边界补一句包面边界（`node_modules`/已装包不入射程——登记面单源） |
| 5 | Affected-file annotations | 🟡 | 批档 §2.5 实施面表未按 >300 软线对 `scripts/doc-check-anchors.mjs`（批档 `:194` 实读 327 ⇒ ~362）登记拆分评审（方案 + 触发；同 `MANIFEST.md` §2.3 注惯例）；其余代码档增量后 ≤288 在界内；Δ 为「+~N」估算而非 ≤ 上界形 | 补 >300 处置一行（拆分方案 + 触发条件）；Δ 收成上界形（≤ +N） |
| 6 | Doc state | 🟡 | `MANIFEST.md:128`（§2.2 读向行）与 `:282`（KD-M1-33）仍书三族投影装载面 = `conventions.mjs`——现体 = `declaration.mjs`（2026-10-01 core 拆分批；`conventions.mjs` = 转口，见 `PORTABILITY.md:32`）；本批同块已落 `publicRepos` 且 KD-M1-35（`:284`）已指 `declaration.mjs`——跨文件指针滞后 | 两处指路随正（或注明「经 `conventions.mjs` 转口可达」） |
| 7 | Doc hygiene / numeric | 🔵 | `PROMPT-SYSTEM.md:389` 行宽读数（59/92/98/87）与批档 §2.9 终稿替换行读数（100 ∥ 64 ∥ 66 ∥ 54；该块自称「本块为准」，批档 `:253`）不一致 | 以实施轮一次性比对实测回填，或注明以批档 §2.9 为准 |
| 8 | Doc state / wording | 🔵 | 机检三态③形写作「越出 cwd ∧ 未声明」（`DOC-DISCIPLINE.md:935` ∥ `MEMORY.md:605`）——机检基底 = 仓根 / 锚域根（`scripts/doc-check*` 无会话 cwd 概念），实现侧易误读 | 判据面改「不可解析 ∧ 未声明」（cwd 口径留行为面句） |

**评审口径注**：① 项目未声明 Project Standards 文档、无 Document Map ⇒ ownership 判据降级核（按 Project Guide + 设计档自述互核）；② 批档 §2 按声明为任务书（设计自述），其上抛项 U1–U7 已逐条核位；③ 抽核 = 批档 §2.5 实施面 12 档现行行数与盘面一致（`doc-check-anchors.mjs` 327 · `code-sync.mjs` 258 · `docs.mjs` 222 · `code-search.mjs` 138 · `setup.mjs` 267 · `manifest-schema.mjs` 164 · `conventions.mjs` 173（转口）· `manifest.mjs` 251 · `ledger-cmd.mjs` 131 · `doc-check.mjs` 91；设计档 7 档读数同拍）；④ `declaration.mjs`（173 行）在盘——`declaredPublicRoots` 归此档与三档指路一致（`MEMORY.md:591` ∥ `DOC-DISCIPLINE.md:937` ∥ `MANIFEST.md:284`），无悬空。⑤ 机制条文本体（判据腿 L-6.15-1–4 · AC-37 · T46 · D-V5-13 · R6）可机判、覆盖正常 / 边界 / 错误三面——除上表第 2 / 3 行外无缺腿。

**发现计数 = 1🔴 · 5🟡 · 2🔵（共 8）**

**VERDICT: changes-required**

### 轮次 2（评审子代理）

**设计评审（评审子代理 · 轮 2——修正轮 1 落地核验：只核轮 1 发现 1–8 + 明显新问题）**

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | DOC-DISCIPLINE.md ∥ LEDGER-SELF-CONTAINED.md | 🔴→消 | Fixed | `:62` V4 行补「声明源前缀形除外（合法可核坐标（§4.2.2 ⑥）；射程 = 声明公共仓——「两形态射程」见 §2 V1 跨仓边界）」；`:68`「加仓前缀」句限定 V1 面；`:71` 契约句补「本句射程 = 未声明仓 ∥ 不可核面；已声明公共仓 = 「两形态射程」②」；`:72–74` 新增「两形态射程」块（①（仓别）形 = 文本规范形／未声明仓；② 声明源前缀形 = 合法可核坐标／声明仓——携 `.md` / 路径前缀照旧合规）+ 覆盖关系；`:76`「后续选项（登记）」⇒ 已以声明源路兑现；`:1003` V4 行「两形态射程」指路。LEDGER-SELF-CONTAINED `:112`（§3.1 收紧块）∥ `:157`（收紧判据）∥ `:174`（判红规则枚举后新增「声明源前缀命中 = 除外」段）三处随正——同一机制两处描述已归一；变更记录在册（`:1653` / `:343`）。 |
| 2 | 2 | MEMORY.md | 🟡→消 | Fixed | `:598` 多 origin ⇒ 逐 origin 分趟（单 origin 等值 ⇒ 游标键 `["path","line_start"]`）；明写「**不取**「`origin IN (…)` + 全 PK 游标」形（与 D-MEM22 否决形同构相邻——未取证形不引）」；`:608` L-6.15-3 补**计划腿**（趟数 / 单 origin 等值谓词 / 游标键 / `EXPLAIN QUERY PLAN` 读数含无 `TEMP B-TREE` / 合并确定性）；腿引缝 `runChunkedQuery` 实存（`:273` ∥ `:368` 在册）。 |
| 3 | 3 | MEMORY.md ∥ MANIFEST.md | 🟡→消 | Fixed | `:591–592` 两层输出分列（① 值形层 = 归一后相对串（声明投影，本层不解析）；② 解析层 = `declaredPublicRoots(cwd)` 逐项 `resolve(decl.root, p)` ⇒ 绝对根集——`normalizeOrigin` 消费）；`:604` L-6.15-1 标「断值形层」+ 解析层消费腿指路；MANIFEST `:284` KD-M1-35 两层定义（细则单源 = `MEMORY.md` §6.15）；`:604` AC-37 标「值形层」。 |
| 4 | 4 | requirements/PROMPT-SYSTEM.md | 🟡 | Open（协调项——非缺陷 · 不阻断） | 设计档侧已落（MEMORY.md `:612` 包面边界句「**读源为默认面；发布包 ∕ 已装包（`node_modules` 树）不入射程**」）；需求块仍书「**验收（待定形）**」（`:123`）——父侧笔 U1 待落（批档 `:264`「需求块结清（U1）= 父侧笔——本轮未动」；上抛项既有编号在册）。 |
| 5 | 5 | 批档 §2.5 | 🟡→消 | Fixed | 批档 `:272`「2.5-随正」：Δ 列按上界形读（`+~N` ⇒ `≤ +N`；行 10 ⇒ ≤ +35）∥ `scripts/doc-check-anchors.mjs`（327）>300 处置在册（拆分方案 = 抽取族拆出 `scripts/doc-check-anchors-extract.mjs`、缝 = re-export；触发 = 越 500 硬限 ∥ 下一次触碰该档的批；其余代码档峰值 ≤288 在界内）。 |
| 6 | 6 | MANIFEST.md | 🟡→消 | Fixed | `:128` 读向行 ∥ `:282` KD-M1-33 ∥ `:602` AC-33（同类相邻）指路随正为 `thincoder-core/declaration.mjs`（2026-10-01 core 拆分批自 `conventions.mjs` 迁出——经其转口可达）。 |
| 7 | 7 | PROMPT-SYSTEM.md | 🔵→消 | Fixed | `:389` 行宽读数按实测回填（A-CN-1 59 ∥ A-CN-2 92 ∥ 替换行 100 ∥ 64 ∥ 66 ∥ 54——以批档 §2.9 为准）。 |
| 8 | 8 | DOC-DISCIPLINE.md ∥ MEMORY.md | 🔵→消 | Fixed | `:938` ∥ `:610` 三态③ 判据面 ⇒「**不可解析 ∧ 未声明**」；批档 `:268` 标注「cwd 口径留存行为面句；§2.9 补记旧措辞以本轮为准」——行为面 / 决策记录面残留 cwd 措辞按声明留存，非缺陷。 |

**新问题（修正引入 · 明显项）：无**——fix 文本与周边逐处互核一致（DOC-DISCIPLINE `:1003` ∥ DOC-SYSTEM R6 `:211` ∥ §5.1 枚举 / 判红规则 ∥ L-6.15-3 / 4 ∥ AC-37 ∥ KD-M1-35）；5 档变更记录各 +1 行在册（DOC-DISCIPLINE `:1653` · LEDGER-SELF-CONTAINED `:343` · MEMORY `:694` · MANIFEST `:686` · PROMPT-SYSTEM `:521`）。

**发现计数（轮 2）= 🔴 0 · 🟡 1（协调项 · 非阻断）· 🔵 0；轮 1 🔴（发现 1）全消。**

**VERDICT: pass**

## §4 用户批准（主 agent）

**§4 用户批准（主 agent · 代签 · 2026-10-03 00:2x）**：**依据**（用户 00:05「后续这部分也全自动落地吧」全链自动授权）：① **评审**——轮 1 = changes-required（1🔴 · 5🟡 · 2🔵；修正轮 `#21` 全采纳 8/8）→ 轮 2 = **pass**（0🔴；🟡 1 = 协调项〔需求块 U1 = 父侧笔〕——非阻断）——发现表 = §3 两轮在册；② **修正落地核验**——`#21` 产物父侧抽查 8/8 在位 + 门复跑（悬空 0 · 行宽 OK）+ 复评轮 2 逐条核讫；③ **designToken 已签发**（轮 2 通过回执——值不落档）。**批准 = 实施轮准行**：CN 提示词面 = eng-designer 笔 ∥ 核 8 档 + scripts 2 档 + EN 提示词 = eng-coder（带凭证）∥ 批内件随批档存；U1（需求块收正）= 父侧笔（本轮落）。

**§4 勘误（父侧 · 2026-10-03 00:3x——承 `#23` 上抛与归属裁决）**：① 本 §4 正文「CN 提示词面 = eng-designer 笔」= **路由错误**（D1：提示词（含 CN 模板）= 主 agent 内容权 + **eng-coder 落笔**）——以 §1「归属裁决」为准；本批 CN 落笔 = `#26`（改派）。② 同款错误记述亦见 §2.0 笔路行与承批 `#827`/`#830` 的 CN 派发——内容面均逐行核验无误；路由自本批纠正（`#827` 档已冻结：其 §5/§6 的 CN 记述以本 errata 落，不改档）。③ §2.7「一次性比对输出入 §5」与 CN 落笔归派 = 裁决后自洽（CN 由 eng-coder 落 ⇒ 比对输出入 §5 无碍）。④ `#23` 的处置（零写入 + 停报 + 转派材料齐备）= 正确执行。

## §5 实施记录（eng-coder）
**状态行**：实施完成 2026-10-03（三段 eng-coder 记录（本段）：① CN 提示词面落笔 ② 核面（#832 核 9 档 + 批内件——先红后绿 5/5→4/5，④ 红 = scripts 父侧面依赖 · 已披露）③ 普通面补锚微轮（#27 后两处行内补锚 · 一次性比对 8/8 · 偏离审计 + advisor 代码评审 pass · fix round 0 · 终态 clean））


**交付摘要（CN 提示词面 · 两档四笔——逐字 = §2.3 围栏块 A/B + §2.9 替换行「本块为准」）**：

- ① **工程档** `docs/core/design/prompts/discipline-engineering.md`（「文档与台账自持」节）：item 1 续行 +1（`[A-CN-1]` · §2.3）∥ item 12 句尾并入（`[A-CN-2]` · §2.3 · Δ+0）∥ item 13 后新增 item 14 两行（`[A-CN-3′]` · §2.9 替换行）——169 ⇒ **172**（Δ **+3**）。
- ② **普通档** `docs/core/design/prompts/discipline-normal.md`（「文档体系自持」节）：item 2 后新增 item 3 两行（`[B-CN′]` · §2.9 替换行）——204 ⇒ **206**（Δ **+2**）。

**落地表（file:line × Δ · D6 读回后）**：

| # | 档 | 内容 | 落点 | Δ | 读回 |
|---|---|---|---|---|---|
| 1 | `docs/core/design/prompts/discipline-engineering.md` | [A-CN-1] item 1 续行 | **:112** | +1 | ✓ |
| 2 | `docs/core/design/prompts/discipline-engineering.md` | [A-CN-2] item 12 句尾并入 | **:126** | +0 | ✓ |
| 3 | `docs/core/design/prompts/discipline-engineering.md` | [A-CN-3′] item 14（两行） | **:128–129** | +2 | ✓ |
| 4 | `docs/core/design/prompts/discipline-normal.md` | [B-CN′] item 3（两行） | **:39–40** | +2 | ✓ |

**一次性比对输出（落地档 ↔ §2.3 + §2.9 逐字源 · byte 全等——复跑终读）**：

```text
== 一次性比对（落地档 ↔ §2.3 + §2.9 逐字源 · byte 全等）==
PASS | [A-CN-1]    | docs/core/design/prompts/discipline-engineering.md:112 | 源 批档:124 | 出现次数=1 | 行宽=59
PASS | [A-CN-2]    | docs/core/design/prompts/discipline-engineering.md:126 | 源 批档:126 | 出现次数=1 | 行宽=92
PASS | [A-CN-3′L1] | docs/core/design/prompts/discipline-engineering.md:128 | 源 批档:242 | 出现次数=1 | 行宽=100
PASS | [A-CN-3′L2] | docs/core/design/prompts/discipline-engineering.md:129 | 源 批档:243 | 出现次数=1 | 行宽=64
PASS | [B-CN′L1]   | docs/core/design/prompts/discipline-normal.md:39 | 源 批档:248 | 出现次数=1 | 行宽=66
PASS | [B-CN′L2]   | docs/core/design/prompts/discipline-normal.md:40 | 源 批档:249 | 出现次数=1 | 行宽=54
相邻性：A-CN-3′ L1→L2 连续 = true · B-CN′ L1→L2 连续 = true
读数：ENG = 172 行 · ## = 8 · ### = 7
  　　NOR = 206 行 · ## = 6 · ### = 14
总判定： ALL PASS（6/6 全等 · byte 级）
```

**机检读数（复跑）**：

- `node scripts/prompt-refs-check.mjs` ⇒ `汇总：提示词面 84 档 · 代码面 409 档 · 命中 0` ∥ `OK(prompt-refs): J1/J2/J3 三式零命中`（exit 0）。
- `##` 块计数：engineering **8** ∥ normal **6**——不变（无新 `##` 节 · 无重排）；`###` 亦不变（7 ∥ 14）。
- CN 新行宽：59 / 92 / 100 / 64 / 66 / 54（**≤128** ✓ · 与 §2.9 实测读数一致）。
- 行数：169 ⇒ **172** ∥ 204 ⇒ **206**——与 §2.9「双面对应表 Δ 随正」一致。
- `git diff`（限两档）：engineering 2 hunk（+1 行 ∥ item 12 改行 + item 14 两行）∥ normal 1 hunk（+2 行）——仅本笔 4 处、零他改（`git status` 17 档 M 中仅 2 档属本单）。
- D6 读回：两档落点区段逐行复读 ✓（前导空格 / 全角标点 / `∥` ∥ `⇒` ∥ `≠` 逐字）。

**决策透明表**：

| # | 决策 | 依据 / 理由 |
|---|---|---|
| 1 | `[A-CN-3′]` ∥ `[B-CN′]` 取 **§2.9 替换行**（非 §2.3 旧稿）；`[A-CN-1]` ∥ `[A-CN-2]` 照 §2.3 原文 | §2.9 自称「本块为准」（未替换者清单在册）；旧稿哈希两档零命中（审计反证） |
| 2 | 逐字落 · 前导空格照搬（续行 3 / 4 空格） | 验收 = 与逐字源逐行全等；零改写 · 零压缩 · 零重排 |
| 3 | 一次性原子落笔（单 `edit` 调用 4 笔 · 两档） | 单次审批 · 原子（任一失败零写） |
| 4 | 两档外零改动 | EN 两档 ∥ 核心 ∥ scripts ∥ 设计档 = 他舱 / 他单在途；本单射程恰两档 |

**审计 / 代码评审轮次与终态**：

- **内部偏离审计（explore 子代 · 只读）轮次 1**：结论 **CLEAN**（四类偏差零）——① 6 行对逐字源**行哈希全等**（含前导空格——定长 grep 精确锚定）；② 旧版反证（[A-CN-3]/[B-CN] 哈希两档零命中——无误落旧稿）；③ 件外零改动（全档细读 + 行数 / 节数守恒 + 主题短语全档 grep 无散落 / 重复）；④ Δ = +3 ∥ +2 与 §2.9 一致。限制声明：审计装配无 git / execute（「零其他改动」以细读 + 守恒佐证）。
- **advisor 代码评审（type=code）轮次 1**：**VERDICT pass**（🔴 0 ∥ 🟡 0 ∥ 🔵 2 非阻断 + 核验记录 + 范围外注记）。**响应表**：

| # | Action | Detail |
|---|---|---|
| 1 | Deferred | 🔵 普通档「声明 / 声明源」（`:39–40`）无档内可查定义（对照工程档 `:128` 括注 manifest 键）——**非缺陷**（逐字落笔达标；省略 = §2.9 [B-CN′] 原文）；补定义 = 主 agent 内容权面（先改逐字源 + 重跑一次性比对），本席零动作 |
| 2 | Not an issue | 🔵 普通档 `:40`「随手补清单」维护半句（manifest 维护面）——批档 §2.8-U7 已登记（设计已裁 · 用户 00:04 确认）；撤销 = 单点 revert，留父侧裁 |

- **host 引用核验旗标（0/3）说明**：advisor 报告附 host 旗标——三条均系**引用截断形态**（省略号 / 去缩进前缀），非内容不符；两行经三重独立佐证：① 一次性比对 byte 全等（6/6）② 审计行哈希全等 ③ 落笔后复读（eng`:112` = 59 字符 · nor`:40` = 54 字符，与逐字源逐位一致）。零动作。
- **fix round**：**0**（0 🔴；两条 🔵 均非本轮可修面）。**终态：clean**。
- **上抛 / 在场项（供 §6）**：① 批档 §2.3 双面对应表 Δ 残留（`:151` 记 +2 ∥ `:153` 记 +1——与 §2.9 `:238` 随正 / 实施面表 `:200` 的 +3 ∥ +2 不一致；本席实测 = +3 ∥ +2，以 §2.9 为准——父侧 / 设计侧笔）；② 提示词公共层 `docs/core/design/prompts/common.md:128`「跨仓建档会被拒——那是正确行为」读侧限定缺失（KD-7 已裁落点，登记备查）；③ 审计 / 评审限制声明（各如上）。

**2026-10-03 · 核面实施记录（eng-coder · initial 轮 · 台账 #832——核 9 档 + 批内件；批档 §2.5 实施面行 1–9 ∥ 行 14）**

**交付摘要**：公共仓读取批**核侧**（声明位 ∥ 检索接入 ∥ 读面集 ∥ 写门）按 §2.5 行 1–9 落地 + 批内件五组腿；**端面四调用点零改**（`git status` 对照：本舱笔 = 9 核档 M + 2 新档〔批档 ∥ 批内件〕；其余 M 档 = 他笔）。**先红后绿**：同一批内件对批前码（HEAD 九档 · tmp 副本实跑——工作树 / git 状态零触碰）**5/5 红**；落地后 **4/5 绿**（①②③⑤）——④ 引用三态腿红 = `scripts/**` 父侧面（声明源候选 ⑥ ∥ 报告字段）未落地的依赖红，**如实记录 · 不阻塞**；终绿由父侧两侧并齐后复跑。

**落地表（file:line × Δ——基线 = 施工前盘面行数；上界形 = §2.5-随正）**：

| # | 档 | 落点（主锚 · 现盘面） | Δ | 上界 |
|---|---|---|---|---|
| 1 | `thincoder-core/manifest-schema.mjs` | `:48` 缺省 `publicRepos: Object.freeze([])`；`:128–130` 数组层 fail-closed | +3 | ≤+12 ✓ |
| 2 | `thincoder-core/declaration.mjs` | `:51–62` `normalizePathList`（excludePaths ∥ publicRepos 归一单源）；`:79–93` 投影（`:93` publicRepos）；`:130–141` `declaredPublicRoots` 新导出 | +22 | ≤+22 ✓ |
| 3 | `thincoder-core/conventions.mjs` | `:172` 转口 +`declaredPublicRoots`（同引用） | +0 | ≤+1 ✓ |
| 4 | `thincoder-core/manifest.mjs` | `:12–15` 头注（三族键 + `declaredPublicRoots` 指路 ∥ 读向随正 `declaration.mjs`） | +1 | ≤+2 ✓ |
| 5 | `thincoder-core/memory/code-sync.mjs` | `:25–37` `declaredRootEntries`；`:40–50` `gitSync` 展开（null 契约保持）；`:46–47` ∥ `:86–87` 回退支内胆调用；`:146–150` `codeSync` 展开 + `codeSyncDir` 单根内胆 | +29 | ≤+30 ✓ |
| 6 | `thincoder-core/memory/docs.mjs` | `:12–13` 导入；`:27–31` `docSync` 展开；`:34` `syncDocRoot` 内胆（**导出**——供 gitSync 回退支跨档调用）；`:113` ∥ `:143–153` 读面集 ∥ 逐 origin 分趟 | +11 | ≤+15 ✓ |
| 7 | `thincoder-core/memory/code-search.mjs` | `:11` 导入；`:19–24` `searchOrigins` 新导出；`:36–39` FTS 集；`:65–75` 逐 origin 分趟 + 2 元组游标 | +12 | ≤+12 ✓ |
| 8 | `thincoder-core/agent/setup.mjs` | `:23` 导入；`:115–121` B3 计数行 origin 集 | +2 | ≤+5 ✓ |
| 9 | `thincoder-core/ledger-cmd.mjs` | `:14–17` 导入；`:61–68` 声明源候选（T46——同名多仓取声明序首者） | +10 | ≤+10 ✓ |
| 14 | `docs/batches/2026-10-02-public-repo-read.test.mjs` | 新档 392 行（五组腿 ①–⑤ · 含 git 展开 ∥ 两回退支 ∥ 计划腿） | 新 | — |

**红绿读数（批内件实跑 · `node --test docs/batches/2026-10-02-public-repo-read.test.mjs`）**：

- **先红（批前码 × 终版测试文件 · tmp 副本）**：`tests 5 · pass 0 · fail 5`——① `TypeError: decl.index.publicRepos is not iterable`；② `AssertionError: 两 origin 各有 code 行`；③ `TypeError: codeSearchMod.searchOrigins is not a function`；④ `AssertionError: 悬空 = 1（实际 3）`；⑤ 声明源前缀形被拒。
- **后绿（落地码）**：`tests 5 · pass 4 · fail 1`——①②③⑤ 全绿 + 读数：① 值形 `[../docs-repo, ../mods]` ∥ fail-closed ∥ 缺键默认 ∥ 解析层绝对根集；② 两 origin 各行 ∥ 增量只动改动文件 ∥ 不递归 ∥ 缺位跳过 + logEvent ∥ git 径展开 ∥ **git 回退两支**；③ 声明源命中 ∥ 未声明不命中 ∥ 快径 1 趟 ∥ 多 origin 2 趟 ∥ 计划 `SEARCH code_chunks USING INDEX sqlite_autoindex_code_chunks_1 (origin=? AND (path,line_start)>(?,?))`（无 TEMP B-TREE）；⑤ 声明源前缀通过 ∥ 未声明拒 ∥ 缺位拒 ∥ 仓内零松。
- **④ 红（预期 · 面界）**：`悬空 = 1（实际 3）` = `scripts/doc-check-anchors.mjs` 声明源候选 ⑥ ∥ `doc-check.mjs` 报告字段未落地（`git status`：scripts 两档未动）——**不代写脚本面**；两侧并齐后复跑 = 终绿确认（父侧）。
- **旁证读数**：`node scripts/prompt-refs-check.mjs` ⇒ 提示词面 84 档 ∥ 代码面 409 档 · **命中 0**（exit 0）；模块导入冒烟（setup ∥ memory ∥ ledger ∥ conventions ∥ declaration ∥ code-search）= OK（静态图无环）。

**fix round（1 轮 · 代码评审 🔴 修复——红→绿成对）**：`syncDocRoot` 内胆未导出 ⇒ `gitSync` 两条回退支跨档调用 `TypeError`（评审轮 1 🔴）。**红证实** = 撤回导出后实跑：`TypeError: syncDocRoot is not a function at Module.gitSync (code-sync.mjs:47)`；**绿** = `docs.mjs:34` 导出后两回退支腿全绿（② 腿读数「git 回退两支 ✓」）。内胆体内无展开调用 ⇒ 「展开只做一层」零损。

**审计 / 代码评审轮次与终态**：

- **内部偏离审计（explore · 轮 1）**：实现面四类偏差零；唯一 🔴 = **记录面**（本节当时未写入）——已由本段落笔消解；三条 🔵 测试弱断言（gitSync 展开径未覆 ∥ 缺位腿仅 typeof ∥ 去重未直测）**全采纳**：补 gitSync 展开 + 两条回退支腿、`failed === 0` 断言、去重保序断言。
- **advisor 代码评审（type=code · 轮 1）**：🔴1（`syncDocRoot` 未导出）+ 🔵2（测试 UTF-16 序预测）+ 🔵3（`declared` 标志登记面——设计档登记项）。🔴1 ∥ 🔵2 已修（fix round 1）；🔵3 非本舱笔（设计档 = eng-designer 域）⇒ 上抛。
- **advisor 代码评审（轮 2 · 修复核验）**：**pass**（7/7 引用 host 核验命中；未引入新 🔴）。**终态：clean**（唯一未绿面 = ④ 腿父侧依赖，已披露）。
- **响应表（评审轮 1 发现处置）**：

| # | 判定 | 处置 | 证据 |
|---|---|---|---|
| 🔴1 `syncDocRoot` 未导出 | 采纳 | `docs.mjs:34` 导出内胆；批内件补两回退支腿（`:231–232` ∥ `:242–243`） | 撤回导出实跑复现（红）→ 恢复后 ② 腿绿（绿） |
| 🔵2 测试序口径 | 采纳 | 测试改 `byBytes`（BINARY 比较器 · `:269–270`） | 与 `code-search.mjs:23` 实现比较器同源 |
| 🔵3 `declared` 标志登记面 | 部分采纳 | 实现保留（与 `excludePaths` 同款值比较——PORTABILITY §3.1 口径）；登记行 = 设计档域 ⇒ 上抛 | `declaration.mjs:85`；登记面 = `MEMORY.md` §6.15 / `MANIFEST.md` KD-M1-35 |

**决策透明表（实施面裁量）**：

| # | 决策 | 理由 / 影响面 |
|---|---|---|
| 1 | `codeSync` ∥ `docSync` ∥ `gitSync` **回执 = 入口根**（公共仓结果不并计） | 调用面契约零改（`/reindex` 计数行等）；单根夹具读数与基线等值 |
| 2 | 声明根去重口径 = `normalizeOrigin`（含入口根自身跳过） | 防同树双扫（异形拼写）；声明序保序 |
| 3 | 读面集**升序 = BINARY 序**（`Buffer.compare`） | 并列定序 = PK 元组升序（origin→path→line_start）——趟序 / 到达序无关；单 origin 无影响 |
| 4 | `gitSync` 回退 = 内胆级（`codeSyncDir` + `syncDocRoot`），不调展开版 | 「展开只做一层」——防公共仓自身声明递归入册 |
| 5 | 读面**含缺位声明根** origin（不滤） | 存量行陈旧面登记在册（`MEMORY.md` §8.3）；滤掉与登记相抵 |
| 6 | ledger 写门失败文案保持原文（未声明 ∥ 缺位同一条） | 既有拒面零改（T46「照旧拒」）；无文案断言破坏面 |
| 7 | `declared` 标志纳入 `publicRepos`（值比较） | 与 `excludePaths` / `docExtensions` 同款；登记面缺口上抛（见响应表 🔵3） |

**上抛 / 越单注记（供 §6）**：① `thincoder-core/ledger-migrate.mjs`（`writeGateFlag` `:75–82`）迁移风险旗仍以「仓根解析」判 `task_book`——本批写门已扩声明源候选，二者对该形读数将不再同拍；该档**不在本批 10 档落点**（未动）⇒ 建议父侧登记（或另批随正）。② 批档 §2.2② 正文旧形（「多 origin ⇒ `origin IN (…)` + 游标回全 PK」）与修正轮 1（本档 `:264`）+ `MEMORY.md` §6.15（`:598`）钉死形（逐 origin 分趟）不一致——实现按后者；正文随正 = 设计侧 / 父侧笔。③ 🔵3（`declared` 登记面）上抛。④ ④ 腿终绿复核 = 父侧。

**2026-10-03 · 普通面补锚微轮（承 `#24` ∥ `#26` 响应表 #1 同面缺口；父侧裁决 = 采纳选项①补锚；本批 §2.9 微修正轮 3 待落项 `:286` 的落笔）· eng-coder**

**逐号处置（号 → 改动 file:line——行内补括注；零重排 · 零行数变化）**：

1. 普通面「声明源」无锚（`#24` ∥ `#26` 同报）——**点修两处**（逐字 = §2.9 更新行 [B-CN′]/[B-EN′]；开工先复读 §2.9 核讫，其余字面 byte 不动）：
   - `docs/core/design/prompts/discipline-normal.md:39` —— `**越出工作目录的源按声明查**。` ⇒ `**越出工作目录的源按声明查**（项目 manifest `index.publicRepos`）。`（+33 字符 · 行宽 66 ⇒ 99）
   - `thincoder-core/prompts/discipline-normal.md:39` —— `**sources beyond the working directory are read per the declaration**.` ⇒ `**sources beyond the working directory are read per the declaration** (project manifest `index.publicRepos`).`（+33 字符）
2. 其余字面 byte 不动：两档行数 206 ∥ 210 不变（编辑回执 = 每档 1 处行内替换 · `replaced 1 occurrence`）；工程两档 ∥ 其他档零触。

**一次性比对输出（落地档 ↔ §2.3 + §2.9 逐字源 · byte 全等——按新源复跑；批档行号 = as-of 快照〔批档并发写入中〕）**：

```text
== 一次性比对（落地档 ↔ §2.3 + §2.9 逐字源 · byte 全等）==
PASS | [A-CN-1]    | docs/core/design/prompts/discipline-engineering.md:112 | 源 批档:126 | 出现次数=1 | 行宽=59
PASS | [A-CN-2]    | docs/core/design/prompts/discipline-engineering.md:126 | 源 批档:128 | 出现次数=1 | 行宽=92
PASS | [A-CN-3′L1] | docs/core/design/prompts/discipline-engineering.md:128 | 源 批档:244 | 出现次数=1 | 行宽=100
PASS | [A-CN-3′L2] | docs/core/design/prompts/discipline-engineering.md:129 | 源 批档:245 | 出现次数=1 | 行宽=64
PASS | [B-CN′L1]   | docs/core/design/prompts/discipline-normal.md:39 | 源 批档:250 | 出现次数=1 | 行宽=99
PASS | [B-CN′L2]   | docs/core/design/prompts/discipline-normal.md:40 | 源 批档:251 | 出现次数=1 | 行宽=54
PASS | [B-EN′L1]   | thincoder-core/prompts/discipline-normal.md:39 | 源 批档:253 | 出现次数=1 | 行宽=318
PASS | [B-EN′L2]   | thincoder-core/prompts/discipline-normal.md:40 | 源 批档:254 | 出现次数=1 | 行宽=154
相邻性：A-CN-3′ L1→L2 连续 = true（:128 ∥ :129）· B-CN′ L1→L2 连续 = true（:39 ∥ :40）
读数（read 工具口径）：ENG-CN = 172 行 · ## = 8 · ### = 7
  　　NOR-CN = 206 行 · ## = 6 · ### = 14
  　　ENG-EN = 180 行 · ## = 8 · ### = 7
  　　NOR-EN = 210 行 · ## = 6 · ### = 14
CN 行宽（A-CN-1 ∥ A-CN-2 ∥ A-CN-3′L1 ∥ A-CN-3′L2 ∥ B-CN′L1 ∥ B-CN′L2）= 59 / 92 / 100 / 64 / 99 / 54（≤128 = true）
总判定：ALL PASS（8/8 全等 · byte 级）
```

**机检读数（复跑）**：

- `node scripts/prompt-refs-check.mjs` ⇒ `汇总：提示词面 84 档 · 代码面 409 档 · 命中 0`（exit 0）。
- `node scripts/doc-check.mjs` ⇒ exit 0（悬空 0 闸态 · 行宽 OK · 行数面差异 2 条 = 既有报告态）。
- `##` = 8 ∥ 6（CN 两档）· EN 同（8 ∥ 6）——不变；行数 ENG-CN 172 ∥ NOR-CN 206 ∥ ENG-EN 180 ∥ NOR-EN 210（不变）。
- CN 行宽（六行）= 59 / 92 / 100 / 64 / 99 / 54 ≤128 ✓ —— [B-CN′L1] 66 ⇒ **99**（与 §2.9 `:257` 随正读数一致）。
- D6 读回：两档 `:39` 逐字复读 ✓（CN = 全角括号 · 锚前无空格；EN = 半角括号 · 前导空格）。

**决策透明表**：

| # | 决策 | 依据 / 理由 |
|---|---|---|
| 1 | 逐字源取 **§2.9 更新行**（[B-CN′]/[B-EN′] 锚版），非 §2.3 旧稿 | §2.9 自称「本块为准」；微修正轮 3 处置行（本档 `:282`）明写两行补锚、其余逐字不动 |
| 2 | 行内补括注（零行数变化 · 零重排） | 任务单「仅加一处括注」「其余字面 byte 不动」；行内替换即最窄落笔形 |
| 3 | 比对按新源复跑（含工程四行 + EN 两行 = 8 行） | §2.9 `:286`「§5 一次性比对按新源复跑」；承 §5 上段 6 行基线扩至两语言面 |
| 4 | 两档外零改动 | 工程两档已带锚（`#27` 核讫 · 无须动）；EN 工程同 |

**审计 / 代码评审轮次与终态**：

- **内部偏离审计（explore 子代 · 只读）轮 1**：①–⑦ 全 PASS——① 两行对 §2.9 源 **byte 全等**（行哈希互证：nor-CN:39 `c1727f9afc68` ≡ 批档 :250；nor-EN:39 `8664e7ec05fe` ≡ 批档 :253）② 锚串每档恰 1 次 ③ 旧稿（未锚版整行）零命中 ④ 6 CN + 2 EN 行复跑全等 ⑤ 守恒（206 ∥ 210 · `##` 6）⑥ 零越界（全档细读 + 守恒）⑦ 与工程面同形。**唯一 🔴 = 记录面**（本节快照未写入——中间态）⇒ **由本段落笔消解**（同批 §5 核面先例）。限制声明：审计装配无 git / execute（「零其他改动」以全档细读 + 守恒 + 逐行哈希佐证）。
- 评审轮（advisor · type=code）与终态：见本段末续记。

**评审与终态（续——承上条）**：

- **内部偏离审计（explore 子代 · 只读）轮 1 复述**：①–⑦ 全 PASS（两行 byte 全等 ∥ 零越界 ∥ 守恒 ∥ 反证 ∥ 同形）；唯一 🔴 = 记录面（本节快照未写入）⇒ **由本段落笔消解**（上条即消解物 · 同批 §5 核面先例）。审计限制声明在册（无 git / 无 execute——「零其他改动」以全档细读 + 守恒 + 逐行哈希佐证）。
- **advisor 代码评审（type=code · 轮 1）**：**VERDICT pass**（🔴 0 ∥ 🟡 0 ∥ 🔵 3 非阻断）：① 批档 as-of 行号引用卫生（自声口径「批档行号 = as-of 快照」在册——非矛盾）② 锚定句五处逐字并存（四活档 + 设计摘要 `PROMPT-SYSTEM.md:381`）⇒ 维持现协议：该句任何触碰重跑一次性比对（本微轮缺口 `#24`/`#26` 即跨面失锚所致——协议必要性之实证）③ §5 上一段 :480 记 [B-EN′L1]「行宽=318」vs manifest `lineWidth: 300`——闸域 = `checkConfig.scanDirs` = `["docs"]`（`PROJECT-MANIFEST.json:25–:28`），`thincoder-core/prompts/**` 不在行宽闸内 ⇒ 读数自洽、零动作。**响应**：三条均无需修（确认在册）。
- **host 引用核验旗标（2/2 处置 · 零动作）**：① 裸档名 `PROMPT-SYSTEM.md:387` 引用 = 路径形态（缺 `docs/core/design/` 前缀 ⇒ 核验面「file unreadable」）——该行实存且引文相符（本席直读复核：`docs/core/design/PROMPT-SYSTEM.md:387` = 「**落点（双源两面）**…逐字文本 = 批档 §2…」）；② 批档 `:480` 引用 = 截断形态（省略中段）——「行宽=318」现址逐字在册（grep 复核 ✓）。两旗标均系**引用形态伪差**（非内容不符），实质面已逐条复核。
- **fix round**：审计面 **1**（记录面——由本段落笔消解）；评审面 **0**（🔵 三条均非本轮可修面 / 无需修）。**终态：clean**。

## §6 验证与收口（父代理）

**§6 验证与收口（2026-10-03 01:0x · 父侧）**

**核读（全面）**：① 核 9 档（`#25` 落地表逐档 Δ 在界 + 父侧抽读：`declaration.mjs:130-141` `declaredPublicRoots` ∥ `code-search.mjs:65-75` 逐 origin 分趟 ∥ `memory/docs.mjs:34` `syncDocRoot` 导出 ∥ `ledger-cmd.mjs:61-68` 声明源候选）；② scripts 2 档（**父侧直接执行**——355（≤362）∥ 93（≤97）；标记在 §1）；③ 提示词四档（锚终形核读：`discipline-normal.md:39` 双面 ∥ `discipline-engineering.md:128-129`；一次性比对 8/8 byte 全等——三舱报告在册）；④ 端面四调用点零改（`#25` 实读自证 + 工作树核对）。

**复跑（父侧亲跑）**：批内件 `docs/batches/2026-10-02-public-repo-read.test.mjs` ⇒ **5/5 pass**（① 声明投影 ∥ ② 同步展开 ∥ ③ 读面集 ∥ ④ 引用三态——核绿/未核列报/悬空红 ∥ ⑤ 写门 T46；红→绿成对在册：批前 5/5 红 → 核落 4/5 → scripts 落 5/5）∥ `doc-check --root .` ⇒ 悬空 0 · 行宽 OK · **汇总新字段「声明源缺位 0」在位** ∥ `prompt-refs-check` ⇒ 零命中 ∥ `##` = 8/6/8/6 不变。

**过程如实**：① 评审链——设计评审轮 1（changes-required：1🔴·5🟡·2🔵）→ 修正轮 `#21`（8/8）→ 轮 2 = pass；② **归属裁决**（`#23` 上抛——CN 落笔 = eng-coder；承 `#827`/`#830` 路由错误，本批纠正，§1/§4 errata 在册）；③ 锚点修正链（`#24`/`#26` 双面同报发现 → `#27` 设计微修 → `#28` 落笔）；④ scripts = 父侧直改（工程工具面——机械门禁不允许进实施舱；按设计语义逐条兑现——非新语义）。

**残项（挂账在册）**：`#834`（ledger-migrate 迁移旗与写门不同拍）∥ `#835`（declared 标志连带读数补行）∥ §2.2② 正文旧形以 §2.9/修正轮 1 钉死形为准（记录面注）。

**结算**：**收口（2026-10-03）**——记录冻结；台账 **#832 核销**（两段式）；提交 = 随收口签入（双远端）；设计槽 = 随签入消费。
