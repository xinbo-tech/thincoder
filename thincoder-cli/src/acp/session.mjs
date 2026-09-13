/**
 * session.mjs — one ACP session = one thincoder agent instance.
 *
 * - `run(input)` serializes prompts through a per-session FIFO promise chain
 *   (concurrent prompts queue; each runs after the previous turn's end_turn).
 * - `cancel()` aborts the in-flight turn via a REAL AbortController — the
 *   provider layer composes `AbortSignal.any([signal, timeout])` (core.mjs:280,
 *   anthropic.mjs:67, google.mjs:98), which requires a real AbortSignal; a
 *   plain object would throw TypeError on every LLM call.
 * - The controller is rebuilt after every turn, so one cancel only affects the
 *   in-flight turn; the next queued prompt starts with a clean signal.
 * - `run` is injectable for tests (defaults to the real runAgent).
 */
import { runAgent } from "../agent.mjs"
import { saveSession } from "../session.mjs"
import { buildAcpCallbacks } from "./bridge.mjs"

export function createAcpSession({ id, agent, notify, request = async () => { throw new Error("no request channel") }, log = () => {}, run = runAgent, save = saveSession }) {
  let controller = new AbortController()
  const callbacks = buildAcpCallbacks({ sessionId: id, notify, request, log })
  let queue = Promise.resolve()
  let busy = false

  return {
    id,
    agent,
    get busy() { return busy },
    run(input) {
      const task = queue.then(async () => {
        busy = true
        try {
          return await run(agent, input, callbacks, { signal: controller.signal })
        } finally {
          busy = false
          // Fresh controller per turn: cancel() only affects the in-flight turn.
          controller = new AbortController()
          // Persist the session archive at EVERY turn end (success/cancel/failure —
          // finally semantics, desktop proposal ACP-SESSION-PERSISTENCE §2.1 US-E4):
          // session/list / load / resume get a real data source; a save failure must
          // never break the queue chain.
          try { save(agent) } catch (e) { log(`[session] save failed: ${e?.message ?? e}`) }
        }
      })
      // Keep the chain alive even when a turn rejects (the next prompt still runs).
      queue = task.then(() => {}, () => {})
      return task
    },
    cancel() {
      controller.abort({ interrupt: true, message: "cancelled by client" })
    },
  }
}
