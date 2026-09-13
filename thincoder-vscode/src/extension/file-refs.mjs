/**
 * file-refs.mjs — @-context file reference injection
 * Scans user messages for @path references and replaces them with inline file content.
 */
import { readFileSync, existsSync, statSync } from "node:fs"
import { join } from "node:path"

/** Scan text for @path references and replace with inline file content */
export function injectAtRefs(text, cwd) {
  const re = /@([^\s,;:()[\]{}"'`]+)/g
  const refs = []
  let m
  while ((m = re.exec(text)) !== null) {
    const raw = m[1]
    // Skip things that aren't paths (emails, mentions like @user)
    if (!/^[a-zA-Z0-9_./\\-]+$/.test(raw)) continue
    if (raw.includes("@")) continue
    // Resolve relative to cwd
    const abs = join(cwd, raw)
    if (!existsSync(abs)) continue
    try {
      const stat = statSync(abs)
      if (!stat.isFile()) continue
      let content = readFileSync(abs, "utf8")
      if (content.length > 4000) content = content.slice(0, 4000) + "\n... (truncated)"
      refs.push({ raw, abs, content })
    } catch (e) {
      console.error(`[file-refs] failed to read @${raw}:`, e.message)
    }
  }
  if (refs.length === 0) return text

  // Replace @refs in the text with inline content blocks
  for (const ref of refs) {
    const placeholder = `@${ref.raw}`
    const injection = `[File: ${ref.raw}]\n\`\`\`\n${ref.content}\n\`\`\``
    text = text.split(placeholder).join(injection)
  }

  // Append a summary of referenced files
  const list = refs.map(r => `  - ${r.raw} (${r.content.length} chars)`).join("\n")
  text += `\n\n[Referenced files:\n${list}\n]`

  return text
}
