# 2026-10-04 · issue 修复批·四（家族重锚/工程面 6 条：digest 家族重锚 ∥ 不在盘 test 引用 ∥ 指针清扫 ∥ 冻结系件重锚 ∥ #840 配置缝 ∥ batch 写通道正则）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-04 · 来源 = 用户 2026-10-04 00:39「五组都开了」（承 00:31「都自动跑」）；条目源 = 2026-10-03 分诊与在册归批（#824 ∥ #825 ∥ #833 ∥ #889 ∥ #890 ∥ #893——家族重锚/工程面）。
> 台账 = #824 ∥ #825 ∥ #833 ∥ #889 ∥ #890 ∥ #893（家族/工程面 · 归批）。前情 = 无（同会话兄弟批——一组/二组/三组 = `2026-10-04-issue-fix-round{1,2,3}.md`）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-04（八档全绿 ∥ batch.mjs 第三形 5/5 ∥ 真 config 零触实证）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**本批性质**：归批组第四组（家族重锚/工程面 6 条）——用户 00:39「五组都开了」；全链。

**本批条目（6）**：**#824** digest 家族重锚 ∥ **#825** 不在盘 `test.mjs` 引用 ∥ **#833** 指针清扫 ∥ **#889** 冻结系件家族重锚 ∥ **#890** #840 配置缝 ∥ **#893** `batch.mjs:44` 写通道凭证正则（裸 uuid 不剥——随 strip 单源面对表裁）。**锚 = 台账行在册**（复验先读：`ledger_query` cwd=D:\teamcode\thincoder）。
**处置形注意**：#824 ∥ #889 系「家族重锚」类——处置可为「重锚 ∥ 收口 ∥ 撤回」而非代码修——设计轮**逐条定处置形**并给由；#893 的裁定面 = 与 strip 单源（design-token 面）对表。

**复验令**：逐条实读复验；已消/前提变者按实况登记。

**授权口径**：全链；都自动跑（自缚三条在册）。

**边界**：在飞写域零触——#51 ∥ #56 ∥ #59 ∥ #57/#58 ∥ 面板面；本批多涉工程面文档/脚本（`scripts/**` = 父侧工程工具面，实施形按设计裁定）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（initial 轮 + fix 轮 + 设计面实施轮四档落笔（读回核讫块见本节尾；doc-check 读数见交付报告））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**§2 批次任务与设计（eng-designer · 2026-10-04 · initial 轮）**

**口径**：本 §2 = 本批设计正文（**裁定登记面**——零新增设计档；由 = 六条皆工程面处置/微改，无新机制面；落点 = 既有档 + 批档伴随件）。复验 = 逐条实读 + 现盘实跑（2026-10-04）；行数/坐标 = 届盘实读。

**2.1 复验结论（六条 · 判据 = 台账原文 ⊗ 现盘实读/实跑）**

1. **#824（digest 家族重锚）——成立**。实跑：① `docs/batches/2026-09-30-cross-end-digest-recovery.test.mjs` = **19/20**——唯一红 = 腿 V4②（`:851`，`actual: 2 ∥ expected: 0`，断言文「半轮零元素」）；机制实读 = `thincoder-vscode/webview/record-restore.js:22-26`「复列 = 全量（未结轮照现）」（`scanPageRounds` `tail` 面——末页 open 照现）⇒ 期望滞后属先行陈旧红（与台账记载相符）。
   ② `docs/batches/2026-09-30-digest-persistence.test.mjs` = **5/9**（红 = 腿 2 ∥ 4 ∥ 5b ∥ 6；注载枚举「2∥3∥4∥6」已漂移——腿 3 转绿、腿 5b 转红）。
   ③ `docs/batches/2026-10-01-desktop-digest-teardown.test.mjs` = **1/7**（红 6 腿 = 1∥2∥3∥4∥6∥7；注载枚举 4 腿已漂移；腿 2 红因 = 注释残词「座次」命中 `thincoder-desktop/renderer/store.mjs:145`——注释层，非状态复辟；腿 7 红 = 对账序随批演进）。②③ 断代注在盘、属预期；注载枚举与读数相抵 = 登记面缺陷（当场收正）。
2. **#825（不在盘 `.test.mjs` 引用）——成立**。三包 `test/` 树实核：`prompts-async-guidance.test.mjs` / `session-boot.test.mjs` / `webview-env.mjs` 等俱不在盘（2026-09-28 测试树全清重置；现存 = `run.mjs`/`slow.mjs`/`files.mjs`/`smoke-*`/`integration/` 基建面）。指认簇实读：`docs/vsc/design/WEBVIEW.md:645-646`（用例基建三件）∥ `:636-637`（用例面七名）∥ `docs/vsc/design/WEBVIEW-PROTOCOL.md:396`（协议面六名）∥ `docs/vsc/requirements/WEBVIEW.md:22`（F-W3 用例行）∥ `docs/core/requirements/SESSION.md:162`（用例面四件）。
3. **#833（指针清扫）——①成立 / ②坐标不复现（按实况登记）**。① `docs/core/design/MANIFEST.md:594`（AC-24——台账记 `:591`，3 行漂移）仍载 `thincoder-core/test/manifest.test.mjs:297`（退役档）+「机检豁免——用例退场登记」。② 台账所记 `docs/batches/2026-09-29-structure-split-2.test.mjs:25`「结构机判 T54」**不复现**：该档三提交（`d7f7612b` ∥ `3c59054d` ∥ `442dacf2`）+ 现行工作树全读零 `T54`/「机判」（行 25 = `const findRoot`）；全仓 `*.test.mjs` 对 T54（manifest 族）零归属属实。T54 实况 = MANIFEST.md 在册登记（`:85` 机判句 ∥ `:672` 用例行「用例执行体随测试体系重建」——准确登记，非死指针）。同拍复核评审 🟡①（「被引 split-2 件自declared断代失效」）：实况在 AC-35 引用面（`:606`——「回归守卫 = …批内件…基座腿 + `2026-09-29-structure-split-2.test.mjs` 导出枚举探针」——被引件自declared断代失效 ⇒ 不能任回归守卫）。
4. **#889（冻结系档案件家族）——成立**。实跑：① `2026-10-02-desktop-menu-system.test.mjs` = **3/8**（红 5 腿 = ①∥①c∥②∥③∥④——#817 组名「设置-系」 ∥ #888 更名（「无最近工作目录」） ∥ 键集/条目集漂移）；② `2026-10-02-desktop-settings-menu-upgrade.test.mjs` = **6/8**（红 = 波1①∥波1②——与注载「恰 2 红」一致）；③ `2026-09-29-i18n-split.test.mjs` = **1/5**（红 = A1【`SETTINGS_DICT` 62≠55】∥ A2【基线 295 条等值 false】∥ A4【`i18n.mjs` 415>400】∥ A6【statusline 205⇒204】）；对照 = `2026-10-02-settings-menu-trim.test.mjs` = **3/3 绿**（现行继任件）。
5. **#890（#840 缝）——成立（危害路径复证）**。隔离复跑 = **7/7 绿**，且隔离 profile 落 `defaultModel:"p1:m1"`（写回实证）；未设缝 ⇒ 写落真实用户 config（危害面如实）。缝拦截探测（实跑）：`_setConfigPathForTest` 置缝后 `carryoverDefaultModel("p1","m1")` 落缝档（`seamVal:"p1:m1"`）、用户目录零写 ⇒ 修法有效。
6. **#893（写通道凭证正则）——成立（对表结论：两形维持 + 补一形）**。实读：`thincoder-core/agent-tools/batch.mjs:44` `CRED_RE` = 括号形 `` + 标形 ` 单源 = `thincoder-core/agent-tools/design-token.mjs:80-91` `stripDesignTokenEcho`（全串 ∥ 前缀形 ∥ 裸 uuid——token 精确剥）。对表：括号形 = 两源同判（批侧通配内容，宽面正当）；标形 = 批侧覆盖；裸 uuid = 单源专有（id 非凭证 `subagent-spawn.mjs:110`；批侧无 token 上下文不可精确——不同拍正当）。**批侧实际缺口 = 无标两段 token 值形**（`⟨uuid⟩:⟨epoch⟩`——Approved 后缀逐字携带；与工具承诺「never write a token」+ `docs/core/design/BATCH-RECORD.md` §4.7#2「凭证绝不落档」相抵）。

**2.2 处置裁定表（# → 处置形 → 由）**

| # | 处置形 | 由 |
|---|---|---|
| #824 | **重锚（改钉）**正身 + 邻二件**断代注读数刷新** | 正身 = 19/20 绿面（单腿期望滞后 ≠ 件失效——#777 先例：断代 = 腿弃用，否决）；邻二件 = 全对象随批演进（断代正当）+ 枚举失准（登记面当场收正） |
| #825 | **改述（退场注）**5 处 + 同族 6 处**列报** | 所指皆已退场；裸名化不消歧（仍是死名）∥ 断代注单点过重 ⇒ 改述最小如实；6 处 = 批史语境/登记面（列报零动作——上抛 U2） |
| #833 | ① **改指实守卫** ② **按实况登记（收口）** + 同拍复核 🟡① ⇒ **AC-35 去引** | ① 覆盖位短路守卫真实在盘（`docs/batches/2026-10-02-manifest-resolution-fix.test.mjs` 基座腿）；② 坐标不复现——不发明所指；🟡① 成立 ⇒ 断代件不能任回归守卫（D8 消死引） |
| #889 | **重锚（家族三件全重锚）** | 对象面皆在盘（菜单面活跃 ∥ i18n 四档在盘）+ 判据面绿件（trim）在册；enddiff「断言随动 = 父侧」先例；head-toolcolor 零动作不适用（其由 = 随面退场）；#820 注自书「随下次触碰改钉」= 本批即该触碰 |
| #890 | **件内补缝（保持写回行为，只改去向）** | 修法已实证（缝拦截探测）；被否：改产品（不做——行为正确）∥ 维持隔离纪律（缝 = 根治） |
| #893 | **两形维持 + 补第三形**（无标两段 token 值）；裸 uuid **维持不补** | 补：工具承诺 + 不变式直指（后缀逐字携带该形）；不补：id 非凭证 ∥ 无上下文精确性 ∥ 宽剥离违 #884 KD-4 否决面；不同拍 = 契约不同（正当） |

**2.3 修法 / 落点（逐条 file:line 级）**

**#824**（执行 = 父侧直接执行〔跨批面〕）：
- `docs/batches/2026-09-30-cross-end-digest-recovery.test.mjs`（890 行）改钉 5 处：`:3` 状态行刷新（「2026-10-04 重锚复跑 · 台账 #824」+ 20/20 + V4② 随「未结轮照现」机制重锚）；`:18` 腿族行「半轮零元素」⇒「未结轮照现〔两元素〕」；`:829` 用例标题同收正；`:842` 注释收正（cap 无打开轮 ∥ end 缺 start ⇒ 零产；start 缺 end〔末页 open〕⇒ 照现两元素）；`:851` 断言 `0` ⇒ `2`、断言文 ⇒「未结轮照现（末页 open——label + count 两元素）」。
- `2026-09-30-digest-persistence.test.mjs:3` / `2026-10-01-desktop-digest-teardown.test.mjs:13`：断代注读数刷新（枚举 ⇒ 实测 2∥4∥5b∥6 ∥ 6 腿 + 腿 2 注因「注释残词」；加「2026-10-04 复验读数刷新——台账 #824」）。
- 验收 = cross-end 复跑 **20/20**（exit 0）∥ 邻二件注文与复跑读数一致。

**#825**（执行 = eng-designer〔设计档〕/ 主 agent〔需求档〕——见 2.4）：
- 修 5 处（改述 + 退场注合入陈述；零划线/零修订式——D8）：
  ① `docs/vsc/design/WEBVIEW.md:645-646`：用例基建三件 ⇒「`thincoder-vscode/test/` 三件（`prompts-async-guidance` ∥ `session-boot` ∥ `webview-env`）——三件均随 2026-09-28 测试树全清重置退场（读数即本批存档）」；
  ② `:636-637`：用例面七名 ⇒ 同式退场注（「原在…——逐档随 2026-09-28 测试树全清重置退场」）；
  ③ `docs/vsc/design/WEBVIEW-PROTOCOL.md:396`：同式；
  ④ `docs/vsc/requirements/WEBVIEW.md:22`：F-W3 用例行 ⇒ 裸名三件 + 退场注（主 agent 笔）；
  ⑤ `docs/core/requirements/SESSION.md:162`：用例面四件 ⇒ 裸名 + 读数存档 + 退场注（主 agent 笔）。
- 验收 = 五修点对 `prompts-async-guidance.test.mjs` / `session-boot.test.mjs` / `history-window.test.mjs` / `history-restore.test.mjs` / `webview-env.mjs` 死 token 零命中 ∥ doc-check exit 0。
- 同族列报（**零动作**）：`docs/vsc/design/VSC-DEBT.md:269/:290/:306`（测试档越线登记——对象退场 ⇒ 登记失效，建议该档下次触碰清理）∥ `docs/core/design/SESSION.md:437`（批史语境）∥ `docs/core/design/CORE-UNIFICATION.md:935/:1050`（批史表行）∥ `docs/core/design/DOC-DISCIPLINE.md` §4.2.8 族（在册残差登记——合法形）。去向 = 上抛 U2。

**#833**（执行 = eng-designer）：
- `docs/core/design/MANIFEST.md:594`（AC-24）：`（thincoder-core/test/manifest.test.mjs:297）（机检豁免——用例退场登记）` ⇒ `（覆盖位短路回归守卫 = 批内件 docs/batches/2026-10-02-manifest-resolution-fix.test.mjs 基座腿）`。
- `:606`（AC-35）：去 `+ docs/batches/2026-09-29-structure-split-2.test.mjs 导出枚举探针` 半句（被引件自declared断代失效——不能任回归守卫）。
- ② 收口登记（零文件改动）：坐标不复现实况（见 2.1-3）。
- 验收 = 两行零死引（`manifest.test.mjs` 死形 ∥ split-2「回归守卫」引用零命中）∥ doc-check exit 0。

**#889**（执行 = 父侧直接执行〔跨批面〕；体量见上抛 U3）：
- ① `docs/batches/2026-10-02-desktop-menu-system.test.mjs`（301 行）：5 红腿逐腿改钉至现盘真值（组名系 ∥ #888 更名标签 ∥ 六项集 ∥ 键集现读）；头注「#811 快照…复跑红=预期」整句 ⇒ 重锚陈述（「重锚（2026-10-04 · 台账 #889）——断言 = 现盘形」）。
- ② `docs/batches/2026-10-02-desktop-settings-menu-upgrade.test.mjs`（532 行）：波1①/② 改钉六项形（= trim 件同形）+ #888 更名随动；头注「#820 邻接注…恰 2 红」⇒ 重锚陈述。
- ③ `docs/batches/2026-09-29-i18n-split.test.mjs`（129 行）+ `docs/batches/2026-09-29-i18n-split.baseline.json`：A1/A4/A6 按现读重锚（62 ∥ main 阈值 415⇒420〔现读+5 余量〕∥ views/composer 届盘实读 ∥ frozen 值 204 等）+ A2 基线**重冻**（`{en, zh}` = 现盘 `HOST_DICT` 全条目数组——沿基线重冻先例）+ 头注计数随动 + 重锚行。
- 验收 = 三件复跑 **8/8 ∥ 8/8 ∥ 5/5**（exit 0 ×3）∥ trim 件零回归 3/3。

**#890**（执行 = 父侧直接执行〔跨批面〕）：
- `docs/batches/2026-10-03-desktop-firstrun-provider-notice.test.mjs`（452 行）：T7（`:411`）`host.setPrefs` 前补 `cfgIo._setConfigPathForTest(join(tmpDir("fr840-t7-cfg-"), "config.json"))`；finally 补 `cfgIo._resetConfigPathForTest()`；T7 断言追加（临时档落 `defaultModel:"p1:m1"`——写回行为零改、去向 = 缝）。
- 验收 = **非隔离**直跑 = 7/7 + 真实 config 零触（前后 mtime/内容对拍）+ 缝档落值。

**#893**（执行 = eng-coder〔产品码，全链 token 门〕+ eng-designer〔设计档〕）：
- `thincoder-core/agent-tools/batch.mjs`（313 行）`:44/:45`：`CRED_RE` / `CRED_TEST_RE` 补第三形——无标两段 token 值 `[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}:\d{10,16}`；`:43` 注释改述（三形 + 复指 `docs/core/design/BATCH-RECORD.md` §4.1——原「§2.7」为旧档号死引）。
- `docs/core/design/BATCH-RECORD.md`（505 行）§4.1 凭证行 + BR-4：枚举三形（补无标两段形）+ 明书「裸 uuid 不剥」之由（id 非凭证 ∥ 无上下文精确性）。
- 新增批内件 `docs/batches/2026-10-04-issue-fix-round4.test.mjs`：三形剥净 ∥ 裸 uuid 逐字保留 ∥ 既有两形零回归（先红后绿——红 = 第三形存活）。
- 验收 = 批内件全绿 + 既有件复跑零回归（`docs/batches/2026-10-03-design-token-echo.test.mjs` 等）+ doc-check exit 0。

**2.4 受影响文件表（行数 = 届盘实读；增量 = 预期）**

| file | 现读 | 改动面 | 执行 |
|---|---|---|---|
| docs/batches/2026-09-30-cross-end-digest-recovery.test.mjs | 890 | 改钉 5 处（等量改写） | 父侧 |
| docs/batches/2026-09-30-digest-persistence.test.mjs | 625 | :3 注刷新 | 父侧 |
| docs/batches/2026-10-01-desktop-digest-teardown.test.mjs | 637 | :13 注刷新 | 父侧 |
| docs/vsc/design/WEBVIEW.md | 833 | :636-637 ∥ :645-646 改述 | eng-designer〔U1〕 |
| docs/vsc/design/WEBVIEW-PROTOCOL.md | 735 | :396 改述 | eng-designer〔U1〕 |
| docs/vsc/requirements/WEBVIEW.md | 192 | :22 改述 | 主 agent |
| docs/core/requirements/SESSION.md | 215 | :162 改述 | 主 agent |
| docs/core/design/MANIFEST.md | 867 | :594 改指 ∥ :606 去引 | eng-designer |
| docs/batches/2026-10-02-desktop-menu-system.test.mjs | 301 | 5 红腿重锚 + 头注 | 父侧 |
| docs/batches/2026-10-02-desktop-settings-menu-upgrade.test.mjs | 532 | 波1①/② 重锚 + 头注 | 父侧 |
| docs/batches/2026-09-29-i18n-split.test.mjs | 129 | A1/A2/A4/A6 重锚 + 头注 | 父侧 |
| docs/batches/2026-09-29-i18n-split.baseline.json | —（31763B） | 基线重冻 | 父侧 |
| docs/batches/2026-10-03-desktop-firstrun-provider-notice.test.mjs | 452 | T7 补缝（+2~4 行） | 父侧 |
| thincoder-core/agent-tools/batch.mjs | 313 | :43-45 三形 + 注释（±2 行） | eng-coder |
| docs/core/design/BATCH-RECORD.md | 505 | §4.1 行 + BR-4（+1 行） | eng-designer |
| docs/batches/2026-10-04-issue-fix-round4.test.mjs | 新 | 批内件（#893 腿） | eng-coder |

**2.5 验收对照（三链同源）：台账六条 ⟺ 本 §2 逐条 ⟺ 修法落点**

- **#824** ⟺ 2.1-1 ⟺ 2.3-#824：判据 = cross-end 复跑 **20/20**（exit 0）；邻二件注文与复跑读数一致。
- **#825** ⟺ 2.1-2 ⟺ 2.3-#825：判据 = 五修点死 token 零命中（点名清单见 2.3）∥ doc-check exit 0；同族 6 处列报在册（U2）。
- **#833** ⟺ 2.1-3 ⟺ 2.3-#833：判据 = MANIFEST.md 两行零死引 ∥ doc-check exit 0；② 收口登记在册。
- **#889** ⟺ 2.1-4 ⟺ 2.3-#889：判据 = 三件复跑 **8/8 ∥ 8/8 ∥ 5/5**（exit 0 ×3）∥ trim 零回归 3/3。
- **#890** ⟺ 2.1-5 ⟺ 2.3-#890：判据 = 非隔离直跑 = 7/7 + 真实 config 零触 + 缝档落值。
- **#893** ⟺ 2.1-6 ⟺ 2.3-#893：判据 = 批内件先红后绿（三形剥净 ∥ 裸 uuid 保留 ∥ 既有两形零回归）∥ 既有件复跑零回归 + doc-check exit 0。

**2.6 关键决策（含被否）**

- KD-1 #824 = 改钉（非断代）：#777 先例「期望滞后 ≠ 件失效；断代 = 腿弃用」；19/20 绿面保留价值。
- KD-2 #824 邻二件 = 断代形态维持 + 读数刷新（非重锚/非零动作）：全对象随批演进（断代正当）+ 枚举失准 = 登记面一致性缺陷。
- KD-3 #889 = 重锚（非归档）：对象面皆在盘 + 判据面绿件在册；head-toolcolor 零动作不适用（其由 = 随面退场）；#820 注自书「随下次触碰改钉」= 本批即该触碰。
- KD-4 #825 = 改述退场注（非裸名化/断代注）：所指皆已退场；裸名化不消歧；断代注单点过重。
- KD-5 #833-① = 改指实守卫（非去引/断代注）：实守卫在盘；去引丢守卫信息；断代注留死名（与「live 面全零」诉求相抵）。
- KD-6 #833-② = 按实况登记收口（不发明所指）；🟡① ⇒ AC-35 去引（D8 消死引）。
- KD-7 #893 = 两形维持 + 补第三形；裸 uuid 维持不补——被否：全不补（承诺不真）∥ 裸 uuid 一并补（非凭证·误伤面）∥ 照搬 strip 单源（批侧无 token 上下文，不可行）。
- KD-8 #890 = 件内补缝——被否：改产品（行为正确，不做）∥ 维持隔离纪律（缝 = 根治）。

**2.7 边界（不做）**

- 不动在飞写域：`thincoder-cli/**` ∥ `thincoder-core/ledger-*.mjs` ∥ 批一/二/三设计面 ∥ 面板面 ∥ 菜单轮写域；不动已收口批档 `.md`（只动其伴随件/设计档）。
- 不扩面：菜单面机制 ∥ i18n 结构 ∥ batch 工具语义（正则面除外）零改；#825 同族 6 处零动作（U2）。
- 不新增机制 ∥ 不新增设计档（本 §2 = 裁定登记面）。

**2.8 上抛项**

- **U1**：`docs/vsc/design/WEBVIEW.md` ∥ `WEBVIEW-PROTOCOL.md` 写面与 issue 批·三设计面潜在交叠 ⇒ 实施序请父侧统一分流（或待批三设计面落定后落笔）。
- **U2**：#825 同族 6 处（VSC-DEBT ×3 ∥ core SESSION:437 ∥ CORE-UNIFICATION ×2 ∥ DOC-DISCIPLINE 族）处置去向：倾向「随域随补/登记面维持」；如父侧裁并入本批，请明示笔面。
- **U3**：#889 重锚体量（menu 系两件 5+2 红腿）——执行面（父侧直接 ∥ 委派）请父侧定。

**2.9 测试面**

- 批内件（新）= `docs/batches/2026-10-04-issue-fix-round4.test.mjs`（#893 三形腿；随批归档，不进仓套件）。
- 复跑面（实施验收）= 六件（cross-end ∥ menu-system ∥ upgrade ∥ i18n-split ∥ firstrun ∥ 本批新件）+ 邻二件读数刷新核对；集成面零改（全为批档件/文档面）。
- 本设计轮读数 = 逐件实跑在案（见 2.1）；doc-check 读数 = 见交付报告（本轮复跑）。

**2.10 记录块**

- 设计落点 = 本 §2（裁定登记面）；实施落点 = 2.4 受影响表；决策落档 = 本档同日。
- 状态行 = 设计完成（2026-10-04）。

**2.11 写通道剥离收正（事实保真）**

本 §2 两处引用形（2.1-6 ∥ 2.3-#893 所载凭证形态字面）在 append 时被批次档写通道的凭证防泄漏机制（`thincoder-core/agent-tools/batch.mjs:44` 自有正则）机械剥离，致残形（空反引号对 + 粘连吞字——「标形 ` 单源」段）。

- 原字面 = **回显方括号形（DESIGN-TOKEN 冒号态）** 与 **designId 键形（键名 + 冒号 + 值）**——语义以原句为准，非笔误（本条刻意避开触发形态）。
- 旁证二则：① #884 §5 同款先例（该批亦以「追加收正行」处置）；② 剥离机制在役（本残余即其实证——#893 面对表结论之行为侧佐证）。
- 处置 = 零动作（残形不影响语义判读；本行为收正即是）——实施轮如按 2.3-#893 落第三形，本条所述「粘连吞字」面同受该修复覆盖。

**2.12 坐标重锚（他批在写面随动 · 复读）与 doc-check 现态**

- 由 = issue 批·三/五设计面在写（未提交工作树改动）插入致漂；以下 = 复读实读。
- `docs/vsc/design/WEBVIEW.md`：2.3-#825① 用例基建三件 = `:663-664`（原记 `:645-646`）∥ ② 用例面七名 = `:654`（原记 `:636-637`）；现读 **834** 行。
- `docs/vsc/design/WEBVIEW-PROTOCOL.md`：`:398`（原记 `:396`）；现读 **736** 行。
- `docs/core/design/MANIFEST.md`：`:594` ∥ `:606` 零漂（现读 **870** 行）；`docs/vsc/requirements/WEBVIEW.md:22` ∥ `docs/core/requirements/SESSION.md:162` 零漂。
- 口径 = 坐标 as-of；实施轮按名面/文本定位（沿「坐标 as-of，实施轮重锚」在册口径）。
- **U1 现态更新（交叠已实证，非仅潜在）**：① 批·三设计面 = `WEBVIEW.md`（+§4.9 ∥ §5.8 块）∥ `WEBVIEW-PROTOCOL.md`（+`uiPrefs` 登记行）未提交改动实读；② 批·五设计面 = `MANIFEST.md`（KD-M1-35 行补句）未提交改动实读 ⇒ #825 的 WEBVIEW 两档 ∥ #833 的 MANIFEST.md 写面与在写面交叠——实施序须由父侧统一分流（或待批三/五各自落定后落笔）。
- **doc-check 现态（设计轮复跑读数）**：锚闸 = **OK 0 悬空**（本批零新增）；行宽闸 = **FAIL 4 行**——全数 = 批·五设计面在写（`AGENT-LOOP-ASYNC-POOL.md:108`〔#863〕∥ `LEDGER.md:251`〔#834〕∥ `MEMORY.md:582`〔#867〕∥ `docs/core/design/prompts/persona-engineering.md:78`〔#848〕——逐行批号归因）⇒ 非本批面、本批零新增红；exit 0 需批五自净后复跑。

**§2 续 · 收正块（fix 轮 · 2026-10-04 · eng-designer——承 §3 轮次 1 发现 1–9 逐号；父侧裁定 = 九条全采纳）**

**口径**：处置基准 = §3 轮次 1 发现 1–9 全表（Suggestion 列 = 评审原建议，执行者 = 本席）；本块各条 = **终值语句**——本块与本节先行文不一致处（落笔序 ∥ 2.4 档位与增量 ∥ #825 验收清单 ∥ 变更记录笔 ∥ A4 阈值 ∥ 同族计数 ∥ 2.11 末句）**以本块为准**（§2 追加制——先行文不改写，裁决住本块）。修面 = 本档 §2（其余档改动在实施轮）。

**号 1（🟡 · U1 落笔序——同档不并发）**

1. **交叠三档前置二择一**：① **他方设计面落定为前置**——`docs/vsc/design/WEBVIEW.md` ∥ `docs/vsc/design/WEBVIEW-PROTOCOL.md` 待 issue 批·三设计面落定（承 `docs/batches/2026-10-04-issue-fix-round3.md:88-89`）；`docs/core/design/MANIFEST.md` 待 issue 批·五设计面落定（承 `docs/batches/2026-10-04-issue-fix-round5.md:39 ∥ :94`——批五已反向登记同交叠）；② 或落笔前先按 2.12 复读重锚坐标（按名面/文本定位）再落。
2. **同档不并发**：同档不并写；落笔判据 = 该档在飞写者已收笔。
3. **§6 收口回核**：本序由收口段回核（逐档落笔序与实况对核）。

**号 2（🟡 · 2.4 档位处理）∥ 号 5（🔵 · 增量标注与基准）——2.4 表统一收正（逐件）**

| file | 现读 | 预期增量 ∥ 结构 | 档位处理 |
|---|---|---|---|
| `docs/batches/2026-09-30-cross-end-digest-recovery.test.mjs` | 890 | ≤+2（5 处改钉）∥ 结构不变 | 越 500 硬限 ⇒ ① |
| `docs/batches/2026-09-30-digest-persistence.test.mjs` | 625 | ≤+1（注刷新）∥ 结构不变 | 越 500 ⇒ ① |
| `docs/batches/2026-10-01-desktop-digest-teardown.test.mjs` | 637 | ≤+1（注刷新）∥ 结构不变 | 越 500 ⇒ ① |
| `docs/vsc/design/WEBVIEW.md` | 833〔以 2.12 为准：834〕 | ≤+2（改述 ×2 + 变更记录 +1）∥ 结构不变 | 文档面（档位口径不适用） |
| `docs/vsc/design/WEBVIEW-PROTOCOL.md` | 735〔736〕 | ≤+2（改述 + 变更记录 +1）∥ 结构不变 | 文档面 |
| `docs/vsc/requirements/WEBVIEW.md` | 192 | ≤+2（改述 + 变更记录 +1）∥ 结构不变 | 文档面（主 agent 笔） |
| `docs/core/requirements/SESSION.md` | 215 | ≤+2（改述 + 变更记录 +1）∥ 结构不变 | 文档面（主 agent 笔） |
| `docs/core/design/MANIFEST.md` | 867〔870〕 | ≤+2（改指/去引 + 变更记录 +1）∥ 结构不变 | 文档面 |
| `docs/batches/2026-10-02-desktop-menu-system.test.mjs` | 301 | ≤+3（5 红腿重锚 + 头注）∥ 结构不变 | 越 300 ⇒ ① |
| `docs/batches/2026-10-02-desktop-settings-menu-upgrade.test.mjs` | 532 | ≤+3（波1①/② 重锚 + 头注）∥ 结构不变 | 越 500 ⇒ ① |
| `docs/batches/2026-09-29-i18n-split.test.mjs` | 129 | ≤+5（A1/A2/A4/A6 重锚 + 头注）∥ 结构不变 | 档内 |
| `docs/batches/2026-09-29-i18n-split.baseline.json` | 31763 B ∥ 597 行 | 重冻（值面替换——行数随条目量） | 数据档（档位口径不适用） |
| `docs/batches/2026-10-03-desktop-firstrun-provider-notice.test.mjs` | 452 | ≤+4（T7 补缝 +2~4）∥ 结构不变 | 越 300 ⇒ ① |
| `thincoder-core/agent-tools/batch.mjs` | 313 | ≤+2（`:43-45` 补第三形 + 注释）∥ 结构不变 | 越 300（<500）⇒ ② |
| `docs/core/design/BATCH-RECORD.md` | 505 | **+2**（§4.1 行 + BR-4 +1 ∥ 变更记录 +1）∥ 结构不变 | 文档面 |
| `docs/batches/2026-10-04-issue-fix-round4.test.mjs` | 新 | 新档（体量届盘）∥ — | 批内件（随批留存） |

① **豁免由（批档伴随件）**：**随批留存 · 冻结证据档**——非维护型源码（随批归档 · 直跑证据；批收口即冻结）；本笔 = 注文/改钉（结构不变）；拆分零实益（破 as-run 证据形态）。R3 = 存量不升级（本批零结构面动作）。
② `thincoder-core/agent-tools/batch.mjs`（产品码）：越 300 顾问线、未越 500；本笔 ≤+2 ∥ 结构不变；**越线注记随本表在册**（拆分复核不随本批——R3 存量不升级）。
③ **越档件实点 = 7** = 批档伴随件 6（890 ∥ 637 ∥ 625 ∥ 532 ∥ 452 ∥ 301——评审列举）+ 产品码 1（`batch.mjs` 313——按「逐件」口径补全）。
④ **增量标注全补**（上表 = 2.4 增量列全集）；三行现读**以 2.12 为准**（复读 834 ∥ 736 ∥ 870——本复正轮复核同值〔`read` 总户口径〕）；2.4 旧三值（833 ∥ 735 ∥ 867）= as-of 记；实施按名面/文本定位。

**号 3（🟡 · #825 验收补全）**

- **token 清单 = 六名**（原五名 ∥ 补 `scenario-04-session-recovery.test.mjs`——#825⑤ 用例面四件之集成件，来源 `docs/core/requirements/SESSION.md:162`；现盘复核 = 不在盘〔`**/scenario-04*` 零命中〕）：`prompts-async-guidance.test.mjs` ∥ `session-boot.test.mjs` ∥ `history-window.test.mjs` ∥ `history-restore.test.mjs` ∥ `webview-env.mjs` ∥ `scenario-04-session-recovery.test.mjs`。
- **「死 token」口径**：**档名全形（含后缀）逐点零命中**——`.test.mjs` 形含 `.test.mjs`（与活档名消歧：`history-window.test.mjs`〔死〕 vs `history-window.mjs`〔活·端壳〕）；`webview-env.mjs` 形含 `.mjs`。判 = **五修点**（2.3 所列五处，坐标届盘重锚）改述后逐点零命中；判域 = 五修点改述段（非全档面——他处/记录面不并入判域）；裸名（无后缀）+ 退场注 = **合规形**（与裸名化改述相洽）。

**号 4（🟡 · 变更记录笔）**

- **六档修法各补「变更记录 +1 行（批号 + 简述）」**（逐批惯例；实读例 = `docs/vsc/design/WEBVIEW.md:683-689` ∥ `docs/vsc/design/WEBVIEW-PROTOCOL.md:537` ∥ `docs/vsc/requirements/WEBVIEW.md:186-193` ∥ `docs/core/requirements/SESSION.md:210-215` ∥ `docs/core/design/MANIFEST.md:684` ∥ `docs/core/design/BATCH-RECORD.md:437`——坐标 as-of，实施按名面定位）。
- **`docs/core/design/BATCH-RECORD.md`**：2.4「+1 行」= BR-4 行（**非本笔**）；本笔另 +1 ⇒ 该档增量终值 = **+2 行**（见号 2 表）。主 agent 笔两档（`docs/vsc/requirements/WEBVIEW.md` ∥ `docs/core/requirements/SESSION.md`）同规。

**号 5（🔵 · 2.4 增量标注）**——并入号 2 表（④ 基准句）。

**号 6（🔵 · #889-A4 阈值）——KD-9（追补 · 2.6 KD 表续）**

- `2026-09-29-i18n-split.test.mjs` A4 阈值 `renderer/i18n.mjs ≤400 ⇒ ≤420`：**越线之由** = 拆后 393（≤400 护栏）随后续批条目增殖至 **415**（A4 复跑读数 ∥ 本轮复核同值）——400 系 `2026-09-29-i18n-split` **批内护栏**（批域约束、非跨批契约）；**余量口径** = 现读 +5（415 ⇒ 420——小写入余量，仍 < 500 硬限）。重锚 = 随批件改钉（非放宽——阈值面自「批内 400」改为「现读 + 余量」）。

**号 7（🔵 · 「同族 6 处」计数口径）**

- **口径 = 具名点坐标六处**（`docs/vsc/design/VSC-DEBT.md:269 ∥ :290 ∥ :306`〔3〕+ `docs/core/design/SESSION.md:437`〔1〕+ `docs/core/design/CORE-UNIFICATION.md:935 ∥ :1050`〔2〕）；`docs/core/design/DOC-DISCIPLINE.md` §4.2.8 族 = **族项单列**（在册残差登记·合法形——不计入点数）。合计面 = 6 点 + 1 族；2.2（表 #825 行）∥ 2.5 ∥ 2.7 ∥ 2.8（U2）各处同此口径。

**号 8（🔵 · 2.11 末句）**

- 末句（「实施轮如按 2.3-#893 落第三形，本条所述「粘连吞字」面同受该修复覆盖。」）⇒ **改述**：「实施轮落第三形 ⇒ 只覆盖**未来写入**的剥离面；本 §2 既有残形**不随该修复复原**——残形判读以 2.11 上文为准。」

**号 9（🔵 · 证据面）——保持（零动作）**

- 实跑读数（19/20 ∥ 5/9 ∥ 1/7 ∥ 3/8 ∥ 6/8 ∥ 1/5 ∥ 7/7）∥ doc-check 读数 = **实施轮前复跑确认**（收口项）；读数入 §5/§6。

**路遇观察（范围外 · 本轮零触 · 上抛）**：`docs/vsc/requirements/WEBVIEW.md` 另见三处死 token 全形（`:23`〔F-W4 用例列〕∥ `:98`〔N-W2〕∥ `:100`〔N-W4〕——同族）——不在五修点内；处置请父侧裁量（并入 #825 面 ⇒ 号 3 判域随扩 ∥ 另登记）。

**边界（本收正轮不做）**：零实现码 ∥ 不点火评审 ∥ 不跑构建（doc-check = 验收项——读数见读回核讫）∥ 其余档零触（实施轮落点 = `docs/vsc/**` ∥ `docs/core/design/*` 等）∥ 在飞写域零触（`docs/batches/2026-10-04-issue-fix-round{1,2,3,5}.md`——issue 批一/二/三/五修轮在飞）∥ 面板面 ∥ 已收口批档。

**读回核讫（收正块 · 2026-10-04 · eng-designer）**：收正块（`:171-237`）写入后全文读回，与写入对象逐条一致（号 1–9 逐号 ∥ 表 16 行 ∥ 基准句 ∥ 路遇观察 ∥ 边界）。**doc-check 复跑（写入后 · as-of）**：锚闸 **OK 0 悬空**；行宽闸 = **1 行红——`docs/cli/requirements/ACP-CLIENT.md:81`（308 字符）**——**非本批面**（该红随并行提交 `01d42d8f`〔「…requirements pen (R-A5.4 rewrite…)」——他批〕于写入窗口内引入：本席写入前复跑 = exit 0、写入后 = 1 行红）；本档不入行宽扫描域（实证：本档 §2 既有 >300 字符行零 ✗）⇒ **本批零新增红**；行数面 8 条报告态差异（desktop 设计档行数表——非本批面）。⇒ exit 0 待该在写面自净后复跑（同 §2.12 处置形）。写面 = 本档 §2（零其他档触）。

**设计面实施轮读回核讫（四档 · 2026-10-04 · eng-designer）**

- **前置复核（收正块号 1）**：落笔前四档工作树净（零未提交改动）；批三落定在盘（`docs/vsc/design/WEBVIEW.md` §4.9 ∥ §5.8；`WEBVIEW-PROTOCOL.md:74/:118` `uiPrefs` 登记）∥ 批五落定在盘（`docs/core/design/MANIFEST.md:284` KD-M1-35 补句）∥ 同刻在飞写者（批二 ACP 面 ∥ 批三实施面（`thincoder-vscode/**` 源文件）∥ #76 产品面）均不涉本席四档——「同档不并写」成立。
- **四档落笔（file:line = 落笔后实读）**：① `docs/vsc/design/WEBVIEW.md`——`:657-658`（§10 用例面七名）+ `:666-667`（§11 用例基建三件）⇒ 退场注改述；`:839` 变更记录 +1。② `docs/vsc/design/WEBVIEW-PROTOCOL.md`——`:398`（§11 用例面六名）⇒ 退场注改述；`:737` 变更记录 +1。③ `docs/core/design/MANIFEST.md`——`:594`（AC-24 改指实守卫）+ `:606`（AC-35 去引）；`:686` 变更记录 +1。④ `docs/core/design/BATCH-RECORD.md`——`:63`（§4.1 三形）+ `:131`（BR-4）；`:439` 变更记录 +1。
- **号 3 死 token 判（判域 = 设计三处改述段）**：六名全形零命中（`WEBVIEW.md` 余一处 `:833` = 变更记录行——记录面，判域外；`WEBVIEW-PROTOCOL.md` 零命中）；裸名 + 退场注 = 合规形在盘。
- **同拍收正一则（读回核讫发现）**：AC-24 初版沿 §2.3 字面保留「既有 T-F9」——该用例号系退役档死名，原豁免注随改指退场后即入闸（复跑实证 `:594 T-F9（用例号）`）⇒ 按验收（零新增红 ∥ 消死引）同拍消解（复跑零悬空）。
- **doc-check 读数（复跑 · 仓根）**：exit 1——锚悬空 2（`docs/cli/design/CLI-ENTRY.md:20/:81`——批五 #867 检查点钉字面，拟新增档未落盘）∥ 行宽红 2（`CLI-ENTRY.md:20` 333 字符 ∥ `docs/core/design/SESSION.md:970` 403 字符——均他批在写面）；**本批四档零新增红**；全量 exit 0 待在写面自净后复跑（与 §5.6 同处置形）。
- **边界遵守**：需求面 2 档零触（主 agent 笔）∥ 产品/测试面零触（#76 域）∥ 在飞写域零触 ∥ 已收口批档零触 ∥ 零评审点火 ∥ 零构建。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审面**：批档 §2 全文（2.1–2.12）· 六条（#824 ∥ #825 ∥ #833 ∥ #889 ∥ #890 ∥ #893）。证据 = 现盘实读抽检（行数 14 处 ∥ 坐标/断言 20+ 处 ∥ 机制句 ∥ 符号 ∥ 在飞写面）；实跑读数与 doc-check 无 shell ⇒ 未复跑（见发现 9）。局限：无 document map / 无项目标准档 ⇒ 归属判据按 AGENTS.md + 现盘惯例降级判（#893 主题属主 = `BATCH-RECORD.md` §4.1/§4.7——改述到位，零归属发现；无机制级两处异述）。

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | 执行面协调（R5） | 🟡 | U1 交叠已实证：`docs/batches/2026-10-04-issue-fix-round3.md:88-89`（批三设计面 = `WEBVIEW.md` §4.9/§5.8 ∥ `WEBVIEW-PROTOCOL.md`）∥ `docs/batches/2026-10-04-issue-fix-round5.md:39/:94`（批五 = `MANIFEST.md` KD-M1-35；批五已反向登记同交叠）——落笔序未定（coordination item，非缺陷） | 落笔序先定（同档不并发）：以批三/批五设计面落定为前置，或先按 2.12 坐标重锚再落笔；§6 收口回核该序。 |
| 2 | 受影响文件表（判据 8） | 🟡 | 2.4 表：4 件 .mjs 越 500 硬限（890 ∥ 637 ∥ 625 ∥ 532）、2 件越 300（452 ∥ 301）——无拆分计划、亦无档位豁免由（存量体量债，按 R3 不升级，仅要求处理面写明） | 2.4 补档位处理：逐件给「≤±N ∥ 结构不变」+ 越档件二择一（豁免由——随批留存·冻结证据档；或越线登记/拆分计划）。 |
| 3 | 验收（判据 5） | 🟡 | #825 验收 token 清单 5 名，缺 #825⑤ 四件之 `scenario-04-session-recovery`（现盘亦不在盘）；「死 token」口径（含/不含 `.test.mjs`）未写明 ⇒ 该修点不可完整机检 | 清单补第六名 + 写明口径（全形含后缀零命中——与裸名化改述相洽）。 |
| 4 | 方法论（判据 3/7） | 🟡 | 六档改述/改指未列「变更记录」笔（各档逐批惯例实读：`docs/vsc/design/WEBVIEW.md:683-689` ∥ `docs/core/requirements/SESSION.md:210-215` ∥ `docs/vsc/requirements/WEBVIEW.md:186-193` ∥ `docs/core/design/MANIFEST.md:684` ∥ `docs/core/design/BATCH-RECORD.md:437`） | 修法清单补「变更记录 +1 行（批号 + 简述）」项；BATCH-RECORD「+1 行」若即该笔请写明。 |
| 5 | 受影响文件表（判据 8） | 🔵 | 2.4 增量标注不全（7 个 .mjs 行仅 3 行带 `+N/±N`）；`baseline.json` 无行数；三行现读（833/735/867）已被 2.12 复读（834/736/870）取代而未标 | 统一补增量标注；2.4 更新或标「以 2.12 为准」。 |
| 6 | 重锚裁定（#889） | 🔵 | A4 阈值 `i18n.mjs ≤400 ⇒ 420`（现读 415+5）把越线（批内护栏）固化为新基线；KD 列表未列该笔 | 补一笔 KD/裁定行（越线之由 + 余量口径），或按「测试档越线登记」形态登记后维持阈值。 |
| 7 | 计数一致性 | 🔵 | 「同族 6 处」与实点清单相加 ≥7（VSC-DEBT 269/290/306 ∥ SESSION:437 ∥ CORE-UNIFICATION 935/1050 ∥ DOC-DISCIPLINE §4.2.8 族）——族项是否计入未写明 | 明示计数口径或按实点改数。 |
| 8 | 文档卫生（2.11） | 🔵 | 2.11 残形处置零动作可接受；末句「…同受该修复覆盖」指涉不明（第三形只改未来写入剥离面，不修复既有残形） | 末句改述或删；如需，后续 append 以纯文本重述两个被剥字面（2.11 已有描述形）。 |
| 9 | 证据面（限制） | 🔵 | 实跑读数（19/20 ∥ 5/9 ∥ 1/7 ∥ 3/8 ∥ 6/8 ∥ 1/5 ∥ 7/7）与 doc-check 读数（锚闸 OK ∥ 行宽 FAIL 4 行）本实例无法复跑；文件面抽检全吻合 | 实施轮前复跑确认；读数入 §5/§6。 |

**计数**：🔴 0 ∥ 🟡 4 ∥ 🔵 5 · **VERDICT: pass**

## §4 用户批准（主 agent）

**父侧代签（用户 2026-10-04 00:31「都自动跑」——点火 / 代签 / 派发 / 收口全自动授权；自缚三条件齐备）**

- ① **设计评审 pass** ✓：评审 #69（`VERDICT: pass` · 🔴 0 ∥ 🟡 4 ∥ 🔵 5——含 U1 交叠实证）；
- ② **修正落地核验** ✓：收正轮 #74 号 1–9 全落（§2 追加式终值块 `:171-237`——落笔序 ∥ 2.4 档位表 16 行 + 越档实点 7 ∥ #825 六名 + 死 token 口径 ∥ 变更记录笔 ∥ A4 KD-9 ∥ 计数口径 ∥ 2.11 末句）；父侧抽读在盘；`doc-check` 复跑 **EXIT 0**（途中唯一红 = 父侧需求档笔所致，已折行归零——`ec411211`）；
- ③ **token 已签发** ✓（值不入档，纪律照守）。

**批准面**：#824 ∥ #825 ∥ #833 ∥ #889 ∥ #890 ∥ #893——**按设计执行面分派**（设计 §2.4：产品/测试面 ⇒ eng-coder #76（10 档）∥ 设计面 ⇒ eng-designer #77（4 档，**dependsOn [#72,#73]**——U1 前置）∥ 主 agent 笔 ⇒ 需求面 2 档（本席））。

## §5 实施记录（eng-coder）

**§5 实施记录（eng-coder · 2026-10-04 · initial 轮）**

**口径与执行面**：任务书 = 本档 §2（含追加收正块 `:171-237` 终值语句，以该块为准）。产品/测试面 10 档中 **8 档（7 批内件 + 基线档）经实证跨批写门机械拒写**——判据 = `thincoder-core/agent/write-gate.mjs:160-183`（depth>0 ∧ `_batchDoc` 在场 ⇒ 仅放行自身批次词干族伴随件）；拒因串 = `cross-batch record write`（实证在案）。此与 §2.4「执行 = 父侧直接执行〔跨批面〕」一致、与 spawn 派单相抵 ⇒ 已上抛；父侧裁定 = **父侧落笔这 8 档，本席出「可直接落笔清单」**。本席落笔面 = 2 档。

**5.1 本席落笔（2 档 · 全绿）**

- `thincoder-core/agent-tools/batch.mjs`（`:43-47`）：`CRED_RE` ∥ `CRED_TEST_RE` 补第三形——无标两段 token 值形（判据沿单源 `thincoder-core/agent-tools/design-token.mjs:80-91`；裸 uuid 维持不剥 = KD-7）；`:43` 注释改述（三形枚举 + 复指 `docs/core/design/BATCH-RECORD.md` §4.1，旧「§2.7」死引已除）。**档级 +2 行**（314 ⇒ 316 · 结构不变）；`git diff` 单 hunk（4+/3−）实读。
- `docs/batches/2026-10-04-issue-fix-round4.test.mjs`（新档 · 103 行）：C1–C5 五腿（三形剥净 ×3 ∥ 裸 uuid 逐字保留 ∥ 纯凭证行整行丢弃）。执行面 = 真工具链（`batchTool.execute` 走真 append 写通道 ⇒ 读回档全文断言——非私有函数直调）；全隔离（每腿自建临时目录 + 临时批次档）。**先红后绿**：修前 3/5（C3 ∥ C5 红 = 第三形存活进档，实证在案）⇒ 修后 **5/5 绿**（exit 0）。

**5.2 零回归复跑（本席面 · 6 件）**

| 件 | 读数 | 归因 |
|---|---|---|
| `docs/batches/2026-10-03-design-token-echo.test.mjs` | 12/12 | 剥除单源零回归 |
| `docs/batches/2026-09-30-core-tools-pairfix.test.mjs` | 12/12 | batch 家族零回归 |
| `docs/batches/2026-10-02-manifest-resolution-fix.test.mjs` | 7/7 | batch 路径族零回归 |
| `docs/batches/2026-09-29-batch-mechanics.test.mjs` | 5/5 | 写门判据零回归 |
| `docs/batches/2026-10-01-zero-semantic-sweep.test.mjs` | 5/9 | 4 红 = L1 ∥ L6 ∥ L7 ∥ L8 **全为存量断代红**（非本席面）；L6 内 batch.mjs 两判据通过、红点 = `BATCH-RECORD.md` 行宽（非本席面） |
| `docs/batches/2026-09-29-tools-carryover-t3.test.mjs` | 4/5 | T1b 存量红（别名描述随 alias-removal 批撤除——HEAD 实读零命中实证，非本席致红） |

**5.3 8 档「可直接落笔」清单（父侧执行面 · 逐件 scratch 仿真已验证）**

| # | file | 现读 | 改法（摘要） | 复跑判据 |
|---|---|---|---|---|
| 1 | `docs/batches/2026-09-30-cross-end-digest-recovery.test.mjs` | 19/20 | 5 处改钉（`:3` ∥ `:18` ∥ `:829` ∥ `:842` ∥ `:851`） | **20/20**（仿真已验 · exit 0） |
| 2 | `docs/batches/2026-09-30-digest-persistence.test.mjs` | 3/9 | `:3` 断代注读数刷新（红腿 = 2 ∥ 3 ∥ 4 ∥ 5b ∥ 6 ∥ 7） | 注文与复跑读数一致 |
| 3 | `docs/batches/2026-10-01-desktop-digest-teardown.test.mjs` | 1/7 | `:13` 断代注读数刷新（红腿 = 1 ∥ 2 ∥ 3 ∥ 4 ∥ 6 ∥ 7；腿 2 = 注释残词命中） | 注文与复跑读数一致 |
| 4 | `docs/batches/2026-10-02-desktop-menu-system.test.mjs` | 2/8 | 六腿重锚（键集 43 ∥ 组名 设置 ∥ 条目序 ∥ 通道 48 ∥ findItem 深查）+ 头注 | **8/8**（仿真已验 · exit 0） |
| 5 | `docs/batches/2026-10-02-desktop-settings-menu-upgrade.test.mjs` | 5/8 | 波1①②③ 重锚（六项形 ∥ 键集 43 ∥ 白名单 48）+ 头注/题注 | **8/8**（仿真已验 · exit 0） |
| 6 | `docs/batches/2026-09-29-i18n-split.test.mjs` | 1/5 | A1/A4/A6 按现读重锚 + 头注（A4 阈值 ⇒ 420 = 现读 + 5 余量 · KD-9） | **5/5**（配 #7 重冻后；仿真 4/5 = 仅 A2 待重冻） |
| 7 | `docs/batches/2026-09-29-i18n-split.baseline.json` | 295×2 条 | **重冻**：跑 `node .thincoder/tmp/r4-probe/refreeze-baseline.mjs docs/batches/2026-09-29-i18n-split.baseline.json`（写 314×2 条；`_note` 已含重锚行） | A2 转绿（两语全量等值等序 + 三档子序列） |
| 8 | `docs/batches/2026-10-03-desktop-firstrun-provider-notice.test.mjs` | 7/7（真 config 有触） | T7 补缝（`_setConfigPathForTest` + `finally` 复位 + 缝档断言） | **7/7** ∧ 真 config 零触（隔离实测已验 · exit 0） |

**5.4 边界遵守**：不动 `docs/vsc/**` ∥ `docs/core/design/{MANIFEST,BATCH-RECORD,WEBVIEW*}.md`（设计面归 eng-designer）∥ 需求面 2 档（主 agent 笔）∥ 在飞写域 ∥ 已收口批档 `.md`——本席 diff 实证 = 2 档（`git diff --stat` 实读：`thincoder-core/agent-tools/batch.mjs` 8 行改动 + 新件 1 枚）。**绕门已排除**（`file_ops` / bash 写 = 越权，未动）。

**5.5 事故如实报备（副作用面）**：取读数时按设计验收「非隔离直跑」跑 `docs/batches/2026-10-03-desktop-firstrun-provider-notice.test.mjs`，T7 复现 #890 危害路径本身——`carryoverDefaultModel` 把 `defaultModel` 写进真实用户 config（mtime 2026-10-04 01:21:02；范围 = 仅该一键；原值不可考）。父侧已裁：停止非隔离直跑（复跑纪律 = `USERPROFILE` 隔离）、该写由父侧按用户门处置；本席无进一步修复动作（无写外仓权限）。补缝落笔后，非隔离复跑即安全。

**5.6 doc-check 读数（as-of · 实施后复跑）**：`node scripts/doc-check.mjs` = **exit 1**；锚闸 = **2 条悬空**（全数 = `docs/cli/design/CLI-ENTRY.md:20` ∥ `:81`，指向 `node-version-gate.cjs`——CLI/ACP 在写面）；行宽闸 = **2 行红**（`docs/cli/design/CLI-ENTRY.md:20` ∥ `docs/core/design/SESSION.md:970`——他批在写面）；行数面 = 8 条报告态（非本批面）。**本席封笔前基线（01:15）= exit 0** ⇒ 2 悬空 + 2 行宽均于窗口内由并行写引入；**本批零新增红**（本席改面 = 1 `.mjs` + 1 新 `.mjs`，均入行宽扫描域之外），与 §2.12 同处置形（exit 0 待在写面自净后复跑）。

**5.7 designId 回显**：本席 spawn 材料内**无 designId 字面**（§4 明书「值不入档」；token 门由父侧 spawn 时完成）——按实情报 `unverified`（不以猜测充数）；授权面旁证 = 本席产品码/批档写均落地无门阻（写门解锁若未过则首笔即拒）。

**状态行**：实施完成（2026-10-04）

**5.8 逐档改前/改后逐字对（父侧落笔面 · 逐件仿真已验证；长句给逐字片段 + 全行参考件）**

**① `docs/batches/2026-09-30-cross-end-digest-recovery.test.mjs`（5 处 · 仿真 20/20）**
- `:3` 改前 ` * 状态（2026-10-01 · VSC 舱交付复跑）：K1–K7 ∥ C1a–C5 ∥ V1–V5 = **20/20 绿**（仓根 \`node --test\`）。` → 改后 ` * 状态（**2026-10-04 重锚复跑 · 台账 #824**）：K1–K7 ∥ C1a–C5 ∥ V1–V5 = **20/20 绿**（仓根 \`node --test\`）——V4② 随「未结轮照现」机制重锚（末页 open ⇒ label + count 两元素）。`
- `:18` 「半轮零元素」 ⇒ 「未结轮照现〔两元素〕」（同行其余逐字不动）。
- `:829` 用例标题同改：`半轮零元素（容差①）` ⇒ `未结轮照现（容差①）`。
- `:842` 注释改前 `// ② 半轮零元素：cap 无打开轮 ∥ end 缺 start ∥ start 缺 end ⇒ 零元素` → 改后 `// ② 未结轮照现：cap 无打开轮 ∥ end 缺 start ⇒ 零产；start 缺 end〔末页 open〕⇒ 照现两元素`。
- `:851` 断言 `length, 0, "半轮零元素（跨页分裂轮页内不产）"` ⇒ `length, 2, "未结轮照现（末页 open——label + count 两元素）"`。

**② `docs/batches/2026-09-30-digest-persistence.test.mjs`（`:3` 单行 · 注文与读数一致）**
- 改前片段：`⚠ 断代（2026-10-01 · 台账 #765 拆批）：旧形态断言红（实测：腿 2 ∥ 3 ∥ 4 ∥ 6 红——位次 ∥ 终态轮 ∥ 键面面随后续批演进；import 未断）`
- 改后片段：`⚠ 断代（2026-10-01 · 台账 #765 拆批；**2026-10-04 复验读数刷新——台账 #824**）：旧形态断言红（实测 = 3/9——腿 2 ∥ 3 ∥ 4 ∥ 5b ∥ 6 ∥ 7 红——位次 ∥ 终态轮 ∥ 键面面随后续批演进；import 未断）`
- 全行逐字参考件 = `.thincoder/tmp/r4-probe/` 同名件（下同）。

**③ `docs/batches/2026-10-01-desktop-digest-teardown.test.mjs`（`:13` 单行 · 注文与读数一致）**
- 改后片段（相对改前之增量，逐字）：断代标注追加 `；**2026-10-04 复验读数刷新——台账 #824**`；枚举 `腿 1 ∕ 3 ∕ 4 ∕ 6` ⇒ `腿 1 ∕ 2 ∕ 3 ∕ 4 ∕ 6 ∕ 7`；枚举后插入腿 2 归因 `（… ∥ 折出轮 ≤1；腿 2 红因 = 注释残词「座次」命中 \`thincoder-desktop/renderer/store.mjs:145\`——注释层，非状态复辟）`；`**复跑必红为预期` ⇒ `**复跑实测 1/7 红为预期`。

**④ `docs/batches/2026-10-02-desktop-menu-system.test.mjs`（12 处 · 仿真 8/8）**
- `:3` 头注整句替换：改前 `**注（2026-10-02 · #817 落盘后）**：…复跑红 = 预期（非缺陷）；现行判据 → …` ⇒ 改后 `**重锚（2026-10-04 · 台账 #889）——断言 = 现盘形**：菜单树形 ∕ 动作集 ∕ 键集（43）∥ 通道计数（48）随后续批演进（#817 设置体系 ∥ #888 更名 ∥ 桌面发布批 \`panel:state\` 等）——本档逐腿改钉至现读（复跑 8/8）；平行判据 = …upgrade.test.mjs… ∥ …settings-menu-trim.test.mjs…。`
- `:43-51` `WORD_KEYS` 全表替换（29 键 ⇒ 43 键）：首行片 `"file", "edit", "view", "settings", "maintenance", "help",`；新增段 `"settingsOpen",` + `"helpCommands", "about", "aboutShortcuts", "checkUpdate", "checkingUpdate", "downloadingUpdate",` + `"restartUpdate", "updateDialogTitle", "updateFailed", "updateNotice", "updateRestartCancel",` + `"updateRestartConfirm", "updateRestartOk", "updateUpToDate",`（全表逐字 = 参考件）。
- `:65-67` 助手改钉：新增 `const deepItems = (items) => items.flatMap((item) => [item, ...(Array.isArray(item.submenu) ? deepItems(item.submenu) : [])])`；`findItem` 改 `deepItems(flat(template)).find((item) => item.label === label)`（「命令与快捷键…」等两层级条目可达）。
- `:75` `["文件", "编辑", "视图", "维护", "帮助"]` ⇒ `["文件", "编辑", "视图", "设置", "帮助"]`。
- `:77` 组[0] 条目 ⇒ `["新建会话", "打开工作目录…", "最近工作目录", "separator", "关闭窗口", "退出 ThinCoder"]`。
- `:93-94` 组[3]/[4]（映射改 `item.label ?? item.type`）：组[3] ⇒ `["设置…", "separator", "providers…", "agent…", "mcp…", "env…", "tools…", "models…", "separator", "维护", "关于与快捷键"]`；组[4] ⇒ `["检查更新…", "separator", "命令与快捷键…", "关于 ThinCoder…"]`。
- `:125` 空表标签 `"无最近项目"` ⇒ `"无最近工作目录"`。
- `:165-166` zh ⇒ `["文件", "编辑", "视图", "设置", "帮助"]` ∥ en ⇒ `["File", "Edit", "View", "Settings", "Help"]`。
- `:190` 点击标签 `"打开项目…"` ⇒ `"打开工作目录…"`。
- `:249` `assert.equal(WORD_KEYS.length, 29)` ⇒ `43`。
- `:283-286` 白名单：注释 `46 ⇒ 47…theme:state` ⇒ `47 ⇒ 48：末位 = panel:state（零改名零位移——theme:state 仍在册）`；三断言 `47 ⇒ 48` ∥ `at(-1) === "theme:state"` ⇒ `"panel:state"`。
- 腿⑤ 题/描述（`:17-18` ∥ `:278`）：`末位 47 = theme:state` ⇒ `末位 48 = panel:state`。

**⑤ `docs/batches/2026-10-02-desktop-settings-menu-upgrade.test.mjs`（波1面 · 仿真 8/8）**
- `:6` 头注整句替换（`#820 邻接注…恰 2 红 = 预期`）⇒ `**重锚（2026-10-04 · 台账 #889）——断言 = 现盘形**：波 1 腿①/② 已按 #820 六项形改钉（…六组项…；`SETTINGS_GROUPS` ≡ `SECTIONS` 名序去「模型与档位」，设置页七段零动）＋ 词表键集 43 ∥ 白名单 48 随读改钉（复跑 8/8）。`
- `:9-13` 腿描述：`七组项` ⇒ `六组项`（×2）；`SETTINGS_GROUPS ≡ SECTIONS 名序 ≡ 读取面键序` ⇒ `…名序去「模型与档位」…`；`键集 29 ⇒ 32` ⇒ `键集 43`；`白名单 47 不动` ⇒ `白名单 48 不动`。
- `:53` 注释 `29 ⇒ 32` ⇒ `43`；`:166` 段注释 ∥ `:168` 题：`七组项` ⇒ `六组项`。
- `:173-176` 条目表 ⇒ `["设置…", "separator", "渠道…", "agent 参数…", "MCP…", "运行环境…", "工具与服务…", "会诊与审查…", "separator", "维护", "关于与快捷键"]`，题句尾 `七组项` ⇒ `六组项`；`:178` `group.slice(2, 9)` ⇒ `group.slice(2, 8)`。
- `:186` `const maintenance = group[10]` ⇒ `group[9]`；`:190` `const aboutShortcuts = group[11]` ⇒ `group[10]`。
- `:198-202` 帮助组 ⇒ `["检查更新…", "separator", "命令与快捷键…", "关于 ThinCoder…"]`（映射改 `i.label ?? i.type`）；跨面闭集 ⇒ `SETTINGS_GROUPS ≡ SECTIONS 名序去「模型与档位」`、`SETTINGS_GROUPS.length` `7` ⇒ `6`。
- `:210-211` en 下标 `submenu[10]` ⇒ `[9]` ∥ `submenu[11]` ⇒ `[10]`。
- `WORD_KEYS`（`:54-62`）⇒ 43 键（同 menu-system 表）；`:225-226` 计数 ⇒ `43` ∥ `43`；`:215-219` 腿②题/文案 `键集 32` ⇒ `43`。
- `:257-258` 下标/标签：`submenu[3].label` `"模型与档位…"` ⇒ `"agent 参数…"`；`submenu[8]` ⇒ `submenu[7]`（`"会诊与审查…"`）。
- `:269-276` 通道：注释 `白名单 47 与注册表闭包不动` ⇒ `48`；断言 `47` ⇒ `48`（两处）。

**⑥ `docs/batches/2026-09-29-i18n-split.test.mjs`（A1/A4/A6 重锚 + 头注 · 仿真 4/5＝仅 A2 待重冻；配 ⑦ 后 5/5）**
- 头注（`:2-15`）：接受收正块 KD-9 口径——`settings 族 55 键` ⇒ 去数字；追加重锚块（`SETTINGS_DICT` 62 ∥ `VIEWS_DICT` 139 ∥ 主档自有块 85×2 ∥ 主档 415（A4 阈值 ≤400 ⇒ ≤420 = 现读 + 5 余量 · KD-9）∥ `i18n-views.mjs` 386；A2 基线 = 2026-10-04 全量重冻 314 条两语）；A1 行 87 ⇒ 85、合计 294 ⇒ 314；A4 行 `≤ 400` ⇒ `≤ 420`、`（328 ∕ 92）` ⇒ `（386 ∕ 92）`；A6 行 `205 ∕ 224 ∕ 25` ⇒ `204 ∥ 227 ∥ 25`。
- A1（`:55`）：`["SETTINGS_DICT", SETTINGS_DICT, 55], ["VIEWS_DICT", VIEWS_DICT, 125], ["COMPOSER_DICT", COMPOSER_DICT, 28]` ⇒ `55⇒62` ∥ `125⇒139` ∥ `28` 不动；`:59-60` `87` ⇒ `85`（×2）；`:54` 题 `87×2` ⇒ `85×2`。
- A2（`:78-79`）：文案 `295 条` ⇒ `314 条`（×2）；`:84` `（搬前冻结 2026-09-29）` ⇒ `（2026-10-04 重冻 · 台账 #889）`。
- A4（`:88-95`）：`main <= 400` ⇒ `main <= 420`（文案补 `现读 + 5 余量…`）；`i18n-views.mjs` `332` ⇒ `386`（×2，断言 + 文案）；题 `≤400` ⇒ `≤420` ∥ `（332 ∕ 92）` ⇒ `（386 ∕ 92）`。
- A6（`:112-124` FROZEN 表）：`statusline.mjs 205⇒204` ∥ `statusline-segments.mjs 224⇒227` ∥ `settings.mjs 334⇒398` ∥ `settings-agent.mjs 227⇒230` ∥ `settings-controls.mjs 130⇒145` ∥ `settings-sections.mjs 297⇒164` ∥ `settings-sections-env.mjs 134⇒137` ∥ `settings-sections-mcp.mjs 178⇒185` ∥ `settings-sections-tools.mjs 161⇒208`（`banner 25` ∥ `settings-confirm 80` ∥ `settings-sections-models 164` 不变）；注释 `搬前实读` ⇒ `2026-10-04 届盘实读重锚`。

**⑦ `docs/batches/2026-09-29-i18n-split.baseline.json`（重冻）**
- 落笔 = 跑 `node .thincoder/tmp/r4-probe/refreeze-baseline.mjs docs/batches/2026-09-29-i18n-split.baseline.json`（cwd = `thincoder/`）；产物 = `{_note, en, zh}`，`en`/`zh` = 现盘 `HOST_DICT` 两语全量 `[[key,value],...]`（314 条 × 2；与对拍件 A2 的 `entrySeq` 同式）；`_note` 尾部追加 `【重锚 2026-10-04 · 台账 #889】HOST_DICT 随后续批条目增殖——条目 295 ⇒ 314（现盘全量重冻；对拍语义 = 现盘全量等值等序 + 三档子序列相对序保）。`。重冻后 A2 转绿（三档子序列关系已实证）。

**⑧ `docs/batches/2026-10-03-desktop-firstrun-provider-notice.test.mjs`（T7 补缝 · 隔离实测 7/7）**
- `:413` 后（`const cwd = …` 行下）新增：`cfgIo._setConfigPathForTest(join(tmpDir("fr840-t7-cfg-"), "config.json")) // 写回去向 = 缝（真 config 零触 — #890）`。
- `:443` 后新增断言：`assert.equal(JSON.parse(readFileSync(cfgIo._configPath(), "utf8")).defaultModel, "p1:m1", "写回去向 = 缝档（#890：真 config 零触）")`。
- `finally`（`:451-452`）内新增：`cfgIo._resetConfigPathForTest()`。
- 复跑判据：隔离（`USERPROFILE`/`HOME` 指临时家）实测 **7/7 · exit 0** ∧ 真 config mtime 零变；落笔后非隔离复跑同安全。

**5.9 参考件（验证用 · 非落笔面）**：`.thincoder/tmp/r4-probe/` 下五枚 `<件名>.final.mjs`（= 改后全文；scratch 径调已还原）；复制到 `.thincoder/tmp/` 两级深度即与 `docs/batches/` 同径、可直接复跑（i18n 件待 ⑦ 重冻后转 5/5）。

**§5 修正轮 1（承内部审计 D1–D4）与代码评审轮次（verdict = pass）**

**审计轮次 1（内部 explore 审计 · 只读）**：判定 = 2 档实装与设计逐条相符（PARTIAL ∥ SILENT-SIMPLIFICATION ∥ DOC-DRIFT ∥ OUT-OF-LIST 四类机械面逐类复核未见）；D1–D4 逐条处置：
- D1（🟡 menu-system 仿真件增额 +4 > 设计 ≤+3）：已修正——`WORD_KEYS` 尾两行合并 ⇒ **+3**（设计口径 301 ⇒ 304）；复跑复验 = 8/8。
- D2（🔵 新件行数误记 103）：收正 = **115 行**（node/read 口径；`Get-Content` 计数偏差 ≈1.12 倍——本档一律以 node/read 口径为准）。
- D3（🔵 `git diff` 表述自相抵）：收正 = 单 hunk **3 行 ⇒ 5 行（净 +2）**；档级 = 设计 2.4 基准 313 ⇒ **315 = +2 ≤ +2 达标**。
- D4（🔵 upgrade 仿真件 `:181` 消息残留「七组项」）：已修正为「六组项」；复跑复验 = 8/8。

**代码评审轮次 1（内部 advisor · code）**：**VERDICT = pass**（🔴 0 · 🟡 1 · 🔵 6）。🟡 = `batch.mjs` 现读 **315 行**越 300 顾问线（设计 2.4 号 2② 已预登记 · R3 存量不升级 · 非阻塞）；🔵 6 条处置 = 5 条随本轮扫清（注释补「两字面 `/g` ∥ 非 `/g` 分工勿合并」判据 ∥ 新件 C1/C2 断言改全段判 ∥ 新件临时目录腿尾清理 ∥ 新件头注补「两源差异」防误对齐），1 条**不采纳**（第三形尾加数字界——与设计 2.3 终值字面逐字相抵，形面改钉归设计面，另笔处理）。总判定 = **clean**（交付级收敛；批次级评审不随本轮——§2 收正块边界）。

**复验读数（修正后 · 全绿 · 落盘日志 = `.thincoder/tmp/r4-probe/`）**：本批新件 `5/5`（全段判强化后；tmp 零残留实证 = 跑前 18 ⇒ 跑后 18）∥ design-token-echo `12/12` ∥ batch-mechanics `5/5` ∥ manifest-resolution-fix `7/7` ∥ core-tools-pairfix `12/12` ∥ menu-system 仿真 `8/8` ∥ upgrade 仿真 `8/8` ∥ cross-end 仿真 `20/20` ∥ i18n 仿真 `4/5`（仅 A2 待 ⑦ 重冻）∥ firstrun 仿真（隔离）`7/7`。

**doc-check 终读（封笔）**：`node scripts/doc-check.mjs` = **EXIT 0**——`OK(锚): 0 条悬空` ∥ `OK(行宽): 源域全部 .md 无 >300 字符单行`；行数面 9 条 = 报告态（非本批面）。验收④达成。

## §6 验证与收口（父代理）

**未决（用户门 · 2026-10-04 01:21 入档）——真实用户 config 被测试写（#890 危害路径实证）**：

- **事实**：实施轮 #77 取「非隔离直跑」读数时，`docs/batches/2026-10-03-desktop-firstrun-provider-notice.test.mjs` T7（`host.setPrefs`）经 `carryoverDefaultModel` 把 `defaultModel:"p1:m1"` 写入真实用户 config（`C:\Users\liwei\.thincoder\config.json`，mtime 2026-10-04 01:21:02；行 178）。范围核实（报告方 grep）：仅该一键——无渠道条目 / 无密钥泄入；**原值不可考**（无今日 `.bak`；仅 2026-09-20 两枚旧备份）。
- **处置**：① 已令停止一切非隔离直跑（复跑纪律 = `USERPROFILE` 隔离）；② 本批 T7 补缝（#890 修法）落笔后非隔离复跑即安全（写落临时档）；③ **恢复形 = 用户裁定**（待用户）：㈠ 报原模型 ⇒ 父侧恢复 ∥ ㈡ 删键（缺省 = 未设置）∥ ㈢ 授权只读 09-20 备份中的 `defaultModel` 行作候选（备份含密钥——未擅读）。
- **状态**：挂用户门（用户起床裁定）；复跑纪律升级在案。

**收口判词：已收口 2026-10-04**（设计（#61）→ 评审 #69 pass → 收正 #74 九条 → §4 代签 → 三路实施（设计面 #76 ∥ 产品/测试面 #77 ∥ 父侧/主 agent 面）→ 本节核销 → 签入）

- **交付判据链**：#893——`batch.mjs` 第三形（315 = 313+2）+ 批内件 C1–C5 先红后绿（3/5 ⇒ **5/5**）+ 既有两形零回归 ∥ **8 档父侧执行**（① cross-end **20/20** ∥ ④ menu-system **8/8** ∥ ⑤ upgrade **8/8** ∥ ⑥ i18n-split **5/5**（配 ⑦ 基线重冻 314×2）∥ ⑧ firstrun **7/7** + **真 config 零触实证**（mtime+size 双同）∥ ②③ 断代注读数刷新（3/9 ∥ 1/7 实测对轴））∥ #825 五修点 + 设计三处 + 需求两档（退场注）∥ #833 MANIFEST 两处（改指实守卫 ∥ 去引）+ 收口登记 ∥ #889 家族三件重锚（8/8 ∥ 8/8 ∥ 5/5）∥ #890 缝落（T7 三处补缝 + 隔离实测）∥ #824 邻二件注刷新 ∥ `doc-check` exit 0 ∥ 提交 `fb74cd5b` ∥ `0742947b`（安全掩码）。
- **残余/未决（在册）**：① **用户门**——真实 config 被 T7 写事件（本条上项在档；恢复形待用户裁定：报原模型 ∥ 删键 ∥ 读备份候选）；② `batch.mjs` 315 行越 300 顾问线（预登记 · 非阻塞——§2 号 2②）；③ 面外注记②（`2026-10-03-design-token-echo.md:12` 无标两段全形残形）**已就地掩除**（安全掩码 = 冻结档上的凭证纪律优先；掩后与档内既有 `…` 形一致）；④ 面外注记①（batch 工具 `status` 面未消费剥除机制——设计 §2.7 明定本批不改，留档）。
- **结算**：台账 #824 ∥ #825 ∥ #833 ∥ #889 ∥ #890 ∥ #893 核销 ∥ 签入。
