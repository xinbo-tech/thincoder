/**
 * process-doc-mark.mjs — 工具输出里的过程档标记（单源小档；机制 = `docs/core/design/TOOLS.md` §6.28）。
 *
 * 依赖面说清楚：本档**不**是零依赖叶档——谓词都来自判据单源 `../declaration.mjs`，而它的静态闭包
 * 经 `memory/file-walk.mjs` 达 `memory/schema.mjs`（`node:sqlite`）。因此端壳里静态引本档 = 把那条链拉进静态闭包；
 * 当前端装配面本已静态可达同一链（`setup-tooltable.mjs` → 核 `agent-tools/verify.mjs` → `conventions.mjs`），
 * 零新增风险，但别把它当零依赖档随手引。
 *
 * 一句话：输出里**判定得出**来源档落在索引排除集（batches 段 ∥ `_archive` 前缀）的行，
 * 行首加 `[process doc: not a design basis]`（原行整体后随）；其余行一个字节不动。**不是门**——
 * 不拦、不筛、不改命中集，只加可读信息。
 *
 * 两套判据、一份文案、一个谓词、一个 helper：
 * - `grep` 面按命中行的**档**判（消费面直调 `isProcessDocPath`——grep 自己已有 `h.file`，本档不参与拼装）；
 * - 命令面（`bash` 同步 ∥ `bash` 后台摘要 ∥ `execute` ∥ VSC 端 `bash`）的输出是任意文本，只能按
 *   **行首路径 token 真解析到盘上**判（`markProcessDocLines`）——解析不到 = 判不了 = 不动输出。
 *
 * 判据单源 = `../declaration.mjs` 的 `isExcludedRelPath`（面① 前缀 ∪ 面⑥ 段序列）：本档零新排除名单、
 * 零新谓词。第三参必须传 `decl.root`——`isExcludedRelPath` 内 `resolve(base, s)` 对绝对参恒等，
 * 再由 `relative(root, …)` 换成根相对面，面① 前缀才判得住（只被面① 命中的 `_archive` 靠这一点）。
 *
 * 零 console 噪声：本档不调用 `console`。判据只走 `declarationForTarget` → `loadProjectDeclaration`，
 * 后者按档缓存，只在声明档不可用 / 读不出时 warn（既有降级面，非本档新增）。
 */
import { existsSync } from "node:fs"
import { isAbsolute, resolve } from "node:path"
import { declarationForTarget, isExcludedRelPath } from "../declaration.mjs"

/** 逐字文案（33 字符 · 全 ASCII · 方括号闭合）：工具输出面全英文，同一行混中英破坏「一词一物」。 */
export const PROCESS_DOC_MARK = "[process doc: not a design basis]"

/** 末尾汇总行（仅命令面）：N = 本次输出被判为过程档的行数；N = 0 不加（`grep` 面不加此形）。 */
export const processDocSummary = (n) =>
  `[process doc: ${n} of this output's lines come from process docs — not a design basis]`

/** 行首 token 的字符帽（步骤 ①）：超过即成不了路径，该行跳过不解析。 */
const MAX_TOKEN_CHARS = 260

/**
 * 档判据（一次调用内按档记忆：`Map<absoluteFile, boolean>`）。
 * @param {string} absFile 档的绝对路径（grep 面 = 命中行的 `h.file`；命令面 = 盘上解析出的绝对路径）
 * @param {Map<string, boolean>} [cache] 记忆表（缺省自建——不传就没有跳调用的记忆）
 * @returns {boolean} 所属档在索引排除集内 ⇒ true；出辖（祖先链无 manifest）⇒ false（无档类可判）
 */
export function isProcessDocPath(absFile, cache) {
  const key = String(absFile ?? "")
  if (!key) return false
  const memo = cache instanceof Map ? cache : new Map() // 缺省自建：一次调用内按档记忆
  if (memo.has(key)) return memo.get(key)
  const decl = declarationForTarget(key) // null = 出辖（场景：会话锚在无 manifest 的目录里跑检索）
  const marked = decl ? isExcludedRelPath(key, decl, decl.root) : false
  memo.set(key, marked)
  return marked
}

/** 剥两侧成对引号（步骤 ①）——行首字段被引起来的输出很常见。 */
function stripPairedQuotes(s) {
  if (s.length < 2) return s
  const first = s[0]
  const last = s[s.length - 1]
  if ((first === '"' && last === '"') || (first === "'" && last === "'")) return s.slice(1, -1)
  return s
}

/**
 * 行首路径 token（步骤 ①–③）。判不了 ⇒ null（调用方原样保留该行）。
 * @param {string} line 输出行
 * @returns {string|null}
 */
function headPathToken(line) {
  const head = /^\S+/.exec(String(line ?? "").trimStart())
  if (!head) return null // 空行 / 纯空白行
  const raw = stripPairedQuotes(head[0])
  if (!raw || raw.length > MAX_TOKEN_CHARS) return null
  // ② 剥尾：内层 `grep` ∥ `rg` ∥ `findstr` 的 `path:12: text` 形与尾随冒号一并剥掉
  const token = raw.replace(/[:\-]\d+[:\-]?$/, "").replace(/:+$/, "")
  if (!token) return null
  // ③ 预筛：不含 `/` `\` `.` 的字段不做盘上解析（`[stdout]:` ∥ `(exit code 0)` ∥ 纯数字过不了这一关）
  if (!/[/\\.]/.test(token)) return null
  return token
}

/**
 * 盘上解析（步骤 ④）：驱动绝对形 → MSYS 形 → 相对基准 `base`，取**第一个在盘上存在**者。
 * 三支都不存在 ⇒ null（= 判不了）。UNC（`\\server\share\…`）走驱动绝对形一支。
 * @param {string} token 行进字段（已剥尾）
 * @param {string} [base] 解析基准：`bash` 同步 = `ctx.cwd` ∥ 后台径 = entry 记下的 `cwd` ∥ `execute` = `baseDir`
 * @returns {string|null}
 */
function resolveOnDisk(token, base) {
  const candidates = []
  if (/^[A-Za-z]:[\\/]/.test(token) || token.startsWith("\\\\")) {
    candidates.push(token) // 驱动绝对形 ∥ UNC
  } else {
    // MSYS 形（`/c/teamcode/…`）在 win32 上 `isAbsolute` 也为真，会落成当前盘的 `/c/…`
    // ⇒ 必须显式把首段 `^/([A-Za-z])/` 映射为 `X:/`，否则这一支恒不命中。
    const msys = /^\/([A-Za-z])(\/.*)?$/.exec(token)
    if (msys) candidates.push(`${msys[1].toUpperCase()}:${msys[2] ?? "/"}`)
    else if (isAbsolute(token)) candidates.push(token) // POSIX 绝对形（`resolve` 对绝对参恒等，同一支）
  }
  if (base) candidates.push(resolve(String(base), token))
  for (const c of candidates) if (existsSync(c)) return c
  return null
}

/**
 * 命令面打标（§6.28「命令输出面」六步，`bash` ∥ `execute` ∥ VSC 端 `bash` 共用）：
 * 逐行取行首 token → 真解析到盘上 → 判归属 → 命中者行首加前缀（行其余部分原样）。
 * N > 0 ⇒ 正文之后追加一行汇总；N = 0 ⇒ **原样返回入参**（一个字节不动，无空汇总行）。
 *
 * 纪律：不许按「看起来像路径」打标——解析不到盘上就不标（误标比不标更坏）。
 *
 * @param {string} text 输出文本
 * @param {string} [base] 解析基准（见 `resolveOnDisk`）
 * @returns {string}
 */
export function markProcessDocLines(text, base) {
  const src = String(text ?? "")
  if (!src) return src
  const fileCache = new Map() // 档 → boolean
  const tokenCache = new Map() // token → boolean（一次调用内按 token 记忆；不设解析上限）
  let n = 0
  const out = src.split("\n").map((line) => {
    const token = headPathToken(line)
    if (!token) return line
    let marked = tokenCache.get(token)
    if (marked === undefined) {
      const abs = resolveOnDisk(token, base)
      marked = abs ? isProcessDocPath(abs, fileCache) : false
      tokenCache.set(token, marked)
    }
    if (!marked) return line
    n += 1
    return `${PROCESS_DOC_MARK} ${line}`
  })
  if (n === 0) return src
  const body = out.join("\n")
  return `${body}${body.endsWith("\n") ? "" : "\n"}${processDocSummary(n)}`
}
