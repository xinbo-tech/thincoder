/**
 * tools/shared.mjs — shared tool utilities, constants, OpenAI schema conversion
 * Imported by tools/file.mjs / system.mjs / web.mjs / git.mjs
 */

import { spawn, execFileSync, execFile } from "node:child_process"
import { readFileSync, existsSync, realpathSync, readdirSync, statSync, openSync, readSync, closeSync } from "node:fs"
import { dirname, join, resolve, relative, isAbsolute, sep } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
export const DESC = (name) => readFileSync(join(__dirname, "..", "tools", `${name}.md`), "utf8")

export const MAX_READ_LINES = 2000
export const MAX_OUTPUT_CHARS = 200_000

const ENCODING_DETECT_MAX_TRIM = 3
const SYNTAX_CHECK_TIMEOUT = 10000
export const BASH_TIMEOUT_MS = 120_000
export const IGNORED_DIRS = new Set(["node_modules", ".git", "dist", "build", ".turbo", "coverage"])

/** SSRF guard: check if a hostname is private/internal. Shared by web.mjs and codemode.mjs.
 *  Returns TRUE for private hosts — callers block them. */
export function isPrivateHost(hostname) {
  const h = hostname.toLowerCase()
  // Local loopback + link-local names: BLOCK (true). These returned false
  // before — the guard was inverted for the most common SSRF targets
  // (localhost/127.x reach internal services unchecked).
  if (h === "localhost" || h === "0.0.0.0" || h.endsWith(".localhost")) return true
  if (h === "127.0.0.1" || h.startsWith("127.")) return true
  if (h === "169.254.169.254" || h === "metadata.google.internal") return true
  // IPv6 private ranges — only check if host contains ":"
  // fe80::/10 link-local covers fe80:…febf:… — startsWith("fe80:") is the
  // practical subset (fe8/fe9/fea/feb all begin fe8/feb — full range regex
  // would be /^fe[89ab][0-9a-f]:/; startsWith fe8 + fe9 + fea + feb covers it).
  if (h.includes(":")) {
    if (h === "::1" || h.startsWith("fc") || h.startsWith("fd")) return true
    if (/^fe[89ab][0-9a-f]:/.test(h)) return true
  }
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (m) {
    // Octet range is NOT validated (999.10.0.1 parses but matches no private
    // prefix → treated as public). Intentional: the guard checks known-private
    // prefixes; invalid IPs are harmless false-negatives for SSRF purposes.
    const [a, b] = [Number(m[1]), Number(m[2])]
    if (a === 10 || (a === 172 && b >= 16 && b <= 31) || a === 192 && b === 168 || a === 169 && b === 254 || a === 0) return true
  }
  return false
}

/** Normalize Windows line endings to Unix: \r\n → \n.
 *  Applied on every text-file read so that edit/hash matching
 *  and hash computation are platform-consistent. */
export function normalizeEOL(text) {
  return text.replace(/\r\n/g, "\n")
}

/** Detect a file's EOL style by the type of its FIRST newline: "\r\n" first →
 *  the whole file is written back as CRLF; a bare "\n" or no newline → LF.
 *  Never counts occurrences (mixed files follow the first line's style). */
export function detectFileEol(text) {
  const i = text.indexOf("\n")
  return i > 0 && text[i - 1] === "\r" ? "\r\n" : "\n"
}

/** Join lines with the EOL style detected from the original text (write-back restore). */
export function joinWithEol(lines, originalText) {
  return lines.join(detectFileEol(originalText))
}

const MAJORITY_EOL_MAX_FILES = 20
const EOL_SNIFF_BYTES = 4096

/** Majority EOL style of a directory's existing files (≤20 files, first 4KB each).
 *  New files follow the directory's majority style; empty dir / tie / LF majority → "\n". */
export function majorityEol(dirPath) {
  let names
  try { names = readdirSync(dirPath) } catch { return "\n" }
  let crlf = 0, lf = 0
  for (const name of names) {
    if (crlf + lf >= MAJORITY_EOL_MAX_FILES) break
    try {
      const p = join(dirPath, name)
      if (!statSync(p).isFile()) continue
      const fd = openSync(p, "r")
      let head = ""
      try {
        const buf = Buffer.alloc(EOL_SNIFF_BYTES)
        const n = readSync(fd, buf, 0, EOL_SNIFF_BYTES, 0)
        head = buf.subarray(0, n).toString("utf8")
      } finally {
        closeSync(fd)
      }
      if (detectFileEol(head) === "\r\n") crlf++
      else lf++
    } catch { /* unreadable entry — skip */ }
  }
  return crlf > lf ? "\r\n" : "\n"
}

const CANDIDATE_MAX_LEN = 500
const CANDIDATE_PREVIEW_LEN = 80

/** Longest-common-substring length (rolling-row DP). Inputs are pre-truncated by the caller. */
function lcsLength(a, b) {
  // Reused DP buffers (review R9#6): per-line allocation caused GC pressure on
  // large files — hoist two module-level rows, grow to fit, swap by index.
  const need = b.length + 1
  if (_lcsBuf0.length < need) {
    const size = Math.max(need, _lcsBuf0.length * 2)
    _lcsBuf0 = new Uint16Array(size)
    _lcsBuf1 = new Uint16Array(size)
  }
  let prev = _lcsBuf0, cur = _lcsBuf1
  prev.fill(0, 0, need)
  let best = 0
  for (let i = 1; i <= a.length; i++) {
    cur[0] = 0
    const ca = a.charCodeAt(i - 1)
    for (let j = 1; j < need; j++) {
      if (ca === b.charCodeAt(j - 1)) {
        const v = prev[j - 1] + 1
        cur[j] = v
        if (v > best) best = v
      } else cur[j] = 0 // must reset — buffer is reused
    }
    const t = prev; prev = cur; cur = t
  }
  return best
}
let _lcsBuf0 = new Uint16Array(0), _lcsBuf1 = new Uint16Array(0)
/** Line-level similarity candidates for a failed edit: score = LCS(oldString, line) / max(len).
 *  Multi-line old_string matches on its FIRST line only (failures usually diverge there).
 *  Both sides are truncated to 500 chars before scoring so minified files can't blow the budget.
 *  Returns up to topN [{ line (1-based), preview, score }] with score >= threshold, best first. */
export function findCandidates(lines, oldString, topN = 3, threshold = 0.5) {
  const needle = oldString.split("\n")[0].slice(0, CANDIDATE_MAX_LEN)
  if (!needle) return []
  const scored = []
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]
    if (!raw) continue
    const line = raw.length > CANDIDATE_MAX_LEN ? raw.slice(0, CANDIDATE_MAX_LEN) : raw
    const longer = Math.max(needle.length, line.length)
    const shorter = Math.min(needle.length, line.length)
    // LCS ≤ shorter side — a length ratio below the threshold can never reach it; skip the DP.
    if (shorter / longer < threshold) continue
    const score = lcsLength(needle, line) / longer
    if (score >= threshold) scored.push({ line: i + 1, preview: raw.slice(0, CANDIDATE_PREVIEW_LEN), score })
  }
  scored.sort((a, b) => b.score - a.score || a.line - b.line)
  return scored.slice(0, topN)
}

/** Appended to hashline_edit results when the file contains U+FFFD (encoding-corruption probe). */
export const FFFD_WARNING = "⚠ file contains U+FFFD (replacement char) — encoding may be corrupted; hash-based addressing may be unreliable. Consider fixing the file encoding first."

/** Convert to OpenAI tools parameter format */
export function toOpenAISchema(tool) {
  return {
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }
}

/** Strip ANSI escape sequences */
export function sanitizeOutput(s) {
  return s
  // eslint-disable-next-line no-control-regex -- 有意为之：控制字符协议/转义序列剥离正则（ANSI/⟦ev⟧/SGR/history 双线分隔）
    .replace(/\x1b\[[0-9;?]*[\x40-\x7E]|\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)|\x1b[()][0-9A-B]|\x1b[=>#][0-9]?/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
}

/** Truncate text to max chars, appending a truncation notice */
export function truncate(text, max = MAX_OUTPUT_CHARS) {
  if (text.length <= max) return text
  return text.slice(0, max) + `\n[... truncated: ${text.length - max} chars omitted — redirect to a file if you need the full output]`
}

/** Streaming decoder: encoding sniffing ASCII→UTF-8→GBK.
 *  KNOWN LIMITATION (accepted): the fallback is hardcoded to GBK (Chinese) —
 *  Shift-JIS/EUC-KR pages decode as mojibake. Real-world usage is dominated
 *  by UTF-8; a charset-aware variant would need the Content-Type header.
 *  Each call creates an independent decoder instance — must not be shared across parallel streams (internal decoder state accumulates). */
export function makeDecoder() {
  let decoder = null
  let pending = Buffer.alloc(0)
  return (d, flush = false) => {
    pending = Buffer.concat([pending, d])
    if (!decoder) {
      const hasHighByte = pending.some((b) => b >= 0x80)
      if (!hasHighByte) { const s = pending.toString("ascii"); pending = Buffer.alloc(0); return s }
      for (let trim = 0; trim <= ENCODING_DETECT_MAX_TRIM && !decoder; trim++) {
        try { new TextDecoder("utf-8", { fatal: true }).decode(pending.subarray(0, pending.length - trim)); decoder = new TextDecoder("utf-8") }
        catch { /* continue */ }
      }
      if (!decoder) decoder = new TextDecoder("gbk")
    }
    const s = decoder.decode(pending, { stream: !flush })
    pending = Buffer.alloc(0)
    return s
  }
}

/** Single-file git diff. Silently returns empty on failure. Large diffs that exceed maxBuffer are truncated rather than swallowed. */
export function gitDiffOne(cwd, abs) {
  try {
    const diff = execFileSync("git", ["--no-pager", "diff", "--no-color", "--", abs], {
      cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 10 * 1024 * 1024,
    }).trim()
    if (!diff) return ""
    const lines = diff.split("\n")
    if (lines.length <= 200) return diff
    return lines.slice(0, 200).join("\n") + `\n... (${lines.length - 200} more diff lines)`
  } catch (e) {
    // maxBuffer overflow: e.stdout contains partial collected output; other errors (non-git repo etc.) return empty
    if (e.code === "ERR_CHILD_PROCESS_STDIO_MAXBUFFER" && e.stdout) {
      const lines = e.stdout.toString().split("\n")
      return lines.slice(0, 200).join("\n") + `\n... (diff too large, showing first 200 of more lines)`
    }
    return ""
  }
}

/** Auto syntax check after file modification */
export async function autoSyntaxCheck(abs) {
  if (!/\.(m?js)$/i.test(abs)) return ""
  try {
    await new Promise((resolve, reject) => {
      const child = execFile("node", ["--check", abs], { timeout: SYNTAX_CHECK_TIMEOUT, stdio: ["ignore", "pipe", "pipe"] })
      let stderr = ""
      child.stderr.on("data", (d) => { stderr += d.toString() })
      child.on("error", reject)
      child.on("close", (code) => {
        if (code === 0) resolve()
        else {
          const err = new Error(stderr.trim() || `node --check exited with code ${code}`)
          err.stderr = stderr
          reject(err)
        }
      })
    })
    return "\nSyntax: OK"
  } catch (e) {
    const err = (e.stderr || e.stdout || e.message || "").toString().split("\n").slice(0, 3).join("\n")
    return `\nSyntax: FAILED — ${err}\n(If this file was corrupted by a bad edit, recover it from a checkpoint: checkpoint action=list then action=rewind with the latest id.)`
  }
}

/** Resolve realpath by walking up the directory tree */
function realpathNearest(abs) {
  let cur = abs
  const tail = []
  while (!existsSync(cur)) {
    const parent = dirname(cur)
    if (parent === cur) return abs
    tail.unshift(cur.slice(parent.length + 1))
    cur = parent
  }
  try { const real = realpathSync(cur); return tail.length ? join(real, ...tail) : real }
  catch { return abs }
}

// cwd is effectively constant per CLI session — the cache never grows in
// practice. A long-running server with rotating cwds would leak; revisit with
// an LRU if that usage ever appears.
const realCwdCache = new Map()
/** Resolve cwd to realpath, cached */
function realCwd(cwd) {
  if (!realCwdCache.has(cwd)) realCwdCache.set(cwd, realpathNearest(resolve(cwd)))
  return realCwdCache.get(cwd)
}

/** Assert that a resolved path is inside cwd; throws on escape */
function assertInside(cwd, resolved, p) {
  // relative() returns platform-native separators; ".." + sep therefore
  // matches both / and \ traversal on the respective platform.
  const rel = relative(cwd, resolved)
  if (isAbsolute(rel) || rel === ".." || rel.startsWith(".." + sep)) {
    throw new Error(`Access denied outside working directory: ${p}`)
  }
}

/** Resolve a user-supplied path relative to cwd, asserting it stays within cwd */
export function resolveInCwd(ctx, p) {
  const cwd = realCwd(ctx.cwd)
  const resolved = resolve(cwd, p)
  assertInside(cwd, resolved, p)
  const real = realpathNearest(resolved)
  assertInside(cwd, real, p)
  return resolved
}

/** Resolve a path relative to cwd without boundary check — use only when the user explicitly provides an external path */
export function resolveExternal(ctx, p) {
  const cwd = realCwd(ctx.cwd)
  return resolve(cwd, p)
}

/** Coarse segmentation for destructive pre-check (also splits on > >> < so destructive detection still works through redirection) */
export function shellSegments(command) {
  return command.split(/&&|\|\||>>|\$\(|[;|\n<>]|`|[(]/)
}

/**
 * Blank out quoted regions (single/double/backtick) with spaces, preserving length.
 * Lets safety checks ignore shell metacharacters inside quoted script bodies —
 * e.g. `node -e "if (a > b) …"` comparisons are not redirections.
 */
function blankQuoted(command) {
  let out = ""
  let quote = null
  for (let i = 0; i < command.length; i++) {
    const ch = command[i]
    if (quote) {
      if (ch === "\\" && quote !== "'") { out += " "; i++; out += " "; continue }
      if (ch === quote) { quote = null; out += " "; continue }
      // Backticks are COMMAND SUBSTITUTION — the content executes, so it must
      // stay visible to the redirection check (echo `cat > /tmp/x` writes a
      // file). Only ' and " are literal regions.
      out += quote === "`" ? ch : " "
    } else if (ch === "'" || ch === '"' || ch === "`") {
      quote = ch
      out += " "
    } else {
      out += ch
    }
  }
  return out
}

/** Detect shell output/input redirection (> >> < followed by filename) outside quoted regions.
 *  Backtick contents count (command substitution executes); fd-prefixed forms
 *  (2> file, 1>> file) count too. */
export function hasFileRedirection(command) {
  const bare = blankQuoted(command)
  return /(^|[\s;&|0-9])>{1,2}\s*\S/.test(bare) || /(^|[\s;&|0-9])<\s*\S/.test(bare)
}

/**
 * Whether a single command segment is destructive — ALWAYS FALSE (deliberate).
 *
 * 决策(2026-08):文本拦截对恶意模型是安全剧场——空白变体/heredoc/node -e/写脚本执行
 * 都能绕过,拦住的只有正常操作(如清理临时目录、rm node_modules 重装)。
 * 真实防线在工具审批层(autoApprove)与快照兜底(gitGuardSnapshot / checkpoint auto-snapshot),
 * 与 env 过滤、git 破坏操作"快照后放行、永不拦截"同一哲学。
 * 项目工具自带确认门(如 thin5 scripts/db.mjs --write/--danger)不应被双重拦截。
 */
export function isDestructiveCommand() {
  return false
}

/**
 * 危险命令识别(只标注、不拦截)——参考 kimi-code apps/kimi-code/src/tui/reverse-rpc/approval/adapter.ts
 * DANGER_PATTERNS。定位:给审批中的人打红色警告标签,提升决策信息,不是机器防线。
 * 拦截无用(可绕过),标注有用(人看到了才知道该多看一眼)。
 */
const DANGER_PATTERNS = [
  { pattern: /\brm\s+(-[a-zA-Z]*[rRfF][a-zA-Z]*|--recursive|--force)/i, label: "recursive delete" },
  { pattern: /\bsudo\b/i, label: "sudo" },
  { pattern: /\b(curl|wget)\b[^|]*\|\s*(sh|bash|zsh)\b/i, label: "pipe to shell" },
  { pattern: /\bdd\b[^|]*\bof=/i, label: "dd write" },
  { pattern: /\bmkfs\b/i, label: "mkfs" },
  { pattern: />\s*\/dev\/(sd|nvme|disk|hd)/i, label: "write to raw device" },
  { pattern: /\bchmod\s+(?:-[rR]\s+)?777\b/i, label: "chmod 777" },
  { pattern: /:\(\)\s*\{\s*:\|:&\s*\}/i, label: "fork bomb" },
]

/** 返回危险标注 label(如 "recursive delete");无危险返回 undefined。
 *  引号感知:引号(单/双)内的内容清空后再检测——commit message、echo 文本等
 *  纯文本不误标;危险命令(rm -rf "$dir")的参数在引号外,仍命中。
 *  反引号内容保留(命令替换会执行)。 */
export function detectDanger(command) {
  const s = blankQuoted(String(command ?? ""))
  for (const { pattern, label } of DANGER_PATTERNS) {
    if (pattern.test(s)) return label
  }
  return undefined
}


/** Convert glob pattern to regex */
export function globToRegex(pattern) {
  // Sentinel chars: \u0001/\u0002 never appear in real glob patterns (they
  // come from model output or the filesystem) — safe as **/ and ** placeholders.
  const DS = "\u0001", DP = "\u0002"
  const escaped = pattern
    .replace(/\*\*\//g, DS).replace(/\*\*/g, DP)
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, "[^/]*").replace(/\?/g, "[^/]")
    .replace(new RegExp(DS, "g"), "(?:.+/)?")
    .replace(new RegExp(DP, "g"), ".*")
  return new RegExp(`^${escaped}$`)
}

/** Decode a numeric HTML entity to its code point — invalid/out-of-range
 *  values (e.g. &#999999999999;) must not throw RangeError; keep the source
 *  text as-is (display-only residue is acceptable). */
function decodeNumericEntity(_, digits) {
  const n = Number(digits)
  return Number.isSafeInteger(n) && n <= 0x10ffff ? String.fromCodePoint(n) : _
}

/** Strip HTML tags. KNOWN LIMITATION (accepted): the `/<[^>]+>/g` regex treats
 *  the first `>` (or a `<` inside an attribute value) as the tag boundary —
 *  `<img alt="a > b">` truncates the match and leaves text residue. A full
 *  HTML parser is out of scope; real-world HTML with angle brackets in
 *  attributes is rare and the residue is display-only (never parsed). */
export function stripTags(html) {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&#0*(\d+);/g, (m, n) => decodeNumericEntity(m, n))
    .replace(/&#x([0-9a-fA-F]+);/g, (m, h) => decodeNumericEntity(m, parseInt(h, 16)))
    .replace(/&nbsp;|&ensp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()
}

/** HTML → plain text: strip scripts/styles, newline block tags, strip tags, decode entities, compress blank lines */
export function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
    .replace(/<\/(p|div|li|ul|ol|h[1-6]|tr|table|section|article|header|footer|blockquote|pre)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<[^>]+>/g, "")
    .replace(/&#0*(\d+);/g, (m, n) => decodeNumericEntity(m, n))
    .replace(/&#x([0-9a-fA-F]+);/g, (m, h) => decodeNumericEntity(m, parseInt(h, 16)))
    .replace(/&nbsp;|&ensp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&") // &amp; must be decoded last, otherwise &amp;lt; gets double-decoded to <
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim()
}

/** Execute a git command. maxBuffer 10MB prevents large diff/log overflow; on overflow, returns truncated partial output rather than empty.
 *  config: optional array of `-c key=value` overrides (e.g. ["http.proxy=http://10.2.2.112:3128"]) —
 *  inserted verbatim after `git`, so network actions (push/fetch/pull/ls-remote) can route through a proxy. */
export function runGit(cwd, cmdArgs, config = []) {
  try {
    return execFileSync("git", [...config, ...cmdArgs], { cwd, encoding: "utf8", maxBuffer: 10 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] }).trim().replace(/\r/g, "")
  } catch (e) {
    // maxBuffer overflow: e.stdout contains partial collected output — return it
    // (callers show "(truncated)"-style tails). ALL OTHER errors (non-git repo,
    // permission, bad command) return "" — matching gitDiffOne's pattern: a
    // failed git call must not masquerade as partial success.
    if (e.code === "ERR_CHILD_PROCESS_STDIO_MAXBUFFER" && e.stdout) {
      return String(e.stdout).trim().replace(/\r/g, "").split("\n").slice(0, 200).join("\n")
    }
    return ""
  }
}
