/**
 * batch-live-batch-lock.test.mjs — 集成用例 12-1 … 12-14（RTM CLI 端故事 12「写盘与跑命令都要报它替哪条
 * 台账行服务（不分面、不分类命令）」）。
 *
 * 判据原文 = `test/RTM.md` 第 12 节；机制 = `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.3。
 * **进入口 = 父侧工具面**（`write` / `bash` / `git` / `batch` / `ledger` 走 `executeToolCalls` 的 Phase 1
 * 真门——不直调 `ledgerBindWriteConflict`）：本档要的是「写这件事」的业务可观察结果
 * （拒 ∥ 写入、文件字节、命令是否执行、仓库有没有提交）。
 *
 * 夹具 = 仓内 `.thincoder/tmp`（在 `declarationForTarget` 的会话界内）；台账库经 `_setLedgerDirForTest`
 * 导向临时目录（不碰真实用户数据目录）。台账**按项目根隔离** ⇒ 每个夹具各有自己的账。
 * 仓建仓 / 暂存这类**夹具准备**直接走 `node:child_process`（不经被测门）。
 * 复跑（cwd = 仓根）：`node --test test/integration/batch-live-batch-lock.test.mjs`
 */
import { test, after } from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { executeToolCalls } from "../../thincoder-core/agent/dispatch.mjs"
import { writeTool } from "../../thincoder-core/tools/file.mjs"
import { bashTool } from "../../thincoder-core/tools/bash.mjs"
import { gitTool } from "../../thincoder-core/tools/git.mjs"
import { grepTool } from "../../thincoder-core/tools/search.mjs"
import { manifestTool } from "../../thincoder-core/agent-tools/manifest.mjs"
import { batchTool } from "../../thincoder-core/agent-tools/batch.mjs"
import { ledgerTool } from "../../thincoder-core/ledger-tools.mjs"
const { _setLedgerDirForTest, _resetLedgerDirForTest, ledgerKey, ledgerAdd, ledgerUpdate, ledgerClose, ledgerQuery } =
  await import("../../thincoder-core/ledger.mjs")

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..")
const SCRATCH = join(ROOT, ".thincoder/tmp")
const ledgerDir = mkdtempSync(join(SCRATCH, "lock-ledger-"))
_setLedgerDirForTest(ledgerDir)
const fixtures = []
after(() => {
  _resetLedgerDirForTest()
  for (const p of fixtures) rmSync(p, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 })
  rmSync(ledgerDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 })
})

const UUID = "11111111-1111-1111-1111-111111111111"
/** 夹具项目：`docRoot.batches` + 产品 / 工具 / 产物四类目录骨架。 */
function makeProject(tag) {
  mkdirSync(SCRATCH, { recursive: true })
  return makeProjectAt(mkdtempSync(join(SCRATCH, `lk-${tag}-`)))
}
/** 在指定目录造一个项目（「容器根里的子项目」那一形用——`mkdir` 已存在的父目录是幂等的）。 */
function makeProjectAt(root) {
  mkdirSync(root, { recursive: true })
  fixtures.push(root)
  writeFileSync(join(root, "PROJECT-MANIFEST.json"), JSON.stringify({ version: 1, docRoot: { batches: "docs/batches" } }, null, 2))
  for (const d of ["docs/batches", "scripts", "thincoder-core/agent", "thincoder-vscode/test", "thincoder-cli/dist", "test/integration", "node_modules/pkg", "vendor", "dist"]) {
    mkdirSync(join(root, d), { recursive: true })
  }
  return root
}
/** depth-0 父侧 agent（`designSlot` = 造/不造活设计槽——两道门的两态）。 */
function agentOf(root, { designSlot = true } = {}) {
  const agent = { cwd: root, planMode: false, autoApprove: true, config: { agent: { engineering: true } } }
  if (designSlot) agent._engDesignTokens = new Map([["fx1", `${UUID}:${Date.now() + 3600_000}`]])
  return agent
}
function toolMapOf(root) {
  return new Map([["write", writeTool], ["bash", bashTool], ["git", gitTool], ["grep", grepTool], ["manifest", manifestTool]])
}
async function run(agent, tools, name, args, depth = 0) {
  const [res] = await executeToolCalls(agent, tools, [{ name, id: "1", arguments: JSON.stringify(args) }], {}, depth)
  return res
}
const writeTo = (agent, path, content = "x\n") => run(agent, toolMapOf(agent.cwd), "write", { path, content })
const openBatch = (root, name, extra = {}) => batchTool(null).execute({ action: "create", path: `docs/batches/${name}.md`, topic: name, source: "集成夹具", ...extra }, { depth: 0, agent: agentOf(root) })
/** 挂一条在途台账行：`ledger({action:"add"})` 建行 → `batch create{ledger:"#N"}` 接管（写门拒文点名的两步路线）。 */
async function hangLiveRow(root, name) {
  const added = JSON.parse(await ledgerTool.execute({ action: "add", title: `夹具行 · ${name}`, kind: "tech_todo" }, { depth: 0, agent: agentOf(root) }))
  await openBatch(root, name, { ledger: `#${added.id}` })
  return added.id
}
/** 已收口 ∧ §3 = 评审通过 的档面（核销机检 ② ③ 的唯一输入；`task_book` 指它才挂得出 `已核销` 行）。 */
function writeClosedRecord(root, rel = "docs/batches/gate-closed.md") {
  writeFileSync(join(root, rel), [
    "# gate-closed",
    "",
    "## §1 讨论（主 agent）",
    "**状态行**：已收口 2026-11-03",
    "",
    "## §3 设计评审（评审子代理）",
    "**状态行**：评审通过",
    "",
  ].join("\n"))
  return rel
}
/** 挂一条指定状态的行（迁移表逐边推进；`在途` / `待核销` 的行要有在场指针）。 */
function rowWithStatus(root, status) {
  const task_book = writeClosedRecord(root)
  const id = ledgerAdd({ cwd: root, row: { kind: "tech_todo", title: `夹具行 ${status}`, task_book }, boundary: root })
  const move = (to) => ledgerUpdate({ cwd: root, id, patch: { status: to }, boundary: root })
  if (status === "待讨论") return id
  if (status === "待设计") { move("待设计"); return id }
  move("在途")
  if (status === "在途") return id
  move("待核销")
  if (status === "待核销") return id
  if (status === "已核销") { ledgerClose({ cwd: root, id, status: "已核销", boundary: root, agent: {} }); return id }
  throw new Error(`rowWithStatus: unsupported ${status}`)
}
/** 仓夹具：init + 身份 + 暂存一个文件（夹具准备直走子进程）。 */
function makeRepo(root, file) {
  const git = (...args) => execFileSync("git", args, { cwd: root, stdio: "pipe" })
  if (!existsSync(join(root, ".git"))) git("init")
  git("config", "user.email", "rtm@example.test")
  git("config", "user.name", "rtm fixture")
  git("config", "commit.gpgsign", "false")
  writeFileSync(join(root, file), "one\n")
  git("add", file)
}
const hasCommit = (root) => {
  try { execFileSync("git", ["rev-parse", "--verify", "HEAD"], { cwd: root, stdio: "pipe" }); return true } catch { return false }
}

test("12-1 台账有在途行、本笔不传 ledger ⇒ 拒（§2.3 串 + 用法句），文件零改", async () => {
  const root = makeProject("12-1")
  const live = await hangLiveRow(root, "12-1-batch")
  const target = join(root, "thincoder-core/agent/x.mjs")
  const res = await writeTo(agentOf(root), target)
  assert.equal(res.ok, false)
  assert.match(res.result, /write refused — ledger row not bound: no ledger number on this call\./)
  assert.ok(res.result.includes('Pass project:'), "拒文点出项目输入（唯一教学面）")
  assert.ok(res.result.includes('ledger:"#N"'), "拒文点出台账号输入（两个输入一次点出）")
  assert.ok(res.result.includes(`In-flight rows in this project's ledger right now: #${live}`), "拒文列出本项目的可带号")
  assert.ok(res.result.includes('ledger({action:"add", title, kind, cwd:'), "拒文点名第一步：先挂台账行（带 cwd = 同一项目）")
  assert.ok(res.result.includes('batch({action:"create", ledger:"#N", topic, source})'), "拒文点名第二步：在行上开批档")
  assert.equal(existsSync(target), false, "文件零改")
})

test("12-2 带 ledger:\"#A\" 与 ledger:\"A\" 两形写同一目标 ⇒ 都照写（# 可省，两形同判）", async () => {
  const root = makeProject("12-2")
  const live = await hangLiveRow(root, "12-2-batch")
  const agent = agentOf(root)
  const doc = join(root, "docs/batches/note.md") // docRoot 内：面不参与判据
  const first = await run(agent, toolMapOf(root), "write", { path: doc, content: "# note\n", ledger: `#${live}` })
  assert.equal(first.ok, true, first.result)
  assert.equal(readFileSync(doc, "utf8"), "# note\n")
  const second = await run(agent, toolMapOf(root), "write", { path: doc, content: "# note 2\n", ledger: `${live}` })
  assert.equal(second.ok, true, second.result)
  assert.equal(readFileSync(doc, "utf8"), "# note 2\n", "同一号两形同判")
})

test("12-3 已核销 ∥ 不存在 ∥ 待讨论 三个号各写一笔 ⇒ 三拒，拒文分别点名，文件零改", async () => {
  const root = makeProject("12-3")
  const agent = agentOf(root)
  const target = join(root, "thincoder-core/agent/s.mjs")
  const archived = rowWithStatus(root, "已核销")
  const pending = rowWithStatus(root, "待讨论")
  const cases = [
    [archived, /is "已核销" — only a 在途 row carries writes/],
    [999999, /row #999999 does not exist in this project's ledger/],
    [pending, /is "待讨论" — only a 在途 row carries writes/],
  ]
  for (const [id, pattern] of cases) {
    const res = await run(agent, toolMapOf(root), "write", { path: target, content: "x\n", ledger: `#${id}` })
    assert.equal(res.ok, false, `#${id}`)
    assert.match(res.result, pattern, `#${id}`)
    assert.equal(existsSync(target), false, `#${id}：文件零改`)
  }
})

test("12-4 台账库不可读 ∥ 项目根 manifest 坏 JSON ⇒ 两态都拒，拒文带原始错误", async () => {
  const broken = makeProject("12-4a")
  mkdirSync(join(ledgerDir, `${ledgerKey(broken)}.db`), { recursive: true }) // 库位是目录 ⇒ 打不开
  const t1 = join(broken, "thincoder-core/agent/z.mjs")
  const res = await run(agentOf(broken), toolMapOf(broken), "write", { path: t1, content: "x\n", ledger: "#1" })
  assert.equal(res.ok, false)
  assert.match(res.result, /ledger row not bound/)
  assert.match(res.result, /\(ledger unreadable — /)
  assert.equal(existsSync(t1), false, "文件零改")

  // 第二态：根推得出而 manifest 不可用（坏 JSON）——不是出辖（出辖 = 祖先链推不出 manifest），照拒
  const bad = makeProject("12-4b")
  writeFileSync(join(bad, "PROJECT-MANIFEST.json"), '{ "version": 1,')
  const t2 = join(bad, "thincoder-core/agent/w.mjs")
  const res2 = await run(agentOf(bad), toolMapOf(bad), "write", { path: t2, content: "x\n", ledger: "#1" })
  assert.equal(res2.ok, false, "有根但不可用 ≠ 没根：照拒")
  assert.match(res2.result, /\(ledger unreadable — /)
  assert.equal(existsSync(t2), false, "文件零改")
})

test("12-5 判据点是目标路径本身：项目之外没有判据点 ⇒ 拒；仓内缺号 ⇒ 拒；project 指容器根 ⇒ 同拒", async () => {
  const root = makeProject("12-5")
  const outside = mkdtempSync(join(tmpdir(), "wg-out-")) // 仓外临时目录：祖先链无 manifest
  fixtures.push(outside)
  const agent = agentOf(root)
  const outFile = join(outside, "x.mjs")
  const out = await writeTo(agent, outFile, "export const ok = 1\n")
  assert.equal(out.ok, false, "项目之外没有判据点")
  assert.match(out.result, /declared project is not a project/)
  assert.equal(existsSync(outFile), false, "文件零改")
  const insideTarget = join(root, "test/integration/x.test.mjs")
  const res = await writeTo(agent, insideTarget)
  assert.equal(res.ok, false, "同一会话写仓内目标：没有号 ⇒ 拒")
  assert.match(res.result, /no ledger number on this call/)
  assert.equal(existsSync(insideTarget), false, "文件零改")
  // 容器根（夹具项目的父目录，自身无 manifest）作为声明 ⇒ 同拒：不是项目与不是这个项目是两种拒
  const containerRoot = dirname(root)
  const viaBash = await run(agent, toolMapOf(root), "bash", { command: "echo hi", project: containerRoot, ledger: "#1" })
  assert.equal(viaBash.ok, false)
  assert.match(viaBash.result, /declared project is not a project/)
  assert.doesNotMatch(viaBash.result, /\bhi\b/, "命令零执行")
})

test("12-6 搜索 / 索引面接名单单源：vendor · node_modules · dist 内的文件不再命中", async () => {
  const root = makeProject("12-6")
  const marker = "NEEDLE_MARKER_X9"
  writeFileSync(join(root, "vendor/needle.mjs"), `// ${marker}\n`)
  writeFileSync(join(root, "node_modules/pkg/needle.mjs"), `// ${marker}\n`)
  writeFileSync(join(root, "dist/needle.mjs"), `// ${marker}\n`)
  const ctx = { agent: { cwd: root }, cwd: root }
  const pruned = await grepTool.execute({ pattern: marker, path: root }, ctx)
  assert.equal(pruned, "(no matches)", "名单合并后 vendor / node_modules / dist 都被剪")
  writeFileSync(join(root, "visible.txt"), `${marker}\n`) // 对照面：普通文件照常可搜
  const hit = await grepTool.execute({ pattern: marker, path: root }, ctx)
  assert.match(hit, /visible\.txt/)
  assert.doesNotMatch(hit, /needle\.mjs/)
})

test("12-7 bash：无在途行跑 git status ⇒ 拒、命令零执行；挂行后带号跑同一条 ⇒ 执行并回输出", async () => {
  const root = makeProject("12-7")
  makeRepo(root, "keep.txt")
  const agent = agentOf(root)
  const denied = await run(agent, toolMapOf(root), "bash", { command: "git status", project: root })
  assert.equal(denied.ok, false, "只读命令与写命令同判——不按命令内容分类")
  assert.match(denied.result, /no ledger number on this call/)
  assert.doesNotMatch(denied.result, /On branch|No commits yet/, "命令零执行、无输出")

  const live = rowWithStatus(root, "在途")
  const ok = await run(agent, toolMapOf(root), "bash", { command: "git status", project: root, ledger: `#${live}` })
  assert.equal(ok.ok, true, ok.result)
  assert.match(ok.result, /On branch|No commits yet/, "带号即执行并回输出")
})

test("12-8 子代理（depth > 0）不带号 ∥ 带号写同一目标 ⇒ 本门不拒（号来自绑定批档档头）", async () => {
  const root = makeProject("12-8")
  const child = {
    cwd: root, planMode: false, autoApprove: true, config: { agent: { engineering: true } },
    _role: "eng-coder", _engDesignReviewed: true, _engTaskAuthorized: true,
  }
  const noNumber = join(root, "thincoder-core/agent/k1.mjs")
  const first = await run(child, toolMapOf(root), "write", { path: noNumber, content: "x\n" }, 1)
  assert.equal(first.ok, true, `子代理不带号：本门不核（拒因若现只来自它自己的 token 门）— ${first.result}`)
  const withNumber = join(root, "thincoder-core/agent/k2.mjs")
  const second = await run(child, toolMapOf(root), "write", { path: withNumber, content: "x\n", ledger: "#999999" }, 1)
  assert.equal(second.ok, true, "子代理带一个不存在的号：本门也不核")
})

test("12-9 git 写型 action：无在途号 commit ⇒ 拒、仓库零动；带在途号同笔 ⇒ 提交生效", async () => {
  const root = makeProject("12-9")
  makeRepo(root, "a.txt")
  const agent = agentOf(root)
  const denied = await run(agent, toolMapOf(root), "git", { action: "commit", message: "rtm probe", path: "a.txt" })
  assert.equal(denied.ok, false)
  assert.match(denied.result, /no ledger number on this call/)
  assert.equal(hasCommit(root), false, "仓库零动：无提交产生")

  const live = rowWithStatus(root, "在途")
  const ok = await run(agent, toolMapOf(root), "git", { action: "commit", message: "rtm probe", path: "a.txt", ledger: `#${live}` })
  assert.equal(ok.ok, true, ok.result)
  assert.equal(hasCommit(root), true, "提交生效")
  const log = await run(agent, toolMapOf(root), "git", { action: "log", count: 5 })
  assert.match(log.result, /rtm probe/)
})

test("12-10 git 只读 action：无在途号跑 git status ⇒ 照跑回输出", async () => {
  const root = makeProject("12-10")
  makeRepo(root, "a.txt")
  const status = await run(agentOf(root), toolMapOf(root), "git", { action: "status" })
  assert.equal(status.ok, true, status.result)
  assert.match(status.result, /Staged \(1\)/, "同一把工具两种判据：只读不要号")
  assert.equal(ledgerQuery({ cwd: root, boundary: root }).length, 0, "本夹具台账里确实没有任何行")
})

test("12-11 git 的根 = path ∥ workdir：号必须在目标项目的账上", async () => {
  const a = makeProject("12-11a")
  const b = makeProject("12-11b")
  makeRepo(a, "a.txt")
  makeRepo(b, "b.txt")
  const liveA = rowWithStatus(a, "在途")
  const agent = agentOf(a)
  const denied = await run(agent, toolMapOf(a), "git", { action: "commit", message: "wrong ledger", path: "b.txt", workdir: b, ledger: `#${liveA}` })
  assert.equal(denied.ok, false, "号看目标项目的账，不是会话的账")
  assert.match(denied.result, new RegExp(`row #${liveA} does not exist in this project's ledger`))
  assert.equal(hasCommit(b), false, "目标仓零动")

  const liveB = rowWithStatus(b, "在途")
  const ok = await run(agent, toolMapOf(a), "git", { action: "commit", message: "right ledger", path: "b.txt", workdir: b, ledger: `#${liveB}` })
  assert.equal(ok.ok, true, ok.result)
  assert.match((await run(agent, toolMapOf(a), "git", { action: "log", workdir: b })).result, /right ledger/, "换成目标仓的在途号 ⇒ 放行")
})

test("12-12 会话 cwd = 容器根：不带 project ⇒ 拒、命令零执行；带 project 仍缺号 ⇒ 拒；带 project + 在途号 ⇒ 执行", async () => {
  mkdirSync(SCRATCH, { recursive: true })
  const container = mkdtempSync(join(SCRATCH, "lk-container-12-12-"))
  fixtures.push(container)
  makeRepo(container, "keep.txt") // 让 `git status` 在容器根有可跑的面（不含 manifest——容器根本不是项目）
  const proj = makeProjectAt(join(container, "proj"))
  const agent = agentOf(container)
  const tools = toolMapOf(container)

  const noProject = await run(agent, tools, "bash", { command: "git status" })
  assert.equal(noProject.ok, false, "bash 没有定位参数 ⇒ 判据点只能靠声明（会话锚永不充当判据点）")
  assert.match(noProject.result, /no project on this call/)
  assert.match(noProject.result, /Pass project:/, "拒文点出项目输入")
  assert.match(noProject.result, /ledger:"#N"/, "拒文点出台账号输入")
  assert.match(noProject.result, /In-flight rows in this project's ledger right now: unknown/, "无项目时清单位不写 none（那是另一句话）")
  assert.doesNotMatch(noProject.result, /On branch/, "命令零执行")

  const noNumber = await run(agent, tools, "bash", { command: "git status", project: proj })
  assert.equal(noNumber.ok, false, "声明补位后仍缺号")
  assert.match(noNumber.result, /no ledger number on this call/)

  const live = rowWithStatus(proj, "在途")
  const exec = await run(agent, tools, "bash", { command: "git status", project: proj, ledger: `#${live}` })
  assert.equal(exec.ok, true, exec.result)
  assert.match(exec.result, /On branch/, "执行并回输出")

  // `memory` 落 project 层：不带 project ⇒ 拒（execute 不被调用——stub 只用于撞门）
  const memoryStub = { name: "memory", parameters: { type: "object", properties: { action: { type: "string" } }, required: ["action"] }, readonly: false, async execute() { throw new Error("gate did not deny — memory execute must not run") } }
  const memoryTools = new Map([["memory", memoryStub]])
  const memoryDenied = await run(agent, memoryTools, "memory", { action: "put", layer: "project", title: "t", content: "c" })
  assert.equal(memoryDenied.ok, false)
  assert.match(memoryDenied.result, /no project on this call/)
  assert.equal(existsSync(join(proj, ".thincoder/memory")), false, "项目内 memory 目录零写")
})

test("12-13 项目声明与台账对不上：声明容器根 ⇒ 不是项目；声明 A、号取自 B ⇒ 号不在这个项目的账上", async () => {
  mkdirSync(SCRATCH, { recursive: true })
  const container = mkdtempSync(join(SCRATCH, "lk-container-12-13-"))
  fixtures.push(container)
  const projA = makeProjectAt(join(container, "A"))
  const projB = makeProjectAt(join(container, "B"))
  const agent = agentOf(container)
  const tools = toolMapOf(container)

  const liveA = rowWithStatus(projA, "在途")
  const notAProject = await run(agent, tools, "bash", { command: "echo hi", project: container, ledger: `#${liveA}` })
  assert.equal(notAProject.ok, false)
  assert.match(notAProject.result, /declared project is not a project/, "容器根自身无 manifest ⇒ 不是项目")
  assert.match(notAProject.result, /Pass project:/, "拒文同时点出 project")
  assert.match(notAProject.result, /ledger:"#N"/, "拒文同时点出 ledger")
  assert.doesNotMatch(notAProject.result, /\bhi\b/, "命令零执行")

  // 台账按项目根分库 ⇒ 两边各自从 #1 起算；先把 B 的号推到 A 的号之外，测的才是「号不在这个账上」
  for (let i = 0; i < 5; i++) ledgerAdd({ cwd: projB, row: { kind: "tech_todo", title: `垫号 ${i}` }, boundary: projB })
  const liveBFar = rowWithStatus(projB, "在途")
  assert.notEqual(liveBFar, liveA, "夹具：两个号不同（否则测的是同一个号）")
  const wrongLedger = await run(agent, tools, "bash", { command: "echo hi", project: projA, ledger: `#${liveBFar}` })
  assert.equal(wrongLedger.ok, false)
  assert.match(wrongLedger.result, /does not exist in this project's ledger/, "号只在其所属项目的账上成立")
  assert.match(wrongLedger.result, /Pass project:/)
})

test("12-14 会话 cwd = 项目子目录：声明项目根 + 在途号 ⇒ 放行（声明根含会话锚）；不带 project ⇒ 拒", async () => {
  mkdirSync(SCRATCH, { recursive: true })
  const proj = makeProjectAt(mkdtempSync(join(SCRATCH, "lk-sub-12-14-")))
  makeRepo(proj, "keep.txt")
  const sub = join(proj, "thincoder-cli") // 启动形：cd thincoder/thincoder-cli && node bin/thincoder.cjs
  const agent = agentOf(sub)
  const tools = toolMapOf(sub)
  const live = rowWithStatus(proj, "在途")

  const ok = await run(agent, tools, "bash", { command: "git status", project: proj, ledger: `#${live}` })
  assert.equal(ok.ok, true, ok.result)
  assert.match(ok.result, /On branch/, "声明根含会话锚 ⇒ (a) 支放行，命令执行并回输出")

  const noProject = await run(agent, tools, "bash", { command: "git status", ledger: `#${live}` })
  assert.equal(noProject.ok, false, "同一会话不带 project ⇒ 拒（会话锚不充当判据点）")
  assert.match(noProject.result, /no project on this call/)
  assert.doesNotMatch(noProject.result, /On branch/, "命令零执行")
})

test("12-15 manifest init 取根豁免（决策 43）：仓外自举不进本门照跑落盘；项目内子目录不带号拒、带号门过后工具拒（init never overwrites）", async () => {
  mkdirSync(SCRATCH, { recursive: true })
  const proj = makeProjectAt(mkdtempSync(join(SCRATCH, "lk-init-12-15-")))
  const agent = agentOf(proj)
  const tools = toolMapOf(proj)

  // 格 1：target 祖先链无 manifest（仓外临时目录）⇒ 不进本门，PROJECT-MANIFEST.json 落盘在 target
  const outside = mkdtempSync(join(tmpdir(), "lk-init-12-15-out-"))
  fixtures.push(outside)
  const bare = await run(agent, tools, "manifest", { action: "init", target: outside })
  assert.equal(bare.ok, true, "台账无在途行的自举 init ⇒ 门不拦（不进本门）", bare.result)
  assert.match(String(bare.result), /manifest init: created default manifest/)
  assert.equal(existsSync(join(outside, "PROJECT-MANIFEST.json")), true, "PROJECT-MANIFEST.json 落盘在 target")

  // 格 2：同一会话 target 换成既有项目内子目录、仍不带号 ⇒ 本门照判，拒（no ledger number on this call）
  const sub = join(proj, "sub")
  mkdirSync(sub, { recursive: true })
  const noNumber = await run(agent, tools, "manifest", { action: "init", target: sub })
  assert.equal(noNumber.ok, false, "既有项目内的子目录自举 ⇒ 本门照判（要号）")
  assert.match(String(noNumber.result), /no ledger number on this call/)

  // 格 3：带本仓在途号跑同一笔 ⇒ 门过后由工具自身拒（落点解析到祖先项目根），项目 manifest 字节零改
  const live = rowWithStatus(proj, "在途")
  const before = readFileSync(join(proj, "PROJECT-MANIFEST.json"), "utf8")
  const withNumber = await run(agent, tools, "manifest", { action: "init", target: sub, ledger: `#${live}` })
  assert.equal(withNumber.ok, false, "门过后由工具自身拒")
  assert.match(String(withNumber.result), /init never overwrites/, "拒文 = 工具自身那句（落点解析到祖先项目根）")
  assert.doesNotMatch(String(withNumber.result), /ledger row not bound/, "不是本门拒文")
  assert.equal(readFileSync(join(proj, "PROJECT-MANIFEST.json"), "utf8"), before, "项目 manifest 字节零改")
  assert.equal(existsSync(join(sub, "PROJECT-MANIFEST.json")), false, "子目录零建档")
})

