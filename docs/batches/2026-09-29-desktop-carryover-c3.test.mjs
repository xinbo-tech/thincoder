/**
 * 2026-09-29-desktop-carryover-c3.test.mjs — 批次本地单元件（桌面收尾批 · 舱 3 = #656「队满可见形 = 入口预检回执 +
 * toast + 文本不吞」· 随批留存归档）。任务书 = `docs/batches/2026-09-29-desktop-carryover.md` §2.5（#656）+ §4 批准
 * （舱 3）+ KD-52（`docs/desktop/design/PROJECT.md:95`；UI §1 输入区第三面）。
 *
 * **落位 = 暂存件**（住 `.thincoder/tmp/`——该目录被 git 忽略、不入版本库）：终位 = `docs/batches/2026-09-29-desktop-carryover-c3.test.mjs`
 * （名随任务书 · 随批留存 · 由父侧收口转正 —— 子代理对终位写入被批档写门 fail-closed 拒（先例 = `docs/batches/2026-09-29-desktop-susp-queue.test.mjs` ∕
 * `docs/batches/2026-09-29-core-env-residuals.md:174`「暂存 ⇒ 父侧收位」）；不入仓套件（全清令：仓套件不写 ∕ 不改 ∕ 不跑）。
 *
 * 复跑（cwd = 仓库根，即含 `thincoder-core/` 的目录）：
 *   node --test .thincoder/tmp/2026-09-29-desktop-carryover-c3.test.mjs    # 暂存位
 *   node --test docs/batches/2026-09-29-desktop-carryover-c3.test.mjs     # 收位后（终位）
 * （渲染档取核件走平 node 同源解析 —— 本件只引 `composer-wire.mjs`（零 `/rc/` 静态闭包）⇒ 零 `/rc/` 钩子需求。）
 *
 * 用例 ↔ 判据（批档 §2.5 验收）：
 *   M1  机检①（真机腿①机械面）：cap 待答 ∧ 队满 ∧ 携文 ⇒ 回执 `{ ok:false, reason:"queue-full" }` ∧ 队零变
 *       ∧ 回合未中止（询问未结算 ∕ 信号未 abort ∕ 零终局帧）；忙态 `send` 满队零回归（另面 `msg:send` 忙态径）
 *   M1b 裸停零回归：cap 待答 ∧ **无 message** ⇒ 零入队 ∕ 零队帧（预检只认携文）
 *   M2  机检②（真机腿②机械面）：cap 待答 ∧ 队未满 ∧ 携文 ⇒ 入队恰一条（单点前移）∧ 结算通知出镜（`ev:queue`）
 *       ∧ 零二次入队（交付恰一次 —— 第二回合文本逐字）
 *   M3  机检③：非 cap 态携文 ⇒ 核注入径零回归（reason 携文 ∕ 换代重入 `resume:true` ∕ 队零条目）
 *   M4  端侧可见形（真机腿①端侧机械面）：wire 收 `queue-full` ⇒ `slotFullNotice(message)` 恰一次
 *       （= 核件 toast + 文本回注触发单点）；负向两臂：`idle` ∕ `ok` ⇒ 零调用（既有形零变）；缺缝 ⇒ 零动作
 *   M5  结构核 ∕ 词键 ∕ 撤回原语：`input.slotFull` 词键两语在场（i18n 零增）· 回注缝供面（mount-composer 源面）
 *       · 撤回臂在位（turn-face 调用 + driver 注入）· `queued.remove` 纯动作（命中 ∕ 未命中 ∕ 跨键 ∕ 同文异引用 ∕ 幂等）
 * 纪律：行为断言优先 ∕ 结构断言只落机器可核形；真机 Electron 面（询问卡实际在场 ∕ toast 实际在场 ∕ 输入框实际回注）
 * 归父侧探针闭合。撤回臂（KD-52 ④）为**防御**设计（§2.11 披露③：实际不可达）——本件只核载体（原语 + 调用点在位）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
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
const tick = () => new Promise((r) => setTimeout(r, 0))

const [driverMod, wireMod, queuedMod, i18nMod, coreQueued] = await Promise.all([
  mod("thincoder-desktop/src/main/turn-driver.mjs"),
  mod("thincoder-desktop/renderer/composer-wire.mjs"),
  mod("thincoder-desktop/src/main/queued-input.mjs"),
  mod("thincoder-desktop/renderer/i18n.mjs"),
  mod("thincoder-core/queued.mjs"),
])
// ContinueError 与 turn-face 同实例（`@thincoder/core/agent.mjs` → 同一 realpath 档 —— 平 node 同源解析）
const { ContinueError } = await mod("thincoder-core/agent.mjs")
const QUEUED_MAX_ITEMS = coreQueued.QUEUED_MAX_ITEMS
const KEY = "1"

/** 假 agent（池表全空 ⇒ `poolLive` 假 ⇒ 回合尾不入挂起窗；title 在场 ⇒ `ensureSessionTitle` 自守卫短路零网）。 */
const makeAgent = (over = {}) => ({
  title: "t", cwd: null, _slot: 1,
  _asyncSubagents: new Map(), _asyncAdvisors: new Map(), _consultSessions: new Map(), _pendingAsyncResults: [],
  provider: { name: "vis", model: "claude-sonnet-4-5" }, config: { locale: "zh" }, memory: { db: null },
  history: [], _fullHistory: [], ...over,
})

/** 待决门假件（`suspensions.mjs` 消费面：提问门登记 + `denyGates` 按取消串结算 —— 判据面只取本舱消费点）。 */
function makeGates() {
  const table = new Map()
  let seq = 0
  return {
    table,
    askQuestion: (key, question, options) => new Promise((res) => { seq += 1; table.set(`q${seq}`, { key, question, options, resolve: res }) }),
    denyGates: (key) => {
      for (const [id, entry] of [...table]) {
        if (entry.key !== key) continue
        table.delete(id)
        entry.resolve("(user cancelled)") // 取消串单源 = `suspensions.mjs` `QUESTION_CANCELLED`
      }
    },
  }
}

/** turn-driver 夹具（假注入面齐全 —— 档头「零宿主依赖」判据；`run` 悬挂 ⇒ 用例自持 reject ∕ resolve）。 */
function driverOf() {
  const events = [], runs = [], gates = makeGates()
  const driver = driverMod.createTurnDriver({
    post: (ch, payload) => events.push({ ch, payload }),
    run: (agent, body, bridge, opts = {}) => new Promise((resolve, reject) => {
      const rec = { body, resume: opts.resume === true, signal: opts.signal, resolve, reject }
      runs.push(rec)
      // 核 abort 面同形：signal 中止 ⇒ AbortError 拒绝（换代重入判据源 = `live.signal.reason`）
      opts.signal?.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" })), { once: true })
    }),
    bridge: () => ({}), postUsage: () => {}, projects: { currentCwd: () => null },
    ensure: async () => makeAgent(), forgetKey: () => {}, dropScope: () => {},
    askQuestion: gates.askQuestion, denyGates: gates.denyGates,
  })
  return { driver, events, runs, gates }
}

/** 推进到「cap 询问待答」态：首回合起跑 ⇒ 撞帽（核抛点同形 `ContinueError`）⇒ 询问登记。 */
async function toCapPending(fx, first = "首消息") {
  assert.equal((await fx.driver.send(KEY, first)).ok, true, "首回合受理")
  await until(() => fx.runs.length === 1)
  fx.runs[0].reject(new ContinueError(30)) // 撞帽三径入口（turn-face `err instanceof ContinueError`）
  await until(() => fx.gates.table.size === 1)
  return fx.runs[0]
}

const framesOf = (fx, ch) => fx.events.filter((e) => e.ch === ch).map((e) => e.payload)

// ─── M1 机检①：cap 待答 ∧ 队满 ∧ 携文 ⇒ queue-full 回执 ∧ 队零变 ∧ 回合未中止 ──────────────

test("M1 机检①：cap 待答 ∧ 队满 ∧ 携文 ⇒ 回执 queue-full ∧ 队零变 ∧ 回合未中止", async () => {
  const fx = driverOf()
  const first = await toCapPending(fx)
  for (let i = 0; i < QUEUED_MAX_ITEMS; i += 1) {
    const r = await fx.driver.send(KEY, `q${i}`)
    assert.deepEqual([r.ok, r.queued], [true, true], `忙态受理第 ${i + 1} 条`)
  }
  assert.equal(fx.driver.queueSnapshot(KEY).length, QUEUED_MAX_ITEMS, "队满（容量 8 按键判）")
  const framesBefore = framesOf(fx, "ev:queue").length // 忙态径自身入队出镜（判据面 = 其后零新增帧）
  // 另面零回归：忙态 `send` 第 9 条 ⇒ 同码 queue-full（本舱零改该径）
  assert.deepEqual(await fx.driver.send(KEY, "第 9 条"), { ok: false, reason: "queue-full" }, "忙态 send 满队零回归")
  // 本舱：cap 待答 ∧ 携文 ⇒ 入口预检 ⇒ 满 ⇒ 整调用回执 queue-full（零中止 ∕ 零入队）
  assert.deepEqual(fx.driver.interrupt(KEY, "溢出语"), { ok: false, reason: "queue-full" }, "回执第三 reason")
  assert.equal(fx.driver.queueSnapshot(KEY).length, QUEUED_MAX_ITEMS, "零入队（队零变）")
  assert.equal(fx.driver.queueSnapshot(KEY).at(-1), `q${QUEUED_MAX_ITEMS - 1}`, "队内容零变（尾条逐字）")
  assert.equal(first.signal.aborted, false, "零中止（在飞信号未 abort）")
  assert.equal(fx.gates.table.size, 1, "询问仍在场（待决门未结算）")
  assert.deepEqual(framesOf(fx, "ev:activity").filter((p) => p.event !== "turn"), [], "零终局帧（回合照旧）")
  assert.equal(framesOf(fx, "ev:queue").length, framesBefore, "零新增队帧（零入队 ⇒ 零出镜）")
  // 清场：询问按取消结算（模拟用户作答 ∕ 后续处置）——零新增断言面，只为不留悬挂 Promise
  fx.gates.denyGates(KEY)
  await until(() => framesOf(fx, "ev:activity").some((p) => p.event === "stopped"))
})

// ─── M1b 裸停零回归：cap 待答 ∧ 无 message ⇒ 预检不适用 ─────────────────────────────

test("M1b 裸停径（cap 待答 ∧ 无 message）⇒ 零入队 ∕ 零队帧（预检只认携文）", async () => {
  const fx = driverOf()
  const first = await toCapPending(fx)
  assert.deepEqual(fx.driver.interrupt(KEY, ""), { ok: true }, "裸停照常受理（零消息 ⇒ 停回合不续跑）")
  assert.deepEqual(fx.driver.queueSnapshot(KEY), [], "零入队（预检只认携文）")
  assert.equal(first.signal.aborted, true, "裸 abort（reason 无 interrupt 面）")
  assert.notEqual(first.signal.reason?.interrupt, true, "reason 非携文形")
  await until(() => framesOf(fx, "ev:activity").some((p) => p.event === "stopped"))
  assert.deepEqual(framesOf(fx, "ev:queue"), [], "零队帧（零二次入队 ∕ 零通知）")
})

// ─── M2 机检②：cap 待答 ∧ 队未满 ∧ 携文 ⇒ 入队恰一条 ∧ 通知出镜 ∧ 零二次入队 ──────────────

test("M2 机检②：cap 待答 ∧ 队未满 ∧ 携文 ⇒ 入队恰一条（单点）∧ 结算通知出镜 ∧ 零二次入队", async () => {
  const fx = driverOf()
  const first = await toCapPending(fx)
  assert.deepEqual(fx.driver.interrupt(KEY, "携行语"), { ok: true }, "受理（预检成功 ⇒ 该条即本代入队）")
  assert.deepEqual(fx.driver.queueSnapshot(KEY), ["携行语"], "入队恰一条（入队单点 = interrupt 入口）")
  assert.equal(first.signal.aborted, true, "中止照常（abort 携核 abort 面 —— 询问按取消结算）")
  await until(() => fx.runs.length === 2)
  // 核结算通知（onCapCancelled ⇒ 队帧出镜）+ 回合尾续发交付（消费 = 下一回合边界）
  const frames = framesOf(fx, "ev:queue")
  assert.ok(frames.some((f) => f.items.join() === "携行语"), "结算通知出镜（快照整置携条目）")
  assert.ok(frames.every((f) => f.items.length <= 1), "全程零双条（零二次入队）")
  const delivered = frames.filter((f) => f.delivered !== undefined && f.delivered !== null)
  assert.deepEqual(delivered.map((f) => f.delivered.text), ["携行语"], "交付恰一次（delivered 帧唯一）")
  assert.deepEqual([fx.runs[1].resume, fx.runs[1].body], [false, "携行语"], "续发回合原文逐字（#543 原腿零回归）")
  assert.deepEqual(fx.driver.queueSnapshot(KEY), [], "交付即消费（队空 —— 恰一次）")
  fx.runs[1].resolve("done")
  await until(() => framesOf(fx, "ev:activity").some((p) => p.event === "done"))
  assert.equal(framesOf(fx, "ev:activity").filter((p) => p.event === "stopped").length, 1, "cap 收口 stopped 恰一次")
})

// ─── M3 机检③：非 cap 态携文 ⇒ 核注入径零回归 ───────────────────────────────────

test("M3 机检③：非 cap 态携文 ⇒ 核注入径零回归（reason 携文 ∕ 换代重入 ∕ 队零条目）", async () => {
  const fx = driverOf()
  assert.equal((await fx.driver.send(KEY, "首消息")).ok, true, "起跑受理")
  await until(() => fx.runs.length === 1)
  assert.equal(fx.gates.table.size, 0, "非 cap 态（零待答）")
  assert.deepEqual(fx.driver.interrupt(KEY, "注入语"), { ok: true }, "受理")
  assert.deepEqual(fx.runs[0].signal.reason, { interrupt: true, message: "注入语" }, "核 abort 面携文（signal.reason 逐字）")
  assert.deepEqual(fx.driver.queueSnapshot(KEY), [], "零入队（非 cap 携文不走队列）")
  await until(() => fx.runs.length === 2)
  assert.deepEqual([fx.runs[1].resume, fx.runs[1].body], [true, "首消息"], "换代重入（resume ∕ 消息不重推——同上下文续跑）")
  assert.deepEqual(framesOf(fx, "ev:queue"), [], "零队帧（队列面零触）")
  fx.runs[1].resolve("done")
  await until(() => framesOf(fx, "ev:activity").some((p) => p.event === "done"))
})

// ─── M4 端侧可见形：wire 收 queue-full ⇒ slotFullNotice 恰一次 ─────────────────────

/** 写面假件（deps 同装配面形；`call` 固定回执 —— 只走 `interrupt` 径）。 */
function wireOf(receipt, withSeam = true) {
  const calls = [], notices = []
  const wire = wireMod.createComposerWire({
    store: { get: () => ({}), set: () => {} },
    activeKey: () => KEY,
    call: async (channel, payload) => { calls.push({ channel, payload }); return receipt },
    push: () => {}, panelOf: () => null, repaint: () => {}, onLoadingReset: () => {},
    ...(withSeam ? { slotFullNotice: (text1) => notices.push(text1) } : {}),
  })
  return { wire, calls, notices }
}

test("M4 端侧可见形：queue-full ⇒ slotFullNotice(message) 恰一次；idle ∕ ok ⇒ 零调用；缺缝零动作", async () => {
  const a = wireOf({ ok: false, reason: "queue-full" })
  a.wire.post("interrupt", { message: "回注语" })
  await tick()
  assert.deepEqual(a.notices, ["回注语"], "可见形单点触发（toast + 文本回注）恰一次 · 文本逐字")
  assert.deepEqual(a.calls.map((c) => c.channel), ["msg:interrupt"], "单投（通道零变）")
  assert.deepEqual(a.calls[0].payload, { key: KEY, message: "回注语" }, "载荷形零变（key ∕ message）")
  const b = wireOf({ ok: false, reason: "idle" })
  b.wire.post("interrupt", { message: "x" })
  await tick()
  assert.deepEqual(b.notices, [], "idle ⇒ 零可见形（既有形零变）")
  const c = wireOf({ ok: true })
  c.wire.post("interrupt", { message: "x" })
  await tick()
  assert.deepEqual(c.notices, [], "受理径 ⇒ 零可见形")
  const d = wireOf({ ok: false, reason: "queue-full" }, false) // 缺缝臂（deps 无 slotFullNotice）
  d.wire.post("interrupt", { message: "x" })
  await tick() // 缺缝 ⇒ 零动作零抛（向后兼容：其它装配面不注入亦不炸）
})

// ─── M5 结构核 ∕ 词键 ∕ 撤回原语 ─────────────────────────────────────────────

test("M5 结构核 ∕ 词键 ∕ 撤回原语：词键两语在场 · 回注缝供面 · 撤回臂在位 · queued.remove 纯动作", async () => {
  // ① 词键复用（i18n 零增）：`input.slotFull` 两语在场（非键名回显）
  assert.notEqual(i18nMod.t("input.slotFull"), "input.slotFull", "词键在场（零新键）")
  assert.ok(typeof i18nMod.HOST_DICT.zh?.["input.slotFull"] === "string" && typeof i18nMod.HOST_DICT.en?.["input.slotFull"] === "string", "两语键集在场")
  // ② 回注缝供面（mount-composer —— 不可平 node 装载：`/rc/` 静态闭包 ⇒ 源面判据）
  const mount = text("thincoder-desktop/renderer/mount-composer.mjs")
  assert.match(mount, /function slotFullNotice\(text\)/, "缝形在场（挂载面注入小口）")
  assert.match(mount, /showToast\(t\("input\.slotFull"\)\)/, "核件 toast 单点（词键复用 —— 零第二实现）")
  assert.match(mount, /el\.value = el\.value === "" \? text :/, "文本回注写面在场（空框直置 ∕ 非空尾并 —— 零覆盖）")
  assert.match(mount, /el\.dispatchEvent\(new Event\("input"\)\)/, "自适应重算（高度写面单源 = 核件 —— 缓存同源）")
  assert.match(mount, /slotFullNotice, \/\/ #656/, "缝注入写面（装配面单点）")
  // ③ 消费点 ∕ 撤回臂 ∕ 回执第三 reason（源面判据）
  assert.match(text("thincoder-desktop/renderer/composer-wire.mjs"), /queue-full" && typeof slotFullNotice === "function"\) slotFullNotice\(message\)/, "queue-full 单点消费（写面）")
  assert.match(text("thincoder-desktop/src/main/turn-face.mjs"), /withdrawCapEntry\(key\)/, "撤回臂调用（非 cap 结算径 —— 防御）")
  const driver = text("thincoder-desktop/src/main/turn-driver.mjs")
  assert.match(driver, /withdrawCapEntry, \/\/ #656/, "撤回臂注入（driver → face）")
  assert.match(text("thincoder-desktop/src/main/turn-input.mjs"), /reason: "queue-full"/, "回执第三 reason 在场（interrupt 入口预检）")
  // ④ 撤回原语：按引用（非等值）· 幂等 · 跨键零误伤
  const queue = queuedMod.createQueuedInput()
  const e1 = { text: "同文", ts: 1 }, e2 = { text: "同文", ts: 2 }, e3 = { text: "他键", ts: 3 }
  queue.add(KEY, e1)
  queue.add(KEY, e2)
  queue.add("2", e3)
  assert.equal(queue.remove(KEY, e1), true, "命中 ⇒ 摘除")
  assert.deepEqual(queue.snapshot(KEY).map((e) => e.ts), [2], "同文异引用零误伤（按引用匹配）")
  assert.equal(queue.remove(KEY, e1), false, "幂等：复摘零动作")
  assert.equal(queue.remove("2", e2), false, "跨键零误伤")
  assert.deepEqual(queue.snapshot("2").map((e) => e.text), ["他键"], "他键零动")
  assert.equal(queue.remove(KEY, e2), true, "尾条摘除")
  assert.deepEqual(queue.snapshot(KEY), [], "空队（零残留）")
})
