/**
 * rules.mjs — 规则面**单源**（两面）：
 *   ① stream 规则（`.thincoder/rules/*.md`——两端；`discoverRules` ∕ `mergeFileRules`）
 *   ② 作用域规则（`.cursor/rules/*`——三端同面；`loadRules` 读取 ∕ 三分类 ∕ 尾块 ∕ JIT 注入全档单源）
 *
 * 面定义（权威）= `docs/core/design/WORKSPACE.md` §2.3「规则发现面（一线程一语义）」：
 * `.thincoder/rules/*` 恒 = stream 规则；`.cursor/rules/*` 恒 = 作用域规则。
 *
 * Stream rule file format (markdown + YAML frontmatter):
 *   ---
 *   pattern: "console\\.log"
 *   action: abort        # "abort"|"warn" (default: "warn")
 *   repeat: once         # "once"|"always" (default: "always")
 *   ---
 *   Use the project logger instead of console.log.
 *
 * The body becomes the rule message; if empty, falls back to `message` frontmatter.
 *
 * 上提史（R10 → B7 3a）：`.cursor/rules` **读取面**（`loadRules` + 私有 frontmatter 解析）自 VSC
 * `thincoder-vscode/src/extension/rules.mjs` 纯搬（R10）；**三分类 ∕ 尾块文本 ∕ JIT 注入判据**
 * 自 VSC `src/agent/rules-face.mjs` 纯搬 · **glob 匹配**（`matchesGlob`）自 VSC
 * `src/extension/rules.mjs` 纯搬 · **合并**（`mergeFileRules`）自核 `agent/assemble.mjs` 内联块
 * 抽取（B7 3a——均零语义改；VSC 两档退役，desk ∕ CLI 乘核径取得）。尾块 ∕ JIT 两缝同门
 * `depth === 0`（B7 §2 修正轮 1 ④——子代理不携 `.cursor/rules`）。
 */
import { existsSync, readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { parseFrontmatter } from "./markdown.mjs"
// #327 触达路径单源谓词 + 写集（JIT 面 `PATH_TOOLS` 构造——B7 3a：与门禁 ∕ 记账同址单源）
import { FILE_MUTATORS, toolTouchPaths } from "./agent/helpers.mjs"

/**
 * Scan `.thincoder/rules/` in the project root for `.md` rule files.
 * Returns an array of rule objects compatible with config.streamRules format.
 */
export function discoverRules(projectRoot) {
  const rulesDir = join(projectRoot, ".thincoder", "rules")
  if (!existsSync(rulesDir)) return []

  const rules = []
  let entries
  try { entries = readdirSync(rulesDir) } catch { return rules }

  for (const f of entries) {
    if (!f.endsWith(".md")) continue
    try {
      const text = readFileSync(join(rulesDir, f), "utf8")
      const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)
      if (!fm) continue
      const meta = parseFrontmatter(fm[1])
      const body = text.slice(fm[0].length).trim()
      if (!meta.pattern) continue
      // Strip surrounding quotes from frontmatter values (parseFrontmatter returns raw)
      const pattern = meta.pattern.replace(/^"(.*)"$/s, "$1").replace(/^'(.*)'$/s, "$1")
      const message = (meta.message || "").replace(/^"(.*)"$/s, "$1").replace(/^'(.*)'$/s, "$1")

      rules.push({
        pattern,
        message: body || message || "",
        action: meta.action || "warn",
        repeat: meta.repeat || "always",
        name: f.replace(/\.md$/, ""),
      })
    } catch { /* skip malformed rule files silently */ }
  }
  return rules
}

// ─── A 面：stream 规则装配合并（`.thincoder/rules`——B7 3a 自核装配内联块抽取单源）────────

/** 装配合并：`.thincoder/rules/` 文件规则**置前**，config 规则按 `pattern` 去重（文件侧优先；
 *  逐字镜像原 CLI `make-agent.mjs:44-48` 语义）。文件规则为空 ⇒ 归一数组原样返回（零拷贝零改）。
 *  `discover` 可注入（核装配 `DEFAULT_DEPS.discoverRules` 缝——U79 装配序可机验；VSC 端壳同取本件）。 */
export function mergeFileRules(configRules, cwd, discover = discoverRules) {
  const rules = Array.isArray(configRules) ? configRules : []
  const fileRules = discover(cwd)
  if (fileRules.length === 0) return rules
  const filePatterns = new Set(fileRules.map((r) => r.pattern))
  return [...fileRules, ...rules.filter((r) => !filePatterns.has(r.pattern))]
}

// ─── B 面：作用域规则读取面（`.cursor/rules`——R10 上提；纯搬自 VSC `src/extension/rules.mjs:28-81`）──

/**
 * Load all scoped rules from `.cursor/rules/`.
 * Returns [{ name, content, globs, alwaysApply, description, source }, ...]
 */
export function loadRules(cwd) {
  const dir = join(cwd, ".cursor/rules")
  if (!existsSync(dir)) return []
  const results = []
  let entries
  try { entries = readdirSync(dir, { withFileTypes: true }) } catch { return results }
  for (const e of entries) {
    if (!e.isFile() || e.name.startsWith(".") || (!e.name.endsWith(".md") && !e.name.endsWith(".mdc"))) continue
    try {
      const raw = readFileSync(join(dir, e.name), "utf8").trim()
      if (raw.length === 0) continue
      const { content, meta } = parseScopedFrontmatter(raw)
      results.push({
        name: e.name.replace(/\.(md|mdc)$/, ""),
        content,
        globs: meta.globs ? String(meta.globs).split(/[;\n]/).map(s => s.trim()).filter(Boolean) : null,
        alwaysApply: meta.alwaysApply === "true",
        description: meta.description ? String(meta.description) : null,
        source: ".cursor/rules",
      })
    } catch { /* skip unreadable */ }
  }
  return results
}

/**
 * Split frontmatter block from content.
 * Frontmatter starts and ends with `---` on its own line.
 * （私有件——随搬；名改 `parseScopedFrontmatter` = 与 `./markdown.mjs` 的 `parseFrontmatter`
 *   导入同名冲突的机械改名——**体逐字纯搬，零语义改**。）
 */
function parseScopedFrontmatter(raw) {
  const m = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/)
  if (!m) return { content: raw, meta: {} }

  const front = m[1]
  const content = raw.slice(m[0].length).trim()
  const meta = {}
  for (const line of front.split("\n")) {
    const kv = line.match(/^(\w[\w-]*)\s*:\s*(.+?)\s*$/)
    if (kv) {
      const key = kv[1]
      let val = kv[2]
      // Strip surrounding quotes
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      meta[key] = val
    }
  }
  return { content, meta }
}

// ─── B 面判据：三分类 ∕ 尾块 ∕ glob ∕ JIT（B7 3a 自 VSC 端壳上提单源）─────────────────────────

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

/** 文件路径 glob 匹配（简单 `*` / `**` / `?` 通配——无完整 glob 库；纯搬自 VSC
 *  `src/extension/rules.mjs:37-74`，零语义改）。 */
export function matchesGlob(filePath, patterns) {
  if (!patterns || patterns.length === 0) return false
  // Normalize to forward slashes
  const normalized = filePath.replace(/\\/g, "/")
  for (const pat of patterns) {
    if (simpleGlobMatch(normalized, pat.replace(/\\/g, "/"))) return true
  }
  return false
}

/** Simple glob match: supports *, **, ? */
function simpleGlobMatch(path, pattern) {
  // Convert glob pattern to regex
  let regexStr = ""
  let i = 0
  while (i < pattern.length) {
    if (pattern[i] === "*" && pattern[i + 1] === "*") {
      // ** matches anything including /
      regexStr += ".*"
      i += 2
      // Skip trailing /
      if (pattern[i] === "/") i++
    } else if (pattern[i] === "*") {
      regexStr += "[^/]*"
      i++
    } else if (pattern[i] === "?") {
      regexStr += "[^/]"
      i++
    } else {
      // Escape regex special chars
      const c = pattern[i]
      if (".+^${}()|[]\\".includes(c)) regexStr += "\\" + c
      else regexStr += c
      i++
    }
  }
  return new RegExp("^" + regexStr + "$").test(path)
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
