# memory 工具完善：delete scope 不一致 bug 修复（VSC 端）

> 板块：工具语义 · memory 记忆。状态：**设计（待评审）**——2026-09-08 用户发现（memory search/list 能找到记忆但 delete 找不到——scope 不一致）。CLI 同名对应（MEMORY-TOOL-SCOPE-FIX.md CLI 端）——同一机制各自独立实现。用户裁定：设计吧。
> 背景：memory search/list 能找到记忆（跨 scope 搜），但 delete 找不到（限定 scope 找不到——scope 不一致）。归属 MEMORY.md 工具语义——双端（CLI/VSC）同机制各自独立实现。
> 范围：VSC 端 memory 工具完善（delete scope 不一致 bug 修复）；CLI 同名对应（各自独立实现）。

## 1. 需求

### 总体
memory 工具的 search/list/delete scope 解析统一——search/list 能找到的记忆，delete 也该能找到（scope 解析一致），不再出现"能找到但删不掉"的不一致。

### 功能性需求
- **F1（delete scope 解析统一）**：delete 的 scope 解析与 search/list 一致——跨 scope fallback 或不限定 scope。
- **F2（scope 显示）**：search/list 结果显示记忆实际 scope（personal/project/team）。

### 非功能性需求
- N1（向后兼容）——现有 delete 指定 scope 保持可用（跨 scope 找是 fallback）。
- N2（一致性）——search/list/delete 的 scope 解析逻辑统一。
- N3（双端一致）——CLI/VSC 同机制语义各自实现。

## 2. 设计（VSC 端落地）

### 现状
- VSC memory 工具实现：`src/memory/core.mjs`（核心——search/list/delete）+ 可能的 CLI 命令层（与 CLI 同构——双端同机制）。
- search/list：跨 scope 搜；delete：限定 scope 找（scope 解析不一致）。

### D1 delete scope 解析统一（F1）
- delete 的 scope 解析改：先按指定 scope 找，找不到则跨 scope fallback（personal → project → team）——与 search/list 一致。
- 落点：`src/memory/core.mjs`（delete 函数 scope 解析改跨 scope fallback）。

### D2 scope 显示（F2）
- search/list 结果显示记忆实际 scope——每行加 scope 字段。
- 落点：`src/memory/core.mjs`（search/list 结果加 scope 字段）+ CLI 命令层（输出加 scope 显示）。

### D3 scope 查找函数统一（N2）
- search/list/delete 共用同一套 scope 查找函数（`findMemoryById(id, scope?)`——scope 可选，不给则跨 scope 找）。
- 落点：`src/memory/core.mjs`（抽统一 scope 查找函数）。

## 3. 受影响文件（VSC，thincoder-vscode）

- 修改：`src/memory/core.mjs`（~400 行，delete scope 解析改跨 scope fallback + search/list 结果加 scope 字段 + 抽统一 scope 查找函数——delta ~+30）、CLI 命令层（~200 行，输出加 scope 显示——delta ~+10）
- 新增：`test/memory-scope-fix.test.mjs`（delete 跨 scope 找/search-list 显示 scope 用例——预估 ~100 行）
- 文档：本设计 + README 地图登记 + MEMORY.md 工具语义

## 4. 验收

AC1 = delete 能找到 search/list 能找到的记忆（跨 scope 找）；AC2 = search/list 结果显示记忆实际 scope；AC3 = 向后兼容（delete 指定 scope 保持可用）；AC4 = scope 查找函数统一；AC5 = 双端语义一致。

## 测试用例表

| 用例 | 输入/场景 | 预期输出 | 对应 |
|---|---|---|---|
| 正常 delete 跨 scope 找 | delete id（记忆在 team scope，delete 指定 personal） | 找到并删（跨 scope fallback） | AC1 |
| 正常 search/list 显示 scope | search/list 记忆 | 结果显示实际 scope | AC2 |
| 向后兼容 | delete 指定 scope（记忆在该 scope） | 找到并删（指定 scope 优先） | AC3 |
| 边界 delete 指定 scope 找不到但其他 scope 有 | delete id 指定 personal（记忆在 project） | 跨 scope fallback 找到并删 | AC1/AC3 |
| 边界 delete id 不存在 | delete 不存在的 id | 明确错误（不存在） | AC1 |
| 一致性 | search/list/delete scope 解析 | 共用同一套 scope 查找函数 | AC4 |
| 错误 delete 限定 scope 找不到（旧行为） | delete id 指定 personal（记忆在 team——旧行为报错） | 新行为：跨 scope fallback 找到并删 | AC1 |

## 变更记录
- 2026-09-08：立项。用户发现（memory search/list 能找到记忆但 delete 找不到——scope 不一致）+ 用户裁定设计吧。
