/**
 * batch-paths.test.mjs — 批次档相对路径解析序与防嵌套（`BATCH-RECORD.md` §4.15 · 台账 #287 · 2026-09-25 批）。
 *
 * 用例 BR-27–BR-35：**cwd 四形**（项目根 / 项目内子目录 / 项目根的上级目录 / 非项目目录）× **串四形**
 * （裸名 / 根相对 / cwd 相对 / 绝对）+ 防嵌套（段边界判——BR-35）+ 锚定 fail-closed（BR-32）+ 序内
 * 边界（② 先于 ③——行为变更登记面）+ AC-BP-1 结构机检（四处调用点经 `batch-paths.mjs`，零第二份实现）。
 * 手法：临时目录夹具（project root 走**真判据**——manifest / 祖先链 / 发现梯；零 `_setProjectRootForTest`
 * 注入 ⇒ 顺带覆盖取根单源）；spawn 门形态的用例住 CLI 门档（BR-33）。
 */
import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { batchTool } from "../agent-tools/batch.mjs"
import { batchDocBases, resolveBatchDocPath, resolveBatchReadPath } from "../agent-tools/batch-paths.mjs"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
let tmp, nest, proj, nonproj, proj2, seq = 0

const record = () => "# 批次档（夹具）\n\n## §1 讨论（主 agent）\n\n**状态行**：🔄 进行中（夹具）\n"
const depth0 = (cwd) => ({ cwd, depth: 0, agent: { cwd } })
const manifest = (batches) => JSON.stringify({ version: 1, phase: "initial-dev", docRoot: { batches } })
const mkRecord = (rel) => { const abs = resolve(proj, rel); mkdirSync(dirname(abs), { recursive: true }); writeFileSync(abs, record()); return abs }
/** create 便捷调用（topic/source 走夹具默认值——路径面才是本档对象）。 */
const create = (cwd, path) => batchTool(null).execute({ action: "create", path, topic: "t", source: "夹具" }, depth0(cwd))

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), "batch-paths-"))
  nest = join(tmp, "nest")            // 项目根的上级目录（③ 形——恰一子项目 ⇒ 发现梯 unique）
  proj = join(nest, "proj")           // 项目根（① 形）
  proj2 = join(tmp, "other", "proj2") // 第二位项目根（声明基底非默认值；不与 proj 同级——避发现梯歧义）
  nonproj = join(tmp, "nonproj")      // 非项目目录（④ 形——无 manifest / 无 .git / 零带档子目录）
  for (const d of [join(proj, "docs", "batches"), join(proj, "src"), join(proj2, "docs", "batches"), nonproj]) mkdirSync(d, { recursive: true })
  writeFileSync(join(proj, "PROJECT-MANIFEST.json"), manifest("docs/batches"))
  writeFileSync(join(proj2, "PROJECT-MANIFEST.json"), manifest("batch-files"))
})
afterEach(() => rmSync(tmp, { recursive: true, force: true }))

// ── BR-27 / BR-28：create 收根相对串（原静默嵌套 ⇒ 本批收正）─────────────────────
test("BR-27/BR-28 正常：create + 根相对串 ⇒ 落基底根、零嵌套（cwd = 项目根 / 子目录 / 上级目录）", async () => {
  for (const [label, cwd] of [["项目根", proj], ["项目内子目录", join(proj, "src")], ["项目根的上级目录", nest]]) {
    const name = `2026-09-25-b${++seq}.md`
    await create(cwd, `docs/batches/${name}`)
    assert.ok(existsSync(join(proj, "docs", "batches", name)), `${label}：落 docs/batches`)
    assert.ok(!existsSync(join(proj, "docs", "batches", "docs")), `${label}：零静默嵌套（#287 主症）`)
  }
})

test("BR-30 正常：create + cwd 相对串（cwd = 项目子目录）⇒ 首个落基底内候选", async () => {
  const name = `2026-09-25-c${++seq}.md`
  await create(join(proj, "docs"), `batches/${name}`)
  assert.ok(existsSync(join(proj, "docs", "batches", name)), "cwd 相对串经 ① 腿落基底内")
})

test("BR-27c 正常：声明基底非默认值 ⇒ 锚定按声明前缀（不写死 docs/batches）", async () => {
  await create(proj2, `batch-files/2026-09-25-d${++seq}.md`)
  assert.ok(existsSync(join(proj2, "batch-files", `2026-09-25-d${seq}.md`)), "锚定串只解析项目根形")
  assert.equal(batchDocBases(proj2)[0], join(proj2, "batch-files"), "基底单源 = manifest docRoot.batches")
})

// ── BR-29 / 序内边界：读面收根相对串（原 throw）+ ② 先于 ③ ────────────────────────
test("BR-29 正常：读面（append/评审门同函数）cwd ≠ 项目根 + 根相对串 ⇒ 解析成功（此前必 throw）", () => {
  const abs = mkRecord("docs/batches/read.md")
  for (const [label, cwd] of [["项目根", proj], ["项目内子目录", join(proj, "src")], ["项目根的上级目录", nest]]) {
    assert.equal(resolveBatchDocPath(cwd, "docs/batches/read.md"), abs, `${label}：根相对串解析到在档`)
  }
  assert.throws(() => resolveBatchDocPath(join(proj, "src"), "docs/batches/none.md"), /batchDoc is not a readable file/, "不可读仍拒（判据句零变）")
  assert.throws(() => resolveBatchDocPath(join(proj, "src"), "   "), /batchDoc must be a non-empty path/, "空值文案逐字零变")
})

test("序内边界（行为变更登记）：<项目根>/p 与 <基底>/p 并存 ⇒ 读面取 ②（先于 ③）", () => {
  const viaRoot = mkRecord("docs/batches/edge.md")                        // ② 腿命中
  const viaBase = mkRecord("docs/batches/docs/batches/edge.md")           // ③ 腿命中（同前缀嵌套幽灵档）
  assert.equal(resolveBatchDocPath(join(proj, "src"), "docs/batches/edge.md"), viaRoot, "② 先于 ③")
  assert.equal(resolveBatchDocPath(viaBase && join(proj, "src"), "docs/batches/edge.md"), viaRoot, "③ 腿的幽灵档不再胜出（防御性收窄）")
})

// ── BR-35：段边界判 —— `docs/batches-old/` 不锚定 ────────────────────────────────
test("BR-35 边界：`docs/batches-old/<x>.md` 前缀同形但 `-` 非段边界 ⇒ 不锚定、零 fail-closed", async () => {
  const old = mkRecord("docs/batches-old/old.md")
  assert.equal(resolveBatchDocPath(join(proj, "src"), "docs/batches-old/old.md"), old, "读面照候选序命中（② 腿）")
  const name = `old-${++seq}.md`
  await create(join(proj, "src"), `docs/batches-old/${name}`)
  assert.ok(existsSync(join(proj, "docs", "batches", "docs", "batches-old", name)), "create：照候选序（③ 腿 = 基底相对）——不做启发式改写")
})

// ── BR-32：锚定串不落基底内 ⇒ fail-closed 新文案（不二次拼接）────────────────────
test("BR-32 错误：锚定串越出声明基底 ⇒ fail-closed 新文案（不二次拼接、零落盘）", async () => {
  const raw = "docs/batches/../../outside-escape.md"
  await assert.rejects(create(proj, raw), {
    message: `batch: create path is anchored at a batch base root but does not resolve under the declared docRoot.batches root(s) — refusing to nest it (fail-closed). Path: ${raw}`,
  })
  assert.ok(!existsSync(join(nest, "outside-escape.md")), "拒后零落盘")
  // 前缀不匹配声明基底 ⇒ 不做启发式改写（§4.15 边界：照候选序，非 fail-closed）
  const name = `2026-09-25-e${++seq}.md`
  await create(proj2, `docs/batches/${name}`)
  assert.ok(existsSync(join(proj2, "batch-files", "docs", "batches", name)), "落声明基底内（基底相对腿）")
})

// ── BR-31：零变面 —— 绝对路径（基底内通过 / 越基底拒——原文案逐字）────────────────
test("BR-31 边界：create + 绝对路径 ⇒ 基底内通过 / 越基底拒（文案逐字零变）", async () => {
  const inside = join(proj, "docs", "batches", `abs-${++seq}.md`)
  await create(proj, inside)
  assert.ok(existsSync(inside), "基底内绝对路径通过")
  const outside = join(proj, "outside-abs.md")
  await assert.rejects(create(proj, outside), {
    message: `batch: create path resolves outside the batch-record base roots — a batch record must live under the declared docRoot.batches base (fail-closed). Path: ${outside}`,
  })
  assert.ok(!existsSync(outside), "越基底零落盘")
})

// ── BR-34：非项目 cwd（无 manifest）⇒ 基底回退默认值；读面形态零回归 ───────────────
test("BR-34 边界：非项目 cwd ⇒ create 落默认基底（<cwd>/docs/batches）；读面 v1 单基底语义零变", async () => {
  const name = `2026-09-25-f${++seq}.md`
  await create(nonproj, name)
  assert.ok(existsSync(join(nonproj, "docs", "batches", name)), "基底回退默认值（<cwd>/docs/batches）")
  const abs = join(nonproj, "docs", "batches", "read2.md")
  writeFileSync(abs, record())
  assert.equal(resolveBatchDocPath(nonproj, "docs/batches/read2.md"), abs, "读面 cwd 腿命中（零回归）")
  assert.equal(resolveBatchReadPath(nonproj, "read2.md"), null, "无 manifest ⇒ 无基底腿（v1 单基底语义零变）")
})

// ── AC-BP-1：结构机检 —— 四处调用点经 batch-paths.mjs，零第二份解析实现 ──────────
test("AC-BP-1 结构机检：四处调用点经单源叶档；主档只 re-export；零第二份解析实现", () => {
  const read = (rel) => readFileSync(join(ROOT, rel), "utf8")
  const paths = read("agent-tools/batch-paths.mjs")
  for (const fn of ["batchDocBases", "resolveBatchDocPath", "resolveBatchReadPath", "resolveBatchCreatePath"]) {
    assert.match(paths, new RegExp(`export function ${fn}\\(`), `叶档导出：${fn}`)
  }
  // 字面断言避开 `from "<spec>"` 形态（机检 import 抽取面会把它当作真 import——同 hygiene 档同名反例）
  const batch = read("agent-tools/batch.mjs")
  assert.ok(batch.includes("batch-paths.mjs") && batch.includes("batchDocBases, resolveBatchDocPath"), "读面 + 基底经单源")
  assert.doesNotMatch(batch, /export function resolveBatchDocPath/, "主档零第二份解析实现")
  assert.doesNotMatch(batch, /export function batchDocBases/, "主档零第二份基底实现")
  assert.match(batch, /export \{ SEGMENT_BY_ROLE, batchDocBases, resolveBatchDocPath \}/, "既有 import 面经 re-export 保留")
  const life = read("agent-tools/batch-lifecycle.mjs")
  assert.ok(life.includes("batch-paths.mjs") && life.includes("resolveBatchCreatePath"), "create 面经单源")
  assert.doesNotMatch(life, /function assertInsideBases/, "越基底判据迁出（零第二份）")
  const spawn = read("agent-tools/subagent-spawn.mjs")
  assert.ok(spawn.includes("batch-paths.mjs") && spawn.includes("resolveBatchReadPath"), "spawn 门经单源（读面非抛形）")
  assert.doesNotMatch(spawn, /resolve\(parent\.cwd \?\? process\.cwd\(\), given/, "门内旧单基底解析已删")
  const advisor = read("agent-tools/advisor.mjs")
  assert.ok(advisor.includes("resolveBatchDocPath") && advisor.includes("./batch.mjs"), "评审门经主档 re-export（零改面）")
})
