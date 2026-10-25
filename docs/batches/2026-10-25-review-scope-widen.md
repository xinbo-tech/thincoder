# 2026-10-25 · 评审文档路径：按项目根写对（删祖先链试探）+ 收面放宽到仓根
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-25 · 来源 = 用户 2026-10-25 11:41「为啥要试探？不能要求写对吗？」+ 11:43「可以放宽」（GitHub #27：评审只收 docRoot 内文档）。
> 台账 = #1784（ADVISOR · 归批）。前情 = 2026-10-25-integration-unify.md（已收口 2026-10-25）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-25

**需求（用户原话）**：「为啥要试探？不能要求写对吗？」（11:41）· 「可以放宽」（11:43）。

**两件事**：

1. **路径解析单一规则**——相对路径一律按项目根解析；绝对路径照用；解析不出 ⇒ 拒，报错说清期望形。删掉现有四分支里的：会话根集试探 ∥ 父目录祖链链试探 ∥ 多候选歧义归一。
2. **收面放宽**——仓根级文档（如 `METHODOLOGY.md`）也受理；不再限于 `REVIEW_ROOT_KEYS` 五个 docRoot 树内。

**对应 issue**：GitHub #27（评审只收 docRoot 内文档）——本批即其解法，收口后回帖关闭。

**现有实装**（勘察）：`thincoder-core/agent-tools/review-facts.mjs:72-125` 四分支（`resolveReviewDocPaths`）· `:148-158` `candidateRoots`（祖链链底座）· 设计档 `docs/core/design/ADVISOR-GUARDS.md:105-107`（`scope-not-doc` 判据）· `docs/core/design/MANIFEST.md:305`（边界句）。
## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（修正轮 3：9 条全落；需求档 F18 枚举行仍待主 agent）

### 1. 本批条目（覆盖）

本批需求 = §1 两件事（用户原话 11:41 / 11:43）。逐条落地口径：

| # | 需求点（§1） | 本批落地 |
|---|---|---|
| R1 | 相对路径按项目根解析；绝对路径照用；解析不出 ⇒ 拒并说清期望形；删掉会话根集试探 ∥ 父目录祖链试探 ∥ 多候选歧义归一 | 解析单源重写（`thincoder-core/agent-tools/review-facts.mjs` 的 `resolveReviewDocPaths`）；判据正文 = 设计档 §12 |
| R2 | 收面放宽：仓根级文档也受理，不再限 `REVIEW_ROOT_KEYS` 五个 docRoot 树 | 受理 = 项目内现存 `.md`（设计档 §12「收面」段） |

**不在本批**：`resolveBatchDocPath` / `batchDocBases`（batchDoc 是另一机制，仍按候选项目根试探——`BATCH-RECORD.md` §4.15）· `REVIEW_ROOT_KEYS` / `resolveReviewRootsFor` / `resolveReviewTargetPaths` 写门面 · 轮次 / 陈旧判定 / 结算语义 · 扩展名配置面（`index.docExtensions` 不进判据）。

### 2. 设计档落点（单源）

- **机制单源 = `docs/core/design/ADVISOR-GUARDS.md` §12**（「评审文档路径解析与受理面」）+ §2.5 载面 ②（判据名枚举删 `scope-doc-ambiguous`）+ §10 A-AG19 / A-AG20 / A-AG21。
- 消费面指针（D2，不复述）：`docs/core/design/MANIFEST.md` §2.5（评审门条 + 消费点表行 5 + 随动面）· `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` F3。
- 集成索引：`test/RTM.md` 新增 CLI 端故事 6「设计评审的文档范围按项目根受理」三行（6-1 / 6-2 / 6-3）。

### 3. 机制设计（改动面——判据正文在 §12，此处只列改什么）

1. `resolveReviewDocPaths(documents, cwd)` 重写：相对形 = `resolve(projectRootView(cwd).root, doc)`（越根 ⇒ 拒 `outside-project`；根解析不出 ⇒ 拒 `no-project-root`）；绝对形照用；受理 = 现存 `.md` ∧ 绝对形住在一个项目里（`owningProject` 非空）。返回 `{resolved, invalid:[{doc, resolved, reason}]}`。
2. 删除：`sessionReviewRoots`（分支①）· 分支② 所属项目根集受理 · `candidateRoots`（祖链底座）· 分支④ 歧义归一及其 `ambiguous` / `candidates` 返回键。`readableFile` 保留（新判据的「现存文件」判）。
3. `thincoder-core/agent-tools/advisor.mjs`：删 `ambiguous` 拒发分支与 `candidates` 解构；`scope-not-doc` 文案改为「逐文档：输入 → 解析后绝对路径 ∥ 拒因」+ 期望形两句（项目根相对例 / 绝对路径）；`documents` schema 描述改为单一规则；`type` 门 / `batchDoc` / 异步门 / 实例解析零改。
4. 冻结窗同源（零代码）：`advisor-async.mjs:399` 的 `docAbs` 取同一 `resolved` ⇒ 放宽受理的文档在 D5 冻结面内。
5. `criterion=scope-doc-ambiguous` 退场（判据不再可达）——判据枚举与说明同笔删除，不留墓志（D8）。

### 4. 受影响文件与测试覆盖

| 面 | 路径 | 现行数 | 预期增减 |
|---|---|---|---|
| 源 | `thincoder-core/agent-tools/review-facts.mjs` | 159 | 约 −40（四分支 → 单规则；`candidateRoots` / `sessionReviewRoots` 删） |
| 源 | `thincoder-core/agent-tools/advisor.mjs` | 277 | 约 −20（歧义分支删、诊断尾重写、schema 描述改） |
| 设计 | `docs/core/design/ADVISOR-GUARDS.md` | 413 | 约 +35（§12 新节 + 3 条 AC；§2.5 两处收正） |
| 设计 | `docs/core/design/MANIFEST.md` | 1197 | 约 −10（评审门条重写、表行 5、随动面、AC-44 括注） |
| 设计 | `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` | 263 | 0（F3 同格重写、标题随正、两条死指针去路径） |
| 测试 | `test/RTM.md` | 96 | 约 +11（故事 6 三行） |
| 测试 | `docs/batches/2026-10-25-review-scope-widen.test.mjs` | 新建 | 新增（单测档——收口即删） |
| 测试 | `test/integration/review-doc-scope.test.mjs` | 新建 | 新增（集成用例 6-1 / 6-2 / 6-3） |

跨文件上限 / 拆分计划：`review-facts.mjs` 改后 ≤130 行、`advisor.mjs` ≤260 行——均无拆分需要。

### 5. 验收对照（逐条回指 §1 需求点）

| # | 验收（机器可验） | 回指 |
|---|---|---|
| AC-1 | 相对形按会话项目根解析：cwd = 项目子目录时，相对形仍落到项目根下的目标（A-AG19） | R1 |
| AC-2 | 绝对形照用：项目外的绝对路径 ⇒ 拒（`outside-project`，文案含期望形）；项目内 `.md` 绝对路径 ⇒ 受理 | R1 |
| AC-3 | 锚为 workspace / none ∧ 相对形 ⇒ 拒（`no-project-root`，文案报锚态 + 期望形） | R1 |
| AC-4 | 收面：项目根直挂的 `.md`（夹具造 `METHODOLOGY` 说明档）与 `docRoot` 树外仓内文档（实景 `thincoder-core/tool-docs/advisor.md`）⇒ 受理（A-AG20） | R2 |
| AC-5 | 项目内非 `.md`（如 `.mjs`）⇒ 拒（`not-doc-file`）；零实例 / 零 token / 零 LLM | R1 / R2 |
| AC-6 | 零试探残留：`thincoder-core/**` 源内 `candidateRoots` / `sessionReviewRoots` / `scope-doc-ambiguous` / `ambiguous`（评审文档面）零命中；设计档判据枚举零 `scope-doc-ambiguous`（A-AG21） | R1 |
| AC-7 | 冻结窗同源：`docAbs` 取 `resolved`，放宽受理的文档在 `inflightDesignReviewConflict` 命中面内 | R2 |

验收执行：单测档 `node --test docs/batches/2026-10-25-review-scope-widen.test.mjs`（实施席跑，读数入 §5）；集成三行由父侧收口跑（RTM 6-1 / 6-2 / 6-3）。

### 6. 用例表（单测档——正常 / 边界 / 错误）

| # | 类 | 输入（cwd；documents） | 期望 |
|---|---|---|---|
| U1 | 正常 | 夹具项目根（根下放一个 `METHODOLOGY` 说明档，即 `.md`）；documents 传该文件名 | resolved = 根/该文件 |
| U2 | 正常 | cwd = 夹具项目子目录；`["docs/a.md"]` | resolved = 项目根/docs/a.md（不是子目录下） |
| U3 | 正常 | 另一项目内的绝对 `.md` 路径 | 照用受理 |
| U4 | 边界 | 相对形 `../x.md`（越根） | invalid，reason = `outside-project` |
| U5 | 错误 | 项目内 `src/x.mjs` | invalid，reason = `not-doc-file` |
| U6 | 错误 | 项目内不存在的 `nope.md` | invalid，reason = `not-doc-file` |
| U7 | 错误 | workspace 锚（两项目、根无 manifest）；相对形 | invalid，reason = `no-project-root`；文案含期望形 |
| U8 | 边界 | 非字符串 / 空白项混入 | 静默跳过（既有语义零改） |
| U9 | 边界 | 返回形 | 无 `ambiguous` / `candidates` 键 |
| U10 | 正常 | 构造在途设计条目（docAbs 含 U1 的文档）⇒ `inflightDesignReviewConflict` | 命中（冻结窗覆盖放宽文档） |

### 7. 关键决策

| # | 决策 | 否决的备选 | 理由（可核） |
|---|---|---|---|
| KD-1 | 受理 = 项目内**现存 `.md`** | 项目内任何文件 | `criterion=scope-not-doc` 的指义 = 评审对象必须是文档；用户裁定的是**位置放宽**（「不再限于 docRoot 五树」），不是文件种类放宽——去掉 `.md` 会让该判据不可达，设计评审可直接指向代码文件 |
| KD-2 | 相对形限定在会话项目根内（`..` 越根 ⇒ 拒） | 允许 `..` 逃到兄弟项目 | 「按项目根解析」= 基面；跨项目文档走绝对形（用户明示「绝对路径照用」） |
| KD-3 | 删 `ambiguous` / `candidates` 返回面与 `scope-doc-ambiguous` 判据 | 保留判据以防未来试探 | 零候选 ⇒ 判据不可达；不可达判据留在枚举里会被读成「仍会触发」（D8） |
| KD-4 | 基面用 `projectRootView(cwd).root` | `resolve(cwd, doc)`（现状）· `discoverProjects` 直用 | 唯一归属律（`MANIFEST.md` §2.5 单项目解析律）；workspace / none 态能给出精确拒因，而不是猜一个 |
| KD-5 | 不消费 `index.docExtensions`、不新增配置键 | 扩展名白名单配置化 | 本批只裁位置；配置面 = 新机制，未获裁定 |

### 8. 上抛项

- **[待裁·轻] `.md` 白名单保留**：若用户本意是「项目内任何文件都能进设计评审」，删 KD-1 的第 ② 条件即可（一行判据 + 一条用例），其余不动。当前按「只放宽位置」落。
- **[知会] `resolveBatchDocPath` 仍有候选试探**：与本批同族但属另一机制（batchDoc），本批不动——要对齐另起一批。
- **[知会] 文档机检门（gate）读数**：设计档写入后首跑 36 条命中（其中 29 条为本批之前既有的长段、2 条为跨端旧档死指针、其余为本批新写文本的指针/长段）——本轮已把本批引入的命中与两条死指针修净，长段经同轮格式收正后复跑：`DOC-CHECK GATE: REFUSED（命中 3 条）` → 修净后 **PASS**（读数见 §6 或本节回执）。

### 修正轮 1（评审 §3 十条发现——第 8 条父侧驳回，其余 9 条按编号落地）

> 口径：只落「评审发现 + 父侧裁决」直接导出的修正；机制语义（§12 分支表 / 拒因三值 / 受理面）零改。行号 = 本轮实测（`\n` 计数）。

| # | 级别 | 改动 | 落点 |
|---|---|---|---|
| ① | 🔴 | 补「集成验收（RTM delta）」段：起点 = 故事 6，逐行点组件间交互 / 业务可观察结果 / 入口 / 回指 F18；三答 = 破行 6-1（补锚态前置）· 冗余无 · 缺失 6-4（`no-project-root`）；§2.4 类型门 ∥ §5 冻结窗写明不立行的真理由 | `docs/core/design/ADVISOR-GUARDS.md:468-480`；`test/RTM.md:69`（节注回指 F18 + 四态）· `:73`（6-1 补锚态）· `:76`（6-4 新行） |
| ② | 🔴 | 去 docRoot 双说法：§8 定位句与 AC-M6-3 改「项目内现存 .md，判据单源 = 设计档 §12」；F3 的解析复述压成指针（D2） | `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md:116` · `:124` · `:134` |
| ③ | 🟡 | 补「受影响文件与行数增量」表（面 / 文件 / 现量 / 变更 / 编辑点 / 预算）；删 §2.4 的死指针「受影响表 / AC 收正版同源」——该表本档不存在，重指会指错面 | `docs/core/design/ADVISOR-GUARDS.md:454-466`（表）· `:100`（死指针） |
| ④ | 🟡 | 行数重测：`manifest.mjs` 现量 299（读盘 300）；行 49 收正为已落 + 现量；行 38 ∥ 44 标注「落成时读数，现量见行 49」；Δ 上界与 300 软线判定重写（余量 1 行 ⇒ 下一笔须带拆分方案或 `SOFT_LINE_REGISTRY` 登记） | `docs/core/design/MANIFEST.md:204` · `:210` · `:215` · `:253-254` |
| ⑤ | 🟡 | 补最相近先例行：先例 = 四分支解析器（`thincoder-core/agent-tools/review-facts.mjs:72`）∥ 候选底座（`:148`）∥ 批 #921；对齐 = 同一函数 / 同一返回形两段；偏差 = 试探面与 `scope-doc-ambiguous` 整条删除 | `docs/core/design/ADVISOR-GUARDS.md:428-430` |
| ⑥ | 🟡 | 补公开源核查行：`PROJECT-MANIFEST.json` 的 `index.publicRepos` = `[]` ⇒ 无公开源档可查，已查无 | `docs/core/design/ADVISOR-GUARDS.md:432` |
| ⑦ | 🟡 | 点名返回形消费点：`thincoder-core/agent-tools/advisor.mjs:120-146` 三处改动 + 旧 `:135` 读 `v.attempted.length` 在新形下抛 TypeError；异步面零改；A-AG21 零残留清单补 `attempted` | `docs/core/design/ADVISOR-GUARDS.md:446-448` · `:410` |
| ⑧ | 🔵 | **未落——上抛主 agent**：需求档不在设计席写域。待改一行 = `docs/core/requirements/ADVISOR-CONVERGENCE.md:4` 枚举补 F18（F18 正文已在 `:48`，仅头部枚举漏） | 待主 agent 落 |
| ⑨ | 🔵 | as-of 坐标重测：`object.type` `:69`→`:49`；判定点 `:110`→`:90`（拒发返回 `:93`）；`object` `:66`→`:46`、描述 `:47`→`:55`；头注加「行号一律 as-of 参考」口径句 | `docs/core/design/ADVISOR-GUARDS.md:7` · `:67` · `:70` · `:101` |

**文档机检门读数**：本席四档（两设计档 ∥ 令牌结算档 ∥ `test/RTM.md`）跑 `doc_check` 门 = PASS，读数见本轮回执。

**批档整档读数**：命中 28 条，全部落在 §1 ∥ §3 他人段——裸文件名指针 27 条 + §3 一段 445 字符。本席不改他人段（一段一作者）；本段新增文本零命中。

**未改（父侧驳回）**：§9 估算加权与需求「不改 estimateTokens 估算式」不冲突——§9 复用 `thincoder-core/advisor/compaction.mjs` 侧加权版，需求禁的是主循环 `thincoder-core/token-window.mjs` 那个。

### 修正轮 3（评审 #4 的 1🔴 5🟡 2🔵 + 用户提的集成用例缺口——9 条全落）

> 口径：只落「评审发现 + 父侧裁决」直接导出的修正；机制语义（§12 五分支 / 拒因三值 / 受理面）零改；实现代码零碰。行号 = 本轮实测。

| # | 级别 | 改动 | 落点 |
|---|---|---|---|
| ① | 🔴 | T78 ③ 期望改「当场拒发（`criterion=scope-not-doc` + `reason=no-project-root` + 期望形）」，「五者皆不停手」改「①②④⑤ 不停手，③ 按新规则当场拒发」；受影响表 MANIFEST 行注明含 T78 ③ 这一笔 | `docs/core/design/MANIFEST.md:1188` · `docs/core/design/ADVISOR-GUARDS.md:474` |
| ② | 🟡 | `:584` 括注「（评审门）」→「（写门面——评审受理不再消费）」+ 挂 §2.5 条指针；同笔扫 `:487`（行 2 增「本行口径仅限 docRoot 值形态批」半句）∥ `:705`（「评审根」→「写门评审根」） | `docs/core/design/MANIFEST.md:584` · `:487` · `:705` |
| ③ | 🟡 | 删 §5 不立行理由里的非标准从句「该面自身无 RTM 故事，属既有覆盖空缺，不在本批范围」 | `docs/core/design/ADVISOR-GUARDS.md:492` |
| ④ | 🟡 | A-AG21 零命中面改 `\.attempted\b`（属性访问形）+ 写出可重跑口径命令 | `docs/core/design/ADVISOR-GUARDS.md:410` · `:460` |
| ⑤ | 🟡 | criterion ∥ reason 分层统一：拒因三值段声明「标识行恒 `criterion=scope-not-doc`，三值只作 `reason=`」；A-AG19 / A-AG20 / 6-2 / 6-3 / 6-4 同形 | `docs/core/design/ADVISOR-GUARDS.md:408-409` · `:442` · `:485-487` |
| ⑥ | 🟡 | 补拒因命名三问：`no-project-root` vs `'no-project'` = 有意区分；`outside-project` / `not-doc-file` = none found | `docs/core/design/ADVISOR-GUARDS.md:444-446` |
| ⑦ | 🔵 | 两套「三处」合并为一张编辑点表（5 行：`:62-66` schema 描述 · `:114-119` 注释块重写 · `:121` 解构 · `:124-130` 删歧义分支 · `:133-141` 诊断尾），删正文「三处」计数 | `docs/core/design/ADVISOR-GUARDS.md:448-460` |
| ⑧ | 🔵 | 分支 3 依据挂 F18「绝对形照用 + 跨项目走绝对形」；分支 4 / 5 依据引 F18 边界句 / 判定句 | `docs/core/design/ADVISOR-GUARDS.md:438-440` |
| ⑨ | 用户提 | 补「用例设计（实现面）」节：夹具 / 驱动面 / 断言点逐条（6-1…6-4 + 6-4 反证格），写明不用 `_setProjectRootForTest` / `_setLedgerDirForTest` 的理由；驱动 = 工具层 `advisorTool.execute` + 假 SSE 端点（先例 = `test/integration/advisor-timeout-hot.test.mjs:27-87`） | `docs/core/design/ADVISOR-GUARDS.md:496-509` |

**文档机检门读数**：两设计档 `doc_check` 门首跑 REFUSED 2 条（段 314 / 669 字符），同轮拆分后复跑见下。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Integration-test design | 🔴 | None of the three design docs in scope carries an integration-test design section anchored on `test/RTM.md` (zero hits for RTM/集成 in `docs/core/design/ADVISOR-GUARDS.md` and `docs/core/requirements/ADVISOR-CONVERGENCE.md`). The change does touch a component interaction and a business-observable result: `test/RTM.md:66` already carries story §6「设计评审的文档范围按项目根受理」 with rows 6-1–6-3 (`test/RTM.md:73`–`:75`) whose 节注 (`test/RTM.md:69`) 回指 `docs/core/design/ADVISOR-GUARDS.md §12（A-AG19 ∥ A-AG20）`. MANIFEST.md's stated exemption (`docs/core/design/MANIFEST.md:877`「无该入口」) is not one of the permissible reasons. Missing delta answer: §12 branch 2 (`ADVISOR-GUARDS.md:430`, `no-project-root`) has no RTM row, and neither §2.4 type gate nor §5 freeze window has one. | Add a section in `ADVISOR-GUARDS.md` that starts from `test/RTM.md` and answers the delta: which rows break (6-1 presupposes the session cwd sits inside the project — under a `workspace` anchor `ADVISOR-GUARDS.md:430` refuses every relative form), which are redundant, which are missing. Fix the missing number in `test/RTM.md` before the case title (`test('6-4 …')` for `no-project-root`: cwd = workspace anchor, `documents` = project-root-relative `.md` ⇒ `criterion=scope-not-doc` + reason `no-project-root`), and per row name the interaction, the business result, the entry, and the traced business requirement (F18). |
| 2 | Document ownership | 🔴 | One mechanism (评审对象来源 / 受理面) is told two ways inside live design docs: `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md:116`「唯一变更 = **评审对象来源改读 manifest `docRoot`**（去硬编码 `docs/`）。」 and `:133` AC-M6-3「评审对象 / 被审文件路径读 `docRoot`（grep 硬编码 `docs/` → 零命中）」 versus `:124` F3「`docRoot` 不再充当受理边界」 and `ADVISOR-GUARDS.md:439`「`docRoot` 五键不再充当评审受理边界」. Following AC-M6-3, an implementer verifies a mechanism that no longer exists. | 收正 line 116 and AC-M6-3 to the single rule (delete the "读 docRoot" wording; point at `ADVISOR-GUARDS.md` §12 as the one authority), and reduce F3's restatement of the resolution rules to a pointer (D2 single authority). |
| 3 | Affected-file size annotations | 🟡 | `ADVISOR-GUARDS.md:99` refers to an「受影响表」 that does not exist in the document — no current line count / `≤±N` for any file the design changes: `thincoder-core/agent-tools/review-facts.mjs` (159 lines today; §12 rewrites `resolveReviewDocPaths`), `thincoder-core/agent-tools/advisor.mjs` (277; §2.4 plus the design-review refusal block `:120`–`:146`), `thincoder-core/agent-tools/advisor-async.mjs` (exactly **500** lines — the advisory line; `ADVISOR-GUARDS.md:441` says 零新增代码 for `docAbs`, which should stand as the stated Δ). Sibling doc `MANIFEST.md` §2.3 carries such a table, so the project norm exists. | Add the affected-files table (current lines / 变更 / 编辑点 / `≤±N`) for every `.mjs` and test file, with an explicit "Δ=0 / 零新增代码" or split statement for the 500-line `advisor-async.mjs`, and make `:99`'s cross-reference resolve. |
| 4 | Affected-file spot-check | 🟡 | `MANIFEST.md` numbers are stale against disk: `MANIFEST.md:215` (row 49) gives `thincoder-core/manifest.mjs` **272**, rows `:204`/`:210` give **249**, the file is **300** lines now. The derived tier judgement `MANIFEST.md:254`「行 48 ∥ 49 未触线（增量后峰值 ≤279——<300）」 and its base `MANIFEST.md:253`「≤ +28（251 ⇒ ≤279）」 are therefore invalid — the file already sits at the 300 soft line and +28 crosses it. | Re-measure at design time (`\n` count), restate the row, the Δ bound and the >300 soft-line decision for `manifest.mjs`; keep one base per row so table and note cannot drift apart. |
| 5 | Closest precedent | 🟡 | No closest-precedent line in `ADVISOR-GUARDS.md` (zero hits for 最相近先例) or `MANIFEST.md`; only `DESIGN-TOKEN-SETTLEMENT.md:157` carries one (for §9 F-SL1). The precedent for §12 sits in the code §12 deletes: the four-leg resolver `thincoder-core/agent-tools/review-facts.mjs:72` + `candidateRoots` `:148`. | Add the line: precedent coordinates (impl `review-facts.mjs:72` ∥ design section `ADVISOR-GUARDS.md` §12 ∥ precedent batch per `review-facts.mjs:6` #921) plus explicit deviation rationale (probing legs ③④ and `scope-doc-ambiguous` deleted because the user required exact path writing). |
| 6 | Survey evidence | 🟡 | No survey-evidence line in `ADVISOR-GUARDS.md` / `MANIFEST.md`; `DESIGN-TOKEN-SETTLEMENT.md:158` records it for F-SL1 only (「`index.publicRepos` = 空 ⇒ 无公开源档可查」). | Record the line for this change — which public source docs were checked, and "none relevant" if that is the answer. |
| 7 | Clarity / affected surface | 🟡 | §12 changes the return shape to `{ resolved, invalid: Array<{doc, resolved, reason}> }` (`ADVISOR-GUARDS.md:437`) yet names no edit point for its consumers: `thincoder-core/agent-tools/advisor.mjs:121` destructures `ambiguous, candidates` and `:135` reads `v.attempted.length` — under the new shape that throws; A-AG21's zero-residual grep list (`ADVISOR-GUARDS.md:409`) holds `candidateRoots` / `sessionReviewRoots` / `scope-doc-ambiguous` only, so the leftovers would not be caught. | Name `advisor.mjs:120`–`:146` as an edit point (delete the ambiguity branch, render per-document「解析后绝对路径 ∥ 拒因」+ 期望形), and add `ambiguous` / `attempted` to A-AG21's zero-residual list. |
| 8 | Requirements fit | 🟡 | Cross-layer lag on the token-estimate change: `ADVISOR-GUARDS.md:378` makes the budget guard's 内容项 use the weighted estimate, while the requirement it traces to still puts that correction out of scope — `docs/core/requirements/ADVISOR-CONVERGENCE.md:128`「不改 `estimateTokens` 估算式」 and `:131`「修正另批（登记）」. | Decide which face is authoritative and align the other: either state in §9 that this batch delivers the registered correction (and update F27's boundary / 登记面), or scope §9 out — one live wording for one mechanism. |
| 9 | Doc hygiene | 🔵 | Requirements header enumeration is short: `ADVISOR-CONVERGENCE.md:4`「（F1 · F4–F17 · F27–F35 判定句 + N1–N11 · N19–N22）」 omits **F18**, which the doc carries at `:48` (F30 / F31 in §9 are covered only numerically by the F27–F35 span). | Add F18 to the header enumeration (D3: 计数与枚举同改). |
| 10 | Evidence drift | 🔵 | as-of coordinates in §2.4 do not match the file: `ADVISOR-GUARDS.md:66` places `object.type` at `advisor.mjs:69`, and `:100` places `object` at `:66` / 描述 at `:47`; today `object` is `:46`, `object.type` `:49`, its description `:55`. `ADVISOR-GUARDS.md:69` points the new type gate at `advisor.mjs:110`, which today sits inside the scope-missing refusal. | Re-measure the coordinates at implementation and add the project's as-of caveat (D4) to this document's header so line references read as indicative. |

Limitations of this review round: no project standards document is provided (methodology compliance judged from `AGENTS.md` only); the document map is not in the declared roots, but `thincoder/docs/README.md:77`–`:80` does index these four documents in their owning roles, so no fragmentation was found. F32 / F33's design face lives in `docs/core/design/ADVISOR-CONVERGENCE.md`, which is not in this review scope — their coverage is unverified.

VERDICT: changes-required
counts: 🔴 2 · 🟡 6 · 🔵 2

### 轮次 2（评审子代理）

### 评审范围：`ADVISOR-GUARDS.md` §12 ∥ `MANIFEST.md` ∥ `DESIGN-TOKEN-SETTLEMENT.md` §8 ∥ `requirements/ADVISOR-CONVERGENCE.md` F18（修正轮核验）

计数：1🔴 / 5🟡 / 2🔵

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Document ownership（机制两处描述相左） | 🔴 | 同一机制（workspace 锚下「评审 documents 相对形」怎么走）两处相反：`ADVISOR-GUARDS.md:437`「`projectRootView` = `workspace` / `none` ⇒ 拒（`no-project-root`，文案报锚态 + 期望形）」+ `:475`「workspace 锚 + 项目根相对形 ⇒ 当场拒发（`no-project-root`）」；而 `MANIFEST.md:1188`（T78 ③，夹具恰为 `d:\teamcode` = workspace 锚）判「③ 评审 documents（`docs/core/design/MANIFEST.md` 相对形）」属「五者**皆不停手**：①②③④⑤ 各自解析到 `thincoder`」。同批受影响文件表却声明 MANIFEST.md「已落（行内改写，Δ = 0）」（`ADVISOR-GUARDS.md:462`）——该行未随动。 | 择一落地：①T78 ③ 改期望 `no-project-root` 拒发，「皆不停手」括注改「①②④⑤」；②或保留「解析到 thincoder」则行内写明显式项目 `cwd`（夹具给两个 cwd），与 6-4 判据措辞对上。并把该行登记进 §12 的破行清单。 |
| 2 | Document ownership（状态滞后） | 🟡 | `MANIFEST.md:584`「`write-gate.resolveReviewRootsFor`（评审门）」与同档 `:324`「保留为写门面（评审受理不再消费）」、`ADVISOR-GUARDS.md:450`「评审受理不再消费」相左；另 `MANIFEST.md:487` 行 2 对 `advisor.mjs:135-142` 判「**零改**（分类判据与值形态无关）」，而 §12 正删 `:124-130`、改 `:133-141`（`ADVISOR-GUARDS.md:446`）。 | 584 改「（写门面）」并挂 §2.5 条指针；487 行加半句「本行口径仅限 docRoot 值形态批；评审受理面改动见 `ADVISOR-GUARDS.md` §12」；顺带扫 `:705`「评审根静默错」同族措辞。 |
| 3 | Integration-test design | 🟡 | §5 不立行的理由含非标准依据：`ADVISOR-GUARDS.md:480`「判据 / 文案 / 业务可观察结果均不改——放宽受理的文档只是进入既有冻结面，故不新立行（该面自身无 RTM 故事，属既有覆盖空缺，不在本批范围）」；同句已承认新受理文档进入冻结面（`:452`「放宽受理的文档**同受 D5 冻结**」）。 | 二择一：①补 6-5（解析 ⟷ 写入预闸：`docRoot` 树外 `.md` 在途期间父侧写 ⇒ 冻结拒绝串，四项齐）；②维持不立行则只留标准依据句，删「属既有覆盖空缺，不在本批范围」。 |
| 4 | Acceptance verifiability | 🟡 | `ADVISOR-GUARDS.md:410` 零命中面把裸英文词 `attempted` 扩到整棵 `thincoder-core/**`，真正要排除的只是返回形属性（`:448`「旧 `:135` 读 `v.attempted.length`」）；未钉 grep 形态 ⇒ 判据精度不可复核（该树命中情况本次未读 = `unverified`）。 | 钉成 `\.attempted\b`（属性访问形）或钉到 `review-facts.mjs` / `advisor.mjs` 两档，并写出可重跑口径命令。 |
| 5 | Clarity（判据名 ∥ 拒因分层） | 🟡 | 拒回落字样两套词表混用：`:409`「项目外 / 非 `.md` / 不存在 ⇒ `scope-not-doc` 拒」vs `:408`「`..` 越根 ⇒ `outside-project` 拒」∥ `:474`「项目外绝对路径 ⇒ 当场拒发（`outside-project`）」；而 `:110` 的 `criterion` 枚举闭合六名（无 `outside-project`）⇒ 可被落成 `criterion=outside-project`。 | 统一写成「标识行 `criterion=scope-not-doc` ∥ `reason=<拒因>`」，拒因三值只作 reason；6-3 / 6-4 的行文同形。 |
| 6 | Existing-piece check | 🟡 | 三个新拒因名（`:442`「`no-project-root`（相对形 ∧ 项目根解析不出）· `outside-project`（相对形越根 ∥ 绝对形不住在任何项目里）· `not-doc-file`（非现存普通文件 ∥ 非 `.md`）」）无三问答；仓内已有近名 code（`MANIFEST.md:121` 的「`'missing' \| 'invalid' \| 'no-project' \| 'workspace' \| 'init-failed'`」）——有意区分 ∥ 平行新名未说。 | §12 补一行三问：`no-project-root` vs `no-project` = 有意区分（会话锚无项目根 ∥ 决策树无项目）；`outside-project` / `not-doc-file` 各给「none found」。 |
| 7 | Clarity（编辑点枚举） | 🔵 | 两套「三处」不对齐：`:446` 列 `:121` ∥ `:124-130` ∥ `:133-141`，`:459` 列 `:62-66` · `:114-119` · `:120-146`；`:114-119` 正文无说明。 | 合并为一张编辑点清单（含 `:62-66` schema 描述与 `:114-119` 动作），删正文「三处」计数。 |
| 8 | Branch provenance | 🔵 | 分支 3 依据只写「同上；绝对形自带基面」（`:438`），分支 4/5 依据为判据语义复述；分支 1/2 有真实场景（用户原话 ∥ `manifest read` 读数 `state=workspace`）。 | 分支 3 挂 F18「跨项目走绝对形」原句；分支 4/5 引 `ADVISOR-CONVERGENCE.md:48` 范围边界句作场景。 |

行数核查（口径 8 抽检，仅档内可读者）：`ADVISOR-GUARDS.md` 482（读盘 483）· `MANIFEST.md` 1198（读盘 1199）· `DESIGN-TOKEN-SETTLEMENT.md` 264（读盘 265）——与档内「现量 = `\n` 计数、读盘 = 现量 +1」口径自洽；源档三行（158 / 276 / 499）与 `test/RTM.md` 107 未读（评审范围外）= `unverified`。行数表齐备（每档现量 + Δ 或「结构不变 / 零改」），无档越 500/800 档位，不涉拆分方案。

已核达标面：最相近先例行在位（`:428-430`，对齐 + 偏差理由指名先例与用户原话）· 公开源核查行在位（`:432`，`index.publicRepos = []` ⇒ 无公开源档，已查无）· 集成验收段以 `test/RTM.md` 故事 6 为起点并给 delta 三答（破行 / 冗余 / 缺失）· 编号先落 RTM 再写用例标题 · 需求 F18 与 §12 逐项对位（相对形 ∥ 绝对形 ∥ 受理面 ∥ 三种拒 ∥ 不改 `resolveBatchDocPath`）。

审核限制：项目未提供文档地图（自动化扫描未发现），归属判据按档内自述指针（`DOC-SYSTEM.md` §5.1/§6 · D2 单源纪律）评估；无项目标准文档。

VERDICT: changes-required

**计数：1🔴 / 5🟡 / 2🔵**

### 轮次 3（评审子代理）

### 修正轮 2 核验表（设计评审 · 文档范围 #1784）

前一轮 1🔴 5🟡 2🔵 + 用户提的用例设计缺口（第 9 条）——逐条按本轮 read 核验：

| # | Orig# | File | Severity | Status | Notes |
|---|---|---|---|---|---|
| 1 | 1 | ADVISOR-GUARDS.md / MANIFEST.md | 🔴 | Fixed | T78 ③ 已改为「③ **当场拒发**——workspace 锚下相对形无基面 ⇒ `criterion=scope-not-doc` + `reason=no-project-root` + 期望形两句，零评审实例」（MANIFEST.md:1188），「①②④⑤ **不停手**」与 §12 分支 2（ADVISOR-GUARDS.md:437）· 6-4（:489）三方一致；受影响文件表 :476 已登记该格 |
| 2 | 2 | MANIFEST.md:584 / :487 | 🟡 | Fixed | :584 已改「`write-gate.resolveReviewRootsFor`（写门面——评审受理不再消费，判据见 §2.5 条「advisor 评审门文档受理」）」；:487 加限定句「本行口径仅限 `docRoot` 值形态批……评审受理面的改动见 `docs/core/design/ADVISOR-GUARDS.md` §12」；`:705` 现为「写门评审根」= 已归属写门，sweep 到位 |
| 3 | 3 | ADVISOR-GUARDS.md:494 | 🟡 | Fixed | 「属既有覆盖空缺，不在本批范围」已删；现只留标准依据「§5 冻结窗本批零新增代码（`docAbs` 取同一 `resolved`），判据 / 文案 / 业务可观察结果均不改——放宽受理的文档只是进入既有冻结面，故不新立行」 |
| 4 | 4 | ADVISOR-GUARDS.md:410 / :462 | 🟡 | Fixed | A-AG21 改为「返回形属性访问 `\.attempted\b` 零命中（口径命令见 §12「消费点与编辑点」）」；:462 给出可重跑命令 |
| 5 | 5 | ADVISOR-GUARDS.md:408-410 / :442 / :487-489 | 🟡 | Fixed | 分层已统一：:442「标识行恒 `criterion=scope-not-doc`——三值只作 `reason=`，不进 criterion 枚举」；:110 闭合六名未破；6-2/6-3/6-4 均为「`criterion=scope-not-doc` ∥ `reason=<拒因>`」 |
| 6 | 6 | ADVISOR-GUARDS.md:444-446 | 🟡 | Fixed | 「拒因命名三问」在位：`no-project-root` vs `'no-project'` = 有意区分；`outside-project` / `not-doc-file` = none found |
| 7 | 7 | ADVISOR-GUARDS.md:450-460 | 🔵 | Fixed | 编辑点合为单表 #1–#5（`:62-66` ∥ `:114-119` ∥ `:121` ∥ `:124-130` ∥ `:133-141`）+ 异步面零改说明；受影响文件行 `:62-66 · :114-119 · :120-146` 为其粗粒度超集，无二说 |
| 8 | 8 | ADVISOR-GUARDS.md:438-440 | 🔵 | Fixed | 分支 3 依据改挂 F18「绝对形照用」+ 范围边界句；分支 4/5 亦各挂 F18 原句，不再是「同上」 |
| 9 | 9（用户提） | ADVISOR-GUARDS.md:496-511 | 🟡 | Fixed | 新增「用例设计（实现面）」段：夹具/驱动共一套（`mkdtempSync` + `node:http` 假 SSE 端点 + 最小 `agent`）、驱动面签名、停用的两个测试缝及理由、6-1…6-4 逐例夹具/驱动/断言点表、6-4 反证格 |
| 10 | (new) | ADVISOR-GUARDS.md:475 | 🔵 | New: 现量数字漂移 | 该行仍写「`docs/core/design/ADVISOR-GUARDS.md` \| 482 \| … \| 已落（本轮 +39）」，本档现为 512 行（按该表 :468 自述口径 现量 = 511）；本轮新增的用例设计段未计入。R7c 数字漂移 |
| 11 | (new) | ADVISOR-GUARDS.md:508 | 🔵 | New: 夹具脆弱 | 6-3 只断言「临时根 `outside/x.md`（无 manifest / 无 `.git`）」，但分支 4 ③ 判据 `owningProject(p)` 上溯不设上界（`MANIFEST.md:104`「**上溯不设上界**：一路到盘根」）⇒ `tmpdir()` 任一祖先带档即假红；建议夹具内加一条前置断言（`owningProject(<临时根>) === null`） |
| 12 | (new) | ADVISOR-GUARDS.md:506 | 🔵 | New: 断言点弱化 | 6-1 断言点 ② 「请求体含该文档条目或解析后路径」为析取式——钉成单一形（如请求体含解析后绝对路径）方可判「评审读得到」 |

计数：前轮 9 项全部 Fixed（1🔴 5🟡 2🔵 + 用户第 9 条）、新增 3 🔵（0🔴 / 0🟡）。

VERDICT: pass

## §4 用户批准（主 agent）

**状态行**：已批准 2026-10-25（用户原话「批准」——批准即实施启动，FR32）

**批准范围**：§12 全件——路径解析单一规则（相对按会话项目根 ∥ 绝对照用 ∥ 解不出拒并报期望形）· 受理面放宽到项目内现存 `.md` · 探测试探/祖链链/歧义归一退场 · `review-facts.mjs` 重写 + `advisor.mjs` 删歧义分支 + `advisor-async.mjs` 零改 · 四档文档随正 + RTM 故事 6 四行。

## §5 实施记录（eng-coder）
**状态行**：✅ 实施完成（内部审计 1 轮（0🔴）· 代码评审 1 轮 pass · 自修 2 轮 · 终态 clean）



### 1. 交付摘要

`resolveReviewDocPaths` 收为**单规则**：相对形按会话项目根解析（越根 ⇒ 拒）· 绝对形照用 · 受理 = 项目内现存 `.md`；候选试探 ∥ 祖链链试探 ∥ 歧义归一整条退场（判据正文 = `docs/core/design/ADVISOR-GUARDS.md` §12）。`advisor.mjs` 的范围拒发改按新返回形渲染：逐文档「输入 → 解析后绝对路径 ∥ `reason=<三值>`」+ 锚态（仅 `no-project-root`）+ 期望形两句。

### 2. 交付表（逐条回指 §2 §1 需求点 / §2 §5 验收）

| # | 状态 | 需求点 / 验收 | 落点与读数 |
|---|---|---|---|
| R1 | ✅ 完成 | 相对按项目根 ∥ 绝对照用 ∥ 解析不出拒并报期望形；删会话根集 ∥ 祖链链 ∥ 歧义归一 | `thincoder-core/agent-tools/review-facts.mjs` 158 → 112 行；单规则五分支在 `:80-95` |
| R2 | ✅ 完成 | 收面放宽：仓根级文档与 `docRoot` 树外仓内文档一并受理 | `isDocFile`（`review-facts.mjs:57-59`）；`REVIEW_ROOT_KEYS` / `resolveReviewRootsFor` 保留为写门面（`:32-49`） |
| AC-1 | ✅ 完成 | 子目录锚仍落到项目根下的目标 | 单测 U2 |
| AC-2 | ✅ 完成 | 绝对形照用；项目外绝对路径 ⇒ `outside-project` + 期望形 | 单测 U3 / U4 · 集成 6-3 |
| AC-3 | ✅ 完成 | workspace / none 锚 ∧ 相对形 ⇒ `no-project-root`（报锚态 + 期望形） | 单测 U7 · 集成 6-4（含反证格） |
| AC-4 | ✅ 完成 | 仓根 `.md` 与 `docRoot` 树外仓内文档受理 | 单测 U1 · 集成 6-1（真仓 `thincoder-core/tool-docs/advisor.md`；假端点如实收 1 个请求） |
| AC-5 | ✅ 完成 | 项目内非 `.md` ⇒ `not-doc-file`；零实例 ∥ 零 token ∥ 零 LLM | 单测 U5 / U6 · 集成 6-2 |
| AC-6 | ✅ 完成 | 零试探残留 | 同 A-AG21 口径 grep（见本节 §5 读数）⇒ 零命中 |
| AC-7 | ✅ 完成 | 冻结窗同源 | `thincoder-core/agent-tools/advisor-async.mjs:398-400` 零改；单测 U10 经 `inflightDesignReviewConflict` 命中 |
| §2 §3.1–3.5 | ✅ 完成 | 解析重写 / 删除面 / 消费面 / 冻结窗同源 / 判据退场 | `advisor.mjs` 276 → 260 行；`scope-doc-ambiguous` 全树零命中 |
| §2 §6 U1–U10 | ✅ 完成 | 单测档（收口即删） | 读数见本节 §5（10 pass / 0 fail） |
| §2 §4 集成三行（本批落四行 6-1…6-4） | ✅ 完成 | 集成用例 | 读数见本节 §5（4 pass / 0 fail） |

### 3. 决策披露（越出清单 ∥ 本席自决 ∥ 未决）

**越出清单 1 处**：`thincoder-core/tool-docs/advisor.md`。理由：该档是 `DESC("advisor")` 的描述单源，原文仍写着已删除的「会话 cwd 试探 + 候选项目根 + 祖先目录」——不改就留下一条与实现相反的模型面指令（同一规则两个说法）。语义零新增：规则换成 §12 的单向写法，同档段落按 300 字机检阈值拆段（门的读数要求，内容逐句保留）。

**本席自决 2 处**（机械后果，非语义选择）：① `advisor.mjs` 新增 `projectRootView` import——拒发文案要报锚态，用解析器同一个判定函数（不另立读法）；② 删 `normAbs` import——唯一用点随旧诊断尾整段退场，留着即死引用。

**未决 3 条（🔵，不擅自加判据 ∥ 改返回形）**：① 非数组 `documents`（畸形工具参数）会在 `review-facts.mjs:84` 抛 TypeError 而非拒发——旧实装同形，非本批引入；补守卫要新立拒因，属判据面变更，待裁。② 模型面（该工具档 ∥ schema 描述）未写「相对形要求会话锚为项目」半句——workspace 锚下模型会先吃一次拒发再改绝对形。③ 拒发路径二次读 `projectRootView`——收掉需给返回形加锚态字段，而 §12 返回形定为 `{resolved, invalid}`。

### 4. 审计与评审轮次（终态 clean）

| 轮 | 面 | 读数 | 处置 |
|---|---|---|---|
| 内部 explore 分歧审计 | 代码 ↔ §2 任务书 ↔ §12 判据 | 0🔴 3🟡 2🔵 | 落 1：6-3 补期望形两句断言（§12 用例设计「同 6-2 形态」）；其余 = 本段披露项 ∥ 设计档漂移（交设计席） |
| 内部 advisor 代码评审（type=code） | 五个受审文件 | VERDICT pass（0🔴 2🟡 4🔵） | 落 1：6-3 / 6-4 补「零评审实例」断言（RTM 6-3 / 6-4 的验收点原只计数模型请求）；1🟡 = 读数入本段 + 父侧 RTM 收口；4🔵 = 上抛（见本节 §3 未决） |

**自修轮次**：2（均在测试断言面，机制语义零改）。**终态**：clean（无 🔴 未决）。

### 5. 执行读数（本席实跑）

- 单测档：`node --test docs/batches/2026-10-25-review-scope-widen.test.mjs` ⇒ tests 10 · pass 10 · fail 0 · ≈0.39s
- 集成档：`node --test test/integration/review-doc-scope.test.mjs` ⇒ tests 4 · pass 4 · fail 0 · ≈0.44s（6-1 实跑一次真仓设计评审，假端点收 1 请求）
- 零残留口径（A-AG21 同形）：`grep -RInE 'candidateRoots|sessionRoots|sessionReviewRoots|scope-doc-ambiguous|\.attempted\b' thincoder-core --include=*.mjs` ⇒ 零命中
- 行数：`review-facts.mjs` 112（预算 ≤130）· `advisor.mjs` 260（预算 ≤260）
- 文档机检门：`doc_check(mode:"gate", target=D:\teamcode\thincoder)` ⇒ `DOC-CHECK GATE: PASS`（1 档全清）

### 6. 设计档漂移（本席不改设计档——交设计席 ∥ 父侧）

① `docs/core/design/ADVISOR-GUARDS.md` 的「受影响文件与行数增量」表缺 `thincoder-core/tool-docs/advisor.md` 一行（该档是 `DESC` 单源，本批必须随正）。② 同表 `advisor.mjs` 预算写「改后 ≤258」，实落 260——与 §2 §4 的「≤260」两处口径择一收正。

### 7. 给父侧的操作提示

本会话锚 = `D:\teamcode`，`projectRootView` 读数 = `{"state":"workspace","root":null,"candidates":["D:\\teamcode\\thincoder","D:\\teamcode\\thincoder.com"]}` ⇒ 自此本会话发起设计评审时，`documents` 必须写绝对路径；相对形会按分支 2 当场拒发（正是 `docs/core/design/MANIFEST.md` T78 ③ 已收正的期望）。`test/RTM.md` 6-1…6-4 结果列仍「待执行」——父侧收口跑后填，本席实跑读数为 4 pass。

## §6 验证与收口（父代理）

## 验证与收口

**父侧亲跑**：

| 判据 | 读数 |
|---|---|
| 集成 6-1…6-4 | `node --test test/integration/review-doc-scope.test.mjs` ⇒ tests 4 · pass 4 · fail 0（亲跑 12:27） |
| 单测 U1–U10 | 10/10 绿（实施席实测） |
| 零试探残留 | `grep -RInE 'candidateRoots\|sessionReviewRoots\|scope-doc-ambiguous\|\.attempted\b' thincoder-core --include=*.mjs` ⇒ 零命中 |
| 行数 | `review-facts.mjs` 158→112 · `advisor.mjs` 276→260（≤260 达标） |
| doc_check | 四档设计/需求 + `tool-docs/advisor.md` 全 0 命中（亲跑） |

**评审批次**：三轮（#2 2🔴6🟡2🔵 → #4 1🔴5🟡2🔵 → #6 pass 3🔵）；裁决：驳回 1 条（§9 加权估算——评审误把「复用 `advisor/compaction.mjs:49` 加权版」读成「改主循环 `token-window.mjs:17`」），其余全修。

**清单外改动（追认）**：`thincoder-core/tool-docs/advisor.md`——描述单源里仍写着已删的「cwd 试探 + 候选项目根 + 祖先目录」，不改就是与实现相反的模型面指令；已追认并补「相对形要求会话锚在项目内」半句。

**设计档随正**：受影响文件表补 `tool-docs/advisor.md` 行；`advisor.mjs` 预算改「净 ≈ −16（实落 260）」。

**遗留（不修，记账）**：① 非数组 `documents` 抛 TypeError 而非拒发（旧实装同形，补守卫属判据面变更）；② 拒发路径二次读 `projectRootView`（收掉需给返回形加锚态字段）。

**测试行**：① 本批单测档 `docs/batches/2026-10-25-review-scope-widen.test.mjs`（U1–U10，10/10，收口删除）· ② 集成集现量 **19 例 / 窗口 50–100**（本批 +4：6-1…6-4），落 `test/integration/review-doc-scope.test.mjs`。

**核销**：#1784 · 并回帖关闭 GitHub #27。
