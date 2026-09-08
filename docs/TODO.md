# 项目待办（Project TODO）
> 项目级统一待办清单：所有来源的待办（设计遗留、评审发现、用户指示、在途实现）汇总于此，不散落在设计文档中。
> 本文件只承载**当前待办与在途项**；已完成/已消解项已移除或勾销（git history 完整可追溯——2026-09-08 清理）。
> 状态标注约定：`open`=待办 / `在途`=已批准实现中 / `待核销`=已实现待父侧核销 / `挂起`=用户暂缓。
> 维护：工程模式下由架构师（agent）在对话中即时更新；用户在需要时增删。
---

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
- [ ] **C 方案：read 读回 offload 文件防炸**——read 返回"头+尾"防读回 1MB——独立后续（A 方案含尾部预览已落地——C 堵剩余回路）
- [ ] **advisor 截断方向另议**——advisor/run.mjs 头向 line-aware 截断——尾部结果被切问题未解决
- [ ] **VS Code git 富注入异步优化**（3×execSync 每回合——最坏 ~15s 阻塞——异步优化项）
- [x] ~~**files 尾随空格目录声明检测**~~——**2026-09-08 批 1 2.7 已修双端**（CLI scheduler:43 + VSC scheduler:104 trimEnd——VSC 以 CLI 为单一测试锚）
- [x] ~~**R19 read_history 发现面无 top-N cap**~~——**2026-09-08 用户裁不要**（每 cwd 目录槽数有上界——listSlots 时间序有限——无打爆风险——维持现状）
- [ ] **R19 护栏语义缺口**：READ_HISTORY_SCAN_MAX 按物理 \n 行计，自产槽紧凑单行换行≈0 → 护栏不触发——**2026-09-08 用户裁消息数预算**（解析后消息数组长度——最精确——SESSION §13 承载——走设计链排批——双端镜像）像同值）
- [ ] **R18+R19 VS Code 交付跟进（剩 ①）**：① read-history.mjs 349 行拆分（现 368 行未拆——>300 advisory）——③ ROUTE_NA 已移除（②④已勾销）
- [ ] **agent 生命周期小项（剩 A2）**：A2 摘要触发条件（仅 ## 节标题）——注释段已修（批 1 2.5 seven actions）+ auto-think depth 归状态债 #3
- [x] ~~**TUI tool-args 块标题兜底**~~——**2026-09-08 批 1 2.4 已修**（tool-args.mjs:47-48 action 兜底）
- [x] ~~**setup.mjs knife-edge 注记过期**~~——**2026-09-08 批 1 2.8 已修**（删注为首——无树内夹具常量可校准——17000 最新）
- [x] ~~**ACP 桥结构化映射**~~——**2026-09-08 核销**（bridge.mjs:201-204 tool_call 结构化 + :212-214 tool_call_update 落地）
- [ ] **doc-sweep 旧名残留（2026-09-08 大部分核销）**：CLI AGENT-LOOP.md:94 已净（批 2 2a-1 memory search 动作）——剩 VSC CAPABILITY_GAP.md:7/8/21（批 2 2a-2 未落地——eng-coder id=2 在跑）
- [ ] **VS Code 端轨迹存档同构实现**（完整轨迹落盘 VSC 端——**2026-09-08 用户裁要**——VSC 模型调用出口加同款采集点 + JSONL 落盘 ~/.thincoder/traces/——CLI trace-store §18.6 参照——走设计链——等 §11.3/批 5/6 交付后排批）
- [x] ~~**轨迹目录清理策略补充**~~——**2026-09-08 用户裁不要**（D-TR10 24h 保留时间窗已隐含总量有界——保留期可配——无需按天/会话额外 GC）

## 模块拆分 · 文档引用清扫（父侧，逐文件批）
- [ ] **D-T1.8 文档引用修正（剩余清单）**：ENGINEERING-MODE.md ~20 处 + TOOLS.md:93/:131 + TUI.md:4/:331
  - TUI-INPUT-BOX.md:151/:169/:209/:233 + CHECKPOINT.md:124/:137 + MEMORY.md:177
  - CONTEXT-COMPACTION.md:247/:342 + SESSION.md:166/:212 + PROMPT-DECOUPLING.md:42/:53/:84
  - SEND-STALL:96 + TOOL-OUTPUT-LIMITS:50-53/:61-62/:104 + ADVISOR-CONVERGENCE:176 + VERIFY-DOCONLY:34
  - AGENT-PARAMS:61-2/:71 + COVERAGE-GAPS:11/:19/:32/:58-9 + ENG-TOKEN-BINDING:13-4 + ARCHITECTURE:255 + MCP:3
- [x] ~~**ARCHITECTURE.md:596 §20 残留 test/subagent.test.mjs 引用**~~——**2026-09-08 核销**：ARCHITECTURE.md 已缩至 84 行指针档（:596 不存在），docs 全树 grep subagent.test.mjs 0 命中——前提已死
- [x] ~~**ARCHITECTURE.md §19.6 引用段缺口**~~——**2026-09-08 核销**：§19.6 panel 检查工具实体已实现（subagent-panel.mjs——AGENT-LOOP.md:46/52 明记 2026-09-08 二次拆分 + agent-tools/subagent.mjs:80 panel action）——引用段待补前提消失
- [ ] **AGENTS.md release flow 与 RELEASE.md §2 分歧**（实测 AGENTS bump→publish→commit→push vs RELEASE bump→commit→tag→push→publish——真实 doc 分歧）
- [x] ~~**R7 AC 补"残留扫描只约束活体文案"豁免注**~~——**2026-09-08 批 2 2a-4 已落**（AGENT-LOOP R7f 在位）
- [x] ~~**VS Code 根 METHODOLOGY.md 头注悬空指针**~~——**2026-09-08 核销**（批 2 2a-5 已修——VSC METHOD:5 改指 CLI 端 thincoder/docs/design/METHODOLOGY.md——含 :61/:94 同类修正轮）

## 工程模式 / 评审收敛（prompts + 机制）
- [ ] **§18.8/§18.10 复核（AC-OA4）**：after 样本 = T（2026-09-04 05:06）后首次干净外部评审——信号密度 ≤0.70×1.86=1.30 达成——未达呈报（观察，等样本）
- [ ] **修正轮纠结密度观察**：修正轮密度 2.20/1K > 基线 1.86——AC-OA4 可能低估受益面——等样本
- [ ] **AC-OA4 统计脚本（可选仓库工具）**：统计轨迹 JSON 评审信号密度——低优先
- [ ] **advisor 裁决模板立项**（治 #15/#36 单轮 126s+ 输出 reasoning 自我协商——**2026-09-08 用户裁立项**——评审提示词 round1/2/3 + design 模板化——走设计链——等 §11.3/批 5/6 交付后排批）
- [x] ~~**§19.6 panel 检查工具（已批未实现）**~~——**2026-09-08 核销**：已实现（subagent-panel.mjs 双端在 + action 面在——与 L41 同证据）
- [ ] **sync spawn 可中止能力**（**2026-09-08 用户裁要**——TUI.md:398 门控 sync 无 ⏹ 只消"可见不可中止"误导——现补 sync 真中止能力——⏹ 按池门控——需跨 TUI + 调度改造——走设计链排批）
- [ ] **setup.mjs 受限变体 schema 补 cancel 词**（描述层同步）
- [ ] **engineering-sub.md L1 "~15s" 数字漂移**（实测 18.5-19.7s）——随下个提示词批修

## VS Code 镜像/评审面差异
- [x] ~~**VS advisor-design.md 缺 R24a 第 8 条评审标准**~~——**2026-09-08 核销**（VSC advisor-design.md:8 已含 Affected-file size annotations——与 CLI 逐字一致）
- [ ] **VSC 评审陈旧面对齐 CLI isCodePath**（**2026-09-08 用户裁对齐**——VSC 只代码路径算陈旧——文档改动不催评审——走设计链排批——CLI 参照）
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
> 2026-09-08 批实况（17:07 终态）：**批 1/批 2/批 3** 全交付核销（L2 双端 112/105 全绿——批 3 文档
> 指针同步：CHECKPOINT/STRUCTURE-DEBT system.mjs 改指 bash.mjs/search.mjs——父侧收尾）；**env-state
> 扩展**（SESSION §11.2）已交付核销（bba68df/0bf02b0 + VSC 7e7d90a/ec1e4c4——slot+resumed 按会话
> +F3+双信号——L2 绿——consume 554b6251——**双端 system.md:24 env-state 描述未含 slot——需同步**）；
> **§7.7 顶层异步**已交付核销（c08e1b2/8763ac2——L2 绿——consume a2b10815）；agent 生命周期 + 11.7 + D6
> union 早前核销。批 4 剩 designer/R19（未排）。
- [x] ~~**批 3（结构债批 B）**~~——**2026-09-08 已交付**（SYSTEM-SPLIT——bash.mjs/search.mjs/question.mjs——待 L2 终链 + consume 3aaf4154）
- [ ] **批 4（需求池各自独立——2026-09-08 并批评估定——设计权在用户）**：~~R16 token 语义~~（**已死——D1-D5 覆盖——L81 勾销**）/ env-state 补当前 slot（**需求段已落 SESSION §11.1——等确认**）/ designer 子代理（大）/ R19 护栏裁定——逐个独立全链

- [x] ~~**R10 多实例协作感知**~~——**2026-09-08 核销**（双端 pushPeerReminder 在位——peer-instances.mjs 在——config 写前 mtime 门控 F5b 在——MULTI-INSTANCE-COLLAB.md 双端）
- [x] ~~**R16 token 生命周期语义修订**~~——**2026-09-08 核销勾销**（被 DESIGN-TOKEN-SETTLEMENT D1-D5 双端根治覆盖——settle 落盘权威台账 + TTL 三时机清理 purgeExpiredDesignTokens + restore 过滤 + 门禁过期拒——"待设计"标记过期）
- [ ] **env-state 补当前会话 slot**（agent 自知当前会话槽号——SESSION §11 env-state 补 slot 字段）——双端——设计启动权在用户
- [x] ~~**async 评审凭证结算根治**~~——**已实现**（2026-09-08 双端交付：CLI `a7e78b0`+`08cabb9` consume 落盘 / VSC `159a39f`——settle 当场落盘+门禁 miss 回读+镜像退役+consume 落盘对称——token 根治验证通过：async advisor settle 落盘+digest 后 spawn 能过）
- [x] ~~**父 agent 观察运行中子代理（功能①）**~~——**已实现**（2026-09-08 双端交付：CLI `2060e0d` / VSC `605a901`——observe 动作：按 id 拉 5 条回合摘要+当前工具+turn/touched，治父看不到中间）
- [x] ~~**父 agent 注入提示给运行中子代理（功能②）**~~——**已实现**（2026-09-08 双端交付：CLI `2060e0d` / VSC `605a901`——send 动作：写 entry._injected 队列，子 runAgent 回合边界消费作普通 user 指令——治无法中途引导）
- [ ] **designer 子代理架构（2026-09-08 用户需求点——主会话纯中转，设计要求固化 designer 提示词）**：设计工作从主会话剥离给专门 designer 子代理——主会话只澄清需求+派 designer+评审设计+批准（不再自己写设计，哪怕小改动也派 designer）。designer 只写设计文档（主会话给澄清后需求+上下文，它产出设计文档到 docs/design/，不参与澄清）；直接写盘（产出即定稿）；一次性（每设计任务 spawn 一个，用完即弃）
  ——需：新 designer 角色（子代理工具加 designer role）+ designer 提示词（固化 METHODOLOGY 三层结构/文档归属/验收标准格式/文档地图检查/受影响文件表格式）+ 主会话提示词改（工程模式 Mandatory Flow 改设计由 designer 做）+ designer 工具集（写 docs/design/ 权限+读代码/文档）——双端（CLI/VSC）同机制
- [x] ~~**memory 工具完善（2026-09-08 用户发现——delete scope 不一致 bug）**~~——**已实现**（2026-09-08 双端交付：CLI `528d2ab` / VSC `426b574`——scope→layer 全统一 + delete layer 可选 + 尊重 uid origin + list [layer] 标签——设计链闭合 consume）
- [x] ~~distill 子系统 scope→layer~~——**已实现**（2026-09-08 交付 commit 26cd89f——--layer 命令面 + --scope 显式报错两形态 + 读时归一 L124 + 错误串 layer + test 8 用例——设计链评审通过）——遗留：
    ①distill-command L75 展示无兜底（legacy scope-only 输出展示空层——Advisor #1 Deferred——需父侧裁定前置归一 vs 展示兜底——现 L124 唯一消费点设计）
    ②bin/thincoder.mjs 501 行 >500 存量债（HEAD 前即 501——净 0 行改动）——挂 STRUCTURE-DEBT 观察
- [x] ~~**edit 工具改进（2026-09-08 用户需求点——符合模型直觉）**~~——**已实现**（2026-09-08 双端交付：CLI `2de2a04`+`9c4eaa4` / VSC `85bfc7f`——按行号改 line/startLine/endLine + 模糊匹配 + 替换即删——阶段 2 功能统一/文档重组见下）

## 会话/存储/恢复后续
- [ ] **R19 护栏语义缺口**（见"代码正确性"节——**2026-09-08 已裁消息数预算**——同 L24）
- [ ] **session-state 诊断工具候选**：只读诊断命令 dump 当前 cwd 会话槽全貌——技术待办非需求点

## 其他在途/待核销（勾销即移出本节）
- [x] ~~**VS 端面板两缺陷**~~（webview 冻结门丢失 + 扩展端 id 计数器跨 resume）——**2026-09-08 核查已修**：§27.1 F3（冻结块迟到 chunk 三层防护 streaming.js:241 + ui.js:42 + activity.js）+ F4（nextSubagentId 计数器载体改 parent.history ?? parent，跨 resume 续号单调）——2026-09-07 修复批——原待办作废
- [x] ~~**链终 token 消费待执行**~~——**已实现**（2026-09-08 token 根治后 consume 落盘对称——`08cabb9`——consume-design 删内存槽后当场同步落盘删除，消复活洞）
- [ ] **TUI 开放项**（**2026-09-08 用户裁两项都做**）：① picker item.note 渲染 bug 修（buildProviderEntries baseURL/无 key 提示 + cmd-advisor 主菜单 Provider 注记不显示——疑似 bug）② question/wizard/picker 三套选择 UI 统一——走设计链排批（TUI.md §11 承载）
- [x] ~~**平台缺口：async advisor digest token 未注册父会话 approved slots**~~——**已实现**（2026-09-08 token 根治修复——async advisor settle 当场落盘权威台账+digest 后 spawn 门禁 miss 回读能过——消"未注册父会话"缺口）

## 工程模式提示词同步（独立小项）
- [x] ~~**R3' bash 工具重定向护栏删除**~~——**2026-09-08 勾销**（TOOLS.md 无护栏文案——bash.mjs 仅保留 >2MB 输出丢弃指引）

## 文档地图整体清扫（2026-09-08 批 2 报告发现）
- [ ] **AGENTS.md 文档地图陈旧**：:17 仍列 VERIFY-DOCONLY.md（归档后悬空）+ 整体含早已归档档（ENGINEERING-WORKLOOP 等——批 A 前即如此）——父侧立项整体清扫（非批 2 2b-6 范围——批 2 只做 README/SETTINGS-TOOL）
- [ ] **双端 system.md:24 env-state 描述未含 slot**（env-state 行实已含 slot——SESSION §11.2 实现后描述漂移——id=9 报告项 3——提示词同步小项——双端逐字同步）
- [x] ~~**平台侧 subagent 工具描述仍含旧 async:false 引导**~~——**2026-09-08 §7.7.1 勾销**（纠错：工具描述在项目仓 src/agent-tools/ 可改——本批已清 subagent.mjs/subagent-spec.mjs Async spawn 段 + escalate 段 + advisor.mjs 描述——锚句逐字落入——测试锚定）
- [x] ~~**escalate/advisor 顶层 async:false carve-out 范围界定**~~——**2026-09-08 §7.7.1 勾销**（用户裁 a：escalate/advisor 顶层也纳入一律异步——§14.2 同步保留句删 + main.md/engineering.md/discipline.md 引导清 + §7.2 escalate 行注——全链完成）

## 屎山度第三次评估清扫批（2026-09-08 夜）
- [ ] **批 5（文档小批——N3+N7）**：AGENTS.md 地图陈旧 8+ 悬空 + 5 档批执行文档未登记（N3）+ resumed/restart 载体异名统一注释锚（N7——语义已裁 A——文档级）——走设计→评审
- [ ] **批 6（代码小批——N1+N6）**：VSC subagent.mjs 507 行 + advisor/run.mjs 511 行越线小拆（N1——500 硬拆纪律）+ `_permQueue` 3 处 inline 收 helper（N6——含 escalate 语义澄清 subagent-actions.mjs:426 注释）——走设计→评审
- [ ] **双端 system.md:24 下批同步**（§11.3 交付上报项 1+2——2026-09-08 用户裁接受 slot 短句纳入）：
  （① token 存活指引矛盾——CLI 例外段 vs VSC tokens 不存活——token 权威 DESIGN-TOKEN-SETTLEMENT——VSC 对齐 CLI）
  （② slot 行内 prose 补 sticky-slot 短句——null when none is bound）
  （③ §11 字段映射补 slot 条目）——走设计链排批
