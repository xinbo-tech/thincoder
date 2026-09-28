/** 测试清单（显式 · 单源）：登记 = 会被执行；盘上未登记 = `test/run.mjs` 反查即失败（永不静默漏收集）。 */
export default [
  "test/host-floor.test.mjs", "test/guard-closure.test.mjs",
  "test/agent-host.test.mjs", "test/agent-host-suspension.test.mjs", "test/agent-host-question.test.mjs", "test/agent-host-subagent.test.mjs", "test/agent-host-queued.test.mjs", // 末项 = 「回合中插入」排队面用例（U217–U219 —— 自 `agent-host.test.mjs` 拆出；假面住 `agent-host-harness.mjs`）
  "test/events-flags.test.mjs", // U234 模式位归约面宿主档（自 events 归约族出档 —— 该档加该用例后越 500 行硬限）
  "test/file-links.test.mjs",
  "test/history-page.test.mjs", "test/session-io.test.mjs",
  "test/session-prefs.test.mjs", "test/agent-host-usage.test.mjs", "test/agent-host-flags.test.mjs", // 末项 = R1 输入面板移植宿主面（`session:flags` ∕ `at:complete` —— U227–U233）
  "test/session-contract.test.mjs", "test/projects.test.mjs",
  "test/views.test.mjs", "test/views-rail-actions.test.mjs", "test/views-session-control.test.mjs", "test/views-chrome.test.mjs",
  "test/views-chrome-vocab.test.mjs", // 会话模型轮 R13 新档 = `views-session-control.test.mjs`（会话控制面挂载与交互 —— 下拉开合 / 条目面 / 三出口出站载荷 / 重挂保态 / 裁撤面零残留负控）
  "test/views-head.test.mjs",
  "test/views-locks.test.mjs",
  "test/views-chat.test.mjs", "test/views-chat-frame.test.mjs", "test/views-chat-guide.test.mjs",
  "test/views-statusline.test.mjs",
  "test/views-approval.test.mjs", "test/views-activity.test.mjs", "test/events-page.test.mjs",
  "test/views-question.test.mjs",
  "test/settings.test.mjs", "test/providers.test.mjs", "test/mcp-servers.test.mjs", "test/project-info.test.mjs",
  "test/views-settings.test.mjs", "test/views-settings-agent.test.mjs", "test/views-onboarding.test.mjs",
  "test/attachments.test.mjs",
  "test/heartbeat.test.mjs", // 「对齐第三批」P7 2s 拍（首个渲染面定时器 —— 假钟 + 清点）
  "test/timer-wake.test.mjs", "test/queued-input.test.mjs", // 前 = timer-wake 阶段 2（T-TW17–T-TW21 + 渲染面随动组——桌面面）· 后 = 「回合中插入」宿主排队面（U214–U215）
  "test/integration/settings-panel.test.mjs", "test/integration/first-run-smoke.test.mjs", "test/integration/chat-render.test.mjs",
  "test/integration/session-open.test.mjs", "test/integration/statusline-align.test.mjs", "test/integration/ledger-notice.test.mjs",
  "test/integration/align3-face.test.mjs", "test/integration/midturn-input.test.mjs", // 「对齐第三批」小修族（T-DSK42 / T-DSK43 · 离线可产面 + 不可产面登记）· 「回合中插入」（T-DSK45 —— `ev:queue` 两形离线可产面 + 真回合不可产面登记）
  "test/integration/input-echo-converge.test.mjs", // R1 输入面板移植 · 出泡收敛（T-DSK46 —— 真 Electron + 假 provider：直发 ∕ 真忙态 ∕ 正径滞后 ∕ 反径滞后四径）
  "test/integration/input-parity-settled.test.mjs", // R1 输入面板移植 · 落定态（T-DSK47 —— 真 Electron + 假 provider：慢流中插 + 续发 ⇒ 忙位 ∕ `msgs` 计数 ∕ 输入可用 ∕ 队空四断言；负控 = 断终局事件判红）
]
