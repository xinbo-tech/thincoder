/**
 * prompt-injections.mjs — the VSC end's prompt-anchor value table (CORE-UNIFICATION §2.13.2
 * 「VSC 列」13 名 · W2 接线).
 *
 * The core's single resolution face (`@thincoder/core/prompt-files.mjs`) owns the anchors
 * (`{{inject:<name>}}` in `thincoder-core/prompts/` + `thincoder-core/tool-docs/`); this end
 * supplies the values. The table is registered ONCE at the extension entry (`extension.mjs`
 * `activate()`, before any assembly) via `configurePromptInjections`（§2.13.8（六）；禁止别处零散配置）。
 *
 * 取值 = §2.13.2「VSC 列」：整条跨端指针（`agent-loop-ptr-*`——§2.13.2 收正注的节号收正版；
 * 相邻端说明括注并入同锚值，见 §2.13.2 表后登记）· 端特有段（VSC 独有——核内无）· **显式空串**
 * （空串 = 显式「本端为空」，不是省略）。本表 = 迁移前 VSC 侧原文的唯一留存面
 * （对应档 `src/prompts/*.md` + `src/tools/*.md` 已随 W2 删除）。
 *
 * 去重口径（§2.13.6 缺口 3 定稿 = 「锚只承载 VSC 独有、核内无的部分」）：`discipline-normal-finish`
 * 不含核内三行；`eng-coder-guidelines` 不含核内 persona-eng-coder 已逐字承载的两项
 * （「Write code one file at a time …」/「Out-of-file-list changes …」——S1 融合时已提为两端共享正文）。
 */

/** §2.13.2「VSC 列」13 名（锚名 → 本端取值）。 */
export const VSC_PROMPT_INJECTIONS = {
  // 文档地图根（`docs/{{inject:doc-map-path}}README.md` ⇒ `docs/design/README.md`）
  "doc-map-path": "design/",
  // agent-loop 指针族（整条跨端指针——节号已并入值；尾注 = 本端原文端说明括注·同锚值）
  "agent-loop-ptr-async-note": "AGENT-LOOP（CLI 仓·设计）§11.2（该节号 = CLI 侧；本端对应节 = §9 会诊/飞刀/advisor 异步化）",
  "agent-loop-ptr-async-spawn": "AGENT-LOOP（CLI 仓·设计）§7.3（本端交付协议节 = §8）",
  "agent-loop-ptr-escalate": "AGENT-LOOP（CLI 仓·设计）§14.2（本端异步化节 = §9）",
  "agent-loop-ptr-eng-coder-delivery": "AGENT-LOOP（CLI 仓·设计）§8（本端交付协议节 = §8）",
  "agent-loop-ptr-engineering-delivery": "AGENT-LOOP（CLI 仓·设计）§8（本端交付协议节 = §8）",
  // 端特有段（VSC 无对应段 ⇒ 空串——CLI 侧承载）
  "discipline-normal-consult-stop": "",
  "discipline-engineering-change-surface-probe": "",
  // 收尾验收节（VSC 侧独有 = 节标题 + 引导行；核内三行内容不注入——缺口 3 定稿）
  "discipline-normal-finish": "## 收尾验收\n**How you finish (收尾节——main.md 迁入):**",
  // R14 池规则节（VSC engineering.md 独有——原 `src/prompts/discipline-engineering.md:262-265`）
  "discipline-engineering-vsc-r14-pools": [
    "### VSC 端特有段：R14 池规则（per-role-domain pools——VSC engineering.md 独有——原地保留）",
    "§11.1 R14 (per-role-domain pools): the async pool capacity is per domain — eng-coder pool 4, explore/plan/coder (other roles) pool 4 —",
    "a domain never queues behind the other, so concurrent eng-coders plus concurrent other-role spawns can total 8;",
    "`agent.poolLimits = { engCoder, other, advisor }` overrides both subagent domains (invalid values fall back to 4/4; the advisor key is read by the advisor pool — default 4).",
  ].join("\n"),
  // eng-coder Guidelines 块（VSC 独有——原 `src/prompts/persona-eng-coder.md:34-51`；已剔除核内已承载两行）
  "eng-coder-guidelines": [
    "## Guidelines - Work independently. The parent only sees your final report.",
    "- Follow the design document. If you find issues during implementation, note them — do not silently deviate.",
    "- **Implement to the full design — no silent degradation.** If a stated design element (interaction, behavior, edge case, state) feels costly or fiddly to implement, implement it anyway and note the cost in your report. A \"simpler approximation\" of a specified behavior IS a deviation: either implement it as designed, or stop and surface the trade-off to the parent BEFORE coding — never ship a reduced version and disclose it afterwards. Disclosed after the fact is still a broken delivery: the parent approved the design, not your discount.",
    "- UI/interaction: implement exactly what the task brief and design doc state (layout, flows, control behavior, states, feedback). If an interface decision the task implies is missing from both, stop and report the gap — do not invent your own interaction design.",
    "- If the task is ambiguous, note the ambiguity in your report; do not ask the user. Before finishing, do a final review:",
    "1. Verify every acceptance criterion from the design",
    "2. Confirm every out-of-list change (if any) is reported with its reason in the delivery report",
    "3. Run relevant tests — confirm all pass",
    "4. Read every file you changed — catch leftover debug code, stale comments, or incomplete edits",
    "5. Check that comments and docstrings match what the code actually does",
    "6. Report any design-doc drift your diff touches (module map / affected-files table) in your delivery report — do not edit design docs yourself; they are authored by eng-designer.",
    "Your last message IS the report the parent sees — make it complete:",
    "1. What you changed and why",
    "2. The path of every file you touched",
    "3. How you verified (tests run, commands executed, with results)",
    "4. Any deviations from the design or items worth follow-up Tool permissions: when you see \"permission denied by user\" for a tool, the parent has not granted that tool. Describe the needed changes in your report so the parent can handle them.",
  ].join("\n"),
  // bash 宿主终端面（终端两模式参数行——原 `src/tools/bash.md:15`）
  "bash-terminal-face": "- terminal: \"visible\" runs the command in the user's OWN visible terminal via shell integration — it inherits the user's shell state (current dir, activated venv/conda, env vars) that an isolated child process lacks. \"inject\" fills the command into the terminal WITHOUT running it — the user reviews and presses Enter (use for commands the user should inspect first). Omit for the default isolated child process.",
  // question 面板可用性行（替换位——原 `src/tools/question.md:11`）
  "question-ui-face": "- Availability: this tool renders in the chat panel (inline question card). Subagents (depth>0) never get it — put the question in your reply text instead.",
}
