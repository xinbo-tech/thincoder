/**
 * 2026-10-07-browser-input.smoke.mjs — 批内件冒烟（S8–S18 · 真 Edge/Chrome + 进程内 fixture 服务）。
 * 判据表 = 批档 `docs/batches/2026-10-07-browser-input.md` §2 ∥ 设计档 `docs/core/design/BROWSER-TOOL.md`
 * §7（S8–S18）∥ §8（U24–U51）。缝纪律：**零 `_deps` 替身**（走真发现 ∥ 真 spawn ∥ 真 profile ∥ 真落盘）。
 *
 * S8 press 真按键驱表单（isTrusted 读回）  S9 hover 驱出菜单        S10 wheel 卷动 + window 读数
 * S11 mouse 坐标点击 / 双击（真指针）      S12 drag 目标态变化          S12b drag html5 拦截链
 * S13 touch tap / doubleTap（真 click / dblclick）∥ S13b pinch ∥ S13c swipe
 * S14 insert 长文本 + emoji + IME 组合     S15a 无头页↔页保真往返
 * S15 / S16 clipboard ↔ 系统剪贴板（**有头真跑**——PowerShell 对照；实测无头 = 会话内剪贴板面）
 * S17 屏外 ref（[outside]）自动滚动后驱动成立               S18 有头抽样复跑（press + clipboard）
 *
 * 跑法（仓根 `thincoder/`）：node docs/batches/2026-10-07-browser-input.smoke.mjs [--headed]
 * 副作用（真实用例面，如实登记）：真实浏览器进程 + `~/.thincoder/browser/`（profile ∥ shots ∥ 锁）+
 * **系统剪贴板被覆写**（S15/S16/S18——如实登记，测试后不回填原值）。
 */
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { createServer } from "node:http"
import { browserTool } from "../../thincoder-core/tools/browser.mjs"

const HEADED = process.argv.includes("--headed") || process.env.BROWSER_SMOKE_HEADED === "1"
/** 系统剪贴板对照面（S15/S16/S18）= win32 + PowerShell；非 win32 面跳过（无对照工具——如实登记）。 */
const SYSTEM_CLIPBOARD = process.platform === "win32"
const results = []
let server = null

// ── fixture 服务（进程内 · 随机口）──────────────────────────────────────────
const MAIN_PAGE = `<!doctype html><html><head><meta charset="utf-8"><title>BT Input</title>
<style>
  body { margin: 0; font-family: sans-serif; }
  .tall { height: 2600px; }
  #menu { width: 200px; padding: 8px; background: #eee; }
  #card { width: 120px; height: 60px; background: #9cf; }
  #slot { width: 260px; height: 120px; background: #cfc; margin: 20px 0; }
  #src, #dst, #hit, #far, #tap, #sel, #ins { display: inline-block; margin: 8px 0; min-width: 60px; }
</style></head>
<body>
<h1>BT Input</h1>
<form id="f" action="/two" method="get"><input id="name" name="q" placeholder="Name"><button id="go" type="submit">Go</button></form>
<div id="menu" role="button" tabindex="0">Menu</div>
<div id="sub" style="min-height:24px"></div>
<div id="card" tabindex="0">Card</div>
<div id="slot" tabindex="0">Slot</div>
<div id="src" tabindex="0" draggable="true" style="background:#fca">Drag me</div>
<div id="dst" tabindex="0" style="background:#ccf">Drop here</div>
<button id="hit">Hit</button>
<input id="sel" value="COPY ME">
<input id="ins" placeholder="insert target">
<button id="tap">Tap Me</button>
<div class="tall"></div>
<button id="far">Far</button>
<script>
  window.__keys = []; window.__hits = []; window.__taps = []; window.__comp = [];
  document.addEventListener('keydown', function (e) { window.__keys.push({ key: e.key, trusted: e.isTrusted }) });
  document.addEventListener('touchstart', function () { window.__touchStarts = (window.__touchStarts || 0) + 1 }, { passive: true });
  document.getElementById('menu').addEventListener('mouseover', function () {
    if (document.getElementById('sub-btn')) return
    var b = document.createElement('button'); b.id = 'sub-btn'; b.textContent = 'Sub'
    document.getElementById('sub').appendChild(b)
  });
  document.getElementById('hit').addEventListener('click', function (e) { window.__hits.push({ trusted: e.isTrusted, x: Math.round(e.clientX), y: Math.round(e.clientY) }) });
  document.getElementById('hit').addEventListener('dblclick', function (e) { window.__dbl = { trusted: e.isTrusted } });
  document.getElementById('tap').addEventListener('click', function (e) { window.__taps.push({ trusted: e.isTrusted }) });
  document.getElementById('tap').addEventListener('dblclick', function (e) { window.__dblTaps = { trusted: e.isTrusted, detail: e.detail } });
  document.getElementById('far').addEventListener('click', function () { window.__farClick = true });
  (function () {
    var card = document.getElementById('card'), slot = document.getElementById('slot'), dragging = false
    card.addEventListener('mousedown', function () { dragging = true })
    document.addEventListener('mousemove', function (e) {
      if (!dragging) return
      window.__dragMoves = (window.__dragMoves || 0) + 1; window.__dragLast = { x: e.clientX, y: e.clientY }
    })
    document.addEventListener('mouseup', function (e) {
      if (!dragging) return
      dragging = false
      var el = document.elementFromPoint(e.clientX, e.clientY)
      if (el && (el.id === 'slot' || slot.contains(el))) { slot.appendChild(card); window.__dropped = true }
    })
  })();
  (function () {
    var src = document.getElementById('src'), dst = document.getElementById('dst')
    src.addEventListener('dragstart', function (e) { e.dataTransfer.setData('text/plain', 'payload'); window.__dndStart = true })
    dst.addEventListener('dragover', function (e) { e.preventDefault() })
    dst.addEventListener('drop', function (e) { e.preventDefault(); window.__dnd = { data: e.dataTransfer.getData('text/plain') } })
  })();
  (function () {
    var ins = document.getElementById('ins')
    ;['compositionstart', 'compositionupdate', 'compositionend'].forEach(function (t) {
      ins.addEventListener(t, function (e) { window.__comp.push({ type: t, data: e.data, value: ins.value }) })
    })
  })();
</script></body></html>`

async function startFixture() {
  server = createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://127.0.0.1")
    const headers = { "content-type": "text/html; charset=utf-8" }
    res.writeHead(200, headers)
    if (url.pathname === "/two") {
      res.end(`<!doctype html><html><head><meta charset="utf-8"><title>BT Two</title></head><body><p id="landed">landed q=${url.searchParams.get("q") ?? ""}</p></body></html>`)
      return
    }
    res.end(MAIN_PAGE)
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  return `http://127.0.0.1:${server.address().port}`
}

// ── 面 ──────────────────────────────────────────────────────────────────────
const ctx = { agent: { config: { browser: { allowDomains: ["127.0.0.1"] } } } }
const run = (args) => browserTool.execute(args, ctx)

/** 系统剪贴板对照（Windows——PowerShell 5.1 `Get-Clipboard -Raw` ∥ `Set-Clipboard`）。 */
function psGetClipboard() {
  const out = execFileSync("powershell", ["-NoProfile", "-Command", "Get-Clipboard -Raw"], { encoding: "utf8", timeout: 30_000 })
  return out.replace(/\r?\n$/, "")
}
function psSetClipboard(text) {
  execFileSync("powershell", ["-NoProfile", "-Command", "Set-Clipboard -Value ([Console]::In.ReadToEnd())"], { input: text, encoding: "utf8", timeout: 30_000 })
}
/** 有界等待：剪贴板面异步落位（浏览器写 ∥ 系统写谁先到不定）——回读命中即返，超时返末值。 */
async function waitForValue(read, match, timeoutMs = 4000) {
  const t0 = Date.now()
  let last
  for (;;) {
    last = await read()
    if (match(last) || Date.now() - t0 >= timeoutMs) return last
  }
}

const refOf = (receipt, role, nameRe) => {
  const line = receipt.split("\n").find((l) => /^e\d+ /.test(l) && l.includes(` ${role} `) && nameRe.test(l))
  assert.ok(line, `清单内未找到 ${role} ${nameRe}：\n${receipt}`)
  return line.match(/^e\d+/)[0]
}
const refLine = (receipt, nameRe) => {
  const line = receipt.split("\n").find((l) => /^e\d+ /.test(l) && nameRe.test(l))
  assert.ok(line, `清单内未找到 ${nameRe}：\n${receipt}`)
  return line
}
/** `[evaluate @ url] <json>` ⇒ 值（页面侧 JSON 读回）。 */
async function evaluate(expression) {
  const r = await run({ action: "evaluate", expression })
  assert.match(r, /^\[evaluate @ /, `evaluate 回执：${r}`)
  return JSON.parse(r.slice(r.indexOf("] ") + 2))
}
async function step(id, title, fn) {
  try { const note = await fn(); results.push([id, true, note]); console.log(`[ok]   ${id} ${title} — ${note}`) }
  catch (e) { results.push([id, false, e.message]); console.log(`[FAIL] ${id} ${title} — ${e.message}`) }
}

let BASE = ""
try {
  BASE = await startFixture()
  console.log(`[svc] fixture = ${BASE} · headed = ${HEADED}`)

  // S8 press：真按键（isTrusted 读回）+ Enter 真提交（F-BT9 / U24）
  await step("S8", "press 真按键驱表单（isTrusted 读回）", async () => {
    await run({ action: "navigate", url: `${BASE}/` })
    const snap = await run({ action: "snapshot" })
    const nameRef = refOf(snap, "textbox", /"Name"/)
    const goRef = refOf(snap, "button", /"Go"/)
    assert.equal(await run({ action: "press", key: "a", ref: nameRef }), `[press] a → ${nameRef} "Name"`)
    const keys = await evaluate("window.__keys")
    assert.deepEqual(keys, [{ key: "a", trusted: true }], "页面侧 isTrusted === true")
    assert.match(await run({ action: "press", key: "Enter", ref: goRef }), new RegExp(`^\\[press\\] Enter → ${goRef} "Go"$`))
    assert.match(await run({ action: "wait", selector: "#landed", timeoutMs: 5000 }), /^\[wait\] selector "#landed" — ok after \d+ms$/)
    assert.match(await run({ action: "snapshot" }), /q=a/, "表单真提交（landed q=a）")
    return "isTrusted 键事件 + Enter 提交（/two?q=a）"
  })

  // S9 hover 驱出菜单（F-BT10 / U29）
  await step("S9", "hover 驱出菜单（子菜单后现于 snapshot）", async () => {
    await run({ action: "navigate", url: `${BASE}/` })
    const before = await run({ action: "snapshot" })
    assert.ok(!before.includes('"Sub"'), "hover 前无子菜单")
    const menuRef = refOf(before, "button", /"Menu"/)
    assert.equal(await run({ action: "hover", ref: menuRef }), `[hover] ${menuRef} "Menu"`)
    const after = await run({ action: "snapshot" })
    assert.match(after, /^e\d+ button "Sub" \[new\]$/m, "hover 后子菜单现于清单")
    return "mouseover → 子菜单按钮出现"
  })

  // S10 wheel 卷动 + 读数（F-BT10 / U30）
  await step("S10", "wheel 卷动 + window 读数", async () => {
    await run({ action: "navigate", url: `${BASE}/` })
    const r = await run({ action: "wheel", deltaY: 600 })
    const m = /^\[wheel\] Δ\(0,600\) at \d+,\d+ — window \(0,(\d+)\)$/.exec(r)
    assert.ok(m, `wheel 回执形：${r}`)
    const y = Number(m[1])
    assert.ok(y > 200, `卷动后 window y = ${y}`)
    assert.equal(await evaluate("Math.round(window.scrollY)"), y, "回执读数 = 现场读数")
    return `Δ(0,600) → window (0,${y})`
  })

  // S11 mouse 坐标点击 / 双击（F-BT10 / U31 / U32）
  await step("S11", "mouse 坐标点击 ∥ 双击（真指针）", async () => {
    await run({ action: "navigate", url: `${BASE}/` })
    const pt = await evaluate("(function () { const r = document.getElementById('hit').getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) } })()")
    assert.equal(await run({ action: "mouse", x: pt.x, y: pt.y }), `[mouse] left click ${pt.x},${pt.y}`)
    const hits = await evaluate("window.__hits")
    assert.equal(hits.length, 1)
    assert.equal(hits[0].trusted, true, "真指针点击 isTrusted")
    assert.ok(Math.abs(hits[0].x - pt.x) <= 1 && Math.abs(hits[0].y - pt.y) <= 1, `命中坐标 ${hits[0].x},${hits[0].y} ≈ ${pt.x},${pt.y}`)
    assert.equal(await run({ action: "mouse", x: pt.x, y: pt.y, double: true }), `[mouse] left doubleClick ${pt.x},${pt.y}`)
    assert.equal((await evaluate("window.__dbl || null"))?.trusted, true, "页面收 dblclick")
    return `click + dblclick @ ${pt.x},${pt.y}（isTrusted）`
  })

  // S12 drag 鼠标序列（F-BT11 / U34）
  await step("S12", "drag 目标态变化（按下→移动×10→抬起）", async () => {
    await run({ action: "navigate", url: `${BASE}/` })
    const snap = await run({ action: "snapshot" })
    const card = refOf(snap, "other", /"Card"/)
    const slot = refOf(snap, "other", /"Slot"/)
    assert.equal(await run({ action: "drag", from: card, to: slot }), `[drag] ${card} "Card" → ${slot} "Slot"`)
    assert.equal(await evaluate("Boolean(window.__dropped)"), true, "抬起落于 slot ⇒ 投递")
    const moves = await evaluate("window.__dragMoves || 0")
    assert.ok(moves >= 10, `中间移动 ${moves} 次`)
    assert.equal(await evaluate("document.getElementById('slot').contains(document.getElementById('card'))"), true)
    return `Card → Slot（moves=${moves}）`
  })

  // S12b drag html5 拦截链（F-BT11 / U35 / KD-16）
  await step("S12b", "drag html5=true 拦截链（dragstart→drop）", async () => {
    await run({ action: "navigate", url: `${BASE}/` })
    const snap = await run({ action: "snapshot" })
    const src = refOf(snap, "other", /"Drag me"/)
    const dst = refOf(snap, "other", /"Drop here"/)
    assert.equal(await run({ action: "drag", from: src, to: dst, html5: true }), `[drag] ${src} "Drag me" → ${dst} "Drop here" (html5)`)
    assert.equal(await evaluate("Boolean(window.__dndStart)"), true, "dragstart 触发")
    assert.equal((await evaluate("window.__dnd || null"))?.data, "payload", "drop 收到 dataTransfer")
    return "dragstart → drop（payload）"
  })

  // S13 触屏三手势（F-BT12 / U36–U38）
  await step("S13", "touch tap / doubleTap ⇒ 真 click / dblclick", async () => {
    await run({ action: "navigate", url: `${BASE}/` })
    const tapRef = refOf(await run({ action: "snapshot" }), "button", /"Tap Me"/)
    assert.equal(await run({ action: "touch", gesture: "tap", ref: tapRef }), `[touch] tap ${tapRef} "Tap Me"`)
    const taps = await evaluate("window.__taps")
    assert.equal(taps.length, 1)
    assert.equal(taps[0].trusted, true, "tap ⇒ click（isTrusted）")
    assert.ok((await evaluate("window.__touchStarts || 0")) >= 1, "触屏管线（touchstart 读回）")
    assert.equal(await run({ action: "touch", gesture: "doubleTap", ref: tapRef }), `[touch] doubleTap ${tapRef} "Tap Me"`)
    const dbl = await evaluate("window.__dblTaps || null")
    assert.equal(dbl?.trusted, true, "doubleTap ⇒ dblclick（isTrusted）")
    assert.equal(dbl?.detail, 2, "双击计数由浏览器管")
    return "tap → click；doubleTap → dblclick（detail=2）"
  })
  await step("S13b", "touch pinch（×2）", async () => {
    await run({ action: "navigate", url: `${BASE}/` })
    const before = await evaluate("visualViewport ? visualViewport.scale : 1")
    assert.equal(await run({ action: "touch", gesture: "pinch", x: 400, y: 300, scale: 2 }), "[touch] pinch ×2 at 400,300")
    const after = await evaluate("visualViewport ? visualViewport.scale : 1")
    assert.ok(after > before, `pinch 后 scale ${before} → ${after}`)
    return `scale ${before} → ${after}`
  })
  await step("S13c", "touch swipe ⇒ 卷动", async () => {
    await run({ action: "navigate", url: `${BASE}/` })
    assert.equal(await run({ action: "touch", gesture: "swipe", from: "400,700", to: "400,200", steps: 12 }), "[touch] swipe 400,700 → 400,200")
    const y = await evaluate("Math.round(window.scrollY)")
    assert.ok(y > 100, `swipe 后 scrollY=${y}`)
    return `swipe → scrollY=${y}`
  })

  // S14 insert 长文本 + emoji + IME 组合（F-BT13 / U39 / U40 / KD-17）
  await step("S14", "insert 长文本 + emoji + IME 组合中间态", async () => {
    await run({ action: "navigate", url: `${BASE}/` })
    const insRef = refOf(await run({ action: "snapshot" }), "textbox", /"insert target"/)
    const text = "长文本 rocket 🚀 and more"
    assert.equal(await run({ action: "insert", ref: insRef, text, ime: "zhongw" }), `[insert] ${insRef} "insert target" ← ${text.length} chars (ime)`)
    assert.equal(await evaluate("document.getElementById('ins').value"), text, "终文真落（组合被提交替换）")
    const comp = await evaluate("window.__comp")
    assert.ok(comp.some((c) => c.type === "compositionupdate" && c.data === "zhongw"), `组合中间态可见：${JSON.stringify(comp)}`)
    return `value=${JSON.stringify(text)} · composition ${comp.length} 条`
  })

  // S15a 无头页↔页保真往返（实测：无头剪贴板 = 会话内面——系统面需有头，见 S15 ∥ §3.5）
  await step("S15a", "无头：页↔页保真往返（write → read）", async () => {
    await run({ action: "navigate", url: `${BASE}/` })
    const marker = `tc-page-${Date.now()}`
    assert.equal(await run({ action: "clipboard", op: "write", text: marker }), `[clipboard] write ← ${marker.length} chars`)
    assert.equal(await run({ action: "clipboard", op: "read" }), `[clipboard] read (${marker.length} chars)\n${marker}`)
    return `write → read 往返一致（${marker.length} chars）`
  })

  // S15 剪贴板 write/read ↔ 系统（F-BT15 / U41 / U42——有头真跑：系统剪贴板面）
  await step("S15", SYSTEM_CLIPBOARD ? "有头：clipboard write ⇒ 系统读回 ∥ 系统写 ⇒ 工具读回" : "有头：clipboard write/read（跳过——需 win32 + PowerShell）", async () => {
    if (!SYSTEM_CLIPBOARD) return "skipped（无系统剪贴板对照面）"
    await run({ action: "close" })
    await run({ action: "navigate", url: `${BASE}/`, headless: false })
    const marker = `tc-smoke-${Date.now()}`
    assert.equal(await run({ action: "clipboard", op: "write", text: marker }), `[clipboard] write ← ${marker.length} chars`)
    assert.equal(await waitForValue(() => psGetClipboard(), (v) => v === marker), marker, "PowerShell Get-Clipboard 读回一致")
    const marker2 = `tc-read-${Date.now()}`
    psSetClipboard(marker2)
    const expectedRead = `[clipboard] read (${marker2.length} chars)\n${marker2}`
    assert.equal(await waitForValue(() => run({ action: "clipboard", op: "read" }), (v) => v === expectedRead), expectedRead)
    return `有头：write→PS 读回 · PS 写→read 读回（${marker.length}/${marker2.length} chars）`
  })

  // S16 copy / paste ↔ 系统（F-BT15 / U43 / U44——有头真跑）
  await step("S16", SYSTEM_CLIPBOARD ? "有头：clipboard copy ⇒ 系统读回 ∥ paste ⇒ 字段值" : "有头：clipboard copy/paste（跳过——需 win32 + PowerShell）", async () => {
    if (!SYSTEM_CLIPBOARD) return "skipped（无系统剪贴板对照面）"
    await run({ action: "close" })
    await run({ action: "navigate", url: `${BASE}/`, headless: false })
    assert.equal(await evaluate("(function () { const el = document.getElementById('sel'); el.focus(); el.select(); return el.value })()"), "COPY ME")
    assert.equal(await run({ action: "clipboard", op: "copy" }), "[clipboard] copy")
    assert.equal(await waitForValue(() => psGetClipboard(), (v) => v === "COPY ME"), "COPY ME", "copy ⇒ 系统剪贴板")
    const marker = `tc-paste-${Date.now()}`
    psSetClipboard(marker)
    const insRef = refOf(await run({ action: "snapshot" }), "textbox", /"insert target"/)
    assert.equal(await run({ action: "clipboard", op: "paste", ref: insRef }), `[clipboard] paste → ${insRef} "insert target"`)
    assert.equal(await waitForValue(() => evaluate("document.getElementById('ins').value"), (v) => v === marker), marker, "paste 真取剪贴板内容")
    return `copy→PS 读回（"COPY ME"）· PS 写→paste 落值`
  })

  // S17 屏外 ref 自动滚动（F-BT14 / U47）
  await step("S17", "屏外 ref：[outside] → 自动滚动后驱动成立", async () => {
    await run({ action: "close" })
    await run({ action: "navigate", url: `${BASE}/` })
    const line = refLine(await run({ action: "snapshot" }), /"Far"/)
    assert.match(line, /\[outside\]$/, `屏外行应带 [outside]：${line}`)
    const farRef = line.match(/^e\d+/)[0]
    assert.equal(await run({ action: "mouse", ref: farRef }), `[mouse] left click ${farRef} "Far"`)
    assert.equal(await evaluate("Boolean(window.__farClick)"), true, "自动滚动后点击成立")
    return `${farRef} [outside] → 自动滚动 → 点击成立`
  })

  // S18 有头抽样复跑（N-BT8 / U51——仅本地跑，CI 面可跳，沿 S7 先例）
  await step("S18", HEADED ? "有头抽样复跑（press + clipboard）" : "有头抽样复跑（跳过——需 --headed）", async () => {
    if (!HEADED) return "skipped"
    await run({ action: "close" })
    assert.match(await run({ action: "navigate", url: `${BASE}/`, headless: false }), /^\[navigate\] /)
    const snap = await run({ action: "snapshot" })
    const nameRef = refOf(snap, "textbox", /"Name"/)
    assert.equal(await run({ action: "press", key: "b", ref: nameRef }), `[press] b → ${nameRef} "Name"`)
    const marker = `tc-headed-${Date.now()}`
    assert.equal(await run({ action: "clipboard", op: "write", text: marker }), `[clipboard] write ← ${marker.length} chars`)
    if (SYSTEM_CLIPBOARD) assert.equal(await waitForValue(() => psGetClipboard(), (v) => v === marker), marker, "有头：剪贴板真达系统")
    await run({ action: "close" })
    return SYSTEM_CLIPBOARD ? "有头 press + clipboard（系统读回）" : "有头 press + clipboard（非 win32：系统读回面跳过）"
  })
} finally {
  await run({ action: "close" })
  server?.closeAllConnections?.()
  server?.close()
  const core = results.filter(([id]) => id !== "S18")
  const s18 = results.filter(([id]) => id === "S18")
  const failed = [...core, ...(HEADED ? s18 : [])].filter(([, ok]) => !ok)
  console.log(`\n[smoke] ${core.length - core.filter(([, ok]) => !ok).length}/${core.length} + S18(${HEADED ? "ran" : "skipped"}) — failed=${failed.length}`)
  for (const [id, , note] of failed) console.log(`  ${id}: ${note}`)
  process.exitCode = failed.length ? 1 : 0
}
