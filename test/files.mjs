/**
 * files.mjs — 测试清单单一来源（npm test 快层与 test:full 全量共用）。
 *
 * 2026-09-07 大规模清理：从 68 项收敛为真实冒烟/核心行为集（原锚/时序/UI/内部细节
 * 测试全部删除——AI 提示词锚测试与内部实现锁属于过度工程，见 METHODOLOGY 铁律）。
 * 新增测试文件：在此登记。
 */
export default [
  // 2026-09-09 SESSION-FLOW-C C1 清单修复：agent-core/config-io/execute/git/provider/
  // edit-eol/edit-semantics 在 3b974ae「测试清空」中删除且从未恢复——条目随删除勾销
  // （git 核验——残条目让清单虚报套件组成）。chat-panel.test.mjs 为 C1 重建（本行保留）。
  "test/activity-flow.test.mjs", // SESSION-FLOW-B B1（2026-09-09）：子代理块流内出生/原地冻结/resetActivity/150 计入/⏹ 规则/parseChannel——F-B1a~f + N3 无 DOM move（happy-dom——helpers/webview-env.mjs）
  "test/chat-panel.test.mjs", // SESSION-FLOW-C C1+C2 host 组（2026-09-09）：turn 句柄保底/abort 启动闩/控制直通/响应器 id 匹配/atComplete seq/保序入队——F-C1a~e + ⑦ C2 忙态状态机（F-C2a）
  "test/webview-turnstate.test.mjs", // SESSION-FLOW-C C2 webview reducer 组（2026-09-09）：_turnState 枚举转换/renderStatusBar 单 writer/Stop susp 常显/_suspCounts 不陈旧——F-C2a~e（happy-dom——helpers/webview-env.mjs）
  "test/edit-tool-improvement.test.mjs",
  "test/memory-tool.test.mjs",
  "test/eng-settlement.test.mjs",
  "test/config-merge.test.mjs", // MODEL-SELECTION（2026-09-10）：迁移 v2 双端同规则 VSC 面（形态 A/B→单值、幂等/失败不阻断/凭据不丢、磁盘无 models 键）+ 预设 20 条单值 + resolveDefaultModel 新回退链（复合→渠道默认单值→null）
  "test/provider-admission.test.mjs", // MODEL-SELECTION（2026-09-10）：VSC 渠道准入——三 format 拉取/翻页（T1–T4/T26/T27）+ M9 配置阶段两态（T23/T24——含 fullStatus 拉取失败=不可选）+ 运行期零探测（T25）+ 面板行 `不可用` 标注（happy-dom）
  "test/config-io-panel.test.mjs", // MODEL-MERGE-SESSION（2026-09-09）：defaultModel 面板键白名单 + selectModel 消息 = 写会话槽（内容字节断言——config 零写——槽播种 + digest p:m）
  "test/subagent-observe-send.test.mjs",
  "test/subagent-id-counter.test.mjs", // SUBAGENT-ID-COUNTER-AGENT（2026-09-09）：id 计数器载体 = agent 本体——压缩换线后 spawn id 仍递增 + 两池 poolMax 兜底
  "test/smoke-settings.mjs",
  "test/verify-redesign.test.mjs",
  "test/prompts-async-guidance.test.mjs", // AGENT-LOOP §7.7.1（2026-09-08）：escalate/advisor/spawn 顶层一律异步——async:false 同步引导内容断言（CLI 对拍同款）
  "test/agent-lifecycle-singleton.test.mjs", // AGENT-LOOP §11（2026-09-08）：agent 生命周期单例——resetRunState/reconcile/applySlot 映射/绑定判定
  "test/setup-reminders.test.mjs", // SESSION §11.2（2026-09-08）：env-state slot 字段 + resumed 按会话跟踪 + 注入句解耦
  "test/read-history-guard.test.mjs", // SESSION §13 D-R19a/L24（2026-09-09 BATCH-7）：行扫第一道 + 消息数第二道（50K）+ 正常回归
  "test/session-boot.test.mjs", // SESSION-FLOW-B B2（2026-09-09）：会话打开原子化——webviewReady 单向 boot（四件握手+快段全量/sessions 恰一次红线）+ resolve 零内容 + 快慢段分离（openSessionContent/status）——F-B2a~c + N2（组 ⑪⑫——评审 #2：chat-panel.test.mjs 近 500 不再追加）+ ⑬（SESSION-RESTORE-PARITY——真实形状 >200 消息 fixture 首窗 200/hasOlder + loadOlder 越页配对）
  "test/history-window.test.mjs", // SESSION-RESTORE-PARITY ①（2026-09-09）：historyWindow 直驱——turnStart 可见前驱矩阵/C reminder 剔除/B 配对（乱序全配+args 透传+无结果 null）/E reasoning ?? 兼容/F ts 三形态+idx+hasOlder/窗口跨页配对+孤儿 skip/HISTORY_PAGE_SIZE===200
  "test/history-restore.test.mjs", // SESSION-RESTORE-PARITY ③（2026-09-09）：webview DOM——applyHistoryPage 直驱（G welcome 移除/空保留/assistant 帧序 label→thinking→bubble→嵌套卡/data-idx 仅外层/工具卡 args/Error 红 open/user ts/F 缺失不显/孤儿 tool 顶层保底）
  "test/trace-store.test.mjs", // TRACE-STORE-VSC（2026-09-09）：VSC 轨迹存档同构——recordChatTrace 字段集/脱敏/fire-and-forget/seq/清理/禁用/写失败/保留边界 + per-caller 形状 + chat() 出口采集
  "test/subagent-audit-summary.test.mjs", // A2-SUMMARY-PARITY（2026-09-09）：A2 摘要对齐 CLI——auditTaskBook seam 驱动 _engTaskInput fixture——flat inline 兜底/结构化节摘/marker 缺失 (not found)/单可保留节无整书回退
  "test/read-dual-end.test.mjs", // DUAL-END-TRUNCATION F-1（2026-09-09）：read 双端——大文件头+省略注+尾 / K=0 无假注 / 重叠不重复 / ≤阈值零变化 / hashes——CLI 镜像
  "test/advisor-truncation.test.mjs", // DUAL-END-TRUNCATION F-2（2026-09-09）：advisor 截断双端化——超 64K 头尾保/中段注/offset 提示/K=0 透传——truncate.mjs 直驱——CLI 镜像（byte-identical）
  "test/config-pool.test.mjs", // POOL-CONFIG-UNIFIED（2026-09-09）：耦合锁三键 4/4/4 + advisor 读取器 + 容量拒/scope 守卫 + 白名单 + 落盘——纯单元（拒发路径——config 测试缝隔离）
  "test/config-softfail.test.mjs", // ISSUE-FIX-BATCH F-4（2026-09-09，IKCDMR）：consultModels 软失败（读面过滤 + 一次性警告——CLI 同规则双端锁步）+ 面板写路径对齐 + removeProvider 级联清理（consultModels/subagentModels/advisor.provider）
  "test/settings-panel.test.mjs", // POOL-CONFIG-UNIFIED F-4（2026-09-09）：面板三框回退显 4（agentCardHtml webview 面 + agentSettings extension 面——happy-dom）+ poolAdvisor 双语文案
  "test/provider-model-guard.test.mjs", // MODEL-400-FIX/QUICKFIX-BATCH-2（2026-09-09）+ MODEL-SELECTION（2026-09-10）：双端 guard 镜像——F-1 model 缺失可读 throw + F-2b advisor 跨渠道渠道默认单值（无则父兜底——T28）+ F-1 byName 单值/父兜底
  "test/image-downgrade.test.mjs", // IMAGE-DOWNGRADE-VISION（2026-09-09）：非视觉贴图自动降级视觉子代理——F-1 描述注入/images 清空 + F-2 fallback 三态 + AC-2 视觉零回归 + runner seam 缺省回落生产（mock 跑者/keyless 短路——零网络）
  // VSC 端镜像（2026-09-11 第 5 批 · ENGINEERING-MODE.md §2.22/§2.23——新档一律入册，否则接线没活）
  "test/batch-doc-gate.test.mjs", // batchDoc spawn 门（§2.22.3）：两路各一调用点 + 校验逻辑单份 + 角色域（T54/T55/T55b/T56）
  "test/batch-segment.test.mjs", // 批次档段写入工具 VSC 面（§2.22.5）：工具契约 + 只读面零变更 + rv 实例键不串档（T59/T60/T66）
  "test/eng-designer-role.test.mjs", // eng-designer 运行期八处（§2.22.4）：白名单/模式门/子代门/装配/枚举/场景/webview/勘察通道（T57/T57b/T57c/T58）
  "test/doc-consistency.test.mjs", // 文档一致性 V1/V2/V3 + 基线 + 接线（§2.22.6）：零新增、V1「（CLI 侧）」豁免、V3 三态零假阳（T61/T63/T64）
  // 「5 新档全入册」之第五档（面② 的锚句断言档——文件域属面②，入册归本表）
  "test/prompts-mirror-anchors.test.mjs", // 提示词双源镜像锚（§2.22.2/§2.22.7）：A1-A8/A11/A12 逐字 + 双源 15 档集合 + 端特有段（T62/T65）
]
