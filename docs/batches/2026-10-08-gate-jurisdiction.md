# 2026-10-08 · 门禁辖域收正
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-08 · 来源 = 用户 2026-10-08 16:37 裁定「拒绝的机制有问题——只能拒绝有 manifest 的目录以下的内容，不能管 manifest 范围以外的东西」+ 16:38「可以，自动跑到交付」（全链授权）。
> 台账 = #1104（core · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-08
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 批件（用户 2026-10-08 16:37 裁定 + 16:38 全链授权）

**背景**：工作区根（`D:\teamcode`，无 manifest）下 `.log/.diff/.bat` 类杂物清理被工程模式父侧门拒删——用户实报「那是那个拒绝的机制有问题。应该只能拒绝有 manifest 的目录以下的内容，不能管 manifest 范围以外的东西。」= **辖域越权**定性（现机制实读 = 声明取会话 cwd、目标体按缺省 fail-closed 判码 ⇒ 无档面向亦被管）。

**范围**：#1104（F11 门禁辖域 = manifest 树以内）+ **#1102 并批**（未声明 hint 防误导——随本收正**结构性消解**：#1102 原案「工作区锚勿轻建」形态退场）+ **#1103 伴随**（运行时提示词两句——父笔文本，实施轮随落）。

**授权**：16:38「可以，自动跑到交付」= 全链（代点火评审 ∥ 修正轮 ∥ 代签 ∥ 实施 ∥ 复核 ∥ 收口 ∥ 签入）。自缚三条：① 代签仅当三条件齐备（评审 pass ∥ 修正落地并核验 ∥ token 已签发）；② 新范围 / 用户口径裁决 ⇒ 停；③ 破坏性 / 不可逆 ⇒ 先停。

**口径（用户语义五条）**：① 辖域按目标祖先链——任一级祖先带 `PROJECT-MANIFEST.json` ⇒ 在辖；② 判据声明面 = 目标所属项目（最近祖先，nearest wins），不再取会话 cwd；③ 项目内判定零改（code 段 / fail-fast / aux·temp·doc·state 豁免）；④ 无 manifest 面一律不管（工作区根 ∥ 未建档新项目 ∥ 仓外）；⑤ 不可解析目标（非串 ∥ 空串）保守拦截不变。

**同日连带（本批外 · 在册）**：#1105（机检面：悬空 2 + 陈旧坐标 3——MANIFEST.md ∥ TOOLS.md ∥ DESIGN-TOKEN-SETTLEMENT.md）∥ #1108（HEAD 即红批内件 3 组）。

## §2 批次任务与设计（eng-designer）
**状态行**：✅ 设计完成 2026-10-08（F11 辖域收正（#1104 ∥ #1102 并批；#1103 伴随））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### §2.1 本批条目（覆盖）

| # | 条目 | 出处 | 本批角色 |
|---|---|---|---|
| 1 | **#1104 / F11**——设计闸辖域 = manifest 树以内 | 需求档 `docs/core/requirements/PORTABILITY.md` §2 F11；用户 2026-10-08 16:37 裁定 | 本批主体 |
| 2 | **#1102**——父门未声明 hint 收正（指名所属项目） | 台账 #1102（并批） | 并入（同机制面） |
| 3 | **#1103**——运行时提示词两句（歧义 = 停不建 ∥ 工作区非项目） | 台账 #1103（同批顺落） | **伴随项——文本 = 父侧笔**（本设计不落文本；落点登记 = §2.4 行 7） |

**明确不在本批（零改）**：eng-coder 角色门 ∥ spawn `files` 域二道防线 ∥ F9 / F10 既有语义（aux / state 豁免）∥ D5 冻结窗与批次档写门 ∥ VSC 端自有机制（随核单源——端面零改）∥ 需求档本体（父笔）。

### §2.2 设计档落点（设计笔——本席）

- `docs/core/design/PORTABILITY.md`：§2 表「父侧设计门禁」行收正 ∥ §3.1 增「读向按用点」条 ∥ §3.2 API 表增行 8（`declarationForTarget`——辖域单点）∥ §3.4 设计门禁行（hint = 所属项目 manifest 路径）∥ **新增 §3.9**（F11 消费面核销六面）∥ §4 增 D20 ∥ §5 增 T-36 / T-37 / T-38 / T-V28 ∥ 头部 as-of ∥ 落点指针 + 变更记录。
- `docs/core/design/AGENT-LOOP.md`：§6.4 预审块门行 `:287` 收正（1 行）。

### §2.3 机制设计

- **辖域单点**（`thincoder-core/declaration.mjs` 新导出 `declarationForTarget(targetAbs)`——经 `conventions.mjs` 转口，消费面与 `loadProjectDeclaration` 同径 import）：绝对目标 ⇒ `owningProject`（KD-M1-30 归属形——沿祖先链取最近带档目录 / nearest wins / 纯 fs / 不跨兄弟）⇒ 该项目的声明对象（既有 `loadProjectDeclaration`——按档路径缓存，本体零改）；祖先链无档 ⇒ `null` = 出辖。**发现梯（`discoverProjects`）不参与**——无候选 / 歧义均出辖。
- **门侧接线**（`thincoder-core/agent/dispatch.mjs:89-111` 块——逐目标循环）：① 非串 ∥ 空串 ⇒ 保守拦截（原 `typeof p !== "string"` 面保持；空串并入「不可解析」——旧读数本亦拦，行为零漂移）；② `abs = resolve(agent.cwd, p)`（相对形按会话 cwd 解析——cwd 只是相对基、非声明源；与 D5 分支 `:127` 同式）；③ `conv = declarationForTarget(abs)`；`null` ⇒ 该目标放行；④ 在辖 ⇒ `isCodePath(abs, conv)` 判码（判读按 **abs** 形——面判基准 = 所属项目根 `conv.root`；code 段 / fail-closed 兜底 / doc·temp·aux·state 豁免全照旧）；任一目标被拦 ⇒ 整调用拒（reason 逐字不变 `engineering design gate`）。
- **hint 收正（#1102）**：未声明指路段由 cwd 档改指**所属项目**档——`declare project conventions in ${manifestFilePath(conv.root)} to adjust.`（绝对路径；`manifestFilePath` 单源 KD-M1-18——不重写 join 式，故引入 `../manifest.mjs` import）；注记条件不变（`!conv.declared`）；跨项目多目标 = 首个「未声明且被判码」目标所属项目；零此类 ⇒ 无注记段。（#1102 原案「工作区锚勿轻建」**结构性消解**——出辖面零拒绝、零指路。）
- **零改面**：分类器判据（`conventions.mjs`——`declarationForTarget` 为新增导出，分类逻辑零改）∥ eng-coder 门（`dispatch.mjs:66-74`）∥ spawn 域 ∥ 冻结窗 / 批次档写门（`dispatch.mjs:121+`）∥ 其余分类消费者（变更记账 / verify / 陈旧 / 评审范围）。

### §2.4 受影响文件与测试面

| # | 文件 | 现读（2026-10-08） | 变更 | 预估 Δ |
|---|---|---|---|---|
| 1 | `thincoder-core/declaration.mjs` | 218 行 | 新增 `declarationForTarget`（`owningProject` import + JSDoc）；既有面零改 | ≤ +25 |
| 2 | `thincoder-core/conventions.mjs` | 192 行 | 转出口 +1 名 | ±2 |
| 3 | `thincoder-core/agent/dispatch.mjs` | 254 行 | 门块辖域化（逐目标判 + hint 换指）+ `manifestFilePath` import | ≤ +25 ∕ −8 |
| 4 | `docs/core/design/PORTABILITY.md` | 336（批前实读——本设计轮后 377） | §2 / §3.1 / §3.2 / §3.4 / §3.9（新）/ §4 D20 / §5 / 头部 / 变更记录 | +41（已落） |
| 5 | `docs/core/design/AGENT-LOOP.md` | 643 行 | 门行 `:287` 收正（已落） | ±1 |
| 6 | `docs/batches/2026-10-08-gate-jurisdiction.test.mjs` | 新建 | 机检腿 T-36 / T-37 / T-38 / T-V28（批内件——不进仓套件；实施轮写 + 跑） | ~200 |
| 7 | `thincoder-core/prompts/persona-engineering.md` | 200 行 | **伴随项 #1103**——两句（歧义 = 停不建 ∥ 工作区非项目）；**文本 = 父侧笔**（登记不落笔） | +2 |
| 8 | `docs/core/design/API-CONTRACT.md` | 3400 行 | 交付前机械刷新：`node scripts/api-contract.mjs --write`（生成区整区替换——生成器唯一笔）；本批新导出 `declarationForTarget` 与全表行号随刷对齐（评审 #2 补登） | ±数行（整区重生成） |

行数口径：产品三档实读均远离 500 软线（500/800 口径 2026-10-08 起——#1072）。测试面 = 行 6 批内件（自持——不进仓套件）；实施轮**先红后绿**（红基线 = 现盘无档面被拒形，读数入批档 §5）；仓套件 = 交付时父侧一次。

**机检腿（八个读数面——派单必含五面全在腿 1–5）：**

| 腿 | 面 | 断言（判据线） |
|---|---|---|
| 腿 1 | 范围外放行 | 工作区根（无档）`.log` / `.diff` / `.bat` 删与写 ⇒ 放行「恰执行一次」；无档面任意深度（含 `.mjs`）⇒ 放行 |
| 腿 2 | 项目内 `src` 仍拒（回归） | 在辖项目内 `src/**` 写 ⇒ 拒（reason 逐字 `engineering design gate`） |
| 腿 3 | 相对路径面 | 相对形按会话 cwd 解析后判——`src/x.mjs`（cwd = 项目）⇒ 拒；`_x.log`（cwd = 工作区根）⇒ 放行；含 `..` 跨出项目 ⇒ 出辖放行 |
| 腿 4 | 无候选 / 歧义面 | 盘上无档 ⇒ 放行；容器锚（自身无档、锚下 ≥2 带档兄弟）下目标 ⇒ 放行（发现梯零参与） |
| 腿 5 | VSC 端对位 | `thincoder-vscode/src/agent/tool-gates.mjs` 不在盘 ∥ 端侧源码门禁发射面零命中 ⇒ 经核单源（端面零改） |
| 腿 6 | 声明装载换源 | 跨项目 A / B 判别两读数（T-37）∥ 嵌套子优于根 ∥ 档非法照默认不抛 |
| 腿 7 | hint 收正（#1102） | 未声明被拒 ⇒ hint 含所属项目 manifest 绝对路径；已声明 ⇒ 零指路段 |
| 腿 8 | 零改回归 | 在辖四豁免（doc / temp / aux / state）放行 ∥ eng-coder 角色门零变 |

### §2.5 验收对照（F11 五面 + 两端同源 + 三方一致）

| 验收面 | 设计落点 | 机检腿 |
|---|---|---|
| ① 辖域 = 目标祖先链带 manifest 才在辖 | §3.9 辖域判定条 / D20 | 腿 1 / 腿 4 |
| ② 判据声明面 = 目标所属项目（nearest wins） | §3.1 读向条 / §3.2 行 8 / §3.9 | 腿 6 |
| ③ 项目内判定全照旧 | §3.9 声明面条 / 排除面 | 腿 2 / 腿 8 |
| ④ 无 manifest 面一律不管 | §3.9 辖域判定条 | 腿 1 / 腿 4 |
| ⑤ 不可解析目标保守拦截不变 | §3.9 不可解析条 | 腿 1 / T-36 ⑤ |
| 两端同源单点 | §3.2 行 8（VSC 随核单源——端面零改） | 腿 5 |
| hint 收正（#1102） | §3.4 / §3.9 | 腿 7 |
| 三方一致 | 需求档 F11 ⇔ 设计档 §3.9 / §3.2 行 8 / D20 ⇔ 本 §2 | （文档面核对——评审轮） |
| 合约表零漂移（评审 #2 补） | §2.4 行 8（交付前机械刷新步） | 刷新后 `node scripts/api-contract.mjs --check` 零漂移（报告态——不入闸） |

### §2.6 关键决策

- **K1 辖域 = 归属形复用**（`owningProject`——零新根判据；不落发现梯）——否决备选记 D20。
- **K2 单源谓词 = `declarationForTarget`**（宿主 `declaration.mjs`——声明面自持；经 `conventions.mjs` 转口保消费面 import 径）——两端同源 = 核单源（VSC 端门已随核退役，零改随核）。
- **K3 相对形解析 = 门侧 `resolve(agent.cwd, p)`**（判据面 = 目标所属项目；cwd 只作相对基）。
- **K4 不可解析 = 非串 ∥ 空串**（空串并入判据 = 「无路径可判」）。
- **K5 多目标跨项目 hint = 首个「未声明且被判码」所属项目**（确定性 = `toolTouchPaths` 序）。
- **K6 判读路径传 abs 形**（面判基准 = 所属项目根——D17 面判随根，读数精确）。

### §2.7 上抛项

- [上抛·知会] **需求档 F11 括注**「（CLI `dispatch.mjs` ∥ VSC `tool-gates.mjs` 同源）」——该 VSC 档已随核退役（实读：不在盘；`thincoder-vscode/src/**` 门禁串零命中）；需求档 F7 / F9 同族引用均带「迁移期引文——档已迁核」标记 ⇒ 建议收正（加标记 ∥ 改述「VSC 随核单源」）。**父笔；非阻塞**（本设计按端面零改落）。
- **[已结清 2026-10-08 · 评审 #1]** 上条（需求档 F11 括注）：需求档收正已在盘——`docs/core/requirements/PORTABILITY.md:38` 现行文本 = 「父侧门（CLI `dispatch.mjs`；VSC 端门已随核退役——单源）」；同族 F7 `:32` ∥ F9 `:34` 迁移期引文标记亦在盘 ⇒ 该条结清（父笔已落）。
- [上抛·知会] **设计档坐标族陈旧（本批外）**：`docs/core/design/TOOLS.md:920`（工程设计闸 `dispatch.mjs:198`）∥ `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md:40` / `:73`（写门 `dispatch.mjs:196`）——2026-09-28 拆分后未随正；本批实施后门区行号再变 ⇒ 建议随实施轮读回后收正（设计档笔）。
- [上抛·知会] **#1103 文本未落**（父笔——提示词内容权）：落点 = `thincoder-core/prompts/persona-engineering.md:56` 五级梯句位；实施轮随落（与代码同批——D12 同旨：分类 / 分流与提示词面同批闭口）。

### §2.8 交付前机检读数（2026-10-08 · 设计轮交付前）

- **`node scripts/doc-check.mjs`（仓根全量一跑）**：锚面 = 悬空 **3**（均本批外：`docs/core/design/MANIFEST.md:603`（`manifest.mjs:252`）∥ `docs/core/design/TOOLS.md:530`（`manifest.mjs:40-41`）∥ `docs/core/requirements/AGENT-LOOP.md:340`（`agent/setup.mjs`））；行宽 = **1**（`docs/core/requirements/PORTABILITY.md:36`——331 字符）；**本设计两档零入闸**（T-V28 行 VSC 引用按「迁移期引文」标记法豁免——首跑曾计悬空 1 条（本席引入），同轮自纠（加标记）后复跑转为「列报 · 不入闸」）。
- **[上抛·知会] 追加上抛（本批外）**：上述悬空 3 ∥ 行宽 1 = 本设计两档之外——建议归文档轮 ∥ 父侧机械笔收正；另 `行数面` 报告 1 条（`docs/desktop/design/SHELL.md:178` 表 265 ⇒ 实读 268——报告态）同族。
- **核销（2026-10-08 16:52 · 父侧收正）**：行宽 1 条（`docs/core/requirements/PORTABILITY.md:36`——F10 行）——根因 = 行尾管道符缺失（`scripts/doc-check-width.mjs:42` 豁免谓词——行尾须带 `|`）；已补「 |」；复跑 `node scripts/doc-check.mjs` ⇒ `OK(行宽)`——该条核销（0 条）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象** = F11 门禁辖域（manifest 树以内）——设计 §3.9 + D20 + T-36/T-37/T-38/T-V28 + 批档 §2（对象态 = 待评审）。核验 = 需求档 F11 逐句 ⇔ 设计 §3.9 / §3.2 行 8 / D20 ⇔ `docs/core/design/AGENT-LOOP.md:287` ⇔ 批档 §2 三方一致（✓）；符号可行性实核（`owningProject` = `thincoder-core/manifest-discovery.mjs:99` ∥ `manifestFilePath` = `thincoder-core/manifest.mjs:131` ∥ `toolTouchPaths` = `thincoder-core/agent/helpers.mjs:104` ∥ 门块 = `thincoder-core/agent/dispatch.mjs:89-111`）；`loadProjectDeclaration` 根保持实核（`thincoder-core/declaration.mjs:199-201`——非法档 root 仍在 ⇒ hint 路径 ∥ 面判基准成立）；受影档行数注抽检一致（declaration.mjs 218 ∥ conventions.mjs 192 ∥ dispatch.mjs 254 ∥ PORTABILITY.md 377 ∥ AGENT-LOOP.md 643 ∥ persona-engineering.md 200）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 文档一致性（cross-file lag · R7a） | 🟡 | 批档 §2.7 首条上抛（`docs/batches/2026-10-08-gate-jurisdiction.md:85`）称需求档 F11 括注「（CLI `dispatch.mjs` ∥ VSC `tool-gates.mjs` 同源）」；盘上现行 F11 文本（`docs/core/requirements/PORTABILITY.md:38`）为「父侧门（CLI `dispatch.mjs`；VSC 端门已随核退役——单源）」，不含该括注（该收正似已落盘）。 | 按盘上现行文本核对并清账该上抛条（已收正 ⇒ 标结；仍须动 ⇒ 更新引用）——非阻塞。 |
| 2 | Scope（协调项 · R5） | 🟡 | 新增导出 `declarationForTarget`（`declaration.mjs` ∥ `conventions.mjs` 转口）后，`docs/core/design/API-CONTRACT.md` 生成区（导出名 ∥ `档:行`——生成器唯一笔 · 整区替换）将漂移；批档 §2.4 受影响文件表 ∥ §2.8 机检读数均未登记该刷新步。 | 登记交付前刷新步 `node scripts/api-contract.mjs --write`（生成区整区替换；`--check` = 报告态 · 不入闸——`docs/core/design/API-CONTRACT.md:12`）。 |
| 3 | Acceptance（机检作用域） | 🔵 | T-V28 断言「`engineering design gate` 仅核侧两档」；该串在非源码副本亦有命中（`.thincoder/tmp/dispatch-head.mjs:179`；`thincoder-cli/docs/_archive/design/AGENT-LOOP.md:132`；本批所改档 `docs/core/design/AGENT-LOOP.md:286`）——机检实现若扫全仓将假红。 | 机检实现把扫描面钉死为源码树（`thincoder-core/**` ∥ `thincoder-vscode/src/**`），或显式排除 tmp ∕ 归档 ∕ 文档副本。 |
| 4 | 机检读数核对（doc hygiene · R7c） | 🔵 | 批档 §2.8（`docs/batches/2026-10-08-gate-jurisdiction.md:91`）载「行宽 = 1（`docs/core/requirements/PORTABILITY.md:36`——331 字符）」；按现行检查器实现静态判读，表格行属行宽豁免（`scripts/doc-check-width.mjs:42` ∥ `:82`），而 :36 为表格行 ⇒ 该命中不可按现行实现复现（本席未跑盘——静态判读）。 | 以实跑 `node scripts/doc-check.mjs` 输出为准核对并收正该读数。 |

**计数**：🔴 0 · 🟡 2 · 🔵 2（无 🔴 ⇒ 不阻塞）。
**VERDICT: pass**

## §4 用户批准（主 agent）

### 4.1 父侧代签（用户 2026-10-08 16:38 授权「可以，自动跑到交付」✓）

三条件齐备 ✓：
1. **设计评审 pass**（#10 · 0🔴 / 2🟡 / 2🔵——报告逐字入 §3 `:96-108`）✓；
2. **修正轮 #11 三条落地并核验** ✓（父侧 read-back：§2.7 清账 `:88` ∥ §2.8 核销 `:96` ∥ §2.4 行 8 `:45` + §2.5 格 `:74` ∥ 设计档 T-V28 `:305` + 变更记录）；裁定表 Dispatched 三行已 converge 至 **Fixed**，另 #4 = **Not an issue**（技术反驳在册——§2.8 读数当时属实、根因已修）✓；
3. **token 已签发** ✓（**凭据值不落档**——沿纪律）。

**实施轮已派**：eng-coder（initial）——写入域 = §2.4 行 1/2/3/6/7/8（`declaration.mjs` ∥ `conventions.mjs` ∥ `agent/dispatch.mjs` ∥ 批内机检件 ∥ `prompts/persona-engineering.md`〔#1103 两句 = 父笔逐字〕∥ `API-CONTRACT.md` 生成区刷新）；设计权威 = §2 全段 + 设计档 §3.9 / §3.2 行 8 / §3.4 / D20 / T-36/T-37/T-38/T-V28。（本批随 #1103 ∥ #1102 结构性消解形态一并闭口。）

## §5 实施记录（eng-coder）

**状态行**：实施完成（F11 辖域收正 · #1104 ∥ #1102 并批；#1103 两句随落；八腿全绿（先红后绿在册））

### §5.1 交付摘要（写域六档）

| # | 文件 | 变更（实读） |
|---|---|---|
| 1 | `thincoder-core/declaration.mjs` | +`declarationForTarget`（`:230-234` = `owningProject` ⇒ 声明对象 ∥ null = 出辖；import 行 `:10` +`owningProject`）；218 → 235 行 |
| 2 | `thincoder-core/conventions.mjs` | 转出口 +1 名（`:192`）；192 → 193 行 |
| 3 | `thincoder-core/agent/dispatch.mjs` | 门块辖域化：`:106` 非串∥空串保守拦 · `:107` `resolve(agent.cwd, p)` · `:109` abs 形判读 · `:111` K5 首个「未声明且被判码」 · `:116` hint 指路 `manifestFilePath(noteConv.root)` · `:113-124` 拒块（reason 逐字 `engineering design gate`）；`loadProjectDeclaration` 卸线 + `manifestFilePath` import；254 → 268 行 |
| 4 | `thincoder-core/prompts/persona-engineering.md` | #1103 两句（父笔逐字）：`:56` 括注改述「several = ambiguous — a stop: list the candidates, never guess, never land one」；新段 `:59`「**A workspace is not itself a project**…」；200 → 202 行 |
| 5 | `docs/batches/2026-10-08-gate-jurisdiction.test.mjs` | 新建批内件（八腿 = 批档 §2.4 腿 1–8 / T-36 ∥ T-37 ∥ T-38 ∥ T-V28）；279 行 |
| 6 | `docs/core/design/API-CONTRACT.md` | 生成区机械刷新（`node scripts/api-contract.mjs --write`——生成器唯一笔）：3308 条 ∥ 723 档；`--check` ⇒ `OK(api-contract): 骨架零漂移` |

禁止面全守（零碰）：需求档 ∥ 设计档 ∥ VSC 面 ∥ eng-coder 角色门 ∥ spawn `files` 域 ∥ D5 窗 ∥ F9/F10 语义 ∥ 仓套件（未跑——父侧收口一次）。

### §5.2 先红后绿（同盘实测）

- **红基线**（实施前，批内件一跑）：`tests 8 · pass 3 · fail 5`——红面五腿：腿 1（无档工作区根 `_x.log` ∥ 深 `deep/a/b/tool.mjs` 写 ⇒ 拒 `engineering design gate`——**越权形**）∥ 腿 3（`../sandbox/x.mjs` 跨出项目 ⇒ 拒）∥ 腿 4（容器锚下 `notes.mjs` ⇒ 拒）∥ 腿 6（`declarationForTarget` = undefined（未导出）；跨项目判别反向：`<B>/lib/a.md` 放行 ∥ `<B>/src/a.md` 拒）∥ 腿 7（指路仍为档名 `PROJECT-MANIFEST.json`，非绝对路径）。红面基座三腿（先红即绿）= 腿 2 ∥ 腿 5（T-V28）∥ 腿 8。
- **绿读数**（实施后同件）：`tests 8 · pass 8 · fail 0`；八腿 `[读数]` 全打（腿 1：出辖 ×10「恰执行一次」+ 不可解析 ×4 保守拒 ∥ 腿 4：发现梯读 = `ambiguous`，容器内目标出辖 ∥ 腿 7：指路 = 所属项目 manifest 绝对路径）。

### §5.3 回归 ∥ 机检

- **该面既有件（目标单件）**：`2026-10-05-engine-face-gaps`（T-35 父侧门 + 分类器）∥ `2026-10-02-manifest-resolution-fix`（归属形）∥ `2026-10-08-manifest-agent-tool` ⇒ **25/25 全绿**。
- **本批外前置失败（如实记）**：`2026-10-02-public-repo-read` ∥ `2026-09-30-memory-db-family`（embedding 桩缺 `embedTolerant`——`memory/code-search.mjs:8` 导入面 vs 测试桩导出面）∥ `2026-09-29-structure-split-2` A–E（冻结快照 vs 后续提交漂移，如 `model-picker.mjs` 实读 325 ≠ 冻结 316）——**干净 HEAD worktree 复跑同失败（7 fail 全同）**⇒ 非本批引入。
- `thincoder-core/test/run.mjs` = 空清单绿（2026-09-28 全清重置）；批内件不进仓套件（`thincoder-cli/test/run.mjs` 只收 `test/*.test.mjs` ∥ `test/integration/**`）。
- **合约表**：`--write` 后 `--check` = `OK(api-contract): 骨架零漂移（3308 条 · 723 档）`（刷新前既有漂移 3292 ≠ 3309 行，随整区替换归零）。
- **档位**：declaration 235 ∥ conventions 193 ∥ dispatch 268 ∥ 批内件 279（500 软线内）。

### §5.4 审计 ∥ 评审轮次 · 终态

- **发散审计（explore · 只读）轮 1**：`DEVIATIONS`（0🔴 · 1🟡 · 1🔵）——🟡 = §5 空（本段闭合）；🔵 = 设计档坐标读回（设计笔面）。机制面逐点核过 ∥ OUT-OF-LIST 零发现 ∥ 腿 1–8 与设计用例逐条对位。
- **代评审（advisor · type=code）轮 1**：`pass`（0🔴 · 2🟡 · 2🔵）——与审计同族：① §5 记录（本段闭合）；② `PORTABILITY.md` 门块坐标读回（`:35` ∥ `:183` ∥ `:210` 仍标 `dispatch.mjs:89-111`，现读 `:94-125`；`:215` 冻结窗 `:121-144` ⇒ 现读 `:135-158`）；③ §3.2 行 8「行号实施轮读回」未落（实读值 = `declaration.mjs:230`，已入 `API-CONTRACT.md:1030`）；④ K6 深 cwd 相对形读数差建议入 §3.9 差分表（收紧向，设计 K6/D17 明示）。评审引用面经宿主核验 0/5（评审侧路径解析失败）——关键判据本席逐条自核在盘。
- **fix 轮**：0 轮代码 fix（裁决无代码面缺口）；记录面由本段闭合。
- **终态**：`clean`（审计 ∥ 评审 0 未决 🔴；剩余 3 项 = 设计笔读回 / 登记项，非本席写域，已上抛）。

### §5.5 上抛

- [上抛·知会] **设计档读回族**：`PORTABILITY.md:35` ∥ `:183` ∥ `:210`（门块 `dispatch.mjs:89-111` ⇒ 现读 `:94-125`）∥ `:215`（冻结窗 `:121-144` ⇒ 现读 `:135-158`）∥ `:79`（§3.2 行 8 行号，实读 = `declaration.mjs:230`）——与批档 §2.7 `:89` 同族合并处置（设计笔 / 父侧机械笔）。
- [上抛·知会] **#1103 逐字性**：无同源基线可 diff——以改前副本 `.thincoder/tmp/lc818-baseline/en-persona-engineering.md`（09-30）比对，确认 `:56` 括注改述与 `:59` 新段「确为本次新落」（Δ +2 与 §2.4 行 7 相符）。

## §6 验证与收口（父代理）

### 6.1 验证（父侧亲验 · 2026-10-08 17:1x–17:5x）

**批内件（本批不变量面）**：`node --test docs/batches/2026-10-08-gate-jurisdiction.test.mjs` ⇒ **tests 8 · pass 8 · fail 0**（父侧复跑 ✓；红基线 = 实施前 pass 3 · fail 5——红绿对在 §5.2）。八腿 + T-36/T-37/T-38/T-V28 全绿；范围外放行实证全部走 fixture（工作区根真文件零触 ✓）。

**仓套件（收口唯一一次）**：`cd thincoder-cli && node test/run.mjs` ⇒ `test manifest is empty — zero tests = green (2026-09-28 full reset)`（exit 0）。

**该面回归**：既有件 **25/25**（`2026-10-05-engine-face-gaps` ∥ `2026-10-02-manifest-resolution-fix` ∥ `2026-10-08-manifest-agent-tool`——§5.3）；3 组前置红（干净 HEAD worktree 复跑同失败 ⇒ 非本批）已归 **#1108**。

**合约面**：`node scripts/api-contract.mjs --check` ⇒ 骨架零漂移（刷新后）。

**代码面亲验（父侧逐读）**：辖域逐目标判 `dispatch.mjs:105-112` ∥ 出辖放行 `:109`（`!conv ||` 短路）∥ hint 所属项目 manifest 绝对路径 `:116`（`manifestFilePath(noteConv.root)`）∥ `declarationForTarget` = `declaration.mjs:230-234`（`owningProject` ⇒ 声明 ∥ null = 出辖）∥ 提示词两句逐字在位（`persona-engineering.md:56`「several = ambiguous — a stop: list the candidates, never guess, never land one」∥ `:59`「A workspace is not itself a project…never land a manifest at its root.」）。

**机检面**：doc-check = 本批两档零入闸（悬空 2 ∥ 行宽 0——本批外读数归 #1105）；设计档坐标实施后读回已落（五处 + changelog 一行 · 父侧直接执行标注 ✓）。

### 6.2 提交与结算证据

- 提交 **`147831e7`**（8 档 · +554 ∥ −20）——**双推实证**：origin ∥ github 均至 `147831e7`（ls-remote 逐端核）。
- **提交面披露（防夹带——混合档排除）**：`docs/core/design/AGENT-LOOP.md`（门行 `:287` 本批 + `:74` 处 500/800 口径批在编 hunk）∥ `docs/desktop/design/SHELL.md`（行数回填 265⇒268 本批 + 500/800 批 hunk 族）——两档本批内容**已在盘**、随 500/800 批提交携带；`API-CONTRACT.md` 生成区刷新已在盘（`--check` 零漂移 ✓）——全树快照含他流在编面，未随本批签入（归后续签入携带）。
- 台账：**#1104 已核销**（本 §6 为据）∥ **#1102 ∥ #1103 追认核销**（并批与伴随随本批闭口——evidence = 本 §6 指针）。token 消费 ✓（**值不入档**）。
- 另披露：工作区根 `.wt-head-probe/`（2026-09-16 遗留 worktree——实施轮发现，未动）。
