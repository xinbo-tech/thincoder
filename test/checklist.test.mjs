/**
 * checklist.test.mjs — tests extracted per AGENT-LOOP.md §18.14 (test files split by domain).
 * Source(s): tools.test.mjs.
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync, readFileSync, mkdirSync, existsSync, readdirSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, relative, dirname } from "node:path"
import { checklistTool } from "../src/tools/checklist.mjs"


// ---------------------------------------------------------------- checklist ID round-trip regression



test("checklist: ID 前缀往返不叠加（add→write→parse→write 循环保持单一前缀）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-cl-"))
  const ctx = { cwd: dir }
  try {
    checklistTool.execute({ action: "add", item: "第一项" }, ctx)
    checklistTool.execute({ action: "add", item: "第二项" }, ctx)
    // mark done → parse → write 往返
    checklistTool.execute({ action: "mark", index: 1, status: "in_progress" }, ctx)
    checklistTool.execute({ action: "mark", index: 1, status: "pending" }, ctx)
    checklistTool.execute({ action: "mark", index: 2, status: "in_progress" }, ctx)
    checklistTool.execute({ action: "mark", index: 2, status: "pending" }, ctx)
    const content = readFileSync(join(dir, ".thincoder", "checklist.md"), "utf-8")
    // 往返多次后每行 ID 只出现一次，绝不能 "T1: T1:"
    assert.doesNotMatch(content, /T1: T1/)
    assert.doesNotMatch(content, /T2: T2/)
    assert.match(content, /- \[ \] T1: 第一项/)
    assert.match(content, /- \[ \] T2: 第二项/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("checklist: 手写带前缀的存量文件往返一次后前缀不翻倍", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-cl2-"))
  mkdirSync(join(dir, ".thincoder"), { recursive: true })
  writeFileSync(join(dir, ".thincoder", "checklist.md"), "- [ ] T1: 存量任务\n")
  const ctx = { cwd: dir }
  try {
    checklistTool.execute({ action: "mark", index: 1, status: "in_progress" }, ctx)
    checklistTool.execute({ action: "mark", index: 1, status: "pending" }, ctx)
    const content = readFileSync(join(dir, ".thincoder", "checklist.md"), "utf-8")
    assert.doesNotMatch(content, /T1: T1/)
    assert.match(content, /- \[ \] T1: 存量任务/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("checklist: T-cl-1 mark 按 id 精确命中中部条目，头部无关条目不误标", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-cl-t1-"))
  mkdirSync(join(dir, ".thincoder"), { recursive: true })
  writeFileSync(join(dir, ".thincoder", "checklist.md"),
    "- [ ] T1: alpha\n- [ ] T2: beta\n- [ ] T63: gamma\n- [ ] T3: delta\n")
  const ctx = { cwd: dir }
  try {
    const r = checklistTool.execute({ action: "mark", id: "T63", status: "done" }, ctx)
    assert.match(r, /Marked T63 .*→ done/)
    const content = readFileSync(join(dir, ".thincoder", "checklist.md"), "utf-8")
    assert.doesNotMatch(content, /T63/)      // T63 已归档移除
    assert.match(content, /T1: alpha/)        // 头部条目保持
    assert.match(content, /T2: beta/)
    assert.match(content, /T3: delta/)
    const done = readFileSync(join(dir, ".thincoder", "checklist-done.md"), "utf-8")
    assert.match(done, /T63: gamma/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("checklist: T-cl-2 add 返回的 id 可直接用于 mark id 闭环", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-cl-t2-"))
  const ctx = { cwd: dir }
  try {
    const added = checklistTool.execute({ action: "add", item: "闭环任务" }, ctx)
    const m = added.match(/Added: \[ \] (T\d+): 闭环任务/)
    assert.ok(m, `add 返回应含 id: ${added}`)
    const id = m[1]
    const r = checklistTool.execute({ action: "mark", id, status: "done" }, ctx)
    assert.match(r, new RegExp(`Marked ${id} .*→ done`))
    assert.equal(checklistTool.execute({ action: "list" }, ctx), "(checklist is empty)")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("checklist: T-cl-3 同时给 id 和 index 时按 id 命中，忽略 index", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-cl-t3-"))
  mkdirSync(join(dir, ".thincoder"), { recursive: true })
  writeFileSync(join(dir, ".thincoder", "checklist.md"), "- [ ] T1: first\n- [ ] T63: second\n")
  const ctx = { cwd: dir }
  try {
    const r = checklistTool.execute({ action: "mark", id: "T63", index: 1, status: "done" }, ctx)
    assert.match(r, /Marked T63 .*→ done/)
    const content = readFileSync(join(dir, ".thincoder", "checklist.md"), "utf-8")
    assert.match(content, /T1: first/)       // index=1 的 T1 未被误标
    assert.doesNotMatch(content, /T63/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("checklist: T-cl-4 仅给 index（无 id）沿用 flat[index-1] 命中", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-cl-t4-"))
  mkdirSync(join(dir, ".thincoder"), { recursive: true })
  writeFileSync(join(dir, ".thincoder", "checklist.md"), "- [ ] T1: first\n- [ ] T2: second\n")
  const ctx = { cwd: dir }
  try {
    const r = checklistTool.execute({ action: "mark", index: 2, status: "in_progress" }, ctx)
    assert.match(r, /Marked T2 .*→ in_progress/)
    const content = readFileSync(join(dir, ".thincoder", "checklist.md"), "utf-8")
    assert.match(content, /- \[ \] T1: first/)
    assert.match(content, /- \[~\] T2: second/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("checklist: T-cl-5 非连续 ID（T17/T19/T21）add 两条根条目分配 T22/T23 不撞号", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-cl-t5-"))
  mkdirSync(join(dir, ".thincoder"), { recursive: true })
  writeFileSync(join(dir, ".thincoder", "checklist.md"), "- [ ] T17: a\n- [ ] T19: b\n- [ ] T21: c\n")
  const ctx = { cwd: dir }
  try {
    const r1 = checklistTool.execute({ action: "add", item: "新一" }, ctx)
    const r2 = checklistTool.execute({ action: "add", item: "新二" }, ctx)
    assert.match(r1, /Added: \[ \] T22: 新一/)
    assert.match(r2, /Added: \[ \] T23: 新二/)
    const content = readFileSync(join(dir, ".thincoder", "checklist.md"), "utf-8")
    assert.match(content, /T17: a/)
    assert.match(content, /T19: b/)
    assert.match(content, /T21: c/)
    assert.match(content, /T22: 新一/)
    assert.match(content, /T23: 新二/)
    assert.doesNotMatch(content, /T18/)
    assert.doesNotMatch(content, /T20/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("checklist: T-cl-6 前缀累积 T15: T15: T15: 归一为单一前缀", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-cl-t6-"))
  mkdirSync(join(dir, ".thincoder"), { recursive: true })
  writeFileSync(join(dir, ".thincoder", "checklist.md"), "- [ ] T15: T15: T15: 文本\n")
  const ctx = { cwd: dir }
  try {
    checklistTool.execute({ action: "mark", id: "T15", status: "in_progress" }, ctx)
    const content = readFileSync(join(dir, ".thincoder", "checklist.md"), "utf-8")
    assert.match(content, /- \[~\] T15: 文本/)
    assert.doesNotMatch(content, /T15: T15/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("checklist: T-cl-7 历史无 id 行多次 parse→write 后 ID 一次性分配不漂移", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-cl-t7-"))
  mkdirSync(join(dir, ".thincoder"), { recursive: true })
  writeFileSync(join(dir, ".thincoder", "checklist.md"), "- [ ] 无id一\n- [ ] 无id二\n")
  const ctx = { cwd: dir }
  try {
    checklistTool.execute({ action: "list" }, ctx) // 首次 parse 一次性落盘
    const afterFirst = readFileSync(join(dir, ".thincoder", "checklist.md"), "utf-8")
    assert.match(afterFirst, /T1: 无id一/)
    assert.match(afterFirst, /T2: 无id二/)

    checklistTool.execute({ action: "mark", id: "T1", status: "in_progress" }, ctx)
    checklistTool.execute({ action: "list" }, ctx) // 再次 parse
    const afterMore = readFileSync(join(dir, ".thincoder", "checklist.md"), "utf-8")
    assert.match(afterMore, /T1: 无id一/)   // ID 稳定，未漂移
    assert.match(afterMore, /T2: 无id二/)
    assert.doesNotMatch(afterMore, /T3/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("checklist: T-cl-8 父 done 子树全 done → 递归归档（层级保留）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-cl-t8-"))
  mkdirSync(join(dir, ".thincoder"), { recursive: true })
  writeFileSync(join(dir, ".thincoder", "checklist.md"),
    "- [ ] T1: parent\n  - [x] T1.1: child1\n  - [x] T1.2: child2\n")
  const ctx = { cwd: dir }
  try {
    const r = checklistTool.execute({ action: "mark", id: "T1", status: "done" }, ctx)
    assert.match(r, /Marked T1 .*→ done/)
    const content = readFileSync(join(dir, ".thincoder", "checklist.md"), "utf-8")
    assert.doesNotMatch(content, /T1/)                       // 无残留
    const done = readFileSync(join(dir, ".thincoder", "checklist-done.md"), "utf-8")
    assert.match(done, /- \[x\] T1: parent/)
    assert.match(done, /\n {2}- \[x\] T1\.1: child1/)          // 子任务层级保留
    assert.match(done, /\n {2}- \[x\] T1\.2: child2/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("checklist: T-cl-9 父 done 子树有 pending → 拒绝（父子都不归档不删除）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-cl-t9-"))
  mkdirSync(join(dir, ".thincoder"), { recursive: true })
  writeFileSync(join(dir, ".thincoder", "checklist.md"),
    "- [ ] T1: parent\n  - [ ] T1.1: child1\n")
  const ctx = { cwd: dir }
  try {
    const r = checklistTool.execute({ action: "mark", id: "T1", status: "done" }, ctx)
    assert.match(r, /先处理子任务/)
    const content = readFileSync(join(dir, ".thincoder", "checklist.md"), "utf-8")
    assert.match(content, /T1: parent/)                      // 父子都在
    assert.match(content, /T1\.1: child1/)
    assert.ok(!existsSync(join(dir, ".thincoder", "checklist-done.md")), "done 文件不应生成")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("checklist: T-cl-10 归档最大号后 add 不复用 ID（T62 → T63）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-cl-t10-"))
  mkdirSync(join(dir, ".thincoder"), { recursive: true })
  writeFileSync(join(dir, ".thincoder", "checklist.md"), "- [ ] T62: last\n")
  const ctx = { cwd: dir }
  try {
    checklistTool.execute({ action: "mark", id: "T62", status: "done" }, ctx)
    const r = checklistTool.execute({ action: "add", item: "新条目" }, ctx)
    assert.match(r, /Added: \[ \] T63: 新条目/)               // 不复用 T62
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("checklist: T-cl-11 无 ID 根条目自动分配不撞 done 文件归档 ID（done 有 T11 → 得 T12）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-cl-t11-"))
  mkdirSync(join(dir, ".thincoder"), { recursive: true })
  writeFileSync(join(dir, ".thincoder", "checklist.md"), "- [ ] T10: 十\n- [ ] 无id条目\n")
  writeFileSync(join(dir, ".thincoder", "checklist-done.md"), "- [x] T11: 已归档\n")
  const ctx = { cwd: dir }
  try {
    checklistTool.execute({ action: "list" }, ctx) // 触发 parse → assignIds 落盘
    const content = readFileSync(join(dir, ".thincoder", "checklist.md"), "utf-8")
    assert.match(content, /T10: 十/)
    assert.match(content, /T12: 无id条目/)          // 跳过 done 文件的 T11
    assert.doesNotMatch(content, /T11: 无id条目/)   // 不撞归档 ID
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
