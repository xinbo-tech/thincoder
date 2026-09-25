# 2026-09-25 · single-source-closeout
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-25 · 来源 = 用户 2026-09-25 15:29「看一下技术待办，分一下批，整体处理」——技术待办排批（批 1/6 · 单源化收尾）。
> 台账 = #333 / #344 / #348（单源化收尾 · 归批）。前情 = docs/batches/2026-09-25-peer-closeout.md §6（已收口 2026-09-25）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-25
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**来源** = 用户 2026-09-25 15:29「看一下技术待办，分一下批，整体处理」——技术待办排批（批 1/6 · 单源化收尾）。**全链口径** = 设计 → 评审 → §4 → 实施 → §6（承今日先例 · 父侧代执行）。

**批件**（3 条 · evidence 全档 = `ledger_query`）：

| # | 条目 | 要点 / 已定裁定 |
|---|---|---|
| 台账 #333 | L3 目标解析语义差（`file_ops copy` 源侧） | **用户裁 15:16 = 先修正核、再单源化**：① 动作感知入单源谓词 `thincoder-core/agent/helpers.mjs` `toolTouchPaths`（copy ⇒ 只 `dest`；move/rename 等 ⇒ source+dest），核 `peer-domains.mjs:79-93` 特例分支随删；② 端 `tool-gates.mjs:21-31` `l3TouchedPaths` 删本地分支、整面引核（零副本）。随改 = 设计档 §4.2 字面（双算 ⇒ 动作感知）+ `TOOLS.md` §6.17 谓词规格 + 十消费点语义复核（核 6 / 端 4）。 |
| 台账 #344 | 端 `conflicts` 判据差 | 端 = 精确匹配 + cwd 无关 ∥ 核 = `pathsOverlap` + 同 cwd 过滤。**父侧呈报（待设计核验）= 端向核对齐**：判据字面单源 = 设计档 §4.3 `:224`（`pathsOverlap` + 同 cwd + self 排除）+ `:173` 测试面 + 需求 `:84`「判活 / 标记判据以核单源为准」——保留立足点（结构性不对称）**不成立**（端 SWR 壳不受牵连，只并判据段）。设计轮如发现保留立足点 ⇒ 停下上报。随改 = 端差登记条（设计档 `:169-171`）随对齐删除 + 端 T-L3v2 断言改正为「与核同判据」（端测试档）。 |
| 台账 #348 | `killProcessTree` 三份重复 | 向 `thincoder-core/tools/process-tree.mjs` 单源收：余项 = bash 侧旧副本（`tools/bash.mjs:66`——实读现况） + VSC 侧（`thincoder-vscode/src/tools/shared.mjs:93`）。需设计先行（跨包引用路径 + 测试面）。 |

**边界**：不动 #298（条件未到——写路径冻结未复现）；send 机制面零触；`#333` 十消费点复核范围 = 谓词语义波及面（不改各消费点行为，只核 copy 语义变化是否引入非预期）。

**前情** = 批 `2026-09-25-peer-closeout` §6（#291/#302/#296/#290 三单源化 + 测试背填的余项承接）。

**父侧注记（评审轮 1 处置 · 2026-09-25）**：发现 7 = §1 引据链「设计档 §4.3 `:224`」不落位——该条实住 `:171-173`（测试层判据 `:174-176`），以本注为准。其余六项（AC-5 扫描域限定 / 规范面坐标重锚 / rules-face 行为面补口 / 497→499 / §6.17 消费点表重锚 / 登记面判定句）**已打包派设计修正轮（fix）落**，§4 签口随修正核验后置。

**父侧注记（2026-09-25 15:5x · 跨批协调）**：批 4 已把本档 `MULTI-INSTANCE-COLLAB.md` 坐标 re-anchor 至**现态**；本批**实施**（删 `peer-domains.mjs` `peerWriteTargets` 特例分支）将再漂 −≈3 行 ⇒ **实施落定后由收正轮重锚一次**（批 4 上抛 3 之承接；收正轮范围 = 本档坐标 + 批 4 同时锚定的邻接坐标）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（2026-09-25 · initial 轮 + 评审修正轮 + 实施后重锚轮（fix）落位 · #333/#344 已落（含重锚）· #348 零码改 · 重锚读数 = 本段尾块（供 §6 引用））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**本批条目（覆盖）**（3 条 · evidence = `ledger_query`）：

| # | 条目 | 覆盖 | 交付形态 |
|---|---|---|---|
| 台账 #333 | L3 目标解析语义差（`file_ops copy` 源侧） | 全 | 谓词规格收正 + 双端分支清零 + 十消费点复核（**码改**） |
| 台账 #344 | 端 `conflicts` 判据差 | 全 | 端向核对齐 + 端差登记条删除 + 端断言收正（**码改**） |
| 台账 #348 | `killProcessTree` 三份重复 | **实核已在位** | 零码改 + 再导出面一行清理（父侧裁②）；台账由父侧按「已废弃（重复条目）」录入 |

### 设计档落点（file:line · as-of 2026-09-25 落盘后实测）

| 条目 | 落点 |
|---|---|
| #333 | `docs/core/design/MULTI-INSTANCE-COLLAB.md` §4.2 目标解析行（`:143-145`）；`docs/core/design/TOOLS.md` §6.17 契约条（`:919-921`）+ **裁定 5**（`:928-933`）+ 接口契约表端消费行（`:946`）+ §7 **D-TO13**（`:972`）；两侧变更记录 |
| #344 | `docs/core/design/MULTI-INSTANCE-COLLAB.md` §4.3 **端 `conflicts` 判据条**（`:171-173`——与核同判据 + A9 端差保留核查 = 不成立）；同节判据（测试层）端半行（`:176`——与核同判据对位）；**冲突判据端差登记条删除**（原 `:169-171` 区）；变更记录（`:411-414`） |
| #348 | **零设计档改**（单源已在位——`TOOLS.md` §6.14 落位表行 2 `:594` / 变更记录已载） |

### 机制设计

**#333-A · 谓词规格（`thincoder-core/agent/helpers.mjs` `toolTouchPaths`）**——无钩子径加 `file_ops` 动作感知：
`action === "copy"` ⇒ `[args.dest]`（源仅读取，不属写域）；`move` / `rename` / 未知或缺失 `action` ⇒ `[args.source, args.dest]`（保守双算）；有钩子 ⇒ 钩子裁决优先（两树 `file_ops` 均零钩子——`thincoder-core/tools/ops.mjs:17-44`；动作枚举 = `move` / `copy` / `rename`）；其余工具维持 `[args.path]` 兜底（形态零变）。
**#333-B · 核分支清零**：`thincoder-core/peer-domains.mjs` `peerWriteTargets` 的 `file_ops` 双算特例分支删除（全走谓词；resolve / 畸形跳过循环零改）。
**#333-C · 端分支清零**：`thincoder-vscode/src/agent/tool-gates.mjs` `l3TouchedPaths` 删本地 `file_ops` 分支与 `toolName` 参数（整面转调谓词）；两调用点同步改签名（`tool-gates.mjs:115` · `execute-tools.mjs:190`——仓内零测试消费者，实扫）。

**#333-D · 十消费点语义复核（核 6 / 端 4）**——`file_ops` 可达性 × copy 语义变化结论：

| # | 消费点（as-of 2026-09-25） | `file_ops` 可达 | 结论 |
|---|---|---|---|
| 核 1 | `thincoder-core/agent/dispatch.mjs:126`（执行即刻记账） | 不达（调用点门 `FILE_MUTATORS` `:375` / `:428`） | 零变 |
| 核 2 | `thincoder-core/agent/dispatch.mjs:198`（工程设计闸） | 不达（门 `:195-197`） | 零变 |
| 核 3 | `thincoder-core/agent/dispatch.mjs:229`（D5 冻结窗 + #309 批次档写门） | 不达（门 `:227`） | 零变 |
| 核 4 | `thincoder-core/agent/record-results.mjs:150`（`_touchedFiles` + 重建索引） | 不达（门 `:147`） | 零变 |
| 核 5 | `thincoder-core/agent.mjs:401`（中断分支记账） | 不达（门 `:394`） | 零变 |
| 核 6 | `thincoder-core/peer-domains.mjs:82`（`peerWriteTargets` → `peerCollabNote:218` / `recordPeerWrites:258`） | **达**（`PEER_WRITE_TOOLS:42` = `FILE_MUTATORS` ∪ `file_ops`） | **行为变（本裁定目标面）**：`copy` 源不再登记足迹 / 不落认领 / 不触发写前软提示 |
| 端 7 | `thincoder-vscode/src/agent/tool-gates.mjs:23-31`（`l3TouchedPaths`；调用点 = `execute-tools.mjs:190` L3 预检 + `tool-gates.mjs:115` D5 冻结窗 / #309） | **达**（`L3_WRITE_TOOLS` `execute-tools.mjs:33`；`:113` 门含 `file_ops`） | **零变对齐**（端侧本已 `copy ⇒ dest`）——删本地分支不改端行为 |
| 端 8 | `thincoder-vscode/src/agent/execute-tools.mjs:351`（`_touchedFiles`） | 不达（门 `:340`） | 零变 |
| 端 9 | `thincoder-vscode/src/agent/tool-gates.mjs:96`（工程设计闸） | 不达（门 `:95`） | 零变 |
| 端 10 | `thincoder-vscode/src/agent/rules-face.mjs:103`（作用域规则 JIT） | **达**（`PATH_TOOLS:73` = `FILE_MUTATORS` ∪ `file_ops` ∪ `read` / `glob`） | **行为面变化（如实登记）**：`file_ops` 覆盖面**由死转活**——谓词此前对 `file_ops` 返 `[args.path]`（该工具无 `path` 参）⇒ 零候选 ⇒ 声明覆盖面实为死路；此后 `copy ⇒ [dest]`、`move` / `rename ⇒ [source, dest]` 参与规则命中（VSC 专属面，核内无 rules-face） |

**#344 · 端 `conflicts` 向核对齐**（`thincoder-vscode/src/extension/peer-domains.mjs` `conflicts`）：
判据由「归一后精确匹配 + 与 cwd 无关」并核为「`claimsOverlap`（相等或互为目录包含）+ 同 cwd 过滤」；hot 窗口 / self 排除 / 聚合缓存 / 返回载荷 `{file, pid, end, sessionId}` 零改；`cwd` 经既有闭包（`peerDomains(cwd)`）取，签名零改。
**A9 端差保留核查（设计轮）= 不成立**：端同时具备同 cwd 过滤（`sameCwd:208`）与重叠谓词（`claimsOverlap:119`，与核 `pathsOverlap:74` 同判据）两件 ⇒ 无结构性强不对称（端 SWR 壳 / 缓存键不受牵连）；按「端差默认 = 消（2026-09-21 用户裁定）」并核，**无立足点上报项**。
需求面合规核查（读不写 · 笔在主 agent）：N-MI2（lockstep「各实现面行为语义一致」）覆盖本条一致性依据；F-MI3 抽象层（「写路径命中他活实例短时热登记域 ⇒ 软提示」）无需为 copy 语义改字面——写域定义属设计层（§4.2 D-L3a）。⇒**需求档零改**。

**#348 · 实核（父侧裁 ① 措辞全含）**：
单源 = `thincoder-core/tools/process-tree.mjs:13`（`export function killProcessTree`）；消费面两处均已引核——`thincoder-core/tools/bash.mjs:11` 与 `thincoder-vscode/src/tools/shared.mjs:25`（另 `thincoder-core/tools/execute.mjs:30`（再导出 `:65`）· `thincoder-vscode/src/tools/shell.mjs:17`）；
机检：`function killProcessTree` 三包源码域（`thincoder-core/` · `thincoder-cli/` · `thincoder-vscode/`）命中 = **1**（另两命中仅在 `.thincoder/tmp/{core-pkg,core-probe}/` 打包 / 探针副本——非源码域）；
佐证 = 提交 `19c1917f`（2026-09-22 · 批 `2026-09-22-pending-triage` #208②：`bash.mjs` −12 · `shared.mjs` −9）；批 `2026-09-25-misc-four` 批档同证（「树杀单源 = 已在位（本批零改 · 实核）」）。⇒ 本批 #348 = 零码改。
**残项（父侧裁 ②）**：端壳再导出面 `thincoder-vscode/src/tools/shared.mjs:92`（`export { killProcessTree }`）——**实核消费者 = 0**。
实核依据（符号级扫描）：VSC 树 `killProcessTree` 仅 5 处命中 = 端壳 `:12` 注释 / `:25` import / `:92` 再导出 / `:137` 内部消费 / `:194` 缝供值（另 `shell.mjs:17` 直引核单源）；
从 `shared.mjs` 的具名 import 仅 `resolvePath`（`focus.mjs:8` · `index.mjs:169`）与 `MAX_STREAM_BUF`（`shell.mjs:18`）；测试面零引用。
⇒ 随本批实施轮**一行级清理**（删该行，端壳内两消费点零改），验收 = core + vsc 两包全绿。

### 受影响文件与测试面（行数 = 实读 2026-09-25；Δ = 预估）

| # | 文件 | 现况行数 | Δ | 内容 |
|---|---|---|---|---|
| 333 | `thincoder-core/agent/helpers.mjs` | 459 | +≈7 | 谓词 `file_ops` 分支 + 契约注释（>300 已在册 · ≤500 ✓） |
| 333 | `thincoder-core/peer-domains.mjs` | 297 | −≈3 | `peerWriteTargets` 特例分支删除 + 注释收正 |
| 333 | `thincoder-vscode/src/agent/tool-gates.mjs` | 173 | −≈4 | `l3TouchedPaths` 删分支 + `toolName` 参数 + 注释；`:115` 调用点 |
| 333 | `thincoder-vscode/src/agent/execute-tools.mjs` | 420 | ±1 | `:190` 调用点签名 |
| 333 | `thincoder-core/test/touch-paths.test.mjs` | 108 | +≈10 | 新增 T6：`copy` / `move` / `rename` / 无 `action` / 有钩子优先 五格 |
| 333 | `thincoder-core/test/peer-domains.test.mjs` | 239 | ±≈6 | T-L3b 补动作感知格（`copy` ⇒ 单目标 `dest`；`move` ⇒ 双目标） |
| 344 | `thincoder-vscode/src/extension/peer-domains.mjs` | 269 | ±≈8 | `conflicts` 判据改（重叠 + 同 cwd）+ 头注 / 行注收正 |
| 344 | `thincoder-vscode/test/peer-domains.test.mjs` | 280 | ±≈8 | T-L3v2 断言段改写（四态对位核 T-L3e） |
| 344 | `thincoder-vscode/test/files.mjs` | 142 | ±1 | 登记表 `:137` 注（去「路径/cwd 端差」字样 → 「与核同判据」） |
| 348 | `thincoder-vscode/src/tools/shared.mjs` | 196 | −1 | 删 `:92` 零消费者再导出行 |
| 验收 | core / cli / vsc 三包全量 | — | — | `thincoder-core/agent/dispatch.mjs` **零改**（499 贴 500 硬限——本批不得触碰） |

### 验收对照（逐条回指 · 机检形）

| AC | 判据 | 回指 |
|---|---|---|
| AC-1 | 谓词五格：`copy ⇒ [dest]` · `move ⇒ [source,dest]` · `rename ⇒ [source,dest]` · 无 `action ⇒ [source,dest]` · 有钩子 ⇒ 钩子裁决优先——`thincoder-core/test/touch-paths.test.mjs` 新增用例绿 | #333 · `TOOLS.md` §6.17 契约条 |
| AC-2 | 核 `peerWriteTargets` 体内零 `file_ops` 分支（结构机检：零 `args?.source` / `args?.dest` 字面）；行为锚 `peer-domains.test.mjs` T-L3b 绿 | #333 · `MULTI-INSTANCE-COLLAB.md` §4.2 |
| AC-3 | 端 `l3TouchedPaths` 体内零 `file_ops` / `action` 字面（结构机检）；两调用点签名同改；vsc 包全量绿 | #333 · `TOOLS.md` §6.17 裁定 5 |
| AC-4 | 端 `conflicts` 四态与核 T-L3e 同判：目录 D ∧ target = D 下文件 ⇒ 命中 · 他 cwd ⇒ 零命中 · 同路径 ⇒ 命中 · hot 界外 ⇒ 零命中——端 T-L3v2（改写后）绿 ∧ 核 T-L3e 零改绿 | #344 · `MULTI-INSTANCE-COLLAB.md` §4.3 |
| AC-5 | `docs/core/design/MULTI-INSTANCE-COLLAB.md` 内「冲突判据端差」字面 = 0 ∧ 含「与核**同判据**」条（文档面机检） | #344 · 端差默认 = 消 |
| AC-6 | 三包源码域 `function killProcessTree` 命中 = 1 ∧ 端壳 `shared.mjs` 零 `export { killProcessTree }` 行 ∧ core + vsc 两包全绿 | #348 · 父侧裁 ①② |
| AC-7 | 三包全量：`thincoder-core` · `thincoder-cli` · `thincoder-vscode` 全绿（零回归） | 全批 |

### 关键决策

| # | 决策 | 理由 / 否决备选 |
|---|---|---|
| KD-1 | 动作感知规则**入单源谓词**（采原二择①；核 `copy` 源出写域） | 用户裁 2026-09-25 15:16「先修正核、再单源化」——单源化只消灭两处漂移、不判规则对错。否决：核向端对齐（端窄形态转正）· 只改设计档字面而谓词不动 · 逐消费点各自判别 |
| KD-2 | 端 `l3TouchedPaths` **参数收缩**（`toolName` 随分支删除） | 该参唯一用途 = 本地 `file_ops` 分派；留则成死参（下轮漂移源）。两调用点仓内同改，零测试消费者（实扫） |
| KD-3 | #344 = **端向核对齐**（端谓词沿用端 `claimsOverlap`——值对齐） | A9 三件（结构性不对称 + 证据 + 显式裁定）核查 = 不成立 ⇒ 端差默认 = 消。端差登记条随对齐删除（不留挂尸） |
| KD-4 | #348 = **零码改** + 再导出面一行清理 | 三份重复已于 `19c1917f` 收口（实核 + misc-four 同证）；再导出面零消费者 ⇒ 清理（父侧裁②「勿为清理而清理」——有消费者则保留） |
| KD-5 | 端 rules-face `file_ops` 覆盖面**由死转活** = 如实登记、不自行扩面处置 | 该面声明 `PATH_TOOLS` 含 `file_ops`，此前实零候选（谓词返 `[args.path]`）——属谓词射程补全的**导出行为变化**；处置（接受 / 另行处置）留评审与父侧 |

### 上抛项

1. **端 `claimsOverlap` ∥ 核 `pathsOverlap` = 同判据双实现**（`thincoder-vscode/src/extension/peer-claims.mjs:119-126` ∥ `thincoder-core/peer-claims.mjs:74-81`，逐行同判据）——按 D-MI24「无端差纯函数 ⇒ 核具名导出 + 端引核」属同族余项；**不在 §1 批件内**，本批零触；请父侧裁：并入本批（端引核、删端副本）或另册。
2. **`CORE-UNIFICATION.md` 迁移跟踪表右列陈旧（系统差）**：`:1334`（#57 树杀）等行仍记「端侧接线（S2…）」，实盘端已接线（`thincoder-vscode/src/tools/shared.mjs:194`）——本批零触；供文档卫生轮。
3. **端 rules-face 行为面变化**（见 #333-D #10 与 KD-5）——已在设计档登记；若评审 / 父侧判需另行处置（如 rules-face 补回 copy 源），属新裁定，本批未扩面。
4. **#348 前提相抵**（台账「余项 = bash 侧旧副本 + VSC 侧」现不成立）——已发上游 ask，父侧已裁（零码改 + 台账按「已废弃（重复条目）」录入）；记录在案。

### 边界（本批不做）

- **代码零写**（设计轮边界——实施归 eng-coder，产品码写需 designToken）；**设计评审未点火**（点火权在主 agent / 用户）。
- **不动 #298**（写路径 L3 peer 检查同步族——条件未到）；**send 机制面零触**。
- **UI / 交互面 = 零**（本批无 UI 决策，无 `open` 项）。
- **`thincoder-core/agent/dispatch.mjs` 零改**（**499** 行贴 500 硬限——核 6 消费点中三处在该档，且均已由 `FILE_MUTATORS` 门卫隔断 ⇒ 本批无需触碰）。
- **需求档零改**（笔在主 agent——N-MI2 已覆盖 #344 判据一致性；F-MI3 属抽象层，无需为 copy 语义改字面）。
- 以下随「上抛项」待裁、本批不做：端 `claimsOverlap` 单源化（上抛 1）· `CORE-UNIFICATION.md` 迁移跟踪表收正（上抛 2）· rules-face 另行处置（上抛 3）。
- 文档机检读数（设计轮实跑 `node scripts/doc-check.mjs`）：**锚 7 悬空 + 行宽 23 行**——逐条均落他档（`DOC-DISCIPLINE` / `MODEL-SPECS` / `PROMPT-SYSTEM` / `SESSION` / `CORE-UNIFICATION` / `MODEL-BENCH` / `VSC-DEBT` / `WEBVIEW`），**本批两设计档与批档零新增**（本批新增行全 ≤300 或表行豁免）。

### 评审轮 1 修正块（fix 轮 · 2026-09-25 · 承 §3 发现 1–6 · append-only——本段既有行零回改）

| 发现 | 落点 / 改法 | 实读对位 |
|---|---|---|
| 1 · AC-5 收正 | **AC-5 改述（收正读法）**：`docs/core/design/MULTI-INSTANCE-COLLAB.md` 内「冲突判据端差」**规范面 = 0** ∧ 含「与核**同判据**」条——扫描口径沿用设计档 §4.3「字面规范面」判据① 的三排除（定义性引用行 / 记录面与归档面 / `.thincoder/tmp/**`）；**记录面豁免**：该字面现盘仅存变更记录两处（`:413` / `:417`——史实存，按纪律不得清理），不入判据 | 机检实读 2026-09-25 |
| 2 · 坐标重锚 | `MULTI-INSTANCE-COLLAB.md` 全档 `thincoder-core/peer-domains.mjs` 坐标逐条实读复核——实改一处：§4.4.1 聚合缓存区 `:156-172` → `:154-170`；余者（`:37` / `:79` / `:34` / `:111-118` / `:177` / `:188` / `:216` / `:243` / `:248` / `:256` / `:275` 与 §7 `:296` 行）及端档 `peer-domains.mjs:90-111` / `:8-9` 对位一致——零改 | 逐条实读对位（带 = `thincoder-core/peer-domains.mjs` 现盘） |
| 3 · rules-face 补口 | 端 #10 行为面变化**补一格用例位**：`file_ops` `copy` / `move` ⇒ 作用域规则候选命中（JIT 注入）；落点 = `thincoder-vscode/test/scoped-rules.test.mjs`（T-B3 族续编——现盘 T-B3 只走 `read` 径）；已落 `TOOLS.md` §6.17 裁定 5 ② + 本块 **AC-8** | 现盘 T-B3 实读 |
| 4 · 行数收正 | `MULTI-INSTANCE-COLLAB.md` §4.4.6 钩点行：「该档 497 行贴硬限——距 500 余 3 行」→「该档 499 行贴硬限——距 500 余 1 行」；零改结论不动 | `thincoder-core/agent/dispatch.mjs` 现盘 = 499 行 |
| 5 · §6.17 表重锚 | `TOOLS.md` §6.17 消费点表行号全表重锚现盘（行 1→`:126` · 2→`:198` · 3→`:229` · 4→`:150` · 5 零改（`:401`）· 6→`:82` · 7→`:23` · 8→`:351` · 9→`:96` · 10→`:103`；脚注调用方 `:188`→`:190`）；表头标「形态 / 守卫列 = #327 落地前实读」；行 7 形态列补「裁定 5 落地后 = 整面转调单源谓词」 | 十点逐点实读 |
| 6 · 登记面判定 | `TOOLS.md` §6.17 补**登记面判定 / 发布关联**句（照 `:949-950` 先例）：纯缺陷修复（#333 / #344 同判）⇒ 零对外契约登记 / 零 CHANGELOG 行；发布动作 = 用户门 | 先例条文对位 |

**AC 增量（收正件）**：

- **AC-5（收正后读法）** = 规范面零命中（扫描口径如上）∧ 记录面豁免 ∧「与核同判据」条在场。
- **AC-8** = `thincoder-vscode/test/scoped-rules.test.mjs` 新增 `file_ops` 用例绿：`file_ops`（`copy` / `move`）⇒ 作用域规则候选命中（JIT 注入对位 T-B3 族）——回指 #333 · `TOOLS.md` §6.17 裁定 5 ②。

**坐标注记（现盘为准）**：本段上表「设计档落点」中 `MULTI-INSTANCE-COLLAB.md` 侧读数为设计轮实测值，现盘该侧已前移 +3——§4.2 目标解析行 = `:146-148` · §4.3 端 `conflicts` 判据条 = `:174-176` · 同节测试层判据 = `:177-179` · 变更记录 = `:414-417`；`TOOLS.md` 侧读数与现盘一致（零改）。

**修正轮边界**：不触代码（`thincoder-core/**` / `thincoder-vscode/**` 归实施轮）· 不动 §3 段 · 本段既有行零回改 · 两设计档变更记录各追加一条 fix 轮条目（既有条目零回改）· 发现 7（§1 引据链）= 父侧注记落定，不在本块。

### 实施后重锚块（fix 轮 · 2026-09-25 · 承 §5 漂移清单 · 父侧派单 · 本段既有行零回改）

**逐处重锚读数（旧值 → 新值 · 逐处实读现盘复核）**：

| 档 | 位置（改前现盘行） | 旧值 → 新值 | 现盘对位 |
|---|---|---|---|
| `docs/core/design/MULTI-INSTANCE-COLLAB.md` | §4.2 写点行 `:144` | `recordPeerWrites :256→254` · `flushPeerDomains :275→273` | 核 `peer-domains.mjs:254` / `:273` ✓ |
| 同 | §4.3 聚合行 `:153` | `peerDomains :177→175` · `conflicts :188→186` | 核 `:175` / `:186` ✓ |
| 同 | §4.3 dispatch 钩子行 `:160` | `peerCollabNote :216→214` | 核 `:214` ✓ |
| 同 | §4.3 分隔符行 `:169` | `:248→246` | 核 `lines.join("\\n")` `:246` ✓ |
| 同 | §4.3 字面规范面行 `:170` | `:243→241` | 核文案行 `:241` ✓ |
| 同 | §4.4.1 落盘理由行 `:208` | 核区 `:154-170→:152-168` · 端区 `:90-111→:90-107` · 端头注 `:8-9→:9-10` | 核 `cachedScan` `:152-168` / 端聚合区 `:90-107` / 端头注 mtime 句 `:9-10` ✓ |
| 同 | §4.4.1 兼容行 `:209` | `:111-118→:109-116` | 核结构校验区 `:109-116` ✓ |
| 同 | §7 域面 L3 行 `:296` | `peerDomains:175` · `conflicts:186` · `peerCollabNote:214` · `recordPeerWrites:254` · `flushPeerDomains:273` | 逐锚同核现盘 ✓（零漂锚 `:37` / `:79` / `:34` / `:50/:58` 保留） |
| `docs/core/design/TOOLS.md` | §6.17 消费点表行 6 `:908` | `peer-domains.mjs :82→:80` | 核谓词调用行 `:80` ✓ |
| 同 | §6.17 消费点表行 9 `:911` | `tool-gates.mjs :96→:90` | 端工程门谓词调用行 `:90` ✓（该档 `l3TouchedPaths` 收缩 −6 行） |
| 同 | §6.17 表头 `:899` | 行号 as-of 补「实施后重锚」 | — |
| 同 | §6.17 用例位句 `:933` | 「现盘 T-B3 只走 `read` 径」→「`file_ops` 径 · 用例 = T-B3b」 | 端 `scoped-rules.test.mjs:136-138` T-B3b 已在位 ✓ |

**零漂复核（逐锚实读 · 零改）**：核 `peer-domains.mjs` `HOT_WINDOW_MS:37` · `peerWriteTargets:79` · re-export `:34` · 测试缝 `:50/:58`；`thincoder-core/peer-claims.mjs:74`；端 `peer-claims.mjs:119` / `:36-37`；TOOLS §6.17 行 1–5 / 7 / 8 / 10（`:126` / `:198` / `:229` / `:150` / `:401` / `:23` / `:351` / `:103`）+ 脚注调用方 `:190`——逐点实读落位。

**本批另落锚读数（供后续引用）**：`thincoder-core/agent/helpers.mjs:108`（`file_ops` 动作感知行；谓词全函数 `:104-117`）· `thincoder-vscode/src/agent/tool-gates.mjs:21-25`（`l3TouchedPaths` 定义——函数行 `:23` 零漂）· 调用点 = `tool-gates.mjs:109`（原 `:115`）· `execute-tools.mjs:190`（零漂）。

**机检读数**：`node scripts/doc-check.mjs`（thincoder 根）——改前 = 悬空 4 + 行宽 19；改后 = 悬空 4 + 行宽 19（**零新增**）；两设计档改动行（含新增 changelog 行）全 ≤300 字符。4 条悬空 = `MODEL-SPECS.md` ×3 + `SESSION.md` ×1（他批面，改前既存）。两档变更记录各 +1 条（「实施后重锚」——`MULTI-INSTANCE-COLLAB.md:427-429` / `TOOLS.md:1027-1029`）。

**范围外发现（未动 · 上报）**：① `TOOLS.md` §6.16 两处 helpers 锚与现盘不符（文 `:335-338` / `:392-393` ∥ 现盘 `readonlyToolNames:368` / `AUTO_TURN_DIGEST_DOMAIN:436`）——本批 +5 行前即已偏移（漂移源 = guard-scheduler 期谓词块插入），非本批面；② `TOOLS.md` §2.2 迁移表 VSC `shared.mjs` 引指（`:109-112` / `:129` / `:66-106`）与现盘不落位（迁移期表，早于本批）。两项均建议随文档卫生轮处置。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**设计评审轮 1 · 批 single-source-closeout（#333 / #344 / #348）——发现表**

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Acceptance criteria | 🟡 | AC-5（批档 §2「验收对照」）「`docs/core/design/MULTI-INSTANCE-COLLAB.md` 内『冲突判据端差』字面 = 0」按字面永不成立：该字面在该档**记录面**存活两处（变更记录 `docs/core/design/MULTI-INSTANCE-COLLAB.md:410` / `:414`），记录面按纪律不得清理 ⇒ 计数 = 2 ≠ 0。规范面本身已清理干净（§4.3 现无该条）。 | 给机检加扫描域限定（「规范面 = 0」——沿用本档 §4.3「字面规范面」判据① 的三排除口径：定义性引用行 / 记录面与归档面 / `.thincoder/tmp/**`），或改写判据为「规范面零命中 ∧ 记录面豁免」。 |
| 2 | Clarity（doc-state） | 🟡 | MULTI-INSTANCE-COLLAB.md 规范面多处 `thincoder-core/peer-domains.mjs` 坐标落后现盘 +2：`peerDomains`（文 `:179` / 盘 `:177`）· `conflicts`（`:190` / `:188`）· `peerCollabNote`（`:218` / `:216`）· `recordPeerWrites`（`:258` / `:256`）· `flushPeerDomains`（`:277` / `:275`）· 冲突字面实现点（`:245` / `:243`）· 聚合缓存区（`:156-172` / `:154-170`）。批档 §2 自身落点坐标抽检全对。 | 把该组坐标随实施落盘重锚（或对非落点引用去行号）。 |
| 3 | Acceptance criteria | 🟡 | 端 #10（rules-face `file_ops` 覆盖面由死转活）已如实登记并上抛（KD-5 / 上抛 3），但 AC-1…AC-7 无一格覆盖该行为面变化，也无「零测试」显式裁定；现盘 `thincoder-vscode/test/scoped-rules.test.mjs` 的 JIT 用例（T-B3）只走 `read`，`file_ops` 径现零覆盖。 | 补一格用例（`file_ops` copy / move ⇒ 作用域规则候选命中）或在验收对照里落一句「零测试」的显式裁定。 |
| 4 | Doc hygiene | 🔵 | 两在册文件对 `thincoder-core/agent/dispatch.mjs` 行数不一致：`MULTI-INSTANCE-COLLAB.md:252` 记 497（「距 500 余 3 行」）∥ 批档 §2（`:93` / `:129`）记 499；现盘读数 = 499。 | 两处对齐为 499；零改结论不受影响。 |
| 5 | Clarity | 🔵 | `TOOLS.md` §6.17「消费点逐点实读」表（`:899-914`）行号滞后现盘 1–3 行（行 1 `dispatch.mjs:127` / 盘 `:126`；行 3 `:232` / 盘 `:229`；行 8 `execute-tools.mjs:349` / 盘 `:351`；行 10 `rules-face.mjs:101` / 盘 `:103`），且行 7 形态列 `touchedPaths(args ?? {})` 于 #333-C 落地后即被谓词调用形取代。 | 把该表读数重锚到现盘（批档 §2 十点表读数与现盘一致，可作源）。 |
| 6 | Methodology | 🔵 | 本批未给 #333 / #344 的**登记面判定 / 发布关联**句（CHANGELOG / 对外契约 / 发布归属）——§6.17 先例（`TOOLS.md:949-950`）明写该判定与发布关联。 | 按先例补一句判定（缺陷修复 ⇒ 零契约登记 / 零 CHANGELOG ∧ 发布动作 = 用户门），避免实施轮遗漏或重复登记。 |
| 7 | Clarity | 🔵 | 批档 §1 引据链「设计档 §4.3 `:224`」不能落位：§4.3 端 `conflicts` 判据条在 `:171-173`，`:224` 为 §4.4.4 区空白行（§2 的 A9 分析自身独立成立）。 | 引据改为 `:171-176`（判据条 + 测试层判据）。 |

**计数**：🔴 0 · 🟡 3 · 🔵 4。

**VERDICT: pass**

## §4 用户批准（主 agent）

**代执行口径**（承用户 2026-09-25 15:29「整体处理」全链授权）：设计（§2 + 修正块 `:138-156`）→ 评审 pass（§3 轮 1 · 🔴0 / 🟡3 / 🔵4——父侧逐条裁定**全数接受**）→ 修正轮六条落位（`#51`）+ AC-8 增量 → **父侧抽验通过**（`MULTI-INSTANCE-COLLAB.md:208` 重锚 · `TOOLS.md:933` 用例位 / `:947` 端消费行 / `:953` 登记面判定——逐项实读）⇒ **批准进入实施**。设计 token 已发（凭证不落档）；实施 = eng-coder 初始轮，`round=initial`。#348 之「已废弃（重复条目）」台账口径随 §6 落。

## §5 实施记录（eng-coder）
**状态行**：实施完成（2026-09-25 · 11 档 · 三树 675/861/997 全绿 · 审计 CLEAN · 代码评审 pass（fix 0 轮））



### 轮次 1（eng-coder · 2026-09-25 · round=initial）

**落码清单（11 档 · 全部实读复核）**

| # | 文件 | Δ（numstat） | 内容 |
|---|---|---|---|
| 333 | `thincoder-core/agent/helpers.mjs` | +8/−3 | `toolTouchPaths` 无钩子径加 `file_ops` 动作感知（`copy ⇒ [dest]`；其余 ⇒ `[source, dest]`）+ 契约注释 |
| 333 | `thincoder-core/peer-domains.mjs` | +3/−5 | `peerWriteTargets` 删 `file_ops` 双算特例分支（整面走谓词）+ 注收正 |
| 333 | `thincoder-vscode/src/agent/tool-gates.mjs` | +6/−12 | `l3TouchedPaths` 删本地分支 + `toolName` 参；`tool-gates.mjs:109` 调用点签名 |
| 333 | `thincoder-vscode/src/agent/execute-tools.mjs` | 1/1 | `:190` 调用点签名 |
| 333 | `thincoder-core/test/touch-paths.test.mjs` | +13/−1 | 新增 T6（五格 + 畸形一格）；头注 T1–T6 |
| 333 | `thincoder-core/test/peer-domains.test.mjs` | +4/−2 | T-L3b 补动作感知三格（copy / move / 缺 action） |
| 344 | `thincoder-vscode/src/extension/peer-domains.mjs` | +3/−7 | `conflicts` 判据并核（`claimsOverlap` + 同 cwd 过滤）；头注 / 行注收正；死代码 `normalizeForCompare` 随删（替换后零消费者） |
| 344 | `thincoder-vscode/test/peer-domains.test.mjs` | +11/−11 | T-L3v2 改写为四态对位核 T-L3e（目录包含 / 同路径 / 他 cwd / hot 界外） |
| 344 | `thincoder-vscode/test/files.mjs` | +3/−2 | `:137` 注改「路径重叠 + 同 cwd 过滤——与核同判据」 |
| 348 | `thincoder-vscode/src/tools/shared.mjs` | 0/−2 | 删零消费者再导出行 `export { killProcessTree }`（含其后空行） |
| AC-8 | `thincoder-vscode/test/scoped-rules.test.mjs` | +16/0 | 新增 T-B3b（`file_ops` copy ⇒ dest 命中 / move ⇒ 双端命中 / copy 源 ⇒ 零注入） |

**验收读数（逐 AC 机核）**

- **AC-1**：`thincoder-core/test/touch-paths.test.mjs` T6 五格绿（`node --test test/touch-paths.test.mjs test/peer-domains.test.mjs` ⇒ 19/19）。
- **AC-2**：核 `peer-domains.mjs` 体内零 `args?.source` / `args?.dest` 字面（全仓该字面仅存 `.thincoder/tmp/**` 副本）；T-L3b 动作感知格绿。
- **AC-3**：端 `l3TouchedPaths` 函数体（`:23-25`）零 `file_ops` / `action` 字面；两调用点 3 参形（`tool-gates.mjs:109` · `execute-tools.mjs:190`）；全仓 `l3TouchedPaths` 零其他调用点 / 零测试消费者（实扫）。
- **AC-4**：端 T-L3v2 四态绿（`node --test test/peer-domains.test.mjs test/scoped-rules.test.mjs` ⇒ 12/12）；核 T-L3e 零改（该档本批唯一改动面 = T-L3b）。
- **AC-5**：`MULTI-INSTANCE-COLLAB.md` 内「冲突判据端差」规范面 = 0（现盘仅存记录面 `:413` / `:417`——史实存、豁免）；「与核同判据」条在场（`:174-176` / `:179`）。
- **AC-6**：三包源码域 `function killProcessTree` 命中 = 1（`thincoder-core/tools/process-tree.mjs:13`）；端壳 `shared.mjs` 零 `export { killProcessTree }` 行；该符号端壳具名消费者 = 0。
- **AC-7**：三树全量 **core 675/675 · cli 861/861 · vsc 997/997（fail 0 ×3）**——日志 `.thincoder/tmp/ss-core-2.txt` / `ss-cli-2.txt` / `ss-vsc-2.txt`。（过程读数如实：core 首跑 1 红 = `git-noninteractive.test.mjs:170` A26 计时型（load 抖动，单跑复现绿）；vsc 首跑被他在途批 manifest 门拦（`test/effort-select-views.test.mjs` 未注册）→ 二跑绿；cli 基线 1 红 = 他批在途 `cmd-advisor` 改动的 E-3，复跑已被该批收正 ⇒ 绿。）
- **AC-8**：T-B3b 绿（见上）。
- **文档机检**：`node scripts/doc-check.mjs` = 悬空锚 4 + 行宽 18（= 基线 4/18，**零新增**；4 条悬空 = `MODEL-SPECS.md` ×3 + `SESSION.md` ×1，均他批面）。
- **diff 面**：`git diff --stat` 本批 = 上表 11 档（`thincoder-core/agent/dispatch.mjs` 零触——`git status` 该档无改动行）。

**决策透明表**

| # | 决策 | 理由 |
|---|---|---|
| 1 | 谓词分支取 `tool?.name === "file_ops"` 位置式单点 | 与 `PEER_WRITE_TOOLS` / `L3_WRITE_TOOLS` 既有命名面同源；有钩子径零改（两树 `file_ops` 现盘零钩子——实读 `thincoder-core/tools/ops.mjs:17-44`） |
| 2 | 端 `normalizeForCompare` 随判据替换删除 | 替换为 `claimsOverlap` 后零消费者（死代码 = 下轮漂移源）；本档净 −4 |
| 3 | 设计档（含批档 §2）零改 | 设计档只读；坐标漂移交收正轮（漂移量见下） |

**设计档漂移（本批 diff 触碰面 · 交收正轮）**

- 核 `thincoder-core/peer-domains.mjs`：`peerWriteTargets` 定义行 `:79` **零漂**；其后全部设计面锚 **−2**——`cachedScan :154 → :152` · `peerDomains :177 → :175` · `conflicts :188 → :186` · 软提示文案 `:243 → :241` · `peerCollabNote :216 → :214` · `recordPeerWrites :256 → :254` · `flushPeerDomains :275 → :273`。
- 端 `thincoder-vscode/src/extension/peer-domains.mjs`：整档 269 → **265**（−4）；`:90-111` 聚合缓存区现为 `:90-107`；头注 `:8-9` 相对 +1。

**审计与代码评审轮次与终态**

- 内部偏离审计（explore · read-only · 轮 1）：**CLEAN**——四类偏差（部分实现 / 静默简化 / 文档漂移 / 越界）均零；逐 AC 给出 `file:line` 证据 + 日志读数复核。
- 内部代码评审（advisor `type=code` · 轮 1）：**pass**——🔴 0 · 🟡 1（advisory · 非 must-fix：`helpers.mjs` 既有在册 >300 行债，本批未使其越档）· 🔵 3（AC-2/AC-3 机检未固化 / 批档行数表预估偏差 / 本节实施前为空）。**fix round = 0**（无 must-fix 项，修正轮未触发）。

**边界确认**：`thincoder-core/agent/dispatch.mjs` 零触 · #298 面零触 · send 机制面零触 · 需求档零改 · 设计档零改 · UI/交互面零改。

**补记（终检复跑 · 2026-09-25 16:2x）**：代码评审后仅剩一处**注释级**收正（`thincoder-core/test/peer-domains.test.mjs:9-11` 头注把 T-L3b 描述同步为「动作感知」——零行为改），随后复跑：

- 三树读数（终态）：**cli 861/861** · **vsc 997/997** · core 复跑四次——② 次 675/675 全绿（代码与用例改动落定后的读数）；③ 次 655/657（**他在途批**：`thincoder-core/agent-tools/subagent-scheduler.mjs:19` 引 `ASYNC_POOL_LIMITS` 当刻未导出 ⇒ `parent-channel.test.mjs` 整档未起，19 例未计入——该批随后落定，单跑该档 19/19 绿）；④ 次 674/675（唯一红 = `git-noninteractive.test.mjs:170` **A26 计时断言**「孙持管道仍 settle（实读 6175ms）」——并发负载型抖动：该档单跑两次均 5/5 绿（A24/A26 同绿），且该档**不在本批 11 档内、零改动**）。
- 归因口径：core 侧两次非绿均**非本批 diff 面**（一次他在途模块导出缺、一次计时抖动），本批 11 档相关的四个用例族（T6 · T-L3b · T-L3v2 · T-B3b）在每次复跑中全绿。
- `node scripts/doc-check.mjs` 复跑：悬空锚 4 + 行宽 18（基线 4/18，零新增）。
- 定向复跑：core `node --test test/touch-paths.test.mjs test/peer-domains.test.mjs` = 19/19；vsc `node --test test/peer-domains.test.mjs test/scoped-rules.test.mjs` = 12/12。

## §6 验证与收口（父代理）

**核验与收口（主 agent · 2026-09-25）**

**实施交付核验**
- 交付 = eng-coder `#58`（内部偏离审计 1 轮 **CLEAN** + 代码评审 1 轮 **pass**〔🔴0 / 🟡1＝既有在册行数债 / 🔵3〕· fix 轮 0）。
- **本席复核（读盘抽验）**：`helpers.mjs:108` 动作感知三分支逐字（copy ⇒ dest / else ⇒ source+dest）✓ · 核 `peer-domains.mjs:80` 特例分支删 ✓ · 端 `extension/peer-domains.mjs:169/:172`（同 cwd + `claimsOverlap`）对齐 ✓ · 端壳再导出行已清 ✓。
- 读数：三树 **675/675 · 861/861 · 997/997** 全绿；定向 19/19 + 12/12；doc-check 零新增（4/18 基线口径）。
- **收正轮 `#66`**（实施后坐标重锚）落定：12 处对照 + 零漂复核；**本席抽验** `MULTI-INSTANCE-COLLAB.md:153/:160`（`:175`/`:186`/`:214` 新锚）· `TOOLS.md:908/:911`（`:80`/`:90` 新锚）实读 ✓；范围外发现两项 → 另册。
- 披露（认可）：同族死代码 `normalizeForCompare` 随删（替换后零消费者）；表外 2 处（`shared.mjs` 再导出行 · 三档锚）如实 · `dispatch.mjs` 零触（他批注释级并发，本批无写）。

**台账口径**
- **#348 = 已废弃（重复条目）**——工作已随 2026-09-22 批 `19c1917f` 落定（三包单源命中 = 1）；本批仅清理端壳零消费者再导出行（一行级）。
- #333 / #344 → 待核销 → 已核销。

**收口**：§1 置「已收口」· 记录冻结；designToken 消费（链终止）。
