#!/usr/bin/env node
/**
 * doc-anchors-core.mjs — 文档锚一致性机检 · VSC 锚引擎（合并仓统一版 · S4 机检单仓化；`doc-anchors.mjs` 判据核）。
 *
 * 来源 = `thincoder-vscode/scripts/check-doc-anchors.mjs`（本仓独立实现 · 语义同源）；判据权威 =
 * `thincoder-vscode/docs/design/DOC-CODE-RECONCILE.md` §4（本档不重述判据——单一权威源）。
 * 判据面 = **存在性**。三类锚：
 *   A1 用例号：`T-…` / 裸 `T<数字>`——**右界强制**（`T-VS3` 不得由 `T-VS32` 满足）；
 *              在册判据 = 目标域 `test/**` 的**用例注册调用**（顶层 `test(` / `slow(` 首参字面量）标题含该 token。
 *   A2 符号：反引号码段内单 token 的**强形态**（camelCase / snake_case / 下划线前缀 / 全大写常量 / 点径首段）；
 *              在册判据 = **合并仓代码面**（`codeRoots` 域集并集）词界命中。
 *   A3 路径：反引号码段内路径 / 裸 `.md` 档名；在册判据 = 台账 L4② **同源判序**（`evidenceState` 单源复用——域内定位）。
 *
 * 预处理（P1–P4）：P1 fenced 块整块跳过 · P2 行内可执行坐标整行跳过（谓词单源 = `check-doc-width.mjs`）·
 * P3 注记行整行跳过（注记**必须携带消解信息**——仅含「已废」二字不构成通过）·
 * P4 夹具 / 引例 token 入 fenced 块或随行携带消解注记（裸写即自命中）。
 * 假阳类逐条排除（八类·零假阳是常驻前提）：设计档内部编号 · 档名主干 · 平台库 API 词表 ·
 * 提交哈希 · 命令字面与 fenced 块 · 合并仓代码面实装符号 · 运行时与示例占位路径 · 平台码。
 * 射程边界（不重复报行）：`.md §N` 可解析性 = V1 面 · 台账 = L1–L4 专判 ·
 * 批次档（时序日志）与归档（历史快照）**不入源域** ⇒ 本检查对上述形态零报。
 * **跨仓面退役（S4）**：对端仓根断言 / 解析 / 自指防护 / 缺仓域外标记——整类删除（设计档 §2.4 R7）。
 * **无基线通道**：本检查器不读也不写任何基线档——不是「默认空」，是通道不存在（阈值 0 的对应实现）。
 * 输出（由 `doc-anchors.mjs` 主行程承载）：逐处 `✗ V5 <档>:<行> [A1|A2|A3] <锚> — 期望 … · 实得 …`；尾行计数；`--json` 机读清单。
 */
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative, resolve, basename } from "node:path"
// P2 谓词单源（与 V5 射程豁免同源）+ 六档并入映射（S4 退场注记语义的机器侧对位）
import { isExecutableLine, MERGED_SCRIPTS } from "./check-doc-width.mjs"
// A3 判序单源：台账机检 L4② 同一函数（不复制实现、不发明第二套定位语义——设计档 D3 / §4.5）
import { evidenceState } from "./check-ledger.mjs"

/** 三类锚（判据面 = 存在性）。 */
export const ANCHOR_KINDS = ["A1", "A2", "A3"]
/** A1 用例号抽取式（右界强制——`T-VS3` 不得由 `T-VS32` 满足）。 */
export const A1_TOKEN_RE = /(?<![A-Za-z0-9_-])T(?:-[A-Za-z]{1,4})?-?\d+(?:[.-]\d+)*[a-z]?(?![A-Za-z0-9_-])/g
/** A1 全形（供 A2 判型前排除——A1 形 token 不入 A2）。 */
export const A1_EXACT_RE = new RegExp(`^(?:${A1_TOKEN_RE.source})$`)
/** A3 抽取式（① 路径形 ② 裸 `.md` 档名；`:行号` / `:行号-行号` 尾不参与存在性判——见 `stripLineNo`）。 */
export const A3_PATH_RE = /^(?:[^\s\/`|()（）,，。；;：:]+\/)+[^\s\/`|()（）,，。；;：:]+\.(?:mjs|js|json|md|css|html)$/
export const A3_BARE_MD_RE = /^[A-Za-z0-9_-][A-Za-z0-9_.-]*\.md$/
/** A2 排除式 ①：带代码 / 文档后缀 ⇒ 归 A3。 */
const CODE_EXT_RE = /\.(?:mjs|js|cjs|json|md|css|html|ts|tsx|yml|yaml|txt|sh)$/
/** A3 排除式 ①：非仓档坐标（运行时 / 用户态 / 依赖面）。 */
export const A3_NON_REPO_FIRST = ["..", "~", ".thincoder", "node_modules", ".git"]
/** A3 排除式 ⑤①：示例占位（段名 / 档名主干——单字符另判）。 */
export const A3_PLACEHOLDER = ["x", "foo", "bar", "path", "to", "name", "notes", "demo", "example"]
/** A3 排除式 ⑤②：段名 / 档名含通配符 `*` 或角括号占位 `<…>`（判据句：命名约定与模板引例——不指向具体现态档件、
 * 存在性无可判面 ⇒ 一律不入判；射程 = 仅及 token 自身形态——出现即排除、无名单、非逐项豁免）。
 * 零报样例（设计档 §4.5 ⑤）：`docs/TODO*.md` · `docs/batches/<批>-<主题>.md` · `src/prompts/advisor-*.md`。 */
export const isGlobOrAnglePlaceholder = (t) => t.split("/").some((s) => s.includes("*") || /<[^>]*>/.test(s))
/** A2 排除式 ④：平台码形态。 */
export const PLATFORM_CODE_RE = /^[A-Z]{2,5}\d{3,}$/
const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", "coverage", ".turbo"])
/** 台账两档（L1–L4 专判面——不入本检查源域，避免重复报行）。 */
export const LEDGER_FILES = ["docs/TODO.md", "docs/TODO-archive.md"]

/**
 * 平台 / 库 API 词表（A2 排除式 ③——判据句：**不是本仓命名空间的名字，不属「本仓自建符号」的定义域**；
 * **非豁免通道**）。派生命名面三类（一条词条 ↔ 一条判据句；扩充须引其一，**不得逐项豁免**）：
 *   ① Node 内置模块面（`node:` 模块导出族）② DOM 接口面（浏览器平台接口）③ `vscode.*` 命名空间（扩展宿主 API）。
 */
export const PLATFORM_API_TERMS = Object.freeze({
  node: Object.freeze([
    "existsSync", "readFileSync", "writeFileSync", "appendFileSync", "mkdirSync", "readdirSync", "statSync",
    "lstatSync", "rmSync", "rmdirSync", "unlinkSync", "copyFileSync", "renameSync", "realpathSync", "opendirSync",
    "createReadStream", "createWriteStream", "pathToFileURL", "fileURLToPath", "builtinModules", "setImmediate",
    "queueMicrotask", "structuredClone", "clearImmediate", "setInterval", "clearInterval", "homedir", "tmpdir",
    "hostname", "execPath", "execArgv", "memoryUsage", "resourceUsage", "emitWarning", "nextTick", "abortSignal",
  ]),
  dom: Object.freeze([
    "preventDefault", "stopPropagation", "stopImmediatePropagation", "addEventListener", "removeEventListener",
    "dispatchEvent", "createElement", "createTextNode", "getElementById", "querySelector", "querySelectorAll",
    "getAttribute", "setAttribute", "removeAttribute", "hasAttribute", "appendChild", "removeChild", "insertBefore",
    "replaceChild", "cloneNode", "scrollIntoView", "requestAnimationFrame", "cancelAnimationFrame",
    "getBoundingClientRect", "createDocumentFragment", "classList", "innerHTML", "textContent", "nodeType",
    "parentNode", "childNodes", "firstChild", "lastChild", "nextSibling", "previousSibling", "ownerDocument",
    "defaultView", "localName", "tagName", "dataTransfer", "clipboardData", "selectionStart", "selectionEnd",
    "setSelectionRange", "isContentEditable", "matchMedia", "getComputedStyle", "createRange", "activeElement",
    "hasFocus", "requestSubmit", "checkValidity", "insertAdjacentHTML", "closest", "getRootNode", "toggleAttribute",
    "scrollTop", "scrollHeight", "clientHeight", "offsetHeight", "pageX", "pageY", "clientX", "clientY",
    "currentTarget", "relatedTarget", "keyCode", "charCode", "isComposing", "getSelection", "setCustomValidity",
    "reportValidity",
  ]),
  vscode: Object.freeze([
    "showInformationMessage", "showWarningMessage", "showErrorMessage", "showQuickPick", "showInputBox",
    "showOpenDialog", "showSaveDialog", "showTextDocument", "registerCommand", "registerWebviewViewProvider",
    "registerTextDocumentContentProvider", "createWebviewPanel", "createOutputChannel", "createStatusBarItem",
    "createDiagnosticsCollection", "createFileSystemWatcher", "createTerminal", "postMessage", "asWebviewUri",
    "withProgress", "openExternal", "getConfiguration", "onDidChangeConfiguration", "onDidChangeTextDocument",
    "onDidChangeActiveTextEditor", "onDidSaveTextDocument", "onDidCloseTextDocument", "workspaceFolders",
    "extensionPath", "extensionUri", "globalState", "workspaceState", "visibleTextEditors", "activeTextEditor",
    "textDocuments", "ThemeIcon", "ThemeColor", "EventEmitter", "CancellationTokenSource", "MarkdownString",
    "RelativePattern", "FileType", "ViewColumn", "StatusBarAlignment", "ConfigurationTarget", "ProgressLocation",
    "ExtensionMode", "ExtensionKind", "TextEdit", "WorkspaceEdit", "SnippetString", "SemanticTokensLegend",
    "DocumentSymbol", "SymbolKind", "InputBoxOptions", "QuickPickItem", "DebugConfigurationProvider",
  ]),
})
/** 词表查询集（三派生面并集——单源落在本档导出常量）。 */
export const PLATFORM_API_SET = new Set([...PLATFORM_API_TERMS.node, ...PLATFORM_API_TERMS.dom, ...PLATFORM_API_TERMS.vscode])

/** 注记关键词（N-1 退场 / N-2 迁移归位 / N-4 夹具引例——三族）。 */
export const NOTE_RE = /(已退场|已废|已废弃|已删除|已移除|已退役|归位|迁移|已迁|改指|原名|原路径|夹具|引例|样例)/
/** 消解信息（判据句：注记必须携带消解信息——仅含「已废」二字不构成通过；N-2 指针形态 = `.md` 或 `<file>:<line>`）。 */
export const NOTE_RESOLUTION_RE = /(删除记录|源\s*=|现体|[A-Za-z0-9_.\/-]+\.md|[A-Za-z0-9_.\/-]+\.[A-Za-z0-9]+:\d+|\d{4}-\d{2}-\d{2}-[A-Za-z]|合成缺失|零报样例|清账对象|名录|不在册|两仓皆无|已退场名|反证)/
/** 注记行整行跳过（P3——关键词 ∧ 消解信息）。 */
export const isNoteLine = (line) => NOTE_RE.test(line) && NOTE_RESOLUTION_RE.test(line)
/** `:行号` / `:行号-行号` 尾（行号与区间均不参与 A3 存在性判）。 */
export const stripLineNo = (t) => t.replace(/:\d+(?:-\d+)?$/, "")

/** A2 强形态判据（须命中其一）。 */
export function isStrongSymbol(t) {
  if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(t)) {
    if (/[a-z][A-Z]/.test(t)) return true // camelCase（含 ≥1 处小写→大写跃迁）
    if (t.startsWith("_")) return true // 下划线前缀
    if (/^[a-z][a-z0-9]*(?:_[a-z0-9]+)+$/.test(t)) return true // snake_case
    if (/^[A-Z][A-Z0-9_]{3,}$/.test(t)) return true // 全大写常量
  }
  if (/^[A-Za-z_$][A-Za-z0-9_$]*\.[A-Za-z_$][A-Za-z0-9_$]*$/.test(t)) return true // 点径（判首段）
  return false
}

/** A2 排除式逐条（① 归 A3 ② 档名主干 ③ 平台 / 库 API 词表 ④ 平台码 ⑤ 通用词与字面量）。 */
export function a2Excluded(t, ctx) {
  const t0 = t.split(".")[0]
  if (t.includes("/")) return true // ①
  if (CODE_EXT_RE.test(t)) return true // ①
  if (ctx.docStems.has(t) || ctx.docStems.has(t0)) return true // ②
  if (PLATFORM_API_SET.has(t) || PLATFORM_API_SET.has(t0)) return true // ③
  if (PLATFORM_CODE_RE.test(t)) return true // ④
  if (t0.length < 3) return true // ⑤
  if (/^[a-z][a-z0-9]*$/.test(t0)) return true // ⑤ 纯小写单词
  if (/^(?:true|false|null|undefined|NaN|Infinity|constructor|prototype)$/.test(t0)) return true // ⑤ 字面量
  return false
}

/** A3 排除式逐条（①⑤⑥ token 面——②③④ 为行级判，见 `checkAnchors`）。 */
export function a3Excluded(tok, ctx) {
  const bare = stripLineNo(tok)
  const segs = bare.split("/")
  if (A3_NON_REPO_FIRST.includes(segs[0])) return true // ① 运行时 / 用户态 / 依赖面
  if (ctx.repoNames.includes(segs[0])) return true // ② 带域前缀（跨产品引用——不入本域判）
  if (segs[0].startsWith("-")) return true // ⑥ 并列斜杠书写伪影
  if (isGlobOrAnglePlaceholder(bare)) return true // ⑤② 通配 / 角括号占位（出现即排除、无名单、非逐项豁免）
  const stems = [...segs.slice(0, -1), basename(bare).replace(/\.[^.]+$/, "")]
  return stems.some((s) => s.length === 1 || A3_PLACEHOLDER.includes(s)) // ⑤① 示例占位
}

/**
 * 抽取器（**单源**——V5 与层 3 反查共用；强形态 + 排除式同一实现）。
 * `codeSpans` = true：A2 / A3 只取行内反引号码段；false：全行逐词（供 diff 行抽取）。
 * 返回 `[{kind, token, after}]`（`after` = 该 token 之后的行内余文——供 A3 域别注记判）。
 */
export function extractTokens(text, ctx = { docStems: new Set(), repoNames: [] }, { codeSpans = false } = {}) {
  const out = []
  for (const m of text.matchAll(A1_TOKEN_RE)) out.push({ kind: "A1", token: m[0], after: "" })
  const cands = codeSpans
    ? [...text.matchAll(/`([^`\n]+)`/g)].map((m) => ({ s: m[1].trim(), after: text.slice(m.index + m[0].length) }))
    : text.split(/[\s,;:()[\]{}"'`|]+/).filter(Boolean).map((s) => ({ s, after: "" }))
  for (const c of cands) {
    const s = c.s
    if (!s || /\s/.test(s)) continue
    if (A1_EXACT_RE.test(s)) continue // A1 形 token 不入 A2 / A3
    const bare = stripLineNo(s)
    if (A3_PATH_RE.test(bare) || A3_BARE_MD_RE.test(bare)) {
      if (!a3Excluded(bare, ctx)) out.push({ kind: "A3", token: bare, after: c.after })
      continue
    }
    if (isStrongSymbol(s) && !a2Excluded(s, ctx)) out.push({ kind: "A2", token: s, after: c.after })
  }
  return out
}

/** 源域（被检文档）：本域 docs 树全量 .md − 归档（历史快照）− 批档（时序日志）− 台账两档（L1–L4 专判）。 */
export function collectSourceDomain(root) {
  const out = []
  const walk = (dir) => {
    let names = []
    try { names = readdirSync(dir) } catch { return }
    for (const n of names) {
      if (SKIP_DIRS.has(n)) continue
      const p = join(dir, n)
      let st
      try { st = statSync(p) } catch { continue }
      if (st.isDirectory()) walk(p)
      else if (n.endsWith(".md")) out.push(p)
    }
  }
  walk(join(root, "docs"))
  const keep = (p) => {
    const rel = relative(root, p).replace(/\\/g, "/")
    if (rel.split("/").includes("_archive")) return false
    if (rel === "docs/batches" || rel.startsWith("docs/batches/")) return false
    return !LEDGER_FILES.includes(rel)
  }
  return out.filter(keep).sort()
}

/** 档名主干集合（A2 排除式 ②——本域 `docs/` 树任一 `.md` 档名去后缀）。 */
export function collectDocStems(root) {
  const stems = new Set()
  const walk = (dir) => {
    let names = []
    try { names = readdirSync(dir) } catch { return }
    for (const n of names) {
      if (SKIP_DIRS.has(n)) continue
      const p = join(dir, n)
      let st
      try { st = statSync(p) } catch { continue }
      if (st.isDirectory()) walk(p)
      else if (n.endsWith(".md")) stems.add(n.slice(0, -3))
    }
  }
  walk(join(root, "docs"))
  return stems
}

/** 代码面标识符集（A2 在册判据：词界命中 ⇔ 标识符集含该名）。 */
export function collectCodeTokens(root, dirs = ["src", "webview", "scripts", "test"], files = ["extension.mjs"]) {
  const set = new Set()
  const add = (p) => {
    let text = ""
    try { text = readFileSync(p, "utf8") } catch { return }
    for (const m of text.matchAll(/[A-Za-z_$][A-Za-z0-9_$]*/g)) set.add(m[0])
  }
  const walk = (dir) => {
    let names = []
    try { names = readdirSync(dir) } catch { return }
    for (const n of names) {
      if (SKIP_DIRS.has(n)) continue
      const p = join(dir, n)
      let st
      try { st = statSync(p) } catch { continue }
      if (st.isDirectory()) walk(p)
      else if (/\.(?:mjs|js|cjs|json)$/.test(n)) add(p)
    }
  }
  for (const d of dirs) walk(join(root, d))
  for (const f of files) add(join(root, f))
  return set
}

/** 合并仓代码面（A2 在册判据域）：各域代码树并集（判据句 = 仓内实装；两仓合并后「对端」并入仓内）。 */
export function collectCodeTokensFor(roots) {
  const set = new Set()
  for (const r of roots) for (const t of collectCodeTokens(r)) set.add(t)
  return set
}

/** 读一个字面量串（`"` / `'` / `` ` `` 起始；未闭合 → null）。 */
function readLiteral(text, i) {
  const q = text[i]
  if (q !== '"' && q !== "'" && q !== "`") return null
  let out = ""
  for (let k = i + 1; k < text.length; k++) {
    const c = text[k]
    if (c === "\\") { out += text[k + 1] ?? ""; k++; continue }
    if (c === q) return out
    if (c === "\n" && q !== "`") return null
    out += c
  }
  return null
}
/** A1 目标域：`test/**` 的用例注册调用（顶层 `test(` / `slow(`）首参字面量 = 用例标题集。 */
export function collectCaseTitles(testRoot) {
  const titles = []
  const walk = (dir) => {
    let names = []
    try { names = readdirSync(dir) } catch { return }
    for (const n of names) {
      if (SKIP_DIRS.has(n)) continue
      const p = join(dir, n)
      let st
      try { st = statSync(p) } catch { continue }
      if (st.isDirectory()) walk(p)
      else if (/\.(?:mjs|js|cjs)$/.test(n)) {
        let text = ""
        try { text = readFileSync(p, "utf8") } catch { continue }
        for (const m of text.matchAll(/(?<![A-Za-z0-9_$])(?:test|slow)\s*\(/g)) {
          const lit = readLiteral(text, m.index + m[0].length)
          if (lit) titles.push(lit)
        }
      }
    }
  }
  walk(testRoot)
  return titles
}
/** A1 在册判据：某用例标题含该 token（**右界判**——`T-VS3` 不得由 `T-VS32` 满足）。 */
export function caseTokenExists(titles, token) {
  const esc = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const re = new RegExp(`(?<![A-Za-z0-9_-])${esc}(?![A-Za-z0-9_-])`)
  return titles.some((t) => re.test(t))
}

/** 症状串（固定——设计档 §4.10）。 */
export const SYMPTOM = {
  A1: "用例号锚不在册（test/ 树无此用例号）",
  A2: "符号锚不在册（合并仓代码面无此名）",
  A3: "路径锚不可定位（本仓现态面不可解析）",
}
export const EXPECT = { A1: "用例标题在册（test/ 树）", A2: "合并仓代码面在册", A3: "本仓现态面可解析" }

/**
 * V5 机检（VSC 锚引擎）。返回 `{mode, sourceDomain, counts:{total,distinct,A1,A2,A3}, hits:[…]}`。
 * `codeRoots` = 合并仓代码面域集（缺省 = 本域）；`repoNames` = A3 域前缀排除集（缺省 = 本域目录名）。
 */
export function checkAnchors({ root = process.cwd(), docs = null, mode = "report", codeRoots = null, repoNames = null, repoRoot = null } = {}) {
  const own = resolve(root)
  const repo = resolve(repoRoot ?? own) // 合并仓根（六档并入映射的解析基点）
  const targets = docs ?? collectSourceDomain(own)
  const ctx = { docStems: collectDocStems(own), repoNames: repoNames ?? [basename(own)] }
  const faceTokens = collectCodeTokensFor([...new Set([...(codeRoots?.length ? codeRoots.map((r) => resolve(r)) : []), own, repo])])
  const titles = collectCaseTitles(join(own, "test"))
  const evCache = {}
  const hits = []
  const seen = new Set()
  const push = (file, line, kind, anchor, got) => {
    const key = `${file}|${line}|${kind}|${anchor}`
    if (seen.has(key)) return
    seen.add(key)
    hits.push({ file, line, kind, anchor, symptom: SYMPTOM[kind], expect: EXPECT[kind], got: got ?? "" })
  }
  for (const p of targets) {
    const rel = relative(own, p).replace(/\\/g, "/")
    let fence = false
    readFileSync(p, "utf8").split("\n").forEach((line, i) => {
      const n = i + 1
      if (/^\s*(?:```|~~~)/.test(line)) { fence = !fence; return } // P1
      if (fence) return
      if (isExecutableLine(line)) return // P2
      if (isNoteLine(line)) return // P3
      for (const a of extractTokens(line, ctx, { codeSpans: true })) {
        if (a.kind === "A1") {
          if (!caseTokenExists(titles, a.token)) push(rel, n, "A1", a.token, "test/ 树无此用例号")
        } else if (a.kind === "A2") {
          const t0 = a.token.split(".")[0]
          if (!faceTokens.has(t0)) push(rel, n, "A2", a.token, "合并仓代码面无此名")
        } else {
          if (a.token.endsWith(".md") && /§\s*\d/.test(line)) continue // A3 排除式 ③ 归 V1（`.md` token 才免判——不重复报行）
          if (/^[（(][^（）()]{0,12}仓[）)]/.test(a.after ?? "")) continue // A3 排除式 ④ E3 允许形态（归域别注记面）
          const mapped = MERGED_SCRIPTS[basename(a.token)]
          if (mapped && statSync(join(repo, "scripts", mapped), { throwIfNoEntry: false })?.isFile()) continue // 六档并入映射（旧档名 → 仓根统一版）
          const why = evidenceState(own, a.token, evCache)
          if (why) push(rel, n, "A3", a.token, why)
        }
      }
    })
  }
  const counts = { total: hits.length, distinct: new Set(hits.map((h) => h.anchor)).size, A1: 0, A2: 0, A3: 0 }
  for (const h of hits) counts[h.kind]++
  return { mode, sourceDomain: targets.length, counts, hits }
}
