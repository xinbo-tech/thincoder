# 项目待办（Project TODO）
> 项目级统一待办清单：所有来源的待办（设计遗留、评审发现、用户指示、在途实现）汇总于此，不散落在设计文档中。
> 本文件只承载**当前待办与在途项**；已完成/已消解项已移除或勾销（git history 完整可追溯——2026-09-08 清理）。
> 状态标注约定：`open`=待办 / `在途`=已批准实现中 / `待核销`=已实现待父侧核销 / `挂起`=用户暂缓。
> 维护：工程模式下由架构师（agent）在对话中即时更新；用户在需要时增删。
---

## 模块/行数技术债（超限拆分候选）
- [ ] **system.mjs 506 行超 500 硬限**（legacy 单文件 bash/grep/glob/ls 聚集体——2026-09-08 实测唯一仍越 500 硬限的文件——拆分会动整个工具组——建议独立清理批）
- [ ] **VSC agent/setup.mjs 396 行**（>300 advisory——2026-09-08 实测已增长至 396——下次触碰拆）
- [x] ~~模块拆分轮超限债~~——**2026-09-08 核查已兑现勾销**：模块拆分轮已把 session/CLI 8 文件/subagent 家族/verify/run/context/render-conversation/tool-events/agent-turn/compact 等全拆至 <500
  （实测 session 483 / agent 384 / context 381 / subagent ~284 / subagent-async 382 / verify 291 / agent-turn 326 / render-conversation 425 / tool-events 401 / file 443 / bin 500；VSC subagent 489 / subagent-async 450 / compact 302 / run.mjs 拆为 run-helpers+stages）；测试 >500 债随测试全删消解

## 代码正确性 / 边界小修（低优先加固）
- [ ] **VS Code detectRestoredSession 闸语义完善**（环境感知层遗留——按会话跟踪 vs 进程级一次性闸——中途切换会话拿不到 resumed:yes——语义完善项）
- [ ] **join(cwd, p) 双前缀 bug 残留**：`cmd-undo.mjs:23` join(cwd, ...split("/")) 对模型绝对路径静默失效——bug 仍在（L23 确认）——小修 + VS Code 镜像同查
- [ ] **memory_delete 边缘容错**：deleteByUid 对畸形 uid（personal:5:extra）静默删目标 id（rest[0] + trailing 忽略）——低优先加固
- [ ] **MCP readMcpSection servers 非数组静默当空**：config.mjs 对 servers 非数组仍返回 ok:true,servers:[]——改判 ok:false 走畸形回退（仅 CLI，VSC 无同名）
- [ ] **C 方案：read 读回 offload 文件防炸**——read 返回"头+尾"防读回 1MB——独立后续（A 方案含尾部预览已落地——C 堵剩余回路）
- [ ] **advisor 截断方向另议**——advisor/run.mjs 头向 line-aware 截断——尾部结果被切问题未解决
- [ ] **VS Code git 富注入异步优化**（3×execSync 每回合——最坏 ~15s 阻塞——异步优化项）
- [ ] **files 尾随空格目录声明检测**（normalizeFileList 对 "test/ " 尾随空格仍逃过——一行加固 trimEnd 判后缀）
- [ ] **R19 read_history 发现面无 top-N cap**（discoverCwd 列全部槽——大目录摘要可打输出上限——加 top-N + overflow 提示）
- [ ] **R19 护栏语义缺口**：READ_HISTORY_SCAN_MAX 按物理 \n 行计，自产槽紧凑单行换行≈0 → 护栏不触发——需 SESSION §13 裁定字节/消息预算（双端镜像同值）
- [ ] **R18+R19 VS Code 交付跟进**（保留部分）：① read-history.mjs 349 行拆分 ③ ROUTE_NA 移除后路由断言加固（②测试预拆、④已实现——勾销）
- [ ] **agent 生命周期小项**：VSC subagent.mjs 注释过时 / A2 摘要触发条件（仅 ## 节标题）/ auto-think depth 恒 0
- [ ] **TUI tool-args 块标题兜底**：action-only subagent 调用块标题光秃 "❯ subagent"——加 a.action 兜底显示
- [ ] **setup.mjs knife-edge 注记过期**：agent/setup.mjs:313 仍写 "adjusted to 12500"，T3b 重校准 14000 未同步
- [ ] **ACP 桥结构化映射**（⟦ev⟧ 剥除已落地 D7；ACP tool_call_update 结构化映射留待后续）
- [ ] **doc-sweep 旧名残留**（memory 旧裸工具名）：FEATURES.md/AGENT-LOOP/ARCHITECTURE/VSC CAPABILITY_GAP.md（FEATURES/CAPABILITY_GAP 优先）
- [ ] **VS Code 端轨迹存档同构实现**（完整轨迹落盘 VSC 端）——**需用户明确"也要 VS Code"才启动**
- [ ] **轨迹目录清理策略**（CLI trace-store 已有 D-TR10 24h 清理；按天/会话 GC 补充策略）——**需用户定是否还需**

## 模块拆分 · 文档引用清扫（父侧，逐文件批）
- [ ] **D-T1.8 文档引用修正（剩余清单）**：ENGINEERING-MODE.md ~20 处 + TOOLS.md:93/:131 + TUI.md:4/:331
  - TUI-INPUT-BOX.md:151/:169/:209/:233 + CHECKPOINT.md:124/:137 + MEMORY.md:177
  - CONTEXT-COMPACTION.md:247/:342 + SESSION.md:166/:212 + PROMPT-DECOUPLING.md:42/:53/:84
  - SEND-STALL:96 + TOOL-OUTPUT-LIMITS:50-53/:61-62/:104 + ADVISOR-CONVERGENCE:176 + VERIFY-DOCONLY:34
  - AGENT-PARAMS:61-2/:71 + COVERAGE-GAPS:11/:19/:32/:58-9 + ENG-TOKEN-BINDING:13-4 + ARCHITECTURE:255 + MCP:3
- [ ] **ARCHITECTURE.md:596 §20 残留 test/subagent.test.mjs 引用**（引用已删测试文件路径——文档层残留未扫）
- [ ] **ARCHITECTURE.md §19.6 引用段缺口**（§19.6 panel 检查工具实体未实现——引用段待补）
- [ ] **AGENTS.md release flow 与 RELEASE.md §2 分歧**（实测 AGENTS bump→publish→commit→push vs RELEASE bump→commit→tag→push→publish——真实 doc 分歧）
- [ ] **R7 AC 补"残留扫描只约束活体文案"豁免注**（advisor 🔵 未采纳——随 R7 核销记录落）
- [ ] **VS Code 根 METHODOLOGY.md 头注悬空指针**（指向本仓不存在的 docs/design/METHODOLOGY.md）——顺手修

## 工程模式 / 评审收敛（prompts + 机制）
- [ ] **§18.8/§18.10 复核（AC-OA4）**：after 样本 = T（2026-09-04 05:06）后首次干净外部评审——信号密度 ≤0.70×1.86=1.30 达成——未达呈报（观察，等样本）
- [ ] **修正轮纠结密度观察**：修正轮密度 2.20/1K > 基线 1.86——AC-OA4 可能低估受益面——等样本
- [ ] **AC-OA4 统计脚本（可选仓库工具）**：统计轨迹 JSON 评审信号密度——低优先
- [ ] **advisor 裁决模板立项**（治 #15/#36 单轮 126s+ 输出 reasoning 自我协商）——等用户定时机
- [ ] **§19.6 panel 检查工具**（已批未实现——重启后重评审）
- [ ] **sync spawn 区块 ⏹ 语义裁决**：sync 运行中 ⏹ 可见不可中止（有 Ctrl+C 指引）——彻底方案（⏹ 按池门控）需跨 TUI 改造——用户裁决后立项
- [ ] **setup.mjs 受限变体 schema 补 cancel 词**（描述层同步）
- [ ] **engineering-sub.md L1 "~15s" 数字漂移**（实测 18.5-19.7s）——随下个提示词批修

## VS Code 镜像/评审面差异
- [ ] **VS advisor-design.md 缺 R24a 第 8 条评审标准**（Affected-file size annotations 段缺失）——单独立项
- [ ] **VS code 评审陈旧面裁定候选**（VS 评审陈旧=任意文件变更 vs CLI isCodePath）——待用户裁定对齐
- [ ] **🔵 五项不修登记（父侧知悉）**：VS sync design 轮次不递增 / VS guard cap 读全局轮 / CLI guard 文案无 async 补注 / VS depth-undefined 缺省 async / CLI T-24b1 墙钟断言（已知不修，留档）

## 异步 / 挂起 / 调度残留（AGENT-LOOP 后续轮）
- [ ] **async 结果容器统一（2026-09-08 需求点——**在途**（双端 ASYNC-RESULT-CONTAINER 设计已批准 + eng-coder 实现中——CLI id=2 + VSC id=1 跑着）——交付后核销勾销）**：async settle 记账在 subagent/advisor/escalate/consult **4 处逐字重复** + pending 分叉 + `_sessionSignal` 别名抄 4 次
  ——统一单载体（池 accessor+pending 单容器+role+共享 settle helper+buildChildSignal）——最深状态债（涵盖并行 check 双消费/挂起期 check 双投/settle 队列改造/4 explore 等散项）
- [ ] **sync spawn 完成精确冻结**（finishSubTask"最早 started"启发式误冻——方案 e：subagent 留 _subagentKey → 精确冻）——设计落 AGENT-LOOP §7.2
- [ ] **processing 态 Ctrl+C 武装化 + 回合 abort 与池解耦**（回合 abort 无条件清池连坐杀后台）——首按=interrupt 不清池 + 3s 二按=清池
- [ ] **混合边环形等待残留**（dependsOn 边 + 文件域边混合链）——建议 §21.2 候选（停滞检测）
- [ ] **§21 普通模式偏差审计 + §18.8.1 会话上下文轮——挂起**（用户"先挂一下"——重新决定：评审/修改/放弃）

- [ ] **档位 B：subagent 工具 description 动态矩阵**（工具集变化时自动跟随——A 已落地，B 待工具集真变再动）
- [x] ~~**CLI ⏹ / 面板行数增长缺陷**~~（trimSubTree done 子块无豁免）——**2026-09-08 核查已修**：§27.1 F1（2026-09-07 三缺陷修复批 b06bca7）trimSubTree 已跳过 done 子块（subagent-children.mjs:66 `if (c.done) continue`）+ done 定格守卫——原待办作废

## 需求池 / 在途实现（状态随批推进更新）
> 快车道：用户说"急"走单点不入池。生命周期：实现后核销勾销。
- [ ] **R10 多实例协作感知**——设计已批准——**在途**（待核销）
- [ ] **R16 token 生命周期语义修订**（TTL 到期+重启/开模式清过期）——需求已登记——**待设计**
- [ ] **env-state 补当前会话 slot**（agent 自知当前会话槽号——SESSION §11 env-state 补 slot 字段）——双端——设计启动权在用户
- [x] ~~**async 评审凭证结算根治**~~——**已实现**（2026-09-08 双端交付：CLI `a7e78b0`+`08cabb9` consume 落盘 / VSC `159a39f`——settle 当场落盘+门禁 miss 回读+镜像退役+consume 落盘对称——token 根治验证通过：async advisor settle 落盘+digest 后 spawn 能过）
- [x] ~~**父 agent 观察运行中子代理（功能①）**~~——**已实现**（2026-09-08 双端交付：CLI `2060e0d` / VSC `605a901`——observe 动作：按 id 拉 5 条回合摘要+当前工具+turn/touched，治父看不到中间）
- [x] ~~**父 agent 注入提示给运行中子代理（功能②）**~~——**已实现**（2026-09-08 双端交付：CLI `2060e0d` / VSC `605a901`——send 动作：写 entry._injected 队列，子 runAgent 回合边界消费作普通 user 指令——治无法中途引导）
- [ ] **designer 子代理架构（2026-09-08 用户需求点——主会话纯中转，设计要求固化 designer 提示词）**：设计工作从主会话剥离给专门 designer 子代理——主会话只澄清需求+派 designer+评审设计+批准（不再自己写设计，哪怕小改动也派 designer）。designer 只写设计文档（主会话给澄清后需求+上下文，它产出设计文档到 docs/design/，不参与澄清）；直接写盘（产出即定稿）；一次性（每设计任务 spawn 一个，用完即弃）
  ——需：新 designer 角色（子代理工具加 designer role）+ designer 提示词（固化 METHODOLOGY 三层结构/文档归属/验收标准格式/文档地图检查/受影响文件表格式）+ 主会话提示词改（工程模式 Mandatory Flow 改设计由 designer 做）+ designer 工具集（写 docs/design/ 权限+读代码/文档）——双端（CLI/VSC）同机制
- [x] ~~**memory 工具完善（2026-09-08 用户发现——delete scope 不一致 bug）**~~——**已实现**（2026-09-08 双端交付：CLI `528d2ab` / VSC `426b574`——scope→layer 全统一 + delete layer 可选 + 尊重 uid origin + list [layer] 标签——设计链闭合 consume）
- [x] ~~distill 子系统 scope→layer~~——**已实现**（2026-09-08 交付 commit 26cd89f——--layer 命令面 + --scope 显式报错两形态 + 读时归一 L124 + 错误串 layer + test 8 用例——设计链评审通过）——遗留：①distill-command L75 展示无兜底（legacy scope-only 输出展示空层——Advisor #1 Deferred——需父侧裁定前置归一 vs 展示兜底——现 L124 唯一消费点设计）②bin/thincoder.mjs 501 行 >500 存量债（HEAD 前即 501——净 0 行改动）——挂 STRUCTURE-DEBT 观察
- [x] ~~**edit 工具改进（2026-09-08 用户需求点——符合模型直觉）**~~——**已实现**（2026-09-08 双端交付：CLI `2de2a04`+`9c4eaa4` / VSC `85bfc7f`——按行号改 line/startLine/endLine + 模糊匹配 + 替换即删——阶段 2 功能统一/文档重组见下）

## 会话/存储/恢复后续
- [ ] **R19 护栏语义缺口**（见"代码正确性"节——需 SESSION §13 裁定字节/消息预算）
- [ ] **session-state 诊断工具候选**：只读诊断命令 dump 当前 cwd 会话槽全貌——技术待办非需求点

## 其他在途/待核销（勾销即移出本节）
- [x] ~~**VS 端面板两缺陷**~~（webview 冻结门丢失 + 扩展端 id 计数器跨 resume）——**2026-09-08 核查已修**：§27.1 F3（冻结块迟到 chunk 三层防护 streaming.js:241 + ui.js:42 + activity.js）+ F4（nextSubagentId 计数器载体改 parent.history ?? parent，跨 resume 续号单调）——2026-09-07 修复批——原待办作废
- [x] ~~**链终 token 消费待执行**~~——**已实现**（2026-09-08 token 根治后 consume 落盘对称——`08cabb9`——consume-design 删内存槽后当场同步落盘删除，消复活洞）
- [ ] **TUI 开放项**：① picker item.note 渲染丢弃 ② question/wizard 并行 UI 统一——架构决策待定（TUI.md §11 承载）
- [x] ~~**平台缺口：async advisor digest token 未注册父会话 approved slots**~~——**已实现**（2026-09-08 token 根治修复——async advisor settle 当场落盘权威台账+digest 后 spawn 门禁 miss 回读能过——消"未注册父会话"缺口）

## 工程模式提示词同步（独立小项）
- [ ] **R3' bash 工具重定向护栏删除**——已实现（id:13 clean，核销见 TOOLS.md §13）——**待父侧勾销**
