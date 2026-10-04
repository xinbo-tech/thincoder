/**
 * prompt-injections.mjs — 桌面端提示锚取值表（R4 · 桌面功能对位批 · 台账 #519）。
 *
 * 核单源（`@thincoder/core` `prompt-files.mjs`「锚替换原语」）持两枚锚（`tool-docs/bash.md:15` ∕
 * `tool-docs/question.md:11` 的核锚文法位）；本表供值。注册 = **进程入口一次、任何装配之前**
 * （`src/main/main.mjs`）—— 先例 = CLI `bin/thincoder.mjs:32` ∕ VSC `extension.mjs:92`（`activate()` 内）；
 * 漏配 ⇒ 锚字面静默进模型工具描述（核缝「缺键 ⇒ 抛」只在已配置表上生效）。
 *
 * 两锚取值：
 *   - `bash-terminal-face`（bash-executor-face 批 · 台账 #922 激活）：桌面**无可见终端**
 *     （`bash` 工具 = 核缺省隔离子进程，无 `terminal` 参数）⇒ 类 CLI 语义 = 执行器声明行单值
 *     （核心单源 `resolveShellIdentity`——spawn 同链探测 + memo 按配置值键控）。
 *   - `question-ui-face`：桌面**有流内问题卡**（`renderer/views/question.mjs` + `question:respond` 作答通道）
 *     ⇒ 类 VSC 语义 ⇒ VSC 表字面逐字（`thincoder-vscode/src/prompt-injections.mjs:20`）。
 *
 * 求值形态 = **import 期求值**（端装配层求值路径——核心缝 `applyPromptInjections` 为纯字符串
 * 替换、不支持函数值键）。求值时机 = 注册前、任何装配前；**描述面值随进程启动固定**——进程内
 * 改 `shell` 配置不刷新本行（重启生效）。偏差登记 = 批次档 §5（设计终值「值函数 / 重装配期求值」
 * 于纯字符串缝不可达——取端装配层前置求值）。
 * 机制权威 = `docs/core/design/BASH-EXECUTOR-FACE.md` §2 值面 + §3.2。
 */

import { resolveShellIdentity, executorLine } from "@thincoder/core/shell-identity.mjs"
import { loadConfig } from "@thincoder/core/config.mjs"

// 配置读容错（先例 = `bin/thincoder.mjs:54` 同式「配置缺失/损坏 ⇒ 各向默认」）：读取失败不阻断进程，
// 读失败 ⇒ null ⇒ 默认链（fail-open——探测面不猜）。
function configShell() {
  try { return loadConfig()?.shell ?? null } catch { return null }
}

export const DESKTOP_PROMPT_INJECTIONS = {
  // bash 宿主终端面——桌面无终端参数（核缺省隔离子进程）⇒ 执行器声明行单值（#922 激活）
  "bash-terminal-face": executorLine(resolveShellIdentity(configShell())),
  // question 面板可用性行（替换位——有流内问题卡；子代理 depth>0 工具表不含该工具）
  "question-ui-face": "- Availability: this tool renders in the chat panel (inline question card). Subagent children (depth>0) never get it — the depth>0 tool table excludes it; put the question in your reply text instead.",
}
