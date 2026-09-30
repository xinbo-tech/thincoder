/**
 * c3 探针 · 舱 3（#656 —— KD-52「入口预检回执 + toast + 文本不吞」）—— 真 Electron（本舱亲跑作证 ∥ 父侧可复跑）。
 * 两腿（语义单源 = `docs/batches/2026-09-29-desktop-carryover.md` §2.5 ∥ `docs/desktop/design/PROJECT.md` §2 KD-52）：
 *   腿 B（队空 ⇒ 受理径）：cap 询问待答 ∧ 队空 ∧ Ctrl+I 携文 ⇒ 受理（`{ok:true}`）⇒ 携文入队并被下一回合
 *     消费（用户块入流 ∥ 队清空 ∥ 询问按取消结算退场 ∥ 零 toast ∥ 输入框零回注）+ 携文回合再撞帽 ⇒ 新询问
 *     （新 promptId）——**与腿 A 同手势异前提，互为负向对照**（toast 无/有 ∥ 队变/不变 ∥ 输入零回注/回注）。
 *   腿 A（队满 8 ⇒ 拒收径）：cap 询问待答 ∧ 队满（8）∧ Ctrl+I 携文 ⇒ `{ok:false, reason:"queue-full"}` ⇒
 *     **toast 在场**（词键 `input.slotFull`；核件 `#paste-toast.visible`）∧ **询问仍在场**（同 promptId ∧ 作答控件在场：选项 ≥2）
 *     ∧ **输入框已回注**（文本逐字）∧ **队数不变**（8 ∥ 内容逐字同 ∧ 携文零入队）∧ **回合未中止**
 *     （见证面：`running` 位标存续 ∥ 静默窗零新模型调用 —— 终局事件会清位标 ⇒ 「零终局」由位标存续代言）。
 * 状态构造 = **真链路**（非注入）：桩模型服务（OpenAI 兼容 SSE —— 每轮回一枚 `read` 工具调用）+
 *   `agent.maxTurns=2` ⇒ 每段回合 2 轮撞帽 ⇒ `ContinueError` ⇒ cap 询问（`turn-face.mjs` `askContinue` ⇒ 既有
 *   待决门 `suspensions.mjs` ⇒ `ev:question`）⇒ 询问卡在流内显形（= 本探针的「cap 待答」态；真机终态）。
 *   队列填充 = 真提交（busy 径：键入 + Enter ⇒ `queuedUserMessage` ⇒ 宿主 `queued.add`，容量 8 按键判）。
 * Ctrl+I 携文 = **真键位**（输入框 focus ⇒ Ctrl+I 入中断模态 ⇒ Enter 提交 `post("interrupt", { message })` ⇒
 *   `composer-wire.mjs` `abortTurn` ⇒ `msg:interrupt`）；队数读数 = 宿主权威面（`history:page` 回执 `queue` 键
 *   = `agentHost.queueSnapshot` 单源）+ 渲染镜面（`pending` 切片）。
 * 判面 = **有界谓词等待**（`waitForFunction` + 兜底 `catch` 后照断言——判别力不损）；失败信号 = `failed` ∕
 *   `verdict` 读数 + 非零退出码（沿 P10 ∥ P9 ∥ P1 ∥ P2P5 先例）。逐判具名（零「全绿」空条款）。
 * 判别力复跑（临时突变 · 本舱执行后已还原）：断 `turn-input.mjs` 入口预检（`queued.add` 判不生效）⇒ 腿 A
 *  七条判面转红（`aToast` ∕ `aRejectLog` ∕ `aInputReinjected` ∥ `aQuestionKept` ∥ `aQueueUnchanged` ∥
 *  `aPendingUnchanged` ∥ `aNoNewModelCall`）+ 腿 B 全绿（受理径不受突变影响）⇒ 复原 + 复跑 25/25 · exit 1 ⇒ 0。
 * 跑法（自仓库根，即含 `thincoder-core/` 的目录）：`node .thincoder/tmp/2026-09-29-desktop-carryover-c3.probe.mjs`
 *   （暂存位两层深 ⇒ 与终位 `docs/batches/` 同名件相对路径一致；终位转正 = 父侧收口——写门拒子代理批内伴随件，
 *   沿批档 §5 舱 3「件暂存位」先例）。读数落盘 = 本档同目录 `2026-09-29-desktop-carryover-c3-readings.json`
 *   （`checks` 逐判自述 + 版本绑 `ts` ∥ `probeHash`；暂存 ⇒ 父侧连同本件一并收位 `docs/batches/`）；
 *   判别力证据两件随收 = `…-c3-readings.clean1.json`（首轮净跑全绿）∥ `…-c3-readings.mutation.json`（突变红集 7 条）。
 */
import { createHash } from "node:crypto"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { createServer } from "node:http"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { createRequire } from "node:module"

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = join(HERE, "..", "..") // 仓根（`.thincoder/tmp` ∥ `docs/batches` 同深 ⇒ 两处均可跑）
const APP_DIR = join(REPO, "thincoder-desktop")
const READINGS = join(HERE, "2026-09-29-desktop-carryover-c3-readings.json")
const requireApp = createRequire(join(APP_DIR, "package.json"))
const { _electron: electron } = requireApp("playwright-core")
const WAIT = { timeout: 30000 }
const EXPECTED_CHECKS = 25 // 判面总数（逐判具名；录制数 ≠ 本值 ⇒ verdict 假——零「全绿」空条款）
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const hashOf = (cwd) => createHash("sha1").update(String(cwd).replace(/^([a-z]):/, (_, d) => `${d.toUpperCase()}:`)).digest("hex") // 复刻单源 = `thincoder-core/session-slots.mjs`（`normalizeCwd` 口径）· 漂移即红（`fSessionActive` 判面）

// ── 桩模型服务（OpenAI 兼容；/models 秒回——候选面；chat 每轮回一枚 `read` 工具调用 ⇒ 回合环持续）──
let chatCalls = 0
let toolSeq = 0
const server = createServer((req, res) => {
  let body = ""
  req.on("data", (chunk) => (body += chunk))
  req.on("end", () => {
    if (req.url.includes("/models")) {
      res.writeHead(200, { "content-type": "application/json" })
      res.end(JSON.stringify({ object: "list", data: [{ id: "stub-c3" }] }))
      return
    }
    chatCalls += 1
    toolSeq += 1
    const events = [
      { choices: [{ index: 0, delta: { role: "assistant", tool_calls: [{ index: 0, id: `call_c3_${toolSeq}`, type: "function", function: { name: "read", arguments: JSON.stringify({ path: "probe-notes.md" }) } }] }, finish_reason: null }] },
      { choices: [{ index: 0, delta: {}, finish_reason: "tool_calls" }] },
    ]
    res.writeHead(200, { "content-type": "text/event-stream" })
    res.end(events.map((ev) => `data: ${JSON.stringify(ev)}\n\n`).join("") + "data: [DONE]\n\n")
  })
})
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve))
const PORT = server.address().port

// ── 夹具（隔离家目录 + 真槽文件 + 桩渠道；沿 P2P5 先例）────────────────────────────────────────
const home = mkdtempSync(join(tmpdir(), "carryover-c3-home-"))
const project = mkdtempSync(join(tmpdir(), "carryover-c3-proj-"))
const stateDir = join(home, ".thincoder")
const slots = join(stateDir, "sessions")
mkdirSync(slots, { recursive: true })
writeFileSync(join(stateDir, "config.json"), JSON.stringify({
  locale: "en",
  agent: { maxTurns: 2 }, // 撞帽快径：每段回合 2 轮 ⇒ ContinueError ⇒ cap 询问
  defaultModel: "alpha:stub-c3",
  providers: [{ name: "alpha", baseURL: `http://127.0.0.1:${PORT}/v1`, apiKey: "k-alpha", model: "stub-c3" }],
}))
writeFileSync(join(project, "probe-notes.md"), "# c3 probe fixture\n\nline two.\n\nline four.\n")
const base = join(slots, `${hashOf(project)}.json`)
writeFileSync(base, JSON.stringify({ cwd: project }))
writeFileSync(`${base}.1`, JSON.stringify({
  version: 2, cwd: project, title: "c3 探针会话", updatedAt: Date.now(),
  history: [
    { role: "user", content: "c3 开场", ts: Date.now() - 3000 },
    { role: "assistant", content: "c3 开场回执", ts: Date.now() - 2000 },
  ],
  contextHistory: [], tasks: [], planMode: false, goal: null, autoApprove: true, advisor: null, effort: null,
  pendingReminders: [], sessionStart: Date.now() - 60000,
  createdBy: "desktop", activeProvider: "alpha", activeModel: "stub-c3",
}))
writeFileSync(`${base}.manifest`, JSON.stringify({
  slots: { "1": { ts: Date.now(), messageCount: 2, updatedAt: Date.now(), title: "c3 探针会话", activeProvider: "alpha", activeModel: "stub-c3" } },
}))
writeFileSync(`${base}.manifest.desktop`, JSON.stringify({ slot: 1, updatedAt: Date.now() }))

// ── 读数账 ───────────────────────────────────────────────────────────────────────────────────
const checks = {}
const detail = {}
const out = { boot: null, phases: {}, readings: {}, checks, detail, failed: [], verdict: false, notes: [] }
const record = (name, pass, info) => { checks[name] = pass === true; detail[name] = info ?? null }

let app = null
try {
  const env = { ...process.env, HOME: home, USERPROFILE: home, APPDATA: home, XDG_CONFIG_HOME: home }
  delete env.ELECTRON_RUN_AS_NODE
  app = await electron.launch({ args: [".", `--user-data-dir=${join(home, "ud")}`], cwd: APP_DIR, env })
  const page = await app.firstWindow()
  const consoleMsgs = []
  page.on("console", (m) => consoleMsgs.push({ type: m.type(), text: m.text().slice(0, 400) }))
  const pageErrors = []
  page.on("pageerror", (e) => pageErrors.push(e.message.slice(0, 400)))
  await page.waitForLoadState("domcontentloaded").catch(() => {})
  await page.waitForFunction(() => ["ok", "error"].includes(document.documentElement.dataset.boot), null, WAIT).catch(() => {})
  out.boot = await page.evaluate(() => document.documentElement.dataset.boot)
  record("fBootOk", out.boot === "ok", out.boot)

  // ── 前置：开项目 + 会话续起（真链路）+ 页内读面助手 ─────────────────────────────────────────
  const opened = await page.evaluate(async (p) => {
    const mod = await import(new URL("./mount-sessions.mjs", document.baseURI).href)
    const receipt = await window.thincoder.invoke("project:open", { fsPath: p })
    await mod.refreshRail()
    await mod.resumeOpened()
    return receipt
  }, project)
  out.readings.projectOpen = { cwd: opened?.cwd ?? null }
  record("fProjectOpened", opened?.cwd === project, out.readings.projectOpen)

  await page.evaluate(async () => {
    const { store } = await import(new URL("./store.mjs", document.baseURI).href)
    window.__c3 = {
      store,
      key: () => store.get()?.activeSession ?? null,
      input: () => document.querySelector("#input"),
      toast: () => document.getElementById("paste-toast"),
      interruptMode: () => document.querySelector("#input")?.classList.contains("interrupt-mode") === true,
      pendingLen: () => {
        const s = store.get(); const k = s?.activeSession; const list = k === null ? null : s?.pending?.[k]
        return Array.isArray(list) ? list.length : 0
      },
      running: () => {
        const s = store.get(); const k = s?.activeSession; const b = k === null ? null : s?.tabBadges?.[k]
        return Array.isArray(b) && b.includes("running")
      },
      userTexts: () => (store.get()?.blocks ?? []).filter((b) => b?.kind === "user").map((b) => b?.text ?? ""),
      flowText: () => document.querySelector('[data-slot="flow"]')?.textContent ?? "",
      questionInfo: () => {
        const q = document.querySelector('[data-slot="flow"] [data-card="question"]')
        return q === null ? null : {
          promptId: q.getAttribute("data-prompt-id"),
          text: q.textContent ?? "",
          options: [...q.querySelectorAll(".question-option")].map((n) => n.textContent),
        }
      },
      questionGone: (id) => document.querySelector(`[data-card="question"][data-prompt-id="${id}"]`) === null,
    }
    return true
  })
  const KEY = await page.evaluate(() => window.__c3.key())
  out.readings.key = KEY
  record("fSessionActive", typeof KEY === "string" && KEY !== "", KEY)

  // 页内/宿主读面助手（节点侧）
  const readQuestion = () => page.evaluate(() => window.__c3.questionInfo())
  const readInput = () => page.evaluate(() => window.__c3.input()?.value ?? null)
  const readPending = () => page.evaluate(() => window.__c3.pendingLen())
  const readRunning = () => page.evaluate(() => window.__c3.running())
  const readToast = () => page.evaluate(() => {
    const el = window.__c3.toast()
    return el === null ? null : { visible: el.classList.contains("visible"), text: el.textContent ?? "" }
  })
  const queueRead = () => page.evaluate(async (k) => {
    const receipt = await window.thincoder.invoke("history:page", { key: k })
    return Array.isArray(receipt?.queue) ? receipt.queue : null
  }, KEY)
  /** 有界谓词等待（真 ⇒ true；超时 ⇒ false —— 兜底后照断言，判别力不损）。 */
  const waitPredicate = async (fn, arg, timeout = 40000) => {
    try { await page.waitForFunction(fn, arg, { timeout }); return true } catch { return false }
  }
  /** toast 轮询（可见即返 —— 词面在 2.6s 后自动退场）。 */
  const pollToast = async (ms, step = 80) => {
    const t0 = Date.now()
    while (Date.now() - t0 < ms) {
      const read = await readToast()
      if (read !== null && read.visible === true) return read
      await sleep(step)
    }
    return await readToast()
  }
  const fillAndEnter = async (text) => {
    await page.locator("#input").fill(text)
    await page.locator("#input").press("Enter")
  }
  /** Ctrl+I 携文（真键位）：键入 ⇒ Ctrl+I 入中断模态 ⇒ Enter 提交 ⇒ 返回模态判读。 */
  const ctrlIInject = async (text) => {
    await page.locator("#input").fill(text)
    await page.locator("#input").press("Control+i")
    const modeEntered = await page.evaluate(() => window.__c3.interruptMode())
    await page.locator("#input").press("Enter")
    return modeEntered
  }

  // ── 腿 B 前置：首消息 ⇒ 撞帽询问 #1（cap 待答态显形）────────────────────────────────────────
  await fillAndEnter("腿B 首消息")
  const q1Appeared = await waitPredicate(() => window.__c3.questionInfo() !== null, null)
  const q1 = await readQuestion()
  const q1IsCap = q1 !== null && q1.text.includes("Continue from here?") && q1.options.includes("Continue") && q1.options.includes("Stop")
  out.phases.cap1 = { appeared: q1Appeared, question: q1, queue: await queueRead(), running: await readRunning() }
  record("bCapQuestion1", q1IsCap === true, out.phases.cap1)
  record("fQueueEmptyAtStart", Array.isArray(out.phases.cap1.queue) && out.phases.cap1.queue.length === 0, out.phases.cap1.queue)

  // ── 腿 B：队空 ∧ Ctrl+I 携文 ⇒ 受理径（携文入队 ⇒ 下一回合消费）────────────────────────────
  const modeB = q1IsCap ? await ctrlIInject("B 携文") : null
  const toastB = await pollToast(1200)
  const q2Appeared = q1IsCap && await waitPredicate((id) => {
    const q = window.__c3.questionInfo()
    return q !== null && q.promptId !== id
  }, q1?.promptId ?? "", 40000)
  const postB = {
    question: await readQuestion(), input: await readInput(), queue: await queueRead(),
    userTexts: await page.evaluate(() => window.__c3.userTexts()),
    flowText: await page.evaluate(() => window.__c3.flowText()),
    q1Gone: q1?.promptId === undefined ? null : await page.evaluate((id) => window.__c3.questionGone(id), q1.promptId),
    rejectLogs: consoleMsgs.filter((m) => m.text.includes("msg:interrupt failed")).map((m) => m.text),
    toastLate: await readToast(),
  }
  out.phases.legB = { modeEntered: modeB, toast: toastB, q2Appeared, post: postB }
  record("bInterruptModeEntered", modeB === true, modeB)
  record("bNoToastAccepted", (toastB === null || toastB.visible !== true) && (postB.toastLate === null || postB.toastLate.visible !== true), { window: toastB, late: postB.toastLate })
  record("bNoRejectLog", postB.rejectLogs.length === 0, postB.rejectLogs)
  record("bQuestionSettled", q2Appeared === true && postB.q1Gone === true, { q1Gone: postB.q1Gone, promptId: postB.question?.promptId ?? null })
  record("bNextCapQuestion2", postB.question !== null && postB.question.promptId !== q1?.promptId && postB.question.text.includes("Continue from here?"), postB.question?.promptId ?? null)
  record("bDeliveredUserBlock", postB.userTexts.filter((t) => t === "B 携文").length === 1 && postB.flowText.includes("B 携文"), {
    matches: postB.userTexts.filter((t) => t === "B 携文").length, flowHas: postB.flowText.includes("B 携文"),
  })
  record("bQueueConsumed", Array.isArray(postB.queue) && postB.queue.length === 0, postB.queue)
  record("bInputNoReinject", postB.input === "", postB.input)

  // ── 腿 A 前置：队列填满 8（真提交 —— busy 径；逐条等宿主镜面收敛）──────────────────────────
  const fillTexts = Array.from({ length: 8 }, (_, i) => `腿A 排队 ${i + 1}`)
  const fillWaits = []
  for (let i = 0; i < fillTexts.length; i += 1) {
    await fillAndEnter(fillTexts[i])
    fillWaits.push(await waitPredicate((n) => window.__c3.pendingLen() >= n, i + 1, 15000))
  }
  const preA = {
    queue: await queueRead(), pending: await readPending(), question: await readQuestion(),
    toast: await readToast(), running: await readRunning(), calls: chatCalls, fillWaits,
  }
  out.phases.legAPre = preA
  record("aQueueFilled8", preA.queue !== null && preA.queue.length === 8 && preA.queue.join("|") === fillTexts.join("|") && preA.pending === 8, { queue: preA.queue, pending: preA.pending, fillWaits })
  record("aPreNoToast", preA.toast === null || preA.toast.visible !== true, preA.toast)
  record("aPreQuestionPending", preA.question !== null && preA.question.promptId === postB.question?.promptId, preA.question?.promptId ?? null)

  // ── 腿 A：队满 ∧ Ctrl+I 携文 ⇒ 拒收径（queue-full —— 零中止 ∥ 零入队 ∥ 可见形）────────────
  const modeA = await ctrlIInject("A 携文")
  const toastA = await pollToast(3000)
  await sleep(1200) // 静默窗：若误中止/误入队 ⇒ 交付回合将起跑（新模型调用 ∥ 队耗 ∥ 卡退场）
  const word = await page.evaluate(async () => {
    const mod = await import(new URL("./i18n.mjs", document.baseURI).href)
    return mod.t("input.slotFull")
  })
  const postA = {
    input: await readInput(), question: await readQuestion(), queue: await queueRead(), pending: await readPending(),
    running: await readRunning(), calls: chatCalls, toastLate: await readToast(), word,
    rejectLogs: consoleMsgs.filter((m) => m.text.includes("msg:interrupt failed")).map((m) => m.text),
  }
  out.phases.legA = { modeEntered: modeA, toast: toastA, post: postA }
  record("aInterruptModeEntered", modeA === true, modeA)
  record("aToast", toastA !== null && toastA.visible === true && toastA.text === word, { toast: toastA, word })
  record("aRejectLog", postA.rejectLogs.some((t) => t.includes("msg:interrupt failed: queue-full")), postA.rejectLogs)
  record("aInputReinjected", postA.input === "A 携文", postA.input)
  record("aQuestionKept", postA.question !== null && postA.question.promptId === preA.question?.promptId
    && postA.question.text.includes("Continue from here?") && postA.question.options.length >= 2, postA.question)
  record("aQueueUnchanged", postA.queue !== null && postA.queue.length === 8
    && postA.queue.join("|") === fillTexts.join("|") && postA.queue.includes("A 携文") === false, { queue: postA.queue, pending: postA.pending })
  record("aPendingUnchanged", postA.pending === 8, postA.pending)
  record("aStillRunning", postA.running === true, postA.running)
  record("aNoNewModelCall", postA.calls === preA.calls, { pre: preA.calls, post: postA.calls })

  out.readings.stubChatCalls = chatCalls
  out.readings.pageErrors = pageErrors
  out.readings.consoleTail = consoleMsgs.slice(-12)
} catch (error) {
  out.notes.push(`probe error: ${String(error?.message ?? error)}`)
} finally {
  try { if (app !== null) await app.close() } catch { /* 已死 */ }
  server.close()
  for (const dir of [home, project]) { try { rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }) } catch { /* 清理失败不翻判 */ } }
}

out.ts = new Date().toISOString() // 版本绑（读数 ↔ 探针修订）
out.probeHash = createHash("sha1").update(readFileSync(fileURLToPath(import.meta.url))).digest("hex")
out.failed = Object.entries(checks).filter(([, ok]) => ok !== true).map(([name]) => name)
out.verdict = Object.keys(checks).length === EXPECTED_CHECKS && out.failed.length === 0
console.log(JSON.stringify({ boot: out.boot, verdict: out.verdict, failed: out.failed, checks: out.checks }, null, 1))
console.log(out.verdict ? `C3 PROBE PASS（${out.failed.length === 0 ? Object.keys(checks).length : 0} 判全过）` : `C3 PROBE FAIL（${out.failed.join(" · ")}）`)
writeFileSync(READINGS, JSON.stringify(out, null, 2))
console.log(`读数档 = ${READINGS}`)
process.exit(out.verdict ? 0 : 1)
