/*
 * 2026-11-02-edit-line-anchor-guard.test.mjs — 本批单元验收（AC1–AC19）。
 *
 * 对应 = 批档 §2「验收对照」表；判据与拒文单源 = `thincoder-core/tools/write-path.mjs`
 * （`lineAnchorVerdict` / `lineAnchorRefusal`），帧单源 = `thincoder-core/tools/edit-diff.mjs`
 * （`planEditEntries` / `applyPlannedEntries`）。
 * ACP 相关断言用 IDE 缓冲替身（`fs/read_text_file` / `fs/write_text_file` 两个反向 RPC）。
 *
 * 复跑（cwd = 仓根）：`node --test docs/batches/2026-11-02-edit-line-anchor-guard.test.mjs`
 * 本档随批档收口删除（单元用例不保留）。
 */
import { after, test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { isAbsolute, join } from "node:path"
import { fileURLToPath } from "node:url"

import { editTool, insertAfterTool, writeTool } from "../../thincoder-core/tools/file.mjs"
import { applyPatchTool } from "../../thincoder-core/tools/patch.mjs"
import {
  clearDirty, clearLastWrite, isDirty, lastWriteOf, lineAnchorRefusal, markDirty, recordWrite,
} from "../../thincoder-core/tools/write-path.mjs"
import { planEditEntries } from "../../thincoder-core/tools/edit-diff.mjs"
import { buildAcpCallbacks } from "../../thincoder-cli/src/acp/bridge.mjs"

const REPO = fileURLToPath(new URL("../../", import.meta.url))
const dirs = []
after(() => {
  for (const d of dirs) rmSync(d, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 })
})

/** 临时工作区：`doc.md` 有 `count` 行（L1…Ln）。每个用例一棵，互不共享记账表条目。 */
function fixture(tag, count) {
  const root = mkdtempSync(join(tmpdir(), `lag-${tag}-`))
  dirs.push(root)
  const abs = join(root, "doc.md")
  writeFileSync(abs, Array.from({ length: count }, (_, i) => `L${i + 1}`).join("\n") + "\n")
  return { root, ctx: { cwd: root }, abs, rel: "doc.md" }
}
const read = (abs) => readFileSync(abs, "utf8")
const lines = (abs) => read(abs).split("\n")

/** 拒文的「两条下一步」段（第 3 / 4 要素）——同构造器的判据就是这一段逐字相等。 */
const nextSteps = (msg) => msg.slice(msg.indexOf("Two ways on:"))
const staleHead = (msg) => msg.slice(0, msg.indexOf("Editing by the old numbers"))

// ────────────────────────────── E1 · 单条行号形

test("AC1 上一笔 edit 之后 line 落在受影响区内 ⇒ 拒，拒文含路径 / L<startLine> / 漂移量", async () => {
  const { ctx, abs, rel } = fixture("ac1", 10)
  await editTool.execute({ path: rel, line: 2, new_string: "X\nY" }, ctx) // 快照 = { edit, startLine 2, shift +1 }
  const before = read(abs)
  await assert.rejects(
    () => editTool.execute({ path: rel, line: 5, new_string: "Z" }, ctx),
    (err) => {
      assert.match(err.message, /these line numbers are stale/)
      assert.ok(err.message.includes(abs), "拒文点名路径")
      assert.ok(err.message.includes("was at L2"), "拒文点名上次写入点")
      assert.ok(err.message.includes("offset by +1"), "拒文点名漂移量")
      assert.ok(err.message.includes("Two ways on:"), "拒文给两条下一步")
      assert.ok(err.message.includes("hashline_edit") && err.message.includes("old_string"), "两条下一步点名位置无关寻址")
      return true
    }
  )
  assert.equal(read(abs), before, "文件字节零改")
})

test("AC2 目标区整体在上次写入点之前 ⇒ 放行并落盘", async () => {
  const { ctx, abs, rel } = fixture("ac2", 8)
  await editTool.execute({ path: rel, line: 4, new_string: "FOUR" }, ctx) // 快照 startLine 4
  await editTool.execute({ path: rel, line: 2, new_string: "TWO" }, ctx) // 2 < 4 ⇒ 放行
  assert.equal(lines(abs)[1], "TWO", "正文按预期改动")
  assert.equal(lines(abs)[3], "FOUR")
})

test("AC3 上一笔 write 全文重写之后 ⇒ 任何行号形拒", async () => {
  const { ctx, abs, rel } = fixture("ac3", 5)
  await writeTool.execute({ path: rel, content: "a\nb\nc\n" }, ctx)
  const before = read(abs)
  for (const args of [
    { path: rel, line: 1, new_string: "A" },
    { path: rel, startLine: 2, endLine: 3, new_string: "BC" },
  ]) {
    await assert.rejects(() => editTool.execute(args, ctx), /stale/)
  }
  await assert.rejects(() => insertAfterTool.execute({ path: rel, after_line: 1, content: "x" }, ctx), /stale/)
  assert.equal(read(abs), before, "文件字节零改")
})

// ────────────────────────────── E2 · 批量帧 R1–R4

test("AC4 同档两条行号条目（第一条增行）⇒ 两条都落在模型 read 时的坐标上", async () => {
  const { ctx, abs, rel } = fixture("ac4", 6)
  await editTool.execute({
    path: rel,
    edits: [
      { line: 2, new_string: "N2a\nN2b" }, // 增 1 行——串行累积会把它下面那条顶偏
      { line: 5, new_string: "N5" },
    ],
  }, ctx)
  assert.deepEqual(lines(abs).slice(0, 7), ["L1", "N2a", "N2b", "L3", "L4", "N5", "L6"])
})

test("AC5 范围重叠 ⇒ 整批拒且零写", async () => {
  const { ctx, abs, rel } = fixture("ac5", 6)
  const before = read(abs)
  await assert.rejects(
    () => editTool.execute({
      path: rel,
      edits: [
        { startLine: 2, endLine: 4, new_string: "x" },
        { line: 3, new_string: "y" },
      ],
    }, ctx),
    (err) => {
      assert.match(err.message, /overlap/)
      assert.match(err.message, /no files written/)
      assert.ok(err.message.includes("doc.md"), "拒文点名目标档")
      return true
    }
  )
  assert.equal(read(abs), before, "文件字节不变")
  assert.equal(lastWriteOf(abs), undefined, "零写 ⇒ 零记账")
})

test("AC6 edit 行号形与 insert_after 的拒文出自同一构造器（同一句、同两条下一步）", async () => {
  const { ctx, abs, rel } = fixture("ac6", 5)
  await editTool.execute({ path: rel, line: 2, new_string: "AA" }, ctx)
  let fromEdit = ""
  let fromInsert = ""
  await assert.rejects(() => editTool.execute({ path: rel, line: 4, new_string: "BB" }, ctx), (e) => { fromEdit = e.message; return true })
  await assert.rejects(() => insertAfterTool.execute({ path: rel, after_line: 4, content: "CC" }, ctx), (e) => { fromInsert = e.message; return true })
  assert.equal(fromEdit, lineAnchorRefusal(abs, 4, 4), "edit 面的拒文 = 构造器产出（无自有副本）")
  assert.equal(fromInsert, lineAnchorRefusal(abs, 4, 4), "insert_after 面的拒文 = 同一构造器")
  assert.equal(nextSteps(fromEdit), nextSteps(fromInsert), "同两条下一步逐字相等")
  assert.equal(staleHead(fromEdit), staleHead(fromInsert), "同一句首句")
})

test("AC7 混合组：行号条目先应用、内容条目随后仍匹配成功，回显保持调用序", async () => {
  const { ctx, abs, rel } = fixture("ac7", 6)
  const out = await editTool.execute({
    path: rel,
    edits: [
      { old_string: "L1", new_string: "LONE" }, // 调用序第 1 条——内容条目
      { line: 4 }, // 调用序第 2 条——行号删行
    ],
  }, ctx)
  assert.deepEqual(lines(abs).slice(0, 5), ["LONE", "L2", "L3", "L5", "L6"])
  const receipt = out.split("\n").filter((l) => /^(Edited|Deleted|edit batch)/.test(l))
  assert.equal(receipt[0], "Edited doc.md: replaced 1 occurrence(s)", "回显第 1 条 = 调用序里的内容条目")
  assert.equal(receipt[1], "Deleted line 4 of doc.md", "回显第 2 条 = 调用序里的行号条目")
  assert.match(receipt[2], /^edit batch: 2\/2 entries — doc\.md$/)
})

test("AC8 既有快照下的批量行号条目 ⇒ 按该快照判、拒则整批零写", async () => {
  const { ctx, abs, rel } = fixture("ac8", 10)
  await editTool.execute({ path: rel, line: 2, new_string: "A\nB" }, ctx) // 快照 { edit, 2, +1 }
  const before = read(abs)
  await assert.rejects(
    () => editTool.execute({ path: rel, edits: [{ line: 6, new_string: "x" }] }, ctx),
    (err) => {
      assert.match(err.message, /was at L2/)
      return true
    }
  )
  assert.equal(read(abs), before, "文件字节不变")
})

test("AC10 内容条目在前 + 行号条目改到同一段 ⇒ 显式 not-found、整批零写", async () => {
  const { ctx, abs, rel } = fixture("ac10", 3)
  const before = read(abs)
  await assert.rejects(
    () => editTool.execute({
      path: rel,
      edits: [
        { old_string: "L1", new_string: "Z1" },
        { line: 1, new_string: "Q1" },
      ],
    }, ctx),
    (err) => {
      assert.match(err.message, /no files written/)
      assert.match(err.message, /old_string not found in doc\.md/)
      return true
    }
  )
  assert.equal(read(abs), before, "文件字节不变")
})

test("AC11 重排后的合并快照：startLine = 组内最小、shift = 净漂移；下一次调用按这组值判", async () => {
  const { ctx, abs, rel } = fixture("ac11", 20)
  await editTool.execute({
    path: rel,
    edits: [
      { line: 10, new_string: "x\ny" }, // 先应用（降序）——净漂移 +1
      { line: 4, new_string: "z" }, // 后应用
    ],
  }, ctx)
  assert.deepEqual(lastWriteOf(abs), { type: "edit", startLine: 4, shift: 1 }, "合并快照 = 组内最小 startLine + 净漂移")
  await assert.rejects(() => editTool.execute({ path: rel, line: 4, new_string: "w" }, ctx), /was at L4/, "按这组值拒")
  await editTool.execute({ path: rel, line: 1, new_string: "W" }, ctx) // 1 < 4 ⇒ 放行
  assert.equal(lines(abs)[0], "W", "按这组值放行")
})

// ────────────────────────────── E3 / E6 · 单源拒文与陈旧快照

test("AC9 apply_patch 之后（dirty 真、快照已清）⇒ 行号形拒；edit 之后（dirty 已清）⇒ 按快照放行", async () => {
  const { ctx, abs, rel } = fixture("ac9", 8)
  await applyPatchTool.execute({ patch: "--- a/doc.md\n+++ b/doc.md\n@@ -1,1 +1,1 @@\n-L1\n+P1\n" }, ctx)
  assert.equal(isDirty(abs), true, "apply_patch 落 dirty")
  assert.equal(lastWriteOf(abs), undefined, "apply_patch 不留陈旧快照")
  await assert.rejects(() => editTool.execute({ path: rel, line: 3, new_string: "X" }, ctx), /modified since your last read/)
  await assert.rejects(() => insertAfterTool.execute({ path: rel, after_line: 3, content: "I" }, ctx), /modified since your last read/)

  const second = fixture("ac9b", 8)
  await editTool.execute({ path: second.rel, line: 5, new_string: "FIVE" }, second.ctx)
  assert.equal(isDirty(second.abs), false, "edit 记账时清 dirty")
  await editTool.execute({ path: second.rel, line: 2, new_string: "TWO" }, second.ctx) // 2 < 5 ⇒ 放行
  assert.equal(lines(second.abs)[1], "TWO")
})

test("AC12 insert_after 判定回归：insert 记录下改同一行放行、edit 记录下拒、脏 ∧ 陈旧快照亦拒", async () => {
  // ① insert 记录（startLine = 被插入处的目标行）⇒ edit 同一行合法
  const ins = fixture("ac12a", 6)
  await insertAfterTool.execute({ path: ins.rel, after_line: 3, content: "INS" }, ins.ctx)
  assert.deepEqual(lastWriteOf(ins.abs), { type: "insert", startLine: 3, shift: 1 })
  await editTool.execute({ path: ins.rel, line: 3, new_string: "SAME" }, ins.ctx) // 3 <= 3 ⇒ 放行
  assert.deepEqual(lines(ins.abs).slice(2, 4), ["SAME", "INS"])

  // ② edit 记录 ⇒ 再改同一行拒
  const ed = fixture("ac12b", 6)
  await editTool.execute({ path: ed.rel, line: 3, new_string: "THREE" }, ed.ctx)
  let editRefusal = ""
  await assert.rejects(() => editTool.execute({ path: ed.rel, line: 3, new_string: "AGAIN" }, ed.ctx), (e) => { editRefusal = e.message; return true })
  assert.equal(editRefusal, lineAnchorRefusal(ed.abs, 3, 3), "拒文 = 单源构造器")

  // ③ 脏 ∧ 陈旧快照（apply_patch 之后）⇒ insert_after 亦拒，同构造器同句
  const dirty = fixture("ac12c", 6)
  await applyPatchTool.execute({ patch: "--- a/doc.md\n+++ b/doc.md\n@@ -1,1 +1,1 @@\n-L1\n+P1\n" }, dirty.ctx)
  let insertRefusal = ""
  await assert.rejects(() => insertAfterTool.execute({ path: dirty.rel, after_line: 4, content: "N" }, dirty.ctx), (e) => { insertRefusal = e.message; return true })
  assert.equal(insertRefusal, lineAnchorRefusal(dirty.abs, 4, 4), "同一构造器产出")
  assert.equal(nextSteps(insertRefusal), nextSteps(editRefusal), "同两条下一步")

  // ⑤ 形态错先于护栏：缺 endLine 报自己的句，不拼出 `L5-Lundefined`
  await assert.rejects(
    () => editTool.execute({ path: ed.rel, startLine: 5, new_string: "X" }, ed.ctx),
    (err) => {
      assert.match(err.message, /startLine and endLine must be given together/)
      assert.ok(!err.message.includes("undefined"), "拒文不向外露 undefined")
      return true
    }
  )

  // ④ §7.1 第 2 行（脏 ∧ 快照在场 ⇒ 拒）——由「记快照后又落 dirty」构造该格
  const stale = fixture("ac12d", 6)
  recordWrite(stale.abs, { type: "edit", startLine: 2, shift: 1 })
  markDirty(stale.abs)
  let row2 = ""
  await assert.rejects(() => editTool.execute({ path: stale.rel, line: 5, new_string: "x" }, stale.ctx), (e) => { row2 = e.message; return true })
  assert.match(row2, /the drift cannot be measured/, "第 2 行首句：漂移不可测")
  assert.ok(!/was at L/.test(row2), "第 2 行不报上次写入点（那个值正是被判不可信的数）")
  clearDirty(stale.abs)
  clearLastWrite(stale.abs)
})

// ────────────────────────────── E7 · ACP 桥

test("AC13 ACP 桥：批量按 R1–R4 应用（同一对纯函数）、写 Buffer 成功后表里有该档的快照（绝对路径键）", async () => {
  const { root, ctx, abs } = fixture("ac13", 6)
  assert.ok(ctx.cwd === root)
  const at = (p) => (isAbsolute(p) ? p : join(root, p)) // IDE 客户端按工作区解析相对路径
  const request = async (method, params) => {
    if (method === "fs/read_text_file") return { text: readFileSync(at(params.path), "utf8") }
    if (method === "fs/write_text_file") { writeFileSync(at(params.path), params.content); return {} }
    throw new Error(`unexpected reverse-RPC: ${method}`)
  }
  const callbacks = buildAcpCallbacks({
    sessionId: "s-ac13", agent: { cwd: root }, notify: () => {}, request,
    clientCaps: { fs: { readTextFile: true, writeTextFile: true } },
  })

  const ok = await callbacks.toolRouter("edit", {
    path: "doc.md",
    edits: [{ line: 2, new_string: "A\nB" }, { line: 5, new_string: "E" }],
  })
  assert.equal(ok.handled, true)
  assert.ok(!String(ok.result).startsWith("Error"), `桥批量应成功：${ok.result}`)
  assert.deepEqual(lines(abs).slice(0, 7), ["L1", "A", "B", "L3", "L4", "E", "L6"], "降序帧：上面那条没被同批顶偏")
  assert.deepEqual(lastWriteOf(abs), { type: "edit", startLine: 2, shift: 1 }, "写缓冲成功后记账，键 = 绝对路径")

  const refused = await callbacks.toolRouter("edit", { path: "doc.md", line: 6, new_string: "F" })
  assert.ok(String(refused.result).startsWith("Error:"), "陈旧行号经桥同样拒")
  assert.equal(String(refused.result).slice("Error: ".length), lineAnchorRefusal(abs, 6, 6), "桥用同一构造器的同一句")
})

test("AC16（评审轮 1 补）桥 write 路由写缓冲成功后同记账 ⇒ 之后行号形同本地一样拒", async () => {
  const { root, abs } = fixture("ac16", 6)
  const at = (p) => (isAbsolute(p) ? p : join(root, p))
  const request = async (method, params) => {
    if (method === "fs/read_text_file") return { text: readFileSync(at(params.path), "utf8") }
    if (method === "fs/write_text_file") { writeFileSync(at(params.path), params.content); return {} }
    throw new Error(`unexpected reverse-RPC: ${method}`)
  }
  const callbacks = buildAcpCallbacks({
    sessionId: "s-ac16", agent: { cwd: root }, notify: () => {}, request,
    clientCaps: { fs: { readTextFile: true, writeTextFile: true } },
  })
  const wrote = await callbacks.toolRouter("write", { path: "doc.md", content: "W1\nW2\nW3\n" })
  assert.ok(!String(wrote.result).startsWith("Error"), "桥 write 成功")
  assert.deepEqual(lastWriteOf(abs), { type: "write", startLine: 1, shift: 0 }, "全文重写同样记账（与核 writeTool 同型）")
  const refused = await callbacks.toolRouter("edit", { path: "doc.md", line: 2, new_string: "X" })
  assert.ok(String(refused.result).startsWith("Error:"), "桥 write 之后行号形拒（本地 write 之后同判——AC3）")
  assert.match(String(refused.result), /rewritten in full/, "拒文说明整文件已重写")
})

test("AC17 回显按条目原始下标（跨文件交错亦然）——核通道与桥通道同判", async () => {
  // 交错形：doc.md → other.md → doc.md。按文件分组去排会排成 A、A、B，模型按位置对号就会错位。
  // 同档两条的回执条数不同（2 条 ∥ 1 条命中）——两维（跨文件交错 ∥ 同档条目先后）都钉住。
  const shape = () => [
    { path: "doc.md", old_string: "K", new_string: "KEEP", replace_all: true }, // 原始下标 0——命中 2 处
    { path: "other.md", line: 2 }, // 原始下标 1（跨档）
    { path: "doc.md", line: 5 }, // 原始下标 2（回到第一档）
  ]
  const docBody = "K\nK\nL3\nL4\nL5\nL6\n"
  const expectDoc = ["KEEP", "KEEP", "L3", "L4", "L6"]

  // ① 核通道（editTool → applyEditBatch）
  const core = fixture("ac17", 6)
  writeFileSync(core.abs, docBody)
  writeFileSync(join(core.root, "other.md"), "O1\nO2\nO3\nO4\n")
  const out = await editTool.execute({ edits: shape() }, core.ctx)
  assert.deepEqual(
    out.split("\n").filter((l) => /^(Edited|Deleted|edit batch)/.test(l)),
    [
      "Edited doc.md: replaced 2 occurrence(s)",
      "Deleted line 2 of other.md",
      "Deleted line 5 of doc.md",
      "edit batch: 3/3 entries — doc.md, other.md",
    ],
    "回显第 i 行 = 调用序第 i 条（不是 A、A、B）"
  )
  assert.deepEqual(read(core.abs).split("\n").slice(0, 5), expectDoc, "落盘结果不受回显排法影响")

  // ② 桥通道（toolRouter → editBatch）：同一批、同一回显序（§7.3 对两通道是一句话）
  const { root, abs } = fixture("ac17b", 6)
  writeFileSync(abs, docBody)
  writeFileSync(join(root, "other.md"), "O1\nO2\nO3\nO4\n")
  const at = (p) => (isAbsolute(p) ? p : join(root, p))
  const request = async (method, params) => {
    if (method === "fs/read_text_file") return { text: readFileSync(at(params.path), "utf8") }
    if (method === "fs/write_text_file") { writeFileSync(at(params.path), params.content); return {} }
    throw new Error(`unexpected reverse-RPC: ${method}`)
  }
  const callbacks = buildAcpCallbacks({
    sessionId: "s-ac17", agent: { cwd: root }, notify: () => {}, request,
    clientCaps: { fs: { readTextFile: true, writeTextFile: true } },
  })
  const res = await callbacks.toolRouter("edit", { edits: shape() })
  assert.ok(!String(res.result).startsWith("Error"), `桥批量应成功：${res.result}`)
  // 桥回显同样按原始下标；第 2、3 条是删行条目 ⇒ 与核同判的删行形（§7.4 / AC18）。
  assert.deepEqual(
    String(res.result).split("\n"),
    [
      "OK: edited doc.md via IDE (2 occurrence(s))",
      "Deleted line 2 of other.md via IDE",
      "Deleted line 5 of doc.md via IDE",
    ],
    "桥回显同样按原始下标（跨文件交错与同档两条先后都对得上）"
  )
  assert.deepEqual(read(abs).split("\n").slice(0, 5), expectDoc, "桥落盘结果不变")
})


test("AC18 桥逐条回执：替换条目确认形 ∥ 删行条目 `Deleted line(s) N[-M] of <path> via IDE`（与核同一 deleteTarget）；核独有的 diff / context / 汇总行桥面不写", async () => {
  // 同一批两通道各跑一次：删行那两条的 `line N` / `lines N-M` 必须与核同一取值
  const batch = () => [
    { path: "doc.md", line: 2, new_string: "A" }, // 调用序 1——替换条目
    { path: "doc.md", startLine: 4, endLine: 6 }, // 调用序 2——范围删行
    { path: "doc.md", line: 8 }, // 调用序 3——单行删行
  ]

  // ① 核通道 = 基线（替换 ∥ 范围删 ∥ 单行删 + 批末汇总行）
  const core = fixture("ac18c", 8)
  const coreOut = await editTool.execute({ edits: batch() }, core.ctx)
  const coreReceipts = coreOut.split("\n").filter((l) => /^(Edited|Deleted|edit batch)/.test(l))
  assert.deepEqual(
    coreReceipts,
    [
      "Edited doc.md: replaced 1 occurrence(s)",
      "Deleted lines 4-6 of doc.md",
      "Deleted line 8 of doc.md",
      "edit batch: 3/3 entries — doc.md",
    ],
    "核回执基线"
  )

  // ② 桥通道：同一批
  const { root, abs } = fixture("ac18b", 8)
  const at = (p) => (isAbsolute(p) ? p : join(root, p))
  const request = async (method, params) => {
    if (method === "fs/read_text_file") return { text: readFileSync(at(params.path), "utf8") }
    if (method === "fs/write_text_file") { writeFileSync(at(params.path), params.content); return {} }
    throw new Error(`unexpected reverse-RPC: ${method}`)
  }
  const callbacks = buildAcpCallbacks({
    sessionId: "s-ac18", agent: { cwd: root }, notify: () => {}, request,
    clientCaps: { fs: { readTextFile: true, writeTextFile: true } },
  })
  const res = await callbacks.toolRouter("edit", { edits: batch() })
  const out = String(res.result)
  assert.ok(!out.startsWith("Error"), `桥批量应成功：${out}`)
  assert.deepEqual(
    out.split("\n"),
    [
      "OK: edited doc.md via IDE (1 occurrence(s))",
      `${coreReceipts[1]} via IDE`, // "Deleted lines 4-6 of doc.md via IDE"
      `${coreReceipts[2]} via IDE`, // "Deleted line 8 of doc.md via IDE"
    ],
    "替换条目确认形 ∥ 删行条目 = 核回执 + ` via IDE`（同一 deleteTarget、同一取值）"
  )
  assert.deepEqual(
    out.split("\n").slice(1),
    ["Deleted lines 4-6 of doc.md via IDE", "Deleted line 8 of doc.md via IDE"],
    "删行两句的字面值也钉死（等值断言之外——核回执整句变时不跟着漂）"
  )
  assert.deepEqual(lines(abs).slice(0, 4), ["L1", "A", "L3", "L7"], "桥落盘结果与核一致")
  assert.ok(!out.includes("context (L"), "核独有的写入点上下文（要读盘）桥面不写")
  assert.ok(!/^edit batch:/m.test(out), "核独有的批末汇总行桥面不写")
  assert.ok(!/^[-+]{3} /m.test(out) && !out.includes("@@"), "核独有的 diff（要读盘并起进程）桥面不写")

  // ③ 单形态替换条目：确认形不变（editSingle 的回执面）。单形态的**删行**走不到这里——路由门
  // 要求 `new_string` 是字符串，而删行只在省略它时成立（§7.4「单形态删行不经桥」；AC19 钉那一格）。
  const one = await callbacks.toolRouter("edit", { path: "doc.md", line: 1, new_string: "Z" })
  assert.equal(String(one.result), "OK: edited doc.md via IDE (1 occurrence(s))", "单形态替换条目 = 确认形")

  // AC18 的四样里三样可机检（逐条回执两形 ∥ `deleteTarget` 取值 ∥ 桥面不写 `diff` · `context (L…)` ·
  // 批末汇总行），`autoSyntaxCheck` **不机检**：它对非 `.mjs` / `.js` 档返空串（`thincoder-core/tools/shared.mjs`
  // 的 `autoSyntaxCheck` 首行判据），本夹具（`.md`）上不可观测；为钉它换夹具并故意写坏语法，
  // 是给一条断言付两份维护成本 ⇒ 这里不断言它（§2 修正轮 5 ④）。
})

test("AC19 单形态删行不经桥：单形态 ⇒ handled:false（回落本地通道、缓冲零改）；同一构造走 `edits` 数组形态 ⇒ handled:true 且回执为删行形", async () => {
  const { root, abs } = fixture("ac19", 4)
  const at = (p) => (isAbsolute(p) ? p : join(root, p))
  const request = async (method, params) => {
    if (method === "fs/read_text_file") return { text: readFileSync(at(params.path), "utf8") }
    if (method === "fs/write_text_file") { writeFileSync(at(params.path), params.content); return {} }
    throw new Error(`unexpected reverse-RPC: ${method}`)
  }
  const callbacks = buildAcpCallbacks({
    sessionId: "s-ac19", agent: { cwd: root }, notify: () => {}, request,
    clientCaps: { fs: { readTextFile: true, writeTextFile: true } },
  })

  // ① 单形态删行 = 只给 `line`、省略 `new_string` ⇒ 路由门的 `typeof new_string === "string"` 不成立
  //    ⇒ handled:false，由 dispatch 回落本地通道（回执 = 核面 `Deleted line N of <path>`）。
  //    这就是「为什么代码里没有单形态删行支」的可复跑形——那一支已经删掉，不是被藏着。
  const before = read(abs)
  const single = await callbacks.toolRouter("edit", { path: "doc.md", line: 2 })
  assert.equal(single.handled, false, "单形态删行不经桥（路由门要求单形态的 new_string 是字符串）")
  assert.equal(single.result, undefined, "未 handled ⇒ 无结果文本（由本地通道回）")
  assert.equal(read(abs), before, "回落本地 ⇒ 桥一次缓冲都没写")

  // ② 同一构造改走 `edits` 数组形态 ⇒ 过桥；删行回执带 ` via IDE`（AC18 钉的是同一形）
  const batch = await callbacks.toolRouter("edit", { edits: [{ path: "doc.md", line: 2 }] })
  assert.equal(batch.handled, true, "数组形态过桥")
  assert.equal(String(batch.result), "Deleted line 2 of doc.md via IDE", "桥面的删行回执只来自数组形态")
  assert.deepEqual(lines(abs).slice(0, 3), ["L1", "L3", "L4"], "缓冲删掉第 2 行并写回")
})

// ────────────────────────────── E5 · 受影响面闭集

test("AC14 五条通道逐条在位（EDIT-HELPERS §7.4 通道表）+ 两条不落快照的写入口登记为「不接」", () => {
  const doc = readFileSync(join(REPO, "docs/core/design/EDIT-HELPERS.md"), "utf8")
  const all = doc.split("\n")
  /** 取某段表格的数据行（从 `**标题` 到下一个 `**` 标题之间；表头与分隔行不以 `| \`` 起）。 */
  const tableOf = (head) => {
    const start = all.findIndex((l) => l.startsWith(head))
    assert.ok(start >= 0, `§7.4 有「${head}」段`)
    const rows = []
    for (let i = start + 1; i < all.length && !/^\*\*/.test(all[i]); i++) {
      if (/^\| `/.test(all[i])) rows.push(all[i])
    }
    return rows
  }
  const cellsOf = (row) => row.split("|").map((s) => s.trim())

  // ① 通道闭集：恰好五行（一条不许缺席），判定 ∈ 三值（精确匹配，不容括注），理由列非空。
  // 括注不是第四种判定：闭集要真闭，多一个括注就让下一个读者问「还有没有别的」。
  const rows = tableOf("**通道闭集")
  assert.equal(rows.length, 5, "恰好五行（一条不许缺席）")
  const channels = ["thincoder-core/agent-tools/", "thincoder-core/tools/", "thincoder-cli/src/acp/bridge.mjs", "thincoder-vscode/src/", "thincoder-desktop/src/"]
  const DECISION = /^(已接|不接|不适用)$/
  for (const c of channels) {
    const row = rows.find((l) => l.startsWith(`| \`${c}\``))
    assert.ok(row, `通道 ${c} 在表里`)
    const cells = cellsOf(row)
    assert.match(cells[2], DECISION, `${c} 判定 ∈ {已接, 不接, 不适用}（实为 ${cells[2]}）`)
    assert.ok(cells[3].length > 0, `${c} 理由列非空`)
  }

  // ② 不落快照的写入口：两行登记，判定一律「不接」并给出理由（批次 §2 修正轮 3 ④：
  // 不留「不适用」四个字了事——它们能把行号顶偏，只是本批不接）。
  const registered = tableOf("**不落快照的写入口")
  assert.equal(registered.length, 2, "恰好两行（batch 批档直写 ∥ bash 外部进程直写）")
  for (const row of registered) {
    const cells = cellsOf(row)
    assert.equal(cells[2], "不接", `${cells[1]} 判定 = 不接`)
    assert.ok(cells[3].length > 0, `${cells[1]} 理由列非空`)
  }
})

test("AC15 两端零自有行号实现：VSC / 桌面端树内对四个符号零命中", () => {
  const symbols = /runSingleEdit|computeEditEntry|planEditEntries|applyPlannedEntries/
  const walk = (dir) => {
    const hits = []
    const visit = (p) => {
      for (const e of readdirSync(p, { withFileTypes: true })) {
        const child = join(p, e.name)
        if (e.isDirectory()) visit(child)
        else if (/\.(mjs|cjs|js|ts)$/.test(e.name) && symbols.test(readFileSync(child, "utf8"))) hits.push(child)
      }
    }
    if (statSync(dir).isDirectory()) visit(dir)
    return hits
  }
  assert.deepEqual(walk(join(REPO, "thincoder-vscode/src")), [], "VSC 端零副本")
  assert.deepEqual(walk(join(REPO, "thincoder-desktop/src")), [], "桌面端零副本")
})

test("附·纯函数层：planEditEntries 给降序计划与重叠拒（帧单源的直接读数）", () => {
  const plan = planEditEntries([{ line: 2 }, { old_string: "a", new_string: "b" }, { line: 9 }, { startLine: 5, endLine: 6 }], "doc.md")
  assert.deepEqual(plan.order, [2, 3, 0, 1], "行号条目降序在前、内容条目随后")
  assert.equal(plan.rejection, null)
  const bad = planEditEntries([{ line: 3 }, { startLine: 2, endLine: 4 }], "doc.md")
  assert.equal(bad.order, null)
  assert.match(bad.rejection, /overlap/)
})
