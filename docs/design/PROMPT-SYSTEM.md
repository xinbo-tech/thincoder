# 提示词系统（PROMPT-SYSTEM）· 核心统一子系统档

> 板块归属 = **核心统一**（phase 2——「一个核 + 两个薄壳」）；本档 = 该板块的**子系统设计档**。
> 工作流档 = `docs/design/CORE-UNIFICATION.md`（事实基线 / 核形态与消费契约 / 方案选型 / S0 方法 / 分段执行 S0a–S3 / 关键决策 / 受影响文件总表 / 验收回指 / 裁定 A1–A8 / 契约兼容策略 / 测试用例）——**本档不复制**。
> 需求层 = `docs/requirements/CORE-UNIFICATION.md`（F1–F13 / N1–N8）。
> 建档：2026-09-13（**文档拆分轮**——自 `CORE-UNIFICATION.md` §2.5 / §2.5.1 / §2.12.2 **逐节搬入，只搬不改语义**；行号沿用原裁定表编号）。
> **列定义**（裁决行各列含义）→ `CORE-UNIFICATION.md` §2.5；**须裁条目的分组口径与四要素提交形式** → 该档 §2.5.1。

## 1. 归属与范围（自本档行内容的路径归纳）

| 面 | CLI 档 | VSC 档 |
|---|---|---|
| 槽位提示词（运行期加载） | `thincoder/src/prompts/*.md`（15 档） | 同名 |
| 工具描述（运行期加载） | `thincoder/src/tools/*.md`（25 档） | 同名 |
| 中文权威镜像（非运行期） | `thincoder/docs/design/prompts/*.md`（15 档） | `thincoder-vscode/docs/design/prompts/*.md`（15 档） |
| 槽位加载面 | `src/prompt-overlays.mjs` | 同名（同路径对） |

**核内落点**：`core/prompts/`（15 档槽位）+ `core/tool-docs/`（25 档工具描述）+ 单一解析面 `prompt-files.mjs`（落 `core/`）——**核内唯一副本**（用户裁定 A7）。

> 工具**实现面**（`src/tools/*.mjs`）的行本体住 `docs/design/TOOLS.md`；本档收**文本面**（槽位 / 描述 / 镜像）。

## 2. 核模块裁决行（自 `CORE-UNIFICATION.md` §2.5 搬入 · 逐字）

### 2.1 槽位提示词（原 §2.5（一）逐字节同组——组陈述（逐字））

> 逐字节相同 ⇒ 无分叉面——前提校验不适用、不命中 A11（须用户裁 = —）；每行归属与四列逐行登记（列值 = 本组陈述）。

| # | 相对路径 / 对位 | 面 | 相似度 · 逐字节 | 分类 | 目标 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|---|---|---|
| 2 | `prompts/advisor-round1.md` | 同路径 | 1.0000 · 同 | ① | 进核（`core/prompts/advisor-round1.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 3 | `prompts/common.md` | 同路径 | 1.0000 · 同 | ① | 进核（`core/prompts/common.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 4 | `prompts/consult-base.md` | 同路径 | 1.0000 · 同 | ① | 进核（`core/prompts/consult-base.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 5 | `prompts/persona-coder.md` | 同路径 | 1.0000 · 同 | ① | 进核（`core/prompts/persona-coder.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 6 | `prompts/persona-eng-designer.md` | 同路径 | 1.0000 · 同 | ① | 进核（`core/prompts/persona-eng-designer.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 7 | `prompts/persona-explore.md` | 同路径 | 1.0000 · 同 | ① | 进核（`core/prompts/persona-explore.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 8 | `prompts/persona-normal.md` | 同路径 | 1.0000 · 同 | ① | 进核（`core/prompts/persona-normal.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 9 | `prompts/persona-plan.md` | 同路径 | 1.0000 · 同 | ① | 进核（`core/prompts/persona-plan.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |

### 2.2 中文权威镜像（原 §2.5（一）逐字节同组——组陈述同 2.1）

| # | 相对路径 / 对位 | 面 | 相似度 · 逐字节 | 分类 | 目标 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|---|---|---|
| 30 | `docs/design/prompts/advisor-round1.md` | 镜像 | 1.0000 · 同 | ① | 文本面（CN 镜像） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 31 | `docs/design/prompts/advisor-round2.md` | 镜像 | 1.0000 · 同 | ① | 文本面（CN 镜像） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 32 | `docs/design/prompts/advisor-round3.md` | 镜像 | 1.0000 · 同 | ① | 文本面（CN 镜像） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 33 | `docs/design/prompts/common.md` | 镜像 | 1.0000 · 同 | ① | 文本面（CN 镜像） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 34 | `docs/design/prompts/consult-base.md` | 镜像 | 1.0000 · 同 | ① | 文本面（CN 镜像） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 35 | `docs/design/prompts/persona-coder.md` | 镜像 | 1.0000 · 同 | ① | 文本面（CN 镜像） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 36 | `docs/design/prompts/persona-eng-designer.md` | 镜像 | 1.0000 · 同 | ① | 文本面（CN 镜像） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 37 | `docs/design/prompts/persona-explore.md` | 镜像 | 1.0000 · 同 | ① | 文本面（CN 镜像） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 38 | `docs/design/prompts/persona-normal.md` | 镜像 | 1.0000 · 同 | ① | 文本面（CN 镜像） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 39 | `docs/design/prompts/persona-plan.md` | 镜像 | 1.0000 · 同 | ① | 文本面（CN 镜像） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |

### 2.3 非逐字节同组（原 §2.5（二）行集）

| # | 相对路径 / 对位 | 面 | 相似度 · 逐字节 | 分类 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|---|---|
| 43 | `prompt-overlays.mjs` | 同路径 | 0.9853 · 异 | ① | 取 CLI 侧（去镜像注记） | 分叉 = VSC 单行镜像注记；无失效前提（① 直取） | — | S0a（首批建核） |
| 44 | `prompts/advisor-design.md` | 同路径 | 0.9487 · 异 | ② | 融合（措辞归一——建议取 CLI） | 分叉 = 独立演进的措辞收窄；评审面跨档前提仍成立（② 融合） | **①** | S0a（首批建核） |
| 45 | `prompts/advisor-round2.md` | 同路径 | 0.9318 · 异 | ② | 取一侧版式（建议 CLI 两行式） | 分叉 = 行断版式；文本逐字相同——无失效前提（②） | — | S0a（首批建核） |
| 46 | `prompts/advisor-round3.md` | 同路径 | 0.9250 · 异 | ② | 取一侧版式（建议 CLI 两行式） | 分叉 = 行断版式；文本逐字相同——无失效前提（②） | — | S0a（首批建核） |
| 47 | `prompts/persona-engineering.md` | 同路径 | 0.9184 · 异 | ② | 融合（标题并集 + 指针参数化） | 分叉 = 两端各自维护 + VSC 侧指针适配；两端共用同一角色面前提仍成立（②） | **①** | S0a（首批建核） |
| 50 | `docs/design/prompts/advisor-design.md` | 镜像 | 0.9667 · 异 | ② | 融合（指针参数化） | 分叉 = VSC 侧补本地文档地图指针；文本内核一致——无失效前提（②） | — | S0a（首批建核） |
| 51 | `docs/design/prompts/discipline-normal.md` | 镜像 | 0.9143 · 异 | ② | 融合（版式取一侧 + 指针参数化） | 分叉 = 指针 / 版式 / 端内节号映射适配差异；文本内核一致——无失效前提（②） | — | S0a（首批建核） |

**四要素明细（原 §2.5（二）明细块 · 逐字）**

- **#43 `prompt-overlays.mjs`**（同路径 · j 0.9853 · sha `5ff987804ff9` / `fe9c32f47f1c` · 82 / 83 行）
  - 左端读数（CLI）：无独有行——除右端注记外两侧逐字相同。
  - 右端读数（VSC）：独有 1 行头注 `* VSC mirror of thincoder/src/prompt-overlays.mjs (多实现面纪律——语义同源、原文自持).`
  - 建议归一形态：取 CLI 侧（镜像注记随归一失去对象——核内为唯一源）。
  - 影响面：无（仅头注；须用户裁 = —）。
- **#44 `prompts/advisor-design.md`**（同路径 · j 0.9487 · sha `f8804b1138f5` / `b46a6d77bd73` · 41 / 41 行）
  - 左端读数（CLI）：判据 7 措辞 = "the document that already owns its topic"。
  - 右端读数（VSC）：判据 7 措辞 = "the design document that already owns its topic"（收窄）；其余逐字相同。
  - 建议归一形态（只建议）：融合——建议取 "the document"（判据 7 通用口径——评审亦覆盖需求档 / 批次档）；一词级差异。
  - 影响面：模型可见指令（advisor 设计评审判据措辞）——**命中 A11 ①**（提交文本见 §2.5.1）；对外契约无涉 · 测试面无涉。
- **#45 `prompts/advisor-round2.md`**（同路径 · j 0.9318 · sha `46b014d51ded` / `74a5d1026103` · 46 / 44 行）
  - 左端读数（CLI）：两行式——`- Stop calling tools…` 与 `## Judgment Rules…` 分行。
  - 右端读数（VSC）：一行合写（两段以空格相接）；**文本逐字相同**（含 `## Judgment Rules…do not downgrade` 全文）。
  - 建议归一形态：取一侧版式（建议 CLI 两行式——`##` 标题独立成行）。
  - 影响面：版式级——归一后模型可见文本除行断外逐字等价 ⇒ 不命中三口径（须用户裁 = —）。
- **#46 `prompts/advisor-round3.md`**（同路径 · j 0.9250 · sha `2d701fd67699` / `aa9fd7e076aa` · 42 / 40 行）
  - 左端读数（CLI）：两行式——`- Stop calling tools…` 与 `## Judgment Rules…` 分行。
  - 右端读数（VSC）：一行合写；**文本逐字相同**。
  - 建议归一形态：取一侧版式（建议 CLI 两行式）。
  - 影响面：版式级 ⇒ 不命中三口径（须用户裁 = —）。
- **#47 `prompts/persona-engineering.md`**（同路径 · j 0.9184 · sha `dec5221e41cb` / `e4f85d9a1d3e` · 55 / 55 行）
  - 左端读数（CLI）：小节标题「与 eng-designer / eng-coder 的分工界面」；指针 `AGENT-LOOP.md` 的 §18。
  - 右端读数（VSC）：标题「与 eng-coder 的分工界面（设计写作面归 eng-designer）」；指针「AGENT-LOOP（CLI 仓·设计）§18（本端交付协议节 = §8）」——含跨端节号映射。
  - 建议归一形态（只建议）：融合——标题取并集语义；指针经参数化 / 注入承载端差（契约 10）。
  - 影响面：模型可见指令（角色分工表述 + 跨端指针）——**命中 A11 ①**（提交文本见 §2.5.1）；对外契约无涉。
- **#50 `docs/design/prompts/advisor-design.md`**（镜像 · j 0.9667 · sha `52a08b1e6a48` / `5836f82da42e` · 69 / 69 行）
  - 左端读数（CLI）：判据 7 括注 =「按项目文档地图——当评审上下文提供时」。
  - 右端读数（VSC）：同句 +「；本产品自研仓 = docs/design/README.md」；其余逐字相同。
  - 建议归一形态：融合——指针参数化（取语义并集）。
  - 影响面：文本面（CN 镜像）——无运行时 / 契约影响 ⇒ 不命中三口径（须用户裁 = —）。
- **#51 `docs/design/prompts/discipline-normal.md`**（镜像 · j 0.9143 · sha `b8d86ce93ca4` / `667798a65b6c` · 187 / 185 行）
  - 左端读数（CLI）：8 行差异——文档地图指针（`docs/README.md`）、「文档体系自持」节为 `###` + 编号列表、AGENT-LOOP 指针（§18 / §25）。
  - 右端读数（VSC）：7 行差异——指针按本端地图（`docs/design/README.md`）+ 跨仓说明（「docs/requirements/ 需求层在 CLI 仓」）、同节为粗体列表、指针含端内节号映射（§18 → §8 · §25 → §9）。
  - 建议归一形态：融合——版式取一侧 + 指针参数化（CN 镜像面）。
  - 影响面：文本面（CN 镜像）——无运行时 / 契约影响 ⇒ 不命中三口径（须用户裁 = —）。

### 2.4 纪律 / 角色面分叉档（原 §2.5（三）行集）

| # | 相对路径 / 对位 | 面 | 相似度 · 逐字节 | 分类 | 目标 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|---|---|---|
| 117 | `prompts/discipline-engineering.md` | 同路径 | 0.7713 · 异 | ③ | 进核（`core/prompts/discipline-engineering.md`） | 融合（取并集）+ 端特有段按注入（VSC 的 R14 池段 / 取消 eng-coder 判据；CLI 的改动面反查段） | 分叉 ＝ 各端机制不同（VSC per-role-domain 池 `src/prompts/discipline-engineering.md:262-265`；CLI 改动面反查 `:128-130`）+ 文档地图与 `AGENT-LOOP` 节号错位（§11.2 ↔ §9）；前提（各端机制仍存在）成立 ⇒ **段级 ④** | **①②** | S1（建核补齐） |
| 118 | `prompts/discipline-normal.md` | 同路径 | 0.6085 · 异 | ③ | 进核 | 融合 + 端特有段注入（VSC「收尾验收」节 / CLI 会诊终止口径） | 分叉 ＝ VSC 增「收尾验收」节（`:191-195`）+ 完成声明受审句；CLI 多「Ctrl+I 不终止会诊」等句 + 节序不同；指针按端地图（`docs/README.md` ↔ `docs/design/README.md`） | **①** | S1（建核补齐） |
| 119 | `prompts/persona-eng-coder.md` | 同路径 | 0.5510 · 异 | ③ | 进核 | 融合 + 端特有段注入（VSC「Guidelines」块：不得静默降级 / 收尾自审六条 / 工具权限处置） | 分叉 ＝ VSC 独有六条收尾自审与降级纪律（`:34-51`）；CLI 的 file 域节为独立标题形态（内容 VSC 以 bullet 保留） | **①** | S1（建核补齐） |
| 120 | `docs/design/prompts/discipline-engineering.md` | 镜像 | 0.8268 · 异 | ② | 文本面（CN 镜像——**非运行期加载面**；两产品同名目录按裁定 B 原地保留） | 融合（版式取一侧 + 指针参数化）+ 端特有段随同源英文档裁决 | 分叉 ＝ 与同源英文档同源的 CN 投影（端注记 6 处 / 端特有段 / D5 细则）；前提（镜像各端自持）仍成立 | — | S1（随同源档裁决） |
| 121 | `docs/design/prompts/persona-eng-coder.md` | 镜像 | 0.7436 · 异 | ② | 文本面（CN 镜像） | 融合 + 端特有段按注入 | 分叉 ＝ VSC 镜像多「实现纪律与交付报告」六条（`:38-45`，其自述来源行号已漂 2 行）；其余逐字同 | — | S1（随同源档裁决） |
| 122 | `docs/design/prompts/persona-engineering.md` | 镜像 | 0.7872 · 异 | ② | 文本面（CN 镜像） | 融合（行内注记归一）+ 尾段三条端特有随同源英文档 | 分叉 ＝ VSC 镜像多端特有段与「CLI 侧批次档树」注记（`:11,44,49-54`） | — | S1（随同源档裁决） |

## 3. 须用户裁条目（自 `CORE-UNIFICATION.md` §2.5.1 搬入 · 逐字）

### 3.1 甲组（真选择）

| # | 条目（路径 / 对位） | 命中 | 左端行为（CLI） | 右端行为（VSC） | 建议归一形态 | 影响面 | 裁定状态 |
|---|---|---|---|---|---|---|---|
| A16 | `prompts/discipline-engineering.md`（#117；含中文镜像） | ①② | 独有「改动面反查（文档影响面）」节（`src/prompts/discipline-engineering.md:128-130`）；无 R14 池段 | 独有 R24 挂钩节、**R14 域池段**（`:262-265`）、取消 eng-coder 判据、D5 冻结窗口细则（`:145`） | 融合（取并集）+ 端特有段按注入（VSC 的 R14 / 取消判据；CLI 的改动面反查） | ① 归一后两侧模型被要求做的事会**并集化**（CLI 侧开始看到 R24 / D5 细则，VSC 侧开始看到改动面反查）⇒ 须逐条确认哪些真是端特有；② 模型可见指令面变更 | **已裁（2026-09-13）· 按建议** |
| A17 | `prompts/discipline-normal.md`（#118） | ① | 独有「Ctrl+I 不终止会诊」等句；会诊节位置不同 | 独有「收尾验收」节（`:191-195`）——完成声明受审 / load skills / 与设计档对账 | 融合 + 端特有段注入 | ① VSC 侧新增的收尾要求是否晋升为**两端共同**纪律（会改变模型收尾行为） | **已裁（2026-09-13）· 按建议** |
| A18 | `prompts/persona-eng-coder.md`（#119；含中文镜像） | ① | 无 Guidelines 块（`file` 域节为独立标题形态） | 独有 Guidelines 块（`:34-51`）：不得静默降级 / UI 与交互决策缺失即停报 / **收尾自审六条** / 工具权限处置 | 融合 + 端特有段注入 | ① 同上：VSC 的六条收尾自审是端特有还是应两端共用（会改变 eng-coder 的收尾行为与成本） | **已裁（2026-09-13）· 按建议** |

### 3.2 丙组（S0a 席位已裁 · 裁定正文见批次档 §1）

| # | 条目（路径 / 对位） | 命中 | 左端行为（CLI） | 右端行为（VSC） | 建议归一形态 | 影响面 | 裁定状态 |
|---|---|---|---|---|---|---|---|
| C1 | `prompts/advisor-design.md`（§2.5 #44） | ① | 判据 7 =「…amend **the document** that already owns its topic…」（`src/prompts/advisor-design.md`） | 判据 7 =「…the **design** document…」（收窄）；其余逐字相同 | 融合——取「the document」（判据通用口径——评审面 ≠ 仅设计档：尚覆盖需求档 / 批次档） | 模型可见指令（advisor 设计评审判据措辞）· 对外契约无涉 · 测试面无涉 | **已裁（2026-09-13）**「按建议」· 已落地 `core/prompts/advisor-design.md`（批次档 §5 实施记录） |
| C2 | `prompts/persona-engineering.md`（§2.5 #47） | ① | 标题「与 eng-designer / eng-coder 的分工界面」+ 指针 `AGENT-LOOP.md` 的 §18（`src/prompts/persona-engineering.md`） | 标题「与 eng-coder 的分工界面（设计写作面归 eng-designer）」+ 指针「AGENT-LOOP（CLI 仓·设计）§18（本端交付协议节 = §8）」 | 融合——标题取**并集语义**；跨端指针以**注入**承载端差（契约 10） | 模型可见指令（分工表述 + 跨端指针）· 对外契约无涉 | **已裁（2026-09-13）**「按建议」· 已落地 `core/prompts/persona-engineering.md`（批次档 §5；注入位语法待设计面定义） |

## 4. 对外契约影响（自 `CORE-UNIFICATION.md` §2.12.2 搬入 · 逐字）

| # | 条目（契约点） | 类 | 归一变更 | 兼容形态（§2.12.1 模板） | 落地物（档:行 / 用例名 / CHANGELOG 条目） | 裁定状态 |
|---|---|---|---|---|---|---|
| 9 | 提示词面指令集（`discipline-engineering` · `discipline-normal` · `persona-eng-coder` 三档 + CN 镜像） | 输出（模型可见指令） | 并集化 + 端特有段注入 | 逐条登记（§2.5 #117–#119）+ 端特有段保留 | `PROMPT-SYSTEM.md` 同步 + 核内档 + 装配用例 | 已裁（2026-09-13）· 按建议（§2.5.1 A16–A18） |

## 5. 受影响文件（该子系统）

指针（不复制）→ `CORE-UNIFICATION.md` §2.8 下列行：**核提示词面（S1 新建）** · **核提示词加载面（S0a 首建 · S1 随裁决面补齐）** · **提示词加载面（S2 改）**（7 行）· **提示词副本删除（S2 / S3）** · **CN 权威镜像（建立副本）** · **CN 权威镜像（删除 · 作废）** · **产品文档（S2 改）** · **产品测试（S2 改）**。

## 变更记录

- 2026-09-13：建档——自 `docs/design/CORE-UNIFICATION.md` 拆出（§2.5 #2–#9 / #30–#39 / #43–#47 / #50 / #51 / #117–#122 + 四要素明细 · §2.5.1 A16–A18 / C1 / C2 · §2.12.2 第 9 行）；**语义零改**，行号沿用原编号。
