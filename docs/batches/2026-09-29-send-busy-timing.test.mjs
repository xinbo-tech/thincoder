/**
 * 2026-09-29-send-busy-timing.test.mjs — 批次本地单元件（发送忙态时机批 #597 · #596 并入 · 随批留存归档）。
 * 名随批次档 · 住批次目录 · 不进仓套件；复跑 = 从仓库根 `thincoder/`：
 *   node --import ./thincoder-desktop/test/rc-resolve.mjs --test docs/batches/2026-09-29-send-busy-timing.test.mjs
 * （导入按 `process.cwd()`（仓库根）相对解析；落位期暂存 `.thincoder/tmp/` 同名副本 = 留档，终位 = 本目录。）
 *
 * 用例 = 批次档 §2.5 测试面（① turn-driver 直测 ② composer-wire 直测 ③ badges 纯动作 ⑥ 结构核）+
 * §2.12 条 9（AC1 链路五跳机检）：
 *   T1  受理即置：恰一发 `ev:activity{turn}`（无帧值）；忙态 ∕ 窗 ∕ bad-key 径零发射（AC1① 发射端）
 *   T2  清位径①：装配抛 ⇒ 非吞回执（err 文案原样 + started:false）
 *   T3  清位径②：装配 await 期跨中止（dispose）⇒ aborted + started:false
 *   T4  清位径③：provider 无效 ⇒ provider-invalid（携 providerKind）+ started:false（#840 改钉）
 *   T5  清位径④：降级窗后查位（窗内占位被摘）⇒ aborted + started:false + 落盘件自清
 *   T6  装配窗中止（新查位）：窗内 interrupt ⇒ 零起跑 + aborted + started:false（AC3）
 *   T7  writer 失败径三例：started:false ⇒ 清位；无 started 键 ⇒ 零清位；ok 真 ⇒ 零清位（AC2 渲染半）
 *   T8  超时界：清位 + 失败行 timeout + 退流 + timer 清点（AC2 超时径/AC4）
 *   T9  迟到自愈分治：非队形 ⇒ 行清 + 块补；队形 ⇒ 行清 + 零块补；ok 假 ⇒ 零追加（AC4）
 *   T10 陈旧守卫 + E4 扩例：重发在飞 + 首次迟到 ok ⇒ 零清位追加 ∕ 行不清 ∕ 恰补一枚块 ∕ 重发照常
 *   T11 `badges.clearRunning` 纯动作（值等 ⇒ 原引用；余码保序）
 *   T12 结构核（AC1 链路五跳 + AC5 清位写者账）：四档不可 node 装载 ⇒ `text()` + 断言判据单源在场
 * 纪律：只读面 ∕ 行为断言；⌛ 面（真机读数）归父侧闭合。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-core"))) throw new Error(`从仓库根（thincoder/）运行（cwd = ${ROOT}）`)
const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)
const text = (rel) => readFileSync(resolve(ROOT, rel), "utf8")
const [driverMod, wireMod, badgesMod] = await Promise.all([
  mod("thincoder-desktop/src/main/turn-driver.mjs"),
  mod("thincoder-desktop/renderer/composer-wire.mjs"),
  mod("thincoder-desktop/renderer/badges.mjs"),
])

const KEY = "1"
const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
const img = () => PNG // IPC 附件元素形（`msg:send.images` 载荷 = dataURL 串——A1；名 ∕ mime 由核从串推）
const VISION = "claude-sonnet-4-5" // spec.multimodal === true
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const until = async (fn, ms = 8000) => { const t0 = Date.now(); while (!fn()) { if (Date.now() - t0 > ms) throw new Error("until timeout"); await sleep(5) } return true }
function deferred() { let resolve = null; const promise = new Promise((r) => { resolve = r }); return { promise, resolve } }

/** 假 agent（池空 ⇒ 池不活；`over` 可造 pending ∕ provider 形）。 */
const makeAgent = (over = {}) => ({
  title: "t", cwd: null, _slot: 1,
  _asyncSubagents: new Map(), _asyncAdvisors: new Map(), _consultSessions: new Map(), _pendingAsyncResults: [],
  provider: { name: "vis", model: VISION }, config: { locale: "zh" }, memory: { db: null },
  history: [], _fullHistory: [], ...over,
})
const turnFrames = (events) => events.filter((e) => e.ch === "ev:activity" && e.payload?.event === "turn")

/** turn-driver 夹具（假注入面齐全 —— 档头「零宿主依赖」判据可平 node 直测）。 */
function driverOf({ ensure, projects = { currentCwd: () => null } } = {}) {
  const events = [], runs = []
  const driver = driverMod.createTurnDriver({
    post: (ch, payload) => events.push({ ch, payload }),
    run: (a, item) => new Promise((res) => runs.push({ text: item, res })),
    bridge: () => ({}), postUsage: () => {}, projects,
    ensure, forgetKey: () => {}, dropScope: () => {}, denyGates: () => {},
  })
  return { driver, events, runs }
}

/** composer-wire 夹具（假 `call` 悬挂 ⇒ 用例自持 resolve；deps 同装配面形）。 */
function wireOf({ tabBadges = {}, blocks = [], sendTimeoutMs } = {}) {
  let state = { activeSession: KEY, blocks, attachDegraded: {}, tabBadges, susp: {} }
  const loading = [], repaints = [], calls = []
  const wire = wireMod.createComposerWire({
    store: { get: () => state, set: (patch) => { state = { ...state, ...patch }; return state } },
    activeKey: () => state.activeSession,
    call: (ch, payload) => new Promise((resolve) => calls.push({ ch, payload, resolve })),
    push: () => {}, panelOf: () => ({ setLoading: (v) => loading.push(v) }), repaint: () => repaints.push(1),
    onLoadingReset: () => loading.push("reset"), suspIdleOf: null,
    toImages: (list) => list, degradedCode: () => null, effortOf: () => "auto",
    withUserBlock: (s, k, block) => (s?.activeSession !== k ? s : { ...s, blocks: [...(s.blocks ?? []), block] }),
    setAttachDegraded: (s, k, code) => ({ ...s, attachDegraded: { ...(s.attachDegraded ?? {}), [k]: code ?? null } }),
    applyFlags: (s) => s, openSettings: () => {},
    ...(sendTimeoutMs === undefined ? {} : { sendTimeoutMs }),
  })
  const running = () => (state.tabBadges?.[KEY] ?? []).includes("running")
  return { wire, calls, loading, repaints, get: () => state, set: (patch) => { state = { ...state, ...patch }; return state }, running }
}

test("T1 受理即置：恰一发 ev:activity{turn}（无帧值）；忙态 ∕ bad-key 径零发射", async () => {
  const agent = makeAgent()
  const gate = deferred()
  const { driver, events, runs } = driverOf({ ensure: () => gate.promise })
  const p1 = driver.send(KEY, "甲", null) // 在飞（ensure 悬挂）
  assert.deepEqual(turnFrames(events), [{ ch: "ev:activity", payload: { key: KEY, event: "turn" } }], "受理形恰一发 ∕ 无帧值")
  // 忙态径（在飞 ⇒ 入队）：受理回执 + 零新发射
  assert.deepEqual(await driver.send(KEY, "乙", null), { ok: true, queued: true }, "忙态受理形（KD-40 ②）")
  assert.equal(turnFrames(events).length, 1, "忙态径零发射")
  // 坏键径
  assert.deepEqual(await driver.send("nope", "丙", null), { ok: false, reason: "bad-key" }, "坏键回执")
  assert.equal(turnFrames(events).length, 1, "坏键径零发射")
  gate.resolve(agent)
  assert.deepEqual(await p1, { ok: true }, "受理起跑（成功径回执照旧）")
  await until(() => runs.length === 1)
  runs[0].res("done") // 续发链消费队内「乙」
  await until(() => runs.length === 2)
  runs[1].res("done")
  await until(() => driver.busyOf(KEY) === false)
  driver.dispose(KEY)
})

test("T1b 窗径零发射：挂起窗内 send ⇒ 窗内受理回执而不发 ev:activity{turn}", async () => {
  const agent = makeAgent({ _pendingAsyncResults: [{ id: 1 }] }) // 池活 ⇒ 挂起窗
  const { driver, events, runs } = driverOf({ ensure: async () => agent })
  void driver.takeOver(KEY, agent) // 入窗（消化轮起跑 ⇒ run 悬挂）
  await until(() => runs.length === 1)
  assert.deepEqual(await driver.send(KEY, "窗内", null), { ok: true, queued: true }, "窗内受理同形")
  assert.equal(turnFrames(events).length, 0, "窗径零受理形发射")
  driver.dispose(KEY)
  runs[0].res("done")
})

test("T2 清位径①：装配抛 ⇒ 非吞回执（err 文案原样 + started:false）+ 占位摘", async () => {
  const { driver, events, runs } = driverOf({ ensure: async () => { throw new Error("assembly exploded") } })
  assert.deepEqual(await driver.send(KEY, "甲", null), { ok: false, reason: "assembly exploded", started: false }, "原文案 ∕ 零静默")
  assert.equal(driver.busyOf(KEY), false, "占位先摘（本键不再锁 busy）")
  assert.equal(runs.length, 0, "零起跑")
  assert.equal(turnFrames(events).length, 1, "受理形先发（回收由回执面承担）")
})

test("T3 清位径②：装配 await 期跨中止（dispose）⇒ aborted + started:false", async () => {
  const agent = makeAgent()
  const gate = deferred()
  const { driver, runs } = driverOf({ ensure: () => gate.promise })
  const p = driver.send(KEY, "甲", null)
  driver.dispose(KEY) // 跨中止（dispose ∕ 切项目级联等价物）
  gate.resolve(agent)
  assert.deepEqual(await p, { ok: false, reason: "aborted", started: false }, "#515② 零起跑回执")
  assert.equal(runs.length, 0, "零起跑")
})

test("T4 清位径③：provider 无效 ⇒ provider-invalid（携 providerKind）+ started:false", async () => {
  const agent = makeAgent({ _providerInvalid: true })
  const { driver, runs } = driverOf({ ensure: async () => agent })
  assert.deepEqual(await driver.send(KEY, "甲", null), { ok: false, reason: "provider-invalid", providerKind: "provider", started: false }) // #840：分类键随回执（桩 config 无人证面 ⇒ provider 类——保守）
  assert.equal(driver.busyOf(KEY), false, "占位已摘")
  assert.equal(runs.length, 0, "零起跑")
})

test("T5 清位径④：降级窗后查位（窗内占位被摘）⇒ aborted + started:false + 落盘件自清", async () => {
  const root = mkdtempSync(join(tmpdir(), "sbt-t5-"))
  const cwd = join(root, "proj")
  mkdirSync(cwd, { recursive: true })
  const agent = makeAgent({ cwd })
  let armed = false
  let driver = null
  const events = [], runs = []
  driver = driverMod.createTurnDriver({
    post: (ch, payload) => events.push({ ch, payload }),
    run: (a, item) => new Promise((res) => runs.push({ text: item, res })),
    bridge: () => ({}), postUsage: () => {},
    // 窗内摘占位（`dispose` ∕ 切项目级联等价物）：prepare 取 cwd 时触发 —— 判据位 = 降级窗后查位
    projects: { currentCwd: () => { if (armed) { armed = false; driver.dispose(KEY) } return cwd } },
    ensure: async () => agent, forgetKey: () => {}, dropScope: () => {}, denyGates: () => {},
  })
  armed = true
  assert.deepEqual(await driver.send(KEY, "甲", [img()]), { ok: false, reason: "aborted", started: false }, "窗后查位回执")
  assert.equal(runs.length, 0, "零起跑")
  const tmp = join(cwd, ".thincoder", "tmp")
  const leftovers = existsSync(tmp) ? readdirSync(tmp).filter((f) => f.startsWith("paste-")) : []
  assert.equal(leftovers.length, 0, "本回合落盘件随闸自清")
})

test("T6 装配窗中止（新查位）：窗内 interrupt ⇒ 零起跑 + aborted + started:false（AC3）", async () => {
  const agent = makeAgent()
  const gate = deferred()
  const { driver, runs } = driverOf({ ensure: () => gate.promise })
  const p = driver.send(KEY, "甲", null)
  assert.deepEqual(driver.interrupt(KEY), { ok: true }, "窗内 Stop 命中占位（abort）")
  gate.resolve(agent)
  assert.deepEqual(await p, { ok: false, reason: "aborted", started: false }, "取消为本职语义（消息未入史）")
  assert.equal(runs.length, 0, "零起跑 ∕ 零历史入账")
  assert.equal(driver.busyOf(KEY), false, "占位已 release")
})

test("T7 失败径三例：started:false ⇒ 清位；无 started 键 / ok 真 ⇒ 零清位（AC2）", async () => {
  // ① started:false（装配窗中止 ∕ 四清位）：清位 + 退流 + 失败行
  const one = wireOf()
  one.set({ tabBadges: { [KEY]: ["running"] } })
  const block1 = { kind: "user", text: "甲" }
  one.set({ blocks: [block1] })
  one.wire.noteEcho(KEY, block1)
  const p1 = one.wire.post("userMessage", { text: "甲" })
  one.calls[0].resolve({ ok: false, reason: "aborted", started: false })
  await p1
  await sleep(10) // `post` 同步派发（返 void）—— 等结算微task 落定
  assert.equal(one.running(), false, "位标回收（clearRunning 单点）")
  assert.equal(one.wire.failure()?.reason, "aborted", "失败行（reason 原样——载体 {reason, kind}，#840）")
  assert.equal(one.get().blocks.length, 0, "本地块退流")
  // ② 无 started 键（bad-key ∕ queue-full 等既有拒）：位标属在飞回合 ⇒ 零清位
  const two = wireOf()
  two.set({ tabBadges: { [KEY]: ["running"] } })
  const p2 = two.wire.post("userMessage", { text: "乙" })
  two.calls[0].resolve({ ok: false, reason: "queue-full" })
  await p2
  await sleep(10)
  assert.equal(two.running(), true, "在飞回合位标不动（非 started:false 径）")
  assert.equal(two.wire.failure()?.reason, "queue-full", "失败行照旧")
  // ③ ok 真（受理径）：零清位
  const three = wireOf()
  three.set({ tabBadges: { [KEY]: ["running"] } })
  const p3 = three.wire.post("userMessage", { text: "丙" })
  three.calls[0].resolve({ ok: true })
  await p3
  await sleep(10)
  assert.equal(three.running(), true, "受理径零清位")
  assert.equal(three.wire.failure(), null, "受理径清 B21")
})

test("T8 超时界：清位 + 失败行 timeout + 退流 + timer 清点（AC2 超时径 ∕ AC4）", async () => {
  // 超时径
  const one = wireOf({ sendTimeoutMs: 20 })
  one.set({ tabBadges: { [KEY]: ["running"] } })
  const block = { kind: "user", text: "甲" }
  one.set({ blocks: [block] })
  one.wire.noteEcho(KEY, block)
  await one.wire.post("userMessage", { text: "甲" }) // 回执悬挂 ⇒ timer 先到
  await until(() => one.wire.failure()?.reason === "timeout")
  assert.equal(one.running(), false, "清位（本尝试仍最新 ∧ 位标在场）")
  assert.equal(one.wire.failure()?.reason, "timeout", "失败行 timeout")
  assert.equal(one.get().blocks.length, 0, "退流")
  // ok 先到 ⇒ timer 清点（窗口过后零副作用）
  const two = wireOf({ sendTimeoutMs: 20 })
  two.set({ tabBadges: { [KEY]: ["running"] } })
  const p2 = two.wire.post("userMessage", { text: "乙" })
  two.calls[0].resolve({ ok: true })
  await p2
  await sleep(50)
  assert.equal(two.wire.failure(), null, "timer 已清点（零迟到副作用）")
  assert.equal(two.running(), true, "受理径位标不动")
})

test("T9 迟到自愈分治：非队形 ⇒ 行清 + 块补；队形 ⇒ 行清 + 零块补；ok 假 ⇒ 零追加（AC4）", async () => {
  // 非队形迟到 ok（见 T8 邻例）；本用例证分治两支
  const one = wireOf({ sendTimeoutMs: 20 })
  one.set({ tabBadges: { [KEY]: ["running"] } })
  await one.wire.post("userMessage", { text: "甲" })
  await until(() => one.wire.failure()?.reason === "timeout")
  assert.equal(one.wire.failure()?.reason, "timeout", "超时先行")
  one.calls[0].resolve({ ok: true })
  await until(() => one.wire.failure() === null)
  assert.equal(one.get().blocks.length, 1, "恰补一枚块（「每受理消息恰一枚块」不变式恢复）")
  // 队形迟到 ⇒ 零块补（退流态保持；消费时刻由队径补写）
  const two = wireOf({ sendTimeoutMs: 20 })
  two.set({ tabBadges: { [KEY]: ["running"] } })
  await two.wire.post("userMessage", { text: "乙" })
  await until(() => two.wire.failure()?.reason === "timeout")
  two.calls[0].resolve({ ok: true, queued: true })
  await until(() => two.wire.failure() === null)
  assert.equal(two.get().blocks.length, 0, "队形 ⇒ 退流态保持（零块补）")
  // 失败迟到值 ⇒ 零追加（超时已清口）
  const three = wireOf({ sendTimeoutMs: 20 })
  three.set({ tabBadges: { [KEY]: ["running"] } })
  await three.wire.post("userMessage", { text: "丙" })
  await until(() => three.wire.failure()?.reason === "timeout")
  three.calls[0].resolve({ ok: false, reason: "aborted" })
  await sleep(20)
  assert.equal(three.wire.failure()?.reason, "timeout", "零追加（迟到失败不改行）")
  assert.equal(three.get().blocks.length, 0, "零块补")
})

test("T10 陈旧守卫 + E4 扩例：重发在飞 + 首次迟到 ok ⇒ 零清位 ∕ 行不清 ∕ 恰补一枚块 ∕ 重发照常", async () => {
  const w = wireOf({ sendTimeoutMs: 20 })
  w.set({ tabBadges: { [KEY]: ["running"] } })
  await w.wire.post("userMessage", { text: "甲" }) // #1 超时
  await until(() => w.wire.failure()?.reason === "timeout")
  assert.equal(w.wire.failure()?.reason, "timeout", "#1 超时先行")
  const p2 = w.wire.post("userMessage", { text: "甲" }) // 重发 #2（回执悬挂）
  w.set({ tabBadges: { [KEY]: ["running"] } }) // #2 受理位（受理即置）
  w.calls[0].resolve({ ok: true }) // #1 迟到 ok（陈旧）
  await until(() => w.get().blocks.length === 1)
  assert.equal(w.running(), true, "① 零清位追加（陈旧守卫 —— #2 受理位在场）")
  assert.equal(w.wire.failure()?.reason, "timeout", "② 失败行不清（行槽属后续尝试面）")
  assert.equal(w.get().blocks.length, 1, "③ 恰补一枚块（#1 —— 消息级不变式）")
  w.calls[1].resolve({ ok: true }) // #2 回执照常
  await until(() => w.wire.failure() === null)
  assert.equal(w.get().blocks.length, 1, "④ 重发回执照常（两径互不吞）")
  await p2
})

test("T11 badges.clearRunning 纯动作：摘 running（值等 ⇒ 原引用；余码保序）", () => {
  const state = { tabBadges: { [KEY]: ["approval", "running", "done"] }, other: 1 }
  const next = badgesMod.clearRunning(state, KEY)
  assert.deepEqual(next.tabBadges[KEY], ["approval", "done"], "摘除 running（余码保序）")
  assert.equal(next.other, 1, "其余键保形")
  assert.equal(badgesMod.clearRunning(next, KEY), next, "值等 ⇒ 原引用（零通知）")
  const empty = { tabBadges: {} }
  assert.equal(badgesMod.clearRunning(empty, "9"), empty, "缺键 ⇒ 原引用")
  assert.equal(badgesMod.clearRunning(null, KEY), null, "空态零抛（原引用）")
})

test("T12 结构核（AC1 链路五跳 + AC5 清位写者账）：判据单源在场", () => {
  // 发射端（受理即置单点）
  const driver = text("thincoder-desktop/src/main/turn-input.mjs")
  assert.equal((driver.match(/post\("ev:activity", \{ key, event: "turn" \}\)/g) ?? []).length, 1, "受理形发射单点（恰一发）")
  // ① 归约面：无帧 turn 入受理支 ⇒ 置 running（写者唯一）
  const events = text("thincoder-desktop/renderer/events.mjs")
  assert.match(events, /if \(ev\.event !== "turn"\) return state/, "支判据纳无帧 {event:\"turn\"}（非 turnBreak ∕ 非回合尾）")
  assert.match(events, /badgeStamps\(badges, ev\.key, "running", true\)/, "置位单点（badgeStamps —— 归约面）")
  // ② 忙态判据 = 位标含 running
  const chrome = text("thincoder-desktop/renderer/views/chrome.mjs")
  assert.match(chrome, /export function busyOf\(state, key\)[\s\S]{0,200}?includes\("running"\)/, "busyOf = 位标含 running（单源）")
  // ③ turnState 支同源 busyOf；④ syncBusy ⇒ setLoading（两钮显隐同一派生）
  const sync = text("thincoder-desktop/renderer/composer-sync.mjs")
  assert.match(sync, /if \(busyOf\(held, key\)\) return "running"/, "turnState 支 = busyOf")
  assert.match(sync, /panel\.setLoading\(busy\)/, "syncBusy ⇒ setLoading（同帧齐切）")
  // ⑤ 核件两钮判据 = busyState()（端 turnState 派生）
  const panel = text("thincoder-render-core/composer/panel.mjs")
  assert.match(panel, /ctx\.sendBtn\.style\.display = busyState\(\) === "running"/, "Send 判据 = busyState()")
  assert.match(panel, /ctx\.abortBtn\.style\.display = busyState\(\) === "running"/, "Stop 同派生点")
  // AC5 清位写者账：清位单点导出 + 渲染面调用点闭集 = 失败径 + 超时径两支
  const badges = text("thincoder-desktop/renderer/badges.mjs")
  assert.match(badges, /export function clearRunning\(state, key\)/, "清位单点导出（badges.mjs 导出面）")
  const wire = text("thincoder-desktop/renderer/composer-wire.mjs")
  assert.equal((wire.match(/clearRunning\(/g) ?? []).length, 2, "renderer 清位调用点闭集 = 两支（零其它清写）")
})
