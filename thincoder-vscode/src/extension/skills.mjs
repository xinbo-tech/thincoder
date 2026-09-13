/**
 * skills.mjs — skill discovery / listing / reading（D-CI3：`loadSkills` 扩至 CLI
 * skills.mjs:51-109 同构语义 + 新增 `formatSkillListing`（cli :116-122 逐字）+
 * `readSkill`（cli :130+：name/SKILL.md → name.md，项目层 → 用户层）。
 * 同步实现（本端 fs 面既定——CLI 为 async；语义同源、实现自持）。
 *
 * Supported formats:
 *   .thincoder/skills/my-skill.md           (flat, name = "my-skill")
 *   .thincoder/skills/my-skill/SKILL.md     (subdirectory, name = "my-skill")
 * Project-level skills take priority over user-level (~/.thincoder/skills/).
 */
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { homedir } from "node:os"

/** Valid skill name pattern (alphanumeric + hyphens/underscores) */
const NAME_RE = /^[a-zA-Z0-9_-]+$/

/** Try to read a skill entry { name, path, description } from a path; null when absent. */
function tryReadSkill(name, filePath) {
  try {
    const s = statSync(filePath)
    if (!s.isFile()) return null
    const head = readFileSync(filePath, "utf8")
    const body = head.slice(0, 400).split("\n")
    let desc = ""
    let inFrontmatter = false
    for (const line of body) {
      const t = line.trim()
      if (t === "---") { inFrontmatter = !inFrontmatter; continue }
      if (inFrontmatter) continue
      if (t && !t.startsWith("#")) { desc = t.slice(0, 120); break }
    }
    return { name, path: filePath, description: desc || "(no description)" }
  } catch {
    return null
  }
}

/** Scan a single skills directory: subdirectories (SKILL.md) first, then flat .md files. */
function loadSkillsFromDir(dir) {
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
    // Deterministic order: readdir order is filesystem-dependent; an unsorted scan would
    // reshuffle the skills listing → system prompt byte change with zero content change
    // (CLI skills.mjs:56-58 — the provider prefix cache depends on it).
    entries.sort((a, b) => a.name.localeCompare(b.name))
  } catch {
    return []
  }
  const skills = []
  const added = new Set()

  // Pass 1: subdirectories (higher priority — standard convention)
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    if (!NAME_RE.test(entry.name)) continue
    const skill = tryReadSkill(entry.name, join(dir, entry.name, "SKILL.md"))
    if (skill) { skills.push(skill); added.add(entry.name) }
  }

  // Pass 2: flat .md files (backward compat; skipped if a subdirectory with the same name exists)
  for (const entry of entries) {
    if (!entry.isFile()) continue
    const m = entry.name.match(/^([a-zA-Z0-9_-]+)\.md$/)
    if (!m) continue
    const name = m[1]
    if (added.has(name)) continue
    const skill = tryReadSkill(name, join(dir, entry.name))
    if (skill) { skills.push(skill); added.add(name) }
  }
  return skills
}

/**
 * Scan both project-level and user-level skills directories.
 * Project-level skills (cwd/.thincoder/skills/) take priority over user-level (~/.thincoder/skills/).
 * Returns the merged list `[{ name, path, description }]` with project-level skills first.
 */
export function loadSkills(cwd) {
  const projectSkills = loadSkillsFromDir(join(cwd, ".thincoder", "skills"))
  const added = new Set(projectSkills.map((s) => s.name))
  for (const skill of loadSkillsFromDir(join(homedir(), ".thincoder", "skills"))) {
    if (!added.has(skill.name)) { projectSkills.push(skill); added.add(skill.name) }
  }
  return projectSkills
}

/**
 * Skill listing text for the system-prompt tail (cli skills.mjs:116-122 逐字):
 * at most 3 entries; overflow marked `... and N more`; prefixed with DISREGARD so a
 * refreshed listing auto-invalidates earlier copies without deleting history.
 */
export function formatSkillListing(skills) {
  if (skills.length === 0) return ""
  const listed = skills.slice(0, 3)
  const lines = listed.map((s) => `- **${s.name}**: ${s.description}`)
  if (skills.length > 3) lines.push(`  ... and ${skills.length - 3} more`)
  return "DISREGARD any earlier skill listings. Current available skills (use the skill tool to load one):\n" + lines.join("\n")
}

/**
 * Read a skill's full content. Tries project-level first, then user-level; for each
 * directory tries the subdirectory format (name/SKILL.md) before the flat format.
 * @returns {string|null} text, or null when not found
 */
export function readSkill(cwd, name) {
  if (!NAME_RE.test(name)) return null
  for (const baseDir of [join(cwd, ".thincoder", "skills"), join(homedir(), ".thincoder", "skills")]) {
    for (const filePath of [join(baseDir, name, "SKILL.md"), join(baseDir, `${name}.md`)]) {
      try {
        if (statSync(filePath).isFile()) return readFileSync(filePath, "utf8")
      } catch { /* try the next candidate */ }
    }
  }
  return null
}
