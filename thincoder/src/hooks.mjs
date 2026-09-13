/**
 * hooks.mjs — Lifecycle hook engine
 *
 * Hooks are user-defined shell commands executed at key agent lifecycle points.
 * Configured in ~/.thincoder/config.json under "hooks".
 *
 * Event types:
 *   PreToolUse          — before each tool call (can block execution)
 *   PostToolUse         — after successful tool execution
 *   PostToolUseFailure  — after failed tool execution
 *   Stop                — main-session run end (no tool name; block is meaningless)
 *
 * Each hook: { matcher?, command, args?, timeout?, action? }
 *   matcher: regex against tool name (default: match all)
 *   command: executable path/name
 *   args: optional CLI args; without args, stdin receives JSON payload
 *   timeout: ms (default 10000)
 *   action: "allow" | "block" | "notify" (default "notify")
 *
 * "block" hooks: exit code 0 = allow, non-zero = block.
 * "allow"/"notify": exit code ignored.
 */

import { spawn } from "node:child_process"

/** @param {string} event @param {object} ctx @returns {Promise<boolean>} false if blocked */
export async function runHooks(event, ctx) {
  const hooks = ctx.agent?.config?.hooks?.[event]
  if (!hooks?.length) return true

  for (const hook of hooks) {
    // Matcher = tool-name regex: tool events always carry a toolName; no-tool-name
    // events (Stop) ignore it — a configured matcher must not silently never fire.
    if (hook.matcher && ctx.toolName != null) {
      try {
        if (!new RegExp(hook.matcher).test(ctx.toolName)) continue
      } catch { /* invalid regex → skip */ }
    }

    const allowed = await runOneHook(event, hook, ctx)
    if (hook.action === "block" && !allowed) return false
  }
  return true
}

async function runOneHook(event, hook, ctx) {
  const payload = JSON.stringify({
    event,
    toolName: ctx.toolName ?? null,
    toolArgs: ctx.toolArgs ?? null,
    result: ctx.result ?? null,
    error: ctx.error?.message ?? null,
    // Event-specific fields (Stop: turn / reason) — existing callers pass no extra ⇒ payload unchanged.
    ...(ctx.extra ?? {}),
    timestamp: new Date().toISOString(),
  })

  return new Promise((resolve) => {
    const timeout = hook.timeout ?? 10_000
    let settled = false
    const done = (code) => {
      if (settled) return
      settled = true
      resolve(code === 0)
    }

    let proc
    try {
      if (hook.args?.length) {
        proc = spawn(hook.command, hook.args, {
          stdio: ["pipe", "ignore", "ignore"],
          timeout,
          windowsHide: true,
        })
      } else {
        proc = spawn(hook.command, [], {
          stdio: ["pipe", "ignore", "ignore"],
          timeout,
          windowsHide: true,
        })
      }
    } catch {
      // command not found or spawn failure — don't block, don't crash
      return resolve(true)
    }

    proc.on("error", () => done(0))     // spawn failure → allow
    proc.on("close", (code) => done(code ?? 0))
    proc.on("exit", (code) => done(code ?? 0))

    // Send payload via stdin
    try { proc.stdin?.end(payload) } catch { /* */ }

    // Timeout guard
    setTimeout(() => done(0), timeout + 1000)
  })
}
