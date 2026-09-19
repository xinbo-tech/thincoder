# edit 工具权威语义（EDIT）

> 板块：编辑工具。权威源：CLI `thincoder-core/tools/edit-diff.mjs`（diff 内核/判定序）+ `thincoder-core/tools/edit-batch.mjs`（D1/D2 纯函数）+ `thincoder-core/tools/file.mjs`（editTool 壳/schema）。本文档是 **edit 工具语义的权威源**——`TOOLS.md` §6.1 只留地图（定位句 + 指针），不得复制本档正文。
> 双端：CLI（本文档）与 VSC（对位档 `EDIT（VSC 仓）`）同机制各自独立实现——镜像锚：两端工具描述逐字一致（评审逐字对齐），语义正文各自落地。
> 状态：**已实现**（D1-D3 落地 2026-09-08）。历史设计见文末「变更记录」。

## 1. 定位

edit = **按精确区域替换/删除文件内容**——主编辑工具。两种定位形态（互斥）+ 三级匹配 + 判定序 4 分支（见 §4）+ **删行形态**（行号 + 省略 new_string——见 §5 矩阵）。面向场景：知道要改/删哪一行或哪一段、或能给出当前内容——精确改。

**不是**：插入新行（→ insert_after）、按内容哈希行定位（→ hashline_edit）、整块 diff 多文件（→ apply_patch）、整文件重写（→ write）。路由在模型可见描述（`thincoder-core/tool-docs/edit.md`）的 Routing 段。

## 2. 参数与 schema

editTool（`file.mjs` editTool 对象）：

- `path`（必须）——目标文件。
- **形态二选一**：
  - **行号形态（D1）**：`line: N`（单行——1-based）/ `startLine: N, endLine: M`（行范围——1-based 闭区间）——替换该行/范围为 new_string，**不需 old_string**。
  - **内容形态**：`old_string`（必须）——变化区当前内容；`new_string`——该区期望结果。
- `new_string`——内容形态必须；行号形态**可省略（=删行/范围——8.1）**；显式空串 `""` 两形态皆拒（见 §5 矩阵）。
- `replace_all`——字面替换每处（内容形态 only；行号形态不适用）。
- `edits`（数组批量）——`[{path?, old_string?, new_string?, line?, startLine?, endLine?, replace_all?}]`（条目同顶层形态语义——行号条目 new_string 省略 = 删）；互斥：edits 与顶层 old/new/line/startLine/endLine。

schema 与描述的逐字契约：`thincoder-core/tool-docs/edit.md` 是模型可见文本（运行时经 DESC() 加载为 description），与本文档语义一致——两处维护点，改语义须同改。

## 3. 匹配档位（D2——内容形态）

old_string 匹配三级档序（宽容——模型差异容忍）：

1. **逐字**——精确字符串匹配。
2. **唯一空白差异窗口**——逐字 occurrences=0 时按行 trim() 等价的唯一窗口自动应用（附 note）；多窗口歧义仍 not-found（不猜）。
3. **模糊匹配**——唯一窗口：行级 normalize（**8.2 统一基准：去首尾空白+去行尾空格 / tab→2 空格 / `'`/`‘’`/`“”`/反引号单遍映射到 `"`（无顺序依赖）/ 无行内折叠**）后逐行相等比例 ≥90% 即匹配（附 `fuzzy matched` note 明示）；多窗口歧义 / 不足阈值仍 not-found 报错（不猜）。


## 4. 判定序

内容形态替换后行级 diff 判定（在 normalize(LF) 域做行级 LCS）：

1. **分支 0（就地替换）**：old 恰单行 ∧ new 恰单行 ∧ 全文唯一匹配 ∧ new 非空 → 就地整行替换（行数不变）。
2. **零重叠**（old 每行都不在 new）：**替换即删**（D3——breaking：old 行整体删除、new 取而代之——旧行不再保留；原"插入保留旧行"语义废止；新增行用 insert_after）。
3. **一般 LCS diff**：公共行保留（LCS 序）、old 独有删、new 独有插。
4. **平凡**：new 与 old 行级全等 → 原样替换（no-op 成功）。

**行号形态**（不经判定序）：定位行/范围 → 直接替换为 new_string（行数 = 范围行数 → new 行数）；**省略 new_string = 删行**（行数 → 0——删行形态 8.1，返回 `Deleted line N / lines N-M of <path>` + diff）。越界/互斥见 §5。

## 5. 约束

- **空串 vs 省略矩阵（8.1 裁定——2026-09-08 实现落地）**：
  - 内容形态空 `new_string` = 显式错误（提示须带保留上下文行；单行替换永不成删除——防删除保护先于分支 0；含 replace_all 空串——守卫先于 replace_all 分支）；
  - 行号形态**省略 new_string** = 删行/范围（有界意图——删哪行是显式声明）；
  - 行号形态**显式空串 `""`** = 显式错误（防误删——提示"省略 new_string 以删行"）；
  - **批量 edits 条目**同顶层（条目含行号 + 省略 new_string = 删行；内容条目空串拒）。
- **互斥**：行号形态与 old_string；line 与 startLine/endLine；edits 与顶层形态——均显式报错。
- **行号校验**：line/startLine/endLine 正整数；startLine ≤ endLine；endLine ≤ 文件行数（越界报错）；删行形态同校验。
- **replace_all**：每处 old→new **字面替换**（不做插入/分支 0）；多匹配无 replace_all → occurrences 错误。
- **edits 数组**：同文件多条**串行累积**、跨 path 并行、**全判后原子写**（任一失败全不写）；条目内同样二选一（old_string 或行号）。顶层 path = 无自带 path 条目的默认，条目自带 path 优先。
- **行数上限**：old/new 各 ≤1000（超限报 "edit region too large"）。
- **not-found 引导**：错误含 `searched:` + grep 建议 + `similar lines (top 3, score)` 段（LCS 连续子串 / 阈 0.5 / top3，单行也覆盖；零候选省略——算法权威见 EDIT-HELPERS.md findCandidates）。
- **空 new_string 内容形态**：显式错误（同 §5 首条）。
- **数据新鲜度**：old_string/行号只来自最新 read——改前 re-read。

## 6. 实现单一权威

CLI `thincoder-core/tools/edit-diff.mjs` 导出 `applyPatchLines` / `computeEditEntry` / `validateEditEntry` / `assertEditArgsExclusive` / `hasLineParams` / `splitLines` / `deleteTarget`（删行形态——2026-09-08）；
D1/D2 纯函数落点 `thincoder-core/tools/edit-batch.mjs`（`applyLineEdit` / `findFuzzyWindow` / `normalizeEditLine` / `FUZZY_MATCH_NOTE`——edit-diff 调用期导入，ESM 循环安全）；本地单形态 / edit-batch / ACP 桥三通道共用；VSC 镜像 `edit-diff.mjs`。

EOL 写回（detectFileEol/joinWithEol/majorityEol）与失败候选（findCandidates/FFFD_WARNING）——**共享 helper 权威见 `EDIT-HELPERS.md`**，此处不复制（单一权威）。

## 7. 测试

`test/edit-tool-improvement.test.mjs`（**33 用例——29 快 + 4 slow**：删行形态全路径/显式空串拒含 replace_all/normalize 弯引号命中 + 单遍映射单元/防误匹配/批量删行+模糊端到端——2026-09-08 阶段 2 实测校准）。

- 2026-09-08：阶段 2 实现落地（本档原 §8 变更段并入本档 §1-§7）——删行形态（行号省略 new_string = 删，显式空串/内容空串拒）+ normalize 统一（单遍逐字符映射 `'`/`‘’`/`“”`/反引号 → `"`——无行内折叠——双端同算法）+ 描述/提示词改写（路由段/空串 note/discipline/system 陈旧句）+ 代码注释 §15 旧编号清理。
## 变更记录

- 2026-09-08：文档重组——edit 工具语义从 TOOLS §6.1 + EDIT-TOOL-IMPROVEMENT.md 并入本文档（每工具一档——TOOLS 退地图）。状态"已实现"（D1-D3 落地：按行号改/模糊匹配/替换即删——原 IMPROVEMENT 档设计 + AC1-AC5 + 测试表 8 用例，见 `_archive/EDIT-TOOL-IMPROVEMENT.md`）。
- 阶段 2 预告（EDIT-TOOLS-REVIEW.md 变更段）：删行形态（评审裁定 A）+ normalize 统一（裁定合并两端规则）+ hashline 定位重写——实现后更新本文档对应节。
