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
| `docs/cli/design/TUI-SESSION-VIEW.md` | 形态重整（长段落拆列表项 · 裸档名补全为仓根路径）；旧询问串**未改** | 文档面（本批已落，见 2.7） |
| `docs/core/requirements/TURN-CAP-CONTINUE.md` | `:43` 与本裁定冲突 | 需求面 —— **主 agent 落** |

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

- **[上抛·待裁]** 需求档 `docs/core/requirements/TURN-CAP-CONTINUE.md:43`（「不改继续提示文案」）与本批用户裁定直接冲突，且需求档没有「撞帽提示」条目 —— 需主 agent 改写该行并补条目；设计侧不改需求档。
- **[上抛·待裁]** `docs/cli/design/TUI-SESSION-VIEW.md:70` 仍引用旧询问串 `Continue after N turns?`，须在本批文案落地时同改。本批只做了该档的**形态重整**（长段落拆列表项 · 裸档名补全为仓根路径），原因：该档一旦被本笔触达就进 append 的整档机检范围，原形态过不了段落长度门 ⇒ 挡死 §2 落盘；文字逐字未动。
- **[上抛·知会]** 锁定串实扫结论：全仓测试档无一处断言这两句（检索串 `turns \(limit` / `Continue from here` / `Ran \d` / `Continue after`），要改的只有三端源码 + 本档 + 需求档；归档档（`_archive`）不追改。

## §3 设计评审（评审子代理）
## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
