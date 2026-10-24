/**
 * browser-start-window.test.mjs — 集成场景 I-BT1–I-BT3（设计：`docs/core/design/BROWSER-TOOL.md` §11
 * 「集成测试设计（F34 · 本批 · 收口口径）」）：
 * 启动窗旋钮到用户面生效（env `BROWSER_START_TIMEOUT_MS`）、缺省 25s 不再出现 12s 时代的句子、
 * 真机首动作 navigate 能被自启段放行（KD-26 的门内抽样：快机上看不到「自启吃掉动作预算」那一半；
 * 墙钟半由单测 T47/T48 判，不入门——设计 §11）。
 * 环境残差：I-BT3 只在「无 Chromium」时 skip；有浏览器但起不来（无沙箱 ∥ profile 不可写）会照红——
 * 那是环境红，不是回归红（设计 §11 只登记了无 Chromium 的 skip 面）。
 *
 * 业务入口 = 真工具面 `browser`（`tools/browser.mjs`）；断言只落在模型面回执文本与会话可用性
 * （失败后第二次调用仍能给出同一失败句，而不是 `session is already running`）。
 *
 * 隔离：HOME ∥ USERPROFILE 指向临时家目录（browser profile 锁与 DevToolsActivePort 都落在其中），
 * 不碰真实 `~/.thincoder/browser/`。`configDir` 在模块装载时取值，故先设环境再动态 import。
 * I-BT1 ∥ I-BT2 零等待：替身 `BROWSER_PATH = process.execPath`（浏览器参数被 node 拒收即退），
 * `launch.mjs` 的 `child.exitCode !== null` 支直接走失败句——`Math.round(timeoutMs / 1000)` 即生效窗口。
 */
import { test, after } from "node:test"
import assert from "node:assert/strict"
import { createServer } from "node:http"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const HOME = mkdtempSync(join(tmpdir(), "tc-int-browser-home-"))
const SAVED = {
  HOME: process.env.HOME,
  USERPROFILE: process.env.USERPROFILE,
  BROWSER_PATH: process.env.BROWSER_PATH,
  BROWSER_START_TIMEOUT_MS: process.env.BROWSER_START_TIMEOUT_MS,
}
process.env.HOME = HOME
process.env.USERPROFILE = HOME

const { browserTool } = await import("@thincoder/core/tools/browser.mjs")
const { resolveBrowser } = await import("@thincoder/core/browser/launch.mjs")

after(() => {
  for (const [key, value] of Object.entries(SAVED)) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
  rmSync(HOME, { recursive: true, force: true })
})

const ctx = { agent: { config: {} } }

/** 设定本用例的 env，测试后逐键还原。 */
function withEnv(t, env) {
  const saved = {}
  for (const [key, value] of Object.entries(env)) {
    saved[key] = process.env[key]
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
  t.after(() => {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  })
}

const navigate = () => browserTool.execute({ action: "navigate", url: "http://127.0.0.1:1/" }, ctx)

test('4-1 env 旋钮生效：BROWSER_START_TIMEOUT_MS=2000 的失败句含 within 2s，且失败后会话仍可用', { timeout: 120_000 }, async (t) => {
  withEnv(t, { BROWSER_PATH: process.execPath, BROWSER_START_TIMEOUT_MS: "2000" })

  const first = await navigate()
  assert.match(first, /^Error: browser failed to start:/, `首回调失败回执，实际：${first}`)
  assert.match(first, /within 2s/, `生效窗口 = env 值 2s（不是缺省 25s），实际：${first}`)

  const second = await navigate()
  assert.match(second, /within 2s/, `第二次仍按 2s 窗判失败，实际：${second}`)
  // 会话态若在启动失败后残留，第二次才会命中该句（`session.mjs:193` 的模式切换支——此处应不可达）
  assert.doesNotMatch(second, /session is already running/, "启动失败后会话态已复位，第二次是干净重开")
})

test('4-2 缺省窗口：不设 env 的失败句含 within 25s，12s 时代的句子不再出现', { timeout: 120_000 }, async (t) => {
  withEnv(t, { BROWSER_PATH: process.execPath, BROWSER_START_TIMEOUT_MS: undefined })

  const receipt = await navigate()
  assert.match(receipt, /^Error: browser failed to start:/, `缺省路径失败回执，实际：${receipt}`)
  assert.match(receipt, /within 25s/, `缺省启动窗 = 25s，实际：${receipt}`)
  assert.doesNotMatch(receipt, /within 12s/, "12s 时代句子不再出现")
})

test('4-3 真机首动作 navigate：自启段不吃动作预算（无 Chromium 则 skip 并打印）', { timeout: 180_000 }, async (t) => {
  withEnv(t, { BROWSER_PATH: undefined, BROWSER_START_TIMEOUT_MS: undefined })

  try {
    resolveBrowser()
  } catch {
    console.log("no Chromium-based browser — 4-3 skipped")
    t.skip("no Chromium-based browser")
    return
  }

  const server = createServer((req, res) => {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" })
    res.end("<!doctype html><html><head><title>I-BT3 fixture</title></head><body><h1>PINEAPPLE-BT3</h1><a href=\"/next\">next</a></body></html>")
  })
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve))
  t.after(async () => {
    await browserTool.execute({ action: "close" }, ctx)
    server.closeAllConnections?.()
    await new Promise((resolve) => server.close(resolve))
  })
  const url = `http://127.0.0.1:${server.address().port}/`

  const receipt = await browserTool.execute({ action: "navigate", url }, ctx)
  assert.ok(receipt.startsWith(`[navigate] ${url}`), `首动作回执应以 [navigate] + 页 URL 起头，实际：${receipt}`)
  assert.match(receipt, /\[page\] .* — "I-BT3 fixture"/, `页摘带回 fixture 标题，实际：${receipt}`)
  assert.match(receipt, /e\d+ link "next"/, `页摘带回 fixture 的可交互元素，实际：${receipt}`)
  if (/timed out/.test(receipt)) {
    assert.doesNotMatch(receipt, /stuck in launch browser/, "若出现超时句，卡点步名不得是 launch browser（自启段不占动作预算）")
  }
})
