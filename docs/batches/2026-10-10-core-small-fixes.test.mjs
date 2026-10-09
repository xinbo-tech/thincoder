/**
 * 2026-10-10-core-small-fixes.test.mjs — 批内件（核面小修闭环 · 8 条：
 * #894 ∥ #929 ∥ #1067 ∥ #1068 ∥ #1082 ∥ #1087 ∥ #1114 ∥ #1135）。
 *
 * 名随批次档 `docs/batches/2026-10-10-core-small-fixes.md` · 住批次目录 · 不进仓套件（随批留存）。
 * 跑法（仓根）：`node --test docs/batches/2026-10-10-core-small-fixes.test.mjs`
 * 腿表 = 批档 §2.2 机检法列（逐腿标条目号）；红基线读数（改前）与绿读数 = 批档 §5。
 * 假 socket 桩（Duplex——`push` 一次 = 一个 `data` 事件）沿 `2026-10-08-proxy-chunked-frame.test.mjs` 先例。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { randomBytes } from "node:crypto"
import { mkdtempSync, readFileSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { Duplex } from "node:stream"
import { fileURLToPath, pathToFileURL } from "node:url"
import { brotliCompressSync, deflateSync, gzipSync } from "node:zlib"

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, "..", "..")
const CORE = pathToFileURL(join(ROOT, "thincoder-core") + "/").href
const read = (rel) => readFileSync(join(ROOT, rel), "utf8")

const tick = () => new Promise((r) => setImmediate(r))

/** 假 socket（Duplex 桩）：`push` 一次 = 一个 `data` 事件；`capture` 收请求字节（#1067 请求头腿）。 */
const fakeSocket = (capture) => new Duplex({
  read() {},
  write(c, _e, cb) { capture?.push(Buffer.from(c)); cb() },
  final(cb) { cb() },
})

/** 裸 socket 开响应：推头（+可选同包首段）⇒ 等 `streamHttpResponse` settle（bodyIdleMs=0 关看门狗）。 */
async function openRaw({ headers = {}, extra = Buffer.alloc(0), capture } = {}) {
  const { streamHttpResponse } = await import(CORE + "proxy-transport.mjs")
  const sock = fakeSocket(capture)
  const head = `HTTP/1.1 200 OK\r\n${Object.entries(headers).map(([k, v]) => `${k}: ${v}\r\n`).join("")}\r\n`
  const p = streamHttpResponse(sock, "http://t.test/x", {}, 5000, false, 0)
  sock.push(Buffer.concat([Buffer.from(head, "latin1"), extra]))
  return { sock, res: await p }
}

/** 帧序列构造：`<hex>\r\n<片>\r\n`… + `0\r\n\r\n`。 */
const frame = (pieces) => Buffer.concat([
  ...pieces.map((p) => Buffer.concat([Buffer.from(`${p.length.toString(16)}\r\n`), p, Buffer.from("\r\n")])),
  Buffer.from("0\r\n\r\n"),
])

const collect = async (body) => {
  const chunks = []
  for await (const c of body) chunks.push(c)
  return Buffer.concat(chunks)
}

/** 非 chunked 体的现实结体形 = 对端关闭（`Connection: close`）——收前先行。 */
const closeAndText = async (sock, res) => { await tick(); sock.destroy(); return res.text() }

const readCount = (stdout, key) => Number(new RegExp(`${key} (\\d+)`).exec(stdout ?? "")?.[1] ?? NaN)

/** 子进程 env：剥 `NODE_TEST_CONTEXT`——否则子孙 `node --test`「recursively … skipping running files」静默假绿（实测在案）。 */
const testEnv = () => { const e = { ...process.env }; delete e.NODE_TEST_CONTEXT; return e }

/** 复跑一个批内件（独立 node --test 子进程）。 */
const runTestFile = (rel) => spawnSync(process.execPath, ["--test", join(ROOT, rel)], { cwd: ROOT, encoding: "utf8", timeout: 120_000, env: testEnv() })

// ── L1 · #894：旧件字面断言随词表收正 ─────────────────────────────────────────

test("L1 #894：旧批内件复跑 ⇒ 5/5 绿（红基线 3 pass / 2 fail 在案——批档 §5）", () => {
  const r = runTestFile("docs/batches/2026-09-30-defect-fixes-cli.test.mjs")
  const pass = readCount(r.stdout, "pass")
  const fail = readCount(r.stdout, "fail")
  assert.equal(r.status, 0, `旧件应全绿（实际 pass=${pass} fail=${fail}）：\n${((r.stdout ?? "") + (r.stderr ?? "")).slice(-600)}`)
  assert.equal(pass, 5, "pass 读数 = 5")
  assert.equal(fail, 0, "fail 读数 = 0")
  console.log(`[读数] L1 #894：旧件复跑 pass=${pass} ∥ fail=${fail}`)
})

// ── L2 · #929：零码改复核（坐标读回 + 旧件复跑） ─────────────────────────────

test("L2 #929：缺席支坐标（提醒 + 留痕）∥ transport 归一三处 ∥ sse 零触 ∥ digest-accounting 复跑全绿", () => {
  const rs = read("thincoder-core/agent/run-stages.mjs")
  assert.ok(rs.includes("FINISH_MISSING_REMINDER"), "run-stages：缺席提醒常量在案（:28-30 面）")
  assert.ok(rs.includes('logEvent("ev:finish-missing"'), "run-stages：留痕调用在案（:52-55 面）")
  assert.ok(rs.includes("response.finishReason == null && !response.partial && !response.interrupted"), "缺席支判据 = clean end ∧ 非 partial/interrupted")
  for (const [f, lit] of [
    ["thincoder-core/provider/anthropic.mjs", "finishReason: result.finishReason ?? null"],
    ["thincoder-core/provider/google.mjs", "finishReason: result.finishReason ?? null"],
    ["thincoder-core/provider/responses.mjs", 'result.finishReason = "stop"'],
  ]) assert.ok(read(f).includes(lit), `${f}：finishReason 归一在案`)
  assert.ok(read("thincoder-core/provider/sse.mjs").includes("if (choice.finish_reason) result.finishReason = choice.finish_reason"), "sse.mjs 零触（原判据在案）")
  const r = runTestFile("docs/batches/2026-10-05-digest-accounting.test.mjs")
  assert.equal(r.status, 0, `digest-accounting 复跑应全绿：\n${((r.stdout ?? "") + (r.stderr ?? "")).slice(-600)}`)
  assert.ok(Number.isFinite(readCount(r.stdout, "pass")) && readCount(r.stdout, "pass") > 0, "子进程实跑（summary 在场——空输出 = 递归 skip 假绿）")
  console.log(`[读数] L2 #929：坐标命中 6/6 ∥ digest-accounting pass=${readCount(r.stdout, "pass")} fail=${readCount(r.stdout, "fail")}`)
})

// ── L3 · #1067：content-encoding 解压阶段 ────────────────────────────────────

test("L3a #1067：chunked + gzip（跨包切分）⇒ 明文（text() 直出原文）", async () => {
  const payload = JSON.stringify({ models: [{ name: "gemini-2.0-flash" }] })
  const framed = frame([gzipSync(Buffer.from(payload))])
  const cut = Math.floor(framed.length / 2)
  const { sock, res } = await openRaw({ headers: { "Transfer-Encoding": "chunked", "Content-Encoding": "gzip" }, extra: framed.subarray(0, cut) })
  sock.push(framed.subarray(cut))
  assert.deepEqual(JSON.parse(await res.text()), JSON.parse(payload), "解压后 JSON.parse 成功")
  sock.destroy()
})

test("L3b #1067：非 chunked + gzip ∥ x-gzip ∥ deflate ∥ br ⇒ 明文", async () => {
  for (const [ce, enc] of [["gzip", gzipSync], ["x-gzip", gzipSync], ["deflate", deflateSync], ["br", brotliCompressSync]]) {
    const { sock, res } = await openRaw({ headers: { "Content-Encoding": ce }, extra: enc(Buffer.from("plain-" + ce)) })
    assert.equal(await closeAndText(sock, res), "plain-" + ce, `CE=${ce}`)
  }
})

test("L3c #1067：identity ∥ 头缺席 ∥ 未知编码 ∥ 多 token 列表 ⇒ 逐字节透传", async () => {
  for (const [headers, text] of [
    [{}, "raw-no-ce"],
    [{ "Content-Encoding": "identity" }, "raw-identity"],
    [{ "Content-Encoding": "zstd" }, "raw-unknown"],
    [{ "Content-Encoding": "gzip, br" }, "raw-multi-token"],
  ]) {
    const buf = Buffer.from(text)
    const { sock, res } = await openRaw({ headers, extra: buf })
    await tick(); sock.destroy()
    assert.deepEqual(await collect(res.body), buf, JSON.stringify(headers))
  }
})

test("L3d #1067：空体 + CE 在场 ⇒ 体正常结束（零解压误报——chunked ∥ 非 chunked 两径）", async () => {
  const a = await openRaw({ headers: { "Content-Encoding": "gzip" } })
  assert.equal(await closeAndText(a.sock, a.res), "", "非 chunked 空体")
  const b = await openRaw({ headers: { "Transfer-Encoding": "chunked", "Content-Encoding": "gzip" }, extra: frame([]) })
  assert.equal(await b.res.text(), "", "chunked 空体（0 块即终）")
  b.sock.destroy()
})

test("L3e #1067：截断 gzip ⇒ body 以明错误终止（非透传——部分解码已发生）", async () => {
  const full = gzipSync(Buffer.from("x".repeat(2000)))
  const { sock, res } = await openRaw({ headers: { "Content-Encoding": "gzip" }, extra: full.subarray(0, 18) })
  await tick(); sock.destroy()
  await assert.rejects(res.text(), /decompression failed \(content-encoding: gzip\)/, "明错误（含编码名 + 根因）")
})

test("L3f #1067：请求头零改（不发 Accept-Encoding）", async () => {
  const captured = []
  const { sock, res } = await openRaw({ capture: captured })
  await closeAndText(sock, res)
  const req = Buffer.concat(captured).toString("latin1")
  assert.equal(/accept-encoding/i.test(req), false, "请求面零 Accept-Encoding")
  assert.match(req, /Connection: close/, "既有请求形零改")
})

// ── L4 · #1068：list-models 读错误面细分 ────────────────────────────────────

test("L4 #1068：text() 读失败 ⇒ 原错误直抛；真非 JSON ⇒ 原文案", async () => {
  const { listModels } = await import(CORE + "provider/list-models.mjs")
  const provider = { name: "t", baseURL: "https://t.test/v1", apiKey: "k" }
  const bak = globalThis.fetch
  try {
    globalThis.fetch = async () => ({ ok: true, text: async () => { throw new Error("stream torn down") } })
    await assert.rejects(listModels(provider), /stream torn down/, "读失败 ⇒ 原错误直抛（不吞成 non-JSON）")
    globalThis.fetch = async () => ({ ok: true, text: async () => "<html>gateway</html>" })
    await assert.rejects(listModels(provider), /GET \/models failed: non-JSON response/, "真非 JSON ⇒ 原文案零改")
  } finally { globalThis.fetch = bak }
  console.log("[读数] L4 #1068：读失败原错直抛 ∥ 真非 JSON 原文案 —— 全中")
})

// ── L5 · #1082：injectProxy 归一化收口 ──────────────────────────────────────

test("L5 #1082：`\"\"` ∥ 空对象 ∥ 非法型 ⇒ 零注入（env 在案亦然）；正例三形照旧注入", async () => {
  const { injectProxy } = await import(CORE + "proxy.mjs")
  const one = () => [{ name: "p", proxy: true }]
  const bak = process.env.HTTPS_PROXY
  process.env.HTTPS_PROXY = "http://env-proxy:1"
  try {
    for (const bad of ["", {}, { uri: "" }, { url: "" }, 123, [], true]) {
      const ps = one()
      injectProxy(ps, { proxy: bad })
      assert.equal(ps[0].proxyUri, undefined, `非法/空形（${JSON.stringify(bad)}）⇒ 零注入（env 在案亦然）`)
    }
    const good = [
      [{ proxy: "http://p:1" }, "http://p:1", "裸串"],
      [{ proxy: { uri: "http://p:2" } }, "http://p:2", "uri"],
      [{ proxy: { url: "http://p:3" } }, "http://p:3", "url"],
    ]
    for (const [cfg, uri, label] of good) {
      const ps = one()
      injectProxy(ps, cfg)
      assert.equal(ps[0].proxyUri, uri, `正例（${label}）⇒ 照旧注入`)
    }
    const ps = one()
    injectProxy(ps, {})
    assert.equal(ps[0].proxyUri, undefined, "字段缺席 ⇒ env 回流零注入（D-PX4 回归）")
  } finally {
    if (bak === undefined) delete process.env.HTTPS_PROXY
    else process.env.HTTPS_PROXY = bak
  }
  console.log("[读数] L5 #1082：非法/空形 7 态零注入 ∥ 正例 3 形注入 ∥ env 零注入 —— 全中")
})

// ── L6 · #1087：chunked 径背压传播 + 停止门 ─────────────────────────────────

test("L6a #1087：帧序列 > 高水位 ⇒ sock 暂停（isPaused 真）；读空 ⇒ 恢复 + 载荷逐字节等值", async () => {
  const big = Buffer.alloc(40_000, 0x61)
  const f = frame([big])
  const { sock, res } = await openRaw({ headers: { "Transfer-Encoding": "chunked" } })
  sock.push(f.subarray(0, 20_000)); await tick()
  assert.equal(sock.isPaused(), true, "背压 ⇒ 上游源暂停（旧码：false）")
  sock.push(f.subarray(20_000)); await tick()
  const got = await collect(res.body)
  assert.ok(got.length === big.length && got.equals(big), "载荷逐字节等值")
  assert.equal(sock.isPaused(), false, "排空 ⇒ 恢复")
  sock.destroy()
})

test("L6b #1087：CE 链（解压器 = 暂停级）同判——暂停 ∥ 恢复 ∥ 载荷逐字节等值", async () => {
  const big = randomBytes(300_000) // 不可压 ⇒ 压缩输入超水位（暂停级 = 解压器可写侧）
  const f = frame([gzipSync(big)])
  const cut = Math.floor(f.length / 2)
  const { sock, res } = await openRaw({ headers: { "Transfer-Encoding": "chunked", "Content-Encoding": "gzip" } })
  sock.push(f.subarray(0, cut)); await tick()
  assert.equal(sock.isPaused(), true, "带 CE：暂停级 = 解压器（其可写侧涨满 ⇒ 源暂停）")
  sock.push(f.subarray(cut))
  const got = await collect(res.body)
  assert.ok(got.length === big.length && got.equals(big), `解压载荷逐字节等值（len=${got.length}）`)
  assert.equal(sock.isPaused(), false, "排空 ⇒ 恢复")
  sock.destroy()
})

test("L6c #1087：body 终止（暂停态）⇒ 源恢复 + 销毁（停止门——评审 F3 悬挂口闭合）", async () => {
  const { destroyBody } = await import(CORE + "stream-destroy.mjs")
  const f = frame([Buffer.alloc(40_000, 0x62)])
  const { sock, res } = await openRaw({ headers: { "Transfer-Encoding": "chunked" } })
  sock.push(f.subarray(0, 20_000)); await tick()
  assert.equal(sock.isPaused(), true, "先决：暂停态")
  destroyBody(res.body, new Error("consumer gone"))
  await tick(); await tick()
  assert.equal(sock.destroyed, true, "停止门：被暂停源 resume + destroy（旧码：不销毁）")
})

// ── L7 · #1114：13 处 bin 入口判据收正（KD-SV-53 单源） ─────────────────────

const GUARD_FILES = [
  "scripts/api-contract.mjs",
  "scripts/dev-link.mjs",
  "scripts/doc-check.mjs",
  "thincoder-cli/scripts/doc-impact.mjs",
  "thincoder-server/deploy/backup.mjs",
  "thincoder-server/deploy/converge.mjs",
  "thincoder-server/src/ops/cli.mjs",
  "bench/preflight.mjs",
  "bench/probe.mjs",
  "bench/run.mjs",
  "bench/toolcall.mjs",
  "thincoder-desktop/scripts/make-icon.mjs",
  "thincoder-desktop/scripts/materialize-deps.mjs",
]

test("L7a #1114：13 处字面锁（`realpathSync(process.argv[1])` ×13；未解析变体零残留）", () => {
  let hits = 0
  for (const f of GUARD_FILES) {
    const src = read(f)
    assert.ok(src.includes("realpathSync(process.argv[1])"), `${f}：判据含 realpathSync(process.argv[1])`)
    assert.equal(/pathToFileURL\(\s*(?:resolve\()?process\.argv\[1\]/.test(src), false, `${f}：未解析变体零残留`)
    hits += (src.match(/realpathSync\(process\.argv\[1\]\)/g) ?? []).length
  }
  assert.equal(hits, 13, "13 处逐处恰一")
  assert.equal(GUARD_FILES.length, 13, "清单 13 行")
  console.log("[读数] L7a #1114：13/13 处 realpathSync 判据在案 ∥ 未解析变体 0 残留")
})

test("L7b #1114：代表档 symlink 跑 ≡ 直跑（stdout ∥ stderr ∥ 退码同形）", (t) => {
  const REP = join(ROOT, "thincoder-cli", "scripts", "doc-impact.mjs")
  const box = mkdtempSync(join(tmpdir(), "csf-guard-"))
  const link = join(box, "doc-impact-link.mjs")
  let fileOk = false
  let junc = null
  try { symlinkSync(REP, link, "file"); fileOk = true } catch { /**/ }
  if (!fileOk) { try { junc = join(box, "scripts-junc"); symlinkSync(join(ROOT, "thincoder-cli", "scripts"), junc, "junction") } catch { junc = null } }
  if (!fileOk && junc === null) {
    try { rmSync(box, { recursive: true, force: true }) } catch { /**/ }
    return t.skip("能力前提缺失——文件符号链接 ∥ 目录连接均不可建")
  }
  const run = (p) => spawnSync(process.execPath, [p], { cwd: ROOT, encoding: "utf8", timeout: 30_000 })
  try {
    const direct = run(REP)
    const viaLink = run(junc !== null ? join(junc, "doc-impact.mjs") : link)
    assert.equal(viaLink.status, direct.status, "经链接退码同形")
    assert.equal(viaLink.stdout, direct.stdout, "经链接 stdout 同形")
    assert.equal(viaLink.stderr, direct.stderr, "经链接 stderr 同形")
    assert.equal(direct.status, 2, "代表档无参 = 用法错退出 2（判据真 ⇒ main 执行；旧码红：退 0 零输出）")
    console.log(`[读数] L7b #1114：symlink ≡ 直跑（status=${direct.status} ∥ stdout/stderr 同形）`)
  } finally {
    for (const p of [link, junc]) { if (p !== null) { try { unlinkSync(p) } catch { /**/ } } }
    try { rmSync(box, { recursive: true, force: true }) } catch { /**/ }
  }
})

test("L7c #1114：不可解析 ⇒ 显式抛（非静默退 0——KD-SV-53 同形）", (t) => {
  const box = mkdtempSync(join(tmpdir(), "csf-guard2-"))
  const drv = join(box, "drv.mjs")
  writeFileSync(drv, [
    `process.argv[1] = ${JSON.stringify(join(box, "definitely-missing", "nope.mjs"))}`,
    `await import(${JSON.stringify(pathToFileURL(join(ROOT, "thincoder-server", "deploy", "converge.mjs")).href)})`,
    "",
  ].join("\n"))
  const r = spawnSync(process.execPath, [drv], { encoding: "utf8", timeout: 30_000 })
  try {
    assert.notEqual(r.status, 0, "静默退 0 = 缺陷形态（不可解析被吞）")
    assert.ok(String(r.stderr).includes("ENOENT"), `报错可见（显式，不静默）：${String(r.stderr).slice(0, 200)}`)
  } finally { try { rmSync(box, { recursive: true, force: true }) } catch { /**/ } }
})

// ── L8 · #1135：sessionReading 槽命中补 hasKey 门 ───────────────────────────

test("L8 #1135：槽渠道无 key ⇒ fallback 读数；持 key 三态零变", async () => {
  const { sessionReading } = await import(CORE + "session-lifecycle.mjs")
  const { historyPercent } = await import(CORE + "token-window.mjs")
  const history = [{ role: "user", content: "u".repeat(20000) }, { role: "assistant", content: "a".repeat(20000) }]
  const keyed = { name: "p", baseURL: "https://p.test/v1", apiKey: "k" }
  const keyless = { name: "p", baseURL: "https://p.test/v1" }
  const fallback = { name: "f", baseURL: "https://f.test/v1", apiKey: "kf", model: "f-model" }
  const at = (model) => historyPercent(history, { ...keyed, model })
  const v4 = at("deepseek-v4-pro")
  assert.notEqual(v4, at(null), "夹具判别力（v4-pro 1M ≠ 缺省）")
  assert.notEqual(historyPercent(history, fallback), v4, "fallback 读数与持 key 读数可辨")
  const noKeyRead = sessionReading({ activeProvider: "p", activeModel: "deepseek-v4-pro", history }, { providers: [keyless], fallback, defaultModel: null })
  assert.equal(noKeyRead, historyPercent(history, fallback), "无 key ⇒ fallback（旧码红：命中 entry ⇒ 读数 = v4）")
  assert.equal(sessionReading({ activeProvider: "p", activeModel: "deepseek-v4-pro", history }, { providers: [keyed], fallback, defaultModel: null }), v4, "持 key · 槽模型优先")
  assert.equal(sessionReading({ activeProvider: "p", activeModel: null, history }, { providers: [keyed], fallback, defaultModel: "p:deepseek-v4-pro" }), v4, "持 key · dm 属渠段")
  assert.equal(sessionReading({ activeProvider: "p", activeModel: null, history }, { providers: [keyed], fallback, defaultModel: "q:x" }), at(null), "持 key · 两档皆无 ⇒ null 模型")
})
