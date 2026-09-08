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
  "test/chat-panel.test.mjs", // SESSION-FLOW-C C1+C2 host 组（2026-09-09）：turn 句柄保底/abort 启动闩/控制直通/响应器 id 匹配/atComplete seq/保序入队——F-C1a~e + ⑦ C2 忙态状态机（F-C2a）
  "test/webview-turnstate.test.mjs", // SESSION-FLOW-C C2 webview reducer 组（2026-09-09）：_turnState 枚举转换/renderStatusBar 单 writer/Stop susp 常显/_suspCounts 不陈旧——F-C2a~e（happy-dom——helpers/webview-env.mjs）
  "test/edit-tool-improvement.test.mjs",
  "test/memory-tool.test.mjs",
  "test/eng-settlement.test.mjs",
  "test/subagent-observe-send.test.mjs",
  "test/smoke-settings.mjs",
  "test/verify-redesign.test.mjs",
  "test/prompts-async-guidance.test.mjs", // AGENT-LOOP §7.7.1（2026-09-08）：escalate/advisor/spawn 顶层一律异步——async:false 同步引导内容断言（CLI 对拍同款）
  "test/agent-lifecycle-singleton.test.mjs", // AGENT-LOOP §11（2026-09-08）：agent 生命周期单例——resetRunState/reconcile/applySlot 映射/绑定判定
  "test/setup-reminders.test.mjs", // SESSION §11.2（2026-09-08）：env-state slot 字段 + resumed 按会话跟踪 + 注入句解耦
  "test/read-history-guard.test.mjs", // SESSION §13 D-R19a/L24（2026-09-09 BATCH-7）：行扫第一道 + 消息数第二道（50K）+ 正常回归
  "test/trace-store.test.mjs", // TRACE-STORE-VSC（2026-09-09）：VSC 轨迹存档同构——recordChatTrace 字段集/脱敏/fire-and-forget/seq/清理/禁用/写失败/保留边界 + per-caller 形状 + chat() 出口采集
]
