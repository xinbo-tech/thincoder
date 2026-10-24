/**
 * web-backend-404.test.mjs — 集成场景 I-WB1–I-WB3（设计：`docs/core/design/TOOLS.md` §6.23 末
 * 「集成测试设计（F34 · 本批 · 收口口径）」）：
 * 抓一个 404 页面之后，同一会话的 `websearch` 还能用；凭据类失败只停后端、不停工具；无 DeepSeek 渠道零变化。
 *
 * 业务入口 = 真工具面 `fetch` ∥ `websearch`（`tools/web.mjs`）；同一 `agent` 对象 = 同一会话的配置面
 * 与熔断身份（`web-deepseek.mjs` 的熔断域按 agent 对象分区）。断言只落在业务可观察结果：
 * 工具回执文本、DeepSeek 替身命中计数、调用是否结算。
 *
 * 上游替身 = 既有传输缝 `_setDeepseekTransportForTest`：端点是指向 `api.deepseek.com` 的固定常量
 * （D-WB2），业务入口指不到本机假上游——设计同段指定该缝，用例后经 `t.after` 复位。
 * 本地直取腿 = 覆盖 `globalThis.fetch` 喂 fixture 页 / Bing RSS：`fetch` 的 SSRF 门拒收 127.0.0.1
 * （`tools/shared.mjs:31` `isPrivateHost`），所以不能起本机 HTTP 服务；走的仍是 `tools/web.mjs` 的
 * 真实回落路径。零外网、零付费端点。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { fetchTool, websearchTool } from "@thincoder/core/tools/web.mjs"
import { _resetDeepseekTransportForTest, _setDeepseekTransportForTest } from "@thincoder/core/tools/web-deepseek.mjs"

/** 本地直取的 fixture 页（I-WB1 ∥ I-WB2 的「回落成功」读数）。 */
const FIXTURE_HTML = "<!doctype html><html><head><title>fixture page</title></head><body><p>PINEAPPLE-LOCAL-FIXTURE</p></body></html>"

/** 回落腿（Bing RSS）的固定应答——I-WB2 的承接读数与 I-WB3 的「改动前逐字相等」基准。 */
const BING_RSS = "<?xml version=\"1.0\"?><rss><channel><item><title>Fallback One</title><link>https://fallback.example/one</link><description>fallback snippet</description></item></channel></rss>"
const BING_RECEIPT = "1. [bing] Fallback One\n   https://fallback.example/one\n   fallback snippet"

/** 一个合格的 DeepSeek 渠道（baseURL host 必须恰为 api.deepseek.com）。 */
const deepseekAgent = () => {
  const entry = { name: "deepseek", baseURL: "https://api.deepseek.com", apiKey: "sk-test" }
  return { config: { providers: [entry], providersList: [entry] } }
}

/** 覆盖 `globalThis.fetch`（本地直取 / Bing 腿）——返回调用 URL 列表；测试后复位。 */
function serveLocalFetch(t) {
  const real = globalThis.fetch
  const urls = []
  globalThis.fetch = async (url) => {
    urls.push(String(url))
    return String(url).includes("bing.com")
      ? new Response(BING_RSS, { status: 200, headers: { "content-type": "application/rss+xml" } })
      : new Response(FIXTURE_HTML, { status: 200, headers: { "content-type": "text/html" } })
  }
  t.after(() => { globalThis.fetch = real })
  return urls
}

/** DeepSeek 传输替身——返回上游调用列表；测试后复位（含熔断容器与时钟）。 */
function stubTransport(t, responder) {
  const calls = []
  _setDeepseekTransportForTest(async (url, opts) => {
    const call = { url: String(url), body: JSON.parse(opts.body) }
    calls.push(call)
    return responder(call)
  })
  t.after(() => _resetDeepseekTransportForTest())
  return calls
}

const httpReply = (status) => ({ ok: false, status, body: { cancel() {} } })
const jsonReply = (data) => ({ ok: true, status: 200, json: async () => data })

test('3-1 404 不熔断：fetch 收到 404 后，同一会话的 websearch 仍打到 DeepSeek', { timeout: 60_000 }, async (t) => {
  const local = serveLocalFetch(t)
  const calls = stubTransport(t, (call) => call.url.endsWith("/fetch")
    ? httpReply(404)
    : jsonReply({ results: [{ title: "After 404", url: "https://result.example/after-404", summary: "search still reaches the backend" }] }))
  const agent = deepseekAgent()

  const receipt = await fetchTool.execute({ url: "https://fixture.example/missing-page" }, { agent })
  assert.match(receipt, /PINEAPPLE-LOCAL-FIXTURE/, `404 后应由本地直取承接并带回页面正文，实际：${receipt}`)
  assert.equal(calls.length, 1, `404 不重试：fetch 腿恰 1 次上游调用，实际：${calls.length}`)
  assert.equal(local.length, 1, "本地直取恰 1 次")

  const search = await websearchTool.execute({ query: "after the 404" }, { agent })
  assert.match(search, /^1\. \[deepseek\]/, `404 之后 search 仍由 DeepSeek 命中，实际：${search}`)
  assert.doesNotMatch(search, /\(deepseek /, "未熔断：回执不出现「deepseek 回落」提示行")
  assert.equal(calls.filter((c) => c.url.endsWith("/search")).length, 1, "同一会话的 search 恰 1 次 DeepSeek 请求（未熔断）")
})

test('3-2 401 熔断只停后端：fetch 回落本地直取成功，随后 websearch 零上游命中且结算', { timeout: 60_000 }, async (t) => {
  serveLocalFetch(t)
  const calls = stubTransport(t, () => httpReply(401))
  const agent = deepseekAgent()

  const receipt = await fetchTool.execute({ url: "https://fixture.example/missing-page" }, { agent })
  assert.match(receipt, /PINEAPPLE-LOCAL-FIXTURE/, `401 后由本地直取承接并带回页面正文，实际：${receipt}`)
  const afterFetch = calls.length
  assert.equal(afterFetch, 1, "401 恰 1 次上游调用（不重试）")

  const started = Date.now()
  const search = await websearchTool.execute({ query: "after the 401" }, { agent })
  const elapsed = Date.now() - started
  assert.ok(elapsed < 10_000, `熔断窗口内 search 在预算内结算（不悬挂），实际 ${elapsed}ms`)
  assert.equal(calls.length, afterFetch, "熔断窗口内 DeepSeek search 零请求")
  assert.match(search, /^1\. \[bing\]/, `熔断只停后端、不停工具：回落腿承接结果，实际：${search}`)
})

test('3-3 无 DeepSeek 渠道零变化：回执逐字不变、零 (deepseek …) 提示行、替身零命中', { timeout: 60_000 }, async (t) => {
  serveLocalFetch(t)
  const calls = stubTransport(t, () => { throw new Error("no DeepSeek channel — the transport must never be called") })
  const agent = { config: { providers: [], providersList: [] } }

  const receipt = await websearchTool.execute({ query: "no channel configured" }, { agent })
  assert.equal(receipt, BING_RECEIPT, "无渠道用户回执与改动前逐字相等")
  assert.doesNotMatch(receipt, /\(deepseek /, "零 deepseek 提示行")
  assert.equal(calls.length, 0, "DeepSeek 替身零命中")
})
