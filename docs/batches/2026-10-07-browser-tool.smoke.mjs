/**
 * 2026-10-07-browser-tool.smoke.mjs — 批内件冒烟（S1–S7 · 真 Edge/Chrome + 进程内 fixture 服务）。
 * 判据表 = 批档 `docs/batches/2026-10-07-browser-tool.md` §2 ∥ 设计档 `docs/core/design/BROWSER-TOOL.md`
 * §7（S1–S7）∥ §8（U1–U23）。缝纪律：**零 `_deps` 替身**（走真发现 ∥ 真 spawn ∥ 真 profile ∥ 真落盘）。
 *
 * S1 自启 + navigate 内联新页清单（无头）  S2 snapshot→type→click 按 ref 走通 + [navigated]
 * S3 wait selector 命中                  S4 wait 超时回执（页摘 + 清单）
 * S5 同 profile 两会话免登（Server 侧见 Cookie）S6 screenshot 真落盘（PNG 头 · >0 字节）
 * S7 有头（`--headed` ∥ `BROWSER_SMOKE_HEADED=1` —— 需显示环境，默认跳过）
 *
 * 跑法（仓根 `thincoder/`）：node docs/batches/2026-10-07-browser-tool.smoke.mjs [--headed]
 * 副作用（真实用例面，如实登记）：真实浏览器进程 + `~/.thincoder/browser/`（profile ∥ shots ∥ 锁）。
 */
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { existsSync, readFileSync, statSync } from "node:fs"
import { createServer } from "node:http"
import { join } from "node:path"
import { browserTool } from "../../thincoder-core/tools/browser.mjs"
import { browserPaths } from "../../thincoder-core/browser/launch.mjs"

const HEADED = process.argv.includes("--headed") || process.env.BROWSER_SMOKE_HEADED === "1"
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const results = []
let server = null

// ── fixture 服务（进程内 · 随机口）──────────────────────────────────────────
const PAGE = (title, body, script = "") => `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title></head>
<body><h1>${title}</h1>${body}${script ? `<script>${script}</script>` : ""}</body></html>`
const cookieSeen = []
async function startFixture() {
  server = createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://127.0.0.1")
    cookieSeen.push({ path: url.pathname, cookie: req.headers.cookie ?? "" })
    const headers = { "content-type": "text/html; charset=utf-8" }
    if (url.pathname === "/") headers["set-cookie"] = "bt=1; Path=/; Max-Age=86400"
    if (url.pathname === "/slow") {
      res.writeHead(200, headers)
      res.end(PAGE("BT Slow", '<a id="back" href="/">Back</a>',
        'setTimeout(() => { const d = document.createElement("div"); d.id = "late"; d.textContent = "late arrived"; document.body.appendChild(d) }, 500)'))
      return
    }
    if (url.pathname === "/two") {
      res.writeHead(200, headers)
      res.end(PAGE("BT Two", `<p id="landed">landed q=${url.searchParams.get("q") ?? ""}</p><a id="back" href="/">Back</a>`))
      return
    }
    res.writeHead(200, headers)
    res.end(PAGE("BT One", `<form action="/two" method="get"><input id="name" name="q" placeholder="Name"><button id="go" type="submit">Go</button></form><a id="next" href="/two">Next</a>`))
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  return `http://127.0.0.1:${server.address().port}`
}

// ── 面 ──────────────────────────────────────────────────────────────────────
const ctx = { agent: { config: { browser: { allowDomains: ["127.0.0.1"] } } } }
const run = (args) => browserTool.execute(args, ctx)

/** S1 进程参数断言面：真跑浏览器的命令行（按 profile 定位——非替身 ∥ 非自录值）。 */
function liveBrowserCommandLine(profile) {
  if (process.platform === "win32") {
    const out = execFileSync("powershell", ["-NoProfile", "-Command",
      "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*--user-data-dir*' } | ForEach-Object { $_.CommandLine }",
    ], { encoding: "utf8", timeout: 60_000 })
    return out.split("\n").map((l) => l.trim()).filter((l) => l.includes(profile)).join("\n")
  }
  const out = execFileSync("ps", ["-ax", "-o", "args="], { encoding: "utf8", timeout: 60_000 })
  return out.split("\n").filter((l) => l.includes(`--user-data-dir=${profile}`)).join("\n")
}
const refOf = (receipt, role, nameRe) => {
  const line = receipt.split("\n").find((l) => /^e\d+ /.test(l) && l.includes(` ${role} `) && nameRe.test(l))
  assert.ok(line, `清单内未找到 ${role} ${nameRe}：\n${receipt}`)
  return line.match(/^e\d+/)[0]
}
async function step(id, title, fn) {
  try { const note = await fn(); results.push([id, true, note]); console.log(`[ok]   ${id} ${title} — ${note}`) }
  catch (e) { results.push([id, false, e.message]); console.log(`[FAIL] ${id} ${title} — ${e.message}`) }
}

let BASE = ""
try {
  BASE = await startFixture()
  console.log(`[svc] fixture = ${BASE} · headed = ${HEADED}`)

  // S1 自启（无头）+ navigate 内联新页清单（U1）+ 进程参数断言（F-BT1 判据列）
  await step("S1", "自启 + navigate 内联新页清单 + 进程参数断言", async () => {
    const r = await run({ action: "navigate", url: `${BASE}/`, headless: true })
    assert.match(r, new RegExp(`^\\[navigate\\] ${BASE}/\\n`))
    assert.match(r, /\[page\] .*"BT One"/)
    assert.match(r, /^e\d+ link "Next" \[new\]$/m)
    assert.match(r, /^e\d+ textbox "Name" \[new\]$/m)
    const paths = browserPaths()
    const cmdline = liveBrowserCommandLine(paths.profile)
    assert.ok(cmdline, `未找到以 --user-data-dir 启动的浏览器进程（profile ${paths.profile}）`)
    assert.ok(cmdline.includes(`--user-data-dir=${paths.profile}`), `--user-data-dir 非默认：${cmdline.slice(0, 200)}`)
    assert.match(cmdline, /--headless=new/, "无头实参在进程命令行面")
    assert.match(cmdline, /--remote-debugging-port=0/, "端口实参 = 0（系统分配，非 9222 固定）")
    const port = Number(readFileSync(join(paths.profile, "DevToolsActivePort"), "utf8").split("\n")[0])
    assert.ok(Number.isInteger(port) && port > 0 && port !== 9222, `运行端口 = ${port}（非 9222 固定）`)
    return `清单 3 条 · 进程参数与运行端口 ${port} 已断言`
  })

  // S2 snapshot → type → click（ref 寻址）+ [navigated]（U2/U3）
  await step("S2", "snapshot→type→click 走通", async () => {
    const snap = await run({ action: "snapshot" })
    assert.match(snap, /^\[page\] .*"BT One"\n\[\d+ interactive elements \(0 new\)\]/)
    const input = refOf(snap, "textbox", /"Name"/)
    const button = refOf(snap, "button", /"Go"/)
    assert.equal(await run({ action: "type", ref: input, text: "hello" }), `[type] ${input} "Name" ← 5 chars`)
    const clicked = await run({ action: "click", ref: button })
    assert.match(clicked, new RegExp(`^\\[click\\] ${button} "Go"\\n\\[navigated\\] ${BASE}/two\\?q=hello\\n\\[page\\] `))
    return `type ${input} → click ${button} → /two?q=hello`
  })

  // S3 wait selector 命中（U5）
  await step("S3", "wait selector 命中", async () => {
    assert.match(await run({ action: "navigate", url: `${BASE}/slow` }), /"BT Slow"/)
    const r = await run({ action: "wait", selector: "#late", timeoutMs: 5000 })
    assert.match(r, /^\[wait\] selector "#late" — ok after \d+ms$/)
    return r
  })

  // S4 wait 超时回执（U18）
  await step("S4", "wait 超时回执带页摘 + 清单", async () => {
    const r = await run({ action: "wait", selector: "#never", timeoutMs: 600 })
    assert.match(r, /^Error: wait timed out after 600ms \(selector "#never"\)\n\[page\] /)
    assert.match(r, /^e\d+ link "Back"/m)
    return "超时回执形正确"
  })

  // S6 screenshot 真落盘（U6）
  await step("S6", "screenshot 真落盘（PNG 头）", async () => {
    const r = await run({ action: "screenshot", fullPage: true })
    const m = /^\[screenshot\] (.+) \((\d+) bytes\)$/.exec(r)
    assert.ok(m, `回执形：${r}`)
    assert.ok(existsSync(m[1]), `路径在盘：${m[1]}`)
    assert.ok(Number(m[2]) > 0 && statSync(m[1]).size === Number(m[2]))
    assert.deepEqual(readFileSync(m[1]).subarray(0, 8), PNG_MAGIC, "PNG 头")
    return `${m[1]} (${m[2]} bytes)`
  })

  // S5 同 profile 两会话免登（U 面 F-BT6）
  await step("S5", "同 profile 两会话免登（Cookie 持久）", async () => {
    assert.match(await run({ action: "navigate", url: `${BASE}/` }), /"BT One"/)
    assert.match(await run({ action: "evaluate", expression: "document.cookie" }), /bt=1/, "一段会话拿到 cookie")
    assert.equal(await run({ action: "close" }), "[close] browser session closed")
    const before = cookieSeen.length
    assert.match(await run({ action: "navigate", url: `${BASE}/` }), /"BT One"/)
    assert.match(await run({ action: "evaluate", expression: "document.cookie" }), /bt=1/, "二段会话仍带 cookie")
    const seen = cookieSeen.slice(before).some((e) => e.path === "/" && e.cookie.includes("bt=1"))
    assert.ok(seen, "Server 侧见到二段会话请求携 Cookie")
    return "二段会话免登（Server 见 Cookie）"
  })

  // S7 有头（需显示环境——默认跳过）
  await step("S7", HEADED ? "有头模式会话" : "有头模式会话（跳过——需 --headed）", async () => {
    if (!HEADED) return "skipped"
    await run({ action: "close" }) // U23：close ⇒ 以另一 headless 值重开
    assert.match(await run({ action: "navigate", url: `${BASE}/`, headless: false }), /"BT One"/)
    assert.equal(await run({ action: "close" }), "[close] browser session closed")
    return "有头 navigate → close 达成（close→异值重开正例）"
  })
} finally {
  await run({ action: "close" })
  server?.closeAllConnections?.()
  server?.close()
  const failed = results.filter(([, ok]) => !ok)
  console.log(`\n[smoke] ${results.filter(([id]) => id !== "S7").length - failed.length}/6 + S7(${HEADED ? "ran" : "skipped"}) — failed=${failed.length}`)
  for (const [id, , note] of failed) console.log(`  ${id}: ${note}`)
  process.exitCode = failed.length ? 1 : 0
}
