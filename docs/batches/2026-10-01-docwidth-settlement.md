# 2026-10-01 · 行宽清账
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-01 · 来源 = 用户 2026-10-01 全自动代选授权（材料推荐 ②）+ 取证批 #779 结论。
> 台账 = #779（core · 归批）。前情 = docs/batches/2026-10-01-docwidth-evidence.md（取证轮——材料在档 · #779；本批 = 决策 + 实施）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-01
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**批次性质**：行宽清账批（#779 后续）——按**已裁 ②**（用户 2026-10-01 全自动代选授权）：**历史区结构性豁免 + 117 正文清账**（全档行宽门 ∥ 悬空门收口）。

**关键判据**：豁免域 = 机械可判（设计定形——禁「整档放行」；豁免后正文门读数目标 0）∥ 117 悬空清账逐条（取证档在册）∥ 行数差 4 口径收一 ∥ 验收 = doc-check 全仓绿 + 复发窗复测（新写文档 12 分钟 +5 行复现面）。

**授权口径**：来源 = 取证批 #779 结论 + 全自动代选；设计 = eng-designer（#42 在跑）；评审 = 设计落定后父侧按授权代发；§4 代签 = 父侧。

**注**：`scripts/doc-check.mjs` = 工程工具面——**判据语义变更（豁免）走设计前置**；落笔 = 父侧直执行（机械面 · 单 commit 可 revert）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成 2026-10-01（行宽清账批 · fix 轮（评审轮 1 八发现：#1–#6 ∥ #8 裁收 ∥ #7 不采纳——§2.11）+ 复审后收正轮（评审轮 2 新发现 #9 ∥ #10 裁收——§2.12）+ 设计补缺轮（实施实测缺口：schema 档入受影响面 ∥ 键数句同族同步——§2.13）+ 评审轮 3 后收正轮（评审轮 3 五发现逐号落——§2.14）；设计档同拍、读回在册）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目（覆盖）与写面

**本批（行宽清账批）= 决策（②——已裁）+ 实施设计**。四条覆盖：

1. **豁免域判据**（条目 1）：历史区宽度豁免 = 机械可判的**结构性区带谓词**（禁整档放行）；豁免后正文门读数目标 = **0（含新增）**。
2. **117 悬空清账**（条目 2）：逐条清单（分类 + 逐条）+ 机械收正规则（指针改指 ∥ 删除 ∥ 补建——按类）。
3. **行数差口径收一**（条目 3）：行数面「差异 ∕ 预估 ∕ 非数」三态收一方案（「行数差 4」实指 = 预估形 4 行——§2.5）。
4. **验收**（条目 4）：doc-check 全仓绿复核命令 + 复发窗复测法（12 分钟 +5 行复现面对齐）。

**写面**：本节 + `docs/core/design/DOC-DISCIPLINE.md`（§3.15 条目 N ∥ §5 A-DD23 ∥ §7 两行 ∥ 枚举两处 ∥ 变更记录——**本轮已落，读回在册**）。**禁面遵守**：`scripts/**` 零写（工程工具面 = 实施轮）∥ 产品码零触 ∥ 清账执行 = 清账轮（另轮）∥ 批档 §1/§4/§6 零触。
**三链同源（收窄至覆盖条目 1 ∥ 条目 4）**：豁免域判据 ∥ 验收链 = `DOC-DISCIPLINE.md` §3.15 ∥ §5 A-DD23 = 台账 #779（归批）；**条目 2 ∥ 条目 3**（清账清单 ∥ 行数面口径）= 本档操作面（落点 = §2.3 ∥ §2.5——设计档无对应节）。

### 2.2 豁免判据（机械定义）

**判定谓词（定形——单一权威源 = `docs/core/design/DOC-DISCIPLINE.md` §3.15）**：

- **区带名集（闭集）** = `{变更记录, 历史沿革}`——声明于 `checkConfig.widthExemptZones`。
- **区带头判定**：标题文本去 `^#{1,6}\s` 与首部编号（`^\d+(?:\.\d+)*[.、]?\s*`）后，**等于区带名** ∨ **以「区带名 + `（` ∕ `(`」起**（容括注后缀，如 `变更记录（续）`）；闭集外标题（`变更记录全文…` ∥ `不并项与历史沿革` ∥ 括注含「历史沿革」的失效节）**不纳**（fail-closed）。
- **归属判定（标题链）**：行所属全部在栈祖先标题（最近标题起、层级上溯）任一命中 ⇒ 豁免（分嵌套子标题防逃逸）。
- **射程**：仅宽度面；条件 = `len > lineWidth ∧ ¬表格行 ∧ ¬区带` 才照报；**不分新旧**（区带内新行同免；区带外新行沿「新增行零超宽」相对判据）。
- **惰性闸**：`widthExemptZones` 缺省 ∕ 空集 ⇒ 零豁免（fail-closed——声明缺失不静默放行）。
- **禁整档放行**：谓词只认标题链，不认档名 ∕ 档路径 ∕ 整档状态。

**判据 dry-run（本席实跑 · as-of 2026-10-01 17:5x）**：复刻 `checkDocWidths` 同参（`lineWidth` ∥ `scanDirs` ∥ `anchors.exclude`）+ 谓词同构——全仓超宽 **288** 行 ⇒ **区带豁免 169**（全落 `变更记录` 区带）· **正文面 119**（= 清账目标 ∥ 见 §2.4）；与取证轮分类器（最近标题 ∥ 子串匹配）**逐行判集相同（diff 0）**——定形无覆盖偏移。读数随并行写链漂移（相对判据——执行轮首动作前复测）。

**行宽面扫描域（实读依据——只读面）**：域 = 仓根 `docs` 全深 .md，**排除**名为 `_archive` ∥ `batches` 的目录（任意深度）——声明 = `PROJECT-MANIFEST.json:24-35`（`checkConfig.scanDirs` = `["docs"]` ∥ `checkConfig.anchors.exclude` = `["_archive","batches"]`）；行宽检查与锚检查**同域同参**（`scripts/doc-check.mjs:65` 传 `scanDirs` ∥ `anchors.exclude`；`scripts/doc-check-targets.mjs:19-43` 逐层目录名排除）。**排除面依据** = 归档档不作现状依据 ∥ 扫描域不含批档（`DOC-DISCIPLINE.md` §4.6）。⇒ 本档 ∥ `_archive` 面在行宽判集外——「读数目标 0（含新增）」射程不含批档。

**现行裁定对表（单源 = `DOC-DISCIPLINE.md` §3.15——本档只引用不重述；取证轮 §2.7 上抛 (d)(e) 已按其口径吸收）**：判据全文 = §3.15「契约 ∥ 现行裁定对表 ∥ 防复发双闸」；「**半二（新行 ≤300）**」= 「读数目标 0（含新增）」的第二半——**区带外**新行零超宽（相对判据——出处 = §3.15 防复发双闸 ① ∥ 本档 §2.4 末条）。

**六件契约（机制批交付面——详 = §3.15）**：① 机制（宽度谓词族 + 标题栈；`checkDocWidths` opts 增 `exemptZones`）② 规范（规则句 + 运行面措辞双层）③ 影响面（报告集下降 ∥ 非区带照报 ∥ 他面零接触 ∥ 不新增计数列）④ 残余登记（区带内非记录行照免——fail-open 向 ∥ 闭集外标题不纳 ∥ 条目形不豁免）⑤ 声明（`checkConfig.widthExemptZones`）⑥ 自测件随动（单元测试档——DD-60–DD-62）。

### 2.2b 受影响面（机制侧——全清单）

| # | 面 | 当前行数 | 预计增量 | 动作 | 归属 |
|---|---|---|---|---|---|
| 1 | `scripts/doc-check-width.mjs` | **66**（实测 · as-of 2026-10-01） | **≈ +30**（标题栈 + 区带谓词 + `opts.exemptZones`） | 标题栈 + 命中条件 + opts `exemptZones`（缺省空 = 惰性） | 工程工具面（父侧 · 实施轮） |
| 2 | `scripts/doc-check.mjs` | **88**（实测 · as-of 2026-10-01） | **≈ +3**（结论行措辞 ∥ 传参；`CRITERIA_KEYS` 同行改） | `CRITERIA_KEYS` 6 → 7（+ `widthExemptZones`——D3 单源数组同改）+ 宽度结论行措辞（反映豁免域）+ 传参 | 工程工具面（父侧 · 实施轮） |
| 3 | `PROJECT-MANIFEST.json` | — | — | `checkConfig.widthExemptZones: ["变更记录","历史沿革"]` | 工程工具面（父侧 · 实施轮） |
| 4 | `docs/core/design/DOC-DISCIPLINE.md` | — | — | §3.15 条目 N ∥ §5 A-DD23 ∥ §7 F2 键句 ∥ 五档接口 width 行 ∥ 枚举两处 ∥ 变更记录；**fix 轮增补**：七处口径收窄 ∥ §3.15 对表登记 + 引据改指 ∥ DD-61 三夹具 ∥ A-DD23 判据 1 随动 ∥ 尺寸档登记（详 = §2.11） | 设计档（本席——设计轮 + fix 轮已落） |
| 5 | 自测件（单元测试档——名随清账批批档） | —（新建） | **≈ +120**（预估——同类批内件实读：`docs/batches/2026-09-29-doc-check-face.test.mjs` = 115 行） | 新建（夹具 = DD-60–DD-62） | 实施轮 |
| 6 | `docs/core/requirements/STRUCTURE-DEBT.md` N-SD4 | — | — | 豁免句增补（表格行豁免 + 历史区豁免） | 主 agent 域（上抛 §2.10） |
| 7 | 清账轮（另轮） | — | — | 锚面 **24 档** + 宽面正文 **20 档**（逐档 = §2.3 ∥ §2.4 清单） | 清账轮（另轮） |

**两列射程（`DOC-DISCIPLINE.md` §3.7 口径）**：源 ∕ 测试档（`.mjs`）——`.md` ∥ 数据档 ∥ 批次面行填 `—`；`scripts/doc-check-width.mjs` 尺寸档登记（不拆 + 触发 + 抽取候选线——实测 66 行 ≪ 300）= `DOC-DISCIPLINE.md` §3.15。

### 2.3 117 悬空清账（规则 + 逐条清单）

**读数**：闸态悬空 **117** = 路径/坐标 **106** + 符号 **8** + 用例号 **3**（as-of 2026-10-01 17:5x · 本席实跑 `checkAnchors` 复刻）；基线 = 执行轮首动作前复测（读数随并行写链漂移）。

**机械收正规则（按类——沿 `DOC-DISCIPLINE.md` §4.3 处置三选口径展开）**：

| 规则 | 适用 | 动作 | 依据 |
|---|---|---|---|
| **R1 改指·补前缀** | 承接物**在位**（n=1 ∥ 行内语境可定）——裸相对段 ∥ 部分路径 | 改写为**自仓根完整路径**（坐标尾保留）；目标须盘上实存（改后零悬空） | D4 锚形态规范句（§1）+ §3.9 J-1 先例 |
| **R2 改指·承名** | 改名已发生（旧名盘上无 ∥ 承接物实存）且行施为 = 现态陈述 | 改指承接物全路径（行号随读）；**不得换名了事**（承接实核先行） | §3.8 判据 A 类 |
| **R3 删除·裸名化** | 死名**无承接**（退役 ∕ 删档）∥ 记录面行 | 去目录段 + 去坐标尾 → **裸名**（不成锚）；语义逐字保留 | §3.8 形态纪律 |
| **R4 删除·改述** | 死坐标片段 ∥ 陈述已失真（「仍在位」类） ∥ 窄符号三要素误锚 | 删坐标形态 ∕ 改述为现态事实（破要素） | §4.3 三选 ①② |
| **R5 注记·退场** | 用例号 ∥ 符号——退场且编号仍承载追踪价值；来源指针在场 | 加**标准退场注记**（现役注记集词 + 来源指针）——整行过 | §4.2.10 注记句 + §4.6「改写或注记」 |
| **补建** | 需建立可解析承接物者 | **预期 0 件**；如有 ⇒ **不自行造物，停下上报** | 本批边界 |

**执行纪律**：逐档改完即读回（D6）；同行只改现态 ∥ 锚形态表达、不重写整段；行内同形全量一次到位；改后复跑 ⇒ 零悬空 + 零新增；**执行轮 = 清账轮（另轮）——本清单 = 设计面处置建议**；批档域 ∕ `_archive/**` 扫描域外——零触。

**逐条清单（117 · 位置 = as-of 坐标——落笔前逐处回读；「承接」= 本席实核盘上存在）**：

| # | 类 | 位置 | 锚 | 处置 | 备注 |
|---|---|---|---|---|---|
| 1 | 路径 | docs/cli/design/CRASH-REPORTS.md:197 | src/heap-watch.mjs | R1 | 承接 = thincoder-cli/src/heap-watch.mjs |
| 2 | 用例 | docs/cli/design/TUI.md:602 | T-XL2 | R5∕R4 | 用例迁出扫描域（批内件）；来源指针在场（单测树重建回迁） |
| 3 | 符号 | docs/core/design/AGENT-LOOP-SUBAGENT.md:698 | batchSegmentTool | R4∕R5 | 过渡别名已退役；去「导出」谓词 ∥ 注记 |
| 4 | 符号 | docs/core/design/AGENT-LOOP-SUBAGENT.md:728 | batchSegmentTool | R4∕R5 | 同上（登记册行——实读 thincoder-core/agent-tools.mjs） |
| 5 | 路径 | docs/core/design/CORE-UNIFICATION.md:816 | src/agent-tools/batch-segment.mjs | R2∕R3 | 承名 = thincoder-core/agent-tools/batch.mjs（迁移台账行） |
| 6 | 路径 | docs/core/design/CORE-UNIFICATION.md:1325 | agent-tools/batch-segment.mjs:43 | R2 | 承名 = batch.mjs:43（configureBatchSegment 实存） |
| 7 | 路径 | docs/core/design/CORE-UNIFICATION.md:1361 | agent-tools/batch-segment.mjs | R2∕R3 | #84 注入缝行（同族） |
| 8 | 路径 | docs/core/design/CORE-UNIFICATION.md:1361 | thincoder-core/agent-tools/batch-segment.mjs:43 | R2 | 同族（注入缝坐标） |
| 9 | 路径 | docs/core/design/CORE-UNIFICATION.md:1406 | agent-tools/batch-segment.mjs | R2∕R3 | S2 前置门行（同族） |
| 10 | 路径 | docs/core/design/DOC-CODE-RECONCILE.md:275 | src/tui/slash-commands.mjs:45 | R1 | 承接 = thincoder-cli/src/tui/slash-commands.mjs |
| 11 | 路径 | docs/core/design/DOC-CODE-RECONCILE.md:352 | src/tui/slash-commands.mjs | R1 | 同上 |
| 12 | 路径 | docs/core/design/DOC-MIGRATION.md:38 | src/heap-watch.mjs | R1 | 承接 = thincoder-cli/src/heap-watch.mjs |
| 13 | 路径 | docs/core/design/ENGINEERING-MODE-V2.md:67 | thincoder-core/agent-tools/batch-segment.mjs | R3 | 改名对照行——裸名化（原 → 新记录） |
| 14 | 路径 | docs/core/design/ENGINEERING-MODE-V2.md:81 | memory-tool.mjs:37 | R1∕R3 | 承接实核（核 memory 面现档——行读定） |
| 15 | 路径 | docs/core/design/ENGINEERING-MODE-V2.md:92 | agent-tools/batch-segment.mjs | R3 | 改名对照行——裸名化 |
| 16 | 路径 | docs/core/design/MANIFEST.md:280 | thincoder-core/agent-tools/batch-segment.mjs:81 | R2 | 承名 = batch.mjs（消费面现态句） |
| 17 | 路径 | docs/core/design/MANIFEST.md:284 | thincoder-core/agent-tools/batch-segment.mjs | R2 | 同上 |
| 18 | 路径 | docs/core/design/MANIFEST.md:397 | thincoder-core/agent-tools/batch-segment.mjs:80-86 | R2 | 同（行区间随读） |
| 19 | 路径 | docs/core/design/MANIFEST.md:446 | thincoder-core/agent-tools/batch-segment.mjs:83 | R2 | 同上 |
| 20 | 路径 | docs/core/design/MEMORY.md:15 | src/memory-tool.mjs | R1∕R3 | 承接实核（核 memory 面——融合映射行） |
| 21 | 路径 | docs/core/design/MEMORY.md:37 | src/memory-tool.mjs | R1∕R3 | 同上（#134 行） |
| 22 | 路径 | docs/core/design/MEMORY.md:534 | agent/setup.mjs:109 | R1 | 承接 = thincoder-core/agent/setup.mjs |
| 23 | 路径 | docs/core/design/MEMORY.md:535 | memory/core.mjs:172-177 | R1 | 承接 = thincoder-core/memory/core.mjs（行号随读） |
| 24 | 路径 | docs/core/design/MEMORY.md:536 | agent/setup.mjs:111 | R1 | 同 22 |
| 25 | 路径 | docs/core/design/MEMORY.md:537 | agent/setup.mjs:99 | R1 | 同 22 |
| 26 | 路径 | docs/core/design/MEMORY.md:537 | tools/repomap.mjs:119 | R1 | 承接 = thincoder-core/tools/repomap.mjs |
| 27 | 路径 | docs/core/design/MEMORY.md:540 | core.mjs:162-165 | R1 | 承接 = thincoder-core/memory/core.mjs |
| 28 | 路径 | docs/core/design/MULTI-INSTANCE-COLLAB.md:74 | session-slots.mjs:48 | R1 | 承接 = thincoder-core/session-slots.mjs |
| 29 | 路径 | docs/core/design/MULTI-INSTANCE-COLLAB.md:297 | session-slots.mjs:48 | R1 | 同上 |
| 30 | 路径 | docs/core/design/MULTI-INSTANCE-COLLAB.md:407 | thincoder-vscode/src/agent/execute-tools.mjs | R3∕R2 | 端档迁核后去向实核；无承接 ⇒ 裸名化 |
| 31 | 路径 | docs/core/design/MULTI-INSTANCE-COLLAB.md:442 | session-slots.mjs:48 | R1 | 同 28（变更记录行） |
| 32 | 路径 | docs/core/design/PORTABILITY.md:277 | tool-gates.mjs:78 | R4∕R2 | 死名（n=0）+「仍在位」失真——承接实核后改述 |
| 33 | 路径 | docs/core/design/STRUCTURE-DEBT.md:81 | memory/core.mjs | R1 | 承接 = thincoder-core/memory/core.mjs |
| 34 | 路径 | docs/core/design/TESTING.md:465 | design/E2E-HARNESS.md | R3 | 已删档（行内已载）——裸名化 |
| 35 | 路径 | docs/core/design/TOOLS.md:77 | agent-tools/batch-segment.mjs | R2∕R3 | 融合表行——承名 ∥ 裸名化 |
| 36 | 路径 | docs/core/design/TOOLS.md:77 | src/agent-tools/batch-segment.mjs:184 | R2∕R3 | 同族（VSC 旧树形） |
| 37 | 路径 | docs/core/design/TOOLS.md:1119 | thincoder-vscode/src/agent/tool-gates.mjs | R4∕R2 | 死名（n=0）——承接实核后改述 |
| 38 | 路径 | docs/core/design/TOOLS.md:1217 | thincoder-vscode/src/agent/execute-tools.mjs:176 | R4∕R2 | 端档迁核——承接实核 |
| 39 | 路径 | docs/core/design/VERIFY-REDESIGN.md:147 | agent-tools/goal.mjs | R1 | 承接 = thincoder-core/agent-tools/goal.mjs |
| 40 | 符号 | docs/desktop/design/IPC.md:28 | ev | R4 | 窄符号误锚（谓词「导出」+唯一宿主）——改述破要素 |
| 41 | 符号 | docs/desktop/design/IPC.md:28 | key | R4 | 同 40 |
| 42 | 符号 | docs/desktop/design/IPC.md:28 | detailLines | R4 | 同 40 |
| 43 | 符号 | docs/desktop/design/IPC.md:28 | detailLines | R4 | 同 40（第 2 处） |
| 44 | 符号 | docs/desktop/design/IPC.md:28 | data | R4 | 同 40 |
| 45 | 符号 | docs/desktop/design/IPC.md:28 | detailLines | R4 | 同 40（第 3 处） |
| 46 | 路径 | docs/desktop/design/IPC.md:278 | settings.mjs:18 | R1 | 承接 = thincoder-vscode/src/extension/settings.mjs |
| 47 | 路径 | docs/desktop/design/IPC.md:446 | turn-face.mjs:122 | R1 | 承接 = thincoder-desktop/src/main/turn-face.mjs |
| 48 | 路径 | docs/desktop/design/PROJECT.md:86 | settings.mjs:380-408 | R1 | 承接 = thincoder-vscode/src/extension/settings.mjs |
| 49 | 路径 | docs/desktop/design/PROJECT.md:213 | agent-tools/settings.mjs | R1 | 承接 = thincoder-core/agent-tools/settings.mjs |
| 50 | 路径 | docs/desktop/design/PROJECT.md:225 | thincoder-desktop/renderer/chrome-denoise.css | R3∕R4 | 预案名未落（n=0）——裸名化 ∥ 改述 |
| 51 | 路径 | docs/desktop/design/PROJECT.md:260 | chat-digest.mjs | R3 | 删档∕改名记录——裸名化 |
| 52 | 路径 | docs/desktop/design/PROJECT.md:326 | src/main/suspension-drive.mjs | R1 | 承接 = thincoder-desktop/src/main/suspension-drive.mjs |
| 53 | 路径 | docs/desktop/design/PROJECT.md:345 | chat-digest.mjs | R3 | 同 51 |
| 54 | 路径 | docs/desktop/design/PROJECT.md:394 | renderer/index.html | R1 | 承接 = thincoder-desktop/renderer/index.html |
| 55 | 路径 | docs/desktop/design/PROJECT.md:394 | renderer/i18n.mjs | R1 | 承接 = thincoder-desktop/renderer/i18n.mjs |
| 56 | 路径 | docs/desktop/design/PROJECT.md:396 | renderer/views/settings.mjs | R1 | 承接 = thincoder-desktop/renderer/views/settings.mjs |
| 57 | 路径 | docs/desktop/design/PROJECT.md:397 | views/settings.mjs | R1 | 同上 |
| 58 | 路径 | docs/desktop/design/PROJECT.md:397 | src/main/settings.mjs | R1 | 承接 = thincoder-desktop/src/main/settings.mjs |
| 59 | 路径 | docs/desktop/design/PROJECT.md:401 | chat-digest.mjs | R3 | 同 51 |
| 60 | 路径 | docs/desktop/design/PROJECT.md:436 | chat-digest.mjs | R3 | 同 51 |
| 61 | 路径 | docs/desktop/design/PROJECT.md:623 | mount-head.mjs | R3 | 删档行——裸名化 |
| 62 | 路径 | docs/desktop/design/PROJECT.md:775 | renderer/index.html | R1 | 同 54 |
| 63 | 路径 | docs/desktop/design/PROJECT.md:775 | renderer/i18n.mjs | R1 | 同 55 |
| 64 | 路径 | docs/desktop/design/PROJECT.md:776 | src/extension/settings.mjs | R1 | 承接 = thincoder-vscode/src/extension/settings.mjs |
| 65 | 路径 | docs/desktop/design/PROJECT.md:776 | agent-tools/settings.mjs | R1 | 承接 = thincoder-core/agent-tools/settings.mjs |
| 66 | 路径 | docs/desktop/design/PROJECT.md:776 | agent-tools/settings.mjs:20 | R1 | 同上（:20 随读） |
| 67 | 路径 | docs/desktop/design/PROJECT.md:777 | src/main/settings.mjs | R1 | 同 58 |
| 68 | 路径 | docs/desktop/design/PROJECT.md:777 | views/settings.mjs | R1 | 同 56 |
| 69 | 路径 | docs/desktop/design/PROJECT.md:881 | mount-head.mjs | R3 | 同 61（退役·删档已载） |
| 70 | 路径 | docs/desktop/design/PROJECT.md:890 | test/files.mjs | R1 | 承接 = thincoder-desktop/test/files.mjs |
| 71 | 路径 | docs/desktop/design/PROJECT.md:970 | chat-digest.mjs | R3 | 同 51 |
| 72 | 路径 | docs/desktop/design/PROJECT.md:1025 | chat-digest.mjs | R3 | 同 51 |
| 73 | 路径 | docs/desktop/design/PROJECT.md:1032 | chat-digest.mjs | R3 | 同 51 |
| 74 | 路径 | docs/desktop/design/PROJECT.md:1033 | chat-digest-seat.mjs | R3 | 同族（seat 名已并） |
| 75 | 路径 | docs/desktop/design/PROJECT.md:1103 | chat-digest.mjs | R3 | 同 51 |
| 76 | 路径 | docs/desktop/design/PROJECT.md:1104 | chat-digest-seat.mjs | R3 | 同 74 |
| 77 | 路径 | docs/desktop/design/PROJECT.md:1174 | chat-digest.mjs | R3 | 同 51 |
| 78 | 路径 | docs/desktop/design/PROJECT.md:1175 | chat-digest-seat.mjs | R3∕R5 | 改名行（改名谓词在场——注记备选） |
| 79 | 路径 | docs/desktop/design/PROJECT.md:1903 | renderer/i18n.mjs | R1 | 同 55 |
| 80 | 路径 | docs/desktop/design/PROJECT.md:1949 | chat-digest.mjs | R3 | 同 51 |
| 81 | 路径 | docs/desktop/design/PROJECT.md:1958 | src/main/turn-face.mjs | R1 | 同 47 |
| 82 | 路径 | docs/desktop/design/PROJECT.md:1965 | chat-digest.mjs | R3 | 同 51 |
| 83 | 路径 | docs/desktop/design/PROJECT.md:1993 | composer/panel.mjs | R1 | 承接 = thincoder-render-core/composer/panel.mjs |
| 84 | 路径 | docs/desktop/design/PROJECT.md:1993 | renderer/index.html:19 | R1 | 同 54 |
| 85 | 路径 | docs/desktop/design/PROJECT.md:2002 | chat-digest.mjs | R3 | 同 51 |
| 86 | 路径 | docs/desktop/design/PROJECT.md:2004 | chat-digest.mjs | R3 | 同 51 |
| 87 | 路径 | docs/desktop/design/PROJECT.md:2013 | chat-digest.mjs | R3 | 同 51 |
| 88 | 路径 | docs/desktop/design/PROJECT.md:2034 | chat-digest-seat.mjs | R3 | 同 74 |
| 89 | 路径 | docs/desktop/design/PROJECT.md:2037 | src/main/suspension-drive.mjs | R1 | 同 52 |
| 90 | 路径 | docs/desktop/design/PROJECT.md:2037 | chat-digest.mjs | R3 | 同 51 |
| 91 | 路径 | docs/desktop/design/PROJECT.md:2037 | chat-digest-seat.mjs | R3 | 同 74 |
| 92 | 路径 | docs/desktop/design/PROJECT.md:2037 | renderer/chat.css | R1 | 承接 = thincoder-desktop/renderer/chat.css |
| 93 | 路径 | docs/desktop/design/PROJECT.md:2050 | suspension-drive.mjs:173 | R1 | 承接 = thincoder-cli/src/tui/suspension-drive.mjs（CLI 语境） |
| 94 | 路径 | docs/desktop/design/PROJECT.md:2073 | chat-digest.mjs | R3 | 同 51 |
| 95 | 路径 | docs/desktop/design/RENDERER.md:49 | suspension.mjs:132-135 | R1 | 承接 = thincoder-vscode/src/extension/suspension.mjs（VSC 语境） |
| 96 | 路径 | docs/desktop/design/RENDERER.md:301 | turn-face.mjs:122 | R1 | 同 47 |
| 97 | 路径 | docs/desktop/design/RENDERER.md:324 | suspension-drive.mjs:173 | R1 | 同 93 |
| 98 | 路径 | docs/desktop/design/RENDERER.md:341 | suspension-drive.mjs:182 | R1 | 同 93（坐标随读） |
| 99 | 路径 | docs/desktop/design/RENDERER.md:341 | TUI.md:901 | R1 | 承接 = docs/cli/design/TUI.md（行号随读） |
| 100 | 路径 | docs/desktop/design/SHELL.md:206 | mount-head.mjs | R3 | 同 61 |
| 101 | 路径 | docs/desktop/design/UI.md:685 | slash-commands.mjs:130 | R1 | 承接 = thincoder-cli/src/tui/slash-commands.mjs（CLI 前段逐字引） |
| 102 | 路径 | docs/render-core/design/RENDER-CORE.md:238 | slash-commands.mjs:130 | R1 | 同上 |
| 103 | 路径 | docs/render-core/design/RENDER-CORE.md:382 | flow/block.mjs | R1 | 承接 = thincoder-render-core/flow/block.mjs |
| 104 | 路径 | docs/render-core/design/RENDER-CORE.md:389 | renderer/slash-commands.mjs | R1 | 承接 = thincoder-desktop/renderer/slash-commands.mjs |
| 105 | 路径 | docs/render-core/design/RENDER-CORE.md:440 | chat.css:404-413 | R1 | 承接实核（VSC ∥ 桌面同名——行内语境定） |
| 106 | 路径 | docs/render-core/design/RENDER-CORE.md:523 | flow/block.mjs | R1 | 同 103 |
| 107 | 路径 | docs/render-core/design/RENDER-CORE.md:533 | composer/panel.mjs | R1 | 同 83 |
| 108 | 路径 | docs/vsc/design/WEBVIEW-INPUT.md:253 | composer/panel.mjs | R1 | 同 83 |
| 109 | 路径 | docs/vsc/design/WEBVIEW-PROTOCOL.md:536 | suspension.mjs:89 | R1 | 承接 = thincoder-vscode/src/extension/suspension.mjs |
| 110 | 路径 | docs/vsc/design/WEBVIEW-PROTOCOL.md:536 | suspension.mjs:125 | R1 | 同上 |
| 111 | 用例 | docs/vsc/design/WEBVIEW.md:459 | T-G1 | R5∕R4 | 测试档不在盘（render-granularity——2026-09-20 批）；来源指针 |
| 112 | 用例 | docs/vsc/design/WEBVIEW.md:459 | T-G8 | R5∕R4 | 同 111 |
| 113 | 路径 | docs/vsc/design/WEBVIEW.md:467 | src/extension/suspension.mjs:190 | R1 | 承接 = thincoder-vscode/src/extension/suspension.mjs |
| 114 | 路径 | docs/vsc/design/WEBVIEW.md:620 | test/helpers/webview-env.mjs | R3∕R4 | 死名（n=0）——裸名化 ∥ 改述 |
| 115 | 路径 | docs/vsc/design/WEBVIEW.md:781 | suspension.mjs:167 | R1 | 同 109（记录行——坐标对） |
| 116 | 路径 | docs/vsc/design/WEBVIEW.md:782 | suspension.mjs:161-167 | R1 | 同 109 |
| 117 | 路径 | docs/vsc/design/WEBVIEW.md:783 | suspension.mjs:177 | R1 | 同 109 |

**分类对账**：路径 106（#1–#117 内除符号 8（#3 ∕ #4 ∕ #40–#45）∥ 用例 3（#2 ∕ #111 ∕ #112））= 117 ✓（D3）。**执行轮义务**：逐条读回 + 承接实核（改指目标盘上实存 ∥ 改后复跑零悬空零新增）——行号 as-of，落笔前逐处回读。

### 2.4 正文面宽度清账（豁免后目标 0）

- **读数（as-of 2026-10-01 17:5x）**：正文面 **119 行 ∕ 20 档**（= 清账对象）；区带豁免 **169 行**（零清——另列）。
- **扫描域（口径同 §2.2）**：本清单 = **行宽面定域**读数（仓根 `docs` 全深 .md，排除 `_archive` ∥ `batches` 目录——依据见 §2.2 扫描域条）；批档 ∥ `_archive` 面域外 ⇒ 「含新增 = 0」射程不含批档自身宽行（本档长行不入判）。
- **清账规则**：逐行折行——**语义零改**（折点 = 子句界 ∥ `——` ∥ `；`；不改一字）；**表格邻域行**（§4.1 表说明列等——本体表行已豁免）按行读义保结构；**坐标 ∕ 命令 ∥ 码段字面**折行时保原样；折后逐档读回（D6）。
- **执行轮纪律**：全档复跑 ⇒ `OK(行宽)`；与在飞桌面文档流**串行**（同文件并发写 = 丢改风险——开工前 `git status` 复读；逐档改完即读回）。
- **区带内零清**：历史行不折（豁免——零手术）。
- **「含新增 = 0」的第二半**：折后正文零超宽 ∧ 区带外新行沿相对判据（执行者首动作前复测）——两者齐备 = 「读数目标 0（含新增）」机检面。

### 2.4b 正文逐行清单（119 行 · 20 档 · `!` = ≥500 字符大行；行号 = as-of——落笔前逐处回读）

- `docs/cli/design/TUI-SESSION-VIEW.md`：187! 194
- `docs/cli/design/TUI.md`：538 539!
- `docs/core/design/AGENT-LOOP-ASYNC-POOL.md`：76 326
- `docs/core/design/CONSULTATION.md`：132
- `docs/core/design/MEMORY.md`：488 550 565
- `docs/core/design/MULTI-INSTANCE-COLLAB.md`：56
- `docs/core/design/SESSION.md`：970 1000
- `docs/core/requirements/CONFIG.md`：24
- `docs/core/requirements/MEMORY.md`：213 215
- `docs/core/requirements/PROMPT-SYSTEM.md`：92
- `docs/core/requirements/PROVIDER.md`：132
- `docs/core/requirements/SESSION.md`：140 159
- `docs/desktop/design/IPC.md`：71 96 144 223 315 316
- `docs/desktop/design/PROJECT.md`：125 134 324 326! 329 342 347 348 394 397 400 401 404 685 1079 1336! 1430 1433 1434! 1435! 1456 1497 1508
- `docs/desktop/design/RENDERER.md`：34 43! 44! 47 48! 49! 68 70 74 75 78! 80 88 89! 92 93 94 97! 108 187 188
- `docs/desktop/design/UI.md`：48 60 138 194 308 328 400! 423 495 497 507 509! 510 513 519 527 547! 548 562! 683 686! 687 689
- `docs/desktop/requirements/PROJECT.md`：104
- `docs/render-core/design/RENDER-CORE.md`：209 218 235 236 237 238 306 321 363 379 380 386 389! 432 443
- `docs/vsc/design/VSC-DEBT.md`：72
- `docs/vsc/design/WEBVIEW.md`：132 190 219! 225 226 418 424 468! 471!

### 2.4c 复刻 ∕ 复核配方（只读）

复跑法 = 同构脚本（复刻 `checkDocWidths` 同参 + §2.2 谓词）；**机制落地后直接由 `node scripts/doc-check.mjs` 取代**——复跑读数 = 0 即收口（区带内行不再现于报告）。逐行明细表可同法重建（本席 dry-run 同构）。

### 2.5 行数差口径收一（条目 3）

- **「行数差 4」实指（本席裁定——brief 原文以本节为准）**：= 行数面跳过列「〔**预估 4** ∕ 非数 7〕」的四条**预估形**行（`docs/desktop/design/PROJECT.md` §4.1）——`context-menu.mjs` ∥ `tools/web-quickcheck/serve.mjs` ∥ `host-shim.mjs` ∥ `run.mjs`（均标「拟新增 · 预估——实施后对账」）；四者**盘上已全部落成**（实核）⇒ 对账 = 回填。
- **收一方案（值格单一标准）**：① **已落件** ⇒ `**<实读>**（实读 <日期>）`（加粗精确——内容行数口径 KD-4）；② **未落件** ⇒ `**≈<估>**`（预估形 = 唯一合法近似形——`electron-builder.yml` 的 `~40` 收正入此形）；③ **裸数字行**（`host-floor.mjs` 42 ∥ `session-actions.mjs` 73 ∥ `dom.mjs` 69）⇒ 加粗为精确形（读数核后）；④ **结构行**（表头 ∕ 分隔 ∥ `—` 行）⇒ 跳过面唯一保留类（跳过分档收一为「结构行」一元）。
- **执行轮验收读数**：复跑 ⇒ **差异 0**（现读 **3** = 并行写链产物：`events-wake.mjs` +1 ∥ `page-read.mjs` +21 ∥ `chat-digest-rows.mjs` +3——回填工单清零）· **预估 ≤ 未落件数**（四件回填毕 ⇒ 0；`electron-builder.yml` 显式成 est 形 ⇒ 1）· 非数 = 结构行 3。

### 2.6 验收（机检命令——条目 4 前半）

```bash
# cwd = 仓根（d:/teamcode/thincoder）
node scripts/doc-check.mjs                  # ⇒ OK(锚): 0 条悬空 ∧ OK(行宽) ⇒ exit 0
node --test docs/batches/<清账批>.test.mjs  # 机制自测件（判据改动词必配——名随清账批批档）
node scripts/doc-check.mjs                  # 行数面：差异 0 · 预估 ≤ 未落件数 · 非数 = 结构行（报告态）
```

判据全文 = `DOC-DISCIPLINE.md` §5 **A-DD23** + §3.15 用例表（**DD-60–DD-62**）；**基线 = 各执行轮首动作前复测**（相对判据——绝对读数随并行写链漂移）。

### 2.7 复发窗复测法（条目 4 后半——复现面对齐）

- **原复现面**：取证轮实测——活跃写窗 **12 分钟 +5 行**超宽；净速 ≈ 百行 ∕ 日量级；区带为绝对大头。
- **腿 1（夹具 · 确定性——自测件内）**：DD-60–DD-62 全量（区带免 ∥ 非区带照报 ∥ 空集惰性 ∥ 后缀头 ∕ 嵌套照免 ∥ 闭集外 ∕ 条目形照报）。
- **腿 2（活体复发窗 · 机制落地后）**：取自然写窗（≥12 分钟活跃文档写作——批档 ∥ 设计档随批写）；窗起 ∕ 窗末各跑 `node scripts/doc-check.mjs` + 区带分类复刻（§2.4c）。**通过条件** = ① 行宽闸全程无 `FAIL(行宽)`（窗末 = OK——新增超宽行全落区带）② 正文面新增超宽 = 0（相对判据——基线 = 窗起复测）③ 区带新增宽行 > 0 出现（复现面复刻成功——「免复发」路径实走；无宽行的自然窗不判败）。
- **腿 3（清账轮收口复跑）**：§2.6 命令全绿（`OK(锚) 0` ∧ `OK(行宽)` ∧ exit 0）——**不满足 ⇒ 不收口**（缺口逐条归批）。

### 2.8 边界（不做）

- `scripts/**` ∥ `PROJECT-MANIFEST.json` ∥ 自测件 = **工程工具面（实施轮）**——本舱零写；产品码 ∥ 提示词面零触。
- 清账执行（117 锚 + 119 行折行 + §4.1 回填）= **清账轮（另轮）**——本设计 = 清单 + 规则。
- 区带内历史行零清 ∥ 不改需求档（N-SD4 加句 = 主 agent）∥ 批档 §1/§4/§6 零触 ∥ `_archive/**` ∥ 两参照树零触。
- 「行数差 4」实指已裁（§2.5）；如父侧另指他项 ⇒ 停下对齐。

### 2.9 关键决策

| # | 决策 | 被否 | 理由 |
|---|---|---|---|
| N-1 | 区带判据 = 标题链 ∥ 编号剥离 + 括号后缀容接 | 子串匹配（取证口径）· 仅最近标题单级 | 标题链防嵌套逃逸；闭集匹配防括注误纳；现盘两读判集相同（diff 0） |
| N-2 | 声明面 = `checkConfig.widthExemptZones` | 硬编码名集（违 F2 声明面原则） | 加名 ∕ 改名走声明面 + 设计评审 |
| N-3 | 空集 = 惰性（fail-closed） | 默认内置两区带名 | 声明缺失 ⇒ 零豁免——不静默豁免 |
| N-4 | 报告面零新增计数列（同表行豁免形） | 区带豁免计数行 | 一致 §3.1 先例；防滥用面 = 评审核验 + 残余登记 |
| N-5 | 死名处置 = 裸名化（R3）优先 | 全量改指 ∥ 一律打「迁移期引文」标记 | §3.8 形态纪律先例；标记族射程 = 迁移产物（不打折） |
| N-6 | 行数面 = 值格二元化 + 结构行一元跳过 | 逐行全精确（未落件不可得）· 保留多形 | 口径收一 |

### 2.10 上抛项

- **a) 运行说明死指针**（`DOC-DISCIPLINE.md` §3.1 条目 C「一致性检查的**运行说明**里落笔豁免句」）：全仓 grep「运行说明」零实指（除该句自身及其两处引用）——死指针处置（改述 ∕ 改指现役面：机检结论行 ∥ 需求档行）请裁；本批零触（调研附带发现）。
- **b) A-DD4 ∕ DD-5「基线档」两立足点并存**（取证轮 §2.7〔#8〕登记——「基线档保持为空」∥「宽度面无基线机制」）：建议随机制实施轮同笔收口（最小改 = 两处改「基线通道不存在——不得重建」）；请裁——本批未触（不擅改他条目 AC）。
- **c) 区带名闭集外标题**（`不并项与历史沿革` ∥ 括注含「历史沿革」的失效节）：现盘 0 命中；如未来出现超宽行须折（不豁免）；欲纳 ⇒ 另轮扩名（设计 + 评审）。
- **d) 清账轮 ∥ 在飞桌面文档流的串行安排**：`docs/desktop/design/PROJECT.md` 本刻仍在写（17:49 mtime）——同文件并发写 = 丢改风险；清账轮排期请父侧协调（或择窗口）。
- **e) 实施序（建议）**：机制（scripts + manifest + 自测件）→ 清账（117 锚 + 119 折行 + §4.1 回填）→ 复测（§2.7 腿 2 ∕ 腿 3）——排期为父侧裁量。
- **f) 需求侧豁免句同步（N-SD4）**：`docs/core/requirements/STRUCTURE-DEBT.md:33`（N-SD4 行豁免括注「表格行豁免」）增补「历史区豁免」（口径 = `DOC-DISCIPLINE.md` §3.15）；需求档笔权 = **主 agent**（D1）——请裁排期。

### 2.11 修正块（评审轮 1 · fix 轮 · 2026-10-01 · eng-designer——承 §3 轮次 1 八发现；父侧逐条裁定：#1–#6 ∥ #8 裁收（按其 Suggestion 列执行），#7 裁「不采纳」）

**口径**：本块 = 修复轮记录；§2 本体行**就地收正**（逐号落点见下表——同轮已落，读回在册）；设计档同拍落（`DOC-DISCIPLINE.md`）。**四验收项读回**：① 八条逐号落（见表）；② 尺寸实测值入表（**66** ∥ **88**——内容行口径 as-of 2026-10-01）；③ 收窄后全档 grep 零「无条件口径」残留（`非表格超宽行照常报告` = 0 ∥ `非表格 >300 行照报` = 0 ∥ `本笔新增行零超宽` = 0 ∥ `新增行零超宽` 余 7 处全为**区带外**限定形）；④ DD-61 三夹具在表（编号剥离路径 ∥ 半角 `(` ∥ `历史沿革`）。

| # | 级 | 处置（按 Suggestion ∥ 父裁） | 落点（就地） |
|---|---|---|---|
| 1 | 🔴 | §2.2b 表补「当前行数 ∕ 预计增量」两列（`.mjs` 三行：66 ∥ 88 ∥ ≈+120 预估——预估基准 = 同类批内件实读；`.md` ∥ 数据档行 `—`）＋ `scripts/doc-check-width.mjs` 尺寸档登记（不拆 + 触发 + 抽取候选线——实测 66 行 ≪ 300） | 本档 §2.2b；`DOC-DISCIPLINE.md` §3.15（尺寸档登记录入） |
| 2 | 🔴 | 无条件口径收窄为区带口径——**父侧点名五处**（§3.1 影响面 ∥ DD-7 ∥ A-DD2 ∥ A-DD10 行 ∥ A-DD10 判据 ①）＋ **同族补扫二处**（A-DD9 判据 ⑥ ∥ A-DD12 判据 ④——同句族同法；完成度收口，非扩面）；§3.15 现行裁定对表补同拍收窄登记；变更记录一行 | `DOC-DISCIPLINE.md` :97 ∥ :1147 ∥ :1155 ∥ :1193 ∥ :1197 ∥ :1204 ∥ :1293 ∥ §3.15 对表 ∥ 变更记录 |
| 3 | 🟡 | §2.10 补 f 项（需求侧豁免句同步 = N-SD4 · 主 agent 域——指针落地） | 本档 §2.10 |
| 4 | 🟡 | §3.15 对表引据改指在位节（§4.6 ∕ §4.2.9——撤除节不再作现行依据） | `DOC-DISCIPLINE.md` §3.15 对表 |
| 5 | 🟡 | DD-61 补三夹具（编号剥离路径 `## 6. …` ⇒ 照报 ∥ 半角 `(` 后缀 ⇒ 照免 ∥ `历史沿革` 区带名 ⇒ 照免）＋ A-DD23 判据 1 随动（D3） | `DOC-DISCIPLINE.md` :824 ∥ :1276 |
| 6 | 🟡 | 单源收一——§2.2 现行裁定对表改引 §3.15（不重述判据）；「半二」补定义 + 出处；§2.1 三链同源收窄至条目 1 ∥ 条目 4 | 本档 §2.2 ∥ §2.1 |
| 7 | 🔵 | **不采纳**（父侧裁：评审自注可选——N-4「报告面零新增计数列」维持现设计；裁记在册） | 本块（零动作） |
| 8 | 🔵 | §2.2 ∥ §2.4 明示行宽面扫描域与排除面（`docs` 全深 .md − `_archive` ∥ `batches` 目录）＋依据（实读 `PROJECT-MANIFEST.json:24-35` ∥ `scripts/doc-check.mjs:65` ∥ `scripts/doc-check-targets.mjs:19-43`；域探针 = 156 档 ∥ 排除面 0 命中） | 本档 §2.2 ∥ §2.4 |

**边界（本修正轮不做）**：`scripts/**` 零写 ∥ 清账零执行 ∥ 产品码 ∥ 需求档零触 ∥ §1/§4/§6 零触 ∥ 他批零触（`docs/desktop/design/PROJECT.md` 在飞——避让）。**终态复核（as-of 2026-10-01 18:1x 复跑）**：`node scripts/doc-check.mjs` = 悬空 **119** ∥ 行宽 **289** ∥ 行数面差异 **4**——与修复轮开工基线**逐项相同**（本席写面零净增；`DOC-DISCIPLINE.md` 两闸零新增——仅既存两迁移期引文列报 ∥ 符号宽报告随行号漂移）。

### 2.12 修正块（复审后收正轮 · 2026-10-01 · eng-designer——承 §3 轮次 2 新发现 2 条（#9 ∥ #10）；父侧裁收：按评审 Suggestion 列执行）

**口径**：号承 §3 轮次 2 发现号；两条**定点就地收正**（不扩面——§2 本体行不重写，本块 append 纪行）；设计档同拍落（`DOC-DISCIPLINE.md`——读回在册，as-of 2026-10-01 18:2x）。**逐号：号 → 现 ⇒ 新 ∥ 择向判由**：

| # | 现（as-of 坐标） | 新 ⇒（落地值） | 择向判由 |
|---|---|---|---|
| 9 | `DOC-DISCIPLINE.md:110`（§3.3）「宽度检查档 = **存量贴线档**（300 建议线）——本批承诺**终态 ≤300**……**若实测越线 → 拆分退路**：抽**宽度扫描核心**至独立档 + 扫描库分档」——与 `:815`（§3.15 尺寸档登记：66 行 · 增量 ≈+30 ⇒ 终态 ≈100 · 不拆 · 候选线 = 标题栈 + 区带谓词族）两存互斥 | 同处 ⇒ 「宽度检查档档位登记 = **§3.15 尺寸档登记**（**不拆** ∥ 触发 ∥ 抽取候选线——单源，不复读读数）」——失效陈述**删除**（无划改、无取代注记）；历史去向 = 变更记录一行 | **D8**（失效表达删除 ⇄ 记录面留痕）：失效对象已消失（贴线档读数被实测 66 行 ≪ 300 证伪——本席实读核；旧候选线被 §3.15 新候选线取代）⇒ 择**㈠**（就地收正）；**㈡**（`:815` 携「取代 §3.3」注记、§3.3 留痕）= 失效形留现役面 + 修订式注记 = D8 禁形 ⇒ 不取 |
| 10 | 四处未限定「新增…超宽 0」：`:634`（DD-49）∥ `:1233`（A-DD19 判据 ⑧）∥ `:1252`（A-DD20 判据 ④）∥ `:1268`（A-DD22 判据 ③）——与 §3.15 同拍口径（`:809` ∥ `:811`）未同拍 | 四处同法 ⇒ 「**区带外**新增超宽 **0**」（字面其余零改）；**D3 随动**：`§3.15:809` 同拍收窄登记 7 处 → **十一处**（+ 上述四处——登记与实集同改） | **D8**（同上）：无条件形 = 本轮已裁「不再成立」之失效形（`:1570` 变更记录 ∥ `:809` 口径）；四处为同句族未同拍残留 ⇒ 择**㈠**（同法就地收窄）；**㈡**（四处留原文 + `:809` 登记射程）= 失效形留现役面、读者仍可读作无条件 ⇒ 不取 |

**读回（D6——逐处，as-of 2026-10-01 18:2x）**：

- `:110` ⇒ 「宽度检查档档位登记 = **§3.15 尺寸档登记**（**不拆** ∥ 触发 ∥ 抽取候选线——单源，不复读读数）。」✓
- `:634` ⇒ 「…⇒ **本笔 / 本轮新增**悬空 0 + **区带外**新增超宽 0——**基线 = 执行者首动作前复测**…」✓
- `:1233` ⇒ 「…⇒ 各实施轮**新增**悬空 **0** + **区带外**新增超宽 **0**。」✓
- `:1252` ⇒ 「…⇒ 本轮**新增**悬空 **0** + **区带外**新增超宽 **0**（相对判据——同 A-DD18 / A-DD19 ⑧ 句式）。」✓
- `:1268` ⇒ 「…⇒ 本轮**新增**悬空 **0** + **区带外**新增超宽 **0**——基线 = 执行者首动作前复测…」✓
- `:809` ⇒ 「…· A-DD12 判据 ④ · DD-49 · A-DD19 判据 ⑧ · A-DD20 判据 ④ · A-DD22 判据 ③ = **十一处**…」✓
- 变更记录（`:1573`–`:1574`）= 本条一行（D8 记录面留痕）；`:1571` 原尾不动（读回在册）。

**复扫（验收 ②——内置 grep，UTF-8 感知）**：`存量贴线` ∥ `拆分退路` ∥ `宽度扫描核心`（域 = `DOC-DISCIPLINE.md`）⇒ **0 命中**（全仓余命中 = 本批档 §3 发现行 ∥ `_archive/**`——记录面照留）；`新增超宽` ⇒ **4 命中，全为「区带外」限定形**（无条件形 **0**）；`= **十一处**` ⇒ 1（登记与实集同改）。

**跨引用复核（D8 细则「删除后扫引用」）**：`:1118`（§4.5 D-V5-4）「既有拆分计划」语义仍解析（承接 = §3.15 尺寸档登记——不拆 + 触发 + 抽取候选线在册——零悬空）。

**终态复核（as-of 2026-10-01 18:2x 复跑）**：`node scripts/doc-check.mjs` = 悬空 **119** ∥ 行宽 **290** ∥ 行数面差异 **4**——悬空 ∥ 行数面与 §2.11 基线（119 ∥ 4）相同；行宽 289 → 290（+1）= **非本席写面**（本席仅触 `DOC-DISCIPLINE.md`——该档非表格超宽行复刻实核 = **0**；+1 属并行写链漂移）。

**边界（本收正轮不做）**：`scripts/**` 零写 ∥ 清账零执行 ∥ 产品码零触 ∥ 本档 §1/§4/§6 零触 ∥ 他批零触（`docs/desktop/design/PROJECT.md` 在飞——避让）。

**披露**：`DOC-DISCIPLINE.md:634`（DD-49）尾注「评审 #4 收正：**原写死**「悬空 28 / 超宽 5」」= 「原写死 X」形（D8 口径下疑似修订式残句——指向已删字面）；本轮**未触**（不在两定点射程——不扩面），列为观察项报父侧裁。

### 2.13 补缺块（设计补缺轮 · 2026-10-01 · eng-designer——承实施中实测缺口：`checkConfig.widthExemptZones` 读面静默丢弃 ⇒ 机制真跑惰性）

**口径**：定点补缺（不扩面）——受影响面补缺（§2.2b row 3 只列数据档，漏 schema 档）+ 键数句同族同步（本舱已落）。**产品码零写**（`manifest-schema.mjs` = 实施轮——本舱只出规格）；本块 append 纪行，§2 本体行不重写。**同族同步面 = 实读定位所得**（点名 = `MANIFEST.md` ∥ 实读定位 += `ENGINEERING-MODE-V2.md` ∥ `DOC-SYSTEM.md`——同族同法，父侧可否决）。**三链**：本块 = §2.2b 补缺面 ∥ `DOC-DISCIPLINE.md` §3.15 契约 ⑤（声明 = `checkConfig.widthExemptZones`）∥ 台账 #779。

**① 缺口（根因 ∥ 实测——复现片段）**

- **根因** = `fillDefaults` 只搬「默认档已有子键」（`thincoder-core/manifest-schema.mjs:154-156`——`Object.keys(def)` 循环；KD-M1-11「读时收敛」）+ `DEFAULT_MANIFEST.checkConfig` 现值 = 五键（`:38-44`——不含新键）⇒ 数据档声明在读面被**静默丢弃**。KD-M1-31 被否备选行**已明载**该风险（`docs/core/design/MANIFEST.md:258`：「不入 `DEFAULT_MANIFEST`（`fillDefaults` 只搬已知键——不入则读面取不到）」）。
- **设计漏项根因（本块自陈）**：§2.2b row 3 只列了数据档面——`DEFAULT_MANIFEST` 默认档面（读面搬移源头）未入表；#546 先例含「默认档 + 校验」双面，本批 schema 面 = **默认档面 + 派生面**（校验面零另改——见 ②）。

本席实跑（as-of 2026-10-01 18:4x · cwd = 仓根）：

```js
const { readManifest } = await import("./thincoder-core/manifest.mjs")
readManifest("d:/teamcode/thincoder").manifest.checkConfig
//  ⇒ keys = ["scanDirs","lineWidth","anchors","exemptions","lineCounts"]——"widthExemptZones" in checkConfig = false
const { fillDefaults } = await import("./thincoder-core/manifest-schema.mjs")
fillDefaults({ checkConfig: { widthExemptZones: ["变更记录","历史沿革"] } }).checkConfig
//  ⇒ 同上五键——widthExemptZones = undefined（输入键被静默丢弃）
// fs 读 PROJECT-MANIFEST.json ⇒ contains widthExemptZones = true（文含键——:29）
```

**真跑读数**（同刻 `node scripts/doc-check.mjs`）：行宽 **293 行**超宽 ∥ `判据项 7 项（… widthExemptZones …）`（脚本面已声明 ∥ schema 面未搬 ⇒ 区带行未获豁免）——机制真跑惰性；悬空 **119** ∥ 行数面差异 **7**（报告态——相对判据、随并行写链漂移）。

**② 规格（实施轮——产品码；本舱只出规格）**

- **增键**：`DEFAULT_MANIFEST.checkConfig` 增 `widthExemptZones: Object.freeze([]),`——落点 = `thincoder-core/manifest-schema.mjs:38-44`（`checkConfig` 对象内，建议紧邻 `lineWidth` 行后——与 `PROJECT-MANIFEST.json:28-29` 声明序对齐；序无功能义）。**缺省空 = 惰性**（沿 `DOC-DISCIPLINE.md` §3.15 契约 ⑤ ∥ `:798`）。
- **零另改面（派生自动随动）**：`MANIFEST_SCHEMA.nestedKeys.checkConfig` = `Object.keys(DEFAULT_MANIFEST.checkConfig)`（`:60`——键入后自动收录）；`fillDefaults` 子键循环（`:154`）——键入后读面即搬移、缺键档补 `[]`（`missingKeys` 记 `checkConfig.widthExemptZones`）。
- **判由**：KD-M1-11（`MANIFEST.md:237`）∥ KD-M1-31 被否备选行（`MANIFEST.md:258`）∥ #546 先例（`docs/batches/2026-09-29-doc-check-face.md` §2 落点 1——`lineCounts` 同走「默认档 + 校验」）。
- **实施面归属**：**eng-coder · designToken 随本批续**（产品码面——`thincoder-core/manifest-schema.mjs`）。

**③ 验收（实施轮——机检面）**

- **读面契约**：`readManifest(<仓根>).manifest.checkConfig.widthExemptZones` ⇒ `["变更记录","历史沿革"]`（逐字）；缺键档 ⇒ 补 `[]`。
- **真跑面**：`node scripts/doc-check.mjs` 复跑 ⇒ 区带行零现于报告（行宽读数回落至区带外面——相对判据，基线 = 实施者首动作前复测）。
- **自测件**：`node --test docs/batches/2026-10-01-docwidth-settlement.test.mjs` 复跑 **12/12** 绿（增例 = **采纳**（已落）：`fillDefaults` 搬移断言，先红后绿）。
- **核心包测试面**：= **空清单**（2026-09-28 重置——现行态）⇒ 本改验证面 = **批内件新增例** ∥ `node --check`。

**④ 受影响面补缺（续 §2.2b 表号）**

| # | 面 | 当前行数（实读 2026-10-01 · `\n` 计数） | 增量 | 动作 | 归属 |
|---|---|---|---|---|---|
| 8 | `thincoder-core/manifest-schema.mjs` | **162** | **+1**（≤+2） | `DEFAULT_MANIFEST.checkConfig` 增 `widthExemptZones: Object.freeze([])`（紧邻 `lineWidth`） | **产品码——实施轮**（eng-coder · designToken 随本批续） |
| 9 | `docs/core/design/MANIFEST.md` | 804 ⇒ **806** | 本舱已落（+2） | §2.1 条 1 ∥ §2.2 `MANIFEST_SCHEMA` 行「`checkConfig` 五键 ⇒ **六键**」+ 变更记录一行 | 设计档——本舱已落 |
| 10 | `docs/core/design/ENGINEERING-MODE-V2.md` | 600 ⇒ **603** | 本舱已落（+3） | §2.3 E1 JSON 补 `widthExemptZones: []`（默认形态）∥ §3.1 AC3「五子键 ⇒ **六子键**」+ 变更记录一行 | 设计档——本舱已落（实读定位——同族同步面，#546 同法） |
| 11 | `docs/core/design/DOC-SYSTEM.md` | 428 ⇒ **430** | 本舱已落（+2） | §8.2 声明面行「判据项 6 ⇒ **7**（+ `widthExemptZones`）」+ 变更记录一行 | 设计档——本舱已落（实读定位——同族同步面） |
| 12 | `docs/core/design/API-CONTRACT.md`（生成区） | **2882** | 生成器重跑即覆盖 | `MANIFEST_SCHEMA` ∥ `validateManifest` ∥ `fillDefaults` 三行坐标随行插 +1 平移——重跑 `node scripts/api-contract.mjs --write`（**生成区勿手改**） | 工程工具面（生成器——父侧收口） |
| 13 | `docs/batches/2026-10-01-docwidth-settlement.test.mjs` | **95**（12 例——实读 2026-10-01） | **已落**（+1 例） | §2.13 ③ 增例（`fillDefaults` 搬移断言——先红后绿） | 批内件——实施轮已落 |

**⑤ 本舱读回（D6——as-of 2026-10-01 18:5x）**：MANIFEST.md `:53` ∥ `:97` 六键在文（len 223 ∥ 149）· 变更记录 `:645`（len 285）✓；ENGINEERING-MODE-V2.md E1 `:141` ∥ AC3 `:501` ∥ 变更记录 `:534`（len 260）✓；DOC-SYSTEM.md `:244`（七项）∥ 变更记录 `:396`（len 209）✓；行数 = **806 ∥ 603 ∥ 430**；全部新增行 ≤300 字符（零行宽新增）。

**⑥ 边界（本舱不做）**：产品码零写 ∥ `scripts/**` 零触（父侧已落）∥ 清账零执行 ∥ 本档 §1/§3/§4/§6 零触 ∥ 他批零触。

**⑦ 披露 ∥ 观察项（未触——报父侧裁）**

- **a) 未知 `checkConfig` 键静默丢弃面**（fail-open 向——本缺口由此**隐形**）：`fillDefaults` 只搬默认档子键 ⇒ 未入 `DEFAULT_MANIFEST` 的声明键无声失效（读面不报、写面不拦）。**登记建议**（父侧——台账）⇒ **承接 = 台账 #802**（未知 manifest ∥ `checkConfig` 子键静默丢弃——校验 ∥ 告警面评估）；处置机制另议（**本舱不做**）。
- **b) `MANIFEST.md` 句族「五键」陈旧**（顶层面现档 = 八键——`:98` ∥ `:293`）：`:576`（T1「五键齐全」）∥ `:577`（T2「写默认五键档」）= **本舱已收正（已落）**——「五键」⇒「八键」，变更记录同拍；`:56`（「写默认五键档」——与 `:577` 逐字同句）= 存量陈旧（conventions-retire 批收正清单未含本条）；**非本批引入**——未触（登记 = 台账 #803）。
- **c) `widthExemptZones` 无元素层校验**（#546 `lineCounts` 有元素层 fail-closed）：现状 = 消费面防御过滤（`scripts/doc-check.mjs:61`——非数组 ∥ 非串 ∥ 空串剔除）；非法声明 ⇒ 静默惰性（安全向 = 不静默豁免 ∥ 可见性向 = 声明失效不可见）。补校验 = 另议（**本舱不扩**）。
- **d) 批代 AC 表 as-of 语境**：`DOC-MIGRATION.md:414`「`checkConfig` 五键零改」＝批代验收行的 as-of 陈述（#546 起已非现役计数句）；未触。
- **e) 需求档面**：`ENGINEERING-MODE-V2-SPEC-MACHINE-CHECK.md:12`（判据面示意枚举——未含 `widthExemptZones`，#546 同状未收）∥ `:38` AC-M8-6（计数一致——自洽：判据项 7 = 键 6 + `anchors` 拆分 1）；需求档笔权 = 主 agent——未触。

### 2.14 修正块（评审轮 3 后收正轮 · 2026-10-01 · eng-designer——承 §3 轮次 3 五发现（0🔴 ∥ 4🟡 ∥ 1🔵）；父侧裁定 = 逐条按建议执行：采纳 4（#1 ∥ #2 部分采纳 ∥ #3 ∥ #5）∥ #4 = §4 追认段收一（父侧已落））

**口径**：号承 §3 轮次 3 发现号；定点就地收正（不扩面——§2.13 本体行就地收正，本块 append 纪行）；`MANIFEST.md` 同拍（`:576` ∥ `:577` + 变更记录一行）。**逐号：号 → 落点 → 读回（D6——as-of 2026-10-01 19:5x）**：

| # | 处置（按裁决） | 落点（就地） | 读回（file:line） |
|---|---|---|---|
| 1 | ④ 续表号 +行 13（批内件 **95**（12 例）∥ **已落**（+1 例））+ ③ 计数口径收一（**11/11 ⇒ 12/12**）+ ③ 增例注（= **采纳**（已落）） | 本档 §2.13 ③ ∥ ④ | §2.13 `:374`（「复跑 **12/12** 绿（增例 = **采纳**（已落）：`fillDefaults` 搬移断言，先红后绿）」）✓ ∥ `:386`（行 13——当前行数 **95**（12 例）∥ 增量 **已落**（+1 例），两列齐）✓ |
| 2 | ③ 补核心包测试面句（**空清单**（2026-09-28 重置——现行态）⇒ 本改验证面 = **批内件新增例** ∥ `node --check`） | 本档 §2.13 ③ 末条 | §2.13 `:375`（句在文）✓——实核：`thincoder-core/test/run.mjs:41-44` 空清单守卫 ∥ `thincoder-core/test/` 零 `*.test.mjs`；`npm test` 亲跑 = 空清单绿 |
| 3 | `MANIFEST.md` `:576` ∥ `:577` 就地收正（「五键」⇒「八键」——以现档为准）+ 变更记录一行；§2.13 ⑦b 射程注扩齐（`:56` ∥ `:576` ∥ `:577`——已落注明） | `MANIFEST.md` §3.2 ∥ §4 变更记录；本档 §2.13 ⑦b | `MANIFEST.md:576`「八键齐全」✓ ∥ `:577`「写默认八键档」✓（len 68 ∥ 94——等长换字）；变更记录 `:645`（新行——len 273 ≤300；旧首行 ⇒ `:647`）∥ 行数 806 ⇒ **808**（`\n` 计数）✓ ∥ §2.13 `:395`（⑦b 三处点名 + 「本舱已收正（已落）」）✓ |
| 4 | （父侧 §4 追认段收一——发布面扩列 §2.13 全 ∥ 实施面 = eng-coder（产品码面）；两处同口径）——本舱零触（§4 面） | 本档 §4 追认段（父侧已落） | §4 追认段在文 ✓（`:472`——as-of 落笔前；含「#4 本段收一」+ 五发现裁定） |
| 5 | ⑦a 承接点补指针 = 台账 **#802** | 本档 §2.13 ⑦a | §2.13 `:394`（「…**登记建议**（父侧——台账）⇒ **承接 = 台账 #802**（…）；处置机制另议（**本舱不做**）。」）✓ |

**复跑（本舱亲跑——as-of 2026-10-01 19:4x）**：`node --test docs/batches/2026-10-01-docwidth-settlement.test.mjs` ⇒ **tests 12 ∥ pass 12 ∥ fail 0**（含 `fillDefaults` 搬移例——§2.13 ③「12/12」兑现）。

**终态复核（as-of 2026-10-01 19:5x 复跑）**：`node scripts/doc-check.mjs` = 悬空 **119** ∥ 行宽 **120**（检查器自陈「区带豁免在效」——§2.13 ③ 真跑面预期形态：区带行零现于报告；293 ⇒ 120 回落 = **机制落地在效**——非本席写面）∥ 行数面差异 **7 条**（桌面在飞——报告态）。**本席写面 = `MANIFEST.md` 等长换字两处 + 一新增行（len 273 ≤300）——零宽度新增**；悬空 ∥ 行数面与 §2.13 基线（119 ∥ 7）相同。

**边界（本收正轮不做）**：`thincoder-core/**` 零触（实施面已落）∥ `scripts/**` 零触 ∥ 清账零执行 ∥ 本档 §1/§3/§4/§5/§6 零触（§4 追认段 = 父侧已落）∥ 他批零触。

**披露**：① ⑦b 形式自定（父侧「你定形」授权）——点名扩齐含 `:56` 承接指针 = 台账 **#803**（=「机检 ∥ manifest 声明面存量陈旧句三处」之一——另二处 = §2.13 ⑦d ∥ ⑦e）；② 复扫（落笔前）：§2.13 本体「11/11」旧表述零残留——余命中 = §3 评审引文两处（`:457` ∥ `:458`——记录面照留）；③ 终态行数面差异 7 条 = 桌面在飞行族（报告态——相对判据，非本笔）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**设计评审（轮次 1）· 发现 8 条（🔴 2 · 🟡 4 · 🔵 2）**

| # | 类别 | 严重度 | 问题 | 建议 |
|---|------|--------|------|------|
| 1 | 受影响文件尺寸标注 | 🔴 | 受影响面表（批档 §2.2b:52-60）对将改动的源/测试档（`scripts/doc-check-width.mjs` · `scripts/doc-check.mjs` · 新建单元测试档）**零尺寸标注**——无「当前行数」、无「预计增量」、无尺寸档/拆分登记。档内自持口径同向：`DOC-DISCIPLINE.md:232`（新落笔批档受影响文件表：**源/测试档保留「当前行数 + 预计增量」两列**）· `:230`（`.mjs` 三件不得误删）· `:110`（宽度检查档 = **存量贴线档**（300 建议线）；越线 ⇒ 拆分退路，触发即停下报告）· `:648-657`（尺寸档补充登记先例 = 不拆 + 理由 + 触发 + 抽取候选线）。无标注 ⇒ 无法核验是否越 300 建议线 ∕ 500 硬限，亦无拆分计划或「不拆」登记；本席无法 spot-check（数值不存在，脚本档读取在评审域外）。 | 在 §2.2b 的 `.mjs` 行补「当前行数 / 预计增量（≤±N 或 结构不变）」两列（`.md` 行照豁免），并按 §3.10 先例为 `scripts/doc-check-width.mjs` 补尺寸档登记（不拆理由 + 触发 + 抽取候选线）或拆分计划；数值落笔前实测。 |
| 2 | 文档所有权（机制描述互斥） | 🔴 | 同一机制（行宽报告集）在两处口径相斥：新 `DOC-DISCIPLINE.md:796`（§3.15 影响面「**非区带超宽行照报**」，批档 :40 同）对照现行面仍写**无条件**口径——`:97`（§3.1 影响面「**非表格超宽行照常报告**」）· `:1290`（DD-7「非表格行 >300 ⇒ 照报」）· `:1144`（A-DD2「非表格 >300 行照报」）；同族未限定句另有 `:1152` / `:1194`（A-DD10「新增行零超宽」）。§3.15「现行裁定对表」(:805-808) 未列入并同步上述三处；批 9 先例 = 判据面变更须**显式**转历史 ∕ 收正（A-DD11 / A-DD12 / DD-19 / DD-20 转历史断言即是例）。落地后该三句对「区带内非表格超宽行」为假。 | 同轮把三处现行句收窄为区带口径（如「非区带超宽行照报」），或在 §3.15 现行裁定对表内逐处登记 + 同步改写；A-DD10 句同法限定射程。 |
| 3 | 需求覆盖 / 指针 | 🟡 | §2.2b:59 行「主 agent 域（**上抛 §2.10**）」为悬空指针——§2.10（:280-286）a–e 五项无 N-SD4 ∕ 需求侧豁免句一项（§2.8:266 仅边界附带一句）⇒ 该需求侧同步义务无落实点。 | 在 §2.10 补该项（需求档 N-SD4：表格行豁免 + 历史区豁免加句），或改指实际承载处。 |
| 4 | 文档状态一致性 | 🟡 | §3.15:806 以「**§4.2.8 有效面** = 档级不整档豁免」立据；但 §4.2.8 标题即「已撤除」、首行标「本条已失效」(:979 / :981)，其「现行仍然有效面」块(:991-995) 三项**不含**该限定语——该句实际住在 §4.6:1135（与 §4.2.9:1003「行级」句）。按失效节立现行依据，读者复核即落空。 | 改指在位节（§4.6 / §4.2.9）或在 §3.15 内直陈该限定语，避免引失效节作现行依据。 |
| 5 | 验收标准（夹具覆盖） | 🟡 | DD-60–62（doc :820-822 ∥ 批档 :258）未覆盖三条**已声明**行为：① 编号剥离路径 `^\d+(?:\.\d+)*[.、]?\s*`（:801；现盘实例 = doc `:1319` `## 6. 不并项与历史沿革`，期望**不豁免**）② 半角 `(` 后缀形（:801 双形并列，夹具只用全角 `（续）`）③ 第二区带名 `历史沿革`（三夹具全用 `变更记录`）。 | 在 DD-61（边界）补上述三类夹具，或明确登记其由既有夹具覆盖。 |
| 6 | 单源 / 清晰 | 🟡 | 批档 §2.2（:35-48）与 §3.15（:794-810）同题文本两存且不等：现行裁定对表 **5 项**（批档 :46）∥ **4 bullet**（doc :805-808）；项 ⑤ 内「**「半二（新行 ≤300）」**」在本评审域内无定义、无指针（semantic dangling）；§2.1:31「三链同源：本表四条 = §3.15 ∥ §5 A-DD23」与实不符——条目 2（117 锚清账）∥ 条目 3（行数面口径）在 §3.15 ∕ A-DD23 无落点。 | 以 §3.15 为判据单源收一（他处只引用不重述）；「半二」补定义或改指其裁定出处；收窄「三链同源」句的射程。 |
| 7 | 验收（可机检性） | 🔵 | 复测腿 2 的判据 ③「区带新增宽行 > 0 出现」只能靠 §2.4c「区带分类复刻」（:236 ∥ :259）——机制按 N-4(:276) 零新增计数列、豁免行不入报告 ⇒ 验收腿依赖与实现同构的旁路复刻，非工具读数（两条分类器 = 漂移源）。 | 可选：报告面加一行只读计数（区带豁免 N 行），使腿 2 直接机器可判；不做亦不阻断判据。 |
| 8 | 清晰 / 域假设 | 🔵 | 行宽面扫描域未在设计中明示：§2.4b 119 行 ∕ 20 档清单（:213-232）与「读数目标 0（含新增）」隐含 `docs/batches/**` ∥ `_archive/**` **不在行宽域内**（域外依据仅在锚面条目 §3.8:347 / 复刻参数 :44）。反证面（本席复核实测）：批档自身 `:46` 即一条 ≥300 字符**非表格**行（`^.{300,}$` 命中），既不在 §2.4b 清单、也不受任何豁免——若该域含批档，则「正文 → 0」与「区带外新增行零超宽」对本批自身材料不成立。 | 在 §2.2 / §2.4 内明示行宽面域与排除面及其依据，使 119 行清单与 0 目标可复现。 |

**复核备注**：`DOC-DISCIPLINE.md` 内 ≥300 字符行（本席 `^.{300,}$` 复扫）= 8 行，全部为表格行（:22 / :241 / :516 / :519 / :1121 / :1156 / :1160 / :1535）⇒ 与 §2.4b 未列该档相容；本批新增正文（§3.15 / §5 A-DD23 / §7 / 枚举 / 变更记录）无新增超宽行 ✓。§2.4b 清单逐项点数 = 119 行 ∕ 20 档 ✓；§2.3 分类对账 106 + 8 + 3 = 117 ✓；锚面档数 24 ✓。§2.10(a) 运行说明死指针在本域内仅见 `:96` 与 `:1147` 两处（「两处引用」之第二处未在本域复核）。

VERDICT: changes-required
计数：🔴 2 · 🟡 4 · 🔵 2（合计 8 条）

### 轮次 2（评审子代理）

**设计评审（轮次 2 · 复审）——上轮 8 条逐号读回核验（#1–#6 ∥ #8 Fixed · #7 裁记不采纳）+ 新发现 2 条（均 🟡）**

一、上轮 8 条核验（本轮两档现文读回）：

| # | Orig# | 文件 | 严重度 | 状态 | 备注 |
|---|-------|------|--------|------|------|
| 1 | #1 | 批档 §2.2b:54-60 ∥ DOC-DISCIPLINE §3.15:815 | 🔴 | **Fixed** | 两列入表：`:54`「\| # \| 面 \| 当前行数 \| 预计增量 \| 动作 \| 归属 \|」；`:56`「**66**（实测 · as-of 2026-10-01）」∥「**≈ +30**（标题栈 + 区带谓词 + `opts.exemptZones`）」；`:64` 两列射程句（`.md` ∥ 数据档 ∥ 批次面行填 `—`）；DOC `:815` 尺寸档登记（不拆 + 理由 + 触发 + 抽取候选线）与 §3.10:652 先例同形，§3.7:232 两列口径相符。数值 66/88 = as-of 实测声明，脚本档在评审域外 ⇒ **未复核**。 |
| 2 | #2 | DOC-DISCIPLINE :97 ∥ :1147 ∥ :1155 ∥ :1193 ∥ :1197 ∥ :1204 ∥ :1293 ∥ :809 | 🔴 | **Fixed** | 七处逐处收窄：`:97`「**非表格、非区带超宽行照常报告**」· `:1147`「**非表格、非区带 >300 行照报**」· `:1155` ⧸ `:1193` ⧸ `:1197` ⧸ `:1204`「本笔**区带外**新增行零超宽」· `:1293`「（**区带外**）」；`:809` 同拍收窄登记（七处）；变更记录 :1570 同记。复扫：`非表格超宽行照常报告` ⧸ `非表格 >300 行照报` ⧸ `本笔新增行零超宽` = **各 0 命中**；`新增行零超宽` 余 **7 处全带区带外限定**（:809 ⧸ :811 ⧸ :1155 ⧸ :1193 ⧸ :1197 ⧸ :1204 ⧸ :1280）。 |
| 3 | #3 | 批档 :292 ∥ :61 | 🟡 | **Fixed** | `:292` 新增 f) 项（N-SD4 加句 · 口径 = §3.15 · 主 agent 域 · 请裁）；`:61` 行「（上抛 §2.10）」指针现有实际落点（§2.10 a–f）。 |
| 4 | #4 | DOC-DISCIPLINE :806 | 🟡 | **Fixed** | `:806`「「活档域零豁免」射程 = **档级**不整档豁免（在位判据句 = §4.6 ⧸ §4.2.9）」——在位句核：`:1138`「§4.2.8 的「活档域零豁免」= **档级**不整档豁免」∥ `:1006`「活档域的「零豁免」在**行级**保持——豁免的是**声明过的行**，不是档」。失效节不再作现行依据。 |
| 5 | #5 | DOC-DISCIPLINE :824 ∥ :1276 | 🟡 | **Fixed** | `:824` DD-61 补三夹具（半角 `变更记录(续)` ⇒ 照免 ∥ 编号剥离路径 `## 6. 不并项与历史沿革` ⇒ **照报** ∥ `历史沿革` 头下 ⇒ 照免）；`:1276` A-DD23 判据 1 随动（「夹具五事」计数自洽）。 |
| 6 | #6 | 批档 :31 ∥ :48 | 🟡 | **Fixed** | `:48` 现行裁定对表现只引 §3.15（不重述）+「半二」定义与出处落地（= 「读数目标 0（含新增）」的第二半 · 出处 = §3.15 双闸 ① ⧸ 本档 §2.4 末条）；`:31` 三链同源收窄至条目 1 ⧸ 条目 4。残余备注：§2.2:37-42 谓词块仍为全量重述（与 §3.15 现口径**一致**、已宣告单源）——D2 字面残余，非互斥。 |
| 7 | #7 | 批档 :306 | 🔵 | **Ruled（不采纳）** | 父裁裁记在册（N-4 维持现设计）；按 R3 不再主张——复刻路径仍在 §2.4c ∥ §2.7。 |
| 8 | #8 | 批档 :46 ∥ :210 | 🔵 | **Fixed** | `:46` 明示行宽面域与排除面（`docs` 全深 .md − `_archive` ⧸ `batches` 目录）+ 依据（`PROJECT-MANIFEST.json:24-35` ⧸ `scripts/doc-check.mjs:65` ⧸ `scripts/doc-check-targets.mjs:19-43`）；`:210` 同口径复述（「含新增 = 0」射程不含批档）。跨档依据行号在评审域外 ⇒ **未复核**。 |

二、新发现 2 条：

| # | Orig# | 文件 | 严重度 | 状态 | 备注 |
|---|-------|------|--------|------|------|
| 9 | (new) | DOC-DISCIPLINE :110 ∥ :815 | 🟡 | New：同一档两处档位陈述并存互斥 | `:110` 仍写「宽度检查档 = **存量贴线档**（300 建议线）——本批承诺**终态 ≤300**……**若实测越线 → 拆分退路**：抽**宽度扫描核心**至独立档 + 扫描库分档」；`:815` 新登记「（**66** 行 · 本批增量 ≈+30 ⇒ 终态 ≈100）……**不拆**——理由 = 远低于 300 建议线……抽取候选线 = 抽「**标题栈 + 区带谓词族**」→ 新档 `doc-check-zones.mjs`」。档位读数与拆分候选线两处两存，其一必为 stale 现状陈述（D8 射程 = 现状陈述）。建议：按新实测收一（§3.3 更新 ⧸ :815 携取代注记）。 |
| 10 | (new) | DOC-DISCIPLINE :634 ∥ :1233 ∥ :1252 ∥ :1268 | 🟡 | New：同族「无条件形」完成度残留（非互斥） | 四处仍为未限定「新增…超宽 0」：`:634` DD-49「**本笔 / 本轮新增**悬空 0 + 新增超宽 0」· `:1233` A-DD19 ⑧「各实施轮**新增**悬空 **0** + **新增**超宽 **0**」· `:1252` A-DD20 ④「本轮**新增**悬空 **0** + **新增**超宽 **0**（相对判据——同 A-DD18 / A-DD19 ⑧ 句式）」· `:1268` A-DD22 ③（同句式）。口径已由 §3.15 单源定（`:811` 区带外），故**非互斥**；但与本轮修复自身口径（`:809`「无条件形不再成立」）未同拍，残留扫描串集（批档 §2.11 ③ 四串）未覆盖此句族。建议：同法加区带限定，或在 §3.15:809 登记其射程。 |

**复核备注**：声明 13 处落点（:97 ∥ :1147 ∥ :1155 ∥ :1193 ∥ :1197 ∥ :1204 ∥ :1293 ∥ :806 ∥ :809 ∥ :815 ∥ :824 ∥ :1276 ∥ 变更记录）逐处实读在场且内容与修复轮声称相符 ✓；批档 §2.4b 清单位数 = 20 档 ✓；§2.2b 表 6 列格式齐整 ✓。DOC-DISCIPLINE 全域「超宽 ⧸ 行宽」复扫：除新发现 #9/#10 外无他处无条件口径；:1426 ⧸ :1505 ⧸ :1517 ⧸ :979 等超宽读数均为带 as-of 的记录面行（照留）。

VERDICT: pass
计数：上轮 8 条（🔴2 · 🟡4 · 🔵2）——Fixed 7 条（#1–#6 ∥ #8）· Ruled 1 条（#7）；新发现 2 条（🔴 0 · 🟡 2 · 🔵 0）。

### 轮次 3（评审子代理）

**设计评审（轮次 3 · 补缺块 §2.13）——发现 5 条（🔴 0 · 🟡 4 · 🔵 1）**

| # | 类别 | 严重度 | 问题 | 建议 |
|---|------|--------|------|------|
| 1 | 受影响文件尺寸标注 | 🟡 | §2.13 ③ 拟对批内件 `docs/batches/2026-10-01-docwidth-settlement.test.mjs` 增一例（③「复跑 **11/11** 绿」⇒ 件已在盘）；§2.13 ④ 受影响面补缺表（续表号 8–12）未列该件——盘上仅 §2.2b 行 5 旧注「—（新建）∥ ≈+120 预估」，无当前行数实读；「将被改动的测试档」缺「当前行数 + 增量」两列标注（§2.2b:64 自持口径） | 增例保留 ⇒ §2.13 ④ 补该件行（当前行数实读 + Δ≈一例），并把 ③ 计数口径收一（并入后 **12/12**）；增例不保留 ⇒ ③ 明示「不并入」+ 一行理由，使受影响面闭合 |
| 2 | 验收（回归面） | 🟡 | ② 声称「零另改面（派生自动随动）」；③ 验收仅 = 读面契约 + 真跑 + 批内件 11/11——核心包测试面无一行：`DEFAULT_MANIFEST.checkConfig` 增子键改变 `fillDefaults` / `missingKeys` 读面输出形状（① 实跑片段自证读面取值随默认键集合变），`thincoder-core/test/**` 如有键集 / 缺键断言即受影响（域外未核）⇒「零另改面」缺机检背书 | ③ 补一行核心包测试面（如 `cd thincoder && npm test` 全绿）；或显式声明核心测试面不在本批验证面并给理由 |
| 3 | 文档状态一致性（披露面） | 🟡 | ⑦b 仅点名 `MANIFEST.md:56`「写默认五键档」为存量陈旧；同档同句族另有两处未入披露：`:577`（T2「写默认五键档」——与 :56 逐字同句）∥ `:576`（T1「五键齐全」）——顶层面计数「五」与现档八键（`:98` ∥ `:293`）相抵；披露集与实集不同步（D3 面） | ⑦b 射程扩至该句族（逐点列名），或同法一并收正（就地「八键」）+ 变更记录一行——两选收一为单一口径 |
| 4 | 方法论 / 记录一致性 | 🟡 | 同批两处实施形态互斥：§4「实施 = 工程工具面（父侧直接执行——`scripts/**` ∥ manifest ∥ 批内件测试档；**§5 = 不适用：无 eng-coder 段**）」对照 §2.13 ②「实施面归属：**eng-coder · designToken 随本批续**」（产品码面）；且 §4 批准范围句「以 §2.9 ∥ §2.11 ∥ §2.12 修正面为准」不含 §2.13 ⇒ 补缺轮产品码改动处批准面外 | 收一实施形态（§4 句式与 §2.13 ② 取一）；§4 批准面扩列至 §2.13（含 ③ 增例裁决项）——两处同口径后再点火实施 |
| 5 | 观察项承接 | 🔵 | ⑦a 登记「未入 `DEFAULT_MANIFEST` 的声明键读面**静默丢弃**（fail-open）」与本轮缺口同根因；「本舱不做」已明示，但「登记建议」未钉承接面 | 为 ⑦a 登记建议钉一个承接点（台账条目形态 / 收口面一行），防观察项随批消失 |

**复核备注（域内实读）**：MANIFEST.md 现读 **806** 行（`:53` ∥ `:97`「checkConfig 六键」在文 · 变更记录 `:645` 在册——三条新增行长度经 ≥N 括测均 ≤ 声称值 **223 ∥ 149 ∥ 285**）· ENGINEERING-MODE-V2.md **603** 行（E1 JSON `:141` 含 `widthExemptZones: []` · AC3 `:501`「六子键」· 变更记录 `:534`）· DOC-SYSTEM.md **430** 行（§8.2 `:244` 判据项 **7** 七项列举 · 变更记录 `:396`）——三档 Δ 与声明一致（+2 ∥ +3 ∥ +2）✓；三档 ≥301 字符行复扫 = 全为表格行，**新行零超宽** ✓；判由域内可核：`MANIFEST.md:237`（KD-M1-11「fillDefaults 只搬已知键」）∥ `:258`（KD-M1-31 被否候选行「不入 `DEFAULT_MANIFEST` ⇒ 读面取不到」）✓；#546 同法域内旁证 = `MANIFEST.md:647` ∥ `DOC-SYSTEM.md:398`（`lineCounts` 同二点击数位收正）✓。
**未复核（评审域外——按「只读域内四档」约束）**：`thincoder-core/manifest-schema.mjs`（162 行 ∥ `:38-44` ∥ `:60` ∥ `:154-156`）∥ `PROJECT-MANIFEST.json` ∥ `scripts/**` ∥ `DOC-DISCIPLINE.md` §3.15 ∥ #546 批档 ∥ 台账 #779 条目面 ∥ 真跑读数（行宽 293 ∥ 悬空 119 ∥ 差异 7）。
**域限声明**：无项目标准档、无 document map（文档所有权判据降级）；方法论面按 AGENTS.md + 档内自持纪律判。

VERDICT: pass
计数：🔴 0 · 🟡 4 · 🔵 1（合计 5 条）

## §4 用户批准（主 agent）

**代签（父侧 · 2026-10-01）**：依据 = 用户全链自动授权 + 评审轮 1（changes-required——2🔴 ∥ 4🟡 ∥ 2🔵）+ 修复轮 1（§2.11 八条逐号落）+ 复审轮 2（pass——0🔴 / 2🟡，父侧裁收）+ 收正轮（§2.12 两条逐号落；父侧核讫：§3.3 指针化 ∥ 四处「区带外」限定 ∥ `:809` 十一处登记 ∥ 变更记录 `:1573-1574`；+ 补笔：DD-49 修订式残句删净）。**批准范围** = §2 全（**以 §2.9 ∥ §2.11 ∥ §2.12 修正面为准**）：① 机制 = `scripts/doc-check-width.mjs`（标题栈 + 区带谓词 + `opts.exemptZones` 惰性缺省）∥ ② `scripts/doc-check.mjs`（结论行措辞 + `CRITERIA_KEYS` 6 → 7 + 传参）∥ ③ `PROJECT-MANIFEST.json` `checkConfig.widthExemptZones: ["变更记录","历史沿革"]` ∥ ④ 自测件（DD-60–62 夹具——批内件）∥ ⑤ N-SD4 需求句（主 agent 域——本批排期 ✓）∥ ⑥ 正文清账 = **清账轮（另轮）**（不在本批实施面）。**实施 = 工程工具面（父侧直接执行——`scripts/**` ∥ manifest ∥ 批内件测试档；§5 = 不适用：无 eng-coder 段，记录随 §6 收口 + 两档变更记录）**；验收 = 自测件直跑（先红后绿）+ `node scripts/doc-check.mjs` 改前/改后对表。

**§4 追认（父侧 · 2026-10-01 · 承评审轮 3 发现 #4）**：**发布面扩列**——§2.13 补缺全（含 ③ 增例裁决 = **采纳**——`fillDefaults` 搬移断言并入批内件）；**实施面归属收一** = `thincoder-core/manifest-schema.mjs` 走 **eng-coder**（产品码面——designToken 续）；§4 上文「§5 = 不适用」句**仅就原范围（工程工具面）**成立——§2.13 段实施走 eng-coder ⇒ 该句就 §2.13 段撤回（本段即准）。**评审轮 3 五发现裁定**：#1 采纳（④ 补件行 + ③ 计数口径收一）；#2 = 部分采纳（核心包测试面实况 = 空清单（2026-09-28 重置）⇒ 验证落 = 批内件新增例 + `node --check`；「核心测试如有断言」前提不成立）；#3 采纳（同句族收正）；#4 本段收一；#5 采纳（⑦a 承接 = 台账 **#802**）。

## §5 实施记录（eng-coder）
**状态行**：实施完成 2026-10-01（记录面补落轮——会话故障中断后补落 ∥ 复核相符 ∥ 复跑 12/12 绿 ∥ 产品码零改）


**补落轮复核记录（eng-coder · 2026-10-01 19:5x——承前次会话故障中断：两处落盘物在盘 ∥ §5 未落、报告未达；本舱 = 复核 + 复跑 + 补落）**

**① 落点与行数（复核——vs §2.13 规格逐字）**

- `thincoder-core/manifest-schema.mjs:41` = `widthExemptZones: Object.freeze([]),`——`checkConfig` 对象内 ∥ 紧邻 `lineWidth`（`:40`）行后（§2.13 ② 落点建议 ∥ `PROJECT-MANIFEST.json:28-29` 声明序一致）；行数 **163**（`\n` 计数）= 162 + 1——§2.13 ④ row 8「+1（≤+2）」兑现；`git diff` 读数 = 单行增（零夹带改）；派生面自动随动实核（`nestedKeys.checkConfig` `:61` 自动收录六键 ∥ `fillDefaults` 子键搬移环 `:155-157`）。
- `docs/batches/2026-10-01-docwidth-settlement.test.mjs`：行数 **95**（`\n` 计数）∥ `test(` 计数 **12**（含「fillDefaults 搬移」例 `:90-95`）——§2.13 ④ row 13「95（12 例）」相符。

**② 复跑读数（本舱亲跑——2026-10-01 19:53）**

- `node --test docs/batches/2026-10-01-docwidth-settlement.test.mjs` ⇒ **tests 12 ∥ pass 12 ∥ fail 0**（含 fillDefaults 搬移例）✓
- `node --check thincoder-core/manifest-schema.mjs` ⇒ 绿（零输出）✓
- 读面点题：`readManifest("d:/teamcode/thincoder")` ⇒ `ok:true`；`checkConfig` 键 = `["scanDirs","lineWidth","widthExemptZones","anchors","exemptions","lineCounts"]`（六键）；`widthExemptZones` = `["变更记录","历史沿革"]`（逐字）✓；缺键档补默认契约 = `fillDefaults({checkConfig:{}})` ⇒ `[]` ✓

**③ 审计 ∥ 代码评审（自含交付协议——同会话）**

- **explore 分歧审计 1 轮**（只读 · 静态全链）：四类偏差（部分实施 ∥ 静默简化 ∥ 文档漂移 ∥ 越界改动）**零发现**（越界面由本舱 git 侧补核：产品码面 = 单行增）；动态项（12/12 ∥ 点题实读）由本舱执行面复核（见 ②）——终态 **clean**。
- **advisor 代码评审 1 轮**：**pass**——0 🔴 ∥ 0 🟡 ∥ 1 🔵（可选：增例未含「缺键档 ⇒ 补 `[]`」断言——非阻塞；本舱零码改窗口不施加——承接 = 父侧裁）。
- **fix 轮 = 0**（零待修项）。

**④ 诚实披露**

- 前次实施舱会话故障中断 ⇒ §5 未落、报告未达；**本舱 = 记录面补落轮**（产品码零改——只读复核 ∥ 复跑）；两处落盘物 = 前舱产物，逐字复核相符、复跑全绿。
- 父侧验收面（`node scripts/doc-check.mjs` 区带行零现于报告——§2.13 ③ 真跑面）另行在案（收口面）；本舱未跑（非本席写面）。
- 核心包测试面 = 空清单（2026-09-28 重置——§2.13 ③ 末条口径）：本改验证面 = 批内件新增例 ∥ `node --check`。
- 观察（域外 · as-of 本读）：`docs/core/design/API-CONTRACT.md:1023-1027` 生成区五坐标（`:20` ∥ `:27` ∥ `:53` ∥ `:86` ∥ `:144`）与插行后 `manifest-schema.mjs` 现状逐点相符（§2.13 ④ row 12「生成器重跑」收口项——本舱未跑生成器，实读为据）。

**⑤ 边界（本舱不做）**：产品码零写 ∥ `docs/**` 设计档零触 ∥ 本档 §1/§2/§3/§4/§6 零触 ∥ 他批零触。

## §6 验证与收口（父代理）

**§6 验证与收口（父侧 · 2026-10-01）**

**验收核验（终态 —— 全数过）**：① 机制面（本批交付）全落：`scripts/doc-check-width.mjs`（标题栈 + `isZoneHead` 谓词 + `opts.exemptZones` 惰性缺省）∥ `scripts/doc-check.mjs`（`CRITERIA_KEYS` 6⇒7 + 区带注）∥ `PROJECT-MANIFEST.json`（`checkConfig.widthExemptZones: ["变更记录","历史沿革"]`）；② **schema 补缺**（产品码 · eng-coder）：`thincoder-core/manifest-schema.mjs` **163 行**（`:41` 增 `widthExemptZones: Object.freeze([])`——单行零夹带）；③ 自测件 **12/12 绿**（先红后绿在案；含 `fillDefaults` 搬移例）；④ **真跑对表**：`node scripts/doc-check.mjs` ⇒ `FAIL(行宽): 120 行超 300 字符（区带豁免在效——变更记录 ∥ 历史沿革）`——**293 ⇒ 120**；`readManifest` 点题 = `checkConfig` 六键 ∥ `widthExemptZones` 逐字可读；缺键档契约点 `fillDefaults({checkConfig:{}})` ⇒ `[]` 亲验；⑤ 文档面同步：MANIFEST.md 804⇒**808**（含 `:576`/`:577` 收正）∥ ENGINEERING-MODE-V2.md 600⇒603 ∥ DOC-SYSTEM.md 428⇒430 ∥ 需求句 N-SD4；⑥ 生成区重生成：`api-contract --write` ⇒ **2772 条** ∥ `--check` 零漂移（父侧 20:0x——#2 直读 + 父侧重跑双证）。

**父侧裁定**：① 评审轮 3 五发现 = 收正轮全落（父侧实读核讫）+ #2 复核相符（零不符项）；② 🔵（缺键档断言未入批内件——手动亲验已过）= **裁收**（不另立轮）；③ §2.13 ④ row 12（生成区重跑）= 本笔落。

**清账轮（另轮 · 不在本批实施面——§4 批准面第 ⑥ 条明文）**：正文清账 120 行（20 档）+ 锚面 117 悬空清账 + §4.x 行数回填工单 7 条——**台账 #806**（清单/规则 = §2.3/§2.4 在案；收口判据 = §2.6 腿 3 全绿）。本批收口**不受其绊**。

**事故披露**：本轮 §5 补落 = 会话故障（18:46 自走重启事故——假死批 §6 ∥ 台账 #805 在册）中断所致；实施面（schema 格 + 用例）当夜已落盘，记录面由补落轮补齐。

**台账**：#779 → 已核销（本笔落）。**收口**：记录冻结（close 随本笔）。
