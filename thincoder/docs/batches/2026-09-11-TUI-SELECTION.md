# TUI 面收口（选择 UI / picker 提示 / 受限变体文案 / 慢例归册）· 批次记录（2026-09-11）

> 六段 append-only，**一段一作者**：§1 讨论（主 agent）· §2 批次任务（eng-designer）·
> §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder 自写）· §6 验证与收口（父代理）。
> 编制：主 agent（工程模式）· 2026-09-11 13:08 · 来源 = 用户 13:07「**批A开工吧**」（对 TODO 全量审计 id=28 的「该落地」建议清单之批 A）+ 审计报告（逐条一手实证）。
> （父侧形态更正 2026-09-12：空占位行已清——实体内容见对应节；空占位 = 残留即先例）

---

## §1 讨论（主 agent 记）

### 需求来源

- TODO 全量审计（id=28，2026-09-11——逐条现场触证）「该落地」清单之 **批 A（TUI 面）**；
- 用户 13:07「批A开工吧」= 开工。

### 本批条目（4 条——= 设计档 AC 回指条目 = 需求/证据条目，三方一致）

| # | 条目 | 分级 | 证据（审计一手，as-of 2026-09-11） |
|---|---|---|---|
| **A1** | **picker `item.note` 不渲染**——「无 key / 不可用」提示用户不可见 | P2 · 小 | `src/tui/pickers.mjs:72` item 分支只渲染 `text`+`marker`（`note` 仅 header 分支 `:66` 渲染）；而 `src/tui/model-picker.mjs:125` 为 item 产出 `note: baseURL + " (no key)" + " (不可用)"` |
| **A2** | **受限变体工具 description 缺新动作词**——cancel / panel / observe / send / consume-design 未列 | P3 · 小 | `src/agent/setup.mjs:253/260` 文案仅列「escalate/check/status」（enum 已 pin 对：`:245/252`） |
| **A3** | **慢例未归册**——`test/eng-designer-role.test.mjs:83`（T30，实测 818.5ms）撞快层慢门偶发红 | P3 · 一行 | 该行为 `test(`（同档其它慢例已 `slow(`） |
| **A4** | **三套选择 UI 并存**——question / wizard / picker 交互与渲染各行其是 | P3 · **中（设计主体）** | `src/tui/pickers.mjs` / `src/tui/key-modes.mjs` / wizard 档三套并存（TUI.md §11 既有面） |

### 已核事实（供 designer 免重复勘察）

- A1：修法方向 = item 分支补 note 渲染，**宽度预算须一并处理**（item 行宽 = 选择器布局约束）；`note` 产出面已存在（`model-picker.mjs:125`）——只差渲染消费。
- A2：纯文案同步（enum 已是真值面；`docs/design/` 归属由 A1 勘察判——候选 `ENGINEERING-MODE.md` §2.22.x 或 TOOLS/AGENT-LOOP 面）。
- A3：修法 = `test(` → `slow(`（**归册不是删除**——slow 门语义）。
- A4：三套并存现状 = `pickers.mjs`（单一 provider/preset picker 面）· `key-modes.mjs`（permission/question/interruptPrompt 独占模态）· wizard 档（`src/tui/wizard*`）——**统一 vs 明确分工**由设计裁定（候选 ≥2 给选型表）；承载档候选 = `docs/design/TUI.md`（§11 开放项在案）。

### 范围边界（明确不做）

- 不改三套 UI 的既有交互语义（除 A4 设计裁定的统一/分工面）；不碰他链在途档；不改工程模式提示词语义；
- **不得自行新建档**（必须新建 → 停下打回主 agent）。

### 待设计裁定

1. **A4 方案选型**（统一 vs 分工 vs 其他——候选 ≥2 选型表 + 成本/风险）；
2. A1 的宽度预算处理（note 渲染的布局规则——截断/换行/省略）；
3. 受影响文件全清单（行数/增量）+ 用例 + AC（逐条回指 A1–A4）；
4. 归属档裁定（A1/A3 = TUI 面；A2 的 description 归属面）；
5. 纪律核对（D1 · 既有测试锁零伤 · 双端面是否涉及 VSC）。

### 状态

**已收口 2026-09-11**（用户「批A开工吧」）。下一步 = **设计**（spawn eng-designer）。

---

## §2 批次任务（eng-designer 自写）


**状态：任务书就绪**（2026-09-11——需求 / 设计 / 测试三层已落档；待设计评审）。实施者 = eng-coder（设计 token 门）。本 §2 = coder 任务书本体（不另写副本；契约逐字文案 / 用例表 / 验收判据全文在设计档，本段只做任务书）。上方「待写」占位行为 append-only 工具面既有行（不改）。

**落档位置**：需求 = `docs/requirements/TUI.md` F9/F10/N7 + `docs/requirements/ENGINEERING-MODE.md` §1.15 描述面同步块 + `docs/requirements/TESTING.md` §3 归册补登；设计+测试 = `docs/design/TUI.md` **§12 全节**（A1/A4 全量 + 批级 AC 表）/ `docs/design/ENGINEERING-MODE.md` §2.15 D5（A2）/ `docs/design/TESTING.md` §1.2（A3）。

**本批覆盖的条目**（三方一致——本节条目 = 设计档 AC 回指 = 需求档条目）：

| # | 条目 | 需求面 | 设计 / AC 面 | 一句话 |
|---|---|---|---|---|
| A1 | picker 附注渲染 + 宽度预算 | TUI 需求 F9 / N7 | TUI 设计 §12.5 · AC-A1-1..3 | item 分支补 note 消费；`(no key)` / `(不可用)` 上移 text 恒显；note 收缩为 baseURL |
| A2 | 受限变体描述动作清单同步 | ENGINEERING-MODE 需求 §1.15 块 | ENGINEERING-MODE 设计 §2.15 D5 · AC-A2-1 | `setup.mjs` 3 个文案面同机械门清单（7 动作）、删 `check` |
| A3 | 慢例归册（T30） | TESTING 需求 §3 归册补登 | TESTING 设计 §1.2 · AC-A3-1 | `test/eng-designer-role.test.mjs:83` 自 `test(` 改 `slow(` |
| A4 | 选择面分工 + 契约对齐 | TUI 需求 F10 | TUI 设计 §12.3 / §12.4 · AC-A4-1..4 | question ↑↓ 环绕、wizard 选中项自动滚入可视窗、契约表落档 |

**受影响文件**（写域声明——行数 as-of 2026-09-11，口径 `split("\n").length` 含末行）：

| 文件 | 当前行数 | 预计增量 | 变更点 |
|---|---|---|---|
| `src/tui/pickers.mjs` | 107 | +3 ± 2 | `rebuildLines` item 分支渲染 note |
| `src/tui/model-picker.mjs` | 496 | ±4 | `buildProviderEntries`：警示上移 text / note = baseURL |
| `src/tui/key-modes.mjs` | 239 | ±4 | question options ↑↓ 环绕 |
| `src/tui/wizard.mjs` | 228 | +8 ± 4 | `renderWizard` 选中行滚入可视窗（`computeLayout` + try/catch 兜底 8） |
| `src/agent/setup.mjs` | 355 | ±3 | A2 三个文案面（253 / 259 / 260） |
| `test/eng-designer-role.test.mjs` | 316 | ±6 | A3 归册（+ import）；A2 = T32b 扩断言（零新增装配调用） |
| `test/tui-selection-surfaces.test.mjs` | 新增 | +130 ± 40 | A1/A4 用例表 1:1 |

**零改核对项**：`src/tui/layout.mjs` / `src/tui/render-frame.mjs`（零改——设计 §12.7）· 其余 `src/**` · `docs/**`（写稿面 = 设计者；本批文档已落档）· `src/prompts/**` · VSC 仓 · `docs/TODO.md`（父侧已推进）。

**交付要求**：

1. 实现 = 设计档 §12.5 逐字草案 + §12.6 决策记录（D-SS1..7）——语义争议回设计档，不自行改语义（撞墙 → 停下报告，不静默偏离）。
2. 测试：新档 `test/tui-selection-surfaces.test.mjs` 九用例 1:1（设计 §12.8）；A2 断言扩 T32b；A3 = 归册本身。
3. 验证分层：L0+（语法 + 定向 `node --test test/tui-selection-surfaces.test.mjs test/eng-designer-role.test.mjs`）；不跑全量（父侧 L2）。
4. 交付自查第 6 项：`docs/design/TUI.md` §1 模块地图所触 4 行（pickers / model-picker / key-modes / wizard）行数回写（口径同表头注；只动该 4 行，不扩文档面）。
5. 报告：交付透明表（Done / Simplified / Not done）+ 逐条 AC 机验证据（命令 + 结果）。

**边界（不做）**：不改 picker 过滤 / 鼠标 / 栈 / 键盘既有语义；不改 question 自由文本态（TUI-INPUT-BOX（本仓）§7）；不改 wizard 文本步与 Esc 全跳；不合并三面实现；不预判其它慢例归册；不动 VSC 端；不 commit。

**未确认面（呈父侧确认）**：① A2 / A3 的承载档 = 本设计勘察判（ENGINEERING-MODE / TESTING 两板块——批前原话「A2 的 description 归属面（勘察判）」）——写入面超出批前声明的档集，如实披露，父侧可否决重定向；② A4 裁定 = 「分工保留 + 契约对齐」（否决全面统一）——选型表在 TUI 设计 §12.3，裁定权在评审 / 用户。

**父侧事项（不在 coder 写域——本设计报告随附）**：

- **VSC 镜像候选**：`thincoder-vscode/src/agent/setup.mjs`（as-of :85-86）的 2 个 description 文案面现仅列 status / escalate（VSC 端形态 = `delete props.action`；CLI 端形态 = 保留 action enum）——是否与 CLI 同清单同步的镜像评估归父侧立项。
- **发现项（不在本批条目）**：`docs/design/AGENT-LOOP.md` §7.2 标题与表仍为「七动作」（缺 `consume-design`——as-of 2026-09-07 已上线；代码 8 动作；属 D3 计数漂移）——AGENT-LOOP 档维护，父侧定夺。
- **发现项**：`src/agent-tools/subagent.mjs`（as-of :176）门文案含旧节号 `§19 D-M3`（文档重组后不存在——D-ST6 存量指针债口径：只改所触文件，本批不改）。

### 修正轮（2026-09-11——设计评审轮次 1 后；本追加与上文本冲突时以本追加为准）

**背景**：设计评审（轮次 1）**changes-required**（🔴 1 · 🟡 2 · 🔵 5——发现表见 §3 轮次 1）。父侧裁决：#1（🔴）必修——裁定 ① **收回 coder 文档回写项 + 时序归位**；#2（🟡）逐条修——二选一取「**列为显式用例**」；#3（🟡）协同项非缺陷——父侧确认、零动作；#4–#7（🔵）顺手修；#8 非缺陷（随交付链）。本轮 = 修正轮（**只改文档、不碰实现**——源码与提示词零碰；实现落笔仍待批准链；同 designId 链内 docs FIRST，不重新发起评审）。

**发现 → 落点映射（全部已落；as-of 2026-09-11）**：

| 发现 | 级别 | 落点 |
|---|---|---|
| #1 | 🔴 | ①**上文「交付要求」第 4 项（:87）改写——以本块为准**：coder 交付时**报告** §1 模块地图所触 4 个源文件（pickers / model-picker / key-modes / wizard）**实测行数**（口径同表头注；入交付报告——**不回写文档**）；§1 地图 4 行由**设计者在收口阶段回写**（写权唯一、**不加例外**；`ENGINEERING-MODE.md` §2.15 A2 口径不改）。② `docs/design/TUI.md` §12.7「交付自查项」句同款改写 + 变更记录行 |
| #2 | 🟡 | 取「**列为显式用例**」：设计档 §12.8 新增**用例 10**（文档面断言——读设计档 §12.4：表头 + 三面列名 + 关键行名子串；用例表 = 10 行）；§12.9 AC-A4-1 断言手段 = 用例 10。**计数同步（以本块为准）**：上文 :85「九用例 1:1」→ **「十用例 1:1」**；§12.7 新档估算 `+130 ± 40` → `+145 ± 40` |
| #3 | 🟡 | **父侧确认（记录）**：A2/A3 承载档归属（受限变体定义簇 = `ENGINEERING-MODE.md` §2.15 D5；slow 门 = `TESTING.md` §1.2）与机制本体相符——「认」，**本修正轮零动作**；上文 :92 ① 未确认面就此收口 |
| #4 | 🔵 | 设计档 §12.5 警示口径收窄：「警示恒显由结构保证（不依赖截断余量）」→「**警示不再位于最先牺牲段**（与 text 内既有状态标同权；极端长条目 + 极窄列随 text 既有右截断语义，80 列真实条目由 AC-A1-2 锚定）」 |
| #5 | 🔵 | 设计档 §12.1 面归属澄清（源面本次实核——as-of）：`cmd-advisor.mjs` 主菜单 item.note = Provider 注记（:134——**不含渠道警示**）；其渠道警示载体 = `buildModelEntries` 渠道列表 **header** note（:203-207——`(no key)` / `(fetch failed: …)`）——header 分支既有消费（`pickers.mjs:66`）已渲染，非本批 A1 收口面 |
| #6 | 🔵 | **req/design 同改**（等义收紧、语义不动）：`docs/requirements/TUI.md` N7 + 设计档 §12.5——注明**判定式为准**（任意渲染行 ≤ `cols − 8`，含指示行）；预算式 = 指示行文本预算（指示位宽在 8 格外另扣；机制核 = `render-frame.mjs:106-110` pad 补齐）；需求档变更记录一行 |
| #7 | 🔵 | 设计档 §12.7 拆分评审句补：「`test/eng-designer-role.test.mjs`（316±6——修正轮 #7）单点断言扩写（T30 归册 + T32b 扩断言）——不拆」——「其余档 ≤300 或无增」恢复成立 |
| #8 | 🔵 | 非缺陷（核验记录）：随交付链——交付报告附两档定向跑全绿证据 + as-of 数字实测回写（交付要求第 5 项已含）；本修正轮无文档动作 |

**修正轮完成**：7/7 落档（设计档 §12 · 需求档 N7/变更记录 · 本块）；§2 任务书以上述改写后为准（状态 = 修正轮完成——待父侧核验 / 用户批准链）。

**修正轮·补充（§2 覆盖·防歧义——2026-09-11）**：上文 :78（受影响文件表·新档行）的增量估算同口径更新——`+130 ± 40` → `+145 ± 40`（与设计档 §12.7 该行同值——新增来源 = 用例 10 文档面断言）；其余字段不变。

## §3 设计评审（评审子代理自写）


### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership / Methodology | 🔴 | 交付要求指派 eng-coder 回写设计档：`docs/design/TUI.md` §1 模块地图 4 行（`docs/batches/2026-09-11-TUI-SELECTION.md:87`、`docs/design/TUI.md:946`）——与「设计档 = eng-designer（含修订；写稿权唯一，不给直改留口子）」（`docs/design/ENGINEERING-MODE.md:319`/`:324`）及「落档动作经 eng-designer（主 agent/eng-coder 不代笔）」（`docs/design/ENGINEERING-MODE.md:91`）互斥；按 §2.27.8 连零语义格式修订都判归 designer（`docs/design/ENGINEERING-MODE.md:1326`）。且与本任务书自身「零改核对项：docs/**（写稿面 = 设计者；本批文档已落档）」（`docs/batches/2026-09-11-TUI-SELECTION.md:80`）及 §12.7「文档写域（设计者）：…本文件…」（`docs/design/TUI.md:942-943`）自相矛盾——coder 无法同时满足「docs/** 零改」与「改 4 行」。 | 二选一（父侧裁定）：① 收回该 coder 项，改由 eng-designer 收口时回写；② 显式定义「as-of 行数机械回写」为写权例外，并同改 §2.15 A2 / 批次档 §2 / TUI.md §12.7 三处口径。 |
| 2 | Acceptance criteria | 🟡 | AC-A4-1 机验手段「新档文档断言（读本文件「§12.4」关键行）」（`docs/design/TUI.md:973`）未落入 §12.8 用例表（9 表项无此项），与「新档九用例 1:1」（`docs/batches/2026-09-11-TUI-SELECTION.md:85`）计数对不上；「关键行」未钉子串——§12.9 表头「每条可机器验证」在此条落空。 | 落位二选一：把文档断言列为新档显式用例（并同步九用例计数与 +130±40 估算），或改判据为可执行命令 + 钉死子串（如 §12.4 表头/关键行的 grep）。 |
| 3 | Scope coordination | 🟡 | A2/A3 承载档超出批前声明档集：批前候选 = §2.22.x / TOOLS·AGENT-LOOP（`docs/batches/2026-09-11-TUI-SELECTION.md:28`），实落 = `§2.15 D.5`（`docs/design/ENGINEERING-MODE.md:431-446`）/ `TESTING §1.2`（`docs/design/TESTING.md:48-51`）——已在 `docs/batches/2026-09-11-TUI-SELECTION.md:92` ① 如实披露「父侧可否决重定向」。落点归属经核与机制本体相符（受限变体定义簇 D.2–D.5；slow 门 = TESTING §1.2）。 | 协同项（非缺陷）：父侧对 batch:92 ① 确认或否决即可；确认则无需改动。 |
| 4 | Clarity / A1 论证 | 🔵 | 「警示恒显由结构保证（不依赖截断余量）」（`docs/design/TUI.md:906`）略强于机制——text 自身仍走既有右截断（`docs/design/TUI.md:900-901` 自述「text 截断 = 既有语义」），极端长条目 + 窄列下 text 尾部的警示仍可被截（不在 AC/用例覆盖内：AC-A1-2 锚 80 列真实条目，`docs/design/TUI.md:971`）。引用面（setKeyFlow as-of :398 / wizard `(added, no key)`，`docs/design/TUI.md:904-905`）属源文件事实，本评审读取域内不可核验。 | 建议把保证口径收窄为「警示不再位于最先牺牲段（与 text 内既有状态标同权）」或补一条极端宽度边界用例；引用锚与 as-of 由 coder 交付时对照确认。 |
| 5 | Requirements coverage / A1 | 🔵 | §12.1 把 `cmd-advisor.mjs` 主菜单与 model-picker 合述为「（baseURL / (no key) / (不可用) / Provider 注记）」note 写入面（`docs/design/TUI.md:840-841`），而 §1 审计证据单指 `model-picker.mjs:125` 产出警示（`docs/batches/2026-09-11-TUI-SELECTION.md:20`）；§12.5 警示上移仅收口 model-picker——若 cmd-advisor 亦承载渠道警示，其「恒显」未收口；若不含，§12.1 合述措辞失准。 | 补一句面归属说明：cmd-advisor 面含警示 → 同款上移或明示豁免；不含 → 修 §12.1 措辞。（源面标 unverified） |
| 6 | Clarity / N7 | 🔵 | 宽度预算双口径并存：预算式「≤ cols − 8 − width(指示位)」与判定式「任意渲染行 ≤ cols − 8（含指示行）」（`docs/requirements/TUI.md:42` ↔ `docs/design/TUI.md:898-899`）；用例 4 锚 cols−8（cols=80 → ≤72，`docs/design/TUI.md:959`）。 | 注明判定式为准（或说明指示位宽已含于 8 格余量）；措辞若动需 req/design 同改。 |
| 7 | Affected-file annotations | 🔵 | §12.7 拆分评审句「其余档 ≤300 或无增」（`docs/design/TUI.md:945`）对 `test/eng-designer-role.test.mjs`（316，±6 → ≤322，跨 >300 advisory 档，`docs/design/TUI.md:939`）不成立——该行未获拆分评审明示（model-picker 496 / setup 355 均有）。 | 补半行「test 档 316±6——单点断言扩写，不拆」或改口径句。 |
| 8 | Verification record（非缺陷） | 🔵 | 重点核核验：① A4 选型（分工保留 + 契约对齐）判据/代价成立（§12.3 三候选对照 + TODO 来源「两项都做」回指，`docs/design/TUI.md:860-864`）；③ 见 #3；④ 三方一致 A1–A4 逐条成立（`docs/batches/2026-09-11-TUI-SELECTION.md:61-66` ↔ `docs/design/TUI.md:966-978` ↔ `docs/requirements/TUI.md:29-30`/`:42` + `docs/requirements/ENGINEERING-MODE.md:681-686` + `docs/requirements/TESTING.md:34-37`）；⑤ question 2 行 / wizard 滚动 / note 渲染面改动面自洽、T32b 扩断言零新增装配口径一致（`docs/design/TUI.md:952`）——但 T35 等既有断言串与 A2 替换串的独立性未在文档面点名（本域不可核验；缓解 = L0+ 定向跑两档，`docs/batches/2026-09-11-TUI-SELECTION.md:86`）；源 as-of（`key-handler.mjs:187-192` · `wizard.mjs:77` · 行数表）均不可在本文档面核验。 | 交付报告附两档定向跑全绿证据；as-of 数字由 coder 实测回写。 |

计数：🔴×1 · 🟡×2 · 🔵×5（合计 8 条）

VERDICT: changes-required

### 轮次 2（评审子代理）

第 20 批 · 轮次 2（单轮校验 + 硬性预算）——对象：轮次 1 的 8 条处置逐一落档核销。方法：只读各落点锚区（±10 行）逐点比对；未通读、未新猎。

**核销（8/8——全部落档，as-of 2026-09-11）**
1. #1 🔴：批 :108 覆盖块（coder 报告实测行数·不回写文档；设计者收口回写·写权无例外）+ `docs/design/TUI.md:953` §12.7 句改写（「修正轮 #1——时序归位」标）——✓
2. #2 🟡：`TUI.md:973` 用例 10（表头 + 三面列名 + 关键行名子串——§12.4 :870-:887 实核：表头「### 12.4 选择面契约」/ 列名 `picker`·`wizard provider 步`·`question options` / 行名 `↑↓ 语义`·`选中项可见性`·`面特有豁免` 齐）+ `:982` AC-A4-1 断言手段 + `:947` +145 ± 40 + 批 :109「十用例 1:1」——✓
3. #3 🟡：批 :110 父侧确认记录（零动作；:92 ① 收口）——✓
4. #4 🔵：`TUI.md:912-913` 警示口径收窄（「警示不再位于最先牺牲段」）——✓
5. #5 🔵：`TUI.md:838-844` cmd-advisor 面归属澄清（渠道警示载体 = header note；非本批 A1 收口面）——✓
6. #6 🔵：`requirements/TUI.md:42` + `TUI.md:902-905` 判定式口径（两处「修正轮 #6」标；需求档变更记录 :56）——✓
7. #7 🔵：`TUI.md:952` 拆分评审句补（`test/eng-designer-role.test.mjs` 316±6 不拆；「其余档 ≤300 或无增」恢复成立）——✓
8. #8 🔵：批 :115 核验记录（随交付链；本修正轮无文档动作）——✓

**发现表**：0 条——无残遗 / 无未落 / 无新增矛盾。（§2 原位行 :78/:85/:87 与修正块差量为 :100「本追加与上文本冲突时以本追加为准」+ :108/:109/:119「以本块为准 / §2 覆盖」既定覆盖机制，核验非未落。）

**VERDICT: pass**。计数：🔴 0 · 🟡 0 · 🔵 0；处置核销 8/8。（凭证值依 §2.7 不落档——token/designId 不写。）

## §4 用户批准（主 agent 记）

**2026-09-11 18:15 父侧代签**——用户 12:48 授权（13:38 延展至排空）；条件齐备：

- **轮次 1**：changes-required（🔴1 · 🟡2 · 🔵5——§3 轮次 1）；**修正轮 8/8 落地**（含 🔴 = 写权归位：coder 报告行数/设计者收口回写）——父侧实文核验 + **轮次 2 = pass**（8/8 核销 · 0 残遗——§3 轮次 2）；
- **token 已签发**（值不落档）。

**批准范围**：7 档（`pickers.mjs` · `model-picker.mjs` · `key-modes.mjs` · `wizard.mjs` · `setup.mjs` · `test/eng-designer-role.test.mjs` · 新测档 `test/tui-selection-surfaces.test.mjs`）。

**遗留（批准时登记）**：① **coder 不回写文档**——交付时报告 §1 地图 4 源文件实测行数，**设计者收口阶段回写**（修正轮 #1 时序归位）；② 新档文档断言（用例 10）+ as-of 数字随交付链；③ commit 待父侧。

## §5 实施记录（eng-coder 自写）


**状态：实现完成**（2026-09-11——本批 7 档落笔；L0+ 定向两档 + 快层证据齐备）。上方「待写」占位行为 append-only 工具面既有行——不改（同 §2 同款）。内部闭环（偏差审计 → advisor 代码评审 → 收敛）终态见本段末「内部闭环」块。

### 落笔清单（逐条对设计档 §12——行为语义零偏离）

| # | 条目 | 落点（as-of 2026-09-11） | 状态 |
|---|---|---|---|
| A1 | item.note 消费（`{prefix}{text}{marker}{note}`；无 note 零尾随） | `src/tui/pickers.mjs:72-77`（`rebuildLines` item 分支） | Done |
| A1 | 警示（`(no key)` / `(不可用)`）上移 text、note 收窄为 baseURL | `src/tui/model-picker.mjs:114-127`（`buildProviderEntries`；字段序 = 名 → 模型 → ctx → 警示 → 会话标） | Done |
| A2 | 受限变体 3 个文案面同 7 动作清单、删 `check` | `src/agent/setup.mjs:253` / `:259` / `:260`（逐字照 `docs/design/ENGINEERING-MODE.md` §2.15 D5 草案） | Done |
| A3 | T30 归册（`slow(` 注册 + import） | `test/eng-designer-role.test.mjs:87`（注册行）+ `:29`（import） | Done |
| A4 | question options ↑↓ 环绕（原钳位） | `src/tui/key-modes.mjs:93-97` | Done |
| A4 | wizard provider 选中行自动滚入可视窗（winH 走 `computeLayout` + try/catch 兜底 8） | `src/tui/wizard.mjs:106-117` | Done |
| 测试 | 新档用例 1–10（设计档 §12.8 逐行 1:1） | `test/tui-selection-surfaces.test.mjs`（新增 237 行） | Done |
| 测试 | T32b 扩断言（A2：7 动作 / 无 `check` / 机械门文案同清单） | `test/eng-designer-role.test.mjs:148-165` | Done |

### 交付透明表（Done / Simplified / Not done）

| AC | 判据 | 状态 | 证据（机验） |
|---|---|---|---|
| AC-A1-1 | item note 渲染 / 无 note 行形态不变 | Done | 用例 1/2 直驱断言（`" ▸ a  N1"` / `"   b"`） |
| AC-A1-2 | 警示恒显（80 列渲染行含警示） | Done | 用例 3——真 `buildProviderEntries` + `renderPicker` 输出断言（含 `(no key)` / `(不可用)`） |
| AC-A1-3 | 行宽预算（任意渲染行 ≤ cols−8；超宽右截断带 `…`） | Done | 用例 4——`stringWidth ≤ 72` 全行遍历（含指示行）+ `…` + prefix/text 保全 |
| AC-A4-1 | 契约表落档（设计档 §12.4） | Done | 用例 10——读 `docs/design/TUI.md` §12.4（表头 + 三面列名 + 关键行名子串） |
| AC-A4-2 | question ↑↓ 环绕（末→0；首→末） | Done | 用例 5 直驱断言 |
| AC-A4-3 | wizard 选中项恒在可视窗 | Done | 用例 6（越窗 scroll 调整 + 回顶收回）+ 用例 8（dims 缺失/抛错 → 兜底 8） |
| AC-A4-4 | 三面零回归 | Done | 用例 7/9 + 快层全量 471 pass（既有 TUI 测试面零伤） |
| AC-A2-1 | 受限变体描述同 7 动作清单、无 `check` | Done | T32b 扩断言（设计者 / eng-coder 两处 description + action 描述 + 机械门文案同清单——零新增装配调用） |
| AC-A3-1 | T30 归册（慢门） | Done | 源码断言（`slow("T30` 在位——脚本核验 true）+ 快层 skip 可见 + 单档全量面 11/11 |

**Simplified**：无。**Not done**：无。（零简化、零替代、零降级。）

### §1 模块地图所触 4 源文件实测行数（口径 `split("\n").length` 含末行——交付自查项，仅报告、不回写）

| 文件 | as-of 实测行数 |
|---|---|
| `src/tui/pickers.mjs` | 112 |
| `src/tui/model-picker.mjs` | 499 |
| `src/tui/key-modes.mjs` | 240 |
| `src/tui/wizard.mjs` | 242 |

（`model-picker.mjs` 未收 §1 地图——设计档 §1 抬头既有注记；地图行回写归设计者收口阶段——修正轮 #1 时序归位。）

### 验证证据（L0+ 分层——不跑全量：父侧 L2 为唯一全量点）

- 定向两档：`node --test test/tui-selection-surfaces.test.mjs test/eng-designer-role.test.mjs` → tests 21 · pass 20 · fail 0 · skipped 1（T30 = slow 归册——快层 skip 为预期语义）。
- 单档全量面：`THINCODER_TEST_FULL=1 node --test test/eng-designer-role.test.mjs` → 11/11 pass（T30 归册后照跑）。
- 快层：`npm test`（run-fast）→ tests 485 · pass 471 · fail 1 · skipped 13；slow 门零超阈拦截（无归册告警）。
- 语法：7 档逐档 lint（`node --check` 口径）全绿。

### 偏差披露与遗留

1. **快层 1 fail 非本批**：`test/doc-consistency.test.mjs` T41 ① 报 V1/V2 新增违规，全部落在 `docs/**`（本批写域外——本批零文档写入，`src/**` + `test/**` 为声明写域）。涉及档 = `docs/batches/2026-09-11-PORTABILITY.md`（他批，自指节引）+ 本批次档 §3 段（评审引文）+ §4 段（计数句与列表数不符）。责任人 = 对应段作者；处置归父侧。
2. **行数增量实况**（对照设计档 §12.7 估算）：pickers +5（估算 +3±2）· model-picker +3（±4）· key-modes +1（±4）· wizard +14（+8±4）。wizard 超估算上界 2 行——来源 = 注释与 try/catch 结构（机制零偏离）；零 AC 影响；242 行仍在 ≤300 advisory 内，拆分评审结论不变。
3. **行号漂移披露**：`test/eng-designer-role.test.mjs` 工作区在 spawn 前已含他批改动（RF-3a/3b/3c 相关断言），实测 346 行（设计档 as-of 316）——本批 A2/A3 叠加于该现状；本批自身增量 = header 注记 + import + T32b 扩块。
4. **观察（未改——设计范围外）**：`src/agent/setup.mjs:221` 与 `:230` 块注释仍引已退役动作 `check`（历史迁移注记）；本批 A2 设计面 = 3 个描述文案面（不含注释），未动；是否同步归父侧 / 设计者定。

### 内部闭环（审计与代码评审轮次 · 终态）

- **轮次 1 · 内部偏差审计**（explore 只读子代理，审计任务书机械附加上本批写域）：四类偏差逐类显式结论 = 零（部分实现 / 静默简化 / 文档漂移 / 越表改动）；附 4 条观察（行数实况两条 = 本段既有披露，未新增缺口）。终态 = clean。
- **轮次 1 · advisor 代码评审**（in-child 同步——评审对象 = 7 档 + 设计/需求/批次档）：**VERDICT = pass**（🔴 0）；发现 3 项（🟡 1 · 🔵 2）逐条处置见下表。
- **终态：clean**——审计零偏差 + 评审 pass；零修正轮（无 must-fix，代码零改；下方第 3 行处置 ≠ 代码改动）。

| # | 级别 | 评审发现 | 处置（Action） | 明细（Detail） |
|---|---|---|---|---|
| 1 | 🟡 | 三档 >300 档位：`src/tui/model-picker.mjs`（499，距 500 硬限 1 行余量）· `src/agent/setup.mjs`（355）· `test/eng-designer-role.test.mjs`（346）——均 >300 advisory | `Deferred` | 设计档 §12.7 拆分评审已裁决本批不拆（单点增量 +3/+3/+6）；拆分属新范围（须新设计 / 评审）——余量 1 行的拆分评估应在下一次非纯文案触碰 model-picker.mjs 时先行 |
| 2 | 🔵 | `src/agent/setup.mjs:221` 注释残句仍列已退役动作 `check` | `Deferred` | A2 设计面 = 3 个 description 文案面（注释不在内）；已知并已在「偏差披露 4」登记——注释同步归父侧 / 设计者定 |
| 3 | 🔵 | 新测档行数实况 237 未与设计估算 `+145 ± 40` 作对照披露 | `Fixed` | 本补充即修：237 行超估算上界（185）52 行——来源 = 10 用例逐条断言 + 最小 state / 桩面 + 用例 10 文档面断言；无档位影响（237 ≤ 300）；设计者收口回写行数时一并核 |

计数（评审发现）：🔴 0 · 🟡 1（非阻塞）· 🔵 2；处置核销 3/3。

## §6 验证与收口（父代理自写）

**2026-09-12 02:00 父侧收口**（用户授权窗口 12:48→排空）。

### 父侧验证

- 定向 **20/21 pass·0 fail**（1 skip = T30 slow 归册——预期）· 归册后全量面 **11/11** · 快层 485/471/1（T41① 他链）；
- **父侧抽核**：新测档 236 行 ✓ · `pickers` note 消费 ✓ · `key-modes` 环绕 ✓ · `setup` 文案面 check 已净（残留仅在 :221/:230 注释——已披露）✓ · §5 自写 ✓；
- 内部：审计 clean + 代码评审 pass（🔴0）——**零修正轮**。

### 逐条验收结论

- **AC-A1-1 / A1-2 / A1-3 / A2-1 / A3-1 / A4-1–4 全绿**；**Simplified 零 · Not done 零**；偏差如实（含 model-picker 499 距硬限 1 行、拆分评估转下批登记）。

### 核销同步清单

- 角色表：无 ✓ · 状态行：§5 clean ✓ · 计数：7 档实测行数已入报告 ✓ · 指针：设计 §12 ↔ 用例 1:1 ✓ · 待办：:221/:230 注释同步（登记）+ model-picker 拆分评估（下批）✓

### 遗留项

1. `src/agent/setup.mjs:221/:230` 注释仍列退役动作 `check`（设计面外——父侧/设计者定）；
2. `model-picker.mjs` 499 行距硬限 1 行——下一次触碰先行拆分评估（登记）；
3. **设计 token 已消费（链终）**；commit 待父侧随批提交。
