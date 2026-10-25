/**
 * project-root-single-source.test.mjs —— 一次性单测（PR-1 … PR-16）：项目根解析「判据本体真单源 +
 * 不向下取根」。用例本体 = `docs/core/design/LEDGER.md` §3.8「用例表」；契约面 = `docs/core/design/MANIFEST.md`
 * §2.2（`projectRootView` / `owningProject` / `resolveProjectRoot` 薄委托）。
 *
 * 零留档：随批建 / 跑 / 删（台账 #1795）。靶向单跑 =
 * `node --test thincoder-core/test/project-root-single-source.test.mjs`
 *
 * 两面两界（本档的读法）：取根面（`projectRootView` / `resolveProjectRoot`）的界 = 目标所在盘根；
 * 台账面（`resolveLedgerRoot`）的界 = 会话锚。PR-6 要三入口「同一判据」，故本档把**进程 cwd 落在夹具根**
 * （= 台账面的会话锚——单参形态即可逐例等价）；未落则界落本仓根，夹具在外 ⇒ 恒无根，等式不检验任何东西。
 *
 * PR-11（读面 `query` / `count` 无根由空集改抛）不在本批改动面（`ledger-cmd.mjs` 零改），故不列；
 * PR-14（`findGuideRoot`）不消费本批任何改动符号，同不列。
 */
import { test, after } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, parse, resolve } from "node:path"

import { _resetProjectRootForTest, _setProjectRootForTest, owningProject, projectRootView, resolveProjectRoot } from "../manifest.mjs"
import { _resetLedgerDirForTest, _setLedgerDirForTest, ledgerKey, openLedger, resolveLedgerRoot } from "../ledger-db.mjs"
import { findProject, discoverFamily } from "../ledger.mjs"
import { ledgerQuery } from "../ledger-cmd.mjs"
import { ledgerTool } from "../ledger-tools.mjs"
import { manifestTool } from "../agent-tools/manifest.mjs"

const ROOT = mkdtempSync(join(tmpdir(), "prss-"))
const SAVED_CWD = process.cwd()
process.chdir(ROOT) // 会话锚 = 夹具根（台账面的界）——PR-6 / PR-9 / PR-10 的单参形态靠它

after(() => { process.chdir(SAVED_CWD); rmSync(ROOT, { recursive: true, force: true }) })

const MANIFEST = JSON.stringify({ version: 1, phase: "initial-dev" }, null, 2)
const mk = (...segs) => { const p = join(ROOT, ...segs); mkdirSync(p, { recursive: true }); return p }
const withManifest = (dir) => { writeFileSync(join(dir, "PROJECT-MANIFEST.json"), MANIFEST); return dir }

// 夹具前置：夹具根之上没有项目档（否则「祖链无档 ⇒ null」诸格假红）；ROOT 自身无档。
assert.equal(owningProject(ROOT, parse(ROOT).root), null, "夹具前置：ROOT 及其祖先无项目档")

const proj = withManifest(mk("proj"))                      // 项目根
mk("proj", "inner")                                        // 项目内不带档子目录
writeFileSync(join(proj, "doc.md"), "# doc\n")             // 项目内文件
const outer = withManifest(mk("outer"))                    // 外层项目
const sub = withManifest(mk("outer", "sub"))               // 嵌套子项目（近者优先）
writeFileSync(join(sub, "x.md"), "# x\n")
const c1 = mk("c1"); withManifest(mk("c1", "only"))        // 容器 + 恰一带档子目录
const c2 = mk("c2"); withManifest(mk("c2", "pa")); withManifest(mk("c2", "pb")) // 工作区（≥2）
const empty = mk("empty"); mk("empty", "deep")             // 全树无档
const bare = mk("bare"); mk("bare", "repo", ".git")        // 容器 + 恰一裸仓（无档）
const ws = mk("ws"); withManifest(mk("ws", "w1")); withManifest(mk("ws", "w2")) // PR-13 工作区锚

const fiveTargets = [
  join(proj, "doc.md"),      // PR-1 —— 项目内文件
  join(sub, "x.md"),         // PR-2 —— 嵌套子项目内
  c1,                        // PR-3 —— 容器 + 恰一带档子目录
  c2,                        // PR-4 —— 工作区
  join(empty, "deep"),       // PR-5 —— 全树无档
]

test("PR-1 目标 = 项目内文件 ⇒ ok ∧ root = 项目根（子目录归到自己的项目根）", () => {
  assert.deepEqual(projectRootView(join(proj, "doc.md")), { state: "ok", root: resolve(proj), candidates: [] })
  assert.equal(resolveProjectRoot(join(proj, "inner")), resolve(proj), "项目内不带档子目录 ⇒ 最近带档祖先")
  // A6：`basis` 逐字如旧（含文件目标 ⇒ 其所在目录）
  assert.equal(resolveLedgerRoot(proj)?.basis, "self", "目标自身即带档目录 ⇒ self")
  assert.equal(resolveLedgerRoot(join(proj, "inner"))?.basis, "ancestor", "内层子目录 ⇒ ancestor")
  assert.equal(resolveLedgerRoot(join(proj, "doc.md"))?.basis, "ancestor", "文件目标 ⇒ 其所在目录（≠ 起点）")
})

test("PR-2 外层带档 ∧ 子目录带档，目标在子项目内 ⇒ root = 子项目根（近者优先）", () => {
  assert.deepEqual(projectRootView(join(sub, "x.md")), { state: "ok", root: resolve(sub), candidates: [] })
})

test("PR-3 容器无档 ∧ 恰一子目录带档 ⇒ none ∧ root = null（不向下取根）", () => {
  assert.deepEqual(projectRootView(c1), { state: "none", root: null, candidates: [] })
  assert.equal(resolveProjectRoot(c1), null, "薄委托逐格全等")
})

test("PR-4 容器无档 ∧ ≥2 子目录带档 ⇒ workspace ∧ 候选名序全列", () => {
  const view = projectRootView(c2)
  assert.equal(view.state, "workspace")
  assert.equal(view.root, null)
  assert.deepEqual(view.candidates, [resolve(join(c2, "pa")), resolve(join(c2, "pb"))])
})

test("PR-5 全树无档 ⇒ none ∧ root = null（上溯到盘根停，不抛）", () => {
  assert.deepEqual(projectRootView(join(empty, "deep")), { state: "none", root: null, candidates: [] })
})

test("PR-6 三入口同一判据本体（PR-1–PR-5 逐例等价）", () => {
  for (const t of fiveTargets) {
    const view = projectRootView(t)
    assert.equal(resolveProjectRoot(t), view.root, `薄委托：${t}`)
    assert.equal(resolveLedgerRoot(t)?.root ?? null, view.root, `台账面同判据：${t}`)
  }
})

test("PR-7 台账 · resolveLedgerRoot(容器 + 恰一子目录) ⇒ null（不取子目录）", () => {
  assert.equal(resolveLedgerRoot(c1), null)
})

test("PR-8 台账 · 写面无根 ⇒ 抛（含起点 + 候选），夹具台账目录零 .db", async () => {
  const ledgerDir = mk("ledgerdb8")
  _setLedgerDirForTest(ledgerDir)
  try {
    let msg = null
    try { openLedger(c2, { create: true }) } catch (e) { msg = e.message }
    assert.ok(msg, "写面无根 ⇒ 抛（fail-loud、零落盘）")
    assert.match(msg, /未能推导项目根/)
    assert.ok(msg.includes(resolve(c2)), `文案含起点，实际：${msg}`)
    assert.match(msg, /下辖候选项目/)
    assert.ok(msg.includes(resolve(join(c2, "pa"))) && msg.includes(resolve(join(c2, "pb"))), `候选名序全列，实际：${msg}`)
    // 工具面同一路径（`ledger add` → `ledgerAdd` → `openLedger({create:true})`）——同样抛、零建库
    let toolMsg = null
    try { await ledgerTool.execute({ action: "add", kind: "tech_todo", title: "PR-8 行" }, { agent: { cwd: c2 } }) } catch (e) { toolMsg = e.message }
    assert.match(String(toolMsg), /未能推导项目根/, "工具面无根不静默")
    assert.deepEqual(readdirSync(ledgerDir), [], "零建库")
  } finally { _resetLedgerDirForTest() }
})

test("PR-9 台账 · 起点 = 指针（锚 = 容器，task_book = B 项目内绝对路径）⇒ 行落 B 键控库", async () => {
  const ledgerDir = mk("ledgerdb9")
  _setLedgerDirForTest(ledgerDir)
  try {
    const docB = join(proj, "b.md")
    writeFileSync(docB, "# b\n")
    const out = JSON.parse(await ledgerTool.execute(
      { action: "add", kind: "tech_todo", title: "PR-9 行", task_book: docB },
      { agent: { cwd: c1 } },
    ))
    assert.equal(typeof out.id, "number", "写入成行")
    assert.ok(existsSync(join(ledgerDir, `${ledgerKey(resolve(proj))}.db`)), "行落 B 键控库")
    assert.equal(existsSync(join(ledgerDir, `${ledgerKey(resolve(c1))}.db`)), false, "容器锚不建库")
    assert.equal(ledgerQuery({ cwd: proj }).length, 1, "B 面读得到该行")
  } finally { _resetLedgerDirForTest() }
})

test("PR-10 台账 · 显式 cwd 优先于指针 ⇒ 起点取 cwd 推出的项目", async () => {
  const ledgerDir = mk("ledgerdb10")
  _setLedgerDirForTest(ledgerDir)
  try {
    const docB = join(sub, "b10.md")
    writeFileSync(docB, "# b10\n")
    const out = JSON.parse(await ledgerTool.execute(
      { action: "add", kind: "tech_todo", title: "PR-10 行", cwd: proj, task_book: docB },
      { agent: { cwd: c1 } },
    ))
    assert.equal(typeof out.id, "number")
    assert.ok(existsSync(join(ledgerDir, `${ledgerKey(resolve(proj))}.db`)), "起点 = 显式 cwd（A 项目库）")
    assert.equal(existsSync(join(ledgerDir, `${ledgerKey(resolve(sub))}.db`)), false, "指针不夺起点")
  } finally { _resetLedgerDirForTest() }
})

test("PR-12 回归 · 容器锚：findProject = null ∧ 族发现 current = null ∧ 子目录族全列", () => {
  assert.equal(findProject(c2), null)
  const family = discoverFamily(c2)
  assert.equal(family.current, null)
  assert.deepEqual(family.projects.map((p) => p.root), [resolve(join(c2, "pa")), resolve(join(c2, "pb"))])
})

test("PR-13 回归 · 工作区锚 + 锚位幽灵键控库 ⇒ 不立锚为根（库在盘不算项目）", () => {
  const ledgerDir = mk("ledgerdb13")
  _setLedgerDirForTest(ledgerDir)
  try {
    writeFileSync(join(ledgerDir, `${ledgerKey(resolve(ws))}.db`), "ghost")
    assert.equal(resolveLedgerRoot(ws), null, "键控库存在 ≠ 可作项目")
  } finally { _resetLedgerDirForTest() }
})

test("PR-15 容器 + 恰一裸仓 ⇒ none ∧ root = null（发现读数不进 root）", () => {
  assert.deepEqual(projectRootView(bare), { state: "none", root: null, candidates: [] })
  assert.equal(resolveProjectRoot(bare), null)
  assert.equal(resolveLedgerRoot(bare), null, "台账面同判（A3 = 同 A2）")
})

test("PR-16 目标 = 会话锚的祖先且带档 ⇒ null（与判据本体同界）；界放宽即正常上溯", () => {
  assert.equal(resolveLedgerRoot(outer, sub), null, "不上溯到锚外")
  assert.equal(resolveLedgerRoot(outer, ROOT)?.root, resolve(outer), "同一判据，仅界不同")
})

test("AC-35 覆盖位 ⇒ 头部短路（ok + 覆盖值），三入口同覆", () => {
  _setProjectRootForTest(proj)
  try {
    assert.deepEqual(projectRootView("ignored-target"), { state: "ok", root: resolve(proj), candidates: [] })
    assert.equal(resolveProjectRoot("ignored-target"), resolve(proj))
    assert.equal(resolveLedgerRoot("ignored-target")?.root, resolve(proj))
  } finally { _resetProjectRootForTest() }
})

test("A11 容器 + 恰一裸仓 ⇒ manifest init 落点 = 容器自身（write 拒）", async () => {
  const ctx = { agent: { cwd: ROOT } }
  let writeMsg = null
  try { await manifestTool.execute({ action: "write", target: bare, key: "phase", value: "initial-dev" }, ctx) } catch (e) { writeMsg = e.message }
  assert.match(String(writeMsg), /refused/, "write 无档 ⇒ 拒（不向下取根写子目录）")

  const receipt = String(await manifestTool.execute({ action: "init", target: bare }, ctx))
  assert.match(receipt, /manifest init: created default manifest/)
  assert.ok(existsSync(join(bare, "PROJECT-MANIFEST.json")), "落点 = 容器（target）自身")
  assert.equal(existsSync(join(bare, "repo", "PROJECT-MANIFEST.json")), false, "裸仓档零变")
})
