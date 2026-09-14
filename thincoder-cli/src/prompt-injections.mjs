/**
 * prompt-injections.mjs — the CLI end's prompt-anchor value table (CORE-UNIFICATION §2.13.2
 * 「CLI 列」13 名 · U2 接线).
 *
 * The core's single resolution face (`@thincoder/core/prompt-files.mjs`) owns the anchors
 * (`{{inject:<name>}}` in `thincoder-core/prompts/` + `thincoder-core/tool-docs/`); this end
 * supplies the values. The table is registered ONCE at the process entry (`bin/thincoder.mjs`)
 * — before any assembly — via `configurePromptInjections`（§2.13.8（六）；禁止在别处零散配置）。
 *
 * 取值 = S0b 已裁「CLI 列」（§2.13.2 表）：整条跨端指针 / 端特有段 / **显式空串**
 * （空串 = 显式「本端为空」，不是省略）。本表 = 迁移前 CLI 侧原文的唯一留存面
 * （对应档 `src/prompts/*.md` + `src/tools/*.md` 已随 U2 删除）。
 */

/** §2.13.2「CLI 列」13 名（锚名 → 本端取值）。 */
export const CLI_PROMPT_INJECTIONS = {
  // 文档地图根（`docs/{{inject:doc-map-path}}README.md` ⇒ `docs/README.md`）
  "doc-map-path": "",
  // agent-loop 指针族（整条跨端指针——节号已并入值）
  "agent-loop-ptr-async-note": "AGENT-LOOP.md §11.2",
  "agent-loop-ptr-async-spawn": "AGENT-LOOP.md §18",
  "agent-loop-ptr-escalate": "AGENT-LOOP §25",
  "agent-loop-ptr-eng-coder-delivery": "AGENT-LOOP.md §18",
  "agent-loop-ptr-engineering-delivery": "AGENT-LOOP.md §18",
  // 端特有段（CLI 无 ⇒ 空串）
  "discipline-normal-finish": "",
  "discipline-engineering-vsc-r14-pools": "",
  "eng-coder-guidelines": "",
  "bash-terminal-face": "",
  // 会诊终止口径（CLI 侧原文两句——前态 `src/prompts/discipline-normal.md:183-184`）
  "discipline-normal-consult-stop": "Consultations are cross-turn background work: a consultation started in this turn keeps running after the turn ends (like async subagents) and its verdict digest is delivered automatically — no polling, no turn-scoped cleanup.\nOnly a full user stop (Ctrl+C / session abort) terminates them — a Ctrl+I interrupt does not.",
  // 改动面反查节（CLI 侧原文——前态 `src/prompts/discipline-engineering.md:128-130`）
  "discipline-engineering-change-surface-probe": "## 改动面反查（文档影响面）\n\n本批实施轮开工前跑本仓反查脚本（文档影响面；基准 = 上一批收口点）——其输出的设计/需求档建议一并录入本批「受影响文件」表。",
  // question 工具可用性行（核内正文该行已移出正文、锚原位替换——本端填回 CLI 措辞）
  "question-ui-face": "- Availability: this tool needs an interactive UI — in contexts without one (headless runs, subagent children) it returns an error instead of asking; put the question in your reply text instead.",
}
