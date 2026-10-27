# 2026-10-28 · design-coord-reanchor
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-28 · 来源 = 用户 2026-10-28 01:42 逐字「清，另外后续的活也干起来」—— 授权把账上余项推起来。本批只收台账 `#1860`（三处设计档坐标失效，由 B 批删件与 D 批改写代码各造成一半）。。
> 台账 = #1861（CONTEXT-COMPACTION · 归批）。前情 = 2026-10-28-product-text-sweep（已收口 2026-10-28）∥ 2026-10-28-sse-first-chunk-idle（已收口 2026-10-28）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-28
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 本批范围（父侧 2026-10-28 01:4x）

**一条台账项：`#1860` —— 三处活设计档的行号坐标因产品码改动而失效。**

**⇒ 本批是纯再锚：把失效坐标校到现行号，不改任何机制与语义。**

### 1.2 失效的三处（父侧实读，不是转述）

| # | 档与行 | 现文 | 失效原因 |
|---|---|---|---|
| 1 | `docs/core/design/MODEL-SPECS.md:1885` | 「上下文占比显示（`thincoder-vscode/src/specs.mjs:82` / `:96`）」 | B 批删 `ctxPercentForModel` 后该档**末行降为 `:89`**（`node` 实读）：`:96` **已越档尾**；`:82` 现落在 `ctxUsageForHistory` 的 docblock 上。应为 `:83`（`ctxUsageForHistory`）/ `:89`（`ctxPercentForHistory`） |
| 2 | `docs/core/design/CONTEXT-COMPACTION.md:520` 与 `:536` | 「VSC（`thincoder-vscode/src/specs.mjs:94`）」/「`:94`-`96`」 | 同上：应为 `:83` / `:83`-`:85` |
| 3 | `docs/core/design/TIMEOUT-DIGEST.md` §2.4 与 §3 | §2.4 记 `sse.mjs:205-214`/`:217-218`、`google.mjs:227-236`/`:239-240`；§3 表记 301/299 行 | D 批改写代码后：`sse.mjs` 现 **312** 行（两态臂在 `:207-:224`、翻转在 `:228-:229`）· `google.mjs` 现 **309** 行（`:230-:245`、翻转 `:249-:250`）· `core.mjs` **495** 不变 |

### 1.3 为什么三处要一起做

**它们的失效原因是同一件事的两种形态：**改了代码，写下坐标的那些档没跟着动**。**

**⇒ 而这三处散在三个档里，正好验证 2026-10-28 新写进 `docs/core/requirements/ENGINEERING-MODE-V2.md` §7.6 的那条判据 —— 「改动的每个符号/坐标，先全仓搜出每一处提及」。**

**★ 当时 B 批与 D 批都只校了自己笔域内的档，另一些描述同一符号的档留在原地。**

### 1.4 父侧定的边界

- **只改坐标与行数读数**，不改机制、不改判据、不改语义。
- **不动 `docs/vsc/design/WEBVIEW.md`** —— 它已由 B 批校到 `:83`/`:89`，是对的。
- **不许顺手重写整段**（超出对账面）：改一个数字就是一个数字。
- 若再锚过程中发现**新的**语义不一致（不是坐标），**停下上抛**，不自行改判。

### 1.5 判据（父侧定的验收形）

**每条改成什么、为什么**，落成一张逐条表；判据是：

1. **§1.2 名点的三处**（`docs/core/design/MODEL-SPECS.md:1885` · `docs/core/design/CONTEXT-COMPACTION.md:520` 与 `:536` · `docs/core/design/TIMEOUT-DIGEST.md` §2.4 与 §3 整节）内引用的每个 `thincoder-vscode/src/specs.mjs:NN` 的 NN，落在现行档的**末行 `:89` 以内**且指对符号（`:83` = `ctxUsageForHistory`、`:89` = `ctxPercentForHistory`）。
2. **同一射程内**引用的每个 `thincoder-core/provider/*.mjs:NN` 的 NN，在现行文件行数内且指对内容。
3. `doc_check(mode:"gate")` 三档全清。
4. **不许出现「引用的行号不存在」** —— 那是本批要消掉的东西本身。

**射程收窄说明（父侧 2026-10-28 01:4x 自正）**：本条初稿写作「三档内引用的每个 `provider/*.mjs:NN`」，对 `docs/core/design/MODEL-SPECS.md` 而言等于全档 35 处全检 —— 那超出 §1.2 定的名点范围，且那些错的成因是**多批累积漂移**而非 B / D 两批。故收窄为「§1.2 名点射程内」；全档坐标校验另批（台账已记）。

### 1.6 设计席上抛的裁定（父侧 2026-10-28 01:5x）

**上抛原文摘要**：`docs/core/design/TIMEOUT-DIGEST.md:130` 把 `parseGeminiStream` 接口写成 `{ idleMs, firstChunkMs = idleMs }`，而 `thincoder-core/provider/google.mjs:178` 实为 `{ … idleMs = DEFAULT_BODY_IDLE_MS, firstChunkMs }` —— 缺省靠体内 `firstChunkMs ?? idleMs` 兜住，语义等价、形不等。它按 §1.4「不自行改判」未动。

**裁：改，按现盘形写。**

**理由不是「逐字主义」，是状态档写的是「现在是这样」：**

- 两者**语义等价**（不传 `firstChunkMs` ⇒ 首挂用 `idleMs`），这点没错；
- 但**形不等**会误导下一个改它的人：照 `firstChunkMs = idleMs` 写成默认参数，是**另一种实现**（默认参数在调用时绑定实参，体内 `??` 在函数体读当前变量）；行为在该路径上恰好一致，但**再有人改 `idleMs` 的绑定点时两者会分叉**；
- 设计档的接口表读者是 eng-coder 与评审，他们会按表核对现盘 —— 表与现盘不同形，核对时就要多想一层，而那一层没有产出。

**⇒ 修正轮的处理**：把 `:130` 的接口记法改成与 `thincoder-core/provider/google.mjs:178` 同形（`idleMs = DEFAULT_BODY_IDLE_MS, firstChunkMs`），并在同句保留「缺省 = 首挂用 `idleMs`（体内 `??`）」这层语义说明 —— **形与义各归其位**。

**⇒ 另记一条父侧自正**：§1.5 判据 ② 初稿射程写宽（对 `docs/core/design/MODEL-SPECS.md` 等于全档 35 处），已收窄并留收窄说明；另批项 = 台账 `#1863`。

### 1.7 第一轮评审裁定（父侧 2026-10-28 01:5x）

**评审判 changes-required（🔴 2 · 🟡 6 · 🔵 3）。十一条全数接受。**

| # | 级别 | 裁 | 理由与处置 |
|---|---|---|---|
| 1 | 🔴 | **Fixed** | §1.6 的裁定没有进设计清单，§2.8 还写「仍未获裁」⇒ 同一项在一份设计里两种状态。**这一条是我的错**：先在 §1.6 裁了「改，按现盘形写」，后来写 §2.8 时没回看。修正轮把 `:130` 的接口记法进 §2.2 逐条表，并删掉 §2.8 的「仍未获裁」。 |
| 2 | 🔴 | **Fixed** | **射程含 §3 整节，但 §3 三行在盘上是错的**：`core.mjs:79-82`（实 `:80-83`）· `anthropic.mjs:225`（实 `:229`，且该档实 **368** 行非表记 362）· `responses.mjs:248/:267/:285`（实 `:252/:271/:289`，且实 **318** 行非 307）。而 §2.5 判据 ② 行写「逐行实读通过」⇒ **断言不成立**。⇒ 本批直接改这 5 个数字 + 2 个行数读数（同因、同射程，比另立台账省一趟）。 |
| 3 | 🟡 | **Fixed（并答父侧问）** | 评审明确：**收窄成立，`#1863` 不并回**（那是多批累积、另一个批次量级的面）。但措辞「§2.4/§3 整节」超出实际重读的面 ⇒ 按第 2 条改完整节后本条自然消；措辞同时改成「名点行 + §2.4 全节 + §3 的 provider 五行」。 |
| 4 | 🟡 | **Fixed** | 两套改动计数（§2.4 的 13 vs §2.8 的 16）；且 `:80` 仍写旧值 `:82`/`:96`，而盘上 `docs/core/design/MODEL-SPECS.md:1885` 已是 `:83`/`:89` —— 16 处**全部已落盘**，照 §2.2 改的人找不到旧值。⇒ 补正折进 §2.2 表（一套计数），每行加「已落 / 待落」。 |
| 5 | 🟡 | **Fixed** | 集成面只有一句话，既没说是否读过 RTM，也没给破 / 冗余 / 缺三条。⇒ 补 RTM-delta 小节（照 `docs/core/design/TIMEOUT-DIGEST.md` §9 的形）。 |
| 6 | 🟡 | **Fixed** | 缺最相近先例行。⇒ 补一行（先例坐标 + 对齐 ∥ 偏离理由）；无先例则明写「无先例」。 |
| 7 | 🟡 | **Fixed** | 缺勘察证据行。⇒ 补一行（`PROJECT-MANIFEST.json` 的 `publicRepos` 读数 + 查了哪些状态档 + 「无相关内容」）。 |
| 8 | 🟡 | **Fixed** | 同因的 `specs.mjs` 漂移未登记：`docs/core/design/MODEL-SPECS.md` 的 `:1725` 与 `:1767`（`effortDefaultFor` 实 `:43`-`:58`）· `:1228`（`[&quot;kimi&quot;,&quot;max&quot;]` 实 `:26`）· `:325`（「命中端差行返拷贝」实 `:64`）· `:251` 与 `:1778`（「102」实末行 `:89`）。⇒ 同因同处置：本批一并改这 4 处 + 2 处行数读数，不留一半在账外。 |
| 9 | 🔵 | **Fixed** | 「101 → 90 行」读数与实读差 1（末行 `:89`）⇒ 改用末行表述。 |
| 10 | 🔵 | **Fixed** | 判据 ③ 的 `doc_check` 读数无留痕 ⇒ 补一行命令与结果。 |
| 11 | 🔵 | **无需动** | 既有件三问 N/A 已有声明，记下防后续轮次误报为缺失。 |

**评审同时核了正面（下一轮可直接比对）**：

- `thincoder-vscode/src/specs.mjs` 的 `:83` / `:89` / `:85` / `:16` / `:72` 全部对上。
- `docs/core/design/MODEL-SPECS.md:1885` 与 `:958` 已是 `:83` · `:89`。
- `docs/core/design/CONTEXT-COMPACTION.md:520` / `:536` / `:254` / `:1054` 全部对上。
- `thincoder-core/provider/sse.mjs` 312 行（`armIdle` `:208`-`:224`、翻转 `:228`-`:229`、相位文案 `:218`-`:220`）。
- `thincoder-core/provider/google.mjs` 309 行（`:230`-`:245` · `:249`-`:250` · `:239`-`:241` · `:178` 缺省形）。
- `thincoder-core/provider/core.mjs` 495 行（`:265` / `:285` 传 `idleMs` + `firstChunkMs`）。

**⇒ 修正轮边界：只改 §2 的逐条表、计数、措辞与那 8 处坐标/读数，不动 §1，不动已改对的设计档行。**

### 1.8 修正轮三条上抛的裁定（父侧 2026-10-28 01:5x）

**① 派生项（`:129` 与 §3 `:172` 同形 `firstChunkMs = idleMs`）—— 裁：认可，不越界。**

理由：§1.6 裁的是「接口记法按现盘形」，射程是**同一张接口表里的同一个错形**。`:129`（`readSSE`）与 §3 `:172` 写着同一个错形，而 `thincoder-core/provider/sse.mjs:93` 与 `thincoder-core/provider/google.mjs:178` 两条签名同形（`idleMs = DEFAULT_BODY_IDLE_MS`、`firstChunkMs` 无默认值、体内 `??` 兜住）。**只改一条会留两种记法并存 —— 那正是 §1.6 要消掉的东西。** 它一并校齐是对的。

**② 待裁项（`docs/core/design/MODEL-SPECS.md:251` 的 `:22-36`/`:38-52`，`:1228` 的 `:19-21`）—— 裁：改。**

理由：这两处与它已改的 `:1725`/`:1767`/`:1228` **同档、同句族、同因**（`specs.mjs` 漂移）。它按「扩面等于新的范围决定」挂起是对的谨慎，但**同一句里改了一半、留一半错的，就是我 §1.7 判据 ① 要防的形**。⇒ 并入修正（实读表体 `:21-41`、匹配器 `:43-58`；`:19-21` 现为 docblock，前缀语义在 `:46-52`）。

**③ 知会项（§1 的「90 行」）—— 父侧已改。**

§1.2 与 §1.5 判据 ① 的「90 行」已改为「末行 `:89`」（`thincoder-vscode/src/specs.mjs` 实读 89 行）。它的上抛是对的：那两处是本席笔域，它没有写权。

### 1.9 修正轮 §2 原位重写的合规性（父侧记）

**它报：§2 是原位重写（替换原 94–216 行），不是 `batch` 追加，理由是 §1.7 要求「一套计数、一处状态」，而 `batch` 只追加、追加会留两套活口径。**

**⇒ 裁：合规。**

理由：§2 是设计席的段，**整段重写是段内的事，不是越段**；`batch append` 的追加语义确实做不到「删掉旧口径」，而留两套计数正是评审第 4 条要消的缺陷。它自己也跑了 `doc_check(mode:"gate")`（四档 PASS），补上了绕过工具的那道门。

**★ 记一条：整段重写必须自跑门并报读数 —— 这次它做了，这条记在此作为后续同类的形。**

### 1.10 第二轮评审裁定（父侧 2026-10-28 01:5x）

**评审判 changes-required：上轮 11 条 10 Fixed + 1 Accepted，新出 2 条 🔴。两条父侧已亲测证实。**

**★ 先认我自己的责任**：§1.8.② 我裁了「改」，但设计席上抛后已按「等裁定」收工，我在它收工之后才裁 —— **它守规则是对的，是我裁完没通知它。**

| # | 级 | 裁 | 处置 |
|---|---|---|---|
| 新 1 | 🔴 | **Fixed** | `docs/core/design/MODEL-SPECS.md:251` 仍写「表体 `:22-36`，匹配器 `:38-52`」（实读表体 `:21-41`、匹配器 `:43-58`）；`:1228` 仍写「前缀语义（`specs.mjs:19-21`）」（那三行现为 docblock，语义在 `:46-52`）。⇒ 改这两处；§2.4 补两行到表里（计数 24 → 26）；§2.10 上抛②「本轮未改，候裁」删掉。 |
| 新 2 | 🔴 | **Fixed** | `docs/core/design/TIMEOUT-DIGEST.md` 的 `effectiveFetchTimeoutMs` 记作 `core.mjs:72-74`（四处：`:8` / `:20` / `:57` / `:133`），而盘上 `:72` 是一行 docblock、`:73` 是声明、`:75` 是收尾 `}`。**按本批自己定的约定（声明行 → 收尾 `}`）应为 `:73-75`。** ⇒ 四处全改；§2.4 的「实读即正确」清单里去掉 `:72-74`。 |
| 新 3 | 🟡 | **Fixed** | 同因残留三处（评审列明）：`docs/core/design/MODEL-SPECS.md:305` 的「表体 `:22-36`」（实 `:21-41`）· `:358` 的「`specs.mjs:19-21`」（实 `:46-52`）· `:1214` 的「（`:27`）」（实 `:26`）。⇒ **一并改掉** —— 这三处与前四处同句族同因，留着就是「一半在账外」。 |
| 新 4 | 🔵 | **Fixed** | §2.10 上抛① 已成陈迹（§1 ≥「90 行」父侧已改，见 §1.8.③）⇒ 删或标「已收」。 |

**父侧另一件事要记**：评审报告的 host 校验器把 `core.mjs:73` 判成「file unreadable」（4 条），**那是校验器的路径解析问题，不是事实错**。父侧用 `node` 直接读了该档 `:70-77` 段，读数如下（可作为 `:73-75` 的依据）：

```
:72  /** 2026-09-01：响应头阶段超时（默认 600s，agent.fetchTimeoutMs 可配）——anthropic/responses transport 共用 */
:73  export function effectiveFetchTimeoutMs(provider) {
:74    return Number.isFinite(provider?.fetchTimeoutMs) && provider.fetchTimeoutMs > 0 ? provider.fetchTimeoutMs : 600_000
:75  }
```

### 1.11 第三轮：双口径冲突的裁定（父侧 2026-10-28 02:0x）

**设计席上抛：`docs/core/design/TIMEOUT-DIGEST.md:171`-`:175` 记 495 / 312 / 309 / 368 / 318，用的是 `split('\n').length`；而 `wc -l` 实为 494 / 311 / 308 / 367 / 317。档内另有 `docs/core/design/MODEL-SPECS.md:261` 逐字声明「行数口径统一 = `wc -l`」。**

**⇒ 父侧实测六档，差值全部为 1，冲突坐实：**

| 文件 | `split` | `wc -l` |
|---|---|---|
| `thincoder-core/provider/core.mjs` | 495 | **494** |
| `thincoder-core/provider/sse.mjs` | 312 | **311** |
| `thincoder-core/provider/google.mjs` | 309 | **308** |
| `thincoder-core/provider/anthropic.mjs` | 368 | **367** |
| `thincoder-core/provider/responses.mjs` | 318 | **317** |
| `test/RTM.md` | 263 | **262** |

**裁：统一到 `wc -l`。**

理由三条：

1. **`docs/core/design/MODEL-SPECS.md:261` 是既有规范**，不是今晚定的；`wc -l` 是项目的行数口径。
2. **同一档内两套尺**，读者按一个口径核另一个数，永远核不平 —— 这正是本批要消的形。
3. **坐标不受影响**：`:428` / `:429` / `:229` / `:252` / `:271` / `:289` 全部 ≤ `wc -l` 值，改读数不动坐标。

**⇒ 父侧自认一条**：§1.7 第 2 条裁「统一为 494」时用的是 `wc -l`，而让本轮改 `:174` / `:175` 时用的是评审报的「实读 368 / 318」（split 口径）—— **同一个批里我用了两套尺，这是本条的根因**，不是设计席的执行偏差。

**⇒ 修正轮要做的**：`docs/core/design/TIMEOUT-DIGEST.md` 全档扫行数读数，凡 split 口径的一律减 1 改成 `wc -l`，并在该档记一行口径说明；`test/RTM.md` 行数（263 → 262）若在档内出现，同改。

**⇒ 新 3 的取号偏离（`docs/core/design/MODEL-SPECS.md:358` 裁 `:46-52` 实落 `:21-41`）—— 裁：认可它的取号。** 那句名的是 `EFFORT_DEFAULT_PREFIXES` 逐档登记（表本体），不是匹配器闭包；而 `:1228` 句名「前缀语义」⇒ 取 `:46-52`。**按句意各取各号是对的，比机械照抄裁定更准。**

### 1.12 §1.11 裁定的落地核验 + 四处超出射程的裁定（父侧 2026-10-28 02:0x）

**父侧实测（`node`，六档 `wc -l` 与 `split` 逐一对照）：**

| 档 | 表里记 | 实际 `wc -l` | 判 |
|---|---|---|---|
| `thincoder-core/config.mjs` | 462 | **462** | ✓ |
| `thincoder-core/agent/completion.mjs` | 171 | **171** | ✓ |
| `docs/core/design/PROVIDER.md` | 1411 | **1411** | ✓ |
| `docs/core/design/AGENT-LOOP.md` | 636 | **636** | ✓ |
| `thincoder-core/provider/core.mjs` | 494 | **494** | ✓ |
| `thincoder-core/provider/sse.mjs` | 311 | **311** | ✓ |
| `thincoder-core/provider/google.mjs` | 308 | **308** | ✓ |
| `thincoder-core/provider/anthropic.mjs` | 367 | **367** | ✓ |
| `thincoder-core/provider/responses.mjs` | 317 | **317** | ✓ |

**裁：四处改动全部接受，不回退。**

理由三条：

1. **它改的是真错值。** 那四行不是口径差（差 1），是**旧读数本身过期**（`thincoder-core/config.mjs` 453→462 差 9 · `thincoder-core/agent/completion.mjs` 159→171 差 12 · `docs/core/design/AGENT-LOOP.md` 520→636 差 116）。按裁定字面「一律减 1」执行，只会把错值换成另一个错值 —— **那是机械执行，不是服从裁定**。
2. **它主动上抛可回退，边界守住了。** 它没有默默扩面，而是把四处理由、读数、以及「若判越界可直接回退」写进报告。这正是要的形。
3. **同因同处置是本批已立的规矩**（§1.7 第 8 条：`specs.mjs` 残留一并改，不留一半在账外）。

**⇒ 父侧自认**：射程写窄了会让人犹豫 —— 我 §1.5 判据 ② 只点 `provider/*.mjs`，而这张表是**整档的行数 + 坐标清单**，射程本该按表算而不是按文件族算。**这不是它的偏差。**

**★ 它加的 `docs/core/design/TIMEOUT-DIGEST.md:186` 口径说明行，父侧特别认可** —— 逐字：「本表每个行数 = `wc -l` 实读（项目统一口径，`docs/core/design/MODEL-SPECS.md:261`）；`split('\n').length` 会把末尾空串多算一行，本档不采用该口径。」

**理由**：口径冲突今晚出现两次（我第一次也裁错过）。只改数字不改口径说明，下一个人拿另一个工具一量还会以为数错了。**把尺写进档里，比把数改对更长效。**

**⇒ 派第三轮评审：只验 §1.11 的五处行数 + §1.12 的四处 + §2 的 35 行计数。**

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成

### 2.1 本批条目（覆盖）

- **覆盖 = 台账 `#1860`**：三处活设计档的行号坐标因产品码改动失效 ⇒ 再锚到现行号。零机制、零语义改动。
- **不覆盖**：台账其余行；`docs/core/design/MODEL-SPECS.md` · `docs/core/design/CONTEXT-COMPACTION.md` · `docs/core/design/TIMEOUT-DIGEST.md` 之外的任何文档。
- **同因外溢（父侧 `#1863`）**：`docs/core/design/MODEL-SPECS.md` 内 `provider/*.mjs` 的累积漂移成因是多批（非 B / D 两批）、
  量级等于独立一批 ⇒ 另批。本批不含，也不回退已落盘的改动。

### 2.2 最近先例（closest-precedent）

**先例坐标** = `docs/core/design/TIMEOUT-DIGEST.md:8` 与 `docs/core/design/MODEL-SPECS.md:1721` 的成文形（先例坐标 + 对齐 ∥ 偏离两栏）。

- **对齐**：纯再锚批沿用同形——只改坐标与行数读数，判据写成「被引行当行即为句中所指符号」，逐条落依据列。
- **偏离**：无。本批不改机制，没有可写的偏离项。

### 2.3 勘察证据（survey-evidence）

`PROJECT-MANIFEST.json:35` 实读 `"publicRepos": []` ⇒ 本仓未声明独立公共源文档仓，**none relevant**（无外部源文档可对位）。

查了本仓三处状态档：`docs/core/design/MODEL-SPECS.md`（§3 影响文件清单 · §12.4 / §18.4 消费面）·
`docs/core/design/CONTEXT-COMPACTION.md`（占比派生单点）· `docs/core/design/TIMEOUT-DIGEST.md`（§2.1 消费点表 · §2.4 分窗 · §3 影响文件）。

`docs/vsc/design/WEBVIEW.md` 按 §1.4 不动：该档坐标由 B 批校齐，本批不复核。

### 2.4 逐条再锚表（35 行 · 全部已落盘）

**落位 = 全表「已落盘」**。改后复扫（`grep` 实跑，射程 = 本批三档）：`specs.mjs:19-21` / `:22-36` / `:38-52` / `:55-59` / `core.mjs:72-74` / `firstChunkMs = idleMs` 六式零命中；每行「新」值在盘上现文可核。
行数读数一律 `wc -l` 实读（`node` 按 `\n` 计串得同值；`split('\n').length` 会把末尾空串多算一行，不用该口径——`docs/core/design/MODEL-SPECS.md:261` 是项目口径的既有声明）。

**`docs/core/design/MODEL-SPECS.md`（11 行）**

| 行 | 旧 → 新 | 依据（现行盘面实读） |
|---|---|---|
| `:251` | 表体 `:22-36` → `:21-41`；匹配器 `:38-52` → `:43-58`（行数读数 `89` 已是现状） | `:21` = `const EFFORT_DEFAULT_PREFIXES = [`、`:41` 收尾 `]`；`:43` = `function effortDefaultFor(model) {`、`:58` 收尾 `}`；档末行 `:89` |
| `:305` | 表体 `thincoder-vscode/src/specs.mjs:22-36` → `:21-41` | 同上表体读数 |
| `:325` | `specs.mjs:55-59` → `:64` | `:64` = `return d === undefined ? spec : { ...spec, reasoningEffortDefault: d }`——「命中端差行返拷贝」即此行 |
| `:358` | `specs.mjs:19-21` → `:21-41` | 该句名的是 `EFFORT_DEFAULT_PREFIXES` 表本体（`:21` 声明行 ~ `:41` 收尾 `]`）；旧 `:19-21` 现为 docblock 尾 + 表首行 |
| `:958` | `specs.mjs:73` / `:87` → `:83` / `:89` | `:83` = `export function ctxUsageForHistory(history, provider, ratio) {`；`:89` = `export function ctxPercentForHistory(history, provider, ratio) { … }`（面板占比两读取点） |
| `:1214` | 「`["kimi","max"]`（`:27`）」 → `（`:26`）` | `:26` = `["kimi", "max"],`；`:27` 现为 `["k3-256k", "high"],` |
| `:1228` | `["kimi","max"]` 坐标 `:27` → `:26`；「前缀语义」`specs.mjs:19-21` → `:46-52` | `:26` 同上；`:46-52` = `scan` 闭包（前缀匹配体）——旧 `:19-21` 现为 docblock |
| `:1725` | `specs.mjs:44-59` → `:43-58` | `:43` = `function effortDefaultFor(model) {`、`:58` 收尾 `}` |
| `:1767` | `specs.mjs:44-59` → `:43-58` | 同 `:1725`（同一函数、同一坐标） |
| `:1778` | 现行数 `102` → 末行 `:89` | `wc -l` 读数 89 |
| `:1885` | `specs.mjs:82` / `:96` → `:83` / `:89` | 同 `:958`；旧 `:96` 已越档尾 |

**`docs/core/design/CONTEXT-COMPACTION.md`（4 行）**

| 行 | 旧 → 新 | 依据 |
|---|---|---|
| `:254` | `specs.mjs:17` → `:16` | `:16` = `export { providerSpec, assistantToolCallMessage }`；`:17` 是空行 |
| `:520` | `specs.mjs:94` → `:83` | 该句要指的就是 `ctxUsageForHistory` 这个派生单点 |
| `:536` | `specs.mjs:94`-`96` → `:83`-`85` | `:83` 函数声明；`:85` = `return { tokens, pct: tokens ? pct : null }`（`null` 门即该行） |
| `:1054` | `specs.mjs:17` → `:16` | 同 `:254` |

**`docs/core/design/TIMEOUT-DIGEST.md`（20 行）**

| 行 | 旧 → 新 | 依据 |
|---|---|---|
| `:8` | `core.mjs:72-74` → `:73-75` | `:73` = `export function effectiveFetchTimeoutMs(provider) {`、`:75` 收尾 `}`（`:72` 是一行 docblock） |
| `:20` | `core.mjs:72-74` → `:73-75` | 同 `:8` |
| `:57` | `:72-74` → `:73-75` | 同 `:8`；该句与 `:80-83` 并列，同用「声明行 → 收尾 `}`」口径 |
| `:129` | 接口形 `{ idleMs, firstChunkMs = idleMs }` → `{ … idleMs = DEFAULT_BODY_IDLE_MS, firstChunkMs }`；`:205-214` / `:217-218` → `:207-224` / `:228-229` | `sse.mjs:93` 实形：`idleMs = DEFAULT_BODY_IDLE_MS` + 无默认值的 `firstChunkMs`；`:228` 置 `gotFirstChunk`、`:229` 调 `armIdle()`；`:207-224` 是 `armIdle` 体 |
| `:130` | 接口形同上；`:227-236` / `:239-240` → `:230-245` / `:249-250` | `google.mjs:178` 实形同 `:129`；`:230-245` 是 `armIdle` 体；`:249` 置 `gotFirstChunk`、`:250` 调 `armIdle()` |
| `:133` | `core.mjs:72-74` → `:73-75` | 同 `:8` |
| `:142` | `sse.mjs:205-214` → `:207-224` | `armIdle` 现形无 `idleMs > 0` 判式 |
| `:148` | `sse.mjs:210` → `:218-220` | `:218` 判相位、`:219` 首 chunk 文案、`:220` idle 文案 |
| `:149` | `google.mjs:232` → `:239-241` | `:239` 判相位、`:240` 首 chunk 文案、`:241` idle 文案 |
| `:157` | `sse.mjs:210` ∥ `google.mjs:232` → `:218-220` ∥ `:239-241` | 同 `:148` / `:149` |
| `:170` | 行数 `453` → `462`；`config.mjs:361-363` → `:371-372`；`:366-367` → `:375-376` | `:371-372` = `merged.provider.fetchTimeoutMs = Number.isFinite(…)` + `? merged.agent.fetchTimeoutMs : undefined`；`:375-376` = 同形 `bodyIdleTimeoutMs` 提升 |
| `:171` | 行数 `495` → `494`；`core.mjs:79-82` → `:80-83` | `:80` = `export function effectiveBodyIdleMs(provider) {`、`:83` 收尾 `}` |
| `:172` | 行数 `312` → `311`；`:203-218` → `:207-224`；接口形 `firstChunkMs = idleMs` → `idleMs = DEFAULT_BODY_IDLE_MS` + `firstChunkMs` | `:207-224` = `armIdle` 体；接口形同 `:129` |
| `:173` | 行数 `309` → `308`；`:227-240` → `:230-245` | 同 `:130` |
| `:174` | 行数 `368` → `367`；`anthropic.mjs:225` → `:229` | `:229` = `_bodyIdleMs: effectiveBodyIdleMs(provider),` |
| `:175` | 行数 `318` → `317`；`responses.mjs:248` / `:267` / `:285` → `:252` / `:271` / `:289` | 三行均为 `_bodyIdleMs: effectiveBodyIdleMs(provider),` |
| `:181` | 行数 `159` → `171`；`completion.mjs:65` → `:77` | `:77` = `if (depth === 0 && !agent.config?.agent?.engineering && !poolLive(agent) && agent.tasks.some(…)`；`:11` = `import { poolLive } from "./suspension.mjs"`（未变） |
| `:182` | 行数 `1408` → `1411` | 该行无坐标，只有行数读数 |
| `:183` | 行数 `520` → `636` | 同上 |
| `:186` | 新增一行行数口径说明（本表行数 = `wc -l`） | 同一档内两套尺会让读者永远核不平（父侧 §1.11 裁）；`docs/core/design/MODEL-SPECS.md:261` 已有同口径声明 |

**行数读数口径**：全表一律 `wc -l` 实读（`node` 按 `\n` 计串得同值）。

读数（provider 族）：`specs.mjs` 89 · `sse.mjs` 311 · `google.mjs` 308 · `anthropic.mjs` 367 · `responses.mjs` 317 · `core.mjs` 494 · `config.mjs` 462 · `completion.mjs` 171。

读数（其余）：`config-defaults.mjs` 100 · `proxy.mjs` 54 · `proxy-transport.mjs` 300 · `helpers.mjs` 500 · `subagent-async.mjs` 485 · `digest-budget.mjs` 78 · `docs/core/design/PROVIDER.md` 1411 · `docs/core/design/AGENT-LOOP.md` 636 · `test/RTM.md` 262。

两类偏差分开记：`:172`～`:175` 是**口径差**（旧值按 `split` 计，各多算末尾空串一行，改成 `wc -l` 即各减 1）；`:170` / `:181` / `:182` / `:183` 是**过期读数**（与现盘差值 +9 / +12 / +3 / +116，远超口径差的 1）⇒ 按现盘实读改写。

**实读即正确、本轮未动**（供下一轮比对）：

`docs/core/design/TIMEOUT-DIGEST.md` 内 `sse.mjs:93` · `google.mjs:139` / `:144` / `:178` · `core.mjs:265` / `:285` / `:428` / `:429` · `list-models.mjs:33` · `proxy.mjs:52` · `proxy-transport.mjs:43` / `:234` / `:104`。

`config-defaults.mjs:17` / `:30` · `helpers.mjs:157` / `:158-173` · `subagent-async.mjs:388-389` · `digest-budget.mjs:62` · `completion.mjs:11`；`docs/core/design/MODEL-SPECS.md` 的 `specs.mjs:72` 两处（`:1888` / `:1896`）。

### 2.5 机制设计

零机制：无新符号 / 新导出 / 新配置键，无行为变化。

设计面唯一动作 = 坐标与行数读数的数字替换；替换判据 = 被引行当行即为句中所指符号（§2.4 依据列逐条实读）。

### 2.6 受影响文件与测试覆盖

| 文档 | 本批改动行数 |
|---|---|
| `docs/core/design/MODEL-SPECS.md` | 11 |
| `docs/core/design/CONTEXT-COMPACTION.md` | 4 |
| `docs/core/design/TIMEOUT-DIGEST.md` | 20 |
| **合计** | **35**（全部已落盘） |

无源码改动 ⇒ 无单测文件。验收 = 坐标复扫 + 文档门（§2.7）。集成面见 §2.9。

### 2.7 验收对照（回指 §1.5 判据）

| §1.5 | 判据 | 本批读数 |
|---|---|---|
| ① | `specs.mjs:NN` 在现行档内且指对符号 | §2.4 表内出现的 `specs.mjs` 坐标 = `:16` · `:26` · `:21-41` · `:43-58` · `:46-52` · `:64` · `:83` · `:83-85` · `:89`，全部 ≤ 末行 `:89` 且逐处指对（依据列） |
| ② | `provider/*.mjs:NN` 在收窄射程内且指对内容 | 射程 = 名点行 + `docs/core/design/TIMEOUT-DIGEST.md` §2.4 全节 + §3 的 provider 五行。逐行实读：`sse.mjs` 311 行（`:93` `:207-224` `:218-220` `:228-229`）· `google.mjs` 308 行（`:139` `:144` `:178` `:230-245` `:239-241` `:249-250`）· `core.mjs` 494 行（`:73-75` `:80-83` `:265` `:285` `:428` `:429`）· `anthropic.mjs` 367 行（`:229`）· `responses.mjs` 317 行（`:252` `:271` `:289`），全部指对。同表非 provider 四行的读数与坐标同轮实读：`config.mjs` 462 行（`:371-372` `:375-376`）· `completion.mjs` 171 行（`:77` `:11`）· `docs/core/design/PROVIDER.md` 1411 行 · `docs/core/design/AGENT-LOOP.md` 636 行 |
| ③ | `doc_check(mode:"gate")` 三档全清 | 命令 = `doc_check(mode:"gate", target:"D:\teamcode\thincoder", docs:["docs/core/design/MODEL-SPECS.md","docs/core/design/CONTEXT-COMPACTION.md","docs/core/design/TIMEOUT-DIGEST.md","docs/batches/2026-10-28-design-coord-reanchor.md"])`（本批三档 + 本批档）；读数 = 首行 `DOC-CHECK GATE: PASS` · `0 段有问题（4 档全清）` |
| ④ | 无「引用的行号不存在」 | §2.4 的 35 行目标值全部 ≤ 各自档最大行号（`specs.mjs` 89 · `sse.mjs` 311 · `google.mjs` 308 · `anthropic.mjs` 367 · `responses.mjs` 317 · `core.mjs` 494 · `config.mjs` 462 · `completion.mjs` 171 · `docs/core/design/PROVIDER.md` 1411 · `docs/core/design/AGENT-LOOP.md` 636） |

### 2.8 关键决策

- **接口形按现盘写，同一张表的另两处一并校齐**：`:130` 与 `:129`（`readSSE`）、`:172` 写的是同一个错形（`firstChunkMs = idleMs`），三条同节同因。
  依据：`thincoder-core/provider/sse.mjs:93` 与 `thincoder-core/provider/google.mjs:178` 实读——两条签名同形（`idleMs = DEFAULT_BODY_IDLE_MS`，`firstChunkMs` 无默认值，体内 `firstChunkMs ?? idleMs` 兜住）。
  只改一条会留下两种记法并存，正是 §1.6 要消的那层误导。
- **一节一致**：`docs/core/design/TIMEOUT-DIGEST.md` §2.4 内同因失效的 5 处（`:142` `:148` `:149` `:157`）与 §3 的五行整节校齐——只改名点会留节内两种口径。
- **不整档重扫**：`docs/core/design/MODEL-SPECS.md` 内 `provider/*.mjs` 约 35 处指向错行，成因多批累积，量级等于独立一批 ⇒ `#1863` 另批。
- **不动 `docs/vsc/design/WEBVIEW.md`**：§1.4 明令；该档已由 B 批校到 `:83` / `:89`。
- **`docs/core/design/MODEL-SPECS.md:358` 的坐标取 `:21-41`（表本体），不取 `:46-52`**：该句名的是 `EFFORT_DEFAULT_PREFIXES` 逐档登记（表本体），
  而 `:46-52` 是匹配器 `scan` 闭包。判据 ① 要求「被引行当行即为句中所指符号」；`:1228` 句名的是「前缀语义」（匹配器）⇒ 取 `:46-52`。两侧各按各自句意取号。

### 2.9 集成测试设计（RTM delta）

**读了** `test/RTM.md`（`wc -l` 262 行；H2 = 端节、H3 = 业务故事、一行 = 一个集成用例、8 列）。与本批相关只有故事 19「首 chunk 窗」，其两行在 `test/RTM.md:230-231`（19-1 / 19-2）。

- **破 = 0 行**：19-1 断言「拿到正文答复、零 `SSE … timeout`」，19-2 断言 `no data for 0.8s` + 相位串 `sse-idle`；本批只改设计档里的坐标数字，不改任何业务可观察结果。
- **冗余 = 0 行**：故事 19 只置这两行，无重复场景。
- **缺 = 0 行**：本批零源码改动 ⇒ 没有新的组件交互可评估；且这次改动没有用户可观察入口（用户走不到一段文档坐标）。
- **唯一理由**：改动面 = 设计档行号，业务可观察结果不变。

### 2.10 未决与外溢

**① 行数口径 —— 已裁（父侧 §1.11）：统一到 `wc -l`，本批已落。**

本席上抛的六个读数（495 / 312 / 309 / 368 / 318 按 `split` 计）与 `docs/core/design/MODEL-SPECS.md:261` 声明的口径相反。父侧实测六档（`core.mjs` / `sse.mjs` / `google.mjs` / `anthropic.mjs` / `responses.mjs` / `test/RTM.md`），差值全为 1，裁定统一到 `wc -l`。

  - 落位：`docs/core/design/TIMEOUT-DIGEST.md` §3 全表按 `wc -l` 重测（§2.4 的 `:170`～`:183` 行），并新增一行口径说明（该档 `:186`）。
  - 坐标不受影响：所引 `:428` · `:429` · `:229` · `:252` · `:271` · `:289` 全部 ≤ `wc -l` 值。

**[知会] ② 扫描发现的过期读数（非口径差，已同批改正）。**

§3 全表重测时另发现四行旧值与现盘不符，差值远超口径差的 1：

- `config.mjs` 453 → **462**；两条坐标因文件增长移位：`:361-363` → `:371-372`、`:366-367` → `:375-376`（`:361-363` 现落在 compactThreshold 分支）。
- `completion.mjs` 159 → **171**（`:65` → `:77`）。
- `docs/core/design/PROVIDER.md` 1408 → **1411**。
- `docs/core/design/AGENT-LOOP.md` 520 → **636**。

理由：四行与 `:172`～`:175` 同表、同性质（读数必须是真值），留着就是同一张表里两种状态。若父侧认为四行越出本轮「一律减 1」的字面，回退这四个数与两条坐标即可，不影响其余改动。

**[知会] ③ `#1863` 另批成立**：本批不含 `docs/core/design/MODEL-SPECS.md` 的 `provider/*.mjs` 累积漂移，也不回退已落盘改动。

## §3 设计评审（评审子代理）
**状态行**：评审通过



### 轮次 1（评审子代理）

### 设计评审发现（对象 = `docs/batches/2026-10-28-design-coord-reanchor.md` §2 + 三档坐标面）

| # | 类别 | 严重度 | 问题 | 建议 |
|---|---|---|---|---|
| 1 | 需求覆盖 / 文档归属 | 🔴 | §1.6（`docs/batches/2026-10-28-design-coord-reanchor.md:53`「裁：改，按现盘形写。」）已裁定把 `docs/core/design/TIMEOUT-DIGEST.md:130` 的接口形改成与现盘同形，但 §2 的改动清单没有这一项，且 `:187` 仍写「§2.7 上抛②（`parseGeminiStream` 接口形与码不等）**仍未获裁**，按待裁处理」——同一事项在本档内两处口径相反。盘面实读：`thincoder-core/provider/google.mjs:178` 为 `export async function parseGeminiStream(response, { onToken, onReasoning, signal, idleMs = DEFAULT_BODY_IDLE_MS, firstChunkMs }) {`，而 `docs/core/design/TIMEOUT-DIGEST.md:130` 现文仍写 `parseGeminiStream(response, { idleMs, firstChunkMs = idleMs })` | 把 `docs/core/design/TIMEOUT-DIGEST.md:130` 的接口记法入 §2.2 逐条表（形 = `idleMs = DEFAULT_BODY_IDLE_MS, firstChunkMs`，同句保留「缺省 = 首挂用 `idleMs`（体内 `??`）」的语义说明），并删掉 §2.8 那句「仍未获裁」，使一处状态成立 |
| 2 | 验收判据 / 证据 | 🔴 | 判据②按父侧收窄后的射程（`:183`「§1.2 名点三处 + `docs/core/design/TIMEOUT-DIGEST.md` §2.4/§3 整节」）含 §3 整节，但 §3 三行的 `provider/*.mjs` 坐标在盘上不指对。`docs/core/design/TIMEOUT-DIGEST.md:171` 记 `:79-82`，实为 `:80-83`（`:80` 是 `export function effectiveBodyIdleMs(provider) {`、`:83` 是收尾 `}`）。同档 `:174` 记 `anthropic.mjs` `:225`，实为 `:229` 的 `_bodyIdleMs: effectiveBodyIdleMs(provider)`，且该档实读 368 行非表内 362。同档 `:175` 记 `responses.mjs` `:248`/`:267`/`:285`，实为 `:252`/`:271`/`:289`，且该档实读 318 行非表内 307。而 `docs/batches/2026-10-28-design-coord-reanchor.md:130` 断言「§2.4/§3 与 §2.1 表内 provider 引用逐行实读通过」——不成立（同档 `:57` 也写 `:79-82`）。`:167` 把 `:171` 误归到 §2.1（它是 §3 表行），收窄后的射程正把它包在内 | 二选一并在文里写死：① 上述 5 个数字在本批内校齐（`core.mjs:80-83` · `anthropic.mjs:229` + 368 · `responses.mjs:252/271/289` + 318，3 行）；② 若判成因不属 B/D 两批，则把射程措辞收窄成逐行点名（`§2.4` 全节 + §3 的 sse/google/core 五行），并把这些行连同实读读数写进上抛①清单。无论哪条，§2.5 判据②行须写出真实做过的那次读数 |
| 3 | 射程 / 口径 | 🟡 | 收窄判断本身成立：`#1863`（`docs/core/design/MODEL-SPECS.md` 全档 `provider/*.mjs` 漂移，`:144` 起列 35 处、抽样 ≥10 处指错）成因是多批累积、量级等于独立一批，并回本批会把「纯再锚」变成整档校验，不宜并回。但收窄后的措辞「§2.4/§3 整节」大于实际复核面（见 #2），措辞与动作不一致 | 保留 `#1863` 另批；把射程措辞改成与实际复核的行一一对应（点名行号），使它可被机械核 |
| 4 | 清晰度 / 文档卫生 | 🟡 | 同一批出现两套改动计数：§2.4（`:117`-`:121`）记 1 / 2 / 10 = 13 处，§2.8（`:178`）记 2 / 4 / 10 = 16 处，两处都在正文里当活口径读。`:80` 还按「旧 `specs.mjs:82`/`:96` → 新」写，而 `docs/core/design/MODEL-SPECS.md:1885` 现文已是 `:83` / `:89`（16 处改动均已在盘上，§2.8 亦自述「不回退已落盘改动」）⇒ 依 §2.2 落笔的实施轮找不到「旧值」可改 | 把补正折进 §2.2 表本身（一处计数、一处状态），并给每行加「已落 / 待落」列，使「改前 → 改后」与盘面同态 |
| 5 | 集成测试设计 | 🟡 | 只有 `:123` 一句「无源码改动 ⇒ 无单测文件；`test/RTM.md` 零 delta（本批不改任何业务可观察结果）」——理由属允许的那一条，但不是成节，且未写读没读 RTM、破 / 冗余 / 缺各几行 | 按 RTM delta 口径补一小节：读 `test/RTM.md` 的结论 + 破 0 行 / 冗余 0 行 / 缺 0 行 + 该唯一理由，与 `docs/core/design/TIMEOUT-DIGEST.md` §9 同形 |
| 6 | 方法论 · 最近先例 | 🟡 | §2 无 closest-precedent 行（同项目另两档都有：`docs/core/design/TIMEOUT-DIGEST.md:8`、`docs/core/design/MODEL-SPECS.md:1721`），无先例亦无显式声明 | 补一行：先例坐标（同形纯再锚批的坐标校齐动作）+ 对齐 / 偏离理由；确无先例则显式写「无先例」 |
| 7 | 方法论 · 勘察证据 | 🟡 | §2 无 survey-evidence 行（体例见 `docs/core/design/TIMEOUT-DIGEST.md:14` / `:25`：`index.publicRepos` 实读 + 查了哪些状态档 + 有无相关内容） | 补一行：「`PROJECT-MANIFEST.json` `publicRepos` 实读 = 空；查了 X 档 / Y 档；无相关内容」——「无相关内容」也须落字 |
| 8 | 文档归属 · 同类残留 | 🟡 | 与名点同因（`thincoder-vscode/src/specs.mjs` 因 B 批删件移位）的坐标在 `docs/core/design/MODEL-SPECS.md` 内还有未记账的。`:1725` / `:1767` 记 `specs.mjs:44-59` `effortDefaultFor`，实为 `:43`-`:58`。`:1228` 记 `["kimi","max"]`（`:27`），实为 `:26`。`:325` 记 `:55-59`「命中端差行返拷贝」，实为 `:64`。`:251` / `:1778` 记该档「**102**（2026-10-23 `wc -l`）」，现档末行 `:89`。这些既未改，也未进上抛①清单（上抛①只覆盖 `provider/*.mjs`） | 同因同处置：或在本批校齐（4 个数），或写进上抛①清单并转报告，不让「同因失效」只在部分行上被消掉 |
| 9 | 读数 · 数值漂移 | 🔵 | `:19` 与 `:42` 记该档「101 → 90 行」；实读 `thincoder-vscode/src/specs.mjs` 末行为 `:89`（89 行编号可见），判据用的也是 `:89`，行数读数差 1 | 行数读数以 `wc -l` 实测值改写，判据统一说「末行 `:89`」而非行数 |
| 10 | 验收 · 可核性 | 🔵 | `:131` 记判据③「`doc_check(mode:"gate")` 三档全清 · 交付前已跑，0 命中」，未附读数（命令 + 输出），本轮无法复核 | 附一行读数（命令与命中数），使该判据可被下一轮机械复核 |
| 11 | 其它 | 🔵 | 判据 11（既有件三问）本批不适用：§2.3（`:113`）声明零新符号 / 零导出 / 零配置键，属合理缺省 | 无需动作，记录以免下一轮当作缺项 |

**计数**：🔴 2 · 🟡 6 · 🔵 3

**已实读核对通过的部分（供下一轮对照）**：

- `thincoder-vscode/src/specs.mjs`：`:83` = `ctxUsageForHistory` · `:89` = `ctxPercentForHistory` · `:85` = `return { tokens, pct: tokens ? pct : null }` · `:16` = `export { providerSpec, assistantToolCallMessage }` · `:72` = `effortEnumForModel` 读 `spec.thinking` 处。
- `docs/core/design/MODEL-SPECS.md:1885` / `:958` 现文已是 `:83` · `:89`。
- `docs/core/design/CONTEXT-COMPACTION.md:520` = `:83` · `:536` = `:83`-`85` · `:254` / `:1054` = `:16`。
- `thincoder-core/provider/sse.mjs` 312 行：`armIdle` 体 `:208`-`:224` · 翻转 `:228`-`:229` · 相位文案 `:218`-`:220`。
- `thincoder-core/provider/google.mjs` 309 行：`:230`-`:245` · `:249`-`:250` · `:239`-`:241` · `:178` 形参缺省。
- `thincoder-core/provider/core.mjs` 495 行：`:265` / `:285` 两处 `readSSE` 带 `idleMs` + `firstChunkMs`。

VERDICT: changes-required

### 轮次 2（评审子代理）

### 轮次 2 复核（对象 = `docs/batches/2026-10-28-design-coord-reanchor.md` §2 + 三档坐标面）

**上轮 11 条**：🔴2 全 Fixed · 🟡6 全 Fixed · 🔵3 中 2 Fixed、1 Accepted（无需动）。

**本轮新增**：🔴 2 · 🟡 1 · 🔵 1。

| # | 原# | 文件 | 级别 | 状态 | 说明 |
|---|---|---|---|---|---|
| 1 | 1 | `docs/batches/2026-10-28-design-coord-reanchor.md` | 🔴 | Fixed | §2.4 `:130` 行已收接口形进表；§2.8 的「仍未获裁」已删；`docs/core/design/TIMEOUT-DIGEST.md:130` 现文 = `idleMs = DEFAULT_BODY_IDLE_MS, firstChunkMs`，与 `thincoder-core/provider/google.mjs:178` 同形 |
| 2 | 2 | `docs/core/design/TIMEOUT-DIGEST.md` | 🔴 | Fixed | §3 三行实读对齐：`:171` `:80-83`（`core.mjs:80` 声明 / `:83` 收尾）· `:174` `anthropic.mjs:229` + 368 行 · `:175` `responses.mjs:252/271/289` + 318 行；§2.7 判据②行改为收窄射程并列读数 |
| 3 | 3 | `docs/batches/2026-10-28-design-coord-reanchor.md` | 🟡 | Fixed | 收窄成立、`#1863` 不并回；§2.7 ② 射程措辞改为逐行点名 |
| 4 | 4 | `docs/batches/2026-10-28-design-coord-reanchor.md` | 🟡 | Fixed | 单一计数 24（§2.4 标题与 §2.6 表一致）；逐行状态列已加，13 / 11 与行内状态自洽 |
| 5 | 5 | `docs/batches/2026-10-28-design-coord-reanchor.md` | 🟡 | Fixed | §2.9 RTM-delta 成节；实读 `test/RTM.md` 263 行、故事 19 两行在 `:230-231`，破 / 冗余 / 缺各 0 + 唯一理由 |
| 6 | 6 | `docs/batches/2026-10-28-design-coord-reanchor.md` | 🟡 | Fixed | §2.2 closest-precedent 行已补（对齐 / 偏离两栏） |
| 7 | 7 | `docs/batches/2026-10-28-design-coord-reanchor.md` | 🟡 | Fixed | §2.3 survey-evidence 行已补；`PROJECT-MANIFEST.json:35` 实读 `"publicRepos": []` 对得上 |
| 8 | 8 | `docs/core/design/MODEL-SPECS.md` | 🟡 | Fixed | `:325` → `:64` · `:1228` → `:26` · `:1725` / `:1767` → `:43-58` · `:251` / `:1778` → 末行 `:89` 均已在盘上，与实读一致 |
| 9 | 9 | `docs/batches/2026-10-28-design-coord-reanchor.md` | 🔵 | Fixed | §1.2 / §1.5 已改「末行 `:89`」 |
| 10 | 10 | `docs/batches/2026-10-28-design-coord-reanchor.md` | 🔵 | Fixed | §2.7 ③ 已附命令与读数 |
| 11 | 11 | `docs/batches/2026-10-28-design-coord-reanchor.md` | 🔵 | Accepted | 既有件三问 N/A 有声明，无需动 |
| 12 | (new) | `docs/core/design/MODEL-SPECS.md` | 🔴 | New | §1.8.②「裁：改」的两处未落、未进 §2.4，§2.10 仍写「本轮未改，候裁」。盘面：`:251` 仍 `表体 :22-36，匹配器 :38-52`（实 `EFFORT_DEFAULT_PREFIXES` 在 `src/specs.mjs:21-41`、`effortDefaultFor` 在 `:43-58`）；`:1228` 仍 `specs.mjs:19-21`（父侧裁改 `:46-52`） |
| 13 | (new) | `docs/core/design/TIMEOUT-DIGEST.md` | 🔴 | New | `:133` 记 `core.mjs:72-74`，实 `:73-75`（`core.mjs:73` = `export function effectiveFetchTimeoutMs(provider) {`，`:75` = `}`，`:72` 是 docblock）。同档 `:57` 一行内并用两种边界口径（`:80-83` 与 `:72-74`）；`:133` 落在收窄射程的「§2.4 全节」内，而 §2.4 第 185-186 行把它列为「实读即正确」 |
| 14 | (new) | `docs/core/design/MODEL-SPECS.md` | 🟡 | New | 同因残留仍未记账：`:305` `specs.mjs:22-36`、`:358` `specs.mjs:19-21`、`:1214` `["kimi","max"]`（`:27`，实 `:26`） |
| 15 | (new) | `docs/batches/2026-10-28-design-coord-reanchor.md` | 🔵 | New | §2.10 上抛① 已成陈迹（§1.8.③ 已记父侧改毕），仍在请父侧收正 |

**计数**：🔴 2 · 🟡 1 · 🔵 1（本轮新增）；上轮 11 条 = Fixed 10 · Accepted 1。

VERDICT: changes-required

### 轮次 3（评审子代理）

### 轮次 3 复核（§1.11 双口径裁定落地 + §1.12 四处超射程接受）

判法：档末内容行号 + 尾部空行 ⇒ split 值 − 1 = `wc -l`。

**① 五处行数（`docs/core/design/TIMEOUT-DIGEST.md` §3）**

- `thincoder-core/provider/core.mjs`：记 494，末内容行 494 `}`、495 空 ⇒ ✓
- `thincoder-core/provider/sse.mjs`：记 311，末内容行 311 `}`、312 空 ⇒ ✓
- `thincoder-core/provider/google.mjs`：记 308，末内容行 308 `}`、309 空 ⇒ ✓
- `thincoder-core/provider/anthropic.mjs`：记 367，末内容行 367 `}`、368 空 ⇒ ✓
- `thincoder-core/provider/responses.mjs`：记 317，末内容行 317 `}`、318 空 ⇒ ✓

同口径抽验：`thincoder-vscode/src/specs.mjs` 89（split 90）· `test/RTM.md` 262（split 263）。

**② 口径说明行**

`docs/core/design/TIMEOUT-DIGEST.md:186` 在，明写「本表每个行数 = `wc -l` 实读」，注明项目口径来源，并写明不用 `split('\n').length`。⇒ 通过。

**③ 四处超射程与连带坐标**

- `thincoder-core/config.mjs`：记 462，实读 463 行 ⇒ wc -l 462 ⇒ ✓
- `thincoder-core/agent/completion.mjs`：记 171，实读 172 行 ⇒ 171 ⇒ ✓
- `docs/core/design/PROVIDER.md`：记 1411，实读 1412 行 ⇒ 1411 ⇒ ✓
- `docs/core/design/AGENT-LOOP.md`：记 636，实读 637 行 ⇒ 636 ⇒ ✓
- 连带坐标一：`thincoder-core/config.mjs:371-372` = `provider.fetchTimeoutMs` 提升两行 ⇒ 对。
- 连带坐标二：`thincoder-core/config.mjs:375-376` = `bodyIdleTimeoutMs` 同形提升 ⇒ 对；`:361-363` 现落 compactThreshold 分支。
- 连带坐标三：`thincoder-core/agent/completion.mjs:77` = `!poolLive(agent)` 合取行 ⇒ 对。
- 连带坐标四：`thincoder-core/agent/completion.mjs:11` = `import { poolLive } from "./suspension.mjs"` ⇒ 对。

**④ 35 行计数**

- 11 行 = `docs/core/design/MODEL-SPECS.md`：`:251` `:305` `:325` `:358` `:958` `:1214` `:1228` `:1725` `:1767` `:1778` `:1885`
- 4 行 = `docs/core/design/CONTEXT-COMPACTION.md`：`:254` `:520` `:536` `:1054`
- 20 行 = `docs/core/design/TIMEOUT-DIGEST.md`：`:8` `:20` `:57` `:129` `:130` `:133` `:142` `:148` `:149` `:157`
- 续上 10 行：`:170` `:171` `:172` `:173` `:174` `:175` `:181` `:182` `:183` `:186`
- 合计 35，与 `§2.6` 表 11 / 4 / 20 / 合计 35 逐格相符。

**⑤ split 残留**

三档全档 grep `495|312|309|368|318|split\(` 只命中口径说明行本身，无 split 口径读数残留。

§3 其余行读数抽验（均为 wc -l）：`thincoder-core/config-defaults.mjs` 100 · `thincoder-core/proxy.mjs` 54。

续：`thincoder-core/proxy-transport.mjs` 300 · `thincoder-core/agent/helpers.mjs` 500 · `thincoder-core/agent-tools/digest-budget.mjs` 78。

**上轮 15 条复核**

| # | 原# | 级别 | 状态 | 说明 |
|---|---|---|---|---|
| 1 | 1 | 🔴 | Fixed | `§2.4` 收 `:130` 行；`docs/core/design/TIMEOUT-DIGEST.md:130` 接口形按现盘 |
| 2 | 2 | 🔴 | Fixed | §3 三行指对：`:171` `:80-83` · `:174` `:229` · `:175` `:252`/`:271`/`:289` |
| 3 | 3 | 🟡 | Fixed | `§2.7` ② 射程 = 名点行 + §2.4 全节 + §3 provider 五行 |
| 4 | 4 | 🟡 | Fixed | 单一计数 35（`§2.4` 标题 ∥ `§2.6` 合计） |
| 5 | 5 | 🟡 | Fixed | `§2.9` RTM-delta 成节；`test/RTM.md` wc -l 262、两行 `:230-231` |
| 6 | 6 | 🟡 | Fixed | `§2.2` closest-precedent 两栏在 |
| 7 | 7 | 🟡 | Fixed | `§2.3` survey-evidence 在；manifest 的 publicRepos 读数为空 |
| 8 | 8 | 🟡 | Fixed | `docs/core/design/MODEL-SPECS.md`：`251`/`1778` 89 · `325` `:64` · `1228` `:26` |
| 9 | 9 | 🔵 | Fixed | `§1.2` / `§1.5` 已改末行 `:89` |
| 10 | 10 | 🔵 | Fixed | `§2.7` ③ 命令 + `DOC-CHECK GATE: PASS` 读数 |
| 11 | 11 | 🔵 | Accepted | `§2.5` 零机制，既有件三问 N/A 有声明 |
| 12 | n12 | 🔴 | Fixed | `:251` 现 `体 :21-41` / `器 :43-58`；`:1228` 现 `:46-52`；候裁句已删 |
| 13 | n13 | 🔴 | Fixed | 四处 `:8` `:20` `:57` `:133` 改 `thincoder-core/provider/core.mjs:73-75` |
| 14 | n14 | 🟡 | Fixed | `:305` `:21-41` · `:358` `:21-41` · `:1214` `:26` |
| 15 | n15 | 🔵 | Fixed | `§2.10` ① 改为已裁并已落 |

复扫（三档射程）：`specs.mjs:19-21|:22-36|:38-52|:55-59|:44-59|core.mjs:72-74|firstChunkMs = idleMs` 零命中。

**计数**：本轮 🔴 0 · 🟡 0 · 🔵 0；上轮 15 条 = Fixed 14 · Accepted 1。

VERDICT: pass

## §4 用户批准（主 agent）

### 4.1 用户批准（2026-10-28 01:47）

**用户逐字**：「都自动跑完」—— 整批令覆盖本批全链（FR36）。

**⇒ 本批批准面 = §2 的 35 行再锚表（11 + 4 + 20）+ 口径统一 + 三轮评审 pass 结论。**

**⇒ 本批零产品码、零测试档 —— 唯一变更面 = 三份设计档（`docs/core/design/MODEL-SPECS.md` · `docs/core/design/CONTEXT-COMPACTION.md` · `docs/core/design/TIMEOUT-DIGEST.md`）。**

## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）

### 6.1 父侧核验与收口（2026-10-28 02:0x）

### 6.2 父侧亲测读数（`node` 脚本，非引用设计席或评审报告）

| 档 | 档内记 | 实际 `wc -l` | 判 |
|---|---|---|---|
| `thincoder-core/provider/core.mjs` | 494 | **494** | ✓ |
| `thincoder-core/provider/sse.mjs` | 311 | **311** | ✓ |
| `thincoder-core/provider/google.mjs` | 308 | **308** | ✓ |
| `thincoder-core/provider/anthropic.mjs` | 367 | **367** | ✓ |
| `thincoder-core/provider/responses.mjs` | 317 | **317** | ✓ |
| `thincoder-core/config.mjs` | 462 | **462** | ✓ |
| `thincoder-core/agent/completion.mjs` | 171 | **171** | ✓ |
| `docs/core/design/PROVIDER.md` | 1411 | **1411** | ✓ |
| `docs/core/design/AGENT-LOOP.md` | 636 | **636** | ✓ |

**九个数全对，口径一致（`docs/core/design/TIMEOUT-DIGEST.md:186` 已声明「本表行数 = `wc -l`」）。**

### 6.3 交付对照

| 条目 | 状态 | 读数 |
|---|---|---|
| §2.4 再锚表 35 行 | ✅ 完成 | 11（`docs/core/design/MODEL-SPECS.md`）+ 4（`docs/core/design/CONTEXT-COMPACTION.md`）+ 20（`docs/core/design/TIMEOUT-DIGEST.md`）= 35，与 §2.6 合计同值 |
| 行数口径统一 | ✅ 完成 | 全表按 `wc -l` 重测；`split` 口径退役并写进口径说明行 |
| 三轮评审 | ✅ 完成 | changes-required（🔴2 🟡6 🔵3）→ changes-required（🔴2 🟡5 🔵2）→ **pass（🔴0）** |

### 6.4 未覆盖面（如实）

1. **本批只管坐标、行数与一处说法** —— 不校机制语义。`docs/core/design/TIMEOUT-DIGEST.md` 与 `docs/core/design/MODEL-SPECS.md` 里若还有**说法与代码不符**，不在本批射程（那类要另立判据、另批）。
2. **`docs/core/design/MODEL-SPECS.md:261` 的「各节读数按各自取数日期登记」** —— 该处列了 9 个旧读数（含 `specs.mjs` 84），与同档 `:251` 的 89 并不同源；档内已有「按各自取数日期」声明，本批未动。
3. **口径冲突今晚出现两次，根因在父侧**：我第一次裁「统一 494」用 `wc -l`，第二次裁 `:174`/`:175` 却用了评审报的 `split` 值 —— 同一个批用了两套尺。**设计席上抛此条是对的。**

### 6.5 结算清单

- **§2 ↔ 设计档对账**：35 行逐条对现文，一致。
- **前批遗留交叉核**：无（本批独立）。
- **修正轮落地前提**：三轮修正均已落、复评 pass。
- **用户面同步**：无用户可见能力变化 ⇒ 一行「无」。
- **台账沉降**：`#1861`。
- **`#1863` 另批成立**：本批不含该档 `provider/*.mjs` 的累积漂移（那一批已由 `#1864` 单独做完）。

### 6.6 §5 处置

**不适用** —— 本批唯一变更面是三份设计档，产品码 / 测试档零改动。改动由设计席在自己拥有的段内完成，无工程实施内容。
