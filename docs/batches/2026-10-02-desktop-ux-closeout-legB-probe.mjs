/**
 * legb-real-storm.probe.mjs — #801 腿 B 探针（临时 · 用后即删）：「真机活跃风暴（≥6 并发子代理在飞）真滚轮
 * 上滚 ×3 拍」。
 * 装置：真 Electron 桌面实例（隔离 home ∥ 零真数据）+ 本地 127.0.0.1 mock provider（OpenAI 兼容 JSON 单块
 * 响应——核客户端支持的降级形）——真 `runAgent` 回路 ∥ 真 `subagent` 工具派发 ∥ 6 个 coder 子代理真在飞
 * （各自 bash 长睡 60s 占位）；零外网 ∥ 零真 key ∥ 零真会话。
 * 判据（设计 = ACTIVITY.md §2 本批注）：风暴期真滚轮上滚 ×3 ⇒ `scrollTop` 减 ∧ `_poolPin=false`。
 * 跑法：`node .thincoder/tmp/legb-real-storm.probe.mjs`
 */
import { createRequire } from "node:module"
import { createServer } from "node:http"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const ROOT = "D:/teamcode/thincoder/"
const deskReq = createRequire(ROOT + "thincoder-desktop/package.json")
const { _electron } = deskReq("playwright-core")
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const out = { checks: {} }
const ok = (name, cond, detail) => { out.checks[name] = { ok: cond === true, ...(detail === undefined ? {} : { detail }) } }

// ── 本地 mock provider（非 SSE JSON 单块 —— 核客户端 readSSE 降级支持面）──────────────
const seen = []
const server = createServer((req, res) => {
  let body = ""
  req.on("data", (c) => { body += c })
  req.on("end", () => {
    const send = (obj) => { res.writeHead(200, { "content-type": "application/json" }); res.end(JSON.stringify(obj)) }
    let parsed = null
    try { parsed = JSON.parse(body) } catch { /* 非 JSON（如 /v1/models 列表请求） */ }
    if (!parsed || !Array.isArray(parsed.messages)) return send({ object: "list", data: [{ id: "legb-model" }] })
    const tools = (parsed.tools ?? []).map((t) => t?.function?.name ?? t?.name).filter(Boolean)
    const msgs = parsed.messages
    const last = msgs[msgs.length - 1]
    const completion = (message, finish = "stop") => send({ id: `c${seen.length}`, object: "chat.completion", choices: [{ index: 0, message, finish_reason: finish }], usage: { prompt_tokens: 10, completion_tokens: 5 } })
    seen.push({ tools: tools.slice(0, 4), last: String(last?.role ?? ""), text: String(last?.content ?? "").slice(0, 80) })
    const isChild = !tools.includes("subagent")
    if (isChild) {
      if (last?.role === "tool") return completion({ role: "assistant", content: "child done" })
      return completion({
        role: "assistant",
        tool_calls: [{ id: `call_sleep_${seen.length}`, type: "function", function: { name: "bash", arguments: JSON.stringify({ command: "node -e \"setTimeout(()=>{},60000)\"", description: "legB storm hold 60s" }) } }],
      }, "tool_calls")
    }
    if (msgs.some((m) => m.role === "tool")) return completion({ role: "assistant", content: "storm up" })
    const calls = Array.from({ length: 24 }, (_, i) => ({
      id: `call_spawn_${i + 1}`,
      type: "function",
      function: { name: "subagent", arguments: JSON.stringify({ action: "spawn", role: "coder", async: true, task: `STORMCHILD #${i + 1}: hold 60s with a bash sleep` }) },
    }))
    return completion({ role: "assistant", tool_calls: calls }, "tool_calls")
  })
})
await new Promise((r) => server.listen(0, "127.0.0.1", r))
const PORT = server.address().port

// ── 隔离装置 + 启动 ─────────────────────────────────────────────────────────────
const base = mkdtempSync(join(tmpdir(), "legb-storm-"))
const home = join(base, "home")
const proj = join(base, "proj")
mkdirSync(join(home, ".thincoder"), { recursive: true })
mkdirSync(proj, { recursive: true })
writeFileSync(join(home, ".thincoder", "config.json"), JSON.stringify({
  defaultModel: "legb:legb-model",
  locale: "en",
  providers: [{ name: "legb", baseURL: `http://127.0.0.1:${PORT}/v1`, model: "legb-model", apiKey: "legb-key", format: "openai" }],
  agent: { maxTurns: 10, subagentTurns: 5 },
}))
const env = { ...process.env, HOME: home, USERPROFILE: home, APPDATA: home, XDG_CONFIG_HOME: home }
delete env.ELECTRON_RUN_AS_NODE
let app = null
try {
  app = await _electron.launch({ args: [".", `--user-data-dir=${join(home, "ud")}`], cwd: ROOT + "thincoder-desktop", env, colorScheme: "light" })
  const page = await app.firstWindow()
  await page.waitForLoadState("domcontentloaded")
  await page.waitForFunction(() => ["ok", "error"].includes(document.documentElement.dataset.boot), undefined, { timeout: 30000 })
  await page.evaluate(async () => { const wait = (ms) => new Promise((r) => setTimeout(r, ms)); document.querySelector(".wizard-dismiss")?.click(); await wait(150) })
  const inv = (ch, payload) => page.evaluate(([c, p]) => window.thincoder.invoke(c, p), [ch, payload])

  out.open = await inv("project:open", { fsPath: proj })
  await page.evaluate(async () => {
    const mod = await import(new URL("./mount-sessions.mjs", document.baseURI).href)
    await mod.createSession?.()
  })
  await sleep(400)
  const key = await page.evaluate(async () => { const { store } = await import("./store.mjs"); return store.get().activeSession ?? null })
  out.key = key
  ok("会话键在场", typeof key === "string" && key !== "")
  out.flags = await inv("session:flags", { key, patch: { autoApprove: true } })
  ok("autoApprove 置位", out.flags?.ok === true, out.flags)

  // 发风暴指令（真 msg:send ⇒ 真 runAgent 回合）
  out.send = await inv("msg:send", { key, text: "STORM: spawn six background subagents" })
  ok("msg:send 受理", out.send?.ok === true, out.send)

  // 等风暴：≥6 池块在场 ∧ running ≥ 6
  await page.waitForFunction(() => document.querySelectorAll('[data-slot="pool"] .sub-block').length >= 24, undefined, { timeout: 120000 })
  const storm = await page.evaluate(async () => {
    const { store } = await import("./store.mjs")
    const r = document.querySelector('[data-slot="pool"]')
    const blocks = r.querySelectorAll(".sub-block").length
    return { blocks, running: store.get().pool?.running ?? null, approvals: store.get().pool?.approval ?? null, sh: r.scrollHeight, ch: r.clientHeight, st: Math.round(r.scrollTop), pin: r._poolPin }
  })
  out.storm = storm
  ok("≥6 并发子代理在飞 ∥ 溢出成立", storm.blocks >= 24 && (storm.running ?? 0) >= 6 && storm.sh > storm.ch, storm)

  // 真滚轮上滚 ×3（同探针法）——先钉底
  const read = () => page.evaluate(() => { const r = document.querySelector('[data-slot="pool"]'); return { st: Math.round(r.scrollTop), pin: r._poolPin, max: r.scrollHeight - r.clientHeight, blocks: r.querySelectorAll(".sub-block").length, running: document.querySelector('[data-read="running"]')?.textContent ?? null } })
  const hold = (ms) => page.evaluate((t) => new Promise((r) => setTimeout(r, t)), ms).then(read)
  await page.evaluate(() => { document.querySelector('[data-slot="pool"]').scrollTop = 1e9 })
  const bottom = await hold(250)
  const rc = await page.evaluate(() => { const r = document.querySelector('[data-slot="pool"]').getBoundingClientRect(); return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) } })
  await page.mouse.move(rc.x, rc.y)
  const ticks = []
  for (let i = 0; i < 3; i += 1) { await page.mouse.wheel(0, -600); ticks.push(await hold(250)) }
  out.scroll = { bottom, ticks }
  const last = ticks[ticks.length - 1]
  ok("腿 B：上滚 ×3 三拍内必动（scrollTop 减）", last.st < bottom.st, { bottom: bottom.st, ticks: ticks.map((t) => t.st) })
  ok("腿 B：`_poolPin` 翻假", last.pin === false, { pin: last.pin })
  ok("风暴持续（读数时 ≥6 在飞）", (last.blocks ?? 0) >= 24 && Number(last.running ?? 0) >= 6, { blocks: last.blocks, running: last.running })
} catch (error) {
  out.error = String(error?.stack ?? error)
} finally {
  try { await app?.close() } catch { /* 已退出 */ }
  server.close()
  try { rmSync(base, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }) } catch { /* 尽力而为 */ }
}
out.mockSeen = seen.slice(0, 12)
out.verdict = Object.values(out.checks).every((c) => c.ok === true) && out.error === undefined
try { writeFileSync(ROOT + ".thincoder/tmp/2026-10-02-desktop-ux-closeout-legB-readings.json", JSON.stringify(out, null, 2)) } catch { /* 尽力而为 */ }
console.log(JSON.stringify(out, null, 2))
process.exit(out.verdict ? 0 : 1)
