/**
 * prompt-injections.mjs — 桌面端提示锚取值表（R4 · 桌面功能对位批 · 台账 #519）。
 *
 * 核单源（`@thincoder/core` `prompt-files.mjs`「锚替换原语」）持两枚锚（`tool-docs/bash.md:15` ∕
 * `tool-docs/question.md:11` 的核锚文法位）；本表供值。注册 = **进程入口一次、任何装配之前**
 * （`src/main/main.mjs`）—— 先例 = CLI `bin/thincoder.mjs:32` ∕ VSC `extension.mjs:92`（`activate()` 内）；
 * 漏配 ⇒ 锚字面静默进模型工具描述（核缝「缺键 ⇒ 抛」只在已配置表上生效）。
 *
 * 两锚取值（语义要件 = 批档 §2.4 R4 #1；字面 = 取现档两表 —— CLI 表字面 ∕ VSC 表字面，逐字）：
 *   - `bash-terminal-face`：桌面**无可见终端**（`bash` 工具 = 核缺省隔离子进程，无 `terminal` 参数）
 *     ⇒ 类 CLI 语义 ⇒ CLI 表字面（**空串**——核档该行原位留空，同 CLI 现行为）。
 *   - `question-ui-face`：桌面**有流内问题卡**（`renderer/views/question.mjs` + `question:respond` 作答通道）
 *     ⇒ 类 VSC 语义 ⇒ VSC 表字面逐字（`thincoder-vscode/src/prompt-injections.mjs:20`）。
 *
 * 零宿主依赖（纯取值表）；表形态 = `{ "<锚名>": "<替换文本>" }`（值可为空串——空串 = 显式「本端为空」）。
 */
export const DESKTOP_PROMPT_INJECTIONS = {
  // bash 宿主终端面——桌面无终端参数（核缺省隔离子进程）
  "bash-terminal-face": "",
  // question 面板可用性行（替换位——有流内问题卡；子代理 depth>0 工具表不含该工具）
  "question-ui-face": "- Availability: this tool renders in the chat panel (inline question card). Subagent children (depth>0) never get it — the depth>0 tool table excludes it; put the question in your reply text instead.",
}
