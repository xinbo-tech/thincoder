# 2026-11-01 · turncap-cumulative-progress
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-11-01 · 来源 = 用户 2026-11-01 20:02 逐字「C15累计进度要啊」。
> 台账 = #1962（TURN-CAP-CONTINUE · 归批）。前情 = docs/batches/2026-11-01-dispatch-one-face-retire.md（#1961，进行中）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

## 1. 讨论与结论（主 agent）

**覆盖账 = #1962** · **前情 = `docs/batches/2026-11-01-dispatch-one-face-retire.md`（#1961，进行中）**

### 1.1 用户裁定（逐字）

> 20:02：「**C15累计进度要啊**」

### 1.2 它现在是 `open`（设计档原文）

`docs/core/design/TURN-CAP-CONTINUE.md:132`（D-TC10 末句）：

> **继续提示文案不动**（`Ran ${error.turn} turns (limit …)` 描述**本段**撞墙事件）—— 改文案 = 动锁定串 / 提示面 —— **`open`：是否补「累计进度」口径留待用户 / 后续批**

**用户现在把它关掉：要补。**

### 1.3 现状（父侧实扫三处提示面）

| 端 | 坐标 | 现文 |
|---|---|---|
| CLI | `thincoder-cli/src/tui/agent-turn.mjs:242` | `Ran ${error.turn} turns (limit ${error.turn}). Continue?` |
| VSC | `thincoder-vscode/src/extension/panel-turn-loop.mjs:262` | `Agent reached ${e.turn} turns (limit). Continue from here?` |
| 桌面 | `thincoder-desktop/src/main/turn-driver.mjs:103` | `Agent reached ${turn} turns (limit). Continue from here?` |

**三处都只报本段轮数；而系统里已经有累计值**（D-TC2「编号口径 = 跨段累计」· D-TC3「累计预算经回调第二参传」）—— **值在那儿，提示面没读。**

### 1.4 要落的口径（判据句）

**撞帽提示必须让用户看见「这一段跑了多少」与「从开始到现在一共跑了多少」。** 只报本段 ⇒ 用户判不出「这个任务已经转了 40 轮」还是「刚转了 12 轮」——**而继续 / 停的决断正好取决于这个量级。**

### 1.5 边界

- **三端同口径**（CLI ∥ VSC ∥ 桌面）—— 端差即缺陷。
- **不改撞帽判定 / 续跑结构 / 段预算**（D-TC1 / D-TC7 不动）：只加一个可读量。
- **锁定串动了就要连测试一起动**（D-TC10 明说这是它一直没做的原因）——**本批必须把断言一起改，不许留旧串。**

### 1.6 用户追加裁定（逐字）

> 20:04：「**一起改**」（回答父侧「`(limit ${error.turn})` 那个也是坏的，跟累计一起改？」）

### 1.7 第二件要落：撞帽提示里的上限印错了（父侧实读）

`thincoder-cli/src/tui/agent-turn.mjs:242` 逐字：

```js
pushLine(`Ran ${error.turn} turns (limit ${error.turn}). Continue?`, C.warn)
```

**`limit` 位置印的是 `error.turn` —— 同一个数说了两遍。**

**根因在载荷**：`thincoder-core/agent/helpers.mjs:239-245` 逐字 `class ContinueError extends Error { constructor(turn) { super(…); this.turn = turn } }` —— **`ContinueError` 不带上限字段。**

**另两端印的是没有数的断头句**（`(limit)`）：
- `thincoder-vscode/src/extension/panel-turn-loop.mjs:262`
- `thincoder-desktop/src/main/turn-driver.mjs:103`

### 1.8 父侧判法

1. **三端必须有真上限**（来自 `maxTurns`），或**统一删掉该括注**并在设计档写明为什么删；**不许留 `(limit)` 这种断头句。**
2. **`ContinueError` 带不带上限字段**归设计席判 —— 带则三端同源；不带则三端各自取，但**三端同口径**（端差即缺陷）。
3. **这两件同一批落**：它们改的是同一行、同一句、同一组锁定串；分两批做等于把同一处文案改两次、断言改两次。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成 2026-11-01（提示面双数同报 + 删 (limit …)，设计档 §6 新增 / D-TC10 重写）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

**状态行**：✅ 设计完成（2026-11-01）

## 2.1 本批条目（覆盖）

| # | 条目 | 判据来源 |
|---|---|---|
| 1 | 撞帽提示补**链内累计轮数**——本段轮数与累计轮数同报 | 用户 2026-11-01 20:02 逐字「C15累计进度要啊」；设计档 `docs/core/design/TURN-CAP-CONTINUE.md` §6.3 |
| 2 | 删掉 `(limit …)` 括注（本段上限 ≡ 本段轮数；VSC / 桌面现盘印无数字的 `(limit)`） | 用户 20:04「一起改」；同档 §6.2 |
| 3 | D-TC10 的 `open` 关闭（同档 §5） | 本批设计落点 |

**不在本批**：`ContinueError` 载荷增上限字段（否决，理由见同档 §6.2）；撞帽判定 / 续跑结构 / 段预算（D-TC1 · D-TC7 · 需求 N6）；检查点载荷与池条目留痕文案（已有累计口径，零改）。

## 2.2 设计档落点

- `docs/core/design/TURN-CAP-CONTINUE.md` **§6（新增）**：判据 · 两个数的单源 · 上限删除理由 · 三端逐字模板 · 落点 · 断言清单 · 用例 · 边界。
- 同档 **§5 D-TC10** 重写（`open` 删除，改判「双数同报 + 删括注」）。
- 同档 **§1 / §3.1 / §4**：提示面列为消费面；按实读改正失效坐标（`thincoder-core/agent/turn-loop.mjs:98` / `:307` / `:316`，`run-start.mjs:104` / `:109-113`）；§2 长段落拆为列表项（段落长度门）。

## 2.3 机制设计（摘要，逐字口径全在同档 §6）

- **两个数**：本段轮数 = `ContinueError.turn`；链内累计 = `agent._turnSeq`（§4 的累计计数器本身，不读 `_currentTurn` 镜像帧）。
- **上限不印**：撞帽点上本段上限 ≡ 本段轮数、累计上限 ≡ 累计轮数（两个等式见同档 §6.2）⇒ 印出来必是重复数，删括注。
- **三端同信息集**：CLI / VSC / 桌面各一句，占位符各取上面两个数，端差即缺陷。
- **桌面端需扩一参**：该端文案在 `turn-driver.mjs` 的 `askContinue` 闭包内、`agent` 不在域 ⇒ 注入面签名扩为 `askContinue(key, turn, total)`，调用点（`turn-face.mjs:150`，`agent` 在域）传 `agent._turnSeq`。

## 2.4 受影响文件

| 文件 | 改动 | 层级 |
|---|---|---|
| `thincoder-cli/src/tui/agent-turn.mjs` | `:242` 文案 · `:250` 状态行 · 分支头取 `total` | 端面 |
| `thincoder-vscode/src/extension/panel-turn-loop.mjs` | `:262` 文案 | 端面 |
| `thincoder-desktop/src/main/turn-face.mjs` | `:68` 转口 · `:150` 传累计（+ 注释 `:57`） | 端面 |
| `thincoder-desktop/src/main/turn-driver.mjs` | `:103` 模板 + 签名 · `:99-100` 注释 | 端面 |
| `docs/core/design/TURN-CAP-CONTINUE.md` | §1 / §2 / §3.1 / §4 / §5 / §6 | 文档面（本批已落） |
| `docs/cli/design/TUI-SESSION-VIEW.md` | `:71` 旧询问串换本批模板（见 2.8 ②）+ 形态重整（见 2.8 ④） | 文档面（本批已落） |
| `docs/core/requirements/TURN-CAP-CONTINUE.md` | `:43` 已改写为本裁定口径（见 2.8 ①） | 需求面 —— 父侧已落 |

**层级结论**：零文件跨层（三端各改提示面文件，桌面另加注入面一处），无需拆分计划；不新增文件。

## 2.5 验收对照

| # | 验收（指向同档） | 机检 |
|---|---|---|
| 1 | 三端文案 = 逐字模板（`design §6.3`） | 实施轮单测：读出三处模板串逐字比对 |
| 2 | 累计取 `agent._turnSeq`（`design §6.1`） | 用例 C1–C3（`design §6.6`）：`maxTurns:3` 首段 ⇒ `total=3`；续跑段 ⇒ `total=6`；新链复位 |
| 3 | 三端无 `(limit …)` 残留（`design §6.2`） | 全仓检索 `turns \(limit` 在源码 / 测试面零命中 |
| 4 | 三端信息集相等（`design §6`） | 每端文案含两个数：`seg` / `total` 各命中一次 |

## 2.6 关键决策

| # | 决策 | 理由 |
|---|---|---|
| 1 | 删 `(limit …)`，不印上限 | 撞帽点上两个上限都恒等于已示轮数（同档 §6.2 两个等式）—— 印出来只有重复 |
| 2 | `ContinueError` 不加字段 | 载荷零改（D-TC7 / 需求 N6），且该值恒等于已示数；三端用既有两个值即够 |
| 3 | 累计读 `_turnSeq` 本身 | §4 计数器单源；`_currentTurn` 是同值镜像 |
| 4 | 桌面注入面扩一参 | 该端取值点与文案点分处两档，`agent` 只在调用点在域 |

## 2.7 上抛项

- **[已关闭]** 需求档 `docs/core/requirements/TURN-CAP-CONTINUE.md:43` —— 父侧已改写为本裁定口径（逐字见 2.8 ①）；设计侧零触需求档。
- **[已关闭]** `docs/cli/design/TUI-SESSION-VIEW.md:71` 的旧询问串已换本批模板（逐字见 2.8 ②）。该档形态重整的逐字口径见 2.8 ④ —— **「文字逐字未动」按字符口径不成立**（句读符与括号形态变了），词句未改写。
- **[上抛·知会]** 锁定串实扫结论：全仓测试档无一处断言这两句（检索串 `turns \(limit` / `Continue from here` / `Ran \d` / `Continue after`），要改的只有三端源码 + 本档 + 需求档；归档档（`_archive`）不追改。

### 2.8 修正轮（2026-11-01 · 父侧裁定落地）

**① 需求档已随正（父侧笔，设计侧零触）**

`docs/core/requirements/TURN-CAP-CONTINUE.md:43` 现文逐字：

> **撞帽提示 = 本段轮数 + 链内累计轮数**，并删掉 `(limit …)` 括注（三端同一信息集；用户 2026-11-01 20:02 裁定补累计、20:04 裁定「一起改」）。只报本段，用户判不出「已经转了 40 轮」还是「刚转 12 轮」，而继续 / 停的决断正好取决于这个量级；`(limit N)` 在撞帽面上恒等于本段轮数（`ContinueError(maxTurns)` 于循环跑满后抛出 ⇒ 同一个数说两遍），VSC / 桌面更印成无数字的 `(limit)` 断头句。

⇒ 2.7 第 1 条关闭。2.1 条目 1 / 2 的判据来源以现盘为准（旧文「不改继续提示文案」已从需求档面消失）。

**② CLI 设计档询问串已换本批模板（本批落）**

`docs/cli/design/TUI-SESSION-VIEW.md:71` 现文逐字：

> - `ContinueError` → 询问 "Ran ${seg} turns — ${total} turns total. Continue?"，待答状态行 "Continue after ${seg} turns (${total} total)?"——`seg` = 本段轮数、`total` = 链内累计（逐字模板单源 = `docs/core/design/TURN-CAP-CONTINUE.md` §6.3）；**autoTurn 消化轮例外：无面板——AUTO 档自动 resume、手动档静默拒绝**，部分消化留在历史不丢。

⇒ 2.7 第 2 条关闭。该档旧串零残留：全档扫 `Continue` 仅命中 `:16`（模块地图里的 `ContinueError` 名，非提示串）与 `:71`（已换）。

**③ 该档本轮被触达 ⇒ 顺带清段**

上一轮的重整（长段落拆列表项 · 裸档名补全为仓根路径）随本轮触达一并成立；本轮该档的文字改动只有 `:71` 一处。

**④ 「重整只插了换行」按字符口径不成立（实核读数）**

比对口径 = 去全部空白后对比 `fa88fda5`（重整前）与 `df6bddfd`（重整后提交）的该档：

| 读数 | 重整前 | 重整后 | 差 |
|---|---|---|---|
| 去空白字符数 | 11800 | 11860 | +60 |
| `；` | 92 | 80 | −12 |
| `。` | 64 | 79 | +15 |
| `—` | 176 | 172 | −4 |
| `（` / `）` | 176 / 177 | 175 / 176 | −1 / −1 |
| `：` | 48 | 48 | 0 |
| 行首列表符 `- ` | 37 | 57 | +20 |

**结论**：词句未改写（未发现实词替换），但**句读符与括号形态变了** —— 拆列表时分句尾 `；` / `—` 收成 `。`，并去掉一层嵌套括号（`（` / `）` 各 −1）；字符净增 60 = 行首列表符 +20 与裸档名补全路径 1 处（该处原写相对名，现写仓根全路径 `docs/core/design/SESSION.md`）。

**测量局限如实报**：整档「去空白后全等」机证不成立（两侧 11800 / 11860，非同源），上表差量是**逐类字符计数 + 逐处对读**所得，不是字串全等证明。是否把句读符还原，请父侧裁定（还原 = 该档 4 段句尾标点回改，改完仍须过段落长度门）。

### 2.9 修正轮（2026-11-01 20:11 · 用户裁「拆段只许插空行，一个字不改」）

**① `docs/cli/design/TUI-SESSION-VIEW.md` 按「只插空行」重做**

做法：以基线 `fa88fda5` 版为底重写，只在句界（`。` / `；`，代码跨内不断）**插入空行**分段；上一轮加的 `- ` 行首符、句读符改写（`；`→`。`、`—`、嵌套括号）与列表化全部撤销。

**机证（去全部空白后比对 `fa88fda5` vs 现档，`node` 读数）**：

| 读数 | 值 |
|---|---|
| 基线去空白字符数 | 11800 |
| 现档去空白字符数 | 11962 |
| 排除两处内容改动后（基线 ∥ 现档） | **11729 ∥ 11729，全等 `true`** |
| 段落数 / 最长段 | 37 / 289 字符（门 = 300） |

两处内容改动（逐处点名，其余逐字等于基线）：

1. `ContinueError` 询问串——旧串 = 只报本段的 `"Continue after N turns?"`；新串 = `"Ran ${seg} turns — ${total} turns total. Continue?"`，待答状态行 `"Continue after ${seg} turns (${total} total)?"`，并以注说明 `seg` = 本段轮数、`total` = 链内累计（逐字模板单源 = `docs/core/design/TURN-CAP-CONTINUE.md` §6.3）。即 §2.8② 该项，本批既有内容改动。
2. `meta` 行裸档名——原文写「`core` + 裸档名（仅档名、无目录段）」形；现文 = `字段文法单源 = `docs/core/design/SESSION.md` §6.26）`。**来源 = 本轮机检门命中 `锚·档缺 docs/cli/design/TUI-SESSION-VIEW.md:190`**，按「裸档名写仓根完整路径」修；不修则门 REFUSED。

**② `docs/core/design/TURN-CAP-CONTINUE.md` §6.5 的 CLI 设计档行整条退场**

删后回读该段（引句 + 五条实施面行 + 三条要点行）：§6.5 引句「要改的只有源码面与规范面」、五条实施面行、检索串行均不以该行为前设——该段不依赖它成立。

**③ [上抛·待裁] 同一表 `:203` 需求档行仍是过期工单**

现文逐字：`| 需求档 | `docs/core/requirements/TURN-CAP-CONTINUE.md:43`（「不改继续提示文案」） | 与本裁定冲突——**主 agent 落**，设计侧只报 |`。需求档 `:43` 父侧已改写完成（§2.8①）⇒ 该行与 ② 同类（完成的动作留成会过期的工作单），但本轮授权面只有 ②，故未动，请裁。

## §3 设计评审（评审子代理）
## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
