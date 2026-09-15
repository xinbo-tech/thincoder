# edit 工具权威语义（EDIT）

> 板块：编辑工具。权威源：VSC `src/tools/file-edit.mjs`（W14 已迁核——现体 `thincoder-core/tools/file.mjs`）（editTool 壳/schema/描述内嵌）+ `src/tools/edit-line-params.mjs`（D1 子模块）+ `src/tools/edit-fuzzy-match.mjs`（D2 子模块）+ `src/tools/edit-diff.mjs`（diff 内核/判定序）。本文档是 **edit 工具语义的权威源**——VSC `TOOLS.md` §9 只留地图（定位句 + 指针），不得复制本档正文。
> 双端：VSC（本文档）与 CLI（`EDIT（CLI 仓·设计）`）同机制各自独立实现——镜像锚：两端工具描述逐字一致（评审逐字对齐），语义正文各自落地。**VSC 差异**：无 CLI 的 DESC() md 描述机制——描述内嵌 `.mjs`（file-edit.mjs editTool 对象）；编辑器路径（doc 已打开）走 WorkspaceEdit + range 偏移映射。
> 状态：**已实现**（D1-D3 落地 2026-09-08）。历史设计见文末「变更记录」。

## 1. 定位

edit = **按精确区域替换/删除文件内容**——主编辑工具。两种定位形态（互斥）+ 三级匹配 + 判定序 4 分支（见 §4）+ **删行形态**（行号 + 省略 new_string——见 §5 矩阵）。面向场景：知道要改/删哪一行或哪一段、或能给出当前内容——精确改。

**不是**：插入新行（→ insert_after）、按内容哈希行定位（→ hashline_edit）、整块 diff 多文件（→ apply_patch）、整文件重写（→ write）。路由在模型可见描述（file-edit.mjs editTool.description）的 Routing 段。

## 2. 参数与 schema

editTool（`file-edit.mjs`）：

- `path`（必须）——目标文件。
- **形态二选一**：
  - **行号形态（D1）**：`line: N`（单行——1-based）/ `startLine: N, endLine: M`（行范围——1-based 闭区间）——替换该行/范围为 new_string，**不需 old_string**。
  - **内容形态**：`old_string`（必须）——变化区当前内容；`new_string`——该区期望结果。
- `new_string`——内容形态必须；行号形态**可省略（=删行/范围——8.1）**；显式空串 `""` 两形态皆拒（见 §5 矩阵）。
- `replace_all`——字面替换每处（内容形态 only；行号形态不适用）。
- `edits`（数组批量）——条目**含行号参数（8.4 落地 2026-09-08）**——`[{path?, old_string?, new_string?, line?, startLine?, endLine?, replace_all?}]`——**条件 schema（oneOf）**：内容条目 old_string+new_string；行号条目 line 或 startLine+endLine（new_string optional——省略 = 删行）；items.required 不硬设（execute 期按形态校验）。

schema 与描述：模型可见文本在 `file-edit.mjs` editTool 对象（正文 + schema 参数描述）——与本文档语义一致，改语义须同改。

## 3. 匹配档位（D2——内容形态）

old_string 匹配三级档序（宽容——模型差异容忍）：

1. **逐字**——精确字符串匹配。
2. **唯一空白差异窗口**——逐字 occurrences=0 时 trim 等价的唯一窗口自动应用（P15.11）；多窗口歧义仍 not-found（不猜）。
3. **模糊匹配**——唯一窗口：行级 normalize（**8.2 统一基准——与 CLI normalizeEditLine 逐字同算法：去首尾空白+去行尾空格 / tab→2 空格 / `'`/`‘’`/`“”`/反引号单遍映射到 `"`（无顺序依赖）/ 无行内折叠**）后逐行相等比例 ≥90% 即匹配（附 note 明示）；**歧义规则**：唯一模糊命中才应用，**多命中报错附候选块**（fuzzy matches N regions——similarLinesBlock 机制）；不足阈值 not-found。


## 4. 判定序

内容形态替换后行级 diff 判定（`edit-diff.mjs`——分支 0 + 零重叠替换即删 + LCS + 平凡）：

1. **分支 0（就地替换）**：old 恰单行 ∧ new 恰单行 ∧ 全文唯一匹配 ∧ new 非空 → 就地整行替换（行数不变）。
2. **零重叠**（old 每行都不在 new）：**替换即删**（D3——old 行整体删除、new 取而代之——旧行不再保留；原"插入保留旧行"语义废止；新增行用 insert_after）。
3. **一般 LCS diff**：公共行保留、old 独有删、new 独有插。
4. **平凡**：new 与 old 行级全等 → 原样替换（no-op 成功）。

**行号形态**（不经判定序——edit-line-params.mjs computeLineEdit）：定位行/范围 → 直接替换（行数 = 范围行数 → new 行数）；**省略 new_string = 删行**（行数 → 0——删行形态，返回 `Deleted line N / lines N-M of <path>`）。越界/互斥见 §5。

## 5. 约束

- **空串 vs 省略矩阵（8.1 裁定——2026-09-08 实现落地，废除旧"空串=删"）**：
  - 内容形态空 `new_string` = 显式错误（防删除保护先于分支 0）；
  - 行号形态**省略 new_string** = 删行/范围（有界意图——删哪行是显式声明）；
  - 行号形态**显式空串 `""`** = 显式错误（EMPTY_NEW_STRING_LINE——防误删——提示"省略 new_string 以删行"——先于越界判定）；
  - **批量 edits 条目**同顶层（行号条目省略 new_string = 删行）。
- **互斥**：行号形态与 old_string；line 与 startLine/endLine；edits 与顶层形态——均显式报错（execute 期兜底）。
- **行号校验**：line/startLine/endLine 正整数；startLine ≤ endLine；endLine ≤ 文件行数（越界报错）。
- **replace_all**：字面替换每处；多匹配无 replace_all → occurrences 错误。
- **edits 数组**：同文件串行累积、跨 path 并行、原子；条目内行号条目对累积态串行应用（删行/混用内容条目原子）。
- **not-found 引导**：错误含 similarLinesBlock（top 3 相似行——LCS 连续子串 / 阈 0.5）。
- **编辑器路径**：doc 已打开 → WorkspaceEdit range 替换（定位偏移与 doc.positionAt 同坐标系——lfOffsetToRaw 把 LF 域偏移映射回 CRLF 原文偏移——见 EDIT-HELPERS.md / VSC 编辑器路径差异）；读文件路径 → 本地写盘。
- **数据新鲜度**：old_string/行号只来自最新 read——改前 re-read。

## 6. 实现单一权威

VSC 实现模块族：`src/tools/edit-diff.mjs`（applyRegion/applyPatchLines/lcsReplace——判定序）+ `src/tools/edit-line-params.mjs`（D1：computeLineEdit/executeLineEdit/EMPTY_NEW_STRING_LINE——含编辑器 WorkspaceEdit 路径）（W14 已迁核——现体 `thincoder-core/tools/{edit-diff.mjs, edit-batch.mjs}`）
+ `src/tools/edit-fuzzy-match.mjs`（D2：findFuzzyMatch——与 CLI normalizeEditLine 逐字同算法）+ `src/tools/file-edit.mjs`（壳/schema/批量/单形态——同 execute 内双路径）（W14 已迁核——现体 `thincoder-core/tools/{edit-batch.mjs, file.mjs}`）
+ `src/tools/hashline-edit.mjs`（hashlineEditTool——2026-09-08 500 硬帽拆分，file-edit re-export）；CLI 镜像 edit-diff.mjs。（W14 已迁核——现体 `thincoder-core/tools/file.mjs`）

EOL 写回与失败候选——**共享 helper 权威见 `EDIT-HELPERS.md`**（VSC 另有 `lfOffsetToRaw`——W14 已迁核退场，随自持编辑工具面删除；现体 = 核全文写路径），此处不复制。

## 7. 测试

`test/edit-tool-improvement.test.mjs`（**30 用例**——删行形态全路径/显式空串拒/normalize 与 CLI 逐字同算法用例/批量混用行号+内容条目端到端——2026-09-08 阶段 2 实测校准）+ `test/files.mjs` 登记。

- 2026-09-08：阶段 2 实现落地（EDIT.md 原 §8 变更段并入本档 §1-§7——CLI 26cd89f 先行镜像）——删行形态（省略 new_string = 删，显式空串 EMPTY_NEW_STRING_LINE 拒——废除旧空串=删）+ normalize 统一（与 CLI normalizeEditLine 逐字同算法单遍映射）+ 批量行号补（条件 schema oneOf）+ 描述 4 修 + Routing 段 + 注释 §15 清理（hashlineEditTool 拆 hashline-edit.mjs——500 硬帽）。
## 变更记录

- 2026-09-08：文档重组——edit 工具语义从 VSC TOOLS.md §9 + EDIT-TOOL-IMPROVEMENT.md 并入本文档（每工具一档——TOOLS.md §9 退地图）。状态"已实现"（D1-D3 落地：按行号改/模糊匹配/替换即删——原 IMPROVEMENT 档设计 + AC1-AC5，见 `docs/design/_archive/EDIT-TOOL-IMPROVEMENT.md`——归档档·已退役）。
- 阶段 2 预告（EDIT-TOOLS-REVIEW.md 变更段）：删行形态（裁定 A）+ normalize 统一（裁定合并两端规则）+ 批量行号补 VSC（分歧 c）+ hashline 定位重写——实现后更新本文档对应节。
