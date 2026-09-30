/**
 * 2026-09-29-queue-pickup-edge.test.mjs — 批次本地单元件（队列取项边缘收正 · #621–#625 · Q1–Q8 判据 · 随批留存归档）。
 * 名随批次档 · 住批次目录 · 不进仓套件；复跑 = 从仓库根（含 `thincoder-core/`）：
 *   node --test .thincoder/tmp/2026-09-29-queue-pickup-edge.test.mjs   # 暂存位（写门相抵——父侧收位至终位）
 *   node --test docs/batches/2026-09-29-queue-pickup-edge.test.mjs     # 转正后（终位——父侧 copy）
 * （判据面 = 批档 §2.2 + §2.10 补案块；机制单源 = 核 `@thincoder/core/queued.mjs`。）
 *
 *   Q1 核取项统一语义：slash 首条即消费（单条 · 保序 · 后条不堵）+ 结构扫描（`consumableAction` 代码面零命中 · desk `plan.slash` 零引用）
 *   Q2 desk 步边界（假件）：slash 首条 ⇒ 消费 + `pushReal` 命中 + 回执帧 ∥ 携图批整批让位
 *   Q3 核件形取项（`peek` ∕ `take`）：携图退化逐条 · 合并批 · `peek`≍`take` · `prepare` 抛 ⇒ 零取 ∥ 空队两臂
 *   Q4 窗步边界（假件）：首动作消费（帧 + `pushReal`）· 余项留队 ∥ 携图批让位 + 组合线（窗优先——结构面）
 *   Q5 窗静息取项缝：合并批（`delivered.text` = merged）+ 同数组（消费后投影归空 ⇒ 零第二写者）
 *   Q6 残值续发：按批（[a,b] ⇒ 一批）+ 与核输入队列同数组（源码单点）
 *   Q7 取项面单源：消费点五处在册 · 核件导入三处 · 零本地副本残留
 *   Q8 窗容量：第 8 条受理 ∕ 第 9 条拒（`queue-full` · 投影恒 8 · 零帧）
 * 纪律：行为断言优先 ∕ 结构断言只落机器可核形；真机面（父侧探针）归父侧闭合。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync, readdirSync } from "node:fs"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-core"))) throw new Error(`从仓库根（含 thincoder-core/）运行：cwd = ${ROOT}`)
const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)
const text = (rel) => readFileSync(resolve(ROOT, rel), "utf8")
const until = async (fn, ms = 8000) => {
  const t0 = Date.now()
  while (!fn()) { if (Date.now() - t0 > ms) throw new Error("until timeout"); await new Promise((r) => setTimeout(r, 5)) }
  return true
}

/** 代码面文件清单（四树 src ∕ renderer ∕ webview——结构扫描域；node_modules 与 docs 不入）。 */
function codeFiles() {
  const roots = ["thincoder-core", "thincoder-desktop/src", "thincoder-desktop/renderer", "thincoder-vscode/src", "thincoder-vscode/webview", "thincoder-cli/src"]
  const out = []
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.name === "node_modules" || e.name.startsWith(".")) continue
      const p = join(dir, e.name)
      if (e.isDirectory()) walk(p)
      else if (/\.(mjs|cjs|js)$/.test(e.name)) out.push(p)
    }
  }
  for (const r of roots) { const abs = join(ROOT, r); if (existsSync(abs)) walk(abs) }
  return out
}

const makeAgent = (over = {}) => ({
  title: "t", cwd: null, _slot: 1,
  _asyncSubagents: new Map(), _asyncAdvisors: new Map(), _consultSessions: new Map(), _pendingAsyncResults: [],
  provider: { name: "vis", model: "claude-sonnet-4-5" }, config: { locale: "zh" }, memory: { db: null },
  history: [], _fullHistory: [], ...over,
})

// ─── Q1 核取项统一语义 + 结构扫描 ────────────────────────────────────────────

test("Q1 核取项：slash 首条即消费（单条 · 保序 · 后条不堵）+ 结构扫描（`consumableAction` 代码面零命中 · desk `plan.slash` 零引用）", async () => {
  const core = await mod("thincoder-core/queued.mjs")
  // 分类面零改（对拍面）：planQueuedInput 仍判 slash（count 1）——消费面语义统一在取项件。
  const plan = core.planQueuedInput(["/model", "hello"])
  assert.equal(plan[0].kind, "slash")
  assert.equal(plan[0].count, 1)
  // 核件取项：slash 首动作 ⇒ 单条取（原文 · 保序 · 不合并），后条不堵。
  const queue = [{ text: "/model" }, { text: "hello" }]
  const first = core.takeQueuedBatchItem(queue)
  assert.equal(first.item?.text, "/model")
  assert.equal(first.merged, "/model")
  assert.deepEqual(queue.map((q) => q.text), ["hello"], "slash 消费后，后条不再被堵")
  const second = core.takeQueuedBatchItem(queue)
  assert.equal(second.merged, "hello")
  assert.equal(queue.length, 0)
  // 结构扫描（判别力自证：扫描域非空 + 正控命中）
  const files = codeFiles()
  assert.ok(files.length > 100, `代码面扫描域非空（实读 ${files.length} 档）`)
  assert.ok(files.some((f) => readFileSync(f, "utf8").includes("planQueuedInput")), "正控：扫描域含 `planQueuedInput` 使用档")
  const consumableHits = files.filter((f) => readFileSync(f, "utf8").includes("consumableAction"))
  assert.deepEqual(consumableHits, [], "`consumableAction` 代码面零命中（退役落定）")
  const slashHits = files.filter((f) => f.includes("thincoder-desktop") && /plan\.slash/.test(readFileSync(f, "utf8")))
  assert.deepEqual(slashHits, [], "desk `plan.slash` 零引用（死字段退役落定）")
})

// ─── Q2 desk 步边界（假件） ─────────────────────────────────────────────────

test("Q2 desk 步边界：slash 首条 ⇒ 消费 + `pushReal` + 回执帧 ∥ 携图批整批让位", async () => {
  const { createQueuedInput } = await mod("thincoder-desktop/src/main/queued-input.mjs")
  const { createTurnChain } = await mod("thincoder-desktop/src/main/turn-chain.mjs")
  const mk = () => {
    const queue = createQueuedInput()
    const posts = []
    const agent = makeAgent()
    const chain = createTurnChain({
      queue, post: (ch, payload) => posts.push({ ch, payload }),
      prepare: () => null, drive: () => {},
    })
    return { queue, posts, agent, chain }
  }
  // 臂 1：slash 首条（含后条）⇒ 步边界即消费（单条 · 原文）+ pushReal + 回执帧
  const a = mk()
  a.queue.add("1", { text: "/model", ts: 11 })
  a.queue.add("1", { text: "next", ts: 22 })
  assert.equal(a.chain.stepBoundaryPickup("1", a.agent), true, "slash 首条 ⇒ 消费（防御面退役）")
  assert.deepEqual(a.queue.snapshot("1").map((e) => e.text), ["next"], "后条留队（未随 slash 消费）")
  assert.equal(a.agent._fullHistory.at(-1)?.content, "/model", "pushReal 命中（下一步生效——非中断通道）")
  const receipt = a.posts.at(-1)
  assert.deepEqual([receipt.ch, receipt.payload.delivered], ["ev:queue", { text: "/model", ts: 11 }], "回执帧（消费回执行——快照整置）")
  assert.deepEqual(a.posts.at(-1).payload.items.map((e) => e.text), ["next"], "快照 = 剩余实况")
  // 臂 2：携图批 ⇒ 整批让位（同步缝不可降级——零消费零帧零注入）
  const b = mk()
  b.queue.add("1", { text: "a", ts: 1 })
  b.queue.add("1", { text: "b", ts: 2, images: ["data:image/png;base64,x"] })
  assert.equal(b.chain.stepBoundaryPickup("1", b.agent), false, "批内含图 ⇒ 整批让位")
  assert.equal(b.queue.size("1"), 2, "让位 ⇒ 队列零触碰")
  assert.equal(b.posts.length, 0, "让位 ⇒ 零帧")
  assert.equal(b.agent._fullHistory.length, 0, "让位 ⇒ 零注入")
})

// ─── Q3 核件形取项（peek ∕ take）+ `prepare` 抛 + 空队两臂 ────────────────────

test("Q3 核件形取项：携图退化逐条 · 合并批 · `peek`≍`take` · `prepare` 抛 ⇒ 零取 ∥ 空队两臂", async () => {
  const { createQueuedInput } = await mod("thincoder-desktop/src/main/queued-input.mjs")
  const { createTurnChain } = await mod("thincoder-desktop/src/main/turn-chain.mjs")
  const core = await mod("thincoder-core/queued.mjs")
  // ① [a, b(图)]：一轮恰 1 条（a）· 再一轮 b（携图退化逐条）
  const q1 = createQueuedInput()
  q1.add("1", { text: "a", ts: 1 })
  q1.add("1", { text: "b", ts: 2, images: ["data:image/png;base64,x"] })
  const peek1 = q1.peek("1")
  assert.equal(peek1.item.text, "a")
  assert.equal(q1.size("1"), 2, "`peek` 纯读（零消费）")
  assert.equal(q1.take("1").item.text, "a")
  assert.equal(q1.size("1"), 1)
  const t2 = q1.take("1")
  assert.equal(t2.item.text, "b")
  assert.deepEqual(t2.item.images, ["data:image/png;base64,x"], "图随条目元数据（不静默丢）")
  assert.equal(q1.size("1"), 0)
  // ② 非图 N 条 ⇒ 合并 1 条（merged 文本）
  const q2 = createQueuedInput()
  q2.add("2", { text: "m1", ts: 1 })
  q2.add("2", { text: "m2", ts: 2 })
  const peek2 = q2.peek("2")
  const merged = core.formatMergedMessages(["m1", "m2"])
  assert.equal(peek2.item.text, merged)
  // ③ `peek` ≍ 随后 `take` 同界
  const t3 = q2.take("2")
  assert.deepEqual(t3.item, peek2.item, "`take` 产物 = `peek` 试算（同界）")
  assert.equal(t3.merged, peek2.merged)
  assert.equal(q2.size("2"), 0)
  // ④ `prepare` 抛 ⇒ 零取 ∕ 队列不变（试算与落取之间前缀不动 ∕ 零丢）
  const q4 = createQueuedInput()
  q4.add("4", { text: "keep", ts: 7 })
  const chain4 = createTurnChain({ queue: q4, post: () => {}, prepare: () => { throw new Error("boom") }, drive: () => {} })
  assert.equal(await chain4.continueTurn("4", makeAgent()), false, "`prepare` 抛 ⇒ 零续发")
  assert.equal(q4.size("4"), 1, "未取即未失（留队）")
  assert.equal(q4.snapshot("4")[0].text, "keep", "队首不变")
  // ⑤ 空队零动作两臂：步边界缝（零取 ∕ 零帧 ∕ 零动作）∥ 取项缝（`null` 径 ∕ `prepare` 零调用）
  const q5 = createQueuedInput()
  let prepareCalls = 0
  const posts5 = []
  const chain5 = createTurnChain({ queue: q5, post: (ch, p) => posts5.push({ ch, p }), prepare: () => { prepareCalls += 1; return null }, drive: () => {} })
  const agent5 = makeAgent()
  assert.equal(chain5.stepBoundaryPickup("5", agent5), false, "空队 ⇒ 步边界零动作")
  assert.equal(posts5.length, 0, "空队 ⇒ 零帧")
  assert.equal(agent5._fullHistory.length, 0, "空队 ⇒ 零注入")
  assert.equal(await chain5.continueTurn("5", agent5), false, "空队 ⇒ 取项缝 null 径")
  assert.equal(prepareCalls, 0, "空队 ⇒ `prepare` 零调用")
})

// ─── Q4 窗步边界（假件） ────────────────────────────────────────────────────

test("Q4 窗步边界：首动作消费（帧 + `pushReal`）· 余项留队 ∥ 携图批让位 + 组合线（窗优先）", async () => {
  const driveMod = await mod("thincoder-desktop/src/main/suspension-drive.mjs")
  const makeDrive = (agent) => {
    const runs = [], frames = [], events = []
    const runTurn = (key, agent1, item, opts = {}) => new Promise((res, rej) => {
      const rec = { key, text: item, opts, res, rej }
      runs.push(rec)
      opts.sessionSignal?.addEventListener("abort", () => rej(Object.assign(new Error("aborted"), { name: "AbortError" })), { once: true })
    })
    let drive = null
    const postQueue = (key, delivered = null) => frames.push({ key, delivered, items: drive === null ? null : drive.inputSnapshot(key) })
    drive = driveMod.createSuspensionDrive({
      post: (ch, payload) => events.push({ ch, payload }),
      runTurn, postQueue, timer: () => ({ unref() {} }), clear: () => {},
    })
    return { drive, runs, frames, events }
  }
  // 臂 1：首动作跨度 [w1]（w2 = 斜杠条目 ⇒ 批次止于其前）——w1 消费（帧 + pushReal）· w2 留队（合并批面 = Q5 锁）
  const agent = makeAgent({ _pendingAsyncResults: [{ id: 1 }] }) // 消化轮在飞 ⇒ 窗内提交滞留至步边界
  const { drive, runs, frames } = makeDrive(agent)
  assert.equal(drive.start("1", agent, { cwd: "/p" }), true, "池活 ⇒ 入窗")
  await until(() => runs.length === 1) // 首轮 = 消化轮（在飞）
  drive.pushInput("1", "w1", null)
  drive.pushInput("1", "/w2", null)
  assert.deepEqual(drive.inputSnapshot("1").map((e) => e.text), ["w1", "/w2"], "在飞期提交滞留（步边界前）")
  assert.equal(drive.stepBoundaryPickup("1", agent), true, "步边界 ⇒ 计划首动作即消费")
  assert.deepEqual(drive.inputSnapshot("1").map((e) => e.text), ["/w2"], "余项留队（w2）")
  assert.equal(agent._fullHistory.at(-1)?.content, "w1", "pushReal 命中（下一步生效）")
  const delivered = frames.filter((f) => f.delivered !== null)
  assert.deepEqual(delivered.at(-1).delivered.text, "w1", "回执帧（消费回执行）")
  assert.deepEqual(frames.at(-1).items.map((e) => e.text), ["/w2"], "帧 = 快照整置（剩余实况）")
  assert.equal(drive.stepBoundaryPickup("1", agent), true, "再取 ⇒ 斜杠单条消费（不滞留）")
  assert.equal(agent._fullHistory.at(-1)?.content, "/w2", "斜杠单条原文入流")
  drive.abort("1")
  await until(() => drive.active("1") === false)
  // 臂 2：携图批 ⇒ 整批让位（零消费零帧）
  const agent2 = makeAgent({ _pendingAsyncResults: [{ id: 1 }] })
  const b = makeDrive(agent2)
  b.drive.start("2", agent2, { cwd: "/p" })
  await until(() => b.runs.length === 1)
  b.drive.pushInput("2", "a", null)
  b.drive.pushInput("2", "b", ["data:image/png;base64,x"])
  const framesBefore = b.frames.length
  assert.equal(b.drive.stepBoundaryPickup("2", agent2), false, "批内含图 ⇒ 整批让位（同步缝不可降级）")
  assert.equal(b.drive.inputSnapshot("2").length, 2, "让位 ⇒ 零消费")
  assert.equal(b.frames.length, framesBefore, "让位 ⇒ 零帧")
  b.drive.abort("2")
  await until(() => b.drive.active("2") === false)
  // 臂 3（结构面）：步边界缝组合 = 窗优先（窗面 ∥ 链面）
  const driverSrc = text("thincoder-desktop/src/main/turn-driver.mjs")
  assert.match(driverSrc, /suspension\.stepBoundaryPickup\(key, agent\) \|\| chain\.stepBoundaryPickup\(key, agent\)/, "组合线 = 窗优先（挂起窗在飞期步边界可达）")
})

// ─── Q5 窗静息取项缝（合并批 + 同数组） ─────────────────────────────────────

test("Q5 窗静息取项缝：合并批（`delivered.text` = merged）+ 同数组（消费后投影归空）", async () => {
  const driveMod = await mod("thincoder-desktop/src/main/suspension-drive.mjs")
  const runs = [], frames = []
  const runTurn = (key, agent1, item, opts = {}) => new Promise((res) => { runs.push({ key, text: item, opts, res }) })
  let drive = null
  const postQueue = (key, delivered = null) => frames.push({ key, delivered, items: drive === null ? null : drive.inputSnapshot(key) })
  drive = driveMod.createSuspensionDrive({ post: () => {}, runTurn, postQueue, timer: () => ({ unref() {} }), clear: () => {} })
  const agent = makeAgent({ _asyncSubagents: new Map([["s1", { status: "running" }]]) })
  drive.start("1", agent, { cwd: "/p" })
  await until(() => drive.active("1") === true)
  drive.pushInput("1", "m1", null)
  drive.pushInput("1", "m2", null)
  await until(() => runs.length === 1)
  const merged = (await mod("thincoder-core/queued.mjs")).formatMergedMessages(["m1", "m2"])
  assert.equal(runs[0].text, merged, "静息取项缝 ⇒ 合并批（核件取项——单回合）")
  assert.deepEqual(drive.inputSnapshot("1"), [], "同数组：核件消费 ⇒ 投影同刻归空（零第二写者——分离数组面不成立）")
  assert.equal(frames.filter((f) => f.delivered !== null).at(-1).delivered.text, merged, "消费帧 = merged")
  runs[0].res("done")
  drive.abort("1")
  await until(() => drive.active("1") === false)
})

// ─── Q6 残值续发（按批 + 同数组） ───────────────────────────────────────────

test("Q6 残值续发：按批（[a,b] ⇒ 一批）+ 与核输入队列同数组（源码单点）", async () => {
  const driveMod = await mod("thincoder-desktop/src/main/suspension-drive.mjs")
  const runs = [], frames = []
  const runTurn = (key, agent1, item, opts = {}) => new Promise((res, rej) => {
    runs.push({ key, text: item, opts, res, rej })
    opts.sessionSignal?.addEventListener("abort", () => rej(Object.assign(new Error("aborted"), { name: "AbortError" })), { once: true })
  })
  let drive = null
  const postQueue = (key, delivered = null) => frames.push({ key, delivered, items: drive === null ? null : drive.inputSnapshot(key) })
  drive = driveMod.createSuspensionDrive({ post: () => {}, runTurn, postQueue, timer: () => ({ unref() {} }), clear: () => {} })
  const agent = makeAgent({ _pendingAsyncResults: [{ id: 1 }] })
  drive.start("1", agent, { cwd: "/p" })
  await until(() => runs.length === 1) // 消化轮在飞
  drive.pushInput("1", "a", null)
  drive.pushInput("1", "b", null) // 在飞期落槽 ⇒ 残值
  agent._pendingAsyncResults.length = 0
  runs[0].rej(new Error("boom")) // 非 Abort 失败 ⇒ 出窗 + 残值续发
  await until(() => runs.length === 2)
  const merged = (await mod("thincoder-core/queued.mjs")).formatMergedMessages(["a", "b"])
  assert.equal(runs[1].text, merged, "残值 [a,b] ⇒ 一批（合并批一回合）")
  assert.notEqual(runs[1].opts.autoTurn, true, "普通回合（非 autoTurn）")
  assert.deepEqual(frames.filter((f) => f.delivered !== null).map((f) => f.delivered.text), [merged], "逐批消费回执（恰一枚）")
  // 同数组（源码单点）：核输入队列 = 载体数组（受理 ∕ 消费 ∕ 残值 ∕ 清队零第二写者）
  const driveSrc = text("thincoder-desktop/src/main/suspension-drive.mjs")
  assert.match(driveSrc, /inputQueue: entry\.pending/, "`startSuspension` 收载体同数组（inputQueue）")
  assert.equal(/entry\.handle\.pushInput/.test(driveSrc), false, "核 `pushInput` 串臂退场（零第二写者）")
  runs[1].res("done")
  await until(() => drive.active("1") === false)
})

// ─── Q7 取项面单源（结构机检） ──────────────────────────────────────────────

test("Q7 取项面单源：消费点五处在册 · 核件导入三处 · 零本地副本残留", () => {
  // ① 消费点在册（五项——§2.4 清单逐项）
  const vscStages = text("thincoder-vscode/src/extension/panel-turn-stages.mjs")
  assert.match(vscStages, /takeQueuedBatchItem\(busyQueued\)/, "VSC 径 1：退出兜底（`deliverBusyQueued`）")
  const vscSusp = text("thincoder-vscode/src/extension/suspension.mjs")
  assert.match(vscSusp, /takeQueuedBatchItem\(queue\)/, "VSC 径 2：取项缝（`takeQueuedInput`）")
  assert.match(vscSusp, /takeQueuedBatchItem\(leftover\)/, "VSC 径 3：会话退出残余")
  const chainSrc = text("thincoder-desktop/src/main/turn-chain.mjs")
  assert.match(chainSrc, /queue\.peek\(key\)/, "desk 径 1：尾径试算（`peek`）")
  assert.match(chainSrc, /queue\.take\(key\)/, "desk 径 1：尾径落取（`take`）")
  const driveSrc = text("thincoder-desktop/src/main/suspension-drive.mjs")
  assert.equal((driveSrc.match(/takeQueuedBatchItem\(/g) ?? []).length, 2, "desk 径 2：窗输入面（取项缝 + 残值链——两处）")
  // ② 核件导入在场（三处改指后）
  const coreImport = (src) => /takeQueuedBatchItem[^}]*\}\s*from\s*"@thincoder\/core\/queued\.mjs"/.test(src)
  assert.equal(coreImport(text("thincoder-desktop/src/main/queued-input.mjs")), true, "desk `queued-input.mjs` 导入指核件")
  assert.equal(coreImport(vscStages), true, "VSC `panel-turn-stages.mjs` 导入指核件")
  assert.equal(coreImport(vscSusp), true, "VSC `suspension.mjs` 导入指核件")
  // ③ 零本地副本残留：全仓取项定义面 = 核件单点（VSC 副本退役）
  const files = codeFiles()
  const defs = files.filter((f) => /export\s+function\s+takeQueuedBatchItem/.test(readFileSync(f, "utf8")))
  assert.deepEqual(defs.map((f) => f.slice(ROOT.length + 1).replace(/\\/g, "/")), ["thincoder-core/queued.mjs"], "取项定义单点 = 核件")
  const pickupSrc = text("thincoder-vscode/src/extension/queued-pickup.mjs")
  assert.equal(/export\s+function\s+takeQueuedBatchItem/.test(pickupSrc), false, "VSC 副本零再定义（退役落定）")
  assert.equal(/import\s*\{[^}]*takeQueuedBatchItem/.test(pickupSrc), false, "VSC 步边界档零取项导入（零自持取项件）")
})

// ─── Q8 窗容量（第 8 条受理 ∕ 第 9 条拒） ───────────────────────────────────

test("Q8 窗容量：第 8 条受理 ∕ 第 9 条拒（`queue-full` · 投影恒 8 · 零帧）", async () => {
  const driverMod = await mod("thincoder-desktop/src/main/turn-driver.mjs")
  const events = [], runs = []
  const agent = makeAgent({ cwd: "/p", _pendingAsyncResults: [{ id: 1 }] })
  const driver = driverMod.createTurnDriver({
    post: (ch, payload) => events.push({ ch, payload }),
    run: (a, item) => new Promise((res) => runs.push({ text: item, res })),
    bridge: () => ({}), postUsage: () => {}, projects: { currentCwd: () => "/p" },
    ensure: async () => agent, forgetKey: () => {}, dropScope: () => {}, denyGates: () => {},
  })
  void driver.takeOver("1", agent) // 池活 ⇒ 入窗；pending 非空 ⇒ 首轮消化在飞
  await until(() => runs.length === 1)
  const receipts = []
  for (let i = 1; i <= 8; i++) receipts.push(await driver.send("1", `q${i}`, null))
  assert.deepEqual(receipts, Array.from({ length: 8 }, () => ({ ok: true, queued: true })), "第 1–8 条 ⇒ 受理（queued 同形）")
  const before = events.filter((e) => e.ch === "ev:queue").length
  assert.deepEqual(await driver.send("1", "q9", null), { ok: false, reason: "queue-full" }, "第 9 条 ⇒ 拒（#625——全队回执码）")
  assert.equal(driver.queueSnapshot("1").length, 8, "投影恒 8（拒 ⇒ 零受理）")
  assert.equal(events.filter((e) => e.ch === "ev:queue").length, before, "拒 ⇒ 零帧")
  driver.dispose("1")
  await until(() => driver.busyOf("1") === false)
})
