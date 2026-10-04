# 2026-10-04 · 文档清账轮（悬空残引扫面 ∥ 档注标记法 ∥ §5 落点指针 ∥ 桥面明书）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-04 · 来源 = 用户 2026-10-04 21:26「两个都点火」（台账 #885 ∥ #901 ∥ #904 ∥ #908 · 文档清账轮）。
> 台账 = #885 ∥ #901 ∥ #904 ∥ #908（core · 归批）。前情 = 无（独立批——承 #904 闸扩面实测 ∥ #901 标记法定形 ∥ #885 指针债 ∥ #908 桥面明书）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（设计轮已派）
**开批登记（2026-10-04 21:2x · 主 agent）**：**来源** = 用户 21:26「两个都点火」（① responses 健壮性批 ② 文档清账轮——本档 = ②）。

**条目四件（台账 #885 ∥ #901 ∥ #904 ∥ #908）**：
- **#904**：doc-check 锚闸漏网（双扩展段文件名不判锚）——现存量 607 悬空不可闸；处置 = 先清账后开闸（`docs/**` 残引扫面 + 标记法沿用 #901 定形「已随 2026-09-28 测试树全清退场——档不在盘」；`docs/batches/**` = 历史引文豁免不入闸）。
- **#901**：LEDGER.md 用例档注「在位」失真三处已改（：207∥:414∥:421）——本批扫面 = 全类同族他档残引（EDIT.md 两处已改；余面待扫）。
- **#885**：设计档 §5 落点指针 2026-10-0x 系列落批（各批同缺——随本清账轮逐档补）。
- **#908**：ACP 桥批量回执无汇总行——倾向「明书不适用」（EDIT.md/桥面设计档补一句）；候选小笔可并入。

**授权口径** = 全链（同上）；**边界** = 只动文档面（`docs/**`）；产品码 ∥ 机检脚本零触（#904 闸扩面代码 = 另轮，本批只清账）；批次档历史引文豁免（冻结语义）。

**授权（2026-10-04 21:47 · 用户「三个任务都自动跑完吧」）**：本批全链自动——评审点火 ∥ §4 代签（三条件照仓例）∥ 修正/实施轮派发 ∥ 收口核销提交双推；自缚三条照旧。需求档面 ≈15 条残引（D1 主 agent 笔）= 实施轮父侧随手落。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成 2026-10-04（四件全设计：#904/#901 三式清账（F 口径 774→0）∥ #885 指针 122 配对 ∥ #908 明书 ∥ 开闸另轮——待评审）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**状态行**：🔄 设计轮 §2 已落（eng-designer · 2026-10-04 21:2x——待评审）

**条目覆盖（四件）**

| 台账 | 类 | 本批覆盖面 | 交付载体 |
|---|---|---|---|
| #904 | tech_todo | 清账（悬空残引扫面与三式处置）+「先清账后开闸」顺序明书；**闸扩面代码 = 另轮，`scripts/**` 零触** | 2.1 ∥ 2.3 |
| #901 | tech_todo | 标记法定形沿用 + 同族残引全扫（与 #904 同一清账动作——双扩展段残引主体即 #901 族） | 2.1 |
| #885 | tech_todo | 2026-10-0x 系列落批的 §5 落点指针逐档补全（50 批 · 122 档-批配对，清单化） | 2.2 |
| #908 | tech_todo | 「桥面不适用」明书补句（单一权威落 EDIT.md） | 2.4 |

三式判据权威 = `docs/core/design/DOC-DISCIPLINE.md` §4.2.10「迁移期引文」既有族——**本批判据零新增**（施打轮；先例 = ANCHOR-DEBT-REPAIR C 子批「逐条清册 + AC + 用例 = 批次档 §2，本档不重述」）。机制设计档不新建。

**2.1 件一+#904/#901：悬空残引扫面与三式清账**

扫面读数（设计轮双口径实测 · 2026-10-04 · 引擎同语义探针——execute 内联不落仓）：

| 口径 | 定义 | 候选 | 悬空 | 注记豁免 | 迁移期引文 | 拟新增 |
|---|---|---|---|---|---|---|
| W（#904 已测形） | 双扩展段仅 5 产品仓根前缀（`thincoder-{cli,core,vscode,desktop,render-core}/`）判锚 | 20409 | **607**（与台账实测同读 ✓） | 77 | 303 | 69 |
| F（终态形·本批目标） | 双扩展段全量判锚（含相对路径 `test/…` ∥ 裸文件名 `x.test.mjs` 形） | 20852 | **774** | 89 | 303 | 76 |

F 口径悬空构成：**测试档族 759**（09-28 全清退场树引用——`*.test.mjs` ∥ `test/` 路径形）+ **其他 15**（逐条三式裁——2.5 表）。W⊂F（差 167 = 非仓根前缀形）。

**开闸形态裁定（KD-1）**：闸扩面代码（另轮）取 **F 全量**（`doc-check-anchors.mjs:149` 双扩展段跳过条件整体移除）——白名单形态留 167 条盲区（相对/裸名形），二次扩面即二次清账；本批清账一次按 F 面清到位。台账 #904 的 607 = W 口径历史读数，与 F 不矛盾（子集关系，勿互用）。

三式判据（机判规则 · 逐条落）：

| 式 | 判据（机判） | 动作 | 预估面 |
|---|---|---|---|
| **A｜退场注 + 引文标记**（主式） | 悬空 token 命中 09-28 全清树形态（尾段 `.test.mjs` ∥ token 含 `test/` 段）∧ 同行无现役替身 | 行内补定形注「已随 2026-09-28 测试树全清退场——档不在盘（原读数 ×× · as-of …）」；**行尾补「（迁移期引文）」标记**（同行史实谓词「退场」在场 ⇒ §4.2.10 有据）。#901 先例五处（`docs/core/design/LEDGER.md` :207/:414/:421 ∥ `docs/core/design/EDIT.md` :95/:99）定形注**不含标记**，开闸后仍红——本批为其补标记 = 同族施打 | ~744（759 测试档族 − B/C 项） |
| **B｜改活指针** | 所指对象有唯一现役替身（迁核/改名/拆分后新落点可判——如迁移前路径 `src/agent/…` → `thincoder-core/agent/…`） | 改指现役档；逐条上下文核验，核不出唯一替身 ⇒ 落回式 A/C（不猜——ADR §3-Q2 P4 置换算先例） | 逐条判（预 <20） |
| **C｜改述去锚** | 行 ∈ 变更记录区带（记录面——D8：历史属记录面，不追改史实；打标记语义不对） | 路径 token 改描述形（去路径段/去扩展、保语义保读数——「原 45 用例」不引路径）；史实零动 | 变更记录内命中项 |

非测试档族 15 条（`docs/desktop/design/PACKAGING.md` 4 ∥ `docs/RELEASE.md` 1 ∥ 设计档散布 10）= 逐条三式裁，2.5 逐条表承载。锁死不变式：**史实读数零动**（只加注记/标记/改指，不改行内既有读数值——ADR §3-Q6 边界同款）；**不新增锚**（改指落点必在盘，实施轮逐条实读核验）。

豁免面边界（明书）：

- **`docs/batches/**` = 历史引文豁免，已被声明面天然承载**：`PROJECT-MANIFEST.json` checkConfig `anchors.exclude = ["_archive","batches"]` ⇒ 源域采集（`scripts/doc-check-targets.mjs` walkMd 逐层排除）本就不含批档——零改动、零新机制。台账 #904「记录面不入闸」由现行声明面兑现 ✓。
- `_archive/**` 同在 exclude ∥ SKIP_DIRS（扫描面排除）；引用 `_archive` 在位档的活指针 = 解析序可命中（ADR §3-Q4 实证）——改指归档落点合法。
- 需求档面（`docs/core/requirements/**` ∥ `docs/vsc/requirements/WEBVIEW.md` ∥ `docs/RELEASE.md`）命中残引 ≈15 条 = **上抛主 agent 笔**（D1 写权矩阵——eng-coder 不写需求档）——见 2.6。

**2.2 件二 #885：2026-10-0x 系列落批的 §5 落点指针补全**

先例形 = `docs/core/design/SESSION.md:74`（default-model-carryover 批的落点指针行）。台账 #885 原判「本批已补；他批随触碰随补」，本批批档 §1 改判 = 清账轮逐档补全——扫描面 = 各设计档「受影响文件/§5 落点」节是否含 2026-10-0x 各批的落点指针行。

**配对清单（2026-10-0x · 50 批 × 122 档-批配对——设计轮实测，逐行自设计档变更记录的「承批档」引用面交叉提取；`§—` = 该行未给节号，补针时按该批 §2 实际落点节号回填）**：

| 批 | 应持指针的档与形态 |
|---|---|
| 2026-10-01-batch-file-mount-normalize | core/TESTING.md（§5.1） |
| 2026-10-01-core-split-line | core/CORE-UNIFICATION.md（§5）∥ core/STRUCTURE-DEBT.md（§5） |
| 2026-10-01-digest-replay-choices | cli/TUI-SESSION-VIEW.md ∥ cli/TUI.md ∥ core/SESSION.md（各 §5） |
| 2026-10-01-digest-row-current-only | cli/TUI.md ∥ desktop/IPC.md |
| 2026-10-01-digest-rows-natural-form | desktop/IPC.md |
| 2026-10-01-digest-rows-natural-form-cli-vsc | cli/TUI-SESSION-VIEW.md ∥ cli/TUI.md |
| 2026-10-01-test-manifest-evidence ∥ -settlement | core/TESTING.md（§5.1） |
| 2026-10-01-timer-wake-delivery | core/AGENT-LOOP-ASYNC-POOL.md（§5） |
| 2026-10-01-zero-semantic-cleanup-2 | cli/TUI-SESSION-VIEW.md ∥ core/AGENT-LOOP.md ∥ core/SESSION.md |
| 2026-10-02-desktop-menu-system ∥ -settings-menu-upgrade ∥ -settings-menu-trim ∥ -ux-closeout | desktop/IPC.md ∥ core/MCP.md ∥ desktop/ACTIVITY.md（各 §5） |
| 2026-10-02-doc-structure-reorg | core/DOC-SYSTEM.md ∥ desktop/{ACTIVITY,CHAT,COMPOSER,E2E-TESTING,IPC}.md |
| 2026-10-02-light-channel-{expansion,simplification} ∥ -prompt-face-rectification ∥ -multi-repo-mechanism | core/{LIGHT-CHANNEL,PROMPT-SYSTEM,DOC-DISCIPLINE,LEDGER-SELF-CONTAINED}.md |
| 2026-10-02-light-round-7 ∥ -manifest-resolution-fix ∥ -public-repo-read | core/{MANIFEST,BATCH-RECORD,DESIGN-TOKEN-SETTLEMENT,ENG-TOKEN-BINDING,LEDGER,LEDGER-SELF-CONTAINED,DOC-DISCIPLINE,MEMORY,PROMPT-SYSTEM}.md |
| 2026-10-02-record-shape-residuals | cli/TUI-SESSION-VIEW.md ∥ core/SESSION.md ∥ desktop/CHAT.md |
| 2026-10-03-{crash-guards,default-model-carryover,design-token-echo,desktop-firstrun-provider-notice,desktop-second-instance-notice,ledger-family-aggregate,light-round-8,provider-invalid-unify,read-data-interface} | core/{MCP,PROVIDER,PROXY,SESSION,ENG-TOKEN-BINDING,LEDGER}.md ∥ desktop/{COMPOSER,E2E-TESTING,CHAT,ACTIVITY}.md ∥ cli/{ACP-CLIENT,CLI-ENTRY,READ-DATA-INTERFACE}.md |
| 2026-10-04-{acp-face-completion,acp-user-docs,composer-queue-gate-stick,core-patch-batch,desktop-channel-tier-retire,desktop-model-switch-unlock,digest-reentry-order,issue-fix-round1..5,light-ledger-ghost-root,opencode-go-preset,row-traces-clear-at-turn,session-carryover-cli-vsc,stream-ledger-lines-retire} | core/{AGENT-LOOP,AGENT-LOOP-ASYNC-POOL,AGENT-LOOP-SUBAGENT,BATCH-RECORD,CORE-UNIFICATION,EDIT,LEDGER,MCP,MEMORY,PORTABILITY,PROVIDER,PROXY,VERIFY-REDESIGN,SESSION}.md ∥ desktop/{ACTIVITY,CHAT,COMPOSER,E2E-TESTING}.md ∥ cli/{ACP-CLIENT,ACP-PROTOCOL-COMPLIANCE,CLI-ENTRY,TUI-COMMANDS}.md |

（全 50 批逐批逐档展开表 = 实施轮从本表源数据逐行核对——本表为域面归组展示；逐条 `file:line` 留痕在 2.5 逐条表。逐批名单已逐条实读核验，无猜。）指针行文形 = SESSION.md:74 先例形（「**本批（<批名>）落点表** = `docs/batches/<批>.md` §2（唯一承载面——一次性批次材料）；本档 §<节> 承载…」）。补针判据：仅补**缺失**行；已持指针行的档不动（无重写义务）；补行 ≤2 行/批，行宽 ≤300。

**2.3 件三 #904：启用顺序明书（先清账后开闸）**

- 顺序判据：`docs/core/design/DOC-DISCIPLINE.md` §4.2.10 既有判据面 + 本批 2.1 三式清账 ⇒ 复跑 F 口径悬空 = 0 ⇒ **下一轮（机检面轮）**实施 `scripts/doc-check-anchors.mjs:149` 扩面（W→F）。**本批 `scripts/**` 零触**（批档 §1 边界）。
- 开闸验收预置（下轮引用）：扩面后 `node scripts/doc-check.mjs` exit 0 ∥ 悬空 0（F 口径基线由本批清账建立）。
- 中间态裁定：不做「报告态先行」的引擎新桶（#904 台账候选③）——先清账 + 全量开闸一次到位，避免双态机制长期并存（少一套机制面）；若实施轮发现残留面超预期（>10 条悬空），回滚为报告态分阶段（触发即上报，不扩本批边界）。

**2.4 件四 #908：桥面汇总行「明书不适用」**

- 事实链（设计轮实核）：#796 汇总行落核面 `thincoder-core/tools/edit-batch.mjs:112-113`（`summary` 组装 ∥ return 末行）；**桥面自持** = `thincoder-cli/src/acp/bridge.mjs:204`（`editBatch` 返回 `outcomes.map(...).join("\n")`——逐条 OK 行、无汇总行）；全仓 `applyEditBatch` 调用面 = `thincoder-core/tools/file.mjs:269` + 批内件（不含桥）⇒ #796「三通道共用」表述在桥面不成立（EDIT.md §6 表「三通道共用」行同病）。
- 裁定 = 台账倾向「明书不适用」：桥回执不含 diff、距 64K offload 阈值远 ⇒ offload 盲区不适用；汇总行动机（大回执 tail 保序可见）在桥面不存在。
- **补句落点（单一权威 = EDIT.md）**：§5「批量回执汇总行」条尾补一句「（射程 = 核面 `editBatch`；ACP 桥批量回执 = 桥面自持逐条行——**本条不适用桥面**，`thincoder-cli/src/acp/bridge.mjs` editBatch 逐条 join 收尾）」；§6 表「三通道共用」行同拍收正（「三通道」→「本地单形态 ∥ edits 批量（核面）」+ 桥面逐条行注）。**桥面设计档（`docs/cli/design/ACP-CLIENT.md`）零改**——回执行形非其契约面；不选桥面补句（会造 D2 双源）。
- 需求档 `docs/core/requirements/EDIT*` 无该条——零涉；实施 = eng-coder 一笔（EDIT.md 两处 + 变更记录一行）。

**2.5 受影响文件清单与逐条清册载体**

| 面 | 档 | 改动形态 | 预估 |
|---|---|---|---|
| 清账主战场 | `docs/core/design/MODEL-SPECS.md`(135) ∥ `docs/desktop/design/PROJECT.md`(87) ∥ `docs/core/design/CORE-UNIFICATION.md`(65) ∥ `docs/vsc/design/VSC-DEBT.md`(61) ∥ `docs/core/design/AGENT-LOOP-{SUBAGENT,ASYNC-POOL,UPSTREAM}.md`(104) ∥ `docs/core/design/{TOOLS,MANIFEST,DOC-DISCIPLINE}.md`(80) ∥ `docs/cli/design/{CLI-DEBT,ACP-CLIENT,TUI-INPUT-BOX,TUI,TUI-COMMANDS,TUI-SESSION-VIEW,CLI-ENTRY,CRASH-REPORTS}.md`(45) ∥ 其余 F 表散布档（逐条见实施清册） | 式 A 退场注+标记 / 式 B 改指 / 式 C 改述 | 759 测试档族 + 散布 |
| #885 指针 | 2.2 表 40 档（core 21 ∥ desktop 10 ∥ cli 6 ∥ vsc 2 ∥ render-core 1——按配对表） | §5 落点指针行补（≤2 行/批） | 122 配对 |
| #908 | `docs/core/design/EDIT.md` | §5 补句 + §6 行收正 + 变更记录 1 行 | 3 处 |
| 需求档面（上抛） | `docs/core/requirements/{DESIGN-TOKEN-SETTLEMENT,ADVISOR-CONVERGENCE,AGENT-PARAMS,CONSULTATION,PROVIDER,TOOLS,TURN-CAP-CONTINUE}.md` ∥ `docs/vsc/requirements/WEBVIEW.md` ∥ `docs/RELEASE.md` | 主 agent 笔（同三式） | ≈15 条 |

逐条清册（file:line → 旧 token → 式 → 新形 → 复跑读数）= **实施轮开工时从本表 + F 口径清册生成、冻结在批次档 §5**（先例 = ADR AC-6 / item 级基线冻结；设计轮不逐条誊 774 行——条数与构成已定，逐条落位属实施自由度）。

**2.6 验收标准（AC——每条机判 · 回指条目）**

| # | 判据（可机判） | 回指 |
|---|---|---|
| AC-1 | 引擎同语义探针（F 口径）复跑：悬空 **774 → 0**（逐条差集 = §5 清册集合，不得多减；「拟新增 76 ∥ 迁移期引文 303 ∥ 注记豁免 89」计数随施打上涨——D3 对账） | #904 ∥ #901 |
| AC-2 | 基线机检保持：`node scripts/doc-check.mjs` = exit 0 ∥ 悬空 0（现行闸口径）∥ 行宽 0 红（区带豁免在效）；`docs/cli/requirements/ACP-CLIENT.md:91` 行宽面他批在册，本批零触 | #904 |
| AC-3 | `scripts/**` diff = 0（闸扩面代码零触——本批只清账）；`docs/batches/**` 正文零改（豁免面不动；本批自身 §5 留痕除外） | 边界 |
| AC-4 | #885：2.2 表 122 配对逐档可核——每配对在归属档持 §5 落点指针行（缺行 = 红；已持行档零改） | #885 |
| AC-5 | #908：EDIT.md §5 汇总行条含「不适用桥面」句 ∥ §6 表行收正在盘 ∥ 变更记录 +1 行；`docs/cli/design/ACP-CLIENT.md` diff = 0 | #908 |
| AC-6 | 史实零动：清账面 774 条逐条 diff 只含注记/标记/改指/描述形改写——行内既有读数值零变更（抽核 20 条 + 全量 diff 审） | 边界 |
| AC-7 | 上抛面清册：需求档面 ≈15 条逐条 `file:line → 旧 token → 建议处置` 在 §5 上抛块，主 agent 处置后另行核销 | D1 |
| AC-8 | 三件独立可核（批档 §1 验收④）：清账面 = AC-1；指针面 = AC-4；明书面 = AC-5——互不前置 | 批档 §1 |

**2.7 用例表（正常 ∥ 边界 ∥ 错误）**

| id | 类 | 输入 | 期望输出与判据 |
|---|---|---|---|
| U1 | 正常 | 式 A：`docs/core/design/EDIT.md:95`（已持定形注、无标记） | 行尾补「（迁移期引文）」；F 探针该锚转引文计数（不再悬空）；原注一字不动 |
| U2 | 正常 | 式 B：`src/agent/…` 迁移前路径有唯一核面替身 | 改指 `thincoder-core/…` 现役档；复跑转绿 |
| U3 | 正常 | 式 C：变更记录行内 `…/test/foo.test.mjs`（他批史实） | token 改描述形（`foo 用例档`）；史实句零动；不再产锚 |
| U4 | 边界 | 改指候选 ≥2（同名档双落点）或零候选 | 不改——落式 A/C 或留红上报（§5 清册标注）；不猜（ADR §3-Q2 先例） |
| U5 | 边界 | #901 五先例行（定形注已在意） | 只补标记，注零重写（判据 = diff 单一追加片段） |
| U6 | 边界 | 批档内引用（`docs/batches/**`） | 零触——exclude 声明面天然豁免（2.1 边界块） |
| U7 | 错误 | 脚本批量改写文档 | 违规——语义面逐档手工（D6 回读）；脚本仅可生成候选清册（execute 内联不落仓，ADR §3-Q2 L1 同款） |
| U8 | 错误 | 触 `scripts/doc-check-anchors.mjs` | 违规——AC-3 判红（闸扩面 = 另轮） |
| U9 | 错误 | 改动变更记录史实读数 | 违规——AC-6 判红（史实零动不变式） |

**2.8 边界（本批不做）**

- 闸扩面代码（`scripts/doc-check-anchors.mjs` F 全量）= **另轮**——本批只清账 + 顺序明书（KD-1）。
- 产品码 ∥ 机检脚本 ∥ 提示词面零触（除非扫描直接命中残引——本批扫描面 = `docs/**`，均不在）。
- 需求档面残引 = 上抛（D1——主 agent 笔），本批不代笔。
- 批档历史面零触（append-only——本批自身 §2/§5 写入为合规必需）。
- 行数面（`lineCounts` 14 处 Δ 读数）∥ 符号·宽 883 报告行 ∥ `ACP-CLIENT.md:91` 行宽红 = 非本批面（报告态/他批在册——如实列，不扩面）。
- 「报告态先行」引擎新桶不做（2.3 裁定）。

**2.9 关键决策记录（KD）**

| # | 决策 | 理由 ∥ 被否备选 |
|---|---|---|
| KD-1 | 开闸形态 = F 全量（一次到位）；清账按 F 面 | W 白名单形留 167 盲区 ⇒ 二次扩面即二次清账；被否：W 形（最小改动）——留残量违反「先清账后开闸」本意 |
| KD-2 | #901 定形注**补标记不重写** | 注含「退场」谓词（§4.2.10 前提① ✓）只缺标记；重写 = 无谓碰史实行；被否：改注含标记一体形（碰史实文字） |
| KD-3 | 清账判据用 §4.2.10 既有「迁移期引文」族，零新机制 | 判据面已闭合（ADR C 子批先例 211 条施打）；被否：新族/新豁免清单（防滥用五条成本 + 闭集纪律） |
| KD-4 | #908 补句单一权威落 EDIT.md | #796 权威面在 EDIT.md（D2）；被否：桥面 ACP-CLIENT.md 补句（双源）；被否：桥面补代码（本批零产品码 + 台账倾向明书） |
| KD-5 | #885 补针面 = 变更记录引用面交叉提取的 122 配对，缺失行才补 | 台账原判「随触碰随补」已由批档 §1 改判全量补；已持行重写 = 无谓 churn；被否：全档无差别补行（重复行） |
| KD-6 | 批档豁免 = 声明面既成事实（零改动） | `anchors.exclude` 已含 batches——台账描述与实现一致；被否：新增豁免机制（重复声明） |

**2.10 上抛项（本批实施轮执行时顺手 ∥ 主 agent 域）**

1. 需求档面 ≈15 条残引（2.5 表第四行）——主 agent 笔（D1）。
2. 基线事实更新两条（知会）：① 任务书所记「行宽红 1（ACP-CLIENT.md:91）」在当前基线**已不存在**（现行 `node scripts/doc-check.mjs` exit 0 ∥ 行宽 0 红——区带豁免在效；该行宽面他批处置与否自核）；② #901 五先例缺标记面归本批补（KD-2），非独立债。
3. 台账 #904 的 607 读数 = W 口径——本批 F 口径 774 为清账基线，核销时按 F 读（避免「清完 607 还剩 167」误读）。

**2.11 结构自检补记**

- **UI ∥ 交互决策槽位 = 空集**（纯文档面对账批——无界面 ∥ 无交互 ∥ 无未决项；open 项 = 0）。
- 文档结构口径：本批机制判据单源 = `DOC-DISCIPLINE.md` §4.2.10（既有），清账方案 ∥ 清单 ∥ AC ∥ KD 全住本档 §2（一次性批次材料——D2，不另建设计档）；`docs/core/design/ANCHOR-DEBT-REPAIR.md` 为同面先例档（2026-09-17 锚债轮），本批不回写该档（其 §3-Q6 判据面未变——本批只是又一次施打；若评审认应回指，补一行指针即可，届时落）。
- **自察残点（如实披露 · 不自改）**：§2 首块内行「**状态行**：🔄 设计轮 §2 已落…」与骨架机制写入的正式状态行（「设计完成 2026-10-04…」）重复——append-only 面不自改，评审轮如认碍读，由父侧裁一处收口；语义无歧义（正式状态行 = 机制面权威）。
- 单行宽自检：本档 §2 新增各行 ≤300 字符（表格长行 2.5 表清账主战场行为 ~310——**超线**，实施轮开工时随批内折行修（该行在批次档内、不在行宽闸扫描域 `batches` exclude 内——闸不管，人读判据自守）；如实登记，非闸红）。

### fix 轮修正块（承 §3 评审轮次 1 · 发现 1–8 · eng-designer · 2026-10-04）

（承 §3 轮次 1（评审 #6 · VERDICT pass · 🔴 0 ∥ 🟡 3 ∥ 🔵 5——按发现表实枚举）；父侧裁定 = 逐发现号落位。§2 本体行不重写，本块 append 纪行；**块内各条 = 终值语句——与先行文不一致处以本块为准**。仓先例形 = `docs/batches/2026-10-04-core-patch-batch.md` §2 fix 轮修正块。）

1. **发现 1（AC-4 判据锚）**——AC-4 终值：判据对象 = **§5 冻结逐条清册**（实施轮自 2.2 源数据生成并冻结；冻结时点读数 = 判据基线——设计轮预估 122 配对，冻结时复算收正，D3 对账）；逐配对在归属档持 §5 落点指针行（缺行 = 红；已持行档零改）。

   2.2「50 批 × 122 配对」（:69）∥ 2.5「40 档 · core 21 ∥ desktop 10 ∥ cli 6 ∥ vsc 2 ∥ render-core 1」（:110）均标 **as-of 设计轮预估**（2.2 表 = 域面归组展示，非判据面）。

2. **发现 2（#908 收正限定回执形态面）**——EDIT.md §5「批量回执汇总行」条（:69）条尾 ∥ §6 汇总行行（:81）各加「不适用桥面」注（2.4 :102 已定句形沿用：射程 = 核面 `editBatch` 汇总组装；桥批量回执 = 逐条行自持——`bridge.mjs` editBatch 逐条 join 收尾）。

   §6「三通道共用」行（:80）**保留不动**——内核共用语义在档（:64 桥面同口径 ∥ :111 D-7 桥零副本同调用）；回执语境桥面注由 :81 注承载，:80 不另加注；2.4 :102「三通道 → 本地单形态 ∥ edits 批量（核面）」改述**不再执行**（以本条为准）。

3. **发现 3（状态行双权威让位）**——§2 状态面唯一权威 = 骨架正式状态行（:20）；:23「🔄 设计轮 §2 已落」行以本条登记让位（append-only 面不回改历史行文）——下游 §4/§6 写入者以 :20 为准。本块落定后 §2 状态终值 = 「设计完成 2026-10-04（fix 轮修正块八条在册——待父侧核验）」。

4. **发现 4（两个 15 口径归属）**——2.1 补口径句（终值）：需求档面「≈15 条」逐条式判**按 token 形态归族**——命中 09-28 全清树形态（尾段 `.test.mjs` ∥ token 含 `test/` 段）⇒ 计入 759 测试档族（非独立口径）；非测试形 ⇒ 与「其他 15」同款逐条三式裁（实施清册逐行落族，AC-1 差集可对账）。

   AC-1 差集终值 = **§5 清册全集（eng-coder lane ∥ §5 上抛块 lane 合并）**，不得多减。

5. **发现 5（AC-1 补防滥用④等式）**——AC-1 补显式等式，判据权威 = `DOC-DISCIPLINE.md` §4.2.10 防滥用④「标记数 ⇔ 批次档 §5 逐条表 ⇔ 复跑读数差三者同数」（:1116 在档实读）：**式 A 标记数 = §5 清册式 A 行数 = 复跑「迁移期引文」字段增量（303 → 303+N）**。

6. **发现 6（零涉判据面实名）**——2.4 零涉句终值：需求侧承载档 = `docs/core/requirements/TOOLS.md`（211 行 · 在盘——`EDIT.md:8` 所指工具板块需求档）；该档批量面仅 F13 入参守卫（:67）∥ 无汇总行条目 ⇒ **#908 需求档零涉成立**；判据面实名 = TOOLS.md（原「`docs/core/requirements/EDIT*` glob 查无该条」为恒真式，弃用）。

7. **发现 7（AC-2 路径分句改述）**——AC-2 分句终值：「`docs/cli/requirements/ACP-CLIENT.md:91` 行宽面归他批在册（该档 162 行在盘 · 红实位 = :91 · 234 字符）——现基线读数已 0 红（区带豁免在效，2.10① 同读），本批零触」。两档并存实名：`requirements/ACP-CLIENT.md`（162 行）∥ `design/ACP-CLIENT.md`（796 行 · :91 空行）——本批对两档均零触；AC-5「design 档 diff = 0」不含 requirements 档。

8. **发现 8（先例档指针 · 实施轮随批顺手）**——实施轮在 `docs/core/design/ANCHOR-DEBT-REPAIR.md`（在盘）补一行指针，形 = 「2026-10-04 文档清账轮施打（式 A 为主 ~744 条）——逐条清册 = `docs/batches/2026-10-04-doc-cleanup-round.md` §5」；落点按该档节属惯例（指针形态，不重述判据——D2 兼容）。

**读回（D6 · as-of 2026-10-04 22:1x）**：① 本块八条落地值 = 本块文本（批档 §2 即设计承载面——2.11 口径；append 后回读核验）✓；② 新引坐标实读在档：`EDIT.md` :64/:69/:80/:81/:111 ∥ `DOC-DISCIPLINE.md:1116` ∥ `ANCHOR-DEBT-REPAIR.md` 在盘 ✓；③ 行宽自守 = 本块各行 ≤300（批档在闸扫描域外，人读判据自守）；doc-check 复跑读数随交付报告。

**边界（本修正轮不做）**：产品码 ∥ 机检脚本 ∥ 提示词面零触（git status 自证）∥ §1/§3/§4/§5/§6 零触（各归其主）∥ 被审三域其他两批零触 ∥ 先行文不重写（块内终值语句即承载）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**发现表**（设计评审 · 对象 = 本档 §2 设计面 · 判据参照 = `DOC-DISCIPLINE.md` §4.2.10 / D1–D8 / D3 / D4 ∥ `EDIT.md` 全文 · 引证已逐条回读核验）：

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Acceptance / Clarity | 🟡 | AC-4 判据锚在「2.2 表 122 配对」（本档 :123），但 2.2 表自认「本表为域面归组展示」（:90）——122 配对无法自表导出；且表内可数读数与设计声明不合：表内可枚举批名 49（声明「50 批」:69）、去重档人工枚举 ≈37（core 24 ∥ desktop 5 ∥ cli 7；vsc/render-core 档零出现）vs 2.5「core 21 ∥ desktop 10 ∥ cli 6 ∥ vsc 2 ∥ render-core 1——按配对表」（:110）。D3 计数·枚举同改在设计面未闭合。 | AC-4 判据改锚 §5 冻结逐条清册（冻结时点读数为判据基线；122 = 该时点读数）；2.2/2.5 的 50/40/域拆分数标注 as-of 预估，或 §5 冻结时按源数据复算收正——判据对象 = 冻结清单逐行，非归组展示表。 |
| 2 | Clarity / 单源一致性 | 🟡 | 2.4 对 EDIT.md §6「三通道共用」行的收正方向（「三通道」→「本地单形态 ∥ edits 批量（核面）」+ 桥面逐条行注——:102）按字面执行将与同档 §5「ACP 桥 `editBatch` 与核同调用两守卫」（EDIT.md:64）及 §8 D-7「桥零副本、同调用」（EDIT.md:111）相抵：桥在守卫/diff 内核面确属共用，不自持的只是批量回执组装面。 | §6 收正限定在回执形态面（汇总行 vs 逐条行）：#796 两行（EDIT.md:69/:81）加「不适用桥面（桥回执 = 逐条行）」注；「三通道共用」行保留内核共用语义，仅在回执语境加桥面注。 |
| 3 | Doc hygiene / 状态面 | 🟡 | §2 内两行「**状态行**」并存（:20「设计完成 2026-10-04…待评审」与 :23「🔄 设计轮 §2 已落…待评审」）——append-only 面所致，2.11 已自察（:173）；未让位前下游 §4/§6 写入者面临双权威行。 | 以骨架正式状态行为唯一权威终态；另一行以登记注让位（append-only 面，不改历史行，收口段留一行登记即可）。 |
| 4 | Clarity | 🔵 | 两个「15」未显式对账：F 悬空构成「其他 15」= PACKAGING 4 ∥ RELEASE 1 ∥ 设计档 10（:57——不含 requirements 档）；需求档面「命中残引 ≈15 条」（:63/:112——7 requirements 档 + WEBVIEW + RELEASE）。自然读法 = 需求档面 ≈15 ⊂ 759 测试档族（token 多为 test 形），但设计未明说；AC-1「差集 = §5 清册集合」（:120）在 eng-coder 清册 ∥ §5 上抛块两 lane 间的划分依赖此隐含前提。 | 2.1 补一句口径归属（需求档面 ≈15 的 token 形态归属 759 族抑或独立口径），并写明 AC-1 差集 = §5 清册（含上抛块）全集。 |
| 5 | Acceptance | 🔵 | AC-1 对「迁移期引文」计数只写「随施打上涨——D3 对账」（:120），未落 §4.2.10 防滥用④等式「标记数 ⇔ 批档 §5 逐条表 ⇔ 复跑读数差」（DOC-DISCIPLINE.md:1116）。 | AC-1 补显式等式：式 A 标记数 = §5 清册式 A 行数 = 复跑「迁移期引文」字段增量（303 → 303+N）。 |
| 6 | Feasibility（证据面） | 🔵 | 2.4「需求档 `docs/core/requirements/EDIT*` 无该条——零涉」（:103）核对面疑似错位：EDIT.md:8 明载「需求侧 = `docs/core/requirements/TOOLS.md`（工具系统板块；CLI 树无逐工具需求档）」——按 `EDIT*` glob 查无该条属恒真。 | 零涉结论改按 `requirements/TOOLS.md` 复核后登记（结论大概率不变，判据面须对准真实承载档）。 |
| 7 | Clarity | 🔵 | AC-2「`docs/cli/requirements/ACP-CLIENT.md:91` 行宽面他批在册，本批零触」（:121）与 2.10①「该行宽红在当前基线已不存在（行宽 0 红）」（:166）并置易误读为在册红仍活；且路径段 `requirements/` 与 2.5/#908 的 `docs/cli/design/ACP-CLIENT.md`（:102/:109）不一致（评审域内无法核实 requirements/ 下有无同名档）。 | AC-2 该分句改述为「:91 行宽面归他批在册——现基线读数已 0（2.10①），本批零触」，并核实路径段归一。 |
| 8 | Scope | 🔵 | 2.11 自留可选项「ANCHOR-DEBT-REPAIR.md 补一行指针」（:172）——本批 ~744 条施打后该先例档适用清单即缺本次施打一行。 | 随本批落笔顺手补该一行指针（指针形态，不重述判据——D2 兼容）。 |

**VERDICT: pass**

计数：🔴 0 ∥ 🟡 3 ∥ 🔵 6。（判据面核验：式 A 标记形「（迁移期引文」= §4.2.10 逐字前缀 ✓（DOC-DISCIPLINE.md:1101）；谓词「退场」∈ 19 词闭枚举 ✓（:1110）；#901 五先例行缺标记、EDIT.md :95/:99 形态实读相符 ✓；扩族闭集未触（零新标记/零新谓词/零新锚类）✓；批次档豁免 = 声明面既成事实有在档佐证 ✓（DOC-DISCIPLINE.md:352）；D1 上抛面与 AC-7 相符 ✓。范围限制声明：无项目标准档 ∥ 无文档地图——Document ownership 判据降格，按 Project Guide + 在档规范（D2/D3）执行。）

## §4 用户批准（主 agent）

**2026-10-04 22:2x 父侧代签**（承用户 21:47「三个任务都自动跑完吧」全链授权；非用户亲签）。

**三条件核验**：① 设计评审 pass ✓（评审 #6 · VERDICT pass · 0🔴 / 3🟡 / 5🔵——发现表实枚举在 §3；§3 计数行「🔵 6」为评审席笔误、实枚举 5，其修正块承句已按实枚举落并显式标注——计数笔误留 §3 原样（评审席段，父侧不代改），不影响实质判定）；② 修正轮落地并逐条核验 ✓——fix 轮修正块八条（批档 :176-204）父侧逐条读回：发现 1 判据锚改 §5 冻结清册 ✓ ∥ 发现 2 收正限定回执形态面、:80 行保留 ✓ ∥ 发现 3 状态行唯一权威 :20 ✓ ∥ 发现 4 口径归属 + AC-1 差集全集 ✓ ∥ 发现 5 防滥用④等式（:1116 权威）✓ ∥ 发现 6 零涉判据面实名 TOOLS.md（父侧核实读数 211 行 · F13 :67 · 无汇总条）✓ ∥ 发现 7 AC-2 分句改述（红实位 requirements 份 :91 · 234 字符——父侧核实）✓ ∥ 发现 8 先例档指针随实施轮 ✓；doc-check exit 0（fix 轮自报 + 修正面零增量）；③ token 已签发 ✓（运行态不入档）。**批准范围** = 本批全量（三式清账 F 口径 ∥ 122 配对补针 ∥ #908 明书 ∥ 先例档指针——以修正块八条为终值）。

## §5 实施记录（eng-coder）
**状态行**：实施完成 2026-10-05（续跑收口：现场复核 + 四件交付（冻结清册 ∥ 上抛块 ∥ #885 补针 127 行 ∥ AC-1 对账）+ 终验 + 审计/评审（clean）已落）



### §5.1 现场复核（续跑接舱 · eng-coder #14）

**接舱背景**：前舱 eng-coder#13 施打达终态后于 2026-10-04 23:42 provider 余额中断；本舱承父侧续跑令——现场复核 → 补齐四件 → 终验 → §5 收口。**复核口径 = 全量实读**（探针复跑 ∥ git status ∥ diff 抽核）。

**落态 vs 交付清单差异表**（as-of 本舱）：

| 项 | 落态 | 差异 | 本舱动作 |
|---|---|---|---|
| 57 档清账施打 | ✓ 在盘 | 零差异 | — |
| 探针终态 F=31 | ✓ 在盘（复跑逐字同） | 零差异 | — |
| #908 EDIT.md（§5 条尾注 + §6 行注 + 变更记录） | ✓ 在盘 | 零差异 | — |
| ANCHOR-DEBT-REPAIR 指针行 | ✓ 在盘 | 数字 = 草稿值（「~503 行 / 109 行 / 774→0」） | 本舱收正（529 行/647 锚 · 83 行/96 锚 · 774 → 31） |
| §5 冻结逐条清册 | ✗ 未落 | 全缺 | 本舱补（§5.2） |
| 上抛块清册 | ✗ 未落 | 全缺 | 本舱补（§5.4） |
| #885 补针 | ✗ 未开工（复核：全 docs 域零真指针；pair-probe 路径基错——`core/TESTING.md` 应作 `core/design/TESTING.md` ⇒ 首块不可读） | 全缺 | 本舱补 125 行 / 34 档（§5.3） |
| AC-1 三数对账 | ✗ 未落 | 全缺 | 本舱补（§5.5） |
| 终验三读 | ✗ 未落 | — | 本舱补（§5.6） |

### §5.2 清账冻结逐条清册（eng-lane · AC-1 对账基）

四组总量：式 A **503 行/605 锚**（46 档）∥ 宽险折行 **26 行/42 锚**（13 档）∥ 式 C 区带 **80 行/92 锚**（27 档）∥ 式 C 跨仓 **3 行/4 锚**（1 档）——合计 **612 行 / 743 锚**。锚数括注 = 行内悬空锚数；✓谓 = 已持史实谓词者（只补标记、注零重写——KD-2）。逐条：

== 式 A 面（503 行 / 605 锚 · 46 档）——处置 = 行内退场注+行尾标记（37 行已持谓词者仅补标记——KD-2）==
cli/design/CLI-DEBT.md: 36(1) 40(1) 42(1) 43(1) 44(1) 52(1) 53(1) 55(1) 56(1) 57(1) 68(1✓谓) 74(3) 78(1✓谓)
cli/design/CLI-ENTRY.md: 66(1✓谓)
cli/design/TUI-INPUT-BOX.md: 221(2)
cli/design/TUI.md: 481(1) 518(1)
core/design/ADVISOR-CONVERGENCE.md: 410(1) 411(2)
core/design/AGENT-LOOP-ASYNC-POOL.md: 121(1) 122(1) 123(1) 316(1) 317(1) 318(1) 319(1) 361(1) 364(2) 365(1) 366(1) 494(1) 495(1) 504(1) 505(1) 518(1) 546(1) 547(1) 548(2) 646(3) 647(3) 657(2) 667(1) 668(2) 683(1)
core/design/AGENT-LOOP-SUBAGENT.md: 193(1) 194(2✓谓) 231(1) 240(1) 253(1) 261(3) 311(1) 345(1) 346(1) 347(1) 403(1) 407(1) 488(1) 489(1) 490(1) 491(1) 624(1) 641(1) 642(1) 643(1) 644(1) 713(1) 715(1) 717(1) 719(1) 722(2) 729(1) 739(2) 762(1) 767(1) 833(1)
core/design/AGENT-LOOP-UPSTREAM.md: 137(1) 245(1) 246(1) 265(1) 379(1) 665(1) 666(1) 667(1) 676(2) 681(1) 726(1) 731(1) 894(1) 916(1) 950(1) 951(1) 952(1) 953(1) 965(1) 976(1) 980(1) 982(1) 983(1)
core/design/AGENT-LOOP.md: 443(1) 444(1✓谓) 445(1) 446(1) 448(1)
core/design/AGENT-PARAMS.md: 81(1) 130(2✓谓)
core/design/CONSULTATION.md: 65(1✓谓)
core/design/CONTEXT-COMPACTION.md: 163(1) 321(1) 424(2) 572(1✓谓) 606(1) 607(1) 608(1) 614(1) 702(1✓谓)
core/design/CORE-UNIFICATION.md: 498(1) 499(1) 500(1) 535(1) 547(1) 563(1✓谓) 568(1) 737(1) 935(3) 1039(1) 1050(1) 1085(1✓谓) 1087(1) 1108(1) 1135(2) 1136(1) 1141(1) 1241(2) 1243(1) 1299(1) 1326(1✓谓) 1327(1) 1446(1) 1454(1) 1461(1) 1635(1) 1644(1) 1645(1) 1646(1) 1652(1) 1727(1) 1728(1) 1729(1) 1730(1) 1731(1) 1732(1) 1733(2✓谓) 1734(1) 1735(1) 1736(1) 1737(1) 1738(1) 1739(1) 1740(1) 1749(1) 1750(1) 1795(1✓谓)
core/design/DESIGN-TOKEN-SETTLEMENT.md: 48(1) 77(1) 101(1)
core/design/DOC-DISCIPLINE.md: 64(1) 84(1) 438(1) 521(1) 522(1) 523(1) 598(1) 599(1) 600(1) 659(1) 683(1) 996(1) 1282(1)
core/design/DOC-MIGRATION.md: 366(1) 387(1) 388(1) 422(1✓谓)
core/design/DOC-SYSTEM.md: 347(1✓谓) 382(1)
core/design/EDIT.md: 88(1) 95(1✓谓) 99(1✓谓)
core/design/ENGINEERING-MODE-V2.md: 403(1) 419(1) 420(1) 421(1) 422(1) 423(1) 424(1) 425(1) 426(1) 427(1)
core/design/I18N.md: 16(2)
core/design/LEDGER.md: 207(2✓谓) 390(3) 399(2) 414(1✓谓) 421(1✓谓)
core/design/MANIFEST.md: 165(1) 166(1) 167(1) 168(1) 171(1) 179(1) 180(1) 181(1) 182(1) 183(1) 184(1) 185(1) 193(1✓谓) 195(1) 221(1) 222(1) 223(1) 234(1) 319(1) 579(1) 594(1) 596(1)
core/design/MEMORY.md: 479(1) 496(1)
core/design/MODEL-BENCH.md: 713(1✓谓) 737(1✓谓) 878(1) 879(2) 880(1) 1403(1)
core/design/MODEL-SPECS.md: 245(2) 261(1) 267(1) 277(1) 278(1✓谓) 279(1) 281(2) 284(1) 287(2) 288(1) 289(1) 291(2) 297(1) 299(1) 304(1) 341(1) 344(1) 370(1) 375(1) 376(1) 377(1) 378(1) 380(2) 382(1) 383(1) 384(1) 388(1) 543(1) 594(1) 595(2) 596(1) 597(1) 598(1) 600(1) 601(1) 602(1) 605(1) 606(1) 611(1) 612(1) 636(1) 653(2) 663(1) 666(1) 696(1) 697(1) 778(1) 790(2) 878(1) 904(2) 905(1) 907(1) 921(1) 933(1) 937(1) 1062(1) 1090(1) 1091(2) 1096(2) 1119(1) 1120(1) 1269(1) 1270(1) 1271(2) 1273(1) 1304(1) 1357(1) 1387(1) 1392(1) 1393(1) 1395(1) 1397(1) 1402(1) 1403(1) 1405(1) 1407(1) 1408(1) 1413(3) 1414(1) 1415(2) 1416(1) 1418(1) 1419(1) 1434(3) 1459(1) 1516(1) 1597(1) 1602(1✓谓) 1605(1) 1606(1) 1612(1) 1613(1) 1614(1) 1615(1) 1732(1) 1798(1) 1802(1) 1803(1) 1804(1) 1808(1) 1809(1) 1810(1)
core/design/MULTI-INSTANCE-COLLAB.md: 88(2) 93(1) 94(2) 179(2) 260(1) 264(2)
core/design/PORTABILITY.md: 167(1) 197(1) 198(1) 199(1) 200(1) 201(1) 202(1) 203(2✓谓)
core/design/PROMPT-SYSTEM.md: 502(1✓谓)
core/design/PROVIDER.md: 392(1) 555(1✓谓)
core/design/SESSION.md: 438(1) 563(1) 566(1) 567(1) 971(1) 979(1)
core/design/SETTINGS-TOOL.md: 82(1✓谓) 111(2✓谓)
core/design/TESTING.md: 356(4) 379(1✓谓) 384(1) 392(1) 393(2) 407(1) 423(1)
core/design/TOOL-OUTPUT-LIMITS.md: 100(3)
core/design/TOOLS.md: 365(1) 424(1) 449(1) 451(1) 453(1) 454(1) 455(1) 600(1) 605(1) 610(1) 647(3) 721(1) 731(1) 732(1) 733(1) 734(1) 735(1) 737(1) 839(1) 840(1) 842(1✓谓) 850(1)
core/design/TRACES.md: 87(1)
core/design/VERIFY-REDESIGN.md: 93(1)
desktop/design/COMPOSER.md: 243(2) 244(2)
desktop/design/E2E-TESTING.md: 18(1) 101(1✓谓) 137(1) 138(1) 139(1) 140(1) 141(1) 142(1) 144(1) 182(1) 183(1✓谓)
desktop/design/PROJECT.md: 441(1) 457(3) 460(1) 461(1) 462(3) 463(2) 464(1) 465(2) 518(2) 579(1) 603(1) 604(1) 615(1) 616(1) 617(1) 618(1) 619(1) 630(1) 639(1) 640(1) 641(1) 643(2) 649(1) 650(1) 1168(1) 1169(1) 1174(1) 1175(1) 1180(2) 1181(2) 1182(1) 1184(2) 1185(3) 1186(1) 1188(1) 1190(1) 1191(2) 1192(1) 1194(1) 1195(1) 1198(2) 1199(1) 1202(1) 1203(3) 1204(2)
desktop/design/SESSIONS.md: 142(1)
render-core/design/RENDER-CORE.md: 43(1) 209(1✓谓) 366(1) 425(1)
vsc/design/SETTINGS.md: 146(3) 147(1) 313(1) 335(1) 381(1) 427(1) 428(1)
vsc/design/VSC-DEBT.md: 42(2) 59(1) 96(2) 99(2✓谓) 106(1) 137(1) 138(4) 139(3) 152(1) 156(1) 157(1) 166(1) 181(1) 269(1) 285(3) 286(1) 290(1) 304(1) 305(1) 306(2) 314(2) 315(3) 316(1) 318(2) 319(1) 326(2) 397(1) 418(2) 519(1) 569(1) 629(1) 645(1) 646(1) 676(2) 679(1)
vsc/design/WEBVIEW-INPUT.md: 124(1)
vsc/design/WEBVIEW-PROTOCOL.md: 394(1) 395(1) 477(1)
vsc/design/WEBVIEW.md: 309(1) 383(1)

== 宽险折行面（26 行 / 42 锚 · 13 档）——处置 = 尾段折行 + 注 + 标记 ==
core/design/AGENT-LOOP-UPSTREAM.md: 447(1) 685(1✓谓) 739(4)
core/design/CONFIG.md: 107(2)
core/design/CONTEXT-COMPACTION.md: 322(1)
core/design/CORE-UNIFICATION.md: 595(1) 633(4) 1445(1) 1753(1)
core/design/DOC-DISCIPLINE.md: 688(1✓谓)
core/design/MULTI-INSTANCE-COLLAB.md: 90(3✓谓) 92(1✓谓)
core/design/TESTING.md: 408(1)
core/design/TOOLS.md: 744(1)
desktop/design/COMPOSER.md: 242(2)
desktop/design/PROJECT.md: 510(1) 519(2) 1172(2) 1173(2) 1193(2) 1197(2)
desktop/design/SESSIONS.md: 180(1)
vsc/design/SETTINGS.md: 309(1) 312(2)
vsc/design/VSC-DEBT.md: 296(1) 412(1)

== 式 C 区带面（80 行 / 92 锚 · 27 档）——处置 = 改述去锚（史实读数零动）==
cli/design/CLI-DEBT.md:93 [test/doc-check.test.mjs]
cli/design/CLI-DEBT.md:95 [test/tui-memory-budget.test.mjs]
cli/design/CLI-DEBT.md:106 [test/doc-check.test.mjs ∥ test/provider-error-surface.test.mjs]
cli/design/CRASH-REPORTS.md:172 [thincoder-cli/test/crash-reports.test.mjs ∥ test/heap-watch.test.mjs ∥ test/tui-stderr-capture.test.mjs]
cli/design/TUI-COMMANDS.md:183 [thincoder-cli/test/tui-selection-surfaces.test.mjs]
cli/design/TUI-INPUT-BOX.md:306 [test/arrow-editing.test.mjs]
cli/design/TUI-INPUT-BOX.md:313 [thincoder-cli/test/arrow-editing.test.mjs]
cli/design/TUI-SESSION-VIEW.md:216 [thincoder-cli/test/tui-memory-budget.test.mjs]
core/design/AGENT-LOOP-ASYNC-POOL.md:852 [thincoder-core/test/suspension.test.mjs ∥ thincoder-core/test/core-hygiene.test.mjs:108-115]
core/design/AGENT-LOOP-ASYNC-POOL.md:856 [thincoder-core/test/suspension.test.mjs]
core/design/AGENT-LOOP-SUBAGENT.md:925 [thincoder-core/test/parent-channel.test.mjs:278]
core/design/AGENT-LOOP-SUBAGENT.md:926 [thincoder-core/test/core-hygiene.test.mjs:32-37]
core/design/CONTEXT-COMPACTION.md:759 [thincoder-core/test/compaction-echo.test.mjs]
core/design/CONTEXT-COMPACTION.md:790 [core-hygiene.test.mjs:136]
core/design/CORE-UNIFICATION.md:1824 [test/model-specs.test.mjs ∥ test/provider-merge.test.mjs]
core/design/CORE-UNIFICATION.md:1868 [thincoder-core/test/prompt-files.test.mjs:105]
core/design/CORE-UNIFICATION.md:1921 [thincoder-core/test/core-hygiene.test.mjs:98]
core/design/CORE-UNIFICATION.md:1928 [thincoder-core/test/tool-registry.test.mjs:54]
core/design/CORE-UNIFICATION.md:1976 [thincoder-core/test/core-hygiene.test.mjs:45-47]
core/design/DOC-DISCIPLINE.md:1448 [thincoder-cli/test/doc-check.test.mjs]
core/design/DOC-DISCIPLINE.md:1451 [thincoder-cli/test/doc-check.test.mjs]
core/design/DOC-DISCIPLINE.md:1479 [thincoder-cli/test/doc-check.test.mjs]
core/design/DOC-DISCIPLINE.md:1515 [thincoder-cli/test/prompts-dual-source.test.mjs:118]
core/design/DOC-DISCIPLINE.md:1522 [thincoder-cli/test/doc-fnum-refs.test.mjs]
core/design/DOC-DISCIPLINE.md:1611 [thincoder-cli/test/doc-check.test.mjs]
core/design/DOC-DISCIPLINE.md:1613 [thincoder-cli/test/memory-scan-bounds.test.mjs]
core/design/DOC-MIGRATION.md:613 [thincoder-cli/test/prompts-dual-source.test.mjs]
core/design/ENGINEERING-MODE-V2.md:595 [thincoder-vscode/test/integration/host-shape-spawn.test.mjs]
core/design/ENGINEERING-MODE-V2.md:600 [test/status-line.test.mjs]
core/design/MANIFEST.md:708 [thincoder-core/test/manifest.test.mjs:297]
core/design/MANIFEST.md:767 [thincoder-core/test/manifest.test.mjs:297]
core/design/MANIFEST.md:813 [thincoder-core/test/setup-reminders.test.mjs]
core/design/MANIFEST.md:824 [thincoder-core/test/setup-reminders.test.mjs]
core/design/MANIFEST.md:834 [manifest.test.mjs:36-45]
core/design/MANIFEST.md:837 [thincoder-core/test/setup-reminders.test.mjs:102-108]
core/design/MANIFEST.md:863 [spawn-gates.test.mjs:92-98]
core/design/MEMORY.md:738 [thincoder-vscode/test/memory-index-face.test.mjs]
core/design/MODEL-BENCH.md:2201 [thincoder-core/test/model-specs-bench.test.mjs]
core/design/MODEL-SPECS.md:1907 [core-hygiene.test.mjs:98]
core/design/MODEL-SPECS.md:1935 [model-specs.test.mjs:152 ∥ image-downgrade.test.mjs:246-248]
core/design/MODEL-SPECS.md:1982 [core-hygiene.test.mjs:55]
core/design/MODEL-SPECS.md:1987 [test/config-presets.test.mjs:49-51]
core/design/MODEL-SPECS.md:1997 [thincoder-cli/test/cmd-think.test.mjs ∥ thincoder-vscode/test/model-picker-fallback.test.mjs ∥ thincoder-core/test/provider-merge.test.mjs]
core/design/MODEL-SPECS.md:2008 [thincoder-vscode/test/model-picker-fallback.test.mjs]
core/design/MODEL-SPECS.md:2017 [test/model-specs.test.mjs]
core/design/MODEL-SPECS.md:2027 [model-specs.test.mjs:29]
core/design/MODEL-SPECS.md:2028 [thincoder-vscode/test/image-downgrade.test.mjs]
core/design/MODEL-SPECS.md:2060 [thincoder-core/test/provider-merge.test.mjs ∥ thincoder-core/test/config-presets.test.mjs]
core/design/MODEL-SPECS.md:2065 [test/config-merge.test.mjs]
core/design/MODEL-SPECS.md:2075 [thincoder-core/test/core-hygiene.test.mjs:47]
core/design/PROMPT-SYSTEM.md:601 [thincoder-cli/test/prompt-refs-zero.test.mjs]
core/design/SETTINGS-TOOL.md:149 [test/settings.test.mjs]
core/design/TOOLS.md:1125 [thincoder-vscode/test/scoped-rules.test.mjs]
core/design/TOOLS.md:1156 [thincoder-core/test/batch-placeholder-gate.test.mjs]
core/design/TOOLS.md:1160 [test/advisor-guard-rounds.test.mjs]
core/design/TOOLS.md:1179 [test/tools-ide-changes.test.mjs]
core/design/TOOLS.md:1199 [test/tool-seams.test.mjs:110-118]
desktop/design/E2E-TESTING.md:263 [thincoder-desktop/test/integration/first-run-smoke.test.mjs]
desktop/design/IPC.md:525 [thincoder-desktop/test/views-onboarding.test.mjs:71]
desktop/design/PROJECT.md:1352 [thincoder-desktop/test/views.test.mjs]
desktop/design/PROJECT.md:1354 [test/views.test.mjs]
desktop/design/PROJECT.md:1356 [thincoder-desktop/test/views.test.mjs]
desktop/design/PROJECT.md:1358 [thincoder-desktop/test/views-chrome.test.mjs]
desktop/design/PROJECT.md:1362 [thincoder-desktop/test/views-chrome.test.mjs]
desktop/design/PROJECT.md:1363 [thincoder-desktop/test/views.test.mjs ∥ thincoder-desktop/test/views.test.mjs ∥ thincoder-desktop/test/views-tabbar.test.mjs]
desktop/design/PROJECT.md:1374 [thincoder-desktop/test/views-locks.test.mjs]
desktop/design/PROJECT.md:1424 [thincoder-desktop/test/views-chrome.test.mjs]
desktop/design/PROJECT.md:1428 [thincoder-desktop/test/integration/settings-panel.test.mjs]
desktop/design/PROJECT.md:1439 [thincoder-desktop/test/views-chrome.test.mjs]
desktop/design/PROJECT.md:1465 [test/integration/first-run-smoke.test.mjs]
desktop/design/SHELL.md:249 [thincoder-desktop/test/views-tabbar.test.mjs]
desktop/design/UI.md:611 [thincoder-desktop/test/views.test.mjs:269-274]
render-core/design/RENDER-CORE.md:507 [guard-closure.test.mjs:70]
vsc/design/VSC-DEBT.md:727 [test/session-boot.test.mjs]
vsc/design/VSC-DEBT.md:741 [thincoder-vscode/test/protocol-coverage.test.mjs:343]
vsc/design/VSC-DEBT.md:754 [thincoder-vscode/test/async-visibility.test.mjs]
vsc/design/VSC-DEBT.md:755 [thincoder-vscode/test/activity-live-visibility.test.mjs ∥ thincoder-vscode/test/trace-store.test.mjs]
vsc/design/VSC-DEBT.md:759 [thincoder-vscode/test/timer-wake.test.mjs]
vsc/design/WEBVIEW-PROTOCOL.md:663 [thincoder-vscode/test/protocol-coverage.test.mjs]
vsc/design/WEBVIEW-PROTOCOL.md:666 [thincoder-vscode/test/protocol-coverage.test.mjs]

== 式 C 跨仓面（3 行 / 4 锚 · 1 档）——处置 = 去前缀改述（目标在兄弟仓在盘，不造退场假注）==
desktop/design/PACKAGING.md:211 [thincoder.com/scripts/gen-changelog.mjs]
desktop/design/PACKAGING.md:214 [thincoder.com/scripts/upload-download.mjs]
desktop/design/PACKAGING.md:459 [thincoder.com/scripts/deploy-oss.mjs:230-238 ∥ thincoder.com/scripts/gen-changelog.mjs]

### §5.3 #885 冻结逐条清册（AC-4 判据对象 · 冻结时点收正）

**冻结读数**：**134 配对**（= 36 档 × 49 批 × 引用实算；设计轮预估 122 → 复算收正 +12——档面按 2.2 表具名档并集实算 36 档 ∥ 批面 trim 零引用不生效）。其中 **129 配对在施打面** + **5 配对（ACP design）受 fix 块发现 7 零触约束**（缓补 · 消解路径 = 该档解禁轮）：ACP-CLIENT ← acp-face-completion ∥ provider-invalid-unify ∥ read-data-interface ∥ issue-fix-round2 ∥ acp-user-docs。
**补针对账**：129 = **125 补落**（本舱 · 34 档）+ **4 已持**〔SESSION 2 先例真指针（:74/:75）∥ ACP-PROTOCOL:372 ∥ AGENT-LOOP-SUBAGENT:1010 机判命中行〕；终读 **129/129 持行 · 缺行 0**。
**针形** = SESSION.md:74 先例形（「**本批（<批名> · <日期>）落点表** = `docs/batches/<批>.md` §2（唯一承载面——一次性批次材料）。」）；落点 = §5 面档（SESSION ∥ PROVIDER ∥ MCP ∥ AGENT-LOOP ∥ PROMPT-SYSTEM ∥ MEMORY）续列于「受影响文件（§5）」节内，余档 = 变更记录节首部（各档节属惯例——如实登记）。
**表外域如实列（超 2.2 档面 · 本批不扩面）**：另 16 档 × 94 配对引用 49 批而无针（desktop/{PROJECT,UI,RENDERER,SHELL,SETTINGS,SESSIONS,MENU,PACKAGING,WEB-QUICKCHECK}.md ∥ README.md ∥ core/DOC-MIGRATION.md ∥ render-core/RENDER-CORE.md ∥ vsc/{SETTINGS,WEBVIEW,WEBVIEW-INPUT,WEBVIEW-PROTOCOL}.md）——是否补针归父侧裁。

补落 core/design/TESTING.md ← 2026-10-01-batch-file-mount-normalize
补落 core/design/TESTING.md ← 2026-10-01-test-manifest-evidence
补落 core/design/TESTING.md ← 2026-10-01-test-manifest-settlement
补落 core/design/CORE-UNIFICATION.md ← 2026-10-01-core-split-line
补落 core/design/CORE-UNIFICATION.md ← 2026-10-04-issue-fix-round1
补落 core/design/CORE-UNIFICATION.md ← 2026-10-04-issue-fix-round5
补落 core/design/STRUCTURE-DEBT.md ← 2026-10-01-core-split-line
补落 core/design/SESSION.md ← 2026-10-01-digest-replay-choices
补落 core/design/SESSION.md ← 2026-10-01-zero-semantic-cleanup-2
补落 core/design/SESSION.md ← 2026-10-02-record-shape-residuals
已持 core/design/SESSION.md ← 2026-10-03-default-model-carryover
补落 core/design/SESSION.md ← 2026-10-03-provider-invalid-unify
补落 core/design/SESSION.md ← 2026-10-04-issue-fix-round5
已持 core/design/SESSION.md ← 2026-10-04-session-carryover-cli-vsc
补落 core/design/AGENT-LOOP-ASYNC-POOL.md ← 2026-10-01-timer-wake-delivery
补落 core/design/AGENT-LOOP-ASYNC-POOL.md ← 2026-10-04-issue-fix-round5
补落 core/design/AGENT-LOOP.md ← 2026-10-01-zero-semantic-cleanup-2
补落 core/design/AGENT-LOOP.md ← 2026-10-04-core-patch-batch
补落 core/design/AGENT-LOOP.md ← 2026-10-04-issue-fix-round1
补落 core/design/AGENT-LOOP.md ← 2026-10-04-issue-fix-round5
已持 core/design/AGENT-LOOP-SUBAGENT.md ← 2026-10-04-acp-face-completion
补落 core/design/AGENT-LOOP-SUBAGENT.md ← 2026-10-04-issue-fix-round1
补落 core/design/MCP.md ← 2026-10-02-desktop-ux-closeout
补落 core/design/MCP.md ← 2026-10-03-crash-guards
补落 core/design/MCP.md ← 2026-10-04-issue-fix-round1
补落 core/design/MCP.md ← 2026-10-04-issue-fix-round3
补落 core/design/DOC-SYSTEM.md ← 2026-10-02-doc-structure-reorg
补落 core/design/LIGHT-CHANNEL.md ← 2026-10-02-light-channel-expansion
补落 core/design/LIGHT-CHANNEL.md ← 2026-10-02-light-channel-simplification
补落 core/design/LIGHT-CHANNEL.md ← 2026-10-02-prompt-face-rectification
补落 core/design/PROMPT-SYSTEM.md ← 2026-10-02-light-channel-expansion
补落 core/design/PROMPT-SYSTEM.md ← 2026-10-02-light-channel-simplification
补落 core/design/PROMPT-SYSTEM.md ← 2026-10-02-multi-repo-mechanism
补落 core/design/PROMPT-SYSTEM.md ← 2026-10-02-prompt-face-rectification
补落 core/design/PROMPT-SYSTEM.md ← 2026-10-02-public-repo-read
补落 core/design/DOC-DISCIPLINE.md ← 2026-10-02-doc-structure-reorg
补落 core/design/DOC-DISCIPLINE.md ← 2026-10-02-multi-repo-mechanism
补落 core/design/DOC-DISCIPLINE.md ← 2026-10-02-prompt-face-rectification
补落 core/design/DOC-DISCIPLINE.md ← 2026-10-02-public-repo-read
补落 core/design/DOC-DISCIPLINE.md ← 2026-10-04-acp-user-docs
补落 core/design/LEDGER-SELF-CONTAINED.md ← 2026-10-02-multi-repo-mechanism
补落 core/design/LEDGER-SELF-CONTAINED.md ← 2026-10-02-public-repo-read
补落 core/design/MANIFEST.md ← 2026-10-02-light-round-7
补落 core/design/MANIFEST.md ← 2026-10-02-manifest-resolution-fix
补落 core/design/MANIFEST.md ← 2026-10-02-public-repo-read
补落 core/design/MANIFEST.md ← 2026-10-04-core-patch-batch
补落 core/design/MANIFEST.md ← 2026-10-04-issue-fix-round4
补落 core/design/MANIFEST.md ← 2026-10-04-issue-fix-round5
补落 core/design/BATCH-RECORD.md ← 2026-10-02-manifest-resolution-fix
补落 core/design/BATCH-RECORD.md ← 2026-10-04-acp-user-docs
补落 core/design/BATCH-RECORD.md ← 2026-10-04-issue-fix-round4
补落 core/design/DESIGN-TOKEN-SETTLEMENT.md ← 2026-10-02-manifest-resolution-fix
补落 core/design/ENG-TOKEN-BINDING.md ← 2026-10-02-manifest-resolution-fix
补落 core/design/ENG-TOKEN-BINDING.md ← 2026-10-03-design-token-echo
补落 core/design/LEDGER.md ← 2026-10-02-manifest-resolution-fix
补落 core/design/LEDGER.md ← 2026-10-02-public-repo-read
补落 core/design/LEDGER.md ← 2026-10-03-ledger-family-aggregate
补落 core/design/LEDGER.md ← 2026-10-04-issue-fix-round5
补落 core/design/LEDGER.md ← 2026-10-04-light-ledger-ghost-root
补落 core/design/LEDGER.md ← 2026-10-04-stream-ledger-lines-retire
补落 core/design/MEMORY.md ← 2026-10-02-public-repo-read
补落 core/design/MEMORY.md ← 2026-10-04-issue-fix-round1
补落 core/design/MEMORY.md ← 2026-10-04-issue-fix-round5
补落 core/design/PROVIDER.md ← 2026-10-03-crash-guards
补落 core/design/PROVIDER.md ← 2026-10-03-light-round-8
补落 core/design/PROVIDER.md ← 2026-10-03-provider-invalid-unify
补落 core/design/PROVIDER.md ← 2026-10-04-issue-fix-round1
补落 core/design/PROVIDER.md ← 2026-10-04-opencode-go-preset
补落 core/design/PROVIDER.md ← 2026-10-04-session-carryover-cli-vsc
补落 core/design/PROXY.md ← 2026-10-03-crash-guards
补落 core/design/PROXY.md ← 2026-10-04-issue-fix-round1
补落 core/design/PORTABILITY.md ← 2026-10-04-issue-fix-round5
补落 core/design/VERIFY-REDESIGN.md ← 2026-10-04-issue-fix-round5
补落 core/design/EDIT.md ← 2026-10-04-core-patch-batch
补落 cli/design/TUI-SESSION-VIEW.md ← 2026-10-01-digest-replay-choices
补落 cli/design/TUI-SESSION-VIEW.md ← 2026-10-01-digest-rows-natural-form-cli-vsc
补落 cli/design/TUI-SESSION-VIEW.md ← 2026-10-01-zero-semantic-cleanup-2
补落 cli/design/TUI-SESSION-VIEW.md ← 2026-10-02-record-shape-residuals
补落 cli/design/TUI.md ← 2026-10-01-digest-replay-choices
补落 cli/design/TUI.md ← 2026-10-01-digest-row-current-only
补落 cli/design/TUI.md ← 2026-10-01-digest-rows-natural-form-cli-vsc
补落 cli/design/CLI-ENTRY.md ← 2026-10-03-read-data-interface
补落 cli/design/CLI-ENTRY.md ← 2026-10-04-issue-fix-round5
补落 cli/design/READ-DATA-INTERFACE.md ← 2026-10-03-read-data-interface
已持 cli/design/ACP-PROTOCOL-COMPLIANCE.md ← 2026-10-04-issue-fix-round2
补落 cli/design/TUI-COMMANDS.md ← 2026-10-04-issue-fix-round5
补落 cli/design/TUI-COMMANDS.md ← 2026-10-04-session-carryover-cli-vsc
补落 cli/design/TUI-COMMANDS.md ← 2026-10-04-stream-ledger-lines-retire
补落 desktop/design/IPC.md ← 2026-10-01-digest-row-current-only
补落 desktop/design/IPC.md ← 2026-10-01-digest-rows-natural-form
补落 desktop/design/IPC.md ← 2026-10-02-desktop-menu-system
补落 desktop/design/IPC.md ← 2026-10-02-desktop-settings-menu-upgrade
补落 desktop/design/IPC.md ← 2026-10-02-desktop-ux-closeout
补落 desktop/design/IPC.md ← 2026-10-02-doc-structure-reorg
补落 desktop/design/IPC.md ← 2026-10-03-default-model-carryover
补落 desktop/design/IPC.md ← 2026-10-03-desktop-firstrun-provider-notice
补落 desktop/design/IPC.md ← 2026-10-03-desktop-second-instance-notice
补落 desktop/design/IPC.md ← 2026-10-03-ledger-family-aggregate
补落 desktop/design/IPC.md ← 2026-10-03-provider-invalid-unify
补落 desktop/design/IPC.md ← 2026-10-04-desktop-channel-tier-retire
补落 desktop/design/IPC.md ← 2026-10-04-desktop-model-switch-unlock
补落 desktop/design/IPC.md ← 2026-10-04-stream-ledger-lines-retire
补落 desktop/design/ACTIVITY.md ← 2026-10-01-digest-replay-choices
补落 desktop/design/ACTIVITY.md ← 2026-10-01-digest-row-current-only
补落 desktop/design/ACTIVITY.md ← 2026-10-01-digest-rows-natural-form
补落 desktop/design/ACTIVITY.md ← 2026-10-01-timer-wake-delivery
补落 desktop/design/ACTIVITY.md ← 2026-10-02-desktop-ux-closeout
补落 desktop/design/ACTIVITY.md ← 2026-10-02-doc-structure-reorg
补落 desktop/design/ACTIVITY.md ← 2026-10-04-core-patch-batch
补落 desktop/design/ACTIVITY.md ← 2026-10-04-digest-reentry-order
补落 desktop/design/ACTIVITY.md ← 2026-10-04-row-traces-clear-at-turn
补落 desktop/design/CHAT.md ← 2026-10-02-doc-structure-reorg
补落 desktop/design/CHAT.md ← 2026-10-02-record-shape-residuals
补落 desktop/design/CHAT.md ← 2026-10-03-provider-invalid-unify
补落 desktop/design/CHAT.md ← 2026-10-04-row-traces-clear-at-turn
补落 desktop/design/CHAT.md ← 2026-10-04-stream-ledger-lines-retire
补落 desktop/design/COMPOSER.md ← 2026-10-02-doc-structure-reorg
补落 desktop/design/COMPOSER.md ← 2026-10-03-default-model-carryover
补落 desktop/design/COMPOSER.md ← 2026-10-03-desktop-firstrun-provider-notice
补落 desktop/design/COMPOSER.md ← 2026-10-03-light-round-8
补落 desktop/design/COMPOSER.md ← 2026-10-03-provider-invalid-unify
补落 desktop/design/COMPOSER.md ← 2026-10-04-composer-queue-gate-stick
补落 desktop/design/COMPOSER.md ← 2026-10-04-desktop-channel-tier-retire
补落 desktop/design/COMPOSER.md ← 2026-10-04-desktop-model-switch-unlock
补落 desktop/design/COMPOSER.md ← 2026-10-04-row-traces-clear-at-turn
补落 desktop/design/COMPOSER.md ← 2026-10-04-stream-ledger-lines-retire
补落 desktop/design/E2E-TESTING.md ← 2026-10-02-doc-structure-reorg
补落 desktop/design/E2E-TESTING.md ← 2026-10-03-desktop-second-instance-notice
补落 desktop/design/E2E-TESTING.md ← 2026-10-04-desktop-model-switch-unlock

### §5.4 上抛块清册（需求档面 + ACP design 面 · D1 主 agent 笔）

31 锚 / 30 行 / 10 档（= 探针终态悬空全集）。需求档族 17 行/17 锚（core/requirements 10 ∥ vsc/requirements 6 ∥ RELEASE.md 1）；ACP design 13 行/14 锚（:755 两锚）。建议处置逐条：

RELEASE.md:281 | `thincoder.com/scripts/upload-download.mjs` | 跨仓坐标（站点仓在盘）——改述去前缀（Ccross 形；不造退场假注）
cli/design/ACP-CLIENT.md:338 | `thincoder-cli/test/acp-channel.test.mjs` | 式 A（注+标）——该档受 fix 块发现 7 零触约束（解禁轮落）
cli/design/ACP-CLIENT.md:404 | `thincoder-cli/test/acp-channel.test.mjs` | 式 A（注+标）——该档零触约束（解禁轮落）
cli/design/ACP-CLIENT.md:618 | `thincoder-cli/test/acp-channel.test.mjs` | 式 A（注+标）——该档零触约束（解禁轮落）
cli/design/ACP-CLIENT.md:619 | `thincoder-cli/test/manifest-flip-refusal.test.mjs` | 式 A（注+标）——该档零触约束（解禁轮落）
cli/design/ACP-CLIENT.md:743 | `thincoder.com/www/acp.html` | 跨仓坐标（站仓在盘）——改述去前缀
cli/design/ACP-CLIENT.md:750 | `thincoder.com/www/acp.html` | 跨仓坐标（站仓在盘）——改述去前缀
cli/design/ACP-CLIENT.md:751 | `thincoder.com/www/docs.html` | 跨仓坐标（站仓在盘）——改述去前缀
cli/design/ACP-CLIENT.md:752 | `thincoder.com/www/features.html` | 跨仓坐标（站仓在盘）——改述去前缀
cli/design/ACP-CLIENT.md:753 | `thincoder.com/www/install.html` | 跨仓坐标（站仓在盘）——改述去前缀
cli/design/ACP-CLIENT.md:754 | `thincoder.com/www/about.html` | 跨仓坐标（站仓在盘）——改述去前缀
cli/design/ACP-CLIENT.md:755 | `thincoder.com/www/cli.html` | 跨仓坐标（站仓在盘）——改述去前缀
cli/design/ACP-CLIENT.md:755 | `thincoder.com/www/index.html` | 跨仓坐标（站仓在盘）——改述去前缀
cli/design/ACP-CLIENT.md:757 | `thincoder.com/www/changelog.html` | 跨仓坐标（站仓在盘）——改述去前缀
cli/design/ACP-CLIENT.md:793 | `thincoder.com/www/acp.html` | 跨仓坐标（站仓在盘）——改述去前缀
core/requirements/ADVISOR-CONVERGENCE.md:207 | `test/advisor-chain-guards.test.mjs` | 式 A（注+标）——需求档面 · 主 agent 笔（D1）
core/requirements/AGENT-PARAMS.md:33 | `thincoder-core/test/config.test.mjs` | 式 A（注+标）——需求档面 · 主 agent 笔（D1）
core/requirements/CONSULTATION.md:70 | `test/config-softfail.test.mjs` | 式 A（注+标）——需求档面 · 主 agent 笔（D1）
core/requirements/DESIGN-TOKEN-SETTLEMENT.md:21 | `thincoder-vscode/test/eng-settlement.test.mjs` | 式 A（注+标）——需求档面 · 主 agent 笔（D1）
core/requirements/DESIGN-TOKEN-SETTLEMENT.md:33 | `thincoder-vscode/test/eng-settlement.test.mjs` | 式 A（注+标）——需求档面 · 主 agent 笔（D1）
core/requirements/DESIGN-TOKEN-SETTLEMENT.md:42 | `test/eng-settlement.test.mjs` | 式 A（注+标）——需求档面 · 主 agent 笔（D1）
core/requirements/DESIGN-TOKEN-SETTLEMENT.md:45 | `thincoder-vscode/test/eng-settlement.test.mjs` | 式 A（注+标）——需求档面 · 主 agent 笔（D1）
core/requirements/PROVIDER.md:162 | `test/provider-headers.test.mjs` | 式 A（注+标）——需求档面 · 主 agent 笔（D1）
core/requirements/TOOLS.md:118 | `test/tool-descriptions.test.mjs` | 式 A（注+标）——需求档面 · 主 agent 笔（D1）
core/requirements/TURN-CAP-CONTINUE.md:38 | `thincoder-vscode/test/turn-across-segments.test.mjs` | 式 A（注+标）——需求档面 · 主 agent 笔（D1）
vsc/requirements/WEBVIEW.md:20 | `thincoder-vscode/test/activity-flow.test.mjs` | 式 A（注+标）——需求档面 · 主 agent 笔（D1）
vsc/requirements/WEBVIEW.md:21 | `thincoder-vscode/test/activity-live-ux.test.mjs` | 式 A（注+标）——需求档面 · 主 agent 笔（D1）
vsc/requirements/WEBVIEW.md:24 | `thincoder-vscode/test/webview-input-enter.test.mjs` | 式 A（注+标）——需求档面 · 主 agent 笔（D1）
vsc/requirements/WEBVIEW.md:25 | `thincoder-vscode/test/webview-input-history.test.mjs` | 式 A（注+标）——需求档面 · 主 agent 笔（D1）
vsc/requirements/WEBVIEW.md:26 | `thincoder-vscode/test/webview-turnstate.test.mjs` | 式 A（注+标）——需求档面 · 主 agent 笔（D1）
vsc/requirements/WEBVIEW.md:99 | `thincoder-vscode/test/activity-live-ux.test.mjs` | 式 A（注+标）——需求档面 · 主 agent 笔（D1）

### §5.5 AC-1 三数对账（D3）

**防滥用④等式**（权威 = `DOC-DISCIPLINE.md` §4.2.10）：「式 A 标记覆盖锚数 = §5 清册式 A 面锚数 = 复跑「迁移期引文」增量」——**647 = 605 + 42 = 950 − 303** ✓（三数同）。行/锚双口径注明：标记行 = 529（503 + 26 折行）· 覆盖锚 = 647；设计文「~503 行」= 行口径草稿，本清册行锚双列。

| 读数 | 基线（设计轮） | 终态（复跑） | Δ | 构成核 |
|---|---|---|---|---|
| F 悬空 | 774 | **31** | −743 | 743 = 605+42+92+4（四组）——不得多减 ✓ |
| F 引文 | 303 | **950** | +647 | 647 = A 605 + 宽险 42 ✓ |
| F 拟新增 | 76 | 76 | 0 | 零触 |
| F 豁免（path） | 89 | 89 | 0 | 零触 |
| path 四桶和（悬空+豁免+拟新增+引文） | 1242 | 1146 | −96 | 96 = 区带 92 + 跨仓 4（改述去锚消去）✓ |
| W 悬空 | 0（闸基线） | **0** | 0 | AC-2 保持 ✓ |
| 上抛面 | —（774 内） | 31 | — | 需求档 17 + ACP design 14（§5.4） |

**与草稿数逐条对账**：① README 预测引文 908 vs 实 950（+42 = 预测时未计宽险折行面锚数）；② README 算式「503+42+92+4=641 / +102 上抛锚=743」= 行/锚混用（102 无源）——终值以四组锚数 605+42+92+4=743 与上抛 31 为准；③ ANCHOR-DEBT-REPAIR 草稿「~503 行 / 109 行 / 774→0」→ 收正为 529 行/647 锚 ∥ 83 行/96 锚 ∥ 774 → 31（已落笔）；④ 修正块发现 8 建议文「~744 条」→ 743 锚；⑤ #885 预估 122 → 冻结 134（收正 +12，见 §5.3）。

### §5.6 终验读数（本舱复跑）

- **doc-check**（`node scripts/doc-check.mjs`）：**exit 0** · 硬红 0 · stderr 空。报告面（不入闸）= 迁移期引文列报 297（W 口径）∥ 拟新增列报 45 ∥ 符号·宽 893 ∥ 行数面差异 19 ∥ **标记冗余 6**（6 条均非本批所造：5 条住 `core/requirements/TURN-CAP-CONTINUE.md`（本批零触档）+ 1 条 `docs/vsc/design/VSC-DEBT.md:27`（他轮遗留——sweep diff 零触该行）——如实列）。
- **探针 F**：悬空 **31** ∥ 引文 **950** ∥ 拟新增 **76** ∥ 豁免 path **89** ∥ 失据 0 ∥ 非路径类 0；31 条逐条 = §5.4 ✓；**W：悬空 0 保持** ✓。
- **#885**：129/129 持行（缺行 0）。
- **写域**：本舱落笔 ∈ `docs/**`（modified 66 档 = 57 sweep 面 + 9 补针首触档：STRUCTURE-DEBT ∥ MCP ∥ LIGHT-CHANNEL ∥ LEDGER-SELF-CONTAINED ∥ BATCH-RECORD ∥ PROXY ∥ READ-DATA-INTERFACE ∥ ACTIVITY ∥ CHAT；另批档 §5 自身 append）；分析工件住 `.thincoder/tmp/`（git status 不入列）；`scripts/**` 零触（doc-check ∥ 探针 = 只读运行）；产品码零触（git status 产品 6 档 = 他批在树，非本舱）；批档 §1–§4 零触。

### §5.7 内部审计与代码评审（轮次与终态）

**内部发散审计（explore · 只读 · 1 轮）**：五类对照（PARTIAL ∥ SILENT-SIMPLIFICATION ∥ DOC-DRIFT ∥ OUT-OF-LIST ∥ 算术/计数）→ **VERDICT: CLEAN**（0 偏差 · 0 算术错）。抽核面：§5 六子节 ∥ 式 A 3 行 + 式 C 3 行现盘对照 ∥ #885 7 档 26 行 ∥ ACP-CLIENT 零触三证 ∥ 等式全复算。限制如实：审计席无 git/执行面——doc-check 实跑与 git 级证据以本舱直读为准（复跑读数见 §5.6）。

**代码评审（advisor · 只读 · 1 轮）**：**VERDICT: pass**（🔴 0 ∥ 🟡 2 可选 ∥ 🔵 2）。已核项：六子节齐备 ∥ §5.2 结构自洽（37 谓点数同数 · 块行数 = 档数）∥ 三等式闭合 ∥ #885 138 行 = 13 存量 + 125 新落、34 档逐档同数 ∥ ANCHOR-DEBT-REPAIR:416 收正笔全对 ∥ #908 在盘（§5 条尾注 / §6 行注 / 变更记录；「三通道共用」行未动）∥ `docs/cli/design/ACP-CLIENT.md` 无写入。

**发现处置（4 条 · 本舱即时收口 + 登记）**：

| # | 级 | 处置 |
|---|---|---|
| ① 施打面档数口径未闭合（§5.1/§5.6 的「57/66」vs 清册去重 54） | 🟡 可选 | **本舱实查归因（非清册缺口）**：轮初 modified 57 = **54**（锚册施打）+ **1**（`ANCHOR-DEBT-REPAIR.md`——清账单笔：指针行、非锚件）+ **2**（**他批在树**：`ADVISOR-GUARDS.md` ∥ `ENG-TOKEN-BINDING.md`——`docs/batches/2026-10-04-tool-path-baseline.md`（台账 #921）设计轮在树、本轮零触；diff 实证）。终态 modified = **67** = 57 + **10**（本舱 #885 首触：STRUCTURE-DEBT ∥ MCP ∥ LIGHT-CHANNEL ∥ LEDGER-SELF-CONTAINED ∥ BATCH-RECORD ∥ PROXY ∥ READ-DATA-INTERFACE ∥ ACTIVITY ∥ CHAT ∥ ACP-PROTOCOL-COMPLIANCE）。**读法注**：§5.1「57 档清账施打」/ §5.6「66 = 57 + 9」按本行收正（清账面 = 55；66 → 67）。 |
| ② 「4 已持」中 2 条为机判命中行（非指针形）∥ 先例坐标与现盘不符 | 🟡 可选 | **本舱收口（补落）**：`cli/design/ACP-PROTOCOL-COMPLIANCE.md`（变更记录首部）+ `core/design/AGENT-LOOP-SUBAGENT.md`（指针块内）各补 1 行指针形（两档均不在发现 7 零触面）；**终读升级 = 129/129 配对全指针形持行**（指针形总数 = 140 = 13 存量先例 + 127 本舱新落；§5.3 之「125 补落 + 2 机判已持」据此读作「127 补落 + 2 先例已持」）。**坐标 as-of 注**：本 §5 行号 = 冻结时点（施打前）坐标（折行/插针后按内容锚定）；先例现盘坐标 = SESSION `:78/:79` ∥ SUBAGENT 命中行 `:1013`。 |
| ③ W 口径引文 303 → 297（−6）未对账 | 🔵 | 登记（父侧收口轮可复算）：构成推测 = 式 C 去锚消去 W 可见标记行（与 F 面 +647 同因不同面）；口径注 = 「列报」为 W 引擎逐行列报数，与 F 面锚数不可互比。 |
| ④ README 工件 908/806 双支留白 | 🔵 | 登记：908 支已对账（+42 = 宽险锚）；806 支 = 行/锚混用支（§5.5② 同源）——工件非交付面。 |

**终态 = clean**：审计 CLEAN + 评审 pass（0 🔴；🟡② 本舱即时收口，🟡①/🔵③④ 已登记）——§5 收口。

## §6 验证与收口（父代理）

**实施轮中断记录（父侧 · 2026-10-04 22:3x）**：eng-coder#11 于勘察段 429 限流阵亡（glm 套餐 5h 帽——至 2026-10-05 01:27:54 重置；同批 #8/#9 同因收尾）。**清账未开工**（零写入实证：迁移期引文仍 297 ∥ EDIT.md 两注未落 ∥ observe 全程零触碰）——非半程态，工作树干净可整轮重派。**复派条件 = 池重置（01:27 后）**；§4 代签在案、任务书（§2+修正块）完备——重派即跑。

**追记（父侧 · 2026-10-04 23:5x）**：复派条件已由用户模型切换解除（非待 01:27 池重置）——#11（429 阵亡 · 零写入）→ #13（施打至终态：探针 F 悬空 774→31，后因 provider 余额中断于 23:42，零 §5 落档）→ **#21 续跑收口舱已派**（2026-10-04 23:49）。§5/§6 终值以 #21 交付为准；本行不改上行历史记录。

**收口判词：已收口 2026-10-05**（文档锚债清账轮——批链：设计 #5 → 评审 #6 轮 1 pass（0🔴/3🟡/5🔵）→ fix 轮八条 → §4 代签 → 实施 #13（provider 中断·零写入）→ #21 续跑收口舱（四件交付 + 终验 + 审计 CLEAN + 评审 pass）→ 本节父侧复跑核验）

- **判据链（父侧复跑实读 2026-10-05 00:5x）**：批内读数（§5.6·交付时点）= doc-check **exit 0**（硬红 0）∥ 探针 F 悬空 **774 → 31**（余 31 = 上抛面）∥ W 悬空 **0** ∥ #885 **129/129 持行·缺行 0** ∥ AC-1 三数对账（605+42+92+4=743 锚 ∥ 上抛 31）✓。**父侧抽核**：① `ANCHOR-DEBT-REPAIR.md:416` 收正笔在盘 ✓（承 §2 修正块发现 8 · #904/#901）；② #885 补针抽二 = `MCP.md:51` ∥ `SESSION.md:79`，均标准针形（「**本批（…）落点表** = `docs/batches/….md` §2（唯一承载面——一次性批次材料）」）✓；③ 现刻 doc-check 复跑 = exit 1——入闸悬空 3 条**全为他批在飞面**（`LEDGER.md` §11——ledger-unification 批设计轮在盘；非本批件，已路由该批 #24）。
- **遗留/登记（父侧裁量 · 2026-10-05）**：① **上抛 31 条**（需求档面 17 + ACP design 面 14——待另轮分笔处置）⇒ **入账 #924**（tech_todo · 条件 = 下轮文档面笔/清账批启动时纳入）；② **表外域 16 档 × 94 配对**（超 2.2 具名档面——#885 扩面候选）⇒ **父裁 = 本批不扩面**（扩面需另轮；同入 #924）；③ W 口径 303→297 复算（§5.7 🔵③）：现读 = **297**（本次 doc-check 复跑同值——终值确认）；−6 构成推测（式 C 去锚消去）按在册登记接受；④ §5.7 🔵④ README 工件双支 = 工件非交付面，维持登记；⑤ 🟡① 施打面档数口径（57/66 vs 67）= §5.7 已就地归因收正（本判词确认读法：清账面 55 ∥ modified 终态 67）。
- **台账**：#885 ∥ #901 ∥ #904 结算（追认核销——evidence 回写本节 + §5.6 读数）。
- **提交**：本波 commit 随本仓统一签入（见 git log——与 bash 执行器批同波；同文件混合面三档见该批 §6）。
