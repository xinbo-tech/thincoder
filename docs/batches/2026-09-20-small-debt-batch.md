# 2026-09-20 · 小债批（SMALL-DEBT-BATCH）

> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-20 01:57 · 来源 = 用户「**立小债批**」（01:56）+ 父侧 triage 表 2（01:25）。

## §1 讨论（主 agent）

**状态行**：🔄 进行中（设计轮待发）

### 1.1 条目清单（10 条 · 全部来自台账 · **批的边界 = 只收这 10 条**）

| # | 台账 | 条目 | 证据 / 落点 | 面（待设计轮逐条判定） |
|---|---|---|---|---|
| 1 | **#102** | `findstr /c:"<中文>"` 假绿 / 假红 ⇒ 判据行换 node UTF-8 扫描 | 台账 #102（同档实证：`/c:"batch"` 命中 ∥ `/c:"台账"` 零命中） | 规则句（纪律层 / 机检档）+ 存量 AC 行扫描 |
| 2 | **#105** | `doc-check` 基线红分类收正（悬空 6 + 行宽 25/26 · 跨 20+ 档） | 台账 #105（HEAD 即红 · 无 owning 项） | 文档面（分类：改指 / 史实豁免 / 折行） |
| 3 | **#112** | 设计档 §10.2 行 5「common 标题树 10/13」重算收正 | 台账 #112（**口径警示**：不可直接以 `##` 块数代换） | 设计档读数 |
| 4 | **#113** | 「及时提交 + 及时 push」规则落仓内持久面 | 台账 #113（memory 已立 · 文档面待落） | 产品文本面（`AGENTS.md`） |
| 5 | **#95** | 批档骨架 + 派单模板两处对齐（**状态行必居 §1 段内** · 派单六字段标签） | 台账 #95（一晚两次实害） | 批档骨架（`BATCH-RECORD.md`）+ 派单模板面 |
| 6 | **#101** | 核销同步清单槽位枚举三处死指针改指 | 台账 #101（三处均指 `design/BATCH-RECORD.md` §6 而该节实为 VSC 镜像） | 设计档指针（3 处） |
| 7 | **#110** | 两产品 `AGENTS.md` 模块地图同步（`turn-domains.mjs` 等） | 台账 #110（上行通道批上抛） | 产品文本面（2 档） |
| 8 | **#94** | CLI `memory-scan-bounds` T-Y4 探针阈值 / 口径收正 | 台账 #94（flaky · 读数 267/272/265 vs 阈值 300） | 测试档（CLI） |
| 9 | **#72** | `test/run.mjs` 软链目录缺口（三包同款 · 现盘零实例） | 台账 #72（`isDirectory()` 不跟软链） | 三包 test runner（候选：改行为 or 加说明） |
| 10 | **#59** | 死指针四族 **U-1 / U-2**（需求档 5 行 + `docRoot.modules` 指空目录） | 台账 #59（**U-3 / U-4 = 不在本批**） | 需求档（5 行）+ `PROJECT-MANIFEST.json`（语义面） |

### 1.2 边界

- **只收这 10 条**——triage 表 3 的功能候选**不在本批**；
- 逐条**可机检**；**不加机械门**（承 2026-09-18 用户裁定「到处加机械限制是拙劣做法」——机制改动走既有面，必要时只改判据形态）；
- **#59 的 U-3（`_archive` 档本体）/ U-4（产品参照树）= 明确不在本批**（政策 =「保留 ≠ 维护」）；
- 各条**面判定**（产品码 / 文档 / 工程工具）由设计轮逐条给出——**工程工具面（`scripts/**`）实现 = 父侧直改**（不进 eng-coder 派单）。

### 1.3 验收（父侧初稿 · 设计轮细化）

① 逐条「台账 id → 改动 file:line（或裁定不动作 + 理由）」；② 机检净增 0（悬空 / 行宽 / 计数面）；③ 触及测试面 / 提示词面的条目：相关包 `node test/run.mjs` 全绿；④ 文档面条目：双面 / 多档同动（D3）。

### 1.4 台账

10 条 → 本批（待讨论 → **待设计**；任务书指针 = 本档 §2）。

## §2 批次任务与设计（eng-designer）

### 2.0 总览

- **轮次** = initial · **任务书** = 本档 §1（10 条 · 工程工具面 `scripts/**` = 父侧直改）· **设计轮实跑读数**：`doc-check` 悬空 6 · 行宽 25（16 档）· CLI T-Y4 探针 1 红（已复现）。
- **逐条格式**：面判定 / 修法（落点 file:line + 改法）/ 可机检验收（命令全 ASCII——中文串用 `\uXXXX` 转义或断言 ASCII 子串）/ 边界。
- **先读 2.9**：5 处与 §1 / 台账刻画不一致的实测发现（#59 双族实为已消解 / 已裁定 · #105 悬空 6 中 5 处是判据假阳 · #112 口径反推 · #113 落点候选不存在 · #110 不止「新档补登」）。

### 2.1 逐条设计（10 条）

#### 条 1 · #102 `findstr /c:"<中文>"` 假绿/假红 ⇒ 判据行换形

- **面判定**：规则句 = 设计档（机检档）+ 提示词面（纪律层双面）；存量扫描 = 全仓只读盘点。
- **修法**：
  ① 机检档：`docs/core/design/DOC-DISCIPLINE.md` §3（`:68` 节区）末新增边界块「判据行工具形态（中文串）」（逐字稿见 2.3-⑥）；§3 标题括注枚举同步加项（D3）。〔设计档内容笔〕
  ② 纪律层：`docs/core/design/prompts/discipline-engineering.md`（「### 写文档要人类可读」节尾 `:114` 后）+ `thincoder-core/prompts/discipline-engineering.md`（`:118` 区）各追加一条 bullet（逐字稿见 2.3）。零标题变更 ⇒ 零计数连带。
  ③ 存量盘点（本设计轮实跑）：`findstr` + 中文 的全仓命中**全部落在记录面 / 归档**（`docs/batches/**` 12 处 + `thincoder-cli/docs/_archive/**` 1 处）⇒ **现役规范面零对象**，无存量换形项。〔承评审 #3 复核〕宽式模式（原 A6）另命中 1 处**规则面引用**：`docs/core/design/AGENT-LOOP-SUBAGENT.md:1882` 的纪律句（非换形对象；A6 模式收至靶形态「`findstr /c:"` + 中文」后不再命中）。
- **可机检验收**：① `cd thincoder && node -e "const fs=require('fs');const t=fs.readFileSync('thincoder-core/prompts/discipline-engineering.md','utf8');console.log(t.includes('findstr')&&t.includes('UTF-8')?'OK':'MISS')"` ⇒ OK（中文正本同断言）；② 现役面复扫（排除 `docs/batches` / `_archive` / 规则宿主三档 = `discipline-engineering.md` 双副本 + `DOC-DISCIPLINE.md`（规则正文宿主）；模式 = 靶形态「`findstr /c:"` + 中文」）命中 0——命令见 2.5。〔承评审 #3〕
- **边界**：不加机检门；不改 ASCII 串判据形态；不触批档（记录面）与归档；规则正文自身的反例引用 = D8 豁免族 ⓐ（不属存量）。

#### 条 2 · #105 `doc-check` 基线红分类收正

- **面判定**：判据面（`scripts/**` = 父侧直改）+ 文档面机械形态（折行 / 指针——父侧直改，打标）。
- **复现读数（2026-09-20 本设计轮实跑）**：`node scripts/doc-check.mjs --root .` = 悬空 **6** · 行宽 **25** · 拟新增 6 · 迁移期引文 222 · exit 1。
- **悬空 6 分类（逐条实读）**：
  - **5 处同族 = 判据假阳**（`AGENT-LOOP-SUBAGENT.md:417` · `CORE-UNIFICATION.md:515` · `DOC-DISCIPLINE.md:531` · `SESSION.md:246` · `WORKSPACE.md:18`）：文句均为 `@thincoder/core/<subpath>` **包规格形**（import 规格符——运行时解析，语义正确）；`scripts/doc-check-anchors.mjs:44` PATH_RE 的 lookbehind `(?<![A-Za-z0-9_.\-\\/])` 未排除前导 `@` ⇒ token 落成 `thincoder/core/…` 仓内路径 ⇒ 存在性判负。**修法 = 判据面口径**：字符类补 `@`（`(?<![A-Za-z0-9_.\-\\/@])`——**单层转义形态 = 实装串逐字**，只增 `@`；承评审 #8）⇒ `@` 紧邻路径形不入锚；`DOC-DISCIPLINE.md` §4.2.1 实现口径注同句补记 + **判据规格字面（`:662`）同轮对齐**；**落笔前以实装串核对**（`new RegExp` 串编译后 `.source` 与上式逐字一致〔本修正轮已核〕）。**台账 «旧两仓 `thincoder/core/…` 形态族» 刻画不确**（见 2.9-②）。
  - **1 处真歧义**：`docs/vsc/design/SETTINGS.md:388` 的 `test/files.mjs` 缺包前缀（仓内 4 档同名 ⇒ 唯一性判负）⇒ **改指** `thincoder-vscode/test/files.mjs`。
- **行宽 25 行（16 档）⇒ 全数折行（零语义）**：ADVISOR-CONVERGENCE.md:313〔602〕·:328〔332〕·AGENT-LOOP-SUBAGENT.md:1277〔311〕·AGENT-LOOP.md:241〔841〕·:544〔526〕·CONTEXT-COMPACTION.md:164〔899〕·:306〔433〕·DOC-DISCIPLINE.md:504〔356〕·PROMPT-SYSTEM.md:303〔413〕·TOOLS.md:444〔349〕·prompts/persona-engineering.md:141〔507〕·:143〔416〕·requirements/ADVISOR-CONVERGENCE.md:129〔320〕·:224〔382〕·requirements/AGENT-LOOP.md:227〔351〕·:246〔305〕·requirements/CONTEXT-COMPACTION.md:27〔448〕·requirements/ENGINEERING-MODE-V2.md:7〔532〕·:9〔339〕·:12〔315〕·requirements/PROMPT-SYSTEM.md:71〔362〕·:184〔454〕·requirements/TOOLS.md:191〔364〕·docs/vsc/design/SETTINGS.md:388〔351〕·docs/vsc/requirements/WEBVIEW.md:178〔351〕。（design 前缀 = `docs/core/design/`，requirements 前缀 = `docs/core/requirements/`。）注：SETTINGS.md:388 同轮先改指后折行；prompt 档折行 = 纯空白（无内容变更）。
- **可机检验收**：`cd thincoder && node scripts\doc-check.mjs --root .` ⇒ **exit 0**（锚 0 悬空 + 行宽 0）；复跑读数 = 悬空 0 · 行宽 0 · 候选 ≈17317（−5）。
- **边界**：不改判据其余口径；不扫 `_archive` / 参照树（既有政策）；不新增行宽豁免（全数折行）；批档长行不入域（既有）。

#### 条 3 · #112 §10.2 行 5「common 标题树」读数重算收正

- **面判定**：设计档读数面（`docs/core/design/PROMPT-SYSTEM.md:266`）——计数收正 ⇒ 父侧机械例外可直改。
- **口径（反推 + 实算验证）**：「标题树 CN/EN」= 两面档 **ATX 标题节点计数（层级 2–6，行首或行内）**。依据：行 5 自述「EN 将工具观三条升为 3 个 `###` 子节」⇒ `###` 计入且 `13−10=3` 逐数吻合；行内计数必要——英文落地面为机生成单行节形态（实证 `thincoder-core/prompts/advisor-design.md:2`，`##` 嵌在行内）。
- **重算（本设计轮实算）**：CN = **14**（`##`×14）· EN = **17**（`##`×14 + `###`×3）⇒ 差值 3 = EN 工具观三条 `###` ⇒ **结论面「差 / EN 领先」零改**（台账警示「不可直接以 `##` 块数代换」成立：EN 侧 `##` 块 = 14，会得出 14/14 的错误读数）。
- **修法**：`:266` 行 5 单元格 `10/13` → `14/17`；差异性质列追加行级口径注「（2026-09-20 重算〔台账 #112〕；口径 = 标题节点〔层级 2+，含行内〕）」——行级注（不改表级口径句，避免倒逼其余 14 行旧读数）。
- **可机检验收**：`node -e "const fs=require('fs');const c=s=>((fs.readFileSync(s,'utf8').match(/(^|\s)#{2,6} /g)||[]).length);console.log(c('docs/core/design/prompts/common.md')+'/'+c('thincoder-core/prompts/common.md'))"` ⇒ `14/17`；`PROMPT-SYSTEM.md` includes(`14/17`) ⇒ true。
- **边界**：只改行 5；其余 14 行本次不重算（抽查有 ±1 漂移 ⇒ 2.9-③ 登记，不动作）；不改「双语正当差」结论与表头 as-of。

#### 条 4 · #113「及时提交 + 及时 push」落仓内持久面

- **面判定**：产品文本面（`AGENTS.md`）。
- **落点裁定**：§1 / 台账候选「`AGENTS.md`「Common Commands」邻位」**在本仓不存在**——仓根无 `AGENTS.md`；「Common Commands」节仅见于**仓外**工作区档 `D:\teamcode\AGENTS.md`（本仓禁触域）；`docs/core/design/` 无「工程纪律面」专节（提交纪律现居提示词面）。⇒ **裁定 = 两产品 `AGENTS.md` 各增一条同句英文规则**（与各档既有 commit 条目邻位；根档缺位 = 覆盖洞登记 2.9-⑤）。
- **修法**（逐字句）：`**Commit & push promptly**: commit at each batch closeout (path-scoped); push immediately after committing — the remote is the only disaster backup; push before any destructive git operation.` 落点：`thincoder-cli/AGENTS.md:29`（Commit messages 条后）· `thincoder-vscode/AGENTS.md:32`（Discussion → docs 条后）。
- **可机检验收**：两档各 `node -e "const fs=require('fs');console.log(fs.readFileSync('thincoder-cli/AGENTS.md','utf8').includes('the remote is the only disaster backup')?'OK':'MISS')"` ⇒ OK（VSC 档同断言）。
- **边界**：不新建根 `AGENTS.md`（新面——登记报告，不动作）；不改 memory 面（已立）；不触仓外工作区档。

#### 条 5 · #95 批档骨架 + 派单模板对齐

- **面判定**：① 批档骨架 = 设计档（`BATCH-RECORD.md`）；② 派单六字段标签 = 提示词面双面（+ 需求档同步 = 父侧笔）。
- **实核**：批档骨架现**无单一模板处**——`BATCH-RECORD.md` §4.1 只有「标题在档」前提（`:65`）、§4.9 只有解析域（`:143`）；完整骨架仅散见归档 v1 需求档与既有批档实例。派单六字段：设计档 `ENGINEERING-MODE-V2.md:257` 六字段齐 ✓；提示词面 CN `persona-engineering.md:105-112` / EN `:107-113` 为**六条无标签行**；需求档 `requirements/ENGINEERING-MODE-V2.md:429` 仅 5 项（缺「轮次」）。
- **修法**：
  ① `BATCH-RECORD.md` §4（**`:150` 后、`## 5.`（`:152`）之前**）新增小节 **§4.10 批次档骨架（创建方预写）**：骨架块 + 「**状态行必居 §1 段内**」纪律句（逐字稿见 2.3）。〔设计档内容笔〕〔坐标收正 = 父侧直接执行 · 可 revert · 承评审 #1〕
  ② `persona-engineering.md` 双面六条列表改**带标签逐字六行**（CN：`**目标与理由**` / `**轮次**` / `**已知事实**` / `**设计要点与禁止范围**` / `**验收标准**` / `**交付报告格式**`；EN 逐字见 2.3）。零节变更。
  ③ 需求档 `:429` 五项 → 六项（父侧笔；**归桶 2 = 需求档机械**；靶形态 = `（目标/轮次/已知事实/禁止范围/验收/报告格式——缺字段即拒）`；承评审 #6 · 断言 = A15）。
- **可机检验收**：① `BATCH-RECORD.md` includes(`## §1 讨论`) ∧ includes(`## §6`)（骨架块在位）；② 双面标签订位（逐条断言，命令见 2.5）；③ doc-check 零悬空（新节引用全解析）。
- **边界**：不加机械门（无新增校验器）；不改 §4.9 解析判据；不动已冻结批档；不重述需求侧模板（D2——骨架住设计档、需求侧只引用）。

### 2.2 受影响文件表（现量 as-of 2026-09-20 · 源码 / 测试档逐档给数；纯 .md 行按 §3.7 口径不列现量/Δ 两列——格填 `—` · 承评审 #9 收尾）

| # | 档 | 现量 | Δ | 越线 | 面 | 轮次 |
|---|---|---|---|---|---|---|
| 1 | `thincoder-core/test/run.mjs` | 39 | +4 | 远低于 300 | 测试基建 | eng-coder |
| 2 | `thincoder-cli/test/run.mjs` | 41 | +4 | 同上 | 测试基建 | eng-coder |
| 3 | `thincoder-vscode/test/run.mjs` | 60 | +4 | 同上 | 测试基建 | eng-coder |
| 4 | `thincoder-cli/test/memory-scan-bounds.test.mjs` | 370（末行 370） | ±2 | >300 软线（CLI 侧无软线机检；±2 零结构改；**不拆登记 = `docs/core/design/DOC-DISCIPLINE.md` §3.10**〔承评审 #7〕） | 测试 | eng-coder |
| 5 | `scripts/doc-check-anchors.mjs` | 322 | +2 | **超 300 软线（322 > 300）**——工程工具面（无软线机检；+2 零结构改；**不拆登记 = `docs/core/design/DOC-DISCIPLINE.md` §3.10**〔承评审 #7〕） | 工程工具 | 父侧直改 |
| 6 | `PROJECT-MANIFEST.json` | 34 | 0（裁定保留——零 diff 判据 DD-48） | — | 数据 | 零动作 |
| 7 | `docs/core/design/BATCH-RECORD.md` | — | — | 纯 .md | 设计 | 设计小轮 |
| 8 | `docs/core/design/DOC-DISCIPLINE.md` | — | — | 纯 .md | 设计 | 设计小轮（含三处现状收正〔承评审 #4〕）/ 父侧 |
| 9 | `docs/core/design/MEMORY.md` | — | — | 纯 .md | 设计 | 设计小轮 |
| 10 | `docs/core/design/PROMPT-SYSTEM.md` | — | — | 纯 .md | 设计 | 父侧直改 |
| 11 | `docs/core/design/LEDGER.md` · `TESTING.md` | — | — | 纯 .md | 设计 | 父侧直改 |
| 12 | `docs/core/design/prompts/discipline-engineering.md` · `thincoder-core/prompts/discipline-engineering.md` | — | — | 纯 .md | 提示词 | eng-coder |
| 13 | `docs/core/design/prompts/persona-engineering.md` | — | — | 纯 .md | 提示词 | eng-coder |
| 14 | `thincoder-cli/AGENTS.md` · `thincoder-vscode/AGENTS.md` | 70 · 126 | CLI ±25（模块图整块重写 + 双面路径改指 + 提交条）· VSC +3 | 产品文本 | eng-coder |
| 15 | 行宽折行 16 档 + `docs/vsc/design/SETTINGS.md` 改指 | 见 2.1 条 2 | 纯折行 | 纯 .md | 文档 | 父侧直改 |
| 16 | `docs/core/requirements/ENGINEERING-MODE-V2.md`（§8.2 · `:429` 派单强制字段行） | — | — | 纯 .md | 需求 | 父侧直改（需求档机械——归桶 2 · 承评审 #6） |

> **读数存查（父侧 2026-09-20 02:2x 实核 · 供 §5 记账 · 02:5x 收正）**：BATCH-RECORD **304** · DOC-DISCIPLINE **1258** · MEMORY **560** · PROMPT-SYSTEM **336** · LEDGER **199** / TESTING **426** · discipline-engineering **120 / 123**（D6 实测 · **原 §2.2 预测 155/169 作废** · 承桶 1-B 上抛 2）· persona-engineering **159 / 161**（D6）。`.md` 行两列按 `DOC-DISCIPLINE.md` §3.7 口径不列（行保留、格填 `—` · 承评审 #9）；行 14（产品文本）保留 Δ = **实施范围**描述、非行数记账。〔父侧直接执行 · 可 revert〕

> **同轮父侧小改（承桶 1-B 上抛 1 · 父侧直接执行 · 可 revert）**：`thincoder-core/prompts/persona-engineering.md:108` 首标签「`Goal & rationale`」→「**`Goal & why`**」——理由 = 派单门禁 `thincoder-core/agent-tools/spawn-gates.mjs:19` 的 markers 仅收 `/目标与理由/` · `/goal\s*&\s*why/i` · `/goal\s+and\s+why/i` ⇒ 原 EN 字面照写会被机械拒 spawn（CN 面已相容：`docs/core/design/prompts/persona-engineering.md:106` = `目标与理由` ✓）。**方向裁定** = 提示词面就门禁（**非**扩门禁 marker）：门禁严格性 = 既有设计，提示词字面应与之相容。

（`thincoder-core/manifest.mjs` 339 = **零改**——U-2 裁定保留；`thincoder-core/prompts/persona-engineering.md` = 标签化同轮。）

### 2.3 逐字稿（共 6 处 · 落笔即照抄）

**① #102 纪律层 bullet（CN · 追加于「### 写文档要人类可读」节尾）**
- **判据行（AC / 验收命令）里的中文串判据**：一律用 **UTF-8 感知形态**（`node` 逐行扫描 / 内置 grep 工具）——**禁** `findstr /c:"<中文>"`（本机恒「无匹配」⇒ 假红 / 假绿双向失效）；ASCII 串不受影响。

**② #102 纪律层 bullet（EN · append after the "Docs must be human-readable" section）**
- **Chinese strings in AC / verification commands**: always use a **UTF-8-aware form** (a `node` line scan / the built-in grep tool) — **never** `findstr /c:"<中文>"` (it never matches on this machine ⇒ false red / false green); ASCII strings are unaffected.

**③ #95 BATCH-RECORD.md 新增 §4.10 批次档骨架（创建方预写）**
- **判据句**：`batch_segment` 按标题定位追加 ⇒ 骨架由**创建方预写**；标题缺失即 fail-closed（§4.1）。**状态行必居 §1 段内**——解析域 = §1 段内 `**状态行**：` 前缀行至下一 `## §` 标题（§4.9）；只置档头 = 不可解析 ⇒ 拒写。
- **骨架（创建方逐行预写：档头一行 + 六段标题 + §1 段内状态行）**：首行档头 `# <日期> · <主题>（<BATCH-ID>）`；其后依次 —— `## §1 讨论（主 agent）` / `**状态行**：🔄 进行中（…）` / `## §2 批次任务与设计（eng-designer）` / `## §3 设计评审（评审子代理）` / `## §4 用户批准（主 agent）` / `## §5 实施记录（eng-coder）` / `## §6 验证与收口（父代理）`。
- **注**：本设计文本内六段标题行以行内码形态书写（写入 BATCH-RECORD.md 时按逐字形态分行——该档为设计档，不受本档 §2 骨架保护约束）。

**④ #95 派单六标签（EN 逐字；CN 为对应中文标签）**
Every dispatch carries a task book with: **Goal & rationale** / **Round** (initial / fix — fix rounds point-fix only, no full exploration) / **Known facts** (paths you already explored — no re-exploration) / **Design points & forbidden scope** / **Acceptance criteria** (machine-verifiable: commands, thresholds, assertion counts — no vague "do it well") / **Delivery report format**.

**⑤ #94 MEMORY.md §6.10 追加判据句（「墙钟与响应性」段 `:406` 后）**
- **真时探针判据（T-Y4 · 2026-09-20 收正）**：缺省面 maxGap 中位数 ≤ 250 ms（响应性契约）· 对照面（`yieldMs: Infinity`）≥ 缺省 ×2 ∧ ≥ **100 ms**（量级下限——承「≲ 0.1 s 量级」）；×5 为打印读数（夹具上界 3 万行逃生口——批档 `docs/batches/2026-09-18-tui-freeze.md` §2.5 / §2.6）。

**⑥ #102 判据行工具形态（中文串）——`DOC-DISCIPLINE.md` §3 末边界块（逐字稿；落笔 = 设计小轮 · 节号顺延）**
**问题**：本机 `findstr /c:"<中文>"` 恒「无匹配」（同档实证：`/c:"batch"` 命中 ∥ `/c:"台账"` 零命中）⇒ 判据行（AC / 验收命令）的中文串判据**双向失效**（假绿 / 假红）——台账 #102。
**契约（判据句）**：判据行里的中文串判据**一律用 UTF-8 感知形态**（`node` 逐行扫描 / 内置 grep 工具）——**禁** `findstr /c:"<中文>"`；ASCII 串不受影响（不受本边界约束）。
**射程与豁免**：射程 = 判据行（AC / 验收命令——含批档 A 表 / 设计档验收行）；本块自身的反例引用 = D8 豁免族 ⓐ（不属存量）；存量盘点 = 条 1③（现役规范面零对象——A6 复扫口径见 2.5）。
**落笔清单**：本块 = `DOC-DISCIPLINE.md` §3 末顺延节；§3 标题括注枚举同轮加项（D3）；纪律层双面 bullet = 批档 `docs/batches/2026-09-20-small-debt-batch.md` §2.3-①/②。

#### 条 6 · #101 核销同步清单槽位枚举三处死指针改指

- **面判定**：设计档指针 3 处（`LEDGER.md` · `TESTING.md`）——指针形态收正 ⇒ 父侧直改（打标 + 可 revert）。
- **裁定 = 改指实存（否决「补权威节」）**：槽位枚举实存 = `docs/core/design/DOC-DISCIPLINE.md:22`（D7 行）+ `docs/core/design/prompts/discipline-engineering.md:110`（双面）；`BATCH-RECORD.md` §6 = **VSC 端镜像**（`:199` 逐字）无槽位内容 ⇒ 补 §6 模板 = 造第二权威源（违 D2）⇒ 否决。
- **逐处改法（三处）**：
  - `LEDGER.md:6`：兄弟档句「（批次档 §6 模板槽位）」→「（核销同步清单槽位枚举 = `design/DOC-DISCIPLINE.md` D7 行）」。
  - `TESTING.md:103`：「（槽位枚举权威 = `design/BATCH-RECORD.md` §6——v1 需求档已归档）」→「（槽位枚举权威 = `design/DOC-DISCIPLINE.md` D7 行 + 工程纪律档双面 D7 枚举——v1 需求档已归档）」。
  - `TESTING.md:111`：同步面清单「批次档 §6 模板槽位行 + `requirements/ENGINEERING-MODE-V2.md` §13.1 D7 行（eng-designer 修订）」→「`design/DOC-DISCIPLINE.md` D7 行（槽位枚举权威）+ 同前需求档 D7 行（eng-designer 修订）」。
- **可机检验收**：两档 `node -e` 断言：`!includes('BATCH-RECORD.md\u00a76')` ∧ `includes('DOC-DISCIPLINE')`（命令见 2.5）；`doc-check` 零悬空。
- **边界**：不新建 §6 权威节；不动 BATCH-RECORD.md 本体（除条 5 骨架节）；不改 D7 枚举内容。

#### 条 7 · #110 两产品 `AGENTS.md` 模块地图同步

- **面判定**：产品文本面（2 档；`thincoder-core/AGENTS.md` 实核**不存在** = 零对象）。
- **实核 Δ**：
  - **VSC**（`thincoder-vscode/AGENTS.md:40` src/agent 行）：漏 **2 档**——`setup-tooltable.mjs` · `turn-domains.mjs`（上行通道批落点）⇒ 行内补 2 名。
  - **CLI**（`thincoder-cli/AGENTS.md:46-69` 模块图块）：**整块 v1 期残留**——22 项中 **14 项盘上不存在**（`src/agent.mjs`/`src/agent/`/`src/agent-tools/`/`src/advisor*`/`src/git/`/`src/traces/`/`src/prompts/`/`src/provider/`/`src/tools/`/`src/memory/`/`src/context.mjs`/`src/config.mjs`/`src/session-slots.mjs`/`src/session.mjs`/`src/mcp/`/`src/log.mjs`）；实存端壳 = `bin/thincoder.cjs` · `src/tui/` · `src/cli/` · `src/acp.mjs` + `src/acp/` · 散档 7（completions / crash-reports / distill / heap-watch / prompt-injections / tui / upgrade）· `test/`。⇒ **改法 = 整块重写**为端壳面清单（机制本体 = `@thincoder/core`，镜像已删——与 VSC 档 `:37` 同款句），并改指权威指针：`docs/design/ARCHITECTURE.md`（CLI 树已归档 ⇒ 死链）→ 仓根 `docs/core/design/ARCHITECTURE.md` §3（实核 §3 =「模块地图（当前态）」）。
  - **附带同轮项**：`thincoder-cli/AGENTS.md:21` 提示词双面路径已死（`docs/design/prompts/` = 归档 · `src/prompts/` = 不存在）⇒ 改指 `docs/core/design/prompts/`（中文正本）· `thincoder-core/prompts/`（英文落地）——与 VSC 档 `:15` 同款句对齐。
- **可机检验收**：VSC `node -e` includes(`turn-domains.mjs`) ∧ includes(`setup-tooltable.mjs`)；CLI `node -e` `!includes('src/agent-tools/')` ∧ `!includes('docs/design/ARCHITECTURE.md')` ∧ includes(`src/acp`) ∧ includes(`src/tui/`) ∧ includes(`thincoder-core/prompts/`)。
- **边界**：只改模块图块 + 权威指针 + `:21` 双面路径；两档其余疑似陈旧面（`:30` RELEASE.md 指针 · `:34` 测试脚本族——未逐项实核）**登记不动作**（见 2.9-⑥）。

#### 条 8 · #94 CLI `memory-scan-bounds` T-Y4 探针阈值 / 口径收正

- **面判定**：测试档（CLI）。**复现（本设计轮实跑）**：`cd thincoder\thincoder-cli && node --test test/memory-scan-bounds.test.mjs` ⇒ 11 tests / 10 pass / **1 fail**——`对照面 maxGap 中位数 277ms ≥ 300 ms` 红；读数 = 缺省 73ms（逐轮 115,80,67,73,66）· 对照 277（353,276,277,275,307）· 比值 3.79×（打印线自报「设计判据 ≥5× ∧ ≥300 ms：未达标」）。
- **根因**：300 ms = **绝对墙钟**阈值（机器速度敏感）；×5 主判据早已按 `docs/batches/2026-09-18-tui-freeze.md` §2.5 逃生口降为打印读数（实测 3.8–6.1× 不稳）⇒ 绝对项 = 仅存的机器敏感硬断言；该批 §5 明记「若日后要 ×5 硬断言 ⇒ 改夹具规模 / 改判据 = 另批」——**本条即该另批**。
- **修法（阈值收正 · 夹具规模零改）**：`thincoder-cli/test/memory-scan-bounds.test.mjs`
  - `:297` 区新增常量 `const T_Y4_CTRL_MIN_GAP_MS = 100`（量级下限——承 §6.10「≲ 0.1 s 量级」）。
  - `:364` `assert.ok(ctrlMed >= 300, …)` → `assert.ok(ctrlMed >= T_Y4_CTRL_MIN_GAP_MS, \`对照面 maxGap 中位数 ${ctrlMed}ms ≥ ${T_Y4_CTRL_MIN_GAP_MS} ms（量级下限；原 300 为机器敏感绝对值——台账 #94）\`)`。
  - `:362` 打印线「≥300 ms」→「≥100 ms」；`:363`（缺省 ≤250 契约）· `:365`（对照 ≥2×缺省）**保留零改**。
  - **已知敏感项登记（承评审 #13 · 父侧直接执行 · 可 revert）**：`:363` 的 `≤250 ms` 绝对墙钟断言保留为**响应性契约** ⇒ 登记为**已知机器敏感项**（本批不动；若后续再 flake ⇒ 改相对量级 / 容差形态——与 `:365` 相对守卫并存）。
  - 设计面：`docs/core/design/MEMORY.md` §6.10 追加判据句（逐字稿 2.3-⑤）〔设计档内容笔〕。
- **可机检验收**：`cd thincoder\thincoder-cli && node --test test/memory-scan-bounds.test.mjs` ⇒ 11/11 pass · exit 0；打印行含「≥100 ms」。
- **边界**：不改夹具规模（30k 行保持）· 不改 `SCAN_*` 生产常量 · 不改 ×5 打印读数 · 不拆档（该档 370 行 >300 软线；CLI 侧无软线机检；**不拆 + 触发 + 抽取候选线登记 = `docs/core/design/DOC-DISCIPLINE.md` §3.10**——承评审 #7）。

#### 条 9 · #72 三包 `test/run.mjs` 软链目录缺口

- **面判定**：测试基础设施（三档同款：`thincoder-core/test/run.mjs:25` · `thincoder-cli/test/run.mjs:26` · `thincoder-vscode/test/run.mjs:41`）。
- **实核（本设计轮探针）**：三处 `if (e.isDirectory()) walk(p)`——Dirent 语义实证：Windows junction = `isSymbolicLink=true` ∧ `isDirectory=false`（`C:\Users\All Users` 等系统实数）⇒ 现码**静默不遍历**软链目录，其内 `*.test.mjs` 永不被收集 = 收集自检（fail-closed 反向判据）的沉默洞。
- **裁定 = 拒绝制（否决跟进制）**：① 跟进遍历需环检测 + 可把域外树（如 `node_modules`）拉进收集面；② 拒绝制把沉默洞变响铃，与三 runner 既有「无漏收集 ⇒ 反查即失败」fail-closed 精神同构；③ 现盘零实例 ⇒ 零回归。**软链文件不受影响**（保留现行收集路径）。
- **修法（三档同款 · 消息随包）**：walk 内插分支——
  `} else if (e.isSymbolicLink() && statSync(join(root, p), { throwIfNoEntry: false })?.isDirectory()) { fail(\`symlinked directory under test/ — collection cannot verify through it (the single-level glob never descends into it); unlink it or move its tests up: ${p}\`) }`
  （置于 `isDirectory()` 分支之后、`.test.mjs` 名判之前；`node:fs` import 补 `statSync`——core/cli/VSC 三档同）。
- **可机检验收**：① 三包 `node test\run.mjs` 全绿；② 一次性探针（%TEMP% · 零删除动作 · 命令见 2.5）⇒ exit 1 + `symlinked directory`。
- **边界**：不跟进遍历软链；不改收集谓词（单层 / 两层 glob 零改）；不新增测试档（探针 = 一次性验证，读数入 §5）。

#### 条 10 · #59 死指针四族 U-1 / U-2

- **面判定**：U-1 = 需求档（父侧笔）；U-2 = 数据档（语义面）。
- **实核结论：两条均 ⇒ 零动作**：
  - **U-2 = 既有裁定「保留（数据档零改）」**：裁决在册——`docs/core/design/DOC-DISCIPLINE.md:536`（**J-6**：#59·U2 保留 · 三候选逐项裁定：删键否决〔抹通用层键能力 + 跨数据/代码两面〕· 改指 `_archive/modules` 否决〔冻结快照入评审域〕· 保留选定〔层键语义 · 空 = 合法瞬态 · 值形态判据无非空校验 ⇒ 空指零功能影响〕）+ 批档 `docs/batches/2026-09-18-deadname-sweep2.md` §2 **D-J5** + 用例 **DD-48**（`DOC-DISCIPLINE.md:597`：`PROJECT-MANIFEST.json` 零 diff）。本条**零触碰**；建议父侧据 D-J5 重判台账 #59 该族（见 2.9-①）。
  - **U-1 = 现盘零命中**：五坐标现读数——`docs/core/requirements/CORE-UNIFICATION.md:119`（N6 行：`scripts/doc-check-anchors.mjs` / `scripts/doc-check-width.mjs` 均实存 ⇒ 解析闭合）· `docs/core/design/STRUCTURE-DEBT.md:33`（`thincoder-core/agent-tools/async-settle.mjs` 实存）· `:66`（`thincoder-vscode/docs/design/**` 无扩展名 ⇒ 不成锚）· 需求侧 `TWO-REPO-MERGE.md:79`（`scripts/mirror-divergence.mjs`——行已带「迁移期引文」标记 ⇒ 列报 · 不入闸）· `docs/cli/requirements/FEATURES.md:179/180`（现行零命中）。叠加台账 #26 evidence「C 面 211 条全部施打」⇒ **U-1 实质消解**。
- **可机检验收**：`node scripts\doc-check.mjs --root .` ⇒ 零悬空（与条 2 同命令）；`git diff -- PROJECT-MANIFEST.json` ⇒ 空（DD-48 复核）。
- **边界**：U-3（`_archive/modules` 本体）· U-4（参照树）**零触碰**（§1.2 明列不在本批）；不删键 / 不改 `thincoder-core/manifest.mjs` / 不清空目录。

### 2.4 实施分批（三桶）

1. **eng-coder（产品码 / 产品文本 / 提示词落地面）**：条 1 ②（纪律层双面）· 条 4（AGENTS.md ×2）· 条 5 ②（人设档双面标签）· 条 7（AGENTS.md ×2）· 条 8（探针档）· 条 9（三 runner）。**同文件串行**：AGENTS.md 双档（条 4 + 条 7 ⇒ 同轮串行或合一轮）；prompt 双面各自成对（条 1 与条 5 不同档 ⇒ 可并行）；三 runner 不同包 ⇒ 可并行（`files` 各自声明）。
2. **父侧直改（工程工具 + 机械形态 + 需求档机械）**：条 2（`scripts/doc-check-anchors.mjs` 判据口径 + 16 档折行 + `SETTINGS.md:388` 改指）· 条 3（行 5 读数收正）· 条 5③（需求档 `:429` 五项→六项——需求档机械〔承评审 #6〕）· 条 6（三处指针改指）· 条 10（零动作 + 台账面登记）。**三类皆打标**（「父侧直接执行」+ 可 revert）。
3. **eng-designer 小轮（设计档内容笔——D1 唯一作者）**：条 1 ①（`DOC-DISCIPLINE.md` §3 块 + 标题括注）· 条 2 注记面（`DOC-DISCIPLINE.md` §4.2.1 口径注）· 条 5 ①（`BATCH-RECORD.md` §4.10 骨架）· 条 8 设计面（`MEMORY.md` §6.10 判据句）。三档不同文件，一轮可并（条 1① 块逐字稿 = 2.3-⑥ 已备）。

### 2.5 验收命令清单（cmd.exe 可跑 · 全 ASCII · 中文串以 `\uXXXX` 转义）

| # | 条 | 命令 | 断言 |
|---|---|---|---|
| A1 | 2/3/5/6/10 | `cd thincoder && node scripts\doc-check.mjs --root .` | exit 0（悬空 0 · 行宽 0） |
| A2 | 8 | `cd thincoder\thincoder-cli && node --test test/memory-scan-bounds.test.mjs` | 11/11 pass · exit 0 |
| A3 | 9 | `cd thincoder\thincoder-core && node test\run.mjs` / CLI 同 / VSC 同 | 三包全绿 |
| A4 | 9 | `set P=%TEMP%\tc-runner-probe` → `mkdir %P%\pkg\test` → `mkdir %P%\target` → `echo x > %P%\target\probe.test.mjs` → `mklink /J %P%\pkg\test\link %P%\target` → `copy thincoder-core\test\run.mjs %P%\pkg\test\run.mjs` → `node %P%\pkg\test\run.mjs` | exit 1 ∧ 输出含 `symlinked directory` |
| A5 | 1 | `node -e "const fs=require('fs');const a=fs.readFileSync('docs/core/design/prompts/discipline-engineering.md','utf8'),b=fs.readFileSync('thincoder-core/prompts/discipline-engineering.md','utf8');console.log(a.includes('findstr')&&a.includes('UTF-8')&&b.includes('findstr')&&b.includes('UTF-8')?'OK':'MISS')"` | OK |
| A6 | 1 | `node -e "const fs=require('fs'),p=require('path');const skip=new Set(['node_modules','.git','_archive','batches','.thincoder']);const bad=[];const w=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){if(skip.has(e.name))continue;const q=p.join(d,e.name);if(e.isDirectory())w(q);else if(e.name.endsWith('.md')&&!/(discipline-engineering|DOC-DISCIPLINE)\.md$/.test(q)&&/findstr.*\/c:[\u0022].*[\u4e00-\u9fff]/.test(fs.readFileSync(q,'utf8')))bad.push(q)}};w('docs');w('thincoder-core/prompts');console.log(bad.length?bad:'ZERO')"` | `ZERO（改后——规则宿主三档排除 ∧ 靶形态收紧；承评审 #3）` |
| A7 | 3 | `node -e "const fs=require('fs');const c=s=>((fs.readFileSync(s,'utf8').match(/(^|\s)#{2,6} /g)||[]).length);console.log(c('docs/core/design/prompts/common.md')+'/'+c('thincoder-core/prompts/common.md'))"` | `14/17` |
| A8 | 4 | `node -e "const fs=require('fs');const f=x=>fs.readFileSync(x,'utf8').includes('the remote is the only disaster backup');console.log(f('thincoder-cli/AGENTS.md')&&f('thincoder-vscode/AGENTS.md')?'OK':'MISS')"` | OK |
| A9 | 5 | `node -e "const fs=require('fs');const t=fs.readFileSync('docs/core/design/BATCH-RECORD.md','utf8');console.log(t.includes('\u00a71 \u8ba8\u8bba')&&t.includes('\u00a76 \u9a8c\u8bc1\u4e0e\u6536\u53e3')&&t.includes('\u72b6\u6001\u884c')?'OK':'MISS')"` | OK |
| A10 | 5 | `node -e "const fs=require('fs');const cn=fs.readFileSync('docs/core/design/prompts/persona-engineering.md','utf8'),en=fs.readFileSync('thincoder-core/prompts/persona-engineering.md','utf8');console.log(cn.includes('\u8f6e\u6b21')&&cn.includes('\u9a8c\u6536\u6807\u51c6')&&en.includes('Goal & rationale')&&en.includes('Delivery report format')?'OK':'MISS')"` | OK |
| A11 | 6 | `node -e "const fs=require('fs');const l=fs.readFileSync('docs/core/design/LEDGER.md','utf8'),t=fs.readFileSync('docs/core/design/TESTING.md','utf8');console.log((l.includes('\u0060design/DOC-DISCIPLINE.md\u0060 D7')&&t.includes('\u0060design/DOC-DISCIPLINE.md\u0060 D7')&&!l.includes('\u6279\u6b21\u6863 \u00a76 \u6a21\u677f\u69fd\u4f4d')&&!t.includes('\u6279\u6b21\u6863 \u00a76 \u6a21\u677f\u69fd\u4f4d')&&!t.includes('\u0060design/BATCH-RECORD.md\u0060 \u00a76'))?'OK':'MISS')"` | OK（改前实跑 = MISS——旧串在位 ∧ 新串未落；改后 = OK〔承评审 #2〕） |
| A12 | 7 | `node -e "const fs=require('fs');const v=fs.readFileSync('thincoder-vscode/AGENTS.md','utf8'),c=fs.readFileSync('thincoder-cli/AGENTS.md','utf8');console.log((v.includes('turn-domains.mjs')&&v.includes('setup-tooltable.mjs')&&!c.includes('src/agent-tools/')&&!c.includes('docs/design/ARCHITECTURE.md')&&c.includes('src/acp')&&c.includes('src/tui/')&&c.includes('thincoder-core/prompts/'))?'OK':'MISS')"` | OK |
| A13 | 10 | `git diff -- PROJECT-MANIFEST.json` | 空输出（DD-48 复核） |
| A14 | 2 | `node -e "const fs=require('fs');const t=fs.readFileSync('docs/core/design/DOC-DISCIPLINE.md','utf8');console.log((t.includes('\u5df2\u5b9e\u88c5\u3014\u5c0f\u503a\u6279\u3015')&&t.includes('\u73b0\u7ea2\u96c6\uff08\u95f8\u6001\uff09= **0 \u6761**')&&t.includes('\u7acb\u6848 5 \u6761')&&!t.includes('\u7167\u7ea2\u5728\u518c')&&!t.includes('\u73b0\u7ea2\u96c6\uff08\u95f8\u6001\uff09= **5 \u6761**'))?'OK':'MISS')"` | OK（承评审 #4——三处收正 ∧ 旧串零残留；改前 = MISS） |
| A15 | 5③ | `node -e "const fs=require('fs');const t=fs.readFileSync('docs/core/requirements/ENGINEERING-MODE-V2.md','utf8');console.log(t.includes('\u76ee\u6807/\u8f6e\u6b21/\u5df2\u77e5\u4e8b\u5b9e/\u7981\u6b62\u8303\u56f4/\u9a8c\u6536/\u62a5\u544a\u683c\u5f0f')?'OK':'MISS')"` | OK（承评审 #6——需求档六项齐；改前 = MISS） |
| A16 | 2/8 | `node -e "const fs=require('fs');const t=fs.readFileSync('docs/core/design/DOC-DISCIPLINE.md','utf8'),b=fs.readFileSync('docs/batches/2026-09-20-small-debt-batch.md','utf8'),s=b.split('## \u00a73')[0];console.log((t.includes('### 3.10 ')&&t.includes('memory-scan-bounds.test.mjs')&&s.includes('\u8d85 300 \u8f6f\u7ebf')&&!s.includes('\u8d34 300 \u54a8\u8be2\u7ebf'))?'OK':'MISS')"` | OK（承评审 #7——§3.10 登记 ∧ 行 5 措辞收正；改前 = MISS） |
| A17 | 2 | `node -e "const fs=require('fs');const a=fs.readFileSync('docs/core/design/DOC-DISCIPLINE.md','utf8'),b=fs.readFileSync('docs/batches/2026-09-20-small-debt-batch.md','utf8');console.log((a.includes('(?<![A-Za-z0-9_.\\-\\\\/@])')&&b.includes('(?<![A-Za-z0-9_.\\-\\\\/@])')&&!a.includes('(?<![A-Za-z0-9_.\\-\\/])'))?'OK':'MISS')"` | OK（承评审 #8——判据字面 = 单层形态（含 `:662` 对齐）∧ 旧字面零残留；改前 = MISS） |
| A18 | 1/10 | `node -e "const fs=require('fs');const b=fs.readFileSync('docs/batches/2026-09-20-small-debt-batch.md','utf8');console.log((b.includes('\u5171 6 \u5904')&&b.includes('\u843d\u7b14 = \u8bbe\u8ba1\u5c0f\u8f6e'))?'OK':'MISS')"` | OK（承评审 #10——2.3-⑥ 逐字稿在位；改前 = MISS） |
| A19 | 6 | `node -e "const fs=require('fs');const t=fs.readFileSync('docs/core/design/DOC-DISCIPLINE.md','utf8');console.log((t.includes('\u6bcf\u6279\u6279\u6b21\u6863 \u00a76 \u6bb5\u69fd\u4f4d')&&t.includes('VSC \u7aef\u955c\u50cf'))?'OK':'MISS')"` | OK（承评审 #12——D7 短语裁定在位；改前 = MISS） |

### 2.9 不一致处（实测发现 · 逐条带证据）

1. **#59 双族 = 已消解 / 已裁定**（U-2 = J-6 / D-J5 保留裁定在册；U-1 = 现盘零命中 + C 面已施打）⇒ §1 表 10 的预期「修法」实为**零动作**（证据 = 条 10 全列）。
2. **#105 刻画不确**：悬空 6 中 **5 处 = `@thincoder/core/…` 包规格形被路径抽取器假阳**（非「旧两仓形态族」）⇒ 修法主体 = 判据面口径（`scripts/**` = 父侧直改），文档面仅 1 处真歧义改指；§1 的「分类：改指 / 史实豁免 / 折行」三选不覆盖该实况。
3. **#112 读数滞后量**：行 5 旧读数 10/13 比现态少 4 节（§11–§14 位次）；同法抽查其余行（1–4 / 7 / 12）表列值 > 现读数 1 ⇒ **该表整体重算 = 另裁**（本条只收行 5）。
4. **#113 落点候选不存在**：仓根无 `AGENTS.md`；「Common Commands」节仅见仓外工作区档（禁触域）；`thincoder-core/AGENTS.md` 实核不存在 ⇒ 落点裁定 = 两产品 `AGENTS.md`。
5. **根档缺位（覆盖洞）**：本仓无任何「任何代理进入即见」的根级 `AGENTS.md` —— 本批以两产品档承接；「新建根 AGENTS.md」= 新面，登记不动作（建议另裁）。
6. **#110 不止「新档补登」**：CLI 模块图 22 项中 14 项盘上不存在（整块重写）+ `:21` 双面路径死；两档其余疑似陈旧面（`:30` `docs/design/RELEASE.md` 指针 · `:34` 测试脚本族——**未逐项实核**）登记不动作。

### 2.10 修正轮 1 记录（承 §3 评审 · 八条落地 · 2026-09-20 · 坐标为落笔前 as-of——行号随追加浮动）

**轮次** = fix（定点 · 追加制）· **处置执行人** = eng-designer · **范围** = 评审 #2 / #3 / #4 / #6 / #7 / #8 / #10 / #12（父侧已直改 #1 / #5 / #9 / #11 / #13——本轮零触碰）。

| # | 裁定要点 | 改动 file:line | 断言 |
|---|---|---|---|
| #2 | A11 鉴别力：负向子句改「旧指针现状逐字串」（LEDGER = 「批次档 §6 模板槽位」· TESTING = 「`design/BATCH-RECORD.md` §6」）；正向子句 = 新指针全句「`design/DOC-DISCIPLINE.md` D7」；补「改前红 / 改后绿」预期 | 本档 `:215`（A11 全行） | 改前实跑 = MISS · 改后 = OK |
| #3 | A6 排除面 += `DOC-DISCIPLINE.md`（规则正文宿主——规则宿主三档）；模式收至靶形态（`findstr /c:"` + 中文）；条 1 验收② 排除说明同步 | 本档 `:56` · `:57` · `:210`（A6 行） | 靶形态 + 三档排除 = `ZERO`（实跑）；宽式改前 = 命中 `AGENT-LOOP-SUBAGENT.md` |
| #4 | DOC-DISCIPLINE 三处现状收正（`:709` 已实装〔小债批〕 · `:756` 现红集 = 0 · `:758` 到期条件已达成）+ 计数漂移收正（4 / 5 ⇒ 立案 5 条）；2.2 行 8 范围记录（Δ 按 §3.7 口径保持 `—`——记入轮次列） | `docs/core/design/DOC-DISCIPLINE.md:709` / `:756` / `:758`；本档 `:99` · `:110` | A14 = OK（实跑） |
| #6 | 条 5③ 归桶 = 桶 2（需求档机械）+ 靶形态明写；2.2 增行 16 | 本档 `:95` · `:117` 后（行 16）· `:205`（桶 2） | A15（待父侧笔落地后 = OK；现 = MISS） |
| #7 | 尺寸档登记（不拆 + 触发 + 抽取候选线）入 DOC-DISCIPLINE §3.10 + §3 标题括注枚举（D3）；2.2 行 4/5 措辞收正（行 5「贴 300 咨询线」→ 超线）；条 8 边界同步 | `docs/core/design/DOC-DISCIPLINE.md:68` / §3.10；本档 `:106` · `:107` · `:180` | A16 = OK（实跑） |
| #8 | 条 2 判据字面 = 单层转义形态（只增 `@` = 实装串逐字）；`:662` 字面同轮对齐；落笔前以实装串核对（本轮已核 `.source` 逐字） | `docs/core/design/DOC-DISCIPLINE.md:662`；本档 `:65` | A17 = OK（实跑） |
| #10 | §3 边界块逐字稿入 2.3-⑥（落笔 = 设计小轮 · 节号顺延）；2.3 计数 5 → 6；条 1① 指称收正 | 本档 `:54` · `:124` · `:141` 后（⑥） | A18 = OK（实跑） |
| #12 | D7 短语裁定 = 每批批次档 §6 段槽位（非 `design/BATCH-RECORD.md` §6——后者 = VSC 端镜像）；落点 = D7 行亲邻（单一权威源 · D2） | `docs/core/design/DOC-DISCIPLINE.md:22` | A19 = OK（实跑） |

**实测读数（本修正轮）**：`doc-check --root .` = 悬空 6（5 族 + `SETTINGS.md:388`——族归零待 `scripts/**` 落地）· 行宽 25 · 拟新增 6 · 迁移期引文 222——修正前后同值（本轮零净增）；A6 宽式改前 = 命中 1 处规则面引用；A11 改前 = MISS。

**不一致处（本修正轮发现 · 逐条）**：
1. 条 1③「命中全部落在记录面 / 归档」不完整——宽式另命中 `AGENT-LOOP-SUBAGENT.md:1882`（规则面引用；已随 #3 对齐，非换形对象）。
2. #4 所述「2.2 行 8 的 Δ」与父侧 #9 直改（`.md` 两列 = `—`）相抵 ⇒ 按 §3.7 口径保持 `—`、范围记入行 8 轮次列（见 #4 行）。
3. 2.2 表头原「纯 .md 依评审口径豁免仅列 Δ」与 #9 已改形态相抵 ⇒ 同轮对齐（承评审 #9 收尾）。
4. `§4.2.7 :757`（全局读数）= as-of 2026-09-18 出处注 ⇒ 按 D8 两分判据照留零改（不在 #4 三处之列）。
5. #8 核对结果：实装串（`.source` 逐字）= `(?<![A-Za-z0-9_.\-\\/])`（含字面反斜杠元素）⇒ `:662` 旧字面（`\-\/`）为漂移侧、§2 原引文与实装一致；对齐方向 = 实装 + `@`（`docs/batches/2026-09-18-machine-check-face.md:396` 的登记项随之闭合）。
6. A16 命令范围注：负向子句按「§2 段内」（`split('## §3')[0]`）判——全档判会命中 §3 评审表自身引文（回写禁令面，零触碰）。

### 2.11 桶 3 记录（设计小轮 · 四项设计档内容笔 · 2026-09-20 · eng-designer）

**轮次** = initial（定点 · 四项）· **处置执行人** = eng-designer（D1 唯一作者）· **依据** = 本档 §2.3 逐字稿（①/③/⑤/⑥）+ §2.4 桶 3 + 父侧派单（明示 §4 已批准 · 逐字稿齐备）· **落笔制** = 追加制（不改既有段）。

| # | 条 | 落点 file:line（落笔后 as-of 本轮） | 形式 |
|---|---|---|---|
| 1 | 条 1①（#102） | `docs/core/design/DOC-DISCIPLINE.md:68`（§3 标题括注枚举加项〔D3〕）· `:623`–`:631`（新增 §3.11 判据行工具形态（中文串）＝ 2.3-⑥ 逐字） | 追加 |
| 2 | 条 2 注记面（#105） | `docs/core/design/DOC-DISCIPLINE.md:666`–`:667`（§4.2.1 左界守卫 `@` 排除实现口径注 · 与 `:680` 判据规格围栏行字面一致） | 追加 |
| 3 | 条 5①（#95） | `docs/core/design/BATCH-RECORD.md:152`–`:167`（新增 §4.10 批次档骨架（创建方预写）＝ 2.3-③ 逐字 · 骨架块 + 状态行必居 §1 段内纪律句） | 追加 |
| 4 | 条 8 设计面（#94） | `docs/core/design/MEMORY.md:407`（§6.10 真时探针判据句 T-Y4 ＝ 2.3-⑤ 逐字） | 追加 |

**机检读数（落笔前 → 落笔后 · `node scripts/doc-check.mjs --root .`）**：悬空 **6 → 6** · 行宽 **25 → 25** · 拟新增 **6 → 6** · 迁移期引文 **222 → 222** · 候选 17329 → 17337（新增行内的文档 token）· 符号·窄 悬空 0 → 0 ⇒ **净增 0**（`exit 1` = 存量红，属条 2 / 条 10 面）。档行数：DOC-DISCIPLINE **1281** · BATCH-RECORD **321** · MEMORY **561**。

**逐字稿落笔差异（两处 · 均属「落笔指令不落内容面」）**：
1. 2.3-③ 的「**注**」（六段标题以行内码形态书写 …）**未落**——该句自述逐字稿自身版式，落笔后即为假（不属 §4.10 内容）；六段标题按该注要求以**逐字形态分行**落（fenced `text` 块内逐行照抄）。
2. 2.3-⑥ 的「**落笔清单**」**逐字落**（含纪律层双面 bullet 的 cross-ref）；其中「本块 = 本节 §3 末顺延节」「§3 标题括注枚举同轮加项」两句为落笔指令执行后的自述——若父侧判为过程残迹，删除即一行改动。

**不一致处（本席所见 · 逐条带证据；两条均不在本席写域 ⇒ 只报不动）**：
1. `docs/core/design/DOC-DISCIPLINE.md:720` / `:767` / `:769`（**修正轮已落 · 禁改范围**）记「左界守卫 `@` **已实装〔小债批〕**」「现红集（闸态）= **0 条**」「到期条件 **已达成**」——与实装现态不符：`scripts/doc-check-anchors.mjs:44` 的字符类现为 `(?<![A-Za-z0-9_.\-\\/])`（**无** `@`），本轮机检 5 处 `thincoder/core/…` 族照红（`:531` · `CORE-UNIFICATION.md:515` · `AGENT-LOOP-SUBAGENT.md:417` · `SESSION.md:246` · `WORKSPACE.md:18`）⇒ 该族归零待桶 2（`scripts/**` 父侧直改）落地；三处收正在禁改范围内 ⇒ 仅登记，请父侧在桶 2 落地时就地收正（或落地后判定为自洽）。
2. `docs/core/design/BATCH-RECORD.md:150`（§4.9 边界句）「不做批次档模板定义（**模板住需求档**）」与新 §4.10（**骨架住设计档**，需求侧只引用 —— §2.1 条 5 边界句）措辞相抵 ⇒ 需父侧裁定：收正 `:150` 该括注（本席写域 = §4.10 新增，不含改既有行）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

评审面 = 小债批 §1–§2 全段（`:1`–`:233`）+ `DOC-DISCIPLINE.md`（#102 规则句落点 / #105 判据面修法 / #101 三指针）+ `BATCH-RECORD.md`（#95 §4.10 骨架节），按评审声明逐项核对；`scripts/**`、`prompts/**`、两产品 `AGENTS.md`、测试档 = 域外（其内容引用凡未在评审面核实者，随行标 unverified）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Clarity | 🟡 | 条 5① 落点自相抵：批档 `:93` 写「`BATCH-RECORD.md` §4（`:197` 后）新增小节 §4.10」，但 `BATCH-RECORD.md:150` 才是 §4.9 末行、`:152` = `## 5.`、`:197` = §5.2 末行——按 `:197` 落笔新节落在 §5.2 之后，编号不可能是 §4.10 | 修正插入坐标（§4.9 之后、`## 5.` 之前），或使小节号与落点一致 |
| 2 | Acceptance | 🟡 | A11（`:213`）负向断言 `!includes('BATCH-RECORD.md§6')` 打不中自身引文形态：`TESTING.md:103` 引文（`:146`）为「…\`design/BATCH-RECORD.md\` §6…」（反引号 + 空格）、`LEDGER.md:6` 引文（`:145`）连 `BATCH-RECORD.md` 都不含 ⇒ 删改前该子句已为真、零鉴别力；鉴别力全押在 `includes('DOC-DISCIPLINE')` 正向子句（其现状未给） | 负向子句改为针对两档实际现状串（含反引号 / 空格形态），或直接断言改后新指针全句在位 |
| 3 | Acceptance | 🟡 | A6（`:208`）扫描域含 `docs/core/design/DOC-DISCIPLINE.md`——排除面只有「规则宿主两档」= 两个 `discipline-engineering.md`（`:57`）；而条 1①（`:54`）要把同型反例 `findstr /c:"<中文>"`（逐字稿 `:124`）写进该档 §3 块 ⇒ A6 会打印该路径、`ZERO` 断言自红（D8 豁免族 ⓐ 属规则面豁免，A6 命令无此机制） | 把 DOC-DISCIPLINE.md 纳入 A6 排除 / 域外声明，或约束该块措辞（转义 / 断行），并同步 `:57` 的排除说明 |
| 4 | Requirements / Methodology | 🟡 | 条 2 实装即令 DOC-DISCIPLINE.md 三处现状陈述失效：§4.2.4 行 11 `:709`「现态 = 4 行照红在册」· §4.2.7 `:756`「现红集（闸态）= 5 条」· `:758`「到期条件 = 判据面轮实装左界守卫 `@` 排除」；条 2 修法、2.2 行 8（`:110`，Δ 只列「§3 块 + 标题括注 + §4.2.1 注」）与 A 列均不覆盖（承 D8 失效表达必删 / D6/D7）；另 `:756`「5 条」与 `:758`「4 条」为旧有计数漂移 | 三处收正（标已实装 / 回 0）纳入同轮写域与 2.2 行 8 的 Δ，各配一条可机检断言；顺带收正 4/5 计数 |
| 5 | Clarity | 🟡 | §2.9 交叉指称三处错位（条目以 1–6 编号、引用以 ①–⑥ 对应）：条 2 `:65`「见 2.9-③」应为 ②（#105 在 `:220`）；条 3 `:78`「⇒ 2.9-④」应为 ③（#112 在 `:221`）；条 4 `:83`「覆盖洞登记 2.9-⑥」应为 ⑤（根档缺位在 `:223`）。同型：2.4 桶 3（`:197`）把条 2 的 §4.2.1 注记入条 1①（条 1① 见 `:54`，无该注） | 逐处改为 ②/③/⑤；桶 3 括注归条 2 名下 |
| 6 | Scope | 🟡 | 条 5③（`:95`：需求档 `requirements/ENGINEERING-MODE-V2.md:429` 五项→六项）未出现在任何桶的条枚举（2.4 `:195`–`:197`）、未列 2.2 受影响文件行、无 A 项覆盖 ⇒ 该子项可静默漏做 / 漏验（协调项，非缺陷） | 明确归桶（桶 2「需求档机械」或桶 3）、2.2 增行、补一条 A 断言 |
| 7 | Structure debt | 🟡 | 越 300 软线的两个代码档只有「Δ 小 / 既有登记残留」式理由，无「不拆 + 触发 + 拆分计划」登记：`scripts/doc-check-anchors.mjs` 322（2.2 行 5 `:107`，写作「贴 300 咨询线」——现量实为超线）· `thincoder-cli/test/memory-scan-bounds.test.mjs` 370（行 4 `:106`）——对照本仓先例（`DOC-DISCIPLINE.md:577` 尺寸档逐档「理由 + 触发 + 抽取候选线」） | 按 §3.9 尺寸档先例补触发条件与抽取候选线，或注明既有登记出处与到期条件 |
| 8 | Clarity | 🟡 | 条 2 判据字面与在册判据规格不一致且超出所述意图：`:65` 引文与提案均写作 `(?<![A-Za-z0-9_.\-\\/@])`（`\\` = 字面反斜杠），而 `DOC-DISCIPLINE.md:662`（§4.2.1 判据规格）为单层 `\/`；按提案字面落地 = 字符类新增「字面反斜杠」+ `@`，表述却只说「补 `@`」——本仓有双转义实害先例（`:643`，实测 35 条截断伪影） | 明确单层转义形态（只增 `@`）、同步 `:662` 字面；落笔前以实装串核对 |
| 9 | Methodology | 🟡 | 2.2 表 .md 行给出现量 + Δ 两列（`:109`–`:116`：304/+≈16 · 1258/+≈6 等），与 §3.7「批次档同口径」（`DOC-DISCIPLINE.md:215`：新落笔批次档「文档档（`.md`）不列该两列」；`:211` 形态 = 两列填 `—`）及本表表头自述（`:99`「纯 .md …仅列 Δ」）相抵 | .md 行两列改 `—`（行保留），读数移入正文 / §5 记账 |
| 10 | Clarity | 🔵 | 条 1①（`:54`）标注「逐字稿见 2.3」，但 2.3（`:121`–`:138`）五稿 = ①/② 纪律层 bullet · ③ §4.10 · ④ 派单标签 · ⑤ MEMORY——无「§3 边界块」文本；该块亦无 A 项断言 | 补该块逐字稿，或改指 2.3-①并注明复用 |
| 11 | Acceptance | 🔵 | A1（`:203`）与条 2 复现读数（`:63`）用 `node scripts/doc-check.mjs --root .`；该调用形态在本评审面零出现——在册形态 = 裸调用 / `--domain .`（`DOC-DISCIPLINE.md:1087` / `:1098`）；`scripts/**` 域外，`--root` 是否被接受 unverified | 与在册形态对齐，或注明 `--root` 语义与实装支持 |
| 12 | Document ownership | 🔵 | 条 6（`:143`）称「三处均指 `design/BATCH-RECORD.md` §6」，但自身引文（`:145`）LEDGER.md:6 =「（批次档 §6 模板槽位）」不含档名；且新指定的权威 D7 行自身保留同型短语（`DOC-DISCIPLINE.md:22`），其指称对象未裁定（LEDGER / TESTING 原文域外，unverified） | 补一句语义裁定（该短语指每批 §6 槽位、非 `design/BATCH-RECORD.md` §6），免新权威行自带悬疑 |
| 13 | Test fragility | 🔵 | 保留的缺省面 `≤250 ms` 绝对墙钟断言（`:168`「`:363` 保留零改」）仍有机器敏感性——本批已判「300 ms 绝对值机器敏感」，同类项未一并登记 | 登记为已知敏感项（或以相对量级 / 容忍度补注），不阻断本批 |

计数：🔴 0 · 🟡 9 · 🔵 4 = 13 条。无 🔴 ⇒ 未发现阻断项。

VERDICT: pass

## §4 用户批准（主 agent）

**2026-09-20 02:35 父侧代签**——依据用户 01:04 授权「**你自动跑到排空吧**」（同 2026-09-18 先例：评审点火权 + §4 批准权委托父侧，自缚三条件）。

**三条件核验**：① 评审 **pass（0 🔴）**（id=2 · 🔴0 / 🟡9 / 🔵4 · §3 在册）；② **修正轮（id=3）八条全落**（#2 A11 鉴别力 · #3 A6 排除面 · #4 三处现状收正 · #6 条 5③ 归桶 · #7 软线登记 §3.10 · #8 判据字面 · #10 §3 块逐字稿〔2.3-⑥〕· #12 D7 短语裁定）——父侧实核 `DOC-DISCIPLINE.md:22` / `:673` / `:720` / `:767` / `:769` ✓；③ **token 已签发**（值不落档——运行时凭证）。

**裁定表（13 条）**

| # | Action | Detail |
|---|---|---|
| 1 | Fixed | 批档 `:93` 条 5① 坐标 →「`:150` 后、`## 5.`（`:152`）之前」（父侧直接执行） |
| 2 | Fixed | 批档 `:222` A11 全行重写（负向 = 旧指针现状逐字串；正向 = 新指针全句） |
| 3 | Fixed | 批档 `:217` A6 排除面 += `DOC-DISCIPLINE.md` + 模式收至靶形态；`:56`/`:57` 同步 |
| 4 | Fixed | `DOC-DISCIPLINE.md:720`（已实装）/`:767`（现红集 0——旧坐标按 D8 删）/`:769`（族登记）；批档 `:99`/`:110` 同步 + A14 |
| 5 | Fixed | 批档 `:65`（2.9-②）/`:78`（2.9-③）/`:83`（2.9-⑤）/`:197`（桶 3 括注归条 2）（父侧直接执行） |
| 6 | Fixed | 批档 `:95` 归桶 2 + `:118` 2.2 行 16 + `:205` 桶 2 枚举 + A15 |
| 7 | Fixed | `DOC-DISCIPLINE.md:612`–`:621` 新增 §3.10（两档不拆 + 触发 + 抽取候选线）+ `:68` 标题括注（D3）；批档 `:106`/`:107` 越线列收正 + A16 |
| 8 | Fixed | `DOC-DISCIPLINE.md:673` 判据字面 → 实装串逐字 + `@`；批档 `:65` 同步 + A17。**前提反证**（设计席实核）：实装串含字面反斜杠 ⇒ 漂移侧 = `:662` 旧字面，对齐方向 = 实装 ✓ |
| 9 | Fixed | 批档 `:109`–`:115` .md 行两列 → `—` + `:119` 读数存查注（父侧直接执行） |
| 10 | Fixed | 批档 `:54` 指称 → 2.3-⑥ · `:124` 计数 5→6 · `:143` 起新增 ⑥ 逐字稿 + A18 |
| 11 | **Not an issue** | 证据 = `scripts/doc-check.mjs:10`（用法行含 `[--root <仓根>]`）/`:43`（`argOf("--root") ?? cwd`）⇒ 设计原样正确（评审受「`scripts/**` 域外」所限） |
| 12 | Fixed | `DOC-DISCIPLINE.md:22` D7 行亲邻裁定（「批次档 §6 槽位」= **每批 §6 段执行位**，非 `BATCH-RECORD.md` §6 = VSC 端镜像）+ A19 |
| 13 | Fixed | 批档 `:178` 补「已知敏感项登记」（`:363` `≤250 ms` 保留为响应性契约）（父侧直接执行） |

**批准范围**：① **设计定稿**（批档 §1–§2 全段含 §2.9/§2.10/§2.11 + `DOC-DISCIPLINE.md` 本轮修正面）；② **三分桶实施**（eng-coder ×3 轮〔id=4/5/6 在飞〕∥ 父侧直改桶 ∥ 设计席小轮〔id=7 在飞〕）；③ **特别授权**：`scripts/doc-check-anchors.mjs` 判据口径（左界守卫补 `@`——工程工具面 = 父侧直改）· 三包 runner 软链 fail-closed 改造 · 16 档折行（**纯空白形态** · 零语义）。

**收口预告**：三分桶落定 → 逐条核 A1–A19 → 收口（§6）+ 核销 10 条 + **提交 + push**。

## §5 实施记录（eng-coder）

### 5.0 状态行
**桶 1-B 完成（条 1② · 条 5② 双面落地）· 终态 = `clean`** · 编制 = eng-coder · 2026-09-20 02:5x · 任务书 = 本档 §2 条 1②（`:55` + 逐字稿 2.3-①/②）+ 条 5②（`:94` + 逐字稿 2.3-④）。

### 5.1 改动清单（file → 落点 → Δ）

| # | 档 | 落点 | Δ | 逐字源 |
|---|---|---|---|---|
| 1 | `docs/core/design/prompts/discipline-engineering.md` | `:115`（「### 写文档要人类可读」节尾 `:114` 后） | +1 行（新 bullet，135 字符） | §2.3-① |
| 2 | `thincoder-core/prompts/discipline-engineering.md` | `:118`（「### Docs must be human-readable」节尾 `:117` 后） | +1 行（新 bullet，256 字符） | §2.3-② |
| 3 | `docs/core/design/prompts/persona-engineering.md` | `:106-111`（六条就地加标签） | 6 行 → 6 行（行数零净增：159 → 159） | §2.1 条 5 标签表（CN） |
| 4 | `thincoder-core/prompts/persona-engineering.md` | `:108-113`（六条就地加标签） | 6 行 → 6 行（行数零净增：161 → 161） | §2.3-④（EN 逐字） |

- **零标题变更**：四处 diff 无任何标题行增删（`git diff -- docs/core/design/prompts` / `-- thincoder-core/prompts` 实读）⇒ 标题树计数零连带（条 1② 承 `:55`「零计数连带」）。
- **零越线行**：两新行 135 / 256 字符 < 300（`doc-check` 行宽口径 = UTF-16 长度——`scripts/doc-check-width.mjs:62` 实读）。
- **双面同轮同改** ✓；仓内同名副本仅存于两条 `_archive` 冻结树（各 188 行）——零遗漏的第三现役面。

### 5.2 决策透明表

| # | 决策 | 依据 / 证据 | 影响 |
|---|---|---|---|
| 1 | 新 bullet **紧邻节尾、不插空行** | 与本档同族样式一致（`persona-engineering.md:22`→`:23` 等同款：段落行后直接接 bullet）；设计表述 = 「节尾 `:114` 后」 | Δ 最小（+1 行）；markdown 列表仍可中断段落渲染 |
| 2 | CN 六标签**按 §2.1 条 5 标签表**落，含第 1 字段名对齐 `目标与为什么` → `目标与理由` | 任务书明列 CN 标签；`git diff` 改前逐字 = `  目标与为什么` | CN 字段名自此与门禁 `/目标与理由/` 兼容（改前不兼容）——属改进 |
| 3 | EN 第 1 字段名照 §2.3-④ 逐字落 `**Goal & rationale**`（**不**改回改前的 `goal & why`） | 任务书「逐字，勿改字面」；`git diff` 改前 = `  goal & why` | **发现跨档冲突**：该 EN 形不被强制执行门禁接受（见 5.4-1）⇒ 按纪律**不自行改字面**，照设计落地 + 上抛 |
| 4 | 六行**注释文本零改**（`（初始 / 修复……）` / `(paths you already explored — no re-exploration)` 等逐字保留），仅加标签 + 首字母大写 | `git diff` 逐行比对：除标签与 `**` 外与改前逐字相同 | 「只加标签」语义成立；无夹带新语义 |
| 5 | 未触任何禁止面（`DOC-DISCIPLINE.md` · `BATCH-RECORD.md` · 需求档 · `scripts/**` · 机制/工具行为 · 他批写域 · 新增节） | `git diff` 面 = 四档；零标题增删 | 桶 3 / 父侧写域零冲突 |

### 5.3 验收读数（逐条实跑 · 全 ASCII 判据）

| 条 | 判据 | 读数 |
|---|---|---|
| 条 1② | 两档新 bullet **逐行等值** §2.3-① / ②（`node` 字符串等值比对，非子串） | `OK`（两行皆等值；A5 的 `includes('findstr') ∧ includes('UTF-8')` 双面亦 `OK`） |
| 条 5② | 12 条标签断言（CN 6 + EN 6 逐条 `includes`） | `12/12 OK` |
| 条 5② | CN/EN 六行块**逐行等值** 目标文本 | `12/12 OK`（CN `:106-111` · EN `:108-113`） |
| 条 5② | 零节变更（标题集合前后一致） | `OK`（diff 面零标题行；CN persona 15 个 `##` / EN 16 个 `##` 改前后同） |
| 条 1② · 条 5② | `node scripts/doc-check.mjs --root .` 净增 0 | 改前 = 候选 17329 · 悬空 6 · 注记豁免 43 · 拟新增 6 · 迁移期引文 222 · 行宽 25（16 档）；**改后同值**（含 `prompts/persona-engineering.md:141〔507〕` / `:143〔416〕` 原样——属条 2 折行面） ⇒ **净增 0** |
| 相关测试面（提示词档为三包装配输入） | 三包 `node test/run.mjs` | core **401/401 pass** · cli **718/718 pass** · vscode **734/734 pass**（三处 `fail 0`，链式 exit 0） |
| 回读核验（D6） | 四档落盘后逐行回读 + 行数复核 | `OK`（CN discipline 120 行 / EN 123 行 / persona 159 / 161——persona 净增 0） |
| 中文串判据纪律（台账 #102 本体） | 本条全部判据用 `node` 等值/`includes`，**零** `findstr /c:"<中文>"` | `OK`（自证：本条即该坑来源） |

### 5.4 上抛项（父侧裁定 · 均不阻断本桶收敛）

1. **🟡 EN 字段名 ↔ 强制执行门禁不兼容（设计面偏差 · 非实现偏差）**：新 EN 标签 `thincoder-core/prompts/persona-engineering.md:108` = `  **Goal & rationale**`；而门禁 `thincoder-core/agent-tools/spawn-gates.mjs:19` = `{ label: "目标与理由 (goal & why)", markers: [/目标与理由/, /goal\s*&\s*why/i, /goal\s+and\s+why/i] }`，错误文案 `:64` 同 gloss `目标与理由 (goal & why)` —— **改前的 `goal & why` 命中、改后的 `Goal & rationale` 三条 marker 全不命中**（本席实读该档核验）。后果：英文面派单照提示词字面写任务书 ⇒ `validateTaskBookFields` 机械拒 spawn（消息自解释、可恢复）。**本席按任务书「逐字」纪律照 §2.3-④ 落地，未改字面**（改字面 = 偏离已批准设计）。候选处置：① 门禁 marker 补 `/goal\s*&\s*rationale/i` + 同步 `:64` 文案（`scripts/**` 之外 = 产品码面，需另走实现轮）；② EN 标签退回 `goal & why`（需设计席改 §2.3-④）。**建议**：§2.1 条 5 的「实核」（`:91`）未把执行门禁（`spawn-gates.mjs:19`）列为字段名第三权威面——补上后此冲突可提前识别。
2. **🔵 §2.2 读数存查 `discipline-engineering **155 / 169**` 与活档不符**（`:120`）：活档实测 = **120 / 123** 内容行（末内容行分别 = `:120`「（并行委派的 token 隔离……）」/ `:123`「(Parallel-delegation token isolation……)」），且批档自身坐标（条 1② 落点 `:114` / `:118` 区）只在 120/123 行档上成立；两 `_archive` 冻结副本实为 188 / 188，亦非 155/169 ⇒ 该对读数**来源无对应活档**（偏差 +35 / +46）。落 §5 记账已按实测值记（本表）。建议父侧重取该两档行数并标注取数来源。
3. **🔵 第 1 字段名改名未在批档留痕**（可追溯性）：条 5② 描述为「六条列表改带标签」（纯加标签），落地同时含第 1 字段名对齐（CN `目标与为什么`→`目标与理由`；EN `goal & why`→`Goal & rationale`；`git diff` 改前逐字为证）。**本席已在本 §5 记录该改名**（见 5.2-2 / 5.2-3），无需另改他档。
4. **🔵 逐字稿 ④ 形态与落地形态不一致**（批档层）：§2.3-④（`:138`）为单行「 / 」连写形，而条 5②（`:94`）要求「带标签逐字**六行**」⇒ 落地取六行（遵条 5②）；「落笔即照抄」在本子项上无法按字面全等通过（形式差，非内容差）。建议在 `:138` 加同类注记（同 2.3-③ 款）或改排六行。
5. **🔵 A10 判据鉴别力不足**（批档层 · 父侧写域）：`:222` 的 CN 两子句改前**已真**——`轮次` 见 `docs/core/design/prompts/persona-engineering.md:48/:54/:56/:68/:86`（既有行），`验收标准` = 改前该列表的裸行本身（`git diff` 删行逐字）⇒ CN 半边对「本次是否有改动」零鉴别力；EN 两串则有鉴别力（改前为 `goal & why` / `delivery-report format.`）。另四条全为子串在场判据 ⇒ 不能区分「六行」与压成一行。本桶另有逐行等值断言兜底（5.3），不阻断；若要机检钉住形态，可加逐行锚定判据（如 `/^\s+\*\*目标与理由\*\*/m`）。
6. **范围外注记（仅报不动）**：① `docs/core/design/prompts/discipline-normal.md:149-155` = 普通模式派单清单仍五条无标签（`目标与为什么` 原文、无「轮次」）——同机制另一面未随 #95 对齐，且不在本桶对象；② `docs/core/design/DOC-DISCIPLINE.md` §3.11（`~:623-631`）与双面 bullet 近乎同文重述（D2 面观察 · 桶 3 域）；③ `.thincoder/tmp/enge-160/*.before.md` 快照为 2026-09-19 15:32，晚于/早于活档 mtime 不一，若作「改前基线」须慎（本席的改前断言已改用 `git diff` 删行逐字为准）。

### 5.5 审计与评审轮次（终态）

| 轮次 | 形式 | 结果 | 终态 |
|---|---|---|---|
| 1 | 内审（`subagent` explore 只读偏差审计：设计稿 ↔ 实况四类偏差） | 四类（未完全实现 / 静默简化 / 逐字失真 / 清单外改动）**零发现**；其两项「未核实」（doc-check 净增、git 面三项）已由本席实跑闭合（见 5.3） | 收敛 |
| 2 | 内部 advisor 代码评审（`advisor type='code'` · 对象 = 四档） | **VERDICT = pass** · 0 🔴 / 1 🟡 / 4 🔵（🟡 = 5.4-1 跨档滞后 → 上抛；🔵 = 记录层 / 批档层） | **clean** |
| — | fix round | **0 轮**——对象内无待修缺陷（评审未产生对象内必改项；🔵-3 由本 §5 记录闭合；🟡 属设计↔门禁对齐，非实现可自决） | — |

**对评审发现的处置（逐条）**：🟡-1 = 接受（上抛 · 5.4-1，本席不改字面）；🔵-2 = 部分接受（漂移确认，但「VSC 归档 = 155 行」这一来源推测**不成立**——实测两归档均 188 行）；🔵-3 = 接受并就地闭合（本节 5.2-2 / 5.2-3）；🔵-4 = 接受（批档层 · 上抛 5.4-4）；🔵-5 = **部分接受**（CN 半边零鉴别力成立，但其「`验收标准` 改前零出现」判读有误——改前为裸行在场；EN 半边鉴别力成立）。

### 5.1 交付摘要（条 4 · #113 + 条 7 · #110）

- **条 4（#113）**：两产品 `AGENTS.md` 各增批档 `:84` 逐字句（`the remote is the only disaster backup` 族）。
  - `thincoder-cli/AGENTS.md:30`（Commit messages 条后）
  - `thincoder-vscode/AGENTS.md:33`（Discussion → docs 条后）
- **条 7（#110）**：
  - `thincoder-cli/AGENTS.md:47`–`:63` = 模块图块整块重写（端壳面清单 + 「机制本体 = `@thincoder/core`」句）；权威指针由死链 `docs/design/ARCHITECTURE.md` 改指仓根 `../docs/core/design/ARCHITECTURE.md` §3。
  - `thincoder-cli/AGENTS.md:21` = 提示词双面路径改指 `docs/core/design/prompts/*.md`（中文正本）+ `thincoder-core/prompts/*.md`（英文落地）。
  - `thincoder-vscode/AGENTS.md:41` = src/agent 行补 `setup-tooltable.mjs` · `turn-domains.mjs`（补后与盘上 `src/agent/*.mjs` 10 档逐名吻合）。
- **Δ**：CLI 70 → 64 行（−6 = 块 46–69〔24 行〕→ 47–63〔17 行〕−7，+1 提交条）；VSC 126 → 127 行（+1）。

### 5.2 决策透明表

| # | 决策 | 依据 |
|---|---|---|
| 1 | 块内文档指针用**仓根相对**形态（`docs/cli/design/TUI.md`） | 与同档既有形态一致（`:14`/`:21`/`:22` 的 `docs/README.md`、`scripts/doc-impact.mjs` 皆仓根相对）；新指针目标全部实存 |
| 2 | 块内逐项描述取自**盘上实读**（文件头注 + `ls`），不抄旧清单 | 批档设计要点「以盘上实存为准」；v1 块 22 项中 14 项已死 |
| 3 | 未改 `:12`（`src/prompts/` 死路径残留）· `:35`（v1 测试门描述）· `:38`（CHECKPOINT 死指针） | 批档 `:168` 边界「只改模块图块 + 权威指针 + `:21` 双面路径；其余登记不动作」⇒ 超出授权面，报告不动作（见 5.3 / 上抛项） |
| 4 | 未新建仓根 `AGENTS.md` · 未触仓外工作区档 · 未触提示词档本体 · 未动 `package.json`/发布面 | 批档 `:86` / `:168` 禁止范围 |

### 5.3 内审 + 代码评审轮次与终态

- **内审（explore 只读偏差审计）**：1 轮 —— 四类偏差（部分实现 / 静默简化 / 文档漂移 / 越界）**均未发现**；逐项实核 = 逐字句落点、CLI 块 22 项盘上实存、`src/tui/` 62 档（≥「60+ 档」）、权威指针 §3 解析、VSC `src/agent` 名集 10/10。
- **advisor 代码评审（`type=code`）**：1 轮 —— **VERDICT: pass**；无 🔴；4×🟡（CLI `:35` v1 测试门描述 · CLI `:12` 提示词面自相抵 + 死链 · CHECKPOINT 死指针〔VSC `:35` + CLI `:38`〕· VSC 块无概览/漏列）+ 3×🔵（`tool-docs` 24/25 读数 · core 族枚举漏 `tool-docs` · 新块指针形态两制）——全部**非 must-fix**，且均落在批档登记不动作面或本轮授权面之外。
- **fix round**：**0 轮**（无 must-fix；上列发现一律「报告不动作」，未动授权面之外的任何一条文本）。
- **终态**：`clean`（收敛）。

### 5.4 验收读数（本实施轮实跑）

- 条 4：两档 `includes('the remote is the only disaster backup')` = **OK / OK**。
- 条 7：VSC `includes('turn-domains.mjs') ∧ includes('setup-tooltable.mjs')` = **OK**；CLI `!includes('src/agent-tools/')`（0 命中）∧ `!includes('docs/design/ARCHITECTURE.md')`（0 命中）∧ `includes('src/acp')` ∧ `includes('src/tui')` ∧ `includes('thincoder-core/prompts/')` = **OK**。
- 落盘回读（D6）：两档全文回读核验；CLI 块内 22 项 / VSC 10 名逐项 `ls`·`glob` 比对（无幽灵项、无缺项）。
- `cd thincoder-cli && node test/run.mjs` = **718/718 pass · 0 fail**（纯 .md 改动；CLI 档 `:35` 明记纯文档更新不要求跑测试——本读数作冗余证据）。

### 5.6 读数追记（本席 §5 落笔后复跑 · 供父侧核 A1 时对账）

本席四档改毕即刻复跑读数 = **与基线同值**（候选 17329 · 悬空 6 · 注记豁免 43 · 拟新增 6 · 迁移期引文 222 · 行宽 25）——该读数 **as-of 2026-09-20 02:4x**。§5 落笔后再跑 `node scripts/doc-check.mjs --root .` = **候选 17438 · 悬空 6 · 注记豁免 43 · 拟新增 6 · 迁移期引文 219 · 行宽 25**。

- **接受判据（新悬空 / 新行宽零）在两跑中均成立**：悬空恒 6（= 基线存量，5 处 `@thincoder/core/…` 族 + `SETTINGS.md:388`，属条 2 面）· 行宽恒 25（= 基线存量 16 档，属条 2 折行面）。
- **候选 +109 / 迁移期引文 −3 的变动源不在本席写面**：本席两跑之间未再动任何 `docs/**` 被扫档（`git status` 实读：本席写面 = 四档 + 本档 §5，其余为同伴在途轮次——`thincoder-cli/AGENTS.md` · 两条 test/run.mjs · `memory-scan-bounds.test.mjs` · `thincoder-vscode/AGENTS.md` 及未跟踪新档 `docs/core/design/MODEL-SPECS.md`）；`docs/batches/**` 在两跑中均属 `checkConfig.anchors.exclude`，故本档 §5 追加**不进**锚/行宽读数。变动具体归因（新档入域 / 同伴轮次改写）**未核实**——登记待父侧 §6 对账时以「A1 只看悬空 + 行宽」口径收口。

**轮次** = initial · **桶 1-C** = 测试基建两项（#72 条 9 · #94 条 8）· 2026-09-20 · 本段经 `batch_segment` 落盘（无路径参数）

### 5.1 交付摘要（改动清单）

| # | 文件 | 落点 | Δ（`git diff --numstat`）| 净行数 |
|---|---|---|---|---|
| 1 | `thincoder-core/test/run.mjs` | `:8`–`:9` 档头 ②'' · `:12` import 补 `statSync` · `:28`–`:31` walk 拒绝分支 | 7 / 2 | 38 → 43 |
| 2 | `thincoder-cli/test/run.mjs` | `:9`–`:10` · `:13` · `:29`–`:32`（消息「two-level glob」） | 7 / 2 | 40 → 45 |
| 3 | `thincoder-vscode/test/run.mjs` | `:13`–`:14` 档头 ④ · `:17` · `:44`–`:47`（消息「manifest check」） | 7 / 2 | 59 → 64 |
| 4 | `thincoder-cli/test/memory-scan-bounds.test.mjs` | `:298`–`:299` 常量 `T_Y4_CTRL_MIN_GAP_MS = 100` · `:364` 打印线「≥100 ms」· `:366` 断言改用常量 | 4 / 2 | 369 → 371 |

**零改动面（边界遵守）**：收集谓词 glob 形态 · 夹具 `T_Y4_ROWS = 30_000` · `SCAN_*` 生产常量 · `:365`（缺省 ≤250）与 `:367`（对照 ≥2×缺省）两断言 · ×5 打印读数 · 未新增测试档 · 未跟遍历软链目录。

### 5.2 决策透明表

| # | 决策点 | 裁定 | 理由 |
|---|---|---|---|
| 1 | 三 runner 拒绝消息 | 保留「消息随包」：core「single-level glob」· CLI「two-level glob」· VSC「the manifest check walks this same tree」 | 设计 §2 条 9 明写「三档同款 · 消息随包」；VSC 为清单制（无 glob），逐字照抄会写出假话 |
| 2 | 打印线判据文案 | 文案写「≥100 ms」字面，同行**评估项**改用常量 `T_Y4_CTRL_MIN_GAP_MS` | 文案按 §2.1 条 8 逐字；评估项若仍留 300 则打印自报与断言判据相抵 |
| 3 | 档头注释各 +2 行 | 保留（不比照 §2.2 Δ +4 砍注释） | 档头本就逐条枚举自检面，新拒收面须在同处可见；两评审均判合规；代价 = §2.2 行 1/2/3 的 Δ 需收正（见 5.5-2） |
| 4 | 悬空软链目录（链接目标缺失） | **不加固**，照设计逐字稿 | 设计是权威规格；发现即上抛登记（见 5.5-4），不静默偏离 |
| 5 | 探针副本范围 | 三 runner 各拷一份（超 A4 的 core 单份），加一处 file symlink 样例 | 三档均改 ⇒ 逐档取 fail-closed 证据 + 软链文件非回归证据；成本 = 多两个副本（仍在 %TEMP%） |

### 5.3 验收读数（逐条）

| AC | 命令 | 读数 |
|---|---|---|
| 条 9① 三包全绿 | `node test\run.mjs`（三包 · 串行 · 落盘再读汇总） | core **401/401** · CLI **718/718** · VSC **734/734** · fail 0 · exit 0（日志 `%TEMP%\pkg-{core,cli,vsc}.log`） |
| 条 9② junction 探针 | `%TEMP%\tc-runner-probe`：`pkg\test\link` = junction → `..\target`（内含 `probe.test.mjs`），三 runner 副本落盘后跑 | **改前** = 三 runner 全 exit 0（tests 0，静默漏收集）；**改后** = 三 runner 全 exit 1 + stderr 含 `symlinked directory under test/`（消息随包） |
| 条 9② 探针前提实证 | `execute`（node · 只读） | `link` → `isDirectory=false` · `isSymbolicLink=true` · `statSync().isDirectory=true`（设计实证复核成立） |
| 条 9 软链**文件**非回归 | `%TEMP%\tc-runner-probe\pkg2`（file symlink · 无 junction） | runner exit 0 ∧ 该软链档被收集执行（tests 1） |
| 条 8 | `cd thincoder-cli && node --test test\memory-scan-bounds.test.mjs` | **11/11 pass · exit 0**；打印行含「≥100 ms」（实测 缺省 97ms / 对照 453ms / 比值 4.67×，×5 仍为打印读数） |
| 条 8「先红」 | 同命令（改前 ×3） | 375 / 957 / 863 ms——三次均偶然 ≥300 绿；设计轮记录红 277 · 台账读数 267/272/265 ⇒ 旧绝对项读数**跨阈值**（flake 本体），非确定性不可复现 |
| 条 8 零改复核 | `git diff -- thincoder-cli/test/memory-scan-bounds.test.mjs` | 仅 2 处替换 + 2 行新增；`:365`/`:367` 两断言**零出现在 diff** |
| 落盘后回读（D6） | `read` 四档 + `git diff`（三 runner 逐档） | 逐行实读通过；三 runner diff **仅含预期 hunk**（无题外改动） |

### 5.4 内审 + 代码评审轮次与终态

- **内审**（explore 只读发散审计）：**1 轮** → 代码四项（条 9 分支/位置/import/不跟遍历 · 条 8 常量/断言/零改面/文档一致性）全通过；唯一发现 = §2.2 Δ 记账差 1（LOW · 非代码缺陷）。
- **代码评审**（advisor · code）：**1 轮** → **VERDICT pass**（🔴 0 · 🟡 1〔非 must-fix · 已裁定债〕· 🔵 5）。
- **fix round = 0**（无 must-fix 项；🟡 = 不拆裁定在册，🔵 = 可选加固 / 记账项）。
- **终态 = `clean`**。
- **口径勘误（透明披露）**：评审表行 3 把「Δ 差 1」归到 §2.2 行 4（测试档）；经 `git show HEAD:` 与 `git diff --numstat` 实测，行 4 两口径吻合（369→371 · 读档口径 370→372 = 「Δ ±2」自洽），真实差 1 落在行 1/2/3 的 Δ 列——已按实测定稿（见 5.5-2），未采信评审该行结论。

### 5.5 上抛与待办

1. **探针清理（停在原地报告 · 未自构造删除命令 · 承硬约束）**：`%TEMP%\tc-runner-probe\`（junction `pkg\test\link` + 三 runner 副本 + `pkg2` file symlink + `target` 夹具）留存原处；另 `D:\teamcode\%P%\`（`%P%` 未展开产生的字面目录含其 junction）= 实施中命令行形态所致残留。二者 junction 目标均在各自探针树**内**，任何清理路径无域外风险；请父侧按工具面清理。
2. **设计表 Δ 记账差 1（非代码缺陷 · 请父侧转 §6 或设计小轮收正）**：§2.2 行 1/2/3 记「现量 39/41/60 · Δ +4」（口径 = 读档 lines total），实际净增 **+5**（档头注释 2 行 + walk 3 行；numstat 7+/2−）⇒ 该口径交付态 = **44/46/65**。行 4 实测吻合（370 · ±2 ⇒ 372 = 交付态同口径）。
3. **既有裁定项零动作**：档长 371 行 >300 软线（不拆 + 触发 + 抽取候选线裁定在册 = `docs/core/design/DOC-DISCIPLINE.md` §3.10）；`:365` 缺省 ≤250 绝对墙钟（设计已按条 8 `:178` 登记机器敏感项 · 承评审 #13）。
4. **可选加固（裁决权在父侧）**：悬空软链目录（链接目标缺失 ⇒ `statSync` 返 `undefined`）不触发拒收，落回名判静默通过——实装与设计逐字稿严格一致，属拒收策略边界余量（无漏收集风险：目标缺失时其内无可漏收档）；若求「把沉默洞变响铃」完全同构，可另批登记加固。
5. **他桶依赖**：条 8 设计面判据句已在 `docs/core/design/MEMORY.md:407` 落位，与本轮代码三层（常量 250 / 常量 100 / ×2 相对）逐项对应，无待办。

## §6 验证与收口（父代理）
