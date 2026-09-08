# 批 3（SYSTEM-SPLIT-BATCH）——system.mjs 拆分 + 工具归位

> 板块：跨板块结构债批（批专属设计档——STRUCTURE-DEBT §7 允批专属文档）。状态：**评审通过待 sign-off**（2026-09-08——3 项 advisory 采纳——token 2000d658 注册 12 slot）——eng-coder 实现。
> 来源：TODO「模块/行数技术债」#5+#6 + 并批评估批 3（2026-09-08 explore 一手勘察）。**路径勘误：TODO:75 写 src/agent/system.mjs 错——实为 `src/tools/system.mjs`（506 行——现唯一越 500 硬限 src 文件——本批顺手修正 TODO 路径）**。

## 1. 定位

CLI 端唯一仍越 500 硬限的 src 模块（`src/tools/system.mjs` 506 行——硬限纪律 METHODOLOGY §3 :64——无豁免通道）拆分 + 名不符实工具归位。风险极低：**单 importer**（src/tools/index.mjs:6）——消费面 3 处（make-agent/advisor-run/test-startup）全经 index.mjs 具名 re-export——零感知。

## 2. 设计

### 2.1 system.mjs 拆分——切法一（bash 族 vs 搜索族——两文件）

对齐 VSC 先例（shell.mjs/search.mjs——STRUCTURE-DEBT:97 已裁定方向）——每文件 <300 行：

| 新文件 | 迁出段（verbatim——src/tools/system.mjs） | 预计行数 |
|---|---|---|
| `src/tools/bash.mjs` | import 头（**按族分区——评审 #3：现 import 头跨两族——bash 只需 DESC/sanitizeOutput/truncate/makeDecoder/BASH_TIMEOUT_MS + spawn/execFileSync——搜索族符不随迁**）+ MAX_STREAM_BUF(:19) + applyLineFilter(:27-33) + posixSyntaxHint(:38-48) + buildBashEnv(:60-72) | ~250 <300 ✓ |
| | + killProcessTree(:79-86) + gitGuardSnapshot 族(:113-130) + runBash(:132-245) + bashTool(:251-282) | |
| `src/tools/search.mjs` | escapeRegExp(:22-24) + globTool(:286-320) + walkFiles(:323-341) + grepTool(:347-460) + lsTool(:464-505) | ~230 <300 ✓ |

- **接线**：system.mjs 删除 + index.mjs:6 改 `import { bashTool } from "./bash.mjs"; import { globTool, grepTool, lsTool } from "./search.mjs"`——单 importer 直接改 import 行（edit-diff.mjs 先例——不建 re-export shim）。
- **残余清理（顺带）**：L343-344 悬空残留注释（"Glob to regex"已迁 shared.mjs 未删）→ 删；L462 "websearch" 过期注释（websearch 已迁 web.mjs）→ 修。
- **gitGuardSnapshot（L116-130）归属**：随 bash.mjs 走（执行面——git 破坏性命令快照是 runBash 前置）——不另建 git-checkpoint.mjs（域归属可选——本批取随执行面）。
- **裁定点① 切法一 vs 二**：探索推荐切法一（贴合 STRUCTURE-DEBT #5 方向 + VSC shell/search 镜像）——4 文件逐工具更碎（违 repo "每文件一组" 先例精神）——**定切法一**。
- **裁定点③ system.mjs 删 vs shim**：单 importer → 删 + 改 index.mjs:6（edit-diff 先例）——**定删**。

### 2.2 #6 工具归位——questionTool 迁 src/tools/question.mjs

- **现状**：questionTool 寄生 `src/tools/git.mjs:351-374`（git 文件住 question 工具——名不符实——VSC 已拆 question.mjs——STRUCTURE-DEBT:101）。
- **改**：迁独立 `src/tools/question.mjs` + index.mjs:8 改 `import { gitTool } from "./git.mjs"; import { questionTool } from "./question.mjs"`（git.mjs 与 question.mjs 都单 importer 链——消费面零感知）。
- **裁定点④ 并入本批**：STRUCTURE-DEBT §7 批 B 表头 "#5 system.mjs 拆分 + #6 工具归位" 同批——**定并入**。

## 3. 受影响文件

| 文件 | 改动 | 当前行数 | 预计 delta |
|---|---|---|---|
| src/tools/system.mjs | 删除（拆分后） | 506 | 删 |
| src/tools/bash.mjs | **新增**（bash 族 verbatim 迁） | 新 | ~250 |
| src/tools/search.mjs | **新增**（搜索族 verbatim 迁） | 新 | ~230 |
| src/tools/question.mjs | **新增**（questionTool 迁——#6） | 新 | ~25 |
| src/tools/git.mjs | questionTool 段迁出 | ~376 | ≤-25 |
| src/tools/index.mjs | :6/:8 import 改源 | 34 | ≤±4 |
| docs/TODO.md | :75 路径勘误 + 核销 + **:9 同债勾销（评审 #2——根入口条目）+ :74 批实况更新** | 102 | ≤±4 |

**verbatim 纪律**：METHODOLOGY 拆后两验（行为零变 + 断言数不减——拆分轮专用）+ TESTING.md:59 红线（verbatim 迁移保真——System Module Split Policy 锚）+ 写优先逐字迁（先写目标再删源——代码恒有副本）。

## 4. 验收

- AC1 system.mjs 拆分：bash.mjs + search.mjs 各 <300 行；system.mjs 删除——**src/ 无残留引用（评审 #1：grep 限定 src/ 代码引用——CHECKPOINT.md:6/51/124/221 + STRUCTURE-DEBT.md:118 文档指针由父侧核销时同步——不在本批文件域）**
- AC2 消费零变化：make-agent/advisor-run/test-startup 经 index.mjs 仍取到 4 工具（bash/glob/grep/ls 行为零变——builtinTools 装配同）
- AC3 #6 归位：questionTool 在 question.mjs；git.mjs 无 question 段
- AC4 悬空注释清理：无 "Glob to regex" 残留 + 无 "websearch" 过期注释（search.mjs/lsTool 段）
- AC5 TODO:75 路径修正 + 核销批 3 + **:9 同债勾销（评审 #2）**
- 断言数不减（拆分轮两验——行为零变 + 断言数同）+ npm test 快层绿 + test:full 绿

## 5. 剔除项（不在本批）

- killProcessTree 镜像拷贝（execute.mjs:61/verify.mjs——#7 批 C 跨树去重面——不并入）
- bin/thincoder.mjs 501（存量债已登记 TODO:87——bin/ scope 外）
- src/memory/docs.mjs 414 / src/tools/file.mjs 450（>300 advisory——<500 不触发硬限——未入拆批）
- 工具描述源 DESC 迁移（描述在 src/tools/*.md 文件——与拆分无耦合）

## 变更记录

- 2026-09-08：立项（explore 一手勘察——路径勘误 TODO:75 实为 src/tools/system.mjs——单 importer 零感知）。
- 2026-09-08：评审 3 项采纳——#1 AC1 grep 限定 src/（CHECKPOINT/STRUCTURE-DEBT 指针父侧核销时同步）/#2 TODO:9 同债勾销补入 + :74 实况/#3 import 头按族分区（不跨族随迁）。
