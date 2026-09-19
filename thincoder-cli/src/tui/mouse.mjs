/**
 * mouse.mjs — SGR mouse support: click parsing + hit-testing.
 *
 * Protocol (enabled at startup via \x1b[?1000h\x1b[?1006h):
 *   press:    \x1b[<b;col;rowM   (b=0 left, 64/65 wheel up/down — wheel handled upstream)
 *   release:  \x1b[<b;col;rowm   (ignored — actions fire on press)
 * Coordinates are 1-based; col comes FIRST in the sequence.
 *
 * Only left-click (button 0) is consumed. Everything else stays stripped
 * upstream (sequence fragments must never leak into the input box).
 *
 * Click actions (deliberately minimal — a line-action menu was removed as
 * over-engineering: terminals already copy via drag-select):
 *   - picker option click = select it
 *   - folded-block hint click = expand it
 */
import { computeLayout, subagentLineIndex } from "./layout.mjs"
import { buildConvLines, convViewport } from "./render-conversation.mjs"
import { toggleFoldBlock, scrollFoldBlock, foldScrollOffset } from "./fold-block.mjs"
import { cancelAsyncSubagent, cancelSyncChild } from "@thincoder/core/agent-tools/subagent-async.mjs"
import { cancelAsyncAdvisor, refreshAdvisorQueuedTokens } from "@thincoder/core/agent-tools/advisor-async.mjs" // ED-4：评审队列排队块刷新
import { maybeRefillAsync, refreshQueuedTokens } from "@thincoder/core/agent-tools/subagent-scheduler.mjs" // F-2：queued 取消后续（补位/位置刷新）——叶子模块
import { routeSubToken } from "./subagent-blocks.mjs" // F-2：queued 取消块移除（⟦ev⟧cancelled 就地路由——引擎动作路径同通道）
import { denyModalForOwner } from "./key-modes.mjs"
import { C } from "./ansi.mjs"

/** 2026-08-31 滚轮事件分派（用户需求"展开块能滚动阅读全文"）：坐标命中展开块内容行 →
 *  块内逐行滚动（scrollFoldBlock ±3）；未命中 → 会话滚动（调用方继续处理）。
 *  ctx: { state, render }；返回 true = 已消费（块内滚动），false = 调用方走会话滚动。 */
export function handleWheel(ctx, button, col, row) {
  const { state } = ctx
  const dir = button === 64 ? -1 : 1 // 64=滚上（offset 减）、65=滚下
  const r = row - 1
  if (r < 0) return false
  const dims = state.dims ? state.dims.get() : { cols: process.stdout.columns || 80, rows: process.stdout.rows || 24 }
  if (mouseOob(col, row, dims)) return false // F-3 sane-gate ②：越界滚轮丢弃——不落面板（> 非 >=——末行列合法）
  const layout = computeLayout(state, dims)
  const P = layout.panels
  // §7.2.1 D4: 固定子agent 面板（conversation 与 todo 之间）——面板行默认穿出
  // 滚会话（F3，与 todo 面板同型）；命中展开区块内容行（_foldBlock 标记）→
  // 块内滚动（现状能力不丢）。
  if (P.subagent && r >= P.subagent.y && r < P.subagent.y + P.subagent.h) {
    // 评审 #4：面板部分压缩（保底截断）后可见行 = 分隔线 + 末尾行——命中映射经
    // subagentLineIndex（与 render-frame 同一几何契约），不再把行内坐标直接当索引用。
    const lineEl = layout.subagentLines[subagentLineIndex(layout.subagentLines, P.subagent.h, r - P.subagent.y)]
    if (!lineEl?._foldBlock || !lineEl._foldTotal) return false
    // 穿出语义与会话区块一致：块内到边界（顶滚上 / 底滚下）→ 交还会话滚动
    const before = foldScrollOffset(state, lineEl._foldBlock)
    const winH = lineEl._foldWindow ?? 1
    const total = lineEl._foldTotal
    if (dir < 0 && before <= 0) return false
    if (dir > 0 && before >= total - winH) return false
    scrollFoldBlock(state, lineEl._foldBlock, dir, 3)
    ctx.render?.()
    return true
  }
  if (r < P.conversation.y || r >= P.conversation.y + P.conversation.h) return false
  const convLines = buildConvLines(state, dims.cols, dims.rows)
  const gIdx = convGlobalIndex(convLines.length, P.conversation.h, state.scroll ?? 0)(r - P.conversation.y)
  if (gIdx === null) return false
  const lineEl = convLines[gIdx]
  if (!lineEl?._foldBlock) return false
  // 2026-08-31 会诊 glm：标记不完整（_foldTotal 缺失=退化路径）不消费——交还会话滚动
  // （total=0 会让下方边界守卫短路 → 卡在块里回归）
  if (!lineEl._foldTotal) return false
  // 2026-08-31 穿出语义：块内已到边界（向上滚在顶 / 向下滚在底）→ 交还会话滚动——
  // 否则滚轮永远被块吃掉，会话顶/懒加载不可达（用户实测路径"经过展开块滚不到顶"）
  const before = foldScrollOffset(state, lineEl._foldBlock)
  const winH = lineEl._foldWindow ?? 1
  const total = lineEl._foldTotal
  if (dir < 0 && before <= 0) return false // 块顶滚上 → 穿出（会话滚动 → 顶部自动加载）
  if (dir > 0 && before >= total - winH) return false // 块底滚下 → 穿出
  scrollFoldBlock(state, lineEl._foldBlock, dir, 3)
  ctx.render?.()
  return true
}


/** Extract left-click presses from a chunk. Returns [{ col, row }] (1-based). */
export function parseMouseClicks(text) {
  const out = []
  // 有意为之：控制字符协议/转义序列剥离正则（ANSI/⟦ev⟧/SGR/history 双线分隔）
  for (const m of text.matchAll(/\x1b\[<0;(\d+);(\d+)M/g)) {
    out.push({ col: Number(m[1]), row: Number(m[2]) })
  }
  return out
}

/** F-3 sane-gate（RESIZE-MOUSE-LEAK-FIX）：越界坐标判定——resize 后短窗口越界上报丢弃
 *  （col > dims.cols || row > dims.rows——> 非 >=——末行列合法——与 dims.mjs 同哲学）。
 *  落点：① handleMouseClick 入口 ② handleWheel 入口 ③ index.mjs 滚轮 fallback 前（评审 #3 定稿）。 */
export function mouseOob(col, row, dims) {
  return col > dims.cols || row > dims.rows
}

/** Map a 0-based screen row to a conversation line index (same math as renderConversation). */
export function convGlobalIndex(convLen, convH, scroll) {
  const { start, pad } = convViewport(convLen, convH, scroll)
  return (localRow) => {
    if (localRow < 0 || localRow >= convH) return null
    if (localRow < pad) return null // 顶部 pad 空行不是内容行（2026-08-31 会诊 kimi 缺陷 1）
    const idx = start + localRow - pad
    return idx >= 0 && idx < convLen ? idx : null
  }
}

/**
 * Handle a left-click at SGR (col, row) — 1-based terminal coordinates.
 * ctx: { state, render, popPicker }
 * Returns true when the click was consumed.
 */
export function handleMouseClick(ctx, col, row) {
  const { state, render } = ctx
  const r = row - 1 // 0-based screen row
  if (r < 0) return false
  // Single source (Windows ConPTY instability, 2026-08-30): the cached dims,
  // never a live read that can flip between stale and fresh values.
  const dims = state.dims ? state.dims.get() : { cols: process.stdout.columns || 80, rows: process.stdout.rows || 24 }
  if (mouseOob(col, row, dims)) return false // F-3 sane-gate ①：越界点击丢弃——resize 后短窗口越界上报不落应用（> 非 >=——末行列合法）
  const layout = computeLayout(state, dims)
  const P = layout.panels

  // ── Picker: click an option = select it (skip the title row) ──
  if (state.picker && P.picker && r >= P.picker.y && r < P.picker.y + P.picker.h) {
    const p = state.picker
    const items = p.filteredItems ?? p.entries.filter((e) => e.type === "item")
    const winH = Math.max(1, P.picker.h - 1)
    const start = Math.max(0, Math.min(p.scroll, Math.max(0, p.lines.length - winH)))
    const localRow = r - P.picker.y - 1
    const lineEl = p.lines[start + localRow]
    if (lineEl && lineEl._row !== undefined && items[lineEl._row]) {
      ctx.popPicker(items[lineEl._row])
    }
    return true
  }

  // ── §7.2.1 D4: 固定子agent 面板（conversation 与 todo 之间）——折叠/展开/翻窗
  // 坐标映射到面板行（与 todo 面板同型；layout.subagentLines = 面板渲染行）。
  if (P.subagent && r >= P.subagent.y && r < P.subagent.y + P.subagent.h) {
    // 评审 #4：保底截断后可见行 ≠ 前 h 行——命中映射与 render-frame 同一几何契约
    // （subagentLineIndex：分隔线 + 末尾区块行优先）。
    const lineEl = layout.subagentLines[subagentLineIndex(layout.subagentLines, P.subagent.h, r - P.subagent.y)]
    // §19.5 D-M7/D-M7b ⏹ 停止标记（round1 #6 + 用户裁定 B 形态）+ SYNC-CANCEL F3
    // （2026-09-09）：列级命中——⏹ 列点击 = cancel（定向该子代理——ctx.cancelSubagent
    // 直连池/registry abort 路径，不经模型回合），不触发折叠翻转；**async 区块与 registry
    // live 的 sync 区块带 _stopSub 元数据**（headless 无 _agent → sync 不钉——零回归）；
    // ⏹ 区外点击照常走折叠/翻窗。
    if (lineEl?._stopSub && col >= (lineEl._stopCol ?? Infinity)) {
      ctx.cancelSubagent?.(lineEl._stopSub)
      render()
      return true
    }
    if (lineEl?._foldScrollUp || lineEl?._foldScrollDown) {
      // ▲/▼ 控制行点击翻窗（60% 封顶保留、窗口随翻滚动，全文可达）
      scrollFoldBlock(state, lineEl._foldScrollUp ?? lineEl._foldScrollDown,
        lineEl._foldScrollUp ? -1 : 1, lineEl._foldWindow ?? 1,
        typeof lineEl._foldTotal === "number" ? Math.max(0, lineEl._foldTotal - (lineEl._foldWindow ?? 1)) : undefined)
      render()
      return true
    }
    if (!lineEl?._foldToggle) return false
    // 双向切换（fold-block.mjs 单源）：折叠头展开 / ▼ 控制收起
    toggleFoldBlock(state, lineEl._foldToggle)
    render()
    return true
  }

  // ── Conversation: click a fold marker (expand hint or collapse marker) toggles it ──
  if (r >= P.conversation.y && r < P.conversation.y + P.conversation.h) {
    const convLines = buildConvLines(state, dims.cols, dims.rows)
    const gIdx = convGlobalIndex(convLines.length, P.conversation.h, state.scroll ?? 0)(r - P.conversation.y)
    if (gIdx === null) return false
    const lineEl = convLines[gIdx]
    if (lineEl?._foldScrollUp || lineEl?._foldScrollDown) {
      // 2026-08-31 块内滚动：▲/▼ 控制行点击翻窗（60% 封顶保留、窗口随翻滚动，全文可达）
      scrollFoldBlock(state, lineEl._foldScrollUp ?? lineEl._foldScrollDown,
        lineEl._foldScrollUp ? -1 : 1, lineEl._foldWindow ?? 1,
        typeof lineEl._foldTotal === "number" ? Math.max(0, lineEl._foldTotal - (lineEl._foldWindow ?? 1)) : undefined)
      render()
      return true
    }
    if (!lineEl?._foldToggle) return false
    // Bidirectional toggle — single source in fold-block.mjs (expand a folded
    // block, collapse an expanded one).
    toggleFoldBlock(state, lineEl._foldToggle)
    render()
    return true
  }

  return false
}

/** 鼠标装配簇（2026-09-03 D-S1a 自 index.mjs 迁入）：index.mjs 只留装配调用。
 *  ctx: { agent, state, pushLine, render, popPicker }；返回 { onMouseClick, mouseCtx }。
 *  cancelSubagent（⏹ 停止标记，§19.5 D-M7）：UI 停止不经模型回合，直连池 abort——
 *  与 action:"cancel" 同实现路径。block key "role#id" → 池条目 id。 */
export function createMouseDispatch({ agent, state, pushLine, render, popPicker }) {
  const cancelSubagent = (key) => {
    try {
      const id = key.slice(key.lastIndexOf("#") + 1)
      const isAdvisorBlock = key.startsWith("advisor#")
      // af 批 #1（发射单源化）：`emit` = 本层通道，传进核调用供其单点发射（本层不另发）。
      const emit = (t) => { if (!routeSubToken(state, t, render)) pushLine(t, C.dim) }
      // §11.2 D-24b (②-6b): ⏹ on an advisor block cancels the background review
      // (directed abort → cancelled settle: no pending entry / no token).
      // SYNC-CANCEL F3: async 池/advisor miss 后查 sync registry（⏹ 门控已放开 sync——
      // cancelSyncChild 与 async cancel 同模块同形态——subagent-async.mjs）。
      let r = isAdvisorBlock
        ? cancelAsyncAdvisor(agent, id, emit)
        : cancelAsyncSubagent(agent, id)
      let syncStopped = false
      if (!isAdvisorBlock && r?.status === "error") {
        r = cancelSyncChild(agent, key)
        syncStopped = r?.status === "cancelled"
      }
      if (r?.status === "error") {
        // 拒绝文案改（SYNC-CANCEL）：registry/池 miss + live 块 → 定向中止窗口已过
        // （成功/折叠/整回合停后 finally 注销——"finished or stop no longer applies"——
        // 原 "blocking (sync) child mid-call — targeted stop not available" 文案退役——
        // sync 现已可中止）；无 live 块（真 miss/未知 key）→ 原错误直显。
        const liveBlock = state.subTasks?.[key] && !state.subTasks[key].done
        pushLine(liveBlock
          ? `[subagent stop] ${key} has finished or stop no longer applies`
          : `[subagent stop] ${r.error}`, C.error)
      } else {
        // SYNC-CANCEL v2 模态 deny（用户裁）：**sync ⏹** 顺带 deny 该 child 的 pending
        // ask（权限/continue 模态）——模态立即解除——child 解绕折叠（async cancel 的
        // 同类缺陷现状已知——非本批引入——v2 deny 机制后续可复用到 async——此处仅
        // syncStopped 路径 deny——async 成功取消不 deny 模态——零回归）。
        if (syncStopped) denyModalForOwner(state, key, { pushLine, render })
        // F-2（QUEUED-VISIBILITY——2026-09-09）：queued 出队（引擎返回 was:"queued"——
        // 无 settle 事件链）——UI 直连路径无回合 ctx 事件流——补 executeCancelAction
        // 同款 TUI 维护：等待块移除（⟦ev⟧cancelled 就地路由——守卫同 routeSubToken
        // cancelled 分支——不冻结）+ 补位 + 剩余排队头位置/依赖标注刷新（⟦ev⟧queued）。
        // af 批去重（#1 单源化）：共享行加 `!isAdvisorBlock` 守卫——评审族发射已由核单点经
        // 上方 `emit` 通道完成；子代理族自持发射面零改（该族两路互斥、各发一次）。
        if (r?.was === "queued") {
          if (!isAdvisorBlock) emit(`${key}/⟦ev⟧cancelled\x1e`)
          maybeRefillAsync(agent)
          refreshQueuedTokens(agent, emit)
          // ED-4（评审池排队语义）：advisor 队列余位位置刷新（subagent 队列同构面）。
          if (isAdvisorBlock) refreshAdvisorQueuedTokens(agent, emit)
        }
        pushLine(`[subagent ${key} stop requested]`, C.warn)
      }
    } catch (e) {
      pushLine(`[subagent stop] ${e?.message ?? String(e)}`, C.error)
    }
    render()
  }
  const onMouseClick = (col, row) => handleMouseClick({ state, render, popPicker, cancelSubagent }, col, row)
  const mouseCtx = () => ({ state, render })
  return { onMouseClick, mouseCtx }
}
