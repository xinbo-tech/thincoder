/**
 * 2026-09-30-web-quickcheck.test.mjs — 批内件（web 快筛批 · 台账 #434 · 实施轮 · 先红后绿）。
 * 判据表 = 批档 `docs/batches/2026-09-30-web-quickcheck.md` §2.3 ∥ 设计档 `docs/desktop/design/WEB-QUICKCHECK.md`
 * §5（回指表）+ §6（用例表 WQ-1–WQ-4）；机制单源 = 设计档 §3.1（静态服务）∥ §3.2（host shim）∥ §3.3（冒烟九段）。
 * 四用例 · 五腿（全绿 = 批内验收；WQ-2 拆服务路由 ∥ shim 契约两条）：
 *   WQ-1 正常：spawn `run.mjs` ⇒ exit 0 ∥ 九段全绿（stdout `segments=9/9`）+ 截图存在 + PNG magic + `unstubbed=0`；
 *   WQ-2 边界：服务路由（`/` 携注入 ∥ `/index.html` 同形 ∥ `/rc/` 实供 ∥ 逃逸 404 ∥ 表外扩展名 404 ∥ favicon 204（父侧裁特例））
 *         + shim 契约（7 通道逐形 ∥ 表外 reject + 记名 ∥ 订阅面 ∥ 记录面 `__quickcheck`）；
 *   WQ-3 错误：注入锚缺失（夹具改 index.html 脚本行）⇒ 500 + stderr 明示（fail-loud）；
 *   WQ-4 错误：`--browser=<不存在通道名>` 直跑 `run.mjs` ⇒ 非零退出 + stderr 含该通道名。
 * 本件不进仓套件（批内件 · 随批留存）；跑法（仓根 `thincoder/`，cwd 无关）：
 *   node --test docs/batches/2026-09-30-web-quickcheck.test.mjs
 */
import test from "node:test"
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { startServer } from "../../thincoder-desktop/tools/web-quickcheck/serve.mjs"
import { installHostShim } from "../../thincoder-desktop/tools/web-quickcheck/host-shim.mjs"

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, "../..")
const DESKTOP = join(REPO, "thincoder-desktop")
const RUN = join(DESKTOP, "tools/web-quickcheck/run.mjs")
const SHOT = join(DESKTOP, "test/artifacts/quickcheck-boot.png")
const ANCHOR = '<script type="module" src="./app.mjs"></script>'
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47])

test("WQ-1 正常：run.mjs 九段全绿 + 截图 + unstubbed=0", () => {
  rmSync(SHOT, { force: true }) // 判据落点先清位（旧 PNG 不冒名当本次取证）
  const result = spawnSync(process.execPath, [RUN], { cwd: DESKTOP, encoding: "utf8", timeout: 180_000 })
  assert.equal(result.status, 0, `exit=${result.status}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`)
  assert.match(result.stdout, /segments=9\/9/, "九段全绿读数")
  assert.match(result.stdout, /failed=0/)
  assert.match(result.stdout, /unstubbed=0/)
  assert.ok(existsSync(SHOT), "截图落点在盘")
  assert.deepEqual(readFileSync(SHOT).subarray(0, 4), PNG_MAGIC, "PNG magic")
})

test("WQ-2 边界：服务路由 + 门（`/` 携注入 ∥ `/rc/` 实供 ∥ 逃逸 404 ∥ 表外扩展名 404）", async () => {
  const server = await startServer()
  try {
    const root = await fetch(`${server.url}/`)
    assert.equal(root.status, 200)
    const html = await root.text()
    const shimAt = html.indexOf("/__quickcheck/host-shim.mjs")
    const appAt = html.indexOf('src="./app.mjs"')
    assert.ok(shimAt > -1, "shim 注入行在场")
    assert.ok(appAt > -1 && shimAt < appAt, "shim 行先于 app.mjs 行（模块按文档序执行）")

    const index = await fetch(`${server.url}/index.html`)
    assert.equal(index.status, 200)
    assert.ok((await index.text()).includes("/__quickcheck/host-shim.mjs"), "/index.html 同形注入")

    const rc = await fetch(`${server.url}/rc/i18n.mjs`)
    assert.equal(rc.status, 200)
    assert.match(rc.headers.get("content-type") ?? "", /^text\/javascript/, "/rc/ 实供 MIME")
    assert.ok((await rc.text()).length > 0, "/rc/ 实供内容")

    const escape = await fetch(`${server.url}/..%2Fsrc%2Fmain%2Fprotocol.mjs`)
    assert.equal(escape.status, 404, "逃逸路径 ⇒ 404")

    const ext = await fetch(`${server.url}/rc/package.json`)
    assert.equal(ext.status, 404, "表外扩展名（实存档 ⇒ 仍是扩展名门）⇒ 404")

    const favicon = await fetch(`${server.url}/favicon.ico`)
    assert.equal(favicon.status, 204, "浏览器面产物特例（父侧裁 2026-10-01 · 裁=A）⇒ 204")
  } finally {
    await server.close()
  }
})

test("WQ-2（续）shim 契约：7 通道逐形 + 表外 reject + 记录面", async () => {
  const target = {}
  const record = installHostShim(target)
  assert.equal(typeof target.thincoder?.invoke, "function", "窄桥 invoke")
  assert.equal(typeof target.thincoder?.on, "function", "窄桥 on")
  assert.equal(target.__quickcheck, record, "记录面 = __quickcheck 同点")

  const EXPECTED = {
    "config:read": { config: {}, locale: "en", dict: {}, configured: true },
    "project:recent": { cwd: null, recent: [] },
    "sessions:list": { sessions: [], ledger: null },
    "model:catalog": { ok: true, models: [], unavailable: [] },
    "provider:list": { ok: true, active: null, presets: [], providers: [] },
    "ledger:read": { ok: true, counts: null, thresholdReached: false },
    "batch:status": { ok: true, phase: null },
  }
  for (const [channel, receipt] of Object.entries(EXPECTED)) {
    assert.deepEqual(await target.thincoder.invoke(channel), receipt, `${channel} 回执形`)
  }

  await assert.rejects(
    () => target.thincoder.invoke("definitely:not-stubbed", { x: 1 }),
    /channel not stubbed: definitely:not-stubbed/,
  )
  assert.deepEqual(record.unstubbed, ["definitely:not-stubbed"], "表外名记录面")
  assert.deepEqual(record.calls, [...Object.keys(EXPECTED), "definitely:not-stubbed"], "调用名记录面")

  const off = target.thincoder.on("ev:token", () => {})
  assert.equal(typeof off, "function", "on ⇒ 空退订函数")
  assert.deepEqual(record.subscriptions, ["ev:token"], "订阅名记录面")
})

test("WQ-3 错误：注入锚缺失 ⇒ 500 + stderr 明示（fail-loud）", async () => {
  const fixture = mkdtempSync(join(tmpdir(), "tc-quickcheck-anchor-"))
  const realIndex = readFileSync(join(DESKTOP, "renderer/index.html"), "utf8")
  assert.ok(realIndex.includes(ANCHOR), "前置：真 index.html 含注入锚")
  writeFileSync(join(fixture, "index.html"), realIndex.replace(ANCHOR, '<script type="module" src="./main.mjs"></script>'))

  const lines = []
  const original = console.error
  console.error = (...args) => { lines.push(args.map(String).join(" ")) }
  let server = null
  let status = null
  try {
    server = await startServer({ rendererRoot: fixture })
    status = (await fetch(`${server.url}/`)).status
  } finally {
    console.error = original
    if (server !== null) await server.close()
    rmSync(fixture, { recursive: true, force: true })
  }
  assert.equal(status, 500, "锚缺 ⇒ 500（不静默出未注入页）")
  assert.ok(lines.some((line) => /injection anchor/i.test(line)), `stderr 明示（实读：${lines.join(" | ")}）`)
})

test("WQ-4 错误：--browser=<不存在通道名> ⇒ 非零退出 + stderr 含通道名", () => {
  const bogus = "quickcheck-no-such-channel"
  const result = spawnSync(process.execPath, [RUN, `--browser=${bogus}`], { cwd: DESKTOP, encoding: "utf8", timeout: 60_000 })
  assert.notEqual(result.status, 0, `非零退出（实读 exit=${result.status}）`)
  assert.ok(result.stderr.includes(bogus), `stderr 含通道名\nstderr:\n${result.stderr}`)
})
