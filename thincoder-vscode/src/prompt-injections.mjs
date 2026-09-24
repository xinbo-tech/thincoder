/**
 * prompt-injections.mjs — the VSC end's prompt-anchor value table.
 *
 * The core's single resolution face (`@thincoder/core/prompt-files.mjs`) owns the anchors
 * (`{{inject:<name>}}` in `thincoder-core/prompts/` + `thincoder-core/tool-docs/`); this end
 * supplies the values. The table is registered ONCE at the extension entry (`extension.mjs`
 * `activate()`, before any assembly) via `configurePromptInjections`.
 *
 * 2026-09-17 消端差：提示词面（persona / discipline / common）注入锚全消——端特有段
 * （收尾验收 / R14 池规则 / eng-coder Guidelines）通用化并入核内正文；导航注记删（正文自足）；
 * 文档地图路径统一写死 `docs/README.md`。剩 = 工具面 2 锚（bash-terminal-face /
 * question-ui-face——真实工具差异，待工具面 review 处置）。
 */

/** 工具面 2 锚（锚名 → 本端取值）。 */
export const VSC_PROMPT_INJECTIONS = {
  // bash 宿主终端面（终端两模式参数行——原 `src/tools/bash.md:15`；工具面 review 再统一）
  "bash-terminal-face": "- terminal: \"visible\" runs the command in the user's OWN visible terminal via shell integration — it inherits the user's shell state (current dir, activated venv/conda, env vars) that an isolated child process lacks. \"inject\" fills the command into the terminal WITHOUT running it — the user reviews and presses Enter (use for commands the user should inspect first). Omit for the default isolated child process.",
  // question 面板可用性行（替换位——原 `src/tools/question.md:11`）
  "question-ui-face": "- Availability: this tool renders in the chat panel (inline question card). Subagent children (depth>0) never get it — the depth>0 tool table excludes it; put the question in your reply text instead.",
}
