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
 * 剩 = 工具面 2 锚（bash-terminal-face / question-ui-face）。
 *
 * bash-executor-face 批（台账 #922）：`bash-terminal-face` 激活 = 运行时执行器身份声明行
 * （核心单源 `resolveShellIdentity`——spawn 同链探测 + memo 按配置值键控）。
 * 求值形态 = **import 期求值**（端装配层求值路径——核心缝 `applyPromptInjections` 为纯字符串
 * 替换、不支持函数值键：函数值会被 String.replace 字符串化）。求值时机 = 注册前、任何装配前；
 * **描述面值随进程启动固定**——进程内改 `shell` 配置不刷新本行（重启生效）；hint 门
 * （核 `tools/bash.mjs` 逐执行调用同一单源）按配置值 memo 键控重探。
 * 偏差登记 = 批次档 §5（设计终值「值函数 / 重装配期求值」于纯字符串缝不可达——取端装配层前置求值）。
 * 机制权威 = `docs/core/design/BASH-EXECUTOR-FACE.md` §2 值面 + §3.2。
 */

import { resolveShellIdentity, executorLine } from "@thincoder/core/shell-identity.mjs"
import { loadConfig } from "@thincoder/core/config.mjs"

// 配置读容错（先例 = `bin/thincoder.mjs:54` 同式「配置缺失/损坏 ⇒ 各向默认」）：读取失败不阻断进程，
// 读失败 ⇒ null ⇒ 默认链（fail-open——探测面不猜）。
function configShell() {
  try { return loadConfig()?.shell ?? null } catch { return null }
}

// CLI 无 terminal 参数（工具面 review 再统一）⇒ 执行器声明行单值。
export const CLI_PROMPT_INJECTIONS = {
  "bash-terminal-face": executorLine(resolveShellIdentity(configShell())),
  // question 工具可用性行（核内正文该行已移出正文、锚原位替换——本端填回 CLI 措辞）
  "question-ui-face": "- Availability: this tool needs an interactive UI — in contexts without one (headless runs) it returns an error instead of asking; subagent children (depth>0) never get it (excluded from their tool tables); put the question in your reply text instead.",
}
