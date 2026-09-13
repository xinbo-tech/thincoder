/**
 * skills.mjs — skill system
 * Discovers .md skill files AND subdirectory SKILL.md from .thincoder/skills/ directory,
 * injects into system prompt for agent to load on demand.
 * Use the skill tool to activate a specific skill; content is written into conversation history wrapped in <skill-loaded>.
 *
 * Supported formats:
 *   .thincoder/skills/my-skill.md           (flat, name = "my-skill")
 *   .thincoder/skills/my-skill/SKILL.md     (subdirectory, name = "my-skill")
 */

import { readFile, readdir, stat } from "node:fs/promises"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { homedir } from "node:os"

/** Valid skill name pattern (alphanumeric + hyphens/underscores) */
const NAME_RE = /^[a-zA-Z0-9_-]+$/

/**
 * Try to read a skill from a path, return { name, path, description } or null.
 */
async function tryReadSkill(dir, name, filePath) {
  try {
    const s = await stat(filePath)
    if (!s.isFile()) return null
    const head = await readFile(filePath, "utf8")
    const body = head.slice(0, 400).split("\n")
    let desc = ""
    let inFrontmatter = false
    for (const line of body) {
      const t = line.trim()
      if (t === "---") { inFrontmatter = !inFrontmatter; continue }
      if (inFrontmatter) continue
      if (t && !t.startsWith("#")) {
        desc = t.slice(0, 120)
        break
      }
    }
    return { name, path: filePath, description: desc || "(no description)" }
  } catch {
    return null
  }
}

/**
 * Scan a single skills directory, return skill list.
 * Supports flat .md files and subdirectories with SKILL.md inside.
 * Each skill: { name, path, description } — name derived from filename or directory.
 * Returns empty array if directory is missing or empty.
 */
async function loadSkillsFromDir(dir) {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
    // Deterministic order: readdir order is filesystem-dependent; an unsorted scan would
    // reshuffle the skills listing → system prompt byte change with zero content change
    // (2026-08-16 cache audit — that silently misses the provider prefix cache).
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
    const skill = await tryReadSkill(dir, entry.name, join(dir, entry.name, "SKILL.md"))
    if (skill) { skills.push(skill); added.add(entry.name) }
  }

  // Pass 2: flat .md files (backward compat; skipped if subdirectory with same name exists)
  for (const entry of entries) {
    if (!entry.isFile()) continue
    const m = entry.name.match(/^([a-zA-Z0-9_-]+)\.md$/)
    if (!m) continue
    const name = m[1]
    if (added.has(name)) continue
    const skill = await tryReadSkill(dir, name, join(dir, entry.name))
    if (skill) { skills.push(skill); added.add(name) }
  }
  return skills
}

/**
 * Scan both project-level and user-level skills directories.
 * Project-level skills (cwd/.thincoder/skills/) take priority over user-level (~/.thincoder/skills/).
 * Returns merged skill list with project-level skills first.
 */
export async function loadSkills(cwd) {
  const projectDir = join(cwd, ".thincoder", "skills")
  const userDir = join(homedir(), ".thincoder", "skills")
  
  // Load project-level skills first (higher priority)
  const projectSkills = await loadSkillsFromDir(projectDir)
  const added = new Set(projectSkills.map(s => s.name))
  
  // Load user-level skills, skipping duplicates
  const userSkills = await loadSkillsFromDir(userDir)
  for (const skill of userSkills) {
    if (!added.has(skill.name)) {
      projectSkills.push(skill)
      added.add(skill.name)
    }
  }
  
  return projectSkills
}

/**
 * Generate skill listing text for system prompt injection.
 * At most 3 (small footprint); overflow marked "... and N more".
 * Prefixed with DISREGARD: when listing refreshes (skills added/removed), old listings are auto-invalidated without needing to delete history (inspired by kimi-code).
 */
export function formatSkillListing(skills) {
  if (skills.length === 0) return ""
  const listed = skills.slice(0, 3)
  const lines = listed.map((s) => `- **${s.name}**: ${s.description}`)
  if (skills.length > 3) lines.push(`  ... and ${skills.length - 3} more`)
  return "DISREGARD any earlier skill listings. Current available skills (use the skill tool to load one):\n" + lines.join("\n")
}

/**
 * Read the full content of a specific skill file.
 * Tries project-level directory first, then user-level directory.
 * For each directory, tries subdirectory format (name/SKILL.md) first, then flat format (name.md).
 * Returns text, or null if not found.
 */
export async function readSkill(cwd, name) {
  if (!NAME_RE.test(name)) return null

  const dirs = [
    join(cwd, ".thincoder", "skills"),
    join(homedir(), ".thincoder", "skills")
  ]

  for (const baseDir of dirs) {
    // Try subdirectory format: name/SKILL.md
    try {
      const p = join(baseDir, name, "SKILL.md")
      return await readFile(p, "utf8")
    } catch { /* not found, try flat */ }

    // Fallback to flat format: name.md
    try {
      const p = join(baseDir, `${name}.md`)
      return await readFile(p, "utf8")
    } catch { /* not found, try next directory */ }
  }
  
  return null
}

// ─── 同步 loader 面（#88——「同步 loader 面按核内结构归一」）────────────────────────────
// 语义与上方异步面**逐条同源**：同发现规则（扁平 `.md` + 子目录 `SKILL.md`）· 同排序
// （localeCompare——前缀缓存要求确定性）· 同层级优先（项目层 → 用户层，按名去重）。
// 端侧接核后若仍需同步面，直接用本面（不再自持副本——单一结构）。

/** 同步版读取单个 skill 条目（描述提取规则同异步 tryReadSkill）。 */
function tryReadSkillSync(name, filePath) {
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

/** 同步版扫描单目录（Pass1 子目录 → Pass2 扁平；排序 / 去重规则同异步 loadSkillsFromDir）。 */
function loadSkillsFromDirSync(dir) {
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
    entries.sort((a, b) => a.name.localeCompare(b.name))
  } catch {
    return []
  }
  const skills = []
  const added = new Set()

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    if (!NAME_RE.test(entry.name)) continue
    const skill = tryReadSkillSync(entry.name, join(dir, entry.name, "SKILL.md"))
    if (skill) { skills.push(skill); added.add(entry.name) }
  }

  for (const entry of entries) {
    if (!entry.isFile()) continue
    const m = entry.name.match(/^([a-zA-Z0-9_-]+)\.md$/)
    if (!m) continue
    const name = m[1]
    if (added.has(name)) continue
    const skill = tryReadSkillSync(name, join(dir, entry.name))
    if (skill) { skills.push(skill); added.add(name) }
  }
  return skills
}

/** 同步 loader（项目层优先 → 用户层；返回形态与异步 loadSkills 等价）。 */
export function loadSkillsSync(cwd) {
  const skills = loadSkillsFromDirSync(join(cwd, ".thincoder", "skills"))
  const added = new Set(skills.map((s) => s.name))
  for (const skill of loadSkillsFromDirSync(join(homedir(), ".thincoder", "skills"))) {
    if (!added.has(skill.name)) { skills.push(skill); added.add(skill.name) }
  }
  return skills
}

/** 同步 readSkill（name 校验 + `name/SKILL.md` → `name.md`，项目层 → 用户层——同异步）。 */
export function readSkillSync(cwd, name) {
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
