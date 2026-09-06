/**
 * consult-stop.test.mjs — Stop must abort running consultations (2026-08-16 user
 * report: "会诊执行中 stop 停不下来"; R17 2026-09-06: consult_check 退役——本文件覆盖
 * R17 停止语义). Two contracts:
 *  1. unit: cleanupConsultSessions aborts parked children (ctrl propagation works)
 *  2. integration: the real agent loop exits on Stop while consultants run in the
 *     background (nothing parks after an abort — abort = discard)
 */
import { describe, it } from "node:test"
import { slow } from "./slow.mjs"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createServer } from "node:http"
import { consultStartTool, cleanupConsultSessions } from "../src/agent-tools/consult.mjs"
import { runAgent } from "../src/agent.mjs"

const makeAgent = (consultModels) => ({
  history: [],
  _touchedFiles: [],
  _pendingReminders: [],
  config: { agent: { consultModels } },
})

const hangRunner = (p, c, t, cb, signal) => new Promise((_, reject) => {
  signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true })
})

describe("Stop during a consult", () => {
  it("unit: cleanupConsultSessions aborts a parked child (stop semantics)", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "csu-"))
    try {
      const agent = makeAgent([{ provider: "t", model: "m1" }])
      const ctx = {
        agent, cwd, callbacks: {}, signal: new AbortController().signal,
        runAgent: hangRunner,
        buildProvider: async () => ({ baseURL: "http://127.0.0.1:1", apiKey: "x", model: "m1", name: "t" }),
      }
      await consultStartTool.execute({ problem: "stuck" }, ctx)
      await new Promise((r) => setTimeout(r, 50)) // child enters the parked state
      const sess = agent.history._consultSessions.get("1")
      assert.equal(sess.pending, 1, "child is running/parked")
      cleanupConsultSessions(agent) // runAgent's finally does this on plain abort
      await new Promise((r) => setTimeout(r, 50)) // settle propagates
      assert.equal(sess.pending, 0, "child settled after the cleanup abort — card must not spin forever")
      assert.equal(sess.stopped, true, "cleanup marks stopped so the child settles as TERMINATED (grey), not FAILED (red)")
      assert.equal(agent.history._pendingConsultResults?.length ?? 0, 0, "aborted session parks nothing (abort = discard — T-R17c)")
    } finally {
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  slow("integration: the real agent loop exits on Stop while consultants run in the background", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "csi-"))
    const cfgDir = mkdtempSync(join(tmpdir(), "csi-cfg-"))
    const cfgPath = join(cfgDir, "config.json")
    const { _setConfigPathForTest } = await import("../src/config-io.mjs")
    _setConfigPathForTest(cfgPath)
    const { writeFileSync } = await import("node:fs")
    writeFileSync(cfgPath, JSON.stringify({
      providers: [{ name: "t", baseURL: "http://127.0.0.1:1", apiKey: "x", model: "m" }],
      activeProvider: "t",
      agent: { consultModels: [{ provider: "t", model: "m" }] },
    }))
    let n = 0
    const server = createServer((req, res) => {
      let _body = ""
      req.on("data", (c) => { _body += c })
      req.on("end", () => {
        n++
        const frame = n === 1
          ? { choices: [{ index: 0, finish_reason: "tool_calls", delta: { content: "", tool_calls: [{ id: "s1", type: "function", function: { name: "consult_start", arguments: JSON.stringify({ problem: "stuck" }) } }] } }] }
          : { choices: [{ index: 0, finish_reason: "stop", delta: { content: "final" } }] }
        res.end(`data: ${JSON.stringify(frame)}\n\ndata: [DONE]\n\n`)
      })
    })
    await new Promise((r) => server.listen(0, "127.0.0.1", r))
    const port = server.address().port
    try {
      const ctrl = new AbortController()
      const provider = { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }
      const t0 = Date.now()
      // 会诊子代理挂后台（hangRunner 语义——不可达 provider 或挂起均可）——loop 必须
      // 在 Stop 时快速退出（不再有 consult_check 驻留轮询——结果只经自动 digest 通道）。
      const runP = runAgent(provider, cwd, "test", { onToken: () => {} }, ctrl.signal, true, {})
        .then(() => "completed").catch((e) => `threw:${e?.name}`)
      setTimeout(() => ctrl.abort(), 1200)
      const result = await Promise.race([
        runP,
        new Promise((r) => setTimeout(() => r("HANG"), 6000)),
      ])
      assert.notEqual(result, "HANG", `loop must exit on Stop, got ${result}`)
      assert.ok((Date.now() - t0) < 5000, "exit was prompt")
    } finally {
      server.close()
      rmSync(cwd, { recursive: true, force: true })
      rmSync(cfgDir, { recursive: true, force: true })
    }
  })
})
