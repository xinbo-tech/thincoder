/**
 * permission-gate.mjs — the per-turn tool permission gate.
 *
 * Single source of truth for the JUDGMENT: the live `panel._autoApprove` flag that
 * approve-all / the AUTO toolbar button flip MID-TURN (the session-slot snapshot
 * still feeds the getAuto closure elsewhere — the gate itself never reads at build
 * time). The gate is always present and reads the live flag on EVERY ask, so
 * flipping AUTO mid-turn takes effect immediately for the rest of the running
 * turn (per-tool gate and batch gate alike — same-turn, no re-ask; ED-2 2026-09-16).
 *
 * §18 C-4/C-6（child permission gate——2026-09-12）：per-item 询问携带
 * `promptId`（question 的 `_questionSeq` 同构）+ `owner`（child 卡归属——
 * opts.owner.label，depth-0 调用不传 → null 向后兼容）；释放统一走
 * `releasePermission`（出队 + resolve + `permissionWithdrawn`）——挂三路：
 * ① opts.signal（child 定向取消/⏹）② panel._abortController（轮级 Stop）
 * ③ approve-all 连带（panel-messages.mjs 消费同一 helper）。
 *
 * P2 批 docs/batches/2026-09-20-mechanism-parity-batch.md §2.20（#165 落点）：**闸语义 / 请示流程改经核单源**——`askPermission`
 * （`@thincoder/core/permission.mjs:60-64`）的 `io.ask` 缝；本端只供**展示面**
 * （面板卡片 / 队列 / 释放三路）——卡片形态与载荷零改。
 */
import { askPermission } from "@thincoder/core/permission.mjs"

/**
 * Unified release（AGENT-LOOP-SUBAGENT.md §6.7.6 C-6）: dequeue + resolve + post `permissionWithdrawn`
 * （webview 据此移除对应卡——不再依赖本地点击）+ `_refreshStatus`（F-W13 族：释放 ⇒ 状态栏必刷
 * ——刷新点单源 = 本通道；判据与落点 = WEBVIEW-PROTOCOL.md §4.4 · §4.6）。
 * 三路释放共用本 helper；批合并卡同族（`queue` = 批队——判定值域不同故队列分立）。
 * 重复释放（用户已答 / 另一路先到 / 条目不在队）→ no-op（返回 false，零双 resolve，零刷新）。
 * @param {{ _permissionQueue: {id:number, resolve:Function}[], _refreshStatus?: Function, _panel?: { webview: { postMessage: Function } } }} panel
 * @param {{ id:number, resolve:Function }} entry
 * @param {boolean|string} verdict 逐项 = boolean；合并 = "approveAll"/"oneByOne"/"deny"
 * @param {{ id:number, resolve:Function }[]} [queue] 缺省 = `panel._permissionQueue`
 */
export function releasePermission(panel, entry, verdict, queue) {
  const q = queue ?? panel._permissionQueue
  const i = q.indexOf(entry)
  if (i < 0) return false // 已由用户响应/另一路释放——no-op（幂等）
  q.splice(i, 1)
  entry.resolve(verdict)
  panel._panel?.webview.postMessage({ type: "permissionWithdrawn", promptId: entry.id })
  panel._refreshStatus?.() // 释放 ⇒ 状态栏重算（waiting 判据含批权限队列——§4.4）
  return true
}

/**
 * Build the permission gate for one turn. Always returns the callback — the
 * judgment is the live `panel._autoApprove` read at ASK time, never at build
 * （ED-2 2026-09-16：删构建期早退——构建期取值 = 半 live 缺口；父级与子代同判据单源）。
 * Signature: `(toolName, args, diffInfo, opts?) => Promise<boolean>` — `opts` =
 * `{ owner, signal }`（child 通道传——child-permission.mjs；depth-0 既有调用不传）。
 * @param {{ _autoApprove: boolean, _permissionQueue: {resolve: Function}[], _panel?: { webview: { postMessage: Function } } }} panel
 */
export function permissionGate(panel) {
  // 闸语义 / 请示流程 = 核单源（P2 批 docs/batches/2026-09-20-mechanism-parity-batch.md §2.20——`askPermission` 的 `io.ask` 缝）；本端只供展示面。
  return (toolName, args, diffInfo, opts) => askPermission(toolName, args, {
    ask: () => new Promise((resolve) => {
      // Re-check on every invocation: approve-all / AUTO may have flipped the
      // flag after this gate was built. Honoring it immediately stops repeated
      // permission prompts for the rest of the running turn.
      if (panel._autoApprove) { resolve(true); return }
      // C-4：promptId = 单调计数（question 的 `_questionSeq` 同构）——webview 响应按 id 精确路由
      panel._permissionSeq = (panel._permissionSeq ?? 0) + 1
      const id = panel._permissionSeq
      const entry = { id, resolve, toolName, owner: opts?.owner ?? null }
      panel._permissionQueue.push(entry)
      panel._setStatus?.("waiting")
      panel._panel?.webview.postMessage({ type: "permissionRequest", tool: toolName, args: JSON.stringify(args, null, 2), diff: diffInfo, owner: opts?.owner?.label ?? null, promptId: id })
      const release = (verdict) => releasePermission(panel, entry, verdict)
      // Stop must release a permission-parked turn — otherwise the loop hangs on
      // this promise until the user answers the (now irrelevant) prompt.
      // C-6 ②：轮级 Stop（panel._abortController abort——F-6：不停后台池）→ deny 释放。
      const onAbort = () => release(false)
      const turnSig = panel._abortController?.signal
      if (turnSig?.aborted) onAbort()
      else turnSig?.addEventListener("abort", onAbort, { once: true })
      // C-6 ①：child 定向取消（opts.signal = 条目级 controller——⏹/cancel/会话中止逐链）
      // → deny 释放 + 卡移除（Q3：一机制覆盖三路——模型 cancel 与会话中止同路径）。
      const sig = opts?.signal
      if (sig) {
        if (sig.aborted) onAbort()
        else sig.addEventListener("abort", onAbort, { once: true })
      }
    }),
  })
}

/**
 * D-B1 batch permission gate: one merged ask for a same-response batch of non-readonly
 * tools. Returns "approveAll" / "oneByOne" / "deny" (deny → the whole batch is refused,
 * no second ask; oneByOne → the caller falls back to the per-item channel).
 * No handler → execute-tools falls back to per-item asks (NF-B1: ACP bridge / headless /
 * old versions are never blocked by the batch).
 * AGENT-LOOP-SUBAGENT.md §6.7.6 C-1/Q1：批合并保持 depth-0（child 不入批合并——逐项卡）。
 * @param {{ _autoApprove: boolean, _batchPermissionQueue: {resolve: Function}[], _panel?: { webview: { postMessage: Function } } }} panel
 */
export function batchPermissionGate(panel) {
  return ({ tools, count }) => new Promise((resolve) => {
    if (panel._autoApprove) { resolve("approveAll"); return }
    // F-W13（D-W15）：合并卡同携 `promptId`——与逐项卡共用同一单调计数器（`_permissionSeq`
    // ——跨族唯一 ⇒ 同一移除选择器不误删）；释放走同一通道 `releasePermission`（队列分立
    // ——判定值域不同：逐项 boolean / 合并字符串）。
    panel._permissionSeq = (panel._permissionSeq ?? 0) + 1
    const id = panel._permissionSeq
    const entry = { id, resolve }
    panel._batchPermissionQueue = panel._batchPermissionQueue ?? []
    panel._batchPermissionQueue.push(entry)
    panel._setStatus?.("waiting")
    panel._panel?.webview.postMessage({ type: "batchPermissionRequest", tools, count, promptId: id })
    // Stop must release a batch-parked turn — same abort semantics as the per-item gate
    // （轮级 Stop / Ctrl+I ⇒ 同一释放通道：出队 + resolve deny + permissionWithdrawn + 状态栏刷新）。
    const onAbort = () => releasePermission(panel, entry, "deny", panel._batchPermissionQueue)
    const sig = panel._abortController?.signal
    if (sig?.aborted) onAbort()
    else sig?.addEventListener("abort", onAbort, { once: true })
  })
}
