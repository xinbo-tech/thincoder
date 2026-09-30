/**
 * 2026-09-29-desktop-window-queue-parity.test.mjs — 批次本地单元件（挂起窗径批 ∥ 窗队列批 · 合并实施轮 · 随批留存归档）。
 * 名随批次档 · 住批次目录 · 不进仓套件；复跑 = 从仓库根 `thincoder/`：
 *   node --test docs/batches/2026-09-29-desktop-window-queue-parity.test.mjs
 * （导入按 `process.cwd()`（仓库根）相对解析；落位期暂存 `.thincoder/tmp/` 同名副本 = 留档，终位 = 本目录。）
 *
 * 用例 = 两档 AC 判据面（`2026-09-29-desktop-susp-queue.md` §2.5 AC-1–AC-11 之可用例面 +
 * `2026-09-29-desktop-window-queue-parity.md` §2.6 AC-1–AC-4）：
 *   T1 窗队模块：五帧 + 投影操作（步边界取批 ∕ 倾出 ∕ 清队；`ts` 缺省不携——禁假造）
 *   T2 挂起驱动：窗内受理（受理帧）⇒ 核消费 ⇒ 消费帧（纯文本径）+ 投影读面
 *   T3 携图窗内对齐 × 真送达面（`prepareTurnAttachments`）：多模态指针段 ∕ 非视觉降级码浮出 + 落盘件
 *   T4 窗中止（#561 AC-6）：清队 + 状态帧 + 读面归空
 *   T5 残输入续发（#561 AC-10）：非 Abort 失败径 ⇒ 投影随形逐条 delivered + 普通回合
 *   T6 turn-driver 端到端：窗内 send 回执 `{ok:true,queued:true}`（#561 AC-3 ∕ #564 AC-1 ∕ AC-3）+
 *      `queueSnapshot` 两源合并（#564 AC-4）+ 携图消费过送达面（指针入文）
 *   T7 写面（node 可装载件）：队形回执 ⇒ 退流 + 挂起空闲复位（#561 AC-9）；失败回执 ⇒ 退流 + 失败行
 *      （#561 AC-4 ∕ AC-11）；`noteEcho(key,null)` ⇒ 退流零动作（防误摘既往真块）
 *   T8 结构核（不可 node 装载三档——判据单源在场）：`suspActiveOf` ∕ `turnState` 改引 ∕ 抑制面恒登记 ∕ 失败径退流
 *   T9 时序面（§2.10 定形句）：hold 占位链——signal = hold.signal ∕ 中断 fail-fast ∕ 占位被摘 ⇒ 零起跑 + 落盘件自清 ∧ 不重投（守卫序列出档 `suspension-guard.mjs`——两调用点）
 * 纪律：只读面 ∕ 行为断言；⌛ 面（真机）归父侧闭合。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-core"))) throw new Error(`从仓库根（thincoder/）运行（cwd = ${ROOT}）`)
const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)
const text = (rel) => readFileSync(resolve(ROOT, rel), "utf8")
const [wqMod, deskAtt, driveMod, driverMod, wireMod, slots] = await Promise.all([
  mod("thincoder-desktop/src/main/window-queue.mjs"),
  mod("thincoder-desktop/src/main/attachments.mjs"),
  mod("thincoder-desktop/src/main/suspension-drive.mjs"),
  mod("thincoder-desktop/src/main/turn-driver.mjs"),
  mod("thincoder-desktop/renderer/composer-wire.mjs"),
  mod("thincoder-core/session-slots.mjs"),
])

const VISION = "claude-sonnet-4-5" // spec.multimodal === true
const TEXT = "deepseek-chat" // 非视觉（默认 spec）
const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
const img = () => PNG // IPC 附件元素形（`msg:send.images` 载荷 = dataURL 串——A1；名 ∕ mime 由核从串推）
const until = async (fn, ms = 8000) => { const t0 = Date.now(); while (!fn()) { if (Date.now() - t0 > ms) throw new Error("until timeout"); await new Promise((r) => setTimeout(r, 5)) } return true }

/** 假 agent（挂起载体：池表三件显式在场 ⇒ `poolLive` 真值可控；pending 空 ⇒ 不触发消化轮）。 */
const makeAgent = (model = VISION, over = {}) => ({
  title: "t", cwd: null, _slot: 1,
  _asyncSubagents: new Map([["s1", { status: "running" }]]),
  _asyncAdvisors: new Map(), _consultSessions: new Map(), _pendingAsyncResults: [],
  provider: { name: "vis", model }, config: { locale: "zh" }, memory: { db: null },
  history: [], _fullHistory: [], ...over,
})

/** 挂起驱动装配（假 postQueue ⇒ 帧面全录（items = 实时投影读面）；时钟两缝假注入 ⇒ 零真实闩；`hold` = 降级窗占位注入缝）。 */
function makeDrive({ agent, prepare = null, degrade = null, hold = null } = {}) {
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
    runTurn, postQueue, prepare, degrade, hold,
    timer: () => ({ unref() {} }), clear: () => {},
  })
  return { drive, runs, frames, events }
}

test("T1 窗队模块：五帧 + 投影操作（步边界取批 ∕ 倾出 ∕ 清队；ts 缺省不携——禁假造）", async () => {
  const frames = []
  const q = wqMod.createWindowQueue({ postQueue: (key, delivered = null) => frames.push({ key, delivered }) })
  const pending = []
  q.accept("1", pending, "甲", [img()])
  assert.equal(frames.length, 1, "受理 ⇒ 状态帧（受理即推）")
  assert.deepEqual([frames[0].key, frames[0].delivered], ["1", null], "状态形（delivered 缺）")
  assert.deepEqual(Object.keys(pending[0]).sort(), ["images", "text", "ts"], "富条目（非空 images 才携）")
  assert.equal(typeof pending[0].ts, "number", "ts = 入队现刻（禁假造之外的真值）")
  q.accept("1", pending, "乙", null)
  assert.deepEqual(Object.keys(pending[1]).sort(), ["text", "ts"], "无图径 ⇒ 无 images 键")
  assert.deepEqual(q.snapshot(pending).map((e) => Object.keys(e).sort()), [["text", "ts"], ["text", "ts"]], "投影恰形（图不入快照）")
  // `take`（find-by-text）退役 ⇒ 步边界取批（核件取项——单源）：批内含图（甲）⇒ **整批让位**（零消费零帧）
  assert.equal(q.stepPickup(pending), null, "批内含图 ⇒ 整批让位（同步缝不可降级）")
  assert.equal(pending.length, 2, "让位 ⇒ 队列零触碰")
  const noImg = pending.splice(1, 1) // 无图单条（乙）出列 ⇒ 正径取批夹具
  const noImgTs = noImg[0]?.ts ?? null
  assert.deepEqual(q.stepPickup(noImg), { text: "乙", ts: noImgTs }, "正径 ⇒ { text, ts }（就地消费——零帧，帧由调用点出）")
  assert.equal(noImg.length, 0, "取批 ⇒ 消费")
  const out = await q.consume("1", { text: "无 ts 条目" }, null)
  assert.deepEqual(Object.keys(frames.at(-1).delivered).sort(), ["text"], "ts 非有限数 ⇒ 键缺席（缺省不携）")
  assert.deepEqual(out, { text: "无 ts 条目", attached: null }, "无附件径 ⇒ 原文逐字")
  const drained = q.drain(pending)
  assert.deepEqual(drained.map((e) => e.text), ["甲"], "倾出（残值逐条）")
  assert.equal(pending.length, 0)
  // 送达面违约（非串 text）⇒ 回落该条文本逐字（与链径 `turn-chain.mjs:94` 同式）
  const q2 = wqMod.createWindowQueue({ postQueue: () => {}, prepare: () => ({ text: 123, paths: [] }) })
  const p2 = []
  q2.accept("2", p2, "逐字", [img()])
  const fallback = await q2.consume("2", p2[0], {})
  assert.equal(fallback.text, "逐字", "非串送达文本 ⇒ 回落原文（零第二判据）")
  assert.deepEqual(fallback.attached, { text: 123, paths: [] }, "attached 原样交回合（清理面据 paths）")
  assert.equal(q.clear("1", pending), 0, "空队清 ⇒ 零条")
  const before = frames.length
  q.accept("1", pending, "丙", null)
  assert.equal(q.clear("1", pending), 1, "清非空 ⇒ 条数")
  assert.equal(frames.length, before + 2, "清队 ⇒ 状态帧（窗半归空 ⇒ 带退场）")
  assert.deepEqual(frames.at(-1), { key: "1", delivered: null }, "末帧 = 状态形")
})

test("T2 挂起驱动：窗内受理 ⇒ 核消费 ⇒ 消费帧（纯文本径）+ 投影读面", async () => {
  const agent = makeAgent()
  const { drive, runs, frames } = makeDrive({ agent })
  assert.equal(drive.start("1", agent, { cwd: "/p" }), true, "池活 ⇒ 入窗")
  assert.equal(drive.pushInput("1", "甲", null), true, "窗内受理（未入窗 ⇒ false 是竞态防御档）")
  const ts = frames[0].items[0].ts
  assert.deepEqual(frames[0], { key: "1", delivered: null, items: [{ text: "甲", ts }] }, "受理帧 = 状态形（两源合并读面——窗半在场）")
  assert.equal(drive.inputSnapshot("1").length, 1, "投影读面在场")
  await until(() => runs.length === 1) // 核 step 1 消费
  assert.equal(runs[0].text, "甲", "用户回合文本 = 该条逐字")
  assert.equal(runs[0].opts.attached, null, "无图径 ⇒ 零附件")
  assert.deepEqual(frames[1], { key: "1", delivered: { text: "甲", ts }, items: [] }, "消费帧 = 消费回执形（带项同帧退场）")
  assert.deepEqual(drive.inputSnapshot("1"), [], "取项后投影归空")
  runs[0].res("done")
  drive.abort("1")
  await until(() => drive.active("1") === false)
  assert.deepEqual(drive.inputSnapshot("1"), [], "窗摘后读面空（未入窗径 ⇒ []）")
})

test("T3 携图窗内对齐 × 真送达面：多模态指针段 ∕ 非视觉降级码 + 落盘件", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "wq-t3-"))
  const cwd = join(root, "proj")
  mkdirSync(cwd, { recursive: true })
  const prepare = (body, images, agent) => deskAtt.prepareTurnAttachments(body, images, { cwd, model: agent?.provider?.model, locale: agent?.config?.locale })
  // 多模态径：指针段入文 + 无降级码
  const vis = makeAgent(VISION, { cwd })
  const a = makeDrive({ agent: vis, prepare })
  a.drive.start("1", vis, { cwd })
  a.drive.pushInput("1", "看图", [img()])
  await until(() => a.runs.length === 1)
  assert.deepEqual(a.frames[0].items.map((e) => Object.keys(e).sort()), [["text", "ts"]], "图不入快照（受理帧）")
  const attached = a.runs[0].opts.attached
  assert.equal(attached.paths.length, 1, "落盘件（prepare 判决）")
  assert.equal(existsSync(attached.paths[0]), true, "盘上可见")
  assert.match(a.runs[0].text, /\[Attached images: .+\]/, "指针段入文（图随回合送达）")
  assert.equal(a.frames[1].delivered.degraded, undefined, "多模态全收 ⇒ 无降级码键")
  deskAtt.cleanupTurn(attached.paths) // 回合尾清理面（实调）
  assert.equal(existsSync(attached.paths[0]), false, "清理面")
  a.runs[0].res("done")
  a.drive.abort("1")
  await until(() => a.drive.active("1") === false)
  // 非视觉径：degraded 随消费回执浮出 + 文本原样（载具层携图——核件输入面单形）
  const txt = makeAgent(TEXT, { cwd })
  const b = makeDrive({ agent: txt, prepare })
  b.drive.start("1", txt, { cwd })
  b.drive.pushInput("1", "看图二", [img("b.png")])
  await until(() => b.runs.length === 1)
  assert.equal(b.frames[1].delivered.degraded, "non-vision", "降级码浮出（零静默）")
  assert.equal(b.runs[0].text, "看图二", "降级面缺省（未注入）⇒ 原文 —— 注入面契约；生产两径皆注入 degrade")
  assert.equal(b.runs[0].opts.attached.degraded, "non-vision", "送达面判决同源")
  deskAtt.cleanupTurn(b.runs[0].opts.attached.paths)
  b.runs[0].res("done")
  b.drive.abort("1")
  await until(() => b.drive.active("1") === false)
  // 非视觉 × 降级面（W2 跑者 —— 与 `send` ∕ `continueTurn` 同判据）：成功 ⇒ 描述注文入文 ∧ 零弃 ⇒ 键缺席
  const degradeWith = (reader) => (attached, agent, signal) => deskAtt.degradeTurnAttachments(attached, {
    model: agent?.provider?.model, cwd, parentAgent: agent, locale: agent?.config?.locale, signal, visionReader: reader,
  })
  const txt2 = makeAgent(TEXT, { cwd })
  const c = makeDrive({ agent: txt2, prepare, degrade: degradeWith(async () => ({ ok: true, description: "一只猫。" })) })
  c.drive.start("1", txt2, { cwd })
  c.drive.pushInput("1", "看图三", [img("c.png")])
  await until(() => c.runs.length === 1)
  assert.match(c.runs[0].text, /\[图片 .+ 描述: 一只猫。\]/, "降级注文入文（非视觉图随回合送达）")
  assert.equal(c.frames[1].delivered.degraded, undefined, "降级成功零弃 ⇒ 键缺席（与忙态径同判据）")
  deskAtt.cleanupTurn(c.runs[0].opts.attached.paths)
  c.runs[0].res("done")
  c.drive.abort("1")
  await until(() => c.drive.active("1") === false)
  // 非视觉 × 读图失败 ⇒ 原文本 + 说明行（定局）+ 码浮出
  const txt3 = makeAgent(TEXT, { cwd })
  const d = makeDrive({ agent: txt3, prepare, degrade: degradeWith(async () => { throw new Error("boom") }) })
  d.drive.start("1", txt3, { cwd })
  d.drive.pushInput("1", "看图四", [img("d.png")])
  await until(() => d.runs.length === 1)
  assert.equal(d.runs[0].text, "看图四\n\n图片未随发——该模型不支持图片", "读图失败 ⇒ 原文本 + 说明行（降级面定局）")
  assert.equal(d.frames[1].delivered.degraded, "non-vision", "失败径 ⇒ 降级码浮出（零静默）")
  deskAtt.cleanupTurn(d.runs[0].opts.attached.paths)
  d.runs[0].res("done")
  d.drive.abort("1")
  await until(() => d.drive.active("1") === false)
  t.diagnostic(`tmp 根：${root}`)
})

test("T4 窗中止（#561 AC-6）：清队 + 状态帧 + 读面归空", async () => {
  const agent = makeAgent()
  const { drive, runs, frames } = makeDrive({ agent })
  drive.start("1", agent, { cwd: "/p" })
  drive.pushInput("1", "甲", null)
  await until(() => runs.length === 1)
  drive.pushInput("1", "乙", null) // 在飞回合期落槽 ⇒ 留队
  assert.equal(drive.inputSnapshot("1").length, 1, "乙在投影")
  const before = frames.length
  drive.abort("1")
  await until(() => drive.active("1") === false)
  assert.ok(frames.length > before, "清队帧在场")
  assert.deepEqual(frames.at(-1), { key: "1", delivered: null, items: [] }, "窗中止 ⇒ 状态帧（窗半归空 —— 零残留）")
  assert.deepEqual(drive.inputSnapshot("1"), [], "读面归空（未入窗径）")
})

test("T5 残输入续发（#561 AC-10）：非 Abort 失败径 ⇒ 投影随形逐条 delivered + 普通回合", async () => {
  const agent = makeAgent()
  const { drive, runs, frames } = makeDrive({ agent })
  drive.start("1", agent, { cwd: "/p" })
  drive.pushInput("1", "甲", null)
  await until(() => runs.length === 1)
  drive.pushInput("1", "乙", null) // 在飞期落槽 ⇒ 残值
  agent._asyncSubagents.clear() // 池空 ⇒ 出窗后零重开（只走残值续发）
  runs[0].rej(new Error("boom")) // 非 Abort 失败 ⇒ done 拒绝 ⇒ 出窗 + 残值续发
  await until(() => runs.length === 2)
  assert.equal(runs[1].text, "乙", "残值以普通回合续发（不静默丢）")
  assert.deepEqual(runs[1].opts.attached, null, "无图径 ⇒ 零附件")
  assert.deepEqual(frames.filter((f) => f.delivered !== null).map((f) => f.delivered.text), ["甲", "乙"], "消费回执逐条 + 保序（单写者）")
  assert.deepEqual(frames.map((f) => [f.delivered === null ? "state" : "delivered", f.items.length]), [["state", 1], ["delivered", 0], ["state", 1], ["delivered", 0]], "帧序：受理即推 ⇒ 消费帧（带项同帧退场）")
  assert.equal(drive.active("1"), false, "窗已摘（池空 ⇒ 零重开）")
  runs[1].res("done")
  await until(() => drive.inputSnapshot("1").length === 0)
})

test("T6 turn-driver 端到端：窗内 send 回执 · 两源合并读面 · 携图消费过送达面", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "wq-t6-"))
  const cwd = join(root, "proj")
  mkdirSync(cwd, { recursive: true })
  slots._setSessionsDirForTest(join(root, "sessions"))
  t.after(() => { slots._resetSessionsDirForTest() })
  const agent = makeAgent(VISION, { cwd, _pendingAsyncResults: [{ id: 1 }] }) // pending 非空 ⇒ 首轮 = 消化轮
  const events = [], runs = []
  const driver = driverMod.createTurnDriver({
    post: (ch, payload) => events.push({ ch, payload }),
    run: (a, item) => new Promise((res) => runs.push({ text: item, res })),
    bridge: () => ({}), postUsage: () => {}, projects: { currentCwd: () => cwd },
    ensure: async () => agent, forgetKey: () => {}, dropScope: () => {}, denyGates: () => {},
  })
  void driver.takeOver("1", agent) // 池活 ⇒ 入窗；pending 非空 ⇒ 首轮消化（run 悬挂 ⇒ 队列留存）
  await until(() => runs.length === 1)
  assert.deepEqual(await driver.send("1", "纯文本", null), { ok: true, queued: true }, "#564 AC-1 ∕ #561 AC-3：窗内受理同形")
  assert.deepEqual(await driver.send("1", "携图", [img()]), { ok: true, queued: true }, "#564 AC-3：携图 ⇒ 同受理（busy 拒句退场）")
  const snap = driver.queueSnapshot("1") // #564 AC-4：`history:page` `queue` 键同源供面（A9：串数组恰形）
  assert.deepEqual(snap, ["纯文本", "携图"], "快照恰形 = 串数组（图不入快照；两源合并——窗半在列）")
  const states = events.filter((e) => e.ch === "ev:queue" && e.payload.delivered === undefined)
  assert.deepEqual(states.at(-1).payload.items, ["纯文本", "携图"], "受理帧 = 状态形（items 串数组全量整置——A9）")
  runs[0].res("done") // 消化收尾 ⇒ 核 step 1 消费
  await until(() => runs.length === 2)
  assert.equal(runs[1].text, "纯文本", "窗内消费 = 普通回合（原文逐字）")
  runs[1].res("done")
  await until(() => runs.length === 3)
  assert.match(runs[2].text, /^携图\n\n\[Attached images: /, "携图消费 ⇒ 指针段入文（送达面判决）")
  const delivered = events.filter((e) => e.ch === "ev:queue" && e.payload?.delivered).map((e) => e.payload.delivered.text)
  assert.deepEqual(delivered, ["纯文本", "携图"], "消费回执逐条（入流恰一枚的宿主半）")
  agent._pendingAsyncResults.length = 0
  agent._asyncSubagents.clear()
  runs[2].res("done")
  await until(() => driver.busyOf("1") === false)
  driver.dispose("1")
})

test("T7 写面：队形回执 ⇒ 退流 + 挂起空闲复位；失败回执 ⇒ 退流 + 失败行；null 登记 ⇒ 退流零动作", async () => {
  const key = "1"
  const withUserBlock = (state, k, block) => (state?.activeSession !== k ? state : { ...state, blocks: [...(state.blocks ?? []), block] })
  const setAttachDegraded = (state, k, code) => ({ ...state, attachDegraded: { ...(state.attachDegraded ?? {}), [k]: code ?? null } })
  const built = (receipt, suspState = { "1": { active: true } }, local = true) => {
    let state = { activeSession: key, blocks: [], attachDegraded: {}, susp: suspState, tabBadges: {} }
    const loading = [], repaints = []
    const wire = wireMod.createComposerWire({
      store: { get: () => state, set: (patch) => { state = { ...state, ...patch }; return state } },
      activeKey: () => state.activeSession,
      call: async () => receipt,
      push: () => {}, panelOf: () => ({ setLoading: (v) => loading.push(v) }), repaint: () => repaints.push(1),
      onLoadingReset: () => loading.push("reset"),
      suspIdleOf: (s, k) => s?.susp?.[k]?.active === true && !(s?.tabBadges?.[k] ?? []).includes("running"),
      toImages: (list) => list, degradedCode: () => null, effortOf: () => "auto",
      withUserBlock, setAttachDegraded, applyFlags: (s) => s, openSettings: () => {},
    })
    if (local) { // 直发径本地先行出泡（case ④ = 抑制径 ⇒ 缺省不出泡）
      const block = { kind: "user", text: "本地先行" }
      state = withUserBlock(state, key, block)
      wire.noteEcho(key, block)
    }
    return { wire, loading, repaints, state: () => state }
  }
  // #597 实施轮微补（父侧直落 · 2026-09-29）：`wire.post` 经 `Promise.race` 先到者读取后多 1 微task 跳
  // ⇒ 断言前补 10ms settle（纯时序，非行为——慢断言面待微task 队列排干）。
  const settle = () => new Promise((r) => setTimeout(r, 10))
  // ① 队形回执（窗内直发径）：退流 + 挂起空闲复位（AC-9）
  const one = built({ ok: true, queued: true })
  await one.wire.post("userMessage", { text: "本地先行" })
  await settle()
  assert.equal(one.state().blocks.length, 0, "本地块退流（消费前流内零真块）")
  assert.deepEqual(one.loading, [false, "reset"], "挂起空闲复位（setLoading(false) + 缓存复位）")
  // ② 队形回执 ∧ 窗内在飞回合（running 位标在）：零复位（真回合门不误关）
  const two = built({ ok: true, queued: true }, { "1": { active: true } })
  two.state().tabBadges = { "1": ["running"] }
  await two.wire.post("userMessage", { text: "本地先行" })
  await settle()
  assert.equal(two.state().blocks.length, 0, "退流照旧")
  assert.deepEqual(two.loading, [], "零复位（running 位标在）")
  // ③ 失败回执（queue-full 反径 / busy 竞态档）：退流 + 失败行源（AC-4 ∕ AC-11）
  const three = built({ ok: false, reason: "queue-full" })
  await three.wire.post("userMessage", { text: "本地先行" })
  await settle()
  assert.equal(three.state().blocks.length, 0, "本地块退流（失败径 —— 稿逐字留 + 零块）")
  assert.equal(three.wire.failure(), "queue-full", "失败行源（B21）")
  assert.deepEqual(three.loading, [false, "reset"], "loading 复位（宿主未起跑）")
  assert.equal(three.repaints.length, 1, "提示行重挂")
  // ④ 抑制径恒登记（noteEcho null）：退流锚恒指本提交 ⇒ 既往真块不被误摘
  const four = built({ ok: true, queued: true }, { "1": { active: true } }, false)
  const older = { kind: "user", text: "既往真块" }
  four.state().blocks.push(older)
  four.wire.noteEcho(key, null) // 抑制径登记（onUserEcho 在忙态 ∕ 挂起窗径所落）
  await four.wire.post("userMessage", { text: "被抑制的提交" })
  await settle()
  assert.deepEqual(four.state().blocks, [older], "退流零动作（既往真块保全）")
})

test("T8 结构核（不可 node 装载三档）：判据单源 ∕ 抑制面 ∕ 失败径退流在场", () => {
  const chrome = text("thincoder-desktop/renderer/views/chrome.mjs")
  assert.match(chrome, /export function suspActiveOf\(state, key\)/, "判据单源在场（`busyOf` 邻位）")
  assert.match(chrome, /state\?\.susp\?\.\[key\]\?\.active === true/, "判据形（零行为变于原内联式）")
  const sync = text("thincoder-desktop/renderer/composer-sync.mjs")
  assert.match(sync, /suspActiveOf\(held, key\) \? "susp" : "idle"/, "`turnState` 改用单源（消重复直读）")
  const mount = text("thincoder-desktop/renderer/mount-composer.mjs")
  assert.match(mount, /busyOf\(held, key\) \|\| suspActiveOf\(held, key\)/, "出泡抑制面 = 忙态 ∨ 挂起窗")
  assert.match(mount, /wire\.noteEcho\(key, null\)/, "抑制径恒登记（退流锚恒指本提交）")
  assert.match(mount, /const suspIdleOf = \(state, key\) => suspActiveOf\(state, key\) && !busyOf\(state, key\)/, "挂起空闲判据 = 窗活跃 ∧ ¬忙（判据单源合成）")
  assert.match(mount, /suspIdleOf, \/\/ 挂起空闲复位判据/, "wire deps 注入在场")
  const wire = text("thincoder-desktop/renderer/composer-wire.mjs")
  assert.match(wire, /retractEcho\(key, attempt\)[^\n]*\n[^\n]*recordFailure\("msg:send", receipt\)/, "失败径退流先于失败行记录")
  assert.match(wire, /suspIdleOf\?\.\(store\.get\(\), key\) === true/, "队形支复位判据（含 ¬busy 闭合）")
})

test("T9 时序面（§2.10 定形句）：hold 占位链——signal ∕ 中断 fail-fast ∕ 占位被摘 ⇒ 零起跑 + 落盘件自清 ∧ 不重投", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "wq-t9-"))
  const cwd = join(root, "proj")
  mkdirSync(cwd, { recursive: true })
  const prepare = (body, images, agent) => deskAtt.prepareTurnAttachments(body, images, { cwd, model: agent?.provider?.model, locale: agent?.config?.locale })
  /** 假 `hold`（形同 `turn-driver.mjs` `hold`：落槽 ∕ `active()` = 槽仍属本刻 ∕ `release` 幂等；`evict()` = 占位被摘
   *  （`dispose` ∕ 切项目级联 ∕ 他人重占——三件形与会话无关，行为可观测））。 */
  const makeHold = () => {
    const order = [], signals = []
    let slot = null, releases = 0
    return {
      hold: (key) => {
        const controller = new AbortController()
        slot = { key, controller }
        signals.push(controller.signal)
        order.push("hold")
        return {
          signal: controller.signal,
          active: () => { order.push("check"); return slot?.controller === controller },
          release: () => { order.push("release"); releases += 1; if (slot?.controller === controller) slot = null },
        }
      },
      order, signals, releases: () => releases,
      evict: () => { slot = null },
      holder: () => slot,
    }
  }
  // ① 起窗 ∕ 查位 ∕ release 序 + signal 链（占位在场 ⇒ 回合照常起跑）
  const vis = makeAgent(VISION, { cwd })
  const h1 = makeHold()
  const sigs1 = []
  const a = makeDrive({ agent: vis, prepare, hold: h1.hold,
    degrade: (attached, agent, signal) => { sigs1.push(signal); return attached } })
  a.drive.start("1", vis, { cwd })
  a.drive.pushInput("1", "看图", [img("a9.png")])
  await until(() => a.runs.length === 1)
  assert.equal(sigs1[0], h1.signals[0], "降级 signal = hold.signal（起窗信号直通）")
  assert.deepEqual(h1.order, ["hold", "check", "release"], "序沿链径现式（起窗 ⇒ 查位 ⇒ release）")
  assert.equal(h1.releases(), 1, "release 一次（幂等面）")
  deskAtt.cleanupTurn(a.runs[0].opts.attached.paths)
  a.runs[0].res("done")
  a.drive.abort("1")
  await until(() => a.drive.active("1") === false)
  // ② 窗内 interrupt 命中占位 ⇒ 降级信号 abort（读图 fail-fast）；占位未被摘 ⇒ 回合照常起跑（链径同形）
  const iv = makeAgent(VISION, { cwd })
  const h2 = makeHold()
  let abortedSeen = false
  const b = makeDrive({ agent: iv, prepare, hold: h2.hold,
    degrade: (attached, agent, signal) => new Promise((resolve) => {
      const done = () => { abortedSeen = signal?.aborted === true; resolve(attached) }
      if (signal?.aborted) done()
      else signal?.addEventListener("abort", done, { once: true })
    }) })
  b.drive.start("1", iv, { cwd })
  b.drive.pushInput("1", "看图二", [img("b9.png")])
  await until(() => h2.holder() !== null) // 起窗（降级 await 窗在场）
  h2.holder().controller.abort() // `msg:interrupt` 命中占位（`interrupt` 读在飞表同点）
  await until(() => b.runs.length === 1)
  assert.equal(abortedSeen, true, "降级信号 abort（读图 fail-fast —— 与链径同形）")
  assert.equal(b.runs[0].opts.attached.paths.length, 1, "占位未被摘 ⇒ 回合照常起跑（零弃）")
  deskAtt.cleanupTurn(b.runs[0].opts.attached.paths)
  b.runs[0].res("done")
  b.drive.abort("1")
  await until(() => b.drive.active("1") === false)
  // ③ 缺缝 ∥ 零占位 ⇒ signal = null（沿链径缺省式）
  const nv = makeAgent(VISION, { cwd })
  const sigs3 = []
  const c = makeDrive({ agent: nv, prepare,
    degrade: (attached, agent, signal) => { sigs3.push(signal); return attached } })
  c.drive.start("1", nv, { cwd })
  c.drive.pushInput("1", "看图三", [img("c9.png")])
  await until(() => c.runs.length === 1)
  assert.equal(sigs3[0], null, "零占位 ⇒ signal = null")
  deskAtt.cleanupTurn(c.runs[0].opts.attached.paths)
  c.runs[0].res("done")
  c.drive.abort("1")
  await until(() => c.drive.active("1") === false)
  // ④ 占位被摘 ⇒ 零起跑 + 落盘件自清 ∧ 不重投（driveTurn 径 —— 消费帧已出——不追回）
  const dv = makeAgent(VISION, { cwd })
  const h4 = makeHold()
  const paths4 = []
  const d = makeDrive({ agent: dv, prepare, hold: h4.hold,
    degrade: (attached, agent, signal) => { paths4.push(...(attached.paths ?? [])); h4.evict(); return attached } })
  d.drive.start("1", dv, { cwd })
  d.drive.pushInput("1", "看图四", [img("d9.png")])
  await until(() => h4.releases() === 1)
  assert.equal(paths4.length, 1, "送达面落盘件一枚（prepare 判决）")
  assert.equal(d.runs.length, 0, "窗后占位被摘 ⇒ 零起跑（`runTurn` 不达）")
  assert.equal(existsSync(paths4[0]), false, "本径落盘件自清（`cleanupTurn`）")
  assert.deepEqual(d.drive.inputSnapshot("1"), [], "不重投（条目已摘——不复位）")
  assert.equal(d.frames.filter((f) => f.delivered?.text === "看图四").length, 1, "消费帧已出——不追回（恰一枚）")
  d.drive.abort("1")
  await until(() => d.drive.active("1") === false)
  // ⑤ 残续发径同判：占位被摘 ⇒ 零起跑 + 落盘件自清 + 停链（不重投）
  const rv = makeAgent(VISION, { cwd })
  const h5 = makeHold()
  const paths5 = []
  const e = makeDrive({ agent: rv, prepare, hold: h5.hold,
    degrade: (attached, agent, signal) => { paths5.push(...(attached.paths ?? [])); h5.evict(); return attached } })
  e.drive.start("1", rv, { cwd })
  e.drive.pushInput("1", "甲", null)
  await until(() => e.runs.length === 1)
  e.drive.pushInput("1", "乙", [img("e9.png")]) // 在飞期落槽 ⇒ 残值
  rv._asyncSubagents.clear() // 池空 ⇒ 出窗后零重开（只走残值续发）
  e.runs[0].rej(new Error("boom")) // 非 Abort 失败 ⇒ 出窗 + 残值续发
  await until(() => h5.releases() === 2) // ①甲消费 ②乙残续发（同判）
  assert.equal(paths5.length, 1, "残续发送达面落盘件一枚")
  assert.equal(e.runs.length, 1, "残续发占位被摘 ⇒ 零起跑（`runTurn` 不达）")
  assert.equal(existsSync(paths5[0]), false, "残续发径落盘件自清")
  assert.equal(e.frames.filter((f) => f.delivered?.text === "乙").length, 1, "不重投（消费帧恰一枚——不复位 ∕ 不追回）")
  await until(() => e.drive.active("1") === false)
  // 结构面：两调用点经守卫序列（出档 `suspension-guard.mjs`——纯结构搬）+ 转口注入（行为面难观察的接线面）
  const guardSrc = text("thincoder-desktop/src/main/suspension-guard.mjs")
  assert.equal((guardSrc.match(/held\?\.signal \?\? null/g) ?? []).length, 1, "守卫序列 signal 接 hold.signal（单点——两调用点共用）")
  const driveSrc = text("thincoder-desktop/src/main/suspension-drive.mjs")
  assert.equal((driveSrc.match(/await guardedDeliver\(/g) ?? []).length, 2, "两调用点经守卫（`driveTurn` ∕ `resumeResidual`）")
  assert.match(text("thincoder-desktop/src/main/turn-driver.mjs"), /suspension = createSuspensionDrive\(\{[\s\S]*?\bhold,/, "hold 转口注入 `createSuspensionDrive`")
  t.diagnostic(`tmp 根：${root}`)
})
