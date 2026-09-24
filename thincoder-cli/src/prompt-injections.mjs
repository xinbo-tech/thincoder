/**
 * prompt-injections.mjs — the CLI end's prompt-anchor value table.
 *
 * The core's single resolution face (`@thincoder/core/prompt-files.mjs`) owns the anchors
 * (`{{inject:<name>}}` in `thincoder-core/prompts/` + `thincoder-core/tool-docs/`); this end
 * supplies the values. The table is registered ONCE at the process entry (`bin/thincoder.mjs`)
 * — before any assembly — via `configurePromptInjections`.
 *
 * 2026-09-17 消端差：提示词面（persona / discipline / common）注入锚全消——导航注记删
 * （正文自足）、端特有段通用化并入核内正文、文档地图路径统一写死 `docs/README.md`。
 * 剩 = 工具面 2 锚（bash-terminal-face / question-ui-face——真实工具差异，待工具面 review 处置）。
 */

/** 工具面 2 锚（锚名 → 本端取值）。 */
export const CLI_PROMPT_INJECTIONS = {
  // bash 宿主终端面——CLI 无 terminal 参数（工具面 review 再统一）
  "bash-terminal-face": "",
  // question 工具可用性行（核内正文该行已移出正文、锚原位替换——本端填回 CLI 措辞）
  "question-ui-face": "- Availability: this tool needs an interactive UI — in contexts without one (headless runs) it returns an error instead of asking; subagent children (depth>0) never get it (excluded from their tool tables); put the question in your reply text instead.",
}
