# edit 工具权威语义（EDIT）

> 板块：编辑工具。权威源：CLI `src/tools/edit-diff.mjs`（diff 内核/判定序）+ `src/tools/edit-batch.mjs`（D1/D2 纯函数）+ `src/tools/file.mjs`（editTool 壳/schema）。本文档是 **edit 工具语义的权威源**——`TOOLS.md` §6.1 只留地图（定位句 + 指针），不得复制本档正文。
> 双端：CLI（本文档）与 VSC（thincoder-vscode `docs/design/EDIT.md`）同机制各自独立实现——镜像锚：两端工具描述逐字一致（评审逐字对齐），语义正文各自落地。
> 状态：**已实现**（D1-D3 落地 2026-09-08）。历史设计见文末「变更记录」。

## 1. 定位

edit = **按精确区域替换文件内容**——主编辑工具。两种定位形态（互斥）+ 三级匹配 + 判定序 4 分支（见 §4）。面向场景：知道要改哪一行/哪一段、或能给出当前内容——精确改。

**不是**：插入新行（→ insert_after）、按内容哈希行定位（→ hashline_edit）、整块 diff 多文件（→ apply_patch）、整文件重写（→ write）。路由在模型可见描述（`src/tools/edit.md`）的 Routing 段。

## 2. 参数与 schema

editTool（`file.mjs` editTool 对象）：

- `path`（必须）——目标文件。
- **形态二选一**：
  - **行号形态（D1）**：`line: N`（单行——1-based）/ `startLine: N, endLine: M`（行范围——1-based 闭区间）——替换该行/范围为 new_string，**不需 old_string**。
  - **内容形态**：`old_string`（必须）——变化区当前内容；`new_string`——该区期望结果。
- `new_string`（两种形态都须给——见 §5 空串约束）。
- `replace_all`——字面替换每处（内容形态 only；行号形态不适用）。
- `edits`（数组批量）——`[{path?, old_string?, new_string, line?, startLine?, endLine?, replace_all?}]`；互斥：edits 与顶层 old/new/line/startLine/endLine。

schema 与描述的逐字契约：`src/tools/edit.md` 是模型可见文本（运行时经 DESC() 加载为 description），与本文档语义一致——两处维护点，改语义须同改。

## 3. 匹配档位（D2——内容形态）

old_string 匹配三级档序（宽容——模型差异容忍）：

1. **逐字**——精确字符串匹配。
2. **唯一空白差异窗口**——逐字 occurrences=0 时按行 trim() 等价的唯一窗口自动应用（附 note）；多窗口歧义仍 not-found（不猜）。
3. **模糊匹配**——唯一窗口：行级 normalize（去首尾空白 / tab→2 空格缩进统一 / 单→双引号统一 / 去行尾空格）后逐行相等比例 ≥90% 即匹配（附 `fuzzy matched` note 明示）；多窗口歧义 / 不足阈值仍 not-found 报错（不猜）。

> 注：normalize 精确规则（CLI 现状：tab→2 空格 / ASCII 单→双引号；VSC 现状：空白折叠 / 弯引号归一）双端**算法不一**——阶段 2 功能统一（EDIT-TOOLS-REVIEW.md）裁定合并两端规则为一实现，落点见该变更段。

## 4. 判定序

内容形态替换后行级 diff 判定（在 normalize(LF) 域做行级 LCS）：

1. **分支 0（就地替换）**：old 恰单行 ∧ new 恰单行 ∧ 全文唯一匹配 ∧ new 非空 → 就地整行替换（行数不变）。
2. **零重叠**（old 每行都不在 new）：**替换即删**（D3——breaking：old 行整体删除、new 取而代之——旧行不再保留；原"插入保留旧行"语义废止；新增行用 insert_after）。
3. **一般 LCS diff**：公共行保留（LCS 序）、old 独有删、new 独有插。
4. **平凡**：new 与 old 行级全等 → 原样替换（no-op 成功）。

**行号形态**（不经判定序）：定位行/范围 → 直接替换为 new_string（行数 = 范围行数 → new 行数）。越界/互斥见 §5。

## 5. 约束

- **空 new_string = 纯删除意图 → 显式错误**（提示须带保留上下文行；单行替换永不成删除——防删除保护先于分支 0；行号形态同）。**命名删行形态（阶段 2——EDIT-TOOLS-REVIEW.md）**：edit 加显式行删（line/startLine/endLine + 空/省略 new_string = 删除该行/范围）——评审裁定 A 已定，阶段 2 实现后更新本节。
- **互斥**：行号形态与 old_string；line 与 startLine/endLine；edits 与顶层形态——均显式报错。
- **行号校验**：line/startLine/endLine 正整数；startLine ≤ endLine；endLine ≤ 文件行数（越界报错）。
- **replace_all**：每处 old→new **字面替换**（不做插入/分支 0）；多匹配无 replace_all → occurrences 错误。
- **edits 数组**：同文件多条**串行累积**、跨 path 并行、**全判后原子写**（任一失败全不写）；条目内同样二选一（old_string 或行号）。顶层 path = 无自带 path 条目的默认，条目自带 path 优先。
- **行数上限**：old/new 各 ≤1000（超限报 "edit region too large"）。
- **not-found 引导**：错误含 `searched:` + grep 建议 + `similar lines (top 3, score)` 段（LCS 连续子串 / 阈 0.5 / top3，单行也覆盖；零候选省略——算法权威见 EDIT-HELPERS.md findCandidates）。
- **空 new_string 内容形态**：显式错误（同 §5 首条）。
- **数据新鲜度**：old_string/行号只来自最新 read——改前 re-read。

## 6. 实现单一权威

CLI `src/tools/edit-diff.mjs` 导出 `applyPatchLines` / `computeEditEntry` / `validateEditEntry` / `assertEditArgsExclusive` / `hasLineParams` / `splitLines`；
D1/D2 纯函数落点 `src/tools/edit-batch.mjs`（`applyLineEdit` / `findFuzzyWindow` / `normalizeEditLine` / `FUZZY_MATCH_NOTE`——edit-diff 调用期导入，ESM 循环安全）；本地单形态 / edit-batch / ACP 桥三通道共用；VSC 镜像 `edit-diff.mjs`。

EOL 写回（detectFileEol/joinWithEol/majorityEol）与失败候选（findCandidates/FFFD_WARNING）——**共享 helper 权威见 `EDIT-HELPERS.md`**，此处不复制（单一权威）。

## 7. 测试

`test/edit-tool-improvement.test.mjs`（20 用例——18 快层 + 2 slow 端到端：runSingleEdit 按行号写盘/批量混用行号+模糊条目）。用例表历史见「变更记录」引用档。

## 8. 阶段 2 变更段（EDIT-TOOLS-REVIEW——2026-09-08 裁定，评审后实现）

> 编辑工具板块二次整理（功能统一 + 描述/提示词完善）。本段设计待评审——评审通过并入 §1-§7 当前态。

### 8.1 删行形态（裁定 A——用户 2026-09-08）

edit 加**显式命名删行形态**（行号形态的省略 new_string 分支——意图有界，防静默删除保护不适用）：

- **调用**：`{path, startLine: N, endLine: M}`（删行范围）/ `{path, line: N}`（删单行）——**省略 new_string** = 删除该行/范围。
- **与现有约束的关系**：内容形态空 new_string 仍拒绝（忘了填 new_string 是高频误操作——无界意图）；行号形态给了明确行 → 允许省略（有界意图——删哪行是显式声明）。
- **schema**：行号形态 new_string 改 optional（现 required——见 file.mjs schema）；描述说明两种删行路径。
- **返回**：`Deleted lines N-M of <path>` / `Deleted line N of <path>` + diff。
- **空串 vs 省略矩阵（评审 #1 采纳——显式裁定）**：
  - 行号形态**省略** new_string = 删行/范围（有界意图——删哪行是显式声明）；
  - 行号形态**显式空串** `new_string: ""` = **显式错误**（与 §5 首条"空串显式错"一致——防误删：模板生成 new_string 但落空 ≠ 删行意图；错误提示"省略 new_string 以删行"）；
  - 内容形态空串 = 显式错误（不变——无界意图防静默）。
  - 合并 §1-§7 时 §5:50 预告"空/省略 new_string = 删除"改为**仅"省略"**。
- **批量 edits 条目删行**（评审 #4 界定）：条目含 line/startLine/endLine + 省略 new_string = 删行（与顶层同语义——CLI edits items 已含行号参数）；条目级 schema required 放宽同顶层。
- **测试**：删单行/删范围/删首末行/显式空串拒（行号+内容形态）/删全部行边界/批量条目删行/越界行号。

### 8.2 normalize 统一（裁定——评估修正，用户批准 5 条基准）

双端模糊匹配 normalize 算法统一为一实现（现 CLI/VSC 各一——分歧 b）。**统一基准**：

1. trim + 去行尾空白（两端已有）
2. tab → 2 空格（CLI 规则）
3. ASCII 单引号 → 双引号（CLI 规则）
4. 弯引号/反引号 → 直引号（VSC 增量——采纳；**评审 #2 定稿：目标字符 = 直双引号 `"`——`‘’`/`“”`/反引号 `` ` `` 单遍映射到 `"`**——与规则 3 合并为单遍逐字符映射，无顺序依赖——防两端分叉）
5. **移除 VSC 行内 `\s+` 折叠**（评估修正——折叠吞缩进/对齐结构，可能误匹配文字相似但结构不同的行；模糊匹配定位是"容错"非"乱配"）

实现：CLI normalizeEditLine 补 4（弯→直）；VSC normalizeLineFuzzy 改 2/3/4 同 CLI（移除折叠）。两端逐字同算法。测试：含弯引号差异行两端同命中 / 结构不同文字相似行两端同不命中（防误匹配回归）。

### 8.3 描述/提示词同步（意见 3）

### 8.3 描述/提示词改写（意见 3——逐处改前/改后，2026-09-08 用户确认）

**① CLI `edit.md` 路由段**——现错（行定位首选指向 hashline，D1 后 edit 自己已能 `line:`）：
```
// 现：
- Precise line-targeted change → `hashline_edit` (hash-based, immune to whitespace/encoding drift — preferred)
// 改后：
- Delete a line/range by number → omit new_string: edit with `line: N` / `startLine: N, endLine: M`
- Line numbers fresh (just read) → `line`/`startLine`/`endLine` targeting — precise, no content copy needed
- Line numbers may have drifted / content has whitespace-encoding noise → `hashline_edit` (content-hash addressing — position-independent)
- Add a line/entry after a known line → insert_after
- Same change across multiple files → apply_patch
- Rewrite an entire file → write
```
（"hashline — preferred" 降为条件性：行号新鲜用 line 形态，漂移才用 hashline——hashline 唯一优势 = 位置无关，不是行定位首选。）

**② CLI `edit.md` 空串 note**（删行形态定后）：
```
// 现：
new_string empty (deletion) is an explicit error — ... (same for line-based edits)
// 改后：
Content-based edits: new_string empty is an explicit error (protects against forgetting it).
Line-based edits: OMIT new_string to delete the line/range — deleting by number is an explicit, bounded intent.
```

**③ VSC `file-edit.mjs` 描述修 3 处**（细节在 VSC EDIT.md §8.3——此处只列要点）：
  1. 重复块（line 与 startLine/endLine bullet 原样两遍 :87-90）删第二遍（:89-90），合并保留 "; replace_all does not apply"
  2. 中英混杂（:92 edits 条目整段中文）改英文（同 CLI edits 段措辞）
  3. 空串矛盾（:82 "empty new_string deletes them"）改 ② 同义（省略 new_string 才删——删行形态；非"空串=删"）
  4. normalize 措辞（:80 "inner whitespace collapsed"）移除折叠后改 "tab→space indent"（与 CLI 一致）

**④ 提示词陈旧句**（discipline.md / system.md——双端同修）：
```
// discipline.md:39-40 路由表——现：
`edit` | exact-string single replacement
`hashline_edit` | line-targeted edit by content hash
// 改后：
`edit` | region replacement (line-number or content targeting — exact → fuzzy)
`hashline_edit` | content-hash-addressed edit (position-independent — use when line numbers may have drifted)

// system.md:16——现：
"exact-match tools (edit) require the freshest read"
// 改后（edit 已非纯 exact-match——贴 exact-match 标签过时；数据新鲜度纪律保留）：
edit's old_string / line numbers / hashes require the freshest read — re-read after the file changed
```

**⑤ schema 参数描述**（CLI file.mjs / VSC file-edit.mjs）：
  - new_string：required → **行号形态 optional**（schema 表达"给 new_string 替换 或 省略删行"二选一）
  - VSC edits items 加 line/startLine/endLine + required 放宽（分歧 c——细节在 VSC §8.4）

**⑥ 代码注释旧编号**：CLI edit 族 §15/D15.x → EDIT.md 指针（edit-batch/edit-diff/file.mjs:262/patch.mjs:19,71,97——17 处）。


## 变更记录

- 2026-09-08：文档重组——edit 工具语义从 TOOLS.md §6.1 + EDIT-TOOL-IMPROVEMENT.md 并入本文档（每工具一档——TOOLS.md 退地图）。状态"已实现"（D1-D3 落地：按行号改/模糊匹配/替换即删——原 IMPROVEMENT 档设计 + AC1-AC5 + 测试表 8 用例，见 `_archive/EDIT-TOOL-IMPROVEMENT.md`）。
- 阶段 2 预告（EDIT-TOOLS-REVIEW.md 变更段）：删行形态（评审裁定 A）+ normalize 统一（裁定合并两端规则）+ hashline 定位重写——实现后更新本文档对应节。
