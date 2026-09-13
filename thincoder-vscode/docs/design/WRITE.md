# write 工具权威语义（WRITE）

> 板块：编辑工具。权威源：VSC `src/tools/file-edit.mjs`（write 工具——整文件 + EOL 语义 + autoSyntaxCheck）。本文档是 **write 语义的权威源**——VSC `TOOLS.md` §9 只留地图（定位句 + 指针），不得复制本档正文。read 是读工具（非编辑）——语义留 TOOLS.md §9。
> 双端：VSC（本文档）与 CLI（thincoder——同机制各自实现）。
> 状态：**已实现**。

## 1. 定位

write = **整文件替换/新建**——覆盖已有文件（read 后确认整改意图）或创建新文件（含父目录）。**不是**：精确区域改（→ edit）、加新行（→ insert_after）。

## 2. 参数与 schema

- `path`（必须）——目标路径。
- `content`（必须）——全文内容。

## 3. 语义

- **整文件替换**：write 覆盖 WHOLE 文件——描述明示 "read it first——小改动用 edit/insert_after"。
- **原子**：要么完整写、要么失败。
- **autoSyntaxCheck**：写 .mjs 类文件后自动 syntax-check（结果附注）。
- **返回**：`Wrote N chars to <path>` + git diff + syntax-check note。
- **编辑器路径**：doc 已打开 → 编辑器写（undo 单元）；否则本地写盘。

## 4. EOL 语义（两条规则分清——EDIT-HELPERS.md §3）

- **覆盖既有文件**（F1）：写回按原行尾（原 CRLF → CRLF）。
- **新建文件**（F2）：默认 LF；同目录 CRLF 多数派 → majorityEol 跟随 CRLF。

## 5. 何时用（模型路由）

新建文件 / 整文件重写 → write（read 先确认）；小改 → edit；加行 → insert_after。

## 变更记录

- 2026-09-08：文档重组——write 语义从 VSC TOOLS.md §9 + file-edit.mjs 内嵌描述并入本文档（每工具一档）。
