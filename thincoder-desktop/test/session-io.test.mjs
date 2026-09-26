/**
 * session-io.test.mjs — 会话槽 I/O 直测（批档 §1.14 ①②；用例号 U96/U97 = §2.4 表尾续号）。
 * 纪律：真槽文件（沙箱 tmp sessions 根 + 沙箱 cwd）+ **纯假装配**（`assemble` 注入 ⇒ 零 deps / 零 loadConfig /
 * 零网 / 零 electron）+ 假 `run`（只经核 `pushReal` 动内存，不碰网络）⇒ **零用户目录**。
 * 两臂各含「直调 `session-io`」与「经宿主 `ensure` / `send` 接线」两种面：
 *   U96 装载臂 = 装配出的代理必须持槽值 + 本键槽号重钉（核装载清 `_slot` —— 见 `src/main/session-io.mjs` 档头 ②）；
 *   U97 落盘臂 = 三路终局事件发射**当场**盘面已含本回合增量（先落盘再出事件）+ 写盘失败不掀回合面。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { pushReal } from "@thincoder/core/context.mjs"
import { createAgentHost } from "../src/main/agent-host.mjs"
import { loadAgentSlot, saveAgentSlot } from "../src/main/session-io.mjs"
import { slotPath } from "../src/main/session-slots.mjs"
import { useSlotSandbox } from "./slot-sandbox.mjs"

const KEY = "7" // 本键槽号 —— ≠ 装配值（重钉可辨）

/** 纯假装配：核 `assembleFor` 的形（`agent._slot = slot` —— `agent-host.mjs:103` 同式），零 deps 面。 */
function fakeAgent(cwd, slot) {
  return {
    cwd, provider: { name: "p1", model: "m1" }, providers: [{ name: "p1", model: "m1" }],
    tools: [], config: {}, history: [], _fullHistory: [], _slot: slot,
  }
}

/** 假宿主：`assemble` 注入 + 假 `emit` 收序（`onEvent` 在**事件发射当场**回调 —— 盘面读数用）。 */
function makeHost(cwd, { run, onEvent } = {}) {
  const out = []
  const host = createAgentHost({
    emit: (channel, payload) => { out.push([channel, payload]); onEvent?.(channel, payload) },
    assemble: async ({ cwd: site, slot }) => fakeAgent(site, slot),
    run,
    projects: { currentCwd: () => cwd },
  })
  return { host, out }
}

/** 写槽档（核形：`version` 2 + `cwd` 匹配 + `history` 数组）。 */
const writeSlot = (cwd, slot, data) => writeFileSync(slotPath(cwd, slot), JSON.stringify({ version: 2, cwd, history: [], ...data }))
const readSlot = (cwd, slot) => JSON.parse(readFileSync(slotPath(cwd, slot), "utf8"))

// ─── U96 装载臂 ────────────────────────────────────────────────

test("U96: 装载臂（槽命中 ⇒ 槽值应用 + 本键槽号重钉 · 槽缺 ⇒ false 零副作用 · 宿主 ensure 接线）", async (t) => {
  const s = useSlotSandbox(t)
  // ① 直调命中：槽值应用（单源 = 核 `applySession`）+ `_slot` 从装配值钉回本键槽号
  writeSlot(s.cwd, 7, { title: "槽七", tasks: [{ id: 1 }], sessionStart: 111, history: [{ role: "user", content: "旧" }] })
  const a = fakeAgent(s.cwd, 3) // 装配值 3 —— 模拟共享活动指针被别处翻动后的偏差
  assert.equal(loadAgentSlot(a, s.cwd, 7), true, "槽命中 ⇒ true")
  assert.deepEqual([a.title, a.tasks, a.history.map((m) => m.content)], ["槽七", [{ id: 1 }], ["旧"]], "槽值应用（端层零副本）")
  assert.equal(a._slot, 7, "本键槽号重钉（核装载已清 `_slot` —— 不重钉则回合尾落共享活动槽）")
  // ② 槽缺 ⇒ false · 代理不动 · 零盘面副作用（新建形：首次会话无槽文件是正常态）
  const b = fakeAgent(s.cwd, 5)
  assert.equal(loadAgentSlot(b, s.cwd, 5), false, "槽缺 ⇒ false（不抛）")
  assert.deepEqual([b._slot, b.title], [5, undefined], "槽缺 ⇒ 代理不动（装配值保留 · 零槽值注入）")
  assert.equal(existsSync(slotPath(s.cwd, 5)), false, "槽缺 ⇒ 零盘面新增（读面无认领副作用）")
  // ③ 他项目槽档不动（cwd 先行校验 —— 零改名零改档）
  writeSlot(s.cwd, 4, { cwd: "/other-project", history: [] })
  assert.equal(loadAgentSlot(fakeAgent(s.cwd, 4), s.cwd, 4), false, "异 cwd ⇒ 不认（按槽缺计）")
  assert.equal(existsSync(slotPath(s.cwd, 4)), true, "异 cwd 档原地保留（**非** `.unreadable` 改名）")
  // ④ 宿主接线：`ensure` 装配后装载 —— §1.14 ① 的语义面（装配出的代理必须持槽值）
  const { host } = makeHost(s.cwd, { run: () => Promise.resolve() })
  const ag = await host.ensure(KEY, 7)
  assert.deepEqual([ag.title, ag._slot], ["槽七", 7], "ensure ⇒ 装配出的代理持槽值 + 本键槽号")
})

// ─── U97 落盘臂 ────────────────────────────────────────────────

test("U97: 落盘臂（三路终局事件发射当场槽文件已含本回合增量 · 写失败不抛）", async (t) => {
  const s = useSlotSandbox(t)
  /** 假 `run`：本回合消息经核 `pushReal`（人读线源头 —— `context.mjs:93`）入内存 ⇒ 按路结算。 */
  const runOnce = (settle) => (agent, text, _cb, opts) => {
    pushReal(agent, { role: "user", content: `${text}@${settle}` })
    if (settle === "error") return Promise.reject(new Error("boom"))
    if (settle === "stopped") return new Promise((_res, rej) => { opts.signal.addEventListener("abort", () => rej(new Error("AbortError: aborted"))) })
    return Promise.resolve()
  }
  /** 发一回合 + 等终局；终局事件**发射当场**读槽文件（一断言同钉「先落盘再出事件」与持久化）。
   *  逐路新起宿主 ⇒ 第二 / 三路走「装载既有槽 → 绑定记录存储 → 追加」路（首路走「首保存绑定」路）。 */
  const turn = async (settle, text) => {
    const at = {}
    const { host, out } = makeHost(s.cwd, {
      run: runOnce(settle),
      onEvent: (channel) => {
        if (channel === "ev:activity" || channel === "ev:error") at.slot = readSlot(s.cwd, 7)
      },
    })
    await host.send(KEY, text)
    if (settle === "stopped") host.interrupt(KEY)
    await new Promise((r) => setImmediate(r))
    const [channel, payload] = out.at(-1)
    assert.equal(channel === "ev:error" ? "error" : payload.event, settle, `${settle} 路终局事件在册`)
    assert.ok(at.slot?.history?.some((m) => m.content === `${text}@${settle}`), `${settle} 路：终局事件发射当场槽文件已含本回合增量（先落盘再出事件）`)
  }
  await turn("done", "t1") // 首保存：未绑定 ⇒ 绑定 + 物化（模式 F 路径）
  await turn("stopped", "t2") // 装载既有槽 ⇒ 绑定追加
  await turn("error", "t3")
  // 写盘失败不掀回合面（回合已跑完）：自吞 + 恰一行 stderr（失败可见 · 不静默）
  const lines = []
  const orig = console.error
  console.error = (m) => lines.push(String(m))
  try {
    assert.equal(saveAgentSlot({}), undefined, "写盘失败 ⇒ 不抛（回 undefined）")
  } finally {
    console.error = orig
  }
  assert.equal(lines.filter((l) => l.startsWith("[agent-host] session save failed:")).length, 1, "恰一行 stderr")
})
