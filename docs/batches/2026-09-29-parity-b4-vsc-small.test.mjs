/**
 * 2026-09-29-parity-b4-vsc-small.test.mjs — 批次本地单元件（parity-b4 · W3 收口波 · 随批留存归档）。
 * 名随批次档 · 住批次目录 · 不进仓套件；复跑 = 从仓库根 `thincoder/`：
 *   node --test docs/batches/2026-09-29-parity-b4-vsc-small.test.mjs
 * （本刻暂存 `.thincoder/tmp/` 同名件——导入按 `process.cwd()`（仓库根）相对解析 ⇒ tmp ∕ 终位两处可跑。）
 *
 * 用例 = 批档 §2.9 用例表全表（T1–T11）+ T12（窗后查位 ∕ 清理面——W3 待办 ④）：核件（live-beat ∕ file-links ∕
 * attachments ∕ vision-reader ∕ provider-flows ∕ notify-policy）+ desk 面（degradeTurnAttachments ∕ continueTurn）；
 * W2 墙钟判据按 D-7 换事件序 ∕ 信号面；收束 = `t.after`（桩 ∕ 两 seam 复位）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { createServer } from "node:http"
import { existsSync, mkdirSync, mkdtempSync, readdirSync, realpathSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-core"))) throw new Error(`从仓库根（thincoder/）运行（cwd = ${ROOT}）`)
const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)
const canon = (rel) => realpathSync(resolve(ROOT, rel)).toLowerCase()
const [liveBeat, fileLinks, att, vision, flows, policy, deskAtt, chainMod, driverMod, queuedMod, configIo, slots] = await Promise.all([
  mod("thincoder-core/agent/live-beat.mjs"), mod("thincoder-core/file-links.mjs"), mod("thincoder-core/attachments.mjs"),
  mod("thincoder-core/vision-reader.mjs"), mod("thincoder-core/provider-flows.mjs"), mod("thincoder-core/notify-policy.mjs"),
  mod("thincoder-desktop/src/main/attachments.mjs"), mod("thincoder-desktop/src/main/turn-chain.mjs"),
  mod("thincoder-desktop/src/main/turn-driver.mjs"), mod("thincoder-desktop/src/main/queued-input.mjs"),
  mod("thincoder-desktop/node_modules/@thincoder/core/config-io.mjs"), mod("thincoder-desktop/node_modules/@thincoder/core/session-slots.mjs"),
])
assert.equal(canon("thincoder-desktop/node_modules/@thincoder/core/config-io.mjs"), canon("thincoder-core/config-io.mjs"), "挂载判据：junction 目标 = 活核树同一文件（canon 形——先例 = b1:117）")

const VISION = "claude-sonnet-4-5" // spec.multimodal === true
const TEXT = "deepseek-chat" // 非视觉（default spec）
const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
const img = () => PNG // IPC 附件元素形（`msg:send.images` 载荷 = dataURL 串——A1；名 ∕ mime 由核从串推）
const png = (n) => `data:image/png;base64,${Buffer.alloc(n, 7).toString("base64")}`
const base = (p) => p.split(/[\\/]/).pop()
const deferred = () => { let resolve; const promise = new Promise((r) => { resolve = r }); return { promise, resolve } }
const until = async (fn, ms = 15000) => { const t0 = Date.now(); while (!fn()) { if (Date.now() - t0 > ms) throw new Error("until timeout"); await new Promise((r) => setTimeout(r, 5)) } return true }

test("T1 核 live-beat：单拍 ∕ 起停 ∕ 幂等（假钟注入 + beat 计数）", () => {
  let beats = 0, timerCalls = 0
  const clock = {}
  const beat = liveBeat.createLiveBeat({
    beat: () => (beats += 1),
    timer: (fn, ms) => { timerCalls += 1; clock.fn = fn; clock.ms = ms; return { unref: () => { clock.unref = true } } },
    clear: (h) => { clock.cleared = h },
  })
  assert.equal(liveBeat.LIVE_HEARTBEAT_MS, 2000, "拍间隔 = 2000ms")
  assert.throws(() => liveBeat.createLiveBeat({}), TypeError, "beat 缝缺 ⇒ 抛（fail-loud）")
  const h = beat.start()
  assert.equal(timerCalls, 1, "起拍：timer 恰一次（返句柄）")
  assert.equal(beat.start(), h, "再起幂等（返既有句柄，零重起）")
  assert.deepEqual([clock.ms, clock.unref], [2000, true], "周期 2000 ∕ unref 入核")
  assert.equal(clock.fn(), 1, "beat() 直驱计数")
  beat.stop()
  beat.stop()
  assert.deepEqual([clock.cleared, timerCalls], [h, 1], "停拍：clear 恰一次（再停零动作）——句柄已清 ⇒ 平台钟不再拍")
  assert.notEqual(beat.start(), h, "停后可再起（新句柄）")
})

test("T2 核 file-links：探针缺 ⇒ 抛（fail-loud）", () => {
  assert.throws(() => fileLinks.extractFileLinks("/p", "a.mjs"), TypeError)
  assert.throws(() => fileLinks.extractFileLinks("/p", "a.mjs", { existsSync: () => true }), TypeError, "半形同拒")
  assert.deepEqual(fileLinks.extractFileLinks("/p", "", null), [], "空文本先于缝校验早退")
})

test("T3 核 file-links：存在闸（假探针 ⇒ 仅 a.mjs 成链接）", () => {
  const cwd = join(tmpdir(), "b4-links")
  const probe = { existsSync: (p) => p === join(cwd, "a.mjs"), statSync: () => ({ isFile: () => true }) }
  const links = fileLinks.extractFileLinks(cwd, "改 a.mjs、b.mjs 与 a.mjs:12 即可", probe)
  assert.deepEqual(links.map((l) => [l.raw, l.line]), [["a.mjs", null], ["a.mjs:12", 12]], "b.mjs 不成链接；同路径按行号分键")
})

test("T4 核 attachments：预算闸 ∕ 弃项源序", () => {
  assert.deepEqual([att.IMAGE_MAX_BYTES, att.TURN_MAX_BYTES], [15_000_000, 30_000_000], "两阈十进制（对齐 read_image 内闸）")
  const r = att.savePastedImages([png(64), png(15_000_000), png(15_000_000), png(64)], join(tmpdir(), "b4-cwd"),
    { fs: { mkdirSync: () => {}, writeFileSync: () => {} } })
  assert.equal(r.dropped, 1, "合计超 30MB ⇒ 中段 1 项弃（弃后继续扫）")
  assert.deepEqual(r.paths.map((p) => base(p).replace(/^paste-[a-z0-9]+-/, "paste-<id>-")),
    ["paste-<id>-0.png", "paste-<id>-1.png", "paste-<id>-3.png"], "命名 = 源序（i 恒 = 输入序，弃项不重编号）")
})

test("T5 核 downgradeNonVisionImages：三径 + 缝缺 ⇒ 抛", async () => {
  const withImg = { text: "t", images: ["/p/a.png"], downgraded: false }
  assert.deepEqual(await att.downgradeNonVisionImages({ text: "t", images: [], model: TEXT }), { text: "t", images: [], downgraded: false }, "无图早退")
  assert.deepEqual(await att.downgradeNonVisionImages({ ...withImg, model: VISION }), withImg, "多模态早退")
  assert.deepEqual(await att.downgradeNonVisionImages({ ...withImg, model: TEXT, visionReader: async () => ({ ok: true, description: " 猫 " }) }),
    { text: "t\n\n[图片 /p/a.png 描述: 猫]", images: undefined, downgraded: true }, "注文成功（trim）")
  assert.deepEqual(await att.downgradeNonVisionImages({ ...withImg, model: TEXT, visionReader: async () => ({ ok: "yes", description: "d" }) }), withImg, "ok 非真布尔 ⇒ 原样兜底（严判）")
  await assert.rejects(att.downgradeNonVisionImages({ ...withImg, model: TEXT }), TypeError, "缝缺 ⇒ 抛")
})

test("T6 核 vision-reader：无渠道 ⇒ null（原样兜底）", () => {
  assert.equal(vision.findVisionChannel([], ""), null, "空渠道表 ⇒ null")
  assert.equal(vision.findVisionChannel([{ name: "a", model: TEXT }], "a"), null, "无视觉渠道 ⇒ null")
  assert.deepEqual(vision.findVisionChannel([{ name: "a", model: TEXT }, { name: "b", model: VISION }], "a"), { provider: "b", model: VISION }, "同名无视觉 ⇒ 首视觉回退")
  assert.deepEqual(vision.findVisionChannel([{ name: "a", model: TEXT }, { name: "b", model: VISION }, { name: "c", model: VISION }], "c"), { provider: "c", model: VISION }, "同名视觉优先")
})

test("T7 核 provider-flows：拒因同串", () => {
  assert.equal(flows.providerNameError(" ", new Set()), "Name is required")
  assert.equal(flows.providerNameError("p", new Set(["p"])), "Name already in use")
  assert.equal(flows.providerNameError("openai", new Set()), "Name already in use", "撞预设名同因")
  assert.equal(flows.customFieldsError({ baseURL: "", model: "m" }), "Base URL is required")
  assert.equal(flows.customFieldsError({ baseURL: "u", model: "" }), "Model is required")
  assert.equal(flows.customFieldsError({ baseURL: "u", model: "m", format: "bogus" }), "Unknown API format: bogus (expected openai/anthropic/google)")
})

test("T8 核 notify-policy：单档（D3 批后）· 失焦门", () => {
  const calls = []
  const n = policy.createNotifier({ notify: (p) => calls.push(p), focused: () => false })
  assert.equal("digestStart" in n, false, "档②面不存在（D3 去档）")
  assert.equal(n.turnDone({ agent: { title: "会话甲", config: { locale: "zh" } } }), true, "失焦 + turnDone ⇒ 落子")
  assert.deepEqual(calls[0], { body: "ThinCoder：本轮完成", title: "会话甲" }, "单档正文 + title 携带")
  assert.equal(policy.createNotifier({ notify: (p) => calls.push(p), focused: () => true }).turnDone({ agent: {} }), false, "聚焦 ⇒ 门闭合")
  assert.equal(calls.length, 1, "零旁落子")
})

test("T9 核 notify-policy：localeOf 缝（zh-CN 归一）", () => {
  const calls = []
  policy.createNotifier({ notify: (p) => calls.push(p), focused: () => false, localeOf: () => "zh-CN" }).turnDone({ agent: {} })
  assert.deepEqual(calls[0], { body: "ThinCoder：本轮完成" }, "缝值经 normalizeLocale（zh-CN ⇒ zh）；空 title 零携")
  policy.createNotifier({ notify: (p) => calls.push(p), focused: () => false }).turnDone({ agent: { config: { locale: "zh" } } })
  assert.equal(calls[1].body, "ThinCoder：本轮完成", "缺省缝 = agent.config.locale（桌面径零改）")
})

test("T10 desk degradeTurnAttachments：三径（桩 visionReader）", async () => {
  const paths = ["/t/p1.png", "/t/p2.png"]
  const attached = { text: "看图", paths, dropped: 0, degraded: "non-vision" }
  const okr = await deskAtt.degradeTurnAttachments(attached, { model: TEXT, cwd: "/t", locale: "zh", visionReader: async () => ({ ok: true, description: "猫" }) })
  assert.deepEqual(okr, { text: "看图\n\n[图片 /t/p1.png、/t/p2.png 描述: 猫]", paths, degraded: null }, "成功 ⇒ 注文 + degraded:null")
  assert.equal((await deskAtt.degradeTurnAttachments({ ...attached, dropped: 1 }, { model: TEXT, cwd: "/t", locale: "zh", visionReader: async () => ({ ok: true, description: "猫" }) })).degraded, "partial", "成功 ∧ 弃项 ⇒ partial")
  assert.deepEqual(await deskAtt.degradeTurnAttachments(attached, { model: TEXT, cwd: "/t", locale: "zh", visionReader: async () => { throw new Error("boom") } }),
    { text: "看图\n\n图片未随发——该模型不支持图片", paths, degraded: "non-vision" }, "失败 ⇒ 说明行 + non-vision（零抛）")
  assert.deepEqual(await deskAtt.degradeTurnAttachments(attached, { model: VISION, cwd: "/t", locale: "zh" }), attached, "多模态 ⇒ 原样（指针径）")
  assert.deepEqual(await deskAtt.degradeTurnAttachments({ ...attached, paths: [] }, { model: TEXT, cwd: "/t" }), { ...attached, paths: [] }, "零图 ⇒ 原样")
})

test("T11 desk continueTurn：async · 空队 false 直返 · 队非空降级毕交付 · 窗内 send 落队", async (t) => {
  const mini = chainMod.createTurnChain({ queue: queuedMod.createQueuedInput(), post: () => {}, prepare: () => ({ text: "", paths: [], dropped: 0, degraded: null }), drive: () => {} })
  const p0 = mini.continueTurn("1", {})
  assert.equal(typeof p0.then, "function", "async（Promise<boolean>）")
  assert.equal(await p0, false, "空队 ⇒ false 直返")

  const root = mkdtempSync(join(tmpdir(), "b4-t11-"))
  const cwd = join(root, "proj")
  mkdirSync(cwd, { recursive: true })
  slots._setSessionsDirForTest(join(root, "sessions"))
  const hits = { n: 0 }
  const release = deferred()
  const srv = createServer((req, res) => {
    hits.n += 1 // 桩收到读图请求 = 降级窗开（事件序判据）
    void release.promise.then(() => {
      res.writeHead(200, { "content-type": "application/json" })
      res.end(JSON.stringify({ choices: [{ message: { role: "assistant", content: "一只猫。" } }], usage: { prompt_tokens: 5, completion_tokens: 3 } }))
    })
  })
  await new Promise((r) => srv.listen(0, "127.0.0.1", r))
  t.after(() => { srv.close(); configIo._resetConfigPathForTest(); slots._resetSessionsDirForTest() })
  const entry = { name: "vis", baseURL: `http://127.0.0.1:${srv.address().port}`, model: VISION, apiKey: "k" }
  writeFileSync(join(root, "cfg.json"), JSON.stringify({ providers: [entry] }))
  configIo._setConfigPathForTest(join(root, "cfg.json"))
  const events = [], runs = []
  const agent = { title: "t", cwd, _slot: 1, history: [], _fullHistory: [], tasks: [], planMode: false, autoApprove: false, goal: null, _pendingReminders: [],
    provider: { name: "vis", model: TEXT }, config: { providersList: [entry], traces: { enabled: false }, agent: {}, locale: "zh" }, memory: { db: null } }
  const driver = driverMod.createTurnDriver({
    post: (ch, payload) => events.push({ ch, payload }),
    run: (a, text) => new Promise((res) => runs.push({ text, res })),
    bridge: () => ({}), postUsage: () => {}, projects: { currentCwd: () => cwd },
    ensure: async () => agent, forgetKey: () => {}, dropScope: () => {}, denyGates: () => {},
  })
  assert.equal((await driver.send("1", "one", null)).ok, true, "#841：成功回执另携 providerState")
  assert.deepEqual(await driver.send("1", "two", [img()]), { ok: true, queued: true }, "在飞 ⇒ 入队")
  runs[0].res("done") // 结算 #1 ⇒ takeOver ⇒ continueTurn（async）⇒ 降级窗
  assert.ok(await until(() => hits.n > 0), "桩收到读图请求（事件序：降级窗开）")
  assert.deepEqual(await driver.send("1", "three", null), { ok: true, queued: true }, "窗内 send ⇒ 落队（hold 占位在飞表）")
  assert.equal(runs.length, 1, "窗内零第二回合（单驱动器不变量）")
  release.resolve() // 降级毕 ⇒ 取批 ∕ 起跑
  await until(() => runs.length === 2)
  const hit = runs[1].text.match(/\[图片 (.*?) 描述: (.*?)\]/)
  assert.ok(hit, `续发回合 = 描述注文：${runs[1].text}`)
  assert.deepEqual([hit[2], existsSync(hit[1])], ["一只猫。", true], "桩描述入注文；落盘件在场（窗后交回合尾清理）")
  runs[1].res("done")
  await until(() => runs.length === 3)
  assert.equal(runs[2].text, "three", "窗内落队项随续发链送达（队保序）")
  assert.ok(events.some((e) => e.ch === "ev:queue" && e.payload.delivered?.text === "three"), "消费回执 delivered（窗内落队项）")
  assert.equal(existsSync(hit[1]), false, "回合尾 cleanupTurn 清毕（清理面）")
  runs[2].res("done")
})

test("T12 desk 窗后查位：续发链降级窗内 dispose ⇒ 零续发 ∕ 零 delivered ∕ 落盘件自清", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "b4-t12-"))
  const cwd = join(root, "proj")
  mkdirSync(cwd, { recursive: true })
  slots._setSessionsDirForTest(join(root, "sessions"))
  let hits = 0
  const srv = createServer((req, res) => { hits += 1 }) // 请求悬挂（响应永不出）——窗内 dispose 后由客户端 abort 收束
  await new Promise((r) => srv.listen(0, "127.0.0.1", r))
  t.after(() => { srv.close(); configIo._resetConfigPathForTest(); slots._resetSessionsDirForTest() })
  const entry = { name: "vis", baseURL: `http://127.0.0.1:${srv.address().port}`, model: VISION, apiKey: "k" }
  writeFileSync(join(root, "cfg.json"), JSON.stringify({ providers: [entry] }))
  configIo._setConfigPathForTest(join(root, "cfg.json"))
  const events = [], runs = []
  const agent = { title: "t", cwd, _slot: 1, history: [], _fullHistory: [], tasks: [], planMode: false, autoApprove: false, goal: null, _pendingReminders: [],
    provider: { name: "vis", model: TEXT }, config: { providersList: [entry], traces: { enabled: false }, agent: {}, locale: "zh" }, memory: { db: null } }
  const driver = driverMod.createTurnDriver({
    post: (ch, payload) => events.push({ ch, payload }),
    run: (a, text) => new Promise((res) => runs.push({ text, res })),
    bridge: () => ({}), postUsage: () => {}, projects: { currentCwd: () => cwd },
    ensure: async () => agent, forgetKey: () => {}, dropScope: () => {}, denyGates: () => {},
  })
  assert.equal((await driver.send("1", "one", null)).ok, true, "#841：成功回执另携 providerState")
  assert.deepEqual(await driver.send("1", "two", [img()]), { ok: true, queued: true }, "在飞 ⇒ 入队")
  runs[0].res("done") // ⇒ takeOver ⇒ continueTurn（降级窗；prepare 已先落盘）
  const tmp = join(cwd, ".thincoder", "tmp")
  assert.ok(await until(() => hits > 0 && existsSync(tmp) && readdirSync(tmp).length === 1), "降级窗开 + 落盘件在场")
  driver.dispose("1") // 窗内 dispose：占位被摘 ⇒ 链侧窗后查位命中
  assert.ok(await until(() => (existsSync(tmp) ? readdirSync(tmp).length : 0) === 0), "落盘件自清（窗后查位自清径）")
  assert.equal(runs.length, 1, "零续发（零第二回合起跑）")
  assert.equal(events.some((e) => e.ch === "ev:queue" && e.payload?.delivered?.text === "two"), false, "零 delivered 回执（未取批）")
})
