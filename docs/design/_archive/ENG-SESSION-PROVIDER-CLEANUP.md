> **变更史——正文冻结**（2026-09-10 文档重组批）：本档为一次实施批的过程记录或已被取代的旧权威档，
> 内容 as-of 交付时点，**不作为现状依据**。现状见 `docs/README.md` 地图指向的板块权威档。

# Top-8 攒批清理：eng 会话态统一 + provider 去重（CLI 端）

> 板块：工程模式会话态 + Provider 防御层。状态：**已实现（2026-09-08 交付——代码注释引用 D1.1-D2.3——cmd-eng/retry.mjs/agent.mjs——核销行）**——2026-09-08 Top-8 #5/#6/#8 攒批（explore 核实：#5/#6 实质重叠合为一设计，#8A provider 去重独立线——文件零冲突可并行）。用户裁定：攒批一起做。
> 背景：#5 工程模式布尔双归属（agent.engineering 双写不对称）+ #6 同物多名（eng.mjs 死 persistState 分支/幽灵 payload 键既是 #5 断点又是 #6 漂移）+ #8A provider 防御三件套逐字重复（parseRetryAfter/sleepInterruptible/429 判定）。explore 核实：#5/#6 同板块（工程模式会话态）合为一设计；#8A provider 独立线（文件零交集）。
> 范围：线1（#5+#6 eng 会话态统一）+ 线2（#8A provider 去重）——两条实现线，文件零冲突，可并行 eng-coder。#8B/C（防御正则族 + 启发式兜底三处）单列决策点，不与线1/线2 耦合。

## 1. 需求

### 总体
清理 Top-8 剩余独立小件——eng 会话态统一（#5 双归属 + #6 命名漂移）+ provider 防御三件套去重（#8A），消"两个布尔不同步"隐患 + 死代码/幽灵键 + 逐字重复。

### 功能性需求

#### 线1（#5+#6 eng 会话态统一）
- **F1（双归属统一）**：`agent.engineering` 布尔权威统一为**槽文件**（session.mjs 已明定 slot 权威，config.json 只是初始默认/跨端镜像）——删 config 镜像写（cmd-eng.mjs:94-99 persistRaw 调用面）或 eng 工具补镜像（二选一，设计决策）。
- **F2（死代码清理）**：eng.mjs:33-48 死 persistState 分支删除（`ctx.persistState(...)` 无提供方——死分支）+ 幽灵 payload 键（engDesignReviewed/advisorRound/touchedFiles——session.mjs applySession 从不读）清理。
- **F3（命名漂移修复）**：`_engDesignReviewed` 字段归属厘清——eng.mjs:33 depth-0 父 agent 上无效写删（父门已改读 anyLiveDesignSlot）+ agent.mjs:157 depth-0 每回合重置厘清（字段名义 eng-coder-only，实际父级两处触碰——统一为 eng-coder-only 或显式父级语义）。

#### 线2（#8A provider 去重）
- **F4（parseRetryAfter 去重）**：errors.mjs:13-25 vs retry.mjs:19-31 逐字节相同——统一为单实现（errors.mjs 保留，retry.mjs 导入——解循环依赖：retry.mjs 注释自认"无 core 依赖复制于此——循环依赖回避"，需解依赖方向）。
- **F5（sleepInterruptible 去重）**：core.mjs:33 vs retry.mjs:34 同语义两份——统一为单实现。
- **F6（429 配额判定统一）**：errors.mjs isNonRetryableError（文本+JSON 双判）vs retry.mjs isQuotaExhausted（纯正则）——同源不同实现，规则已漂移（retry 版无 JSON err.code 1113/1114 结构判、有 "billing/quota exhausted" 而 errors 版正则集不同）——统一为单实现（errors.mjs 双判版保留，retry.mjs 导入）。

### 非功能性需求
- N1（改动最小）——删死代码/去重，不改语义（eng 会话态权威仍为槽，provider 判定规则不变）。
- N2（循环依赖解）——provider 去重需解 errors.mjs vs retry.mjs 依赖方向（retry.mjs 注释自认循环依赖回避——去重前解依赖）。
- N3（双端一致）——CLI/VSC 同机制语义各自实现（VSC 端是否有同样问题待核——本设计 CLI 端，VSC 镜像面另批）。

## 2. 设计（CLI 端落地）

### 现状（explore 一手核实）

#### 线1（eng 会话态）
- **权威链**：session.mjs:287-292 注释+代码明定 slot 值是 CLI 会话权威，config.json 只是初始默认/跨端镜像；cmd-eng.mjs:78-83 注释同款。
- **双写不对称**：cmd-eng.mjs:84-100 persistEngineering 真双写（slot + config 镜像）；eng.mjs:30/59 eng 工具只写内存 + persistState 死分支（无提供方）。
- **死代码**：eng.mjs:33-48 persistState 分支（ctx.persistState 全仓无提供方——死分支）+ 幽灵 payload 键（engDesignReviewed/advisorRound/touchedFiles——applySession 从不读）。
- **命名漂移**：`_engDesignReviewed` 字段名义 eng-coder-only（dispatch.mjs:172-173 仅 _role==="eng-coder" 读），实际 eng.mjs:33 depth-0 父 agent 上无效写 + agent.mjs:157 depth-0 每回合重置——归属漂移。

#### 线2（provider 去重）
- **parseRetryAfter**：errors.mjs:13-25 vs retry.mjs:19-31 逐字节相同（retry.mjs:17-18 注释自认"无 core 依赖复制于此——循环依赖回避"）。
- **sleepInterruptible**：core.mjs:33 vs retry.mjs:34 同语义两份。
- **429 判定**：errors.mjs isNonRetryableError（文本+JSON 双判）vs retry.mjs isQuotaExhausted（纯正则）——规则漂移。

### D1 线1：eng 会话态统一

#### D1.1 双归属统一（F1）
- **决策**：删 config 镜像写（cmd-eng.mjs:94-99 persistRaw 调用面）——slot 权威已明定，config 镜像冗余（eng 工具路径不写 config 镜像，/eng 路径写——不对称）。
- 落点：`src/tui/cmd-eng.mjs`（persistEngineering 删 config 镜像写——只写 slot）。

#### D1.2 死代码清理（F2）
- 删 eng.mjs:33-48 persistState 死分支（ctx.persistState 无提供方）+ 幽灵 payload 键。
- 落点：`src/agent-tools/eng.mjs`。

#### D1.3 命名漂移修复（F3）
- `_engDesignReviewed` 统一为 **eng-coder-only**——删 eng.mjs:33 depth-0 父 agent 无效写 + agent.mjs:157 depth-0 每回合重置（父门已改读 anyLiveDesignSlot，_engDesignReviewed 父级无效）。
- 落点：`src/agent-tools/eng.mjs` + `src/agent.mjs`。

### D2 线2：provider 去重

#### D2.1 依赖方向解（N2）
- retry.mjs 注释自认"无 core 依赖复制于此——循环依赖回避"——去重前解依赖：errors.mjs 保留实现，retry.mjs 导入 errors.mjs（解循环依赖——retry.mjs 不依赖 core，errors.mjs 也不依赖 retry——单向依赖 errors → retry 或 retry → errors，需实测）。
- 落点：`src/provider/retry.mjs`（改导入 errors.mjs）或 `src/provider/errors.mjs`（改导入 retry.mjs——实测依赖方向后定）。
#### D2.1 依赖方向解（N2——实测定稿）
- **实测依赖图**（评审 #1 采纳）：errors.mjs 和 retry.mjs 都独立（互不依赖，均 import rate.mjs），core.mjs 依赖 errors.mjs——**无循环依赖**（retry.mjs 注释说的"循环依赖回避"是历史遗留，现已无循环）。
- **去重方案定稿**：errors.mjs 保留实现（parseRetryAfter/isNonRetryableError），retry.mjs 改导入 errors.mjs（删重复实现）。sleepInterruptible 在 core.mjs 保留，retry.mjs 改导入 core.mjs。**不需要新建 retry-utils.mjs**（无循环依赖，直接单向导入）。
- 落点：`src/provider/retry.mjs`（删重复实现，改导入 errors.mjs/core.mjs）。

#### D2.2 parseRetryAfter 去重（F4）
- errors.mjs:13-25 保留，retry.mjs:19-31 删（改导入 errors.mjs）。

#### D2.3 sleepInterruptible 去重（F5）
- core.mjs:33 保留，retry.mjs:34 删（改导入 core.mjs——无循环依赖，单向导入）。

#### D2.4 429 判定统一（F6）
- errors.mjs isNonRetryableError（双判版）保留，retry.mjs isQuotaExhausted 删（改导入 errors.mjs）。

## 3. 受影响文件（CLI，thincoder）

### 线1（eng 会话态）
- 修改：`src/tui/cmd-eng.mjs`（~100 行，persistEngineering 删 config 镜像写——delta ~-10）、`src/agent-tools/eng.mjs`（~80 行，删 persistState 死分支 + 幽灵键 + depth-0 无效写——delta ~-20）、`src/agent.mjs`（~410 行，删 depth-0 每回合重置 _engDesignReviewed——delta ~-2）

### 线2（provider 去重）
- 修改：`src/provider/retry.mjs`（~50 行，删 parseRetryAfter/sleepInterruptible/isQuotaExhausted 重复实现——改导入 errors.mjs/core.mjs——delta ~-30）、`src/provider/errors.mjs`（~60 行，结构不变——re-export 或保持单实现）、`src/provider/core.mjs`（~400 行，结构不变——sleepInterruptible 保留）
- 可能新建：`src/provider/retry-utils.mjs`（若 core/retry 循环依赖需新 helper 模块——预估 ~40 行）

### 文档
- 本设计 + README 地图登记 + AGENT-LOOP.md 工程模式 §（eng 会话态统一记录）+ PROVIDER.md（provider 去重记录——若 VSC 有同名档）

## 4. 验收

### 线1（eng 会话态）
- AC1 = `agent.engineering` 权威统一为槽（cmd-eng persistEngineering 只写 slot，不写 config 镜像）；AC2 = eng.mjs persistState 死分支删除（grep 零命中）+ 幽灵 payload 键清理；AC3 = `_engDesignReviewed` 统一为 eng-coder-only（depth-0 父 agent 无效写删——grep 仅 eng-coder 路径读写）。

### 线2（provider 去重）
- AC4 = parseRetryAfter 单实现（errors.mjs 保留，retry.mjs 导入——grep 仅一处实现）；AC5 = sleepInterruptible 单实现；AC6 = 429 判定统一为 errors.mjs 双判版（retry.mjs 导入——规则不漂移）。

### 测试用例表

| 用例 | 输入/场景 | 预期输出 | 对应 |
|---|---|---|---|
| 正常 eng 会话态 | /eng 命令翻转 → saveSession | slot 写，config 镜像不写（统一为槽权威） | AC1 |
| 正常 eng 工具 | eng(enter)/eng(exit) | 只写内存 + 回合末 saveSession 落盘（persistState 死分支删） | AC2 |
| 正常 _engDesignReviewed | eng-coder 子代理 settle | 仅 eng-coder 路径读写（depth-0 父 agent 无效写删） | AC3 |
| 正常 parseRetryAfter | 429 响应解析 | errors.mjs 单实现（retry.mjs 导入——行为一致） | AC4 |
| 正常 sleepInterruptible | 重试间隔等待 | core.mjs 单实现（retry.mjs 导入——行为一致） | AC5 |
| 正常 429 判定 | 配额耗尽错误 | errors.mjs 双判版统一（retry.mjs 导入——规则不漂移） | AC6 |
| 边界 循环依赖 | provider 模块加载 | 无循环依赖错误（依赖方向解——单向导入） | N2 |
| 错误 eng 会话态不一致 | slot vs config 不一致 | slot 权威（config 镜像不写——不对称消） | AC1 |

## 变更记录
- 2026-09-08：立项。Top-8 #5/#6/#8 攒批——explore 一手核实（#5/#6 实质重叠合为一设计：eng.mjs 死 persistState 分支/幽灵键既是双写断点又是命名漂移；#8A provider 去重独立线——文件零冲突可并行）。用户裁定：攒批一起做。#8B/C（防御正则族 + 启发式兜底三处）单列决策点，不与线1/线2 耦合。
