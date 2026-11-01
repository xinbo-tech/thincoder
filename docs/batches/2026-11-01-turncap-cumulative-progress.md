# 2026-11-01 · turncap-cumulative-progress
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-11-01 · 来源 = 用户 2026-11-01 20:02 逐字「C15累计进度要啊」。
> 台账 = #1962（TURN-CAP-CONTINUE · 归批）。前情 = docs/batches/2026-11-01-dispatch-one-face-retire.md（#1961，进行中）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-11-01
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

### 1.7 父侧两处收正（2026-11-01 20:17 · 由设计席 `#73` 当场纠正）

**① 我把「两处改动」说成了「三处」。**

我在派单里写「上一轮两处 + `:190` 这处 = **三处**」。设计席给出证明式读数：

```
基线 fa88fda5 去空白 11800 → 现档 11962（净差 +162）
编辑① 询问串（现 :71）      +149
编辑② 裸档名 → 全路径（现 :193）  +13
① + ② = +162 = 净差          ⇒ 基线 + ① + ② === 现档  true
```

**⇒ `:190`（现 `:193`）就是上一轮报的第 2 处，没有第三处。** 我把同一件事数了两遍。

**② 需求档 `:43` 的定位——本批实际不动需求档。**

`:204` 原写「命中面 = 三处源码 + 本档 + **需求档** + 归档档」。设计席 `git grep` 实扫（全仓已跟踪档）：`turns (limit` / `Continue from here` / `Continue after` 三串在**需求档零命中**、测试档零命中。**已改为「三处源码 + 本档 + 归档档（需求档实扫零命中）」。**

**为什么记这两条**：**「父侧的数量」同样是读数** —— 与 §1.2 那条（缩写回忆当实扫）是同一个毛病，只是这次错在计数而不在引文。**设计席两次都用实扫把我纠回来了，这两次都该记在案上，不该只出现在它的报告里。**

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（2026-11-01 · 修正轮 18 条处置见 2.11（第 5 / 16 后半 / 17 属父侧笔域））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>


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

### 2.10 修正轮（2026-11-01 · 父侧「两件都裁了」落地）

**① §6.5 需求档行退场（父侧准删）**

删前该行逐字：

> `| 需求档 | `docs/core/requirements/TURN-CAP-CONTINUE.md:43`（「不改继续提示文案」） | 与本裁定冲突——**主 agent 落**，设计侧只报 |`

判据与 §2.9② 同：需求档 `:43` 父侧 20:08 已改写（逐字见 §2.8①）⇒ 该行由「冲突待落」变成「已完成的动作留成过期工单」。

删后回读 §6.5 全节结论：

- 表 5 行全为**源码面**实施目标（CLI 文案 / CLI 状态行 / VSC 文案 / 桌面文案 / 桌面转口·调用点）——两条「待对齐」登记（CLI 设计档 = §2.9② · 需求档 = 本条）均已退场，**未剩半张表**。
- 引句「要改的只有源码面与规范面」仍成立（规范面 = 本档自身，本批已改）。
- 三条要点行中检索串行有一处以该行为前设 ⇒ 见 ②；归档档不追改 / 不新增机检两条不受影响。

**② 回读抓出的一处前设，同轮改正**

原检索串行称「命中面 = 三处源码 + 本档 + **需求档** + 归档档」。本轮 `git grep` 实扫（全仓已跟踪档，含测试档）读数：

| 检索串 | 命中面 |
|---|---|
| `turns (limit` | 三处源码 + 本档 `:167` + 归档三档 |
| `Continue from here` | 两处源码 + 本档 `:177` / `:178` + 归档一档 |
| `Continue after` | CLI 源码 `:250` + 本档 `:180` + 归档一档 |
| 四串合计 | **需求档零命中** · **测试档零命中** |

⇒ 现文改为「三处源码 + 本档 + 归档档（需求档实扫零命中——本裁定口径已替换旧串）」；「测试档零命中」的结论不变。

**③ `meta` 行裸档名的性质登记（父侧准留）**

- 改动：基线形式 = 「`core` + 裸档名（仅档名、无目录段）」；现文 = 仓根全路径 `docs/core/design/SESSION.md` §6.26）。
- 现盘坐标 `:193`；门报的 `:190` 是插空行成形前的行号。
- 性质 = **门逼出来的机械收正，非本批语义改动**：机检门「锚·档缺」是写盘前硬拒，不改则整档落不了盘；「裸档名写成仓根完整路径」是同一条既有规矩，不扩大写面。

**④ 基线比对（含 ③ 这处）**

基线 = `fa88fda5` 版 `docs/cli/design/TUI-SESSION-VIEW.md`，现档 = 工作树。口径 = 去全部空白后逐字符比对；**证明式 = 基线 + 两处编辑 === 现档**（不是长度比对）。

| 读数 | 值 |
|---|---|
| 基线去空白字符数 | 11800 |
| 现档去空白字符数 | 11962 |
| 净差 | +162 |
| 编辑① 询问串（`:71`） | +149 |
| 编辑② 裸档名 → 全路径（`:193`） | +13 |
| ① + ② | +162 = 净差 |
| **基线 + ① + ② === 现档** | **true** |

⇒ 该档相对基线**只有这两处内容改动**，其余逐字符等于基线。

**对父侧口径的修正（如实报）**：父侧记「上一轮两处 + `:190` 这处 = 三处」——实核是**两处**：`:190`（现 `:193`）就是上一轮报的第 2 处，`+162 = 149 + 13` 全由这两处构成，**无第三处**。§2.9 的「两处」清单未漏项，其「排除后 11729 ∥ 11729」与本轮读数一致。

**⑤ 一处弃用的读数（留痕免得被当结论）**：本席先用「递归公共前后缀」量得去空白后 5444 ∥ 5444——那是把两处改动**之间**的 6.2k 相同正文一并并进差异段的假读数，已弃用；以 ④ 的证明式为准。

### 2.11 修正轮（2026-11-01 · 评审轮 1 的 18 条处置）

**处置口径**：评审第 5 条（需求档归属）、第 16 条后半（§1 两个 `### 1.7`）、第 17 条（§1 时态句）都在父侧笔域 —— 本席零触、只报（见 2.11 末表）。其余逐条落盘如下。

| 评审号 | 改在哪 | 改后口径（逐条） |
|---|---|---|
| 1 🔴 | `docs/core/design/TURN-CAP-CONTINUE.md` §6.8（新增） | RTM 三问作答：被破坏行 = 零行（`test/integration/**` 对三串实扫零命中，24 个故事无一断言撞帽提示）· 冗余行 = 无 · 缺的行 = 1 个故事 1 行用例；行号已先在 `test/RTM.md` 定死（故事 25 · 用例 25-1 / 25-2），再写用例标题 |
| 2 🟡 | 设计档 §6 首段 · §6.3 · §6.4 · §6.5 · §6.6 C5 | 纳入第四面 `thincoder-cli/src/command-interactive.mjs:111`（`agent` 同域，`:100` `agent.autoApprove`）；模板 = `[paused] Agent stopped after ${seg} turns — ${total} turns total. Run in TUI to continue.`；口径由「三端」改「四面」（D-TC10 同改） |
| 2 🟡 后半 | 设计档 §6.7 末二条 | `thincoder-server/deploy/sandbox/member-shell/core-run.mjs:423` **不纳入**：该行是终态状态行（沙箱壳撞帽即收口，无卡、无 resume 路径），用户不据此做「继续 / 停」的决断 ⇒ 两个数的用处不存在。面判据写入 §6 首段：该行给不给续跑去向 |
| 3 🟡 | 设计档 §6.7 | 新增 D-TC7 零改动面口径：段内帽 `turn-loop.mjs:89` · 循环骨架 `spawn-child.mjs:233` · 载荷 `helpers.mjs:239-245` 三面零改；桌面注入缝扩一参是已披露的唯一相邻改动，不属上述三面 |
| 4 🟡 | 本段 2.12 | 层级结论补函数层一行，不写行数 |
| 5 🟡 | 不属本席 | 需求档 `docs/core/requirements/TURN-CAP-CONTINUE.md` 归父侧：`- **撞帽提示 = 本段轮数 + 链内累计轮数**` 落在 `## 4. 范围边界（不做）` 内、F 表无对应编号 ⇒ 需父侧移入 F 表 |
| 6 🟡 | `docs/cli/design/TUI-SESSION-VIEW.md:74` / `:81` | 行首补 3 空格（与同段 `:71` / `:72` / `:82` 续行齐平）；机证换成保留行首缩进的读数（见 2.13） |
| 7 🟡 | 设计档 §1 第 1 行 + §3.2 三行 | VSC 端改判「已退役」：现盘 `thincoder-vscode/src/agent.mjs` 10 行、`:9` 只余 `ContinueError` 再导出；类 / 抛点重指核 `turn-loop.mjs:316`，编号复位重指 `run-start.mjs:109` / `:113`，编号帧重指 `turn-loop.mjs:98` / `:99-100`，回合尾重指 `turn-loop.mjs:307` |
| 8 🟡 | 设计档 §6.7 末条 | 桌面端验收前须重打包，或以源码起跑验；写明打包产物（`dist-r{3,4}`）因 `thincoder-desktop/.gitignore:9` 的 `dist-*/` 不在检索面内 |
| 9 🟡 | 设计档 §6.5 末条 | 删归因「用户明定」——记录面用户逐字只有 20:02 / 20:04 两句；改为设计侧判断加理由（现有门不查串内容，新加一条只是把同批串抄第二遍） |
| 10 🟡 | 设计档 §6.3 | 新增「三问式（逐串作答）」五条：四条既有串判 `existing`（坐标 · 逐字名 · 消费者），新增构句判 `none found`（实扫三端源码 ∥ 本档 §4 ∥ 需求档） |
| 11 🟡 | 设计档 §6.1 先例行 | 补齐先例坐标与来处（`checkpoint.mjs:29`，`#417` / `#934`，同处注释 `:20-34`）；「对齐 ∥ 偏离」写成一条：取数对齐检查点留痕，句式维持各端既有措辞（`Ran …` ∥ `Agent reached …`） |
| 12 🟡 | 设计档 §6.6 + 本段 2.14 | 补单测档落点（`docs/batches/2026-11-01-turncap-cumulative-progress.test.mjs`）、命令形 `node --test <档>`、断言形态（C1–C3 行为断言 ∥ C4–C5 源码切片） |
| 13 🔵 | 设计档 §6.1 首条 | 「同一时刻恒等」收窄为「撞帽点两值恒等」；补链起点只复位 `_turnSeq`（`run-start.mjs:113`）、`_currentTurn` 不复位 ⇒ 链起点到首轮帧之间两值不等 |
| 14 🔵 | 设计档 §6.2 末二条 | 「现盘更差」改写为不随实施腐烂的形：原印无数字的 `(limit)` 是断头句，故一并删 |
| 15 🔵 | 设计档 §6.1 新增条 | 兜底口径写死：直读 `agent._turnSeq`，**不写 `?? 0`**（撞帽点必为整数；缺值印 0 会把「未跟踪」读作「零消耗」，正是 `checkpoint.mjs:24-26` 禁的冒充） |
| 16 🔵 前半 | 本段（本节） | 两条状态行合一条（重复行已删） |
| 16 🔵 后半 | 不属本席 | 两个 `### 1.7`（§1 `:49` ∥ `:71`）在父侧笔域，未动 |
| 17 🔵 | 不属本席 | §1 `:19`「它现在是 open」在父侧笔域，未动 |
| 18 🔵 | 判：不留 | §2 是被删行的作者，但记录面留痕的现规矩是「历史在 git」；§2.9② 已点名该行退场判据与坐标，逐字原文以 git 为准（不复制进本节） |

**新增的一处非父侧列出的文件**：`test/RTM.md`（新增故事 25 两行）。理由 = 父侧裁定「行号先在 RTM 定死，再写用例标题」；不落则该行是悬空指针，设计档 §6.8 引它即档缺。

### 2.12 受影响文件（补函数层结论 · 评审 4）

| 文件 | 改动 | 层级 |
|---|---|---|
| `thincoder-cli/src/tui/agent-turn.mjs` | `:242` 文案 · `:250` 状态行 | 端面 |
| `thincoder-cli/src/command-interactive.mjs` | `:111` `[paused]` 行 | 端面 |
| `thincoder-vscode/src/extension/panel-turn-loop.mjs` | `:262` 文案 | 端面 |
| `thincoder-desktop/src/main/turn-face.mjs` | `:68` 转口 · `:150` 传累计 | 端面 |
| `thincoder-desktop/src/main/turn-driver.mjs` | `:103` 模板 + 签名 | 端面 |
| `test/RTM.md` | 故事 25 两行（索引先定号） | 文档面（本批已落） |
| `docs/core/design/TURN-CAP-CONTINUE.md` | §1 / §3.2 / §5 / §6 | 文档面（本批已落） |
| `docs/cli/design/TUI-SESSION-VIEW.md` | `:74` / `:81` 行首缩进 | 文档面（本批已落） |

**层级结论**：文件层零跨层，不新增文件。函数层不达标一处：`thincoder-cli/src/tui/agent-turn.mjs` 的 `runAgentTurnBody`（`:108`–`:423`）是单函数体，而本批只在该函数内改两处文案 ⇒ **结构本批不动**，拆分另开一批。

### 2.13 机证（评审 6 · 保留行首缩进）

| 读数 | 值 |
|---|---|
| `git show HEAD:docs/cli/design/TUI-SESSION-VIEW.md` 去全部空白字符数 | 11962 |
| 现档去全部空白字符数 | 11962 |
| 两侧去空白全等 | **true** |
| `:71` / `:72` / `:74` / `:81` / `:82` 行首空格读数 | 3 / 3 / 3 / 3 / 3 |

⇒ 本轮该档只有两行行首补缩进（`:74` / `:81`），其余逐字符等于 HEAD；列表项 4 / 5 的续行不再被空行挤出列表。

### 2.14 验收对照（补 · 评审 12）

| # | 验收 | 机检 |
|---|---|---|
| 1 | 四处文案 = §6.3 逐字模板 | 单测 C4 / C5（源码切片） |
| 2 | 累计取 `agent._turnSeq`（不加兜底） | 单测 C1–C3（行为断言） |
| 3 | 四处无 `(limit` 残留 | 单测 C4 的零命中断言 + 全仓检索 |
| 4 | 撞帽面端到端两个数 | `test/RTM.md` 故事 25（集成行，收口轮跑） |

**命令形**：`node --test docs/batches/2026-11-01-turncap-cumulative-progress.test.mjs`（实施轮写、收口删）。

### 2.15 返工（2026-11-01 · 用户裁「折行不是重写」）

**判据**：`docs/core/design/DOC-DISCIPLINE.md:2272` 逐字「过判据的办法只剩**重新组织语言重写**（**折行、切段、缩短都不是重写**）」。§2.9 / §2.13 的「只插空行」不符合此判据 ⇒ 本档 `docs/cli/design/TUI-SESSION-VIEW.md` 的成形改为重写，读数按 2.15 为准。

**做法**：与基线 `fa88fda5` 对读，8 处插空行 → 6 个语义单元；逐单元合并回一段后重写（从句拆独立句 · 长并列举改分述 · 悬念段尾补主谓），断句一律落 `。`。`:72` 询问串（`Ran ${seg} turns — ${total} turns total.` + 待答状态行）为内容改动，逐字未动。

**六个单元与改后段字数**：item 4 三支 91 / 214 / 59c；item 5 收尾补两件 88c；item 7 两段 118 / 163c；§6 归档快照 `meta` / `status` / `rows` 三支 167 / 197 / 82c。

**未动的三个单元（判据：断开处已是 `。`，两侧各自成句）**：item 4 的「其余错误」支、§5.5 的「**复用不可**」支、§6 的「停面词 / 错误面词判据」支。

**读数**：段数 39；正文最长段 ≤ 300（唯一超 300 = ````text```` 代码块 387c，门跳过）；段尾非句号的仅剩 5 处正经形态（两个加粗小标题 · 冒号引入 · 代码块 · 破折号引入表）。标识符核对（反引号集，基线 vs 现档）：**基线标识符零丢失**，两处「减量」为重标点——字段清单由一串拆为单项；`docs/core/design/SESSION.md` 由裸档名写为仓根全路径。

**门**：`DOC-CHECK GATE: PASS`（1 档全清）。

## §3 设计评审（评审子代理）
**状态行**：评审通过（轮 2 复核：轮 1 十八条 15 落 / 3 半落 / 3 父侧笔未动；🔴 0 · 🟡 8 · 🔵 1）



### 轮次 1（评审子代理）

**三问先答（实读结论，供 §4 判）**

① **累计值真源**：`_currentTurn` 与 `_turnSeq` 在撞帽点同值、同源。

- `thincoder-core/agent/turn-loop.mjs:98` 每轮 `++agent._turnSeq`；`:99` 把 `frame.turn`（= `seq`）回填 `_currentTurn`（帧公式 `helpers.mjs:276-277`）。
- ⇒ D-TC2／D-TC4／D-TC8 与设计席选 `_turnSeq` **两者都成立**，设计没选错源（`_currentTurn` 是同值镜像，非段内值）。

② **`(limit N)` 恒等式**：严格成立。

- `turn-loop.mjs:316` 抛 `new ContinueError(maxTurns)`，循环 `:89` 跑满才到抛点 ⇒ `error.turn === maxTurns === 本段已跑轮数`。
- 累计上限经 `helpers.mjs:277` 在末轮恰为 `seq`；`ContinueError` 只带 `turn`（`helpers.mjs:239-245`）⇒ 拒加字段成立。

③ **桌面扩一参 vs D-TC7**：**无实质冲突**，但设计文档没写这一句 ⇒ 见 #3。

- 不动面实核：`turn-loop.mjs:89`（段内帽）· `spawn-child.mjs:233`（循环骨架）· `helpers.mjs:239`（载荷）· `turn-face.mjs:117-160`（`runWithResume` 结构）。
- 动面实核：注入缝 `turn-face.mjs:68` ∥ `turn-driver.mjs:99`（只扩一参）。

④ **锁定串穷尽性（我实扫）**：设计席「测试档零命中」**成立**。

- 检索 `turns (limit` ∥ `Continue from here` ∥ `Continue after` ∥ `Ran \d`：全仓 `.mjs`／`*.test.mjs`／`docs/batches` 测试档 **零命中**（`ls docs/batches *.test.mjs` = 0 档）。
- 单元档为何零命中：`thincoder-cli/test/run.mjs:4` 明写单元档住 `docs/batches/`、用毕即删 ⇒ 零命中是当前树的事实。
- 命中面 = 三处源码 + 本档 + 归档三档 + 未跟踪的 `thincoder-desktop/dist-r{3,4}/…/app.asar:70392`（`thincoder-desktop/.gitignore:9` `dist-*/` ⇒ `git grep` 天然看不见，属口径内）。
- **附带结论**：`thincoder-cli/docs/_archive/design/TURN-CAP-CONTINUE.md:90` 当年「改文案 = 动锁定串」的顾虑，现盘无任何断言支撑——这条顾虑确实没被核实过。

**另判三事**

- **Ⅰ（重整允许面）**：判法方向对、证据口径不够。
  - 去空白全等对「行首缩进」全盲，而缩进是 markdown 唯一赋义的空白。
  - 盘上 `docs/cli/design/TUI-SESSION-VIEW.md:74`（`其他错误 → …`）与 `:81`（`ensureSessionTitle`；）停在 0 列，同段 `:71`／`:82` 是 3 空格续行 ⇒ 有序列表 4／5 项在 `:74` 处被空行闭合。
- **Ⅱ（删两条「待对齐」）**：理由**成立**。
  - 两行都是对别档的工单（「主 agent 落，设计侧只报」），动作已完 ⇒ 留成会过期的工作单；记录面已逐字留痕（`batch:225`／`:231-233`）。
  - 边角：CLI 设计档那行的原文未在 §2.9② 逐字留存（`:219-221` 只记「整条退场」）⇒ 见 #18。
- **Ⅲ（父侧两条错）**：两条都已从盘上消除。
  - 「三处」只剩记录面「引错 + 收正」形态（`batch:71-84`／`:278`）；活档唯一「三处」= 「三处源码」，实核为真（`design:204`／`batch:249`）。
  - 需求档 `:43` 现文与 `batch:165` 引文逐字一致；旧串只剩归档副本（`thincoder-cli/docs/_archive/requirements/TURN-CAP-CONTINUE.md:43` ∥ `thincoder-vscode/docs/_archive/requirements/TURN-CAP-CONTINUE.md:39`），`design:205` 已明定不追改。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Acceptance / 集成用例设计 | 🔴 | 设计缺「从 `test/RTM.md` 出发」的集成用例设计节。`docs/core/design/TURN-CAP-CONTINUE.md:208` 只有单测用例 C1–C3，`batch:135-142` 只有单测验收；`test/RTM.md` 实存（24 条 CLI 故事，无撞帽提示故事），本批改的是**用户可见业务结果**，既未答「既有行是否被破坏」也未给豁免理由 | 在该设计节内按 RTM 增量作答：破坏哪几行（实扫 `test/integration/**` 零命中 ⇒ 零行被破坏）／哪行冗余（无）／缺哪行；若新增，先在 `test/RTM.md` 定号再写用例标题 |
| 2 | Requirements coverage | 🟡 | 撞帽提示面枚举不完备：`thincoder-cli/src/command-interactive.mjs:111` 只报本段轮数（`[paused] Agent stopped after ${error.turn} turns.`），`design:204` 的检索串扫不到它；`thincoder-server/deploy/sandbox/member-shell/core-run.mjs:423` 报预算零数字。设计要求「端差即缺陷」（`design:150`），这两面既未纳入也未声明排除 | 二选一并在 §6.5／§6.7 落字：纳入（该处 `agent` 在域，成本同 VSC）或写明排除理由；并把 `[paused]` 类串补进检索清单 |
| 3 | Feasibility / D-TC7 一致性 | 🟡 | `design:218`（同 `:130`）自述「不改撞帽判定 / 续跑结构 / 段预算」，同时 `design:188` 扩注入缝签名 `askContinue(key, turn, total)`。实核无结构改动（见三问③），但文档没写这句口径 ⇒ 对读 D-TC7 与 §6.4 读出矛盾 | §6.7 加一句：D-TC7 零改动面 = 段内帽 / 循环骨架 / 载荷；端侧注入缝扩一参是已披露的唯一相邻改动，不属上述三面 |
| 4 | Affected-file tier | 🟡 | 层级结论只到文件行数（`batch:133`「零文件跨层…无需拆分计划」）。实核函数层：`thincoder-cli/src/tui/agent-turn.mjs:108`→`:423` 的 `runAgentTurnBody` = **316 行单函数**，该文件正在改动表内（`batch:125`）。四档行数 424 / 307 / 207 / 237 均 ≤500 | 层级结论补一行：函数层不达标 + 本批只改该函数内两处文案 ⇒ 拆分计划「本批不动结构」或给出方案；行数不写进文档 |
| 5 | Document ownership | 🟡 | 必做要求放在「不做」节：`docs/core/requirements/TURN-CAP-CONTINUE.md:38` 是 `## 4. 范围边界（不做）`，`:43` 起首即 `- **撞帽提示 = 本段轮数 + 链内累计轮数**`；§2 F 表（`:15-25`）无对应条目 ⇒ 需求层无 F 号可回指 | 移入 §2 F 表（或另起编号），§4 只留真正的不做项；现文事实陈述与用户逐字引文保留 |
| 6 | Clarity / 重整判法 | 🟡 | 「只插空行」的机证对缩进全盲：证明式 = 去全部空白后 `11729 ∥ 11729`（`batch:211`／`:264-276`）。盘上 `docs/cli/design/TUI-SESSION-VIEW.md:74` 与 `:81` 停在 0 列，同段 `:71`／`:82` 是 3 空格续行 ⇒ 列表在 `:74` 被空行闭合 | 允许面 = 句界插空行 **且行首缩进逐行同基线**；机证改为保留行首缩进的逐行比对；`:74`／`:81` 续行缩进补回项内（基线侧缩进本轮未核） |
| 7 | Doc-state（跨档滞后） | 🟡 | VSC 坐标标「在位」而该档已退役：`thincoder-vscode/src/agent.mjs` 现盘仅 10 行，唯一实体是 `:9` 的 `export { ContinueError } from "@thincoder/core/agent/helpers.mjs"`；`design:13`／`:85`／`:86`／`:87`／`:93` 仍标在位，需求档 `:17` 同病。`batch:112` 的「按实读改正失效坐标」只做了核侧 | 按现体重指（帧/复位 → `turn-loop.mjs:98` ∥ `run-start.mjs:113`；类/抛点 → `helpers.mjs:239` ∥ `turn-loop.mjs:316`）或标「已退役（10 行转口）」 |
| 8 | Acceptance（真机面） | 🟡 | 桌面验收无重打包步骤，而打包产物仍印旧串：`thincoder-desktop/dist-r4/win-unpacked/resources/app.asar:70392`（`dist-r3` 同），`thincoder-desktop/.gitignore:9` 忽略 `dist-*/` ⇒ 检索面看不见，但用户跑的就是它（D-TC19 的失效模式） | 验收补一条：桌面端验证前须重打包，或明确验法 = 源码起跑；并写明打包产物不在检索面内 |
| 9 | Evidence（授权归属） | 🟡 | `design:206`「**不新增机检**（用户明定）」无从核对：记录面用户逐字只有 `batch:15`「C15累计进度要啊」与 `batch:47`「一起改」，均未涉机检 | 引原话或去掉归因，直接写设计侧判断与理由（改文案面无需新增机检） |
| 10 | Existing-piece check | 🟡 | 三问式缺位：新提示三串无 `existing: …` / `none found: …` / `existing but unusable: …` 判定；就近既有件 `checkpoint.mjs:29` 的 `accumulated ${child?._turnSeq ?? 0} turns`（`design:160` 引为先例）是否复用措辞未答 | 每条新标签补一行三问式答案：既有同义文案在哪、逐字是什么、为何不用或如何复用 |
| 11 | Closest-precedent | 🟡 | 先例行只有一处取数先例（`design:160`），无先例批次坐标、无「对齐 ∥ 偏离」总述；三端句式不统一（`design:176` `Ran …` ∥ `:177-178` `Agent reached …`）却未写这是沿既有端形的刻意偏离 | 补齐先例坐标（实现点 + 对应设计节 + 先例批次）与偏离理由：取值对齐 `checkpoint.mjs:29`，句式维持各端既有措辞 |
| 12 | Acceptance（可执行性） | 🟡 | 验收只有「读出三处模板串逐字比对」与 C1–C3（`batch:139-142`），无测试档路径 / 命令；本仓单测档按批落 `docs/batches/`、以 `node --test <档>` 直达（`thincoder-cli/test/run.mjs:4`） | 验收补单测档落点与命令形 `node --test <档>`；三端模板断言写明形态（源码切片 ∥ 行为断言） |
| 13 | Clarity（镜像边界） | 🔵 | `design:159`「同一时刻恒等」比实况宽：撞帽点相等（`turn-loop.mjs:98-100` 同点赋值），但链起点只复位 `_turnSeq`（`run-start.mjs:113`），`_currentTurn` 不复位 ⇒ 链起点到首轮帧之间不等 | 收窄为「撞帽点两值恒等」；取计数器本身仍正确 |
| 14 | Doc hygiene | 🔵 | 规范面写现盘旧态：`design:169`「**现盘更差**」与 D-TC10（`:133`）同句，实施后即为假 | 改写成不随实施腐烂的形（「原印无数字 `(limit)` —— 断头句，故一并删」），现盘读数移记录面 |
| 15 | Clarity（端差防呆） | 🔵 | 模板直插 `agent._turnSeq` 无兜底，而先例是 `${child?._turnSeq ?? 0}`（`design:160`）；三端各写一句时一端照抄一端不照抄即成端差 | §6.3 写死一条：一律读 `agent._turnSeq`（撞帽点必为整数）或统一加兜底，二者择一 |
| 16 | Doc hygiene（记录面） | 🔵 | 重复/串号：§2 两条状态行（`batch:93` ∥ `batch:96`）；两个 `### 1.7`（`batch:49` ∥ `batch:71`） | §2 只留一条状态行；第二个 1.7 改号（如 1.8） |
| 17 | Doc-state（记录面时态） | 🔵 | `batch:19`「它现在是 `open`」为现在时，而 D-TC10 已重写（`design:133` 无该 open） | 加一句指向「本节为改写前原文，现文见 §2」 |
| 18 | 记录留痕（Ⅱ 边角） | 🔵 | 需求档那行删前逐字留痕（`batch:225`／`:231-233`），CLI 设计档那行只记「整条退场」（`batch:219-221`），原文未落记录面 | 需要可查则把被删行逐字补进 §2.9②；不留则明说以 git 为准 |

**计数**：🔴 1 · 🟡 11 · 🔵 6（合计 18）

VERDICT: changes-required

### 轮次 2（评审子代理）

轮 2 = 只验轮 1 十八条的落地（🔴1 · 🟡11 · 🔵6）+ 另判 Ⅰ/Ⅱ/Ⅲ。

对象 = `docs/core/design/TURN-CAP-CONTINUE.md` · `docs/cli/design/TUI-SESSION-VIEW.md` · `docs/core/requirements/TURN-CAP-CONTINUE.md` · `test/RTM.md` · 本档；代码坐标按派单要求逐处实读。

**逐条对账（盘上实读）**

| 轮1# | 处置 | 读数 |
|---|---|---|
| 1 🔴 | 落地 | `docs/core/design/TURN-CAP-CONTINUE.md:248` §6.8 在册，三问齐（`:252` 破坏零行 · `:254` 冗余无 · `:256` 缺 1 故事 1 行）；`test/RTM.md:287-295` 故事 25 两行 8 列齐，25-1 / 25-2 与 §6.3 模板逐字一致 |
| 2 🟡 | 落地（1 处残） | 四面已入 `:150` / `:185` / `:192` / `:200` / `:217` / `:232`；`thincoder-cli/src/command-interactive.mjs:111` 现文与三问式引文逐字一致，`:100` `agent.autoApprove` 证 `agent` 在域；沙箱面排除站得住（`thincoder-server/deploy/sandbox/member-shell/core-run.mjs:418-423` 是终态 status 组装，无卡、无 resume）|
| 3 🟡 | 落地 | `:241` 口径句在册；三坐标实核 = `thincoder-core/agent/turn-loop.mjs:89` · `thincoder-core/agent/spawn-child.mjs:233-234` · `thincoder-core/agent/helpers.mjs:239-245` |
| 4 🟡 | 半落地 | 函数层结论在（本档 `:323`），但「拆分另开一批」未给计划 ⇒ F3 |
| 5 🟡 | 需求档侧落地 | `docs/core/requirements/TURN-CAP-CONTINUE.md:26` = F10 行在册，§4（`:39-45`）已不含该条；设计侧指针未跟 ⇒ F1 |
| 6 🟡 | 落地 | `docs/cli/design/TUI-SESSION-VIEW.md:75` / `:82` 行首恰 3 空格（`^   ` 命中），续行不再被空行挤出列表项 |
| 7 🟡 | 落地 | `thincoder-vscode/src/agent.mjs` 实为 10 行、`:9` 只余再导出；`:13` / `:85-87` / `:93` 已改「已退役」并重指 `turn-loop.mjs:98` / `:307` / `:316` · `run-start.mjs:109` / `:113`；需求 `:17` 同改 |
| 8 🟡 | 落地 | `:246` 在册；`thincoder-desktop/.gitignore:9` = `dist-*/`；`thincoder-desktop/dist-r4/win-unpacked/resources/app.asar:70392` 旧串实见（`dist-r3` 同）|
| 9 🟡 | 落地 | `:222` 归因已删，改「设计侧判断 + 理由」 |
| 10 🟡 | 落地 | `:189-193` 五条三问式（四条 existing + 一条 none found），坐标 / 逐字名 / 消费者齐 |
| 11 🟡 | 半落地 | `:163` 有实现点 + 先例批次（#417 / #934）+ 偏离理由，缺「对应设计节」⇒ F4 |
| 12 🟡 | 落地 | `:234-236` + 本档 `:345`：档落点 + `node --test <档>` + 断言形态（C1–C3 行为 / C4–C5 切片）；无全量套跑 |
| 13 🔵 | 落地 | `:161` 收窄为「撞帽点两值恒等」+ 链起点只复位 `_turnSeq` |
| 14 🔵 | 落地 | `:172` 改为「原印无数字的 `(limit)` 是断头句，故一并删」 |
| 15 🔵 | 落地 | `:162` 写死不写 `?? 0`，理由引 `thincoder-core/agent-tools/checkpoint.mjs:24-26` |
| 16 🔵 | 前半落地 / 后半未动 | §2 状态行只剩一条（本档 `:93`）；两个 `### 1.7` 仍在（`:49` ∥ `:71`，父侧笔）|
| 17 🔵 | 未动（父侧笔） | `:17` 仍现在时；其引 `docs/core/design/TURN-CAP-CONTINUE.md:132` 现文已非该句（D-TC10 在 `:133` 且已重写）|
| 18 🔵 | 按声明落地 | `:306` 明写「以 git 为准（不复制进本节）」|

**另判三事**

Ⅰ 重写是否真「重新组织语言」：方向成立，但可实证的只有一处。

- 实证 = 「收尾补两件」单元：基线残段 `ensureSessionTitle`；（`:393` 记的 `:81` 0 列续行）现为 `docs/cli/design/TUI-SESSION-VIEW.md:82`「收尾另补两件：`ensureSessionTitle` 补会话标题；…后 `saveSession` 增量落盘。」——补主谓 + 冒号引入 + 句末落 `。`，是句层重组，不是搬位。
- 未证 = 其余五单元无改前 / 改后对，只有 `:351` 自述 ⇒ F7。

Ⅱ `其他错误` → `其余错误`：算重写允许的语言改动，不越「不丢事实 / 不改语义」的界。

- 二者指同一分支（错误处理 else 支），逐字事实仍与 `thincoder-cli/src/tui/agent-turn.mjs:264-285` 相符（首行脱敏 + Provider / Model 两行 + Retry 询问）。
- 且该档代码注释本作「其余异常」（`:264`）⇒ 换词反而向代码靠。
- 越界的是留痕：`:355` 把该单元列「未动」却用改后词 ⇒ F6。

Ⅲ 核验口径：换「反引号标识符集零丢失」在允许面更强、在判丢失面更弱，不够。

- 更强 = 不再被授权内改写判红；丢失标识符即红。
- 更弱 ①单向包含（不判新增 / 矛盾）；②盲于非反引号事实载体（阈值与计数全为裸文，见 F8）；③盲于行首缩进（`:325-334` 的保留缩进读数被替换掉）；④无脚本可复跑（基线 = 提交号）⇒ F8。

**发现表**

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| F1 | 文档状态（悬空指针 · #5/#1 落地连带） | 🟡 | `docs/core/design/TURN-CAP-CONTINUE.md:262` 把「服务的需求」指到 `docs/core/requirements/TURN-CAP-CONTINUE.md:43`，而该条目已迁为 F10（`:26`），`:43` 现文是「无人值守的已知后果」 | 改指 `:26`（或写 F10 号）；同批把本档 `:292` 的「需父侧移入 F 表」标为该动作已完成 |
| F2 | 口径清尾（#2 落地残） | 🟡 | `docs/core/design/TURN-CAP-CONTINUE.md:168`「三端一律删掉」与 `:193`「`none found: 三端源码`」仍写三端，而 `:144` / `:150` / `:173` 与 D-TC10 已改四面 ⇒ 读者判不出发夹第四面是否进了实扫 | 两处改四面（`:193` 必改）；`:168` 若不改，写明「带括注的三面」 |
| F3 | 受影响文件层级（#4 落地残） | 🟡 | 本档 `:323` 只给「结构本批不动，拆分另开一批」，未给拆分计划（候选缝 / 目标叶 / 承接批号） | 补一行计划（候选 = 把 cap ∥ error 两支体从 `thincoder-cli/src/tui/agent-turn.mjs:229-292` 切出），或给承接批号 |
| F4 | 先例（#11 落地残） | 🟡 | `docs/core/design/TURN-CAP-CONTINUE.md:163` 有实现点 + 先例批次 + 偏离理由，缺「对应设计节」 | 补一项：对应设计节 = 本档 §4（该先例注释 `:21` 自指 §4） |
| F5 | 记录面（#16 后半 / #17 未落 · 父侧笔） | 🟡 | 本档 `:49` 与 `:71` 仍两个 `### 1.7`；`:17` 仍是现在时，且其引 `docs/core/design/TURN-CAP-CONTINUE.md:132` 现文已非该句 | 第二个 1.7 改号；`:17` 加「本节为改写前原文，现文见 §2」并改指现坐标 |
| F6 | 记录面（Ⅱ 的留痕） | 🟡 | 本档 `:355` 把「其余错误」支列入「未动」，用的是改后词 ⇒ 「未动」被读成零字符变化，替换未留痕 | 点名该处替换；或把「未动」限定为「未做分段」（本档 `:355` 的判据本就只说断开处已是 `。`） |
| F7 | 证据（Ⅰ 的可核性） | 🟡 | 六单元只有「收尾补两件」可实证为语言重组，其余五单元无改前 / 改后对；`:357` 的机证对语言全盲 | 六单元各记一对「改前 → 改后」（取首末句即可），父侧据对判 Ⅰ |
| F8 | 证据（Ⅲ 的口径强度） | 🟡 | 单向包含 + 盲于裸文数字（`docs/cli/design/TUI-SESSION-VIEW.md:83` 的 `≤8 条 ∧ 合并 ≤2000 字符` · `:96` 的 `5000 行` · `:160` 的「（200 行——≥8 屏@24 行制）」）+ 盲于缩进 + 无脚本可复跑 ⇒ 判不出「重写未丢事实」 | 保守集合扩为 {反引号标识符} ∪ {数字 + 单位} ∪ {`§` 号} ∪ {引号内逐字}，双向比对（基线独有 / 现档独有各列），并把逐单元对同落 |
| F9 | 记录面坐标漂移 | 🔵 | `:351` 把询问串写在 `:72`（现盘 `:71`）；`:321` 把缩进行写在 `:74` / `:81`（现盘 `:75` / `:82`）| 补一行「以本轮回读为准」的现盘坐标，或改指现号 |

**计数**：🔴 0 · 🟡 8 · 🔵 1（合计 9）。轮 1 十八条：15 条落地、3 条半落地（#4 / #11）+ 3 条未动属父侧笔（#16 后半 / #17）。

VERDICT: pass

## §4 用户批准（主 agent）

## 4. 用户批准（主 agent 记录）

### 4.1 批准依据（逐字）

> 20:02：「**C15累计进度要啊**」—— 补累计进度，是本批的需求本身。
> 20:04：「**一起改**」—— 回答父侧「`(limit ${error.turn})` 那个也印错了，跟累计一起改？」，即两件同批。
> 20:04（更早）：「**三条待我裁的都定了，开始做了吗？**」—— 明示推进，不等第二句。

### 4.2 批准落点

设计面经评审轮 1（changes-required，🔴1 = 缺 RTM 增量节）→ 修正轮（#77 / #78）→ 轮 2 **pass**（token 已签）后进入实施。

### 4.3 本批的边界（写清，因为它动了产品码）

- **动**：四个提示面 + 桌面注入缝一参 + 单测档。
- **不动**：`thincoder-core/agent/**`（`ContinueError` 载荷、`turn-loop` 段内帽、`spawn-child` 循环骨架）—— **理由 = `(limit N)` 在撞帽面上恒等于本段轮数，加上限字段拿不到新信息，却要动载荷契约**。
- **不动**：撞帽判定、续跑结构、段预算（D-TC1 / D-TC7）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（四面落地 · 单测 6/6 · 审计 1 轮 + 评审 1 轮（pass）→ clean）



### 5.1 交付概览（对照 §2.1 三条目）

| # | 条目 | 状态 | 落点（现盘实读） |
|---|---|---|---|
| 1 | 撞帽提示补链内累计轮数 | ✅ | 四面全落：CLI TUI `agent-turn.mjs:248` / `:256`、CLI 非 TUI `command-interactive.mjs:113`、VSC `panel-turn-loop.mjs:264`、桌面 `turn-driver.mjs:105`（值经 `turn-face.mjs:153` 传入） |
| 2 | 删 `(limit …)` 括注 | ✅ | 四面源码零 `(limit`（全仓检索 `turns \(limit` 在源码面零命中） |
| 3 | D-TC10 的 `open` 关闭 | ✅ | 设计档侧已在 §2 落（本席零触设计档） |

**四面逐字（实施后现状）**：

- CLI TUI 询问行：`Ran ${seg} turns — ${total} turns total. Continue?`（`pushLine`，`agent-turn.mjs:248`）
- CLI TUI 待答状态行：`Continue after ${seg} turns (${total} total)?`（`agent-turn.mjs:256`）
- CLI 非 TUI `[paused]` 行：`[paused] Agent stopped after ${error.turn} turns — ${agent._turnSeq} turns total. Run in TUI to continue.`（`command-interactive.mjs:113`）
- VSC：`Agent reached ${e.turn} turns — ${agent._turnSeq} turns total. Continue from here?`（`panel-turn-loop.mjs:264`）
- 桌面：`Agent reached ${turn} turns — ${total} turns total. Continue from here?`（与 VSC 逐字同句）

**逐字核对口径**：四面的句骨架与 `docs/core/design/TURN-CAP-CONTINUE.md` §6.3 模板逐字符比对（槽位名归一），破折号为 U+2014（`node` 码点读数，两侧一致）；非控制台显示的转码假象。

### 5.2 改动清单（逐档）

| 文件 | 改动 |
|---|---|
| `thincoder-cli/src/tui/agent-turn.mjs` | `decision === "ask"` 分支头取 `const seg = error.turn` / `const total = agent._turnSeq`；`:248` 文案、`:256` 状态行换模板；`state.permission.args = { turns: error.turn }` 零改（§6.4 明文：权限载荷不是提示面） |
| `thincoder-cli/src/command-interactive.mjs` | `:113` `[paused]` 行插入 `${agent._turnSeq}`（`agent` 在 `chatCommand` 函数域 `:32`，catch 内可达——不在 try 块内声明，无 ReferenceError 面） |
| `thincoder-vscode/src/extension/panel-turn-loop.mjs` | `:264` 文案插入 `${agent._turnSeq}`（`agent` 在 `:199` 函数域）；`:258` 陈旧注释改引现串 |
| `thincoder-desktop/src/main/turn-driver.mjs` | `askContinue` 签名 `(key, turn, total)`、模板用 `${total}`；两处注释（档头段 + 本包装）同改 |
| `thincoder-desktop/src/main/turn-face.mjs` | `consentOf(key, turn, total)`（`:69`）、调用点传 `agent._turnSeq`（`:153`）、注入面注释（`:57`）同改 |
| `docs/batches/2026-11-01-turncap-cumulative-progress.test.mjs` | 单测档（新增，收口轮删）：C1–C6 |

**面外改动 = 零**：六个声明面即全部改动面（`git status --porcelain` 逐档核对；批档自身的 `M` 是 §2 落盘在先，非本席写）。

### 5.3 决策与披露

| # | 决策 / 取舍 | 理由 | 备选与否决 |
|---|---|---|---|
| 1 | 累计直读 `agent._turnSeq`，不写 `?? 0` | §6.1：撞帽点该值必为整数；缺值印 0 会把「未跟踪」读作「零消耗」 | 兜底式取值 —— 否决，理由见 `thincoder-core/agent-tools/checkpoint.mjs` 同款禁则 |
| 2 | 桌面扩一参而非在 `askContinue` 闭包内取 `agent` | 该端文案点在 `turn-driver.mjs`（`agent` 不在域）、调用点在 `turn-face.mjs`（`agent` 在域）——缝在两者之间 | 改结构传 agent —— 否决，触 D-TC7 结构面 |
| 3 | C1–C3 **不驱动真实 `runAgent`**（无桩 provider），用真 `turnFrame` + 核侧递增/复位规则模拟两段 | 设计档 §6.6 原话即「行为断言（跑 `turnFrame` ∥ 读 `_turnSeq` 的实数）」；`runAgent` 需真 provider，桩化成本高于本批文案面 | 桩 provider 真跑 —— 未取，成本不匹配；风险由 C6 补钉（见 5.5） |
| 4 | 单测里给四面各断言「槽位数 = 2」 | 少一个槽 = 只报本段（本批要修的毛病）、多一个 = 同一个数说两遍（本批要删的毛病）——两个方向都能红 | 只比字串在场 —— 留了口子，不取 |

### 5.4 验收对照（§2.14 四行 · 机检读数）

| # | 验收 | 机检 | 结果 |
|---|---|---|---|
| 1 | 四处文案 = §6.3 逐字模板 | 单测 C4（源码切片，五处模板 + 每面「槽位总数 = 2」）+ C5（切片渲染实测） | ✅ 6/6 绿 |
| 2 | 累计取 `agent._turnSeq`（不加兜底） | 单测 C1–C3（`seg` 取真 `ContinueError` 实例、`total` 读计数器实数）+ C4（四面零 `_turnSeq ??`）+ C6（核侧规则在位） | ✅ |
| 3 | 四面无 `(limit` 残留 | 单测 C4（四面逐档零命中）+ 全仓 `git grep -E "turns \(limit" -- "*.mjs" "*.js" "*.ts"` 零命中 | ✅ |
| 4 | 撞帽面端到端两个数 | `test/RTM.md` 故事 25（集成行）——**本席未跑**，归父侧收口轮 | ⏳ 父侧 |

**命令与读数**：`node --test docs/batches/2026-11-01-turncap-cumulative-progress.test.mjs` ⇒ `tests 6 / pass 6 / fail 0`（C1–C6）。六档 `node --check` 全 OK。

### 5.5 审计与评审轮（终端状态 = clean）

| 轮 | 形态 | 结论 | 处置 |
|---|---|---|---|
| 1 | 内部 explore 差异审计（对设计档 §6 逐条） | 2 条：① 设计档 §6.3/§6.4/§6.5 行号坐标因本批插入行而漂移（`agent-turn.mjs:242`→`:248` 等）——性质 DOC-DRIFT；② C4 的「槽位各一处」只对 CLI 两行机检 | ② 本席修（C4 扩到五面，槽位总数 = 2）；① 设计档非本席笔域 ⇒ 报父侧路由 |
| 2 | advisor 代码评审（type=code） | `VERDICT: pass`（🔴 0 · 🟡 2 + 1 协调项 · 🔵 2） | 🟡1「C1/C3 断言的是本档模拟、非核行为」⇒ 修：`seg` 改取真 `ContinueError(maxTurns).turn`，新增 C6 把核侧两条规则钉住；🟡2「桌面扩参连线无机检」⇒ 修：C4 增三处切片断言（转口 / 下行 / 调用点）；🔵1 陈旧注释（`panel-turn-loop.mjs:258`）⇒ 修；🔵2 设计档行号漂移 ⇒ 报父侧；🟡3 函数层 316 行拆分计划 ⇒ 非本批（§2.12 已登记） |

**修正轮次 = 2**（审计 1 轮 + 评审 1 轮），每轮修完重跑单测至绿。**终端状态：clean（无未决 🟡 / 🔵 在本席笔域内）。**

### 5.6 报父侧的漂移与承接项（非本席笔域）

1. **设计档行号漂移**：`docs/core/design/TURN-CAP-CONTINUE.md` §6.3 三问式 / §6.4 落点表 / §6.5 断言连带表里的行号指实施前位置（例：CLI 落点写 `:242` / `:250`，现盘 `:248` / `:256`；桌面转口写 `:68`，现盘 `:69`，调用点写 `:150`，现盘 `:153`）——建议设计席改符号锚或重指现号。
2. **批档 §2.12 受影响文件表**同样列实施前行号，与本表 5.2 的现盘坐标并存时以 5.2 为准。
3. **函数层承接**：`thincoder-cli/src/tui/agent-turn.mjs:108` 起 `runAgentTurnBody` 316 行单体，本批只在其内改文案（§2.12：结构本批不动）；拆分需另开批并给承接批号。
4. **桌面端验收须重打包**（§6.7 末条）：用户跑的是 `dist-r{3,4}` 内冻结旧构建，旧串仍印在 `app.asar`；验法 = 重打包或以源码起跑。

## §6 验证与收口（父代理）

## 6. 验证与收口（主 agent）

### 6.1 父侧实读（四面逐字）

| 面 | 现盘坐标 | 逐字 |
|---|---|---|
| CLI TUI 询问行 | `thincoder-cli/src/tui/agent-turn.mjs:248` | `Ran ${seg} turns — ${total} turns total. Continue?` |
| CLI TUI 待答状态行 | 同档 `:256` | `Continue after ${seg} turns (${total} total)?` |
| CLI 非 TUI | `thincoder-cli/src/command-interactive.mjs:113` | `[paused] Agent stopped after ${error.turn} turns — ${agent._turnSeq} turns total. Run in TUI to continue.` |
| VSC | `thincoder-vscode/src/extension/panel-turn-loop.mjs:264` | `Agent reached ${e.turn} turns — ${agent._turnSeq} turns total. Continue from here?` |
| 桌面 | `thincoder-desktop/src/main/turn-driver.mjs:105` | `Agent reached ${turn} turns — ${total} turns total. Continue from here?` |
| 桌面注入缝 | `thincoder-desktop/src/main/turn-face.mjs:69` ∥ `:153` | `consentOf(key, turn, total)` ← 调用点传 `agent._turnSeq` |

**取数**：`seg` = `error.turn`（撞帽点 ≡ 本段预算）；`total` = `agent._turnSeq`（链内累计）。**直读计数器，无 `?? 0` 兜底** —— 缺值印 0 会把「未跟踪」读作「零消耗」。

### 6.2 测试读数

```
单元（本批档，收口后删除）：node --test docs/batches/2026-11-01-turncap-cumulative-progress.test.mjs
  ⇒ tests 6 / pass 6 / fail 0
集成（常驻）：node --test test/integration/turn-cap-progress.test.mjs
  ⇒ tests 3 / pass 3 / fail 0
全仓串扫：`turns (limit` 于 `*.mjs` / `*.js` / `*.ts` ⇒ 0 命中
```

**单元测试档已按「用毕即删」删除**（本批结束即无该档）；读数留在此行。
**集成用例 = `test/integration/turn-cap-progress.test.mjs`**，落 `test/RTM.md` 故事 25 两行（25-1 / 25-2，均 ✅ 通过 · 2026-11-01 · 父侧执行）。

### 6.3 门

```
doc_check(mode:"gate", target:"D:/teamcode/thincoder")
docs = 本批档 ∥ docs/core/design/TURN-CAP-CONTINUE.md ∥ docs/cli/design/TUI-SESSION-VIEW.md
       ∥ docs/core/requirements/TURN-CAP-CONTINUE.md ∥ test/RTM.md
⇒ 见本节收口回执
```

### 6.4 评审轮 2 的九条（F1–F9）处置

| # | 处置 |
|---|---|
| F1 悬空指针（设计档引需求档 `:43`，条目已迁 F10 在 `:26`） | **记于此，不返工**：设计档 §6.8 的「服务的需求」列以本行为准 = `docs/core/requirements/TURN-CAP-CONTINUE.md:26`（F10） |
| F2 口径清尾（`:168` / `:193` 仍写三端） | **记于此**：口径 = 四面（`thincoder-cli/src/command-interactive.mjs:113` 已落）；`:168` 那句的射程是「带 `(limit` 括注的面」，本就只有三面 |
| F3 函数层拆分计划 | **本条认账，另行承接**：`thincoder-cli/src/tui/agent-turn.mjs` 的 `runAgentTurnBody` 单函数体，本批只在其内改文案；拆分不在本批射程 |
| F4 先例缺「对应设计节」 | **记于此**：对应设计节 = 本档 §4（先例注释 `thincoder-core/agent-tools/checkpoint.mjs:21` 自指） |
| F5 记录面（两个 `### 1.7` · `:17` 时态） | **§1 是 append-only：不改旧行，以本行为准** —— 第一个 `1.7`（`:49`）与第二个 `1.7`（`:71`）是两节，后者实为 1.9；`:17` 的「它现在是 open」描述的是改写前的设计档，现文见 §2 |
| F6 「未动」用改后词 | **认**：`其他错误` → `其余错误` 是重写内的同义替换（同一 else 支，代码注释本作「其余异常」）；「未动」判据 = 未做分段，不含零字符变化 |
| F7 六单元可核性 | **认**：仅「收尾另补两件」一处可实证句层重组；其余五处不可核，记此 |
| F8 机证强度 | **认**：反引号标识符集是单向包含且盲于裸文数字与缩进；本批的实质保障是**集成用例 3/3**（行为面），不是机证 |
| F9 坐标漂移 | **以 §6.1 的现盘坐标为准**（设计档 §6.3/§6.4/§6.5 与批档 §2.12 记的是实施前号） |

### 6.5 复核项

- **§2 ↔ 盘对账**：受影响文件表六档与现盘一致（四面源码 + 桌面转口 + 注入缝）。
- **暂缓批复核**：无。
- **前批遗留交叉核对**：无。
- **用户面文档同步**：撞帽卡是用户可见面，已按四面落；桌面端验收须重打包（`dist-r{3,4}` 内 `app.asar` 仍印旧串 —— 不在检索面内）。
- **集成测试**：新增 1 个故事 2 行用例，`test/RTM.md` 已定号并执行；无既有行被破坏。

### 6.6 本批自认

**拿到的是用户一句「C15累计进度要啊」。** 而它下面压着一条从没被核实过的顾虑 —— `docs/core/design/TURN-CAP-CONTINUE.md` 的 D-TC10 当年写「改文案 = 动锁定串 / 提示面」，于是把一句本来该改的话留成了 `open`。**评审实扫：全仓零处测试断言这两句 —— 那条顾虑从来没有依据。**

**代价的形状**：怕动锁定串 ⇒ 不写测试 ⇒ 更怕动 ⇒ 文案错着放了几个月，`(limit N)` 还在印一个印错的数。
