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

## ⑤ 依赖

- **上游**：M1（`docRoot`——双基底解析）。
- **下游**：M4（冻结窗口读被审批次档）。

## 需求依据

v2 §5.3（批次档）· §6.3（就地更新规则）· 架构设计 §2.3 E1（六段表）· E3（段白名单门禁）。
