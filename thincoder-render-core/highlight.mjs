/**
 * highlight.js — zero-dependency syntax highlighter
 * Produces tokenized HTML: <span class="tk-kw">const</span> etc.
 */
// ─── Language definitions ────────────────────────────────

const LANGS = {
  js: {
    keywords: "break case catch class const continue debugger default delete do else export extends finally for function if import in instanceof let new of return super switch this throw try typeof var void while with yield async await from static get set".split(" "),
    types: "Boolean Number String Array Object Date RegExp Error Map Set Promise Symbol Int8Array Uint8Array".split(" "),
  },
  ts: {
    keywords: "break case catch class const continue debugger default delete do else export extends finally for function if import in instanceof let new of return super switch this throw try typeof var void while with yield async await from static get set interface type enum namespace declare abstract implements".split(" "),
    types: "Boolean Number String Array Object Date RegExp Error Map Set Promise Symbol string number boolean any never unknown void".split(" "),
  },
  json: { keywords: [], types: [] },
  css: {
    keywords: [],
    types: [],
    atRules: "media keyframes import charset font-face supports".split(" "),
    props: "color background margin padding border font display position width height top left right bottom opacity z-index flex grid align justify transform transition animation".split(" "),
  },
  html: { keywords: [], types: [] },
  py: {
    keywords: "and as assert break class continue def del elif else except False finally for from global if import in is lambda None nonlocal not or pass raise return True try while with yield async await".split(" "),
    types: "int float str list dict tuple set bool bytes".split(" "),
  },
  sh: { keywords: "if then else elif fi for while do done case esac in function return exit export source".split(" "), types: [] },
  md: { keywords: [], types: [] },
  sql: { keywords: "select from where insert update delete create drop alter table index into values set join left right inner outer on and or not null primary key foreign references group by order having limit offset union all distinct".split(" "), types: [] },
}

// ─── Core tokenizer ───────────────────────────────────────

/** Tokenize source code into [{type, value}] array */
export function tokenize(code, lang) {
  const L = LANGS[lang] || LANGS.js
  const tokens = []
  let i = 0, n = code.length

  while (i < n) {
    // Whitespace
    if (/\s/.test(code[i])) {
      let j = i
      while (j < n && /\s/.test(code[j])) j++
      tokens.push({ type: "plain", value: code.slice(i, j) })
      i = j
      continue
    }
    // Line comment (// or # or --)
    if ((code[i] === "/" && code[i + 1] === "/") || code[i] === "#" || (code[i] === "-" && code[i + 1] === "-")) {
      let j = i
      while (j < n && code[j] !== "\n") j++
      tokens.push({ type: "comment", value: code.slice(i, j) })
      i = j
      continue
    }
    // Block comment /* ... */
    if (code[i] === "/" && code[i + 1] === "*") {
      let j = i + 2
      while (j < n && !(code[j] === "*" && code[j + 1] === "/")) j++
      tokens.push({ type: "comment", value: code.slice(i, j + 2) })
      i = j + 2
      continue
    }
    // Template literal `...`
    if (code[i] === "`") {
      let j = i + 1
      while (j < n && code[j] !== "`") {
        if (code[j] === "\\") j++
        j++
      }
      tokens.push({ type: "string", value: code.slice(i, j + 1) })
      i = j + 1
      continue
    }
    // String "..."
    if (code[i] === '"') {
      let j = i + 1
      while (j < n && code[j] !== '"') {
        if (code[j] === "\\") j++
        j++
      }
      tokens.push({ type: "string", value: code.slice(i, j + 1) })
      i = j + 1
      continue
    }
    // String '...'
    if (code[i] === "'") {
      let j = i + 1
      while (j < n && code[j] !== "'") {
        if (code[j] === "\\") j++
        j++
      }
      tokens.push({ type: "string", value: code.slice(i, j + 1) })
      i = j + 1
      continue
    }
    // Number
    if (/[0-9]/.test(code[i]) || (code[i] === "." && /[0-9]/.test(code[i + 1]))) {
      let j = i
      while (j < n && /[0-9a-fA-FxX._]/.test(code[j])) j++
      tokens.push({ type: "number", value: code.slice(i, j) })
      i = j
      continue
    }
    // Word (identifier, keyword, type)
    if (/[a-zA-Z_$]/.test(code[i])) {
      let j = i
      while (j < n && /[a-zA-Z0-9_$-]/.test(code[j])) j++
      const word = code.slice(i, j)
      const lower = word.toLowerCase()
      if (L.keywords.includes(lower)) tokens.push({ type: "keyword", value: word })
      else if (L.types.includes(lower)) tokens.push({ type: "type", value: word })
      else tokens.push({ type: "plain", value: word })
      i = j
      continue
    }
    // CSS: .class or #id
    if (lang === "css" && (code[i] === "." || code[i] === "#")) {
      let j = i + 1
      while (j < n && /[a-zA-Z0-9_-]/.test(code[j])) j++
      if (j > i + 1) {
        tokens.push({ type: code[i] === "." ? "class" : "id", value: code.slice(i, j) })
        i = j
        continue
      }
    }
    // CSS @-rules
    if (lang === "css" && code[i] === "@") {
      let j = i + 1
      while (j < n && /[a-zA-Z-]/.test(code[j])) j++
      const word = code.slice(i + 1, j)
      if (L.atRules?.includes(word)) tokens.push({ type: "atrule", value: code.slice(i, j) })
      else tokens.push({ type: "plain", value: code.slice(i, j) })
      i = j
      continue
    }
    // CSS properties
    if (lang === "css" && /[a-z-]/.test(code[i])) {
      let j = i
      while (j < n && /[a-zA-Z-]/.test(code[j])) j++
      const word = code.slice(i, j)
      // Check for CSS property (ends with :)
      let k = j
      while (k < n && /\s/.test(code[k])) k++
      if (code[k] === ":" && L.props?.includes(word)) {
        tokens.push({ type: "property", value: code.slice(i, j) })
        i = j
        continue
      }
    }
    // Operator / punctuation — single char fallback
    tokens.push({ type: "plain", value: code[i] })
    i++
  }
  return tokens
}

// ─── HTML generation ──────────────────────────────────────

const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }

/** Convert tokens to syntax-highlighted HTML */
export function highlight(code, lang) {
  if (!code) return ""
  if (!LANGS[lang]) lang = "js"
  const tokens = tokenize(code, lang)
  let out = ""
  for (const t of tokens) {
    const cls = t.type === "plain" ? "" : ` class="tk-${t.type}"`
    const val = t.value.replace(/[&<>"]/g, c => ESC[c])
    out += cls ? `<span${cls}>${val}</span>` : val
  }
  return out
}

/** Map a fenced-code-block language string to our language key */
export function normalizeLang(lang) {
  if (!lang) return "js"
  const l = lang.toLowerCase()
  const map = {
    javascript: "js", js: "js", mjs: "js", cjs: "js", jsx: "js",
    typescript: "ts", ts: "ts", tsx: "ts", mts: "ts", cts: "ts",
    json: "json", jsonc: "json",
    css: "css", scss: "css", less: "css",
    html: "html", xml: "html", svg: "html",
    python: "py", py: "py", py3: "py",
    bash: "sh", sh: "sh", shell: "sh", zsh: "sh", console: "sh",
    markdown: "md", md: "md",
    sql: "sql",
    diff: "js", patch: "js", plaintext: "js", text: "js",
    yaml: "js", toml: "js", ini: "js", env: "js",
    dockerfile: "sh", makefile: "sh",
    java: "js", c: "js", cpp: "js", go: "js", rust: "js", ruby: "js", php: "js", swift: "js", kotlin: "js",
  }
  return map[l] || "js"
}
