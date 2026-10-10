/**
 * 2026-10-10-gemini-thought-signature.test.mjs — 批内件（gemini-thought-signature · 台账 #1205 · 实施轮）。
 * 名随批次档 · 住批次目录 · 不进仓套件；复跑 = 从仓库根（thincoder/）：
 *   node --test docs/batches/2026-10-10-gemini-thought-signature.test.mjs
 *
 * 用例 = 批档 §2 验收面 ①–⑤（终形）逐条对应；单源 = `docs/core/design/PROVIDER.md` §6.24：
 *   AC-1 捕获（OpenAI 兼容路）：合成帧四条槽路径（index / id / name / tail）+ 非 SSE JSON 兜底帧
 *        ⇒ 槽带 `extra_content.google.thought_signature`；白名单构造（KD-1——回显未知子字段被剔除）
 *   AC-2 捕获（原生路）：google.mjs `chat()` + fetch 桩喂 functionCall + thoughtSignature ⇒ 槽含同字段；
 *        无签名 part ⇒ 槽键集逐字 {id,name,arguments}（零回归侧）
 *   AC-3 承载：`assistantToolCallMessage` 直调——有 ⇒ 逐字同值 ∥ 无 ⇒ 键不存在
 *   AC-4 合并保真（双层）：结构断言（core.mjs 源文本含搬字段行）+ 行为用例（fetch 桩两帧喂 chat()：
 *        帧 1 槽帧无签名 + finish_reason:"insufficient_system_resource"；帧 2 同槽帧携签名 +
 *        finish_reason:"tool_calls" ⇒ 出口槽签名在场）= 搬字段行的红 / 绿判别器
 *   AC-5 零回归：无签名字段 ⇒ 槽键集 {id,name,arguments} ∧ 消息 tool_calls 项键集 {id,type,function}
 *   AC-6 网关透传（结构断言 · 证据级注）：forward 展开形 ∥ 逐块原样写 ∥ routes 全 body 传递
 *        （线上真跑 = AC-8 端到端真发——需用户 gemini 实例，父侧收口提请项；机检层到此为止）
 *   AC-7 持久化：JSON 往返同值 ∥ `slimForDisplay` 不改 `extra_content`（300 字符截断面同判）
 *   AC-9 单构造点（结构断言）：thincoder-core 非注释 `tool_calls:` 装配恰 1 处（= model-specs.mjs，
 *        携带签名字段）∥ 三调用站点各恰 1 ∥ 产品树零旁路调用 ∥ VSC 转口零调用点
 *   AC-10 桩面：有签名历史经 `chat()`（openai 形 provider + fetch 桩捕获请求体）⇒ 请求体
 *        `messages[]` 该字段逐字在场；对端接受度 = 认账本体（发送侧不可判）
 * 先红后绿：改前码上 6 红 / 3 绿 = AC-1/2/3/4/9/10 红（捕获 / 承载 / 合并三面未落 + 单点签名字段未落），AC-5/6/7 绿（零回归面 / 结构面）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const ROOT = fileURLToPath(new URL("../../", import.meta.url)) // 仓根（thincoder/）
const mod = (rel) => import(pathToFileURL(join(ROOT, rel)).href)

const SSE = await mod("thincoder-core/provider/sse.mjs") // readSSE
const CORE = await mod("thincoder-core/provider/core.mjs") // chat / mergeRetryToolCalls 宿主
const GOOGLE = await mod("thincoder-core/provider/google.mjs") // 原生路 transport
const SPECS = await mod("thincoder-core/model-specs.mjs") // assistantToolCallMessage
const SEG = await mod("thincoder-core/session-segments.mjs") // slimForDisplay

const enc = new TextEncoder()
/** SSE 帧（openai 形 choice）。 */
const frame = (choice) => `data: ${JSON.stringify({ choices: [choice] })}\n\n`
/** SSE 响应桩（event-stream；readSSE 直驱 / chat() 全链共用）。 */
const sseResponse = (text) => ({
  ok: true, status: 200,
  headers: new Headers({ "content-type": "text/event-stream" }),
  body: new ReadableStream({ start(c) { c.enqueue(enc.encode(text)); c.close() } }),
  text: async () => "",
})
/** 非 SSE JSON 兜底响应桩（content-type=application/json；readSSE 走单块 JSON 分支）。 */
const jsonResponse = (payload) => ({
  ok: true, status: 200,
  headers: new Headers({ "content-type": "application/json" }),
  body: null,
  text: async () => JSON.stringify(payload),
})
/** fetch 桩（响应队列 + 请求捕获；队列耗尽 = 显式炸，不静默空转）。 */
async function withFetch(responses, fn) {
  const real = globalThis.fetch
  const queue = [...responses]
  const calls = []
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init })
    const next = queue.shift()
    if (next === undefined) throw new Error(`fetch stub exhausted (call #${calls.length})`)
    return next
  }
  try { return await fn(calls) } finally { globalThis.fetch = real }
}

const SIG = { google: { thought_signature: "S" } }
const DONE = "data: [DONE]\n\n"

/* ── AC-1 捕获（OpenAI 兼容路）：四条槽路径 + 非 SSE 兜底帧 + 白名单构造 ── */
test("AC-1 捕获：四条槽路径（index / id / name / tail）与非 SSE 兜底帧均捕获签名", async () => {
  // index 路径（槽选择分支链第一支）
  const r1 = await SSE.readSSE(sseResponse(frame({ delta: { tool_calls: [{ index: 0, id: "call_i", type: "function", function: { name: "glob", arguments: "{}" }, extra_content: SIG }] }, finish_reason: "tool_calls" }) + DONE), {})
  assert.equal(r1.toolCalls[0].extra_content.google.thought_signature, "S", "index 路径")

  // id 路径（无 index，按 id 未命中 ⇒ 新槽）
  const r2 = await SSE.readSSE(sseResponse(frame({ delta: { tool_calls: [{ id: "call_d", function: { name: "read", arguments: "{}" }, extra_content: SIG }] }, finish_reason: "tool_calls" }) + DONE), {})
  assert.equal(r2.toolCalls[0].extra_content.google.thought_signature, "S", "id 路径")

  // name 路径（无 index / 无 id，首帧 function.name）
  const r3 = await SSE.readSSE(sseResponse(frame({ delta: { tool_calls: [{ function: { name: "grep", arguments: "{}" }, extra_content: SIG }] }, finish_reason: "tool_calls" }) + DONE), {})
  assert.equal(r3.toolCalls[0].extra_content.google.thought_signature, "S", "name 路径")

  // tail 路径（无 index / id / name：尾随帧补参；前帧建槽）
  const tail = frame({ delta: { tool_calls: [{ index: 0, id: "call_t", function: { name: "write", arguments: "{\"p\":" } }] } })
    + frame({ delta: { tool_calls: [{ function: { arguments: "1}" }, extra_content: SIG }] }, finish_reason: "tool_calls" }) + DONE
  const r4 = await SSE.readSSE(sseResponse(tail), {})
  assert.equal(r4.toolCalls.length, 1, "tail 帧未新建槽")
  assert.equal(r4.toolCalls[0].extra_content.google.thought_signature, "S", "tail 路径（槽落定后单次插入共经）")

  // 非 SSE JSON 兜底帧（同经 mergeToolCalls）
  const r5 = await SSE.readSSE(jsonResponse({ choices: [{ message: { tool_calls: [{ index: 0, id: "call_j", function: { name: "edit", arguments: "{}" }, extra_content: SIG }] }, finish_reason: "tool_calls" }] }), {})
  assert.equal(r5.toolCalls[0].extra_content.google.thought_signature, "S", "非 SSE 兜底帧")

  // 白名单构造（KD-1）：只认 google.thought_signature——未知子字段被剔除、非字符串值不建
  const r6 = await SSE.readSSE(sseResponse(frame({ delta: { tool_calls: [{ index: 0, id: "call_w", function: { name: "glob", arguments: "{}" }, extra_content: { google: { thought_signature: "S" }, other: { x: 1 }, stray: "v" } }] }, finish_reason: "tool_calls" }) + DONE), {})
  assert.deepEqual(r6.toolCalls[0].extra_content, { google: { thought_signature: "S" } }, "白名单构造（零原样透带）")
  const r7 = await SSE.readSSE(sseResponse(frame({ delta: { tool_calls: [{ index: 0, id: "call_n", function: { name: "glob", arguments: "{}" }, extra_content: { google: { thought_signature: 42 } } }] }, finish_reason: "tool_calls" }) + DONE), {})
  assert.equal("extra_content" in r7.toolCalls[0], false, "非字符串签名 ⇒ 不建键（在场才建）")
})

/* ── AC-2 捕获（原生路）：google.mjs chat() + fetch 桩 ── */
test("AC-2 捕获（原生路）：functionCall part 级 thoughtSignature ⇒ 槽含同字段；无签名 ⇒ 键集逐字", async () => {
  const provider = { model: "gemini-2.5-flash", apiKey: "k", baseURL: "http://127.0.0.1:1", format: "google" }
  const gFrame = (parts) => `data: ${JSON.stringify({ candidates: [{ content: { parts }, finishReason: "STOP" }], usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1, totalTokenCount: 2 } })}\n\n`
  const withSig = gFrame([{ functionCall: { name: "glob", args: { pattern: "x" } }, thoughtSignature: "S2" }])
  const res = await withFetch([sseResponse(withSig)], () => GOOGLE.chat(provider, { messages: [{ role: "user", content: "x" }] }))
  assert.equal(res.toolCalls[0].extra_content.google.thought_signature, "S2", "原生路捕获")

  const noSig = gFrame([{ functionCall: { name: "glob", args: { pattern: "x" } } }])
  const res2 = await withFetch([sseResponse(noSig)], () => GOOGLE.chat(provider, { messages: [{ role: "user", content: "x" }] }))
  assert.deepEqual(Object.keys(res2.toolCalls[0]).sort(), ["arguments", "id", "name"], "无签名 part ⇒ 槽键集逐字不变")
})

/* ── AC-3 承载：assistantToolCallMessage 直调 ── */
test("AC-3 承载：有 ⇒ tool_calls[].extra_content 逐字同值 ∥ 无 ⇒ 键不存在", () => {
  const withSig = SPECS.assistantToolCallMessage({ content: null, toolCalls: [{ id: "call_1", name: "glob", arguments: "{}", extra_content: { google: { thought_signature: "S3" } } }] }, {})
  assert.deepEqual(withSig.tool_calls[0].extra_content, { google: { thought_signature: "S3" } }, "有 ⇒ 逐字同值")
  const noSig = SPECS.assistantToolCallMessage({ content: null, toolCalls: [{ id: "call_1", name: "glob", arguments: "{}" }] }, {})
  assert.equal("extra_content" in noSig.tool_calls[0], false, "无 ⇒ 键不存在")
})

/* ── AC-4 合并保真：结构断言 + 行为用例（搬字段行的红 / 绿判别器） ── */
test("AC-4 合并保真：行为用例（重试缝合两帧 ⇒ 签名存活）+ 结构断言（搬字段行在场）", async () => {
  const provider = { model: "harness-model", apiKey: "k", baseURL: "http://127.0.0.1:1" }
  const attempt1 = frame({ delta: { tool_calls: [{ index: 0, id: "call_1", type: "function", function: { name: "glob", arguments: "{\"pattern\":\"x\"}" } }] }, finish_reason: "insufficient_system_resource" }) + DONE
  const attempt2 = frame({ delta: { tool_calls: [{ index: 0, id: "call_1", type: "function", function: { name: "glob" }, extra_content: { google: { thought_signature: "S4" } } }] }, finish_reason: "tool_calls" }) + DONE
  const res = await withFetch([sseResponse(attempt1), sseResponse(attempt2)], () => CORE.chat(provider, { messages: [{ role: "user", content: "x" }] }))
  assert.equal(res.finishReason, "tool_calls", "重试第二帧出口")
  assert.equal(res.toolCalls.length, 1, "同槽合并（未新增槽）")
  assert.equal(res.toolCalls[0].extra_content.google.thought_signature, "S4", "重试合并后签名存活（首见胜）——搬字段行的红 / 绿判别器")

  const src = readFileSync(join(ROOT, "thincoder-core/provider/core.mjs"), "utf8")
  assert.ok(src.includes("if (tc.extra_content && !s.extra_content) s.extra_content = tc.extra_content"), "mergeRetryToolCalls 搬字段行在场")
})

/* ── AC-5 零回归：键集逐字同形 ── */
test("AC-5 零回归：无签名帧 ⇒ 槽键集 {id,name,arguments} ∧ 消息 tool_calls 项键集 {id,type,function}", async () => {
  const r = await SSE.readSSE(sseResponse(frame({ delta: { tool_calls: [{ index: 0, id: "call_1", type: "function", function: { name: "glob", arguments: "{}" } }] }, finish_reason: "tool_calls" }) + DONE), {})
  assert.deepEqual(Object.keys(r.toolCalls[0]).sort(), ["arguments", "id", "name"], "槽键集逐字不变")
  const msg = SPECS.assistantToolCallMessage({ content: null, toolCalls: [{ id: "call_1", name: "glob", arguments: "{}" }] }, {})
  assert.deepEqual(Object.keys(msg.tool_calls[0]).sort(), ["function", "id", "type"], "消息 tool_calls 项键集逐字不变")
})

/* ── AC-6 网关透传（结构断言 · 零改面钉；证据级 = 结构 + 真跑双层） ── */
test("AC-6 网关透传（结构断言）：forward 展开形 ∥ 逐块原样写 ∥ routes 全 body 传递", () => {
  const forward = readFileSync(join(ROOT, "thincoder-server/src/gateway/forward.mjs"), "utf8")
  assert.ok(forward.includes("payload: injectIncludeUsage({ ...body, model })"), "请求体展开透传（除 model 外字段全量——零字段白名单）")
  assert.ok(forward.includes("for await (const chunk of upstream.body)"), "流式逐块中继")
  assert.ok(forward.includes("res.write(chunk)"), "chunk 字节原样写（零重编码）")
  const routes = readFileSync(join(ROOT, "thincoder-server/src/gateway/routes.mjs"), "utf8")
  assert.ok(routes.includes("const body = await readJsonBody(req)"), "读取全文请求体")
  assert.ok(routes.includes("body, ts,"), "forwardChat 全 body 传递（零字段白名单）")
})

/* ── AC-7 持久化：JSON 往返 + slimForDisplay 截断面 ── */
test("AC-7 持久化：JSON 往返同值 ∥ slimForDisplay 截断 arguments 不改 extra_content", () => {
  const msg = {
    role: "assistant", content: null,
    tool_calls: [{ id: "call_1", type: "function", function: { name: "glob", arguments: JSON.stringify({ pattern: "x".repeat(400) }) }, extra_content: { google: { thought_signature: "S7" } } }],
  }
  const round = JSON.parse(JSON.stringify(msg))
  assert.deepEqual(round.tool_calls[0].extra_content, { google: { thought_signature: "S7" } }, "JSON 往返同值")
  const slim = SEG.slimForDisplay(msg)
  assert.equal(slim.tool_calls[0].function.arguments.length, 301, "长 args 截断（300 + …）")
  assert.deepEqual(slim.tool_calls[0].extra_content, { google: { thought_signature: "S7" } }, "截断面保留签名（键集零改）")
  assert.equal(slim.tool_calls[0].id, "call_1", "其余字段零改")
})

/* ── AC-9 单构造点（结构断言）：装配 1 处 + 调用站点 3 处 + VSC 零调用 ── */
const walkMjs = (dir, out = []) => {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".git" || name.startsWith("dist")) continue
    const p = join(dir, name)
    if (statSync(p).isDirectory()) { walkMjs(p, out); continue }
    if (name.endsWith(".mjs")) out.push(p)
  }
  return out
}
const relOf = (p) => p.slice(ROOT.length).replace(/\\/g, "/")
const isTestFile = (rel) => /(^|\/)(test|tests|scripts)\//.test(rel) || /\.test\.mjs$|\.spec\.mjs$/.test(rel) || rel.startsWith("docs/") || rel.startsWith(".thincoder/")
/** 调用点计数：只数真调用（剔除注释行与自身定义行）。 */
const callCount = (src) => src.split("\n").filter((line) => /assistantToolCallMessage\(/.test(line) && !/^\s*(\*|\/\/)/.test(line) && !/function\s+assistantToolCallMessage\(/.test(line)).length

test("AC-9 单构造点：thincoder-core 非注释 tool_calls: 装配恰 1 处（携带签名）∥ 三调用站点各恰 1 ∥ 产品树零旁路 ∥ VSC 零调用", () => {
  // ① thincoder-core 全树：非注释行的 `tool_calls:` 恰 1 处（= assistantToolCallMessage 装配）
  const hits = []
  for (const p of walkMjs(join(ROOT, "thincoder-core"))) {
    readFileSync(p, "utf8").split("\n").forEach((line, i) => {
      if (/tool_calls:/.test(line) && !/^\s*(\*|\/\/)/.test(line)) hits.push(`${relOf(p)}:${i + 1}`)
    })
  }
  assert.equal(hits.length, 1, `thincoder-core 装配点恰 1（实得 ${hits.join(", ")}）`)
  assert.ok(hits[0].startsWith("thincoder-core/model-specs.mjs:"), "装配点 = model-specs.mjs（assistantToolCallMessage）")
  const specsSrc = readFileSync(join(ROOT, "thincoder-core/model-specs.mjs"), "utf8")
  assert.ok(specsSrc.includes("tool_calls: response.toolCalls.map((tc) => ({"), "装配对象字面形态")
  assert.ok(specsSrc.includes("...(tc.extra_content ? { extra_content: tc.extra_content } : {}),"), "单点携带签名字段")

  // ② 三调用站点各恰 1
  const callFiles = ["thincoder-core/agent/turn-loop.mjs", "thincoder-core/advisor/loop.mjs", "bench/lib/client.mjs"]
  for (const rel of callFiles) {
    const n = callCount(readFileSync(join(ROOT, rel), "utf8"))
    assert.equal(n, 1, `${rel} 调用点恰 1（实得 ${n}）`)
  }
  // ③ 产品树零旁路调用：调用文件集 = 上述三处
  const found = []
  for (const dir of ["thincoder-core", "thincoder-cli", "thincoder-vscode", "thincoder-desktop", "thincoder-render-core", "thincoder-server", "bench"]) {
    for (const p of walkMjs(join(ROOT, dir))) {
      const rel = relOf(p)
      if (isTestFile(rel)) continue
      if (callCount(readFileSync(p, "utf8")) > 0) found.push(rel)
    }
  }
  assert.deepEqual(found.sort(), [...callFiles].sort(), "零旁路装配（调用文件集逐字）")
  // ④ VSC 转口 = re-export 转口、零调用点
  const vscSpecs = readFileSync(join(ROOT, "thincoder-vscode/src/specs.mjs"), "utf8")
  assert.ok(vscSpecs.includes("providerSpec, assistantToolCallMessage } from"), "VSC 导入转口")
  assert.ok(vscSpecs.includes("export { providerSpec, assistantToolCallMessage }"), "VSC re-export 转口")
  let vscCalls = 0
  for (const p of walkMjs(join(ROOT, "thincoder-vscode/src"))) {
    vscCalls += callCount(readFileSync(p, "utf8"))
  }
  assert.equal(vscCalls, 0, "VSC 零调用点")
  // ⑤ config.mjs 名表（单点转口）
  const configSrc = readFileSync(join(ROOT, "thincoder-core/config.mjs"), "utf8")
  assert.ok(configSrc.includes("import { specForModel, providerSpec, specMatch, assistantToolCallMessage } from \"./model-specs.mjs\""), "config 名表 import")
  assert.ok(configSrc.includes("export { specForModel, providerSpec, specMatch, assistantToolCallMessage }"), "config 名表 re-export")
})

/* ── AC-10 桩面：有签名历史经 chat() ⇒ 请求体字段逐字在场 ── */
test("AC-10 桩面：有签名历史经 chat() ⇒ 请求体 messages[].tool_calls[].extra_content 逐字在场", async () => {
  const provider = { model: "harness-model", apiKey: "k", baseURL: "http://127.0.0.1:1" }
  const assist = SPECS.assistantToolCallMessage({ content: null, toolCalls: [{ id: "call_1", name: "glob", arguments: "{\"pattern\":\"x\"}", extra_content: { google: { thought_signature: "S10" } } }] }, {})
  const history = [
    { role: "user", content: "hi" },
    assist,
    { role: "tool", tool_call_id: "call_1", content: "ok" },
  ]
  const { calls } = await withFetch([sseResponse(frame({ delta: { content: "done" }, finish_reason: "stop" }) + DONE)], async (seen) => {
    await CORE.chat(provider, { messages: history })
    return { calls: seen }
  })
  const body = JSON.parse(calls[0].init.body)
  assert.equal(body.messages.length, 3, "消息条数零变（净化链保配对）")
  assert.deepEqual(body.messages[1].tool_calls[0].extra_content, { google: { thought_signature: "S10" } }, "请求体签名字段逐字在场")
  assert.deepEqual(Object.keys(body.messages[1].tool_calls[0]).sort(), ["extra_content", "function", "id", "type"], "回传项键集 = 四键（有签名面）")
})
