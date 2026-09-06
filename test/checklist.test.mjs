/**
 * checklist.test.mjs — checklist — persistent tree checklist (CLI-ported); plus CLI-ported lint + timer tool singles.
 *
 * Split from test/tools.test.mjs (AGENT-LOOP.md §18.14/§18.14.1 D-T1.1 domain rule —
 * blocks moved verbatim; test names/semantics unchanged).
 */

import { describe, it, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync, existsSync, readFileSync, mkdirSync, symlinkSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { checklistTool, pendingItems, parse, write } from "../src/tools/checklist.mjs"
import { lintTool } from "../src/tools/linter.mjs"
import { timerTool } from "../src/agent-tools/timer.mjs"

let tmp, cwd

const ctx = () => ({ cwd })

function setup() {
  tmp = mkdtempSync(join(tmpdir(), "thincoder-vscode-tools-test-"))
  cwd = tmp
}

function cleanup() { rmSync(tmp, { recursive: true, force: true }) }

/** cwdHash12 契约（CHECKPOINT.md F5/验收 12，与 src/tools/checkpoint.mjs 相同）：
 *  sha1(normalizeCwd(cwd)).slice(0,12)——Windows 盘符大写归一化，跨端互通前提。 */

describe("checklist — persistent tree checklist (ported from CLI)", () => {
  beforeEach(setup)
  afterEach(cleanup)

  it("add assigns sequential root IDs (T1, T2)", () => {
    const r1 = checklistTool.execute({ action: "add", item: "first" }, ctx())
    const r2 = checklistTool.execute({ action: "add", item: "second" }, ctx())
    assert.match(r1, /T1: first/)
    assert.match(r2, /T2: second/)
  })

  it("add with parent creates child ID (T1.1)", () => {
    checklistTool.execute({ action: "add", item: "root" }, ctx())
    const r = checklistTool.execute({ action: "add", item: "child", parent: "T1" }, ctx())
    assert.match(r, /T1\.1: child/)
    assert.match(r, /under T1/)
  })

  it("add with unknown parent errors", () => {
    const r = checklistTool.execute({ action: "add", item: "x", parent: "T99" }, ctx())
    assert.match(r, /Error: parent 'T99' not found/)
  })

  it("add without item errors", () => {
    const r = checklistTool.execute({ action: "add" }, ctx())
    assert.match(r, /Error: 'item' is required/)
  })

  it("list renders tree with status marks", () => {
    checklistTool.execute({ action: "add", item: "root" }, ctx())
    checklistTool.execute({ action: "add", item: "child", parent: "T1" }, ctx())
    checklistTool.execute({ action: "mark", index: 2, status: "in_progress" }, ctx())
    const out = checklistTool.execute({ action: "list" }, ctx())
    assert.match(out, /- \[ \] T1: root/)
    assert.match(out, / {2}- \[~\] T1\.1: child/)
  })

  it("list on empty returns placeholder", () => {
    assert.equal(checklistTool.execute({ action: "list" }, ctx()), "(checklist is empty)")
  })

  it("mark in_progress updates status", () => {
    checklistTool.execute({ action: "add", item: "task" }, ctx())
    const r = checklistTool.execute({ action: "mark", index: 1, status: "in_progress" }, ctx())
    assert.match(r, /Marked T1 pending → in_progress/)
    const pending = pendingItems(cwd)
    assert.equal(pending.length, 1)
    assert.equal(pending[0].status, "in_progress")
  })

  it("mark done archives to checklist-done.md and removes from list", () => {
    checklistTool.execute({ action: "add", item: "task" }, ctx())
    checklistTool.execute({ action: "mark", index: 1, status: "done" }, ctx())
    assert.equal(checklistTool.execute({ action: "list" }, ctx()), "(checklist is empty)")
    assert.equal(pendingItems(cwd).length, 0)
    const doneFile = join(cwd, ".thincoder", "checklist-done.md")
    assert.ok(existsSync(doneFile))
    assert.match(readFileSync(doneFile, "utf8"), /- \[x\] T1: task/)
  })

  it("mark with out-of-range index errors", () => {
    const r = checklistTool.execute({ action: "mark", index: 5, status: "done" }, ctx())
    assert.match(r, /Error: index 5 out of range/)
  })

  it("mark with invalid status errors", () => {
    checklistTool.execute({ action: "add", item: "t" }, ctx())
    const r = checklistTool.execute({ action: "mark", index: 1, status: "bogus" }, ctx())
    assert.match(r, /Error: 'status' is required/)
  })

  it("mark no-op when status unchanged", () => {
    checklistTool.execute({ action: "add", item: "t" }, ctx())
    const r = checklistTool.execute({ action: "mark", index: 1, status: "pending" }, ctx())
    assert.match(r, /Already pending/)
  })

  it("unknown action errors", () => {
    const r = checklistTool.execute({ action: "nope" }, ctx())
    assert.match(r, /Error: unknown action/)
  })

  it("T-cl-1 mark by id 精确命中中部条目，头部无关条目不误标", () => {
    mkdirSync(join(cwd, ".thincoder"), { recursive: true })
    writeFileSync(join(cwd, ".thincoder", "checklist.md"),
      "- [ ] T1: alpha\n- [ ] T2: beta\n- [ ] T63: gamma\n- [ ] T3: delta\n")
    const r = checklistTool.execute({ action: "mark", id: "T63", status: "done" }, ctx())
    assert.match(r, /Marked T63 .*→ done/)
    const content = readFileSync(join(cwd, ".thincoder", "checklist.md"), "utf8")
    assert.doesNotMatch(content, /T63/)
    assert.match(content, /T1: alpha/)
    assert.match(content, /T2: beta/)
    assert.match(content, /T3: delta/)
    assert.match(readFileSync(join(cwd, ".thincoder", "checklist-done.md"), "utf8"), /T63: gamma/)
  })

  it("T-cl-2 add 返回的 id 可直接用于 mark id 闭环", () => {
    const added = checklistTool.execute({ action: "add", item: "闭环任务" }, ctx())
    const m = added.match(/Added: \[ \] (T\d+): 闭环任务/)
    assert.ok(m, `add 返回应含 id: ${added}`)
    const r = checklistTool.execute({ action: "mark", id: m[1], status: "done" }, ctx())
    assert.match(r, new RegExp(`Marked ${m[1]} .*→ done`))
    assert.equal(checklistTool.execute({ action: "list" }, ctx()), "(checklist is empty)")
  })

  it("T-cl-3 同时给 id 和 index 时按 id 命中，忽略 index", () => {
    mkdirSync(join(cwd, ".thincoder"), { recursive: true })
    writeFileSync(join(cwd, ".thincoder", "checklist.md"), "- [ ] T1: first\n- [ ] T63: second\n")
    const r = checklistTool.execute({ action: "mark", id: "T63", index: 1, status: "done" }, ctx())
    assert.match(r, /Marked T63 .*→ done/)
    const content = readFileSync(join(cwd, ".thincoder", "checklist.md"), "utf8")
    assert.match(content, /T1: first/)
    assert.doesNotMatch(content, /T63/)
  })

  it("T-cl-4 仅给 index（无 id）沿用 flat[index-1] 命中", () => {
    mkdirSync(join(cwd, ".thincoder"), { recursive: true })
    writeFileSync(join(cwd, ".thincoder", "checklist.md"), "- [ ] T1: first\n- [ ] T2: second\n")
    const r = checklistTool.execute({ action: "mark", index: 2, status: "in_progress" }, ctx())
    assert.match(r, /Marked T2 .*→ in_progress/)
    const content = readFileSync(join(cwd, ".thincoder", "checklist.md"), "utf8")
    assert.match(content, /- \[ \] T1: first/)
    assert.match(content, /- \[~\] T2: second/)
  })

  it("T-cl-5 非连续 ID（T17/T19/T21）add 两条根条目分配 T22/T23 不撞号", () => {
    mkdirSync(join(cwd, ".thincoder"), { recursive: true })
    writeFileSync(join(cwd, ".thincoder", "checklist.md"), "- [ ] T17: a\n- [ ] T19: b\n- [ ] T21: c\n")
    const r1 = checklistTool.execute({ action: "add", item: "新一" }, ctx())
    const r2 = checklistTool.execute({ action: "add", item: "新二" }, ctx())
    assert.match(r1, /Added: \[ \] T22: 新一/)
    assert.match(r2, /Added: \[ \] T23: 新二/)
    const content = readFileSync(join(cwd, ".thincoder", "checklist.md"), "utf8")
    assert.match(content, /T17: a/)
    assert.match(content, /T19: b/)
    assert.match(content, /T21: c/)
    assert.match(content, /T22: 新一/)
    assert.match(content, /T23: 新二/)
    assert.doesNotMatch(content, /T18/)
    assert.doesNotMatch(content, /T20/)
  })

  it("T-cl-6 前缀累积 T15: T15: T15: 归一为单一前缀", () => {
    mkdirSync(join(cwd, ".thincoder"), { recursive: true })
    writeFileSync(join(cwd, ".thincoder", "checklist.md"), "- [ ] T15: T15: T15: 文本\n")
    checklistTool.execute({ action: "mark", id: "T15", status: "in_progress" }, ctx())
    const content = readFileSync(join(cwd, ".thincoder", "checklist.md"), "utf8")
    assert.match(content, /- \[~\] T15: 文本/)
    assert.doesNotMatch(content, /T15: T15/)
  })

  it("T-cl-7 历史无 id 行多次 parse→write 后 ID 一次性分配不漂移", () => {
    mkdirSync(join(cwd, ".thincoder"), { recursive: true })
    writeFileSync(join(cwd, ".thincoder", "checklist.md"), "- [ ] 无id一\n- [ ] 无id二\n")
    checklistTool.execute({ action: "list" }, ctx())
    const afterFirst = readFileSync(join(cwd, ".thincoder", "checklist.md"), "utf8")
    assert.match(afterFirst, /T1: 无id一/)
    assert.match(afterFirst, /T2: 无id二/)
    checklistTool.execute({ action: "mark", id: "T1", status: "in_progress" }, ctx())
    checklistTool.execute({ action: "list" }, ctx())
    const afterMore = readFileSync(join(cwd, ".thincoder", "checklist.md"), "utf8")
    assert.match(afterMore, /T1: 无id一/)
    assert.match(afterMore, /T2: 无id二/)
    assert.doesNotMatch(afterMore, /T3/)
  })

  it("T-cl-8 父 done 子树全 done → 递归归档（层级保留）", () => {
    mkdirSync(join(cwd, ".thincoder"), { recursive: true })
    writeFileSync(join(cwd, ".thincoder", "checklist.md"),
      "- [ ] T1: parent\n  - [x] T1.1: child1\n  - [x] T1.2: child2\n")
    const r = checklistTool.execute({ action: "mark", id: "T1", status: "done" }, ctx())
    assert.match(r, /Marked T1 .*→ done/)
    const content = readFileSync(join(cwd, ".thincoder", "checklist.md"), "utf8")
    assert.doesNotMatch(content, /T1/)
    const done = readFileSync(join(cwd, ".thincoder", "checklist-done.md"), "utf8")
    assert.match(done, /- \[x\] T1: parent/)
    assert.match(done, /\n {2}- \[x\] T1\.1: child1/)
    assert.match(done, /\n {2}- \[x\] T1\.2: child2/)
  })

  it("T-cl-9 父 done 子树有 pending → 拒绝（父子都不归档不删除）", () => {
    mkdirSync(join(cwd, ".thincoder"), { recursive: true })
    writeFileSync(join(cwd, ".thincoder", "checklist.md"),
      "- [ ] T1: parent\n  - [ ] T1.1: child1\n")
    const r = checklistTool.execute({ action: "mark", id: "T1", status: "done" }, ctx())
    assert.match(r, /先处理子任务/)
    const content = readFileSync(join(cwd, ".thincoder", "checklist.md"), "utf8")
    assert.match(content, /T1: parent/)
    assert.match(content, /T1\.1: child1/)
    assert.ok(!existsSync(join(cwd, ".thincoder", "checklist-done.md")), "done 文件不应生成")
  })

  it("T-cl-10 归档最大号后 add 不复用 ID（T62 → T63）", () => {
    mkdirSync(join(cwd, ".thincoder"), { recursive: true })
    writeFileSync(join(cwd, ".thincoder", "checklist.md"), "- [ ] T62: last\n")
    checklistTool.execute({ action: "mark", id: "T62", status: "done" }, ctx())
    const r = checklistTool.execute({ action: "add", item: "新条目" }, ctx())
    assert.match(r, /Added: \[ \] T63: 新条目/)
  })

  it("T-cl-11 无 ID 根条目自动分配不撞 done 文件归档 ID（done 有 T11 → 得 T12）", () => {
    mkdirSync(join(cwd, ".thincoder"), { recursive: true })
    writeFileSync(join(cwd, ".thincoder", "checklist.md"), "- [ ] T10: 十\n- [ ] 无id条目\n")
    writeFileSync(join(cwd, ".thincoder", "checklist-done.md"), "- [x] T11: 已归档\n")
    checklistTool.execute({ action: "list" }, ctx()) // 触发 parse → assignIds 落盘
    const content = readFileSync(join(cwd, ".thincoder", "checklist.md"), "utf8")
    assert.match(content, /T10: 十/)
    assert.match(content, /T12: 无id条目/)          // 跳过 done 文件的 T11
    assert.doesNotMatch(content, /T11: 无id条目/)   // 不撞归档 ID
  })
})

// ─── R10 F4（MULTI-INSTANCE-COLLAB.md D-F4a/b——并发写防护镜像）───────────────
// 伪并发范式：parse/write 模块级直编 读→seedFile（直写模拟对端）→写 链——工具层无法在
// parse 与 write 之间注入 seed。checklist.md = cp、checklist-done.md = dp。

describe("R10 F4 — checklist 并发写防护（mtime 门控 + ID union 合并）", () => {
  beforeEach(setup)
  afterEach(cleanup)

  function cpPath() { return join(cwd, ".thincoder", "checklist.md") }
  function dpPath() { return join(cwd, ".thincoder", "checklist-done.md") }

  it("T-F4a: 并发 add——磁盘在他端读后加了项 → 写前门控合并，双方新增都保留（merged 语义）", () => {
    mkdirSync(join(cwd, ".thincoder"), { recursive: true })
    writeFileSync(cpPath(), "- [ ] T1: root\n  - [ ] T1.1: child\n- [ ] T2: two\n")
    const items = parse(cpPath()) // A 读链基线 M0
    // seedFile：B 在 A 读后给共同父项 T1 加了子项 T1.2（写盘——B 的足迹）
    writeFileSync(cpPath(), "- [ ] T1: root\n  - [ ] T1.1: child\n  - [ ] T1.2: B-child\n- [ ] T2: two\n")
    // A add 根项 T3
    items.push({ id: "T3", index: 0, depth: 0, status: "pending", text: "A-added", children: [] })
    const res = write(cpPath(), items)
    assert.equal(res.merged, true, "磁盘 mtime ≠ 链基线 → merged")
    const content = readFileSync(cpPath(), "utf8")
    assert.match(content, /T3: A-added/, "A 新项保留（不丢）")
    assert.match(content, /T1\.2: B-child/, "B 新项保留（不丢）——children 递归 union")
    assert.match(content, /T1\.1: child/, "既有项保留")
  })

  it("T-F4b: 并发 add 同 ID——盘上保留原 ID、本端重分配 max+1（合并后无重复 ID）", () => {
    mkdirSync(join(cwd, ".thincoder"), { recursive: true })
    writeFileSync(cpPath(), "- [ ] T1: one\n- [ ] T2: two\n")
    const items = parse(cpPath()) // A 基线 max = T2 → A 将分配 T3
    // seedFile：B 从同基线并发 add 也得了 T3
    writeFileSync(cpPath(), "- [ ] T1: one\n- [ ] T2: two\n- [ ] T3: B-added\n")
    items.push({ id: "T3", index: 0, depth: 0, status: "pending", text: "A-added", children: [] })
    const res = write(cpPath(), items)
    assert.equal(res.merged, true)
    const content = readFileSync(cpPath(), "utf8")
    assert.match(content, /T3: B-added/, "B 项盘上保留（不重分配）")
    assert.match(content, /T4: A-added/, "A 项重分配 max+1 续分配")
    const after = parse(cpPath())
    const ids = after.map((i) => i.id)
    assert.equal(new Set(ids).size, ids.length, "合并后无重复 ID")
    assert.equal(ids.length, 4, "T1/T2 + 双方新增都在")
  })

  it("T-F4c: 无并发零行为变化——parse 规范化写回 → add 链自写不误触发 merged/重分配", () => {
    mkdirSync(join(cwd, ".thincoder"), { recursive: true })
    writeFileSync(cpPath(), "- [ ] 无id一\n- [ ] 无id二\n")
    checklistTool.execute({ action: "list" }, ctx()) // parse → assign → 规范化写回（自写）
    const afterFirst = readFileSync(cpPath(), "utf8")
    assert.match(afterFirst, /T1: 无id一/, "规范化写回照常")
    assert.match(afterFirst, /T2: 无id二/)
    // add 链：自写后基线已刷新 → 无并发 → 不 merged、无重分配（评审修正 #6）
    const r1 = checklistTool.execute({ action: "add", item: "新一" }, ctx())
    assert.match(r1, /Added: \[ \] T3: 新一/)
    const r2 = checklistTool.execute({ action: "add", item: "新二" }, ctx())
    assert.match(r2, /Added: \[ \] T4: 新二/)
    const content = readFileSync(cpPath(), "utf8")
    assert.match(content, /T1: 无id一/)
    assert.match(content, /T2: 无id二/)
    assert.match(content, /T3: 新一/)
    assert.match(content, /T4: 新二/, "ID 连续——自写链无误触发")
  })

  it("T-F4d: mark 双写路径同防护——并发 mark 双方归档都保留（done union），双方移除都不复活", () => {
    mkdirSync(join(cwd, ".thincoder"), { recursive: true })
    writeFileSync(cpPath(), "- [ ] T1: one\n- [ ] T2: two\n")
    const items = parse(cpPath()) // A 读链基线（dp 尚不存在 → 基线 null）
    const doneItems = parse(dpPath())
    // seedFile：B 并发 mark T2 done——dp 写归档 + cp 移除 T2
    writeFileSync(dpPath(), "- [x] T2: two\n")
    writeFileSync(cpPath(), "- [ ] T1: one\n")
    // A mark T1 done——双写：dp 先（门控合并 B 的归档）→ cp 后（done 过滤防复活）
    doneItems.push({ id: "T1", index: 0, depth: 0, status: "done", text: "one", children: [] })
    write(dpPath(), doneItems)
    items.splice(items.findIndex((i) => i.id === "T1"), 1)
    write(cpPath(), items)
    const doneContent = readFileSync(dpPath(), "utf8")
    assert.match(doneContent, /- \[x\] T1: one/, "A 归档保留")
    assert.match(doneContent, /- \[x\] T2: two/, "B 归档保留——done union（不互覆）")
    const cpContent = readFileSync(cpPath(), "utf8")
    assert.doesNotMatch(cpContent, /T1:/, "A 的移除生效（不复活自己刚归档的）")
    assert.doesNotMatch(cpContent, /T2:/, "B 的移除生效（done 过滤——不复活他端归档的）")
  })
})

describe("lint — language-aware cascade (ported from CLI)", () => {
  beforeEach(setup)
  afterEach(cleanup)

  it("fast path: reports Syntax OK for valid JS", async () => {
    const f = join(cwd, "ok.mjs")
    writeFileSync(f, "export const x = 1\n")
    const r = await lintTool.execute({ path: f }, ctx())
    assert.match(r, /Syntax OK/)
  })

  it("fast path: reports syntax error for invalid JS", async () => {
    const f = join(cwd, "bad.mjs")
    writeFileSync(f, "export const = \n")
    const r = await lintTool.execute({ path: f }, ctx())
    assert.match(r, /Syntax error/)
  })

  it("fast path: rejects non-JS-family file", async () => {
    const f = join(cwd, "a.txt")
    writeFileSync(f, "hello\n")
    const r = await lintTool.execute({ path: f }, ctx())
    assert.match(r, /only JS\/TS-family files supported/)
  })

  it("no path and no touched file returns guidance", async () => {
    const r = await lintTool.execute({}, { cwd, agent: { _touchedFiles: [] } })
    assert.match(r, /no file specified and no recently modified file/)
  })

  it("falls back to most recently touched file when path omitted", async () => {
    const f = join(cwd, "touched.mjs")
    writeFileSync(f, "export const y = 2\n")
    const r = await lintTool.execute({}, { cwd, agent: { _touchedFiles: ["touched.mjs"] } })
    assert.match(r, /Syntax OK/)
  })

  it("full cascade on JS falls back to node --check (eslint removed 2026-09-02)", async () => {
    // eslint was removed for zero-dependency (TOOLS.md §10.2): a JS file with
    // full=true now goes through node --check, not the eslint cascade.
    const repoCwd = join(import.meta.dirname, "..")
    const f = join(repoCwd, "src", "tools", "linter.mjs")
    const r = await lintTool.execute({ path: f, full: true }, { cwd: repoCwd })
    assert.match(r, /Syntax OK/)
  })
})

describe("timer — thinking-budget timer (ported from CLI)", () => {
  it("pushes a pending timer onto agent._pendingTimers", () => {
    const agent = {}
    const before = Date.now()
    const r = timerTool.execute({ seconds: 60 }, { agent })
    assert.match(r, /Timer set for 60 seconds/)
    assert.equal(agent._pendingTimers.length, 1)
    const t = agent._pendingTimers[0]
    assert.ok(t.expiresAt >= before + 60000 && t.expiresAt <= Date.now() + 60000)
    assert.match(t.message, /Time's up \(60s\)/)
  })

  it("uses a custom message when provided", () => {
    const agent = {}
    timerTool.execute({ seconds: 5, message: "custom reminder" }, { agent })
    assert.equal(agent._pendingTimers[0].message, "custom reminder")
  })

  it("initializes _pendingTimers if absent (lazy)", () => {
    const agent = { _pendingTimers: undefined }
    timerTool.execute({ seconds: 1 }, { agent })
    assert.ok(Array.isArray(agent._pendingTimers))
  })

  it("is readonly and side-effect-exempt (does not trigger verify guard)", () => {
    assert.equal(timerTool.readonly, true)
    assert.equal(timerTool.sideEffectExempt, true)
  })
})
