/**
 * permission-gate.mjs — the per-turn tool permission gate.
 *
 * Two sources of truth: the `autoApprove` session-slot snapshot taken when a turn
 * starts (persisted, cross-turn) and the live `panel._autoApprove` flag that
 * approve-all / the AUTO toolbar button flip MID-TURN. runAgent receives the
 * startup snapshot (as a getter), which cannot change while the agent loop is
 * running — so the gate re-checks the live flag on every invocation. Without
 * this, clicking "Approve All" only clears the currently queued prompts and
 * every later tool call of the SAME turn asks again.
 *
 * §18 C-4/C-6（child permission gate——2026-09-12）：per-item 询问携带
 * `promptId`（question 的 `_questionSeq` 同构）+ `owner`（child 卡归属——
 * opts.owner.label，depth-0 调用不传 → null 向后兼容）；释放统一走
 * `releasePermission`（出队 + resolve + `permissionWithdrawn`）——挂三路：
 * ① opts.signal（child 定向取消/⏹）② panel._abortController（轮级 Stop）
 * ③ approve-all 连带（panel-messages.mjs 消费同一 helper）。
 */

/**
 * Unified release（§18 C-6）: dequeue + resolve + post `permissionWithdrawn`
 * （webview 据此移除对应卡——不再依赖本地点击）。三路释放共用本 helper；
 * 重复释放（用户已答 / 另一路先到）→ no-op（返回 false，零双 resolve）。
 * @param {{ _permissionQueue: {id:number, resolve:Function}[], _panel?: { webview: { postMessage: Function } } }} panel
 * @param {{ id:number, resolve:Function }} entry
 * @param {boolean} verdict
 */
export function releasePermission(panel, entry, verdict) {
  const q = panel._permissionQueue
  const i = q.indexOf(entry)
  if (i < 0) return false // 已由用户响应/另一路释放——no-op（幂等）
  q.splice(i, 1)
  entry.resolve(verdict)
  panel._panel?.webview.postMessage({ type: "permissionWithdrawn", promptId: entry.id })
  return true
}

/**
 * Build the permission gate for one turn. Returns undefined when autoApprove is
 * already on (no gate at all — execute-tools skips the permission check), else
 * a callback that re-checks the live flag before prompting.
 * Signature: `(toolName, args, diffInfo, opts?) => Promise<boolean>` — `opts` =
 * `{ owner, signal }`（child 通道传——child-permission.mjs；depth-0 既有调用不传）。
 * @param {{ _autoApprove: boolean, _permissionQueue: {resolve: Function}[], _panel?: { webview: { postMessage: Function } } }} panel
 */
export function permissionGate(panel) {
  if (panel._autoApprove) return undefined
  return (toolName, args, diffInfo, opts) => new Promise((resolve) => {
    // Re-check on every invocation: approve-all / AUTO may have flipped the
    // flag after this gate was built. Honoring it immediately stops repeated
    // permission prompts for the rest of the running turn.
    if (panel._autoApprove) { resolve(true); return }
    // C-4：promptId = 单调计数（question 的 _questionSeq 同构）——webview 响应按 id 精确路由
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
  })
}

/**
 * §16 D-B1 batch permission gate: one merged ask for a same-response batch of non-readonly
 * tools. Returns "approveAll" / "oneByOne" / "deny" (deny → the whole batch is refused,
 * no second ask; oneByOne → the caller falls back to the per-item channel).
 * No handler → execute-tools falls back to per-item asks (NF-B1: ACP bridge / headless /
 * old versions are never blocked by the batch).
 * §18 C-1/Q1：批合并保持 depth-0（child 不入批合并——逐项卡）。
 * @param {{ _autoApprove: boolean, _batchPermissionQueue: {resolve: Function}[], _panel?: { webview: { postMessage: Function } } }} panel
 */
export function batchPermissionGate(panel) {
  if (panel._autoApprove) return undefined
  return ({ tools, count }) => new Promise((resolve) => {
    if (panel._autoApprove) { resolve("approveAll"); return }
    const entry = { resolve }
    panel._batchPermissionQueue = panel._batchPermissionQueue ?? []
    panel._batchPermissionQueue.push(entry)
    panel._setStatus?.("waiting")
    panel._panel?.webview.postMessage({ type: "batchPermissionRequest", tools, count })
    // Stop must release a batch-parked turn — same abort semantics as the per-item gate.
    const onAbort = () => {
      const i = panel._batchPermissionQueue.indexOf(entry)
      if (i >= 0) panel._batchPermissionQueue.splice(i, 1)
      resolve("deny")
    }
    const sig = panel._abortController?.signal
    if (sig?.aborted) onAbort()
    else sig?.addEventListener("abort", onAbort, { once: true })
  })
}
