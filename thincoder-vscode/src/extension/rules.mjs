/**
 * rules.mjs — `.cursor/rules/` 作用域规则（B 面）**VSC 端壳**：读取转口 + glob 匹配面。
 *
 * Face definition (authoritative) = `docs/core/design/WORKSPACE.md` §2.3: `.cursor/rules/*`
 * is the VSC end's SCOPE face; `.thincoder/rules/*` is the STREAM face (both ends — read by
 * the core `thincoder-core/rules.mjs` + consumed via `chat()`). One thread, one semantic:
 * this end never reads `.thincoder/rules/` here.
 *
 * R10 上提（批档 `docs/batches/2026-09-28-desktop-feature-parity.md` §2.2 R10 · KD-T2）：
 * 目录**读取面**（原 `loadRules` + 私有 frontmatter 解析）已纯搬并入核 `thincoder-core/rules.mjs`
 * ⇒ 本档 `loadRules` = 核件**同名转口**（既有 import 名面零改 · 端壳零行为变）；glob 匹配面
 * （`matchesGlob`）仍住本档 —— 消费单源 = `src/agent/rules-face.mjs`。
 *
 * Format: Markdown files (`.md` / `.mdc`) with optional YAML frontmatter.
 *
 *   ---
 *   globs: "src/components/**"
 *   alwaysApply: true
 *   ---
 *   Always use React.memo() for top-level component exports.
 *
 * Three-way classification (ordered, mutually exclusive — single consumer
 * `src/agent/rules-face.mjs`):
 *   ① `alwaysApply: true` ⇒ always-rules (every run — injected into the system prompt tail block)
 *   ② `globs` present ⇒ scoped rules (JIT reminder before a matching-path tool dispatch)
 *   ③ neither `globs` nor `description` ⇒ always-rules
 *   ④ `description` only (Cursor's agent-requested semantic) ⇒ never injected here (registered)
 */

// 读取面 = 核件同名转口（R10 上提——纯搬零语义改；实现单源 = `thincoder-core/rules.mjs`）。
export { loadRules } from "@thincoder/core/rules.mjs"

/**
 * Check if a file path matches any of the given glob patterns.
 * Supports simple ** and * wildcards (no full glob library).
 */
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
