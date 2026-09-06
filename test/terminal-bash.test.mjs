/**
 * terminal-bash.test.mjs — bash tool terminal modes (A: visible / B: inject).
 * Uses the vscode mock: tests stub window.activeTerminal / createTerminal.
 */
import { describe, it, beforeEach } from "node:test"
import { slow } from "./slow.mjs"
import assert from "node:assert/strict"
import * as vscode from "vscode"
import { bashTool } from "../src/tools/shell.mjs"

function fakeTerminal({ chunks = [], withSI = true } = {}) {
  const sent = []
  const term = {
    name: "ThinCoder",
    sent,
    shown: 0,
    show() { term.shown++ },
    sendText: (text, execute) => sent.push([text, execute]),
    shellIntegration: withSI
      ? { executeCommand: (_cmd) => ({ read: async function* () { for (const c of chunks) yield c } }) }
      : undefined,
  }
  return term
}

beforeEach(() => {
  vscode.window.terminals.length = 0
  vscode.window.activeTerminal = undefined
})

describe("bash child-process incremental capture", () => {
  slow("Stop mid-run returns the partial output already collected (not a bare '(stopped)')", async () => {
    const ctrl = new AbortController()
    // abort 阈值 3500ms——实证（2026-09-05）：测试进程内 chcp+cmd+node spawn 冷启动
    // 输出到达 ~2.7s（热 shell 126ms——spawn 环境差异 20×）——200ms 曾使本测试在
    // 单跑/全量下稳定挂（abort 时输出未达——实现正确报 (stopped)——测试阈值脱离机器
    // 现实——放大后：输出先到、abort 验证 partial 保留
    setTimeout(() => ctrl.abort(), 3500)
    const r = await bashTool.execute(
      { command: "node -e \"console.log('partial-out'); setTimeout(()=>{},60000)\"", timeout: 90000 },
      { cwd: process.cwd(), signal: ctrl.signal },
    )
    assert.match(r, /\(stopped\)/)
    assert.match(r, /partial-out/, "partial stdout survives the abort")
  })

  it("streams output live via ctx.onOutput", async () => {
    const chunks = []
    await bashTool.execute(
      { command: "node -e \"console.log('chunk-a'); console.log('chunk-b')\"" },
      { cwd: process.cwd(), onOutput: (c) => chunks.push(c) },
    )
    assert.ok(chunks.length > 0, "onOutput fired during the run")
    assert.match(chunks.join(""), /chunk-a/)
    assert.match(chunks.join(""), /chunk-b/)
  })

  it("multi-byte UTF-8 split across chunks does not mojibake (decoder, not per-chunk toString)", async () => {
    const { makeDecoder } = await import("../src/tools/shared.mjs")
    const dec = makeDecoder()
    const bytes = Buffer.from("中文测试", "utf8")
    // Split in the MIDDLE of a multi-byte character
    const mid = 4 // '中' is bytes 0-2, '文' starts at 3 — byte 4 is mid-文
    const a = dec(bytes.subarray(0, mid))
    const b = dec(bytes.subarray(mid), true)
    assert.equal(a + b, "中文测试")
  })

  it("sanitizeOutput strips ANSI colors and normalizes CRLF", async () => {
    const { sanitizeOutput } = await import("../src/tools/shared.mjs")
    assert.equal(sanitizeOutput("\x1b[32mok\x1b[0m\r\nnext\rline"), "ok\nnext\nline")
  })
})

describe("bash terminal modes", () => {
  it("inject: fills the command into the terminal WITHOUT executing", async () => {
    const term = fakeTerminal()
    vscode.window.activeTerminal = term
    const r = await bashTool.execute({ command: "npm test", terminal: "inject" }, { cwd: process.cwd() })
    assert.deepEqual(term.sent, [["npm test", false]], "sendText(cmd, false) — filled, not run")
    assert.ok(term.shown > 0, "terminal revealed")
    assert.match(r, /NOT executed/)
    assert.match(r, /do NOT report a result/)
  })

  it("visible: runs via shell integration and returns stripped output", async () => {
    const term = fakeTerminal({ chunks: ["[32mWrote 1 file[0m\n", "done\n"] })
    vscode.window.activeTerminal = term
    const r = await bashTool.execute({ command: "echo hi", terminal: "visible" }, { cwd: process.cwd() })
    assert.match(r, /Wrote 1 file/)
    assert.ok(!/\x1b\[/.test(r), "ANSI escape codes stripped")
    assert.match(r, /exit code unavailable in terminal mode/)
  })

  it("visible + Stop: sends Ctrl+C to the terminal and finishes (stopped)", async () => {
    // Stream that never ends on its own — only the abort resolves it.
    const term = {
      name: "ThinCoder",
      sent: [],
      show() {},
      sendText(t, e) { term.sent.push([t, e]) },
      shellIntegration: {
        executeCommand: () => ({ read: async function* () { yield "starting\n"; await new Promise(() => {}) } }),
      },
    }
    vscode.window.activeTerminal = term
    const ctrl = new AbortController()
    setTimeout(() => ctrl.abort(), 50)
    const r = await bashTool.execute({ command: "sleep 999", terminal: "visible" }, { cwd: process.cwd(), signal: ctrl.signal })
    assert.match(r, /\(stopped\)/)
    assert.deepEqual(term.sent, [["\x03", undefined]], "Ctrl+C sent to interrupt the foreground process")
  })

  slow("visible falls back to the child process when shell integration is unavailable", async () => {
    vscode.window.activeTerminal = undefined
    vscode.window.createTerminal = () => fakeTerminal({ withSI: false })
    const r = await bashTool.execute({ command: "node -e \"console.log('fallback-ok')\"", terminal: "visible" }, { cwd: process.cwd() })
    assert.match(r, /fallback-ok/, "child-process fallback ran the command")
    assert.match(r, /exit code 0/)
  })
})
