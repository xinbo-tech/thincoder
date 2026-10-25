# 提示词系统（PROMPT-SYSTEM）· 核心统一子系统档

> 板块归属 = **核心统一**（phase 2——「一个核 + 两个薄壳」）；本档 = 该板块的**子系统设计档**。
> 工作流档 = `docs/core/design/CORE-UNIFICATION.md`（事实基线 / 核形态与消费契约 / 方案选型 / S0 方法 / 分段执行 S0a–S3 / 关键决策 / 受影响文件总表 / 验收回指 / 裁定 A1–A8 / 契约兼容策略 / 测试用例）——**本档不复制**。
> 需求层 = `docs/core/requirements/CORE-UNIFICATION.md`（F1–F13 / N1–N8）。
> **列定义**（裁决行各列含义）→ `CORE-UNIFICATION.md` §2.5；**须裁条目的分组口径与四要素提交形式** → 该档 §2.5.1。
> **机制面**（§6–§7）：提示词承载与落笔分工 · 装配实现事实 · 端特有段纪律 · byte-identical 取消 · 现状坐标。

## 1. 归属与范围

| 面 | CLI 档 | VSC 档 |
|---|---|---|
| 槽位提示词（运行期加载） | `thincoder-cli/src/prompts/*.md`（实核空） | 同名（实核空）；**运行期面 = 核包 `thincoder-core/prompts/*.md`** |
| 工具描述（运行期加载） | `thincoder-cli/src/tools/*.md`（实核空） | 同名（实核空）；**运行期面 = 核包 `thincoder-core/tool-docs/*.md`** |
| 槽位加载面 | `src/prompt-overlays.mjs`（实核档不存在；装配面 = 核内单点 `thincoder-core/prompt-overlays.mjs`） | 同名（同路径对） |

**核内落点**：`thincoder-core/prompts/`（16 档槽位）+ `thincoder-core/tool-docs/`（54 档工具描述）+ 单一解析面 `prompt-files.mjs`（落 `thincoder-core/`）——**核内唯一副本**（用户裁定 A7）。

**核内只有运行期面** ✓——`thincoder-core/prompts/`（16）+ `thincoder-core/tool-docs/`（54）；`docs/` 下不建提示词档（单面制）。

> 工具**实现面**（`src/tools/*.mjs`）的行本体住 `docs/core/design/TOOLS.md`；本档收**文本面**（槽位 / 描述）。

## 2. 核模块裁决行

### 2.1 槽位提示词（逐字节同组——组陈述（逐字））

> 逐字节相同 ⇒ 无分叉面——前提校验不适用、不命中 A11（须用户裁 = —）；每行归属与四列逐行登记（列值 = 本组陈述）。

| # | 相对路径 / 对位 | 面 | 相似度 · 逐字节 | 分类 | 目标 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|---|---|---|
| 2 | `thincoder-core/prompts/advisor-round1.md` | 同路径 | 1.0000 · 同 | ① | 进核（`thincoder-core/prompts/advisor-round1.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 3 | `thincoder-core/prompts/common.md` | 同路径 | 1.0000 · 同 | ① | 进核（`thincoder-core/prompts/common.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 4 | `thincoder-core/prompts/consult-base.md` | 同路径 | 1.0000 · 同 | ① | 进核（`thincoder-core/prompts/consult-base.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 5 | `thincoder-core/prompts/persona-coder.md` | 同路径 | 1.0000 · 同 | ① | 进核（`thincoder-core/prompts/persona-coder.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 6 | `thincoder-core/prompts/persona-eng-designer.md` | 同路径 | 1.0000 · 同 | ① | 进核（`thincoder-core/prompts/persona-eng-designer.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 7 | `thincoder-core/prompts/persona-explore.md` | 同路径 | 1.0000 · 同 | ① | 进核（`thincoder-core/prompts/persona-explore.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 8 | `thincoder-core/prompts/persona-normal.md` | 同路径 | 1.0000 · 同 | ① | 进核（`thincoder-core/prompts/persona-normal.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 9 | `thincoder-core/prompts/persona-plan.md` | 同路径 | 1.0000 · 同 | ① | 进核（`thincoder-core/prompts/persona-plan.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |

### 2.2 非逐字节同组

| # | 相对路径 / 对位 | 面 | 相似度 · 逐字节 | 分类 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|---|---|
| 43 | `prompt-overlays.mjs` | 同路径 | 0.9853 · 异 | ① | 取 CLI 侧（去镜像注记） | 分叉 = VSC 单行镜像注记；无失效前提（① 直取） | — | S0a（首批建核） |
| 44 | `thincoder-core/prompts/advisor-design.md` | 同路径 | 0.9487 · 异 | ② | 融合（措辞归一——建议取 CLI） | 分叉 = 独立演进的措辞收窄；评审面跨档前提仍成立（② 融合） | **①** | S0a（首批建核） |
| 45 | `thincoder-core/prompts/advisor-round2.md` | 同路径 | 0.9318 · 异 | ② | 取一侧版式（建议 CLI 两行式） | 分叉 = 行断版式；文本逐字相同——无失效前提（②） | — | S0a（首批建核） |
| 46 | `thincoder-core/prompts/advisor-round3.md` | 同路径 | 0.9250 · 异 | ② | 取一侧版式（建议 CLI 两行式） | 分叉 = 行断版式；文本逐字相同——无失效前提（②） | — | S0a（首批建核） |
| 47 | `thincoder-core/prompts/persona-engineering.md` | 同路径 | 0.9184 · 异 | ② | 融合（标题并集 + 指针参数化） | 分叉 = 两端各自维护 + VSC 侧指针适配；两端共用同一角色面前提仍成立（②） | **①** | S0a（首批建核） |

**四要素明细（逐字）**

- **#43 `prompt-overlays.mjs`**（同路径）
  - 左端读数（CLI）：无独有行——除右端注记外两侧逐字相同。
  - 右端读数（VSC）：独有 1 行头注 `* VSC mirror of thincoder-cli/src/prompt-overlays.mjs (多实现面纪律——语义同源、原文自持).`
  - 建议归一形态：取 CLI 侧（镜像注记随归一失去对象——核内为唯一源）。
  - 影响面：无（仅头注；须用户裁 = —）。
- **#44 `thincoder-core/prompts/advisor-design.md`**（同路径）
  - 左端读数（CLI）：判据 7 措辞 = "the document that already owns its topic"。
  - 右端读数（VSC）：判据 7 措辞 = "the design document that already owns its topic"（收窄）；其余逐字相同。
  - 建议归一形态（只建议）：融合——建议取 "the document"（判据 7 通用口径——评审亦覆盖需求档 / 批次档）；一词级差异。
  - 影响面：模型可见指令（advisor 设计评审判据措辞）——**命中 A11 ①**（提交文本见 §2.5.1）；对外契约无涉 · 测试无涉。
- **#45 `thincoder-core/prompts/advisor-round2.md`**（同路径）
  - 左端读数（CLI）：两行式——`- Stop calling tools…` 与 `## Judgment Rules…` 分行。
  - 右端读数（VSC）：一行合写（两段以空格相接）；**文本逐字相同**（含 `## Judgment Rules…do not downgrade` 全文）。
  - 建议归一形态：取一侧版式（建议 CLI 两行式——`##` 标题独立成行）。
  - 影响面：版式级——归一后模型可见文本除行断外逐字等价 ⇒ 不命中三口径（须用户裁 = —）。
- **#46 `thincoder-core/prompts/advisor-round3.md`**（同路径）
  - 左端读数（CLI）：两行式——`- Stop calling tools…` 与 `## Judgment Rules…` 分行。
  - 右端读数（VSC）：一行合写；**文本逐字相同**。
  - 建议归一形态：取一侧版式（建议 CLI 两行式）。
  - 影响面：版式级 ⇒ 不命中三口径（须用户裁 = —）。
- **#47 `thincoder-core/prompts/persona-engineering.md`**（同路径）
  - 左端读数（CLI）：小节标题「与 eng-designer / eng-coder 的分工界面」；指针 `AGENT-LOOP.md` 的 §18。
  - 右端读数（VSC）：标题「与 eng-coder 的分工界面（设计写作面归 eng-designer）」；指针「AGENT-LOOP（CLI 仓·设计）§18（本端交付协议节 = §8）」——含跨端节号映射。
  - 建议归一形态（只建议）：融合——标题取并集语义；指针经参数化 / 注入承载端差（契约 10）。
  - 影响面：模型可见指令（角色分工表述 + 跨端指针）——**命中 A11 ①**（提交文本见 §2.5.1）；对外契约无涉。

### 2.3 纪律 / 角色面分叉档

| # | 相对路径 / 对位 | 面 | 相似度 · 逐字节 | 分类 | 目标 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|---|---|---|
| 117 | `thincoder-core/prompts/discipline-engineering.md` | 同路径 | 0.7713 · 异 | ③ | 进核（`thincoder-core/prompts/discipline-engineering.md`） | 融合（取并集）+ 端特有段按注入（VSC 的 R14 池段 / 取消 eng-coder 判据；CLI 的改动面反查段） | 分叉 ＝ 各端机制不同（VSC per-role-domain 池 ∕ CLI 改动面反查）+ 文档地图与 `AGENT-LOOP` 节号错位（§11.2 ↔ §9）；前提（各端机制仍存在）成立 ⇒ **段级 ④** | **①②** | S1（建核补齐）· 落地 = `thincoder-core/prompts/discipline-engineering.md`；端特有段现余 0（§6.3 现体） |
| 118 | `thincoder-core/prompts/discipline-normal.md` | 同路径 | 0.6085 · 异 | ③ | 进核 | 融合 + 端特有段注入（VSC「收尾验收」节 / CLI 会诊终止口径） | 分叉 ＝ VSC 增「收尾验收」节 + 完成声明受审句；CLI 多「Ctrl+I 不终止会诊」等句 + 节序不同；指针按端地图（`docs/README.md` ↔ 端侧文档地图） | **①** | S1（建核补齐）· 落地 = `thincoder-core/prompts/discipline-normal.md`；端特有段现余 0（§6.3 现体） |
| 119 | `thincoder-core/prompts/persona-eng-coder.md` | 同路径 | 0.5510 · 异 | ③ | 进核 | 融合 + 端特有段注入（VSC「Guidelines」块：不得静默降级 / 收尾自审六条 / 工具权限处置） | 分叉 ＝ VSC 独有六条收尾自审与降级纪律；CLI 的 file 域节为独立标题形态（内容 VSC 以 bullet 保留） | **①** | S1（建核补齐）· 落地 = `thincoder-core/prompts/persona-eng-coder.md`；端特有段现余 0（§6.3 现体） |

## 3. 须用户裁条目

### 3.1 甲组（真选择）

| # | 条目（路径 / 对位） | 命中 | 左端行为（CLI） | 右端行为（VSC） | 建议归一形态 | 影响面 | 裁定状态 |
|---|---|---|---|---|---|---|---|
| A16 | `thincoder-core/prompts/discipline-engineering.md`（#117） | ①② | 独有「改动面反查（文档影响面）」节；无 R14 池段 | 独有 R24 挂钩节、**R14 域池段**、取消 eng-coder 判据、D5 冻结窗口细则 | 融合（取并集）+ 端特有段按注入（VSC 的 R14 / 取消判据；CLI 的改动面反查） | ① 归一后两侧模型被要求做的事会**并集化**（CLI 侧开始看到 R24 / D5 细则，VSC 侧开始看到改动面反查）⇒ 须逐条确认哪些真是端特有；② 模型可见指令面变更 | **已裁 · 按建议** · 落地 = `thincoder-core/prompts/discipline-engineering.md`；端特有段现余 0（§6.3 现体） |
| A17 | `thincoder-core/prompts/discipline-normal.md`（#118） | ① | 独有「Ctrl+I 不终止会诊」等句；会诊节位置不同 | 独有「收尾验收」节——完成声明受审 / load skills / 与设计档对账 | 融合 + 端特有段注入 | ① VSC 侧新增的收尾要求是否晋升为**两端共同**纪律（会改变模型收尾行为） | **已裁 · 按建议** · 落地 = `thincoder-core/prompts/discipline-normal.md`；端特有段现余 0（§6.3 现体） |
| A18 | `thincoder-core/prompts/persona-eng-coder.md`（#119） | ① | 无 Guidelines 块（`file` 域节为独立标题形态） | 独有 Guidelines 块：不得静默降级 / UI 与交互决策缺失即停报 / **收尾自审六条** / 工具权限处置 | 融合 + 端特有段注入 | ① 同上：VSC 的六条收尾自审是端特有还是应两端共用（会改变 eng-coder 的收尾行为与成本） | **已裁 · 按建议** · 落地 = `thincoder-core/prompts/persona-eng-coder.md`；端特有段现余 0（§6.3 现体） |

### 3.2 丙组（S0a 席位已裁）

| # | 条目（路径 / 对位） | 命中 | 左端行为（CLI） | 右端行为（VSC） | 建议归一形态 | 影响面 | 裁定状态 |
|---|---|---|---|---|---|---|---|
| C1 | `thincoder-core/prompts/advisor-design.md`（§2.5 #44） | ① | 判据 7 =「…amend **the document** that already owns its topic…」 | 判据 7 =「…the **design** document…」（收窄）；其余逐字相同 | 融合——取「the document」（判据通用口径——评审面 ≠ 仅设计档：尚覆盖需求档 / 批次档） | 模型可见指令（advisor 设计评审判据措辞）· 对外契约无涉 · 测试无涉 | **已裁**「按建议」· 已落地 `thincoder-core/prompts/advisor-design.md` |
| C2 | `thincoder-core/prompts/persona-engineering.md`（§2.5 #47） | ① | 标题「与 eng-designer / eng-coder 的分工界面」+ 指针 `AGENT-LOOP.md` 的 §18 | 标题「与 eng-coder 的分工界面（设计写作面归 eng-designer）」+ 指针「AGENT-LOOP（CLI 仓·设计）§18（本端交付协议节 = §8）」 | 融合——标题取**并集语义**；跨端指针以**注入**承载端差（契约 10） | 模型可见指令（分工表述 + 跨端指针）· 对外契约无涉 | **已裁**「按建议」· 已落地 `thincoder-core/prompts/persona-engineering.md`（注入位语法待设计面定义） |

## 4. 对外契约影响

| # | 条目（契约点） | 类 | 归一变更 | 兼容形态（§2.12.1 模板） | 落地物（档:行 / 用例名 / CHANGELOG 条目） | 裁定状态 |
|---|---|---|---|---|---|---|
| 9 | 提示词面指令集（`discipline-engineering` · `discipline-normal` · `persona-eng-coder` 三档） | 输出（模型可见指令） | 并集化 + 端特有段注入 | 逐条登记（§2.5 #117–#119）+ 端特有段保留 | `PROMPT-SYSTEM.md` 同步 + 核内档 + 装配用例 | 已裁 · 按建议（§2.5.1 A16–A18） |

## 5. 受影响文件（该子系统）

指针（不复制）→ `CORE-UNIFICATION.md` §2.8 下列行：

**核提示词面（S1 新建）** · **核提示词加载面（S0a 首建 · S1 随裁决面补齐）** · **提示词加载面（S2 删 / S2 改）**（7 行——**6 行「S2 删」**〔`prompt-overlays.mjs` 两行 + `advisor.mjs` / `advisor/main.mjs` / CLI `tools/shared.mjs` / `agent/setup.mjs` 四行〕· **1 行「S2 改」**〔VSC `thincoder-vscode/src/tools/shared.mjs`——拆壳薄壳保留〕）

**提示词副本删除（S2 / S3）** · **产品文档（S2 改）** · **产品测试（S2 改）**。

## 6. 机制面

### 6.1 提示词承载与落笔分工（现行）

- **提示词 = 产品代码面 ⇒ 单笔域 = eng-coder**（内容依据 = 机制文档）；无「中文设计面」一支；父侧改提示词 = 改产品代码，走 coder（判据 A，2026-10-18 23:01 裁定）。
- **唯一副本** = `thincoder-core/prompts/`（16 档）+ `thincoder-core/tool-docs/`（54 档）——运行期加载面（承 F8）。
- **公共层（`thincoder-core/prompts/common.md`）节级结构** → 需求档 `docs/core/requirements/PROMPT-SYSTEM.md` §2.3（**逐节大纲**：每节管什么；正文在 `thincoder-core/prompts/common.md`）——**本档不复制**（D2）。
- **行为纪律面的落点形态**：**既有节内增列**（不新增节 ⇒ 零 `##` 块计数连带）；应用实例 = 破坏性命令红线落 `thincoder-core/prompts/common.md` §10 尾部（→ §7 D-PS5）· 「不可裁决」自止点落 `thincoder-core/prompts/common.md` §8「上行通道」节内（→ §6.7 · §7 D-PS7）·
  **台账治理纪律落 `thincoder-core/prompts/persona-engineering.md`「派发与收尾纪律」节内**（→ §6.8 · §7 D-PS9）· **派单尺寸与任务书形态纪律落 `thincoder-core/prompts/persona-engineering.md`「实施委托结构化」节内**（→ §6.9 · §7 D-PS10）· **测试层级知识落两模式纪律档**（`thincoder-core/prompts/discipline-engineering.md`「测试纪律」节内 ∥ 

  `thincoder-core/prompts/discipline-normal.md`「测试与交付」节内——→ §6.10 · §7 D-PS11 ∥ D-PS13）·

  **轻通道机制落 `thincoder-core/prompts/discipline-engineering.md`「基本流程」节内（机制规则）+ `thincoder-core/prompts/persona-engineering.md`「派发与收尾纪律」节内（父侧行使）**（→ §6.12 · §7 D-PS12）· **提示词面收正批三件（说人话纪律 ∥ 轮次界 = 收口 ∥ D 清单位同步）落位**（→ §6.13 · §7 D-PS14 ∥ D-PS15 ∥ D-PS16）· **多仓操作机制落三处**（公共层「批次档常识」节内 ∥ 工程纪律层「文档与台账自持」节内 ∥ 

  人格层「项目状态档」节内——→ §6.14 · §7 D-PS17）·

  **公共仓读取读侧句落两模式纪律层自持节内**（工程 ∥ 普通——→ §6.15 · §7 D-PS20 ∥ D-PS21）· **纪律线五笔落三档**（① ② `thincoder-core/prompts/common.md` ∥ ③ ⑤ `thincoder-core/prompts/discipline-engineering.md` ∥ ④ `thincoder-core/prompts/persona-engineering.md`——①②④⑤ = 既有节内增列；③ = 新增节〔先例 §6.16〕；→ §6.17）·

  **用户视角门落两模式纪律档**（`thincoder-core/prompts/discipline-engineering.md` ∥ `thincoder-core/prompts/discipline-normal.md`——两侧各新增节〔`## 交付报告` 节前〕；→ §6.18）· **台账关联条目合并扫描落 `thincoder-core/prompts/persona-engineering.md`「台账」节「批设计」条内**（既有条扩展 ⇒ 零 `##` 块计数连带；→ §6.19 · §7 D-PS25）·

  **台账治理纪律增补（五条 + 两笔同窗收正）落 `thincoder-core/prompts/persona-engineering.md` 两节内 ∥ `thincoder-core/prompts/persona-eng-designer.md` 同族句换写**（既有节内增列 / 换写 ⇒ 零 `##` 块计数连带；→ §6.20 · §7 D-PS26 ∥ D-PS28）·

  **落笔携 why（D9「知其然知其所以然」）落 `thincoder-core/prompts/common.md`「文档写作纪律」节 + `thincoder-core/prompts/discipline-engineering.md` 两档 D 清单**（既有节内增列 ⇒ 零 `##` 块计数连带；详解 = `docs/core/design/DOC-DISCIPLINE.md` §1 D9 块——本档不复制）·

  **普通模式工作管理统一落普通侧三档**（`thincoder-core/prompts/discipline-normal.md` 新增节〔工作管理——批次档 + 台账 + 收口〕∥ `thincoder-core/prompts/persona-normal.md` 设计师席句〔节内〕∥ `thincoder-core/prompts/common.md` 六段作者行按模式分辨〔节内换写〕——→ §6.21 · §7 D-PS29）·

  **产品常识（配置项必须有配置界面）落 `thincoder-core/prompts/common.md` 档末新增第 16 节**（用户定则——→ §6.22 · §7 D-PS30）·
  **提示词缺句收正两笔（查重「同类」定形 ∥ 多仓条扩「工具路径参数」）——`thincoder-core/prompts/persona-engineering.md` ∥ `thincoder-core/prompts/discipline-engineering.md` 既有条就地改写**（零 `##` 块计数连带）·

  **轻通道代码笔通路句（开轮挂账 ⇒ 直改放行 ∥ 轮次行标记 = 闸凭据）落 `thincoder-core/prompts/persona-engineering.md`「派发与收尾纪律」节内**（既有节内增列 ⇒ 零 `##` 块计数连带；→ §6.12）· **上抛前先读档 + 携已查证据行落 `thincoder-core/prompts/common.md`「上行通道」节内**（既有节内增列 ⇒ 零 `##` 块计数连带）·

  **台账治理增补 v2（清账轮三条——锚点复核 ∥ 族行 ∥ evidence 指针化上限）落 `thincoder-core/prompts/persona-engineering.md` 两节内**（既有节内增列 ⇒ 零 `##` 块计数连带；→ §6.23 · §7 D-PS31）·
  **安全纪律（五条携 why）落 `thincoder-core/prompts/common.md` 档末新增第 17 节**（两模式同文——受众 = 两模式 + 全部子代理；→ §6.25 · §7 D-PS36）。

  **跨仓勘察义务三句落四处**（义务〔工程纪律层设计步〕∥ 形态〔设计席人格 8 项 item 1〕∥ 派单〔主 agent 人格层「派发与收尾纪律」〕∥ 核查〔设计评审标准第 10 条〕——既有节内增列 / 就地扩条 ⇒ 零 `##` 块计数连带；→ §6.26 · §7 D-PS37）。
  **联网查证指导（何时必查 · 够没够 · 查不到）落 `thincoder-core/prompts/common.md`「工具观」节内新增 `###` 子节**（既有节内增列 ⇒ 零 `##` 块计数连带 / 标题节点 22 ⇒ 23；→ §6.28 · §7 D-PS39）。

  **上下文自掌舵（工具观新子节）落 `thincoder-core/prompts/common.md`「工具观」节内新增 `###` 子节**（既有节内增列 ⇒ 零 `##` 块计数连带 / 标题节点 23 ⇒ 24；→ §6.29 · §7 D-PS40）。
  **发起权口径补定义（整批令定义 ∥ 推进句条件化）落 `thincoder-core/prompts/persona-engineering.md` 两节内**（§发起权边界 节内增列 ∥ §推进与叫停 既有条就地改写 ⇒ 零 `##` 块计数连带；同一概念一律称「发起」〔`开火` ∥ `发火令` 两名归一〕）。

  **异步并发认知与 `wait_for` 判断落三档四处**（① ② `thincoder-core/prompts/common.md` 两节内增列 ∥ ③ `thincoder-core/prompts/discipline-engineering.md` 既有条就地改写 ∥ ④ `thincoder-core/prompts/persona-engineering.md` 节内增列 ⇒ **零 `##` 块计数连带 ∥ 零标题节点连带**；同一事实三层各点一次 = 关键锚点重复〔先例 §6.7 · D-PS7——各层须能独立阅读〕；→ §6 末紧凑登记 · §7 D-PS41）。

  **禁类写法改因面（提示词面 16 档）→ §6.32 · §7 D-PS42**（逐项 44 项 + 标题 4 项；改写 = 实施轮 coder；逐档体量基线 = §6.32「基线」节）。
- **变更流**：改规则 → 先改机制文档 → coder 依它改 EN（产品代码面；复用存量词句、语义对等）。提示词档免档位判定（`.md` 结构尺度）。承载面本体（唯一副本 / 加载面）见 **§8**（本处不重述——D2）。
- **批次收尾核对（内容漂移防线）**：提示词面批次收尾加一步**一次性**比对——**落地档 ↔ 当批设计围栏块**（逐行；围栏内为档宽折行时，按**去折行后的段**比对）；**零常驻锁、零新增断言**（内容在场判据 = 散文锚，禁新增）。合法改档以**当批**围栏块为新基线——本步守「当批一致性」，不冻结演进。
- **提示词零维护者注**（编写纪律 #15）：出处 / 日期 / 批次名 / 评审号一律进设计档不进提示词（语义生效边界除外——保语义去日期注）。

### 6.2 装配实现事实

- 装配 = **整文件拼接**（`thincoder-core/prompt-overlays.mjs` 槽位表驱动；common 恒第二位、**主链七场景**全部注入）——**零段落级解析**：增 / 删节不影响装配代码（增删节类变更 = 零运行时代码改动的充分条件）。
  **槽位模型**（与 `prompt-overlays.mjs` 头注同轴）：persona → common → discipline → **[4] 子代理层**（`thincoder-core/prompts/subagent-base.md`——eng-coder / eng-designer / explore / coder / plan 五场景行末装配）；**AGENTS.md / skills = 槽位外尾块**（无编号——装配于槽链之后的既有尾部逻辑）。
- 槽位装配矩阵（**九场景——主链 7 + 特殊模块 2**）与降级链（缺文件 ⇒ 槽空缺 + 警告，**不 fallback**）→ 详述 = `docs/core/requirements/PROMPT-SYSTEM.md` §2.6（装配逻辑——四槽固定序 + 矩阵 + 降级链）（本档不复制——D2）。
- **装配之后的运行期追加面**：项目指令块（不分 depth）与 skills 尾块（depth-0）——`thincoder-core/agent/setup.mjs:281-284` ∥ `:285-294`；
  以及**派单固块**（spawn 级固定机制性指令，如批次档路径行 / 审计模板；拼接位 = 槽位装配之后、项目指令之前）——字段 `child._spawnSystemBlock`、拼接点 `thincoder-core/agent/setup.mjs:231` 之后；**机制单源 = `AGENT-LOOP-SUBAGENT.md` §6.26，本档不复制**。

### 6.3 端特有段与多实现面纪律

- 各实现面（CLI / VSC / 核内提示词面）**语义同源、原文自持**：端特有段**原地保留**、不加面间同步依赖、差异如实上报（多实现面纪律；CORE-UNIFICATION 契约面）——**例外：端差默认 = 消**（机制面差异 ⇒ 归核单源 / 两端口径统一）；**用户可见端差 = 缺陷（唯一例外 = 宿主能力面，须实证）**；
  本纪律只述实现形态，✗ 不构成差异保留依据；差异登记面 = 记录已裁的宿主能力例外项。
- **端特有段（现体）**：提示词面**现余 0**——三示例段（池规则 / Multi-Task / 实现纪律）内容现体均在核内（`thincoder-cli/src/prompt-injections.mjs:9-11` ∥ VSC 端同形——提示词面注入锚全消），逐段落点：
  `thincoder-core/prompts/persona-engineering.md`「Parallel dispatch & multi-task」（`:186` 起——多任务派发 + `agent.poolLimits` 池规则同节 `:190`）·
  `thincoder-core/prompts/persona-eng-coder.md` 实现纪律（`:17` 不得静默降级 / `:23` 收尾自审）。
- **遗留注入锚（工具面 2 锚）**：`bash-terminal-face` · `question-ui-face`（锚位 = `thincoder-core/tool-docs/bash.md:15` ∥ `thincoder-core/tool-docs/question.md:11`；
  取值表 = `thincoder-cli/src/prompt-injections.mjs` ∥ `thincoder-vscode/src/prompt-injections.mjs` ∥ `thincoder-desktop/src/main/prompt-injections.mjs`——三端面枚举齐：CLI ∥ VSC ∥ 桌面）。
  `bash-terminal-face` 处置 = **已激活**（运行时执行器身份声明，机制单源 = 本层 `BASH-EXECUTOR-FACE.md`）；
  `question-ui-face` 处置 = 待工具面 review。

### 6.4 byte-identical 取消（设计锚为准）

- 两端 `src/prompts/` 的 **byte-identical 机械约束取消**（不再强制字节相同、不需同步脚本）；替代 = **设计锚机制**：镜像锚文本在设计文档逐字定稿（权威源）——实现面照抄——差异暴露靠设计评审 + 交付审计 + 语义锚（内容断言各端自持）。
- byte-identical 相关机械比对断言 / 同步脚本全部清理；**散文锚断言亦已按测试纪律退役**（`docs/core/design/TESTING.md` §5）——现行守护 = 行为面断言 + 结构机检（语义锚不得新写为散文锚）。
- **保留的非镜像字节断言**：advisor-design 档硬加载逐字节（防静默降级）· 前缀缓存字节断言（会话面）。

### 6.5 现状坐标

- 运行期槽位 = `thincoder-core/prompts/*.md`（16 档）· 工具描述 = `thincoder-core/tool-docs/*.md`（54 档）；加载面 = `thincoder-core/prompt-files.mjs` + `thincoder-core/prompt-overlays.mjs`。
- 唯一副本 = `thincoder-core/prompts/*.md`（16 档）。
- **端侧装配面**：CLI = `thincoder-cli/bin/thincoder.mjs` 入口首步 `configurePromptInjections(CLI 表)` + `thincoder-cli/src/prompt-injections.mjs`；
  VSC = `thincoder-vscode/extension.mjs` `activate()` 首步 `configurePromptInjections(VSC 表)` + `thincoder-vscode/src/prompt-injections.mjs`；工具描述装载根两产品同指核 `loadToolDoc`（CORE-UNIFICATION §2.13.2 / §2.13.8）。

### 6.6 提示词面禁带文档引用（机判锁）

**裁定**：「提示词中根本不应该出现对文档的引用，这个类东西是要清干净的。」——**删引用（非改址）**；句义保留。
**上位原则回指**：需求面第 16 条（`docs/core/requirements/PROMPT-SYSTEM.md` §4-16）= 本节判据的上位原则——**提示词与文档分属两界**：运行时环境读不到文档 ⇒ 提示词内一切文档引用 = **运行时死文本**；合法所指白名单（五类）见需求条，本节不重述（纪律D2）。

**判据线（三条件全中 = 文档引用）**：① 指向对象 = 文档（档名 / 节号 / 指路句）；② 删后句义自足（引用不承担行为语义）；③ 位置 = 模型可见面（提示词装配文本 · 工具说明 / schema 文本 · 回给模型的串 · 注入提醒）或同因人读串（日志 / 告警）。

**判保留面（操作数族 · 规范豁免串 · 三面逐字一致）**：`AGENTS.md` · `SKILL.md` · `README.md` · `MANIFEST.md` · `.thincoder/advisor.md` · `project_rules.md`

——四类逐处给理由：行为操作数（`AGENTS.md` / `SKILL.md` / `.thincoder/advisor.md` / `project_rules.md`）· 路径操作数（`docs/README.md` 地图探测址 · `docs/batches/<batch>-<topic>.md` 路径形 · `design/<board>.md` 落点 · 槽 loader key）。

扩展名字面量（`".md"`）· 协议自名（段号 `§1`–`§6` 及其下级两段形——**判据 = 指称**本协议自身对象，非形状；指外部文档者一律入引证面）· `MANIFEST.md` = manifest schema `$anchor` 数据锚（非模型面）。
**注释面不在本面**（`//` / `/* */` / JSDoc 的节号族 = 独立面，另批治理）。
**人读面外沿**：日志 / 告警（同因串）在内；CLI usage/help 等其余用户可见文案 = **界外**（非模型面 · 非同因串面）。

- **域** = `thincoder-core/prompts/**` + `thincoder-core/tool-docs/**` （提示词面 + 工具描述）与三包生产码字符串 / 模板字面量（排除 `test/**` · `_archive/**` · `docs/**` · `scripts/**` · `.thincoder/**`；注释按行剥离）。
- **J1**：`[A-Z][A-Z0-9-]{2,}\.md` 零命中；白名单 = 判保留面操作数族规范豁免串（`AGENTS.md` · `SKILL.md` · `README.md` · `MANIFEST.md` · `.thincoder/advisor.md` · `project_rules.md` · `RTM.md`——`.thincoder/advisor.md` 与 `project_rules.md` 为小写形，J1 天然不命中；`RTM.md` 为大写名、J1 必命中，入白名单是功能必需；`MANIFEST.md` = manifest schema `$anchor` 数据锚，非模型面）；小写两名对 J3 同构豁免（逐行先删 CANON 子串再扫——见 J3 条）。
- **J2**：`§` + 子节号 / 两位数号零命中；**批次档段号 `§1`–`§6`（及其下级两段形）为合法正例**（判据 = 指称本协议自身对象）；转义点形（`§19\.6`——正则字面量专属）由 `(?![\d\\.])` 守卫天然不命中——非独立豁免条目。
- **J3**：提示词面小写档名（`[a-z][a-z0-9-]*\.md`）零命中——**豁免 = 逐行先整串删除七名 CANON 操作数子串（判保留面规范豁免串 · 与 J1 白名单同构）再扫剥离后行文**；路径形（`<…>` / `*` 紧邻）与全大写形天然不命中。豁免依据 = 判保留面·操作数族的显式化（非新语义）；豁免面外同形 token（非 CANON 小写档名引证）照报。

**边界（机器不可分面 · 覆盖缺口登记）**：
- **裸档名**（无 `.md`，与代码标识符同形）不锁——靠逐处处置表 + 评审守。
- **J3 代码面（机检式与本席读数）**：J3 的域已含三包生产码的字符串 / 模板字面量（见上行「域」行），实现只扫提示词面（`scripts/prompt-refs-check.mjs` 的 `lineHits` 对 `face === "code"` 不跑 J3）⇒ 代码串内的小写档名不落任何一式。
  - **判据句**：代码面命中 = 剥注释后、引号 ∥ 模板字面量内、whole-token 小写档名（左界不接字母数字与 `_ . - /`），先删七名 CANON 操作数子串再扫；判保留面（槽 loader key · 文件表 · 路径操作数）不处置，只登记。
  - **本席读数**（新进程 · 三包 459 档）：命中 **69 处，全在 `thincoder-core`**；`thincoder-cli/src` 0 · `thincoder-vscode/src` 0。逐类 = 槽 loader key 59 · 实现表 9（`doc-check/anchors.mjs` 类名表八名 + `agent-tools/spawn-gates.mjs:135` 一名）· 模型可见路径串 1（`agent/setup.mjs:262` 报缺文件名）。处置 = 69/69 **保留**（操作数面），删 0 · 改形 0。
  - **机检式的落点**：同一条判据、同一个工具——把 `lineHits` 的 J3 分支放到代码面（该工具已逐档扫代码，J1/J2 已在代码面跑）。不另立第二套 J3 实现（D2）。
- **面级指路句**（无档名 / 无节号，如 `→ see the engineering-mode prompts`）：三式均不命中；存量 2 处已裁 = **删**（用户「这种话都不应该出现在提示词里」）——域内现余 0。

**落点**：纪律句落 `thincoder-core/prompts/common.md`「文档写作纪律」节（1 行；内容依据 = 机制文档，落笔 = eng-coder）。

### 6.7 「不可裁决」自止点（上行通道操作化）

**来源**：用户裁定「模型不能限制，还是在提示词方向做工作」。

**机制**：上行通道 in-scope 的「不可裁决」补一条**发现即触发**的自止边界——**发现两处要求互斥的那一刻即为「不可裁决」⇒ 立即 `ask`**（一句话摆冲突双方 + 你的倾向）；
不得自选一方解套；不得继续权衡、先做一轮再说；不得拖到最终报告——**不设权衡前置、不设配额**（用户裁定「满量先行」：先给足药量、过量再减；调参靠实测回拨）。

同族限定：各本地出口（降级交付 / 歧义注明）**不含冲突类**——冲突处置 = **正典层单源**（`thincoder-core/prompts/subagent-base.md`「**冲突类必发、不得拖终报**」；发现矛盾的要求 ⇒ 立即 `ask`）。

**分层归属判据**：判据本体 = 公共层（上行通道 in-scope）⇒ 操作化落同节（D2 单一权威源；公共层恒第二位 = 全角色覆盖）；
子代理角色面 = **正典层 `thincoder-core/prompts/subagent-base.md`**（受众 = 全部子代理角色——「向谁问」与冲突处置的单源面；槽位 [4] 装配）；人格档本地出口（eng-designer 的回合预算句 / plan 的歧义注明句——就近落各档本地）**不承载冲突限定**；
工程纪律层零增补（其「途中前提失效 ⇒ 上游 `ask`」与公共层同向，无新出口需堵）。

**落点**：`thincoder-core/prompts/common.md`（自止点：`thincoder-core/prompts/common.md`）+
**正典层 `thincoder-core/prompts/subagent-base.md`**（槽位 [4]——全部子代理角色装配：「向谁问」/ 决策级四类 / 冲突类必发不得拖终报）；
逐字文本 = 设计围栏块（一次性材料不混入本档）；零新增节（`##` 块计数随正 ⇒ T-CL1 无连带）。

**机检**：引用锁 T9 · T-CL1 照常适用；**不新增断言**（内容在场判据 = 散文锚，禁新增）——在场以一次性逐字比对核。
**边界**：模型门控 / 配置项 / loop 探测机制零加（用户裁定不可扩）；主会话（无父侧通道）的同类边界不涉（其冲突处置住「指令优先级」节——现状零动）。

### 6.8 台账治理纪律（做还是记 + 池面 triage）

**来源**：用户提问「你那条台账治理纪律是不是更应该进提示词啊？」——父侧实核 = 属**行为纪律**（处置时的「做还是记」判断），活面 = 提示词层（先例 = *Dispatch truthfully* / *No zero-text endings* 同层人格档）；记忆面退为备份。

**机制（三层判断）**：① **能当场做的当场做**（评审 / 扫尾产出的一次性小形态项 = 措辞 / 坐标 / 索引 / 清理 ⇒ 当场修掉、不进池）；② **进池的才是真债**（需独立轮次 / 有条件 / 需设计）；③ **处置前先对池面陈年条目 triage**（已落地 ⇒ 追认核销——核销两源见 `docs/core/design/LEDGER.md` §3；前提消失 / 重复 ⇒ 废弃）。

**分层归属**：落 **`thincoder-core/prompts/persona-engineering.md`**（主 agent 唯一消费——处置 / 入池写权面；子代理非受众）「派发与收尾纪律」节内 **`欠账入清单` 邻位**（*Debts go on the list* = 同族前句——新句限定「什么才算欠账」；两界原则：零文档引用 ✓）。

**落点（唯一副本 = `thincoder-core/prompts/`）**：`thincoder-core/prompts/persona-engineering.md`（*Debts go on the list* 行后增一行）——**既有节内增列**（零 `##` 块计数连带 ⇒ T-CL1 无涉）；逐字文本 = 设计围栏块（一次性材料不混入本档——D2）。

**机检**：引用锁 T9（新句与连带项零文档引用）· T-CL1（块计数守恒）· 维护者注反证照常适用；**不新增断言**（内容在场 = 一次性逐行比对核——设计围栏块 ↔ 落地档，含连带两项；承 §6.1「批次收尾核对」）。

**边界**：零机械门（承「为臆想的失败逐点加限制 = 反模式」之裁）· 不改台账机制本体（写命令 / 状态机零动）· 不落公共层 / 纪律层（子代理非受众——台账写权仅主 agent）· 不重述攒批工作流（只补「做还是记」判断）· **「父侧不代笔」交界**：「当场修掉」不越三类例外（自有写域 / 机械形态收正 / 小修改）且照**打标义务**（注明「父侧直接执行」+ 可 revert——`thincoder-core/prompts/persona-engineering.md:73-74`）。

### 6.9 派单尺寸与任务书形态纪律（三闸 + 表形态 + 禁令携后果）

**来源**：用户裁定——裁定 A（落点）；**落笔 = eng-coder（依据 = 本节设计）**；**追加第 4 条纪律**（任务书 = 表，不是散文；措辞可润色、语义不得增删）。
**第 5 条纪律（禁令携后果）** = 用户 2026-10-19 11:56「我希望你在spawn子agent时也要做到知其然知其所以然」+ 14:06「加」，台账 `#1703`。

**机制（五条）**：① **一舱一单面**——实施舱的 `files` 声明面 ≤15 档且不跨变更面，跨面 ⇒ 按面拆舱；② **预检三闸**——档数 >15 ⇒ 拆 · 跨面 ⇒ 按面拆 · 未决口径落在实施面内 ⇒ 先裁（不许留给实施者「视情况」）。

③ **结构决定归设计 / 派单**——拆分边界 / 落点 / 形状在设计期定死，实施者只照表落码，留给实施者的开放结构决定 = 读循环的入口；④ **任务书 = 表，不是散文**——核心 = 逐行动作表（动作 / 落点 file:line / 期望），散文只留目标与边界；「先读档清单」自身计入探索预算，预算与阅读面自相矛盾的任务书 = 派单缺陷。
⑤ **禁令携后果（派单禁令也带 why）**——任务书里的「别碰 X」后面必须跟「碰了会怎样」：没写后果的禁令，执行者只能照字面躲，躲过了父侧本来允许的边界（白丢效率），也躲不过父侧没写出来的那个坑（真出事）。

**与既有 why 条的关系**：同节既有 why 条（`thincoder-core/prompts/persona-engineering.md`「The `why` in a task book must carry the reasoning」）管整份任务书——规则要带理由；本句只管**禁令面**——禁令要带后果。**补句，不是改写**（原条逐字不动）。

**实测**：禁令集中在 `designPoints`（字段定义逐字 = "design points & forbidden scope"）——用户 2026-10-19 派单七舱，每舱都写「只做这个、别碰那个」，无一条写后果。实例留说明面、不入落盘文本：某舱禁碰 `#1566`，那一舱正在改的是 `core-run.mjs`——台账号与仓内文件名在任何他仓会话里都不可解析（同 §6.10「口径」段：新文零具体项目实例）。
**终稿逐字（中文 = 语义权威；英文落面见下行围栏块）**：
> **禁令也要带 why**：派单里的「别碰 X」后面必须跟「碰了会怎样」——没写后果的禁令，执行者只能照字面躲：**躲过了你本来允许的边界，也躲不过你没写出来的那个坑**。正反例——反：「别碰 X」；正：「别碰 X——另一个实施舱正在改同一份文件，你的编辑会被它覆盖，两边都白干」。

**英文逐字围栏块（实施席原样落 `thincoder-core/prompts/persona-engineering.md` 该条行后——1 行，逐字不改；收尾对账基线 = 本块）**：

```
- **A prohibition also carries its why**: a dispatch's "don't touch X" must be followed by "what happens if it is touched" — a prohibition without its consequence leaves the executor to dodge the literal words: **it dodges the boundary you did allow, and does not dodge the pit you did not write 
  down**. Positive vs negative — ✗ "don't touch X"; ✓ "don't touch X — another coder is editing that same file, your edit gets overwritten by their save and both runs are wasted".
```

**分层归属**：落 `thincoder-core/prompts/persona-engineering.md`「实施委托结构化（任务书 + spawn 参数）」节内——主 agent 唯一消费（派单写权面；子代理非受众）；锚点见下「落点」段。
四问：① 人格层（谁派 / 派多少 / 派成什么形态）；② 属工程模式派单行为、非两模式协作基础（公共层不取）；③ 不以纪律层承载（子代理非受众 + 与人格层重复）；④ 项目相关、形态为提示词行为纪律 ⇒ 人格层；落点文本零文档引用 ✓。

**落点（唯一副本 = `thincoder-core/prompts/`——定位 = 节名 + 条文本，行号只作参考读数）**：`thincoder-core/prompts/persona-engineering.md`「Implementation dispatch structure (task book + spawn params)」节内（六字段末行后增 **4 行**——实施轮 coder 落笔）。

同一档、同节（*Sized dispatch without these parameters is a defect* 行后增 **内容 4 条（EN 物理 5 行——第 4 条折行）**——实施轮 coder 落笔）；逐字文本 = 设计围栏块（一次性材料不混入本档——D2）。

同一档、同节（既有 why 条 *The `why` in a task book must carry the reasoning, not just the order* 行后增 **1 行**——实施轮 coder 落笔；该条逐字不动，**补句不是改写**）；逐字文本 = 上方「英文逐字围栏块」（唯一副本 = 本节——D2）。行号参考读数 = `:170`（2026-10-19 实读）；§6.17 记实施委托段在 `:136`（`:417`）已漂 ⇒ **落笔前按条文本复核，行号不作定位依据**。

**机检**：**不新增断言**（「不因单次改动而增补」测试纪律）——在盘核 = 一次性 `includes` 读数；**内容判据 = 落地行与上方英文逐字围栏块整行相等**（只判行数时，正文丢了后果小句仍全绿）；同核该档恰多 1 行、既有 why 条与六字段逐字零改。英文面零连带（零 `##` 块新增 ⇒ 块计数无涉、零注入锚 ⇒ 锚集合无涉、零文档引用 ⇒ 引用锁无涉）。

**边界**：零机械门禁（尺寸上限不落 `files` 校验代码——上限属判断面，承「为臆想的失败逐点加限制 = 反模式」）
· 不改 spawn 门禁语义（`batchDoc` 必传 + 六字段 `validateTaskBookFields` 零动；第 4 条约束内容形态、不机械校验）
· **本笔只增 1 句**——提示词面除该行外零改（既有 why 条 *The `why` in a task book must carry the reasoning* 逐字不动——行号不作定位依据）
· 新句不落校验代码（后果 = 写作判断，非机器可判）。

**勘察证据行**：已查 `docs/core/design/DOC-DISCIPLINE.md` D9（`:23` 表行 ∥ `:64` 细则——本句 = D9 在派单面的一次应用，判据本体零动）
· 需求档 `docs/core/requirements/PROMPT-SYSTEM.md`（「禁令」∥「派单」∥「后果」三词全档共 1 命中 = `:174` 勘察义务条，无「禁令后果」条）
· 本档 §6.8（`:224`–`:235` 既有节内增列形）∥ §6.32（`:950` 勘察行 ∥ `:952`–`:957` 先例行既有形）∥ §6.33（`:1195` ∥ `:1197` 同形）

· `thincoder-core/prompts/persona-engineering.md`（节名 `:153` ∥ 既有 why 条 `:170` 现状逐字）。
除上述无其他相关公共源——已查无。

**先例 ∥ 偏离**：先例 = §6.8（`:224`–`:235`）∥ §6.19（标题 `:448`）的「既有节内增列 · 零 `##` 块计数连带」形——本笔对齐（同节增 1 句，块计数与标题节点零变）；偏离 = 只增 1 句、不带机检锁，理由 = 后果写没写、够不够属写作判断，落成校验字段只会得到形式化填空（偏离须给理由之形 = §6.32（`:952`–`:957`））。

### 6.10 测试层级知识（定义 + 放置）

**来源**：用户直令（「关于什么叫单元测/什么叫集成测试的知识也得进提示词」）。
逐字文本 = 设计围栏块（一次性材料不混入本档——D2）。
**扩展来源**：口径收正（用户）——「批次档概念不是工程模式专有，普通模式一样有，文档体系对什么模式都是一样的，工程模式和普通模式的区别不在于要不要文档体系，而在于是否强流程约束。」
⇒ 本知识非工程会话面独有 ⇒ 普通侧同知识落地。

**机制（两条知识）**：① **定义**——单元测试 = 单个组件隔离测（外部协作者打桩）——开发者改完即跑的反馈回路（「刚改的这处对了没有」）；集成测试 = 组件协同（真实组合）——上线前的验收回路（从用户能看见的入口把真实业务走一遍）。
② **放置（两类分述——禁合称「测试用例」）**——单元测试用例随批次档存（开发期工具——不占项目 `test/` 树）；集成测试用例与测试代码同住项目的 `test/` 目录。

**分层归属**：落**两模式纪律层**（文档体系对全模式同一——批次档非工程模式专有）——工程侧 `thincoder-core/prompts/discipline-engineering.md`「测试纪律」节内 ∥ 普通侧 `thincoder-core/prompts/discipline-normal.md`「测试与交付」节内（各以单元 ∕ 集成两条 bullet 定点并文）。
知识面两模式同源；**流程约束面按模式**（工程以结构强制、普通以纪律）——本机制只涉知识面，流程约束零搬迁。

四问：① 纪律层（该模式下怎么干活——测试是什么 ∕ 放哪）；② 非两模式协作基础（公共层不取）；③ 不以人格层承载（非角色边界）；④ 通用层内容（项目无关）。

**落点（四档——EN 两模式各一对）**：工程侧——`thincoder-core/prompts/discipline-engineering.md`（L65 ∕ L67）。
普通侧——`thincoder-core/prompts/discipline-normal.md`（L105 ∕ L106）——**既有节内增列**（零 `##` 块计数连带）；逐字文本 = 设计围栏块（D2）。

**口径（纯通用层）**：新文零具体项目实例（`test/` 为通用约定名——定稿原词）；现行节内既有实例 = **清出（甄别式——通用层全净）**：清 `docs/batches/` 硬路径 ∕ `node --test …` 命令形 ∕ 三前端名（→「前端口」） ∕ 「核包」（→「核心」）；留 `test/` ∕ 50–100 ∕ 「批次档 ∕ 批次目录」概念（非实例——定稿原词 ∕ 方法参数 ∕ 方法本体）。
普通侧扩展同守本口径（新增文本零具体项目实例——`test/` 为通用约定名、批次档 ∕ 批次目录为方法本体）。

**机检**：**不新增断言**（「不因单次改动而增补」测试纪律）——在盘核 = 一次性比对（落地档 ↔ 设计围栏块）；零 `##` 块新增 ⇒ 块计数无涉、零文档引用 ⇒ 引用锁无涉。
普通侧同规——在盘核 = 一次性比对（落地档 ↔ 该批设计围栏块）；零 `##` 块新增 ⇒ 块计数无涉；新增文本零文档引用（`scripts/prompt-refs-check.mjs` 复跑零命中）。

**边界**：清出限甄别式——不清方法本体 ∕ 定稿原词（留 `test/` ∕ 50–100 ∕ 「批次档 ∕ 批次目录」概念；清项见上「口径」）· **落点 = 两模式纪律档**（普通侧扩入；其余档零触）· **流程约束零搬迁**（普通侧只补知识——门 ∥ 轮次 ∥ 报告义务 ∥ 谁写谁跑等工程约束不入）· 不改测试机制本体（需求档零触）· 零机械门 · 不新增节。

### 6.11 工具描述面：外置统一与预算

**机制**：全工具（内置 / 元工具 / 实例绑定族）描述文本 = **外置单源** `thincoder-core/tool-docs/*.md`（54 档——枚举工具 53 ∥ 目录档 54），经 `DESC()` → `loadToolDoc` 单一解析面加载（`thincoder-core/tools/shared.mjs:19` ∥ `prompt-files.mjs`）；装配期动态装饰（role 后缀 / 池列表 / eng-child 变体——`agent/family-tools.mjs`）留码面（非描述本体）；写作契约（六要素）→ `TOOLS.md` §6.9。

**预算表（唯一权威处——本表；邻位只挂指针行 · D2）**：

| 项 | 读数 |
|---|---|
| 基线 | 103,529 字符（口径 = 逐档 `JSON.stringify({description, parameters})` 字符和——与机检同式） |
| 当前 | **143,572** 字符（= **1.387 × 基线**） |
| 目标 | ≤ 0.75 × 基线——**未达 · 报告态**（依「准比短重要 · 信息完整优先于字数」不硬削，读数上抛父侧裁） |
| 单档帽 | ≤ 8,000 字符——超限 = `subagent` **17,191**（契约事实保真下限；由在册（报告态））∥ `browser` **11,924**（交互面契约保真下限——16 动作族 + 引用/回执语义 + 权限门 + 错误面逐条在册；收身即丢模型可操作细节） |
| 面专属帽 | `thincoder-core/tool-docs/manifest.md` 面专属读数——帽值与算式住 `docs/core/design/MANIFEST.md` §2.10 尾「字段语义达用点」块；本表只挂指针，不载数值（D2） |
| top5 | `subagent` **17,191** ∥ `browser` **11,924** ∥ `git` 7,894 ∥ `ssh` 7,472 ∥ `batch` **6,553** |
| 机检 | `node scripts/tool-schema-size.mjs`（报告态 v1——只读读数，不入闸；复测 = 同式读数对读数） |

**边界**：表为读数与目标面——零机械门（预算不入闸）；描述逐字文本 = 内容依据机制文档、落笔 eng-coder；动态装配装饰面不在本表射程。

### 6.12 轻通道机制（细节面 ∥ 收敛面受控旁路）提示词落地

**来源**：用户三则（产品化要求 + 路由判据 + 记录在档）+ 三则（扩容——收敛面准入 ∥ 修复类直改 ∥ 收尾必全链（既有律重申）∥ 启动即挂账）+ 裁「走查反馈明示轻通道」+ 五裁（判据收口——降门槛 · 核销紧固）；需求档 = `docs/core/requirements/LIGHT-CHANNEL.md`。

**机制**：四步硬流程在**细节面 ∥ 收敛面**的**受控旁路**——成立条件 = 准入命中（三样清单：细节 / 美工 ∥ 缺陷修复 ∥ 走查当场）+ 一句边界（新机制 ∥ 大改 ⇒ 全链）+ 收尾全链闭合；误准入交收尾全链兜底（判据收口——核销不漏 = 第一优先级）；

旁路 ≠ 取消（收尾全链补齐设计形式化 ∥ 独立评审 ∥ 批准 ∥ 收口核销）。轻通道轮次 = 批档一本（逐笔收录；§5 不适用——实施面 = 父侧直改）；**启动即挂账**（开轮先建轮次批档 + 轮次台账行——账在前、笔在后）；收尾未落 ⇒ 不许核销。**机制设计 = `docs/core/design/LIGHT-CHANNEL.md`（本档不重述——D2）**。

**分层归属**：**机制规则**（准入三样清单 ∥ 一句边界 ∥ 附则 ∥ 轮次形（含启动即挂账）∥ 收尾形 ∥ 行使面 ∥ 边界）落 `thincoder-core/prompts/discipline-engineering.md`「基本流程」节内；**父侧行使细则**（交底句（面类槽 ∥ 判据半句）∥ 交底即行 ∥ 零链免交底 ∥ 改判 ∥ 越界停笔 ∥ 记账（含启动即挂账）∥ 代码笔通路句（开轮挂账 ⇒ 直改放行；

  含轮次行标记半句）∥ **轮次界 = 收口** ∥ 收口触发（提醒时点）∥ 跨会话接手 ∥ 核销对接）落 `thincoder-core/prompts/persona-engineering.md`「派发与收尾纪律」节内。
四问：① 机制规则 = 该模式怎么干活（纪律层）；② 非两模式共用协作基础（公共层不取）；③ 交底 ∥ 记账 ∥ 核销 = 父侧写权面独属动作（人格层——台账用法面同轴判例：写权独属动作不落纪律层）；④ 通用层内容（零项目实例）。

**落点（唯一副本 = `thincoder-core/prompts/`）**：EN 两档——逐处（档 ∥ 节 ∥ 形态）与咬合处置 = 机制设计档 §3；逐字文本 = 设计围栏块（一次性材料不混入本档——D2）。

**机检**：**不新增断言**（测试纪律「不因单次改动而增补」）——在盘核 = 一次性比对（落地档 ↔ 设计围栏块，批次收尾核对步）；新增文本零文档引用（`prompt-refs-check.mjs` 复跑）⇒ 引用锁无涉；既有节内增列（零 `##` 块新增）⇒ 块计数无涉。

**边界**：零机械门 · 批档 ∥ 台账机制本体零动（纯复用）· 产品码零触 · **默认面条款零改写**（铁律 ∥ 分流表 ∥ 确认与批准门——例外由新块内咬合句承载）· **单点撤件**：工程工具面直改硬约束 ②（「改判据语义 ⇒ 仍走设计」）撤——管辖面并入一句边界（直改硬约束 = 两条——判据收口定形）· 子代理零新义务。

### 6.13 提示词面收正批（面向用户表述 ∥ 轮次界 = 收口 ∥ D 清单位同步）

**来源**：用户「挂条需求，提示词里应该告诉 agent 该怎么说话，不要满嘴蹦黑话」（承两次指出讲解满篇行话）；「轮次界 = 收口」仅设计档载——需求 ∥ 提示词面未载；**提示词面 D 清单与机制档 D1–D9 同步**（D-PS16）。

**机制（三件）**：① **面向用户的表述纪律（说人话）**——面向用户（子代理 = 面向父代理）的回复与汇报以**可读可复述**为标尺：内部术语 / 代号 / 行话不得裸用（出现时随文一句白话解释）；已有名字的概念保持原名——换名让读者手里两个名字指向同一件东西；复杂机制先白话打底、再按需给精确细节；文档 / 代码 / 评审表按各自惯例不受此限。
② **「轮次界 = 收口」入文**——续笔归属：收口前的新笔 = 本轮续笔；收口后新笔另起新轮新档（规则本体已在 `docs/core/design/LIGHT-CHANNEL.md` §2.3——入文面落点）。

③ **文档更新纪律清单位同步 D8**——裁定 = **同步**：`thincoder-core/prompts/discipline-engineering.md` 两档清单补 D8 行（表头 ∥ 计数句 ∥ +1 行；D8 语义已住公共层「文档写作纪律」——清单位 = D 族全表）。

**分层归属**：① 公共层（受众 = 全角色——两模式 + 全部子代理均面向其用户 / 父侧说话；`thincoder-core/prompts/common.md` 恒第二位 = 唯一全覆盖范围）；② 父侧行使纪律（人格层「派发与收尾纪律」——轮次归属 = 主 agent 写权独属动作；子代理不路由本通道）+ 需求档（三链之链头）；③ 纪律层（工程模式清单面——清单位与设计族同数）。

**落点（唯一副本 = `thincoder-core/prompts/`）**：① `thincoder-core/prompts/common.md`「语言纪律」节内增列 1 段（`thincoder-core/prompts/common.md`）。
② `thincoder-core/prompts/persona-engineering.md`「派发与收尾纪律」节内增列 1 行（EN——收口触发行邻位）+ 需求档 `docs/core/requirements/LIGHT-CHANNEL.md` §2.3 增 1 条（主 agent 笔）。

③ `thincoder-core/prompts/discipline-engineering.md`「文档更新纪律」表头 ∥ 计数句 ∥ +D8 行（EN 一档）。逐字文本 = 设计围栏块（一次性材料不混入本档——D2）。

**机检**：**不新增断言**——在盘核 = 一次性比对（落地档 ↔ 设计围栏块，批次收尾核对步）；新增文本零文档引用（`scripts/prompt-refs-check.mjs` 复跑零命中）；零 `##` 块新增（① ② 既有节内增列 ∥ ③ 既有表增行 + 计数句随动）⇒ 块计数无涉。

**边界**：零机械门 · 既有提示词条款零改写（③ 清单位面 = 表头 / 计数句 / +1 行）· 不改任一 D1–D7 行语义 · 需求侧 D8 同步（`docs/core/requirements/ENGINEERING-MODE-V2.md` §13.1）不入册（在册 = 主 agent 域）⇒ **已落**（主 agent 域；D1–D8 在盘）· 产品码零触。

### 6.14 多仓操作机制（提示词面）

**来源**：用户（多仓操作机制入提示词——12 条 + 定界句）；缘起 = 多仓实操四事实（跨仓批档 fail-closed ∥ 站点仓 manifest 建档 ∥ 双项目并存写面须显式路径 ∥ 子代理禁跨仓写）。

**机制（条款集 → 三处落点）**：① 公共层「批次档常识」节内——**多仓按仓各自**（批档基根 = 会话锚的项目声明；跨仓建档被拒 = 正确行为；跨多仓任务 ⇒ 各仓分别建档、分别开批）；
② 工程纪律层「文档与台账自持」节内——**6 项续入**（多仓并存正常态（显式目标 / 列候选不代选 / 失败报告重试）∥ 仓 = 一个 git 仓（端 ≠ 仓）∥ 他仓六段机制条件（锚 + manifest）与首触（补层、记录落它本仓）∥ 他仓发现物路由 ∥ 跨仓只经接口耦合（含签入按仓各自）∥ 分仓 = 例外）；

③ 人格层「项目状态档」节内——**操作他仓前先建档**（轻动作；写权仅主 agent）。

**分层归属（四问）**：① = 批次档机制常识（两模式同一的文档体系；公共层 = 恒装配全角色覆盖）——落 §14 末；② = 「该模式下怎么干活」的机制操作规则（纪律层——受众多含工程子代理；既有自持节 = 本家族提示词落点，逐条续入）；③ = 主 agent 独属写权动作（manifest 写权 `writer:'main'` 专权、子代理不可达 ⇒ 不落共享层）。

**连带（旧落笔面收口）**：`docs/core/design/DOC-DISCIPLINE.md` §4.4「跨仓批派单与写域」提示词落笔面句随正——跨仓批派单**语义**以多仓泛化形随册落笔；「反查脚本一条」落笔未做（在册——去留归父侧裁）。

**落点（唯一副本 = `thincoder-core/prompts/`）**：三档：`thincoder-core/prompts/common.md`（§14 末增 1 段）· `thincoder-core/prompts/discipline-engineering.md`（自持节增 6 项 + item 5 删并）· `thincoder-core/prompts/persona-engineering.md`（项目状态档增 1 行）。
逐字文本 = 设计围栏块（一次性材料不混入本档——D2）。

**机检**：**不新增断言**——在盘核 = 一次性比对（落地档 ↔ 设计围栏块，批次收尾核对步）；新增文本零文档引用（`scripts/prompt-refs-check.mjs` 复跑零命中）；零 `##` 块新增（三处均节内增列）⇒ 块计数无涉。

**边界**：零机械门 · 产品码零触 · 普通模式提示词零触（多仓机制主体 = 工程机制面；批次档多仓常识经公共层 §14 达普通侧——如另需普通侧写目标纪律，另裁）· 既有条款语义零改 · 他批档零触。

### 6.15 公共仓读取的读侧纪律句（提示词面）

**来源**：用户（公共文档仓不被读取 → 公共模块仓同病 → 自持约束追问 → 跨仓引用必须可支持）；机制面（声明 `index.publicRepos` ∥ 检索接入 ∥ 跨仓引用解析）= `MEMORY.md` §6.15 ∥ `DOC-DISCIPLINE.md` §4.2.2 ∥ `LEDGER-SELF-CONTAINED.md` §4.1（本档只承载提示词落点）。

**机制（读侧句 → 两模式纪律层落点）**：① **自持读侧对句**——「自持管写；读取不限」（**工作目录树默认可查可读可引**；**越出工作目录的源按声明查**（项目 manifest `index.publicRepos`））+「实施 / 设计前先查声明源」+「**发现缺源 ∥ 噪声 ⇒ 随手补清单**」（agent 托管句——工程侧 ∥ 普通侧动词分列）；② **界句**——「跨仓只经接口耦合」条与「本句管耦合、不管读取」并入；③ **记录面声明源例外**——自持节 item 1「仓外指针同样禁止」句后随「声明源例外」（声明公共仓可引——仓名前缀形可核；其余照禁）。

**来源模型（用户确认）**：**默认来源 = 工作目录（会话 cwd）树**（零配置——检索 / 可读 / 可引）；**声明 = 微调**（越出 cwd 的源）；**与「声明为唯一钥匙」模型的差别（一句）：默认来源 = cwd；声明 = 微调**。清单维护者 = **agent**（非用户）——维护句落两模式读侧句（「随手补清单」轻动作）；写权面照 #827 ⑥ 判例（工程人格已载 manifest 建档句；子代理机械拒面在效——句面不另述）。**不造新工具 ∥ 不加机械门**（declared-sources 维护面限定）。

**例外 = `manifest` 工具**（`docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MANIFEST.md` ②.7 新增——agent 对 project-manifest 的全键读写出口；机制 = `docs/core/design/MANIFEST.md` §2.10）。

**分层归属（四问）**：读侧句 = 「该模式下怎么干活」的操作规则 ⇒ 两模式**各自纪律层**（自持家族既有落点，逐条续入）；不落公共层（非「两模式逐句都要的协作基础」——同 #827 判例）；不落人格层（非角色边界）。

**落点（唯一副本 = `thincoder-core/prompts/`）**：`thincoder-core/prompts/discipline-engineering.md`（自持节：item 1 续行 + item 12 句尾并入 + item 14 新增）∥ `thincoder-core/prompts/discipline-normal.md`（自持节 item 3 新增）。逐字文本 = 设计围栏块（一次性材料不混入本档——D2）。

**机检**：**不新增断言**——在盘核 = 一次性比对（落地档 ↔ 设计围栏块）；`scripts/prompt-refs-check.mjs` 复跑零命中；零 `##` 块新增（两档均节内增列）⇒ 块计数随正。

**边界**：零机械门 · 产品码零触 · 既有自持条款语义零改（只续句 / 例外句，不拆条）· 多仓写侧条款（#827）零改 · 引用解析实现不在本档（机制面）。

### 6.16 三层结构常识（提示词公共层）

**来源**：用户结构层令 +「这个三层结构是我最近得出来的经验，我也希望进 thincoder 的提示词体系」+「讲清道理……这是常识，每个模式和角色都该知道」+「可以，现在就跑」；需求 = `docs/core/requirements/PROMPT-SYSTEM.md` §2.3。

**机制**：三层结构常识（**板 → 域 → 档**）入公共层——**why** = 并行写冲突的因果（两件并行工作改同一批文件 ⇒ 互相踩；按域切开 ⇒ 隔离，冲突降到足够低）+ **判域口径**（总是一起动 ⇒ 同一份档；从不同时动 ⇒ 分开写——自旧条升层）+ **四条规矩**：① 域 = 并发隔离单位（并行的工作各动各域）· ② 域目录从第一天就立（哪怕单档）· ③ 拆分恒落域内（新档进同域目录——零跨域动 ∥ 零路径重排）· ④ 代码树与文档树同拍（模块镜像）。

**分层归属（四问）**：① 公共层——「两模式逐句都要的协作基础」：结构性常识，受众 = 两模式 + 全部子代理（用户明示「这是常识，每个模式和角色都该知道」）；② 非纪律层——非「该模式下怎么干活」的流程 / 规则，是任何角色建结构时都该知道的常识；③ 非人格层——非身份 / 边界；④ 通用层内容（零项目实例）。

**落点（唯一副本 = `thincoder-core/prompts/`）**：`thincoder-core/prompts/common.md`（档末第 17 节）。
同族条 = `thincoder-core/prompts/discipline-engineering.md`「按域分界」节 + 「板块归属」条。逐字文本 = 设计围栏块（一次性材料不混入本档——D2）。

**机检**：**不新增断言**——在盘核 = 一次性比对（落地档 ↔ 设计围栏块，批次收尾核对步）；`scripts/prompt-refs-check.mjs` 复跑零命中。

**计数连带（D3——列明处）**：① 需求档 `docs/core/requirements/PROMPT-SYSTEM.md` §2.3 标题 + 表行（数值以需求档为准）；② 计数断言 = 无存活断言；③ `thincoder-core/prompts/common.md` `##` 块计数随正。

**边界**：零机械门 · 产品码触面 = EN 代码两档 · 改动面 = `thincoder-core/prompts/common.md` 新增节 + `thincoder-core/prompts/discipline-engineering.md` 两处（「按域分界」节 ∥ 「板块归属」条）· 不新造机制 · 不重述既有条。

### 6.17 纪律线五笔（记忆→提示词迁移 · 第二堆）

**来源**：用户「该进的那几条进提示词」——采纳记忆→提示词迁移评估（第二堆 1–5 + 用词统一；简单清晰 = 正名版）。

**机制（五笔 · 纪律句补句）**：
- ① **简单清晰**——`thincoder-core/prompts/common.md` 语言纪律节内（一句话说一件事——主句在前 ∥ 少括号、不堆记号 ∥ 去「看起来很严谨」装饰 ∥ 存疑短说 ∥ 不给自己划豁免）。
- ② **不许假冒用户名义**——`thincoder-core/prompts/common.md` 诚实原则列表 +1 条（只有用户原话才算用户的话；推导一律标注为推断）。
- ③ **工程判断**——`thincoder-core/prompts/discipline-engineering.md` 新增节（六条：判定 ≠ 归因 ∥ 违用户裁定即缺陷 ∥ 缺陷只准用缺陷命名 ∥ 定量断言先工具复核 ∥ 小功能不配大机器 ∥ 修复设计满量先行——判定四条 + 设计两条）。
- ④ **任务书重导**——`thincoder-core/prompts/persona-engineering.md` 实施委托段 +1 条（任务书逐条自当批文档重导，禁转录）。
- ⑤ **一个东西一个说法**——`thincoder-core/prompts/discipline-engineering.md` 命名纪律邻位（同一个东西在所有面只用一个名——文档词 = 界面词 = 对话词，1:1）。

**分层归属（四问）**：① ② = 公共层（两模式 + 全角色共用协作基础——说话标尺 ∥ 诚实底线）；③ ⑤ = 工程纪律层（该模式下怎么干活——判定 / 量级纪律 ∥ 命名纪律族）；④ = 人格层（主 agent 派单写权面独属——子代理非受众）。

**形态（与 §6.1 落点口径的关系）**：既有节内增列 ×4（① ② ④ ⑤）+ **新增节 ×1（③）**——③ 在 §6.1「行为纪律面的落点形态」默认口径（`:166`）之外；先例 = §6.16（新增节登记在案）；依据 = 用户 17:58 采纳清单；不构成越界；计数连带照 D3 随动（下行）。

**落点（唯一副本 = `thincoder-core/prompts/` · 十处）**：
① `thincoder-core/prompts/common.md:9-12`；② `thincoder-core/prompts/common.md:23`；③ `thincoder-core/prompts/discipline-engineering.md` §Engineering judgment；④ `thincoder-core/prompts/persona-engineering.md:136`；

  ⑤ `thincoder-core/prompts/discipline-engineering.md` §Doc discipline「One word per thing」。逐字文本 = 设计围栏块（一次性材料不混入本档——D2）。

**计数连带（D3）**：③ 新增节 ⇒ `thincoder-core/prompts/discipline-engineering.md` `##` 块计数随正（单份）；② = 诚实原则列表内 +1 条（零计数面）；① ④ ⑤ 零 `##` 新增。

**机检**：`scripts/prompt-refs-check.mjs` 命中 0；**不新增断言**（内容在场 = 一次性比对——设计围栏块 ↔ 落地档，批次收尾核对步）。

**边界**：零机械门 · 提示词六档内容 = 用户采纳清单 · 需求档零笔（限本批射程——§2.3 计数面无涉；common 节数 **19**〔口径 = 行首 `##` 节计数〕未变）· 他批零触。

### 6.18 多过一道用户的眼（用户视角门 · 两模式纪律档）

**来源**：用户走查四连后提问「这类审查应该放在哪个环节合适」＋「补进[到]提示词系统里」＋「可以」（第三稿条款 ＋ 两模式范围批准）。

**机制**：界面或交互的改动，交付前多过一道「用户视角」——① **设计轮**：交付里写清自查结果
  （像一个每天都在用这界面的挑剔用户那样过一遍：哪里别扭 ∥ 哪里要来回找 ∥ 哪里得猜 ∥ 哪里少了本来该有的东西；这类判断你本来就有，别只对机制；拿不准的偏好，摆出来问）；
  ② **收口轮**：实际看一遍（截图或实机走查，必要时请用户复核）；**机检全绿不等于交付**。普通档同义——标签按普通语境（设计时 ∥ 收尾前）。

**分层归属（四问）**：① 纪律层（「该模式下怎么干活」——交付前用户视角检查；受众 = 两模式主会话 + 各自子代理）；② 非公共层（非「两模式逐句都要的协作基础」）；③ 非人格层（非身份 / 边界）；④ 通用层内容（零项目实例）。

**形态（与 §6.1 落点口径的关系）**：两档各**新增节**（`thincoder-core/prompts/discipline-engineering.md` ∥ `thincoder-core/prompts/discipline-normal.md`——`## 交付报告` 节前；`##` 块计数 9 ⇒ 10 ∥ 6 ⇒ 7）；
  在 §6.1「行为纪律面的落点形态」默认口径（既有节内增列）之外；先例 = §6.16 ∥ §6.17-③；依据 = 用户批准稿（条款自带设计/收口两轮——单一既有节无跨轮承载位）；不构成越界；计数连带照 D3 随动（下行）。

**落点（唯一副本 = `thincoder-core/prompts/`）**：`thincoder-core/prompts/discipline-engineering.md`（`:73` 节前）∥ `thincoder-core/prompts/discipline-normal.md`（`:89` 节前）；
  逐字文本 = 设计围栏块（一次性材料不混入本档——D2）。

**计数连带（D3）**：① 需求档 `docs/core/requirements/PROMPT-SYSTEM.md` §2.4 大纲补本节目（**主 agent 笔**——登记）；
  ② `##` 块计数随正（单份）；③ 计数断言 = 无存活断言。

**机检**：**不新增断言**（测试纪律「不因单次改动而增补」）——在盘核 = 一次性比对（落地档 ↔ 设计围栏块，批次收尾核对步）；`scripts/prompt-refs-check.mjs` 复跑（新增文本零文档引用）；`##` 块计数可机判（逐档数）。

**边界**：零机械门 · 产品码零触 · 其余纪律零触（既有节文本零改）· 清单细目不上提示词（具体条目归域档随走查增长；零文档引用照守）· 不改其他提示词档 · 需求档零笔（连带项 = 主 agent 笔）。

### 6.19 台账关联条目合并扫描（批点火前显式步）

**来源**：用户提问「现在在干活的时候有没有检查一下台账，把相关的台账项目一起合并处理的要求？」＋「我的意思是检查台账有没有关联项目可以合并处理的要求应该进提示词体系」——缺口 = 攒批工作流缺「合并扫描」显式步（批点火前必跑）+ 不并理由留痕。

**机制**：**批点火前（设计启动前）先扫台账相关条目（同板块 / 池面）**——**能并则并**（并进 = 同一迁移窗口 ∥ 同一评审面 ∥ 同一实施面——判断面，零机械门）、**不并须写明理由**（条件未到 ∥ 面不同 ∥ 风险高——记入轮次记录）；并 ∕ 不并皆有迹。
时机边界 = 现行批界规则照常（合并须在批设计之前；点火后新增条目 = 改批界 ⇒ 另起新批——见 `thincoder-core/prompts/persona-engineering.md`「一次实现轮的界」条）；新内容 = **显式扫描步**（不重述「达阈值提醒」与「批设计」既有语义）。

**分层归属（四问）**：① 人格层（主 agent 唯一消费——批形成 / 扫描与留痕均属主 agent 写权面）；② 非公共层（非两模式逐句协作基础）；③ 非纪律层（子代理非受众——批形成写权仅主 agent——同 §6.8 / FR30 落点判例）；④ 项目相关、形态为提示词行为纪律 ⇒ 人格层；落点文本零文档引用 ✓。

**形态（与 §6.1 落点口径的关系）**：**「批设计」条原位扩展**（既有条：现文逐字保留 + 前插扫描步）⇒ 零 `##` 块计数连带；攒批条 5 条 / 生命周期条 5 条计数均不变；生命周期表受需求档 FR30 验收「事件 → 动作」**五行**判据锁定（`docs/core/requirements/ENGINEERING-MODE-V2.md:696`）——扫描不入事件表（表形态 = 事件 → 动作；扫描无触发事件）。

**落点（唯一副本 = `thincoder-core/prompts/`）**：`thincoder-core/prompts/persona-engineering.md`（*Batch design* 条 = `:164` 原位扩展）；逐字文本 = 设计围栏块（一次性材料不混入本档——D2）。

**计数连带（D3）**：**无**（`##` 块计数随正；条数零变）。需求侧随动 = 父侧裁量（U 项）。

**机检**：`scripts/prompt-refs-check.mjs` 复跑 = 0 命中（新增文本零文档引用——`§1` 为协议自名合法正例）；
EN 档**不在行宽机检域**（`scanDirs = ["docs"]`）——新行 406 字符不折行（同档既存 >300 行 31 条 · 最长 981 ⇒ 折单行 = 反不一致——披露不行使；先例在册）；`##` 块计数可机判（单份不变）；**不新增断言**（内容在场 = 一次性比对——落地档 ↔ 设计围栏块，承 §6.1「批次收尾核对」）。

**边界**：零机械门 · 台账工具 / 代码零触 · 其余纪律零触（「达阈值提醒」「批设计」现文其余部分逐字保留；「派发与收尾纪律」治理块零触）· 不发明新机制（只落「扫描」显式步）· 不重述攒批工作流 · 术语承 §1 定形（`迁移窗口` = 新语；`评审面` / `实施面` = 现盘词汇——先例本档 `:66` ∥ `:136`；EN `thincoder-core/prompts/persona-engineering.md:93` ∥ `:147`；`§1` = 协议自名）· 需求档零笔（U 项 = 父侧）。

### 6.20 台账治理纪律增补（收口入账 ∥ 开局自查 ∥ 入库查重 ∥ 单行单结 ∥ 结算行）

**来源**：用户「你同时琢磨琢磨台账治理还有哪些方面可以优化改善？」+「两批都应该做。」= 治理面批组批放行。

**机制（五条 · 逐条 = 要求 + 时机 + 衔接）**：① **收口入账**——§6 未决项**逐条落台账行**（§6 只留指针；「欠账入清单」条原位扩展）∥ 复核时点补**冻结档残留扫描**（冻结档 §6 未决项未落台账行 ⇒ 当场补录；「暂缓批先复核」条尾追加）；

 ② **开局自查**——每会话开局（与「暂缓批先复核」同拍）自查池面——未决数 ∥ 可动项 ∥ >7 天未动 top-N（作 triage 输入）；>30 天行标「老化」；**内部自查、不重复播报**（不另出播报行——用户面零噪音；新 bullet）；③ **入库查重**——登记时扫同面既有行：同类并入 ∥ 否则注记关系（与批点火前的合并扫描互为上下游——新 bullet）；

 ④ **单行 = 单结算单元**——捆绑项拆行（防部分结算僵局——新 bullet）；⑤ **结算行**——**确保收口行落**（核销同步清单机械步）+ **核销数随收口**（本次核销数随收口一并报出，不另出独立行；生命周期 ③ 条尾追加）。

**同窗两笔**：⑥ 「段」口径定形 = **标题段**（标题节点〔层级 2+，含行内〕及其领起内容——逐段对位）；复算 = **17/17 全配对**（逐段对位零孤段）；⑦ `thincoder-core/prompts/persona-eng-designer.md` 同族句换写（EN `:38` ∥ `:51`；弃 1:1 基数、保内核、补关系句）。

**分层归属（四问）**：① 人格层——五条均主 agent 消费（欠账 / 自查 / 登记 / 结算 / 收口 = 主 agent 写权与行使面；子代理非受众——同 §6.8 / §6.19 / FR30 判例）；② 非公共层（非两模式逐句协作基础）；③ 非纪律层（子代理非受众）；④ 通用层内容（零项目实例）。

**形态（与 §6.1 落点口径的关系）**：既有节内增列（原位扩展 ×1 ∥ 条尾追加 ×2 ∥ 新 bullet ×3）⇒ **零 `##` 块计数连带**；生命周期条受需求档 FR30 验收「事件 → 动作」**五行**判据锁定（`docs/core/requirements/ENGINEERING-MODE-V2.md:696`）——不增行、只扩条文；需求档「攒批工作流（五条）」计数零变。

**落点（唯一副本 = `thincoder-core/prompts/`）**：`thincoder-core/prompts/persona-engineering.md`（`:81` ∥ `:84` ∥ 新 bullet ∥ `:170` ∥ `:174` 后新 bullet ×2）
 ∥ `thincoder-core/prompts/persona-eng-designer.md`（`:38` ∥ `:51`）；逐字文本 = 设计围栏块（一次性材料不混入本档——D2）。

**计数连带（D3）**：① `thincoder-core/prompts/persona-engineering.md` 行数 ∥ `##` 块读数 → §6.23（当前读数唯一处）；增量 = +3/面（新 bullet 三条）；② `thincoder-core/prompts/persona-eng-designer.md` 换写 **±0 行**；③ 需求侧 = U 项（父侧笔）。

**机检**：`scripts/prompt-refs-check.mjs` 复跑 = 0 命中（新文本 + 换写句零文档引用）；`##` 块计数可机判；**不新增断言**（内容在场 = 一次性比对——落地档 ↔ 设计围栏块，承 §6.1「批次收尾核对」）。

**边界**：零机械门 · 台账工具 / 代码零触 · 其余纪律零触（「批设计」条 ∥ 「达阈值提醒」 ∥ 治理三规逐字不动；落笔面逐字不动）· 零新术语（`可动项` / `注记关系` / `结算行` 均为平名直述或既有用语）· 需求档零笔（U 项 = 父侧）。

### 6.21 普通模式工作管理统一（批次档 + 台账 + 收口 · 普通侧三档）

**来源**：用户 2026-10-09 10:05–10:22 十条连述（原话在册 = 需求 `docs/core/requirements/NORMAL-MODE.md` §5.6 来源行）。

**机制（两模式同一套管理逻辑——差别只在约束强度）**：① **教学面**——三块（台账用法「何时动账」：登记 ∥ 推进 ∥ 挂账 ∥ 收口核销；批次档用法：一交付目标 = 一批档 ∥ 建档触发 = complex 档 ∥ 作者席；收口纪律：一批批落地 ∥ 收口一次跑全链「文档规范化 → 独立评审 → 修复 → 批准 → 收口核销」∥ 收口未落 ⇒ 不许核销 ∥ 跨会话接手）落 `thincoder-core/prompts/discipline-normal.md` **新增节**；

② **机制面**——段白名单模式感知（普通面 §2/§5 作者缝 + coder 可选绑定自写 §5；设计 = `docs/core/design/BATCH-RECORD.md` §4.16——本档不重述）；
③ **模式分辨率句**——`thincoder-core/prompts/common.md`「批次档常识」六段作者行按模式分辨（§2 = eng-designer〔工程〕/ 主 agent〔普通〕；§5 = eng-coder〔工程〕/ 实施者〔普通〕）。

**判据承载与通道对接（评审轮 1 发现 4 ∥ 5 ∥ 7——fix 轮登记）**：① **收口评审通道** = 设计评审通道（`advisor` `type:"design"` + 本档 `batchDoc`）——机制登记 = `BATCH-RECORD.md` §4.16（V3 对普通批同判零改——本档不重述）；

② **路由判据承载**（F-N2.3 尾句）= 教学块「收口纪律 · 落地」——**同源指针形**：判据句直书（「新机制 ∥ 大改 ⇒ 先设计后动手；其余直接落、由收口兜底」）、细则不复制（工程承载 = 轻通道机制块——`docs/core/design/LIGHT-CHANNEL.md` ∥ `thincoder-core/prompts/discipline-engineering.md`「基本流程」节）；

③ **「同套标准」句承载**（F-N2.4）= 教学双处——收口步 1「与工程设计师同套标准」∥ 身份句「标准与工程模式的设计师同套」（逐字 = 设计围栏块）；标准本体 = 工程设计师工作标准（不另立第二套）。

**分层归属（四问）**：① 纪律层——三块均「该模式下怎么干活」（受众 = 普通模式主会话 + 其子代理：coder 携绑定自写 §5 需教学面）；主 agent 独属动作（建档 / 挂账 / 核销 / 收口提请）以主 agent 视角直书纪律节（普通侧人格档薄——单点承载；先例 = 既有 task / 持久清单句同在纪律层）；② 人格层一句 = 身份面（设计师席并入——F-N2.4「不设设计师角色、全部工作主 agent 自担」属「你是谁 / 交付什么」）；③ 公共层 = 模式分辨率句（全角色两模式共读面——原句按工程角色写死，对普通读者误导）；④ 通用层内容（零项目实例）。

**形态（与 §6.1 落点口径的关系）**：`thincoder-core/prompts/discipline-normal.md` **新增节**（「工作管理（批次档 + 台账 + 收口）」+ 三子节；`##` 块 **8** · 标题节点 **25**）；`thincoder-core/prompts/persona-normal.md` ∥ `thincoder-core/prompts/common.md` 均**既有节内增列**（零块计数连带）。新增节在 §6.1「行为纪律面的落点形态」默认口径（既有节内增列）之外；先例 = §6.18（新增节登记在案）；

  依据 = 需求 F-N2.1 判据句（纪律层含用法节）+ 三块跨相位（建档 ∥ 落地 ∥ 收口）无单一既有节承载位。

**落点（唯一副本 = `thincoder-core/prompts/`）**：`thincoder-core/prompts/discipline-normal.md`（`## 任务边界` 节前——`:84`）；
`thincoder-core/prompts/persona-normal.md`（`## Main-agent role` 节内）· `thincoder-core/prompts/common.md`（「批次档常识」六段全图行——节内换写）；逐字文本 = 设计围栏块（一次性材料不混入本档——D2）。

**计数连带（D3）**：① `thincoder-core/prompts/discipline-normal.md` `##` 块 **8** · 标题节点 **25**；② `thincoder-core/prompts/persona-normal.md` ∥ `thincoder-core/prompts/common.md`：节内增列 ⇒ 零计数连带；③ 需求侧随动 = U 项（父侧笔）；④ 计数断言 = 无存活断言。

**机检**：**不新增断言**——在盘核 = 一次性比对（落地档 ↔ 设计围栏块，批次收尾核对步）；`scripts/prompt-refs-check.mjs` 复跑（新文本零文档引用——`§N` 为协议自名合法正例）；`##` 块计数可机判。

**边界**：不新增工程机械门（普通面——设计令牌 ∥ 强制 batchDoc ∥ 写文件门禁三者不新增；携绑定 coder 随绑定受既有批次档写门——非新增门，§4.16）· 台账机制本体零改 · 工程面提示词零触 · 机械面设计 = `BATCH-RECORD.md` §4.16（本档不重述）· 需求档零笔（U 项 = 父侧）。

### 6.22 产品常识（配置项必须有配置界面 · 用户定则入 common）

**来源**：用户定则原话（「任何配置项要给配置界面这他妈的不应该是常识吗？！」）∥「这种常识你还是先进提示词面」+「不不不，这是常识，不仅仅针对工程模式」。

**机制**：公共层 `thincoder-core/prompts/common.md` **档末新增第 16 节**「产品常识（Product common sense）」×1 条——**配置项必须有配置界面**（任何配置项默认同批给出界面写面；载入期项标注「重启生效」）∥ 例外须显式说明理由并经用户裁（「它一直是配置文件项」不构成例外）∥ 界面提示文案不得把用户指向界面里不存在的入口。逐字文本 = 设计围栏块（一次性材料不混入本档——D2）。

**分层归属（四问）**：① 公共层——「两模式逐句都要的协作基础」：全角色常识，受众 = 两模式 + 全部子代理（用户明示「不仅仅针对工程模式」）；② 非纪律层——非「该模式下怎么干活」，是给配置项配界面的常识；③ 非人格层——非身份 / 边界；④ 通用层内容（零项目实例）。

**形态（与 §6.1 落点口径的关系）**：**新增节**——在 §6.1「行为纪律面的落点形态」默认口径（`:166`——既有节内增列）之外；先例 = §6.16 ∥ D-PS22（公共层档末新增）；**移档末**（段中插入 ⇒ 档末——§N 零漂移）；计数连带照 D3 随动（下行）。

**落点（唯一副本 = `thincoder-core/prompts/`）**：`thincoder-core/prompts/common.md:203-204`（第 16 节——档末）（本段实读）；逐字文本 = 设计围栏块。

**计数连带（D3——列明处）**：① 需求档 `docs/core/requirements/PROMPT-SYSTEM.md` §2.3 标题 + 表行（数值以需求档为准）；
② 计数断言 = 无存活断言；③ `thincoder-core/prompts/common.md` `##` 块计数随正。

**机检**：**不新增断言**——在盘核 = 一次性比对（落地档 ↔ 设计围栏块，批次收尾核对步）；`scripts/prompt-refs-check.mjs`（新文本零文档引用——`§1–§6` 为协议自名合法正例）；`##` 块计数可机判（逐档数）。

**边界**：零机械门 · 产品码零触（提示词文本 + 文档面）· 不改铁律 ∥ 分流表 ∥ 确认门（例外经本则「显式说明 + 用户裁」承载）· 他批零触（实例面 = server 控制台配置批在途——本则不重述）· 需求档零笔（连带项 = 父侧已落）。

### 6.23 台账治理增补 v2（清账轮三条——锚点复核 ∥ 族行 ∥ evidence 指针化上限）

**来源**：用户「那清帐轮那些你也落地吧。」——承父侧建议①②③（**来源 = 设计侧提议**，用户批准落地）+ 落地方案（落点 = 本档新节 + 提示词一份；工具面零改）。

**机制（三条 · 逐条 = 要求 + 时机 + 衔接）**：① **锚点复核**——**要求**：清账轮对「归批」行**逐行核锚**，锚的批已收口而活未落 ⇒ **当场重锚**（转下一触点 ∥ 升小批候选 ∥ 降「认账不排期」）；**时机** = 清账轮；**衔接** = 与「暂缓批先复核」（锚失效扫描族）∥「能当场做的当场做」（池面 triage）同族；why = 池面未决数须代表真实工作量，不掺悬空；实证 = #1235（锚「沙盒批修正轮」——该批已收口仍挂）∥ #1193/#1194（锚「VSC 面下批」）；

 ② **族行**——**要求**：同一工作对象的散行归一为族行（一行 = 一个工作对象，标题携成员清单；成员同批同轮收口）；**时机** = 批点火扫描前的存量归并；**衔接** = 「入库查重」管登记时点、族行管存量行的归并形 ∥「单行 = 单结算单元」同轴（拆 = 不相干项不绑，并 = 同一工作对象不分家）；why = 未决面里独立工作对象少得多——批点火扫描一眼看全；实证 = 越线拆案族 #1269 ∥ #1297 ∥ #1309 ∥ #1313 ∥ #1352（五行 = 一个「结构拆分收口」）；

 ③ **evidence 指针化上限**——**要求**：行内只留「一行症状 + file:line + 指针」，细节入所指档；软上限 **≈ 300 字** + 例外形（见 §7 D-PS32）；**时机** = 登记时按此写形 ∥ 清账轮把超限行当收窄小件；**衔接** = 铁律段（指针化、不展开任务细节）的量化收口 ∥「入库查重」邻位；why = 台账 = 一眼能扫的账，不是档案馆——开局自查须扫得动；实证 = #1250 ∥ #1208 ∥ #1354（千字长行）。

**分层归属（四问）**：① 人格层——三条均主 agent 消费（池面锚维护 ∥ 行组织 ∥ 行形态 = 台账写权与行使面；子代理非受众——同 §6.8 / §6.20 / FR30 判例）；② 非公共层（非两模式逐句协作基础）；③ 非纪律层（子代理非受众——台账写权仅主 agent）；④ 通用层内容（零项目实例）。

**形态（与 §6.1 落点口径的关系）**：既有节内增列（「派发与收尾纪律」节新 bullet ×1 ∥ 「台账」节新 bullet ×2）⇒ **零 `##` 块计数连带**；生命周期表受需求档 FR30「事件 → 动作」五行判据锁定——三条均不入事件表（锚点复核 trigger = 清账轮；族行 / 上限 = 行面形态）。

**落点（唯一副本 = `thincoder-core/prompts/`）**：`thincoder-core/prompts/persona-engineering.md`（「Fix in place first」`:84` 后新 bullet ∥ `:181` 后新 bullet ×2）；逐字文本 = 设计围栏块（一次性材料不混入本档——D2）。

**计数连带（D3）**：① `thincoder-core/prompts/persona-engineering.md` 行数 EN **236**；`##` 块 **17**；② 需求侧 = U 项（父侧笔）。

**机检**：`scripts/prompt-refs-check.mjs` 复跑 = 0 命中（新文本零文档引用）；`##` 块计数可机判；**不新增断言**（内容在场 = 一次性比对——落地档 ↔ 设计围栏块，承 §6.1「批次收尾核对」）。

**边界**：零机械门 · 台账工具 / 代码零触（query/close/evidence 能力已足——三条 = 纯纪律）· §6.20 五条正文逐字不动（= 增补 v2）· 其余纪律零触 · 零新术语（锚点复核 / 族行 / 指针化上限均为平名直述；`转下一触点` / `升小批候选` = 受控简写）· 需求档零笔（U 项 = 父侧）。

### 6.24 注入开关（提示词 ∥ 记忆自动注入两枚全局开关）

**来源**：用户提出（迁移项目「旧文档干扰行为」应急阀）+「办」点火 + 两裁定（原话「文档和记忆分开开关，做成全局控制就行」）+ 追加（原话「几个客户端都要能在配置界面上配置，同时也开放工具给agent让agent也能自己控制开关」）；需求登记 = `docs/core/requirements/PROMPT-SYSTEM.md` §2.6。

**键面（口径单源 = 核 `config.json`）**：`agent.injectDocs` ∥ `agent.injectMemories`——布尔，默认 `true`（DEFAULTS.agent 声明）；判据 `!== false`（只有显式 `false` 阻断；缺省 = 现行为零变；同族先例 = `agent.timerWake`——`thincoder-core/config.mjs`）。

**族面现状 = 三键**——① 项目指令块 的开关已拆至 `agent.injectProjectRules`（§6.27），`injectDocs` 只余 ② 相关文档块（见下行阻断点表）。

**阻断点（三处——判点均逐 run 现读 `agent.config`）**：

| # | 注入块 | 判点落位（核 `thincoder-core/agent/setup.mjs`） | 开关 |
|---|---|---|---|
| ① | 项目指令文件块（`~/.thincoder/AGENTS.md` 低优 + 项目根 `AGENTS.md` / `project_rules.md`） | `:281`（`loadProjectInstructions` 调用——helper 本体零改；§6.2「运行期追加面」同读数） | `agent.injectProjectRules`（§6.27） |
| ② | 相关文档块（自动检索 + 注入） | `:118-155` | `agent.injectDocs` |
| ③ | 相关记忆块（自动检索 + 注入） | `:157-169` | `agent.injectMemories` |

关 = **检索调用不执行 + 注入不发生**（不止吞注入）；三块既有执行条件（depth 门 ∥ `resume` 段等）零动。
三键**互不影响**（正交——关任一方另一方照常）；① 与 ② 的职责切分详见 §6.27。

**读键时机与热应用**：判点皆在 `prepareRun`（每次提示词组装）现读 `agent.config` ⇒ 写入落到活 `agent.config` 即**本会话下一次组装生效**：`settings` 工具 = 直写内存即热（工具热应用链零改）∥ CLI `/config` = `reloadConfig` 换新 `agent.config`（同即热）∥ 端壳设置界面腿 = 各端既有配置刷新语义（VSC `hydrateRun` 每轮重读 ⇒ 下一条消息；桌面 = 下次 agent 装配）——零新机制。

**先例 ∥ 偏离 ∥ 桌面腿证据**：

- **先例批** = timer-wake 阶段 2（§5.15——VSC `agent.config.agent` 白名单整建漏键 ⇒ `agent.timerWake` 在 `config.json` 关不掉；三处穿透（默认种 ∥ raw 读 ∥ `agentFields`）补齐后真链闭合）——VSC 行同址预登记三处（逐文件落点 = 设计围栏块）。
- **桌面腿对照实读（无白名单）** = 写链 `settings:agent`（`thincoder-desktop/src/main/settings.mjs:255-297`——值校验 + `writeConfigAtomic`）落 `config.json`；
  读链 = 装配全量直传（`thincoder-core/agent/assemble.mjs:65` `loadConfig()` ⇒ `:106` `createAgent({ config })`；键经 `thincoder-core/config.mjs:220` 合并面直通 `agent.config`）⇒ 键必达核判点，桌面无需三处补。
- **偏离（知会）** = UI 腿生效时点 ≠ 会话内即热（VSC = 下一条消息 ∥ 桌面 = 下次装配——装配表同键复用 `thincoder-desktop/src/main/agent-host.mjs:198-199`）；需求③热应用仅绑 `settings` 工具面（工具直写活 config = 即热）；UI 腿同热 = 需 config-watch 活重载链（新机制），不做。

**不变式（工程模式不吃这两面）**：两开关只断自动注入三块——槽位装配（`assemblePrompt`）∥ 工程模式提醒 ∥ 批档 / 台账机制零触 ⇒ 关不破工程流程；子代理 config 继承父（`thincoder-core/agent-tools/subagent-spawn.mjs:300-302`）⇒ 子代理装配同受开关。（本族第三键 `agent.injectProjectRules`——① 独立成键；本节两键语义收窄为「只管 ② ∥ ③」，详见 §6.27。）

**端面登记（多实现面 · 语义单源 = 本节）**：核机制面（本节）∥ 三客户端配置界面（CLI `/config` ∥ VSC 设置页 Agent 卡 ∥ 桌面设置 Agent 段——逐文件落点 = 设计围栏块）∥ `settings` 工具面（DEFAULTS 派生——可见可写 + 布尔类型护栏自动跟随、实现面零改码；同族面 = `CONFIG.md` §6.2「派生消费面」）。

**机检**：批内件（U1–U11：核面三块开关 ∥ 热应用 ∥ `settings` 工具写入面 ∥ 子代理装配 ∥ 工程不变式 ∥ 三端面）。

**边界**：不改检索机制本体（`doc_search` / `memory search` 按需工具零影响）· 不删数据 · 工程模式装配链零触 · 不扩到项目级粒度（全局 = 用户裁）· 其余自动注入块不在开关面（`.cursor/rules` 尾块 `thincoder-core/agent/setup.mjs:287-288` ∥ 仓库大纲 `thincoder-core/agent/setup.mjs:103-112` ∥ skills 清单 ∥ git / env / peer / time 提醒——需求口径 = 上表三块）· 零新机制（落点 = 既有配置面 + 既有读点）。

### 6.25 安全纪律（五条携 why · 提示词公共层）

**来源**：用户定稿（原话「早期其实我们并不清楚我们需要什么样的安全机制，只有等到功能确立以后，才能清晰的清楚安全的需求」「我希望能让未来执行的agent看到提示词能知其然知其所以然。」「可以，就这么定，开设计。」）；
需求登记 = `docs/core/requirements/PROMPT-SYSTEM.md` §2.4 尾「安全纪律」块（块头 ∥ 依赖行 ∥ 验收行——主 agent 笔）。
**同族用户令**：用户「你先不要着急落地出网管控这一块……安全性问题押后，等跑通以后再说，别套着枷锁跳舞」。

**机制（五条——逐条 = 条文 + why）**：
① **安全后置**——功能先到「能用」，安全机制排后或按需另轮；功能未定型前不立安全项（why：未定型时「该防什么」无答案、只有想象——按想象写的防护 = 假地板：大家以为已管住，无人再审视）。
② **威胁模型源于运行事实**——先跑起来，再从真实数据流枚举攻击面、按最坏损失定防护；不照搬公众平台 / 行业清单（why：不看真实系统谈防护 = 防虚构的敌人、挡真实的自己；内部工具按内部实际）。
③ **挡路的防护先让路**——既有防护挡住当前要验证的路径 ⇒ 先关 / 先拆；不等、不绕（why：绕路让「这里被挡过」消失——没人再回来处理）。

④ **失效防护 = 负资产**——停用要停干净：配置关 + 运行态残留一并回收（why：「看起来在防护」比没有更危险：假安全感 + 残留部件 = 一次全速业务中断；实例 = 出站闸残规则掐死拉仓）。
⑤ **安全项不默认立**——自加安全机制默认不立；要立 = 单列提议（防什么 ∥ 代价 ∥ 为什么是现在）由用户挑；禁与功能块平级前置（why：防护成本与验证速度直接对冲——默认位置 =「待议」非「应有」）。

**携「为什么」**：条文 + 理由 + 实例逐条入提示词（目的 = 未来 agent 照理由在没见过的场面上自己推对——D9 同口径）；结句「没见过的场面，照这些理由自己推对」= 需求块「照理由在没见过的新场面自己推对」的提示词面落形（评审判超授权 ⇒ 一行回退）。

**分层归属（四问）**：① 公共层——受众 = 两模式 + 全部子代理（需求块目标「让每一次执行都按正确的顺序与方式对待安全」）；② 非纪律层——五条无模式过程挂钩（两模式同文；分落两纪律档 = 同文双份、零差异收益）；③ 非人格层——非身份 / 边界；④ 通用层内容（why 逐条 + 实例一条、去日期）。

**形态（与 §6.1 落点口径的关系）**：**新增节**——`thincoder-core/prompts/common.md` 档末第 17 节；在 §6.1「行为纪律面的落点形态」默认口径（现盘 `:169`——既有节内增列）之外；先例 = §6.16 ∥ §6.22（公共层档末新增节 · D-PS22 ∥ D-PS30）；依据 = 安全主题在公共层无既有承载节（16 节零安全面——实读）+ 受众全线；**移档末**（沿 D-PS30 裁定——§N 零漂移）；计数连带照 D3 随动（下行）。**无同族条处置**（安全面无既有条）。

**落点（唯一副本 = `thincoder-core/prompts/`）**：`thincoder-core/prompts/common.md`（档末第 17 节——205 行后）；逐字文本 = 设计围栏块（一次性材料不混入本档——D2）。
**落笔安排（父侧派单）**：EN 档 = 实施轮 coder 落笔（依据 = 本节设计）。
**现态**：已落 `thincoder-core/prompts/common.md`。

**计数连带（D3——列明处）**：① 需求档 `docs/core/requirements/PROMPT-SYSTEM.md` §2.3 标题 + 表行（数值以需求档为准；**父侧笔**——U 项）；② `thincoder-core/prompts/common.md` `##` 块计数随正；③ 计数断言 = 无存活断言。

**机检**：`scripts/prompt-refs-check.mjs` 复跑 = 0 命中（新文本零文档引用——读数入一次性记录面）；提示词档不在行宽机检域（披露不行使——同 §6.19 记法）；`##` 块计数可机判（逐档数）；**不新增断言**（内容在场 = 一次性比对——落地档 ↔ 设计围栏块，承 §6.1「批次收尾核对」）。

**边界**：零机械门 · 不改既有安全机制本体 ∥ 不引入新机制 ∥ 不裁决「某项防护该不该做」（逐事判断——需求块边界）；不落两模式纪律层（两模式同文——见形态行）· 不触 persona ∥ subagent-base ∥ tool-docs ∥ 其余纪律 · **上游三观档 = 无冲突、无需同拍**（五条 = 三观在安全面的应用——设计轮检查；先例 = §15 ∥ §16 入公共层未触三观；需求块「如需同拍」条件不成立）·

**③「先关 / 先拆」仍受既有破坏性命令红线与不可逆确认门约束**（红线 = `thincoder-core/prompts/common.md` §10 尾部 · D-PS5；非「先拆」豁免）· 需求档零笔（U 项 = 父侧）。

### 6.26 跨仓勘察义务（三句文本——义务 ∥ 派单 ∥ 复核）

**来源**：用户「行」（开跑授权）——承用户实报「thincoder 在做设计时经常无视跨仓的设计文档」；三句 = 设计侧提议（父侧提出、用户批准——非用户自提）。

**病根（父侧实读在案）**：① 设计席**不被推**（相关文档注入 = depth-0 门，`thincoder-core/agent/setup.mjs:114-116`——子代理不注入）；② **无义务 / 无证据**（现仅一句泛纪律「动手前先查声明源」——从未触发）；③ **复核无牙**（设计评审无对应检查项）。**读通道本通**：树内默认可查（本工作区实证——`code_search` 直返兄弟仓 `thincoder.com/*`）；`searchOrigins` = 项目 origin ∪ 声明公共仓。

**机制（三句——义务 ∥ 派单 ∥ 复核）**：
① **设计席义务句**——设计开工前先查**工作目录树内的公共源文档**（尤其独立文档仓）；查过什么 / 有没有相关 ⇒ 设计档落**勘察证据行**（无相关也照记）——设计席不被推文档，泛纪律从未触发；写成义务，设计才不瞎着眼做。
② **派单规范句**——父侧派设计轮的任务书带上**相关公共源文档坐标**（尤其独立文档仓）；**没有就明写「已查无」**——设计席据此知道旁边有什么可查——设计席不被推文档，看不到旁边有什么；坐标随任务书递手，勘察才有方向。

③ **评审检查句**——设计评审加一项：设计档是否携**勘察证据行**（查过哪些公共源文档 ∥ 有没有相关）；**缺行 ⇒ 未查或未记**——复核链本无此项；「没查」得有地方现形。

**分层归属（四问）**：**行为面（义务）** = 工程纪律层设计步（消费方 = 主会话 · 工程模式 + eng-coder + eng-designer 全装配——主 agent 需见〔核验设计稿 / 派单面〕；先例 = 同类先例勘察落同节）；**形态面（证据行）** = 设计席人格 8 项 item 1（交付物形态——就地扩条，8 计数不变）；**派单面** = 主 agent 人格层「派发与收尾纪律」节内（派单写权独属——子代理非受众 ⇒ 不落纪律层）；**核查面** = 设计评审提示词（自含档）。

**形态（与 §6.1 落点口径的关系）**：**既有节内增列 / 就地扩条**——四处零新增节 ⇒ 零 `##` 块计数连带；**②不落六字段表**（task book 六字段 = `validateTaskBookFields` 判据集——机械面牵动避让，他域零动）。

**落点（唯一副本 = `thincoder-core/prompts/`——四处）**：① `thincoder-core/prompts/discipline-engineering.md` 设计步 ∥ ② `thincoder-core/prompts/persona-eng-designer.md` 8 项 item 1 ∥ ③ `thincoder-core/prompts/persona-engineering.md` 派发纪律 ∥ ④ `thincoder-core/prompts/advisor-design.md` 评审标准第 10 条；

  逐字文本 = 设计围栏块（一次性材料不混入本档——D2）。
**落笔安排**：**EN 代码 = 实施轮 coder 落笔**（依据 = 本节设计）。

**计数连带（D3——列明处）**：① 设计评审标准条目数 **11**（两档——「第 10 条」∥「第 11 条」）；② 设计档 8 项计数不变（item 1 就地扩）；③ task book 六字段计数不变（②独立行）。

**机检**：`scripts/prompt-refs-check.mjs` 复跑 = 0 命中（新文本零文档引用——读数入一次性记录面）；提示词档不在行宽机检域（披露不行使——同 §6.19 记法）；**不新增断言**（内容在场 = 一次性比对——落地档 ↔ 设计围栏块，承 §6.1「批次收尾核对」）。

**边界**：零机械门 · 注入零触（`setup.mjs` depth-0 门 = 下一块石头——零改）· 需求档零笔（U 项 = 父侧）· 读侧既有句零动（§6.15——不重述读权限）· 不触 `thincoder-core/prompts/common.md` ∥ subagent-base ∥ tool-docs ∥ 其余纪律 · 维度权威档未登记本维度（`ADVISOR-CONVERGENCE.md`——不在射程；观察项报父侧）。

### 6.27 项目指令注入独立开关（`agent.injectProjectRules` · 职责正交）

**来源**：用户提出（原话「有些项目里的 agent.md 是适用于别的 coding agent 的，用到 thincoder 会造成混乱」）+ 收窄（原话「我需要一个单独关掉 agent.md 和 project_rules.md 注入的开关」）+ 定作用域（原话「按全局」）+ 点火「办」+ 拍定职责关系；需求登记 = `docs/core/requirements/PROMPT-SYSTEM.md` §2.6。**本设计 = 在 §6.24 三阻断点之上，把 ① 独立成键并令两键正交。**

**职责切分（用户裁「(乙) 完全正交」——口径单源）**：

| 键 | 管 | 默认 / 判据 |
|---|---|---|
| `agent.injectProjectRules`（**新**） | **① 项目指令文件块**（`~/.thincoder/AGENTS.md` 低优 + 项目根 `AGENTS.md` / `project_rules.md`） | `true` / `!== false` |
| `agent.injectDocs`（**职责收窄**） | **② 相关文档块**（自动检索 + 注入）——**只管 ②** | `true` / `!== false` |
| `agent.injectMemories`（零动） | ③ 相关记忆块（自动检索 + 注入） | `true` / `!== false` |

**两键互不影响**：关 `injectDocs` ⇒ ① **照常注入**（判点不再读 `injectDocs`）；关 `injectProjectRules` ⇒ ② **照常检索**（判点仍只读 `injectDocs`）。三键互不牵连，无「总闸 + 分闸」层级。

**阻断点（判点逐 run 现读 `agent.config` · 核 `thincoder-core/agent/setup.mjs`）**：

| # | 注入块 | 判点落位 | 开关（落定后） | 改动面 |
|---|---|---|---|---|
| ① | 项目指令文件块 | `:281`（`loadProjectInstructions` 调用——helper 本体 `agent/helpers.mjs:399` 零改） | **`agent.injectProjectRules`** | **判读取自 `injectDocs` ⇒ 改为新键**（`:57-60` 新增消费点变量 `const injectProjectRules = agent.config?.agent?.injectProjectRules !== false` + `:281` 换判变量） |
| ② | 相关文档块 | `:118`（`if (injectDocs)` 门——块体 `:118-155`） | `agent.injectDocs` | **零改**（语义收窄 = ① 撤出后自然只剩 ②；门句逐字不动） |
| ③ | 相关记忆块 | `:157`（`if (injectMemories)` 门——块体 `:157-169`） | `agent.injectMemories` | 零改 |

关 = **检索调用不执行 + 注入不发生**（不止吞注入）；三块既有执行条件（depth 门 ∥ `resume` 段等）零动。
三键**互不影响**（正交——关任一方另一方照常）；① 与 ② 的职责切分详见 §6.27。
**本表 ① 行以 §6.27 为准（落定后态）。**

**判点同址判定（设计问题 2 的答复）**：① 判点**仍落 `setup.mjs` 调用侧**（不新开第二处）——新键只替换该处判读的变量名，条件形（三元 + `loadProjectInstructions` 调用面）逐字不变。**坐标随动**：已在 `:57-60` 新增消费点变量 3 行 ⇒ 判点 = **`:281`**（语义零变，条件形逐字同）。

理由 = `loadProjectInstructions` 是公开导出面（`config.mjs` 派生表 + `API-CONTRACT.md` 在册）⇒ 判点留调用侧 = 最小爆炸半径（承 D-PS35 判由）；换址（如移入 helper）须动公开导出面语义，否决。

**默认零行为变（设计问题 4 · 可机判证明）**：

- **证明形**：新键缺省（`config.json` 无该键）⇒ DEFAULTS 合并后 `agent.injectProjectRules === true` ⇒ `:281` 判 `true !== false` = 真 ⇒ `loadProjectInstructions` 照常调用，与 #1420 落地态**逐字节同**。②③ 判点零改 ⇒ 逐字零变。
- **机判法（正向 + 反向——三键正交可机判）**：
  - **正向**：不设三键跑一次装配，断言 `systemPrompt` 含 `Project instructions (follow these as project conventions):` 块 + 含 `[Relevant documentation` / `[Relevant memories` 两 reminder（或按测试装置的等价读数）；与 #1420 落地态读数逐项比对（用例型——验收 ③）。
  - **反向 ①**：写 `agent.injectProjectRules = false` ⇒ 装配后 `systemPrompt` **无** `Project instructions (follow these as project conventions):` 块 **∧ 含** `[Relevant documentation` / `[Relevant memories` 两 reminder。
  - **反向 ②**：写 `agent.injectDocs = false` ⇒ `systemPrompt` **无** `[Relevant documentation` **∧ 含** `Project instructions (follow these as project conventions):` 块。
  - **⇒ 三键正交由此三向断言机判**（任一方独立可关、关后另两方逐项仍在）。

**行为变更影响面（用户拍板的代价）**：

- **变更实质**：`injectDocs` 由「管 ①②」收窄为「只管 ②」。**唯一可观察差异** = 老用户在 `config.json` 显式设过 `agent.injectDocs: false` 且**未设新键**时：此前 ⇒ ① 不注入；此后 ⇒ ① **重新开始注入**（因 ① 判点不再读 `injectDocs`，而新键缺省 = 开）。
- **影响面（有界）**：仅命中「显式 `injectDocs:false`」的存量配置；缺省用户（绝大多数）零感。命中的用户若当初正是为「关项目指令」而设 `injectDocs:false`（拆键前语义下这是唯一手段），此后会看到项目指令块回归 ⇒ 可自行设 `injectProjectRules:false`。
- **关于告知**：不设——该键 2026-10-14 落地、尚未正式使用，无依赖旧语义的用户（用户裁定：不加运行期提示 / 不加检测代码 / 不加文档告示）。
- **老用户自助路径**：三端界面 + `settings` 工具均可写 `agent.injectProjectRules`——用户在原位（配置界面）即可看到拆后两键、自选。

**热应用（照 §6.24 既有链，零新机制）**：判点逐 run 现读 `agent.config` ⇒ 写入落活 `agent.config` 即**本会话下一次组装生效**——`settings` 工具 = 直写内存即热（工具热应用链零改）

∥ CLI `/config` = `saveProxy` + `reloadConfig` 换新 `agent.config`（即热）∥ VSC 设置面板 = `hydrateRun` 每轮重读 ⇒ 下一条消息 ∥ 桌面 = 下次 agent 装配（`thincoder-desktop/src/main/agent-host.mjs:183-185` `assembleAndLoad` → `assemble`，装配表同键复用）。

**三端配置面落点（承 §6.24 既有面 · 零新造 UI 机制 · VSC 分「穿透面」∥「UI 链」两行列）**：

| 端 | 落点（逐点） |
|---|---|
| CLI `/config` | `thincoder-cli/src/tui/cmd-config.mjs`——主菜单项 `:362`（新增一行 `agent.injectProjectRules`，与 `:363` `injectDocs` 相邻）+ view 面板 `:388-389` 两行（新增 · `injectDocs` 文案改述）+ toggle 分支 `:462`（**分支谓词须显式并入** `agent.injectProjectRules`——`:462` 现仅列 `agent.injectDocs \|\| agent.injectMemories`，**非自动点**；并入后 `:465` `slice("agent.".length)` 取键机制天然兼容） |
| VSC 设置面板（**穿透面**） | `thincoder-vscode/src/agent/setup.mjs` **三处同址穿透必须齐**（timer-wake 阶段 2 先例——§5.15）：默认种 `:131`（`DEFAULTS.agent?.injectProjectRules !== false`）∥ raw 读 `:160`（`raw.agent?.injectProjectRules ?? cfgInjectProjectRules`）∥ `agentFields` 白名单 `:180`（`injectProjectRules: cfgInjectProjectRules`，表头 `:174`）——**三处缺一则该键在 `config.json` 关不掉**（timer-wake 旧疾复现）。**对照**：`agent.timerWake` 同形三处 = `:128` ∥ `:159` ∥ `:178` |
| VSC 设置面板（**UI 链**） | 读链 `thincoder-vscode/src/extension/settings.mjs:45-46`（新增 `injectProjectRules` 归一）+ `:165-166`（快照携键）∥ 写链 `thincoder-vscode/src/extension/settings-panel-write.mjs:84-85`（新增布尔写）∥ 控件 `thincoder-vscode/webview/settings-agent.js:29-30`（新增 `#ag-injectprojectrules` switch + 载荷 `:128-129` + `EDIT_FIELDS` `:153`）∥ 词面 `locales/zh.json:144-145` + `en.json:144-145`（新增键两语 + 改述 `injectDocs` 词面）+ `…Help` 悬浮两语 `:237-238`（新增 `injectProjectRulesHelp`） |
| 桌面设置界面 | `thincoder-desktop/renderer/views/settings-agent.mjs:63-64`（`NAMED_FIELDS` 新增一行 `agent.injectProjectRules` + 表注释「二十键 ⇒ 二十一键」）∥ 词面 `thincoder-desktop/renderer/i18n-views.mjs:208-209`（英文）+ `:398-399`（中文）——新增键两语 + 改述 `injectDocs` 词面 |

**VSC 三处穿透补齐（timer-wake 阶段 2 先例——§5.15）**：`agent.injectProjectRules` 在 VSC 侧的**真穿透面** = `thincoder-vscode/src/agent/setup.mjs`（非 `extension/settings.mjs`）——默认种 ∥ raw 读 ∥ `agentFields` 白名单三处必须齐，缺一则该键在 `config.json` 关不掉（timer-wake 旧疾复现）。

**逐行坐标 = 上表「穿透面」行**（`extension/settings.mjs` ∥ `settings-panel-write.mjs` ∥ `webview/settings-agent.js` = **界面链路**，与穿透面分列，勿混为一处）。

**`settings` 工具面（DEFAULTS 自动派生——零手写校验）**：`thincoder-core/config-defaults.mjs:54-55` 邻位新增 `injectProjectRules: true` ⇒ 装载期经 `_deriveTypes(DEFAULTS)`（`thincoder-core/agent-tools/settings.mjs:55-69`）自动进 `TYPE_MAP`（`boolean`）

⇒ `settings` 工具 list/set 面**可见可写 + 布尔类型护栏自动跟随**，实现面**零改码**（承 `CONFIG.md:157` 「派生消费面」同族）。三键（含既有两键）在 `settings` 工具 list 面自动成列。

**不变式**：① 工程模式不吃这面（纪律走提示词本体——三键只断自动注入三块，槽位装配 `assemblePrompt` ∥ 工程模式提醒 ∥ 批档 / 台账机制零触 ⇒ 关不破工程流程）；② 子代理 config 继承父（`thincoder-core/agent-tools/subagent-spawn.mjs:300-302`）⇒ 子代理装配同受三开关；③ 需求「边界（不做）」零越（不改检索机制本体：`doc_search` / `memory search` 按需工具零影响；不删数据；全局粒度；零新机制）。

**端面登记（多实现面 · 语义单源 = 本节）**：核机制面（本节）∥ 三客户端配置界面（CLI `/config` ∥ VSC 设置页 Agent 卡 ∥ 桌面设置 Agent 段——逐文件落点 = 上表）∥ `settings` 工具面（DEFAULTS 派生）。**跨面差异处置（多实现面纪律 6）**：三端 = 同一机制的三实现面，**默认消除差异**——键名 / 默认 / 判据 / 词面语义三端一致；无宿主能力差 ⇒ 零「登记保留」例外。

**机检**：`scripts/prompt-refs-check.mjs` 复跑 = 0 命中（新文本零文档引用）；`##` / `###` 块计数可机判（本档新增 1 个 `###` 节）。

**受影响文件（12 档 · 预计 Δ）**：

| 文件 | 现行行数 | 预计 Δ（≤±N / 结构不变） |
|---|---|---|
| `thincoder-core/config.mjs` | 513 | +2（`injectProjectRules: true` + 注释位） |
| `thincoder-core/agent/setup.mjs` | 294 | +3（消费点变量 `:57-60`）+ 改 1 行（`:281` 换判变量——原 `:276`） |
| `thincoder-core/agent-tools/settings.mjs` | 297 | **结构不变**（工具面零改码——装载期自动派生；不改此档） |
| `thincoder-cli/src/tui/cmd-config.mjs` | 509 | +1（主菜单项）+ 1（view 行）+ 改 3 行（`:362`/`:388` 词面 + `:462` 谓词） |
| `thincoder-vscode/src/agent/setup.mjs` | 317 | +4（默认种 + raw 读 + `agentFields` 白名单 + 注释） |
| `thincoder-vscode/src/extension/settings.mjs` | 424 | +2（`:45-46` 归一 + `:165-166` 快照） |
| `thincoder-vscode/src/extension/settings-panel-write.mjs` | 222 | +1（`:84-85` 邻位布尔写） |
| `thincoder-vscode/webview/settings-agent.js` | 203 | +3（控件 + 载荷 + `EDIT_FIELDS`） |
| `thincoder-vscode/locales/en.json` | 347 | +1 键 + 改 1 值 |
| `thincoder-vscode/locales/zh.json` | 347 | +1 键 + 改 1 值 |
| `thincoder-desktop/renderer/views/settings-agent.mjs` | 192 | +1（`NAMED_FIELDS` 行）+ 表注改（二十键 ⇒ 二十一键） |
| `thincoder-desktop/renderer/i18n-views.mjs` | 434 | +1 键 × 2 语 + 改 1 值 × 2 语 |

**测试档**：单测档随批档存放（`docs/batches/` 邻位，命名随批档）——不在上表 12 档内（不进产品树）；**结构线**：上表逐档均远低于 500 行咨询线，最大者 `cmd-config.mjs` 509 行 ⇒ +2 后仍近阈值，**无需拆分**（≤±3 无结构影响）。

**边界**：不做按项目开关（用户定全局）· 不改检索机制本体（只断自动推送）· 不删数据 · 工程模式装配链零触 · 其余自动注入块不在开关面（`.cursor/rules` 尾块 `thincoder-core/agent/setup.mjs:287-288` ∥ 仓库大纲 `:103-112` ∥ skills 清单 ∥ git / env / peer / time 提醒）· 零新机制（落点 = 既有配置面 + 既有读点）· 需求档零笔（父侧笔——只核对合规）。

### 6.28 联网查证指导（何时必查 · 够没够 · 查不到）

**来源**：用户 2026-10-16 点名「提示词里要指导 agent 主动上网查证」（原话「这不是模型的问题，是提示词的问题」）；需求登记 = `docs/core/requirements/PROMPT-SYSTEM.md` §2.3 表行 9。

**病根（用户实报）**：模型凭训练记忆答版本 / API / 协议行为 = 猜（记忆有截止日、会记错）；既有工具节只讲「用哪个工具」，不讲「何时必须查」，也无「够没够 / 查不到怎么办」的判据。

**机制（三件 + 边界）**：公共层 `thincoder-core/prompts/common.md`「工具观」节内新增 `###` 子节「何时必须联网查证」——① **必须查的情形**（四类触发：时效 / 精确 / 否定式断言 / 与实证冲突）∥ ② **查到什么算够**（一手源原文句或片段，能指到具体页面 / 文件；二手只算线索）∥ ③ **查不到怎么办**（环境无检索工具 ⇒ 标 `unverified`；

  可检索但无一手源 ⇒ 换源再试 → 仍无 ⇒ 标 `unverified`）∥ 边界（常识无需查 ∥ 查事实 ≠ 抄清单 ∥ 联网前提 ∥ 不写死工具名）。逐字文本 = 设计围栏块（一次性材料不混入本档——D2）。

**分层归属（四问）**：① 公共层——受众 = 两模式 + 全部子代理（工具观族恒第二位 = 唯一全覆盖）；② 非纪律层（非「该模式下怎么干活」）；③ 非人格层（非身份 / 边界）；④ 通用层内容（零项目实例）。

**形态（与 §6.1 落点口径的关系）**：**既有节内增列**——`## 工具观` 内新增一个 `###` 子节 ⇒ **零 `##` 块计数连带**；标题节点（层级 2+）**22 ⇒ 23**。先例 = 工具观族既有三子节（`### 搜索工具优先级` / `### 代码库探索顺序` / `### 并行调用原则`）。

**落点（唯一副本 = `thincoder-core/prompts/`）**：`thincoder-core/prompts/common.md`（「工具观」节内、`### 搜索工具优先级` 之后新 `###` 子节）；逐字文本 = 设计围栏块（D2）。
**落笔安排**：**EN 代码 = 实施轮 coder 落笔**（依据 = 本节设计）。

**计数连带（D3——列明处）**：① 需求档 `docs/core/requirements/PROMPT-SYSTEM.md` §2.3 表行 9 续一条（数值以需求档为准——**父侧笔**）；② 计数断言 = 无存活断言。

**机检**：`scripts/prompt-refs-check.mjs` 复跑 = 0 命中（新文本零文档引用）；`##` 块计数可机判（逐档数）；**不新增断言**（内容在场 = 一次性比对——落地档 ↔ 设计围栏块，承 §6.1「批次收尾核对」）。

**边界**：零机械门 · 不重写「搜索工具优先级」节（工具优先级 / 抓取法 = 工具面单源，零动）· `thincoder-core/prompts/discipline-normal.md`「通用」条其余文字零动 · 需求档零笔（父侧）· `thincoder-core/**` 英文面 = 实施轮 coder 笔 · `scripts/**` 零触 · 不改工具本体（`websearch` / MCP 搜索工具语义零动）。

### 6.29 上下文自掌舵（工具观新子节）

**来源**：用户 2026-10-16 23:57 逐字批准文案（症状 = 「明明才占用一点点，agent 就以上下文快满为由停止工作」——23:49 实报）；文案依据 = 需求 `docs/core/requirements/CONTEXT-COMPACTION.md` §2.1 F-CC1（用量与构成：总量 / 距压缩阈值 / 各段占比）· F-CC2（主动压缩携 focus + 回执带可回查锚）· F-CC4（提示非命令——压缩决策恒在模型）+ 边界（阈值压缩 = 兜底）。

**机制（三句 + 边界）**：公共层 `thincoder-core/prompts/common.md`「工具观」节内新增 `###` 子节「上下文自掌舵」——① 用量与构成（含距压缩线）随时查（`context`）∥ ② 自觉该收拾（方向变了 / 太嘈杂）⇒ 自己发起压缩、写清「下一步要什么」（focus）——压掉的可取回（回执带锚）∥ ③ 到压缩线自动压缩 = **兜底非收工令**（收拾完接着干，直到任务真做完）。逐字文本 = 设计围栏块（一次性材料不混入本档——D2）。

**边界**：`context` 工具本体 ∥ F-CC4 轻推行文本零触；tool-docs 描述面 = 本面零触、随动另笔（内容依据 = 机制文档，落笔 = eng-coder；建议文案随设计上抛）；阈值语义零改（本面零触；阈值再平衡见 `CONTEXT-COMPACTION.md` §6.2 / D-CC30）。

**分层归属（四问）**：① 公共层——受众 = 两模式主会话主面（①② 的 `context` = depth-0 only——§6.16.6 裁令 D；子代理读为背景、工具 schema 面不可达 ⇒ 无误调面）+ 全角色（③——阈值自动压缩管辖与深度无关）；② 非纪律层（跨模式同文、无模式过程挂钩——同 D-PS36 判据；落两模式纪律档 = 同文双份、零差异收益）；③ 非人格层（非身份 / 边界；落两模式人格档同双份）；④ 通用层内容（零项目实例）。**F-CC4 深度门不动**（该门面向活体推入行——6.16.5；本处 = 常驻参考文本，不做文本级深度限定）。

**形态（与 §6.1 落点口径的关系）**：**既有节内增列**——`## 工具观` 内新增 `###` 子节 ⇒ **零 `##` 块计数连带**；标题节点（层级 2+）**23 ⇒ 24**。先例 = D-PS39（同节 `### 何时必须联网查证`）。

**落点（唯一副本 = `thincoder-core/prompts/`）**：`thincoder-core/prompts/common.md`（「工具观」节内、`### 并行调用原则` 之后新 `###` 子节——`## 工具路由表` 之前）。
**译锚**：压缩线 = compaction line（与 `context` 报面同词——口径单源）· 兜底 = fallback · 可取回 = retrievable（回执带锚 = the receipt carries the anchor）。
**落笔安排**：**EN 代码 = 实施轮 coder 落笔**（依据 = 本节设计）。

**计数连带（D3——列明处）**：① 需求档 `docs/core/requirements/PROMPT-SYSTEM.md` §2.3 表行 9 续一条（**父侧笔**）；② 计数断言 = 无存活断言。

**机检**：`scripts/prompt-refs-check.mjs` 复跑 = 0 命中（新文本零文档引用）；`##` 块计数可机判（逐档数）；**不新增断言**（内容在场 = 一次性比对——落地档 ↔ 设计围栏块，承 §6.1「批次收尾核对」）。

**边界**：零机械门 · `thincoder-core/**` 英文面 = 实施轮 coder 笔 · tool-docs 描述面 = 本面零触、随动另笔（内容依据 = 机制文档，落笔 = eng-coder；建议文案随设计上抛）· 不改「工具观」既有四子节 · 需求档零笔（父侧）。

**紧凑机制登记（无独立 `§6.N` 编号）：异步并发认知与 `wait_for` 判断**

**来源**：用户 2026-10-17 23:43（原话「我们的提示词里是不是没有告诉模型 thincoder 支持异步并发？如果模型不清楚的话，就会把任务捏在手里排队，而且还会使用 wait_for 阻塞会话」）；台账 = #1629。
**为什么需要（两缺口）**：① 引擎全异步高并发的事实若不进公共层，纪律层读者与子代理就取不到——任务被捏在手里逐枚等、并行排成串行；
② `wait_for` 若只有工具路由一行提名，模型就不清楚它等的是「没有送达通道的状态」，会拿它等子代理报告——阻塞会话，而报告本来会自己送达。

**机制（四处——事实 + 后果，无禁令句）**：① 公共层「并行调用原则」节内 +2 行——本引擎全异步高并发（顶层 spawn 立即返回、报告在会话空闲时自动到达、文件冲突与 `dependsOn` 由调度器排队排序）+ 派出后两种走法（要报告 ⇒ 结束回合；不要 ⇒ 接着做别的）；

② 公共层「工具路由」节内 +2 行——`wait_for` 用于**没有送达通道**的状态（端口打开 / 文件出现：不查不知道，阻塞着等才划算）；异步子代理的报告相反（自己到达；`wait_for` 等到的只是「它结束了」信号，报告内容仍走送达）且 `wait_for` 是**阻塞**调用——拿它等报告 = 会话挂住原地；

③ 工程纪律层 `thincoder-core/prompts/discipline-engineering.md:206` 旁注整行扩写——并发是常态；攥在手里逐枚等，只会把并行的活排成串行；④ 工程人格层「并行委派与多任务」节内 +1 bullet——父侧等待姿势：等报告的动作 = 结束回合；进度用 status/observe 非阻塞瞄。

**分层归属**：① ② 公共层（恒第二位 = 两模式 + 全部子代理共读——引擎事实与工具判断是全角色知识）· ③ 工程纪律层（该模式怎么干活）· ④ 工程人格层（父侧写权独属行为）。
**同一事实三层各点一次 = 关键锚点重复**（先例 = §6.7「不可裁决」本地出口 · D-PS7——「本地只加出口边界句 + 最短动作锚」；承编写纪律「关键锚点重复」）——各层须能独立阅读：删任一层的句子，该层读者（纪律层读者不重读公共层 / 人格层读者在派单现场取用）即缺句。

**形态（与 §6.1 落点口径的关系）**：**既有节内增列 / 既有条就地改写**——四处零新增节、新增文本全为散文行零标题 ⇒ **零 `##` 块计数连带 ∥ 零标题节点连带**（`thincoder-core/prompts/common.md` 标题节点 24 不变）；本登记为**紧凑形**，不新增 `§6.N` 编号（先例 = §6.1 落点清单 `:164` 紧凑登记）。

**落点（唯一副本 = `thincoder-core/prompts/`）**：三档四处（`thincoder-core/prompts/common.md` 两处 ∥ `thincoder-core/prompts/discipline-engineering.md` ∥ `thincoder-core/prompts/persona-engineering.md`）——设计先行、coder 落笔；
同四处逐字文本 = 该批设计围栏块（一次性材料不混入本档——D2）。

**机检**：`scripts/prompt-refs-check.mjs` 复跑 = 0 命中（新文本零文档引用）；`##` 块计数可机判（三档 19 ∥ 17 ∥ 10 改前 = 改后）；**不新增断言**（内容在场 = 一次性比对——落地档 ↔ 设计围栏块，承 §6.1「批次收尾核对」）。

**边界**：零机械门 · `wait_for` 工具本体与其描述面零触（描述面口径 = 内容依据机制文档、落笔 eng-coder，另笔议）· `thincoder-core/prompts/discipline-normal.md` 零触（普通侧已载 async 默认 / 自动到达 / 无需轮询）· `thincoder-core/prompts/common.md` 既有「禁空转等待、禁轮询」条零动（射程 = 在途提问的答复等待，语义自足）· 需求档零笔（父侧）。

### 6.30 EN 运行面的语言纪律（中文只许出现在四类字面上）

**规则**：`thincoder-core/prompts/**` = 模型唯一运行面（读者是模型，不是人）⇒ **散文一律英文**；中文**只允许**出现在下列四类字面上，每类各有机械依据。四类之外的中文行 = 残留，必须译。

| 类 | 字面 | 机械依据 | 译了会怎样 |
|---|---|---|---|
| K1 工具实参枚举 | `ledger` 六态（待讨论 / 待设计 / 在途 / 待核销 / 已核销 / 已废弃）· `trigger` 三值（归批 / 条件 / 认账不排期） | 库表 `CHECK` 与工具 `enum` 字面（`ledger-db.mjs:161/167` · `ledger-tools.mjs:107/117`）；写面谓词比字面（`ledger-cmd.mjs:69` · `agent/dispatch.mjs:90`） | 工具拒收 / 状态机失常 |
| K2 批次档机判字面 | `**状态行**：` · `进行中` / `已收口` / `设计完成` / `评审完成` / `实施完成` · `> 不适用` · `<§N 模板占位：` · `前情 = ` · `**重开记录**：` | `batch-skeleton.mjs:35-38/61/221` · `batch-lifecycle.mjs:291` · batch create 对 `prev` 剥 `前情 = ` 前缀 | 冻结门 / 链完整性门判读失败 |
| K3 机产 · 机读标记 | `[上抛·待裁]` / `[上抛·知会]` · `收尾链待跑` · `老化` · `### 轮次 N（评审子代理）` | `parent-channel.mjs:155` · `ledger-db.mjs`（`ROUND_MARKER` 单源——`agent/light-round.mjs` 经动态 import 消费）· `ledger.mjs:137` 渲染 · batch 工具评审戳 | 标记对不上：消息、轮次闸、台账渲染各认各的字面 |
| K4 记录面 · 输入面复写字面 | 写进中文批次档 / 台账的约定串（`评审通过` · `暂缓批复核：无` · `暂缓 · 复核条件` · `已查无` · `已定决定`——成员为示例、判据按类）· 用户会说的中文别名（`会诊` · `飞刀`） | 落点 = 中文记录面本身；别名 = 用户输入词 | 提示词描述一个没人会写的串；别名删了则识别不到用户原话 |

**判据**：① K1–K3 字面逐一 grep 在场。

② 四类之外的中文行 = 残留。判据命令自含（扫描根 = `thincoder-core/prompts`，判据 = 行内含汉字即列出，再逐行归入 K1–K4 或判残留）：

    node -e "const fs=require('node:fs'),d='thincoder-core/prompts';for(const f of fs.readdirSync(d))if(f.endsWith('.md'))fs.readFileSync(d+'/'+f,'utf8').split('\n').forEach((l,i)=>/[\u4e00-\u9fff]/.test(l)&&console.log(f+':'+(i+1)))"

③ 指向中文档节的指针（如 `DOC-DISCIPLINE.md §3.20`）= 文档引用，按 §6.6 处置：**删引用（非改址）**——引用本身删除，句子改写成不依赖档名 / 节号的英文自足句（提示词运行期读不到文档，指针是死文本）。

**边界**：本纪律只管 `thincoder-core/prompts/**`；`tool-docs/**` 不在规则内（`docs/` 下已无提示词档）。

### 6.31 提示词 / 模型可见面残留清零（`#1683` ∥ `#1684`）

**定位**：两笔同属「提示词 / 模型可见面」的旧口径残留——`#1683` = 代码常量注仍写「内容依据 = 父侧」，`#1684` = 模型可见文本里还剩五条文档引用。判据单源 = §6.6（本节不动判据句，只给目标形与处置）。

**勘察证据（§6.26 义务行）**：设计开工前查过——本档 §6.4 / §6.6 / §6.11 / §6.19 / §6.26 ∥ `docs/README.md`（逐档地图 `:50` 工具系统 ⇒ `TOOLS.md` · `:51` 提示词系统 ⇒ 本档）∥ `docs/core/requirements/PROMPT-SYSTEM.md`（需求面第 16 条 = §6.6 上位原则）∥

工作区兄弟仓（`thincoder.com/` ∥ `thinworker/` ∥ `thincoder-issues/`，`AGENTS.md` 载其性质 = 站点 / 桌面 worker / issue 脚本）——**已查无**与本主题相关的机制档。实施坐标逐处实读，见 §6.31.1 / §6.31.2。

**最近先例**：`#1684` 对齐 §6.6 清零轮（判据同源，只处置剩余命中）与 §6.19 `:445` 的机检形（复跑 `prompt-refs-check.mjs`、零新增断言）；`#1683` 对齐 `docs/batches/2026-10-19-prompt-mech-single-face.md` 的同句族收正（常量注 / 模型可见串口径收正）。

**对齐** = 目标形逐处给「现文 ⇒ 目标形」、判据句零改、机判复用既有脚本。**偏离** = 把注释面（`helpers.mjs` JSDoc）纳入本笔笔域——§6.6 `:186` 明写「注释面不在本面（另批治理）」；偏离理由 = 台账 `#1683` 的触发条件正是「常量注口径与设计档相抵」，且改动仅注内措辞、零行为变（§6.31.1）。

#### 6.31.1 `#1683` 常量注口径收正（注释面 · 零行为变）

**归属理由（为何登记在本档而非拥有档）**：本笔 = 模型可见面 / 提示词面残留清零，属 §6.6 域，故笔落本档；`TOOLS.md` §6.15.3 与 `AGENT-LOOP-UPSTREAM.md` / `AGENT-LOOP-ASYNC-POOL.md` 在本笔只作**内容依据**（注该怎么写由它们定），不重记同一笔——同一机制两处各记一份即成两说（D2）。

**现状（实读）**：`thincoder-core/agent/helpers.mjs:454`（`AUTO_TURN_DIGEST_DOMAIN_ENG`）· `:461`（`UPSTREAM_TURN_DOMAIN`）· `:470`（`TIMER_TURN_DOMAIN`）三处 JSDoc 末句 = `Content authority = parent side.`；同文件另有一处同形 `:478`（`DIGEST_ACCOUNT_DOMAIN`，小写 `content authority = parent side.`）。

**定性 = 注释措辞，不是行为**：几条常量的字符串本体 = 注入模型的提醒文本；选串点只引用常量名，「authority」句不参与运行期判断 ⇒ 改注、不改串、不改选串点。旧口径与 §6.1 现行裁定（提示词 = 产品代码面 · 内容依据 = 机制文档 · 落笔 = eng-coder）相抵，属 doc-code 分歧。

**目标形（英文注逐字）**：

| 坐标 | 现文要点 | 目标形 |
|---|---|---|
| `helpers.mjs:454` | 末句 `Content authority = parent side.` | `Content basis = the mechanism doc; landing = eng-coder.` |
| `helpers.mjs:461` | 同上一句 | 同上 |
| `helpers.mjs:469`–`:470` | `Verbatim from the parent-side final text (single line — no newlines).` + `Content authority = parent side.` | `Verbatim from the mechanism doc (single line — no newlines).` + `Content basis = the mechanism doc; landing = eng-coder.` |
| `helpers.mjs:477`–`:478` | 与 `:469`–`:470` 同形（小写） | 同 `:469`–`:470` |

**依据坐标**：§6.1 · `TOOLS.md` §6.15.3（`:708` 要求该注 = 内容依据 = 机制文档 + 出处指针）· `AGENT-LOOP-UPSTREAM.md` §6.27.12.8（内容依据 = 机制文档，落笔 = eng-coder）· `AGENT-LOOP-ASYNC-POOL.md` §6.30.3 与 §6.31.3（逐字文本 = 机制文档定稿，落笔 = eng-coder）。

#### 6.31.2 `#1684` 五条命中处置

**机器读数（改前）**：`node scripts/prompt-refs-check.mjs` ⇒ 提示词面 69 档 · 代码面 459 档 · 命中 5。

| # | 命中坐标 | 现文要点 | 目标形 | 依据 |
|---|---|---|---|---|
| 1 | `thincoder-core/tool-docs/batch.md:1` | `…is refused except the reopen conjunction (§4.18-B)` | 删括注：`…is refused except the reopen conjunction` | 判据线②：删后句义自足（重开合取下一句逐句描述）；逐字设计锚 = `TOOLS.md` §6.24 ① `close` 行同轮改去括注形（§6.31.6 K5） |
| 2 | `thincoder-core/tool-docs/doc_check.md:12` | 示例 `file.md:12` | `<doc>:12`——`<doc>` = 元变元：非档名、无 `.md`（否则易读成 §6.6 禁止的「改址」） | 语法示例不是引证；角括号形天然不命中；示例含义（行号坐标不是节引用）保留 |
| 3 | `thincoder-core/tool-docs/doc_check.md:33` | 引擎件清单含 `thincoder-core/tool-docs/doc_check.md` | 该件改称 this tool description——入列**不加反引号**（清单其余项都是反引号包裹的路径，加反引号会被读成路径形）；其余五件为 `.mjs` | 指向文档 ⇒ 删引用；语义（描述档自身也是引擎件）保留 |
| 4 | `thincoder-core/agent-tools/batch-lifecycle.mjs:460` | 回执串含 `(§4.18-A)` | 删括注：`…the closeout chain gate still applies at the next close.` | 返回串 = 模型可见面；节号在模型侧无解析能力 |
| 5 | `thincoder-core/agent-tools/batch-lifecycle.mjs:504` | 回执串含 `, §4.18-B` | 删 `, §4.18-B`，保留 `§1 → 进行中 with a note` | 同 4；`§1` = 协议自名（合法正例） |

**处置通则**：五条全按「删引用（非改址）· 句义保留」处理；零新增 J3 豁免（白名单 = 判据单源）；零改 §6.6 与 `DOC-DISCIPLINE.md` 的判据句。

**判据对账（与 §6.6 `:191` 括注的关系）**：`§1`–`§6` 裸段号（单数字、无点）= 协议自名，`scripts/prompt-refs-check.mjs:34` 的 `J2_RE` 不命中；两段形（`§N.M` / `§N.M-K`）由 `J2_RE` 的 `\d+\.\d` 分支持照命中 ⇒ 判为外部档节号 ⇒ 命中。

故第 4 / 5 条把 `§4.18-A` / `§4.18-B` 当命中删，与 §6.6 `:185`「判据 = 指称本协议自身对象，指外部文档者一律入引证面」一致（`§4.18` = `BATCH-RECORD.md` 的节号）。§6.6 `:191` 括注的「及其下级两段形」句面本批不改，待另笔收窄。

#### 6.31.3 受影响文件（现行行数 = `split("\n").length − 1` 实读）

| 文件 | 现行 | Δ（⇒ 实施后） | 档位与拆分结论 |
|---|---|---|---|
| `thincoder-core/agent/helpers.mjs` | 492 | ±0（注内改写：`:454` `:461` `:469`–`:470` `:477`–`:478`） | 核件 · 492 未越 500 软线（贴线无结构影响）⇒ 无需拆分 |
| `thincoder-core/tool-docs/batch.md` | 1（单行 · 无尾换行） | ±0 | 工具描述（产品代码面） |
| `thincoder-core/tool-docs/doc_check.md` | 54 | ±0 | 工具描述（产品代码面） |
| `thincoder-core/agent-tools/batch-lifecycle.mjs` | 505 | ±0 | 核件 · 505 越 500 咨询线 ⇒ **无需拆分**：本笔只删固定串片段、结构零动（先例 = 本档 `:708` 对 509 行 `cmd-config.mjs`「无需拆分（≤±3 无结构影响）」） |
| `docs/core/design/TOOLS.md` | 1551 | ±0（§6.24 ① `close` 行单元格去括注） | 设计档（本笔笔域 · 逐字锚同步，见 §6.31.6 K5） |
| `docs/core/design/PROMPT-SYSTEM.md` | 1004 | ±0（实施轮零触——本节行数增益属设计轮） | 设计档（本笔笔域） |

**预算读数（D3 随动）**：本笔改 `tool-docs` 两档 ⇒ §6.11 当前读数（`:287` **143,572**）**随动 −14 字符**——

算式 = `thincoder-core/tool-docs/batch.md` 删 ` (§4.18-B)` −12 ∥ `thincoder-core/tool-docs/doc_check.md:12` `file.md` → `<doc>` −2 ∥ `thincoder-core/tool-docs/doc_check.md:33` `thincoder-core/tool-docs/doc_check.md` → `this tool description` 0；

  `batch-lifecycle.mjs` 两处是运行期回执串、不入 `tool-schema-size` 的 `{description, parameters}` 计式 ⇒ 零随动。
复测 = `node scripts/tool-schema-size.mjs`（改前读数 `143,572` · 1.387× · `tool-docs 53 档 92,396 字符`，本席实跑）；实施后按同式回填。

**测试面**：不新增单元测试档——改动 = 注释与固定串文本，无分支；机判 = 既有 `prompt-refs-check` 常驻脚本，不新增断言。

#### 6.31.4 验收（回指本批两条目）

| 条目 | 命令（仓根 `thincoder/`） | 期望读数 |
|---|---|---|
| `#1684` | `node scripts/prompt-refs-check.mjs` | 提示词面 69 档 · 代码面 459 档 · `命中 0` + `OK(prompt-refs)`（改前 = 5，本席实跑） |
| `#1684` | doc-check 交付门（范围 = 本轮所写档） | 0 条命中（全仓报告态 261 条悬空 = 既有基线，非本批域） |
| `#1683` | `grep -in "content authority" thincoder-core/agent/helpers.mjs` | 0 行（大小写不敏感——`:478` 现文小写，区分大小写形即使未改也读 0 = 假绿） |
| `#1683` | `grep -n "parent-side final text" thincoder-core/agent/helpers.mjs` | 0 行（覆盖 `:469` / `:477` 的 `Verbatim from the parent-side final text`） |
| `#1683` | `node --check thincoder-core/agent/helpers.mjs` | 退出码 0 |


#### 6.31.5 用例表（正常 / 边界 / 错误）

| 编号 | 场景 | 输入 / 动作 | 期望 |
|---|---|---|---|
| C1 | 正常 | 改后跑 `prompt-refs-check` | 命中 0 |
| C2 | 边界·幂等 | 连跑两次 | 两次读数同 = 0 |
| C3 | 边界·域未失 | 看汇总行 | `提示词面 69 档 · 代码面 459 档`（与改前同） |
| C4 | 正常·回执可读 | 触发 `batch` 重开回执 / close 回执 | 无节号，句义自足；`§1` 保留 |
| C5 | 错误防御 | 任一命中档回填一条 `§4.1` | 复跑报 1 条（锁仍生效） |

#### 6.31.6 关键决策

| # | 决策 | 理由 |
|---|---|---|
| K1 | 四处注一并收正（台账记三处，实读第四处 `:478`） | 同文件 / 同句 / 同依凭；残留即示范 |
| K2 | `thincoder-core/tool-docs/doc_check.md:12` 换形不删 | 删掉示例即丢「行号坐标不是节引用」的含义 |
| K3 | 回执串删节号、不改指 | 模型侧无解析能力，改指仍是死文本 |
| K4 | 零新增豁免 | 白名单与判据 = 单源，动它即改判据 |
| K5 | `TOOLS.md` §6.24 ① `close` 行**同轮改去括注形**，不声明「历史锚退役」 | ① 该机制仍现行（close 仍冻结档、仍只留重开合取一口），把活锚标成历史文本 = 活档留死句；② `TOOLS.md:1507` 自述本节 = 模型可见文本面逐字 ⇒ 两个逐字面必须同形，否则实现落地即成两说（§6.4 设计锚 = 权威源、实现面照抄）；③ 代价 = 一行单元格、行数 ±0 |

#### 6.31.7 边界（不做）

不改 §6.6 判据句 / 白名单 / 域；不改 `DOC-DISCIPLINE.md` 判据句；不改提示词正文（`thincoder-core/prompts/**` 零改）；不动裸档名存量（机器不可分面）；不改常量字符串本体与选串点；不改全仓 261 条既有悬空（另域）。`TOOLS.md` 只同轮改 §6.24 ① 的 `close` 行单元格（逐字锚随实现同步；不声明历史锚退役，理由见 §6.31.6 K5），该档其余节零触。本会话内不收口——已知代价 = 改引擎件 ⇒ 交付门 ERROR（见 §6.31.4）。

#### 6.31.8 上抛项（待裁）

1. 台账 `#1683` 记三处，实读四处（`:478`）——本设计按同批收正，请父侧登记计数差。
2. 设计档内两处仍写「父侧落笔」：`AGENT-LOOP-UPSTREAM.md:600`（英文代码文本归父侧同轮落笔）· `:328`（不改提示词正文（父侧落笔））。与 §6.1 现行口径相抵——本笔不动（语义面 · 非本批文件），请父侧裁定处置。

### 6.32 禁类写法改因面（提示词面 · 逐项执行清单）

**用户令（2026-10-17 23:46）**：「我不喜欢用什么铁律/禁止/不许之类的办法，我更相信『知其然知其所以然』」（23:47「要做」）。本段 = 该令在提示词面的长期口径。

**归属（与 D9 的关系）**：`DOC-DISCIPLINE.md` §1 D9 = 上位机制（规则须携 why 的通用判据）；本节 = D9 在**提示词面的应用面**——只定提示词怎么写、本批改哪几处、怎么验；判据本体不在此重述（D2）。

**域** = `thincoder-core/prompts/**`（16 档运行期注入面）内的**英文指令式否定**。
不在域：`thincoder-core/tool-docs/**`（工具描述面——自身体量帽与判据在 §6.11）· `thincoder-core/prompts/subagent-base.md`（本批零命中，非改写对象）· 中文机制档 `docs/core/design/**`（人读面，不进模型上下文）· 三包生产码字符串（本批零触）· 提示词内的描述性否定 / 能力事实 / 机制事实 / 参数字汇（口径见下「指令式禁令口径」）。

窄化依据：用户令说的是「办法」层（用什么办法让规则成立），本段取其中**模型可见、且换句式不丢语义**的那一面；其余面各自的判据不并入本节。

**边界（本段不做）**：① 不改提示词正文（改写 = 实施轮 eng-coder，本节只给目标形）；② 不改 D9 判据本体与需求档；③ 不动 `tool-docs/**` · `scripts/**` · 三包生产码；④ 不动 306 行裸档名存量与机制名「铁律块注入」（`AGENT-LOOP-ASYNC-POOL.md:195`）；⑤ 不新增 `##` 块、不新增单测断言。

**写作判据（三分类 = 写作依据）**：一条规则必须能回答「它靠什么成立」——① 机制约束 ② 实测事故 ③ 用户裁决之一。答得出 ⇒ 写成「因为 X，所以 Y」（可改因）；答不出、规则仍须存在（命名 / 格式 / 阈值 / 结构 / 排期）⇒ 保留禁令式并写明「这是约定，不是道理」；答不出又判断不了 ⇒ 单列上报用户裁。

**两套分类不同轴（显式区分）**：**三分类 = 一条规则为什么能成立**（写作时用，上一段）· **四分区 = 本批 72 行各自怎么处置**（改写时用，见本节末「条目处置与计数」）。两者不互替、不互相推导。

**防硬编因果 · 两道准入（次序固定）**：给约定补一个编造的原因比禁令更坏——模型会拿假理由去推断没见过的场合。

- **准入①**（首选）= **原句本身（或其同段邻句）已带原因** ⇒ 只换句式（`never X: why` → `do Y, because why`），why 逐字复用，不新造因果。
- **准入②**（次选）= 原句无原因、而机制档或提示词另一处有**可核坐标** ⇒ 按坐标的意思改写，并在逐项表「准入」列写明该坐标；给不出坐标 ⇒ 不得走②。
- **次序** = 先①后②；②不得引入①没有的新因果；两道都不成立 ⇒ 归 B（约定）或 C（需裁），不补理由。
- **本批 44 项**：**37 项走① · 7 项走②**（② = `thincoder-core/prompts/advisor-round2.md:46` ∥ `thincoder-core/prompts/advisor-round2.md:64` ∥ `thincoder-core/prompts/advisor-round3.md:42` ∥ `thincoder-core/prompts/advisor-round3.md:60` ∥ `thincoder-core/prompts/common.md:19` ∥ 
  `thincoder-core/prompts/persona-eng-coder.md:37` ∥ `thincoder-core/prompts/persona-eng-coder.md:38`，各坐标见逐项表 why 列）。
- **可核形**：① 项的 why **逐字引在逐项表第 5 列**（原句内片段，实施轮回读原行即可核对），② 项的坐标写在同一列。两列都没有落字的项 ⇒ 不准改，归 B 或 C。

**指令式禁令口径（改写对象只限这一类）**：计入 = 规范 / 祈使句里的 `never` · `do not` · `don't` · `must not` · `may not` · `forbidden`。不计入 = 描述性否定（"x never happens"）· 能力事实（"you do not have …"）· 机制事实（"content is never read"）· 参数字汇（`forbidden scope`）· 引用用户原话。

**计数式与处置口径不同拍**：计数式按词面计、无语义过滤，所以描述性否定仍会出现在读数里；处置时按上一句不计入，读数里把这几个坐标登记为**保留位**（见「条目处置与计数」）。两者不互抵——读数要的是可复跑，处置要的是语义。

**勘察证据行**：已查 `docs/core/design/DOC-DISCIPLINE.md`（D9 条 = 本节上位机制）· 本档 §6.11（工具描述面体量帽，非本面）· §6.13 ∥ §6.28（「逐字文本 = 设计围栏块」的既有形）；`thincoder-core/prompts/` 16 档已全量扫（读数见「基线」节）。除上述无其他相关公共源文档——已查无。

**先例 ∥ 偏离**：

- **先例一 = §6.31 处置批形**（逐项处置表 + 验收表 + 用例表 + 边界 + 上抛）——本段全形照抄。
- **先例二 = §6.13 ∥ §6.28 的「逐字文本 = 设计围栏块（一次性材料不混入本档——D2）」**——本段不采用该形：本批逐字目标句 = 各档终态句的一部分，实施轮逐处照抄；放进一次性围栏块会让实施者拿两份文本对不齐。改用**本节内逐项表 + 组文案表**（唯一副本 = 本节）。
- **先例三 = §6.1 变更流的「复用存量词句、语义对等」**——仍是本批口径：改写只换句式，why 逐字复用（即准入①）。
- **偏离 = 不出「全档终态围栏块」**：44 项散在 9 档、合计 1400+ 行，抄全档的成本远高于收益；代替 = 逐项表（坐标 + 原句摘要 + 目标形）＋ 实施轮逐处改＋改后计数复核。

**标题命名轴（可判一句）**：标题陈述**该块赖以成立的机制或裁决**，不陈述服从强度——判法 = 读标题能否说出「这块为什么成立」；说不出 ⇒ 按强度命名，改。

**标题对照表（4 项）**：

| # | 现名 | 所在档 · 行 | 新名 | 依据类别 |
|---|---|---|---|---|
| H1 | `## 🔴 Top hard constraints (violating ⇒ rework; each carries its why)` | `thincoder-core/prompts/discipline-engineering.md:3` | `## 🔴 What this mode runs on (each clause names the structure it rests on; a clause that cannot answer is a habit)` | 用户裁决（23:46 令）+ 机制约束 |
| H2 | `## Basic flow (four hard steps — no skipping)` | `thincoder-core/prompts/discipline-engineering.md:29` | `## Basic flow (four steps, in order)` | 机制约束（四步顺序 = 流程机制本身） |
| H3 | `**Destructive-command red lines**:` | `thincoder-core/prompts/common.md:179` | `**Destructive commands — the tool layer catches none of this**` | 机制约束（同节 boundary 行：工具层对五类红线零拦截） |
| H4 | `### Rules` | `thincoder-core/prompts/discipline-normal.md:187` | `### Conventions (each line states what it rests on)` | 用户裁决（该块内容 = 约定，不是道理） |

**逐项坐标表（44 项 = A 区全部处置项；「目标形（组 · 粒度）」列的逐字文案见下「组文案表」）**：

**目标形粒度**：默认 = **子句替换**（只换含否定词的那个子句，原句其余内容逐字保留）；粒度列标 **整行** 的项 = 该行整体以组文案重写（该行只有目标句，或同行的多处否定都在同一处分句簇内）。实施轮不得把子句替换做成整行重写——那会丢掉原句自带的原因句。

| 档 · 行 | 原句摘要 | 目标形（组 · 粒度） | 准入 | why 出处片段（原句内逐字） |
|---|---|---|---|---|
| `thincoder-core/prompts/advisor-design.md:60` | never skip it silently … never pretend it was written | G1 · 整行 | ① | a silent skip lets the parent proceed as if the record were on disk |
| `thincoder-core/prompts/advisor-round2.md:22` | never drop an item silently: a dropped item is gone | G2 · 子句 | ① | a dropped item is gone — the parent settles by the table and treats it as done |
| `thincoder-core/prompts/advisor-round2.md:28` | zero-reason silence or evasion never closes an item | G2 · 子句 | ① | nothing was evaluated, and accepting it records a defect as fixed |
| `thincoder-core/prompts/advisor-round2.md:29` | an item must not vanish from the table silently | G2 · 子句 | ① | the parent settles by the table and treats a missing item as done |
| `thincoder-core/prompts/advisor-round2.md:46` | never skip it silently, and never pretend it was written | G1 · 整行 | ② | 原句无 why ⇒ 坐标 `thincoder-core/prompts/advisor-design.md:60`（同句族 in-line why） |
| `thincoder-core/prompts/advisor-round2.md:64` | silence or evasion is never accepted | G2 · 子句 | ② | 原句无 why ⇒ 坐标 `thincoder-core/prompts/advisor-round2.md:28`（nothing was evaluated） |
| `thincoder-core/prompts/advisor-round3.md:21` | never drop an item silently | G2 · 子句 | ① | a dropped item is gone — the parent settles by the table and treats it as done |
| `thincoder-core/prompts/advisor-round3.md:25` | a zero-reason non-fix is never accepted | G2 · 子句 | ① | because without a reason there is nothing to evaluate |
| `thincoder-core/prompts/advisor-round3.md:26` | never drop an item silently（状态词表句） | G2 · 子句 | ① | the parent settles by the table and treats a missing item as done |
| `thincoder-core/prompts/advisor-round3.md:42` | never skip it silently … never pretend it was written | G1 · 整行 | ② | 坐标 `thincoder-core/prompts/advisor-design.md:60` |
| `thincoder-core/prompts/advisor-round3.md:60` | silence or evasion is never accepted | G2 · 子句 | ② | 坐标 `thincoder-core/prompts/advisor-round3.md:25` |
| `thincoder-core/prompts/common.md:19` | other docs use the term, never restate the definition | G3① · 子句 | ② | 坐标 `thincoder-core/prompts/common.md:216`（a copy drifts from its source） |
| `thincoder-core/prompts/common.md:28` | Speed is never the bottleneck — rushing gets paid back | G16① · 子句 | ① | time grabbed by rushing gets paid back in rework |
| `thincoder-core/prompts/common.md:30` | don't invent — an invented answer hides the gap | G16② · 子句 | ① | an invented answer hides the gap … it always costs more once the user notices |
| `thincoder-core/prompts/common.md:55` | a citation … may not appear in any text the model reads（同行另 1 处：citations are deleted, never re-pointed） | G16③ · 子句（两句同换） | ① | it goes stale, and a model reading it follows the pointer and guesses instead of reading the source, so a sentence must stand on its own |
| `thincoder-core/prompts/common.md:215` | closed records are frozen, never back-edited | G4① · 子句 | ① | the wrong one gets acted on (… copied into new work) … the doc copy adds zero recoverability |
| `thincoder-core/prompts/common.md:216` | never copy the cited content — a copy drifts | G3② · 子句 | ① | a copy drifts from its source |
| `thincoder-core/prompts/common.md:217` | a state doc never cites a process doc（同行另 1 处：never the reverse） | G3③ · 子句（两句同换） | ① | a batch record … can be deleted whole, so a requirement/design doc citing it … dies with it |
| `thincoder-core/prompts/common.md:225` | never in git — a ledger in the tree travels with every clone | G5 · 子句 | ① | a ledger in the tree travels with every clone and disappears with the project tree |
| `thincoder-core/prompts/common.md:234` | never a schedule / never in a batch record（同行另 2 处：only home / never the reverse） | G6 · 整行（4 子句全换） | ① | it can be dropped whole, and whatever lives only there disappears with it |
| `thincoder-core/prompts/common.md:242` | a state doc states as of now — never how it got there | G4② · 子句 | ① | a mixed doc makes the reader work out which value is still alive |
| `thincoder-core/prompts/common.md:261` | "it has always been a config-file item" is never an exception | G16④ · 子句 | ① | a hint pointing at an entry that does not exist in the UI sends the user hunting for it and costs the trust in every later hint |
| `thincoder-core/prompts/common.md:268` | never copy checklists from public platforms | G7① · 子句 | ① | a copied checklist protects an imagined surface |
| `thincoder-core/prompts/discipline-normal.md:180` | a zero-reason refusal is never accepted | G2 · 子句 | ① | since there is no reason to evaluate |
| `thincoder-core/prompts/discipline-normal.md:182` | a zero-reason refusal is never accepted | G2 · 子句 | ① | there is nothing to evaluate |
| `thincoder-core/prompts/persona-eng-coder.md:20` | do not edit it — report it for the parent to route（同行另 1 处：hits are never booked to the ledger） | G14 · 子句（两句同换） | ① | pen-domain discipline outranks going green |
| `thincoder-core/prompts/persona-eng-coder.md:37` | never skip it silently … never assume the parent will ghost-write | G1 · 整行 | ② | 坐标 `thincoder-core/prompts/advisor-design.md:60` |
| `thincoder-core/prompts/persona-eng-coder.md:38` | do not execute — bounce it back — never fabricate a task book | G15 · 子句 | ② | 坐标 `thincoder-core/prompts/common.md:238`（The task book itself：unreadable ⇒ refused） |
| `thincoder-core/prompts/persona-eng-designer.md:30` | an invalidated expression never stays on the normative face | G12 · 子句 | ① | residue makes readers re-open dead items as live work orders (this actually happened) |
| `thincoder-core/prompts/persona-eng-designer.md:49` | never self-grant an exemption … never booked to the ledger | G13 · 子句 | ① | an unclear fix ⇒ escalate to the main agent; the main agent is unsure ⇒ relay to the user (F7's recipient is the user) |
| `thincoder-core/prompts/persona-engineering.md:61` | walk DOWN, never up | G8① · 子句 | ① | walking up lands the manifest in an unrelated enclosing project |
| `thincoder-core/prompts/persona-engineering.md:65` | **Never brick the session** | G8② · 子句 | ① | a session can start in any directory, and killing it over a missing project throws away the whole context |
| `thincoder-core/prompts/persona-engineering.md:67` | Never hand-edit the JSON | G8③ · 子句 | ① | hand-editing splits the state from the tool's assumptions, and the next read interprets it by another set of rules |
| `thincoder-core/prompts/persona-engineering.md:87` | never commit on behalf of the user's / others' docs | G9 · 子句 | ① | a commit on someone else's behalf takes work they were still writing |
| `thincoder-core/prompts/persona-engineering.md:130` | a zero-reason refusal is never accepted（同行另 1 处：a dropped defect is one the user never learns about） | G2 · 子句（两句同换） | ① | with no reason there is nothing to evaluate |
| `thincoder-core/prompts/persona-engineering.md:137` | a zero-reason refusal is never accepted | G2 · 子句 | ① | with no reason there is nothing to evaluate, and accepting it records a defect as fixed |
| `thincoder-core/prompts/persona-engineering.md:148` | **Never let a design token expire** | G10 · 子句 | ① | letting one expire voids that authorization and the review must be walked again |
| `thincoder-core/prompts/persona-engineering.md:151` | Credentials never land in docs | G7② · 子句 | ① | a token or designId value written into a doc … goes into git with the doc and gets retrieved, and it cannot be taken back |
| `thincoder-core/prompts/persona-engineering.md:197` | never into `trigger` | G11 · 子句 | ① | a value written as prose cannot be filtered on |
| `thincoder-core/prompts/persona-engineering.md:214` | never into `trigger` | G11 · 子句 | ① | a value written as prose cannot be filtered on |
| `thincoder-core/prompts/common.md:179` | **Destructive-command red lines**（标题） | H3 · 整行 | ① | 见「标题对照表」依据类别列（工具层对五类红线零拦截） |
| `thincoder-core/prompts/discipline-engineering.md:3` | ## 🔴 Top hard constraints（标题） | H1 · 整行 | ① | 同上（用户裁决 + 机制约束） |
| `thincoder-core/prompts/discipline-engineering.md:29` | ## Basic flow (four hard steps — no skipping)（标题） | H2 · 整行 | ① | 同上（四步顺序 = 流程机制本身） |
| `thincoder-core/prompts/discipline-normal.md:187` | ### Rules（标题） | H4 · 整行 | ① | 同上（该块内容 = 约定） |

**组文案表（逐字 · 实施轮照抄；唯一副本 = 本节）**：

- **G1**（4 处 · `thincoder-core/prompts/advisor-design.md:60` ∥ `thincoder-core/prompts/advisor-round2.md:46` ∥ `thincoder-core/prompts/advisor-round3.md:42` ∥ `thincoder-core/prompts/persona-eng-coder.md:37`）：
  `If the write does not land (refused / failed) → say "<segment> not written" plainly in the report. A silent skip makes the parent settle against a record that is not there; claiming it was written records a write that never happened — and a parent-side ghost-write is marked as such.`

  （唯一词面命中 = 句末 `never happened`，描述性否定 ⇒ 见「保留位」）
- **G2**（12 处 · 评审轮次表的状态与裁决句）：
  `Every item appears in the table with its state: the parent settles by the table, so an item missing from it reads as done. A non-fix with no reason stays Unfixed — with nothing stated there is nothing to evaluate.`

  （**两句范本**：缺项句与无因句，各站取与原句语义对等的那一句，不整段照贴。`thincoder-core/prompts/persona-engineering.md:130` 同句第 2 处 `a dropped defect is one the user never learns about` → `a dropped defect is one the user stays blind to`。）
- **G3**（3 处 · 逐处各一句）：
  ① `thincoder-core/prompts/common.md:19` → `Other docs use the term; the definition lives here — a restatement drifts from its source.`
  ② `thincoder-core/prompts/common.md:216` → `Cite instead of copying: a copy drifts from its source.`

  ③ `thincoder-core/prompts/common.md:217` → `A state doc cites a state doc. A batch record can be deleted whole, so a citation into it dies with it.`
- **G4**（2 处）：
  ① `thincoder-core/prompts/common.md:215` → `Closed records stay as written — a back-edit rewrites an account someone already settled.`

  ② `thincoder-core/prompts/common.md:242` → `A state doc states what is true now. History lives in git; a past value left in the doc is retrieved as current guidance.`
- **G5**（1 处 · `thincoder-core/prompts/common.md:225`）：`The ledger lives in the user data directory. In the tree it travels with every clone and disappears with the project tree.`
- **G6**（1 处 · `thincoder-core/prompts/common.md:234` · **整行替换**）：`A batch record may be dropped whole, so anything that must outlive the round lives in the requirement/design docs. Dropping one is a maintainer's decision; no schedule does it.`
  （该行 4 个否定子句全换：`never a schedule` ∥ `never in a batch record` 由上式承接；`never the only home` → `no mechanism, a decision or a criterion lives only there`；`never the reverse` → `and not the reverse`。）
- **G7**（2 处）：
  ① `thincoder-core/prompts/common.md:268` → `Size protections by the loss this system can actually take, from its real data flows. A copied checklist guards a surface nobody runs.`

  ② `thincoder-core/prompts/persona-engineering.md:151` → `Credential values stay out of docs: a token written into a doc is a token in every clone, backup and reviewer's copy.`
- **G8**（3 处）：
  ① `thincoder-core/prompts/persona-engineering.md:61` → `Project root = the nearest directory walking DOWN from the anchor (direct children only). Walking up lands the manifest in an unrelated enclosing project.`

  ② `:65` → **子句替换**：只把加粗规则句 `**Never brick the session**` 换成 `**Bricking the session is not an option any project state overrides**`，其后的原因句逐字保留（**通则不收窄成 manifest 个案**）。该行改后逐字：
```
**Bricking the session is not an option any project state overrides**: a session can start in any directory, and killing it over a missing project throws away the whole context; when project parameters are needed and there is no project → **that action / that turn reports it**, without going silent 

  and without killing the session. Key decisions live in requirement-doc constraints, not in the manifest — the doc layer owns them.
```
  ③ `:67` → `Point-edit config through the settings tool. A hand-edited file splits the state from the tool's assumptions, and the next read applies another set of rules.`
- **G9**（1 处 · `thincoder-core/prompts/persona-engineering.md:87`）：`Commit path-limited and only your own work: a commit on someone's behalf takes what they were still writing.`
- **G10**（1 处 · `thincoder-core/prompts/persona-engineering.md:148`）：`A design token is short-lived runtime state: dispatch promptly after issuance. An expired token has to be re-issued, and work done against the old one is re-done.`
- **G11**（2 处 · `thincoder-core/prompts/persona-engineering.md:197` ∥ `:214`）：`The batch name / condition sentence goes into evidence. trigger holds one bare enum value; prose there cannot be filtered on.`
- **G12**（1 处 · `thincoder-core/prompts/persona-eng-designer.md:30`）：`Delete an invalidated expression from the normative face. Residue makes the next reader re-open a dead item as live work — this happened.`
- **G13**（1 处 · `thincoder-core/prompts/persona-eng-designer.md:49`）：`An exemption you grant yourself keeps a wrong rule alive because you wrote it. An unclear fix goes to the main agent; the main agent's uncertainty goes to the user. A gate hit is fixed in the round — booking it moves the work 
  where nobody looks.`
- **G14**（1 处 · `thincoder-core/prompts/persona-eng-coder.md:20` · 同句两处）：
```
A hit in a doc outside your pen goes to the parent for routing: editing it puts a second pen on someone else's page, and pen-domain discipline outranks a green gate. A gate hit is fixed in the round, not booked to the ledger — booking moves the work where nobody looks.
```
- **G15**（1 处 · `thincoder-core/prompts/persona-eng-coder.md:38`）：`An unreadable task book means no execution. A fabricated task book runs a whole round on a direction nobody set.`
- **G16**（5 处）：
  ① `thincoder-core/prompts/common.md:28` → `Correctness first. Rushing gets paid back in rework, so speed is not the bottleneck.`

  ② `thincoder-core/prompts/common.md:30` → `Say you cannot do something instead of inventing it: an invented answer hides the gap, and half-doing it costs more once the user notices.`
  ③ `thincoder-core/prompts/common.md:55` →（后半句承接原句 `citations are deleted, never re-pointed`——处置规则不丢）：
```
A citation sends the reader to another document for the meaning, and its wording changes under the sentence — so the sentence stands on its own. Disposal = delete, not re-point: the citation goes, the meaning stays in the sentence.
```
  ④ `thincoder-core/prompts/common.md:261` → `Every config item ships its UI in the same batch. "It has always been a config-file item" is a habit, not a reason — a hint pointing at a missing entry costs the trust in every later hint.`
  ⑤ `thincoder-core/prompts/common.md:179`（标题，即 H3）→ 见「标题对照表」。

**基线（as-of 2026-10-19 · 逐档实测；字符 = `String.length`，行 = `split(/\n/).length`）**：

| 档（`thincoder-core/prompts/`） | 行 | 字符 | 词面命中（处 / 行） | 本批改档 |
|---|---|---|---|---|
| `thincoder-core/prompts/advisor-design.md` | 77 | 12,260 | 2 / 1 | 是 |
| `thincoder-core/prompts/advisor-round1.md` | 63 | 11,210 | 1 / 1 | 否 | 0 |
| `thincoder-core/prompts/advisor-round2.md` | 65 | 11,127 | 6 / 5 | 是 | ≤ 334 |
| `thincoder-core/prompts/advisor-round3.md` | 61 | 11,087 | 6 / 5 | 是 | ≤ 333 |
| `thincoder-core/prompts/common.md` | 274 | 42,953 | 22 / 16 | 是 |
| `thincoder-core/prompts/consult-base.md` | 26 | 3,639 | 1 / 1 | 否 |
| `thincoder-core/prompts/discipline-engineering.md` | 201 | 36,538 | 3 / 3 | 是 |
| `thincoder-core/prompts/discipline-normal.md` | 264 | 38,509 | 8 / 7 | 是 |
| `thincoder-core/prompts/persona-coder.md` | 21 | 1,723 | 0 / 0 | 否 |
| `thincoder-core/prompts/persona-eng-coder.md` | 39 | 5,901 | 6 / 3 | 是 |
| `thincoder-core/prompts/persona-eng-designer.md` | 89 | 17,981 | 4 / 2 | 是 |
| `thincoder-core/prompts/persona-engineering.md` | 237 | 57,674 | 29 / 25 | 是 |
| `thincoder-core/prompts/persona-explore.md` | 15 | 931 | 1 / 1 | 否 |
| `thincoder-core/prompts/persona-normal.md` | 50 | 6,471 | 1 / 1 | 否 |
| `thincoder-core/prompts/persona-plan.md` | 27 | 2,329 | 0 / 0 | 否 |
| `thincoder-core/prompts/subagent-base.md` | 18 | 2,166 | 0 / 0 | 否 |
| **合计（16 档）** | — | **262,499** | **90 / 71** | 9 档 |

**计数式（仓根 `thincoder/` · 逐行实测，本席实跑）**：

```
node -e "const fs=require('fs'),d='thincoder-core/prompts';const re=/\bnever\b|\bdo not\b|\bdon't\b|\bmust not\b|\bmay not\b|\bforbidden\b|\bred lines?\b|\bhard limit\b/gi;let n=0,l=0;for(const f of 

  fs.readdirSync(d).filter(x=>x.endsWith('.md')).sort()){fs.readFileSync(d+'/'+f,'utf8').split(/\n/).forEach((s,i)=>{const m=s.match(re);if(m){n+=m.length;l++;console.log(f+':'+(i+1))}})}console.log('occ',n,'lines',l)"
```

逐档字符 / 行数与结构计数：

```
node -e "const fs=require('fs'),d='thincoder-core/prompts';for(const f of fs.readdirSync(d).filter(x=>x.endsWith('.md')).sort()){const t=fs.readFileSync(d+'/'+f,'utf8'),L=t.split(/\n/);console.log(f,L.length,t.length,L.filter(s=>/^## /.test(s)).length,L.filter(s=>/^#{2,} /.test(s)).length)}"
```

口径两条（判读数前先看）：① 词面各 token 加词边界，`red` 取 `lines?`——不带边界会多读两处子串假阳：`thincoder-core/prompts/advisor-round2.md:13` 的 "may note" ∥ `thincoder-core/prompts/discipline-engineering.md:184` 的 `measured line`（见「假阳性登记」）；单数形会漏 `thincoder-core/prompts/common.md:179` 的 "red lines"（改前唯一复数形）；

  ② 处 = token 次数、行 = 命中行数，一行可含多处（如 `thincoder-core/prompts/common.md:234` = 4 处 1 行）。

**验收表**：

| 条目 | 命令（仓根 `thincoder/`） | 期望读数 |
|---|---|---|
| A 区清零 | 上面「计数式」第一条 | 改前 `occ 90 lines 71`（同一判据式 = 逐档基线表 91/72 减去 `:184` 假阳 1/1）· 改后 **`occ 38 lines 34`**（2026-10-19 实施轮与设计席同式实跑）；残留坐标逐行落在 B / C / D 清单（34 处 / 30 行）∪ G1 保留位（4 处 / 4 行）两个集合内（零新增） |
| 逐档体量 | 上面第二条 | 7 档未改档读数不变；9 个改档各 ≤ 基线表上限；全量 ≤ 270,374 |
| 结构未失 | 上面第二条（第 3、4 列） | 逐档 `##` 块数与标题节点数与改前相等（本批零新增节；基线读数 = 改前跑一次即得） |
| 无文档引用 | `node scripts/prompt-refs-check.mjs` | `命中 0`（新文本零文档引用） |
| 设计档门 | `doc_check(mode:"gate", docs:["docs/core/design/PROMPT-SYSTEM.md"])` | 首行 `DOC-CHECK GATE: PASS` |

**用例表（正常 / 边界 / 错误）**：

| 编号 | 场景 | 输入 / 动作 | 期望 |
|---|---|---|---|
| C1 | 正常 | 改后跑「计数式」第一条 | `occ 38 lines 34`，且每条残留坐标 ∈ B / C / D 清单 ∪ G1 保留位 |
| C2 | 边界 · 幂等 | 连跑两次 | 两次读数相同（命令无状态、无写盘） |
| C3 | 边界 · 域未失 | 跑第二条 | 16 档仍在；7 档未改档字符零变；`##` 块数与标题节点数与改前相等 |
| C4 | 边界 · 口径 | ① 去掉全部词边界（`\b`）∥ ② 把 `red lines?` 写回单数 `red line`（保留边界） | ① 多读两处子串假阳：`thincoder-core/prompts/advisor-round2.md:13` 的 "may note" ∥ `thincoder-core/prompts/discipline-engineering.md:184` 的 `measured line` ⇒ `occ 92 lines 73`（90 + 2）；② 漏读 `thincoder-core/prompts/common.md:179` 的复数形 `red lines`（改前唯一）⇒ `occ 89 lines 70`（90 − 1）——两式均按同一基线核算，故口径按上两条写死 |
| C5 | 错误防御 | 任一档净增超上限 | 削 why 到一句（保留因的去向），复测；仍超 ⇒ 上报，不放宽帽 |

**条目处置与计数（复算 · 三者自洽）**：

- 词面命中 = **90 处 / 71 行**（16 档全量 · 同一判据式）。
- 四分区（条目处置清单）= **A 41 行 + B 4 行 + C 2 行 + D 25 行 = 72 行** ✓（A 的 41 行 = 词面命中行，其中 `thincoder-core/prompts/common.md:179` 本身是标题行）；清单内的 `thincoder-core/prompts/discipline-engineering.md:184` 在判据口径下零命中（假阳登记行）⇒ **命中读数 = 90 处 / 71 行**（72 − 1）。
- 处置项 = **44 项** = 41 个词面命中行 + 3 个词面外标题（`thincoder-core/prompts/discipline-engineering.md:3` ∥ `:29` ∥ `thincoder-core/prompts/discipline-normal.md:187`）；按标题 / 正文分：**4 个标题 + 40 个正文行 = 44 项**（`thincoder-core/prompts/common.md:179` 兼为标题与词面行，故 41 行 − 1 + 3 标题 = 44 项）✓。
- 改后残留 = **38 处 / 34 行** = B 6 处 / 4 行 + C 3 处 / 2 行 + D 25 处 / 24 行 + **G1 保留位 4 处 / 4 行** ✓（6+3+25+4 = 38 · 4+2+24+4 = 34）；A 区 56 处 / 41 行中 **52 处 / 37 行清零**（= 56−4 · 41−4）。
- **保留位（4 处 / 4 行 · 不处置）**：`thincoder-core/prompts/advisor-design.md:60` ∥ `thincoder-core/prompts/advisor-round2.md:46` ∥ `thincoder-core/prompts/advisor-round3.md:42` ∥ `thincoder-core/prompts/persona-eng-coder.md:37`——四处同为 G1 目标句内的 `a write that never happened`，是**描述性否定**（陈述「这次写没有发生」），
  按「指令式禁令口径」不计入处置；计数式无该过滤，故读数里仍计 4 处 / 4 行。**这 4 处不再改**：改掉只能靠躲词（写成 "was not made" 一类），句子更难读，而口径已把它排除在外。
- **假阳性登记（不处置 · 不改该行）**：`thincoder-core/prompts/discipline-engineering.md:184` 的实文含 `**Inventory as-of readings** (a measured line recording where things stand now)`——命中的是 `measu|red line| recording`，即 `measured line` 的子串。
  无词边界时 `red lines?` 命中 1 次，本判据带 `\b` 故 0 次。它是普通名词短语、不是禁类写法，也不属任何处置区 ⇒ **不计入判据读数，也不得为凑数改写该行**（改它只能靠改词躲判据，句子反而更难读）。


**上抛项（已裁）**：① C 区两条产品口径（`thincoder-core/prompts/persona-engineering.md:99` 内部台账不播报 ∥ `:203` 越界发现不回传）——裁前不改写；② 提示词面单档绝对帽 = **不设**（2026-10-21 用户裁：提示词无预算，体量只作读数）。

### 6.33 提示词 why 落地（单测用毕即删的成本公式）

**来源**：用户 2026-10-19 逐字——「提示词中要求单元测试文档用后即删的原因被你写得太抽象了…总是说按纪律该删停下来问意见」＋「我希望把 why 落进提示词，做到让模型知其然知其所以然」。台账 `#1701`。

**要修的那一处**：`thincoder-core/prompts/discipline-engineering.md:102` 的 `Delete on use` 句只给结果（删掉、不留可执行文件、无复跑面），**读不出成本**——模型看不出这条规矩在省什么，只能靠服从，遇到边缘就停下来问。真 why 一直住在需求档，只是没送到模型读的地方。

**单源关系（why 的唯一权威）**：`docs/core/requirements/TESTING.md` §1.1 第 2 条（在盘行 31：含公式「存量测试量 × 跑全量本能 = 跑测成本远超写码成本」与「删掉可跑的东西，就没有可跑的全量」）；让步句禁令 = 同档行 32（「why 可进规范面，让步句不得进」）。本节不复述判据，只定落地形（D2）。

**目标形（逐字 · 替换 `thincoder-core/prompts/discipline-engineering.md:102` 的 `Delete on use` 子句）**：

> **Delete on use — an action, not a question.** At closeout the batch's unit test files are deleted; exactly one reading line stays in batch record §5 (what was verified + command + result), and no executable file is kept. **Why**: after any change the reflex is to run everything, and this is an engineering-scale product — one agent-day produces code that would need hundreds of unit tests to verify, while unit tests are per-batch and one-off; so **accumulated test volume × the run-everything reflex = verification cost far above coding cost**. Delete the runnable artifacts and there is no "everything" left to run.

**中文口径句（语义锚，不进运行面）**：用毕即删是动作，不是问句；成本 = 存量测试量 × 跑全量本能，远高于写码成本；删掉可跑物，就没有「全量」可跑。

**逐句 why 对应（无对应 why 的句子一律不写）**：

| # | 目标形句 | 对应 why | 权威坐标 |
|---|---|---|---|
| S1 | Delete on use — an action, not a question. | 动作面：判据是「用毕即删」，不该停下来征询 | `TESTING.md:31`（⇒ 判据句）+ 用户原话（停下来问意见） |
| S2 | At closeout … deleted; exactly one reading line stays in batch record §5 (what was verified + command + result), and no executable file is kept. | 动作 + 边界：删什么、留什么 | `TESTING.md:31`（零留存）· 同档 `:36`（批档一行读数） |
| S3 | Why: after any change the reflex is to run everything … per-batch and one-off | 成本公式的两个因子：跑全量本能 · 工程级产品且每批一次性 | `TESTING.md:31` 逐字 |
| S4 | accumulated test volume × the run-everything reflex = verification cost far above coding cost | 成本公式本体 | `TESTING.md:31` 逐字 |
| S5 | Delete the runnable artifacts and there is no "everything" left to run. | 后果 / 边界：删后可跑面消失 | `TESTING.md:31`「删掉可跑的东西，就没有可跑的全量」 |

**既有句处置（同档 `:102`）**：

- 替换区间 = 自 `**Delete on use**:` 起，至 `no "re-run an old file" surface at all.` 止——这一段的结果句由目标形 S2 / S5 承接。
- 同句尾 `**Zero retention** ⇒ re-running historical files in bulk and "aligning expectations for an old file's red" both cease to exist as actions.` **删**：与 S5 是同一后果、同一定语（D2 不重述），留着模型要读两遍同一件事。
- 同 bullet 其余内容逐字不动：反馈回路句 ∥ 实施者本人写跑句 ∥ 不可转集成句。
- **段落形态**：目标形并入同一 bullet 的同一段落（不插空行、不另起 bullet）——空行切断 bullet，另起 bullet 会让「删什么」与「测什么」分开读。

**让步句自查**：目标形 0 句「本应 / 可以留 / 没把握 / 代价可控」类表述；英文面 0 句 `should have been` / `could be kept` / `not sure` / `the cost is acceptable`。禁令依据 = `TESTING.md:32`。

**乱码项（父侧点名 `:105` 的 `Zero retention ?`）**：盘上实测无此缺陷——该句在 `:102`，字节 `e2 87 92` = U+21D2（`⇒`）合法 UTF-8；`thincoder-core/prompts/` 全 16 档零 U+FFFD、零 mojibake。**结论：零改动**；编辑器里看到 `?` 是查看器的解码显示，不是档内容。

**落点（实施席照此改）**：

| 面 | 坐标 | 动作 |
|---|---|---|
| EN 运行面 | `thincoder-core/prompts/discipline-engineering.md:102` | 按「既有句处置」替换 + 删尾句 |
| 设计档（本档） | §6.33 | 唯一权威目标形（D2） |
| 中文镜像面 | 无（`docs/core/design/prompts/` 已不存在——运行面单面） | 零触 |

**验收（A1–A6，一次性手工核——不新增断言：`docs/core/requirements/TESTING.md` §5 读档断言禁令）**：

| # | 验收 | 判法 / 读数 |
|---|---|---|
| A1 | 替换区间内逐字相等——区间 = 自 `**Delete on use**:` 起至 `no "re-run an old file" surface at all.` 止；区间内 = 目标形 S1–S5 逐字，区间外同 bullet 其余内容不动 | 区间内逐字比对（不用全档子串在场——同一句抄两份时会误判） |
| A2 | 禁留子串零命中：`Delete on use**: the batch deletes` ∥ `Zero retention** ⇒` ∥ 区间尾句 `no "re-run an old file" surface at all.` | 一次性子串比对；三条全查（区间只删一半时 A1 仍绿） |
| A3 | 目标形零让步句词表命中（本应 ∥ 可以留 ∥ 没把握 ∥ 代价可控 ∥ should have been ∥ could be kept ∥ not sure ∥ the cost is acceptable） | 一次性词表扫描 |
| A4 | 体量读数：改后字符数实读（无帽） | `node -e "console.log(require('fs').readFileSync('thincoder-core/prompts/discipline-engineering.md','utf8').length)"` ⇒ 读数即可；改前实读 36,574（2026-10-19） |
| A5 | `node scripts/prompt-refs-check.mjs` ⇒ `命中 0` | 首行汇总打印「命中 0」+ `OK(prompt-refs)`。新文本 `batch record §5` = 批次档段号（`§1`–`§6` 裸段号 = 协议自名 = 合法正例，见 `:192` ∥ `:851–852`）⇒ 非死节号，不删号、不改述；命中 ⇒ 按 §6.6 删引用（非改址）复测 |
| A6 | 设计档门 = `doc_check(mode:"gate", docs:["docs/core/design/PROMPT-SYSTEM.md"])` 首行 `DOC-CHECK GATE: PASS` | 直跑该命令取首行 PASS |

**边界（不做）**：不改需求档（why 的权威处零触）· 不动普通侧 `thincoder-core/prompts/discipline-normal.md`（该面 `:24` 是转指「retention per the test-lifecycle policy」、`:159` 只说放置，无删除规则，无可对齐的句子；要送 why 进普通侧另立一批）· 不改测试机制本体（门 ∥ 轮次 ∥ 谁写谁跑零触）· 不新增 `##` 块 · 不新增单测断言 · 其余 15 档零触。

**勘察证据行**：已查 `thincoder-core/prompts/discipline-engineering.md`（`:100`–`:109` 测试纪律节；`:102` 现状句逐字）· 同目录 16 档编码扫描 · `docs/core/design/TESTING.md` ∥ 本档 §6.10 ∥ §6.32（先例形）· `docs/core/requirements/TESTING.md` §1.1。除上述无其他相关公共源——已查无。

**先例 ∥ 偏离**：先例 = §6.32（规则须能回答「它靠什么成立」，why 逐字复用、不新造因果）——本节完全对齐：why 从需求档逐字搬。偏离 = 不做逐项表（射程一句），改用目标形 + 逐句 why 对应表。

**关键决策**：① why 与动作同 bullet 同段（读的时候「该做什么」和「为什么」不分离）；② 删 `Zero retention ⇒ …` 尾句（D2 去重，S5 已覆盖其列举）；③ 父侧原稿的 `unit tests to cover` 改 `unit tests to verify`（`cover` 会被读成覆盖率指标；单元测试的作用是验证，见 `TESTING.md:30`）。

### 6.34 批准即实施启动（提示词面显式化 · FR32）

**坐标口径**：本节行号 = FR32 成文时的 `thincoder-core/prompts/persona-engineering.md` 实读；FR33–FR36 落地后行号已漂移——本节引文与判定不变，两节都引的句子（digest / 停相）当前坐标以 §6.38 实读为准。

**来源**：用户 2026-10-19 本会话逐字——「批准」= 当场派工；只有批准时另外说「先别动 / 只批设计」才停；「应该是批准或其他等价表示」；「解锁就是开工，没有第三步」。需求权威 = `ENGINEERING-MODE-V2.md` §13.10（FR32，四条）；台账 `#1710`。

**要修的那一处（实读）**：`thincoder-core/prompts/persona-engineering.md:8` 以「wait for the user's explicit go」收尾，`:13` 说 authorized-to-fire ≠ approved，`:149` 只说 unlock eng-coder——这些句子叠读时，「批准」与 `go` / `the user's word` / `the nod` / `unlock` 之间没有一句等价声明（逐条机制见下「成因分析」，共 8 处读法来源）。

上一实例因此把批准读成「设计文档过关」、另等一句「开始」，白耗一轮。`:142-144` 的 digest 条本身成立（管评审机器信号）、本批零改；它在成因里只贡献词面重复一项（G5）。

**成因分析：旧文本为什么被读成「批准后另等一句」（逐条机制 ∥ 闭合处置 · 行号 = `thincoder-core/prompts/persona-engineering.md` 2026-10-19 实读）**：

旧文本没有一句写错；缺的是**等号**——「批准」与 `go` / `the user's word` / `the nod` / `unlock` 各占独立的文法位置，没有一句把它们写成同一件事。读者要回答「实施这一步什么时候开始」，提示词里唯一直接回答的是 `:52`（implementation starts wait for the user's word）⇒ 默认答案 = 再等一句话；其余各句把「批准」与「发起 / 解锁」分开放。三步链由此拼出。

| # | 机制（原句 + 坐标） | 它教出的读法 | 闭合处置 |
|---|---|---|---|
| G1 | `:6` `Design reviews and implementation starts are both fired by the user, not by you.` | 评审与实施并列成两次「用户发起」；没有一句说设计批准就是实施那一次发起 ⇒ 两次发起的槽位都留着 | 闭于块 A 首句：`the user's approval of the design … starts implementation, and the eng-coder spawn fires in that same round` |
| G2 | `:8` `… both stop at the user's approval gate — the part past it was never approved …; wait for the user's explicit go.` | 同一句两个名词（`approval gate` / `explicit go`）；`the part past it was never approved` 把过门之后的动作标成未批准态 ⇒ `go` 读成过门之后的第二个动作 | 闭于块 A 首句：`that go is the approval itself`（逐词接 `:8` 的 `go`） |
| G3 | `:10-12` 唯一的「不必逐步重发」规则绑在批次口令上（`"handle it all / do it all / go ahead"`；`:11` 说其下 `you no longer stop and wait for the user to fire each one again`） | 一句「批准」不匹配这个口令形状（不声称覆盖整批）⇒ 逐步等待仍是默认档，实施启动照旧等自己那一句 | 闭于块 A 首句：`that go is the approval itself`——批准本身就是那一步的 go，不必借批次口令 |
| G4 | `:14`（FR36 取代前的整批令句）`"authorized to fire" is not "approved"` | 教「发起 ≠ 批准」；对称反推 =「批准 ≠ 发起」⇒ 批准把门打开，发起仍是另一次用户动作（`:6` 说发起归用户） | 闭于块 A 第二句：`Unlock and start are one step`；整批令下再闭于 §6.38——批准门被覆盖，批内全链自动跑完，评审照走 |
| G5 | `:142-144` `it is NOT authorization to spawn or proceed` / `progress waits for the user's explicit go` | 父侧在 digest → 呈报 → 批准这条链上最后读到的一句；`explicit go` 以独立名词再出现一次，加固「go 是另一句」的词形 | 闭于块 A 首句（同一名词 `go` 被绑定）。不补：它管 digest 机器信号、不批批准语义，改它会动评审链条（本批边界）；残差 = 只读该条的读者仍见 `go` 独立出现，强度低于 G8（该条直接点名 implementation starts） |
| G6 | `:149` `… design ready → user fires advisor review → user approves → implementation.` + 尾句 `Only an explicit sign-off after review unlocks eng-coder.` | 四段箭头把 implementation 摆成第四段，段上没有发起人、没有时机；尾句是许可隐喻——解锁 = 门开了，走进去没有着落 | 闭于块 B：`the unlock is the start: the implementation spawn fires in the same round` |
| G7 | `:24-30` `Before writing files, restate your understanding … and wait for explicit user confirmation ("OK / sure / continue" type) before executing.`（`:25`） | 评估 = **部分成立**：触发面是「写文件之前」，父侧 spawn 不是父侧写文件，严格按触发面套不到实施启动；但 `:25` 的确认词型与用户表达批准的词型同族，读者把「执行」扩成「执行整批」时会在实施边界再要一次同型确认 | 不补文本：块 A 首句（`starts implementation … in that same round`）已把同轮写死，无第二次确认的位置；`:24` 触发面（写文件）与 spawn 不同面——补一句反而把越界套用写成规则 |
| G8 | `:52-55` `review firing / implementation starts wait for the user's word` … `spawn / review firing / doc advancement / post-digest follow-up actions all hold for the nod`；`:52` 又有 `Each step completes → present → enter the next step` | 最强的一条：点名 implementation starts / spawn 自己等一句话，「the user's word / the nod」从不与批准等同；`Each step completes → present → enter the next step` 把批准时刻摆成「上一步完成 → 呈报 → 下一步等着」 | 加逐字块 C（最短锚）+ 对照表新增行：`the user's word / the nod` = 批准本身。判据 = 只读本节者从块 C 读出等号，推不出「批准后另等一句」 |

**成因小结**：误读不是某一句写错，而是四个名词各自为政，且「实施启动何时开始」的唯一直接答案（`:52`）指向「等一句话」。所以修法 = 把等号写到读者会停下来的三个位置——`:8` 权威（块 A）· `:149` 锚（块 B）· `:52-55` 锚（块 C）；每处独立可读，不靠跨节拼接。

**机制（两步规则的第二道门怎么出）**：

- 评审通过前：设计讨论里对形态 / 选项的点头 = 需求确认，不是设计批准（`:149` 管；本条不动它）。
- 评审通过后：用户的批准——或任何表达同一意图的等价表示（判据 = 意图，不是词表）——**就是实施发起本身**：父侧在批准确认的同一轮 spawn eng-coder，不再等第二句「开始」。
- 唯一停相：批准时明说 hold / design only / not yet（或等价表达）⇒ 停；与 `:150` 的停相判据同轴，不新造词表。
- why：批准已经是「授权落地」的决定；把两步规则读成三步，多出的那一步只能白耗一轮往返与用户注意力——它换来的是零新信息。

**取法（最近先例 ∥ 偏离）**：先例 = 本档 §6.32（规则须携 why、不用禁令腔、就地改）∥ §6.29（同一事实跨层多点 = 关键锚点重复，每点独立可读）。
**对齐** = 新增文本携 why、落点全在既有段落 / 既有句内、零新增 `##` 节。**偏离** = `thincoder-core/prompts/discipline-engineering.md`「基本流程」不加行（理由见「纪律层判断」）。

**勘察证据行**：已查 `thincoder-core/prompts/persona-engineering.md`（`:5–13` / `:24–30` / `:52–55` / `:141–151` 实读）· `thincoder-core/prompts/discipline-engineering.md`「Basic flow」（`:29–47`）· 本档 §6.6 / §6.29 / §6.30 / §6.32 / §8.1 · `ENGINEERING-MODE-V2.md` §13.10。除上述无其他相关公共源文档——已查无。

**逐字英文文本（实施席照此落笔 · 唯一权威目标形）**：

A. `thincoder-core/prompts/persona-engineering.md:8` 段末追加（同段内换行、不插空行、不另起段落；`:8` 现文零改）：

```
**Once the review has passed, that go is the approval itself**: the user's approval of the design — or any expression of the same intent, since the test is intent rather than wording ("approved", "ok, go with it", "yes, do it") — starts implementation, and the eng-coder spawn fires in that same 

  round. Unlock and start are one step: a two-step rule read as three spends a round-trip waiting for a word the approval already spoke. The one stop shape: the approval itself saying to hold ("hold off / design only / not yet") — that is the user's stop, and implementation waits.
```

B. `thincoder-core/prompts/persona-engineering.md:149` 尾句替换（该行其余各句零改）：

现文：`Only an explicit sign-off after review unlocks eng-coder.`

```
Only an explicit sign-off after review unlocks eng-coder — and the unlock is the start: the implementation spawn fires in the same round (equivalent expressions and the one stop shape: see the Firing-rights boundary above).
```

C. `thincoder-core/prompts/persona-engineering.md:55` 后新增一行（Advance & stop 引用块末；`>` 开头、同段内换行、不插空行；`:52-55` 现文零改）：

```
**Once the review has passed, the approval is that word**: the sign-off is the nod the next step holds for, and the spawn fires in the same round — one step, not two.
```

**落点表（实施席逐处执行）**：

| # | 坐标 | 现文 → 新文 | 动作 |
|---|---|---|---|
| L1 | `thincoder-core/prompts/persona-engineering.md:8` | 现文整行保留；段末追加逐字块 A | 追加（同段内换行，+1 行） |
| L2 | `thincoder-core/prompts/persona-engineering.md:149` | 尾句 `Only an explicit sign-off after review unlocks eng-coder.` → 逐字块 B；同句前半（`User's nod ≠ design approval` … `settles the form, not the design.`）零改 | 替换尾句（行数 ±0） |
| L3 | `thincoder-core/prompts/discipline-engineering.md:29–47`（Basic flow） | 零改 | 见「纪律层判断」 |
| L4 | `thincoder-core/prompts/persona-engineering.md:55` 后（Advance & stop 引用块末） | 新增一行引用块：逐字块 C（`> ` 前缀 + 同段内换行） | 追加（+1 行 / +169 字符） |

**纪律层判断（是否需要一行：不需要）**：本条的行为主体 = 父侧——唯一对话面、唯一 spawn eng-coder 的角色；纪律层四步描述的是一批工作怎么走，不含发起面，子代理读了也不会执行该动作。
加在那里 = 给不执行该动作的读者重述同一条规则（D2），并把「什么时候派工」与「四步是什么」两件事混进同一节。故 `thincoder-core/prompts/discipline-engineering.md` 零改。

**对照表（与既有各句逐句对照 · 结论 = 零矛盾）**：

| 既有句 | 它管什么 | 本条管什么 | 为何不矛盾 |
|---|---|---|---|
| `:6` `Design reviews and implementation starts are both fired by the user, not by you.` | 谁做发起决定：用户，不是 agent 自判 | 决定何时生效：批准即发起 | 批准前 spawn = 自发起（`:6` 禁止的那类）；批准后 spawn = 执行用户的发起。两句各管一端 |
| `:14` 整批令覆盖批准门（FR36） | 有整批令时：批内全链自动跑完，评审照走，四停相 | 无整批令时：批准即实施启动（`:9` 的等号） | 两句分档：FR36 覆盖「再等一句」，不改 FR32 的等号；无整批令时照旧 |
| `:142-144` digest 是机器信号、不是放行 | 评审 digest（机器信号）不是授权 | 触发 = 用户的批准（人的表态） | 链条 = digest 到达 → 呈给用户 → 用户批准 → 同轮 spawn；本条不把 digest 读成批准 |
| `:149` `User's nod ≠ design approval` … `unlocks eng-coder` | 评审通过**前**的点头（形态 / 选项）≠ 设计批准 | 评审通过**后**的签核 = 实施启动 | 分界线是同一条 explicit sign-off：签核之前点头买不到任何东西；到了签核，签核买到的就是开工。尾句改写把 unlock 与 spawn 接上 |
| `:150` `First-utterance "user stop" signal` | 停相判据 = 意图，不是词表 | 批准时刻的停相 = 同一判据的应用 | 批准时说的 hold / design only / not yet 就是 `:150` 的停相信号；零新词表 |
| `:52-55` `review firing / implementation starts wait for the user's word` … `spawn / … all hold for the nod` | 每步启动要有用户的表态才走（`:53` 的意图判据） | 哪一句算这个表态：评审通过后的批准本身就是那个 nod | 不矛盾：本节要的是「用户的表态」，不是「第二次表态」；原读法把「要有表态」升级成「要两个表态」。等号落进本节（逐字块 C），只读本节即可读出 |

**行为契约 · 用例表（正常 / 边界 / 错误）**：

| 编号 | 场景 | 输入 / 动作 | 期望 |
|---|---|---|---|
| C1 | 正常 | 评审通过后用户说「批准」 | 父侧同轮 spawn eng-coder，不再等「开始」 |
| C2 | 等价表示 | 用户说「行，就这么办」「可以动了」 | 同 C1（判据 = 意图） |
| C3 | 边界 · 唯一停相 | 用户说「只批设计，先别动」 | 不 spawn；呈当前结果并等用户下一句 |
| C4 | 边界 · 评审通过前 | 设计讨论中用户对选项点头「B」「ok」 | 不 spawn（`:149` 管；点头 = 需求确认） |
| C5 | 错误防御 · digest | 评审 digest 到达、用户尚未表态 | 不 spawn（digest 是机器信号）；呈报给用户 |
| C6 | 边界 · 修复轮在途 | 修复轮未落地时用户提前说「批准」 | 按既有 `:131-132` 的时机判据办（批准请求在修复轮落地并核验后才发）；本条不覆盖该判据 |

**受影响文件（现行行数 = `split("\n").length − 1` 实读 · 2026-10-19 本席）**：

| 文件 | 现行 | Δ | 说明 |
|---|---|---|---|
| `thincoder-core/prompts/persona-engineering.md` | 237 行 / 58,345 字符 | +2 行 / +911 字符（块 A 575 + 换行 1 · 块 B 223 换旧尾句 57 = 净 +166 · 块 C 166 + `> ` 2 + 换行 1） | L1 追加 + L2 尾句改写 + L4 加锚；改后 239 行 / 59,256 字符 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1,422 行 / 120,743 字符（本节改后） | 本笔 = §6.34 新增 + 本轮成因分析（设计轮） | 实施轮零触 |
| `thincoder-core/prompts/discipline-engineering.md` | 200 行 / 36,773 字符 | ±0 | 判断 = 不加行 |

测试覆盖：零单元测试档（文本改动、无分支）；机判 = 既有 `scripts/prompt-refs-check.mjs` + doc_check 交付门，不新增断言。

**验收（A1–A7 · 回指 §13.10 四条 · 一次性比对，不新增断言）**：

| # | 验收 | 判法 / 读数 |
|---|---|---|
| A1 | §13.10 ①：显式句在场 + 逐字相等 | `node` 子串比对：逐字块 A 与块 B 各 1 次命中；`:149` 旧尾句 0 命中 |
| A2 | §13.10 ④：携 why、无禁令腔 | 新增区段扫 `never|do not|don't|must not|may not|forbidden` ⇒ 0 命中（只扫新增段：`:8` 原文的 `was never approved` 是既有描述性否定，不在扫描区） |
| A3 | §13.10 ①：等价表示与唯一停相在场 | 子串 `any expression of the same intent` · `The one stop shape` 各 1 次命中 |
| A4 | 体量读数（无帽） | `node -e "console.log(require('fs').readFileSync('thincoder-core/prompts/persona-engineering.md','utf8').length)"` ⇒ ≤ 60,095（改前 58,345；本笔实测净增 911 ⇒ 预计改后 59,256，余量 839） |
| A5 | 提示词面零文档引用 | `node scripts/prompt-refs-check.mjs` ⇒ `命中 0` |
| A6 | §13.10 ②③ + 行为面（观察项，非机检） | 对照表六句无矛盾（见上）；下一批：仅说「批准」⇒ 同轮 spawn；说「只批设计」⇒ 停 |
| A7 | 修正项 3 的判据：`:52-55` 锚逐字在场 | `node` 子串比对：逐字块 C 1 次命中；`review firing / implementation starts wait for the user's word` · `all hold for the nod` 各 1 次命中（锚是加行，原四行零改） |

**边界（本批不做）**：需求档零笔 · 批准门机制本体（token / 门禁 / 凭证生命周期）零触 · 新增机械门 / 工具 / 状态 = 零 · 普通模式零改 · `:6` / `:13` / `:142-144` / `:150` 零改 · `:52-55` 仅加逐字块 C 一处（其余句零改） · `thincoder-core/prompts/discipline-engineering.md` 零改 · 其余提示词档零触 · 不新增单测断言。

**关键决策**：

| # | 决策 | 理由 |
|---|---|---|
| K1 | 权威句落 `:8` 段末（「wait for the user's explicit go」旁边），`:149` 只带最短锚 + 指回 | 这两处是歧义的主要读出地（第三处 `:52-55` 见 K7）；规则写在读出歧义的那一句旁边，读者不用跨节拼接；D2 = 权威句一处、其余只带最短锚 |
| K2 | 判据写成「意图而非词表」+ 三个示例 | 用户令「批准或其他等价表示」；词表必漏，示例只作锚不作穷举 |
| K3 | 停相复用 `:150` 判据，不新造词表 | 同轴；批准时刻的 hold = 既有停相信号，零新机制 |
| K4 | `thincoder-core/prompts/discipline-engineering.md` 零改 | 行为主体 = 父侧；纪律层无发起面（详见「纪律层判断」） |
| K5 | `:149` 尾句改写而非另加一句 | 现句已说到 unlock；缺的是 unlock 与 spawn 的等号——就地接上，避免同段两句说同一件事 |
| K6 | 不动 `:142-144` digest 条 | 它管评审机器信号，与本条触发（用户批准）不同物；两句并存才构成完整链条 |
| K7 | `:52-55` 加最短锚（逐字块 C），不只进对照表 | 判据 = 只读 `:52-55` 的读者不能再推出「批准后另等一句」；只进对照表改的是设计档，改不到提示词读者。块 C 只用本节已有的两个名词（`the user's word` / `the nod`），一句、不重述块 A |

**上抛项**：无。

### 6.35 eng-coder 任务书令牌必填（提示词面显式化 · FR33）

**来源**：用户 2026-10-19 22:10 逐字「开批修！」；需求权威 = `ENGINEERING-MODE-V2.md` §13.11（FR33，三条 + 验收）；台账 `#1712`。工具说明 / schema / 门报错落点 = 本档同批 `TOOLS.md` §6.25。

**要修的那一处（实读 2026-10-19 本席）**：`thincoder-core/prompts/persona-engineering.md` 任务书节（`:158` `batchDoc` ∥ `:161-171` 参数清单）——清单列 `goal` / `round` / `knownFacts` / `designPoints` / `acceptance` / `reportFormat`，`batchDoc` 在 `:158`。

`designToken` 不在清单内，其余出现处 = 示例行 `:157` · 恢复路径 `:149` · 修正轮复用 `:147` · 并行令牌隔离 `:223` · 交付物 `:236`（均为条件句 / 旁述，不是必填清单项）。
同节 `batchDoc`（`:158`）写的是 `omitted = refused`，`round`（`:163`）带 "fix rounds are point-fixes only" 的后果说明；令牌没有代价句——读者看不出缺它会拒掉整次 spawn。

**机制（本批只补必填句）**：

- 工程模式 eng-coder spawn 的任务书参数清单把 `designToken` 写成必带项：**omitted = refused**，与同节 `batchDoc` 同形。
- 取值路径写进同一句：`subagent` `action:'design-slots'` 行里 `designToken=` 之后的值逐字复制（行格式 = `designId=<id> status=live|expired ageDays=… expiresAt=… batch=… designToken=<token>`；`agent-tools/design-slots.mjs:111`）。
- 后果写「refuses the whole spawn (not merely file writes)」：实例把旧措辞「cannot modify files」读成「spawn 已成立、只是写权限受限」，据此在错误方向上排除了四轮。
- why：缺参时门拒绝的是整次派工；触发必须落在模型每次组包都会读的清单里，不能只靠示例行（示例读起来像「可带」）。

**取法（最近先例 ∥ 偏离）**：先例 = 本档 §6.34（逐字英文文本 + 落点表 + 验收）∥ §6.32（规则携 why、就地改）。
**对齐** = 逐字块落 `:161-171` 节内、新增一行、不新增 `##` 节、既有行零改。
**偏离** = 块内直接点名 `design-slots`（工具动作名）——取值路径是操作指令，不是指向另一份文档的引用，不触「提示词面禁带文档引用」。

**勘察证据行**：已读 `thincoder-core/prompts/persona-engineering.md:140-199` · `thincoder-core/tool-docs/subagent.md` 全档 · `agent-tools/subagent.mjs:136-167` · `agent-tools/subagent-spawn.mjs:108-132 / 240-258` · `agent-tools/design-slots.mjs:111` · `token-ttl.mjs:55-83` · 本档 §6.34 ∥ §6.32 · 

  `ENGINEERING-MODE-V2.md` §13.11。
令牌面在册权威档（`docs/README.md:78`）：`ENG-TOKEN-BINDING.md` §4 / §6.1（生命周期 ∥ 在位核对）——**结论 = 零改**，本节只动提示词清单，机制本体不在本节。
`DESIGN-TOKEN-SETTLEMENT.md` §9 F-SL1（清点行末位恒携 `designToken`，`:158`）——**结论 = 零改**，取值路径已按该行格式写进块 A。

**逐字英文文本（实施席照此落笔 · 唯一权威目标形）**：

A. `thincoder-core/prompts/persona-engineering.md:163`（`round` 行）之后新增一行（同列表、同缩进两空格；`:161-171` 其余行零改）：

```
  **`designToken`** (eng-coder only — the write credential): the exact value `advisor(type='design')` issued when the review passed; copy it **verbatim** from the `subagent` `action:'design-slots'` row — the text after `designToken=` on the designId's line. **omitted = refused** — the gate refuses 

  the whole spawn (not merely file writes), so every eng-coder spawn carries it, fix rounds included (they reuse the same token). A mismatched or expired value is refused the same way, with the reason named in the error.
```

**落点表（实施席逐处执行）**：

| # | 坐标 | 现文 → 新文 | 动作 |
|---|---|---|---|
| L1 | `thincoder-core/prompts/persona-engineering.md:163` 后 | 现文零改；`round` 行之后新增逐字块 A | 追加（+1 行 / +518 字符 = 块 A 517 + 换行 1） |
| L2 | `thincoder-core/prompts/persona-engineering.md:149` / `:157` | 零改（恢复路径与示例已带令牌） | 零改 |

**受影响文件（现行行数 = `split("\n").length − 1` 实读 · 2026-10-19 本席）**：

| 文件 | 现行 | Δ | 说明 |
|---|---|---|---|
| `thincoder-core/prompts/persona-engineering.md` | 239 行 / 59,256 字符 | +1 行 / +518 字符 | 改后 59,774 字符 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1,490 行 / 124,725 字符（2026-10-19 修订后实测） | 本节 = 68 行（L1338–1405） | 实施轮零触 |

**验收（A1–A4 · 回指 §13.11 ①④）**：

| # | 验收 | 判法 / 读数 |
|---|---|---|
| A1 | §13.11 ①：清单含 `designToken` + `omitted = refused` 同义句 | `node` 子串比对：逐字块 A 1 次命中；`omitted = refused` ≥2 次（`batchDoc` 行已有 1 次） |
| A2 | §13.11 ①：取值路径在场 | 子串 `designToken=` ≥1 次、`design-slots` ≥1 次命中（均在块 A 内） |
| A3 | §13.11 ④：提示词面零文档引用 | `node scripts/prompt-refs-check.mjs` ⇒ 命中 0 |
| A4 | §13.11 ④：体量读数（无帽） | `node -e` 读字符数 ⇒ ≤ 61,033 |

**边界（本节不做）**：工具说明 / schema / 门报错 = `TOOLS.md` §6.25（本节不重述）· 令牌签发 / TTL / 消费零改 · 自动补全不做（需用户单独裁定）· 普通模式零改 · `:149` / `:157` 零改 · 不新增 `##` 节。

**关键决策**：

| # | 决策 | 理由 |
|---|---|---|
| K1 | 落 `:161-171` 清单内（`round` 行后），不另起段 | 清单是模型每次组包读取的位置；示例行已有令牌，但读起来像「可带」 |
| K2 | 措辞逐字对齐 `batchDoc` 的 `omitted = refused` | 同节同形，读者不必推断两种缺参的后果是否一致 |
| K3 | 同句带取值路径（`designToken=` 逐字复制） | 只说「必须带」不给来源，模型会凭记忆编值或省略；实例的失败是缺键，不是缺值 |
| K4 | 不写进 `:170`「Every spawn role」总句 | 令牌只对 eng-coder 成立；写进全员句会让 eng-designer 误带无意义参数 |

**UI / 交互决策**：无界面面——本条只改模型可见提示词文本。

**上抛项**：无。

### 6.36 谈定即落笔（提示词面显式化 · FR34）

**来源**：用户 2026-10-19 22:35 逐字「开批」；需求权威 = `ENGINEERING-MODE-V2.md` §13.12（FR34，三条 + 验收）；台账 `#1713`；现象 / 根因 / 版本核对 = 批次档 §1。

**要修的那一处（实读 2026-10-19 本席）**：三条款从未存在（版本核对见批次档 §1）。现行文本里离「决定落盘」最近的三句，各自只覆盖一半：

| 既有句 | 它给出了什么 | 缺的那一半 |
|---|---|---|
| `thincoder-core/prompts/persona-engineering.md:29`（唯一豁免：record a decision the user just made — done in the same turn） | 许可 + 同轮（在豁免语境里） | 义务：决定**必须**当轮写盘；且不指定落点 |
| `thincoder-core/prompts/persona-engineering.md:96`（欠账入清单） | 「未派发 / 未完成的工作项」入台账 | 一条**已谈定、未写盘的决定**不是工作项形状，读不出该入清单 |
| `thincoder-core/prompts/discipline-engineering.md:30`（需求步 land it in the requirements doc, confirm, then move on） | 最终落点 = 需求档 | 时机：按字面读，落盘发生在讨论结束之后 ⇒「我先记下」成立 |

另：`thincoder-core/prompts/common.md:141-145`（上下文自掌舵）只讲何时压 / 怎么压，不讲压完怎么找回决定；压缩标记自带 `Check memory search for any missing decisions`（`thincoder-core/context.mjs:34-37`），那是 memory 方向的指向，不是「回读批次档 §1」的动作。

**为什么（依据可指认）**：用户原话「用户向你表达的需求，会随着上下文的压缩而灭失，如果没有及时的留下需求文档，代码为什么是这样就没了依据」。文档写反比漏更坏——漏掉的决定留下空白，写反的决定变成后续实施的依据（`D:\repos` slot 4 的 hash 路由正是这样从「已定」变成设计档里的否决项）。

**机制（三条规则）**：

- **同轮落笔**：需求决定（形态 / 参数 / 边界 / 排除项）在做出当轮写盘——需求档能接就写需求档，否则写批次档 §1 的 `已定决定` 行。触发 = 决定做出当轮（模型自己知道刚谈定）。
- **压缩后重锚**：看到 `[Context was automatically compacted…]` 或主动压缩回执后，第一个动作 = 回读 §1 `已定决定` 行 + 台账，核对摘要是否丢决定，丢了立即补写。触发 = 标记 / 回执，模型侧可见。**不写压缩前动作**：被动压缩在请求间安全点触发，预兆不可观察（用户 2026-10-19 22:29 裁定）。
- **未落盘决定 = 台账行**：谈定但未进需求档的决定，当轮挂一行台账（可见债务）；决定进需求档当轮核销该行。

**「已定决定」行形（§1 内的行约定，不是子块）**：

```
- **已定决定**：<决定> · 用户原话：「<逐字>」 · 时间：2026-10-19 22:29
```

判由：① §1 是 append-only——子块一旦插入，其后的讨论追加落在块后，清单不再是连续块；② 行首固定标记让每条自足、可全文扫读，回读时按标记收行；③ 六段结构零改（需求硬约束）——标记行是 §1 正文里的行约定，不是新段。标记串 = 写进中文批次档的约定串（§6.30 K4 字面类，故可出现在英文提示词里）。

**取法（最近先例 ∥ 偏离）**：先例 = 本档 §6.34（逐字英文文本 + 落点表 + 对照表 + 验收）∥ §6.35（既有清单内增行）∥ §6.32（携 why、无禁令腔）。
**对齐** = 逐字英文块、既有节内增行、零新增 `##` 节、既有行零改。

**偏离** = ① 三条规则按各自行为面分落三处（人格档权威二条 / 人格档债务条锚一条 / 纪律档时机锚一条），不是 §6.34 的三锚同节——三条的读者与读时不同（K1 ∥ K3 ∥ K4）；② `thincoder-core/prompts/discipline-engineering.md` 加一行——§6.34 判为不加，本条判为加，理由见 K4。

**勘察证据行**：已读 `thincoder-core/prompts/persona-engineering.md`（`:16–31` / `:83–119` / `:143–155` / `:189–223`）· `thincoder-core/prompts/discipline-engineering.md`（`:29–64`）· `thincoder-core/prompts/common.md`（`:134–145`）·

`thincoder-core/context.mjs:33–37` · `thincoder-core/agent/run-stages.mjs:83–151` · 本档 §6.30 ∥ §6.32 ∥ §6.34 ∥ §6.35 · `ENGINEERING-MODE-V2.md` §13.12 ∥ §13.10。
**记录面拥有档（本笔触及的两条约定）**：① 批次档格式 = `docs/core/design/BATCH-RECORD.md` §4.10（骨架）∥ §5（行为纪律）——已查、相关：§1 行约定登记入 §4.10；

② 台账用法面 = `docs/core/design/LEDGER.md` §3（六态迁移表——`已废弃` 撤回态）∥ §3.2（工具参数守卫）——已查、相关：推翻收口复用既有 `已废弃` 态，零 schema 改。工作目录内无独立公共源文档仓——已查无。

**逐字英文文本（实施席照此落笔 · 唯一权威目标形）**：

A. `thincoder-core/prompts/persona-engineering.md:29` 后新增两行（同 bullet 列表、行间不插空行；`:29` 现文零改）：

```
- **A decision lands in the round it is made**: every requirement decision the discussion settles (shape / parameter / boundary / exclusion) goes onto disk in that same round — the requirements doc when it can take it, otherwise one line in batch record §1, in the fixed form `- **已定决定**：<decision> · 
  用户原话：「<verbatim words>」 · 时间：<time>` (the marker word, the full-width colon and the ` · ` separators included). "I'll note it down" is true only when that same round carries the write: a decision held only in the conversation is one compaction away from gone, and the documents written afterwards 

  then record its opposite — a requirement written backwards is worse than one missing, because implementation is built on it.
- **After a compaction the first move is re-anchoring**: the moment "[Context was automatically compacted…]" appears (or a compaction you started returns its receipt), read back the current batch record §1 已定决定 lines and the ledger, and check them against the summary — a decision the summary dropped 
  goes back onto disk at once. Nothing before the compaction: passive compaction fires between requests, so the pre-compaction sign would be one no model can see — the summary's arrival is the first moment the trigger exists.
```

B. `thincoder-core/prompts/persona-engineering.md:96` 条尾追加一句（同一 bullet 内续写，行数 ±0）：

```
 A decision the discussion settled but the requirements doc has not taken yet is a debt of the same shape: its row lands in the round it settled (visible, not prose) and closes in the round the decision reaches the requirements doc — or, when the decision is overturned before it gets there, in the 

  round it is overturned: the row is retired under the ledger's existing 已废弃 state, or rewritten to bind the replacement decision.
```

C. `thincoder-core/prompts/discipline-engineering.md` 步骤 1 内、收束段之后新增一行（三空格缩进，作步骤 1 的第 6 条子 bullet；定位按条文本，行号只作读数——同本档 `:261` 口径）。
插入位的条文本锚（收束段整段原文）已随 §6.40 的 R2 退役——块 C 现址 = `thincoder-core/prompts/discipline-engineering.md:40`（收束段之后的第 1 条子 bullet），位置判据 = §6.40 A8。

坐标现值（读数）：`:30` = 步骤 1 编号行 · `:31-35` = 五要素子 bullet · `:37` = §6.40 R1 段 · `:39` = 收束段 · `:41` = 步骤 2 编号行。

```
   - **A decision lands in the round it is made**: the main agent writes it down in that round — the requirements doc when it can take it, otherwise the batch record §1 已定决定 lines; waiting for the discussion to close leaves the decision in the conversation alone, where the next compaction erases it.
```

**落点表（实施席逐处执行）**：

| # | 坐标 | 现文 → 新文 | 动作 |
|---|---|---|---|
| L1 | `thincoder-core/prompts/persona-engineering.md:29` 后 | 现文零改；新增逐字块 A（两条 bullet） | 追加（+2 行 / +1,246 字符 + 2 换行） |
| L2 | `thincoder-core/prompts/persona-engineering.md:96` | 该 bullet 尾追加逐字块 B | 同 bullet 追加句（行数 ±0 / +427 字符） |
| L3 | `thincoder-core/prompts/discipline-engineering.md` 步骤 1 收束段（现 `:37`）之后——条文本锚见块 C 节 | 现文零改；新增逐字块 C（三空格缩进） | 追加（+1 行 / +300 字符 + 1 换行） |
| L4 | `thincoder-core/prompts/common.md:141–145` | 零改 | 判为不同落（K5） |
| L5 | 批次档六段结构 | 零改 | 「已定决定」= §1 行约定（K3） |

**`thincoder-core/prompts/common.md` 判定（不落 · 理由四条）**：① 需求范围明写「工程模式下」，且普通模式在本批边界里另裁——落 common = 无声把规则扩到普通模式；② 动作的两个落点（批次档 §1 的笔、台账写权）都是主 agent 独属面，common 的读者含全部子代理——写在多数读者不能执行的位置 = 假指令；③ `thincoder-core/prompts/common.md:141-145` 管的是「何时压 / 怎么压」，本条管「压完怎么找回决定」，两个问题；

  ④ 跨模式同文双份的判据（D-PS36）要求内容真的跨模式——本条被需求限定在工程侧，判据不成立。

**对照表（与既有各句逐句对照 · 结论 = 零矛盾）**：

| 既有句 | 它管什么 | 本条管什么 | 为何不矛盾 |
|---|---|---|---|
| `persona:29` 记录决定可免确认（done in the same turn） | 许可：这类写入不必另要确认 | 义务：这类写入必须当轮发生 | 同一动作的两面：`:29` 免除确认门，本条要求写入发生；不新增确认门 |
| `persona:96` 欠账入清单 | 工作项（未派发 / 未完成） | 决定（已谈定 / 未写盘） | 并列进同一清单：两者都是「只在对话里、再也没人看见」的东西 |
| `persona:189–216` 台账生命周期 | 五个事件 → 动作；核销时点 | 未落盘决定的挂行 / 核销时点 | 复用同一生命周期语义（挂行 = 新债登记；核销 = 决定进需求档）；**不增第 6 行**（FR30 五行锁定） |
| `common:141–145` 上下文自掌舵 | 何时自压 / 自压携 focus / 自动压缩 = 兜底 | 压完之后如何找回决定 | 一条管触发器，一条管事后核对；不互相覆盖 |
| `persona:94` 收尾三态 · 禁承诺 | 轮末陈述：说了动作而本轮未发 = not done | 同一判据落在「我先记下」上 | 措辞同形（true only when that same round carries the write）；`记下` 无写盘 = 承诺态 |
| `persona:18` 需求讨论与登记归你 | 归属：谁写需求档 / 批次档 | 时机：何时写 | 归属不变，本条只定时机 |
| `discipline:30` 需求步（discuss → land → confirm → move on） | 最终落点与顺序 | 落盘时机提前到决定当轮 | `land it in the requirements doc` 照旧成立；本条补的是「不用等讨论结束」 |

**行为契约 · 用例表（正常 / 边界 / 错误）**：

| 编号 | 场景 | 输入 / 动作 | 期望 |
|---|---|---|---|
| C1 | 正常 · 决定谈定 | 用户说「筛选按 replaceState，hash 形照你建议」 | 当轮：需求档能接 ⇒ 写需求档；不能接 ⇒ §1 加一行 `**已定决定**：`（决定 · 原话 · 时间） |
| C2 | 正常 · 当轮即入需求档 | 决定当轮写进需求档 | §1 不加行（需求档已是耐久载体）；若已有台账行，当轮核销 |
| C3 | 边界 · 「我先记下」 | 模型说「我先记下」而本轮无写盘 | 判为未落盘 ⇒ 本轮补写；补不上 ⇒ 按 `:94` 写成 Wait / Stop，不写成承诺 |
| C4 | 边界 · 被动压缩后 | 上下文出现 `[Context was automatically compacted…]` | 第一个动作 = 回读 §1 `已定决定` 行 + 台账；摘要丢失的决定立即补写 |
| C5 | 边界 · 主动压缩 | `context` 工具返回压缩完成回执（`agent/run-stages.mjs:95`） | 同 C4 |
| C6 | 边界 · 决定进需求档 | 已挂台账行的决定写进需求档 | 当轮核销该行（`ledger` close） |
| C7 | 错误防御 · 被否选项 | 讨论中的选项被用户否掉（如「不做 hash」被否） | 不是决定，不入清单——清单只收**已定**项 |
| C8 | 错误防御 · 决定进需求档前被推翻 | 已挂台账行的决定被用户推翻 / 作废（不再是已定项，如「hash 路由不做了」） | 该台账行当轮收口：按既有「已废弃」态撤回（`ledger` close → 已废弃），或改写该行绑定替代决定；§1 行不回改（§1 append-only——行是当时的记录），推翻结论按 C1 记为新的已定项 |

**受影响文件（现行行数 / 字符数 = `split("\n").length − 1` / `length` 实读 · 2026-10-19 本席）**：

| 文件 | 现行 | Δ | 说明 |
|---|---|---|---|
| `thincoder-core/prompts/persona-engineering.md` | 240 行 / 59,774 字符 | +2 行 / +1,673 字符 + 2 换行 | L1 + L2；改后 61,449 |
| `thincoder-core/prompts/discipline-engineering.md` | 200 行 / 36,773 字符 | +1 行 / +301 字符 | L3；改后 37,074 |
| `thincoder-core/prompts/common.md` | 273 行 / 43,080 字符 | ±0 | L4 = 判为不落 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1,626 行 / 134,249 字符（本轮修正前实读） | 本笔 = §6.36 修正（设计轮） | 实施轮零触 |

测试覆盖：零单元测试档（纯文本改动、无分支）；机判 = 既有 `scripts/prompt-refs-check.mjs` + doc_check 交付门，不新增断言。

**验收（A1–A7 · 回指 §13.12 ①–⑥）**：

| # | 验收 | 判法 / 读数 |
|---|---|---|
| A1 | §13.12 ①：同轮落笔句在场（触发 = 决定当轮；落点 = 需求档 ∥ §1）；块 C 落在步骤 1 的条区间内 | `node` 子串比对（按档分判）：`thincoder-core/prompts/persona-engineering.md` 内 `A decision lands in the round it is made` 1 次 · `otherwise one line in batch record §1, in the fixed form` 1 次 · `- **已定决定**：` 1 次；`thincoder-core/prompts/discipline-engineering.md` 内 `A decision lands in the round it is made` 1 次 · `the main agent writes it down in that round` 1 次，且该行以三空格缩进 `   - ` 起头。**位置判据（块 C）**：同一档内行索引比较——块 C 行 > `are the marker that requirements were accepted.` 所在行，且 < 行首为 `2. **Design**` 的行（块 C 必须落在步骤 1 条区间内；错位即红） |
| A2 | §13.12 ②：重锚句在场（触发 = 标记 / 回执；动作 = 回读 §1 + 台账） | 子串 `[Context was automatically compacted` · `read back the current batch record §1` · `and the ledger` 各 1 次命中 |
| A3 | §13.12 ③：台账行句 + 核销条件 | 子串 `is a debt of the same shape` · `closes in the round the decision reaches the requirements doc` 各 1 次命中 |
| A4 | §13.12 ④：携 why、无禁令腔 | ① 禁令词扫描（机械）：新增区段（块 A / B / C）扫 `never|do not|don't|must not|may not|forbidden` ⇒ 0 命中（本席已预扫 = 0）；② 逐块 why 在场的一次性核对（实施轮核对、读数入批次档 §5）：块 A 第 1 条 = `a decision held only in the conversation is one compaction away from gone, and the documents written afterwards then record its opposite — a requirement written backwards is worse than one missing, because implementation is built on it`；块 A 第 2 条 = `Nothing before the compaction: passive compaction fires between requests, so the pre-compaction sign would be one no model can see — the summary's arrival is the first moment the trigger exists`；块 B = 宿主 bullet 自带 why（`thincoder-core/prompts/persona-engineering.md:96` 欠账条整句——本句同族复用，不另写 why）；块 C = `waiting for the discussion to close leaves the decision in the conversation alone, where the next compaction erases it`。判据 = 三块各指出上述子句其一（块 A 两条各一；缺一即红） |
| A5 | §13.12 ⑤：提示词面零文档引用 · 体量读数（无帽） | `node scripts/prompt-refs-check.mjs` ⇒ 命中 0；字符数 ⇒ persona 预计 61,449、discipline 预计 37,074 |
| A6 | §13.12 ⑥：与既有条款逐句对照无矛盾；对照结论记入批次档 | 对照表七行结论 = 零矛盾（本档对照表 = 依据）；**对照结论在收口时落批次档 §6（主 agent 笔）**；下一批行为观察：谈定后当轮有写盘；压缩后首动作 = 回读 §1 + 台账 |
| A7 | 三条触发模型侧可观察；触发字面与运行时标记常量同形 | 同轮落笔 = 决定做出当轮；重锚 = 标记 / 回执（`context.mjs:34-37`）；台账行 = 决定谈定当轮。**一次性常量比对**（实施轮与复核轮各一次，读数入批次档 §5）：从 `thincoder-core/context.mjs` 取 `COMPACTION_PREFIX` 串首，取提示词所引字面 `[Context was automatically compacted…]` 去掉 `…]` 的前缀，断言 `常量.startsWith(提示词前缀) === true`——方向固定：提示词前缀必须是运行时常量的前缀（反向不判） |

**边界（本批不做）**：压缩机制（阈值 / 摘要指令）零改 · 台账 schema 零改 · 批次档六段结构零改 · 普通模式零改（另裁）· 机械门 / 工具 / 状态零新增 · `thincoder-core/prompts/**` 本设计轮零笔（实施轮由 eng-coder 照落点表落笔）· `thincoder-core/prompts/common.md` 零改 · 生命周期表零增行 · 需求档零笔（§5.3 的 §1 枚举随动 = 上抛项，主 agent 笔）。

**关键决策**：

| # | 决策 | 理由 |
|---|---|---|
| K1 | 规则 1 + 规则 2 落 `persona:29` 后（确认门节内），权威句一处 | `:29` 正是「记录决定」的许可句，且已带 `done in the same turn`——义务只差这一步；规则 2 是同一保证的恢复半（决定要活过压缩），紧邻成对读 |
| K2 | 规则 3 落 `persona:96` 债务条尾（追加句，不加 bullet） | 它是债务条的同族：只在对话里的决定与只在报告 prose 里的欠账是同一种「没人再看见」；同条内追加 ⇒ 零行数连带、零重复 |
| K3 | 「已定决定」= §1 行约定（行首标记），不是子块 | §1 append-only：子块被后续追加冲散後清单不再连续；标记行每条自足、可全文扫读，且六段结构零改。行形逐字并入块 A（本笔）⇒ 写盘与回读扫标记同形，「固定标记」兑现到落地文本 |
| K4 | `thincoder-core/prompts/discipline-engineering.md` 需求步 +1 行 | 该步现文只给最终落点（`land it in the requirements doc`），按字面读落盘在讨论结束后——这正是「我先记下」的文本来源；该步是决定发生的步骤。纪律档读者 = 主 agent + eng-coder + eng-designer（`thincoder-core/prompt-overlays.mjs:44-45`）——后两者不能写需求档 / 批次档 §1（D1），故块 C 必须写明动作主体是主 agent，否则它是对无法执行它的读者下的假指令（与 K5 同一判据）。§6.34 判不加是因为那里纪律层无发起面，本条不同 |
| K5 | `thincoder-core/prompts/common.md` 不落 | 需求限定工程模式（普通模式另裁）；动作落点（§1 笔 + 台账写权）是主 agent 独属面，common 的读者含不能执行它的子代理；且自掌舵节管的是压缩时机，不是决定耐久 |
| K6 | 不写压缩前动作 | 被动压缩无预兆、触发点不可观察——规则须落在模型真能看见的信号上（用户 2026-10-19 22:29 裁定） |
| K7 | 提示词正文引用 `[Context was automatically compacted…]` 字面 | 该串是运行时真实标记（`context.mjs:34-37`），不是文档引用；写在提示词里 = 触发点可识别 |
| K8 | 「已定决定」行形的格式归属 = `docs/core/design/BATCH-RECORD.md` §4.10 登记（回指本节） | 该行是批次档 §1 的格式面元素——格式面拥有档 = 批次档设计档；只在提示词设计档登记则格式归属无主。需求档 §5.3 的 §1 构成枚举随动 = 上抛项（需求笔归主 agent） |

**UI / 交互决策**：无界面面——本条只改模型可见提示词文本。

**上抛项**：无。① `docs/core/requirements/ENGINEERING-MODE-V2.md` §5.3（`:175`）的 §1 构成枚举已由主 agent 于 2026-10-19 补为「目标+前情+条目+已定决定清单」；格式归属登记在 `BATCH-RECORD.md` §4.10。

### 6.37 任务书陈旧口径（§2 只引不抄 ∥ 设计变更传播 ∥ 收口对账 · FR35）

**来源**：需求权威 = `ENGINEERING-MODE-V2.md` §13.13（FR35，三条 + 验收 ①–⑥）；台账 `#1714`；现象与四处提示词缺口 = 本批批次档 §1。

**要修的那一处（实读 2026-10-19 本席）**：

| 缺口 | 现文坐标 | 缺的那一半 |
|---|---|---|
| 任务书两源并列，无优先级 | `thincoder-core/prompts/persona-engineering.md:162`（`batch record §2 / design doc`） | §2 与设计不一致时无判据 |
| 单一判据源只约束派单 | `thincoder-core/prompts/persona-engineering.md:168`（`the dispatch carries ONE criterion source`） | §2 里重述的计数 / 判据不在射程内——§2 自己造了第二判据 |
| 收口清单无跨档对账 | `thincoder-core/prompts/discipline-engineering.md:188-189`（D7 清单有 `counts`，无 §2 ↔ 设计） | 收口不核 §2 判据是否仍与当前设计一致 |
| 三链同源只在设计轮返工前跑一次 | `thincoder-core/prompts/persona-eng-designer.md:82-84` | 后续批次改共享设计时不重跑 |

**实例（why 的依据 · 可指认）**：

- `D:\repos` 会话较早批 §2 第 5 条：「`:1378` 自建表四张 → **五张**，补 `skip_combo`，与 §2.2 `:93`、C3 同一表集」；
- 同一会话后一批 §2：「自用库改**六张表**」「§5.1 C3 表集加 `doc_all`」；
- 前批仍在途、§2 未随动 ⇒ 照其收口，「恰好五张」的等值断言与设计的六张当场对不上；
- 同一会话更近一例：某批 §2 的「补正」行本身写「现行设计为**五张表**」，而设计已六张，由设计评审的判据行抓出——**连更正行也会陈旧**；
- 结论：任务书把活值抄成死值，后批改设计就把前批任务书变成错的——照旧 §2 收口，正确实现被判红，或旧口径被放过。抓到它靠的是人的注意力，不是结构。

**机制（三条规则 · 单源 = 本节；提示词面只持最短动作锚）**：

1. **§2 只引不抄**：批次档 §2（任务书）里的判据 / 计数按 `design §N.M` / `requirements §N.M` 引用，不重述数字；必须出现字面值（验收等值断言）时，它只作为该节所陈述的值出现，引用紧贴其旁。§2 不造第二判据。
2. **设计变更传播**：触发 = 设计变更落地（修正轮落地 / 评审通过后的设计定稿）。动作 = 父侧扫在途批次档 §2 中引用到被改节的行，**同轮**追加 §2 更正（append-only，旧行不动）或当日挂债（台账行点名批次与节）。责任面按 D1：扫描与派单 = 父侧；§2 的笔 = eng-designer（父侧不代笔，更正走 designer 修正轮）。
3. **收口对账**：D7 收口清单加一项「§2 判据 / 计数 ↔ 当前设计档：一致，或差异已记 §6」。

**扫描形态（可执行 · 仓根运行）**：

```bash
# SEC = 被改节的编号（如 2.4）；TITLE = 该节标题的锚串（如「镜像」）
node -e "const fs=require('fs');const sec='2.4',title='镜像';for(const f of fs.readdirSync('docs/batches')){if(!f.endsWith('.md'))continue;const s=fs.readFileSync('docs/batches/'+f,'utf8');if(/^\*\*状态行\*\*：[^\n]*已收口/m.test(s))continue;if(s.includes('design §'+sec)||s.includes(title))console.log(f)}"
```

命中文件逐个读段确认：命中的是 §2 里引用被改节的行 ⇒ 进入处置（同轮更正 / 挂债）；命中在 §3 / §6 是评审或收口引述 ⇒ 不处置。

**扫描边界（误报 / 漏报）**：

| 类 | 情形 | 处置 |
|---|---|---|
| 误报 | 命中的编号属于另一档（如需求档的 `§2.4`） | 新形态带 `design` 前缀可区分；旧形态按标题串人工分辨 |
| 误报 | 标题锚串过宽（「镜像」也出现在别的主题） | 换更长的标题串重扫 |
| 误报 | 命中行在 §3 评审 / §6 收口（引述而非判据） | 不处置 |
| 漏报 | 旧 §2 用行号引用（`:1378`）或只写标题不含 `§N.M` | 标题串补扫（命令已含 `title` 分支） |
| 漏报 | 改了父节而 §2 引用的是子节 | 按父节号与子节号各扫一遍 |
| 漏报 | 扫描只覆盖 `docs/batches/` 下在盘的档；已冻结档不在射程 | 冻结档不回改（新老划断）；「在途 / 冻结」按 §1 状态行判定：片段只跳过 §1 状态行含 `已收口` 的档，前情指针里的「已收口」字样不触发跳过 |

**取法（最近先例 ∥ 偏离）**：
先例 = 本档 §6.34（逐字英文文本 + 落点表 + 对照表 + 验收）∥ §6.35（既有清单内增行）∥ §6.36（三行为面分落）∥ D-PS37（同规则多点落、各持最短动作锚）。
对齐 = 逐字英文块、既有节内增行、零新增 `##` 节、既有行除一处括注外零改。

偏离 = ① 规则 1 的权威短句落 **eng-designer**（§2 的笔），父侧只落「两源优先级 + 判据源射程」两句——§6.36 两条都落主 agent 是因为两条的动作者都是主 agent；本条写 §2 的动作者是 designer（D1），规则落在不能执行它的读者身上 = 假指令（同 §6.36 K4 判据）。② `:162` 的括注改写为带优先级的句子，不是纯追加——该括注（`batch record §2 / design doc`）本身就是缺口：两源并列、无优先级，纯追加会在原地留下一对无判据的并列源（缺口表第一行）。

**勘察证据行**：已读 `thincoder-core/prompts/persona-engineering.md:145–190`（任务书参数节 + Fix rounds doc-first）· `thincoder-core/prompts/discipline-engineering.md:179–196`（D1–D9 与可读性）·

`thincoder-core/prompts/persona-eng-designer.md:24–84`（修单接单 / 两份交付物 / 三链同源）· 本档 §6.34 ∥ §6.35 ∥ §6.36 ∥ D-PS37 · 需求档 §13.13 ∥ §13.12 · `scripts/prompt-refs-check.mjs`（J1/J2/J3 判据）。
实例三本批次档在仓外（`D:\repos`），只作 rationale，不作指针。工作目录内无独立公共源文档仓——已查无（`PROJECT-MANIFEST.json` `index.publicRepos = []` 实读 `:61`）。

**逐字英文文本（实施席照此落笔 · 唯一权威目标形）**：

A. `thincoder-core/prompts/persona-engineering.md:162` 整行替换（其余句照旧，只把括注改成带优先级的句子）：

```
- **Task books are re-derived, not transcribed**: fill every acceptance line and known fact from THIS batch's own documents — and where batch record §2 and the design doc disagree, **the design doc is the criterion source of record**: §2 is a dispatch surface that cites it, not a second copy of a 
  count or criterion. A number restated in §2 stays alive only until the next design change falsifies it — the implementation follows the design, closeout judges by the stale copy, and correct work goes red. Transcribing from a sibling batch's report or record drags stale criteria and wrong wording 

  across in the same way.
```

B. `thincoder-core/prompts/persona-engineering.md:168` 行尾追加（同一 bullet 内续写；行数 ±0）：

```
 The same reach extends to the task book itself: a criterion or count written into batch record §2 as its own text is that second criterion — §2 cites the owning design-doc section, in the form `design §N.M` / `requirements §N.M`, and where a literal value has to appear (an acceptance equality 

  assertion) it appears only as that section's value with the citation beside it.
```

C. `thincoder-core/prompts/persona-engineering.md:162` 之后新增一行（同 bullet 列表，行间不插空行；现文零改）：

```
- **A landed design change propagates to the task books that cite it**: the moment a design-doc change lands — a fix round's revision, or the design finalized after review — scan the in-flight batch records for §2 citations of the changed section (its `design §N.M` token and its title), and in that 
  same round append a §2 correction through a designer fix round (appended lines; the old ones stay as the record of what was thought then) or book the day's debt on the ledger, naming the batch and the section. The scan and the dispatch are yours; the §2 pen is the designer's — a correction you 

  append yourself puts a second author on their segment, and a correction left unbooked is one nobody comes back to make.
```

D. `thincoder-core/prompts/discipline-engineering.md:188` 内、整段替换现文 `counts / pointers`（块 D 首尾即两端锚；行数 ±0）：

```
counts / **§2 ↔ design-doc reconciliation** (every criterion or count §2 cites still matches the owning design-doc section — a mismatch is closed by an appended §2 correction, or recorded in §6; judging closeout by a stale §2 is what turns a correct implementation red) / pointers
```

E. `thincoder-core/prompts/persona-eng-designer.md:53` 之后新增一行（三空格缩进，仍属 item 1；落在 `Six-segment boundary` 行之前）：

```
   **§2 cites rather than transcribes**: a criterion or count in §2 points at its owning section (`design §N.M` / `requirements §N.M`) — the design doc is the live side, and a number copied into §2 freezes at the copying moment, so the next design change leaves §2 wrong while the implementation 

  follows the design, and closeout fails correct work by a stale criterion. Where a literal has to appear (an acceptance equality assertion), it appears only as that section's value, citation beside it.
```

**落点表（实施席逐处执行）**：

| # | 坐标 | 现文 → 新文 | 动作 |
|---|---|---|---|
| L1 | `thincoder-core/prompts/persona-engineering.md:162` | 括注 `(batch record §2 / design doc)` → 优先级句（块 A） | 整行替换（±0 行 / +364 字符） |
| L2 | `thincoder-core/prompts/persona-engineering.md:168` 行尾 | 追加块 B | 同行追加（±0 行 / +374 字符） |
| L3 | `thincoder-core/prompts/persona-engineering.md:162` 后 | 新增块 C | 追加（+1 行 / +715 字符） |
| L4 | `thincoder-core/prompts/discipline-engineering.md:188` 行内 | 以块 D 整体替换现文 `counts / pointers` 一段（块 D 首尾即两端锚） | 整段替换（±0 行 / +263 字符） |
| L5 | `thincoder-core/prompts/persona-eng-designer.md:53` 后 | 新增块 E | 追加（+1 行 / +497 字符） |
| L6 | `thincoder-core/prompts/common.md` · `tool-docs` · 批次档骨架 · 需求档 · 产品代码 | 零改 | 判为不落（K5） |

**对照表（与既有各句逐句对照 · 结论 = 零矛盾）**：

| 既有句 | 它管什么 | 本条管什么 | 为何不矛盾 |
|---|---|---|---|
| `thincoder-core/prompts/persona-engineering.md:162` 任务书两源（§2 / 设计档） | 任务书从哪两处取料 | 两源冲突时谁赢（设计档），§2 的形态（引用） | 原来的并列只是没写优先级；本条补优先级，取料范围不变 |
| `thincoder-core/prompts/persona-engineering.md:168` 单一判据源（the dispatch） | 派单不造第二判据 | 同一原则扩到任务书本身（§2） | 同一判据（one criterion, one source）的射程扩大，不换判据；派单面照旧 |
| `thincoder-core/prompts/persona-engineering.md:180-181` 任务书 = 表 | 任务书的形态是行动表 | 表格单元里放引用而非复述的值 | 表形态零改；只改单元的写法（引用优先） |
| `thincoder-core/prompts/persona-engineering.md:149` Fix rounds doc-first | 修正轮先改设计档，再派工 | 设计变更落地后扫 §2 | 同一轮的先后：先落设计，再传播；不抢时点 |
| `thincoder-core/prompts/discipline-engineering.md:184` D3 计数纪律 | 同一档内计数与清单同步变 | 跨档：§2 引用值随设计档变 | 两件事：D3 管写者自己的档，本条管引用方不持有活值 |
| `thincoder-core/prompts/discipline-engineering.md:188-189` D7 清单 | 收口固定动作集 | 清单内加一项对账 | 追加项，清单结构零改、无声明计数被牵动 |
| `thincoder-core/prompts/persona-eng-designer.md:82-84` 三链同源 | 条目（需求条目）三链同源，设计轮返工前跑 | 判据 / 计数的跨批陈旧，设计变更落地时跑 | 对象不同（条目 vs 判据值）、时点不同；更正走 designer 修正轮时 82-84 在轮末照跑 |
| §2 append-only（`batch` 工具段白名单） | §2 只可追加、只 designer 可写 | 更正 = 追加行，不改旧行 | 完全同向：更正形态就是 append；父侧代笔会被工具拒（机械兜底） |

**行为契约 · 用例表（正常 / 边界 / 错误）**：

| 编号 | 场景 | 输入 / 动作 | 期望 |
|---|---|---|---|
| U1 | 正常 · 写 §2 | designer 写一条验收等值断言 | 写「表集 = `design §2.4` 所陈述的六张」+ 引用；不裸写「六张」 |
| U2 | 正常 · 设计变更落地 | 修正轮改了设计的 §2.4 | 父侧当轮跑扫描 → 在途批 §2 命中 → 派 designer 修正轮 append 更正行 |
| U3 | 边界 · 扫描零命中 | 设计变更落地，无在途 §2 引用该节 | 无处置；扫描读数记入当轮报告 |
| U4 | 边界 · 旧形态引用 | §2 只写标题、无 `§N.M` | 标题串分支命中；更正行同时补新形态引用 |
| U5 | 边界 · 已冻结批次 | 已收口批次 §2 引用被改节 | 不在射程（新老划断）；扫描过滤掉 |
| U6 | 错误防御 · 父侧代笔 | 父侧直接给 §2 append 更正 | `batch` 工具拒（段白名单 eng-designer → §2）——机械兜底，不靠自觉 |
| U7 | 错误防御 · 漏传播 | 设计变更落地但未扫、未挂债 | 收口对账兜底：D7 项判红，差异当轮修正或记 §6 |
| U8 | 错误防御 · 裸数字无引用 | §2 写了计数、无来源节 | 对账按「无法归属 ⇒ 视为不一致」处置：补引用或 append 更正 |

**受影响文件（现行行数 / 字符数 = `split("\n").length − 1` / `length` 实读 · 2026-10-19 本席）**：

| 文件 | 现行 | Δ | 说明 |
|---|---|---|---|
| `thincoder-core/prompts/persona-engineering.md` | 242 行 / 61,449 字符 | +1 行 / +1,453 字符 | L1–L3；改后 243 行 / 62,902 |
| `thincoder-core/prompts/discipline-engineering.md` | 201 行 / 37,074 字符 | ±0 行 / +263 字符 | L4；改后 37,337 |
| `thincoder-core/prompts/persona-eng-designer.md` | 88 行 / 18,077 字符 | +1 行 / +497 字符 | L5；改后 18,574 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1,633 行 / 137,222 字符（本节写入前实读） | 本节新增（设计轮） | 实施轮零触 |
| `docs/core/design/BATCH-RECORD.md` | 643 行 / 54,753 字符（登记段落地前实读；现盘 647 行 / 54,997 字符） | +4 行 / +244 字符（设计轮已落） | §4.10 增「§2 引用形态约定」登记段（格式归属，回指本节）；实施轮零触 |
| `thincoder-core/prompts/common.md` · `tool-docs` · 批次档骨架 · 需求档 · 产品代码 | — | ±0 | 判为不落 / 禁改 |

测试覆盖：零单元测试档（纯文本改动、无分支）；机判 = 既有 `scripts/prompt-refs-check.mjs` + `doc_check` 交付门 + 上表子串判据，不新增常驻断言。

**验收（A1–A8 · 回指 §13.13 ①–⑥ 与本批派单验收）**：

| # | 验收 | 判法 / 读数 |
|---|---|---|
| A1 | §13.13 ①：只引不抄句在场（两档分判） | `thincoder-core/prompts/persona-eng-designer.md` 内 `§2 cites rather than transcribes` · `design §N.M` · `citation beside it` 各 1 次；`thincoder-core/prompts/persona-engineering.md` 内 `the design doc is the criterion source of record` · `§2 is a dispatch surface that cites it` · `The same reach extends to the task book itself` · `requirements §N.M`（块 B 引用形态两档并列）各 1 次 |
| A2 | §13.13 ②：传播句在场（触发 / 动作 / 责任面） | `A landed design change propagates to the task books that cite it` · `scan the in-flight batch records` · `append a §2 correction` · `book the day's debt` 各 1 次 |
| A3 | §13.13 ③：D7 清单含对账项 | `thincoder-core/prompts/discipline-engineering.md` 内 `counts / **§2 ↔ design-doc reconciliation**` 1 次，且与 `7. **D7 settlement sync**` 同一行（行号 = D7 行号）；该行内 `counts /` 与 `pointers` 各出现 1 次（两端锚重复即红） |
| A4 | §13.13 ④：携 why、无禁令腔 | 新增区段扫 `never|do not|don't|must not|may not|forbidden` ⇒ 0（本席预扫 = 0）；why 子句逐块：A = `A number restated in §2 stays alive only until the next design change falsifies it`；B = `a criterion or count written into batch record §2 as its own text is that second criterion`；C = `a correction left unbooked is one nobody comes back to make`；D = `judging closeout by a stale §2 is what turns a correct implementation red`；E = `closeout fails correct work by a stale criterion` |
| A5 | §13.13 ⑤：提示词面零文档引用 · 体量读数（无帽） | `node scripts/prompt-refs-check.mjs` ⇒ 命中 0；**块 E 内容判据 = 落地行与本节块 E 逐字围栏块整行相等**（行首三空格缩进在内；只判字数时，措辞微调仍可全绿）；字符数 ≤ 预算（persona 63,292 / discipline 38,186 / designer 18,619）作附带读数（designer 余量 45 字符） |
| A6 | §13.13 ⑥：与既有条款逐句对照无矛盾；结论记入批次档 | 对照表八行逐句判读结论 = 零矛盾（依据 = 本表「为何不矛盾」列）；结论已记入本批 §2「验收 ⑥ 对照结论」行 |
| A7 | 派单 ②：三条触发模型侧可观察 | 只引不抄 = 写 §2 时（designer 轮）· 传播 = 设计变更落地（修正轮 / 评审定稿，父侧当轮）· 对账 = 批次收口（D7） |
| A8 | 派单 ③：`thincoder-core/prompts/persona-eng-designer.md` 同落判定 | 落，理由 = K1（写 §2 的动作者是 designer；只落父侧 = 假指令） |

**边界（本批不做）**：批次档六段结构零改 · 冻结档零改（新老划断）· 普通模式零改（另裁）· 机械门 / 工具 / 状态零新增 · `thincoder-core/prompts/**` 本设计轮零笔（实施轮由 eng-coder 照落点表落笔）· 需求档零笔 · 产品代码零触 · `thincoder-core/prompts/common.md` / `tool-docs` 零改 · 既有在途 §2 的裸 `§N.M` 写法不回改（扫描按标题串兜底）。

**关键决策**：

| # | 决策 | 理由 |
|---|---|---|
| K1 | 规则 1 的权威短句落 `thincoder-core/prompts/persona-eng-designer.md:53` 后（§2 的笔）；父侧只落优先级与射程两句 | 写 §2 的动作者是 designer（D1）；只落父侧 ⇒ 写者从未见过规则，规则只在下游被消费 = 假指令（同 §6.36 K4 判据）；父侧两句治的恰是它的两个缺口，不是规则本体（D2：本体 = 本节） |
| K2 | 传播落 `thincoder-core/prompts/persona-engineering.md:162` 后新 bullet | 触发（设计变更落地）与动作（扫描 + 派 designer 修正轮）都是父侧动作；贴任务书节 = 与「任务书从哪来」同轴读 |
| K3 | 对账落 D7 清单内、`counts` 之后 | D7 = 收口固定动作集；与 `counts` 相邻 = 同族（本档计数 vs 跨档计数），行内插入不增行 |
| K4 | 引用形态 = `design §N.M` / `requirements §N.M` | 让引用可机扫（规则 2 的扫描依赖它）+ 区分同号不同档；既有裸 `§N.M` 由标题串补扫兜住 |
| K5 | `thincoder-core/prompts/common.md` / `tool-docs` / 批次档骨架不落 | 受众 = 工程模式父侧 + 设计席；common 含普通模式（本批另裁）与写不了 §2 的子代理；骨架只列 §2 装什么，不含形态规则 |
| K6 | 更正 = append，不改旧行 | §2 append-only 是工具机械事实；旧行保留为当时记录，更正行自带「当前口径」语义 |
| K7 | 对账带逃生面「差异已记 §6」 | 收口时无法当轮修正的差异（设计仍在校准 / 实现已按旧判据完成）记 §6 使其可见——比强行判红或静默放过好（D7 差异显式化同轴） |
| K8 | 批次档设计档登记 = `BATCH-RECORD.md` §4.10 一行（格式归属，回指本节） | §2 的格式面元素以批次档设计档为登记面（承 §4.10「已定决定」行登记先例：行形要登记，引用形态同样要登记）；机制描述单源仍 = 本节（D2 管机制，不管格式归属）；骨架不含形态规则，零随动 |

**UI / 交互决策**：无界面面——本条只改模型可见提示词文本。

**上抛项**：无。

### 6.38 整批令覆盖批准门（提示词面显式化 · FR36）

**来源**：用户 2026-10-19 23:27「放行 = 有权发起，不等于已批准 这条纪律是哪里来的？」· 23:29「**这条纪律有问题啊！应该是要能够自动跑完的。**」· 23:30「**我是觉得如果这个规则进了提示词，应该要改正。**」

需求权威 = `ENGINEERING-MODE-V2.md` §13.14（FR36，三条）；台账 `#1715`。被取代条文 = `thincoder-core/prompts/persona-engineering.md:14`；出处 = `docs/batches/2026-10-17-prompt-firing-rights.md` B1（冻结档，只读）。

**要修的那一处（实读 · 2026-10-19 本席）**：

- `thincoder-core/prompts/persona-engineering.md:14` 现文：`The go-ahead **does not exempt the approval gate**: the review still runs, the user's approval is still required — **"authorized to fire" is not "approved"**.` 该句让整批令在批准门再停一次——同一份授权收两次费。
- 设计档自身两处登记引用旧语义：`:1226`（§6.34 成因表 G4，闭合列写「预授权不豁免批准照旧成立」）∥ `:1285`（§6.34 对照表第 2 行，「`:13` 仍成立：预授权照旧不等于批准」）（本笔已落，见 L6 / L7）。
- 体量读数：父侧交单读数 61,449 字符；本席 `node` 实读 = **62,902 字符 / 243 行**——差额 = FR35 `taskbook-sync` 批已落地的 +1,453。本批基线取实读 62,902，上限 = 62,902 × 1.03 = **64,789**。

**机制（四条 = 需求三条 + 默认档一条 · 回指 §13.14）**：

1. **覆盖批准门**：批级放行 ⇒ 批内全链（评审 → 修正 → 实施 → 收口）自动跑完，不再单独停一次批准门。令牌照旧在评审通过那轮由 advisor 签发（§6.35）：整批令替代的是「等用户那句话」，不是写权凭证——批准门被覆盖 ≠ 令牌不再铸出。
2. **评审照走**：go-ahead 覆盖的是「再等一句 go」，不是评审；评审是质量闸，发现照原规处置。
3. **四停相**：① 评审 🔴 修不掉 / 需改设计语义 ② 实施需偏离已批准设计 ③ 用户明示 hold / 只批设计 / 先别动 ④ 范围变更（新需求不在原批内）。命中任一条 ⇒ 停下上报。
4. **无整批令时照旧**：`:8` 默认档与 FR32（`:9`）的等号原样成立。

**逐字英文文本（实施席照此落笔 · 唯一权威目标形；R2 / R3 = 仅前缀的插入串，行内其余取原句逐字）**：

R1 — `thincoder-core/prompts/persona-engineering.md:14` 整行替换：

```text
The go-ahead **covers the approval gate**: the batch runs its whole chain through in one pass — review, fixes, implementation, closeout — because the go-ahead already authorizes the batch's whole scope, and a second stop at the approval gate charges the same authorization twice. **The review still 

  runs, unchanged**: the go-ahead covers the wait for a separate go, not the review itself — review is the quality gate, and its findings are handled as before. Four shapes still stop the run and send it back to the user: (i) review 🔴 findings that cannot be fixed or that need a change of design 

  semantics (ii) implementation would have to deviate from the approved design (iii) the user says hold / design only / not yet (iv) the scope changes — a new requirement outside the batch. Without a batch-wide go-ahead, each step waits for the user's word as before.
```

R2 — `thincoder-core/prompts/persona-engineering.md:8` 行首插入作用域前缀（**只给前缀**；该行其余 = `:8` 原句逐字零改）：

```text
**Without a batch-wide go-ahead**,
```

落笔形 = 插入串 + 一个空格 + 原句（`Review firing and advancement both stop at the user's approval gate — …`）；净增 35 字符（34 + 空格），与 Δ 列一致。

R3 — `thincoder-core/prompts/persona-engineering.md:59` 行首插入作用域前缀（**只给前缀**；插在该行 `> ` 之后；块 C 原句逐字零改——加粗与首字母大写保留）：

```text
**Without a batch-wide go-ahead**,
```

落笔形 = `> ` + 插入串 + 一个空格 + 块 C 原句（`**Once the review has passed, the approval is that word**: …`）；净增 35 字符。

**同节三句判定（需求点名 · 逐句给理由）**：

| 句 | 判定 | 理由 |
|---|---|---|
| `:8` `Review firing and advancement both stop at the user's approval gate … wait for the user's explicit go.` | **冲突 ⇒ 同轮收正（R2）** | 无条件断言「过门之后从未被批准」+「等一句 go」；整批令下过门之后的动作已被授权，且无人再等第二句。加作用域前缀即消除，默认档原文保留 |
| `:55` `review firing / implementation starts wait for the user's word — with the go-ahead, continue; without one, hold` | **不冲突 ⇒ 零改** | 首句已写「with the go-ahead, continue」；整批令就是「the user's word」本身（`:11` 定义：覆盖该批每一步）。它要求的是「有一个用户表态」，不是「第二个表态」 |
| `:59` `Once the review has passed, the approval is that word … the sign-off is the nod the next step holds for` | **冲突 ⇒ 同轮收正（R3）** | 「the next step holds for the sign-off」在整批令下不成立（无人等 sign-off）；加作用域前缀把它限定到无整批令的默认档 |
| `:9`（块 A，需求未点名） | **零改** | ① 它定的是「批准 ↔ 启动」等号（FR32），不是「必须等批准」的义务；整批令本身就是那句 go/批准，等号照旧成立。② 停相计数分两轴：`:9` 的 `The one stop shape` = 批准语本身只有一种停形（批准语说 hold）；R1 的 `Four shapes` = 使批内 run 停下的四相（与 §13.14 ② 同轴）——前者管「批准语能是什么」，后者管「已跑的批为什么停」，两个计数各自成立，不矛盾 |
| `:11-13`（定义 + 三终点） | **零改** | `:14` 只扩覆盖对象（发起 → 批准门），不否定定义与生命周期；四停相 ③ = 叫停、④ = 范围变更，与三终点同轴 |

**落点表（实施席逐处执行）**：

| # | 坐标 | 现文 → 新文 | 动作 |
|---|---|---|---|
| L1 | `thincoder-core/prompts/persona-engineering.md:14` | 旧句整行 → 逐字块 R1 | 替换（±0 行） |
| L2 | `thincoder-core/prompts/persona-engineering.md:8` | 行首插入 R2 前缀（仅前缀；原文前留一空格） | 就地改（±0 行 / +35 字符） |
| L3 | `thincoder-core/prompts/persona-engineering.md:59` | `> ` 之后插入 R3 前缀（仅前缀；原文前留一空格） | 就地改（±0 行 / +35 字符） |
| L4 | `thincoder-core/prompts/persona-engineering.md:55` | 零改（判定见上表） | — |
| L5 | `thincoder-core/prompts/persona-engineering.md:11-13` | 零改（定义与三终点） | — |
| L6 | `PROMPT-SYSTEM.md` §6.34 成因表 G4（`:1226`） | 坐标 `:13` → `:14`；删「预授权不豁免批准照旧成立」，闭合改指 §6.38 | 就地改（本笔已落） |
| L7 | `PROMPT-SYSTEM.md` §6.34 对照表第 2 行（`:1285`） | 旧 `:13` 行 → FR32 ↔ FR36 分档行 | 整行换写（本笔已落） |
| L8 | `docs/batches/2026-10-17-prompt-firing-rights.md` | 零改（冻结档不回改） | — |
| L9 | `thincoder-core/prompts/discipline-engineering.md` | 零改（行为主体 = 父侧；纪律层无发起面——承 §6.34 K4） | — |
| L10 | `thincoder-core/prompts/persona-engineering.md:40` | FR37 残句收口：落笔 = §6.39 L2（R4）；本节只载对照表 `:40` 行 | 回指（本节不落笔） |

**对照表（与既有各句逐句对照 · 结论 = 零矛盾）**：

| 既有句 | 它管什么 | 本条管什么 | 为何不矛盾 |
|---|---|---|---|
| `:6` `Design reviews and implementation starts are both fired by the user, not by you.` | 谁发起：用户，不是 agent 自判 | 整批令 = 用户一次性给出的每步发起 + 批准门覆盖 | 覆盖的是用户已给的授权；agent 仍不自发起 |
| `:8`（R2 改后） | 无整批令的默认：过门先有 go | 有整批令：go 已给 ⇒ 门被覆盖 | 同一句已由 R2 限定作用域 |
| `:9` 批准 = 实施启动（FR32） | 批准时刻：批准即发起，无第三步 | 整批令：连「批准时刻」都不再单独出现 | 等号仍成立——整批令本身就是那句 go/批准；FR36 覆盖的是「等待」，不是等号 |
| `:11-13` 整批令定义 + 三终点 | 令覆盖每步发起；到范围变更 / 叫停 / 跑完为止 | `:14` 把覆盖对象扩到批准门 | 定义零改；四停相 ③④ 与三终点同轴，①② 是批内质量停（停下上报，不改令的生命周期） |
| `:40`（FR37 改后）`Defaults stay in bounds` | 在飞提问的默认值取值域：只从已确认范围取 | 整批令把该批全范围放进「已确认范围」 | 同源分档：`:40` 不再断言「过批准门即无授权」，改按已确认范围判；整批令下已确认范围 = 该批全范围（改法见 §6.39） |
| `:55` 推进与叫停 | 有令即续 / 无令即停 | 有整批令时，续的范围包含批准门 | 「the user's word」= 整批令（`:11` 已定义）；零改 |
| `:59` 块 C（R3 改后） | 无整批令时：评审后的批准就是那个 nod，同轮 spawn | 有整批令时不等这个 nod | 前缀把块 C 限定到默认档；默认档内 FR32 原样 |
| `:147-148` digest 机器信号 | digest 不是放行 | 放行 = 整批令（用户的话） | digest 仍不是授权；有整批令时下一步走的是令，不是 digest |
| `:154` 首句即停 | 停相判据 = 意图 | 四停相 ③ = 同一判据的应用 | 零新词表 |
| §6.34 FR32 | 无整批令时的批准门 | 有整批令时的覆盖 | 分档；§6.34 对照表第 2 行已换写为本行关系 |
| §6.35 `designToken` 必填 | 写权凭证：令牌在评审通过那轮签发，eng-coder spawn 必带（`omitted = refused`） | 整批令：替代「等用户那句话」，不替代令牌 | 令牌照旧铸出、照旧必带；FR36 只覆盖批准门，不触令牌生命周期（§6.35 ∥ 本节边界） |

**§6.34 两处更正（本笔已落）**：① G4 行坐标 `:13` → `:14`，闭合列删去「预授权不豁免批准照旧成立」，改为「整批令下再闭于 §6.38」；② 对照表第 2 行整行换写为「有整批令 = FR36 覆盖 / 无整批令 = FR32 等号」分档行。成因表是分析面（对象就是旧文本），保留历史引文；规范断言（「仍成立」）删除。冻结批档不回改。

**行为契约 · 用例表（正常 / 边界 / 错误）**：

| 编号 | 场景 | 输入 / 动作 | 期望 |
|---|---|---|---|
| C1 | 正常 · 有整批令 | 用户「都处理掉」→ 评审通过 | 父侧直接进实施，不再呈批准请求；过程照常汇报 |
| C2 | 正常 · 无整批令 | 评审通过后用户说「批准」 | 同轮 spawn（FR32 原样） |
| C3 | 边界 · 四停相 ③ | 整批令后用户说「只批设计，先别动」 | 停下，呈当前结果，等下一句 |
| C4 | 边界 · 四停相 ① | 评审 🔴 修不掉 / 需改设计语义 | 停下上报，不自行改语义 |
| C5 | 边界 · 四停相 ② | 实施发现需偏离已批准设计 | 停下上报 |
| C6 | 边界 · 四停相 ④ | 中途加新需求（批外） | 停下；新需求另批或另取新令 |
| C7 | 错误防御 | 只有评审 digest、无整批令 | 不推进（digest 非授权，`:147-148`） |

**受影响文件（现行 = 本席 `node` 实读 · 2026-10-19）**：

| 文件 | 现行 | Δ | 说明 |
|---|---|---|---|
| `thincoder-core/prompts/persona-engineering.md` | 243 行 / 62,902 字符（父侧交单读数 61,449 = FR35 落地前） | ±0 行 / +772 字符（R1 +702 · R2 +35 · R3 +35） | 改后预计 63,674 ≤ 64,789（基线 62,902 × 1.03） |
| `docs/core/design/PROMPT-SYSTEM.md` | 1,804 行 / 149,680 字符（§6.38 写入前实读） | 1,950 行 / 159,704 字符（定稿实读；Δ = +146 行 / +10,024 字符） | 本笔 = 设计轮（含评审修正轮）；实施轮零触 |
| `thincoder-core/prompts/discipline-engineering.md` | 200 行 / 36,773 字符 | ±0 | 判断 = 不加行 |
| `docs/batches/2026-10-17-prompt-firing-rights.md` | 冻结档 | ±0 | 冻结档不回改 |

表注 · 行数口径 = `node` 读全文按 `split("\n")` 切分后 `length − 1`；本档以换行结尾 ⇒ 该式 = 正文行数（末位的空气行不计）。

测试覆盖：零单元测试档（纯文本改动、无分支）；机判 = 既有 `scripts/prompt-refs-check.mjs` + 交付门 `doc_check`，不新增断言。

**验收（A1–A10 · 回指 §13.14 三条 + 默认档一条 · 一次性比对）**：

| # | 验收 | 判法 / 读数 |
|---|---|---|
| A1 | §13.14 ①：覆盖句在场 | 子串 `covers the approval gate` 1 次命中 |
| A2 | §13.14 ②：旧句零残留 | 提示词面 `thincoder-core/prompts/**` 扫 `does not exempt the approval gate` · `"authorized to fire" is not "approved"` ⇒ 各 0 |
| A3 | 评审照走 | 子串 `The review still runs, unchanged` 1 次 |
| A4 | 四停相 | 子串 `Four shapes still stop the run` 1 次；四个停相子句各 1 次 |
| A5 | 同节自洽 | R2 / R3 前缀 `**Without a batch-wide go-ahead**,` 各 1 次；**除前缀外逐字不变**——重跑 §6.34 A1 / A7 两处子串比对：块 C 1 次、块 A 1 次、`:8` 原句 `Review firing and advancement both stop at the user's approval gate` 1 次；`:55` 的 `with the go-ahead, continue; without one, hold` 仍 1 次（零改） |
| A6 | 携 why、无禁令腔 | 新增段（R1 全文 + R2/R3 前缀）扫 `never|do not|don't|must not|may not|forbidden` ⇒ 0；why 句 `charges the same authorization twice` 1 次 |
| A7 | 提示词面零文档引用 | `node scripts/prompt-refs-check.mjs` ⇒ 命中 0 |
| A8 | 体量读数（无帽） | 改后字符数 ≤ 64,789；预计 63,674（基线 62,902 + 净增 772） |
| A9 | §13.14 ③：对照结论记入批次档 | 实施轮在批次档 §5 写一行「对照结论：§6.38 对照表十一行 = 零矛盾」（引用 §6.38）；收口轮核其在场（批次档内 `对照结论` ≥1 次、引用 §6.38） |
| A10 | 停相计数并置可判 | 提示词面（实施后）：`The one stop shape` 1 次 · `Four shapes still stop the run` 1 次；本节 `:9` 行写明两轴判据（one = 批准语停形 / four = 批内 run 停相）——子串比对 |

**边界（本批不做）**：不跳评审 · 不改批准门机制本体（token / 门禁 / 凭证生命周期）· 不改普通模式 · 不改冻结档 · 不放宽四停相 · 不改批次档六段结构 · 不新增机械门 · `thincoder-core/prompts/**` 本设计轮零笔 · 需求档零笔 · 产品代码零触。

**关键决策**：

| # | 决策 | 理由 |
|---|---|---|
| K1 | `:14` 整行替换而非增行 | 旧句与新规直接相反（「不豁免」↔「覆盖」）；同段并存 = 读者二选一，规范面按 D8 删除 |
| K2 | 四停相按 (i)–(iv) 列举 | 与 `:13` 三终点同轴：`(iii)` = 既有「用户叫停」、`(iv)` = 既有「范围变更」；零新机制 |
| K3 | `:8` / `:59` 加作用域前缀，`:55` 零改 | 判据 = 该句是否无条件断言「必须再等一次」；`:55` 已写「with the go-ahead, continue」，另两句没有 |
| K4 | §6.34 成因表保留引文、只删规范句；对照表第 2 行整行换写 | 成因表 = 分析面（对象就是旧文本）；对照表 = 规范面，旧句不留 |
| K5 | 冻结批档不回改 | 用户令；冻结档 = 外部记忆（需求档 §13.6） |
| K6 | `thincoder-core/prompts/discipline-engineering.md` 零改 | 行为主体 = 父侧；纪律层无发起面（承 §6.34 K4 判据） |

**先例 ∥ 偏离**：先例 = 本档 §6.34（逐字英文文本 + 落点表 + 对照表 + 验收 + 用例表）∥ §6.36（就地改、理由随句）。**对齐** = 同一形制、新增文本携 why、落点全在既有段落内。**偏离** = ① 本条额外回改前节（§6.34 两处旧登记）——旧条被推翻后，前节的「仍成立」断言会作为当前规则被检索到；② 本条逐句判定 `:8` / `:55` / `:59` 三句（需求点名），§6.34 当时只判成因表。

**勘察证据行**：已读 `thincoder-core/prompts/persona-engineering.md`（`:1-14` / `:52-60` / `:136-155` 实读）· 本档 §6.34 全文（`:1208-1338`）∥ §6.35 ∥ §6.36 ∥ §6.37（形制）。

另读 `ENGINEERING-MODE-V2.md` §13.14 ∥ §13.10（FR32）· `docs/batches/2026-10-17-prompt-firing-rights.md` B1（`:13` / `:172` / `:195`，只读）· `scripts/prompt-refs-check.mjs`（J1/J2/J3 域）· `PROJECT-MANIFEST.json` `checkConfig` / `index.publicRepos` 实读 = `[]`。

全仓扫 `authorized to fire|does not exempt the approval gate`：命中 = 提示词面 `:14`（实施轮改）· 冻结批档 B1 · §6.34 两行（本笔已改）· 需求档 §13.14（权威处，零改）· `.thincoder/tmp` 基线副本（非提示词面）。publicRepos 为空 ⇒ 无跨仓公共源可查——已查无。

**上抛项**：无。


### 6.39 派单纪律补硬（文件重叠 ≠ 扣住 / 改落点）+ FR36 残句收口（提示词面显式化 · FR37）

**来源**：需求权威 = `ENGINEERING-MODE-V2.md` §13.15（FR37，两条）；台账 `#1717`（本批）+ `#1716`（FR36 残句，本笔收口）。
现象 = 本批批次档 §1（slot 4 两次手工排队：15:19 因与 `#28` 共享文件而「等 `#28`」；16:28 让 designer 把设计写进批档 §2.7 以绕开被冻的设计档）。

**要修的那一处（实读 · 2026-10-20 本席）**：

| # | 坐标 | 现文 | 缺的那一半 |
|---|---|---|---|
| F1 | `thincoder-core/prompts/persona-engineering.md:229` | `Submit and go — queuing is the mechanism's job` … `a hand-kept queue duplicates the scheduler` | 机制在，失效模式没点名：模型把「共享文件」读成「并行失败」，于是提前等待 ∥ 换落点 |
| F2 | 同上（`:229` 行内） | domain conflicts are queued by the scheduler (returns `queued` + position) | 只写了回执形态，没写读法——`queued` 被当成代价 |
| F3 | `thincoder-core/prompts/persona-engineering.md:40` | `anything past the approval gate has no approval behind it` | FR36 后整批令覆盖批准门 ⇒ 批内已授权；该断言无作用域，字面不成立（`#1716`） |

体量读数（本席 `node` 实读 2026-10-20）：`thincoder-core/prompts/persona-engineering.md` = **243 行 / 63,674 字符**；本批上限 = 63,674 × 1.03 = **65,584**。

**机制（四条 = 需求三句 + 自检 · 回指 §13.15）**：

1. **文件重叠是调度输入，不是扣住的理由**：感知到两个 spawn 共享文件 ⇒ 声明 `files` 直接派。等待的代价 = 整批被同一个冲突拖住；换落点的代价 = 内容落进它的判据不在的地方，后一轮还要搬回。
2. **`queued` 是正常准入回执**：回执报的是队列位置 ⇒ 读作「已准入」继续派；把回执读成失败信号，才会把一分钟的派单变成手工等待。
3. **行号漂移是内容问题，不是时机问题**：串行编辑互相顶行号，等待不会把行移回去——文本锚点把编辑钉在内容上，`dependsOn` 把编辑排在产出任务之后。
4. **派单前自检**：「我是因为文件重叠在等、或改了落点吗？」——是 ⇒ 声明 `files` 直接派。

**触发点（模型可观察 · 逐条对位）**：

| 句 | 触发点 | 观察面 |
|---|---|---|
| ① 重叠 ≠ 扣住 | 派单那一刻：两个 spawn 的 `files` 相交 | 自己写的 `files` 数组 |
| ② `queued` 是回执 | spawn 回执里出现 `queued` + 队列位置 | 工具回执原文（`:86` 只许抄它） |
| ③ 漂移用锚解 | 串行编辑前：前一任务已改过同一文件的更早位置 | 读回的行号与盘上内容不符 |
| ④ 自检 | 派单前（与 ① 同一刻） | 同一刻的自问 |

**逐字英文文本（实施席照此落笔 · 唯一权威目标形）**：

S1 — 在 `thincoder-core/prompts/persona-engineering.md:229` 之后**新增一整行**（`:229` 原行零改；新增 = 一个 `- **…**` bullet）：

```text
- **A perceived file overlap is a scheduling input, not a reason to hold or relocate**: the perception is exactly what the `files` declaration exists for — declare the domain, dispatch, and let the scheduler queue what overlaps; a hand-kept wait stalls the batch on the same conflict the queue would 
  have absorbed in place. Relocating the landing point to get around the overlap is the heavier detour: the content lands where its criterion does not live, and a later round pays to move it back. **`queued` is a normal admission receipt**: read it as admission and keep dispatching — a receipt read 

  as a failure signal is what turns a same-minute dispatch into a hand-kept wait. **Line-number drift is a content problem, not a timing one**: serial edits shift line numbers under each other, and a wait leaves the shifted line exactly where it was — a text anchor puts the edit on its content, and 

  a `dependsOn` on the producing task orders the edit after it. **Pre-dispatch self-check**: "am I waiting, or have I moved the landing point, because of file overlap?" — if yes, declare `files` and dispatch; the queue holds the conflict while the work proceeds.
```

R4 — `thincoder-core/prompts/persona-engineering.md:40` 整行替换：

```text
- **Defaults stay in bounds**: a default is drawn only from the scope already confirmed — a default that widened that scope would carry a decision nobody made, and the user would meet the work only after it landed. A batch-wide go-ahead puts the batch's whole scope inside that confirmation, so a 
  default anywhere inside the batch rests on the same authorization; a default reaching outside the batch rests on nothing the user has said, which is why the in-flight ask steers within the confirmed scope rather than expanding it.
```

R4 的作用域句（`A batch-wide go-ahead puts the batch's whole scope inside that confirmation`）与 §6.38 覆盖条同源：取值域从「批准门之前 / 之后」改判为「已确认范围」——`:40` 由此不再依赖批准门字面。净增 303 字符（旧 224 → 新 527）。

**落点表（实施席逐处执行）**：

| # | 坐标 | 现文 → 新文 | 动作 |
|---|---|---|---|
| L1 | `thincoder-core/prompts/persona-engineering.md:229` 之后 | 新增 S1 一整行（原行零改） | 插入（+1 行 / +1,157 字符） |
| L2 | `thincoder-core/prompts/persona-engineering.md:40` | 旧句整行 → R4 | 替换（±0 行 / +303 字符） |
| L3 | `thincoder-core/prompts/persona-engineering.md:175` / `:189` / `:86` / `:229` | 零改（对照见下表） | — |
| L4 | `PROMPT-SYSTEM.md` §6.38 对照表 + 落点表 + A9 计数 | 对照表 +1 行（`:40`）；落点表 +1 行（L10 回指本节 L2）；A9「十行」→「十一行」 | 就地改（本笔已落） |
| L5 | 调度器本体 / `files` / `dependsOn` 语义 / 需求档 / 普通模式 / 机械门 / 冻结档 | 零改 | — |
| L6 | `thincoder-core/prompts/**` 其余行 | 本设计轮零笔（实施轮只落 L1 / L2） | — |

**对照表（与既有条款逐句对照 · 结论 = 零矛盾）**：

| 既有句 | 它管什么 | 本条管什么 | 为何不矛盾 |
|---|---|---|---|
| `:229` Submit and go — queuing is the mechanism's job | 机制面：卡与池的排队归调度器；父侧只读状态、不模拟调度 | 失效模式面：感知到文件重叠时提前等待 ∥ 换落点 | 同向分工：机制描述仍住 `:229`（池上限 / 状态读取一字不改）；本条只点名失效模式并给自检出口 |
| `:229` 并发上限（`pool-full is queued by the pool` · `past 4 the bookkeeping cost and cross-talk risk outweigh the speedup`） | 并发上限轴：池满由池排队；同域并行超过 4 个，父侧自行跟踪每个实现的成本与串扰风险超过提速收益 ⇒ 派单规模自限 | 重叠排队轴：感知到的文件重叠由调度器排队，不是扣住 ∥ 改落点的理由 | 两轴分工：本条的 `keep dispatching` 只在重叠排队轴上读——重叠照派，由队列吸收；并发上限仍按 `:229`：池满排队、过 4 不再加派。一条管「重叠怎么办」，一条管「最多并行几个」 |
| `:227` async ∥ sync 准入分轴（`async spawns overlapping in-flight/queued files queue until the blocker settles` · `sync spawns conflicting on files error out (no queueing)`） | 派法分轴：async 派单的重叠面交调度器入队等 blocker；sync 派单的文件冲突直接报错、不入队 | 重叠时直接派、不扣住 ∥ 不换落点 | 本条只在 async 默认档上写「let the scheduler queue what overlaps」——该档的排队归调度器；sync 派的冲突面仍按 `:227` 报错、不入队。两档各属一种派法，本条没有把任一种改写成另一种的行为 |
| `:175` pass `files` for scheduler serialization | `files` 是串行化通道 | 重叠时声明 `files` 直接派 | 同一条通道的两面：`:175` 说「传」，本条说「重叠不构成不传的理由」 |
| `:171` `files` 是调度通道、不是简报通道 | 子代理看不见 `files`，文件清单须写进任务文本 | 本条让 `files` 承担排队 | 零冲突：本条只取 `files` 的调度义；简报面仍按 `:171` 写进任务文本 |
| `:189` Cross-task reading dependencies ⇒ serialize / dependsOn | 读依赖：后任务要读前任务的读数 ⇒ 串行 ∥ `dependsOn` | 行号漂移：内容位置问题 ⇒ 文本锚点 ∥ `dependsOn` | 两轴：`:189` 治「读数还不存在」，本条治「行号已经变了」；`dependsOn` 两处同为排序工具，语义同一 |
| `:86` Dispatch truthfully | 状态只许抄工具回执 | `queued` 抄自回执、读作准入 | 同一纪律：本条给的是回执的读法，不是第二种状态来源 |
| `:178-180` 派单尺寸 / 按面拆分 | 派单自身是否合法（≤15 文件 · 一面一单） | 重叠时不扣住、不换落点 | 判据不同：尺寸 ∥ 面不合规 ⇒ 拆单；单本身合规 ⇒ 直接派。本条不豁免拆单 |
| `:188` 工程工具面不进 `files` | `files` 只列内容产物 | 声明 `files` 直接派 | 零冲突：本条的「声明」仍按 `:188` 的口径 |
| §6.38 四停相 ③（用户明示 hold） | 停 = 用户的令 | 本条治的是 agent 自己加的那次等待 | 本条不新增停相：自检命中 ⇒ 不停，直接派；停相仍只有 §6.38 的四条 |
| §6.38 覆盖条（`:14`） | 整批令覆盖批准门，批内全范围已授权 | `:40` 的取值域改按「已确认范围」判 | 同源：整批令下已确认范围 = 该批全范围；`:40` 不再断言批准门之后无授权 |

**行为契约 · 用例表（正常 / 边界 / 错误）**：

| 编号 | 场景 | 输入 / 动作 | 期望 |
|---|---|---|---|
| C1 | 正常 · 有重叠 | 两个 spawn 都声明 `run.mjs` | 两个都直接派；后者回执 `queued` + 位置，读作准入 |
| C2 | 正常 · 无重叠 | 两个 spawn 文件不相交 | 同一轮派出，各自运行 |
| C3 | 边界 · 串行编辑 | 前一任务改过同一文件的更早位置 | 文本锚点落笔 ∥ `dependsOn` 排序；不等待 |
| C4 | 边界 · 需拆单 | 单个派单 >15 文件 ∥ 跨面 | 按 `:178-180` 拆单——拆单不是「因重叠而改落点」 |
| C5 | 错误防御 | 因重叠把设计搬进批档 §2.7 以绕开冻结档 | 判为缺陷：内容落点由设计判据定，不由冲突定（slot 4 16:28 实例） |
| C6 | 错误防御 | 把 `queued` 报成「被挡住 / 要等」 | 判为不实派单汇报（`:86`）：回执原文只有 `queued` + 位置 |
| C7 | 边界 · `:40` 批内默认值 | 整批令下，在飞提问给批内默认值 | 允许：已确认范围含该批全范围 |
| C8 | 边界 · `:40` 出批 | 在飞提问的默认值要扩到批外 | 不允许：出批不在已确认范围（`:41` 硬门：新范围 ⇒ `question` ∥ 停下上报） |

**受影响文件（现行 = 本席 `node` 实读 · 2026-10-20）**：

| 文件 | 现行 | Δ | 说明 |
|---|---|---|---|
| `thincoder-core/prompts/persona-engineering.md` | 243 行 / 63,674 字符 | +1 行 / +1,460 字符（S1 +1,157 · R4 +303） | 改后预计 244 行 / 65,134 字符 ≤ 65,584（63,674 × 1.03） |
| `docs/core/design/PROMPT-SYSTEM.md` | 1,950 行 / 159,704 字符 | 2,096 行 / 171,522 字符（定稿实读；Δ = +146 行 / +11,818 字符） | 本笔 = 设计轮（含评审修正轮 + 设计层记账修正轮）；实施轮零触 |
| `thincoder-core/prompts/discipline-engineering.md` | 201 行 / 37,337 字符 | ±0 | 判断 = 不加行（行为主体 = 父侧派单面，同 §6.34 K6 判据） |
| 调度器实现 / `files` · `dependsOn` 语义 / 需求档 / 普通模式面 | — | ±0 | 边界（见下） |

表注 · 行数口径 = `node` 读全文按 `split("\n")` 切分后 `length − 1`；本档以换行结尾 ⇒ 该式 = 正文行数。

**表注 2 · 坐标位移**：L1 在 `thincoder-core/prompts/persona-engineering.md:229` 之后插入一行 ⇒ 该档 `:230` 起的坐标各下移一位；本档 `:1345`（§6.35）记的盘点读数 `thincoder-core/prompts/persona-engineering.md:236` 随之后移，实施轮在批次档 §5 记一行「`:1345` 的 `:236` 随插入位移，按需复读」，不留常驻锁。

测试覆盖：零单元测试档（纯文本改动、无分支）；机判 = 既有 `scripts/prompt-refs-check.mjs` + 交付门 `doc_check`，不新增断言。

**验收（A1–A9 · 回指 §13.15 两条 · 一次性比对）**：

| # | 验收 | 判法 / 读数 |
|---|---|---|
| A1 | §13.15 ①：三句 + 自检各 1 次 | 提示词面子串各 1 次命中：`A perceived file overlap is a scheduling input` · `` `queued` is a normal admission receipt `` · `Line-number drift is a content problem, not a timing one` · `Pre-dispatch self-check` |
| A2 | §13.15 ②：旧断言清零 + 作用域句在场 | `thincoder-core/prompts/persona-engineering.md:40` 含 `A batch-wide go-ahead puts the batch's whole scope inside that confirmation` 1 次；提示词面 `thincoder-core/prompts/**` 扫 `anything past the approval gate has no approval behind it` ⇒ 0（设计档 F3 ∥ 需求档 ∥ 批次档的引文属分析面，不计） |
| A3 | 携 why、无禁令腔 | 新增文本（S1 全文 + R4 全文）扫 `never\|do not\|don't\|must not\|may not\|forbidden` ⇒ 0；why 子串各 1 次：`stalls the batch on the same conflict` · `the content lands where its criterion does not live` · `turns a same-minute dispatch into a hand-kept wait` · `a wait leaves the shifted line exactly where it was` |
| A4 | 提示词面零文档引用 | `node scripts/prompt-refs-check.mjs` ⇒ 命中 0 |
| A5 | 体量读数（无帽） | 改后字符数 ≤ 65,584；预计 65,134（基线 63,674 + 1,460） |
| A6 | §6.38 对照表 +1 行且含 `:40` | 对照表数据行 10 → 11；新行「既有句」列含 `:40`；A9 计数句为「十一行」，与行数一致 |
| A7 | 触发点可观察 | 本节「触发点」表四行在场；三个观察面 = 派单那一刻 / `queued` 回执 / 串行编辑前 |
| A8 | 台账收口条件 | `#1716`：A2 两条同时成立即达收口条件；`#1717`：本批 §6 结算（实施面 A1 + A5 绿） |
| A9 | 对照结论记入批次档 | 实施轮在 §5 记一行对照结论（§6.39 对照表 = 零矛盾，引 §6.39）；收口轮核其在场（§5 含「对照结论」且引 §6.39） |

**边界（本批不做）**：不改调度器本体 · 不改 `files` / `dependsOn` 语义 · 不改台账 · 不改普通模式 · 不新增机械门 · 不改 FR36 四停相 · 不改冻结档 · `thincoder-core/prompts/**` 本设计轮零笔 · 需求档零笔 · 产品代码零触。

**关键决策**：

| # | 决策 | 理由 |
|---|---|---|
| K1 | S1 落 `:229` 之后新增一行，不改 `:229` 原行 | 原行已 992 字符，且是机制描述；同段追加会把机制与失效模式压进一行，读者只能整体读。新增一行 ⇒ 失效模式可单独点名，原行零改零风险 |
| K2 | `:40` 改成「判据句 + 作用域句」，不删默认值纪律 | 需求给的两条路合成一条：判据句（只从已确认范围取）让规则不依赖批准门字面，作用域句（整批令）与 §6.38 同源。只加作用域而留旧断言，整批令下仍会被读成「过门即无授权」 |
| K3 | 行号漂移一条同列文本锚点与 `dependsOn` | 两个工具治两个面：只有锚点时，读依赖仍可能读到还没落的内容；只有 `dependsOn` 时，前一任务改了更早位置，行号依旧失效 |
| K4 | 自检句置四条之末 | 前三句给判断，自检给出口（「是 ⇒ 声明 `files` 直接派」）；出口放最后，读到时手里有一条可执行动作，而不是又一条判据 |
| K5 | §6.38 只加一行对照 + 一行落点回指（L10）+ A9 计数随动，其余不回改 | 本节改的是 `:40` 的取值域；§6.38 的机制与四停相零变。落点回指行只指向本节 L2、不在 §6.38 落笔；「十行 → 十一行」是 D3 计数随动，不是语义改动 |
| K6 | S1 首句 = 决策点最小动作锚；机制面仍住 `:229` / `:227` | D2：S1 首句（`declare the domain, dispatch, and let the scheduler queue what overlaps`）与 `:227` 的「overlapping domains are queued by the scheduler rather than hand-serialized」同义——保留它，因为决策点读的就是这句出口；按 D-PS41 / D-PS7 先例（本地只加出口边界句 + 最短动作锚），机制描述的唯一权威 = `:229`（submit-and-go）∥ `:227`（async 入队 ∥ sync 报错分轴），S1 不构成第二份活描述 |

**先例 ∥ 偏离**：先例 = 本档 §6.38（逐字英文文本 + 落点表 + 对照表 + 用例表 + 验收）∥ §6.34（就地改 + 前缀法）。
**对齐** = 同一形制；新增文本携 why；小改走「新增一行 + 整行替换」，相邻行零改。
**偏离** = ① 本条同时落到既有 bullet 的紧邻（`:229` 之后）与另一节（`:40`），§6.38 全部落在同一节内；② 本条是「三句 + 自检」的成组落地，不是单条替换——四句互为出口，拆开任一句都留一个失效模式无人对撞。

**勘察证据行**：已读 `thincoder-core/prompts/persona-engineering.md`：`:5-15`（发起权边界 + 整批令）· `:30-42`（在飞提问 · `:40`）· `:155-192`（实施委托结构化 · `:171` / `:175` / `:178-180` / `:188` / `:189`）· `:224-231`（并行派发 · `:229`）· `:238-244`。

本档 §6.38 全文（`:1721-1863`）∥ §6.37（`:1551` 起，形制）。`ENGINEERING-MODE-V2.md` §13.15（`:794-806`）· 本批批次档 §1。

`thincoder-core/prompts/discipline-engineering.md:195-201` 实读：`:201` 已载同一机制的短句（`file conflicts and dependencies are already ordered for you by the scheduler`），并括注 `submit-and-go = main-agent role behavior` ⇒ 该档判 ±0 的理由 = 同机制短句已在，且该档自承派单面属主 agent 行为（本条落人格层 `:229` 邻位，不在纪律层重复成文——D2）。

`scripts/prompt-refs-check.mjs` 实读：域 = `thincoder-core/prompts` + `thincoder-core/tool-docs`（提示词面）∥ `thincoder-core` + `thincoder-cli/src` + `thincoder-vscode/src`（代码面）；J1/J2/J3 三式；本席零参运行读数 = `汇总：提示词面 69 档 · 代码面 463 档 · 命中 0`。
`PROJECT-MANIFEST.json` `index.publicRepos` 实读 = `[]` ⇒ 无跨仓公共源可查——已查，无相关。

全仓扫 `anything past the approval gate`：命中 = 提示词面 `:40`（实施轮改）· 需求档 §13.15（权威处，零改）· 冻结批档 `2026-10-19-goahead-covers-gate`（只读）· 本批批次档 §1。无其它规范面引用旧句。
全仓扫 `thincoder-core/prompts/persona-engineering.md:2[3-9][0-9]`：命中 = 两份批次档（历史记录，不回改）——本条插入点之后的坐标引用不落在规范面。

**上抛项**：无。


### 6.40 需求阶段必须问出来（讨论硬化 · 提示词面显式化 · FR38）

**来源**：需求权威 = `ENGINEERING-MODE-V2.md` §13.16（FR38，三条）；台账 `#1721`；现象与根因 = 本批批次档 §1（会话 `.3` 实读：助手消息 1,910 / 用户消息 230 / `question` 工具 4 次，全在设计成形之后；57 条用户消息以祈使句开头）。

**要修的那一处（实读 · 2026-10-20 本席）**：

| # | 坐标 | 现文 | 缺的那一半 |
|---|---|---|---|
| F1 | `thincoder-core/prompts/discipline-engineering.md:30` | `Requirements — discuss what's wanted until clear, land it in the requirements doc, confirm, then move on.` | 只有动词「discuss」：没写问什么、几类、何时算问过 ⇒ 可以读成「自己读代码读到清楚」 |
| F2 | `thincoder-core/prompts/discipline-engineering.md:37` | `(user confirmed, or answers no longer change the requirements)` | 自判逃生口：一次没问，也能宣布「答案不再改需求」 |
| F3 | `thincoder-core/prompts/common.md:15` | `Ask only when the docs leave it unanswered and the answer would change what you do next` | 成本过滤没有分界：业务意图既不在文档里、也没被认成「改变下一步」⇒ 永不发问 |
| F4 | `thincoder-core/prompts/persona-engineering.md:36-42` ∥ `:54-59` | 在飞提问（给默认值 · 不阻塞 · `Channel boundary`）∥ 推进与叫停 | 与 F1 的「必须问」没有分面：两套规则同场，读者不知道哪条管需求形成、哪条管执行 |

**机制（三条 = 需求三条 + 一条面分界）**：

1. **需求必须问出来**（R1）：新功能 / 新业务规则进入时，设计开始前至少一轮「提问 → 用户回答」，覆盖四类——业务规则 · 边界 · 优先级 · 验收口径。判定「问过了」= 四类里用户能答的都答过，不是问题条数配额。读代码只填事实：事实可以支撑规则，不能代替用户把规则说出来。
2. **需求完成 = 用户明确确认**（R2）：原话或点选；agent 自判「够清楚了」不算确认。未确认 ⇒ 本步产出是待确认问题清单，不是设计。自判逃生口删除。
3. **`thincoder-core/prompts/common.md` 分界**（R3）：文档能答的是事实；意图 / 规则 / 取舍是用户的话，必须问。这不是给成本过滤开豁免口，而是指出这一类永远落在「文档答不了」且「答案决定做什么」那一侧 ⇒ 过滤本身放行。用户说过一次即事实，不重问。
4. **面分界**（R3 末句）：三条只作用于需求形成期；执行面的在飞提问（不阻塞 · 默认值 · 四停相）零改，默认值仍只从已确认范围取（`persona:40`）。

**逐字英文文本（实施席照此落笔 · 唯一权威目标形）**：

R1 — `thincoder-core/prompts/discipline-engineering.md:35` 与 `:37` 之间插入一段（前后各一空行 · 三空格缩进 · **不用 bullet**：五要素列表仍是五条，D3 计数不被牵动）：

```text
   **Requirements get asked out of the user before design starts**: a new feature or a new business rule opens the step with at least one round of questions to the user and answers back, covering the four kinds the user can answer: **business rules · boundaries · priorities · acceptance criteria**. 

  The round is done when every one of the four the user has an answer for has been asked, not when a question count is met — a list of questions nobody asked is not a discussion, and a fixed quota keeps asking past the point where answers stop adding anything. Reading the code fills in facts; a fact 

  can support a rule and cannot stand in for the user stating it.
```

R2 — `thincoder-core/prompts/discipline-engineering.md:37` 整行替换：

```text
   Requirements done-criterion: all five elements present, concrete enough to design from, and **the user's explicit confirmation of the requirement set** — the user's own words or a click on the proposed set; an agent's own reading of "clear enough" does not confirm it. Until that confirmation the 

  step's output is the open-questions list, not a design. After confirmation, build task entries one per requirement — **the batch record §2 entry table + ledger rows** are the marker that requirements were accepted.
```

R3 — `thincoder-core/prompts/common.md:16` 之后新增一行（`**Why**: …` 行之后；`:15` 的成本过滤句与它的 `**Why**` 保持相邻）：

```text
**A doc answers facts; intent gets asked**: what the docs can settle is a **fact** — what exists, what the code does, what was ruled before. **Intent · rules · trade-offs** are the user's to state and must be asked: no document holds them, and a rule nobody asked for is a rule the user has not 

  given, so the work built on it gets redone. Once the user has stated one, it is a fact like any other — asking again spends the attention the first look was meant to save. **The line holds while the requirement is being formed**; once work is under way, the in-flight ask still steers with a 

  workable default drawn from what the user already confirmed.
```

**落点表（实施席逐处执行）**：

| # | 坐标 | 现文 → 新文 | 动作 |
|---|---|---|---|
| L1 | `thincoder-core/prompts/discipline-engineering.md` `:35` 后 / `:37` 前 | 插入逐字块 R1（三空格缩进段落；前后各一空行） | 插入（+2 行 / +662 字符 + 2 换行） |
| L2 | `thincoder-core/prompts/discipline-engineering.md:37` | 整行 → 逐字块 R2 | 替换（±0 行 / +202 字符） |
| L3 | `thincoder-core/prompts/common.md:16` 之后（成本过滤句的 `**Why**` 行之后） | 新增逐字块 R3 一行；`:15` 与 `:16` 的 `**Why**` 保持相邻、不拆 | 插入（+1 行 / +647 字符 + 1 换行） |
| L4 | `thincoder-core/prompts/persona-engineering.md:36-42` · `:40` · `:41` · `:54-59` | 零改（对照见下表） | — |
| L5 | `thincoder-core/prompts/discipline-engineering.md:30` · `:31-35` · `:38` · `:50-58` | 零改 | — |
| L6 | `thincoder-core/tool-docs/**` · 产品代码 · 需求档 · 批次档六段结构 | 零改 | — |
| L7 | 本档 §6.36 L3 的条文本锚（`:1464-1465`） | §6.36 登记的锚 = 前段 + 后段逐字；前段（`(user confirmed, or answers no longer change the requirements)`）由 R2 删除 ⇒ 锚退役、只剩尾句 `are the marker that requirements were accepted.`；§6.36 A1 的位置判据本就以该尾句为界，落地后按 A8 复跑；`:37` 坐标在 L1 后下移两行（表注 2） | 回指（本节不落笔；前段引文不再作为定位依据） |

**对照表 · 与既有提示词条款逐句对照（结论 = 零矛盾）**：

| 既有句 | 它管什么 | 本条管什么 | 为何不矛盾 |
|---|---|---|---|
| `discipline:30` `discuss what's wanted until clear … confirm, then move on` | 需求步的顺序：讨论 → 落档 → 确认 → 前进 | 讨论怎么进行、什么时候算问过 | 同向：`:30` 要「讨论到清楚」，本条把「清楚」的操作形写出来；顺序与落点不变 |
| `discipline:31-35` 五要素 | 需求档的组织形态：五个要素 | 需求形成过程：问哪四类 | 对象不同（文档形态 vs 讨论过程）；R1 用段落不用 bullet，列表仍是五条 |
| `discipline:38` `A decision lands in the round it is made` | 落盘时机：决定做出当轮写盘 | 放行条件：用户确认才进设计 | 两件事：`:38` 管「写不写、什么时候写」，R2 管「能不能进下一步」。未确认期间决定照写，设计不开 |
| `discipline:50-58` 轻通道 | 细节 / 缺陷 / 现场问题的旁路 | 新功能 / 新业务规则必须走全链并先问 | 轻通道准入面零改；`:58` 一句边界已写「新机制 ∥ 大改 ⇒ 全链」，本条四类问题落在全链那一侧 |
| `common:14` 先查档 | 问之前先查文档 | 分界：哪一类问题文档答不了 | `:14` 保留原样；R3 补的是「文档答不了的那一类是什么」 |
| `common:15` 成本过滤 | 只问「答了会改变下一步」的问题 | 意图 / 规则 / 取舍永远落在过滤放行侧 | 不是豁免：R3 说明该类「文档答不了」（条件一成立）且「答案决定做什么」（条件二成立）⇒ 过滤本身放行。过滤面零改 |
| `common:16-20` why ∥ 两边都适用 ∥ checked-evidence line | 过滤的理由与提交形态 | 分界只在「哪些问题属于用户的话」 | 零改：父代理 ∥ 子代理的 checked-evidence line 照旧要带 |
| `common` 上行通道节 `Ask only when both hold` | 子代理 → 父代理的提问过滤 | 主会话向用户问意图 | 适用对象不同；子代理问意图仍满足该节两条件（材料里没有、答案改变做法） |
| `persona:36-39` 在飞提问（给默认值 · 不阻塞） | 执行期：长任务中途用默认值前进 | 需求形成期：无默认值可代规则，必须问到答案 | R3 末句显式分面：形成期问、执行期默认值推进；`:37` 的触发条件（mid-run + 有工作默认值）在形成期不成立 |
| `persona:40` `Defaults stay in bounds` | 默认值只能从已确认范围取 | 形成期的答案 = 新的已确认范围 | 同源：先问出来、用户答了，默认值才有取值域；未确认就没有默认可给 |
| `persona:41` `Channel boundary`（硬门用 `question` ∥ 停下上报） | 硬问题走阻塞通道 | 需求四类问题属硬门 | 同向：规则 / 边界 / 验收口径正是该句的「a ruling on a criterion」，通道指引不变 |
| `persona:42` `Discipline`（一问一答 · 重问已授权范围耗注意力 · 默认值领先） | 执行期在飞提问的提问纪律 | 需求形成期「已陈述即事实、不重问」的注意力理由 | 同一理由（重问耗用户注意力）两层各一条关键锚点：`persona:42` 管已授权范围，R3 管已陈述事实；common 层读者含两模式 + 全部子代理，persona 层读者只有工程侧 ⇒ 各层须独立可读（D-PS41），两处保留，D2 不判违规 |
| `persona:54-59` 推进与叫停 ∥ `:8` 发起权 | 谁发起、何时停 | 需求没确认就不进设计 | 同向：本条把「进设计」的前置写明；发起权仍在用户 |
| `persona:14` 四停相（§6.38） | 已跑的批为什么停 | 需求未确认不进设计 | 两轴：四停相管「跑起来的批」，R2 管「还没放行的需求」 |

**对照表 · 与既有设计节（§6.34 ∥ §6.38 ∥ §6.39）**：

| 节 | 它管什么 | 与本节的关系 |
|---|---|---|
| §6.34 批准即实施启动（FR32） | 评审通过后的批准 = 实施启动 | 本节在更前一步：需求确认在设计开始之前；批准门语义零改，两门各自独立 |
| §6.38 整批令覆盖批准门（FR36） | 批内全链自动跑完 | 整批令覆盖评审 / 实施 / 收口那一侧；需求形成期的提问发生在批点火前，不因整批令被跳过——令的对象是该批范围，范围本身由需求确认定下 |
| §6.39 派单纪律补硬（FR37） | 派单与 §2 任务书面 | 本节无派单面；§2 仍要写（本批 §2 = 本节的设计任务书） |

**行为契约 · 用例表（正常 / 边界 / 错误）**：

| 编号 | 场景 | 输入 / 动作 | 期望 |
|---|---|---|---|
| C1 | 正常 · 新功能进入 | 用户提出新功能 | 设计开始前至少一轮问四类；用户答后落需求档，原话确认 ⇒ 进设计 |
| C2 | 正常 · 用户点选 | 呈「需求清单 + 待确认问题」，用户点选确认 | 视为明确确认（点选 = 原话等价） |
| C3 | 边界 · 某类用户答不了 | 用户说「优先级你们定」 | 该类记为「用户已授权自定」并写明依据，其余类照问、不因此跳过整轮；「记为授权自定」= 对 R1 的解读（「你们定」就是用户对该类给出的答案），不是 R1 之外的独立要求；依据按 `:38` 当轮落盘 |
| C4 | 边界 · 文档已答事实 | 代码 / 需求档已有的事实 | 直接查，不占提问名额（R3：事实走文档侧） |
| C5 | 错误防御 · 自判放行 | agent 认为「够清楚了」直接进设计 | 判为违规：本步产出应为待确认问题清单；判据 = 用户明确确认 |
| C6 | 错误防御 · 问过但没记 | 用户答了，需求档未更新 | 按 `:38` 当轮落盘，再请用户确认清单 |
| C7 | 错误防御 · 借轻通道跳过 | 新业务规则被当成 detail 走轻通道 | 按 `:58` 一句边界判回全链；轻通道准入面零改 |
| C8 | 边界 · 执行期冒出新问题 | 实施中途出现一条规则问题 | 走 `persona:36-42` 在飞提问 ∥ 硬门；本节只界定形成期，不改执行期通道 |

**受影响文件（现行 = 本席 `node` 实读 · 2026-10-20）**：

| 文件 | 现行 | Δ | 说明 |
|---|---|---|---|
| `thincoder-core/prompts/discipline-engineering.md` | 201 行 / 37,337 字符 | +2 行 / +866 字符 | L1 + L2；改后 203 行 / 38,203 字符 |
| `thincoder-core/prompts/common.md` | 273 行 / 43,080 字符 | +1 行 / +648 字符 | L3；改后 274 行 / 43,728 字符 |
| `thincoder-core/prompts/persona-engineering.md` | 244 行 / 65,134 字符 | ±0 | L4 = 零改 |
| 三档合计 | 718 行 / 145,551 字符 | +3 行 / +1,514 字符 | 改后 147,065（+1.04%）——合计 = 附带读数；体量判据 = A6 逐档上限 |
| `docs/core/design/PROMPT-SYSTEM.md` | 2,096 行 / 171,522 字符（本节写入前实读） | 本节新增 | 本笔 = 设计轮；实施轮只落 L1–L3 |
| `thincoder-core/tool-docs/**` / 产品代码 / 需求档 / 批次档六段结构 | — | ±0 | 边界（见下） |

表注 · 行数口径 = `node` 读全文按 `split("\n")` 切分后 `length − 1`；字符数 = `length`（含换行符）。R1 / R3 各携带新换行，已计入 Δ。
表注 2 · 坐标位移：L1 在 `:35` 与 `:37` 之间插入两行 ⇒ `thincoder-core/prompts/discipline-engineering.md` 的 `:37` 起各下移两位（R2 的落笔位以 R2 前的收束段原文为锚，不按行号）；

  本档其它节对 `thincoder-core/prompts/discipline-engineering.md:37` 的坐标引用随之后移，实施轮在批次档 §5 记一行「`:37` 随 R1 插入位移两行，按需复读」，不留常驻锁。L3 在 `thincoder-core/prompts/common.md:16` 之后插入一行 ⇒ 该档 `:17` 起各下移一位（`:14`–`:16` 不动）；表内 `common:16-20` 等坐标 = 落地前读数。

测试覆盖：零单元测试档（纯文本改动、无分支）；机判 = 既有 `scripts/prompt-refs-check.mjs` + 交付门 `doc_check`，不新增常驻断言。

**验收（A1–A9 · 回指 §13.16 四条验收 · 一次性比对）**：

| # | 验收 | 判法 / 读数 |
|---|---|---|
| A1 | §13.16 ①：机制句在场（一轮 + 四类 + 读码只填事实） | `thincoder-core/prompts/discipline-engineering.md` 内 `at least one round of questions to the user and answers back` · `business rules · boundaries · priorities · acceptance criteria` · `cannot stand in for the user stating it` 各 1 次 |
| A2 | §13.16 ②：判据 = 用户明确确认 + 逃生口清零 | `the user's explicit confirmation of the requirement set` · `the open-questions list, not a design` 各 1 次；提示词面 `thincoder-core/prompts/**` 扫 `answers no longer change the requirements` ⇒ 0（本档 F2 引文、需求档 §13.16、批次档 §1 属分析面，不计——同 §6.38 A2 判据域） |
| A3 | §13.16 ③：`thincoder-core/prompts/common.md` 分界句在场 | `thincoder-core/prompts/common.md` 内 `A doc answers facts; intent gets asked` · `are the user's to state and must be asked` 各 1 次 |
| A4 | 面分界句在场（需求面 vs 执行面） | `thincoder-core/prompts/common.md` 内 `The line holds while the requirement is being formed` · `the in-flight ask still steers with a workable default` 各 1 次 |
| A5 | 携 why、无禁令腔 | 新增文本（R1 + R2 + R3）扫 `never\|do not\|don't\|must not\|may not\|forbidden` ⇒ 0（本席预扫 = 0）；why 子句各 1 次：`a fact can support a rule`（R1）· `the work built on it gets redone`（R3） |
| A6 | §13.16 ③：提示词面零文档引用 · 逐档体量读数（无帽）（D-PS42 ③） | `node scripts/prompt-refs-check.mjs` ⇒ 命中 0；逐档判：`thincoder-core/prompts/discipline-engineering.md` 预计 38,203· `thincoder-core/prompts/common.md` 预计 43,728· `thincoder-core/prompts/persona-engineering.md` ±0（65,134）；三档合计 147,065 ≤ 149,917 只作附带读数 |
| A7 | 同档自洽（五要素计数 · 相邻句零改 · 按引文判） | `:30` / `:31-35` / `:38` / `thincoder-core/prompts/common.md:14` = 改前坐标、只作读数；按引文判：`thincoder-core/prompts/discipline-engineering.md` 内 `discuss what's wanted until clear, land it in the requirements doc, confirm, then move on` · `organized by **five elements**` · `A decision lands in the round it is made` 各 1 次、五要素子 bullet 仍 5 条（`:31-35`；步骤 1 另有一条既有决策子 bullet，不计入）；`thincoder-core/prompts/common.md` 内 `Before you ask anything, look for the answer in the docs` 1 次 |
| A8 | §6.36 位置判据复跑（条文本锚已退役，只剩尾句界） | `thincoder-core/prompts/discipline-engineering.md` 内 `are the marker that requirements were accepted.` 1 次，且 `A decision lands in the round it is made` 所在行在其后、`2. **Design**` 行亦在其后（§6.36 A1 位置判据重跑绿；前段引文不参与判定——见 L7） |
| A9 | 对照结论记入批次档 | 实施轮在 §5 记一行对照结论（§6.40 对照表 = 零矛盾，引 §6.40）；收口轮核其在场 |

**边界（本批不做）**：不改 `question` 工具语义 · 不改 persona 的在飞提问 / 默认值 / 四停相 / 发起权 · 不改评审 ∥ 实施面 · 不改数据前提面（`#1722` 另议）· 普通侧专属档零改（`thincoder-core/prompts/discipline-normal.md` / `thincoder-core/prompts/persona-normal.md`），公共层句经 `thincoder-core/prompts/common.md` 照达普通侧（R3 落点即公共层；

  同 §6.14 限定形）· 不新增机械门 · `thincoder-core/prompts/**` 本设计轮零笔 · 需求档零笔 · 产品代码零触。

**关键决策**：

| # | 决策 | 理由 |
|---|---|---|
| K1 | R1 用段落（非 bullet），落在五要素列表与收束段之间 | 五要素是需求档的组织形态，R1 是讨论过程；加成第 6 个 bullet 会让「five elements」与列表条数对不上（D3）。段落形态保持列表五条，读序 = 要素 → 怎么问 → 何时算完 |
| K2 | R2 整行替换、删除逃生口，不保留旧措辞 | 旧句与新判据方向相反（自判 ↔ 用户明说）；同行并存 = 读者二选一，规范面按 D8 删除 |
| K3 | 判定「问过了」= 四类覆盖面，不设问题条数 | 需求给的判据就是「四类里能答的都答过」；固定配额会在某一类问满就收工，其余类永远不问 |
| K4 | R3 不写「成本过滤不适用」，写「这一类永远落在过滤放行侧」 | 直接豁免会与 `common:15` 的 `Ask only when…` 字面冲突，读者得二选一；按条件归类的写法两句话都成立（文档答不了 + 答案决定做什么），过滤本体零改 |
| K5 | 面分界句落 `thincoder-core/prompts/common.md`（R3 末句），不落 persona | 界要在读者同时看到两条规则时存在；common 恒第二位注入 = 全角色两模式共读。persona 的在飞提问节读者只有主 agent，界写在需求面才两侧都读到 |
| K6 | `thincoder-core/prompts/persona-engineering.md` 零改 | 执行面规则由需求点名「不改」；R3 末句已把分界给到读者，persona 再加一句 = D2 第二份活描述。`:42` 既有句与 R3 的注意力子句 = 关键锚点重复，处置见对照表 `persona:42` 行（声明保留，不新增句） |

**先例 ∥ 偏离**：先例 = 本档 §6.38（逐字英文文本 + 落点表 + 对照表 + 用例表 + 验收）∥ §6.39（插入行 + 整行替换、相邻行零改）。
**对齐** = 同一形制；新增文本携 why；落点 = 既有节内增行 ∥ 整行替换；机判沿用既有脚本与交付门。

**偏离** = ① 本节一次跨两档（`thincoder-core/prompts/discipline-engineering.md` + `thincoder-core/prompts/common.md`），§6.38 全落单档；② 新增一段面分界（R3 末句）——需求面与执行面此前没有共读句，两条规则各自成立却会互相压。

③ R1 的落点位移——需求把机制句的落点写成 `thincoder-core/prompts/discipline-engineering.md:30`，本节落 `:35` 与 `:37` 之间；理由 = K1 的读序（要素 → 怎么问 → 何时算完）：`:30` 是步骤 1 的编号行，插在其后会把领起行与五条子 bullet 拆开，且 `:30` 自身逐字零改；A1 是子串判，两个落点都过，位移在此声明。

**勘察证据行**：已读 `thincoder-core/prompts/discipline-engineering.md:28-45`（基本流程 · 五要素 · `:37` 判据 ∥ `:38` 决策落盘）∥ `:50-58`（轻通道 · 一句边界）。

已读 `thincoder-core/prompts/common.md:13-20`（Check the docs before you ask 全段）∥ `:68-96`（上行通道 · `Ask only when both hold`）· `thincoder-core/prompts/persona-engineering.md:5-15`（发起权边界 + 整批令）∥ `:35-42`（在飞提问 · `:40` 默认值 · `:41` 通道界）∥ `:54-59`（推进与叫停）；

本档 §6.34（`:1208` 起）∥ §6.36（`:1409` 起，其 L3 锚引 `thincoder-core/prompts/discipline-engineering.md:37`）∥ §6.38 ∥ §6.39（形制）· 需求档 §13.16（`:809-822`）· 本批批次档 §1。

`node scripts/prompt-refs-check.mjs` 零参运行读数 = `汇总：提示词面 69 档 · 代码面 463 档 · 命中 0`；`PROJECT-MANIFEST.json` `index.publicRepos` 实读 = `[]` ⇒ 工作目录内无独立公共源文档仓——已查，无相关。

全仓扫 `answers no longer change the requirements`：命中 = 提示词面 `thincoder-core/prompts/discipline-engineering.md:37`（实施轮 L2 删除）· 本档 `:1464`（§6.36 块 C 定位说明引旧收束段原文——分析面，保留）· 需求档 §13.16（权威处，零改）· 本批批次档 §1 · `.thincoder/tmp` 两份基线副本（非提示词面）。

提示词面 `thincoder-core/prompts/**` 扫三条目标子串（`at least one round of questions to the user` · `the user's explicit confirmation of the requirement set` · `A doc answers facts`）：各 0（本节写入前）。

**UI / 交互决策**：无界面面——本条只改模型可见提示词文本。

**上抛项**：无。

### 6.41 落地前先答三问：现成的名字 ∥ 组件 ∥ 端点（重造轮子防御 · 提示词面显式化 · FR39）

**来源**：需求权威 = `ENGINEERING-MODE-V2.md` §13.17（FR39，六条，`:826-843`）；台账 `#1724`；结构诊断五行 = 本批批次档 §1（`:17-21`）。三次实例（JSON 行内展开 ∥ 筛选控件 ∥ 自造名「案字段」「正文」）全走轻通道、**不过设计档** ⇒ 规则必须挂到「笔」上（需求第 4 条），只加「设计前」对三例全部无效。

**要修的那一处（实读 · 2026-10-21 本席）**：

| # | 坐标 | 现文 | 缺的那一半 |
|---|---|---|---|
| F1 | `thincoder-core/prompts/discipline-engineering.md:42` | `Closest-precedent survey … survey how **similar / same-kind features currently do it** … an intended deviation ⇒ an **explicit rationale**` | 「相似」即可交差：勘察可做、名字不必答出；「偏离 + 理由」是合法通道（F-W23 偏离理由逐字「F-W23 ①/② 逐字指定」） |
| F2 | `thincoder-core/prompts/persona-engineering.md:107-111` | 轻通道三例 + 两种披露句式 | 笔前无「现成件」问题；三例全是小改 ⇒ 设计前规则对它们无效 |
| F3 | `thincoder-core/prompts/advisor-design.md:23` | 第 9 条 Closest-precedent check：查「先例行在场 + 偏离理由显式」 | 只查「有没有写」，不查「现成件为什么没用」——存在门缺席 |
| F4 | `thincoder-core/prompts/discipline-engineering.md:116-117` | `Naming discipline`（名字要携定义）· `One word per thing`（一名一物：`doc word = UI word = conversation word, 1:1`） | UI 标签 / 字段名 / 按钮文字没有挂靠面：`:117` 已把 UI word 纳入一对一，却没有「先挂靠产品已载概念」的动作 |
| F5 | 全部门 | 需求 ↔ 设计 ↔ 实现 ↔ 测试逐层自洽 | 无一道问「是不是已经存在」（批次档 §1 行 1；F-W23 五道门零拦截） |
| F6 | `thincoder-core/prompts/persona-engineering.md:104` | 收口清账条：收口扫台账、每条给处置 | 收口不读该轮 §1 的笔行——答案行缺了没有地方现形 |

坐标注：需求 §13.17 与派单书引 `thincoder-core/prompts/discipline-engineering.md:40`；现盘实读 = `:42`——FR38 的 R1 在 `:35` 后插入两行所致（§6.40 L1 已预告位移）。本条按现盘坐标落笔，`:40` 作历史引文不参与定位。

**机制（七件 = 需求六条 + 验收 ② 的读者面）**：

1. **三问前置**（F1 · 需求 ①）：任何新落点（新名字 ∥ 新组件 ∥ 新端点 ∥ 新标签文字）动手前答——**哪里有**（代码坐标 ∥ 文档节）· **叫什么**（现成名字，逐字）· **谁在用**（调用方 ∥ 消费方 ∥ 先例批次）。答得上 ⇒ **用现成的**（名字照抄 ∥ 组件复用 ∥ 端点直连）；答不上 ⇒ 写 `none found: <查过哪些面>`。
2. **答案落盘 · 三形**（需求 ②）：三形定死、落点定死——`existing: <坐标> · name: "<逐字>" · consumers: <谁>`（现成件在且可用）· `none found: <查过哪些面>`（查无）· `existing but unusable: <坐标> · name: "<逐字>" · failed on: <能力 ∥ 契约面的逐字失败>`（现成件在、找着了、不用，必须说清哪一面失败）。落点：设计档新机制节**每条落点一行**；批次档 §1 **每笔一行**（轻通道 / 直改也写）。中文记录面两字面：`已查无：` ∥ `现成不可用：`。
3. **偏离收窄**（需求 ⑤ · F1 同句）：偏离仅在现成件**不可复用**时成立；理由须指名**能力 / 契约面的具体失败**；形态不同 / 更顺手 / 更好看 = 口味，不是理由。
4. **笔前也答**（需求 ④ · F2）：轻通道 / 直改同样先答三问，答案进批档 §1 该笔行；轻通道准入本体零改。
5. **评审存在性判据**（需求 ⑥ · F3）：新名字 / 组件 / 端点存在且设计未用、未说明为何不可用 ⇒ **🔴**；缺答案行本身仍 **🟡**（现状 = 缺先例行）。落点 = `thincoder-core/prompts/advisor-design.md` 新增第 11 条（判据 = K1）；**作用域 = 设计所依据的需求集要求该答案行时**——普通模式的需求集无此要求 ⇒ 第 11 条不判（二择一理由见 K10）。
6. **新名挂靠**（需求 ③ · F4）：UI 标签 / 字段名 / 按钮文字 = 产品**已载概念**的直译，文档写明对应；无对应 ⇒ 登记新名 + 说明取代谁 ∥ 扩展谁。落点 = `thincoder-core/prompts/discipline-engineering.md:117` 同一 bullet 的续句（一名一物的执行形；K8）。
7. **收口抽读**（验收 ② 的读者面 · F6）：父侧收口轮读该轮 §1 的笔行——**抽样 ≥2 行，不足 2 行全查**——逐行判三形在场。落点 = `thincoder-core/prompts/persona-engineering.md:104` 之后的新 bullet（B2b）：「父侧收口轮」是运行期动作，规则只住中文设计档 = 运行时不触发（同本条对三次实例的诊断）。

**唯一机检项 = 答案行在场性（判据形 · 非机械门）**（需求验收 ②）：

- **谁在何时读**：① 设计评审（第 11 条）读设计档的每条落点行——**仅当设计所依据的需求集要求该行时**；② 父侧收口轮读批档 §1 的笔行——**抽样 ≥2 行，不足 2 行全查**（落点 = B2b，`thincoder-core/prompts/persona-engineering.md:104` 后）。
- **怎么判**：行内三形之一（`existing:` ∥ `none found:` ∥ `existing but unusable:`；中文记录面 `已查无：` ∥ `现成不可用：`）⇒ 已答；**缺行 = 「没查」**，不得读成「查无」。
- **不做**：不新增脚本、不进 CI、不加批次档机判门；`scripts/prompt-refs-check.mjs` 与交付门 `doc_check` 照旧。

**逐字英文文本（实施席照此落笔 · 唯一权威目标形）**：

B1 — `thincoder-core/prompts/discipline-engineering.md:42` 整行替换：

```text
   - **Closest-precedent survey = three questions before any new landing** (any landing: design or direct pen): before any new name ∥ component ∥ endpoint ∥ label text, answer and write down — **where does this function live now** (a code coordinate ∥ a doc section) · **what is it called** (the 
  existing name, verbatim) · **who uses it** (callers ∥ consumers). Three shapes: `existing: <coordinate> · name: "<verbatim>" · consumers: <who>` ⇒ **use the existing piece** (name copied verbatim, component reused, endpoint connected); `none found: <which surfaces were checked>` — only a checked 

  absence earns a new build; a missing line = "not checked", not "checked, none found"; `existing but unusable: <coordinate> · name: "<verbatim>" · failed on: <the capability ∥ contract failure>`. In a design doc: one line per new landing in the new-mechanism section; a direct pen: one line in batch 

  record §1 beside that pen. Survey how **similar / same-kind features currently do it** (implementation coordinates ∥ design sections ∥ precedent batches) — **align first** (the existing shape: component ∥ layout ∥ criteria ∥ wording); a deviation needs the existing piece **not reusable**, and its 

  rationale names the **concrete failure on the capability ∥ contract face** — a different shape, a smoother fit or a nicer look is taste, not a rationale; **diverging for its own sake = a violation**.
```

B2 — 移到轻通道段末：`Closeout-chain segment map` 行之后 / `- **Round field**` 之前（现盘 `:123` 之前）新增顶层段落（无缩进 · 前后各一空行）；原 `:113` 处的缩进段落连同其前一行空行删去：

```text
**A pen answers the three questions before it moves** — where the function lives now (a coordinate ∥ a doc section) · what it is called (the existing name, verbatim) · who uses it — and the answer joins the pen's §1 entry in one of three shapes: `existing: <coordinate> · name: "<verbatim>" · 

  consumers: <who>` (then reused) · `none found: <surfaces checked>` · `existing but unusable: <coordinate> · name: "<verbatim>" · failed on: <the capability ∥ contract failure>`. An answer on hand ⇒ the pen reuses the existing piece; a deviation names the concrete capability ∥ contract failure that 

  left it unusable — a different shape, a smoother fit or a nicer look is taste, not a reason. A full-chain pen writes the same line in its design doc's new-mechanism section, one per landing.
```

B2b — `thincoder-core/prompts/persona-engineering.md:104` 之后新增 bullet（空行分隔 · 与 104 同形）：

```text
- **Closeout samples the pen lines**: at each batch closeout, read at least two of the round's §1 pen lines — fewer than two ⇒ read them all — and check each carries a three-question answer (`existing:` ∥ `none found:` ∥ `existing but unusable:`, the Chinese record face `已查无：` ∥ `现成不可用：`); a missing 
  line reads as "not checked", not as "checked, none found" — this sample is where that absence surfaces.
```

B3 — `thincoder-core/prompts/advisor-design.md:24` 之后新增第 11 条（与 2–10 条同形：条目间无空行）：

```text
11. **Existing-piece check** — where the requirement set requires it: each new name ∥ component ∥ endpoint ∥ label text carries a three-question answer (where it lives · name, verbatim · who) in one of: `existing: …` · `none found: …` · `existing but unusable: …`. **An existing piece left unused 
  with no reason it is unusable ⇒ 🔴**; a missing line stays 🟡.
```

B4 — `thincoder-core/prompts/discipline-engineering.md:117` 整行替换（保留原句，尾部接续句）：

```text
- **One word per thing**: one thing keeps one name across every surface — doc word = UI word = conversation word, 1:1; a second name for the same thing is a defect. **A new name anchors to a concept the product already carries**: a UI label ∥ field name ∥ button text is that concept's direct 
  translation, and the doc writes the mapping down; with no counterpart, the new name is registered together with what it replaces ∥ extends.
```

**落点表（实施席逐处执行）**：

| # | 坐标 | 动作 |
|---|---|---|
| L1 | `thincoder-core/prompts/discipline-engineering.md:42` | 整行 → B1（替换 · ±0 行） |
| L2 | `thincoder-core/prompts/persona-engineering.md`：`Closeout-chain segment map` 行之后 / `- **Round field**` 之前 | 插入 B2（顶层段落 · 无缩进 · 空行 + 段落 + 空行）；旧址（原 `:113` 段落**连同前后空行整块删去**，恢复 HEAD 原形）⇒ 净行数不变（248 行） |
| L2b | `thincoder-core/prompts/persona-engineering.md:104` 之后 / `:105` 之前 | 插入 B2b（bullet · 同行列表续条 · +1 行 / +405 字符） |
| L3 | `thincoder-core/prompts/advisor-design.md:24` 之后 / `:25` 空行之前 | 插入 B3 一行（第 11 条 · 与 2–10 条同形：条目间无空行 · +1 行 / +360 字符） |
| L4 | `thincoder-core/prompts/discipline-engineering.md:117` | 整行 → B4（替换 · ±0 行） |
| L5 | `thincoder-core/prompts/persona-eng-designer.md` · 轻通道准入三例 · `thincoder-core/prompts/discipline-engineering.md:37/:39` · `thincoder-core/prompts/common.md`（全档零笔）· 需求档 · 产品代码 · 批次档六段结构 | 零改 |
| L6 | 本档 §6.26「计数连带」行（`:644`） | 设计评审标准条目数 `10` → `11`（本条设计轮笔 · 见 A5） |

同档两处插入（L2 ∥ L2b · 同属 `thincoder-core/prompts/persona-engineering.md`）按**内容锚**落位，行号只是当前读数：L2b 落 `- **Implementation-round role routing` 之前，L2 落 `**Start-up booking**` 之前。

**对照表 · 与既有提示词条款逐句对照（结论 = 零矛盾）**：

| 既有句 | 它管什么 | 本条管什么 | 为何不矛盾 |
|---|---|---|---|
| `discipline:42` 先例勘察句 | 设计前勘察相似先例、先对齐；偏离须理由 | 勘察的执行形：三问答出名字、答案落盘、偏离收窄 | 同向：原句保留（并入 B1 同一行），三问是其执行形；「保留 + 执行形」= 需求验收 ③ 的字面要求 |
| `discipline:30` 需求步（过程步名） | 四步顺序与步骤入口 | 设计步内部的前置动作 | 两轴：`:30` 管何时进设计，本节管进设计后第一笔怎么做 |
| `discipline:37` FR38 需求必须问出来 | 需求形成期问用户 | 设计 / 落笔前查现成件 | 相邻两门：问用户（意图）与查代码（事实）各一侧；`common:17` 已写「文档答事实、意图问用户」——本条走文档 / 代码一侧 |
| `discipline:50-58` 轻通道节 | 三例旁路全链 | 旁路的笔前前置（答三问 · 写 §1） | 准入三例与边界零改；只加「笔前先答」，不缩也不放准入 |
| `persona:107-111` 轻通道披露句式 | 父侧逐笔披露（轻 ∥ 全链） | 披露行里多一段答案行（B2 落轻通道段之后、`Closeout-chain segment map` 行后 / `- **Round field**` 行前——顶层段落，零缩进） | 披露形不变；答案行加入 §1 笔行 = 披露面的内容扩充；B2 不回插披露列表内部 ⇒ 轻通道列表项与「The disclosure carries…」的指代关系零动 |
| `persona:104` 收口清账条 | 收口扫台账，每条给处置 | 收口抽读该轮 §1 笔行（B2b） | 同轮同拍、两个读面：一处扫台账，一处扫笔行；清账判据零改 |
| `persona:120` 派单公共源坐标句 | 派单时给公共源坐标；没有 ⇒ 明写「已查无」 | 落笔时给现成件答案；查无 ⇒ `none found:` | **同形不同题**：一个是派单给方向（公共源坐标，主 agent → 设计席），一个是落笔交答案（现成件，笔 → 评审 / 收口）；两形各定死在各自面，「缺行 = 没查」的判法同源 |
| `persona:54-59` 推进与叫停 | 谁发起、何时停 | 笔前答三问 | 两轴：本节不动发起权 / 叫停判据 |
| `discipline:116` 命名纪律 | 名字要携定义（可读性） | 新名字先挂靠产品已载概念 | 两轴同节：`:116` 管「名字怎么起」，B4 管「起之前挂靠谁」 |
| `discipline:117` 一名一物 | 一物一名；`doc word = UI word = conversation word, 1:1` | 是它的执行形：先挂靠、无对应须登记 | 同条续句：`:117` 给判据，续句给动作；一条两处写同一机制即两份活描述（D2），故并入同条、复用该条既有 why |
| `advisor-design:23` 第 9 条先例行 | 查先例行在场 + 偏离理由显式 | 第 11 条查「现成件为什么没用」 | 两条相邻不同问：第 9 条查「写了没」，第 11 条查「用了没」；第 11 条另限作用域 = 需求集要求该行时（K10），第 9 条无此限 |
| `advisor-design:24` 第 10 条勘察证据行 | 查公共源勘察证据 | 第 11 条存在性 | 同族相邻（10 = 查过公共源、11 = 查过现成件），条目数 10 → 11 |
| `common:19` checked-evidence line | 提问时带查过什么 | 落笔时带三问答案 | 同形不同场：一个在提问里，一个在设计档 / §1 里 |

**用例表（正常 / 边界 / 错误）**：

| 编号 | 场景 | 输入 / 动作 | 期望 |
|---|---|---|---|
| C1 | 正常 · 现成件在 | 设计要一个「筛选控件」 | 三问答上 ⇒ `existing: <坐标> · name: "…" · consumers: …`；直接复用 |
| C2 | 正常 · 查无 | 新端点确无先例 | `none found: <面清单>` 一行；允许新建 |
| C3 | 边界 · 名字近似能力不同 | 现成件叫法相近、能力不同 | 偏离理由须指名能力 / 契约面失败；答不出 ⇒ 仍判现成件可用 |
| C4 | 边界 · 轻通道小改 | 标签文字改一处 | 笔前答三问，§1 笔行带答案行；准入不变 |
| C5 | 错误防御 · 没查就写 | 落点行无答案行 | 判「没查」（不是「查无」）；设计评审 🟡（缺行）∥ 现成件未用且无说明 ⇒ 🔴 |
| C6 | 错误防御 · 偏离当通道 | 理由写「形态不同 / 更顺手」 | 判不合规（口味非理由）；须能力 / 契约面失败 |
| C7 | 错误防御 · 自造名 | UI 标签起新名、无对应登记 | 按 B4 判：须写对应 ∥ 取代谁；评审可查 |
| C8 | 边界 · 中文记录面 | 批档 §1 用 `已查无：` | 三形之一，判已答 |
| C9 | 边界 · 现成件在但不可用 | 现成组件接口不兼容（契约面失败） | `existing but unusable: <坐标> · name: "…" · failed on: <逐字失败>`；缺 `failed on:` ⇒ 按 C5 判 |
| C10 | 边界 · 收口抽读 | 本轮 §1 有 5 笔行 | 父侧读 ≥2 行，逐行判三形；有一笔缺行 ⇒ 记「没查」并回该笔 |

**受影响文件（现行 = 本席 `node` 实读 · 2026-10-21；Δ = 本节逐字块长度实算）**：

| 文件 | 现行 | Δ → 改后（占比 / 上限 · 上限 = 基线 × 1.03 取整） |
|---|---|---|
| `thincoder-core/prompts/discipline-engineering.md` | 203 行 / 38,203 字符 | L1 −524 +1,389 = +865 ∥ L4 −164 +432 = +268 ⇒ **+1,133 字符 / ±0 行** → 39,336 |
| `thincoder-core/prompts/persona-engineering.md` | 244 行 / 65,134 字符 | L2：+785 字符 / +3 行 ∥ L2b：+405 字符 / +1 行 ⇒ **+1,190 字符 / +4 行** → 66,324（+1.81% / 上限 67,088 · 余 764） |
| `thincoder-core/prompts/advisor-design.md` | 76 行 / 12,274 字符 | L3：**+360 字符 / +1 行** → 12,634 |
| `thincoder-core/prompts/common.md` | 274 行 / 43,728 字符 | **±0**（B4 不落此档 · K8） |
| `docs/core/design/PROMPT-SYSTEM.md` | 2,247 行 / 184,362 字符（本节写入前） | 本节改写 + §6.26 计数行 |
| `thincoder-core/tool-docs/**` · 产品代码 · 需求档 · 批次档六段结构 | — | ±0 |

**验收（A1–A10 · 回指 §13.17 六条 + 验收三条）**：

| # | 验收 | 判法 / 读数 |
|---|---|---|
| A1 | 需求 ①：三问齐 + 「答不上来再动手」 | `thincoder-core/prompts/discipline-engineering.md` 内 `where does this function live now` · `what is it called` · `who uses it` · `only a checked absence earns a new build` 各 1 次 |
| A2 | 需求 ②：答案落盘、三形 + 两落点 | `thincoder-core/prompts/discipline-engineering.md` 内 `existing: <coordinate>` · `none found: <which surfaces were checked>` · `existing but unusable:` · `failed on:` 各 1 次；`one line per new landing in the new-mechanism section` · `one line in batch record §1 beside that pen` 各 1 次 |
| A3 | 需求 ⑤：偏离收窄 | `thincoder-core/prompts/discipline-engineering.md` 内 `not reusable` · `concrete failure on the capability ∥ contract face` · `is taste, not a rationale` 各 1 次 |
| A4 | 需求 ④：笔前也答 + 收口抽读落点 | `thincoder-core/prompts/persona-engineering.md` 内 `A pen answers the three questions before it moves` · `Closeout samples the pen lines` · `read at least two of the round's §1 pen lines` 各 1 次；轻通道三例与边界原文各 1 次（准入零改） |
| A5 | 需求 ⑥：评审存在性 ⇒ 🔴 + 条目数连带 | `thincoder-core/prompts/advisor-design.md` 内 `Existing-piece check` · `left unused with no reason it is unusable ⇒ 🔴` · `existing but unusable: …` 各 1 次；`^11\. ` 计 1 条（条目数 10 → 11）；本档 §6.26 计数行 = `11` |
| A6 | 需求 ③：新名挂靠（子串 + 节锚 + 行锚） | `thincoder-core/prompts/discipline-engineering.md` 内 `A new name anchors to a concept the product already carries` · `a UI label ∥ field name ∥ button text` 各 1 次，**且两串同在 `## Doc discipline` 节内、同在一条以 `- **One word per thing**` 起的行上**（节切 = `## Doc discipline` 至下一个 `^## `），按错节 / 错行判红；`jdata` 全档 0 次 |
| A7 | 携 why、无禁令腔 | B1–B4 五块扫 `never\|do not\|don't\|must not\|may not\|forbidden` ⇒ 0（本席预扫 = 0）；why 子句在场（B1 `only a checked absence earns a new build` · B4 承接宿主行 `:117` 既有 `a second name for the same thing is a defect`） |
| A8 | 提示词面零文档引用 · 逐档体量读数（无帽） | `node scripts/prompt-refs-check.mjs` ⇒ 命中 0（基线 69 档 / 463 档 / 0）；逐档上限见文末「体量读数」；`doc_check(mode:"gate")` ⇒ PASS |
| A9 | 唯一机检项 = 判据形（非机械门） | 本节「唯一机检项」段在场：读者（评审 / 父侧收口）· 读点（设计档落点行 / §1 笔行）· 三形判法各 1；父侧读者有提示词落点（B2b）；`scripts/` 零新增 |
| A10 | 与 FR38 三条零冲突 | `thincoder-core/prompts/discipline-engineering.md` 内 `at least one round of questions to the user and answers back` · `the user's explicit confirmation of the requirement set` · `thincoder-core/prompts/common.md` 内 `A doc answers facts; intent gets asked` 各 1 次（改后仍各 1） |

**体量读数（基线 = 现行字符数；改后 = 本节实算；无帽）**：

**行数口径** = `split("\n").length − 1`（末行换行后的空段不计）；`read` 工具显示的「N lines total」含末尾空段，比本口径多 1（两口径差 1，非漂移）。

- `thincoder-core/prompts/discipline-engineering.md` 改后 39,336（无帽 · 读数）
- `thincoder-core/prompts/persona-engineering.md` 改后 66,324（无帽 · 读数）
- `thincoder-core/prompts/common.md` 改后 43,728（该批未改 · 读数）
- `thincoder-core/prompts/advisor-design.md` 改后 12,634（无帽 · 读数）

超出即削 why 不削规则（D-PS42 ③）。

**边界（本批不做）**：不改轻通道准入本体（三例与一句边界零改）· 不新增机械门 / 脚本 / CI 步 · 不改 FR38 三条（`:37` `:39` `common:17`）· 不改数据前提门（`#1722`）。
不改评审收敛流程与严重度表（B3 只加第 11 条，🔴/🟡 体系沿用）· **不写不删 `.thincoder/advisor.md`**（K1：workspace 级档实存，写它即整档取代内建）· 不改 `thincoder-core/prompts/persona-eng-designer.md` 8 项形态。

本设计轮 `thincoder-core/prompts/**` 零笔 · 产品代码零触 · 需求档零笔。

**关键决策**：

| # | 决策 | 理由 |
|---|---|---|
| K1 | 评审存在性判据落 `thincoder-core/prompts/advisor-design.md` 新增第 11 条；**不写不删** `.thincoder/advisor.md` | ① `thincoder-core/advisor/history.mjs:53-58` 实读：`loadAdvisorMd(cwd)` 读 `join(cwd, ADVISOR_MD_PATH)`、命中即**整档取代**内建判据（文件注释 `if present, otherwise the built-in defaults`）——写它会把 1–10 条整体换掉，除非整份复制；② 该档在**本仓 cwd**（`D:\teamcode\thincoder\.thincoder\`）实读不存在；**共存事实**：工作区根 `D:\teamcode\.thincoder\advisor.md` 实存（`# Advisor 评审标准（workspace 级：D:\teamcode）`，自带 6 条设计评审判据）⇒ 会话 cwd 落在工作区根时 `loadAdvisorMd` 命中该档、整档取代内建，**只改提示词档的 B3 在那一 cwd 不生效**（该行为面影响未实证，标 `unverified`）；本批写权也不及该路径；③ `PROJECT-MANIFEST.json` `advisor.docMap` / `standardsDoc` 均为空串 ⇒ 无声明面；④ 先例 = D-PS37 把勘察证据行落为同档第 10 条（同族判据同址） |
| K2 | 三问 = 先例勘察句的**执行形**，整行替换、不另起一段 | 需求验收 ③ 明写「后者保留、前者是其执行形」；另起一段 = 同一机制两句并存（D2 两份活描述）；整行替换后读序仍是「勘察 → 对齐 → 偏离」 |
| K3 | 三形定死 + 记录面两字面 | 判据必须能区分「没查」与「查无」还要能说「找着了但不用」；英文面 `existing:` / `none found:` / `existing but unusable:`，中文记录面 `已查无：` / `现成不可用：`（批次档 / 台账中文面） |
| K4 | 笔前规则落 `thincoder-core/prompts/persona-engineering.md` 轻通道节，与 discipline 层成对 | 受众分层：discipline 层读者 = 主会话 + eng-coder + eng-designer；persona 层 = 主 agent 的笔披露形（轻通道写权独属）。同 FR38 的 twin-anchor 处置（`persona:42` ∥ `common` R3）：两层各须独立可读，D2 不判重复 |
| K5 | 评审两档严重度：现成件未用且无说明 ⇒ 🔴；缺答案行 ⇒ 🟡 | 需求第 6 条给的就是这两档；缺行若也判 🔴，一次评审会把每条落点行判红，设计轮变填空题——「存在门」的目标是现成件被绕开，不是每行都被填满 |
| K6 | 唯一机检项不做脚本，只给判据形（谁读 / 何时读 / 怎么判 / 抽样 ≥2） | 需求明写「不做机械门」；判据形让「没查」有地方现形，且不把成本摊到每次运行 |
| K7 | §6.26 计数连带行（`:644`）的 `10` → `11` 由本条设计轮同步 | D3 计数与列表同改；留 `10` 则本档内部两处计数互斥（§6.26 vs §6.41） |
| K8 | B4 落 `thincoder-core/prompts/discipline-engineering.md:117` **同一 bullet 的续句**（替换该行），不落 `thincoder-core/prompts/common.md` | ① 判据面就在 `:117`（一名一物，且已含 `UI word`）——另立一条 = 同一机制两份活描述（D2）；② `thincoder-core/prompts/common.md` 无命名纪律节（`:113-118` 是搜索工具节），落那里即错位，且公共层与工程纪律层在工程会话里同读一份 ⇒ 孪生锚 = 同一读者读两遍，收益为零；③ 并入同条 = 复用宿主行既有 why（`a second name for the same thing is a defect`），并复用宿主行既有 why（39,336 ≤ 39,349 · 余 13） |
| K9 | 收口抽读落 `thincoder-core/prompts/persona-engineering.md:104` 之后（B2b），不停在设计档 | 验收 ② 的读者是父侧收口轮——运行期只读提示词；规则只住中文设计档 = 不触发（本条对三次实例的同一诊断） |
| K10 | 第 11 条作用域 = **设计所依据的需求集要求该答案行时**，不按「工程模式」限定 | 二择一：① 需求集限定——评审的判据面（判据 1 已按需求覆盖判），且缺省不判，普通模式不会误红；② 工程模式限定——评审上下文无可核模式信号：`thincoder-core/prompts/advisor-design.md:2` 无条件自称 `inside an engineering-mode session`，普通模式同读该档时该句照样在场（`thincoder-core/advisor.mjs:100-102` 只按 `reviewType === "design"` 选档，无模式分支）⇒ 按模式限定在普通模式仍会误判，等于没改。取 ①；代价 = 需求集不要求该行的设计判据不触发（宁可不判，不误判——误判要整轮整改） |

**先例 ∥ 偏离**：先例 = 本档 §6.40（同批形制：逐字英文文本 + 落点表 + 对照表 + 用例表 + 验收）∥ §6.39（整行替换 + 相邻行零改）∥ D-PS37 / §6.26（评审判据落 `thincoder-core/prompts/advisor-design.md` 新条目 + 条目数计数连带）。
**对齐** = 同形制；新增文本携 why；落点 = 既有行替换 / 节内增行；机判沿用既有脚本与交付门。

**偏离** = ① 本条首次把**评审严重度分档**写成条文（🔴 vs 🟡）——既有判据无严重度分档先例；理由 = 「存在门」与「记录缺行」是两种失败，同一严重度会让存在门失去牙齿（K5）。② 答案行是**新增的记录形态**（设计档落点行 ∥ 批档 §1 笔行），既有落点表只有「动作」列——本条不新增表列，答案行按所在节既有形态就地落行。③ B4 以续句并入既有 bullet 而非新增条目（K8）——既有档内无「同名机制续句」先例，理由 = D2（同一机制不得两份活描述）。

④ 坐标位移：需求引 `thincoder-core/prompts/discipline-engineering.md:40`，现盘 `:42`（FR38 R1 插入两行所致），本条已按现盘坐标声明。

**勘察证据行**：已读 `thincoder-core/prompts/discipline-engineering.md:29-47`（四步 · 需求步 · `:42` 先例勘察）∥ `:50-66`（轻通道 · 一句边界 · 轮形）· `:114-118`（`## Doc discipline` · `:116` 命名纪律 · `:117` 一名一物）。

`thincoder-core/prompts/persona-engineering.md:5-15`（发起权）∥ `:104-120`（收口清账条 · 轻通道披露形 · 启动即挂账 · `:120` 「已查无」）· `thincoder-core/prompts/advisor-design.md` 全文（判据 1–10 · 严重度 · Judgment Rules）。

`thincoder-core/prompts/common.md:13-21`（先查档 · 分界）∥ `:113-118`（搜索工具节——无命名条）∥ `:192-223`（文档体系评估标准——无 UI 命名面）⇒ 公共层无 B4 的既有宿主，K8。

`thincoder-core/advisor/history.mjs:49-59`（`loadAdvisorMd` 整档取代语义）· `D:\teamcode\.thincoder\advisor.md` 实存（workspace 级档）∥ 本仓 `.thincoder/` 实读无 `advisor.md` · `PROJECT-MANIFEST.json` `advisor.docMap` / `standardsDoc` = 空串 · 本档 §6.38 ∥ §6.39 ∥ §6.40（形制与相邻节）。

`node scripts/prompt-refs-check.mjs` 零参运行读数 = 提示词面 69 档 · 代码面 463 档 · 命中 0（本节写入前）。
`PROJECT-MANIFEST.json` `index.publicRepos` 实读 = `[]` ⇒ 工作目录内无独立公共源文档仓——已查，无相关。

**UI / 交互决策**：无界面面——本条只改模型可见提示词文本。唯一「用户可见」面 = 用户三次实例里的 UI 标签文字：B4 把「新标签必须挂靠产品已载概念名」写成规则，评审按第 11 条查；无待裁的界面形态。

**上抛项**：无。

### 6.42 业务门就是门：禁止兜底放过业务失败（提示词面显式化 · FR40）

**来源**：需求权威 = `ENGINEERING-MODE-V2.md` §13.18（FR40，六条，`:845-862`）；台账 `#1725`；结构诊断四行 = 本批批次档 §1（`:13-20`）。用户原话（2026-10-21 17:14，逐字）：「业务问题不能靠技术解决，业务上走不通的就该走不通」；预算口径 = 提示词无体量帽（17:18 裁定），体量只作读数。

**要修的那一处（实读 · 2026-10-21 本席）**：

| # | 坐标 | 现文 | 缺的那一半 |
|---|---|---|---|
| F1 | `thincoder-core/prompts/common.md:115` · `:146` · `:169` | `fallback` 三处全是正当用法（Bing 兜底 · 压缩兜底 · 路由表） | 全档无一句把「兜底」与业务失败相连 ⇒ 模型只学到「兜底是好事」 |
| F2 | `thincoder-core/prompts/common.md:17` · `thincoder-core/prompts/persona-engineering.md:36-37` · `thincoder-core/prompts/persona-normal.md:27-28` | `workable default` 族：长任务里给默认值继续推进 | 执行面默认与业务门无分界 ⇒ 模型可把「继续推进」读成「让业务失败也能通」 |
| F3 | `thincoder-core/prompts/discipline-engineering.md:103-113` | 测试纪律九条：单元 / 集成 / 收口行 / 断言形态 | 无一条要求业务门带失败用例；`happy path` 单独即可交差 |
| F4 | `thincoder-core/prompts/advisor-round1.md:46-58` | 代码评审判据 R1–R7e（正确性 / 设计偏离 / 裁决 / 脆弱测试 / 范围 / 测试缝 / 文档态） | 无「兜底把该失败的业务路径做通」判据 |
| F5 | `thincoder-core/prompts/advisor-round1.md:53` | R6 `??` default fallback（测试缝注入默认） | 唯一既有 `fallback` 字面 = 测试缝，生产行为不变 ⇒ 本条不改（对照表 K7） |

**机制（六件 = 需求六条）**：

1. **业务门失败必须显式失败**（需求 ①）：业务前置不满足（存在性 ∥ 状态机 ∥ 权限 ∥ 金额 ∥ 关联完整性）⇒ 抛出或拒绝，带**可指认的原因**（哪道门、哪个输入）；禁止默认值 ∥ 自动补建 ∥ catch-continue ∥ 空集合 ∥ 中性文案把它「做通」。主落 `thincoder-core/prompts/common.md` 新节（跨模式 + 全子代理）。
2. **兜底唯一合法判据 = 业务结果不变**（需求 ②）：只允许系统性可恢复条件；正例四项（重试 ∥ 缓存穿透 ∥ 渲染占位 ∥ i18n 缺键）与反例五项（默认值 ∥ 自动补建 ∥ catch-continue ∥ 空集合 ∥ 中性文案）逐条写进同一节。
3. **自检问句逐字 + 答案落记录面**（需求 ③）：`"If I delete this fallback, would a business error surface?"`——会 ⇒ 它在掩盖业务问题，删；不会 ⇒ 答案进这笔改动的记录面（批档笔行 ∥ 设计档），写明它兜的是哪个条件、为何业务结果不变。
4. **业务 / 技术分界**（需求 ④）：技术手段不得改变业务判定；业务例外只能由用户 ∥ 业务方裁定并落档（哪条规则 ∥ 谁批 ∥ 有效期），代码不自行容错。
5. **评审判据**（需求 ⑤）：落 `thincoder-core/prompts/advisor-round1.md` 新增 R8——兜底使本应失败的路径变为成功 ⇒ **🔴**；兜底分支未给「业务结果不变」证据 ⇒ **🟡**。
6. **验收形态**（需求 ⑥）：落 `thincoder-core/prompts/discipline-engineering.md` 测试纪律节新增一条 bullet——业务门必须带失败用例（不满足前置 ⇒ 断言拒绝 + 原因可读），happy path 单独不算。

**逐字英文文本（实施席照此落笔 · 唯一权威目标形）**：

B1 — `thincoder-core/prompts/common.md`：`## Evidence discipline` 节末（现盘 `:49` 之后、`:50` `## Document writing discipline` 之前）插入新节（前后各一空行）：

```text
## Business gates — a business failure must fail

A business system is correct when what should not pass does not pass. A **business gate** is a precondition the business states, not the code: the record exists, the state machine allows the move,

the permission holds, the amounts balance, the relation is complete. **When a gate is not satisfied, fail explicitly** — raise or reject, carrying a reason a person can point at (which gate, which input).

Making it pass instead — a default value, an auto-created parent, a caught exception that lets the loop continue, an empty list standing in for rows that could not be read, a neutral message in

place of the refusal — turns a business error into silence, and a silent error is never found, never fixed, never learned from.

**The one test every fallback must pass — the business result does not change.** A fallback is legitimate only for a systemic, recoverable condition whose outcome is identical either way:

- **Legitimate** (same business result): retry a failed read, and report it failed if the retry fails too · fill a cache from its source on a miss · occupy a layout slot with a placeholder while data loads · render `order.submit` when that translation key is missing.
- **Never a fallback** (a business failure becomes success): default an absent amount to 0 · auto-create a missing parent so the child insert lands · catch a validation error so the loop moves on · return `[]` when the rows could not be read · report "processed" where the rule said "reject".

**Ask before you leave any fallback in place**: *"If I delete this fallback, would a business error surface?"* If yes, the fallback is hiding a business problem — delete it and let the error out; the error is the finding, and it is cheaper now than after the data is wrong. If no, write the answer on 

  the record — the batch-record line of this change, or the design doc — naming the condition it recovers from and why the business result is unchanged.

**Business and technical do not trade.** A technical device — a default, an auto-create, a retry, a degradation — must not change what a business rule decides. Where a business rule genuinely needs an exception, the user or the business owner grants it and it goes on record: which rule, who approved 

  it, until when. Code does not grant itself tolerance.

**A workable default is a different thing**: it decides how the work moves, not what the business decides, and it never invents a business outcome. The line is the outcome, not the mechanism.
```

B2 — `thincoder-core/prompts/advisor-round1.md`：R7e 行（现盘 `:58`）之后、`Source: 7-round sample` 行（`:59`）之前，插入一行（与 R1–R7e 同形：条目间无空行）：

```text
R8 Business-gate fallback — a changed flow that catches a business failure and carries on (a default standing in for a missing business field · an auto-created precondition · a caught validation error that lets the loop continue · an empty collection where the rows could not be read · a neutral 

  message in place of the refusal) makes a path that should have failed succeed ⇒ 🔴 (must fix: the gate fails explicitly with a reason, and a machine-checkable case proves it). A fallback branch inside a changed flow with no evidence that the business result is unchanged ⇒ 🟡 (state the condition 

  it recovers from and why the outcome is identical — a retry ending in the same answer or an explicit failure · a cache filled from its source · a render placeholder no business rule reads · a missing i18n key rendering its key); with that evidence the branch passes.
```

B3 — `thincoder-core/prompts/discipline-engineering.md`：`- **Assertions ride behavior, not prose**` 行（现盘 `:112`）之后、`## Doc discipline`（`:114`）之前，插入一行 bullet：

```text
- **A business gate ships with its failure case**: a gate that must reject gets a unit case — deleted with the batch, like every other unit case — that feeds it unsatisfied input and asserts the rejection plus its readable reason (the gate named, the offending input named). The happy path alone does 
  not show the gate exists — a gate nobody has watched reject is a gate that may be defaulting, auto-creating or catching its way to success; the failure case is the reading that proves the business rule is still deciding.
```

**落点表（实施席逐处执行）**：

| # | 坐标 | 动作 |
|---|---|---|
| L1 | `thincoder-core/prompts/common.md:49` 之后 / `:50` 之前 | 插入 B1 整节（`##` 节标题 + 六段 · 前后各一空行；前一空行现盘 `:49` 已有 ⇒ 尾随空行另加 1 行，实增 18 行）；`##` 节数 +1（19 → 20） |
| L2 | `thincoder-core/prompts/advisor-round1.md:58` 之后 / `:59` 之前 | 插入 B2 一行（R8 · 条目间无空行 · +1 行） |
| L3 | `thincoder-core/prompts/discipline-engineering.md:112` 之后 / `:114` 之前 | 插入 B3 一行 bullet（+1 行 · `##` 计数零变） |
| L4 | `thincoder-core/prompts/discipline-engineering.md` 主节 · `thincoder-core/prompts/advisor-design.md` · `thincoder-core/prompts/advisor-round2.md` · `thincoder-core/prompts/advisor-round3.md` | **零改**（K2 · K3 · K8）——工程纪律层不同落、设计评审判据不同落、二三轮不带新判据 |
| L5 | `thincoder-core/prompts/persona-engineering.md` · `thincoder-core/prompts/persona-normal.md` · `thincoder-core/prompts/persona-plan.md` · `thincoder-core/prompts/persona-eng-coder.md` · `thincoder-core/prompts/persona-eng-designer.md` · 其余提示词档 | **零改**（`workable default` 族由 B1 末段在公共层一次说清 · K4；`thincoder-core/prompts/persona-plan.md:22` 的 plan fallback 由 B1 的判据管辖 · K6） |
| L6 | 产品代码 · 需求档 · 批次档六段结构 · `scripts/**` | **零改** |

**计数连带（D3）**：

① **需求档大纲**：`docs/core/requirements/PROMPT-SYSTEM.md` §2.3 标题「thincoder-core/prompts/common.md **19 节**」⇒ **20 节**，表行 +1（新节按 `thincoder-core/prompts/common.md` 实际序位入大纲）。需求档笔归主 agent——本节登记、本批不改（A10 只判 §13.18 零改）。

② **`thincoder-core/prompts/common.md` 节数**：`##` 19 ⇒ 20（L1 落地即真；`node` 实读 19）。代码面无 `thincoder-core/prompts/common.md` 节数断言（`thincoder-core/test/**` ∥ `thincoder-cli/test/**` 实读：唯 `doc-check-scope.test.mjs` 提到 `thincoder-core/prompts/common.md`，非计数断言）。

③ **序位口径**：档内「第 N 节」= 落笔当时的节位读数，不是定位坐标；指称以节名（`产品常识` ∥ `安全纪律`）为准。存量读数本就不齐（§6.16 `:399` = 17 ∥ §6.22 `:533` = 16 ∥ §6.25 `:613` = 17 ∥ D-PS22 = 15）⇒ 本节的**段中插入**不牵动 D-PS30 ∥ D-PS36 ∥ §6.25 的读数，这些读数也不作判据。

**对照表 · 与既有提示词条款逐句对照（结论 = 零矛盾）**：

| 既有句 | 它管什么 | 本条管什么 | 为何不矛盾 |
|---|---|---|---|
| `thincoder-core/prompts/common.md:115` Bing 兜底 · `:169` 路由表 | 搜索工具的可用性回退（工具择一，非业务判定） | 业务门的失败与兜底 | **范围不同**：B1 首句把范围钉在 business gate；工具回退不产生业务结果 ⇒ 不触发（且 `:115` 原文是「工具不可用才换」，与本条同向） |
| `thincoder-core/prompts/common.md:146` 压缩兜底 | 机制运行期行为（到线自动压缩） | 业务门 | 机制面，不改变业务判定 ⇒ 不在 B1 判据内 |
| `thincoder-core/prompts/common.md:17` `A doc answers facts; intent gets asked` 末句 | 两件：问与不问（`The line holds while the requirement is being formed`）· 执行期带 `workable default` 推进（`once work is under way`） | 业务结果不许被默认值改变 | 两轴：`:17` 管何时问、何时带默认推进；B1 末段只给分界判据（结果，不是机制），不复述 `:17` 的默认句 |
| `thincoder-core/prompts/persona-engineering.md:36-37` · `thincoder-core/prompts/persona-normal.md:27-28` `workable default` | 长任务不阻塞：带默认继续推进 | 业务门不满足必须失败 | 同上一行：**判据 = 结果是否改变**，不是机制形态；B1 末段就是这条分界的落地句（防重演 `#54` 的规则压错面） |
| `thincoder-core/prompts/persona-plan.md:22` plan 的 `fallback`（须给具体恢复路径） | 计划步骤的风险恢复形态 | 恢复路径允许的边界 | 「具体恢复路径」本身不违规；B1 规定它要么以同一业务结果收尾、要么显式失败 ⇒ 同向（K6） |
| `thincoder-core/prompts/discipline-engineering.md:22` · `:24` · `:27` `fail-closed` | 改动面分类：未列举 ⇒ 按产品代码面走全流程 | 业务门失败必须浮出 | **同一族判断的两种场合**：分类面宁可多走一道流程，业务面宁可显式失败；两处都反对「悄悄放过」 |
| `thincoder-core/prompts/discipline-engineering.md:170` `not a fallback for undecided differences` | 多实现面差异不得以「兜底」代替裁决 | 业务兜底 | 同向：都要求「说清 / 不允许含糊过去」；本条把同一条思路落到运行期行为 |
| `thincoder-core/prompts/advisor-round1.md:53` R6 `??` default fallback（测试缝） | 测试接缝的注入默认（`default null → production behavior unchanged`） | 业务兜底 | 该 fallback 的成立理由逐字就是「生产行为不变」= B1 的唯一判据 ⇒ **正是本条要保留的合法形**（K7） |
| `thincoder-core/prompts/advisor-round1.md:32` 严重度定义（🔴 = 用户明确要求未达成 / 🟡 = 达成但次优） | 评审严重度体系 | R8 两档 | R8 的 🔴 落在「业务规则被绕过」= 需求未达成；🟡 落在「缺证据」= 达成但无法核 ⇒ 与既有定义同轴，不新造严重度 |
| `thincoder-core/prompts/discipline-engineering.md:103-113` 测试纪律（单元用完即删 ∥ 集成走收口 ∥ 断言走行为形） | 测试层级与体量 | 业务门的失败用例 | B3 只管**内容要求**（失败路径要有用例），层级词与既有条同（单元级 · 随批删）；体量帽沿用既有条 |
| `thincoder-core/prompts/advisor-design.md`（设计评审 12 条） | 设计态判据 | 代码态判据 | **不同评审面**：设计轮不带 R8（设计文档里没有「兜底分支」可读）；R8 只进代码评审（K3） |

**用例表（正常 / 边界 / 错误）**：

| 编号 | 场景 | 输入 / 动作 | 期望 |
|---|---|---|---|
| C1 | 正常 · 业务门不满足 | 状态机不允许的出库单 | 抛错 / 拒绝，原因指明「哪道门 + 哪个输入」；带失败用例 |
| C2 | 正常 · 系统性重试 | 读超时，重试一次 | 重试成功 ⇒ 同一结果；仍失败 ⇒ 显式失败（不返回空集合） |
| C3 | 正常 · 占位 / 缺键 | i18n 缺 `order.submit` | 渲染键名本身，流程与业务判定不变 |
| C4 | 边界 · 兜底有证据 | 缓存未命中回源 | 评审按 R8 判：给了「业务结果不变」证据 ⇒ 通过 |
| C5 | 边界 · 执行面默认值 | 已确认范围内的排序默认值 | 不触发 R8（非业务门） |
| C6 | 错误 · 默认值补业务字段 | 金额缺失 ⇒ `0` | 🔴：业务失败变成功；删默认值改为拒绝 |
| C7 | 错误 · 自动补建前置 | 父单据缺失 ⇒ 自动建 | 🔴：关联完整性门被绕过 |
| C8 | 错误 · catch-continue | 校验异常被吞、循环继续 | 🔴：错误消失，整批数据带病 |
| C9 | 错误 · 空集合回落 | 读失败 ⇒ 返回 `[]` | 🔴：把「读不到」伪装成「没有」 |
| C10 | 错误 · 中性文案 | 拒绝被写成「已处理」 | 🔴：掩盖业务失败 |
| C11 | 错误 · 只有 happy path | 交付里只有成功用例 | 按 B3 判缺失败用例（交付不完整） |
| C12 | 错误 · 代码自行容错业务例外 | 代码里写「本类单据允许越级」 | 🔴：例外只能由用户 / 业务方裁定并落档（哪条规则 ∥ 谁批 ∥ 有效期） |

**受影响文件（现行 = 本席 `node` 实读 · 2026-10-21；Δ = 本节的逐字块实算 · 体量无帽 · 只作读数）**：

| 文件 | 现行 | Δ → 改后 |
|---|---|---|
| `thincoder-core/prompts/common.md` | 274 行 / 43,728 字符 | L1：**+1 节 / +18 行 / +2,528 字符**（17 行正文 + 尾随空行）⇒ 46,256 |
| `thincoder-core/prompts/advisor-round1.md` | 62 行 / 11,210 字符 | L2：**+1 行 / +858 字符** ⇒ 12,068 |
| `thincoder-core/prompts/discipline-engineering.md` | 203 行 / 39,336 字符 | L3：**+1 行 / +522 字符** ⇒ 39,858 |
| `docs/core/design/PROMPT-SYSTEM.md` | 本节写入后 2,604 行 / 217,874 字符（实读） | 本节 = 新增内容，读数随写入 |
| 其余提示词档 · 产品代码 · 需求档 | — | ±0 |

**验收（A1–A10 · 回指 §13.18 六条 + 批次验收 ①–⑤）**：

| # | 验收 | 判法 / 读数 |
|---|---|---|
| A1 | 需求 ①：业务门显式失败 + 五个反例 | `thincoder-core/prompts/common.md` 内 `business gate` · `fail explicitly` · `which gate, which input` 各 ≥1；反例五串各 1 次（`default an absent amount to 0` · `auto-create a missing parent` · `catch a validation error` · `return \`[]\`` · `report "processed"`） |
| A2 | 需求 ②：唯一判据 + 正反两组例 | `thincoder-core/prompts/common.md` 内 `the business result does not change` · `Legitimate` · `Never a fallback` 各 1 次；正例四串各 1（`retry a failed read` · `fill a cache from its source` · `placeholder while data loads` · `translation key is missing`） |
| A3 | 需求 ③：自检问句逐字 + 答案有记录面 | `thincoder-core/prompts/common.md` 内 `If I delete this fallback, would a business error surface?` 恰 1 次（含问号，机检子串）；`write the answer on the record` 恰 1 次 |
| A4 | 需求 ④：业务 / 技术分界 + 例外落档 | `thincoder-core/prompts/common.md` 内 `Business and technical do not trade` · `which rule, who approved it, until when` · `Code does not grant itself tolerance` 各 1 次 |
| A5 | 需求 ⑤：代码评审判据 + 作用域 | `thincoder-core/prompts/advisor-round1.md` 内 `R8 Business-gate fallback` · `should have failed succeed ⇒ 🔴` · `no evidence that the business result is unchanged ⇒ 🟡` 各 1 次；既有判据 11 条（R1–R7e）→ 加 R8 = 12 条（`^R\d+[a-z]? ` 计 12） |
| A6 | 需求 ⑥：失败路径机器可判用例 | `thincoder-core/prompts/discipline-engineering.md` 内 `A business gate ships with its failure case` · `The happy path alone does not show the gate exists` 各 1 次 |
| A7 | 执行面分界（设计点 8） | `thincoder-core/prompts/common.md` 内 `A workable default is a different thing` · `The line is the outcome, not the mechanism` 各 1 次；`workable default` 族零改 = 四行逐字在场（`thincoder-core/prompts/persona-engineering.md:36` ∥ `:37` · `thincoder-core/prompts/persona-normal.md:27` ∥ `:28`）；读数 = persona 两档各 2 次 · `thincoder-core/prompts/common.md:17` 1 次（只作读数，不作判据） |
| A8 | 提示词面零文档引用 · 机检 | `node scripts/prompt-refs-check.mjs` ⇒ 命中 0（基线 69 档 / 463 档 / 0）；`doc_check(mode:"gate")` ⇒ PASS |
| A9 | 携 why、反例携后果 | B1 的 why 句 = `a silent error is never found, never fixed, never learned from`；B3 的 why 句按两段连续子串各 ≥1 判：`a gate nobody has watched reject` · `catching its way to success`（判读串必须是连续子串——省略号形态不可判） |
| A10 | 需求档零改 · 需求六条逐条有落点 | `ENGINEERING-MODE-V2.md` §13.18 git diff = 零；本表 A1–A6 与需求 ①–⑥ 一一对应；③ 的记录面 = B1 自检段 `write the answer on the record` 句（批档笔行 ∥ 设计档），A3 判其在场 |

**体量读数（无帽 · 只读数 · `node` 实读 2026-10-21）**：`thincoder-core/prompts/common.md` 43,728 字符 / 274 行；`thincoder-core/prompts/advisor-round1.md` 11,210 / 62；`thincoder-core/prompts/discipline-engineering.md` 39,336 / 203。

本节新增文本（逐字块实算）= B1 2,528 字符 / 18 行（17 行正文 + 尾随空行）+ B2 858 / 1 行 + B3 522 / 1 行 ⇒ 提示词面合计 **+3,908 字符 / +20 行**（改后 = 46,256 / 12,068 / 39,858）。
提示词面机检基线 = 69 档 / 代码面 463 档 / 命中 0。本批无帽，不做选址优化。

**边界（本批不做）**：不禁系统性重试 / 降级 / 缓存 / 占位 / i18n 回落（限业务结果不变）· 不改既有安全与校验机制 · 不改渲染层占位与 i18n 缺键回落 · 不改普通模式既有纪律 · 不新增脚本 / CI 步 / 机判门 · 不改 `thincoder-core/prompts/advisor-design.md`（设计轮不带 R8）· 不改 `thincoder-core/prompts/advisor-round2.md` / `thincoder-core/prompts/advisor-round3.md`（收敛轮只查首轮表的修态，

  不新增判据）· B3 的失败用例 = 单元级、随批删——**收口后不留永久护栏**（本批不向集成集加例；要长期护栏 ⇒ 另立集成集裁定）。
本设计轮 `thincoder-core/prompts/**` 零笔 · 产品代码零触 · 需求档零笔。

**关键决策**：

| # | 决策 | 理由 |
|---|---|---|
| K1 | 主落 `thincoder-core/prompts/common.md` 新节（`## Business gates — a business failure must fail`），位置 = `## Evidence discipline` 之后 | 受众 = 两模式 + 全部子代理；`thincoder-core/prompts/common.md` 恒第二位注入 = 唯一全覆盖面（同 D-PS22 / D-PS30 / D-PS36 判例）。邻位选「证据纪律」之后：一个管「说真话」，一个管「运行期别把错误做没」，同族相邻 |
| K2 | `thincoder-core/prompts/discipline-engineering.md` **不同落**业务门本体 | 需求把落点判断交设计；工程会话里 `thincoder-core/prompts/common.md` 与工程纪律层同读一份 ⇒ 双份 = 同一机制两份活描述（D2），孪生锚收益为零（§6.41 K8 同判）。工程纪律层只落**测试形态**（B3），因为测试纪律住那一层 |
| K3 | 评审判据只落 `thincoder-core/prompts/advisor-round1.md`（首轮代码评审），不落设计评审、不落二 / 三轮 | 首轮是**发现面**（`Cover everything now`），二 / 三轮只查修态（`:41`）⇒ 判据落首轮即全覆盖，落后面两轮 = 三份活描述且不增加发现能力。设计评审读的是设计文档，没有「兜底分支」可判 |
| K4 | `workable default` 族（`thincoder-core/prompts/persona-engineering.md:36-37` ∥ `thincoder-core/prompts/persona-normal.md:27-28` ∥ `thincoder-core/prompts/common.md:17` 末句）**零改**，由 B1 末段一次分界 | 那条规则管「不阻塞」，这套规则管「结果不许被改变」——两轴不冲突（`#54` 的教训是规则压错面）；在 persona 三处各加一句 = 三份活描述 + 同一条分界写三遍。公共层一次说清 + 判据是「结果」而非「机制」，任何一处读者都能自行落在自己的面上 |
| K5 | 自检问句用逐字英文，并用引号 + 斜体包起来 | 需求明写「逐字 + 可机检子串」；引号让它在一段说明文字里可直接 grep，且与 `thincoder-core/prompts/common.md` 既有的引用体例一致（`"did this spot get fixed right?"`） |
| K6 | `thincoder-core/prompts/persona-plan.md:22`（plan 步骤须给具体 fallback）不单改 | plan 的 fallback 是「恢复路径」形态约束，没说允许改变业务结果；B1 的判据管辖一切 fallback 的合法性 ⇒ 原文与 B1 同向。单改 = 在第四个文件重复同一条判据 |
| K7 | `thincoder-core/prompts/advisor-round1.md:53` R6 的 `??` default fallback 不动 | 该句的成立理由逐字是 `default null → production behavior unchanged` = B1 唯一判据的合法形。它是本条要**保留**的样板，不是要修的对象 |
| K8 | R8 作用域 = **评审范围内的业务流**，不用模式信号 | 先例 = `#1724` K10：`thincoder-core/prompts/advisor-round1.md` 无条件注入，普通模式同读该档，任何「按模式限定」的字面在普通模式仍会命中 ⇒ 等于没限。改用**对象作用域**：评审对象里没有业务规则（纯工具 / 渲染布局）就没有业务门可失败 ⇒ R8 自然不触发；这是代码自身可读的性质，不需要模式信号 |
| K9 | R8 严重度：🔴 = 本应失败变成功；🟡 = 兜底分支无「业务结果不变」证据 | 需求原条即两档；且与 `:32` 既有定义同轴（🔴 = 用户要求未达成 / 🟡 = 达成但次优、无法核）。🟡 给「拿证据即可通过」的出口，避免每次出现 fallback 一律判红（红必须留给「业务被绕过」） |
| K10 | B1 写「业务门」而非「业务逻辑」 | 判据必须可判：门 = 前置条件（存在 / 状态 / 权限 / 金额 / 关联），评审能与代码逐处对；「业务逻辑」无从判起，会把 R8 变成口味题 |

**先例 ∥ 偏离**：先例 = 本档 §6.41（逐字英文文本 + 落点表 + 对照表 + 用例表 + 验收 + 体量读数）∥ §6.40（公共层分界句 · `:17`）∥ D-PS36（安全纪律 = `thincoder-core/prompts/common.md` 档末新增节 · 同「跨角色普遍判断」论证）。
**对齐** = 同形制；落点用内容锚 + 行号双写；机判沿用既有脚本与交付门。

**偏离** = ① 新节插在 `thincoder-core/prompts/common.md` **段中**（`## Evidence discipline` 之后），不是档末追加（D-PS22 / D-PS30 / D-PS36 皆档末）——理由 = 邻位语义（证据纪律 → 业务门纪律同族），且档末追加只是当时为了避开 §N 漂移，本节无 §N 依赖（序位连带见「计数连带（D3）」③）。② 首次给「兜底」下正向判据（唯一合法判据 = 业务结果不变），既有提示词没有「兜底合法性」面。

  ③ B1 的禁令句携后果（沉默的错误永远不被发现），按 D-PS42 ① 处理：why 就在同句，不另起理由段。

**勘察证据行**：已读 `thincoder-core/prompts/common.md:13-21`（先查档 · 事实 / 意图分界）∥ `:43-49`（证据纪律）∥ `:112-146`（工具纪律 · `:115` Bing 兜底 · `:146` 压缩兜底）· `:169`（路由表）· `:261-274`（产品常识 · 安全纪律 —— 确认公共层无业务门节）。

`thincoder-core/prompts/discipline-engineering.md:103-113`（测试纪律九条）∥ `:14-27`（改动面路由 · `fail-closed`）· `:170`（多实现面差异不得当兜底）。

`thincoder-core/prompts/advisor-round1.md` 全文（身份 · 严重度 `:32` · 判据 R1–R7e `:46-58` · `:53` R6 测试缝）· `thincoder-core/prompts/advisor-design.md:71`（同 R6 句 —— 设计档不带兜底判据）∥ `thincoder-core/prompts/advisor-round2.md:55` · `thincoder-core/prompts/advisor-round3.md:51`（收敛轮同形）。

`thincoder-core/prompts/persona-engineering.md:36-37` ∥ `thincoder-core/prompts/persona-normal.md:27-28`（`workable default`）· `thincoder-core/prompts/persona-plan.md:22`（plan fallback）· `thincoder-core/prompts/persona-eng-coder.md:16`（`a silent degradation is a deviation` —— 与本条同向的既有句）。

`PROJECT-MANIFEST.json` `index.publicRepos` 实读 = `[]` ⇒ 工作目录内无独立公共源文档仓——已查，无相关。
本档 §6.40 ∥ §6.41（形制与落点体例）。

**UI / 交互决策**：无界面面——本条只改模型可见提示词文本；无待裁界面形态。

**上抛项**：无。





### 6.43 查文档走 doc_search：发现式 vs 定位式（文档检索路由 · FR41）

**来源**：需求权威 = `ENGINEERING-MODE-V2.md` §13.19（FR41，五条，`:864-887`）；台账 `#1728`；结构诊断四行 = 本批批次档 §1（`:15-22`）。

用户 2026-10-22 10:02 转述**别的项目**的反馈（逐字：「模型在查文档的时候总是用直觉使用grep……跨仓文档查不到，其次是批次档里的旧信息经常造成污染」）+ 10:04「提示词强化一下，但是要求还是老规矩“知其然知其所以然”」。**10:06 父侧更正（用户原话）**：「grep的问题不是扫全树，是会忽略跨仓文本。」

⇒ why 主轴 = **检索面之差**（`doc_search` = 声明域、含 `index.publicRepos` 跨仓源；`grep` = 你递给它的**一个路径**，缺省当前仓）——次因 = 过程档在域外（`grep` 无档类判据，批次档命中只算线索）。体量口径 = 提示词无体量帽（2026-10-21 裁定），只作读数。

**要修的那一处（实读 · 2026-10-22 本席）**：

| # | 坐标 | 现文 | 缺的那一半 |
|---|---|---|---|
| F1 | `thincoder-core/prompts/common.md:13-21`（先查档节） | 答的是「要不要先查」：`docs` 排在 `doc_search` 之前，`A doc answers facts; intent gets asked` | 全节无「查文档用哪个工具」一句；`doc_search` 只作为一个名字出现在清单首位 |
| F2 | `thincoder-core/prompts/common.md:152-153`（`### Codebase exploration order`） | `repo_outline → doc_search → code_search. Structure → intent → details.` | 只给顺序，不给边界：读成「先试 doc_search，不行就 grep」，恰是要修的那个读法 |
| F3 | `thincoder-core/prompts/common.md:166-191`（工具路由表 · `:178` 行） | `repo_outline / code_search / doc_search` = `module dependency graph / code search / doc search`；`Not` 列管的是「bash 里的 grep → 用工具」 | 表行只列用途；`Not` 列的 grep 规则是「工具 vs bash」，与「发现 vs 定位」不同轴 |
| F4 | `thincoder-core/tool-docs/doc_search.md`（一句正文） | `Search the project's documentation (README, design docs, guides, markdown files)…` | **工具自述里没有声明域、没有过程档排除、没有跨仓语义** ⇒ 机制差只能由提示词面承载（本节 P2 的 why 由此而来） |
| F5 | 全档扫 `docs/batches` / `publicRepos` / `none found` | 三串在 16 档提示词面零命中 | 「命中不是口径」与「跨仓未纳入索引」两条在运行期无落点 |

**机制（四条 + 一句分界）**：

1. **两分法**（需求 ①）：**发现式**（哪份文档说过 / 有没有既有规范 / 旧决定在哪 / **在哪个仓**）⇒ `doc_search` 首查；**定位式**（已知仓、目录、档名，要 `file:line`）⇒ `grep` 照用。判据就是检索面：不确定在哪个仓 ⇒ 只有 `doc_search` 够得着。
2. **机制差（why 主轴）**：`doc_search` 的检索面 = **声明域**（本仓文档 + `index.publicRepos` 声明的公共源仓），一次提问覆盖多仓；`grep` 的检索面 = **你递给它的一个路径**（缺省 = 当前 cwd），别的仓的文本除非命令里已带绝对路径否则不可见——而模型连机器上有哪些仓都没有清单。所以 grep 对跨仓是**结构性失明**，不是「没查仔细」。
3. **无命中要说**（需求 ②）：`doc_search` 空 ⇒ `grep` 正当兜底，答案携 `doc_search: none found`（中文记录面 = `doc_search 已查无：`，与 FR39 的 `none found:` / `已查无：` 同形）。
4. **命中不是口径（次因 · 需求 ③）**：声明域无条件排除批次档（`declaration.mjs:144` 面⑥），归档页仅在项目声明 `index.excludePaths` 时排除（缺省 `[]` · `manifest-schema.mjs:63`）⇒ `grep` 命中 `docs/batches/**` ∥ 项目声明排除的 `**/_archive/**` ∥ 日志页 = 搜索跑在域外的证据，**线索不是结论**，回状态档核。
5. **跨仓未声明要写**（需求 ④）：`index.publicRepos` 未声明的仓 ⇒ 携 `cross-repo: not indexed`（中文记录面 = `跨仓未纳入索引：`）；`grep` 在本仓的空结果对那个仓「说了等于没说」。
6. **分界句（三条相邻不同轴，零重叠）**：FR38（`thincoder-core/prompts/common.md:13-21`）决定**要不要先查**——意图问人、事实查档；FR39（`thincoder-core/prompts/discipline-engineering.md:42`）决定**落笔前交什么答案**——现成件在 ∥ `none found:`；本节决定**查文档用哪个工具、它的检索面覆盖什么**。前两者管「何时查 / 交什么」，本节管「用谁查」。

**落点判断（两候选逐条对照 —— designPoints 6 的理由）**：

| 判面 | 候选 A：`### Codebase exploration order` 节内续段（`thincoder-core/prompts/common.md:152-153`） | 候选 B：`## Tool routing` 表行加注（`:166-191`） | 采纳形：同层新增 `###`（A 之后） |
|---|---|---|---|
| 读者 | 全角色，探索时 | 已知道要用哪个工具、来查「怎么用」的人 | 全角色，**动手查之前** |
| 读时机 | 「从哪开始」 | 「这个工具是干嘛的」——此刻已选完工具 | 「选哪个工具」——正是本条的触发点 |
| 能否携 why | A 只有 2 行格言体，塞进机制差即毁其形态 | 表单元格：一个 3 列 1 行的索引，why 段落进不去；且该行 `Not` 列管的是 bash-vs-tool | 独立段：机制差有地方落 |
| 既有文本 | 需改 A 的正文（2 行格言是记忆锚） | 无需改 | **零改**：A 逐字保留，新节紧随其下 |
| 计数连带 | `###` 不牵动 `##` | 零 | `###` 不牵动 `##`（20 节不变）；标题节点 25 ⇒ 26 |

**采纳理由**：`## Tool discipline` 已装两张「选哪个搜索工具」的子节（`### Search tool priority` = 联网面 ∥ `### When online verification is required` = 何时联网），**缺的正是文档面这一张**；放在 `### Codebase exploration order` 之后 = 与「探索从哪里起手」同节相邻（先顺序、后边界）。候选 B 被否的硬理由 = 表行装不下 why，而本条的全部价值在 why。

**逐字英文文本（实施席照此落笔 · 唯一权威目标形）**：

B1 — `thincoder-core/prompts/common.md`：`repo_outline → doc_search → code_search. Structure → intent → details.` 行（现盘 `:153`）之后、空行（`:154`）之后、`### Parallel call principles`（`:155`）之前，插入新 `###` 子节（前后各一空行）：

```text
### Document search — finding a document vs locating a line

Two questions look alike and take different tools. **Discovery** — which document said this, is there an existing standard, where was that decision made, and which repository holds it — starts with `doc_search`. **Locating** — the repository, the directory and the file are already known, and what 

  you need is the coordinate — goes to `grep` straight away: a literal scan of a known file, read back as `file:line`. `Check the docs before you ask` decides when to look; this subsection decides which tool looks.

The difference is the search surface, not the syntax. `doc_search` searches a declared domain — this project's documents plus the repositories listed under `index.publicRepos` in the project manifest — queried in one call. `grep` searches exactly one path: the one you hand it, the current repository 

  by default. Other repos on this machine are invisible to it unless your command already carries their absolute paths, and an agent holding no list of the machine's repos has no such paths to carry. That is a structural limit across repositories, not a search done carelessly: `grep` answers 

  "nothing here" with only the reach it was given, and that empty answer arrives in the same shape as a checked absence.

**A search that found nothing says so.** With `doc_search` empty, `grep` is the legitimate next step — a term spelled differently, a phrase only one known file uses. The answer then carries `doc_search: none found` beside the `grep` result. An unstated fallback reads to the next person as "the index 

  holds nothing on this", which claims more than "this query missed": the first closes the topic, the second leaves it open.

**A hit in a process document is a lead, not a finding.** The declared domain leaves process documents out — batch records always stay out of the index, archived pages wherever the project declares them excluded — so a hit in an excluded document tells you the search ran outside the domain: a 

  secondary cost next to the cross-repo blindness above. It records where something was discussed once, while the state lives in the requirement and design documents, and a batch record can be dropped whole. Before an answer rests on such a hit, open the state document it points at: the batch record 

  names the change, the state document carries the rule as it stands. Answering from the batch line turns a past round's draft into this round's standard.

**Documents in other repositories count once declared.** A repository outside `index.publicRepos` adds nothing to the searchable domain, and a `grep` result from the current repo says nothing about it either way. So when a topic may live in a sibling repository and the answer found nothing, the 

  answer carries `cross-repo: not indexed` beside it: that records which surface was searched, and keeps an unsearched repository from reading as a settled absence.
```

**落点表（实施席逐处执行）**：

| # | 坐标 | 动作 |
|---|---|---|
| L1 | `thincoder-core/prompts/common.md:154` 之后 / `:155` 之前 | 插入 B1（`###` 标题 + 五段 · 前后各一空行）⇒ **+12 行 / +2,917 字符**（= 11 行内容 2,905 字符 + 12 个换行） |
| L2 | `thincoder-core/prompts/common.md:13-21`（先查档节）· `:152-153`（探索顺序两行）· `:166-191`（工具路由表）· `:178` | **零改**（K2：格言体与表行各守其形；分界句在 B1 首段末句一次说清） |
| L3 | `thincoder-core/tool-docs/doc_search.md` | **零改**（工具描述面不属本批；F4 的缺口由 B1 P2 的 why 承载） |
| L4 | `thincoder-core/prompts/persona-engineering.md` · `thincoder-core/prompts/discipline-engineering.md` · 其余 14 档 · `PROJECT-MANIFEST.json` · 产品代码 · 需求档 | **零改**（实施席不改 · K1 · K3） |

**对照表 · 与既有条款逐句对照（结论 = 零矛盾）**：

| 既有句 | 它管什么 | 本节管什么 | 为何不矛盾 |
|---|---|---|---|
| `thincoder-core/prompts/common.md:13-21` FR38「Check the docs before you ask」 | 提问之前：意图问人、事实查档；`A doc answers facts; intent gets asked` | 查文档时用哪个工具、覆盖什么面 | **相邻两轴**：同一节首行已把 `doc_search` 列进「先查档」清单；本节是那张清单的**执行形**（用谁查）。B1 首段末句显式分界 |
| `thincoder-core/prompts/discipline-engineering.md:42` FR39 三问（`none found: <which surfaces were checked>`） | 落笔前交答案：现成件在 ∥ 查无 | `doc_search` 空之后才 `grep`，「查无」要携面 | **同形不同题**：FR39 的 `none found:` 判「没查 vs 查无」；本节只把「哪个工具查的」写进同一个短语（`doc_search: none found`）——短语形态同源，记录面各一 |
| `thincoder-core/prompts/common.md:152-153` 探索顺序 | 从结构到意图到细节的顺序 | 文档面的工具边界 | **互补**：顺序句说「先 repo_outline 再 doc_search 再 code_search」；本节说这几步各覆盖什么。A 逐字零改 |
| `thincoder-core/prompts/common.md:166-191` 工具路由表 `:178` 行 | 工具择一（`doc_search` 用途 ∥ `grep` 的 bash 反面） | 两个搜索工具的选择判据 | **两轴**：表管「用工具还是用 bash」；本节管「两个工具各答哪类问题」。表零改（K2） |
| `thincoder-core/prompts/common.md`「Doc vs process」节 ∥「Batch record」节 | 状态住需求 / 设计档；过程住批次档，可整档删 | `grep` 命中过程档 = 线索不是结论 | **本节是那条纪律的执行形**：过程档可整档删 ⇒ 拿它当依据的那条依据会消失；B1 P4 复述「状态住状态档 · 批次档可整档删」= **关键锚点重复**（D-PS41 先例：各层须能独立阅读——删掉该句，P4 的「开它指向的状态档」就没有理由）；机制详述仍只住那两节 |
| `thincoder-core/prompts/common.md:131-136` ∥ `:138-150` 联网面两子节（`Search tool priority` ∥ `When online verification is required`；同属 `## Tool discipline` `:130-164`） | 联网搜索：工具优先级 ∥ 何时必查 | 文档搜索：发现 vs 定位 | **同族第三张**：`## Tool discipline` 的搜索工具选择面，联网两张、文档面一张 |
| `thincoder-core/prompts/common.md`「Evidence discipline」节 | 断言须 `file:line` 或 `unverified` | 跨仓未声明 ⇒ 携 `cross-repo: not indexed` | 同向：都在给「我没看到」和「那里没有」分野；本节把分野落到检索面 |
| `thincoder-core/tool-docs/doc_search.md` 正文 | 工具自述（用途 / 返回形态） | 检索面覆盖与不覆盖什么 | **工具描述面零改**（F4）：提示词面自带 why，读者不必依赖工具自述；两处不构成同一机制的两份描述 |
| `PROJECT-MANIFEST.json` `index.publicRepos = []` · `index.excludePaths` · `declaration.mjs:121-144`（面⑥） | 索引域与过程档排除的**实现** | 同一机制的**读者面**说明 | **实现 = 事实源，本节 = 读者面**：B1 P2 只写「声明域（多仓）vs 一个路径（默认本仓）」，P4 再写过程档在域外（次因）；段序列判据不复制 |

**用例表（正常 / 边界 / 错误）**：

| 编号 | 场景 | 输入 / 动作 | 期望 |
|---|---|---|---|
| C1 | 正常 · 发现式 | 「有没有关于离线队列的既有规范？」 | 首查 `doc_search`；命中设计档 ⇒ 直接引该节 |
| C2 | 正常 · 定位式 | 已知 `WRITE.md`，要 `write` 工具的实现行 | `grep` 直用，不先 `doc_search` |
| C3 | 边界 · `doc_search` 空 + `grep` 命中 | 术语只在批次档里出现过 | 答案携 `doc_search: none found`，并标明命中来自批次档 ⇒ 线索 |
| C4 | 边界 · 两工具都空 | 新话题，确无既有档 | 答案 = `doc_search: none found` + 已查面清单；可按三问判「已查无」 |
| C5 | 边界 · 命中 `_archive` | `grep` 命中 `**/_archive/**` 的旧设计 | 回状态档核；状态档无此规则 ⇒ 按「已废」处置，不引旧档 |
| C6 | 边界 · 跨仓未声明 | 话题可能住兄弟仓，答案为空 | 携 `cross-repo: not indexed`；不得把「grep 没扫到」写成「项目没有」 |
| C7 | 错误 · 用 grep 做发现（跨仓输入） | 话题不住本仓，开局 `grep -rn "<术语>" .` | 判结构性失明：`grep` 只拿到 cwd 一个路径，兄弟仓不在其内；应改走 `doc_search`，空则携 `cross-repo: not indexed` |
| C8 | 错误 · 兜底不声明 | 答案只写「没找到」，未写 `doc_search: none found` | 判「没查」——与「查过且没有」不可区分（与 FR39 同一判法） |
| C9 | 错误 · 拿批次档当口径 | 答案引批次档 §1 结论为现行规则 | 判 C4 反例：过程档可整档删 ⇒ 须回状态档；状态档无 ⇒ 记「已查无」 |
| C10 | 边界 · 工具名 | `doc_search` 在读者环境不可用 | 按工具表择替代并声明「doc_search 不可用」；本条不设硬编工具名兜底（同 `:149` 判法） |
| C11 | 错误 · 把自己没看到当成没有 | 本仓 `grep` 空结果 ⇒ 答「项目里没有这条规则」 | 判 C7 同形：跨仓可能未排除；答案须携 `cross-repo: not indexed`，不得把空结果升格为结论 |

**受影响文件（现行 = 本席 `node` 实读 · 2026-10-22；Δ = 本节逐字块实算）**：

| 文件 | 现行 | Δ → 改后 |
|---|---|---|
| `thincoder-core/prompts/common.md` | 292 行 / 46,256 字符 | L1：**+12 行 / +2,917 字符** ⇒ 304 行 / 49,173 |
| `docs/core/design/PROMPT-SYSTEM.md` | 本节写入前实读行数 / 字符数见批档 §2 | 本节 = 新增内容，读数随写入 |
| 其余提示词 15 档 · `tool-docs/**` · `PROJECT-MANIFEST.json` · `thincoder-core/**` 产品代码 · `scripts/**` · 需求档 | — | **±0**（实施席面；需求档 `:885` 1 行断言更正 = 父侧笔，行数不变） |

**验收（A1–A10 · 回指 §13.19 五条 + 批次验收 ①–⑤）**：

| # | 验收 | 判法 / 读数 |
|---|---|---|
| A1 | 需求 ① 两分法 | `thincoder-core/prompts/common.md` 内 `finding a document vs locating a line`（标题）· `**Discovery**` · `**Locating**` · `which repository holds it` 各 1 次 |
| A2 | 需求 ② 无命中要说 | `doc_search: none found` 恰 1 次；`An unstated fallback reads to the next person as` 1 次 |
| A3 | 需求 ③ 命中判线索 | `a lead, not a finding` 1 次；`batch records always stay out of the index` 1 次（批次档 · `declaration.mjs:144` 面⑥ 无条件）；`archived pages wherever the project declares them excluded` 1 次（归档页 · 项目 `index.excludePaths` 声明，缺省 `[]` · `manifest-schema.mjs:63`）；`turns a past round's draft into this round's standard` 1 次。路径字面量不判：B1 写跨项目成立的语义陈述，`docs/batches` 是本仓 manifest 值（`PROJECT-MANIFEST.json:23`），写死路径在别的项目为假 |
| A4 | 需求 ④ 跨仓 | `cross-repo: not indexed` 恰 1 次；`index.publicRepos` 2 次；`adds nothing to the searchable domain` 1 次 |
| A5 | 携 why（机制差写清 · 主轴 = 检索面） | `searches a declared domain` · `the one you hand it, the current repository by default` · `Other repos on this machine` · `structural limit across repositories` · `secondary cost next to the cross-repo blindness` 各 1 次；`whole tree` **零命中**（「扫全树」不得作为 grep 的主缺陷——两向各报 `node` 子串读数） |
| A6 | 无禁令腔 | B1 扫 `never\|do not\|don't\|must not\|may not\|forbidden` ⇒ **0**（本席预扫 0，`execute` 实测） |
| A7 | 零文档引用 · 机检 | `node scripts/prompt-refs-check.mjs` ⇒ 命中 0（基线 69 档 / 463 档 / 0）；B1 无 `.md` / 无 `§N` ⇒ J1/J2/J3 零对象；`doc_check(mode:"gate")` ⇒ PASS |
| A8 | 与 FR38 / FR39 零冲突 | `thincoder-core/prompts/common.md:13-21` 与 `thincoder-core/prompts/discipline-engineering.md:42` **逐字零改**（git diff 零）；B1 首段末句 `decides when to look; this subsection decides which tool looks` 1 次 |
| A9 | 计数连带（D3） | `thincoder-core/prompts/common.md` `##` 节数 **20 ⇒ 20** · 标题节点 **25 ⇒ 26** · h3 **5 ⇒ 6**（`node` 实读）；需求档 `### 2.3` 标题「thincoder-core/prompts/common.md 20 节」（`:64`）零改——大纲按 `##` 登记 |
| A10 | 需求验收 ② 前半（声明 `publicRepos` 后 `doc_search` 能命中兄弟仓） | **本批不可验**——阻塞于 FR41 ⑤ 未裁（`ENGINEERING-MODE-V2.md:883`）；本批只验「未声明」分支（A4） |

**体量读数（无帽 · 只读数）**：`thincoder-core/prompts/common.md` 现状 = 292 行 / 46,256 字符；B1 = 2,915 字符 / 11 行；改后 = 304 行 / 49,173 字符（+6.31%）。提示词面基线 = 69 档 / 代码面 463 档 / 命中 0。

**边界（本批不做）**：不改 `doc_search` 检索语义 · 不改既有排除规则（`declaration.mjs:121-144` 面⑥ 已正确）· 不改 `thincoder-core/tool-docs/doc_search.md` · **不改 `PROJECT-MANIFEST.json`**（需求第 5 条 = 配置面由用户裁，本批未裁 ⇒ B1 P5 按「未声明」边界写；待裁项见本节「上抛项」）

· 不禁 `grep`（定位式照用）· 不新增脚本 / CI 步 / 机判门 · 不改 `thincoder-core/prompts/common.md:13-21` ∥ `:152-153` ∥ 工具路由表 · 不改 FR38 三条 ∥ FR39 三问。

**需求档本批改写 1 行（父侧笔 · 实施席面之外）**：需求档 `ENGINEERING-MODE-V2.md:885` 经父侧在本批评审轮改写 1 行，现文断言「不带档类——实读 `thincoder-core/memory/docs.mjs:236-238`」，行数不变；L4 ∥ 受影响文件表的「零改 / ±0」= **实施席面**口径（实施席零写需求档）。

**关键决策**：

| # | 决策 | 理由 |
|---|---|---|
| K1 | 落 `thincoder-core/prompts/common.md` 同层新增 `###`（`## Tool discipline` 内 · `### Codebase exploration order` 之后） | 受众 = 两模式 + 全子代理 ⇒ 公共层恒第二位唯一全覆盖（同 D-PS36 / §6.42 K1）；`###` = 零 `##` 节计数连带（同 D-PS39 / D-PS40 判例）；同节已装联网面两张搜索选择子节，文档面正是缺的第三张 |
| K2 | `### Codebase exploration order` 正文**逐字零改**，新节紧随其下 | 那两行是「从哪起手」的记忆锚；把机制差塞进去即毁其形（§6.41 K2 的反向处置：整行替换只在同一机制时成立，这里是两条互补句） |
| K3 | 工具路由表**零改** | 表是工具→用途的索引，`Not` 列管的是 bash-vs-tool；本节管两工具分工。加注 = 一个单元格承载一段 why，读不出来的理由 |
| K4 | 双语字面：英文面 `doc_search: none found` / `cross-repo: not indexed`；中文记录面 `doc_search 已查无：` / `跨仓未纳入索引：` | 提示词面英文（全档同语），批档 / 台账 / 回复面中文；两形一词表（同 §6.41 K3 三形处置的镜像） |
| K5 | 主轴 = **检索面之差**（声明域、多仓 vs 一个路径、默认本仓），不写「禁止 grep 做发现」 | 用户令「知其然知其所以然」+ 10:06 裁「问题不是扫全树，是会忽略跨仓文本」：结构性失明本身就是理由；裸禁令不给读者判断新场合的能力（同 D-PS42 ①） |
| K6 | 「看不见」写成 **`unless your command already carries their absolute paths`**，不写「绝对查不到」 | 实读语义（`grep` 工具面 `path` 参数缺省 = cwd）：命令里带绝对路径就能读到兄弟仓副本 ⇒ 绝对化措辞为假；限定句同时把代价链讲准：模型**没有仓清单**，因而拿不到那条路径（10:06 原话「除非你已知绝对路径，否则完全不可见」） |

**先例 ∥ 偏离**：先例 = 本档 §6.41 / §6.42（逐字英文文本 + 落点表 + 对照表 + 用例表 + 验收 + 体量读数）∥ D-PS39 / D-PS40（`###` 子节、零 `##` 连带）∥ D-PS41（同族事实跨层各点一次）。
**对齐** = 同形制；why 在正文内；`###` 级新增；机判沿用 `prompt-refs-check` 与 `doc_check`。

**偏离** = ① 首次在 `## Tool discipline` 内以「新增 `###`」而非「既有节内增列」落一条搜索选择规则——既有两张子节各自是 `###`，本条与它们同级才成族（`###` 级新增的先例已在 D-PS39 / D-PS40）。

② 首次给「检索面」写正向判据（什么是发现、什么是定位），既有条款只有顺序与工具用途。③ 首次把「检索面」立为主轴，过程档在域外为次因——需求原验收 ① 只要求「两分法 + 已查无 + 线索」三句，主轴的依据 = 用户原话「grep的问题不是扫全树，是会忽略跨仓文本」；同时保留「路径已带绝对路径则可读」的限定句（K6），不把「看不见」写成绝对化。

**勘察证据行（本席直读 · 2026-10-22）**：

- `thincoder-core/prompts/common.md:13-21`（Check the docs before you ask）· `:43-48`（Evidence discipline）· `:251-259`（Batch record）· `:260-265`（Doc vs process）。
- `thincoder-core/prompts/common.md:130-164`（`## Tool discipline` 起止，下接 `:166` `## Tool routing`）· `:131-136`（Search tool priority）· `:138-150`（When online verification is required · `:149` 无硬编工具名句）。
- `thincoder-core/prompts/common.md:152-153`（Codebase exploration order 两行）· `:155-158`（Parallel call principles）· `:160-164`（Steering your own context）· `:166-191`（工具路由表 · `:178` doc_search 行）。
- `thincoder-core/tool-docs/doc_search.md` 全句（一句正文，无声明域 / 无排除 / 无跨仓）· `thincoder-core/tool-docs/grep.md:7` ∥ `thincoder-core/tools/search.mjs:93`（`path` 缺省 = cwd）⇒ B1 P2「一个路径」有据。
- `thincoder-core/declaration.mjs:81`（`index.publicRepos` 投影）· `:266-277`（`declaredPublicRoots`）· `:133-149`（`isExcludedRelPath`：面⑥ 段序列 + 面① 前缀）。
- `thincoder-core/memory/code-search.mjs:19-25`（`searchOrigins` = 项目 origin ∪ 声明公共仓）· `thincoder-core/memory/docs.mjs:28-32`（`docSync` 逐声明根同步）· `:112-131`（`docSearch` 一次调用按 origin 集过滤）⇒ B1 P2「声明域 · 一次提问」有据。
- `thincoder-core/memory/docs.mjs:236-238`（命中形 = `path > heading` + 行段 + relevance）· `thincoder-core/memory/code-index.mjs:203`（`language` = markdown / text / rst / asciidoc）⇒ 命中**不带档类**，「命中携档类」句无源，已删。
- `thincoder-core/prompts/common.md` 实读 = 292 行 / 46,256 字符 / 标题 25（`##` 20 · `###` 5）——`node` 实读。需求档 `docs/core/requirements/PROMPT-SYSTEM.md:64` `### 2.3 公共层（… thincoder-core/prompts/common.md 20 节）`。
- `node scripts/prompt-refs-check.mjs` 零参读数 = 提示词面 69 档 · 代码面 463 档 · 命中 0。
- `PROJECT-MANIFEST.json:61` `index.publicRepos = []` · `:57-60` `index.excludePaths` 含两处 `_archive` · `:23` `docRoot.batches = docs/batches`。
- 本档 §6.41 ∥ §6.42（形制与相邻节）· 需求档 §13.16（FR38，`:809-822`）∥ §13.17（FR39，`:826-843`）∥ §13.19（FR41，`:864-887`）· 本批批次档 §1。
- 工作目录内无独立公共源文档仓（`index.publicRepos = []`）——已查，无相关。

**UI / 交互决策**：无界面面——本条只改模型可见提示词文本。

**上抛项（待裁）**：FR41 ⑤ = `index.publicRepos` 是否声明（`ENGINEERING-MODE-V2.md:883`）——配置面，用户未裁；`PROJECT-MANIFEST.json` 零改，B1 P5 按「未声明」边界写。解除条件 = 用户裁定：声明 ⇒ 另开配置面批次补声明，并补验 A10；不声明 ⇒ A10 保持不可验。本项由父侧落台账。

### 6.44 推断不许当事实（依据的可判界 + 决定面携依据 · FR43）

**来源**：需求权威 = `docs/core/requirements/ENGINEERING-MODE-V2.md` §13.21（FR43——三条约束 + 落点 + 两条验收，`:940-952`）；台账 `#1732`；本批批次档 §1。

用户 2026-10-22 11:39「当项目大的时候，agent 经常出拿推断当事实的问题」；11:44 否掉「本会话内」这个界（会话会被压缩 / 重启 / 被子代理绕开）；11:45 定「只有当轮读有意义」；11:47「关键的位置加少量关键约束」；2026-10-22 补令「补」：提问面（`## Check the docs before you ask`）的 checked-evidence 行接同一条形——第三处落点。

⇒ 缺的不是「要么给 `file:line`、要么标 `unverified`」这句——`thincoder-core/prompts/common.md:44-46` 已有。缺的是**可判的界**：什么叫「读过」（本轮 · 整行 · 抄得一致）· 什么叫「线索」（摘要 / 子代理回报 / 长期记忆）· 哪里必须带依据（五个决定面）。

**要做的那一处（实读 · 2026-10-22 本席）**

| # | 坐标 | 现文 | 缺的那一半 |
|---|---|---|---|
| F1 | `thincoder-core/prompts/common.md:43-48`（`## Evidence discipline`） | 断言须可核（`file:line`）或明标 `unverified`；来源只有两个：读到的 / 明标 | 「读到的」没有可判形——上一轮读过、摘要里读过、记忆里有，都能自称「读到的」 |
| F2 | `thincoder-core/prompts/advisor-round1.md:46-59`（R1–R8） | 覆盖文档矛盾 / 设计偏离 / 已定裁决 / 脆弱测试 / 协调项 / 测试缝 / 文档状态 / 业务门兜底 | 无一条问「这个决定面的依据在哪」——评审读到结论就评结论，依据缺了没人点名 |
| F3 | `thincoder-core/prompts/common.md:13-21`（`## Check the docs before you ask` · checked-evidence 句在 `:19`） | 要求「`file:line` + key text」；查无写「checked, nothing relevant」 | key text 没有可判形——只挂指针时，「我查了」与「我记得」在提问面分不清；查无时未点名查面 ⇒「这个查询没命中」与「没有」同形 |

**机制（三条 + 一条界 · 提问面同一形）**

1. **依据 = 本轮读到的整行，抄得与现文一致**：轮有硬边界（一条用户消息到一条回复），抄下的整行能被复核者对着现档复读；抄不出就写 `unverified`。
   **为什么是「本轮」不是「本会话」**：会话会被压缩 / 重启 / 被子代理绕开——界划不出来；轮有硬边界，复核者的读面天然按轮对齐。
2. **摘要、子代理回报、长期记忆是线索，不是依据**：三者都是派生物，原档一改就过时，而派生物不会自己说「我过时了」。拿它做决定前回原档重读；原档够不着 ⇒ 标 `unverified`。
   **线索不是废纸**：它指出该去哪儿找，而找对地方是查证的大半——废掉线索等于让搜索从零开始。
3. **决定面必须带依据**：设计取舍 · 验收 · 收口 · 派单任务书 · 评审结论五处。复核只能复核有形的东西；决定面错了要重做，其余错了改一句话。
4. **界（口径拆分，不是放宽）**：「非决定面可以不标」= **本条只伸到五个决定面**；`thincoder-core/prompts/common.md:44-46` 的总则不放宽（每一句断言仍要么可核、要么标 `unverified`）。一句话被引用进决定面，就按决定面的要求办——依据随话走。
5. **提问面同用这条形**：`## Check the docs before you ask` 的 checked-evidence 行要求「`file:line` + key text」——key text 就是第 1 条的形：本轮读到的那一行逐字抄；查无时点名查了哪个面，免得「这个查询没命中」被读成「没有」。

**逐字英文文本（实施席照此落笔 · 唯一权威目标形）**

B1 — `thincoder-core/prompts/common.md`：`## Evidence discipline` 段内，`:48`（`**Take evidence only for the assertions you are about to make**…` 那一行）之后、空行 `:49` 之前，追加三段；现有四句逐字零改（见 L2）：

```text
**Evidence is a line you read this turn, quoted as it stands.** Copy the whole line from the open file, character for character, so a reviewer can put your quote beside the file and read the same text. A turn is the unit with a hard edge — one user message to one reply — so a line quoted from it 

  stays checkable; what you read in an earlier turn is memory by the time you write, and memory and inference look the same from outside. Where the line cannot be quoted, `unverified` is the mark.

**A summary, a subagent's report and a memory entry are leads, not evidence.** Each is a copy of something else, made earlier: the source can change afterwards, and the copy will not announce that it went stale. Before a decision rests on one, go back to the source and read the line; where the 

  source cannot be reached, mark `unverified`. Leads keep their value — they say where to look, which is most of the search.

**A decision carries its evidence in writing** — a design choice, an acceptance call, a closeout, a dispatch task book, a review finding. Those five are where someone acts on what you wrote: a missing line there costs a redo, while elsewhere a wrong sentence costs one correction. This rule reaches 

  no further than those five; a claim carried into one of them answers to the rule where it now sits.
```

B2 — `thincoder-core/prompts/advisor-round1.md`：R8 行（现盘 `:59`）之后、`Source:` 行（现盘 `:60`）之前，插入一行（表格体例同 R1–R8：`R号 判据 → 严重度（处置）`）：

```text
R9 Decision surface without evidence → 🟡 — a design choice, an acceptance call, a closeout claim, a dispatch task book or a review finding resting on a fact with no line quoted from a read this round: a reader acts on it, so the missing line is where a redo starts (report the claim and the line 

  that should carry it — the author supplies the quote).
```

B3 — `thincoder-core/prompts/common.md:19`（`## Check the docs before you ask` 段内 checked-evidence 句）：**原位替换该行**，同段前后句零改：

```text
**Carry the checked-evidence line when you ask (both directions follow this)**: the **checked-evidence line** = which docs / design precedents were checked (`file:line` plus the key text — the line you read this turn, copied verbatim; a pointer alone leaves "I checked it" and "I remember it" reading the same); where the check found nothing relevant, write "checked, nothing relevant" and name the surface you checked — a query that missed and a surface with nothing on it otherwise read the same.
```

**中文复核面（与英文面同一语义 · 供人复核，不入提示词）**

- **依据 = 本轮读到的那一行，抄得与现文一致。** 从打开的文件里整行抄下来，一字不差——复核者把引文放回文件旁边，读到的是同一段文字。轮有硬边界（一条用户消息到一条回复），所以本轮抄下的行能被对上；上一轮读过的只剩记忆，而从外面看，记忆与推断长得一样。抄不出这一行，就写 `unverified`。
- **摘要、子代理回报、长期记忆是线索，不是依据。** 三者都是早先做出来的副本：原档可以在这之后改动，副本不会自己说它过时了。要让一个决定落在它上面，先回原档读那一行；原档够不着，就标 `unverified`。线索仍然有用——它告诉你该去哪儿找，而找对地方是查证的大半。
- **决定面把依据写在明面上**——设计取舍、验收、收口、派单任务书、评审结论。这五处是有人照着你的字去行动的地方：这里缺一行，代价是重做；别处写错一句，代价是改一句话。本条不伸到五处之外；一句话被引用进五处之一，它就按所在处的要求办。
- **R9（判据中文）**：决定面无依据 ⇒ 🟡——设计取舍 / 验收 / 收口 / 派单任务书 / 评审结论里的事实断言，拿不出本轮读到的那一行：读者是照着它行动的，缺的那一行就是返工的起点（评审点出这句断言与该由哪一行承载，引文由作者补）。
- **提问面的 checked-evidence 行按同一条形**：`file:line` 配上本轮读到的那一行逐字抄录——只挂指针，「我查了」与「我记得」在提问面读起来一样；查无则写「checked, nothing relevant」并点名查了哪个面——没查与查到空，否则同形。

**落点表（实施席逐处执行）**

| # | 坐标（实测 · 2026-10-22） | 动作 | Δ |
|---|---|---|---|
| L1 | `thincoder-core/prompts/common.md:48` 之后 / `:49`（空行）之前 | 追加 B1 三段（**每段一整行**；前导空行 + 3 内容行 + 2 段间空行；段末接既有空行 `:49`） | +6 行（读数 · 不作验收条） |
| L2 | `thincoder-core/prompts/common.md:43-48`（标题 + 现有四句） | **零改**（逐字保留；B1 只在其下追加） | ±0 |
| L3 | `thincoder-core/prompts/advisor-round1.md:59`（R8）之后 / `:60`（`Source:`）之前 | 插入 B2 一行 | +1 行 |
| L4 | 其余 14 档提示词 · `thincoder-core/tool-docs/**` · `scripts/**` · 产品代码 · 需求档 | **零改** | ±0 |
| L5 | `thincoder-core/prompts/common.md:19` | **原位替换**该行（同段前后句零改） | ±0 行 / +238 字符 |

**落地形态与逐字判等**：B1 三段各落**一整行**（前导空行 1 + 三段各 1 行 + 段间空行 2）；围栏块（`:2777-2784`）的折行只为本档行宽、不作落地基线——逐字判等按 §6.1「去折行后的段」比对：围栏内的换行连起来，逐段比。**行数不作断言**：+6 行与 310 行只是排版读数，不是验收条——行数是排版副产品，验收与判据都指向读者，不指向计数器。

**对照表 · 与既有六条口径逐句对照（结论 = 零冲突）**

| 既有口径 / 条款 | 它管什么 | 本节管什么 | 为何不冲突 |
|---|---|---|---|
| 不要求全读（既有 `:44` 与 `:48`） | 只对本席将要下的断言取证；不预读无关代码 | 一条依据的形（本轮 · 整行 · 抄得一致） | 同向：本节只限定「一条依据长什么样」，不加读量；一句一行的取证仍是原量 |
| 不取消 `unverified`（既有 `:44-46`） | 核不到就明标 | 抄不出 / 原档够不着 ⇒ 标 `unverified` | 本节两处都把 `unverified` 作为出口，明标仍是最低合法形 |
| 摘要非废纸 | —— | 摘要 / 回报 / 记忆 = 线索 | B1 第二段末句写明线索的价值（指出该去哪儿找）；本节只否定它作依据，不否定它作导航 |
| 提问面 checked-evidence 行（`:19`） | 要求 `file:line` + key text；查无写「checked, nothing relevant」 | key text 的形 = 本轮逐字一行；查无点名查面 | 同向：给既有要求定形，不加新要求；「查过」与「记得」在提问面就此可分 |
| 无机械门 | —— | —— | 本节零脚本 · 零 schema · 零 CI；`prompt-refs-check` 只是既有常驻锁，判的仍是有无文档引用 |
| 既有四句零改（本批边界） | `thincoder-core/prompts/common.md:44-48` 四句 | 只在其下追加 | L2 = 零改；替代关系 = 无（不需要删改任何既有句） |

**用例表（正常 / 边界 / 错误）**

| 编号 | 场景 | 输入 / 动作 | 期望 |
|---|---|---|---|
| C1 | 正常 · 本轮引用 | 设计取舍里引一条本轮读到的行 | 引文与现档逐字对上；复核者可复读 |
| C2 | 边界 · 跨轮 | 决定要用的那行是上一轮读的 | 回档重读；不重读 ⇒ 标 `unverified` |
| C3 | 边界 · 摘要 | 摘要写「X 已实现」 | 作决定依据前回原档读那一行；原档不可达 ⇒ `unverified` |
| C4 | 边界 · 子代理回报 | 回报称「验收 6/6 绿」，父侧要写收口 | 复跑一遍取读数，或写明「据子代理回报」 |
| C5 | 错误 · 记忆当读 | 写「已知该接口返回…」并挂一个 `file:line` | 判口径错：该行须本轮实读；否则改标 `unverified` |
| C6 | 错误 · 决定面无依据 | 设计档断言「现有实现已支持」，无行号 | R9 = 🟡：点名断言与该由哪一行承载 |
| C7 | 边界 · 非决定面 | 探索笔记里一句未核断言 | 本条不追（总则仍要求核或标 `unverified`） |
| C8 | 边界 · 提问面查无 | 问之前查了设计档、无相关 | 携「checked, nothing relevant」+ 点名查过的面（设计档 / 需求档 / 代码） |
| C9 | 错误 · 提问面只挂指针 | 只写 `file:line` 不抄行 | 判「我记得」与「我查了」不可分：key text 须本轮逐字抄录 |

**受影响文件（现行 = 本席 `node` 实读 · 2026-10-22；Δ = 本节逐字块实算）**

| 文件 | 现行 | Δ → 改后 |
|---|---|---|
| `thincoder-core/prompts/common.md` | 304 行 / 49,173 字符（`##` 20 · `###` 6） | L1：**+1,312 字符** · L5：**+238 字符** ⇒ 50,723 字符；行数（+6 ⇒ 310）只作排版读数、不作验收条 |
| `thincoder-core/prompts/advisor-round1.md` | 63 行 / 12,070 字符（`^R\d+[a-z]? ` 12） | L3：**+1 行 / +352 字符**（351 + 行尾换行；UTF-16）⇒ 64 行 / 12,422；`^R\d+[a-z]? ` 13 |
| 其余 14 档 · `tool-docs/**` · 产品代码 · `scripts/**` · 需求档 | — | ±0 |

**验收（A1–A9 · 回指 §13.21 两条验收 + 本批 ④ ⑤）**

| # | 验收 | 判法 / 读数 |
|---|---|---|
| A1 | 需求三条在英文面（验收 ①） | 三串各 1 次：`Evidence is a line you read this turn, quoted as it stands` · `are leads, not evidence` · `A decision carries its evidence in writing` |
| A2 | 需求落点二（验收 ②） | `thincoder-core/prompts/advisor-round1.md` 含 `R9 Decision surface without evidence → 🟡` 恰 1 次；`^R\d+[a-z]? ` 计数 12 ⇒ 13 |
| A3 | why 三条写进正文 | `A turn is the unit with a hard edge` · `will not announce that it went stale` · `costs a redo, while elsewhere a wrong sentence costs one correction` 各 1 次 |
| A4 | 六条口径零冲突 | B1 扫 `whole document\|read everything\|all files` ⇒ 0；`unverified` 2 次；`Leads keep their value` 1 次；无脚本 / 无 schema 改动（`git diff --stat` 零 `scripts/` `thincoder-core/` 非提示词面） |
| A5 | 既有四句零改 | `thincoder-core/prompts/common.md:44-48` 逐字对读（改前改后各取该四行）⇒ 全等；`thincoder-core/prompts/advisor-round1.md:46-59`（R1–R8）⇒ 全等 |
| A6 | 禁令腔零新增 | B1 + B2 扫 `never\|do not\|don't\|must not\|may not\|forbidden` ⇒ 0（`execute` 实测） |
| A7 | 文档引用零新增 | `node scripts/prompt-refs-check.mjs` ⇒ 命中 0（基线：提示词面 69 档 · 代码面 463 档 · 0）；B1 / B2 无 `.md` / 无 `§N` ⇒ J1/J2/J3 零对象 |
| A8 | `doc_check` | 改后实跑：`doc_check(mode:"gate", docs=["docs/core/design/PROMPT-SYSTEM.md"])` ⇒ `DOC-CHECK GATE: PASS` · 0 命中（anchors 0 / width 0 · 2026-10-22 实测）；本批新增内容零命中 |
| A9 | 提问面（落点三） | `thincoder-core/prompts/common.md:19` 含 `the line you read this turn, copied verbatim` 恰 1 次 · `name the surface you checked` 恰 1 次；`:13-18` / `:20-21` 逐字对读 ⇒ 全等；该行扫 `never\|do not\|don't\|must not\|may not\|forbidden` ⇒ 0 |

**计数连带（D3）**：`thincoder-core/prompts/common.md` `##` **20 ⇒ 20** · 标题节点 **26 ⇒ 26** · `###` **6 ⇒ 6**（`node` 实读 · 2026-10-22）；需求档 `docs/core/requirements/PROMPT-SYSTEM.md:64` 节表标题「`thincoder-core/prompts/common.md` 20 节」**零改**（节表按 `##` 登记）。本节零 `##` / 零 `###` 新增 ⇒ 四项一账。

**体量读数（无帽 · 只读数）**：`thincoder-core/prompts/common.md` 304 → 310 行（+6 行 / +1,550 字符 = L1 1,312 + L5 238）；`thincoder-core/prompts/advisor-round1.md` 63 → 64 行（+1 行 / +352 字符）；两档合计 +7 行 / +1,902 字符；提示词面基线 = 69 档 / 代码面 463 档 / 命中 0。

提示词面无预算帽（2026-10-21 裁定 · D-PS42 ③），本节只留读数、不设上限；行数不作验收条——排版副产品，验收与判据指向读者，不指向计数器。

**边界（本批不做）**：不新增提示词文件 · 不改 `thincoder-core/prompts/common.md:44-48` 既有四句 · 不改 `## Check the docs before you ask` 段其余句（`:13-18` / `:20-21`；L5 只换 `:19` 一行）· 不改 `thincoder-core/prompts/advisor-round1.md` R1–R8 · 不改 `thincoder-core/tool-docs/**` · 不新增脚本 / CI / 机判门 · 不落英文（英文面 = eng-coder 实施轮）· 不改需求档。

**关键决策**

| # | 决策 | 理由 |
|---|---|---|
| K1 | 三条落 `thincoder-core/prompts/common.md` 既有 `## Evidence discipline` 段内追加，不新增节 | 同一个机制（证据纪律）已在那一节；受众 = 两模式 + 全子代理 ⇒ 公共层恒第二位是唯一全覆盖面。追加 ⇒ 零 `##` 节连带（20 ⇒ 20），不牵动需求档锁定的节表 |
| K2 | 写成「规则 + 后果」的正向句，不写禁令 | 用户 11:47「少量关键约束」+ 既有 §6.32 / D-PS42 判据：禁令不给读者判断新场合的能力；后果句（返工 vs 改一句话）自带判据 |
| K3 | 「轮」的界写进句子本身（`one user message to one reply`），不另立定义段 | 定义段是第三条外的开销；句子自带边界，读者当场能判「这是本轮读的吗」 |
| K4 | R9 只判评审对象里的决定面，不重判评审自己的引文 | 评审自己的 `file:line` 已有宿主机检（`thincoder-core/prompts/advisor-round1.md:43-44` 现行句），再加一条 = 同一机制两处判、两处漂 |
| K5 | 「非决定面可以不标」按「本条只伸到五面」落，不落成放宽总则 | `thincoder-core/prompts/common.md:44-46` 的总则要求每一句断言可核或明标；把它读成「非决定面免标」= 静默取消总则（用户验收 ④「不取消 unverified」） |
| K6 | 摘要在链上保留「线索」地位，并写明价值 | 用户验收 ④「摘要非废纸」；只否定作依据，不否定作导航——否则模型会把摘要整块丢掉，损失的是搜索方向 |
| K7 | 提问面 = `thincoder-core/prompts/common.md:19` **原位替换一行**，不新增句 | 该句就是「我已查过」这句断言的落点；只挂指针时 key text 无判形 ⇒「查过」与「记得」同形。原位替换 = ±0 行、零节连带，第 1 条整段也不复制到提问面（D2：机制详述仍在 `## Evidence discipline`） |

**先例 ∥ 偏离**：先例 = 本档 §6.42（B1 落 `thincoder-core/prompts/common.md` 既有节内追加 · B2 落 `thincoder-core/prompts/advisor-round1.md` 新 R 行）· §6.43（逐字英文块 + 落点表 + 对照表 + 用例表 + 验收 + 体量读数）∥ D-PS42 ③（体量只读数）。
**对齐** = 同形制；英文面逐字给全；机判沿用 `prompt-refs-check` 与 `doc_check`。

**偏离** = ① 三条写成三段，不沿用同族 bullet 形（被偏离的既有形 = §6.17 `:417-421` 五笔清单 ∥ §6.10 `:288-289` 两条 bullet）——段内可携 why，且模型在写断言那一刻读到的是完整的一句判断，不是清单碎片；② 首次把「证据的形」立为规则（本轮 / 整行 / 抄得一致），既有条款只要求「可核」而不说可核的形；③ 首次把同一形接到提问面（`:19` 原位替换）——提问是「我已查过」这句断言唯一的落点。

**勘察证据行（本席直读 · 2026-10-22）**

- `thincoder-core/prompts/common.md:13-21`（`## Check the docs before you ask`：`:13` 节标题 · `:14-18` 五句 · `:19` checked-evidence 句 · `:20-21` 尾两句）——L5 原位替换 `:19`，其余七句零改。
- `thincoder-core/prompts/common.md:43-48`（`## Evidence discipline` 标题 + 四句；`:43` 节首 · `:44-46` 总则与两来源 · `:47` 空行 · `:48` 现取现用句 · `:49` 空行 · `:50` `## Business gates` 下一节首）。
- `thincoder-core/prompts/advisor-round1.md:46-60`（`:46` 判据节标题 · `:47` 套用句 · `:48` R1 · `:49` R2 · `:50` R3 · `:51` R4 · `:52` R5 · `:53` R6 · `:54` R7a · `:55` R7b · `:56` R7c · `:57` R7d · `:58` R7e · `:59` R8 · `:60` `Source:` 行）· `:43-44`（宿主机检与连续子串引文句）。
- `thincoder-core/prompts/common.md` 实读 = 304 行 / 49,173 字符 / `##` 20 · `###` 6；`thincoder-core/prompts/advisor-round1.md` = 63 行 / 12,070 字符 / `^R\d+[a-z]? ` 12（`node` 实读）。
- `node scripts/prompt-refs-check.mjs` 零参读数 = 提示词面 69 档 · 代码面 463 档 · 命中 0。
- `doc_check` 读数（本档整档入判）：**gate = `PASS` · 0 命中**（anchors 0 / width 0）——存量裸名指针已按台账 `#1731` 清完（父侧 2026-10-22 机械补全）；行宽命中 0 ⇒ 本节行宽安全线 = 300 字符。
- 需求档 §13.21（`docs/core/requirements/ENGINEERING-MODE-V2.md:940-952`）· 本档 §6.42 ∥ §6.43 ∥ §7 D-PS42 ∥ D-PS43 · 本批批次档 §1。
- 工作目录内无独立公共源文档仓（`index.publicRepos = []`）——已查，无相关。

**UI / 交互决策**：无界面面——本条只改模型可见提示词文本。

**上抛项（待裁）**：无（存量裸名指针已清，gate 全档 PASS 达成）。

### 6.45 提示词面一条规则一行（16 档重写 · 两舱推进 · FR46）

**来源**：需求权威 = `docs/core/requirements/ENGINEERING-MODE-V2.md` §13.24（FR46——背景 / 改法 / 三条手法 / 内容边界 / 判据 / 两舱 / 实施顺序四步 / 先例∥偏离 / 勘察证据行 / 不做 / 验收四条，`:1000-1048`）。
相邻判据 = 同档 §13.23（FR45——文档面量段、提示词面量行，`:978-995`）；台账 `#1735`；本批批次档 §1。

用户 2026-10-22 12:28：「你让一个 MoE 模型去看一端 3000 多字的提示词，它能看明白啥？」12:31「改法对，就照这个来」。

⇒ 缺的不是「把长行折断」——折行只改源码排版，模型读到的块不变。
缺的是把一行里挤着的七八件事重新写开：规则、条件、例外、理由各占一行，行首一个短语点题。

**要做的那一处（实读 · 2026-10-22 本席）**：

| # | 坐标 | 现文 | 缺的那一半 |
|---|---|---|---|
| F1 | `thincoder-core/prompts/` 16 档（逐档见落点表） | 290 行超过 300 字符 | 一条规则与它的理由 / 例外 / 反例挤在同一行，靠分号串联；模型一次前向同时面对多件事，哪句是规则没有边界 |
| F2 | `thincoder-core/prompts/persona-engineering.md:104` | 1,486 字符一行（closing ledger sweep） | 同上；且这是 16 档最长行，改写样板取自这一行 |
| F3 | 本档六处（`:476` `:627` `:653` `:2818` `:2849` `:2870`） | 三族口径把提示词行排除在行宽判据之外（族名与逐处处置见连带项 C 表） | 与 FR46 相抵：提示词面受行界约束、一条规则一行 |

**机制（为什么行长会伤执行）**：

1. **模型读的是原始文本，一行 = 一个块**：文档面由人读渲染结果，相邻非空行并成一段，所以量段；提示词面没有渲染层，一行就是模型看到的一个块，所以量行。两面「块」的定义不同，理由在读者（需求 §13.24 已定，本节承接不重述）。
2. **长行把判断成本转给读的人**：一条规则常与理由、例外、反例写在同一行，靠分号串起来；写的人一次想说完，读的人在一次前向里同时面对七八件事。行长越界只是症状；真正的代价是模型按印象办事。
3. **折行治不了这个病**：在长行里插回车只改源码行数，文字一字未变，模型读到的块还是同一团（FR45 验收 ② 已把「段中插换行判定不变」立为机判）。改法是**重写**，不是折行，也不是切段。
4. **重写要保住四类内容**：规则、条件、例外、理由必须保留，改写前后逐条对得上；指代、装饰性加粗、自我限定可以删——样板删掉「the dual of the opening self-check」就是按这条办的，它是指代，不是内容。
5. **理由单独一行，以 `Why` 起头**：理由跟着规则，只是独立成行——读者先读到规则，再读它为什么成立；理由埋在规则句里，读者要么跳过它，要么把整句当规则背下来（样板末行即此形）。

**三条手法（对没见过的行也适用）**：

1. **每个处置给一个词，词后紧跟一句定义**：词是检索单元，定义只解释这个词（样板第 2 行：`settled` / `withdrawn` / `blocked` 各跟一句）。
2. **加粗只落在每行的题眼上**：满行加粗等于没有重点（样板每行恰一处加粗）。
3. **需要回查的指代要改写或删除**：读的人拿不到「那条规则就在附近」的保证。

**逐字围栏块（样板 · `thincoder-core/prompts/persona-engineering.md:104` 的改写结果 · 六行 · 逐行读数见体量读数）**：

```text
- **Closing ledger sweep**: sweep the ledger before declaring a batch closeout done — and at session close, when the user says so.
- **Every entry leaves the sweep with a disposition**: settled (the work landed, so walk it to closure), withdrawn (its premise is gone, or it is superseded or duplicate), or blocked with the reason on the record.
- **A blocked entry carries a condition, not a word**: "file it under a batch", "later" and "pending ruling" are not conditions; a condition names what blocks the entry and the trigger that clears it.
- **The sweep is a check, not a reading**: take each entry's coordinate — its `file:line` or the symbol it names — and actually look at it; an entry whose object is gone is settled on the spot, since carrying it forward leaves a false task on the list.
- **"It stays on the list" is not an outcome**: a stale entry sitting for weeks is the defect this sweep exists to kill, and "looks open" is not evidence, so the check is not skipped.
- **Why**: a menu of dispositions gives every entry a way to be excused, and the pool only grows; the closeout is the zero-extra-trip moment to keep it honest. The report carries the reading — unsettled before → after, rows touched — so "was the ledger cleaned" is checkable, not a claim.
```

**落点表（两舱逐档 · 实施席按波推进：样板档单波先行，其余每席一到两档）**：

| 舱 | 档 | 超 300 字符行数 | 最长行 |
|---|---|---|---|
| 甲 | `thincoder-core/prompts/persona-engineering.md` | 78 | 1,486 @`:104` |
| 甲 | `thincoder-core/prompts/discipline-engineering.md` | 48 | 1,389 @`:42` |
| 甲 | `thincoder-core/prompts/discipline-normal.md` | 28 | 756 @`:54` |
| 甲 | `thincoder-core/prompts/persona-eng-designer.md` | 22 | 934 @`:35` |
| 甲 | `thincoder-core/prompts/persona-eng-coder.md` | 4 | 885 @`:19` |
| 甲 | `thincoder-core/prompts/persona-normal.md` | 3 | 422 @`:21` |
| 甲 | `thincoder-core/prompts/persona-coder.md` | 1 | 386 @`:8` |
| 甲 | `thincoder-core/prompts/persona-explore.md` | 0 | 152 @`:14` |
| 甲 | `thincoder-core/prompts/persona-plan.md` | 0 | 217 @`:23` |
| 乙 | `thincoder-core/prompts/common.md` | 51 | 1,003 @`:271` |
| 乙 | `thincoder-core/prompts/advisor-design.md` | 15 | 661 @`:22` |
| 乙 | `thincoder-core/prompts/advisor-round1.md` | 13 | 859 @`:59` |
| 乙 | `thincoder-core/prompts/advisor-round3.md` | 13 | 771 @`:60` |
| 乙 | `thincoder-core/prompts/advisor-round2.md` | 12 | 771 @`:64` |
| 乙 | `thincoder-core/prompts/consult-base.md` | 2 | 706 @`:5` |
| 乙 | `thincoder-core/prompts/subagent-base.md` | 0 | 274 @`:14` |

**舱合计（D3）**：甲舱 9 档 / 184 行 >300；乙舱 7 档 / 106 行 >300；合计 16 档 / 290 行（逐行相加）。
**推进次序（需求 §13.24「实施顺序」四步 · 硬前置，不许跳；甲舱先行不变）**：

1. **第一步 · 样板波**：由一个实施席单独改完 `thincoder-core/prompts/persona-engineering.md`（78 行 >300，16 档里最长那档），交「改前 / 改后」对照与本档行长读数；父侧逐行核、用户过目后才开下一波。
   这一档从此是往后每一档的比对样板——比对基准 = 本节「逐字围栏块」的写形（一条规则一行 · 题眼加粗 · 条件与例外在规则之后 · 理由以 Why 起头），样板六行即其落地形态。
   Why 单做一档：重写是语义活，四个实施席会读出四种理解；样板没定就铺开，四份产物会长得不一样——提示词里的「不一样」不是风格问题，是模型每次执行读到的东西不同。
2. **第二步 · 分波并行**：样板经用户确认后，其余 15 档按舱推进；单波不超过引擎容量（`eng-coder` 并发 4），每席一到两档（甲舱余 8 档 ⇒ 4 席 × 2 档；乙舱 7 档 ⇒ 4 席 × 2/2/2/1 档）。
   每份任务书带同一张尺子：行首短语点题 · 条件与例外在规则之后 · 理由独立成行且以 Why 起头 · 加粗只落在题眼；红线 = 规则 / 条件 / 例外 / 理由四类内容不得丢。
3. **第三步 · 横切检查**：并行段结束后由父侧跑一次——逐档干净不等于整体一致：① 一次性脚本量 16 档逐行 ≤300；② 每档抽前 10 行比对形态是否同构（题眼加粗 + 冒号定义）；③ 逐档收「原文行 → 新行」四列映射表，父侧抽查最长的那几行。
4. **第四步 · 独立复查**：全部改完（或每舱改完）后单独走一轮，不与被改的那一轮合并；复查由没参与改写的人做（评审席或独立 explore），产出按行给读数，父侧抽查其中最长的那几行。
   查五类：① 改坏了没有（逐档抽最长十行对读四类内容）· ② 有没有长出原文没有的约束（按缺陷算，不按润色算）· ③ 形态是否同构 · ④ 指代有没有留活口 · ⑤ 口径不一致处按判据句族全仓扫（提示词面是否受行界约束 · 行数是否作断言 · 操作数是否算指针）。

**舱与批（D3）**：舱 = 批次边界（单舱 ≤15 档，需求 §13.24「16 档分两批」）；**派单单位 = 波，不是舱**（样板一波 · 其余每席一到两档分波）。甲舱批 = 本批（本节 = 其设计，§5 = 甲舱 9 档的语义对账映射表）；乙舱批另起一份批次档（其 §2 引本节，§5 = 乙舱 7 档映射表）。甲舱批各波跑完再开乙舱批，同一时刻在跑的实施席不超过本机 engCoder 并发（12）。

**受影响文件表（现行 = 本席 `node` 实读 · 2026-10-22 · 行 / 字符 / >300 / 最长行）**：

| 文件 | 行数 | 字符数 | >300 字符行数 | 最长行 | 预期改后 |
|---|---|---|---|---|---|
| `thincoder-core/prompts/persona-engineering.md` | 248 | 66,324 | 78 | 1,486 @`:104` | >300 = 0 · 最长 ≤300 · 行数上浮 |
| `thincoder-core/prompts/common.md` | 310 | 50,723 | 51 | 1,003 @`:271` | >300 = 0 · 最长 ≤300 · 行数上浮 |
| `thincoder-core/prompts/discipline-engineering.md` | 204 | 39,858 | 48 | 1,389 @`:42` | >300 = 0 · 最长 ≤300 · 行数上浮 |
| `thincoder-core/prompts/discipline-normal.md` | 263 | 38,535 | 28 | 756 @`:54` | >300 = 0 · 最长 ≤300 · 行数上浮 |
| `thincoder-core/prompts/persona-eng-designer.md` | 89 | 18,574 | 22 | 934 @`:35` | >300 = 0 · 最长 ≤300 · 行数上浮 |
| `thincoder-core/prompts/advisor-design.md` | 77 | 12,634 | 15 | 661 @`:22` | >300 = 0 · 最长 ≤300 · 行数上浮 |
| `thincoder-core/prompts/advisor-round1.md` | 64 | 12,422 | 13 | 859 @`:59` | >300 = 0 · 最长 ≤300 · 行数上浮 |
| `thincoder-core/prompts/advisor-round3.md` | 60 | 11,217 | 13 | 771 @`:60` | >300 = 0 · 最长 ≤300 · 行数上浮 |
| `thincoder-core/prompts/advisor-round2.md` | 64 | 11,288 | 12 | 771 @`:64` | >300 = 0 · 最长 ≤300 · 行数上浮 |
| `thincoder-core/prompts/persona-eng-coder.md` | 38 | 6,073 | 4 | 885 @`:19` | >300 = 0 · 最长 ≤300 · 行数上浮 |
| `thincoder-core/prompts/persona-normal.md` | 49 | 6,471 | 3 | 422 @`:21` | >300 = 0 · 最长 ≤300 · 行数上浮 |
| `thincoder-core/prompts/consult-base.md` | 25 | 3,639 | 2 | 706 @`:5` | >300 = 0 · 最长 ≤300 · 行数上浮 |
| `thincoder-core/prompts/persona-coder.md` | 20 | 1,723 | 1 | 386 @`:8` | >300 = 0 · 最长 ≤300 · 行数上浮 |
| `thincoder-core/prompts/persona-explore.md` | 14 | 931 | 0 | 152 @`:14` | ±0（现值即达标） |
| `thincoder-core/prompts/persona-plan.md` | 26 | 2,329 | 0 | 217 @`:23` | ±0（现值即达标） |
| `thincoder-core/prompts/subagent-base.md` | 17 | 2,166 | 0 | 274 @`:14` | ±0（现值即达标） |
| `docs/core/design/PROMPT-SYSTEM.md` | 2,991 | 262,062 | — | — | 本节 = 新增内容；本档六处收正 = 设计席修正轮（连带项 C 表） |

**验收（A1–A4 · 回指 §13.24 四条）**：

| # | 验收 | 判法 / 读数 |
|---|---|---|
| A1 | 需求 ① 两舱每一行 ≤300 | 改后一次性 `node` 脚本逐档读 `thincoder-core/prompts/*.md`（`split(/\r?\n/)` · 判 `length > 300`），两舱各报 `>300 = 0` 与最长行；改前读数 = 本节落点表（290 行 · 最长 1,486） |
| A2 | 需求 ② 语义对账映射表 | 实施轮逐档给「原文行 → 新行」映射表，四列（规则 / 条件 / 例外 / 理由）每列都要有判断——该列没有内容时写「—（本条无）」，不许留空串，也不许为凑格编一条；落批次档 §5（甲舱落本批，乙舱落乙舱批）；判法 = 该档改前每一条 >300 行在「原文行」列逐行出现，未判格 0 次（空串或全空白即未判） |
| A3 | 需求 ③ 零文档引用 | `node scripts/prompt-refs-check.mjs` ⇒ 命中 0（本席基线实跑 2026-10-22 = 提示词面 69 档 · 代码面 463 档 · 0）；改写文本零 `.md` / 零 `§N` |
| A4 | 需求 ④ 相反口径已收正 | 设计席修正轮落笔后（C 表、F3 行与三族定义行已删，见 K8），三族子串全档零命中——族① `不在行宽机检域` / `行宽机检域`；族② `披露不行使`；族③ `行数不作断言` / `行数是排版副产品` / `只作排版读数` / `行数不作验收条`。判法 = `grep -n` 三族子串，判域排除本行自身（判据句须写出被判的子串；三族子串清单在本行内自带，不靠另起的定义行），其余行命中 0 才算过 |

**连带项（C 表 · 落笔 = 设计席修正轮 · 本节零改）**

**执笔与轮次**：C 表是设计档笔。本档唯一作者 = eng-designer（D1 写权矩阵 · 需求 §7.1「设计文档 = eng-designer（含修订）」，`docs/core/requirements/ENGINEERING-MODE-V2.md:289`）；实施轮 coder 的写域 = `thincoder-core/prompts/**`，不持本档笔。落笔轮次 = **本批的设计席修正轮**（§4 用户批准后、实施派单前）：照表逐行替换，落笔后删本表、本节 F3 行与三族定义行（K8）；A4 由父侧在收口轮判。

| # | 坐标（行号 = 本节写入前读数） | 族 | 现文（摘要） | 处置 |
|---|---|---|---|---|
| C1 | `docs/core/design/PROMPT-SYSTEM.md:476` | ①② | 「EN 档不在行宽机检域（`scanDirs = ["docs"]`）……披露不行使」 | 整行替换 |
| C2 | `docs/core/design/PROMPT-SYSTEM.md:2818` | ③ + 落地形态 | 「B1 三段各落一整行」「行数不作断言……排版副产品」 | 整行替换 ⇒ 两行（一处两半） |
| C3 | `docs/core/design/PROMPT-SYSTEM.md:627` | ①② | 「提示词档不在行宽机检域（披露不行使——同 §6.19 记法）」 | 整行替换 |
| C4 | `docs/core/design/PROMPT-SYSTEM.md:653` | ①② | 同 C3（§6.26 机检行） | 整行替换 |
| C5 | `docs/core/design/PROMPT-SYSTEM.md:2849` | ③ | 「行数（+6 ⇒ 310）只作排版读数、不作验收条」 | 整行替换 |
| C6 | `docs/core/design/PROMPT-SYSTEM.md:2870` | ③ | 「行数不作验收条——排版副产品」 | 整行替换 |

**逐字目标行（六行 · 各 ≤300 字符 · 落笔 = 整行替换）**

C1 — `docs/core/design/PROMPT-SYSTEM.md:476`：

```text
EN 档**同受行宽判据**（FR46——一条规则一行、逐行 ≤300 字符）；`##` 块计数可机判（单份不变）；**不新增断言**（内容在场 = 一次性比对——落地档 ↔ 设计围栏块，承 §6.1「批次收尾核对」）。
```

C2 — `docs/core/design/PROMPT-SYSTEM.md:2818`：

```text
**落地形态与逐字判等**：B1 三段各成一整段，段内按 FR46 分行（每行 ≤300 字符；前导空行 1 + 段间空行 2 照旧）；上方 B1 围栏块的折行只为本档行宽、不作落地基线——逐字判等按 §6.1「去折行后的段」比对：围栏内的换行连起来，逐段比。
**行数是结构读数**：一条规则一行，行数随规则条数变；行数不作验收阈值——验收看每行 ≤300 与四类内容映射。
```

C3 — `docs/core/design/PROMPT-SYSTEM.md:627`：

```text
**机检**：`scripts/prompt-refs-check.mjs` 复跑 = 0 命中（新文本零文档引用——读数入一次性记录面）；提示词档同受行宽判据（FR46——一条规则一行、逐行 ≤300 字符）；`##` 块计数可机判（逐档数）；**不新增断言**（内容在场 = 一次性比对——落地档 ↔ 设计围栏块，承 §6.1「批次收尾核对」）。
```

C4 — `docs/core/design/PROMPT-SYSTEM.md:653`：

```text
**机检**：`scripts/prompt-refs-check.mjs` 复跑 = 0 命中（新文本零文档引用——读数入一次性记录面）；提示词档同受行宽判据（FR46——一条规则一行、逐行 ≤300 字符）；**不新增断言**（内容在场 = 一次性比对——落地档 ↔ 设计围栏块，承 §6.1「批次收尾核对」）。
```

C5 — `docs/core/design/PROMPT-SYSTEM.md:2849`：

```text
| `thincoder-core/prompts/common.md` | 304 行 / 49,173 字符（`##` 20 · `###` 6） | L1：**+1,312 字符** · L5：**+238 字符** ⇒ 50,723 字符；行数（+6 ⇒ 310）是结构读数、不作验收阈值 |
```

C6 — `docs/core/design/PROMPT-SYSTEM.md:2870`：

```text
提示词面无预算帽（2026-10-21 裁定 · D-PS42 ③），本节只留读数、不设上限；行数是结构读数（一条规则一行），不作验收阈值——验收与判据指向读者，不指向计数器。
```

**三族定义（A4 判域）**：族①「提示词面不在行宽机检域」= 子串 `不在行宽机检域` / `行宽机检域`；族②「披露不行使」= 子串 `披露不行使`；族③「行数不作断言」= 子串 `行数不作断言` / `行数是排版副产品` / `只作排版读数` / `行数不作验收条`。

**不在射程（实扫逐处给理由）**：`§6.25` / `§6.26` 的「父侧逐笔披露」族（`:2212` `:2299` `:2372` `:2386`）= 轻通道笔披露形，不判行宽；`:2812`「+6 行（读数 · 不作验收条）」= 行面 Δ 附注，判的对象不是行数本身；`:2897`「行宽命中 0」= `doc_check` 读数；`:3082`「行宽闸值同数」= 阈值数值，非面判据；`:3011`「行数上浮」= 改后预期读数。以上五类随本表一并删。

**体量读数（无帽 · 只读数）**：16 档现行 = 1,568 行 / 284,907 字符 / 290 行 >300 / 最长 1,486；样板六行 = 130 / 213 / 200 / 252 / 183 / 288 字符（最长 288 ≤ 300；逐行实读自本节围栏块）。
本节写入前 `PROMPT-SYSTEM.md` = 2,991 行 / 262,062 字符。
改后预期 = 两舱各 `>300 = 0`、最长 ≤300；行数上浮（每条 >300 行拆为多行）、字符量基本持平（重写不删内容，只删指代 / 装饰加粗 / 自我限定）。

两舱合计的行数与字符数是体量读数（D-PS42 ③），不作验收阈值；验收线只有两条——逐行 ≤300（A1）与四类内容映射（A2）。

**边界（本批不做）**：不改规则语义与判据强度 · 不新增规则 · 不为过判据删内容、不把理由挪走 · 不改 `thincoder-core/tool-docs/**` · 不改产品代码 · 不改需求档 · 不改本档 §6.19 / §6.25 / §6.26 / §6.44 正文（六处收正 = 设计席修正轮的设计档笔，见连带项 C 表）· 不新增常驻机检（引擎 `width.mjs` → `paragraph.mjs` 属 FR45 批；本批行界读数用一次性 `node` 脚本）· 提示词面不设豁免（用户 12:23「提示词面更需要！」）。

**关键决策**：

| # | 决策 | 理由 |
|---|---|---|
| K1 | 两舱推进、甲舱先行：甲舱 = 7 档 persona-* + 2 档 discipline-*（9 档）；乙舱 = `thincoder-core/prompts/common.md` + 4 档 advisor-* + `thincoder-core/prompts/consult-base.md` + `thincoder-core/prompts/subagent-base.md`（7 档） | 用户裁（需求 §13.24 两舱）；甲舱每轮都读，读错的代价最高；舱 = 批次边界（≤15 档），派单按波（样板一波 · 其余每席一到两档） |
| K2 | 重写，不折行、不切段 | 折行只改源码排版，模型读到的块不变；FR45 验收 ② 已把「段中插换行判定不变」立为机判 |
| K3 | 样板先行，且样板过同一条线 | 需求原话「样板也要过同一条线，否则示范本身就违规」；样板 = 全档最长行（`thincoder-core/prompts/persona-engineering.md:104`）的改写结果 |
| K4 | 语义对账 = 一次性映射表落批次档 §5 | 一次性材料不混入常驻档（D2）；四列 = 规则 / 条件 / 例外 / 理由，每列都要有判断——无内容写「—（本条无）」，不许编 |
| K5 | 行界只读数、不设常驻门 | 引擎改造属 FR45 批；本批用一次性 `node` 脚本改前改后各取一次，验收看读数 |
| K6 | 两面块定义不同，各自成判 | 文档面量段（人读渲染），提示词面量行（模型读原始文本）；依据 = 需求 §13.23，本节承接 |
| K7 | 两舱 = 两批（甲舱 = 本批 · 乙舱另起一份批次档） | 需求 §13.24「16 档分两批」是权威；一批次档 = 一次实施轮（舱内分波，波不另立批次档）⇒ 两舱各一份记录；A2 的两份映射表因此各有其 §5，不混在一份记录里 |
| K8 | C 表是一次性落笔指令：落笔后删表、删本节 F3 行、删三族定义行 | A4 判「三族全档零命中」，而表、F3 与三族定义行的引文本身携三族旧串 ⇒ 留着则零命中永不成立；A4 行内自带三族子串清单，删定义行不留缺口；状态档只留当前态，变更轨迹住 git 与批次档 |

**先例 ∥ 偏离**：先例 = 本档 §6.43 / §6.44 形制（来源 / 要做的那一处 / 机制 / 逐字块 / 落点表 / 验收 / 体量读数 / 边界 / 关键决策 / 先例偏离 / 勘察证据行）∥ §6.32（题眼与 why 随句）∥ D-PS42 ③（体量只读数）。
**先例批次坐标**：§6.42 ← 需求 §13.18（FR40 · 台账 `#1725`）· §6.43 ← §13.19（FR41）· §6.44 ← §13.21（FR43 · 台账 `#1732`）——需求段与台账号是可核坐标；批次档路径不写入本档（批次档可整档删，写进来即成死指针，D4 方向规则）。

**对齐** = 同形制；需求四条验收逐条落到 A1–A4；逐字块给全。
**偏离** = ① 首次把行界判据落到提示词面——此前本档三族六处把提示词行排除在行宽判据之外，连带收正六处（C 表）。
② 首次以「舱 + 波」为实施单位（两舱各 ≤15 档、甲舱先行、样板档单波先行）。既有形 = 一单落全部落点（§6.43 一单 4 处 · §6.44 一单 5 行 L 项）；不适用，因为 16 档 290 行超线，一次派单超出一份任务书的可审面（D-PS10 闸），且样板没定就铺开、四席会读出四种理解 ⇒ 分舱 + 舱内分波（每席一到两档，需求 §13.24 实施顺序第一、二步）。

③ 首次以「重写」为落笔形态。既有形 = 加句 ∥ 换一行（§6.42 B1 段内追加 · §6.44 L5 原位替换一行）；不适用，因为折行与加句都改不了「一行里挤七八件事」的块边界——模型读到的块不变（K2）。
④ 首次把样板写进逐字块，并让样板受同一条验收线约束。既有形 = 逐字块只放可直接粘贴的落笔目标（§6.43 B1 · §6.44 B1）；不适用，因为本批 16 档逐档重写，没有一条可粘贴的目标行——样板是唯一可给的形，而样板若不过线，示范本身即违规（K3）。

**勘察证据行（本席直读 · 2026-10-22）**：

- `thincoder-core/prompts/` 16 档实读（一次性 `node` 脚本）：1,568 行 / 284,907 字符 / 290 行 >300 / 最长 1,486 @ `thincoder-core/prompts/persona-engineering.md:104`；逐档读数见落点表。
- `thincoder-core/prompts/persona-engineering.md:104` 全文实读（1,486 字符，closing ledger sweep 一条）——样板取自此行。
- `thincoder-core/doc-check/` 现为四档：`anchors.mjs` · `index.mjs` · `version.mjs` · `width.mjs`，无 `paragraph.mjs` ⇒ 本批行界读数用一次性 `node` 脚本，不依赖引擎改造。
- `node scripts/prompt-refs-check.mjs` 零参实跑 = 提示词面 69 档 · 代码面 463 档 · 命中 0。
- 需求档 §13.24（`:1000-1048`）∥ §13.23（`:978-995`）· 本档 §6.43 ∥ §6.44 · 本档六处相反口径（`:476` `:627` `:653` `:2818` `:2849` `:2870`，三族实扫）· 本批批次档 §1。
- `docs/core/design/PROMPT-SYSTEM.md` 实读 = 2,991 行 / 262,062 字符（本节写入前）。
- 工作目录内无独立公共源文档仓（`index.publicRepos = []`）——已查，无相关。

**UI / 交互决策**：无界面面——本条只改模型可见提示词文本。

**上抛项（待裁）**：

- 〔父侧 · 需求档随正〕需求 §13.24 `:1042` 仍记相反口径「两处」；设计实扫 = 三族六处（C1–C6）。设计侧不触需求档（本批零改面）——父侧收正需求档时按六处随正。
- 其余无待裁项：实施顺序四步、两舱划分与验收线均已在需求 §13.24 定；六处收正的执笔与轮次已定为设计席修正轮（K7 / K8 + 连带项首段）。

### 6.46 分支须有出处（抑制「为没见过的输入加分支」· 需求 F2-7 · 三处提示词落点）

**来源**：需求权威 = `docs/core/requirements/METHODOLOGY.md:36`（§2.1 F2-7——判定句「设计档每条分支带『依据』列；无出处分支判红」+ 代价面 + 三处落点）；台账 `#1742`。

**缺的那一半（实读 · 2026-10-23 本席）**

现有设计评审维度第 6 条 `Scope`（`thincoder-core/prompts/advisor-design.md:28`）是形容词——「范围合适吗 / 有简化机会吗 / 有范围蔓延吗」评审席判不出红；
而第 9 / 第 10 / 第 11 条能判红，是因为每条都要求「写出那一行」（先例行 / 勘察证据行 / 既有件三问），写不出即红。
⇒ 缺的不是「要小心范围蔓延」，是**一条必须填的格子**：这条分支处理的情况，从哪来。

**机制（为什么无场景的分支贵）**

1. **一条分支自带四份配套**：告警 ∥ 文案 ∥ 三端一致性 ∥ 用例四份。没有真实场景，这四份都验证不了。
2. **验证不了的配套不会自己消失**：后来人也不敢删——删了像是拆掉防御。于是一条没人走过的路永久留在代码里，读它的人每次都要先排除它。
3. **「稳一点」看着更保守，实际是把判断成本转给未来**：新增一条路径 = 以后每个读这段的人多一条要先排除的可能；保守的观感是当下的，成本是长期的。
4. **真防御能过**：给得出复现路径的分支照过（业务门如配置解析非法值 / 权限校验，都有可复现输入）。本条杀的是「说不出场景」的分支，不是防御本身。

**逐字英文文本（实施席照此落笔 · 唯一权威目标形）**

双面形照本档 §6.44：英文块 = 落地目标形（实施席逐字落笔）；中文复核面 = 与英文面同一语义，供人复核，不入提示词。
围栏块同时是本档 §6.1「批次收尾核对」的比对基线——落地后按「围栏内的换行连起来、逐段比」执行（围栏内折行为本档行宽，不作落地基线）。

B1 — `thincoder-core/prompts/advisor-design.md` · `## Review Criteria` 节：第 6 条 `6. **Scope**`（现盘 `:28`）之后、第 7 条（现盘 `:29`）之前，插入以下维度（编号 = `6b`，不重排第 7–11 条的编号——见 K1）：

```text
6b. **Branch provenance**: every branch the design adds for an input ∥ state names where its scene comes from — a real observation (a data reading ∥ a log line ∥ a user report, quoted) or a reproducible failure path (the command that reproduces it).

   **Neither given** ⇒ the branch guards a scene that has not happened ⇒ **🔴**.
   **Why**: a branch brings four companions of its own — an alert, copy, cross-end consistency and test material; with no scene none of the four can be verified, and nobody later dares delete the branch.

   **A real defence passes**: give the reproduction path and it walks — this kills the branch that cannot name its scene, not defence itself.
```

B2 — `thincoder-core/prompts/persona-eng-designer.md` · `### Doc structure` 项 1（`1. **Approach & rationale**`）的 bullet 列末尾，现盘 `:122`（`candidate enumeration…` 行）之后、`:123`（`2. **Interface contract**`）之前，追加一条（依据列落在 8 项 item 2 · Interface contract 的机制描述处——见 B2 首行）：

```text
   - **Every branch carries its basis**: every branch the design adds for an input ∥ state carries a basis column where it is described — item 2, Interface contract: a real observation (a data reading ∥ a log line ∥ a user report) or the command that reproduces the failure.
  A branch whose basis cell cannot be filled in is deleted on the spot, not left for review.

  **The same shape as the closest-precedent line and the survey-evidence line**: the cell forces the evidence at the moment of writing, where a self-discipline paragraph at the end of the document does not — an empty cell is visible, self-discipline is not.

  **Why**: a branch with no scene lands with its companions — an alert, copy, cross-end consistency and test material; none of them can be verified, and nobody later dares delete it.
```

B3 — `thincoder-core/prompts/discipline-engineering.md` · `## Engineering judgment (verdicts ∥ sizing)` 节末，现盘 `:126`（`Fix designs: full dose first` 行）之后、`:128`（`## Task boundary & finding discipline`）之前，追加一条：

```text
- **A branch added for an input that has not shown up, justified by "being safe", is a path nobody walks**: it looks more conservative, while it brings an alert, copy, cross-end consistency and test material along; with no scene all four go unverified, and nobody later dares delete them.
  **The check**: has the situation this branch handles turned up in the data, a log line or a user report? If not, either give the reproducible failure path, or delete the branch.

  **Two shapes seen in practice**: a fallback kept only for "a name we have not seen" sorted a real name into the wrong tier; a guard for an input the requirement did not name grew a branch, an alert and a written refusal, and was torn out whole afterwards.

  **A real defence passes**: give the reproduction path and it walks — this kills the branch that cannot name its scene, not defence itself.
```

**中文复核面（与英文面同一语义 · 供人复核，不入提示词）**

- **B1 · 分支出处（设计评审维度 `6b`）**：设计为某个输入 ∥ 状态新增的每一条分支，都要说清它的场景从哪来——真实观测（数据读数 ∥ 日志一行 ∥ 用户报告，引读数或原文）或可复现的失败路径（把它复现出来的那条命令）。
  两者都给不出 ⇒ 这条分支防的是一个没有发生过的场景 ⇒ 🔴。
  为什么要管：一条分支自带四名随从——告警、文案、三端一致性、用例四份；没有场景，四样都验证不了，后来人也不敢删它。
  真防御能过：给得出复现路径就照过——这条杀的是说不出场景的分支，不是防御本身。
- **B2 · 每条分支带出处（设计席 8 项 item 1 的 bullet；依据列落在 item 2）**：设计为某个输入 ∥ 状态新增的分支，在描述它的地方带「依据」列——即 8 项 item 2（Interface contract：架构 / 接口 / 数据流）的机制描述处；依据 = 真实观测（数据读数 ∥ 日志 ∥ 用户报告）或复现它的命令。
  填不出这一格的分支当场删，不留到评审。
  与「同类先例行」「勘察证据行」同一形：在落笔那一格逼出证据，比文档末尾写一段自律有效——空着的格子看得见，自律看不见。
  为什么：没有场景的分支会带着告警 ∥ 文案 ∥ 三端一致性 ∥ 用例四份随从落地——四样都验证不了，后来人也不敢删。
- **B3 · 判断与尺寸（工程纪律层）**：为没出现过的输入加一条分支、理由是「稳一点」，就是造一条没人走的路：看起来更保守，却把告警、文案、三端一致性、用例四份一起带上；没有场景时四样都验证不了，改的时候也没人敢删。
  检验：这条分支处理的情况，在数据 ∥ 日志 ∥ 用户报告里出现过吗？没出现过 ⇒ 要么给出可复现的失败路径，要么删。
  两种实践中的形态：一条只为「没见过的名字」设的兜底，把一个真实名字判进了另一档；一处需求没点名的输入长出了分支 + 告警 + 拒写，事后整体拆除。
  真防御给得出复现路径：给得出就照过——本条杀的是说不出场景的分支，不是防御本身。

**落点表（实施席逐处执行 · 坐标 = 现盘实读 2026-10-23）**

| # | 文件 | 落点 | 动作 | 预期 Δ（估值 · 不作验收条） |
|---|---|---|---|---|
| L1 | `thincoder-core/prompts/advisor-design.md` | `:28` 之后 / `:29` 之前 | 插入 B1（维度 `6b`） | ≈ +4 行（英文逐字块原样落） |
| L2 | `thincoder-core/prompts/persona-eng-designer.md` | `:122` 之后 / `:123` 之前 | 追加 B2 一条 bullet | ≈ +4 行 |
| L3 | `thincoder-core/prompts/discipline-engineering.md` | `:126` 之后 / `:128` 之前 | 追加 B3 一条 bullet | ≈ +4 行 |
| L4 | `docs/core/design/prompts/**` | 不存在（EN 单源，`fs.existsSync` 实读 = false） | 零动作 | ±0 |
| L5 | `thincoder-core/prompts/advisor-round2.md` / `thincoder-core/prompts/advisor-round3.md` · 其余提示词档 · 工具面 · 产品代码 · 需求档 | — | 零改 | ±0 |

**写形约束（L1–L3 共用 · 承 §6.45）**：一条规则一行 · 行首短语点题（题眼加粗）· 条件与例外独立成行 · 每行 ≤300 字符 · 正面条件句、不写禁令腔（判 = A5 扫禁区词 0 命中）——理由面按块定形：B1 / B2 理由独立成行且以 `Why` 起头，B3 理由收在首句后半（同句，不另起 `Why` 行）；围栏块已按此形写好，**原样落、不折行**。
落地次序：须在 §6.45 连带项 C1 收正（§6.19 现盘 `:476` 的 EN 行宽口径）之后或与之同时成立——旧口径「EN 档不在行宽机检域」在盘时，本条写形没有判据可依。

**验收（A1–A6 · 逐条回指 F2-7）**

| # | 验收 | 判法 / 读数 |
|---|---|---|
| A1 | F2-7 三处落点各有逐字块（本批验收 ①） | 本节 B1 / B2 / B3 三块英文在盘各 1 次 + 中文复核面三条在盘；每块标明目标文件与落点节（上列） |
| A2 | 评审席可直接判红（本批验收 ②） | B1 同时含两类出处（`a data reading ∥ a log line ∥ a user report` · `the command that reproduces it`）与红判据（`Neither given` ⇒ `🔴`）；评审读 B1 即能判，不需另查 |
| A3 | 实施落盘后：三串各恰 1 次（逐字取自英文块 · 大小写敏感 · 含标点） | `6b. **Branch provenance**` @ `advisor-design` · `Every branch carries its basis` @ `persona-eng-designer` · `A branch added for an input that has not shown up` @ `discipline-engineering`——各在对应档恰 1 次（实施轮读数） |
| A4 | 编号引用零破坏 | `## Review Criteria` 节内 `^[0-9]+. ` 加粗项计数 11 ⇒ 11（`6b.` 不占整数编号；判域 = 该节范围）；A-AC15 / A-AC16 的「第 9 / 第 10 条」与 D-PS37 的「第 10 条」仍指向原维度 |
| A5 | 禁令腔零新增 | B1–B3 英文块扫 `never\|must not\|do not\|don't\|forbidden` = 0（本节在盘实测）；实施轮落笔后复扫 = 0 |
| A6 | `doc_check` | 本节落笔后实跑 `doc_check(mode:"gate", docs=["docs/core/design/PROMPT-SYSTEM.md","docs/core/design/ADVISOR-CONVERGENCE.md"])` ⇒ 首行 `DOC-CHECK GATE: PASS` · 0 命中（2026-10-23 本席实测）；实施轮改档后父侧复跑同判 |

**用例表（正常 / 边界 / 错误）**

| # | 场景 | 输入 / 动作 | 期望 |
|---|---|---|---|
| C1 | 正常 · 观测出处 | 依据列写「线上日志该错误 12 次/日」 | 评审过：属真实观测 |
| C2 | 正常 · 复现路径 | 依据列写「`node x.mjs --bad` ⇒ 当前崩溃」 | 评审过：属可复现失败路径 |
| C3 | 边界 · 业务门 | 配置解析非法值 / 权限校验类分支 | 给可复现输入即过——本条不杀真防御 |
| C4 | 错误 · 现象都不给 | 依据列只写「为稳妥起见」 | `🔴`：分支防的是没发生过的场景 |
| C5 | 错误 · 空格留到评审 | 依据格（item 2 机制描述旁）空着 | 设计席当场删（B2）；若仍到评审 ⇒ 按 C4 判红 |
| C6 | 错误 · 拿推断当观测 | 依据列写「用户可能会这么用」 | 不属两类出处 ⇒ `🔴`（推断不是读数，也不是复现路径） |

**受影响文件（现行 = 本席 `node` 实读 2026-10-23；行数口径 = `split(/\r?\n/).length - 1`）**

| 文件 | 现行 | Δ → 改后 |
|---|---|---|
| `thincoder-core/prompts/advisor-design.md` | 127 行 / 13,277 字符 | L1：≈ +4 行（英文块原样落；估值，不作验收条） |
| `thincoder-core/prompts/persona-eng-designer.md` | 142 行 / 18,006 字符 | L2：≈ +4 行 |
| `thincoder-core/prompts/discipline-engineering.md` | 327 行 / 40,402 字符 | L3：≈ +4 行 |
| `docs/core/design/ADVISOR-CONVERGENCE.md` | 421 行 / 27,103 字符 | 本席本笔：+§16 · +A-AC17 · 头部维度清单随正 |
| `docs/core/design/PROMPT-SYSTEM.md` | 3,323 行 / 284,020 字符（本节修正轮写入前） | 本节修正轮改写（设计档面，非验收对象） |
| L5 所列各面 | — | ±0 |

**行数口径**：上表行数一律 `split(/\r?\n/).length - 1`（工具尾行计数）；同一档用别式可读出 ±1 行（评审读 328 即此差），属计数式差异，不是文件变动。

**关键决策**

| # | 决策 | 理由 |
|---|---|---|
| K1 | 新维度编号 = `6b`（字母后缀），不重排第 7–11 条 | 档外引用点名了「第 9 / 第 10 条」（本档 A-AC15 / A-AC16 · §7 D-PS37）；顺延重排会让这些引用指错维度。字母后缀 = 同仓既有形（`thincoder-core/prompts/advisor-round1.md` R7a–e） |
| K2 | 判据 = 「两类出处 + 都给不出 ⇒ 🔴」，不写「不得为没见过的输入加分支」 | 用户口径「禁令带理由、知识不写成执法条文」；且需求 F2-7 的边界明文「真防御能过」——正向条件句给出判断力，禁令只给出服从 |
| K3 | 落笔格放设计席 8 项 item 1 的 bullet 列，不新建节 | 与「同类先例行」「勘察证据行」同格同形（用户点名要同构）；8 项计数不变，零节连带 |
| K4 | 代价句落 `## Engineering judgment` 节，不新增节 | 该节 = 「判断与尺寸」知识面（`Small job, small machinery` 邻位），代价链与之同轴；新增节会多一处要维护的判据面 |
| K5 | 逐字块 = **英文落笔目标形 + 中文复核面**（本档 §6.44 双面形） | 只给中文三处受伤：验收钉的英文串设计里没有；§6.1「落地档 ↔ 当批设计围栏块」比对没有可比对象（本档自己的漂移防线失效）；实施席等于自写产品文案。英文块 = 唯一权威目标形，中文面只供人复核 |
| K6 | 两个实例收成项目中性形态，不点名本仓机制 | 通用层新文零具体项目实例（§6.10 口径）；形态已足以辨认，点名对读者无增益 |
| K7 | 新维度行为语义 = `docs/core/design/ADVISOR-CONVERGENCE.md` §16 + A-AC17 | 需求 F-R24b 定「权威载体 = 该档（只放挂钩指针，行为语义以彼为准）」；该档每维一节 + 一条 A-AC（§14 / §15 先例）；提示词 = 执行实现 |

**先例 ∥ 偏离**：先例 = 本档 §6.44（英文逐字文本 / 中文复核面双面形）∥ §6.45（一条规则一行的写形）∥ 本节形制（来源 / 机制 / 逐字块 / 落点表 / 验收 / 用例表 / 关键决策 / 勘察证据行）∥ `thincoder-core/prompts/advisor-design.md:44-47` 第 11 条（「写不出那一行就红」的复核形态）。
**对齐** = 双面形逐字照 §6.44；写形照 §6.45；判据给红；落点给坐标；逐字块给全。
**偏离** = 新增维度用字母后缀，不顺延编号（既有形 = 新增 R 号顺延；不适用，理由见 K1）。

**既有件三问（新增标签「分支出处」· 编号 `6b`）**：`existing but unusable: 第 6 条 Scope`（`thincoder-core/prompts/advisor-design.md:28`——形容词式判据，评审席据此判不出红，见「缺的那一半」）⇒ 新维度成立；标签与编号 `none found`（`## Review Criteria` 节内无「出处 / provenance」维度，也无字母后缀维度）。

**6 ∥ 6b 分工**：第 6 条判**范围总量**（这件事该不该做 · 有无简化机会 · 有无蔓延）；`6b` 判**单条分支的出处**（这一条分支处理的情况从哪来）。两条独立判红——不得以第 6 条过掩 `6b` 红，也不得把 `6b` 的红记成范围问题。

**勘察证据行（本席实读 · 2026-10-23）**

- `thincoder-core/prompts/advisor-design.md:21-47`：`## Review Criteria` 11 条；`:28` 第 6 条 `Scope`（`6. **Scope**: Is the scope appropriate? …`）；`:29` 第 7 条 `Document ownership`；`:44-47` 第 11 条既有件三问——L1 落点与同构先例实读。
- `thincoder-core/prompts/persona-eng-designer.md:118-123`：`:118` `**Design doc 8 items**`；`:119-122` 项 1 的三条 bullet（`:120` 先例行 · `:121` 勘察证据行 · `:122` 候选枚举退役）；`:123` 项 2 `Interface contract`——L2 落点与 item 2 名称实读。
- `thincoder-core/prompts/discipline-engineering.md:120-128`：`## Engineering judgment (verdicts ∥ sizing)` 六条 bullet，`:126` 为末条；`:128` 下一节——L3 落点实读。
- `docs/core/design/PROMPT-SYSTEM.md:2772` / `:2800`：§6.44 的「逐字英文文本（实施席照此落笔 · 唯一权威目标形）」与「中文复核面（与英文面同一语义 · 供人复核，不入提示词）」——双面形先例实读。
- `docs/core/design/PROMPT-SYSTEM.md:144`：§6.1「批次收尾核对」= 落地档 ↔ 当批设计围栏块（逐行 / 去折行后的段）——英文块作为比对基线即可执行。
- `docs/core/design/ADVISOR-CONVERGENCE.md:405-421`（§14 / §15：每维一节 + 权威链 + 维度条）· `:381-400`（A-AC 表 A-AC1–A-AC16）· `:17`（维度清单「§9 ∥ §14 ∥ §15」）——K7 与 §16 落点实读。
- `docs/core/requirements/METHODOLOGY.md:35-36`（F2-6 / F2-7 全行）· `:83`（F-R24b 权威载体）——需求依据实读。
- `docs/core/design/PROMPT-SYSTEM.md:298`（§6.10 口径：新文零具体项目实例）——K6 依据实读。
- 四档实测（`node` 实读）：`advisor-design` 127 行 / 13,277 字符 / 最长 290；`persona-eng-designer` 142 / 18,006 / 298；`discipline-engineering` 327 / 40,402 / 300；`ADVISOR-CONVERGENCE` 421 / 27,103 / 296。
- `docs/core/design/prompts/` 不存在（`fs.existsSync` = false）——EN 单源，无中文镜像档需同步。
- 工作目录内无独立公共源文档仓（`PROJECT-MANIFEST.json:35` `"publicRepos": []`）——已查，无相关。

**UI / 交互决策**：无界面面——本条只改模型可见提示词文本与设计档。

**上抛项（待裁）**：无。


### 6.47 集成测试设计 = 设计交付物必项（两档提示词 · 四处落点 · F34）

**来源**：需求权威 = `docs/core/requirements/TESTING.md:198`（F34——判定句：设计档含集成测试设计段（场景表 + 判据，逐条回指业务需求）；业务修改批的设计缺该段 = 设计不合格；收口行「集成场景无变化」只在改动未触及业务行为时成立；窗口 50–100 是上限约束）。台账 `#1743`。

用户 2026-10-23 22:58 逐字裁定：「业务设计必须设计集成测试，业务修改也必须更改集成测试，应该把集成测试的设计作为设计的一项任务要求下去。」需求 F34 = 该裁定的现状落点，语义以需求档为准。

**缺的那一半（实读 · 2026-10-23 本席）**

| # | 坐标 | 现文（逐字） | 缺的那一半 |
|---|---|---|---|
| F1 | `thincoder-core/prompts/discipline-engineering.md:172` | `**Closeout test line**: … ② whether integration scenarios are affected (added / revised / none).` | 三选一中的 `none` 无门槛——业务修改可以报 none 收口，没有必须改用例的义务 |
| F2 | 同档 `:175` | `**Permanent, and a single change adds no case to the set** …; a repo's integration-suite budget is **≈50–100 cases — beyond that is over-testing** (trim rather than add).` | 前半句明文禁止单次变更加用例，与新规正面相反；后半句的窗口仍须在（上限约束） |
| F3 | 同档 `:186` | `**A repo with no integration tests ⇒ the gate stays honestly empty-green** — …` | 空集被写成合法稳态：报一句即过门，欠账不入任何可见清单 |
| F4 | `thincoder-core/prompts/persona-eng-designer.md:106` / `:118` / `:119-133` | 设计档 **8 项**清单（item 6 = Case table；item 8 = UI/interaction decisions；逐字见勘察证据行） | 清单里没有「集成测试设计」：设计席没有落笔格，业务修改批可以在设计层完全不提集成用例 |

**机制（为什么必须在设计层强制）**

1. **写码后补的用例只能从实现反推**：场景与判据会被「代码碰巧做了什么」替换，用例变成实现快照，断言不出「业务该做什么」。
2. **收口层的口径挡不住空集**：`none` 无门槛时，「报 none ⇒ 批关 ⇒ 集仍空」是个自洽循环——每轮合规，集永久为空。三端集成集现量 0（2026-10-23 本席实读：CLI 无 `test/integration/` 目录；VSC `test/integration/files.mjs` = `export default []`；桌面 `test/files.mjs` = `[]`）。
3. **空集报「诚实空绿」= 把欠账写成通过**：一句报告行让空集在收口面上与「已验证」无法区分；欠账不进台账就没人排期。报告行保留——它防的是拿单元档冒充集成档。
4. **窗口是上限，不是冻结**：50–100 限制套件体量（超窗裁旧场景），不是「业务变更加用例」的许可证；旧句把两者绑在一起，上限被读成了禁令。
5. **F10 不动**：F10 定流程（谁定形谁落），F34 定必做——「不需变」的出口由 B1 的 `none` 条件与 B3 的欠账规则关掉，F10 的流程句零改。

**逐字英文文本（实施席照此落笔 · 唯一权威目标形）**

双面形照本档 §6.44：英文块 = 落地目标形（实施席逐字落笔）；中文复核面 = 与英文面同一语义，供人复核，不入提示词。
写形照本档 §6.45：一条规则一行 · 行首短语点题（题眼加粗）· 条件与例外在规则之后 · 理由独立成行且以 `Why` 起头 · 每行 ≤300 字符——围栏块已按此形写好，**原样落、不折行**。
围栏块同时是本档 §6.1「批次收尾核对」的比对基线——落地后按「围栏内的换行连起来、逐段比」执行（围栏内折行为本档行宽，不作落地基线）。

B1 — `thincoder-core/prompts/discipline-engineering.md` · `## Testing discipline` 节 · 现盘 `:172-176` 五行（已落）；本修正只改 ② 行（`:174`）的用例档落点：

```text
- **Closeout test line**: each batch closeout reports two halves.
  ① this batch's unit test files named, with one verification reading (what was verified ∥ command ∥ result).

  ② the integration set as it now stands against the ≈50–100 window, plus the cases this batch added ∥ revised, by case name — each case file lands under the project's integration test directory.
- **`none` stands only where the change does not touch business behavior**: a batch that changes what the business does and closes with no integration-case change is incomplete — the case it changes should have been designed before the code.
  Why: an unconditional `none` let every business change close against an empty set, so the set stayed empty while every closeout read green.
```

B2 — 同档现盘 `:175` **整行替换为两行**（旧句零残留；窗口子句改写为上限规则——K1）：

```text
- **The integration window is an upper bound**: a repo's suite budget stays ≈50–100 cases — over the window, trim old scenarios rather than turn away a case a business change earned.
  Why: read as a freeze, the window would turn every business change away, and the suite would stop following the business.
```

B3 — 同档现盘 `:191-194` **四行整替为四行**（仅首行改写：计量单位 = 集本身，不绑仓 / 端；其余三行逐字保留）：

```text
- **A missing integration suite is a debt, not a steady state**: an empty set passes nothing — the closeout reports the count against the window (`0 / 50–100`) and books a ledger row for each integration suite this project is missing.
  Each row is booked once, at the first closeout that reports that set empty; later batches do not re-book it while the debt stands.
  Report line: "not integration-test verified — the parent-side closeout run is the only integration-test run."

  Why: a gate assembled out of unit files says only that something is green, not that the release is; the report keeps the debt visible while the row keeps it scheduled.
```

B4 — `thincoder-core/prompts/persona-eng-designer.md` 三处（计数两处 + 新项一处）：

```text
9. **Integration test design** — the scenario table this change earns and the criterion for each: entry = a business-observable point, criterion = the business result it asserts, and each row points back to the requirement it serves.
   A change that alters what the business does names the cases it adds ∥ revises — "no change" is not an answer there.
```

B4 的两处计数：现盘 `:106` 节标题 `### Doc structure (design doc 8 items, …)` 的 `8 items` ⇒ `9 items`；现盘 `:118` `**Design doc 8 items** (missing one = incomplete):` ⇒ `**Design doc 9 items** (missing one = incomplete):`。两行其余逐字零改。

**中文复核面（与英文面同一语义 · 供人复核，不入提示词）**

- **B1 · 收口测试行**：每批收口报两半——① 本批单元测试档逐个列名，附一行验证读数（验了什么 ∥ 命令 ∥ 结果）；② 集成集现量对 ≈50–100 窗口，加本批新增 ∥ 修订的用例名——② 点到的用例档一律落该项目的集成测试目录。
  `none` 只在改动未触及业务行为时成立；改了业务行为却在收口里没有集成用例变化的批次 = 收口不完整——它改的那条用例本应在写码前就设计出来。
  理由：`none` 无门槛时，每次业务修改都能对着空集收口；集一直空着，而每次收口都读作绿。
- **B2 · 集成窗口是上限**：一仓套件预算维持 ≈50–100 用例——超窗时裁掉旧场景，而不是把业务变更挣来的新用例挡在门外。
  理由：把窗口读成冻结，它会把每次业务变更挡在门外，套件不再跟着业务走。
- **B3 · 缺一套集成集是欠账，不是稳态**：空集什么也证明不了——收口报现量对窗口（`0 / 50–100`），并为这个项目所缺的那套集成集立一行台账；该行在首次报空集的收口登记一次，债未清前后续批次不重立。
  报告行保留：「未经集成测试验证——父侧收口跑是唯一一次集成测试执行」。
  理由：拿单元档拼出来的门只说明有东西是绿的，不说明发布是绿的；报告行让欠账可见，台账行让它被排期。
- **B4 · 设计席第 9 项**：集成测试设计——这次改动挣来的场景表与逐行判据：入口 = 业务可观察点，判据 = 它断言的业务结果，每行回指它服务的需求。
  改了业务行为的改动，写明它新增 ∥ 修订了哪些用例——「无变化」在那里不是答案。
  同档两处计数随正：`design doc 8 items` ⇒ `9 items` · `**Design doc 8 items**` ⇒ `**Design doc 9 items**`。

**落点表（实施席逐处执行 · 坐标 = 现盘实读 2026-10-23）**

| # | 文件 | 落点 | 动作 | 预期 Δ（估值 · 不作验收条） |
|---|---|---|---|---|
| L1 | `thincoder-core/prompts/discipline-engineering.md` | `:174` | B1 ② 行尾改项目中性（`test/integration/` ⇒ `the project's integration test directory`） | ±0 行 |
| L2 | 同档 | `:175` | 整行替换为 B2 两行（旧句零残留） | +1 行 |
| L3 | 同档 | `:191-194` | 四行整替为 B3 四行（仅首行改写：计量单位 = 集本身；其余三行逐字保留） | ±0 行 |
| L4 | `thincoder-core/prompts/persona-eng-designer.md` | `:106` · `:118` | 计数 `8` ⇒ `9`（两处） | ±0 行 |
| L5 | 同档 | `:133` 后 / `:135` 前 | 插入 B4 item 9（两行） | +2 行 |
| L6 | `thincoder-core/prompts/advisor-design.md` · 其余提示词档 · `thincoder-core/tool-docs/**` · 产品代码 · 需求档 · `docs/core/design/TESTING.md` | — | 零改（`docs/core/design/TESTING.md` 实读见勘察行：F9 窗口读数在案且同向、旧句零副本） | ±0 |

实施按**内容锚**定位（`**Closeout test line**` 行 · `**Permanent, and a single change adds no case**` 行 · `**A repo with no integration tests is a debt**` 行 · `8. **UI/interaction decisions all landed**` 行），行号只作现盘读数（本修正轮按兄弟批 `2026-10-23-branch-must-have-evidence` 落笔后的盘面重读）。

**验收（A1–A9 · 逐条回指 F34 与本批验收）**

| # | 验收 | 判法 / 读数 |
|---|---|---|
| A1 | 三处改动（B1–B3）各给英文逐字块 + 中文复核面（本批 ①） | 本节 B1 / B2 / B3 三块英文 + 中文复核面三条在盘；B4 同形（英文块 + 中文面） |
| A2 | 旧句整条删除、零残留（本批 ②） | 落地后 `thincoder-core/prompts/discipline-engineering.md` 扫 `Permanent, and a single change` / `adds no case to the set` / `per-change additions` / `trim rather than add` / `gate stays honestly empty-green` 各 0 次；三处替换锚 `**Closeout test line**` ∥ `**The integration window is an upper bound**` ∥ `debt, not a steady state` 各 1 次（`grep` 实读） |
| A3 | 设计席落笔格加「集成测试设计」项（本批 ③） | 落地后 `thincoder-core/prompts/persona-eng-designer.md` 含 `9. **Integration test design**` 恰 1 次 · `**Design doc 9 items**` 恰 1 次 · 节标题 `design doc 9 items` 恰 1 次 · `8 items` 0 次 |
| A4 | 写形零回归（§6.45） | 落地后两档逐行 ≤300 字符（现盘基线：discipline max 300 · persona max 298；一次性 `node` 脚本读数） |
| A5 | 提示词面零文档引用（§6.10） | 落地后 `node scripts/prompt-refs-check.mjs` ⇒ 命中 0（基线 = 本席 2026-10-23 实跑：提示词面 70 档 · 代码面 465 档 · 命中 0） |
| A6 | `doc_check`（本批 ④） | 本节落笔后实跑 `doc_check(mode:"gate", docs=["docs/core/design/PROMPT-SYSTEM.md"])` ⇒ 首行 `DOC-CHECK GATE: PASS`；实施轮改提示词后父侧复跑同判 |
| A7 | F9 ②半（窗口读数）在**每批**成立（评审 🔴1） | 落地后 B1 ② 含 `against the ≈50–100 window` 恰 1 次 · B3 含 `` `0 / 50–100` `` 恰 1 次 ⇒ 非空集批与空集批都有窗口读数；另 B1 ① 含 `unit test files named` 恰 1 次（F9 ① 清单义务） |
| A8 | B3 计量单位 = 集本身，不绑仓 / 端（本批 ①） | 落地后 `thincoder-core/prompts/discipline-engineering.md` 扫 `a ledger row for the integration suite this project is missing` 恰 1 次 · `A missing integration suite is a debt` 恰 1 次 · `one ledger row per repo` 0 次 · `A repo with no integration tests is a debt` 0 次 |
| A9 | B1 ② 用例档落点项目中性（本批 ①） | 落地后同档扫 `test/integration/` 0 次 · `the project's integration test directory` 恰 1 次 |

**用例表（正常 / 边界 / 错误）**

| # | 场景 | 输入 / 动作 | 期望 |
|---|---|---|---|
| C1 | 正常 · 业务修改批 | 设计档 item 9 列出新增场景 + 判据 + 需求回指；收口行报用例名 + 集成集现量对 ≈50–100 窗口，用例档落本项目集成测试目录（本仓实例 = `test/integration/`） | 设计过、收口完整、窗口读数在 |
| C2 | 边界 · 未触及业务行为 | 纯文档 / 纯重构批：设计 item 9 写「未触及业务行为，无集成场景」；收口行 `none` | `none` 成立（唯一成立场合） |
| C3 | 错误 · 业务修改 + 收口 `none` | 改了业务行为，收口行报 `none` | 收口不完整——按 B1 判缺 |
| C4 | 错误 · 空集报「诚实空绿」 | 空集收口只报一句报告行，无现量对窗口、无台账行 | 欠账未登记——按 B3 判缺；台账行每套缺失的集成集只立一次，重复立行同样是缺陷（K3） |
| C5 | 边界 · 超窗 | 集已 100 例，新业务变更带来一条新用例 | 加新用例并裁一条旧场景（B2），不得以窗口为由拒绝 |
| C6 | 错误 · 设计席写「无变化」 | 业务修改批的设计 item 9 写「无变化」 | 设计不合格（F34 判定句） |

**受影响文件（现行 = 本席 `node` 实读 2026-10-23；行数口径 = `split(/\r?\n/).length - 1`）**

| 文件 | 现行 | Δ → 改后 |
|---|---|---|
| `thincoder-core/prompts/discipline-engineering.md` | 338 行 / 42,234 字符 / max 300 / >300 = 0 | L1 ② + L3 首行重落 ⇒ ±0 行；逐行 ≤300 保持 |
| `thincoder-core/prompts/persona-eng-designer.md` | 146 行 / 18,815 字符 / max 298 / >300 = 0 | L4 ±0 · L5 +2 ⇒ 148 行；逐行 ≤300 保持 |
| `docs/core/design/PROMPT-SYSTEM.md` | 本档（设计档面，非验收对象） | 本节 = 本节内的改写与新增 |
| L6 所列各面 | — | ±0 |

**关键决策**

| # | 决策 | 理由 |
|---|---|---|
| K1 | `:175` 整行替换为窗口上限规则，不整行删空 | 删除对象 = 旧句前半（禁止单次变更加用例）；后半的窗口是本批明令保留的上限口径。删空会让 `:180` 的 `their budget`（`integration sets stay inside their budget`）失去所指，成为悬空引用 ⇒ 窗口在该坐标原地改写为上限规则 |
| K2 | `none` 加条件、不取消 | 未触及业务行为的改动（纯文档 / 纯重构）确实没有集成用例可加；取消 `none` 会逼出凑数用例 |
| K3 | 空集规则保留报告行、另加台账行 | 报告行防「拿单元档冒充集成档」；台账行让欠账可排期——不落台账的欠账没人还。台账行 = **每套缺失的集成集一行**、首次报空集时登记、债未清前不逐批重立（B3 英文块逐字定死频次与范围）——不是每批新增簿记（F9「零新增簿记」指窗口读数是守闸读数）。计量单位取「集本身」：提示词是通用产品文本，不绑任何项目的仓 / 端结构。按仓计在本项目会出错——三前端同住一仓 ⇒ 并成一行；核仓不设集成集 ⇒ 立一条永远结不清的行（N20）；按端计则把各项目自己的端划分写进产品文本 |
| K4 | 设计席加 item 9，不并入 item 6（Case table） | F34 要的是设计交付物的一段：集成场景住业务可观察入口、逐条回指需求；item 6 是设计用例表（输入 / 输出），两者判据面不同，并项会让集成场景被当普通用例表审 |
| K5 | 逐字块 = 英文落笔目标形 + 中文复核面（§6.44 双面形） | 只给中文的三处受伤：验收钉的英文串在落地时不存在（无可比对目标）· §6.1 收尾核对没有基线 · 实施席等于自写产品文案——英文块 = 唯一权威目标形 |
| K6 | 50–100 的数字留在提示词面 | 该数字在提示词层只此一处；移走会让窗口在上限意义上无读数 |

**先例 ∥ 偏离**：先例 = 本档 §6.44（英文逐字文本 / 中文复核面双面形）∥ §6.45（一条规则一行 · 逐行 ≤300 · 题眼加粗 · Why 独立成行）∥ §6.46（落点表 + 验收 + 用例表 + 关键决策 + 勘察证据行）。
**对齐** = 双面形逐字照 §6.44；写形照 §6.45；落点给内容锚；验收给读法。

**偏离** = ① 首次以「删规则」为落笔动作（既有形 = 追加 ∥ 原位替换一行）——旧句与新规正面相反，留着即许可；② 首次把「空集」从合法稳态改判为欠账（既有「honestly empty-green」句在 `thincoder-core/prompts/discipline-engineering.md:186`）。

**既有件三问（新增标签「Integration test design」· item 9）**：`existing but unusable: 8 项 item 6 Case table`（`thincoder-core/prompts/persona-eng-designer.md:131`——设计用例表按输入 / 输出组织，判的是设计用例，不是业务可观察入口上的集成场景与需求回指）⇒ 新项成立；标签 `none found`（8 项清单内无「集成测试设计」项——`thincoder-core/prompts/persona-eng-designer.md:119-133` 实读）。

**勘察证据行（本席实读 · 2026-10-23）**

- `docs/core/requirements/TESTING.md:198`：F34 全行（判定句 + 与 F10 的关系 + 窗口 = 上限）——需求依据；`:80` F9（收口测试行双半：① 单元档清单 + 一行读数，② 集成影响 + 窗口读数）· `:66` §1.3 执行形（两闸守闸动作挂收口测试行）· `:221` F30（用例档坐标 `test/integration/<场景名>.test.mjs`）· `:114` N20（集成集只住三前端）。
- `thincoder-core/prompts/discipline-engineering.md:164-192`：测试纪律节；`:166` Unit tests · `:167` Delete on use + Why · `:171` 不互转 · `:172` 收口测试行。
  `:173` Integration tests 定义 · `:174` project assets · `:175` 旧句 · `:176` 用例位置 · `:177` 只住前端口 · `:180` The set does not accumulate（`their budget` 指回 `:175`）· `:186-187` 空集 + 报告行。
- `thincoder-core/prompts/persona-eng-designer.md:106`（节标题 `design doc 8 items`）· `:118`（`**Design doc 8 items**`）· `:119-133`（item 1–8；`:127` item 2 · `:131` item 6 · `:133` item 8）· `:134-135`（空行 + `**Current state only**`）——B4 落点。
- `docs/core/design/TESTING.md:52` `:67` `:97` `:283`：窗口 50–100 与「守闸读数随收口测试行 ②半带出（需求 F9）」在案——与本批 B1 ② 补窗口读数同向；本批要删的两串旧句（`adds no case` / `empty-green`）该档零副本 ⇒ 该档零改（L6）。
- `thincoder-core/prompts/advisor-design.md:21-47`：11 条评审维度；无「8 项」计数引用 ⇒ 零改。
- `docs/core/design/PROMPT-SYSTEM.md:2746-2903`（§6.44 双面形）· `:3115-3261`（§6.46 形制）——形制先例。
- 现盘宽度实读（`node` 一次性脚本 · 本修正轮）：discipline 331 行 / 41,270 字符 / max 300 / >300 = 0；persona 146 行 / 18,815 字符 / max 298 / >300 = 0；advisor-design 131 行 / 13,954 字符 / max 290 / >300 = 0。
- 三端集成集现状（`fs` 实读，2026-10-23）：cli 无集成目录；vsc ∥ desktop 集成清单为空。
- `PROJECT-MANIFEST.json` `index.publicRepos` = 空（本席 2026-10-23 实读）——已查，无相关公共源。

**UI / 交互决策**：无界面面——本批只改模型可见提示词文本与设计档。

**上抛项（待裁）**

- 〔父侧 · 需求档随正〕`docs/core/requirements/METHODOLOGY.md:91` 记「设计档 8 项之①（`thincoder-core/prompts/persona-eng-designer.md:62`）」——计数 8 与行号 `:62` 均随本批失效（现盘 item 1 在 `:119`）；需求档笔 = 父侧。
- 〔父侧 · 设计档数面〕本档旧节内的「8 项」/「8 items」引用十一处（`:137` `:643` `:647` `:651` `:2362` `:3146` `:3170` `:3233` `:3248` `:3460` `:3487`，本席 2026-10-23 实读）为各节当批的决策记录；现行计数单源 = `thincoder-core/prompts/persona-eng-designer.md`（9 项）。全档数面 sweep 是否另轮 = 父侧裁。
- 〔父侧 · 编号〕本节未加 §7 D-PS 行：§6.46 在途未占号，D-PS46 / D-PS47 的归属由父侧收口时定。
- 〔父侧 · 需求档残留〕`docs/core/requirements/TESTING.md:198` 的「与 F10 的关系」格内仍写「F29 定**必做**」——该行本批已由 F29 改为 F34，这处指代随同失效（同档 `:220` 的 F29 是 RTM 条，不是它）；需求档笔 = 父侧。

### 6.48 常驻守卫的本能 = 集成测试（提示词面指路 · `discipline-engineering` 一处）

**来源**：需求权威 = `docs/core/requirements/TESTING.md:47`（§1.2 技法轴新条——「『这块得留个长期守卫』这条本能 = 集成测试在说话」；无业务场景 ⇒ 守卫尚未成立 ⇒ 记成待办、不造常驻件）。台账 `#1757`。

用户 2026-10-24 18:08 逐字：「你说的所谓『常驻测试』就是『集成测试』」；18:10：「这是个问题，需要进提示词，让模型能理解它本能中的『常驻测试』与『集成测试』之间的联系」。

**缺的那一半（实读 · 2026-10-24 本席）**

| # | 坐标 | 现文（逐字） | 缺的那一半 |
|---|---|---|---|
| F1 | `thincoder-core/prompts/discipline-engineering.md:171` | `- **Unit test files are not promoted into integration tests** (integration cases are established from business needs, not graduated from unit files).` | 只有禁止、没有去处：那股「这块得留个长期守卫」的劲儿在提示词里没有落点 |
| F2 | 同档 `:167` ∥ `:186` | `**Delete on use — an action, not a question**: …` ∥ `**No conversion between the two** — a hard discipline.` | 删与禁各说一遍，仍不说「想留常驻件时该做什么」——禁令两次出现，去处一次也没有 |

**实证（本批的场景 · 用户当场指出）**：2026-10-24 一批交付后，模型照纪律删了批内单测档，紧接着提议「批内单测档留一个精简常驻版守三条」——**被禁止的提升换了个名字**。缺的不是更强的禁令（禁令已在盘两处），是禁令之后的那条路。

**机制（三步，各有出处）**

1. **本能指向的就是集成测试**：写代码时想把某几条断言留下来盯着这个位置，这个冲动是一种测试在说话——本项目的常驻测试面只有集成测试（`docs/core/requirements/TESTING.md:47`）。
2. **落点是业务场景用例，不是单测档的删减版**：集成用例一律按业务需要单独设立（同档 F8）；从用户可见入口把真实业务走一遍（同档 §1.2 执行轴）。「精简常驻版」= 同一份单测档换个名字 ⇒ 仍是单测档，不因瘦身变成集成测试。
3. **没有可对应的业务场景 ⇒ 守卫尚未成立**：记成待办、不留件。留一个没有场景的常驻件 = 付永久维护费、守一个没发生过的位置（同档 §1.3 防膨胀：验证投入 ∝ 失败代价）。

**与既有句的分工（不重复的判据 = D2）**

- `:171` 管**禁止**（不提升）；本节新增句管**去处**（要留 ⇒ 集成用例）与**无场景**（记待办）——禁令与新句各自可独立判读，无一句是另一句的改写。
- `:177` ∥ `:178` ∥ `:181` 已定集成测试的形态、来源、位置 ⇒ 新句不复述，只把本能指过去。
- `:175` 的 `none` 门槛管**改了业务行为**的批（业务改动必有场景）；新句管**没有业务场景**的冲动——两者正交，不得互相顶替。

**逐字英文文本（实施席照此落笔 · 唯一权威目标形）**

双面形照本档 §6.44：英文块 = 落地目标形；中文复核面 = 同一语义、供人复核、不入提示词。
写形照本档 §6.45：一条规则一行 · 行首短语点题（题眼加粗）· 条件独立成行 · 理由以 `Why` 起头 · 每行 ≤300 字符——围栏块已按此形写好，**原样落、不折行**。
围栏块同时是本档 §6.1「批次收尾核对」的比对基线（去折行后的段比对）。

B1 — `thincoder-core/prompts/discipline-engineering.md` · `## Testing discipline` 节 · 现盘 `:171` 之后、`:172`（`- **Closeout test line**`）之前，插入一条 bullet（四行）：

```text
- **The wish to keep a permanent test around is an integration test talking**: when a few assertions from this change feel worth keeping to watch the spot, that is the moment to design an integration case.
  **A trimmed copy kept in a permanent file is the same unit test file under a new name**: that is the promotion above, not an integration test.

  **With no business scenario behind the urge, there is nothing to keep yet**: name it in the report as a ledger row for the parent to book — do not manufacture a permanent file to discharge the urge.

  Why: the urge is right that the spot matters; a file with no scene pays permanent maintenance and guards nothing.
```

**中文复核面（与英文面同一语义 · 供人复核，不入提示词）**

- **B1 · 常驻守卫的本能**：想给某个位置留一个常驻测试看着，这个念头就是集成测试在说话——这次改动的几条断言值得留下来盯住时，正是设计一条集成用例的时刻。
  把几条断言从单测档里挑出来、瘦身留成常驻档 = 同一份单测档换个名字——那仍是上面被禁止的提升，不是集成测试。
  冲动背后没有业务场景 ⇒ 现在还没有东西可留：在报告里记成一行台账、由父侧登记——不要临时造一个常驻件把冲动糊过去。
  为什么：冲动没说错——这个位置确实重要；但没有场景的文件要付永久维护费，却什么也守不住。

**落点表（实施席逐处执行 · 坐标 = 现盘实读 2026-10-24）**

| # | 文件 | 落点（内容锚） | 动作 | 预期 Δ（估值 · 不作验收条） |
|---|---|---|---|---|
| L1 | `thincoder-core/prompts/discipline-engineering.md` | `**Unit test files are not promoted into integration tests**` 行之后 / `- **Closeout test line**` 行之前 | 插入 B1 四行 | +4 行 |
| L2 | `thincoder-core/prompts/discipline-normal.md` | — | 零改（该面 `:190` 单测档随批档存、`:191` 同款禁令；落与否 = 上抛项，本批不改） | ±0 |
| L3 | `thincoder-core/prompts/` 其余 15 档 · `thincoder-core/tool-docs/**` · 产品代码 · 需求档 · `docs/core/design/TESTING.md` | — | 零改 | ±0 |

**验收（A1–A7 · 逐条回指需求 `:47` 与工程验收 `:166-171` 现文）**

| # | 验收 | 判法 / 读数 |
|---|---|---|
| A1 | 需求三条各有一句对应（本批验收 ①：落法定死） | B1 四行在盘：点名联系（行 1）· 去处（行 2 的反面判据 + 行 1 `integration case`）· 无场景（行 3）· why（行 4）——逐行对照需求 `:47` 三句 |
| A2 | 落盘位置正确、顺序可判 | 落地后同档内 `**Unit test files are not promoted into integration tests**` 行首索引 < `The wish to keep a permanent test around` 行索引 < `- **Closeout test line**` 行索引（`node` 一次性读档比对） |
| A3 | 逐字一致（唯一权威目标形） | 落地后三串各恰 1 次：`The wish to keep a permanent test around is an integration test talking` ∥ `A trimmed copy kept in a permanent file is the same unit test file under a new name` ∥ `name it in the report as a ledger row for the parent to book` |
| A4 | 零新术语（本批验收 ③） | 新句只用在册现名：`unit test file`（`:171` 在盘）· `integration test`（`:177` 在盘）· `integration case`（`:181` 在盘）· `ledger row`（`:191` 在盘）——不引入 `guard` / `permanent suite` 一类新名（行 4 的 `guards` 是动词、非名词；`trimmed copy` 是描述短语、非术语） |
| A5 | D2 零复述 | 新句扫 `established from business needs` ∥ `graduated from unit files` ∥ `from a user-visible entry` ∥ `together with the test code` ∥ `business scenarios` —— 五串各 0 命中（命中即复述既有句，判红） |
| A6 | 写形零回归 | 落地后该档逐行 ≤300 字符、`##` 块计数 10 ⇒ 10、`>300 = 0`（现盘基线 = 338 行 / 42,252 字符 / max 300） |
| A7 | 提示词面零文档引用 | `node scripts/prompt-refs-check.mjs` ⇒ 命中 0 |

**用例表（正常 / 边界 / 错误）**

| # | 场景 | 输入 / 动作 | 期望 |
|---|---|---|---|
| C1 | 正常 · 有业务场景 | 改变业务行为的批，模型想留守卫 | 设计一条从用户可见入口走真实业务的集成用例（行 1 指向；形态与位置照 `:177` ∥ `:181`） |
| C2 | 正常 · 无业务场景 | 纯文档 / 纯重构的批，模型想留守卫 | 报告里记一行台账、父侧登记；集成集零变、零新档（行 3） |
| C3 | 错误 · 换个名字的提升 | 从单测档挑三条断言留成「精简常驻版」 | 判红：仍是同一份单测档（行 2）；不得以「已瘦身 / 只留三条」为由放行 |
| C4 | 错误 · 无场景造件 | 没有业务场景却新建一个常驻档「先守着」 | 判红：守卫尚未成立（行 3） |
| C5 | 边界 · 改了业务行为却报 `none` | 收口测试行 ② 写 `none` | 由 `:175` 判缺（本批新句不接管此判——两条规则正交，防止互相顶替） |

**受影响文件（现行 = 本席 `node` 实读 2026-10-24；行数口径 = `split(/\r?\n/).length - 1`）**

| 文件 | 现行 | Δ → 改后 |
|---|---|---|
| `thincoder-core/prompts/discipline-engineering.md` | 338 行 / 42,252 字符 / max 300 / >300 = 0 | L1 +4 ⇒ 342 行；逐行 ≤300 保持 |
| `docs/core/design/PROMPT-SYSTEM.md` | 3,515 行 / 300,987 字符（本节写入前） | 本节新增（设计档面，非验收对象） |
| L2 ∥ L3 所列各面 | — | ±0 |

**关键决策**

| # | 决策 | 理由 |
|---|---|---|
| K1 | 落 `## Testing discipline` 节内、`:171` 之后，不新增节 | 禁令与其去处必须读在一起：`##` 块计数零连带（10 ⇒ 10）；同节已有 `:172-196` 的收口 ∥ 窗口 ∥ 欠账句，去处紧贴禁令即「禁完之后怎么办」 |
| K2 | 只落工程纪律层，不落公共层（`thincoder-core/prompts/common.md`） | 四问判据：这是「该模式下怎么干活」⇒ 纪律层；公共层只装两模式共建的合作基础。先例同轴：测试层级知识落两模式纪律档、未落公共层（§6.10 ∥ D-PS11 ∥ D-PS13） |
| K3 | 只落一行、不重写 `:171` | `:171` 的禁止句与新句各管一面（禁止 ⟂ 去处），改写会让禁令与去向挤成一句、判读面消失；D8 只要求删失效表达——`:171` 未失效 |
| K4 | 记待办的动词用「在报告里记一行台账、父侧登记」 | 工程纪律层的读者含 eng-coder（无台账写权）；写成「记成待办」会让子代理执行一个它没有的动作。`ledger row` 是 `:191` 的在册说法，父侧登记 = 既有分工 |
| K5 | 不写「guard」类新名词，题眼直译用户原话（常驻测试 ⇒ integration test） | 本批验收 ③ 零新术语；用户 18:08 的裁定本身就是一个「同一个东西两个名字」的纠正，再引入英文新名只会把映射再拆一次 |

**先例 ∥ 偏离**：先例 = 本档 §6.46 ∥ §6.47 形制（双面形 §6.44 + 写形 §6.45 + 落点表 + 验收 + 用例表 + 关键决策 + 勘察证据行）。
**对齐** = 双面形逐字照 §6.44；写形照 §6.45；落点给内容锚；验收给读法。
**偏离** = ① 落笔动作 = **纯增一条**：§6.47 是先例里唯一以「删规则」为动作的（旧句与新规正面相反）；本节无可删的相反旧句（`:171` 与新句同向），故不设删除项。② 首次在验收里给「顺序判据」（A2 行首索引比较）——因为本条的正确位置本身就是判据的一部分（须紧贴 `:171`）。

**既有件三问（新增标签「常驻守卫的本能」）**：`existing but unusable: `:171` 不提升句`（禁止面在盘，去处面缺——见 F1）⇒ 新增句成立；标签 `none found`——同节 `:184` 有 `permanent tests` 但那是成本句（永久测试每次相关改动都要缴税）、`:191` 有集欠账句；无一句把「想留守卫」这个冲动指向集成测试（`instinct` ∥ `urge` 全档 0 命中，实读）。

**落笔位置判定**：不进 `## Engineering judgment`（该节判「判断与尺寸」，不是测试纪律）；不进 `## Doc discipline`（该节管文档归属与命名，本条的落点是测试件不是文档）。

**勘察证据行（本席实读 · 2026-10-24）**

- `docs/core/requirements/TESTING.md:47`：§1.2 技法轴新条全文（点名联系 ∥ 无场景 ⇒ 待办 ∥ 不造常驻件）——需求依据；同档 `:22`（F8 永不互转）· `:80`（F8 表格行）· `:31-36`（用毕即删 why 与批档读数）· `:34`（按事故史买）· `:62-64`（防膨胀两闸）。
- `thincoder-core/prompts/discipline-engineering.md`：338 行 / 42,252 字符 / max 300 / >300 = 0——`## Testing discipline` 是 10 个 `##` 块之一。
- 同档节内逐行实读：`:166` 单元测试定义 · `:167` 用毕即删 + Why · `:171` 不提升句（B1 上锚）· `:172` 收口测试行（B1 下锚）· `:175` `none` 门槛 · `:177` 集成测试定义 · `:178` 项目资产 · `:181` 用例位置 · `:184` 常驻税句 · `:186` 永不互转 · `:191-194` 欠账 + `ledger row`。
- `thincoder-core/prompts/discipline-normal.md:189-191`：普通侧同款禁令在盘（`:190` 单测档随批档存 ∥ `:191` 不提升）——L2 零改的依据，也是上抛项的坐标。
- `docs/core/design/TESTING.md` §3.1 ∥ §3.2（`:105-116`）：三层来源与寿命表、两层界线永不互转——设计面机制在案，本批零改（本条的落点是提示词，不是测试机制）。
- 本档 §6.44（`:2746-2903`）∥ §6.45（`:2905-3113`）∥ §6.46（`:3115-3261`）∥ §6.47（`:3264-3426`）：形制与写形先例。
- `node scripts/prompt-refs-check.mjs` 基线 = §6.47 勘察行所记命中 0（本批落地后由实施席复跑，A7）。
- 公共源勘察：工作目录内公共源文档已查（`docs/**` 需求 ∥ 设计两树 + `thincoder-core/prompts/**`）——相关 = 上述三档；独立公共源文档仓：无（`PROJECT-MANIFEST.json` `index.publicRepos` = []，本席实读）。

**UI / 交互决策**：无界面面——本条只改模型可见提示词文本与设计档。

**上抛项（待裁）**

- 〔父侧 · 普通侧面〕`thincoder-core/prompts/discipline-normal.md:191` 有同款禁令、同样没有去处（`:190` 单测档随批档存、不删，欲望的去处因此更隐）。本批按任务书只落工程面，未夹带——是否补普通面一句、措辞是否随该面的寿命口径改写 = 父侧裁（补则另起一笔，不并入本批）。
- 〔父侧 · 既有重复〕同档 `:171` ∥ `:186` 是同一禁令的两处成文（D2 既有重复，先于本批在盘）。本批新句不引用、不改写任何一处；是否合并 = 父侧裁，不在本批射程。
- 〔父侧 · 编号〕本节未加 §7 D-PS 行（D-PS46 / D-PS47 的归属仍待父侧收口时定，承 §6.47 上抛项）。

### 6.49 验收命令纪律：验收只写改动面单测单档（三处提示词落点 + 一处旧副本删除 · F1/F2/F3）

**来源**：需求权威 = `docs/core/requirements/TESTING.md:73`（F1：改动内只跑单元测试）· `:74`（F2：报告义务句逐字）· `:75`（F3：集成测试归父侧，收口恰一次/端）· `:84`（F12：集成集 = 发布门）。台账 `#1763`。

用户 2026-10-24 19:08 逐字：「那怎么阻止这个毛病？提示词如何增强才能阻止你写这个要求？designer和advisor是不是也应该检查踢出跑全量的要求？」——本批 = 该裁定的现状落点；语义以需求档为准。

**实证（同一句话在三处写验收时漏掉 · 本席实读 2026-10-24）**

| # | 座位 | 实读坐标 | 缺的那一半 |
|---|---|---|---|
| F1 | 主 agent 派单 | 今晚任务书的验收 =「全量套件全绿」——本批编制行逐字：`今晚任务书把「全量套件全绿」写成验收，逼每一轮跑集成`（`docs/batches/2026-10-24-acceptance-command-discipline.md:3`） | 提示词没有一句管「验收命令该写什么」；`thincoder-core/prompts/discipline-engineering.md:192` 的 `` `The gate`: one `test` run, all green `` 未限定谁 ∥ 何时，被读成每批都要过一遍的门 |
| F2 | 设计席 | `docs/batches/2026-10-24-tool-timeouts.md:125` = `` `npm test` 绿（收集面 = `thincoder-cli/test/*.test.mjs` + `test/integration/*.test.mjs`） `` | 设计席的自查（`thincoder-core/prompts/persona-eng-designer.md:114`）只问「可机判」，不问「这条命令是不是本批的动作」 |
| F3 | 评审兜底 | `thincoder-core/prompts/advisor-design.md:52-55`（第 12 条）只查「集成测试设计段在不在」 | 验收命令面无人查：全量写进验收时，第 12 条照样过 |
| F4 | 既有副本 | `thincoder-core/prompts/persona-engineering.md:345`（`**Verification = targeted unit tests for the changed face (single files) only** — an all-green-per-round clause …; the integration-test run belongs to parent-side closeout.`） | 规则在盘、今晚仍被跳过：它是「验证范围」注记，不是「验收文本」禁令，也没有可写的替换形 ⇒ 语义并入 B1、旧副本删除（K2） |

**机制（一句话，三处同义不同面）**

1. 一句话 = **验收写的是改动面单测单档；全量套件是父侧的收口动作**。三处只换动作主语：主 agent **写**（任务书 `acceptance`）· 设计席 **自查**（§2 验收对照与设计档验收）· advisor **审**（设计档）。
2. why（三处同源）：集成是你的收口动作；写进任务书就变成每轮成本——每轮都跑的套件不再是发布门，只是回合成本（需求 F1 ∥ F3）。
3. 给替换形：验收命令写 `node --test <改动面单档>`；无可跑面的改动写一次性读数（C4 的正面形）。集成那半写成指向收口报告行的指针形（`reported in the closeout line, not run here`），不复述义务句原文，不让写者在边缘自己发明。
   「无可跑面」的实读锚 = 本节受影响文件表前五行全为 `.md` 文本档（提示词 4 + 设计档 1），无 `.mjs` ∥ `.js` 档 ⇒ 不存在 `node --test <档>` 可跑面；本批自身即此态。
4. 不给实施席加「拒绝违规验收」的检查（本批不做）：让执行者挡派单者，来回确认比派单前查一遍贵；也不开「任务书评审」维度。

**逐字英文文本（实施席照此落笔 · 唯一权威目标形）**

双面形照本档 §6.44：英文块 = 落地目标形；中文复核面 = 同一语义、供人复核、不入提示词。
写形照本档 §6.45：一条规则一行 · 题眼加粗 · 理由以 `Why` 起头 · 每行 ≤300 字符——围栏块已按此形写好，**原样落、不折行**。

B1 — `thincoder-core/prompts/discipline-engineering.md` · `## Testing discipline` 节 · `**Integration tests = the release gate, not a work rhythm**` 行之后 ∥ `**A missing integration suite is a debt, not a steady state**` 行之前，插入两行：

```text
- **An acceptance criterion names the changed-face unit test file or files (`node --test <file> [<file> ...]`), or a one-off reading when no runnable face exists, never a full-suite run**: the full suite is the parent-side closeout gate — the integration half is reported in the closeout line, not run here.
  Why: written into a batch, the suite runs every round — a release gate turned into a round cost, and nothing new is proven by running it again.
```

B2 — `thincoder-core/prompts/persona-eng-designer.md` · `- **Acceptance** — each criterion machine-checkable;` 行之后 ∥ `- **Dependencies** — upstream/downstream dependencies.` 行之前，插入两行：

```text
   **A full-suite acceptance is not a batch criterion**: it names the parent-side closeout gate — the criterion is the changed-face unit test file or files (`node --test <file> [<file> ...]`), or a one-off reading when no runnable face exists; the integration half is reported in the closeout line, not run here.

   Why: a suite run per batch is a round cost, not a release gate.
```

B3 — `thincoder-core/prompts/advisor-design.md` · 第 12 条末 · `**Why**: integration tests are the only acceptance run` 行之后 ∥ `## Output Format` 标题之前，插入两行（B3 判断句 + 它自己的 `Why` 行——理由紧随其规则，承本档 §6.45 写形；第 12 条 `:54`↔`:55` 的「规则 → Why」对因此不被拆）：

```text
    **A design's acceptance naming a full-suite run ⇒ 🔴 (the release gate written as a round cost)**: the criterion is the changed-face unit test file or files (`node --test <file> [<file> ...]`), or a one-off reading when no runnable face exists; the integration half is reported in the closeout line, not run here.

    Why: acceptance is what the implementing round runs — a suite there turns the release gate into a round cost, and a repeat run proves nothing new.
```

**中文复核面（与英文面同一语义 · 供人复核，不入提示词）**

- **B1 · 验收只写改动面单档**：验收条件写的是改动面的单测档（`node --test <档>`）；无可跑面的改动写一次性读数；从不是全量套件的绿。全量套件是父侧收口动作——集成那半写在收口报告行里，这里不跑。
  理由：写进任务书，套件就每轮都跑——发布门被写成了回合成本，再跑一遍也证明不了新东西。
- **B2 · 设计席自查**：把全量写进验收的，不是本批的验收条件——它指的是父侧的收口门；验收条件是改动面单测档（`node --test <档>`），无可跑面的改动写一次性读数；集成那半写在收口报告行里，这里不跑。
  理由：每批跑一遍套件是回合成本，不是发布门。
- **B3 · 评审兜底**：设计档的验收写成全量套件跑 ⇒ 🔴（发布门被写成回合成本）——本批的验收条件是改动面单测档（`node --test <档>`），无可跑面的改动写一次性读数；集成那半写在收口报告行里，这里不跑。
  理由：验收就是实施轮要跑的那条命令——把套件写进它，发布门就成了每轮的回合成本，再跑一遍也证明不了新东西。

**与既有句的不重复判据（D2）**

- `thincoder-core/prompts/discipline-engineering.md:193`（`**Iteration = unit tests only**`）管**执行面**：迭代只跑改动面单测；`:194`（`**Integration tests = the release gate, not a work rhythm**`）管**集成跑几次 ∥ 谁跑**；B1 管**验收文本写什么命令**——三句各答一问，互不顶替。
- 同档 `:197` 的报告行（F2 义务句）管**报告怎么说**；B1 的 `reported in the closeout line, not run here` 只指过去，不复述义务句原文。
- `thincoder-core/prompts/persona-eng-designer.md:130` 的 item 5（`Acceptance criteria pointing back`）管**回指需求**；B2 管**验收命令的形态**——不同判据面。
- `thincoder-core/prompts/advisor-design.md` 第 12 条既有句管**集成测试设计段在不在**；B3 在同一维度里补**验收命令面**（不新开判据——本批明令）。
- `thincoder-core/prompts/persona-engineering.md:345` 与 B1 同义 ⇒ 并入 B1 后删除旧副本（K2），不留两处成文。

**落点表（实施席逐处执行 · 坐标 = 现盘实读 2026-10-24）**

| # | 文件 | 落点（内容锚） | 动作 | 预期 Δ（估值 · 不作验收条） |
|---|---|---|---|---|
| L1 | `thincoder-core/prompts/discipline-engineering.md` | `**Integration tests = the release gate, not a work rhythm**` 行之后 | 插入 B1 两行 | +2 行 |
| L2 | `thincoder-core/prompts/persona-engineering.md` | `**Verification = targeted unit tests for the changed face (single files) only**` 行（`:345`） | 整行删除（旧副本零残留；语义 = B1） | −1 行 |
| L3 | `thincoder-core/prompts/persona-eng-designer.md` | `- **Acceptance** — each criterion machine-checkable;` 行之后 | 插入 B2 两行 | +2 行 |
| L4 | `thincoder-core/prompts/advisor-design.md` | 第 12 条末 · `**Why**: integration tests are the only acceptance run` 行之后（`## Output Format` 前） | 插入 B3 两行（判断句 + `Why` 行） | +2 行 |
| L5 | 其余提示词档 · `thincoder-core/tool-docs/**` · 产品代码 · 需求档 · `docs/core/design/TESTING.md` | — | 零改 | ±0 |

实施按**内容锚**定位；行号只作现盘读数。`thincoder-core/prompts/discipline-engineering.md` 的 `## Testing discipline` 节即测试纪律单一出处（`:166-203`）。

**验收（A1–A7 · 逐条回指 F1/F2/F3 与本批验收 ①–⑤）**

| # | 验收 | 判法 / 读数 |
|---|---|---|
| A1 | B1 逐字落盘（本批 ①） | 落地后 `thincoder-core/prompts/discipline-engineering.md` 含 `An acceptance criterion names the changed-face unit test file` 恰 1 · `never a full-suite run` 恰 1 · `or a one-off reading when no runnable face exists` 恰 1；围栏块内容与本节 B1 逐字符一致 |
| A2 | B1 位置可判 | 行首索引 `**Iteration = unit tests only**` < `An acceptance criterion names the changed-face unit test file` < `**A missing integration suite is a debt, not a steady state**`；例外半句与规则同行（B1 仍两行，不另起行） |
| A3 | B2 落盘 + 位置 | `thincoder-core/prompts/persona-eng-designer.md` 含 `A full-suite acceptance is not a batch criterion` 恰 1 · `or a one-off reading when no runnable face exists` 恰 1；`- **Acceptance** — each criterion machine-checkable;` < 新行 < `- **Dependencies** — upstream/downstream dependencies.` |
| A4 | B3 落盘 + 位置 | `thincoder-core/prompts/advisor-design.md` 含 `A design's acceptance naming a full-suite run` 恰 1 · `or a one-off reading when no runnable face exists` 恰 1；`**Why**: integration tests are the only acceptance run` < B3 规则行 < `## Output Format`；规则行的下一行 = B3 自己的 `Why` 行（缩进后以 `Why:` 起头） |
| A5 | 旧副本零残留（本批 ②） | `thincoder-core/prompts/persona-engineering.md` 扫 `all-green-per-round` ∥ `targeted unit tests for the changed face` ∥ `the integration-test run belongs to parent-side closeout` 各 0 命中 |
| A6 | 写形零回归（本批 ③） | 四档逐行 ≤300 字符（现盘基线 = discipline max 300 · persona-eng max 300 · designer max 298 · advisor max 290）· `##` 块计数不变（10 ∥ 17 ∥ 9 ∥ 7）· B1 ∥ B2 ∥ B3 各带一行 `Why`（判法 = 各自规则行的下一行，去掉行首缩进后以 `Why:` 起头）· `node scripts/prompt-refs-check.mjs` 命中 0 |
| A7 | `doc_check`（本批 ⑤） | 本节落笔后实跑 `doc_check(mode:"gate", docs=["docs/core/design/PROMPT-SYSTEM.md"])` ⇒ 首行 `DOC-CHECK GATE: PASS`；实施轮改提示词后父侧复跑同判 |

写入读法 = **一次性落地读数**（`node` 逐档读 + 字串计数 + 行首索引比较），零常驻断言（承 F19 与新写散文锚禁令；一次性属性同 §6.48 A3 口径）。

**用例表（正常 / 边界 / 错误）**

| # | 场景 | 输入 / 动作 | 期望 |
|---|---|---|---|
| C1 | 正常 · 派单写验收 | 主 agent 为改动面派 eng-coder，`acceptance` 写 `node --test <改动面单档>`，集成半用义务句 | 验收只含改动面单档；无代码改动 ⇒ 一次性读数（C4 同形）；集成零跑 |
| C2 | 正常 · 设计席自查 | 设计席写 §2 验收对照 ∥ 设计档 item 5 | 验收命令 = 改动面单档（无跑面 ⇒ 一次性读数）；集成半写义务句（指针形），不写全量 |
| C3 | 正常 · advisor 审设计 | 设计档验收写 `npm test` 全绿 | 按第 12 条 B3 判 🔴，实现前拦下；无跑面的批不因缺测试档被判 🔴 |
| C4 | 边界 · 纯文档批 | 无代码改动（如本批自身） | 验收 = 一次性字串读数（B1/B2/B3 例外半句的正面形）；无集成动作、无「全量绿」句 |
| C5 | 错误 · 设计档写全量 | 设计档或 §2 的验收行写全量套件绿 | 设计不合格（B3 判 🔴；B2 应在本席自查时先拦）——判据是全量，不是「缺测试档」 |
| C6 | 错误 · 换名字的全量 | 「全量套件全绿 pass=N」或 `cd <repo> && node test/run.mjs` | 同 C5：判据 = 该命令是不是父侧收口动作，不认措辞 |

**集成测试设计（设计档第 9 项）**：本批不改业务行为（受影响面 = 提示词文本 4 处 + 设计档，零代码档）⇒ 无集成场景新增 ∥ 修订，也不新增可跑用例。理由：集成用例从用户可见入口走真实业务，本批没有业务面可走；`none` 的成立条件同 §6.46 K2（未触及业务行为的改动）。

**受影响文件（现行 = 本席 `node` 实读 2026-10-24；行数口径 = `split(/\r?\n/).length - 1`）**

| 文件 | 现行 | Δ → 改后 |
|---|---|---|
| `thincoder-core/prompts/discipline-engineering.md` | 342 行 / 42,920 字符 / max 300 / >300 = 0 / `##` 10 | L1 +2 ⇒ 344 行；逐行 ≤300 保持 |
| `thincoder-core/prompts/persona-engineering.md` | 473 行 / 68,194 字符 / max 300 / >300 = 0 / `##` 17 | L2 −1 ⇒ 472 行；逐行 ≤300 保持 |
| `thincoder-core/prompts/persona-eng-designer.md` | 148 行 / 19,168 字符 / max 298 / >300 = 0 / `##` 9 | L3 +2 ⇒ 150 行；逐行 ≤300 保持 |
| `thincoder-core/prompts/advisor-design.md` | 135 行 / 14,710 字符 / max 290 / >300 = 0 / `##` 7 | L4 +2 ⇒ 137 行；逐行 ≤300 保持（新最长行 = B3 规则行 295，Why 行 150） |
| `docs/core/design/PROMPT-SYSTEM.md` | 3,638 行 / 309,244 字符（本节写入前） | 本节新增（设计档面，非验收对象） |
| L5 所列各面 | — | ±0 |

**关键决策**

| # | 决策 | 理由 |
|---|---|---|
| K1 | 一句话三处，不造三套机制 | 三处动作不同（写 ∥ 自查 ∥ 审），规则同一句；拆成三条会得到三个可各自漂移的判据（本批明令「一句话，三处同义不同面」） |
| K2 | 旧副本 `thincoder-core/prompts/persona-engineering.md:345` 删除，语义并入 B1 | D2 单一出处：B1 覆盖旧句全部语义（改动面 ∥ 每轮成本 ∥ 父侧收口）并补「验收文本禁令 + 替换形」；今晚的失效正是「规则在盘仍被跳过」，此时留两处成文只会让可读性更差 |
| K3 | B1 落测试纪律节，不新开节 | 该模式无独立派单节；测试纪律节是测试执行面的单一出处，`##` 块计数零连带（10 ⇒ 10） |
| K4 | B3 补在第 12 条内，不新开第 13 条 | 第 12 条已管设计档的测试面，验收命令是同一面的另一半；新开一条 = 又造一个维度（本批明令） |
| K5 | 逐字块 = 英文落笔目标形 + 中文复核面 | §6.44 双面形：实施席有可比对目标，验收有可核字串 |

**先例 ∥ 偏离**：先例 = 本档 §6.47 ∥ §6.48 形制（双面形 §6.44 + 写形 §6.45 + 落点表 + 验收 + 用例表 + 关键决策 + 勘察证据行）。
**对齐** = 同形落笔。
**偏离** = ① 首次以「删除既有副本」作为一处落点（K2）——旧副本与新句同义，两处成文即 D2 缺陷；② B2 落设计席的验收元素自查处（`:114`），而不是设计档 9 项清单——该句同时覆盖两个读法：查需求的 Acceptance 元素、写本批的验收条件。

**既有件三问（新增标签「验收命令纪律」）**：existing = `thincoder-core/prompts/discipline-engineering.md:193`（`**Iteration = unit tests only**`）· `:194`（`**Integration tests = the release gate, not a work rhythm**`）——B1 与之同向，补的是「验收文本写什么」这一面。

existing but unusable = `thincoder-core/prompts/persona-engineering.md:345`——有验证范围、无验收文本禁令、无替换形 ⇒ 并入 B1 后删除。

**勘察证据行（本席实读 · 2026-10-24）**

- `docs/core/requirements/TESTING.md:73` F1 全行 · `:74` F2 义务句逐字 · `:75` F3 · `:84` F12（集成集 = 发布门）· `:160` F19（禁止新写散文锚）。
- `thincoder-core/prompts/discipline-engineering.md`：342 行 / 42,920 字符 / max 300 / >300 = 0 / `##` 10；`:192` 门句 · `:193` Iteration · `:194` release gate · `:197` 报告行。
- `thincoder-core/prompts/persona-engineering.md`：473 行 / 68,194 字符 / max 300 / >300 = 0 / `##` 17；`:344` `**acceptance**` · `:345` 旧副本整行；档头 slot = `[1] consumers:[main session·engineering mode; …]`（本席实读 `:1`）。
- `thincoder-core/prompts/persona-eng-designer.md`：148 行 / 19,168 字符 / max 298 / >300 = 0 / `##` 9；`:114` Acceptance 元素 · `:115` Dependencies · `:130` item 5。
- `thincoder-core/prompts/advisor-design.md`：135 行 / 14,710 字符 / max 290 / >300 = 0 / `##` 7；`:52-55` 第 12 条全文（判断句 ∥ 例外句 ∥ Why）· `:56` 空行 · `:57` `## Output Format`（B3 新落点 = `:55` 之后）。
- `docs/batches/2026-10-24-tool-timeouts.md:125`：`npm test` 绿（收集面 = `thincoder-cli/test/*.test.mjs` + `test/integration/*.test.mjs`）——设计席写全量的实证。
- 本批编制行（`docs/batches/2026-10-24-acceptance-command-discipline.md:3`，逐字）：`今晚任务书把「全量套件全绿」写成验收，逼每一轮跑集成，违 TESTING.md F1/F3。`——F1 实证的承载处；台账 `#1763`。
- `docs/core/design/TESTING.md`（L5 零改的判据 · 本席复扫 2026-10-24）：扫 `全量` ∥ `full suite` ∥ `full-suite` ∥ `acceptance` 各 0 命中；`:24` 管改动内执行（`只验本任务改动——跑改动面相关单元测试（单元测试档——§2；单档 ∕ 相关子集）；不得逐轮跑集成测试`）· `:422` 管发布门语义（`npm test 只证明一件事：集成层的发布门`）——两句都不管「验收文本写什么命令」⇒ B1 在该档无第二处成文，L5 零改成立。
- 公共源勘察：`PROJECT-MANIFEST.json:35` `"publicRepos": []`（本席实读）——独立公共源文档仓无，已查、无相关。

**UI / 交互决策**：无界面面——本批只改模型可见提示词文本与设计档。

**上抛项（待裁）**

- 〔父侧 · 落点 1 的既有副本〕`thincoder-core/prompts/persona-engineering.md:345` 在本批前已在盘（本席实读；今晚任务书仍写全量 ⇒ 规则存在但无人执行）。本设计按 K2 删除它并并入 B1；若父侧认为该副本应保留（例如认为它守着别的读法），删除项 L2 请驳回——不驳回则按 L2 落。
- 〔父侧 · 编号〕本节未加 §7 D-PS 行（D-PS46 / D-PS47 归属仍待父侧收口时定，承 §6.47 ∥ §6.48 上抛项）。

### 6.50 集成测试的判据轴 = 组件之间的交互（提示词四面 · 定义逐字 · 触发两维取或）

**来源**：需求权威 = `docs/core/requirements/TESTING.md` §0（`:16-18` IEEE 610.12 逐字定义）+ F34（`:199`）；用户 2026-10-24 19:41 逐字「咱能不把话说得这么死这么细吗？你这么一细化要求，就把事情搞串味儿了，你要不先上网学习一下集成测试的概念再来写？」+ 19:46「你别生造词，严肃认真一点，交互/组合和你说的『接缝』差了十万八千里。」台账 `#1768`。本批 = 该裁定的现状落点；语义以需求档为准。

**定义（第一手 · 逐字 · 不改写；本批不新引外部源）**

- IEEE 610.12 ∕ ISO/IEC/IEEE 24765（逐字出处 = `docs/core/requirements/TESTING.md:17`）：`testing in which software components, hardware components, or both are combined and tested to evaluate the interaction between them.`

两处原词 = `interaction between components`（中文「组件之间的交互」）与 `combined`。本节与落地文本只用这两个词的既有译法，不引入自造名（用户 19:46 裁定）。

**实证（为什么改）**

- 超时批（`docs/batches/2026-10-24-timeout-and-digest.md:37` 逐字：`→ effectiveBodyIdleMs(provider)（provider/core.mjs …）为唯一解析点 → 八处消费点原地改读`；
  消费点 `:158` = `provider/core.mjs:256`（readSSE）· `:274`（重试 readSSE）· `:413`（`_bodyIdleMs`））：`provider` 与 SSE reader 之间的配合变了，业务上看不出变化 ⇒ 按现盘判据轴（`business behavior`）那一批会写成 `none`，那条交互就没有人测。
- `#59` 评审两条 🟡（`docs/batches/2026-10-24-acceptance-command-discipline.md:153` 逐字：替换形只认单档 ∥ `:192` 门句未限定；`:178` 记两条并入本批 `#1768` 统一处理）。

**判（逐处 · 现文实读 2026-10-24）**

| # | 坐标 | 现文（摘 · 逐字） | 判 | 处置 |
|---|---|---|---|---|
| J1 | `thincoder-core/prompts/discipline-engineering.md:179` | none stands only where the change does not touch **business behavior** | 判据轴错位——**本节最重要一处**：不动业务行为、却改变组件之间交互的改动，按此句可写 `none`；反向也漏——只改业务可观察结果的批次会让既有断言静默失效 | 换轴 + 保留业务断言面（B2 两维取或） |
| J2 | 同档 `:181` | `exercise **components working together** (the real composition — …) — … walk through the real business from a user-visible entry` | 前半 = 定义（措辞非逐字）；后半 = 本项目入口选择（N20），被写成定义 | 拆开（B3） |
| J3 | 同档 `:171` | `(integration cases are established from business needs, not graduated from unit files)` | 取材口径写进定义位；取材在 `:182` 已有出处 | 删括号（B1） |
| J4 | 同档 `:192` | **The gate**: one `test` run, all green. | `#59` 🟡②：未限定谁 ∥ 何时，仍可被读成每批全量 | 限定（B4） |
| J5 | `thincoder-core/prompts/persona-eng-designer.md:136-137` | `entry = a business-observable point, criterion = the business result it asserts, and each row points back …` | 入口 ∥ 判据 ∥ 回指三件捆在一条定义位上 | 拆开（B7） |
| J6 | `thincoder-core/prompts/advisor-design.md:52` | `…the business result each asserts, and the business requirement each traces back to` | 同 J5 的评审面：判据位只写业务结果 | 拆开（B8） |
| J7 | 同档 `:53` ∥ `:54` | `a change that alters no business behavior …` | 清空条件挂在业务行为轴 | 换轴（B9 ∥ B10） |
| J8 | 同档 `:55` | `integration tests are the only acceptance run that starts from a user-visible entry` | 事实错：入口是本项目选择，不是「唯一」的判据；收窄为定义面 | 收窄（B11） |
| J9 | `thincoder-core/prompts/discipline-normal.md:192` | `**Integration tests** exercise components working together (the real composition).` | 定义措辞非逐字（工程面同句已改） | 换轴（B5） |
| J10 | 同档 `:194` | `a single change adds no case to the set (per-change additions make cost scale with change frequency)` | 与 F34 正面相反：交互变了的改动必须同步改用例 | 换轴（B6） |
| J11 | 同档 `:191` | `— integration cases are established from business needs, not graduated from unit files.` | 与 J3 同句（父侧清单未列；同机制同区域——只改工程面即造两面差异） | 删括号（B12） |
| J12 | 同档 `:193` | `**The pre-release acceptance loop**: walk through the real business from a user-visible entry.` | 入口已单列成句，不在定义位 | 不改 |
| J13 | 同档 `:197` | `Integration suites live in the front-end entry points only — front-end scenarios cover the core transitively …` | 放置决策（N20），不是定义位；与 `thincoder-core/prompts/discipline-engineering.md:186` 同文，单改一面即造两面差异 | 不改 |
| J14 | `thincoder-core/prompts/persona-eng-designer.md:115` ∥ `thincoder-core/prompts/advisor-design.md:56` | the criterion is the changed-face unit test file or files (`node --test <file> [<file> ...]`) | `#59` 🟡①：只认单档，未覆盖需求 F1 允许的「相关子集」；第三面 `thincoder-core/prompts/discipline-engineering.md:195` 在本批冻结区（`:193-197`）⇒ 三面不能只改两面 | 上抛（见上抛项 1） |

**机制**

1. **判据轴 = 定义原词**：集成测试评的是**组件之间的交互**；`business behavior` 不是判据轴——它是本项目的断言面（②③ 只断言业务可观察结果，`docs/core/design/TESTING.md` §4.5）。判据轴的设计面出处已在该档 `:104`（「集成 = 组件组合与交互」）——本节只做提示词面落点，不复述机制（D2）。
   **触发两维取或，不是替换**：必须动集成用例的改动 = 触及**组件之间的交互**（判据轴）**或** 改动**既有用例所断言的业务可观察结果**（断言面——改了它，既有断言静默失效）。`none` 只在两维都未触及时成立；需求 F34 的业务触发保留。
2. **三件各归其位**：判据 = 组件之间的交互（定义）· 入口 = user-visible entry（本项目的入口选择，N20）· 回指需求 = 记账（F30 的可追溯）。捆在一条定义位上，读者只能把入口与记账当成定义的一部分。断言的业务结果 = 断言面的主体（K4）：它在行字段里、不是判据。
3. **改动量**：删四处旧词（`business behavior` 判据位 ∥ `components working together` ∥ `established from business needs` ∥ `a single change adds no case`）；每处行数持平；字符净增（两维取或的措辞比旧句长）。
   逐处：L1 −87 · L2 +39 · L3 −54 · L4 +24 · L5 +7 · L6 +28 · L7 −87 · L8 +95 · L9 +76 · L10 +80 · L11 +81 · L12 −9；文件总量：工程 −78 · 普通 −52 · 设计席 +95 · 评审 +228。

**逐字英文文本（实施席照此落笔 · 唯一权威目标形）**

双面形照本档 §6.44：英文块 = 落地目标形；中文复核面 = 同一语义、供人复核、不入提示词。
写形照本档 §6.45：一条规则一行 · 题眼加粗 · 理由以 `Why` 起头 · 每行 ≤300 字符——围栏块已按此形写好，**原样落、不折行**。

B1 — `thincoder-core/prompts/discipline-engineering.md:171` 整行替换：

```text
- **Unit test files are not promoted into integration tests**.
```

B2 — 同档 `:179-180` 两行整替为两行：

```text
- **`none` stands only where the change touches neither the interaction between components nor a business-observable result an existing case asserts**: a batch that touches either and closes with no integration-case change is incomplete — that case should have been designed before the code.
  Why: an unconditional `none` let any change close against an empty set, so the set stayed empty while every closeout read green.
```

B3 — 同档 `:181` 整行替换：

```text
- **Integration tests** combine components and test the **interaction between components** — the **pre-release acceptance loop**, which this project enters from a user-visible entry.
```

B4 — 同档 `:192` 整行替换：

```text
- **The gate** (closeout, parent side): one `test` run, all green.
```

B5 — `thincoder-core/prompts/discipline-normal.md:192` 整行替换：

```text
- **Integration tests** combine components and test the **interaction between components**.
```

B6 — 同档 `:194` 整行替换：

```text
- **Integration test assets**: business scenarios + production-problem additions, asserting only business-observable results; permanent, and a change that alters an interaction between components or a business-observable result an existing case asserts must revise them.
```

B7 — `thincoder-core/prompts/persona-eng-designer.md:136-137` 两行整替为两行：

```text
9. **Integration test design** — the scenarios this change earns, each row naming the **interaction between components** it evaluates, the business-observable result it asserts, the requirement it serves, and this project's entry (a business-observable point).
   A change that alters an interaction between components or a business-observable result an existing case asserts names the cases it adds ∥ revises — "no change" is not an answer there.
```

B8 — `thincoder-core/prompts/advisor-design.md:52` 整行替换：

```text
12. **Integration-test design**: the design document must contain an integration-test design section — the scenarios this change requires, the **interaction between components** each evaluates, the business result each asserts, the project's entry, and the business requirement each traces back to.
```

B9 — 同档 `:53` 整行替换：

```text
    **A design missing that section ⇒ 🔴 (design incomplete)**; a change that touches neither an interaction between components nor a business-observable result an existing case asserts states so, with its reason, in that section.
```

B10 — 同档 `:54` 整行替换：

```text
    **A reason that is not "this change touches neither the interaction between components nor a business-observable result an existing case asserts" does not stand** — e.g. the 50–100 case window being full ⇒ still 🔴.
```

B11 — 同档 `:55` 整行替换：

```text
    **Why**: no other acceptance run evaluates the interaction between components, and the batch's unit-test files are deleted at closeout — a design that never names those scenarios leaves that interaction with no acceptance at all.
```

B12 — `thincoder-core/prompts/discipline-normal.md:191` 整行替换：

```text
- **Unit test files are not promoted into integration tests**.
```

**中文复核面（与英文面同一语义 · 供人复核，不入提示词）**

- **B1 ∥ B12 · 不提升**：单元测试档不提升为集成测试——一句话，括号里的取材口径删掉（取材住 `:182` ∥ B6）。
- **B2 · `none` 的成立条件**：`none` 只在改动**两维都未触及**时成立——**组件之间的交互**与**既有用例所断言的业务可观察结果**；任一维变了却在收口里没有集成用例变化 = 收口不完整——那条用例本应在写码前就设计出来。
- **B3 ∥ B5 · 定义**：集成测试把组件**组合起来**，测**组件之间的交互**——上线前的验收回路；本项目从用户可见入口进入（入口是本项目的选择，不是定义）。
- **B4 · 门**：门 = 一次 `test` 跑、全绿——收口时、父侧（谁 ∥ 何时写进门句）。
- **B6 · 资产**：业务场景 + 生产补入，只断言业务可观察结果；常驻，**改动触及组件之间的交互、或改动既有用例所断言的业务可观察结果时必须改它们**。
- **B7 · 设计席第 9 项**：集成测试设计——这次改动挣来的场景；每行写它评的**组件之间的交互**、它断言的**业务可观察结果**、它服务的需求、以及本项目的入口（业务可观察点）。交互变了、或既有用例断言的业务可观察结果变了的改动，写明新增 ∥ 修订了哪些用例——「无变化」不是答案。
- **B8–B11 · 评审第 12 条**：设计档须含集成测试设计段——场景、每段评的**组件之间的交互**、断言的业务结果、本项目的入口、回指的业务需求（与 B7 的行字段同一集）；缺段 ⇒ 🔴。两维都未触及的改动写明并给理由；理由不是「两维都未触及」即不成立（窗口满不是理由）。理由 = 没有别的验收跑在组件之间的交互上，且本批单元测试档收口即删——设计不点名那些场景，这条交互就没有验收。

**与既有句的分工（D2）**

- 取材（业务场景 + 生产补入）已由 `thincoder-core/prompts/discipline-engineering.md:182` ∥ B6 承载 ⇒ B1 ∥ B12 删括号后无失。
- 前端口放置与「核仓不设集」已由 `:186` ∥ `thincoder-core/prompts/discipline-normal.md:197` 承载 ⇒ B3 删 `front-end scenario drives the core transitively` 后覆盖论证仍有出处。
- `:193-197` 的验收命令纪律本批冻结 ⇒ B4 只补谁 ∥ 何时，不改命令形态；`#59` 🟡① 的替换形因此三面不能同改（上抛项 1）。
- `thincoder-core/prompts/discipline-engineering.md:190`（`No conversion between the two`）与 B1 ∥ B12 同向、各自可独立判读：`:190` 管两层永互转，B1 ∥ B12 管单测档不提升——不合并（合并会拆掉 `:190` 的独立可判性）。

**落点表（实施席逐处执行 · 坐标 = 现盘实读 2026-10-24）**

| # | 文件 | 落点（内容锚） | 动作 | 预期 Δ（估值 · 不作验收条） |
|---|---|---|---|---|
| L1 | `thincoder-core/prompts/discipline-engineering.md` | `**Unit test files are not promoted into integration tests**` 行 | 整行替换为 B1 | ±0 行 · −87 字符 |
| L2 | 同档 | `does not touch business behavior` 两行块 | 两行整替为 B2 | ±0 行 · +39 字符 |
| L3 | 同档 | `**Integration tests** exercise **components working together**` 行 | 整行替换为 B3 | ±0 行 · −54 字符 |
| L4 | 同档 | `The gate` 行（`:192`） | 整行替换为 B4 | ±0 行 · +24 字符 |
| L5 | `thincoder-core/prompts/discipline-normal.md` | `**Integration tests** exercise components working together` 行 | 整行替换为 B5 | ±0 行 · +7 字符 |
| L6 | 同档 | `**Integration test assets**` 行 | 整行替换为 B6 | ±0 行 · +28 字符 |
| L7 | 同档 | `**Unit test files are not promoted into integration tests**` 行 | 整行替换为 B12 | ±0 行 · −87 字符 |
| L8 | `thincoder-core/prompts/persona-eng-designer.md` | `9. **Integration test design**` 两行块 | 两行整替为 B7 | ±0 行 · +95 字符 |
| L9 | `thincoder-core/prompts/advisor-design.md` | `12. **Integration-test design**` 行 | 整行替换为 B8 | ±0 行 · +76 字符 |
| L10 | 同档 | `**A design missing that section ⇒ 🔴` 行 | 整行替换为 B9 | ±0 行 · +80 字符 |
| L11 | 同档 | `**A reason that is not` 行 | 整行替换为 B10 | ±0 行 · +81 字符 |
| L12 | 同档 | `**Why**: integration tests are the only acceptance run` 行 | 整行替换为 B11 | ±0 行 · −9 字符 |
| L13 | 其余提示词档 · `thincoder-core/tool-docs/**` · 产品代码 · 需求档 · `docs/core/design/TESTING.md` | — | 实施席零改（`docs/core/design/TESTING.md:104` 判据轴已在盘、同向；`docs/core/requirements/TESTING.md:199` F34 措辞由父侧另笔已落两维形） | ±0 |

实施按**内容锚**定位；行号只作现盘读数。J12 ∥ J13 判「不改」，不入落点表。

本节的 B2 ∥ B7 ∥ B9 ∥ B10 取代 §6.47 已落围栏块的两处：`none` 行 + 其 `Why`（§6.47 `:3299`–`:3300`）与设计席 item 9（`:3322`–`:3323`）——本档 §6.1「批次收尾核对」的比对基线以本节为当前形。

**需求档 F34 的措辞同步 = 已落（父侧另笔）**：`docs/core/requirements/TESTING.md:199` 现为两维形——改动触及**组件之间的交互**或**既有用例所断言的业务可观察结果**时必须同步改动集成测试；收口行「集成场景无变化」只在**两维都未触及**时成立。需求档与提示词面对同一判据同一措辞，本批收口前置已满足。

**验收（A1–A8 · 逐条回指需求 §0 ∥ F34 ∥ F1 与本批验收 ①–⑤）**

| # | 验收 | 判法 / 读数 |
|---|---|---|
| A1 | 落笔逐字一致（本批 ①） | 落地后按档逐串恰 1 次（该串只在其落点档出现）——工程：`touches neither the interaction between components nor a business-observable result an existing case asserts` ∥ `combine components and test the **interaction between components**`；普通：`combine components and test the **interaction between components**`（各档各 1，非全档合计 1）∥ `a change that alters an interaction between components or a business-observable result an existing case asserts must revise them`；设计席：`the business-observable result it asserts` ∥ `A change that alters an interaction between components or a business-observable result an existing case asserts`；评审：`the business result each asserts` ∥ `the project's entry` ∥ `no other acceptance run evaluates the interaction between components`；围栏块与本节 B1–B12 逐字符一致（`node` 一次性读档比对） |
| A2 | 旧词零残留（本批 ③ 减法的另一半） | 落地后 `thincoder-core/prompts/*.md` 扫 `business behavior` 0 · `components working together` 0 · `established from business needs` 0 · `a single change adds no case` 0 · `the only acceptance run that starts from a user-visible entry` 0（`node` 读档计数）；全档域可满足——本席预扫 16 档：命中只在改动面四档，其余 12 档五词各 0 |
| A3 | 判据轴四处都在（本批 ②） | `interaction between components` 落地后计数：`thincoder-core/prompts/discipline-engineering.md` 2 ∥ `thincoder-core/prompts/discipline-normal.md` 2 ∥ `thincoder-core/prompts/persona-eng-designer.md` 2 ∥ `thincoder-core/prompts/advisor-design.md` 4（本席按替换模拟计） |
| A4 | 写形零回归 | 四档逐行 ≤300 字符、`>300 = 0`（现盘基线 = max 300 ∥ 296 ∥ 298 ∥ 295）；B2 ∥ B7 各带一行 `Why:` 或两条规则行，`Why` 行去掉行首缩进后以 `Why:` 起头（同 §6.49 A6 口径） |
| A5 | 提示词面零文档引用 | `node scripts/prompt-refs-check.mjs` ⇒ 命中 0 |
| A6 | 行数持平 | 四档行数落地后 = 344 ∥ 314 ∥ 150 ∥ 137（本席实读；逐处 ±0） |
| A7 | 设计面判据轴零改动 | `docs/core/design/TESTING.md` 扫 `business behavior` ∥ `components working together` 各 0；`:104` 的「集成 = 组件组合与交互」在盘（本席实读） |
| A8 | `doc_check`（本批 ⑤） | 本节落笔后实跑 `doc_check(mode:"gate", docs=["docs/core/design/PROMPT-SYSTEM.md"])` ⇒ 首行 `DOC-CHECK GATE: PASS`；实施轮改提示词后父侧复跑同判 |

写入读法 = **一次性落地读数**（`node` 逐档读 + 字串计数），零常驻断言（承需求 F19 与新写散文锚禁令）。

**用例表（正常 / 边界 / 错误）**

| # | 场景 | 输入 / 动作 | 期望 |
|---|---|---|---|
| C1 | 正常 · 组件之间的交互变了 | 改动不动业务行为，但改了 `provider` 与 SSE reader 的配合 | 设计第 9 项点名该交互的用例（新增 ∥ 修订）；收口不得写 `none`（B2 ∥ B6 ∥ B7） |
| C2 | 正常 · 业务可观察结果变了 | 改动既有用例所断言的业务可观察结果，组件之间的交互未变 | 必须修订该用例的断言（第二维触发）；收口不得写 `none`（B2 ∥ B6 ∥ B7） |
| C3 | 边界 · 纯文档 ∥ 提示词批（本批自身） | 零代码档、两维都未触及 | `none` 成立，理由 = 未触及组件之间的交互、且未改既有用例断言的业务可观察结果（B2 的正面形） |
| C4 | 错误 · 任一维变了 + 收口 `none` | 改了组件之间的交互（或既有用例断言的业务可观察结果），收口行报 `none` | 收口不完整（B2 判缺） |
| C5 | 错误 · 设计第 9 项写「无变化」 | 交互已变，设计写「无变化」 | 设计不合格（B9 ∥ B10 判 🔴；评审按 B8 判段缺） |
| C6 | 边界 · 入口写进判据位 | 设计把「从用户可见入口进入」写成集成测试的判据 | 判据 = 组件之间的交互；入口是本项目选择（B3 ∥ B7 ∥ B11 分开承载） |

**集成测试设计（设计档第 9 项）**：本批两维都未触及——组件之间的交互零改（改动面 = 提示词 4 档 + 设计档 1 档，零代码档；`provider` 与 SSE reader 的配合零改），既有集成用例所断言的业务可观察结果零改 ⇒ 无集成场景新增 ∥ 修订，不新增可跑用例。理由 = 两维都未触及（B2 的正面形）。

**受影响文件（现行 = 本席 `node` 实读 2026-10-24；行数口径 = `split(/\r?\n/).length - 1`）**

| 文件 | 现行 | Δ → 改后 |
|---|---|---|
| `thincoder-core/prompts/discipline-engineering.md` | 344 行 / 43,352 字符 / max 300 / >300 = 0 | L1–L4 ±0 行 · 字符 −78 ⇒ 344 行 / 43,274 字符 |
| `thincoder-core/prompts/discipline-normal.md` | 314 行 / 38,866 字符 / max 296 / >300 = 0 | L5–L7 ±0 行 · 字符 −52 ⇒ 314 行 / 38,814 字符 |
| `thincoder-core/prompts/persona-eng-designer.md` | 150 行 / 19,526 字符 / max 298 / >300 = 0 | L8 ±0 行 · 字符 +95 ⇒ 150 行 / 19,621 字符 |
| `thincoder-core/prompts/advisor-design.md` | 137 行 / 15,157 字符 / max 295 / >300 = 0 | L9–L12 ±0 行 · 字符 +228 ⇒ 137 行 / 15,385 字符 |
| `docs/core/design/PROMPT-SYSTEM.md` | 4,034 行 / 340,668 字符（本席实读·含本节） | 本节 = 设计档笔，非验收对象 |
| `docs/core/design/TESTING.md` | 732 行 / 43,668 字符 | ±0（L13：判据轴已在 `:104`，零副本） |

**关键决策**

| # | 决策 | 理由 |
|---|---|---|
| K1 | 判据轴换成定义原词，不新加测试类别 | 用户 19:41 ∥ 19:46：再细化 ∥ 自造名都把事弄串。定义原词（`interaction between components`）就是现有测试层级里缺的那一维，加类别 = 又造一个维度 |
| K2 | `none` 保留、触发两维取或 | 两维都未触及的改动（纯文档 ∥ 提示词 ∥ 纯重构）确实没有用例可改；取消 `none` 会逼出凑数用例（承 §6.47 K2）。只换判据轴会放走「只改业务可观察结果」的批次——既有断言静默失效 |
| K3 | 入口选择保留，标成「this project」 | 入口 = 本项目的选择（N20），不是定义；删掉会让「从哪进入」无处可读，写成定义则把选择冒充定义（用户 19:41「别把话说得这么死」） |
| K4 | `business result` 留在断言的位，不提升成判据——行字段与评审元素同一集（B7 ∥ B8），K4 服从该集 | ②③ 只断言业务可观察结果（需求 F7）是真规则，但它管断言形态，不管「测的是什么」；两者同桌会重演本批的错误。同一集 = 交互 · 断言的业务结果 · 需求回指 · 入口（B7 四件 ↔ B8 四件）；结果在断言位、判据 = 交互 |
| K5 | 冻结区不碰，`#59` 🟡① 只到上抛 | 父侧明令不动 `:193-197`；替换形三面同源（§6.49「一句话三处」）——只改两面即造机制面差异（多实现面纪律：默认消，不默认留） |
| K6 | J12 ∥ J13 判不改 | J12 的入口已单列成句；J13 是放置决策且与 `:186` 同文——单改一面即造两面差异，改动收益为零 |

**先例 ∥ 偏离**：先例 = 本档 §6.47 ∥ §6.48 ∥ §6.49 形制（双面形 §6.44 + 写形 §6.45 + 落点表 + 验收 + 用例表 + 关键决策 + 勘察证据行）。
**对齐** = 同形落笔；双面形逐字照 §6.44；落点给内容锚。

**偏离** = ① 首次以「换判据轴 + 保留业务断言面触发」为落笔动作（前三次 = 加必做项 ∥ 加去处 ∥ 加验收命令禁令）——本批不动规则数量，只换判据轴的读法并补回一维触发；② 首次在受影响文件表里同时报「父侧已知数」与「本席实读」（`thincoder-core/prompts/discipline-normal.md` 462 ⟷ 314，见上抛项 4）；③ 首次出现「父侧清单列了、本席判不改」的项（J12 ∥ J13）——判据写明，不静默跳。

**既有件三问（新增名）**：`none found` —— 本批不新增名：`interaction between components` ∥ `combined` = 定义原词（本节「定义」块逐字），`entry` ∥ `business-observable point` ∥ `unit test file` ∥ `integration case` 均在册（`thincoder-core/prompts/discipline-engineering.md` 现盘）。可复用件 = 各面原句（B1–B12 全部为原位替换，不新开句）。

**勘察证据行（本席实读 · 2026-10-24）**

- `docs/core/requirements/TESTING.md`：`:16-18` IEEE 610.12 逐字定义（本批判据根）· `:12-14` ISTQB 组件测试定义（对照面）· `:73` F1（改动内只跑单元测试，单档 ∥ 相关子集）· `:79` F7（②③ 只断言业务可观察结果）· `:81` F9（收口测试行双半）· `:199` F34（触发 = 两维取或——改动触及**组件之间的交互**或既有用例所断言的**业务可观察结果**；收口「无变化」条件 = 两维都未触及）· `:115` N20（集成集只住三前端）。
- `thincoder-core/prompts/discipline-engineering.md`：344 行 / 43,352 字符 / max 300 / >300 = 0；`:171` `:179-180` `:181` `:182` `:186` `:190` `:192` `:193-197` 逐行实读（本席）。
- `thincoder-core/prompts/discipline-normal.md`：314 行 / 38,866 字符 / max 296 / >300 = 0；`:189` `:191-198` 逐行实读。
- `thincoder-core/prompts/persona-eng-designer.md`：150 行 / 19,526 字符 / max 298 / >300 = 0；`:114-116` `:120-137` 实读；item 9 现为两行（`:136-137`）。
- `thincoder-core/prompts/advisor-design.md`：137 行 / 15,157 字符 / max 295 / >300 = 0；`:52-57` 第 12 条全文实读。
- `docs/core/design/TESTING.md`：732 行 / 43,668 字符；`:104` 术语辨异行（「集成 = 组件组合与交互」）· §4.5（`:182`：②③ 只断言业务可观察结果）——判据轴同向 ⇒ L13 零改。
- `docs/batches/2026-10-24-acceptance-command-discipline.md:153` ∥ `:178`：#59 两条 🟡 逐字与「并入 `#1768`」的决定。
- `docs/batches/2026-10-24-timeout-and-digest.md`：`:37` 验收链路（loadConfig → `effectiveBodyIdleMs` → 八处消费点）· `:158` readSSE 消费点坐标（`provider/core.mjs:256` ∥ `:274` ∥ `:413`）——交互变了、业务不可见的新轴场景。
- 16 档全扫（本席实读 2026-10-24，A2 的域）：`thincoder-core/prompts/*.md` 共 16 档；五个旧词的命中只在改动面四档（工程 3 ∥ 普通 3 ∥ 设计席 0 ∥ 评审 3），其余 12 档各 0 ⇒ A2 的全档域可满足，不需收窄。
- 本档 §6.47（`:3264-3426`）∥ §6.48（`:3428-3549`）∥ §6.49（`:3551-3701`）：形制先例。
- 公共源勘察：`PROJECT-MANIFEST.json` `index.publicRepos` = 空（本席实读）——独立公共源文档仓无、已查无相关；本批不新引外部源（口径 = 需求 §0 已逐字引的定义）。

**UI / 交互决策**：无界面面——本批只改模型可见提示词文本与设计档。

**上抛项（待裁）**

1. 〔父侧 · `#59` 🟡① 的第三面〕替换形 `the criterion is the changed-face unit test file`（`node --test <file>`）在盘三处（`thincoder-core/prompts/persona-eng-designer.md:115` ∥ `thincoder-core/prompts/advisor-design.md:56` ∥ `thincoder-core/prompts/discipline-engineering.md:195`）；第三面落在本批冻结区 `:193-197`。
   **本席未改任何一面**（三面同源，只改两面即造机制面差异）。裁法二选一：① 三面同改 `unit test file` ⇒ `unit test files`（各 +1 字符、±0 行，覆盖 F1 的「相关子集」）；② 本批不收，另起一笔。
2. 〔父侧 · 需求档笔 · **已落 / 关闭**〕`docs/core/requirements/TESTING.md:199` F34 已由父侧另笔落成两维形：`改动触及**组件之间的交互**或**既有用例所断言的业务可观察结果**时必须同步改动集成测试`；`上述两维任一被触及的批，设计缺该段 = 设计不合格`；`收口行「集成场景无变化」只在**两维都未触及**时成立`。
3. 〔父侧 · 冻结区〕若上抛 1 选 ①，`thincoder-core/prompts/discipline-engineering.md:195` 需一并改（+1 字符）；本批按父侧「不动 `:193-197`」未落。
4. 〔父侧 · 已知数对账〕任务书给的行数（345 ∥ 462 ∥ 151 ∥ 138）与本席实读（344 ∥ 314 ∥ 150 ∥ 137）不一致：三档差 1，`thincoder-core/prompts/discipline-normal.md` 差 148。本席按实读落设计；差 1 三档口径不明（疑为末行 ∥ 行数计法），`thincoder-core/prompts/discipline-normal.md` 的 462 无对应读数——建议父侧以实读为准。
5. 〔父侧 · 编号〕本节未加 §7 D-PS 行（编号待父侧收口时定，承 §6.47 ∥ §6.48 ∥ §6.49 同条上抛）。

### 6.51 判据措辞可读性收口：一次性读数改可执行表述 · 评审入口就地一句注解 · 拆双重否定 · 已有名字别换名（common 半句）

**来源**：用户 2026-10-24 22:28「我并不是说要求一定要百分之百的原话，我需要的是意思表达清楚」· 22:30「如果要四档各一处，为什么不放在 common 里？」· 19:46「你别生造词，严肃认真一点，交互/组合和你说的『接缝』差了十万八千里」。台账 `#1772`。判据 = 读者不用猜就能照着做。

目标文本来源：① ③ 沿用既有提交 `124ccfd0` 的那一版（父侧 2026-10-24 裁定：内容未被否 ⇒ 作目标形、本批重走评审）；② 由本节改写（K2——该提交的 `the project's front-end entry` 把放置句的词搬进场景字段位，且与设计席成两个名字）；④ 为本批新增设计。

**判（逐处 · 本席实读 2026-10-24，HEAD = `75c6bb3f` 回退后）**

| # | 坐标 | 现文（摘 · 逐字） | 读不懂在哪 | 处置 |
|---|---|---|---|---|
| J1 | 三档同句（落点 L1 · L4 · L5） | `or a one-off reading when no runnable face exists` | 「一次性读数」没有可照着做的对象：读的人不知道是跑一条命令，还是写一句话 | B1a–B1c |
| J2 | `thincoder-core/prompts/advisor-design.md:52` | `the project's entry` | `entry` 指什么，单看评审档没有出处——四档全扫，无一句讲 `entry` 是什么 | B2 ∥ B5（就地一句注解，名不变） |
| J3 | 同档 `:54` | `A reason that is not "…" does not stand` | 双重否定，读者要转一道才读得对 | B3 |
| J4 | `thincoder-core/prompts/common.md:9` | 只有「内部术语要带一句白话解释」 | 缺另一半：已有名字的概念别换名——自造的比喻就是第二个名字 | B4（两条规矩两行） |

**机制**

1. **一句话，三处同改**：验收的例外形写「改动没有可跑测试时，你实际跑过的那条检查 + 它的结果」——动作与产物都点名，读者不用再猜「读数」是什么。三面各一处（分界见机制 5）。
2. **入口：名不变，就地一句讲清**：`entry` 没有独立的定义句可指——`thincoder-core/prompts/discipline-engineering.md:186` 讲集成套件住哪（放置决策，§6.50 J13 同判），不讲 `entry` 是什么。名字沿用盘上既有名：评审档 `the project's entry`（`:52`）、设计席 `this project's entry`（`:136`）；两处各带同一句注解 `where a user enters the business — a business-observable point`。
   注解用词全取自盘上两句：`user-visible entry`（`thincoder-core/prompts/discipline-engineering.md:181` ∥ `thincoder-core/prompts/discipline-normal.md:193`）与 `business-observable point`（`thincoder-core/prompts/persona-eng-designer.md:136`），不造新词。
3. **正说**：先把唯一成立的理由说出来，再写其余仍判 🔴；`is not … does not stand` 的双重否定拆掉，例外例（50–100 窗口满）照留——它是判据，不是修辞。
4. **common 补另一半，两条规矩两行**：已有名字的概念保持原名，换名让读者手里两个名字指向同一件东西；与「内部术语要带一句白话解释」同处、拆成两行（§6.45 一条规矩一行），不新增条目。
5. **一句话三处 ∥ 半句一处 的分界**：判据面绑在具体角色的决策点上——评审判设计档、设计席写验收、工程纪律管本轮 ⇒ 三面各一处（关键锚点重复，先例 D-PS41：删任一面那句，该面读者即缺句；提示词面禁指针，不能靠另一面）。措辞面受众是全角色、与角色无关 ⇒ 公共层一处。用户 22:30 之问问的是后者；前者三处不是「四档各抄」。

**逐字英文文本（实施席照此落笔 · 唯一权威目标形）**

写形照本档 §6.45：一条规则一行 · 每行 ≤300 字符。B1a–B1c 的折行位置照 `124ccfd0`（长行按标点折），照原样落、不再折。

B1a — `thincoder-core/prompts/advisor-design.md:56` 整行替换为两行：

```text
    **A design's acceptance naming a full-suite run ⇒ 🔴 (the release gate written as a round cost)**: the criterion is the changed-face unit test file or files (`node --test <file> [<file> ...]`), or — when the change has no runnable test — the check you actually ran and its result;

    the integration half is reported in the closeout line, not run here.
```

B1b — `thincoder-core/prompts/discipline-engineering.md:195` 整行替换为两行：

```text
- **An acceptance criterion names the changed-face unit test file or files (`node --test <file> [<file> ...]`), or — when the change has no runnable test — the check you actually ran and its result, never a full-suite run**: the full suite is the parent-side closeout gate —
  the integration half is reported in the closeout line, not run here.
```

B1c — `thincoder-core/prompts/persona-eng-designer.md:115` 整行替换为两行：

```text
   **A full-suite acceptance is not a batch criterion**: it names the parent-side closeout gate — the criterion is the changed-face unit test file or files (`node --test <file> [<file> ...]`), or — when the change has no runnable test — the check you actually ran and its result;

   the integration half is reported in the closeout line, not run here.
```

B2 — `thincoder-core/prompts/advisor-design.md:52` 整行替换为两行：

```text
12. **Integration-test design**: the design document must contain an integration-test design section — the scenarios this change requires,
    the **interaction between components** each evaluates, the business result each asserts, the project's entry (where a user enters the business — a business-observable point), and the business requirement each traces back to.
```

B3 — 同档 `:54` 整行替换为：

```text
    **Only one reason stands: this change touches neither the interaction between components nor a business-observable result an existing case asserts. Anything else — e.g. the 50–100 case window being full — is still 🔴.**
```

B4 — `thincoder-core/prompts/common.md:9` 整行替换为两行：

```text
**Internal terms / codenames / jargon used bare leave the reader unable to repeat, execute, or relay them** — follow each with a one-line plain explanation.
**A concept that already has a name keeps that name** — renaming it leaves the reader holding two names for one thing.
```

B5 — `thincoder-core/prompts/persona-eng-designer.md:136` 整行替换（同一元素同一名 + 同一句注解）：

```text
9. **Integration test design** — the scenarios this change earns, each row naming the **interaction between components** it evaluates, the business-observable result it asserts, the requirement it serves, and this project's entry (where a user enters the business — a business-observable point).
```

**中文复核面（与英文面同一语义 · 供人复核，不入提示词）**

- **B1a–B1c · 验收的例外形**：验收条件写改动面的单测档（`node --test <档>`）；改动没有可跑的测试时，写你实际跑过的那条检查 + 它的结果；从不是全量套件。全量套件是父侧收口门，集成那半写进收口报告行，这里不跑。
- **B2 ∥ B5 · 入口**：名 = 本项目的入口（评审档 `the project's entry`、设计席 `this project's entry`）；注解 = 用户从哪儿进入业务——一个业务可观察点。`:186` 是放置决策，不是入口的定义。
- **B3 · 唯一成立的理由**：只有「这次改动既没触及组件之间的交互、也没改既有用例断言的业务可观察结果」这条理由成立；其余（例如 50–100 窗口满）仍判 🔴。
- **B4 · 两行两规矩**：① 内部术语 ∥ 代号 ∥ 行话裸用要跟一句白话解释（现文）；② 已有名字的概念保持原名——换名让读者手里两个名字指向同一件东西。

**落点表（实施席逐处执行 · 坐标 = 现盘实读 2026-10-24）**

| # | 文件 | 落点（内容锚） | 动作 | 预期 Δ |
|---|---|---|---|---|
| L1 | `thincoder-core/prompts/advisor-design.md` | `A design's acceptance naming a full-suite run` 行（`:56`） | 整行替为 B1a 两行 | +1 行 |
| L2 | 同档 | `12. **Integration-test design**` 行（`:52`） | 整行替为 B2 两行 | +1 行 |
| L3 | 同档 | `**A reason that is not` 行（`:54`） | 整行替换为 B3 | ±0 行 |
| L4 | `thincoder-core/prompts/discipline-engineering.md` | `**An acceptance criterion names the changed-face unit test file` 行（`:195`） | 整行替为 B1b 两行 | +1 行 |
| L5 | `thincoder-core/prompts/persona-eng-designer.md` | `**A full-suite acceptance is not a batch criterion**` 行（`:115`） | 整行替为 B1c 两行 | +1 行 |
| L5b | 同档 | `9. **Integration test design**` 行（`:136`） | 整行替换为 B5 | ±0 行 |
| L6 | `thincoder-core/prompts/common.md` | `:9` 整行 | 整行替为 B4 两行 | +1 行 |
| L7 | 其余提示词档 · 产品代码 · 需求档 · `docs/core/design/TESTING.md` | — | 零改 | ±0 |

实施按**内容锚**定位；行号只作现盘读数。

**取代（本档 §6.1 的批次收尾比对基线以本节为当前形）**

- 本节 B2 取代 §6.50 B8 的目标形与该节 A1 的 `the project's entry` 读数：同一元素、名字不变，B2 补同一句注解 ⇒ A1 的「评审档恰 1」改按两档计（本节 A2）。
- §6.50 J13 的判（`thincoder-core/prompts/discipline-normal.md:197` ∥ `thincoder-core/prompts/discipline-engineering.md:186` = 放置决策、不是定义位）成立，本节不推翻：`entry` 的解释来自 B2 ∥ B5 的就地注解，不来自 `:186`。

**延后项已落（#1772，2026-10-25）**

`#59` 🟡① 的复数化已随 #1772 轮落盘：三面提示词（`advisor-design.md:60` ∥ `discipline-engineering.md:198` ∥ `persona-eng-designer.md:115`）与本节 B1a/B1b/B1c 均改「`file or files (`node --test <file> [<file> ...]`)`」，与需求 F1「单档 ∕ 相关子集」（`docs/core/requirements/TESTING.md:73`）对齐。

**验收（A1–A7 · 逐条回指本批条目 ①–④）**

| # | 验收 | 判法 / 读数 |
|---|---|---|
| A1 | B1 三处落盘逐字（条目 ①） | 三档各含 `or — when the change has no runnable test — the check you actually ran and its result` 恰 1；四档扫 `one-off reading` = 0 |
| A2 | B2 ∥ B3 ∥ B5 落盘（条目 ②③） | 评审档含 `the project's entry (where a user enters the business — a business-observable point)` 恰 1 · `Only one reason stands:` 恰 1 · 扫 `does not stand` = 0 · 扫 `front-end entry` = 0；设计席含 `this project's entry (where a user enters the business — a business-observable point)` 恰 1（两面同一名 + 同一句注解） |
| A3 | B4 落盘、不新增条目（条目 ④） | common 含 `A concept that already has a name keeps that name` 恰 1 · 现文半句仍恰 1；common 行数 429 → 430（拆两行，§6.45） |
| A4 | 写形零回归 | 四档逐行 ≤300、`>300 = 0`（目标形实测 max = 290 ∥ 300 ∥ 298 ∥ 294） |
| A5 | 其余行零动 | `git diff --stat` 只列四档 + 本节；四档行数 = 140 ∥ 346 ∥ 152 ∥ 430；改动行只落在 L1–L6 与 L5b |
| A6 | `doc_check` | 本节落笔后实跑 `doc_check(mode:"gate", docs=["docs/core/design/PROMPT-SYSTEM.md"])` ⇒ 首行 PASS |
| A7 | 设计面主人同步 | 本档 `:345` 含 `已有名字的概念保持原名` 恰 1（人读权威与提示词面同一条规矩） |

写入读法 = 一次性落地读数（`node` 逐档读 + 字串计数 + 行数比较），零常驻断言。

**用例表（正常 / 边界 / 错误）**

| # | 场景 | 输入 / 动作 | 期望 |
|---|---|---|---|
| C1 | 正常 · 无可跑面批写验收 | 设计席给纯文本批写验收 | 写「实际跑过的检查 + 结果」，不写 `one-off reading` 这类无名目（B1a–B1c） |
| C2 | 边界 · 只读评审档 | 读者只打开 `thincoder-core/prompts/advisor-design.md` | 从 B2 那行的注解读出入口 = 用户进入业务的点（业务可观察点），不误读成任选入口，也不去别处找定义 |
| C3 | 错误 · 给已有概念换名 | 把「组件之间的交互」改称一个自造比喻 | 违反 B4（读者手里两个名字指向同一件东西）；写作时改用原名 |
| C4 | 错误 · 同一元素两个名字 | 评审档写 `front-end entry`、设计席写 `this project's entry` | 违反 B4；A2 两面同扫判红——两面必须是同一个名字 + 同一句注解 |

**集成测试设计（设计档第 9 项）**：`none` —— 两维都未触及：组件之间的交互零改（改动面 = 提示词 4 档 + 设计档 1 档，零代码档），既有集成用例所断言的业务可观察结果零改 ⇒ 无场景新增 ∥ 修订，不新增可跑用例。理由 = 两维都未触及（§6.50 B2 的正面形）。

**受影响文件（现行 = 本席 `node` 实读 2026-10-24）**

**行数口径**：文本行数 = `split(/\r?\n/).length`。四档均无末行换行，该读数即真实行数；本档旧各节用 `split(/\r?\n/).length - 1`，在同样的档上少计 1（本节按真值报，A5 读同一口径）。

| 文件 | 现行 | Δ → 改后 |
|---|---|---|
| `thincoder-core/prompts/advisor-design.md` | 138 行 / 15,385 字符 / max 298 / >300 = 0 | L1 +1 · L2 +1 · L3 ±0 ⇒ 140 行 / 15,498 字符 / max 290 |
| `thincoder-core/prompts/discipline-engineering.md` | 345 行 / 43,274 字符 / max 300 / >300 = 0 | L4 +1 ⇒ 346 行 / 43,312 字符 / max 300 |
| `thincoder-core/prompts/persona-eng-designer.md` | 151 行 / 19,621 字符 / max 298 / >300 = 0 | L5 +1 · L5b ±0 ⇒ 152 行 / 19,695 字符 / max 298 |
| `thincoder-core/prompts/common.md` | 429 行 / 51,771 字符 / max 294 / >300 = 0 | L6 +1 ⇒ 430 行 / 51,890 字符 / max 294 |
| `docs/core/design/PROMPT-SYSTEM.md` | 本节 + `:345` 一句 | 设计档面，非验收对象 |

**关键决策**

| # | 决策 | 理由 |
|---|---|---|
| K1 | ① ③ 沿用 `124ccfd0` 的目标文本，② 由本节改写，本席不另造措辞 | 父侧 2026-10-24 裁定：① ③ 内容未被否、只是没走评审 ⇒ 作目标形重走流程；另造措辞 = 给已有说法换第二个名字（B4 自己要禁的动作）。② 的例外见 K2 |
| K2 | 入口名不变（`the project's entry` ∥ `this project's entry`），注解就地写进两面 | `entry` 在提示词面无独立定义句：`:186` 讲套件住哪（§6.50 J13 = 放置决策），拿它当定义位不成立。改成 `front-end entry` 会把放置句的词搬进场景字段位，且与设计席成两个名字（B4 禁的动作）。注解用词取自盘上两句（`:181` `user-visible entry` · `:136` `business-observable point`），不造新词。两面各带一句 = 关键锚点重复（D-PS41）：提示词面禁指针，删一面那句该面即缺句 |
| K3 | 双重否定改正说，例外例照留 | 判据不变，只把读法从「转一道」变成「顺着读」；删例外例会让 50–100 窗口满重新变成可辩的理由 |
| K4 | `thincoder-core/prompts/common.md:9` 拆成两行（同一节内、不新增条目） | 用户 22:30：公共层一处覆盖全角色，不四档各抄——落点不变。写形照 §6.45：一条规矩一行；「解释术语」与「不换名」是两条规矩 ⇒ 两行，不是把两条挤一行再给「一行」立例外 |
| K5 | 判据面三处、措辞面一处，两者不混 | 判据面绑具体角色的决策点（评审判设计档 ∥ 设计席写验收 ∥ 工程纪律管本轮）⇒ 三面各一处；措辞面受众全角色、与角色无关 ⇒ 公共层一处。用户 22:30 之问问的是措辞面那一半 |

**先例 ∥ 偏离**：先例 = 本档 §6.47 ∥ §6.49 ∥ §6.50 形制（双面形 §6.44 + 写形 §6.45 + 落点表 + 验收 + 用例表 + 关键决策 + 勘察证据行）。

**对齐** = 同形落笔，落点给内容锚；取代句照 §6.50 `:3862` 先例。

**偏离** = ① 首次把既有提交的目标文本作设计目标形（内容先用、流程重走）——K1 记明依据；② 同一条改动横跨三档（B1a–B1c 同句），落点表按档拆行、语义只一份；③ 首次在同一元素的两面各写一句同文注解（K2——提示词面禁指针，两面须各自可读）。

**既有件三问（新增名）**：`none found` —— 本批不新增名：`the project's entry` 在册（`thincoder-core/prompts/advisor-design.md:52`）· `this project's entry` 在册（`thincoder-core/prompts/persona-eng-designer.md:136`）· `user-visible entry` 在册（`thincoder-core/prompts/discipline-engineering.md:181`）。

`business-observable point` 在册（`thincoder-core/prompts/persona-eng-designer.md:136`）· `unit test file` 在册 · `Why:` 写形在册（§6.45）；B4 的两行只用 plain words（term ∥ name ∥ reader），不造术语。
`thincoder-core/prompts/discipline-engineering.md:186` 不是定义位（放置决策）。

**勘察证据行（本席实读 · 2026-10-24）**

- `git log --oneline -3`：HEAD = `75c6bb3f 回退 124ccfd0…`；目标文本源 = `124ccfd0`。
- 四档现行（`node` 逐档读 · 真值行数）：138 行 / 15,385 字符 / max 298 · 345 / 43,274 / 300 · 151 / 19,621 / 298 · 429 / 51,771 / 294；四档 `>300 = 0`。
- 目标形实测（`node` 按 B1a–B5 逐档模拟替换）：140 / 15,498 / 290 · 346 / 43,312 / 300 · 152 / 19,695 / 298 · 430 / 51,890 / 294；`>300 = 0`。B2 第二行 228 字符、B3 223 字符、B5 整行 295 字符。
- 入口名的定义面实读（四档全扫）：`front-end entry points` 只在 `thincoder-core/prompts/discipline-engineering.md:186` ∥ `thincoder-core/prompts/discipline-normal.md:197`（放置句）。
  `user-visible entry` 在 `thincoder-core/prompts/discipline-engineering.md:181` ∥ `thincoder-core/prompts/discipline-normal.md:193`；`business-observable point` 只在 `thincoder-core/prompts/persona-eng-designer.md:136`。
  ⇒ 无独立定义句，`entry` 的解释只能就地写。
- `thincoder-core/prompts/common.md:9`：现文 156 字符；B4 第一行 156、第二行 119 字符（拆行 +1 行）。
- 需求面：本批措辞标准 = 用户 2026-10-24 22:28 ∥ 22:30 ∥ 19:46 原话（批档 §1 已定决定 + 台账 `#1772`）；需求档本批冻结（父侧明令）；`docs/core/requirements/TESTING.md` 管测试层级、不管提示词措辞（复扫：无第二处成文）。
- 公共源勘察：`PROJECT-MANIFEST.json` `index.publicRepos` = `[]`（本席实读）——独立公共源文档仓无，已查无相关。

**UI / 交互决策**：无界面面——本批只改模型可见提示词文本与设计档。

**上抛项（待裁）**

1. 〔父侧 · 编号〕本节未加 §7 D-PS 行（编号待父侧收口时定，承 §6.47–§6.50 同条）。
2. 〔父侧 · 冻结区边界对账〕§6.50 K5 曾把 `thincoder-core/prompts/discipline-engineering.md:193-197` 标为冻结区（上一批的边界）；本批任务书明列 `:195` ⇒ B1b 按本批落。两者不冲突，此处记明以免收口对账时被读成越界。

## 7. 关键决策记录

| # | 决策 | 理由 |
|---|---|---|
| D-PS1 | **提示词 = 代码单源**（`thincoder-core/prompts/`）；规则的人读权威 = 中文机制文档；同一规则两处成文 = 缺陷 | 2026-10-18 23:01 裁定（取消中文镜像） |
| D-PS3 | 重复条款处置 = **源侧删除**（非指针） | common 恒第二位注入——指针无导航价值；D2 单一权威源 |
| D-PS4 | byte-identical 取消 → **设计锚机制** | 字节硬一致形成互相依赖（并发处理不利）；各面独立语义锚守（多实现面纪律） |
| D-PS5 | **破坏性命令红线 = `thincoder-core/prompts/common.md` §10 尾部增列**（既有节内；不新增节、不改述既有句） | 落点与「节数不变」已由需求定（`docs/core/requirements/PROMPT-SYSTEM.md` §2.3 行 10 + 增补注②）；红线是既有「有专用工具就不 hand-roll」句（`thincoder-core/prompts/common.md:69`）的同节主题延伸 ⇒ 既有文本零改述 |
| D-PS6 | **提示词面禁带文档引用 = 删引用（非改址）+ 三道机判锁（J1/J2/J3 · §6.6）**；保留面 = 操作数族规范豁免串（`AGENTS.md` · `SKILL.md` · `README.md` · `MANIFEST.md` · `.thincoder/advisor.md` · `project_rules.md`）+ 路径操作数 + 扩展名字面量 + 协议自名；纪律句落 `thincoder-core/prompts/common.md`「文档写作纪律」节 | 用户裁定 |
| D-PS7 | **「不可裁决」自止点 = 落 `thincoder-core/prompts/common.md` 上行通道节（既有节内增列）+ 人格档逐处同点限定（eng-designer 两处 + 同族四档）**；判据 = 发现两处要求互斥 ⇒ 即「不可裁决」⇒ 立即 `ask`（不设重读 / 权衡前置） | 判据本体在公共层 ⇒ 操作化落同节（D2；恒第二位 = 全角色覆盖）；人格档各处 = 本地出口（降级交付 / 歧义进报告 / 计划注明）的边界——就近落各档，**本地只加出口边界句 + 最短动作锚**（承编写纪律 #10「关键锚点重复」） |
| D-PS8 | **漂移防线 = 流程步（批次收尾一次性比对）**——零常驻锁 | 零常驻 = 守当批一致性而不冻结演进 |
| D-PS9 | **台账治理纪律 = 落 `thincoder-core/prompts/persona-engineering.md`「派发与收尾纪律」节内 `欠账入清单` 邻位**（既有节内增列 · 零块计数连带） | 属主 agent 处置纪律（「做还是记」判断）——与同节 *Debts go on the list* / 父侧不代笔并列 |
| D-PS10 | **派单尺寸与任务书形态纪律 = 落 `thincoder-core/prompts/persona-engineering.md`「实施委托结构化（任务书 + spawn 参数）」节内**（六字段列表末行后 · 既有节内增列 ⇒ 零块计数连带）；**EN 按本节设计于实施轮落笔**；**第 5 条（禁令携后果）= 同节既有 why 条行后 1 行（补句——原条不改写）** | 属主 agent 派单行为（一舱一单面 + 预检三闸 + 结构决定归设计 + 任务书形态）——与同节「有规模委派缺这些字段是缺陷」（字段面）并列，本笔补**尺寸面 + 形态面 + 后果面** |
| D-PS11 | **测试层级知识（定义 + 放置）= 落 `thincoder-core/prompts/discipline-engineering.md`「测试纪律」节内两条 bullet 并文**（既有节内增列 ⇒ 零块计数连带）；**定义以机制文档为据、放置两类分述** | 落工程侧纪律节 = 事件面 + 现行节已有部分单元侧表述（最小增改 = 并文）；**「normal 侧另裁」已落——→ D-PS13** |
| D-PS12 | **轻通道机制 = 机制规则落 `thincoder-core/prompts/discipline-engineering.md`「基本流程」节内 + 父侧行使细则落 `thincoder-core/prompts/persona-engineering.md`「派发与收尾纪律」节内**（均既有节内增列）；准入判据 = **三样清单 + 一句边界**；轻通道轮次 = 批档一本（§5 不适用——实施面 = 父侧直改） | 分层：机制面 = 模式怎么干活（纪律层——受众含收尾轮的评审 ∥ 设计面）；父侧动作面 = 写权独属（人格层——台账用法面判例同轴） |
| D-PS13 | **测试层级知识扩落普通侧**（`thincoder-core/prompts/discipline-normal.md`「测试与交付」节内两条 bullet 定点并文——定义 ∥ 放置，与工程侧同源同知识） | 口径收正（用户）：**批次档非工程模式专有 · 文档体系对全模式同一 · 两模式之别 = 是否强流程约束** ⇒ D-PS11 之「normal 侧另裁」落地；放置语义照全模式同一的文档体系书写。**流程约束面零搬迁** |
| D-PS14 | **面向用户表述纪律（说人话）= 落 `thincoder-core/prompts/common.md`「语言纪律」节内增列**（既有节内增列 ⇒ 零 `##` 块计数连带） | 受众 = 全角色（两模式 + 全部子代理——子代理面 = 面向父代理）⇒ 公共层 `thincoder-core/prompts/common.md` 恒第二位 = 唯一全覆盖范围；表述面（怎么说）与语言纪律（用哪种语言 + 术语原文）同节同轴 |
| D-PS15 | **「轮次界 = 收口」入文 = 需求 §2.3 +1 条 ∥ `thincoder-core/prompts/persona-engineering.md`「派发与收尾纪律」节内 +1 行**（既有节内增列；设计句零改——规则已在机制设计档） | 续笔归属需明文（跨会话续笔缺依据）；落点 = 需求 F-LC3 邻位 ∥ 提示词 P2 块邻位 |
| D-PS16 | **文档更新纪律清单位同步 = 同步**（`thincoder-core/prompts/discipline-engineering.md` 两档清单列 **D1–D9**——表头 ∥ 计数句 ∥ 清单行） | 清单位 = 运行期可读的 D 族全表（设计族 = D1–D9——跨档同数为簿记面所需）；D8 ∥ D9 语义已住公共层（全模式覆盖不损；清单行 = 同族行式，非详述） |
| D-PS17 | **多仓操作机制落三处**：公共层「批次档常识」§14 末（多仓按仓各自——跨仓建档被拒 = 正确 ∥ 各仓分别建档开批）+ 工程纪律层「文档与台账自持」节（6 项续入）+ 人格层「项目状态档」节（操作他仓前先建档） | 三项各归其位（常识 / 操作规则 / 写权动作）；零 `##` 增为硬口径 ⇒ 不新建节 |
| D-PS18 | **「文档与台账自持」节既有项微调 = item 5 删并**（与 item 1 同规则重复 + 修订式残句；唯一事实「schema 校验」并入 item 1；序号顺缩） | D8 失效表达必删 + 重复即缺陷；残留即示范（存量不是合法态）；语义零变（逐字对照 = 设计围栏块） |
| D-PS19 | **旧「跨仓批派单」提示词落笔面收口**：语义以多仓泛化形随册落笔；「反查脚本一条」落笔未做（在册）——`DOC-DISCIPLINE.md` §4.4 随正 | 两仓时代设计句与现况对账（提示词面「跨仓」零命中实证）；「脚本名不写进提示词」口径维持 |
| D-PS20 | **读侧对句与界句 = 落两模式纪律层各自自持节内**（工程：item 14 新增 + item 12 句尾并入；普通：item 3 新增）——既有节内增列 ⇒ 零 `##` 连带 | 受众 = 两模式主会话 + 各自子代理；自持家族既有落点 = 两纪律层（#827 实证）；读侧句与自持条同节相邻 = 反向拉的当场对句 |
| D-PS21 | **记录面声明源例外 = 自持节 item 1 续句**（声明公共仓可引——仓名前缀形可核；其余仓外指针照禁） | 台账 / 批档指针禁的读侧松绑：已声明源 = 可核坐标（`DOC-DISCIPLINE.md` §4.2.2 解析序 + `LEDGER-SELF-CONTAINED.md` §4.1 有界例外）；「登记 / 归属」面零松（#827 一档一仓不动） |
| D-PS22 | **三层结构常识 = 公共层档末新增第 15 节**（`thincoder-core/prompts/common.md`「工作结构常识（板 → 域 → 档）」——why + 判域口径 + 四条规矩） | 受众 = 两模式 + 全部子代理（用户「这是常识，每个模式和角色都该知道」）⇒ 公共层恒第二位 = 唯一全覆盖范围；与 §13/§14 同形（档末追加——D3 计数随动） |
| D-PS23 | **同族条收窄 = 去重保留**（删 2：划界原则 ∥ 并行写者错开；保留 3 细则：热点面最小化 ∥ 分不开时 ∥ 改组已有内容时（在盘形）；判域口径随升层；标题括注「创建即留并行面」⇒「细则」） | 去重 = 公共层已承载者删（判域口径与划界原则升层）；保特有点 = 公共层未承载的三条操作细则（私删＝静默缩水）；旧条实质 = 升层 + 收窄 + 去重 |
| D-PS24 | **多过一道用户的眼（用户视角门）= 两模式纪律档各新增节**（`thincoder-core/prompts/discipline-engineering.md` ∥ `thincoder-core/prompts/discipline-normal.md`——`## 交付报告` 节前；两档措辞按语境差异化：设计轮/收口轮 ∥ 设计时/收尾前；清单细目不上提示词） | 条款 = 用户批准稿——自带设计/收口两轮结构，单一既有节无跨轮承载位（工程档无 UI 节；普通档 UI 节挂「写码前」相位、收口半与「收尾前」节相隔 ⇒ 拆落即散）；受众 = 两模式主会话 + 各自子代理 ⇒ 纪律层。先例 = §6.16 ∥ §6.17-③（新增节登记在案） |
| D-PS25 | **台账关联条目合并扫描 = 落 `thincoder-core/prompts/persona-engineering.md`「台账」节「批设计」条原位扩展**（现文逐字保留 + 前插扫描步；不并理由记入轮次记录） | 扫描产出 = 入批条目集 ⇒ 贴「一次落多个需求点」的消费点（判断链不断——同 D-PS9 判据形）；生命周期表受需求档 FR30 验收「五行」锁定（`docs/core/requirements/ENGINEERING-MODE-V2.md:696`——塞第 6 行即破计数）⇒ 不入事件表；时机以文本自带（「批点火前」）；最小改动（±0 行 / 零计数连带——`##` 块计数随正） |
| D-PS26 | **台账治理纪律增补五条 = 落 `thincoder-core/prompts/persona-engineering.md` 两节内**（「派发与收尾纪律」：`欠账入清单` 原位扩展 ∥ `暂缓批先复核` 条尾追加 ∥ 开局自查新 bullet；「台账」节：入库查重 ∥ 单行单结新 bullet + 生命周期 ③ 条尾追加）——零 `##` 块计数连带；不新造机制 | 五条均主 agent 行为纪律（欠账 / 自查 / 登记 / 结算 / 收口 = 写权独属动作面）⇒ 人格层（同 §6.8 / §6.19 / FR30 判例）；「生命周期」表受 FR30 五行锁定 ⇒ 不增行只扩条文；需求档攒批五条计数零变 |
| D-PS27 | **「段」口径定形 = 标题段**（标题节点〔层级 2+，含行内〕及其领起内容——逐段对位；复算 = **17/17 全配对**、零孤段） | 「段」原口径无在案记录；复算前置 = 定口径——取「段配对」与标题树同粒度（段 = 标题段）使读数可复算、可机判 |
| D-PS28 | **同族句换写 = EN 两处**（`:38` ∥ `:51`；弃 1:1 基数、保内核、补关系句——「文档归板块（板内分域分档、可多档）」） | 三层模型（板 → 域 → 档）收口后「一板块一档」/`design/<板块>.md` 的 1:1 基数与之相抵；修 = EN 两处同改 |
| D-PS29 | **普通模式管理教学 = 普通侧三档**（`thincoder-core/prompts/discipline-normal.md` 新增节「工作管理（批次档 + 台账 + 收口）」〔台账用法 ∥ 批次档用法 ∥ 收口纪律〕∥ `thincoder-core/prompts/persona-normal.md` 设计师席句〔节内〕∥ `thincoder-core/prompts/common.md` 六段作者行模式分辨〔节内换写〕） | 需求 F-N2.1 判据句钉纪律层用法节；三块跨相位（建档 / 落地 / 收口）无单一既有节承载位 ⇒ 新增节（先例 §6.18）；主 agent 独属动作以主 agent 视角直书纪律节（普通侧人格档薄——单点承载；先例 = 既有 task / 持久清单句在纪律层）；公共层句 = 全角色两模式共读面（按角色写死即误导）；**单套逻辑** = 文本结构照工程同构、按普通模式单位改写（N-N2.1） |
| D-PS30 | **「产品常识（配置项必须有配置界面）」= 公共层档末新增第 16 节**（`thincoder-core/prompts/common.md`「产品常识（Product common sense）」——配置项必须有配置界面 ∥ 例外须显式说明经用户裁 ∥ 界面提示文案不得指向界面里不存在的入口） | 受众 = 两模式 + 全部子代理（用户「这是常识，不仅仅针对工程模式」）⇒ 公共层恒第二位 = 唯一全覆盖范围；与 §13–§15 同形（档末追加——D3 计数随动）；形态沿 D-PS22 先例（**移档末**——段中插入 ⇒ 档末，§N 零漂移） |
| D-PS31 | **清账轮三条 = 落 `thincoder-core/prompts/persona-engineering.md` 两节内**（「派发与收尾纪律」：锚点复核新 bullet ∥ 「台账」节：族行 ∥ evidence 指针化上限新 bullet ×2）——**EN 按本节设计于实施轮落笔**；既有节内增列 ⇒ 零 `##` 块计数连带；不新造机制（工具面零改） | 三条均主 agent 行为纪律（池面锚维护 ∥ 行组织 ∥ 行形态 = 台账写权与行使面）⇒ 人格层（同 §6.8 / §6.20 / FR30 判例）；生命周期表受 FR30 五行锁定 ⇒ 三条不入事件表（锚点复核 trigger = 清账轮；族行 / 上限 = 行面形态） |
| D-PS32 | **evidence 指针化上限定形 = 软上限 ≈ 300 字 + 例外形**（细节尚无落点——未建档 ∥ 待裁 ∥ 所指档不可达 ⇒ 允许内嵌摘要；落点一出现即收窄） | 判由：① 300 = 本仓「一行」的既有量级（行宽闸值同数——「台账 = 一眼能扫的账」以「一行」为直觉单位）；② 拦的就是千字级细节堆存——软上限取其约三分之一量级，良形行（症状 + 坐标 + 指针）留足空间；③ 软性 = 无机械闸（台账住用户数据区、非文档机检面）——执行 = 写形纪律（登记时）+ 清账轮收窄信号（超限行 = 收窄小件） |
| D-PS33 | **族行与「单行 = 单结算单元」= 同轴互补**（拆 = 不相干项不绑；并 = 同一工作对象不分家）；族行成立条件 = **成员同批同轮收口**；族行 ≠ 主题伞（主题同、收口不同轮 = 注记关系不并）；不设成员数硬上限（成员清单 = 标题面，过长即信号——另裁或收窄） | 两条易被读成互斥（一拆一并）——同轴句显式化防误读；「同一工作对象」承「入库查重」既有定形；闭合条件 = 可判（同批收口 = 核销时点同拍）；近例 = 越线拆案族五行归一行 |
| D-PS34 | **注入开关键面 = `agent.injectDocs` ∥ `agent.injectMemories`**（平表、动词式；默认 `true` 显式声明于 DEFAULTS；判据 `!== false`）——**扩为三键**（+`agent.injectProjectRules`——见 D-PS38） | 平表开关族先例（`verifyGuard` ∥ `timerWake` ∥ `autoThink`）；DEFAULTS 声明 = 缺省零变 + settings 类型护栏 / list 面自动派生（加键流程 = DEFAULTS 一处——`SETTINGS-TOOL.md` §2.6） |
| D-PS35 | **阻断点 = `setup.mjs` 调用侧三判（`loadProjectInstructions` helper 签名零改）；关 = 检索调用不执行（不止吞注入）；热应用 = 逐 run 现读既有 `agent.config`（零新机制）**——**① 判点改读 `agent.injectProjectRules`**（§6.27——条件形零变、只换判变量；判点现盘 `:281`） | helper = 公开导出面 ⇒ 调用侧判点最小爆炸半径；关 = 零无谓 embedding / DB 开销；逐 run 现读 ⇒ `settings` 工具写入即热、端壳 UI 腿 = 各端既有刷新语义（生效时点见本节「先例 ∥ 偏离」块） |
| D-PS36 | **安全纪律（五条携 why）= 落 `thincoder-core/prompts/common.md` 档末新增第 17 节**（两模式同文——受众 = 两模式 + 全部子代理；条文 + why + 实例逐条入） | 受众面 = 全角色两模式（恒第二位 = 唯一全覆盖范围——同 D-PS5 论证）；内容 = 跨模式常驻判断（无模式过程挂钩 ⇒ 落两模式纪律档 = 同文双份、零差异收益——D-PS24 ∥ D-PS13 各有阶段 / 节锚，本例零锚）；先例 = D-PS22 ∥ D-PS30（公共层档末新增节 · §15 ∥ §16） |
| D-PS37 | **跨仓勘察义务三句 = 四处落点 × 一份**（义务〔工程纪律层设计步——先例 = 同类先例勘察同节〕∥ 形态〔设计席人格 8 项 item 1——就地扩，8 计数不变〕∥ 派单〔主 agent 人格层「派发与收尾纪律」轮次字段后——独立行，不落六字段表〕∥ 核查〔设计评审标准第 10 条〕）；**EN 按本节设计于实施轮落笔** | 受众各归其位：行为面须主 agent 可见（核验 / 派单——先例 = 前批同判据）⇒ 纪律层；形态 = 设计席自身交付物 ⇒ 其人格档；派单写权独属 ⇒ 人格层（子代理非受众）；核查 = 评审自含档；**②不落六字段表** = 机械面牵动避让（`validateTaskBookFields` 六字段判据集 ∥ tool-docs 骨架 ∥ 测试 T6——他域零动）；③ = 新第 10 条（独立断言面独立可核问——承第 9 条先例） |
| D-PS38 | **职责关系 = (乙) 完全正交**：`agent.injectProjectRules`（新）管 ① 项目指令块 ∥ `agent.injectDocs`（**职责收窄**——改既有键已落语义）只管 ② 相关文档块；两键互不影响（关任一方另一方照常）；① 判点落 `setup.mjs` 调用侧同址、只换判变量（现盘 `:281`） | **用户拍板**（需求 §2.6 已定行）——**已知代价：改 `injectDocs` 已落行为**（拆键前它管 ①②；老用户显式 `injectDocs:false` 且未设新键 ⇒ ① 重新注入）。用户选乙后已知情接受语义变更 |
| D-PS39 | **联网查证指导 = 落 `thincoder-core/prompts/common.md`「工具观」节内新增 `###` 子节**（`### 何时必须联网查证`——三件〔情形 / 算够 / 查不到〕+ 边界）；**EN 按本节设计于实施轮落笔**；零 `##` 块计数连带（标题节点 22 ⇒ 23） | 受众 = 全角色（两模式 + 全部子代理）⇒ 公共层恒第二位 = 唯一全覆盖；工具观族 = 操作形聚集地（同族相邻 ⇒ 就近落）；`###` = 零 `##` 块计数连带（D3 不被牵动）；被否 = 新增 `##` 节（块计数连带 + 公共层节表受需求档锁定） |
| D-PS40 | **上下文自掌舵 = 落 `thincoder-core/prompts/common.md`「工具观」节内新增 `###` 子节**（`### 上下文自掌舵`——查（含距压缩线）∥ 自压携 focus · 可取回 ∥ 到压缩线自动压缩 = 兜底非收工令）；**EN 按本节设计于实施轮落笔**；零 `##` 块计数连带（标题节点 23 ⇒ 24） | 用户 2026-10-16 23:57 逐字批准；受众 = 两模式主会话主面 + 全角色（③）⇒ 公共层恒第二位；`###` = 零 `##` 连带（同 D-PS39）；被否 = 新增 `##` 节（块计数连带 + 需求档节表锁定）∥ 两模式纪律档分落（跨模式同文 = 双份零收益——D-PS36 判据）∥ 人格层（内容非身份 / 边界） |
| D-PS41 | **异步并发认知与 `wait_for` 判断 = 三档四处既有节内增列 / 就地改写**（① `thincoder-core/prompts/common.md`「并行调用原则」+2 行〔引擎全异步高并发 + 派出后两种走法〕∥ ② `thincoder-core/prompts/common.md`「工具路由」+2 行〔`wait_for` 等无送达通道的状态；等报告 = 阻塞且只拿到 settle 信号〕∥ ③ `thincoder-core/prompts/discipline-engineering.md` `:206` 整行扩写〔并发是常态；攥着逐枚等 = 把并行排成串行〕∥ ④ `thincoder-core/prompts/persona-engineering.md`「并行委派与多任务」+1 bullet〔父侧等待姿势〕）；**零 `##` 块计数连带 ∥ 零标题节点连带**；**EN 按本节设计于实施轮落笔** | 受众分层：① ② 公共层（恒第二位 = 两模式 + 全部子代理共读）∥ ③ 工程纪律层（该模式怎么干活）∥ ④ 父侧写权独属行为；**同一事实三层各点一次 = 关键锚点重复**（先例 = D-PS7「本地只加出口边界句 + 最短动作锚」——各层须能独立阅读：删任一层的句子，该层读者即缺句）；被否 = 只落公共层（层内自足性丢失）∥ 新增 `##` 节（块计数连带 + 公共层节表受需求档锁定） |
| D-PS42 | **禁类写法改因面三条**：① **不硬编因果**——「可改因」的唯一依据 = 原句（或同段邻句）已带原因（准入①），其次才是机制档有可核坐标（准入②，须给坐标；给不出不得走②）；两道都不成立 ⇒ 归「约定」或「需裁」，不补理由。② **标题命名轴 = 该块赖以成立的机制或裁决**，不按服从强度命名。③ **体量只作读数、不设帽**（2026-10-21 用户裁：提示词无预算；§6.11 的 ≤8,000 帽属工具描述面） | ① 用户 2026-10-17 23:46 令 + 「给约定编一个原因比禁令更坏」（假理由会被拿去推断没见过的场合）；② §6.32「标题命名轴」一句可判；③ 提示词逐请求注入 ⇒ 字节即成本，相对帽随档体量自适（本批基线 262,499 字符，上限 +7,875）；被否 = 绝对帽（各档体量差 30 倍，同一帽会同时过松与过紧） |
| D-PS43 | **文档检索路由（FR41）= `thincoder-core/prompts/common.md`「工具纪律」节内新增 `###` 子节**（`### Document search — finding a document vs locating a line`——发现式 ⇒ `doc_search` 首查 ∥ 定位式 ⇒ `grep` 照用；**why 主轴 = 声明域（多仓）vs 一个路径（默认本仓）⇒ 跨仓结构性失明**，过程档在域外 = 次因〔用户 2026-10-22 10:06 裁「问题不是扫全树，是会忽略跨仓文本」〕；两处落笔字面：`doc_search: none found` ∥ `cross-repo: not indexed`）；**EN 按 §6.43 于实施轮落笔**；零 `##` 节计数连带（20 ⇒ 20）；标题节点 25 ⇒ 26 | 受众 = 两模式 + 全子代理 ⇒ 公共层恒第二位（同 D-PS36）；`###` = 零 `##` 连带（同 D-PS39 ∥ D-PS40）；同节已装联网面两张搜索选择子节、文档面缺位（§6.43 落点判断表）；被否 = 改 `### Codebase exploration order` 正文（毁 2 行记忆锚）∥ 工具路由表加注（单元格装不下 why） |
| D-PS44 | **推断不许当事实（FR43）= `thincoder-core/prompts/common.md`「证据纪律」段内追加三段**（`## Evidence discipline` · `:48` 后）+ **提问面 `:19` 原位替换一行**（`## Check the docs before you ask` 的 checked-evidence 句：key text 定形为「本轮逐字一行」，查无点名查面）+ **`thincoder-core/prompts/advisor-round1.md` 新增 R9**（R8 后 · `Source:` 前）；三条 = 依据的可判界（本轮 · 整行 · 抄得一致）∥ 派生物（摘要 / 子代理回报 / 长期记忆）只作线索 ∥ 决定面携依据（五处）；**「非决定面可以不标」按「本条只伸五面」落，不落成放宽总则**；**EN 按 §6.44 于实施轮落笔**；零 `##` 节连带（20 ⇒ 20）· `thincoder-core/prompts/common.md` +6 行 · 该档 `:19` ±0 行（+238 字符）· `thincoder-core/prompts/advisor-round1.md` +1 行 | 受众 = 两模式 + 全子代理 ⇒ 公共层恒第二位（同 D-PS36 / D-PS43）；机制已在 `thincoder-core/prompts/common.md:44-46`，缺的是可判的界 ⇒ 同节追加、不新建节（同 D-PS5 判例）；R9 落评审自含档（判据须评审读得到）；被否 = 新 `##` 节（块计数连带 + 需求档节表锁定）∥ 三条各写一条禁令（禁令不给新场合的判断力——D-PS42）∥ 把「非决定面可以不标」落成总则放宽（静默取消 `unverified`） |
| D-PS45 | **提示词面一条规则一行（FR46）= 16 档重写，两舱推进**（甲舱 9 档 = 7 档 persona-* + 2 档 discipline-*，先行；乙舱 7 档 = `thincoder-core/prompts/common.md` + 4 档 advisor-* + `thincoder-core/prompts/consult-base.md` + `thincoder-core/prompts/subagent-base.md`）；写形 = 一条规则一行、行首短语点题、条件与例外独立成行、理由以 Why 起头；样板 = `thincoder-core/prompts/persona-engineering.md:104` 改写为六行（实测最长 288 ≤ 300）；**EN 按 §6.45 于实施轮落笔**；连带收正本档三族六处（设计席修正轮的设计档笔，见 §6.45 连带项 C 表） | 用户 12:28「MoE 模型看 3000 多字能看明白啥」+ 12:31「改法对，就照这个来」；模型读原始文本、一行 = 一个块 ⇒ 折行只改源码排版、切段文字未变，只有重写能改块（FR45 段 / 行两面分判）；两舱 = 两批、舱内分波（样板档单波先行 · 每席一到两档）、甲舱每轮都读价最高先行；被否 = 折行 ∥ 切段 ∥ 引擎改造并入本批（属 FR45 批） |

## 8. 提示词承载（单源 · M9 落点）

**定位**：提示词 = **产品代码**，唯一副本 = `thincoder-core/prompts/`（16 档，运行期直接加载）。规则的**人读权威** = 中文机制文档（`docs/core/design/` 纪律族）。变更路子 = 改规则 → 先改机制文档 → coder 依它改 EN（走产品代码面：需求 → 设计 → 评审 → coder）。**无机检门**（用户裁定不变）。

**兑底核对清单四项 = `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-PROMPT-PIPELINE.md` ②4**（**D2 单一权威源——不重述**）。

### 8.1 提示词面无模板 / 落地二元

提示词只有一个运行期面 `thincoder-core/prompts/`——加载面 = `thincoder-core/prompt-files.mjs:29-30` `PROMPTS_DIR = join(ROOT, "prompts")`（包内固定、不读 manifest）。
`docRoot.design` + `/prompts` 不参与取值：该目录不存在是终态，不是配置缺口，不做 fail-loud。

manifest 顶层键 `promptsLanding` 保留，语义 = 「提示词唯一副本路径声明」——本仓 `PROJECT-MANIFEST.json:25` 无改动；删该键 = schema 面改动（`MANIFEST.md` 八键 · 需求规格），不属本批。

**功能点**：

| # | 功能点 | 方案 |
|---|---|---|
| F2 | 更新流程约束 | 改规则 → 先改机制文档 → coder 依它改 EN（产品代码面） |
| F4 | 清理「方案选型对比」残留 | **现况 = 三处对象均已零点清**（对象已不存在，无须清理动作）：① `thincoder-core/prompts/discipline-engineering.md`「方案选型对比」节——无（grep 零命中）② A3⑤「方案对比已做」——同 ③ `thincoder-core/prompts/persona-eng-designer.md` 8 项 item 1——现为「决定 + 理由，不再要求候选枚举」**正面陈述**（非要求）。判据域见 §8.5 表下注 |

### 8.5 验收（回指 AC-M9）

| # | 判据 |
|---|---|
| AC-M9-3 | 清理对象清零——判据域见下注。现况 = 零命中 ⇒ ✅ |

**AC-M9-3 判据域注**：

- **域** = 提示词档 16 档（`thincoder-core/prompts/`）。
- **模式** = `方案选型对比|候选 ?≥ ?2|对比表|单方案豁免|方案对比已做|comparison table|single-candidate exemption`。
- **排除** = 设计档 / 批次档 / 需求档（纪律本体与历史记录，**非**清理对象）。

**边界（本节不做）**：不做提示词落笔（内容依据 = 机制文档，落笔 = eng-coder）；不手改落地档；不新增机检门。

## 9. 反向引用（v2 行为面载体）

（见 §8 提示词承载——v2 行为面由该节 + 收口核对承载。）

- 本档 = 工程模式 v2 的**行为面载体**：不可机判的纪律（语义写权、角色职责、勘察边界、互锁）落提示词模板；可机判的搬结构（M1–M8 代码 + manifest 声明面）——分流权威表见 `ENGINEERING-MODE-V2.md` §2.3 E4.1。
- 变更同步：v2 对提示词内容的任何裁定，先落本档对应节（persona / discipline / common 的设计面），再由 coder 改 EN（M9 单源落地）。
