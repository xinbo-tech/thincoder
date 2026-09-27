# 2026-09-27 · 工程模式写门放行
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-27 · 来源 = 用户 2026-09-27 19:0x「工程模式工具限制我想改一下……我希望规定 test 和 scripts 目录主 agent 可以写代码」（19:2x 追加：对 `.thincoder/conventions.json` 声明面判「过度工程」⇒ 本批不用声明面，走缺省面）。
> 台账 = #462（工程模式 · 写门缺省放行 · 需求 F9）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-27

### 1.1 条目与口径（父侧 · 2026-09-27 19:2x ✓）

**来源** ✓：用户 19:0x「工程模式工具限制我想改一下——目前主 agent 完全不能写代码，但测试时会需要用代码，所以我希望规定 test 和 scripts 目录主 agent 可以写代码」；19:2x 追加裁定：`.thincoder/conventions.json` 声明面 = **过度工程** ⇒ 本批**不用声明面 / 不新增配置键**，走**分类缺省**面（方案 B 弃）。

**本批一句话**：工程模式**父侧写门**的分类缺省放行 `test` / `tests` / `scripts`（任意深度）与 `.thincoder/tmp/**` —— 使父侧写测试与临时驱动无须设计令牌，落既有政策（测试档随修随加 · 工程工具面父侧直改）；**不新增配置面、零碰声明文件**。

**条目（一件 · 需求 F9 · 台账 #462）**：

| # | 条目 | 判据线（机器可检） |
|---|---|---|
| 1 | 父侧门分类缺省：`test` / `tests` / `scripts` 段（任意深度）+ `.thincoder/tmp/**` ⇒ 非代码面 | ① `classifyPath("test/x.mjs")` ≠ code ∧ `classifyPath("tests/a/b.md")` ≠ code ∧ `classifyPath("scripts/x.mjs")` ≠ code ∧ `.thincoder/tmp/a.mjs` = 非 code；② **代码段优先级在前**：`classifyPath("src/test/x.mjs")` = code（反例）；③ 两端同判（核 `thincoder-core/agent/dispatch.mjs` ∥ VSC `tool-gates.mjs`——VSC 随核单源）；④ **eng-coder 门行为零变**（token 门不动）；⑤ 既有 portability 用例零改全绿 + 新判据用例 |

**边界（不在本批）** ✗：
- **CI（`.github/**`）不并入**——用户射程字面 = test/scripts；CI 面若也要 = 另裁。
- **`conventions.json` 声明面零触碰**（其退役 ∥ 保留 = 另条在册待裁）。
- **eng-coder token 门**（`dispatch.mjs:172-180`）不动——实现面仍走舱。
- 需求档 F9（父侧笔）已随本批落（`docs/core/requirements/PORTABILITY.md` §2 + 变更记录）。

**证据** ✓（父侧实测 · 2026-09-27）：写 `.thincoder/tmp/*.mjs`（仓内）∥ 仓外 OS-temp `.mjs` **均被父侧门拒**（拒文「this path was classified as product code by the default conventions (code paths: src)」）；机制实况 = 分类器兜底「非 doc/temp ⇒ code」（`thincoder-core/conventions.mjs:73-79`）+ 门消费 `isCodePath`（`dispatch.mjs:195-217`）。**政策落差**：工程工具面父侧直改（提示词已载）∥ 测试档随修随加（用户 2026-09-27 裁定）**与机制拦阻相抵**——本批消解该落差。

### 1.2 授权与门

**授权口径** ✓：用户 19:0x 立需求 + 19:2x 定形（弃声明面）＝ 设计轮点火授权；**设计评审点火 + §4 批准**按常规（用户侧门）；实施舱按流程派。

### 1.3 设计轮产出核验（父侧 · 2026-09-27 19:3x ✓）

**核验** ✓（父侧实读：设计档 diff 逐段 + §2 逐段 + 独立实核「零改全绿」承诺）：
- **两裁决采信** ✓：① 改点 = 分类器本体（单一权威 F1/FR12——「什么算产品代码」只能一个答案）；② 三值扩**四值 `aux`**（置 temp/doc 之后、兜底之前——最小差分：唯曾落兜底 code 的辅助面路径改判）——两否决族理由在场（复用 temp = 同词两义误伤 / 复用 doc = 语义不实），设计档 §4 D9–D12。
- **「既有用例零改全绿」独立实核** ✓（父侧 grep 全仓 `*.test.mjs`）：既有 portability 两档对 `test` / `tests` / `scripts` / `.thincoder/tmp` 路径**零断言**；`hasCodeMutations` 既有断言全用 `src` / `docs` / `lib` / `tmp-x` 形态——分类逐条不变 ⇒ 承诺成立。
- **消费面差分已核销在册** ✓（§3.7 七面）：其中「verify 代码文件集 / 推送守卫 / 陈旧判定」三处**行为差分 = 接受并登记**（aux = 非产品代码的直接推论，消解路径在册）——**如实交底用户侧**（见 §1.4）。
- **需求档就手收正** ✓（**父侧直接执行** · 可 revert）：F9 判据示例路径改占位形（`test/<x>.mjs` 等）+ 变更记录行——doc-check 悬空锚收正；行宽撞线（347）拆行后复跑：本面**入闸 0**（余 = 既有迁移期引文 ×2 + 报告面符号 ×2，均不入闸）。

**下一步** ✓：设计评审（点火权 = 用户）⇒ pass ⇒ §4 ⇒ 实施舱（含提示词面落笔——内容 = 父侧、句位见 §2.7）。

### 1.4 设计评审轮 1 裁定与收正（父侧 · 2026-09-27 19:4x ✓）

**评审轮 1（§3）= `pass`** ✓（🔴0 · 🟡2 · 🔵4 = 6 条 · 逐字在 §3）。**父侧逐条裁定**：

| # | Action | Detail |
|---|--------|--------|
| 1 🟡 | **Fixed** | §3.6 F9 状态注证据指针收正——T-V10–T-V12 ⇒ **T-V22–T-V24**（对齐 §5 用例表；原号已退役 / 移面）。落点 `docs/core/design/PORTABILITY.md:124`。 |
| 2 🟡 | **Fixed** | 需求档 F3 括注补 **aux 层**（对齐设计 §3.2 四值链——F9 增补）；变更记录行同笔（需求档笔权 = 父侧）。落点 `docs/core/requirements/PORTABILITY.md:28` / `:125`。 |
| 3 🔵 | **Fixed** | D12 补受影响文件表落点（批档 §2.4）。 |
| 4 🔵 | **Fixed** | §3.2 `isAuxPath` 行补消费方注明（生产面经 `classifyPath`；谓词消费方 = 用例面 · 可读性）。 |
| 5 🔵 | **Fixed** | §5 T-27 补 CLI 夹具注（auto-approve；无夹具读数 = 无设计门拒绝句，沿 T-06）。 |
| 6 🔵 | **Fixed** | 两档变更记录「§8 体量 / 顺延 §6-§7」节号引用加现状注（节号实核 · 零语义）。 |

**收正形** ✓：全部为**父侧直接执行**（例外②③——指针收正 / 措辞限定 / 登记行 · 零新语义 · 逐条可核 · 可 revert）；设计档变更记录行同笔（`:224`）。
**父侧复核** ✓：宿主机检注记（1/3 引文解析命中）两处不符判**路径形 / 内容比对归因**（非裁定承重项——抽查命中项 `completion.mjs:77` 已解析；其余两条未逐字复读）。
**下一步** ✓：设计面定稿（0 未决 🔴）⇒ **§4 待用户批准** ⇒ 实施舱（eng-coder · 单舱 · 含提示词四档落笔——内容 = 父侧、句位见 §2.7）。

### 1.5 实施舱中断·一处验收冲突·续跑（父侧 · 2026-09-27 20:0x）

**事件** ✓：实施舱 #100 于 20:05 因 infra 中断（provider 余额 402）——交付协议未完成（前舱自报「分类器 aux + 两端用例 + CN 提示词已全绿」，但未跑完全量套件 / 未出报告）。
**验收冲突（前舱上抛 · 父侧定稿）** ✓：「提示词逐字落笔」与两套件既有断言「表行 >200 零命中」（CLI `prompts-async-guidance.test.mjs:153` ∥ VSC `:181`）相抵——父侧逐字版 274 字符超限。**定稿** = ≤200 压缩形（实核 **199 字符**）：`scripts/**` · `test/**`/`tests/**` · `.thincoder/tmp/**` · tool-config · CI · lockfiles（路径全精度保留 · 措辞压缩）——内容权 = 父侧，落笔 = 续跑舱。
**恢复动作** ✓：续跑舱重派（round = initial · 全量收核 + 落 EN 表行定稿 + 全量套件 + 逐条判据读数）。

### 1.6 授权（父侧 · 2026-09-27 20:08 ✓）

用户 20:08「**后续自动跑完吧**」= **全链授权**（同先例）：设计评审点火 / §4 代签 / 修正·实施派发 / 收口核销提交推送——全部父侧自动执行。
**父侧自缚**：① 代签仅三条件齐备（评审 pass〔0 🔴〕∧ 修正轮落地并逐条核验 ∧ token 已签发）；② 复评再出 🔴 即停；③ 验证不过即停；④ 需**新范围**或**用户口径裁决** ⇒ 停下。

### 1.7 交付核验与只报项裁定（父侧 · 2026-09-27 20:2x ✓）

**交付核验** ✓（父侧亲跑 + 实读，非采信自报）：
- 提示词四档：`thincoder-core/prompts/discipline-engineering.md:19` = **199 字符**（与我定稿逐字一致）；四档「表行 >200」入闸 = **0**。
- 分类器读数（直跑 `classifyPath`）：`test/x.mjs` / `scripts/x.mjs` / `.thincoder/tmp/a.mjs` = **aux** · `src/test/x.mjs` = code · `tests/a/b.md` = doc · `test/tmp-x.mjs` = temp（与 J1–J5 一致）。
- 定向亲跑：CLI `portability-classification` ∥ `prompts-async-guidance` = **29/29 pass**；VSC 同对 = **31/31 pass**（fail / skipped 0）。
- 全量套件（前舱读数在 §5）：CLI **881/881** · VSC **1013/1013**；doc-check 本批贡献 0（§三）。

**只报项裁定**（前舱评审四项 + 审计偏离一项）：

| # | Action | Detail |
|---|--------|--------|
| 1 🟡 | **Dispatched** | 祖先段 fail-open 边——父侧复现 ✓（「`classifyPath("D:/work/scripts/mytool/lib/a.mjs")` ⇒ aux」）——修正轮 #105 登记（§3.2/§3.3：已登记代价 + 消解路径）+ 台账 **#465**（归批） |
| 2 🔵 | **Dispatched** | TMPDIR 锚定读数——随 #1 一并登记（同根） |
| 3 🔵 | **Dispatched** | §2.4 估算漂移（conventions 253 · CLI 297〔距 300 软线 3 行——登记在案〕· VSC 292）——#105 §2 追加块 |
| 4 🔵 | **Not an issue（父裁）** | EN :19 未载「任意深度」：200 字符闸下的压缩形；语义单源 = 需求 F9 + CN 正本（`docs/core/design/prompts/discipline-engineering.md:19` 载之）——若实证模型误读，再以 ≤200 形补标（登记在案） |
| 偏离 🔵 | **Dispatched** | §3.2 as-of 行号占位未兑现——#105 机械回填（读数在派单） |

**交付评审节点** ✓：舱内 advisor = **pass / clean**（0🔴 · 1🟡 · 3🔵，零修正轮）——逐条由本表承接。
**下一步** ✓：#105 落地核验 ⇒ §6 结算 ⇒ 批收口。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（两裁决落定：改点 = 分类器本体 · 三值闭集 = 新增 aux（消费面差分登记））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 覆盖条目（一件 · 需求 F9 · 台账 #462）

**覆盖** ✓：

- ① 分类缺省辅助面：路径段 `test` / `tests` / `scripts`（任意深度）与 `.thincoder/tmp/**` ⇒ 非代码面（判 `aux`）⇒ 工程模式**父侧门**无令牌放行；
- ② 代码段优先级在前（`src/test/**` 仍判 code）；
- ③ 两端同判（核 + VSC 随核单源）；
- ④ `codePaths` 声明（F2）可收回该缺省；
- ⑤ 提示词面测试面同步（内容权 = 主 agent · 落笔 = 实施舱）。

**明列不在本批** ✗：CI（`.github/**`）· `.thincoder/**` 非 `tmp` 面 · eng-coder token 门（零改）· 声明面新增键（零）· `conventions.json` 声明面语义（零触碰）· 本仓自指面。

### 2.2 判据线（机器可检 · 四例 + 门读数 + 零变）

| # | 判据 | 期望读数 |
|---|---|---|
| J1 | `classifyPath("test/x.mjs")` | `"aux"`（≠ code） |
| J2 | `classifyPath("scripts/x.mjs")` | `"aux"` |
| J3 | `classifyPath(".thincoder/tmp/a.mjs")` | `"aux"` |
| J4 | `classifyPath("tests/a/b.md")` | `"doc"`（≠ code——既有 doc 判据不变） |
| J5 | `classifyPath("src/test/x.mjs")` | `"code"`（反例——代码段优先） |
| J6 | 父侧门（工程模式 · 无活槽 · depth 0）写 `test/x.mjs` | 放行（恰执行一次） |
| J7 | 同上写 `src/x.mjs` / `src/test/x.md` | 仍拒（`design review required`） |
| J8 | eng-coder 门（无令牌）写 `test/x.mjs` | 仍拒——token 门零变（判据不看路径） |
| J9 | 两端同判 | VSC `tool-gates.mjs` 零改随核（T-V22–T-V24 同判读数） |
| J10 | 既有 portability 用例 | 零改全绿（设计档 §5 承诺句） |
| J11 | 声明收回 | `codePaths:["src","test"]` ⇒ `test/x.mjs` 判 `code`（门恢复拒） |

### 2.3 设计档落点（本轮已落 · `docs/core/design/PORTABILITY.md`）

§3.2 分类语义扩四值 + API 表（四值 / 新增 `isAuxPath`）· §3.1 `codePaths` 收回行 · §3.7 消费面核销表（7 面 · 新增）· §4 D9–D12 · §5 两端用例行 + F9 用例表 + 零改承诺 · §3.6 F9 状态注 · §6 射程外行 · 变更记录。

### 2.4 受影响文件与测试面

| 文件 | 现读 | 预期 Δ | 面 | 备注 |
|---|---|---|---|---|
| `thincoder-core/conventions.mjs` | 223 | +约 20 | 产品代码面 → eng-coder | 唯一实现面：`DEFAULT_AUX_PATHS`（数据常量）+ 段序列匹配（与 `hasCodeSegment` 同构）+ `classifyPath` 分支（temp / doc 之后、兜底之前）+ `isAuxPath` + 头注 / JSDoc 收正 |
| `thincoder-core/agent/dispatch.mjs` | 498 | 0 | — | 消费面零改——兼避 `CORE-UNIFICATION.md:1117` 在册拆分触发 |
| `thincoder-vscode/src/agent/tool-gates.mjs` | 166 | 0 | — | VSC 门 = 核分类器消费者，随核自动随动 |
| `thincoder-vscode/src/agent/run-helpers.mjs` | 268 | 0 | — | `hasCodeMutations` 随核 |
| `thincoder-core/agent-tools/verify.mjs` · `advisor-settle.mjs` · `advisor/repos.mjs` · `agent/completion.mjs` | 295 / 240 / 150 / 148 | 0 | — | 差分核销见设计档 §3.7 |
| `thincoder-cli/test/portability-classification.test.mjs` | 220 | +约 45 | 产品代码面 → eng-coder | T-26 / T-27 / T-28 |
| `thincoder-vscode/test/portability-vsc-classification.test.mjs` | 236 | +约 40 | 产品代码面 → eng-coder | T-V22 / T-V23 / T-V24（编号避撞实核 2026-09-27——T-V10..T-V21 已被既有族占用） |
| `thincoder-core/prompts/discipline-engineering.md` · `persona-engineering.md` + 中文正本两档 | 138 / 178 / 131 / 178 | +1~3 | 提示词面（内容 = 主 agent · 落笔 = 实施舱） | 句位见 §2.7 |

### 2.5 验收对照（对需求 F9 判定句）

| F9 判据（登记文本） | 覆盖 |
|---|---|
| 四例 `classifyPath` | J1–J5（用例 T-26 / T-V22） |
| 代码段优先级在前 | J5 + J11 |
| 两端同判 | J9（T-V23 同判读数） |
| eng-coder 门零变 | J8（T-28 / T-V24） |
| 既有用例零改全绿 | J10（设计档 §5 承诺句） |
| 父侧无令牌可写 | J6（T-27 / T-V23） |

### 2.6 关键决策

- **裁决一（改点位置）= 分类器本体**（`thincoder-core/conventions.mjs` 缺省面）；否决「门内定向谓词」（与 F9 注册判据线不符 + 再造第二判据 + VSC 需再落拷贝）——设计档 §4 D9。
- **裁决二（三值闭集处置）= 扩为四值新增 `aux`**（辅助面），规则置 temp / doc **之后**、兜底之前；最小差分：唯「曾落兜底 code」的辅助面路径改判（既有分类逐条不变）——否决复用 `temp`（同词两义 / 可清理词义误伤）· 复用 `doc`（语义不实 + verify 快径整段跳过）· 新谓词不改值域（同裁决一）——设计档 §4 D10。
- 消费面差分 = **接受并登记**（设计档 §3.7 七面核销；verify / 推送守卫 / 陈旧判定三处差分 + 消解路径在册）——§4 D11。
- 提示词面同步 = **本批必带**（分类↔分流背离触发「授权判据 ≠ 绕过门禁 ⇒ 停下上报」纪律）——§4 D12。

### 2.7 上抛项

1. **提示词面文案（内容权 = 主 agent）**：需改句 = `thincoder-core/prompts/discipline-engineering.md:19`（工程工具面行——补测试面）+ `:22`（默认归类枚举同改）+ `persona-engineering.md:80`（「产品代码面（源码/测试目录）」措辞随动）；中文正本 = `docs/core/design/prompts/discipline-engineering.md:19` / `:22` · `persona-engineering.md:79`。语义 = 「父侧可直改面 = 工程工具面 ∪ 测试面（`test` / `tests` 段 · 任意深度）∪ `.thincoder/tmp/**`」；措辞 / 行位由父侧定，落笔 = 实施舱。
2. **（观察 · 非本批面）**：需求档 F9 行（`docs/core/requirements/PORTABILITY.md:34`）三例示例路径为 doc-check 闸态悬空锚（`test/x.mjs` · `scripts/x.mjs` · `src/test/x.mjs`）——候选处置 = 加 `（拟新增` 行标记或改形态；需求档笔权 = 主 agent。
3. **（观察）**：`isDocOnlyChange` 返回值命名与 aux 语义落差——登记设计档 §3.7 行 6（消解窗口在册）。

### 2.8 自检读数（设计轮 · 2026-09-27 实跑）

- `node scripts/doc-check.mjs --root .`：本批设计档面**入闸项 0**（仅既有 §3.6 迁移期引文行 ×1 与报告面符号 ×2，均不入闸）；仓级残余 = 悬空 52 · 行宽 32（本批设计档贡献 0，已轮内清零）；需求档 3 悬空锚 = 上抛项 2。
- 设计档改动 = 184 → 223 行（净 +39）；实现面预计 +约 20 行；两端用例 +约 45 / +约 40 行。
- 三方互指核对：需求 F9 判据 = §2.2 J1–J11 = 设计档 §3.2 语义 + §5 用例表（同源一致）。

**§2 补记（2026-09-27 · 编号口径收正 · 记录面）**：§2.4 备注句「T-V10..T-V21 已被既有族占用」不确——全仓递归实核（2026-09-27）= 已占号 T-V01–T-V13 · T-V16 · T-V19 · T-V21（空号 T-V14 / T-V15 / T-V17 / T-V18 / T-V20 亦未占）。本批取 **T-V22–T-V24** 的真实依据 = 取号于既有最大占号（T-V21）之后、避撞实核 0 命中；`T-26` / `T-27` / `T-28` 同核 0 命中。设计档 §5 用例表按 T-V22–T-V24 / T-26–T-28 已落（无需改动）。

**§2 补记（2026-09-27 · 交付后登记轮 · §2.4 增量估算 vs 实读对账 · 记录面）**：

| 文件 | 现读（设计轮） | 实读（交付后） | Δ | 设计轮估约 |
|---|---|---|---|---|
| `thincoder-core/conventions.mjs` | 223 | **253** | +30 | +约 20 |
| `thincoder-cli/test/portability-classification.test.mjs` | 220 | **297** | +77 | +约 45 |
| `thincoder-vscode/test/portability-vsc-classification.test.mjs` | 236 | **292** | +56 | +约 40 |

- 实读口径 = 交付后逐行计数（三档行尾换行齐备——无计行口径歧义）；三档实读均超设计轮估约（+10 / +32 / +16）。
- CLI 用例档 **距 300 软线余 3 行——登记在案**。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Clarity（doc-state·VSC 证据指针） | 🟡 | 设计档 §3.6 F9 状态注（`docs/core/design/PORTABILITY.md:124`）把 F9 的 VSC 同判读数指为「`thincoder-vscode/test/portability-vsc-classification.test.mjs` T-V10–T-V12」，但该档在盘用例号 = T-V01–T-V09（档头 `:3`，用例 `:49`–`:209`），T-V10 已于 2026-09-12 整删（`thincoder-vscode/test/portability-vsc-advisor-context.test.mjs:7`「T-V07–T-V10 整删」），T-V11 / T-V12 住另一档（`:44` / `:60`）且面 = advisor 文档门禁（非父侧写门 / 记账守卫）；同时 §5（`:165`、`:178`–`:180`）把 F9 的 VSC 读数定为 T-V22–T-V24——指针两处不落。 | 把 §3.6 状态注的证据指针与 §5 的 F9 用例号对齐（T-V22–T-V24 · 所指档），或改为引正确档 + 正确号；再核一遍号面在盘。 |
| 2 | Requirements 同步（跨档 lag） | 🟡 | 需求档 F3（`docs/core/requirements/PORTABILITY.md:28`）仍持三值优先级链「代码段 > temp > 文档扩展名 > code」，而设计档 §3.2（`docs/core/design/PORTABILITY.md:79`）已立四值链「代码段 → temp → doc → aux → 兜底 code」；F3 括注若按穷尽读，`test/<x>.mjs` 类输入得 `code`，与 F9（`requirements:34`）+ 设计档的 aux 结论相反。本批 §6（`design:186`–`:187`）只登记了射程外两项，未登记需求侧 F3 的同步面。 | 把 F3 括注补成四值链（或显明它只覆盖 doc/code 边界子集），使需求面与设计面同口径；控制文本仍以 F9 + §3.2 为准（D > F）。 |
| 3 | Affected-file 标注（criterion 8） | 🔵 | 受审设计档内无受影响文件表 / 行数 Δ 标注；D12（`design:155`）只写「受影响文件表在册」无落点。表实体住批档 §2.4（`docs/batches/2026-09-27-eng-write-exemption.md:80`–`:89`，声明射程外），实核相符：`conventions.mjs` 现读 223 ✓（实盘 223 行）、两端用例档 220 / 236（实盘 221 / 237，差 1 行 = 计行口径）、消费面零改行齐备；唯一大档 `dispatch.mjs` 498 已注 Δ 0 且注明避开在册拆分触发——本批无档越 tier、无拆分义务。 | 在设计档 D12 或 §3.2 `isAuxPath` 行（现只写「行号实施轮读回」）补指该表落点，使标注可从设计档单向到达。 |
| 4 | Clarity（API 面） | 🔵 | §3.2 行 5（`design:71`）新增 `isAuxPath` 但未登记消费方：父侧门在盘按 `isCodePath` 判（`thincoder-core/agent/dispatch.mjs:204` ∥ `thincoder-vscode/src/agent/tool-gates.mjs:93`），全仓生产面零处直调 `classifyPath`（grep 复核：仅模块本体 + 用例），§3.7 七面核销亦未记它。 | 写明 `isAuxPath` 的消费方（用例可读性 / 头注）或删去该谓词——aux 面读数经 `classifyPath`（F9 判据线即四例 `classifyPath`）即足。 |
| 5 | Acceptance 可验性（门放行读数） | 🔵 | §5 T-27（`design:176`）断言「辅助面写放行（恰执行一次）」，但 CLI 既有同型用例证明豁免写在不给审批夹具时呈 `ok=false` + `no permission handler configured`（`thincoder-cli/test/portability-classification.test.mjs:150`–`:152`）；「恰执行一次」需 auto-approve 夹具才可观测（VSC 侧 `getAuto: () => true`——`thincoder-vscode/test/portability-vsc-classification.test.mjs:138`）。 | 在 §5 注明 CLI 侧读数所需夹具（auto-approve），或把该读数改写为 T-06 的证据形（无设计门拒绝句）。 |
| 6 | Doc hygiene（记录面） | 🔵 | 设计档变更记录 `design:218` 称「新增 §5 测试面（回指现行测试档）、§8 体量」，但在盘节 = §1–§7 + 变更记录（节头 grep 实核），无 §8、亦无删除记录；需求档同形：`requirements:117` 称「既有「不并项」「体量」两节顺延为 §6 / §7」，而在盘止于 §6。 | 收正两档记录面的节号引用（或补记体量节的删除），使变更记录不再指向不存在的节。 |

计数：🔴 0 · 🟡 2 · 🔵 4（另有射程外观察：批档 §2 补记「已占号 T-V01–T-V13」与 T-V07–T-V10 已整删（advisor-context 档头 `:7`）不符——「占号 ≠ 在盘」，结论 T-V22–T-V24 空号不受影响——不给评级）。
VERDICT: pass

## §4 用户批准（主 agent）

**2026-09-27 19:52 · 用户批准** ✓（用户 19:49「批」）。

**批准依据** ✓：① 设计评审轮 1 = **pass**（🔴0 · 🟡2 · 🔵4——6 条经父侧逐条裁定全部 Fixed 落地）；② 收正落地核验 ✓（§1.4）；③ 设计凭证已签发（凭证值按纪律不落档）。
**批准范围** ✓：F9 缺省辅助面（aux 四值）+ 两端用例（T-26–T-28 / T-V22–T-V24）+ **提示词四档落笔**（内容 = 主 agent · 逐字在派单）；设计面 = `docs/core/design/PORTABILITY.md` F9 条款族 + 需求档 F9 行；**实施 = 单舱（eng-coder）**。

## §5 实施记录（eng-coder）
**状态行**：实施完成（续跑舱全量收核 + EN :19 表行定稿落笔（199 字符）· 两端全量套件绿 · 终态 clean）


（续跑舱 · 2026-09-27 · round = initial——前舱 #100 infra 中断（provider 余额 402）后重派：全量收核 + 落 EN 表行定稿）

### 5.1 交付摘要（前舱已落 / 本轮补正）

**本轮唯一落笔**：`thincoder-core/prompts/discipline-engineering.md:19` ← 父侧 §1.5 定稿压缩形，**199 字符**（与定稿串逐字节相同；4 对反引号；表行 ≤200 闸等价正则 `^\|.{200,}` 零命中）。其余面 = 全量收核，零代码改动。

**前舱已落（本轮实核在盘）**：

- `thincoder-core/conventions.mjs`（253 行）：`DEFAULT_AUX_PATHS`（:37）· `hasSegmentSequence`（:65）· `hasCodeSegment`（:78）· `hasAuxSegment`（:83）· `classifyPath` 四值链 code→temp→doc→aux→兜底 code（:93-:100）· `isAuxPath`（:119）；头注/JSDoc 同改（:18-:24 / :87-:92 / :114-:118）。
- `thincoder-cli/test/portability-classification.test.mjs`（297 行）：T-26（:227）· T-27（:254）· T-28（:280）。
- `thincoder-vscode/test/portability-vsc-classification.test.mjs`（292 行）：T-V22（:241）· T-V23（:262）· T-V24（:277）。
- 提示词三处：`docs/core/design/prompts/discipline-engineering.md:19`（169 字符）· `docs/core/design/prompts/persona-engineering.md:79-80`（219/100）· `thincoder-core/prompts/persona-engineering.md:80`（673）。

**消费面零改** ✓：dispatch.mjs / tool-gates.mjs / run-helpers.mjs / verify.mjs / repos.mjs / completion.mjs / advisor-settle.mjs 等（mtime 窗 + 全仓 `isAuxPath|DEFAULT_AUX_PATHS|hasAuxSegment` 指纹仅命中实现面与用例面——审计舱独立复核同意）。

### 5.2 决策透明表

| # | 决策 | 依据 | 备注 |
|---|---|---|---|
| 1 | 唯一落笔 = EN :19 表行，逐字父侧定稿零改写 | 内容权 = 主 agent（§2.7 / §1.5） | 199 ≤ 200；其余三处提示词与 :22 零改（派单明令） |
| 2 | 实施面零增删（本轮 = 收核，不修不补） | 交付指令「续跑重派——全量收核」 | 审计确认无静默降级 / 无越清单 |
| 3 | 设计档 §3.2 as-of 行号漂移 = 只报不改 | D1 设计档作者 = eng-designer | 实读行号随报告全给（classifyPath :93 · isCodePath :103 · isDocPath :109 · isTempPath :49 · isAuxPath :119） |
| 4 | 祖先段 aux（fail-open 方向）= 只报不改 | 设计面裁量（登记代价 vs 限定根相对面） | 待父侧裁（评审 🟡1 optional） |

### 5.3 判据读数（直跑 / 直驱）

| 判据 | 读数 | 取证方式 |
|---|---|---|
| J1–J5 | `test/x.mjs`=aux · `scripts/x.mjs`=aux · `.thincoder/tmp/a.mjs`=aux · `tests/a/b.md`=doc · `src/test/x.mjs`=code | 直跑 classifyPath（全 ✓） |
| J6 | 父侧门（工程模式 · 无活槽 · auto-approve 夹具）写 test/scripts/.thincoder/tmp → 放行 · 恰各执行一次 | 直驱 executeToolCalls（✓） |
| J7 | 写 src/x.mjs · src/test/x.md → 仍拒（design review required）· 零执行 | 同上（✓） |
| J8 | eng-coder 无令牌写 test/x.mjs → 仍拒（token 门文案）· 令牌在位正控放行 | 同上（✓） |
| J9 | 两端同判（VSC 经核单源） | T-V22–T-V24 全绿 |
| J10 | 既有用例零改全绿 | 两端全量套件全绿 |
| J11 | codePaths ["src","test"] ⇒ test/x.mjs=code · 未列入段不受影响 | 直跑（✓） |

### 5.4 审计与代码评宙（轮次与终态）

- **内部 explore 偏离审计 · 轮 1**：`DEVIATIONS ×1（🔵）`——设计档 `docs/core/design/PORTABILITY.md:68-70` §3.2 as-of 行号 + 「行号实施轮读回」占位未兑现（作者非本舱 ⇒ 只报不改）。无 PARTIAL · 无静默降级 · 无越清单改动。
- **内部 advisor 代码评审 · 轮 1**：`pass`（🔴0 · 🟡1 · 🔵3，无 must-fix）。逐条处置：

| # | Action | Detail |
|---|---|---|
| 1 🟡 | **Noted**（只报不改） | aux 段匹配含祖先路径 ⇒ 父侧门在「项目绝对路径含 test/tests/scripts 祖先段」时整片放行产品代码（fail-open；实测复现：`D:/work/scripts/mytool/lib/a.mjs` ⇒ aux、相对形 `lib/a.mjs` ⇒ code）。既有登记（CLI 用例档 :92 T-04 注）只覆盖反方向（fail-closed 过度拦截）⇒ 设计 §3.2 登记面建议，归父侧/设计层裁。 |
| 2 🔵 | **Noted**（只报不改） | 新用例绝对路径读数锚在系统 TMPDIR（`:241`；TMPDIR 祖先段含 src 则假红）——与 #1 同根；测试风格沿既有 T-04b，待 #1 裁定后一并处置。 |
| 3 🔵 | **Noted**（归 §6） | §2.4 增量估算 vs 实读：conventions.mjs 223→253（+30；估约 +20）· CLI 用例档 220→297（+77；估约 +45）· VSC 用例档 236→292（+56；估约 +40）；CLI 用例档距 300 软线余 3 行。 |
| 4 🔵 | **Noted**（内容权 = 父侧） | EN :19 缺「任意深度」标记而 CN 正本 :19 载之；本轮派单明令 EN 逐字 / CN 零改 ⇒ 不改，待父侧裁（若要补标记需与 200 字符闸同解）。 |

- **终态 = `clean`**（本域无 must-fix ⇒ 零修正轮）；余项全部 = 越域报告项。

### 5.5 验证命令与读数

- `cd thincoder-cli && npm test` → ℹ tests 881 · pass 881 · fail 0 · skipped 0（36.2s）
- `cd thincoder-vscode && npm test` → ℹ tests 1013 · pass 1013 · fail 0 · skipped 0（55.3s）
- 定向 `node --test test/portability-classification.test.mjs test/prompts-async-guidance.test.mjs`（CLI）→ 全 ✔（含 T-26/27/28 ·「表行 >200 零命中」）
- 定向 `node --test test/portability-vsc-classification.test.mjs test/prompts-async-guidance.test.mjs`（VSC）→ 全 ✔（含 T-V22/23/24 ·「表行 >200 零命中」）
- `node scripts/doc-check.mjs --root .` → 悬空 49 · 行宽 32（FAIL 阈值 = 既有仓级残余；本批贡献 0——批内档命中项全部「列报·不入闸」；设计轮基线 52/32）
- 表行闸等价正则 `^\|.{200,}`：EN 核包 + CN 正本两目录零命中 ✓

### 5.6 只报不改项（汇总）

1. 设计档 §3.2 表行 as-of 行号 + 「行号实施轮读回」占位（审计轮 1 · 🔵）——建议父侧机械收正（例外②）或派设计微修正。
2. 祖先段 aux fail-open 方向未登记（评审轮 1 · 🟡1 optional）——待父侧/设计层裁（登记代价 + 补边界用例，或限定项目根相对面）。
3. TMPDIR 锚定读数（评审 🔵2）——随 #2 处置。
4. §2.4 估算漂移 + CLI 用例档近 300 软线（评审 🔵3）——归 §6 收口。
5. EN/CN「任意深度」标记差（评审 🔵4）——内容权 = 父侧。

**§5 补记（形式 · 记录面 · 2026-09-27）**：5.4 标题一处落字误（「审计与代码评宙」）——正字 = 「审计与代码评审」（同段 :217 等处均为正字；语义零变）。按本档 append-only 先例以补记收正，不重写既有行。

## §6 验证与收口（父代理）

### 6.1 实施核验（父侧亲跑）

- 定向亲跑：CLI `portability-classification` ∥ `prompts-async-guidance` = **29/29 pass**；VSC 同对 = **31/31 pass**；全量（前舱读数在 §5）：CLI **881/881** · VSC **1013/1013**。
- 分类器读数（直跑 `classifyPath`）：`test` / `scripts` / `.thincoder/tmp` = **aux** · `src/test` = code · `tests/*.md` = doc · `test/tmp-x` = temp ✓（§1.7）。
- 提示词四档：EN `:19` = **199 字符**（与父侧定稿逐字一致）· 四档「表行 &gt;200」入闸 = **0**。

### 6.2 登记轮（#105）核验

- `docs/core/design/PORTABILITY.md:69-71` as-of 行号回填（`classifyPath :93` · `:103` / `:109` / `:49` · `isAuxPath :119`）✓。
- 祖先段 fail-open 边登记（`:85-91`：双向已登记代价〔fail-closed = T-04 既有 ∥ fail-open = 本批实核复现〕+ 消解候选「限定项目根相对面」· 台账 #465 + TMPDIR 同根读数）✓。
- 批档 §2 追加块（`:172-181`：三档增量估算对账——均超估；CLI 用例档 297 距 300 软线 3 行登记在案）✓。
- **只报项裁定** = §1.7（四项全裁：1/2/3 Dispatched→已落 · 4 Not an issue〔父裁〕）。

### 6.3 D7 结算面

- 角色表：§1 父侧 · §2 eng-designer · §3 评审 · §4 父侧（用户批准）· §5 eng-coder · §6 父侧 ✓。
- 计数：F9 一件（基础）+ 提示词四档 + 两端六例（T-26–T-28 / T-V22–T-V24）+ 登记轮 1；过程件 = 交付续跑 1 + 评审修正 1 + 父侧记录面收正 1。
- 指针：需求档 F9（`docs/core/requirements/PORTABILITY.md:34`）· 设计档 §3.1 / §3.2 / §3.5 / §3.6 / §3.7 / §4 / §5 ✓ 可解析。
- 台账：**#462 核销**；**#465 在册**（归批——祖先段边，候选修法在册）。
- 前批遗留交叉核：无未收口锚 ✓。
- 提交：代码 + 两端用例 + 提示词四档 + 本批档（**`docs/core/design/PORTABILITY.md` 除外**——同档现载退役批未收口之笔 §3.1/§3.2 载体换源族，随退役批收口一并提交——零内容损失，仅归属序）。
