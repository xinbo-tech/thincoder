# 2026-11-01 · vsc-archive-sublabel
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-11-01 · 来源 = 用户 2026-11-01 20:47「那你把这三批都处理了吧」+ 台账 #1733。
> 台账 = #1733（WEBVIEW · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-11-01
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

## 1. 讨论与结论（主 agent）

**覆盖账 = #1733**

### 1.1 用户裁定（逐字）

> 20:47：「**那你把这三批都处理了吧**」（三批 = 台账 #1733 ∥ #1867 ∥ #1722）

### 1.2 现状（父侧本轮实读，非转述）

`thincoder-vscode/webview/activity.js:142`-`:153` 逐字：

```js
function rowsOf(block) {
  const content = block.querySelector(".advisor-content")
  const out = []
  for (const el of content ? [...content.children] : []) {
    const text = String(el.textContent ?? "")
    if (text === "") continue
    const kind = el.classList.contains("advisor-tool-line") ? "tool"
      : (typeof el.dataset?.kind === "string" && el.dataset.kind) ? el.dataset.kind : "text"
    out.push({ kind, text })
  }
  return out
}
```

**该档 `dataset.sub` 全档 0 命中。**

### 1.3 病（判据句）

**子代理块的行首子标（`explore#1 · `）在归档快照里活不下来。** 快照取 `el.textContent`，子标是内联的 span 文本 ⇒ 重放后它变成普通正文，**保住了字面、丢了「这是谁的第几行」这层结构**。

**桌面侧保得住 —— 这就是端差**：同一份记录，VSC 恢复后读出来和桌面恢复后读出来不一样。

### 1.4 设计席要判的第一件事

**子标的承载形**：是给 `rowsOf` 的条目补一个字段（`sub`），还是让行元素自带 `dataset.sub` 由快照读取，**或者判「子标不该进快照、改由块头携带」**。

**判据不是我定的，是盘上的**：先读桌面侧同一点的做法（`subchunkOf` 一族），**按既有形对齐**；要偏离须给具体不可用的理由。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

### 2.1 覆盖条目（本批 = 一条）

台账 #1733（WEBVIEW · 归批）——**子代理块归档快照的行首子标在重放后存活**。

| # | 条目 | 回指 |
|---|---|---|
| 1 | 归档快照的 `rows` 条目携 `sub`（结构承载，字面不进 `text`）；重放走同一核件 ⇒ VSC 与桌面读同一份快照出同一行；存量快照零迁移容读 | 需求 F-W1（恢复后存续）· I-7（收窄负控）· core §4.4 F-S7；设计 `docs/vsc/design/WEBVIEW.md` §5.7（行形条）· §6 D-W46 · §8 U-W25 |

**不在本批**：`cmd` ∥ `tool` ∥ `face` 三个桌面行形字段（理由 = 设计 §5.7「不取其三字段」条：本端行元素只写 `dataset.face` / `dataset.tool`，`cmd` 只进状态词；回放分行已由 DOM 行粒度固化）——不登记为本批待办。

### 2.2 设计落点

`docs/vsc/design/WEBVIEW.md` §5.7「写面」增「行形：子标随行」条 + 用例表 T-A46–T-A49；§6 D-W46；§8 U-W25；§10 第 17 行（回指 F-W1 · I-7）。

### 2.3 机制设计（一行为断）

`rows` 条目 = `{ kind, text, sub? }`：`sub` = 行首子标的字面（嵌套身份），`text` = **行正文**（不含子标字面）。

- **派生点**（唯一）：`thincoder-vscode/webview/activity.js:142` `rowsOf` —— 逐子元素读 `dataset.sub`（`thincoder-render-core/flow/block.mjs:62` 工具行 · `:78` 文本/思考行写入）与正文文本节点；**行首 `span.advisor-sub` 不计入 `text`**（带字面回放 ⇒ `explore#1 · explore#1 · …` 双份）。
- **回放点**（零改）：`webview/record-restore.js:92` `renderSubagentChunk(block, row)` → 核 `thincoder-render-core/subblocks/block.mjs:52-54` `appendAdvisorChunk(block, kind, m?.text, m?.sub, m)` —— 核件已读 `row.sub`，桌面经 `/rc/` 取同件 ⇒ 两端同形零新增逻辑。
- **对齐依据（桌面现行形，实读）**：`thincoder-desktop/renderer/subagent-reduce.mjs:46` `SUBCHUNK_KEYS = ["kind","text","sub","tool","face","cmd"]` ⇒ `:69-75` `subchunkOf` 白名单投影 ⇒ `:166-169` 快照 `rows` 原样带 `sub`。桌面无 DOM（行即载荷投影），本端行由 DOM 派生 ⇒ 补同一字段名，零新名。
- **候选③（子标不进快照、改由块头携带）已否**：块头 = 父的身份（D-W44，用户 2026-09-07 裁定）；一个块内多行分属不同子代（`advisor#1` ∥ `advisor#1/explore#2`——§5.6 T-A38）⇒ 块头无处安放逐行身份。
- **容读（存量，append-only 不可迁移）**：条目无 `sub` ⇒ 零 `span.advisor-sub`、`text` 原样 ⇒ 子标留正文，呈现与修前逐字一致；零迁移 ∥ 零回填 ∥ 零版本标记。

### 2.4 受影响文件与测试覆盖

| 文件 | 处置 |
|---|---|
| `thincoder-vscode/webview/activity.js` | 改 —— `rowsOf` 增读 `dataset.sub` + 正文取值跳过 `span.advisor-sub`；快照构建函数导出供用例取用（不新建第二份派生——D2） |
| `docs/vsc/design/WEBVIEW.md` | 改 —— §5.7 ∥ §6 ∥ §8 ∥ §10（本落点） |
| `docs/batches/2026-11-01-vsc-archive-sublabel.test.mjs` | 新 —— 本批单元用例件（收口即删） |
| 零改（实读确认） | 核 `thincoder-render-core/flow/block.mjs`（已写 `dataset.sub`）· 核 `subblocks/block.mjs`（已透传 `m?.sub`）· `thincoder-vscode/webview/record-restore.js`（已整条 row 回放）· 桌面 `renderer/subagent-reduce.mjs` · CLI |

**层级结论**：无档跨层（`activity.js` 为产品代码面单点改，无拆分需求；其余为文档面 ∥ 一次性用例件）。

### 2.5 验收对照（机判）

| # | 判据 | 形式 |
|---|---|---|
| 1 | 嵌套行快照带 `sub` 且正文无子标字面 | `node --test docs/batches/2026-11-01-vsc-archive-sublabel.test.mjs`（T-A46；**修前红**：`sub` 缺席、字面在 `text`） |
| 2 | 同一行形回放出同一行 | 同档（T-A47：`span.advisor-sub` 恰 1 个、文本 = `<sub> · `、行全文与 live 行逐字等） |
| 3 | 负控：父自己的行 | 同档（T-A48：条目无 `sub` 键、回放零子标 span） |
| 4 | 容读：存量快照 | 同档（T-A49：手写无 `sub` 条目回放后逐字不变） |

用例件 = `docs/batches/2026-11-01-vsc-archive-sublabel.test.mjs`（与批档同名同址，收口删）；`document` 由用例自备最小桩——**本工作树未装 happy-dom**（`thincoder-vscode/package.json:156` 仅 devDep 声明），故不走 happy-dom 径。

### 2.6 关键决策

见设计档 `docs/vsc/design/WEBVIEW.md` §6 **D-W46**（行形带 `sub`；③ 已否）+ §8 **U-W25**。不改块头、不改核件、不改协议行形。

### 2.7 上抛项

1. **[上抛·待裁] 核档与在盘形不符**：`docs/core/design/SESSION.md:1041` 把 `rows` 声明为 `Array<{ kind: string, text: string }>`，而桌面自 2026-10 起已按 `subagent-reduce.mjs:46` 的行白名单写入 `sub` / `tool` / `face` / `cmd`。该行是**下界**（本批按此设计）还是**闭集**（则桌面在盘记录已违约），须核侧裁定；核档不在本席写域（只报不改）。本席倾向：与同段 `meta`「未知字段原样携带」对齐，写为已知字段 + 未知字段携带。

### 2.8 修订轮（评审 1 · changes-required 逐条处置）

| 评审号 | 级 | 落点 | 改后 |
|---|---|---|---|
| 1 | 🔴 | 本档 §2.9（新）· `test/RTM.md` VSC 端节 | 集成用例增量按三问作答；缺行已先在 RTM 定号（故事 1 · 行 1-1 ∥ 1-2） |
| 2 | 🟡 | 设计 §5.7「反向」条 + 「容差 ③」 | CLI 读面实测坐标 + 端差登记（不是「零丢失」） |
| 3 | 🟡 | 父侧同轮已落（`docs/core/design/SESSION.md` 行形补 `sub?`） | 本席零改 |
| 4 | 🟡 | 设计 §5.7 用例首段 | 改判 **(a) happy-dom**；弃用理由由环境态改为**路径可达性**；「工作树未装」一句删除 |
| 5 | 🟡 | 设计 §5.7「空正文行的判据」+ 用例 T-A50 | 谓词重导（有 `sub` 即保行）+ 边界用例 |
| 6 | 🟡 | 设计 §5.7「勘察源」条 | 补一行（含「无独立档仓 ⇒ 不适用」的结论） |
| 7 | 🟡 | 设计 §5.2 用例行 + §5.7 用例首段 | 单元用例件 = 批次本地件；**不入** `test/files.mjs` 清单 |
| 8 | 🔵 | 设计 §5.7 T-A46 ∥ T-A47 | 两行各给全文本期望 |
| 9 · 10 · 11 | 🔵 | 零改 | 评审自判「无需改」，本席复议一致 |

#### #1 集成用例增量 —— 见 §2.9（读 `test/RTM.md` 作答）

#### #2 CLI 读面（反向容读）

实读坐标 = `thincoder-cli/src/tui/lifecycle-records.mjs:143`：

```js
const blocks = rows.map((r) => ({ kind: typeof r?.kind === "string" ? r.kind : "text", text: String(r?.text ?? "") }))
```

⇒ CLI 的 `synthSubTask` 只消费 `kind` ∥ `text`，**`sub` 不消费**。后果：VSC 写的新形记录在 CLI 恢复行里没有行首子标（存量记录字面在 `text` 内，照旧有）。

**这是真端差，不是「零丢失」**：本批把子标移出 `text`，CLI 读面就接不到它。处置 = 设计 §5.7 登记**容差 ③**（补法 = CLI 读面消费 `sub`；`thincoder-cli/**` 不在本档写域 ⇒ 另批）。核档那句「零丢失」与容差 ③ 的相容由主 agent 落一行（上抛项 1）。

#### #4 DOM 底座 —— 判 (a) happy-dom

**事实更正**：「本工作树未装 happy-dom」不成立 —— 实测 `thincoder-vscode/node_modules/happy-dom/package.json` 的 `version` = `20.11.2`，在盘。

**选 (a) 的理由**：happy-dom 是本档 `:518` ∥ `:263` 已声明的机检驱动；它就在 `thincoder-vscode/package.json` 的 devDependencies（`@happy-dom/global-registrator`）名下。走它，本档只留**一套** DOM 底座。

**唯一真障碍是路径可达性，不是环境态**：用例件住 `docs/batches/`，Node 的裸说明符解析自该目录只走 `docs/batches/node_modules` → `docs/node_modules` → 仓根 `node_modules`（仓根无 happy-dom，实测）⇒ 一律**相对路径导入**，落到 `thincoder-vscode/node_modules`。故两处「DOM 底座」按**载体位**分界（批档目录 ∥ VSC 测试树），不按环境分界，文档不再自相矛盾。

#### #5 空正文行

判据重导：跳过条件由「`text` 为空」改为「`text` 为空 **∧ `sub` 缺席**」。理由 = `text` 的语义本批从「整行字面」变为「行正文」，空判据的依据随之变；只带子标无正文的行是**有身份的行**，不是空噪行。

今日数据上该态不可达（核 `thincoder-render-core/subblocks/block.mjs:48` `if (!str) return` ⇒ 行元素必有非空正文）——所以这**不是**给没见过的输入加分支，是谓词跟着字段语义一起改。边界用例 = T-A50（手造元素，修前红）。

#### #7 用例件落点 —— 不是新先例，是被机器检查的位置

**文档自述**：`thincoder-vscode/test/files.mjs` 首段逐字 =「单元档 = 批次本地件（名随批次档、住批次目录）；集成档 = 业务设立（窗口 50–100）」。

**收口门机械判据**：`test/RTM.md` 行 7-4 ——「收口前在批档同目录放本批自己的单元测试档 `<批档名>.test.mjs`…再收口」⇒ 收口被拒。

两条同向 ⇒ 批次本地是被检查的位置。**不入 `test/files.mjs` 清单**：该清单服务 `npm test` 单入口，而本件收口即删 —— 列进去，收口后必留一条指向已删档的清单项。集成件归 `test/integration/**` 并由 RTM 定号（§2.9）。

**顺带收正**：设计 §5.2 用例行原写「载体 = VSC 测试树，清单单源 `test/files.mjs`——单元用例件收口即删」，自相矛盾（列进清单的档收口即删），已改为「单元用例件 = 批次本地件（名随批档、住批档目录，收口前删净）」。

### 2.9 集成用例增量（读 `test/RTM.md` 逐节作答）

- **打破的行**：**0**。VSC 端节原为零行（「尚无集成用例」），桌面端节亦零行 ⇒ 无既有断言被本变更改写。
- **冗余的行**：**0**。
- **缺的行**：**1 个故事 + 2 行**，已先在 `test/RTM.md` 定号并落表（编号先行）：
  - 故事 1「归档块重开 ∥ reload 后，子代理行还是子代理行」——目的 ∥ 节注（回指 ∥ 交互组件 ∥ 进入口）∥ 三态行序已写。
  - 行 **1-1**（正常）：重开面板 ∥ `reload` 后子代行行首子标在场、父行零子标、正文逐字。
  - 行 **1-2**（边界）：同一会话 CLI 端恢复 —— 存量记录两端等；VSC 新形在 CLI 无子标前缀，按容差 ③ 判（不判红）。
  - 用例件 = `test/integration/vsc-record-sublabel.test.mjs`（父侧收口建并跑）。
- **不是「无增量」免责形**：本变更改变用户可见结果（重开后的行首子标，U-W25 已定）⇒ 不满足「不改既有用例断言的可观察业务结果 ∧ 不新增产品真需要的场景」两条同时成立。
- 集成半场报在收口行，本席不跑。

### 2.10 受影响文件（修订 §2.4）

| 文件 | 处置 |
|---|---|
| `thincoder-vscode/webview/record-rows.js` | **新** —— `rowsOf` ∥ `rowLines` ∥ `boundRows` 迁出为叶件（零依赖）。理由：`activity.js` 顶层链 `state.js`（`state.js:10` `export const vscode = acquireVsCodeApi()` · `:15-30` 十处 `document.getElementById(…)` 即读）⇒ 用例若直取 `activity.js`，桩面 = 整条 webview 模块图，不可列尽。**否掉**「从 `activity.js` 导出即可」：桩面不封口，验收不可跑 |
| `thincoder-vscode/webview/activity.js` | 改 —— 改为 import 叶件；`subagentSnapshotOf` ∥ 出站留原址（触 `_subMeta` ∥ `ctx`）——禁第二份派生（D2） |
| `docs/vsc/design/WEBVIEW.md` | 改 —— §5.2 用例行 ∥ §5.7（勘察源 · 派生点 · 空正文判据 · 容读两向 · 容差 ③ · 验收回指 · 用例首段 · T-A46 ∥ T-A47 ∥ T-A49 修订 · T-A50 新增） |
| `test/RTM.md` | 改 —— VSC 端节：故事 1 + 行 1-1 ∥ 1-2（见 §2.9） |
| `docs/batches/2026-11-01-vsc-archive-sublabel.test.mjs` | 新 —— 本批单元用例件（收口即删）；DOM 底座 = happy-dom，相对路径导入 |
| 零改（实读确认） | 核 `thincoder-render-core/flow/block.mjs`（已写 `dataset.sub`）· 核 `subblocks/block.mjs`（已透传 `m?.sub`）· `webview/record-restore.js`（已整条 row 回放）· 桌面 `renderer/subagent-reduce.mjs` · CLI（容差 ③） |

**层级结论**：无档跨层（`record-rows.js` 是产品码内一次叶件迁出，无拆分需求；其余为文档面 ∥ 一次性用例件）。

### 2.11 验收对照（修订 §2.5）

| # | 判据 | 形式 |
|---|---|---|
| 1 | 嵌套行快照带 `sub` 且正文无子标字面 | `node --test docs/batches/2026-11-01-vsc-archive-sublabel.test.mjs`（T-A46；**修前红**） |
| 2 | 同一行形回放出同一行（两行各一条全文本期望） | 同档（T-A47） |
| 3 | 负控：父自己的行 | 同档（T-A48） |
| 4 | 容读：存量快照 | 同档（T-A49） |
| 5 | 只带子标无正文的行仍保留 | 同档（T-A50；**修前红**） |

判据文字与期望值单源 = 设计 §5.7 用例表（T-A46–T-A50），本档只回指。集成半场 = `test/RTM.md` 行 1-1 ∥ 1-2（父侧收口跑，不入本批判据）。

### 2.12 上抛项（修订 §2.7）

1. **[上抛·待裁] `docs/core/design/SESSION.md` 容差表需补一条**：容差 ③（CLI 读面不消费 `sub`）与该档「零丢失」句不并立。建议落文 = 「CLI 恢复面对行首子标的消费缺位——记录行形带 `sub` 后 VSC→CLI 恢复行无子标前缀（存量记录不受影响）；补法 = CLI 读面消费 `sub`；到期 = 该读面下次实质改动」。核档不在本席写域，只报不改。
2. **（已结）** 原第 1 条（`rows` 条目字段表滞后）：父侧同轮已补 `sub?`。

#### #7 补记 —— `files.mjs` 自身两行并存（登记 ∥ 批次本地）

实读 `thincoder-vscode/test/files.mjs` 全文 9 行，其中两行同档并存：

- `:5` 「重建规则：单元档 = 批次本地件（名随批次档、住批次目录）；集成档 = 业务设立（窗口 50–100）。」
- `:6` 「新增测试文件：在此登记。」

`:6` 与 `:5` 对「批次本地单元档」这一件指两个方向。本席的处置与理由：`:6` 的射程 = `npm test` 单入口所跑的清单——它列的是**收口后仍在盘**的档；批次本地单元档收口即删，列进去必在收口后留一条指向已删档的项（该入口随即红）。故本批单元件不入清单，`:5` 为准。

该二行的取舍属文件头自身张力，不构成本批机制决策——登记于此供评审核，不改 `files.mjs`（非本批写域所需，且改头部规则句 = 另立口径）。

### 2.13 修订轮 2（父侧裁定：容差 ③ 不登记，本批消掉 —— CLI 读面同批做）

**裁定来源** = 父侧本轮派单（用户 2026-11-01 20:47 批三批之后，父侧就容差 ③ 的处置裁「端差默认处置 = 消，不是登记；登记容差就是给端差发长期居住证」）。**本批边界随之扩一格**：CLI 读面 `sub` 消费纳入本批，跨端恢复面**零容差登记**。`docs/core/design/SESSION.md` 容差表不动（容差 ③ 已不存在）。

#### ① CLI 现行渲染形（父侧已读，本席复核 —— 逐字）

- `thincoder-cli/src/tui/lifecycle-records.mjs:143` `const blocks = rows.map((r) => ({ kind: typeof r?.kind === "string" ? r.kind : "text", text: String(r?.text ?? "") }))` ⇒ **`sub` 在此丢掉**（本席复核：同档 `:68-77` `rowsOf` 写面亦只写 `{kind,text}`）。
- 行文消费点（渲染面，无注入位）：`thincoder-cli/src/tui/render-segments.mjs:115` `const body = renderBlockTimeline(sub.blocks, cols)`（展开体）∥ `:124` `for (const line of foldTailLines(sub.blocks))` → `:125` `out.push({ text: \`│ ${sliceByWidth(line, cols - 4)}\`, color: C.dim, _skipDimFold: true })`（折叠尾 3 行）——**`b.text` 逐字上屏**。
- 身份现承载位 = 冻结头 `:103` `const head = \`[${icon} ${sub.key}${modePart}${modelPart} · ${verb} ${elapsed}s${turnPart}]\``（块级，一行一个身份）。

#### ② CLI 承载形 + 三端一致性

**承载形 = 行首文本前缀** `explore#1 · read — src/x.mjs`（TUI 无 span 面；` · ` = U+00B7 前后各一空格，与核心 `span.advisor-sub` 的文本同一串）。

- **合成点 = 读面**（唯一）：`lifecycle-records.mjs:143` 条目带 `sub` ⇒ `text = \`${sub} · ${text}\``；不带 ⇒ 原样。**渲染面零改**（折叠尾 3 ∥ 展开体同点出形，两处不各写一份）。
- **不选「渲染面合成」**：渲染两端为活流与恢复共用，在渲染面加前缀要给活流行加 `sub`，而 CLI 活流逐行身份本就不存在（身份在冻结头 ∥ 嵌套子代各占自己载体）——那是给不存在的输入加分支。
- **三端同一件事怎么成立（三条可机判）**：同一 `sub` 字面（记录字段，不派生）· 同一位置（行首）· 同一分隔符（` · ` 同一串）⇒ 观察结果 = 行全文同一串 `explore#1 · read — src/x.mjs`；三端差别只在承载（DOM span ∥ 纯文本），不在内容。
- **空正文行**：`sub` 在场 ∧ `text` 空 ⇒ 行 = `<sub> · `（有身份的行，不丢；与 VSC 侧 T-A50 同判）。
- **存量容读**：条目无 `sub` ⇒ 零前缀、`text` 原样 ⇒ 存量 VSC 快照（字面烙在 `text` 内）在 CLI 恢复后逐字不变；零迁移 ∥ 零版本标记。
- **写面不变、不双份**：CLI 自产快照恒为无 `sub` 形 ⇒ CLI 恢复块若再归档，写出的是前缀已在 `text` 内的字面形（呈现不变、不叠第二份子标）。

#### ③ 受影响文件（增补 §2.10）

| 文件 | 处置 |
|---|---|
| `thincoder-cli/src/tui/lifecycle-records.mjs` | **改** —— 读面 `synthSubTask`（`:143`）合成行首前缀；空正文行保行 |
| `docs/cli/design/TUI-SESSION-VIEW.md` | **改** —— §6 增「行首子标（跨端恢复）」条（承载形 ∥ 合成点 ∥ 三端三条 ∥ 空正文 ∥ 写面不变 ∥ 存量容读）+ 用例表 T-S1–T-S4 |
| `docs/vsc/design/WEBVIEW.md` | **改** —— §5.7「反向」条改为 CLI 读面同形 + 「跨端不设容差」条（容差 ③ 两段删除） |
| `test/RTM.md` | **改** —— 行 1-2 断言改写：由「CLI 无子标前缀，按容差判不判红」改为「CLI 恢复面同样以 `explore#1 · ` 起头，行全文与 VSC 逐字一致」 |
| `thincoder-cli/src/tui/render-segments.mjs` · `thincoder-cli/src/tui/subagent-children.mjs` | **零改**（实读确认：行文逐字消费 `b.text`；活流行不带 `sub`） |
| `docs/core/design/SESSION.md` | **零改**（容差 ③ 不再存在，容差表无须补行） |

**层级结论**：无档跨层（`lifecycle-records.mjs` 为产品码单点读面改，无拆分需求；其余为文档面 ∥ 一次性用例件）。

#### ④ 验收对照（增补 §2.11；判据文字与期望值单源 = `docs/cli/design/TUI-SESSION-VIEW.md` §6 用例表）

| # | 判据 | 形式 |
|---|---|---|
| 6 | CLI 读面：新形记录 ⇒ 行首前缀在场 | `node --test docs/batches/2026-11-01-vsc-archive-sublabel.test.mjs`（T-S1；**修前红**：前缀缺席） |
| 7 | 负控：父自己的行零前缀 | 同档（T-S2） |
| 8 | 容读：存量记录逐字不变、子标恰一份 | 同档（T-S3） |
| 9 | 边界：只带子标无正文仍保留 | 同档（T-S4） |

集成半场 = `test/RTM.md` VSC 端故事 1 行 1-1 ∥ 1-2（1-2 已改写为两端同形判等），父侧收口跑，不入本批判据。

#### ⑤ 上抛项处置

- 原 §2.12 上抛项 2（容差 ③ 落 `docs/core/design/SESSION.md` 容差表）= **撤回、不落** —— 容差 ③ 已消，无表可补。
- §2.12 上抛项 1（`rows` 字段表滞后）已由父侧同轮补齐，不重开。

### 2.14 修订轮 3（父侧裁决：空正文行删分支 + 五处文档漂移）

**裁定来源** = 父侧本轮派单：① 空正文行「两端都丢行」，设计档「有 `sub` 即保行」整句删除不标记；② 五处文档漂移逐处落。写域 = 五档 + 本档 §2；代码面零触（实施轮）。

#### ① 空正文行 = 两端同判丢弃（分支删除）

**判据**：跳过谓词 = `text` 为空，与 `sub` 在场无关。

**依据**：该态在活流不可达（核 `thincoder-render-core/flow/block.mjs` `appendAdvisorChunk` 的 `if (!str) return`）。

给不可达之态设分支，今天已造出后果：同一份记录 CLI 恢复 1 行、VSC 恢复 0 行。两端只留同一谓词 ⇒ 行数同判。

**落点**（三处，改后逐字见下）：`docs/vsc/design/WEBVIEW.md` §5.7 空正文行条 ∥ 同档 §6 D-W46 尾 ∥ `docs/cli/design/TUI-SESSION-VIEW.md` §6 空正文行条。

WEBVIEW §5.7 条：

```text
**空正文行 = 两端同判丢弃**：跳过判据 = `text` 为空，与 `sub` 在场与否无关——`text` 只装行正文，行文全空的行在任何一端都不产行。该态在活流不可达（核 `thincoder-render-core/flow/block.mjs` `appendAdvisorChunk` 的 `if (!str) return` ⇒ 行元素必有非空正文）⇒ 两端同一谓词即足；派生面（`rowsOf`）与回放面（核件早返）两处同判，CLI 读面同谓词（承接 = `docs/cli/design/TUI-SESSION-VIEW.md` §6）。
```

WEBVIEW §6 D-W46 尾：

```text
**`text` 空的行两端同判丢弃**（与 `sub` 在场无关）——该态活流不可达，两端同一谓词 ⇒ 行数同判
```

TUI §6 条：

```text
**空正文行 = 两端同判丢弃**：条目 `text` 为空 ⇒ 不产行，与 `sub` 在场与否无关（与 VSC 派生面 `rowsOf` 同一谓词）——该态在活流不可达（核 `thincoder-render-core/flow/block.mjs` `appendAdvisorChunk` 空串早返），同一份记录两端行数同判。
```

**用例表**：T-A50（VSC）∥ T-S4（CLI）两条删除。它们证的是「不可达之态保留行」，即给不存在的输入设判据；两处谓语句已写明同判丢弃，判据无洞。用例记数 9 → 7（T-A46–T-A49 ∥ T-S1–T-S3）。

**§2.11 判据表随之修订**：第 5 条（T-A50）∥ 第 9 条（T-S4）作废；第 1–4、6–8 条判据文字与期望值不变（单源 = 两档用例表）。机检命令不变 = `node --test docs/batches/2026-11-01-vsc-archive-sublabel.test.mjs`。

**代码面待改（实施轮，本席零触）**：

```text
thincoder-vscode/webview/record-rows.js  rowsOf：`if (text === "" && sub === null) continue` → `if (text === "") continue`
thincoder-cli/src/tui/lifecycle-records.mjs  synthSubTask：行集映射增跳过——`text` 为空 ⇒ 该条目不入 `blocks`（现行 :150 会把空正文合成 `<sub> · ` 一行）
```

#### ② 五处文档漂移（逐处）

**漂移 1 · 模块数 + 缺行** —— `docs/vsc/design/WEBVIEW.md` §3：

- `**49 档模块**` → `**52 档模块**`。当刻重数 = `thincoder-vscode/webview/` 下 `.js` 51 档 + `.mjs` 1 档；CSS 5 档 + `index.html` 另列（口径同原行）。
- 表内插一行（`activity.js` 行后），逐字：

```text
| `record-rows.js` | 归档快照**行派生叶件**（`rowsOf` ∥ `rowLines` ∥ `boundRows` ∥ `RECORD_ROWS_MAX_LINES`——行形 `{kind, text, sub?}`；零依赖、零浏览器全局，只吃元素对象）——原 `activity.js` 同一份实现迁出，消费面 = `subagentSnapshotOf`；行形 ∥ 容读 ∥ 空行判据单源 = §5.7 |
```

**漂移 2 · 模块图缺行** —— `thincoder-vscode/AGENTS.md` 模块图：`activity.js` 行尾补半句 + 新增一行。逐字：

```text
（activity.js 行尾补）…（noteChunk 经此 re-export；快照 `rows` 的行派生已迁 `webview/record-rows.js`）

（新增行）
webview/record-rows.js   归档快照行派生叶件（rowsOf / rowLines / boundRows——行形 {kind, text, sub?}；零依赖、零浏览器全局，只吃元素对象）——消费面 = activity.js subagentSnapshotOf；行形单源 = ../docs/vsc/design/WEBVIEW.md §5.7
```

委派面接回：该档把模块图登记委派给 `docs/vsc/design/WEBVIEW.md` §3，缺行即委派面断链，今补。

**漂移 3 · 行号坐标 → 符号名（两份设计档两节内全量清理）**

| 改前 | 改后 |
|---|---|
| `lifecycle-records.mjs:143` | `thincoder-cli/src/tui/lifecycle-records.mjs` `synthSubTask`（`docs/vsc/design/WEBVIEW.md` §5.7 ∥ `docs/cli/design/TUI-SESSION-VIEW.md` §6 两处） |
| `suspension.mjs:197/:225`；`panel-callbacks.mjs:88` 发射行——定义 `:87` | `suspension.mjs` 的 `pushRecord` 调用点（起跑 ∥ 收尾各一处，锚 = 与 `postMessage` 同行）；`panel-callbacks.mjs` `postDigestCap` |
| `flow/block.mjs:62` 工具行 ∥ `:78` 文本/思考行 | `flow/block.mjs` `appendAdvisorChunk` 的工具行支 ∥ 文本/思考行支 |
| `flow/block.mjs:61` | `flow/block.mjs` 的 `appendAdvisorChunk` 工具行支 |
| `subblocks/block.mjs:48` `if (!str) return` | `flow/block.mjs` `appendAdvisorChunk` 的 `if (!str) return` |
| `subblocks/block.mjs:52-54` `renderSubagentChunk` | `subblocks/block.mjs` `renderSubagentChunk` |
| `record-restore.js:92` 直取同件 | `webview/record-restore.js` 的 `renderSubagentChunk` 逐条回放 |
| `subagent-reduce.mjs:46` ∥ `:69-75` ∥ `:166-169` | `subagent-reduce.mjs` 的 `SUBCHUNK_KEYS` ∥ `subchunkOf` ∥ 快照 `rows` |
| `activity.js:142`（原实现） | `activity.js` 的 `rowsOf` |
| `panel-session.mjs:152/:179` | `panel-session.mjs` 两处 `historyWindow(…, { records: true })` |
| `panel-callbacks.mjs:87` 定义 · `panel-turn-loop.mjs:252` | `postDigestCap` 定义 · 单调用点 `panel-turn-loop.mjs` |
| TUI §6：`digestTurn` `:101` ∥ `:116` | `digestTurn` 起跑 ∥ 收尾（零行号） |
| TUI §6：`agent-turn.mjs:233-235`（`:235` 行同点） | `thincoder-cli/src/tui/agent-turn.mjs`（`cap-stop` 分支——行同点） |
| TUI §6：`render-segments.mjs:124` ∥ 同档 `:115` `renderBlockTimeline` | `render-segments.mjs` `foldTailLines` ∥ 同档 `renderBlockTimeline` |

**一处指错档（不只是行号漂移）**：`if (!str) return` 原写作 `subblocks/block.mjs:48`，实读在 `flow/block.mjs` 第 48 行——`subblocks/block.mjs:48` 是注释行。已按实读改写。

**漂移 4 · `test/RTM.md` 行 1-2**：单元格 7 → 8（补一格 `—`；列序 = 结果 ∥ 执行日期 ∥ 执行人 ∥ 异常 ∥ 证据，与行 1-1 同形）。

故事 1 节注「三态（行序）」→「两态（行序）= 1-1 正常 · 1-2 边界」——只列两行，读数与表一致。

**漂移 5 · T-A50 括号**：随 ① 该用例整行删除。判据从「身份随之消失」改为「两端同判丢弃」，落点 = §5.7 谓语句 ∥ D-W46。

修前实际读数 = `text` 为 `'explore#1 · '`（非空、该行不丢），故原括号的「`text === ""` 整条丢」既非修前读数也不是现行判据。

#### ③ 本轮未改（明示边界）

- `docs/core/design/SESSION.md`：零改。§6.26 行形（`Array<{kind, text, sub?: string}>`）∥ 承载句 ∥ 容差表与本轮裁决无冲突；空正文谓词是端侧派生 ∥ 读面规则，机制档不承接。
- 代码（`record-rows.js` ∥ `lifecycle-records.mjs`）∥ 单元用例件：零触（实施轮）。

### 2.15 修订轮 4（父侧两条上抛裁决落地 · 只落文字，代码零触）

**裁决来源** = 父侧本轮派单：实施席 §5.7 ⑥ 上抛两条（CLI 写面未随裁决同判 ∥ 两端跳过谓词零机检覆盖、两端各持一份副本）。父侧裁：① **代码不动，设计写明这是刻意**；② **不补用例，改落纪律 + 收口回读**。写域 = 两档设计 + 本档 §2。

#### ① 落点与逐字（单源 —— 一句一处，不两处都写）

| # | 落点 | 单源理由 |
|---|---|---|
| 1 写面不设该跳过 | `docs/cli/design/TUI-SESSION-VIEW.md` §6「行首子标（跨端恢复）」条下，紧随「空正文行 = 两端同判丢弃」 | 该句只关 **CLI 写面**——VSC 写面结构上产不出该行（行由 DOM 派生 ∧ 核件空串早返）⇒ 写在 VSC 侧就是给不存在的路径写规则 |
| 2 两端跳过谓词逐字同形 | `docs/vsc/design/WEBVIEW.md` §5.7，紧随「跨端不设容差」条 | 这是**跨端不变式**；且同档 §3 的 `record-rows.js` 行已把「行形 ∥ 容读 ∥ **空行判据**单源 = §5.7」定死 ⇒ 该判据的跨端约束住同一处，不新开第二源 |

**落文逐字（#1 · `docs/cli/design/TUI-SESSION-VIEW.md` §6）**：

```text
- **写面不设该跳过**：CLI 写面 `rowsOf`（`thincoder-cli/src/tui/lifecycle-records.mjs`——`typeof b.text !== "string"` 之外不再过滤）不跳过空正文行——该态活流不可达，读面两端同判已足；加写面分支 = 给不可达输入修桥。写面写出一条两端都不显示的行不产生端差（两端都不显示），只留一条没人走的路径。
```

**落文逐字（#2 · `docs/vsc/design/WEBVIEW.md` §5.7）**：

```text
**两端跳过谓词必须逐字同形**（`text === ""`，不读 `sub`）：派生面 = `thincoder-vscode/webview/record-rows.js` 的 `rowsOf`，读面 = `synthSubTask`（`thincoder-cli/src/tui/lifecycle-records.mjs`）；改任一处必须同轮改另一处，交付评审逐字比对。
```

**#2 单处落盘的触达缺口（在案，一句）**：改单边的人未必读到另一档 ⇒ 抵偿 = 该句自带「交付评审逐字比对」——门在评审面，不在改者手里；与裁决理由（「一份副本漂了，测试不跑就不知道」）同向。**不加第三处副本**：三处副本就是本轮刚删的那类东西。

#### ② 实读证据（两句所断的事实，逐条在盘）

| 断言 | 坐标 · 逐字 |
|---|---|
| 派生面谓词 | `thincoder-vscode/webview/record-rows.js` `rowsOf` ⇒ `if (text === "") continue` |
| 读面谓词 | `thincoder-cli/src/tui/lifecycle-records.mjs` `synthSubTask` ⇒ `if (text === "") continue` |
| 写面不判空（刻意） | 同档 `rowsOf` ⇒ `if (!b || typeof b.text !== "string") continue` |
| 该态活流不可达 | 核 `thincoder-render-core/flow/block.mjs` `appendAdvisorChunk` 空串早返 |

**同形读数**：派生面 ∥ 读面两处跳过行逐字相同、且都不读 `sub`——与该句所立的纪律一致（纪律写的是**应然**，两处当前已满足）。

#### ③ 机检与边界

- **文档门**：`doc_check(mode:"gate", target=仓根, docs=[`docs/vsc/design/WEBVIEW.md` ∥ `docs/cli/design/TUI-SESSION-VIEW.md`])` ⇒ 首行 `DOC-CHECK GATE: PASS`（0 段超长；2 档全清）。
- **代码零触**：`thincoder-cli/src/tui/lifecycle-records.mjs` ∥ `thincoder-vscode/webview/record-rows.js` 本轮未改（裁决 = 代码不动）。
- **用例件零触**：不加用例、不删用例（裁决 = 不可达之态不设用例）。
- **§2.14 已落内容零改**：本段只追加，前段落文原样。

#### ④ 上抛项

无新增。§5.7 ⑥ 两条均已有父侧裁决并落文，本席不重开。

## §3 设计评审（评审子代理）
**状态行**：评审通过（轮次 2 · 🔴 0 · 🟡 3 · 🔵 4（3 🟡 + 4 🔵 均为文档卫生/归属类在案项，不阻断）· 落盘 2026-11-01）



### 轮次 1（评审子代理）

审查对象 = 批档 §2（`docs/batches/2026-11-01-vsc-archive-sublabel.md`）+ `docs/vsc/design/WEBVIEW.md`（§5.7 行形条 / §6 D-W46 / §8 U-W25 / §10 行 17）+ `docs/core/design/SESSION.md` §6.26。计数：🔴 1 · 🟡 6 · 🔵 4。

| # | 类别 | 级 | 问题 | 建议 |
|---|---|---|---|---|
| 1 | 完成度 · 集成用例 | 🔴 | 缺集成用例设计段（RTM 增量）。四条验收全是单元件形（批档 `docs/batches/2026-11-01-vsc-archive-sublabel.md:93` 的 `node --test docs/batches/…test.mjs`），集成半场只有 `docs/vsc/design/WEBVIEW.md:680`「真机 = 面板重开 ∥ reload（父侧走查）」；两份设计文档零处读 `test/RTM.md`（探针：`test/RTM.md` 在盘）。本变更改变用户可见结果（`docs/vsc/design/WEBVIEW.md:800` U-W25 已定 UI 行为）⇒ 不在唯一免责形内 | 在批档 §2 增「集成用例增量」段，读 `test/RTM.md` 逐节列：打破的行 / 冗余的行 / 缺的行；缺行先在 RTM 定号再写用例标题；判无增量则逐字写唯一免责理由（不改既有用例断言的可观察业务结果 ∧ 不新增产品真需要的场景）。集成半场报在收口行，不在本席跑 |
| 2 | 需求覆盖 · 容读方向 | 🟡 | 容读只证一个方向。`docs/vsc/design/WEBVIEW.md:668` 只证「旧条目 ⇒ 无 `sub` ⇒ `text` 原样」；本变更把子标字面移出 `text`，反向（新条目被只读 `text` 的一端读）未论——`docs/core/design/SESSION.md:1041` 明写跨端退化「（零丢失；在册行为，不钉最小词表）」，`docs/core/design/SESSION.md:1077` 明写 CLI「`subagent` 记录 ⇒ `_frozenSubTask` 合成件（渲染端零改）」，`docs/core/design/SESSION.md:1050` 读面归一「其余字段原样携带」；批档 `docs/batches/2026-11-01-vsc-archive-sublabel.md:85` 仅以「零改（实读确认）」把 CLI 归零改，未给读面坐标。CLI 渲染面未实证（unverified） | 给一行读面证据（CLI 的 `rows` 消费是否只读 `text`），或把该方向登记为容差（`docs/core/design/SESSION.md` §6.26 容差表新增一条），使「零丢失」句与新区块形相容 |
| 3 | 文档归属 · 上抛项 Ⅰ | 🟡 | `docs/core/design/SESSION.md:1041` 的已知字段清单滞后。父侧「下界」判成立（依据 `docs/core/design/SESSION.md:1040`「未知字段原样携带」+ `:1045`「**零版本机**：增补可选字段 ∥ 三端读面皆字段式容缺省」），故不构成机制级双述 🔴；但本批把行形写成 `docs/vsc/design/WEBVIEW.md:654`「`{kind, text, sub?}` 形」与 `docs/vsc/design/WEBVIEW.md:658`「`rows` 条目 = `{ kind, text, sub? }`」，而来源档仍只列 `Array<{ kind: string, text: string }>` ⇒ 同一形两处描述、一处少一字段 | 同批补那一行（同一机制、同一 ② 条目、零版本机已覆盖 ⇒ 无迁移面）；若核档不在写域，须在本批台账登记一行——现 §2.7 只有「[上抛·待裁]」（`docs/batches/2026-11-01-vsc-archive-sublabel.md:106`），无台账行 ⇒ 悬空 |
| 4 | 可行性 · 验收可跑性（③） | 🟡 | 桩形与文档既有形冲突且导入面未定。`docs/vsc/design/WEBVIEW.md:682`「`document` 由用例自备最小桩，零 happy-dom 依赖」vs 同档 `docs/vsc/design/WEBVIEW.md:518`「机检驱动 = happy-dom 真 webview 模块」/`:263`「单元测试档（happy-dom：…）」= 同一档两套 DOM 底座；弃用理由为工作树态（批档 `docs/batches/2026-11-01-vsc-archive-sublabel.md:98`「**本工作树未装 happy-dom**（`thincoder-vscode/package.json:156` 仅 devDep 声明）」），而 devDep 已在声明中。另：用例件须 import `activity.js` 取 `rowsOf`，其模块图（state.js ∥ vscode 桥）在 Node 的副作用面与桩面（`acquireVsCodeApi` ∥ `document` 先于 import）未列 | 二者择一并落档：(a) 走已声明 devDep 的既有 happy-dom 径；(b) 留自备桩则逐条列桩面（createElement ∥ appendChild ∥ classList ∥ dataset ∥ textContent ∥ children ∥ querySelector）+ 声明 import 顺序，并以「修前红」那次真跑为凭（AGENTS.md「Every change must be verified by running it」） |
| 5 | 清晰度 · 新边界 | 🟡 | 剥子标与空文本过滤的交互未定。批档 `docs/batches/2026-11-01-vsc-archive-sublabel.md:27` 的 `if (text === "") continue` + 同档 `:72`「**行首 `span.advisor-sub` 不计入 `text`**」⇒ 正文为空、只剩子标的行在剥离后 `text` 变空而被整条丢弃（含其 `sub`），修前该行因字面在 `text` 内而是非空、被保留。四条用例无一覆盖此态 | 定一条（按剥离后判空 ∥ 有 `sub` 即保行）并加一条边界用例；若有意丢弃，写明理由并登记 |
| 6 | 勘察源（评价项 10） | 🟡 | 新增 §5.7 行形条无自己的勘察源行。本档唯一勘察源块住 §5.2（`docs/vsc/design/WEBVIEW.md:339`「工作树内无独立文档仓（`docs/` 即本仓权威面）」——属 F-W23 那条规则）；新增段（`docs/vsc/design/WEBVIEW.md:658`-`:671`）只有对齐依据（桌面实读），未写查过哪些公开源档、有无相关 | 该条补一行勘察源；「无独立档仓 ⇒ 不适用」这类结论也须写出来 |
| 7 | 方法论 · 用例载体 | 🟡 | 用例件落点偏离文档声明。`docs/vsc/design/WEBVIEW.md:383`「载体 = VSC 测试树，清单单源 `test/files.mjs`」、`docs/vsc/design/WEBVIEW.md:827`「本板块用例表归测试层」；本批落 `docs/batches/2026-11-01-vsc-archive-sublabel.test.mjs`（批档 `:84` ∥ `:98`），而 `docs/batches/` 现无任何 `*.test.mjs`（按名检 0 命中）⇒ 新开先例且未声明偏离理由 | 说明是否须在 `test/files.mjs` 登记；若有意留在批档（收口即删），写明理由或列进既有「单元用例件收口即删」口径的例外 |
| 8 | 清晰度 | 🔵 | T-A47 断言面混淆：用例喂「工具行与文本行各一条」，期望只给一行的全文（`docs/vsc/design/WEBVIEW.md:687`「行全文 = `explore#1 · read — src/x.mjs`」），另一行的全文断言缺 | 两行各给一条全文期望 |
| 9 | 复核答复（① 承载形） | 🔵 | 否「改由块头携带」的理由站得住：块头 = 父身份（`docs/vsc/design/WEBVIEW.md:768` D-W44，用户 2026-09-07 裁定）；一块内可含多 `sub`（`docs/vsc/design/WEBVIEW.md:632`「不并「不同 `sub`」的行」∥ `docs/vsc/design/WEBVIEW.md:618` 合并判据含 `dataset.sub` 相等 ∥ T-A38 深链 `advisor#1/explore#2`）⇒ 逐行身份无处安放；字面留在 `text` 会双份（`docs/vsc/design/WEBVIEW.md:660`「行首 `span.advisor-sub` 不入 `text`」；批档 `:72`）。选形对齐桌面现行形（`docs/vsc/design/WEBVIEW.md:662` 的 `SUBCHUNK_KEYS` 含 `sub`）——属「按既有形对齐」直中 | 无需改 |
| 10 | 复核答复（Ⅱ 拆批） | 🔵 | 四处落点 = 本档每机制的标准登记集（机制条 + §6 决策行 + §8 UI 行 + §10 回指行），先例同形（D-W44/U-W22 `docs/vsc/design/WEBVIEW.md:768`/`:797`；D-W45/U-W24 `:769`/`:799`）；实增量 ≈ §5.7 十四行 + 4 用例行 + 3 行表行 ⇒ 一批装得下 | 不拆（拆则同一机制散到两记录，反 D2） |
| 11 | 限制声明 | 🔵 | 评审上下文声明「无 document map」，而 `docs/README.md` 在盘（AGENTS.md 逐档地图指向它）；本次归属判据改以文档自述单源句为凭（`docs/vsc/design/WEBVIEW.md:646` ∥ `docs/core/design/SESSION.md:1035`），未读 README。层级结论（批档 `:87`「无档跨层」）的抽查：`activity.js` 263 行取自文档内读（`docs/vsc/design/WEBVIEW.md:489`），本席未另测（评审范围限制）；据此 + 本批增量 ≪ 500，结论不改 | 无（如实登记限制） |

VERDICT: changes-required

计数：🔴 1 · 🟡 6 · 🔵 4（🔴 项 = 集成用例增量段缺席）。

### 轮次 2（评审子代理）

**审查对象** = `docs/batches/2026-11-01-vsc-archive-sublabel.md` §2.5–§2.13 + `docs/vsc/design/WEBVIEW.md` §5.7 + `docs/cli/design/TUI-SESSION-VIEW.md` §6 + `docs/core/design/SESSION.md` §6.26。本条只判上轮 11 条，不另找新问题。

**上轮 11 条逐条核：8 条（1 🔴 + 7 🟡/🔵）全部已修，3 🟡 + 4 🔵 为本轮在案项（不阻断）。**

## 一、8 条修正状态（核据 = 本轮实读）

**#1 🔴 已修。** `docs/batches/2026-11-01-vsc-archive-sublabel.md` §2.9 按「打破 / 冗余 / 缺」三问作答，缺行定号先行。

`test/RTM.md` 故事 1 行 1-1 ∥ 1-2 已在表：怎么做 ∥ 怎么算通过 ∥ 交互组件 ∥ 进入口 ∥ 回指齐；集成半场报收口，不入本批判据。

**#2 🟡 已修。** CLI 读面纳入本批：承载形 ∥ 合成点 ∥ 三端三条 ∥ 空正文 ∥ 写面不变 ∥ 存量容读。

`docs/vsc/design/WEBVIEW.md` §5.7 反向条改写为 CLI 读面同形，「跨端不设容差」在场；`docs/cli/design/TUI-SESSION-VIEW.md` §6 落承接细则 + T-S1–T-S4。

可行性两面实读可核：读面合成点 `synthSubTask` 只吃 `kind` / `text`；渲染两端直消费 `sub.blocks` ⇒ 渲染面零改成立。

**#3 🟡 已修。** `docs/core/design/SESSION.md` §6.26 行形现为 `Array<{ kind: string, text: string, sub?: string }>`，与本批行形一致。

**#4 🟡 已修。** `docs/vsc/design/WEBVIEW.md` §5.7 用例首段改判「路径可达性」+ 一律相对路径导入；happy-dom 实测在盘 20.11.2，该档已无「未装」句。

**#5 🟡 已修。** 同档空正文判据重导（`text` 为空 ∧ `sub` 缺席才跳过）+ T-A50 边界用例（修前红）。

**#6 🟡 已修。** 同档「勘察源」条含「工作树内无独立文档仓 ⇒ 不适用」结论。

**#7 🟡 已修。** `thincoder-vscode/test/files.mjs` 头两行（`：5` 批次本地 ∥ `：6` 登记）逐字对上，且 `test/RTM.md` 行 7-4 的机检判据在表 ⇒ 批次本地是被检查的位置，不是新先例。

**#8 🔵 已修。** `docs/vsc/design/WEBVIEW.md` §5.7 T-A47 两行各给全文本期望。

## 二、本轮在案项（🟡 3 · 🔵 4；均不阻断）

**🟡 1 撤回的容差 ③ 三处活跃句未加接替标记（文档卫生 · 撤回残留）。**

批档 §2.8 #2 尾「处置 = 设计 §5.7 登记容差 ③」；§2.9 行 1-2「按容差 ③ 判（不判红）」；§2.12 上抛项 1「容差表需补一条」。

而 §2.13 已落「`docs/core/design/SESSION.md` 容差表不动（容差 ③ 已不存在）」并撤回该项。

append-only ⇒ 原文不能删；照 §2.12 上抛项 1 去补行会与 §2.13 相撞。

建议：§2.13 后落一行接替声明，点名该三句自此不驱动任何登记（或就地补「已由 §2.13 接替」标记）。

**🟡 2 环境事实残留（文档卫生 · 事实）。**

批档 §2.5 仍写「本工作树未装 happy-dom …故不走 happy-dom 径」，而 §2.8 #4 称该句「删除」——append-only 下删不掉。

故该假事实仍在验收节活跃（盘上 = 20.11.2 在装）。

建议：补一行点名该句作废（由 §2.8 #4 接替），把「删除」表述改为「接替」。

**🟡 3 跨端单源承载句变窄（文档归属）。**

`docs/core/design/SESSION.md` §6.26 仍写「呈现形 = 行首一个 dim `span` + ` · ` 分隔」；本批新增第三承载 = CLI 行首文本前缀。

第三承载见 `docs/cli/design/TUI-SESSION-VIEW.md` §6「行首子标（跨端恢复）」条；两端口档声明三端同串见 `docs/vsc/design/WEBVIEW.md` §5.7「跨端不设容差」条。

承接细则已由 `docs/core/design/SESSION.md` §6.26 头委派两端口档 ⇒ 不构成机制双述，只是单源句不再覆盖三端承载。

建议：该条尾补承载分列一句（DOM span ∥ CLI 文本前缀），或注明承接细则见两端口档；不新增容差行、不改字段形。

**🔵 4 上抛项序号互换（交叉引用）。**

§2.13 ⑤ 称「原 §2.12 上抛项 2（容差 ③ 落容差表）」，而容差表条实为 §2.12 第 1 条；第 2 条是「（已结）`rows` 字段表滞后」。

建议：补一行收正序号（实质不歧义——两括号各自点名主语）。

**🔵 5 覆盖条目未随扩面（需求覆盖）。**

批档 §2.1 覆盖条目只写 VSC 面（回指 F-W1 ∥ I-7 ∥ core §4.4 F-S7），未覆盖 §2.13 新增的 CLI 读面。

CLI 需求面 = `docs/cli/design/TUI-SESSION-VIEW.md` §6 头所引 F18。建议：一行补记由 §2.13 接替，或补 CLI 回指。

**🔵 6 取舍理由含被削弱的预测（证据强度）。**

§2.7 补记的理由是「列进去，收口后必留一条指向已删档的清单项」；而 `thincoder-vscode/test/files.mjs` 清单现列 5 个按批日期命名的单元档、5 档全在盘 ⇒ 观测到的是「登记且留存」。

结论（不入清单）仍由 `test/RTM.md` 行 7-4 机检支撑。建议：登记该事实，不改结论。

**🔵 7 节注读数漂移（编号读数）。**

`test/RTM.md` 故事 1 节注写「三态（行序）= 1-1 正常 · 1-2 边界」，只列两行（同档故事 8 ∥ 20 同形）。建议：改称「两态」或说明第 3 行缺席理由。

## 三、额外请核（设计席报 grep 0 命中）

`docs/vsc/design/WEBVIEW.md` §5.7 容差条只剩 ① ∥ ②，「跨端不设容差」在场 ⇒ 撤回无残留。

`docs/core/design/SESSION.md` §6.26 容差表三条与他批同形（③ = CLI 复活径双记录，与本批无关）⇒ 撤回无残留。

## 四、评审限制（如实登记）

本轮读面 = 上述四档 + `test/RTM.md` + `thincoder-vscode/test/files.mjs`；`thincoder-core/prompts/` 与 `.thincoder/tmp/lencheck.mjs` 只作写门前置核读。

渲染核件 ∥ 桌面 `subagent-reduce.mjs` ∥ CLI 组件面未逐档重读，设计席所引坐标按 unverified 记。

VERDICT: pass

计数：🔴 0 · 🟡 3 · 🔵 4。

## §4 用户批准（主 agent）

## 4. 用户批准（主 agent）

**批准依据 = 用户 2026-11-01 20:47 整批令（逐字）**：

> 「**那你把这三批都处理了吧**」

**覆盖面**：本批（`#1733` VSC 归档子标）∥ `#1867`（行号引用存量）∥ `#1722`（设计前取数）。**整批令覆盖批准门** —— 批内设计 → 评审 → 批准 → 实施全链自动跑完。

**评审链**：轮 1 = changes-required（🔴1 · 🟡6 · 🔵4）→ 修正轮 → 轮 2 = **pass**（🔴0 · 🟡3 · 🔵4；三条 🟡 判非阻断）→ token 签发 → 实施 → 审计 `clean`。

**批准对象 = 评审通过后的设计 + 其修正**，不含实施中新增的语义（本批实施零语义扩张：只落设计已写的两处谓词 + 用例删两条）。

**用户对本文档内容无另行异议记录。**

## §5 实施记录（eng-coder）
**状态行**：实施完成 2026-11-01（内部审计与代码评审均 pass，终态 clean）



### 5.1 交付摘要（逐档，行数 = node 实读）

| 文件 | 处置 | 行数 |
|---|---|---|
| `thincoder-vscode/webview/record-rows.js` | **新** —— 行派生叶件：`rowsOf` ∥ `rowLines` ∥ `boundRows` ∥ `RECORD_ROWS_MAX_LINES`；零依赖、零浏览器全局（只吃元素对象） | 66 |
| `thincoder-vscode/webview/activity.js` | 改 —— 删本地派生四件，改 `import { boundRows, rowsOf } from "./record-rows.js"`；`subagentSnapshotOf` ∥ `emitRecordAppend` 留原址 | 264 → 227（+4 ∕ −41） |
| `thincoder-cli/src/tui/lifecycle-records.mjs` | 改 —— `synthSubTask` 行集映射合成行首前缀；写面（`subagentRecord`）与其余导出零改 | 216 → 225（+9 ∕ −1） |
| `docs/batches/2026-11-01-vsc-archive-sublabel.test.mjs` | **新** —— 本批单元用例件（9 条：T-A46–T-A50 ∥ T-S1–T-S4）；DOM 底座 = happy-dom，相对路径导入；收口即删 | 130 |

**VSC 行形落点**：`rowsOf` 读行元素 `dataset.sub`（写点 = 核 `flow/block.mjs:62` 工具行 ∥ `:78` 文本/思考行）⇒ 条目 `{kind, text, sub?}`。
`text` 取文本节点且**跳过行首 `span.advisor-sub`**；空行判据 = 「`text` 空 **∧** `sub` 缺席」。

**CLI 承载形**：条目带 `sub` ⇒ 行文 = 子标 + ` · ` + 正文（空正文 ⇒ `<sub> · `）；不带 ⇒ 原样。
合成点只在读面 `synthSubTask`；渲染面零改（`fold-block.mjs:76` ∥ `:160` 逐字吃 `b.text`）。

### 5.2 决策披露

| # | 决策 | 理由 | 代价 ∕ 风险 |
|---|---|---|---|
| 1 | 行派生迁出为叶件，而非「从 `activity.js` 导出」 | `activity.js` 顶层经 `state.js` 即读 `acquireVsCodeApi` 与十处 `getElementById` ⇒ 用例桩面不可封口，验收不可跑 | 多一档 webview 模块；档数与模块图两处需同步（见 5.4） |
| 2 | 用例 DOM 底座 = happy-dom（相对路径导入） | 与 VSC 测试树同一底座，不引入第二套桩 DOM；批档目录的裸说明符到不了 `thincoder-vscode/node_modules`（仓根无 happy-dom，实测） | 用例件多一条路径依赖 |
| 3 | 断言只走设计用例表 T-A46–T-A50 ∥ T-S1–T-S4，不外加 | 判据文字与期望值单源 = 用例表；外加断言 = 造判据 | 用例表未覆盖的态无断言（5.5 项 1 即这类态） |

### 5.3 验证读数（本批用例件 = 唯一改动面单测）

- **修前（红）**：`node --test docs/batches/2026-11-01-vsc-archive-sublabel.test.mjs` ⇒ tests 9 · **pass 4 · fail 5**。
- 红 = T-A46 ∥ T-A47 ∥ T-A50 ∥ T-S1 ∥ T-S4；绿 = T-A48 ∥ T-A49 ∥ T-S2 ∥ T-S3（负控与存量容读本就不该变）。
- **红因逐条实读**：T-A46 实际条目 `{kind:'tool', text:'explore#1 · read — src/x.mjs'}`（`sub` 缺席、字面在 `text`）。
- 同上：T-A47 回放零 `span.advisor-sub`；T-S1 实际 `'read — src/x.mjs'`（前缀缺席）；T-A50 实际 `{kind:'tool', text:'explore#1 · '}`。
- **修后（绿）**：同命令 ⇒ tests 9 · **pass 9 · fail 0**。
- **语法面**：`node --check` 三档全过（`webview/record-rows.js` ∥ `webview/activity.js` ∥ `cli/src/tui/lifecycle-records.mjs`）。
- **零改复核（实读）**：核 `subblocks/block.mjs:54` 已透传 `m?.sub`；`webview/record-restore.js:92` 整条 row 回放；桌面 `renderer/subagent-reduce.mjs:46` 白名单已含 `sub`；CLI 渲染面同上。
- **未跑**：全量套件与集成半场（父侧收口门；`test/RTM.md` 行 1-1 ∥ 1-2）。

### 5.4 文档漂移（只报不改 —— 均不在本席写域）

| 落点 | 现状 | 建议 |
|---|---|---|
| `docs/vsc/design/WEBVIEW.md` 第 3 节 | 声明「49 档模块」且表内无 `record-rows.js` 行；实读改后 51 个 `.js` + 1 个 `.mjs` = 52 档（本批 +1，另 2 档为存量差） | 补 `record-rows.js` 行（行派生叶件）并改档数 |
| `thincoder-vscode/AGENTS.md` 模块图 | 无 `webview/record-rows.js` 行；`activity.js` 条目未提派生已迁叶件 | 补一行 + 条目增半句（该档把模块图登记委派给 `docs/vsc/design/WEBVIEW.md` ⇒ 缺行即委派面断链） |
| `docs/cli/design/TUI-SESSION-VIEW.md` 第 6 节 ∥ `docs/vsc/design/WEBVIEW.md` 第 5.7 节 | 合成点坐标仍写 `lifecycle-records.mjs:143`；`:143` 现为新增注释行，合成在 `:146`–`:151` | 收口随正坐标，或改成不带行号的函数名 |
| `test/RTM.md` 行 1-2 | 单元格 7 格 vs 表头 8 列 ⇒「执行人 ∥ 异常 ∥ 证据」右移错位；节注写「三态」只列两行（评审轮次 2 🔵 7 同项） | 补一格 `—`；「三态」改「两态」 |
| `docs/vsc/design/WEBVIEW.md` 第 5.7 节 T-A50 括号 | 写「修前红：`text === ""` 整条丢」；实读修前该行**不丢**（`text` = `'explore#1 · '`，非空），红在字段期望 | 括号改为「修前红：`sub` 缺席、字面在 `text` 内」——用例仍红，判据不变 |

### 5.5 上抛项

1. **[上抛·知会] 空正文行的两端处置不同 —— 本席按设计原样落地，零行为改动，请父侧裁。**
   - CLI 读面把「`sub` 在场 ∧ `text` 空」合成为 `<sub> · `（`lifecycle-records.mjs:150`）。
   - VSC ∥ 桌面回放走核 `appendAdvisorChunk` 的 `if (!str) return`（`thincoder-render-core/subblocks/block.mjs:48`）⇒ 同一份这样的记录，CLI 恢复出 1 行、VSC 恢复出 0 行。
   - 设计同节已声明该态在 VSC 活流不可达（核拒空串），但桌面写面只要求 `text` 是字符串（`thincoder-desktop/renderer/subagent-reduce.mjs:73`）⇒ 桌面产记录理论上可携此行，那时两端不可比。
   - 处置候选：① 设计档措辞收窄（「与 T-A50 同判」限定在派生面）；② 核件放行「`sub` 在场」的空正文行（另批）。本批不自行改判据。
2. **[上抛·知会] 用例件待删**：`docs/batches/2026-11-01-vsc-archive-sublabel.test.mjs` 按收口纪律删除，5.3 的读数行留档即可。

### 5.6 轮次与终态

- **分歧审计（只读 explore）**：对照 §2.10 ∥ §2.11 ∥ §2.13 逐项核 ⇒ 产品码与设计逐条一致；🔴 0 · 静默简化 0 · 清单外改动 0；提出 3 条文档漂移（已并入 5.4 前三行）。
- **代码评审（advisor · type=code）**：🔴 0 · 🟡 3 · 🔵 1，VERDICT pass。
- 处置：🟡 §5 空缺 = 本次写入落定；🟡 空正文行两端差 → 5.5 项 1；🟡 坐标漂移 → 5.4 第三行；🔵 `test/RTM.md` 行 1-2 单元格 → 5.4 第四行。
- **修正轮次**：实施内红绿对 1 轮（修前 5 红 → 修后 9 绿）；评审后无代码修正。
- **终态**：`clean` —— 无待修代码项，余项全部落在文档面（5.4）与待裁项（5.5）。

### 5.7 修正轮（§2.14 落地 · 2026-11-01）

**裁决** = 批档 §2.14 ①：空正文行两端同判丢弃——跳过谓词 = `text` 为空，与 `sub` 在场与否无关。原谓词「`text` 空 **∧** `sub` 缺席」整条撤除（不设分支、不留标记）。

#### ① 三处改动（改在哪 → 改后逐字）

| # | 文件 : 行 | 改后逐字 | 改前 |
|---|---|---|---|
| 1 | `thincoder-vscode/webview/record-rows.js:32` | `if (text === "") continue` | `if (text === "" && sub === null) continue` |
| 2 | `thincoder-cli/src/tui/lifecycle-records.mjs:150` | `if (text === "") continue` | 无跳过——空正文行合成 `<sub> · ` 一行照出 |
| 3 | `docs/batches/2026-11-01-vsc-archive-sublabel.test.mjs` | T-A50 ∥ T-S4 两例整段删除；件头用例范围收窄为 T-A46–T-A49 ∥ T-S1–T-S3 | 9 例（含 T-A50 ∥ T-S4） |

**#2 的形态变化**：行集映射由 `rows.map((r) => …)` 改为 `for (const r of rows)` + `continue`。

理由 = 设计 §2.14 ① 要求两处「同一谓词」；`.map` 无 `continue`，写不出与 `rowsOf` 逐字同形的那一行。

**#1 内一处次序调整**：`if (text === "") continue` 提到 `sub` 解析之前（原在之后）。零行为差——`sub` 取自 `dataset`，无副作用；目的 = 让「跳行与 `sub` 无关」在代码顺序上也看得见（评审本段 🔵 3）。

#### ② 验证读数

- **用例件**：`node --test docs/batches/2026-11-01-vsc-archive-sublabel.test.mjs` ⇒ tests **7** · pass **7** · fail **0**。
- **语法面**：`node --check` 两档代码件全过（`webview/record-rows.js` ∥ `cli/src/tui/lifecycle-records.mjs`）。

**绿态不能证明本轮的改动面**：裁决同时删掉的两例正是唯一触到该谓词的用例 ⇒ 7 绿在改前也成立。故补一次直接读数（inline probe，不落档）：

| 输入 | 改前 | 改后 |
|---|---|---|
| 只带子标、正文为空的行元素（手造） | VSC 快照留条目 `{kind:'tool', text:'', sub:'explore#1'}`，回放被核件早返吞掉 ⇒ 显示 0 行 | 快照 0 条 ⇒ 显示 0 行 |
| 同态记录的 CLI 读面 | 合成 `explore#1 · ` 一行 ⇒ 显示 1 行（**端差**） | 0 行 |
| 空行 + 真行混排 | — | 只丢空行；真行两端照出（CLI = `explore#1 · read — src/x.mjs`） |

改后两端行数同判 = true（0 ∥ 0），且不误伤有正文的行。

**不可达论的复核（实读）**：`thincoder-render-core/flow/block.mjs:48` `if (!str) return` 在 `sub` 取值（`:49`）之前 ⇒ 活流不产空正文行元素；`subblocks/block.mjs:52-54` `renderSubagentChunk` 是薄包、无自己的过滤。

#### ③ 两处谓词是否逐字同形

**是。** 两处逐字皆 `if (text === "") continue`，且都不读 `sub`：VSC 的 `sub` 在跳过之后取（`:33`），CLI 的 `sub` 亦然（`:152`，合成在 `:153`）。

#### ④ 内部审计与代码评审

- **分歧审计（只读 explore）**：对照 §2.10 ∥ §2.11 ∥ §2.13 ∥ §2.14 逐条核 ⇒ 🔴 0 · 🟡 1 · 🔵 3，VERDICT `clean`。🟡/🔵 全部落在本档 §5 的历史句（本段 ⑤ 接替）。
- **代码评审（advisor · type=code）**：🔴 0 · 🟡 0 · 🔵 4，VERDICT `pass`。
- **处置**：🔵1 谓词零机检覆盖 + 两端各持一份副本 → ⑤ 遗留登记；🔵2 CLI 写面未同判 → ⑥ 上抛；🔵3 `sub` 解析次序 → 已改，复跑 7 绿；🔵4 件头指向缺失 → 已补一行（「该态刻意无用例」）。
- **修正轮次**：实施内 1 轮（三处一次落地，红绿对照见 ②）；评审后 1 轮（两条 🔵 收口，复跑 7 绿 + 读数复测）。
- **终态**：`clean` —— 无待修代码项；余项 = ⑤ 遗留登记 ∥ ⑥ 待裁项。

#### ⑤ 接替声明（前文陈旧句；append-only，原文不改）

- `:503`「空行判据 = `text` 空 **∧** `sub` 缺席」∥ `:505`「空正文 ⇒ `<sub> · `」∥ `:500` / `:514` / `:519` / `:521` 的「9 条 ∥ T-A50 ∥ T-S4」读数 = **由 §2.14 ① 与本段接替**——在盘代码与用例件不再如此。
- `:541` 的 `subblocks/block.mjs:48` 是错坐标（实读 `if (!str) return` 在 `thincoder-render-core/flow/block.mjs:48`；`subblocks/block.mjs:48` 是注释行）——本段接替。
- `:502` 的 `flow/block.mjs:62` ∥ `:78` 行号形 → 符号名（`appendAdvisorChunk` 的工具行支 ∥ 文本/思考行支），设计 §2.14 ② 漂移 3 已裁。
- **遗留登记（机检面）**：空正文谓词现由**散文**承载（`docs/vsc/design/WEBVIEW.md` §5.7 ∥ `docs/cli/design/TUI-SESSION-VIEW.md` §6），两端各持一份字面不等的…（同字面但两份副本）；一端日后单边改动不会有红灯——恰是本轮所修端差的复发路径。裁决已定「不可达之态不设用例」⇒ 不主张补例；封法候选（两端导入同一叶件 ∥ 一条「两处字面相等」静态断言）留待父侧。

#### ⑥ 上抛项

1. **[上抛·待裁] CLI 写面未随裁决同判**（评审 🔵2）：读面已丢空正文行，但写面 `lifecycle-records.mjs` 的 `rowsOf(sub)` 只判 `typeof b.text !== "string"` ⇒ `{kind:"text", text:""}` 仍可进记录 `rows`；VSC 写面已不可能产出该行。
   当前无用户可见后果（两端读面 + 核件回放皆丢），且 §2.14 代码面只列两处 ⇒ 本席零触。空正文块能否真到达 `sub.blocks` **未验证**（unverified）。
   候选：① 写面同加跳过（机械对称、零行为风险）；② 落一句「写面刻意不动」。不阻断本批交付。
2. **[上抛·知会] 用例件待删**：按收口纪律删除，② 的读数行留档。

## §6 验证与收口（父代理）

## 6. 验证与收口（主 agent）

### 6.1 交付面（父侧实跑，非转述）

```
node --test docs/batches/2026-11-01-vsc-archive-sublabel.test.mjs   → tests 7 · pass 7 · fail 0
node --test test/integration/vsc-record-sublabel.test.mjs           → tests 6 · pass 6 · fail 0
doc_check(mode:"gate", target=仓根, docs=6 档)                        → DOC-CHECK GATE: PASS
```

**单元用例件已按「收口即删」删除**（`docs/batches/2026-11-01-vsc-archive-sublabel.test.mjs`）；**读数留在本节**，可跑件不留在盘。

### 6.2 集成用例（RTM）

`test/RTM.md` 故事 1 行 **1-1 ∥ 1-2 = 通过（6/6）· 2026-11-01 · 父侧（收口轮）· 无异常**；证据件 = `test/integration/vsc-record-sublabel.test.mjs`（永久件，不删）。

**集成集现状**：本批新增 1 个故事 / 2 行 / 1 个用例件。

### 6.3 端差消（本批的核心交付）

| 面 | 改前 | 改后 |
|---|---|---|
| VSC 归档快照行 | `{kind, text}`，子标烙在 `text` 内 | `{kind, text, sub?}`，子标在 `sub`、`text` 只装正文 |
| VSC 回放 | 子标退化成普通正文 | 行首 dim `span.advisor-sub`（与 live 同行） |
| CLI 恢复 | 新形记录无子标前缀（**新造端差**） | 读面合成 `<sub> · `，与 VSC 同串同位置 |
| 空正文行 | CLI 1 行 ∥ VSC 0 行（**端差**） | 两端同判丢弃（同一谓词） |

**三端一致性判据** = 同一字面 ∥ 同一位置 ∥ 同一分隔符 ⇒ 观察结果 = 行全文同一串；差别只在承载（DOM span ∥ 纯文本前缀），不在内容。

### 6.4 收口链核对

- **§2 ↔ 设计档一致**：§2.14 / §2.15 与 `docs/vsc/design/WEBVIEW.md` §5.7 ∥ `docs/cli/design/TUI-SESSION-VIEW.md` §6 同口径（设计席两轮 §2 补记与设计同轮落）。
- **评审在案项**：轮 2 的 3 条 🟡（容差 ③ 残留句 ∥ happy-dom 假事实 ∥ 跨端单源变窄）**均已由后续修正轮实质消解**（容差 ③ 不登记、假事实换成路径可达性、单源句补承载分列）。
- **暂缓批复核**：无暂缓批。
- **台账**：`#1733` 在途 → 待核销 → 已核销（本行）。
- **token**：`consume-design` 已执行，槽位释放。

### 6.5 未做与已知（如实登记）

1. **真机走查未做**：VSC 面板重开 ∥ reload 的真机路径只有集成用例覆盖（happy-dom 真 DOM + 核件真模块），**没有在真 VSC 窗口里点过**。设计原写「真机 = 父侧走查」，**本轮未走**。
2. **桌面 dist 未重打包**：`thincoder-desktop/dist-r3/r4` 里的 `app.asar` 仍是旧串，须重打包才见新文案（与 `#1962` 同一遗留）。
3. **两端谓词零机检**：按裁决落为纪律（`docs/vsc/design/WEBVIEW.md` §5.7 一句），不落用例。
