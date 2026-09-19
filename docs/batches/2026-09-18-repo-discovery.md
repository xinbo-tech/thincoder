# 2026-09-18 · 仓发现复用批（#62）

## §1 讨论（主 agent）

**状态行**：🔄 进行中（设计轮）

### 1.1 批件（用户 2026-09-18 05:16 / 05:34 两次定向）

| # | 条目 | 实况 |
|---|---|---|
| ① | **台账 #62**：`git` 工具在**非仓 cwd**（如工作区根 `D:\teamcode`）时无仓发现 ⇒ 曾表现为假洁净（#55 根因），改 fail-closed 后 = 抛错；**用户裁定 = 做仓发现**，且**复用 project-manifest 初始化的仓发现逻辑**、**甚至共享代码** | 源逻辑 = manifest 入口门槛发现规则（锚含 `.git` ⇒ 锚即根；否则**向下**找带 manifest 的直接子仓——一仓一 manifest · 恰一计数 · 零 = 无项目 · 多 = 歧义）；**单源纪律（D2）：禁两份实现** |
| ② | 上游 | toolface 批设计轮 F-7（#55 根因侧：cwd∉仓 + 吞错）；**#55 的 fail-closed 修正 = 本项前置**——「无发现结果」时的兜底仍按 #55 语义抛错 |

### 1.2 路径

（设计轮实核后填：发现逻辑**现址**（代码 or 仅提示词成文）⇒ 单源落点 ⇒ `git` 工具解析面）

### 1.3 边界

- **禁触**：数据面 · 提示词正文（父侧笔）· 需求档（父侧笔）· 冻结批档 / `_archive/**` / 参照树。
- **不推翻**：#55 已定的 fail-closed 语义（本批 = 其上的发现层）。

### 1.4 台账

- **#62** → 本批；完成后核销。

### 1.5 设计轮实况（父侧记 · 2026-09-18）

- **源逻辑现址 = 已成实装**：`thincoder-core/manifest.mjs:44-56` `resolveProjectRoot`（非「仅提示词成文」）；提示词同源成文 `thincoder-core/prompts/persona-engineering.md:45`；需求侧 `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MANIFEST.md:14`。
- **单源落点**：`manifest.mjs` 新导出 `discoverRepos(cwd)` → `{kind: self|unique|none|ambiguous, root, candidates}`；`resolveProjectRoot` 退为**薄包装**；`git.mjs` `execute()` 头部单点接入（13 处调用点零改）。
- **上游（设计轮 #2 项）**：#55 尚未落地（id=37 实施中）⇒ **实施时序：#55 先或同批**；`git.mjs` 同文件跨批 ⇒ 串行 + 开工前 `git status` 复读行数。

## §2 批次任务与设计（eng-designer）

### 2.0 轮次与交付（设计轮 · initial → fix 轮补投 §2 · 2026-09-18）

- **轮次**：设计轮 initial（2026-09-18 05:4x——正文落点**已落位 ✓**）→ 本 **fix 轮** = **§2 补投**（上轮骨架守卫拒写后重投；**零新语义**——正文 = 上轮设计结论 + 交付报告 §2 摘要）。
- **设计档落点（已落位，本批零再改）**：M1 面 = `docs/core/design/MANIFEST.md`（§2.2 接口 / §2.3 行 13 / §2.4 KD-M1-22 / §2.5 / §3.1 AC-21 / §3.2 T41·T42 / §4 变更记录）；git 面 = `docs/core/design/TOOLS.md` §6.13（规则表 / 接线表 / 解析序 / 注记 / 退化口径 / 开销 / 落位表 / A14–A19）。
- **交付面**：设计（两档已落）→ 本 §2（覆盖 · 受影响文件表 · 先红 · 设计结论 · AC / 用例在册 · 边界 · 实测依据）。

### 2.1 覆盖（本批需求条目）

| # | 条目 | 来源 | 在本批的落法 |
|---|---|---|---|
| ① | 台账 **#62**（工作区根非 git 仓：`git` 工具跨仓自动发现） | 用户 2026-09-18 05:16 / 05:34 两次定向 | **全部落**：`discoverRepos(cwd)` 单源四态 ⇒ `git.mjs` `execute()` 头部接线 + 重定向注记 + 歧义 throw |
| ② | 上游前置 **#55**（fail-closed——toolface 批） | 批档 §1.1 ② · §1.5 | **不在本批范围**（零态兜底 = §6.12 语义零改）；实施时序 = **#55 先或同批**（本批 A15 的可判性依赖它） |

### 2.2 受影响文件表（实现轮施工面 · 行数口径 = `\n` 计数 · as-of 2026-09-18 05:5x 实测）

| # | 文件 | 当前行数 | 变更 | 编辑点（函数级） | 本轮增量（估） | 在册 / 拆分面 |
|---|---|---|---|---|---|---|
| 1 | `thincoder-core/manifest.mjs` | 318 | 修改 | 新导出 `discoverRepos(cwd)`（四态 `{kind, root, candidates}` + `candidates` 按名排序）；`resolveProjectRoot` 改其**薄包装**（零语义）；头注一行 | +~45 / −10（净 ~+35）⇒ ≈353 | 在册（`MANIFEST.md` §2.3 行 13）；增量后 > 300 软线 ⇒ **不拆**（理由见下注） |
| 2 | `thincoder-core/tools/git.mjs` | 375 | 修改 | `execute()` 头部（`:90-98` 一带）：import + 解析序（workdir 在场 ⇒ 零发现 / `self` / `unique` / `none` / `ambiguous`）+ 注记前缀；执行体抽**模块级函数**（**不用 `this`**——VSC 侧 `{...coreGitTool}` 展开装饰） | 净 ~+35（构成见下注）⇒ ≈410 | 在册（`TOOLS.md` §6.13 落位表行 2——机制级；行数 / 增量落本表）；增量后 > 300 软线 ⇒ **不拆**（理由见下注） |
| 3 | `thincoder-core/test/manifest.test.mjs` | 266 | 修改 | `discoverRepos` 四态 + 候选保序（T41 / T42 对；同档既有 T-F9 **零改** = 零语义回归守卫） | +~30 ⇒ ≈296 | 在册（`TOOLS.md` §6.13 落位表行 3；**用例表住 `MANIFEST.md` §3.2**）；≈296 < 300 ⇒ 无拆分面 |
| 4 | `thincoder-core/test/git-repo-discovery.test.mjs` | 0 | **新增** | A14–A19 六格（夹具 = 真 `git init` 仓 + `PROJECT-MANIFEST.json` 档）；`_setProjectRootForTest` 须复位 | +~120 | 在册（`TOOLS.md` §6.13 落位表行 4）；**收集面 = 核单层 glob（`test/*.test.mjs`）⇒ 自动收集、零登记动作**（`TESTING.md` §10.2 / §10） |

- **行数口径与三链同源**：三链 = **本表 ∪ 两设计档在册行**，去重后 = 上表 4 行（表 1 ↔ `MANIFEST.md` §2.3 行 13；表 2–4 ↔ `TOOLS.md` §6.13 落位表 1–4——其中落位表行 1 与本表行 1 同档 ⇒ 合并）；行号 = as-of 参考、**落点以函数名为准**（D4）。
- **表 2 增量构成**：import +1 · 模块级 helper（解析 / 注记）+~20 · `execute()` 头部 +~10 · 执行体抽函数 +4（`switch` 体**原样搬**——净 0）⇒ 净 ~+35。
- **候选拆分面（>300 软线，<500 硬限——逐档给不拆理由）**：
  - 表 1（≈353）：增量 = **一个导出 + 一处包装化**（机制本体零改——KD-M1-22）；拆档即把发现判据与其既有消费者（`manifestFilePath` / `docRootBase` / `ledger-db.mjs`）分离 ⇒ **单源面断裂**。行数债随下次触碰该档时评估（沿 §2.3 既有注法）。
  - 表 2（≈410）：增量 = ① `execute()` 头部一段（workdir 归一 → 发现 → 审批门 → 派发 → 注记的**同函数内顺序契约**，拆档即把「缺省 cwd 兜底」与其消费点分离）② 一个模块级函数 ③ 一处调用；该档**既有分拆面**（action 族外置 `git-ext.mjs` / `git-checkpoint.mjs`）本批不新增族 ⇒ 拆档仅省行数、净增一档与一跳转。
- **跨批共享面**：`git.mjs` 与 **#55（toolface 批）同文件** ⇒ **串行实施**；开工前先 `git status` 复读行数（并发写 = 丢改风险）。`manifest.mjs` 无并行批（as-of 本席所见）。

### 2.3 先红方案（实现前必红 / 回归守卫两分）

| # | 用例 | 判据 | 批前状态 |
|---|---|---|---|
| 1 | **A14**（唯一态——本工作区形态） | 容器锚 + 恰一含 `.git` ∧ manifest 子仓 ⇒ 输出 = 该子仓 porcelain + 首行 `(repo: <子仓>)` | **必红**（批前：非仓失败 / 假洁净） |
| 2 | **A16**（多态） | 容器 + 两含 manifest 子仓 ⇒ **throw**·消息含两候选**绝对路径** + `/workdir/` + 不含 `clean` | **必红**（批前无发现概念 ⇒ 无此 throw） |
| 3 | **T41**（`discoverRepos` 四态） | 四态逐态断 `kind` / `root` / `candidates`（`self` / `none` ⇒ `[]`；`ambiguous` ⇒ 两候选按名排序） | **必红**（新符号——import 即失败） |
| 4 | **T42** · **A17** · **A18** · **A19**（回归守卫） | T42 = `resolveProjectRoot` 四态与批前**逐字同**（同档既有 T-F9 **零改**即守卫）；A17 = workdir 优先 + 无注记；A18 = 仓根 / 仓子目录两 cwd 零行为变；A19 = `init` 落点 = 锚 | 预期**批前即绿**（非先红——判据 = 零行为变） |

- **夹具要求**：真判据——tmp 自建 `.git` **目录** + `PROJECT-MANIFEST.json` 档（同 T-F9 法）；**不用** `_setProjectRootForTest` 覆盖（发现面走真判据；测试档内如触及须复位）。
- **前置依赖**：**A15**（零态）的判据 = §6.12 的 fail-closed 语义（throw · 消息含 `not a git repository`）——**#55 落地后可判**；#55 未落 ⇒ A15 记「前置未满足」，**不记红**（不把前置缺口算作本批缺陷）。

### 2.4 关键设计结论（每条带落点）

| # | 结论 | 落点 |
|---|---|---|
| 1 | 仓发现**单源** = `discoverRepos(cwd)` → `{kind, root, candidates}`（四态）；`resolveProjectRoot` 退**薄包装**（四态输出与批前逐字同）；**禁第二份实现**（用户点名 + D2） | `MANIFEST.md` §2.2 · KD-M1-22 · §2.3 行 13 |
| 2 | 规则 = ① 锚含 `.git` ⇒ 锚即根 ② 向下**仅直接子目录一层**（不递归、**不向上**——向上由 git 自身语义兜底）③ 子仓 = 含 `.git` **∧** 含 `PROJECT-MANIFEST.json`（只判存在性）④ 恰一 ⇒ 命中 ⑤ 零 ⇒ `none`（§6.12 兜底）· ≥2 ⇒ `ambiguous`（候选按名排序全列，**不猜**） | `TOOLS.md` §6.13 规则表 · `MANIFEST.md` §2.2 |
| 3 | `git` 侧解析序（缺省路径兜底）：workdir 在场（含 `"."`——判据 = **参数在场**）⇒ `resolve(cwd, workdir)` + **零发现**；否则 `self` ⇒ `ctx.cwd` 原值（**对象引用透传**——不 clone，#59 缝用例按引用断言）· `unique` ⇒ `ctx.cwd ← root`（重定向）· `none` ⇒ 原值（落 §6.12 兜底）· `ambiguous` ⇒ **throw**（列候选 + 指 workdir） | `TOOLS.md` §6.13 解析序表 |
| 4 | 接线 = `execute()` 头部**单点**（workdir 归一之后、审批门之前）⇒ action 派发面与 `git-ext.mjs` / `git-checkpoint.mjs` 族**经同一 `ctx`** 覆盖，读 / 写调用点零改（在册计数 = 13 处——`TOOLS.md` §6.13 接线表行 3） | `thincoder-core/tools/git.mjs:90-98` |
| 5 | 产出注记：重定向发生 ⇒ 结果**首行** `(repo: <仓根绝对路径>)`（**端拒执行串原样返回、不加注记**）。理由 = ① 静默重定向不可观测 ② 重定向后 `path` 类参数**基数 = 仓根**，基数错 ⇒ git 侧 **exit 0 + 空输出** = 假洁净同形（§2.8 依据 6） | `TOOLS.md` §6.13 产出注记 |
| 6 | 动作面**例外**：`init` / `clone` **不做发现**（以 cwd 为落点——`init` 在无仓处天然合法、`clone` 落点 = cwd 相对路径；否则「在此处建仓 / 克隆」被静默搬进别仓）；二者仍可经 `workdir` 显式指落点 | `TOOLS.md` §6.13 动作面例外 |
| 7 | 退化口径（normal 模式）：发现 = **纯 fs**（不读 manifest 内容 / 不查模式 / 不依赖 `agent`）⇒ 两模式**同判**；「无 manifest 概念」的项目 ⇒ `none` ⇒ 现状 fail-closed（**零行为变**） | `TOOLS.md` §6.13 退化口径 · `MANIFEST.md` §2.5 |
| 8 | **不做缓存**（mtime / cwd 键缓存被拒——`git init` / `clone` 会改盘面，缓存的失真面恰是发现本身；开销在噪声级） | `TOOLS.md` §6.13 开销 |

### 2.5 验收标准与用例（在册 · 三链同源）

| 面 | 验收 | 用例 | 承载档（在册 ✓） |
|---|---|---|---|
| M1（发现本体） | **AC-21**：四态各归其位；`candidates` **全列且按名排序**（`self` / `none` ⇒ `[]`）；`resolveProjectRoot` 四态输出与批前**逐字同** | **T41**（四态）· **T42**（零语义回归——既有 T-F9 零改） | `docs/core/design/MANIFEST.md` §3.1 / §3.2 |
| git 工具面 | **A14–A19** 六格（唯一态 / 零态 / 多态 / workdir 优先 / 仓内锚与仓子目录 / 创建类动作例外）——完整判据句见 `TOOLS.md` §6.13 | **A14·A15·A16·A17·A18·A19** | `docs/core/design/TOOLS.md` §6.13 |

- **三链同源（回指条目）**：**批档条目 = 台账 #62 ↔ 设计档落点（`MANIFEST.md` §2.2/§2.3/§2.4/§3.1/§3.2 · `TOOLS.md` §6.13）↔ 需求侧（台账 #62 为需求源；需求档 `docs/core/requirements/TOOLS.md` 的 git cwd / workdir / 仓发现判据行缺位——已登记，父侧笔）**。三方同源、无第四说法。

### 2.6 边界（本批不做）

- 不改 §6.12 的 fail-closed 语义（本批是其**发现层**——零态兜底零改）· 不做多级向下递归 / 向上遍历 · 不做发现结果缓存 · 不扩到其他工具（`bash` / `read` 等 cwd 语义不变）· 不改 `runGitStrict` 族（写面）· 不改 `advisor/repos.mjs` 独立读面（自带 `stdio` 三通）。
- 测试面：既有档零改（同档 T-F9 **零改**；`thincoder-core/test/tool-seams.test.mjs:88-106` #59 审批门用例的夹具改造归 **#55 批**）。
- 面外零触碰（承批档 §1.3）：数据面 · 提示词正文（父侧笔）· 需求档（父侧笔）· 冻结批档 / `_archive/**` / 参照树。

### 2.7 上抛登记（已入册——本档**不重开**）

本设计轮上抛 **6 条**，父侧 2026-09-18 已登记入册；本档只挂可指认面、**不逐条复述、不重开**：

- 台账 **#71**（第二类假洁净：pathspec 不匹配 ⇒ `git` **exit 0 + 空输出**——#55 的 fail-closed 只覆盖非零退出；同族出批登记）
- 需求侧判据行缺位（`docs/core/requirements/TOOLS.md` 缺 git 工具 cwd / workdir / 仓发现判据行）
- 工具描述失真行（`thincoder-core/tool-docs/git.md:39` `Default: cwd`——发现落地后缺省 = 项目仓根；**提示词面 = 主 agent 笔**）
- 仓外残留（`D:\teamcode\PROJECT-MANIFEST.json` 含已裁撤键——**仓外，仅登记不动作**）

（另两条由父侧在册；本档不代述。）

### 2.8 实测依据（as-of 2026-09-18 05:5x · 本 fix 轮复测）

| # | 依据 | 读数 |
|---|---|---|
| 1 | 源逻辑**已成实装**（非「仅提示词成文」） | `thincoder-core/manifest.mjs:44-56` `resolveProjectRoot`——本席实读：`:47` 锚自身仓 / `:49-53` 一层向下（`.git` ∧ `MANIFEST_REL`）/ `:55` 恰一 ⇒ 该子仓、否则 `null` |
| 2 | 提示词侧同源成文 | `thincoder-core/prompts/persona-engineering.md:45`（原文：judged by the git directory (.git), walking DOWN only, never up——锚自身 / 向下直接子仓 / 恰一计数 / 零 = 无项目 / 多 = 歧义） |
| 3 | 需求侧同口径 | `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MANIFEST.md:14`（②.2 读 / 写 / 校验器——判据 = `.git` 纯向下）· `:15`（②.3 根不可解析 ⇒ 拒、不自动建档） |
| 4 | 工作区形态（A14 的现实对应） | 容器 `D:\teamcode`：直接子目录 **22** · 含 `.git` **13** · 其中带 `PROJECT-MANIFEST.json` **恰 1**（`thincoder`）⇒ 本工作区 = `unique` 态活样本（与 `TOOLS.md` §6.13 规则表行 4 记的「13 子仓 / 恰 1」一致；该处「45 目录」与本席 22 的差 = 口径或时点差，未核） |
| 5 | 发现开销（**复测差异如实登记**） | 本席 20 次均值：容器锚 **6.49 ms** · 仓锚 **0.05 ms**；设计档在册读数 = 1.35 / 0.09 ms（上轮）。量级差未定位（机器状态 / 目录构成），**两者均噪声级 ⇒ 结论「不做缓存」不依赖该值**（差异非阻断，不作收正） |
| 6 | **基数错 ⇒ 假洁净同形**（结论 5 的现实依据） | 本席实跑：`git status no/such/path.txt` ⇒ **exit 0** + clean 文案；`git diff HEAD -- no/such/path.txt` ⇒ **exit 0** + 空输出（台账 #71 在册） |
| 7 | 上游状态 | 台账 **#55**（fail-closed）as-of 本席查询 = **待讨论**（批档 §1.5 记「id=37 实施中」）⇒ 实施时序 = **#55 先或同批**（A15 可判性依赖它） |
| 8 | 新档不存在（拟新增） | `thincoder-core/test/git-repo-discovery.test.mjs` 零命中；`thincoder-core/test/manifest.test.mjs:190` 的 T-F9 = 零语义回归守卫（零改） |

### 2.9 复核与补投轮（2026-09-19 · initial 轮重派 · eng-designer）

**状态**：设计两档**已落位**（§2.0–§2.8 = 2026-09-18 设计轮交付成果，本轮零再改机制面）；本轮 = 对账面复核 + 派单验收项补投。
**零新语义**：三条收正全在计数 / 口径 / 坐标面，机制一句未动。

**待核结论（实读坐标 · as-of 2026-09-19）**

| # | 待核项 | 实读结论 |
|---|---|---|
| 1 | 源逻辑导出面 | `thincoder-core/manifest.mjs`（**319 行**）`:44-56` `resolveProjectRoot(cwd) → string\|null`——`:45` `_projectRootOverride` 短路（测试注入）· `:47` 锚自身 `.git` ⇒ 锚 · `:49-53` 一层向下（`.git` ∧ `MANIFEST_REL`）· `:55` 恰一 ⇒ 该子仓 / 否则 `null`；新导出 `discoverRepos` 与其同处（薄包装） |
| 2 | `git.mjs` 现解析面 | `thincoder-core/tools/git.mjs`（**380 行**）：`execute()` 起 `:94` · workdir 归一（`ctx` 重建）`:97` · 审批门 `:99-102` · `switch` `:106` ⇒ **接线点 = `:97` 与 `:99` 之间**（原记 `:90-98` = as-of 漂移）。`ctx.cwd` 消费点 = `git.mjs` **31** · `git-ext.mjs` **17** · `git-checkpoint.mjs` **7** |
| 3 | 单源机判面（本轮新核） | `git.mjs` 现 import 面 = `./shared.mjs` / `node:child_process` / `node:path` / `./git-ext.mjs` / `./git-checkpoint.mjs`——`node:fs` · `.git` · `manifest` **三者零命中** ⇒ A20 三条断言**批前全不成立（必红）** |
| 4 | 上游 #55 | **已落地**：`git.mjs:16-25` `runGitRaw` 失败 `throw gitFailureMessage(...)` · `thincoder-core/test/tool-seams.test.mjs:91`（真洁净仓夹具）+ `:110-118`（A7–A12 用例）；台账 #55 = **已核销** ⇒ **A15 可判**（「前置未满足」记法撤销） |
| 5 | 既有测试面 | `thincoder-core/test/manifest.test.mjs`（**267 行**）`:190-214` T-F9 = 真 `.git` 目录 + `MANIFEST_REL` 档夹具（`:192` 关注入面）——**零改**作 `resolveProjectRoot` 回归守卫；新档 `git-repo-discovery.test.mjs` **不存在**（拟新增） |

**收正三条（逐条 → 落点）**

| # | 项 | 性质 | 收正 |
|---|---|---|---|
| 1 | **单源机判缺位**（派单设计要点①「可机判的复用语判据」未落） | 补面 | 新增 **A20**：读 `thincoder-core/tools/git.mjs` 源码断言 ① `discoverRepos` 自 `../manifest.mjs` import 命中（两消费者共用同一导出）② 该档 `node:fs` 零命中 ③ 扫描谓词（`readdirSync` / `existsSync` / `statSync`）零命中——**必红**（依据 = 上表行 3）。落 `TOOLS.md` §6.13 用例表 / 验收 / 落位表行 4 / 测试面；`MANIFEST.md` KD-M1-22 加机判指针 |
| 2 | **「13 处」计数口径误借** | 一致性面（D3） | 该数 = §6.12 调用方普查（`runGit(` / `runGitRaw(`）口径，被 §6.13 接线表行 3 借作「读 / 写调用点」⇒ **口径不符**。改可复核形（读数 = 上表行 2）。**零改结论不变**（重定向改的是 `ctx` 变量本身） |
| 3 | **坐标 / 行数漂移**（as-of 刷新） | 一致性面 | 接线点 `git.mjs:90-98` → **`:94-97`**；行数 318 / 375 / 266 → **319 / 380 / 267**；**A14 夹具补干扰子目录**（含 `.git` 无 manifest ⇒ 判别合取，防只扫 `.git` 的第二实现）；A15 前置句改「已满足」 |

**受影响文件表（刷新版 · 实现轮开工前仍按 §1.5 复读行数）**

| # | 文件 | 现读数 | 增量 | 增量后（估） | 拆分结论（>300 咨询线） |
|---|---|---|---|---|---|
| 1 | `thincoder-core/manifest.mjs` | **319**（原记 318） | 净 ~+35 | ≈354 | >300 软线 / <500 硬限 ⇒ **不拆**（理由同 §2.2：拆即断发现判据与其 3 族既有消费者） |
| 2 | `thincoder-core/tools/git.mjs` | **380**（原记 375） | 净 ~+35 | ≈415 | >300 软线 / <500 硬限 ⇒ **不拆**（理由同 §2.2：`execute()` 内顺序契约 + 本批不新增 action 族） |
| 3 | `thincoder-core/test/manifest.test.mjs` | **267**（原记 266） | +~30 | ≈297 | <300 ⇒ 无拆分面 |
| 4 | `thincoder-core/test/git-repo-discovery.test.mjs` | 0（不存在） | +~130 | ≈130 | **新增**（A14–A20 七格——A20 加 ~10 行） |

**§2 前文受影响行（append-only ⇒ 此处列更正 · 原文不回改）**：§2.2 表行 4「A14–A19 六格」⇒ **A14–A20 七格**；§2.2 行数三处 ⇒ 见上表；§2.4 行 4「在册计数 = 13 处」⇒ 见收正 2；§2.5 表「A14–A19 六格」⇒ **A14–A20**；§2.3 回归守卫集合（T42 / A17 / A18 / A19）**不变**（A20 = 先红面、非回归面）。

**派单验收项对账**：① 实读坐标 → 上表 1–5 行；② 判据表 + 先红形态 → §2.3 + 本轮 A20 行；③ 受影响文件表（含拆分结论）→ 上表；④ 用例表 → `TOOLS.md` §6.13 A14–A20（正常 A14 / 边界 A15·A17·A18·A19 / 反例 A16——**歧义 throw 列候选 + 指 `workdir`，不静默择一**）；⑤ 机检读数 → 下节。

**机检读数（`node scripts/doc-check.mjs` · 2026-09-19 实跑）**：判据项 5 项 · 扫描域 docs · **138 档** · 候选 16716 · **悬空 6** · 注记豁免 43 · 拟新增 6 · 迁移期引文 222。
**FAIL(锚) 6 条悬空 + FAIL(行宽) 13 行——本批两设计档零闸态命中**：`MANIFEST.md` / `TOOLS.md` 只出「符号·宽——报告面，不入闸」报告行；
`scanDirs = docs` ∧ `anchors.exclude = [_archive, batches]` ⇒ 批档不入扫描域、贡献 0。
悬空 6 逐条 = `docs/core/design/AGENT-LOOP-SUBAGENT.md:417` · `CORE-UNIFICATION.md:515` · `DOC-DISCIPLINE.md:529` · `SESSION.md:246` · `WORKSPACE.md:18` · `docs/vsc/design/SETTINGS.md:388`——**全部他档、批前既有、本批零触碰**。
**本轮自引入→自收正一条（如实登记）**：首改后行宽 13 → **15**（`TOOLS.md:430/432` = 本轮新增两行 474 / 475 字符）⇒ 当场拆行 ⇒ 复跑回 **13** ⇒ **零新增成立**。候选数 16695 → 16716（+21 = 本轮新增锚面，零悬空增量）。

**上抛 / 登记（本轮新增两条；余者承 §2.7 在册）**
- **#73② 坐标漂移**：台账证据行记 `thincoder-core/tools/git.mjs:68` ⇒ 实址 **`:72`**（`workdir` 描述串）；`thincoder-core/tool-docs/git.md:39` 坐标**正确**。描述失真本体仍待裁（提示词面 = 主 agent 笔；`git.mjs:72` 属产品码面 ⇒ 若裁定顺带收正，建议并入本批实施轮）。
- **台账 #62 状态行**：现仍 **`待讨论`**（as-of 2026-09-19 查询）——批档 §1 已立 · 设计轮在跑 ⇒ 建议转「待设计 / 在途」（台账笔 = 父侧）。
- **需求侧判据行建议文本（父侧笔 · `docs/core/requirements/TOOLS.md` · #73①）**：`git` 工具条目下补一条五要素条目——
  **模块目标**「`git` 工具在非仓 cwd（工作区根）自动解析本项目仓」；
  **判据**「显式 `workdir` 优先（判据 = 参数在场）⇒ 否则发现 = 锚含 `.git` ⇒ 锚；否则**向下仅直接子目录一层**找「含 `.git` ∧ `PROJECT-MANIFEST.json`」者：恰一 ⇒ 命中（结果首行注记 `(repo: <仓根绝对路径>)`）· 零 ⇒ 现状 fail-closed（非仓抛错）· ≥2 ⇒ 抛错并列候选绝对路径 + 指引传 `workdir`、**不猜**；`init` / `clone` 以 cwd 为落点、不做发现」；
  **边界**「不做向上遍历 / 多级递归 / 结果缓存；不改 `bash` / `read` 等工具 cwd 语义」；
  **验收**「回指 `docs/core/design/TOOLS.md` §6.13 A14–A20」；
  **依赖**「M1 仓发现单源导出 `discoverRepos`；零态兜底 = §6.12（#55，已落地）」。
- **域外读数（非本批 · 仅登记）**：仓根 `doc-check` 现态 = FAIL(锚) 6 + FAIL(行宽) 13（全在他档，见上）——本批不触碰。

## §5 实施（eng-coder）

**状态行**：✅ 实现完成（终态 = clean——审计 1 轮 0🔴；代码评审 2 轮均 pass）

### 5.1 交付摘要

- **单源落点**：`thincoder-core/manifest.mjs` 新导出 `discoverRepos(cwd)` → `{kind, root, candidates}`（四态 `self|unique|none|ambiguous`；`candidates` 按名排序；纯 fs 只判存在性 · 不抛（锚不可读 ⇒ `none`）· 不向上 · 不缓存）；`resolveProjectRoot` 退**薄包装** `discoverRepos(cwd).root`（零语义——既有 T-F9 零改作守卫）。
- **git 侧接线**：`thincoder-core/tools/git.mjs` `execute()` 头部**单点**（workdir 归一之后、审批门之前）——判据 = `if (args.workdir)` 真值在场 ⇒ 零发现；否则 `discoverRepos(ctx.cwd)`：`unique` ⇒ `ctx.cwd` 重定向 + 结果首行 `(repo: <仓根绝对路径>)`；`none` ⇒ 原值落 §6.12 fail-closed（零行为变）；`ambiguous` ⇒ throw（列全部候选绝对路径 + 指 `workdir`，不猜）；`self` / `none` 态 ctx **对象引用透传**（#59 缝用例按引用断言不破）；`init` / `clone` 例外（`NO_REPO_DISCOVERY`）不做发现；端拒执行串原样返回、不加注记。
- **执行体抽取**：动作派发体抽为模块级对象方法 `gitActionCore.dispatch`（**switch 体原样搬**——0 行改写；不用 `this`，端侧 `{...gitTool}` 展开安全）；`execute()` 26 行 / `dispatch()` 277 行（两函数均 <300）。
- **档**：`thincoder-core/test/git-repo-discovery.test.mjs`（新档 A14–A20）· `thincoder-core/test/manifest.test.mjs` 增 T41/T42 · `thincoder-core/tool-docs/git.md:39` 描述行收口（父侧派单 🟡2；表外项、已披露）。

### 5.2 受影响表（Δ 实测 · 口径 = `split("\n").length - 1`）

| # | 文件 | 改动 | 批前 | 实测后 | Δ |
|---|---|---|---|---|---|
| 1 | `thincoder-core/manifest.mjs` | 新导出 `discoverRepos` + `resolveProjectRoot` 薄包装 + 头注一行 | 319 | **338** | +19 |
| 2 | `thincoder-core/tools/git.mjs` | import + 解析序（发现 / 歧义 throw / 注记）+ 动作面例外 + 执行体抽模块级对象方法 | 380 | **415** | +35 |
| 3 | `thincoder-core/test/manifest.test.mjs` | 增 T41/T42（共用四态夹具 + 表驱动） | 267 | **299** | +32 |
| 4 | `thincoder-core/test/git-repo-discovery.test.mjs` | **新增**：A14–A20 七格（真仓夹具） | 0 | **172** | +172 |
| 5 | `thincoder-core/tool-docs/git.md` | `:39` workdir 行：`Default: cwd` ⇒ `Default: the discovered project repo root（缺省 = 发现的项目仓根；显式 workdir 优先）` | 55 | 55 | 0（改行不改行数） |

- 设计估值 vs 实测：档 1 ≈354 ⇒ **338** · 档 2 ≈415 ⇒ **415** · 档 3 ≈297 ⇒ **299**（仍 <300）· 档 4 ≈130 ⇒ **172**（A20 + 附加格）。
- 档位门（`test/core-hygiene.test.mjs`：>300 须在 `SOFT_LINE_REGISTRY` 登记）：档 1 在册 `:45` · 档 2 在册 `:48`；档 3 = 299、档 4 = 172（均未触发）；硬限 500 全满足。

### 5.3 先红读数（批前 · 真工具调用面）

| 用例 | 批前读数 | 判据 |
|---|---|---|
| A14 | ✖ `Error: git status --porcelain failed: fatal: not a git repository (or any of the parent directories): .git (cwd: <容器>) — pass workdir to run git inside a repository` | 非仓失败（批前无发现概念） |
| A16 | ✖ 同款非仓 throw（候选绝对路径断言不成立） | 批前无歧义 throw |
| A17 | ✖ 第二格（`workdir:""`）同款非仓 throw | 空串格走缺省径 ⇒ 发现未知 |
| A20 | ✖ `AssertionError: ① 单源：discoverRepos 自 ../manifest.mjs import 命中` | 批前该档 import 面不含 `discoverRepos` |
| T41/T42 | ✖ 整档加载失败：`SyntaxError: The requested module '../manifest.mjs' does not provide an export named 'discoverRepos'` | 新符号不存在（import 即失败） |
| A15 · A18 · A19 | ✔ 批前即绿（回归守卫——判据 = 零行为变） | — |

- 读数命令：`node --test test/git-repo-discovery.test.mjs` ⇒ `tests 7 · pass 3 · fail 4`（批前）；`node --test test/manifest.test.mjs` ⇒ `tests 1 · pass 0 · fail 1`（批前，加载面红）。

### 5.4 修后读数（命令 + pass/fail）

| 命令 | 读数 |
|---|---|
| `cd thincoder-core && node --test test/git-repo-discovery.test.mjs` | A14–A20 全 ✔（`tests 7 · pass 7 · fail 0`） |
| `cd thincoder-core && node --test test/manifest.test.mjs` | T-F9 / T41 / T42 全 ✔（`tests 17 · pass 17 · fail 0`） |
| `cd thincoder-core && npm test` | **388/388 pass · 0 fail**（含档位机检 · 缝机检 · #55 A7–A12 · #59 审批门） |
| `cd thincoder-cli && npm test` | **714/714 pass · 0 fail** |
| `cd thincoder-vscode && npm test` | **724/724 pass · 0 fail** |
| `lint(full) thincoder-core/tools/git.mjs` | `Syntax OK` |
| `cd thincoder && node scripts/doc-check.mjs` | FAIL(锚) 6 · FAIL(行宽) 13 —— 与批前**逐一相同**（`AGENT-LOOP-SUBAGENT.md:417` · `CORE-UNIFICATION.md:515` · `DOC-DISCIPLINE.md:529` · `SESSION.md:246` · `WORKSPACE.md:18` · `vsc/design/SETTINGS.md:388`，全在他档）⇒ 本批零新增 |

- **非 git 等价判据（零改面）**：`tools/git-ext.mjs` / `tools/git-checkpoint.mjs` / `tools/shared.mjs` 内容哈希（sha256 前 16 位）批前批后逐字同 = `682c67b71974b84a` / `7b56f04cc5659ced` / `50a305bb6b69d941`。
- 三包读数均取自**最终态**（最后一次改动 = 测试档注释一行；其后 core 全量复跑 388/388）。

### 5.5 决策透明表

| # | 决策 | 依据 / 备选 |
|---|---|---|
| 1 | 执行体抽为**模块级单方法对象**（`gitActionCore.dispatch`），而非裸 `function` | 设计 §2.2 表 2 明载「`switch` 体**原样搬**——净 0」⇒ 对象方法体天然保持原缩进（`git diff --stat` = +35/−0）；零 `this`（端 `{...gitTool}` 展开安全）。备选（裸函数 + 全体重排缩进）会造 270 行纯格式 diff |
| 2 | `workdir` 判据取**真值判定**（`if (args.workdir)`），空串 ≡ 缺省 | 设计 §6.13 解析序行 1 字面 = 「参数在场」；实现取与既有归一 `:110` **同源**的真值判定（`resolveBaseDir` 亦视 `""` 同缺省）⇒ 同一判据贯穿两处，免「归一视同缺省、发现视同在场」自相矛盾。A17 补 `workdir:""` 一格钉死；与设计字面的差已上报（§5.7） |
| 3 | 歧义消息文本（设计只给定性判据：列候选 + 指 `workdir` + 不含 `clean`） | 消息明列候选绝对路径并显式指引 `workdir`、措辞规避 `clean` 字样（防与假洁净同形）；文本非设计逐字给值 ⇒ 由实现定稿 |
| 4 | A19 补 `clone` 子格 · A14 补「端拒执行串不加注记」格 · A17 补 `workdir:""` 格 | 三格均为**设计既有判据句**的机判化（动作面例外末句 / 产出注记末句 / 解析序行 1）——只增取证、不改判据，用例编号不变 |
| 5 | `manifest.test.mjs` 夹具压缩（共用 `fourStates` + 表驱动） | 初版 T41/T42 使该档 328 行 ⇒ 触发 `core-hygiene`「未登记超线」红；压缩至 **299** 行后与设计「无拆分面」结论一致，四态断言逐格保留 |

### 5.6 审计与代码评审轮次与终态

- **内部分歧审计（explore 子代理 · 只读 · 第 1 轮）**：对设计（`TOOLS.md` §6.13 规则表 / 解析序 / 例外 / 注记 / 接线 / 用例表 + `MANIFEST.md` §2.2 · KD-M1-22 · AC-21 · T41/T42）逐条比对 ⇒ **0🔴 · 1🟡 · 4🔵**。🟡 = 设计 `TOOLS.md:445` 边界句被本轮已授权的 `git.md:39` 收口反证（文档面）；🔵 = 接线坐标漂移 · 解析序口径句 · `git.mjs` 内联 schema 描述半收口 · T41④ 自注与夹具事实不符。
- **自修轮 1**：T41④ 自注改诚实口径（`manifest.test.mjs:268` / `:288`）；两条 stale 坐标注释改写（`git-repo-discovery.test.mjs:112` · `manifest.test.mjs:297`）。
- **内部代码评审（advisor · code · 轮 1）**：**pass**（0🔴 · 3🟡 **全部非阻断** · 5🔵）。🟡 = `git.mjs` 参数描述 `Default: cwd` 与 `git.md:39` 新句互斥（#73② 在册待裁）· workdir 判据文本口径两分 · 两档 >300 已在册（R3 不重开）。
- **自修轮 2**：A20 改**注释剥除后再扫**（承 `core-hygiene.test.mjs:63` `stripComments` 先例，消假红面）；T41④ 误导性括注删除。
- **内部代码评审（advisor · code · 轮 2 · 只核 fix 声明）**：**pass**——两条 fix 声明均核实为 Fixed；另出一 🔵（A17 节注释措辞含混）。
- **自修轮 3（注释面 · 零行为面）**：A17 节注释改写为「显式 workdir（真值在场）⇒ 零发现、无注记；`workdir:""` ≡ 缺省（走发现 + 注记）」。
- **终态 = clean**（无未闭合 🔴；🟡 全部非阻断、归文档层 / 父侧裁定面）。
- 引文注：advisor 两轮的 `file:line` 引用在本机引文校验面**不可读**（相对路径解析基准不同）——复核以本席实读 + 三包绿为准，如实登记。

### 5.7 越界项与上抛（本批）

- **表外改动 1（父侧派单授权）**：`thincoder-core/tool-docs/git.md:39`（🟡2 明令本批收口，逐字给值）。
- **表外改动 2–4（用例内附加格）**：见 §5.5 行 4。
- **上抛（本席不动作）**：
  - `thincoder-core/tools/git.mjs:85` 的 `workdir` **内联 schema 描述**仍为 `Default: cwd`，与本批已收口的 `git.md:39` 互斥（两面均 model-visible：描述正文经 `DESC` 装载 · schema 描述经 provider `parameters` 透传）——处置归父侧裁定（批档 `:171` #73② 记「产品码面、待裁」），建议同批一行收正。
  - 设计档漂移（本席零改设计档、只上报）：`TOOLS.md:445` 边界句「`git.md` 的 workdir 行现为 `Default: cwd`…本批只上报」已被本轮实现证伪；`TOOLS.md:394` 解析序行 1「参数在场」与实现真值判定差 `workdir:""` 一格；`TOOLS.md:388` 接线坐标为 as-of 实施前（现址 = `git.mjs:110-131`）。
  - 批档 §2 内坐标滞后：`:110` 记 `git.md:39` = `Default: cwd`；`:171` 记产品码面描述串于 `git.mjs:72`（实读在 `:85`）。
- **禁止范围核查**：`git-ext.mjs` / `git-checkpoint.mjs` / `shared.mjs` 内容哈希逐字同；需求档 / 协议 / VSC 端 / `_archive/**` 零触碰；manifest 既有发现语义零改（T-F9 零改全绿）；不向上、不递归、不缓存。

### 5.8 交付表

| # | 状态 | 验收项 |
|---|---|---|
| 1 | ✅ Done | A14–A20 逐条（先红 → 修后全绿；真 `gitTool.execute` 调用面 + 真 `git init` 仓夹具） |
| 2 | ✅ Done | T41/T42（四态各归其位 + 候选保序；`resolveProjectRoot` 批前逐字同 + 覆盖语义保持；T-F9 零改作守卫） |
| 3 | ✅ Done | 三包测试全绿（core 388/388 · cli 714/714 · vsc 724/724）+ lint OK |
| 4 | ✅ Done | 行数 ≤500 硬限（338 / 415 / 299 / 172）· 函数层 <300（`execute()` 26 · `dispatch()` 277） |
| 5 | ✅ Done | 非 git 等价判据证零改面（三档 sha256 逐字同） |
| 6 | ✅ Done | `doc-check` 按档归属零新增（悬空 6 / 行宽 13 与批前逐一相同，全在他档） |
| 7 | ✅ Done | 单源机判（A20 三断言：同一导出 import 命中 · 零 `node:fs` · 零扫描谓词） |
| 8 | ⚠️ Partial | 派单 🟡2 = `tool-docs/git.md:39` **已落**；同参数的 `git.mjs:85` 内联描述仍 `Default: cwd`（#73② 待裁，本席不越权）——两面文字暂不一致，已上抛（§5.7） |

### 5.9 fix 轮（2026-09-19 · 点修：`git.mjs:85` 内联描述与 `git.md:39` 口径对齐）

**派单**：父侧 fix 轮——`thincoder-core/tools/git.mjs:85` workdir 内联 schema 描述仍 `Default: cwd`，与本批已收口的 `tool-docs/git.md:39` 互斥（两面均 model-visible）⇒ 只改这一行、同行替换、禁探索、禁顺手改他处。

**改动行 before / after（逐字）**

- before（`tools/git.mjs:85`）：
  `      workdir: { type: "string", description: "Run git in this subdirectory (monorepo / multi-repo). Path relative to cwd — no directory restriction. Default: cwd" },`
- after（`tools/git.mjs:85`）：
  `      workdir: { type: "string", description: "Run git in this subdirectory (monorepo / multi-repo). Path relative to cwd — no directory restriction. Default: the discovered project repo root（缺省 = 发现的项目仓根；显式 workdir 优先）" },`

- 仅缺省句变（`Default: cwd` ⇒ `Default: the discovered project repo root（…）`），串内其余逐字保留；措辞 = `git.md:39` **原文逐字**（含中文括注——两面 model-visible ⇒ 逐字同源最稳）。

**两面改后逐字对照**

| 面 | 逐字内容 | 装载径 |
|---|---|---|
| `tools/git.mjs:85`（内联 schema） | `Run git in this subdirectory (monorepo / multi-repo). Path relative to cwd — no directory restriction. Default: the discovered project repo root（缺省 = 发现的项目仓根；显式 workdir 优先）` | provider `parameters` |
| `tool-docs/git.md:39`（描述正文） | `- workdir: run git in this subdirectory (monorepo / multi-repo). Path relative to cwd — no directory restriction. Default: the discovered project repo root（缺省 = 发现的项目仓根；显式 workdir 优先）` | `DESC("git")` |

缺省句两侧抽比对 = `true`（运行时实读 `gitTool.parameters.properties.workdir.description` 与 `git.md:39` 的 `Default:` 后缀逐字同；两行余下差异 = 既有的行首 `Run`/`run` 大小写与列表前缀，本轮未动、按派单「其余逐字保留」）。

**用例读数（命令 + pass/fail）**

| 命令 | 读数 |
|---|---|
| `cd thincoder-core && npm test` | `tests 388 · pass 388 · fail 0` ✅ |
| `lint(full) thincoder-core/tools/git.mjs` | `Syntax OK: …/tools/git.mjs` ✅ |
| 实读行数（口径 `split("\n").length - 1`） | `415`（改前/改后同 ⇒ 同行替换）✅ |
| `grep "Default: cwd"` 于 `thincoder-core/**` | **0 命中**（改前 = 1 命中 `git.mjs:85`）✅ |

**禁改面核查**：本轮写操作 = **1 次 edit、1 档、1 行**；`tool-docs/git.md` / `test/*` / 设计档 / 需求档零触碰（mtime 佐证：git.md `13:37Z` · manifest.test.mjs `13:47Z` · git-repo-discovery.test.mjs `13:51Z` · manifest.mjs `13:36Z`，均早于本行改点；`git.mjs` mtime = `13:54:39Z` = 本行改点，`now = 13:55:15Z`）。

**审计与代码评审轮次与终态**：审计轮 0 · 评审轮 0——派单明令「点修 · 禁探索」，且本条 = 抄前轮已审的 `git.md:39` 原文（无偏离面）、验收为闭式机械判据。**终态 = clean**（闭合式判据全绿，零未闭合项；前轮 advisor 轮 1 的 🟡「两面互斥」由此闭合）。

**文档面字样残留（非本轮范围 · 仅登记）**：`docs/core/design/TOOLS.md:445` 与批档 §2 叙述句内仍有 `Default: cwd` 字样（陈述历史态的历史句）——文档面、他人写域，本轮零触碰。

**交付表**

| # | 状态 | 验收项 |
|---|---|---|
| 1 | ✅ Done | `thincoder-core` `npm test` 全绿（388/388 · 0 fail）+ 该档 lint OK |
| 2 | ✅ Done | `git.mjs` 行数 415（±0）· 同行替换 |
| 3 | ✅ Done | 两面逐字对照口径一致 · `grep "Default: cwd"` 该档零命中 |
| 4 | ✅ Done | 禁改面零触碰（写操作 = 1 档 1 行；git.md / 测试档 / 设计档 / 需求档零触碰） |

**越界项**：无。

## §6 验证与收口（父代理）

**收口（2026-09-19 21:5x · 父侧直接执行）**

- **交付判据**：台账 #62（用户 09-18 两次定向「用 manifest 那套逻辑，甚至共享代码」）→ 设计 id=144（复核与补投轮）→ 评审 **pass**（id=145 · 0🔴/4🟡/6🔵）→ 实现 id=146（clean）→ **点修 id=147**（clean · 两面互斥闭合）⇒ **本批全闭**。
- **落地**：仓发现**单源** = `thincoder-core/manifest.mjs` 新导出 `discoverRepos(cwd)`（四态 `{kind, root, candidates}` · 候选按名排序）；`resolveProjectRoot` 退**薄包装**（**零语义**，T42 守）；`thincoder-core/tools/git.mjs` `execute()` 头部单点接线（`unique` 重定向 + 首行 `(repo: …)` 注记 · `none` 落 §6.12 零行为变 · `ambiguous` **throw 列候选不猜** · `init`/`clone` 例外）+ 执行体抽 `gitActionCore.dispatch`（switch 体原样搬）。
- **父侧独立复跑**：`git-repo-discovery` + `manifest` **24 例全绿**（与 coder 报数一致）。
- **三包读数**：core **388/388** · cli **714/714** · vsc **724/724**；`doc-check` 与批前逐一相同（本批零新增）；零改面（`git-ext` / `git-checkpoint` / `shared`）内容哈希逐字同。
- **先红（真 `gitTool.execute` 调用面 + 真 `git init` 仓）**：**7 例 3 绿 4 红**（A14/A16/A17/A20 ✖ · A15/A18/A19 回归面批前即绿）；`manifest` 档 import 即失败（新符号）。
- **行数 / 函数层**：338 / 415 / 299 / 172（均 ≤500 硬限 · 档 3 仍 <300）；`execute()` 26 行 · `dispatch()` 277 行（**均 <300**）。
- **模型可见描述两面对齐**：#147 把 `git.mjs:85` 内联描述改指与 `git.md:39` **逐字同口径**（`grep "Default: cwd"` 该档零命中）。
- **待收正（文档面 · 不入本批写域）**：① **需求侧判据行仍缺**（`docs/core/requirements/TOOLS.md` 无 git cwd / workdir / 仓发现行——五要素文本已在批档 §2.9 备好）；② `TOOLS.md:445` 边界句已被实现证伪 · `:394` 解析序行 1「参数在场」与实现真值判定差空串一格（实现已补该格用例）· `:388` 接线坐标为 as-of · `:360` 过渡口径句待退役；③ `TOOLS.md:445` / 批档 §2 叙述句内仍有 `Default: cwd` 字样（历史陈述句）。
- **状态行**：✅ 已收口 2026-09-19（全档冻结）。
- **台账**：#62 ⇒ 已核销（待设计 → 在途 → 待核销 → 勾销）。

