# edit 工具改进：符合模型直觉（CLI 端）

> 板块：工具语义 · edit 编辑。状态：**设计（待评审）**——2026-09-08 用户需求点（edit 成功率低——old_string 精确匹配太严格 + LCS 保留旧行 + 无按行号改）。用户裁定：D 全都要（按行号改 + 模糊匹配 + 替换即删）。
> 背景：edit 工具成功率低（本会话失败 5+ 次：old_string 找不到/LCS 保留旧行/反复 fallback 到 execute）——不符合模型直觉（模型知道要改哪一行/哪一段，但 edit 要求精确 old_string 匹配，细微差异就失败）。归属 TOOLS.md §15 edit 语义升级——双端（CLI/VSC）同机制各自独立实现。
> 范围：CLI 端 edit 工具改进（按行号改 + 模糊匹配 + 替换即删）；VSC 同名对应（各自独立实现）。

## 1. 需求

### 总体
edit 工具改进为**符合模型直觉**——模型知道要改哪一行/哪一段（行号或大致位置），edit 应该支持按行号改、模糊匹配、替换即删，不用猜精确 old_string。

### 功能性需求
- **F1（按行号改）**：edit 加 `line`/`startLine`/`endLine` 参数——知道行号就能改（单行替换 `line: N`、行范围替换 `startLine: N, endLine: M`），不用猜 old_string。与 old_string/new_string 互斥（二选一）。
- **F2（模糊匹配）**：old_string 放宽匹配——细微差异（空白/缩进/引号不同/行尾空格）也能匹配。**相似度算法定稿（评审 #4）**：行级 normalize 后逐行相等比例（≥90% 行相等即匹配——normalize = 去首尾空白/统一缩进/统一引号/去行尾空格）。
- **F3（替换即删）**：替换后旧行自动删（不留残留）——当前 edit 的**零重叠→插入分支**保留旧行（edit-diff.mjs:9——旧内容保留，数据零丢失），改为替换即删（old_string 匹配到的行被 new_string 替换后，旧行从文件消失）。**落点定死（评审 #2）**：`src/tools/edit-diff.mjs`（LCS 算法改——零重叠插入分支改替换即删；LCS 分支本身删差异行，无需改）。

### 非功能性需求
- N1（向后兼容——**接口兼容**）——现有 old_string/new_string 参数接口保持可用（按行号改是新增，不替代）；**语义兼容限定（评审 #3）**：D3 替换即删是对现有 old_string 路径语义的 breaking 变更（edit-diff.mjs:4 已声明该语义为 breaking 裁定）——接口兼容但语义结果变（旧行不再保留）。
- N2（原子性）——edit 保持原子（全改或全不改——按行号改/模糊匹配/替换即删都保持原子）。
- N3（双端一致）——CLI/VSC 同机制语义各自实现。

## 2. 设计（CLI 端落地）

### 现状
- CLI edit 工具实现：`src/tools/edit-batch.mjs`（批量 edits）+ `src/tools/edit-diff.mjs`（diff 形态）+ 文档 `src/tools/edit.md`/`hashline_edit.md`。
- edit 参数：path/old_string/new_string/edits（数组）/replace_all——old_string 精确匹配（细微差异失败）+ LCS 保留旧行（替换后旧行还在）。

### D1 按行号改（F1）
- edit 加参数：`line`（单行替换——1-based 行号）、`startLine`/`endLine`（行范围替换——1-based 闭区间）。
- 与 old_string/new_string 互斥（二选一——按行号改时不需 old_string）。
- 实现：读文件 → 按行号定位 → 替换该行/行范围 → 写回（原子）。
- 落点：`src/tools/edit-batch.mjs`（加 line/startLine/endLine 参数处理）+ 工具描述/schema（edit.md 加参数说明）。

### D2 模糊匹配（F2）
- old_string 匹配算法改：normalize 后比较——去首尾空白/统一缩进（tab vs space）/统一引号（单双引号）/去行尾空格。
- 匹配失败时 fallback fuzzy match（相似度阈值——如 90% 相似即匹配）。
- 落点：`src/tools/edit-batch.mjs`（old_string 匹配算法改 normalize + fuzzy）+ 工具描述（模糊匹配说明）。

### D3 替换即删（F3）
- 替换后旧行自动删：old_string 匹配到的行被 new_string 替换后，旧行从文件消失（不留残留）。
- 当前 edit 的 LCS 保留旧行（替换后旧行还在）——改为替换即删（LCS 不保留旧行）。
- 落点：`src/tools/edit-diff.mjs`（LCS 算法改——替换后旧行删）或 `edit-batch.mjs`（替换逻辑改）。

### D4 工具描述/schema 更新
- edit.md 加参数说明（line/startLine/endLine + 模糊匹配 + 替换即删）+ 工具 schema 加参数（edit-batch.mjs 的 schema 定义）。

## 3. 受影响文件（CLI，thincoder）

- 修改：`src/tools/edit-batch.mjs`（**92 行**——评审 #1 实测修正，加 line/startLine/endLine 参数 + old_string 模糊匹配 + 替换即删——delta ~+80→~172 行，远低于 300 行触发线，无 split plan 需求）、`src/tools/edit-diff.mjs`（**~266 行**——评审 #1 实测修正，LCS 算法改替换即删——delta ~-20）、`src/tools/edit.md`（工具描述加参数说明——delta ~+30）
- 新增：`test/edit-tool-improvement.test.mjs`（按行号改/模糊匹配/替换即删用例——预估 ~150 行）
- 文档：本设计 + README 地图登记 + TOOLS.md §15（edit 语义升级记录）

## 4. 验收

AC1 = edit 按行号改（line/startLine/endLine 参数——知道行号就能改，不用 old_string）；AC2 = old_string 模糊匹配（细微差异/空白/缩进/引号不同也能匹配）；AC3 = 替换即删（替换后旧行自动删——不留残留）；AC4 = 向后兼容（现有 old_string/new_string 精确匹配保持可用）；AC5 = 双端语义一致。

## 测试用例表

| 用例 | 输入/场景 | 预期输出 | 对应 |
|---|---|---|---|
| 正常按行号改 | `edit(path, line: 10, new_string: "新内容")` | 第 10 行替换为新内容（不用 old_string） | AC1 |
| 正常行范围改 | `edit(path, startLine: 5, endLine: 8, new_string: "新内容")` | 第 5-8 行替换为新内容 | AC1 |
| 正常模糊匹配 | old_string 与文件有细微差异（空白/缩进/引号不同） | 匹配成功（normalize 后比较） | AC2 |
| 正常替换即删 | old_string 匹配到的行被 new_string 替换 | 旧行从文件消失（不留残留） | AC3 |
| 边界互斥 | 同时给 line 和 old_string | 明确错误（二选一） | AC1 |
| 边界行号越界 | line: 999（文件只有 100 行） | 明确错误（行号越界） | AC1 |
| 向后兼容 | 现有 old_string/new_string 精确匹配 | 保持可用（按行号改是新增，不替代） | AC4 |
| 错误模糊匹配失败 | old_string 与文件差异太大（<90% 相似） | 明确错误（不匹配） | AC2 |

## 变更记录
- 2026-09-08：立项。用户需求点（edit 成功率低——old_string 精确匹配太严格 + LCS 保留旧行 + 无按行号改）+ 用户裁定 D 全都要（按行号改 + 模糊匹配 + 替换即删）。
