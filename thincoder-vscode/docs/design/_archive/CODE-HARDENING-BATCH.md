> **变更史——正文冻结**（LEDGER-SELF-CONTAINED 批·2026-09-12 拆分迁入）：本档 = CLI 仓 `CODE-HARDENING-BATCH（CLI 仓）` 的**本仓份拆出承载档**
> （拆分：该档含对端路径面——各仓持其份；文字逐字搬运、零改写；对端份留源档）。源档 blob SHA（as-of 本批）= 见交接记录。

# 代码加固批（本仓份）

## 2.5 VSC subagent.mjs 过时注释（TODO L26a——VSC 侧）

- **行为**：thincoder-vscode `src/agent-tools/subagent.mjs:13-14` 仍写 "ONE tool, four actions — spawn/status/cancel/escalate"，与同文件 :2-3 "seven actions" 矛盾。

## 2.7 目录声明尾随空格（源档行内——本仓同洞）

- **行为**：normalizeFileList 对 "test/ "（尾随空格）仍逃过——目录声明带尾随空格未检测。**双端同洞（评审 #3）**：CLI `src/agent-tools/subagent-scheduler.mjs:38` + VSC `src/agent-tools/subagent-scheduler.mjs:104`（:99-123 normalizeFileList 字节同款——endsWith 同逃）。
- **测试锚（源档父侧裁）**：VSC 镜像 2.7 以 CLI 为单一测试锚（2026-09-08 父侧裁——双端字节同款代码由 CLI 用例锁定——VSC 补测冗余）。

## 受影响文件（源档 §受影响表——本仓行）

| 文件 | 端 | 条目 | 行数 | 增量 |
|---|---|---|---|---|
| `src/agent-tools/subagent.mjs` | VSC | 2.5 注释 | ~509（>500——现存债 TODO:12 489 漂移——评审 #2 注：不在本批拆） | ≤±1 |
| **`src/agent-tools/subagent-scheduler.mjs`** | **VSC** | **2.7 同款 trimEnd（评审 #3——VSC 镜像同洞——:99-123 normalizeFileList 字节同款）** | **~123** | **≤±1** |

## 镜像核查记录（源档行内）

- **VSC 镜像核查（TODO L16 后半——评审 #6）**：thincoder-vscode/src 全查无 snapshotForUndo/_undoStack/cmd-undo——VSC 无 /undo 对应机制——镜像核查 = N/A（本批仅 CLI）。

## 变更记录

- 2026-09-08：源档落档 + 重评审 6 项采纳（详见源档变更记录）。
- 2026-09-12：本仓份拆出建档（LEDGER-SELF-CONTAINED 批——拆分承接；逐字搬运、零改写）。
