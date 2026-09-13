/**
 * mcp/stdio.mjs — stdio transport for MCP
 *
 * Spawns a child process and communicates over stdin/stdout using
 * JSON-RPC newline-delimited protocol. On Windows, wraps commands
 * without a .exe extension through cmd.exe for proper PATH resolution.
 */

import { spawn } from "node:child_process"
import { rpcId, withTimeout, quoteArg, CALL_TIMEOUT_MS } from "./utils.mjs"

/** Kill the child AND its whole process tree (2026-08-31 MCP 会诊 P2——同 CLI）。
 *  win32: cmd.exe 包装 spawn 的孙进程必须 taskkill /T /F 才杀净；POSIX SIGTERM 后 SIGKILL 兜底。 */
function killTree(child) {
  if (!child.pid) return
  if (process.platform === "win32") {
    try { spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true }) } catch { /* best effort */ }
    return
  }
  try {
    child.kill("SIGTERM")
    setTimeout(() => { try { child.kill("SIGKILL") } catch { /* already gone */ } }, 2000).unref?.()
  } catch { /* best effort */ }
}

/** Create an MCP stdio transport.
 *  @param {Object} [env] — extra environment variables merged on top of process.env
 *  (2026-08-31 MCP 会诊 P3：vscode 端此前静默丢弃 config.env，stdlib server 的
 *  环境变量密钥必连不上——CLI 端一直有 env 参数，此处对齐)。 */
export function stdioTransport(command, args, env) {
  const spawnOpts = { stdio: ["pipe", "pipe", "pipe"], windowsHide: true, env: { ...process.env, ...env } }
  const child =
    process.platform === "win32" && !/\.exe$/i.test(command)
      ? spawn("cmd.exe", ["/d", "/s", "/c", [command, ...(args ?? [])].map(quoteArg).join(" ")], {
          ...spawnOpts,
          windowsVerbatimArguments: true,
        })
      : spawn(command, args ?? [], spawnOpts)

  const pending = new Map()
  const decoder = new TextDecoder()
  let buffer = ""
  let stderrTail = ""
  let spawnError = null
  let closed = false
  let deadFired = false
  let deadListeners = new Set()

  /** 2026-08-31 MCP 会诊 P5：意外死亡通知（进程自杀/崩溃，非主动 close——CLI parity）。 */
  const fireDead = (msg) => {
    if (deadFired) return
    deadFired = true
    for (const cb of deadListeners) { try { cb(msg) } catch { /* listener error */ } }
  }
  const onDead = (cb) => { deadListeners.add(cb); return () => deadListeners.delete(cb) }

  const failAll = (message) => {
    for (const [, resolve] of pending) resolve({ id: null, error: { code: -32000, message } })
    pending.clear()
  }

  child.stdout.on("data", (chunk) => {
    buffer += typeof chunk === "string" ? chunk : decoder.decode(chunk, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop() ?? ""
    for (const line of lines) {
      if (!line.trim()) continue
      try {
        const msg = JSON.parse(line)
        const resolver = pending.get(msg.id)
        if (resolver) {
          pending.delete(msg.id)
          resolver(msg)
        }
      } catch { /* non-JSON line, ignore */ }
    }
  })

  child.stderr.on("data", (chunk) => {
    stderrTail = (stderrTail + chunk.toString()).slice(-2000)
  })

  child.stdin.on("error", () => {})
  child.on("error", (error) => {
    spawnError = error
    closed = true
    failAll(`spawn failed: ${error.message}`)
  })
  child.on("close", () => {
    const wasClosed = closed
    closed = true
    const lastLine = stderrTail.trim().split("\n").pop()
    failAll(`Connection closed${lastLine ? ` | stderr: ${lastLine}` : ""}`)
    if (!wasClosed) fireDead(`MCP server process exited${lastLine ? ` | stderr: ${lastLine}` : ""}`)
  })

  const send = (method, params, signal) => {
    if (spawnError) return Promise.resolve({ id: null, error: { code: -32000, message: `spawn failed: ${spawnError.message}` } })
    if (closed) return Promise.reject(new Error("MCP connection closed"))
    const id = rpcId()
    let resolveFn
    const promise = new Promise((resolve) => { resolveFn = resolve; pending.set(id, resolve) })
    // 2026-08-31 MCP 会诊 P7：abort 即刻作废 pending + 发 cancelled（原等满 120s）
    if (signal) {
      if (signal.aborted) return Promise.reject(new DOMException("Aborted", "AbortError"))
      const onAbort = () => {
        pending.delete(id)
        try { notify("notifications/cancelled", { requestId: id }) } catch { /* ignore */ }
        resolveFn({ id, error: { code: -32000, message: "Request cancelled by user" } })
      }
      signal.addEventListener("abort", onAbort, { once: true })
      promise.finally(() => signal.removeEventListener("abort", onAbort)).catch?.(() => {})
    }
    try {
      child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n")
    } catch (error) {
      pending.delete(id)
      return Promise.resolve({ id: null, error: { code: -32000, message: `stdin write failed: ${error.message}` } })
    }
    return withTimeout(promise, CALL_TIMEOUT_MS).finally(() => pending.delete(id))
  }

  const notify = (method, params) => {
    if (closed) return
    try {
      child.stdin.write(JSON.stringify({ jsonrpc: "2.0", method, params }) + "\n")
    } catch { /* ignore */ }
  }

  return {
    send, notify,
    close: () => {
      closed = true
      failAll("Connection closed")
      if (child.exitCode === null) killTree(child)
    },
    isAlive: () => !closed && !spawnError && child.exitCode === null,
    onDead,
  }
}
