# VSC read-history 拆分（READ-HISTORY-SPLIT）

> 板块：工具实现（VSC——read-history.mjs 382 行超 300 advisory）。权威源：CLI read-history.mjs 295 行（未超限——同构参照）。
> 状态：**已交付核销**——2026-09-09（5300f09——272/119——verbatim 字节证明——0 外部消费者不 re-export——parity 179/178 相等——audit clean + advisor pass——consume 521b9987——VSC L2 链终跑）。需求：TODO L25 ①（R18+R19 VS Code 交付跟进——read-history.mjs 349 行拆分——现 382 行续涨）。

---

## 需求

- **总体目标**：VSC read-history.mjs 382 行超 300 advisory 且续涨（349→368→382）——拆分降载——发现面（~107 行最大单段）独立成模块——纯机械 verbatim 拆分零行为改。
- **功能性**：
  - F-1 拆 2 文件：read-history.mjs（核心保留）+ 发现面模块（新——listCwdSessions/slotMeta/tidyCwd/sha1hex）
  - F-2 verbatim 移动——函数体零改——仅 imports 调整
  - F-3 外部消费方零破坏（评审 #1 规则统一）：发现面符号被 read-history.mjs 外直接消费时——0 消费者
    → 不 re-export；恰 1 直接消费者 → 直改其 import（import-only——零行为变——AC-3 零破坏语义）；
    ≥2 → core hub re-export（消费者零改动）
  - **范围边界**：CLI read-history.mjs 295 行不拆（未超限——同构但不同规模）；护栏逻辑（scanLinesSync/queryMessages/loadSessionHistory）不拆（核心内聚）；A2/其他工具零触碰。

## 设计（核实勘察骨架——功能段分类照勘察——照做勿自行解释）

### 功能段分类（现 read-history.mjs 382 行锚）
① 文件头文档块 :1-41 ② 常量+错误文案 :43-61 ③ 纯消息助手
（messageText/truncateContent/toolCallName/parseTs/toEntry）:63-113 ④ 过滤/窗口 queryMessages :115-140
⑤ 行扫护栏 scanLinesSync :142-169 ⑥ 会话文件装载 loadSessionHistory :171-199
⑦ **发现面 listCwdSessions + slotMeta/tidyCwd/sha1hex :201-307（~107 行——最大单段——最自然分文件
候选）** ⑧ 工具导出+execute :309-381

### 文件划分
1. **read-history.mjs（核心——382 → ~280）保留**：头文档 + 常量错误 + 消息助手（③）+ queryMessages + scanLinesSync + loadSessionHistory + 工具导出 execute + import 发现面 + re-export（若外部消费）
2. **read-history-discovery.mjs（新 ~110）**：listCwdSessions + slotMeta/tidyCwd/sha1hex（:201-307 verbatim 迁入）
   ——依赖核（评审 #2 设计时定 + 勘误：勘察确认发现面仅引用 node:fs/node:path + 自带工具——实现期实测
   发现实含 **node:crypto（sha1hex createHash）+ session-io.mjs（tidyCwd normalizeCwd/listCwdSessions
   sessionsDir）**——verbatim 强制非静默扩展——5300f09 交付报告三处上报——零核心私有引用约束成立）
   ——新文件头注释
3. **外部消费方核对**（实现期第一步——评审 #1 规则统一）：按 F-3 决策规则执行——0 不 re-export /
   恰 1 直改 import / ≥2 hub re-export

### 拆分机械步骤（Module Split Policy）
① write-first verbatim 迁发现面段 → ② 函数体零改仅 imports → ③ 环检查 → ④ node --check + 相关测试——断言数 parity（开工记基线——verbatim 零增零减）

### 连带更新（实施时）
- AGENTS.md 模块图（read-history 描述 + 新文件登记——若地图含）
- docs/design/README.md（评审 #4 定论：变更记录登记本档——核销时父侧执行）
- TODO L25 勾销（核销时）

## 受影响文件（VSC 单仓）

| 文件 | 改动 | 行数 |
|---|---|---|
| src/agent-tools/read-history.mjs | 核心保留 + import/reexport | 382 现（≈−100±5 → ~280——评审 #1 实测） |
| src/agent-tools/read-history-discovery.mjs | 新建——发现面 | 新（~110±5——评审 #1） |
| AGENTS.md 模块图 | 如涉及同步 | doc |
| docs/TODO.md L25 | 勾销（父侧核销时） | doc |

## 用例表（评审 #3 补——正常/边界/错误）
| 用例 | 输入 | 预期输出 |
|---|---|---|
| 正常拆分 | read-history.mjs 382 行现态 | 两文件 280/110 ±10——AC-1 |
| 0 外部消费者 | grep 发现面无外部 import | 不 re-export——AC-3 |
| 恰 1 外部消费者 | 1 模块直接 import 发现面 | 直改其 import——行为零变——AC-3 |
| ≥2 外部消费者 | 多模块 import | core hub re-export——消费者零改——AC-3 |
| 环检出 | 迁移后 import 图成环 | 停报父侧（评审 #2）——AC-2 |
| node --check | 两新/改文件 | Syntax OK——AC-2 |
| parity 失配 | 测试断言数 ≠ 基线 | 停——不交付——AC-4 |

## 验收

- AC-1 两文件拆分（read-history ~280 / discovery ~110——实测 ±10）
- AC-2 verbatim 移动（git diff 函数体零改——仅 imports/头——测试断言数 parity——基线开工记）
- AC-3 外部消费方零破坏（import 面核对——hub or 直改按消费方数）
- AC-4 测试绿（read-history-guard 测试 + 既有——VSC npm test 快层——断言计数 = 基线）
- AC 红线：行为零改（纯重构——护栏/窗口/装载逻辑零变——CLI 零触碰）

## 变更记录
- 2026-09-09：read-history 拆分落档（代码正确性核实一手——382 行实读 + 段分类 + 发现面 107 行拆出候选——机械拆分纪律同 ACTIVITY-SPLIT）。
