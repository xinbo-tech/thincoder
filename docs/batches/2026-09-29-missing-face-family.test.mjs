/**
 * 2026-09-29-missing-face-family.test.mjs — 批次本地单元件（#632 缺面族批补 · @ 文件引用面 · 随批留存归档）。
 * 名随批次档；不进仓套件；复跑 = `node --test .thincoder/tmp/2026-09-29-missing-face-family.test.mjs`。
 *
 * 被验面（逐 §2.2 判据列）：①核件 `thincoder-core/file-refs.mjs`（注入六臂 ∕ 探针缺抛 ∕ strip 回环与失败
 * 闭合）②④两端薄壳（真临时目录行为对拍 + 壳内结构扫描 + VSC 三调用面零改）③标题源剥离
 * （`generate-title.mjs` —— 请求体零哨兵正文 ∧ 含 `@a.txt`）⑤⑥桌面注入缝（`turn-driver.injectUserText`
 * ∥ `turn-face` 起跑单点：用户回合注入 ∕ `autoTurn` 不扫 ∕ 缺缝原样 ∕ 恰一次 ∕ 无根零动作）
 * ⑦恢复面剥离（`session-slots.pageHistory`：首屏 + 回填同门；assistant 零动；盘面零改）⑧⑨负向锁
 * （忙态队快照 ∥ `delivered` 零 `[File:`——注入不前移；步边界 pickup 推送文本 == 原文——两端同形）
 * ⑩欢迎条 `@` 段两语值（词表锁）。
 * 沙箱 = 临时目录（sessions ∕ config 双缝隔离——零用户目录触碰）；平 node、零宿主、零真实网络。
 */
import test, { afterEach } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { ContinueError } from "../../thincoder-desktop/node_modules/@thincoder/core/agent.mjs"
import { _resetConfigPathForTest, _setConfigPathForTest } from "../../thincoder-desktop/node_modules/@thincoder/core/config.mjs"
import { _deps as titleDeps, ensureSessionTitle } from "../../thincoder-desktop/node_modules/@thincoder/core/generate-title.mjs"
import { injectAtRefs, stripAtRefs } from "../../thincoder-desktop/node_modules/@thincoder/core/file-refs.mjs"
import { _resetSessionsDirForTest, _setSessionsDirForTest, slotPath } from "../../thincoder-desktop/node_modules/@thincoder/core/session-slots.mjs"
import { newSession } from "../../thincoder-desktop/node_modules/@thincoder/core/session.mjs"
import { injectAtRefs as desktopInject, stripAtRefs as desktopStrip } from "../../thincoder-desktop/src/main/file-refs.mjs"
import { pageHistory } from "../../thincoder-desktop/src/main/session-slots.mjs"
import { createTurnChain } from "../../thincoder-desktop/src/main/turn-chain.mjs"
import { createTurnDriver } from "../../thincoder-desktop/src/main/turn-driver.mjs"
import { createTurnFace } from "../../thincoder-desktop/src/main/turn-face.mjs"
import { VIEWS_DICT } from "../../thincoder-desktop/renderer/i18n-views.mjs"
import { injectAtRefs as vscInject, stripAtRefs as vscStrip } from "../../thincoder-vscode/src/extension/file-refs.mjs"

/** 仓根（本件住 `.thincoder/tmp/` —— 上两级）。 */
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..")
const PROBE = { readFileSync, existsSync, statSync }
const KEY = "1"
const TEMPS = []

/** 临时沙箱：sessions ∕ config 双缝隔离（核测试缝）+ 项目 `cwd`（用例尾随 TEMPS 清理）。 */
function sandbox() {
  const root = mkdtempSync(join(tmpdir(), "tc-632-"))
  const sessions = join(root, "sessions")
  const cwd = join(root, "project")
  mkdirSync(cwd, { recursive: true })
  _setSessionsDirForTest(sessions)
  _setConfigPathForTest(join(root, "config.json"))
  TEMPS.push(root)
  return { root, sessions, cwd }
}

/** 代理最小形（结算面消费齐备；`title` 在场 ⇒ 标题自守卫短路 ⇒ 零网络）。 */
function makeAgent(cwd) {
  return {
    cwd,
    provider: { name: "fake", apiKey: "test-key", baseURL: "http://127.0.0.1:1/v1", model: "gpt-4o" },
    history: [],
    _fullHistory: [],
    title: "夹具标题",
    tasks: [],
    planMode: false,
    autoApprove: false,
    goal: null,
    _pendingReminders: [],
    _sessionStart: null,
    _engDesignTokens: new Map(),
    config: {},
  }
}

function deferred() {
  let resolve
  const promise = new Promise((r) => { resolve = r })
  return { promise, resolve }
}

async function waitUntil(predicate, timeoutMs = 3000) {
  const deadline = Date.now() + timeoutMs
  for (;;) {
    if (predicate()) return true
    if (Date.now() > deadline) return false
    await new Promise((r) => setTimeout(r, 5))
  }
}

afterEach(() => {
  _resetSessionsDirForTest()
  _resetConfigPathForTest()
  for (const dir of TEMPS.splice(0)) {
    try { rmSync(dir, { recursive: true, force: true }) } catch { /* 清理尽力面 */ }
  }
})

test("①核件注入六臂：命中 ∕ 不存在 ∕ 目录 ∕ 超 4000 截断 ∕ 多引 ∕ 非串 + 探针缺 ⇒ 抛", () => {
  const sb = sandbox()
  writeFileSync(join(sb.cwd, "a.txt"), "ALPHA-SENTINEL") // 14 chars
  mkdirSync(join(sb.cwd, "sub"))
  // 命中：原位替换 + 摘要块（字符数 = 实测）
  const hit = injectAtRefs("请看 @a.txt 内容", sb.cwd, PROBE)
  assert.ok(hit.includes("[File: a.txt]\n```\nALPHA-SENTINEL\n```"), "命中 ⇒ 围栏原位替换")
  assert.ok(hit.endsWith("[Referenced files:\n  - a.txt (14 chars)\n]"), "摘要块列出实际字符数")
  assert.ok(!hit.includes("请看 @a.txt"), "占位不再存留（原位吃掉）")
  // 不存在 ∕ 目录：零动作（原文）
  assert.equal(injectAtRefs("看 @nope.txt 说", sb.cwd, PROBE), "看 @nope.txt 说", "不存在 ⇒ 原样")
  assert.equal(injectAtRefs("看 @sub 说", sb.cwd, PROBE), "看 @sub 说", "目录 ⇒ 原样（非文件不成引用）")
  // 超 4000：截断 + 标记；摘要长度 = 截断后字符数（4000 + 标记）
  writeFileSync(join(sb.cwd, "big.txt"), "x".repeat(5000))
  const expectLen = 4000 + "\n... (truncated)".length
  const big = injectAtRefs("读 @big.txt 说", sb.cwd, PROBE)
  assert.ok(big.includes("... (truncated)"), "超限标记在场")
  assert.ok(big.endsWith(`[Referenced files:\n  - big.txt (${expectLen} chars)\n]`), "摘要长度 = 截断后字符数（4017）")
  // 多引：逐条围栏 + 摘要两行按出现序
  writeFileSync(join(sb.cwd, "b.txt"), "BETA")
  const multi = injectAtRefs("@a.txt 与 @b.txt", sb.cwd, PROBE)
  assert.ok(multi.includes("[File: a.txt]") && multi.includes("[File: b.txt]"), "多引各成围栏")
  assert.ok(multi.endsWith("[Referenced files:\n  - a.txt (14 chars)\n  - b.txt (4 chars)\n]"), "摘要两行按出现序")
  // 非串：零动作原样（零判据面——探针不检）
  assert.equal(injectAtRefs(42, sb.cwd, PROBE), 42, "非串 ⇒ 原样")
  assert.equal(injectAtRefs(null, sb.cwd, PROBE), null, "null ⇒ 原样")
  // 探针缺 ∕ 形违 ⇒ 抛（fail-loud——盘面闸不得静默降级）
  assert.throws(() => injectAtRefs("@a.txt 说", sb.cwd, undefined), TypeError, "探针缺 ⇒ 抛")
  assert.throws(() => injectAtRefs("@a.txt 说", sb.cwd, { existsSync, statSync }), TypeError, "探针形违 ⇒ 抛")
})

test("①核件 strip：注入回环逐字归位 ∕ 失败闭合整条原样", () => {
  const sb = sandbox()
  writeFileSync(join(sb.cwd, "a.txt"), "ALPHA-SENTINEL")
  writeFileSync(join(sb.cwd, "b.txt"), "BETA")
  const src = "请看 @a.txt 与 @b.txt 两处"
  assert.equal(stripAtRefs(injectAtRefs(src, sb.cwd, PROBE)), src, "回环：strip(inject(x)) === x")
  assert.equal(stripAtRefs("无引用纯文本"), "无引用纯文本", "零引用文本零动作")
  // 失败闭合四臂（形近 ⇒ 整条原样返回）
  const mismatch = "[File: a.txt]\n```\nX\n```\n\n[Referenced files:\n  - a.txt (2 chars)\n]"
  assert.equal(stripAtRefs(mismatch), mismatch, "正文字符数不符 ⇒ 原样")
  const noFence = "@a.txt\n\n[Referenced files:\n  - a.txt (5 chars)\n]"
  assert.equal(stripAtRefs(noFence), noFence, "头部缺围栏 ⇒ 原样")
  const badLine = "x\n\n[Referenced files:\n  X a.txt (5 chars)\n]"
  assert.equal(stripAtRefs(badLine), badLine, "摘要行不吻合 ⇒ 原样")
  const fenceOnly = "手打 [File: a.txt]\n```\nX\n```"
  assert.equal(stripAtRefs(fenceOnly), fenceOnly, "有围栏无摘要块（手打形）⇒ 原样")
})

test("②④薄壳：行为对拍（壳输出 === 核件 + 真探针）∕ 结构扫描 ∕ VSC 三调用面零改", () => {
  const sb = sandbox()
  writeFileSync(join(sb.cwd, "a.txt"), "ALPHA-SENTINEL")
  const src = "请看 @a.txt 内容"
  const viaCore = injectAtRefs(src, sb.cwd, PROBE)
  assert.ok(viaCore.includes("[File: a.txt]") && viaCore.includes("[Referenced files:"), "对拍基准 = 注入形（非零动作）")
  assert.equal(vscInject(src, sb.cwd), viaCore, "VSC 壳输出 = 核件 + 真探针（行为对拍）")
  assert.equal(desktopInject(src, sb.cwd), viaCore, "桌面壳输出 = 核件 + 真探针（行为对拍）")
  assert.equal(vscStrip, stripAtRefs, "VSC strip = 核件纯 re-export（单源身份）")
  assert.equal(desktopStrip, stripAtRefs, "桌面 strip = 核件纯 re-export（单源身份）")
  // 核件结构（单源证法：零 fs（探针缝）∧ 语法 ∕ 截断住核）
  const coreSrc = readFileSync(join(ROOT, "thincoder-core/file-refs.mjs"), "utf8")
  assert.ok(!coreSrc.includes('from "node:fs"'), "核件零 node:fs（盘面探针端侧注入）")
  assert.ok(coreSrc.includes("/@([^"), "注入 regex 住核件（语法与其逆变换同住一处）")
  assert.ok(coreSrc.includes("> 4000"), "4000 截断住核件")
  // 壳内结构扫描（零语法副本）
  for (const rel of ["thincoder-vscode/src/extension/file-refs.mjs", "thincoder-desktop/src/main/file-refs.mjs"]) {
    const shell = readFileSync(join(ROOT, rel), "utf8")
    assert.ok(!shell.includes("[Referenced files:"), `${rel}：零摘要块字面`)
    assert.ok(!shell.includes("@([^"), `${rel}：零 at-ref regex 定义`)
    assert.ok(!/readFileSync\s*\(/.test(shell), `${rel}：零 readFileSync 直用面（只作探针转发）`)
  }
  // VSC 三调用面零改（import 名 ∕ 源与调用形不变 —— 壳化前置约束）
  const chat = readFileSync(join(ROOT, "thincoder-vscode/src/extension/panel-chat.mjs"), "utf8")
  assert.ok(chat.includes('import { injectAtRefs } from "./file-refs.mjs"'), "panel-chat 注入 import 面零改")
  assert.ok(chat.includes("injectAtRefs(text, cwd)"), "panel-chat 调用形零改")
  const session = readFileSync(join(ROOT, "thincoder-vscode/src/extension/panel-session.mjs"), "utf8")
  assert.ok(session.includes('import { stripAtRefs } from "./file-refs.mjs"'), "panel-session 剥离 import 面零改")
  assert.ok(session.includes("stripAtRefs("), "panel-session 调用面在")
  const write = readFileSync(join(ROOT, "thincoder-vscode/src/extension/panel-session-write.mjs"), "utf8")
  assert.ok(write.includes('import { stripAtRefs } from "./file-refs.mjs"'), "panel-session-write 剥离 import 面零改")
  assert.ok(write.includes("stripAtRefs("), "panel-session-write 调用面在")
})

test("③标题源剥离：请求体零哨兵正文 ∧ 含 @a.txt（自守卫短路不触网）", async () => {
  const sb = sandbox()
  writeFileSync(join(sb.cwd, "a.txt"), "TITLE-SENTINEL-BODY")
  const injected = injectAtRefs("请解释 @a.txt 里的哨兵", sb.cwd, PROBE)
  assert.ok(injected.includes("TITLE-SENTINEL-BODY"), "夹具：注入形确携文件正文")
  let captured = null
  const prev = titleDeps.proxyFetchImpl
  titleDeps.proxyFetchImpl = async (url, opts) => {
    captured = opts.body
    return { ok: true, json: async () => ({ choices: [{ message: { content: "标题甲" } }] }) }
  }
  try {
    const agent = {
      provider: { apiKey: "k", baseURL: "http://127.0.0.1:1/v1", model: "m", proxyUri: "http://127.0.0.1:1" },
      title: "",
      history: [{ role: "user", content: injected }],
      _fullHistory: [{ role: "user", content: injected }],
    }
    const title = await ensureSessionTitle(agent)
    assert.equal(title, "标题甲", "标题链照常（剥离零阻断）")
    assert.ok(captured !== null, "请求已发（经 `_deps.proxyFetchImpl` 换桩 —— 零真实网络）")
    const body = JSON.parse(captured)
    const sent = body.messages.at(-1).content
    assert.ok(!sent.includes("TITLE-SENTINEL-BODY"), "请求体零文件正文（哨兵不在场）")
    assert.ok(sent.includes("@a.txt"), "剥离形起头 —— @a.txt 简洁形在")
  } finally {
    titleDeps.proxyFetchImpl = prev
  }
})

test("⑤⑥注入缝：用户回合 ⇒ run 收注入形 ∕ autoTurn 不扫 ∕ 缺缝原样 ∕ 恰一次（resume 复用）", async () => {
  const sb = sandbox()
  // 用户回合：注入形入 run 入参（恰一次）
  let calls = 0
  const runs = []
  const face = createTurnFace({
    post: () => {}, bridge: () => ({}), postUsage: () => {}, flights: new Map(),
    injectUserText: (t) => { calls += 1; return `【INJ】${t}` },
    run: async (agent, text, cb, opts) => { runs.push({ text, autoTurn: opts.autoTurn }) },
  })
  await face.executeTurn(KEY, makeAgent(sb.cwd), "原始文本", {})
  assert.equal(runs.at(-1).text, "【INJ】原始文本", "用户回合 ⇒ run 收注入形")
  assert.equal(calls, 1, "注入恰一次")
  // 系统轮（timer ∕ 消化 ∕ 上行同门）：原文，零注入调用
  await face.executeTurn(KEY, makeAgent(sb.cwd), "系统文本", { autoTurn: true })
  assert.equal(runs.at(-1).text, "系统文本", "autoTurn ⇒ 原文（不扫）")
  assert.equal(runs.at(-1).autoTurn, true, "autoTurn 旗标照常透传")
  assert.equal(calls, 1, "系统轮零注入调用")
  // 缺缝 ⇒ 原样（向后兼容）
  const face2 = createTurnFace({
    post: () => {}, bridge: () => ({}), postUsage: () => {}, flights: new Map(),
    run: async (agent, text) => { runs.push({ text }) },
  })
  await face2.executeTurn(KEY, makeAgent(sb.cwd), "缺缝文本", {})
  assert.equal(runs.at(-1).text, "缺缝文本", "缺缝 ⇒ 原样")
  // 恰一次（撞帽续跑径：resume 复用同一 body —— 核 resume 不重推用户消息）
  let inj = 0
  const resumed = []
  const face3 = createTurnFace({
    post: () => {}, bridge: () => ({}), postUsage: () => {}, flights: new Map(),
    injectUserText: (t) => { inj += 1; return `【INJ】${t}` },
    askContinue: async () => true,
    run: async (agent, text, cb, opts) => {
      resumed.push({ text, resume: opts.resume })
      if (resumed.length === 1) throw new ContinueError(3)
    },
  })
  await face3.executeTurn(KEY, makeAgent(sb.cwd), "续跑文本", {})
  assert.deepEqual(resumed.map((r) => r.text), ["【INJ】续跑文本", "【INJ】续跑文本"], "resume 复用同一 body")
  assert.deepEqual(resumed.map((r) => r.resume), [false, true], "第二次 = resume 重入")
  assert.equal(inj, 1, "注入恰一次（不随 resume 重跑）")
})

test("⑤⑥⑥驱动面：无根零动作 ∕ 有根注入 ∕ 负向锁（队快照 ∥ delivered 零 [File:）", async () => {
  const sb = sandbox()
  writeFileSync(join(sb.cwd, "a.txt"), "DRIVER-SENTINEL")
  // 有根：注入形只在 run 入参；队面 ∥ delivered 恒原文
  const gate = deferred()
  const events = []
  const runs = []
  const post = (channel, payload) => events.push({ channel, payload })
  const agent = makeAgent(sb.cwd)
  const driver = createTurnDriver({
    post, bridge: () => ({}), postUsage: () => {},
    run: async (a, text) => { runs.push(text); if (runs.length === 1) await gate.promise },
    ensure: async () => agent, forgetKey: () => {}, dropScope: () => {}, denyGates: () => {},
    projects: { currentCwd: () => sb.cwd },
  })
  assert.deepEqual(await driver.send(KEY, "@a.txt 第一"), { ok: true }, "首条受理即起跑")
  assert.ok(await waitUntil(() => runs.length === 1), "run 已入场")
  assert.ok(runs[0].includes("[File: a.txt]"), "注入恰发生在 run 入参")
  assert.deepEqual(await driver.send(KEY, "@a.txt 第二"), { ok: true, queued: true }, "忙态入队（原文入队）")
  const queuedFrames = events.filter((e) => e.channel === "ev:queue")
  assert.ok(queuedFrames.some((f) => f.payload.items?.includes("@a.txt 第二")), "队快照 = 条目原文")
  assert.ok(!JSON.stringify(queuedFrames.map((f) => f.payload)).includes("[File:"), "队帧全程零 [File:（注入不前移）")
  gate.resolve()
  assert.ok(await waitUntil(() => runs.length >= 2), "结算后续发（第二回合起跑）")
  assert.ok(runs[1].includes("[File: a.txt]"), "续发径同样收注入形")
  const delivered = events.filter((e) => e.channel === "ev:queue" && e.payload.delivered).map((e) => e.payload.delivered)
  assert.ok(delivered.some((d) => d.text === "@a.txt 第二"), "delivered.text = 条目原文")
  assert.ok(delivered.every((d) => !String(d.text).includes("[File:")), "delivered 零注入形")
  assert.ok(await waitUntil(() => driver.busyOf(KEY) === false), "两回合收束（零悬挂在飞）")
  // 无根（cwd 空）：原样（零动作 —— 防御臂）
  const runs2 = []
  const driver2 = createTurnDriver({
    post: () => {}, bridge: () => ({}), postUsage: () => {},
    run: async (a, text) => { runs2.push(text) },
    ensure: async () => makeAgent(sb.cwd), forgetKey: () => {}, dropScope: () => {}, denyGates: () => {},
    projects: { currentCwd: () => "" },
  })
  assert.deepEqual(await driver2.send(KEY, "@a.txt 无根"), { ok: true }, "无根受理照常")
  assert.ok(await waitUntil(() => runs2.length === 1), "run 已入场")
  assert.equal(runs2[0], "@a.txt 无根", "无根 ⇒ 原样（零动作）")
  assert.ok(await waitUntil(() => driver2.busyOf(KEY) === false), "无根回合收束")
})

test("⑨负向锁（pickup）：步边界取批推送文本 == 原文（两端零注入——F1 同形）", () => {
  const sb = sandbox()
  writeFileSync(join(sb.cwd, "a.txt"), "PICKUP-SENTINEL")
  const agent = makeAgent(sb.cwd)
  const events = []
  const entry = { text: "@a.txt 排队文本", ts: 1, images: [] }
  const chain = createTurnChain({
    queue: { snapshot: () => [], plan: () => entry, take: () => entry },
    post: (channel, payload) => events.push({ channel, payload }),
    prepare: (text) => ({ text, paths: [], dropped: 0, degraded: null }),
    drive: () => {},
  })
  assert.equal(chain.stepBoundaryPickup(KEY, agent), true, "取批成立（plan 非空 ∧ 零图）")
  const pushed = agent.history.filter((m) => m.role === "user").at(-1)
  assert.equal(pushed.content, "@a.txt 排队文本", "pushReal 原文直落（零注入）")
  assert.ok(!JSON.stringify(events).includes("[File:"), "回执帧零注入形")
  // 结构面：两条 pickup 链件零注入引用（注入点单源 = turn-face 起跑前；F1 两端同形）
  for (const rel of ["thincoder-desktop/src/main/turn-chain.mjs", "thincoder-vscode/src/extension/queued-pickup.mjs"]) {
    assert.ok(!readFileSync(join(ROOT, rel), "utf8").includes("injectAtRefs"), `${rel} 零注入引用`)
  }
})

test("⑦恢复面剥离：首屏 + 回填同门 ∕ assistant 零动 ∕ 盘面零改", async () => {
  const sb = sandbox()
  writeFileSync(join(sb.cwd, "a.txt"), "PAGE-SENTINEL")
  const injected = injectAtRefs("请看 @a.txt 哨兵", sb.cwd, PROBE)
  const slot = await newSession(sb.cwd)
  const p = slotPath(sb.cwd, slot)
  const data = JSON.parse(readFileSync(p, "utf8"))
  const assistantTail = "讲解\n\n[Referenced files:\n  - a.txt (13 chars)\n]"
  data.history = [
    { role: "user", content: injected },
    { role: "assistant", content: assistantTail },
  ]
  writeFileSync(p, JSON.stringify(data))
  // 首屏（before 缺省）：user 剥离、assistant 零动
  const first = pageHistory(sb.cwd, { key: String(slot) })
  assert.equal(first.ok, true, "读面成功")
  assert.equal(first.messages[0].text, "请看 @a.txt 哨兵", "首屏：user 文本 = 剥离形（恢复面 ≡ 活面）")
  assert.equal(first.messages[1].text, assistantTail, "assistant 零动（同尾形文本原样）")
  // 回填页（before 非空）同门
  const back = pageHistory(sb.cwd, { key: String(slot), before: 1 })
  assert.equal(back.messages.length, 1, "回填页取窗成立")
  assert.equal(back.messages[0].text, "请看 @a.txt 哨兵", "回填页同门剥离")
  assert.equal(back.seed, undefined, "回填页零播种（仅首屏携 seed）")
  // 盘面零改（注入形 = 落盘形 —— 只剥离显示面）
  const onDisk = JSON.parse(readFileSync(p, "utf8"))
  assert.equal(onDisk.history[0].content, injected, "盘面 user 消息仍为注入形")
})

test("⑩欢迎条 @ 段：两语值含 @ 段（词表锁）", () => {
  const zh = VIEWS_DICT.zh["welcome.shortcuts"]
  const en = VIEWS_DICT.en["welcome.shortcuts"]
  assert.equal(zh, "输入 @ 引用文件 · Enter 发送 · Shift+Enter 换行", "zh 值锁定")
  assert.equal(en, "Type @ for file references · Enter to send · Shift+Enter for newline", "en 值锁定")
})
