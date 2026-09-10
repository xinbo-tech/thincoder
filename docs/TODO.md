# 项目待办（Project TODO）
> 项目级统一待办清单：所有来源的待办（设计遗留、评审发现、用户指示、在途实现）汇总于此，不散落在设计文档中。
> 本文件只承载**当前待办与在途项**；已完成/已消解项已移除或勾销（git history 完整可追溯——2026-09-08 清理）。
> 状态标注约定：`open`=待办 / `在途`=已批准实现中 / `待核销`=已实现待父侧核销 / `挂起`=用户暂缓。
> 维护：工程模式下由架构师（agent）在对话中即时更新；用户在需要时增删。
---

## 产品可移植性缺陷登记（2026-09-10 全面勘察——**只登记，待整明白后统一处理**）

> 来源：勘察报告（src/ 全量"硬编码项目约定"扫描——按任意用户项目视角判定）。需求依据 = `requirements/ENGINEERING-MODE.md` §2（FR10-FR15）+ `requirements/PROJECT.md`。
> 分级：🔴 = 静默失效（用户不可见、不可修）· 🟡 = 降级可见或噪声 · 🔵 = 无害/仅信息。
> **未动任何代码**——用户裁定：先全整明白，再改。

### 🔴 静默失效（10 项）

| # | file:line | 硬编码 | 不符约定时的静默后果 |
|---|---|---|---|
| P1 | `src/advisor/messages.mjs:253` | 文档地图 = `docs/README.md` / `docs/design/README.md` | 探不到 → 静默跳过——"文档归属"评审维度失去对照物 |
| P2 | `src/advisor/messages.mjs:236,349` | 项目方法论 = 项目根 `METHODOLOGY.md` | 不存在 → 空 catch 静默不注入，评审仍按"方法论合规"打分 |
| P3 | `src/advisor/messages.mjs:265,267,269` | 指令文本要求"Read METHODOLOGY.md" | 与 P2 独立——即使未注入也要求读不存在文件（白耗轮次/凭空判断） |
| P4 | `src/prompts/advisor-design.md:9,18,24` | `docs/README.md` + 示例 `docs/design/AGENT-LOOP.md:180` | 任意项目工程模式下被要求读不存在的文件 |
| P5 | `src/prompts/discipline-engineering.md:32,47,61` | `docs/design/<TOPIC>.md` 树形状 | 代理会在用户项目里创建 ThinCoder 形状的 docs 树 |
| P6 | `src/prompts/discipline-engineering.md:141,142,147,151,170,171` | `docs/TODO.md` / `CHANGELOG.md` / checklist 边界 | 用户项目没有这些文件也要"先入池" |
| P7 | `src/prompts/discipline-engineering.md:182` | `docs/requirements/`+`docs/design/`+**`node scripts/check-doc-width.mjs`** | **自指脚本**——该脚本只在本仓存在，用户项目跑必失败 |
| P8 | `src/memory/code-sync.mjs:112-124` | `git rev-parse --show-toplevel` 失败 → 返回 `[]` | **非 git 项目：代码/文档索引全空**（表现为"无索引源"） |
| P9 | `src/memory/schema.mjs:18,20,23-32` | 代码/文档扩展名白名单 + SKIP_DIRS + 体积上限 | 白名单外扩展名**完全不可检索**（.fs/.clj/.dart/.lua/.cs 等代码；.org/.wiki 等文档），无提示 |
| P10 | `src/agent/dispatch.mjs:199` + `src/advisor/repos.mjs:168` | `^src[\\/]` **字符串锚定** | 嵌套布局（`packages/foo/src/x.md`）被当文档 → **静默绕过设计门禁**；非 `src/` 布局则全部文件都当产品代码 |

### 🟡 降级可见 / 噪声（18 项）

| # | file:line | 内容 | 影响 |
|---|---|---|---|
| P11 | `src/prompts/discipline-normal.md:13,32,213` | `docs/README.md` 地图（:32 有降级子句） | 13/213 无降级 |
| P12 | `src/prompts/persona-engineering.md:12` | "需求+设计文档（docs/）" | 提示层假设 |
| P13 | `src/agent-tools/advisor.mjs:104-114` | documents 校验限 `docs/` 前缀或文档扩展名 | 用 `.org/.wiki/.html/.tex` 记设计的项目被硬拒 |
| P14 | `src/tui/cmd-eng.mjs:31,35-46` | 工程模式门禁要求项目根 `METHODOLOGY.md`；"从模板创建"指向**已不存在**的 `methodology-template.md` | **自相矛盾 + 活 bug**——选项必炸；与本仓"METHODOLOGY 已退役"冲突 |
| P15 | `src/agent/dispatch.mjs:204`、`src/agent-tools/eng.mjs:59` | 提示文本写死 "in docs/" | 模型可见错误提示带本仓布局 |
| P16 | `src/advisor/messages.mjs:35-57` | 项目根判据 = 存在 `AGENTS.md`（唯一） | monorepo 子项目无 AGENTS.md → P1/P2 查错目录 |
| P17 | `src/agent/helpers.mjs:321-327` | 项目指令仅读 cwd 的 AGENTS.md / project_rules.md | 缺失时返回空、**无提示**；不向上走；不认 `.cursor/rules`/`CLAUDE.md` |
| P18 | `src/advisor/repos.mjs:22-41` 等 | 以 `.git` 判仓库根/评审范围/快照 | 非 git 项目范围采集为空 |
| P19 | `src/tui/clipboard.mjs:142` → `src/tools/file.mjs:192` | 粘贴图片落盘 `<cwd>/.thincoder-paste-<ts>.png` | 未读则该文件**留在用户仓库根**（污染） |
| P20 | `src/tools/repomap.mjs:138-145` | 只解析 JS/TS + Python 的 import/export | 其他语言静默缺依赖信息 |
| P21 | `src/tools/linter.mjs:43-46,119-128` | 语言→linter 表 | 表外语言"no linter available"（可见） |
| P22 | `src/tools/linter.mjs:61,92` | 配置只看**当前 cwd**（tsconfig.json / Cargo.toml） | monorepo 子包（配置在上级）→ 静默视为无 linter |
| P23 | `src/agent-tools/subagent-scheduler.mjs:52-54` | 父侧维护文件黑名单 = basename `todo.md`/`changelog.md`/`checklist*`（任意层级） | 用户项目恰有同名文件 → eng-coder **无法声明它**（fail-closed 可见） |
| P24 | `src/agent-tools/verify.mjs:38-58` | 项目根 = 含 package.json/.git 的最近祖先 | 无锚点 → 退化为松散全局匹配 |
| P25 | `src/advisor/repos.mjs:146` vs `src/agent-tools/advisor-async.mjs:170` | 同一条"src 是不变量"**两种正则**（组件匹配 vs 锚定） | 语义分叉 |
| P26 | `src/tools/shared.mjs:20` | `IGNORED_DIRS={node_modules,.git,dist,build,.turbo,coverage}` | 源码在 `build/`/`dist/` → 搜不到（文案有声明） |
| P27 | `src/tools/tree.mjs:13` | SKIP_DIRS 另含 `bin,obj` 等 | 源码在 `bin/`（Go/脚本项目）→ 树中消失 |
| P28 | `src/memory/code-sync.mjs:61,141,345` | 任意 `.` 开头路径段一律跳过 | 源码在 `.github/scripts/` 等 → **永不入索引** |

### 🔵 无害 / 仅信息（7 项）

`cmd-init.mjs:12,24-58`（类型探测，双配置项目误判 Node）· `completion.mjs:81`+`verify.mjs:71,175,283`（措辞层）· `.thincoder/` 命名空间（产品自命名空间，非对用户项目的假设）· `~/.thincoder/` · `.mcp.json`（跨工具约定）· `verify.mjs:197-216`（JS node --check，advisory）· `helpers.mjs:264,271,286`（隐藏项有计数行）

### 一致性债务（"整明白"时要一起裁的）

1. **`src/` 判据有 4 种实现**：`^src/` 锚定 `dispatch.mjs:199`+`repos.mjs:168` vs 组件匹配 `repos.mjs:146`+`advisor-async.mjs:170` vs 根锚定 `verify.mjs:38-58` vs 注释里的 `isProductCode`（**该函数不存在**，仅注释概念——`repos.mjs:151`、`verify.mjs:184`）
2. **"项目根"有两个互不相干的定义**：AGENTS.md 版（`messages.mjs:35`）vs package.json+.git 版（`verify.mjs:38`）
3. **文档/临时文件判定**：扩展名白名单（`repos.mjs:100,116`），不参考任何项目自述
4. **已有"让项目自己说"的先例**（改造样板）：`.thincoder/advisor.md`（有默认回退的覆盖）· advisor `documents=[…]` 参数（显式声明，但按次不持久）· verify 的自然语言验证法（**明确拒绝硬编码测试命令**——证明本产品既有设计取向）

### 已核实"不受影响"（防重复勘察）

顶层 `README.md` 从不被读取 · **无任何代码执行用户项目的测试命令**（verify 明确不自跑）· 无构建/发布假设（`package.json` 仅读 ThinCoder 自身）· `test/` 目录假设零命中 · `.vscode/` 仅作端标识后缀 · `prepublishOnly` 用户侧零命中。

### 另立（勘察外，实施中发现）

- `.thincoder/index/`（`.thincoder/index/manifest.json` + vectors.bin）—— **DB 化前死产物**（mtime 2026-07-29，全仓零读写点；活体索引 = `~/.thincoder/memory.db`）→ 可删。
- `src/tui/wrapped-spawn.mjs:1` 注释指向已入档的 TUI-STDERR-CAPTURE.md（**真断链**）；另有约 12 处带 `docs/design/` 前缀注释（指现行档）——扫尾项。

## 模块/行数技术债（超限拆分候选）
- [x] ~~**system.mjs 506 行超 500 硬限**~~——**2026-09-08 批 3 已拆**（SYSTEM-SPLIT——bash.mjs 269 + search.mjs 237 + question.mjs 27——index.mjs:6-7 改 import——src/ 代码引用零残留——CHECKPOINT/STRUCTURE-DEBT 文档指针由父侧核销同步）
- [x] ~~**VSC agent/setup.mjs 500 行**~~——**2026-09-08 核销**（agent-state.mjs 102 行三函数已建——resetRunState/reconcileEngDesignTokens/applySlotSessionState 迁出——setup.mjs 现 422 行 <500——id=9 env-state 交付顺带完成）
- [x] ~~模块拆分轮超限债~~——**2026-09-08 核查已兑现勾销**：模块拆分轮已把 session/CLI 8 文件/subagent 家族/verify/run/context/render-conversation/tool-events/agent-turn/compact 等全拆至 <500
  （实测 session 483 / agent 384 / context 381 / subagent ~284 / subagent-async 382 / verify 291 / agent-turn 326 / render-conversation 425 / tool-events 401 / file 443 / bin 500；VSC subagent 489 / subagent-async 450 / compact 302 / run.mjs 拆为 run-helpers+stages）；测试 >500 债随测试全删消解

## 代码正确性 / 边界小修（低优先加固）
- [x] ~~**VS Code detectRestoredSession 闸语义完善**~~——**2026-09-08 核销**（§11.2 env-state 已实现按会话跟踪——resumed 迁 agent 级 _resumedPending 每恢复一次——切槽进新 agent 天然得 yes——detectRestoredSession 余留服务 process restarted 句（模块级闸——N6 设计意图））
- [x] ~~**join(cwd, p) 双前缀 bug 残留**~~——**2026-09-08 批 1 2.1 已修**（cmd-undo.mjs:23-24/:72 isAbsolute 分支——VSC 镜像核查 N/A——无 /undo 机制）
- [x] ~~**memory_delete 边缘容错**~~——**2026-09-08 批 1 2.2 已修**（delete.mjs:158-159 split(":").length>2 → throw）
- [x] ~~**MCP readMcpSection servers 非数组静默当空**~~——**2026-09-08 批 1 2.3 已修**（config.mjs:347-348 ok:false）
- [x] ~~**C 方案：read 读回 offload 文件防炸**~~——**2026-09-09 核销**（DUAL-END-TRUNCATION——b4c65b0/619f7d0——read 头尾——L2 CLI 157/VSC 214——consume 9ef31e7f）
- [x] ~~**advisor 截断方向另议**~~——**2026-09-09 核销**（DUAL-END-TRUNCATION——用户裁 B 双端——advisor 头尾双保——truncate.mjs——consume 9ef31e7f）
- [x] ~~**VS Code git 富注入异步优化**（3×execSync 每回合——最坏 ~15s 阻塞——异步优化项）~~——**2026-09-09 核销**（GIT-ASYNC L21——双端同改交付：VSC `setup-reminders.mjs` collectGitContext/pushGitContext → async + CLI `helpers.mjs` collectGitContext → async——
  3×execFile 并行 Promise.all + all-or-nothing + 失败冷却 30s（评审 #3 冷却单测必做已锁）——设计档 VSC 仓 `docs/design/GIT-ASYNC.md`）
- [x] ~~**files 尾随空格目录声明检测**~~——**2026-09-08 批 1 2.7 已修双端**（CLI scheduler:43 + VSC scheduler:104 trimEnd——VSC 以 CLI 为单一测试锚）
- [x] ~~**R19 read_history 发现面无 top-N cap**~~——**2026-09-08 用户裁不要**（每 cwd 目录槽数有上界——listSlots 时间序有限——无打爆风险——维持现状）
- [x] ~~**R19 护栏语义缺口**~~——**2026-09-09 核销**（核实：裁定指标已作第二道落地——批 7 双端 READ_HISTORY_MAX_MESSAGES=50_000 消息数门（parse 后长度）+ 200K 物理行主门保留——两门组合最优——不 parse 拿不到消息数故主门不能改消息数——代码无需再动——仅簿记）像同值）
- [x] ~~**R18+R19 VS Code 交付跟进（剩 ①）**~~——**2026-09-09 核销**（READ-HISTORY-SPLIT——5300f09——read-history.mjs
  272 + discovery 119——L2 179/178——consume 521b9987——②③④先前已勾销——R18 拆分全清）
- [ ] **agent 生命周期小项（剩 A2）**：A2 摘要触发条件（仅 ## 节标题）——注释段已修（批 1 2.5 seven actions）+ auto-think depth 归状态债 #3
- [x] ~~**TUI tool-args 块标题兜底**~~——**2026-09-08 批 1 2.4 已修**（tool-args.mjs:47-48 action 兜底）
- [x] ~~**setup.mjs knife-edge 注记过期**~~——**2026-09-08 批 1 2.8 已修**（删注为首——无树内夹具常量可校准——17000 最新）
- [x] ~~**ACP 桥结构化映射**~~——**2026-09-08 核销**（bridge.mjs:201-204 tool_call 结构化 + :212-214 tool_call_update 落地）
- [x] ~~**doc-sweep 旧名残留**~~——**2026-09-09 核销**（勘察确认：VSC CAPABILITY_GAP memory_search 旧名零残留——memory 五动作现行表述——批 2 2a-2 已随 DOC-SWEEP 清）
- [x] ~~**VS Code 端轨迹存档同构实现**~~——**2026-09-09 核销**（TRACE-STORE-VSC——d84980d——trace-store.mjs 255 行 + provider 出口——VSC L2 129/129——consume 3da9a9b5）
- [x] ~~**轨迹目录清理策略补充**~~——**2026-09-08 用户裁不要**（D-TR10 24h 保留时间窗已隐含总量有界——保留期可配——无需按天/会话额外 GC）

## 模块拆分 · 文档引用清扫（父侧，逐文件批）
- [x] ~~**D-T1.8 文档引用修正（剩余清单）**~~——**2026-09-09 核销**（DOC-SWEEP——CLI 34cbf3b + VSC 820947e——勘察收敛：~20 锚仅 ENGINEERING-MODE 4 处真残留（EM-1~4 已清）其余 15 锚已修/超界/归档豁免——+ release flow/模块图/CAPABILITY_GAP/8 批档状态——A-E 交付 F 本行核销）
  - TUI-INPUT-BOX.md:151/:169/:209/:233 + CHECKPOINT.md:124/:137 + MEMORY.md:177
  - CONTEXT-COMPACTION.md:247/:342 + SESSION.md:166/:212 + PROMPT-DECOUPLING.md:42/:53/:84
  - SEND-STALL:96 + TOOL-OUTPUT-LIMITS:50-53/:61-62/:104 + ADVISOR-CONVERGENCE:176 + VERIFY-DOCONLY:34
  - AGENT-PARAMS:61-2/:71 + COVERAGE-GAPS:11/:19/:32/:58-9 + ENG-TOKEN-BINDING:13-4 + ARCHITECTURE:255 + MCP:3
- [x] ~~**ARCHITECTURE.md:596 §20 残留 test/subagent.test.mjs 引用**~~——**2026-09-08 核销**：ARCHITECTURE.md 已缩至 84 行指针档（:596 不存在），docs 全树 grep subagent.test.mjs 0 命中——前提已死
- [x] ~~**ARCHITECTURE.md §19.6 引用段缺口**~~——**2026-09-08 核销**：§19.6 panel 检查工具实体已实现（subagent-panel.mjs——AGENT-LOOP.md:46/52 明记 2026-09-08 二次拆分 + agent-tools/subagent.mjs:80 panel action）——引用段待补前提消失
- [x] ~~**AGENTS.md release flow 与 RELEASE.md §2 分歧**~~——**2026-09-09 核销**（DOC-SWEEP B 项——AGENTS.md:29 已改 RELEASE §2 序：bump→commit→tag→push 双远端→publish 最后——CLI 34cbf3b）
- [x] ~~**R7 AC 补"残留扫描只约束活体文案"豁免注**~~——**2026-09-08 批 2 2a-4 已落**（AGENT-LOOP R7f 在位）
- [x] ~~**VS Code 根 METHODOLOGY.md 头注悬空指针**~~——**2026-09-08 核销**（批 2 2a-5 已修——VSC METHOD:5 改指 CLI 端 thincoder/docs/design/METHODOLOGY.md——含 :61/:94 同类修正轮）

## 工程模式 / 评审收敛（prompts + 机制）
- [ ] **§18.8/§18.10 复核（AC-OA4）**：after 样本 = T（2026-09-04 05:06）后首次干净外部评审——信号密度 ≤0.70×1.86=1.30 达成——未达呈报（观察，等样本）
- [ ] **修正轮纠结密度观察**：修正轮密度 2.20/1K > 基线 1.86——AC-OA4 可能低估受益面——等样本
- [ ] **AC-OA4 统计脚本（可选仓库工具）**：统计轨迹 JSON 评审信号密度——低优先
- [x] ~~**advisor 裁决模板立项**~~——**2026-09-09 已交付**（ADVISOR-VERDICT-TEMPLATE——CLI 33ed72b + VSC f9f0335——VERDICT 单值裁决行 + 双轨消除——L2 绿——consume 9e85ddd9）
- [x] ~~**§19.6 panel 检查工具（已批未实现）**~~——**2026-09-08 核销**：已实现（subagent-panel.mjs 双端在 + action 面在——与 L41 同证据）
- [x] ~~**sync spawn 可中止能力**~~——**2026-09-09 核销**（SYNC-CANCEL——3d7be35——TUI ⏹ 定向中止——L2 129/129——consume 1e5870bb）
- [ ] **setup.mjs 受限变体 schema 补 cancel 词**（描述层同步）
- [ ] **engineering-sub.md L1 "~15s" 数字漂移**（实测 18.5-19.7s）——随下个提示词批修

## VS Code 镜像/评审面差异
- [x] ~~**VS advisor-design.md 缺 R24a 第 8 条评审标准**~~——**2026-09-08 核销**（VSC advisor-design.md:8 已含 Affected-file size annotations——与 CLI 逐字一致）
- [x] ~~**VSC 评审陈旧面对齐 CLI isCodePath**~~——**2026-09-09 核销**（批 7——1bbd474——VSC advisorStale code-path only + repos isCodePath——L2 绿——consume a0775ae9）
- [ ] **🔵 五项不修登记（父侧知悉）**：VS sync design 轮次不递增 / VS guard cap 读全局轮 / CLI guard 文案无 async 补注 / VS depth-undefined 缺省 async / CLI T-24b1 墙钟断言（已知不修，留档）

## 异步 / 挂起 / 调度残留（AGENT-LOOP 后续轮）
- [x] ~~**async 结果容器统一**~~——**2026-09-08 已实现核销**（async-settle.mjs 公共收尾单点 + 池 accessor getAsyncPool + pending 单容器 + buildChildSignal——双端在码——ASYNC-RESULT-CONTAINER 档头状态行需随核销更新——父侧补）
  ——统一单载体（池 accessor+pending 单容器+role+共享 settle helper+buildChildSignal）——最深状态债（涵盖并行 check 双消费/挂起期 check 双投/settle 队列改造/4 explore 等散项）
- [x] ~~**sync spawn 完成精确冻结**~~——**2026-09-08 核销**（subagent-freeze.mjs:51-58 finishSubTaskKey 按 relay key 精确冻——tool-events:141-209 带 ctx._subagentKey）
- [ ] **processing 态 Ctrl+C 武装化 + 回合 abort 与池解耦**（回合 abort 无条件清池连坐杀后台）——首按=interrupt 不清池 + 3s 二按=清池
- [ ] **混合边环形等待残留**（dependsOn 边 + 文件域边混合链）——建议 §21.2 候选（停滞检测）
- [ ] **§21 普通模式偏差审计 + §18.8.1 会话上下文轮**（**2026-09-08 用户裁恢复**——评审该审计项要不要做——走设计链/勘察评估——等 §11.3/批 5/6 交付后排）

- [ ] **档位 B：subagent 工具 description 动态矩阵**（工具集变化时自动跟随——A 已落地，B 待工具集真变再动）
- [x] ~~**CLI ⏹ / 面板行数增长缺陷**~~（trimSubTree done 子块无豁免）——**2026-09-08 核查已修**：§27.1 F1（2026-09-07 三缺陷修复批 b06bca7）trimSubTree 已跳过 done 子块（subagent-children.mjs:66 `if (c.done) continue`）+ done 定格守卫——原待办作废

## 需求池 / 在途实现（状态随批推进更新）
> 快车道：用户说"急"走单点不入池。生命周期：实现后核销勾销。

- [ ] **文档目录结构重组**（2026-09-10 用户裁定——设计已批准）——实施档 `docs/design/DOC-REORG.md`。
  **已全部完成**（文档面 + 批尾 T1-T5：35 档入 `_archive/`、`requirements/` 34 档、地图唯一 `docs/README.md`、
  advisor 注入改指+fallback、测试解耦 2 红归零、L2 **280/280 全绿**；批档入档冻结）。
  后续项：VSC 仓镜像、T6 扫描域（待裁）、注释扫尾——见下两条与技术分组
- [ ] **check-doc-width 扫描域缺口**（2026-09-10 DOC-REORG 实施发现）——`scripts/check-doc-width.mjs` 默认域 = `docs/design/`，不覆盖 `docs/requirements/` / `docs/README.md` / `docs/TODO.md`——宽度纪律对新目录无机械约束。DOC-REORG §10.3 提议新增批尾项 T6（域改 `docs`）。**待用户裁**。

- [ ] **评审注入路径硬编码项目约定**（2026-09-10 用户裁定——**待设计**）——`src/advisor/messages.mjs:245-254` 硬编码文档地图路径；<br>  `:236/:349` 硬编码项目根 `METHODOLOGY.md`。用户项目布局不同即**静默跳过** → 评审维度无声消失（不可见）。<br>  方向：配置项 / AGENTS.md 项目自述 / 保留探测作 fallback。**归属 = `docs/requirements/ADVISOR-CONVERGENCE.md` §5.1**。

- [ ] **既有文档超宽行清理**（2026-09-10 DOC-REORG 实施发现——非本批引入）——`node scripts/check-doc-width.mjs` 报 4 文件 / 9 行：`AGENT-LOOP.md`×3、`SESSION.md`×3、`SUBAGENT-ID-COUNTER-AGENT.md`×1、`TUI.md`×2。
- [ ] **提示词公共层扩容**（2026-09-10 用户裁定——需求已收口，**待设计**）——common.md 由 4 节扩至 10 节（+证据纪律/停下上报/任务边界/交付报告格式/工具观+路由表/系统接口语义框架）；C1/C2/C4/C5/C6/C7 上移、C3 不上移、C8 落人格层。**归属档 = `docs/design/requirements/PROMPT-SYSTEM.md` §2.5 + §4**。
- [ ] **工程模式可移植性 FR10-FR15**（2026-09-10 用户裁定——**待设计**）——工程模式是**产品功能**（面向任意项目）：
  FR10 不得假定项目约定（缺失需降级可见）/ FR11 开启前提不得依赖已退役的 METHODOLOGY.md（现为活 bug——门禁+模板缺失）/
  FR12 代码文档判据不得写死 `^src/`（嵌套布局静默绕过门禁）/ FR13 纪律层不得把本仓形状强加用户项目（含自指脚本 check-doc-width）/
  FR14 推进档位 auto-manual 入需求 / FR15 非 git 项目行为定义。**归属 = `docs/requirements/ENGINEERING-MODE.md` §2**。
  **验证方向**：非 Node、非 `src/`、无 `docs/` 树、非 git 的项目跑全流程——不得静默失效、不得被不存在文件卡住。
- [ ] **工程模式角色重定义**（2026-09-10 用户裁定——需求已收口，**待设计**）——主agent=产品经理（需求文档+全流程编排/确认/核验）/ eng-designer=设计（从需求到设计，唯一写稿人，自己做勘察，无 designToken）/ eng-coder=实现；核心定位「设计 = 对需求的检验」（需求不过 advisor 评审）。**归属档 = `docs/requirements/ENGINEERING-MODE.md` §1.2 FR9 + §1.5 裁定清单**（提示词实现面见 requirements/PROMPT-SYSTEM.md §8）。

> 2026-09-08 批实况（17:07 终态）：**批 1/批 2/批 3** 全交付核销（L2 双端 112/105 全绿——批 3 文档
> 指针同步：CHECKPOINT/STRUCTURE-DEBT system.mjs 改指 bash.mjs/search.mjs——父侧收尾）；**env-state
> 扩展**（SESSION §11.2）已交付核销（bba68df/0bf02b0 + VSC 7e7d90a/ec1e4c4——slot+resumed 按会话
> +F3+双信号——L2 绿——consume 554b6251——**双端 system.md:24 env-state 描述未含 slot——需同步**）；
> **§7.7 顶层异步**已交付核销（c08e1b2/8763ac2——L2 绿——consume a2b10815）；agent 生命周期 + 11.7 + D6
> union 早前核销。批 4 剩 env-state/R19（未排）——designer 2026-09-09 用户裁取消（eng 主会话即 designer）。
- [x] ~~**批 3（结构债批 B）**~~——**2026-09-08 已交付**（SYSTEM-SPLIT——bash.mjs/search.mjs/question.mjs——待 L2 终链 + consume 3aaf4154）
- [x] ~~**批 4（需求池各自独立）**~~——**2026-09-09 核销**（R16 D1-D5 覆盖 / env-state slot 批 7 落地 / designer 用户裁取消——原批 4 项全清——余项各自独立条目）

- [x] ~~**R10 多实例协作感知**~~——**2026-09-08 核销**（双端 pushPeerReminder 在位——peer-instances.mjs 在——config 写前 mtime 门控 F5b 在——MULTI-INSTANCE-COLLAB.md 双端）
- [x] ~~**R16 token 生命周期语义修订**~~——**2026-09-08 核销勾销**（被 DESIGN-TOKEN-SETTLEMENT D1-D5 双端根治覆盖——settle 落盘权威台账 + TTL 三时机清理 purgeExpiredDesignTokens + restore 过滤 + 门禁过期拒——"待设计"标记过期）
- [x] ~~**env-state 补当前会话 slot**~~——**2026-09-09 核销**（批 7——10cd978——env-state slot 字段双端 system.md 同步——SESSION §11.2 落地）
- [x] ~~**async 评审凭证结算根治**~~——**已实现**（2026-09-08 双端交付：CLI `a7e78b0`+`08cabb9` consume 落盘 / VSC `159a39f`——settle 当场落盘+门禁 miss 回读+镜像退役+consume 落盘对称——token 根治验证通过：async advisor settle 落盘+digest 后 spawn 能过）
- [x] ~~**父 agent 观察运行中子代理（功能①）**~~——**已实现**（2026-09-08 双端交付：CLI `2060e0d` / VSC `605a901`——observe 动作：按 id 拉 5 条回合摘要+当前工具+turn/touched，治父看不到中间）
- [x] ~~**父 agent 注入提示给运行中子代理（功能②）**~~——**已实现**（2026-09-08 双端交付：CLI `2060e0d` / VSC `605a901`——send 动作：写 entry._injected 队列，子 runAgent 回合边界消费作普通 user 指令——治无法中途引导）
- [x] ~~**designer 子代理架构（2026-09-08 用户需求点——主会话纯中转，设计要求固化 designer 提示词）**~~——**2026-09-09 用户裁取消**（想法改变——eng 模式主会话本身就是 designer——设计已在主会话内实现（本会话全部设计档）——不建独立 designer 子代理角色——原需求的"designer 提示词固化"诉求由主会话既有设计纪律覆盖（METHODOLOGY 三层/文档地图/受影响表——无需新角色））
- [x] ~~**并发池统一可配置 + advisor 归位**~~——**2026-09-09 核销**（POOL-CONFIG-UNIFIED——CLI 3944d54/5d7af7e
  + VSC 619f7d0 内含——三池 4/4/4 + advisor 读取器 + 同 scope 守卫 + 文案活引用——L2 CLI 157/VSC 214
  ——consume d1324e26——commit 归属混合待清理（父侧链闭合后 rebase）——CLI advisor-async 498 新最热点
  （下批先拆）——§24 全仓清理观察项补挂见下）
- [x] ~~**模型模型合并 + 会话级隔离（2026-09-09 维护者裁定——Nancywb 问题报告反方向——反 §14）**~~——**2026-09-09 已交付**（MODEL-MERGE-SESSION——CLI 46b6ecb/3ff4acf/decdf88 + VSC a4b2c0f/a3708b6/2f2d1d2/97612f5——clean——L2 待链稳定）：
  合并模型概念——activeProvider 与 activeModel 不再是分开参数——模型 = 显式复合值 "provider:model"——
  schema：providers[].models（候选名单——选择器硬约束只能选候选内——不匹配拒——裁硬约束）——
  无渠道默认捆绑（裁 1：providers[].model 单数默认不留）——config 顶层 defaultModel: "provider:model"
  （裁 3 放 config——默认模型选择——新建会话起点）——会话槽头记会话模型（复合值——恢复用——不看
  config——预期行为固化）——串扰实证：现 /model → pickers.mjs:310 写 config.activeModel 全局 override
  （config.mjs:278）→ 所有窗口被带偏——Nancywb 误判"会话记忆是 bug"（§14 全取 config = 固化串扰）
  ——新语义：① /model = 纯会话级（选 provider:model 写槽——不碰 config——裁 C）② config 默认模型走
  专用入口（裁 C：CLI /config "默认模型"子菜单 + VSC 面板项——裁入口形态）③ 新建会话 = config.
  defaultModel（渠道都可用——不用的渠道删掉——裁 2——无"激活"概念）④ 恢复 = 槽值——已存在会话永
  不被 config 动 ⑤ providers[].models 候选维护 = 编辑 config（或渠道配置面）——owning board = SESSION
   ⑥ 初始值裁定 A：defaultModel 未设 → 新建会话显式提示先设（/config 默认模型入口——无自动兜底）——status=澄清完成（语义全封口）待设计启动——设计权在用户
- [x] ~~**主会话输入禁排队（2026-09-09 用户反馈演进——digest 意图污染 → C' 方案终稿）**~~——**2026-09-09 已交付**（INPUT-LOCK-ASYNC——CLI e79aa5b/4811832 + VSC 71a175c/0f5bab8——clean——L2 待链稳定）：
  场景：主会话 busy 时用户输入排队 → digest/普通回合消化输出后置恢复 → 指令粘后台消化输出之后 → 模型
  误判意图——演进：初裁 B 隔离标记（digest 不打断）→ **最终 C'：去掉输入排队本身**——主会话 busy
  （普通回合 processing + digest）→ **输入禁用**（无排输入——错位从源头根除）——主会话空闲（含纯后台池
  跑——子代理/评审后台）→ **输入开放——立即处理**（异步化价值——后台跑同时可交互）——排队机制
  （pendingInput 单槽/R15 攒批合并）**废弃/简化**——隔离标记（B）**不需要**（场景从源头消失——去）——
  digest 回合结构标记（agent.mjs:265/283 assistant pushReal 同形态）如已有 digest 显示标签则保留（呈现
  层非上下文）——owning board = 挂起回合（AGENT-LOOP §17/§24 R15）+ 输入禁用（key-handler/输入框 UI）
  ——Q1 用户输入反馈 = 整键吞 + busy 提示（输入框 Processing——字面 C'）/ Q2 斜杠白名单保留直执行
    （/exit /help /model 紧急控制通道——不排队语义无冲突）——释放窗口守卫 + abort 零丢失承诺保留（单槽
    交接等价物）——status=裁定全齐待设计启动——设计权在用户

- [x] ~~**全异步化提示词/工具描述适配评估（2026-09-09 用户需求——改全面异步化后整体适配审计）**~~——**2026-09-09 完成**（残留清单产出——主修 ASYNC-RESIDUE-FIX 已交付核销——文档面候选归批 4）：
  范围全：双端全部注入提示词（system.md/engineering.md/eng-coder.md/engineering-sub.md/METHODOLOGY.md）+
  全部工具描述（subagent/advisor/consult/escalate/send 等——src/agent-tools/*.mjs）+ 平台提示词段
  （advisor-design.md/advisor-convergence 等）——判据：同步时代残留措辞（async:false 显式引导/等子代理
  完成阻塞/回合内消费结果/评审逐个发起等待/未 digest 化表述等与新异步语义不符处）——产出 = 残留清单
  （父侧裁优先级分批修——每处修走评审链）——owning board = 提示词系统 + 工具描述——status=登记待评估
  启动——设计权在用户

- [x] ~~**Gitee issue 修复批（2026-09-09 用户裁攒批待设计——三 issue 勘察根因已定位）**~~——**2026-09-09 已交付**（F-1 ef94736 + F-4 05de9cb/c7a444d——chain 闭合核销）：
  ① IKE85W（CLI 真 bug——resolveAdvisorProvider run.mjs:330 读 agent.providers??[agent.provider]——child 只单元素
  ——advisor.provider≠child 实际 → findProvider throw → catch 错配 403——VSC 无此缺陷（provider.mjs 读磁盘全量）
  ——修：候选源扩 agent.config.providersList（child config 已带全量——resolveChildProvider 同款）——小改——
  拆 Issue 2 主循环）② IKDCVV（评审反复/中断——部分设计预算 600s/100轮 + 机械重评面（Issue 1 同根 + stale/失败
  不算数推回）+ **单发评审无断点续跑（中断=全损重来——真设计缺口）** + "停止重试"纪律未落机械——需设计项
  ——修 Issue 1 拆主循环）③ IKCDMR（consultModels fail-fast throw 硬崩启动无修复入口 + 删除路径无级联清理
  （removeProvider 不清悬挂引用）——模型合并 defaultModel 软失败 D-S1 范式可对齐——小改软失败化）——
  owning board = 评审机制 + provider 校验——status=登记待设计（三一起走全链——用户裁）——设计权在用户

- [x] ~~**异步化残留修复批（2026-09-09 全异步化适配评估产出——残留清单分级）**~~——**2026-09-09 已交付**（ASYNC-RESIDUE-FIX——clean——F-1~6 全落地——L2 待链稳定）：
  🔴 main.md:8 双端（"sync only when next step depends"——§7.7 前例外——与 :13 自相矛盾——改"结束回合等
  digest/dependsOn"）+ engineering.md:16 CLI step 4 缺 async 机制段（VSC 有——CLI 漂移）🟡 engineering.
  md:16 VSC 新旧句自相矛盾（删旧 token 句 + wait 句澄清）+ advisor.mjs:55 CLI async 参数缺机制参数限定
  （VSC:177 有——测试只拒旧字面）🔵 main.md:13 重复句 + discipline.md:68 CLI 路由表缺 cancel（VSC:69 有）
  ——文档面候选（ESCALATE.md async:false 句加 depth>0 指针/AGENT-LOOP 过时注——父侧裁）——**关键前置：
  engineering.md 双端 :15/:16 已不同构（CLI:15 预检段=VSC 无 / VSC:16 async 段=CLI 无）——修 step 4 需先
  收敛双端同基再镜像——与 MAIN-DESIGN 增强批（id=6 注入 A1-A4 中）协调——排其交付后——owning board = 
  提示词系统——status=评估完成待设计（清单齐——设计权在用户）

- [x] ~~**live 面板排队 subagent 可见（2026-09-09 用户需求——UI 增强）**~~——**2026-09-09 已交付核销**（QUEUED-VISIBILITY——VSC bacf545 + CLI 16f0095——L2 239/239）：
  排队中的 subagent（queued——被调度器按文件域/依赖串行）在 live 面板可见（现只显示 running——
  queued 不可见——排队位置/等待原因不透明）——owning board = VSC UI（panel-live/activity-flow）——
  status=登记待设计（勘察结论——两端差集已定位：CLI 已有排队显示（subagent-panel.mjs §20 D-SD3b
    ——⟦ev⟧queued 事件——waiting/queued 状态词 + position + detail 原因文本——INPUT-LOCK 后已落）——
    VSC live 面板 queued 不可见——对齐差集 = ① VSC 补显示（位置/原因/detail——对齐 CLI）② 排队取消 UI
    双端均未暴露（工具层 queued cancel 有——CLI ⏹ 门控排队块不钉 / VSC 无——全量含可取消则两端补）——
    设计权在用户）

- [x] ~~**eng-coder 文件纪律放宽 + 调度器动态文件域（2026-09-09 用户需求——两联动条）**~~——**2026-09-09 已交付核销**（SCHEDULER-DYNAMIC-DOMAIN——CLI c7626ab + VSC e55a516——clean——L2 236/263 全绿）：
  ① 纪律改动：eng-coder 任务书"不得触碰清单外文件 + 需更多先停报告" → "允许按需调整（改清单外）+
    必须报告"——涉及 eng-coder 任务书模板/eng-coder.md/engineering.md（Implementation Handoff）+ 审计判据
    （explore audit 偏差 #4 现判"清单外 AND 未报告 = 偏差"——新纪律下报告了 = 合规——判据改"未报告 = 偏差"）
  ② 调度器动态文件域：subagent-scheduler 冲突判定现纯声明 files（entry._files——D-SD2）——不看实际 touched
    ——out-of-list 写入无域保护（INPUT-LOCK input.js/chat.js/locales 实证——并行写入竞争可能）——建议纳入
    running 子代理实际修改文件（touchedFiles——§19.5.6 已有上报）——域 = declared ∪ touched——
    owning board = 工程模式纪律 + 调度器机制——status=登记待澄清（①报告粒度/时机——②touched 追踪机制与
    调度器接入——需深勘察）——设计权在用户

- [x] ~~**digest 装配 400 观察项（2026-09-09 平台 bug——eng-coder#12 消化三连报）**~~——**2026-09-09 已交付**（MODEL-400 根因 model undefined 修复 + BATCH-3 digest 注入批量预算 64K——双端——预算扩面见 L268）：
  巨大上下文（>1.1MB——MODEL-MERGE 33 文件大链交付）digest 请求 JSON 缺 model 字段——deepseek 400
  "missing field model at column 1128244"——同 digest 推 3 次（3 次装配尝试）——平台层（不在工作仓源码）
  ——下次复现带 trace（会话日志 advisor:digest 序列）定位装配截断点——非设计/交付链问题——**用户裁
  （2026-09-09）：不应全量传上下文——会爆炸——digest 装配应限量/摘要化（非全量历史注入——摘要/窗口/
  裁剪——防 >1MB 请求体）**——status=登记待设计（digest 上下文限量装配——摘要化方案）——设计权在用户

- [x] ~~**git 工具 commit pathspec 完善（2026-09-09 用户需求——并行批混扫根治——工具改进）**~~——**2026-09-09 已交付核销**（QUICKFIX-2 F-3——CLI commit --only 原子——VSC 镜像缺口另记 L255）：
  现状（src/tools/git.mjs:150-174）：commit 无 path → `git add -A` 全量暂存工作树（含他批未暂存）→
  `git commit -m` 无 pathspec 提交整个索引（含他批 pre-staged）——并行批双层混扫源（fe6d62d 实证）。
  完善方向：① path 给定 → `git commit --only <path> -m`（原子——只提交列文件——忽略索引他批——git CLI
  --only 语义）② 无 path → 保留现行为（或裁定改安全默认）——纪律 workaround 已传在跑批 + project memory——
  工具修好即不依赖手动纪律——owning board = 工具面（git）——status=登记待设计——设计权在用户
- [ ] **session-state 诊断工具候选**：只读诊断命令 dump 当前 cwd 会话槽全貌——技术待办非需求点
- [x] ~~**VSC Stop 语义重定义**~~——**2026-09-09 核销**（并入 SESSION-ACTIVITY-REVISED——5be6c67——Stop running 派生 +
  digest 单停 + D-S9 全停废除 + subagent 靠活动区块 ⏹——L2 179/179——consume f125c0d5）
- [x] ~~**activity.js 579 行拆分（2026-09-09 B1 修正交付后——超 500 惯例——advisor 🔵）**~~——**2026-09-09 勾销（评估核实：活动区机制已拆——activity.js 287 + activity-freeze.js 94 + activity-view.js 242 同族并存——单体 579 已拆散——登记过时）**

- [x] ~~**VSC 会话恢复呈现对齐**~~——**2026-09-09 核销**（SESSION-RESTORE-PARITY——0231627——L2 179/179——consume 592ea112——见需求池勾销行）
- [ ] **models[] 候选白名单越权否决模型可用性（2026-09-10 用户裁定——MODEL_SPECS 职能被扩散）**：
  实证起点：`/model` 切 `qwen3.8-max-0902` 被拒（报"不在 qwen 的候选 models[] 中——加入候选需显式落
  config"）。但同一模型名 `specForModel('qwen3.8-max-0902')` 实测**已前缀命中 `qwen3.8-max` 精确
  spec**（1M ctx / 131K out / thinking / partialMode / multimodal / effort[xhigh,medium,low] 全套
  拿到，非 DEFAULT 兜底）——适配成功，拒绝与适配无关。
  用户定调（职能边界原则）：MODEL_SPECS 的职能 = **模型精确适配**——适配过的用满模型特性，
  **没适配的用默认参数（DEFAULT_SPEC 兜底 + warn 一次），而不是拒绝使用**；前缀匹配规则下
  `qwen3.8-max` 本应覆盖 `qwen3.8-max-0902`（现状码已如此）。能力层已把所有情况处理完。
  缺陷定性：拒绝来自 `providers[].models[]` 的 `includes()` 纯字符串比对——它对"这个模型能不能被
  使用"握有**否决权**，而这不是它的职能（职能被任意扩散）。
  **明确排除的方向（用户原话"不是放宽 F-1"）**：F-1"候选外拒"这一提法本身就把越权否决当合法约束在
  讨论——正确修法是**取消 models[] 对可用性的否决权**；既不是给白名单开后门，也不是往 models[]
  补登记一行（补登记 = 迁就该拆的错结构）。
  否决权现存落点（三处闸门 + 一份固化契约测试）：
  ① `model-picker.mjs:238` selectModel 切换路径硬 throw
  ② `model-picker.mjs:120` fetch 建议行点击即报错（API 已证明渠道有该模型，仍拒）
  ③ `model-ref.mjs:40` parseModelRef——**最重**：config.defaultModel 写了不在 models[] 的模型 →
    整个 provider 被标 invalid（`config-merge.test.mjs:131` 即在断言该 reason 串）——一个未登记
    字符串废掉一个渠道
  ④ `test/model-ref.test.mjs:128`「F-1 候选外拒」把上述契约固化为测试（改动须同步此契约）
  附带隐患（同族知悉，非本需求主体）：前缀匹配为无条件继承——有差异的快照（0902 若与主线参数有差）
  静默蹭到错 spec 且仍显示 1M 无提示；另 `qwen3.8-flash` 无精确条目，命中泛前缀 `qwen`
  （thinking:false / effort:null）——若其实际支持思考，`/think` 与压缩阈值均在按错表走。
  owning board = Provider（`PROVIDER.md` §9 规格表 / §11 模型支持与预设）+ 模型选择面
  （`MODEL-MERGE-SESSION.md` F-1/F-7 裁定须随本需求改写）。
  待澄清（设计启动前需用户裁）：① 取消否决后 models[] 保留何种职能（仅作 `/model` 便捷列表 +
  models[0] 作显示种子与恢复兜底 firstCandidate？还是字段整体废弃）② 显式 `provider:model` 任意串
  是否直接放行 ③ 切到未精确适配的模型时，是否在 `/model` 明确回显"按 DEFAULT_SPEC 128K 跑"
  （现 warn 仅 stdout 打一次，TUI 下基本不可见——放开后错 spec 更难发现）。
  ——status=登记待设计——设计权在用户，评审发起权在用户

## 其他在途/待核销（勾销即移出本节）
- [x] ~~**VS 端面板两缺陷**~~（webview 冻结门丢失 + 扩展端 id 计数器跨 resume）——**2026-09-08 核查已修**：§27.1 F3（冻结块迟到 chunk 三层防护 streaming.js:241 + ui.js:42 + activity.js）+ F4（nextSubagentId 计数器载体改 parent.history ?? parent，跨 resume 续号单调）——2026-09-07 修复批——原待办作废
- [ ] **VSC live 块显示不可靠（2026-09-09 用户反馈——"实际启动了但不能可靠显示 live 块"）——根因已定位**
  （explore#1 勘察 2026-09-09 + 用户观察补强 21:07）：**用户实测模式 = 普遍时有时无**——第一次 advisor 没出现
  + explore（subagent 角色）也没出现 + 后来 advisor 又出现——**非 advisor-only——三重脆弱广化根因**：
  🔴① **出生靠窗口**——started 落在 webview 未就绪/加载窗口即静默丢弃（postMessage 可选链无队列——
  panel-callbacks.mjs:81/113）——无兜底则块永不显示；🔴② **快照兜底不全**——postPoolSnapshot 门控只认
  _asyncSubagents Map（panel-callbacks.mjs:165——run-stages.mjs:279 池空摘 undefined——advisor-only 会话
  空转）+ 快照只重放 running（L187）——explore/评审跑完 settle 出池后 reload/clearMessages 抹块则永不重建；
  🔴③ **终态对 never-born 块 no-op**——applySubagentStatus settled/done 分支只遍历已存在块（activity.js
  L179-201/L240-248）——advisor/family 无 consult 快照建块防御（L234-239）——块缺失一旦发生即永久；🟡④
  clearMessages（boot/loadSession 必经——chat.js:180-189）池仍活时抹全部 live 块——重建依赖后续快照
  ——修复指向：门控双池任一放行 + 快照扩 settled-in-pending（未 digest 重建驻留块）+ never-born 终态建块
  防御（consult 模式扩 advisor/family）+（根治选项）出生消息队列/webview 就绪补发——测试补 advisor-only +
  explore-only + settle-after-reload 快照用例（现 fixture 恒双 Map running——盲区）——status=根因已定位待
  设计——修复方向（修补 vs 出生队列根治）待用户裁
  ——**用户观察补强（21:30）**：**间歇性非恒定**——丢集中在 20:52（round2 评审）+21:01（explore）——21:06
  （round3）起连续正常（round3/阶段A explore/eng-coder 批1/REMOVE 评审全出现）——时段性窗口/竞态模型：
  20:30 进程重启后**头一两个 async 任务落在面板/webview 重建窗口——started 丢——面板稳定后恢复**——
  "重启后首任务丢"假设待受控复现验证（重启扩展→立即发起 async 任务看块 vs 稳定后发起）——
  **REMOVE-POOL-SNAPSHOT 撤除批先行（评审中）**——撤后观察：若窗口现象仍在→出生投递窗口问题坐实（快照非因）
  ——若撤后恢复→快照机制意外干扰
  ——**撤除后实证（22:32）**：REMOVE-POOL-SNAPSHOT 已交付（撤了快照重推）——问题依旧——**坐实快照非因**——
  新精确复现：**同响应双 spawn 两个 eng-coder——状态行 2 running（扩展侧 pool 计数对）——live block 只渲染
  1 个**——出生/显示链并发竞态（两个 started 紧邻——webview 渲染端只建一块——可能丢消息/互踩）——
  与 reload 无关（正常会话内）——真因定位新方向 = webview 渲染端并发消息处理——非扩展侧（扩展侧计数正确）
- [ ] **advisor 池状态不可查询 + 不可取消（2026-09-09 用户反馈——平台机制缺陷——已实证三次）**：
  ① subagent status 只查 subagent 池——advisor 池（_asyncAdvisors）无状态通道——评审是否在跑/卡住/完成不可知
  ——digest 是唯一信号（死等）② wait_for "advisor settled" 误报（0ms 即过但池仍拒重发——口径与实际池状态脱钩）
  ③ advisor 无 cancel 通道（同 scope 重发被拒"settle 后逐个发起"——对象漂移时旧评审杀不掉）
  ——修：advisor 池状态可见（status 支持 advisor 查询/子代理面板展示评审 live 块——与 live 块问题可能同源）+
  wait_for settled 口径修正 + cancel 通道（同 subagent cancel）——status=登记——owner = 平台（AGENT-LOOP/工具面）
- [ ] **子代理 abort 无来源标注——死亡不可诊断（2026-09-09 用户反馈——平台可观测性缺陷——已实证两次）**：
  ① eng-coder #1/#4（CLI 端 engineering.md 重排——同 designId 60ff4e55）两次 abort 仅报 "The operation was
  aborted due to timeout"——**无错误栈/无来源层标注**——不知死于 provider fetch（09-02 已拆 TTFB+idle——墙钟
  600s 已废）/body idle/工具超时/平台层——无法诊断 ② 时长巧合 ~600s 但墙钟语义已废除——推断不可靠
  ——需修：子代理 abort/失败携带来源标注（哪层 timeout + 已等待时长 + 最后一次 LLM 调用/工具活动）——
  错误消息含可诊断字段——status=登记——owner = 平台（子代理/错误通道——与 advisor 池盲区/live 块同属可观测性族）
  ——#4 重发若再死凭完整错误钉死
  ——**证据补强（22:18）**：core.mjs L70-71/L430 注释自述「600s 绝对墙钟曾腰斩长上下文子代理（eng-coder
  TTFB>10min 即死）——2026-09-01 根因修复」——现 ~600s 死 = **09-01 已修 bug 复发/残留路径**——直连
- [ ] **subagent status touched 显示不准（2026-09-09 用户实证——可观测性缺陷）**：eng-coder #1 已写完
  engineering.md 正在跑内部 advisor code review（observe 实证 currentTool=advisor）——但 status 显示
  touched "—（尚无改动）"——滞后/失真——UI（live 块）显示比 status 准——修：status touched 从真实写
  入记录实时取（与 observe/UI 同源——不滞后）——status=登记——owner = 平台（subagent status 通道——与
  advisor 池盲区/子代理 abort 无标注同属可观测性族）
- [ ] **advisor 评审状态查询假空（2026-09-10 用户判定平台 bug——池实有跑者查询返空）**：01:57 发起的三
  施工档设计评审（advisor 后台），02:29 用户问进度 → subagent status 查询返回 running/queued/done 全空
  ——但评审实际在池中运行（digest 未到，无法判死活）——查询工具与 advisor 池真实状态脱节。与既有
  「advisor 池盲区（不可查/不可取消）」同族——修：status 聚合纳入 advisor 池真实条目（含 running 评审
  的 scope/耗时）——owner = 平台（可观测性族）
- [ ] **子代理 id 复用（2026-09-09 用户观察——平台 bug——§27.1 F4 修复洞）**：设计应跨 runAgent/
  resume 单调递增（subagent.mjs L293-295——F4 2026-09-07 消复用洞）——实际从 1 重新开始——
  nextSubagentId（subagent-scheduler.mjs L433-446）双保险：history._subIdCounter expando（期望跨 run
  持久）+ poolMax 池内兜底——**洞**：池空时 poolMax=0（L437）只靠 counter——reload/进程重启后 history
  从槽文件恢复（新数组不带 expando）→ counter 丢 → 池空 + counter 丢 = id 从 1 复用——实证：批1
  #1/#2→重发#4-#6（池有活条目 poolMax 生效）→22:10 reload 后批2 回 #1/#2→ACTIVITY 又 #1——
  **坐实块 key（sub:role#id）跨批/reload 复用风险**（挂起池活跨 reload 时撞冻结块）——修：counter
  持久化到槽文件（随 history 存）或恢复时从历史频道标签续号——status=登记——owner = 平台
  ——**归因修正（23:16 用户纠正）**：**非 reload 特有——每轮 runAgent 都从 1**（L293 注释自述
  "agent._subIdCounter per-run 重建"）——20:30 重启后同进程 20:37 explore #1 与 21:01 explore 又 #1
  （中间无 reload）——只有同轮内连续 spawn 递增（批1 #1/#2）——跨轮 = 上轮池空 + counter 归零 →
  poolMax=0 兜底失效 → 每轮首 spawn 都 #1——reload 仅加剧非根因——修方向不变（counter 跨轮持久
  或从历史频道标签续号）
  ——**根因再修正（23:18 复查——用户要求）**：非 per-run 重建主因——真因 = **压缩（compaction）替换
  history 数组时 _subIdCounter expando 随旧数组被抹**（agent.mjs L88 注释警告的 "history replace wipes
  it" 模式——distill 处防了（L88-91 await 先消化）——counter 没防）——长会话高频压缩（本会话开头即
  compacted）→ counter 反复归零 → 池空时 spawn 回 #1——修：counter 不挂 history expando（压缩不丢）
  ——**已落地（09-10 00:00——SUBAGENT-ID-COUNTER-AGENT——用户纠正：内存变量不需持久化——id 作用域=
  进程内——撤槽持久化方案——载体改 agent 本体 ±4 行/端——VSC 交付 clean（subagent-id-counter.test
  4/4 绿）——CLI 端在途）**——遗留：subagent.mjs L293-294 注释仍述旧载体前提（留下批触碰该文件时修）
- [x] ~~**子代理 abort 无来源标注（2026-09-09 eng-coder #1/#4 两次 timeout）**~~——**登记保留**（错误
  消息 "aborted due to timeout" 无栈无层标注——不知死于 provider fetch/body idle/工具/平台层——
  死亡另有来源——需来源标注钉死——09-02 已拆 TTFB+idle 墙钟已废——时长巧合 ~600s 非机制）
- [x] ~~**链终 token 消费待执行**~~——**已实现**（2026-09-08 token 根治后 consume 落盘对称——`08cabb9`——consume-design 删内存槽后当场同步落盘删除，消复活洞）
- [ ] **advisor 进行中评审不可取消（2026-09-09 用户反馈——平台 bug）**：设计评审发起后对象漂移（文档中途编辑）
  → 需杀旧重发——但**无 cancel 通道**（advisor 无 cancel action——同 scope 重发被拒"settle 后逐个发起"——
  wait_for "advisor settled" 误报 0ms 即过但池仍拒——只能死等自然 settle）——对象漂移 = 旧评审对最终版打折
  = 部分意义（用户裁杀）——建议：① advisor 加 cancel（同 subagent cancel）或 ② 发起后禁改对象纪律 +
  ③ wait_for settled 口径修正（查 advisor 池真实态非 digest）——平台侧待修——status=登记——owner = 平台
- [ ] **QUICKFIX-BATCH-3 评审待重发（2026-09-09——对象漂移杀旧后卡死）**：旧 review #1（漂移对象版）在跑杀不掉
  ——重发被拒——等旧 digest 自然到后重发覆盖最终版（87 行 F-1~F-4 实证版）——status=等旧 settle——设计权在用户
- [ ] **TUI 开放项**（**2026-09-08 用户裁两项都做**）：① picker item.note 渲染 bug 修（buildProviderEntries baseURL/无 key 提示 + cmd-advisor 主菜单 Provider 注记不显示——疑似 bug）② question/wizard/picker 三套选择 UI 统一——走设计链排批（TUI.md §11 承载）
- [x] ~~**平台缺口：async advisor digest token 未注册父会话 approved slots**~~——**已实现**（2026-09-08 token 根治修复——async advisor settle 当场落盘权威台账+digest 后 spawn 门禁 miss 回读能过——消"未注册父会话"缺口）

## 工程模式提示词同步（独立小项）
- [x] ~~**R3' bash 工具重定向护栏删除**~~——**2026-09-08 勾销**（TOOLS.md 无护栏文案——bash.mjs 仅保留 >2MB 输出丢弃指引）

## 文档地图整体清扫（2026-09-08 批 2 报告发现）
- [ ] **AGENTS.md 文档地图陈旧**：:17 仍列 VERIFY-DOCONLY.md（归档后悬空）+ 整体含早已归档档（ENGINEERING-WORKLOOP 等——批 A 前即如此）——父侧立项整体清扫（非批 2 2b-6 范围——批 2 只做 README/SETTINGS-TOOL）
- [x] ~~**双端 system.md:24 env-state 描述未含 slot**~~——**2026-09-09 核销**（批 7——10cd978/1bbd474——双端 system.md env-state slot 短句同步）
- [x] ~~**平台侧 subagent 工具描述仍含旧 async:false 引导**~~——**2026-09-08 §7.7.1 勾销**（纠错：工具描述在项目仓 src/agent-tools/ 可改——本批已清 subagent.mjs/subagent-spec.mjs Async spawn 段 + escalate 段 + advisor.mjs 描述——锚句逐字落入——测试锚定）
- [x] ~~**escalate/advisor 顶层 async:false carve-out 范围界定**~~——**2026-09-08 §7.7.1 勾销**（用户裁 a：escalate/advisor 顶层也纳入一律异步——§14.2 同步保留句删 + main.md/engineering.md/discipline.md 引导清 + §7.2 escalate 行注——全链完成）

## 屎山度第三次评估清扫批（2026-09-08 夜）
- [x] ~~**批 5（文档小批——N3+N7）**~~——**2026-09-09 已交付**（STRUCTURE-DEBT-BATCH-5-6——CLI 458857c——AGENTS.md 粗分类指 README + README 板块行自登记 + N7 双锚互引——L2 绿——consume f7dc212e）
- [x] ~~**批 6（代码小批——N1+N6）**~~——**2026-09-09 已交付**（STRUCTURE-DEBT-BATCH-5-6——VSC
  65092ff——subagent 508→353 + subagent-run 183 新 + advisor 511→466 + tools 49/provider 35 新
  + CLI enqueueAsk ×3——导出面 12/12——L2 绿——consume f7dc212e）
- [x] ~~**双端 system.md:24 下批同步**~~——**2026-09-09 核销**（批 7——3①② slot 短句 + SESSION.md 3③——双端逐字——consume a0775ae9）
  （② slot 行内 prose 补 sticky-slot 短句——null when none is bound）
  （③ §11 字段映射补 slot 条目）——走设计链排批

## 等裁项立项批（2026-09-08 夜用户裁——勘察一手）
- [x] ~~**收尾批（STRUCTURE-DEBT-BATCH-7）**~~——**2026-09-09 已交付**（STRUCTURE-DEBT-BATCH-7——CLI 10cd978 + VSC 1bbd474——L58 code-path only + L24 50K 双门 + system.md 3 子项——双端测试 122/115 绿——L2 批 7 用例全过（VSC 唯一失败 = L31 并行方在途 trace-store 测试）——consume a0775ae9）
- [x] ~~**大项 L31 VSC 轨迹存档**~~——**2026-09-09 已交付**（TRACE-STORE-VSC——d84980d + db7f5f9——VSC L2 129/129 绿——consume 3da9a9b5——generate-title raw fetch 不经 chat()——不入轨迹范围记录）
- [x] ~~**大项 L50 advisor 裁决模板**~~——**2026-09-09 核销**（ADVISOR-VERDICT-TEMPLATE——33ed72b/f9f0335——L2 绿——consume 9e85ddd9）
- [x] ~~**大项 L52 sync spawn 可中止**~~——**2026-09-09 核销**（SYNC-CANCEL——3d7be35——见工程模式节同项核销——consume 1e5870bb）
- [ ] **§24→§11 旧锚全仓清理**（2026-09-09 POOL-CONFIG AC-7 补挂——触碰行已更新——全仓注释残留双端数十处——后续批大扫）
- [x] ~~**config-io 499 预拆（2026-09-09 F-4 交付注——距 500 硬限 1 行）**~~——**2026-09-09 已交付核销**（BATCH-3 F-1——VSC de08fd0——437 + config-consult 78——L2 全绿）：VSC src/config-io.mjs 现 499 行——
  F-4 净增后距 500 硬限 1 行——下个改动必拆——建议预拆 F-4 块为 config-consult.mjs（同 config-io
  hub 惯例）——owning board = 结构债——status=登记——设计权在用户

- [x] ~~**CLI 缩放鼠标序列飞出 bug（2026-09-09 用户报告——v0.12.60——截图在案）**~~——**2026-09-09 已交付核销**（RESIZE-MOUSE-LEAK-FIX b251623——正常退出路径残留修复——**崩溃面另由 TUI-STDERR-CAPTURE 捕获观察**）：
  现象：CLI TUI 窗口缩放（resize）时有概率异常飞出——把鼠标追踪转义序列回显成字面文本到 shell
  提示符行（`[122;50M[122;50m[444444;111;46M...[555555;111;46M^C`——XTerm 鼠标事件上报序列
  `ESC [ < button ; x ; y M` 本应被 TUI 消费却漏出回显——坐标 x=444444 超大异常——缩放竞态嫌疑）
  ——可疑点：resize 处理 + 鼠标追踪 DECSET 开/关时序竞态（TUI 退出/状态切换瞬间未先关鼠标追踪——
  mouse.mjs + render-loop resize 重绘 + 终端模式切换）——有概率 = 竞态非必现——owning board = TUI
  （mouse/渲染）——status=登记待勘察（复现路径 + resize/mouse 时序）——设计权在用户

- [x] ~~**贴图自动降级视觉子代理（2026-09-09 用户需求——VSC 截图在案）**~~——**2026-09-09 已交付核销**（IMAGE-DOWNGRADE-VISION——VSC bd7c803 + CLI 1090eb4——clean——跟进项 L250）：
  现象：贴图到非视觉模型（deepseek-v4-flash）直接报错"This model does not support pasted images. Switch
  to a vision-capable model..."——要求手动换模型——**无自动降级**——用户期望：非视觉模型 + 贴图 → 自动
  spawn 视觉模型子代理读图（返回描述给主模型——不打扰用户换模型）——现错误文案第二建议"attach as
  file and let the model read it"对非视觉模型也不通（read_image 只支持视觉模型）——owning board = 贴图
  处理链（paste 拦截 → 模型支持判定 → 降级/报错）——status=登记待设计（降级形态：自动 spawn 视觉子代理
  vs 提示用户选视觉模型 vs 混合）——设计权在用户

- [x] ~~**MODEL-400 交付裁断项（2026-09-09 id=25 遗留——防御完善非急）**~~——**2026-09-09 已交付核销**（QUICKFIX-2 F-1 VSC byName 镜像 + F-2 跨渠道 models[0]——双端）：
  ① VSC byName 镜像（subagent.mjs:119-120——设计锚 CLI-only——F-1 断言兜住——补镜像+测试更净）
  ② F-2a 跨渠道语义（cfg.provider≠主渠道且无 cfg.model → 现用主 provider.model 发别家端点 = 403 险——
  建议改用命中渠道 models[0]）——status=登记——设计权在用户

- [x] ~~**INPUT-LOCK busy 行为修订（2026-09-09 用户反馈——对已交付核销设计的体验修正）**~~——**2026-09-09 已交付核销**（INPUT-LOCK-BEHAVIOR-REVISED——CLI 8ee5309 + VSC c9509ad——clean——L2 ⑤ 断言在列）：
  ① 输入不禁用：主会话 busy 时**允许继续录入**（VSC readOnly 锁禁打字 = 过度——改不禁——可打字回显）
    ——但 **send/Enter 禁止**（不允许发出去——VSC send.js 守卫保留/CLI 提交吞保留）
  ② 斜杠白名单删除：busySafeCommand/BUSY_SAFE_COMMANDS（CLI——/exit /help /model 忙时直执行）= 过度设计——
    删——斜杠命令 busy 时同走 send 禁止——（紧急退出 = Ctrl+C 门禁前保留——与白名单无关）
  ——owning board = INPUT-LOCK（已核销——**新范围走新设计评审链——新 token**）——status=登记待设计
  （用户裁：忙时斜杠也禁 send——/exit 也发不出——退出靠 Ctrl+C——纯一致禁发）——设计权在用户

- [ ] **IMAGE-DOWNGRADE 跟进项（2026-09-09 交付注——①已闭合）**：
  ① ~~susp 等待态贴图不降级~~（已闭合——实现为显式边界——父侧确认接受）② runVisionReader maxTurns 固定 10
  ——大贴图（>6-8 张）可能落 F-2 fallback——按图数伸缩建议（2+paths.length*2——后批）③ Stop 点击在降级 await
  窗口内 no-op（≤60s——v1 接受）——status=登记——设计权在用户

- [ ] **VSC git 工具 commit 镜像缺口（2026-09-09 QUICKFIX-2 交付注——后批镜像 F-3）**：
  thincoder-vscode/src/tools/git.mjs:200-220 commit case 仍有同款"granular add + 整索引 commit"双层混扫
  缺陷——CLI F-3 commit --only 已修——VSC 镜像待补——owning board = git 工具面（双端对齐）——
  status=登记——设计权在用户

- [ ] **RESIZE 交付建议（2026-09-09——advisor 可选 🟡——后批）**：恢复序列字面量三源（writeCleanupSequence vs
  cleanup 余部 + 测试第三份）→ CLEANUP_REST 常量收拢——当前测试字节锁兜底——status=登记——设计权在用户

- [ ] **INPUT-LOCK-BEHAVIOR 交付注（2026-09-09——out-of-scope + 🔵 级）**：
  ① VSC docs/design/AGENT-LOOP.md §7 机制正文（L290/L322——"readOnly 锁 + 中断模态豁免锁"旧句）仍 C' 态
  ——设计受影响表只列 CLI doc 行——补 VSC doc 同步（下批——doc 面）② key-handler busy 门禁注释"Tab/↑↓ 仍禁"
  措辞微瑕 + L271 tab 死条件（🔵 级——下批）——status=登记——设计权在用户

- [ ] **digest 注入预算扩面（2026-09-09 BATCH-3 交付偏差——后批）**：预算现覆盖 = 双端 subagent 族 + CLI
  advisor/escalate 族——consult 族（CLI injectConsultResult）+ VSC advisor/escalate/consult 各族注入器绕过
  ——扩面 = VSC 分发点 injectPendingAsync + consult 注入器逐点落预算——需新设计评审——status=登记

