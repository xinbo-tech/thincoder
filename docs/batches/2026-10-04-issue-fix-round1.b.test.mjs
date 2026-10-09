/**
 * 2026-10-04-issue-fix-round1.b.test.mjs — 批内件（issue 修复批·一 · 组 B：记忆与配置面）
 *
 * 单测面（批档 §2.6-B + §2.3 验收判据；平 node · 零网络——fetch 桩 ∕ 沙箱库 ∕ 临时 config）：
 *   #859 embedding 毒行清洗 + 隔离（D-MEM31）
 *     T-B1 含孤立代理批 ⇒ 请求体逐条清洗、嵌入成功
 *     T-B2 清洗后仍 400 的毒行 ⇒ 置 null + skipped；三面消费（docs ∥ code ∥ entries）跳过不写 + 一行 warn
 *     T-B3 非 400（401）整抛（隔离只对 400 类）；query 面（单条 embed）直抛零变
 *     T-B4 毒行不阻下批（第二轮取到新行）
 *   #860 auto-think 思考守卫 + 关思考小预算 + 失败可见（D-AL26）
 *     T-B5 可关 ⇒ 族别 off 形 + max_tokens 32 + 无外溢档（effort 族 ∥ type 族两腿）
 *     T-B6 不可关（thinkAlwaysOn ∥ 枚举无 none）⇒ 零分类调用 + 一次 warn（按 model 去重）
 *     T-B7 调用失败 ⇒ 一次 warn + null 回退；同签名不再刷
 *     T-B8 EFFORT_MAP 映射逐字零回归
 *   #861 subagentModel 三层防线（AGENT-LOOP-SUBAGENT.md §6.7.1）
 *     T-B9 对象形态 config ⇒ 加载期不采纳（= null）+ 警告一条；spawn 链零 TypeError
 *     T-B10 subagentModels 非法值键 ⇒ 剔除 + 警告；其余键生效（非对象形态 ⇒ {} 同款）
 *     T-B11 对象 ∕ 数组 ∕ 数字入 resolveChildProvider ⇒ 明确 Error（非 TypeError）
 *     T-B12 合法链（default ∕ p:m ∕ 裸模型名；裸渠名 ⇒ 拒——2026-10-09 清除批）
 *     T-B13 VSC 端壳同拍清洗（结构腿：核内单源函数 + raw 读点消费 + 同一物理模块）
 *
 * 跑法（仓根 thincoder/）：`node --test docs/batches/2026-10-04-issue-fix-round1.b.test.mjs`
 * 数据面纪律：只用沙箱库 ∕ 临时 config —— 真库（~/.thincoder/memory.db）与真 config 零触碰。
 * 留存口径：随批留存 · 不进仓套件（核测试树现行无 .test.mjs 收集面）。
 */
import test, { after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, "..", "..")
const rel = (p) => pathToFileURL(join(ROOT, p)).href
const fresh = (p, tag) => import(rel(p) + `?fresh=${tag}`)

const EMBED = await import(rel("thincoder-core/embedding.mjs"))
const CFG_IO = await import(rel("thincoder-core/config-io.mjs"))
const AUTOTHINK = await import(rel("thincoder-core/auto-think.mjs"))
const SUB_ASYNC = await import(rel("thincoder-core/agent-tools/subagent-async.mjs"))
const SUB_SPAWN = await import(rel("thincoder-core/agent-tools/subagent-spawn.mjs"))
const SCHEMA = await import(rel("thincoder-core/memory/schema.mjs"))
const MEM_CORE = await import(rel("thincoder-core/memory/core.mjs"))
const MEM_DOCS = await import(rel("thincoder-core/memory/docs.mjs"))
const MEM_CODE = await import(rel("thincoder-core/memory/code-search.mjs"))

// ─── 夹具工具 ────────────────────────────────────────────────────────────────

const sandboxes = []
const sandbox = (tag) => {
  const dir = mkdtempSync(join(tmpdir(), `r1b-${tag}-`))
  sandboxes.push(dir)
  return dir
}
const openMemories = []
after(() => {
  for (const mem of openMemories) { try { mem.db.close() } catch { /* already closed */ } }
  for (const dir of sandboxes) { try { rmSync(dir, { recursive: true, force: true }) } catch { /* windows file lock */ } }
})

/** fetch 桩（零网络）：抓 body 并计数；handler(body, nth) 返回伪响应。 */
const withFetch = async (handler, fn) => {
  const calls = []
  const orig = globalThis.fetch
  globalThis.fetch = async (url, init = {}) => {
    const body = typeof init.body === "string" ? JSON.parse(init.body) : init.body
    calls.push({ url: String(url), body, init })
    return handler(body, calls.length)
  }
  try { return { value: await fn(calls), calls } } finally { globalThis.fetch = orig }
}

const captureWarn = async (fn) => {
  const lines = []
  const orig = console.warn
  console.warn = (...a) => lines.push(a.map(String).join(" "))
  try { return { value: await fn(), lines } } finally { console.warn = orig }
}

/** fetch 桩 + warn 捕获合并（calls ∕ lines ∕ value 三读面）。 */
const runWarned = async (handler, fn) => {
  const out = await withFetch(handler, async () => captureWarn(fn))
  return { value: out.value.value, lines: out.value.lines, calls: out.calls }
}

/** 孤立 UTF-16 代理码元扫描（true = 含孤立高/低代理）。 */
const hasLoneSurrogate = (s) => {
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i)
    if (c >= 0xd800 && c <= 0xdbff) {
      const n = s.charCodeAt(i + 1)
      if (n >= 0xdc00 && n <= 0xdfff) { i++; continue }
      return true
    }
    if (c >= 0xdc00 && c <= 0xdfff) return true
  }
  return false
}

const EMBEDDER = { baseURL: "http://stub.invalid/v1", apiKey: "k", model: "stub-embed" }
const embOk = (n) => ({ ok: true, status: 200, json: async () => ({ data: Array.from({ length: n }, (_, i) => ({ index: i, embedding: [1, 0, 0, 0] })) }) })
const httpErr = (status) => ({ ok: false, status, text: async () => `synthetic ${status}` })
const chatOk = (content) => new Response(
  `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\ndata: ${JSON.stringify({ choices: [{ delta: {}, finish_reason: "stop" }] })}\n\ndata: [DONE]\n\n`,
  { status: 200, headers: { "content-type": "text/event-stream" } },
)

/** 沙箱记忆库 + 模型键就位（ensure 面读 meta 键判定失配）。 */
const mkMemory = (tag) => {
  const mem = SCHEMA.createMemory({ dbPath: join(sandbox(tag), "memory.db") })
  mem.embedder = { ...EMBEDDER }
  const up = mem.db.prepare(`INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value`)
  for (const k of ["embedding_model", "code_embedding_model", "doc_embedding_model"]) up.run(k, mem.embedder.model)
  openMemories.push(mem)
  return mem
}
const insDoc = (mem, path, n, contentOf = (i) => `${path} chunk ${i}`) => {
  const st = mem.db.prepare(`INSERT INTO doc_chunks (origin, path, language, heading, content, line_start, line_end, mtime_ms, embedding, seg_content) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
  for (let i = 0; i < n; i++) st.run("C:/proj", path, "markdown", "", contentOf(i), i + 1, i + 1, 1, null, "")
}
const insCode = (mem, path, n, contentOf = (i) => `// ${path} #${i}`) => {
  const st = mem.db.prepare(`INSERT INTO code_chunks (origin, path, language, chunk_type, symbol_name, content, line_start, line_end, mtime_ms, embedding, seg_content) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
  for (let i = 0; i < n; i++) st.run("C:/proj", path, "javascript", "file", "", contentOf(i), i + 1, i + 1, 1, null, "")
}
const insEntry = (mem, n, contentOf = (i) => `entry body ${i}`) => {
  const st = mem.db.prepare(`INSERT INTO entries (type, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`)
  for (let i = 0; i < n; i++) st.run("knowledge", `t${i}`, contentOf(i), 1, 1)
}
const nullCount = (mem, table) => mem.db.prepare(`SELECT COUNT(*) AS c FROM ${table} WHERE embedding IS NULL`).get().c
const writtenCount = (mem, table, path) => mem.db.prepare(`SELECT COUNT(*) AS c FROM ${table} WHERE path = ? AND embedding IS NOT NULL`).get(path).c

/** 400 毒源判定：整批恒 400；单条独试仅毒行 400（"TOXIC-ROW" 标记）。 */
const toxicHandler = (body) => {
  if (body.input.length > 1) return httpErr(400)
  return body.input[0].includes("TOXIC-ROW") ? httpErr(400) : embOk(1)
}

// ─── #859 毒行清洗 + 隔离 ────────────────────────────────────────────────────

test("T-B1 #859 含孤立代理批 ⇒ 请求体逐条清洗（无孤立码元）、嵌入成功", async () => {
  const texts = ["alpha", "pair-😀-ok", "lone\uD800high", "lone\uDC00low", "tail\uD83D"]
  const { value, calls } = await withFetch(() => embOk(texts.length), () => EMBED.embed(EMBEDDER, texts))
  assert.equal(calls.length, 1, "单批一次请求")
  const sent = calls[0].body.input
  // 清洗语义 = `sanitizeLoneSurrogates` 单源（**现行实码 = 剥除孤立码元**；合法代理对保形）——
  // 注：上游档注（`escape.mjs:55` 邻域）声称「替换为 U+FFFD」而实码为删除；本腿锁定实码语义，
  // 上游若收正档注/实码矛盾，须同步本期望（本次交付按代码评审 🔵 已记账）。
  assert.deepEqual(sent, ["alpha", "pair-😀-ok", "lonehigh", "lonelow", "tail"], "逐条清洗（与 escape.mjs 同源语义）")
  for (const t of sent) assert.equal(hasLoneSurrogate(t), false, `无孤立码元：${JSON.stringify(t)}`)
  assert.equal(value.length, texts.length, "清洗后成功嵌入")
})

test("T-B2a #859 清洗后仍 400 的毒行 ⇒ vectors 置 null + skipped 回执一条", async () => {
  const texts = ["ok-0", "TOXIC-ROW", "ok-2"]
  const { value, calls } = await withFetch(toxicHandler, () => EMBED.embedTolerant(EMBEDDER, texts))
  assert.equal(calls.length, 4, "整批一次 + 逐条独试三条")
  assert.deepEqual(value.vectors.map((v) => (v ? v.length : null)), [4, null, 4], "毒行置 null、其余照常返回")
  assert.equal(value.skipped.length, 1, "skipped 回执一条")
  assert.match(String(value.skipped[0]), /400/, "回执携原因")
})

test("T-B2b #859 docs 面消费：毒行跳过不写、同批其余写入、一行 warn", async () => {
  const mem = mkMemory("tb2b")
  insDoc(mem, "poison.md", 1, () => "TOXIC-ROW")
  insDoc(mem, "safe.md", 63)
  const r = await runWarned(toxicHandler, () => MEM_DOCS.ensureDocEmbeddings(mem))
  assert.equal(await nullCount(mem, "doc_chunks"), 1, "毒行仍 NULL、其余 63 行写入")
  assert.equal(await writtenCount(mem, "doc_chunks", "safe.md"), 63)
  assert.equal(await writtenCount(mem, "doc_chunks", "poison.md"), 0, "毒行不写")
  assert.equal(r.lines.length, 1, "一行可见回执")
  assert.match(r.lines[0], /\[docs\]/, "回执点名面别")
  assert.match(r.lines[0], /skip/i)
  assert.equal(r.value, undefined, "ensure 面成功返回（不整抛）")
})

test("T-B2c #859 code 面 ∕ entries 面同款：毒行跳过、其余写入", async () => {
  const codeMem = mkMemory("tb2c-code")
  insCode(codeMem, "poison.js", 1, () => "// TOXIC-ROW")
  insCode(codeMem, "safe.js", 5)
  const c = await runWarned(toxicHandler, () => MEM_CODE.ensureCodeEmbeddings(codeMem))
  assert.equal(await nullCount(codeMem, "code_chunks"), 1, "code 面：仅毒行留 NULL")
  assert.equal(c.lines.length, 1, "code 面一行回执")

  const entryMem = mkMemory("tb2c-entry")
  insEntry(entryMem, 1, () => "TOXIC-ROW")
  insEntry(entryMem, 4)
  const e = await runWarned(toxicHandler, () => MEM_CORE.ensureEmbeddings(entryMem))
  assert.equal(await nullCount(entryMem, "entries"), 1, "entries 面：仅毒行留 NULL")
  assert.equal(e.lines.length, 1, "entries 面一行回执")
})

test("T-B3 #859 非 400（401）整抛——隔离只对 400 类；query 面直抛零变", async () => {
  const r1 = await withFetch(() => httpErr(401), async () => {
    await assert.rejects(() => EMBED.embedTolerant(EMBEDDER, ["a", "b"]), (e) => {
      assert.equal(e.httpStatus, 401, "抛错携 httpStatus 标注")
      return true
    })
  })
  assert.equal(r1.calls.length, 1, "零逐条独试（整抛）")

  const r2 = await withFetch(() => httpErr(400), async () => {
    await assert.rejects(() => EMBED.embed(EMBEDDER, ["query"]), /400/, "单条 embed 直抛（tolerant 只在补嵌面）")
  })
  assert.equal(r2.calls.length, 1)
})

test("T-B4 #859 毒行不阻下批：二次 ensure 取到新行（backlog 前进）", async () => {
  const mem = mkMemory("tb4")
  insDoc(mem, "poison.md", 1, () => "TOXIC-ROW")
  insDoc(mem, "safe.md", 63)
  await runWarned(toxicHandler, () => MEM_DOCS.ensureDocEmbeddings(mem))
  assert.equal(await nullCount(mem, "doc_chunks"), 1, "首轮：仅毒行留 NULL")
  insDoc(mem, "new.md", 5)
  await runWarned(toxicHandler, () => MEM_DOCS.ensureDocEmbeddings(mem))
  assert.equal(await nullCount(mem, "doc_chunks"), 1, "二轮后仍仅毒行 NULL")
  assert.equal(await writtenCount(mem, "doc_chunks", "new.md"), 5, "第二轮取到新行")
})

// ─── #860 auto-think ─────────────────────────────────────────────────────────

const mkAgent = (model) => ({
  config: { agent: { autoThink: true }, traces: { enabled: false } },
  provider: { name: "p", baseURL: "http://stub.invalid/v1", apiKey: "k", model, reasoningEffort: "high" },
  history: [{ role: "user", content: "Refactor the entire module across several files please." }],
  _logId: null, cwd: ROOT, _sessionStart: null, _role: null, _depth: 0,
})
const runClassify = (agent, handler) => runWarned(handler ?? (() => chatOk("low")), () => AUTOTHINK.classifyAndApply(agent, 0))

test("T-B5a #860 可关（effort 族）⇒ off 形（reasoning_effort none）+ max_tokens 32 + 无外溢档", async () => {
  const agent = mkAgent("qwen3.8-flash")
  const r = await runClassify(agent, () => chatOk("medium"))
  assert.equal(r.value, "high", "解析成功（EFFORT_MAP medium → high）")
  assert.equal(r.calls.length, 1)
  assert.equal(r.calls[0].body.max_tokens, 32, "小预算 32")
  assert.equal(r.calls[0].body.reasoning_effort, "none", "effort 族 off 形（载荷门补发）")
  assert.equal(r.calls[0].body.thinking, undefined, "off 形不携 thinking 标记")
  assert.equal(agent.provider.reasoningEffort, "high", "父档值不因分类而变（回写仅经映射）")
})

test("T-B5b #860 可关（type 族）⇒ thinking {type:disabled} + max_tokens 32 + 无 reasoning_effort", async () => {
  const agent = mkAgent("deepseek-flash")
  const r = await runClassify(agent, () => chatOk("low"))
  assert.equal(r.value, "low")
  assert.equal(r.calls[0].body.max_tokens, 32)
  assert.deepEqual(r.calls[0].body.thinking, { type: "disabled" }, "type 族 off 形")
  assert.equal(r.calls[0].body.reasoning_effort, undefined, "无外溢档")
})

test("T-B6 #860 不可关模型 ⇒ 零分类调用 + 一次 warn（按 model 去重）", async () => {
  const alwaysOn = await runClassify(mkAgent("glm-5.3"))
  assert.equal(alwaysOn.value, null, "跳过分类")
  assert.equal(alwaysOn.calls.length, 0, "thinkAlwaysOn ⇒ 零分类调用")
  assert.equal(alwaysOn.lines.length, 1, "一次 warn")
  assert.match(alwaysOn.lines[0], /auto-think/)
  assert.match(alwaysOn.lines[0], /glm-5\.3/, "点名 model")

  const repeat = await runClassify(mkAgent("glm-5.3"))
  assert.equal(repeat.lines.length, 0, "同 model 不重复告警")

  const enumNoNone = await runClassify(mkAgent("kimi-k3"))
  assert.equal(enumNoNone.calls.length, 0, "枚举无 none（不可关）⇒ 零分类调用")
  assert.equal(enumNoNone.lines.length, 1, "独立一条（按 model 去重）")
})

test("T-B7 #860 分类调用失败 ⇒ 一次 warn + null 回退；同签名不再刷", async () => {
  const agent = mkAgent("deepseek-flash")
  const r1 = await runClassify(agent, () => httpErr(400))
  assert.equal(r1.value, null, "回退 null（原语义）")
  assert.equal(r1.calls.length, 1)
  assert.equal(agent.provider.reasoningEffort, "high", "失败不写回")
  assert.equal(r1.lines.length, 1, "失败可见（一次 warn）")
  assert.match(r1.lines[0], /auto-think.*classification failed/)

  const r2 = await runClassify(mkAgent("deepseek-flash"), () => httpErr(400))
  assert.equal(r2.value, null)
  assert.equal(r2.lines.length, 0, "同错误签名不再刷")
})

test("T-B8 #860 EFFORT_MAP 映射逐字零回归（low/medium/high ⇒ low/high/max）", async () => {
  for (const [word, expect] of [["low", "low"], ["medium", "high"], ["high", "max"], ["MEDIUM", "high"]]) {
    const agent = mkAgent("deepseek-flash")
    const r = await runClassify(agent, () => chatOk(word))
    assert.equal(r.value, expect, `"${word}" ⇒ ${expect}`)
    assert.equal(agent.provider.reasoningEffort, expect, "写回 = 映射值")
  }
})

// ─── #861 subagentModel 三层防线 ─────────────────────────────────────────────

const CFG_BASE = { providers: [{ name: "kimi", baseURL: "http://stub.invalid/v1", apiKey: "k", model: "k3" }] }
const mkConfigFile = (tag, obj) => {
  const p = join(sandbox(tag), "config.json")
  writeFileSync(p, JSON.stringify(obj, null, 2))
  return p
}
const loadMerged = async (tag, obj) => {
  CFG_IO._setConfigPathForTest(mkConfigFile(tag, obj))
  try {
    const CFG = await fresh("thincoder-core/config.mjs", tag)
    const { value: merged, lines } = await captureWarn(() => CFG.loadConfig())
    return { merged, lines }
  } finally { CFG_IO._resetConfigPathForTest() }
}

test("T-B9 #861 对象形态 subagentModel ⇒ 加载期不采纳（= null）+ 警告一条；spawn 链零 TypeError", async () => {
  const { merged, lines } = await loadMerged("tb9", { ...CFG_BASE, agent: { subagentModel: { provider: "kimi", model: "k3" } } })
  assert.equal(merged.agent.subagentModel, null, "非法形态不采纳（回退 null = 继承）")
  assert.equal(lines.length, 1, "警告一条")
  assert.match(lines[0], /subagentModel/)
  assert.match(lines[0], /provider:model/, "携修复指引")
  // spawn 链：effectiveSubagentModel → resolveChildProvider（配置面已清洗 ⇒ 汇点零 TypeError）
  const parent = { provider: merged.provider, config: { providersList: merged.providers, agent: merged.agent } }
  const arg = SUB_SPAWN.effectiveSubagentModel(parent, "explore", undefined)
  assert.equal(arg, null, "链条拿到 null（对象从未入配置）")
  const prov = SUB_ASYNC.resolveChildProvider(parent, arg)
  assert.equal(prov.model, merged.provider.model, "spawn 正常（继承父 provider）")
})

test("T-B10a #861 subagentModels 非法值键 ⇒ 剔除 + 警告；其余键生效", async () => {
  const { merged, lines } = await loadMerged("tb10a", { ...CFG_BASE, agent: { subagentModels: { explore: { model: "k3" }, coder: "kimi:k3" } } })
  assert.deepEqual(merged.agent.subagentModels, { coder: "kimi:k3" }, "非法值键剔除、合法键保留")
  assert.equal(lines.length, 1, "警告一条")
  assert.match(lines[0], /subagentModels\.explore/, "点名被剔除键")
  const parent = { provider: merged.provider, config: { providersList: merged.providers, agent: merged.agent } }
  assert.equal(SUB_SPAWN.effectiveSubagentModel(parent, "explore", undefined), null, "剔除键 ⇒ 回退继承")
  assert.equal(SUB_SPAWN.effectiveSubagentModel(parent, "coder", undefined), "kimi:k3", "其余键生效")
})

test("T-B10b #861 subagentModels 非对象形态 ⇒ {} + 警告", async () => {
  const { merged, lines } = await loadMerged("tb10b", { ...CFG_BASE, agent: { subagentModels: "kimi:k3" } })
  assert.deepEqual(merged.agent.subagentModels, {}, "非对象 ⇒ {}")
  assert.equal(lines.length, 1)
  assert.match(lines[0], /subagentModels/)
})

test("T-B11 #861 对象 ∕ 数组 ∕ 数字 ∕ 布尔（含 falsy）入 resolveChildProvider ⇒ 明确 Error（非 TypeError）", () => {
  const parent = { provider: { name: "kimi", model: "k3" }, config: { providersList: [] } }
  for (const bad of [{ provider: "kimi", model: "k3" }, ["kimi:k3"], 42, true, false, 0]) {
    assert.throws(() => SUB_ASYNC.resolveChildProvider(parent, bad), (e) => {
      assert.notEqual(e.constructor.name, "TypeError", "不裸 TypeError")
      assert.match(e.message, /must be a string/, "明确错误消息")
      assert.match(e.message, /got /, "携实测形态")
      return true
    }, `非法形态：${JSON.stringify(bad)}`)
  }
  // tool model 参数面：effectiveSubagentModel 原样透传非法值 ⇒ 同门拦下
  const parent2 = { provider: { name: "kimi", model: "k3" }, config: { providersList: [], agent: {} } }
  assert.throws(() => SUB_ASYNC.resolveChildProvider(parent2, SUB_SPAWN.effectiveSubagentModel(parent2, "explore", { model: "x" })), /must be a string/)
})

test("T-B12 #861 合法链（default ∕ p:m ∕ 裸模型名）逐字零回归；裸渠名 ⇒ 拒；null ∕ 空串 = 不覆盖", () => {
  const KIMI = { name: "kimi", model: "k3", apiKey: " key " }
  const parent = { provider: { name: "kimi", model: "k3", apiKey: "key", baseURL: "http://x" }, config: { providersList: [KIMI], agent: {} } }
  assert.deepEqual(SUB_ASYNC.resolveChildProvider(parent, null), { ...parent.provider }, "null ⇒ 父 provider 原样")
  assert.deepEqual(SUB_ASYNC.resolveChildProvider(parent, undefined), { ...parent.provider }, "undefined ⇒ 同 null")
  assert.deepEqual(SUB_ASYNC.resolveChildProvider(parent, ""), { ...parent.provider }, "空串 ⇒ 同 null")
  assert.deepEqual(SUB_ASYNC.resolveChildProvider(parent, "default"), { ...parent.provider }, "default 别名 ⇒ 不覆盖")
  assert.deepEqual(SUB_ASYNC.resolveChildProvider(parent, "DEFAULT"), { ...parent.provider }, "default 大小写不敏感")
  assert.deepEqual(SUB_ASYNC.resolveChildProvider(parent, "kimi:k3x"), { name: "kimi", model: "k3x", apiKey: "key" }, "p:m 形")
  // 裸渠名 ⇒ 拒（2026-10-09 清除批：渠道无默认模型可派生；遗留渠道级 model 在场亦不回落——文案逐字）
  assert.throws(() => SUB_ASYNC.resolveChildProvider(parent, "kimi"), (e) => {
    assert.equal(e.constructor.name, "Error")
    assert.equal(e.message, "渠道无默认模型，请用 provider:model", "裸渠名拒文案逐字")
    return true
  })
  assert.deepEqual(SUB_ASYNC.resolveChildProvider(parent, "some-model"), { ...parent.provider, model: "some-model" }, "模型名（换型保父渠道——渠道级 model 零参与）")
})

test("T-B13 #861 VSC 端壳同拍清洗（结构腿：核内单源函数 + raw 读点消费 + 同一物理模块）", () => {
  const src = readFileSync(join(ROOT, "thincoder-vscode/src/agent/setup.mjs"), "utf8")
  assert.match(src, /sanitizeSubagentModel(?:s)?[^\n]*from "@thincoder\/core\/config\.mjs"/, "经核内 config.mjs 单源导入")
  assert.match(src, /sanitizeSubagentModel\(raw\.agent\?\.subagentModel\)/, "raw 读点同拍消费（subagentModel）")
  assert.match(src, /sanitizeSubagentModels\(raw\.agent\?\.subagentModels\)/, "raw 读点同拍消费（subagentModels）")
  assert.match(src, /cfgSubagentModel = \w+\.value/, "清洗值入 cfgSubagentModel")
  assert.match(src, /cfgSubagentModels = \w+\.value/, "清洗值入 cfgSubagentModels")
  assert.equal(
    realpathSync(join(ROOT, "thincoder-vscode/node_modules/@thincoder/core/config.mjs")).toLowerCase(),
    realpathSync(join(ROOT, "thincoder-core/config.mjs")).toLowerCase(),
    "端壳 @thincoder/core 与核为同一物理模块（零副本；Windows 盘符大小写归一）",
  )
})
