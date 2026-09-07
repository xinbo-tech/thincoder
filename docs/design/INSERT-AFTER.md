# insert_after 工具权威语义（INSERT-AFTER）

> 板块：编辑工具。权威源：CLI `src/tools/file.mjs`（:270-356——after_line/after_regex + read-before-insert 护栏 dirty 跟踪 :33-67 + lastWrite 受影响区判定）。本文档是 **insert_after 语义的权威源**——`TOOLS.md` §6.2 只留地图（定位句 + 指针），不得复制本档正文。
> 双端：CLI（本文档）与 VSC（thincoder-vscode——同机制各自实现；VSC 无 dirty 机制——见 §4 差异）。
> 状态：**已实现**。

## 1. 定位

insert_after = **在已知行后插入新行**——纯插入（不改/不删现有内容）。比 edit 加新内容更安全：**不必编造上下文做精确匹配**（edit 加行要 old_string 含周围行；insert_after 只要行号/正则）。

**适用**：加新行——checklist 条目 / 文档行 / 标题 / 散文行 / 函数 / import / block。**不是**：改/删现有内容（→ edit/hashline_edit）、整文件重写（→ write）。

## 2. 参数与 schema

- `path`（必须）。
- `content`（必须）——要插入的文本（成为目标行后的新行）。
- 定位（二选一，都无则错）：
  - `after_line`（1-based 行号）——知道确切行号时首选（来自 read）。
  - `after_regex`——JS 正则找行；**必须恰匹配一行**（多匹配报错并显示匹配行号）。

**互斥/优先级**：after_line 与 after_regex 都给 → **after_line 赢**。语义：`lines.splice(targetLine, 0, content)`。

## 3. 精确判定（dirty 护栏——CLI）

insert_after 定位基于行号/正则，文件若在 read 后被别的写工具改过，行号会漂移 → **静默错位**。护栏（CLI file.mjs dirty 跟踪 :33-67）：

- 写工具记录受影响区 `lastWrite={type,startLine,shift}`。
- `after_line` 在**未受影响区**（≤startLine）→ 允许；**受影响区内** → 拒绝（错误含 "was modified since your last read"）。
- write 全文重写 → 任何 after_line 拒绝。
- read 清 dirty + 写快照。
- **差异**：VSC 端无 dirty 机制（read-before-insert 护栏不适用——行号漂移靠模型自觉 re-read）。

## 4. EOL

VSC 端 insert_after normalizeEOL + 编辑器分支换行符按 fileEol（消除 $ 锚失配与混合 EOL 注入）——见 EDIT-HELPERS.md / VSC 侧档。

## 5. 何时用（模型路由）

加新行（checklist/文档行/函数/import）→ insert_after（首选——不必编造上下文）；改/删 → edit/hashline_edit；整文件 → write。

## 变更记录

- 2026-09-08：文档重组——insert_after 语义从 TOOLS.md §6.2 + insert_after.md 描述并入本文档（每工具一档）。
