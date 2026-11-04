/**
 * advisor-guard-reminder-cap.test.mjs — 集成用例档：`test/RTM.md` 故事 32「advisor guard 的提醒到顶就停，
 * 未评审要说出来」四行（32-1 层 1 先耗尽 · 32-2 推满 5 条 · 32-3 子代理合并算进展 · 32-4 诚实提醒位随新进展
 * 复位）。
 * 机制权威 = `docs/core/design/ADVISOR-CONVERGENCE.md` §6.4（A ∥ B 两层口径 · 到顶行为）。
 *
 * 所评的组件间交互 = 回合环工具批执行处的预算复位（`thincoder-core/agent/turn-loop.mjs` 的写序比）⟷ 完成守卫
 * 推回判定（`thincoder-core/agent/completion.mjs`）⟷ 子代理合并推进写序（`thincoder-core/agent-tools/
 * subagent-async.mjs` 的 `mergeChildMutations`）⟷ guard 状态携带（`thincoder-core/agent/helpers.mjs` 的
 * `INHERITED_GUARD_KEYS`）。
 *
 * 业务可观察结果：会话正常收尾；同一未评审周期内提醒有上限，任一层停推即推恰好一条诚实提醒要求「在回答里明说
 * 这段代码未经评审」；只读批次不使条数回满；子代理合入算进展（预算不复位形态下会冻死在 3 条）；诚实提醒发过之后
 * 又真的改了代码 ⇒ 该次停推再得一条（位随写序推进复位，不留「改完代码静默放行」的途径）。
 *
 * 驱动 = 真会话链路（`createAgent` + `runAgent`，一次 `runAgent` = CLI 里发一条消息），模型侧 = 本机假
 * OpenAI SSE 端点（先例 `test/integration/empty-response-retry.test.mjs`）——零外网、零付费端点。
 *
 * 诚实分界（两条）：
 *  ① 机制侧（提醒条数 ∥ 文案）机判；助手最终回答是否真写了「未经评审」= 人读，不作机判断言。
 *  ② 32-3 的「委托」由夹具工具 `delegate_merge` 落到**真** `mergeChildMutations`；真合并调用点里，`subagent`
 *     生成面那几处带 `role === "eng-coder"` 门（eng-coder 生成要设计 token），在集成夹具里走不通；escalate 面的
 *     合并点无角色门、本轮未驱动。本条评的机制（合并推进父侧写序 ⇒ 层 1 预算复位）是真的，调用点用夹具示意。
 */
import { after, test } from "node:test"
import assert from "node:assert/strict"
import { createServer } from "node:http"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { createAgent, runAgent } from "../../thincoder-core/agent.mjs"
import { mergeChildMutations } from "../../thincoder-core/agent-tools/subagent-async.mjs"
import { _resetLogsDirForTest, _setLogsDirForTest } from "../../thincoder-core/log.mjs"

// ---------- 夹具 ----------

const cwd = mkdtempSync(join(tmpdir(), "advisor-cap-int-"))
const logsDir = mkdtempSync(join(tmpdir(), "advisor-cap-int-logs-"))
_setLogsDirForTest(logsDir)
after(() => {
  _resetLogsDirForTest()
  rmSync(cwd, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 })
  rmSync(logsDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 })
})

/** 写工具（真正落盘；`.js` 路径按内容级判定算产品代码 ⇒ 触发 guard）。 */
const WRITE_TOOL = {
  name: "write",
  description: "write a file (integration fixture)",
  parameters: {
    type: "object",
    properties: { path: { type: "string" }, content: { type: "string" } },
    required: ["path"],
  },
  execute: async ({ path, content }) => {
    writeFileSync(join(cwd, String(path)), String(content ?? ""))
    return `Wrote ${path}`
  },
}

/** 读工具（只读；脚本里的只读批次就是它）。 */
const READ_TOOL = {
  name: "read",
  description: "read a file (integration fixture)",
  parameters: { type: "object", properties: { path: { type: "string" } }, required: ["path"] },
  readonly: true,
  execute: async ({ path }) => `contents of ${path}`,
}

/**
 * 委托夹具（32-3）：把「改代码」交给子代理并把改动合进父侧修改追踪——落点 = 真 `mergeChildMutations`
 * （由此推进父侧写序，`turn-loop` 的批次复位判据才看得到进展；本工具本身不是 `FILE_MUTATORS`）。
 */
const DELEGATE_TOOL = {
  name: "delegate_merge",
  description: "delegate a code change to a child and merge its mutations into the parent (integration fixture)",
  parameters: { type: "object", properties: {} },
  execute: async (_args, ctx) => {
    const merged = mergeChildMutations(ctx.agent, { _mutatedThisRun: true, _touchedFiles: [join(cwd, "probe-app.js")] })
    return merged ? "child merged: probe-app.js" : "nothing to merge"
  },
}

const REMINDER_ANCHOR = "MUST get an advisor review before finishing"
const HONESTY_ANCHOR = "advisor reminders sent. You have not had this code reviewed."

/**
 * 脚本项：`{ toolCalls: [{ name, args }] }` = 带工具调用的轮；`{ content }` = 零工具调用的收尾轮。
 */
const WRITE = () => ({ toolCalls: [{ name: "write", args: { path: "probe-app.js", content: "export const x = 1\n" } }] })
const READ = () => ({ toolCalls: [{ name: "read", args: { path: "probe-app.js" } }] })
const READS = (n) => ({ toolCalls: Array.from({ length: n }, () => ({ name: "read", args: { path: "probe-app.js" } })) })
const DELEGATE = () => ({ toolCalls: [{ name: "delegate_merge", args: {} }] })
const SAY = (content) => ({ content })

const sseChunks = (reply, turn) => {
  if (reply.toolCalls) {
    const tool_calls = reply.toolCalls.map((tc, i) => ({
      index: i,
      id: `call_${turn}_${i}`,
      type: "function",
      function: { name: tc.name, arguments: JSON.stringify(tc.args ?? {}) },
    }))
    return [
      { choices: [{ delta: { content: "" }, finish_reason: null }] },
      { choices: [{ delta: { tool_calls }, finish_reason: null }] },
      { choices: [{ delta: {}, finish_reason: "tool_calls" }] },
    ]
  }
  return [
    { choices: [{ delta: { content: reply.content ?? "" }, finish_reason: null }] },
    { choices: [{ delta: {}, finish_reason: "stop" }] },
  ]
}

const providerStub = (script) => {
  const requests = []
  const server = createServer((req, res) => {
    let raw = ""
    req.on("data", (chunk) => { raw += chunk })
    req.on("end", () => {
      const turn = requests.length
      requests.push(raw)
      const reply = script[Math.min(turn, script.length - 1)]
      res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache", connection: "keep-alive" })
      for (const chunk of sseChunks(reply, turn)) res.write(`data: ${JSON.stringify(chunk)}\n\n`)
      res.write("data: [DONE]\n\n")
      res.end()
    })
  })
  return new Promise((done) => {
    server.listen(0, "127.0.0.1", () => done({
      port: server.address().port,
      requests,
      close: () => new Promise((finish) => { server.closeAllConnections?.(); server.close(() => finish()) }),
    }))
  })
}

/** 一次 CLI 会话夹具：真 `createAgent`（`advisor.guard` 开、autoApprove ⇒ 无审批面）+ 本机假端点。 */
async function session(t, script) {
  const agent = createAgent({
    provider: null,
    tools: [WRITE_TOOL, READ_TOOL, DELEGATE_TOOL],
    config: { agent: { maxTurns: 40 }, advisor: { guard: true }, traces: { enabled: false } },
    cwd,
    autoApprove: true,
    history: [],
  })
  const stub = await providerStub(script)
  t.after(() => stub.close())
  agent.provider = { model: "deepseek-flash", baseURL: `http://127.0.0.1:${stub.port}`, apiKey: "sk-test" }
  return { agent, stub }
}

// 会话历史里的三类载荷
const pushes = (agent) => agent.history
  .filter((m) => typeof m.content === "string" && m.content.includes(REMINDER_ANCHOR))
  .map((m) => m.content)
const honesties = (agent) => agent.history
  .filter((m) => typeof m.content === "string" && m.content.includes(HONESTY_ANCHOR))
  .map((m) => m.content)
const reads = (agent) => agent.history.filter((m) => m.role === "tool" && m.name === "read").length

/** 末条句只在第 5 条出现：前 4 条不带 `This is reminder` 字面（五条共用开头 `[System reminder: `）。
 *  出现则恰一次、恰落第 5 条；未出现时本 helper 不断言（该形态下的“无末条句”由调用方断）。 */
function assertLastLineOnlyOnFifth(pushed) {
  for (let i = 0; i < Math.min(4, pushed.length); i++) {
    assert.ok(!pushed[i].includes("This is reminder"), `第 ${i + 1} 条不得带末条句`)
  }
  const marked = pushed.filter((p) => p.includes("This is reminder"))
  if (marked.length === 0) return
  assert.equal(marked.length, 1, `末条句恰出现一次（实读 ${marked.length}）`)
  assert.equal(pushed.indexOf(marked[0]), 4, "末条句只许落在第 5 条")
  assert.ok(marked[0].includes("This is reminder 5 of 5 — the last one"), "末条句逐字")
}

/** 到顶诚实提醒的三个子句（逐字单源——设计档 §6.4「断言引同一份逐字」）。 */
const HONESTY_CLAUSES = [
  HONESTY_ANCHOR,
  "state explicitly in your reply that this code has not been reviewed",
  "The user needs to know it is unreviewed",
]

function assertHonestyText(text, which) {
  for (const clause of HONESTY_CLAUSES) assert.ok(text.includes(clause), `${which} 含子句「${clause}」`)
}

// ---------- 故事 32 · 行 32-1（层 1 先耗尽）----------

test("32-1 改代码后一路只读、始终不调 advisor：层 1 耗尽即停推（3 条），其后恰好一条诚实提醒，会话正常收尾", { timeout: 120_000 }, async (t) => {
  const s = await session(t, [
    WRITE(),          // 1  改一处代码
    SAY("收尾 A"),     // 2  推回 1
    READS(1),         // 3  只读一批（不回满预算）
    SAY("收尾 B"),     // 4  推回 2
    READS(2),         // 5  只读一批
    SAY("收尾 C"),     // 6  推回 3（进展窗口 3 条用满）
    READS(4),         // 7  再只读——层 1 仍停在 3（不复位）
    SAY("收尾 D"),     // 8  层 1 停推 ⇒ 诚实提醒（层 2 才 3/5，不到顶）
    READS(3),         // 9  只读（累计 10 次）
    SAY("答复 E"),     // 10 放行
  ])

  const answer = await runAgent(s.agent, "改一下 probe-app.js", {})

  // ① 会话正常收尾
  assert.equal(answer, "答复 E", "到顶后放行收尾，用户照常拿到答复")

  // ② 层 1 耗尽即停推：恰好 3 条（只读批次不改这个数）
  const pushed = pushes(s.agent)
  assert.equal(pushed.length, 3, `层 1 先耗尽 ⇒ 提醒恰好 3 条（实读 ${pushed.length}）`)
  assertLastLineOnlyOnFifth(pushed)
  assert.ok(
    pushed.every((p) => !p.includes("This is reminder")),
    "3 条都不到层 2 上限（5），故无末条句",
  )

  // ③ 其后恰好 1 条诚实提醒，条数写实 3
  const honest = honesties(s.agent)
  assert.equal(honest.length, 1, `任一层停推后恰好一条诚实提醒（实读 ${honest.length}）`)
  assert.ok(honest[0].includes("3 advisor reminders sent. You have not had this code reviewed."), "条数写实 = 3（不是 5）")
  assert.ok(honest[0].includes("state explicitly in your reply that this code has not been reviewed"))
  assert.ok(honest[0].includes("The user needs to know it is unreviewed"))

  // ④ 只读批次不换来新提醒：读完 10 次，条数仍是 3 条 + 1 条诚实提醒（不是 13 条）
  assert.equal(reads(s.agent), 10, `本会话确实读了 10 次（实读 ${reads(s.agent)}）`)
  assert.equal(pushes(s.agent).length, 3, "读完仍 3 条——只读批次没有换来新提醒")

  // ⑤ 周期状态收在 agent 上（续跑 / 自动回合携带面）
  assert.equal(s.agent._advisorReminders, 3)
  assert.equal(s.agent._advisorHonestySent, true)
})

// ---------- 故事 32 · 行 32-2（推满 5 条）----------

test("32-2 中途反复成功写代码（多个进展窗口）：提醒推满 5 条、第 5 条带末条句，其后恰好一条诚实提醒", { timeout: 120_000 }, async (t) => {
  const s = await session(t, [
    WRITE(),          // 1  改代码 ⇒ 进展窗口开
    SAY("收尾 A"),     // 2  推回 1
    WRITE(),          // 3  再改一次 ⇒ 进展窗口回满（周期计数不回满）
    SAY("收尾 B"),     // 4  推回 2
    WRITE(),          // 5
    SAY("收尾 C"),     // 6  推回 3
    WRITE(),          // 7
    SAY("收尾 D"),     // 8  推回 4
    WRITE(),          // 9
    SAY("收尾 E"),     // 10 推回 5（末条句；周期上限到顶）
    SAY("收尾 F"),     // 11 诚实提醒
    READ(),           // 12 再只读
    SAY("答复 G"),     // 13 放行
  ])

  const answer = await runAgent(s.agent, "改一下 probe-app.js 几遍", {})

  assert.equal(answer, "答复 G", "会话正常收尾")

  const pushed = pushes(s.agent)
  assert.equal(pushed.length, 5, `同一未评审周期内推回提醒恰 5 条（实读 ${pushed.length}）`)
  assertLastLineOnlyOnFifth(pushed)
  assert.ok(
    pushed[4].includes("This is reminder 5 of 5 — the last one"),
    "第 5 条带末条句",
  )
  assert.ok(
    pushed[4].includes("state explicitly in your reply to the user that this code has not been reviewed"),
    "末条句要求回答里明说未经评审",
  )

  const honest = honesties(s.agent)
  assert.equal(honest.length, 1, `到顶后恰好一条诚实提醒（实读 ${honest.length}）`)
  assert.ok(honest[0].includes("5 advisor reminders sent. You have not had this code reviewed."), "条数写实 = 5")
  assert.ok(honest[0].includes("state explicitly in your reply that this code has not been reviewed"))

  assert.equal(s.agent._advisorReminders, 5)
  assert.equal(s.agent._advisorHonestySent, true)
})

// ---------- 故事 32 · 行 32-3（子代理合并算进展）----------

test("32-3 父侧把改代码委托给子代理（合入父侧修改追踪）、自己不再直接写文件：合入算进展 ⇒ 越过 3 条继续推到 5 条", { timeout: 120_000 }, async (t) => {
  const s = await session(t, [
    DELEGATE(),       // 1  子代理合入一处改动（父侧零直接写）⇒ 写序推进、预算回满
    SAY("收尾 A"),     // 2  推回 1
    SAY("收尾 B"),     // 3  推回 2
    SAY("收尾 C"),     // 4  推回 3（进展窗口用满）
    DELEGATE(),       // 5  再合入一次 ⇒ 合入算进展 ⇒ 预算复位（冻结形态下这里回不满）
    SAY("收尾 D"),     // 6  推回 4 —— 越过 3 条即证明合入算进展
    DELEGATE(),       // 7
    SAY("收尾 E"),     // 8  推回 5（末条句）
    SAY("收尾 F"),     // 9  诚实提醒
    SAY("答复 G"),     // 10 放行
  ])

  const answer = await runAgent(s.agent, "把改动交给子代理做", {})

  assert.equal(answer, "答复 G", "会话正常收尾")

  const pushed = pushes(s.agent)
  assert.equal(pushed.length, 5, `合入算进展 ⇒ 提醒越过 3 条、推到上限 5 条（实读 ${pushed.length}）`)
  assertLastLineOnlyOnFifth(pushed)
  assert.ok(pushed[4].includes("This is reminder 5 of 5 — the last one"))

  const honest = honesties(s.agent)
  assert.equal(honest.length, 1, "其后恰好一条诚实提醒")
  assert.ok(honest[0].includes("5 advisor reminders sent. You have not had this code reviewed."))
  assert.ok(honest[0].includes("You have not had this code reviewed"))

  // 父侧没直接写过文件：本条改动全经合并进来（`_touchedFiles` 由 `mergeChildMutations` 落）
  assert.equal(s.agent._advisorReminders, 5)
  assert.equal(s.agent._advisorHonestySent, true)
  assert.ok(s.agent._touchedFiles.some((p) => p.endsWith("probe-app.js")), "合并把子代理的触达面记到父侧")
})

// ---------- 故事 32 · 行 32-4（诚实提醒位随新进展复位）----------

test("32-4 接 32-1 形态：层 1 耗尽并已发一条诚实提醒之后又成功写一次代码 ⇒ 位随写序推进复位，推回续推到 5 条，再得一条诚实提醒（其间无一次静默收尾）", { timeout: 120_000 }, async (t) => {
  // 收尾轮 = 零工具调用且文案以「收尾 」开头的脚本项；下面按脚本派生“应该发生几次”，不写死常数。
  const FINISH_PREFIX = "收尾 "
  const script = [
    WRITE(),          // 1  改一处代码（写序推进 ⇒ 层 1 预算回满）
    SAY("收尾 A"),     // 2  推回 1
    READS(1),         // 3  只读（不回满预算）
    SAY("收尾 B"),     // 4  推回 2
    READS(2),         // 5  只读
    SAY("收尾 C"),     // 6  推回 3（层 1 用满）
    READS(4),         // 7  再只读——预算仍停在 3
    SAY("收尾 D"),     // 8  层 1 停推 ⇒ 诚实提醒 ①（条数 3）
    WRITE(),          // 9  又成功写一次 ⇒ 写序推进 ⇒ 复位层 1 预算与诚实提醒位（层 2 计数不动）
    SAY("收尾 E"),     // 10 推回 4
    SAY("收尾 F"),     // 11 推回 5（末条句 ⇒ 层 2 到顶）
    SAY("收尾 G"),     // 12 停推 ⇒ 诚实提醒 ②（条数 5；位不随进展复位时这里静默 done）
    READ(),          // 13 位已置后再只读一批——清不掉位（只读批不改写序）
    SAY("答复 H"),     // 14 放行
  ]
  const s = await session(t, script)

  const answer = await runAgent(s.agent, "改一下 probe-app.js，再改一次", {})

  // ① 会话正常收尾；两次成功写文件都真的发生过（复位由真工具批的写序推进驱动，不是手工置字段）
  assert.equal(answer, "答复 H", "到顶后放行收尾，用户照常拿到答复")
  assert.equal(
    s.agent.history.filter((m) => m.role === "tool" && m.name === "write").length,
    2,
    "本会话确实成功写了两次文件",
  )

  // ② 层 1 复位后推回续推：5 条，第 5 条带末条句（层 1 停在 3 的死锁形态下只会有 3 条）
  const pushed = pushes(s.agent)
  assert.equal(pushed.length, 5, `写序推进复位层 1 ⇒ 推回续推到 5 条（实读 ${pushed.length}）`)
  assertLastLineOnlyOnFifth(pushed)
  assert.ok(pushed[4].includes("This is reminder 5 of 5 — the last one"), "第 5 条带末条句")

  // ③ 诚实提醒两条：位随新进展复位 ⇒ 第一次停推一条、改完代码再停推又一条，条数各自写实
  const honest = honesties(s.agent)
  assert.equal(honest.length, 2, `位随写序推进复位 ⇒ 诚实提醒共 2 条（实读 ${honest.length}）`)
  assert.ok(honest[0].includes("3 advisor reminders sent."), "第一条写实 3（层 1 停推时的计数）")
  assert.ok(honest[1].includes("5 advisor reminders sent."), "第二条写实 5（层 2 到顶时的计数）")
  assertHonestyText(honest[0], "第一条诚实提醒")
  assertHonestyText(honest[1], "第二条诚实提醒")

  // ④ 两条诚实提醒之间无一次静默收尾：每个「收尾 X」回答的后一条历史项必须是提醒
  //    （推回或诚实提醒）。任一条被放行跑，它的后面就什么也没有——下一轮不会发生。
  //    “应该发生几次收尾”按脚本派生，脚本改了断言随动。
  const finishTurns = script.filter((r) => !r.toolCalls && r.content.startsWith(FINISH_PREFIX))
  const finishes = s.agent.history
    .map((m, i) => ({ m, i }))
    .filter(({ m }) => m.role === "assistant" && typeof m.content === "string" && m.content.startsWith(FINISH_PREFIX))
  assert.equal(finishes.length, finishTurns.length, `中途收尾 ${finishTurns.length} 次（实读 ${finishes.length}）`)
  for (const { m, i } of finishes) {
    const next = s.agent.history[i + 1]
    // 机制锚 = 提醒本体逐字（角色形状是内部注入细节，其次断）
    assert.ok(
      typeof next?.content === "string" && next.content.startsWith("[System reminder:"),
      `「${m.content}」后面必须紧跟一条提醒，不许静默通过`,
    )
    assert.equal(next.role, "user", `「${m.content}」之后的提醒以 user 消息入历史`)
  }
  const lastPushAt = s.agent.history.findLastIndex(
    (m) => typeof m.content === "string" && m.content.includes(REMINDER_ANCHOR),
  )
  const secondHonestyAt = s.agent.history.findLastIndex(
    (m) => typeof m.content === "string" && m.content.includes(HONESTY_ANCHOR),
  )
  assert.ok(secondHonestyAt > lastPushAt, "第二条诚实提醒排在最后一条推回之后")

  // ⑤ 周期状态：层 2 计数到顶、位已置且只读批清不掉（第 13 轮读过一次后仍为真）。
  //    “层 2 计数不随进展复位”的读数 = 下面末态 5 与第二条诚实提醒文案写实 5 两条合起来才成立：
  //    计数若在写序点被清零，推回会越过第 6 条（`pushed.length` 先红）。
  assert.equal(s.agent._advisorReminders, 5)
  assert.equal(s.agent._advisorHonestySent, true)
  assert.equal(reads(s.agent), 8, `本会话读了 8 次（实读 ${reads(s.agent)}）`)
})