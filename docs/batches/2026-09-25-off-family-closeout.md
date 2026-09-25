# 2026-09-25 · off-family-closeout
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-25 · 来源 = 用户 2026-09-25 15:29「看一下技术待办，分一下批，整体处理」——技术待办排批（批 2/6 · off 形族收尾）。
> 台账 = #334 / #335 / #346（off 形族收尾 · 归批）。前情 = docs/batches/2026-09-25-spec-effort.md §6（已收口 2026-09-25）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-25
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**来源** = 用户 2026-09-25 15:29「看一下技术待办，分一下批，整体处理」——技术待办排批（批 2/6 · off 形族收尾）。**全链口径** = 设计 → 评审 → §4 → 实施 → §6（承今日先例 · 父侧代执行）。

**批件**（3 条 · evidence 全档 = `ledger_query`）：

| # | 条目 | 要点 |
|---|---|---|
| 台账 #334 | 无 off 路径族回执失真 | CLI `/advisor` · `/think` 对枚举无 `none` 者（如 `kimi-k3`）与服务端强制族（如 `glm-5.3-flashx`——`disabled` 400）仍回执「Thinking: OFF」⇒ 回执条件化（无 off 路径时不宣称 OFF）或档位隐藏。 |
| 台账 #335 | VSC 主模型 off 形族差 | `thincoder-vscode/src/extension/reasoning-mode.mjs:22-24` 对所有族落 `thinking:null`；CLI `applyThinkOff` 对 type 族落 `{type:"disabled"}` ⇒ type 族在 VSC 侧 off 未达载荷（服务端默认仍想）。归一对齐（端向 CLI 形或单源）。 |
| 台账 #346 | 补口三件 + 冗余 import | ① CLI `/advisor` 选档支（`effort_<level>`）不清 `thinking:null`——off→选档 后双携 `enable_thinking:false` + `reasoning_effort:<档>`（对齐 `cmd-think.mjs:119-120` 先例）；② type 族 off 形读面角（`advisorEffortCurrent` 返 `"none"` 但档 ∉ type 族枚举 ⇒ 面板显档位而非 off）；③ `reasoning:["enabled"]` 族去 `levels[0]` 回落后面板按钮转「—」无用例钉；④ `thincoder-core/advisor/run.mjs:12` `advisorIncompleteMarker` 冗余 import（pre-existing）。 |

**边界**：本批 = spec-effort 批（§15.5/§15.8 已立 off 形族规则）的**补口 / 残余收尾**——不重开规则面；载荷形态以 CLI 现有单源（`applyThinkOff` 形）为准对齐。

**前情** = 批 `2026-09-25-spec-effort` §6（off 形族规则建立批）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（修正轮（评审轮 1 · 12 条）全落 = §2.10 · 上抛 2 → 1（项 1 已裁落位）· 机检零净增（悬空 4 / 行宽 18））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 覆盖条目（三条 · 台账 / 本档 §1 / 设计档 §16 三分同源）

| # | 条目 | 设计裁定（一句话） | 设计落点 |
|---|---|---|---|
| 台账 #334 | 无 off 路径族回执失真 | **回执条件化定形**——OFF 可宣称 ⟺ 「有效 off 路径」（判据 = `thinkOffPath`）；两菜单面（`/think` · `/advisor`）落**动作面**：不提供不可达的 off 动作 + 不显示假状态（非「提供动作 + 措辞免责」） | `MODEL-SPECS.md` §16.3 / §16.4 · `PROVIDER.md` §6.12 指针 |
| 台账 #335 | VSC 主模型 off 形族差 | **端引核（零副本）**——新建核叶档 `thincoder-core/think-off.mjs`（`thinkOffShape` / `thinkOffPath`），四处生产者（CLI ×2 / VSC ×2）全部改为消费它；type 族 off ⇒ `{type:"disabled"}` 达载荷层 | `MODEL-SPECS.md` §16.2 |
| 台账 #346 | 补口三件 + 冗余 import | ① 选档清 `thinking:null` 标记（对齐 `cmd-think.mjs:119-120` 先例）② type 族 off 读面 ⇒ 落「—」（不落注册默认档）③ `reasoning:["enabled"]` 族用例补格 ④ `advisor/run.mjs:12` 冗余 import 删 | `MODEL-SPECS.md` §16.4 表末行 / §16.5 / §16.6 · `SETTINGS.md` §2.13 读面行 |

**本批不覆盖（明示）**：#329（已随 spec-effort 批收口）· §15.4-2 自定义开值族行改判（语义面——见 §2.7 上抛 1）· 面板 select 增设 off 选项（能力面——见 §2.8）· 既存失配态自愈（见 §2.8）。

### 2.2 设计档落点（本设计轮已落盘 · 逐处）

| 档 | 落点 | 内容 |
|---|---|---|
| `docs/core/design/MODEL-SPECS.md` | **新增 §16**（`:1675-1870`） | 方案与理由 / 单源实现 / `thinkAlwaysOn` 字段面 / 判据面定形 + 两菜单面落点 / 读面口径 / 补口三件 + import / 受影响文件 / AC 回指 / 用例表 / 边界 / UI 决策 / 关键决策 + 上抛 |
| 同上 | `:742-746`（§10.1） | 「始终思考」句**就地收正**为「行注 + 机制位 `thinkAlwaysOn`」（原「仅行注、不加机制位」表述退场——其依据「无消费者」已不成立） |
| 同上 | `:1571`（§15.4-2 末） | 收尾批指针一行（生产者全表 / 单一实现源 / 判据 / 读面口径 ⇒ §16；本节三支形与谓词本体零改） |
| 同上 | `:1873-1876`（变更记录） | 本批一条（含上抛 2 条） |
| `docs/core/design/PROVIDER.md` | `:211`（§6.12）+ `:460`（变更记录） | 「有效 off 路径」判据与回执可宣称性指针（谓词本体零改） |
| `docs/vsc/design/SETTINGS.md` | `:379`（§2.13 读面行）+ `:520`（变更记录） | off 哨兵 × 无 `none` 档 ⇒ 预选「—」（不落注册默认档） |

### 2.3 机制设计（摘要；细文 = 设计档 §16）

**#334（判据 + 两菜单面）**：判据 = `thinkOffPath(spec)`（本档 §16.4 单源）——**由 `thinkOffShape(spec)` 派生**（形达载荷层 ⇒ 有效）：
effort 族 ⇒ 枚举含 `none`；`thinkAlwaysOn` 族 ⇒ `false`；自定义开值族（形 = `null` ⇒ 不发字段）⇒ `false`；其余 ⇒ `true`。
落点：`/think` 快速径拒绝 `/think off` + 环内开关项不渲染 + 头与回执条件化；`/advisor` 状态行不报 off + Disabled 项不渲染（Enabled 保留 = 残留标记恢复径）。

**#335（端引核）**：核叶档两函数为唯一实现源；四处生产者改写（逐处语义保形；`/think` 自定义族支 `undefined` → `null` = 对齐 §15.4-2 表，行为等效）；VSC `advisorOffShape` 本地形体删除。

**#346**：① 选档清 `null` 标记（CLI `/advisor` 选档支）② `effortSelectView` 对 off 哨兵 ⇒ 「—」（不经注册默认支）③ 用例补格 ④ import 行只留 `estimateTokens`；**另一项本批补口** = `applyThinkOff` 三支同清 `reasoningEffort`（§16.6-⑵，CLI 侧向 VSC 写面对齐的 conformance 面）。

### 2.4 受影响文件与测试面（as-of 2026-09-25 设计轮实测 · `wc -l`）

实现面：`thincoder-core/think-off.mjs`（**拟新增** ~40）· `thincoder-core/model-specs.mjs`（**348** · +~6）· `thincoder-core/advisor/run.mjs`（**200** · −1 标识符）·
`thincoder-cli/src/tui/cmd-think.mjs`（**151** · +~14 −3）· `thincoder-cli/src/tui/cmd-advisor.mjs`（**278** · +~16 −6）·
`thincoder-vscode/src/extension/reasoning-mode.mjs`（**34** · +~4 −2）· `thincoder-vscode/src/extension/settings-panel-write.mjs`（**200** · +~2 −6）·
`thincoder-vscode/webview/settings-state.js`（**95** · +~3 −1）。
测试面：`thincoder-core/test/think-off.test.mjs`（**拟新增** ~55 · T-1..T-4）· `thincoder-cli/test/cmd-think.test.mjs`（**200** · +~35 · W-1..W-4）·
`thincoder-cli/test/cmd-advisor.test.mjs`（**110** · +~30 · W-6..W-8）· `thincoder-vscode/test/reasoning-mode.test.mjs`（**拟新增** ~45 · R-1..R-3）·
`thincoder-vscode/test/model-picker-fallback.test.mjs`（**279** · +~14 · W-5）· `thincoder-vscode/test/effort-select-views.test.mjs`（**172** · +~12 · W-9）。
设计档（本设计轮已落）：`MODEL-SPECS.md` §16 + §10.1 收正 + §15.4-2 指针 + 变更记录 · `PROVIDER.md` §6.12 指针 + 变更记录 · `SETTINGS.md` §2.13 读面行 + 变更记录。
**实现码零写**（本设计轮）；>`300` 面：`model-specs.mjs` 已登记（`SOFT_LINE_REGISTRY`）且拆分计划在位（§13.6——本次 = 字段面补充，拆点未触发）。

### 2.5 验收对照（AC 回指 · 与设计档 §16.8 / 台账三分同源）

| AC | 条目 | 判据（机器核摘要） |
|---|---|---|
| AC-1 | #334 | `thinkAlwaysOn` 三行在场；`thinkOffPath` 逐族采样（4 `true` / 9 `false`，名单见 §16.8） |
| AC-2 | #334 | `/think off` 两族拒绝 + 零写盘；`/think` 环头与回执不含 `OFF` ∧ 无开关项；`/advisor` 无 Disabled 项 ∧ 状态行不报 off |
| AC-3 | #335 | `resolveReasoningMode("off",  type 族)` ⇒ `{thinking:{type:"disabled"}}`；effort / 自定义族 ⇒ `{thinking:null}` |
| AC-4 | #346-①② | 选档清标记（`thinking` 键不在 cfg）；`effortSelectView` off 哨兵 × 无 `none` ⇒ `—`；`applyThinkOff` 三支清档 |
| AC-5 | #346-③④ | `reasoning:["enabled"]` 族 ⇒ 「—」/`""`/无 active/零 patch ∧ 列表仍渲染单档；`run.mjs:12` 不含 `advisorIncompleteMarker` |

### 2.6 关键决策（含被否 · 细文 = 设计档 §16.12）

1. **#335 = 端引核（零副本）**（被否：端对齐——副本 4→5、漂移已实证两次；父侧如裁端对齐 ⇒ 仅 §16.2 表第 3 行落地）。
2. **`thinkAlwaysOn` 机制位**（被否：强制族名单写进代码 = 数据住代码面）。
3. **回执条件化 = 动作面**（被否：提供动作 + 措辞免责 = 半实现）。
4. **读面落「—」**（被否：面板增设 off 选项 = 能力面 + §15.9 形态变更）。
5. **判据由取形派生**（被否：判据独立手写三支 = 两处漂移源）。

### 2.7 上抛项（只报不改 · 待父侧裁）

1. **§15.4-2 自定义开值族行与实测相抵**（`MiniMax-M3` / `minimax-m3`）：该行 = `thinking = null`，而该行自带依据与规格表实测（`model-specs.mjs:144-145` / `:169-171`：off 路径 = `thinking:{type:"disabled"}` ✓ rc=0）均指 `{type:"disabled"}` ⇒ 现行形不发字段 ⇒ **off 动作实为 no-op**。本批按「§15 不重开 + 载荷形态以 CLI 现形为准」不动，仅由判据如实标 `false`（该族 off 入口本批起不可达 = 失配**可见化**）。**请裁**：改该行（⇒ off 可达，判据自动翻 `true`）∥ 维持现行。
2. **`glm-5.2` / `glm-5` 的 `thinkAlwaysOn` 未取证**：本批不标（D-11）⇒ 判据默认侧 = `true`；取证路径 = 各自渠道校验级读数；到期 = 该族下次触碰。

### 2.8 边界（本批不做）

不重开 §15.4-2 的表（上抛 1 项除外——待裁）· 不改载荷层 off 谓词本体 / `resolveEnableThinking` / 枚举越界门 · 不给面板 select 增设 off 选项 · 不清理既存失配态（强制族 + `{type:"disabled"}` 的历史标记——只保证不再产生）· 不动 `/think effort none` 归一（复评条件 = 出现「`thinkAlwaysOn` ∧ 枚举含 `none`」行）· 不动 `setup-wizard.mjs:70` 已登记的 `thinking:null` 落盘口径项 · 需求档零改 · **不点火评审**。

### 2.9 机检读数（本设计轮实跑）

`node scripts/doc-check.mjs` ⇒ **悬空 4 · 行宽 18**（与入场基线同数——**本批零净增**；本设计轮首跑曾引入 4 条 `think-off.mjs` 悬空 + 6 行超宽，落笔即收正：四处补「（拟新增」标记 + 折行）。剩余 4 悬空 = `MODEL-SPECS.md:323` `cacheMode` · `:1372` / `:1465` `provider/core.mjs` · `SESSION.md` 一条，均既存。

### 2.10 修正轮落位（设计评审轮 1 · 发现 1..12 逐条 · 父侧裁定项 = 11 / 12）

**范围**：评审发现 1..10（批档 §3 轮次 1）+ 父侧两项裁决（11 = 原上抛 1 定案「改该行」/ 12 = 聊天面板 picker 同族角并入共享规则）。仅落这 12 条：不触代码（`thincoder-core/**` / `thincoder-cli/**` / `thincoder-vscode/**` 归实施轮）· 不动 §3 · 不外扩。

| 号 | 落位（file:line = 修正后现行读） | 一句话 |
|---|---|---|
| 1 | `PROVIDER.md:150` · 变更记录 `:461` | §6.9 规格字段清单补 `thinkAlwaysOn`（语义单源 = §16.3；循 `cacheMode` 同笔同步先例） |
| 2 | `MODEL-SPECS.md:1582` + `:1584` | §15.4-4 句收正（非成员 ⇒ ② 支注册默认 = E-7；**off 哨兵例外**）+ 收尾批指针（避支 = §16.5） |
| 3 | `MODEL-SPECS.md:422`（§8 行）· `PROVIDER.md:317`（§6.19） | 旧形字面收正 ⇒ 「载荷形随 §16.2 按族取形」（死字面删除、坐标保留） |
| 4 | `MODEL-SPECS.md:1739`（§16.4 表行 3） | 行重写（见号 11）；错指「§16.9 上抛 1」随行退场，存活引用改指 §16.12 项 1 |
| 5 | `MODEL-SPECS.md:1668`（§15.8 末条）· `:1494` | 末条改收口态（落点 = §16.4）；死回指「§15.6 上报面」→ `docs/batches/2026-09-25-spec-effort.md` §2.7 上抛 1（同因两处收正） |
| 6 | `MODEL-SPECS.md:1832`（W-3）· `:1815`（AC-2）· `:1747`（§16.4 环内行） | 开关项断言改钉非 effort 无 off 路径族（`glm-5.3-flashx` + 残留 `{type:"disabled"}`）；`kimi-k3` 例保留（头 / 回执条件化的判别力在） |
| 7 | `MODEL-SPECS.md:1703`（谓词本体）· `:1850`（复评条件） | effort 支补 `thinkAlwaysOn !== true` 合取 + §16.10 补「同拍复评谓词本体」 |
| 8 | `MODEL-SPECS.md:1728-1729` | 行注句携逐行等级词（官方口径 / 族沿用 / 实测） |
| 9 | `MODEL-SPECS.md:1808`（注）· `:1793`（行指注） | 「字段面补充 ∉ §13.6『实质改动』」判定口径落注（拆点未触发；改后 ~354 / 距 500 余量 ~146） |
| 10 | `MODEL-SPECS.md:1750`（选档支行）· `:1785-1786`（§16.6-⑸） | type 族 off→选档 残余登记（与 ⑵ 方向差并案）+ 复评条件两条 |
| 11 | `MODEL-SPECS.md:1566` · `:1569` · `:1702-1703` · `:1710` · `:1739` · `:1814` · `:1816` · `:1829` · `:1841` · `:1846` · `:1875-1878` · `:1692` / `:1694` / `:1705`（连通面） | 实读复核成立 ⇒ 改该行：自定义开值族 off 形 = `{type:"disabled"}`（off 可达）；§16.4 行 3 `false`→`true`、§16.2 派生与生产者第 2 行、§16.8 AC-1 / AC-3、§16.9 T-4 / R-2、§16.10、§16.12（上抛 1 → 已裁落位）连通变 |
| 12 | `MODEL-SPECS.md:1538` / `:1546`（§15.4-1）· `:1762` / `:1769`（§16.5）· `:1839`（W-10）· `:1817`（AC-4）· `:1802` / `:1804`（§16.7）· `:1861`（§16.11） | off 哨兵避支并入共享规则 `effortSelection`（⓪ 支）——两消费面同源（设置面板 / 聊天面板 picker）+ 用例 W-10；`settings-state.js` 增量 +~3 → **+~5** |

**第 11 条实读复核结论（父侧要求）**：`thincoder-core/model-specs.mjs:144-145`（MiniMax 族注：「off 路径 = `thinking:{type:"disabled"}` ✓ rc=0」）与 `:169-171`（`minimax-m3` 注：同指）实读成立——依据确指 `{type:"disabled"}`（**非** `null`）⇒ 按父侧「改该行」落位；无「停下上报」触发。

**机检读数（相对判据）**：`node scripts/doc-check.mjs` ⇒ **悬空 4 · 行宽 18**（与设计轮入场基线同数——**本批净增 0**）。修正中一度出现 1 条新增行宽（§16.3 行注句 359 字符），落笔即折行收正（`:1728-1729` 两行 153 / 206 字符）；号 11 / 12 新增的表格行按机检口径（表格行结构性豁免——`scripts/doc-check-width.mjs:40`）不计行宽。剩余 4 悬空 = 既存（`MODEL-SPECS.md:323` / `:1372` / `:1465` / `SESSION.md:793`）。

**变更记录**：`MODEL-SPECS.md:1884-1886`（fix 轮条）· `PROVIDER.md:461-462`（fix 轮条）。

**零新语义声明**：除父侧裁决项（11 / 12）外，全部为发现表的直接导出项；号 11 的连通面（§16.8 / §16.9 / §16.10 / §16.12 同变）与号 12 的 E-7 / §16.4 / §16.7 / §16.11 同列为同一事实的引出项；设计档未新增机制、未扩 12 条之外。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**核验基础**：派单四档全文（MODEL-SPECS / PROVIDER / SETTINGS / 批档）+ 抽检——§16.7/§2.4 标注行数 11 处逐处实读全对（`model-specs.mjs` 348 · `cmd-think.mjs` 151 · `cmd-advisor.mjs` 278 · `advisor/run.mjs` 200 · `reasoning-mode.mjs` 34 · `settings-state.js` 95 · `settings-panel-write.mjs` 200 · `cmd-think.test.mjs` 200 · `cmd-advisor.test.mjs` 110 · `model-picker-fallback.test.mjs` 279 · `effort-select-views.test.mjs` 172）；三「拟新增」档（`think-off.mjs` / `think-off.test.mjs` / `reasoning-mode.test.mjs`）经查不存在（标注成立）；§16.2/§16.4/§16.5/§16.6 主要坐标（`cmd-advisor.mjs:44-51 / :62-72 / :65-68 / :139-143 / :156 / :158 / :171`、`cmd-think.mjs:20-26 / :21 / :44-90 / :55-57 / :104 / :119-120 / :124-141`、`reasoning-mode.mjs:22-24`、`settings-state.js:60-65 / :71-75`、`settings-panel-write.mjs:63-68 / :154-165`、`advisor/run.mjs:12 / :19 / :171`）逐处抽读一致；`thincoder-core/package.json` `exports: "./*"` 与 `SOFT_LINE_REGISTRY` 登记（`core-hygiene.test.mjs:96`）属实。**未核**：`doc-check` 机检读数（悬空 4 / 行宽 18——环境内不可执行）。

**发现表（10 条：🔴 0 · 🟡 6 · 🔵 4——全部非阻断）**

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership | 🟡 | 新机制位 `thinkAlwaysOn` 未同步进 `PROVIDER.md` §6.9 的规格字段清单（`:149-150` 仍列 context/maxOutput/thinking/thinkApi/thinkEnabledValue/…；同档先例 = `cacheMode` 删除时同笔同步 §6.9，`:456`）——PROVIDER 侧本批只落了 §6.12 指针（`:211`）与变更记录（`:460`） | §6.9 字段清单补 `thinkAlwaysOn`（或加指针行指向 `doc:MODEL-SPECS.md:§16.3`），循 `cacheMode` 同笔同步先例 |
| 2 | Document ownership | 🟡 | 读面单源节 §15.4-4 未补指针/未收正：`:1578-1579`「三支结果均经 `effortSelection` 判成员（非成员 ⇒ 中性档「—」）」正是 §16.5（`:1757`）以「不经注册默认支」改写的那条路径；本批只给 §15.4-2 补了指针（`:1571`） | §15.4-4 补同款「收尾批指针」（off 哨兵避支 = §16.5），并收正该句适用范围（非成员 ⇒ 注册默认支 = E-7；off 哨兵例外） |
| 3 | Document ownership | 🟡 | 旧形字面残留未补指针：`PROVIDER.md:317`（§6.19「`"off"` → `thinking: null` + `reasoningEffort: null` 真 off」）与 `MODEL-SPECS.md:422`（§8「选中 `"none"` 的载荷 = **真 off**（`…:22-24`：`{thinking:null, reasoningEffort:null}`）」）——按 §16.2 第 3 行（`:1707`）改后 type 族载荷不再是该字面 | 两处补「载荷形随 §16.2 按族取形」指针（或就地收正字面），循 §15 轮「旧形派生句补指针」先例 |
| 4 | Clarity | 🟡 | 交叉引用错指：§16.4 表第 3 行（`:1734`）「**该结论 = §16.9 上抛 1**」——上抛项在 §16.12（`:1863-1868`）；§16.9（`:1809-1830`）= 用例表，无「上抛」内容 | 改指 §16.12 上抛 1 |
| 5 | Document ownership | 🟡 | §15.8 末条（`:1664`）「…**仍无 off 路径**——回执措辞面不动（越本批条目，见 §15.6 上报面）」：①「回执措辞面不动」已被 §16.4（`:1741-1747`：拒绝 `/think off` + 新拒绝文案 + 头与回执条件化）实质取代而未补指针；②回指目标「§15.6 上报面」在本档 §15.6（`:1617-1628` = AC 回指表）无对应节（同款回指见 `:1494`） | §15.8 末条补 §16 指针（或改写为收口态）；「§15.6 上报面」回指目标就地收正（`:1494` 同因） |
| 6 | Acceptance criteria | 🟡 | 「Thinking 开关项不渲染（`:55-57` 加门）」（§16.4 `:1742`）缺判别力用例：W-3（`:1821`）钉在 `kimi-k3` 上断言「无 Thinking 开关项」——该名属 effort 族（§16.4 表第 1 行）⇒ `isEffortOnly` 真 ⇒ `cmd-think.mjs:55` 现行门本就不渲染该项，断言批前批后同态；新门真正生效面 = 非 effort 且无 off 路径族（`glm-5.3` 族——现态会渲染该项） | 该断言改钉非 effort 无 off 路径族（如 `glm-5.3-flashx` 环内 + 残留 `{type:"disabled"}`），或补一条该族环内用例 |
| 7 | Clarity | 🔵 | `thinkOffPath` 派生式（`:1699`）effort 支无 `thinkAlwaysOn` 合取：将来「`thinkApi==="effort"` ∧ 枚举含 `none` ∧ `thinkAlwaysOn:true`」的行会被判「有效」（= #334 假宣称类）；§16.10 复评条件（`:1838`）只覆盖 `/think effort none` 归一，未覆盖谓词本体 | effort 支补 `thinkAlwaysOn !== true` 合取，或把复评条件扩到 `thinkOffPath` 本身 |
| 8 | Methodology | 🔵 | §16.3 拟定行注补句（`:1724`）为「该事实 = 机制位 `thinkAlwaysOn`（单源 = …）」，未携逐行证据等级词（其表 = 官方口径 / 族沿用 / 实测）——与本档证据纪律（非实测类须逐条写进行注，`:82-83`）不齐 | 行注补句携带逐行等级词（官方口径 / 族沿用 / 实测） |
| 9 | Affected-file size | 🔵 | §16.7（`:1784`）「本次 = 字段面补充，拆点（`MODEL_SPECS` 表块外提）未触发」——§13.6 消解窗口（`:1274`）含「该档下次**实质改动**时」；本批对 `model-specs.mjs` 的改动是否属「实质」未按 §13.6 口径显式判定（348 +~6 未近 500 硬限） | §16.7 显式写明「字段面补充 ∉ §13.6「实质改动」」判定口径（或按消解窗口重核一次） |
| 10 | Scope | 🔵 | 选档清标记只覆盖 `thinking === null`（§16.4 `:1745`「`{type:"disabled"}` 不动（同先例）」）⇒ type 族「off（`{type:"disabled"}`）→ 选档」后仍双携（状态行报 `off` + 档位在位）；§16.6-⑵（`:1771-1772`）已把同族组合定性为 F2 违约并关了反向（off 清档），选档方向未关 | 登记该残余（或补复评条件），与 §16.6-⑵ 的方向差并案说明 |

VERDICT: pass

计数：🔴 0 · 🟡 6 · 🔵 4（10 条）

## §4 用户批准（主 agent）

**代执行口径**（承用户 2026-09-25 15:29「整体处理」全链授权）：设计（§2 + §2.10 修正块）→ 评审 pass（§3 轮 1 · 🔴0 / 🟡6 / 🔵4——父侧逐条裁定**全数接受**）→ 修正轮全落（12 条逐条实报）→ **父侧抽验通过**（§15.4-2 改判 / §16.2 合取 / §16.4 行 3 翻 `true` / W-10 在场 / PROVIDER §6.9+§6.19 收正——逐项实读）⇒ **批准进入实施**。设计 token 已发（凭证不落档）；实施 = eng-coder 初始轮，`round=initial`。

## §5 实施记录（eng-coder）
**状态行**：实施完成（off 形族收尾（#334/#335/#346）· 四生产者端引核零副本 + thinkAlwaysOn 三行 + 两菜单面 + 读面 ⓪ 支 + 四补口 · 三树全绿 675/861/997 · doc-check 4/18 零净增 · explore 审计 无🔴 + advisor 评审 轮1 pass（fix 4 处）/ 轮2 pass ⇒ 终态 clean（存续 = §5.6-③ 越软线登记 + §5.7 上抛 5 条待父侧裁））



### 5.1 交付摘要（设计 §16 落点 → 实改对照 · 行数口径 = `split("\n").length - 1`）

**实施面**（四处生产者全部改为消费单源 = 端引核零副本）：

- `thincoder-core/think-off.mjs`（0 → **26** · 拟新增 → 已建）：`thinkOffShape`（写面取形）/ `thinkOffPath`（有效 off 路径判据——由取形派生 + `thinkAlwaysOn !== true` 共门）。
- `thincoder-core/model-specs.mjs`（348 → **354**）：表头字段注 `thinkAlwaysOn` + `glm-5.3` / `glm-5.3-flash` / `glm-5.3-flashx` 三行 `thinkAlwaysOn: true`
  + 三处行注机制位句携逐行等级词（官方口径 / 族沿用 / 实测）。
- `thincoder-core/advisor/run.mjs`（200 → **200**）：`:12` import 只留 `estimateTokens`；`:19` re-export 保面（§16.6-⑷）。
- `thincoder-cli/src/tui/cmd-think.mjs`（151 → **169**）：快速径拒 `/think off`（不写盘 + §16.4 文案）；环内 Thinking 开关项合取 `offPath`；
  头与回执共式 `thinkingOn()`（无有效 off 路径 ⇒ 恒报 ON）；`applyThink` off 支两处取形归单源（§16.2 第 2 行）。
- `thincoder-cli/src/tui/cmd-advisor.mjs`（278 → **290**）：`applyThinkOff` 单源取形 + `delete reasoningEffort` 提至支外（三支同清——§16.6-⑵）；
  `advisorStatus` 条件化（`offPath === false` ⇒ 不报 off）；Disabled 项加门（Enabled 保留）；选档支清 `thinking === null`（§16.6-⑶ / #346-①）。
- `thincoder-vscode/src/extension/reasoning-mode.mjs`（34 → **39**）：off 支取形归单源（#335 本体）。
- `thincoder-vscode/src/extension/settings-panel-write.mjs`（200 → **198**）：`advisorOffShape` 本地形体删除 ⇒ 一行委派单源（§16.2 第 4 行）。
- `thincoder-vscode/webview/settings-state.js`（95 → **98**）：`effortSelection` ⓪ off 哨兵避支（早返、不经 ② 支——§16.5 / §15.4-1）。

**测试面**（用例号 = 设计 §16.9）：

- 新增 `thincoder-core/test/think-off.test.mjs`（0 → **51** · T-1..T-4）
- 新增 `thincoder-vscode/test/reasoning-mode.test.mjs`（0 → **50** · R-1..R-3 · 该面首测）
- `thincoder-cli/test/cmd-think.test.mjs`（200 → **268** · W-1..W-4）
- `thincoder-cli/test/cmd-advisor.test.mjs`（110 → **171** · W-6..W-8 + E-3 自定义族改判）
- `thincoder-vscode/test/model-picker-fallback.test.mjs`（279 → **391** · W-5 / W-10）
- `thincoder-vscode/test/effort-select-views.test.mjs`（172 → **191** · W-9）
- `thincoder-vscode/test/files.mjs`（138 → **142** · VSC runner 为清单制 ⇒ 新档入册）

**AC 对照（机核）**：AC-1 → T-1..T-4（`thinkAlwaysOn` 三行防空扫 + 6 `true` / 7 `false` 逐名采样）；AC-2 → W-1..W-4 + W-6/W-7；
AC-3 → R-1..R-3 + `cmd-advisor` E-3 三族别；AC-4 → W-8/W-9/W-10 + `applyThinkOff` 三支同清；AC-5 → W-5 + `thincoder-core/advisor/run.mjs` 面（`:12` 零该名 ∧ `:19` re-export 在）。

### 5.2 验收读数（实施轮实跑 · as-of 2026-09-25）

| 项 | 命令 | 读数 |
|---|---|---|
| 核树 | `cd thincoder-core && npm test` | **675 / 675 通过**（A24 为既存超时敏感用例：首二跑在并发负载下假红、隔离跑与复跑均绿——见 §5.4） |
| CLI 树 | `cd thincoder-cli && npm test` | **861 / 861 通过** |
| VSC 树 | `cd thincoder-vscode && npm test` | **997 / 997 通过** |
| 文档机检 | `node scripts/doc-check.mjs` | 悬空 **4**（= 基线，逐条同）/ 行宽 **20**（基线 18：+2 全落 `docs/vsc/design/WEBVIEW.md:140` / `:682`——该档在本实施轮被并发笔改，本批设计面三档零新增宽行） |
| 判别力抽验 | 临时置红三处（`effortSelection` ⓪ 支 / `cmd-think` 的 `offPath` / `reasoning-mode` 取形）后复跑 | 预期红集 = W-9 · W-10 ×2 · R-1 · R-2 · W-1/W-2 · W-3①②（9 条）；恢复后全绿（零误伤既有用例） |

### 5.3 决策透明表（实施中自主判断 · 均未越设计语义）

| # | 判断 | 依据 / 代价 |
|---|---|---|
| 1 | `applyThink` effort 支亦改走 `thinkOffShape`（保留 `null` 字面亦等价） | 单源零副本（§16.2 第 2 行改后式）；域内等价——该支由 `isEffortOnly` 独占 ⇒ 取形恒 `null` |
| 2 | `cmd-advisor.mjs` 入口预载 `specForModel`（原先两闭包各自重复动态 import） | `advisorStatus` 为同步函数、须同步取 spec；顺带消除同模块重复 import（零行为差） |
| 3 | `/think off` 拒到位序：autoThink 门在前、`offPath` 拒在后 | 与既有门序一致（auto 态下手动设置本就被覆盖） |
| 4 | W-3① 的「回执」半 = 直驱合成 `{action:"off"}` 锁公式（该族 UI 已无 off 项 ⇒ 真实条目不可达） | §16.4 要求回执条件化；用例注释明示因由（合成动作仅为公式锁，断言对象仍是真回执/真状态） |
| 5 | W-8 正向 = `qwen3.8-flash` 直驱 `think_off`（effort 族菜单不渲染该项）+ 真渲染条目取 `effort_low` | 同 `thincoder-cli/test/cmd-advisor.test.mjs` E-3「off 项 · effort 族」先例 |

### 5.4 审计与代码评审轮次与终态

| 轮 | 类型 | 范围 | 结论 | 处置 |
|---|---|---|---|---|
| 1 | explore 发散审计（只读） | 设计 §16 全节 ↔ 15 档实改 | 无 🔴；2 🔵（`files.mjs` 表外必要连带 / effort 支单源残字面）+ 2 设计框外发现 | 单源残字面 ⇒ fix-1；余 ⇒ 披露（§5.6 / §5.7） |
| 2 | advisor 代码评审 · 轮 1 | 同上（15 档 + 四档文档） | **pass**（0 🔴 · 1 🟡 · 3 🔵） | 🟡 = 测试档 391 行越软线 ⇒ §5.6-③；🔵②/④ ⇒ fix-2 / fix-3；🔵③ ⇒ 与设计 §16.2 末注明文相抵，不改（§5.7-③） |
| 3 | advisor 代码评审 · 轮 2（仅验修复声明） | `thincoder-cli/src/tui/cmd-think.mjs` / `thincoder-vscode/test/reasoning-mode.test.mjs` | **pass**（两处修复逐条成立、无新问题） | 收敛 |

**终态 = clean**：无未决 🔴 / must-fix；存续项 = §5.6-③（越软线存续）与 §5.7（上抛 5 条），均「只报不改 / 待父侧裁」类。

### 5.5 fix 轮（本会话内自修 · 0 个外部修正轮）

- fix-1（审计 🔵）：`applyThink` effort 支 `cur.thinking = thinkOffShape(spec)`——单源全收敛（域内等价）。
- fix-2（评审 🔵②）：删环内三行死变量 `prevAuto` / `prevThinking` / `prevEffort`（写后无读点，删前即无读取面 ⇒ 零行为差）。
- fix-3（评审 🔵④）：`thincoder-vscode/test/reasoning-mode.test.mjs` R-2 补 `thinkOffPath` 判别面两条断言（取形 ≠ 可宣称性）。
- fix-4（自检）：`cmd-think.mjs` 开关项注释措辞收正（原「生效面」句语义含混）。
- 修复后复跑：核 675 / CLI 861 / VSC 997 全绿（同 §5.2）。

### 5.6 表外改动披露（out-of-file-list · 逐条原因）

1. `thincoder-vscode/test/files.mjs`（+4 行）：VSC runner 为**显式清单制**（`thincoder-vscode/test/run.mjs:51-56` 反查：盘上 `.test.mjs` 未入册即 fail）
   ——新档 `test/reasoning-mode.test.mjs` 不入册则永不执行 ⇒ 必要连带。
2. `thincoder-cli/test/cmd-advisor.test.mjs` 既有用例改判（E-3 自定义开值族：`null` → `{type:"disabled"}`）：父侧 2026-09-25 裁决（§16.12 项 1）后旧断言必红；
   新断言仍走真 `applyThinkOff` 落盘面（非改写期望以图绿）。
3. 🟡（存续 · 未修）：`thincoder-vscode/test/model-picker-fallback.test.mjs` 391 行越 300 软线（设计 §16.7 估 279 +~20 ≈ 299）。
   不修理由：VSC 测试树无 core 侧那类登记闸（`thincoder-core/test/core-hygiene.test.mjs:88-101` 仅枚举核相对路径）；同树在册常态 = 26 档 >300 / 10 档 >400；
   且拆档会偏离设计指派的用例载体（§16.7）。**父侧如裁拆**：切法 = 本批 ⑤ 组（off 哨兵 / `["enabled"]` 族）析出新档并入册。

### 5.7 偏差与上抛（只报不改 · 待父侧裁）

1. **设计估读偏差（行数）**：`thincoder-vscode/test/model-picker-fallback.test.mjs` Δ+112（估 +~20）· `thincoder-cli/test/cmd-think.test.mjs` Δ+68（估 +~35）·
   `thincoder-cli/test/cmd-advisor.test.mjs` Δ+61（估 +~30）· `thincoder-cli/src/tui/cmd-think.mjs` Δ+18（估 +11）；`thincoder-core/think-off.mjs` 26 行（估 ~40）。
   说明 = 估算为 as-of 预算，实际含注释与判别力断言；无档越 500（全量数见 §5.1）。
2. **设计面名单缺口（第 5 处 off 形生产者）**：`thincoder-cli/src/acp/handlers-session.mjs:88`（ACP `thinking` 开关全族一形、不引核单源；effort 族上关思考静默失效——与 #335 同类）。
   设计 §16.2 只枚举四处生产者 ⇒ 本批未覆盖（本批边界 = §16.10）。
3. **读面残留（#334 同类）**：`thincoder-cli/src/tui/render-frame.mjs:52` 顶栏徽标按 `type === "disabled"` 断言 `think: off`，与 `thinkOffPath` 无判据关系（强制族携残留标记时仍显示 off）。
4. **后台 producer**：`thincoder-core/generate-title.mjs:46` / `:68` 全族硬编码 `thinking: { type: "disabled" }`（§9.6 已认账副作用面）——effort 族上该 off 意图同样不生效。
5. **文档计数漂移（父侧 / 设计者笔）**：批档 §2.5 AC-1 行「4 `true` / 9 `false`」与设计 §16.8 名单（6 `true` / 7 `false`）不一致（§2.10 第 11 条改判后未同变）——本档 §5 不代改，报父侧收正。

**读数补记（§5.2 的 doc-check 行列 · 本档 §5 落笔后复跑，as-of 2026-09-25 16:3x）**：`node scripts/doc-check.mjs` ⇒ **悬空 4 / 行宽 18**
——即与设计轮入场基线（4 / 18）逐数相同（16:11 那次 20 的两条 = `docs/vsc/design/WEBVIEW.md:140` / `:682`，为并发笔在飞态；其后已由该笔收正）。
本批 §5 正文（本档 §5.1–§5.7）零新增悬空、零新增超宽行 ⇒ 「零净增」成立；悬空 4 条 = `docs/core/design/MODEL-SPECS.md:323` / `:1372` / `:1465` + `docs/core/design/SESSION.md:793`（均既存）。

## §6 验证与收口（父代理）

**核验与收口（主 agent · 2026-09-25）**

**实施交付核验**
- 交付 = eng-coder `#54`（内部发散审计 1 轮〔无 🔴〕+ 代码评审 2 轮〔轮 1 pass · 1🟡/3🔵 → fix 3 处；轮 2 pass〕· 终态 clean）。
- **本席复核（读盘抽验 + 实跑）**：`thincoder-core/think-off.mjs`（26 行 · `thinkOffShape:14` / `thinkOffPath:22-25`——由取形派生 + `thinkAlwaysOn` 共门）✓；端 `reasoning-mode.mjs:22/:28` 引核单源零副本 ✓；两菜单面（拒 / 门 / 条件化）与四补口读数 = §5.1–§5.7。
- 读数：三树 **675/675 · 861/861 · 997/997** 全绿；**先红后绿判别力抽验**（临时置红 ⇒ 9 条预期红 · 恢复全绿）✓；doc-check **4/18** = 基线（零新增）。
- **披露处置**：① 表外 2 条（vsc `test/files.mjs` 显式清单入册〔必需〕· E-3 改判〔父侧裁 #11 直接后果〕）——**接受**；② 存续 🟡（`model-picker-fallback.test.mjs` 391 行越线）——**父侧裁 = 不拆 + 登记**（另册）；③ 设计漂移（行数估读偏差 · §2.5「4/9」vs §16.8「6/7」——§16.8 = 裁定后正读，§2.5 = 裁定前 as-of）——记录面，不回改；④ 设计框外发现三处（ACP `handlers-session.mjs:88` · `render-frame.mjs:52` · `generate-title.mjs:46/:68`）→ **另册**。

**收口**：§1 置「已收口」· 记录冻结；台账 #334 / #335 / #346 → 待核销 → 已核销；designToken 消费（链终止）。
