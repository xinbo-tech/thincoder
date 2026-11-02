# 2026-11-02 · safeslice-single-source
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-11-02 · 来源 = 用户 2026-11-02 01:32「你拿1975-77这三项试试新代码呗」—— 取台账 #1976（`safeSliceUTF16` 三份复本合并单源）；复启条件已成立（#1973 刚创建 `thincoder-core/agent/offload.mjs`，即触碰三档之一）。
> 台账 = #1976（TOOLS · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-11-02
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

## 1. 讨论（主 agent）

- **已定决定**：本批只做一件事——`safeSliceUTF16` 三份复本合并为单源。 · 用户原话：「**你拿1975-77这三项试试新代码呗**」 · 时间：2026-11-02 01:32

### 事实（父侧本轮实读）

`thincoder-core/agent/offload.mjs` 与 `thincoder-core/agent/helpers.mjs`：**407 ∥ 98 行**（`split("\n").length - 1` 口径，另以换行字节计数独立复核 = 407）；十件全在新档、具名转口在册。

**同一函数的三个副本**：

| # | 位置 | 形态 |
|---|---|---|
| 1 | `thincoder-core/agent/offload.mjs` | 随族搬入的私有副本（唯一调用方 = `buildDualEndPreview`） |
| 2 | `thincoder-core/text-budget.mjs` | **导出**（`memory/*` 在消费） |
| 3 | `thincoder-core/agent/setup.mjs` | 私有复本 |

### 为什么现在做

台账原记 `trigger=条件`，复启条件 =「触碰上述三档之一时同笔判定单源并合并」。**#1973 刚刚创建了第 1 份所在的档并写入该函数 —— 条件已成立。**

### 设计席要先判的四件

1. **三份是不是真同义** —— 逐字节比对，不看名字。已知一处旁证：搬入副本的头注写「与 setup.mjs 同语义（**两处**独立实现）」，而实际是**三份**（见台账 #1975 同族记录）——**注释本身可能已经在骗人，不能拿它当依据**。
2. **单源住哪** —— `thincoder-core/text-budget.mjs` 已是导出形态且有 `memory/*` 消费面；但 offload 族刚拆出去，反向依赖要考虑（谁 import 谁不成环）。
3. **谁改谁不改** —— 消费面零改是硬约束：`memory/*` 与 `offload.mjs` 都不该被迫改调用形。
4. **行为等价怎么证** —— `safeSliceUTF16` 处理 UTF-16 代理对边界，边界值必须有用例：奇偶长度 × 代理对位于切口两侧 × 空串 × 单字符。

### 边界

- **只做合并**，不改 `safeSliceUTF16` 的行为（语义零变）；
- **不动 `thincoder-core/agent/` 以外的调用方**；
- **发现别的问题报上来，不代改**。

### 1.1 父侧自纠（2026-11-02 01:44）

**上文「`thincoder-core/agent/offload.mjs` 与 `thincoder-core/agent/helpers.mjs`：**407 ∥ 98 行**」两个数挂反了，且 98 也是错的。**

**实量（`split("\n").length - 1` 口径，另以换行字节计数独立复核）**：

| 档 | 行数 |
|---|---|
| `thincoder-core/agent/helpers.mjs` | **407** |
| `thincoder-core/agent/offload.mjs` | **99** |

**成因**：那句话是 `#1973` 收口时的读数（当时 offload = 98），我在写本批 §1 时**照抄了旧读数并把两个档名写反**。**⇒ 一处是转抄、一处是顺序，两个错误叠在同一句里。**

**处置**：按判据「体量读数不进设计档」，**本批设计轮已改为「四档均低于 500 行审视线 ⇒ 无档越线」的结论句，行数不进设计档** —— 本节这两个数只作讨论留痕，**任何验收不得引用它们**。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

**读法**：本段 = 本批设计与理由（一次性）。现态陈述落在 `docs/core/design/TOOL-OUTPUT-LIMITS.md` §2 / §6.1（本席已改到合并后形态）。

## 1. 本批条目（覆盖）

| # | 条目 | 来源 | 本批结果 |
|---|---|---|---|
| 1 | `safeSliceUTF16` 三份复本合并为单源，消费面零改 | 台账 #1976（TOOLS · 归批）· §1 已定决定 | 单源 = `thincoder-core/text-budget.mjs`；两处私有复本删除并改 import |

**不在本批**：

- 端壳镜像不动（`thincoder-vscode/src/agent/run-helpers.mjs` 的 `safeSliceUTF16` / `safeSliceUTF16Tail` 属双端镜像另一档）。
- 尾切片不合并：`safeSliceUTF16End` 与 `safeSliceUTF16Tail` 语义不同（§10 发现 2），报不改。
- 调用点零改写：`thincoder-core/memory/*` 三档 · `thincoder-core/agent/dispatch-run.mjs` · `thincoder-core/agent/helpers.mjs` 全零改。
- 不动上限常量、不动 preview 形态、不动 `thincoder-core/escape.mjs`。

## 2. 受影响文件与分层结论

| 文件 | 动作 | 内容 |
|---|---|---|
| `thincoder-core/agent/offload.mjs` | 删私有件 + 加 import | 删 10 行（注释 4 + 函数体 6）；import 块内加 1 行 |
| `thincoder-core/agent/setup.mjs` | 删私有件 + 加 import | 删 11 行（注释 3 + 函数体 8）；import 块内加 1 行 |
| `thincoder-core/text-budget.mjs` | 仅头注 | 补「核内唯一定义 + agent 两面经 import 复用 + 入参归一」；函数体一字不改 |
| `docs/core/design/TOOL-OUTPUT-LIMITS.md` | 设计档（本席已改） | §2 双端切片两条 → 单源表述；§6.1 表三行；§3 落盘档的 offload 行号改符号锚 |
| `docs/batches/2026-11-02-safeslice-single-source.test.mjs` | 单测档（coder 建，收口删） | 等价 harness + 边界表 + 新契约用例 |

**分层结论**：无跨档——三档同为 `thincoder-core/` 产物码，导出面无变化（`thincoder-core/agent/helpers.mjs` 的转口三件不含本函数），无端壳 / 构建 / 对外契约改动。

## 3. 三份逐字节比对：判据分支，不采注释

| 份 | 位置 | 形态 | 判据分支 |
|---|---|---|---|
| A | `thincoder-core/text-budget.mjs` | `export` | 入参归一 → 长度门 → `charCodeAt(max-1)` 落高代理（D800–DBFF）则前收一码元 |
| B | `thincoder-core/agent/offload.mjs` | 私有（唯一调用方 `buildDualEndPreview`） | 同 A，**无归一**（直接 `text.length` / `text.charCodeAt`） |
| C | `thincoder-core/agent/setup.mjs` | 私有（调用点 = doc 片预览） | 同 B，多一个 `const end = max` 别名 |

**结论**：字符串入参下三份**逐句同义**（同一判据、同一分支、同一返回值）；唯一真差异 = A 首行的入参归一。

核内定义恰 3 处（grep 工具：pattern `function safeSliceUTF16` · path `thincoder-core` · glob `*.mjs` ⇒ 3 行：`offload.mjs:17` ∥ `setup.mjs:32` ∥ `text-budget.mjs:55`）。

**为什么不采 offload 那行头注**：它写「与 setup.mjs 同语义（**两处**独立实现）」，实际三处——注释已在骗人，判据只取代码。

## 4. 单源落点与依赖方向（父侧交回次序第 1 项）

| 候选 | 住这 / 不住这 | 依据 |
|---|---|---|
| `thincoder-core/text-budget.mjs` | **住这** | 唯一导出形态，且已有活消费面（`memory/core.mjs:19` ∥ `memory/code-search.mjs:14` ∥ `memory/docs.mjs:18`）——它才是已对外承诺的契约 |
| `thincoder-core/agent/offload.mjs` | 不住 | 私有不导出；`memory/*` 反向引它 = 子系统反向依赖（`docs/core/design/MEMORY.md` D-MEM16 已否决同形）；且非叶档（import `../config.mjs` ∥ `node:fs/promises` ∥ `node:path`） |
| `thincoder-core/agent/setup.mjs` | 不住 | 私有；import 面十余档（`../memory.mjs` ∥ `../context.mjs` ∥ `../tools/index.mjs` ∥ `../skills.mjs` ∥ `../rules.mjs` ∥ `../prompt-overlays.mjs` ∥ `./helpers.mjs` ∥ `./setup-reminders.mjs` ∥ `./family-tools.mjs` ∥ `../memory/*` ∥ `../config.mjs`）⇒ 消费方被拖入整条装配图；且它已 import `../memory.mjs`，`memory/*` 反向 import 它成**真环** |
| 新档 | 不住 | 与既有已声明单一来源同函数双份（D2） |

**成环判定结论（判完）**：`thincoder-core/text-budget.mjs` **零 import**——本席全档实读 79 行，无任何 `import` 语句，头注自述「本模块零 import（可被任意层直接引用）」。

⇒ `agent/offload.mjs` 与 `agent/setup.mjs` 各加一条 `import { safeSliceUTF16 } from "../text-budget.mjs"` **不成环**，也不会把 `../memory.mjs` 或 `config.mjs` 拖进消费方。同目录已有先例：`thincoder-core/agent/spawn-child.mjs:22` 已从 `../text-budget.mjs` import `appendCappedText`。

## 5. 单源契约（一句话，写清防第四份复本）

`safeSliceUTF16(text, max)` = **入参先归一**（`String(text ?? "")`）后按 **UTF-16 码元**切头：长度 ≤ `max` 原样返回；截点落高代理（U+D800–DBFF）时前收一码元，代理对整对丢弃，绝不产出孤立高代理。

**契约面 delta（父侧 2026-11-02 裁定，明写不许含糊）**：

- **字符串入参**：零变（`slice` 语义逐字相同）。
- **非字符串入参**：由「抛 TypeError」改为「归一后切片」——**契约面扩张**，不是等价。
- **为什么取归一形**：三份里只有 A 是导出形态、有活的消费面，它才是被外部实际调用的契约；合并方向 = 其余两份向已承诺的形态靠，反向（保严格）会让 `memory/*` 新增抛错 = 把已有调用方推向更差。

## 6. 改法规格（逐档，含待删原文）

**`thincoder-core/agent/offload.mjs`**——删这 10 行，并在第 6 行后（import 块内）加一行 import：

```js
/** UTF-16 安全截断（2026-09-02 deepseek 400 根因）：slice(0, N) 按码元切会把 emoji 代理对切成孤立
 *  高代理（如 🔴=U+D83D+DD34 只剩 D83D）——deepseek 解析器严格 UTF-16 报 400
 *  "unexpected end of hex escape"。截断点落在高代理上时向前收一个码元。
 *  与 setup.mjs 的 safeSliceUTF16 同语义（两处独立实现——escape.mjs 的 sanitizeLoneSurrogates 是发送兜底，此处是源头）。 */
function safeSliceUTF16(text, max) {
  if (text.length <= max) return text
  const cp = text.charCodeAt(max - 1)
  if (cp >= 0xd800 && cp <= 0xdbff) return text.slice(0, max - 1)
  return text.slice(0, max)
}
```

待加的一行：`import { safeSliceUTF16 } from "../text-budget.mjs"`。`safeSliceUTF16End`（尾切片）与其余件原样不动；其注释「Same rule as safeSliceUTF16, mirrored」合并后依然成立。

**`thincoder-core/agent/setup.mjs`**——删这 11 行，并在 import 块内加同一行 import：

```js
/** UTF-16 安全截断（2026-09-02 deepseek 400 根因）：slice(0, N) 按码元切会把 emoji 代理对切成孤立
 *  高代理（如 🔴=U+D83D+DD34 只剩 D83D）——deepseek 解析器严格 UTF-16 报 400
 *  "unexpected end of hex escape"。截断点落在高代理上时向前收一个码元。 */
function safeSliceUTF16(text, max) {
  if (text.length <= max) return text
  const end = max
  // 截断点恰在高代理（D800-DBFF）上 → 收到高代理之前（不带它）
  const cp = text.charCodeAt(end - 1)
  if (cp >= 0xd800 && cp <= 0xdbff) return text.slice(0, end - 1)
  return text.slice(0, end)
}
```

调用点 `safeSliceUTF16(d.content, DOC_CHUNK_PREVIEW_LEN)` 一字不改。

**`thincoder-core/text-budget.mjs`**——只改 `safeSliceUTF16` 的头注（函数体零改），补三句：核内唯一定义 · `agent/offload.mjs`（双端 preview 头切片）与 `agent/setup.mjs`（doc_search 预览）经 import 复用 · 入参先归一。原文「VSC 与 CLI 两处独立实现的安全规则一致」保留（端壳镜像仍在，此句仍真）。

## 7. 边界与等价用例（父侧交回次序第 2 项）

**等价的机器证法**：单测档内**逐字内嵌两份旧体**（B / C），对 corpus 逐例断言 `新 === B === C`。

corpus = 字母表 `["a", "🔴", "\uD83D", "\uDD34"]` 上长度 0–3 的全组合（1+4+16+64 = 85 串）× `max` ∈ 0–`len+1`。旧体随单测档在收口删除，不留永久副本。**这条只覆盖字符串入参**——非字符串按 §5 属新契约，用例 16–20 另证。

| # | 类 | 入参 text | max | 期望输出 |
|---|---|---|---|---|
| 1 | 空串 | `""` | 0 | `""` |
| 2 | 空串 | `""` | 5 | `""` |
| 3 | 单字符恰等于上限 | `"a"` | 1 | `"a"` |
| 4 | 单字符 | `"a"` | 0 | `""` |
| 5 | 恰等于上限 | `"abcdef"` | 6 | `"abcdef"` |
| 6 | 上限 +1 | `"abcdefg"` | 6 | `"abcdef"` |
| 7 | 代理对在切口左 | `"🔴abc"` | 1 | `""`（切点即高代理，整对丢） |
| 8 | 代理对跨切口 | `"a🔴bc"` | 2 | `"a"`（整对丢） |
| 9 | 代理对全内 | `"a🔴bc"` | 3 | `"a🔴"` |
| 10 | 纯代理对串 | `"🔴"` | 2 | `"🔴"`（整对保留） |
| 11 | 双代理对、切口在第二对 | `"🔴🔴"` | 3 | `"🔴"` |
| 12 | ASCII 对照 | `"hello world"` | 5 | `"hello"`（证明无越界误伤） |
| 13 | 负上限 | `"abc"` | -1 | `"ab"`（`charCodeAt(-2)` = NaN ⇒ `slice(0,-1)`，三份一致） |
| 14 | 切点前是孤立高代理 | `"a\uD83Db"` | 2 | `"a"`（规则不辨孤立 ∥ 成对，一律前收） |
| 15 | 整串即孤立代理 | `"\uD83D"` | 1 | `"\uD83D"`（不做切，规则只在切点动作） |

| # | 类 | 入参 | 期望（新契约：不抛） |
|---|---|---|---|
| 16 | null | `null`, max 5 | `""` |
| 17 | undefined | `undefined`, max 5 | `""` |
| 18 | 数字 | `12345`, max 3 | `"123"` |
| 19 | 对象 | `{}`, max 5 | `"[object Object]"` |
| 20 | 数组 | `[1,2,3]`, max 5 | `"1,2,3"` |

**端到端一条**（不证等价，证合并后链路仍安全）：`offloadToolResult` 喂 > 64K 正文、emoji 恰落脚于头切口 ⇒ 返回串过孤立代理正则 0 命中。

## 8. 验收对照（每行机判，逐条回指 §1 条目 1）

| # | 判据 | 判法（读数） |
|---|---|---|
| AC1 | 核内单源唯一 | grep 工具 pattern `function safeSliceUTF16` · path `thincoder-core` · glob `*.mjs` ⇒ **恰 1 行**（`thincoder-core/text-budget.mjs`） |
| AC2 | agent 面零复本 | 同 pattern · path `thincoder-core/agent` ⇒ **0 行** |
| AC3 | 字符串入参等价 | `node --test docs/batches/2026-11-02-safeslice-single-source.test.mjs` 全绿；corpus 用例对新 ∥ B ∥ C 逐例全等 |
| AC4 | 新契约钉住 | 同次运行用例 16–20：不抛，且值如 §7 表 |
| AC5 | 消费面零改 | `git diff --name-only` 不含 `thincoder-core/memory/` ∥ `agent/dispatch-run.mjs` ∥ `agent/helpers.mjs` ∥ `agent-tools/` |
| AC6 | 端到端代理对安全 | 同次运行末端到端用例：孤立代理正则 0 命中 |
| AC7 | 设计档同步 | grep 工具 pattern `本地面\|本档私有实现` · path `docs/core/design/TOOL-OUTPUT-LIMITS.md` ⇒ **0 行** |
| AC8 | 文档门 | 本段落笔即跑 `doc_check(mode:"gate")`，首行 `DOC-CHECK GATE: PASS` |

## 9. 关键决策

| # | 决策 | 理由（含否决面） |
|---|---|---|
| D1 | 单源落 `thincoder-core/text-budget.mjs` | 唯一导出 + 活消费面 + 零 import 叶档 + 同目录先例 `thincoder-core/agent/spawn-child.mjs:22`；`docs/core/design/MEMORY.md` D-MEM16 早已把它声明为核级单一来源，本批只是落实 |
| D2 | 采用归一形态 `String(text ?? "")` | 唯一在用契约；反向收窄会给 `memory/*` 新增抛错。delta 明写于 §5，用例 16–20 钉住 |
| D3 | 否 `offload.mjs` 为源 | 私有 + 反向依赖 + 非叶档 |
| D4 | 否 `setup.mjs` 为源 | 私有 + 装配图十余档 + 与 `memory/*` 成真环 |
| D5 | 否新档 | 同函数双份（D2 违规） |
| D6 | 设计档里 offload 的 `:行号` 改符号锚 | 删 10 行 ⇒ 该档 22 行以下坐标整体 -9；符号锚不随移位漂（先例 = `docs/batches/2026-11-01-helpers-offload-split.md` 的 D5 同法）。代价 = 少一个行号直跳；收益 = 不再产生错坐标 |

## 10. 发现与上抛

1. **[已裁]** 非字符串真差异 —— 父侧 2026-11-02 裁定采用归一形，已写进 §5 / D2 / 用例 16–20。
2. **[知会]** 设计档旧文称 offload 内「两个同义函数」与 text-budget 对位：头切片真同义，**尾切片不同义**——`safeSliceUTF16Tail`（`thincoder-core/text-budget.mjs`）多一条「原文末位孤立高代理去除」，`safeSliceUTF16End`（`thincoder-core/agent/offload.mjs`）无此条。本席已在该档改成准（分两条陈述）；不合并，另批。
3. **[知会]** `docs/core/design/MEMORY.md` D-MEM16 记的消费坐标与现盘不符：该档记 `memory/core.mjs:15` ∥ `code-sync.mjs:15` ∥ `docs.mjs:17`；现盘 import `safeSliceUTF16` 的三档 = `thincoder-core/memory/core.mjs:19` ∥ `thincoder-core/memory/code-search.mjs:14` ∥ `thincoder-core/memory/docs.mjs:18`（grep 读数）。该档不在本批写域 ⇒ 报不改，请父侧入账。
4. **[知会] 清单外改动**：`docs/core/design/TOOL-OUTPUT-LIMITS.md` 不在父侧给的三档写域内，本席已改——理由 = 本合并使该档两处陈述当天变假（D2 单源 / D7 结算同步），留假陈述即为缺陷。

### 2.1 评审落点（§3 轮次 1 · 13 条逐条处置）

**权威性声明**：凡本节重出的判据（§8 验收表整表）、用例表（§7 的 18–20 行）、受影响档（§2 表）、坐标（§9 D6 的位移账），一律以本节为准；前文对应行因批档 append-only 而无法删，读时以本节为唯一现态。

#### #1 🔴 判据前缀匹配 + glob 不递归 → 成对读数

病根两处，都要修：① `function safeSliceUTF16` 是前缀匹配，把 `safeSliceUTF16End` ／ `safeSliceUTF16Tail` 一并收进来；② glob 写 `*.mjs` 不递归，只扫 `thincoder-core/` 顶层。

本轮实测（grep 工具，改前基线）：

| 读法 | 读数 |
|---|---|
| pattern `function safeSliceUTF16` · path `thincoder-core` · glob `*.mjs` | 2 行（`text-budget.mjs` 的 `safeSliceUTF16` 与 `safeSliceUTF16Tail`）——顶层限定，故漏 `agent/` |
| 同 pattern · path `thincoder-core/agent` · glob `*.mjs` | 3 行（`offload.mjs` 两份 + `setup.mjs` 一份） |
| pattern `function safeSliceUTF16\(`（左括号转义）· path `thincoder-core/agent` · glob `*.mjs` | 2 行（`offload.mjs:17` · `setup.mjs:32`） |
| pattern `function safeSliceUTF16\(` · path `thincoder-core` · glob `**/*.mjs` | **3 行**（`offload.mjs:17` · `setup.mjs:32` · `text-budget.mjs:55`） |
| pattern `safeSliceUTF16 \} from "\.\./text-budget\.mjs"` · path `thincoder-core` · glob `**/*.mjs` | **3 行**（`memory/core.mjs:19` · `memory/code-search.mjs:14` · `memory/docs.mjs:18`） |

⇒ 判据改为成对：**定义行 3 → 1 ∧ import 行 3 → 5**，同一 `**/*.mjs` 递归口径。原 §3「核内定义恰 3 处」的读数按上表第 4 行重出（带 `*.mjs` = 2、带 `**/*.mjs` = 3），其「3」的来源写明为递归口径。

#### #2 🔴 集成测试设计（起自 `test/RTM.md` 读数）

本轮实读 `test/RTM.md`：CLI 端 27 个业务故事节 + VS Code ∥ Desktop 两段。本改动对位 = CLI 故事 1「对话里用工具，结果必须回到模型」，三行 `1-1` ∥ `1-2` ∥ `1-3`，判据都含「没有 400」，证据 = `test/integration/anthropic-tool-roundtrip.test.mjs`。

delta 三问：

- **打断哪几行**：无。三行断的是「工具结果回到模型且无 400」；字符串入参逐例等价（§7 corpus，新 === B === C）⇒ 该路径字节不变。
- **冗余**：无。
- **缺行**：无。理由 = 唯一那条合法理由（不改变既有用例所断言的业务可观察结果，也不新增产品真需要的场景），其据三条：
  ① 字符串面等价已由 corpus 机器证明（§7）。
  ② **工具结果族走不到切片**：`thincoder-core/agent/offload.mjs:82`–`:83` 实读 `const overLimit = text.length > TOOL_RESULT_OFFLOAD_LIMIT` / `if (!force && !overLimit) return text`——非字符串在此原样返回，不进 `buildDualEndPreview`。
  ③ 故两处工具侧调用点没有非字符串入口，业务可观察面无人变。

**残留一格（诚实标注）**：doc 预览调用点 `safeSliceUTF16(d.content, DOC_CHUNK_PREVIEW_LEN)` 的 `d.content` 形状本轮未实读；若它为 null，改前抛 TypeError、改后返回 `""`。这一格已由父侧 2026-11-02 裁定（§5 ∥ D2 取归一形），不属新增业务场景，**不立 RTM 行**。

#### #3 🟡 AC7 空转 → 成对读数

- (a) pattern `头切片 = 核内单一来源` · path `docs/core/design/TOOL-OUTPUT-LIMITS.md` ⇒ **1 行**（本轮实测，L30）
- (b) pattern `本档私有实现` · 同档 ⇒ **0 行**（本轮实测）

两条已达标；判据换成这成对形。（原 `本地面\|本档私有实现` 在两种读法下皆 0，判不出改前改后——已撤。）

#### #4 🟡 坐标位移账缺一半 → 两段账 + 符号锚

offload 档两段账：

| 段 | 范围 | 位移 |
|---|---|---|
| 插入点以上 | 旧 1–6 行 | 不动 |
| 插入行 | 旧第 6 行 `import { join } from "node:path"` 之后 | 旧 7 行起 **+1**（旧 8 → 9，旧 11 → 12） |
| 删除段 | 旧 13–22（10 行） | 旧 23 行起 **−9**（+1−10）；`safeSliceUTF16End` 头注起 = 旧 24 → 新 15 |

`thincoder-core/text-budget.mjs` 侧同理：§6 只补头注 ⇒ `safeSliceUTF16` 的 `:55` 也会下移 ⇒ 该处判据一并改符号锚（D-MEM16 已办，见 #7）。

设计档两处 offload 裸行号**本轮已改符号锚**（实读 `offload\.mjs:[0-9]` = 0 行）：

- §3：`同一常量 TOOL_RESULT_OFFLOAD_LIMIT（thincoder-core/agent/offload.mjs 的常量段）二分`
- §6.1 首行：落点改 `thincoder-core/agent/offload.mjs`（四常量名逐一列出，不带行号）

#### #5 🟡 档位结论缺 + §1 行数挂反

**体量结论：四档均低于 500 行审视线 ⇒ 无档越线，无拆分方案。** 行数属过程读数、随改动即旧，不进设计档（同判 = `docs/batches/2026-11-01-helpers-offload-split.md` 的 D6）。

§1 是主 agent 段、不属本席写域 ⇒ **上抛父侧**处置；本席不改。

#### #6 🟡 非字符串面的场景 → 无，且用例表收缩

**无场景（诚实结论）**：两处私有调用点在工具结果族走不到切片（#2 的 `offload.mjs:82`–`:83` 读数）；doc 预览那一格本轮无读数、不下断言。

**用例表据此收缩**：保留 16（`null`）∥ 17（`undefined`）——钉的是已导出契约的现态归一；**撤掉 18（数字）∥ 19（对象）∥ 20（数组）**——无调用方，且把 `{}` → `"[object Object]"` 钉成永久期望，等于给不存在的场景立保障。

**归一形理由重申**（不是为防已发生的事故）：反向收窄会给已导出契约新增抛错（`memory/*` 三档在消费），那是 out of scope 的行为变更。

#### #7 🟡 触达即修：`docs/core/design/MEMORY.md` 已改准

D1 引 D-MEM16 作依据 ⇒ 引用即触达，不得以「不在本批写域」报不改。本轮已改该行理由列：

- 消费坐标按实盘改准三档档名——`thincoder-core/memory/core.mjs` · `thincoder-core/memory/code-search.mjs` · `thincoder-core/memory/docs.mjs`（原记 `code-sync.mjs` 为错档名，本仓无此档）。
- 声明位与消费位**全部改符号锚、不带行号**（`:55` 会因头注增长而下移）。
- 补一句「核内另两面 `thincoder-core/agent/offload.mjs` · `thincoder-core/agent/setup.mjs` 亦经 import 复用 ⇒ 核内唯一定义」。

#### #8 🟡 最近先例

**前身 = `docs/batches/2026-11-01-helpers-offload-split.md` 的 D5**：「顺手把三份 `safeSliceUTF16` 合成一份——语义面 + 跨子系统（`memory/*`）写域，另批」；同批把三份坐标记在它的发现 ②。本批正是那条待办的接笔。

**对齐**：单源住 `thincoder-core/text-budget.mjs` · 消费面零改 · 设计档坐标改符号锚（同批 D5 ∥ D6 同法）。

**偏离与理由**：本批把先例所说的「语义面」显式收窄到**字符串入参**（§5），非字符串面按父侧裁定取契约扩张；端壳镜像不动（同批出界理由照旧）。

#### #9 🟡 勘察证据

`PROJECT-MANIFEST.json` 的 `index.publicRepos` = `[]`（本轮实读）⇒ 本仓无声明公开来源档，故查工作树外参考系 `D:\ref\`（五仓）。grep `safeSliceUTF16|charCodeAt(.*0xd800|surrogate` 命中大量同类实现，同规则者三条：

- `D:\ref\MiMo-Code\packages\opencode\src\session\checkpoint.ts:59`–`:61`——「slice() cuts on UTF-16 code units, which can split a surrogate pair at the boundary」
- `D:\ref\oh-my-pi\packages\coding-agent\src\memories\index.ts:1284`——「Slice to maxChars, dropping a trailing unpaired high surrogate」
- `D:\ref\openclaw\apps\android\app\src\main\java\ai\openclaw\app\Utf16Text.kt:28`–`:30`——同规则 + `take(if (endsOnHighSurrogate) maxChars - 1 else maxChars)`

**有无相关**：有相关、但不可复用——各在其仓语言内独立实现、跨仓不可 import，本批形态仍是核内单源。勘察结论 = 该规则是行业同解（非本仓自创口径），不改变设计。

#### #10 🟡 第四处同规则实现：`truncateContent` 的处置

`thincoder-core/agent-tools/read-history.mjs` 的 `truncateContent` = 同一头切片规则 + 自有省略标记 + 自有上限 500。

**不合并**：它不是复本（多一段标记，且上限与 `max` 入参不同形），合进去要给单源加标记参数 = 语义面，另批。

**但它头注的指针必须改**：该注收尾写 `clean output costs nothing (setup.mjs safeSliceUTF16 same rule)`——合并落地后 `setup.mjs` 不再有该函数，指针当天变假。按本席在 §10.4 立的判据（留假陈述即为缺陷），改指 `thincoder-core/text-budget.mjs`。

代码不归本席 ⇒ 列入受影响档，由 §5 实施，判据 = AC9。

#### #11 🔵 AC5 只见未暂存 → 三支并读

`git status --porcelain` ∥ `git diff --name-only` ∥ `git diff --cached --name-only` 三支并读，三条消费面路径 0 命中。

原表第四项 `agent-tools/` **撤掉**——按 #10 本批正改 `thincoder-core/agent-tools/read-history.mjs` 的头注，留着该项会让正确实现判红。

#### #12 🔵 setup 插入位精度

与 offload 同给内容锚（不用行号）：

- `thincoder-core/agent/setup.mjs`：接在 `import { resolveCompactThreshold } from "../config.mjs"` 之后
- `thincoder-core/agent/offload.mjs`：接在 `import { join } from "node:path"` 之后

#### #13 🔵 harness 唯一破点 → 加回核

等价的唯一破点 = 内嵌旧体的抄写（抄错一字则证明的是抄本）。AC3b 加一条：删代码前先 `git diff` 取 §6 待删原文，与单测档内嵌旧体逐字相等；不等则停。

### 2.2 验收表（重出，取代 §8）

| # | 判据 | 判法（读数；改前基线 = 本轮实测） |
|---|---|---|
| AC1 | 核内头切片单源 | pattern `function safeSliceUTF16\(` · path `thincoder-core` · glob `**/*.mjs` ⇒ **恰 1 行**（`thincoder-core/text-budget.mjs`）；改前 3 行 |
| AC2 | agent 面零复本（成对） | (a) 同 pattern · path `thincoder-core/agent` · glob `**/*.mjs` ⇒ **0 行**（改前 2 行）∧ (b) pattern `safeSliceUTF16 \} from "\.\./text-budget\.mjs"` · path `thincoder-core` · glob `**/*.mjs` ⇒ **5 行，其中 2 行落 `thincoder-core/agent/`**（改前 3 行，全落 `memory/`） |
| AC3 | 字符串入参等价 | `node --test docs/batches/2026-11-02-safeslice-single-source.test.mjs` 全绿；corpus 85 串 × `max` 0–`len+1` 对新 ∥ B ∥ C 逐例全等 |
| AC3b | harness 抄本回核 | 删代码前 `git diff` 取 §6 待删原文，与单测档内嵌旧体逐字相等；不等 ⇒ 停（证明的是抄本） |
| AC4 | 新契约钉住 | 同次运行用例 16（`null`）∥ 17（`undefined`）：不抛，均返回 `""` |
| AC5 | 消费面零改 | 三支并读（#11），下列三路径 **0 命中**：`thincoder-core/memory/` ∥ `thincoder-core/agent/dispatch-run.mjs` ∥ `thincoder-core/agent/helpers.mjs` |
| AC6 | 端到端代理对安全 | 同次运行末端到端用例：孤立代理正则 0 命中 |
| AC7 | 设计档同步（成对） | (a) pattern `头切片 = 核内单一来源` · path `docs/core/design/TOOL-OUTPUT-LIMITS.md` ⇒ 1 行 ∧ (b) pattern `本档私有实现` 同档 ⇒ 0 行（均已达标） |
| AC8 | 文档门 | `doc_check(mode:"gate")` 首行 `DOC-CHECK GATE: PASS` |
| AC9 | read-history 指针改指 | (a) pattern `setup\.mjs` · path `thincoder-core/agent-tools/read-history.mjs` ⇒ **0 行**（改前 1 行）∧ (b) pattern `text-budget\.mjs` 同档 ⇒ 1 行 |
| AC10 | 设计档 offload 裸行号清零 | pattern `offload\.mjs:[0-9]` · path `docs/core/design/TOOL-OUTPUT-LIMITS.md` ⇒ **0 行**（改前 2 行，本轮实测已 0） |

### 2.3 受影响档（重出，取代 §2）

| 文件 | 动作 | 内容 |
|---|---|---|
| `thincoder-core/agent/offload.mjs` | 删私有件 + 加 import | 删 10 行（头注 4 + 函数体 6）；import 按 #12 的锚 |
| `thincoder-core/agent/setup.mjs` | 删私有件 + 加 import | 删 11 行（头注 3 + 函数体 8）；import 按 #12 的锚 |
| `thincoder-core/text-budget.mjs` | 仅头注 | 补「核内唯一定义 + 两面经 import 复用 + 入参先归一」；函数体一字不改 |
| `thincoder-core/agent-tools/read-history.mjs` | 仅头注改指（#10） | `truncateContent` 头注的 `setup.mjs safeSliceUTF16 same rule` 改指 `thincoder-core/text-budget.mjs`；函数体一字不改 |
| `docs/core/design/TOOL-OUTPUT-LIMITS.md` | 设计档（本轮已落） | §3 ∥ §6.1 两处 offload 裸行号改符号锚；§2 两条切片陈述已是单源形 |
| `docs/core/design/MEMORY.md` | 设计档（本轮已落，#7） | D-MEM16 消费坐标改准（档名 + 符号锚） |
| `docs/batches/2026-11-02-safeslice-single-source.test.mjs` | 单测档（coder 建，收口删） | corpus 等价 harness + 边界表 1–17 + 端到端一条 |

**分层结论**：无跨档——四档同为 `thincoder-core/` 产物码，导出面无变化（`thincoder-core/agent/helpers.mjs` 的转口三件不含本函数），无端壳 / 构建 / 对外契约改动。

**体量结论**：四档均低于 500 行审视线 ⇒ 无档越线、无拆分方案（#5）。

### 2.4 上抛（父侧处置）

1. **[上抛·待裁] §1 的行数把两档挂反**（`offload ∥ helpers：407 ∥ 98`，实为 helpers 407 · offload 99）。§1 是主 agent 段，本席不改，请父侧对齐或删数。
2. **[上抛·知会] 本轮清单外改动**：改 `docs/core/design/MEMORY.md`（#7 要求，§10.3 的处置由「报不改」改为「本轮改准」）。

### 2.5 实施后订正（§5 回抛两件 + 本席实读）

**读法**：本节为本段现态；本节之前同题读数因 append-only 留档，读时以本节为准。

**① 行数位移账按实改：−10，不是 −9**

实施席实删 **11 行**（§6 写的 10 行 + 函数体之后那条分隔空行 1 行；不删则留两连空行）⇒ §2.1 #4 的位移账重出：

| 段 | 范围 | 位移 |
|---|---|---|
| 插入点以上 | 旧 1–6 行 | 不动 |
| 插入行 | 旧第 6 行 `import { join } from "node:path"` 之后 | 旧 7 行起 **+1** |
| 删除段 | 旧 13–23（11 行） | 旧 24 行起 **−10**；`safeSliceUTF16End` 头注 旧 24 → 新 **14** |

判据不依赖此账（该档裸行号已按 AC10 全改符号锚），但账要真。

**② AC3b 判法已换：取证方式变了，判据未放宽**

`thincoder-core/agent/offload.mjs` 当时尚未入版本库（`git status` 记 `??`）⇒ `git diff` 取不到删除行，原判法（「删前 `git diff` 取待删原文」）当日不可执行。

实施席改判：删前以 node 逐字节捕获两段原文落临时档，再与单测档内嵌旧体逐字节比对 —— md5 全等（B `c2707e7754d586db3d12f3278a495e0a` 10 行 ∥ C `c62c15659e0f7b7da246d13832be8a145` 11 行）。

**代价**：少了 git 自带的那份来源不可否认性 —— 改动面改由捕获读盘 + `git status` 佐证。后续读 AC3b 者不得再以为读法是 `git diff`。

**③ 设计档 §6.3 改符号锚（本轮本席）**

`docs/core/design/TOOL-OUTPUT-LIMITS.md` §6.3 原标「（实核）」，而全表裸行号已与实盘不符：`safeSliceUTF16` ∥ `safeSliceUTF16Tail` 记 `:97` ∥ `:115`，实盘 `thincoder-vscode/src/agent/run-helpers.mjs` 为 `:35` ∥ `:44`。

同表另有三处已不真：该档 93 行内无 `offloadToolResult` / `TMP_RETENTION_MS` 实现；`thincoder-vscode/src/advisor/` 目录不存在；`webview/lib.js` 已是两行再导出 shim。

⇒ §6.3 整表改符号名 + 档路径、不带行号（D6 同法），并写实归属：端独有保留 = 两段切片器 + `buildHeadTailPreview` + 三常量；落盘 / 自清理 / 失败回退 / advisor 截断全取核单源。

同笔更正三处：§6.2 的镜像面陈述（原称镜像 read 双端 + advisor 截断两族，与实盘相反）· §4 ∥ §6.1 的 `advisor/compaction.mjs:38`（实盘 `:43`）· §6.1 的 `tools/shared.mjs:20`（实盘 `:21`）。

## §3 设计评审（评审子代理）
**状态行**：评审通过



### 轮次 1（评审子代理）

**评审对象**：`safeSliceUTF16` 三份复本合并单源（契约面扩张 + 等价 harness）· 设计档 = 本批 §2 · 现态陈述档 = `docs/core/design/TOOL-OUTPUT-LIMITS.md`（本轮全文实读，两档均在盘核对）。

| # | 类别 | 严重度 | 问题 | 建议 |
|---|---|---|---|---|
| 1 | 验收（AC1 ∥ AC2） | 🔴 | 两条判据用的 pattern `function safeSliceUTF16` 是**前缀匹配**，把 `safeSliceUTF16End` ∥ `safeSliceUTF16Tail` 一起收进来：本轮实测按 AC1 的 path+glob 命中 2 行（`text-budget.mjs` 的 `safeSliceUTF16` 与 `safeSliceUTF16Tail`），按 AC2 的 path 命中 3 行（另含 `offload.mjs` 的 `safeSliceUTF16End`）。合并后 `End` ∥ `Tail` 仍在盘 ⇒ AC1 读到 2（判据写「恰 1 行」）、AC2 读到 1（判据写「0 行」），**任何正确实现上都判红**。§3「核内定义恰 3 处」同一 pattern 的读数也不可复现（带 glob = 2 行，不带 glob = 5 行），写入者读到的「3」两读法都对不上。 | 把两条改成能区分三个函数名的判据（词边界 / 左括号 / 成对读数：私有定义行 0 命中且 import 行 1 命中），并重出 §3 的读数。 |
| 2 | 验收（集成面） | 🔴 | 全文**无集成测试设计节**，零处提到 `test/RTM.md`（本轮 grep `RTM` ∥ `集成` ∥ `交互` = 0 命中），而该表在盘（23 个 CLI 故事节 + VS Code ∥ Desktop 两段，故事 1 = 工具结果回到模型、判据含「没有 400」）。设计缺这一节 ⇒ 本批对业务可观察面**没有任何验收陈述**。 | 补该节并以 RTM 读数为起点写 delta（既有行是否被本改动破坏 / 有无冗余 / 有无缺行）；若适用「不改变既有用例所断言的业务可观察结果、也不新增产品真需要的场景」那条唯一合法理由，就把理由与其据写出来（字符串入参零变、非字符串面不构成业务可观察结果）——现在一个字的陈述都没有。 |
| 3 | 验收（AC7 空转） | 🟡 | AC7 的 pattern 在本轮实测已 0 命中（两种读法：`\|` 作字面竖线 ∥ 作交替，现档都不含那两个词），合并前后同为 0 ⇒ 该行**区分不了改前改后**，判不了「设计档已同步」。 | 换成成对读数（旧私有定义残句 0 命中 **且** 新单源表述 1 命中），或直接以该档两条切片陈述为判据。 |
| 4 | 文档归属（坐标） | 🟡 | 插入的 import 行落在 offload 档 import 块内 ⇒ 常量段整体后移一位：该档 §3「同一常量 `TOOL_RESULT_OFFLOAD_LIMIT`（`thincoder-core/agent/offload.mjs:8`）二分」与 §6.1 四常量的行号区间（`offload.mjs:8`–`:11`）落笔后各偏一位（`TOOL_RESULT_PREVIEW_TAIL` 将落到区间之外），而 D6 的位移账只记「删 10 行 ⇒ 22 行以下整体 -9」，未记插入行使常量段 +1。同时 §2 受影响表声称「§3 落盘档的 offload 行号改符号锚」，而 §3 该处**仍是裸行号**（未改）。 | 位移账写成两段（插入点以上 +1 ∥ 删除点以下 -9），并把 §3 ∥ §6.1 这两处 offload 裸行号一并改符号锚（或落笔后按实读改正）。 |
| 5 | 受影响档分层（criterion 8） | 🟡 | 缺体量结论行：三档本轮实量 = offload 99 行 · setup 313 行 · text-budget 79 行（read 工具行号口径），**无一越 500**，结论应是「无档越线」；但设计只给「分层结论：无跨档」（讲的是分层/导出面，不是体量面）。且 §1 把原始行数写进档：「`thincoder-core/agent/offload.mjs` 与 `thincoder-core/agent/helpers.mjs`：**407 ∥ 98 行**」——按句面挂反（本轮实读 helpers 到档末 = 407 行、offload = 99 行）。 | 换一行体量结论（哪档越线 + 拆分方案，或「无一越线」），删掉原生行数；§1 若留档数，把数与被量档名对齐。 |
| 6 | 需求（契约面扩张的场景） | 🟡 | 扩张出来的新状态（`null` ∥ `undefined` ∥ 数字 ∥ 对象 ∥ 数组）在两处私有调用点**无场景**：全文无一条读数 / 日志 / 复现命令说明非字符串真会到达 `buildDualEndPreview` 或 doc 预览；用例 16–20 反把 `{}` → `"[object Object]"` 永久钉住。判 6b 未触发（本设计未新增守卫分支，归一形是 text-budget 既有代码原样采用、函数体一字不改），但「一处传错类型被洗成静默」这一现实成立，方向本身可接受。 | 要么给场景（引用到的读数 / 复现路径），要么在 §5 ∥ §10 明写「无此场景，用例 16–20 只钉既有导出契约、不为它新增保障」，并考虑把永不会发生的状态（对象 ∥ 数组）从用例表撤掉。 |
| 7 | 方法（触达即修） | 🟡 | 发现 ③ 把 `docs/core/design/MEMORY.md` D-MEM16 的失效消费坐标以「该档不在本批写域」为由**报不改**——本仓现行口径 = 「触达即本轮 ∥ 不许用名字绕开」（`docs/batches/2026-11-01-touched-means-fix.md` 记用户原话「你碰到的时候不能以旧债为名不处理」，并明列「不是这一批写的」为禁用理由）；而本批 D1 正引 D-MEM16 作依据（「早已把它声明为核级单一来源」），引用即触达。其失效面本轮已核：该行写 `code-sync.mjs`，实盘 import 本函数的三档 = `memory/core.mjs` ∥ `memory/code-search.mjs` ∥ `memory/docs.mjs`。 | 要么本批改准该行（消费坐标 + 档名），要么写清为何「引用他档作依据」不算触达，并按现行口径落一行处置结论而不是「报不改」。 |
| 8 | 方法（最近先例） | 🟡 | 无最近先例行：先例只以「同目录先例 spawn-child.mjs」与 D6 的符号锚先例零星出现；真正的**前身**——`docs/batches/2026-11-01-helpers-offload-split.md` D5「顺手把三份 `safeSliceUTF16` 合成一份——语义面 + 跨子系统（`memory/*`）写域，另批」——正是本批的待办源头，未引、未写对齐 ∥ 偏离。 | 补一行最近先例（实现坐标 ∥ 对应设计档节 ∥ 先例批次）+ 对齐 ∥ 偏离理由，点名 D5 那条推迟，并说明本批相对它的偏离（本批把「语义面」显式收窄到字符串入参）。 |
| 9 | 方法（勘察证据） | 🟡 | 无勘察证据行：未写查过哪些公开来源档（独立 doc 仓尤甚）∥ 有无相关。此题（各 CLI 的超长结果截断 / 预览实现）正属参考系可勘察面（`D:\ref\`）。 | 补一行勘察证据（查了什么、有无相关；「无相关」也记），供后续读的人判该不该再查。 |
| 10 | 清晰度（第四处同规则实例） | 🟡 | 「核内定义恰 3 处」是**按名字**成立的读数：`thincoder-core/agent-tools/read-history.mjs` 的私有 `truncateContent` 是第四条同一头切片规则的实现（`String(text ?? "")` 归一 → 长度门 → 切点落高代理前收一码元，另加省略标记），且其头注把自己的规则指到 `setup.mjs`：「clean output costs nothing (setup.mjs / * safeSliceUTF16 same rule)」——合并落地后该指针当天变假。设计既未把它写进零改清单，也未写「它非复本（多一段标记）故不在本批」。 | 一行写清它的归属：或本批把头注指针改到单源（`text-budget.mjs`），或明写「非复本、不在本批」，并按 §10.4 自己的口径（「留假陈述即为缺陷」）处理这条指针。 |
| 11 | 验收（AC5 读数面） | 🔵 | AC5 用 `git diff --name-only` 判「消费面零改」，只见**未暂存**改动；已 staged 的 `memory/*` 改动会漏读。 | 换成覆盖暂存区的读数（如 `git status --porcelain` 与 `git diff --name-only` 与 `--cached` 三支并读）。 |
| 12 | 清晰度（插入位） | 🔵 | setup.mjs 的插入位只写「import 块内」，同一条里 offload 给了内容锚（「第 6 行后」）——两处精度不一。 | 给 setup.mjs 同样一个内容锚（接在某条既有 import 之后），免得落位靠猜。 |
| 13 | 清晰度（harness 唯一破点） | 🔵 | 等价的唯一破点 = 内嵌旧体的抄写：harness 与**抄本**比对，抄错一字则证明的是抄本。本轮已核 §6 待删原文与实档逐字一致（offload 10 行 ∥ setup 11 行），风险低，但验收面没留回核。 | AC3 加一条回核：内嵌块与 §5 实删的行逐字相等（删前 diff）。 |

**计数**：🔴 2 · 🟡 8 · 🔵 3

**已核成立项（不单列）**

- **①单源落点判得对**：`thincoder-core/text-budget.mjs` 全档实读 79 行、**零 import**（头注自述「本模块零 import（可被任意层直接引用）」），导出形态已成立；`memory/*` 三档确在 import 本函数；`thincoder-core/agent/spawn-child.mjs` 已有同向先例（从 `../text-budget.mjs` import `appendCappedText`）⇒ 两面各加一条 import **不成环**，落点与 D1 ∥ D3 ∥ D4 ∥ D5 的否决面均成立。
- **消费面零改成立**：`memory/*` 三档 import 形不变；`agent/helpers.mjs` 的转口三件 = `offloadToolResult` ∥ `cleanupOldToolResults` ∥ `TMP_RETENTION_MS`，不含本函数 ⇒ 「导出面零变化」的判据在盘成立。
- **三份在字符串入参下逐句同义成立**：三体实读，判据（长度门 ∥ 切点码元 ∥ 高代理前收）与返回值一致，唯一真差异 = text-budget 首行归一；不采 offload 头注（写「两处独立实现」而实为三处）的判定正确。
- **②契约面方向**：三份里唯一导出且有活消费面的是 text-budget，反向（保严格）等于给 `memory/*` 新增抛错 ⇒ 取归一形方向可接受；§5 把「语义零变」限定在字符串入参前面、并明写「契约面扩张，不是等价」，没有含糊。残留面见 #6（状态无场景）。
- **③等价 harness 判法**：corpus 覆盖字母表长度 0–3 全组合（含单个高代理 ∥ 单个低代理 ∥ 成对）× `max` 0–`len+1`，切点两侧都取到；本函数只读 `length` 与**一个**码元 ⇒ 字符串域无逃逸分支，长度 4 的用例也在边界表内（`"🔴🔴"`）。「这条只覆盖字符串入参」的限定写得对。
- **④清单外改动 = 触达即修，不是越界**：该档自述「本档 = 该机制族的**唯一权威**（常量 / 语义 / 坐标）」，而本合并当日使其两条切片陈述变假 ⇒ 改它属拥有该主题的档，且与「触达即本轮」同向。行号改符号锚方向对（同形先例 = `2026-11-01-helpers-offload-split.md` 把 D5 坐标改成 `safeSliceUTF16End` ∥ `buildDualEndPreview` 不带行号，本轮已在盘核）。残留 = 该改漏了两处、且位移账少一段（见 #4）。
- **⑤尾切片不合并的判定对**：实读两体，`safeSliceUTF16Tail` 多一条「末位孤立高代理去除」，`safeSliceUTF16End` 无此条（同一入参 `"abc\uD83D"` ∥ `max` 4 两体返回值不同）⇒ 「不同义，不合并」成立；该档 §2 改后的两条陈述（头=单源 ∥ 尾=agent 侧私有 ∥ 强化对称面）与代码一致，无同档两说并存。
- **单测档落点合规**：`docs/batches/2026-11-02-safeslice-single-source.test.mjs` 与既有口径一致（`docs/batches/2026-11-01-prompt-unit-test-location.md` 记「单测档与批档同目录、同名前缀…收口时删」），且未落进包内 `test/`（否则该包入口恒红）。
- **验收不写全量套跑**：AC3 ∥ AC4 ∥ AC6 都指同一改动面单测档的 `node --test` 单档形，符合「验收 = 改动面单测档」口径（集成半边应落收口行，见 #2）。
- **需求覆盖**：§1「设计席要先判的四件」（是否真同义 ∥ 单源住哪 ∥ 谁改谁不改 ∥ 等价怎么证）逐条在 §3 ∥ §4 ∥ §2 ∥ §7 有对应答案，无漏项；§2 的「不在本批」清单把端壳镜像、上限常量、preview 形态、`escape.mjs` 都排除了，无范围蔓延。

VERDICT: changes-required

### 轮次 2（评审子代理）

**本轮 = 第 2 轮：只核上轮 13 条（🔴2 · 🟡8 · 🔵3），判据不重开。核据一律为本轮 fresh read / grep 实读。**

| # | 上轮条目 | 严重度 | 本轮状态 | 核据 |
|---|---|---|---|---|
| 1 | AC1 ∥ AC2 前缀匹配 + glob 不递归 | 🔴 | **Fixed** | 病根两处**都成立且已修**：实测 pattern `function safeSliceUTF16` 带 `*.mjs` = 2 行（`text-budget.mjs` 的 `safeSliceUTF16` 与 `safeSliceUTF16Tail`），带 `**/*.mjs` = 3 行；改后的 `function safeSliceUTF16\(` 带 `**/*.mjs` = 3 行（`offload.mjs` ∥ `setup.mjs` ∥ `text-budget.mjs`），`**` 递归已实测有效。改后两判据在正确实现上可达：AC1 ⇒ 剩 `text-budget.mjs` 1 行（`safeSliceUTF16End` ∥ `safeSliceUTF16Tail` 因缺左括号不再命中）；AC2(a) ⇒ 0 行；AC2(b) import 形带 `**/*.mjs` 现为 3 行全落 `memory/`，两面各加一行后 = 5 行、其中 2 行落 `thincoder-core/agent/`。三条读数本轮逐条复现。 |
| 2 | 无集成测试设计节 | 🔴 | **Fixed** | 新增节成立并已实核：`test/RTM.md` 的 CLI 端确有 **27** 个故事节（H2「CLI 端」下的 H3 编号 1–27）；对位故事 1 = 「对话里用工具，结果必须回到模型」，三行 `1-1` ∥ `1-2` ∥ `1-3` 的判据确含「没有 400」，证据档 `test/integration/anthropic-tool-roundtrip.test.mjs` 在盘。「工具结果族走不到切片」这句**真成立**：`thincoder-core/agent/offload.mjs` 实读 `const overLimit = text.length > TOOL_RESULT_OFFLOAD_LIMIT` / `if (!force && !overLimit) return text`——非字符串 `text.length` 为 undefined ⇒ 比较为假 ⇒ 原样返回，不进 `buildDualEndPreview`。**残留一格不阻本轮**：`docSearch` 的 SQL 取 `d.content`，而同一批行的另一活消费点 `doc_search` 直接写 `r.content.slice(0, 2000)` ⇒ 该字段实战为字符串，改前改后同值；且父侧裁定已在册。 |
| 3 | AC7 空转 | 🟡 | **Fixed** | 成对读数已达标且可复现：pattern `头切片 = 核内单一来源` 同档 = 1 行，pattern `本档私有实现` 同档 = 0 行（现档那条写的是「尾切片（agent 侧私有实现）」，不含旧串）。 |
| 4 | 坐标位移账缺一半 | 🟡 | **Fixed** | 两段账算术实核无误：删除段 = 旧 13–22 恰 10 行（头注 4 + 函数体 6）；插入点在旧第 6 行 `import { join } from "node:path"` 之后 ⇒ 旧 8 → 9、旧 11 → 12；旧 23 起 +1−10 = −9；`safeSliceUTF16End` 头注旧 24 → 新 15 与实档结构相符。设计档两处 offload 裸行号实测已清零（pattern `offload\.mjs:[0-9]` = 0 行）：§3 改「的常量段」、§6.1 改四常量名直列。AC10 已把这条钉成机判。 |
| 5 | 体量结论缺 + §1 行数挂反 | 🟡 | **Fixed** | 体量结论行已在（「四档均低于 500 行审视线 ⇒ 无档越线、无拆分方案」），且结论为真：本轮实量 offload 99 行 · setup 313 行 · text-budget 79 行 · read-history 不足 395 行，无一越 500。§1.1 的自纠也核过：helpers 到档末 407 行、offload 99 行，与自纠表一致。 |
| 6 | 用例 18/19/20 该撤 | 🟡 | **Fixed** | §2.1 #6 已撤 18（数字）∥ 19（对象）∥ 20（数组），保留 16（`null`）∥ 17（`undefined`），AC4 同步收缩；并明写「无场景（诚实结论）」。原 §7 物理行尚在，但 §2.1 的权威性声明与 AC4 已把 18–20 排除，append-only 下这是可行处置。 |
| 7 | 触达即修：`docs/core/design/MEMORY.md` | 🟡 | **Fixed** | D-MEM16 实读已改准：消费三档写成 `thincoder-core/memory/core.mjs` ∥ `thincoder-core/memory/code-search.mjs` ∥ `thincoder-core/memory/docs.mjs`，声明位与消费位不带行号，且补了「核内另两面 … 亦经 import 复用 ⇒ 核内唯一定义」。 |
| 8 | 最近先例 | 🟡 | **Fixed** | 先例档实读逐字对上：`docs/batches/2026-11-01-helpers-offload-split.md` 的 D5 = 「顺手把三份 `safeSliceUTF16` 合成一份——语义面 + 跨子系统（`memory/*`）写域，另批」；对齐 ∥ 偏离（把「语义面」收窄到字符串入参）已写。 |
| 9 | 勘察证据 | 🟡 | **Fixed** | `PROJECT-MANIFEST.json` 实读 `"publicRepos": []` 成立；三条同规则实现与「相关但不可复用」的结论已成行（三条 `D:\ref\` 引文本轮未回核，属工作树外，不影响该行成立）。 |
| 10 | 第四处同规则实现 | 🟡 | **Fixed** | `thincoder-core/agent-tools/read-history.mjs` 已进受影响表并立 AC9，读数可判：该档现盘 `setup.mjs` 恰 1 处（`clean output costs nothing (setup.mjs`），`text-budget` 0 处 ⇒ 改指后 (a)=0 ∥ (b)=1 可达。 |
| 11 | AC5 只见未暂存 | 🔵 | **Fixed** | 已改三支并读（`git status --porcelain` ∥ `git diff --name-only` ∥ `git diff --cached --name-only`）。`agent-tools/` 那一项的撤除自相修正**判得对**：本批确实改 `read-history.mjs` 的头注，留着必让正确实现判红。 |
| 12 | setup 插入位精度 | 🔵 | **Fixed** | 内容锚实读在盘：`thincoder-core/agent/setup.mjs` 有 `import { resolveCompactThreshold } from "../config.mjs"`，`thincoder-core/agent/offload.mjs` 有 `import { join } from "node:path"`。 |
| 13 | harness 唯一破点 | 🔵 | **Fixed** | AC3b 已成行（删代码前以 diff 取 §6 待删原文，与内嵌旧体逐字相等，不等即停）。 |

**另核两件（都是好的）**

- **「四档」数对得上**：§2.3 受影响表 7 行里产物码 4 档 = 三份复本（offload ∥ setup ∥ text-budget）+ `thincoder-core/agent-tools/read-history.mjs`（只改头注）；另 2 设计档 + 1 单测档不计入「产物码」⇒ 「四档」成立，且四档全在 `thincoder-core/` 下、全低于 500 行审视线。
- **§1 挂反数已关**：§1.1 自纠表 helpers 407 ∥ offload 99 与实读一致；上抛那条已成冗余（见下）。

**本轮新见的非阻断项（皆 advisory，不阻批准）**

| # | 类别 | 严重度 | 内容 | 建议 |
|---|---|---|---|---|
| N1 | 验收（AC5 面宽） | 🔵 | 撤掉整条 `thincoder-core/agent-tools/` 路径比需要的宽：精确排除只需剔 `read-history.mjs` 一个档，其余该目录改动仍应是零。 | 若要收紧，可写成「`agent-tools/` 除 `read-history.mjs` 外 0 命中」。 |
| N2 | 验收（AC7 半支空转） | 🔵 | AC7(a) 已能区分改前改后；(b) `本档私有实现` 改前改后同为 0，仍是空支。 | 保留无害，(b) 可换成一个改前为 1 的旧串。 |
| N3 | 记录卫生 | 🔵 | §2.4 第 1 条仍作为「上抛·待裁」挂着 §1 行数挂反，而 §1.1 已于父侧自纠关闭。 | 父侧收口时把该条标为已关即可，不涉设计面。 |

**计数**：🔴 0 · 🟡 0 · 🔵 3（新见 3 条，皆 advisory）

**结论**：上轮 2 条 🔴 均已修且修正读数本轮逐条复现（AC1 ∥ AC2 在正确实现上可达、错误实现上判红；集成节起自 RTM 且「工具结果族走不到切片」经代码实读成立）；8 条 🟡 ∥ 3 条 🔵 全部落地或给出可核理由；修正未引入新 🔴。

VERDICT: pass

## §4 用户批准（主 agent）

## 4. 用户批准（主 agent）

**批准对象**：`safeSliceUTF16` 三份复本合并单源（`thincoder-core/text-budget.mjs`），两处私有复本删除后改 import，消费面零改。

**批准依据链（全部在盘可查）**：

| 环节 | 事实 |
|---|---|
| 设计评审 | 两轮；第 2 轮 `VERDICT: pass`（上轮 13 条全 Fixed，新增 3 条 🔵 不阻断） |
| —— 轮次块 | 批档 §3 的两轮块，含核验表 + 计数 + VERDICT |
| —— 签字 | §3 状态行 = `评审通过`（工具随 pass 轮次自动置位，本轮已从盘上字节确认） |
| 授权凭据 | 评审结算回执 `Approved. Pass this exact token to eng-coder` —— **凭据值按纪律不入档** |
| 用户批准 | 用户原话「**你拿1975-77这三项试试新代码呗**」（2026-11-02 01:32） |

**契约面扩张的裁决依据**（父侧 2026-11-02 01:36 裁定，逐条落在此）：采用 `thincoder-core/text-budget.mjs` 的归一形，理由 = 三份里**只有它是导出形态且有活消费面**（`memory/*`），合并方向应当是「其余两份向那个已对外承诺的契约靠」，反向会让活消费方新增抛错。附三项条件：① 不得写成「语义零变」；② 契约一句话写清；③ 非字符串路径要有用例钉住。

**批准范围**：§2 所述三档合并 + 两处 import 改向 + 两处头注 + 一处头注指针改指。**不在批准范围且已登记**：`truncateContent` 不合并（`#1978`）· `safeSliceUTF16Tail` 与 `…End` 不同义不合并（同笔）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（5 档改动，AC1–AC10 全绿；内部差异审计 1 轮 + 代码评审 1 轮 pass，终态 clean）



## 5. 实施（eng-coder）

**交付摘要**：`safeSliceUTF16` 三份复本合并为单源，单源 = `thincoder-core/text-budget.mjs`。

该档是唯一导出形态、零 import 叶档。两处私有复本已删除并改 import，消费面零改，`read-history.mjs` 的失效指针改指单源。字符串入参逐例等价；非字符串入参按设计 §5 裁定取归一形。

### 5.1 逐档改动（体量读数 = `split("\n").length - 1` 口径）

| 文件 | 动作 | 体量 |
|---|---|---|
| `thincoder-core/agent/offload.mjs` | 删私有件（头注 4 + 函数体 6 + 尾随分隔空行 1 = 11 行）；`import { safeSliceUTF16 } from "../text-budget.mjs"` 接在 `import { join } from "node:path"` 之后（§2.1 #12 内容锚） | 98 → 88 |
| `thincoder-core/agent/setup.mjs` | 删私有件（11 行：头注 3 + 函数体 8）；同一 import 接在 `import { resolveCompactThreshold } from "../config.mjs"` 之后（§2.1 #12） | 312 → 302 |
| `thincoder-core/text-budget.mjs` | 仅 `safeSliceUTF16` 头注补三句（核内唯一定义 / offload 双端 preview 头切片与 setup doc_search 预览经 import 复用 / 入参先归一）；函数体一字未改 | 78 → 83 |
| `thincoder-core/agent-tools/read-history.mjs` | 仅 `truncateContent` 头注改指（§2.1 #10）：`setup.mjs safeSliceUTF16 same rule` → `thincoder-core/text-budget.mjs` 的 `safeSliceUTF16`；函数体一字未改 | 391 → 391 |
| `docs/batches/2026-11-02-safeslice-single-source.test.mjs` | 新建单测档（收口删）：内嵌两份旧体逐字 + corpus 等价 + 边界 1–15 + 契约 16–17 + 端到端一条 | 新建 144 |

调用点零改写：`offload.mjs` 的 `safeSliceUTF16(text, TOOL_RESULT_PREVIEW_HEAD)` 与 `setup.mjs` 的 `safeSliceUTF16(d.content, DOC_CHUNK_PREVIEW_LEN)` 逐字未动。

`setup.mjs` 那一处的行号由 167 变 157（净 −10）。`safeSliceUTF16End` 与 `safeSliceUTF16Tail` 均未动（设计 §2 明列不合并）。

### 5.2 验收对照（逐条实跑）

| # | 判据 | 本轮读数 |
|---|---|---|
| AC1 | 核内头切片单源 | pattern `function safeSliceUTF16\(` · path `thincoder-core` · glob `**/*.mjs` ⇒ **1 行**（`thincoder-core/text-budget.mjs:59`）——改前实测 3 行（`offload.mjs:17` ∥ `setup.mjs:32` ∥ `text-budget.mjs:55`） |
| AC2 | agent 面零复本（成对） | (a) 同 pattern · path `thincoder-core/agent` · `**/*.mjs` ⇒ **0 行**（改前 2 行）；(b) `safeSliceUTF16 \} from "\.\./text-budget\.mjs"` · `thincoder-core` · `**/*.mjs` ⇒ **5 行**，其中 **2 行落 `agent/`**（`offload.mjs:7` ∥ `setup.mjs:26`；改前 3 行全落 `memory/`） |
| AC3 | 字符串入参等价 | `node --test docs/batches/2026-11-02-safeslice-single-source.test.mjs` ⇒ **19 pass / 0 fail**；corpus 85 串 × `max` 0–`len+1` 对新 ∥ 旧体B ∥ 旧体C 逐例全等（旧体经 `new Function` 求值执行，不是文本比对） |
| AC3b | harness 抄本回核 | 读法已替换，理由见 5.3(b)。读数：内嵌旧体 B 与删前原文 md5 全等 `c2707e7754d586db3d12f3278a495e0a`（10 行）、C 全等 `62c15659e0f7b7da246d13832be8a145`（11 行） |
| AC4 | 新契约钉住 | 同次运行 #16（`null` ⇒ `""`）∥ #17（`undefined` ⇒ `""`）均不抛、值如判据（已撤的 18–20 未写） |
| AC5 | 消费面零改 | 三支并读（`git status --porcelain` ∥ `git diff --name-only` ∥ `git diff --cached --name-only`）：`thincoder-core/memory/` 0 命中、`agent/dispatch-run.mjs` 0 命中；`agent/helpers.mjs` 1 命中属改前既有，见 5.3(c) |
| AC6 | 端到端代理对安全 | 同次运行：`offloadToolResult` 喂 86385 字符、高代理恰落 head 第 16384 码元 ⇒ 返回串孤立代理 **0 命中**，且走 `middle omitted` 双端支 |
| AC7 | 设计档同步（成对） | (a) `头切片 = 核内单一来源` · `docs/core/design/TOOL-OUTPUT-LIMITS.md` ⇒ **1 行**；(b) `本档私有实现` 同档 ⇒ **0 行** |
| AC8 | 文档门 | `doc_check(mode:"gate")` ⇒ 首行 `DOC-CHECK GATE: PASS`（本段落盘后即跑，见 5.4） |
| AC9 | read-history 指针改指 | (a) `setup\.mjs` · `thincoder-core/agent-tools/read-history.mjs` ⇒ **0 行**（改前 1 行）；(b) `text-budget\.mjs` 同档 ⇒ **1 行**（`:84`） |
| AC10 | 设计档 offload 裸行号清零 | `offload\.mjs:[0-9]` · `docs/core/design/TOOL-OUTPUT-LIMITS.md` ⇒ **0 行** |

附带的装配读数：`node scripts/check-syntax.mjs`（thincoder-core）⇒ **287 file(s) OK**。

单测档成功 import `thincoder-core/agent/offload.mjs`；`setup.mjs` ∥ `helpers.mjs` 动态 import 均加载成功。

`helpers.mjs` 转口三件解析正常、自身不含 `safeSliceUTF16`；`text-budget.mjs` 改后仍零 `^import`（无环）。

thincoder-core 的 `node test/run.mjs` 按设计拒绝执行（该包无集成测试集，N20），故验证面 = 上述单测档。

### 5.3 决策披露

**(a) offload.mjs 实删 11 行，设计写 10 行。**

多删的是原第 23 行那条分隔空行（函数体之后、`safeSliceUTF16End` 头注之前）。不删会留下两连空行。

后果是位移账差一：设计 §2.1 #4 写「旧 24 → 新 15」（−9），实为「旧 24 → 新 14」（−10）。无判据依赖它——该档裸行号已按 AC10 全改符号锚。

**(b) AC3b 的读法替换。**

设计写「删代码前 `git diff` 取 §6 待删原文」。但 `thincoder-core/agent/offload.mjs` 尚未入版本库（`git status` 记 `??`），`git diff` 取不到它的删除行。

等价机判换成：删前用 node 逐字节捕获两段原文到临时档，再与单测档内嵌旧体做逐字节相等比对；md5 读数见 AC3b 行。

代价 = 少了 git 自带的那份来源不可否认性。补偿 = 捕获是对盘上文件的直接读取，且 `git status` 证实改动面恰为声明的五档。

**(c) `helpers.mjs` 的 M 不是本笔改的。**

依据两条。① mtime = 2026-11-01 23:31（#1973 拆分那笔），本笔四档 mtime 全为 2026-11-02 01:48。

② 该档 diff = 拆分的转口形（新增 `export { offloadToolResult, cleanupOldToolResults, TMP_RETENTION_MS } from "./offload.mjs"` + 删其自身常量段与私有件），不含本笔语义。

⇒ AC5 字面读数里那 1 条命中属改前既有未提交改动；本笔对消费面零改动。

**(d) 坐标漂移披露（本笔造成，不在 §2.3 受影响表内）。**

`setup.mjs` 净 −10 行 ⇒ 该档第 33 行以下的裸行号坐标整体 −10。

若其它设计档里写着 `thincoder-core/agent/setup.mjs:NN`（NN ≥ 33）这类裸坐标，会随本批漂位。本批未扫全仓此类坐标（不在本批写域、也不在 §2.3 表内）。

**报不改，请父侧定是否另批扫。** offload 侧本批已改符号锚（D6），setup 侧尚无同办。

**(e) 清单外改动：无。**

本笔实际改动的五档全在 §2.3 受影响表内；设计档两档（`docs/core/design/TOOL-OUTPUT-LIMITS.md` ∥ `docs/core/design/MEMORY.md`）由设计席落笔，本席未碰。

测试档落 `docs/batches/`（与批档同目录同名前缀），未落任何包内 `test/` 目录。

### 5.4 内部轮次与终态

**内部差异审计（explore，只读）**：1 轮 ⇒ `VERDICT: divergent`。

两条 🟡 都指向记录面（§5 当时为空、AC3b 证据未落档）；代码面 PARTIAL ∥ SILENT-SIMPLIFICATION ∥ DOC-DRIFT ∥ OUT-OF-LIST 全 0。修正 = 本段即写入。

**内部代码评审（advisor，type=code）**：1 轮 ⇒ `VERDICT: pass`，🔴 0。三条处置如下。

① 行数对不上 ⇒ 已核清为口径差。`read` 行号口径比 `split("\n").length - 1` 恰多 1；设计档的 99 / 313 / 79 是 read 口径，本段 88 / 302 / 83 是 split 口径，两套数指同一批文件。

本笔净变化按 split 口径 = offload −10 ∥ setup −10 ∥ text-budget +5 ∥ read-history ±0。

② 头尾不对称 ⇒ 设计 §10.2 明写尾切片不合并。且 `offloadToolResult` 的 `text.length > TOOL_RESULT_OFFLOAD_LIMIT` 门对非字符串为假、原样返回 ⇒ 不可达，记既有形状，不改。

③ 设计档 §6.3 的 VSC 裸行号与实盘不符 ⇒ 设计档属设计席写域，报不改，上抛父侧。

**修正轮次**：1 轮（写入本段 + 披露三件），未触发代码改动。**终态：clean。**

### 5.5 收口要点（交父侧）

- 单测档 `docs/batches/2026-11-02-safeslice-single-source.test.mjs` 收口时删除；内嵌两份旧体随档消失，不留永久副本。
- 本批未新增集成测试用例，理由见设计 §2.1 #2：字符串入参逐例等价、工具结果族的非字符串入口走不到切片。收口行按此记 `none`。
- 上抛父侧三件：5.3(a) 位移账算术、5.3(d) setup 侧裸坐标漂移、5.4 ③ 设计档 §6.3 的 VSC 坐标。

## §6 验证与收口（父代理）

## 6. 验证与收口（父代理）

### 6.1 本批交付了什么

`safeSliceUTF16` 的三份复本合并为一个单源（`thincoder-core/text-budget.mjs`），两处私有复本删除后改 import，消费面零改。契约面按父侧裁定**扩张一处**：非字符串入参由「抛 TypeError」变为「归一为字符串」。

### 6.2 读数（父侧本轮实跑）

| 项 | 命令 / 口径 | 读数 |
|---|---|---|
| **集成面（收口门）** | `node --test "test/integration/*.test.mjs"` | **tests 94 · pass 94 · fail 0** |
| 单测（收口即删） | `node --test docs/batches/2026-11-02-safeslice-single-source.test.mjs` | **19 / 19 绿**；该档**已按纪律删除**，读数留此行 |
| 语法面 | `node scripts/check-syntax.mjs`（thincoder-core） | **287 file(s) OK** |
| AC1 定义面归零 | `function safeSliceUTF16\(` · `thincoder-core/**/*.mjs` | **1 行**（`thincoder-core/text-budget.mjs`），改前 3 |
| AC2 私有面 + 导入面 | 同 pattern 在 `agent/` ⇒ **0**（改前 2）∥ import 形 ⇒ **5 行，其中 2 行落 `agent/`**（改前 3 行全落 `memory/`） | 成对达标 |
| AC9 指针改指 | `setup\.mjs` 在 `thincoder-core/agent-tools/read-history.mjs` ⇒ **0** ∥ `text-budget\.mjs` ⇒ **1** | 达标 |
| AC10 设计档裸行号 | `offload\.mjs:[0-9]` 在 `docs/core/design/TOOL-OUTPUT-LIMITS.md` ⇒ **0** | 达标 |
| 依赖方向 | `thincoder-core/text-budget.mjs` 改后仍零 `^import` | **无环** |

### 6.3 契约面扩张（按 §2 的 D2 记法）

**字符串入参路径零变**（corpus 85 串 × `max` 0–`len+1` 对新 ∥ 旧体 B ∥ 旧体 C 逐例全等）。
**非字符串路径由「抛错」改为「归一」** —— 这是**契约面扩张**，不是「零变」。「零变」一词在本批只出现在「字符串入参」这个限定语后面。

### 6.4 实施轮披露的四处（全部如实记账）

- **实删 11 行非 10 行**（多删一条分隔空行）⇒ 位移账实为 **−10**，`safeSliceUTF16End` 头注 旧 24 → 新 **14**。已由设计席在 §2 记账，并明写「判据不依赖此账，但账要真」。
- **AC3b 判法更换**：`thincoder-core/agent/offload.mjs` 仍未入版本库（`git status` 记 `??`）⇒ `git diff` 取不到删除行 ⇒ 改「node 逐字节捕获 + 与内嵌旧体比对，md5 全等」。**代价 = 少了 git 的不可否认性，已写进档。**
- **`thincoder-core/agent/helpers.mjs` 在 `git status` 里是 M**，但 mtime 2026-11-01 23:31（`#1973` 拆分那笔），本笔四档 mtime 全为 2026-11-02 01:48 —— 非本笔语义。
- **`setup.mjs` 净 −10 ∥ `offload.mjs` 净 −11** ⇒ 其它设计档里这两个档的行号坐标漂位 ⇒ 台账 `#1982`。

### 6.5 设计档同步（收尾轮）

`docs/core/design/TOOL-OUTPUT-LIMITS.md` §6.3 整表 **10 行行号清零、改符号名 + 档路径**，「（实核）」二字删除。**同笔实读查出 7 处假坐标**（含 `thincoder-vscode/src/advisor/` 目录根本不存在、webview 那档只是 2 行再导出 shim、两处行号各偏 1–2 行）——**只改被点名的那两格会把「实核」换成「表内其余七行指不存在的代码」，比原来更假**，故整表一次改干净。

### 6.6 没做（如实）

- **`truncateContent`（`thincoder-core/agent-tools/read-history.mjs`）不合并**：它多一段标记、不是复本；本次只把头注指针改指单源。
- **`safeSliceUTF16Tail` 与 `safeSliceUTF16End` 不合并**：前者多一条「末位孤立高代理去除」，**名字像不等于同义** ⇒ 台账 `#1978`。
- **`docs/core/design/MEMORY.md` D-MEM16 的坐标已在设计轮改准**（引用即触达），`#1979` 可据此核销判据。

### 6.7 集成面

本批**不改任何业务可观察结果**（字符串路径零变；非字符串面不是业务可观察面）。`test/RTM.md` 零改，理由与依据写在该档 §2 的集成节。

### 6.8 收口结论

设计两轮过审（13 条 → 2 🔴 全闭）、实施一轮（19/19 绿 + 判据成对达标）、设计档同步含 7 处假坐标收正、四处披露如实留痕、衍生债 `#1978` · `#1982` 入账。**本批收口。**
