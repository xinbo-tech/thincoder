# apply_patch 工具权威语义（APPLY-PATCH）

> 板块：编辑工具。权威源：VSC `src/tools/more-file.mjs`（W14 已迁核——现体 `thincoder-core/tools/patch.mjs`）（apply_patch 工具——无坐标 hunk/文件头容缺/多文件原子）。本文档是 **apply_patch 语义的权威源**——VSC `TOOLS.md` §9 只留地图（定位句 + 指针），不得复制本档正文。
> 双端：VSC（本文档）与 CLI（thincoder——同机制各自实现）。
> 状态：**已实现**。

## 1. 定位

apply_patch = **统一 diff 形态应用到一或多个文件，原子**（任一 hunk 失败全不写）。**整块/多文件/新建文件形态**——与 edit（逐条精确）互补（路由权威：AGENT-LOOP.md §18）。

**适用**：一次新建多个文件（每文件 `--- /dev/null` 头）、整文件替换、跨文件重构——一个 diff 调用覆盖整变更。
**不是**：单文件小改（→ edit）、整文件重写（→ write）、删文件（→ delete 工具）。

## 2. 参数与语法

- `patch`（必须）——unified diff 文本。每文件 `--- a/<path>` / `+++ b/<path>` 头对，后接 `@@ -old,count +new,count @@` hunks。`--- /dev/null` 新建文件。

**宽容格式**（同 CLI——语义权威细节见 `APPLY-PATCH（CLI 仓·设计）` §2，本文档不复制正文）：
- `+++ b/<path>` 头对可省（既有文件——lone `--- a/<path>` 后直接接 hunk）。
- 无坐标 hunk（裸 `@@`）：上下文 <2 且含 ≥1 `-` 行 → 锚 = 匹配行序列连续；唯一匹配即应用；多匹配报错；纯 `+` 零上下文拒。
- 文件头容缺（`--- /dev/null` 缺 `+++` 拒；`-- x` 内容不误判；多文件混合；空段过滤）。
- 标准坐标格式并存；hunk 体 `-`/`+` 语义不变。

## 3. 定位规则（hunk）

hunk 按上下文/删除行定位，非行号——上下文须与文件精确匹配（先 read 再从实际内容生成）；一 hunk 多处匹配 → 拒绝。

## 4. 约束

- 删文件不支持（→ delete 工具）。
- 返回值：应用摘要 + 每文件变更 + syntax-check 注（.mjs）。
- **EOL**：写回按原行尾（F1）；新建按 majorityEol（F2）——EDIT-HELPERS.md §3。

## 5. 何时用（模型路由）

跨文件/多文件/整块/新建多个 → apply_patch（一次授权）；单文件小改 → edit；加新行 → insert_after；整文件重写 → write。

## 变更记录

- 2026-09-08：文档重组——apply_patch 语义从 VSC TOOLS.md §9 + more-file.mjs 内嵌描述并入本文档（每工具一档）。
