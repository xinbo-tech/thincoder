/**
 * 2026-10-05-engine-tools-gaps.test.mjs — 批次本地单元件（#942 ∥ #943 · 随批留存归档）。
 * 名随批次档 · 住批次目录 · 不进仓套件；复跑（任意 cwd 可跑——仓根经 import.meta.url 定位）：
 *   node --test docs/batches/2026-10-05-engine-tools-gaps.test.mjs
 *
 * 腿 = 批档 §2.5 红绿表（红基线 = 实施前实跑读数；在批档 §5 实施记录）：
 *   #942-①a 跨仓基底 + `docs/batches/<x>.md`：纯函数 ⇒ 基底自有项目根落点（原静默嵌套 `<基底>/docs/batches/docs/batches/…`）；
 *   #942-①b tool 级 create ⇒ 落 `<B2>/<file>` + 回执正确 + 无嵌套目录（反证）；
 *   #942-② 多段相对串（`docs/batches-old/<x>.md`）⇒ 通用 fail-closed 拒（原静默嵌套）；
 *   #942-③ 双基底双落点 ⇒ 显式拒（列候选；原静默取 bases[0]）；
 *   #942-回归 BR-27/28/30 ∥ bare 单段 ∥ 绝对 ∥ 锚定逃逸拒 ∥ #828 四腿 ∥ none 态——零变；
 *   #943-op 面 `writeThroughPath` `rmdir` 臂：空目录移除 ∥ 非空 ENOTEMPTY 上抛 ∥ 不记 dirty；
 *   #943-① 空目录 delete 成功（回执 `Deleted <path>`；目录消失）；
 *   #943-② 非空目录 ⇒ 拒句逐字 + 目录与内容零损；
 *   #943-③ symlink→dir ⇒ 删链接本体（目标存活）∥ 嵌套空树：非底拒 / 自底向上全成；
 *   #943-回归 tracked 拒 ∥ force 通行 ∥ missing 文案 ∥ 文件臂回执/记账——零变。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { chmodSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { spawnSync } from "node:child_process"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const ROOT = fileURLToPath(new URL("../../", import.meta.url)) // 仓根（thincoder/）
const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href)
const PATHS = await load("thincoder-core/agent-tools/batch-paths.mjs")
const BATCH = await load("thincoder-core/agent-tools/batch.mjs")
const GATE = await load("thincoder-core/agent/write-gate.mjs")
const PATCH = await load("thincoder-core/tools/patch.mjs")
const WP = await load("thincoder-core/tools/write-path.mjs")
const DEL = PATCH.deleteTool

const out = (label, value) => console.log(`[读数] ${label}: ${value}`)
const created = []
const tmp = (tag) => { const d = realpathSync(mkdtempSync(join(tmpdir(), `etg-${tag}-`))); created.push(d); return d }
/** 递归清只读位（Windows：git 松散对象 mode 444 ⇒ rmSync EPERM——先清位再删；链接本体跳过）。 */
function chmodTree(p) {
  let st
  try { st = lstatSync(p) } catch { return }
  if (st.isDirectory()) { for (const n of readdirSync(p)) chmodTree(join(p, n)); try { chmodSync(p, 0o777) } catch {} }
  else if (!st.isSymbolicLink()) { try { chmodSync(p, 0o666) } catch {} }
}
const cleanup = () => {
  for (const d of created.splice(0)) {
    try { rmSync(d, { recursive: true, force: true }) } catch { chmodTree(d); rmSync(d, { recursive: true, force: true }) }
  }
}
const dctx = (cwd) => ({ cwd }) // delete 工具 ctx（resolveInCwd = realCwd(cwd) + resolve）
const create = (tool, cwd, path, topic) => tool.execute({ action: "create", path, topic, source: "夹具" }, { agent: { cwd }, depth: 0 })

/** 最小合法 manifest（`docRoot.batches` 可声明串 / 数组；余键走缺键 fallback）。 */
function mkManifest(dir, batches = "docs/batches") {
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, "PROJECT-MANIFEST.json"), JSON.stringify({ version: 1, phase: "initial-dev", docRoot: { batches } }, null, 2))
  return dir
}

/* ── #942-① 跨仓基底：基底自有项目根落点（纯函数 ∥ tool 级） ─────────────────────── */

test("#942-①a 跨仓基底：纯函数 ⇒ 基底自有项目根落点（原静默嵌套）", () => {
  const box = tmp("942a")
  const repoB = mkManifest(join(box, "repo-b"))
  const B2 = join(repoB, "docs", "batches")
  const projA = mkManifest(join(box, "proj-a"), B2) // cwd 项目声明他仓基底（跨仓形——基底不落 cwd 项目根下）
  try {
    const bases = PATHS.batchDocBases(projA)
    assert.deepEqual(bases, [B2], "前置：声明面 = 他仓基底单根")
    const p = PATHS.resolveBatchCreatePath(projA, "docs/batches/2026-10-05-cross.md", bases)
    assert.equal(p, join(B2, "2026-10-05-cross.md"), "落基底自有项目根（不二次拼接）")
    out("#942-①a", `纯函数 ⇒ ${p}`)
  } finally { cleanup() }
})

test("#942-①b 跨仓基底：tool 级 create ⇒ 正确落点 + 回执 + 无嵌套（原嵌套落盘）", async () => {
  const box = tmp("942a2")
  const repoB = mkManifest(join(box, "repo-b"))
  const B2 = join(repoB, "docs", "batches")
  const projA = mkManifest(join(box, "proj-a"), B2)
  try {
    const msg = await create(BATCH.batchTool(null), projA, "docs/batches/2026-10-05-cross.md", "cross")
    const landed = join(B2, "2026-10-05-cross.md")
    assert.ok(existsSync(landed), `落盘：${landed}`)
    assert.ok(msg.includes(landed), "回执含正确落点")
    assert.ok(!msg.includes("docs\\batches\\docs") && !msg.includes("docs/batches/docs"), "回执无嵌套错路径")
    assert.equal(existsSync(join(B2, "docs")), false, "无嵌套目录（反证）")
    out("#942-①b", "tool 级落盘 ✓ · 回执 ✓ · 嵌套缺席 ✓")
  } finally { cleanup() }
})

/* ── #942-② 多段相对串 ⇒ 通用 fail-closed（不二次拼接） ─────────────────────────── */

test("#942-② 多段相对串（同前缀异形）⇒ 通用 fail-closed（原静默嵌套）", async () => {
  const box = tmp("942b")
  const repoB = mkManifest(join(box, "repo-b"))
  const B2 = join(repoB, "docs", "batches")
  const projA = mkManifest(join(box, "proj-a"), B2)
  try {
    const raw = "docs/batches-old/2026-10-05-old.md"
    assert.throws(() => PATHS.resolveBatchCreatePath(projA, raw, PATHS.batchDocBases(projA)), /resolves outside the batch-record base roots/, "纯函数：通用 fail-closed")
    await assert.rejects(() => create(BATCH.batchTool(null), projA, raw, "old"), /resolves outside the batch-record base roots/, "tool 级同拒")
    assert.equal(existsSync(join(B2, "docs", "batches-old")), false, "零写（不建嵌套树）")
    out("#942-②", "通用 fail-closed ✓ · 零写 ✓")
  } finally { cleanup() }
})

/* ── #942-③ 双基底双落点 ⇒ 显式拒（列候选） ──────────────────────────────────────── */

test("#942-③ 多基底同形 ⇒ 多落点显式拒（列候选；原静默取 bases[0]）", () => {
  const box = tmp("942c")
  const B1 = join(mkManifest(join(box, "repo-c1")), "docs", "batches")
  const B2 = join(mkManifest(join(box, "repo-c2")), "docs", "batches")
  const projD = mkManifest(join(box, "proj-d"), [B1, B2])
  try {
    assert.deepEqual(PATHS.batchDocBases(projD), [B1, B2], "前置：声明面双基底")
    assert.throws(() => PATHS.resolveBatchCreatePath(projD, "docs/batches/2026-10-05-z.md", PATHS.batchDocBases(projD)), (e) => {
      assert.ok(e.message.includes("resolves under more than one declared batch-record base"), "逐字句锚")
      assert.ok(e.message.includes(join(B1, "2026-10-05-z.md")) && e.message.includes(join(B2, "2026-10-05-z.md")), "候选落点全列")
      return true
    }, "多落点 ⇒ 显式拒（不静默取首个）")
    out("#942-③", "多落点显式拒 ✓（候选全列）")
  } finally { cleanup() }
})

/* ── #942-回归：零变面采样（BR-27/28/30 ∥ bare ∥ 绝对 ∥ 锚定逃逸 ∥ #828 四腿 ∥ none） ── */

test("#942-回归 零变面采样：既有落点 / 拒面 / #828 四腿 / none 态", async () => {
  const box = tmp("942r")
  const root = mkManifest(join(box, "proj"))
  const batches = join(root, "docs", "batches")
  const tool = BATCH.batchTool(null)
  const bases = () => PATHS.batchDocBases(root)
  try {
    // BR-27 / 28：项目根 ∥ 子目录 cwd + 根相对串 ⇒ 落基底（不嵌套）
    await create(tool, root, "docs/batches/2026-10-05-r1.md", "r1")
    await create(tool, join(root, "docs"), "docs/batches/2026-10-05-r2.md", "r2")
    assert.ok(existsSync(join(batches, "2026-10-05-r1.md")) && existsSync(join(batches, "2026-10-05-r2.md")), "BR-27/28")
    // BR-30：基底父目录 cwd + cwd 相对串 ∥ bare 单段（收窄回归）∥ 绝对（内通过 / 外拒）
    assert.equal(PATHS.resolveBatchCreatePath(join(root, "docs"), "batches/2026-10-05-r3.md", PATHS.batchDocBases(join(root, "docs"))), join(batches, "2026-10-05-r3.md"), "BR-30")
    assert.equal(PATHS.resolveBatchCreatePath(root, "r4.md", bases()), join(batches, "r4.md"), "bare 单段")
    assert.equal(PATHS.resolveBatchCreatePath(root, join(batches, "r5.md"), bases()), join(batches, "r5.md"), "绝对（基底内）")
    assert.throws(() => PATHS.resolveBatchCreatePath(root, join(box, "outside.md"), bases()), /resolves outside the batch-record base roots/, "绝对（越基底）")
    assert.throws(() => PATHS.resolveBatchCreatePath(root, "docs/batches/../../esc.md", bases()), /refusing to nest it/, "锚定逃逸拒（逐字锚）")
    // #828 四腿：歧义拒 ∥ 所属落 ∥ 读面候选腿 ∥ 写门候选并集
    const amb = tmp("942r-amb")
    const alpha = mkManifest(join(amb, "alpha"))
    const beta = mkManifest(join(amb, "beta"))
    await assert.rejects(() => create(tool, amb, "docs/batches/2026-10-05-a0.md", "a0"), /ambiguous session anchor/, "歧义拒")
    await create(tool, amb, "alpha/docs/batches/2026-10-05-a1.md", "a1")
    const a1 = join(alpha, "docs", "batches", "2026-10-05-a1.md")
    assert.ok(existsSync(a1), "所属落（alpha 基底）")
    assert.equal(PATHS.resolveBatchReadPath(amb, "docs/batches/2026-10-05-a1.md"), a1, "读面候选腿")
    assert.ok(GATE.batchRecordWriteConflict({ cwd: amb, _batchDoc: a1 }, 1, [join(beta, "docs", "batches", "b.md")]), "写门候选并集")
    // none 态：缺省基底回退 + 落盘
    const none = tmp("942r-none")
    assert.deepEqual(PATHS.batchDocBases(none), [join(none, "docs", "batches")], "缺省基底")
    await create(tool, none, "docs/batches/2026-10-05-n1.md", "n1")
    assert.ok(existsSync(join(none, "docs", "batches", "2026-10-05-n1.md")), "none 落盘")
    out("#942-回归", "BR-27/28/30 ✓ · bare ✓ · 绝对 ✓ · 锚定逃逸 ✓ · #828 四腿 ✓ · none ✓")
  } finally { cleanup() }
})

/* ── #943-op 面：writeThroughPath `rmdir` 臂 ────────────────────────────────────── */

test("#943-op 面：`rmdir` 臂——空目录移除 ∥ 非空 ENOTEMPTY 上抛 ∥ 不记 dirty", async () => {
  const dir = tmp("943op")
  try {
    const empty = join(dir, "empty")
    mkdirSync(empty)
    const r = await WP.writeThroughPath(empty, null, { op: "rmdir" })
    assert.equal(r.written, true)
    assert.equal(r.via, "fs")
    assert.equal(existsSync(empty), false, "空目录移除")
    assert.equal(WP.isDirty(empty), false, "不记 dirty（目录无行号语义）")
    const ne = join(dir, "ne")
    mkdirSync(ne)
    writeFileSync(join(ne, "a.txt"), "x")
    await assert.rejects(() => WP.writeThroughPath(ne, null, { op: "rmdir" }), (e) => {
      assert.ok(e.code === "ENOTEMPTY" || e.code === "EEXIST", `非空错误码 ∈ {ENOTEMPTY, EEXIST}（实 = ${e.code}）`)
      return true
    }, "非空 ⇒ 上抛（调用面译拒）")
    out("#943-op", "空目录移除 ✓ · 非空上抛 ✓ · 不记 dirty ✓")
  } finally { cleanup() }
})

/* ── #943-① 空目录：delete 成功 ─────────────────────────────────────────────────── */

test("#943-① 空目录 delete：成功 + `Deleted <path>` + 目录消失（不记 dirty）", async () => {
  const dir = tmp("943a")
  try {
    const empty = join(dir, "empty")
    mkdirSync(empty)
    const msg = await DEL.execute({ path: empty }, dctx(dir))
    assert.equal(msg, `Deleted ${empty}`)
    assert.equal(existsSync(empty), false, "目录消失")
    assert.equal(WP.isDirty(empty), false, "目录臂不记 dirty（文件臂对照见回归）")
    out("#943-①", `${msg} · 目录消失 ✓`)
  } finally { cleanup() }
})

/* ── #943-② 非空目录：拒句逐字 + 零损 ───────────────────────────────────────────── */

test("#943-② 非空目录 delete：拒句逐字 ∥ 目录与内容零损", async () => {
  const dir = tmp("943b")
  try {
    const ne = join(dir, "ne")
    mkdirSync(ne)
    writeFileSync(join(ne, "keep.txt"), "keep")
    await assert.rejects(() => DEL.execute({ path: ne }, dctx(dir)), (e) => {
      assert.equal(e.message, `"${ne}" is a directory and is not empty — only empty directories can be deleted (nothing recursive is ever removed). Remove the contents first (delete bottom-up for nested empty directories).`, "拒句逐字")
      return true
    })
    assert.deepEqual(readdirSync(ne), ["keep.txt"], "内容零损")
    assert.equal(readFileSync(join(ne, "keep.txt"), "utf8"), "keep")
    out("#943-②", "拒句逐字 ✓ · 零损 ✓")
  } finally { cleanup() }
})

/* ── #943-③ symlink→dir ∥ 嵌套空树 ──────────────────────────────────────────────── */

test("#943-③ symlink→dir：删链接本体（目标存活）∥ 嵌套空树：非底拒 / 自底向上全成", async () => {
  const dir = tmp("943c")
  try {
    const tgt = join(dir, "tgt")
    mkdirSync(tgt)
    writeFileSync(join(tgt, "keep.txt"), "keep")
    const lnk = join(dir, "lnk")
    let canLink = true
    try { symlinkSync(tgt, lnk, "dir") } catch { canLink = false }
    if (canLink) {
      assert.equal(await DEL.execute({ path: lnk }, dctx(dir)), `Deleted ${lnk}`, "链接本体删（回执同形）")
      assert.equal(existsSync(lnk), false, "链接缺席")
      assert.equal(readFileSync(join(tgt, "keep.txt"), "utf8"), "keep", "目标存活（不跟随）")
    } else {
      out("#943-③", "symlink 不可建（权限）——链接子腿跳过；嵌套空树子腿照跑")
    }
    const a = join(dir, "a"), b = join(a, "b"), c = join(b, "c")
    mkdirSync(c, { recursive: true })
    await assert.rejects(() => DEL.execute({ path: a }, dctx(dir)), /is a directory and is not empty/, "非底 ⇒ 拒")
    assert.equal(existsSync(c), true, "拒后零损")
    assert.equal(await DEL.execute({ path: c }, dctx(dir)), `Deleted ${c}`)
    assert.equal(await DEL.execute({ path: b }, dctx(dir)), `Deleted ${b}`)
    assert.equal(await DEL.execute({ path: a }, dctx(dir)), `Deleted ${a}`, "自底向上 ⇒ 全成")
    out("#943-③", `${canLink ? "symlink 本体删 ✓" : "symlink 子腿跳过（见上）"} · 嵌套空树自底向上 ✓`)
  } finally { cleanup() }
})

/* ── #943-回归：文件臂零变（tracked 拒 ∥ force 通行 ∥ missing ∥ 回执/记账） ───────── */

test("#943-回归 文件臂零变：tracked 拒 ∥ force 通行 ∥ missing 文案 ∥ 回执 + 记账", async () => {
  const dir = tmp("943r")
  try {
    const f = join(dir, "junk.txt")
    writeFileSync(f, "junk")
    assert.equal(await DEL.execute({ path: f }, dctx(dir)), `Deleted ${f}`)
    assert.equal(existsSync(f), false)
    assert.equal(WP.isDirty(f), true, "文件臂记账（既有）")
    await assert.rejects(() => DEL.execute({ path: join(dir, "nope.txt") }, dctx(dir)), (e) => {
      assert.equal(e.message, `File not found: ${join(dir, "nope.txt")}`)
      return true
    }, "missing 文案")
    const repo = join(dir, "repo")
    mkdirSync(repo)
    const git = (...a) => spawnSync("git", a, { cwd: repo, encoding: "utf8" })
    if (git("init", "-q").status !== 0) { out("#943-回归", "git 不可用——tracked 腿跳过"); return }
    const tf = join(repo, "tracked.txt")
    writeFileSync(tf, "t")
    git("add", "--", "tracked.txt")
    await assert.rejects(() => DEL.execute({ path: tf }, dctx(repo)), (e) => {
      assert.equal(e.message, `"${tf}" is git-tracked. Set force=true to delete anyway.`)
      return true
    }, "tracked 拒")
    assert.equal(existsSync(tf), true, "拒 ⇒ 零损")
    assert.equal(await DEL.execute({ path: tf, force: true }, dctx(repo)), `Deleted ${tf}`, "force 通行")
    assert.equal(existsSync(tf), false)
    out("#943-回归", "tracked 拒 ✓ · force 通行 ✓ · missing ✓ · 文件臂回执/记账 ✓")
  } finally { cleanup() }
})
