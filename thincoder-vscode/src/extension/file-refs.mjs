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

/**
 * 复原注入前的用户原文（F-W15 端侧显示边界剥离 · D-W17）。
 *
 * 契约：同一会话中用户消息的**恢复面**文本 ≡ 活面气泡文本（= 用户所打原文，`@路径` 保持简洁形）。
 * 与产者同档（本档 = 注入语法的唯一产者——语法与其逆变换同住一处，零第二实现）。
 *
 * 剥离判据（fail-closed）：仅当文本尾部为注入**摘要块**（`[Referenced files:` 头 +
 * 逐行 `  - <raw> (<N> chars)` + 尾 `]`）时，按「`[File: <raw>]` 头 + 围栏 + 恰 N 字符正文 +
 * 收尾围栏 ⇒ `@<raw>`」逐条还原并删摘要块；**任一条不吻合 ⇒ 整条原样返回**（用户手打的
 * `[File: x]` / 形近文本零误伤）。落线 / 机读线（模型输入）零触碰——本函数只服务显示边界。
 */
export function stripAtRefs(text) {
  const s = typeof text === "string" ? text : ""
  const tail = /(?:^|\n\n)\[Referenced files:\n([\s\S]*)\n\]$/.exec(s)
  if (!tail) return s
  const entries = []
  for (const line of tail[1].split("\n")) {
    const m = /^ {2}- (.*) \((\d+) chars\)$/.exec(line)
    if (!m) return s // 摘要块形近（行不吻合）⇒ 原样返回
    entries.push({ raw: m[1], len: Number(m[2]) })
  }
  if (entries.length === 0) return s
  let head = s.slice(0, tail.index) // 删摘要块（含其前空行）
  for (const { raw, len } of entries) {
    const open = `[File: ${raw}]\n\`\`\`\n`
    const at = head.indexOf(open)
    if (at < 0) return s // 头部缺 / 不对应 ⇒ 原样返回
    const bodyStart = at + open.length
    const bodyEnd = bodyStart + len
    if (head.slice(bodyEnd, bodyEnd + 4) !== "\n\`\`\`") return s // 字符数不符 ⇒ 原样返回
    head = head.slice(0, at) + `@${raw}` + head.slice(bodyEnd + 4)
  }
  return head
}
