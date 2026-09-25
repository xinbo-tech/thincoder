/**
 * rules-face.mjs — VSC 端规则面判据单源（#130 · 批档
 * `docs/batches/2026-09-20-vsc-rules-retry-batch.md` §2.1）：
 * - **A 面** = stream 规则（`.thincoder/rules/*.md`——两端同义；消费 = 核 provider `chat()`）
 * - **B 面** = `.cursor/rules/*` 作用域规则（VSC 专属面——常驻集 / 作用域集 JIT / 不注入）
 * 面定义权威 = `docs/core/design/WORKSPACE.md` §2.3（一线程一语义）。本档为两面判据的
 * 落地单源（`setup.mjs` / `execute-tools.mjs` / `agent.mjs` 同引）。
 */
import { discoverRules } from "@thincoder/core/rules.mjs"
import { loadRules, matchesGlob } from "../extension/rules.mjs"
import { FILE_MUTATORS, pushReal } from "./run-helpers.mjs"
// #327（`docs/core/design/TOOLS.md` §6.17）：触达路径提取单源谓词（核单源——零副本；恒数组 · 恒零抛）。
import { toolTouchPaths } from "@thincoder/core/agent/helpers.mjs"

// ─── A 面：stream 规则（两端同义）───────────────────────────────────────────

/** 装配合并（逐字镜像 CLI `thincoder-cli/src/cli/make-agent.mjs:44-48` 语义）：`.thincoder/rules/`
 *  文件规则**置前**，config 规则按 `pattern` 去重（文件侧优先）。文件规则为空 ⇒ 原样返回
 *  （恒等——零拷贝零改）。 */
export function mergeFileRules(configRules, cwd) {
  const rules = Array.isArray(configRules) ? configRules : []
  const fileRules = discoverRules(cwd)
  if (fileRules.length === 0) return rules
  const filePatterns = new Set(fileRules.map((r) => r.pattern))
  return [...fileRules, ...rules.filter((r) => !filePatterns.has(r.pattern))]
}

/** 消费接线（abort 规则命中——核 provider `chat()` 置 `response.ruleTriggered`）：部分输出入
 *  双线 + 注入规则消息提醒，返回 true ⇒ 调用方 `continue` 同上下文重入（镜像核
 *  `thincoder-core/agent.mjs:305-315`）。未命中 ⇒ false（零副作用）。
 *  `agent` 形参 = 调用面留位（设计 A-3 固定四参调用形；现实现只用 `response` + 双线载体）。 */
export function applyRuleTriggered(agent, history, fullHistory, response) {
  if (!response?.ruleTriggered) return false
  if (response.content) pushReal(history, fullHistory, { role: "assistant", content: response.content })
  const label = response.ruleName ? ` — stream rule "${response.ruleName}"` : ""
  history.push({ role: "user", content: `[System reminder${label}: ${response.ruleMessage}]` })
  return true
}

// ─── B 面：`.cursor/rules` 作用域规则（VSC 端面）────────────────────────────

/** 三分类（**按序判定·互斥**——权威定义 `docs/core/design/WORKSPACE.md` §2.3）：
 *  ① `alwaysApply === true` ⇒ **常驻集**（**先判**——`globs` 同在不改分类）
 *  ② 有 `globs` ⇒ **作用域集**（命中路径的工具派发前置提醒）
 *  ③ 无 `globs` 且无 `description` ⇒ **常驻集**
 *  ④ 仅 `description`（Cursor 的 agent-requested 语义）⇒ 两集皆无（本端无该机制——登记）。 */
export function classifyRules(rules) {
  const always = []
  const scoped = []
  for (const r of rules ?? []) {
    if (r.alwaysApply === true) always.push(r)
    else if (r.globs?.length) scoped.push(r)
    else if (!r.description) always.push(r)
  }
  return { always, scoped }
}

/** 目录读点（每 run 一次——装配期）：`.cursor/rules` 读取 + 三分类（本函数 = 分类入口单源）。 */
export function loadScopedRules(cwd) {
  return classifyRules(loadRules(cwd))
}

/** 常驻集注入块（[4] 层尾块——与项目指令块同槽：每 run 重建、不进 history）+ **本 run 唯一
 *  一次目录读取**：结果缓存于 `agent._rules`（`{ always, scoped }`）——作用域集 JIT 判定
 *  只读该缓存（零重读盘）。无命中 ⇒ 空串（零改字符串）。 */
export function scopedRulesBlock(agent, cwd) {
  const rules = loadScopedRules(cwd)
  if (agent) agent._rules = rules
  if (rules.always.length === 0) return ""
  return `\n\nProject rules (.cursor/rules):\n${rules.always.map((r) => `- ${r.name}: ${r.content}`).join("\n")}`
}

const PATH_TOOLS = new Set([...FILE_MUTATORS, "file_ops", "read", "glob"])

/** 路径候选（绝对路径先归一为 cwd 相对——globs 语义 = 项目相对；`read` 可收绝对路径）：
 *  前缀比对**大小写不敏感**（VS Code `uri.fsPath` 的 Windows 盘符为小写，模型侧常给大写盘符
 *  ——`D:\proj\a.py` vs cwd `d:\proj`）；另剥前导 `./`。 */
function matchCandidates(p, cwd) {
  const norm = String(p).replace(/\\/g, "/").replace(/^\.\//, "")
  const out = [norm]
  const base = String(cwd ?? "").replace(/\\/g, "/").replace(/\/+$/, "")
  const underCwd = base && norm.length > base.length
    && norm.slice(0, base.length).toLowerCase() === base.toLowerCase() && norm[base.length] === "/"
  if (underCwd) out.push(norm.slice(base.length + 1))
  return out
}

/** 作用域集 JIT 注入（**派发前**——模型下一轮可见）：文件路径类工具（`FILE_MUTATORS` ∪
 *  `file_ops` ∪ `read` / `glob`）的触达路径命中**未注入**规则 ⇒ `history` 注入
 *  `[System reminder — project rule "<name>" (globs: <g>): <content>]`。语义一句话 =
 *  「Agent 将触碰匹配文件时，该文件作用域的规则先入上下文」。去重键 = `name`；去重域 =
 *  会话（`agent._rulesInjected` 惰性建 Set——顶层 agent 单例；子代理 agent 每 run 新对象
 *  ⇒ 去重域 = 该子回合）。路径候选 = #327 单源谓词（`toolTouchPaths`——设计
 *  B-4 公式）——`read.filePath` 别名与 `glob.pattern` **不作候选**（登记边界）。
 *  @returns {number} 本次注入条数（测试直驱面）。 */
export function injectScopedRules(agent, history, calls) {
  const scoped = agent?._rules?.scoped ?? []
  if (scoped.length === 0) return 0
  const injected = (agent._rulesInjected ??= new Set())
  let count = 0
  for (const { tool, args } of calls ?? []) {
    if (!PATH_TOOLS.has(tool?.name)) continue
    const raw = toolTouchPaths(tool, args)
    const paths = (raw ?? []).filter((p) => typeof p === "string" && p).flatMap((p) => matchCandidates(p, agent.cwd))
    if (paths.length === 0) continue
    for (const rule of scoped) {
      if (injected.has(rule.name)) continue
      if (!paths.some((p) => matchesGlob(p, rule.globs))) continue
      injected.add(rule.name)
      history.push({
        role: "user",
        content: `[System reminder — project rule "${rule.name}" (globs: ${rule.globs.join("; ")}): ${rule.content}]`,
      })
      count++
    }
  }
  return count
}
