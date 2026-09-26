/** 测试清单（显式 · 单源）：登记 = 会被执行；盘上未登记 = `test/run.mjs` 反查即失败（永不静默漏收集）。 */
export default [
  "test/host-floor.test.mjs", "test/guard-closure.test.mjs",
  "test/agent-host.test.mjs", "test/events-reduce.test.mjs", "test/history-page.test.mjs", "test/session-io.test.mjs",
  "test/session-contract.test.mjs", "test/projects.test.mjs", "test/store.test.mjs",
  "test/views.test.mjs", "test/views-tabbar.test.mjs", "test/views-chrome.test.mjs",
  "test/views-locks.test.mjs",
  "test/views-chat.test.mjs", "test/views-chat-frame.test.mjs", "test/views-chat-scroll.test.mjs",
  "test/views-approval.test.mjs", "test/views-activity.test.mjs", "test/events-page.test.mjs",
  "test/settings.test.mjs", "test/providers.test.mjs", "test/mcp-servers.test.mjs", "test/project-info.test.mjs",
  "test/views-settings.test.mjs", "test/views-onboarding.test.mjs",
]
