/**
 * susp-queue-window.test.mjs — 批次本地单元件（#561「消费前流内零块」批 · **挂起窗径**实施轮）·
 * 任务书 = `docs/batches/2026-09-29-desktop-susp-queue.md` §2.5 AC-1–AC-8 + §2.9 补记 AC-9 ∕ AC-10 ∕ AC-11 之可用例面。
 * **落位 = 暂存件**（住 `.thincoder/tmp/`——该目录被 git 忽略、不入版本库）：终位 = `docs/batches/2026-09-29-desktop-susp-queue.test.mjs`
 * （名随批次档 · 随批留存 · 由父侧收口转正）；不入仓套件（全清令：仓套件不写 ∕ 不改 ∕ 不跑）。
 *
 * 复跑（cwd = 仓库根，即含 `thincoder-core/` 的目录）：
 *   node --test .thincoder/tmp/susp-queue-window.test.mjs            # 暂存位
 *   node --test docs/batches/2026-09-29-desktop-susp-queue.test.mjs # 转正后（终位）
 * （`/rc/` 解析钩子 = 本档内注册 —— 渲染档取核件走平 node 同源解析，与 `thincoder-desktop/test/rc-resolve.mjs` 同法。）
 *
 * 用例 ↔ 判据（档 §2.5）：
 *   W1 AC-3 窗内受理 = 受理帧（状态形）∥ 消费帧（回执形）· 未入窗 ⇒ 不受理（busy 竞态防御档返回半）
 *   W2 AC-1 消费前零流内块（归约面零块 + 原引用）∧ 待发送带在场（`[data-pending-item][data-raw]` 逐字）∧ 抑制面结构
 *   W3 AC-2 消费时刻入流恰一枚（`delivered` 单写者归约）∧ 带项同帧退场 ∧ 键门 ∧ ts 缺省不携
 *   W4 AC-4 ∕ AC-11 失败径退流（queue-full ∕ busy）＋ 失败行 ＋ 重试成功恰一枚 ＋ 召回面（核件输入历史）在场
 *   W5 AC-3 ∕ AC-5 端到端：窗内 send 同形回执（文本 ∕ 携附件）＋ `queueSnapshot` 两源合并（`history:page` 同源）
 *   W6 AC-6 窗中止 ⇒ 清队 + 空快照帧 + 读面归零（零残留）
 *   W7 AC-9 挂起空闲复位（窗空闲 ⇒ 复位；窗内在飞 ⇒ 零复位；非窗 ⇒ 零复位）
 *   W8 AC-10 残输入续发：逐条 `delivered` + 普通回合（零重复）
 *   W9 AC-7 结构性零改机检（核件作曲面目录 ∕ VSC 排队标记件 vs HEAD 零 diff；全树 diff 面 = 父侧读数）
 *   W10 AC-8 其余可见面零动（QUEUE_MAX 语义 ∕ 段 14 源 ∕ 通道表 23 ∕ preload 白名单 23 ∕ 词键零新退）
 * 纪律：行为断言优先 ∕ 结构断言只落机器可核形；真机面（AC-1 ∕ AC-4 后半等）归父侧闭合。
 * ⛔ 本档零头不重造：所验实现落于合并实施轮（载体 = `docs/batches/2026-09-29-desktop-window-queue-parity.md` §5/§6）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { existsSync, mkdirSync, mkdtempSync, readFileSync } from "node:fs"
import { registerHooks } from "node:module"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-core"))) throw new Error(`从仓库根（含 thincoder-core/）运行：cwd = ${ROOT}`)
const rcRoot = resolve(ROOT, "thincoder-render-core")
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("/rc/")) {
      return { url: pathToFileURL(join(rcRoot, specifier.slice(4))).href, shortCircuit: true }
    }
    return nextResolve(specifier, context)
  },
})
const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)
const text = (rel) => readFileSync(resolve(ROOT, rel), "utf8")

const [slices, pending, wireMod, driveMod, driverMod, slots] = await Promise.all([
  mod("thincoder-desktop/renderer/events-slices.mjs"), // `ev:queue` 归约（onQueue）
  mod("thincoder-desktop/renderer/views/chat-pending.mjs"), // 待发送带构树
  mod("thincoder-desktop/renderer/composer-wire.mjs"), // 写面（队形退流 ∕ 复位 ∕ 失败径）
  mod("thincoder-desktop/src/main/suspension-drive.mjs"),
  mod("thincoder-desktop/src/main/turn-driver.mjs"),
  mod("thincoder-desktop/node_modules/@thincoder/core/session-slots.mjs"),
])

const KEY = "1"
const VISION = "claude-sonnet-4-5" // spec.multimodal === true
const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
const until = async (fn, ms = 8000) => {
  const t0 = Date.now()
  while (!fn()) {
    if (Date.now() - t0 > ms) throw new Error("until timeout")
    await new Promise((r) => setTimeout(r, 5))
  }
  return true
}
const settle = () => new Promise((r) => setTimeout(r, 10))

/** 假 agent（池表三件显式在场 ⇒ `poolLive` 真值可控）；`pending` 空 ⇒ 不触发首轮消化。 */
const makeAgent = (model = VISION, over = {}) => ({
  title: "t", cwd: null, _slot: 1,
  _asyncSubagents: new Map([["s1", { status: "running" }]]),
  _asyncAdvisors: new Map(), _consultSessions: new Map(), _pendingAsyncResults: [],
  provider: { name: "vis", model }, config: { locale: "zh" }, memory: { db: null },
  history: [], _fullHistory: [], ...over,
})

/** 挂起驱动装配（假 `postQueue` ⇒ 帧面全录；时钟两缝假注入 ⇒ 零真实闩）。 */
function makeDrive({ agent } = {}) {
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
    runTurn, postQueue,
    timer: () => ({ unref() {} }), clear: () => {},
  })
  return { drive, runs, frames, events }
}

/** 归约面初态（`following` / `pendingNew` = 回底切片在场 —— 块追加径真实形状）。 */
const seedState = (over = {}) => ({
  activeSession: KEY, blocks: [], pending: {}, attachDegraded: {}, susp: {}, tabBadges: {},
  following: true, pendingNew: 0, ...over,
})

test("W1 AC-3 窗内受理 = 受理帧（状态形）∥ 消费帧（回执形）· 未入窗不受理", async () => {
  const agent = makeAgent()
  const { drive, runs, frames } = makeDrive({ agent })
  assert.equal(drive.pushInput(KEY, "甲", null), false, "未入窗 ⇒ 不受理（busy 竞态防御档的返回半）")
  assert.deepEqual(frames, [], "未入窗 ⇒ 零帧")
  assert.equal(drive.start(KEY, agent, { cwd: "/p" }), true, "池活 ⇒ 入窗")
  assert.equal(drive.pushInput(KEY, "甲", null), true, "窗内受理（入队）")
  assert.deepEqual(frames.map((f) => [f.delivered === null ? "state" : "delivered", f.items.map((e) => e.text)]), [["state", ["甲"]]], "受理帧 = 状态形（受理即推）")
  await until(() => runs.length === 1)
  assert.equal(runs[0].text, "甲", "消费点 = 窗内用户回合（原文逐字）")
  assert.deepEqual(frames.map((f) => [f.delivered === null ? "state" : "delivered", f.items.map((e) => e.text)]), [["state", ["甲"]], ["delivered", []]], "消费帧 = 消费回执形（带项同帧退场）")
  assert.equal(frames[1].delivered.text, "甲", "回执文本逐字")
  assert.equal(typeof frames[1].delivered.ts, "number", "回执 ts = 入队现刻（真值）")
  runs[0].res("done")
  drive.abort(KEY)
  await until(() => drive.active(KEY) === false)
  // 回执三态形（受理 ⇒ queued ∕ 满 ⇒ queue-full（#625）∕ busy 竞态防御档——此处核结构单源）
  const driverSrc = text("thincoder-desktop/src/main/turn-input.mjs")
  assert.match(driverSrc, /suspension\.pushInput\(key, String\(text \?\? ""\), images\)[\s\S]{0,600}?routed === "full"[\s\S]{0,200}?queue-full[\s\S]{0,300}?routed \? \{ ok: true, queued: true \} : \{ ok: false, reason: "busy" \}/, "窗支回执三态：受理 ⇒ queued 同形；满 ⇒ queue-full（#625）；否则 busy（竞态防御档）")
})

test("W2 AC-1 消费前零流内块 ∧ 待发送带在场（归约面 + 带面构树 + 抑制面结构）", () => {
  const base = seedState()
  const after = slices.onQueue(base, { key: KEY, items: ["甲"] })
  assert.equal(after.blocks.length, 0, "受理快照 ⇒ 流内零块（data-blocks 计数不变）")
  assert.equal(after.blocks, base.blocks, "blocks 切片原引用（零块写入——本帧仅 pending 镜面变更）")
  assert.deepEqual(after.pending[KEY], ["甲"], "镜面整置（带面数据源）")
  const group = pending.pendingGroupNode({ pending: after.pending[KEY] })
  const item = group.children.find((c) => c.props && c.props["data-pending-item"] !== undefined)
  assert.equal(item.props["data-raw"], "甲", "带面项锚 = [data-pending-item][data-raw] = 提交文本逐字")
  assert.equal(pending.pendingGroupNode({ pending: [] }), null, "空 ⇒ 带退场（零节点）")
  // 抑制面（DOM 档不可平 node 装载 ⇒ 结构机检）：窗内提交零本地块 + 抑制径恒登记
  const mount = text("thincoder-desktop/renderer/mount-composer.mjs")
  assert.match(mount, /busyOf\(held, key\) \|\| suspActiveOf\(held, key\)/, "出泡抑制面 = 忙态 ∨ 挂起窗（窗内提交零本地块）")
  assert.match(mount, /wire\.noteEcho\(key, null\)/, "抑制径恒登记（退流锚恒指本提交——防误摘既往真块）")
})

test("W3 AC-2 消费时刻入流恰一枚 ∧ 带项同帧退场（键门 + ts 缺省不携）", () => {
  const state = seedState({ pending: { [KEY]: ["甲"] } })
  const delivered = slices.onQueue(state, { key: KEY, items: [], delivered: { text: "甲", ts: 1700000000000 } })
  assert.equal(delivered.blocks.length, 1, "恰一枚 user 块入流（ev:queue.delivered 单写者）")
  assert.deepEqual(delivered.blocks[0], { kind: "user", text: "甲", ts: 1700000000000 }, "块形与回放同形（ts 携）")
  assert.deepEqual(delivered.pending[KEY], [], "带项同帧退场")
  assert.equal(pending.pendingGroupNode({ pending: delivered.pending[KEY] }), null, "带面退场（零节点）")
  const other = slices.onQueue(state, { key: "2", items: [], delivered: { text: "甲" } })
  assert.equal(other.blocks.length, 0, "键门 = 活动会话（非活动会话 ⇒ 零块）")
  const noTs = slices.onQueue(state, { key: KEY, items: [], delivered: { text: "乙" } })
  assert.deepEqual(noTs.blocks[0], { kind: "user", text: "乙" }, "ts 缺省不携（禁假造）")
})

test("W4 AC-4 ∕ AC-11 失败径退流 + 失败行 + 重试恰一枚 + 召回面在场", async () => {
  const withUserBlock = (state, k, block) => (state?.activeSession !== k ? state : { ...state, blocks: [...state.blocks, block] })
  const setAttachDegraded = (state, k, code) => ({ ...state, attachDegraded: { ...state.attachDegraded, [k]: code ?? null } })
  const built = (receipt, { susp = { [KEY]: { active: true } }, badges = [], local = true } = {}) => {
    let state = seedState({ susp, tabBadges: { [KEY]: badges } })
    const loading = [], repaints = []
    const wire = wireMod.createComposerWire({
      store: { get: () => state, set: (next) => { state = { ...state, ...next }; return state } }, // 单状态树形：补丁逐键合并（真 store 同形）
      activeKey: () => state.activeSession,
      call: async () => receipt,
      push: () => {},
      panelOf: () => ({ setLoading: (v) => loading.push(v) }),
      repaint: () => repaints.push(1),
      onLoadingReset: () => loading.push("reset"),
      suspIdleOf: (s, k) => s?.susp?.[k]?.active === true && !(s?.tabBadges?.[k] ?? []).includes("running"),
      toImages: (list) => list, degradedCode: () => null, effortOf: () => "auto",
      withUserBlock, setAttachDegraded, applyFlags: (s) => s, openSettings: () => {},
    })
    if (local) { // 直发径本地先行出泡（正径——被回执言队形 ∕ 失败时应退流）
      const block = { kind: "user", text: "本地先行" }
      state = withUserBlock(state, KEY, block)
      wire.noteEcho(KEY, block)
    }
    return { wire, loading, repaints, state: () => state }
  }
  // ① queue-full（在飞队满 + 直发径）：退流 + 失败行
  const full = built({ ok: false, reason: "queue-full" })
  await full.wire.post("userMessage", { text: "本地先行" })
  await settle()
  assert.equal(full.state().blocks.length, 0, "本地块退流（消费前流内零块）")
  assert.equal(full.wire.failure(), "queue-full", "失败行源在场（[data-notice=send-failed] 行源）")
  assert.equal(full.repaints.length, 1, "提示行重挂（失败行可见）")
  // ② busy（窗径竞态防御档——同处置：零块 + 失败行）
  const busy = built({ ok: false, reason: "busy" })
  await busy.wire.post("userMessage", { text: "本地先行" })
  await settle()
  assert.equal(busy.state().blocks.length, 0, "busy 径同处置：零流内块")
  assert.equal(busy.wire.failure(), "busy", "失败行在场")
  // ③ 重试成功（本地先行重现 + 受理回执）：恰一枚块（无重复）
  const retry = built({ ok: true }) // built ⇒ 重试提交的本地先行块一枚（本地先行径）
  await retry.wire.post("userMessage", { text: "本地先行" })
  await settle()
  assert.equal(retry.state().blocks.length, 1, "重试成功 ⇒ 恰一枚块（零双现）")
  assert.equal(retry.wire.failure(), null, "受理径清失败行")
  // ④ 文本召回面（既有单源——核件输入历史）：结构在场
  const panel = text("thincoder-render-core/composer/panel.mjs")
  assert.match(panel, /navigateInputHistory/, "输入历史 ↑ 召回面在场（既有单源）")
  assert.match(text("thincoder-desktop/renderer/mount-composer.mjs"), /from "\/rc\/composer\/panel\.mjs"/, "桌面装配 = 同一核件面板（召回面同件可达）")
})

test("W5 AC-3 ∕ AC-5 端到端：窗内 send 同形回执 + queueSnapshot 两源合并", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "sq-w5-"))
  const cwd = join(root, "proj")
  mkdirSync(cwd, { recursive: true })
  slots._setSessionsDirForTest(join(root, "sessions"))
  t.after(() => { slots._resetSessionsDirForTest() })
  const agent = makeAgent(VISION, { cwd, _pendingAsyncResults: [{ id: 1 }] }) // pending 非空 ⇒ 首轮 = 消化轮（窗在场）
  const events = [], runs = []
  const driver = driverMod.createTurnDriver({
    post: (ch, payload) => events.push({ ch, payload }),
    run: (a, item) => new Promise((res) => runs.push({ text: item, res })),
    bridge: () => ({}), postUsage: () => {}, projects: { currentCwd: () => cwd },
    ensure: async () => agent, forgetKey: () => {}, dropScope: () => {}, denyGates: () => {},
  })
  void driver.takeOver(KEY, agent)
  await until(() => runs.length === 1)
  assert.deepEqual(await driver.send(KEY, "纯文本", null), { ok: true, queued: true }, "AC-3 窗内文本提交 ⇒ 受理回执（queued 同形）")
  assert.deepEqual(await driver.send(KEY, "携图", [PNG]), { ok: true, queued: true }, "AC-3 窗内携附件 ⇒ 同受理（同回执形——载具层携图）")
  assert.deepEqual(driver.queueSnapshot(KEY), ["纯文本", "携图"], "AC-5 queue 键 = 两源合并快照（窗半在列；串数组恰形）")
  const states = events.filter((e) => e.ch === "ev:queue" && e.payload?.delivered === undefined)
  assert.deepEqual(states.at(-1).payload.items, ["纯文本", "携图"], "AC-3 受理 ⇒ 状态形（items 含该条）")
  runs[0].res("done")
  await until(() => runs.length === 2)
  assert.equal(runs[1].text, "纯文本", "窗落定消费 = 窗内用户回合")
  runs[1].res("done")
  await until(() => runs.length === 3)
  assert.match(runs[2].text, /^携图\n\n\[Attached images: /, "携图消费 ⇒ 图随回合送达（指针段——既成送达面）")
  const delivered = events.filter((e) => e.ch === "ev:queue" && e.payload?.delivered).map((e) => e.payload.delivered.text)
  assert.deepEqual(delivered, ["纯文本", "携图"], "AC-2 消费回执逐条（单写者——入流恰一枚的宿主半）")
  agent._pendingAsyncResults.length = 0
  agent._asyncSubagents.clear()
  runs[2].res("done")
  await until(() => driver.busyOf(KEY) === false)
  driver.dispose(KEY)
})

test("W6 AC-6 窗中止 ⇒ 清队 + 空快照帧 + 读面归零（零残留）", async () => {
  const agent = makeAgent()
  const { drive, runs, frames, events } = makeDrive({ agent })
  drive.start(KEY, agent, { cwd: "/p" })
  drive.pushInput(KEY, "甲", null)
  await until(() => runs.length === 1)
  drive.pushInput(KEY, "乙", null) // 在飞期落槽 ⇒ 残值
  assert.deepEqual(drive.inputSnapshot(KEY).map((e) => e.text), ["乙"], "残值在投影（带面数据源）")
  drive.abort(KEY)
  await until(() => drive.active(KEY) === false)
  assert.deepEqual(frames.at(-1), { key: KEY, delivered: null, items: [] }, "窗中止 ⇒ 空快照帧（带退场——零残留）")
  assert.deepEqual(drive.inputSnapshot(KEY), [], "读面归零")
  assert.equal(events.some((e) => e.ch === "ev:susp" && e.payload?.active === false), true, "出窗帧在场（ev:susp active:false）")
})

test("W7 AC-9 挂起空闲复位（窗空闲 ⇒ 复位；窗内在飞 ∕ 非窗 ⇒ 零复位）", async () => {
  const withUserBlock = (state, k, block) => (state?.activeSession !== k ? state : { ...state, blocks: [...state.blocks, block] })
  const setAttachDegraded = (state, k, code) => ({ ...state, attachDegraded: { ...state.attachDegraded, [k]: code ?? null } })
  const built = (susp, badges) => {
    let state = seedState({ susp, tabBadges: { [KEY]: badges } })
    const loading = []
    const wire = wireMod.createComposerWire({
      store: { get: () => state, set: (next) => { state = { ...state, ...next }; return state } }, // 单状态树形：补丁逐键合并（真 store 同形）
      activeKey: () => state.activeSession,
      call: async () => ({ ok: true, queued: true }),
      push: () => {}, panelOf: () => ({ setLoading: (v) => loading.push(v) }), repaint: () => {},
      onLoadingReset: () => loading.push("reset"),
      suspIdleOf: (s, k) => s?.susp?.[k]?.active === true && !(s?.tabBadges?.[k] ?? []).includes("running"),
      toImages: (list) => list, degradedCode: () => null, effortOf: () => "auto",
      withUserBlock, setAttachDegraded, applyFlags: (s) => s, openSettings: () => {},
    })
    const block = { kind: "user", text: "本地先行" }
    state = withUserBlock(state, KEY, block)
    wire.noteEcho(KEY, block)
    return { wire, loading, state: () => state }
  }
  const idle = built({ [KEY]: { active: true } }, [])
  await idle.wire.post("userMessage", { text: "本地先行" })
  await settle()
  assert.equal(idle.state().blocks.length, 0, "队形回执 ⇒ 本地块退流")
  assert.deepEqual(idle.loading, [false, "reset"], "窗内空闲 ⇒ setLoading(false) + onLoadingReset()（假 affordance 零）")
  const running = built({ [KEY]: { active: true } }, ["running"])
  await running.wire.post("userMessage", { text: "本地先行" })
  await settle()
  assert.deepEqual(running.loading, [], "窗内在飞回合（running 位标在）⇒ 零复位（真回合门不误关）")
  const outside = built({}, [])
  await outside.wire.post("userMessage", { text: "本地先行" })
  await settle()
  assert.deepEqual(outside.loading, [], "非窗 ⇒ 零复位（判据 = 窗活跃 ∧ ¬忙）")
  // 生产判据 ∕ 注入点结构机检（替身判据之外的漂移护栏 —— 判据单源 = mount-composer）
  const mount = text("thincoder-desktop/renderer/mount-composer.mjs")
  assert.match(mount, /const suspIdleOf = \(state, key\) => suspActiveOf\(state, key\) && !busyOf\(state, key\)/, "生产判据 = `suspActiveOf ∧ ¬busyOf`（判据单源合成）")
  assert.match(mount, /suspIdleOf, \/\/ 挂起空闲复位判据/, "生产注入点在场（wire deps）")
})

test("W8 AC-10 残输入续发：逐条 delivered + 普通回合（零重复）", async () => {
  const agent = makeAgent()
  const { drive, runs, frames } = makeDrive({ agent })
  drive.start(KEY, agent, { cwd: "/p" })
  drive.pushInput(KEY, "甲", null)
  await until(() => runs.length === 1)
  drive.pushInput(KEY, "乙", null) // 在飞期落槽 ⇒ 残值
  agent._asyncSubagents.clear() // 池空 ⇒ 出窗后零重开（只走残值续发）
  runs[0].rej(new Error("boom")) // 非 Abort 失败 ⇒ 出窗 + 残值续发
  await until(() => runs.length === 2)
  assert.equal(runs[1].text, "乙", "残值以普通回合续发（不静默丢）")
  assert.notEqual(runs[1].opts?.autoTurn, true, "普通回合（非 autoTurn）")
  assert.deepEqual(frames.filter((f) => f.delivered).map((f) => f.delivered.text), ["甲", "乙"], "消费回执逐条 + 保序（单写者）")
  assert.equal(frames.filter((f) => f.delivered?.text === "乙").length, 1, "恰一枚（零重复）")
  runs[1].res("done")
  await until(() => drive.inputSnapshot(KEY).length === 0)
  assert.equal(drive.active(KEY), false, "窗已摘（池空 ⇒ 零重开）")
})

test("W9 AC-7 VSC ∥ 核件结构性零改（机检：共用件 vs HEAD 零 diff）", () => {
  const clean = (path) => {
    const r = spawnSync("git", ["status", "--porcelain", "--", path], { cwd: ROOT, encoding: "utf8" })
    assert.equal(r.status, 0, `git status 可执行（${path}）：${r.stderr ?? ""}`)
    return r.stdout.trim() === ""
  }
  assert.equal(clean("thincoder-render-core/composer/panel.mjs"), true, "核件面板（桌面 ∕ VSC 共用件——本批不触核件的结构性判据）零改")
  assert.equal(clean("thincoder-render-core/composer"), true, "核件作曲面目录（共用件全档）零改")
  assert.equal(clean("thincoder-vscode/webview/queued-mark.js"), true, "VSC 排队标记件零改（VSC 消费面逐字零变）")
  const faces = [
    "thincoder-desktop/src/main/turn-driver.mjs",
    "thincoder-desktop/src/main/suspension-drive.mjs",
    "thincoder-desktop/src/main/window-queue.mjs",
    "thincoder-desktop/renderer/composer-wire.mjs",
    "thincoder-desktop/renderer/mount-composer.mjs",
    "thincoder-desktop/renderer/composer-sync.mjs",
    "thincoder-desktop/renderer/views/chrome.mjs",
  ]
  for (const face of faces) {
    assert.equal(existsSync(resolve(ROOT, face)), true, `实施文件表在场：${face}`)
    assert.equal(/["']thincoder-vscode\//.test(text(face)), false, `${face}：零 VSC 跨树取件（静态 ∕ 动态 import 同判）`)
  }
  assert.equal(/["']thincoder-vscode\//.test(text("thincoder-desktop/src/main/turn-chain.mjs")), false, "turn-chain.mjs（帧构造单点保位）零 VSC 跨树取件")
  // 全树 `git diff --stat` 面（thincoder-render-core/** ∥ thincoder-vscode/**）含他批在途改动——批归属读数 ∕ 父侧收口面（本档 §5 在册）
})

test("W10 AC-8 其余可见面零动（QUEUE_MAX ∕ 段 14 源 ∕ 通道表 23 ∕ 词键零新退）", async () => {
  const queue = await mod("thincoder-desktop/renderer/queue.mjs")
  const core = await import(pathToFileURL(resolve(ROOT, "thincoder-core/queued.mjs")).href)
  assert.equal(queue.QUEUE_MAX, core.QUEUED_MAX_ITEMS, "QUEUE_MAX 语义 = 核单源（零改）")
  const statusline = text("thincoder-desktop/renderer/views/statusline.mjs")
  assert.match(statusline, /pending: state\?\.pending \?\? \{\}/, "段 14 源 = 待发送镜面（两源共镜随动）")
  const subscribe = text("thincoder-desktop/renderer/events-subscribe.mjs")
  const channels = subscribe.match(/const CHANNELS = \[[\s\S]*?\]/)[0].match(/"[^"]+"/g) ?? []
  assert.equal(channels.length, 23, "通道表 23 项（零新通道）")
  const preload = text("thincoder-desktop/src/preload/preload.cjs")
  const allow = preload.match(/EVENT_CHANNELS = Object\.freeze\(\[[\s\S]*?\]\)/)[0].match(/"[^"]+"/g) ?? []
  assert.equal(allow.length, 23, "preload 白名单 23 项（零新退）")
  // 词键零新退：实施面四档引用之词键皆可解析（缺键回落键名 ⇒ `t(key) === key` 即缺键）
  const i18n = await mod("thincoder-desktop/renderer/i18n.mjs")
  const faces = [
    "thincoder-desktop/renderer/mount-composer.mjs",
    "thincoder-desktop/renderer/composer-sync.mjs",
    "thincoder-desktop/renderer/views/chrome.mjs",
    "thincoder-desktop/renderer/views/chat-pending.mjs",
  ]
  const keys = new Set()
  for (const face of faces) for (const m of text(face).matchAll(/\bt\(\s*"([^"]+)"/g)) keys.add(m[1])
  assert.equal(keys.size > 0, true, "词键取样非空")
  for (const key of keys) assert.notEqual(i18n.t(key), key, `词键在场（非新键）：${key}`)
  assert.notEqual(i18n.t("input.slotFull"), "input.slotFull", "AC-8 点名键：满队 toast 词键 input.slotFull 在场（零退键）")
  const enKeys = Object.keys(i18n.HOST_DICT.en ?? {})
  const zhKeys = Object.keys(i18n.HOST_DICT.zh ?? {})
  assert.equal(enKeys.length > 0 && enKeys.length === zhKeys.length && enKeys.every((k) => zhKeys.includes(k)), true, "两语键集等量等集（零单语落键——零新键零退键的等量不变量）")
})
