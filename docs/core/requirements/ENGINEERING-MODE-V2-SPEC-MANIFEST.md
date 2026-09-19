# Function Spec · M1 项目状态档 manifest

> 模块划分权威源 = `docs/core/design/ENGINEERING-MODE-V2.md` §2.2（M1）

## ① 模块目标

为工程模式提供**项目状态账**——一个纯机器状态的 JSON 声明档，被开发项目用它申明「我是什么阶段、文档放哪、机检怎么判」。

一次声明，多处读取：文档体系落点（`docRoot`）、机检判据（`checkConfig`）、情境旋钮（`phase`）、提示词落地（`promptsLanding`）全部从这一处取，机制不硬编码任何本仓路径。

## ② 功能点

1. **schema 定义**（五键）：`version` · `phase` · `docRoot` · `promptsLanding` · `checkConfig`。
2. **读 / 写 / 校验器**（`thincoder-core/manifest.mjs`）——机制代码在核，操作对象 = 被开发项目**项目根**（= git 仓根——判据 = .git **纯向下**：锚自身仓 → 自身；否则向下唯一带 manifest 子仓；2026-09-17 用户裁定）的 `PROJECT-MANIFEST.json`（数据档）。
3. **整档缺失处置**（**会话权威值**口径——槽优先 + config 回退；普通会话＝**装配钩子零 manifest I/O**；2026-09-18 台账 #30 收正）：manifest 不存在 → **拒绝进入正常循环**，先走初始化（定阶段 + 盘家底）生成 manifest，再进正常循环；**项目根不可解析（锚非仓 ∧ 向下带 manifest 子仓 ≠ 1）→ 拒（不自动建档）**。
4. **缺键 fallback**：manifest 存在但缺某键 → 用默认值（便利 fallback，不拒绝）。
5. **写门**：唯一作者 = 主 agent（非主 agent 写 → 拒）。
6. **`docRoot` 值形态（多根数组）**：值 = 非空串 **或** 非空数组（数组 = 完整声明——不与默认合并；解析基数 = 项目根，展开 → 归一 → 去重保序；非法形态 = 校验拒，不静默——2026-09-17 用户裁定「支持多根数组」）。

## ③ 边界（不做什么）

- 不做台账（M2）；不做机检（M8）；不做批次档写入（M3）。
- 不替被开发项目创建目录；不做交互式初始化问答（初始化流程归两端壳面，本模块只提供读写校验）。
- 不承载「待裁 / 决策」类内容（manifest 是纯机器状态，决策进文档）。

## ④ 验收（逐条可机判）

| # | 判据 | 方式 |
|---|---|---|
| AC-M1-1 | `phase` 取值非法 → 校验拒 | 构造非法值 → 期望拒 |
| AC-M1-2 | 整档缺失（**会话权威值**：槽优先 + config 回退）→ 拒绝进入正常循环（不静默 fallback） | 删 manifest → 期望拒 + 提示初始化；普通会话（会话权威值 `engineering !== true`）→ **装配钩子零 manifest I/O**（不拒 / 不建档） |
| AC-M1-3 | `docRoot` 缺键 → 用默认值（不拒） | 删某键 → 期望取默认值 |
| AC-M1-5 | 非主 agent 写 manifest → 拒 | 以非主 agent 写 → 期望拒 |
| AC-M1-6 | 情境行注入（#28）：`phase` 逐回合注入模型上下文（幂等 / 单活体 / 压缩自愈 / 门控；**2026-09-18 #34 批补：值变检测 = mtime 门控重读（③b）——AC-N7 / N7b / N7c / N7d 在册**） | 判据逐条 = 设计 `docs/core/design/MANIFEST.md` §3.1 AC-N1–AC-N6、AC-N3b、**AC-N7–AC-N7d** |
| AC-M1-7 | `docRoot` 值形态（多根数组）：单串零变 / 数组展开 / 去重 / 补默认不合并 / 非法拒 / 消费面兼容 | 判据逐条 = 设计 `docs/core/design/MANIFEST.md` §3.1 AC-7–AC-13 |
| AC-M1-8 | 二道防线（M5 spawn 门）：工程模式子代理 `files` 声明含 `PROJECT-MANIFEST.json`（任意层 / 任意大小写）→ 拒（专用文案） | 声明该路径 → 期望拒 |

## ⑤ 依赖

- **上游**：无（基础模块）。
- **下游**：M2 / M3 / M4 / M6 / M8 / M9 读 manifest 字段（`docRoot` / `checkConfig` / `phase` / `promptsLanding`）。

## 需求依据

v2 §5.1（manifest）· §6（文档体系四层 + 目录约定 + 声明面覆盖）· §9（情境旋钮）· 架构设计 §2.3 E1 / E2 / E5。
