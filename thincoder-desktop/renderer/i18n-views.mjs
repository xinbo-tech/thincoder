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
 * （`views/settings-sections.mjs` —— 具名控件十键）；⑤ 会话控制面（`renderer/mount-sessions.mjs` —— 会话模型轮 R13
 * 五键：选择器可及名 ∕ 空态 ∕ 改名 · 删除两控件 ∕ 删除确认句 —— **值逐字同 VSC 同名键**）；
 * ⑥ **核卡族（「桌面处理流 · VSC 对齐」批 R1）**：核包 `cards/{permission,question,panel}.mjs` 内取词键
 * —— 消费面 = 核卡（经注册面投影入核 i18n），**值逐字同 VSC locales**（`thincoder-vscode/locales/*` 同名键）；
 * ⑦ **工具与服务段（R2 · 桌面功能对位批）**：`views/settings-sections-tools.mjs` 取词（段名 / 索引族名 /
 * 态词三 / 钮标二）—— 值逐字同 VSC locales（段名键 = 端侧键名 `settings.section.tools`，值取 VSC
 * `settings.toolsSection`；余键 = VSC 同名键逐字）；
 * ⑧ **核件搜索面（R6 · 桌面功能对位批）**：核 `search.mjs` 取词五键（占位 ∕ 上一跳 ∕ 下一跳 ∕ 关闭 ∕ 无匹配）
 * —— 键名与两语值皆 VSC `locales/{en,zh}.json:254-258` 逐字。
 * ⑨ **状态文本段 index 两形（R4 · 桌面功能对位批）**：`renderer/views/statusline-segments.mjs` 取词（index kind 两相位
 * —— 表外四 kind 与压缩四态 = 核字典经 `t()` 投影直取，零新键）；键名与两语值皆 VSC `locales/{en,zh}.json:218-219` 逐字。
 * 两语键集须相等（增键两语同增、禁单语落键）。
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
    // 排队期「待发送块」（收正轮 B12 新口径 · 参照 CLI `TUI.md` §7.5 逐字对位 —— 提示行 ⏳ + 不打断当前执行）
    "chat.pending.single": "⏳ Queued · Won't interrupt the current run — sent automatically",
    "chat.pending.multi": "⏳ Queued · ${count} messages (won't interrupt the current run, sent together)",
    "chat.pending.more": "… [${lines} lines — shown in full once sent]",
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
    // ── ⑤ 会话控制面（会话模型轮 R13 —— 键名与两语值皆 VSC 逐字：`thincoder-vscode/locales/en.json:2-7` 同名键）──
    "session.title": "Session",
    "session.empty": "No sessions",
    "session.rename": "Rename",
    "session.delete": "Delete",
    "session.deleteConfirm": "Delete session \"${title}\"? This cannot be undone.",
    // ── ⑥ 核卡族（R1 直消费 —— 核包取词；值逐字同 VSC `locales/en.json` 同名键）──
    "perm.wantsTo": "ThinCoder wants to run",
    "perm.approve": "Approve",
    "perm.approveAll": "Approve All",
    "perm.deny": "Deny",
    "perm.viewInEditor": "View in editor",
    "perm.batch.wantsTo": "ThinCoder wants to run ${count} tools: ${names}",
    "perm.batch.oneByOne": "One by One",
    "question.label": "Question",
    "question.mark": "❯",
    "question.submit": "Send",
    "question.customPlaceholder": "Or type your own answer…",
    "question.placeholder": "Type your answer…",
    "panel.taskDesc": "Agent tracks multi-step work here — created and updated automatically",
    "panel.goalDesc": "Long-running objective — runs until complete or cancelled",
    "goal.objective": "Objective",
    // ── ⑦ 工具与服务段（R2 · 桌面功能对位批 —— 段名值 = VSC `settings.toolsSection`；余键逐字同 VSC 同名键）──
    "settings.section.tools": "Tools & Services",
    "settings.indexSection": "Semantic Index",
    "settings.indexBuild": "Build Index",
    "settings.indexRebuild": "Rebuild Index",
    "settings.indexBuilding": "Building…",
    "settings.indexBuilt": "✓ Index built: ${files} files, ${chunks} chunks",
    "settings.indexNotBuilt": "Index not built. Vector search is inactive.",
    // ── ⑧ 核件搜索面（R6 —— 核 `search.mjs` 取词键；键名与两语值皆 VSC 逐字：`thincoder-vscode/locales/en.json:254-258`）──
    "search.placeholder": "Search messages…",
    "search.prev": "Previous match",
    "search.next": "Next match",
    "search.close": "Close search",
    "search.noMatch": "No matches",
    // ── ⑨ 状态文本段 index 两形（R4 · 桌面功能对位批 —— 键名与值皆 VSC `locales/en.json:218-219` 逐字）──
    "status.indexScan": "Indexing: scanning ${n} files…",
    "status.indexProgress": "Indexing: ${done}/${total}…",
  },
  zh: {
    // ── ① 对话流 ──
    "tool.interrupted": "已中断",
    "error.retry": "重试",
    "welcome.heading": "欢迎使用 ThinCoder",
    "welcome.text": "选择一个 provider 并填入 API key，即可开始使用。",
    "welcome.textConfigured": "就此工作区提问——agent 可以读取文件、运行命令、修改代码。",
    "welcome.shortcuts": "Enter 发送 · Shift+Enter 换行",
    // 排队期「待发送块」（逐字 = CLI `render-conversation.mjs:370-371` / `:383`）
    "chat.pending.single": "⏳ 待发送 · 不打断当前执行，自动发送",
    "chat.pending.multi": "⏳ 待发送 · ${count} 条消息（不打断当前执行，合并发送）",
    "chat.pending.more": "… [该条共 ${lines} 行——发送后完整显示]",
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
    // ── ⑤ 会话控制面（会话模型轮 R13 —— 键名与两语值皆 VSC 逐字：`thincoder-vscode/locales/zh.json:2-7` 同名键）──
    "session.title": "会话",
    "session.empty": "暂无会话",
    "session.rename": "重命名",
    "session.delete": "删除",
    "session.deleteConfirm": "确定删除会话 \"${title}\"？此操作不可恢复。",
    // ── ⑥ 核卡族（R1 直消费 —— 值逐字同 VSC `locales/zh.json` 同名键）──
    "perm.wantsTo": "ThinCoder 想要执行",
    "perm.approve": "批准",
    "perm.approveAll": "全部批准",
    "perm.deny": "拒绝",
    "perm.viewInEditor": "在编辑器中查看",
    "perm.batch.wantsTo": "ThinCoder 想要执行 ${count} 个工具：${names}",
    "perm.batch.oneByOne": "逐个确认",
    "question.label": "提问",
    "question.mark": "❯",
    "question.submit": "发送",
    "question.customPlaceholder": "或输入你自己的回答…",
    "question.placeholder": "输入你的回答…",
    "panel.taskDesc": "Agent 在此跟踪多步骤任务 — 自动创建和更新",
    "panel.goalDesc": "长期目标 — 持续运行直到完成或取消",
    "goal.objective": "目标",
    // ── ⑦ 工具与服务段（R2 · 桌面功能对位批 —— 逐字同 VSC `locales/zh.json`；段名值 = `settings.toolsSection`）──
    "settings.section.tools": "工具与服务",
    "settings.indexSection": "语义索引",
    "settings.indexBuild": "构建索引",
    "settings.indexRebuild": "重新构建",
    "settings.indexBuilding": "构建中…",
    "settings.indexBuilt": "✓ 索引已构建：${files} 个文件，${chunks} 个块",
    "settings.indexNotBuilt": "索引未构建，向量搜索未启用。",
    // ── ⑧ 核件搜索面（R6 —— 核 `search.mjs` 取词键；键名与两语值皆 VSC 逐字：`thincoder-vscode/locales/zh.json:254-258`）──
    "search.placeholder": "搜索消息…",
    "search.prev": "上一个匹配",
    "search.next": "下一个匹配",
    "search.close": "关闭搜索",
    "search.noMatch": "无匹配",
    // ── ⑨ 状态文本段 index 两形（R4 · 桌面功能对位批 —— 键名与值皆 VSC `locales/zh.json:218-219` 逐字）──
    "status.indexScan": "索引：扫描 ${n} 文件…",
    "status.indexProgress": "索引：${done}/${total}…",
  },
})
