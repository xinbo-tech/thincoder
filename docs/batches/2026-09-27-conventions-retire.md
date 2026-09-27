# 2026-09-27 · conventions.json 退役
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-27 · 来源 = 用户 2026-09-27 19:39「conventions.json 我还是决定退役，必须的功能并入 project-manifest，不要同时保留二者」。
> 台账 = #464（承 #463 退役裁定）。前情 = 无（独立批；与豁免批 `2026-09-27-eng-write-exemption.md` 同域串行——实施序 = 豁免批先）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-27

### 1.1 条目与口径（父侧 · 2026-09-27 19:4x ✓）

**来源** ✓：用户 19:39「conventions.json 我还是决定退役，必须的功能并入 project-manifest，**不要同时保留二者**」。

**本批一句话**：退役 `.thincoder/conventions.json` 声明档——必备声明功能（分类 / 索引 / 评审注入三族）并入 `PROJECT-MANIFEST.json`；**单一项目声明档，双机制零并存**。

**条目（一件 · 台账 #464 · 承接 #463 的实核分析）**：

| # | 条目 | 判据线（机器可检 · 设计面细化） |
|---|---|---|
| 1 | 声明档退役：`loadConventions` / `CONVENTIONS_REL_PATH` / schema 归一全链移除；两处指路文案（`thincoder-core/agent/dispatch.mjs:209` ∥ VSC `tool-gates.mjs:98`）随动；三端用例面随动 | 全仓 `conventions.json` 运行时引用零命中（代码面）；旧档在场 ⇒ 行为有判据（见边界）；既有 portability 用例面按设计面收正后全绿 |
| 2 | 必备功能并入 `PROJECT-MANIFEST.json`：① `codePaths`（分类段声明——非 `src` 布局项目的正当性，FR10 核心）② `index.*Extensions`（索引扩展名）③ `advisor.{docMap,standardsDoc}`（评审注入指针）——键名 / 形态 / 缺省由设计轮定；**缺省语义不变**（无档 ⇒ 纯默认） | MANIFEST 新键的 schema + 归一 + 消费面（分类 / 索引 / 注入三面）机检读数；缺档 ⇒ 与今日默认逐条等值 |
| 3 | 收回面重指向：豁免批（#462）§3.1「`codePaths` 收回」行改指 MANIFEST 键（跨批随动） | 设计档 §3.1 行与新落点互指一致（判据 = 豁免批 J11 语义在新落点可执行） |

**边界（不在本批）** ✗：
- **双机制零并存**（用户字面）：不留兼容读 / 不留弃用期并行。**旧档在场时的处置**（一行可见告警 ∥ 静默不读）由设计轮裁——告警非机制，允许。
- **分类器缺省（aux 面）= 豁免批（#462）面**——本批零改其语义（只动声明加载与落点）。
- CI（`.github/**`）不并入；桌面批文件（`docs/desktop/**` · 桌面批档）零触碰。

**依赖 / 序** ✓：
- 本批设计轮**须待评审 #97（豁免批）报告送达 + 其修正轮落地**——`docs/core/design/PORTABILITY.md` 与 `docs/core/requirements/PORTABILITY.md` 现处 #97 冻结窗（D5），且两批交叉点 = 设计档 §3.1 收回行 + 代码面 `conventions.mjs` 声明加载面。
- **实施序 = 豁免批先、本批后**（同档串行，零并发写）。

### 1.2 授权与门

**授权口径** ✓：用户 19:39 决定（退役 + 并入 + 零并存）= 需求成立；**设计轮实际派发待 #97 落地**（冻结窗依赖）；评审点火 + §4 批准按常规（用户侧门）。

### 1.3 设计核验与上抛处置（父侧 · 2026-09-27 19:5x ✓）

**设计核验** ✓（父侧实读，非采信自报）：三裁决 + 补裁决各有理由与被否候选（`D13–D16` · `MANIFEST.md` `KD-M1-31–34` · §2.2 三族契约段 + §2.5 计数收正 + AC-31–34 + T56–58）；判据线 J1–J10 机器可检（J2 deepEqual 等价断言 · J5 旧档在场两态 · J6 零并存的精确形）；§5 用例面（T-29–T-32 / T-V25–26 + 零改承诺）；受影响文件 21 档全表；跨批随动（`codePaths` 收回行 = `docs/core/design/PORTABILITY.md:56`）在位 ✓。

**§1.1 条目 1 判据收正** ✓（**父侧直接执行** · 机械 · 可 revert）：原「运行时引用零命中」⇒「**零读引用 + 字面恰一处（告警点）**」——与 J6 机判形对齐（使用户批准的旧档告警与判据自洽）。

**上抛处置** ✓（笔权 = 父侧）：
- 需求档 `docs/core/requirements/PORTABILITY.md`：F2 声明文件句 ⇒ **manifest 三族键**（`:27`）+ §4 本仓自用句同判（`:50`）+ 变更记录（`:126`）。
- 规格档 `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MANIFEST.md`：②.1「五键 ⇒ **八键**」（`:13`）+ ⑥ 句（`:58`）+ 变更记录（`:81`）。
- 上抛 2（旧档告警文案）= 实施舱落笔（句形在 §2.7）；上抛 3（本仓数据档零改）✓ 采纳；上抛 4 / 5（tmp 副本 · 记录面行）登记为观察。

**下一步**：设计面可评审（**点火权 = 用户**）；评审对象 = 设计三档 + 需求两档；`batchDoc` = 本批档。

### 1.4 设计评审轮 1 裁定与修正轮派发（父侧 · 2026-09-27 20:1x ✓）

**评审轮 1（§3）= `changes-required`** ✓（2🔴 · 2🟡 · 5🔵 = 9 条 + 1 out-of-scope · 逐字在 §3）。**父侧逐条裁定**（9 条全接受）：

| # | Action | Detail |
|---|--------|--------|
| 1 🔴 | **Dispatched** | E1 键面补正（`ENGINEERING-MODE-V2.md` §2.3 E1 JSON `:126-145` / 键注释 `:147` / 校验句 `:149` 补三族键）+ `MANIFEST.md:270` 断言随正——父侧实读核实（E1 现五键 · AC3 八键 · 变更记录自称已收正）✓ |
| 2 🔴 | **Dispatched** | 增量标注钉死 + 越限判定：逐档 Δ 上界（`dispatch.mjs` 499 的 500 硬限处置）；`test/manifest.test.mjs`（479 + T56–58）按 `:194` 已登记方案同批判定；`verify.mjs` / VSC `memory-index-face.test.mjs` 补 >300 注——实读复核 ✓ |
| 3 🟡 | **Dispatched** | 形态判据措辞与空数组语义对齐（`:116` ↔ `:113`/`:114`）——实读核实 ✓ |
| 4 🟡 | **Fixed + Dispatched** | 规格 ④ **AC-M1-9 已由父侧落**（规格档笔权——`docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MANIFEST.md:47` + 变更记录 `:83`）；设计 AC-31–34 回指随动 = 修正轮 |
| 5 🔵 | **Dispatched** | §3.2 补声明对象形状行（`{declared, codePaths, index, advisor}`） |
| 6 🔵 | **Dispatched** | 退役告警基准 / 频次钉死 + 用例断言 |
| 7 🔵 | **Dispatched** | 「规格侧待同步」句改「已同步」——父侧实读：规格两处已八键 ✓ |
| 8 🔵 | **Dispatched** | `conventions.mjs` 行数 224 ⇒ **254** 回填（父侧实读 ✓）+ 批 §2.4 同判（§2 追加块——§2 append-only） |
| 9 🔵 | **Fixed** | 需求档档头计数 F1–F8 ⇒ **F1–F9**（父侧直接执行 · 零语义 · 可 revert——`:4` + 变更记录 `:126`） |
| 备注 | — | out-of-scope 三条（`ENG-TOKEN-BINDING` / `DESIGN-TOKEN-SETTLEMENT` / `WORKSPACE`）纳入修正轮扫尾（逐处判「活体句 ⇒ 换新名 ∕ 记录面句 ⇒ 保留」） |

**复核** ✓：评审承重引文父侧抽读复核通过（宿主对 `MANIFEST.md:270` 报「引文不符」= 分片引文形归因——该行原文实读与评审引文一致）。
**修正轮** ✓：eng-designer fix #104 派发——点修 1–8 + 扫尾三条；「本轮不做」= #9（父侧已落）/ 需求档正文（笔权 = 父侧）/ 他批文件 / 实现码 / 评审点火 / 不新增语义。

### 1.5 修正轮核验（父侧实读 · 2026-09-27 20:2x ✓）

**#104 点修逐号核验** ✓（实读落点，非采信自报）：
- **#1** ✓ `ENGINEERING-MODE-V2.md:144-146`（E1 JSON 补 `codePaths` / `index` / `advisor` 三行）· `:151` 键注释 · `:153` 校验句（KD-M1-32）· `:534` 变更记录；`MANIFEST.md:286`「四处均八键」**现为真** + `:287` 扩列补 E1。
- **#2** ✓ `MANIFEST.md:183` / `:185`（行 32 / 34 Δ 逐档钉死指针）+ `:186-187`（**+行 35 / +行 36**）+ `:198`（行 19 触发成立 ⇒ 本批执行）+ `:205-215`（新注块：Δ 上界逐档 + `manifest.test.mjs` 479 越限 ⇒ 同批拆 `manifest-discovery.test.mjs`〔纯搬移零语义〕+ &gt;300 面方案/触发）。
- **#3** ✓ `MANIFEST.md:116-118`（元素层 / 数组层两层分列 + 空数组语义逐键）。
- **#4** ✓ `MANIFEST.md:557-559`（AC-31–34 回指 **AC-M1-9** + AC-34 告警基准断言）。
- **#5** ✓ `PORTABILITY.md:74`（声明对象形状行）。
- **#6** ✓ `PORTABILITY.md:60-61`（告警落点 / 基准 = `manifestFilePath` 项目根 / 频次 = 每缓存一次）+ T-30 / T-V26 基准断言（同报）。
- **#7** ✓ `MANIFEST.md:286`（「规格侧已同步（2026-09-27）」）。
- **#8** ✓ `MANIFEST.md:182`（`conventions.mjs` 254）+ `:185`（CLI 298 / VSC 293 回填）+ 批档 §2.8 `:167-168`。
- **扫尾三条** ✓：`ENG-TOKEN-BINDING.md:152` ⇒ `loadProjectDeclaration`；`DESIGN-TOKEN-SETTLEMENT.md:150` 失效句已删；`WORKSPACE.md:28` 记录面保留（零改）。
- **自探补足 2 处** ✓（`advisor.mjs:13` / `panel-index.mjs:220` 注释面——行 35 / 行 33）；受影响面 21 ⇒ **23 档**（§2 状态行 `:69`）。
- **评审算术订正** ✓（采信）：`verify.mjs` 296 ⇒ ≤297 · VSC `memory-index-face` 298 ⇒ ≤300——钉死上界**未越** 300（父侧原判「将越」在该两档不成立，修正轮如实指出并在册）。

**下一步** ✓：等 #105（豁免批登记轮）落定 `docs/core/design/PORTABILITY.md`（同档在写——评审窗口冲突）⇒ **点火复审（轮 2）**。

### 1.6 复审（轮 2）结果与裁定（父侧 · 2026-09-27 20:3x ✓）

**复审（§3 轮次 2）= `pass`** ✓（🔴 0 · 🟡 2 · 🔵 4 = 6 条 · 逐字在 §3）。**父侧逐条裁定**：

| # | Action | Detail |
|---|--------|--------|
| 1 🟡 | **Dispatched** | `ENG-TOKEN-BINDING.md` 变更记录缺失——扫尾改名落笔在位（父侧实读 `:152` = `loadProjectDeclaration` ✓）而记录面未记 ⇒ #107 补一行 |
| 2 🟡 | **Fixed** | 需求档 N4 测试面清单陈旧（列已退役档 `portability-vsc-index.test.mjs`）——**父侧直接执行**（需求档笔权 · 零语义 · 可 revert）：清单收正为现行两档 + 承接入核面档（`docs/core/requirements/PORTABILITY.md:43` + 变更记录） |
| 3 🔵 | **Dispatched** | `MANIFEST.md:286` 的 SPEC `:58` ⇒ `:59` |
| 4 🔵 | **Dispatched** | `MANIFEST.md:259` / `:468` 的 FR11 锚 `:62` ⇒ `:63`（两处同判） |
| 5 🔵 | **Dispatched** | `ENGINEERING-MODE-V2.md` E5.1 行收正未入变更条目 ⇒ #107 回填 |
| 6 🔵 | **Dispatched** | `declared` 判据双措辞 ⇒ #107 一句话钉死（与缺省值等值 ⇒ 假） |

**复核** ✓：宿主对 `ENG-TOKEN-BINDING.md:152` 报「引文不符」= 形归因（父侧实读逐字在位）。
**下一步** ✓：修正轮 #107（点修 5 条）⇒ 核验 ⇒ **§4 代签**（全链授权 · 自缚三条件）⇒ 实施舱派发。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（三裁决（schema 落点 / 读面换源 / 退役全链）+ 补裁决（校验口径）；判据线 J1–J10、受影响文件与测试面 23 档（含修正轮 +2 档）、上抛项 5 条在册；设计评审轮 2 点修 5 条落点见 §2.9）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 覆盖条目（三件 · 台账 #464 · 承 #463）

**覆盖** ✓：

| # | 条目 | 落形 |
|---|---|---|
| 1 | 声明档退役：`CONVENTIONS_REL_PATH` / `loadConventions` / `DEFAULT_CONVENTIONS` / `clearConventionsCache` / 逐键类型校验全删；两处指路文案随动；三端用例面随动 | 全链删 + 旧档在场 = 一行可见告警（内容零解析）；文案 = 两处门禁 hint（`dispatch.mjs` ∥ VSC `tool-gates.mjs`）+ 两处索引提示行（`cmd-reindex.mjs` ∥ VSC `panel-index.mjs`）——两端各自逐字 |
| 2 | 必备功能并入 `PROJECT-MANIFEST.json`：`codePaths` / `index.*Extensions` / `advisor.{docMap,standardsDoc}` | 三族键入 schema（顶层平级 + 缺省值入 `DEFAULT_MANIFEST`；键名 / 形态**逐字承前**）；**缺省语义不变**（无档 ⇒ 逐条等值今日默认——J2） |
| 3 | 收回面重指向：豁免批（#462）§3.1「`codePaths` 收回」行改指 MANIFEST 键 | `PORTABILITY.md` §3.1 收回行随载体改写（`:56`）；豁免批 J11 语义在新落点可执行（J9） |

**明列不在本批** ✗：CI（`.github/**`）· 桌面批文件（`docs/desktop/**` · 两桌面批档）· 分类器缺省（aux 四值 = 豁免批面——本批零改其语义，只换声明载体）· eng-coder token 门（零改）· 实施码（设计轮只出设计 + 受影响文件表）· 提示词面（全仓提示词零 `conventions.json` 引用——实核零命中，无同步面）· 需求档正文（笔权 = 父侧，见 §2.7）。

### 2.2 判据线（机器可检）

| # | 判据 | 期望读数 |
|---|---|---|
| J1 | 分类面（声明生效） | manifest `codePaths:["lib"]` ⇒ `classifyPath("lib/a.md")` = `code` ∧ `classifyPath("src/a.md")` = `doc`；`declared` = true |
| J2 | **无档逐条等值**（N1 同族——等价断言） | 无 manifest ⇒ `loadProjectDeclaration(tmp)` deepEqual `DEFAULT_DECLARATION`（`["src"]` / `[]` / `[]` / `""` / `""`）+ `declared === false` ∧ 四值读数（`src/x.mjs`=code · `docs/a.md`=doc · `tmp-x.mjs`=temp · `test/x.mjs`=aux · `src/test/x.mjs`=code） |
| J3 | 索引面 | manifest `index.codeExtensions:[".xyz"]` ⇒ `indexExtensions(tmp).code.has(".xyz")` ∧ `listProjectFiles` 收录 `.xyz`（并集，只增不减） |
| J4 | 注入面 | manifest `advisor.docMap` / `standardsDoc` ⇒ `injectDocumentMap` / `injectProjectStandards` 返回声明路径（行为形断言）；未声明 ⇒ 探测 / 降级句（零改） |
| J5 | **旧档在场**（批 §1 边界裁定） | `.thincoder/conventions.json` 在场（哨兵声明 / 坏 JSON 两态）⇒ 读数与 J2 逐条等值（内容零生效）∧ 一行 `console.warn` + 日志事件 `declaration:retired-file` ∧ 内容**零解析**（坏 JSON 不产 JSON 错误句） |
| J6 | **零并存**（代码面） | `grep -n "loadConventions\|CONVENTIONS_REL_PATH\|clearConventionsCache\|DEFAULT_CONVENTIONS"` 全仓 `*.mjs`（除 `.thincoder/tmp/**`）**零命中**；`grep -n "conventions\.json"` 命中集 ⊆ {`conventions.mjs` 告警点 1 行 + 其注释}（代码面）+ 用例面（告警断言） |
| J7 | 文案面 | 两端门禁 hint 逐字含 `declare project conventions in PROJECT-MANIFEST.json to adjust`（两端同文）；CLI `/reindex` 与 VSC 面板提示行各含 `PROJECT-MANIFEST.json`（各自原句除文件名外逐字不变） |
| J8 | fail-closed / 降级 | 档非法（坏 JSON / `codePaths:"src"` 等形态错）⇒ `readManifest` `reason:'invalid'`（工程入口 / 翻转面既有语义零改）；消费面 = 三族回默认 + warn + `logEvent` + 不抛 |
| J9 | 跨批随动（条目 3） | `codePaths:["src","test"]` ⇒ `test/x.mjs` 判 `code`（豁免批 J11 语义在新落点可执行——收回行可诉） |
| J10 | 全绿 | `npm test` 全绿（三端 portability 面 + 核 manifest 面按设计收正后） |

### 2.3 设计档落点（本轮已落 · 三档）

| 档 | 落点（节） |
|---|---|
| `docs/core/design/PORTABILITY.md` | §2 三行收正（装载面 / 默认判据单源 / 载体）· §3.1 改写（三族键表 + 收回行 + `declared` 定义 + 载体唯一）· §3.2 API 表（`loadProjectDeclaration` / `clearDeclarationCache` / `DEFAULT_DECLARATION`）· §3.4 +退役档可见行 + 门禁指路改 manifest · §3.6 VSC 声明面行 · §4 重写 D2 + 增 D13–D16 · §5 +新用例表 · §6 射程外示例换现行物 · 变更记录 |
| `docs/core/design/MANIFEST.md` | §1.2 F1（八键）· §1.4 边界 · §2.1#1 · §2.2 接口（`MANIFEST_SCHEMA` / `DEFAULT_MANIFEST` / `validateManifest` 行 + 三族声明键契约段）· §2.3 +行 30–34 · §2.4 +KD-M1-31–M1-34 · §2.5 schema 计数条（五键 → 八键）+ 键面条 · §3.1 +AC-31–AC-34（AC-29 限定句）· §3.2 +T56–T58 · 变更记录 |
| `docs/core/design/ENGINEERING-MODE-V2.md` | §2.2 M1 行键面 + §2.3 E5.1 表第 8 行（项目级枚举去退役档）+ §3.1 AC3（五键 → 八键）· 变更记录（随动收正行；机制条文零改） |

### 2.4 受影响文件与测试面（现读 = as-of 2026-09-27 实测，`\n` 计数）

| 文件 | 现读 | 预计 Δ | 面 | 改动 |
|---|---|---|---|---|
| `thincoder-core/manifest.mjs` | 451 | +~35 | 产品代码 → eng-coder | 三族键入 `DEFAULT_MANIFEST` / `MANIFEST_SCHEMA`；`validateManifest` 形态判据；`fillDefaults` 嵌套分支；头注 |
| `thincoder-core/conventions.mjs` | 224 | 净 ±~15 | 产品代码 → eng-coder | 删装载旧链；新增 `loadProjectDeclaration` / `clearDeclarationCache` / `DEFAULT_DECLARATION` + 退役告警点；头注 / JSDoc |
| `thincoder-core/agent/dispatch.mjs` | 499 | ±2 | 产品代码 → eng-coder | import + 调用换名 + hint 改 `PROJECT-MANIFEST.json`（+注释） |
| `thincoder-core/agent-tools/verify.mjs` | 296 | ±2 | 同上 | 调用换名 |
| `thincoder-core/agent-tools/advisor-settle.mjs` | 241 | ±2 | 同上 | 调用换名 |
| `thincoder-core/advisor/repos.mjs` | 151 | ±2 | 同上 | 调用换名（两处） |
| `thincoder-core/advisor/project-context.mjs` | 198 | ±4 | 同上 | 调用换名（两处）+ 头注 |
| `thincoder-core/index-discover.mjs` | 177 | ±2 | 同上 | import 换名（`DEFAULT_CONVENTIONS` → `DEFAULT_DECLARATION`）+ 两调用 |
| `thincoder-core/memory/code-sync.mjs` | 428 | ±1 | 同上 | 调用换名 + 注释 |
| `thincoder-core/memory/schema.mjs` | 454 | ±1 | 同上 | 注释（声明指路） |
| `thincoder-cli/src/tui/cmd-reindex.mjs` | 52 | ±1 | 同上 | 索引提示行改 manifest |
| `thincoder-vscode/src/agent/tool-gates.mjs` | 167 | ±2 | 同上 | import + 调用 + hint |
| `thincoder-vscode/src/agent/run-helpers.mjs` | 269 | ±2 | 同上 | import + 调用 + 注释 |
| `thincoder-vscode/src/extension/panel-index.mjs` | 242 | ±1 | 同上 | 提示行改 manifest |
| `thincoder-cli/test/portability-classification.test.mjs` | 221 | +~45 | 用例面 → eng-coder | 夹具换档 + 调用换名 + T-05 / T-09 收正 + T-29 / T-30 / T-31 |
| `thincoder-cli/test/portability-index.test.mjs` | 134 | ±5 | 同上 | 夹具换档 + T-17 逐字 + T-14 示例路径换现行物 |
| `thincoder-cli/test/portability-advisor-context.test.mjs` | 10 | +~35 | 同上 | T-32（注入面声明生效——行为形） |
| `thincoder-vscode/test/portability-vsc-classification.test.mjs` | 237 | +~35 | 同上 | 夹具换档 + 文案逐字 + T-V25 / T-V26 |
| `thincoder-vscode/test/portability-vsc-advisor-context.test.mjs` | 110 | ±2 | 同上 | import 换名（T-V11） |
| `thincoder-vscode/test/memory-index-face.test.mjs` | 298 | ±1 | 同上 | 提示行逐字（`:296`） |
| `thincoder-core/test/manifest.test.mjs` | 479 | +~50 | 同上 | T56–T58 + 「五键」措辞收正 |

> 重档注：`dispatch.mjs` 499 / `code-sync.mjs` 428 / `schema.mjs` 454 —— 本批增量均 ~0–2，无一越 500 硬限、无拆分义务。用例新增号（本席定 · 避撞实核 2026-09-27）= T-29–T-32 / T-V25–T-V26（分类与注入面，落点 = `PORTABILITY.md` §5 用例表）+ T56–T58（manifest 面，落点 = `MANIFEST.md` §3.2）。

### 2.5 验收对照（对批 §1 条目 1–3 判据）

| 批 §1 条目判据 | 覆盖 |
|---|---|
| 全仓 `conventions.json` 运行时引用零命中（代码面） | J6（告警点字面恰一处——见裁决三） |
| 旧档在场 ⇒ 行为有判据 | J5（一行告警 + 读数等值 + 零解析） |
| 既有 portability 用例面按设计面收正后全绿 | J10 + §2.4 用例面表 |
| MANIFEST 新键 schema + 归一 + 消费面（分类 / 索引 / 注入）机检读数 | J1 / J3 / J4（+ J8 降级） |
| 缺档 ⇒ 与今日默认逐条等值 | J2（deepEqual `DEFAULT_DECLARATION` + 四值读数） |
| 设计档 §3.1 行与新落点互指一致（豁免批 J11 语义可执行） | J9 |

### 2.6 关键决策（三裁决 + 补裁决 · 各含被否候选）

- **裁决一（schema 落点）** = 三族键**顶层平级并入 manifest**（`codePaths` / `index` / `advisor`）+ 缺省值入 `DEFAULT_MANIFEST`；键名 / 形态逐字承前 ⇒ 用户项目迁移 = 逐字抄写零改名；`docRoot`（根集合）∥ `advisor.docMap`（文件单指针）**并存**——结构不对称（不同种类 / 不同消费族 / 合并须强造映射约定）。
  被否：包一层 `conventions` 对象（三族非同一概念）· 三族键不入默认档（`fillDefaults` 只搬已知键 ⇒ 读面取不到，或另造第三类键）· `docMap` 合入 `docRoot`。落点 = `MANIFEST.md` §2.4 KD-M1-31。
- **裁决二（读面载体重构）** = `conventions.mjs` 新增 `loadProjectDeclaration(cwd)`（投影三族键 + 归一 + 冻结 + 按档路径缓存）；装载经 `manifest.mjs` 的 `readManifest` / `manifestFilePath` **单源**——单向依赖 `conventions.mjs` → `manifest.mjs`（反向零出边）；两模块同属模式无关面 ⇒ 非模式耦合。
  被否：裁判档内自读自解析（第二读取器 + 第二根解析——KD-M1-18 禁形）· 投影落 `manifest.mjs`（分类语义挤入项目模型模块——两个所有者）· 保留 `loadConventions` 名（名实不符）。落点 = KD-M1-33。
- **裁决三（退役全链 + 旧档处置）** = 旧链全删（无兼容读 / 无弃用期并行）；旧档在场 = **一行可见告警**（`console.warn` + `logEvent('declaration:retired-file')`）+ 存在性检查（`existsSync`——**内容零解析**、零回退）——告警 ≠ 机制。
  被否：静默不读（旧声明静默失效——本板块问题本体）· 兼容读 + 告警（双机制并存——用户逐字否）· 自动迁移脚本（一次性动作造第二条写路径）。落点 = KD-M1-34 + `PORTABILITY.md` D15。
- **补裁决（校验口径）** = 三族键形态错 = MANIFEST 非法（fail-closed，与 `docRoot` 子键同款）；消费面遇档不可用 ⇒ 三族逐条回默认 + 可见（缺档静默 / 非法与读错加 warn + 日志事件）。
  被否：逐键降级（两套校验语义 + 弱可见——VS Code 扩展宿主里 `console.warn` 近乎不可见）· 非法即静默按默认。落点 = KD-M1-32 + D16。

### 2.7 上抛项

1. **需求侧同步（需求档笔权 = 父侧，只报不改）**：`docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MANIFEST.md` ②.1（`:13`）「schema 定义（五键）」与 `:58`「现五键」句；`docs/core/requirements/PORTABILITY.md` F2（`:27`）「声明文件 = `.thincoder/conventions.json`」句 + `:50` 本仓自用声明句（现载体 = manifest 三族键；写法建议 = 换载体名词 + 指向设计档 §3.1）。
2. **旧档告警文案（产品文案面）**：告警句逐字由实施舱落（本设计给语义与事件名；句形建议 `[declaration] .thincoder/conventions.json is retired and no longer read — move codePaths / index.*Extensions / advisor.{docMap,standardsDoc} into PROJECT-MANIFEST.json`）。
3. **本仓数据档零改**：`thincoder/PROJECT-MANIFEST.json` 不加三族键（默认即正确——全工作区零该档实核）；`initManifest` 产物才带三族默认值。
4. **（观察 · 非阻塞）**：`.thincoder/tmp/**` 快照（`core-pkg` / `core-probe` / `cli-pkg`）内含旧符号副本——临时面（机器不读），本批零触碰。
5. **（观察 · 非阻塞）**：`doc-check` 仓级基线 = 悬空 49 / 行宽 32（本批设计档贡献 0——新增行全部入册或落报告面）。

### 2.8 修正轮（设计评审轮 1 · 发现 1–8 点修 · 2026-09-27）

**行数回填（发现 8）**：`thincoder-core/conventions.mjs` 224 ⇒ **254**（设计档 `MANIFEST.md` §2.3 行 31 已回填；净 ±15 后仍 < 300）。
同族读数回填（as-of 2026-09-27 20:1x 读盘——含豁免批在飞增量；实施轮开工前按既有注复读）：CLI `test/portability-classification.test.mjs` 221 ⇒ **298** · VSC `test/portability-vsc-classification.test.mjs` 237 ⇒ **293**。

**受影响面补足（自探得 · 一致性面）**：
① `thincoder-core/agent-tools/advisor.mjs:13` 注释含退役符号名 `loadConventions`（J6「符号面零命中」否则不可达）⇒ 设计档 §2.3 +行 35（注释收正 · Δ=0）；
② VSC `src/extension/panel-index.mjs:220` 注释含 `conventions.json` 字面（J6 字面命中集）⇒ 并入行 33 面收正。

**评审发现 2 落判（增量钉死 + 越限判定）**：行 32 / 33 / 34 逐档 Δ 上界钉死（核 `dispatch.mjs` ≤ +1 ⇒ ≤500 硬限内）；
`thincoder-core/test/manifest.test.mjs`（479 + 增量越 500）**同批执行已登记拆分**——发现 / 归属面用例组（T41–T45 / T48 / T54 + 夹具 helper）拆入新档 `thincoder-core/test/manifest-discovery.test.mjs`（纯搬移零语义）⇒ 设计档 §2.3 +行 36；>300 软线面逐档方案 + 触发条件入设计档表下新注块。

**其余点修落点（逐条）**：#1 架构档 §2.3 E1 键面（JSON + 键注释 + 校验句）+ `MANIFEST.md` §2.5 计数句 / 扩列清单；
#3 §2.2 三族形态判据两层分列（元素层 / 数组层 + 空数组语义逐键）；#4 AC-31–AC-34 回指补 **AC-M1-9**（父侧已落规格 `:47`）+ AC-34 补告警基准断言；
#5 / #6 `PORTABILITY.md` §3.2 声明对象形状行 + §3.1 / §3.4 退役告警钉死（落点 / 基准 / 频次）+ T-30 / T-V26 基准断言；#7 规格侧计数改「已同步（2026-09-27）」。

**扫尾三条读数（out-of-scope note 处置）**：`docs/core/design/ENG-TOKEN-BINDING.md:152`（AC-M4-5 活体判据）`loadConventions` ⇒ **`loadProjectDeclaration`**（换新名）；
`docs/core/design/DESIGN-TOKEN-SETTLEMENT.md:150`（F3 活体方案行）失效「替代 `loadConventions`/`isDocPath` 分类」句 ⇒ **删**（历史沿革由 v2 批系记录承接）；`docs/core/design/WORKSPACE.md:28`（§2.1 = 裁定行逐字搬入 · **记录面**）⇒ **保留**。

**机检读数**：`cd thincoder && node scripts/doc-check.mjs --root .` ⇒ 悬空 **49** / 行宽 **32**（= 批前基线，本批新增零入闸；新增「拟新增」登记 2 条——列报 · 不入闸）。

### 2.9 修正轮（设计评审轮 2 · 发现 1 / 3 / 4 / 5 / 6 点修 · 2026-09-27）

**逐号落点**（#2 = 父侧已落，本轮零触碰）：

| # | 号 → 改动 file:line |
|---|---|
| 1 🟡 | `docs/core/design/ENG-TOKEN-BINDING.md:168`（变更记录 +1 行：2026-09-27 · 扫尾——§9 AC-M4-5 符号名随本批改名收正 `loadConventions` ⇒ `loadProjectDeclaration`；零语义） |
| 3 🔵 | `docs/core/design/MANIFEST.md:286`（`SPEC-MANIFEST.md` `:58` ⇒ **`:59`**）+ 变更记录 +1 条（`:638`） |
| 4 🔵 | `MANIFEST.md:259` / `:468`（FR11 锚 `docs/core/requirements/PORTABILITY.md:62` ⇒ **`:63`**）+ 同族短形第三处 **`:266`**（同判，自探补足——一致性面）+ 变更记录同条（`:638`） |
| 5 🔵 | `docs/core/design/ENGINEERING-MODE-V2.md:533-534`（2026-09-27 条目补 **E5.1 表第 8 行落点**——项目级枚举去退役档；零净行） |
| 6 🔵 | `docs/core/design/PORTABILITY.md:59`（`declared` 判据钉死 = **值比较**：与缺省值等值 ⇒ 假；显式写入但值 = 缺省照判假，不按键存在性）+ `:74`（补「**值比较**」）+ 变更记录 +1 条（`:263`） |

**自探补足（一致性面 · 随本笔）**：① `docs/core/design/DOC-MIGRATION.md:370` 引 `ENG-TOKEN-BINDING.md:171` 随发现 1 插入 +2 ⇒ 收正 **`:173`**（防引入新漂移）；② `MANIFEST.md` 变更记录插入 ⇒ 该档 ≥`:638` 行整体 +2（批档内引 `MANIFEST.md:638-641` 等 = 记录面 as-of，未回改）。

**发现 6 附带核（T56 / T57）**：两例断面 = manifest 读 / 校验（不读 `declared`；`declared` = 声明对象字段，单源 = `PORTABILITY.md` §3.1/§3.2）⇒ **不需要**同判句；「显式写入但值 = 缺省」矛盾格现无用例钉死——按父侧裁定只钉句（**未加用例**，不新增语义；如需用例面钉死 = 另裁）。

**行宽自检**：`PORTABILITY.md:74` 首笔改写触 309 ⇒ 就地收窄至 **297**；全部改写 / 新增行 ≤300。

**机检读数**：`cd thincoder && node scripts/doc-check.mjs --root .` ⇒ 悬空 **49** / 行宽 **32**（= 批前基线逐项相等——**本批新增零入闸**）；候选 28061 ⇒ 28070（+9 = 本笔新增 token，全解析）；符号·宽（报告面）悬空 475 ⇒ 476（+1 = `ENG-TOKEN-BINDING.md:168` 的 `loadProjectDeclaration`——报告面，不入闸）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象**：「conventions.json 退役」批（退役声明档 + 必备功能并入 `PROJECT-MANIFEST.json` + 双机制零并存 · 台账 #464）——设计面 = `docs/core/design/PORTABILITY.md`（§3.1/§3.2/§4 D2/D13–D16）+ `docs/core/design/MANIFEST.md`（§2.2/§2.4 KD-M1-31–34/§2.5/§3.1 AC-31–34/§3.2 T56–T58）+ `docs/core/design/ENGINEERING-MODE-V2.md`（§2.2/§2.3/§3.1 计数收正）+ 需求两档（F2 + 规格档八键）。

**评审面限定**：无项目标准档、无文档地图声明（所有权维度按 Project Guide 与各档自述 D2 惯例评估）；按判据 8 要求对受影响文件表做了行数实读抽查（仅读行数，未评代码/用例）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership（跨档口径） | 🔴 | ENGINEERING-MODE-V2 §2.3 E1 键面未收正而两处自称已收正：E1 JSON schema 块（`docs/core/design/ENGINEERING-MODE-V2.md:126-145`）+ 键注释（`:147`）+ 校验句（`:149`）仍五键；同档 AC3（`:495`）与变更记录（`:529`「E1 键面收正……落点 = §2.2 M1 行 + §3.1 AC3」）称八键；`docs/core/design/MANIFEST.md:270` 断言「架构 §2.2 M1 行 / §2.3 E1 JSON / 本档 §1.2 F1 / §2.2 接口四处均八键」——与现盘不符。同一机制（schema 键集）两处描述不一致 ⇒ 不降级 | E1 的 schema 块 / 键注释 / 校验句补三族键，或改为「键面以 `MANIFEST.md` §2.2 为准」指针；同步 `MANIFEST.md:270` 的一致性断言与 `:629`⑦ 同步清单——两侧取一，使跨档口径一致 |
| 2 | Affected-file size（结构限额） | 🔴 | §2.3 行 32（`MANIFEST.md:181`）核 `agent/dispatch.mjs` 499 行 + Δ 上界 +4 ⇒ 503 > 500 硬限，设计内（含 `:190-199` >300 拆分评审注）无该档拆分方案或越限判定；行 34（`:183`）整组增量外指「见批档 §2.4」（设计内无 Δ），其中核 `test/manifest.test.mjs` 479 行承接 T56–T58，行 19 已登记方案（`:194`）触发条件「越 500 硬限」未评估。实读复核：dispatch.mjs = 499 行 · manifest.test.mjs = 479 行（与标注一致） | 逐档钉死 Δ 上界（≤N 或「结构不变/Δ=0」）；越限档补拆分方案并同批判定（`test/manifest.test.mjs` 按 `:194` 已登记方案拆发现面用例组；`dispatch.mjs` 另拟方案或钉 Δ≤0）；`agent-tools/verify.mjs` 296 · VSC `test/memory-index-face.test.mjs` 298 在标称增量下将越 300 软线——按既有体例补 >300 拆分评审注 |
| 3 | Clarity（形态判据） | 🟡 | `MANIFEST.md:116`「`codePaths` = 非空字符串数组（元素 `trim` 后非空）；`index.*` = 非空字符串数组」与 `:113`（`codePaths` 空数组合法）、`:97`（`index` 缺省 `[]`）、`:613`（T57 对照 `codePaths:[]` ok:true）相抵——照字面实现会把 `[]` 判非法（默认档自身即被拒，与 T58 相抵） | 逐键写明空数组语义（`codePaths:[]` = 无段名代码面；`index.*:[]` = 追加零项），「元素须为非空字符串」与「数组本身可空」分列表述 |
| 4 | Acceptance（需求链 · 协调项） | 🟡 | AC-31–AC-34 回指只有批档 §2 + KD（`MANIFEST.md:541-545`）；规格档 ④ 无三族键对应 AC 锚（`docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MANIFEST.md:38-46` 止于 AC-M1-8）；设计 §4⑦（`:629`）「需求侧待同步」清单亦未登记该项 | 规格 ④ 补一条三族声明键 AC（形态 fail-closed + 退役档零并存），设计 AC 表回指之；暂不落则登记为协调项，勿留悬空锚 |
| 5 | Clarity（API 契约） | 🔵 | 声明对象形状未给全：`PORTABILITY.md:59` 定义 `declared` 并由门禁 hint 消费（`:94`），而 §3.2 行 1/行 6（`:66`/`:71`）只写「归一为声明对象」「全默认声明对象」（旧物返回面含 `declared`——`thincoder-core/conventions.mjs:217-219` JSDoc） | §3.2 补声明对象形状行（`{declared, codePaths, index, advisor}`）与 `declared` 判据（三族任一偏离缺省） |
| 6 | Clarity（退役告警） | 🔵 | 退役告警未钉检查落点与基准目录：`PORTABILITY.md:60`/`:95` · `MANIFEST.md:544` 只写「一行告警 + 存在性检查」，而 `loadProjectDeclaration(cwd)` 按档路径缓存（`PORTABILITY.md:66`）——`existsSync` 以 cwd / 项目根 / 两者为准未写，多项目或非根锚下可能漏报（「哨兵失效不可见」不可再现） | 钉死告警基准（建议同 `manifestFilePath` 的项目根）与触发频次（每缓存一次），并在 T-30 / T-V26 断言基准 |
| 7 | Doc hygiene（待同步登记） | 🔵 | `MANIFEST.md:270` 与 `:629`⑦ 仍写「规格侧待同步——`SPEC-MANIFEST.md` ②.1（`:13`）与 `:58`『现五键』句」，而规格档两处已是八键（`docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MANIFEST.md:13` · `:58`，变更记录 `:81`） | 该两处改「已同步」，并把仍存缺口（见 #4）替换进清单 |
| 8 | Affected-file size（行数复核） | 🔵 | 行数标注失实：`MANIFEST.md:180` 给 `thincoder-core/conventions.mjs` 224 行，实读现盘 254 行（差 30；疑并行在飞批改动同档）。其余抽查档一致（`manifest.mjs` 451 · `dispatch.mjs` 499 · `memory/code-sync.mjs` 428 · `verify.mjs` 296 · `test/manifest.test.mjs` 479 · VSC `test/memory-index-face.test.mjs` 298） | 复读回填该档行数（254+15 仍 < 300，无拆分面影响），沿用「开工前复读行数」注 |
| 9 | 计数（doc-state） | 🔵 | `docs/core/requirements/PORTABILITY.md:4` 档头计数「F1–F8 / N1–N4」，§2 现行 F1–F9（疑在途批残留面） | 档头收正为 F1–F9 / N1–N4，或登记为待收正项 |

**Out-of-scope note（不赋级）**：本批将删符号 `loadConventions` 仍在三处非本批声明面出现——`docs/core/design/ENG-TOKEN-BINDING.md:152`（AC-M4-5 判据句，本批 D12 引用之）· `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md:150` · `docs/core/design/WORKSPACE.md:28`（模块登记行）；三档不在本批受影响文件表（`MANIFEST.md:181-183`）内——本席只报可见性。

**计数 = 2🔴 / 2🟡 / 5🔵（共 9 条）+ 1 条 out-of-scope note（不赋级）**

VERDICT: changes-required

### 轮次 2（评审子代理）

**复审轮 2** —— 只校 §3 轮次 1 的 9 条（#1–#8 + 扫尾）经修正轮 #104 的落地 + 显眼新增；审阅面 = 设计三档（PORTABILITY / MANIFEST / ENGINEERING-MODE-V2）· 需求两档（PORTABILITY / SPEC-MANIFEST）· 扫尾两档（ENG-TOKEN-BINDING / DESIGN-TOKEN-SETTLEMENT）。

落地核查：修正轮各条逐条在位（#1 E1 键面八键 + 扩列补 E1；#2 行 35/36 + `manifest.test.mjs` 同批拆计划 + 逐档 Δ 钉死块；#3 三族形态判据两层分列；#4 AC-31–AC-34 回指 AC-M1-9 + AC-34 告警基准断言；#5/#6 声明对象形状句 + 退役告警钉死（落点/基准/频次）+ T-30 / T-V26 基准断言；#7 规格侧「已同步」且 `SPEC-MANIFEST.md:13`/`:47` 实位相符；#8 `conventions.mjs` 254 与用例两档行数实核相符）。行数标注抽检 9 档全对：`conventions.mjs` 254 · `manifest.mjs` 451 · `dispatch.mjs` 499（≤500 钉死成立）· CLI `portability-classification` 298 · VSC `portability-vsc-classification` 293 · 核 `manifest.test.mjs` 479 · `index-discover.mjs` 177 · CLI `portability-advisor-context` 10 · 核 `advisor.mjs` 281。扫尾两档符号面：`ENG-TOKEN-BINDING.md:152` 已用新名 `loadProjectDeclaration`（唯一命中）、`DESIGN-TOKEN-SETTLEMENT.md` 零命中——退役物名（`loadConventions` / `DEFAULT_CONVENTIONS` / `CONVENTIONS_REL_PATH` / `clearConventionsCache`）在七档内仅存于删除清单 / 被否备选 / 历史记录等合法语境。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 文档记录 | 🟡 | `docs/core/design/ENG-TOKEN-BINDING.md:152` 已含本批新名 `loadProjectDeclaration`（扫尾改名落笔在位），但该档「变更记录」无 2026-09-27 条目，修正轮两处记录（`MANIFEST.md:638-641` · `PORTABILITY.md:257-259`）亦未列该档——落笔未留痕 | 在该档变更记录补一行（例：2026-09-27 · 扫尾——§9 AC-M4-5 符号名随本批改名收正（`loadConventions` ⇒ `loadProjectDeclaration`）；零语义） |
| 2 | 文档一致性 | 🟡 | `docs/core/requirements/PORTABILITY.md:43`（N4）称「专项用例三档在位」并列 `thincoder-vscode/test/portability-vsc-index.test.mjs`——该档盘上不存在（本端仅 `portability-vsc-classification.test.mjs` / `portability-vsc-advisor-context.test.mjs` 两档）；设计侧已登记「W8 已退役——用例核面承接入 `memory-index-face.test.mjs`」（`docs/core/design/PORTABILITY.md:183`） | N4 收正为现行两档 + 承接入的核面档（既有跨档滞后——非轮次 1 清单内） |
| 3 | 坐标漂移 | 🔵 | `docs/core/design/MANIFEST.md:286` 引「`SPEC-MANIFEST.md` `:58`『现八键』句」——实际在 `:59`（`:47` 行插入 AC-M1-9 后下移一位） | 引用改 `:59` |
| 4 | 坐标漂移 | 🔵 | `docs/core/design/MANIFEST.md:259` / `:468` 两处引 `docs/core/requirements/PORTABILITY.md:62` 为 FR11——实际 FR11 在 `:63`（`:34` 行新增 F9 后下移一位） | 引用改 `:63`（或去行号锚） |
| 5 | 记录完整性 | 🔵 | `docs/core/design/ENGINEERING-MODE-V2.md:328`（E5.1 表第 8 行）现值含「`PROJECT-MANIFEST.json`（含声明三族键——同档）」，与该档 2026-09-25 记录所述（`:537`：项目级 = 台账 / `PROJECT-MANIFEST.json` / `.thincoder/conventions.json`）不一致；两条 2026-09-27 条目（`:532-534`）未列该行 | 补记该行收正（或核对落笔轮次后回填条目） |
| 6 | 清晰度 | 🔵 | `docs/core/design/PORTABILITY.md:59` / `:74` `declared` 判据双措辞（「任一族偏离缺省」＋括注「被改写即真」）——「显式写入但与缺省同值」格上两种实现可分歧（值比较 vs 缺失键判定），且无用例钉死 | 一句话钉死：与缺省值等值 ⇒ 假（即按「偏离缺省」= 值比较） |

VERDICT: pass

计数：🔴 0 · 🟡 2 · 🔵 4

## §4 用户批准（主 agent）

**2026-09-27 20:4x · 父侧代签**（用户 20:08「后续自动跑完吧」全链授权——代点火 / 代签 / 派发 / 收口；自缚三条件核验在档）。

**三条件** ✓：
① 设计评审轮 2 = **pass**（🔴 0——§3 轮次 2：6 条非阻塞，判 = 1 Fixed〔#2 需求档 N4 = 父侧直落〕+ 5 Dispatched〔#1 / #3 / #4 / #5 / #6 → #107 落地，父侧实读核验：`ENG-TOKEN-BINDING.md:168` 记录行 · `MANIFEST.md:286` `:59` · `:259` / `:266` / `:468` `:63` · `ENGINEERING-MODE-V2.md:533-534` E5.1 落点 · `PORTABILITY.md:59` / `:74` 值比较 + 自探补足两处〔`DOC-MIGRATION.md:370` ⇒ `:173`〕〕）；
② 修正落地并逐条核验 ✓（#104 九条 + #107 五条——见 §1.5 / §1.6 裁定表）；
③ token 已签发（值不落档——运行时凭证）。

**批准范围** ✓：§2 三件覆盖（退役全链 / 三族键并入 manifest / 双机制零并存）+ §2.4 受影响 **23 档**（行 30–36）；实施 = 单舱（eng-coder · 本批唯一在途——桌面 / 豁免批已收口，工作树 = 本批独占面）。
**起跑注** ✓：§2.3 说明「开工前复读行数 + 他批并行串行」——现无并行他批，复读仍由实施舱执行（行数 as-of 参考）。

## §5 实施记录（eng-coder）

**状态行**：实施完成

### 5.1 交付摘要（批 §2 三件覆盖）

**单舱交付**（触碰 23 档 = 设计 §2.4 行 30–36 名单逐档相等；工作树另有一并行批「桌面 UI 对齐」在飞——`docs/desktop/**` · `thincoder-desktop/**`，与本批文件面零交叠）：

- **装载换源**（`thincoder-core/conventions.mjs` 254 ⇒ 244）：删 `CONVENTIONS_REL_PATH` / `loadConventions` / `clearConventionsCache` / `DEFAULT_CONVENTIONS` / `typeErrorsOf` / `DEFAULT_CODE_PATHS`（零兼容读 / 零弃用期）；新增 `loadProjectDeclaration(cwd)`（`manifestFilePath` 单源定档路径 → `readManifest` 单源读取 → 归一 + 冻结 + **按档路径缓存**）/ `clearDeclarationCache()` / `DEFAULT_DECLARATION`（由 `DEFAULT_MANIFEST` 三族默认值构造——默认值单源）+ 退役告警点（存在性检查、内容零解析、`console.warn` + `logEvent("declaration:retired-file")`、基准 = `dirname(manifestFilePath(cwd))` 项目根、频次 = 每缓存一次）。
- **三族键入 schema**（`thincoder-core/manifest.mjs` 451 ⇒ 482）：`DEFAULT_MANIFEST` 八键（+`codePaths:["src"]` / `index:{codeExtensions:[],docExtensions:[]}` / `advisor:{docMap:"",standardsDoc:""}`）· `MANIFEST_SCHEMA.nestedKeys` 补 `index` / `advisor` · `validateManifest` 三族形态判据（元素层非空字符串 / 数组层自身可空；fail-closed 点名键）· `fillDefaults` 嵌套分支（三族非对象值原样透传、再校验拒）· 头注契约行。
- **消费面 12 档换名 + 文案 4 处**：门禁 hint 两端逐字同文；`cmd-reindex.mjs:48` ∥ `panel-index.mjs:197` 各换 `PROJECT-MANIFEST.json`（原句除文件名外逐字不变）；`advisor.mjs:13` / `panel-index.mjs:220` 注释收正。
- **用例面 7 档**：夹具换档（`declare()` 写 `PROJECT-MANIFEST.json`）+ 调用换名 + 既有同号收正（CLI T-01/T-03/T-04/T-05/T-09 · VSC T-V01/T-V03/T-V04/T-V05）+ 新增 T-29–T-32 / T-V25–T-V26 / T-56–T-58 + AC-33 源码面结构断言。
- **拆档**：`thincoder-core/test/manifest.test.mjs` 479 ⇒ 355；新档 `thincoder-core/test/manifest-discovery.test.mjs` 210 行（发现 / 归属面用例组 T41–T45 / T48 / T54 / projectView 五态 + 夹具 helper；纯搬移零语义，用例数守恒 24 + 3 = 27）。

### 5.2 判据线逐条读数（J1–J10 · 实测）

| # | 判据 | 读数 |
|---|---|---|
| J1 | 分类面 | `codePaths:["lib"]` ⇒ `lib/a.md`=code ∧ `src/a.md`=doc ∧ `declared=true`（CLI T-03 / VSC T-V03 绿） |
| J2 | 无档逐条等值 | `loadProjectDeclaration(tmp)` deepEqual `DEFAULT_DECLARATION` + `declared===false` + 五值读数 code/doc/temp/aux/code（CLI T-29 / VSC T-V25 绿） |
| J3 | 索引面 | `index.codeExtensions:[".xyz"]` ⇒ `indexExtensions(tmp).code.has(".xyz")` + `codeSync` 收录（T-16 绿） |
| J4 | 注入面 | `advisor.docMap` / `standardsDoc` 返回声明路径（T-32 绿）；未声明 ⇒ 探测 / 降级句零改 |
| J5 | 旧档在场 | 哨兵 / 坏 JSON 两态：读数等值默认 + 恰一行 warn + `declaration:retired-file` 事件 + 内容零解析（无 JSON 错误句）+ 基准断言（cwd 深于项目根仍命中）——CLI T-30 / VSC T-V26 绿 |
| J6 | 零并存 | 退役符号全仓 `*.mjs`（除 `.thincoder/tmp/**`）**零命中**；`conventions.json` 字面代码面只剩 `thincoder-core/conventions.mjs:15/21/45/214`（告警常量 + 其头注 / JSDoc），余者在用例面（11 处：夹具 + 告警断言） |
| J7 | 文案面 | 两端门禁 hint 逐字同文（`dispatch.mjs:209` ∥ `tool-gates.mjs:98`）；两处索引提示行各含 `PROJECT-MANIFEST.json`（`memory-index-face.test.mjs:296` 逐字钉死） |
| J8 | fail-closed / 降级 | 三族形态错 ⇒ `readManifest` `reason:'invalid'`；消费面整声明回默认 + warn + 事件 + 不抛（T-31 / T-57 绿） |
| J9 | 跨批随动 | `codePaths:["src","test"]` ⇒ `test/x.mjs`=code（T-26 / T-V22 绿——豁免批 J11 语义在新落点可执行） |
| J10 | 全绿 | 核 **710/710** · CLI **884/884** · VSC **1015/1015**（0 fail）；`doc-check`：悬空 **49** = 基线（本批零新增）· 行宽 32 ⇒ **33**（+1 = 并行桌面批 `docs/desktop/requirements/PROJECT.md` 所改，非本批） |

### 5.3 决策透明表（实施轮落笔 / 偏离）

| # | 事项 | 处置 | 依据 |
|---|---|---|---|
| 1 | **Δ 上界越限**（用例面两档） | 只报不改：CLI `portability-classification.test.mjs` **372** 行（设计上界 ≤348）· VSC `portability-vsc-classification.test.mjs` **352** 行（上界 ≤328）——三例新增 + 事件断言 + 夹具开销超设计估算；两档均未越 500 硬限。设计面数值回填 = 设计档笔权（非本舱） | 设计 `MANIFEST.md:209` |
| 2 | **`manifest-discovery.test.mjs` 多带一例** | 未编号 `projectView 五态归位` 随组迁入（其夹具 helper `childRepo` / `ladderFixture` 属枚举搬迁面；不迁则主档须留重复 helper）——纯搬移，用例数守恒 | 设计 §2.4 行 36「用例组 + 夹具 helper」 |
| 3 | **T-16 期望值 2 ⇒ 3** | 载体换源后档落项目根，`.json` 属内置代码扩展名 ⇒ `codeSync` 多收 `PROJECT-MANIFEST.json` 本体（与 package.json 等既有 JSON 面同判，非新机制） | J3「只增不减」 |
| 4 | **旧档告警句形落笔** | `[declaration] .thincoder/conventions.json is retired and no longer read — move codePaths / index.*Extensions / advisor.{docMap,standardsDoc} into PROJECT-MANIFEST.json` + 事件 `declaration:retired-file` | 批 §2.7 上抛 2（句形由实施舱落） |

### 5.4 审计与代码评审轮次（终态）

| 轮 | 面 | 终态 | 摘要 |
|---|---|---|---|
| 探索审计（explore · 只读） | 交付 vs 设计（J1–J10 + 设计要点） | clean（零 out-of-list / 零静默降级） | 4 条提示：Δ 上界越限（含 `portability-advisor-context` 未交底档——已修至 48 行 ≤50）· AC-33 机检面缺档（已补）· 设计侧回填未落（父侧）· `§4.1` 死指针（已收正） |
| 代码评审轮 1（advisor type=code） | 实现面 23 档 | **pass**（🔴 0 · 🟡×3 / 🔵×2） | 🟡 ① T58 未闭合 / AC-33 嵌套 ② Δ 上界越限（父侧）③ >300 名单（R3 已登记——不升级）；🔵 ④ `conventions.mjs` 字面计数口径（父侧）⑤ 注释旧路径 `src/conventions.mjs` |
| 代码评审轮 2（advisor type=code） | 仅核修复声明（3 档） | **pass**（0 新问题） | ① T58 已闭合 / AC-33 同级化 ✓ ② 两处注释路径收正 ✓；其余三项 = 父侧排除面，未复裁 |
| fix round（自修 5 条 · 收敛） | — | — | ① T58 闭合 + AC-33 同级化 ② AC-33 结构断言改值形（免碰 core-hygiene 说明符扫描）③ `portability-advisor-context.test.mjs` 63 ⇒ 48 行（回上界内）④ `manifest.mjs` 注释去 `conventions.json` 字面（J6 代码面收口）⑤ 两档注释旧路径收正 |

### 5.5 上抛父侧（只报不改）

1. **设计面数值回填**（`MANIFEST.md` §2.3 行 36 / 注块）：`manifest.test.mjs` 拆后实读 **355**（设计估 ≈410）· 新档 `manifest-discovery.test.mjs` 实读 **210**（设计估 ≈150）· 用例面两档越 Δ 上界（372 / 352）。
2. **`.wt-head-probe/`**（工作区根探针工作树）含退役符号副本——J6 排除清单未含该面（本批声明面 `thincoder/` 树零命中不受影响），仅报可见性。
3. **需求 / 设计侧无待办**：`PORTABILITY.md` §3.1 / §3.2 / §3.4 / §5 与实现逐条一致（无漂移需回改）。

## §6 验证与收口（父代理）

### 6.1 实施核验（父侧亲跑 + 实读）

- **三套件亲跑** ✓：核 **710/710** · CLI **884/884** · VSC **1015/1015**（fail / cancelled 0）——与 §5 读数逐值一致。
- **关键面实读** ✓：`conventions.mjs:221-244`（`loadProjectDeclaration`——`manifestFilePath` 单源 / 档路径缓存 / 缺档静默 / 非法与读错 ⇒ warn + `declaration:error` + 不抛）；退役告警（`existsSync` 内容零解析 · 基准 = 档所属项目根 `:225-226` · 每缓存未命中一次 · `:201-205`）；`buildDeclaration` 值比较 `declared`（`:170-188`）· `DEFAULT_DECLARATION` 由 `DEFAULT_MANIFEST` 构造（`:192`）✓。
- **判据线** J1–J10 读数在 §5——父侧采信 + J5（警告基准）/ J6（零并存）/ J7（两端逐字）坐标抽读在位。
- doc-check：悬空 49 = 批前基线；行宽 +1 = 并行桌面批（非本批）✓。

### 6.2 只报项裁定

| # | 裁定 |
|---|------|
| 1 设计面行数回填 | **Fixed**（**父侧直接执行**〔例外②③〕 · 可 revert）：`MANIFEST.md` §2.3 块——拆后 **355** / 新档 **210** + 实施轮实读回填行（`:205-216` 块尾）。 |
| 2 用例面 Δ 上界越限（+24 × 2） | **Fixed（回填 + 维持预案）**：实读 372 / 352——均未越 500 硬限，不拆（拆分 = 徒增轮次）；**触发语义钉死**：越限即拆 / 「下一次触碰」= 复核点（`MANIFEST.md:214-215` 同笔）。 |
| 3 J6 字面计数口径 | **Fixed（口径记此收正）**：§1.3 原句「字面恰一处（告警点）」⇒ 实况 = 常量 + 头注 / JSDoc **4 处**（`conventions.mjs:15/:21/:45/:214`）+ 用例面 11 处；**代码面零读引用**成立（实质口径不变）。 |
| 4 `.wt-head-probe/` | 观察登记（声明面 = `thincoder/` 树零命中；探针工作树在仓库树外——零动作）。 |
| 5 并行批 doc-check 影响 | 已核 ✓（+1 行宽归桌面批）。 |
| 6 §6 / 台账 | 本段即办。 |

### 6.3 D7 结算面

- 角色表：§1 父侧 · §2 eng-designer · §3 评审 · §4 父侧（代签）· §5 eng-coder · §6 父侧 ✓。
- 计数：覆盖 3 件全 ✅ + 用例面（新增 12 例 + 同号收正）+ 拆档 1；过程件 = 设计两轮 + 修正两轮 + 实施舱 1（审计 clean + 代码评审双轮 clean）。
- 指针：需求档 F2（`:27`）· 规格 八键 + AC-M1-9（`:13` / `:47` / `:59`）✓ 可解析。
- 台账：**#464 核销**；#465 在册（归批）。
- 前批遗留交叉核：无未收口锚 ✓。
- 提交：本批 23 档 + 设计随动 6 档 + 需求 2 档 + 本批档（单笔路径限）→ 双远端推送（origin + github 走 proxy）。
