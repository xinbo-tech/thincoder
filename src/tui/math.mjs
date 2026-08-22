/**
 * math.mjs — LaTeX → Unicode approximation for the TUI display layer (IK9IXD).
 *
 * Zero dependencies, pure functions, no ANSI output. A table-driven subset
 * converter turns closed `$...$` (inline) and `$$...$$` (block) formula spans
 * into readable Unicode (x̂, σᵢ, ∑, (a)/(b), …). Unknown LaTeX commands stay
 * as-is — display-only, semantics untouched. Streaming safety: unclosed
 * `$`/`$$` spans are left untouched (markdown.mjs unclosed-marker parity).
 *
 * Pipeline contract (render-conversation.mjs): math runs BEFORE markdown and
 * BEFORE wrapping — math treats `$...$`/`$$...$$` as opaque (no markdown
 * inside), backtick code spans are opaque to math (code is literal).
 */

// ─── token tables (design: TUI.md §9.1D) ────────────────────────────────

/** Command → literal text (operators, functions, spacing). */
const DIRECT = new Map([
  // functions keep their name as text
  ["min", "min"], ["max", "max"], ["log", "log"], ["ln", "ln"], ["exp", "exp"], ["lim", "lim"],
  // operators
  ["sum", "∑"], ["prod", "∏"], ["int", "∫"],
  ["pm", "±"], ["mp", "∓"], ["times", "×"], ["cdot", "·"], ["div", "÷"],
  ["le", "≤"], ["ge", "≥"], ["ne", "≠"], ["approx", "≈"], ["equiv", "≡"],
  ["propto", "∝"], ["in", "∈"], ["notin", "∉"], ["infty", "∞"],
  ["to", "→"], ["rightarrow", "→"], ["partial", "∂"], ["nabla", "∇"],
  ["forall", "∀"], ["exists", "∃"], ["cdots", "⋯"], ["ldots", "…"],
  // spacing
  ["quad", "  "], ["qquad", "    "], [",", " "], [";", " "],
])

/** Greek letters, lower + upper. */
const GREEK = new Map([
  ["alpha", "α"], ["beta", "β"], ["gamma", "γ"], ["delta", "δ"], ["epsilon", "ε"],
  ["zeta", "ζ"], ["eta", "η"], ["theta", "θ"], ["iota", "ι"], ["kappa", "κ"],
  ["lambda", "λ"], ["mu", "μ"], ["nu", "ν"], ["xi", "ξ"], ["omicron", "ο"],
  ["pi", "π"], ["rho", "ρ"], ["sigma", "σ"], ["tau", "τ"], ["upsilon", "υ"],
  ["phi", "φ"], ["chi", "χ"], ["psi", "ψ"], ["omega", "ω"],
  ["Alpha", "Α"], ["Beta", "Β"], ["Gamma", "Γ"], ["Delta", "Δ"], ["Epsilon", "Ε"],
  ["Zeta", "Ζ"], ["Eta", "Η"], ["Theta", "Θ"], ["Iota", "Ι"], ["Kappa", "Κ"],
  ["Lambda", "Λ"], ["Mu", "Μ"], ["Nu", "Ν"], ["Xi", "Ξ"], ["Omicron", "Ο"],
  ["Pi", "Π"], ["Rho", "Ρ"], ["Sigma", "Σ"], ["Tau", "Τ"], ["Upsilon", "Υ"],
  ["Phi", "Φ"], ["Chi", "Χ"], ["Psi", "Ψ"], ["Omega", "Ω"],
])

/** One-arg accent commands: argument + combining mark. */
const ACCENTS = new Map([
  ["hat", "\u0302"], // U+0302 combining circumflex
  ["bar", "\u0304"], // U+0304 combining macron
  ["vec", "\u20d7"], // U+20D7 combining right arrow above
])

/** Single-char subscript Unicode mapping (common subset). */
const SUBSCRIPT = new Map([
  ["0", "₀"], ["1", "₁"], ["2", "₂"], ["3", "₃"], ["4", "₄"],
  ["5", "₅"], ["6", "₆"], ["7", "₇"], ["8", "₈"], ["9", "₉"],
  ["a", "ₐ"], ["e", "ₑ"], ["h", "ₕ"], ["i", "ᵢ"], ["j", "ⱼ"], ["k", "ₖ"],
  ["l", "ₗ"], ["m", "ₘ"], ["n", "ₙ"], ["o", "ₒ"], ["p", "ₚ"], ["r", "ᵣ"],
  ["s", "ₛ"], ["t", "ₜ"], ["u", "ᵤ"], ["v", "ᵥ"], ["x", "ₓ"],
])

/** Single-char superscript Unicode mapping (common subset). */
const SUPERSCRIPT = new Map([
  ["0", "⁰"], ["1", "¹"], ["2", "²"], ["3", "³"], ["4", "⁴"],
  ["5", "⁵"], ["6", "⁶"], ["7", "⁷"], ["8", "⁸"], ["9", "⁹"],
  ["+", "⁺"], ["-", "⁻"], ["=", "⁼"], ["(", "⁽"], [")", "⁾"],
  ["a", "ᵃ"], ["b", "ᵇ"], ["c", "ᶜ"], ["d", "ᵈ"], ["e", "ᵉ"], ["f", "ᶠ"],
  ["g", "ᵍ"], ["h", "ʰ"], ["i", "ⁱ"], ["j", "ʲ"], ["k", "ᵏ"], ["l", "ˡ"],
  ["m", "ᵐ"], ["n", "ⁿ"], ["o", "ᵒ"], ["p", "ᵖ"], ["r", "ʳ"], ["s", "ˢ"],
  ["t", "ᵗ"], ["u", "ᵘ"], ["v", "ᵛ"], ["w", "ʷ"], ["x", "ˣ"], ["y", "ʸ"], ["z", "ᶻ"],
])

const CMD_RE = /^\\[a-zA-Z]+/

/** Commands that produce explicit whitespace (LaTeX math mode: ordinary spaces
 *  around them collapse into the explicit spacing — T5 `\quad` → exactly 2 spaces). */
const SPACE_PRODUCING = new Set(["quad", "qquad", ",", ";", " "])

/** Non-letter commands after the backslash (control space `\ `, thin spaces `\,`/`\;`). */
const CHAR_COMMANDS = new Map([
  [" ", " "], // LaTeX control space
  [",", " "], [";", " "],
])

/** Index after the matching `}` for src[i] === "{" (nested-aware); null when unclosed. */
function matchBraced(src, i) {
  let depth = 0
  for (let j = i; j < src.length; j++) {
    if (src[j] === "{") depth++
    else if (src[j] === "}") {
      depth--
      if (depth === 0) return j + 1
    }
  }
  return null
}

/** One LaTeX argument: a `{...}` group or a single char. Returns { text, next } or null. */
function parseArg(src, i) {
  if (i >= src.length) return null
  if (src[i] === "{") {
    const end = matchBraced(src, i)
    if (end == null) return null
    return { text: src.slice(i + 1, end - 1), next: end }
  }
  return { text: src[i], next: i + 1 }
}

/**
 * Convert one LaTeX command starting at src[i] === "\\".
 * Returns { text, next } when handled; null → caller copies the backslash verbatim
 * (unknown commands stay as-is, backslash + name + braced args included).
 */
function convertCommand(src, i) {
  const m = CMD_RE.exec(src.slice(i))
  if (!m) {
    // Non-letter command: `\,` / `\;` / control space `\ ` → single space.
    const ch = src[i + 1]
    if (ch !== undefined && CHAR_COMMANDS.has(ch)) return { text: CHAR_COMMANDS.get(ch), next: i + 2, space: true }
    return null
  }
  const cmd = m[0].slice(1)
  const next = i + 1 + cmd.length

  if (DIRECT.has(cmd)) return { text: DIRECT.get(cmd), next, space: SPACE_PRODUCING.has(cmd) }
  if (GREEK.has(cmd)) return { text: GREEK.get(cmd), next }
  if (cmd === "frac") {
    const a1 = parseArg(src, next)
    if (!a1) return null
    const a2 = parseArg(src, a1.next)
    if (!a2) return null
    return { text: `(${convertFormula(a1.text)})/(${convertFormula(a2.text)})`, next: a2.next }
  }
  if (cmd === "sqrt") {
    const a = parseArg(src, next)
    if (!a) return null
    return { text: `√(${convertFormula(a.text)})`, next: a.next }
  }
  if (cmd === "text") {
    const a = parseArg(src, next)
    if (!a) return null
    return { text: a.text, next: a.next } // content verbatim
  }
  if (ACCENTS.has(cmd)) {
    const a = parseArg(src, next)
    if (!a) return null
    return { text: convertFormula(a.text) + ACCENTS.get(cmd), next: a.next }
  }
  if (cmd === "left" || cmd === "right") {
    const nch = src[next]
    if (nch === "(" || nch === ")") return { text: nch, next: next + 1 }
  }
  // Unknown command: keep verbatim — name + any braced args (design: unknown stays
  // as-is including backslash and arguments).
  let end = next
  let text = "\\" + cmd
  while (end < src.length && src[end] === "{") {
    const close = matchBraced(src, end)
    if (close == null) break
    text += src.slice(end, close)
    end = close
  }
  return { text, next: end }
}

/** Sub/superscript at src[i] ("_" or "^"). Returns { text, next } or null (keep char as-is). */
function convertScript(src, i) {
  const ch = src[i]
  const isSup = ch === "^"
  const table = isSup ? SUPERSCRIPT : SUBSCRIPT
  const wrap = ch
  if (src[i + 1] === "{") {
    const end = matchBraced(src, i + 1)
    if (end != null) return { text: `${wrap}(${convertFormula(src.slice(i + 2, end - 1))})`, next: end }
    return null
  }
  if (i + 1 < src.length) {
    const nch = src[i + 1]
    const mapped = table.get(nch)
    // Single char with a Unicode script char → direct; without → keep paren form.
    return mapped !== undefined ? { text: mapped, next: i + 2 } : { text: `${wrap}(${nch})`, next: i + 2 }
  }
  return null
}

/** Table-driven subset converter for one closed formula body (exported for unit tests). */
export function convertFormula(src) {
  let out = ""
  let i = 0
  while (i < src.length) {
    const ch = src[i]
    if (ch === "\\") {
      const handled = convertCommand(src, i)
      if (handled) {
        if (handled.space) {
          // Explicit LaTeX spacing: ordinary spaces AROUND it collapse into it
          // (math-mode semantics — `\quad` alone contributes exactly its width).
          out = out.replace(/\s+$/, "")
          out += handled.text
          let j = handled.next
          while (j < src.length && /\s/.test(src[j])) j++
          i = j
          continue
        }
        out += handled.text
        i = handled.next
        continue
      }
      out += "\\" // unknown escape — copy verbatim, following chars flow through
      i++
      continue
    }
    if (ch === "_" || ch === "^") {
      const handled = convertScript(src, i)
      if (handled) {
        out += handled.text
        i = handled.next
        continue
      }
      out += ch
      i++
      continue
    }
    out += ch
    i++
  }
  return out
}

// ─── span scanning ──────────────────────────────────────────────────────

/** Convert closed `$...$` spans in one line (no cross-line pairing). */
function convertInlineSegments(seg) {
  let out = ""
  let i = 0
  while (i < seg.length) {
    if (seg[i] !== "$") {
      out += seg[i]
      i++
      continue
    }
    if (seg[i + 1] === "$") {
      out += "$$" // leftover (unmatched) block markers — never inline delimiters
      i += 2
      continue
    }
    // Find a closing single $ (a $ adjacent to another $ is part of a $$ pair — skip).
    let close = -1
    for (let j = i + 1; j < seg.length; j++) {
      if (seg[j] !== "$") continue
      if (seg[j + 1] === "$" || seg[j - 1] === "$") continue
      close = j
      break
    }
    if (close === -1) {
      out += seg.slice(i) // unclosed — keep verbatim (streaming safety)
      break
    }
    out += convertFormula(seg.slice(i + 1, close))
    i = close + 1
  }
  return out
}

/** Convert closed `$$...$$` spans (cross-line OK). `\\` inside a span keeps line semantics. */
function convertBlockSegments(seg) {
  let out = ""
  let i = 0
  while (i < seg.length) {
    if (seg[i] !== "$" || seg[i + 1] !== "$") {
      out += seg[i]
      i++
      continue
    }
    const close = seg.indexOf("$$", i + 2)
    if (close === -1) {
      out += seg.slice(i) // unclosed — keep verbatim (streaming safety)
      break
    }
    const inner = seg.slice(i + 2, close)
    // `\\` → per-line approximation (multi-line preserved; single-line otherwise).
    out += inner.split("\\\\").map(convertFormula).join("\n")
    i = close + 2
  }
  return out
}

/** Backtick split helper (markdown.mjs code-span parity): odd segments are code — opaque. */
function convertEvenSegments(text, fn) {
  const parts = text.split("`")
  for (let p = 0; p < parts.length; p += 2) parts[p] = fn(parts[p])
  return parts.join("`")
}

/**
 * Convert closed block-level `$$...$$` spans (cross-line) to Unicode approximation.
 * Backtick code spans are opaque (code is literal). Unclosed `$$` stays as-is.
 */
export function renderMathBlock(text) {
  return convertEvenSegments(text, convertBlockSegments)
}

/**
 * Convert closed inline `$...$` spans (single line each) to Unicode approximation.
 * Backtick code spans are opaque. Unclosed `$` stays as-is.
 */
export function renderMathInline(text) {
  return convertEvenSegments(text, (seg) => seg.split("\n").map(convertInlineSegments).join("\n"))
}
