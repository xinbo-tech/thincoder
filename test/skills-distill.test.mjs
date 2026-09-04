/**
 * skills-distill.test.mjs — tests extracted per AGENT-LOOP.md §18.14 (test files split by domain).
 * Source(s): agent.test.mjs, tools.test.mjs.
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync, readFileSync, readdirSync, mkdirSync, existsSync, utimesSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, dirname, relative, resolve } from "node:path"
import { slow } from "./slow.mjs"
import { createMemory, put, list } from "../src/memory.mjs"
import { loadSkills, formatSkillListing, readSkill } from "../src/skills.mjs"
import { historyToTranscript, saveCandidate } from "../src/distill.mjs"
import { freshMemory } from "./helpers/memory.mjs"
import { createServer } from "node:http"
import { mockLLM } from "./helpers/mock-llm.mjs"



const READ_TRIPLE = [
  { toolCall: { name: "read", arguments: JSON.stringify({ path: "a.txt" }) } },
  { toolCall: { name: "read", arguments: JSON.stringify({ path: "b.txt" }) } },
  { toolCall: { name: "read", arguments: JSON.stringify({ path: "c.txt" }) } },
]

slow("runAgent: 轮末返回不等待蒸馏——5s 慢蒸馏 <1s 返回（AC1）", async () => {
  const { createAgent, runAgent } = await import("../src/agent.mjs")
  const readTool = {
    name: "read", description: "read a file",
    parameters: { type: "object", properties: {} }, readonly: true,
    execute: async () => "file content",
  }
  // r0-r2: 3 次 read 探索；r3: 最终回复；r4: 蒸馏（慢 5s，最后一步重复给后续请求）
  const script = [...READ_TRIPLE, { content: "final answer" }, { content: "slow distill summary", delay: 5000 }]
  const { server, port, requests } = await mockLLM(script)
  try {
    const provider = { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }
    const cwd = mkdtempSync(join(tmpdir(), "thincoder-distill-async-"))
    const agent = createAgent({ provider, tools: [readTool], config: {}, cwd })
    const t0 = Date.now()
    const out = await runAgent(agent, "探索一下", {})
    const elapsed = Date.now() - t0
    assert.equal(out, "final answer")
    assert.ok(elapsed < 1000, `轮末返回不得等 5s 慢蒸馏（实际 ${elapsed}ms）`)
    assert.ok(agent._pendingDistill instanceof Promise, "蒸馏 promise 挂 agent._pendingDistill（跨轮存活）")
    await new Promise((r) => setTimeout(r, 50))
    assert.equal(requests.length, 5, "蒸馏请求已发出（慢响应在途），不是被跳过：read×3 + 最终回复 + 蒸馏")
    // 收尾：蒸馏仍在途（5s 未到），等它自然落定（阻塞版实现会在这 5s 里卡住 runAgent，本测试即失败）
    await agent._pendingDistill
    rmSync(cwd, { recursive: true, force: true })
  } finally {
    server.close()
  }
})



slow("runAgent: 下一轮开头 await 蒸馏——第二轮起点是压缩版，输入不被替换清掉（AC2/N1）", async () => {
  const { createAgent, runAgent } = await import("../src/agent.mjs")
  const readTool = {
    name: "read", description: "read a file",
    parameters: { type: "object", properties: {} }, readonly: true,
    execute: async () => "file content",
  }
  // r0-r2: 第一轮 3 次 read；r3: 第一轮最终回复；r4: 蒸馏（慢 400ms，返回时尚未落定）；r5: 第二轮回复
  const script = [
    ...READ_TRIPLE,
    { content: "round one done" },
    { content: "distilled: found the config in src/config.mjs", delay: 400 },
    { content: "round two done" },
  ]
  const { server, port, requests } = await mockLLM(script)
  try {
    const provider = { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }
    const cwd = mkdtempSync(join(tmpdir(), "thincoder-distill-across-runs-"))
    const agent = createAgent({ provider, tools: [readTool], config: {}, cwd })

    const t0 = Date.now()
    const out1 = await runAgent(agent, "第一轮：探索配置", {})
    assert.equal(out1, "round one done")
    assert.ok(Date.now() - t0 < 1000, "第一轮返回不等待蒸馏")
    assert.ok(agent._pendingDistill, "蒸馏在途，promise 已挂载")

    // 蒸馏未落定时立即发第二轮：runAgent 开头必须先 await 蒸馏，再 push 本轮输入（N1）
    const out2 = await runAgent(agent, "第二轮：继续", {})
    assert.equal(out2, "round two done")
    assert.equal(requests.length, 6, "两轮共 6 次调用：探索×3 + 第一轮回复 + 蒸馏 + 第二轮回复")
    await agent._pendingDistill // 第二轮自身的蒸馏（无探索，立即落定）

    const round2Msgs = requests[5].messages
    const noteIdx = round2Msgs.findIndex((m) => typeof m.content === "string" && m.content.startsWith("[Exploration summary]"))
    assert.ok(noteIdx >= 0, "第二轮请求携带压缩后的 [Exploration summary] note")
    const userIdx = round2Msgs.findIndex((m) => m.role === "user" && m.content === "第二轮：继续")
    assert.ok(userIdx > noteIdx, "摘要 note 在第二轮用户输入之前（蒸馏先落位，输入后 push）")
    assert.ok(!round2Msgs.some((m) => m.content === "file content"), "第二轮请求不再含原始探索结果（已压缩）")
    assert.ok(agent.history.some((m) => m.role === "user" && m.content === "第二轮：继续"), "第二轮输入未被蒸馏替换清掉")
    rmSync(cwd, { recursive: true, force: true })
  } finally {
    server.close()
  }
})



test("runAgent: 蒸馏完成触发 onDistilled，无替换不触发（AC3）", async () => {
  const { createAgent, runAgent } = await import("../src/agent.mjs")
  const readTool = {
    name: "read", description: "read a file",
    parameters: { type: "object", properties: {} }, readonly: true,
    execute: async () => "file content",
  }
  // 有探索：r0-r2 read ×3、r3 最终回复、r4 蒸馏成功
  const { server, port } = await mockLLM([...READ_TRIPLE, { content: "done" }, { content: "distilled summary" }])
  try {
    const provider = { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }
    const cwd = mkdtempSync(join(tmpdir(), "thincoder-distill-cb-"))
    const agent = createAgent({ provider, tools: [readTool], config: {}, cwd })
    let distilled = 0
    const out = await runAgent(agent, "探索", { onDistilled: () => distilled++ })
    assert.equal(out, "done")
    await agent._pendingDistill // 蒸馏异步落定后才断言回调
    assert.equal(distilled, 1, "替换历史后 onDistilled 恰好触发一次")
    rmSync(cwd, { recursive: true, force: true })
  } finally {
    server.close()
  }

  // 无探索的普通轮次：蒸馏无替换，onDistilled 不触发
  const { server: s2, port: p2, requests: r2 } = await mockLLM([{ content: "plain reply" }])
  try {
    const provider = { baseURL: `http://127.0.0.1:${p2}`, apiKey: "x", model: "m" }
    const cwd = mkdtempSync(join(tmpdir(), "thincoder-distill-cb-none-"))
    const agent = createAgent({ provider, tools: [], config: {}, cwd })
    let distilled = 0
    await runAgent(agent, "普通提问", { onDistilled: () => distilled++ })
    await agent._pendingDistill
    assert.equal(distilled, 0, "没有探索结果（无替换）不触发 onDistilled")
    assert.equal(r2.length, 1, "无探索不发起蒸馏调用")
    rmSync(cwd, { recursive: true, force: true })
  } finally {
    s2.close()
  }
})



test("runAgent: 蒸馏失败静默——返回不受影响，历史原样（AC4）", async () => {
  const { createAgent, runAgent } = await import("../src/agent.mjs")
  const readTool = {
    name: "read", description: "read a file",
    parameters: { type: "object", properties: {} }, readonly: true,
    execute: async () => "file content",
  }
  // r4 蒸馏返回空内容 → distillExplorations 返回 null（静默失败：不发 onDistilled、不替换历史）
  const { server, port, requests } = await mockLLM([...READ_TRIPLE, { content: "final" }, { content: "" }])
  try {
    const provider = { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }
    const cwd = mkdtempSync(join(tmpdir(), "thincoder-distill-fail-"))
    const agent = createAgent({ provider, tools: [readTool], config: {}, cwd })
    let distilled = 0
    const out = await runAgent(agent, "探索", { onDistilled: () => distilled++ })
    assert.equal(out, "final")
    await agent._pendingDistill // 静默落定，不抛
    assert.equal(distilled, 0, "蒸馏失败不触发 onDistilled")
    assert.equal(agent.history.filter((m) => m.role === "tool" && m.content === "file content").length, 3, "失败时原始探索结果保留（历史原样）")
    assert.ok(!agent.history.some((m) => typeof m.content === "string" && m.content.startsWith("[Exploration summary]")), "失败不产生摘要 note")
    assert.equal(requests.length, 5, "恰好一次蒸馏调用（失败返回 null）")
    rmSync(cwd, { recursive: true, force: true })
  } finally {
    server.close()
  }
})



// ---------------------------------------------------------------- skills 系统


test("skills: load / list / read", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-skills-"))
  try {
    const skillDir = join(dir, ".thincoder", "skills")
    mkdirSync(skillDir, { recursive: true })
    writeFileSync(join(skillDir, "deploy.md"), "# Deploy\nPush to production.")
    writeFileSync(join(skillDir, "review.md"), "# Review\nCheck the diff.\n## Steps\n- read diff\n- run tests")
    writeFileSync(join(skillDir, "lint.md"), "---\nname: lint\n---\n# Lint\nRun the linter.")
    writeFileSync(join(skillDir, "not-a-skill.txt"), "ignore me")

    const skills = await loadSkills(dir)
    assert.equal(skills.length, 3)
    assert.equal(skills[0].name, "deploy")
    assert.equal(skills[0].description, "Push to production.")
    assert.equal(skills[1].name, "lint")
    assert.equal(skills[1].description, "Run the linter.") // frontmatter 字段行不误当描述
    assert.equal(skills[2].name, "review")

    const listing = formatSkillListing(skills)
    assert.ok(listing.includes("deploy"))
    assert.ok(listing.includes("review"))

    const body = await readSkill(dir, "deploy")
    assert.equal(body, "# Deploy\nPush to production.")
    assert.equal(await readSkill(dir, "nonexistent"), null)
    assert.equal(await readSkill(dir, "../../etc/passwd"), null) // 路径穿越被正则拦截
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("skills: empty dir returns empty", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-skempty-"))
  try {
    assert.deepEqual(await loadSkills(dir), [])
    assert.equal(formatSkillListing([]), "")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})


// ---------------------------------------------------------------- distill


test("distill: saveCandidate tags 归一化（LLM 输出不可信）", async () => {
  const m = freshMemory()
  // 字符串 tags 按逗号/空白切分
  const r1 = await saveCandidate(m, { type: "knowledge", title: "t1", content: "c1", tags: "a, b c" })
  assert.ok(r1.startsWith("personal#"))
  // 非字符串非数组 tags 不崩
  const r2 = await saveCandidate(m, { type: "knowledge", title: "t2", content: "c2", tags: 42 })
  assert.ok(r2.startsWith("personal#"))
})



test("distill: historyToTranscript 容忍缺失 function 的 tool_call", () => {
  const text = historyToTranscript([
    { role: "user", content: "hi" },
    { role: "assistant", content: "", tool_calls: [{ function: { name: "read", arguments: "{}" } }, { id: "broken" }] },
  ])
  assert.ok(text.includes("read("))
  assert.ok(text.includes("?(")) // 缺失 function 的占位不抛 TypeError
})
