/**
 * live-scan.mjs — 增量 md 冻结切点扫描器（核件 · 单源 = `docs/render-core/design/RENDER-CORE.md` §2 KD-RC-10）：
 *   `liveCut(raw, from = 0) → { cut, blockStart, inline }` —— 纯件（零 DOM ∕ 零 md 依赖）：保守：只放行「可证」的
 *   切点，其余留热区；`tailHeadEnd(text, cut)` = 热区行内有效前缀界（画件分片输入）。
 *
 * 切点规则（保守律 —— 全部「可证才放行」，未证者留热）：
 *   · 块界 = `\n\n+` 串（整串消费完 ∧ 后随非换行）；前一行为「消费换行行」（列表 ∕ 引用 ∕ 表格）⇒ 串长须 ≥ 3
 *     （该行构造匹配会吃掉一枚换行 ⇒ 至少两枚须存活，否则段结构跨界合并，与核 md 全量分片不等）。
 *   · 段内 = 行内构造「完整闭合于冻结区之内」的位置；未证者退点；星构造行界后「死亡」（换行后无法再配对 ⇒
 *     按字面已闭）；行首块标记未定型 ∕ 已定块行 ∕ 围栏（行内任意位置）⇒ 段内切点至多其起点。
 *   · 边界 = 冻结末字符与热区首字符的跨界再解释禁列（尾转义 ∕ 星串邻接 ∕ 尾换行串 ∕ 尾波浪串 ∕ 尾反引）。
 *   · 病态边界：长未闭构造期间帧成本退全量 md 同阶（登记 · KD-RC-10）。
 */

// ─── 行内构造跳进（核 md 正则语义；limit = 冻结区上界，闭合须整体在区内）────────

const WORD_RE = /[A-Za-z0-9_]/
const BODY_RE = /[*`~\n]/

/** 围栏（` ```(\w*)\n … ``` `）：>0 = 闭（跳进位）；-1 = 未证（开而未闭 ∕ 闭在区外 ∕ 词串到文末待定语）；0 = 非围栏。 */
function fenceAt(text, i, limit) {
  const n = text.length
  let run = 0
  while (i + run < n && text[i + run] === "`") run += 1
  if (i + run >= n) return -1 // 串抵文末：未来一字可续长 ⇒ 围栏形态未定 ⇒ 未证
  if (run < 3) return 0
  const open = i + run - 3
  let k = open + 3
  while (k < n && WORD_RE.test(text[k])) k += 1
  if (k >= n) return -1 // 词串到文末：未来一 \n 即成围栏 ⇒ 未证
  if (text[k] !== "\n") return 0
  const close = text.indexOf("```", k + 1)
  if (close < 0 || close + 3 > limit) return -1
  return close + 3
}

/** 代码段（`` `([^`]+)` ``）：>0 跳进；-1 = 未证（含闭在区外）；0 = 该位非开引（惰性跳一位）。 */
function codeSpanAt(text, i, limit) {
  const n = text.length
  if (i + 1 >= n) return -1 // 内容首字未定 ⇒ 未证
  if (text[i + 1] === "`") return 0
  let j = i + 1
  while (j < n && text[j] !== "`") j += 1
  if (j >= n || j + 1 > limit) return -1
  let r2 = 0
  while (j + r2 < n && text[j + r2] === "`") r2 += 1
  if (r2 >= 3 || j + r2 >= n) return -1 // 闭引在围栏串内 ∕ 抵文末（串可续长）⇒ 未证
  return j + 1
}

/** 星串（白名单：等长 1∕2∕3 串成对 ∧ 内容非空 ∕ 无星 ∕ 无换行；行界之后 = 死亡 ⇒ 按字面已闭）：
 *  >0 跳进；-1 = 未证；0 = 该串按字面闭（跳至串尾）。 */
function starSpanAt(text, i, limit) {
  const n = text.length
  let len = 0
  while (i + len < n && text[i + len] === "*") len += 1
  const runEnd = i + len
  if (len > 3) return -1 // 超长串：配对形态不可界 ⇒ 未证
  let k = runEnd
  while (k < n && text[k] !== "*" && text[k] !== "\n") k += 1
  if (k >= n) return -1 // 行未终结：未来仍可能配对 ⇒ 未证
  if (text[k] === "\n") return 0 // 行界死亡 ⇒ 字面闭
  let len2 = 0
  while (k + len2 < n && text[k + len2] === "*") len2 += 1
  if (len2 !== len) return -1 // 不等长：配对形态未定（未来可续）⇒ 未证
  const end = k + len
  return end > limit ? -1 : end
}

/** 波浪串（`~~([^~]+)~~` —— 可跨行 ⇒ 无行界死亡）：>0 跳进；-1 = 未证；0 = 单 `~`（惰性）。 */
function tildeSpanAt(text, i, limit) {
  const n = text.length
  if (i + 1 >= n) return -1 // 次字未定 ⇒ 未证
  if (text[i + 1] !== "~") return 0
  if (i + 2 >= n || text[i + 2] === "~") return -1
  let k = i + 2
  while (k < n && text[k] !== "~") k += 1
  if (k === i + 2 || k + 1 >= n || text[k] !== "~" || text[k + 1] !== "~") return -1
  const end = k + 2
  return end > limit ? -1 : end
}

/** 链接 ∕ 图片（`[t](u)` ∕ `![t](u)` —— 可跨行）：>0 跳进；-1 = 未证；0 = 非构造位（惰性一位）。
 *  内容守卫（保守）：文本 ∕ URL 段无星 ∕ 反引 ∕ 波浪 ∕ 换行（其后趟可见 ⇒ 不稳）。 */
function linkSpanAt(text, i, limit) {
  const n = text.length
  let open = i
  if (text[i] === "!") {
    if (i + 1 >= n) return -1
    if (text[i + 1] !== "[") return 0
    open = i + 1
  }
  let j = open + 1
  while (j < n && text[j] !== "]") j += 1
  if (j >= n) return -1
  if (j + 1 >= n) return -1 // 右邻未定：未来可成链接 ⇒ 未证
  if (text[j + 1] !== "(") return 0 // 右邻已定非 `(` ⇒ 字面括 ⇒ 闭
  let k = j + 2
  while (k < n && text[k] !== ")") k += 1
  if (k >= n || k + 1 > limit) return -1
  if (BODY_RE.test(text.slice(open + 1, j) + text.slice(j + 2, k))) return -1
  return k + 1
}

/** 扫区 [from, limit) 内首个「未证已闭」位置（-1 = 全闭）。 */
function firstUnresolved(text, from, limit) {
  let i = from
  while (i < limit) {
    const ch = text[i]
    if (ch === "\\") {
      if (i + 1 >= limit) return i
      i += 2
      continue
    }
    if (ch === "`") {
      const fence = fenceAt(text, i, limit)
      if (fence === -1) return i
      if (fence > 0) { i = fence; continue }
      const span = codeSpanAt(text, i, limit)
      if (span === -1) return i
      i = span > 0 ? span : i + 1
      continue
    }
    if (ch === "*") {
      const end = starSpanAt(text, i, limit)
      if (end === -1) return i
      i = end > 0 ? end : i + starRunLen(text, i)
      continue
    }
    if (ch === "~") {
      const end = tildeSpanAt(text, i, limit)
      if (end === -1) return i
      i = end > 0 ? end : i + 1
      continue
    }
    if (ch === "!" || ch === "[") {
      const end = linkSpanAt(text, i, limit)
      if (end === -1) return i
      i = end > 0 ? end : i + 1
      continue
    }
    i += 1
  }
  return -1
}

/** 星串长度（`starSpanAt` 的字面闭跳进用）。 */
function starRunLen(text, i) {
  let len = 0
  while (i + len < text.length && text[i + len] === "*") len += 1
  return len
}

// ─── 行性质 ∕ 段界 ∕ 块级构造扫描（字符级 —— 大行零分配）────────────────────

/** 行分类（保守三值）："block" = 已定块行 · "pending" = 未定型（今后可能成块）· "plain" = 续段行。
 *  `[from, to)` = 行体（不含换行）；`terminated` = 该行有换行终结。 */
function lineClass(text, from, to, terminated) {
  if (to <= from) return "plain"
  if (text[from] === ">") return "block"
  let i = from
  while (i < to && (text[i] === " " || text[i] === "\t")) i += 1
  if (i >= to) return "plain"
  const c = text[i]
  if (c === "|") return "block"
  if (c === "-" || c === "*" || c === "+") {
    let run = 0
    while (i + run < to && text[i + run] === c) run += 1
    const after = i + run
    if (after >= to) {
      if (c === "-") return terminated && run >= 3 ? "block" : terminated && run === 1 ? "block" : terminated ? "plain" : "pending"
      return terminated && run === 1 ? "block" : terminated ? "plain" : "pending"
    }
    const nxt = text[after]
    if (nxt === " " || nxt === "\t") return "block"
    if (c === "-") {
      let j = after
      while (j < to && text[j] === "-") j += 1
      if (j >= to) return terminated && to - i >= 3 ? "block" : terminated ? "plain" : "pending"
      return "plain"
    }
    return "plain"
  }
  if (c === "#") {
    let run = 0
    while (i + run < to && text[i + run] === "#") run += 1
    if (run > 6) return "plain"
    const after = i + run
    if (after >= to) return terminated ? "plain" : "pending"
    if (text[after] !== " ") return "plain"
    return after + 1 >= to ? (terminated ? "plain" : "pending") : "block"
  }
  if (c === "`") {
    let run = 0
    while (i + run < to && text[i + run] === "`") run += 1
    if (run < 3) return "plain"
    return "pending" // 围栏候选：settled 由整文围栏检查定（hazard），行级留热即可
  }
  if (c >= "0" && c <= "9") {
    let k = i
    while (k < to && text[k] >= "0" && text[k] <= "9") k += 1
    if (k >= to) return terminated ? "plain" : "pending"
    const sep = text[k]
    if (sep !== "." && sep !== ")") return "plain"
    if (k + 1 >= to) return terminated ? "block" : "pending"
    const nxt = text[k + 1]
    if (nxt === " " || nxt === "\t") return "block"
    return "plain"
  }
  return "plain"
}

/** 行是否「消费换行」（列表 ∕ 引用 ∕ 表格 —— 段界串长规则用）。 */
function consumesLine(text, from, to) {
  if (to <= from) return false
  if (text[from] === ">") return true
  let i = from
  while (i < to && (text[i] === " " || text[i] === "\t")) i += 1
  if (i >= to) return false
  const c = text[i]
  if (c === "|") return true
  if (c !== "-" && c !== "*" && c !== "+" && !(c >= "0" && c <= "9")) return false
  if (c >= "0" && c <= "9") {
    let k = i
    while (k < to && text[k] >= "0" && text[k] <= "9") k += 1
    if (k >= to) return false
    return (text[k] === "." || text[k] === ")") && (k + 1 >= to || text[k + 1] === " " || text[k + 1] === "\t")
  }
  let run = 0
  while (i + run < to && text[i + run] === c) run += 1
  const after = i + run
  if (after >= to) return run === 1
  return text[after] === " " || text[after] === "\t"
}

/** 区域扫描：段界（`\n\n+` 串）∕ 首个已定块级构造 ∕ 首个未定型行首（受保护区内的换行不判段界）。 */
function regionScan(text, start) {
  const n = text.length
  const breaks = []
  let hazard = -1
  let pending = -1
  let i = start
  let lineStart = start
  while (i < n) {
    const ch = text[i]
    if (ch === "\\") { i += i + 1 < n ? 2 : 1; continue }
    if (ch === "`") {
      const fence = fenceAt(text, i, n)
      if (fence > 0) { if (hazard < 0) hazard = i; i = fence; continue }
      const span = codeSpanAt(text, i, n)
      if (span > 0) { i = span; continue }
      i += 1 // 未闭 ∕ 惰性：由闭合界（firstUnresolved）约束 —— 非块级构造，不标 hazard
      continue
    }
    if (ch === "\n") {
      const cls = lineClass(text, lineStart, i, true)
      if (cls === "block" && hazard < 0) hazard = lineStart
      else if (cls === "pending" && pending < 0) pending = lineStart
      if (text[i + 1] === "\n") {
        let q = i
        while (q < n && text[q] === "\n") q += 1
        breaks.push({ p: i, q, consumes: consumesLine(text, lineStart, i) })
        lineStart = q
        i = q
        continue
      }
      lineStart = i + 1
      i += 1
      continue
    }
    i += 1
  }
  if (lineStart < n) {
    const cls = lineClass(text, lineStart, n, false)
    if (cls === "block" && hazard < 0) hazard = lineStart
    else if (cls === "pending" && pending < 0) pending = lineStart
  }
  return { breaks, hazard, pending }
}

/** 边界规则：冻结末字符 a 与热区首字符 b 的跨界再解释禁列。 */
function boundaryOk(a, b) {
  if (a === undefined) return true
  if (a === "\\") return false
  if (a === "*" && (b === undefined || b === "*")) return false
  if (a === "~" && (b === undefined || b === "~")) return false
  if (a === "`" && (b === undefined || b === "`")) return false
  if (a === "\n" && (b === undefined || b === "\n")) return false
  return true
}

/** 热区行内有效前缀界（自 cut）：首个段界⁄已定块级构造之前 —— 该界之前为可续段前缀。 */
export function tailHeadEnd(text, cut) {
  const sub = regionScan(text, cut)
  const brk = sub.breaks.length > 0 ? sub.breaks[0].p : text.length
  const hz = sub.hazard >= 0 ? sub.hazard : text.length
  return Math.min(brk, hz)
}

/** 热区语境判定：行内有效前缀非空（可续段）⇒ inline；尾空 ⇒ 判「切入点在开段内」。 */
function tailInline(text, cut) {
  if (cut >= text.length) return cut > 0 && !text.slice(0, cut).endsWith("\n\n")
  return tailHeadEnd(text, cut) > cut
}

/** 冻结切点扫描器：自 `from`（前一切点 ∕ 0）取最近可证切点（无推进 ⇒ 回 `from`）。 */
export function liveCut(raw, from = 0) {
  const text = raw == null ? "" : String(raw)
  const n = text.length
  const start = Math.max(0, Math.min(Number.isFinite(from) ? Math.floor(from) : 0, n))
  const scan = regionScan(text, start)
  const dirtyAt = firstUnresolved(text, start, n)
  const closureBound = dirtyAt < 0 ? n : dirtyAt
  // ① 块界候选：闭合界内最后一个可提交段界（串长规则 + 闭合清至串尾 + 边界规则）
  //    反向扫（末枚在前）：首枚可提交即末位候选 ⇒ 逐枚重扫的成本消（正向遍同取末位）
  let blockCut = -1
  for (let at = scan.breaks.length - 1; at >= 0; at -= 1) {
    const br = scan.breaks[at]
    if (br.q > closureBound) continue
    if (br.consumes && br.q - br.p < 3) continue
    if (firstUnresolved(text, start, br.q) >= 0) continue
    if (!boundaryOk(text[br.q - 1], text[br.q])) continue
    blockCut = br.q
    break
  }
  // ② 段内候选：首个单元内的最近安全位
  const unitEnd = scan.breaks.length > 0 ? scan.breaks[0].p : n
  const unitCls = lineClass(text, start, Math.min(unitEnd, n), unitEnd < n)
  let inlineCut = -1
  if (unitCls !== "block") {
    let cap = Math.min(unitEnd, closureBound)
    if (scan.hazard >= 0) cap = Math.min(cap, scan.hazard)
    if (scan.pending >= 0) cap = Math.min(cap, scan.pending)
    let p = cap
    while (p > start) {
      const u = firstUnresolved(text, start, p)
      if (u < 0 && boundaryOk(text[p - 1], text[p])) { inlineCut = p; break }
      let next = u >= 0 ? u : p - 1
      while (next > start && !boundaryOk(text[next - 1], text[next])) next -= 1
      if (next <= start) break
      p = next
    }
  }
  if (blockCut > inlineCut) {
    return { cut: blockCut, blockStart: blockCut, inline: tailInline(text, blockCut) }
  }
  if (inlineCut > start) {
    return { cut: inlineCut, blockStart: start, inline: tailInline(text, inlineCut) }
  }
  return { cut: start, blockStart: start, inline: tailInline(text, start) }
}
