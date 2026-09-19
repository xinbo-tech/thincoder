# 工程模式 v2 · 模块设计（M9 提示词单向生成）

> 模块划分权威源 = `docs/core/design/ENGINEERING-MODE-V2.md` §2.2（M9）
> 功能规格 = `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-PROMPT-PIPELINE.md`
> 写权 = eng-designer（设计档唯一作者）· 建档 2026-09-17（模块设计轮 · 基础族）
> 状态 = 设计就绪待评审（评审发起权在用户）

## 1. 需求层

### 1.1 总体需求（问题陈述）

v1 提示词有**模板 / 落地双真相**：`docs/core/design/prompts/` 模板与 `thincoder-core/prompts/` 落地档并存，两处都可能被手改，改了不互相同步就漂移。`scripts/mirror-divergence.mjs` 现在只「度量」两产品镜像发散度（对称、只报不拦）。本模块改成**单向生成**：模板 = 权威源、落地档 = 生成物——只能「先改模板 → 再生成落地」，直改落地即被机检红。并随本模块落地一并清理已废的「方案选型对比」纪律残留。**权威源前提经实施前回填才成立**——回填引导见 §2.6。

### 1.2 功能性需求（回指规格 ②功能点）

| # | 功能点 | 规格依据 |
|---|---|---|
| F1 | 单向生成机检（`scripts/mirror-divergence.mjs`）：模板 ≠ 落地 → 红 | ②.1 |
| F2 | 更新流程约束：先改模板 → 再同步生成落地；禁止直改落地 | ②.2 |
| F3 | 落点读声明面：模板 = `docRoot.design` + `/prompts` 推导 · 落地 = manifest 顶层键 `promptsLanding` | ②.3 |
| F4 | 清理「方案选型对比」残留——对象 = 模板（回填后）两处：① `discipline-engineering.md`「方案选型对比」节 ② 回填进模板的 A3⑤「方案对比已做」（若回填包含）；清理后跑生成同步、落地同清 | ②.4 |

### 1.3 非功能需求

| # | 维度 | 标准 |
|---|---|---|
| N1 | 零依赖 | 只用 `node:` 内建（继承 `mirror-divergence.mjs` 现状） |
| N2 | 可迁移 | 模板路径 = `docRoot.design` 推导、落地路径 = manifest `promptsLanding`——不硬编码本仓路径 |
| N3 | 可机判 | 模板 ≠ 落地 → 机检红（sha256 逐字节比对，非散文判据） |

### 1.4 范围边界（本模块不做）

- 不做提示词**内容权**（提示词内容 = 主 agent 内容权 + coder 落笔）——本模块只做「生成流水线 + 一致性机检」，清理项只记录**范围**，落笔归主 agent + coder。
- 不做需求档 / 设计档；不重写 v1 mirror-divergence 机制本体（继承 + 落点微调 + 清理）。
- 不手改 `thincoder-core/prompts/`（落地档 = 生成物，直改即红）。

## 2. 设计层

### 2.1 方案与理由

需求已裁定「单向生成」（架构 §2.2 M9 + 规格 ①）——本模块只做机制收正 + 清理的精确落点。

**核心方案（就机制本身说清为什么）**：

1. **提示词面从「对称镜像度量」收正为「单向生成机检」**：`mirror-divergence.mjs` 的提示词面（`DEFAULT_MIRROR_A/B` `:55-56` + `PROMPT_FACES` `:71-74` + `promptFace` `:288-326`）由「两产品模板对称比对、只报不拦」改为「模板 → 落地单向比对、不等即红」。
   模板 = 模板目录（权威源 = `docRoot.design` + `/prompts` 推导；本仓经 `PROJECT-MANIFEST.json` 覆盖 = `docs/core/design/prompts`），落地 = `thincoder-core/prompts/`（生成物 = manifest 顶层键 `promptsLanding`，本仓覆盖值——M1 schema 扩展，见 §2.2）。比对判据 = 逐字节 sha256——模板改而未生成、或直改落地，两者任一都产生 `≠` ⇒ 红。
2. **「主面」机制本体继承不重写**（规格 ③）：`DEFAULT_A/B` `:52-53` 的两产品 `src/**` 镜像发散度度量（Jaccard / 逐字节 / `seats` 席位判定）是**度量工具**，非本模块门禁对象——继承原样，不删不重写。本模块只在其提示词面上收正方向。
3. **落点读声明面**：模板路径 = `docRoot.design` + `/prompts` 推导（无新键）；落地路径 = manifest 顶层新键 `promptsLanding`（默认 `thincoder-core/prompts`，缺键 fallback 用默认）——不硬编码本仓路径字面（AC-M9 隐含的可迁移要求）。
   **本仓 manifest 覆盖**：本仓已建 `PROJECT-MANIFEST.json` 声明覆盖——`docRoot.design = docs/core/design` · `promptsLanding = thincoder-core/prompts`；默认值不改（`docs/design` 为通用约定）。推导链 = `docRoot.design`（覆盖后 = `docs/core/design`）→ `/prompts` → `docs/core/design/prompts`。
4. **清理「方案选型对比」残留 = 内容权变更**：清理对象 = 模板（回填后）两处——① `discipline-engineering.md`「方案选型对比」节（现 :76-101，as-of：候选 ≥2 @:86/:95 · 对比表 @:87/:94 · 单方案豁免 @:101）② 回填进模板的 A3⑤「方案对比已做」（若回填包含）——该纪律已废（父侧裁定 2026-09-17），提示词内不得再要求「列候选对比」。
   **本模块只记录清理范围与判据**（判据 = 提示词内无「候选 ≥2 / 对比表 / 单方案豁免」要求）；清理后跑生成同步、落地同清。落笔归主 agent 内容权 + coder 落笔（M9 实现轮）。

### 2.2 架构 / 接口 / 数据流契约

```text
改模板（模板目录 = `docRoot.design` + `/prompts` 推导；本仓经 `PROJECT-MANIFEST.json` 覆盖 = `docs/core/design/prompts`）─► 跑生成（node scripts/mirror-divergence.mjs --generate）
  └─ 读 manifest：模板 = docRoot.design/prompts（推导）· 落地 = promptsLanding（默认 thincoder-core/prompts）
       ├─ 逐档 sha256 比对：模板 == 落地 → 绿（生成成功）
       └─ 模板 ≠ 落地 → 红（含：改了模板没生成 · 直改落地绕过模板）
```

**接口（改造自 `mirror-divergence.mjs` 现有导出）**：

- `TEMPLATE_DIR` / `LANDING_DIR`（由 `DEFAULT_MIRROR_A/B` `:55-56` 收正）：`TEMPLATE_DIR` = `docRoot.design` + `/prompts`（推导，无新键）；`LANDING_DIR` = manifest 顶层键 `promptsLanding`（默认 `thincoder-core/prompts`，缺键 fallback 用默认）。
  本仓经 `PROJECT-MANIFEST.json` 覆盖（`docRoot.design = docs/core/design` · `promptsLanding = thincoder-core/prompts`）——默认值不改。
- `PROMPT_FACES`（`:71-74` 收正）：由「prompts + tool-docs 双面」收正为「模板 → 落地单面」。
- `promptFace(rootAbs)`（`:288-326` 收正）：由「双侧读数」改为「单向比对 + 生成」。
- `run(...)`（`:351-370` 收正）：组装参数（模板 = `docRoot.design/prompts` 推导、落地 = `promptsLanding`）。
- `formatReport(res)`（`:375+` 收正）：输出「模板 vs 落地」比对报告（红绿 + 退出码）。

### 2.3 受影响文件全清单（当前行数 + 预计增量）

| 文件 | 当前行数 | 变更类型 | 预计增量 | 编辑点（函数级） |
|---|---|---|---|---|
| `scripts/mirror-divergence.mjs` | 481 | 修改 | ±~60 | `DEFAULT_MIRROR_A/B`（:55-56，镜像默认 → 模板/落地）· `PROMPT_FACES`（:71-74，双面 → 单面）· `promptFace`（:288-326，双侧读数 → 单向比对+生成）· `run`（:351-370，落点读声明面）· `formatReport`（:375+，输出比对报告）；「主面」`DEFAULT_A/B`/`analysis`/`seats` 继承不重写 |
| `docs/core/design/prompts/persona-eng-designer.md` | 65 | 修改 | 回填（量以 diff 为准） | 回填引导 §2.6——逐档 diff 归类，落地领先段以落地为准回填模板（不再列为清理对象） |
| `docs/core/design/prompts/discipline-engineering.md` | 226 | 修改 | +75（回填）− 清理节 | 回填引导 §2.6——落地领先 +75，以落地为准回填模板；清理「方案选型对比」节（现 :76-101，as-of——回填后行号漂移） |
| `docs/core/design/prompts/persona-engineering.md` | 48 | 修改 | +8（回填） | 回填引导 §2.6——落地领先 +8 |
| `docs/core/design/prompts/persona-normal.md` | 23 | 修改 | +5（回填） | 回填引导 §2.6——落地领先 +5 |
| `docs/core/design/prompts/persona-coder.md` | 19 | 修改 | +3（回填） | 回填引导 §2.6——落地领先 +3 |
| `thincoder-core/prompts/**`（落地档） | 生成物 | 重新生成 | 随模板 | 由生成流水线同步（不手改） |

（回填引导 §2.6 触碰全部 15 对模板↔落地；模板领先 4 档——`advisor-design` −29 · `advisor-round1` −29 · `advisor-round2` −15 · `advisor-round3` −16——模板不动、落地待生成覆盖；其余 7 对按逐档 diff 归类。）

（`mirror-divergence.mjs` 481 行近 500 硬上限，收正若越限 ⇒ 拆分报告面到 `scripts/mirror-divergence-report.mjs`——拆分计划见 §2.5。）

### 2.4 关键决策记录

| # | 决策 | 理由 |
|---|---|---|
| KD-M9-1 | 提示词面「对称镜像」→「单向生成」 | 规格 ②.1：模板 = 权威源、落地 = 生成物，方向不可逆——对称度量只报不拦，单向生成不等即红 |
| KD-M9-2 | 「主面」（两产品 src 镜像度量）继承不重写 | 规格 ③「不重写 v1 机制本体」——主面是度量工具非本模块门禁，只收正提示词面 |
| KD-M9-3 | 比对判据 = 逐字节 sha256（不引入语义判据） | N3 可机判：模板 vs 落地逐字节等值，机械判；语义对位归评审 |
| KD-M9-4 | 清理残留 = 内容权变更，本模块只记录范围 | 规格 ③：提示词内容权 = 主 agent + coder 落笔，本模块只做「生成流水线 + 一致性机检」 |
| KD-M9-5 | 落地路径声明 = manifest 顶层键 `promptsLanding`（`docRoot` 平级，非 docRoot 加键） | 落地是代码仓路径、不属于文档体系（docRoot 语义 = 文档四层落点）；模板在文档体系内 → `docRoot.design` + `/prompts` 推导（无新键）；默认值 `thincoder-core/prompts`，缺键 fallback 用默认（M1 ②.4 语义）——schema 扩展回写架构 §2.3 E1 + M1 规格 ②；本仓覆盖经 `PROJECT-MANIFEST.json` 声明（§2.1#3） |

### 2.5 与既有纪律冲突核对

- **`mirror-divergence.mjs` = 工程工具面**：脚本属 `scripts/**`（父侧可直改），但本模块是**判据语义**改动（镜像度量 → 单向生成机检）——按「工程工具面直改三条硬约束」②「改判据语义 ⇒ 仍走设计」，走本设计 + 评审 + eng-coder。
- **拆分计划（R24a）**：481 行近 500 硬上限，收正后若越限，拆 `scripts/mirror-divergence-report.mjs`（报告面 `formatReport` + 输出）——本体保留比对核心（`promptFace` / `run`），报告面单列。
- **落地档 `thincoder-core/prompts/` 不手改**：生成物——直改即被单向机检红；生成流水线由本模块机检驱动，落笔归 coder（M9 实现轮）。
- **M1 schema 扩展（`promptsLanding`）**：本模块落地路径需要新声明键——扩展已随本修正轮回写架构 §2.3 E1（JSON + 键注释 + 校验枚举）、§2.2 M1 行（六键 → 七键）、§2.4 接口表、§3.1 AC3 与 M1 规格 ②/⑤；键名与默认值以架构 §2.3 为权威源。

### 2.6 回填引导步骤（实施前置）

**偏差记录（M9 实施轮勘察发现 · 父侧裁定 2026-09-17）**：§1.1 假设「模板 = 权威源完整」为假——实勘 15 对模板↔落地**全部 DIFF、双向漂移**：落地领先（现行规则住在落地）`discipline-engineering.md` +75 · `persona-engineering.md` +8 · `persona-normal.md` +5 · `persona-coder.md` +3；
模板领先（落地为旧生成物）`advisor-design.md` −29 · `advisor-round1.md` −29 · `advisor-round2.md` −15 · `advisor-round3.md` −16。
直接跑单向生成会覆盖落地、丢弃落地领先的现行规则——**必须先回填**。

**回填步骤（实施前置，先于单向生成实现——AC-M9-1..4 生效前提）**：

1. 逐档 diff：15 对模板↔落地逐字节 diff，归类「落地领先段 / 模板领先段 / 一致段」。
2. 落地领先段 → 以落地为准回填模板（如 discipline-engineering 的零裁量锚 / 推进档位收口 / 设计行为纪律四维 A1–A4 / 交付链收口 / Multi-Task Parallelism / 指令注入段）。
3. 模板领先段 → 以模板为准保留（advisor-* 族——落地为旧生成物，待生成同步覆盖）。
4. 全一致判定：回填后模板 ⊇ 落地且逐字节一致（sha256 15 对全等）——**此后才进入单向生成实现与清理**。

**清理时序（Q3）**：清理对象 = 模板（回填后）两处——① `discipline-engineering.md`「方案选型对比」节（现 :76-101，as-of）② 回填进模板的 A3⑤「方案对比已做」（若回填包含）；清理后跑生成同步、落地同清。

## 3. 测试层

### 3.1 验收标准（逐条回指规格 AC）

| # | 验收标准 | 回指规格 | 可机判 |
|---|---|---|---|
| AC-1 | 模板 ≠ 落地 → 机检红 | AC-M9-1 | ✅ 改模板不同步 → 期望红 |
| AC-2 | 直改落地（不改模板）→ 机检红 | AC-M9-2 | ✅ 改落地 → 期望红 |
| AC-3 | 清理对象 = 模板（回填后）两处清零（「方案选型对比」节 + 回填的 A3⑤）——提示词内无「候选 ≥2 / 对比表 / 单方案豁免」要求；清理后跑生成同步、落地同清 | AC-M9-3 | ✅ grep 无匹配 |
| AC-4 | 生成后模板与落地一致（绿） | AC-M9-4 | ✅ 跑生成 → 期望绿 |

### 3.2 用例表（正常 / 边界 / 错误）

| # | 场景 | 输入 | 预期输出 |
|---|---|---|---|
| T1 | 正常：生成同步 | 改模板 → 跑生成 | 落地档 == 模板，机检绿 |
| T2 | 正常：落点读声明面 | manifest 声明非本仓路径（`docRoot.design` / `promptsLanding`） | 模板/落地从声明面取（不硬编码） |
| T3 | 边界：模板未生成 | 改模板、不跑生成 | 模板 ≠ 落地 → 红 |
| T4 | 边界：残留清零 | 回填后模板 grep「候选 ≥2 / 对比表 / 单方案豁免」 | 无匹配（AC-3） |
| T5 | 错误：直改落地 | 手改 `thincoder-core/prompts/*.md`、不改模板 | 模板 ≠ 落地 → 红（AC-2） |
| T6 | 错误：残留纪律 | 模板（回填后）仍要求「列候选对比」 | grep 命中 → 违规（AC-3） |

## 4. 变更记录

- 2026-09-17（模块设计轮 · 基础族 · eng-designer）：建档——M9 提示词单向生成模块设计；`mirror-divergence.mjs` 提示词面由「对称镜像度量」收正为「单向生成机检」（模板 ≠ 落地 = 红，逐字节 sha256）；落点读 `docRoot`；主面继承不重写；清理「方案选型对比」残留（记录范围，落笔归主 agent + coder）；验收逐条回指 AC-M9-1..4。
- 2026-09-17（修正轮 · 清理与机检族 · eng-designer）：§2.1 去「方案选型对比」纪律残留——豁免声明改为直接陈述方案与理由（纪律已废：需求档 §6.2「不强制列候选对比」）；方案内容不变。
- 2026-09-17（修正轮 · 设计评审发现 #3 · eng-designer）：F3 落点契约指明来源——模板 = `docRoot.design` + `/prompts` 推导；落地 = manifest 顶层新键 `promptsLanding`（默认 `thincoder-core/prompts`）；回写架构 §2.3 E1 / §2.2 M1 行 / §2.4 接口表 / §3.1 AC3 与 M1 规格 ②/⑤；§1.3–§3.2 全链同步收正。
- 2026-09-17（修正轮 · M9 实施阻断三裁定 · eng-designer）：Q1 路径——推导 + 本仓 `PROJECT-MANIFEST.json` 覆盖注记（`docRoot.design = docs/core/design` · `promptsLanding = thincoder-core/prompts`，默认值不改）；Q2 补 §2.6 回填引导（实施前置）——实勘 15 对全 DIFF 双向漂移，「模板 = 权威源完整」假设为假；Q3 清理对象收正 = 模板（回填后）两处，落地由生成同步。
