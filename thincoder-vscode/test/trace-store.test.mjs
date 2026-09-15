/**
 * trace-store.test.mjs — 轨迹存档测试（实现单源 = `@thincoder/core/traces/trace-store.mjs`——
 * 验收 AC1/AC3/AC4/AC5 + F6 边沿——CLI test/trace-bounds.test.mjs 语义参照——NODE_TEST_CONTEXT
 * 写门 + THINCODER_TRACES_DIR 隔离临时目录，同 CLI traces 测试惯例）。
 *
 * S2 W3（CORE-UNIFICATION §2.6.3）改判登记：实现单源归核（VSC 副本已删）——
 * 容量 / 清理策略随 §2.5 #116 / A21 裁决（取 VSC 侧：完整落盘 + 每写 prune）；
 * 行为面用例逐条保留（承 CLI U3 同法）。
 *
 * 覆盖：写门（测试进程默认不写真实轨迹目录）/D-TR1 字段集（含 error 路径 D-TR5）/
 * D-TR2 脱敏（黑名单字段 + 密钥形态——文件全文无原始密钥）/D-TR3 fire-and-forget
 * 不阻塞 + 目录 seq（跨日不撞）/D-TR10 清理 + 保留期边界（超期清/期内留 + 非 .jsonl
 * 不碰 + 空日目录删）/F6 禁用路径零落盘 + 写失败静默降级 + per-caller logCtx 形状
 * （主回合/子代理/advisor/compress/distill——各 caller 元数据落档）/AC1 chat() 出口
 * 采集真实接线（本地 SSE fake——成功路径 + 400 错误路径 D-TR5）。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync, readFileSync, readdirSync, utimesSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createHash } from "node:crypto"
import http from "node:http"
import {
  recordChatTrace, cleanupTraces, localDateStr,
  traceSessionKey, nextTraceSeq, tracesDirFor,
} from "@thincoder/core/traces/trace-store.mjs"
import { chat } from "../src/provider.mjs"
import { _resetConfigPathForTest, _setConfigPathForTest } from "@thincoder/core/config.mjs"

// ─── 环境隔离 helpers ─────────────────────────────

let _prevTracesDir
let _cfgTmp

before(() => {
  // 隔离 config（核 loadConfig 读它——per-write prune 的 retentionHours 确定化）
  _cfgTmp = mkdtempSync(join(tmpdir(), "tc-trace-cfg-"))
  writeFileSync(join(_cfgTmp, "config.json"), JSON.stringify({ traces: { enabled: false, retentionHours: 24 } }))
  _setConfigPathForTest(join(_cfgTmp, "config.json"))
  _prevTracesDir = process.env.THINCODER_TRACES_DIR
})

after(() => {
  if (_prevTracesDir === undefined) delete process.env.THINCODER_TRACES_DIR
  else process.env.THINCODER_TRACES_DIR = _prevTracesDir
  _resetConfigPathForTest()
  try { rmSync(_cfgTmp, { recursive: true, force: true }) } catch { /* ignore */ }
})

/** 每个写盘用例一个全新临时根（seq/目录断言互不串扰）；返回清理函数。 */
function freshRoot() {
  const root = mkdtempSync(join(tmpdir(), "tc-trace-"))
  process.env.THINCODER_TRACES_DIR = root
  return () => { try { rmSync(root, { recursive: true, force: true }) } catch { /* ignore */ } }
}

/** 列全量轨迹文件（根下日期目录内 .jsonl——YYYY-MM-DD 分日组织）。 */
function listTraceFiles(root) {
  const out = []
  let days = []
  try { days = readdirSync(root) } catch { return out }
  for (const d of days) {
    const p = join(root, d)
    let names = []
    try { names = readdirSync(p) } catch { continue }
    for (const n of names) if (n.endsWith(".jsonl")) out.push(join(p, n))
  }
  return out.sort()
}

/** 读回最新一条轨迹文件 → JSON 记录对象（跨日目录取末位）。 */
function readSingleRecord(root) {
  const files = listTraceFiles(root)
  assert.ok(files.length >= 1, `expected ≥1 trace file under ${root}, got ${files.join(",")}`)
  const raw = readFileSync(files.at(-1), "utf8").trim()
  const lines = raw.split("\n")
  assert.equal(lines.length, 1, "JSONL: 单行一个记录")
  return { record: JSON.parse(lines[0]), name: files.at(-1) }
}

function sha1hex(s) {
  return createHash("sha1").update(s).digest("hex")
}

const P = { name: "test-provider", model: "test-model" }
const CWD = process.cwd().replace(/^([a-z]):/, (_, d) => d.toUpperCase() + ":")
const cwdHash = sha1hex(CWD)

// ─── 1. 写门：测试进程（NODE_TEST_CONTEXT）无 THINCODER_TRACES_DIR → 不写 ───

test("写门（D-TR3 测试隔离）：NODE_TEST_CONTEXT 下无 THINCODER_TRACES_DIR 不落盘不碰盘", () => {
  const prev = process.env.THINCODER_TRACES_DIR
  delete process.env.THINCODER_TRACES_DIR
  try {
    const out = recordChatTrace(P, { messages: [], logCtx: { traces: true } }, { content: "x" }, null)
    assert.equal(out, undefined, "写门关闭时应直接返回（无 promise——不启动异步写盘）")
  } finally {
    if (prev === undefined) delete process.env.THINCODER_TRACES_DIR
    else process.env.THINCODER_TRACES_DIR = prev
  }
})

// ─── 2. D-TR1 字段集（成功路径 + D-TR5 错误路径）───

test("D-TR1 字段集：成功路径逐字段落档（JSONL 单行 + 命名 sessionKey-seq）", async () => {
  const done = freshRoot()
  try {
    const result = {
      content: "hello world", reasoning: "think step", toolCalls: [{ id: "t1", name: "read", arguments: "{}" }],
      usage: { total_tokens: 42 }, finishReason: "stop",
    }
    const opts = {
      messages: [{ role: "user", content: "hi" }, { role: "assistant", content: "prev" }],
      logCtx: {
        stage: "turn", turn: 2, role: null, depth: 0, kind: "turn",
        session: "sess-1", cwd: CWD, traces: true,
      },
    }
    await recordChatTrace(P, opts, result, null)
    const { record, name } = readSingleRecord(process.env.THINCODER_TRACES_DIR)
    assert.match(name.split(/[\\/]/).pop(), new RegExp(`^${traceSessionKey(CWD)}-\\d+\\.jsonl$`))
    assert.equal(typeof record.ts, "string")
    assert.equal(record.session, "sess-1")
    assert.equal(record.cwdHash, cwdHash, "cwdHash = 全量 sha1(normalizeCwd)")
    assert.equal(record.role, null)
    assert.equal(record.depth, 0)
    assert.equal(record.turn, 2)
    assert.equal(record.provider, "test-provider")
    assert.equal(record.model, "test-model")
    assert.equal(record.stage, "turn")
    assert.equal(record.kind, "turn")
    assert.equal(record.isContinuation, false)
    assert.equal(record.messages[0].content, "hi")
    assert.equal(record.content, "hello world")
    assert.equal(record.reasoning, "think step")
    assert.equal(record.toolCalls[0].name, "read")
    assert.equal(record.usage.total_tokens, 42)
    assert.equal(record.finishReason, "stop")
    assert.equal("error" in record, false, "成功路径无 error 字段")
    // 续写链标记（D-TR1）：同字段集下 isContinuation:true 透传（provider.mjs 续写递归传出）
    await recordChatTrace(P, {
      messages: [{ role: "user", content: "cont" }],
      logCtx: { cwd: CWD, traces: true, isContinuation: true, stage: "turn", kind: "turn" },
    }, { content: "segment" }, null)
    const cont = readSingleRecord(process.env.THINCODER_TRACES_DIR)
    assert.equal(cont.record.isContinuation, true, "续写链记录标记 isContinuation:true")
  } finally { done() }
})

test("D-TR5 错误路径：error（errText+类别）+ finishReason null 落档", async () => {
  const done = freshRoot()
  try {
    await recordChatTrace(P, { messages: [{ role: "user", content: "q" }], logCtx: { cwd: CWD, traces: true } }, null, new Error("boom failed"))
    const { record } = readSingleRecord(process.env.THINCODER_TRACES_DIR)
    assert.equal(record.content, null)
    assert.equal(record.finishReason, null)
    assert.match(record.error.err, /boom failed/)
    assert.equal(record.error.kind, "error")
  } finally { done() }
})

// ─── 3. D-TR2 脱敏：字段名黑名单遮蔽 + 密钥形态截断 + 递归（文件全文无密钥）───

test("D-TR2 脱敏：apiKey 字段遮蔽、Bearer/key= 形态截断、嵌套递归——原文不出现在文件", async () => {
  const done = freshRoot()
  try {
    const secret1 = "sk-abcdef1234567890"
    const secret2 = "Bearer superSECRETtoken123"
    const secret3 = "token=xyz987654321"
    const opts = {
      messages: [
        { role: "user", content: `please use ${secret2}`, apiKey: secret1 },
        { role: "assistant", content: [{ type: "text", text: `cfg token=abc123def456` }], extra: { authorization: secret2 } },
      ],
      logCtx: { cwd: CWD, traces: true },
    }
    const result = { content: `key=${secret3} done`, toolCalls: [{ id: "1", name: "x", arguments: JSON.stringify({ proxy: secret1 }) }] }
    await recordChatTrace(P, opts, result, null)
    const { record } = readSingleRecord(process.env.THINCODER_TRACES_DIR)
    assert.equal(record.messages[0].apiKey, "[REDACTED]", "黑名单字段 → 整个字段遮蔽")
    assert.equal(record.messages[1].extra.authorization, "[REDACTED]", "嵌套对象黑名单字段 → 遮蔽")
    const raw = JSON.stringify(record)
    for (const s of [secret1, secret2, secret3]) assert.equal(raw.includes(s), false, `秘密原文不得出现: ${s}`)
    assert.match(record.messages[0].content, /please use .*redacted/, "Bearer 形态截断带标记")
    assert.match(record.content, /\[REDACTED\]|redacted/, "key= 形态截断带标记")
  } finally { done() }
})

// ─── 4. D-TR3 fire-and-forget：recordChatTrace 同步返回，写盘自行完成 ───

test("D-TR3 fire-and-forget：不 await 也落盘（chat() 出口零阻塞语义）", async () => {
  const done = freshRoot()
  try {
    const out = recordChatTrace(P, { messages: [{ role: "user", content: "x" }], logCtx: { cwd: CWD, traces: true } }, { content: "async done" }, null)
    assert.ok(out instanceof Promise, "写盘 promise 返回——调用方（chat）不消费即 fire-and-forget")
    // 不 await out——轮询等文件出现（确定性——固定睡窗在重负载 CI 下可 flaky）
    const rec = await waitForTraceFile(process.env.THINCODER_TRACES_DIR, (r) => r.content === "async done")
    assert.equal(rec.content, "async done")
    await out // 收尾
  } finally { done() }
})

// ─── 5. D-TR3 目录/seq：分日目录 + seq = 磁盘 max+1（跨进程不覆写）───

test("D-TR3 目录 seq：nextTraceSeq = max(磁盘已有, 预留)+1；跨日目录独立", () => {
  const done = freshRoot()
  try {
    const day = "2026-01-01"
    const dir = tracesDirFor(day)
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, `${traceSessionKey(CWD)}-3.jsonl`), "{}", "utf8")
    writeFileSync(join(dir, `${traceSessionKey(CWD)}-5.jsonl`), "{}", "utf8")
    assert.equal(nextTraceSeq(day), 6, "seq = 当日最大已有 + 1（不覆写既有轨迹）")
    assert.equal(nextTraceSeq(day), 7, "进程内预留表续号")
    const other = "2026-01-02"
    assert.equal(nextTraceSeq(other), 1, "跨日目录独立 seq")
    // 记录按本地日期落当日目录（localDateStr——本地时区）
    assert.equal(localDateStr(new Date(2026, 0, 1, 0, 30)), "2026-01-01")
  } finally { done() }
})

// ─── 6. D-TR10 清理 + 保留期边界（AC4）───

test("D-TR10 清理：超期 .jsonl 删/期内留/非 jsonl 不碰/空日目录删", async () => {
  const root = mkdtempSync(join(tmpdir(), "tc-trace-clean-"))
  try {
    const d1 = join(root, "2026-01-01")
    const d2 = join(root, "2026-01-02")
    mkdirSync(d1, { recursive: true })
    mkdirSync(d2, { recursive: true })
    const oldFile = join(d1, "k-1.jsonl")
    const newFile = join(d1, "k-2.jsonl")
    const noteFile = join(d1, "notes.txt")
    const oldFile2 = join(d2, "k-3.jsonl")
    writeFileSync(oldFile, "{}", "utf8")
    writeFileSync(newFile, "{}", "utf8")
    writeFileSync(noteFile, "keep", "utf8")
    writeFileSync(oldFile2, "{}", "utf8")
    const now = Date.now()
    // Windows utimesSync 需 Date 对象（数字时间戳 EINVAL）——探测实证
    const d = (ms) => new Date(ms)
    utimesSync(oldFile, d(now - 2 * 3_600_000), d(now - 2 * 3_600_000))   // 超 1h 保留期 → 删
    utimesSync(newFile, d(now - 10 * 60_000), d(now - 10 * 60_000))        // 期内 → 留
    utimesSync(oldFile2, d(now - 3 * 3_600_000), d(now - 3 * 3_600_000))   // 超期 → 删
    utimesSync(noteFile, d(now - 3 * 3_600_000), d(now - 3 * 3_600_000))   // 非 .jsonl 超期 → 不碰

    const removed = await cleanupTraces({ dir: root, retentionHours: 1 })
    assert.equal(removed, 2)
    assert.equal(existsSync(oldFile), false, "超期文件删除")
    assert.equal(existsSync(oldFile2), false, "超期文件删除（另一日目录）")
    assert.equal(existsSync(newFile), true, "期内文件保留")
    assert.equal(existsSync(noteFile), true, "非 .jsonl 不碰")
    assert.equal(existsSync(d2), false, "空日期目录删除")
    assert.equal(existsSync(d1), true, "仍有期内文件的目录保留")
    assert.equal(await cleanupTraces({ dir: root, retentionHours: 1 }), 0, "幂等：无事可做返回 0")
  } finally { try { rmSync(root, { recursive: true, force: true }) } catch { /* ignore */ } }
})

// ─── 7. F6 禁用路径：logCtx.traces=false → 不落盘不报错（零开销）───

test("F6 禁用路径：logCtx.traces=false → 无文件无目录（不报错）", async () => {
  const done = freshRoot()
  try {
    const out = recordChatTrace(P, { messages: [{ role: "user", content: "secret-ish" }], logCtx: { cwd: CWD, traces: false } }, { content: "x" }, null)
    assert.equal(out, undefined, "禁用 → 直接返回（不启动异步写盘/prune）")
    assert.equal(existsSync(process.env.THINCODER_TRACES_DIR) && readdirSync(process.env.THINCODER_TRACES_DIR).length, 0, "根目录零写入")
  } finally { done() }
})

// ─── 8. F6 写失败静默降级：根被文件占位 → mkdir/写失败吞掉不抛 ───

test("F6 写失败静默：落盘路径不可写 → promise resolve 不抛（不阻塞 chat() 返回）", async () => {
  const root = mkdtempSync(join(tmpdir(), "tc-trace-wfail-"))
  const blocker = join(root, "blocked")
  writeFileSync(blocker, "I am a file, not a dir", "utf8") // tracesRoot 指向一个文件 → mkdir 必败
  process.env.THINCODER_TRACES_DIR = blocker
  try {
    const out = recordChatTrace(P, { messages: [], logCtx: { cwd: CWD, traces: true } }, { content: "x" }, null)
    assert.ok(out instanceof Promise)
    await out // 必须正常 resolve——写失败静默降级
  } finally {
    try { rmSync(root, { recursive: true, force: true }) } catch { /* ignore */ }
    delete process.env.THINCODER_TRACES_DIR
    const done = freshRoot(); done() // 复位 env（避免影响后续用例）
  }
})

// ─── 9. per-caller logCtx 形状：主回合/子代理/advisor/compress/distill 元数据落档 ───

test("per-caller 元数据路径：主回合/子代理/advisor/compress/distill logCtx 形状逐域落档", async () => {
  const done = freshRoot()
  try {
    const shapes = [
      { name: "主回合", logCtx: { stage: "turn", turn: 1, auto: false, role: null, depth: 0, kind: "turn", session: "sess-top", cwd: CWD, traces: true } },
      { name: "子代理", logCtx: { stage: "turn", turn: 1, auto: false, role: "eng-coder", depth: 1, kind: "subagent", session: null, cwd: CWD, traces: true } },
      { name: "advisor", logCtx: { stage: "advisor", role: "eng-coder", kind: "advisor", session: "sess-top", cwd: CWD, traces: true } },
      { name: "compress", logCtx: { stage: "compress", kind: "compress", role: "eng-coder", depth: 1, session: "sess-top", cwd: CWD, traces: true } },
      { name: "distill", logCtx: { stage: "distill", kind: "distill", role: null, depth: 0, session: "sess-top", cwd: CWD, traces: true } },
    ]
    for (const { logCtx } of shapes) {
      await recordChatTrace(P, { messages: [{ role: "user", content: "m" }], logCtx }, { content: "r" }, null)
    }
    const root = process.env.THINCODER_TRACES_DIR
    const files = listTraceFiles(root)
    assert.equal(files.length, shapes.length, "每域一条记录（同目录 seq 递增 = 写入顺序）")
    files.forEach((f, i) => {
      const { name, logCtx } = shapes[i]
      const record = JSON.parse(readFileSync(f, "utf8"))
      assert.equal(record.stage, logCtx.stage, `${name}: stage`)
      assert.equal(record.kind, logCtx.kind, `${name}: kind`)
      assert.equal(record.role, logCtx.role ?? null, `${name}: role`)
      assert.equal(record.depth, logCtx.depth ?? null, `${name}: depth`)
      assert.equal(record.session, logCtx.session ?? null, `${name}: session`)
      assert.equal(record.cwdHash, cwdHash, `${name}: cwd`)
      if (logCtx.turn != null) assert.equal(record.turn, logCtx.turn, `${name}: turn`)
    })
  } finally { done() }
})

// ─── 10. AC1 chat() 出口采集真实接线（本地 SSE fake：成功 + 400 错误）───

/** 本地 SSE fake server：route 1 = 成功流；route 2 = 400 错误。返回 { url, close }。 */
function sseServer() {
  const server = http.createServer((req, res) => {
    const u = new URL(req.url, "http://x")
    if (u.pathname === "/ok") {
      res.writeHead(200, { "content-type": "text/event-stream" })
      res.write('data: {"choices":[{"delta":{"content":"wire-hi"},"finish_reason":null}]}\n\n')
      res.write('data: {"choices":[{"delta":{},"finish_reason":"stop"}]}\n\n')
      res.write("data: [DONE]\n\n")
      res.end()
      return
    }
    if (u.pathname === "/bad") {
      res.writeHead(400, { "content-type": "application/json" })
      res.end(JSON.stringify({ error: { message: "wire boom 400" } }))
      return
    }
    res.writeHead(404).end()
  })
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      resolve({ url: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((r) => server.close(r)) })
    })
  })
}

async function waitForTraceFile(root, pred, tries = 50) {
  for (let i = 0; i < tries; i++) {
    try {
      for (const f of listTraceFiles(root)) {
        const record = JSON.parse(readFileSync(f, "utf8"))
        if (pred(record)) return record
      }
    } catch { /* 目录尚未建 */ }
    await new Promise((r) => setTimeout(r, 20))
  }
  assert.fail(`no matching trace file within ${tries * 20}ms in ${root}`)
}

test("AC1 chat() 出口采集：真实 chat() 成功/失败都经单点落盘（fire-and-forget 不 await）", async () => {
  const done = freshRoot()
  const srv = await sseServer()
  const provider = { name: "wire-provider", model: "wire-model", apiKey: "test-key", baseURL: srv.url, format: "openai", chatPath: "/ok" }
  try {
    // 成功路径
    const r = await chat(provider, {
      messages: [{ role: "user", content: "hi" }],
      logCtx: { stage: "turn", turn: 1, kind: "turn", session: "wire-sess", cwd: CWD, traces: true },
    })
    assert.equal(r.content, "wire-hi")
    const ok = await waitForTraceFile(process.env.THINCODER_TRACES_DIR, (rec) => rec.content === "wire-hi")
    assert.equal(ok.stage, "turn")
    assert.equal(ok.kind, "turn")
    assert.equal(ok.session, "wire-sess")
    assert.equal(ok.provider, "wire-provider")
    assert.equal(ok.model, "wire-model")
    assert.equal(ok.finishReason, "stop")
    assert.equal(ok.cwdHash, cwdHash)

    // 错误路径（D-TR5——400 非重试立即抛）
    await assert.rejects(
      chat({ ...provider, chatPath: "/bad" }, {
        messages: [{ role: "user", content: "hi" }],
        logCtx: { stage: "advisor", kind: "advisor", session: "wire-sess", cwd: CWD, traces: true },
      }),
      /400/,
    )
    const err = await waitForTraceFile(process.env.THINCODER_TRACES_DIR, (rec) => rec.error && rec.kind === "advisor")
    assert.equal(err.stage, "advisor")
    assert.equal(err.finishReason, null)
    assert.equal(err.error.kind, "error")
    assert.match(err.error.err, /wire boom 400/)
  } finally {
    await srv.close()
    done()
  }
})
