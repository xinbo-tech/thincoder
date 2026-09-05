/**
 * subagent-scheduler.test.mjs — §20 task scheduler — files domain dedupe / dependsOn / queue positions / cancel semantics (T-SD1..14 + advisor round).
 *
 * Split from test/subagent.test.mjs (AGENT-LOOP.md §18.14/§18.14.1 D-T1.1 domain rule —
 * blocks moved verbatim; test names/semantics unchanged).
 */

import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, relative } from "node:path"
import { createServer } from "node:http"

async function runChild(parent, walls, onQuestion) {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const cwd = mkdtempSync(join(tmpdir(), "tc-sub-"))
  const ctx = { agent: parent, cwd, callbacks: { onQuestion } }
  const r = String(await subagentTool.execute({ task: "loop until the cap", role: "coder" }, ctx))
  rmSync(cwd, { recursive: true, force: true })
  return r
}

/** 按任务文本响应的 async 子代理 mock：fast 立即完成；slow/queued-* 延迟完成；其他 "child done"。 */
function asyncChildServer(delayMs = 0) {
  const calls = { n: 0 }
  const server = createServer((req, res) => {
    let body = ""
    req.on("data", (c) => (body += c))
    req.on("end", () => {
      calls.n++
      const isSlow = /slow|queued/.test(body)
      const send = () => {
        const content = isSlow ? `slow result ${calls.n}` : `fast result ${calls.n}`
        res.end(
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content } }] })}\n\n` +
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
          "data: [DONE]\n\n"
        )
      }
      if (isSlow && delayMs > 0) setTimeout(send, delayMs)
      else send()
    })
  })
  return { server, calls }
}

function asyncParent(port, extra = {}) {
  const base = {
    _provider: { name: "t", baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" },
    config: {
      providersList: [{ name: "t", baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" }],
      agent: { subagentTurns: 5, engineering: false },
    },
    _subIdCounter: 0,
    _touchedFiles: [],
    _asyncSubagents: new Map(),
    _asyncCheckN: 0,
  }
  return { ...base, ...extra }
}

function asyncCtx(parent, cwd, extra = {}) {
  return { agent: parent, cwd, callbacks: {}, ...extra }
}

/** Async spawn results are JSON STRINGS (tool-result contract — §18 code review #1);
 *  parse for shape assertions. */
const spawnJson = (raw) => JSON.parse(String(raw))

/** 等待条件为真（settle 补位等异步链——既有测试同款轮询）。 */
async function waitFor(fn, ms = 1500) {
  const t0 = Date.now()
  while (Date.now() - t0 < ms) {
    if (fn()) return true
    await new Promise((r) => setTimeout(r, 20))
  }
  return fn()
}

test("§20 T-SD1/T-SD8 (vscode): 无调度参数 → 立即启动（既有语义零回归）；文件域不相交 → 并行", async () => {
  const { server } = await asyncChildServer(400)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-sd1-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = asyncParent(port)
    const ctx = asyncCtx(parent, cwd)
    const a = spawnJson(await subagentTool.execute({ task: "slow task a", role: "coder", async: true, files: ["a/one.mjs"] }, ctx))
    assert.equal(a.status, "running", "T-SD1: 无冲突声明 files 首任务立即启动")
    const b = spawnJson(await subagentTool.execute({ task: "slow task b", role: "coder", async: true, files: ["b/two.mjs"] }, ctx))
    assert.equal(b.status, "running", "T-SD8: 文件域不相交 → 并行（不误排）")
    const c = spawnJson(await subagentTool.execute({ task: "plain c", role: "coder", async: true }, ctx))
    assert.equal(c.status, "running", "无调度参数 spawn → 立即启动（legacy——零改动）")
    assert.equal([...parent._asyncSubagents.values()].filter((e) => e.status === "running").length, 3)
    await Promise.allSettled([...parent._asyncSubagents.values()].map((e) => e.settled))
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("§20 T-SD2/T-SD7 (vscode): 同文件域冲突 → queued（waiting-deps——不入 running——status 显示原因——路径归一化）→ 域持有者 settle 自动补位", async () => {
  const { server } = await asyncChildServer(500)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-sd2-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = asyncParent(port)
    const ctx = asyncCtx(parent, cwd)
    const holder = spawnJson(await subagentTool.execute({ task: "slow holder", role: "coder", async: true, files: ["src/x.mjs"] }, ctx))
    assert.equal(holder.status, "running")
    const entryA = parent._asyncSubagents.get(holder.id)
    assert.ok(entryA._files.length === 1 && entryA._files[0].endsWith("x.mjs"), "D-SD2: _files 归一化（绝对路径）")
    // 相对 + 绝对同文件 → 归一化后判定冲突（round1 #5）
    const b = spawnJson(await subagentTool.execute({ task: "slow conflict", role: "coder", async: true, files: [join(cwd, "src", "x.mjs")] }, ctx))
    assert.equal(b.status, "queued", "T-SD2: 同文件域冲突 → waiting-deps")
    assert.equal(b.waiting, "waiting-deps")
    assert.ok(b.reason.includes(`coder#${holder.id}`) && b.reason.includes("x.mjs"), `reason 含冲突对象与文件（实际: ${b.reason}）`)
    assert.ok(!parent._asyncSubagents.get(b.id).startedAt, "未启动（无 startedAt）")
    // T-SD7: status 显示原因（模型可见——F-SD4）
    const st = JSON.parse(await subagentTool.execute({ action: "status", id: b.id }, ctx))
    assert.equal(st.status, "queued")
    assert.equal(st.waiting, "waiting-deps")
    assert.ok(st.reason.includes(`coder#${holder.id}`), "status reason 含冲突对象")
    const ov = JSON.parse(await subagentTool.execute({ action: "status" }, ctx))
    const row = ov.overview.queued.find((e) => e.id === b.id)
    assert.equal(row.waiting, "waiting-deps", "概览 queued 行带 waiting 标注")
    // 域持有者 settle → 冲突解除自动补位（T-SD3 同路径）
    const started = await waitFor(() => parent._asyncSubagents.get(b.id)?.status === "running", 5000)
    assert.ok(started, "域冲突解除自动启动")
    await Promise.allSettled([...parent._asyncSubagents.values()].map((e) => e.settled))
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("§20 T-SD3 (vscode): dependsOn 未满足 → queued（依赖原因）→ 依赖 settle 自动补位", async () => {
  const { server } = await asyncChildServer(500)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-sd3-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = asyncParent(port)
    const ctx = asyncCtx(parent, cwd)
    const dep = spawnJson(await subagentTool.execute({ task: "slow dep", role: "coder", async: true }, ctx))
    assert.equal(dep.status, "running")
    const kid = spawnJson(await subagentTool.execute({ task: "slow dependent", role: "coder", async: true, dependsOn: [dep.id] }, ctx))
    assert.equal(kid.status, "queued")
    assert.equal(kid.waiting, "waiting-deps")
    assert.ok(kid.reason.includes(`coder#${dep.id}`) && kid.reason.includes("依赖未完成"), `reason 含依赖对象与原因（实际: ${kid.reason}）`)
    assert.equal(parent._asyncSubagents.get(kid.id).status, "queued", "不入 running")
    const started = await waitFor(() => parent._asyncSubagents.get(kid.id)?.status === "running", 5000)
    assert.ok(started, "依赖 settle → 自动补位启动")
    await Promise.allSettled([...parent._asyncSubagents.values()].map((e) => e.settled))
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("§20 T-SD4b (vscode): 混合队列——waiting 在前 slot-queued 在后——腾槽 earliest-runnable 越行启动", async () => {
  const { server } = await asyncChildServer(600)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-sd4b-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = asyncParent(port)
    const ctx = asyncCtx(parent, cwd)
    const fillers = []
    for (let n = 1; n <= 4; n++) {
      const s = spawnJson(await subagentTool.execute({ task: `slow slot ${n}`, role: "coder", async: true }, ctx))
      fillers.push(s)
    }
    const z = spawnJson(await subagentTool.execute({ task: "slow z-wait", role: "coder", async: true, dependsOn: [fillers[1].id] }, ctx))
    assert.equal(z.waiting, "waiting-deps", "Z 依赖未满足——waiting")
    const w = spawnJson(await subagentTool.execute({ task: "slow w-slot", role: "coder", async: true }, ctx))
    assert.equal(w.status, "queued")
    assert.equal(w.position, 2, "W slot 等位（position 2——Z 在前）")
    // cancel 占槽 1 → 腾槽 → 扫描：Z 不可启动（依赖占槽2 未 settle）→ W 越行启动
    const c = JSON.parse(await subagentTool.execute({ action: "cancel", id: fillers[0].id }, ctx))
    assert.equal(c.status, "cancelled")
    await parent._asyncSubagents.get(fillers[0].id).settled
    const wStarted = await waitFor(() => parent._asyncSubagents.get(w.id)?.status === "running", 5000)
    assert.ok(wStarted, "T-SD4b: 槽释放 → earliest runnable（W）越行启动")
    assert.equal(parent._asyncSubagents.get(z.id)?.status, "queued", "Z（waiting 在前）仍排队")
    parent._asyncSubagents.clear()
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("§20 T-SD5/T-SD10 (vscode): 环拒绝（人工注入——防御断言）+ unknown id 明确错误", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const cwd = process.cwd()
  // T-SD10: unknown id
  const empty = asyncParent(0)
  await assert.rejects(
    subagentTool.execute({ task: "x", role: "coder", async: true, dependsOn: [42] }, asyncCtx(empty, cwd)),
    /unknown async subagent id: 42/,
    "T-SD10: unknown id 拒绝（错误明确）",
  )
  // T-SD5: 人工注入成环条目（1→2→1）——spawn 依赖 1 → 可达环拒绝
  const mk = (id, deps) => ({ id, role: "coder", status: "queued", _files: [], _dependsOn: deps, cancelled: false, done: false })
  const cyc = asyncParent(0, { _asyncSubagents: new Map([[1, mk(1, [2])], [2, mk(2, [1])]]) })
  await assert.rejects(
    subagentTool.execute({ task: "x", role: "coder", async: true, dependsOn: [1] }, asyncCtx(cyc, cwd)),
    /cycle detected: 1 → 2 → 1/,
    "T-SD5: 可达环拒绝（错误列路径）",
  )
})

test("§20 T-SD6 (vscode): cancel waiting-deps → 出队移除 + 后续 position 前移 + 行移除通知", async () => {
  const { server } = await asyncChildServer(600)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-sd6-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const notes = []
    const parent = asyncParent(port)
    const ctx = asyncCtx(parent, cwd, { callbacks: { onSubagent: (info) => notes.push(info) } })
    const fillers = []
    for (let n = 1; n <= 4; n++) {
      const s = spawnJson(await subagentTool.execute({ task: `slow slot ${n}`, role: "coder", async: true, ...(n === 1 ? { files: ["only.mjs"] } : {}) }, ctx))
      fillers.push(s)
    }
    const b = spawnJson(await subagentTool.execute({ task: "slow conflict", role: "coder", async: true, files: ["only.mjs"] }, ctx))
    assert.equal(b.waiting, "waiting-deps")
    const c = spawnJson(await subagentTool.execute({ task: "slow slot c", role: "coder", async: true }, ctx))
    assert.equal(c.position, 2, "C 在 B 之后")
    const cb = JSON.parse(await subagentTool.execute({ action: "cancel", id: b.id }, ctx))
    assert.equal(cb.status, "cancelled")
    assert.equal(cb.was, "queued")
    assert.equal(cb.dependents, undefined, "无依赖者 → 干净确认形态")
    assert.ok(!parent._asyncSubagents.has(b.id), "waiting-deps 条目出队移除")
    assert.equal(notes.some((n) => n.id === b.id && n.status === "cancelled" && n.was === "queued"), true, "cancelled 带 was:queued（webview 行移除通道）")
    const cNote = notes.filter((n) => n.id === c.id && n.status === "queued").pop()
    assert.equal(cNote.position, 1, "剩余排队行 position 前移刷新（2 → 1）")
    parent._asyncSubagents.clear()
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("§20 T-SD9/T-SD9b (vscode): cancel queued 依赖 → 依赖者留 queued 标 dependency cancelled（手动锁——腾槽不启动）——AUTO 档自动启动", async () => {
  const { server } = await asyncChildServer(800)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-sd9-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    // ── 手动档 ──
    const parent = asyncParent(port)
    const ctx = asyncCtx(parent, cwd, { getAuto: () => false })
    const fillers = []
    for (let n = 1; n <= 4; n++) {
      const s = spawnJson(await subagentTool.execute({ task: `slow slot ${n}`, role: "coder", async: true }, ctx))
      fillers.push(s)
    }
    const x = spawnJson(await subagentTool.execute({ task: "slow queued-x", role: "coder", async: true }, ctx))
    assert.equal(x.status, "queued")
    const y = spawnJson(await subagentTool.execute({ task: "slow dependent-y", role: "coder", async: true, dependsOn: [x.id] }, ctx))
    assert.equal(y.status, "queued")
    const cx = JSON.parse(await subagentTool.execute({ action: "cancel", id: x.id }, ctx))
    assert.equal(cx.status, "cancelled")
    assert.deepEqual(cx.dependents, [`coder#${y.id}`], "依赖者随 cancel 返回（工具结果内）")
    assert.ok(cx.note.includes("dependency cancelled"), "注记说明处置选项")
    const st = JSON.parse(await subagentTool.execute({ action: "status", id: y.id }, ctx))
    assert.equal(st.waiting, "dependency-cancelled", "T-SD9: 依赖者标 dependency cancelled（模型可见）")
    // 腾槽也不自动启动（手动锁）：cancel 占槽 1 → 槽空 → Y depc 锁 → 留 queued
    const c1 = JSON.parse(await subagentTool.execute({ action: "cancel", id: fillers[0].id }, ctx))
    assert.equal(c1.status, "cancelled")
    await parent._asyncSubagents.get(fillers[0].id).settled
    await new Promise((r) => setTimeout(r, 150))
    assert.equal(parent._asyncSubagents.get(y.id)?.status, "queued", "手动档：槽空也不自动启动（depc 锁——滞留有意——显式可清）")
    // 父显式处置（cancel 依赖者）→ 释放
    const cy = JSON.parse(await subagentTool.execute({ action: "cancel", id: y.id }, ctx))
    assert.equal(cy.status, "cancelled")
    assert.ok(!parent._asyncSubagents.has(y.id), "显式 cancel 释放 depc 滞留条目")
    parent._asyncSubagents.clear()
    // ── AUTO 档 ──
    const autoParent = asyncParent(port)
    autoParent.autoFlag = true
    const actx = asyncCtx(autoParent, cwd, { getAuto: () => autoParent.autoFlag })
    const af = []
    for (let n = 1; n <= 4; n++) {
      const s = spawnJson(await subagentTool.execute({ task: `slow slot ${n}`, role: "coder", async: true }, actx))
      af.push(s)
    }
    const ax = spawnJson(await subagentTool.execute({ task: "slow queued-ax", role: "coder", async: true }, actx))
    const ay = spawnJson(await subagentTool.execute({ task: "slow dependent-ay", role: "coder", async: true, dependsOn: [ax.id] }, actx))
    assert.equal(ay.status, "queued")
    const cax = JSON.parse(await subagentTool.execute({ action: "cancel", id: ax.id }, actx))
    assert.equal(cax.status, "cancelled")
    // AUTO：槽满仍排队（depc 视为可启动——等槽）……腾槽 → 自动启动
    const ca1 = JSON.parse(await subagentTool.execute({ action: "cancel", id: af[0].id }, actx))
    assert.equal(ca1.status, "cancelled")
    await autoParent._asyncSubagents.get(af[0].id).settled
    const ayStarted = await waitFor(() => autoParent._asyncSubagents.get(ay.id)?.status === "running", 5000)
    assert.ok(ayStarted, "T-SD9b: AUTO——依赖取消后腾槽即自动启动（round2 #3——仅 AUTO/父显式才启动）")
    autoParent._asyncSubagents.clear()
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("§20 T-SD13 (vscode): sync spawn 带调度参数命中冲突 → 明确错误（不队列化 sync）", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const cwd = mkdtempSync(join(tmpdir(), "tc-sd13-"))
  try {
    // 域冲突（池内 running 持域）→ sync spawn 明确错误（子代理不启动——错误早于 runChild）
    const holder = { id: 1, role: "coder", status: "running", _files: [join(cwd, "src", "shared.mjs")], _dependsOn: [], done: false, cancelled: false }
    const conflictParent = asyncParent(0, { _asyncSubagents: new Map([[1, holder]]) })
    await assert.rejects(
      subagentTool.execute({ task: "x", role: "coder", files: ["src/shared.mjs"] }, asyncCtx(conflictParent, cwd)),
      /sync spawn \(async:false\) cannot queue/,
      "T-SD13: sync 冲突 → 明确错误（错误文本含处置建议）",
    )
    // 依赖已取消（墓碑 cancelled）同拒
    const depParent = asyncParent(0, { history: { _asyncTombstones: new Map([[7, { status: "cancelled", role: "coder" }]]) } })
    await assert.rejects(
      subagentTool.execute({ task: "x", role: "coder", dependsOn: [7] }, asyncCtx(depParent, cwd)),
      /sync spawn \(async:false\) cannot queue/,
      "T-SD13b: sync dependsOn 已取消依赖 → 同拒（不队列化）",
    )
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("§20 T-SD14 (vscode): check 消费条目（终态墓碑）——dependsOn 引用视为已满足", async () => {
  const { server } = await asyncChildServer(200)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-sd14-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = asyncParent(port)
    const ctx = asyncCtx(parent, cwd)
    const first = spawnJson(await subagentTool.execute({ task: "slow first", role: "coder", async: true }, ctx))
    assert.equal(first.status, "running")
    const c1 = JSON.parse(await subagentTool.execute({ action: "check", n: 1, id: first.id }, ctx))
    assert.equal(c1.status, "done")
    assert.ok(!parent._asyncSubagents.has(first.id), "check 消费删除")
    const tombs = parent.history?._asyncTombstones ?? parent._asyncTombstones
    assert.ok(tombs instanceof Map && tombs.get(first.id)?.status === "consumed", "终态墓碑记录（consumed——T-SD14）")
    // dependsOn 引用 consumed id → 满足 → 立即启动
    const kid = spawnJson(await subagentTool.execute({ task: "slow kid", role: "coder", async: true, dependsOn: [first.id] }, ctx))
    assert.equal(kid.status, "running", "T-SD14: consumed 墓碑 id 视为已满足（不拒不排）")
    await Promise.allSettled([...parent._asyncSubagents.values()].map((e) => e.settled))
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("§20 T-SD9c (vscode): cancel running 依赖 → settle cancelled 分支（终态墓碑 + depc 标注）——提醒含依赖者注记（VS Code：cancel 调用点注入——结构差异见 ARCHITECTURE.md §20 引用段）", async () => {
  const { server } = await asyncChildServer(20000)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-sd9c-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const history = []
    const parent = asyncParent(port, { history })
    const ctx = asyncCtx(parent, cwd)
    const dep = spawnJson(await subagentTool.execute({ task: "slow running-dep", role: "coder", async: true }, ctx))
    assert.equal(dep.status, "running")
    const y = spawnJson(await subagentTool.execute({ task: "slow dependent", role: "coder", async: true, dependsOn: [dep.id] }, ctx))
    assert.equal(y.waiting, "waiting-deps")
    // cancel running 依赖 → cancel 点提醒注入（含依赖者注记——模型可见）→ abort → settle
    // cancelled 分支：墓碑 + 依赖者 depc 标注（round2 #3——非 AUTO 不自动启动）
    const c = JSON.parse(await subagentTool.execute({ action: "cancel", id: dep.id }, ctx))
    assert.equal(c.status, "cancelled")
    assert.ok(
      history.some((m) => String(m.content ?? "").includes("queued dependents") && String(m.content ?? "").includes(`coder#${y.id}`)),
      "cancel 提醒含依赖者注记（供模型决策）",
    )
    await waitFor(() => !parent._asyncSubagents.has(dep.id), 6000)
    assert.equal((parent.history?._asyncTombstones ?? parent._asyncTombstones).get(dep.id)?.status, "cancelled", "running 取消 settle → 终态墓碑（cancelled）")
    const st = JSON.parse(await subagentTool.execute({ action: "status", id: y.id }, ctx))
    assert.equal(st.status, "queued")
    assert.equal(st.waiting, "dependency-cancelled", "settle 终态释放：依赖者留 queued 标 dependency cancelled")
    assert.ok(st.reason.includes("dependency cancelled"), `reason 标注（实际: ${st.reason}）`)
    parent._asyncSubagents.clear()
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("§20 advisor 处置（code review 🟡——CLI 同款）: check 对 depc 锁定条目不无界阻塞 + 消费反向清除 pending（双送达守卫）", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const cwd = process.cwd()
  const mkLocked = (id) => ({
    id, role: "coder", status: "queued", position: 1,
    _files: [], _dependsOn: [99], report: null, error: null, done: false, cancelled: false,
    _auto: () => false,
  })
  // ① 指定 id：queued + depc 锁定（依赖取消墓碑）→ 立即返回 queued（不阻塞——模型回合不钉死）
  const locked = mkLocked(1)
  const agent = asyncParent(0, {
    _asyncSubagents: new Map([[1, locked]]),
    history: { _asyncTombstones: new Map([[99, { status: "cancelled", role: "eng-coder" }]]) },
  })
  const ctx = asyncCtx(agent, cwd)
  const r1 = JSON.parse(await subagentTool.execute({ action: "check", n: 1, id: 1 }, ctx))
  assert.equal(r1.status, "queued", "depc 锁定目标不阻塞——立即返回 queued")
  assert.equal(r1.waiting, "dependency-cancelled")
  assert.ok(r1.reason.includes("dependency cancelled"), `reason 标注锁定原因（实际: ${r1.reason}）`)
  assert.ok(r1.note.includes("cancel"), "note 引导处置（cancel/AUTO）")
  assert.ok(agent._asyncSubagents.has(1), "未消费（条目仍在池）")
  // ② arrival-order：无 running/done、全 depc 锁定 → 明确错误（无界等待守卫）
  const agent2 = asyncParent(0, {
    _asyncSubagents: new Map([[1, mkLocked(1)], [2, mkLocked(2)]]),
    history: { _asyncTombstones: new Map([[99, { status: "cancelled", role: "eng-coder" }]]) },
  })
  const r2 = JSON.parse(await subagentTool.execute({ action: "check", n: 1 }, asyncCtx(agent2, cwd)))
  assert.equal(r2.status, "error", "arrival-order 全锁定池 → 明确错误（不悬挂）")
  assert.ok(r2.error.includes("dependency-cancelled"), `错误列原因（实际: ${r2.error?.slice(0, 120)}）`)
  // ③ 残留守卫（round2 #8——advisor 复审发现——CLI #7 镜像）：wait-kind 条目被 queued-depc
  // 条目阻塞（文件域链）——池无 running → 同样立即返回（specific-id + arrival-order）
  const mkBlocked = (id, files, dep) => ({
    id, role: "coder", status: "queued", position: 1,
    _files: files, _dependsOn: dep ?? [], report: null, error: null, done: false, cancelled: false,
    _auto: () => false,
    settled: new Promise(() => {}), // 守卫放行场景的 mock 等待句柄（永不 resolve——由守卫/取消解）
  })
  const fx = [join(cwd, "src", "x.mjs")] // 归一化同文件域——B(#4) 与 C(#5) 冲突
  const bStuck = mkBlocked(4, fx, [99]) // depc（依赖 99 已取消）+ 持域
  const cStuck = mkBlocked(5, fx) // wait-on-B
  const agent4 = asyncParent(0, {
    _asyncSubagents: new Map([[4, bStuck], [5, cStuck]]),
    history: { _asyncTombstones: new Map([[99, { status: "cancelled", role: "eng-coder" }]]) },
  })
  const r4 = JSON.parse(await subagentTool.execute({ action: "check", n: 1, id: 5 }, asyncCtx(agent4, cwd)))
  assert.equal(r4.status, "queued", "wait-kind 目标 + 无 running 池 → 立即返回（#8 残留闭合）")
  assert.equal(r4.position, 2, "返回带实时位置")
  const r5 = JSON.parse(await subagentTool.execute({ action: "check", n: 2 }, asyncCtx(agent4, cwd)))
  assert.equal(r5.status, "error", "arrival-order：全 queued 无 running → 明确错误（混合锁池）")
  assert.ok(r5.error.includes("coder#4") && r5.error.includes("coder#5"), `错误列出 stuck 条目（实际: ${r5.error?.slice(0, 160)}）`)
  // ④ 对照：池有 running 条目 → 守卫放行（正常等待语义——不误伤）
  const runEntry = {
    id: 8, role: "coder", status: "running", report: null, error: null,
    done: false, cancelled: false, settled: new Promise(() => {}), _auto: () => false,
  }
  const agent5 = asyncParent(0, {
    _asyncSubagents: new Map([[4, bStuck], [5, cStuck], [8, runEntry]]),
    history: { _asyncTombstones: new Map([[99, { status: "cancelled", role: "eng-coder" }]]) },
  })
  const p5 = subagentTool.execute({ action: "check", n: 1, id: 5 }, asyncCtx(agent5, cwd))
  const stillWait = await Promise.race([
    p5.then(() => "returned"),
    new Promise((r) => setTimeout(() => r("still-waiting"), 120)),
  ])
  assert.equal(stillWait, "still-waiting", "有 running 条目 → 守卫放行（等待语义保留）")
  // ⑤ 对照：AUTO 档 depc——池无 running 同样不可启动 → 立即返回 queued（含 AUTO 引导注记）
  const autoEntry = mkBlocked(1, [], [99])
  autoEntry._auto = () => true
  const agent6 = asyncParent(0, {
    _asyncSubagents: new Map([[1, autoEntry]]),
    history: { _asyncTombstones: new Map([[99, { status: "cancelled", role: "eng-coder" }]]) },
  })
  const r6 = JSON.parse(await subagentTool.execute({ action: "check", n: 1, id: 1 }, asyncCtx(agent6, cwd)))
  assert.equal(r6.status, "queued", "AUTO 池无 running → 立即返回 queued（不悬挂）")
  assert.ok(r6.note.includes("AUTO session"), "注记含 AUTO 引导")
  // ⑥ check 消费 × 挂起移交竞态：条目在途被 check 持有时 settle 移交 pending → 消费反向清除
  const settled = Promise.resolve()
  const raceEntry = {
    id: 7, role: "coder", status: "running", report: "race report", error: null,
    done: false, cancelled: false, settled, _auto: () => false,
  }
  const pend = [raceEntry]
  const agent3 = asyncParent(0, {
    _asyncSubagents: new Map([[7, raceEntry]]),
    history: { _pendingAsyncResults: pend },
  })
  const r3 = JSON.parse(await subagentTool.execute({ action: "check", n: 1, id: 7 }, asyncCtx(agent3, cwd)))
  assert.equal(r3.status, "done", "check 取回报告")
  assert.equal(r3.report, "race report")
  assert.equal(pend.length, 0, "消费时反向清除 pending——防 digest 下轮重复注入（双送达守卫）")
  assert.equal(agent3.history._asyncTombstones.get(7)?.status, "consumed", "墓碑照记 consumed")
})

test("§20.8 T-F1.1/T-F1.2 (vscode): 目录声明 fail-closed——尾斜杠形态/既有目录 → 错误结果（文件级明细提示——不被排队/启动）——T-F1.4 回归 = T-SD 全绿（文件级路径不变）", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "tc-f1-"))
  const ERR = "files must be file-level paths — directory declarations are not supported"
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = asyncParent(0)
    // T-F1.1: 目录形态（尾斜杠）——错误即工具结果——验证在 spawn 入口（无需 server——不进池）
    const a = String(await subagentTool.execute({ task: "t", role: "coder", async: true, files: ["test/"] }, asyncCtx(parent, cwd)))
    assert.ok(a.includes('"status":"error"'), `T-F1.1: 结构化错误结果——actual: ${a.slice(0, 120)}`)
    assert.ok(a.includes(ERR), `T-F1.1: 错误字符串英文定稿——actual: ${a.slice(0, 120)}`)
    assert.ok(a.includes("test/"), "T-F1.1: 错误含路径")
    assert.ok(!a.includes('"status": "running"') && !a.includes("queued"), "T-F1.1: 未排队/未启动——fail-closed 直接拒 spawn")
    // T-F1.2: 既有目录（mkdtemp cwd 本身即目录）——同拒
    const b = String(await subagentTool.execute({ task: "t", role: "coder", async: true, files: [cwd] }, asyncCtx(parent, cwd)))
    assert.ok(b.includes('"status":"error"'), `T-F1.2: 既有目录声明 → 错误结果——actual: ${b.slice(0, 120)}`)
    assert.ok(b.includes(ERR), `T-F1.2: 错误字符串英文定稿——actual: ${b.slice(0, 120)}`)
    assert.ok(b.includes("tc-f1-"), "T-F1.2: 错误含被拒路径")
    // 池不能接纳目录声明（无条目产生——不绕过冲突检测）
    assert.equal(parent._asyncSubagents.size, 0, "T-F1.1/2: 目录声明不产生池条目")
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("§20.8 T-F1.3 (vscode): 文件级声明不误伤——spawn 正常进入运行时", async () => {
  const { server } = await asyncChildServer(300)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-f1b-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = asyncParent(port)
    const ok = spawnJson(await subagentTool.execute({ task: "slow f1", role: "coder", async: true, files: ["test/agent.test.mjs"] }, asyncCtx(parent, cwd)))
    assert.equal(ok.status, "running", "T-F1.3: 文件级声明（不存在的相对文件——无尾斜杠）→ 正常启动（不误伤）")
    await Promise.allSettled([...parent._asyncSubagents.values()].map((e) => e.settled))
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

// ═══════════════════════════════════════════════════════════════════════════
// §21.1 调度器环形死锁修正（AGENT-LOOP.md §21.1——D-SL1.1/1.2——T-SL1..4）
// T-SL3 = 既有 T-SD1..14 回归（本节上段测试——N-SL1 零破坏——以全量运行验证）。
// ═══════════════════════════════════════════════════════════════════════════

test("§21.1 T-SL1 (vscode): 两 queued 同文件——先入者可启动（不被后入阻断）/后入者等先入者（串行不互等）——waiting 只列真阻断者（D-SL1.2）", async () => {
  const { server } = await asyncChildServer(300)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-sl1-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = asyncParent(port)
    const ctx = asyncCtx(parent, cwd)
    // 槽满（4 running 无域）→ 同文件两 spawn 均 queued——旧代码互列互阻（环形死锁：
    // A 等 B、B 等 A——两次实证 id:26/27、id:32/33——本测试即回归防护）
    for (let n = 1; n <= 4; n++) {
      const s = spawnJson(await subagentTool.execute({ task: `slow slot ${n}`, role: "coder", async: true }, ctx))
      assert.equal(s.status, "running")
    }
    const a = spawnJson(await subagentTool.execute({ task: "slow first", role: "coder", async: true, files: ["only.mjs"] }, ctx))
    assert.equal(a.status, "queued")
    assert.equal(a.position, 1)
    assert.equal(a.waiting, undefined, "T-SL1: 先入者无假阻断者（纯 slot 等位——无 waiting 标注）")
    const b = spawnJson(await subagentTool.execute({ task: "slow second", role: "coder", async: true, files: ["only.mjs"] }, ctx))
    assert.equal(b.status, "queued")
    assert.equal(b.position, 2)
    assert.equal(b.waiting, "waiting-deps", "T-SL1: 后入者等先入者（等待标注）")
    assert.ok(b.reason.includes(`coder#${a.id}`) && b.reason.includes("域冲突"), `后入者 reason 列真阻断者（先入——实际: ${b.reason}）`)
    // D-SL1.2 展示一致：先入者不列"等一个其实等不到的人"（旧代码列后入者——误导展示面）
    const stA = JSON.parse(await subagentTool.execute({ action: "status", id: a.id }, ctx))
    assert.equal(stA.status, "queued")
    assert.equal(stA.waiting, undefined, "T-SL1/D-SL1.2: 先入者 waiting 不列后入者（只列真阻断者）")
    assert.ok(!(stA.reason ?? "").includes(`coder#${b.id}`), "先入者 reason 不含后入者")
    // 腾槽（fillers settle 触发补位）→ 先入者启动——不被后入阻断（死锁修复主线）
    const aStarted = await waitFor(() => parent._asyncSubagents.get(a.id)?.status === "running", 6000)
    assert.ok(aStarted, "T-SL1: 腾槽 → 先入者启动（不被后入者阻断——无互等）")
    assert.equal(parent._asyncSubagents.get(b.id)?.status, "queued", "先入者启动后——后入者仍排队")
    // 先入者 settle → 后入者自动启动——串行序（A → B——先到先得）
    const bStarted = await waitFor(() => parent._asyncSubagents.get(b.id)?.status === "running", 6000)
    assert.ok(bStarted, "先入者完成 → 后入者自动启动（串行——无环）")
    assert.ok(
      parent._asyncSubagents.get(a.id).startedAt < parent._asyncSubagents.get(b.id).startedAt,
      "串行序：先入者 startedAt 早于后入者",
    )
    await Promise.allSettled([...parent._asyncSubagents.values()].map((e) => e.settled))
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("§21.1 T-SL1b (vscode): queueRunnable/describeBlockers 序判定单测——先入 id=2/后入 id=3——running 照旧阻断——id 形态防御（数字字符串/非数字 fail-closed）", async () => {
  const { queueRunnable, describeBlockers } = await import("../src/agent-tools/subagent-async.mjs")
  const cwd = mkdtempSync(join(tmpdir(), "tc-sl1b-"))
  try {
    const fx = [join(cwd, "src", "x.mjs")]
    const mkQ = (id, files) => ({ id, role: "coder", status: "queued", _files: files, _dependsOn: [], cancelled: false, done: false, _auto: () => false })
    // 先入 id=2 / 后入 id=3（设计 T-SL1 输入形态——2 先 3 后）
    const parent = asyncParent(0, { _asyncSubagents: new Map([[2, mkQ(2, fx)], [3, mkQ(3, fx)]]) })
    const e2 = parent._asyncSubagents.get(2)
    const e3 = parent._asyncSubagents.get(3)
    assert.equal(queueRunnable(parent, e2), true, "先入(id=2)准入允许——不被后入(id=3)阻断")
    assert.equal(queueRunnable(parent, e3), false, "后入(id=3)准入拒绝——被先入(id=2)阻断（串行——不互等）")
    const blk2 = describeBlockers(parent, e2)
    assert.equal(blk2.kind, "slot", "先入者无假阻断——展示只列真阻断者（D-SL1.2）")
    assert.ok(!blk2.detail.includes("coder#3"), "先入者 detail 不含后入者")
    const blk3 = describeBlockers(parent, e3)
    assert.equal(blk3.kind, "wait")
    assert.ok(blk3.detail.includes("coder#2"), "后入者只列真阻断者（先入——waiting-for）")
    // running 照旧阻断（任意序——F-SL1.2：先入者启动后以 running 身份继续挡后入者）
    const e4 = { ...mkQ(4, fx), status: "running" }
    parent._asyncSubagents.set(4, e4)
    assert.equal(queueRunnable(parent, e2), false, "running 照旧阻断（即使 id 晚于先入——running 永远阻断）")
    assert.equal(queueRunnable(parent, e3), false, "running 照旧阻断（后入者同样等 running）")
    // id 形态防御：数字字符串归一（Number()）——同语义（advisor fix #3 先例）
    const ws = asyncParent(0, { _asyncSubagents: new Map([["2", mkQ("2", fx)], ["3", mkQ("3", fx)]]) })
    assert.equal(queueRunnable(ws, ws._asyncSubagents.get("2")), true, "字符串数字 id 归一——同语义（先入放行）")
    assert.equal(queueRunnable(ws, ws._asyncSubagents.get("3")), false, "字符串数字 id 归一——同语义（后入阻断）")
    // 非数字 id → NaN → 比较 false → 不跳过（fail-closed——保守阻断——不放开豁免）
    const ns = asyncParent(0, { _asyncSubagents: new Map([[2, mkQ(2, fx)], ["zz", mkQ("zz", fx)]]) })
    assert.equal(queueRunnable(ns, ns._asyncSubagents.get(2)), false, "非数字 id 不跳过（fail-closed——保守按阻断语义）")
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("§21.1 T-SL2 (vscode): 单任务无冲突——准入正常（零破坏回归——N-SL1）", async () => {
  const { server } = await asyncChildServer(150)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-sl2-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = asyncParent(port)
    const ctx = asyncCtx(parent, cwd)
    const s = spawnJson(await subagentTool.execute({ task: "slow single", role: "coder", async: true, files: ["solo.mjs"] }, ctx))
    assert.equal(s.status, "running", "T-SL2: 单任务无冲突 → 立即启动（序判定零影响）")
    await Promise.allSettled([...parent._asyncSubagents.values()].map((e) => e.settled))
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("§21.1 T-SL4 (vscode): 三 queued 同文件链——按序逐一启动——无环（先到先得）", async () => {
  const { server } = await asyncChildServer(250)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-sl4-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = asyncParent(port)
    const ctx = asyncCtx(parent, cwd)
    for (let n = 1; n <= 4; n++) {
      const s = spawnJson(await subagentTool.execute({ task: `slow slot ${n}`, role: "coder", async: true }, ctx))
      assert.equal(s.status, "running")
    }
    const a = spawnJson(await subagentTool.execute({ task: "slow chain-a", role: "coder", async: true, files: ["chain.mjs"] }, ctx))
    const b = spawnJson(await subagentTool.execute({ task: "slow chain-b", role: "coder", async: true, files: ["chain.mjs"] }, ctx))
    const c = spawnJson(await subagentTool.execute({ task: "slow chain-c", role: "coder", async: true, files: ["chain.mjs"] }, ctx))
    assert.equal(a.status, "queued")
    assert.equal(b.status, "queued")
    assert.equal(c.status, "queued")
    // 链 1：腾槽 → A 启动——B/C 仍 queued（A 不被 B/C 阻断——无环）
    const aStarted = await waitFor(() => parent._asyncSubagents.get(a.id)?.status === "running", 6000)
    assert.ok(aStarted, "T-SL4: A（先入）先启动——不被 B/C（后入）阻断")
    assert.equal(parent._asyncSubagents.get(b.id)?.status, "queued")
    assert.equal(parent._asyncSubagents.get(c.id)?.status, "queued")
    // 链 2：A settle → B 启动——C 仍 queued（B 等 A——不越行）
    const bStarted = await waitFor(() => parent._asyncSubagents.get(b.id)?.status === "running", 6000)
    assert.ok(bStarted, "T-SL4: A 完成 → B 启动（串行）")
    assert.equal(parent._asyncSubagents.get(c.id)?.status, "queued", "B 启动时 C 仍排队（同文件不并发）")
    // 链 3：B settle → C 启动——三链串行——无环
    const cStarted = await waitFor(() => parent._asyncSubagents.get(c.id)?.status === "running", 6000)
    assert.ok(cStarted, "T-SL4: B 完成 → C 启动（三链串行——无环）")
    const sta = parent._asyncSubagents.get(a.id).startedAt
    const stb = parent._asyncSubagents.get(b.id).startedAt
    const stc = parent._asyncSubagents.get(c.id).startedAt
    assert.ok(sta < stb && stb < stc, `先到先得（startedAt 严格递增——actual: ${sta}/${stb}/${stc}）`)
    await Promise.allSettled([...parent._asyncSubagents.values()].map((e) => e.settled))
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

// ═══════════════════════════════════════════════════════════════════════════
// §21.1 P-SL2 停滞机械检测（AGENT-LOOP.md §21.1 扩展注——2026-09-05——VS Code 镜像）
// T-SL2 ①-⑤：只追加不改既有——⑥ 回归 = 既有 T-SD/T-SL 全量运行（断言计数净增对拍）。
// ═══════════════════════════════════════════════════════════════════════════

test("§21.1 P-SL2 T-SL2-① (vscode): 混合边环形等待停滞（A(files X, dep C) + B(files X) + C(dep B)——无 running 全 queued——闭包无外逃）→ check arrival/指定 id 机械报错含逐条阻塞链 + status 概览 stall 字段——cancel 破环脱离判定", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const { detectStall } = await import("../src/agent-tools/subagent-scheduler.mjs")
  const cwd = mkdtempSync(join(tmpdir(), "tc-psl2a-"))
  try {
    const fx = [join(cwd, "src", "x.mjs")] // 共享文件域 X
    // 人工注入构造（T-SD5 先例——自然 spawn 序不可达：B 等 A 需 A 先入、A 等 C 需 C 先入、
    // C 等 B 需 B 先入——三约束成环）：A#1(files X, dep C#2) / C#2(dep B#3) / B#3(files X——等 A 先入)
    const mkQ = (id, files, deps) => ({
      id, role: "coder", status: "queued", position: 0,
      _files: files, _dependsOn: deps ?? [], report: null, error: null,
      done: false, cancelled: false, _auto: () => false, settled: new Promise(() => {}),
    })
    const parent = asyncParent(0, {
      _asyncSubagents: new Map([[1, mkQ(1, fx, [2])], [2, mkQ(2, [], [3])], [3, mkQ(3, fx)]]),
    })
    const ctx = asyncCtx(parent, cwd)
    const det = detectStall(parent)
    assert.ok(det !== null, "T-SL2-①: 混合环 → 机械检测命中（每 queued blocker ⊆ queued——闭包无外逃）")
    assert.equal(det.chains.length, 3, "逐条阻塞边齐全（A→C 依赖 / C→B 依赖 / B→A 域冲突）")
    // check arrival-order（无 id）→ 停滞错误含链 + cancel 破环引导（F-SL2 非静默——不悬挂）
    const r1 = JSON.parse(await subagentTool.execute({ action: "check", n: 1 }, ctx))
    assert.equal(r1.status, "error", "check（arrival）→ 停滞明确错误")
    assert.ok(r1.error.includes("pool stalled"), `错误含停滞结论（实际: ${r1.error.slice(0, 140)}）`)
    assert.ok(
      r1.error.includes("coder#1 → coder#2（依赖未完成）") && r1.error.includes("coder#2 → coder#3（依赖未完成）"),
      `错误含依赖边阻塞链逐条（实际: ${r1.error.slice(0, 220)}）`,
    )
    assert.ok(
      r1.error.includes("coder#3 → coder#1（域冲突") && r1.error.includes("x.mjs") && r1.error.includes("先入者"),
      `错误含文件域边阻塞链（先入者标注——实际: ${r1.error.slice(0, 260)}）`,
    )
    assert.ok(r1.error.includes("action:'cancel'") && r1.error.includes("P-SL2"), "错误含 cancel 破环重派引导")
    // check 指定 id（停滞成员）→ 同停滞错误（不消费——条目留池待 cancel）
    const r2 = JSON.parse(await subagentTool.execute({ action: "check", n: 2, id: 3 }, ctx))
    assert.equal(r2.id, 3, "指定 id 回显")
    assert.equal(r2.status, "error")
    assert.ok(r2.error.includes("pool stalled"), "check（指定 id）→ 停滞错误（同文案——替换既有泛化 no-running 提示）")
    assert.equal(parent._asyncSubagents.size, 3, "停滞报错不消费（条目留池——cancel 可解）")
    // status 概览 → 既有 queued 行保留 + stall 字段（链 + 单点文案）
    const st = JSON.parse(await subagentTool.execute({ action: "status" }, ctx))
    assert.equal(st.overview.queued.length, 3, "概览 queued 行保留（不误吞既有行形态）")
    assert.ok(st.stall, "概览挂 stall 字段（停滞模型可见）")
    assert.equal(st.stall.chains.length, 3)
    assert.ok(st.stall.chains[2].includes("coder#3 → coder#1") && st.stall.chains[2].includes("域冲突"), `stall 链含文件边（实际: ${st.stall.chains[2]}）`)
    assert.ok(st.stall.note.includes("cancel"), "stall note 含 cancel 破环引导")
    // cancel 破环（取消 B#3——A/C 依赖目标落墓碑 cancelled → depc 锚）→ 脱离停滞判定（不误报）
    const cb = JSON.parse(await subagentTool.execute({ action: "cancel", id: 3 }, ctx))
    assert.equal(cb.status, "cancelled")
    assert.equal(cb.was, "queued")
    assert.equal(detectStall(parent), null, "cancel 破环 → 检测静默（depc 锚——外部决策可解——无未来机械停滞误报）")
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("§21.1 P-SL2 T-SL2-②③④⑤ (vscode): 不误报——正常依赖链(running 锚)/合法文件串行/单 queued/无 blocker 不可达态/dep-cancelled → 检测全静默 + 既有 check 守卫输出逐字不变", async () => {
  const { detectStall } = await import("../src/agent-tools/subagent-scheduler.mjs")
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const cwd = mkdtempSync(join(tmpdir(), "tc-psl2b-"))
  try {
    const fx = [join(cwd, "src", "x.mjs")]
    const mkQ = (id, files, deps) => ({
      id, role: "coder", status: "queued", position: 0,
      _files: files, _dependsOn: deps ?? [], report: null, error: null,
      done: false, cancelled: false, _auto: () => false, settled: new Promise(() => {}),
    })
    const mkR = (id, files = []) => ({
      id, role: "coder", status: "running", position: 0,
      _files: files, _dependsOn: [], report: null, error: null,
      done: false, cancelled: false, _auto: () => false, settled: new Promise(() => {}),
    })
    // ② 正常依赖链（running 锚点——settle 驱动未来事件）不报
    const p1 = asyncParent(0, { _asyncSubagents: new Map([[1, mkR(1)], [2, mkQ(2, [], [1])]]) })
    assert.equal(detectStall(p1), null, "② 正常依赖链（running 锚点）→ 不报")
    // ④ 合法文件串行不报（blocker 含 running 持域者——settle 即补位）
    const p2 = asyncParent(0, { _asyncSubagents: new Map([[6, mkR(6, fx)], [7, mkQ(7, fx)]]) })
    assert.equal(detectStall(p2), null, "④ 合法文件串行（running 持域）→ 不报")
    // ⑤ 单 queued 不报
    const p3 = asyncParent(0, { _asyncSubagents: new Map([[8, mkQ(8, fx)]]) })
    assert.equal(detectStall(p3), null, "⑤ 单 queued → 不报")
    // 无 blocker 的 queued（先入者无冲突无依赖——refill 必启的不可达态）→ ∅ ⊆ 空真防误报收窄
    // （判据补充用例——超出任务书 T-SL2 编号表——零误报收窄）
    const p4 = asyncParent(0, { _asyncSubagents: new Map([[9, mkQ(9, fx)], [10, mkQ(10, fx)]]) })
    assert.equal(detectStall(p4), null, "⑥ 无 blocker queued（不可达态）→ 不报（∅ ⊆ 防护——判据收窄）")
    // ③ dep-cancelled 等待不报（外部决策可解——§20 NF-SD 滞留有意）——unit + 工具级回归
    const p5 = asyncParent(0, {
      _asyncSubagents: new Map([[4, mkQ(4, fx, [99])], [5, mkQ(5, fx)]]),
      history: { _asyncTombstones: new Map([[99, { status: "cancelled", role: "eng-coder" }]]) },
    })
    assert.equal(detectStall(p5), null, "③ dep-cancelled 锚 → 不报（外部决策可解）")
    const r5 = JSON.parse(await subagentTool.execute({ action: "check", n: 1 }, asyncCtx(p5, cwd)))
    assert.equal(r5.status, "error")
    assert.ok(r5.error.startsWith("nothing will settle"), "③ 非停滞全 queued 池 → 既有 arrival 守卫错误逐字不变（零破坏）")
    assert.ok(!r5.error.includes("stalled"), "③ 既有错误不混入停滞文案（停滞检测仅闭包态触发）")
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

