# 项目待办（Project TODO）

> 项目级统一待办清单：所有来源的待办（设计遗留、评审发现、用户指示、在途实现）汇总于此，不散落在设计文档中。
> 本文件只承载**当前待办与在途项**；历史已完成项已移除（git history 完整可追溯——2026-09-08 整理）。
> 状态标注约定：`open`=待办 / `在途`=已批准实现中 / `待核销`=已实现待父侧 L2 核销勾销 / `挂起`=用户暂缓。
> 维护：工程模式下由架构师（agent）在对话中即时更新；用户在需要时增删。

---

## 模块/行数技术债（超限拆分候选）

- [ ] **session.mjs 预拆**（2026-09-06，来源：eng-coder 移交——494 行近 500 硬限零余量——下次变更前预拆，避免临时凑行数搬迁）
- [ ] **CLI 8 个源码文件超 500 行硬限**（HEAD 即超限，既有债务）：subagent.mjs **690** / agent.mjs 530 / context.mjs 524 / core.mjs 555 / subagent-async.mjs（拆分轮启动实测为准，历史 946/896/649 混排）——按 AGENTS.md 硬限应拆，需独立技术债批次（新建文件+改导入面）——拆完在 §18.6.2 勾销
- [ ] **VS Code subagent 家族超限**：subagent.mjs 512 / subagent-async.mjs 896（历史快照，拆分轮启动实测为准）——ARCHITECTURE.md:596 已记录并入拆分轮
- [ ] **verify.mjs 527 行**（2026-09-05 遗留批 advisor 🔴#1——L0 重构批后越 500 硬限——父侧挂债 §18.6.2 先例）——拆分建议：watchdog 族（killProcessTree/runWatch/runTestFile/runTestSuite）抽共享模块，顺带消解 system.mjs/execute.mjs 三份 kill-tree 重复
- [ ] **测试文件 >500 存量债**（2026-09-06——F-S5 用户裁定"不允许豁免"后测试文件同判——实测清单）——排独立测试拆分轮（按域分，§18.14 先例），与源码拆分轮分开（测试拆分无导入面风险但有用例数对拍纪律——§20.9 断言数不减）
  - **CLI 26 个**（1/3）：edit-tools 1585 / prompts 1319 / mcp 1163 / memory 1108 / acp 1033 / advisor-message 1031 / subagent-scheduler 1009 / subagent-async 973
  - **CLI 26 个**（2/3）：eng-delivery 970 / suspension-core 962 / agent-core 937 / tui-render 841 / agent-turn 810 / checkpoint 795 / mouse 736 / subagent-core 653
  - **CLI 26 个**（3/3）：tui-input 640 / session-compaction 638 / subagent-blocks 621 / proxy 608 / session 604 / tui-panel 599 / session-safety 586 / provider-stream 510 / log 507 / slash-commands 506
  - **VS Code 17 个**：subagent-async 1115 / suspension 1087 / subagent-tool 1037 / provider 1024 / advisor 970 / prompts 946 / edit-semantics 891 / unit 843 / edit-eol 782 / chat-panel 753 / compaction 741 / eng-delivery 741 / subagent-scheduler 673 / git 597 / ui 550 / config-io 548 / agent-core 509
- [x] ~~**测试文件 >500 存量债**~~（2026-09-06 登记——**2026-09-08 已勾销**：用户裁定测试全删（VSC 全删 + CLI 清理 312b943），双端现各剩 1 个 test 文件、均 <500 行——本条不再适用）
- [ ] **subagent-async.mjs / subagent.mjs 超 500 硬限**（CLI 703 / VS Code 531——2026-09-04 id:26/id:31 交付 🟡——既有债务，ARCHITECTURE.md:588 历史已漂移）——建议随 §20.9 Module Split 轮：subagent-async.mjs 365-577 行 §20 调度段拆独立模块（test/subagent-scheduler.test.mjs 天然落点）
- [ ] **模块拆分轮超限登记补全**：§20 交付后实测——CLI subagent-async.mjs 947 / subagent-blocks.mjs 625（冻结家族抽 freeze.mjs，re-export 保 API 回落 ~460）/ subagent.mjs 611 / subagent-panel.mjs 待测 / agent-turn.mjs 535 / tool-events.mjs 537；VS Code subagent-async.mjs 885 / subagent.mjs 510——排独立拆分轮（避免同文件并发）
- [ ] **run.mjs 495 行挂债**（VS Code——>300 advisory 既有——R3 挂债不重复——模块拆分轮候选项）
- [ ] **压缩调优：context.mjs（CLI 499）/ compact.mjs（VS Code 496）**（code review advisory）——均超 300 建议、距 500 硬限 ≤4 行
  - 拆法：探索蒸馏段（CLI L360-499 / VS L363-495：EXPLORE_TOOLS / EXPLORE_SUMMARY_PROMPT / distillExplorations / summarizeRunExplorations 系）拆独立模块（context-explore.mjs），主路径回 ~360 行——拆前过设计评审（模块归属 CONTEXT-COMPACTION.md §5 / ARCHITECTURE.md §5）
- [ ] **tui-panel 显示层拆限**：`src/tui/render-conversation.mjs` 573 行超 500 硬限（组件化后 630→573）——frozen/tool-block 段渲染拆独立模块；附：frozen 头 `▶ [✓ …]` 未做宽度截断（§7.2.1 评审 #1 存量）顺手一并处理
- [ ] `src/tui/tool-events.mjs` 344 行超 300 建议线——状态栏分支（onToolCall name→status 映射表）可表驱动压缩；刚随拆分落成，观察增长再动
- [ ] **bin/thincoder.mjs 贴 500 硬限余量**（2026-09-07 R25 交付 advisor 🟡——恰 500 行）——下批将 R25 残留块迁 crash-reports.mjs（registerCrashHandlers() 单一导出，恢复余量）；R25 本批不动
- [ ] **system.mjs 505 行超 500 硬限**（legacy 单文件 bash/grep/glob/ls 聚集体——拆分会动整个工具组——建议独立清理批）
- [ ] **file.mjs 439 行**（≤500 内——下次触碰拆——TOOLS.md §15 批记录）

## 代码正确性 / 边界小修（低优先加固）

- [ ] **VS Code detectRestoredSession 闸语义完善**（环境感知层遗留——按会话跟踪 vs 进程级一次性闸——中途切换会话拿不到 resumed:yes；主路径正确，语义完善项）
- [ ] **verify L0（git-diff 定位改动文件）在"CLI 会话改子目录项目"场景失效**（一手实证）：eng-coder 继承主会话 cwd=workspace 根（非 git 根）→ verify.mjs:78 git-diff 锚定 agent.cwd 非 git repo → changedFiles 空 → L0 失效；workdir 参数不解决
  - 修复方向已定（AGENT-LOOP §18.12，评审 0🔴 批准）：① git-diff 从 _touchedFiles/显式 repo 根推导（D-VR1）③ VS Code verify 对齐 CLI 补 git-diff 段（D-VR2）——待实现
- [ ] **join(cwd, p) 双前缀 bug 残留**：`cmd-undo.mjs:23/71` join(cwd, ...split("/")) 对模型绝对路径静默失效（2026-09-07 R-bug 交付上报——预存在、非记账面——后续小修 + VS Code 镜像同查）
- [ ] **memory_delete 边缘容错**：deleteByUid 对畸形 uid（如 personal:5:extra）静默删目标 id（rest[0] 通过且 trailing 段忽略）——工具生成 id 均规范（实际不可达），低优先级：rest 长度校验或 strict 解析
- [ ] **MCP readMcpSection servers 非数组静默当空**：mcp.servers 存在但非数组 → 返回 ok:true, servers:[] 被当 disk 为空——未连接内存 server 从菜单消失且无 ⚠ 提示——改判 ok:false 走畸形回退（MCP.md §5 仅留指针）
- [ ] **C 方案：read 读回 offload 文件防炸**——read 工具对 tool-results 落盘文件返回"头+尾"（非全文）——防模型读回 1MB 再炸——独立后续（A 方案含尾部预览，多数场景无需读回——C 堵剩余回路——设计见 TOOL-OUTPUT-LIMITS-TUNING.md §5）——待 A 方案落地后评估
- [ ] **advisor 截断方向另议**——advisor/run.mjs:316-333 line-aware 前缀（头向）截断——同一"尾部结果被切"问题——另议
- [ ] **VS Code panel-messages.mjs 路由层无测试触达**（reconnectMcp/editMcp/testMcp 三 case 零覆盖——[Reconnect] 死按钮正是此类无测试接缝的复发实例）——补最小路由断言防同类回归
- [ ] **VS Code git 富注入异步优化**（3×execSync 每回合同步——最坏 ~15s 阻塞事件循环；CLI 同款先例接受——异步优化项）
- [ ] **files 尾随空格目录声明检测**（2026-09-04 id:26 交付 🔵——`files:["test/ "]` 仍可通过——一行加固 trimEnd 后判后缀）
- [ ] **R19 评审 #13 遗留**：read_history cwd 发现面"列全部槽"无 top-N 上限（7383 槽现实下摘要列表可打输出上限）——建议 top-N cap + overflow 提示
- [ ] **R19 护栏语义缺口**：READ_HISTORY_SCAN_MAX 按物理 `\n` 行计数，但自产槽文件紧凑单行 JSON（换行≈0）→ 护栏永不触发——"行读预筛"假定落空——需 SESSION §13 裁定"单行巨型文件字节/消息预算语义与数值"（双端镜像同值）
- [ ] **R18+R19 VS Code 交付跟进（Deferred 4 项）**：① read-history.mjs 349 行（>300 advisory <500 硬限）拆分须与 CLI 并行端同构协调 ② read-history.test.mjs 抵 500 硬限边界下批预拆 ③ ROUTE_NA 移除后路由元素断言可加固 ④ 发现面损坏槽静默跳过语义（已实现——注记）
- [ ] **agent 生命周期小项**：VS Code subagent.mjs:327-329 注释过时（"verbatim _engTaskInput" 与 A2 机械摘要行为不符）；subagent-async.mjs A2 摘要触发条件（仅 `##` 节标题生效，扁平任务书不触发——观察）；auto-think depth 恒 0（子代理启用时补传）
- [ ] **TUI 侧**：tool-args 块标题兜底（action-only subagent 调用块标题光秃 "❯ subagent"，建议 a.action 兜底显示）；sync spawn ⏹ 语义裁决（见异步/挂起节）
- [ ] **setup.mjs:295-298 knife-edge 注记过期**（"adjusted to 12500" 已过时，T3b 重校准 14000——随下个 setup 触碰轮）
- [ ] **ACP 桥结构化映射**（评审 #1 方案 a：⟦ev⟧ 事件剥除随 §7.2 落地 D7；对 ACP 的结构化映射 tool_call_update 留待后续）
- [ ] **checklist 子代理 memory search 行为侧注**：memory 单工具 readonly:false 从只读子代理工具表消失——如需 explore/plan/consult 内 search 需 allowed 集动作感知
- [ ] **doc-sweep 旧名残留**（memory 旧裸工具名）：FEATURES.md 工具表现列、ARCHITECTURE.md:378/462、AGENT-LOOP.md:50、VS Code CAPABILITY_GAP.md:17-18/49（FEATURES/CAPABILITY_GAP 优先）
- [ ] **VS Code 端轨迹存档同构实现**（chat() 入口——thincoder-vscode/src/provider.mjs:130——需求：完整轨迹落盘；本设计 CLI only，端差异见 AGENT-LOOP.md §18.6 问题 3/D-TR6；需用户明确"也要 VS Code"才启动）
- [ ] **轨迹目录清理机制**（按天/会话 GC 配置——生命周期未定、分析周期未知——用户定清理策略后再做）

## 模块拆分 · 文档引用清扫（父侧，逐文件批）

- [ ] **D-T1.8 文档引用修正（§18.14 拆分后剩余）**：已完成 AGENT-LOOP §7.3/§12.1/§18.7 + §18.13/§20.8/§21（部分）；as-of 豁免另注。**剩余清单**：
  - ENGINEERING-MODE.md ~20 处 + TOOLS.md:93/:131 + TUI.md:4/:331
  - TUI-INPUT-BOX.md:151/:169/:209/:233 + CHECKPOINT.md:124/:137 + MEMORY.md:177
  - CONTEXT-COMPACTION.md:247/:342 + SESSION.md:166/:212 + PROMPT-DECOUPLING.md:42/:53/:84
  - SEND-STALL:96 + TOOL-OUTPUT-LIMITS:50-53/:61-62/:104 + ADVISOR-CONVERGENCE:176 + VERIFY-DOCONLY:34
  - AGENT-PARAMS:61-2/:71 + COVERAGE-GAPS:11/:19/:32/:58-9 + ENG-TOKEN-BINDING:13-4 + ARCHITECTURE:255 + MCP:3
- [ ] **陈旧旁路文档修正**：ARCHITECTURE.md:254（"超 16k…只见 2k 预览…硬截断"）+ TOOLS.md:58（"预览 2K 字符足够"）仍是 2026-08-24 前描述——随文档修正轮更新
- [ ] **ARCHITECTURE.md:596 §20 记录残留 test/subagent.test.mjs 引用**（历史 as-of——非本批引入——方便时修）
- [ ] **ARCHITECTURE.md §19.6 引用段缺口**（历史批遗漏——§19.7/design B 已补——§19.6 另补）
- [ ] **VS Code discipline.md:79 `action:'check'` 引用**（CLI 端已删——§19.8 并行批次镜像面遗漏——待并行批次处理或单独修）
- [ ] **子代理工具 schema 与 CLI 差异（VS Code）**：id 类型 number vs string、五动作枚举（VS 无 panel——AC-P4 有意）、无 context 参数——D-A3 范围=description——schema 差异是否统一：待用户裁定
- [ ] **AGENTS.md release flow 顺序与 RELEASE.md §2 分歧**（bump→publish→commit/tag→push vs §2）——doc 层择机对齐
- [ ] **R7 AC 记录补"残留扫描只约束活体文案"豁免注**（advisor 🔵 未采纳——留父侧——随 R7 核销记录一并落）
- [ ] **VS Code 根 METHODOLOGY.md 头注悬空指针**（指向本仓不存在的 docs/design/METHODOLOGY.md）——顺手修

## 工程模式 / 评审收敛（prompts + 机制）

- [ ] **engineering.md:295 架构师 Hard Rules 旧句**（"Do NOT modify any file not listed in the approved design."——父代理约束 FR6 方向一致非矛盾——**用户拍板：保留**——如日后加 "as the parent agent" 限定词随 prompt 同步批顺手）
- [ ] **A-裁定句三处复制（engineering-sub.md :9/:19/:34）**——日后改措辞须三处同步（:9/:19 已同步 A-裁定句 + 防回归断言——本条仅留"日后措辞三处同步"提醒）
- [ ] **verify L0 失效根因修复**（见"代码正确性"节——cwd 错位——新设计点——设计→评审→实现）
- [ ] **工具「模型直觉」改进批**（edit 6 次误操作根因——设计已落 TOOLS.md §15，评审 0🔴 已批——实现批已完成，本条待确认勾销）——见下"edit 工具语义升级"
- [ ] **§18.8/§18.10 复核（AC-OA4）**：after 样本 = T（2026-09-04 05:06）后首次干净外部评审——信号密度 ≤0.70×1.86=1.30 达成——未达呈报
- [ ] **修正轮纠结密度观察**：修正轮密度 2.20/1K > 评审基线 1.86（+18%）——AC-OA4 可能低估受益面——下次"铁律后"eng-coder 修正轮同口径密度应回落 ≤1.3——先记录现状等样本
- [ ] **AC-OA4 统计脚本（可选仓库工具）**：按 §18.8 复核口径正则统计轨迹 JSON 评审信号密度——供 after 样本复核
- [ ] **advisor 裁决模板立项**（治 #15/#36 单轮 126s+ 输出 reasoning 自我协商）：提示词注入"裁决三步法" + 结论表格先行——与 R2 B2（范围收缩）正交——需设计→评审→实现（等用户定时机）
- [ ] **§19.6 panel 检查工具**（已批——旧版作废——未实现——重启后重评审）
- [ ] **TOOLS.md §12 execute prelude 退役**——设计已落（纯净 node 子进程——删两端 exec-prelude.mjs + 描述重写 + 测试 T-E1）——重启后评审拿新 token → 派 eng-coder（两端同步，用户已裁定"可以，两端同样处理"）
- [ ] **sync（阻塞）spawn 区块 ⏹ 语义裁决**：面板无池信号无法区分 sync/async——sync 运行中 ⏹ 可见但不可中止（已有"可操作指引" Ctrl+C 提示）——彻底方案（⏹ 按池成员门控）需跨 TUI 数据流改造——用户裁决后立项
- [ ] **setup.mjs 受限变体 schema 描述补 cancel 词**（工具层错误信息已含——描述层同步）
- [ ] **engineering-sub.md L1 行 "~15s" 数字漂移**（实测 18.5-19.7s——src/prompts 属产品代码需走批——随下个提示词批修）
- [ ] **prompts.test 折行断言收口**（CLI 6/VS 9 断言红——engineering.md/eng-coder.md 折行折叠 vs 旧断言形态不符——上一批改文未跟断言——随下一提示词批收口）

## VS Code 镜像/评审面差异

- [ ] **VS advisor-design.md 缺 R24a 第 8 条评审标准**（双端 diff 实锤——CLI 有 96 行、VS 无 95 行——Affected-file size annotations 段缺失）——并入 §29.1 实现批或单独立项
- [ ] **VS 侧 R24 执行层镜像**（VS advisor-design.md 缺第 8 维——评审弱执行——镜像 CLI 端已落文本——小派单候选）
- [ ] **VS code 评审陈旧面裁定候选**：VS code 评审陈旧=任意文件变更（含文档写）——VS §24 批既有"任意文件面"裁定（测试钉死）与 D-24b"代码面"措辞偏保守（多耗 cap 轮次，方向 fail-safe）——待用户裁定是否对齐 CLI isCodePath 过滤
- [ ] **🔵 五项不修登记（父侧知悉）**：VS sync design 轮次不递增 / VS guard cap 读全局轮 / CLI guard 文案无 async 补注 / VS depth-undefined 缺省 async / CLI T-24b1 墙钟断言（pre-existing）
- [ ] **VS Code 快层 D-T6 门负载抖动触红存量用例**（session-io-parity F4 / compaction / dual-history / mcp 等 800-2100ms 浮动、基线即红）——滚动归册或拦截阈值复议——随下轮测试基建批
- [ ] **CLI slow-gate 归册债**（npm test L1 exit 1 = 49 例未归册超阈——acp/session-compaction 等 85s/86s 老用例——非本批引入——单独归册清理批候选）：机械 test(→slow( 标注
- [ ] **R10 批测试 slow 归册债**（快层 D-T6 拦截 52 个 >800ms 未归册用例：acp/session/guards/peer-collab 等——R10 三面收敛后统一归册——随 R10 核销处理）

## 测试基建 / flake

- [ ] **CLI tui-panel.test.mjs §19.5 D-M7b 时序敏感 flake**（首轮全量偶发 1 败——单跑/复跑绿——跨文件污染型——排查）
- [ ] **VS Code T5/T5b 时序敏感测试**（400ms 断言——单文件偶发失败——基线既有——排查/加固；Phase 1 补充：全量层间歇失败扩大至 suspension T-S1——HEAD 对照实验证实存量非回归——合并治理）
- [ ] **VS Code queue-user-message.test.mjs 孤儿**（替换 send-queue 后从未入 npm test 清单——单跑 2/2 过——决定入册或删除）
- [ ] **time-injection 适配遗留两项**：① process-restarted reminder 含 ISO ts 位于 time 前——per-process 首 run 缓存 miss 一次（若求全命中移 time 后——待 SESSION §11 评估）② time-injection 测试会话目录未沙箱（restart marker 读真实 sessions——归册/沙箱随测试卫生批）

## 异步 / 挂起 / 调度残留（AGENT-LOOP 后续轮）

- [ ] **同回合两个 async 子代理——第二个完成后主 agent 长期 processing 卡住**（用户两次 Ctrl+C 均因此）：诊断插桩已撤除——复现时按插桩点清单重加（曾落 eea8fcc，git show 取 diff）：context.mjs distill/compress chat 前后、agent.mjs runAgent 开头 _pendingDistill await、subagent.mjs settle 回调、agent-turn.mjs digestTurn——复现后定位修复→全量验证
- [ ] **并行 check 双消费竞态**（subagent-async.mjs check——同批两个无 id check 并行可能双消费同一条目——修复需牵动 settle 回调挂起记账）
- [ ] **挂起期阻塞 check 双投**（LOW-3——挂起态 check 与 settle 记账交互——同归 §17 硬化）
- [ ] **settle 完成队列改造**（用户建议方向）：settle 无条件入完成队列（不按 _suspended 分流）——空闲逐个消费注入——根治回合尾 collect 直注入时序缝隙——诊断 explore 已派——收尾链完整时序定位后落设计（§17 硬化轮）
- [ ] **sync spawn 完成精确冻结**（根因已确认：finishSubTask"最早 started"启发式——async eng-coder 与 sync explore 并存面板时 explore 完成误冻 eng-coder 块）——方案 e：subagent execute ctx 留 _subagentKey → dispatch 传 subKey → TUI finishSubTaskKey 精确冻——启发式兜底——设计落 AGENT-LOOP §7.2
- [ ] **processing 态 Ctrl+C 武装化 + 回合 abort 与池解耦**（根因：agent.mjs:457-463 回合 abort 无条件清池连坐杀后台；key-handler:79-84 processing 首按无武装直接 abort——三态不一致）——修复：processing 首按=interrupt 语义（停回合不清池）+ 3s 内二按=显式清池全停——与挂起/空闲同构
- [ ] **agent-turn.mjs 535 行拆分**（§17.5+§17.6 叠加超 500——挂起驱动段迁出——代码已稳定提交 5d500c4 可拆——小拆零行为变化）
- [ ] **混合边环形等待残留**（dependsOn 边 + 文件域边混合等待链仍可能停滞——非静默，check 守卫返回明确错误 + cancel/AUTO 引导）——建议 §21.2 候选（refill/check 守卫机械检测"无 running 且全 queued 不可启动"）
- [ ] **§21 普通模式偏差审计 + §18.8.1 会话上下文轮——挂起**（用户"先挂一下"——设计存疑——用户处理后重新决定：评审/修改/放弃）
- [ ] **挂起模型零散项**：async 双消费竞态（见上）；§17 硬化轮与"4 explore 主回合未消化"同族
- [ ] **async 结果容器统一（2026-09-08 需求点——等 token 根治交付后启动；STRUCTURE-DEBT 批 E+批 C 方向）**：async 子代理结果 settle 记账在 subagent/advisor/escalate/consult **4 处逐字重复** + pending 三族分叉 + 池/done-in-pool 双表示 + `_sessionSignal` 别名/兜底抄 4 次——统一为单载体（池 + pending 带 role 标签 + 共享 settle 收尾 helper + buildChildSignal）——最深状态债（每次加角色复制整段）；与刚做的 token 结算根治共享"异步结算回父"土壤——关联 Top-8 #4 跨树去重——需 explore 一手诊断 + 设计 + 双端同机制一起改

## 观察项 / 候选（未登记立项——等样本/用户决定）

- [ ] **CLI ⏹ cancel 按钮"没出现"**（用户实测——代码/测试全链核实实现存在——渲染单测通过）——**待样本**：用户下次见子代理在跑时截图/描述（async 字样/⏹ 位置/界面）→ 按判据定位：async 标无⏹=渲染断；连 async 标都无=事件断；等待块无⏹=设计正确——待定位后再决定走设计→评审→eng-coder
- [ ] **档位 B：subagent 工具 description 按模式+调用方 allowlist 动态装配"角色×工具"矩阵**（对标 kimi buildProfileDescriptions / opencode registry）——工具集变化时描述自动跟随；档位 A（静态充实版 description + 防泄漏断言）已落地——B 留待工具集真频繁变化时再动
- [ ] **TUI 异常终止无痕诊断观察项**（TUI 画面残留 + 提示符——进程自行终止——Windows 事件日志空/CrashDumps 无 dump——现象学指向 V8 进程内 fatal）——产品面建议：① 全局 uncaughtException 钩子 + TUI finally 终端恢复（清屏回 shell）② --heapsnapshot-on-oom 复现期取证——纯技术待办，未立项
- [ ] **观察项：CLI settle 门 ctx.signal.aborted**（launch 回合 Ctrl+I 后会话绑评审 settle 跳过记账）vs VS controller-only 门 + F2 interrupt 豁免不对称——§29 范围外既有行为——评估候选
- [ ] **混合边环形等待（另录）**——见"异步/挂起/调度残留"节
- [ ] **修正轮密度观察 + AC-OA4 复核**——见"工程模式"节

## 需求池 / 在途实现（状态随批推进更新）

> 快车道：用户说"急"走单点不入池。生命周期：实现后核销勾销 + 指向板块文档。

- [ ] **R10 多实例协作感知**——设计已批准——**在途**（CLI #5/#6 + VS Code #7 在跑）——交付后勾销
- [ ] **R13 advisor 异步化**（主代理跑 advisor 不阻塞前端）——**与 R14 合批（AGENT-LOOP §24）**——已批准——**在途**（CLI 面 B #10）——交付后勾销
- [ ] **R15 排队用户指令合并处理**——**与 R13/R14 合批（D-24c）**——已批准——**在途**（CLI 面 A #9）——交付后勾销
- [ ] **R14 子代理槽位按角色分池 + 可配置**（① eng-coder/explore 槽分开 ② 槽位数可配置，默认 eng-coder 四路 + 其他四路）——**与 R13 合批（D-24a）**——已批准——**在途**（CLI 面 A #9）——交付后勾销
- [ ] **R16 token 生命周期语义修订**（用户裁定：ON→OFF 不清 / OFF→ON 上次评审不重复；TTL 到期+重启/开模式时清理过期）——需求已登记（ENG-TOKEN-BINDING §5）——**待设计**
- [ ] **env-state 补当前会话 slot**（2026-09-08 用户需求点——agent 不知道当前会话的 slot，环境感知要补上）——SESSION §11 env-state 行（现 env/mode/model/resumed）补 `slot: {N}` 字段，agent 自知当前会话槽号（诊断/跨会话/多实例协作语境需要）——板块 SESSION §11（双端：CLI setup-reminders + VS Code）——登记于 SESSION.md §11 未决，设计启动权在用户
- [ ] **async 评审凭证结算根治（2026-09-08 用户裁定落地——不再打补丁，按合理结构重构；VSC 优先——用户确认复发在 VSC）**：designToken/designId 结算从"写评审运行时 agent 内存槽"改为**会话槽文件 designId 键控持久台账 + settle 同步直写 + 门禁读槽**（会诊 4 模型收敛）；**VSC explore 一手核实新增根因——②b 写侧清零：会话内 digest/用户回合 onComplete 用空态 agentState 键存在性覆盖，把 settle 刚落盘的 token 钉 null（settle→digest 时序必杀）+ ②挂起会话 engState 入场快照永不刷新 + ③F2g fire-and-forget 不 await**——核心病根全在 VSC extension 层（panel-session/panel-callbacks/suspension/advisor-async），非 agent 结算机制——板块 VSC（thincoder-vscode）——设计待写（双修：写侧不覆盖 settle 已落盘 token + 读侧会话内回合从槽新读）

## 会话/存储/恢复后续

- [ ] **R19 护栏语义缺口**（见"代码正确性"节——需 SESSION §13 裁定字节/消息预算语义）
- [ ] **session-state 诊断工具候选**：一条只读诊断命令 dump 当前 cwd 会话槽全貌（manifest.active / slotSessions 归属 / end marker / autoApprove/planMode/engineering/advisorGuard/title/消息数/sessionStart）——动机：排查会话问题需手工扫数千文件，逻辑散多处无单点 dump——设计时先查现有可能（/session、acp session list），避免重复造轮子——技术待办，非用户需求点

## 其他在途/待核销（批次推进用——勾销即移出本节）

- [ ] **CLI ⏹ / 面板行数增长缺陷**（2026-09-07 explore id:11 定位——eng-coder#5 explore#1 done 后行数不停涨）：trimSubTree 500 行共享配额裁剪对 done 子块无豁免——1s ticker 每秒重绘放大——修复候选：主修 trimSubTree 跳过 done 子块 / 备选 closeSubChild 定格快照移出配额 / 连带 route* 嵌套 leaf.done 守卫——待用户定修不修
- [ ] **VS 端面板两缺陷**（explore id:10 定位）：① webview 冻结门丢失（append 路径无 frozen 防护——迟到 chunk 追加进冻结块）② 扩展端 id 计数器跨 resume 丢失（explore#1 标签持续产生 chunk——计数器载体改 parent.history ?? parent）——诊断确认 ②——修复 A/B 待批
- [ ] **链终 token 消费待执行（重启后第一件事）**：consume-design 各已核销 designId
  - ① 9e18db9e-…（design cap 豁免 id:5 clean）② cd404069-…（id:9 clean）③ bb3bd6cc-…（id:14 clean L2 双端实质绿）
  - ④ 7c50b588-…（§29.1 id:26 clean）⑤ 6f6533d5-…（§2.6a id:27 clean）⑥ c688f476-…（折行断言 id:3 clean）
  - 注：工具 schema 启动注册不含 consume-design（新机制首战需重启——预期内）；重启后消费槽（验收核销已完成，消费是收尾动作）
- [ ] **TUI 开放项**：① picker item.note 渲染丢弃（架构决策待定）② question/wizard 并行 UI 统一（自由文本态光标/渲染与 wizard 表单统一——架构决策待定）——承载于 docs/design/TUI.md §11
- [ ] **平台缺口：async advisor digest token 未注册父会话 approved slots**（VS Code 实例实证——async 评审完成 token 在 advisor 自身会话签发，父 digest 未写父会话 slots → spawn 校验拒）——解法：同步重评（async:false 自动 round2 注册）——平台修复候选：digest 消费时注册或 spawn 校验接受 digest 文本——thincoder 产品面 bug

## 工程模式提示词同步（独立小项）

- [ ] **edit 工具语义升级**（TOOLS.md §15——6 次误操作根因——设计已批准，主批 + 顺手批全实现——**本条核销状态待确认**）：C 方案（diff 心智——old=上下文/new=结果——行级 diff 应用 + 零重叠完整行插入规则）——设计层全部 Fixed（13 项 round1 + 8 项 round2）——实现批 CLI id:5 clean + VS Code id:6 clean——父侧 L2 核销 CLI 1402/1402 + VS 1114/1114——见 TOOLS.md §15.2 取代指针
- [ ] **R3' bash 工具重定向护栏删除**（已实现 id:13 clean——核销见 TOOLS.md §13）——**本条待父侧勾销**
