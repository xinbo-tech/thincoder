# 编辑共享 helper 权威语义（EDIT-HELPERS）· 编辑工具板块

> 板块 = **编辑工具（共享底层）**；本档 = 编辑工具族共享 helper 语义的**唯一权威**（`docs/core/design/EDIT.md` / `HASHLINE-EDIT.md` / `APPLY-PATCH.md` / `WRITE.md` / `INSERT-AFTER.md` 指向此处，不得在别处复制）。
> 行号锚护栏（edit / insert_after 共用判据）= 本档 §7。
> 地图与契约要点 = `docs/core/design/TOOLS.md` §6.6（末段「共享 helper 权威 = 编辑辅助面」）。
> 双端：CLI `thincoder-core/tools/shared.mjs` · VSC `thincoder-vscode/src/tools/shared.mjs`（helper 语义同，各自实现；VSC 另有编辑器路径专属面——§6）。
> 需求侧 = `docs/core/requirements/TOOLS.md`（工具系统板块；CLI 树无逐工具需求档）。

## 1. 定位

编辑工具族（edit / apply_patch / hashline_edit / write / insert_after）共用的**行尾语义 + 失败候选 + 编码探测** helper，以及 edit / insert_after 共用的**行号锚护栏判据**（§7）——Windows 环境行尾错乱与失败黑盒的根治层。

模型在 CRLF 文件上频繁踩坑（`old_string not found` / 写回混合行尾）⇒ 统一底层语义一次修好。

## 2. 共享 helper（语义权威）

```js
detectFileEol(text) → "\r\n" | "\n"
  // 首个换行符的类型：文件中第一个换行符是 "\r\n" 则整文件按 CRLF 恢复；是 "\n"（裸）或无换行符按 LF
joinWithEol(lines, text) → lines.join(detectFileEol(text))
majorityEol(dirPath) → "\r\n" | "\n"
  // 目录下 ≤20 个文件的多数派（每文件只读首 4KB 判首行换行符）；空目录/平票 → "\n"
findCandidates(lines, oldString, topN=3, threshold=0.5) → [{ line, preview, score }]
  // LCS 行级相似度；score = LCS(old_string, line).length / max(len)；≥ threshold 才进候选
```

**坐标**：`thincoder-core/tools/shared.mjs:67`（`detectFileEol`）· `:73`（`joinWithEol`）· `:82`（`majorityEol`）· `:142`（`findCandidates`）· `:162`（`FFFD_WARNING`）。

## 3. 语义约束（helper 级）

- **detectFileEol**：不按 `\r\n` 计数（混合文件会误判），按**第一个换行符的类型**——文件首行末尾是 `\r\n` 则整文件按 CRLF 恢复（首行风格代表文件惯例）；无换行符按 LF。
- **findCandidates 阈值 / 预算**：`score = LCS(old_string, line).length / max(len(old_string), len(line))`，≥0.5 才进候选；top 3。参与 LCS 的 `old_string` 与行**各截断到 500 字符**再算分（防 minified 爆预算；预览本就截 80 字符）。
  - `old_string` 多行时**只对首行**找候选（输出前缀标 `old_string line 1:`——多行 `old_string` 的失败通常首行对不上，各报 top 3 噪音大）；
  - **行数上限**：超过 5000 行只扫前 5000 行（失败路径单文件 <1MB 下 <10ms 的 NFR 兜底）。
- **majorityEol 性能**：最多扫 20 个文件、每文件只读首 4KB 判首行换行符——目录内文件多也不慢；`write` 调用路径上的开销可忽略。

## 4. 行尾语义（消费方现行行为）

**写回恢复（F1）**：

```text
edit / apply_patch / hashline_edit 改既有文件:
  readFile → normalizeEOL（匹配层——LF 域内操作） → 应用替换/hunk
    → 写回：detectFileEol(原文) → lines.join(原行尾)（F1）
```

**新建跟随目录（F2）**：

```text
write / apply_patch 新建文件:
  → majorityEol(目录) → join(多数派行尾)（默认 LF；CRLF 多数派 → CRLF）
```

**行为兼容与性能**：LF 文件行为不变（normalizeEOL 已是现状）；CRLF 文件的变化仅限**写回行尾**（不再被转成 LF）。相似度计算仅走失败路径——单文件 <1MB 时 <10ms；无新依赖。

## 5. 编码探测（F4）

hashline_edit 读入含 U+FFFD 时追加（**不阻断**）：

```text
⚠ file contains U+FFFD (replacement char) — encoding may be corrupted; hash-based addressing may be unreliable. Consider fixing the file encoding first.
```

实现 = `shared.mjs` 具名常量 `FFFD_WARNING`（`thincoder-core/tools/shared.mjs:162`），由 hashline_edit 在结果文本（成功路径与 not-found 错误）末尾追加。

## 6. 实现单一权威与端差

- **CLI**：`thincoder-core/tools/shared.mjs`（四 helper + `FFFD_WARNING`）——edit / apply_patch / hashline_edit / write 同写路径共用。
- **VSC**：helper 语义同、各自实现；另有 `lfOffsetToRaw`（VS Code 编辑器路径 range 偏移——**端专属**，见 VSC 树档）。
- **消费点**：edit（失败接 `findCandidates` / 写回 `joinWithEol`）· hashline_edit（写回 + U+FFFD 警告）· apply_patch（写回 + 新建 `majorityEol`）· write（覆盖按原行尾 F1、新建按 `majorityEol` F2）。
- **行号锚护栏**：判据与拒文住 `thincoder-core/tools/write-path.mjs`（与记账面同档——§7）；消费点 = edit 行号形（`thincoder-core/tools/edit-diff.mjs` 单形态 · `thincoder-core/tools/edit-batch.mjs` 批量）· insert_after（`thincoder-core/tools/file.mjs`）。

**VSC 端差异（编辑器路径面）**——VSC 端 `thincoder-vscode/src/tools/shared.mjs` 另有编辑器路径专属 helper `lfOffsetToRaw`（CLI 无此路径——坐标系 = LF 域偏移 → CRLF 原文偏移）。

非 replace_all 走 range 编辑偏移映射（保留 undo 粒度 / 光标 / 折叠 / 大文件性能）；replace_all 补 EOL 还原（不静默丢 CRLF）。

hash 域统一（stripBom + normalizeEOL——CRLF 尾 `\r` / BOM 首行不哈希失配）；hashline_edit BOM 还原（磁盘写回带 BOM、编辑器分支不带——防双 BOM）。

getOpenDoc win32 盘符大小写归一（消除 split-brain）；insert_after 编辑器分支换行符按 fileEol（消除 `$` 锚失配与混合 EOL 注入）。消费点 = `{file-edit,hashline-edit,more-file}.mjs`。

本仓检出 EOL 约定（`.gitattributes` = `* text=auto eol=lf`）与 CLI 仓逐字节同源（各端自持）。

## 7. 行号锚护栏（edit / insert_after 共用的唯一判据）

行号是最易漂移的定位方式：模型给出的行号来自它上一次 `read`，那之后任何一次写都让行号整体错位。
错位**不报错**——它改到隔壁几行上，回执仍写成一次成功。本节是这条漂移的唯一判据（edit 行号形 · insert_after 的 `after_line` 同一判据，两处不得各写一套；覆盖的写通道见 §7.4）。

### 7.1 判据（`lastWrite` 分类 + `isDirty`，六行按序判）

记账快照 = `{ type, startLine, shift }`，容器 = `thincoder-core/tools/write-path.mjs` 的模块级 `lastWrites`。判据 = 同档具名导出 `lineAnchorVerdict(abs, startLine, endLine)`：六行按序判，放行返 `null`、拒绝返命中行的 `{ row, startLine, shift }`（`row` = 六行表中的行号）。判定按序，命中即拒：

| # | 当前记账态 | 处置 | 理由 |
|---|---|---|---|
| 1 | 无 `lastWrite` 且非 dirty | 放行 | 无漂移证据 |
| 2 | `isDirty` 且 `lastWrite` 在场 | 拒 | 快照陈旧：之后有一笔写只落了 dirty 没更新快照，`startLine` 不再可信 |
| 3 | `type === "write"`（全文重写） | 拒 | 全文换过 ⇒ 任何行号都可能漂移，无未受影响区 |
| 4 | `type ∈ {edit, insert}`，目标区整体在 `startLine` 之前 | 放行 | 未受影响区的行号没有变 |
| 5 | `type ∈ {edit, insert}`，其余位置 | 拒（文案带漂移量 `±shift`） | 目标区落在受影响区内或其下——行号已被自己的上一笔顶偏 |
| 6 | 无 `lastWrite` 但 `isDirty` | 拒 | 盘面被本进程的写点改过，行号不可断言 |

**第 2 行为什么单列**：`recordWrite` 记完快照即清 dirty（`thincoder-core/tools/write-path.mjs` 的 `recordWrite` 体内 `lastWrites.set` 之后 `dirtyPaths.delete(abs)`），所以「dirty ∧ 快照在场」只可能来自一笔不更新快照的写。缺这一行，该格落到第 4 行，拿陈旧 `startLine` 判「目标区在之前 ⇒ 放行」，被那笔写顶偏的行照样静默改错。

**apply_patch 落在哪一行**：`thincoder-core/tools/patch.mjs` 的批级记账循环 `for (const p of planned) { markDirty(p.abs); clearLastWrite(p.abs) }` 只记 dirty 并清掉旧快照 ⇒ apply_patch 之后是「无快照 ∧ 脏」= 第 6 行。第 2 行接的是任何「只落 dirty、不清快照」的写；清快照是 `patch.mjs` 那笔的义务，不是判据的自动行为。

**「整体在之前」的边界按记账类型分**（理由：替换要读也写目标行，插入只落在两行之间）：

| 记账类型（`lastWrite.type`） | 放行条件 | 理由 |
|---|---|---|
| `insert`（`startLine` = 被插入处的目标行） | `endLine <= startLine`；单行形 `line <= startLine` | 那一行内容没变，它上面也没有行移动——改它不产生漂移 |
| `edit`（核内 `edit` / `hashline_edit` / 批量组均记这一型） | `endLine < startLine`；单行形 `line < startLine` | 被替换的那一行若已被改过，就早已不是模型看到的那一行 |
| `insert_after` 的 `after_line` | `after_line <= startLine` | 插入落在两行之间，不读写目标行内容 |

三行合起来一句话：`insert` 记录下 `edit` 同一行合法，`edit` 记录下再改同一行不合法。

**无行号目标 ⇒ 只判第 1 / 2 / 6 行**：`startLine == null` 的调用（`insert_after` 的 `after_regex` 形）没有模型给的行号，而第 3–5 行判的正是「模型给的行号」⇒ 无从判。判据判到记账态这一层即放行，与该形改前的行为同判（`after_regex` 的定位在工具内按当前盘面做，不用旧行号）。

### 7.2 拒文（单点构造，两端不各写一句）

拒文由 `thincoder-core/tools/write-path.mjs` 的具名导出 `lineAnchorRefusal(abs, startLine, endLine)` 产出（与 `dirtyRefusalMessage` 同处；内部取 `lineAnchorVerdict` 的事实），四要素固定：

1. 哪一档（路径）与漂移事实——上次写入点 `L<startLine>`、漂移量 `±shift`；全文重写直说整文件已重写；第 2 / 6 行报不出这两个数，首句见下（逐字）；
2. 下一步一（必给）：重新 `read` 取新行号；
3. 下一步二（同给）：改走**位置无关寻址**——内容形态 `old_string`，或 `hashline_edit`；
4. 该路的成立条件（见下）。

**拒文逐字**（实施照抄；语言 = 英文，理由见下）：

```text
<path> — these line numbers are stale: the last write to this file was at L<startLine>
(line numbers are now offset by <±shift>), and the target range <range> falls inside or below it.
Editing by the old numbers would land on the wrong lines and still report success.
Two ways on:
  1. read this file again and retry with the new line numbers;
  2. address the region without line numbers — pass its current content as old_string, or use hashline_edit,
     which needs old_hashes from a read with hashes=true and is only valid while that block's content is unchanged.
```

**第 3 行（全文重写）首句**（其余三要素同第 1 格）：

```text
<path> — these line numbers are stale: this file was rewritten in full by a write since your last read,
so no line number from that read can still be trusted.
```

**第 2 行（脏 ∧ 陈旧快照）首句**（其余三要素同第 1 格）：

```text
<path> — these line numbers are stale, and the drift cannot be measured: a write in this session changed
this file after the recorded write point, so neither that line nor an offset from it can be trusted.
```

**第 6 行（无快照但 dirty）首句**（其余三要素同第 1 格）：

```text
<path> — this file was modified since your last read; line numbers may be stale, and there is no recorded
write point to check them against.
```

第 2 行不报 `L<startLine>` / `±shift`：那个值正是本行判它不可信的那个数，照填等于把不可信的数字递给模型。第 6 行没有快照 ⇒ 没有行、没有漂移可报，措辞对齐 `thincoder-core/tools/file.mjs` 的 `read` 工具 `execute` 里那句（`was modified since your last read — line numbers may be stale.`）。

第 3 项为什么必须给：本仓的权威档很大（`docs/core/design/PROMPT-SYSTEM.md` 一份 832KB），「重新 read」在那种档上是按页读的整轮开销。只给第 2 步，等于让模型在最贵的路径上重来；点名位置无关的那条路，才是把「不许用旧行号」变成「用对的方式改这一处」。

**第 4 项为什么必须给**：`hashline_edit` 要 `old_hashes`，来源是 `read hashes=true`。没用 hashes 读过的模型拿不到这组哈希，那条路对它是整页重读；目标块内容真变过时它还会合法 not-found。不写成立条件，拒文就把一条有代价的路说成免费的替代。

**语言 = 英文**：拒文在 `thincoder-core/tool-docs/edit.md` / `thincoder-core/tool-docs/insert_after.md` 里被逐字引用为错误形态。两描述档是英文，拒文若是中文，模型会看到同一条消息的两种写法，把引用那一版当成另一种错误。现盘 `thincoder-core/tools/file.mjs` 的 `insertAfterTool.execute` 里那两句中文拒文随之收正为同一构造器。

**`insert_after` 的判定有一处会变，别处不变**：现码 `if (lw && args.after_line != null) { … } else if (isDirty(abs)) {` 在快照在场时根本不问 `isDirty`——「脏 ∧ 陈旧快照」今天放行，§7.1 第 2 行改为拒。方向 fail-closed（更严），不产生静默改错；其余五行与现码逐行同判。

**描述面落点（实施照抄）**：

| 档 | 位置 | 逐字 |
|---|---|---|
| `thincoder-core/tool-docs/edit.md` | Notes 段末条（`use the most recent read …`）之前插入一条 | `- **Line-number anchoring**: \`line\` / \`startLine\`+\`endLine\` are judged against the last write to that file: inside or below that write's affected range, or when the file was written after it without updating that anchor, the call is refused — naming the path, the drift (\`L<startLine>\`, \`±shift\`) and two ways on (re-read, or address the region without line numbers).` |
| `thincoder-core/tool-docs/edit.md` | `**Batch multiple changes into ONE call via the edits array**` 段末追加一句 | `Line-number entries in one \`edits\` array apply first, in descending \`startLine\` order, so each is anchored on the numbers you read; their ranges must not overlap (overlap ⇒ the whole batch is refused, nothing written). Content entries then apply in array order. The receipt stays in call order.` |
| `thincoder-core/tool-docs/insert_after.md` | `- **Read-before-insert guard**` 条整条替换 | `- **Read-before-insert guard**: \`after_line\` is judged against the last write to that file — a line at or above that write's write point is allowed; inside or below it, or when the file was written after it without updating that anchor, the call is refused with the path, the drift and two ways on (re-read, or address the region without line numbers).` |
| `thincoder-core/tools/file.mjs` | `editTool.parameters.edits.description` 里那段应用序（现文说 same-file entries apply serially，与 R1–R4 相抵） | `Batch form — multiple edits in ONE call, atomic (any failure writes nothing; line-number entries apply first, in descending startLine order, and their ranges must not overlap — overlap refuses the whole batch; content entries then apply in array order).` |

### 7.3 批量帧（`edit` 的 `edits` 数组同档多条）

同档多条行号条目只有一种可解坐标系：**模型 `read` 到的那一份内容**——它没看过自己前几笔的结果，写不出第二套行号。据此四条规则：

| # | 规则 | 内容 | 理由 |
|---|---|---|---|
| R1 | 行号先应用 | 同档组内行号条目先全部应用，内容条目随后 | 内容匹配与位置无关，先后都不影响它；行号必须锚在快照上 |
| R2 | 降序应用 | 行号条目按 `startLine` 降序应用 | 从下往上改，上方行号不被同批自己顶偏——组内漂移本工具算得出来，按快照解释才是模型的意图 |
| R3 | 重叠拒 | 两条行号条目的范围在快照坐标上重叠 ⇒ 整批拒（原子，零写） | 重叠时「先改哪条」决定结果，模型意图在此矛盾，猜一个即替它做决定 |
| R4 | 内容条目按调用序 | 内容条目仍按数组序串行累积（现行语义不变） | 位置无关寻址没有帧问题 |

回显顺序仍是调用序——**按条目在 `edits` 数组里的原始下标排**（R2 只改应用顺序）。跨文件交错的批同样如此：按文件分组去排会排成 A、A、B，而模型是按位置对号的，顺序一变它会把结果贴到错的那一笔上。

**回执里的档名取组内首现拼写**（批末汇总行同此）：同一档在一批里出现两种拼写（`./a.md` 与 `a.md`）时，组内每条回执都报第一条的写法。理由：模型按条目位置对号，不按拼写对号；逐条比对拼写要为一次回执多读一次原名，收益远小于成本。

**判定点（写死，不留选择）**：批量在组循环**之前**用批前快照判一次。`thincoder-core/tools/edit-batch.mjs` 的 `applyEditBatch` 在 `for (const g of groups.values())` 之前，对组内每个 `abs` 跑一遍 §7.1 的判据，命中即抛、零写。组内不再逐条判——组内漂移由 R2 自己算得出来，逐条再判会用同一份快照判出与 R2 相反的结果。

单形态的判定点在 `thincoder-core/tools/edit-diff.mjs` 的 `runSingleEdit`：读盘之后、`computeEditEntry` 之前。

**帧的落点是纯函数，不是每个通道一份循环**：

- `planEditEntries(entries) → { order, rejection }`——零 IO，只看条目自身的行号：判重叠、给降序应用序；
- `applyPlannedEntries(content, entries, order) → { content, results }`——零 IO，逐条 `computeEditEntry` 按计划序累积，`results` 按调用序回到原位。

两函数单源住 `thincoder-core/tools/edit-diff.mjs`（D-7 的跨档单源面）。每条通道只提供自己的 IO：读、写、记账。

**为什么这样落**：`applyEditBatch` 原先把「读文件 → 排顺序 → 写回」焊在一个函数里，只有写那层留了注入缝。ACP 桥因此把那份组循环抄了一遍——它现在正是「数组序应用、无重叠拒」的那个副本。抄一份帧，第三个通道就会再抄一份；共用的是排法，不是 IO。

**R3 的来源**：无生产实例，来源 = 可复现径（本批 AC5）——两条行号条目在同一段上重叠时，先改哪条决定结果，任何顺序都只是猜。

**登记行为变更（R1 的代价）**：数组序里内容条目在前、行号条目改到同一段时，旧序能过（内容条目先匹配成），新序是硬拒——行号条目先应用后，内容条目的 `old_string` 已指向被改掉的文本 ⇒ 显式 not-found、整批零写。

这是有意的：同一批里两条目对同一段的两份意图本就不自洽，先到先得会把矛盾写进盘面。用例 = 本批 AC10。

### 7.4 作用域与通道覆盖

**判据句**：受影响面是**闭集**——每条通道 / 入口 / 端逐条标「已接 ∥ 不接（理由）∥ 不适用」，一条缺席即视为漏。
理由：漏项不进检查范围——它不会显示成「没接」，只会显示成「没提」，而没提的那一档永远不会被自己查到。

**记账面是本进程内的一张模块级 `Map`**，管住的是「写这一档的席在写完之后又拿旧行号来改」这一半。

**本进程内的子代理共用同一张表**：`thincoder-core/agent-tools/` 与 `thincoder-core/agent/` 下无**起代理**的子进程入口——子代理在同一进程里装配，读写同一份模块状态。所以「另一个席刚才改了这一档」在本会话内可判。

该判断的枚举（六处，这是本档这两个目录的**全部** `node:child_process` 导入点）：

- `thincoder-core/agent/assemble.mjs`（`execSync`）
- `thincoder-core/agent/helpers.mjs`（`execFile`）
- `thincoder-core/agent-tools/bash-async.mjs`（`spawn`）
- `thincoder-core/agent-tools/batch-gate.mjs`（`execFileSync`）
- `thincoder-core/agent-tools/ssh-transport.mjs`（`spawn`）
- `thincoder-core/agent-tools/ssh-vault.mjs`（`spawn`）

六处都是跑外部命令（装配缺省面 / git 与 offload / 异步 bash / 批门校验 / ssh 会话与凭据），没有一处起代理进程。

**量法（结论可复跑验真伪）**：在仓根跑 `grep -rn 'from "node:child_process"' thincoder-core/agent-tools thincoder-core/agent` —— 命中行数即上表条数；新增导入 ⇒ 重判一次「它是否起代理」。
写结论不写量法，这个枚举就只能被相信，不能被核对——本节判的是闭集，枚举本身也得是闭的。

**不覆盖**：另一个进程 / 另一个 ThinCoder 实例（CLI 另开一个会话、桌面或 VSC 端另起一个）写同一档——本进程的表里没有那一笔，行号漂移无从判断。跨进程覆盖需要把记账落盘，属另一件事，本档写明它不做。

**通道闭集（五条，逐条判；判定只有三值：已接 ∥ 不接 ∥ 不适用）**：

| 通道 / 入口 / 端 | 判定 | 理由 ∥ 落点 |
|---|---|---|
| `thincoder-core/agent-tools/`（工具本体） | 不适用 | 该目录没有行号形写入口：全目录对 `editTool` / `insertAfterTool` / `startLine` 零命中；`edit` / `insert_after` 工具体注册在 `thincoder-core/tools/index.mjs` 的静态注册表（`file.mjs` 组）。子代理装配工具走同一注册面、取同一件 ⇒ 判据随下一行 |
| `thincoder-core/tools/`（实现层） | 已接 | `write-path.mjs` 的 `lastWrites` 容器与 `lineAnchorVerdict` / `lineAnchorRefusal` · `edit-diff.mjs` 的 `runSingleEdit`（单形态）与 `planEditEntries` / `applyPlannedEntries`（帧） · `edit-batch.mjs` 的 `applyEditBatch`（批量 IO） · `file.mjs` 的 `insertAfterTool.execute`（insert_after） · `patch.mjs` 的批级记账循环（陈旧快照出口） |
| `thincoder-cli/src/acp/bridge.mjs`（IDE 缓冲通道） | 已接 | 桥不经 `writeThroughPath` ⇒ **三入口各自接**（`write` / `editSingle` / `editBatch`：判据、帧、写缓冲成功后 `recordWrite`）；键 = `resolveInCwd` 后的绝对路径——明细见下 |
| `thincoder-vscode/src/`（扩展宿主） | 已接 | 端侧零副本：`thincoder-vscode/src/tools/index.mjs` 的 import 行从 `@thincoder/core/tools/file.mjs` 取 `editTool` / `insertAfterTool` ⇒ 判据与记账表随核 |
| `thincoder-desktop/src/`（桌面端） | 已接 | 端侧零副本：`thincoder-desktop/src/main/agent-host.mjs` 的 `import { runAgent } from "@thincoder/core/agent.mjs"`、`agent-assemble.mjs` 的 `assembleAgent` 取自 `@thincoder/core/agent/assemble.mjs`；全树对 `editTool` / `computeEditEntry` 零命中 ⇒ 工具与记账表都在 Electron 主进程内，随核同判 |

**「随核」两端的代价写在上面「不覆盖」里**：VSC 与桌面各自是一个进程，它们与本 CLI 会话之间互相看不见——那是跨进程的一半，不是这两条通道的漏。

**不落快照的写入口（登记，不接）**：它们不属上面五条通道，但也能把行号顶偏——不写出来就只会在盘上被当成「没这回事」。

| 写入口 | 判定 | 理由 |
|---|---|---|
| `thincoder-core/agent-tools/batch.mjs`（批档直写） | 不接 | 该档直写批档正文（`writeFileSync`，既无 `recordWrite` 也无 `markDirty`）⇒ 本进程内 `batch` 改过某档之后，再拿行号 `edit` 它落第 1 行放行。不接的理由：批工具的写入面按段锚文本改（`action:"edit"` 的 `oldText`），它不靠行号定位，模型从它那里拿不到坐标系；接上需把直写换成 `writeThroughPath` 并重排脏态门禁与段级校验的次序，本批不扩面 |
| `bash`（外部进程直写） | 不接 | 写盘发生在本进程之外，记账面看不见；要覆盖需文件系统层挂钩子（watch ∥ 尾记），成本与收益不成比例——**已知盲区**：`bash` 写过之后再用行号 `edit`，护栏无从判 |

**ACP 桥为什么必须自己落记账**：桥读 IDE 缓冲、写回也是 IDE 缓冲（`fs/write_text_file`），不经 `writeThroughPath` ⇒ 核的写点一次都不经过，记账与判据都得在桥面接。

- **三入口**：桥自己路由 `write` / `editSingle` / `editBatch`，三个入口各自在写缓冲成功后 `recordWrite`——`write` 记 `{ type: "write", startLine: 1, shift: 0 }`（与核 `writeTool` 同型）；`editSingle` 记该条的 `{ type: "edit", … }`；`editBatch` 记合并快照。少接一个入口，同一份漂移就会「本地 write 之后拒、IDE 缓冲 write 之后放」。
- **回执面（与核的差异逐条给据，不用「面板不同」一句带过）**：逐条回执分两形——**替换条目写确认形** `OK: edited <path> via IDE (<n> occurrence(s))`；**删行条目写 `Deleted <line N|lines N-M> of <path> via IDE`**，其中 `line N` / `lines N-M` 取自 `deleteTarget`，与核同一函数、同一取值。删行与替换是模型区分「删了行」与「换了内容」的两条线索，压成一句就分不出同一批里哪条删、哪条换。
- **单形态删行不经桥**：桥的单形态路由门要求 `new_string` 是字符串，而删行只在**省略** `new_string` 时成立 ⇒ 单形态删行落本地通道（回执 = 核面 `Deleted line N of <path>`），桥面的删行回执只来自 `edits` 数组形态。单形态经桥的回执恒为确认形。
- **桥面不写的四样（同一理由：它们都读盘面内容或起外部进程，而桥写的是 IDE 缓冲，缓冲与盘面可能不同步）**：`diff`（`gitDiffOne` 读盘）· `autoSyntaxCheck`（读盘并起进程）· `context (L…-L…)` 写入点上下文（`appendWriteContext` 里 `readFile` 读盘）· 批末汇总行（只为 >64K 大回执落盘后 preview 保尾，桥回执不含 diff、够不到那个阈值）。
- 判据：`editSingle` 读缓冲后、`computeEditEntry` 之前调同一函数；`editBatch` 在组循环之前判一次（同 §7.3 判定点）。
- 帧：**不另写循环**——调 §7.3 的 `planEditEntries` / `applyPlannedEntries`；桥只做「读缓冲 → 应用计划 → 写缓冲」。
- 记账：缓冲写回**成功之后** `recordWrite(abs, { type: "edit", startLine, shift })`，`startLine` 取组内最小、`shift` 取组内净漂移（同核批量的合并快照语义）。
- **记账键 = `resolveInCwd` 之后的绝对路径**，与核同一键；键不一致则核与桥各记一条、互相看不见，护栏对另一条通道等于零。
- 顺带对齐：`editSingle` 向 `computeEditEntry` 传 `absPath`，not-found 提示的记账分支因此在桥面同样生效。
- 坐标系：读与写都经 IDE 缓冲，快照对同一坐标系有效（缓冲内容与盘面可能不同步，行号语义跟的是缓冲）。

**VSC 端**：不另实现 `edit` / `insert_after`——`thincoder-vscode/src/tools/index.mjs` 直接 import 核 `editTool` / `insertAfterTool`。

树内无自有 `lastWrites` 等价物：`thincoder-vscode/src/tools/shared.mjs` 的 `isDirty: (doc) => doc?.isDirty === true` 是注入面脏态问询，不是记账表。编辑器径的写仍由核记账（`thincoder-core/tools/write-path.mjs` 的 `writeThroughPath` 编辑器分支 `meta.record`）⇒ 两端同一张表、同一份判据。

### 7.5 设计依据（先例 ∥ 三问）

**最近先例**：现有 `insert_after` 护栏——`thincoder-core/tools/file.mjs` 的 `insertAfterTool.execute` 里那段 `lastWriteOf` 分支与 `isDirty` 分支（本批已由单源判据 `lineAnchorVerdict` 取代）。

- **对齐**：同一受影响区三分（全文重写 ⇒ 拒；目标在写点之前 ⇒ 放行；之后 ⇒ 拒）。
- **偏离一**：边界按记账类型分（§7.1 末表）——替换读写目标行，插入不读写。
- **偏离二**：批量帧 R1–R4（§7.3）——先例只覆盖单条调用，没有同批多条这一面。

**三问（本机制新件逐个）**：

| 新件 | 三问答案 |
|---|---|
| 判据函数（`thincoder-core/tools/write-path.mjs` 新增具名导出 `lineAnchorVerdict`） | `existing but unusable: thincoder-core/tools/file.mjs` 的 `insertAfterTool.execute` 内联分支 · 失败面：内联在 insert_after 的 `execute` 体内，edit 的单形态 / 批量 / 桥三处都调不到 ⇒ 提为具名函数，判据语义照抄（唯一变更 = §7.1 第 2 行新格） |
| 拒文构造器（同档新增具名导出） | `existing: thincoder-core/tools/write-path.mjs` 的 `dirtyRefusalMessage`——复用其形：具名导出、端中立、与记账面同档；文案不复用（那是编辑器缓冲脏态，不是行号漂移） |
| `insert_after` 现有拒句（`thincoder-core/tools/file.mjs` 的 `insertAfterTool.execute` 里两句中文拒句） | `existing but unusable` · 失败面：两句中文写死在工具体内，与英文描述面不一致 ⇒ 收正为共享构造器（唯一判定变更 = §7.1 第 2 行新格，见 §7.2） |

## 8. 关键决策记录

| # | 决策 | 理由 |
|---|---|---|
| D-H1 | **共享底层独立成档**（helper 不上收到各工具档） | 四工具同写路径——重复描述必然漂移 |
| D-H2 | `detectFileEol` 用**首个换行符**判据（非计数） | 混合行尾文件按计数判会翻车；首行风格即文件惯例 |
| D-H3 | 失败候选**截断 500 字符 + 5000 行预算** | minified 单行文件的 LCS 会爆预算 |
| D-H4 | U+FFFD **警告不阻断** | 编码损坏时仍给模型一次尝试机会；阻断会让损坏文件整体不可编辑 |
| D-H5 | 行号锚护栏**判据单源**（edit 行号形 ∥ insert_after 同一条判定） | 两处各写一套必然分叉：同一份漂移，一个 拒一个 放，模型学到的是「换一条路就过」 |
| D-H6 | edit 的边界比 insert_after **严一格**（`endLine < startLine` ∥ `after_line <= startLine`） | 替换要读也写目标行；插入只落下两行之间——同一个记账态，两个工具的正确边界本就不同 |
| D-H7 | 批量内行号条目按**快照降序**应用（非串行累积、非拒绝） | 模型唯一能持有的坐标系是它读到的快照；组内漂移本工具自己算得出，按快照解释是还原意图，不是替模型改错 |
| D-H8 | 拒文点名 `hashline_edit` / `old_string` 作为下一步 | 大档重 read 是整轮开销；不给位置无关的路，护栏只挡路不给路 |
