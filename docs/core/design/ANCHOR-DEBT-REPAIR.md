# 锚债修复（ANCHOR-DEBT-REPAIR）· 设计

> **本档 = 悬空锚 / 行宽存量清账的计划面**。
> **判据权威（D2 单一权威源）**：锚判据句住 `docs/core/design/DOC-DISCIPLINE.md` §4（V5 判据规格）、引擎落点住同档 §7——**本档不重述判据句**，只落「族 → 修法 → 归属轮」。

## 1. 问题与目标态

问题 = 机检锚检查**闸态常红**（阈值 0 · 现存 833 条）⇒「新增即红」的防回潮信号失效（红一片 = 无人看）；行宽 1 行同欠。

**基线读数**：

| 面 | 读数 |
|---|---|
| 悬空合计 | **833**（用例号 20 · 路径/坐标 587 · 符号·窄 226） |
| 拟新增（列报 · 不入闸） | 3 |
| 注记豁免 | 57 |
| 符号·宽（报告面 · 不入闸） | 495 |
| 行宽超 300 字符 | 3 行 / 2 档 |
| 判据项 | 5 项（`scanDirs` / `lineWidth` / `anchors.domain` / `anchors.exclude` / `exemptions`） |

**勘察结论（定全局的一句话）**：833 的主体**不是文档罗嗦**，而是**两仓合并 → 核统一**迁移留下的三类结构性残差；三类**处置人不同**：

| 类 | 性质 | 处置轮 | 条数 |
|---|---|---|---|
| ① 判据伪影 | 文档文本正确，抽取式 / 存在性面判错（P1 31 + S1 211 + B1 5） | 判据面批 #40（**已核销**——2026-09-18） | **247**（口径见下注） |
| ② 迁移期引文 / 待裁定 | 文本有意保留旧址名、判据无对应族；或宿主取错、单元测试档已删（P5 71 + P7 319 + S2 15 + B2 5 + B3 10） | **B + S2 轮**（逐条订正）· **C 轮**（机制裁定后——§3-Q5）——**已收口**（#26 核销） | **420** |
| ③ 可文档侧闭合 | 缺仓前缀 / 改名落点 / 占位形态（P2 27 + P3 12 + P4 127） | **A 列子批** | **166** |
| 计 | —— | —— | —— | **833** |

> **两数口径（防混）**：① 判据伪影 = **247**（P1 31 + S1 211 + B1 5）≠ §2.5 列名「符号 + 用例锚」= **246**（该列含 ② 类的 S2 + B2 + B3 共 30 条）——两数不同指，勿互用。

**目标态（分层）**：闭合 ③（166 条）⇒ 复跑悬空 833 → **667**（逐条对齐，D3）；**全 0 不在边界内可达**——余 667 归属：判据 **247** + ② 类 **420**（= B 240 + S2 15 逐条订正 · C 165（**计划面** · 口径见 §3-Q6）机制裁定后，§3-Q3）——**两线均已收口**；理由、证据与候选见 §3-Q1 / §3-Q3 / §3-Q5 / §8 发现 1–5。

## 2. 三分归类（833 条一条不落）

### 2.1 三族（引擎判类，逐字）

| 族 | 形态 | 条数 |
|---|---|---|
| 用例号 | `T-…` / `T<数>` 形态（右界强制），在册判据未命中 | 20 |
| 路径/坐标 | 路径 token（含 `/` 或带行号坐标），存在性判据未命中 | 591 |
| 符号·窄 | 反引号标识符 + 定义谓词 + 恰一宿主坐标；宿主文本不含该名 | 226 |

### 2.2 路径族细分（七分 · 判据逐字 · 实测条数）

| # | 判据（机判 · 逐字） | 修法（枚举单源 = §3-Q1） | 条数 | 归属轮 |
|---|---|---|---|---|
| P1 | token 以 `.js` 收尾，且**同行原文含**同名 `.json` 串 | 无文档侧修法——判据（见 §8 发现 2） | 31 | 判据 |
| P2 | token 以 `modules/` 开头 | **改指**：按反向退役表 / 转正注记映射改落转正档（或补全归档落点——可解析性证据见 §3-Q4）；两分支皆空 ⇒ **去路径段**（保留档名、去 `modules/` 段；判据见 §3-Q1） | 27（改指 26 + 去路径段 1） | A 列子批 |
| P3 | token 命中占位 / 示例形（末段裸名 ∈ `x` `y` `z` `foo` `path` `to` `file` `your*` `example` `placeholder`，或路径含此类段） | **归一占位形态**（元字符形 `<>`，抽取式排除式①既有射程） | 12 | A 列子批 |
| P4 | 去掉 P1–P3 后，token 的**尾段精确匹配全仓唯一** | **改指**：补仓前缀 / 补中段，命中该唯一落点 | 127 | A 列子批（须上下文核验，见 §3-Q2） |
| P5 | 尾段精确匹配命中 **≥2**（同名多落点） | **订正**：按同行 / 同表仓别声明裁定落点后改指 | 71 | 待裁定 |
| P7 | 零落点 | **现态改写 / 订正**；无现态落点可指者 ⇒ **停下上报**（可能是真缺陷）。退场族 N1–N6 真值依据成立者（= C 面 C3 子集 · §3-Q6）按**订正**计——退场注记是订正的一种形态，不是另一类处置 | 319 | 待裁定 |
| 计 | —— | —— | —— | **587** |

**为什么只留这一条判据**：一条「带日期 / 带旧值词的行可以不判」的许可，等于告诉写档的人把现状写成带日期的形状就不会被追——而写「某日实读 = N」比写「判时实读」省事；旧读数一旦被检索到，检索不带「这是历史」的标签，读者会照它办。所以判据只问一件事：这一行有没有现态落点可指。

### 2.3 符号族细分（两分）

| # | 判据（机判 · 逐字） | 性质 | 条数 |
|---|---|---|---|
| S1 | 标识符 ∈ 路径段碎片 / 通用词集（`thincoder` `core` `cli` `src` `tools` `tui` `vscode` `shared` `memory` `md` `N` `L` `finally` `timeout` `semantics` `undefined` `Availability` `ENG` `TOKEN` `BINDING` 等 211 个实测值）：抽自**反引号内路径被标识符正则切段**或散文英文词 | 判据伪影（见 §8 发现 3） | 211 |
| S2 | 余下 15 条 = 真标识符（`REVIEW_TIMEOUT_MS` `applyEditorRangeEdit` `resolveDesignSlot` `_engDesignToken` `startConfigWatch` `onChange` `providers` `embedding` `mcp` `LEDGER` `EDIT` `HELPERS` `write` `wc` ×2）——全部在全仓代码文本**存在**，仅**宿主档不含**（宿主取错 / 宿主漂移） | 逐条订正宿主 | 15 |
| 计 | —— | —— | **226** |

### 2.4 用例号族细分（三分）

| # | 判据（机判 · 逐字） | 修法 | 条数 |
|---|---|---|---|
| B1 | 同行引 `thincoder-vscode/test/**.mjs` 且该档在位（对端在册用例） | 判据（用例定义面缺对端树——§8 发现 4） | 5 |
| B2 | 同行引单元测试档**已不存在**（`doc-anchors.test.mjs` 族——V5 引擎档已删） | 退场注记 + 来源指针（须机制裁定） | 5 |
| B3 | 旧档用例表 / 形态例引用（迁移表内编号区间或编号例） | 退场注记 / 改述（须机制裁定） | 10 |
| 计 | —— | —— | **20** |

### 2.5 按档 × 族矩阵（83 档 · 合计 833 · 「一条不落」）

列义（与 §1 三类的换算）：**A** = 可闭合（P2+P3+P4 · 166 条 / 45 档）· **符号 + 用例锚** = 全部符号锚 + 用例锚 = 246（其中 S1+B1 = 216 归①、S2+B2+B3 = 30 归②）· **待裁定** = 路径余类 P1+P5+P7 = 421（其中 P1 = 31 归①、P5+P7 = 390 归②）。
换算核对：① 247 = 31 + 216 · ② 420 = 390 + 30 · ③ 166 ⇒ 合 833（D3）。

| 档（83） | 行数 | A 可闭合 | 符号 + 用例锚 | 待裁定 | 计 |
|---|---|---|---|---|---|
| `docs/core/design/CORE-UNIFICATION.md` | 1915 | 20 | 22 | 144 | 186 |
| `docs/core/design/AGENT-LOOP.md` | 515 | 22 | 0 | 17 | 39 |
| `docs/core/design/TOOLS.md` | 346 | 12 | 0 | 23 | 35 |
| `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` | 175 | 2 | 23 | 3 | 28 |
| `docs/core/design/TURN-CAP-CONTINUE.md` | 151 | 1 | 23 | 2 | 26 |
| `docs/core/design/ENG-TOKEN-BINDING.md` | 175 | 3 | 20 | 2 | 25 |
| `docs/core/design/DOC-DISCIPLINE.md` | 803 | 3 | 5 | 13 | 21 |
| `docs/core/design/CONSULTATION.md` | 256 | 8 | 0 | 12 | 20 |
| `docs/core/design/PROVIDER.md` | 391 | 3 | 5 | 11 | 19 |
| `docs/core/design/WORKSPACE.md` | 92 | 9 | 0 | 9 | 18 |
| `docs/core/design/CONTEXT-COMPACTION.md` | 266 | 2 | 0 | 14 | 16 |
| `docs/core/design/MEMORY.md` | 369 | 2 | 0 | 13 | 15 |
| `docs/core/design/PROXY.md` | 135 | 0 | 15 | 0 | 15 |
| `docs/core/design/ENGINEERING-MODE-V2.md` | 439 | 6 | 0 | 8 | 14 |
| `docs/core/design/CONFIG.md` | 150 | 7 | 0 | 6 | 13 |
| `docs/core/design/EDIT.md` | 120 | 0 | 10 | 3 | 13 |
| `docs/core/design/SESSION.md` | 378 | 5 | 0 | 8 | 13 |
| `docs/core/design/AGENT-LOOP-SUBAGENT.md` | 645 | 2 | 9 | 1 | 12 |
| `docs/core/design/APPLY-PATCH.md` | 95 | 0 | 9 | 3 | 12 |
| `docs/core/design/DOC-CODE-RECONCILE.md` | 468 | 2 | 7 | 3 | 12 |
| `docs/core/requirements/AGENT-LOOP.md` | 214 | 2 | 4 | 6 | 12 |
| `docs/core/design/PROMPT-SYSTEM.md` | 271 | 2 | 0 | 9 | 11 |
| `docs/core/requirements/METHODOLOGY.md` | 119 | 0 | 11 | 0 | 11 |
| `docs/core/design/TESTING.md` | 318 | 2 | 0 | 8 | 10 |
| `docs/core/design/MCP.md` | 214 | 1 | 0 | 8 | 9 |
| `docs/core/design/SETTINGS-TOOL.md` | 140 | 0 | 8 | 1 | 9 |
| `docs/core/design/VERIFY-REDESIGN.md` | 145 | 0 | 9 | 0 | 9 |
| `docs/vsc/design/WEBVIEW.md` | 254 | 0 | 9 | 0 | 9 |
| `docs/core/design/DOC-MIGRATION.md` | 331 | 0 | 2 | 6 | 8 |
| `docs/core/design/HASHLINE-EDIT.md` | 98 | 0 | 6 | 2 | 8 |
| `docs/core/design/TOOL-OUTPUT-LIMITS.md` | 161 | 0 | 6 | 2 | 8 |
| `docs/core/requirements/ENGINEERING-MODE-V2.md` | 708 | 8 | 0 | 0 | 8 |
| `docs/vsc/design/VSC-DEBT.md` | 253 | 6 | 1 | 1 | 8 |
| `docs/core/design/AGENT-PARAMS.md` | 138 | 1 | 4 | 2 | 7 |
| `docs/core/design/ARCHITECTURE.md` | 192 | 2 | 0 | 5 | 7 |
| `docs/core/design/ESCALATE.md` | 173 | 0 | 2 | 5 | 7 |
| `docs/core/design/PORTABILITY.md` | 184 | 2 | 3 | 2 | 7 |
| `docs/core/design/SEND-STALL-DISTILL.md` | 151 | 0 | 4 | 3 | 7 |
| `docs/vsc/design/WEBVIEW-PROTOCOL.md` | 334 | 3 | 3 | 1 | 7 |
| `docs/core/design/DOC-SYSTEM.md` | 408 | 2 | 4 | 0 | 6 |
| `docs/core/design/INSERT-AFTER.md` | 102 | 0 | 3 | 3 | 6 |
| `docs/core/design/MULTI-INSTANCE-COLLAB.md` | 235 | 0 | 0 | 5 | 5 |
| `docs/core/requirements/ESCALATE.md` | 66 | 0 | 0 | 5 | 5 |
| `docs/core/requirements/SETTINGS-TOOL.md` | 91 | 0 | 2 | 3 | 5 |
| `docs/core/requirements/TESTING.md` | 209 | 0 | 0 | 5 | 5 |
| `docs/core/requirements/CONTEXT-COMPACTION.md` | 88 | 0 | 0 | 4 | 4 |
| `docs/core/requirements/DESIGN-TOKEN-SETTLEMENT.md` | 81 | 0 | 2 | 2 | 4 |
| `docs/vsc/design/SETTINGS.md` | 124 | 0 | 4 | 0 | 4 |
| `docs/core/design/BATCH-RECORD.md` | 277 | 2 | 0 | 1 | 3 |
| `docs/core/design/EDIT-HELPERS.md` | 110 | 1 | 2 | 0 | 3 |
| `docs/core/design/I18N.md` | 87 | 2 | 1 | 0 | 3 |
| `docs/core/design/WRITE.md` | 89 | 0 | 3 | 0 | 3 |
| `docs/core/requirements/MEMORY.md` | 196 | 0 | 0 | 3 | 3 |
| `docs/core/requirements/PORTABILITY.md` | 122 | 1 | 0 | 2 | 3 |
| `docs/core/requirements/TOOLS.md` | 190 | 3 | 0 | 0 | 3 |
| `docs/core/requirements/TURN-CAP-CONTINUE.md` | 72 | 1 | 0 | 2 | 3 |
| `docs/vsc/design/VSC-MIGRATION.md` | 139 | 3 | 0 | 0 | 3 |
| `docs/cli/design/CRASH-REPORTS.md` | 184 | 0 | 2 | 0 | 2 |
| `docs/core/design/CHECKPOINT.md` | 216 | 0 | 0 | 2 | 2 |
| `docs/core/design/LEDGER.md` | 166 | 2 | 0 | 0 | 2 |
| `docs/core/design/MANIFEST.md` | 300 | 1 | 0 | 1 | 2 |
| `docs/core/design/STRUCTURE-DEBT.md` | 75 | 0 | 0 | 2 | 2 |
| `docs/core/requirements/CORE-UNIFICATION.md` | 201 | 0 | 0 | 2 | 2 |
| `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-CHECKLIST-REMOVAL.md` | 53 | 0 | 0 | 2 | 2 |
| `docs/core/requirements/MCP.md` | 100 | 0 | 0 | 2 | 2 |
| `docs/core/requirements/TWO-REPO-MERGE.md` | 82 | 0 | 0 | 2 | 2 |
| `docs/core/requirements/WORKSPACE.md` | 63 | 2 | 0 | 0 | 2 |
| `docs/vsc/requirements/PROJECT.md` | 79 | 0 | 0 | 2 | 2 |
| `docs/cli/design/ACP-CLIENT.md` | 360 | 0 | 1 | 0 | 1 |
| `docs/cli/design/TUI-TOOL-OUTPUT.md` | 118 | 0 | 1 | 0 | 1 |
| `docs/cli/requirements/ACP-CLIENT.md` | 128 | 0 | 1 | 0 | 1 |
| `docs/cli/requirements/FEATURES.md` | 216 | 0 | 0 | 1 | 1 |
| `docs/core/requirements/CONSULTATION.md` | 86 | 0 | 0 | 1 | 1 |
| `docs/core/requirements/I18N.md` | 65 | 1 | 0 | 0 | 1 |
| `docs/core/requirements/MULTI-INSTANCE-COLLAB.md` | 93 | 0 | 0 | 1 | 1 |
| `docs/core/requirements/NORMAL-MODE.md` | 157 | 1 | 0 | 0 | 1 |
| `docs/core/requirements/PROVIDER.md` | 151 | 1 | 0 | 0 | 1 |
| `docs/core/requirements/SESSION.md` | 118 | 1 | 0 | 0 | 1 |
| `docs/vsc/design/PROJECT-SWITCHER.md` | 93 | 0 | 0 | 1 | 1 |
| **合计** | —— | **166** | **246** | **421** | **833** |

## 3. 设计问题的定案（六项）

### Q1 三分归类与各族修法（§1.2 #1）

**定案**：归类见 §2（族 → 判据 → 条数 → 归属轮）；修法**六项**按下表分配——**「加锚」明示否决**（无「应存在而缺失」的落点：全部落点都是迁移改名 / 删除，补建档 = 越界造档）。

| 修法 | 适用族 | 条数 | 判据（改完怎么算过） |
|---|---|---|---|
| 改指真实落点 | P2 · P4 ·（P5 裁定后） | 153 | 复跑该条转绿（存在性判据命中） |
| 去路径段（保留档名 · 去 `modules/` 段） | P2 余项：**无转正落点且无归档副本**者（落点 = `docs/core/design/MANIFEST.md:3`；P2 27 = 改指 26 + 本行 1） | 1 | token 降为纯文件名 ⇒ 不再产锚（引擎判据 `scripts/doc-check-anchors.mjs:126`「纯文件名不显式锚定」）；复跑该条转绿 |
| 删（改述去锚 / 占位归一） | P3 | 12 | 该行不再产锚（抽取式排除或形态不再命中） |
| 加锚 | —— | 0 | 否决（见上） |
| 坐标出 span（改指**伴随纪律** · 防符号面激活） | 改指落点行 · **新写 / 改述行**（行内含坐标路径者） | 0（非闭合——消解被激活的符号面伪影：11 条 = 键名断言句 4 · 路径段伪影 3 · 命令行片段 4；逐条在案） | 坐标自路径 token 移出（空格 / 独立反引号对）⇒ 带坐标 token 数归零、符号·窄不激活（`scripts/doc-check-anchors.mjs` `:139-140`）；复跑**清单外新增 = 0**；**新写 / 改述行同判** |

> **本表计数合计（D3）= 166**：改指 153 + 去路径段 1 + 删 12 + 加锚 0（否决）；覆盖范围 = A 子批 166。**B / S2 / 判据不在本表**（P5 / P7 见 §3-Q3 B 行 · S2 宿主订正同随 B 轮 · 判据另轮——§8 发现 1–5）。

**代价（如实列）**：① 改指 = 需上下文核验（P4 中 58 条同行无仓别词，须看同表列头）；② 改述去锚 = 历史指针精度下降。

### Q2 修复机制：逐档手工 vs 机械批量（§1.2 #2）

**定案 = 分层，按「语义含量」切片**（不作二选一）：

| 层 | 面 | 手段 | 硬约束 |
|---|---|---|---|
| L1 机械面 | P3 占位归一（12）· P4 前缀补齐（127） | **候选清单落盘（不改档）+ 逐条留痕（§5）**：脚本只做「token → 补齐形态」映射表（零语义字符串替换），**不直接改档**；改动作由 edit 逐条执行。**脚本落点 = execute 内联（不落仓）**；确需落盘者落工作树外临时域，**不入 `scripts/**`**（AC-4 硬边界） | 每条改动须在本档 §5 留「file:line → 旧 token → 新 token → 复跑读数」；脚本仅作候选生成，须**显式声明**（承文档纪律：语义内容禁 scripted 批量改写） |
| L2 语义面 | P2 modules 改指（27）· P5 / P7 逐条订正（390）· **S2 宿主订正（15）** | 逐档手工（每档改完 D6 回读） | **承 `docs/core/design/DOC-DISCIPLINE.md:521` §4.3**（粒度与纪律 + 处置三选）——本档不重述；**§3-Q1 修法枚举（六项）= §4.3 三选的批内细化**（映射：改指真实落点 ≡ ① 现态改写 + ③ 订正 · 去路径段 与 删（改述去锚 / 占位归一） ≡ ① 的改述形态 · 「加锚」= 批内新增候选、已否决 · **坐标出 span** = 批内**伴随纪律**——非存量锚处置，防改指激活新锚）；**冲突处以 §4.3 为准** |
| L3 判据 | P1 / S1 / B1 | **零改**（禁触判据本体） | 转发现清单（§8）上报 |
| L4 行宽 | 见 Q3 子批 D | 折行（零语义） | 提示词面 = 产品代码面 ⇒ 落笔 = eng-coder（内容依据 = 机制文档） |

**P4 前置换算（防「改指错仓」）**：补齐前须核**同行 / 同表列头**的仓别声明（CLI / VSC / 核）；实测 127 条中 **69 条同行含仓别词**，58 条须看列头；**核不出仓别者降级为待裁定**（宁可留红，不得猜）。

### Q3 批结构（§1.2 #3）

**定案 = 拆四子批 + S2 归属行**（按「处置人 + 风险面」切，不按域切；S2 原为 ② 类余项、无归属轮——评审轮 1 #1 补行）：

| 子批 | 内容 | 条数 | 档数 | 护栏适配 |
|---|---|---|---|---|
| A | P2 + P3 + P4（L1 + L2） | 166 | 45 | **改动量口径**（非行数判据）：`docs/core/design/CORE-UNIFICATION.md`（A 列 20 条 = 单档改动量最大）⇒ **该档单列一轮**；余 44 档按改动量分轮，受 §5 **修正轮上限 5 轮**约束（`docs/core/design/BATCH-RECORD.md:174` L3）。**行数不入判据**——文档零行数义务（`docs/core/design/DOC-DISCIPLINE.md:271` §3.7 / R3）；「单档 >1000 行」射程 = **批次档生命周期**（`docs/core/design/BATCH-RECORD.md:173` L2 · BR-11 `:131`），不适用于被修设计档 |
| B | P5 + P7（L2 语义面 · 逐条订正） | 390 | 43 | 改动量口径 + §5 **修正轮上限 5 轮**（`docs/core/design/BATCH-RECORD.md:174`）；超限按档拆轮 |
| S2 | S2 符号面宿主订正（L2 语义面 · 逐条订正宿主）——评审轮 1 #1 补行 | 15 | 8 | 随 B 轮（同 L2 语义面 · 逐档手工 + D6 回读）；条数 / 档数为 2026-09-18 只读复算（逐条坐标在册） |
| C | B2 + B3（用例号锚 · 退场注记） | 15 | 42（计划面）· **36**（实测） | **§3-Q5 裁定已落**（采豁免闸门 · A/B/C/D 全授权）；C1 面（路径 / 坐标锚）已并入 P7（路径族唯一判据）· 条数以 P7 判据扫描为准 · 族本身 = 机制面新增（须设计 + 评审）；C2 = 退场注记 + **注记集标记（实装侧口径 · §8 发现 1 前置已显式解除）**；护栏适配**细化见下表后段** |
| D | 行宽 1 行 | 1 | 1 | 机械 1 行（`docs/core/design/ENG-TOKEN-BINDING.md:147` 折行） |

**时序**：A → D（机械面，可与 A 同轮）→ B + S2（L2 语义面，逐档手工）→ C（裁定后）。C 的条数不并入 A/B 的复跑差。

**C 面护栏适配（细化 · 2026-09-18 fix 轮补 · 承评审轮 1 发现 13）**：

- **改动量口径**（非行数判据——`docs/core/design/DOC-DISCIPLINE.md:271` §3.7 / R3）：`docs/core/design/CORE-UNIFICATION.md`（C 面 **60 条** = 单档改动量最大）⇒ **该档单列一轮**。
- **余 35 档**按改动量分轮，受 §5 **修正轮上限 5 轮**约束（`docs/core/design/BATCH-RECORD.md:174` L3）；**C 面 = 最大面**（211 条 / 36 档）⇒ 逐档施打、每档改完即 D6 回读。

**D3 闭合核对（子批 ↔ §1 三类同源）**：A 166 + B 240 + S2 15 + C 165 = **586**（③ 166 含于 A；② 420 = B + S2 + C——**C = 计划面**；C 轮实测 211 系批内重切，不改本等式，口径见 §3-Q6）· ① 判据 **247**（另轮）⇒ 586 + 247 = **833** ✓（与 §2.5 合计同源）。

### Q4 边界（§1.2 #4）

| 面 | 裁定建议 | 依据 |
|---|---|---|
| 冻结批档 `docs/batches/**` | **不入修复域**（维持现状） | 判据声明面 `checkConfig.anchors.exclude` 已含 `batches`（机检零覆盖）；批档 append-only + 非追溯 |
| `_archive/**` | **不入修复域**（不写归档档）；**但允许改指归档落点**（活档指针指向归档在位档——存在性判据可解析，引擎证据见下） | `exclude` 含 `_archive` + 抽取式 SKIP_DIRS；§4.6「不动 `_archive/`」= 不写，非不可引用 |
| 参照树 `thincoder-cli/docs/**` · `thincoder-vscode/docs/**` | **不纳入**（维持只读红线） | 不在扫描域（`scanDirs` = `docs`，域根 = 仓根，`discoverDomains` 现只发现根域）；§4.2.8 族定义显式列两树 |
| 产品代码面（`thincoder-*/**`） | **零触碰** | = 文档面对账；锚缺失若暴露真实代码问题 ⇒ 停下上报 |
| 行宽判据射程 | `thincoder-core/prompts/**`（唯一副本）不在扫描域内（行宽只扫 `docs/`） | 见 §8 发现 6（副本行宽漂移） |

**`_archive` 可解析性（引擎证据 · 2026-09-18 只读取证；评审轮 1 #7）**：

- **解析序不经 `SKIP_DIRS`**：`resolveFile`（`scripts/doc-check-anchors.mjs:158-164`）按仓根 → 锚域根 → 本档目录 → 前缀剥离给候选，命中判据 = `isFile`（同档 `scripts/doc-check-anchors.mjs:62` = `statSync(p).isFile()`）——无目录排除面。
- **`SKIP_DIRS` 的作用面**（同档 `scripts/doc-check-anchors.mjs:54` / `:65-71`）= `walk()`，只喂 basename 索引与用例索引；源域排除另在 `scripts/doc-check-targets.mjs:20-32`（扫描面，非解析面）。
- **实证**：docs/core/requirements/METHODOLOGY.md:100 指 thincoder-cli/docs/design/_archive/METHODOLOGY.md ⇒ 复跑**未入 833 悬空清单**——该档非唯一 basename ⇒ 只能由解析序命中。
- **与三处反向读法不冲突**：`docs/core/design/DOC-DISCIPLINE.md:162` / `docs/core/design/DOC-DISCIPLINE.md:467` / `docs/core/design/DOC-DISCIPLINE.md:575` 锁的是**扫描面**（源域 exclude）与**现状依据面**（归档档不作现状依据）——解析面另属。
- **结论**：P2 修法分支「补全归档落点」与 §3-Q5 适用前提③ **成立、保留**；边界用例见 §6 U11。

**登记（不阻断）**：若两子仓后续各自带 `PROJECT-MANIFEST.json`，`discoverDomains` 将发现为独立域 ⇒ 判据扩面（`--domain` 两分支），本条零涉。

### Q5 豁免闸门：若引入锚豁免清单（§1.2 #5）

**定案（已裁 · 已执行）**：不引入「清单」（人工允许表 = 存量通道，与「基线必须保持为空」相抵——§4.1 方案选型③已否决）；C 子批（豁免 / 退场注记）按 §3-Q6 施打并已收口（#26 核销）；逐条读数与归属见 §5。

### Q6 C 子批处置定案（豁免闸门施打 + 退场注记）

**前置**：C 的执行面 = 实装侧 `scripts/doc-check-anchors.mjs`（标记常量 · 三态判定）——属**实装事实**，非本档可处置面；该引擎的词表与标记族归代码面另批处置，本档不复述。

**C1 面（路径 / 坐标锚）的去向**：并入 P7（路径族唯一判据：现态改写 / 订正 · 停下上报）；条数以 P7 判据扫描为准，本档不另记数。

**只施打、不改判据**——`scripts/**` 零触。

**定案 = 处置三面 + 上抛一面 + 排除一面**（判据 = 机检可判）：

| 面 | 判据（逐字） | 处置 | 行数 / 档数 |
|---|---|---|---|
| **上抛面** | ① 档 ∈ `docs/**/requirements/**`（需求档 = 主 agent 笔 · D1）② 包说明符伪影族（判据） | **零触碰**；逐条坐标 + 建议处置列表上抛（载体 = 本档上抛面登记） | 29 行（需求档 · **15 档**）+ 4 条（判据 · 4 档） |
| **排除面** | 他批在飞面（本档外批的排除清单） | **零触碰**（防同档并发写）；与上抛面的 **5 坐标 = 两面同对象**（单列不并计） | **34 行 / 9 档**（基数 = 行） |

**C 面两数口径（防混 · 单源）**：

- **15（计划面）** = §3-Q3 / §1 ② 类归属 C 的用例号锚（B2/B3 15——含随后上抛的需求档 29 与判据 4）；**211（实测面）** = C 轮设计档域施打面（C1 121 + C3 83 + C2 7 = 211）。
- **两数不同指**：C3 83 = **承接自 B 面 P7 的子集**、C2 中符号余项 1 = S2 面余项 ⇒ **不得**把 211 代回 §1 / §3-Q1 / §3-Q3 / §5 / §7 的 15（那会与 B / S2 面双计）；反之 15 亦不得用作施打条数。

**面上抛 ∩ 排除（两面同对象 · 单列不并计）**：`docs/core/requirements/STRUCTURE-DEBT.md:33` · `:66` · `docs/cli/requirements/FEATURES.md:180` · `docs/core/requirements/CORE-UNIFICATION.md:119` · `docs/core/requirements/TWO-REPO-MERGE.md:79`——= 他批在飞面 C 类 5 行（同属父侧 D1 上抛面）且零触碰（逐条在本档排除面）。

**退场注记闭枚举（六形 · 每形含十九词之一——机判可核；防注记自由生长）**：

| 形 | 语义 | 真值依据（逐族） |
|---|---|---|
| N1 `档已删` | 目标档已删除 | 删除记录行 · 单元测试档退役 · 两端自持镜像删除集 |
| N2 `档已迁核` | 目标档已迁核（现体在核） | W / S 系列迁核记录行（「自持镜像已删，现体 = 核 …」） |
| N3 `工具已退役` | 死脚本名族 | #54 / #42 在册 + #40 收口（`mirror-divergence` · `doc-anchors-*` · `check-ledger` · `check-doc-width*` · `reconcile-lookup`） |
| N4 `入口已并入` | 测试入口并入现入口 | `thincoder-cli/test/run.mjs` / `slow.mjs`（两侧 `package.json` scripts 实核） |
| N5 `机制已废` | checklist 族（M7 废除） | `thincoder-core/tools/{checklist,checklist-sync}.mjs` 全仓零命中 |
| N6 `旧址` | 改前坐标记录行 | 行内已给改后形态者（B9 坐标收正类） |

**到期条件（逐条在册 · 闭枚举四码）**——豁免项**无一永久**（承 §3-Q5「无到期条件 = 永久先例 ⇒ 不许」）：

**赋码主规则（C 面通用 = C1 / C2 / C3 同源 · 有序 · 首条命中即定）**：**E3（宿主对象级：token ∈ 死脚本族）> E1（档级：档 ∈ 迁移档案族）> E2（缺省）**——同一条不两判。

| 码 | 到期条件 | 适用 | 消解路径 |
|---|---|---|---|
| E1 | 随档退役 | **档级**：迁移档案 / 已收口批的事实表与读数表（`CORE-UNIFICATION.md` · `DOC-MIGRATION.md` 的**事实 / 读数 / 登记行**） | 该档退役轮启动 ⇒ 标记随档消失，无需单独收正 |
| E2 | 随档实质修订 | **活档**正文 / 用例表 / 变更记录 / 登记行（档 ∉ 迁移档案族） | 该档下次实质修订轮逐行复核（改指 / 去锚 / 续留须再登记理由） |
| E3 | 随宿主面收口 | 引用已退役宿主对象者（死脚本族 / 双引擎收敛） | #54+#42 sweep 与判据轮收口后逐条复核 |
| E4 | 上抛结案 | 需求档 / 判据 | 父侧裁定后由 owning 轮处置 |

**族级到期（必报父侧）**：判据以实装侧（`scripts/doc-check-anchors.mjs`）族状态为准；逐条到期码 = 上表 **`E1–E4`**。

**边界（不做）**：不改判据本体（`scripts/**` 零触）· 不写需求档（上抛）· 不动 `_archive/**` 与参照树正文 · 不动提示词面 · 不改行内读数值（史实面约束：只加注记与标记，读数零动）· 不新增锚 · 台账两档机检域外（`docs/TODO-archive.md` 载迁移前路径字面不入判——`doc-check-targets.mjs` `LEDGER_NAMES` 判；登记上抛）。

**追溯**：C 批逐条清册（211 条施打面 + 33 条上抛面〔需求档 29 行 + 判据 4 条〕+ 34 行排除面）+ 受影响文件表 + AC + 用例 = **本档 §2**（D2——本档不重述）。

## 4. 受影响文件全清单

**A + D + S2 子批 file 级改动面 = 51 档**（= §2.5 表中 A 列 > 0 的 45 档（`core/design` **32**（含 `prompts/` 3）· `core/requirements` **10** · `vsc` **3**）+ **S2 落点 4 档**（见下行）+ 新增本档 + `docs/README.md`）；
**C 子批面 = 36 档**（见 §3-Q6 与本档 §2——两子批清单不互用）：

| 类 | 档 | 改动形态 |
|---|---|---|
| 机械面 | **A 列 45 档**（P3 + P4 行内替换，P2 见下行） | token 前缀补齐 / 占位归一（行内局部替换） |
| 映射面（P2） | **11 档**（v2 就地更新 / 转正注记档）：`MANIFEST.md` · `LEDGER.md` · `BATCH-RECORD.md` · `ENG-TOKEN-BINDING.md` · `AGENT-LOOP-SUBAGENT.md` · `DESIGN-TOKEN-SETTLEMENT.md` · `DOC-DISCIPLINE.md` · `PROMPT-SYSTEM.md` · `TESTING.md` · `TOOLS.md` + `docs/core/requirements/ENGINEERING-MODE-V2.md`（反向退役表 :525–532） | 改指转正档 / 补全归档落点 |
| S2 落点（2026-09-18 fix 轮补入——承实施轮上报 + 父侧裁定） | **4 档**：`docs/core/design/SETTINGS-TOOL.md` · `docs/core/requirements/METHODOLOGY.md` · `docs/core/design/HASHLINE-EDIT.md` · `docs/vsc/design/SETTINGS.md`（§3-Q3 S2 行 8 档中 A 列 = 0 的增量；余 4 档已含于 A 列 45 档） | 坐标出 span / 补真宿主坐标（各 1 行 · 逐条在本档 §5 S2 表） |
| 行宽面 | `docs/core/design/ENG-TOKEN-BINDING.md`（:147） | 折行（零语义） |
| 新增 | `docs/core/design/ANCHOR-DEBT-REPAIR.md`（本档） | 新建 |
| 地图面（一致性随改） | `docs/README.md` | 新档登记 + §4 计数行收正（D3 计数与枚举同改） |

在案两处「零改」句（`docs/core/design/DOC-DISCIPLINE.md:83` §3.3 · `docs/core/design/DOC-DISCIPLINE.md:283` §3.7 不处置面）= **其所属批的写域声明**（英文提示词 = 代码），**不约束本档写域**；两句话本身的收正 / 重述归**批 12 处置面**（本档对 `DOC-DISCIPLINE.md` 只落 A 列 3 条行内替换，不动该两行）。

## 5. 验收标准（机判 · 回指批次条目）

| # | 判据（可机判） | 回指 |
|---|---|---|
| AC-1 | `node scripts/doc-check.mjs --root .` 复跑：悬空 = **833 − 闭合条数**（**闭合 + 降级 = 166**）——逐条差集 = 清单集合，不得多减；降级条在 §5 记账位逐条在册 | §2 |
| AC-2 | 行宽：`FAIL(行宽)` = **0**（域内机械 1 行随子批 D 折行；提示词档不属本档修复面） | — |
| AC-3 | 机检零新增：改动档内**清单外**新悬空 = 0（逐档复跑） | 防回潮 |
| AC-4 | **修复面** `git diff`（+ 未跟踪新档）⊆ §4 清单；修复面不触 `scripts/**` / `_archive/**` / 参照树 / 批次目录（`docs/batches/**`）（**自身留痕段除外**——append-only 写入为合规必需） | §3-Q4 边界 |
| AC-5 | 计数一致（D3）：§2.5 合计 = 833；列合计 = 166 / 246 / 421；§2.2 = 587；§2.3 = 226；§2.4 = 20；§3-Q3 = 166 + 240 + 15 + 165 + 247 = 833（**165 = 计划面**——C 轮实测 211 系批内重切，不改本等式；口径见 §3-Q6）；**受影响文件 = 51**（47 + S2 落点 4） | D3 |
| AC-6 | 逐条可核验：§5 每条「file:line → 旧 → 新 + 复跑读数」齐备；机械面脚本**显式声明**（execute 内联候选生成、不落仓、未直接改档） | §3-Q2 |
| AC-7 | P4 上下文核验留痕：**闭合 + 降级 = 166**（降级条 = 0 或有逐条理由；每降级条在 §5 记账位有行——与 AC-1 同源） | §3-Q2 前置换算 |

**读数口径（AC-1 / AC-3）**：判据只在**收口复跑**时判定；他批在途档的读数波动 = **活动量**，不作缺陷（先例 = `docs/core/design/DOC-DISCIPLINE.md:516`），以本档清单逐条为准。

**item 级基线**：A 子批**首跑清单**（`file:line → token`）载体 = 本档 §5，**实施轮开工时冻结**——冻结后新出现的行不入差集（防他批在途漂移污染差集判定）。

**比较基准（AC-4）**：基准 = 实施轮开工时的 `HEAD`；读数 = `git diff --name-only <基准>` + `git status --porcelain`（未跟踪档）两读并用、按档名去重；清单外未跟踪档 = 判红。

## 6. 用例表

| # | 场景 | 输入 | 期望输出 |
|---|---|---|---|
| U1 | 正常 · 前缀补齐 | 行内 token = 缺仓前缀的 `agent/<档>.mjs` 形态，同表列头声明 VSC 面 | 改指 `thincoder-vscode/` 前缀下同位档（在位）；复跑该条转绿 |
| U2 | 正常 · 改名改指 | 模块旧址 token（`modules/` 段起头，`ENGINEERING-MODE-V2-MODULE-<模块>.md` 形态） | 改指转正档 `docs/core/design/MANIFEST.md`（转正注记在案）；转绿 |
| U3 | 正常 · 占位归一 | 示例形 token（`<dir>/x.<ext>` 单字母段） | 改为元字符占位形（抽取式排除）；转绿且不致新锚 |
| U4 | 边界 · 多落点 | token 尾段全仓命中 ≥2（如两仓同名档） | **不自动补齐**；按同行 / 列头仓别裁定；核不出 ⇒ 留红入 B 子批 |
| U5 | 边界 · 同行多锚 | 一行含 3 锚，其中 1 锚红 | 只改红锚；同行另 2 锚的判定结果不变（复跑逐条核） |
| U6 | 边界 · 大改动量档 | `docs/core/design/CORE-UNIFICATION.md`（A 列 20 条 = 单档改动量最大；档 1915 行） | 单列一轮（**改动量口径**——行数不入判据，§3-Q3）；改完该档单独复跑 |
| U7 | 错误 · 脚本越界 | 脚本直接改写档 / 脚本落仓（`scripts/**` 内新档） | **违规**：脚本仅可生成候选（execute 内联、不落仓）；改档须 edit 逐条 + §5 留痕（AC-4 / AC-6 判红） |
| U8 | 错误 · 折行超宽 | 折行后新行 >300 字符 | `FAIL(行宽)` 新增 ⇒ 重排；AC-3 判红 |
| U9 | 错误 · 改指错仓 | 未核仓别即补 `thincoder-core/`（真落点在对端） | 伪绿（存在性命中但语义错）——AC-7 抽核 + 复读原文判红 |
| U10 | 错误 · 打标记掩盖 | 对 P1 伪影行打「迁移期引文」标记 | **违规**（§3-Q5 防滥用②）；评审抽核 + 计数面异常上升 |
| U11 | 边界 · 归档落点可解析 | 活档指针改指 `_archive/**` 在位档（如 `docs/core/design/_archive/modules/ENGINEERING-MODE-V2-MODULE-WRITE-GATE.md`） | 复跑**转绿**（解析序不经 `SKIP_DIRS`——证据见 §3-Q4）；落点不存在 ⇒ 走转正档改指（不得指向空位） |

## 7. 边界（本设计不做）

- **不改判据本体**：`scripts/doc-check*.mjs` 三档零改（= 修债不是改判据）。
- **不建新档 / 不补锚**：「加锚」修法已否决——无「应存在而缺失」的落点。
- **不写代码面**：`thincoder-core/**` · `thincoder-cli/**` · `thincoder-vscode/**`（含代码注释里的死指针）零触；暴露真实代码问题 ⇒ 停下上报。
- **不写冻结批档 / `_archive/**` / 参照树正文**：不追溯、不代写对端。
- **不做无锚语义巡检**（机器判不了的那类，归 DOC-DISCIPLINE §4.4 巡检机制）。
- **不承诺全 0**：全 0 需余 667 全清——判据 247（#40 已核销）+ B 240 + S2 15（逐条订正）+ C 165（机制裁定后；口径见 §3-Q6）——两线均已收口（#40 ∕ #26 核销），见 §1 目标态。
- **零 UI 面（纯文档面）——无未决项**：设计档「UI / 交互决策」槽位 = 空集（无界面 / 无交互 / 无未决项）。

## 8. 发现清单（设计轮勘察实测 · 逐条上报）

| # | 发现 | 证据 | 建议处置 |
|---|---|---|---|
| 1 | **注记集口径单源**：引擎 `scripts/doc-check-anchors.mjs` 的注记标记集 | 引擎常量表 | 归实装常量表单源；本条零改。影响面 = 247 条史实叙述锚（180 行）本应按规格过、实装判红。**C 面 C2 子批改用**实装侧口径**处置，其「收口为前置」句已在 §3-Q5 / §3-Q6 **显式解除**（规格侧标记集收正仍归判据轮） |
| 2 | **`.json` 截断伪影**：抽取式交替序 `js` 先于 `json` ⇒ `…/package.json` 抽出 `…/package.js`（原文并不含该串） | 31 条；抽样核原文 2 例（`docs/core/design/ARCHITECTURE.md` · `docs/core/design/CORE-UNIFICATION.md`）原文均含 `.json` | 判据修正则（交替序 / 右界）；文档侧无正当修法 |
| 3 | **符号面伪影**：反引号内路径被标识符正则切段（`thincoder` `core` `src` `tools` `tui` …）＋定义谓词集含高频词「在」「见 」⇒ 触发面极宽 | 226 条中 211 条属此类 | 判据（标识符抽取排除路径段 / 谓词集收紧）；本条零改 |
| 4 | **用例定义面缺口**：规格「两仓测试树文本」∪ 定义位；实装只走 `<域根>/test`——**合并仓根无 `test/` 目录**（实测不存在），测试树源为空 ⇒ 对端在册用例误判 | 20 条中 7 条同行所引对端单元测试档**在位** | 判据（定义面加两测试树）；本条零改 |
| 5 | **§4 存失效段**：§4.2.8 参照历史面豁免族 / §4.2.6 V4 跨仓形态 / §4.2.4 V5 假阳 10 类——实装「砍六族」后已不存在（引擎头注：全数删除，不保留） | 引擎头注 + §7 F3 | 判据（规格收窄 / 标注失效）；本条零改 |
| 6 | **提示词面行宽超宽**：`thincoder-core/prompts/` 16 档中单行 >300 字符者 **259** 行（最长 1486 字符 = `thincoder-core/prompts/persona-engineering.md:100`） | 实测提示词面（`thincoder-core/prompts/`，单副本；阈值 300 = `PROJECT-MANIFEST.json` `checkConfig.lineWidth`） | 落笔 = eng-coder（内容依据 = 机制文档）；折行（零语义） |
| 7 | **计数收正口径未明**：「计数收正」未指明对象——候选 = `docs/README.md` §4 `core/design` 实档计数行 / §4.2.7 as-of 读数行 / 本档 §2 分类计数（D3） | —— | **已裁定**：对象 = ① `docs/README.md` 计数行（已就地收正 **51**）② doc-check 计数类判据与 `checkConfig` 键一致（D3——归判据轮核）；**无可增对象** |
| 8 | **代码注释死指针**：`thincoder-core/manifest.mjs` 等 4 处 + `batch-segment.mjs` 两处指已归档模块档 | 发现行在案 | 代码面（另轮 / 已登记） |
