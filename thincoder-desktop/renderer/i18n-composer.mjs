/**
 * i18n-composer.mjs — 输入面板词族第三档（输入面板上提批 `2026-09-28-desktop-input-vsc-align.md` §2.4 Q13 ∕
 * §2.7 拆档计划「裁定②本批承接」：输入面板词键出档 —— 主档 `renderer/i18n.mjs` 现读 490 距 500 硬限余 10，
 * 直入 `HOST_DICT` 即破限）。
 *
 * 值源（逐键）：**两语皆 VSC 逐字** = `thincoder-vscode/locales/{en,zh}.json` **同名键**（同一控件同词 ——
 * 键名一字不改；核对法 = 逐键对读该两档）。消费面 = **核件 composer 组**（`thincoder-render-core/composer/`
 * 六件内取词走核 `i18n.t` —— 端侧经注册面 `setStringsSink(setStrings)` 注入，注册单点 = `renderer/app.mjs`；
 * 本档零装配逻辑，纯词表 —— 合并点仍 = `renderer/i18n.mjs` `HOST_DICT` 两语展开）。
 *
 * 分组（28 键 · 四组，按消费源档）：
 *   ① 提交面 ∕ 输入行（`panel.mjs`：placeholder 三态 + 守卫两词 + 满队 toast）六键；
 *   ② 控件行 ∕ AUTO 确认（`controls.mjs`）五键；
 *   ③ 模型 ∕ 推理两浮层（`model-menu.mjs`）九键（含 footer 三出口 —— 桌面出口映射 = 设置面，见批档 §2.2 A8）；
 *   ④ 推理档位词八键（`model-menu.mjs` `reasoning.<level>` 动态取词 —— 枚举 = 核 `specForModel().reasoningEffortEnum`
 *      闭集八值，逐值一键；值 = VSC 逐字）。
 * 不入档（列明）：`paste.unsupportedFormat`（B9 非栅格拒 —— 已在 `renderer/i18n-views.mjs`）·
 *   `msg.user` ∕ `queued.pending`（核 `queued-mark` 取词 —— 已在主档 HOST_DICT）·
 *   `composer.send.failed` ∕ `composer.attach.nonvision` ∕ `composer.attach.partial`（B21 ∕ B22 两保留行 —— 端侧
 *   自有词，已在 `i18n-views.mjs` ∕ 主档）。
 * 两语键集须相等（增键两语同增、禁单语落键）；零落盘 · 零 `node:` / 零裸包（渲染面静态闭包判据）。
 */
export const COMPOSER_DICT = Object.freeze({
  en: {
    // ── ① 输入行 ∕ 提交面（`panel.mjs`）──
    "input.placeholder": "Ask ThinCoder... (Shift+Enter for new line)",
    "input.busyPlaceholder": "Main session busy — Enter submit is restricted — you can keep typing",
    "input.slotFull": "Task running — the queue is full (8 messages); wait for them to be processed before submitting again.",
    "input.interruptPlaceholder": "Interrupt — inject a message… (Enter to send, Esc to cancel)",
    "workspace.required": "Open a folder first — ThinCoder needs a workspace to work in.",
    "workspace.requiredPlaceholder": "Open a folder to start…",
    // ── ② 控件行 ∕ AUTO 内联确认（`controls.mjs`）──
    "toolbar.autoApprove": "Auto-approve tools",
    "toolbar.planDisabled": "Disabled in engineering mode — engineering already runs design-before-code",
    "auto.confirmText": "AUTO mode executes ALL tool calls — including file writes and shell commands — without asking for approval.",
    "auto.enable": "⚠ Enable AUTO",
    "auto.cancel": "Cancel",
    // ── ③ 模型 ∕ 推理两浮层（`model-menu.mjs`）──
    "model.loading": "Loading models…",
    "model.filterPlaceholder": "Filter models…",
    "model.noMatch": "No models match",
    "model.reasoning": "Reasoning",
    "model.noReasoning": "No reasoning",
    "model.noReasoningDesc": "Off (not supported)",
    "model.addProvider": "+ Add provider…",
    "model.removeProvider": "− Remove provider…",
    "model.setKey": "Key…",
    // ── ④ 推理档位词（`reasoning.<level>` 八值闭集）──
    "reasoning.max": "Maximum",
    "reasoning.xhigh": "Extra High",
    "reasoning.high": "High",
    "reasoning.medium": "Medium",
    "reasoning.low": "Low",
    "reasoning.minimal": "Minimal",
    "reasoning.none": "Off",
    "reasoning.enabled": "Reasoning",
  },
  zh: {
    // ── ① 输入行 ∕ 提交面 ──
    "input.placeholder": "向 ThinCoder 提问...（Shift+Enter 换行）",
    "input.busyPlaceholder": "主会话处理中——Enter 提交受限——可继续输入",
    "input.slotFull": "主会话处理中——排队已满 8 条消息，请等其处理完成后再发送",
    "input.interruptPlaceholder": "中断 — 注入消息…（Enter 发送，Esc 取消）",
    "workspace.required": "请先打开文件夹——ThinCoder 需要一个工作区才能开工。",
    "workspace.requiredPlaceholder": "请先打开文件夹…",
    // ── ② 控件行 ∕ AUTO 内联确认 ──
    "toolbar.autoApprove": "自动批准工具",
    "toolbar.planDisabled": "工程模式下禁用——工程模式本身即先设计后编码",
    "auto.confirmText": "AUTO 模式将执行所有工具调用——包括文件写入和 Shell 命令——不再逐一确认。",
    "auto.enable": "⚠ 启用 AUTO",
    "auto.cancel": "取消",
    // ── ③ 模型 ∕ 推理两浮层 ──
    "model.loading": "加载模型…",
    "model.filterPlaceholder": "过滤模型…",
    "model.noMatch": "没有匹配的模型",
    "model.reasoning": "推理深度",
    "model.noReasoning": "不支持推理",
    "model.noReasoningDesc": "关闭（不支持）",
    "model.addProvider": "+ 添加 provider…",
    "model.removeProvider": "− 移除 provider…",
    "model.setKey": "设置密钥…",
    // ── ④ 推理档位词 ──
    "reasoning.max": "最大",
    "reasoning.xhigh": "很高",
    "reasoning.high": "高",
    "reasoning.medium": "中",
    "reasoning.low": "低",
    "reasoning.minimal": "最小",
    "reasoning.none": "关闭",
    "reasoning.enabled": "推理",
  },
})
