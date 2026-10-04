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
 * question-ui-face）。
 *
 * bash-executor-face 批（台账 #922）：`bash-terminal-face` = **执行器声明行 + 既有 terminal
 * 参数行**两段拼接（K6——执行器行三端共用；terminal 参数语义 = VSC 宿主能力面保留原文）。
 * 执行器行 = 核心单源 `resolveShellIdentity`（spawn 同链探测 + memo 按配置值键控；配置读法 =
 * 核 `loadConfig` 同源——`src/extension/settings.mjs` 既有 import 面；端侧零探测逻辑）。
 * 求值形态 = **import 期求值**（端装配层求值路径——核心缝为纯字符串替换、不支持函数值键）。
 * 求值时机 = 注册前、任何装配前；**描述面值随进程启动固定**——进程内改 `shell` 配置不刷新本行
 * （重启生效）。偏差登记 = 批次档 §5（设计终值「值函数 / 重装配期求值」于纯字符串缝不可达）。
 * 机制权威 = `BASH-EXECUTOR-FACE.md` §2 值面 + §3.2。
 */

import { resolveShellIdentity, executorLine } from "@thincoder/core/shell-identity.mjs"
import { loadConfig } from "@thincoder/core/config.mjs"

// 配置读容错（先例 = `bin/thincoder.mjs:54` 同式「配置缺失/损坏 ⇒ 各向默认」）：激活期读取失败不阻断
// 激活；读失败 ⇒ null ⇒ 默认链（fail-open——探测面不猜）。
function configShell() {
  try { return loadConfig()?.shell ?? null } catch { return null }
}

/** 工具面 2 锚（锚名 → 本端取值）。 */
export const VSC_PROMPT_INJECTIONS = {
  // bash 宿主终端面 = 执行器声明行（三端共用）+ terminal 参数行（VSC 宿主能力面原文——K6 两段拼接）
  "bash-terminal-face":
    executorLine(resolveShellIdentity(configShell())) +
    "\n" +
    "- terminal: \"visible\" runs the command in the user's OWN visible terminal via shell integration — it inherits the user's shell state (current dir, activated venv/conda, env vars) that an isolated child process lacks. \"inject\" fills the command into the terminal WITHOUT running it — the user reviews and presses Enter (use for commands the user should inspect first). Omit for the default isolated child process.",
  // question 面板可用性行（替换位——原 `src/tools/question.md:11`）
  "question-ui-face": "- Availability: this tool renders in the chat panel (inline question card). Subagent children (depth>0) never get it — the depth>0 tool table excludes it; put the question in your reply text instead.",
}
