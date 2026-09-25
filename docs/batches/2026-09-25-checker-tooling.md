# 2026-09-25 · checker-tooling
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-25 · 来源 = 用户 2026-09-25 15:29「看一下技术待办，分一下批，整体处理」——技术待办排批（批 6/6 · 机检/机制面）。
> 台账 = #299 / #323（机检机制面 · 归批）。前情 = docs/batches/2026-09-25-guard-scheduler.md §6（已收口 2026-09-25）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-25
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**来源** = 用户 2026-09-25 15:29「看一下技术待办，分一下批，整体处理」——技术待办排批（批 6/6 · 机检/机制面）。**全链口径** = 设计 → 评审 → §4 → 实施 → §6（承今日先例 · 父侧代执行）。

**批件**（2 条 · evidence 全档 = `ledger_query`）：

| # | 条目 | 要点 |
|---|---|---|
| 台账 #299 | doc-check 锚检查器误报 | `@thincoder/core/session.mjs` 等合法 import specifier 被剥 `@` 判悬空（样本 = `docs/core/design/SESSION.md:241`；实为 package name + exports 合法形态）——修 = 锚检查器识别 `@`-前缀 import specifier（或与 `thincoder-core/package.json` exports 对核）。条件（引擎下次被触碰）= 本批满足。 |
| 台账 #323 | `batch_segment` 过渡别名撤除 + `findInFlightBatch` 递归判定 | **前置**：先实跑 BATCH-RECORD §4.14 撤除判据（命令单源在 §4.14）——输出转空 ⇒ 撤别名 + 删 shim + 换递归判定；未空 ⇒ 记读数退册（维持在册待条件）。同捆 = create 嵌套落位错位（既有裁：fail-closed 只误拒不误写；改递归属行为面变更 ⇒ 本批一并裁）。 |

**边界**：机检引擎 / 批工具改动须全链回归（三树 + doc-check 基线持平）；**不动 §4.14 判据本体**（撤除判据单源在 BATCH-RECORD 设计档）；#323 若判据未空 ⇒ 本批对该条零改（退册续候）。

**前情** = 批 `2026-09-25-guard-scheduler` §6（batch 写门批的邻面）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（2026-09-25 · #299 设计落盘 / #323 判据实跑 82 档未空（退册续候））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**来源** = 本档 §1（2 条：台账 #299 / #323）· 轮次 = initial · 设计笔 = eng-designer（本席）· 设计档修订**已落盘**（落点见 §2.2）；#323 判据实跑读数见 §2.8。

### §2.1 覆盖条目与判据（两条）

| # | 条目 | 本设计落定 | 判据（可核） |
|---|---|---|---|
| 1 | 台账 #299（锚检查器 `@`-前缀合法 import specifier 误报） | **形式裁定 = 识别排除**（左界守卫照准 · 引擎零改）+ **测试护栏补齐**（T-DC-18 / T-DC-19） | AC-299-1/2 抽取面四形态零锚 + 判面假阳归零 ∧ AC-299-3 反证照红（§2.4 两例）· AC-299-4 全仓复跑：该族照红 **0** · AC-299-5 判据字面 vs 实装 `.source` 对读（一次性——**禁永驻散文锚**） |
| 2 | 台账 #323（`batch_segment` 别名撤除 + `findInFlightBatch` 递归判定） | **§4.14 判据实跑 = 非空（82 档）⇒ 撤除推迟**；#323 退册续候（设计零改该条）；同捆 create 嵌套落位 = 维持既有裁、随撤除轮一并裁 | AC-323-1 读数在册（§2.8）· AC-323-2 三项包本批**零改**（别名 / shim / 递归判定——写入面 diff 零命中）· AC-323-3 台账维持 待设计（父侧处置） |

### §2.2 设计档落点（file:line · 已落盘 · as-of 2026-09-25 15:5x 本席读回）

- `docs/core/design/DOC-DISCIPLINE.md`：**§4.2.1 `:757-758`**（左界守卫 `@` 排除条下补：形式裁定 + 判据 / 护栏映射）· **变更记录 `:1406-1407`**（+1 条）。
- 台账 #323 面：**设计档零改**——判据单源 = `docs/core/design/BATCH-RECORD.md` §4.14，本批零触（承 §1 边界「不动 §4.14 判据本体」）。

### §2.3 #299 实核证据链（裁定依据）

- **实现面已落地**（承 2026-09-20 小债批 · 工程工具面父侧直改）：`scripts/doc-check-anchors.mjs:45` `PATH_RE` 左界守卫 = `(?<![A-Za-z0-9_.\-\\/@])`——`@` 紧邻路径形不入锚。
- **样本现读**（本席夹具直驱 `extractAnchors`）：`docs/core/design/SESSION.md:272`（挂账坐标 `:241` as-of 2026-09-18——D4 行号只作 as-of）行 ⇒ `paths = []`；四形态探针（引号内 / 反引号内 / 行首 / 带坐标尾）全零锚。
- **全仓复跑**（as-of 2026-09-25 15:5x · cwd = 仓根 · `node scripts/doc-check.mjs`）：该族照红 **0**；本档落点行零新增行（悬空 4 / 行宽 26 = 非本批面，见 §2.9-4）。
- **为何仍须本批落笔**：「防回退」在册而**无测试在册**——`thincoder-cli/test/doc-check.test.mjs`（T-DC-1–17）无 `@` 用例 ⇒ 本批 = 形式裁定落档 + 护栏补齐；**引擎零改**（规则本体无缺口）。

### §2.4 用例表（T-DC-18 / T-DC-19 · 实施轮逐字照落）

| # | 类 | 输入 | 期望 |
|---|---|---|---|
| T-DC-18 | 正常 | 抽取面四形态：引号内 `import x from "@thincoder/core/session.mjs"` · 反引号内 `` `@thincoder/core/session.mjs` `` · 行首 `@thincoder/core/session.mjs` · 带坐标尾 `` `@thincoder/core/agent-tools/batch.mjs:32` ``；判面夹具：`docs/a.md` 载 `@thincoder/core/ghost.mjs`（无此档） | 四形态 `extractAnchors(...).paths.length === 0`；夹具全扫 `cand.path === 0 ∧ dang.path === 0`（假阳归零） |
| T-DC-19 | 错误 | 反证（同形**去 `@`**）：`docs/a.md` 载 `` 见 `pkg/ghost.mjs`。 ``（无此档、basename 零命中） | `cand.path === 1 ∧ dang.path === 1`（守卫不吞真锚——面收窄不得放过真缺陷） |

落点建议 = 测试档 ① 右界守卫区（T-DC-3 后——同属守卫面）；夹具纪律承既档（系统临时域 · 零落仓）。

### §2.5 受影响文件与测试面（as-of 2026-09-25）

| 档 | 面 | 行数 | Δ | 落笔方 |
|---|---|---|---|---|
| `docs/core/design/DOC-DISCIPLINE.md` | 设计档 | 1408（改前 1403） | **+5**（§4.2.1 +2 / 变更记录 +3） | eng-designer ✓（已落） |
| `thincoder-cli/test/doc-check.test.mjs` | 测试 | 312 | **+≈14**（T-DC-18 / T-DC-19） | eng-coder |
| `scripts/doc-check-anchors.mjs` | 引擎 | 323 | **0**（零改——判据口径照准） | —（零触） |

**测试面**：① 定向 `node --test thincoder-cli/test/doc-check.test.mjs`（+2 例）；② 三树 `npm test`（core / cli / vsc）全绿；③ `node scripts/doc-check.mjs`（cwd = 仓根）**相对判据** = 本轮新增悬空 **0** ∧ 新增行宽门槛行 **0**（本席复跑已按此修毕一处——首跑笔迹行 `:1406` 326 字符曾越限，已就地拆行；绝对读数随并行批漂移，不作固定靶）。

### §2.6 验收对照（回指两条 → 机判）

| 条目 | 验收判据 | 单源 |
|---|---|---|
| #299 | AC-299-1 抽取面四形态零锚 · AC-299-2 判面假阳归零 · AC-299-3 反证照红（T-DC-18/19）· AC-299-4 全仓复跑该族 0 · AC-299-5 判据字面对读（一次性） | 设计档 §4.2.1（`:757-758`）+ 本段 §2.4 |
| #323 | AC-323-1 §4.14 实跑读数在册（82 档非空）· AC-323-2 三项包零改 · AC-323-3 退册续候在册 | 设计档 §4.14（判据单源 · 零改）+ 本段 §2.8 |

**三链同源**：台账 #299 / #323 → 本表 §2.1 → 设计档落点（§2.2）——两条均 `tech_todo`（需求档面无对应条目，锚 = 台账行）。

### §2.7 关键决策（含否决备选）

| KD | 决策 | 否决备选与理由 |
|---|---|---|
| KD-1 | #299 形式 = **识别排除**（左界守卫照准） | 否决「与 `thincoder-core/package.json` exports 对核」：specifier 合法性 = 运行时解析面（引擎判域外）；核包名 / 布局硬编码入通用引擎（违声明面原则 §7 F2）；校验面新增假阳（旧引用 / 计划档）；反转既有收口（#64① / #105 族——「不入锚」已裁） |
| KD-2 | 实施面 = **测试护栏 + 设计档笔**（引擎零改） | 否决「引擎改写」：规则本体已实装且实测零误报 / 零漏报（§2.3 四形态 + 反证） |
| KD-3 | #323 三项包（别名 / shim / 递归判定）**整体推迟** | 否决「先撤别名留 shim」：撤除判据 = 在飞批收口（D-BR20 地面真值）；在飞 82 档下撤别名 = 打挂子代理 §2/§3/§5 自写通道（CORE-UNIFICATION 批先例） |
| KD-4 | 同捆 create 嵌套落位 = **维持既有裁**；随撤除轮一并裁 | 否决「本批单独改递归」：属行为面变更（2026-09-21 批 §6.2-① 既有裁定）；与撤除轮同捆 = 一次行为面变更、一次评审 |

### §2.8 §4.14 判据实跑读数（台账 #323 前置 · 命令单源 = 设计档 §4.14）

**实跑**（2026-09-25 15:4x · cwd = `D:\teamcode\thincoder` · 命令逐字取自 §4.14 独立行）：

```text
node -e "const fs=require('fs');const r=[];for(const f of fs.readdirSync('docs/batches'))if(f.endsWith('.md')&&!String(fs.readFileSync('docs/batches/'+f,'utf8').match(/^\*\*状态行\*\*：.*$/m)).includes('已收口'))r.push(f);console.log(r.join(' ')||'(空=无在飞批)')"
```

**读数 = 非空 · 82 档**（首 3 = `2026-09-13-CORE-UNIFICATION.md` / `2026-09-14-doc-migration.md` / `2026-09-15-check-tooling-debt.md`；末 3 = `2026-09-25-end-diff-registry.md` / `2026-09-25-off-family-closeout.md` / `2026-09-25-single-source-closeout.md`）；另以同式复算（node 直驱）= 82，两读一致。

**结论**：判据未转空 ⇒ **撤别名 / 删 shim / 递归判定三项包全部保留**；台账 #323 **退册续候**（维持 待设计；到期条件不变 = 输出转空）——本批对该条**零改**（设计 / 代码 / 提示词面均零触）。

**撤除面清点（供转空轮直接开工 · 只清点零动 · as-of 本席实核）**：shim = `thincoder-core/agent-tools/batch-segment.mjs`（19 行 re-export）· 别名 = `thincoder-core/agent-tools/batch.mjs:335`（`batchSegmentTool`）· 消费面 = VSC `src/agent/setup-tooltable.mjs:17`（import）+ 测试 **5** 档（core `batch-segment.test.mjs` / `batch-segment-manifest.test.mjs` / `batch.test.mjs` · cli / vsc `batch-segment.test.mjs`）+ 提示词 **7** 档（`advisor-design` / `advisor-round2` / `advisor-round3` · `common` · `persona-eng-coder` / `persona-eng-designer` / `persona-engineering`——别名注记）+ 注释注记 3 处（`agent-tools.mjs:24` / `core-hygiene.test.mjs` / `tools/write-path.mjs:9`）。

### §2.9 上抛项

1. **#299 条目状态与实况不符**（修复 2026-09-20 已落地，条目 2026-09-18 挂账仍「待设计」；与已核销的 #64① / #105 同族）——建议父侧按结算口径处置（本批测试护栏落地后：#299 → 待核销 / 已核销，依据 = §2.4–§2.6）。
2. **同捆项既有裁的射程收窄（如实报告——既有裁理由部分不成立）**：`findInFlightBatch` 平扫「只误拒不误写」在主情形成立（嵌套档唯一在飞 ⇒ 默认定位 throw = 误拒）；但**混合情形**（≥1 顶层在册 + ≥1 嵌套在飞）计数欠计 ⇒ 默认定位可落**非预期档**（D-BR21「0 / ≥2 ⇒ throw」被绕过）；且 create 现仍**接受显式嵌套路径**（双前缀 `docs/batches/docs/batches/x.md` 过 `insideBases` 判——§4.15 防嵌套只拦「静默二次拼接」）⇒ 嵌套档有合法产生路径。本批零改（行为面）；建议转空轮设计时二择一并裁：**递归扫描** ∥ **create 顶层限定**。
3. **同档在途编辑（告知）**：`docs/core/design/DOC-DISCIPLINE.md` 另载 doc-face-closeout 批（#347 / #349）未提交设计笔（其 §3 未写）；本席笔迹 = §4.2.1 + 变更记录（区不重叠）。若其设计评审点火窗与本席写入相交 ⇒ 该轮有 stale 风险——请父侧按点火状态核（已 stale ⇒ cancel → 重发）。
4. **全仓 doc-check 读数漂移**：as-of 15:5x = 悬空 4（`MODEL-SPECS.md:323` / `:1372` / `:1465` + `SESSION.md:793`——在途 / 存量，非本批面）+ 行宽 26（并行批在途写入持续漂移：本席首跑 18 → 复跑 26，逐行属他批写域）——「基线持平」须按**相对判据**判（本轮新增 0），勿用固定绝对靶。

### §2.10 边界与 UI / 交互面

- **零 UI / 交互面**（文档 / 测试面）——open 项 = **0**。
- **边界**：不动 `BATCH-RECORD.md` §4.14 判据本体（单源）；不动 `scripts/**`（引擎零改）；#323 三项包零改；仓根未跟踪临时档（`.tmp-*` / `.doc-check-*` 等）与 `.thincoder/tmp/**` = 非本批写域（他批遗留，另轮清）。

### §2.11 设计评审修正轮 1（发现 1 / 2 / 4 / 5 / 6 逐号落位 · 父侧裁定「全部接受」· 2026-09-25）

**来源** = 本档 §3 轮次 1（🔴 0 · 🟡 3 · 🔵 3；发现 3 = 协调项归父侧，不在本轮）；**处置面** = 点修落地（只做点名 5 条——不重开设计、不扫未点名处所）。
本轮写域 = `docs/core/design/DOC-DISCIPLINE.md`（发现 4 坐标归一 + 变更记录 +1 行——已落盘）+ 本档 §2 追加；产品码 / 测试码 / 提示词面 / 需求档零触（`scripts/**` 零改——裁定「识别排除」已定）。

- **#1（🟡 · 验收判据 · 本档 §2.8）补子类登记**：单源命令的判定 = 状态行**首行**扫描；**无 `**状态行**：` 前缀行的档** ⇒ `match = null` ⇒ `String(null)` 不含「已收口」⇒ **计在飞**（命令语义的必然结果，非缺陷）。
  已收口档例 = `docs/batches/2026-09-13-CORE-UNIFICATION.md`（`:7103`「**已收口 2026-09-17**。本档冻结（不再回改）。」· 该档 `**状态行**：` 行零命中）⇒ 读数与标签「在飞批」**不等价**（含此类历史档）。
  本修正轮复跑（as-of 2026-09-25 16:1x · 同单源命令）：**在飞 84** 档 ⇒ 其中无状态行子类 **27** 档（读数随并行批漂移；§2.8 读数 82 为 15:4x 时点）。
  **撤除轮消解前提注**：该类档**无法经 `batch` 通道补状态行**——`docs/core/design/BATCH-RECORD.md` §4.9 状态行解析 fail-closed（缺失 / 不可解析 ⇒ 拒写——覆盖 append / status 通道）⇒ 消解**须判据本体裁定**（撤除轮对命令 / 口径本体收正），**非旧档回改**。
  判定方向不变：读数非空 ⇒ 撤除推迟 · 三项包零改 · 台账 #323 退册续候（到期条件书面不变 = 输出转空；该子类存在下结构性不可达——先落上述判据裁定）。
- **#2（🟡 · 方法学 · 本档 §2.5）** `.md` 行「行数 / Δ」两列填 `—`（行保留）——依 = `docs/core/design/DOC-DISCIPLINE.md:230`（新落笔批次档受影响文件表：文档档不列该两列；源 / 测试档两列照留）。
  修正后行（**以本行为准** · append-only 不回改既有行）：`| docs/core/design/DOC-DISCIPLINE.md | 设计档 | — | — | eng-designer ✓（已落） |`；余两行照留（测试档 312 / **+≈14** · 引擎档 323 / **0**）。
- **#4（🔵 · 清晰度 · 设计档 · 已落盘）** `docs/core/design/DOC-DISCIPLINE.md` §4.2.1 实装坐标归一：`scripts/doc-check-anchors.mjs:44` → **`:45`**（`:44` = 左界守卫注释行 · `:45` = `PATH_RE` 实装行）；
  **两处**一并归一（`:755` 右界守卫转义条 · `:757` 左界守卫 `@` 排除条——评审点名处当读 `:756` = 现盘对读 `:757`），与本档 §2.3 的 `:45` 一致；变更记录 +1 行。
- **#5（🔵 · 尺寸档注）** `thincoder-cli/test/doc-check.test.mjs`：312 → ~326 · **>300 建议线（<500 硬限）· Δ 小（+≈14，两用例）⇒ 本批不拆**；
  触发 = 该档下次实质增厚 / 越 500 硬限（形态承 `docs/core/design/DOC-DISCIPLINE.md:578-595` 先例；**落点自定 = 本块**——CLI 侧无机械登记面）。
- **#6（🔵 · 验收判据 · 本档 §2.4）类标注（以本块为准）**：T-DC-18 四形态中——行首形（`@…` 顶格）= **边界**（位置边界 · 无包裹符）· 带坐标尾形（`@thincoder/core/agent-tools/batch.mjs:32`）= **边界**（坐标尾交互 · 尾界 + 坐标整段消费）；
  引号内 / 反引号内两形态 = 正常；T-DC-19 = **错误**（反证）⇒ 三分类（正常 / 边界 / 错误）齐 · 零新增用例（护栏数不变 = 2）。
- **同族观察（未落 · 供父侧路由）**：`docs/core/design/DOC-DISCIPLINE.md` 另有三处同族陈旧坐标（`:146` / `:824` / `:873`——同为 `scripts/doc-check-anchors.mjs:44` 指称形态）；
  邻档两处（`docs/core/design/DOC-CODE-RECONCILE.md:81` · `docs/core/design/DOC-SYSTEM.md:10`）——均不在点名 5 条内，未改。

**机检读数（修正轮落定 · as-of 2026-09-25 16:2x · 命令 = `node scripts/doc-check.mjs` · cwd = 仓根）**
- `FAIL(锚)` 悬空 **28** = 存量 4（`MODEL-SPECS.md:323` / `:1372` / `:1465` + `SESSION.md:793`）+ 非本批 **24**（`docs/desktop/design/PROJECT.md` 未打列报标——他批在途新档，as-of 本读进扫描域）。
- `FAIL(行宽)` **19** 行（入场 18 +1 = `docs/core/design/ARCHITECTURE.md:216`——他批漂移）——逐行全在非本批面；**本档 §2.11 与 `docs/core/design/DOC-DISCIPLINE.md`（两处坐标行 + 变更记录）= 零 ✗ · 净增 0**（逐项对读入场读数）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审范围** = 本档 §1 / §2 全文 + `docs/core/design/DOC-DISCIPLINE.md` §4.2.1 `:755-758`（含本批新增 `:757-758`）与变更记录 `:1406-1407` + `docs/core/design/BATCH-RECORD.md` §4.14。无文档地图 / 无项目标准档 ⇒ Document ownership 判据降级（按 AGENTS.md + 在评档自身规范判）。**盘上实核（评审证据）**：`scripts/doc-check-anchors.mjs:45` PATH_RE 左界守卫含 `@` ✓ · 该档 323 行 ✓ · `thincoder-cli/test/doc-check.test.mjs` 312 行 ∧ 全档无 `@` 用例 ✓ · 样本 `docs/core/design/SESSION.md:272` 载 `@thincoder/core/session.mjs` ✓ · §2.8 清点四件（shim 19 行 / 别名 `batch.mjs:335` / VSC `setup-tooltable.mjs:17` / 测试档 5 件）逐条相符 ✓ · 四形态不被 `isExecutableLine` 吞（T-DC-18 判别力成立）✓。

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Acceptance criteria | 🟡 | §2.8「在飞 82 档」按单源命令语义含「无 §1 状态行」档（正则 match=null ⇒ `String(null)` 不含「已收口」⇒ 计在飞）：其中 `docs/batches/2026-09-13-CORE-UNIFICATION.md` 已收口（`:7103`「已收口 2026-09-17。本档冻结」，该档 `**状态行**：` 行零命中）⇒ 读数与标签「在飞批」不等价，「到期条件 = 输出转空」对该类或结构性不可达。 | §2.8 补一行子类登记（无状态行 ⇒ 命令计在飞）+ 注明撤除轮的消解前提（旧档不回改 ⇒ 判据本体归属待裁）；判定方向不变（非空 ⇒ 续候）。 |
| 2 | Methodology compliance | 🟡 | §2.5 表对 `.md` 行仍列「行数 / Δ」（本档 `:60` = 1408（改前 1403）/ +5），与 `docs/core/design/DOC-DISCIPLINE.md:230`「新落笔批次档……文档档（`.md`）不列该两列」的已裁口径相抵。 | `.md` 行保留、该两列填 `—`（形态照 §3.7）；源 / 测试档两列照留。 |
| 3 | Scope（coordination item，非缺陷） | 🟡 | 同档 `docs/core/design/DOC-DISCIPLINE.md` 另有 doc-face-closeout 批在途笔（§2.9-3 已上抛）；本批 §4.2.1 + 变更记录**已落盘** ⇒ 若该批设计评审点火窗相交，其轮次 stale。 | 按点火状态核（已 stale ⇒ cancel → 重发）；本批后续轮次以落盘现文为基线复核。 |
| 4 | Clarity | 🔵 | 同一实装点两坐标：`DOC-DISCIPLINE.md:756` 写 `scripts/doc-check-anchors.mjs:44`，而 `PATH_RE` 现盘在 `:45`（`:44` = 该守卫注释行）；本档 §2.3 写 `:45`。 | 行号归一，或就近标 as-of。 |
| 5 | Affected-file size annotations | 🔵 | `thincoder-cli/test/doc-check.test.mjs` 312 → ~326（>300 建议线、<500 硬限）；表内无尺寸档 / 拆分结论列（先例 = `DOC-DISCIPLINE.md:578-595` 表对 >300 档均带尺寸档与拆分结论）。 | 补一行尺寸档注 + 触发登记（如「>300 · Δ 小 · 不拆」）。 |
| 6 | Acceptance criteria | 🔵 | §2.4 用例表仅「正常 / 错误」两类，无「边界」类行（house 三分类；四形态探针内含边界形态但未标注）。 | 标注边界形态或补一例边界行。 |

**域外注（无严重度）**：按盘上 `scripts/doc-check-anchors.mjs:46` CASE_RE 逐字读判，`T-DC-18` 形态（`T-`+字母块+连字符+号）不匹配任一分支（`T-[A-Z]{1,5}\d{1,3}…`）⇒ 该族 token 在扫描域内不产用例号锚——与 `DOC-DISCIPLINE.md:762` 形态注（「字母块 1–5 形态捕多段号完整形态」）的对应关系待核（域外，非本批写域）。

**计数**：🔴 0 · 🟡 3 · 🔵 3。
VERDICT: pass

## §4 用户批准（主 agent）

**代执行口径**（承用户 2026-09-25 15:29「整体处理」全链授权）：设计（§2 + §2.11 修正块）→ 评审 pass（§3 轮 1 · 🔴0 / 🟡3 / 🔵3——父侧逐条裁定**全数接受**；发现 3 = 协调项，已由点火序处置）→ 修正轮 5 条全落（`#61`）→ **父侧抽验通过**（`DOC-DISCIPLINE.md:755` / `:757` 双坐标归一 `:45`——实读）⇒ **批准进入实施**。设计 token 已发（凭证不落档）；实施 = eng-coder 初始轮，`round=initial`（#299 护栏两用例落码；**引擎零改**）。**#323 = 退册续候**（§4.14 判据输出非空——读数与子类登记入 §2.8/§2.11）。

## §5 实施记录（eng-coder）

**状态行**：实施完成（2026-09-25 · #299 护栏两用例 · 引擎零改 · 0 修正轮）

**交付摘要**：`thincoder-cli/test/doc-check.test.mjs` 新增 **T-DC-18 / T-DC-19** 两例（落点 = T-DC-3 后，承 §2.4 落点建议「同属守卫面」）——① 抽取面四形态（引号内 / 反引号内 / 行首 / 带坐标尾）零锚 + 判面夹具假阳归零；② 反证（同形去 `@`）照红。**引擎 `scripts/**` 零改** · `docs/core/design/BATCH-RECORD.md` 零改 · 本档 §3 零触 · 台账 #323 三项包（别名 / shim / 递归判定）零改。

**改动面（file:line · as-of 本轮回读）**

| 档 | 面 | 改动 |
|---|---|---|
| `thincoder-cli/test/doc-check.test.mjs` | 测试 | `:93-113` 新增 T-DC-18（`:93-105`）+ T-DC-19（`:107-113`）= **+21 行**；档 = 312 → **333 行**（§2.5 `:61` / §2.11 #5 `:124` 估 `+≈14` / `~326`，偏低 ≈7 行——尺寸档结论不变：>300 建议线 · <500 硬限 · 本批不拆） |
| 其余 | — | 零改（引擎 / 设计档 / 本档其他段 / 台账 #323 三项包） |

**用例落位对照（§2.4 逐字）**：T-DC-18 四形态字面 `:94-99` · 判面夹具 `:101`（`docs/a.md` 载 `@thincoder/core/ghost.mjs`）· 期望断言 `:100`（逐形态 `paths.length === 0`）+ `:103-104`（`cand.path === 0 ∧ dang.path === 0`）；T-DC-19 夹具 `:108`（`见 \`pkg/ghost.mjs\`。`）· 期望断言 `:110-111`（`cand.path === 1 ∧ dang.path === 1`）。类标注（正常 / 错误 + 两处边界形行内注释）承 §2.11 #6；零额外用例 · 零额外 import · 夹具纪律承既档（临时域 + 零落仓 + `OWN_FIXTURES` 清理）。

**测试读数（as-of 2026-09-25 16:3x）**

- 定向：`cd thincoder-cli && node --test test/doc-check.test.mjs` ⇒ **19/19 绿**（T-DC-18 / T-DC-19 在列，含 T-DC-15 零落仓 ∧ 并发免疫）。
- 全量：`cd thincoder-cli && npm test` ⇒ **tests 863 · pass 863 · fail 0**（cancelled / skipped / todo 全 0；duration ≈72.6s）——本批面在列；**全量无红项**（他批在途面本轮未现红）。
- 仓域机检：`node scripts/doc-check.mjs`（cwd = 仓根）⇒ 悬空 **4**（`MODEL-SPECS.md:323` / `:1372` / `:1465` + `SESSION.md:793`——存量 / 他批面）+ 行宽 **19** 行（`CORE-UNIFICATION.md` / `MODEL-BENCH.md` / `MODEL-SPECS.md` / `ENGINEERING-MODE-V2-SPEC-MANIFEST.md` / `VSC-DEBT.md` / `WEBVIEW.md`——逐行在他批写域）。本批 footprint（测试档 + 本段）= **新增悬空 0 / 新增行宽 0**（`docs/batches` 在 checkConfig `anchors.exclude` 内；测试档不在 `docs` 扫描域）。

**关键决策（本席 · 实施面）**

- KD-I1 **判别力优先**：四形态逐形态断言 + 判面夹具双计数断言（`cand` ∧ `dang`）——守卫回退时夹具面 `cand.path` 先翻红（本席实核探针：去 `@` ⇒ 同形抽成 `thincoder/core/ghost.mjs` ⇒ 断言必红；含 `@` ⇒ 四形态零匹配）。
- KD-I2 **档头 / 区段横幅不动**（`:5` 用例表来源行 · `:73` ① 区横幅）：承本批「零新增断言之外的内容」；两处 stale 观察已登记（下方登记项），处置权归父侧（设计 / 批档面）。
- KD-I3 **探针非空转**：`isExecutableLine` 三条规则均需反引号码段 ⇒ 四形态不入命令豁免（实核 `doc-check-width.mjs:43-46`）；反证面 `pkg/ghost.mjs` 在夹具域 basename 零命中 ⇒ `dang.path === 1` 非巧合（实核 `doc-check-anchors.mjs:167-174`）。

**登记项（发现 · 未处置 · 供父侧路由）**

1. `doc-check.test.mjs:5` 档头记「用例表 = …machine-check-face.md §2.5（T-DC-1–17）」——新增两例来源（本档 §2.4）档内无指针；审计 / 评审均判**非 must-fix**（设计未要求），处置 = 父侧裁（补一行 / 维持现状）。
2. `doc-check.test.mjs:73` 区段横幅「① 右界守卫」之下现含左界守卫两例（落位系 §2.4 `:54` 指定）——横幅文字未随（纯索引面）。
3. Δ 读数：§2.5 `:61` / §2.11 #5 `:124` 估值 `+≈14` / `~326` vs 实测 **+21** / **333**——本段按实测登记；§2 既有行不回改（append-only）。
4. 域外实核：「T-DC-18」形态**不被 CASE_RE 匹配**（`scripts/doc-check-anchors.mjs:46`；本席 node 实跑：`T-DC-18` / `T-DC-19` / `T-DC-1` 零匹配，`T-DC1-17` 匹配）⇒ §3 域外注（`:150`）成立；代码评审轮曾提相反判断，经实核排除——对判面零影响（test 树 token 同名在册）。

**审计与代码评审轮次与终态**

- 审计（explore · 只读 · 轮 1）：代码面逐项相符（§2.4 逐字 / 判别力 / 反证方向 / 写域 / 夹具纪律）；唯一 fail 项 = 「§5 未落盘」（记录面，本段即消解）⇒ **0 修正轮**。
- 代码评审（advisor · type=code · 轮 1）：🔴 0 · 🟡 2（均非 must-fix：档头来源刷新 · 既有尺寸裁定登记）· 🔵 3（区段横幅 / Δ 漂移 / 覆盖窄点）⇒ **VERDICT: pass** ⇒ **0 修正轮**。
- **终态 = clean**（两评审均过 · 0 修正轮 · 全量 863/863 绿）。

**附注（终态口径订正 · 逐字为准）**：审计轮 1 的**形式判定 = fail**（唯一项 = §5 未落盘——记录面完整性；其代码面判定 = 逐项相符、零 🔴）；§5 落盘后该项消解 ⇒ **交付面终态 = clean**（代码面 0 修正轮）。上句「两评审均过」应读作「代码评审 pass ∧ 审计代码面相符（fail 项 = 本段，已消解）」。另：审计未执行 `npm test` / `git diff`（其工具面为只读无 exec）——测试读数与写域取证以本段实跑与 `git diff` 为准。

## §6 验证与收口（父代理）

**核验与收口（主 agent · 2026-09-25）**

**实施交付核验**
- 交付 = eng-coder `#65`（内部审计 1 轮〔代码面逐项相符〕+ 代码评审 1 轮 **pass**〔🔴0 / 🟡2 均非 must-fix / 🔵3〕· fix 轮 0）。
- **本席复核（读盘抽验）**：T-DC-18/19 落于 `thincoder-cli/test/doc-check.test.mjs:93-113`（四形态 + 反证夹具逐字 = §2.4）✓；**判别力实核**（去 `@` 守卫 ⇒ 同形抽成 `thincoder/core/ghost.mjs` ⇒ 断言必红；含 `@` 零匹配）✓。
- 读数：cli 全量 **863/863** 全绿（doc-check 族 19/19）；`node scripts/doc-check.mjs` = 悬空 4 / 行宽 19（**本批新增 0**——测试档在扫描域外，相对判据）。
- 登记项处置：① 档头索引 / 区段横幅落后一版（非 must-fix）→ **另册**（台账）；② Δ 估值漂移（+21 / 333 vs 估 +~14）→ §5 实测登记 ✓；③ `T-DC-18` 形态不被 CASE_RE 匹配（实跑复核）——**评审核实**（本席域外注同证）。

**台账口径**
- #299 → 待核销 → 已核销（护栏两用例落位）。
- #323 = **已废弃（重立续候）**——§4.14 判据输出非空（在飞 84 / 无状态行子类 27）⇒ 三项包全保留；同一事项**另立新条**续候（`trigger=条件`）。

**收口**：§1 置「已收口」· 记录冻结；designToken 消费（链终止）。
