/**
 * memory-tool.test.mjs — memory 工具 layer 统一 + delete 语义修正（2026-09-08，MEMORY.md §6.2）：
 * AC1 工具面参数 scope→layer / AC2 delete 单删 layer 可选（不传按 id 前缀路由）/
 * AC3 deleteByUid 尊重 uid origin 段 / AC4 输出与错误串全 layer 无 scope 词 /
 * AC5 工具描述重写（无 scope + delete layer 可选）+ 设计② list 行 [layer] 标签。
 *
 * 快层：in-memory sqlite + 少量 tmp 目录写删——无 git、无网络、无长 IO。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createMemory, memoryTools, putMarkdown, deleteByUid, search } from "@thincoder/core/memory.mjs"

/** Fresh memory db + tmp dirs. t.after removes the tmp base. */
async function fresh(t) {
  const base = await mkdtemp(join(tmpdir(), "thincoder-memtest-"))
  const dirA = join(base, "projA")
  const dirB = join(base, "projB")
  await mkdir(dirA, { recursive: true })
  await mkdir(dirB, { recursive: true })
  t.after(() => rm(base, { recursive: true, force: true }))
  const mem = createMemory({ dbPath: ":memory:" }) // no projectOrigin → searches span all origins
  const toolOf = (projectDir) => memoryTools(mem, { cwd: base, projectDir, author: "tester" }).find((x) => x.name === "memory")
  return { base, dirA, dirB, mem, toolA: toolOf("projA"), toolB: toolOf("projB") }
}

// ---- AC1: 工具 schema 参数 scope→layer（无 scope 残留） ----------------------

test("AC1 schema: 参数名 layer（无 scope 字段），layer 枚举 personal/project/team", async (t) => {
  const { mem } = await fresh(t)
  const tool = memoryTools(mem, { cwd: process.cwd(), author: "t" })[0]
  const props = tool.parameters.properties
  assert.ok(props.layer, "layer property present")
  assert.equal(props.scope, undefined, "no scope property")
  assert.deepEqual(props.layer.enum, ["personal", "project", "team"])
  assert.ok(!/scope/i.test(JSON.stringify(props.layer)), "layer property description has no scope word")
})

// ---- AC2: delete 单删 layer 可选 --------------------------------------------

test("AC2 单删不传 layer 按 id 前缀路由（put 返回的 id 直接可删）", async (t) => {
  const { toolA } = await fresh(t)
  const putOut = await toolA.execute({ action: "put", type: "knowledge", title: "t1", content: "apple pie" })
  assert.ok(putOut.startsWith("Saved to personal memory (id=personal:1)"), putOut)
  const delOut = await toolA.execute({ action: "delete", id: "personal:1" }) // NO layer — previously threw "delete requires id + scope"
  assert.ok(delOut.startsWith("Deleted personal:1: t1"), delOut)
})

test("AC2 裸数字 id（legacy personal 兼容）不传 layer 可删", async (t) => {
  const { toolA } = await fresh(t)
  await toolA.execute({ action: "put", type: "rule", title: "r1", content: "banana" })
  const out = await toolA.execute({ action: "delete", id: "1" })
  assert.ok(out.startsWith("Deleted personal:1: r1"), out)
})

test("AC2 layer 传入且匹配 → 正常删；不匹配 → 拒删（防误删护栏）", async (t) => {
  const { toolA } = await fresh(t)
  await toolA.execute({ action: "put", type: "rule", title: "r2", content: "cherry" })
  const ok = await toolA.execute({ action: "delete", id: "personal:1", layer: "personal" })
  assert.ok(ok.startsWith("Deleted personal:1: r2"), ok)

  await toolA.execute({ action: "put", type: "rule", title: "r3", content: "date" })
  await assert.rejects(
    () => toolA.execute({ action: "delete", id: "personal:2", layer: "project" }),
    (e) => e.message === "id prefix personal: 与 layer project 不匹配",
  )
  const listOut = await toolA.execute({ action: "list", layer: "personal" })
  assert.ok(listOut.includes("personal:2"), "mismatch refused → entry survives")
})

test("AC2 批删（无 id）layer 必填 + type/keyword 至少其一 + confirm:true", async (t) => {
  const { toolA } = await fresh(t)
  await assert.rejects(() => toolA.execute({ action: "delete", keyword: "x" }), /batch delete requires layer/)
  await toolA.execute({ action: "put", type: "rule", title: "b1", content: "keyframe unique" })
  await toolA.execute({ action: "put", type: "rule", title: "b2", content: "keyframe unique" })
  const preview = await toolA.execute({ action: "delete", layer: "personal", keyword: "keyframe" })
  assert.ok(preview.includes("confirm:true required"), "no confirm → preview")
  assert.ok(preview.includes("[personal]"), "batch preview rows carry [layer] label")
  const out = await toolA.execute({ action: "delete", layer: "personal", keyword: "keyframe", confirm: true })
  assert.equal(out, "Deleted 2 entries in layer personal")
})

// ---- AC3: deleteByUid 尊重 uid origin 段 -------------------------------------

test("AC3 deleteByUid 文件定位用 uid origin（当前 dirs 指向别处也删 origin 处文件）", async (t) => {
  const { dirA, dirB, mem } = await fresh(t)
  const f = await putMarkdown(mem, { layer: "project", dir: dirA, type: "decision", title: "origin-A", content: "lives in dirA", tags: [], author: "t" })
  assert.ok(existsSync(join(dirA, f)))
  // current dirs point at dirB — deletion must still hit dirA (the uid origin)
  const e = await deleteByUid(mem, `project:${dirA}:${f}`, { dirs: { project: dirB, team: null } })
  assert.equal(e.id, `project:${dirA}:${f}`)
  assert.ok(!existsSync(join(dirA, f)), "file deleted in uid-origin dirA")
  const row = mem.db.prepare(`SELECT 1 FROM files WHERE layer='project' AND origin=? AND path=?`).get(dirA, f)
  assert.ok(!row, "index row cleared via syncDir(dirA)")
  // dirB untouched
  const inB = mem.db.prepare(`SELECT COUNT(*) c FROM files WHERE layer='project' AND origin=?`).get(dirB)
  assert.equal(inB.c, 0)
})

test("AC3 origin 目录本地缺失 → ENOENT 容错 + syncDir 清索引", async (t) => {
  const { base, mem } = await fresh(t)
  const dirC = join(base, "projC")
  await mkdir(dirC, { recursive: true })
  const f = await putMarkdown(mem, { layer: "project", dir: dirC, type: "knowledge", title: "doomed", content: "x", tags: [], author: "t" })
  await rm(dirC, { recursive: true, force: true }) // dir vanishes locally, row remains in db
  const e = await deleteByUid(mem, `project:${dirC}:${f}`, { dirs: {} }) // no dirs at all — origin resolves itself
  assert.ok(e, "ENOENT-tolerant delete returns the entry")
  const row = mem.db.prepare(`SELECT 1 FROM files WHERE layer='project' AND origin=? AND path=?`).get(dirC, f)
  assert.ok(!row, "stale (layer, origin) row cleared for a vanished dir")
})

test("AC3+AC2 工具级：search 带出的非当前 origin id 直接可删（另一工具实例当前目录不同）", async (t) => {
  const { dirB, toolA, toolB, mem } = await fresh(t)
  const f = await putMarkdown(mem, { layer: "project", dir: dirB, type: "decision", title: "cross-tool", content: "grape", tags: [], author: "t" })
  const res = await toolA.execute({ action: "search", query: "cross-tool" })
  assert.ok(res.includes(`[project][decision] cross-tool (id=project:${dirB}:${f})`), res)
  // toolB 的当前 projectDir 也是 dirB，这里故意经 toolA（当前目录 dirA）删 dirB 的 id
  const out = await toolA.execute({ action: "delete", id: `project:${dirB}:${f}` })
  assert.ok(out.startsWith(`Deleted project:${dirB}:${f}`), out)
  assert.ok(!existsSync(join(dirB, f)), "file gone from its real origin dir")
})

test("AC3 护栏（code review #6）：无索引行的伪造 origin 不得删任意可解析 md", async (t) => {
  const { base, mem } = await fresh(t)
  const dirX = join(base, "unmanaged")
  await mkdir(dirX, { recursive: true })
  // 一个从未被索引的"memory 形"文件（合法 frontmatter + 内容）
  const fx = "unmanaged.md"
  await writeFile(join(dirX, fx), "---\ntype: rule\ntitle: sneaky\ntags: []\nauthor: t\n---\nsecret\n", "utf8")
  await assert.rejects(
    () => deleteByUid(mem, `project:${dirX}:${fx}`, { dirs: {} }),
    /not a managed project memory dir/,
  )
  assert.ok(existsSync(join(dirX, fx)), "unmanaged file survives")
})

// ---- AC3b: deleteByUid 畸形 uid 尾缀拒绝（2.2 批——CODE-HARDENING-BATCH §2.2） ----

test("2.2 畸形 uid 尾缀（personal:1:extra）报错不删；正常 personal:1 可删", async (t) => {
  const { mem, toolA } = await fresh(t)
  await toolA.execute({ action: "put", type: "rule", title: "suffix-guard", content: "must survive" })
  // personal:1:extra 此前只查首段 5 是数字 → 尾缀放行 → 静默删 id=1（bug）
  await assert.rejects(
    () => toolA.execute({ action: "delete", id: "personal:1:extra" }),
    (e) => e.message === "invalid memory id: personal:1:extra",
  )
  const list = await toolA.execute({ action: "list", layer: "personal" })
  assert.ok(list.includes("personal:1"), "畸形 uid 被拒 → entry survives")
  // 单删原语层同拒
  await assert.rejects(() => deleteByUid(mem, "personal:1:extra", { dirs: {} }), /invalid memory id/)
  // 正常 personal:1 删得掉（无回归）
  const out = await toolA.execute({ action: "delete", id: "personal:1" })
  assert.ok(out.startsWith("Deleted personal:1: suffix-guard"), out)
})

// ---- AC4: 输出/错误串全 layer，无 scope 词 ------------------------------------

test("AC4 错误串 layer（not found / clear / invalid layer / mismatch）", async (t) => {
  const { toolA } = await fresh(t)
  await assert.rejects(() => toolA.execute({ action: "delete", id: "personal:999" }), /not found in layer personal/)
  await assert.rejects(() => toolA.execute({ action: "clear" }), /clear requires layer "personal"/)
  await assert.rejects(() => toolA.execute({ action: "search", query: "x", layer: "bogus" }), /invalid layer/)
  await assert.rejects(() => toolA.execute({ action: "put", layer: "bogus", type: "rule", title: "x", content: "y" }), /invalid layer/)
  await assert.rejects(() => toolA.execute({ action: "put", layer: "team", type: "rule", title: "x", content: "y" }), /team layer not configured/)
})

test("AC4 输出与错误串不含 scope 词（模型可见文本全 layer）", async (t) => {
  const { toolA } = await fresh(t)
  const outs = []
  outs.push(await toolA.execute({ action: "put", type: "rule", title: "s1", content: "fig" }))
  outs.push(await toolA.execute({ action: "list", layer: "personal" }))
  outs.push(await toolA.execute({ action: "delete", id: "personal:1" }))
  outs.push(await toolA.execute({ action: "clear", layer: "personal", confirm: true }))
  for (const o of outs) assert.ok(!/scope/i.test(o), `no scope word in output: ${o}`)
  const tool = memoryTools({ db: {} }, { cwd: process.cwd(), author: "t" })[0] // schema/description only
  assert.ok(!/scope/i.test(tool.description), "tool description has no scope word")
  assert.ok(!/scope/i.test(JSON.stringify(tool.parameters)), "schema JSON has no scope word")
})

// ---- AC5: 工具描述要点 --------------------------------------------------------

test("AC5 描述：delete 单删 layer 可选（传校验/不传按前缀路由），search/list [layer] 标签", async (t) => {
  const { mem } = await fresh(t)
  const desc = memoryTools(mem, { cwd: process.cwd(), author: "t" })[0].description
  assert.ok(desc.includes("layer is optional"), "delete layer optional described")
  assert.ok(/omitted the id prefix routes/.test(desc) || /auto-route by the id prefix/.test(desc), "omit → route by prefix described")
  assert.ok(desc.includes("[layer]"), "[layer] label mapping described")
  assert.ok(/BATCH \(no id\): \{layer/.test(desc), "batch (no id) requires layer described")
})

// ---- 设计② list 行 [layer] 标签 + 输出行格式 ----------------------------------

test("② list 行带 [layer] 标签（与 search 行对齐），personal id 前缀一致", async (t) => {
  const { toolA } = await fresh(t)
  await toolA.execute({ action: "put", type: "rule", title: "listed-row", content: "list label check" })
  const out = await toolA.execute({ action: "list", layer: "personal" })
  assert.match(out, /^\[personal\] personal:\d+ \[rule\] listed-row（\d{4}-\d{2}-\d{2}）$/)
})

test("工具层 import 面：hub 导出与 split 后引用一致", async () => {
  const { deleteByUid: dbu, matchMemoryRows: mmr, deleteWhere: dw, remove } = await import("@thincoder/core/memory.mjs")
  assert.equal(typeof dbu, "function")
  assert.equal(typeof mmr, "function")
  assert.equal(typeof dw, "function")
  assert.equal(typeof remove, "function")
})
