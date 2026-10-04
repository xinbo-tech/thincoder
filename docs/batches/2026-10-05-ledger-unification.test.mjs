/**
 * 2026-10-05-ledger-unification.test.mjs — 台账工具统一入口批 · 批次本地单元件（随批留存归档）。
 * 名随批次档 · 住批次目录 · 不进仓套件；复跑 = 从仓库根 `thincoder/`：
 *   node --test docs/batches/2026-10-05-ledger-unification.test.mjs
 *
 * 腿（本批设计档 §11.6 五腿；用例 T77–T91 = §11.11）：
 *   腿 1 等价（T77–T82）：五 action 出参 = 旧核函数直调 / 原工具路径逐字（双侧同形夹具对拍）
 *   腿 2 弃用壳（T86/T87）：五旧名 execute ⇒ 抛 + 判据（含旧名 ∧ 含 `ledger` ∧ 对应 action 指引）+ 零库动作
 *   腿 3 守卫逐 action 文案（T84/T85/T89/T90/T91）：动作级前缀 `ledger(<action>)：`（P3/P5/P2/P4/P6）
 *   腿 4 入口级判（T83/T88）：`ledger：` 前缀（action 非法 / 缺失）
 *   腿 5 装配名集（§11.1 机械判据）：depth-0 ∥ depth>0 两形——恰一名 `ledger` ∧ 与五旧名零交 ∧ 面内零重名
 *        （VSC 自持点 = 源面锁——端壳静态链经 `vscode` 宿主，node 下不可加载）
 *
 * 夹具：`_setLedgerDirForTest` 临时目录（不碰真实用户目录）；项目夹具带 PROJECT-MANIFEST.json
 * （归属解析确定——同先例 mkProject 形）。模块以命名空间引用（非静态解构）——实施轮前红读面
 * 缺导出时逐腿失败而非整档加载崩（本档同时充当 T77–T91 的负控读数载体）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-core"))) throw new Error(`从仓库根（thincoder/）运行（cwd = ${ROOT}）`)
const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)
const read = (rel) => readFileSync(resolve(ROOT, rel), "utf8")

// 命名空间引用（红读面：缺导出 ⇒ 逐腿失败，不整档崩）
const toolsMod = await mod("thincoder-core/ledger-tools.mjs")
const cmdMod = await mod("thincoder-core/ledger-cmd.mjs")
const dbMod = await mod("thincoder-core/ledger-db.mjs")
const sessionSlots = await mod("thincoder-core/session-slots.mjs")
const familyMod = await mod("thincoder-core/agent/family-tools.mjs")
const indexMod = await mod("thincoder-core/tools/index.mjs")

const OLD_NAMES = ["ledger_add", "ledger_update", "ledger_close", "ledger_query", "ledger_count"]
const FULL_ACTIONS = ["add", "update", "close", "query", "count"]
const READ_ACTIONS = ["query", "count"]

// ── 夹具（临时台账目录 + 项目）─────────────────────────────────────────────────
const created = []
const tmpBase = (tag) => { const d = mkdtempSync(join(tmpdir(), `lu-${tag}-`)); created.push(d); return d }
test.after(() => { for (const d of created.splice(0)) rmSync(d, { recursive: true, force: true }) })

dbMod._setLedgerDirForTest(join(tmpBase("ledger-root"), "ledger"))
test.after(() => dbMod._resetLedgerDirForTest())

/** 项目夹具（PROJECT-MANIFEST.json 在场 ⇒ 归属解析确定；docs/batches/task.md = 写门指针靶）。 */
function mkProject(base, name) {
  const dir = join(base, name)
  mkdirSync(join(dir, "docs", "batches"), { recursive: true })
  writeFileSync(join(dir, "PROJECT-MANIFEST.json"), JSON.stringify({ version: 1, phase: "initial-dev" }, null, 2))
  writeFileSync(join(dir, "docs", "batches", "task.md"), "# 任务书夹具\n\n## §1 占位\n")
  return dir
}

/** 统一入口调用（ctx.cwd = 项目根——避开 process.cwd 兜底）。 */
const call = (tool, args, cwd) => tool.execute(args, { cwd })

// ── 腿 1 · 双侧同形夹具（U = 统一入口路 ∥ E = 旧核直调对照路）────────────────────
const leg1 = (() => {
  const U = mkProject(tmpBase("leg1-u"), "proj-u")
  const E = mkProject(tmpBase("leg1-e"), "proj-e")
  for (const p of [U, E]) {
    cmdMod.ledgerAdd({ cwd: p, row: { kind: "requirement", title: "需求一", evidence: "e" } }) // id 1
    cmdMod.ledgerAdd({ cwd: p, row: { kind: "tech_todo", title: "待办一" } })                  // id 2
    cmdMod.ledgerUpdate({ cwd: p, id: 2, patch: { status: "待设计" }, executorSessionId: null })
    cmdMod.ledgerUpdate({ cwd: p, id: 2, patch: { status: "在途", task_book: "docs/batches/task.md§1" }, executorSessionId: sessionSlots.getSessionId() })
  }
  return { U, E }
})()

// （用例定义序 = 执行序：T80 → T77 → T78 → T79 → T81 → T82 —— 台账状态逐步推进）

test("T80 · add 出参 = 旧工具路径逐字（守卫锚：action 已消费——余键进守卫）", async () => {
  const out = await call(toolsMod.ledgerTool, { action: "add", kind: "tech_todo", title: "待办二" }, leg1.U)
  const exp = JSON.stringify({ id: cmdMod.ledgerAdd({ cwd: leg1.E, row: { kind: "tech_todo", title: "待办二" } }), status: "待讨论" })
  assert.equal(out, exp, "add 出参逐字等价")
  assert.deepEqual(JSON.parse(out), { id: 3, status: "待讨论" }, "id = 3（两侧同形种子）")
})

test("T77 · query 零过滤 = 核 ledgerQuery 直调逐字", async () => {
  const out = await call(toolsMod.ledgerTool, { action: "query" }, leg1.U)
  assert.equal(out, JSON.stringify(cmdMod.ledgerQuery({ cwd: leg1.U }), null, 2), "出参逐字等价（核直调）")
  assert.deepEqual(JSON.parse(out).map((r) => r.id), [1, 2, 3], "行集 = 全量三行")
})

test("T78 · query 带过滤 = 同原在途行集", async () => {
  const out = await call(toolsMod.ledgerTool, { action: "query", status: "在途" }, leg1.U)
  assert.equal(out, JSON.stringify(cmdMod.ledgerQuery({ cwd: leg1.U, status: "在途" }), null, 2), "出参逐字等价")
  assert.deepEqual(JSON.parse(out).map((r) => r.id), [2], "过滤 = 在途行集")
})

test("T79 · count = 核 ledgerCount 直调逐字", async () => {
  const out = await call(toolsMod.ledgerTool, { action: "count" }, leg1.U)
  assert.equal(out, JSON.stringify({ count: cmdMod.ledgerCount({ cwd: leg1.U }) }), "出参逐字等价")
  assert.equal(JSON.parse(out).count, 3, "未决四态计数 = 3")
})

test("T81 · update 出参 = 旧工具路径逐字", async () => {
  const out = await call(toolsMod.ledgerTool, { action: "update", id: 1, status: "待设计" }, leg1.U)
  const exp = JSON.stringify(cmdMod.ledgerUpdate({ cwd: leg1.E, id: 1, patch: { status: "待设计" }, executorSessionId: sessionSlots.getSessionId() }))
  assert.equal(out, exp, "update 出参逐字等价")
  assert.equal(cmdMod.ledgerQuery({ cwd: leg1.U }).find((r) => r.id === 1).status, "待设计", "U 侧行态确已迁移（真写）")
})

test("T82 · close 出参 = 旧工具路径逐字", async () => {
  const out = await call(toolsMod.ledgerTool, { action: "close", id: 1, status: "已核销" }, leg1.U)
  const exp = JSON.stringify(cmdMod.ledgerClose({ cwd: leg1.E, id: 1, status: "已核销" }))
  assert.equal(out, exp, "close 出参逐字等价")
  assert.equal(cmdMod.ledgerQuery({ cwd: leg1.U }).find((r) => r.id === 1).status, "已核销", "U 侧行态确已核销（真写）")
})

// ── 腿 2 · 弃用壳（T86/T87 五名全查）──────────────────────────────────────────
test("T86/T87 · 弃用壳：五旧名 execute ⇒ 抛 + 判据 + 零库动作", async () => {
  const P = mkProject(tmpBase("shell"), "proj-shell")
  const cases = [
    ["ledgerAddTool", "ledger_add", "add", { kind: "requirement", title: "不落库" }],
    ["ledgerUpdateTool", "ledger_update", "update", { id: 1, status: "待设计" }],
    ["ledgerCloseTool", "ledger_close", "close", { id: 1, status: "已废弃" }],
    ["ledgerQueryTool", "ledger_query", "query", {}],
    ["ledgerCountTool", "ledger_count", "count", {}],
  ]
  for (const [exportName, oldName, action, args] of cases) {
    const shell = toolsMod[exportName]
    assert.equal(typeof shell?.execute, "function", `${exportName} 壳在场`)
    const desc = String(shell.description ?? "")
    assert.ok(desc.includes(oldName), `${oldName} 壳 description 含旧名（静态弃用行）`)
    let msg = null
    try { await call(shell, args, P) } catch (e) { msg = String(e?.message ?? e) }
    assert.ok(msg !== null, `${oldName} 壳应抛弃用错误`)
    assert.ok(msg.includes(oldName), `弃用文案含旧名：${msg}`)
    assert.ok(msg.includes("ledger"), `弃用文案含统一入口名：${msg}`)
    assert.ok(msg.includes(`"${action}"`), `弃用文案含对应 action 指引：${msg}`)
  }
  assert.equal(cmdMod.ledgerCount({ cwd: P }), 0, "零库动作（计数 0）")
  assert.deepEqual(cmdMod.ledgerQuery({ cwd: P }), [], "零库动作（零行）")
})

// ── 腿 3 · 守卫逐 action 文案（动作级前缀）────────────────────────────────────
test("T84 · add 缺必填 ⇒ ledger(add)：kind 缺失（余键 {} 入伪工具——§11.3）", async () => {
  await assert.rejects(call(toolsMod.ledgerTool, { action: "add" }, leg1.U),
    { message: "ledger(add)：kind 缺失（必填；取值 ∈ {requirement, tech_todo}）" })
})

test("T85 · query 枚举外值 ⇒ ledger(query)：status 非法（P5）", async () => {
  await assert.rejects(call(toolsMod.ledgerTool, { action: "query", status: "invalid" }, leg1.U),
    { message: 'ledger(query)：status 非法："invalid"（取值 ∈ {待讨论, 待设计, 在途, 待核销, 已核销, 已废弃}）' })
})

test("T89 · P2 未知键：action 不入未知列（已消费——§11.3 缝钉死）", async () => {
  await assert.rejects(call(toolsMod.ledgerTool, { action: "add", kind: "requirement", title: "x", knd: "y" }, leg1.U),
    { message: "ledger(add)：未知参数：knd（可用参数 = cwd / kind / title / board / req_doc / task_book / evidence / trigger）" })
})

test("T90 · 错型 ⇒ ledger(update)：id 非法（P4）", async () => {
  await assert.rejects(call(toolsMod.ledgerTool, { action: "update", id: "1" }, leg1.U),
    { message: 'ledger(update)：id 非法："1"（应为数字）' })
})

test("T91 · title 空 / 全空白 ⇒ ledger(add)：title 为空（P6）", async () => {
  await assert.rejects(call(toolsMod.ledgerTool, { action: "add", kind: "requirement", title: "  " }, leg1.U),
    { message: "ledger(add)：title 为空（必填；非空字符串）" })
})

test("腿 3 补 · 逐 action 缺参 / 入口级 P1（§11.6 腿 3 散文面）", async () => {
  const cases = [
    [{ action: "update" }, "ledger(update)：id 缺失（必填）"],
    [{ action: "close" }, "ledger(close)：id 缺失（必填）"],
    [{ action: "close", id: 1 }, "ledger(close)：status 缺失（必填；取值 ∈ {已核销, 已废弃}）"],
    [{ action: "query", kind: "x" }, 'ledger(query)：kind 非法："x"（取值 ∈ {requirement, tech_todo}）'],
  ]
  for (const [args, msg] of cases) await assert.rejects(call(toolsMod.ledgerTool, args, leg1.U), { message: msg })
  await assert.rejects(call(toolsMod.ledgerTool, 5, leg1.U), { message: "ledger：参数须为对象（收到 5）" })
  await assert.rejects(call(toolsMod.ledgerTool, [], leg1.U), { message: "ledger：参数须为对象（收到 []）" })
})

// ── 腿 4 · 入口级判（T83/T88）────────────────────────────────────────────────
test("T83 · 未知 action ⇒ 入口级 P5 文案", async () => {
  await assert.rejects(call(toolsMod.ledgerTool, { action: "foo" }, leg1.U),
    { message: 'ledger：action 非法："foo"（取值 ∈ {add, update, close, query, count}）' })
})

test("T88 · action 缺失 ⇒ 入口级 P3 文案", async () => {
  await assert.rejects(call(toolsMod.ledgerTool, {}, leg1.U),
    { message: "ledger：action 缺失（必填；取值 ∈ {add, update, close, query, count}）" })
})

// ── 腿 5 · 装配名集（§11.1 机械判据；VSC 点 = 源面锁）────────────────────────────
function assertFace(names, where) {
  assert.equal(names.filter((n) => n === "ledger").length, 1, `${where}：恰一名 ledger`)
  assert.deepEqual(names.filter((n) => OLD_NAMES.includes(n)), [], `${where}：与五旧名零交`)
  assert.equal(new Set(names).size, names.length, `${where}：面内零重名`)
}

test("腿 5a · depth-0：基础集零台账名 ∥ 家族段恰一名 ledger（全量形——五 action）", async () => {
  const base = await indexMod.assembleBuiltinTools({ memory: null, cwd: ROOT, model: null })
  assert.deepEqual(base.map((t) => t.name).filter((n) => n === "ledger" || OLD_NAMES.includes(n)), [],
    "基础集零台账工具名（读二已移除——§11.1 ①）")
  for (const engineering of [false, true]) {
    const family = await familyMod.assembleFamilyTools({ depth: 0, engineering, consultModels: [] })
    assertFace([...base, ...family].map((t) => t.name), `depth-0（engineering=${engineering}）`)
    const t = family.find((x) => x.name === "ledger")
    assert.deepEqual(t.parameters.properties.action.enum, FULL_ACTIONS, "全量变体 action 枚举 = 五值")
    assert.equal(t.readonly, false, "全量变体 readonly:false（写面在内）")
    assert.equal(t.isReadonlyAction?.({ action: "query" }), true, "动作级分类：query 归只读（planMode 放行 / 免审批）")
    assert.equal(t.isReadonlyAction?.({ action: "count" }), true, "动作级分类：count 归只读")
    assert.equal(t.isReadonlyAction?.({ action: "add" }), false, "动作级分类：写面不归只读")
  }
})

test("腿 5b · depth>0：全部角色段恰一名 ledger（只读形——action 仅 query/count）", async () => {
  const base = await indexMod.assembleBuiltinTools({ memory: null, cwd: ROOT, model: null })
  const roles = [["eng-coder", true], ["eng-designer", true], ["coder", false], ["consult", false], ["explore", false], [null, false]]
  for (const [role, engineering] of roles) {
    const family = await familyMod.assembleFamilyTools({ depth: 1, role, engineering, consultModels: [], batchDoc: null })
    assertFace([...base, ...family].map((t) => t.name), `depth>0（role=${role ?? "fallback"}）`)
    const t = family.find((x) => x.name === "ledger")
    assert.deepEqual(t.parameters.properties.action.enum, READ_ACTIONS, "只读变体 action 枚举 = {query, count}（写三 schema 级不可达）")
    assert.equal(t.readonly, true, "只读变体 readonly:true（旧读二同分类）")
  }
})

test("腿 5c · VSC 端侧自持点清零（源面锁——§11.1 ③）", () => {
  const src = read("thincoder-vscode/src/agent/tool-table.mjs")
  assert.equal(/ledgerQueryTool|ledgerCountTool|ledgerTool|ledgerReadTool|ledger_add|ledger_update|ledger_close|ledger_query|ledger_count/.test(src), false,
    "端侧零台账工具名（读二移除）")
  assert.equal(src.includes("@thincoder/core/ledger.mjs"), false, "端侧零 ledger 链 import")
})
