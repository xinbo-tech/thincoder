# Function Spec · M3 批次档六段

> 模块划分权威源 = `docs/core/design/ENGINEERING-MODE-V2.md` §2.2（M3）

## ① 模块目标

批次档（md）是**流程账**：一批一份，六段一段一作者。本模块承载「段写入纪律」——每个角色只能写自己那一段，越段机械拒。

## ② 功能点

1. **六段骨架**（继承 v1 §1.12 骨架，段名按 v2 §5.3 收正）：

   | 段 | 作者 | 写入手段 |
   |---|---|---|
   | §1 目标 + 前情 + 条目 | 主 agent | 普通文档写（或 `batch` append depth-0 可选 path） |
   | §2 任务书 | eng-designer | `batch` append（段 = §2，无路径参数） |
   | §3 发现表 | 评审子代理（advisor） | `batch` append（段 = §3，工具已挂载时） |
   | §4 核验与裁决 | 主 agent | 普通文档写（或 `batch` append depth-0 可选 path） |
   | §5 实施记录 | eng-coder | `batch` append（段 = §5） |
   | §6 收口 + 状态行 | 父代理 | 普通文档写（或 `batch` close 冻结） |

2. **`batch` 工具**（action: create/append/status/close——生命周期契约 = `docs/core/design/BATCH-RECORD.md` §4）：append 段白名单——调用者身份定段号（designer → §2 · 设计评审 → §3 · coder → §5 · 主 agent → §1/§4/§6），**越段即拒**；create（骨架预齐）/ close（冻结）仅 depth-0。
3. **append-only**：段不重叠、不回改。
4. **前情指针形态**：`前情 = docs/batches/<旧档> §N（已收口 <日期>）`。
5. **相对路径解析序与防嵌套（F-BP1 · 2026-09-25 新增）**：批次档路径串在四处调用点（create / append·status·close / 评审门 / spawn 门）统一经单源档 `agent-tools/batch-paths.mjs`——基底枚举 `batchDocBases`（单源）——
   - **候选序**（相对路径）：① `resolve(cwd, p)` → ② `resolve(项目根, p)` → ③ 逐基底 `resolve(基底, p)`；**读面**取首个可读文件，**create** 取首个落基底根内者；绝对路径照旧。
   - **防嵌套锚定**：`p` 以基底的项目根相对前缀（如 `docs/batches`）打头 ⇒ 只解析项目根形；不落基底内 ⇒ fail-closed 带提示。
   - **零回归约束**：绝对路径、「参数在 + 路径可读」判据句、spawn 门与 `resolveBatchDocPath` 错误文案逐字不变。

## ③ 边界（不做什么）

- 不做评审本身（M6）；不做台账（M2）。
- 不做批次档模板定义（模板住需求档——单一权威源，本模块只做写入纪律）。
- 不做批边界判定（判定权归主 agent）。

## ④ 验收（逐条可机判）

| # | 判据 | 方式 |
|---|---|---|
| AC-M3-1 | `batch` append 越段 → 拒（角色段白名单） | 以 designer 写 §5 → 期望拒 |
| AC-M3-2 | 六段齐 + 状态行存在 | 读档结构 |
| AC-M3-4 | 已收口档被回改 → 拒 / 机检红 | 写冻结档 → 期望拒 |
| AC-M3-5 | 解析序单源：四处调用点（create / append·status·close / 评审门 / spawn 门）统一经 `batch-paths.mjs`，零第二份解析实现 | grep + 调用点实核 |
| AC-M3-6 | cwd 矩阵（项目根 / 子目录 / 上级 / 非项目目录 × {裸名 / 根相对 / cwd 相对 / 绝对}）同解；已含基底相对前缀的串不二次拼接（防嵌套 fail-closed） | 矩阵用例（BR-27–BR-35） |
| AC-M3-7 | 既有成功路径零回归（四个既有测试档逐数绿；spawn 门 / `resolveBatchDocPath` 错误文案逐字不变） | 测试全绿 + 文案断言 |

## ⑤ 依赖

- **上游**：M1（`docRoot`——双基底解析）。
- **下游**：M4（冻结窗口读被审批次档）。

## 需求依据

v2 §5.3（批次档）· §6.3（就地更新规则）· 架构设计 §2.3 E1（六段表）· E3（段白名单门禁）。

## 变更记录

- 2026-09-25（**批 ledger-key-normalize · 需求新增 · 父侧**——承用户 04:29 转报 VSC 端现象 + 04:32「并入吧」）：新增 **F-BP1 相对路径解析序与防嵌套**（四调用点统一单源 + 候选序 + 防嵌套锚定 + 零回归约束）；验收 **AC-M3-5 / AC-M3-6 / AC-M3-7**。
  痛点实证 = create 与 append 基底不对称（`batch-lifecycle.mjs:118-122` vs `batch.mjs:75-95`；cwd≠项目根时根相对串必 throw、create 同串静默嵌套——四 cwd 矩阵实测在批档 §1.2）。批档 = `docs/batches/2026-09-25-ledger-key-normalize.md`。
- 2026-09-25（**同批 · 形式收正 2 处 · 父侧直接执行 · 可 revert**）：§②-5 去 `batch-paths.mjs` 的「（拟新增）」标记（实施已落盘）· 防嵌套行去残留括注（规范面零 revision-style 表述——历史住批档 / 设计档登记面）。**零语义**；机检复跑 = 悬空 4 / 行宽 8 基线不变。
