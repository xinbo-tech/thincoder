/**
 * at-refs-restore.test.mjs — F-W15（`@file` 展开不得污染人读线）机器验收。
 *
 * 设计权威：`docs/vsc/design/WEBVIEW.md` §4.4（恢复面用户文本清洗：显示边界剥离 · fail-closed ·
 * 消费面二处 = 恢复面显示 + 标题源文本 · 盘面/机读线零触碰）+ §6 D-W17；批次档
 * `docs/batches/2026-09-18-vsc-session-wiring.md` §2.3（W15-1…W15-5）与 §2.7 ①（夹具前提五条）。
 *
 * 手法：全部走**行为面**（真 `injectAtRefs` 产物 → 真 `sendHistoryPage` / 真 `generateTitle`）——
 * 不直读剥离函数（实现前该名不存在，直读会让整档 import 期即红、失去逐例读数）。
 * 标题面捕获 = 本地 HTTP 服务器捕请求载荷（先例 `test/trace-store.test.mjs` 的 `sseServer()`）。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createServer } from "node:http"
import { injectAtRefs } from "../src/extension/file-refs.mjs"
import { sendHistoryPage, generateTitle } from "../src/extension/panel-session.mjs"
import { saveSessionToSlot, _setSessionsDirForTest, _resetSessionsDirForTest } from "../src/extension/session-io.mjs"
import { _setConfigPathForTest } from "@thincoder/core/config.mjs"

let _tmp, WS, CFG, A, B
/** 唯一哨兵——a.txt 正文首行（须入生成器前 200 字符窗——核 `generate-title.mjs:33`）。 */
const SENTINEL = "SENTINEL-AT-REFS-9f3a"

before(() => {
  _tmp = mkdtempSync(join(tmpdir(), "tc-atrefs-"))
  WS = join(_tmp, "ws")
  mkdirSync(WS)
  A = `${SENTINEL} first line of a\nsecond line of a\n`
  B = "b-body-first\nb-body-second\n"
  writeFileSync(join(WS, "a.txt"), A)
  writeFileSync(join(WS, "b.txt"), B)
  CFG = join(_tmp, "config.json")
  writeFileSync(CFG, JSON.stringify({ providers: [] }))
  _setConfigPathForTest(CFG)
  _setSessionsDirForTest(join(_tmp, "sessions"))
})

after(() => {
  _setConfigPathForTest(null)
  _resetSessionsDirForTest()
  try { rmSync(_tmp, { recursive: true, force: true }) } catch { /* Windows handle lag */ }
})

/** 恢复面文本（真 sendHistoryPage 的 user 分支产物）。 */
function restoredText(text) {
  const posted = []
  sendHistoryPage({ _panel: { webview: { postMessage: (m) => posted.push(m) } } }, [{ kind: "user", text }], false, false)
  const page = posted.find((m) => m.type === "historyPage")
  assert.ok(page, "historyPage 已投递（前置）")
  return page.messages[0].text
}

// ─── W15-1 / W15-2 恢复面还原（正常）────────────────────────────────────────

test("W15-1 恢复面还原（正常）：真 injectAtRefs 产物过 sendHistoryPage ⇒ 文本 === 注入前原文（逐字）", () => {
  const text = "@a.txt 看下这个文件"
  const injected = injectAtRefs(text, WS)
  assert.ok(injected.includes(A), "前置：确经展开（正文入线）")
  assert.ok(injected.includes("[Referenced files:"), "前置：注入摘要块在尾部")
  assert.equal(restoredText(injected), text, "恢复面 ≡ 活面（用户所打原文，@路径保持简洁形）")
})

test("W15-2 多引用 + 前后文（正常）：逐条还原、顺序与前后文保持", () => {
  const text = "前文 @a.txt 中间 @b.txt 结尾"
  const injected = injectAtRefs(text, WS)
  assert.ok(injected.includes(A) && injected.includes(B), "前置：两引用均展开")
  assert.equal(restoredText(injected), text, "逐条还原 + 前后文零损")
})

// ─── W15-3 不误伤（边界 · fail-closed 锁定）────────────────────────────────

test("W15-3 不误伤（边界·fail-closed）：① 手打 [File: x]（无摘要块）② 形近摘要块（字符数不符）⇒ 原样返回", () => {
  const manual = "[File: x.txt]\n```\nboom\n```"
  assert.equal(restoredText(manual), manual, "① 无摘要块 ⇒ 逐字不变")

  const head = `[File: a.txt]\n\`\`\`\n${A}\n\`\`\` 看下`
  const near = `${head}\n\n[Referenced files:\n  - a.txt (${A.length + 7} chars)\n]`
  assert.equal(restoredText(near), near, "② 字符数不符 ⇒ 整条原样返回（零部分还原）")
})

// ─── W15-4 落线 / 机读线零改（边界 · 回归锚）───────────────────────────────

test("W15-4 落线 / 机读线零改（边界·回归锚）：injectAtRefs 返回值逐字不变", () => {
  const text = "前文 @a.txt 中间 @b.txt 结尾"
  const expect =
    "前文 [File: a.txt]\n```\n" + A + "\n``` 中间 [File: b.txt]\n```\n" + B + "\n``` 结尾" +
    `\n\n[Referenced files:\n  - a.txt (${A.length} chars)\n  - b.txt (${B.length} chars)\n]`
  assert.equal(injectAtRefs(text, WS), expect, "展开本体零改（模型仍见正文——落线/机读线逐字）")
})

// ─── W15-5 标题源文本同源剥离（正常 · 消费面二处之一）──────────────────────

/** 本地 HTTP 服务器：记录每个请求体（不断言响应——只捕载荷）；回一个合法标题响应。 */
function titleServer() {
  const requests = []
  const server = createServer((req, res) => {
    let body = ""
    req.on("data", (c) => { body += c })
    req.on("end", () => {
      requests.push({ url: req.url, body })
      res.writeHead(200, { "content-type": "application/json" })
      res.end(JSON.stringify({ choices: [{ message: { content: "wire title" } }] }))
    })
  })
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve({
      url: `http://127.0.0.1:${server.address().port}`,
      requests,
      close: () => new Promise((r) => server.close(r)),
    }))
  })
}

test("W15-5 标题源文本同源剥离（正常）：真 injectAtRefs 产物经 generateTitle ⇒ 载荷不含哨兵 ∧ 含 @a.txt ∧ 请求 ≥1", async () => {
  const srv = await titleServer()
  try {
    // 夹具前提 ①：隔离 config 指向假服务（端壳经 presets.mjs 读盘配置取 key / provider）
    writeFileSync(CFG, JSON.stringify({
      providers: [{ name: "fakep", apiKey: "k", baseURL: srv.url, model: "m1" }],
      defaultModel: "fakep:m1",
    }))
    const text = "@a.txt 请看一下这个文件的正文内容"
    const injected = injectAtRefs(text, WS)
    // 夹具前提 ③④：剥离后 ≥10 字符（核 :28 早退）· 哨兵入前 200 字符窗（核 :33——红态必须可捕）
    assert.ok(text.length >= 10, `前置：剥离后 ≥10 字符（实 ${text.length}）`)
    assert.ok(injected.slice(0, 200).includes(SENTINEL), "前置：哨兵入前 200 字符窗")

    // 夹具前提 ②：槽数据 activeProvider = 假 provider + history[0] = 真注入产物
    const cwd = process.cwd()
    const slot = 1
    saveSessionToSlot(cwd, slot, {
      version: 2, cwd, title: "", activeProvider: "fakep", activeModel: "m1",
      history: [{ type: "user", content: injected }], contextHistory: [],
    })
    await generateTitle({ _slot: slot }, slot)

    // 夹具前提 ⑤：三条并列（零请求假绿防呆）
    assert.ok(srv.requests.length >= 1, "请求 ≥1 次")
    const payload = JSON.stringify(srv.requests)
    assert.ok(!payload.includes(SENTINEL), "请求载荷不含哨兵（标题不得由 [File: …] 文件正文生成）")
    assert.ok(payload.includes("@a.txt"), "请求载荷仍含 @a.txt（简洁形）")
  } finally {
    await srv.close()
  }
})
