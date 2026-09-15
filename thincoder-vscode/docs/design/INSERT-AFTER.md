# insert_after 工具权威语义（INSERT-AFTER）

> 板块：编辑工具。权威源：VSC `src/tools/more-file.mjs`（W14 已迁核——现体 `thincoder-core/tools/file.mjs`）（insert_after 工具——after_line/after_regex）。本文档是 **insert_after 语义的权威源**——VSC `TOOLS.md` §9 只留地图（定位句 + 指针），不得复制本档正文。
> 双端：VSC（本文档）与 CLI（thincoder——同机制各自实现；**VSC 差异**：无 CLI 的 dirty read-before-insert 护栏——见 §3）。
> 状态：**已实现**。

## 1. 定位

insert_after = **在已知行后插入新行**——纯插入（不改/不删现有内容）。比 edit 加新内容更安全：不必编造上下文做精确匹配。

**适用**：加新行——checklist 条目 / 文档行 / 标题 / 散文行 / 函数 / import / block。**不是**：改/删现有内容（→ edit/hashline_edit）、整文件重写（→ write）。

## 2. 参数与 schema

- `path`（必须）。
- `content`（必须）——要插入的文本（成为目标行后的新行）。
- 定位（二选一，都无则错）：
  - `after_line`（1-based 行号）——知道确切行号时首选（来自 read）。
  - `after_regex`——JS 正则找行；**必须恰匹配一行**（多匹配报错并显示匹配行号）。

**互斥/优先级**：after_line 与 after_regex 都给 → after_line 赢。语义：`lines.splice(targetLine, 0, content)`。

## 3. 精确判定

- **VSC 无 dirty 机制**（CLI 有 read-before-insert 护栏——受影响区拒绝；VSC 行号漂移靠模型自觉 re-read——差异记录）。
- **编辑器路径**：doc 已打开 → 编辑器分支（换行符按 fileEol——normalizeEOL + 消除 $ 锚失配与混合 EOL 注入——EDIT-HELPERS.md §5）。

## 4. 何时用（模型路由）

加新行（checklist/文档行/函数/import）→ insert_after（首选）；改/删 → edit/hashline_edit；整文件 → write。

## 变更记录

- 2026-09-08：文档重组——insert_after 语义从 VSC TOOLS.md §9 + more-file.mjs 内嵌描述并入本文档（每工具一档）。
