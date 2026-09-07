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
  "test/smoke-settings.mjs",
]
