# 提示词系统（PROMPT-SYSTEM）· 核心统一子系统档

> **v2 就地更新**（2026-09-17 退役批）：M9 模块设计语义融入（单向生成流水线——见 §10；原旁路档 `_archive/modules/ENGINEERING-MODE-V2-MODULE-PROMPT-PIPELINE.md` 已归档 `_archive/modules/`）。

> 板块归属 = **核心统一**（phase 2——「一个核 + 两个薄壳」）；本档 = 该板块的**子系统设计档**。
> 工作流档 = `docs/core/design/CORE-UNIFICATION.md`（事实基线 / 核形态与消费契约 / 方案选型 / S0 方法 / 分段执行 S0a–S3 / 关键决策 / 受影响文件总表 / 验收回指 / 裁定 A1–A8 / 契约兼容策略 / 测试用例）——**本档不复制**。
> 需求层 = `docs/core/requirements/CORE-UNIFICATION.md`（F1–F13 / N1–N8）。
> 建档：2026-09-13（**文档拆分轮**——自 `CORE-UNIFICATION.md` §2.5 / §2.5.1 / §2.12.2 **逐节搬入，只搬不改语义**；行号沿用原裁定表编号）。
> **列定义**（裁决行各列含义）→ `CORE-UNIFICATION.md` §2.5；**须裁条目的分组口径与四要素提交形式** → 该档 §2.5.1。
> **机制面**（§6–§9 · 2026-09-15「批 5 并入」）：双源落地流程 · 装配实现事实 · 端特有段纪律 · byte-identical 取消 · 现状坐标——来源 = `thincoder-cli/docs/design/PROMPT-SYSTEM.md`（707 行 · 旧档一字未改，留参照历史）。

## 1. 归属与范围（自本档行内容的路径归纳）

| 面 | CLI 档 | VSC 档 |
|---|---|---|
| 槽位提示词（运行期加载） | `thincoder-cli/src/prompts/*.md`（15 档——已随 U2 删，实核空） | 同名（已随 W2 删——实核空）；**运行期面 = 核包 `thincoder-core/prompts/*.md`** |
| 工具描述（运行期加载） | `thincoder-cli/src/tools/*.md`（25 档——已随 U2 删，实核空） | 同名（已随 W2 删——实核空）；**运行期面 = 核包 `thincoder-core/tool-docs/*.md`** |
| **中文设计档（供人读・非运行期——与运行期档同源）** | `thincoder-cli/docs/design/prompts/*.md`（15 档） | `thincoder-vscode/docs/design/prompts/*.md`（15 档） |
| 槽位加载面 | `src/prompt-overlays.mjs`（**S2 删**——CLI 已随 U15 落地〔实核档不存在〕/ VSC 已随 `2026-09-15-vsc-core-wiring` W2 落地〔实核档不存在〕；删后装配面 = 核内单点 `thincoder-core/prompt-overlays.mjs`） | 同名（同路径对） |

**核内落点**：`thincoder-core/prompts/`（15 档槽位）+ `thincoder-core/tool-docs/`（24 档工具描述）+ 单一解析面 `prompt-files.mjs`（落 `thincoder-core/`）——**核内唯一副本**（用户裁定 A7）。

**核内只有运行期面** ✓——`thincoder-core/prompts/`（15）+ `thincoder-core/tool-docs/`（24）；**中文设计档永进核** ✗（归属**文档面**：两产品原地保留；其改名 / 移动只在文档面，随子系统迁移按文档面计划处置）。

> 工具**实现面**（`src/tools/*.mjs`）的行本体住 `docs/core/design/TOOLS.md`；本档收**文本面**（槽位 / 描述 / 中文设计档）。

## 2. 核模块裁决行（自 `CORE-UNIFICATION.md` §2.5 搬入 · 逐字）

### 2.1 槽位提示词（原 §2.5（一）逐字节同组——组陈述（逐字））

> 逐字节相同 ⇒ 无分叉面——前提校验不适用、不命中 A11（须用户裁 = —）；每行归属与四列逐行登记（列值 = 本组陈述）。

| # | 相对路径 / 对位 | 面 | 相似度 · 逐字节 | 分类 | 目标 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|---|---|---|
| 2 | `prompts/advisor-round1.md` | 同路径 | 1.0000 · 同 | ① | 进核（`thincoder-core/prompts/advisor-round1.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 3 | `prompts/common.md` | 同路径 | 1.0000 · 同 | ① | 进核（`thincoder-core/prompts/common.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 4 | `prompts/consult-base.md` | 同路径 | 1.0000 · 同 | ① | 进核（`thincoder-core/prompts/consult-base.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 5 | `prompts/persona-coder.md` | 同路径 | 1.0000 · 同 | ① | 进核（`thincoder-core/prompts/persona-coder.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 6 | `prompts/persona-eng-designer.md` | 同路径 | 1.0000 · 同 | ① | 进核（`thincoder-core/prompts/persona-eng-designer.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 7 | `prompts/persona-explore.md` | 同路径 | 1.0000 · 同 | ① | 进核（`thincoder-core/prompts/persona-explore.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 8 | `prompts/persona-normal.md` | 同路径 | 1.0000 · 同 | ① | 进核（`thincoder-core/prompts/persona-normal.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |
| 9 | `prompts/persona-plan.md` | 同路径 | 1.0000 · 同 | ① | 进核（`thincoder-core/prompts/persona-plan.md`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |

### 2.2 中文设计档（原 §2.5（一）逐字节同组——组陈述同 2.1）

> 本组 = **中文设计档**（`docs/design/prompts/*.md`——供人读・非运行期；与运行期档同源）；**归属 = 文档面**（两产品原地保留——裁定 B；改名 / 移动随子系统迁移按文档面计划）——**不进核内构建面**（S0a 首建 / S1 补齐 / S2 接线均不涉）。「面」列的「镜像」= 中文设计档对（对位类型，非运行期面）。

| # | 相对路径 / 对位 | 面 | 相似度 · 逐字节 | 分类 | 目标 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|---|---|---|
| 30 | `docs/design/prompts/advisor-round1.md` | 镜像 | 1.0000 · 同 | ① | 文档面（中文设计档——非运行期，不进核） | 文档面维持（两产品原地保留——裁定 B；文档面合流另议） | —（逐字节同，无分叉） | — | 文档面 |
| 31 | `docs/design/prompts/advisor-round2.md` | 镜像 | 1.0000 · 同 | ① | 文档面（中文设计档——非运行期，不进核） | 文档面维持（两产品原地保留——裁定 B；文档面合流另议） | —（逐字节同，无分叉） | — | 文档面 |
| 32 | `docs/design/prompts/advisor-round3.md` | 镜像 | 1.0000 · 同 | ① | 文档面（中文设计档——非运行期，不进核） | 文档面维持（两产品原地保留——裁定 B；文档面合流另议） | —（逐字节同，无分叉） | — | 文档面 |
| 33 | `docs/design/prompts/common.md` | 镜像 | 1.0000 · 同 | ① | 文档面（中文设计档——非运行期，不进核） | 文档面维持（两产品原地保留——裁定 B；文档面合流另议） | —（逐字节同，无分叉） | — | 文档面 |
| 34 | `docs/design/prompts/consult-base.md` | 镜像 | 1.0000 · 同 | ① | 文档面（中文设计档——非运行期，不进核） | 文档面维持（两产品原地保留——裁定 B；文档面合流另议） | —（逐字节同，无分叉） | — | 文档面 |
| 35 | `docs/design/prompts/persona-coder.md` | 镜像 | 1.0000 · 同 | ① | 文档面（中文设计档——非运行期，不进核） | 文档面维持（两产品原地保留——裁定 B；文档面合流另议） | —（逐字节同，无分叉） | — | 文档面 |
| 36 | `docs/design/prompts/persona-eng-designer.md` | 镜像 | 1.0000 · 同 | ① | 文档面（中文设计档——非运行期，不进核） | 文档面维持（两产品原地保留——裁定 B；文档面合流另议） | —（逐字节同，无分叉） | — | 文档面 |
| 37 | `docs/design/prompts/persona-explore.md` | 镜像 | 1.0000 · 同 | ① | 文档面（中文设计档——非运行期，不进核） | 文档面维持（两产品原地保留——裁定 B；文档面合流另议） | —（逐字节同，无分叉） | — | 文档面 |
| 38 | `docs/design/prompts/persona-normal.md` | 镜像 | 1.0000 · 同 | ① | 文档面（中文设计档——非运行期，不进核） | 文档面维持（两产品原地保留——裁定 B；文档面合流另议） | —（逐字节同，无分叉） | — | 文档面 |
| 39 | `docs/design/prompts/persona-plan.md` | 镜像 | 1.0000 · 同 | ① | 文档面（中文设计档——非运行期，不进核） | 文档面维持（两产品原地保留——裁定 B；文档面合流另议） | —（逐字节同，无分叉） | — | 文档面 |

### 2.3 非逐字节同组（原 §2.5（二）行集）

| # | 相对路径 / 对位 | 面 | 相似度 · 逐字节 | 分类 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|---|---|
| 43 | `prompt-overlays.mjs` | 同路径 | 0.9853 · 异 | ① | 取 CLI 侧（去镜像注记） | 分叉 = VSC 单行镜像注记；无失效前提（① 直取） | — | S0a（首批建核） |
| 44 | `prompts/advisor-design.md` | 同路径 | 0.9487 · 异 | ② | 融合（措辞归一——建议取 CLI） | 分叉 = 独立演进的措辞收窄；评审面跨档前提仍成立（② 融合） | **①** | S0a（首批建核） |
| 45 | `prompts/advisor-round2.md` | 同路径 | 0.9318 · 异 | ② | 取一侧版式（建议 CLI 两行式） | 分叉 = 行断版式；文本逐字相同——无失效前提（②） | — | S0a（首批建核） |
| 46 | `prompts/advisor-round3.md` | 同路径 | 0.9250 · 异 | ② | 取一侧版式（建议 CLI 两行式） | 分叉 = 行断版式；文本逐字相同——无失效前提（②） | — | S0a（首批建核） |
| 47 | `prompts/persona-engineering.md` | 同路径 | 0.9184 · 异 | ② | 融合（标题并集 + 指针参数化） | 分叉 = 两端各自维护 + VSC 侧指针适配；两端共用同一角色面前提仍成立（②） | **①** | S0a（首批建核） |
| 50 | `docs/design/prompts/advisor-design.md` | 镜像 | 0.9667 · 异 | ② | 融合（指针参数化） | 分叉 = VSC 侧补本地文档地图指针；文本内核一致——无失效前提（②） | — | 文档面 |
| 51 | `docs/design/prompts/discipline-normal.md` | 镜像 | 0.9143 · 异 | ② | 融合（版式取一侧 + 指针参数化） | 分叉 = 指针 / 版式 / 端内节号映射适配差异；文本内核一致——无失效前提（②） | — | 文档面 |

**四要素明细（原 §2.5（二）明细块 · 逐字）**

- **#43 `prompt-overlays.mjs`**（同路径 · j 0.9853 · sha `5ff987804ff9` / `fe9c32f47f1c` · 82 / 83 行）
  - 左端读数（CLI）：无独有行——除右端注记外两侧逐字相同。
  - 右端读数（VSC）：独有 1 行头注 `* VSC mirror of thincoder-cli/src/prompt-overlays.mjs (多实现面纪律——语义同源、原文自持).`
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
- **#50 `docs/design/prompts/advisor-design.md`**（中文设计档 · j 0.9667 · sha `52a08b1e6a48` / `5836f82da42e` · 69 / 69 行）
  - 左端读数（CLI）：判据 7 括注 =「按项目文档地图——当评审上下文提供时」。
  - 右端读数（VSC）：同句 +「；本产品自研仓 = docs/design/README.md」；其余逐字相同。
  - 建议归一形态：融合——指针参数化（取语义并集）。
  - 影响面：文档面（中文设计档）——无运行时 / 契约影响 ⇒ 不命中三口径（须用户裁 = —）。
- **#51 `docs/design/prompts/discipline-normal.md`**（中文设计档 · j 0.9143 · sha `b8d86ce93ca4` / `667798a65b6c` · 187 / 185 行）
  - 左端读数（CLI）：8 行差异——文档地图指针（`docs/README.md`）、「文档体系自持」节为 `###` + 编号列表、AGENT-LOOP 指针（§18 / §25）。
  - 右端读数（VSC）：7 行差异——指针按本端地图（`docs/design/README.md`）+ 跨仓说明（「docs/requirements/ 需求层在 CLI 仓」）、同节为粗体列表、指针含端内节号映射（§18 → §8 · §25 → §9）。
  - 建议归一形态：融合——版式取一侧 + 指针参数化（中文设计档面）。
  - 影响面：文档面（中文设计档）——无运行时 / 契约影响 ⇒ 不命中三口径（须用户裁 = —）。

### 2.4 纪律 / 角色面分叉档（原 §2.5（三）行集）

| # | 相对路径 / 对位 | 面 | 相似度 · 逐字节 | 分类 | 目标 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|---|---|---|
| 117 | `prompts/discipline-engineering.md` | 同路径 | 0.7713 · 异 | ③ | 进核（`thincoder-core/prompts/discipline-engineering.md`） | 融合（取并集）+ 端特有段按注入（VSC 的 R14 池段 / 取消 eng-coder 判据；CLI 的改动面反查段） | 分叉 ＝ 各端机制不同（VSC per-role-domain 池 `src/prompts/discipline-engineering.md:262-265`；CLI 改动面反查 `:128-130`）+ 文档地图与 `AGENT-LOOP` 节号错位（§11.2 ↔ §9）；前提（各端机制仍存在）成立 ⇒ **段级 ④** | **①②** | S1（建核补齐） |
| 118 | `prompts/discipline-normal.md` | 同路径 | 0.6085 · 异 | ③ | 进核 | 融合 + 端特有段注入（VSC「收尾验收」节 / CLI 会诊终止口径） | 分叉 ＝ VSC 增「收尾验收」节（`:191-195`）+ 完成声明受审句；CLI 多「Ctrl+I 不终止会诊」等句 + 节序不同；指针按端地图（`docs/README.md` ↔ `docs/design/README.md`） | **①** | S1（建核补齐） |
| 119 | `prompts/persona-eng-coder.md` | 同路径 | 0.5510 · 异 | ③ | 进核 | 融合 + 端特有段注入（VSC「Guidelines」块：不得静默降级 / 收尾自审六条 / 工具权限处置） | 分叉 ＝ VSC 独有六条收尾自审与降级纪律（`:34-51`）；CLI 的 file 域节为独立标题形态（内容 VSC 以 bullet 保留） | **①** | S1（建核补齐） |
| 120 | `docs/design/prompts/discipline-engineering.md` | 镜像 | 0.8268 · 异 | ② | 文档面（中文设计档——**非运行期加载面**；两产品同名目录按裁定 B 原地保留） | 融合（版式取一侧 + 指针参数化）+ 端特有段随同源英文档裁决 | 分叉 ＝ 与同源英文档同源的中文投影（端注记 6 处 / 端特有段 / D5 细则）；前提（各端自持）仍成立 | — | 文档面 |
| 121 | `docs/design/prompts/persona-eng-coder.md` | 镜像 | 0.7436 · 异 | ② | 文档面（中文设计档） | 融合 + 端特有段按注入 | 分叉 ＝ VSC 侧中文档多「实现纪律与交付报告」六条（`:38-45`，其自述来源行号已漂 2 行）；其余逐字同 | — | 文档面 |
| 122 | `docs/design/prompts/persona-engineering.md` | 镜像 | 0.7872 · 异 | ② | 文档面（中文设计档） | 融合（行内注记归一）+ 尾段三条端特有随同源英文档 | 分叉 ＝ VSC 侧中文档多端特有段与「CLI 侧批次档树」注记（`:11,44,49-54`） | — | 文档面 |

## 3. 须用户裁条目（自 `CORE-UNIFICATION.md` §2.5.1 搬入 · 逐字）

### 3.1 甲组（真选择）

| # | 条目（路径 / 对位） | 命中 | 左端行为（CLI） | 右端行为（VSC） | 建议归一形态 | 影响面 | 裁定状态 |
|---|---|---|---|---|---|---|---|
| A16 | `prompts/discipline-engineering.md`（#117；含中文设计档 #120） | ①② | 独有「改动面反查（文档影响面）」节（`src/prompts/discipline-engineering.md:128-130`）；无 R14 池段 | 独有 R24 挂钩节、**R14 域池段**（`:262-265`）、取消 eng-coder 判据、D5 冻结窗口细则（`:145`） | 融合（取并集）+ 端特有段按注入（VSC 的 R14 / 取消判据；CLI 的改动面反查） | ① 归一后两侧模型被要求做的事会**并集化**（CLI 侧开始看到 R24 / D5 细则，VSC 侧开始看到改动面反查）⇒ 须逐条确认哪些真是端特有；② 模型可见指令面变更 | **已裁（2026-09-13）· 按建议** |
| A17 | `prompts/discipline-normal.md`（#118） | ① | 独有「Ctrl+I 不终止会诊」等句；会诊节位置不同 | 独有「收尾验收」节（`:191-195`）——完成声明受审 / load skills / 与设计档对账 | 融合 + 端特有段注入 | ① VSC 侧新增的收尾要求是否晋升为**两端共同**纪律（会改变模型收尾行为） | **已裁（2026-09-13）· 按建议** |
| A18 | `prompts/persona-eng-coder.md`（#119；含中文设计档 #121） | ① | 无 Guidelines 块（`file` 域节为独立标题形态） | 独有 Guidelines 块（`:34-51`）：不得静默降级 / UI 与交互决策缺失即停报 / **收尾自审六条** / 工具权限处置 | 融合 + 端特有段注入 | ① 同上：VSC 的六条收尾自审是端特有还是应两端共用（会改变 eng-coder 的收尾行为与成本） | **已裁（2026-09-13）· 按建议** |

### 3.2 丙组（S0a 席位已裁 · 裁定正文见批次档 §1）

| # | 条目（路径 / 对位） | 命中 | 左端行为（CLI） | 右端行为（VSC） | 建议归一形态 | 影响面 | 裁定状态 |
|---|---|---|---|---|---|---|---|
| C1 | `prompts/advisor-design.md`（§2.5 #44） | ① | 判据 7 =「…amend **the document** that already owns its topic…」（`src/prompts/advisor-design.md`） | 判据 7 =「…the **design** document…」（收窄）；其余逐字相同 | 融合——取「the document」（判据通用口径——评审面 ≠ 仅设计档：尚覆盖需求档 / 批次档） | 模型可见指令（advisor 设计评审判据措辞）· 对外契约无涉 · 测试面无涉 | **已裁（2026-09-13）**「按建议」· 已落地 `thincoder-core/prompts/advisor-design.md`（批次档 §5 实施记录） |
| C2 | `prompts/persona-engineering.md`（§2.5 #47） | ① | 标题「与 eng-designer / eng-coder 的分工界面」+ 指针 `AGENT-LOOP.md` 的 §18（`src/prompts/persona-engineering.md`） | 标题「与 eng-coder 的分工界面（设计写作面归 eng-designer）」+ 指针「AGENT-LOOP（CLI 仓·设计）§18（本端交付协议节 = §8）」 | 融合——标题取**并集语义**；跨端指针以**注入**承载端差（契约 10） | 模型可见指令（分工表述 + 跨端指针）· 对外契约无涉 | **已裁（2026-09-13）**「按建议」· 已落地 `thincoder-core/prompts/persona-engineering.md`（批次档 §5；注入位语法待设计面定义） |

## 4. 对外契约影响（自 `CORE-UNIFICATION.md` §2.12.2 搬入 · 逐字）

| # | 条目（契约点） | 类 | 归一变更 | 兼容形态（§2.12.1 模板） | 落地物（档:行 / 用例名 / CHANGELOG 条目） | 裁定状态 |
|---|---|---|---|---|---|---|
| 9 | 提示词面指令集（`discipline-engineering` · `discipline-normal` · `persona-eng-coder` 三档 + 中文设计档） | 输出（模型可见指令） | 并集化 + 端特有段注入 | 逐条登记（§2.5 #117–#119）+ 端特有段保留 | `PROMPT-SYSTEM.md` 同步 + 核内档 + 装配用例 | 已裁（2026-09-13）· 按建议（§2.5.1 A16–A18） |

## 5. 受影响文件（该子系统）

指针（不复制）→ `CORE-UNIFICATION.md` §2.8 下列行：
**核提示词面（S1 新建）** · **核提示词加载面（S0a 首建 · S1 随裁决面补齐）** · **提示词加载面（S2 删 / S2 改）**（7 行——**6 行「S2 删」**〔`prompt-overlays.mjs` 两行（2026-09-15 修正轮）+
`advisor.mjs` / `advisor/main.mjs` / CLI `tools/shared.mjs` / `agent/setup.mjs` 四行（2026-09-15 修正轮-4）〕· **1 行「S2 改」**〔VSC `thincoder-vscode/src/tools/shared.mjs`——拆壳薄壳保留〕）· （迁移期引文——档已删）
**提示词副本删除（S2 / S3）** · **中文设计档（文档面 · 基准层正本）** · **中文设计档（删除 · 作废）** · **产品文档（S2 改）** · **产品测试（S2 改）**。

## 6. 机制面（自 CLI 产品档并入 · 2026-09-15 · 批 5）

### 6.1 双面落地流程（现行）

- **提示词 = 产品代码**（FR1 口径不变）；**内容权 = 主 agent**（逐字文本由它定——它就是设计的一部分）；**落笔走正常链**（设计评审 → 用户批准 → eng-coder）；起草分工 = eng-designer 起草逐字 → 主 agent 确认 → eng-coder 机械落笔。
- **双面**：**中文审核面** = `docs/core/design/prompts/`（15 档——供用户审核；内容权威与设计维护面）∥ **英文运行面** = `thincoder-core/prompts/`（15 档槽位）+ `thincoder-core/tool-docs/`（24 档工具描述）——核内唯一副本（承 F8）。
- **公共层（`common.md`）节级结构** → 需求档 `docs/core/requirements/PROMPT-SYSTEM.md` §2.3（**逐节大纲**：每节管什么；正文在两面 common 档）——**本档不复制**（D2）。
- **行为纪律面的落点形态**：**既有节内增列**（不新增节 ⇒ 零 `##` 块计数连带）；本次应用 = 破坏性命令红线落 `common.md` §10 尾部——落点裁定与否决备选 → §7 D-PS5。
- **变更流**：改中文正本 → 翻译写入英文运行面（复用存量词句、语义对等；**无同步脚本、无硬一致门**）。提示词档免档位判定（`.md` 结构尺度）。生成流程本体（双面流程 / 路径取法与落地面 / 结构级复核）见 **§10**（本处不重述——D2）。
- **提示词零维护者注**（编写纪律 #15）：出处 / 日期 / 批次名 / 评审号一律进设计档不进提示词（语义生效边界除外——保语义去日期注）。

### 6.2 装配实现事实

- 装配 = **整文件拼接**（`thincoder-core/prompt-overlays.mjs` 槽位表驱动；common 恒第二位、七场景全部注入）——**零段落级解析**：增 / 删节不影响装配代码（增删节类变更 = 零运行时代码改动的充分条件）。
- 槽位装配矩阵（九场景）与降级链（缺文件 ⇒ 槽空缺 + 警告，**不 fallback**）→ 详述 = `docs/core/requirements/PROMPT-SYSTEM.md` §4.5（本档不复制——D2）。
- **装配之后的运行期追加面**：项目指令块（不分 depth）与 skills 尾块（depth-0）——`thincoder-core/agent/setup.mjs:221-229`；以及**派单固块**（spawn 级固定机制性指令，如批次档路径行 / 审计模板；拼接位 = 槽位装配之后、项目指令之前）——字段 `child._spawnSystemBlock`、拼接点 `thincoder-core/agent/setup.mjs:214` 之后；**机制单源 = `AGENT-LOOP-SUBAGENT.md` §6.26，本档不复制**。

### 6.3 端特有段与多实现面纪律

- 各实现面（CLI / VSC / 中文正本 / 运行期落地）**语义同源、原文自持**：端特有段**原地保留**、互不追赶、差异如实上报（多实现面纪律；CORE-UNIFICATION 契约面）。
- 端特有段示例（VSC）：`discipline-engineering` 的池规则段 / `persona-engineering` 的 Multi-Task 段 / `persona-eng-coder` 的实现纪律段。

### 6.4 byte-identical 取消（2026-09-04——设计锚为准）（并入 · 2026-09-15）

来源 = `thincoder-cli/docs/design/AGENT-LOOP.md` 旧 §12.4（旧档一字未改，留参照历史）。

- 两端 `src/prompts/` 的 **byte-identical 机械约束取消**（不再强制字节相同、不需同步脚本）；替代 = **设计锚机制**：镜像锚文本在设计文档逐字定稿（权威源）——实现面照抄——差异暴露靠设计评审 + 交付审计 + 语义锚（内容断言各端自持）。
- byte-identical 相关机械比对断言 / 同步脚本全部清理；**散文锚断言亦已按测试纪律退役**（`docs/core/design/TESTING.md` §5——2026-09-12）——现行守护 = 行为面断言 + 结构机检面（语义锚不得新写为散文锚）。
- **保留的非镜像字节断言**：advisor-design 档硬加载逐字节（防静默降级）· 前缀缓存字节断言（会话面）。

### 6.5 现状坐标（as-of 2026-09-15 实核）

- 运行期槽位 = `thincoder-core/prompts/*.md`（15 档）· 工具描述 = `thincoder-core/tool-docs/*.md`（24 档）；加载面 = `thincoder-core/prompt-files.mjs` + `thincoder-core/prompt-overlays.mjs`。
- 中文正本 = `docs/core/design/prompts/*.md`（15 档——2026-09-15 批 1 位移落位）。
- **端侧装配面（S2 接线落地读数）**：CLI = `thincoder-cli/bin/thincoder.mjs` 入口首步 `configurePromptInjections(CLI 表)` + `thincoder-cli/src/prompt-injections.mjs`（随 U2 落）；
  VSC = `thincoder-vscode/extension.mjs` `activate()` 首步 `configurePromptInjections(VSC 表)` + `thincoder-vscode/src/prompt-injections.mjs`（随 W2 落）；工具描述装载根两产品同指核 `loadToolDoc`（CORE-UNIFICATION §2.13.2 / §2.13.8）。

## 7. 并入的关键决策记录（含否决备选）

| # | 决策 | 理由 / 否决备选 |
|---|---|---|
| D-PS1 | **中文审核面 = 内容权威**；英文运行面 = 翻译产物 | 承用户裁定 A7 面；生成 = 翻译不是 cp；两面不同语言、无硬一致要求 |
| D-PS2 | EN 落地 = CN 定稿的**语义对等翻译**，**复用存量 EN 词句** | 词句连续性（存量语料 / 语义锚稳定）；否决「重写英文风格」·「逐字直译」（旧 D-CL2） |
| D-PS3 | 重复条款处置 = **源侧删除**（非指针） | common 恒第二位注入——指针无导航价值；D2 单一权威源；否决「保留指针句」·「保留纪律层细表」（旧 D-CL3） |
| D-PS4 | byte-identical 取消 → **设计锚机制** | 字节硬一致形成互相依赖（并发处理不利）；各面独立语义锚守（多实现面纪律） |
| D-PS5 | **破坏性命令红线 = `common.md` §10 尾部增列**（既有节内；不新增节、不改述既有句） | 落点与「节数不变」已由需求定（`docs/core/requirements/PROMPT-SYSTEM.md` §2.3 行 10 + 增补注②）；红线是既有「有专用工具就不 hand-roll」句（仅中文正本 `common.md:69`）的同节主题延伸 ⇒ 既有文本零改述；否决「新增节」·「改述既有原则句 / 标题」（动既有语义面文本、双面同步风险、零收益）·「落人格层或纪律层」（受众 = 全角色两模式，`common.md` 恒第二位是唯一全覆盖面） |

## 8. 不并项与历史沿革

### 8.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-cli/docs/design/PROMPT-SYSTEM.md`（707 行 · CLI 产品档）——**原地保留作参照历史**（保留 ≠ 维护）。其下列内容**不并入本档**：

| 旧档节 | 内容 | 何故不并 |
|---|---|---|
| §1 现状对账 / §2.2 EN 逐字草案 / §2.3 源侧清理逐文件表 / §2.4 文档面清单 | 单批落地施工材料 | 一次性批次材料——已落进两处正本（中文正本 + 运行期档） |
| §2.5 方案选型 / §2.6 冲突核对 / §2.7 待确认项（R-1–R-4） | 单批施工规划与裁定项 | R 项已由内容权方裁定落地；选型属时点决策 |
| §3 测试（AC / 用例 / 锚扩展清单） | 单批测试面 | 批次材料；其中散文锚类已退场（`TESTING.md` §5） |
| §4 受影响文件（R24a） | 单批双端文件清单 | 时点材料——现行档面见 §6.5 |
| §8 机制纪律提示词落地（TEST-DISCIPLINE-PROMPTS · §8.1–§8.11） | 单批逐字文本 / 编辑点 / 受影响文件 | 逐字文本已落两处正本；机制源 = `docs/core/design/TESTING.md` §3–§4 + `docs/core/design/LEDGER.md`（v1 MECHANISM §1.13 已归档） |
| 各节变更记录 + 状态行（「设计就绪待评审」类） | 逐批流水与状态 | 历史叙述——本档自有变更记录 |

### 8.2 不并项登记（跨板块 / 一次性材料——**不并**）

| 旧档面 | 内容 | 何故不并（去向） |
|---|---|---|
| §5 决策 D-CL1 / D-CL4–D-CL8 | 落点选型 / 锚扩展载体 / T75 守恒值 / 同名 basename 处置 | 单据实施决策——结论已由现状（设计档在册 / 测试面处置）承载；不迁 |
| §8.5 锚断言清单 + §8.6/§8.7 AC 与用例表 | 已退场断言与批用例 | 散文锚退役批处置（`TESTING.md` §5）；批材料归批次档 |
| 「T75 守恒锁」协调条 | 跨批用例守恒锁 | 锁体随测试生命周期批处置——现状以测试档为准 |

## 10. 提示词双面流程（M9 落点）

**定位**：提示词有两面——**中文审核面**（`docs/core/design/prompts/`，用户审核用）与**英文运行面**（`thincoder-core/prompts/`，国外模型运行用）。流程 = 改中文 → 翻译生成英文（生成 = 翻译不是 cp）。**无机检门**（2026-09-17 用户裁定：无限机检反感）。

**兑底核对清单四项 = `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-PROMPT-PIPELINE.md` ②4**（**D2 单一权威源——不重述**）。

### 10.1 路径（多根取法与落地面裁定）

| 面 | 取值规则 | 判据（可机检） |
|---|---|---|
| **模板（CN 审核面）** | `docRoot.design` **逐根** + `/prompts`——**取实存者**；本仓 = `docs/core/design/prompts/`（15 档） | 各根下 `prompts/` 目录**实存命中恰 1 处**：0 命中 = 配置缺口（fail-loud，不静默回落）；≥2 命中 = 歧义（拒，须显式声明） |
| **落地（EN 运行面）** | manifest 顶层平级键 `promptsLanding`（单源声明；缺键 fallback = `DEFAULT_MANIFEST.promptsLanding` = `thincoder-core/prompts`） | 声明值 == `thincoder-core/prompt-files.mjs:30` `PROMPTS_DIR` 实测值（两值同指 ⇒ 声明与实际一致；不一致 = 生成会写偏，报） |

**取法裁定（三候选 → 选定「逐根取实存」）**：

- **选定 = `docRoot.design` 逐根 + `/prompts`，实存命中唯一者胜**。理由：不引入新键（`promptsLanding` 已覆盖落地侧）；不依赖数组顺序的隐式语义（`MANIFEST.md` 无「首元素 = 主根」条款）；与 F7「数组 = 完整声明」同向（逐根探测）。本仓实核 = 三根中仅 `docs/core/design` 下有 `prompts/`（`docs/cli/design` / `docs/vsc/design` 下无）⇒ 唯一命中。
- **否决「数组首元素」**：首元素语义无权威源（数组顺序 = 声明序，非优先级）——重排即静默换面。
- **否决「按 `promptsLanding` 反查」**：落地 = 核包路径（代码仓），与文档树无映射关系 ⇒ 不可实现。
- **备选（登记不入本批）= 显式键 `promptsTemplate`**（对称于 `promptsLanding`）：仅在「零命中 / 双命中」成为真实需求时启用（须走 manifest schema 变更 + 评审）。

**`promptsLanding` 是否 M9 落地面**：**是**——它就是落地面（EN 运行面路径）的**单一声明源**。接线事实（as-of 2026-09-18 实核）：运行期加载面 `thincoder-core/prompt-files.mjs:29-30` `PROMPTS_DIR = join(ROOT, "prompts")` **包内固定、不读 manifest** ⇒ 声明面与运行期当前**同值但不接线**（本批不引运行期依赖——生成流程只消费声明面）。

**两面语义（用户 2026-09-17 裁定）**：模板 = **中文审核面**（用户审核用）；落地 = **英文运行面**（国外模型不懂中文）——生成 = **翻译**（中文 → 英文），**不是 cp**。

**功能点**：

| # | 功能点 | 方案 |
|---|---|---|
| F2 | 更新流程约束 | 先改模板（中文）→ 翻译生成落地（英文）——落地是生成物 |
| F3 | 落点读声明面（**v3 收正**） | 模板 = `docRoot.design` 逐根 + `/prompts`，**取实存者**（判据 = 唯一命中——§10.1）；落地 = `promptsLanding`（本仓 = `thincoder-core/prompts`） |
| F4 | 清理「方案选型对比」残留（**v3 收正 = 按实存重定**） | **现况 = 三处对象均已零点清**（对象已不存在，无须清理动作）：① `discipline-engineering.md`「方案选型对比」节——模板 09-17 重构已无（grep 零命中）② A3⑤「方案对比已做」——同（09-17 只存于落地、随 `8b5ea7c3` 重生成消失）③ `persona-eng-designer.md` 8 项 item 1——两侧现为「决定 + 理由，不再要求候选枚举（该纪律已废）」**退役声明形态**（正面陈述，非要求）。判据域收正见 §10.5 表下注 |


**结构级复核（已结清 · as-of 2026-09-18）**：**判据 = 结构 / 条目级对应**（槽位标记 + 标题树 + 条目与技术 token）——两侧 = CN 模板 ↔ EN 落地的双语平行版，字节 / 行文本比对本无信息量。
表下四项（P1–P4）处置：P1 `persona-coder` EN 领先 2 句 · P2 `common` EN 工具面更全——**用户认账**（判为 EN 侧固有表述）；P3 `persona-normal` CN「确认与批准门」节——**已修**；P4 纯切分 / 排版差两处（`common.md` 3 子节 · `persona-engineering.md` 1 节）——非阻断、不再处置。**零待办**。

### 10.2 结构级复核（15 对 · 已结清 · as-of 2026-09-18）

| # | 对 | 槽标 | 标题树 CN/EN | 结构判 | 差异性质 |
|---|---|---|---|---|---|
| 1 | `advisor-design` | ✓ | 8/8（序列同） | 对齐 | 双语正当差（译法 + 段合并排版） |
| 2 | `advisor-round1` | ✓ | 4/4（同） | 对齐 | 双语正当差 |
| 3 | `advisor-round2` | ✓ | 5/5（同） | 对齐 | 双语正当差 + 示例行写法差（CN 用全路径形式、EN 用短文件名形式——皆为提示词内示例文本，非本档引用） |
| 4 | `advisor-round3` | ✓ | 5/5（同） | 对齐 | 同上 |
| 5 | `common` | ✓ | 14/17（2026-09-20 重算〔台账 #112〕；口径 = 标题节点〔层级 2+，含行内〕） | **差** | **EN 领先**：EN 将工具观三条升为 3 个 `###` 子节 + 工具路由表（表 vs CN 散文；7 项仅 EN：`process` / `get_current_time` / `wait_for` / `verify` / `fetch` / `websearch` / MCP 搜索） |
| 6 | `consult-base` | ✓ | 4/4（同） | 对齐 | 双语正当差 |
| 7 | `discipline-engineering` | ✓ | 14/14（同） | 对齐 | 双语正当差（段 22/22 全配对；token 差仅 `文档:节` ↔ `doc:section`） |
| 8 | `discipline-normal` | ✓ | 22/22（同） | 对齐 | 双语正当差（编号签名集合零差） |
| 9 | `persona-coder` | ✓ | 3/3（同） | 对齐 | **EN 领先 2 句**：`The parent CANNOT see your context…` + `You are an IMPLEMENTER with independent judgment — not a typewriter.` |
| 10 | `persona-eng-coder` | ✓ | 6/6（同） | 对齐 | 双语正当差（token 零差） |
| 11 | `persona-eng-designer` | ✓ | 10/10（同） | 对齐 | 双语正当差（占位符翻译：`<批>-<主题>.md` ↔ `<batch>-<topic>.md`） |
| 12 | `persona-engineering` | ✓ | 16/17 | **差** | 切分差：EN 将「一次实现轮的界」五条独立为 `## Batch-record lifecycle (five rules)`，CN 并在「项目状态档」节内（内容对应） |
| 13 | `persona-explore` | ✓ | 3/3（同） | 对齐 | 双语正当差 |
| 14 | `persona-normal` | ✓ | 4/4（**同数不同节**） | 漂移 | **CN 领先 1 节**：CN「确认与批准门」EN 无；EN 另有 `## Main-agent role`（CN 该内容并在「能力边界」节内） |
| 15 | `persona-plan` | ✓ | 3/3（同） | 对齐 | 双语正当差 |

### 10.5 验收（回指 AC-M9）

| # | 判据 |
|---|---|
| AC-M9-3 | 清理对象清零——**v3 判据域收正**（见下注）。现况 = 零命中 ⇒ ✅ |

**AC-M9-3 判据域注**：

- **域** = 两面提示词档（模板 15 + 落地 15 = 30 档）。
- **模式** = `方案选型对比|候选 ?≥ ?2|对比表|单方案豁免|方案对比已做|comparison table|single-candidate exemption`。
- **豁免形态** = 「该纪律已废 / that discipline is retired」**退役声明句**（正面陈述，不复述老要求）——现两处（两面 `persona-eng-designer.md` 各 1）。
- **排除** = 设计档 / 批次档 / 需求档（纪律本体与历史记录，**非**清理对象——原判据把「指到纪律本体的坐标」与「提示词内的要求」混为一域，本次分彮登记）。

**边界（本节不做）**：不做提示词内容权（内容 = 主 agent 内容权 + coder 落笔）；不手改落地档（生成物）；不新增机检门。

## 变更记录

- 2026-09-20（**破坏性命令红线批 · 设计轮 · eng-designer** · 台账 #108——用户 2026-09-20 00:50「提示词当然现在也要落」）：§6.1 补**行为纪律面落点形态**一行（既有节内增列 ⇒ 零 `##` 块计数连带）+ §7 补 **D-PS5**（红线落 `common.md` §10 尾部；否决 新增节 / 改述 / 落他层）；
  本批**内容面**（两面 `common.md` §10 尾部追加红线块 + 边界句 · 各 +7 行 · 零新增节）= 批档 `docs/batches/2026-09-20-destructive-command-redline.md` §2，落笔归实现轮（与 #106 同落点文件 ⇒ 串行，#106 已先落；**评审轮 1 修正**：D-PS5 理由句补单面限定〔该句仅中文正本〕· 可 revert）。

- 2026-09-20（**批次档常识批 · 设计轮 · eng-designer** · 台账 #106——用户 2026-09-20 00:12 裁定「公共提示词常识面是缺口，要改；六段全图也应该作为常识进入」）：§6.1 新增**公共层节级结构指针句**（`common.md` 逐节大纲归需求档 `requirements/PROMPT-SYSTEM.md` §2.3——本档不复制，D2）；
  本批**内容面**（两面 `common.md` 追加第 14 节「批次档常识」逐字块 + T-CL1 计数连带）= 批档 `docs/batches/2026-09-20-batch-record-commons.md` §2，落笔归实现轮。（本条折两行 = 父侧直接执行 · 评审轮 1 后行宽收正 · 零语义 · 可 revert。）

- 2026-09-18（**同节补两条 · 主 agent**——用户 19:04 追问「有没有提到内部张力和交叉引用？」→ 19:08「你先落了我再看看」）：C 质量组 **10 条 → 12 条**——新增 **⑪ 引用形态**（`doc:section` 书写 · 单向不成环 · 不复制被引内容 · 现态可解析）与 **⑫ 内部张力显式**（同一机制/事实两处不一致 = 表述／判据／计数／时点 ⇒ 显式收口 + 发现即上报；不静默择一、不让两说并存）；分工：⑧ 管「指的东西没了」，⑪ 管「引用怎么写」；⑦ 禁「重复」，⑫ 禁「不一致」。双源同文。

- 2026-09-18（**公共层新增通用尺子 · 主 agent**——用户定向：「应该有一套关于文档体系好坏的评价标准」→「是用来评价 thincoder 去开发的别的项目的」→「落」）：`common.md` 新增「**文档体系评价（通用尺子）**」节 = 前置句（先按该项目自身规范评 · 问题摆给负责人 · 不擅自改造别人的体系）+ A 层次三条 / B 位置与命名三条 / C 质量四条；**对象 =
 用 thincoder 开发的「其他项目」**（通用尺子 · 不含本仓路径）；双源同文（运行期 `thincoder-core/prompts/common.md` + 中文正本 `docs/core/design/prompts/common.md`）；**记录面只落本档与需求档**——两提示词档 = 模板 / 运行期代码，**不携带变更记录**（会进上下文影响运行——用户 2026-09-18 明确）。
- 2026-09-18（**失效表达清理批 · 第 2 轮 · 本批直接执行 · 可 revert**——同批 §1 裁定）：§10 定位段后补**兑底指针**一行（兑底核对清单四项 = 需求档 `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-PROMPT-PIPELINE.md` ②4——D2 单一权威源，不重述）。历史沿革 = 批档 `docs/batches/2026-09-18-stale-expression-purge.md`。

- 2026-09-18（**失效表达清理批 · 本批直接执行 · 可 revert**——承用户 2026-09-18 裁定「修订式表达很害人，失效的表达一定要删掉」）：**§10 整节缩节**——删 §10 导语句「M9 机检裁撤」片段 · §10.1 功能点 F1 整行 · 机检裁撤块 + 脚本退役块两段 · **§10.3 启用条件 C1–C5 整节** · **§10.4 护栏（收口核对清单）整节** · §10.5 标题括注 + AC-M9-1 / -2 / -4 **与 AC-M9-5** 三+一行；
  **改编**：§10 标题去批次括注 · v3 收正段 + 回填复核段 + 处理轨迹段三删 · §10.2 改「已结清」记录形（遗留四项去待办语气）· 边界段去批范围句 · §6.1 变更流指针同轮校（去「启用条件 / 收口核对清单」措辞）。历史沿革 = 本档既有历史段 + 批档 `docs/batches/2026-09-18-stale-expression-purge.md`。

- 2026-09-18（**批 M9 提示词单向生成 · 设计轮 · eng-designer** · 台账 #78）：v3 收正——§10 重构为 10.1–10.5。
  ① **10.1 路径**：多根 `docRoot.design` 下模板目录取法 = 逐根 + `/prompts` 取实存唯一命中（否决首元素 / 反查 / 新键三候选）；`promptsLanding` = 落地面裁定 + 接线事实。
  ② **10.2 结构级复核（15 对）**：原「逐字节 0/15」读数作废，改结构 / 条目级三面判据；遗留四项（P1 `persona-coder` EN 领先 2 句 · P2 `common` EN 工具面更全 · P3 `persona-normal` CN 领先 1 节 · P4 纯切分 / 排版差两处）。
  ③ **10.3 启用条件 C1–C5**（现况全绿；唯一待裁 = P1 / P2 处置）· ④ **10.4 护栏**（收口核对清单 · 非门——尊重 2026-09-17「无限机检反感」裁定）· ⑤ **10.5 验收**（AC-M9-3 判据域收正 + 新增 AC-M9-5）。
  §6.1「变更流」行加 §10 指针。**本批零提示词正文改动**（回填出射程——用户 2026-09-18）。

- 2026-09-18（**批 PROMPT-FACE · 设计轮 · eng-designer** · 台账 #23）：§6.2 装配实现事实补一行——**派单固块**（spawn 级固定机制性指令）随 system 面下发（拼接位 = 槽位装配之后、项目指令之前；机制单源 = `AGENT-LOOP-SUBAGENT.md` §6.26）。本档零正文 / 零槽位改动。

- 2026-09-17（**v2 就地更新 · 退役批** · 主 agent）：M9 模块设计语义融合——新增 §10 单向生成流水线（模板 = docRoot.design/prompts 中文审核面、落地 = promptsLanding 英文运行面、生成 = 翻译非 cp；机检判据「逐字节 sha256」标注**待定**——用户 2026-09-17 裁定无字节一致要求；F4 清理已落笔）；原旁路档 `_archive/modules/ENGINEERING-MODE-V2-MODULE-PROMPT-PIPELINE.md` 归档 `_archive/modules/`。

- 2026-09-17（**反向引用 · 主 agent**）：加 §9 反向引用——本档是 v2「行为面」载体，与 v2 架构 `ENGINEERING-MODE-V2.md` §2.3 E4.1「提示词系统接口」双向交叉引用（纪律分流：语义写权/角色职责/勘察边界留提示词，token 门/段白名单/冻结窗口/带宽/机检搬结构 M1–M8）。v2 对本档的变更点：M9 单向生成（§6.1 双源→单向）· 纪律分流 · designer 职责收正 · 删「方案选型对比」· coder 勘察边界（待裁）。

## 9. 反向引用（v2 行为面载体）

（见 §10 提示词双面流程——v2 行为面由双面翻译流程 + 收口核对承载。）

- 本档 = 工程模式 v2 的**行为面载体**：不可机判的纪律（语义写权、角色职责、勘察边界、互锁）落提示词模板；可机判的搬结构（M1–M8 代码 + manifest 声明面）——分流权威表见 `ENGINEERING-MODE-V2.md` §2.3 E4.1。
- 变更同步：v2 对提示词内容的任何裁定，落本档对应模板档（persona / discipline / common），双面翻译流程（M9）同步落地。

- 2026-09-13：建档——自 `docs/core/design/CORE-UNIFICATION.md` 拆出（§2.5 #2–#9 / #30–#39 / #43–#47 / #50 / #51 / #117–#122 + 四要素明细 · §2.5.1 A16–A18 / C1 / C2 · §2.12.2 第 9 行）；**语义零改**，行号沿用原编号。
- 2026-09-13（概念纠正轮）：**中文提示词档 = 设计文档**（批次档 §1 裁定）——§1 表与 §2.2 组名改「中文设计档（供人读・非运行期）」；**#30–#39 / #50 / #51 / #120–#122 的「归属段」列由建核段改为「文档面」**（改前 = `S0a（首批建核）` ×12 / `S1（随同源档裁决）` ×3）；§1 补「核内只有运行期面 · 中文设计档永进核」。
- 2026-09-15（**迁移批 · 第 5 批 · 并入 · eng-designer**）：新增 §6 **机制面**（双源落地流程 / 装配实现事实 / 端特有段纪律 / **byte-identical 取消**——自 `thincoder-cli/docs/design/AGENT-LOOP.md` 旧 §12.4 并入 / 现状坐标）· §7 **并入的关键决策记录**（D-PS1–D-PS4）·
  §8 **不并项与历史沿革**（旧档一次性材料逐项登记）· §9 体量（低于软线）；来源 = `thincoder-cli/docs/design/PROMPT-SYSTEM.md`（旧档一字未改，留参照历史）。本档 150 → **221 行**。
- 2026-09-15（**提示词加载面收正 · eng-designer**——承 `docs/batches/2026-09-15-vsc-core-wiring.md` §2 修正轮 finding 13）：§1 表「槽位加载面」行与 §5 指针注同轮收正——`src/prompt-overlays.mjs` 两产品侧 = **S2 删**（CLI 已随 U15 落地〔实核档不存在〕；VSC 随 W2）；权威 §2.8 `:1037` / `:1038` 两行同批由「S2 改 · ±6」收正为「S2 删」。
- 2026-09-15（**提示词加载面同族 5 行收正 · eng-designer**——承 `docs/batches/2026-09-15-vsc-core-wiring.md` §2 修正轮-4 发现 #3）：权威 §2.8 `:1039`–`:1043` 逐行择一收正——CLI `advisor.mjs` / `tools/shared.mjs` / `agent/setup.mjs` 与 VSC `advisor/main.mjs` = **「S2 删」**（CLI 实核档不存在 · VSC 随 W12/W15 删除集）； （迁移期引文——档已删）
  VSC `thincoder-vscode/src/tools/shared.mjs` = **「S2 改——拆壳薄壳保留」**（与 W14 口径一致）；本档 §5 指针注同轮同步。
- 2026-09-15（**S2 W2 落地 · eng-coder**——承 `docs/batches/2026-09-15-vsc-core-wiring.md` §2 W2）：VSC 侧接线落地读数收正——§1 表三行状态行（槽位提示词 / 工具描述 / 槽位加载面：VSC 副本已随 W2 删〔实核空〕，运行期面 = 核包）；§6.5 补端侧装配面坐标（VSC = `extension.mjs` `activate()` 首步 + `thincoder-vscode/src/prompt-injections.mjs` 取值表；工具描述装载根同指核 `loadToolDoc`）。
