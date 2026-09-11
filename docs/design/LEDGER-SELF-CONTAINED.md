# 台账自持（LEDGER-SELF-CONTAINED）— 设计（CLI 侧）

> 板块：工程模式 / 文档体系自持。需求见 `../requirements/ENGINEERING-MODE.md` §1.19。
> 批次档：`2026-09-12-LEDGER-SELF-CONTAINED`（本仓）· `2026-09-12-LEDGER-SELF-CONTAINED（VSC 仓）`——跨端引用形态 = §4.3 规范（去 `.md`、去路径前缀）。
> 状态：**设计在途**。
> 行数标注口径：`readFileSync(...).split("\n").length`（含末行空元素），一律标 as-of。

---

## 1. 问题陈述与定位

工程模式的文档体系在**本产品的两个仓**（CLI / VSC）之间存在**跨仓登记**：一个仓里写着另一个仓的事项。

- **形态一（事故）**：他方把外部产品线的债（含一条安全项）登记进 `thincoder/docs/TODO.md`，随主线合入并推到两个公开远端。
- **形态二（双端互引）**：CLI 仓承载本该住 VSC 仓的台账条目、批次档与需求节；VSC 仓台账 2/2 条指针指向 CLI 仓。

两种形态同源——「能记一处就不写两处」。内容层已清（事故条目已自历史移除），**机制上没有闸**：同形态条目今天可以照样再登记进来。

本批立三样东西：

| # | 面 | 内容 | 对应裁定 |
|---|---|---|---|
| 1 | **射程规则** | 台账 / 批次档 / 需求档只收本仓条目，禁跨仓指针 | R1 · R6 · R7 |
| 2 | **行为纪律** | 上述约束落**提示词层**（代理运行期实际读到的纪律），不只落文档层 | R3 · R8 |
| 3 | **机械闸** | 台账条目的证据 / 指针路径须**在本仓内可解析**，fail-closed | R4 |

**定位边界**：本批不改 `check-ledger.mjs` 既有 L1–L3 判据语义；不改 `check-doc-width.mjs` / `doc-consistency` 既有判据；不做事故的平台侧处置（远端缓存与克隆副本回收——组织层面事项）。

## 2. 需求层（本批要什么）

本批覆盖 R1–R9（批次档 §1 裁定表）与父侧裁定 P1′ / P2′ / P3（P3 由 B10 · B12 承接——映射见 §8.8），逐条映射到条目号 B1–B12（批次档 §2）：

| # | 条目 | 源裁定 | 性质 |
|---|---|---|---|
| B1 | 台账射程 = 只收本仓条目；禁跨仓指针（含本产品多端互引） | R1 | 规则 + 提示词 + 机检 |
| B2 | 缺失层补齐：VSC 仓 `docs/requirements/` + `docs/batches/` 自持面 | R2 | 对端仓建设 |
| B3 | 上述约束落**提示词层**（行为面） | R3 | 提示词 |
| B4 | 机检补强：证据 / 指针路径本仓内可解析 | R4 | 机检 |
| B5 | 否决在案：不得以「对端无自持档」放宽跨仓指针 | R5 | 边界（否定式） |
| B6 | 批次档同规：各仓记各仓自己的 | R6 | 规则 + 存量处置 |
| B7 | 文档体系各仓自持（非复制——语义同源、各端原文自持） | R7 | 规则 + 存量处置 |
| B8 | 核验职责须落提示词层（多实现面纪律节） | R8 | 提示词 |
| B9 | 多实现面纪律节通用化 + 去维护者注 + A1 checklist ④ 通用化 | R9 | 提示词 |
| B10 | **存量宽口径处置**：凡触及对端的批档一律处置（迁移 / 拆分），禁豁免（含历史收口档） | P1（用户 05:08 撤销原判） | 存量处置 |
| B11 | **VSC 文档体系逐层成套**：层清单逐行达成 + 36 档需求对位表（逐档三值）+ 归位 | 用户 05:17「一套完整的文档体系」 | 对端仓建设 |
| B12 | **指针与引用面存量**：台账跨仓指针（活 + 归档）逐条处置 + 批档互引改指 + 需求/设计写痕逐档处置 | R1 · P1 | 存量处置 |

**范围边界（每条不做什么）**：

- B1 不判**散文**里的对端提及（机检不可判 —— 留评审）；只判**路径形态**。
- B2 不在本批一次性迁移历史存量（分期见 §8.5）。
- B7 不要求两仓文档逐字一致——语义同源、各端原文自持（在案多实现面纪律）。

## 3. 方案选型对比

### 3.1 台账射程判据（B1）

| # | 候选方案 | 判据逐项评估 | 取舍（选定代价 / 权衡） | 结论 |
|---|---|---|---|---|
| 1 | 禁一切「他仓字样」 | 可机判但**假阳高**：对位声明、镜像登记、机制叙述里提到对端全部命中 | 大量本仓合法内容被判红，规则无法常驻 | **否决**（零假阳是常驻前提） |
| 2 | 放行既有「名称（仓别）§N」规范形态 | 该规范解决的是**散文引用**；**条目里的 `file:line` 证据形态**完全不覆盖 | 今天事故的形态照样漏判 | **否决**（不解决事故形态） |
| 3 | **本仓可解析**：条目内路径形态必须以**本仓根**为解析基根可解析；不可解析即违规 | 可机判、零路径散文零命中、对存量可入基线 | 代价 = 需为 L4 单列解析基根（不复用 L1 的 `refBases`，见 §7.3） | **选定** |

### 3.2 跨仓登记的机检位置（B4）

| # | 候选方案 | 判据逐项评估 | 取舍 | 结论 |
|---|---|---|---|---|
| 1 | 并入既有 L1（改 `refBases`，去掉兄弟仓基根） | 直接改既有判据语义 → 违「本批不改 L1–L3」；且 L1 只管 `doc.md §N` 形态 | 语义面重叠、归因不清 | **否决** |
| 2 | **新增 L4**（独立解析基根 = 本仓根 + 台账目录），L1–L3 零改 | 形态面全覆盖（指针 + 证据）；与 L1–L3 正交 | 代价 = 一个条目可能同时报 L1 与 L4（可接受——两侧判据面不同） | **选定** |
| 3 | 只扩 L3②（`file:line` 加存在性检查） | 漏 `doc.md §N` 形态的跨仓指针 | 半闸 | **否决** |

### 3.3 批档跨仓存量处置（B6 / B10）——宽口径 + 溯及既往

口径来源 = 批次档 §1 父侧裁定 **P1**（2026-09-12 05:08 用户撤销「严口径 + 历史不溯及」原判）。

| # | 候选方案 | 判据逐项评估 | 取舍（选定代价 / 权衡） | 结论 |
|---|---|---|---|---|
| 1 | **严口径 + 历史不溯及**（只有实施面全在对端的整档迁；历史收口批豁免） | 判据窄：两端均有实施面的 31 档零处置；「审计链」理由经实测不成立（见 §5 D9） | 病根留在存量面（31 档）——与 R6/R7 直接冲突 | **否决**（用户 2026-09-12 05:08 撤销原判——不得复活） |
| 2 | 宽口径 + 不溯及既往（新批合规、存量不动） | 处置面只覆盖新批；存量同形态条目仍在原仓 | 半闸：明天可照旧、昨天不算 | **否决**（R6/R7 对**全部**记录生效——无溯及豁免条款） |
| 3 | **宽口径 + 溯及既往**：凡触及对端者一律处置——① 实施面全在对端 → 迁移；② 两端均有实施面 → 各仓持其份（逐档拆分清单）；③ 零对端实施面 → 零处置 | 判据可机判（档内自述仓属句 + §2/§5 文件表）；33 档逐档有处置；三值取值域封闭 | 代价 = 19 档拆分的逐档切分 + 14 档迁移的引用改指 + 迁移档在对端仓的宽度合规（§8.3 / §8.7） | **选定** |

**计数自洽**：迁移 14 + 拆分 19 = **33**（触及对端）；另 20 档零对端实施面 = 零处置；53 ✅（§8.3）。

### 3.4 对端仓需求档建立形态（B2 / B7）

| # | 候选方案 | 判据逐项评估 | 取舍 | 结论 |
|---|---|---|---|---|
| 1 | 存量 54 档一次性迁移 | 与在飞并行批冲突；历史归档档不可拆（同 §3.3 理由 1）；一次搬迁无法评审 | 风险高、不可控 | **否决** |
| 2 | 只登记不建 | 等于复活 R5 否决方案 | 用户已明确驳回 | **否决** |
| 3 | **首建树 + 本批需求落位 + 存量分期表（每期带触发条件）** | 自持面当期即存在（新需求有落点）；存量逐期收口、不悬空 | 代价 = 存量在本批结束时仍有残留（分期表逐条登记，非「待议」） | **选定** |

### 3.5 提示词承载落点（B3 / B8 / B9）

| # | 候选方案 | 判据逐项评估 | 取舍 | 结论 |
|---|---|---|---|---|
| 1 | 只落「多实现面纪律」节 | R3 的台账 / 批档 / 文档自持行为条款无处落 | 覆盖面不足 | **否决** |
| 2 | **新节「文档与台账自持」+「多实现面纪律」节改造（R8/R9 同节一次落定）** | R3 与 R8/R9 分属两个机制面，各得其所；同节条文一次落定满足 R9「禁止两批各写一遍」 | 代价 = 双端各 2 面提示词文件 + 2 测试档改动 | **选定** |
| 3 | 落 `persona-*`（角色写域句） | 归属判定四问第 3 问：机制条款属**纪律层**，非人格层 | 层位错置 | **否决** |

### 3.6 VSC 文档体系对位形态（B11）——三值判据

| # | 候选方案 | 判据逐项评估 | 取舍 | 结论 |
|---|---|---|---|---|
| 1 | 只建 `docs/requirements/` 一个壳（目录 + README） | 用户 05:17 标准 = **完整**（逐层成套）；单层壳 = 搭骨架 | 不达验收面 | **否决** |
| 2 | 物理复刻 CLI 36 档需求正文入 VSC | 违「**非复制**——语义同源、各端原文自持」（R7 / F3）；且复制必然漂移 | 制造双份漂移源 | **否决** |
| 3 | **逐层对位 + 36 档需求对位表（逐档三值 ①/②/③）** + 归位规则 + 层清单逐行达成 | 每档有确定处置（无空、无「待定」）；① = 建本仓需求档 · ② = 已有对位（允许异名/异层，注明档名）· ③ = 本端无此面（写理由） | 代价 = ① 6 档新建 + ② 4 档归位 + 2 档拆并（§8.6） | **选定** |

### 3.7 `docs/guides/` 判定（B11 连带）

| # | 候选方案 | 判据逐项评估 | 取舍 | 结论 |
|---|---|---|---|---|
| 1 | 建 `docs/guides/`（对位 CLI 1 档） | CLI `guides/ides.md` 唯一主题 = **ACP/终端 IDE 接入**——本仓无 ACP 面（对位表 ③ 行）；建空层无内容可载 | 空层违「无内容不建层」 | **否决** |
| 2 | **不建 guides/ 层**（层清单内显式登记「不建 + 理由」） | 本仓接入/使用面已分别住 `docs/README.md`（地图）与 `docs/design/WEBVIEW.md`（UI / 消息协议）；发布面住 `docs/design/RELEASE.md` | 代价 = 层数比 CLI 少一层（端差**已登记**，非静默） | **选定** |

**触发**：出现首个「面向用户的操作指南」主题（非机制设计）时建层并在 `docs/README.md` 登记。

## 4. 架构 / 接口 / 数据流契约

### 4.1 自持边界契约（两条轴，互不替代）

| 轴 | 管什么 | 判据 | 落点 |
|---|---|---|---|
| **轴一：条目 / 归属** | 台账条目、批次档范围、需求归属 | **本仓可解析**（路径形态必须在本仓根内可解析） | 机检 L4 + 提示词「文档与台账自持」节 |
| **轴二：正文引用形态** | 文档正文里引用他仓文档 | **既有 V1 跨仓边界**（「名称（仓别）§N」= 显式域外；带 `.md` 形态 → `unknown-doc`） | `docs/README.md` §3.7 + `check-doc-width.mjs` `checkSectionRefs` |

**两轴对齐结论（取代 / 收口 / 并列——逐条）**：

- 既有 V1 跨仓边界（`../requirements/ENGINEERING-MODE.md:675-677`）**保持原样**，**不被取代**——它管的是正文散文引用形态。
- R1 **不与之冲突**：R1 管的是**条目与归属**，不是散文。二者**并列**、射程不重叠。
- **合并口径（不留两套）**：正文引用他仓用规范形态（轴二）；条目 / 归属不带他仓指针（轴一）。一句话：**「正文可以指他仓（规范形态），条目与归属不行」。**

### 4.2 台账条目契约（L4 的输入面）

条目内的**路径形态**分两类，均入 L4 判据：

| 形态 | 正则锚 | L4 要求 |
|---|---|---|
| 指针 `X.md` / `X.md §N` | 既有 `REF_RE` | 以**本仓根 + 台账目录**为基根可解析到档；不可解析 → `[L4]` |
| 证据 `path.ext:line` | 既有 `EVIDENCE_RE` | 取 `:` 前路径段，须在**本仓根**内为文件；不可解析 → `[L4]` |

**不入判据**（零假阳面）：无路径的散文（对位声明、镜像登记、机制叙述）；「名称（仓别）§N」规范形态（无路径）；组标题 / 表头行。

### 4.3 跨端互引形态规范（两侧记录互引）

两侧批次档 / 台账之间的互引，按**轴二**规范形态书写：`名称（仓别）§N`。

- 例：VSC 侧批档引用 CLI 侧记录写 `LEDGER-SELF-CONTAINED（CLI 仓）§2`——**去 `.md` 后缀、去路径前缀**。
- 本批自身两侧记录（`2026-09-12-LEDGER-SELF-CONTAINED` CLI / VSC 各一份）互引即按此形态；两档 `§1` 现有的跨仓路径写法（含 `.md`）为**本批前形态**，随本批就地按规范形态收敛（CLI 侧由主 agent 落笔，见 §9）。
- **范围（修正轮补充）**：本形态自本批新档起生效——两侧设计档 / 需求档自身的跨端引用同循（收敛面 = 本批新档 + 两侧批档 `§1`；存量档按 §8 处置）。

### 4.4 数据流

```
台账条目（docs/TODO.md）
   └─ 路径形态 ─┬─ 指针 X.md §N ─→ 基根=(本仓根, 台账目录) → 不可解析 ⇒ [L4]
                └─ 证据 p:f        ─→ 基根=(本仓根)          → 不可解析 ⇒ [L4]
   └─ 基线分流（test/fixtures/ledger-baseline.json）
        ├─ 新增 ⇒ 阻断（退出码 1）
        └─ 存量 ⇒ 降报告
```

## 5. 关键决策记录（含否决备选）

| # | 决策 | 理由 | 否决备选 |
|---|---|---|---|
| D1 | 射程判据 = **本仓可解析** | 可机判、零假阳、直击事故形态 | 「禁他仓字样」（假阳）· 「只放行规范形态」（漏证据行） |
| D2 | 机检**新增 L4**、L1–L3 零改 | 守本批边界：不改既有判据语义 | 改 `refBases`（动 L1） |
| D3 | **归档档按对端面条目逐条处置（不再整体冻结——修正轮更新）**：非对端条目零改 | 初版「两仓零改」冻结口径经 P1′ 宽口径改判修订（2026-09-12 05:08）——对端面条目按 §8.2 处置（CLI 归档 9 迁移 + 4 拆分 + 1 零改）；归档语义「保留原指针与状态」约束**非对端条目** | 初版「整体冻结」**经改判否决**（对端面条目留驻 = 病根不除）；改非对端条目（破坏历史可追溯）仍否决 |
| D4 | 批档按**实施面仓属**分类处置 | 见 §3.3；判据可机判 | 全迁 / 全留 |
| D5 | 对端仓**自持自己的台账检查器** | 与在案先例一致：VSC `src/ledger.mjs:6` 明写「VSC 端为独立实现、语义同源（不跨仓 import）」；且 CLI 检查器 `DEFAULT_LEDGERS` 现含对端仓台账（跨仓扫描面），与 R1 同病 | 复用 CLI 检查器扫对端（跨仓面） |
| D6 | 提示词**新节 + 多实现面纪律节一次改造** | R9 明令 R8/R9 同节同批；R3 行为条款需独立落点 | 只改多实现面节 / 落 persona |
| D7 | **normal 模式覆盖面结论**：R1/R6 不适用（normal 无台账 / 批档机制）；R7 适用（normal 也写文档）→ 落 `discipline-normal.md` | 逐处判定，不默认「另一仓另说」（批次档 §1「提示词层承载」要求） | 默认不覆盖 |
| D8 | **文件域冲突显式登记**（与并行批 `PROSE-ANCHOR-RETIRE`） | 两批同触 `test/prompts-async-guidance.test.mjs`（双端各 1 档）+ 双端 `discipline-engineering.md` | 静默并发（写冲突） |
| D9 | **跨仓迁移机制 = 两仓两步法**：本仓删（`git rm`，历史在本仓 `log --follow` 可追）+ 对端增（同源文本 + 提交信息携源档路径与源 SHA） | **实测：两仓为独立 git 仓**（`d:/teamcode` 非仓；`thincoder/.git` 与 `thincoder-vscode/.git` 各自独立）→ **跨仓无 `git mv`**；P1 所据「`git mv` 保留历史与 blame」在同仓内成立、**跨仓不成立**——如实登记（处置结论不变，机制按两步法） | 历史重写（`git filter-repo` / `subtree`——改写两仓公开历史，事故刚因历史重写付过代价）**否决** |
| D10 | **拆分粒度 = 按条/按块切分，文字逐字搬运**（不重写、不摘要） | 过程记录的价值在原文；重写 = 伪造记录（批档 §1.12 一段一作者的存量延伸） | 允许重写（伪造过程记录）**否决** |
| D11 | **存量搬迁的 append-only 边界**：append-only 约束**在飞过程**；存量搬迁 = **带清单的搬迁**（逐档清单落本案 + 两仓档首搬迁注记） | 「不改既有行」无法与「对端份不得留本仓」并存；清单 + 注记使搬迁**可审计、非静默** | 「append-only 不可违 → 只许新增档」（对端内容永久留驻本仓 = 病根不除）**否决** |
| D12 | **VSC 需求档树终态 = 16 档**（README + 在位 2 + 归位 6 + 拆出 1 + ① 新建 6——`TESTING` 由并行批落位，as-built 核对） | ② 28 行中对位档住 `docs/design/` 的 19 行**不迁层**（该档是本仓该机制的权威设计档；迁层 = 制造单机制双源） | 「36 物理档全建」= 复制 CLI 正文（违非复制）**否决** |
| D13 | **实施分派 = 两侧各一个 eng-coder、独立实施、共享同一 designId + token** | 各端独立实现（在案多实现面纪律）；单设计链双仓实施面 | 单端实施（对端面缺失）· 两端手工串行（窗口倍增）**否决** |
| D14 | **VSC 测试档（535）拆分 = 尾段迁出**（`:409`–EOF → `test/prompts-carryover-anchors.test.mjs`；方案见 §9）——**【as-built 核对：不执行】**并行批先落，该档已回落 500 内（实测 177）→ 本批零改、拆分不适用 | 超 500 硬限无豁免（AGENTS.md）；尾切零交叉 + 余档余量最大 | 迁「装配 + 降级链」组（基建共用多、余量小——§9）· 不拆（违硬限）**否决** |

## 6. 提示词面（B3 / B8 / B9——同节一次落定）

### 6.1 「多实现面纪律」节（通用化后逐字形态——去绑死 + 去维护者注 + 并入 R8 核验职责）

```md
#### 多实现面纪律（多端镜像）
同一机制落多个实现面（多个端 / 多种语言 / 多个平台 / 同源镜像文档）时：
1. **各面独立实现，语义同源**：各实现面各自的文本以其面原文为准——不做 byte-identical 硬一致、不加面间
   同步依赖（硬一致形成互相依赖——并发处理不利）；一致由同源设计 + 各面独立语义锚断言守
   （fail-when-unchanged——各面断言自身驻留绿）。
2. **实现面互不追赶**：不以任一实现面实际产物为准回改其他面（面间互相参照 = 乒乓振荡）。
3. **差异如实上报**：落地中发现同源设计缺陷 → 停下报告（设计档修正 + 重新评审），不静默偏离。
4. **面特有段各面保留**：某一实现面独有的内容段在其面原地保留——不并入其他面布局。
5. **一式多份设计的核验职责**：同一机制跨多个实现面产出**一式多份设计**时，各面设计独立成文；
   **主 agent 有义务核验各份逻辑是否一致**——核验四维 = 裁定同源 / 判据同一 / 边界同形 / 差异显式登记
   （静默差异 = 漂移，不得放过）；核验时点 = 各面设计均落档后、**评审前预检**内执行；
   核验结论连同差异表随「设计就绪待评审」一并报用户。
```

**逐项对照（R9 六个绑死点 → 处置）**：

| # | 现行绑死点 | 处置 |
|---|---|---|
| 1 | 标题 `（双端镜像）` + VSC src 版维护者注 `——2026-09-09 修订：byte-identical 硬一致已废` | 标题改 `（多端镜像）`；维护者注**删** |
| 2 | `（如 CLI/VSC 双端 prompts 或文档镜像）` | 改 `（多个端 / 多种语言 / 多个平台 / 同源镜像文档）` |
| 3 | 正文通篇「双端」+ 维护者注「已废」 | 改「各实现面 / 面间」；注删 |
| 4 | `（双端互相参照 = 乒乓振荡——已实证）` | 改 `（面间互相参照 = 乒乓振荡）`——**去本产品史** |
| 5 | `（如 VSC R14 池规则段）` | 改「某一实现面独有的内容段」——**去本产品具体段落** |
| 6 | 新增第 5 条（R8 核验职责） | 见上文逐字 |

### 6.2 新节「文档与台账自持」（R3 行为条款逐字形态）

```md
## 文档与台账自持（各仓记各仓的）
工作区含多个仓（多仓 workspace / monorepo 多仓 / 多项目并存）时：
1. **台账只收本仓条目**：需求池与技术待办只登记本仓事项——禁登记他仓 / 他项目 / 他产品线的事项；
   **跨仓指针同样禁止**——不在本仓台账里指向他仓的档、路径或证据。
2. **批次档同规**：批次档各仓记各仓的——本仓批次档只登记本仓范围（含本仓的受影响文件与验收）。
3. **文档体系各仓自持**：需求档 / 设计档 / 批次档 / 台账一律各仓自持、只写本仓；
   本仓需求必须住在本仓——不得把他仓需求写进本仓文档。
4. **缺的层必须补齐**：本仓缺失的文档层就地补建——不得以「另一仓已有」「避免重复」为由省略本仓文档。
5. **台账头部自持**：台账头部只引用本仓路径与节号——不引用他仓路径。
```

### 6.3 A1 勘察 checklist ④ 通用化（逐字）

| 现文 | 改后 |
|---|---|
| `> ④ 核双端对位面（CLI/VSC 镜像）` | `> ④ 核多实现面镜像面（多端 / 多种语言 / 多个平台同源镜像）` |

### 6.4 落点表

| # | 文件 | 面 | 动作 |
|---|---|---|---|
| 1 | `src/prompts/discipline-engineering.md` | CLI EN | 多实现面纪律节改写（§6.1）· A1 ④（§6.3）· 新节（§6.2） |
| 2 | `docs/design/prompts/discipline-engineering.md` | CLI CN | 同上（本节无 A1——该镜像档不含「设计行为纪律四维」节，见 §9 注） |
| 3 | `src/prompts/discipline-engineering.md`（VSC 仓） | VSC EN | 同上（本端原文自持） |
| 4 | `docs/design/prompts/discipline-engineering.md`（VSC 仓） | VSC CN | 同上（同理无 A1） |
| 5 | `src/prompts/discipline-normal.md` | CLI normal | 新节（§6.2）——normal 覆盖（D7） |
| 6 | `src/prompts/discipline-normal.md`（VSC 仓） | VSC normal | 同上（本端原文自持） |
| 7 | `docs/design/prompts/discipline-normal.md` | CLI normal（CN 镜像） | §6.2 条 3 / 条 4——**修正轮纳入**（镜像面与 `src/` 同规：实测存在，184 行） |
| 8 | `docs/design/prompts/discipline-normal.md`（VSC 仓） | VSC normal（CN 镜像） | 同上（本端原文自持；实测存在，184 行） |

**措辞纪律**（R3）：条文可执行、**零维护者注**（不写日期 / 批号 / 评审号 / 档内引用）；零本产品术语绑死；行宽 ≤300 字符。

### 6.5 normal 模式覆盖面结论（D7——逐处判定）

| 条款 | 工程模式 | normal 模式 | 判据 |
|---|---|---|---|
| 台账射程（§6.2 条 1） | ✅ 适用 | ❌ 不适用 | 台账（需求池 / 技术待办）是**工程模式机制**——`discipline-normal.md` 无台账面（全文读毕，零「台账 / 需求池」） |
| 批次档同规（条 2） | ✅ 适用 | ❌ 不适用 | 批次档同属工程模式机制（`../requirements/ENGINEERING-MODE.md` §1.12） |
| 文档体系自持（条 3） | ✅ 适用 | ✅ **适用** | normal 也写文档：`discipline-normal.md:13,31-34` 有「文档先行 / 文档归属」节 |
| 缺的层补齐（条 4） | ✅ 适用 | ✅ **适用** | 同条 3 |
| 台账头部自持（条 5） | ✅ 适用 | ❌ 不适用 | 头部属台账面 |

→ **落点结论**：条 3 / 条 4 进 `discipline-normal.md`；条 1 / 2 / 5 只进 `discipline-engineering.md`（不为不可达场景写纪律）。

## 7. 机检补强（B4 / R4）

### 7.1 新规则 L4「本仓可解析」

- **L4① 指针路径**：条目内 `X.md` / `X.md §N` 形态 → 解析基根 = **本仓根 + 台账目录**（不含工作区根、不含兄弟仓）→ 不可解析 ⇒ `[L4]`。
- **L4② 证据路径**：条目内 `path.ext:line` 形态 → 路径段须在**本仓根**内为文件 → 不可解析 ⇒ `[L4]`。
- **判据句**：本仓条目内出现的每一个路径形态，都能以本仓根为基根解析到实际存在的档 / 文件——否则 `[L4]` + 退出码 1。

### 7.2 为何现有 L3② 会漏掉今天的事故形态

| # | 现状 | 漏判机制 |
|---|---|---|
| 1 | L3② 判据 = `EVIDENCE_RE`（`check-ledger.mjs:33`）——**只测 `path.ext:digits` 正则形态** | **零存在性检查、零仓属检查**：他仓 / 他产品线的证据路径（形如 `pkg/src/x.mjs:10`）形态合法即通过 |
| 2 | L1 的解析基根 `refBases()`（`check-ledger.mjs:53-57`）**显式并入工作区根与兄弟仓**（`SIBLING_NAMES`，`:38`） | 本仓台账里的跨仓指针能被解析成「存在」→ L1 也不报 |
| 3 | L3③（锚形态）只看「有没有指针 / 证据」 | 有即可，不看指向哪里 |

→ **结论**：跨仓登记在现行 L1–L3 下**可以零命中通过**。这正是本次事故的形态。

> **证据口径**：事故条目原文已自 git 历史移除（内容不可复读）。本规则以**形态判据**立论——不依赖该次条目原文，以 L3②/`refBases` 的现行源码为实证锚。

### 7.3 与既有 L1–L3 的关系

- **L1–L3 判据语义零改**（`check-ledger.mjs` 既有用例 T67–T96 面不回归）。
- L4 **不复用** `refBases()`——单列本仓基根解析函数，避免动 L1 语义。
- 重叠面：一条跨仓指针可同时触发 L1（若基根含兄弟仓则 L1 不报）与 L4；**L4 是新增闸**，不与 L1 争归属。
- 新规则编号 = `L4`；条目键（基线）沿用 `kind|档|条目键` 形态。

### 7.4 fail-closed 与零假阳

| 面 | 形态 |
|---|---|
| 新增违规 | **阻断**（退出码 1） |
| 存量违规 | 入 `test/fixtures/ledger-baseline.json`（降报告不阻断） |
| 零假阳 | 无路径散文 / 「名称（仓别）§N」规范形态 / 组标题行 —— 均不入判据 |
| 反证非空转 | 合成跨仓条目（本仓不可解析路径）⇒ 必报 `[L4]` + 退出码 1 |

### 7.5 对端仓机检落点（D5）

- 对端仓**自持检查器** `thincoder-vscode/scripts/check-ledger.mjs`（独立实现、语义同源，**不跨仓 import**——与 `src/ledger.mjs` 在案先例一致）。
- 对端已有可复用面：`src/ledger.mjs`（`scanGroups` / `summarizeLedger` / `notifyKey`）——检查器消费本端单源，不重写解析。
- 对端基线档 `test/fixtures/ledger-baseline.json` **当前不存在** → 首跑固化时新建。
- CLI 侧 `check-ledger.mjs` 的 `DEFAULT_LEDGERS`（`:29`）**去掉对端仓项**——本仓检查器只扫本仓（跨仓扫描面与 R1 同病）。

### 7.6 `doc-consistency` V1 扫描域在对端补齐后的影响

| # | 事实 | 影响 |
|---|---|---|
| 1 | CLI V1 域 = `docs/{design,requirements,batches}`（`scripts/check-doc-width.mjs` `SCAN_DIRS:23`）——**本仓域，不变** | CLI 侧零变化 |
| 2 | 对端 V1 域 = 同名三目录（`thincoder-vscode/scripts/check-doc-width.mjs:23` 同形） | 对端建 `docs/requirements/` 与 `docs/batches/` 后**自动落入本端 V1 扫描面**（`scanDomain` 逐目录采集：`:43`） |
| 3 | 对端 `docs/requirements/` 当前不存在 → `collectMarkdown` 处 `readdirSync` 抛错，由 `scanDomain` 的 `try/catch` 兜底跳过（`:43`） | 目录一旦建立，**域即活**——新档须 V1 干净（跨仓引用一律规范形态） |
| 4 | 对端 `test/fixtures/doc-consistency-baseline.json` 已存在（30 条） | 新档产生的 V1 命中**逐条修掉或入基线**（新增阻断、存量降报告）——不得静默放开 |
| 5 | 两仓 V1 域互不交叉 | 不因拆仓产生悬空引用（跨仓 `.md` 形态在本端恒判 `unknown-doc`——既有 `checkSectionRefs` 语义） |

→ **结论**：V1 域规则**不需要改**；需要的是**新档遵守既有规范形态**（轴二）。这是「域已扩、判据不变」的情形。

## 8. 存量处置清单（宽口径 + 溯及既往——逐档）

> 口径来源 = 批次档 §1 父侧裁定 **P1**（2026-09-12 05:08 用户撤销「严口径 + 历史不溯及」原判，改判宽口径 + 溯及既往）。

### 8.1 处置判据（三值 + 零处置；禁豁免）

| 类 | 判据（可机判） | 处置 |
|---|---|---|
| **迁移** | 该档**实施面全在对端仓**——判据 = 档内**自述仓属句** + §2/§5 文件表；**不以路径前缀判**（VSC 单端档在本仓写裸相对路径——上轮以此误判 14 档） | 物理迁移入对端仓（两步法，见 §5 D9）；引用者逐条改指（§8.7） |
| **拆分** | 该档**两端均有实施面**（含仅 1 个对端文档档触面的批） | 各仓持其份（逐档边界见 §8.3）：本仓档留本仓份 + 档首搬迁注记；对端份入对端仓新档（文字逐字搬运——D10） |
| **零处置** | 该档**零对端实施面**（对端提及 = 叙述性，不入判据） | 不动 |

**禁豁免**：不得以「历史已收口 / 审计链 / 重复 / 量大 / 在飞」为由把任一档移出清单。在飞档（受 D5 冻结窗口约束）**处置照给**——执行时点随该批收口（逐档触发见 §8.5），不构成豁免。

### 8.2 台账跨仓指针（逐条——活档 + 归档档）

| # | 位置 | 内容（as-of 2026-09-12 实测） | 处置 |
|---|---|---|---|
| 1 | CLI 活档 `docs/TODO.md` | 头部自持；两池条目指针全指本仓（`:16` 需求句含对端叙述、无路径形态） | **零改**（L4 只判路径形态；叙述性提及不入判据） |
| 2 | CLI 归档 `docs/TODO-archive.md` **9 线**（`:13 :18 :40 :43 :52 :66 :95 :98 :99`） | 条目本体属**对端**（VSC 镜像 / 守卫收尾 / live 块 / git 镜像 / 写面约束 / image 降级等），证据 = 对端路径 | **迁移**（条目文本迁入对端归档档；本仓行移除 + 档内搬迁注记） |
| 3 | CLI 归档 **4 线**（`:27 :54 :74 :101`） | 双端条目（批次一 CLI + 批次二 VSC / 五项不修混合 / 双端注入预算 / VSC ① + CLI ②） | **拆分**（对端份入对端归档档；本仓份留） |
| 4 | CLI 归档 `:41` | 「跨仓引用在 V1 恒判 unknown-doc」——机制条，对端为**示例**（零对端指针） | **零改** |
| 5 | VSC 活档 `docs/TODO.md:2`（头部） | `ENGINEERING-MODE（CLI 仓）§1.13` + `§1.17/FR23` 跨仓引用 | **改指本仓**（触发 = 本端需求档在位——本批已满足） |
| 6 | VSC 活档两池 2 条 | 指针为占位形态（「本仓 `docs/requirements/`（首建——本批产物）」） | **逐条改指本仓具体档节**（落笔归主 agent——台账物理落笔归主 agent） |
| 7 | VSC 归档 `docs/TODO-archive.md:3`（头部） | 同上跨仓引用 | **改指本仓** |
| 8 | VSC 归档 **3 条**（`:13 :14 :15`） | 需求指针指 CLI 仓需求档（AGENT-LOOP §9/§12/§17）+ 任务书指 CLI 仓批档（`VSC-ASYNC-PARITY` / `VSC-ACTIVITY-CLOSURE` / `VSC-CHILD-PERMISSION`） | **逐条改指本仓**（需求 → 本端 `docs/requirements/` 对位档；任务书 → 本端批档——三档按宽口径**迁移**，见 §8.3） |
| 9 | VSC 归档 `:26` 行 | 「批档均在 `thincoder/docs/batches/2026-09-11-*`」 | **改写**（迁移轮落地后指本仓 `docs/batches/`） |

**计数自洽**：CLI 归档 14 线 = **9 迁移 + 4 拆分 + 1 零改** ✅ ｜ VSC 侧 = 头部 2 处改指 + 归档 3 条改指 + 1 行改写 + 活档 2 条改指。

### 8.3 批次档跨仓（CLI 仓 53 档——逐档）

**分类实测**（判据见 §8.1）：

| 类 | 档数 | 行数 | 说明 |
|---|---|---|---|
| **迁移**（实施面全在对端） | **14** | 4234 | 逐档见下 |
| **拆分**（两端均有实施面） | **19** | 7017 | 逐档见下 |
| **零处置**（零对端实施面） | **20** | 5440 | 见本节尾表 |
| 合计 | **53** | 16691 | ✅ 14+19+20 = 53；4234+7017+5440 = 16691 |

**迁移 14 档**（对端落点统一 = `thincoder-vscode/docs/batches/`，档名不变）：

| # | 档（行数） | 附注 |
|---|---|---|
| 1 | `2026-09-10-VSC-MIRROR`（277） | — |
| 2 | `2026-09-11-ADVISOR-BUDGET-VSC-MIRROR`（200） | 上轮列「临界待裁」——档内自述「不碰 CLI 仓」+ 收口「CLI 仓零改动」→ 归类确定为**迁移** |
| 3 | `2026-09-11-PORTABILITY-VSC-MIRROR`（239） | 实施面 24 档全对端；2 个 CLI 文档落款归 §8.4 处置 |
| 4 | `2026-09-11-VSC-ACTIVITY-REGION-RESTORE`（335） | — |
| 5 | `2026-09-11-VSC-ASYNC-PARITY`（272） | — |
| 6 | `2026-09-11-VSC-CONTEXT-PARITY`（309） | — |
| 7 | `2026-09-11-VSC-GUARD-COMPLETION`（286） | — |
| 8 | `2026-09-11-VSC-GUARD-MIRROR`（346） | — |
| 9 | `2026-09-11-VSC-INDEX-PERCEPTION`（362） | — |
| 10 | `2026-09-11-VSC-LIVE-UX`（206） | — |
| 11 | `2026-09-11-VSC-MIRROR-SWEEP`（448） | — |
| 12 | `2026-09-11-VSC-WEBVIEW-ESCAPE`（248） | — |
| 13 | `2026-09-12-VSC-ACTIVITY-CLOSURE`（385） | — |
| 14 | `2026-09-12-VSC-CHILD-PERMISSION`（321） | — |

**迁移档宽度前置**：8 档携带 10 行 >300 非表格行（`VSC-ACTIVITY-REGION-RESTORE` 1 · `VSC-ASYNC-PARITY` 1 · `VSC-CONTEXT-PARITY` 1 · `VSC-GUARD-COMPLETION` 2 · `VSC-INDEX-PERCEPTION` 1 · `VSC-LIVE-UX` 1 · `VSC-ACTIVITY-CLOSURE` 2 · `VSC-CHILD-PERMISSION` 1）。
**迁移时逐行折行**（对端仓宽度面当前 **75 档**全绿——as-of 2026-09-12 复测，不得带红入对端）。

**拆分 19 档**（对端份 / 本仓份 = §2 受影响文件表 + §5 交付表按档内仓属字段分桶的**条目数**）：

| # | 档（行数） | 对端份 | 本仓份 | 切分判据（档内锚） |
|---|---|---|---|---|
| 1 | `2026-09-10-MODEL-SELECTION`（711） | 28 | 30 | §2 双块（`:217` CLI 源 / `:237` VSC 源）+ §5 分提交（对端主体提交 `9299661`） |
| 2 | `2026-09-11-COMMON-LAYER`（410） | 18 | 18 | §2 两面段（`:185` CLI 面 / `:288` VSC 面）+ §5 双面交付（id=36 / id=37） |
| 3 | `2026-09-11-DEEPSEEK-V41-FLASH`（364） | 4 | 4 | §2 双行（`:133` CLI 源 / `:137` VSC 源） |
| 4 | `2026-09-11-DOC-HYGIENE`（272） | 1 | 21 | 唯一对端面 = 对端 `docs/design/AGENT-LOOP.md` C3 两句（`:116`）；本仓 20 档 + 1 目录删除 |
| 5 | `2026-09-11-INPUT-FIXES-SMALL`（291） | 6 | 3 | §2 行级「仓」列（`:205`；B1 纯 CLI / B2 纯 VSC） |
| 6 | `2026-09-11-POOL-LEDGER`（939） | 5 | ≥12 | §2 逐行（`:189` 起对端档带仓前缀）+ §5「11 档 + 1 披露档」 |
| 7 | `2026-09-11-PROMPT-REVIEW-ORDER`（262） | 9 | 8 | §5 `:218` 16 文件分仓（12 提示词 × 双端 + 4 测试档） |
| 8 | `2026-09-11-ROLE-REDEFINITION`（235） | 5 | 8 | §5 `:184` / `:191` 分端（CLI 4 档 + AGENTS/README + 2 测试档） |
| 9 | `2026-09-11-SETTINGS-NULL-DEFAULT`（265） | 3 | 2 | §5 `:253` 交付面分端（CLI 2 + VSC 3） |
| 10 | `2026-09-11-SPAWN-QUEUE-DISCIPLINE`（234） | 4 | 2 | §2 `:40`–`:42` 三档（CLI 1 + VSC 2）+ 2 测试档分端 |
| 11 | `2026-09-11-TEST-DISCIPLINE-PROMPTS`（270） | 7 | 7 | §2 `:89` / `:90` 两波（波 1 CLI / 波 2 VSC） |
| 12 | `2026-09-11-TEST-LIFECYCLE`（524） | ≈23 | ≈35 | 三份 §5（对端面 `:213` / 本仓面 ② `:282` / 本仓扫①）——档数受并发他链改写影响，标 **unverified** |
| 13 | `2026-09-11-TURN-ACROSS-SEGMENTS`（453） | 6 | 3 | §2 `:85` / `:86` 双端行（各端独立实现） |
| 14 | `2026-09-11-VSC-ASYNC-VISIBILITY`（334） | 16 | 5 | §2 `:122` / `:123`（条目 A 纯对端 / 条目 B 双端） |
| 15 | `2026-09-11-VSC-REVIEW-ASYNC-SWEEP`（244） | 15 | 6 | §2 `:56` / `:76`（VSC 15 / CLI 6） |
| 16 | `2026-09-11-WEBSEARCH-PROVIDER-KEY`（278） | 5 | 3 | §2 `:146` 实施域 6 档（CLI 3 + VSC 3）+ 审计轮 2 档 |
| 17 | `2026-09-12-LEDGER-SELF-CONTAINED`（363） | 见附注 | 本档（本仓侧记录） | **在飞**（D5 冻结）——对端侧记录**已在位**；对端份随本批收口迁入该记录对应段 |
| 18 | `2026-09-12-LEDGER-SURFACE`（274） | 13 | 8 | §5 `:268` 交付 21 档分端（VSC 13 / CLI 8） |
| 19 | `2026-09-12-PROSE-ANCHOR-RETIRE`（294） | 见附注 | 本档 | **在飞**（D5 冻结）——对端侧记录已在位；随该批收口执行 |

**持份合计**：对端份 **≈168 条目** ｜ 本仓份 **≈174 条目**（≈ 口径 = 分桶条目数；`TEST-LIFECYCLE` 两项标 unverified）。

**零处置 20 档**（零对端实施面 · 5440 行）：

- `ADVISOR-CONTEXT-BUDGET` · `MECH-DEBT-SWEEP` · `REVIEW-ATTENTION` · `ARROW-EDITING` · `TUI-OOM-ROOTCAUSE` · `ACP-CHANNEL-FIXES` · `SUBAGENT-TAIL`
- `STOP-HOOK` · `BATCH-SEGMENT-TOOL` · `NORMAL-MODE-AUDIT` · `PORTABILITY` · `REVIEW-CHAIN-GUARDS` · `TUI-SELECTION` · `HOME-EXPANSION`
- `PROVIDER-HEADERS` · `SWEEP-FOLLOWUP` · `TUI-OOM-FORENSICS` · `ABORT-PROVENANCE` · `ENG-DESIGNER` · `ENGINEERING-MODE`（20 档 ✅）

### 8.4 `requirements/` + `design/` 跨仓写痕（逐档——A/B/C 三桶 + 归档面）

**实测**（五串 `thincoder-vscode` / `VSC 仓` / `VSC 端` / `VSC 侧` / `VSC（`，另补 `VSC 对位|VSC 镜像|VSC 独有|VSC 同名`；as-of 2026-09-12）：

| 层 | 命中 / 总档 | 最重者 |
|---|---|---|
| `docs/requirements/` | **19 / 36** | `AGENT-LOOP`（32）· `ADVISOR-CONVERGENCE`（19）· `ENGINEERING-MODE`（15） |
| `docs/design/`（顶层） | **34 / 46** | `ENGINEERING-MODE`（84）· `ADVISOR-CONVERGENCE`（47）· `LEDGER-SELF-CONTAINED`（39）· `AGENT-LOOP`（33）· `TESTING`（32） |
| `docs/design/_archive/` | **21 / 53** | `MODEL-MERGE-SESSION`（28）· `STRUCTURE-DEBT-BATCH-5-6`（22）· `DOC-CLEANUP-BATCH`（19） |
| 合计（不含 `_archive`） | **53** | — |

**逐档处置（桶互斥——C 优先；同档其余命中行并入 A/B 逐条处置）**：

| 类 | 判据 | 处置 | 档数 | 逐档 |
|---|---|---|---|---|
| **A 对位声明** | 命中行全为本仓自有机制叙述里提及对端（正文引用——轴二管辖） | **零改** | 33 | requirements 16：`ADVISOR-CONVERGENCE` · `PROMPT-SYSTEM` · `PORTABILITY` · `CRASH-REPORTS` · `MEMORY` · `MULTI-INSTANCE-COLLAB` · `SESSION` · `TESTING` · `TOOLS` · `ACP-CLIENT` · `AGENT-PARAMS` · `ASYNC-RESULT-CONTAINER` · `SETTINGS-TOOL` · `STRUCTURE-DEBT` · `SUBAGENT-OBSERVE-SEND` · `TURN-CAP-CONTINUE` ｜ design 17：`SESSION` · `INSERT-AFTER` · `TURN-CAP-CONTINUE` · `ASYNC-RESULT-CONTAINER` · `CONTEXT-COMPACTION` · `CRASH-REPORTS` · `DESIGN-TOKEN-SETTLEMENT` · `EDIT-HELPERS` · `EDIT` · `RELEASE` · `APPLY-PATCH` · `HASHLINE-EDIT` · `MULTI-INSTANCE-COLLAB` · `SUBAGENT-OBSERVE-SEND` · `TOOL-OUTPUT-LIMITS` · `TUI-INPUT-BOX` · `WRITE` |
| **B 跨仓指针** | 命中行含对端路径（受影响文件表 / 证据 / 验收命令 / 档内指针） | **逐条改指本仓 / 规范形态化**（`他仓/x.md §N` → `名称（VSC 仓）§N`，目标 = 该机制的本端对位档） | 18 | requirements 2：`ENGINEERING-MODE`（2 线）· `TUI`（1 线）｜ design 16：`LEDGER-SELF-CONTAINED`（27）· `ADVISOR-CONVERGENCE`（20）· `SETTINGS-TOOL`（16）· `TESTING`（14）· `AGENT-LOOP`（9）· `PROVIDER`（8）· `TOOLS`（4）· `TUI`（2）· `PROMPT-SYSTEM`（2）· `PORTABILITY`（1）· `ACP-CLIENT`（1）· `MEMORY`（1）· `STRUCTURE-DEBT`（1）· `CONSULTATION`（1）· `ESCALATE`（1）· `QUICKFIX-BATCH-3`（1） |
| **C 托管内容** | 命中行为「对端需求落本档」类**托管声明** | **迁移**（对端需求迁本端，落对端 `docs/requirements/` 对位档；本档留本仓面） | 2 | `requirements/AGENT-LOOP`（7 线——「VSC 仓无 requirements 树 → 需求落本档」相关节 `:250` / `:300` / `:348`）· `design/ENGINEERING-MODE`（1 线） |

**归档面（`docs/design/_archive/` 21 档——复测；上轮记 17）**：

- **迁移 3**（整档属对端）：`DOC-REORG-VSC` · `DOC-REWRITE-VSC` · `TRACE-STORE-VSC` → 对端 `docs/design/_archive/`。
- **拆分 2**（含对端路径）：`PROMPT-IMPL-1-TEXT` · `CODE-HARDENING-BATCH`。
- **改指 16**（仅叙述提及）：`DOC-REORG` · `DOC-CLEANUP-BATCH` · `MAIN-DESIGN-ENHANCE` · `BATCH-4-DOC-CLEANUP` · `CLI-LINT-TUNING` · `EDIT-TOOL-EOL-DESIGN`（原 12）·
  续：`EDIT-TOOL-EOL-REQUIREMENTS` · `ENG-SESSION-PROVIDER-CLEANUP` · `INPUT-LOCK-ASYNC` · `PROMPT-ATTENTION-RESTRUCTURE-SPLIT-PLAN` · `PROMPT-IMPL-2-CODE` · `STRUCTURE-DEBT-BATCH-5-6` ·
  复测补 4：`DOC-REWRITE` · `EDIT-TOOL-IMPROVEMENT` · `MODEL-400-FIX` · `MODEL-MERGE-SESSION`（上轮漏列——均为叙述提及，零对端路径）。
- **零改 32**（零对端指涉）。计数：3+2+16+32 = **53** ✅（复测修正——上轮记 3+2+12+36）

**反向写痕（对端仓）**：对端 `docs/design/` **55 档**（顶层 `.md` 含 `README.md`；as-of 2026-09-12）中 **35 档**含本仓指涉——最重 `ADVISOR-CONVERGENCE`（61）· `AGENT-LOOP`（42）· `WEBVIEW`（39）。同属 B 类：**逐条改指本仓 / 规范形态化**（对端档内写本仓路径 → `名称（CLI 仓）§N`）。

**计数偏差登记**：上轮记 49 档（不含 `_archive`）/ 66（含）；修订轮实测 53 / 70；修正轮复测 **53 / 74**（不含 `_archive` 面两侧同值 53；含 `_archive` 面复测 21——上轮记 17，差 = 复测修正；对端仓批档 §1 记 54 为 04:26 三串口径——以本档口径为准）。口径 = 五串 `thincoder-vscode` / `VSC 仓` / `VSC 端` / `VSC 侧` / `VSC（` + 补四串；处置结论按实测分类给出，不静默改口径。

### 8.5 分期表（每期带触发条件——不以「量大」停在待议）

| 期 | 内容 | 触发条件 | 本批是否做 |
|---|---|---|---|
| **期 1** | ① 对端建完整文档体系（地图 + `docs/requirements/` 树 + 归位 + ① 6 档——§8.6）· ② 本批两侧需求 / 设计 / 批档自持 · ③ 双端提示词自持条文 · ④ 机检 L4（双端） · ⑤ 台账头部与条目改指（主 agent 落笔） · ⑥ **批档迁移 14 档 + 拆分 17 档** · ⑦ 需求 / 设计写痕逐档（§8.4）+ 归档面（迁移 3 / 拆分 2 / 改指 16） · ⑧ 互引改指（§8.7） | **本批（无条件）** | ✅ |
| **期 2** | 在飞 2 档的拆分收口（`LEDGER-SELF-CONTAINED` / `PROSE-ANCHOR-RETIRE`——对端份迁入其在位对端记录） | **触发 = 该批收口**（D5 冻结窗口解除） | ✅（触发明确，逐档点名） |

> **不做「待议」兜底**：期 1 含全部非在飞档（迁移 14 / 拆分 17 / 归档面 21）；期 2 只余**在飞 2 档**，触发 = 收口——**清单与触发均逐档点名**，无「待定」痕。

### 8.6 VSC 文档体系对位蓝图（B11——逐层 + 36 档需求对位表）

**层清单逐行**（验收交付物 = 本表逐行达成）：

| # | 层 | 本仓（CLI） | 对端现状 | 目标（验收面） |
|---|---|---|---|---|
| 1 | 仓根（非 `docs/`） | AGENTS · README · CHANGELOG · LICENSE | 同 4 档 | 保持 |
| 2 | `docs/README.md`（文档地图） | 有（243 行） | **缺** | **建**（逐层登记 + 登记规则指针） |
| 3 | `docs/TODO.md` / `TODO-archive.md` | 有 | 有 | 保持（头部改指本仓） |
| 4 | `docs/requirements/` | 36 档 | 3 档（含并行批已落 `TESTING.md`） | **对位表 36 行三值齐备**；树终态 **16 档**（§8.6 末） |
| 5 | `docs/design/` | 46 档 | 55 档 | 已自持（异名对位正常） |
| 6 | `docs/design/prompts/`（中文权威）+ `src/prompts/`（英文落地） | 各 15 档 | 各 15 档 | 双源对位保持 |
| 7 | `docs/batches/` | 53 档 | 2 档 | 新批本仓 + 存量宽口径处置（§8.3） |
| 8 | `docs/design/_archive/` | 53 档 | 12 档 | 随退役累积（本批 +5） |
| 9 | `docs/guides/` | 1 档 | 无 | **不建**（§3.7——引用可解析面 = `docs/README.md`） |
| 10 | 本仓独有档 | — | `CAPABILITY_GAP.md` · `COMPETITIVE_ANALYSIS.md` | **保留**（不得因对位而删） |

**36 档需求对位表（逐档三值）**：① 建本仓需求档 · ② 已有对位（允许异名 / 异层——注明档名）· ③ 本端无此面（写理由）。

| # | CLI 需求档 | 判 | 对端对位档（实际档名） | 归位 / 理由 |
|---|---|---|---|---|
| 1 | `ACP-CLIENT` | ③ | — | 本端不以 ACP 接入（本端即 IDE 内嵌扩展；仅 4 处遗留注释引本仓 ACP 语义） |
| 2 | `ADVISOR-CONVERGENCE` | ② | `docs/design/ADVISOR-CONVERGENCE.md` | 同名对位（机制权威档在位） |
| 3 | `AGENT-LOOP` | ② | `docs/design/AGENT-LOOP.md` | 同名对位 |
| 4 | `AGENT-PARAMS` | ② | `docs/design/AGENT-PARAMS-REQUIREMENTS.md` | **归位** → `docs/requirements/AGENT-PARAMS.md`（`-TUNING` 留 `design/` 作设计档） |
| 5 | `ASYNC-RESULT-CONTAINER` | ② | `docs/design/ASYNC-RESULT-CONTAINER.md` | 同名对位 |
| 6 | `CHECKPOINT` | ② | `docs/design/CHECKPOINT.md` | 同名对位 |
| 7 | `CONSULTATION` | ② | `docs/design/CONSULTATION.md` | 同名对位 |
| 8 | `CONTEXT-COMPACTION` | ② | `docs/design/CONTEXT-COMPACTION.md` | 同名对位 |
| 9 | `CRASH-REPORTS` | ③ | — | 本端无崩溃取证面（`crash*.mjs` 零命中；无 `process.report` / 未捕获异常捕获） |
| 10 | `DESIGN-TOKEN-SETTLEMENT` | ② | `docs/design/DESIGN-TOKEN-SETTLEMENT.md` | 同名对位 |
| 11 | `ENG-TOKEN-BINDING` | ② | `docs/design/ENG-TOKEN-BINDING-REQUIREMENTS.md` | **归位** → `docs/requirements/ENG-TOKEN-BINDING.md` |
| 12 | `ENGINEERING-MODE` | ② | `docs/requirements/ENGINEERING-MODE.md` | 已在位（本批首建） |
| 13 | `ESCALATE` | ② | `docs/design/ESCALATE.md` | 同名对位 |
| 14 | `FEATURES` | ② | `docs/design/REQUIREMENTS.md` §「v1 功能范围」 | **归位（拆出）** → `docs/requirements/FEATURES.md` |
| 15 | `LOGGING` | **①** | — | 机制在位（`src/log.mjs`）无档——须建；`src/log.mjs:2` 悬空指针随改指本端 |
| 16 | `MCP` | ② | `docs/design/MCP.md` | 同名对位 |
| 17 | `MEMORY` | ② | `docs/design/MEMORY.md` | 同名对位 |
| 18 | `MULTI-INSTANCE-COLLAB` | **①** | — | 机制在位（`src/extension/peer-instances.mjs`）无档——须建 |
| 19 | `NORMAL-MODE` | **①** | — | 机制在位（提示词装配层）无档——须建 |
| 20 | `PHILOSOPHY` | ② | `docs/design/PHILOSOPHY.md` | **归位** → `docs/requirements/PHILOSOPHY.md`（价值层需求） |
| 21 | `PORTABILITY` | ② | `docs/design/PORTABILITY.md` | 对位档在位（未登记进设计地图——随 §8.6 层 5 登记） |
| 22 | `PROJECT` | ② | `docs/design/REQUIREMENTS.md` | **归位（异名）** → `docs/requirements/PROJECT.md` |
| 23 | `PROMPT-SYSTEM` | ② | `docs/design/VSC-PROMPTS.md` + `docs/design/prompts/` 15 档 | **异名对位**（提示词双源权威） |
| 24 | `RELEASE` | ② | `docs/design/RELEASE.md` | 同名对位 |
| 25 | `SEND-STALL-DISTILL` | ② | `docs/design/SEND-STALL-DISTILL-REQUIREMENTS.md` | **归位** → `docs/requirements/SEND-STALL-DISTILL.md` |
| 26 | `SESSION` | ② | `docs/design/SESSION.md` | 同名对位 |
| 27 | `SETTINGS-TOOL` | **①** | — | 机制在位（`src/agent-tools/settings.mjs`）；部分承载 = `docs/design/TOOLS.md` §5——须建独立需求档 |
| 28 | `STRUCTURE-DEBT` | **①** | — | 本端结构债登记面缺失（`scripts/` 无行数检查器实跑面）——须建 |
| 29 | `SUBAGENT-OBSERVE-SEND` | ② | `docs/design/SUBAGENT-OBSERVE-SEND.md` | 同名对位 |
| 30 | `TESTING` | ② | `docs/requirements/TESTING.md`（设计档 `docs/design/TESTING.md` 在位） | 已在位（并行批已落位——as-built） |
| 31 | `TOOL-OUTPUT-LIMITS` | ② | `docs/design/TOOL-OUTPUT-LIMITS-REQUIREMENTS.md` | **归位** → `docs/requirements/TOOL-OUTPUT-LIMITS.md` |
| 32 | `TOOLS` | ② | `docs/design/TOOLS.md` + 编辑族单档 6 | 同名对位 |
| 33 | `TUI` | ② | `docs/design/WEBVIEW.md` | **异名对位**（本端 UI 面 = webview；端差已登记） |
| 34 | `TUI-TOOL-OUTPUT` | ② | `docs/design/WEBVIEW.md` | **异名对位**（呈现面 = webview 工具卡；TUI 行间区块机制本端无——端差登记） |
| 35 | `TURN-CAP-CONTINUE` | ② | `docs/design/TURN-CAP-CONTINUE.md` | 同名对位 |
| 36 | `VERIFY-REDESIGN` | **①** | — | 机制在位（`src/agent-tools/verify.mjs`）；部分承载 = `docs/design/AGENT-LOOP.md` §verify guard——须建 |

**三值计数**：① **6**（#15 · #18 · #19 · #27 · #28 · #36）· ② **28** · ③ **2**（#1 · #9）→ 6+28+2 = **36** ✅

**对端 `docs/requirements/` 树终态 = 16 档**：

- 在位 3：`README` · `ENGINEERING-MODE` · `TESTING`（`TESTING` 由并行批落位——as-built）。
- 归位 6：`AGENT-PARAMS` · `ENG-TOKEN-BINDING` · `SEND-STALL-DISTILL` · `TOOL-OUTPUT-LIMITS` · `PROJECT` · `PHILOSOPHY`。
- 拆出 1：`FEATURES`。
- ① 新建 6：`LOGGING` · `MULTI-INSTANCE-COLLAB` · `NORMAL-MODE` · `SETTINGS-TOOL` · `STRUCTURE-DEBT` · `VERIFY-REDESIGN`（3+6+1+6 = **16** ✅）

**② 分桶（28 = 归位 6 + 拆出 1 + 已在位 2 + 异名 / 异层对位 19——与对端侧同口径）**：已在位 2 = `ENGINEERING-MODE` · `TESTING`；异名 / 异层对位 19 = 上表 ② 行中住 `docs/design/` 的对位档（`TESTING` 升入已在位——as-built 对齐）。

**归位规则**（对端 `docs/requirements/` 目标形态）：

1. **需求档住 `docs/requirements/`、设计档住 `docs/design/`**（与 CLI 同构两分）。
2. **纯需求档住错层 → 归位迁入 `docs/requirements/`**：四个 `-REQUIREMENTS.md`（去后缀）+ `REQUIREMENTS.md`（→ `PROJECT.md`）+ `PHILOSOPHY.md`；对应 `-TUNING.md` 4 档留 `docs/design/`（设计 / 调参面，零改）。
3. **设计档（含异名对位档）不迁层**：该档是本端该机制的**唯一权威档**（如 `WEBVIEW.md` 之于 UI 面、`VSC-PROMPTS.md` 之于提示词面）——迁层 = 制造单机制双源（违 D2）。
4. **本仓独有档原位保留**：`CAPABILITY_GAP.md` · `COMPETITIVE_ANALYSIS.md`（不在 36 行表内——它们是本端增量，非对位产物）。

### 8.7 批档互引 / 引用面（B12）

**实测**：批档互引 = **79 处引用 / 31 档**（其中 **14 处**指向 8 个**迁移档**——来自 9 档引用方）；引用台账档 = 49 档 / 252 处（其中对端台账引用 1 处 = `POOL-LEDGER:189`，随该档拆分改指）。

| 面 | 处置 | 判据 |
|---|---|---|
| 指向**迁移档**的引用（14 处 / 引用方 9 档：`ADVISOR-CONTEXT-BUDGET` · `MECH-DEBT-SWEEP` · `POOL-LEDGER` · `VSC-CONTEXT-PARITY` · `SWEEP-FOLLOWUP` ×2 · `VSC-INDEX-PERCEPTION` · `TUI-OOM-ROOTCAUSE` ×2 · `VSC-CHILD-PERMISSION` · `VSC-ACTIVITY-CLOSURE` · `TEST-DISCIPLINE-PROMPTS` · `TUI-OOM-FORENSICS`） | **逐条改指**为 `名称（VSC 仓）§N`（迁移轮同批执行——零悬空） | 迁移后本仓不存在该档 → 不改指即悬空 |
| 指向**拆分档**的引用 | **按被引条目仓属改指**：引对端份条目 → 对端新档（`名称（VSC 仓）§N`）；引本仓份 → 留本仓 | 拆分 = 条目级分仓 |
| 指向**零处置档 / 本仓档**的引用 | **零改** | 档未动 |
| 引用**对端台账**（1 处） | 随 `POOL-LEDGER` 拆分改指本端台账 | 台账射程（F1） |

### 8.8 P3 承接（对齐轮映射——VSC 两已收口批机检违规）

**「对齐轮」所指**：本批对**已收口批遗留机检违规**的**当期统一对齐处置面**——即 P1′ 宽口径迁移 + 引用改指的批内一次落地（**不另起批、不后延**；词源 = 批次档 §1 P3 裁定）。

**违规清单**（as-of 2026-09-12 实测——本仓 `node scripts/check-doc-width.mjs`）：

| 档 | 条数 | 形态（本仓判） | 消解机制（随迁移轮） |
|---|---|---|---|
| `2026-09-12-VSC-ACTIVITY-CLOSURE` | 6 | 5 段引用形态（对端 `WEBVIEW` 档 §12 / §7.2 / §14.6 ×2 / §14.7——unknown-doc）+ 1 计数不符（`:274`） | 迁移入对端仓 → 段引用成对端本地引用（节号对端实测在位）；计数按「计数与列表同改」核正 |
| `2026-09-12-VSC-CHILD-PERMISSION` | 1 | 悬空自指（「本档 §8」——该档 §1–§6 无 §8） | 迁移入对端仓同批改指实际节号（悬空形态零残留） |

**条目 / 验收映射**：承接条目 = B10 · B12；验收 = AC-LS16 · AC-LS18 · AC-LS12（批级「新增一致性违规 0」——迁移轮落地后复跑，该 7 条零命中）；用例 = T-LS16 · T-LS17。

**归属与范围外**：两档均在本档 §8.3 迁移 14 档清单内（编号 13 / 14）。本仓另有第 8 条新违规（`2026-09-12-PROSE-ANCHOR-RETIRE` 计数不符）——属并行批自身面，归其链，不并入本批。

## 9. 受影响文件清单（当前行数 + 预计增量）

> 权威指示：本表与批次档 §2 的受影响文件表同文重复——**以本表为准**（设计档 = 单一权威源；批档 §2 表为落档时快照）。

| # | 文件 | 当前行数 | 预计增量 | 动作 |
|---|---|---|---|---|
| 1 | `docs/requirements/ENGINEERING-MODE.md` | 912 | — | §1.19（修订轮新增 F9/F10 + F4 加强 + 判定句区间改指） |
| 2 | `docs/design/LEDGER-SELF-CONTAINED.md` | **731**（修正轮终值） | — | 本档（初版 470 → 修订轮 +207 → 修正轮 +54） |
| 3 | `src/prompts/discipline-engineering.md` | 230（as-built——并行批 +1） | +30±10 | §6.1 改写 / §6.3 / §6.2 新节 |
| 4 | `docs/design/prompts/discipline-engineering.md` | 159（as-built——并行批 +1） | +18±6 | §6.1 / §6.2（无 A1 节——见注） |
| 5 | `src/prompts/discipline-normal.md` | 181 | +12±4 | §6.2 条 3 / 条 4 |
| 6 | `scripts/check-ledger.mjs` | 248 | +80±20 | 新增 L4 + 本仓基根解析；`DEFAULT_LEDGERS` 去对端项 |
| 7 | `test/ledger.test.mjs` | 176 | +60±20 | L4 正常 / 边界 / 反证用例 |
| 8 | `test/fixtures/ledger-baseline.json` | 13 | +1..+3 | L4 存量条目 |
| 9 | `test/prompts-async-guidance.test.mjs`（CLI） | **169**（as-built 核对——并行批先落） | **±0** | 本批零改（A1 ④ 断言已随散文锚退役删除——与对端同形态；拆分不受影响） |
| 10 | `docs/TODO.md` | 25 | ±0 | 主 agent 落笔（记录 + 状态推进） |
| 11 | `docs/TODO-archive.md` | 162 | −13 行 + 注记 | **9 线迁对端 + 4 线拆分**（§8.2；落笔归主 agent——不再整体冻结） |
| 12 | `docs/README.md` | 243 | +6±3 | §3.7 / §3.8 补自持与互引规范句 |
| 13 | `docs/design/ENGINEERING-MODE.md` | 2627 | +45±15 | §2.31 新增（本批设计面登记）+ §2.9 锚#8 A1 ④ 引文同步 |
| 14 | `docs/requirements/README.md`（VSC 仓） | **已落 51** | +60±20 | 本端需求档地图与登记规则 + 36 档对位表登记（修正轮终值） |
| 15 | `docs/requirements/ENGINEERING-MODE.md`（VSC 仓） | **已落 67** | +40±20 | 本端工程模式自持需求（F1–F10 / N1–N5；修正轮终值） |
| 16 | `docs/design/LEDGER-SELF-CONTAINED.md`（VSC 仓） | **已落 564**（as-built 实测） | — | 对端设计档 |
| 17 | `src/prompts/discipline-engineering.md`（VSC 仓） | 242（as-built——并行批 +1） | +30±10 | §6.1 / §6.2 / §6.3 |
| 18 | `docs/design/prompts/discipline-engineering.md`（VSC 仓） | 165（as-built——并行批 +1） | +18±6 | §6.1 / §6.2 |
| 19 | `src/prompts/discipline-normal.md`（VSC 仓） | 194 | +12±4 | §6.2 条 3 / 条 4 |
| 20 | `thincoder-vscode/scripts/check-ledger.mjs` | **新建** | 0→~230 | 本端台账检查器（L1–L4 语义同源、独立实现） |
| 21 | `thincoder-vscode/test/ledger-check.test.mjs` | **新建** | 0→~120 | 本端检查器用例 |
| 22 | `thincoder-vscode/test/fixtures/ledger-baseline.json` | **新建** | 0→~10 | 本端基线（首跑固化） |
| 23 | `thincoder-vscode/test/files.mjs` | 79 | +1 | 新测试档登记 ×1（`ledger-check`——清单制；拆分新档经 as-built 核对不建） |
| 24 | `thincoder-vscode/test/prompts-async-guidance.test.mjs` | **177**（as-built 核对——并行批先落） | **±0** | 本批零改（A1 ④ 断言已随散文锚退役删除；拆分不适用——≤500 内） |
| 25 | `docs/TODO.md`（VSC 仓） | 19 | ±0 | 主 agent 落笔（头部改指本仓） |
| 26 | `docs/TODO-archive.md`（VSC 仓） | 48 | −5 行 + 注记 | 头部改指本仓（§8.2 #7）；归档 3 条逐条改指（#8）+ 1 行改写（#9）——不再整体冻结 |
| 27 | `docs/design/README.md`（VSC 仓） | 132 | +8±4 | 板块登记（LEDGER-SELF-CONTAINED）+ 变更记录一行 |
| 28 | `docs/batches/2026-09-12-LEDGER-SELF-CONTAINED.md`（VSC 仓） | — | — | **父侧另派绑定**（设计者不跨档写 §2） |
| 29 | `docs/README.md`（VSC 仓） | **新建** | 0→~130 | 文档地图（§8.6 层清单十行逐行登记） |
| 30 | `docs/requirements/AGENT-PARAMS.md`（VSC 仓） | **归位**（原 `docs/design/AGENT-PARAMS-REQUIREMENTS.md` 41 行） | ±0 + 头注 | 二值 ②·归位（`-TUNING` 114 行留 `docs/design/`） |
| 31 | `docs/requirements/ENG-TOKEN-BINDING.md`（VSC 仓） | **归位**（原 47 行档） | ±0 + 头注 | 二值 ②·归位（`-TUNING` 115 行留原位） |
| 32 | `docs/requirements/SEND-STALL-DISTILL.md`（VSC 仓） | **归位**（原 39 行档） | ±0 + 头注 | 二值 ②·归位（`-TUNING` 137 行留原位） |
| 33 | `docs/requirements/TOOL-OUTPUT-LIMITS.md`（VSC 仓） | **归位**（原 46 行档） | ±0 + 头注 | 二值 ②·归位（`-TUNING` 139 行留原位） |
| 34 | `docs/requirements/PROJECT.md`（VSC 仓） | **归位**（原 `docs/design/REQUIREMENTS.md` 129 行） | ±0（去 v1 功能范围节） | 二值 ②·归位异名 |
| 35 | `docs/requirements/FEATURES.md`（VSC 仓） | **新建（拆出）** | 0→~45 | 自 `REQUIREMENTS.md` §v1 功能范围 拆出 |
| 36 | `docs/requirements/PHILOSOPHY.md`（VSC 仓） | **归位**（原 `docs/design/PHILOSOPHY.md` 135 行） | ±0 | 二值 ②·归位（价值层需求） |
| 37 | `docs/requirements/LOGGING.md`（VSC 仓） | **新建（①）** | 0→~60 | 机制在位（`src/log.mjs`）无档——兼清 `src/log.mjs:2` 悬空指针 |
| 38 | `docs/requirements/MULTI-INSTANCE-COLLAB.md`（VSC 仓） | **新建（①）** | 0→~60 | 机制在位（`src/extension/peer-instances.mjs`）无档 |
| 39 | `docs/requirements/NORMAL-MODE.md`（VSC 仓） | **新建（①）** | 0→~70 | 机制在位（提示词装配层）无档 |
| 40 | `docs/requirements/SETTINGS-TOOL.md`（VSC 仓） | **新建（①）** | 0→~70 | 机制在位（`src/agent-tools/settings.mjs`）；部分承载 = `docs/design/TOOLS.md` §5 |
| 41 | `docs/requirements/STRUCTURE-DEBT.md`（VSC 仓） | **新建（①）** | 0→~60 | 本端结构债登记面缺失 |
| 42 | `docs/requirements/VERIFY-REDESIGN.md`（VSC 仓） | **新建（①）** | 0→~60 | 机制在位（`src/agent-tools/verify.mjs`）无档 |
| 43 | `thincoder-vscode/docs/batches/`（迁移 **14** 档） | 迁入 4234 行（含 10 行折行） | ±0 | §8.3 迁移表逐档 |
| 44 | `thincoder-vscode/docs/batches/`（拆分 **17** 档新档·本批） | 新建 | 0→≈168 条目 | §8.3 拆分表对端份 |
| 45 | `thincoder-vscode/docs/design/_archive/`（迁移 3 档） | 迁入 223 行 | ±0 | `DOC-REORG-VSC` 90 · `DOC-REWRITE-VSC` 74 · `TRACE-STORE-VSC` 59 |
| 46 | `thincoder/docs/batches/`（本仓） | −14 档（迁移）· 17 档改（拆分本仓份） | −4234 行净 | 本仓侧保留 + 档首搬迁注记（17 处） |
| 47 | `thincoder/docs/design/_archive/`（拆分 2 / 改指 16） | 53 档层内 | ±0~±20 | §8.4 归档面 |
| 48 | B 类改指面（本仓 18 档 + 对端反向 35 档） | 行数 ±0 | ±0 | 逐条规范形态化（D4） |
| 49 | `docs/design/prompts/discipline-normal.md` | 184 | +10±4 | §6.2 条 3 / 条 4（CN 镜像面——修正轮纳入） |
| 50 | `docs/design/prompts/discipline-normal.md`（VSC 仓） | 184 | +10±4 | 同上（本端原文自持） |
| 51 | `thincoder-vscode/test/prompts-carryover-anchors.test.mjs` | — | **不建** | as-built 核对：拆分面经并行批先落消解（余档 177 ≤500——拆分不适用） |

**拆分 / 档位结论**：

| 文件 | 结论 |
|---|---|
| `scripts/check-ledger.mjs` 248 → ~328 | ≤500 硬限内；**不拆**（单档单职责——台账机检）。触发再拆 = 超过 400 行 |
| `thincoder-vscode/scripts/check-ledger.mjs` 新建 ~230 | 同形；≤500 |
| `test/prompts-async-guidance.test.mjs`（CLI——as-built **169**） | as-built 核对：A1 ④ 断言已随散文锚退役删除（与对端同形态）——本批该档零改；拆分不适用 |
| `thincoder-vscode/test/prompts-async-guidance.test.mjs`（as-built **177**） | 设计期 535 越 500 **硬限**（修正轮更正：「软线」系误标——500 = AGENTS.md blocking 线，**无豁免通道**）——**as-built 核对：并行批先落（散文锚退役后 177 ≤500）；本批零改、拆分不适用** |
| （原拟 `test/prompts-carryover-anchors.test.mjs`） | **不建**——as-built：拆分对象已不存在（余档 177）；`test/files.mjs` 登记 **+1** = `ledger-check` |
| `docs/design/ENGINEERING-MODE.md` 2627 | 单档大盘（既有形态）——本批 +45 不触新档位；**拆分计划**：若再增厚触发「按 §2 批次段切分」专项 |

**测试档拆分方案（评审轮次 1 #1；先例 = 第 13 批 D-2）——【as-built 核对：不执行】**：

> 并行批先落——该档实测 177 行（≤500）；下方方案与用例守恒式（49 = 42 + 7）为设计期基线，留档备查；本批该档零改、不建新档。**作废理由** = 并行批 `PROSE-ANCHOR-RETIRE` 先行实施落树，该档已回落 500 内（实测 177）——拆分对象已不存在。**前置条件失效条款**（照抄对端侧同条款）：若该批实施被回退致该档回越 500 行 → **停手上报**（父侧重裁拆分面）——不自行拆分。

| # | 拆法 | 移动量 | 结论 |
|---|---|---|---|
| ① | 迁出「跨批带入锚组（第 9 批锚 T-RO1–T-RO6 + 语料修复 T-PC-1–T-PC-3）」——`:409`–EOF | 127 行 / 7 例 | **选定**——档尾整段、切点零交叉；余档 ≈408、新档 ≈150，两档余量充足 |
| ② | 迁出「装配矩阵 + 降级链运行时组」（§3.2 / §3.4） | 108 行 / 9 例 | **否决**——`engMode` 等基建两面共用更多；余档余量较小（≈427） |

契约：新档 `test/prompts-carryover-anchors.test.mjs` 头部自持（imports + `read` 助手 + 所需语料读取 + 常量）——**零跨档 import**；7 例逐字搬移（断言零改 / 零增 / 零删）；原档头注不改、新档自带头注；登记入对端 `test/files.mjs`（显式清单制）。
用例数守恒：**49 = 42（余档）+ 7（新档）**——as-of 2026-09-12 实测；增删须同步。
CLI 同侧：`test/prompts-async-guidance.test.mjs` **169 行零改**（as-built 核对——A1 ④ 断言已随散文锚退役删除，与对端同形态；无测试断言面）。

**注（A1 不在中文镜像档）**：`docs/design/prompts/discipline-engineering.md` 两仓两档（CLI `:57→:66→:75` · VSC 同形）**不含「设计行为纪律四维」节**（即无 A1 checklist）——故 §6.3 只落 `src/prompts/*` 两档（两档测试断言已随散文锚退役删除——as-built 核对；与对端同形态）。差异如实登记，不静默。

## 10. 用例表（正常 / 边界 / 错误）

> 映射列 B1–B12；T-LS1–T-LS14 = 初版面，T-LS15–T-LS26 = 修订轮面（迁移 / 拆分 / 对位 / 指针），T-LS27–T-LS29 = 修正轮面（改指 / 托管 / 归档 / VSC 测试档拆分）。

| # | 场景 | 输入 | 预期输出 | 映射 |
|---|---|---|---|---|
| T-LS1 | 正常：本仓指针全解析 | 台账条 `→ 需求 docs/requirements/ENGINEERING-MODE.md §1.19 · 任务书 docs/batches/2026-09-12-LEDGER-SELF-CONTAINED.md §2` | 零 `[L4]`；退出码 0 | B4 / AC-LS1 |
| T-LS2 | **错误：跨仓证据路径**（事故形态反证） | 台账条 `→ 证据 ../thincoder-vscode/src/x.mjs:10`（本仓根内不存在） | `[L4]` + 退出码 1 | B1 / B4 / AC-LS2 |
| T-LS3 | **错误：跨仓指针**（对端同名档存在） | 台账条 `→ 需求 docs/requirements/AGENT-LOOP.md §9`，本仓有该档但**节号不存在**；对端仓有且存在 | 本仓基根解析失败 ⇒ `[L4]`（**不因对端可解析而放行**） | B1 / AC-LS2 |
| T-LS4 | 边界：零假阳面 | 台账条含「与对端同名档对应（多实现面纪律）」散文 + `WEBVIEW（VSC 仓）§5` 规范形态 | **零 `[L4]`** | B4 / AC-LS3 |
| T-LS5 | 边界：存量分流 | 基线内含某跨仓条目 | 该条**降报告不阻断**；删基线键后 ⇒ 阻断 | B4 / AC-LS4 |
| T-LS6 | 正常：对端检查器同规 | 对端 `node scripts/check-ledger.mjs`（对端台账） | 每档一行 `OK`；零 `[L4]`；退出码 0 | B4 / B2 / AC-LS5 |
| T-LS7 | 正常：提示词通用化（绑死清零） | grep 双端 `discipline-engineering.md`：`双端镜像` / `CLI/VSC` / `乒乓振荡——已实证` / `VSC R14 池规则段` / `2026-09-09 修订` | **全部零命中**；`多端镜像` / `正交验四维` 子串在位 | B9 / AC-LS6 |
| T-LS8 | 正常：核验职责条文在位 | grep 双端 `discipline-engineering.md` | 含核验四维子串 + 「主 agent 有义务核验各份逻辑是否一致」 | B8 / AC-LS7 |
| T-LS9 | 正常：自持条文在位 | grep 双端 `discipline-engineering.md` | 五条子串全中（台账只收本仓 / 批次档同规 / 各仓自持 / 缺的层补齐 / 头部自持） | B3 / AC-LS8 |
| T-LS10 | 边界：normal 覆盖面 | grep `discipline-normal.md`（双端——`src/` + `docs/design/prompts/` 双源） | 含「缺的层必须补齐」子串；**不含**「台账只收本仓」（不可达场景不写纪律） | B3 / D7 / AC-LS8 |
| T-LS11 | 边界：A1 ④ 通用化 | grep 双端 `src/prompts/discipline-engineering.md` | 含 `④ 核多实现面镜像面`；`核双端对位面` 零命中 | B9 / AC-LS9 |
| T-LS12 | 正常：对端自持树在位 | 目录判据 + 档判据（对端仓） | `docs/requirements/README.md` 与 `ENGINEERING-MODE.md` 存在且非空 | B2 / AC-LS10 |
| T-LS13 | 正常：本仓检查器不扫对端 | `scripts/check-ledger.mjs` `DEFAULT_LEDGERS` | 不含 `thincoder-vscode` 项；扫本仓两档 | B1 / D5 / AC-LS11 |
| T-LS14 | 正常：批级门 | 两仓 `node scripts/check-doc-width.mjs` + 两仓快层 | 新增超宽 0 + 新增一致性违规 0；两仓快层全绿 | AC-LS12 |
| T-LS15 | 正常：批档宽口径清单齐备 | 设计档 §8.3 迁移表 14 行 + 拆分表 19 行 + 零处置 20 档 | 14+19+20 = 53；行数 4234+7017+5440 = 16691 | B10 / AC-LS15 |
| T-LS16 | 正常：迁移落地 | 对端批档目录 14 档存在 / 本仓 14 档不存在 | 双向断言全中 | B10 / AC-LS16 |
| T-LS17 | **错误：迁移后悬空引用**（反证） | grep 本仓批档：`batches/<迁移档名>.md` 形态 | 零命中（14 条引用已改指 `X（VSC 仓）§N`） | B12 / AC-LS16 |
| T-LS18 | 正常：拆分落地 | 19 档：对端承载档在位 + 本仓档首搬迁注记 | 注记子串全中；条目计数与 §8.3 一致 | B10 / AC-LS17 |
| T-LS19 | 边界：迁移档宽度合规 | 对端 `node scripts/check-doc-width.mjs` | 新增超宽 0（10 行已折行）；退出码 0 | B10 / AC-LS18 |
| T-LS20 | 正常：需求对位表三值齐备 | 设计档 §8.6 对位表 | 36 行；① 6 / ② 28 / ③ 2；② 行档名逐行存在 | B11 / AC-LS19 |
| T-LS21 | 正常：对端需求树终态 | 对端 `docs/requirements/` 目录判据 | **16 档在位**（README + 在位 2 + 归位 6 + 拆出 1 + ① 6——`TESTING` 并行批已落位） | B11 / AC-LS19 |
| T-LS22 | 正常：归位落地 | 6 档目标路径存在 + 原路径不存在；`-TUNING` 4 档留 `docs/design/` | 双向断言全中 | B11 / AC-LS21 |
| T-LS23 | 正常：文档地图建成 | 对端 `docs/README.md` 存在 | 层清单十行逐行登记（含 guides「不建 + 理由」） | B11 / AC-LS20 |
| T-LS24 | 边界：guides 不建登记 | 对端 `docs/guides/` | 目录不存在 + 地图内「不建」行在位 | B11 / AC-LS20 |
| T-LS25 | 正常：台账指针宽口径处置 | CLI 归档 14 线 / VSC 侧（头部 2 + 归档 3 + 改写 1 + 活档 2） | 分类计数 9+4+1 = 14；目标档逐条存在 | B12 / AC-LS22 |
| T-LS26 | **错误：豁免残留**（反证） | grep 设计档 §8 + 批次档 §2 处置值 | 零「就地保留 / 待议 / 豁免」表述 | B10 / AC-LS23 |
| T-LS27 | 正常：B 类改指 / C 类托管落地 | 本仓 B 类 18 档 + 归档改指 16 档 grep 对端 `.md` 路径形态；C 类 2 处（`requirements/AGENT-LOOP` 7 线 · `design/ENGINEERING-MODE` 1 线） | 残留零命中；改指 `名称（VSC 仓）§N` 目标可解析；本档零「对端需求落本档」托管句 | B12 / AC-LS24 |
| T-LS28 | 正常：归档面落地 | `docs/design/_archive/`：迁移 3 档对端在位 / 本仓不存在；拆分 2 档；改指 16 档 | 双向断言全中；残留零命中 | B10 / AC-LS25 |
| T-LS29 | 正常：测试档面 as-built（跨端面） | 对端 `test/prompts-async-guidance.test.mjs` 实测行数 + `test/files.mjs` 登记 + 对端 `node test/run-fast.mjs` | **177 ≤500**（并行批先落——拆分不适用；存量测试档零改）；登记 **+1**（`ledger-check`）；快层全绿 | B9 / AC-LS26 |

## 11. 验收标准（逐条回指 R1–R9 + P1′ + P2′）

> AC-LS1–AC-LS14 = 初版面；AC-LS15–AC-LS23 = 修订轮面（宽口径存量 / 对位覆盖 / 无豁免判据）；AC-LS24–AC-LS26 = 修正轮面（改指 / 托管 / 归档 / VSC 测试档拆分）。

| # | 验收标准（可机器验证） | 回指 |
|---|---|---|
| AC-LS1 | `check-ledger.mjs` 新增 L4 后，本仓两档台账零新增 `[L4]`（**新增**口径 = 批前/批后命中集合差） | B4 |
| AC-LS2 | 合成跨仓条目（T-LS2 / T-LS3 输入）⇒ `[L4]` 报红 + 退出码 1（反证非空转） | B1 · B4 |
| AC-LS3 | 零假阳：T-LS4 输入 ⇒ 零 `[L4]`（散文 + 规范形态不入判据） | B4 |
| AC-LS4 | 存量分流：基线内条目降报告（退出码 0）；删键 ⇒ 阻断 | B4 |
| AC-LS5 | 对端 `node scripts/check-ledger.mjs` 实跑：本端台账零 `[L4]`、退出码 0；基线档存在 | B2 · B4 |
| AC-LS6 | 双端 `discipline-engineering.md` 绑死串零命中（`双端镜像` / `CLI/VSC` / `乒乓振荡——已实证` / `VSC R14 池规则段` / `2026-09-09 修订`）；`多端镜像` 在位 | B9 |
| AC-LS7 | 双端 `discipline-engineering.md` 含核验职责条文（核验四维 + 主 agent 义务句） | B8 |
| AC-LS8 | 双端 `discipline-engineering.md` 含五条自持子串；双端 `discipline-normal.md`（`src/` 与 `docs/design/prompts/` 双源镜像）含「缺的层必须补齐」且**不含**「台账只收本仓」 | B3 |
| AC-LS9 | 双端 `src/prompts/discipline-engineering.md` 含 `④ 核多实现面镜像面`；`核双端对位面` 零命中 | B9 |
| AC-LS10 | 对端 `docs/requirements/README.md` + `ENGINEERING-MODE.md` 存在且非空 | B2 |
| AC-LS11 | `scripts/check-ledger.mjs` 的 `DEFAULT_LEDGERS` 零对端仓项 | B1 |
| AC-LS12 | 两仓 `node scripts/check-doc-width.mjs` 新增超宽 0 + 新增一致性违规 0；两仓快层全绿；CLI `test:full` + `test:integration` 三门全绿 | 设计约束 4 |
| AC-LS13 | 本设计档 §8 清单与批次档 §2 条目一一对应（三方条目一致：B1–B12 = AC 回指 = 需求档 F/N；D3 计数与列表同改） | B6 · B7 |
| AC-LS14 | **否决维持**：本设计档与批次档 §2 零「以对端无自持档为由放行跨仓指针」表述（R5 在案） | B5 |
| AC-LS15 | 批档宽口径清单齐备且计数自洽：迁移 14 + 拆分 19 + 零处置 20 = 53；行数 4234+7017+5440 = 16691（可机判：清单行数 + 分类计数） | B10 |
| AC-LS16 | 迁移面落地：14 档在对端仓存在 / 在本仓不存在；本仓零 `batches/<迁移档名>.md` 形态引用（14 条已改指规范形态） | B10 · B12 |
| AC-LS17 | 拆分面落地：19 档逐档对端承载档在位 + 本仓档首搬迁注记在位（含移出条目清单） | B10 |
| AC-LS18 | 迁移档在对端仓宽度合规：对端 `check-doc-width.mjs` 新增超宽 0、新增一致性违规 0（10 行已折行） | B10 |
| AC-LS19 | 需求对位覆盖率：36 行三值齐备（① 6 / ② 28 / ③ 2——② 分桶 = 归位 6 + 拆出 1 + 已在位 2 + 异名 / 异层对位 19）；② 行对位档名逐行可解析；③ 行理由在位；对端 `docs/requirements/` 终态 **16 档**（15 档蓝图 + `TESTING`——并行批已落位） | B11 |
| AC-LS20 | 对端文档地图建成：`docs/README.md`（VSC 仓） 存在且层清单十行逐行登记（含 guides「不建 + 理由」、**对端**独有档保留） | B11 |
| AC-LS21 | 归位落地：6 档在 `docs/requirements/` 在位 + 原路径不存在；4 个 `-TUNING.md` 留 `docs/design/` 零改 | B11 |
| AC-LS22 | 指针与互引存量：台账逐条处置（CLI 归档 9 迁移 / 4 拆分 / 1 零改；VSC 改指 5 处 + 改写 1 行）；指向迁移档的 14 条批档互引已改指 | B12 |
| AC-LS23 | **无豁免判据**：设计档 §8 与批次档 §2 处置值域 = {迁移, 拆分, 零处置}——零「就地保留 / 待议 / 豁免」表述 | B10 · B12 |
| AC-LS24 | B 类改指 / C 类托管落地：本仓 18 档 + 归档改指 16 档内对端 `.md` 路径形态零残留、改指目标可解析；C 类 2 处（`requirements/AGENT-LOOP` 7 线 · `design/ENGINEERING-MODE` 1 线）迁移落地 + 本档零托管句 | B12 |
| AC-LS25 | 归档面落地：迁移 3 档在对端 `docs/design/_archive/` 在位 + 本仓不存在；拆分 2 档落地；改指 16 档形态化零残留 | B10 |
| AC-LS26 | 测试档面 as-built（跨端面）：`prompts-async-guidance` 对端 **177** / CLI **169** 均 ≤500（并行批先落——拆分不适用；存量测试档零改）；`test/ledger-check.test.mjs` 零跨仓 import + 登记入对端 `test/files.mjs`（**+1**）+ 对端快层全绿 | B9 |

> **AC-LS12 归属注（修正轮——评审轮次 1 #8）**：两仓「新增一致性违规」口径 = 批前 / 批后命中集合差。VSC 仓复跑现 2 条（as-of 2026-09-12）= 两档 VSC 侧批次记录的 V3「§3 缺工具写入的轮次行」——成因 = §4 骨架含 `---` 分隔行被 V3 判为实文 + §3 未写入（在飞瞬态）；**归属 = 评审写入时序 + 骨架占位标点**，非本批设计内容引入。
> **消解路径（可机判）**：对应记录 §3 获工具写入的轮次行（`### 轮次 N（评审子代理）`）时自消——复跑归零；或骨架占位收紧（去 `---` 分隔行）同消。复核时点 = 两侧记录 §3 写入后。

## 12. 边界（本设计不做）

- ✅ **本批做**存量处置：批档迁移 14 / 拆分 17 · 归档面 21 · 需求设计写痕逐档 · 互引改指 · 对端文档体系建树（§8.3–§8.6）。
- ❌ 不做**在飞 2 档**（`LEDGER-SELF-CONTAINED` / `PROSE-ANCHOR-RETIRE`）的搬迁——受 D5 冻结窗口约束，触发 = 该批收口（§8.5 期 2）。
- ❌ 不做**跨仓历史重写**（`git filter-repo` / `git subtree`）——两仓独立、改写公开历史风险不可控（§5 D9）。
- ❌ 不做 36 档**物理复制**入对端需求档（违「非复制」——D12）；不建 `docs/guides/`（§3.7）。
- ❌ 不改 `check-ledger.mjs` 既有 L1–L3 判据语义；不改 `check-doc-width.mjs` / `doc-consistency` 既有判据。
- ❌ 不改两仓归档档的**非对端条目**（对端面条目按 §8.2 #2 / §8.4 归档面处置——不再整体冻结）。
- ❌ 不动并行批 `PROSE-ANCHOR-RETIRE` 的**在飞面**（仅登记文件域冲突面——D8；其拆分收口随该批收口执行，§8.5 期 2）。
- ❌ 不做台账物理落笔 / checklist 状态推进（归主 agent）。
- ❌ 不做事故平台侧处置（远端缓存与克隆副本回收）。
- ❌ 不写对端批次档 §2（父侧另派绑定）。

**范围外注记（发现即报，不动作）**：

1. A1 ① 仍含项目层路径「查项目文档地图——本产品自研仓 = docs/README.md」——同属 P 系列「静默失效」形态，但**不在 R9 射程**（R9 只点 ④）；登记待后续批。
2. 对端 `test/slow-gate.test.mjs` 被引用但**不存在**（夹具成孤儿）；对端 `docs/design/TESTING.md:213,222` 引用不存在的本端 `check-ledger.mjs`——均为对端在飞行项，本批不改，登记。
3. 对端单元测试清单（`test/files.mjs`）对 `test/*.test.mjs` 无机械漏登记兜底（只有集成目录有自检）——与本批无关，登记。

## 13. 变更记录

- 2026-09-12：初版（LEDGER-SELF-CONTAINED 批——R1–R9 落地设计；含存量处置清单、L4 机检方案、提示词逐字形态、分期表）。
- 2026-09-12（修订轮）：存量处置改**宽口径 + 溯及既往**（P1 改判）——批档 33 档逐档（迁移 14 / 拆分 19）；台账与互引、需求设计写痕逐档；新增 §8.6 VSC 文档体系对位蓝图（层清单 + 36 档三值表 + 归位规则）与 §8.7 互引面；§3.3/§3.6/§3.7 方案对比更新（严案保留在案并记否决理由）；D9–D12 新增；AC-LS15–AC-LS23 / T-LS15–T-LS26 新增。
- 2026-09-12（回读核对——D6）：本档 677 行；两侧设计档（CLI 677 / VSC 514）与两侧需求档（CLI 912 / VSC 66）行数已实测回填；两仓 `node scripts/check-doc-width.mjs` 实跑：**修订轮新增超宽 0 / 新增一致性违规 0**（存量基线不变——CLI 22 文件 39 行超宽为历史批档存量，VSC 宽度面 75 档全绿）。
- 2026-09-12（修正轮——设计评审轮次 1 判定 changes-required（🔴1 · 🟡9 · 🔵2）逐条落地；零新语义）：
  ① 🔴 VSC 测试档 535 超 500 硬限 → 本批拆分（§9 方案 + D14 · AC-LS26 / T-LS29）；② VSC §9 表去重 / 连续编号 / 口径统一；③ P3 显式映射（§8.8）；④ 实施分派裁定（D13——两侧各一 eng-coder、独立实施、共享同一 designId + token）；
  ⑤ §2 题注 / 表同步 B1–B12；⑥ D3 归档口径更新（不再整体冻结）；⑦ 计数口径逐处统一 + as-of（74→75 · 「已落」值刷新）；⑧ AC-LS12 归属注（2 条 V3 瞬态——基线 / 消解路径）；
  ⑨ `docs/design/prompts/discipline-normal.md`（两仓）纳入落点与 grep 面（§6.4 / §9 / AC-LS8）；⑩ 改指 / 托管 / 归档面补 AC（AC-LS24 · AC-LS25 / T-LS27 · T-LS28）；⑪ 需求档判定句区间改指；⑫ 跨端引用形态收敛（§4.3 扩围声明 + 头行）。
  回读核对（修正轮终值——D6）：本档 **731** 行；两侧设计档（CLI 731 / VSC 564）· 两侧需求档（CLI 912 / VSC 67）· VSC 需求 README 51 行——实测回填；两仓复跑：本批文件新增超宽 0（VSC 宽度面 75 文件全绿）；新增一致性违规 CLI 8（6 V1 + 2 V2——均他链 / 时序面，见 §8.8 与 §11 归属注）· VSC 2（V3 瞬态——§11 归属注）。
- 2026-09-12（**as-built 对齐（CLI 侧同步）**——并行批 `PROSE-ANCHOR-RETIRE` 实施落树后，把本档拉到与对端同一 as-built 口径；零新语义 / 零新范围，只修事实、计数与已消解拆分面）：
  ① 测试档拆分面**不适用**——`prompts-async-guidance` 对端实测 **177** ≤500、CLI 同侧实测 **169** ≤500（并行批先落——语义面断言整族退役）；`prompts-carryover-anchors` **不建**；`test/files.mjs` 登记 **+1**（仅 `ledger-check`）；原拆分方案留档备查 + 作废注（D14 · §9 行 9/23/24/51 · 档位结论 · §10 T-LS29 · §11 AC-LS26 同步）；
  ② 对端 `docs/requirements/TESTING.md`（并行批已落位）计入 ② 已在位——§8.6 树终态 15 → **16**、异名 / 异层对位 20 → **19**；D12 · §10 T-LS21 · §11 AC-LS19 同步；
  ③ §9 行 26 改逐条处置口径（不再整体冻结——对齐 §8.2 #7–#9）；
  ④ 计数回填：对端设计档 **564**（as-built 实测）· 对端两提示词档 **242 / 165** · 本仓两提示词档 **230 / 159**（均 as-built——并行批 +1；§9 行 3/4/16–18）。
  回读核对（as-built 对齐后——D6）：本档实测 **742** 行；`node scripts/check-doc-width.mjs` 实跑：本批文件新增超宽 0；一致性新增违规与对齐前同集合（7 条 = P3 承接面 V1×6 + V2×1，非本批引入；存量 20 条）。
