/**
 * files.mjs — 测试清单单一来源（npm test 快层与 test:full 全量共用）。
 *
 * 2026-09-07 大规模清理：从 68 项收敛为真实冒烟/核心行为集（原锚/时序/UI/内部细节
 * 测试全部删除——AI 提示词锚测试与内部实现锁属于过度工程，见 METHODOLOGY 铁律）。
 * 新增测试文件：在此登记。
 */
export default [
  "test/agent-core.test.mjs",
  "test/config-io.test.mjs",
  "test/execute.test.mjs",
  "test/git.test.mjs",
  "test/provider.test.mjs",
  "test/chat-panel.test.mjs",
  "test/edit-eol.test.mjs",
  "test/edit-semantics.test.mjs",
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
