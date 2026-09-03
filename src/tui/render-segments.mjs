/**
 * render-segments.mjs — 对话行三类特殊段渲染（2026-09-03 D-S2 自 render-conversation.mjs 拆出）：
 * tool 块 / frozenSubTask 冻结子agent 块 / frozenAdvisor 冻结评审块。各段自带独立 WeakMap
 * 段级缓存（行对象载体系互斥——_toolBlock/_frozenSubTask/_frozenAdvisor 三型不共存于一行，
 * 分支互斥 if——与共享缓存行为等价）；签名由各段集中计算（该段输出的所有决定因素，漏一项
 * → 缓存失效不全 → 显示 stale）。buildConvLines 主循环只留三分支 ~3 行调用。
 */
import { C } from "./ansi.mjs"
import { formatTables, sanitizeDisplay, sliceByWidth, wrapText } from "./render.mjs"
import {
  foldTailLines, isExpanded, renderBlockTimeline, renderExpandedBlock, renderFoldedHead, renderMathAndMarkdown,
} from "./fold-block.mjs"
import { styleSubLabelRow } from "./subagent-panel.mjs"
import { SUBAGENT_ROLES } from "./subagent-blocks.mjs"

const _toolSegCache = new WeakMap()
const _frozenSubCache = new WeakMap()
const _frozenAdvCache = new WeakMap()

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

/** 工具块段入口（2026-08-31 段缓存：工具块签名含三缓冲长度+done/elapsed/summary+该块展开态——
 *  流式 append 使 output.length 变 → 失效；real 会话 106 个工具块每帧全量 wrap 实测
 *  32ms（rebuild 40ms 的大头），入缓存后命中只算签名拼接）。 */
export function toolSeg(state, l, i, cols, maxRows) {
  const b = l._toolBlock
  const toolFoldKey = `tool-${l._lineId ?? i}`
  const tSig = [
    cols, maxRows ?? 0, b.argsJson?.length ?? 0, b.output?.length ?? 0, b.result?.length ?? 0,
    b.done ? 1 : 0, b.elapsed ?? "", b.summary ?? "", b.name ?? "", b.roundTag ?? "",
    l._lineId ?? "", state.foldEnabled === false ? 0 : 1,
    state.expandedBlocks?.has(toolFoldKey) ? 1 : 0, state._foldScroll?.get(toolFoldKey) ?? 0,
  ].join("|")
  const hit = _toolSegCache.get(l)
  if (hit && hit.textRef === b && hit.sig === tSig) return hit.rows
  const rows = buildToolBlockSeg(state, l, i, cols, maxRows)
  _toolSegCache.set(l, { textRef: b, sig: tSig, rows })
  return rows
}

/** 冻结子agent 活动块渲染（§7.2 D4）：state.lines 载体 {_frozenSubTask: sub}（subagent-blocks.mjs
 *  freezeSubTaskLines 推入）。折叠 = 身份头 + tail 3；展开 = 共享组件（60% 屏幕封顶 + 底部可达
 *  折叠控制）。折叠键 `sub-${key}`——与运行中面板区块同键，折叠态跨冻结边界无缝延续。 */
function frozenSubTaskLines(state, sub, cols, maxRows) {
  const foldKey = `sub-${sub.key}`
  const elapsed = Math.floor(((sub.doneAt ?? Date.now()) - sub.started) / 1000)
  // §19.5 D-M7b ②: 冻结头保留 sync/async 标识（done 头含历史语义——与 model 标识
  // 同生命周期）；仅真实 subagent 角色（compress 冻结等无语义）。整行 dim——
  // 无需 ANSI 注入（running 面板头则套 dim + 恢复行色——subagent-panel.mjs）。
  const isSubRole = SUBAGENT_ROLES.includes(sub.role)
  const modePart = isSubRole ? ` · ${sub.async === true ? "async" : "sync"}` : ""
  const modelPart = sub.model ? ` · ${sub.model}` : ""
  const turnPart = sub.maxTurns > 0 ? ` · turn ${sub.turn}/${sub.maxTurns}` : ""
  const errPart = sub.lastError ? ` — ${sub.lastError}` : ""
  const icon = sub.approval ? "⏸" : "✓"
  const verb = sub.stopped ? "stopped" : "done" // §19.5: cancel 冻结标题 "stopped"
  const header = `[${icon} ${sub.key}${modePart}${modelPart} · ${verb} ${elapsed}s${turnPart}${errPart}]`
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

/** 冻结子agent 段入口（2026-08-31 段缓存：冻结后内容不变——签名含 sub.key + blocks 计数；
 *  注：foldKey 由位置键升级为 sub.key（loadOlder unshift 后不重绑——sub 自身携带 key）。 */
export function frozenSubSeg(state, l, i, cols, maxRows) {
  const fKey = `sub-${l._frozenSubTask.key}`
  const fSig = [
    cols, maxRows ?? 0, l._frozenSubTask.key, l._frozenSubTask.blocks?.length ?? 0,
    l._frozenSubTask.done ? 1 : 0, state.foldEnabled === false ? 0 : 1,
    state.expandedBlocks?.has(fKey) ? 1 : 0, state._foldScroll?.get(fKey) ?? 0,
  ].join("|")
  const hit = _frozenSubCache.get(l)
  if (hit && hit.textRef === l._frozenSubTask && hit.sig === fSig) return hit.rows
  const rows = frozenSubTaskLines(state, l._frozenSubTask, cols, maxRows)
  _frozenSubCache.set(l, { textRef: l._frozenSubTask, sig: fSig, rows })
  return rows
}

/** frozenAdvisor 段渲染——冻结后文本不变（markdown 渲染、无 gutter——review 历史惯例）；
 *  foldKey 由 advisor-done-${i}（位置键）升级为 advisor-done-${_lineId ?? i}（同 long-N
 *  判例——loadOlder unshift 后不重绑）。 */
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

/** frozenAdvisor 段入口（2026-08-31 段缓存：frozenAdvisor 文本冻结不变——签名含文本长度 + 展开态）。 */
export function frozenAdvSeg(state, l, i, cols, maxRows) {
  const frozenAdvKey = `advisor-done-${l._lineId ?? i}`
  const aSig = [
    cols, maxRows ?? 0, (l._frozenAdvisor ?? "").length,
    state.foldEnabled === false ? 0 : 1,
    state.expandedBlocks?.has(frozenAdvKey) ? 1 : 0, state._foldScroll?.get(frozenAdvKey) ?? 0,
  ].join("|")
  const hit = _frozenAdvCache.get(l)
  if (hit && hit.textRef === l._frozenAdvisor && hit.sig === aSig) return hit.rows
  const rows = buildFrozenAdvSeg(state, l, i, cols, maxRows)
  _frozenAdvCache.set(l, { textRef: l._frozenAdvisor, sig: aSig, rows })
  return rows
}
