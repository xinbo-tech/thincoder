/**
 * context-parity.test.mjs — VSC-CONTEXT-PARITY 批（R1/R2/R5）注入面 / 顺序 / 尾块机判：
 * T-CI-1 ~ T-CI-10（13 条——含 T-CI-2a/2b/2c、T-CI-3b）。设计权威 = VSC 仓
 * `docs/design/AGENT-LOOP.md` §17.3（契约 D-CI1~D-CI10）/ §17.4（序表）/ §17.5（缓存契约）/
 * §17.7（用例表——各断言逐条回指）。
 *
 * 全部直驱 hydrateRun / 模块函数，不跑真 LLM；seam 计数形态 = context-injections
 * `_setInjectionDepsForTests`（依赖表计数包装——§17.7 修正轮 #10「spy 形态实现选定、
 * 报告备案」；git 采集面同表桩化——真 git 收集语义在 setup-reminders.test.mjs 覆盖）。
 * 会话形态：`bag()` = 面板 runOpts 同构对象（history/fullHistory 挂其上——跨 run 共享）。
 * 隔离：USERPROFILE/HOME 指向临时 home（用户级 AGENTS.md / ~/.thincoder/skills 不泄漏进断言）
 * + config 路径经 `_setConfigPathForTest` 沙箱化（config-io 的 configDir/configPath 于 import 期固化——
 * HOME 覆盖不及其路径读取，故必须用显式缝；否则本机 ~/.thincoder/config.json（agent.engineering）
 * 进入装配面 → 基座随机器漂移）。
 * S4 单仓化（设计档 TWO-REPO-MERGE.md §2.4 R16）：T-CI-11（跨仓 fail-closed 源在位守卫）
 * 整段退役——对端发现 / 自指防护 / 缺仓 fail-closed 三要素随两仓合并失去对象（计数 14 → 13）。
 */
import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir, platform as osPlatform } from "node:os"
import { join, dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { buildTopLevelAgent, hydrateRun } from "../src/agent/setup.mjs"
import { _setInjectionDepsForTests, _resetInjectionDepsForTests, listWorkDir as realListWorkDir } from "../src/agent/context-injections.mjs"
import { _resetRestartDetectionForTests } from "../src/agent/setup-reminders.mjs"
import { assemblePrompt } from "@thincoder/core/prompt-overlays.mjs"
import { _setConfigPathForTest } from "../src/config-io.mjs"
import { loadSkills, formatSkillListing } from "../src/extension/skills.mjs"
import { planTool, planReminderForTurn } from "../src/agent-tools/plan.mjs"
import { skillTool } from "../src/agent-tools/skill.mjs"
import { injectResponseReminders } from "../src/agent/run-stages.mjs"

const __here = dirname(fileURLToPath(import.meta.url))
const VSC_ROOT = resolve(__here, "..")
const PLATFORM = { win32: "Windows", darwin: "macOS", linux: "Linux" }[osPlatform()] ?? osPlatform()
const provider = { model: "deepseek-v4-pro" }

let root, home, cwd
const savedEnv = {}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "ctx-parity-"))
  home = join(root, "home")
  cwd = join(root, "project")
  mkdirSync(home, { recursive: true })
  mkdirSync(cwd, { recursive: true })
  savedEnv.USERPROFILE = process.env.USERPROFILE
  savedEnv.HOME = process.env.HOME
  process.env.USERPROFILE = home // homedir() 读 env（用户级 AGENTS.md/skills 隔离）
  process.env.HOME = home
  _setConfigPathForTest(join(home, ".thincoder", "config.json")) // config 沙箱：文件缺席 → loadRaw()={} → engineering=false（基座 = normal，机器态无关）
  _resetInjectionDepsForTests()
  _resetRestartDetectionForTests()
})

afterEach(() => {
  _setConfigPathForTest(null)
  _resetInjectionDepsForTests()
  if (savedEnv.USERPROFILE === undefined) delete process.env.USERPROFILE
  else process.env.USERPROFILE = savedEnv.USERPROFILE
  if (savedEnv.HOME === undefined) delete process.env.HOME
  else process.env.HOME = savedEnv.HOME
  try { rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 }) } catch { /* Windows handle lag */ }
})

/** 会话袋 = 面板 runOpts 同构（history/fullHistory 挂在对象上——跨 run 复用同一份）。 */
const bag = (over = {}) => ({ skills: [], ...over })

/** hydrateRun 直驱（顶层用户回合——镜像 agent.mjs 的 opts 传递）。 */
const runOnce = (agent, b, { restore = true, input = "hello" } = {}) =>
  hydrateRun(agent, { provider, cwd, input, opts: b, depth: 0, role: null, getAuto: () => false, restore })

/** 生产块依赖的确定性替身（计数/失败另行包装）。 */
const depsFor = (over = {}) => ({
  pushGitContext: async (history) => {
    history.push({ role: "user", content: "[System reminder: git context:\nGit context: on branch `main`, working tree clean.]", transient: true })
  },
  buildSummary: async () => "42 source files indexed.\nHub files (by inbound dependencies, top 1):\n  src/a.mjs — imported by: src/b.mjs",
  getEmbedder: () => ({ stub: true }),
  loadIndexManifest: () => ({ version: 1, files: {} }),
  searchIndex: async () => [{ file: "docs/design/X.md", kind: "doc", startLine: 1, endLine: 1, score: 0.9, snippet: "1: hello doc" }],
  memorySearch: () => [{ type: "rule", title: "T", content: "C" }],
  pendingItems: () => [{ status: "in_progress", text: "do the thing" }],
  ...over,
})

const contents = (hist) => hist.map((m) => (typeof m.content === "string" ? m.content : ""))
const firstIdx = (hist, prefix) => contents(hist).findIndex((c) => c.startsWith(prefix))
const countPrefix = (hist, prefix) => contents(hist).filter((c) => c.startsWith(prefix)).length

// ─── T-CI-1 正常：首 run 块序列 = §17.4 #1–#12 ────────────────────────────────

test("T-CI-1 正常：depth-0 首 run——块序列 = §17.4 #1–#12（前缀与行形态逐字）", async () => {
  _setInjectionDepsForTests(depsFor())
  writeFileSync(join(cwd, "README.md"), "hi\n") // 非空目录树 → 长形态快照
  const r = await runOnce(buildTopLevelAgent(), bag())

  const iGit = firstIdx(r.history, "[System reminder: git context:")
  const iOs = firstIdx(r.history, "[System reminder: OS: ")
  const iOutline = firstIdx(r.history, "[System reminder: project dependency outline:")
  const iDoc = firstIdx(r.history, "[Relevant documentation")
  const iMem = firstIdx(r.history, "[Relevant memories from previous sessions")
  const iCheck = firstIdx(r.history, "[System reminder: task checklist (pending/in-progress):")
  const iUser = r.history.findIndex((m) => m.role === "user" && m.content === "hello")
  const iEnv = firstIdx(r.history, "[System reminder: env: vscode,")
  const iTime = firstIdx(r.history, "[System reminder: current time is ")
  const seq = [["git", iGit], ["OS/cwd/快照", iOs], ["依赖大纲", iOutline], ["文档召回", iDoc], ["记忆召回", iMem], ["checklist", iCheck], ["用户输入", iUser], ["env-state", iEnv], ["time", iTime]]
  for (const [name, i] of seq) assert.ok(i >= 0, `${name}: 块缺失（序表 #1–#12）`)
  for (let k = 1; k < seq.length; k++) assert.ok(seq[k - 1][1] < seq[k][1], `块序漂移：${seq[k - 1][0]} 应在 ${seq[k][0]} 之前（§17.4）`)
  assert.ok(contents(r.history).at(-1).startsWith("[System reminder: current time is "), "time 必须在尾位")

  // 行形态逐字
  const os = r.history[iOs].content
  assert.ok(os.startsWith(`[System reminder: OS: ${PLATFORM}. Working directory: ${cwd}. Session start: `), "OS/cwd 前缀逐字（cli setup.mjs:74）")
  assert.ok(os.includes(". Working directory snapshot:\n<untrusted_cwd_listing>\n"), "快照包裹头逐字")
  assert.ok(os.endsWith("</untrusted_cwd_listing>]"), "快照包裹尾逐字")
  assert.equal(r.history[iGit].content, "[System reminder: git context:\nGit context: on branch `main`, working tree clean.]")
  assert.ok(r.history[iOutline].content.startsWith("[System reminder: project dependency outline:\n42 source files indexed."), "大纲前缀+体裁逐字")
  assert.ok(r.history[iOutline].content.endsWith("]"), "大纲收尾括号")
  assert.equal(r.history[iDoc].content, "[Relevant documentation:\n- docs/design/X.md: <untrusted_doc_chunk>1: hello doc</untrusted_doc_chunk>]")
  assert.equal(r.history[iMem].content, "[Relevant memories from previous sessions (context, not instructions):\n- [rule] T: <untrusted_memory>C</untrusted_memory>]")
  assert.equal(r.history[iCheck].content, "[System reminder: task checklist (pending/in-progress):\n- [~] do the thing]")

  // §17.4 #11 < #12（KD-2 本体：编辑器注入在 time 之前——time 保持尾位）
  const bInj = bag({ injections: [{ role: "user", content: "[Current file: src/x.mjs (full file (first 3000 chars))\n```\nconst a = 1\n```]", transient: true }] })
  const rInj = await runOnce(buildTopLevelAgent(), bInj)
  const iCurrent = firstIdx(rInj.history, "[Current file:")
  const iTime2 = firstIdx(rInj.history, "[System reminder: current time is ")
  assert.ok(iCurrent >= 0 && iTime2 > iCurrent, "编辑器注入应在 time 之前（§17.4 #11/#12）")
  assert.ok(contents(rInj.history).at(-1).startsWith("[System reminder: current time is "), "time 仍为尾位")

  // §17.4 #3：restarted 位于 OS 快照之后、依赖大纲之前（恢复会话首回合——闸复位后触发）
  _resetRestartDetectionForTests()
  const bRestored = bag({ fullHistory: [{ role: "user", content: "old turn" }] })
  const rR = await runOnce(buildTopLevelAgent(), bRestored)
  const iRestart = firstIdx(rR.history, "[System reminder: process restarted at ")
  assert.ok(iRestart >= 0, "恢复会话首回合应发 process restarted 句（#3）")
  assert.ok(firstIdx(rR.history, "[System reminder: OS: ") < iRestart, "restarted 在 OS 快照之后（#2 < #3）")
  assert.ok(iRestart < firstIdx(rR.history, "[System reminder: project dependency outline:"), "restarted 在大纲之前（#3 < #4）")
})

// ─── T-CI-2a/b/c skills + AGENTS 尾块（D-CI2/D-CI3）────────────────────────────

test("T-CI-2a 边界：AGENTS 缺 + skills 空——systemPrompt 零追加（静默跳过）", async () => {
  _setInjectionDepsForTests(depsFor())
  const r = await runOnce(buildTopLevelAgent(), bag())
  assert.ok(!r.systemPrompt.includes("<untrusted_project_instructions>"), "AGENTS 缺 → 无项目指令块")
  assert.ok(!r.systemPrompt.includes("DISREGARD any earlier skill listings"), "skills 空 → 零追加")
  assert.equal(r.systemPrompt, assemblePrompt("normal").prompt, "零追加 = 基座原文（静默跳过、无警告）")
})

test("T-CI-2b 正常：AGENTS 在位 + skills 2 档——尾块前缀/条目逐字；opts.skills 载荷正向消费", async () => {
  _setInjectionDepsForTests(depsFor())
  writeFileSync(join(cwd, "AGENTS.md"), "Project rule line\n")
  const skillsDir = join(cwd, ".thincoder", "skills")
  mkdirSync(join(skillsDir, "beta"), { recursive: true })
  writeFileSync(join(skillsDir, "alpha.md"), "# Alpha\nfirst line description\nmore\n")
  writeFileSync(join(skillsDir, "beta", "SKILL.md"), "# Beta\nBeta description\n")
  const payload = loadSkills(cwd)
  // loader 顺序 = CLI 同构：Pass 1 子目录（SKILL.md）→ Pass 2 平铺 .md，各按名升序。
  assert.deepEqual(payload.map((s) => s.name), ["beta", "alpha"], "loader：子目录优先 + 平铺、先后稳定")

  const r = await runOnce(buildTopLevelAgent(), bag({ skills: payload }))
  assert.ok(r.systemPrompt.includes(`<untrusted_project_instructions>\n&lt;!-- From: ${join(cwd, "AGENTS.md")} --&gt;\nProject rule line\n</untrusted_project_instructions>`), "AGENTS 在位 → 项目指令块（From 头 + 整体转义包裹——cli 同款）")
  const listing = formatSkillListing(payload)
  assert.ok(r.systemPrompt.endsWith(`\n\n${listing}`), "skills 尾块 = formatSkillListing 原文（载荷正向消费）")
  assert.ok(r.systemPrompt.includes("DISREGARD any earlier skill listings. Current available skills (use the skill tool to load one):\n- **beta**: Beta description\n- **alpha**: first line description"), "尾块前缀 + 条目行逐字")
  assert.ok(!r.systemPrompt.includes("... and"), "≤3 档 → 无溢出注")

  // 死参数消除的直接证明：载荷与磁盘不一致时以载荷为准
  const synthetic = [{ name: "payload-only", description: "payload wins" }]
  const r2 = await runOnce(buildTopLevelAgent(), bag({ skills: synthetic }))
  assert.ok(r2.systemPrompt.includes("- **payload-only**: payload wins"), "载荷生效（非重读磁盘）")
  assert.ok(!r2.systemPrompt.includes("alpha"), "磁盘条目未泄漏（载荷即权威）")
})

test("T-CI-2c 边界（截断）：skills 5 档（>3）——尾块恰 3 条 + `... and N more`", async () => {
  _setInjectionDepsForTests(depsFor())
  const skillsDir = join(cwd, ".thincoder", "skills")
  mkdirSync(skillsDir, { recursive: true })
  for (const n of ["s1", "s2", "s3", "s4", "s5"]) writeFileSync(join(skillsDir, `${n}.md`), `# ${n}\ndesc ${n}\n`)
  const payload = loadSkills(cwd)
  const r = await runOnce(buildTopLevelAgent(), bag({ skills: payload }))
  const lines = r.systemPrompt.split("\n")
  assert.equal(lines.filter((l) => /^- \*\*s\d\*\*: desc s\d$/.test(l)).length, 3, "恰 3 条")
  assert.ok(r.systemPrompt.includes("  ... and 2 more"), "溢出注 `... and N more`")
})

// ─── T-CI-3 / T-CI-3b 召回负面态 ─────────────────────────────────────────────

test("T-CI-3 边界：索引缺失 / embedder 缺——文档召回块零注入（其余块在）", async () => {
  _setInjectionDepsForTests(depsFor({ getEmbedder: () => null }))
  const r1 = await runOnce(buildTopLevelAgent(), bag())
  assert.equal(firstIdx(r1.history, "[Relevant documentation"), -1, "embedder 缺 → 零注入")
  assert.ok(firstIdx(r1.history, "[Relevant memories from previous sessions") >= 0, "其余块在（记忆召回仍走）")
  assert.ok(firstIdx(r1.history, "[System reminder: task checklist (pending/in-progress):") >= 0, "其余块在（checklist）")

  _setInjectionDepsForTests(depsFor({ loadIndexManifest: () => null }))
  const r2 = await runOnce(buildTopLevelAgent(), bag())
  assert.equal(firstIdx(r2.history, "[Relevant documentation"), -1, "索引缺失 → 零注入")
  assert.ok(firstIdx(r2.history, "[System reminder: project dependency outline:") >= 0, "其余块在（大纲）")
})

test("T-CI-3b 边界：记忆 search 零命中（索引在位）——记忆召回块零注入（其余块在）", async () => {
  _setInjectionDepsForTests(depsFor({ memorySearch: () => [] }))
  const r = await runOnce(buildTopLevelAgent(), bag())
  assert.equal(firstIdx(r.history, "[Relevant memories from previous sessions"), -1, "零命中 → 零注入")
  assert.ok(firstIdx(r.history, "[Relevant documentation") >= 0, "其余块在（文档召回）")
  assert.ok(contents(r.history).at(-1).startsWith("[System reminder: current time is "), "time 尾位不变")
})

// ─── T-CI-4 编辑器注入收窄（D-CI5）────────────────────────────────────────────

test("T-CI-4 边界：无活动编辑器零注入；同文重投幂等（D-CI5）", async () => {
  _setInjectionDepsForTests(depsFor())
  const agent = buildTopLevelAgent()
  const b = bag()
  const inj = { role: "user", content: "[Current file: src/x.mjs (full file (first 3000 chars))\n```\nconst a = 1\n```]", transient: true }
  b.injections = [inj]
  const r1 = await runOnce(agent, b)
  assert.equal(countPrefix(r1.history, "[Current file:"), 1, "首次投递 1 条")
  const r2 = await runOnce(agent, b, { restore: false, input: "again" })
  assert.equal(countPrefix(r2.history, "[Current file:"), 1, "同文二次投递零新增（幂等——同 history 线）")

  const r3 = await runOnce(buildTopLevelAgent(), bag({ injections: [] }))
  assert.equal(countPrefix(r3.history, "[Current file:"), 0, "无活动编辑器 → 零注入")
})

// ─── T-CI-5 第二 run + seam 计数（N-Q2）───────────────────────────────────────

test("T-CI-5 边界：第二 run——快照/大纲不重注 + 各恰 1 次调用（seam 计数）；time 新尾", async () => {
  const counts = { listWorkDir: 0, buildSummary: 0 }
  _setInjectionDepsForTests(depsFor({
    listWorkDir: (c) => { counts.listWorkDir++; return realListWorkDir(c) },
    buildSummary: async () => { counts.buildSummary++; return "42 source files indexed.\nHub files (by inbound dependencies, top 1):\n  src/a.mjs — imported by: src/b.mjs" },
  }))
  const agent = buildTopLevelAgent()
  const b = bag()
  const r1 = await runOnce(agent, b)
  assert.equal(counts.listWorkDir, 1, "快照 I/O 恰 1 次/实例")
  assert.equal(counts.buildSummary, 1, "大纲生成恰 1 次/session")
  const r2 = await runOnce(agent, b, { restore: false, input: "again" })
  assert.equal(r2.agent, r1.agent, "同 agent 单例（§11）")
  assert.equal(counts.listWorkDir, 1, "第二 run 不重读快照 I/O（实例一次）")
  assert.equal(counts.buildSummary, 1, "第二 run 不重生成大纲（history 前缀去重）")
  assert.equal(countPrefix(r2.history, "[System reminder: OS: "), 1, "快照块不重注")
  assert.equal(countPrefix(r2.history, "[System reminder: project dependency outline:"), 1, "大纲块不重注")
  assert.ok(contents(r2.history).at(-1).startsWith("[System reminder: current time is "), "time 在新尾（KD-2）")
})

// ─── T-CI-6 plan 节律（D-CI4）────────────────────────────────────────────────

test("T-CI-6 正常：plan enter/exit + 节律语义（稀疏 2 / 满 5 / 新消息）", async () => {
  const agent = buildTopLevelAgent()
  await planTool.execute({ action: "enter" }, { agent, callbacks: {} })
  assert.equal(agent._planMode, true, "enter 置位（本端 _planMode）")
  assert.equal(agent._pendingReminders.length, 1, "enter 先置 pending 再返包（cli :78）")
  assert.match(agent._pendingReminders[0], /^\[System reminder: plan mode is ON\. Workflow: \(1\) explore\/read codebase with read-only tools,/)

  assert.equal(planReminderForTurn(agent, false), null, "turn 1：零注入")
  assert.match(planReminderForTurn(agent, false), /^\[System reminder: plan mode still active — read-only tools only \(the current plan file exempt\)\. Design the solution, then call plan with action='exit' for user approval\.\]$/, "turn 2：稀疏句逐字")
  assert.equal(planReminderForTurn(agent, false), null, "turn 3：零注入")
  assert.match(planReminderForTurn(agent, false), /plan mode still active/, "turn 4：稀疏句")
  assert.match(planReminderForTurn(agent, false), /^\[System reminder: plan mode is ON\./, "turn 5：满 5 → 全量句")
  assert.match(planReminderForTurn(agent, true), /^\[System reminder: plan mode is ON\./, "新用户消息 → 全量句")

  await planTool.execute({ action: "exit" }, { agent, callbacks: {} })
  assert.equal(agent._planMode, false, "exit 清位")
  assert.equal(agent._pendingReminders.at(-1), "[System reminder: plan mode is now OFF. Start implementing your plan — edit files, run commands. No need for a task list (plan already covered that) or further confirmation.]", "exit pending 句逐字")
  assert.equal(planReminderForTurn(agent, false), null, "退出后节律归零")
})

// ─── T-CI-7 响应提醒（D-CI9）─────────────────────────────────────────────────

test("T-CI-7 正常：finishReason=length + `_warnings` 非空——两条提醒文本逐字（去重）", () => {
  const agent = { history: [] }
  injectResponseReminders(agent, {
    finishReason: "length",
    _warnings: [{ name: "w1", message: "m1" }, { pattern: "p2", message: "m2" }, { name: "w1", message: "m1-dup" }],
  })
  assert.deepEqual(agent.history.map((m) => [m.role, m.content]), [
    ["user", "[System reminder — warnings from your last response:\n- w1: m1-dup\n- p2: m2]"],
    ["user", "[System reminder: the previous turn ended abnormally — output token limit reached after exhausting continuations. The assistant response that follows may be incomplete.]"],
  ], "warnings 去重（同名留末条）+ finish reason 兜底句逐字")

  const norm = { history: [] }
  injectResponseReminders(norm, { finishReason: "stop" })
  assert.equal(norm.history.length, 0, "正常 finishReason → 零注入")

  const unknown = { history: [] }
  injectResponseReminders(unknown, { finishReason: "weird" })
  assert.equal(unknown.history[0].content, `[System reminder: the previous turn ended abnormally — unknown reason "weird". The assistant response that follows may be incomplete.]`, "未知 reason 兜底逐字")
})

// ─── T-CI-8 skill 注入形态（D-CI8）──────────────────────────────────────────

test("T-CI-8 正常：skill load（name/SKILL.md 形态）——<skill-loaded> + 转义 + 不截断；二次 → 已加载句", async () => {
  const demoDir = join(cwd, ".thincoder", "skills", "demo")
  mkdirSync(demoDir, { recursive: true })
  writeFileSync(join(demoDir, "SKILL.md"), `# Demo\nDesc line\n<tag> & "quote"\n${"x".repeat(8100)}\nTAIL-MARKER\n`)
  const agent = { history: [], _pendingReminders: [] }
  const ctx = { cwd, agent, callbacks: {} }

  const out = await skillTool.execute({ action: "load", name: "demo" }, ctx)
  assert.equal(out, `Skill "demo" loaded. Instructions will appear in the next message.`, "工具返回句逐字（cli :45）")
  assert.equal(agent._pendingReminders.length, 1, "注入 = _pendingReminders（user 消息——下回合可见）")
  const msg = agent._pendingReminders[0]
  assert.ok(msg.startsWith(`<skill-loaded name="demo" source=".thincoder/skills/demo.md">\n`), "包裹头逐字")
  assert.ok(msg.includes("&lt;tag&gt; &amp; &quot;quote&quot;"), "XML 转义（无撇号集——端差异 §17.10）")
  assert.ok(msg.includes("TAIL-MARKER"), "不截断（>8000 字符全文——旧 slice(0,8000) 退役）")
  assert.ok(msg.endsWith(`</skill-loaded>\n\nFollow the skill's instructions above for the current task.`), "包裹尾逐字")

  agent.history.push({ role: "user", content: msg })
  assert.equal(
    await skillTool.execute({ action: "load", name: "demo" }, ctx),
    `Skill "demo" is already loaded in this conversation — follow the instructions in the existing <skill-loaded> block above. Do not reload it.`,
    "二次 load → 已加载句（history 台账去重）",
  )
  assert.equal(agent._pendingReminders.length, 1, "二次 load 零新增注入")

  assert.equal(await skillTool.execute({ action: "list" }, ctx), "- demo: Desc line", "list → `- name: description` 行")
  assert.equal(await skillTool.execute({ action: "load", name: "nope" }, ctx), `Error: skill "nope" not found. Available: demo`, "未命中错误句同形")
})

// ─── T-CI-9 前缀缓存契约（N-Q1）─────────────────────────────────────────────

test("T-CI-9 边界：连续两 run——前一请求体是后一请求体的逐字节前缀", async () => {
  _setInjectionDepsForTests(depsFor())
  const agent = buildTopLevelAgent()
  const b = bag()
  const r1 = await runOnce(agent, b)
  const body1 = [{ role: "system", content: r1.systemPrompt }, ...r1.history]
  const snap1 = JSON.stringify(body1)
  const r2 = await runOnce(agent, b, { restore: false, input: "again" })
  const body2 = [{ role: "system", content: r2.systemPrompt }, ...r2.history]
  assert.equal(r2.systemPrompt, r1.systemPrompt, "A 类（systemPrompt）跨 run 字节稳定")
  assert.ok(body2.length > body1.length, "第二 run 仅追加")
  assert.equal(JSON.stringify(body2.slice(0, body1.length)), snap1, "前一请求体 ⊆ 后一且逐字节相等（§17.5 机判）")
})

// ─── T-CI-10 失败静默 + 失败不重试（N-Q2）───────────────────────────────────

test("T-CI-10 错误：块 I/O 失败 → 该块静默跳过；各恰 1 次调用/run（失败不重试）", async () => {
  const counts = { pushGitContext: 0, listWorkDir: 0, buildSummary: 0, searchIndex: 0, memorySearch: 0 }
  _setInjectionDepsForTests({
    pushGitContext: async () => { counts.pushGitContext++; throw new Error("git boom") },
    listWorkDir: () => { counts.listWorkDir++; throw new Error("tree boom") },
    buildSummary: async () => { counts.buildSummary++; throw new Error("outline boom") },
    getEmbedder: () => ({}),
    loadIndexManifest: () => ({}),
    searchIndex: async () => { counts.searchIndex++; throw new Error("recall boom") },
    memorySearch: () => { counts.memorySearch++; throw new Error("memory boom") },
    pendingItems: () => { throw new Error("checklist boom") },
  })
  const r = await runOnce(buildTopLevelAgent(), bag())
  assert.deepEqual(counts, { pushGitContext: 1, listWorkDir: 1, buildSummary: 1, searchIndex: 1, memorySearch: 1 }, "各恰 1 次调用/run——失败不重试")
  for (const p of ["[System reminder: git context:", "[System reminder: OS: ", "[System reminder: project dependency outline:", "[Relevant documentation", "[Relevant memories from previous sessions", "[System reminder: task checklist"]) {
    assert.equal(firstIdx(r.history, p), -1, `失败块静默跳过：${p}`)
  }
  assert.ok(r.history.some((m) => m.role === "user" && m.content === "hello"), "用户输入零影响")
  assert.ok(firstIdx(r.history, "[System reminder: env: vscode,") >= 0, "其余块零影响（env-state）")
  assert.ok(contents(r.history).at(-1).startsWith("[System reminder: current time is "), "time 尾位零影响")
})
