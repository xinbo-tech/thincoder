# 可移植性（Portability）— 设计

> 板块：可移植性 · 配对需求档 = `../requirements/PORTABILITY.md` · 需求组权威正文 = `ENGINEERING-MODE.md` §2（FR10–FR15）。
> 本批 = **工程模式可移植性修复批（CLI 面）**（2026-09-11）。实施台账 = `docs/TODO.md`「产品可移植性缺陷登记」节（P1–P28；行号 as-of 2026-09-10，已逐条现场复核）。
> 状态：设计稿（待评审）。实现 = eng-coder 落笔；提示词文案 = 本设计逐字定稿 + coder 机械落笔（主 agent 内容权，改写走修正轮）。

## 1. 问题陈述与范围裁定

### 1.1 问题

工程模式是**面向任意项目的产品功能**，但现行实现把本产品自研仓的约定——`docs/README.md` 文档地图、
`METHODOLOGY.md`、`docs/design/<TOPIC>.md` 树、`docs/TODO.md` 需求池、`^src/` 判据、`check-doc-width` 脚本——
当成了普适事实。在任意用户项目上产生三类**静默失效**（用户不可见、不可修）：

- **评审维度无声消失**：文档地图 / 项目标准探不到即静默跳过，评审仍按该维度打分（P1–P3）；
- **门禁静默绕过**：嵌套布局下 `packages/foo/src/*.md` 被当文档，绕过设计门禁（P10）；
- **索引静默为空**：非 git 项目代码/文档索引全空、白名单外扩展名不可检索（P8/P9）。

另有一枚**活 bug**：`/eng` 门禁要求 `METHODOLOGY.md`，而"从模板创建"指向**已不存在**的模板——选项必炸（P14）。

### 1.2 范围分割（选型对比）

| # | 候选 | 判据（通用化 / 风险 / 评审容量） | 取舍 | 结论 |
|---|---|---|---|---|
| 1 | 单批全量（P1–P28 + 🔵 + 机制面） | 28 缺陷跨 20+ 文件、多个子系统同批评审 | 评审深度被稀释、批次周期失控 | 否决 |
| 2 | **A 家族（P1–P10）+ P14** + 同点收口 | 静默失效类 = 最危险面且集中在 6 个模块；改动自洽 | 评审容量可承载；B/C 另批不受阻 | **选定** |
| 3 | 按子系统拆多批串行（advisor / 门禁 / 索引） | 同一缺陷族被切开，双源提示词与判据面重复触达 | 多批固定开销；跨批一致性难守 | 否决 |

**本批范围（定）** = P1–P10 + P14，含三项**同点收口**：P15（提示文案与 P10 同一行块）、P25（P10 的实现面同一性）、
FR14 落实（需求层登记）；另含 FR15 的行为面定义（P8 所在需求）。

**批次二（另批，本批只登记）** = VSC 端镜像面（A 家族同源语义——清单见 §9）+ B/C 家族剩余（P11–P13、P16–P28 与 🔵 项）。

### 1.3 本批条目清单（三方一致锚——批次档 §2 = 本表 = 验收标准回指）

| 条目 | 来源 | 一句话 | 修法节 | 回指需求 |
|---|---|---|---|---|
| PO-1 | P1 | 文档地图缺失 → 显式降级（不再静默跳过） | §3.4 | FR10 |
| PO-2 | P2 | METHODOLOGY 注入移除 → 声明键 + 显式降级 | §3.4 | FR11 · FR10 |
| PO-3 | P3 | 评审指令文本不再要求读 `METHODOLOGY.md` | §3.4 | FR11 |
| PO-4 | P4 | advisor-design 提示词去本仓引用（`docs/README.md` / 示例路径 / 提示词自读） | §3.5 | FR13 · FR10 |
| PO-5 | P5 | 纪律层去「docs/design/<TOPIC>.md 树形状」教条 | §3.5 | FR13 |
| PO-6 | P6 | 纪律层去流程文件假设（`docs/TODO.md` 池 / CHANGELOG 边界） | §3.5 | FR13 |
| PO-7 | P7 | 纪律层去自指脚本（`scripts/check-doc-width.mjs`）要求 | §3.5 | FR13 |
| PO-8 | P8 | 非 git 索引走 walk 回退 + 评审侧降级句 | §3.6 · §3.4 | FR15 |
| PO-9 | P9 | 扩展名可索引（扩表）/ 可声明 / 未列入可见 | §3.7 | FR10 |
| PO-10 | P10 · P25 | 代码/文档判据单一权威 + 项目声明面 + 全接线 | §3.1–§3.3 | FR12 |
| PO-11 | P14 · P15 | `/eng` 无前提开启 + 门禁/工具提示文案去「in docs/」 | §3.8 | FR11 |
| PO-12 | FR14 | 推进档位契约入需求层 | §3.9 | FR14 |

### 1.4 批次间顺序建议（父侧排程参考）

1. 本批（CLI 面）交付 + 验收；
2. **批次二·VSC 镜像面**（同源语义镜像 A 家族——两端漂移窗口越短越好）；
3. **批次三·B/C 家族剩余**（P11–P13、P16–P28；可按子系统再分）。

> 用户如要 VSC 同批：一句话翻转（成本 = 按 §9 清单折入 + 重走设计评审）。

### 1.5 归属判定与新建授权（留痕）

- **新建双档 = 父侧预授权**——spawn 任务书原文：「预授权新建 `docs/design/PORTABILITY.md` + `docs/requirements/PORTABILITY.md`（新板块）」；非 designer 自行新建（批次档 §1「不得自行新建档」纪律的授权豁免已留痕）。
- **新板块理由**：可移植性面跨三批分割（本批 CLI 面 + 批次二 VSC 镜像 + 批次三 B/C 剩余——§1.2/§1.4）——三批共享同一设计/需求宾语，挤入他链在途档（冻结面）不可行。
- **FR14 落本档理由**：FR14 属 FR10–FR15 需求组、本批条目 PO-12——接受方向随组落本档（§3.9）；**FR10–FR15 正文搬迁归位**（`ENGINEERING-MODE.md` §2 → 本档）为父侧裁决项——未裁决前 §2 为权威正文（需求档 §4 同口径）。
- **D8 拆分登记核销落点**：`ENGINEERING-MODE.md` §2.26.3 D-1（触发条件「再度增厚」本批成立）——核销 = 本批收口时**父侧**执行（该档为他批在途冻结面，本批不触碰——§9）；本档 §2 决策 D8 + 批次档 §6 核销同步清单为平行留痕。

## 2. 方案选型对比（决策表）

### D1 代码/文档判据（PO-10）

| # | 候选 | 判据评估（FR12：单一权威 + 声明可诉 + 不漏判） | 取舍 | 结论 |
|---|---|---|---|---|
| 1 | 纯扩展名（非文档扩展名 = 代码，无 `src` 概念） | `src/prompts/x.md` 被当文档——FR12 点名的漏判仍在 | 不满足需求 | 否决 |
| 2 | **组件式 `src` 路径段 + 声明面 + 降级提示** | 嵌套布局不漏判；非 src 布局偏保守（安全方向）且可声明修正；单一权威 | 默认值含 `src`——降为**可覆盖的数据默认**（非锚定逻辑）；新声明面 | **选定** |
| 3 | 纯声明制（无声明时全部拦/全部放） | 无声明项目不可用（需求档都会写不进去） | 破坏四步流程 | 否决 |

### D2 项目声明面载体（FR10「项目自述或配置」）

| # | 候选 | 判据评估 | 取舍 | 结论 |
|---|---|---|---|---|
| 1 | **`.thincoder/conventions.json`（产品命名空间 / 机器可读 / 单点）** | 与全局配置区隔、可缓存、可测；产品自命名空间（非对用户项目的假设） | 需定义 schema（本档 §4.1） | **选定** |
| 2 | AGENTS.md 内机器可读块 | 单文件、用户已维护 | 机器门禁解析自然语言文件——脆弱、格式成本高 | 否决 |
| 3 | 全局 `~/.thincoder/config.json` 加键 | 复用现有配置面 | **非 per-project**——多项目互相污染 | 否决 |
| 4 | 不做声明面、仅降级提示 | 最小 | 不满足「项目自述/配置**可诉**」 | 否决 |

### D3 非 git 项目索引（PO-8）

| # | 候选 | 判据评估（FR15：行为有定义 + 可用） | 取舍 | 结论 |
|---|---|---|---|---|
| 1 | **walk 回退（跳过规则与 git 路径同源 + 上限护栏）** | 索引可用；无 git 则无所谓 .gitignore（现状文档化） | 新增遍历代码（抽独立模块） | **选定** |
| 2 | 仅可见降级（明示"无索引源"） | 用户仍不可检索 | "定义行为"退化为"声明不可用" | 否决 |
| 3 | 要求用户先 `git init` | 实现零成本 | 把产品机制强加给用户项目（FR10 反例） | 否决 |

### D4 索引扩展名（PO-9）

| # | 候选 | 判据评估 | 取舍 | 结论 |
|---|---|---|---|---|
| 1 | **扩充内置表 + 声明追加 + 未列入可见（结果字段 + /reindex 提示）** | 默认覆盖主流语言；任意扩展可声明；跳过可感知 | 内置表仍是精选清单（诚实注；远期见候选 2） | **选定** |
| 2 | 全文本索引（二进制嗅探 + 全量读） | 最通用 | 噪声 / 成本 / 分类失真；改动面大 | 否决（登记为远期候选） |
| 3 | 仅可见化（保留现表） | 小 | `.fs`/`.dart` 等仍不可检索 | 否决 |

### D5 文档地图 / 标准文档注入（PO-1 · PO-2）

| # | 候选 | 判据评估 | 取舍 | 结论 |
|---|---|---|---|---|
| 1 | **既有探测保留 + 声明键覆盖 + 缺失显式降级** | 通用；本仓探测命中零感；用户项目可声明 | 降级句进入每条相关评审消息（一行） | **选定** |
| 2 | 删探测、只认声明 | 纯净 | 常见项目要声明才注入——无谓摩擦 | 否决 |
| 3 | 扩充探测路径猜测 | — | "再硬编码更多特例"——违本批判据 | 否决 |

### D6 提示词通用化策略（PO-4–PO-7）

| # | 候选 | 判据评估 | 取舍 | 结论 |
|---|---|---|---|---|
| 1 | **通用化 + 「本产品自研仓 = X」示例标注** | 用户项目不建形状；本仓可读性保留 | 措辞须带限定词防歧义 | **选定** |
| 2 | 全删本仓引用 | 更纯 | 「本仓自身均正确」判据受损（自研会话可操作性下降） | 否决 |
| 3 | 运行时按项目条件分支 | — | 提示词是静态文本，无运行时分支 | 否决（不可实现） |

### D7 `/eng` 门禁（PO-11）

| # | 候选 | 判据评估（FR11） | 取舍 | 结论 |
|---|---|---|---|---|
| 1 | **去门禁、无前提切换** | FR11 原文方向（"前提应为项目自述的可用性**或无前提**"） | — | **选定** |
| 2 | 门禁改判"项目自述可用性"（如 AGENTS.md 存在） | 折中 | 无谓前提（工程模式本不依赖任何文件） | 否决 |
| 3 | 回填 `methodology-template.md` 修活 bug | 保住原交互 | 与本仓「METHODOLOGY 已退役」冲突；测试锁「该文件不存在」必红 | 否决 |

### D8 `messages.mjs` 拆分（触发条件成立）

| # | 候选 | 判据评估 | 取舍 | 结论 |
|---|---|---|---|---|
| 1 | **执行登记拆分计划：抽 `thincoder-core/advisor/project-context.mjs`（项目上下文发现与注入簇）** | 第 13 批登记计划（`ENGINEERING-MODE.md` §2.26.3 D-1）触发条件 = "再度增厚"——本批即触发 | 兑现登记，档位债不挂账 | **选定** |
| 2 | 不拆、直接增厚 `messages.mjs` | 少动 | 违反已登记触发——评审必抓 | 否决 |

## 3. 逐条修法

### 3.1 分类判据单一权威（PO-10——“什么算产品代码”）

**结论**：新建 `thincoder-core/conventions.mjs` = 全产品唯一的代码/文档/临时文件分类裁判；所有门禁与守卫改为经它判定。

语义（默认约定，可被项目声明覆盖——§4.1）：

- `temp` = `tmp-*` 名或 `.tmp/.temp` 扩展名（即既不代码也不文档，沿用现行 TEMP_FILE 谓词）；
- `code` = 路径含声明代码段（默认 = 路径段 `src`；**段匹配、非锚定**）或（非文档扩展名）；
- `doc` = 文档扩展名（沿用现行 DOC_FILE 谓词）且不落在代码段内。

**变更点**：`repos.mjs` 的两条正则、`dispatch.mjs:199` 锚定式、`thincoder-core/agent-tools/advisor-settle.mjs:47` 组件式全部退役，
统一改为 `isCodePath(p, conv)` 接线（`verify.mjs` 的 `isUnderSrc` 一并换源，死 helper 清理）。

### 3.2 项目声明面：`.thincoder/conventions.json`（PO-10 支撑）

可选文件（缺失 = 全默认）；schema 与解析规则见 §4.1。加载与缓存 = `thincoder-core/conventions.mjs`；
损坏 / 类型错 → 回退默认 + `console.warn` + 日志事件（不崩溃、不静默吞）。

### 3.3 门禁与变更判据接线（PO-10 · PO-11 文案面）

| 调用点 | 现状 | 改法 |
|---|---|---|
| `src/agent/dispatch.mjs` 父侧设计门禁 | `^src[\\/]` 锚定 + isDocFile | `isCodePath(p, conv(agent.cwd))`；**保留**非字符串 → 保守拦截（`typeof p !== "string" ||` 分支 + :197-198 注释随批更新措辞——未知路径不放行）；hint 文案去「in docs/」并按是否声明给声明指引（逐字见 §4.4） |
| `thincoder-core/agent-tools/advisor.mjs` 设计评审文档门禁（:111-119） | `docs/` 前缀 + `isDocFile` | 换源 `isDocPath(doc, conv(agent.cwd))`（非文档文件 → 拒绝）；拒绝文案去 `docs/` 措辞（逐字见 §4.4）；:112 注释随批更正 |
| `thincoder-core/advisor/repos.mjs` `hasCodeMutations` | 组件式正则 | 换源 `conventions.mjs`（绝对路径）；导出签名不变 |
| `thincoder-core/advisor/repos.mjs` `isDocOnlyChange` | `^src[\\/]` 锚定 | 换源（git 相对路径）；导出签名不变 |
| `thincoder-core/agent-tools/advisor-settle.mjs` `isCodePath` | 组件式正则 | 本地实现删除，改为导入权威模块 |
| `thincoder-core/agent-tools/verify.mjs` `isUnderSrc` 两处消费 | 根锚定 + 松散回退 | 换源；`findProjectRoot`/`isUnderSrc` 若仅此两处引用则删除（死代码随批清理） |
| `src/agent/completion.mjs` | 经 `hasCodeMutations` | 零改动（签名稳定） |

**导出面裁决**：`isDocFile`/`isTempFile` **迁出、不设 re-export**——四个导入方全部就地换源（`dispatch.mjs` / `advisor-settle.mjs` / `verify.mjs` / `thincoder-core/agent-tools/advisor.mjs`）；
保留 re-export = 制造第二个导入路径，与 §3.1「全产品唯一裁判」相抵（D2）。对照：`messages.mjs` 拆分面**保留 re-export**（结构重构 ≠ 权威迁移——§3.4）。
**`agent-tools/advisor.mjs` 门禁的 `docs/` 前缀 = 换源退役**（非登记——FR12 类目录名硬编码，同族门禁不留半接线）。

### 3.4 评审注入面（PO-1 · PO-2 · PO-3 · PO-8——含 D8 拆分）

**拆分**（D8）：`messages.mjs` 的「项目上下文发现与注入」簇迁入新档 `thincoder-core/advisor/project-context.mjs`：
`findProjectRoot` + `injectProjectGuide` + 文档地图注入 + 标准文档注入 + 降级句 helper（`messages.mjs` 既有导出面**经 re-export 保持**——D-1 登记口径「import 面零改」；本档只被 messages 消费）。
拆分后 `messages.mjs` 预计 413 → ~300 行（净减；≤500 硬限内——兑现第 13 批登记计划，档位债收口）。

**P1（文档地图）**：既有探测（`docs/README.md` → `docs/design/README.md`）保留为 fallback；**新增声明键优先**（`advisor.docMap`，相对项目根解析）。
两者皆无 → 不再静默跳过，注入显式降级句（逐字见 §4.4）。

**P2（标准文档）**：删除硬编码 `METHODOLOGY.md` 探测与注入；改为**仅当声明**（`advisor.standardsDoc`）时注入 `## Project Standards`；
未声明 → 注入显式降级句（逐字见 §4.4）。两处注入点（设计路径 + 收敛/代码路径）同改。

**P3（指令文本）**：`Read METHODOLOGY.md to understand the project's standards`（两处）与 `does it follow the project's METHODOLOGY.md?` 改写为指向"评审上下文提供的项目标准"（逐字见 §4.4）。

**FR15 评审侧**：`findReviewRepos` 返回空（无 git）时，注入显式降级句（变更上下文不可用 → 直接读评审范围文件；逐字见 §4.4）。

### 3.5 纪律层提示词（PO-4–PO-7 + persona-eng-designer 同族）

**通用化公式**：`落点/检查方式按项目约定；本产品自研仓 = <具体路径>`——用户项目不建产品形状，自研仓保留可操作性（D6）。
**P7 例外**：自指检查脚本与其判据源（`:213–:214` 整句）**全删**——不适用「本产品自研仓 =」标注形态（脚本仅本仓存在，写进产品提示词违 FR13）；本仓检查声明改走 `AGENTS.md`（§9）。
逐字目标文本（EN 面）与中文镜像对应改写清单见 §4.4「提示词编辑面」。编辑面 = 六档：

| 文件 | 编辑点（as-of 行号） |
|---|---|
| `src/prompts/discipline-engineering.md` | :44（树形状）· :59（A1 括号）· :73（A4 括号）· :171/:201（files 声明黑名单措辞）· :177（池句路径部）· :181（池边界）· :213–:214（自指脚本段） |
| `docs/design/prompts/discipline-engineering.md` | 对应中文位（:37 · :126 · :132 · :136 · :142–:143） |
| `src/prompts/advisor-design.md` | :9（地图引用）· :10（tier authority 引用）· :18（示例路径）· :24（自读提示词句） |
| `docs/design/prompts/advisor-design.md` | 对应中文位（:20 · :21 · :39 · :54） |
| `src/prompts/persona-eng-designer.md` | :13（写域句）· :27（docs/TODO 引用） |
| `docs/design/prompts/persona-eng-designer.md` | 对应中文位（:13 · :25） |

**红线（不得触碰）**：既有锚句族——`六段自写 · 一段一作者` / `batch_segment` 写入手段句 / 执行者拒收句 / 澄清必经主 agent / 三方条目一致 /
D1–D7 全表 / 锚#1–#7 / C1–C4 / T-RO 组 / A11 的 `batchDoc` 必传句（含示例路径——本批保留）/ FR19 固定子串（persona-eng-designer）。
编辑后跑 `test/prompts-async-guidance.test.mjs` + `test/prompts-dual-source.test.mjs` + `test/batch-segment.test.mjs` 全绿（新增用例不削弱任何既有锚）。

### 3.6 非 git 索引回退（PO-8）

新建 `src/memory/file-walk.mjs`：

- 共享跳过谓词 `isSkippedRelPath(rel)`（`SKIP_DIRS` + `.` 开头段——与 git 路径同源，消除现状三处副本）；
- `walkProjectFiles(dir, exts)`：递归遍历（symlink 不跟随）、逐文件匹配扩展名、上限护栏（maxFiles = 20000，超限即停 + 截断标记）。

`code-sync.mjs` `listProjectFiles`：git 失败分支由 `return []` 改为 walk 回退（含 `unlisted` 收集——§3.7）。
非 git 行为定义（FR15）：**索引 = 全量 walk（跳过规则 + 尺寸上限照旧；无 .gitignore 概念）· 增量 = 逐文件 mtime（无 commit 锚）· 启动 = 既有 full-scan 回退自动生效**。

### 3.7 索引扩展名与可见化（PO-9）

- `schema.mjs`：`CODE_EXTS` 增补主流语言（.cjs/.mts/.cts/.dart/.lua/.cs/.fs/.fsx/.clj/.cljs/.ex/.exs/.erl/.hrl/.scala/.pl/.pm/.r/.jl/.zig/.groovy/.ps1/.proto/.graphql/.tf/.hcl 等）；
  `DOC_EXTS` 增补（.mdx/.org/.wiki/.tex）。
- 声明追加：`conventions.json` 的 `index.codeExtensions` / `index.docExtensions`（并集生效；未知扩展名走 `detectLanguage` 既有回退 = 扩展名标签）。
- 可见化：`listProjectFiles` 返回 `{ entries, unlisted }`（未列入扩展名的文件计数样本）；
  `codeSync`/`docSync` 结果含 `unlistedExts`；`/reindex` 打印提示行（含声明指路）；同步事件入日志。
- `code-index.mjs`：`detectLanguage` 为新语言补标签（少量）。

### 3.8 `/eng` 与提示文案（PO-11）

- `cmd-eng.mjs`：删除 METHODOLOGY 门禁与模板分支（含 `templateDir` / `existsSync` / `copyFileSync` 引用与 picker）；
  切换 = 无前提（FR11）；ON 提示行去掉 `strictly following <methodologyPath>`，改为 `→ design-before-code enforced (design review + user approval before code)`；
  R16 令牌语义与 OFF 提醒、槽持久化**零改动**。
- `thincoder-core/agent-tools/eng.mjs:59`：消息文案去 `in docs/`（逐字见 §4.4）。
- `dispatch.mjs:204` hint：去 `in docs/` + 未声明时的声明指引（逐字见 §4.4）。
- `thincoder-core/config.mjs:76` 注释随批纠正（1 行）。

### 3.9 FR14 落实（PO-12）

推进档位契约逐条写进需求档（`requirements/PORTABILITY.md` §3——本批已落）；本批不新增实现面。

## 4. 接口契约

### 4.1 `.thincoder/conventions.json`（schema）

```json
{
  "codePaths": ["src"],
  "index": { "codeExtensions": [], "docExtensions": [] },
  "advisor": { "docMap": "", "standardsDoc": "" }
}
```

- 全部键可选；缺失 / 空串 / 类型错 → 回退默认（`codePaths` 默认 `["src"]`；其余默认空 = 不生效）；
- `codePaths`：路径**段名**数组（任意深度匹配）；声明即**替换**默认（非并集）；
- `index.*Extensions`：对内置表的**追加**（并集）；
- `advisor.docMap` / `advisor.standardsDoc`：项目根相对路径；找不到文件时走降级句（§4.4）。
- 解析：`JSON.parse` + 逐键类型校验；失败 → 默认 + `console.warn` + 日志事件。

### 4.2 `thincoder-core/conventions.mjs`（API）

| 导出 | 语义 |
|---|---|
| `DEFAULT_CODE_PATHS` | `["src"]`（数据常量——默认约定，可覆盖） |
| `loadConventions(cwd)` | 读 `.thincoder/conventions.json` → 归一为完整约定对象（缓存按 cwd） |
| `clearConventionsCache()` | 缓存清理（测试 seam） |
| `isTempPath(p)` / `isDocPath(p, conv)` / `isCodePath(p, conv)` / `classifyPath(p, conv)` | 分类裁判（唯一实现；接受 `/` 与 `\\`、绝对与相对路径） |

### 4.3 降级可见契约（逐面）

| 面 | 缺失场景 | 可见化通道 |
|---|---|---|
| 文档地图 | 探测 + 声明皆无 | 评审消息显式降级句（PROJECT-CONTEXT 注入）+ 评审要求自查声明局限 |
| 项目标准 | 未声明 | 评审消息显式降级句（同上） |
| 设计门禁 | 未声明约定（默认判据命中） | 拒绝 hint 说明判据来源 + `.thincoder/conventions.json` 声明指路 |
| 索引扩展名 | 文件扩展名未列入 | 同步结果 `unlistedExts` + `/reindex` 提示行 + 日志事件 |
| 非 git | 无 git 仓库 | 索引 = walk 可用（不算降级）；评审消息 = 变更上下文降级句 |
| 检查点 | 无 git | 已核实 = 明确报错（运行时文案 `Not a git repository — checkpoints unavailable`——`thincoder-core/tools/git-checkpoint.mjs:41`）——**不改**，登记为已定义 |

### 4.4 逐字文本（coder 机械落笔——EN/中文镜像对应）

**项目上下文降级句（EN，`project-context.mjs`）**：

- 无文档地图：`(No document map found under the project root, and none is declared — the Document ownership criterion is degraded: check placement against the Project Guide where present, and state the limitation in your findings.)`
- 无标准文档：`(No project standards document was declared — judge methodology compliance from the Project Guide (when present) and the review criteria above; state the limitation in your findings.)`
- 无 git：`(No git repository detected — change-set context is unavailable; read the review-scope files directly.)`

**评审指令改写（EN，`messages.mjs`）**：

- `1. Read every document in the Documents to Review list in full — review ONLY those files. Read METHODOLOGY.md to understand the project's standards.` → 删去第二句（标准文档段已注入/降级）。
- `1. Read the design document fully. Read METHODOLOGY.md to understand the project's standards.` → `1. Read the design document fully.`
- `methodology compliance (does it follow the project's METHODOLOGY.md?)` → `methodology compliance (does it follow the project's standards as provided?)`。

**门禁 hint（EN，`dispatch.mjs`）**：`Engineering mode: write the design document first（location per your project's document conventions）, then call advisor with type='design' to review it, and wait for user approval. Implementation is done by eng-coder subagents.`
未声明约定且默认命中时追加：` — this path was classified as product code by the default conventions (code paths: src); declare project conventions in .thincoder/conventions.json to adjust.`

**advisor 文档门禁拒绝文案（EN，`agent-tools/advisor.mjs`）**：`Advisor: design review documents must be documentation files (per the project's conventions). Invalid: <invalid list>`（旧句「must be in docs/ directory or be recognized doc files」退役——`docs/` 前缀判据同批换源）。

**eng 工具消息（EN，`eng.mjs`）**：`write a design document in docs/` → `write a design document first (location per your project's document conventions)`。

**提示词编辑面（EN 逐字 + 中文镜像对应改写）**：

- `src/prompts/discipline-engineering.md:44`：`板块设计文档（docs/design/<TOPIC>.md——一板块一档、功能点不独立成文）` → `板块设计文档（一板块一档、功能点不独立成文——落点按项目文档约定；本产品自研仓 = docs/design/<TOPIC>.md）`
- `:59`：`（查 docs/README.md 总地图——已有则更新不新建）` → `（查项目文档地图——本产品自研仓 = docs/README.md；已有则更新不新建）`
- `:73`：`（对应板块 docs/design/<TOPIC>.md）` → `（落点按项目文档约定；本产品自研仓 = 对应板块的 docs/design/<TOPIC>.md）`
- `:171`/`:201`：`— parent-side maintained files (docs/TODO.md, CHANGELOG.md, checklist family) must not be listed;` → `— the project's own process files (requirement pool / changelog / checklist family — 本产品自研仓 = docs/TODO.md / CHANGELOG.md / checklist) must not be listed;`
- `:177`：`the project docs/TODO.md「` → `the project's requirement-pool record（池文件按项目约定；本产品自研仓 = docs/TODO.md）「`（句子其余部分逐字保持——含 `Requirement Pool」group first; design does not start until the user says start this batch (or marks the point urgent — fast lane).`）
- `:181`：`技术待办仍走 docs/TODO.md 技术组` → `技术待办仍走项目技术待办区（本产品自研仓 = docs/TODO.md 技术组）`
- `:213–:214`（整句替换——**全删本仓指涉**、不用「本产品自研仓 =」标注形态）：
  旧句 `检查：node scripts/check-doc-width.mjs（扫 docs/design + docs/requirements + docs/batches 无 >300 单行；同时跑 V1 段引用 / V2 计数一致性校验——新增违规阻断、存量入基线报告）。判据权威源：docs/README.md 文档规范 §2.7。`
  → 新句 `检查：按项目自身的文档规范核验（通用判据：无 >300 字符单行、正常换行与分隔；项目另有声明时以项目为准）。`
- `src/prompts/advisor-design.md:9`：`(per the document map in docs/README.md)` → `(per the project's document map, when the review context provides one)`
- `:10`：`Tier authority: the code-structure criteria section of the discipline-layer prompt discipline-normal.md (the former METHODOLOGY.md is retired).` → `Tier authority: the code-structure criteria stated in this bullet.`
- `:18`：`(e.g. docs/design/AGENT-LOOP.md:180)` → `(e.g. path/to/file.md:42)`
- `:24`：旧句 `Read the design document fully. Read the discipline-layer prompts (discipline-engineering.md / discipline-normal.md) and docs/README.md to understand the project's standards.`
  → 新句：`Read the design document fully. Judge against the Project Guide (when present in the review context) and the review criteria in this prompt — do not assume any particular project files.`
- `src/prompts/persona-eng-designer.md:13`：写域句改 `Your write domain = the project's requirements/design documents（落点按项目文档约定；本产品自研仓 = docs/，扣除 docs/design/prompts/——提示词文件（含中文模板）是产品代码，不归你）。`
- `src/prompts/persona-eng-designer.md:27`：`advance docs/TODO.md status when merging requirements` → **as-of 已失效**（旧串实施时已不存在——
  该行先经「2026-09-11 归属修订」（POOL-LEDGER 批）改写为归主 agent 句）；**实际交付**（归属修订后现文）：
  `**todo 状态推进**（记录 + 状态推进 + 物理落笔）归 **主 agent**（2026-09-11 归属修订）——本角色只做需求档条文修订，不触碰项目台账档。`（`todo 状态推进` 子串保持）。

**中文镜像逐字目标文本（coder 机械落笔依据；内容权链 = 设计草案 → 主 agent §4 确认）**：

- `docs/design/prompts/discipline-engineering.md`
  - `:37` ↔ EN `:44`：逐字同改（两档同句）——替换文本见上 `:44` 行。
  - `:126` ↔ EN `:171`：CN 侧中文句——`——父侧维护文件（docs/TODO.md、CHANGELOG.md、checklist 族）不得列入；` → `——项目自身的流程文件（需求池 / 变更记录 / checklist 族——本产品自研仓 = docs/TODO.md / CHANGELOG.md / checklist）不得列入；`
  - `:132` ↔ EN `:177`：逐字同改（该行即英文原句——替换文本见上 `:177` 行）。
  - `:136` ↔ EN `:181`：逐字同改（两档同句——替换文本见上 `:181` 行）。
  - `:142–:143` ↔ EN `:213–:214`：逐字同改（两档同句——整句替换文本见上 P7 落点）。
- `docs/design/prompts/advisor-design.md`
  - `:20` ↔ EN `:9`：`（按 docs/README.md 总地图）` → `（按项目文档地图——当评审上下文提供时）`
  - `:21` ↔ EN `:10`：`档位权威 = 纪律层 discipline-normal.md 代码结构判据节（原 METHODOLOGY.md 已退役）。` → `档位权威 = 本条目陈述的代码结构判据。`
  - `:39` ↔ EN `:18`：`（如 docs/design/AGENT-LOOP.md:180）` → `（如 path/to/file.md:42）`
  - `:54` ↔ EN `:24`：`完整读设计文档。读纪律层提示词（discipline-engineering.md / discipline-normal.md）与 docs/README.md 了解项目标准。` → `完整读设计文档。按评审上下文中提供的 Project Guide（存在时）与本提示词的评审标准判断——不假定任何具体项目文件。`
- `docs/design/prompts/persona-eng-designer.md`
  - `:13` ↔ EN `:13`：`写域 = docs/ **扣除 docs/design/prompts/**（提示词中文模板也是提示词文件，不归你）。` → `写域 = 项目的需求档 / 设计档（落点按项目文档约定；本产品自研仓 = docs/，扣除 docs/design/prompts/——提示词文件（含中文模板）是产品代码，不归你）。`
  - `:25` ↔ EN `:27`：`并入需求时同步推进 docs/TODO.md` → **as-of 已失效**（旧串实施时已不存在——
    该行先经「2026-09-11 归属修订」（POOL-LEDGER 批）改写为归主 agent 句）；**实际交付**（归属修订后现文）：
    `**todo 状态推进（记录 + 状态推进 + 物理落笔）归主 agent**（2026-09-11 归属修订——本角色只做需求档条文修订，不触碰台账档）。`（`todo 状态推进` 子串保持）

双源纪律照旧：语义同源、文本自持（不要求字节一致——`docs/design/prompts/*` 为中文权威、`src/prompts/*` 为落地面）；落地后跑 `test/prompts-async-guidance.test.mjs` + `test/prompts-dual-source.test.mjs` + `test/batch-segment.test.mjs` 全绿（红线锚句族零触碰——§3.5）。

## 5. 受影响文件全清单

> 行数 as-of 2026-09-11 实测（口径 = 行计数）。纯 `.md` 豁免行数档；新档 ≤300。

**面① 分类核心与门禁（PO-10/11）**

| 文件 | 性质 | 当前行数 | 预计增量 |
|---|---|---|---|
| `thincoder-core/conventions.mjs` | **新增** | — | ~120（300 内） |
| `src/agent/dispatch.mjs` | 修改 | 480 | ≤±12（换源 + hint） |
| `thincoder-core/advisor/repos.mjs` | 修改 | 173 | ≤±14（谓词换源） |
| `thincoder-core/agent-tools/advisor-settle.mjs` | 修改 | 213 | ≤±5（本地谓词删除） |
| `thincoder-core/agent-tools/verify.mjs` | 修改 | 292 | ≤±10（换源 + 死代码清） |
| `src/tui/cmd-eng.mjs` | 修改 | 94 | 净减 ~25（门禁/模板删除） |
| `thincoder-core/agent-tools/eng.mjs` | 修改 | 67 | ±2 |
| `thincoder-core/config.mjs` | 修改 | 487 | ±1（注释） |
| `thincoder-core/agent-tools/advisor.mjs` | 修改 | 241 | ≤±6（门禁换源 + 拒绝文案 + 注释 :112） |
| `thincoder-core/advisor.mjs` | 修改 | 290 | ±1（过期注释 :5） |

**面② 索引（PO-8/9）**

| 文件 | 性质 | 当前行数 | 预计增量 |
|---|---|---|---|
| `src/memory/file-walk.mjs` | **新增** | — | ~80（300 内） |
| `src/memory/schema.mjs` | 修改 | 440 | ≤±8（扩展名表） |
| `src/memory/code-sync.mjs` | 修改 | 374 | ≤±25（walk 回退接线 + unlisted） |
| `src/memory/docs.mjs` | 修改 | 413 | ≤±8（返回形态适配） |
| `src/memory/code-index.mjs` | 修改 | 213 | ≤±8（语言标签） |
| `src/tui/cmd-reindex.mjs` | 修改 | 44 | ≤±8（提示行） |

**面③ 注入与提示词（PO-1–PO-7）**

| 文件 | 性质 | 当前行数 | 预计增量 |
|---|---|---|---|
| `thincoder-core/advisor/project-context.mjs` | **新增**（D8 登记计划兑现） | — | ~200（300 内） |
| `thincoder-core/advisor/messages.mjs` | 修改 | 413 | 净减 ~110（拆分迁出 + P1–P3） |
| `src/prompts/discipline-engineering.md` | 修改 | 226 | ≤±12 |
| `docs/design/prompts/discipline-engineering.md` | 修改 | 154 | ≤±10 |
| `src/prompts/advisor-design.md` | 修改 | 41 | ≤±6 |
| `docs/design/prompts/advisor-design.md` | 修改 | 69 | ≤±6 |
| `src/prompts/persona-eng-designer.md` | 修改 | 56 | ≤±4 |
| `docs/design/prompts/persona-eng-designer.md` | 修改 | 53 | ≤±4 |

**测试面**

| 文件 | 性质 | 当前行数 | 预计增量 |
|---|---|---|---|
| `test/portability-classification.test.mjs` | **新增** | — | ~150 |
| `test/cmd-eng.test.mjs` | **新增** | — | ~90 |
| `test/portability-index.test.mjs` | **新增** | — | ~160 |
| `test/portability-advisor-context.test.mjs` | **新增** | — | ~130 |
| `test/prompts-async-guidance.test.mjs` | 回归（预计零改） | 419 | 0（锚句设计已避让；若实测红→按本设计语义改字面并登记） |
| `test/prompts-dual-source.test.mjs` | 回归 | 174 | 0–小改（同上） |

**文档面（本批产物 + 父侧维护）**：`docs/requirements/PORTABILITY.md`（新增，本批已落）· `docs/design/PORTABILITY.md`（本档）·
`docs/README.md`（新板块登记——**父侧**）· `docs/TODO.md`（核销/指针——**父侧**）·
`AGENTS.md`（本仓自指面落点：check-doc-width 检查声明 + 文档规范指路——**父侧内容权**）· `CHANGELOG.md`（**父侧**）。

**实现面拆分建议（供父侧 spawn）**：面① → 面②/面③ 各自独立（文件域不相交；②③ `dependsOn` ①——共用 `conventions.mjs`）。

## 6. 用例表

> 回指列 = PO 条目号；宿主 = 对应面新档（§5）。正常/边界/错误三态覆盖。

| # | 场景 | 输入 | 预期输出 | 回指 |
|---|---|---|---|---|
| T-01 | 正常 | 无声明；`src/x.mjs` / `docs/a.md` / `tmp-x.mjs` | code / doc / temp | PO-10 |
| T-02 | **边界（原缺陷反证）** | `packages/foo/src/x.md`（嵌套布局） | code（不再当文档绕过门禁） | PO-10 |
| T-03 | 边界 | 声明 `codePaths:["lib"]`；`lib/a.md` / `src/a.md` | code / doc（声明**替换**默认） | PO-10 |
| T-04 | 边界（分隔符 + 祖先段反例） | `\\` 与 `/` 混合、绝对路径、`.` 段路径；反例 `C:\src\app\docs\a.md`（祖先含 `src` 段） | 分隔符面分类一致；反例 → code（段匹配含祖先——默认约定已知代价；项目声明 `codePaths` 即消除，§4.1） | PO-10 |
| T-05 | 错误 | `conventions.json` 非法 JSON / 类型错 | 回退默认 + warn + 不抛 | PO-10 |
| T-06 | 正常（门禁） | 工程模式 + 无令牌 + 写 `src/x.mjs` | 拒绝（design gate）——既有锁保持 | PO-10 |
| T-07 | 边界（门禁） | 同上 + 写 `packages/foo/src/x.md` | **拒绝**（原为放行=反证锁） | PO-10 |
| T-08 | 边界（门禁） | 同上 + 写 `docs/design/x.md` | 放行（设计产物豁免保持） | PO-10 |
| T-09 | 错误（文案） | 门禁拒绝 hint | 含声明指路；**不含** `in docs/` | PO-11 |
| T-10 | 正常（注入） | — | 已退场（整删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §11.3） | PO-1 |
| T-11 | 边界（缺料） | — | 已退场（整删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §11.3） | PO-1/2/3 |
| T-12 | 正常（声明） | — | 已退场（整删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §11.3） | PO-1 |
| T-13 | 正常（非 git） | 临时目录（无 `.git`）含 `a.mjs`/`b.md` | `listProjectFiles` 返回两者；索引非空 | PO-8 |
| T-14 | 边界（walk） | 含 `node_modules/`、`.hidden/`、超限文件数 | 跳过规则同源；截断标记 | PO-8 |
| T-15 | 正常（扩展名） | `.dart`/`.lua`/`.cs`/`.org` 文件 | 默认可索引 | PO-9 |
| T-16 | 边界（声明） | `index.codeExtensions:[".xyz"]` | `.xyz` 入索引；未列入 → `unlistedExts` 计数 | PO-9 |
| T-17 | 正常（文案） | `/reindex` with unlisted | 打印声明指路提示行 | PO-9 |
| T-18 | 正常（/eng） | 空项目（无 METHODOLOGY.md） | 不弹窗、不崩；`Engineering mode: ON` | PO-11 |
| T-19 | 边界（/eng） | OFF 切换 | 提醒推入 + 令牌语义保持（快照断言） | PO-11 |
| T-20 | 正常（提示词） | — | 已退场（整删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §11.3） | PO-4–7 |
| T-21 | 正常（FR14） | — | 已退场（整删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §11.3） | PO-12 |
| T-22 | 边界（门禁·保守） | 工程模式 + 无令牌 + 变更工具未给出字符串路径（`touchedPaths` 返回非字符串/缺失） | **拒绝**（`typeof p !== "string"` 保守拦截保持——未知路径不放行） | PO-10 |

## 7. 验收标准（AC-01–AC-14——逐条回指）

| # | 验收标准（机器可验证） | 回指 |
|---|---|---|
| AC-01 | 全仓 grep：门禁/守卫的 `^src[\\/]` 与组件式正则副本 = 0（唯一实现 = `thincoder-core/conventions.mjs`） | PO-10 · FR12 |
| AC-02 | T-01–T-05 全绿；`packages/foo/src/x.md` 判 code（嵌套漏判消除） | PO-10 · FR12 |
| AC-03 | T-06–T-08 + T-22 全绿（既有门禁锁保持 + 反证用例转绿方向 = 拒绝 + 未知路径保守拦截保持） | PO-10 · FR12 |
| AC-04 | `conventions.json` 缺失/损坏不崩溃；声明后行为切换有测试 | PO-10 · FR10 |
| AC-05 | 判据面退场（T-11/T-12 均整删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §11.3） | PO-1/2/3 · FR10/11 |
| AC-06 | 六档编辑面内指令性引用 = 0（`docs/README.md` / `docs/design/<TOPIC>.md`——「本产品自研仓 =」示例标注形态除外）；`check-doc-width` 零指涉（全形态——P7 自指删除，脚本声明走本仓 `AGENTS.md`）；六档外同类（P11——`src/prompts/discipline-normal.md:13/:32`）归批次三（§9） | PO-4–7 · FR13 |
| AC-07 | 既有提示词锚测试全绿（async-guidance + dual-source + batch-segment）；红线锚句逐一在位 | PO-4–7 · FR13 |
| AC-08 | `/eng` 无前提下 ON 不崩（T-18）；OFF 语义零回归（T-19） | PO-11 · FR11 |
| AC-09 | 非 git：T-13/T-14 全绿；评审无 git 降级句在场 | PO-8 · FR15 |
| AC-10 | 扩展名：T-15–T-17 全绿；`unlistedExts` 字段与提示行存在 | PO-9 · FR10 |
| AC-11 | 门禁/工具文案去 `in docs/`（grep 0）；声明指路在场 | PO-11 |
| AC-12 | `messages.mjs` 拆分兑现：新档 `project-context.mjs` 在位、`messages.mjs ≤ 500` 且较 413 净减；既有导出面零破（re-export 保持） | PO-10（D8） |
| AC-13 | FR14 契约落 `requirements/PORTABILITY.md`（T-21 已退场——整删，删除记录 = `TESTING.md` §11.3） | PO-12 · FR14 |
| AC-14 | 批级机检：`node scripts/check-doc-width.mjs` 新增超宽 0 + 一致性新增违规 0；`npm test` 快层全绿；全部受改文件 ≤500 | 全批 |

> 会话级验证方向（`ENGINEERING-MODE.md` §2 尾）：在**非 Node / 非 `src` 布局 / 无 `docs/` 树 / 非 git** 的项目跑一次工程模式全流程演练——
> 不得静默失效、不得被不存在的文件卡住（父侧/用户手动面；机械面由 AC-01–AC-14 承载，此条为最终压测方向）。

## 8. 关键决策记录

- D1–D8 见 §2（各含被否决备选与理由）。
- **附加决策**：① `repos.mjs` 的 `isDocFile`/`isTempFile` 谓词迁入 `conventions.mjs`（`repos.mjs` 内消费点改导入；**导出面不保留双份——不设 re-export**：四个导入方全部换源（含第 4 导入方 `thincoder-core/agent-tools/advisor.mjs`——设计评审文档门禁）；裁决与接线见 §3.3）；
  ② `verify.mjs` 换源后删除失引 helper（死代码随批清理——铁律 2）；
  ③ 本批不建本仓自用 `.thincoder/conventions.json`（默认判据对本仓即正确——docMap 探测命中、codePaths 默认命中；需要时父侧随批补，见 §10）；
  ④ 提示词文案逐字定稿于 §4.4（含中文镜像逐字目标文本），coder 机械落笔；主 agent 内容权行使 = 修正轮路径（设计档修订）；
  ⑤ 过期注释随批更正（换源后指涉失实）：`src/agent/dispatch.mjs:186` · `thincoder-core/agent-tools/advisor.mjs:112` · `thincoder-core/advisor.mjs:5`。
- **与既有纪律核对**：FR13 照 §3.5/§4.4 落地；双端纪律——本批 CLI 单端，VSC 镜像面按语义同源登记（§9）；
  D1 写权矩阵——提示词 = 主 agent 内容权 + coder 落笔；D2——判据单一权威 + 本档不重述 FR 正文（指针）；
  冻结窗口（D5）——本设计不触他链在途档（`docs/design/ENGINEERING-MODE.md` §2.26/§2.27 零触碰）。

## 9. 边界（本批不做）

- **B/C 家族剩余**（P11–P13、P16–P28 与 🔵 项）——批次三（§1.4）；其中 `src/prompts/discipline-normal.md:13/:32`（+ CN 镜像同款）的 `docs/README.md` 地图引用属**已登记 P11**（`docs/TODO.md` 勘察表；六档编辑面外——不计入 AC-06 作用域）。
- **VSC 端实现**——批次二登记。镜像清单（勘察实测）：`thincoder-core/advisor/messages.mjs`（METHODOLOGY/地图注入 + 指令句）·
  `src/agent/execute-tools.mjs:108（VSC 仓）` 判据 · `thincoder-core/advisor/repos.mjs:151` · `index-discover.mjs` 扩展名 ·
  `thincoder-core/agent-tools/advisor.mjs:216-225` 校验 · 六档提示词对应位 · `advisor-round1.md` 的 Project Guide 锚（VSC 缺注入实现——真缺口，随镜像批评估）。
- **FR10–FR15 正文搬迁归位**（`ENGINEERING-MODE.md` §2 → 需求档）——父侧裁决项。
- **不触碰**：他链在途档（`docs/design/ENGINEERING-MODE.md` §2.26/§2.27、`docs/TODO.md` 自身、POOL-LEDGER 面）· 第 7–14 批已交付行为面 · `.thincoder/index` 死产物清理（另立项）· 检查点非 git 改造（已核实为明确报错）。
- **本仓自指面**（父侧落）：`AGENTS.md` 增「文档改动跑 `node scripts/check-doc-width.mjs`」声明 + 文档规范指路（替代提示词中移除的自指句）。

## 10. 待定项（open）

- **open-1**：本仓是否补 `.thincoder/conventions.json`（dogfood；当前默认即正确，非必需）——父侧酌定。
- **open-2**：批次二（VSC 镜像）与批次三（B/C）的排期与是否合并——用户/父侧。
- **open-3**：P9 候选 2（全文本索引）是否纳入远期路线——登记不实施。
- **open-4**：分类裁判对绝对路径的**相对化**（消 `C:\src\app` 类祖先段假阳）——本批择「声明修正」路径（§6 T-04 注）；相对化需引入项目根上下文（触碰 §4.2 API 面）——登记不实施，实证需要再评估。

## 11. 批次二·VSC 镜像面（2026-09-11 补节——回指）

> 本批（批次二 = VSC 镜像面）的对位设计 = `PORTABILITY（VSC 仓）`（新建——父侧预授权；
> **权威正文在该档，本节只登记与回指**、不复制）。批次档 = `2026-09-11-PORTABILITY-VSC-MIRROR（VSC 仓）`；
> 需求面 = `../requirements/PORTABILITY.md` §5。

- **对位结论（三态）**：P1–P10 + P14 在 VSC 端逐条勘察——**需修 10 项**（P1/P2/P3/P4/P5/P6/P7/P9/P10 + P15 文案）·
  **已对位 2 项**（P14 本体——VSC `eng` 无门禁、无对位物；P8 索引侧——VSC `src/indexer.mjs:231`（VSC 仓；至 246 行） 已有非 git walk 回退）·
  **真缺口 1 项**（Project Guide 注入——`src/prompts/advisor-round1.md:7` 锚无实现）；逐条表见 VSC 档 §1.2。
- **本批条目**：VP-1–VP-12（VSC 档 §1.3——三方一致锚：批次档 §2 = VSC 档 §1.3 = VSC 档 AC 回指）。
- **双端镜像纪律执行**：各端独立实现、语义同源——本档（CLI）产物不回改 VSC 端、VSC 文本以 VSC 档定稿为准；
  评审消息文案选定同文（跨端语汇一致——VSC 档 §2 D6，非 byte-identical 同步依赖）。
- **与 CLI 批口径的差异（已落档）**：① R24 行——CLI 批「保留登记」、VSC 批「EN 对齐 CN 现形态」（VSC 档 §2 D4）；
  ② VSC `isDocOnlyChange` / `verify` 副本面为 VSC 特有接线（VSC 档 §3.2 全表）。
- **回归面**：VSC `prompts-mirror-anchors`（跨仓逐字锚——本批编辑点已逐一避让）· `prompts-async-guidance` · `doc-consistency` ·
  `advisor-chain-guards` · `eng-settlement` · `verify-redesign` · `index-perception`。

## 变更记录

- 2026-09-11：建档（本批 = 工程模式可移植性修复批——范围裁定 + 逐条修法 + 验收）。
- 2026-09-11（修正轮——设计评审轮次 1 后）：12 条发现（🔴1 · 🟡7 · 🔵4）全部落档——advisor 门禁换源与导出面裁决 · P7 自指全删 · 中文镜像逐字目标文本 · 行数标注改准 · AC-06 作用域 · 门禁保守拦截注记 + 用例 T-22 · 归属判定留痕 · T-04 反例 · 过期注释清理面 · 检查点引文改准；逐条落点见批次档 §2 修正轮块。
- 2026-09-11（批次二补节）：新增 §11（VSC 镜像面对位登记——回指 VSC 档，不复制正文）。
- 2026-09-11（实施后 as-of 回修——#186 微修，承 VSC 镜像批 §6 遗留 ③）：§4.4 `persona-eng-designer.md:27` / `:25` 两行（todo 句）修为实际交付口径——as-of 已失效（旧串经「2026-09-11 归属修订」（POOL-LEDGER 批）改写为归主 agent 句）；实际交付 = 归属修订后现文（EN `不触碰项目台账档` / CN `不触碰台账档`）；原「尾注保持」注记随句改写失效、已删。
