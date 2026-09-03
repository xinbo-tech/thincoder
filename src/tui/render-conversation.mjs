/**
 * render-conversation.mjs — conversation panel line builder
 * Extracted from render-frame.mjs.
 *
 * 2026-08-30: all six fold sites (frozen/running subagent blocks, frozen/live
 * advisor, long-message, consecutive-dim) delegate their EXPANDED-state
 * rendering to the shared fold-block.mjs component, which caps expansion at
 * 60% of the terminal height so the collapse control always stays reachable
 * (user report: an expanded block could push its own control off-screen).
 * maxRows flows in from every caller; omitted/0 → uncapped (tests, odd envs).
 */
import { ansi, C } from "./ansi.mjs"
import { formatTables, sanitizeDisplay, sliceByWidth, wrapText } from "./render.mjs"
import {
  isExpanded, foldHintLine, renderExpandedBlock, renderBlockTimeline,
  renderMathAndMarkdown, foldCapRows, renderFoldedHead, foldTailLines,
} from "./fold-block.mjs"
import { styleSubLabelRow } from "./subagent-panel.mjs"
import { ADVISOR_THINKING_PLACEHOLDER } from "../advisor/run.mjs"


// Test seam (mirrors the _-prefixed seams in run.mjs) — moved to fold-block.mjs.
import { renderMarkdownPreservingWidth as _rmpw } from "./fold-block.mjs"
export { _rmpw as _renderMarkdownPreservingWidth }

let _convCache = { key: "", cols: 0, lines: [] }

/** 2026-08-31 懒加载卡顿优化②：段级行体缓存（行对象→conv 行数组）。
 *  与行级 wrapRowsCached 分层：wrap 缓存只省 markdown/换行重算（streaming 行 text 变失效），
 *  段缓存省**整个行体的折叠/展开/窗口化组装**——loadOlder unshift 后尾部 987 行段全命中，
 *  rebuild 从 25.7ms → ~8ms 量级。签名由 lineSegSig 集中计算（该段输出的所有决定因素）。 */
const _lineSegCache = new WeakMap()

/** 段签名：段输出的所有决定因素（漏一项 → 缓存失效不全 → 显示 stale）。
 *  返回 { textRef, sig }——text 用**引用比较**（O(1)；streaming 同对象 text 变 → 新引用
 *  ≠ 旧引用 → 失效），其余短字段（列宽/行数上限/颜色/种类/折行 id/lineId/foldEnabled/
 *  该段折叠展开态+offset/search）拼接——**不**把 l.text 全量拼进 sig（987 行 × KB 级
 *  字符串拼接实测 20ms，等于没优化）。 */
function lineSegSig(state, l, i, cols, maxRows) {
  const longKey = `long-${l._lineId ?? i}`
  const expanded = state.expandedBlocks?.has(longKey) ? 1 : 0
  const offset = state._foldScroll?.get(longKey) ?? 0
  const searchSig = state.search?.query
    ? `${state.search.query}:${state.search.index ?? 0}:${l._searchMatches?.length ?? 0}`
    : ""
  return {
    textRef: l.text,
    sig: [
      cols, maxRows ?? 0, l.color ?? "", l._kind ?? "", l._foldId ?? "",
      l._lineId ?? "", state.foldEnabled === false ? 0 : 1, expanded, offset, searchSig,
    ].join("|"),
  }
}

/** 普通源行 → conv 行数组（行体；不含前后空行——空行由 buildConvLines 外层逻辑补）。
 *  从 buildConvLines 循环抽出（2026-08-31 段缓存）；逻辑与原位置逐字同构。 */
function buildLineSeg(state, l, i, cols, maxRows) {
  const LONG_FOLD_LINES = 12
  const out = []
  let text = l.text

  // Apply search highlighting
  if (state.search && state.search.query && l._searchMatches) {
    text = highlightSearchMatches(text, state.search.query, l._searchMatches, state.search.index, state.search.matches, i)
  }

  const longKey = `long-${l._lineId ?? i}`
  const isReasoning = l._kind === "thinking" || (l._kind === undefined && l.color === C.reason)
  const foldable = isReasoning || (l._kind === "tool" || (l._kind === undefined && l.color === C.dim) || (l._kind === undefined && l.color !== C.text && l.color !== C.reason))
  const threshold = isReasoning ? 0 : LONG_FOLD_LINES
  const folded = foldable && state.foldEnabled !== false && !state.expandedBlocks?.has(longKey)
  const block = []
  const renderedRows = wrapRowsCached(state, l, text, cols)
  for (const wrapped of renderedRows) {
    block.push({ text: wrapped, color: l.color, _foldId: l._foldId, _src: i })
  }
  if (folded && block.length > threshold) {
    const kind = l.color === C.reason ? "thinking" : l.color === C.dim ? "tool output" : "message"
    out.push(...renderFoldedHead({
      header: foldHintLine(`▶ ${kind} · ${block.length} lines — click to expand`, longKey, i),
      body: block, cols,
    }))
  } else if (foldable && block.length > threshold) {
    if (state.foldEnabled === false) {
      out.push(...block)
    } else {
      if (l.color === C.dim) {
        for (const line of block) line._skipDimFold = true
      }
      out.push(...renderExpandedBlock({ body: block, foldKey: longKey, state, maxRows, cols, label: `${block.length} lines` }))
    }
  } else {
    out.push(...block)
  }
  return out
}

/** 工具块段（2026-08-31 段缓存抽出——真实会话 106 个工具块每帧全量 wrap 32ms 的根治）。
 *  返回 conv 行数组（工具块的折叠头+尾/展开窗口+控制行），逻辑与原 L221-258 逐字同构。 */
function buildToolBlockSeg(state, l, i, cols, maxRows) {
  const b = l._toolBlock
  const foldKey = `tool-${l._lineId ?? i}`
  const out = []
  const status = !b.done
    ? "running"
    : `${b.elapsed !== null ? b.elapsed + "ms" : ""}${b.summary ? (b.elapsed !== null ? " · " : "") + sliceByWidth(b.summary, 50) : ""}`.trim() || "done"
  if (isExpanded(state, foldKey)) {
    const body = []
    const pushWrapped = (raw, color) => {
      for (const w of wrapText(raw, cols - 4)) body.push({ text: "  " + w, color, _skipDimFold: true })
    }
    for (const jl of b.argsJson) pushWrapped(jl, C.dim)
    for (const ol of b.output) pushWrapped(ol, C.tool)
    if (b.result) for (const rl of b.result) pushWrapped(rl, C.dim)
    out.push(...renderExpandedBlock({ body, foldKey, state, maxRows, cols, label: `${b.name}${b.roundTag || ""} ${b.argsSummary}`.trim() }))
  } else {
    const headText = sliceByWidth(
      `❯ ${b.name}${b.roundTag || ""}${b.argsSummary ? " " + b.argsSummary : ""}  · ${status}`,
      Math.max(20, cols - 2),
    )
    const body = []
    for (const jl of b.argsJson) for (const w of wrapText(jl, cols - 4)) body.push({ text: w, color: C.dim, _skipDimFold: true })
    for (const ol of b.output.slice(-3)) for (const w of wrapText(ol, cols - 4)) body.push({ text: w, color: C.dim, _skipDimFold: true })
    if (b.result) for (const rl of b.result) for (const w of wrapText(rl, cols - 4)) body.push({ text: w, color: C.dim, _skipDimFold: true })
    out.push(...renderFoldedHead({ header: { text: headText, color: C.tool, _foldToggle: foldKey }, body, cols }))
  }
  return out
}

/** frozenAdvisor 段（2026-08-31 段缓存抽出）——foldKey 升级为 _lineId 派生（同 long-N 判例）。 */
function buildFrozenAdvSeg(state, l, i, cols, maxRows) {
  const frozenAdvKey = `advisor-done-${l._lineId ?? i}`
  const out = []
  if (isExpanded(state, frozenAdvKey)) {
    const body = []
    const rendered = renderMathAndMarkdown(sanitizeDisplay(l._frozenAdvisor))
    for (const line of formatTables(rendered, cols - 1)) {
      for (const wrapped of wrapText(line, cols - 1)) {
        body.push({ text: wrapped, color: C.reason, _skipDimFold: true })
      }
    }
    out.push(...renderExpandedBlock({ body, foldKey: frozenAdvKey, state, maxRows, cols, label: "[advisor · review done]" }))
  } else {
    out.push({
      text: `▶ [advisor · review done] … click to expand`,
      color: C.fold,
      _foldToggle: frozenAdvKey,
    })
  }
  return out
}


/** 2026-08-31 懒加载卡顿根因修复：行级 wrap/markdown 渲染缓存。
 *  buildConvLines 全量重建 O(总行数)——真实 200 条历史 → 987 conv 行 94ms、loadOlder 后
 *  111ms（主线程阻塞卡顿）。行对象 + cols + 加工后 text（含 search 高亮注入）为键，
 *  已有行直接复用——loadOlder/prepend 只算新增行；streaming 行 text 变自动失效；
 *  行对象在 unshift 间引用稳定（行级隔离，无跨 state 串扰）。 */
const _wrapCache = new WeakMap()

function wrapRowsCached(state, line, text, cols) {
  const hit = _wrapCache.get(line)
  if (hit && hit.cols === cols && hit.text === text && hit.color === line.color) return hit.rows
  const renderedText = renderMathAndMarkdown(sanitizeDisplay(text))
  const rows = []
  for (const l of formatTables(renderedText, cols - 1)) {
    for (const wrapped of wrapText(l, cols - 1)) rows.push(wrapped)
  }
  _wrapCache.set(line, { cols, text, color: line.color, rows })
  return rows
}


export function convCacheKey(state, maxRows) {
  const lastLine = state.lines.length > 0 ? state.lines[state.lines.length - 1] : null
  // expandedBlocks participates: expanding/folding a block must invalidate the cache
  const exp = state.expandedBlocks ? [...state.expandedBlocks].sort().join(",") : ""
  // 2026-08-31 块内滚动：_foldScroll（foldKey→offset）参与签名——翻窗必须重新渲染
  const foldScrollSig = state._foldScroll
    ? [...state._foldScroll.entries()].sort((a, b) => a[0] < b[0] ? -1 : 1).map(([k, v]) => `${k}:${v}`).join(",")
    : ""
  // Content prefix in the signature: same kind+length with different content
  // would otherwise collide (stale render); 8 chars disambiguate in practice.
  const blocksSig = (state._advisorBlocks ?? []).map((b) => `${b.kind}:${b.text?.length ?? 0}:${String(b.text ?? "").slice(0, 8)}`).join(",")
  // NOTE (§7.2.1): running subagent blocks are NOT part of the conversation
  // anymore — they render in the fixed bottom panel (subagent-panel.mjs,
  // uncached per frame: the 1s ticker refreshes the panel's elapsed display).
  // The old subSig (blockEpoch/turn/elapsed invalidation) is removed: the panel
  // re-renders independently, so child activity must NOT invalidate the
  // conversation cache (that would rebuild the whole conversation per child
  // token — exactly what the 2026-08-31 lazy-load optimization eliminated).
  // Frozen blocks ride state.lines ({_frozenSubTask}) — the lines.length part
  // of this key covers their existence; expanding/collapsing one flips
  // expandedBlocks (covered by `exp`). One extra: the last frozen payload's
  // header depends on blocks content which never changes post-freeze — nothing
  // more needed. Same single pass also builds the per-line COLOR-CLASS
  // signature: foldability is decided by color class since main output (C.text)
  // never folds while thinking/dim do (2026-08-30) — two states differing only
  // in line color used to collide on this key and serve a stale cached render.
  // Tool-block carriers ({_toolBlock}) contribute their BUFFER SIZE signature:
  // output/result arrays mutate in place (streaming appends, result landing),
  // and carrier text is always "" — without this the cache serves a stale block
  // while a tool runs (and across live→restore with equal line counts).
  let frozenSig = ""
  let colorSig = ""
  let toolSig = ""
  for (const l of state.lines) {
    if (l._frozenSubTask) frozenSig += `${l._frozenSubTask.key};`
    if (l._toolBlock) toolSig += `${l._toolBlock.done ? 1 : 0}:${l._toolBlock.output.length}:${l._toolBlock.result ? l._toolBlock.result.length : 0}:${l._toolBlock.summary ?? ""}:${l._toolBlock.elapsed ?? ""};`
    colorSig += l.color === C.text ? "T" : l.color === C.dim ? "D" : l.color === C.reason ? "R" : "o"
  }
  // Expansion cap participates: a terminal resize changes the cap, which changes
  // the rendered height of every expanded block — the cache must not survive it.
  const capPart = maxRows ? `cap${foldCapRows(maxRows)}` : "cap∞"
  // Search state participates: highlightSearchMatches re-renders the matching
  // lines, but performSearch only mutates state.search/_searchMatches — without
  // this the cache would serve the pre-search rows and highlight would never
  // appear (P0-1, 2026-08-30 consult). query+index covers match navigation.
  const searchPart = state.search?.query ? `${state.search.query}:${state.search.index ?? 0}` : ""
  return `${state.lines.length}|${lastLine?.text.length ?? 0}|${state.streaming.length}|${state.reasoning.length}|${blocksSig}|${frozenSig}|${toolSig}|${colorSig}|${state.foldEnabled !== false ? "f" : "u"}|${exp}|${capPart}|${searchPart}|${foldScrollSig}`
}

/** Fold marker line: bold-cyan icon + "click to …" phrase underlined (clickable affordance).
 *  No indent — flush with the content below it; the caller adds a blank line BEFORE it
 *  so the control line stands apart from unrelated content (reported UX). */

function highlightSearchMatches(text, query, matchesInLine, globalCurrentIndex, allMatches, lineIndex) {
  if (!matchesInLine || matchesInLine.length === 0 || !query) return text

  let result = ""
  let lastEnd = 0
  for (const startIdx of matchesInLine) {
    result += text.substring(lastEnd, startIdx)
    const endIdx = startIdx + query.length
    const matchedText = text.substring(startIdx, endIdx)

    // Find global index of this match
    const gIdx = allMatches.findIndex(m => m.lineIndex === lineIndex && m.charIndex === startIdx)

    if (gIdx === globalCurrentIndex) {
      result += `\x1b[7m${matchedText}\x1b[27m` // Reverse video for current
    } else {
      result += `\x1b[33m\x1b[4m${matchedText}\x1b[24m\x1b[39m` // Yellow underline for others
    }
    lastEnd = endIdx
  }
  result += text.substring(lastEnd)
  return result
}

/** Render a FROZEN child activity block carried on a state.lines entry
 *  (subagent-blocks.mjs freezeSubTaskLines pushes {_frozenSubTask: sub}). The
 *  running form renders in the fixed bottom panel (§7.2.1 subagent-panel.mjs);
 *  the frozen form stays in the stream with the same interaction: folded =
 *  `[✓ coder#1 · glm-5.3 · done 45s · turn 12/100] … click to expand` header +
 *  tail 3 block lines (verb "stopped" when the child was cancelled — §19.5
 *  ⟦ev⟧stopped); expanded = blank + ▼ control + full timeline (60% screen cap
 *  via the shared component — capped view ends in a reachable collapse
 *  control). Toggle key `sub-${key}` — the SAME key the panel section uses, so
 *  fold state carries across the freeze boundary seamlessly (user ruled
 *  2026-08-30: frozen stays clickable — full design interaction, not a
 *  dim-lines fallback). */
function frozenSubTaskLines(state, sub, cols, maxRows) {
  const foldKey = `sub-${sub.key}`
  const elapsed = Math.floor(((sub.doneAt ?? Date.now()) - sub.started) / 1000)
  const modelPart = sub.model ? ` · ${sub.model}` : ""
  const turnPart = sub.maxTurns > 0 ? ` · turn ${sub.turn}/${sub.maxTurns}` : ""
  const errPart = sub.lastError ? ` — ${sub.lastError}` : ""
  const icon = sub.approval ? "⏸" : "✓"
  const verb = sub.stopped ? "stopped" : "done" // §19.5: cancel 冻结标题 "stopped"
  const header = `[${icon} ${sub.key}${modelPart} · ${verb} ${elapsed}s${turnPart}${errPart}]`
  const out = []
  if (isExpanded(state, foldKey)) {
    // Expanded: shared component renders blank + ▼ control + full timeline,
    // capped at 60% of the screen with a bottom collapse control.
    const body = renderBlockTimeline(sub.blocks, cols).map(styleSubLabelRow)
    out.push(...renderExpandedBlock({ body, foldKey, state, maxRows, cols, label: "subagent activity" }))
  } else {
    // Folded: the header line itself is the control (▶ affordance), then tail 3.
    out.push({
      text: `▶ ${header} … subagent activity — click to expand`,
      color: C.dim,
      _foldToggle: foldKey,
    })
    for (const line of foldTailLines(sub.blocks)) {
      out.push({ text: `│ ${sliceByWidth(line, cols - 4)}`, color: C.dim, _skipDimFold: true })
    }
  }
  return out
}

/**
 * Build the conversation lines for the given state.
 * maxRows: terminal rows for the 60% expansion cap (undefined → uncapped —
 * unit tests and callers without a terminal rely on that).
 * NOTE: module-level _convCache is read/written as a side effect (keyed by
 * convCacheKey + cols) — the function is pure w.r.t. its input except for
 * that cache; direct callers outside renderConversation/countConvLines
 * should be aware the cache persists across calls.
 */
function buildConvLines(state, cols, maxRows) {
  const key = convCacheKey(state, maxRows)
  if (_convCache.key === key && _convCache.cols === cols) return _convCache.lines

  const convLines = []
  // Folding constants (function scope)
  const LONG_FOLD_LINES = 12
  let blankAfter = false
  // THINKING ALWAYS FOLDS (user ruling 2026-08-30, final): no threshold of any
  // kind — row thresholds died twice on the user's real screen (12 never met on
  // narrow, 3 never met on wide), a char threshold missed typical sentences.
  // Thinking is process content: it renders as the named "▶ thinking" block,
  // expand ≤60%, click back. No exceptions, streaming included.
  for (let i = 0; i < state.lines.length; i++) {
    const l = state.lines[i]
    // Main-output breathing room (user request 2026-08-30): a blank line before
    // and after each main-output segment (assistant replies / user text — the
    // C.text rows) so the conversation body stands apart from thinking / tool /
    // subagent blocks. Blank lines are RENDER-only (never written to
    // state.lines) — convCacheKey is unaffected, and adjacent segments share
    // one blank line (the trailing blank of segment N and the leading blank of
    // segment N+1 must not stack into a double row).
    const isMain = l._kind === "text" || (l._kind === undefined && l.color === C.text)
    const pushBlank = () => {
      if (convLines.at(-1)?.text !== "") convLines.push({ text: "", color: C.text })
    }
    if (isMain) {
      const prev = i > 0 ? state.lines[i - 1] : null
      const next = state.lines[i + 1]
      const prevMain = prev && (prev._kind === "text" || (prev._kind === undefined && prev.color === C.text))
      const nextMain = next && (next._kind === "text" || (next._kind === undefined && next.color === C.text))
      if (!prevMain) pushBlank()
      blankAfter = !nextMain
    }
    // Frozen subagent activity block (§7.2 D4, 2026-08-30): rendered as its own
    // collapsible section in the stream (running blocks live in the fixed panel,
    // §7.2.1 — the frozen form keeps the same clickable interaction).
    if (l._frozenSubTask) {
      // 2026-08-31 段缓存：frozenSubTask 冻结后内容不变——签名含 sub.key + blocks 计数
      const fKey = `sub-${l._frozenSubTask.key}`
      const fSig = [
        cols, maxRows ?? 0, l._frozenSubTask.key, l._frozenSubTask.blocks?.length ?? 0,
        l._frozenSubTask.done ? 1 : 0, state.foldEnabled === false ? 0 : 1,
        state.expandedBlocks?.has(fKey) ? 1 : 0, state._foldScroll?.get(fKey) ?? 0,
      ].join("|")
      const fHit = _lineSegCache.get(l)
      if (fHit && fHit.textRef === l._frozenSubTask && fHit.sig === fSig) {
        convLines.push(...fHit.rows)
      } else {
        const rows = frozenSubTaskLines(state, l._frozenSubTask, cols, maxRows)
        _lineSegCache.set(l, { textRef: l._frozenSubTask, sig: fSig, rows })
        convLines.push(...rows)
      }
      continue
    }
    // ONE BLOCK PER TOOL CALL (2026-08-30 user ruling): header = name+args+
    // live status, body = args JSON + streaming output + result. Folded =
    // ▶ name args · status/summary; expanded = 60%-capped body (shared component).
    if (l._toolBlock) {
      // 2026-08-31 段缓存：工具块签名含三缓冲长度+done/elapsed/summary+该块展开态——
      // 流式 append 使 output.length 变 → 失效；real 会话 106 个工具块每帧全量 wrap 实测
      // 32ms（rebuild 40ms 的大头），入缓存后命中只算签名拼接。
      const b = l._toolBlock
      const toolFoldKey = `tool-${l._lineId ?? i}`
      const tSig = [
        cols, maxRows ?? 0, b.argsJson?.length ?? 0, b.output?.length ?? 0, b.result?.length ?? 0,
        b.done ? 1 : 0, b.elapsed ?? "", b.summary ?? "", b.name ?? "", b.roundTag ?? "",
        l._lineId ?? "", state.foldEnabled === false ? 0 : 1,
        state.expandedBlocks?.has(toolFoldKey) ? 1 : 0, state._foldScroll?.get(toolFoldKey) ?? 0,
      ].join("|")
      const tHit = _lineSegCache.get(l)
      if (tHit && tHit.textRef === b && tHit.sig === tSig) {
        convLines.push(...tHit.rows)
      } else {
        const rows = buildToolBlockSeg(state, l, i, cols, maxRows)
        _lineSegCache.set(l, { textRef: b, sig: tSig, rows })
        convLines.push(...rows)
      }
      continue
    }
    // Frozen advisor review (2026-08-30): same collapsible-box treatment —
    // folded = one control line; expanded = the full review text (markdown
    // rendered, no gutter — review history convention kept from the flat era),
    // 60% cap via the shared component.
    if (l._frozenAdvisor) {
      // 2026-08-31 段缓存：frozenAdvisor 文本冻结不变——签名含文本长度 + 展开态
      // 注：foldKey 由 advisor-done-${i}（位置键）升级为 advisor-done-${_lineId ?? i}
      // （同 long-N 判例——loadOlder unshift 后不重绑）
      const frozenAdvKey = `advisor-done-${l._lineId ?? i}`
      const aSig = [
        cols, maxRows ?? 0, (l._frozenAdvisor ?? "").length,
        state.foldEnabled === false ? 0 : 1,
        state.expandedBlocks?.has(frozenAdvKey) ? 1 : 0, state._foldScroll?.get(frozenAdvKey) ?? 0,
      ].join("|")
      const aHit = _lineSegCache.get(l)
      if (aHit && aHit.textRef === l._frozenAdvisor && aHit.sig === aSig) {
        convLines.push(...aHit.rows)
      } else {
        const rows = buildFrozenAdvSeg(state, l, i, cols, maxRows)
        _lineSegCache.set(l, { textRef: l._frozenAdvisor, sig: aSig, rows })
        convLines.push(...rows)
      }
      continue
    }

    // ── 普通源行段（2026-08-31 懒加载卡顿优化②：段级缓存——行体 WeakMap 按行对象
    // 缓存，签名含该段所有决定因素；unshift/loadOlder 后尾部段全命中，只算新增行。
    // toggle/翻窗/收起只失效该块段，其它段照样命中。行为不变性是硬约束。
    const seg = lineSegSig(state, l, i, cols, maxRows)
    const hit = _lineSegCache.get(l)
    if (hit && hit.textRef === seg.textRef && hit.sig === seg.sig) {
      convLines.push(...hit.rows)
    } else {
      const rows = buildLineSeg(state, l, i, cols, maxRows)
      _lineSegCache.set(l, { textRef: seg.textRef, sig: seg.sig, rows })
      convLines.push(...rows)
    }
    // Trailing blank after a main-output segment (user request 2026-08-30) —
    // landed after the segment's rendered content.
    if (blankAfter) {
      pushBlank()
      blankAfter = false
    }
  }
  // ── Subagent activity blocks (§7.2.1 D2) — RUNNING blocks MOVED to the fixed
  // bottom panel (subagent-panel.mjs renderSubagentPanel, layout.mjs precomputes
  // the panel height; render-frame puts it between conversation and todo).
  // buildConvLines no longer renders running children: on completion
  // onToolResult freezes the block into state.lines (subagent-blocks.mjs
  // freezeSubTaskLines) and it scrolls away with the conversation (D4 现状).
  // Frozen blocks render above via the _frozenSubTask branch (frozenSubTaskLines).

  if (state.reasoning) {
    // Live thinking streams INSIDE the unified box (user ruling 2026-08-30:
    // "思考过程中为什么不是直接进这个框" — the flat tail render was a
    // pre-fold-era leftover). Same folded form as flushed blocks: named header
    // + tail 3, click expands to the 60%-capped live view. The buffer grows
    // per token; convCacheKey already includes state.reasoning.length so the
    // box updates live. Single instance key — one live stream at a time; on
    // flush the block re-keys to `long-{idx}` with the identical form (seamless).
    const liveKey = "thinking-live"
    const body = []
    for (const wrapped of wrapText(sanitizeDisplay(state.reasoning), cols - 1)) {
      body.push({ text: wrapped, color: C.reason, _skipDimFold: true })
    }
    const expanded = isExpanded(state, liveKey)
    if (expanded) {
      convLines.push(...renderExpandedBlock({ body, foldKey: liveKey, state, maxRows, cols, label: "thinking (streaming)" }))
    } else {
      convLines.push(...renderFoldedHead({
        header: foldHintLine(`▶ thinking · ${body.length} lines — click to expand`, liveKey),
        body, cols,
      }))
    }
  }
  const advisorBlocks = state._advisorBlocks ?? []
  if (advisorBlocks.length > 0) {
    // ── Advisor review block (2026-08-30): collapsible in-conversation box ──
    // The live stream used to render flat into the conversation and flooded it
    // (user report). Same interaction as subagent blocks: default FOLDED =
    // header (running/done + total line count) + tail 3 block lines; expanded =
    // shared component (▼ control + ordered per-kind timeline — think/tool/text
    // colors kept, T-F regression; placeholder markers stripped in every view —
    // unified with the folded tail which always stripped them). Toggle key
    // `advisor-blocks` (single instance — one advisor runs at a time).
    const advKey = "advisor-blocks"
    // Total rendered line count of the timeline (cheap: rough split, no wrap math)
    const advLineCount = advisorBlocks.reduce((n, b) => n + sanitizeDisplay(b.text).split("\n").filter((l) => l.trim()).length, 0)
    const advHeader = `[advisor · review] ${advLineCount} lines`
    if (isExpanded(state, advKey)) {
      const body = renderBlockTimeline(advisorBlocks, cols, { strip: [ADVISOR_THINKING_PLACEHOLDER] })
      convLines.push(...renderExpandedBlock({ body, foldKey: advKey, state, maxRows, cols, label: advHeader }))
    } else {
      // Folded: header control line + tail 3 non-empty lines from the tail
      // blocks (most recent activity), dim — mirrors the subagent block fold.
      convLines.push({
        text: `▶ ${advHeader} — click to expand`,
        color: C.fold,
        _foldToggle: advKey,
      })
      for (const line of foldTailLines(advisorBlocks, 3, { strip: [ADVISOR_THINKING_PLACEHOLDER] })) {
        convLines.push({ text: `│ ${sliceByWidth(line, cols - 4)}`, color: C.dim, _skipDimFold: true })
      }
    }
  }
  if (state.streaming) {
    // Main-output breathing room (2026-08-30): the streaming path renders OUTSIDE
    // the line loop (the reply is still in its buffer, not yet in state.lines),
    // so the loop's leading blank never applied — a streamed reply showed no
    // blank until flush landed it in lines and a later frame re-rendered. Apply
    // the same leading blank here (the trailing blank belongs to the line path
    // once flushed — mid-stream there is still content to come).
    if (convLines.at(-1)?.text !== "") convLines.push({ text: "", color: C.text })
    // Rendered BEFORE formatTables — see fold-block.mjs for the width contract.
    const rendered = renderMathAndMarkdown(sanitizeDisplay(state.streaming))
    for (const line of formatTables(rendered, cols - 1)) {
      for (const wrapped of wrapText(line, cols - 1)) {
        convLines.push({ text: wrapped, color: C.text })
      }
    }
  }
  // Fold long blocks (> 8 consecutive dim lines)
  const FOLD_LINES = 8
  const folded = []
  let i = 0
  while (i < convLines.length) {
    const line = convLines[i]
    if (line.color === C.dim) {
      let j = i
      while (j < convLines.length && convLines[j].color === C.dim) j++
      const blockLen = j - i
      // Expanded long-fold blocks are exempt — otherwise folding stacks on folding
      const hasExpandedLong = convLines.slice(i, j).some((l) => l._skipDimFold)
      if (blockLen > FOLD_LINES && !hasExpandedLong) {
        // 2026-08-31 会诊三家共识：fold-N 计数器键在 loadOlder/上游 dim 块增减时重绑——
        // 用首行 _lineId 身份化（连续 dim 块首行即稳定锚）；无 _lineId 时退 fold-i（防御）
        const keySource = convLines[i]._lineId ?? i
        const foldKey = `fold-${keySource}`
        if (state.foldEnabled !== false && !state.expandedBlocks?.has(foldKey)) {
          // FOLDED — unified named-header + last-3 form (same ruling as the
          // long-message fold above).
          folded.push(...renderFoldedHead({
            header: foldHintLine(`▶ tool output · ${blockLen} lines — click to expand`, foldKey),
            body: convLines.slice(i, j), cols,
          }))
          i = j
          continue
        }
        // EXPANDED consecutive-dim block via the shared component: blank + ▼ at
        // the HEAD, then every line, 60% cap with a bottom collapse control.
        // foldEnabled=false → raw block, no hint (toggling would be a no-op).
        if (state.foldEnabled === false) {
          for (let k = i; k < j; k++) folded.push(convLines[k])
        } else {
          folded.push(...renderExpandedBlock({ body: convLines.slice(i, j), foldKey, state, maxRows, cols, label: `${blockLen} lines` }))
        }
        i = j
        continue
      }
    }
    folded.push(line)
    i++
  }

  _convCache = { key, cols, lines: folded }
  return folded
}

export function countConvLines(state, cols, maxRows) {
  return buildConvLines(state, cols, maxRows).length
}

export { buildConvLines }

export function renderConversation(state, cols, visibleH, scroll, maxRows) {
  const convLines = buildConvLines(state, cols, maxRows)
  const { start, end, pad } = convViewport(convLines.length, visibleH, scroll)
  const visible = convLines.slice(start, end)
  const out = []
  for (let p = 0; p < pad; p++) out.push("")
  for (const l of visible) out.push(`${l.color ?? ""}${l.text}${ansi.reset}`)
  return out
}

/** 视口数学单源（2026-08-31 会诊 kimi 缺陷 1——convGlobalIndex 未减 pad：
 *  短会话顶部补 pad 空行后命中整体偏移，点击/滚轮落空或错行）。
 *  返回 { start, end, pad }——renderConversation 与鼠标命中测试共用。 */
export function convViewport(convLen, convH, scroll) {
  const maxScroll = Math.max(0, convLen - convH)
  const clamped = Math.min(scroll, maxScroll)
  const end = Math.max(0, convLen - clamped)
  const start = Math.max(0, end - convH)
  const pad = Math.max(0, convH - (end - start))
  return { start, end, pad }
}
