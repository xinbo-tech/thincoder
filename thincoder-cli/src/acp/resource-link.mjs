/**
 * resource-link.mjs — `session/prompt` 的 `resource_link` 内容块（ACP v1 基线 MUST：
 * 「All agents MUST support resource links in prompts」）。
 *
 * 判定树与验收 = `docs/cli/design/ACP-PROTOCOL-COMPLIANCE.md` §2.5（逐态可机检）：
 *   uri 解析（file: ⇒ 解码 + UNC/盘符收正；非 file ⇒ `unsupported scheme`；解析失败 ⇒ 纯路径
 *   按 cwd）→ 选区（`#L<a>` / `#L<a>-<b>` / `#L<a>:<b>`——1 基闭区间）→ 读面（`unreadable` /
 *   `not a regular file` / `too large (>10MB)`——文件级先于读取）→ NUL（`binary (NUL byte)`）→
 *   载荷上限（`too many lines (>2000)` / `too long (>100000 chars)`）→ 成功形（`[File: …]` +
 *   无语言标记围栏）。
 *
 * 语义裁定（设计档 §2.5 三条）：**无 cwd confine**（用户显式 @ 引用可读任意绝对路径——与
 * `read` 工具同界：confine 已撤除，读操作只读、不触发审批）；**零能力门控**（resource_link 属
 * 基线 MUST，非 `PromptCapabilities` 项——`embeddedContext` 维持 false）；**上限量级与 `read`
 * 同源**（行上限直引核 `MAX_READ_LINES`——零副本）。
 *
 * 降级标记 = 单行固定词表（11 词——机检面锚；块间独立，单块失败不影响他块）。
 */
import { readFile, stat } from "node:fs/promises"
import { resolve as resolvePath } from "node:path"
// 行上限与 read 工具同源（设计档 §2.5「上限量级与 read 同源」——直引，零副本）。
import { MAX_READ_LINES } from "@thincoder/core/tools/shared.mjs"

/** 文件级字节闸（10MB——先于读取；D-9：字节闸 = 文件级 ∥ 行/字符闸 = 载荷级）。 */
export const MAX_INLINE_BYTES = 10 * 1024 * 1024
/** 载荷级行闸（直引 `read` 工具同源值）。 */
export const MAX_INLINE_LINES = MAX_READ_LINES
/** 载荷级字符闸（100k 字符）。 */
export const MAX_INLINE_CHARS = 100_000

/** 降级标记形：单行、无围栏——`<reason>` ∈ 固定词表（设计档 §2.5 第 7 段）。 */
const marker = (path, reason) => `[File reference: ${path} — ${reason}]`

/** 选区文法：`#L<a>` ∥ `#L<a>-<b>` ∥ `#L<a>:<b>`（`b` 可带 `L` 前缀——含 `#L5:15` / `#L10-L20` 两观察形）。 */
const SELECTION_RE = /^#L(\d+)(?:[-:]L?(\d+))?$/

/** 成功形：头行 + 无语言标记围栏（内容原样；缺尾换行时补一终止换行，围栏不粘连正文）。 */
function fenced(header, content) {
  const body = content.endsWith("\n") ? content : `${content}\n`
  return `${header}\n\`\`\`\n${body}\`\`\``
}

/** 单块 → 内联段或降级标记（块间独立）。 */
export async function resolveResourceLink(block, { cwd } = {}) {
  // ① uri 非字符串 ⇒ missing uri（路径位 = block.name ?? "unknown"）
  const raw = block?.uri
  if (typeof raw !== "string") return marker(block?.name ?? "unknown", "missing uri")

  // ② uri 解析：file: ⇒ 解码 + UNC/盘符收正；非 file ⇒ unsupported scheme；解析失败 ⇒ 纯路径
  let path = null
  let hash = ""
  let url = null
  try { url = new URL(raw) } catch { url = null }
  if (url) {
    if (url.protocol !== "file:") return marker(raw, "unsupported scheme")
    try { path = decodeURIComponent(url.pathname) } catch { return marker(raw, "invalid percent-encoding") }
    if (url.hostname && url.hostname !== "localhost") path = `//${url.hostname}${path}` // UNC 主机
    else if (/^\/[A-Za-z]:/.test(path)) path = path.slice(1) // Windows 盘符（/C:/… → C:/…）
    hash = url.hash
  } else {
    try { path = decodeURIComponent(raw) } catch { return marker(raw, "invalid percent-encoding") }
  }
  path = resolvePath(cwd ?? process.cwd(), path) // 相对路径按 cwd；已在盘面形则归一平台原生分隔符

  // ③ 选区解析（仅 url.hash；非选区哈希 = 锚点 ⇒ 整文）
  let sel = null
  if (hash) {
    const m = SELECTION_RE.exec(hash)
    if (m) {
      const a = Number(m[1])
      const b = m[2] === undefined ? a : Number(m[2])
      if (a < 1 || b < 1 || b < a) return marker(path, "invalid selection")
      sel = { a, b }
    }
  }

  // ④ 读面：stat（unreadable / not a regular file / too large——文件级先于读取）→ 读取 → NUL
  let st
  try { st = await stat(path) } catch { return marker(path, "unreadable") }
  if (!st.isFile()) return marker(path, "not a regular file")
  if (st.size > MAX_INLINE_BYTES) return marker(path, "too large (>10MB)")
  let buf
  try { buf = await readFile(path) } catch { return marker(path, "unreadable") }
  if (buf.includes(0)) return marker(path, "binary (NUL byte)")
  const content = buf.toString("utf8")

  // ⑤ 选区内容检查：a > 总行数 ⇒ lines out of range；b 超尾 ⇒ 截到总行数。
  //    行模型 = `\n` 分界；文末换行符 = 终止符（不计行）——编辑器行号语义。
  const lines = content.split("\n")
  if (content.endsWith("\n")) lines.pop()
  let slice = content
  let lineCount = lines.length
  let header = `[File: ${path}]`
  if (sel) {
    if (sel.a > lines.length) return marker(path, "lines out of range")
    const b = Math.min(sel.b, lines.length)
    slice = lines.slice(sel.a - 1, b).join("\n")
    lineCount = b - sel.a + 1
    header = `[File: ${path} lines ${sel.a}–${b}]`
  }

  // ⑥ 载荷级上限（选区时作用于选区切片，整文时作用于全篇）
  if (lineCount > MAX_INLINE_LINES) return marker(path, "too many lines (>2000)")
  if (slice.length > MAX_INLINE_CHARS) return marker(path, "too long (>100000 chars)")

  // ⑦ 成功形
  return fenced(header, slice)
}

/** 聚合（设计档 §2.5 目标形）：文本段 = 首个 `type:"text"` 且 `text` 为字符串的块（首块策略；
 *  「首块」判据 = 首个**合法** text 块——畸形首块不再吞掉后续合法块）；资源段按数组序逐
 *  `resource_link` 块解析；段间 `\n\n` 连接；文本段在前、资源段随后（保序）。
 *  空结果 ⇒ 调用方走既有 `-32602` 通道。 */
export async function buildPromptText(blocks, { cwd } = {}) {
  const list = Array.isArray(blocks) ? blocks : []
  const segments = []
  const text = list.find((b) => b?.type === "text" && typeof b?.text === "string")?.text
  if (text) segments.push(text)
  for (const b of list) {
    if (b?.type !== "resource_link") continue
    segments.push(await resolveResourceLink(b, { cwd }))
  }
  return segments.join("\n\n")
}
