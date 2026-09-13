/**
 * transport.mjs — ACP NDJSON JSON-RPC 2.0 layer over stdio (zero dependencies).
 *
 * Wire format: one JSON object per line on stdin/stdout. stdout carries ONLY
 * protocol JSON (logs go to stderr — kimi log-guard parity). Error codes follow
 * JSON-RPC 2.0: -32600 parse, -32601 method not found, -32602 invalid params,
 * -32603 internal, -32000 authRequired (ACP extension).
 *
 * `write` is injectable for tests (defaults to process.stdout.write). `start()`
 * wires stdin + graceful shutdown (SIGINT/SIGTERM drain in-flight requests).
 */
import { createInterface } from "node:readline"

export const ACP_ERRORS = {
  PARSE: { code: -32600, message: "Parse error" },
  METHOD_NOT_FOUND: { code: -32601, message: "Method not found" },
  INVALID_PARAMS: { code: -32602, message: "Invalid params" },
  INTERNAL: { code: -32603, message: "Internal error" },
  AUTH_REQUIRED: { code: -32000, message: "authRequired" },
}

/**
 * Create an ACP server.
 * @param {Record<string, (params, ctx) => Promise<any>|any>} handlers — method → handler.
 *   Handler return value becomes `result`; `{ error: ACP_ERRORS.X }` becomes an error response;
 *   a thrown error becomes -32603.
 * @param {{ write?: (s: string) => void, log?: (s: string) => void }} [opts]
 */
export function createAcpServer(handlers, { write = (s) => process.stdout.write(s), log = () => {} } = {}) {
  const state = { closed: false, inputClosed: false, inflight: new Set() }
  const pending = new Map() // agent-initiated requests awaiting a client response (request_permission, fs/*)
  let nextReqId = 1
  const send = (obj) => { if (!state.closed) write(JSON.stringify(obj) + "\n") }
  const notify = (method, params) => send({ jsonrpc: "2.0", method, params })

  /**
   * Agent-initiated JSON-RPC request: send with an id and await the client's
   * response. Used for `session/request_permission` and `fs/read_text_file` /
   * `fs/write_text_file` (reverse-RPC). Times out defensively — a silent
   * client must never hang the agent loop.
   */
  function request(method, params, { timeoutMs = 60000 } = {}) {
    return new Promise((resolve, reject) => {
      const id = `rpc-${nextReqId++}`
      const timer = setTimeout(() => {
        pending.delete(id)
        reject(new Error(`ACP client did not respond to ${method} within ${timeoutMs}ms`))
      }, timeoutMs)
      pending.set(id, { resolve, reject, timer })
      send({ jsonrpc: "2.0", id, method, params })
    })
  }

  // stdin EOF only means "no more requests" — in-flight handlers must still
  // deliver their responses (e.g. session/new building an agent). Closed only
  // after the last handler settles.
  const drainIfDone = () => { if (state.inputClosed && state.inflight.size === 0) state.closed = true }

  // Inbound requests are serialized (FIFO): ACP sessions have ordering
  // dependencies (prompt must follow new), and a naive client may fire lines
  // back-to-back without awaiting responses. Each line's handler is awaited
  // before the next line is processed — ordering is guaranteed end-to-end.
  // EXCEPTION: responses to agent-initiated requests (request_permission /
  // fs/*) resolve the pending waiter IMMEDIATELY, outside the queue — the
  // prompt handler awaiting them blocks the queue, so queuing them would
  // deadlock (client response waits for queue, queue waits for handler).
  let inbound = Promise.resolve()
  function handleLine(line) {
    let msg
    try { msg = JSON.parse(line) } catch {
      // Malformed line. If it LOOKS like a response to an agent-initiated
      // request (has an "rpc-" id), reject the waiter NOW — the prompt handler
      // awaiting it would otherwise hang until the timeout.
      const m = /"id"\s*:\s*"?(rpc-\d+)"?/.exec(line)
      if (m && pending.has(m[1])) {
        const waiter = pending.get(m[1])
        pending.delete(m[1])
        clearTimeout(waiter.timer)
        waiter.reject(new Error("ACP client sent a malformed response"))
        return
      }
      // Otherwise → queued path emits the parse error in order.
    }
    if (msg && typeof msg === "object" && msg.method === undefined && msg.id !== undefined) {
      resolveClientResponse(msg)
      return
    }
    const task = inbound.then(() => processLine(line)).catch(() => {})
    inbound = task
    state.inflight.add(task)
    task.finally(() => { state.inflight.delete(task); drainIfDone() }).catch(() => {})
    return task
  }

  function resolveClientResponse(msg) {
    const waiter = pending.get(String(msg.id))
    if (!waiter) return
    pending.delete(String(msg.id))
    clearTimeout(waiter.timer)
    if (msg.error) waiter.reject(Object.assign(new Error(msg.error.message ?? "ACP client error"), { code: msg.error.code }))
    else waiter.resolve(msg.result ?? {})
  }

  async function processLine(line) {
    let msg
    try {
      msg = JSON.parse(line)
    } catch {
      send({ jsonrpc: "2.0", id: null, error: ACP_ERRORS.PARSE })
      return
    }
    if (!msg || typeof msg !== "object") return
    // Responses were already handled out-of-band in handleLine; anything left
    // here with no method is a stray notification — ignore silently.
    if (msg.method === undefined) return
    const handler = handlers[msg.method]
    if (!handler) {
      if (msg.id !== undefined) send({ jsonrpc: "2.0", id: msg.id, error: ACP_ERRORS.METHOD_NOT_FOUND })
      return
    }
    try {
      const result = await handler(msg.params ?? {}, { notify, send, log })
      if (msg.id !== undefined) {
        if (result && typeof result === "object" && result.error) {
          send({ jsonrpc: "2.0", id: msg.id, error: result.error })
        } else {
          send({ jsonrpc: "2.0", id: msg.id, result })
        }
      }
    } catch (e) {
      log(`[acp] handler error: ${e?.message ?? e}`)
      if (msg.id !== undefined) {
        send({ jsonrpc: "2.0", id: msg.id, error: { ...ACP_ERRORS.INTERNAL, message: e?.message ?? String(e) } })
      }
    }
  }

  /** Wire stdin + shutdown handlers. Returns the notify fn for out-of-band pushes. */
  function start() {
    const rl = createInterface({ input: process.stdin, crlfDelay: Infinity })
    rl.on("line", (l) => { if (l.trim()) handleLine(l) })
    rl.on("close", () => { state.inputClosed = true; drainIfDone() })
    const shutdown = () => {
      log("[acp] shutting down — draining in-flight requests")
      Promise.all([...state.inflight]).then(() => { state.closed = true; process.exit(0) })
      setTimeout(() => process.exit(0), 2000).unref()
    }
    process.on("SIGINT", shutdown)
    process.on("SIGTERM", shutdown)
    return { notify, shutdown }
  }

  // handleLine/_state exposed for tests (drive without a real stdin).
  return { start, notify, request, handleLine, _state: state }
}
