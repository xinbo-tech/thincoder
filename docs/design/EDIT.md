# edit 工具权威语义（EDIT）

> 板块：编辑工具。权威源：VSC `src/tools/file-edit.mjs`（editTool 壳/schema/描述内嵌）+ `src/tools/edit-line-params.mjs`（D1 子模块）+ `src/tools/edit-fuzzy-match.mjs`（D2 子模块）+ `src/tools/edit-diff.mjs`（diff 内核/判定序）。本文档是 **edit 工具语义的权威源**——VSC `TOOLS.md` §9 只留地图（定位句 + 指针），不得复制本档正文。
> 双端：VSC（本文档）与 CLI（thincoder `docs/design/EDIT.md`）同机制各自独立实现——镜像锚：两端工具描述逐字一致（评审逐字对齐），语义正文各自落地。**VSC 差异**：无 CLI 的 DESC() md 描述机制——描述内嵌 `.mjs`（file-edit.mjs editTool 对象）；编辑器路径（doc 已打开）走 WorkspaceEdit + range 偏移映射。
> 状态：**已实现**（D1-D3 落地 2026-09-08）。历史设计见文末「变更记录」。

## 1. 定位

edit = **按精确区域替换文件内容**——主编辑工具。两种定位形态（互斥）+ 三级匹配 + 判定序 4 分支（见 §4）。面向场景：知道要改哪一行/哪一段、或能给出当前内容——精确改。

**不是**：插入新行（→ insert_after）、按内容哈希行定位（→ hashline_edit）、整块 diff 多文件（→ apply_patch）、整文件重写（→ write）。路由在模型可见描述（file-edit.mjs editTool.description）的 Routing 段。

## 2. 参数与 schema

editTool（`file-edit.mjs`）：

- `path`（必须）——目标文件。
- **形态二选一**：
  - **行号形态（D1）**：`line: N`（单行——1-based）/ `startLine: N, endLine: M`（行范围——1-based 闭区间）——替换该行/范围为 new_string，**不需 old_string**。
  - **内容形态**：`old_string`（必须）——变化区当前内容；`new_string`——该区期望结果。
- `new_string`（两种形态都须给——见 §5 空串约束）。
- `replace_all`——字面替换每处（内容形态 only；行号形态不适用）。
- `edits`（数组批量）——条目 **不含行号参数**（VSC schema items：path/old_string/new_string/replace_all——D1 批量形态 **VSC 未支持**，阶段 2 补——EDIT-TOOLS-REVIEW.md 分歧 c）。

schema 与描述：模型可见文本在 `file-edit.mjs` editTool 对象（正文 + schema 参数描述）——与本文档语义一致，改语义须同改。

## 3. 匹配档位（D2——内容形态）

old_string 匹配三级档序（宽容——模型差异容忍）：

1. **逐字**——精确字符串匹配。
2. **唯一空白差异窗口**——逐字 occurrences=0 时 trim 等价的唯一窗口自动应用（P15.11）；多窗口歧义仍 not-found（不猜）。
3. **模糊匹配**——唯一窗口：行级 normalize 后逐行相等比例 ≥90% 即匹配（附 note 明示）；**歧义规则（评审 #2）**：唯一模糊命中才应用，**多命中报错附候选块**（fuzzy matches N regions——沿用 similarLinesBlock 机制）；不足阈值 not-found。

> 注：normalize 精确规则（VSC 现状：trim + `\s+`→单空格折叠 + 弯引号/反引号→直引号；CLI 现状：tab→2 空格 / ASCII 单→双引号）双端**算法不一**——阶段 2 功能统一（EDIT-TOOLS-REVIEW.md）裁定合并两端规则为一实现，落点见该变更段。

## 4. 判定序

内容形态替换后行级 diff 判定（`edit-diff.mjs`——分支 0 + 零重叠替换即删 + LCS + 平凡）：

1. **分支 0（就地替换）**：old 恰单行 ∧ new 恰单行 ∧ 全文唯一匹配 ∧ new 非空 → 就地整行替换（行数不变）。
2. **零重叠**（old 每行都不在 new）：**替换即删**（D3——old 行整体删除、new 取而代之——旧行不再保留；原"插入保留旧行"语义废止；新增行用 insert_after）。
3. **一般 LCS diff**：公共行保留、old 独有删、new 独有插。
4. **平凡**：new 与 old 行级全等 → 原样替换（no-op 成功）。

**行号形态**（不经判定序——edit-line-params.mjs computeLineEdit）：定位行/范围 → 直接替换（行数 = 范围行数 → new 行数）。越界/互斥见 §5。

## 5. 约束

- **空 new_string**：内容形态 → 显式错误（防删除保护先于分支 0）；**行号形态 → VSC 现"空串 = 删除该行/范围"**（edit-line-params.mjs——与 CLI 按行号形态"空串报错"矛盾 + VSC 内部两形态互相矛盾——阶段 2 裁定统一，EDIT-TOOLS-REVIEW.md 分歧 a）。**命名删行形态（阶段 2）**：edit 加显式行删（行号 + 空/省略 new_string = 删除）——评审裁定 A 已定，阶段 2 实现后更新本节。
- **互斥**：行号形态与 old_string；line 与 startLine/endLine；edits 与顶层形态——均显式报错（execute 期兜底）。
- **行号校验**：line/startLine/endLine 正整数；startLine ≤ endLine；endLine ≤ 文件行数（越界报错）。
- **replace_all**：字面替换每处；多匹配无 replace_all → occurrences 错误。
- **edits 数组**：同文件串行累积、跨 path 并行、原子；条目内 old_string/new_string（required——无行号条目）。
- **not-found 引导**：错误含 similarLinesBlock（top 3 相似行——LCS 连续子串 / 阈 0.5）。
- **编辑器路径**：doc 已打开 → WorkspaceEdit range 替换（定位偏移与 doc.positionAt 同坐标系——lfOffsetToRaw 把 LF 域偏移映射回 CRLF 原文偏移——见 EDIT-HELPERS.md / VSC 编辑器路径差异）；读文件路径 → 本地写盘。
- **数据新鲜度**：old_string/行号只来自最新 read——改前 re-read。

## 6. 实现单一权威

VSC `src/tools/edit-diff.mjs`（applyRegion/applyPatchLines/lcsReplace——判定序）+ `src/tools/edit-line-params.mjs`（D1：computeLineEdit/executeLineEdit——含编辑器 WorkspaceEdit 路径）+ `src/tools/edit-fuzzy-match.mjs`（D2：findFuzzyMatch + 歧义候选块）+ `file-edit.mjs`（壳/schema/批量/单形态——同 execute 内双路径）；CLI 镜像 edit-diff.mjs。

EOL 写回与失败候选——**共享 helper 权威见 `EDIT-HELPERS.md`**（VSC 另有 `lfOffsetToRaw`——编辑器路径专属），此处不复制。

## 7. 测试

`test/edit-tool-improvement.test.mjs`（13 用例）+ `test/files.mjs` 登记。用例表历史见「变更记录」引用档。

## 8. 阶段 2 变更段（EDIT-TOOLS-REVIEW——2026-09-08 裁定，评审后实现）

> 编辑工具板块二次整理（功能统一 + 描述/提示词完善）。本段设计待评审——评审通过并入 §1-§7 当前态。与 CLI EDIT.md §8 同机制镜像——逐字裁定见 CLI 档变更段 + VSC 差异标注。

### 8.1 删行形态（裁定 A——同 CLI）

edit 加**显式命名删行形态**：`{path, startLine: N, endLine: M}` / `{path, line: N}` **省略 new_string** = 删除该行/范围。内容形态空 new_string 仍拒绝（无界意图）；行号形态省略允许（有界意图——删哪行是显式声明）。

- **VSC 现状差异要修**：现 edit-line-params.mjs 空 new_string = `[]` = 删行（edit-line-params.mjs:78 + 描述 :82 "empty new_string deletes them"）——**改为显式删行形态**（省略 new_string 才删；给空串但给了 new_string 键 → 语义统一——见裁定）。VSC 内部两形态矛盾（内容形态拒空串/行号形态空串删行）由此消除。
- **schema**：行号形态 new_string optional；批量条目（8.4 补行号后）同。
- **返回**：`Deleted lines N-M of <path>` / `Deleted line N of <path>`。
- **空串 vs 省略矩阵（评审 #1 采纳——显式裁定，同 CLI）**：行号形态省略 new_string = 删（有界意图）；行号形态**显式空串 `""` = 显式错误**（防误删——与内容形态拒空串一致；提示"省略 new_string 以删行"）；现 edit-line-params.mjs 空串=`[]`=删的语义废除（:78）——仅省略才删。
- **批量条目删行**（评审 #4 界定——8.4 补行号后）：条目含行号 + 省略 new_string = 删行（同顶层）；required 放宽同。
- **测试**：删单行/删范围/显式空串拒/批量条目删行/越界。

### 8.2 normalize 统一（裁定——同 CLI 5 条基准）

CLI/VSC normalize 统一一实现。统一基准：trim + 去行尾空白 / tab→2 空格 / ASCII 单→双引号 / **弯引号反引号→直双引号 `"`（评审 #2 定稿：`‘’`/`“”`/反引号单遍映射到 `"`——与 ASCII 单→双合并为单遍逐字符映射，无顺序依赖——防两端分叉）** / **移除 VSC 行内 `\s+` 折叠**（评估修正——折叠吞缩进/对齐可能误匹配结构不同行）。

- 实现：VSC normalizeLineFuzzy（edit-fuzzy-match.mjs）改同 CLI 基准（移除折叠、补 tab→2 空格）；CLI normalizeEditLine 补弯引号归一。两端逐字同算法。
- 测试：弯引号差异行两端同命中 / 结构不同文字相似行两端同不命中。

### 8.3 描述修复（VSC）

### 8.3 描述修复（VSC——逐处改前/改后，2026-09-08 用户确认；CLI 对应具体改写见 CLI EDIT.md §8.3）

`file-edit.mjs` editTool 描述 4 处（模型可见文本——行号引 file-edit.mjs 当前）：
  1. **重复块**（:87-90——line 与 startLine/endLine bullet 原样两遍，仅后者多 "; replace_all does not apply"）→ 删第二遍（:89-90），合并保留 "; replace_all does not apply"
  2. **中英混杂**（:92 edits 条目整段中文"批量形态（CLI parity）——同文件多处修改…"）→ 改英文（同 CLI edit.md edits 段措辞——
     "Batch form — multiple edits in ONE call, atomic; entries without their own path inherit the top-level path (entry paths override). Mutually exclusive with top-level old_string/new_string"）
  3. **空串矛盾**（:82 "empty new_string deletes them"）→ 与 CLI ② 同义：行号形态 **省略 new_string** 才删（删行形态——8.1）；给空串=给了 new_string 键 → 空串语义统一（内容形态拒、行号形态显式删）
  4. **normalize 措辞**（:80 "inner whitespace collapsed"）→ 移除折叠后改 "tab→space indent + quote normalization"（与 CLI 8.2 统一基准一致）
  5. 路由段（新——现缺）：行号新鲜 → `line` 形态；漂移/内容杂 → `hashline_edit`；删行 → 省略 new_string；加行 → `insert_after`（镜像 CLI ①）

### 8.4 批量行号补 VSC（分歧 c）

VSC edits 数组条目**加 line/startLine/endLine**（现 schema items 只有 path/old_string/new_string/replace_all + required:[old_string,new_string]——条目带 line 会静默丢）：

- schema items 加行号参数；required 放宽（行号条目无 old_string——同 CLI items.required 仅 new_string）；批量 execute 处理条目级行号。
- 与 CLI 对齐（CLI 设计测试表已含"批量混用行号+模糊条目"——现 CLI-only → VSC 补齐）。
- 测试：批量混用行号+内容条目 VSC 端到端。

### 8.5 代码注释旧编号清理（同 CLI）

VSC edit 族代码注释 §15/D15.x（file-edit.mjs:20-21,72,198,208,235,338,347 / edit-diff.mjs:2-4,11,132 / more-file.mjs:124,126,151,201）→ EDIT.md 指针 + 跨仓悬空（edit-diff.mjs:33 指 CLI EDIT-TOOL-EOL-DESIGN.md）修正为本仓 EDIT-HELPERS.md。


## 变更记录

- 2026-09-08：文档重组——edit 工具语义从 VSC TOOLS.md §9 + EDIT-TOOL-IMPROVEMENT.md 并入本文档（每工具一档——TOOLS.md §9 退地图）。状态"已实现"（D1-D3 落地：按行号改/模糊匹配/替换即删——原 IMPROVEMENT 档设计 + AC1-AC5，见 `_archive/EDIT-TOOL-IMPROVEMENT.md`）。
- 阶段 2 预告（EDIT-TOOLS-REVIEW.md 变更段）：删行形态（裁定 A）+ normalize 统一（裁定合并两端规则）+ 批量行号补 VSC（分歧 c）+ hashline 定位重写——实现后更新本文档对应节。
