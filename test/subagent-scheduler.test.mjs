/**
 * subagent-scheduler.test.mjs — tests extracted per AGENT-LOOP.md §18.14 (test files split by domain).
 * Source(s): subagent.test.mjs.
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { LONG_REPORT } from "./helpers/long-report.mjs"
import { createAgent } from "../src/agent.mjs"
import { waitFor } from "./helpers/wait-for.mjs"

function asyncServer(script, route) {
  return import("node:http").then(({ createServer }) => {
    let i = 0
    const requests = []
    const server = createServer((req, res) => {
      let bodyText = ""
      req.on("data", (c) => (bodyText += c))
      req.on("end", async () => {
        // 防御（§21.1 测试修复——cancel 中止的在途请求/破损请求不破坏服务循环——
        // 应答失败/客户端已中止一律静默——绝不挂起存活客户端（无响应 = 子代理永不 settle））。
        let parsed = null
        try { parsed = JSON.parse(bodyText) } catch { /* 破损请求——仍应答（客户端自判定） */ }
        requests.push(parsed)
        // §21.1 T-SL1/T-SL4 route 模式：按任务正文路由响应（不按请求到达序——cancel
        // 中止的在途请求不达 server 端会错位索引派发——正文路由与到达序/中止无关）。
        const step = route ? route(parsed, bodyText) : script[Math.min(i++, script.length - 1)]
        try {
          if (step.delay) await new Promise((r) => setTimeout(r, step.delay))
          const frames = step.toolCall
            ? `data: ${JSON.stringify({ choices: [{ index: 0, delta: { tool_calls: [{ index: 0, id: `call_${i}`, function: { name: step.toolCall.name, arguments: step.toolCall.arguments ?? "{}" } }] } }] })}\n\n` +
              `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "tool_calls" }] })}\n\n` +
              `data: [DONE]\n\n`
            : `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: step.content } }] })}\n\n` +
              `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
              `data: [DONE]\n\n`
          if (!res.destroyed && !res.writableEnded) {
            res.writeHead(200, { "Content-Type": "text/event-stream" })
            res.end(frames)
          }
        } catch { /* 客户端已中止——应答失败无害 */ }
      })
    })
    return new Promise((resolve) => {
      server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port, requests }))
    })
  })
}
async function spawnAsync(parent, cwd, task) {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const r = String(await subagentTool.execute({ task, role: "coder", async: true }, {
    agent: parent, cwd, callbacks: {}, depth: 0,
  }))
  return JSON.parse(r)
}

function asyncParent(provider, cwd) {
  return import("../src/agent.mjs").then(({ createAgent }) =>
    createAgent({ provider, tools: [noopRead], config: { agent: {} }, cwd }))
}
function tokenCtx(parent, cwd, tokens) {
  return { agent: parent, cwd, depth: 0, callbacks: { onToken: (t) => tokens.push(t) } }
}
const noopRead = { name: "read", description: "read a file", parameters: { type: "object", properties: {} }, readonly: true, execute: async () => "ok" }




test("§15 T6/T10/T11: 槽位队列——超限入队不拒绝 + 腾槽自动补位 + 位置递增", async () => {
  // s1 快（触发第一次腾槽补位）；s2/s3/s4 慢（保持 4 槽占满）；s5 也慢（补位后
  // 短暂窗口内 s6/s7 必须观察到 running=4 而入队）；s6/s7 快（补位后跑完收尾）。
  const { server, port } = await asyncServer([
    { content: LONG_REPORT("child1") },
    { content: LONG_REPORT("slow2"), delay: 600 },
    { content: LONG_REPORT("slow3"), delay: 600 },
    { content: LONG_REPORT("slow4"), delay: 600 },
    { content: LONG_REPORT("slow5"), delay: 600 },
    { content: LONG_REPORT("child6") },
    { content: LONG_REPORT("child7") },
  ])
  const cwd = mkdtempSync(join(tmpdir(), "cli-async-"))
  try {
    const parent = await asyncParent({ baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }, cwd)
    const s1 = await spawnAsync(parent, cwd, "t1")
    const s2 = await spawnAsync(parent, cwd, "t2")
    const s3 = await spawnAsync(parent, cwd, "t3")
    const s4 = await spawnAsync(parent, cwd, "t4")
    for (const s of [s1, s2, s3, s4]) assert.equal(s.status, "running", "前 4 个立即启动")
    const s5 = await spawnAsync(parent, cwd, "t5")
    assert.equal(s5.status, "queued", "T6: 第 5 个入队不拒绝")
    assert.equal(s5.position, 1, "T6: position=1")
    // T10: s1 settle → 队头 s5 自动启动（无需模型再 spawn）
    await waitFor(() => parent._asyncSubagents.get(String(s5.id)).status === "running", 4000)
    assert.ok(true, "T10: 腾槽补位自动启动")
    // T11: 补位后（5 在跑/队）第 6、7 个 position 递增 1、2
    const s6 = await spawnAsync(parent, cwd, "t6")
    const s7 = await spawnAsync(parent, cwd, "t7")
    assert.equal(s6.status, "queued")
    assert.equal(s6.position, 1, "T11: 第 6 个 position=1")
    assert.equal(s7.status, "queued")
    assert.equal(s7.position, 2, "T11: 第 7 个 position=2")
    // 全部收尾（等所有 entry settle，避免挂起连接）
    await Promise.allSettled([...parent._asyncSubagents.values()].map((e) => e.promise))
    assert.ok([...parent._asyncSubagents.values()].every((e) => e.done), "全部完成")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})



test("§19.5 T-M21: cancel 后槽位补位——running 槽腾出 → queued 队首自动启动（maybeRefillAsync 回归）+ D-M7b 标记时序（入队不发、实际启动才发）", async () => {
  const { server, port } = await asyncServer(Array.from({ length: 5 }, () => ({ content: LONG_REPORT("占槽"), delay: 6000 })))
  const cwd = mkdtempSync(join(tmpdir(), "cli-m21-"))
  try {
    const parent = await asyncParent({ baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }, cwd)
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const tokens = []
    const ctx = tokenCtx(parent, cwd, tokens)
    const spawned = []
    for (let n = 1; n <= 4; n++) {
      const s = JSON.parse(String(await subagentTool.execute({ task: `占槽${n}`, role: "coder", async: true }, ctx)))
      assert.equal(s.status, "running", `前置：第 ${n} 个立即启动`)
      spawned.push(s)
    }
    assert.equal(
      tokens.filter((t) => /^coder#\d+\/⟦ev⟧async\x1e$/.test(t)).length, 4,
      "D-M7b: 4 个 running spawn 各自发 async 标记（区块创建即知）",
    )
    const q1 = JSON.parse(String(await subagentTool.execute({ task: "排队1", role: "coder", async: true }, ctx)))
    assert.equal(q1.status, "queued", "前置：4 槽占满 → 入队")
    const q1Marker = `coder#${q1.id}/⟦ev⟧async\x1e`
    assert.ok(!tokens.includes(q1Marker), "D-M7b: queued 入队不发 async 标记（区块不 paint——实际启动才发）")
    // cancel 第一个 running → 其 settle（abort）腾出槽位 → 队首自动补位启动
    const c = JSON.parse(String(await subagentTool.execute({ action: "cancel", id: spawned[0].id }, ctx)))
    assert.equal(c.status, "cancelled")
    await waitFor(() => parent._asyncSubagents.get(String(q1.id))?.status === "running", 6000)
    assert.ok(parent._asyncSubagents.get(String(q1.id))?.status === "running", "T-M21: 取消后槽位腾出——queued 自动启动")
    assert.ok(tokens.includes(q1Marker), "D-M7b: 补位启动时 async 标记随 [model] 一起发出")
    // 收尾：清池退出（其余 running 长延迟——不悬挂）
    parent._asyncSubagents.clear()
    parent._asyncQueue = []
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})



test("§19.5 T-M27: queued 取消——出队移除 + position 前移 + 无 abort（running 槽不受影响）", async () => {
  const { server, port } = await asyncServer(Array.from({ length: 6 }, () => ({ content: LONG_REPORT("占槽"), delay: 6000 })))
  const cwd = mkdtempSync(join(tmpdir(), "cli-m27-"))
  try {
    const parent = await asyncParent({ baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }, cwd)
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const ctx = tokenCtx(parent, cwd, [])
    const running = []
    for (let n = 1; n <= 4; n++) {
      const s = JSON.parse(String(await subagentTool.execute({ task: `占槽${n}`, role: "coder", async: true }, ctx)))
      running.push(s)
    }
    const q1 = JSON.parse(String(await subagentTool.execute({ task: "排队1", role: "coder", async: true }, ctx)))
    const q2 = JSON.parse(String(await subagentTool.execute({ task: "排队2", role: "coder", async: true }, ctx)))
    assert.equal(q1.position, 1)
    assert.equal(q2.position, 2)
    // 取消队首 queued：出队 + 后续项 position 前移；返回 was:"queued"；无 abort
    const c = JSON.parse(String(await subagentTool.execute({ action: "cancel", id: q1.id }, ctx)))
    assert.deepEqual(c, { id: String(q1.id), status: "cancelled", was: "queued" }, "T-M27: queued 取消确认形态")
    assert.ok(!parent._asyncSubagents.has(String(q1.id)), "T-M27: 条目出队移除")
    assert.equal(parent._asyncQueue.length, 1, "T-M27: 队列剩 1 项")
    assert.equal(parent._asyncQueue[0].position, 1, "T-M27: 后续项 position 前移（2 → 1）")
    const q2entry = parent._asyncSubagents.get(String(q2.id))
    assert.equal(q2entry?.status, "queued", "T-M27: running 槽不受影响——后续项仍在队（不启动）")
    assert.equal(parent._asyncQueue[0].id, q2entry?.id)
    assert.equal(
      [...parent._asyncSubagents.values()].filter((e) => e.status === "running").length,
      4,
      "T-M27: 4 个 running 槽原样（无 abort 无补位）",
    )
    assert.ok(!q2entry?.controller?.signal.aborted, "T-M27: 无 abort 发生")
    parent._asyncSubagents.clear()
    parent._asyncQueue = []
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})



// ═══════════════════════════════════════════════════════════════════════════
// §20 子 agent 任务调度器（AGENT-LOOP.md §20——T-SD1..14 池层 N/E/A 展开）
// ═══════════════════════════════════════════════════════════════════════════


test("§20 T-SD1/T-SD8: 无调度参数 spawn → 立即启动（既有语义回归——零 queued 事件）；文件域不相交 → 并行（不误排）", async () => {
  const { server, port } = await asyncServer([
    { content: LONG_REPORT("占槽"), delay: 1500 },
    { content: LONG_REPORT("a 域"), delay: 1500 },
    { content: LONG_REPORT("b 域") },
  ])
  const cwd = mkdtempSync(join(tmpdir(), "cli-sd1-"))
  try {
    const parent = await asyncParent({ baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }, cwd)
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const tokens = []
    const ctx = tokenCtx(parent, cwd, tokens)
    // T-SD1: 无调度参数 → 立即启动（legacy——零改动）
    const p = JSON.parse(String(await subagentTool.execute({ task: "占槽", role: "coder", async: true }, ctx)))
    assert.equal(p.status, "running", "T-SD1: 无参数 async spawn 立即启动（既有语义回归）")
    // T-SD8: 文件域不相交 + 无依赖 → 并行（第二个不因第一个在跑而排队）
    const a = JSON.parse(String(await subagentTool.execute({ task: "a 域", role: "coder", async: true, files: ["a/one.mjs"] }, ctx)))
    const b = JSON.parse(String(await subagentTool.execute({ task: "b 域", role: "coder", async: true, files: ["b/two.mjs"] }, ctx)))
    assert.equal(a.status, "running")
    assert.equal(b.status, "running", "T-SD8: 不相交文件域并行启动（不误排）")
    assert.equal(
      [...parent._asyncSubagents.values()].filter((e) => e.status === "running").length,
      3,
      "三个条目并行 running",
    )
    assert.ok(!tokens.some((t) => t.includes("⟦ev⟧queued")), "立即启动路径零 queued 事件（块由 async/[model] 建）")
    // 收尾：等全部 settle（快者先——b 无 delay）
    await Promise.allSettled([...parent._asyncSubagents.values()].map((e) => e.promise))
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})



test("§20 T-SD2/T-SD7: 同文件域冲突 spawn → waiting-deps（不入 running——status 显示原因——路径归一化）→ 域持有者 settle 自动补位启动", async () => {
  const { server, port } = await asyncServer([
    { content: LONG_REPORT("持域"), delay: 1200 },
    { content: LONG_REPORT("冲突者"), delay: 1200 },
  ])
  const cwd = mkdtempSync(join(tmpdir(), "cli-sd2-"))
  try {
    const parent = await asyncParent({ baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }, cwd)
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const tokens = []
    const ctx = tokenCtx(parent, cwd, tokens)
    // 形态一：相对路径；形态二：绝对路径——归一化后判定同文件（round1 #5）
    const a = JSON.parse(String(await subagentTool.execute({ task: "持域任务", role: "coder", async: true, files: ["src/x.mjs"] }, ctx)))
    assert.equal(a.status, "running")
    const entryA = parent._asyncSubagents.get(String(a.id))
    assert.ok(entryA._files.length === 1 && entryA._files[0].endsWith(join("src", "x.mjs")), "D-SD2: _files 归一化为绝对路径")
    const b = JSON.parse(String(await subagentTool.execute({ task: "冲突任务", role: "coder", async: true, files: [join(cwd, "src", "x.mjs")] }, ctx)))
    assert.equal(b.status, "queued", "T-SD2: 同文件域冲突 → waiting-deps（不入 running）")
    assert.equal(b.waiting, "waiting-deps")
    assert.ok(b.reason.includes(`coder#${a.id}`) && b.reason.includes("x.mjs"), `reason 含冲突对象与文件（实际: ${b.reason}）`)
    const eb = parent._asyncSubagents.get(String(b.id))
    assert.equal(eb.status, "queued", "池状态 queued（不占槽）")
    assert.ok(!eb.startedAt, "未启动（无 startedAt）")
    // T-SD7: status 显示 waiting-deps + 原因（模型可见——F-SD4）
    const st = JSON.parse(String(await subagentTool.execute({ action: "status", id: b.id }, ctx)))
    assert.equal(st.status, "queued")
    assert.equal(st.waiting, "waiting-deps")
    assert.ok(st.reason.includes(`coder#${a.id}`), `status reason 含冲突对象（实际: ${st.reason}）`)
    const ov = JSON.parse(String(await subagentTool.execute({ action: "status" }, ctx)))
    const ovRow = ov.overview.queued.find((e) => String(e.id) === String(b.id))
    assert.equal(ovRow.waiting, "waiting-deps", "概览 queued 条目同带 waiting 标注")
    assert.ok(tokens.some((t) => t.startsWith(`coder#${b.id}/⟦ev⟧queued\x1ewait\x1e1\x1e`)), "D-SD3b: queued 事件随 spawn 返回（waiting 块通道——wait kind）")
    // 域持有者 settle（1200ms）→ 冲突解除 → 自动补位启动（槽空即启——D-SD4）
    await waitFor(() => parent._asyncSubagents.get(String(b.id))?.status === "running", 6000)
    assert.ok(parent._asyncSubagents.get(String(b.id))?.status === "running", "冲突解除自动启动（waiting 块转 running）")
    await Promise.allSettled([...parent._asyncSubagents.values()].map((e) => e.promise))
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})



test("§20 T-SD3: dependsOn 未满足 → queued（依赖原因）；依赖 settle → 自动补位启动", async () => {
  const { server, port } = await asyncServer([
    { content: LONG_REPORT("依赖目标"), delay: 1200 },
    { content: LONG_REPORT("依赖者"), delay: 900 },
  ])
  const cwd = mkdtempSync(join(tmpdir(), "cli-sd3-"))
  try {
    const parent = await asyncParent({ baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }, cwd)
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const ctx = tokenCtx(parent, cwd, [])
    const dep = JSON.parse(String(await subagentTool.execute({ task: "依赖目标", role: "coder", async: true }, ctx)))
    assert.equal(dep.status, "running")
    const child = JSON.parse(String(await subagentTool.execute({ task: "依赖者", role: "coder", async: true, dependsOn: [String(dep.id)] }, ctx)))
    assert.equal(child.status, "queued", "T-SD3: 依赖未完成 → 排队（waiting-deps）")
    assert.equal(child.waiting, "waiting-deps")
    assert.ok(child.reason.includes(`coder#${dep.id}`) && child.reason.includes("依赖未完成"), `reason 含依赖对象与原因（实际: ${child.reason}）`)
    assert.equal(parent._asyncSubagents.get(String(child.id)).status, "queued", "不入 running（不占槽）")
    await waitFor(() => parent._asyncSubagents.get(String(child.id))?.status === "running", 6000)
    assert.ok(parent._asyncSubagents.get(String(child.id))?.status === "running", "依赖 settle → 自动补位启动（槽空即启）")
    await Promise.allSettled([...parent._asyncSubagents.values()].map((e) => e.promise))
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})



test("§20 T-SD4: 多任务同依赖 → 释放后逐个启动到槽满（上限 4——D-SD4）", async () => {
  const { server, port } = await asyncServer([
    { content: LONG_REPORT("被依赖"), delay: 1500 },
    { content: LONG_REPORT("依赖者1"), delay: 900 },
    { content: LONG_REPORT("依赖者2"), delay: 900 },
    { content: LONG_REPORT("依赖者3"), delay: 900 },
    { content: LONG_REPORT("依赖者4"), delay: 900 },
  ])
  const cwd = mkdtempSync(join(tmpdir(), "cli-sd4-"))
  try {
    const parent = await asyncParent({ baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }, cwd)
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const ctx = tokenCtx(parent, cwd, [])
    const dep = JSON.parse(String(await subagentTool.execute({ task: "被依赖", role: "coder", async: true }, ctx)))
    const kids = []
    for (let i = 1; i <= 4; i++) {
      const k = JSON.parse(String(await subagentTool.execute({ task: `依赖者${i}`, role: "coder", async: true, dependsOn: [String(dep.id)] }, ctx)))
      assert.equal(k.status, "queued", `第 ${i} 个依赖者排队`)
      kids.push(k)
    }
    assert.equal((parent._asyncSubagents.get(String(dep.id))).status, "running", "依赖目标仍在跑")
    await waitFor(() => kids.every((k) => parent._asyncSubagents.get(String(k.id))?.status === "running"), 8000)
    assert.equal(
      [...parent._asyncSubagents.values()].filter((e) => e.status === "running").length,
      4,
      "T-SD4: 一批依赖者同时解除 → 逐个启动到槽满（≤4）",
    )
    await Promise.allSettled([...parent._asyncSubagents.values()].map((e) => e.promise))
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})



test("§20 T-SD4b: 混合队列（waiting-deps 在前 + slot-queued 在后）——槽释放时 earliest-runnable 启动（waiting 越行不阻塞槽位）", async () => {
  const { server, port } = await asyncServer(Array.from({ length: 7 }, (_, i) => ({ content: LONG_REPORT(`槽${i}`), delay: i === 0 ? 3000 : 2000 })))
  const cwd = mkdtempSync(join(tmpdir(), "cli-sd4b-"))
  try {
    const parent = await asyncParent({ baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }, cwd)
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const ctx = tokenCtx(parent, cwd, [])
    const fillers = []
    for (let n = 1; n <= 4; n++) {
      const s = JSON.parse(String(await subagentTool.execute({ task: `占槽${n}`, role: "coder", async: true }, ctx)))
      fillers.push(s)
    }
    // 队首 Z：依赖占槽 2（waiting-deps——长期等）；队后 W：无阻塞（slot 等位）
    const z = JSON.parse(String(await subagentTool.execute({ task: "等依赖", role: "coder", async: true, dependsOn: [String(fillers[1].id)] }, ctx)))
    const w = JSON.parse(String(await subagentTool.execute({ task: "纯等位", role: "coder", async: true }, ctx)))
    assert.equal(z.status, "queued")
    assert.equal(z.waiting, "waiting-deps", "Z 依赖未满足——waiting")
    assert.equal(w.status, "queued")
    assert.equal(w.position, 2, "W slot 等位（position 2——Z 在前）")
    // cancel 占槽 1 → 腾 1 槽 → 补位扫描：Z 不可启动（依赖占槽2 未 settle）→ W 越行启动
    const c = JSON.parse(String(await subagentTool.execute({ action: "cancel", id: fillers[0].id }, ctx)))
    assert.equal(c.status, "cancelled")
    await waitFor(() => parent._asyncSubagents.get(String(w.id))?.status === "running", 6000)
    assert.ok(parent._asyncSubagents.get(String(w.id))?.status === "running", "T-SD4b: 槽释放 → earliest runnable（W）越行启动")
    assert.equal(parent._asyncSubagents.get(String(z.id))?.status, "queued", "Z（waiting-deps 在前）仍排队（不阻塞槽位——也不被跳过误启动）")
    parent._asyncSubagents.clear()
    parent._asyncQueue = []
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})



test("§20 T-SD5/T-SD10: dependsOn 成环 → spawn 拒绝（人工注入构造——防御断言）；unknown id → 明确错误", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const cwd = process.cwd()
  // T-SD10: unknown id（非 consumed——从未存在）→ 明确错误
  const empty = { config: { agent: {} }, _asyncSubagents: new Map(), cwd }
  await assert.rejects(
    subagentTool.execute({ task: "x", role: "coder", async: true, dependsOn: ["42"] }, { agent: empty, cwd, callbacks: {}, depth: 0 }),
    /unknown async subagent id: 42/,
    "T-SD10: unknown id 拒绝（错误明确）",
  )
  // T-SD5: 人工向池注入成环条目（1→2→1——自然流程不可达）——spawn 依赖 1 → 拒绝
  const mk = (id, deps) => ({
    id, role: "coder", relayPrefix: `coder#${id}/`, status: "queued", position: id,
    _files: [], _dependsOn: deps, report: null, error: null, done: false, cancelled: false,
  })
  const cyc = { config: { agent: {} }, _asyncSubagents: new Map([["1", mk(1, ["2"])], ["2", mk(2, ["1"])]]), cwd }
  await assert.rejects(
    subagentTool.execute({ task: "x", role: "coder", async: true, dependsOn: ["1"] }, { agent: cyc, cwd, callbacks: {}, depth: 0 }),
    /cycle detected: 1 → 2 → 1/,
    "T-SD5: 可达环拒绝（错误列路径）",
  )
})



test("§20 T-SD6: cancel waiting-deps 任务 → 出队移除 + 后续 position 前移 + cancelled 块移除事件", async () => {
  const { server, port } = await asyncServer(Array.from({ length: 5 }, () => ({ content: LONG_REPORT("占槽"), delay: 3000 })))
  const cwd = mkdtempSync(join(tmpdir(), "cli-sd6-"))
  try {
    const parent = await asyncParent({ baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }, cwd)
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const tokens = []
    const ctx = tokenCtx(parent, cwd, tokens)
    const fillers = []
    for (let n = 1; n <= 4; n++) {
      // 占槽 1 声明文件域 only.mjs（running 域持有者）——B 与之冲突排队
      const s = JSON.parse(String(await subagentTool.execute({ task: `占槽${n}`, role: "coder", async: true, ...(n === 1 ? { files: ["only.mjs"] } : {}) }, ctx)))
      fillers.push(s)
    }
    // B：与 running 占槽 1 同文件域 → waiting-deps；C：纯 slot 等位
    const b = JSON.parse(String(await subagentTool.execute({ task: "冲突等位", role: "coder", async: true, files: ["only.mjs"] }, ctx)))
    assert.equal(b.waiting, "waiting-deps")
    assert.ok(b.reason.includes(`coder#${fillers[0].id}`), `B 冲突对象 = running 占槽 1（实际: ${b.reason}）`)
    const c = JSON.parse(String(await subagentTool.execute({ task: "纯等位", role: "coder", async: true }, ctx)))
    assert.equal(c.position, 2, "C 在 B 之后（position 2）")
    // cancel waiting-deps 任务 B → 出队（was:"queued"——无依赖者故无 note）+ C position 前移 + 块移除事件
    const cb = JSON.parse(String(await subagentTool.execute({ action: "cancel", id: b.id }, ctx)))
    assert.equal(cb.id, String(b.id))
    assert.equal(cb.status, "cancelled")
    assert.equal(cb.was, "queued", "queued 取消确认形态")
    assert.equal(cb.dependents, undefined, "无依赖者 → 无 note 字段（干净确认形态）")
    assert.ok(!parent._asyncSubagents.has(String(b.id)), "T-SD6: waiting-deps 条目出队移除")
    assert.equal(parent._asyncQueue.length, 1)
    assert.equal(parent._asyncQueue[0].id, Number(c.id), "剩余队项 = C")
    assert.equal(parent._asyncQueue[0].position, 1, "T-SD6: 后续项 position 前移（2 → 1）")
    assert.ok(tokens.includes(`coder#${b.id}/⟦ev⟧cancelled\x1e`), "D-SD3b: cancelled 事件发出（waiting 块移除通道）")
    parent._asyncSubagents.clear()
    parent._asyncQueue = []
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})



test("§20 T-SD9: cancel queued 依赖 → 依赖者留 queued 标 dependency cancelled（round2 #3 锁——手动档腾槽也不自动启动——工具结果内注记）——父显式 cancel 释放", async () => {
  const { server, port } = await asyncServer(Array.from({ length: 8 }, () => ({ content: LONG_REPORT("槽"), delay: 4000 })))
  const cwd = mkdtempSync(join(tmpdir(), "cli-sd9-"))
  try {
    const parent = await asyncParent({ baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }, cwd)
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const ctx = tokenCtx(parent, cwd, [])
    const fillers = []
    for (let n = 1; n <= 4; n++) {
      const s = JSON.parse(String(await subagentTool.execute({ task: `占槽${n}`, role: "coder", async: true }, ctx)))
      fillers.push(s)
    }
    const x = JSON.parse(String(await subagentTool.execute({ task: "排队依赖", role: "coder", async: true }, ctx))) // queued（slot）
    const y = JSON.parse(String(await subagentTool.execute({ task: "依赖者", role: "coder", async: true, dependsOn: [String(x.id)] }, ctx)))
    assert.equal(y.status, "queued")
    // cancel queued 依赖 X（无 settle 事件——round1 #4：cancel 返回即处置）→ 依赖者 Y 留
    // queued 标 dependency cancelled——工具结果内注记（模型可见通道）
    const cx = JSON.parse(String(await subagentTool.execute({ action: "cancel", id: x.id }, ctx)))
    assert.equal(cx.status, "cancelled")
    assert.equal(cx.was, "queued")
    assert.deepEqual(cx.dependents, [`coder#${y.id}`], "依赖者列表随 cancel 返回（工具结果内）")
    assert.ok(cx.note.includes("dependency cancelled"), `注记说明处置选项（实际: ${cx.note?.slice(0, 120)}）`)
    assert.ok(parent._asyncSubagents.has(String(y.id)), "依赖者未出队")
    const st = JSON.parse(String(await subagentTool.execute({ action: "status", id: y.id }, ctx)))
    assert.equal(st.status, "queued")
    assert.equal(st.waiting, "dependency-cancelled", "T-SD9: 依赖者留 queued 标 dependency cancelled（模型可见）")
    assert.ok(st.reason.includes("dependency cancelled"), `reason 标注取消事实（实际: ${st.reason}）`)
    // 腾槽也不自动启动（round2 #3 锁——仅父显式处置或 AUTO）：cancel 占槽 1 → 槽空 →
    // 补位扫描：Y depc 锁 → 留 queued（稍候断言——防迟发补位竞态）
    const c1 = JSON.parse(String(await subagentTool.execute({ action: "cancel", id: fillers[0].id }, ctx)))
    assert.equal(c1.status, "cancelled")
    await new Promise((r) => setTimeout(r, 250))
    assert.equal(parent._asyncSubagents.get(String(y.id))?.status, "queued", "手动档：槽空也不自动启动（depc 锁——滞留有意——显式可清）")
    // 父显式处置（cancel 该依赖者）→ 出队释放（评审 #6：显式可清——不静默）
    const cy = JSON.parse(String(await subagentTool.execute({ action: "cancel", id: y.id }, ctx)))
    assert.equal(cy.status, "cancelled")
    assert.equal(cy.was, "queued")
    assert.ok(!parent._asyncSubagents.has(String(y.id)), "显式 cancel 释放 depc 滞留条目")
    parent._asyncSubagents.clear()
    parent._asyncQueue = []
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})



test("§20 T-SD9b: AUTO 档——依赖取消后依赖者自动启动（round2 #3——仅 AUTO/父显式才启动）", async () => {
  const { server, port } = await asyncServer(Array.from({ length: 8 }, () => ({ content: LONG_REPORT("槽"), delay: 4000 })))
  const cwd = mkdtempSync(join(tmpdir(), "cli-sd9b-"))
  try {
    const parent = await asyncParent({ baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }, cwd)
    parent.autoApprove = true // AUTO 档（无人值守——digest 决策）
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const ctx = tokenCtx(parent, cwd, [])
    const fillers = []
    for (let n = 1; n <= 4; n++) {
      const s = JSON.parse(String(await subagentTool.execute({ task: `占槽${n}`, role: "coder", async: true }, ctx)))
      fillers.push(s)
    }
    const x = JSON.parse(String(await subagentTool.execute({ task: "排队依赖", role: "coder", async: true }, ctx)))
    const y = JSON.parse(String(await subagentTool.execute({ task: "依赖者", role: "coder", async: true, dependsOn: [String(x.id)] }, ctx)))
    assert.equal(y.status, "queued")
    // AUTO：cancel queued 依赖 X → 依赖者 Y 仍留 queued（槽满）……
    const cx = JSON.parse(String(await subagentTool.execute({ action: "cancel", id: x.id }, ctx)))
    assert.equal(cx.status, "cancelled")
    assert.equal(parent._asyncSubagents.get(String(y.id))?.status, "queued", "AUTO：槽满时 Y 仍排队（depc 视为可启动——等槽）")
    // ……腾槽 → 自动启动（不须父显式处置）
    const c1 = JSON.parse(String(await subagentTool.execute({ action: "cancel", id: fillers[0].id }, ctx)))
    assert.equal(c1.status, "cancelled")
    await waitFor(() => parent._asyncSubagents.get(String(y.id))?.status === "running", 6000)
    assert.ok(parent._asyncSubagents.get(String(y.id))?.status === "running", "T-SD9b: AUTO——依赖取消后腾槽即自动启动（round2 #3）")
    parent._asyncSubagents.clear()
    parent._asyncQueue = []
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})



test("§20 T-SD9c: cancel running 依赖 → settle cancelled 分支（终态释放点）——依赖者标 dependency cancelled + 提醒含依赖者注记", async () => {
  const { server, port } = await asyncServer(Array.from({ length: 6 }, () => ({ content: LONG_REPORT("槽"), delay: 20000 })))
  const cwd = mkdtempSync(join(tmpdir(), "cli-sd9c-"))
  try {
    const parent = await asyncParent({ baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }, cwd)
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const tokens = []
    const ctx = tokenCtx(parent, cwd, tokens)
    const dep = JSON.parse(String(await subagentTool.execute({ task: "running 依赖", role: "coder", async: true }, ctx)))
    assert.equal(dep.status, "running")
    const y = JSON.parse(String(await subagentTool.execute({ task: "依赖者", role: "coder", async: true, dependsOn: [String(dep.id)] }, ctx)))
    assert.equal(y.waiting, "waiting-deps")
    // cancel running 依赖 → abort → settle cancelled 分支：墓碑 + 依赖者 depc 标注 + 提醒
    const c = JSON.parse(String(await subagentTool.execute({ action: "cancel", id: dep.id }, ctx)))
    assert.equal(c.status, "cancelled")
    await waitFor(() => !parent._asyncSubagents.has(String(dep.id)), 6000)
    assert.equal(parent._asyncTombstones.get(String(dep.id))?.status, "cancelled", "running 取消 settle → 终态墓碑（cancelled）")
    const st = JSON.parse(String(await subagentTool.execute({ action: "status", id: y.id }, ctx)))
    assert.equal(st.status, "queued")
    assert.equal(st.waiting, "dependency-cancelled", "settle 终态释放：依赖者留 queued 标 dependency cancelled")
    assert.ok(st.reason.includes("dependency cancelled"), `reason 标注（实际: ${st.reason}）`)
    assert.ok(
      parent.history.some((m) => String(m.content ?? "").includes("queued dependents") && String(m.content ?? "").includes(`coder#${y.id}`)),
      "settle 提醒含依赖者注记（模型可见——供决策）",
    )
    assert.ok(tokens.some((t) => t.startsWith(`coder#${y.id}/⟦ev⟧queued\x1edepc\x1e`)), "depc 块头刷新 token（面板恒标滞留原因）")
    parent._asyncSubagents.clear()
    parent._asyncQueue = []
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})




test("§20 T-SD13: sync spawn 带调度参数命中冲突 → 明确错误（不队列化 sync）；无冲突 → 正常阻塞跑（sync 语义零变更）", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const cwd = mkdtempSync(join(tmpdir(), "cli-sd13-"))
  try {
    // ① 冲突（域冲突——池内 running 持域）→ sync spawn 明确错误
    const holder = {
      id: 1, role: "eng-coder", relayPrefix: "eng-coder#1/", status: "running",
      _files: [join(cwd, "src", "shared.mjs")], _dependsOn: [],
      report: null, error: null, done: false, cancelled: false, controller: null,
    }
    const conflictParent = { config: { agent: {} }, _asyncSubagents: new Map([["1", holder]]), _asyncQueue: [], cwd }
    await assert.rejects(
      subagentTool.execute({ task: "x", role: "coder", files: ["src/shared.mjs"] }, { agent: conflictParent, cwd, callbacks: {}, depth: 0 }),
      /sync spawn \(async:false\) cannot queue/,
      "T-SD13: sync 冲突 → 明确错误（错误文本含处置建议）",
    )
    // ② 依赖未满足同拒（sync 不队列化）
    const depParent = { config: { agent: {} }, _asyncSubagents: new Map(), _asyncQueue: [], _asyncTombstones: new Map([["7", { status: "cancelled", role: "eng-coder" }]]), cwd }
    await assert.rejects(
      subagentTool.execute({ task: "x", role: "coder", dependsOn: ["7"] }, { agent: depParent, cwd, callbacks: {}, depth: 0 }),
      /sync spawn \(async:false\) cannot queue/,
      "T-SD13b: sync dependsOn 已取消依赖 → 同拒（不队列化）",
    )
    // ③ 无冲突（域空/无依赖）→ 正常阻塞执行（sync 语义零变更——真实子代理跑完）
    const { server, port } = await asyncServer([{ content: LONG_REPORT("sync 无冲突") }])
    try {
      const parent = await asyncParent({ baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }, cwd)
      const r = String(await subagentTool.execute({ task: "x", role: "coder", files: ["unrelated.mjs"] }, {
        agent: parent, cwd, callbacks: {}, depth: 0,
      }))
      assert.ok(r.includes("sync 无冲突 report"), "sync spawn（带 files 无冲突）正常阻塞返回报告——语义零变更")
    } finally {
      server.close()
    }
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})



test("§20 T-SD14: check 消费条目（终态墓碑）——dependsOn 引用视为已满足（非 consumed unknown 才拒）", async () => {
  const { server, port } = await asyncServer([
    { content: LONG_REPORT("先完成") },
    { content: LONG_REPORT("依赖者") },
  ])
  const cwd = mkdtempSync(join(tmpdir(), "cli-sd14-"))
  try {
    const parent = await asyncParent({ baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }, cwd)
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const ctx = tokenCtx(parent, cwd, [])
    const first = JSON.parse(String(await subagentTool.execute({ task: "先完成", role: "coder", async: true }, ctx)))
    assert.equal(first.status, "running")
    // check 消费（n=1）→ 条目删除 + 终态墓碑（consumed）
    const c1 = JSON.parse(await subagentTool.execute({ action: "check", n: 1, id: first.id }, ctx))
    assert.equal(c1.status, "done")
    assert.ok(!parent._asyncSubagents.has(String(first.id)), "check 消费删除")
    assert.equal(parent._asyncTombstones.get(String(first.id)).status, "consumed", "终态墓碑记录（consumed——T-SD14）")
    // dependsOn 引用 consumed id → 视为满足 → 无阻塞 → 立即启动（而非 unknown 错误）
    const kid = JSON.parse(String(await subagentTool.execute({ task: "依赖者", role: "coder", async: true, dependsOn: [String(first.id)] }, ctx)))
    assert.equal(kid.status, "running", "T-SD14: consumed 墓碑 id 视为已满足（dependsOn 语义完成——不拒不排）")
    await Promise.allSettled([...parent._asyncSubagents.values()].map((e) => e.promise))
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})



test("§20 advisor 处置（code review 🟡）: check 对 depc 锁定条目不无界阻塞——指定 id 返回 queued+原因；arrival-order 池全锁定返回明确错误", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const cwd = process.cwd()
  // ① 指定 id：queued + depc 锁定（依赖取消墓碑）→ 立即返回（不等待——无悬挂）
  const mkLocked = (id) => ({
    id, role: "coder", relayPrefix: `coder#${id}/`, status: "queued", position: 1,
    _files: [], _dependsOn: ["99"], report: null, error: null, done: false, cancelled: false,
    startedAt: null, turn: 0, maxTurns: 0, controller: null, promise: null, _settle: null, _settleSeq: 0,
  })
  const locked = mkLocked(1)
  const agent = {
    config: { agent: {} }, cwd, autoApprove: false,
    _asyncSubagents: new Map([["1", locked]]),
    _asyncQueue: [locked],
    _asyncTombstones: new Map([["99", { status: "cancelled", role: "eng-coder" }]]),
    _asyncCheckLastN: 0,
  }
  const r1 = JSON.parse(String(await subagentTool.execute({ action: "check", n: 1, id: "1" }, { agent, depth: 0, callbacks: {} })))
  assert.equal(r1.status, "queued", "depc 锁定目标不阻塞——立即返回 queued")
  assert.equal(r1.waiting, "dependency-cancelled")
  assert.ok(r1.reason.includes("dependency cancelled"), `reason 标注锁定原因（实际: ${r1.reason}）`)
  assert.ok(r1.note.includes("cancel"), "note 引导处置（cancel/AUTO）")
  assert.ok(agent._asyncSubagents.has("1"), "未消费（条目仍在池——check 不删除）")
  // ② arrival-order：池内无 running/done、全 depc 锁定 → 明确错误（无界等待守卫）
  const agent2 = {
    config: { agent: {} }, cwd, autoApprove: false,
    _asyncSubagents: new Map([["1", mkLocked(1)], ["2", mkLocked(2)]]),
    _asyncQueue: [mkLocked(1), mkLocked(2)],
    _asyncTombstones: new Map([["99", { status: "cancelled", role: "eng-coder" }]]),
    _asyncCheckLastN: 0,
  }
  const r2 = JSON.parse(String(await subagentTool.execute({ action: "check", n: 1 }, { agent: agent2, depth: 0, callbacks: {} })))
  assert.equal(r2.status, "error", "arrival-order 全锁定池 → 明确错误（不悬挂）")
  assert.ok(r2.error.includes("dependency-cancelled"), `错误列原因（实际: ${r2.error?.slice(0, 120)}）`)
  // ③ 残留守卫（round2 #7——advisor 复审发现）：wait-kind 条目被 queued-depc 条目阻塞
  // （文件域链）——池无 running → 同样立即返回（不悬挂）——specific-id + arrival-order
  const mkFileBlocked = (id, files) => ({
    id, role: "coder", relayPrefix: `coder#${id}/`, status: "queued", position: 1,
    _files: files, _dependsOn: [], report: null, error: null, done: false, cancelled: false,
    startedAt: null, turn: 0, maxTurns: 0, controller: null, promise: null, _settle: null, _settleSeq: 0,
  })
  const fx = [join(cwd, "src", "x.mjs")] // 归一化同文件域——B(#4) 与 C(#5) 冲突
  const bStuck = mkFileBlocked(4, fx) // depc（依赖 99 已取消）+ 持域
  bStuck._dependsOn = ["99"]
  const cStuck = mkFileBlocked(5, fx) // wait-on-B（无自身依赖）
  const agent4 = {
    config: { agent: {} }, cwd, autoApprove: false,
    _asyncSubagents: new Map([["4", bStuck], ["5", cStuck]]),
    _asyncQueue: [bStuck, cStuck],
    _asyncTombstones: new Map([["99", { status: "cancelled", role: "eng-coder" }]]),
    _asyncCheckLastN: 0,
  }
  // specific-id check(C#5——wait-kind）→ 立即返回 queued（池无 running——不悬挂）
  const r4 = JSON.parse(String(await subagentTool.execute({ action: "check", n: 1, id: "5" }, { agent: agent4, depth: 0, callbacks: {} })))
  assert.equal(r4.status, "queued", "wait-kind 目标 + 无 running 池 → 立即返回（#7 残留闭合）")
  assert.equal(r4.position, 2, "返回带实时位置")
  // arrival-order 同池 → 明确错误（不再要求全 depc——结构性守卫）
  agent4._asyncCheckLastN = 1
  const r5 = JSON.parse(String(await subagentTool.execute({ action: "check", n: 2 }, { agent: agent4, depth: 0, callbacks: {} })))
  assert.equal(r5.status, "error", "arrival-order：全 queued 无 running → 明确错误（含混合锁池）")
  assert.ok(r5.error.includes("coder#4") && r5.error.includes("coder#5"), `错误列出 stuck 条目（实际: ${r5.error?.slice(0, 160)}）`)
  // ④ 对照：池有 running 条目时守卫放行（正常等待语义——不误伤）
  const runningEntry = {
    id: 8, role: "coder", relayPrefix: "coder#8/", status: "running",
    _files: [], _dependsOn: [], report: null, error: null, done: false, cancelled: false,
    startedAt: Date.now(), turn: 0, maxTurns: 0, controller: null, promise: null, _settle: null, _settleSeq: 0,
  }
  const agent5 = {
    config: { agent: {} }, cwd, autoApprove: false,
    _asyncSubagents: new Map([["4", bStuck], ["5", cStuck], ["8", runningEntry]]),
    _asyncQueue: [bStuck, cStuck],
    _asyncTombstones: new Map([["99", { status: "cancelled", role: "eng-coder" }]]),
    _asyncCheckLastN: 0,
  }
  const p5 = subagentTool.execute({ action: "check", n: 1, id: "5" }, { agent: agent5, depth: 0, callbacks: {} })
  const stillWait = await Promise.race([
    p5.then(() => "returned"),
    new Promise((r) => setTimeout(() => r("still-waiting"), 120)),
  ])
  assert.equal(stillWait, "still-waiting", "有 running 条目 → 守卫放行（等待语义保留——running settle 会唤醒）")
  // ⑤ 对照：AUTO 档 depc 非锁定——但池无 running 同样不可启动 → 立即返回 queued
  // （语义修订——原③"等待放行"改为"立即返回"：refill 由 settle 驱动——无 running 时
  // AUTO 也无法触发启动——带 AUTO 引导注记返回比悬挂正确）
  const agent3 = {
    config: { agent: {} }, cwd, autoApprove: true,
    _asyncSubagents: new Map([["1", mkLocked(1)]]),
    _asyncQueue: [mkLocked(1)],
    _asyncTombstones: new Map([["99", { status: "cancelled", role: "eng-coder" }]]),
    _asyncCheckLastN: 0,
  }
  const r6 = JSON.parse(String(await subagentTool.execute({ action: "check", n: 1, id: "1" }, { agent: agent3, depth: 0, callbacks: {} })))
  assert.equal(r6.status, "queued", "AUTO 池无 running → 立即返回 queued（含 AUTO 引导注记——不悬挂）")
  assert.ok(r6.note.includes("AUTO session"), "注记含 AUTO 引导（下个 settle/refill 启动）")
})



test("§20 advisor 处置（code review 🟡）: check 消费 × 挂起移交竞态——消费时反向清除 pending（双送达守卫）", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const cwd = process.cwd()
  // 构造竞态：check 在途等待条目 X（池内 running）→ 期间 X 经挂起分支 settle（done +
  // 移交 pending + 出池）→ 唤醒 check waiter → check 消费：pending 必须被反向清除
  // （否则下轮 prepareRun 重复注入——同一报告双送达——D-S3 只注入一次不变式）。
  const entry = {
    id: 7, role: "coder", relayPrefix: "coder#7/", status: "running",
    _files: [], _dependsOn: [], report: "race report", error: null, done: false, cancelled: false,
    startedAt: Date.now(), turn: 0, maxTurns: 0, controller: null,
    _settleSeq: 0, _lastQueuedSig: null,
  }
  const agent = {
    config: { agent: {} }, cwd, autoApprove: false,
    _asyncSubagents: new Map([["7", entry]]),
    _asyncQueue: [],
    _pendingAsyncResults: [],
    _asyncWaiters: [],
    _asyncCheckLastN: 0,
  }
  const p = subagentTool.execute({ action: "check", n: 1, id: "7" }, { agent, depth: 0, callbacks: {} })
  // 等 check 进入等待（waiter 注册）后模拟挂起 settle：done + 移交 pending + 出池 + 唤醒
  await new Promise((r) => setTimeout(r, 20))
  entry.done = true
  entry.status = "done"
  agent._pendingAsyncResults.push(entry)
  agent._asyncSubagents.delete("7")
  for (const w of agent._asyncWaiters?.splice(0) ?? []) { try { w() } catch { /* noop */ } }
  const r = JSON.parse(String(await p))
  assert.equal(r.status, "done", "check 取回报告")
  assert.equal(r.report, "race report")
  assert.equal(agent._pendingAsyncResults.length, 0, "消费时反向清除 pending——防下轮重复注入（双送达守卫）")
  assert.equal(agent._asyncTombstones.get("7")?.status, "consumed", "墓碑照记 consumed")
})



test("§20.8 T-F1.1/T-F1.2 (cli): 目录声明 fail-closed——尾斜杠形态/既有目录 → 错误结果（文件级明细提示——不被排队/启动）——T-F1.4 回归 = T-SD 全绿（文件级路径不变）", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "cli-f1-"))
  const ERR = "files must be file-level paths — directory declarations are not supported"
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = { config: { agent: {} }, _asyncSubagents: new Map(), cwd }
    const ctx = { agent: parent, cwd, callbacks: {}, depth: 0 }
    // T-F1.1: 目录形态（尾斜杠）——错误即工具结果——验证在 spawn 入口（不进池）
    const a = String(await subagentTool.execute({ task: "t", role: "coder", async: true, files: ["test/"] }, ctx))
    assert.ok(a.includes('"status":"error"'), `T-F1.1: 结构化错误结果——actual: ${a.slice(0, 120)}`)
    assert.ok(a.includes(ERR), `T-F1.1: 错误字符串英文定稿——actual: ${a.slice(0, 120)}`)
    assert.ok(a.includes("test/"), "T-F1.1: 错误含路径")
    assert.ok(!a.includes('"status": "running"') && !a.includes("queued"), "T-F1.1: 未排队/未启动——fail-closed 直接拒 spawn")
    // T-F1.2: 既有目录（mkdtemp cwd 本身即目录）——同拒
    const b = String(await subagentTool.execute({ task: "t", role: "coder", async: true, files: [cwd] }, ctx))
    assert.ok(b.includes('"status":"error"'), `T-F1.2: 既有目录声明 → 错误结果——actual: ${b.slice(0, 120)}`)
    assert.ok(b.includes(ERR), `T-F1.2: 错误字符串英文定稿——actual: ${b.slice(0, 120)}`)
    assert.ok(b.includes("cli-f1-"), "T-F1.2: 错误含被拒路径")
    // 池不能接纳目录声明（无条目产生——不绕过冲突检测）
    assert.equal(parent._asyncSubagents.size, 0, "T-F1.1/2: 目录声明不产生池条目")
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("§20.8 T-F1.3 (cli): 文件级声明不误伤——spawn 正常进入运行时", async () => {
  const { server, port } = await asyncServer([{ content: LONG_REPORT("f1 child") }])
  const cwd = mkdtempSync(join(tmpdir(), "cli-f1b-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = await asyncParent({ baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }, cwd)
    const ctx = tokenCtx(parent, cwd, [])
    const ok = JSON.parse(String(await subagentTool.execute({ task: "f1 域子代理", role: "coder", async: true, files: ["test/agent.test.mjs"] }, ctx)))
    assert.equal(ok.status, "running", "T-F1.3: 文件级声明（不存在的相对文件——无尾斜杠）→ 正常启动（不误伤）")
    await Promise.allSettled([...parent._asyncSubagents.values()].map((e) => e.promise))
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

// ═══════════════════════════════════════════════════════════════════════════
// §21.1 调度器环形死锁修正（AGENT-LOOP.md §21.1——D-SL1.1/1.2——T-SL 系）
// T-SL3（零破坏回归）= 本文件上面既有 §20 T-SD1..14 全绿——随文件运行覆盖（无需
// 独立用例——同一套断言）；T-SL1/T-SL2/T-SL4 独立用例见下。
// ═══════════════════════════════════════════════════════════════════════════

test("§21.1 T-SL1: 两 queued 同文件——先入可启动/后入阻塞——不互等（展示断言：status/面板只列真正阻断者——后入者不列）", async () => {
  // 4 槽占满（长延迟）→ q1/q2 同文件均 queued——旧代码：两 queued 互等（环形死锁——
  // 先入被后入阻断 return false——永不启动）；新代码：先入不被后入阻断。
  // route 模式（正文路由——cancel 中止请求不达 server 端不产生索引错位——确定性）；
  // q1/q2 中速（800ms——running 窗口可观察（避免"run 快于轮询"观察者竞态——q2 完成
  // 早于 waitFor 首轮 = 误判永不启动的幻影）。
  const { server, port } = await asyncServer([], (parsed, bodyText) => {
    if ((bodyText ?? "").includes("占槽")) return { content: LONG_REPORT("占槽"), delay: 6000 }
    return { content: LONG_REPORT("q 完成"), delay: 800 }
  })
  const cwd = mkdtempSync(join(tmpdir(), "cli-sl1-"))
  try {
    const parent = await asyncParent({ baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }, cwd)
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const tokens = []
    const ctx = tokenCtx(parent, cwd, tokens)
    const fillers = []
    for (let n = 1; n <= 4; n++) {
      const s = JSON.parse(String(await subagentTool.execute({ task: `占槽${n}`, role: "coder", async: true }, ctx)))
      assert.equal(s.status, "running", `前置：第 ${n} 个占位启动`)
      fillers.push(s)
    }
    const q1 = JSON.parse(String(await subagentTool.execute({ task: "同文件先入", role: "coder", async: true, files: ["x.mjs"] }, ctx)))
    const q2 = JSON.parse(String(await subagentTool.execute({ task: "同文件后入", role: "coder", async: true, files: ["x.mjs"] }, ctx)))
    assert.equal(q1.status, "queued")
    assert.equal(q2.status, "queued")
    assert.ok(Number(q1.id) < Number(q2.id), "先入 id < 后入 id（数字递增 spawn 序——Number 归一——spawn 返回 id 为字符串形态）")
    const e1 = parent._asyncSubagents.get(String(q1.id))
    const e2 = parent._asyncSubagents.get(String(q2.id))
    // 核心序判定（D-SL1.1）：先入不被后入阻断；后入被先入阻断——不互等
    const { queueRunnable, describeBlockers } = await import("../src/agent-tools/subagent-async.mjs")
    assert.equal(queueRunnable(parent, e1), true, "T-SL1: 先入可启动——不被后入阻断（互等解除）")
    assert.equal(queueRunnable(parent, e2), false, "T-SL1: 后入被先入阻断（等先入）")
    // 展示断言（D-SL1.2——describeBlockers / status / 面板 token 同一事实源）：
    // waiting 只列真正阻断者——后入者不列（先入无幻影等待对象）
    assert.equal(describeBlockers(parent, e1).kind, "slot", "D-SL1.2: 先入无阻断者（后入者不列——无幻影等待）")
    const blk2 = describeBlockers(parent, e2)
    assert.equal(blk2.kind, "wait", "D-SL1.2: 后入有真正阻断者（先入）")
    assert.ok(blk2.detail.includes(`coder#${q1.id}`) && !blk2.detail.includes(`coder#${q2.id}`), `D-SL1.2: 后入 waiting for 只列先入（实际: ${blk2.detail}）`)
    const st1 = JSON.parse(String(await subagentTool.execute({ action: "status", id: q1.id }, ctx)))
    assert.equal(st1.waiting, undefined, "D-SL1.2: 先入 status 无 waiting 字段（slot——无阻滞）")
    const st2 = JSON.parse(String(await subagentTool.execute({ action: "status", id: q2.id }, ctx)))
    assert.equal(st2.waiting, "waiting-deps")
    assert.ok(st2.reason.includes(`coder#${q1.id}`) && !st2.reason.includes(`coder#${q2.id}`), `D-SL1.2: 后入 status reason 只列先入（实际: ${st2.reason}）`)
    // 面板 token（⟦ev⟧queued——TUI 块头 waiting for 标注）：先入 slot 头（无 waiting for）；
    // 后入 wait 头列先入；先入头不含后入
    assert.ok(tokens.some((t) => t.startsWith(`coder#${q1.id}/⟦ev⟧queued\x1eslot\x1e`)), "D-SL1.2: 先入 queued 块头 slot（无 waiting for）")
    assert.ok(tokens.some((t) => t.startsWith(`coder#${q2.id}/⟦ev⟧queued\x1ewait\x1e`) && t.includes(`coder#${q1.id}`)), "D-SL1.2: 后入 queued 块头 waiting for 列先入")
    assert.ok(!tokens.some((t) => t.startsWith(`coder#${q1.id}/⟦ev⟧queued`) && t.includes(`coder#${q2.id}`)), "D-SL1.2: 先入块头不含后入（后入者不列）")
    // 不互等实证：cancel 一个占位 → 腾槽 → q1 先启动；q2 仍在队（等先入——不抢先）
    const c = JSON.parse(String(await subagentTool.execute({ action: "cancel", id: fillers[0].id }, ctx)))
    assert.equal(c.status, "cancelled")
    await waitFor(() => parent._asyncSubagents.get(String(q1.id))?.status === "running", 6000)
    assert.ok(parent._asyncSubagents.get(String(q1.id))?.status === "running", "T-SL1: 腾槽后先入立即启动（不被后入拖死）")
    const q1StartedAt = parent._asyncSubagents.get(String(q1.id)).startedAt
    assert.equal(parent._asyncSubagents.get(String(q2.id))?.status, "queued", "T-SL1: 后入仍在队——等先入（running 继续阻断——队列序保证）")
    // 串行序实证（确定性——不依赖 q1 的 HTTP 完成时序）：cancel q1（running → abort
    // settle 快路径——与自然 settle 同释放点）→ q2 随后自动启动——启动时间严格晚于
    // q1（先到先得——不互等——无环）
    const cq1 = JSON.parse(String(await subagentTool.execute({ action: "cancel", id: q1.id }, ctx)))
    assert.equal(cq1.status, "cancelled")
    await waitFor(() => parent._asyncSubagents.get(String(q2.id))?.status === "running", 6000)
    assert.ok(parent._asyncSubagents.get(String(q2.id))?.status === "running", "T-SL1: q1 释放后后入按序启动（串行——不互等）")
    assert.ok(!parent._asyncSubagents.has(String(q1.id)), "T-SL1: q1 cancelled 终态出池（释放点达成）")
    // 启动序断言用 >=（同毫秒等价——q2 因果上恒晚于 q1StartedAt 读取时刻；q1 实际
    // 启动 = 先入者，q2 在 q1 终态后才启动——串行序由"q1 释放前 q2 恒 queued"（上方
    // 断言）与"q1 终态出池后才 running"共同锁定——不依赖墙钟严格 >——防同毫秒幻影）。
    assert.ok(parent._asyncSubagents.get(String(q2.id)).startedAt >= q1StartedAt, "T-SL1: 启动序 = spawn 序（先到先得）")
    // 收尾：cancel 其余慢占槽（快 abort——不等 6s 响应完成——测试时长不拖尾）
    for (let n = 1; n < 4; n++) {
      await subagentTool.execute({ action: "cancel", id: fillers[n].id }, ctx)
    }
    await Promise.allSettled([...parent._asyncSubagents.values()].map((e) => e.promise))
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("§21.1 T-SL2: 单任务无冲突——准入正常（零破坏回归）", async () => {
  const { server, port } = await asyncServer([
    { content: LONG_REPORT("单任务1") },
    { content: LONG_REPORT("单任务2") },
  ])
  const cwd = mkdtempSync(join(tmpdir(), "cli-sl2-"))
  try {
    const parent = await asyncParent({ baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }, cwd)
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const ctx = tokenCtx(parent, cwd, [])
    const a = JSON.parse(String(await subagentTool.execute({ task: "无文件单任务", role: "coder", async: true }, ctx)))
    assert.equal(a.status, "running", "T-SL2: 无文件单任务立即启动（回归）")
    const b = JSON.parse(String(await subagentTool.execute({ task: "有文件单任务", role: "coder", async: true, files: ["solo.mjs"] }, ctx)))
    assert.equal(b.status, "running", "T-SL2: 有文件单任务（空池无冲突——文件域循环零条目）立即启动（回归）")
    await Promise.allSettled([...parent._asyncSubagents.values()].map((e) => e.promise))
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("§21.1 T-SL4: 三 queued 同文件链——按序逐一启动——无环（先到先得）", async () => {
  // route 模式：占槽慢（6s——恒占槽）、链任务中速（800ms——running 窗口内断言
  // "后链接仍排队"）；正文路由——cancel 中止请求不达 server 端不产生索引错位。
  const { server, port } = await asyncServer([], (parsed, bodyText) => {
    if ((bodyText ?? "").includes("占槽")) return { content: LONG_REPORT("占槽"), delay: 6000 }
    return { content: LONG_REPORT("链任务"), delay: 800 }
  })
  const cwd = mkdtempSync(join(tmpdir(), "cli-sl4-"))
  try {
    const parent = await asyncParent({ baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }, cwd)
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const ctx = tokenCtx(parent, cwd, [])
    const fillers = []
    for (let n = 1; n <= 4; n++) {
      const s = JSON.parse(String(await subagentTool.execute({ task: `占槽${n}`, role: "coder", async: true }, ctx)))
      assert.equal(s.status, "running", `前置：第 ${n} 个占位启动`)
      fillers.push(s)
    }
    const qs = []
    for (let n = 1; n <= 3; n++) {
      const q = JSON.parse(String(await subagentTool.execute({ task: `链${n}`, role: "coder", async: true, files: ["chain.mjs"] }, ctx)))
      assert.equal(q.status, "queued", `T-SL4: 链第 ${n} 个排队（槽满——同文件域）`)
      qs.push(q)
    }
    // 环防御序判定（D-SL1.1）：仅链首 runnable——链中/链尾被先入者阻断（不互等）
    const { queueRunnable } = await import("../src/agent-tools/subagent-async.mjs")
    assert.equal(queueRunnable(parent, parent._asyncSubagents.get(String(qs[0].id))), true, "T-SL4: 链首先入可启动（不被链中/链尾阻断）")
    assert.equal(queueRunnable(parent, parent._asyncSubagents.get(String(qs[1].id))), false, "T-SL4: 链中被链首阻断")
    assert.equal(queueRunnable(parent, parent._asyncSubagents.get(String(qs[2].id))), false, "T-SL4: 链尾被链首阻断（先入者阻断——非互等）")
    // 逐个释放槽位：每腾一槽 → 当前链头启动；后链仍排队（互不抢先——无环）；链头
    // settle → 下一链头自动启动——按序串行链（先到先得）
    for (let step = 0; step < 3; step++) {
      const c = JSON.parse(String(await subagentTool.execute({ action: "cancel", id: fillers[step].id }, ctx)))
      assert.equal(c.status, "cancelled")
      await waitFor(() => parent._asyncSubagents.get(String(qs[step].id))?.status === "running", 8000)
      assert.ok(parent._asyncSubagents.get(String(qs[step].id))?.status === "running", `T-SL4: 第 ${step + 1} 链环按序启动`)
      for (let later = step + 1; later < 3; later++) {
        assert.equal(parent._asyncSubagents.get(String(qs[later].id))?.status, "queued", `T-SL4: 链${later + 1} 仍在队（不抢先——等当前链头）`)
      }
      if (step < 2) {
        await waitFor(() => parent._asyncSubagents.get(String(qs[step].id))?.done, 8000)
      }
    }
    // 链按序逐一完成——启动时间严格递增（先到先得——无环卡死）
    await waitFor(() => qs.every((q) => parent._asyncSubagents.get(String(q.id))?.done), 10000)
    const s1 = parent._asyncSubagents.get(String(qs[0].id)).startedAt
    const s2 = parent._asyncSubagents.get(String(qs[1].id)).startedAt
    const s3 = parent._asyncSubagents.get(String(qs[2].id)).startedAt
    assert.ok(s1 < s2 && s2 < s3, `T-SL4: 启动序 = spawn 序（先到先得——实际 ${s1}/${s2}/${s3}）`)
    assert.ok(qs.every((q) => parent._asyncSubagents.get(String(q.id))?.done), "T-SL4: 三链环全部完成（无环卡死）")
    // 收尾：cancel 末位慢占槽（快 abort——不留 6s 拖尾）
    await subagentTool.execute({ action: "cancel", id: fillers[3].id }, ctx)
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})






