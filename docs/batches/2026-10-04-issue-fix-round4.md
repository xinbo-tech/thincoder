# 2026-10-04 · issue 修复批·四（家族重锚/工程面 6 条：digest 家族重锚 ∥ 不在盘 test 引用 ∥ 指针清扫 ∥ 冻结系件重锚 ∥ #840 配置缝 ∥ batch 写通道正则）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-04 · 来源 = 用户 2026-10-04 00:39「五组都开了」（承 00:31「都自动跑」）；条目源 = 2026-10-03 分诊与在册归批（#824 ∥ #825 ∥ #833 ∥ #889 ∥ #890 ∥ #893——家族重锚/工程面）。
> 台账 = #824 ∥ #825 ∥ #833 ∥ #889 ∥ #890 ∥ #893（家族/工程面 · 归批）。前情 = 无（同会话兄弟批——一组/二组/三组 = `2026-10-04-issue-fix-round{1,2,3}.md`）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**本批性质**：归批组第四组（家族重锚/工程面 6 条）——用户 00:39「五组都开了」；全链。

**本批条目（6）**：**#824** digest 家族重锚 ∥ **#825** 不在盘 `test.mjs` 引用 ∥ **#833** 指针清扫 ∥ **#889** 冻结系件家族重锚 ∥ **#890** #840 配置缝 ∥ **#893** `batch.mjs:44` 写通道凭证正则（裸 uuid 不剥——随 strip 单源面对表裁）。**锚 = 台账行在册**（复验先读：`ledger_query` cwd=D:\teamcode\thincoder）。
**处置形注意**：#824 ∥ #889 系「家族重锚」类——处置可为「重锚 ∥ 收口 ∥ 撤回」而非代码修——设计轮**逐条定处置形**并给由；#893 的裁定面 = 与 strip 单源（design-token 面）对表。

**复验令**：逐条实读复验；已消/前提变者按实况登记。

**授权口径**：全链；都自动跑（自缚三条在册）。

**边界**：在飞写域零触——#51 ∥ #56 ∥ #59 ∥ #57/#58 ∥ 面板面；本批多涉工程面文档/脚本（`scripts/**` = 父侧工程工具面，实施形按设计裁定）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（逐条复验实跑在案；裁定表 + 修法落点 + 受影响表 + 验收对照全在 §2（裁定登记面））
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
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
