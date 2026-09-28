/**
 * i18n-views.mjs — 视图面词族第二档（「对齐第三批 · 小修族」新增词键 —— 在册拆分类：`renderer/i18n.mjs`
 * 词表面按视图面拆出本档，硬限消解 = 两档均 ≪500；机制 / 判据单源 = `docs/desktop/design/UI.md` §1
 * 「本批注（对齐第三批 · 小修族）」；**合并点 = `renderer/i18n.mjs` `HOST_DICT` 两语展开**——单一装配点仍
 * = `initDict`（本档零装配逻辑，纯词表）。
 *
 * 值源（逐键）：zh = CLI 逐字 ∕ en = VSC 逐字（`thincoder-vscode/locales/{en,zh}.json` —— **键名两形**：
 *  `welcome.*` / `tool.interrupted` / `error.retry` 一族 = 同名键〔同一控件同词〕；设置面十键 = **端侧键名**
 * （`settings.agent.*`）而**值**逐字同 VSC 对应键）；核 / VSC 两源皆无此键者 = 本端拟定（本地键位 / 本端提示面），
 *  键名与两语句面登记处即本档。
 * 分组（按消费视图面）：① 对话流（`views/chat-tool.mjs` · `views/chat.mjs` · `views/chat-guide.mjs`）；
 * ② 输入区（`mount-composer.mjs` · `attach.mjs`）；③ 审批面（`views/approval.mjs`）；④ 设置面
 * （`views/settings-sections.mjs` —— 具名控件十键）。两语键集须相等（增键两语同增、禁单语落键）。
 * 零落盘 · 零 `node:` / 零裸包（渲染面静态闭包判据）。
 */
export const VIEWS_DICT = Object.freeze({
  en: {
    // ── ① 对话流（项 5 中止清扫 / 项 9 错误横幅重试 / 项 15 欢迎条三行）──
    "tool.interrupted": "interrupted",
    "error.retry": "Retry",
    "welcome.heading": "Welcome to ThinCoder",
    "welcome.text": "Choose a provider and enter its API key to get started.",
    "welcome.textConfigured": "Ask about this workspace — the agent can read files, run commands, and edit code.",
    // 端差登记：VSC 行含 `@` 文件引用段（桌面 @-补全 = 缺整面族）⇒ 本端键位行只取真有之键。
    "welcome.shortcuts": "Enter to send · Shift+Enter for newline",
    // ── ② 输入区（P26 发送失败 / P22 非栅格粘贴拒——`:${type}` 值逐字同 VSC）──
    "composer.send.failed": "Send failed (${reason}) — the text was kept",
    "paste.unsupportedFormat": "Only png / jpg / gif / webp images are supported (got ${type})",
    // ── ③ 审批面（相抵① 超阈降级 = 摘要 + 计数，零外部查看器）──
    "approval.diff.large": "Large diff — ${n} lines (preview omitted)",
    // ── ④ 设置面 · agent 具名控件十键（P15——标签值同 VSC `settings.*` 同名键）──
    "settings.agent.maxTurns": "Max Turns",
    "settings.agent.subagentTurns": "Subagent Turns",
    "settings.agent.poolLimits.engCoder": "Eng-coder Pool",
    "settings.agent.poolLimits.other": "Other Roles Pool",
    "settings.agent.poolLimits.advisor": "Advisor Review Pool",
    "settings.agent.compactThreshold": "Compact Threshold (empty = auto)",
    "settings.agent.verifyGuard": "Verify Guard (push to verify before finishing)",
    "settings.agent.consultTurns": "Turn limit",
    "settings.agent.consultTimeoutMs": "Timeout (minutes)",
    "settings.agent.advisorEffort": "Review effort",
  },
  zh: {
    // ── ① 对话流 ──
    "tool.interrupted": "已中断",
    "error.retry": "重试",
    "welcome.heading": "欢迎使用 ThinCoder",
    "welcome.text": "选择一个 provider 并填入 API key，即可开始使用。",
    "welcome.textConfigured": "就此工作区提问——agent 可以读取文件、运行命令、修改代码。",
    "welcome.shortcuts": "Enter 发送 · Shift+Enter 换行",
    // ── ② 输入区 ──
    "composer.send.failed": "发送失败（${reason}）——文本已保留",
    "paste.unsupportedFormat": "仅支持 png / jpg / gif / webp 图片（收到 ${type}）",
    // ── ③ 审批面 ──
    "approval.diff.large": "改动较大——${n} 行（预览省略）",
    // ── ④ 设置面 · agent 具名控件十键 ──
    "settings.agent.maxTurns": "最大轮次",
    "settings.agent.subagentTurns": "子代理轮次",
    "settings.agent.poolLimits.engCoder": "Eng-coder 并发池",
    "settings.agent.poolLimits.other": "其他角色并发池",
    "settings.agent.poolLimits.advisor": "advisor 评审池",
    "settings.agent.compactThreshold": "压缩阈值（留空 = 自动）",
    "settings.agent.verifyGuard": "Verify 守卫（完成前回推 verify）",
    "settings.agent.consultTurns": "轮数上限",
    "settings.agent.consultTimeoutMs": "超时（分钟）",
    "settings.agent.advisorEffort": "审查强度",
  },
})
