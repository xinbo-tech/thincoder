/** 测试清单（显式 · 单源）：登记 = 会被执行；盘上未登记 = `test/run.mjs` 反查即失败（永不静默漏收集）。 */
export default [
  "test/host-floor.test.mjs", "test/guard-closure.test.mjs",
  "test/agent-host.test.mjs", "test/agent-host-suspension.test.mjs", "test/agent-host-question.test.mjs", "test/agent-host-subagent.test.mjs", "test/events-reduce.test.mjs",
  "test/events-subagent.test.mjs", "test/agent-bridge-subagent.test.mjs", "test/file-links.test.mjs",
  "test/history-page.test.mjs", "test/session-io.test.mjs",
  "test/session-prefs.test.mjs", "test/agent-host-usage.test.mjs",
  "test/session-contract.test.mjs", "test/projects.test.mjs", "test/store.test.mjs",
  "test/views.test.mjs", "test/views-rail-actions.test.mjs", "test/views-tabbar.test.mjs", "test/views-tabbar-close.test.mjs", "test/views-chrome.test.mjs",
  "test/views-chrome-vocab.test.mjs",
  "test/views-head.test.mjs",
  "test/views-locks.test.mjs",
  "test/views-chat.test.mjs", "test/views-chat-text.test.mjs", "test/views-chat-frame.test.mjs", "test/views-chat-scroll.test.mjs", "test/views-chat-guide.test.mjs",
  "test/views-statusline.test.mjs",
  "test/views-approval.test.mjs", "test/views-activity.test.mjs", "test/events-page.test.mjs",
  "test/views-question.test.mjs",
  "test/settings.test.mjs", "test/providers.test.mjs", "test/mcp-servers.test.mjs", "test/project-info.test.mjs",
  "test/views-settings.test.mjs", "test/views-settings-agent.test.mjs", "test/views-onboarding.test.mjs",
  "test/views-attach.test.mjs", "test/attachments.test.mjs",
  "test/heartbeat.test.mjs", // 「对齐第三批」P7 2s 拍（首个渲染面定时器 —— 假钟 + 清点）
  "test/integration/settings-panel.test.mjs", "test/integration/first-run-smoke.test.mjs", "test/integration/chat-render.test.mjs",
  "test/integration/session-open.test.mjs", "test/integration/statusline-align.test.mjs", "test/integration/ledger-notice.test.mjs",
  "test/integration/align3-face.test.mjs", // 「对齐第三批」小修族（T-DSK42 / T-DSK43 —— 离线可产面 + 不可产面登记）
]
