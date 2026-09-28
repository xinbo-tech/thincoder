/**
 * rules.mjs — rule discovery（两面）：
 *   ① stream 规则（`.thincoder/rules/*.md`——两端；`discoverRules`）
 *   ② 作用域规则（`.cursor/rules/*`——VSC 端消费；`loadRules`——R10 上提）
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
 * R10 上提（批档 `docs/batches/2026-09-28-desktop-feature-parity.md` §2.2 R10 · KD-T2）：
 * `.cursor/rules` **读取面**（`loadRules` + 私有 frontmatter 解析）自 VSC
 * `thincoder-vscode/src/extension/rules.mjs` **纯搬**并入本档（零语义改；VSC 同轮改指核件）；
 * 三分类（`alwaysApply` / `globs` / `description`）与 JIT 注入判据 = VSC
 * `src/agent/rules-face.mjs`（本档只供读取面，零分类语义）。
 */
import { existsSync, readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { parseFrontmatter } from "./markdown.mjs"

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

// ─── 作用域规则读取面（`.cursor/rules`——R10 上提；纯搬自 VSC `src/extension/rules.mjs:28-81`）──

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
