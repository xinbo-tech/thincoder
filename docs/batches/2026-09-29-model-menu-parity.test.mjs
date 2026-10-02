/**
 * 2026-09-29-model-menu-parity.test.mjs — 批内件（模型菜单全渠扇出批：名随批次档 · 终位 `docs/batches/`（本副本 =
 * 落位期暂存 `.thincoder/tmp/`，父侧转正）· 不登记 · 随批留存）。跑法（仓库根 `thincoder/`）：
 * `node --test .thincoder/tmp/2026-09-29-model-menu-parity.test.mjs`。
 * 面 = ① handler 面（`model:catalog` 渠滤 ∕ 行形 ∕ 序 ∕ `unavailable` ∕ 落账 —— 核桩 = 本地 HTTP 桩 + 临时 config，探针走
 * **真核径**（`probeChannelModels` + `probeTargetOf`：落账 ∕ 长句逐字）；`model:list` 同径对齐回执行零变）② store 纯动作
 * ③ 触发链（缝 = `createComposerSync` 注入式工厂：`call` ∕ `delay` ∕ `retryDelayMs`，缺省回退 = 生产径 —— 断言 =
 * 取数计数 ∕ 重推 ∕ 六径有界（#1 恰一次 ∕ #2/#3 恰一取 ∕ #4 ≤2 轮 ∕ #5 零取数 ∕ #6 零推送）＋在飞期尾随一轮；
 * `seq` 复核 = 结构性守卫（单飞下公开面不可构造双飞 —— 无独立用例））。
 * 纪律：只读 ∕ 行为断言；实网零触（127.0.0.1 桩）；临时 config 经核测试缝 `_setConfigPathForTest`。
 */
import { createRequire } from "node:module"
import test from "node:test"
import assert from "node:assert/strict"
import { createServer } from "node:http"
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-core"))) throw new Error(`从仓库根（thincoder/）运行（cwd = ${ROOT}）`)
const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)
const tick = (ms = 15) => new Promise((resolveTick) => setTimeout(resolveTick, ms))
/** 核长句原文（`channelUnavailableMessage` 形 —— 断言用逐字副本）。 */
const LONG = (status) => `该渠道不提供模型列表（GET /models ${status}）——无法选择模型，请改用其他渠道`

// ─── 面装载 ───（`/rc/` 解析钩子须先于渲染档装载 —— 平 node 取核件路径）
const coreConfigIo = await mod("thincoder-desktop/node_modules/@thincoder/core/config-io.mjs")
const coreProbe = await mod("thincoder-desktop/node_modules/@thincoder/core/provider/list-models.mjs")
const settings = await mod("thincoder-desktop/src/main/settings.mjs")
await mod("thincoder-desktop/test/rc-resolve.mjs")
const storeMod = await mod("thincoder-desktop/renderer/store.mjs")
const composerSync = await mod("thincoder-desktop/renderer/composer-sync.mjs")

/** 本地 HTTP 桩：`/bad/` ⇒ 500（失败渠）；`/empty/` ⇒ 200 + 空表；余 ⇒ 200 + **逆序** data[]（核排序收敛）。 */
function startStub() {
  const hits = []
  const server = createServer((req, res) => {
    hits.push(req.url)
    if (req.url.includes("/bad/")) {
      res.writeHead(500, { "content-type": "text/plain" })
      res.end("stub failure")
      return
    }
    res.writeHead(200, { "content-type": "application/json" })
    res.end(JSON.stringify(req.url.includes("/empty/") ? { data: [] } : { data: [{ id: "stub-model-b" }, { id: "stub-model-a" }] }))
  })
  return new Promise((done) => server.listen(0, "127.0.0.1", () => done({ server, hits, port: server.address().port })))
}

test("① handler 面：渠滤 ∕ 行形 ∕ 序 ∕ unavailable ∕ 落账（真核探针径）+ model:list 同径对齐", async () => {
  const { server, hits, port } = await startStub()
  const dir = mkdtempSync(join(tmpdir(), "mm-catalog-"))
  const cfg = join(dir, "config.json")
  const write = (providers) => writeFileSync(cfg, JSON.stringify({ providers }, null, 2))
  const at = (channel) => `http://127.0.0.1:${port}/${channel}`
  coreConfigIo._setConfigPathForTest(cfg)
  coreProbe._resetAdmissionForTest()
  try {
    write([
      { name: "alpha", baseURL: at("alpha"), apiKey: "k-alpha" },
      { name: "beta", baseURL: at("bad"), apiKey: "k-beta" },
      { name: "gamma", baseURL: at("gamma"), apiKey: "   " }, // 零 key（空白）⇒ 渠滤剔（VSC trim 判据）
      { name: "delta", baseURL: at("delta"), apiKey: "k-delta" },
    ])
    const catalog = await settings.modelCatalog()
    // 渠滤 + 序 = 渠（配置序）× 渠内（核排序）；行形 = { provider, id, effortEnum, thinkOff }
    assert.deepEqual(catalog.models.map((row) => row.provider), ["alpha", "alpha", "delta", "delta"])
    assert.deepEqual(catalog.models.map((row) => row.id), ["stub-model-a", "stub-model-b", "stub-model-a", "stub-model-b"])
    assert.deepEqual(Object.keys(catalog.models[0]), ["provider", "id", "effortEnum", "thinkOff"])
    assert.deepEqual(catalog.models[0].effortEnum, [])
    assert.equal(catalog.models[0].thinkOff, true)
    assert.equal(hits.some((url) => url.includes("/gamma")), false, "零 key 渠零探")
    // 失败渠：零行 + unavailable 逐字（核 channelUnavailableMessage 长句）
    assert.deepEqual(catalog.unavailable, [{ provider: "beta", reason: LONG(500) }])
    // 落账：成功清失败 ∕ 失败记 { reason, failure }；未探渠零账
    assert.equal(coreProbe.admissionOf("alpha").ok, true)
    const failed = coreProbe.admissionOf("beta")
    assert.equal(failed.ok, false)
    assert.equal(failed.reason, LONG(500))
    assert.equal(failed.failure, "malformed")
    assert.equal(coreProbe.admissionOf("gamma"), null)
    // 探通零模型渠 ⇒ 零行 ∧ 不落 unavailable
    write([{ name: "alpha", baseURL: at("alpha"), apiKey: "k-alpha" }, { name: "zeta", baseURL: at("empty"), apiKey: "k-zeta" }])
    const mixed = await settings.modelCatalog()
    assert.equal(mixed.models.length, 2)
    assert.deepEqual(mixed.unavailable, [])
    // 无已配渠 ⇒ 两键空表
    write([{ name: "gamma", baseURL: at("gamma"), apiKey: "" }])
    assert.deepEqual(await settings.modelCatalog(), { ok: true, models: [], unavailable: [] })
    // 畸形档不吞（loadRaw 抛 ⇒ invoke 拒绝直传）
    writeFileSync(cfg, "{ not json")
    await assert.rejects(() => settings.modelCatalog())
    // `model:list` 同径对齐（U1）：回执行逐字零变 + 过代理径 ∕ 落账同径
    write([{ name: "alpha", baseURL: at("alpha"), apiKey: "k-alpha" }, { name: "beta", baseURL: at("bad"), apiKey: "k-beta" }])
    coreProbe._resetAdmissionForTest()
    assert.deepEqual(await settings.modelList({ provider: "alpha" }), {
      ok: true, models: [{ id: "stub-model-a", effortEnum: [], thinkOff: true }, { id: "stub-model-b", effortEnum: [], thinkOff: true }],
    })
    assert.equal(coreProbe.admissionOf("alpha").ok, true)
    assert.deepEqual(await settings.modelList({ provider: "beta" }), { ok: false, models: [], reason: LONG(500) })
    assert.equal(coreProbe.admissionOf("beta").failure, "malformed")
    assert.deepEqual(await settings.modelList({ provider: "nope" }), { ok: false, models: [], reason: "该渠道不提供模型列表（GET /models provider not found: nope）——无法选择模型，请改用其他渠道" })
  } finally {
    coreConfigIo._resetConfigPathForTest()
    coreProbe._resetAdmissionForTest()
    await new Promise((done) => { server.close(done); server.closeAllConnections() })
    rmSync(dir, { recursive: true, force: true })
  }
})

test("①B 通道四件套一致（结构机检：白名单 ↔ 注册表 ↔ 处理体在场 —— fail-closed 前提）", () => {
  const require = createRequire(import.meta.url)
  const preload = require(resolve(ROOT, "thincoder-desktop/src/preload/preload.cjs"))
  const channels = [...preload.CHANNELS]
  assert.equal(channels.length, 45, "白名单 38 ⇒ 39 ⇒ 43 ⇒ 45（B10 W2/W3 随动——父侧）")
  assert.equal(channels[channels.length - 1], "mcp:reconnect", "定序末位")
  const registry = readFileSync(resolve(ROOT, "thincoder-desktop/src/main/ipc-registry.mjs"), "utf8")
  const head = registry.indexOf("const HANDLERS = Object.freeze({")
  const rows = [...registry.slice(head, registry.indexOf("\n})", head)).matchAll(/^\s{2}"([^"]+)":\s*([A-Za-z_$][\w$]*),/gm)].map((match) => ({ channel: match[1], handler: match[2] }))
  assert.deepEqual(rows.map((row) => row.channel).sort(), [...channels].sort(), "白名单 ↔ 注册表逐项一致")
  const ipc = readFileSync(resolve(ROOT, "thincoder-desktop/src/main/ipc.mjs"), "utf8")
  const ipcRelays = readFileSync(resolve(ROOT, "thincoder-desktop/src/main/ipc-relays.mjs"), "utf8")
  const ipcAll = `${ipc}\n${ipcRelays}`
  for (const row of rows) assert.ok(ipcAll.includes(row.handler), `处理体在 ipc.mjs ∕ ipc-relays.mjs 在场：${row.handler}`)
  assert.ok(/function modelCatalogChannel\(\) \{ return modelCatalog\(\) \}/.test(ipcAll), "model:catalog 转口 = modelCatalog")
})

test("② store 纯动作：切片形 { models, unavailable } + 引用判据（同引用回原态）", () => {
  const seed = storeMod.initialState()
  assert.deepEqual(seed.modelCandidates, { models: [], unavailable: [] })
  assert.equal("forProvider" in seed.modelCandidates, false, "forProvider 失义退场")
  const rows = [{ id: "m", label: "m", provider: "p", group: "p", reasoning: [] }]
  const missing = [{ provider: "q", reason: "r" }]
  const next = storeMod.setModelCandidates(seed, rows, missing)
  assert.notEqual(next, seed)
  assert.equal(next.modelCandidates.models, rows)
  assert.equal(next.modelCandidates.unavailable, missing)
  assert.equal(storeMod.setModelCandidates(next, rows, missing), next, "两者同引用 ⇒ 原引用（零通知）")
  assert.notEqual(storeMod.setModelCandidates(next, [...rows], missing), next, "调用面新取（新数组）⇒ 落新引用")
  assert.deepEqual(storeMod.setModelCandidates(next, null, undefined).modelCandidates, { models: [], unavailable: [] })
  assert.equal(next.blocks, seed.blocks) // 他切片零动
})

/** 触发链夹具（缝 = 注入式工厂 —— 缺省回退 = 生产径）：`call` ∕ `delay` ∕ `retryDelayMs` 全注入。 */
function makeSync({ handler = null, responses = [], deps = {} } = {}) {
  const calls = []
  const pushes = []
  const store = storeMod.createStore(storeMod.initialState())
  let index = 0
  const sync = composerSync.createComposerSync({
    store,
    activeKey: () => store.get().activeSession ?? null,
    call: async (channel, payload) => {
      calls.push({ channel, payload })
      if (typeof handler === "function") return handler(channel, payload, calls.length)
      const next = responses[Math.min(index, responses.length - 1)]
      index += 1
      return typeof next === "function" ? next() : next
    },
    push: (message) => pushes.push(message),
    pushSubs: [],
    wire: { failure: () => null },
    panelOf: () => null,
    noticesOf: () => null,
    delay: async () => {}, // 重探步进零真实等待（生产缺省 = setTimeout）
    retryDelayMs: 0,
    ...deps,
  })
  return { sync, store, calls, pushes, modelPushes: () => pushes.filter((message) => message.type === "models") }
}

const CATALOG = (over = {}) => ({
  ok: true,
  models: [
    { provider: "alpha", id: "stub-model-a", effortEnum: ["low"], thinkOff: true },
    { provider: "beta", id: "stub-model-b", effortEnum: [], thinkOff: true },
  ],
  unavailable: [],
  ...over,
})
const FAIL_ITEM = { provider: "beta", reason: "stub-failure" }

test("③-1 #1 装配首跑恰一取 + 核件面形投影 + 切片同写点", async () => {
  const { sync, store, calls, pushes, modelPushes } = makeSync({ responses: [CATALOG()] })
  sync.syncPanel(store.get())
  await tick()
  assert.equal(calls.length, 1, "#1 恰一次取")
  assert.equal(calls[0].channel, "model:catalog")
  assert.equal(calls[0].payload, undefined, "无载荷")
  assert.equal(modelPushes().length, 1)
  assert.deepEqual(modelPushes()[0].models[0], { id: "stub-model-a", label: "stub-model-a", provider: "alpha", group: "alpha", reasoning: ["none", "low"] })
  assert.deepEqual(modelPushes()[0].prefs, { model: "", provider: "", reasoning: "" }, "无活动会话 ⇒ 空 prefs（禁假造）")
  assert.equal(store.get().modelCandidates.models, modelPushes()[0].models, "切片与推送同引用（同写点）")
  assert.equal(store.get().modelCandidates.unavailable.length, 0)
  sync.syncPanel(store.get()) // 同态再随动 ⇒ 零重取
  await tick()
  assert.equal(calls.length, 1)
  assert.equal(modelPushes().length, 1)
  assert.ok(pushes.length >= 1) // 模式位等随动推送不干扰模型面计数（模型面经 type 过滤）
})

test("③-2 #5 会话切换 ∕ 活动 meta 变 ⇒ 重推缓存 + 新 prefs（零取数）", async () => {
  const { sync, store, calls, modelPushes } = makeSync({ responses: [CATALOG()] })
  sync.syncPanel(store.get())
  await tick()
  store.set({ activeSession: 2, sessionMeta: { 2: { provider: "beta", model: "stub-model-b", effort: "high" } } })
  sync.syncPanel(store.get())
  assert.equal(calls.length, 1, "#5 零取数")
  assert.equal(modelPushes().length, 2)
  assert.equal(modelPushes()[1].models, modelPushes()[0].models, "重推缓存（同引用）")
  assert.deepEqual(modelPushes()[1].prefs, { model: "stub-model-b", provider: "beta", reasoning: "high" })
  sync.syncPanel(store.get()) // 同签名 ⇒ 零重推（幂等）
  assert.equal(modelPushes().length, 2)
  store.set({ sessionMeta: { 2: { provider: "beta", model: "stub-model-a", effort: "high" } } }) // 同渠换模型（活动 meta 变）
  sync.syncPanel(store.get())
  assert.equal(calls.length, 1)
  assert.equal(modelPushes().length, 3)
  assert.deepEqual(modelPushes()[2].prefs, { model: "stub-model-a", provider: "beta", reasoning: "high" })
})

test("③-3 #6 两键皆空 ⇒ 零推送（含「已配渠集 → 空」转移）+ 旧行驻留", async () => {
  const { sync, store, calls, modelPushes } = makeSync({ responses: [CATALOG(), { ok: true, models: [], unavailable: [] }] })
  sync.syncPanel(store.get())
  await tick()
  assert.equal(modelPushes().length, 1)
  store.set({ activeSession: 1, sessionMeta: { 1: { provider: "alpha", model: "stub-model-a", effort: "high" } } })
  sync.syncPanel(store.get()) // #5：会话激活 ⇒ 重推
  assert.equal(modelPushes().length, 2)
  sync.refreshCandidates() // #2 ∕ #3：强制刷新 ⇒ 收据两键皆空
  await tick()
  assert.equal(calls.length, 2)
  assert.equal(modelPushes().length, 2, "#6 零推送 —— 菜单保持现状（旧行驻留）")
  assert.deepEqual(store.get().modelCandidates, { models: [], unavailable: [] }, "切片 = 收据数据（同写点数据完整）")
  store.set({ activeSession: 3, sessionMeta: { 3: { provider: "alpha", model: "stub-model-a", effort: "" } } })
  sync.syncPanel(store.get()) // 其后会话切换 ⇒ #5 仍重推旧缓存行（驻留至下一有效推送）
  assert.equal(modelPushes().length, 3)
  assert.equal(modelPushes()[2].models, modelPushes()[0].models)
})

test("③-4 #4 收据 unavailable 非空 ⇒ ≤2 轮整渠重探 ∕ 改善才再推", async () => {
  const m1 = { provider: "alpha", id: "stub-model-a", effortEnum: [], thinkOff: true }
  const improved = [
    { ok: true, models: [m1], unavailable: [FAIL_ITEM] }, // 初拍
    { ok: true, models: [m1], unavailable: [FAIL_ITEM] }, // 轮 1：同计数 ⇒ 零重推
    { ok: true, models: [m1, { provider: "beta", id: "stub-model-b", effortEnum: [], thinkOff: true }], unavailable: [] }, // 轮 2：改善 ⇒ 重推
  ]
  const { sync, store, calls, modelPushes } = makeSync({ responses: improved })
  sync.syncPanel(store.get())
  await tick()
  assert.equal(calls.length, 3, "1 初拍 + 2 轮（上限）")
  assert.equal(modelPushes().length, 2, "初拍 + 改善拍（轮 1 零重推）")
  assert.equal(modelPushes()[1].models.length, 2)
  await tick()
  assert.equal(calls.length, 3, "≤2 轮 —— 无第 3 轮")
  const stuck = makeSync({ responses: [{ ok: true, models: [m1], unavailable: [FAIL_ITEM] }] })
  stuck.sync.syncPanel(stuck.store.get())
  await tick(); await tick()
  assert.equal(stuck.calls.length, 3, "无改善仍 ≤2 轮（界）")
  assert.equal(stuck.modelPushes().length, 1, "无改善 ⇒ 零重推")
})

test("③-5 #2 ∕ #3 强制刷新恰一取；在飞期调用 = 位标（单飞 + 尾随一轮）", async () => {
  const plain = makeSync({ responses: [CATALOG()] })
  plain.sync.refreshCandidates()
  await tick()
  assert.equal(plain.calls.length, 1, "恰一取")
  assert.equal(plain.modelPushes().length, 1)
  plain.sync.refreshCandidates()
  await tick()
  assert.equal(plain.calls.length, 2, "每次触发恰一取")
  const pendings = []
  const deferred = makeSync({ handler: () => new Promise((resolveCall) => { pendings.push(resolveCall) }) })
  deferred.sync.refreshCandidates() // 取数 #1（在飞）
  await tick(1)
  assert.equal(deferred.calls.length, 1)
  deferred.sync.refreshCandidates() // 在飞期两次触发 ⇒ 位标同枚（尾随一轮）
  deferred.sync.refreshCandidates()
  assert.equal(deferred.calls.length, 1, "单飞：在飞期零新取")
  pendings[0](CATALOG())
  await tick()
  assert.equal(deferred.calls.length, 2, "落定后补一轮（尾随一轮）")
  pendings[1](CATALOG())
  await tick()
  assert.equal(deferred.calls.length, 2, "其后零补（合并为一轮）")
  assert.equal(deferred.modelPushes().length, 2)
})

test("③-6 #6 无已配渠 ⇒ 零推送；全渠失败 ⇒ 照推（models 空 + unavailable 非空）", async () => {
  const none = makeSync({ responses: [{ ok: true, models: [], unavailable: [] }] })
  none.sync.syncPanel(none.store.get())
  await tick()
  assert.equal(none.calls.length, 1)
  assert.equal(none.modelPushes().length, 0, "无已配渠 ⇒ 零推送（菜单零清）")
  const allFail = makeSync({ responses: [{ ok: true, models: [], unavailable: [FAIL_ITEM] }] })
  allFail.sync.syncPanel(allFail.store.get())
  await tick(); await tick()
  assert.equal(allFail.calls.length, 3, "全渠失败 ⇒ 仍起重探链（≤2 轮）")
  assert.equal(allFail.modelPushes().length, 1, "照推一拍（无改善 ⇒ 轮次零重推）")
  assert.deepEqual(allFail.modelPushes()[0].models, [])
})
