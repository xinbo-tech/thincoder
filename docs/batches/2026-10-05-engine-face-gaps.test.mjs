/**
 * 2026-10-05-engine-face-gaps.test.mjs — 引擎面缺口两条（#941 ∥ #944）批次本地件。
 * 名随批次档 · 住批次目录 · **不进仓套件**；复跑（仓根 d:/teamcode/thincoder 下）：
 *   node --test docs/batches/2026-10-05-engine-face-gaps.test.mjs
 *
 * 覆盖 = 批档 §2.5 验收对照 + 设计档用例逐字（`PORTABILITY.md` T-34 / T-35；`MANIFEST.md` T61 / T62 / T62b）：
 *   #941（分类器五值 `state` ∥ 父侧门放行）：
 *     T-34 分类读数——`PROJECT-MANIFEST.json`（任意层 ∥ 大小写变体 ∥ 绝对形）⇒ state ∥ `.thincoder/conventions.json`
 *          （段对 ∥ 大小写）⇒ state ∥ `src/PROJECT-MANIFEST.json` ⇒ code（反例——代码段先命中）∥
 *          `test/PROJECT-MANIFEST.json` ⇒ aux（序不变——state 居 aux 后）∥ 近形（`PROJECT-MANIFEST.json.bak` /
 *          `my-PROJECT-MANIFEST.json` / 裸 `conventions.json` / 段对不相邻）不误伤 ∥ 五值闭集 + `isStatePath`。
 *     T-35 门面——工程模式父侧门（无活槽 · depth 0）：两档写放行（auto-approve 夹具「恰执行一次」）∥
 *          无夹具读数 = 无设计门拒绝句（理由串 = `no permission handler`）∥ `src` 段写仍拒（回归）∥
 *          eng-coder 角色门零变（不讲路径——两档同拒）∥ 分层零改（spawn `files` 域二道防线 ∥ writer 闸）。
 *   #944（`docRoot` 显式 `null` = 「本面无」）：
 *     T61 `docRoot.<键> = null` ⇒ `ok:true` + 读回 `null`（未补回）+ `missingKeys` 不含 + `docRootPaths = []`。
 *     T62 对照（删键 ⇒ 补默认单串——零改）∥ 负向（`""` / `[]` / `["a",""]` ⇒ 拒 + `errors` 含键名）。
 *     T62b `docRoot.batches = null` ⇒ 基底回退默认（`resolveBatchDocPath` 命中）；对照 = 显式基底全不可读 ⇒ throw（零改）。
 *     门禁读数——write-gate 评审根集逐键展开：null 键「零贡献」（不落默认根）、其余键照常（§2.7 消费面 #1）。
 *
 * 红绿对照（先红 = 实施前实测读数，见批档 §5 实施记录）：先红 = 分类两形落兜底 code（非 state）∥ 父侧门两档写
 * 「engineering design gate」拒 ∥ `isValidDocRootValue(null) = false`（null 值 ⇒ 档非法：`ok:false` / `reason:'invalid'`）
 * ∥ 评审根集 null 键回退默认根。回归锁（批前即绿）= `src` 段写拒 ∥ eng-coder 门 ∥ 删键补默认 / 负向拒 ∥
 * spawn 域 / writer 闸 / 显式基底不可读 throw。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const ROOT = fileURLToPath(new URL("../../", import.meta.url)) // 仓根（thincoder/）
const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href)
const CONV = await load("thincoder-core/conventions.mjs")
const SCHEMA = await load("thincoder-core/manifest-schema.mjs")
const MAN = await load("thincoder-core/manifest.mjs")
const DISPATCH = await load("thincoder-core/agent/dispatch.mjs")
const SPAWN = await load("thincoder-core/agent-tools/spawn-gates.mjs")
const GATE = await load("thincoder-core/agent/write-gate.mjs")
const PATHS = await load("thincoder-core/agent-tools/batch-paths.mjs")
const TTL = await load("thincoder-core/token-ttl.mjs")

const out = (label, value) => console.log(`[读数] ${label}: ${value}`)
const created = []
const tmp = (tag) => { const d = mkdtempSync(join(tmpdir(), `efg-${tag}-`)); created.push(d); return d }
const cleanup = () => { for (const d of created.splice(0)) { try { rmSync(d, { recursive: true, force: true }) } catch { /* 临时目录尽力清理 */ } } }
const mkManifest = (dir, manifest) => { mkdirSync(dir, { recursive: true }); writeFileSync(join(dir, "PROJECT-MANIFEST.json"), JSON.stringify(manifest, null, 2)); return dir }

/* ── #941 T-34：分类裁判五值（state 两形 ∥ src 反例 ∥ test/ 序不变 ∥ 近形不误伤） ───────── */

test("#941 T-34 分类读数五值：state 两形 ⇒ state ∥ src 反例 ∥ aux 序不变 ∥ 近形不误伤", () => {
  const dir = tmp("t34")
  try {
    const conv = { root: dir } // 面判基准 = 项目根；codePaths 缺省 ["src"]（DEFAULT_DECLARATION）
    const rows = [
      ["PROJECT-MANIFEST.json", "state", "项目根层（basename）"],
      ["project-manifest.JSON", "state", "大小写变体"],
      ["apps/foo/PROJECT-MANIFEST.json", "state", "任意层"],
      [".thincoder/conventions.json", "state", "退役声明档段对"],
      [".THINCODER/Conventions.JSON", "state", "段对大小写变体"],
      [join(dir, "PROJECT-MANIFEST.json"), "state", "绝对形（根下）"],
      [join(dir, ".thincoder", "conventions.json"), "state", "绝对形段对"],
      ["src/PROJECT-MANIFEST.json", "code", "反例：代码段先命中（拦截面不缩）"],
      ["test/PROJECT-MANIFEST.json", "aux", "反例：aux 先于 state（序不变）"],
      ["PROJECT-MANIFEST.json.bak", "code", "近形：后缀"],
      ["my-PROJECT-MANIFEST.json", "code", "近形：前缀"],
      ["conventions.json", "code", "近形：无 .thincoder 段"],
      ["docs/conventions.json", "code", "近形：段对不相邻"],
      ["docs/guide.md", "doc", "五值补齐：doc"],
      ["scratch.tmp", "temp", "五值补齐：temp"],
      ["lib/index.mjs", "code", "五值补齐：兜底 code"],
    ]
    const bad = []
    for (const [p, want, why] of rows) {
      const got = CONV.classifyPath(p, conv)
      if (got !== want) bad.push(`${p} ⇒ ${got}（期望 ${want}——${why}）`)
    }
    assert.deepEqual(bad, [], `分类读数不合（逐条）：\n${bad.join("\n")}`)
    assert.deepEqual([...new Set(rows.map((r) => r[1]))].sort(), ["aux", "code", "doc", "state", "temp"], "五值闭集读数到场")
    // 新谓词 isStatePath（#941 —— 派生自 classifyPath，单一实现）
    assert.equal(typeof CONV.isStatePath, "function", "isStatePath 导出（新谓词）")
    assert.equal(CONV.isStatePath("PROJECT-MANIFEST.json", conv), true)
    assert.equal(CONV.isStatePath(".thincoder/conventions.json", conv), true)
    assert.equal(CONV.isStatePath("conventions.json", conv), false)
    assert.equal(CONV.isStatePath("src/index.mjs", conv), false)
    out("#941 T-34", `${rows.length} 读数逐条归位 ✓ · 五值闭集 ✓ · isStatePath 四读数 ✓`)
  } finally { cleanup() }
})

/* ── #941 T-35：父侧门（工程模式 · 无活槽 · depth 0）两档写放行 ∥ src 回归 ∥ eng-coder 零变 ── */

test("#941 T-35 门面：两档写放行「恰执行一次」∥ 无夹具 = 无设计门拒绝句 ∥ src 仍拒 ∥ eng-coder 门零变", async () => {
  const dir = mkManifest(tmp("t35"), { version: 1, phase: "initial-dev" })
  let runs = 0
  const tool = { name: "write", readonly: false, parallel: false, execute: async () => { runs += 1; return `wrote#${runs}` } }
  const agentOf = (over = {}) => ({
    cwd: dir, planMode: false, autoApprove: true, _role: null, _engTaskAuthorized: false,
    _touchedFiles: [], _mutationSeq: 0, _mutLog: [],
    config: { agent: { engineering: true } }, ...over,
  })
  const call = (path) => [{ id: "id-w", name: "write", arguments: JSON.stringify({ path }) }]
  const run = (agent, path, callbacks = {}) => DISPATCH.executeToolCalls(agent, new Map([["write", tool]]), call(path), callbacks, 0)
  try {
    assert.equal(TTL.anyLiveDesignSlot(agentOf()), false, "夹具前提：无活槽")
    // ① 两档写放行——auto-approve 夹具「恰执行一次」
    for (const p of ["PROJECT-MANIFEST.json", ".thincoder/conventions.json"]) {
      const before = runs
      const r = await run(agentOf(), p)
      assert.equal(r[0]?.denied ?? false, false, `放行：${p}（拒因 ${r[0]?.reason ?? "—"}）`)
      assert.equal(r[0]?.ok, true, `执行 ok：${p}`)
      assert.equal(runs - before, 1, `恰执行一次：${p}`)
    }
    // ② 无夹具读数（无 auto-approve ∧ 无权限 handler）——理由串 ≠ 设计门拒绝句
    const nr = await run(agentOf({ autoApprove: false }), "PROJECT-MANIFEST.json")
    assert.notEqual(nr[0]?.reason, "engineering design gate", "无设计门拒绝句")
    assert.equal(nr[0]?.reason, "no permission handler", "未过权限阶段（分类面已放行——证明非门拒）")
    // ③ src 段写仍拒（回归——拦截面不缩）
    const before3 = runs
    const sr = await run(agentOf(), "src/index.mjs")
    assert.equal(sr[0]?.denied, true, "src 段 ⇒ 仍拒")
    assert.equal(sr[0]?.reason, "engineering design gate", "拒因 = 设计门（逐字）")
    assert.equal(runs, before3, "拒 ⇒ 零执行")
    // ④ eng-coder 角色门零变（角色 + token 判据——不讲路径）
    for (const p of ["src/index.mjs", "PROJECT-MANIFEST.json"]) {
      const er = await run(agentOf({ _role: "eng-coder", _engDesignReviewed: false }), p)
      assert.equal(er[0]?.denied, true, `eng-coder 仍拒：${p}`)
      assert.equal(er[0]?.reason, "engineering design gate", `eng-coder 拒因：${p}`)
    }
    // ⑤ 分层零改：spawn `files` 域二道防线 ∥ writeManifest writer 闸
    assert.throws(() => SPAWN.rejectEngineeringFilePaths(["PROJECT-MANIFEST.json"]), /Manifest file/, "二道防线：manifest basename 拒")
    assert.throws(() => SPAWN.rejectEngineeringFilePaths(["sub/project-manifest.JSON"]), /Manifest file/, "二道防线：大小写不敏感")
    assert.equal(SPAWN.rejectEngineeringFilePaths(["src/x.mjs"]), undefined, "常规路径零扰")
    assert.throws(() => MAN.writeManifest(dir, MAN.DEFAULT_MANIFEST, { writer: "subagent" }), /无写权/, "writer 闸：非主 agent 拒（fail-closed）")
    out("#941 T-35", `两档放行 ×2（恰执行一次）✓ · 无夹具 = 无拒绝句 ✓ · src 拒 ✓ · eng-coder 双拒 ✓ · 二道防线 / writer 闸零改 ✓`)
  } finally { cleanup() }
})

/* ── #944 T61：某面「本面无」 ─────────────────────────────────────────────── */

test("#944 T61 本面无：docRoot.<键> = null ⇒ ok + 读回 null（未补回）+ 非缺键 + docRootPaths = []", () => {
  const p = tmp("t61")
  try {
    writeFileSync(join(p, "PROJECT-MANIFEST.json"), JSON.stringify({
      version: 1, phase: "initial-dev",
      docRoot: { batches: null, design: null },
    }, null, 2))
    assert.equal(SCHEMA.isValidDocRootValue(null), true, "判据面：null ⇒ 合法（#944）")
    assert.equal(SCHEMA.validateManifest({ version: 1, phase: "initial-dev", docRoot: { batches: null } }).ok, true, "validateManifest：null 值不拒")
    const m = MAN.readManifest(p)
    assert.equal(m.ok, true, `readManifest ok（reason ${m.reason ?? "—"} / errors ${JSON.stringify(m.errors)}）`)
    assert.equal(m.manifest.docRoot.batches, null, "读回 null（未被默认值补回）")
    assert.equal(m.manifest.docRoot.design, null, "读回 null（第二键）")
    assert.equal(m.missingKeys.includes("docRoot.batches"), false, "恰值 null 非缺键")
    assert.equal(m.missingKeys.includes("docRoot.design"), false, "恰值 null 非缺键（第二键）")
    assert.deepEqual(MAN.docRootPaths(null, p), [], "本面无 ⇒ 零根（合法——非错）")
    assert.deepEqual(MAN.docRootPaths(m.manifest.docRoot.batches, p), [], "读回值同判 ⇒ []")
    out("#944 T61", `ok:true ✓ · 两键读回 null（未补回）✓ · 非缺键 ✓ · docRootPaths = [] ✓`)
  } finally { cleanup() }
})

/* ── #944 T62：对照（删键仍补默认）∥ 负向（"" / [] / ["a",""] 仍拒） ────────────── */

test("#944 T62 对照与负向：删键 ⇒ 补默认单串（零改）∥ \"\" / [] / [\"a\",\"\"] ⇒ 拒 + errors 含键名", () => {
  const p = tmp("t62")
  try {
    // 对照：删 docRoot.<键>（docRoot 在场、specs 缺）⇒ 补默认单串 + missingKeys 记子键（缺省便利零改——KD-M1-6）
    writeFileSync(join(p, "PROJECT-MANIFEST.json"), JSON.stringify({ version: 1, phase: "initial-dev", docRoot: { batches: "docs/batches" } }, null, 2))
    const m = MAN.readManifest(p)
    assert.equal(m.ok, true)
    assert.equal(m.manifest.docRoot.specs, "docs/requirements/specs", "删键 ⇒ 补默认单串")
    assert.ok(m.missingKeys.includes("docRoot.specs"), "missingKeys 记子键")
    // 负向：三形仍拒（AC-11 面零开口）
    for (const bad of ["", [], ["a", ""]]) {
      const dir = tmp("t62-neg")
      writeFileSync(join(dir, "PROJECT-MANIFEST.json"), JSON.stringify({ version: 1, phase: "initial-dev", docRoot: { design: bad } }, null, 2))
      assert.equal(SCHEMA.isValidDocRootValue(bad), false, `判据面仍拒：${JSON.stringify(bad)}`)
      const r = MAN.readManifest(dir)
      assert.equal(r.ok, false, `readManifest 拒：${JSON.stringify(bad)}`)
      assert.equal(r.reason, "invalid")
      assert.ok(r.errors.some((e) => e.includes("docRoot.design")), `errors 含键名：${JSON.stringify(r.errors)}`)
    }
    assert.deepEqual(MAN.docRootPaths("", p), [], "非法形 ⇒ []（零改）")
    out("#944 T62", `删键补默认 ✓ · 三负向形逐拒（errors 含键名）✓ · 非法形 docRootPaths = [] ✓`)
  } finally { cleanup() }
})

/* ── #944 T62b：docRoot.batches = null ⇒ 基底回退默认 ∥ 显式基底全不可读 ⇒ throw（零改） ── */

test("#944 T62b 基底腿：batches = null ⇒ 回退默认基底命中 ∥ 显式基底全不可读 ⇒ throw（T21 零改）", () => {
  try {
    // ① batches = null：声明面零根 ⇒ 基底集 = 默认基底（回退恒发生——与缺键同款）
    const p1 = tmp("t62b-null")
    mkdirSync(join(p1, "docs", "batches"), { recursive: true })
    writeFileSync(join(p1, "docs", "batches", "x.md"), "# 夹具记录\n")
    writeFileSync(join(p1, "PROJECT-MANIFEST.json"), JSON.stringify({ version: 1, phase: "initial-dev", docRoot: { batches: null } }, null, 2))
    const m1 = MAN.readManifest(p1)
    assert.equal(m1.ok, true, "batches=null ⇒ 档合法")
    assert.equal(m1.manifest.docRoot.batches, null, "读回 null")
    assert.deepEqual(PATHS.batchDocBases(p1), [join(p1, "docs", "batches")], "基底集 = 默认基底（回退）")
    assert.equal(PATHS.resolveBatchDocPath(p1, "docs/batches/x.md"), join(p1, "docs", "batches", "x.md"), "命中默认基底内批档")
    // ①b 与缺键同款：缺键档 ⇒ 同值回退（对照格）
    const p2 = tmp("t62b-absent")
    mkdirSync(join(p2, "docs", "batches"), { recursive: true })
    writeFileSync(join(p2, "PROJECT-MANIFEST.json"), JSON.stringify({ version: 1, phase: "initial-dev" }, null, 2))
    assert.deepEqual(PATHS.batchDocBases(p2), [join(p2, "docs", "batches")], "缺键 ⇒ 同款回退（两分不混）")
    // ② 对照：显式基底全不可读 ⇒ throw（fail-closed 不变——T21 零改）
    const p3 = tmp("t62b-explicit")
    writeFileSync(join(p3, "PROJECT-MANIFEST.json"), JSON.stringify({ version: 1, phase: "initial-dev", docRoot: { batches: ["no1", "no2"] } }, null, 2))
    assert.equal(MAN.readManifest(p3).ok, true, "显式数组 ⇒ 档合法")
    assert.throws(() => PATHS.resolveBatchDocPath(p3, "docs/batches/x.md"), /not a readable file/, "显式基底全不可读 ⇒ throw")
    out("#944 T62b", `null ⇒ 默认基底命中 ✓ · 缺键同款 ✓ · 显式全不可读 ⇒ throw ✓`)
  } finally { cleanup() }
})

/* ── #944 门禁读数：write-gate 评审根集逐键展开（null 键零贡献 ∥ 其余键照常） ────────── */

test("#944 门禁读数：评审根集 null 键零贡献 ∥ 其余键照常（§2.7 消费面 #1）", () => {
  const p = tmp("gate-roots")
  try {
    writeFileSync(join(p, "PROJECT-MANIFEST.json"), JSON.stringify({
      version: 1, phase: "initial-dev",
      docRoot: { design: null, batches: "docs/batches" },
    }, null, 2))
    const roots = GATE.resolveReviewTargetPaths({ cwd: p })
    assert.equal(roots.includes(join(p, "docs", "design")), false, "null 键零贡献（不落默认根）")
    assert.equal(roots.includes(join(p, "docs", "batches")), true, "其余键照常（声明面）")
    assert.equal(roots.includes(join(p, "docs", "design", "modules")), true, "其余键照常（缺键补默认）")
    assert.equal(roots.includes(join(p, "docs", "requirements")), true, "其余键照常（默认面）")
    out("#944 门禁", `null 键零贡献 ✓ · 其余键（声明 / 默认）照常 ✓`)
  } finally { cleanup() }
})
