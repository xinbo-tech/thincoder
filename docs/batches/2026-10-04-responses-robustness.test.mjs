/**
 * 批内 unit 测试（台账 #907 · responses 适配面健壮性三项）——T1–T8。
 * 宿主 = 批档 docs/batches/2026-10-04-responses-robustness.md §2 测试面表；
 * 跑法 = 仓根 `node --test docs/batches/2026-10-04-responses-robustness.test.mjs`。
 * stub 级零网络：parseStream 直驱 mock async-iterable body；buildBody 纯函数直调。
 */
import test from "node:test"
import assert from "node:assert/strict"

import { parseStream } from "../../thincoder-core/provider/responses.mjs"
// 命名空间导入（非 named）：T5 红态 = 函数不存在——named 导入会在模块加载期崩掉整个文件，
// 其余 T 用例就跑不出各自的先红读数了。
import * as errors from "../../thincoder-core/provider/errors.mjs"
import { buildBody } from "../../thincoder-core/provider/responses-request.mjs"

/** mock SSE body：chunks 按原样作为流 chunk 吐出（控定界与尾帧形态）。 */
function sseBody(chunks) {
  return { body: (async function* () { for (const c of chunks) yield Buffer.from(c, "utf8") })() }
}

function frame(obj) {
  return `data: ${JSON.stringify(obj)}\n\n`
}

const PROVIDER_BASE = { name: "t", model: "gpt-4o-mini", baseURL: "https://api.openai.com/v1", apiKey: "sk-test" }

// —— D9：标准 type:"error" 帧（AC-1）——

test("T1 · D9 裸 type:error 帧 ⇒ 抛错含服务端 message（红：现行静默空结果）", async () => {
  const response = sseBody([frame({ type: "error", error: { code: "server_error", message: "boom" } })])
  await assert.rejects(() => parseStream(response, {}), /boom/)
})

test("T2 · D9 内容帧后 error 帧 ⇒ partial 抢救（content 保留 + _warnings + errorDetail）", async () => {
  const response = sseBody([
    frame({ type: "response.output_text.delta", delta: "partial hello" }),
    frame({ type: "error", error: { code: "server_is_overloaded", message: "overloaded now" } }),
  ])
  const result = await parseStream(response, {})
  assert.equal(result.partial, true)
  assert.equal(result.content, "partial hello")
  assert.ok(result._warnings.some((w) => w.name === "responses-error-frame"))
  assert.ok(result.errorDetail.includes("overloaded now"))
})

test("T3 · D9 回归锁：event:error 无 type 变体 ⇒ 仍抛错（识别逻辑零变）", async () => {
  const response = sseBody([`event: error\ndata: ${JSON.stringify({ code: "biz_400", message: "biz fail" })}\n\n`])
  await assert.rejects(() => parseStream(response, {}), /biz fail/)
})

test("T4 · D9 尾帧：无 \\n\\n 定界的 type:error 残余帧 ⇒ 同一 error 处置（传播）", async () => {
  const response = sseBody([`data: ${JSON.stringify({ type: "error", error: { code: "server_error", message: "tail boom" } })}`])
  await assert.rejects(() => parseStream(response, {}), /tail boom/)
})

// —— D8：码级映射（AC-3）——

test("T5 · D8 classifyResponsesErrorCode 最小集五码逐码断言 + 未列码 null", () => {
  const classify = errors.classifyResponsesErrorCode
  const ctx = classify("context_length_exceeded")
  assert.equal(ctx.kind, "context_overflow")
  assert.equal(ctx.retryable, false)
  assert.ok(ctx.hint.includes("/compact"))

  const quota = classify("insufficient_quota")
  assert.equal(quota.kind, "quota")
  assert.equal(quota.retryable, false)
  assert.ok(quota.hint)

  const invalid = classify("invalid_prompt")
  assert.equal(invalid.kind, "invalid_request")
  assert.equal(invalid.retryable, false)
  assert.equal(invalid.hint ?? null, null)

  for (const code of ["server_is_overloaded", "server_error"]) {
    const s = classify(code)
    assert.equal(s.kind, "server")
    assert.equal(s.retryable, true)
  }

  assert.equal(classify("usage_not_included"), null)
  assert.equal(classify("no_such_code"), null)
})

test("T6 · D8 response.failed 携 context_length_exceeded ⇒ /compact 指引 + errorKind + status 非字符串", async () => {
  const response = sseBody([frame({ type: "response.failed", response: { error: { code: "context_length_exceeded", message: "ctx too long" } } })])
  await assert.rejects(() => parseStream(response, {}), (e) => {
    assert.ok(e.message.includes("/compact"))
    assert.equal(e.errorKind, "context_overflow")
    assert.notEqual(typeof e.status, "string")
    return true
  })
})

// —— D5：max_output_tokens 显式才发（AC-4）——

test("T7 · D5 provider.maxTokens 缺 ⇒ body 无 max_output_tokens 键（红：现恒发 spec.maxOutput）", () => {
  const { body } = buildBody({ ...PROVIDER_BASE }, [{ role: "user", content: "hi" }], [])
  assert.equal("max_output_tokens" in body, false)
})

test("T8 · D5 provider.maxTokens=4096 ⇒ body.max_output_tokens 逐字透传", () => {
  const { body } = buildBody({ ...PROVIDER_BASE, maxTokens: 4096 }, [{ role: "user", content: "hi" }], [])
  assert.equal(body.max_output_tokens, 4096)
})
