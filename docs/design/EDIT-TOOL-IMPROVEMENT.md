# edit 工具改进：符合模型直觉（VSC 端）

> 板块：工具语义 · edit 编辑。状态：**设计（待评审）**——2026-09-08 用户需求点（edit 成功率低——old_string 精确匹配太严格 + LCS 保留旧行 + 无按行号改）。CLI 同名对应（EDIT-TOOL-IMPROVEMENT.md CLI 端）——同一机制各自独立实现。用户裁定：D 全都要（按行号改 + 模糊匹配 + 替换即删）。
> 背景：edit 工具成功率低（old_string 精确匹配太严格——细微差异失败 + LCS 保留旧行——替换后旧行还在 + 无按行号改）——不符合模型直觉。归属 TOOLS.md §15 edit 语义升级——双端（CLI/VSC）同机制各自独立实现。
> 范围：VSC 端 edit 工具改进（按行号改 + 模糊匹配 + 替换即删）；CLI 同名对应（各自独立实现）。

## 1. 需求

### 总体
edit 工具改进为**符合模型直觉**——模型知道要改哪一行/哪一段（行号或大致位置），edit 应该支持按行号改、模糊匹配、替换即删，不用猜精确 old_string。

### 功能性需求
- **F1（按行号改）**：edit 加 `line`/`startLine`/`endLine` 参数——知道行号就能改（单行替换/行范围替换），不用猜 old_string。与 old_string/new_string 互斥。
- **F2（模糊匹配）**：old_string 放宽匹配——细微差异（空白/缩进/引号不同/行尾空格）也能匹配。**相似度算法定稿**：行级 normalize 后逐行相等比例（≥90% 行相等即匹配——normalize = 去首尾空白/统一缩进/统一引号/去行尾空格）。**歧义规则（评审 #2）**：唯一模糊命中才应用，多命中报错并附候选（沿用现有 similarLinesBlock 机制——file-edit.mjs 现 old_string 必须唯一精确匹配，放宽后需歧义处理）。
- **F3（替换即删）**：替换后旧行自动删（不留残留）——当前 edit 的 LCS 保留旧行，改为替换即删。

### 非功能性需求
- N1（向后兼容）——现有 old_string/new_string 精确匹配保持可用。
- N2（原子性）——edit 保持原子。
- N3（双端一致）——CLI/VSC 同机制语义各自实现。

## 2. 设计（VSC 端落地）

### 现状
- VSC edit 工具实现：`src/tools/file-edit.mjs`（456 行——editTool 对象 + schema 定义）+ `src/tools/edit-diff.mjs`（159 行——diff 形态）。**与 CLI 不同构**（CLI 是 edit-batch.mjs + edit-diff.mjs，VSC 是 file-edit.mjs + edit-diff.mjs——评审 🔴#1 实测）。
- edit 参数：path/old_string/new_string/edits/replace_all——old_string 精确匹配 + 零重叠→插入保留旧行（edit-diff.mjs:9）。
- edit 工具描述/schema：在 `file-edit.mjs` 内（editTool 对象）+ `src/prompts/coder.md`（提示词引用）。

### D1 按行号改（F1）
- edit 加参数：`line`/`startLine`/`endLine`（1-based 行号/行范围）——与 old_string/new_string 互斥。
- 实现：读文件 → 按行号定位 → 替换 → 写回（原子）。
- 落点：`src/tools/file-edit.mjs`（editTool 对象加 line/startLine/endLine 参数处理）+ schema 定义（file-edit.mjs 内）。**拆分边界（评审 #4）**：按行号改逻辑独立拆 `edit-line-params.mjs` 子模块（line/startLine/endLine 参数处理 + 行号定位 + 替换逻辑——file-edit.mjs 456+80 跨 500 硬帽，拆分后 file-edit.mjs 回 ~450 行）。

### D2 模糊匹配（F2）
- old_string 匹配算法改：normalize 后比较（去首尾空白/统一缩进/统一引号/去行尾空格）+ fuzzy match（行级 normalize 后逐行相等比例 ≥90%）。
- 落点：`src/tools/file-edit.mjs`（old_string 匹配算法改 normalize + fuzzy）。

### D3 替换即删（F3）
- 替换后旧行自动删：old_string 匹配到的行被 new_string 替换后，旧行从文件消失（零重叠→插入分支改替换即删——edit-diff.mjs:9 现语义保留旧行）。
- 落点：`src/tools/edit-diff.mjs`（零重叠→插入分支改替换即删；LCS 分支本身删差异行，无需改）。**TOOLS.md §15 D15.1 语义段同步修正**（评审 #4——零重叠→插入保留旧行 → 替换即删，机制文档与代码 1:1）。

### D4 工具描述/schema 更新
- edit.md 加参数说明 + 工具 schema 加参数。

## 3. 受影响文件（VSC，thincoder-vscode）

- 修改：`src/tools/file-edit.mjs`（**456 行**——评审 🔴#1 实测修正，editTool 对象加 line/startLine/endLine 参数 + old_string 模糊匹配——delta ~+80→~536 行，**跨 500 硬帽——拆分到 edit-line-params.mjs 子模块（按行号改逻辑独立——评审 #4 拆分边界）**）、`src/tools/edit-diff.mjs`（**159 行**——评审 🔴#1 实测修正，零重叠→插入分支改替换即删 + **头注释 :16-25/:105 同步更新**——评审 #3——delta ~-10）、`src/prompts/coder.md`（edit 工具引用说明加参数——delta ~+10）
- 新增：`src/tools/edit-line-params.mjs`（按行号改子模块——line/startLine/endLine 参数处理 + 行号定位 + 替换逻辑——预估 ~80 行）、`test/edit-tool-improvement.test.mjs`（按行号改/模糊匹配/替换即删用例——预估 ~150 行）
- 文档：本设计 + README 地图登记 + **TOOLS.md §9 逐工具契约要点**（零重叠→插入语义改替换即删——评审 #1——本仓 TOOLS.md 无 §15/D15.1，VSC edit 语义在 §9）

## 4. 验收

AC1 = edit 按行号改（line/startLine/endLine——知道行号就能改）；AC2 = old_string 模糊匹配（细微差异也能匹配）；AC3 = 替换即删（旧行自动删）；AC4 = 向后兼容（现有精确匹配保持可用）；AC5 = 双端语义一致。

## 测试用例表

| 用例 | 输入/场景 | 预期输出 | 对应 |
|---|---|---|---|
| 正常按行号改 | `edit(path, line: 10, new_string)` | 第 10 行替换（不用 old_string） | AC1 |
| 正常行范围改 | `edit(path, startLine: 5, endLine: 8, new_string)` | 第 5-8 行替换 | AC1 |
| 正常模糊匹配 | old_string 与文件有细微差异 | 匹配成功（normalize 后比较） | AC2 |
| 正常替换即删 | old_string 匹配到的行被替换 | 旧行从文件消失 | AC3 |
| 边界互斥 | 同时给 line 和 old_string | 明确错误（二选一） | AC1 |
| 边界行号越界 | line: 999（文件只有 100 行） | 明确错误 | AC1 |
| 向后兼容 | 现有 old_string/new_string 精确匹配 | 保持可用 | AC4 |
| 错误模糊匹配失败 | old_string 与文件差异太大 | 明确错误（不匹配） | AC2 |

## 变更记录
- 2026-09-08：立项。用户需求点（edit 成功率低）+ 用户裁定 D 全都要（按行号改 + 模糊匹配 + 替换即删）。
