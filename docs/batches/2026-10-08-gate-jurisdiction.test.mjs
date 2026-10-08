/**
 * 2026-10-08-gate-jurisdiction.test.mjs — 门禁辖域收正（#1104 ∥ #1102 并批；#1103 伴随）批次本地件。
 * 名随批次档 · 住批次目录 · **不进仓套件**；复跑（仓根 d:/teamcode/thincoder 下）：
 *   node --test docs/batches/2026-10-08-gate-jurisdiction.test.mjs
 *
 * 覆盖 = 批档 §2.4 八腿 + 设计档用例逐字（`PORTABILITY.md` T-36 / T-37 / T-38 / T-V28）：
 *   腿 1 / T-36①⑤ 出辖放行（工作区根无档面 · 任意深度含 `.mjs` · 相对形跨出）∥ 非串 ∥ 空串保守拒。
 *   腿 2          在辖项目内 `src` 仍拒（回归——reason 逐字）。
 *   腿 3 / K3     相对形按会话 cwd 解析后判（cwd 只是相对基）。
 *   腿 4          无候选 ∥ 歧义（锚下 ≥2 带档兄弟）⇒ 放行（发现梯零参与）。
 *   腿 5 / T-V28  端面零改（结构断言；扫描面 = 源码树 `thincoder-core/**` ∥ `thincoder-vscode/src/**`）。
 *   腿 6 / T-37   声明装载换源（跨项目判别 · 嵌套子优于根 · 档非法照默认不抛）。
 *   腿 7 / T-38   hint 收正（#1102——所属项目 manifest 绝对路径 ∥ 已声明零指路段 ∥ 多目标取首个）。
 *   腿 8 / T-36③⑥ 在辖四豁免（doc / temp / aux / state）放行 ∥ eng-coder 角色门零变。
 *
 * 红绿对照（先红 = 实施前实测读数，见批档 §5 实施记录）：先红 = 无档工作区根 `.log` / 深 `.mjs` 写被拒
 * （`engineering design gate`——cwd 缺省 fail-closed 越权形）∥ `declarationForTarget` 未导出（undefined）∥
 * 跨项目判别反向（`<B>/lib/a.md` 放行 ∥ `<B>/src/a.md` 拒）∥ hint 指路仍为档名而非绝对路径。
 * 回归锁（批前即绿）= 在辖 `src` 段仍拒 ∥ 四豁免放行 ∥ eng-coder 角色门零变 ∥ 非串 ∥ 空串保守拒。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, relative } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const ROOT = fileURLToPath(new URL("../../", import.meta.url)) // 仓根（thincoder/）
const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href)
const CONV = await load("thincoder-core/conventions.mjs")
const DECL = await load("thincoder-core/declaration.mjs")
const MAN = await load("thincoder-core/manifest.mjs")
const DISPATCH = await load("thincoder-core/agent/dispatch.mjs")
const TTL = await load("thincoder-core/token-ttl.mjs")

const out = (label, value) => console.log(`[读数] ${label}: ${value}`)
const created = []
const tmp = (tag) => { const d = mkdtempSync(join(tmpdir(), `gatejur-${tag}-`)); created.push(d); return d }
const cleanup = () => { for (const d of created.splice(0)) { try { rmSync(d, { recursive: true, force: true }) } catch { /* 临时目录尽力清理 */ } } }
const mkManifest = (dir, manifest = { version: 1, phase: "initial-dev" }) => {
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, "PROJECT-MANIFEST.json"), JSON.stringify(manifest, null, 2))
  return dir
}

/* ── 门面夹具（工程模式父侧门 · 无活槽 · depth 0 · auto-approve——沿 2026-10-05-engine-face-gaps T-35）── */

let runs = 0 // 执行计数（「恰执行一次」判据）
const toolFor = (name, touch) => ({
  name, readonly: false, parallel: false,
  ...(touch ? { touchedPaths: touch } : {}),
  execute: async () => { runs += 1; return `exec#${runs}` },
})
const agentAt = (cwd, over = {}) => ({
  cwd, planMode: false, autoApprove: true, _role: null, _engTaskAuthorized: false,
  _touchedFiles: [], _mutationSeq: 0, _mutLog: [],
  config: { agent: { engineering: true } }, ...over,
})
/** 单条工具调用 ⇒ 结果行（file 谓词面 = `{path}`；多目标面 = `touchedPaths` 钩子 + `{paths}`）。 */
const invoke = (cwd, name, args, { touch = null, over = {} } = {}) =>
  DISPATCH.executeToolCalls(
    agentAt(cwd, over),
    new Map([[name, toolFor(name, touch)]]),
    [{ id: "id-1", name, arguments: JSON.stringify(args) }],
    {}, 0,
  )

/** 期望放行 + 恰执行一次。 */
async function expectPass(label, cwd, args, opts = {}) {
  const name = opts.tool ?? "write"
  const before = runs
  const res = await invoke(cwd, name, args, opts)
  assert.equal(res[0]?.denied ?? false, false, `放行：${label}（拒因 ${res[0]?.reason ?? "—"}）`)
  assert.equal(res[0]?.ok, true, `执行 ok：${label}`)
  assert.equal(runs - before, 1, `恰执行一次：${label}`)
  return res[0]
}

/** 期望拒绝（reason 逐字）+ 零执行。 */
async function expectDeny(label, cwd, args, opts = {}) {
  const name = opts.tool ?? "write"
  const before = runs
  const res = await invoke(cwd, name, args, opts)
  assert.equal(res[0]?.denied, true, `拒：${label}（实读 denied=${res[0]?.denied ?? false}）`)
  assert.equal(res[0]?.reason, "engineering design gate", `拒因逐字：${label}（实读 ${res[0]?.reason}）`)
  assert.equal(runs, before, `拒 ⇒ 零执行：${label}`)
  return res[0]
}

/* ── 腿 1 / T-36①⑤：出辖放行 ∥ 不可解析目标保守拦截 ───────────────────────────── */

test("腿1/T-36①⑤ 出辖放行（无档工作区根 · 任意深度 · 删与写）∥ 非串 ∥ 空串 ⇒ 保守拒", async () => {
  const ws = tmp("ws1") // 无档面工作区根（模拟「孩子的目录才是项目」的容器）
  try {
    assert.equal(MAN.owningProject(ws), null, "前提：工作区根祖先链无档（owningProject ⇒ null）")
    // ① `.log` / `.diff` / `.bat` —— 写与删（旧读数 = 拒；辖域收正后 = 放行恰执行一次）
    for (const ext of ["log", "diff", "bat"]) {
      await expectPass(`写 ws/_x.${ext}`, ws, { path: `_x.${ext}` })
      await expectPass(`删 ws/_x.${ext}`, ws, { path: `_x.${ext}` }, { tool: "delete" })
    }
    // ② 无档面任意深度（含 `.mjs`）
    await expectPass("写 ws/deep/a/b/tool.mjs", ws, { path: "deep/a/b/tool.mjs" })
    await expectPass("删 ws/deep/a/b/tool.mjs", ws, { path: "deep/a/b/tool.mjs" }, { tool: "delete" })
    // ③ 非串 ∥ 空串 ⇒ 保守拦截（无路径可判——行为零漂移）
    await expectDeny("空串目标", ws, { path: "" })
    await expectDeny("空串（空白形）目标", ws, { path: "   " })
    await expectDeny("非串目标（数字）", ws, { path: 123 })
    await expectDeny("缺 path 参数（undefined）", ws, {})
    out("腿1", `出辖放行 ×10（.log/.diff/.bat × 写删 + 深 .mjs × 写删——恰执行一次）· 不可解析 ×4 保守拒 ✓（执行计 ${runs}）`)
  } finally { cleanup() }
})

/* ── 腿 2：在辖项目内 `src` 仍拒（回归） ────────────────────────────────────── */

test("腿2 在辖 `src` 段仍拒（绝对 ∥ 相对 ∥ code 段内文档——reason 逐字）", async () => {
  const P = mkManifest(tmp("p2"))
  try {
    await expectDeny("绝对形 P/src/index.mjs", P, { path: join(P, "src", "index.mjs") })
    await expectDeny("相对形 src/index.mjs（cwd = P）", P, { path: "src/index.mjs" })
    await expectDeny("src/prompts/guide.md（code 段内文档 = product code）", P, { path: "src/prompts/guide.md" })
    out("腿2", "在辖 src ×3 仍拒（reason 逐字 `engineering design gate`）✓")
  } finally { cleanup() }
})

/* ── 腿 3 / K3：相对形按会话 cwd 解析（cwd 只是相对基，不是声明源） ───────────── */

test("腿3 相对形按会话 cwd 解析后判：项目内 ⇒ 拒 ∥ 跨出项目 ⇒ 出辖放行 ∥ 跨出再回 ⇒ 在辖拒", async () => {
  const base = tmp("rel")
  const proj = mkManifest(join(base, "proj"))
  const outside = join(base, "sandbox") // 同层无档面
  try {
    assert.equal(MAN.owningProject(join(outside, "x.mjs")), null, "前提：sandbox 祖先链无档")
    await expectDeny("proj 内相对形 src/x.mjs", proj, { path: "src/x.mjs" })
    await expectPass("相对形 ../sandbox/x.mjs（跨出项目 ⇒ 出辖）", proj, { path: "../sandbox/x.mjs" })
    await expectDeny("相对形 ../proj/src/x.mjs（跨出再回 ⇒ 在辖）", proj, { path: "../proj/src/x.mjs" })
    await expectPass("无档面相对形 _x.log（cwd = 工作区根）", base, { path: "_x.log" })
    out("腿3", "相对形解析 = resolve(cwd, p)（判据面 = 目标所属项目）✓")
  } finally { cleanup() }
})

/* ── 腿 4：无候选 ∥ 歧义 ⇒ 出辖（发现梯零参与） ─────────────────────────────── */

test("腿4 无候选 ∥ 歧义（锚下 ≥2 带档兄弟）⇒ 放行（发现梯零参与）", async () => {
  const c = tmp("container") // 容器锚：自身无档、锚下恰两带档兄弟
  const alpha = mkManifest(join(c, "alpha"))
  mkManifest(join(c, "beta"))
  try {
    const d = MAN.discoverProjects(c)
    assert.equal(d.kind, "ambiguous", `前提：发现梯读 = ambiguous（实读 ${d.kind}）`)
    assert.equal(MAN.owningProject(join(c, "notes.mjs")), null, "前提：容器内目标祖先链无档")
    await expectPass("容器锚下 notes.mjs（无档面 ⇒ 出辖——发现梯不参与）", c, { path: "notes.mjs" })
    await expectPass("容器锚下 cleanup.log", c, { path: "cleanup.log" })
    await expectDeny("兄弟项目内目标（目标归属 alpha ⇒ 在辖仍拒）", c, { path: join(alpha, "src", "x.mjs") })
    out("腿4", `发现梯读 = ambiguous ∥ 容器内目标出辖放行 ∥ 兄弟项目内目标在辖拒 ✓`)
  } finally { cleanup() }
})

/* ── 腿 5 / T-V28：端面零改（结构断言——扫描面 = 源码树） ──────────────────── */

const SCAN_SKIP_DIRS = new Set([".thincoder", "_archive", "tmp", "node_modules", "dist", ".git", "docs"])
function scanTree(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".")) continue
    const p = join(dir, e.name)
    if (e.isDirectory()) { if (!SCAN_SKIP_DIRS.has(e.name)) scanTree(p, acc); continue }
    if (e.isFile() && /\.(mjs|cjs|js|ts|json)$/.test(e.name)) acc.push(p)
  }
  return acc
}
const scanHits = (tree) => scanTree(join(ROOT, tree))
  .filter((f) => { try { return readFileSync(f, "utf8").includes("engineering design gate") } catch { return false } })
  .map((f) => relative(ROOT, f).replace(/\\/g, "/"))
  .sort()

test("腿5/T-V28 端面零改：端侧门档不在盘 ∥ 门禁串零命中（扫描面 = 源码树）", () => {
  assert.equal(existsSync(join(ROOT, "thincoder-vscode/src/agent/tool-gates.mjs")), false, "端侧门档不在盘（随核退役）")
  const vsc = scanHits("thincoder-vscode/src")
  assert.deepEqual(vsc, [], `端侧源码门禁发射面零命中（实读 ${JSON.stringify(vsc)}）`)
  // 「仅核侧两档」：核侧命中面 = dispatch.mjs（发射）+ dispatch-run.mjs（理由回显消费）——端面零改
  const core = scanHits("thincoder-core")
  assert.deepEqual(core, ["thincoder-core/agent/dispatch-run.mjs", "thincoder-core/agent/dispatch.mjs"],
    `核侧命中面（实读 ${JSON.stringify(core)}）`)
  out("腿5/T-V28", `tool-gates.mjs 缺位 ✓ · 端侧零命中 ✓ · 核侧两档 = ${core.join(" ∥ ")} ✓`)
})

/* ── 腿 6 / T-37：声明装载换源（nearest wins） ─────────────────────────────── */

test("腿6/T-37 声明装载换源：跨项目判别 ∥ 嵌套子优于根 ∥ 档非法照默认不抛", async () => {
  const base = tmp("t37")
  const A = mkManifest(join(base, "A")) // 默认（src）
  const B = mkManifest(join(base, "B"), { version: 1, phase: "initial-dev", codePaths: ["lib"] })
  try {
    // 单点读（declarationForTarget——宿主 + 转口两面同函数）
    assert.equal(typeof CONV.declarationForTarget, "function", "conventions.mjs 转口导出")
    assert.equal(CONV.declarationForTarget, DECL.declarationForTarget, "转口 = 同一函数（单源）")
    const dB = CONV.declarationForTarget(join(B, "lib", "a.md"))
    assert.equal(dB?.root, B, "B 目标 ⇒ 声明 B")
    assert.deepEqual([...dB.codePaths], ["lib"], "B 声明 codePaths = lib")
    assert.equal(dB.declared, true, "B = declared")
    const dA = CONV.declarationForTarget(join(A, "src", "a.mjs"))
    assert.equal(dA?.root, A, "A 目标 ⇒ 声明 A")
    assert.deepEqual([...dA.codePaths], ["src"], "A = 默认 codePaths")
    assert.equal(dA.declared, false, "A = 未声明（全默认）")
    assert.equal(CONV.declarationForTarget(join(base, "nowhere", "x.mjs")), null, "祖先链无档 ⇒ null = 出辖")
    // 门面判别（cwd = A——旧形按 A 装载；新形按目标所属项目装载）
    await expectDeny("判别：<B>/lib/a.md（B 声明 lib ⇒ code）", A, { path: join(B, "lib", "a.md") })
    await expectPass("反向判别：<B>/src/a.md（B 未含 src ⇒ doc）", A, { path: join(B, "src", "a.md") })
    // 嵌套：子优于根（nearest wins）
    const R = mkManifest(join(base, "R"))
    const S = mkManifest(join(R, "sub"), { version: 1, phase: "initial-dev", codePaths: ["lib"] })
    assert.equal(CONV.declarationForTarget(join(S, "lib", "a.md"))?.root, S, "嵌套 ⇒ 子（nearest wins）")
    await expectDeny("<S>/lib/a.md ⇒ 拒（子声明）", R, { path: join(S, "lib", "a.md") })
    await expectPass("<R>/lib/a.md ⇒ 放行（根声明——doc）", R, { path: join(R, "lib", "a.md") })
    // 档非法 ⇒ 照默认 + 不抛
    const X = join(base, "broken")
    mkdirSync(X, { recursive: true })
    writeFileSync(join(X, "PROJECT-MANIFEST.json"), "{ not valid json")
    const dX = CONV.declarationForTarget(join(X, "src", "a.md"))
    assert.equal(dX?.root, X, "非法档：辖域仍成立（档在盘）")
    assert.deepEqual([...dX.codePaths], ["src"], "非法档 ⇒ 照默认")
    assert.equal(dX.declared, false, "非法档 ⇒ declared 假")
    await expectDeny("<X>/src/a.md ⇒ 拒（默认 src），不抛", X, { path: join(X, "src", "a.md") })
    await expectPass("<X>/README.md ⇒ 放行（doc）", X, { path: join(X, "README.md") })
    out("腿6/T-37", "跨项目判别双向 ✓ · 嵌套子优于根 ✓ · 非法档照默认不抛 ✓")
  } finally { cleanup() }
})

/* ── 腿 7 / T-38：hint 收正（#1102） ───────────────────────────────────────── */

test("腿7/T-38 hint 收正：未声明 ⇒ 所属项目 manifest 绝对路径 ∥ 已声明 ⇒ 零指路段 ∥ 多目标 = 首个", async () => {
  const base = tmp("t38")
  const U = mkManifest(join(base, "U"))   // 未声明
  const D = mkManifest(join(base, "D"), { version: 1, phase: "initial-dev", codePaths: ["lib"] }) // 已声明
  const U2 = mkManifest(join(base, "U2")) // 未声明（第二个）
  try {
    const rU = await expectDeny("未声明项目内 src ⇒ 拒 + 指路", U, { path: join(U, "src", "a.mjs") })
    assert.ok(rU.hint.includes(`declare project conventions in ${join(U, "PROJECT-MANIFEST.json")} to adjust.`),
      `hint 指路 = 所属项目 manifest 绝对路径（实读 hint：${rU.hint}`)
    const rD = await expectDeny("已声明项目内 lib ⇒ 拒（零指路段）", D, { path: join(D, "lib", "a.md") })
    assert.equal(rD.hint.includes("declare project conventions"), false, "已声明 ⇒ 零指路段")
    assert.ok(rD.hint.startsWith("Engineering mode:"), "基础 hint 文本零改")
    // 多目标跨项目：首个「未声明且被判码」目标所属项目（确定性 = toolTouchPaths 序）
    const touch = (a) => a.paths
    const rM = await expectDeny("多目标 [D/lib（已声明拒）, U/src（未声明拒）]",
      base, { paths: [join(D, "lib", "a.md"), join(U, "src", "a.mjs")] }, { tool: "apply_patch", touch })
    assert.ok(rM.hint.includes(join(U, "PROJECT-MANIFEST.json")), "多目标 ⇒ 指路首个未声明且被判码（U）")
    assert.equal(rM.hint.includes(join(D, "PROJECT-MANIFEST.json")), false, "已声明者不入指路")
    const rM2 = await expectDeny("多目标 [U2/src, U/src] ⇒ 指路首个 = U2",
      base, { paths: [join(U2, "src", "a.mjs"), join(U, "src", "a.mjs")] }, { tool: "apply_patch", touch })
    assert.ok(rM2.hint.includes(join(U2, "PROJECT-MANIFEST.json")), "首个 = U2")
    assert.equal(rM2.hint.includes(join(U, "PROJECT-MANIFEST.json")), false, "后者不入指路")
    await expectPass("多目标全放行（doc + doc）", base,
      { paths: [join(D, "docs", "a.md"), join(U, "notes.md")] }, { tool: "apply_patch", touch })
    out("腿7/T-38", `指路 = manifestFilePath(conv.root) 绝对路径（${join(U, "PROJECT-MANIFEST.json")}）· 已声明零指路 · 多目标取首个 ✓`)
  } finally { cleanup() }
})

/* ── 腿 8 / T-36③⑥：在辖四豁免放行 ∥ eng-coder 角色门零变 ─────────────────── */

test("腿8 零改回归：在辖四豁免（doc/temp/aux/state）放行 ∥ eng-coder 角色门零变", async () => {
  const P = mkManifest(tmp("p8"))
  const ws = tmp("ec") // 出辖面（无档）
  try {
    await expectPass("doc 豁免 docs/guide.md", P, { path: "docs/guide.md" })
    await expectPass("temp 豁免 scratch.tmp", P, { path: "scratch.tmp" })
    await expectPass("aux 豁免 test/x.mjs", P, { path: "test/x.mjs" })
    await expectPass("aux 豁免 .thincoder/tmp/x.bin（两段序列）", P, { path: ".thincoder/tmp/x.bin" })
    await expectPass("state 豁免 PROJECT-MANIFEST.json", P, { path: "PROJECT-MANIFEST.json" })
    await expectPass("state 豁免 .thincoder/conventions.json", P, { path: ".thincoder/conventions.json" })
    // eng-coder 角色门（角色 + token 判据——不讲路径）：出辖面同样拒（辖域零泄漏）
    assert.equal(TTL.anyLiveDesignSlot(agentAt(ws, { _role: "eng-coder" })), false, "夹具前提：无活槽")
    await expectDeny("eng-coder 门：出辖目标 _x.log 仍拒",
      ws, { path: "_x.log" }, { over: { _role: "eng-coder", _engDesignReviewed: false } })
    await expectDeny("eng-coder 门：在辖 src 仍拒",
      P, { path: "src/x.mjs" }, { over: { _role: "eng-coder", _engDesignReviewed: false } })
    out("腿8", "四豁免 ×6 放行（恰执行一次）· eng-coder 角色门 ×2 仍拒（辖域零泄漏）✓")
  } finally { cleanup() }
})
