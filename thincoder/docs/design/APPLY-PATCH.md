# apply_patch 工具权威语义（APPLY-PATCH）

> 板块：编辑工具。权威源：CLI `src/tools/patch.mjs`（无坐标 hunk 宽容/文件头容缺/多文件原子）。本文档是 **apply_patch 语义的权威源**——`TOOLS.md` §6.4 只留地图（定位句 + 指针），不得复制本档正文。
> 双端：CLI（本文档）与 VSC（thincoder-vscode——同机制各自实现）。
> 状态：**已实现**。

## 1. 定位

apply_patch = **统一 diff 形态应用到一或多个文件，原子**（任一 hunk 失败全不写）。**整块/多文件/新建文件形态**——与 edit（逐条精确）互补（路由权威：AGENT-LOOP.md:140-141）。

**适用**：一次新建多个文件（每文件 `--- /dev/null` 头）、整文件替换、跨文件重构（改接口 + 全调用方）——一个 diff 调用覆盖整变更（一次授权/一个 undo 单元/一个 turn）。
**不是**：单文件小改（→ edit 更简单）、整文件重写（→ write）、删文件（→ delete 工具）。

## 2. 参数与语法

- `patch`（必须）——unified diff 文本。每文件 `--- a/<path>` / `+++ b/<path>` 头对，后接 `@@ -old,count +new,count @@` hunks。`--- /dev/null` 新建文件。

**宽容格式**：
- `+++ b/<path>` 头对可省（既有文件——lone `--- a/<path>`（或 `--- b/`）后直接接 hunk 即应用到该 path；新建仍须 `--- /dev/null` + `+++ b/<path>`）。
- **无坐标 hunk**：裸 `@@` 若上下文行 <2 且含 ≥1 `-` 行 → 定位锚 = hunk 内匹配行序列（空格上下文 + `-` 行按出现序）连续；唯一序列匹配即应用（`-` 后随 `+` = 替换、无 `+` = 删除）；0/1 上下文同待遇。多匹配 → 报错（matches N locations）；纯 `+` 零上下文（无 `-` 锚）仍拒（位置不明）；上下文 ≥2 走既有路径。
- **文件头容缺**：`--- /dev/null` 缺 `+++ b/<path>` → 仍拒并特报（新文件名不可推导）；`-- x` 内容删行不误判文件头；多文件补丁完整/容缺可混合；空段过滤（不虚报 touchedPaths）。
- 标准坐标格式 `@@ -old,count +new,count @@` 不变，两格式并存；hunk 体 `-`/`+` 行语义不变。

## 3. 定位规则（hunk）

hunk 按**上下文/删除行定位，非行号**——但上下文必须与文件**精确匹配**（先 read 再从实际内容生成 patch）；一 hunk 上下文匹配多处 → 拒绝（加更多上下文）。

## 4. 约束

- 删文件不支持（→ delete 工具）。
- 返回值：`Applied patch to N file(s)` + 每文件变更行 + 变更 .mjs 的 syntax-check 注。
- **EOL**：写回按原行尾（detectFileEol/joinWithEol——EDIT-HELPERS.md §4 F1）；新建按 majorityEol（F2）。

## 5. 何时用（模型路由）

跨文件/多文件/整块/新建多个 → apply_patch（一次授权）；单文件小改 → edit；加新行 → insert_after；整文件重写 → write。

## 变更记录

- 2026-09-08：文档重组——apply_patch 语义从 TOOLS §6.4 + apply_patch.md 描述并入本文档（每工具一档）。
