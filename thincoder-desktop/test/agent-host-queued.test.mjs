/**
 * agent-host-queued.test.mjs — 宿主排队面用例（「回合中插入」批 · 任务书 = 批档 §2.4 测试面 · 机制单源 =
 * `docs/desktop/design/PROJECT.md` §2 KD-40）：
 *   U217 忙态入队（容量按键判 · 第 9 条 `queue-full` 零入队）· `ev:queue` 状态形 · 图不入快照；
 *   U218 步边界取批注入（合并一次消费 + `pushReal` 落历史 · `slash` 不消费 · 携图批整批让位）；
 *   U219 回合尾续发（递归至队空 · 队列先于接管）· 续发终止 ⇒ 既有接管 · 中止清队（`dispose` ∕ 切项目）· 携图送达；
 *   U221 负向锁：消化轮（`autoTurn`）⇒ 步边界缝缺席 + 队零动（对位 CLI T-F16-19 ∕ VSC T-V16-16）；
 *   U222 U-4 收口：会话中止（`dispose` ∕ 切项目）⇒ 在飞回合中止 + 在飞表清（零忙态队 ∕ 陈旧回合零迟到投递）；
 *   U223 U-6 收口：会话中止 ⇒ 回合尾接管墓碑 —— 陈旧回合（池活）零复活窗；
 *   U226 U-6 收口（缝臂）：中止后陈旧回合**步边界零取批**（旧代理不消费新会话队 —— 同墓碑判据）。
 * 拆分产出（自 `test/agent-host.test.mjs` 拆出 —— 该档越 500 硬限，在册预案「门面用例拆出 + 装配假面 harness
 * 共享」本批落形）；假面三件住 `test/agent-host-harness.mjs`（零用例）。
 * 用例号自铸（U217–U219 ∕ U221–U222 —— 设计用例号归属表无本舱段，沿 A-3b `U120/U121` 先例）—— 披露 = 批次档 §5。
 * 纪律：替身 `deps` + 替身 `run` + 假 `emit` ⇒ **零网 / 零 electron**；真盘面落于 `test/slot-sandbox.mjs` 沙箱。
 */
import { after, test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { parkAsyncPending, wakeAsyncWaiters } from "@thincoder/core/agent-tools/async-settle.mjs"
import { NON_VISION_KEY } from "../src/main/attachments.mjs"
import { FALLBACK_LOCALE, HOST_DICT } from "../renderer/i18n.mjs"
import { freshAgent, KEY, makeHost, stripComments, until } from "./agent-host-harness.mjs"
import { useSlotSandbox } from "./slot-sandbox.mjs"

const sandbox = useSlotSandbox() // 模块级：`send` 三路皆终点保存 ⇒ 不沙箱即写真实用户 sessions 目录
after(sandbox.cleanup)

/** 池项结算（核 settle 尾同点：入 pending + 唤醒 —— `parkAsyncPending` ∕ `wakeAsyncWaiters` 皆核单点）。 */
function settlePool(agent, id) {
  const entry = agent._asyncSubagents.get(id)
  entry.done = true
  entry.status = "done"
  agent._asyncSubagents.delete(id)
  parkAsyncPending(agent, entry)
  wakeAsyncWaiters(agent)
}

// ─── U217「回合中插入」忙态入队（容量按键判 · queue-full 零入队 · 快照投影）─────────

test("U217: 忙态入队（容量按键判 · 第 9 条 queue-full 零入队）· `ev:queue` 状态形 · 图不入快照", async () => {
  const runs = []
  let resolveRun = null
  const h = makeHost({ run: (_agent, text) => { runs.push(text); return new Promise((r) => { resolveRun = r }) } })
  await h.host.ensure(KEY, 3)
  assert.deepEqual(await h.host.send(KEY, "base"), { ok: true }, "首回合受理")
  for (let i = 1; i <= 8; i += 1) {
    const receipt = await h.host.send(KEY, `第${i}条`)
    assert.deepEqual(receipt, { ok: true, queued: true }, `第 ${i} 条入队受理`)
  }
  assert.deepEqual(await h.host.send(KEY, "第9条"), { ok: false, reason: "queue-full" }, "满队（第 9 条）⇒ queue-full —— 零入队")
  const frames = h.out.filter(([channel]) => channel === "ev:queue").map(([, payload]) => payload)
  assert.equal(frames.length, 8, "入队即出站（拒径零帧 —— 零假快照）")
  assert.deepEqual(frames.at(-1).items.map((item) => item.text), Array.from({ length: 8 }, (_, i) => `第${i + 1}条`), "快照 = 本键队列全员（序不变 · 队长不增）")
  assert.deepEqual(Object.keys(frames.at(-1).items[0]).sort(), ["text", "ts"], "快照恰形 `{ text, ts }`（**图不入快照**）")
  assert.equal(JSON.stringify(frames).includes("data:image"), false, "`dataURL` 不回传渲染面（逐帧负向锁）")
  resolveRun()
  await until(() => runs.length === 2, "结算 ⇒ 续发（满队恰一批一次消费）")
  assert.equal(runs[1], `你排队了 8 条消息：\n${Array.from({ length: 8 }, (_, i) => `${i + 1}. 第${i + 1}条`).join("\n")}\n——一次处理`,
    "续发取批 = 合并计划（CLI ∕ VSC 同值）")
})

// ─── U218「回合中插入」步边界取批（合并一次消费 · slash 防御面 · 携图整批让位）──────────

test("U218: 步边界取批注入（合并一次消费 + `pushReal` 落历史 · slash 不消费 · 携图批整批让位）", async () => {
  // ① 文本批 ≥2 ⇒ 合并一次消费（`consumeQueuedInput` 核循环头同形调用）
  let seam = null
  const h = makeHost({ run: (_agent, _text, _cb, opts) => { seam = opts.consumeQueuedInput; return new Promise(() => {}) } })
  await h.host.ensure(KEY, 3)
  await h.host.send(KEY, "base")
  await h.host.send(KEY, "一")
  await h.host.send(KEY, "二")
  const mergedText = "你排队了 2 条消息：\n1. 一\n2. 二\n——一次处理"
  seam(h.agent)
  const injected = h.agent.history.at(-1)
  assert.deepEqual([injected.role, injected.content], ["user", mergedText], "注入 = `pushReal` 普通 user 消息（不中断 · 下一步生效）")
  assert.equal(typeof injected.ts, "number", "`pushReal` 落 ts（本地字段）")
  const receipt = h.out.filter(([channel]) => channel === "ev:queue").at(-1)[1]
  assert.deepEqual(receipt.items, [], "消费回执：快照整置空")
  assert.deepEqual(receipt.delivered.text, mergedText, "回执文本 = 本批注入文本逐字（多条合并格式）")
  assert.equal(typeof receipt.delivered.ts, "number", "回执 `ts` = 批头条目入队现刻")

  // ② slash 首动作 ⇒ 不消费（防御面 —— 桌面无斜杠面；回合尾逐条直发 —— 父侧 2026-09-28 裁定）
  await h.host.send(KEY, "/cmd (防御面)")
  const before = h.agent.history.length
  seam(h.agent)
  assert.equal(h.agent.history.length, before, "slash 首动作 ⇒ 步边界零消费（零注入）")
  assert.deepEqual(h.out.filter(([channel]) => channel === "ev:queue").at(-1)[1].items.map((item) => item.text), ["/cmd (防御面)"],
    "该条留队（不静默丢）")

  // ③ 携图批 ⇒ 整批让位（同步缝不可落盘 ∕ 降级；不拆批 —— KD-40 ⑤）
  let seam2 = null
  const h2 = makeHost({ run: (_agent, _text, _cb, opts) => { seam2 = opts.consumeQueuedInput; return new Promise(() => {}) } })
  await h2.host.ensure(KEY, 3)
  await h2.host.send(KEY, "base")
  const images = [{ name: "a.png", mime: "image/png", dataURL: "data:image/png;base64,AAAA" }]
  await h2.host.send(KEY, "带图", images)
  const before2 = h2.agent.history.length
  seam2(h2.agent)
  assert.equal(h2.agent.history.length, before2, "携图条目 ⇒ 步边界不消费（让位）")
  await h2.host.send(KEY, "后续纯文本")
  seam2(h2.agent)
  assert.equal(h2.agent.history.length, before2, "批内含图 ⇒ **整批**让位（文本条目连带延后 —— 不拆批）")
  assert.deepEqual(h2.out.filter(([channel]) => channel === "ev:queue").at(-1)[1].items.map((item) => item.text), ["带图", "后续纯文本"],
    "两条皆留队待回合尾送达面")
})

// ─── U219「回合中插入」续发链（递归至队空 · 队列先于接管 · 中止清队）──────────────────

test("U219: 回合尾续发（递归至队空 · 队列先于接管）· 续发终止 ⇒ 既有接管 · 中止清队（dispose ∕ 切项目）· 携图送达", async () => {
  // ① 队非空 ⇒ 先续发（池活也不夺杆）；递归至队空 ⇒ 既有挂起窗接管
  const runs = []
  let resolveRun = null
  const h = makeHost({
    run: (agent, text) => {
      runs.push(text)
      agent._asyncSubagents = new Map([["7", { id: "7", role: "subagent", status: "running", done: false }]]) // 池活 ⇒ 接管面可辨
      return new Promise((r) => { resolveRun = r })
    },
  })
  const suspActive = (host) => host.out.some(([channel, payload]) => channel === "ev:susp" && payload.active === true)
  await h.host.ensure(KEY, 3)
  await h.host.send(KEY, "base")
  await h.host.send(KEY, "续一")
  await h.host.send(KEY, "续二")
  resolveRun()
  await until(() => runs.length === 2, "首轮结算 ⇒ 续发起跑")
  assert.equal(runs[1], "你排队了 2 条消息：\n1. 续一\n2. 续二\n——一次处理", "取批 = 合并计划（批 ≥2 合并一次消费）")
  assert.equal(suspActive(h), false, "队非空 ⇒ 零接管（队列先于接管）")
  resolveRun()
  await until(() => suspActive(h), "队空（池活）⇒ 进既有挂起窗接管")
  assert.deepEqual(h.host.interrupt(KEY), { ok: false, reason: "idle" }, "续发轮已结算（空闲期 ⇒ idle，无全停面）")
  h.host.dispose(KEY)
  await until(() => h.out.some(([channel, payload]) => channel === "ev:susp" && payload.active === false), "窗级联中止出窗帧")

  // ② 会话中止 ⇒ 队清 + 零续发（`dispose` —— 空快照出站）
  const h2 = makeHost({ run: () => new Promise(() => {}) })
  await h2.host.ensure(KEY, 3)
  await h2.host.send(KEY, "base")
  await h2.host.send(KEY, "随会话终止")
  h2.host.dispose(KEY)
  assert.deepEqual(h2.out.filter(([channel]) => channel === "ev:queue").at(-1)[1], { key: KEY, items: [] },
    "dispose ⇒ 队清（空快照出站 —— 镜面随清）")

  // ③ 切项目级联 ⇒ 全键队清（`abortSuspensions`）
  const h3 = makeHost({ run: () => new Promise(() => {}) })
  await h3.host.ensure(KEY, 3)
  await h3.host.send(KEY, "base")
  await h3.host.send(KEY, "旧项目队项")
  assert.equal(h3.host.abortSuspensions(), 0, "无窗 ⇒ 零窗中止（级联只计入窗）")
  assert.deepEqual(h3.out.filter(([channel]) => channel === "ev:queue").at(-1)[1], { key: KEY, items: [] }, "切项目 ⇒ 忙态队清（零续发）")

  // ④ 携图条目 ⇒ 结算续发送达（附件面被调 ⇒ `degraded` 随消费回执浮出 —— 零静默）
  const runs4 = []
  let resolve4 = null
  const h4 = makeHost({ run: (_agent, text) => { runs4.push(text); return new Promise((r) => { resolve4 = r }) } })
  await h4.host.ensure(KEY, 3)
  await h4.host.send(KEY, "base")
  const image = { name: "a.png", mime: "image/png", dataURL: "data:image/png;base64,AAAA" }
  await h4.host.send(KEY, "带图", [image])
  resolve4()
  await until(() => runs4.length === 2, "结算续发送达")
  assert.equal(runs4[1], `带图\n\n${HOST_DICT[FALLBACK_LOCALE][NON_VISION_KEY]}`,
    "送达面 `prepareTurnAttachments` 被调（非视觉 ⇒ 文本尾附说明行 —— 词表同源）")
  const frame4 = h4.out.filter(([channel]) => channel === "ev:queue").at(-1)[1]
  assert.deepEqual([frame4.items, frame4.delivered.text, frame4.delivered.degraded], [[], "带图", "non-vision"],
    "`degraded` 随消费回执浮出（送达面判决 —— 零静默）")
})

// ─── U221 负向锁：消化轮（`autoTurn`）不接步边界缝（对位 CLI T-F16-19 ∕ VSC T-V16-16）──────────

test("U221: 负向锁 —— 消化轮（`autoTurn`）⇒ 步边界缝缺席（键不在）· 队零动（零注入 ∕ 零回执）· 接线面单点", async () => {
  let digest = null
  let resolveFirst = null
  const h = makeHost({
    run: (agent, _text, _cb, opts) => {
      if (opts.autoTurn === true) { digest = opts; return new Promise(() => {}) } // 消化轮悬停：轮内观察（窗保持）
      agent._asyncSubagents = new Map([["7", { id: "7", role: "subagent", status: "running", done: false }]]) // 池活 ⇒ 回合尾入窗
      return new Promise((r) => { resolveFirst = r })
    },
  })
  await h.host.ensure(KEY, 3)
  await h.host.send(KEY, "base")
  resolveFirst() // 首回合结算 ⇒ 池活 ⇒ 入窗（回合尾接管）
  await until(() => h.out.some(([channel, payload]) => channel === "ev:susp" && payload.active === true), "入窗")
  settlePool(h.agent, "7") // 池项结算（核 park + wake 单点）⇒ 消化轮起跑
  await until(() => digest !== null, "消化轮起跑")

  assert.equal(digest.autoTurn, true, "所在轮 = 消化轮（核 `autoTurn` 旗标 —— `turn-face` 分流判据）")
  assert.equal("consumeQueuedInput" in digest, false, "步边界缝**缺席**（键不在 —— 推入面只在用户回合）")

  // 队零动：核循环头同址调用（`thincoder-core/agent.mjs:247` `consumeQueuedInput?.(agent)`）——缺省 ⇒ 零调用。
  //   口径（自陈）：本刻宿主队恒空（**队列先于接管** —— 队项在回合尾即被取批送达，窗开启时队必空）⇒ 下列三断言
  //   = 零副作用面锁；**鉴别力主承上句「缝缺席」断言 + 尾部源面单接线点锁**（分流回归 ⇒ 首句即判红）。
  const before = h.host.queueSnapshot(KEY)
  const historyBefore = h.agent.history.length // 结算前读数（槽装载可能已入史 ⇒ 取增量不比零值）
  digest.consumeQueuedInput?.(h.agent)
  assert.equal(h.agent.history.length, historyBefore, "history 零写入（零合并注入 —— 系统轮不落步边界）")
  assert.deepEqual(h.host.queueSnapshot(KEY), before, "宿主队快照零动（零消费 ∕ 零扰动）")
  assert.equal(h.out.some(([channel, payload]) => channel === "ev:queue" && payload.delivered), false, "零消费回执（队零动之证）")

  // 端壳接线面单点（源面锁 —— 对位 VSC T-V16-16b）：推入面只在 `pickup` 分流处一次
  const face = stripComments(readFileSync(new URL("../src/main/turn-face.mjs", import.meta.url), "utf8"))
  const seam = face.split("\n").filter((line) => line.includes("consumeQueuedInput"))
  assert.equal(seam.length, 1, "`consumeQueuedInput` 单接线点（钉死推入面 —— 无第二径可绕分流）")
  assert.match(seam[0], /pickup\s*===\s*null/, "推入面色 = `pickup` 分流（`null` ⇒ 键不在）")
  assert.match(seam[0], /consumeQueuedInput:\s*pickup/, "推入值 = `pickup`（用户回合缝｜消化轮 `null`）")
  h.host.dispose(KEY) // 收尾：悬停消化轮随会话中止（零真实等待）
})

// ─── U222 U-4 收口：会话中止 ⇒ 在飞回合中止 + 在飞表清（零忙态队 ∕ 陈旧回合零迟到投递）──────────

test("U222: U-4 —— `dispose` ∕ 切项目 ⇒ 在飞回合中止 + 在飞表清（零忙态队 · 陈旧回合零迟到投递）", async () => {
  // ① `dispose` 中（在飞）：回合中止 + 在飞表清 ⇒ 同键再发 = **起新回合**（非入幽灵在飞的队）
  const runs = []
  const resolvers = []
  const h = makeHost({
    run: (agent, text, _cb, opts) => {
      runs.push({ agent, text, opts })
      return new Promise((r) => { resolvers.push(r) })
    },
  })
  await h.host.ensure(KEY, 3)
  await h.host.send(KEY, "旧回合")
  h.host.dispose(KEY)
  assert.equal(runs[0].opts.signal.aborted, true, "dispose ⇒ 在飞回合中止（signal 收）")
  assert.deepEqual(h.host.interrupt(KEY), { ok: false, reason: "idle" }, "在飞表已清（幽灵在飞零残留 —— 无全停面）")
  assert.deepEqual(await h.host.send(KEY, "新会话消息"), { ok: true }, "dispose 后同键再发 ⇒ 起新回合（**非线性入队** —— 忙态队第一条件不可达）")
  assert.equal(h.order.filter((x) => x === "createAgent").length, 2, "新回合 = 重装配实例（非陈旧代理）")
  assert.deepEqual([runs.length, runs[1].text], [2, "新会话消息"], "第二次提交即起跑（零排队 —— 队快照恒空）")
  assert.deepEqual(h.host.queueSnapshot(KEY), [], "宿主队零条目")

  // ② `dispose` 后（陈旧回合迟到）：陈旧回合结算 ⇒ 零续发 ∕ 零迟到投递 ∕ 零复活窗
  const historyBefore = h.agent.history.length // 结算前读数（槽装载可能已入史 ⇒ 取增量不比零值）
  resolvers[0]()
  await until(() => h.out.some(([channel, payload]) => channel === "ev:activity" && payload.event === "done"), "陈旧回合结算")
  assert.equal(runs.length, 2, "陈旧回合尾零续发（队空 ⇒ 零新回合）")
  assert.equal(h.out.some(([channel, payload]) => channel === "ev:queue" && payload.delivered), false, "零消费回执（迟到投递不可达 —— 队无人喂）")
  assert.equal(h.out.some(([channel, payload]) => channel === "ev:susp" && payload.active === true), false, "零复活窗（陈旧回合尾零接管 —— 本臂池空配置面；池活臂 = U223）")
  assert.equal(h.agent.history.length, historyBefore, "陈旧代理 history 零增量（零迟到送达 —— 增量比不比零值）")
  assert.equal(runs[1].opts.signal.aborted, false, "新回合零误伤（在飞表清不波及其后新占位）")

  // ③ 切项目径（`abortSuspensions`）：在飞中止 + 在飞表清（同源收口 —— 既有返回语义零回归）
  const seen = []
  const h3 = makeHost({ run: (_agent, _text, _cb, opts) => { seen.push(opts); return new Promise(() => {}) } })
  await h3.host.ensure(KEY, 3)
  await h3.host.send(KEY, "旧项目在飞")
  assert.deepEqual(await h3.host.send(KEY, "旧项目排队项"), { ok: true, queued: true }, "在飞 ⇒ 入队（受理面零回归）")
  assert.equal(h3.host.abortSuspensions(), 0, "无窗 ⇒ 零窗中止（级联计数只计入窗）")
  assert.equal(seen[0].signal.aborted, true, "切项目 ⇒ 在飞回合中止（旧项目代理不再接管重启后的提交）")
  assert.deepEqual(h3.out.filter(([channel]) => channel === "ev:queue").at(-1)[1], { key: KEY, items: [] }, "忙态队清（零续发 —— 既有语义零回归）")
  assert.deepEqual(h3.host.interrupt(KEY), { ok: false, reason: "idle" }, "在飞表已清（幽灵在飞零残留）")
  assert.deepEqual(await h3.host.send(KEY, "新项目消息"), { ok: true }, "切项目后同键再发 ⇒ 起新回合（非线性入队）")
  assert.equal(seen[1].signal.aborted, false, "新回合零误伤")
})

// ─── U223 U-6 收口（池活臂）：会话中止 ⇒ 回合尾接管墓碑 —— 陈旧回合零复活窗 ──────────────

test("U223: U-6 —— `dispose` 后陈旧回合结算（池活）⇒ 零复活窗（零 `ev:susp {active:true}` 再注册）", async () => {
  const runs = []
  let resolveRun = null
  const h = makeHost({
    run: (agent, text) => {
      runs.push(text)
      agent._asyncSubagents = new Map([["7", { id: "7", role: "subagent", status: "running", done: false }]]) // 池活 ⇒ 接管面可辨
      return new Promise((r) => { resolveRun = r })
    },
  })
  await h.host.ensure(KEY, 3)
  await h.host.send(KEY, "旧回合")
  h.host.dispose(KEY) // 会话中止（删除面调用者）⇒ 在飞中止 + 落中止墓碑
  resolveRun() // 陈旧回合迟到结算
  await until(() => h.out.some(([channel, payload]) => channel === "ev:activity" && payload.event === "done"), "陈旧回合结算")
  for (let i = 0; i < 5; i += 1) await new Promise((done) => setTimeout(done, 0)) // 失效窗：接管链（`.then` 尾）落定
  assert.deepEqual(runs, ["旧回合"], "零接管起跑（零新回合）")
  assert.equal(h.out.some(([channel, payload]) => channel === "ev:susp" && payload.active === true), false,
    "零复活窗（已亡键不再入挂起窗 —— 旧行为（无墓碑）⇒ 池活径复活窗）")
  h.host.dispose(KEY) // 收尾（幂等）
})

// ─── U226 U-6 收口（缝臂）：中止后陈旧回合步边界零取批（旧代理不消费新会话队）──────────

test("U226: U-6 —— 中止后陈旧回合步边界缝零取批（旧代理不消费新会话队）", async () => {
  let seam = null
  const h = makeHost({
    assemble: async ({ slot }) => freshAgent(slot), // 逐次新建对象（核同形 —— 陈旧 ∕ 新代两代理可辨）
    run: (_a, _t, _cb, opts) => { seam ??= opts.consumeQueuedInput ?? null; return new Promise(() => {}) },
  })
  await h.host.ensure(KEY, 3)
  await h.host.send(KEY, "旧回合") // 回合 1 悬停（中止落于不抛回阶段之模拟）
  const dead = h.host.agents.get(KEY)
  h.host.dispose(KEY) // 中止（墓碑）+ 清队
  await h.host.send(KEY, "新会话回合") // 同键重开（新对象）⇒ 新回合在飞
  await h.host.send(KEY, "新会话队项") // 在飞 ⇒ 入队
  const before = dead.history.length // 结算前读数（槽装载可能已入史 ⇒ 取增量不比零值 —— 同 U221 ∕ U222 口径）
  seam(dead) // 陈旧回合下一循环头（核 `agent.mjs:247` 同址调用）
  assert.equal(dead.history.length, before, "陈旧代理零注入（墓碑查位 —— 旧行为 ⇒ `pushReal` 落新队项）")
  assert.deepEqual(h.host.queueSnapshot(KEY).map((item) => item.text), ["新会话队项"], "新队项留队（零被旧代理取走）")
})
