/**
 * agent-host-suspension.test.mjs — 桌面空闲唤醒批 · 挂起驱动族平 node 直测（批档 §2.7 B1 ①–⑥ + §1.9 ask 交接项）。
 * 纪律：替身 `post` / 替身 `runTurn` / 假载体（agent 形）⇒ **零 electron / 零用户目录 / 零网**
 *  （驱动只消费核件 `startSuspension` —— 会话键面 / 落盘 / 桥面全在宿主侧，不入本档）。
 * 覆盖：挂起进出 ∕ 空闲 settle ⇒ 自唤醒 ∥ 窗内输入优先 ∥ digest 中止重入 ∥ `abort` 中止（清池不注入 + 冻结补发）∥
 * 池空退出 ∥ ask 唤醒轮（`upstreamTurn` 旗标 + `tier:"ask"` 携参 + 纯 ask 不弹）∥ 合并轮弹 ∥ 通知策略面四判 ∥ 残输入兜底（两窄径 ⇒ 普通回合续发）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { parkAsyncPending, wakeAsyncWaiters } from "@thincoder/core/agent-tools/async-settle.mjs"
import { createNotifier, NOTIFY_TEXTS } from "../src/main/notify.mjs"
import { createSuspensionDrive } from "../src/main/suspension-drive.mjs"

/** 假载体（agent 形 —— 核 `carrierField` 直读）：双池 + pending 单容器 + 上游队列。 */
function makeCarrier() {
  return { _asyncSubagents: new Map(), _asyncAdvisors: new Map(), _pendingAsyncResults: [], _childUpstream: [], history: [] }
}

/** 池项（核 `backgroundCounts` ∕ `sweepSettledToPending` 读的字段面）。 */
const poolEntry = (id, status = "running") => ({ id, role: "subagent", status, done: status === "done" })

/** settle（核 settle 尾同点：入 pending + 唤醒 —— `parkAsyncPending` ∕ `wakeAsyncWaiters` 皆核单点）。 */
function settle(agent, id) {
  const entry = agent._asyncSubagents.get(id)
  entry.done = true
  entry.status = "done"
  agent._asyncSubagents.delete(id)
  parkAsyncPending(agent, entry)
  wakeAsyncWaiters(agent)
}

/** 同通道末帧载荷。 */
const at = (post, channel) => post.filter(([c]) => c === channel).at(-1)?.[1]

/** 等到谓词成立（驱动循环异步 —— 最多 50 拍）。 */
async function until(fn, label = "condition") {
  for (let i = 0; i < 50; i += 1) {
    if (fn()) return
    await new Promise((done) => setTimeout(done, 0))
  }
  throw new Error(`timeout waiting: ${label}`)
}

/** 假驱动装配：`post` 收集 · `runTurn` 记录（消费 pending ∕ 上游队列 = 核 `runAgent` 首行注入与 `drainChildUpstream` 同点）。 */
function makeDrive({ notify = null, onTurn = null } = {}) {
  const post = []
  const turns = []
  const drive = createSuspensionDrive({
    post: (channel, payload) => post.push([channel, payload]),
    notify,
    runTurn: async (key, agent, text, opts) => {
      turns.push({ key, text, opts, size: drive.size() }) // `size` = 起跑刻窗数（「续发在窗退出后」面）
      agent._pendingAsyncResults.splice(0) // 注入单点（run 首行）
      agent._childUpstream.splice(0) // 回合边界 drain 单点
      if (onTurn) await onTurn({ key, agent, text, opts, turns, post })
    },
  })
  return { drive, post, turns }
}

// ─── U183 挂起进出 ∕ 池空退出（B1 ①⑥）────────────────────────────

test("U183: 挂起进出（入口帧四计数）· 同键重入零动作 · 池空退出（出窗帧 + 载体复位）", async () => {
  const { drive, post } = makeDrive()
  const agent = makeCarrier()
  agent._asyncSubagents.set("7", poolEntry("7"))
  assert.equal(drive.start("3", agent), true, "回合尾 `poolLive` 判真 ⇒ 入窗")
  assert.equal(drive.active("3"), true, "窗在场（`send` 路由分岔点）")
  assert.equal(drive.size(), 1, "窗表键唯一")
  assert.deepEqual(at(post, "ev:susp"), { key: "3", active: true, running: 1, queued: 0, pending: 0, done: 0 }, "入口帧 = 核计数直传")
  assert.equal(drive.start("3", agent), false, "同键重入 ⇒ 零动作（至多一窗）")
  assert.equal(agent._suspended, true, "核件入窗（载体 `_suspended`）")
  assert.equal(agent._sessionSignal, agent._sessionAbort.signal, "载体挂会话控制器（children 链 `_sessionSignal`）")
  assert.equal(agent._asyncSubagents.size, 1, "核件装配不动池（零副作用）")
  agent._asyncSubagents.delete("7") // 池空（未注入 —：自然退出判据）
  wakeAsyncWaiters(agent)
  await until(() => drive.size() === 0, "窗退出")
  assert.deepEqual(at(post, "ev:susp"), { key: "3", active: false, running: 0, queued: 0, pending: 0, done: 0 }, "出窗帧（`active:false` = 退出唯一形态）")
  assert.equal(agent._suspended, false, "退出复位核件载体")
  assert.equal(agent._sessionAbort, null, "退出摘会话控制器")
  assert.equal(agent._sessionSignal, null, "退出摘会话信号")
})

// ─── U184 空闲 settle ⇒ 自唤醒（B1 ② + 边界两发 + 回收）───────────

test("U184: 空闲 settle ⇒ 自唤醒 digest 轮（不借用户输入）· `ev:digest` 起 ∕ 收两发 · 回收逐条补发 done · 档②弹", async () => {
  const toasts = []
  const { drive, post, turns } = makeDrive({ notify: createNotifier({ notify: (p) => toasts.push(p), focused: () => false }) })
  const agent = makeCarrier()
  agent._asyncSubagents.set("7", poolEntry("7"))
  drive.start("3", agent)
  settle(agent, "7")
  await until(() => turns.length === 1, "自唤醒轮")
  assert.deepEqual([turns[0].text, turns[0].opts.autoTurn, turns[0].opts.upstreamTurn], ["", true, false], "消化轮 = 空文本 + autoTurn（零用户输入）")
  const starts = post.filter(([c, p]) => c === "ev:digest" && p.status === "start").map(([, p]) => p)
  const ends = post.filter(([c, p]) => c === "ev:digest" && p.status === "end").map(([, p]) => p)
  assert.deepEqual(starts, [{ key: "3", status: "start", n: 1 }], "起跑帧：n = 起跑 pending 数（取点 = 单回合执行面 autoTurn 支）")
  assert.deepEqual(ends.map(({ key, status, ok }) => ({ key, status, ok })), [{ key: "3", status: "end", ok: true }], "收尾帧（ok 旗标）")
  assert.equal(typeof ends[0].ms, "number", "收尾帧携 ms 读数")
  assert.deepEqual(at(post, "ev:subagent"), { key: "3", role: "subagent", id: "7", status: "done" }, "回收：消化完成逐条补发 done（块归档入流）")
  assert.deepEqual(toasts.map((t) => t.body), [NOTIFY_TEXTS.en.subagents(1)], "档②：纯消化轮（pending > 0 ∧ 非 upstream）⇒ 弹恰一条")
  await until(() => drive.size() === 0, "消化毕 · 池空 ⇒ 退出")
  assert.equal(at(post, "ev:digest").status, "end", "出窗帧不冒充边界帧")
})

// ─── U185 窗内输入优先（B1 ③ + 档①通知）─────────────────────────

test("U185: 窗内输入 ⇒ pushInput + wake（用户回合优先于消化轮 —— 消化被截胡）· 成功径出档①通知", async () => {
  const toasts = []
  const { drive, post, turns } = makeDrive({ notify: createNotifier({ notify: (p) => toasts.push(p), focused: () => false }) })
  const agent = makeCarrier()
  agent._asyncSubagents.set("7", poolEntry("7"))
  drive.start("3", agent)
  settle(agent, "7") // 消化源在场（pending = 1）
  drive.pushInput("3", "窗内插队输入") // 同步先入槽（微任务之前 —— 优先序可辨）
  await until(() => turns.length === 1, "首轮")
  assert.deepEqual([turns[0].text, turns[0].opts.autoTurn], ["窗内插队输入", false], "用户输入优先（步骤 1 先于消化轮兑现）")
  assert.equal(post.filter(([c, p]) => c === "ev:digest" && p.status === "start").length, 0, "该回合消化 pending ⇒ 不另开消化轮（输入优先 = 消化截胡）")
  await until(() => toasts.length === 1, "档①通知")
  assert.equal(toasts[0].body, NOTIFY_TEXTS.en.done, "档①：用户回合完成（成功径 —— 无 locale 配置 ⇒ en）")
  await until(() => drive.size() === 0, "池空 ⇒ 退出")
})

// ─── U186 digest 中止 ⇒ 回合级重入（B1 ④）────────────────────────

test("U186: digest 轮中止（AbortError）⇒ 回合级 —— 窗不退出 · 收尾帧 ok:false · 池余量续消化", async () => {
  let first = true
  const { drive, post, turns } = makeDrive({
    onTurn: async ({ opts }) => {
      if (opts.autoTurn && first) {
        first = false
        throw Object.assign(new Error("Aborted"), { name: "AbortError" }) // 回合级中止形（核 catch 判据）
      }
    },
  })
  const agent = makeCarrier()
  agent._asyncSubagents.set("7", poolEntry("7")) // 消化源
  agent._asyncSubagents.set("8", poolEntry("8")) // 窗存续源（仍 running）
  drive.start("3", agent)
  settle(agent, "7")
  await until(() => turns.length === 1, "中止轮")
  assert.equal(drive.size(), 1, "回合级中止不是会话停 —— 窗不退出")
  assert.equal(agent._suspended, true, "挂起态保持")
  const ends = post.filter(([c, p]) => c === "ev:digest" && p.status === "end").map(([, p]) => p)
  assert.equal(ends[0].ok, false, "中止轮同出收尾帧（ok:false —— 非 Abort 失败径亦同：finally 单点）")
  settle(agent, "8") // 池余量 settle ⇒ 第二轮消化照常开
  await until(() => turns.length === 2, "第二轮消化")
  assert.equal(turns[1].opts.autoTurn, true, "重入循环后消化照常（池余量零丢失）")
  await until(() => drive.size() === 0, "池空 ⇒ 退出")
})

// ─── U187 abort（dispose ∕ 切项目级联 · B1 ⑤）────────────────────

test("U187: `abort` ⇒ 清池不注入 + pending 同清 + 冻结兜底补发 + 出窗帧（幂等）", async () => {
  const { drive, post } = makeDrive()
  const agent = makeCarrier()
  agent._asyncSubagents.set("7", poolEntry("7"))
  agent._pendingAsyncResults.push(poolEntry("9", "done")) // 驻留残项（快照面）
  drive.start("3", agent)
  assert.equal(drive.abort("3"), true, "命中窗")
  await until(() => drive.size() === 0, "窗退出")
  assert.equal(drive.abort("3"), false, "已无窗 ⇒ 零动作（幂等）")
  assert.equal(agent._asyncSubagents.size, 0, "清池（abort 语义 —— 陈旧结果不回灌）")
  assert.deepEqual(agent._pendingAsyncResults, [], "pending 单容器同清（不注入）")
  const dones = post.filter(([c, p]) => c === "ev:subagent" && p.status === "done").map(([, p]) => p.id)
  assert.deepEqual(dones.sort(), ["7", "9"], "冻结兜底：残项逐条补发（两池 + pending 驻留全覆盖）")
  assert.deepEqual(at(post, "ev:susp"), { key: "3", active: false, running: 0, queued: 0, pending: 0, done: 0 }, "出窗帧")
  assert.equal(agent._sessionAbort ?? null, null, "控制器随窗摘除（零悬挂引用）")
})

// ─── U188 ask ⇒ 唤醒轮（§1.9 交接项 + §1.11 口径）─────────────────

test("U188: ask 入队 ⇒ 唤醒轮（旗标 + tier 携参）· 纯 ask 唤醒轮不弹", async () => {
  const toasts = []
  const { drive, post, turns } = makeDrive({ notify: createNotifier({ notify: (p) => toasts.push(p), focused: () => false }) })
  const agent = makeCarrier()
  agent._asyncSubagents.set("7", poolEntry("7"))
  agent._childUpstream.push({ seq: 1, from: "eng-coder#9", kind: "ask", message: "  need a ruling\nnow ", ts: 1 })
  drive.start("3", agent)
  await until(() => turns.length === 1, "唤醒轮")
  assert.deepEqual([turns[0].text, turns[0].opts.autoTurn, turns[0].opts.upstreamTurn], ["", true, true], "唤醒轮 = autoTurn + `upstreamTurn` 旗标（域文本选择面）")
  const start = post.find(([c, p]) => c === "ev:digest" && p.status === "start")[1]
  assert.deepEqual(start, { key: "3", status: "start", n: 0, tier: "ask", from: "eng-coder#9", msg: "need a ruling now" }, "tier = ask + 核 `upstreamAskLabelVars` 携参（单行归一）")
  assert.equal(toasts.length, 0, "纯 ask 唤醒轮（`upstream ∧ pending = 0`）⇒ 不弹（对齐 VSC `!autoTurn` ∥ CLI 零通知）")
})

test("U188b: 合并轮（pending > 0 ∧ upstream）⇒ 按档② 弹（n 计数在场）", async () => {
  const toasts = []
  const { drive, turns } = makeDrive({ notify: createNotifier({ notify: (p) => toasts.push(p), focused: () => false }) })
  const agent = makeCarrier()
  agent._asyncSubagents.set("7", poolEntry("7"))
  agent._childUpstream.push({ seq: 1, from: "eng-coder#9", kind: "ask", message: "q", ts: 1 })
  drive.start("3", agent) // 入场即唤醒轮（drain 掉 ask）
  await until(() => turns.length === 1, "首轮")
  agent._childUpstream.push({ seq: 2, from: "eng-coder#9", kind: "ask", message: "q2", ts: 2 })
  settle(agent, "7") // 同刻 settle ⇒ 合并轮
  await until(() => turns.length === 2, "合并轮")
  assert.equal(turns[1].opts.upstreamTurn, true, "合并轮仍携 upstream 旗标")
  assert.deepEqual(toasts.map((t) => t.body), [NOTIFY_TEXTS.en.subagents(1)], "档②弹恰一次（n = 起跑 pending 数）")
})

// ─── U189 通知策略面四判（KD-35）────────────────────────────────

test("U189: 通知策略面 —— 失焦门 ∧ 两档合句 ∧ 点击聚焦 ∧ 缺位/抛零连带", () => {
  const fired = []
  const silentError = console.error
  console.error = () => {}
  try {
    const notifier = createNotifier({ notify: (payload) => fired.push(payload), focused: () => false, reveal: () => {} })
    const agent = { title: "会话甲", config: { locale: "zh" } }
    assert.equal(notifier.turnDone({ key: "3", agent }), true, "失焦 ∧ 档① ⇒ 恰一条")
    assert.equal(fired.at(-1).body, NOTIFY_TEXTS.zh.done, "档① 值 = VSC 逐字（zh）")
    assert.equal(fired.at(-1).title, "会话甲", "title = 会话标题（在场才携）")
    assert.equal(typeof fired.at(-1).reveal, "function", "点击 = 聚焦窗口（reveal 语义 —— 不切会话）")
    assert.equal(notifier.digestStart({ key: "3", agent, n: 0 }), false, "纯 ask 唤醒轮（n = 0）⇒ 不弹")
    assert.equal(fired.length, 1, "零条追加（不弹 = 零落子）")
    assert.equal(notifier.digestStart({ key: "3", agent, n: 2 }), true, "档②（n > 0）⇒ 弹")
    assert.equal(fired.at(-1).body, NOTIFY_TEXTS.zh.subagents(2), "档② 句携 n")
    assert.equal(createNotifier({ notify: (p) => fired.push(p), focused: () => true }).turnDone({ agent }), false, "聚焦 ⇒ 零条（失焦门 = never noise）")
    assert.equal(fired.length, 2, "聚焦门闭合 —— 零落子")
    assert.equal(createNotifier({}).turnDone({ agent }), false, "通知面缺位 ⇒ 零动作零抛（零连带）")
    assert.equal(createNotifier({}).digestStart({ agent, n: 3 }), false)
    const boom = createNotifier({ notify: () => { throw new Error("no toast") }, focused: () => false })
    assert.equal(boom.turnDone({ agent }), true, "平台抛 ⇒ 本档吞（回合链不受累）")
    const en = createNotifier({ notify: (p) => fired.push(p), focused: () => false })
    en.digestStart({ agent: { config: { locale: "en-US" } }, n: 1 })
    assert.equal(fired.at(-1).body, "1 subagent(s) finished", "en 值 = 设计逐字 · locale 经核归一（en-US ⇒ en）")
    assert.equal("title" in fired.at(-1), false, "标题不可得 ⇒ 零携")
  } finally {
    console.error = silentError
  }
})

// ─── U190 残输入兜底（出窗残值 ⇒ 普通回合续发 · 两窄径 + 中止边界）───

test("U190: 消化轮非 Abort 失败（窄径②）⇒ 出窗残值逐条以普通回合续发（不静默丢）· 续发毕接管", async () => {
  const { drive, turns } = makeDrive({
    onTurn: async ({ opts }) => {
      if (!opts.autoTurn) return
      drive.pushInput("3", "残值甲") // 消化轮在飞期落槽（受理 = `send` 回 `{ok:true}`）
      drive.pushInput("3", "残值乙")
      throw new Error("provider down") // 非 Abort ⇒ 核件重抛 ⇒ 窗退出
    },
  })
  const agent = makeCarrier()
  agent._asyncSubagents.set("7", poolEntry("7"))
  agent._asyncSubagents.set("8", poolEntry("8")) // 池余量（失败径仍 live ⇒ 续发毕接管新窗）
  drive.start("3", agent)
  settle(agent, "7")
  await until(() => turns.length === 3, "两残值续发轮")
  assert.deepEqual(turns.map((t) => [t.text, t.opts.autoTurn]), [["", true], ["残值甲", undefined], ["残值乙", undefined]], "首轮 = 消化轮（失败）；次轮起 = 逐条续发（多残值 = 多普通回合）")
  assert.equal(turns[1].size, 0, "续发在窗退出后（窗表已摘 —— 出窗链先结算）")
  await until(() => drive.active("3") === true, "续发毕 · 池仍 live ⇒ 接管新窗")
})

test("U190b: 窗退出等待期落槽（窄径①）⇒ 残值同入续发面（微任务刻落槽 —— 出窗竞态）", async () => {
  const { drive, turns } = makeDrive()
  const agent = makeCarrier()
  agent._asyncSubagents.set("7", poolEntry("7"))
  drive.start("3", agent)
  agent._asyncSubagents.delete("7") // 池空 ⇒ 循环 step 3 自然退出（非 abort 径）
  wakeAsyncWaiters(agent) // 循环续体入微任务队
  Promise.resolve().then(() => drive.pushInput("3", "退窗残值")) // 同刻落槽（窗仍在册 ⇒ 受理）
  await until(() => turns.length === 1, "残值续发轮")
  assert.deepEqual([turns[0].text, turns[0].opts.autoTurn], ["退窗残值", undefined], "残值以普通回合续发")
  assert.equal(turns[0].size, 0, "续发在窗退出后")
  await until(() => drive.size() === 0, "池空 ⇒ 零新窗")
})

test("U190c: 中止径两刻（窗内在册 ∕ 续发期）残值不续发 —— 消息随会话终止（记错一行，非静默）", async () => {
  const silent = console.error
  const logged = []
  console.error = (...a) => logged.push(a.join(" "))
  try {
    const one = makeDrive()
    const agent = makeCarrier()
    agent._asyncSubagents.set("7", poolEntry("7"))
    one.drive.start("3", agent)
    one.drive.pushInput("3", "中止前落槽") // 受理（`send` 回 ok:true）
    one.drive.abort("3")
    await until(() => one.drive.size() === 0, "窗退出")
    assert.equal(one.turns.length, 0, "① 窗内在册刻中止 ⇒ 零续发（会话已亡）")
    const two = makeDrive({
      onTurn: async ({ opts }) => {
        if (opts.autoTurn) { two.drive.pushInput("3", "甲"); two.drive.pushInput("3", "乙"); throw new Error("boom") }
        two.drive.abort("3") // ② 首条残值回合在飞时中止（届刻窗已摘）
      },
    })
    const agent2 = makeCarrier()
    agent2._asyncSubagents.set("7", poolEntry("7"))
    agent2._asyncSubagents.set("8", poolEntry("8")) // 池余量（未停链 ⇒ 会接管新窗）
    two.drive.start("3", agent2)
    settle(agent2, "7")
    await until(() => two.turns.length === 2, "首条残值轮")
    await new Promise((done) => setTimeout(done, 0)) // 链若在 ⇒ 给一拍
    assert.deepEqual([two.turns.length, two.drive.size()], [2, 0], "② 停链：第二条残值零续发 + 零接管（池余量不复活窗）")
    assert.equal(logged.filter((l) => l.includes("dropped with the session")).length, 2, "残值有痕（两刻各记错一行 —— 非静默）")
  } finally { console.error = silent }
})
