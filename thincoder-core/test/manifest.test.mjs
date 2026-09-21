/**
 * manifest.test.mjs — M1 项目状态档 manifest 单测。
 * 权威验收 = docs/core/design/modules/ENGINEERING-MODE-V2-MODULE-MANIFEST.md §3
 * （AC-M1-1..5 回指规格 AC 号 + T1–T7 用例表）。
 * 隔离：每用例组 mkdtempSync tmpdir 数据档（无真仓污染）；全同步 fs——快层安全。
 * 2026-09-21（#188 按用点解析批）追加：发现梯两表六格（T43）· 不递归不向上（T44）·
 * `resolveProjectRoot` 变更面（T45）· 归属形 / 按用点（T48）· 单源结构（T54）·
 * `init:false` 面歧义（T55）——权威 = `docs/core/design/MANIFEST.md` §2.2 / §3.2。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from "node:fs"
import { tmpdir } from "node:os"
import { basename, join, resolve } from "node:path"
import {
  readManifest, validateManifest, initManifest, writeManifest, requireManifest, resolveProjectRoot,
  discoverRepos, discoverProjects, owningProject, projectView, resolveEngineeringManifest, docRootPaths,
  MANIFEST_REL, DEFAULT_MANIFEST, MANIFEST_SCHEMA, _resetProjectRootForTest, _setProjectRootForTest,
} from "../manifest.mjs"

/** 每组一个干净 tmpdir 数据档目录（项目根语义——注入面：tmp 无 .git）。 */
const fixture = () => {
  const dir = mkdtempSync(join(tmpdir(), "m1-manifest-"))
  _setProjectRootForTest(dir)
  return { dir, clean: () => { _resetProjectRootForTest(); rmSync(dir, { recursive: true, force: true }) } }
}

const good = () => structuredClone(DEFAULT_MANIFEST)
const writeRaw = (dir, obj) => writeFileSync(join(dir, MANIFEST_REL), JSON.stringify(obj))

// ── AC-M1-1（规格 AC-M1-1 · T-枚举）：phase 取值非法 → 校验拒 ─────────────────────
test("AC-M1-1 非法 phase → validateManifest 拒（合法值通过）", () => {
  assert.equal(validateManifest({ ...good(), phase: "bogus" }).ok, false, "非法 phase 拒")
  assert.match(validateManifest({ ...good(), phase: "bogus" }).errors.join(" "), /phase/)
  assert.equal(validateManifest({ ...good(), phase: null }).ok, false, "phase:null 同样拒（不在枚举）")
  assert.deepEqual(validateManifest(good()), { ok: true, errors: [], missingKeys: [] }, "五键齐全 → 通过（errors 空）")
  for (const p of MANIFEST_SCHEMA.enum.phase) assert.equal(validateManifest({ ...good(), phase: p }).ok, true) // 枚举判据单源（取自 MANIFEST_SCHEMA，无硬编码）
})

test("AC-6 旧档残留键（access + activeBatch）→ ok:true / errors 空 / 返回 manifest 无两键（回写收敛）", () => {
  const { dir, clean } = fixture()
  try {
    writeRaw(dir, { ...good(), access: "from-zero", activeBatch: "docs/batches/no-such.md" })
    const r = readManifest(dir)
    assert.deepEqual([r.ok, r.errors], [true, []], "ok:true / errors 空（悬空值不再校验——校验器已回归纯函数）")
    assert.deepEqual([r.manifest.access, r.manifest.activeBatch], [undefined, undefined], "只搬已知键（两键均不入返回）")
    writeManifest(dir, r.manifest, { writer: "main" })
    const onDisk = JSON.parse(readFileSync(join(dir, MANIFEST_REL), "utf8"))
    assert.deepEqual([onDisk.access, onDisk.activeBatch], [undefined, undefined], "回写自然收敛（两键均不落盘）")
  } finally { clean() }
})

// ── AC-M1-2（规格 AC-M1-2 · T5）：整档缺失 → reason:'missing'（不静默 fallback）；**不拒会话**（按用点报明 + 建档流）───
test("AC-M1-2 整档缺失 → readManifest/requireManifest reason:'missing'，不 fallback", () => {
  const { dir, clean } = fixture()
  try {
    for (const read of [readManifest, requireManifest]) {
      const r = read(dir)
      assert.equal(r.ok, false)
      assert.equal(r.reason, "missing")
      assert.equal(r.manifest, null, "缺失不产默认值（绝不静默 fallback）")
    }
  } finally {
    clean()
  }
})

test("AC-M1-2b 档存在但非法 JSON / 顶层非对象 → reason:'invalid'（同样拒）", () => {
  const { dir, clean } = fixture()
  try {
    writeFileSync(join(dir, MANIFEST_REL), "{not-json")
    const r1 = readManifest(dir)
    assert.equal(r1.ok, false)
    assert.equal(r1.reason, "invalid")
    assert.ok(r1.errors.length > 0)
    writeRaw(dir, [1, 2, 3])
    const r2 = readManifest(dir)
    assert.equal(r2.ok, false)
    assert.equal(r2.reason, "invalid")
    assert.match(r2.errors.join(" "), /顶层/)
  } finally {
    clean()
  }
})

// ── AC-M1-3（规格 AC-M1-3 · T3/T3b）：docRoot 缺键 → 用默认值（不拒）────────────────
test("AC-M1-3 docRoot 整键缺 → 补默认 + missingKeys 含 'docRoot'（ok:true）", () => {
  const { dir, clean } = fixture()
  try {
    const partial = good()
    delete partial.docRoot
    writeRaw(dir, partial)
    const r = readManifest(dir)
    assert.equal(r.ok, true)
    assert.ok(r.missingKeys.includes("docRoot"), `missingKeys 含 docRoot（实际：${r.missingKeys}）`)
    assert.deepEqual(r.manifest.docRoot, DEFAULT_MANIFEST.docRoot, "整键补默认五路径")
  } finally {
    clean()
  }
})

test("AC-M1-3b docRoot 子键缺 → 补该子键默认 + missingKeys 含子键路径（其余保留）", () => {
  const { dir, clean } = fixture()
  try {
    const partial = good()
    partial.docRoot = { requirements: "docs/custom-requirements" }
    writeRaw(dir, partial)
    const r = readManifest(dir)
    assert.equal(r.ok, true)
    assert.ok(r.missingKeys.includes("docRoot.specs"), `missingKeys 含 docRoot.specs（实际：${r.missingKeys}）`)
    assert.equal(r.manifest.docRoot.specs, DEFAULT_MANIFEST.docRoot.specs, "缺的子键补默认")
    assert.equal(r.manifest.docRoot.requirements, "docs/custom-requirements", "既有子键不覆写")
  } finally {
    clean()
  }
})

test("AC-M1-3d docRoot 非对象值 → 与整键缺同语义（保持默认整键）", () => {
  const { dir, clean } = fixture()
  try {
    const partial = good()
    partial.docRoot = "not-an-object"
    writeRaw(dir, partial)
    const r = readManifest(dir)
    assert.equal(r.ok, true)
    assert.ok(r.missingKeys.includes("docRoot"), `missingKeys 含 docRoot（实际：${r.missingKeys}）`)
    assert.deepEqual(r.manifest.docRoot, DEFAULT_MANIFEST.docRoot, "非对象整键 → 保持默认五路径")
  } finally {
    clean()
  }
})

test("AC-M1-3c checkConfig 子键缺 / 顶层键缺 → 同语义 fallback（不拒）", () => {
  const { dir, clean } = fixture()
  try {
    const partial = good()
    delete partial.checkConfig.scanDirs
    delete partial.phase
    writeRaw(dir, partial)
    const r = readManifest(dir)
    assert.equal(r.ok, true)
    assert.ok(r.missingKeys.includes("checkConfig.scanDirs"))
    assert.ok(r.missingKeys.includes("phase"))
    assert.deepEqual(r.manifest.checkConfig.scanDirs, DEFAULT_MANIFEST.checkConfig.scanDirs)
    assert.equal(r.manifest.phase, DEFAULT_MANIFEST.phase)
  } finally {
    clean()
  }
})

// ── AC-M1-5（规格 AC-M1-5 · T7）：非主 agent 写 manifest → 拒（fail-closed）───────────
test("AC-M1-5 非主 agent 写 / 初始化 → 拒（缺省同拒）；主 agent 放行", () => {
  const { dir, clean } = fixture()
  try {
    assert.throws(() => writeManifest(dir, good(), { writer: "subagent" }), /拒绝/)
    assert.throws(() => writeManifest(dir, good()), /拒绝/, "writeManifest 缺省 writer 拒")
    assert.throws(() => initManifest(dir, { writer: "subagent" }), /拒绝/)
    assert.throws(() => initManifest(dir), /拒绝/, "initManifest 缺省 writer 拒（同一闸）")
    const manifest = initManifest(dir, { writer: "main" })
    assert.deepEqual(manifest, DEFAULT_MANIFEST, "initManifest 返回默认 manifest")
    const onDisk = JSON.parse(readFileSync(join(dir, MANIFEST_REL), "utf8"))
    assert.deepEqual(onDisk, DEFAULT_MANIFEST, "落盘 = 默认五键档")
    assert.deepEqual(Object.keys(onDisk).sort(), Object.keys(DEFAULT_MANIFEST).sort(), "恰好五键")
  } finally {
    clean()
  }
})

test("AC-M1-5b writeManifest 落盘前先校验（ok:false → 拒落盘，防写非法档）", () => {
  const { dir, clean } = fixture()
  try {
    assert.throws(() => writeManifest(dir, { ...good(), phase: "bogus" }, { writer: "main" }), /校验不过/)
  } finally {
    clean()
  }
})

// ── T1/T2（正常路径）：整档合法读回 · 初始化后读回 ────────────────────────────────────
test("T1 整档存在且合法 → readManifest ok:true，manifest 完整无缺键", () => {
  const { dir, clean } = fixture()
  try {
    initManifest(dir, { writer: "main" })
    const r = readManifest(dir)
    assert.equal(r.ok, true)
    assert.deepEqual(r.manifest, DEFAULT_MANIFEST)
    assert.deepEqual(r.missingKeys, [])
    assert.equal(r.reason, undefined)
    assert.equal(requireManifest(dir).manifest.version, 1, "requireManifest = 钩子入口")
  } finally {
    clean()
  }
})

test("T-F9 resolveProjectRoot: cwd 自身仓；容器根向下唯一带 manifest 子仓（纯向下——2026-09-17 用户裁定）", () => {
  // 关闭注入面——本用例测真判据（tmp 自建 .git / manifest 形态）
  _resetProjectRootForTest()
  const base = mkdtempSync(join(tmpdir(), "projroot-"))
  try {
    const repo = join(base, "repo")
    mkdirSync(join(repo, ".git"), { recursive: true })
    // ① cwd 自身是仓 → 自身
    assert.equal(resolveProjectRoot(repo), repo, "①cwd 自身仓 → 自身")
    // ② 容器根（无 .git）向下唯一带 manifest 子仓 → 它
    const container = join(base, "container")
    mkdirSync(container, { recursive: true })
    mkdirSync(join(container, "repo2"), { recursive: true })
    mkdirSync(join(container, "repo2", ".git"), { recursive: true })
    writeFileSync(join(container, "repo2", MANIFEST_REL), JSON.stringify(DEFAULT_MANIFEST), "utf8")
    assert.equal(resolveProjectRoot(container), join(container, "repo2"), "②容器根向下唯一带 manifest 子仓")
    // ③ 两个带 manifest 的子仓 → 歧义 null
    mkdirSync(join(container, "repo3"), { recursive: true })
    mkdirSync(join(container, "repo3", ".git"), { recursive: true })
    writeFileSync(join(container, "repo3", MANIFEST_REL), JSON.stringify(DEFAULT_MANIFEST), "utf8")
    assert.equal(resolveProjectRoot(container), null, "③多个带 manifest 子仓 → 歧义 null")
    // ④ 无任何带 manifest 子仓 → null
    const bare = join(base, "bare")
    mkdirSync(bare, { recursive: true })
    assert.equal(resolveProjectRoot(bare), null, "④零个 → null")
  } finally {
    rmSync(base, { recursive: true, force: true })
  }
})

test("T2 初始化（manifest 缺失 + initManifest(writer:'main')）→ 写默认五键档", () => {
  const { dir, clean } = fixture()
  try {
    const before = readManifest(dir)
    assert.equal(before.ok, false)
    const manifest = initManifest(dir, { writer: "main" })
    assert.deepEqual(manifest, DEFAULT_MANIFEST)
    const after = readManifest(dir)
    assert.equal(after.ok, true)
    assert.deepEqual(after.manifest, DEFAULT_MANIFEST)
  } finally {
    clean()
  }
})

test("边界：version 非数值 → 拒；version 缺 → 补默认不拒", () => {
  const { dir, clean } = fixture()
  try {
    assert.equal(validateManifest({ ...good(), version: "1" }).ok, false, "version 字符串拒")
    assert.match(validateManifest({ ...good(), version: "1" }).errors.join(" "), /version/)
    const partial = good()
    delete partial.version
    writeRaw(dir, partial)
    const r = readManifest(dir)
    assert.equal(r.ok, true)
    assert.ok(r.missingKeys.includes("version"))
    assert.equal(r.manifest.version, 1)
  } finally {
    clean()
  }
})

test("边界：readManifest 缺键后经再校验——枚举非法值不被默认值掩盖（补默认 ≠ 洗白非法）", () => {
  const { dir, clean } = fixture()
  try {
    const partial = good()
    partial.phase = "bogus"
    delete partial.docRoot
    writeRaw(dir, partial)
    const r = readManifest(dir)
    assert.equal(r.ok, false, "补 docRoot 后 phase 仍非法 → 再校验拒")
    assert.match(r.errors.join(" "), /phase/)
    assert.ok(r.missingKeys.includes("docRoot"), "missingKeys 仍如实报告缺键")
  } finally {
    clean()
  }
})

// ── AC-21（T41/T42——仓发现单源）：discoverRepos 四态 + resolveProjectRoot 零语义回归（候选排序取证 = 值断言；readdir 序本机不可判别）──
function fourStates(base) { // T41/T42 共用四态夹具（真判据——tmp 自建 `.git` + `MANIFEST_REL` 档，同 T-F9 法）
  const dir = (rel) => (mkdirSync(join(base, rel), { recursive: true }), join(base, rel))
  const repo = (rel, manifest = true) => {
    const d = dir(rel)
    mkdirSync(join(d, ".git")); if (manifest) writeFileSync(join(d, MANIFEST_REL), JSON.stringify(DEFAULT_MANIFEST), "utf8")
    return d
  }
  return { selfRepo: repo("self-repo"), container: dir("container"), unique: repo("container/the-repo"),
    noManifest: repo("container/no-manifest", false), empty: dir("empty"), two: dir("two"),
    alpha: repo("two/alpha-repo"), zed: repo("two/zed-repo") } // noManifest = 含 .git 无 manifest（判别合取）
}

test("T41 discoverRepos 四态：self / unique（合取判别 + 候选）/ none / ambiguous（候选全列按名排序）", () => {
  _resetProjectRootForTest(); const base = mkdtempSync(join(tmpdir(), "discover-")) // 复位注入面（测真判据）
  try {
    const f = fourStates(base)
    assert.deepEqual(discoverRepos(f.selfRepo), { kind: "self", root: f.selfRepo, candidates: [], matched: "git" }, "①self：锚即根")
    assert.deepEqual(discoverRepos(f.container), { kind: "unique", root: f.unique, candidates: [f.unique], matched: "manifest" }, "②unique：干扰目录无 manifest 不入选")
    assert.deepEqual(discoverRepos(f.empty), { kind: "none", root: null, candidates: [], matched: null }, "③none：零候选")
    assert.deepEqual(discoverRepos(f.two), { kind: "ambiguous", root: null, candidates: [f.alpha, f.zed], matched: "manifest" }, "④ambiguous：候选全列 + 按名排序")
  } finally { rmSync(base, { recursive: true, force: true }) }
})

test("T42 resolveProjectRoot 带档路径回归：四态映射与批前逐字同（self/unique ⇒ 路径；none/ambiguous ⇒ null）", () => {
  _resetProjectRootForTest(); const base = mkdtempSync(join(tmpdir(), "projroot-regress-"))
  try {
    const f = fourStates(base)
    for (const [d, want] of [[f.selfRepo, f.selfRepo], [f.container, f.unique], [f.empty, null], [f.two, null]]) assert.equal(resolveProjectRoot(d), want, `四态映射：${basename(d)}`)
    _setProjectRootForTest(base); assert.equal(resolveProjectRoot("ignored"), resolve(base), "覆盖语义保持（覆盖在场 ⇒ 覆盖值——批前短路逐字同）")
  } finally { _resetProjectRootForTest(); rmSync(base, { recursive: true, force: true }) }
})

// ── AC-23 / AC-24 / AC-26 / AC-30（T43–T48 · T54–T55——#188 发现梯 / 归属形 / 单源结构 / init:false 歧义）──

/** T43–T45 / T48 共用夹具（真判据——tmp 自建 `.git` / `MANIFEST_REL`，同 T-F9 法）。
 *  t1 梯① 锚带档（无 .git）· t2 梯② 锚 = 裸仓 · t3 梯③ 容器 + 恰一「.git + 档」子仓（旁夹裸仓）·
 *  t4 梯④ 容器 + 恰一裸仓 · t5 梯⑤ 空容器 · t6 梯⑥ 容器 + 两带档子仓（旁夹裸仓）。 */
/** 子仓子件（模块级——各夹具共用）：`rel` 建仓（`.git`）；`manifest` 控制是否落档。 */
function childRepo(base, rel, manifest = true) {
  const d = join(base, rel)
  mkdirSync(join(d, ".git"), { recursive: true })
  if (manifest) writeFileSync(join(d, MANIFEST_REL), JSON.stringify(DEFAULT_MANIFEST), "utf8")
  return d
}

function ladderFixture(base) {
  const dir = (rel) => { const d = join(base, rel); mkdirSync(d, { recursive: true }); return d }
  const git = (d) => { mkdirSync(join(d, ".git"), { recursive: true }); return d }
  const doc = (d) => { writeFileSync(join(d, MANIFEST_REL), JSON.stringify(DEFAULT_MANIFEST), "utf8"); return d }
  return {
    t1: doc(dir("t1-self-manifest")),
    t2: git(dir("t2-self-bare")),
    t3: dir("t3-container"), t3hit: childRepo(base, "t3-container/hit"),
    t4: dir("t4-container"), t4hit: childRepo(base, "t4-container/only", false),
    t5: dir("t5-empty"),
    t6: dir("t6-two"), t6a: childRepo(base, "t6-two/alpha"), t6z: childRepo(base, "t6-two/zed"),
  }
}

test("T43 发现梯两表六格：①锚带档 ②锚=裸仓 ③带档子仓恰一 ④裸仓恰一 ⑤空容器 ⑥两带档子仓（+干扰裸仓）", () => {
  _resetProjectRootForTest(); const base = mkdtempSync(join(tmpdir(), "ladder-six-"))
  try {
    const f = ladderFixture(base)
    childRepo(base, "t3-container/decoy", false) // 干扰项：含 .git 无档（判别合取——只扫 .git 的第二实现会选错）
    childRepo(base, "t6-two/decoy", false)
    assert.deepEqual(discoverProjects(f.t1), { kind: "self", root: f.t1, candidates: [], matched: "manifest" }, "①项目梯：锚带档（无 .git）⇒ self/manifest")
    assert.deepEqual(discoverProjects(f.t2), { kind: "self", root: f.t2, candidates: [], matched: "git" }, "②项目梯：锚 = 裸仓 ⇒ self/git")
    assert.deepEqual(discoverProjects(f.t3), { kind: "unique", root: f.t3hit, candidates: [f.t3hit], matched: "manifest" }, "③带档级优先（干扰裸仓不入选）")
    assert.deepEqual(discoverProjects(f.t4), { kind: "unique", root: f.t4hit, candidates: [f.t4hit], matched: "git" }, "④零档降级 ⇒ 裸仓命中")
    assert.deepEqual(discoverProjects(f.t5), { kind: "none", root: null, candidates: [], matched: null }, "⑤均无 ⇒ none")
    assert.deepEqual(discoverProjects(f.t6), { kind: "ambiguous", root: null, candidates: [f.t6a, f.t6z], matched: "manifest" }, "⑥歧义：该级全列 + 按名排序（不越级）")
    // 仓梯同夹具逐格对
    assert.deepEqual(discoverRepos(f.t1), { kind: "none", root: null, candidates: [], matched: null }, "①仓梯：锚无 .git ∧ 下无仓 ⇒ none")
    assert.deepEqual(discoverRepos(f.t2), { kind: "self", root: f.t2, candidates: [], matched: "git" }, "②仓梯：锚 = 仓根")
    assert.deepEqual(discoverRepos(f.t3), { kind: "unique", root: f.t3hit, candidates: [f.t3hit], matched: "manifest" }, "③仓梯：带档子仓命中（重定向面）")
    assert.deepEqual(discoverRepos(f.t4), { kind: "unique", root: f.t4hit, candidates: [f.t4hit], matched: "git" }, "④仓梯：裸仓级新命中（#188）")
    assert.deepEqual(discoverRepos(f.t5), { kind: "none", root: null, candidates: [], matched: null }, "⑤none")
    assert.deepEqual(discoverRepos(f.t6), { kind: "ambiguous", root: null, candidates: [f.t6a, f.t6z], matched: "manifest" }, "⑥歧义：旁夹裸仓不入候选")
  } finally { rmSync(base, { recursive: true, force: true }) }
})

test("T44 不递归 / 不向上：孙目录带档与子目录内嵌仓皆不可见；发现纯向下（归属才向上）", () => {
  _resetProjectRootForTest(); const base = mkdtempSync(join(tmpdir(), "ladder-layer-"))
  try {
    const c1 = join(base, "g1"); mkdirSync(join(c1, "child", "grand"), { recursive: true })
    writeFileSync(join(c1, "child", "grand", MANIFEST_REL), JSON.stringify(DEFAULT_MANIFEST), "utf8")
    assert.deepEqual(discoverProjects(c1), { kind: "none", root: null, candidates: [], matched: null }, "孙目录带档不可见（只看直接子目录一层）")
    const c2 = join(base, "g2"); mkdirSync(join(c2, "sub", "inner", ".git"), { recursive: true })
    assert.deepEqual(discoverProjects(c2), { kind: "none", root: null, candidates: [], matched: null }, "子目录内嵌仓不越级")
    assert.deepEqual(discoverRepos(c2), { kind: "none", root: null, candidates: [], matched: null }, "仓梯同判（不递归）")
    // 不向上：锚在项目树内 ⇒ 发现仍 none，归属（另一条方向）才命中祖先
    const root = join(base, "g3"); mkdirSync(join(root, "deep", "leaf"), { recursive: true })
    writeFileSync(join(root, MANIFEST_REL), JSON.stringify(DEFAULT_MANIFEST), "utf8")
    assert.deepEqual(discoverProjects(join(root, "deep", "leaf")), { kind: "none", root: null, candidates: [], matched: null }, "发现纯向下（不向上）")
    assert.equal(owningProject(join(root, "deep", "leaf")), root, "归属沿祖先链向上（两条方向）")
  } finally { rmSync(base, { recursive: true, force: true }) }
})

test("T45 resolveProjectRoot 变更面：①②⇒锚 ③⇒子仓根 ④⇒裸仓根（批前 null）⑤⑥⇒null；项目树内 ⇒ 项目根", () => {
  _resetProjectRootForTest(); const base = mkdtempSync(join(tmpdir(), "projroot-change-"))
  try {
    const f = ladderFixture(base)
    childRepo(base, "t3-container/decoy", false); childRepo(base, "t6-two/decoy", false)
    assert.equal(resolveProjectRoot(f.t1), f.t1, "①锚带档 ⇒ 锚")
    assert.equal(resolveProjectRoot(f.t2), f.t2, "②锚 = 裸仓 ⇒ 锚（缺档 = 建档机会）")
    assert.equal(resolveProjectRoot(f.t3), f.t3hit, "③带档子仓 ⇒ 子仓根")
    assert.equal(resolveProjectRoot(f.t4), f.t4hit, "④裸仓恰一 ⇒ 该仓根（批前 = null——先红）")
    assert.equal(resolveProjectRoot(f.t5), null, "⑤无项目 ⇒ null")
    assert.equal(resolveProjectRoot(f.t6), null, "⑥歧义 ⇒ null")
    // 项目树内路径 ⇒ 项目根（错层建档修——批前回落 resolve(cwd)）
    const sub = join(f.t1, "docs", "deep"); mkdirSync(sub, { recursive: true })
    assert.equal(resolveProjectRoot(sub), f.t1, "项目树内路径 ⇒ 项目根（错层建档修）")
  } finally { rmSync(base, { recursive: true, force: true }) }
})

test("projectView 五态归位：ok / missing / no-project / ambiguous（两档 matched）/ invalid", () => {
  _resetProjectRootForTest(); const base = mkdtempSync(join(tmpdir(), "projview-"))
  try {
    const f = ladderFixture(base)
    childRepo(base, "t3-container/decoy", false)
    const ok = projectView(f.t1)
    assert.equal(ok.state, "ok", "①档合法")
    assert.equal(ok.root, f.t1); assert.equal(ok.path, join(f.t1, MANIFEST_REL)); assert.equal(ok.matched, "manifest")
    assert.equal(ok.manifest.phase, DEFAULT_MANIFEST.phase, "返回面含补默认值后的档内容")
    const missing = projectView(f.t2)
    assert.equal(missing.state, "missing", "②裸仓缺档（梯②）")
    assert.equal(missing.root, f.t2); assert.equal(missing.matched, "git")
    assert.equal(projectView(f.t5).state, "no-project", "③无项目（梯⑤）")
    assert.equal(projectView(f.t5).matched, null)
    const amb = projectView(f.t6)
    assert.equal(amb.state, "ambiguous", "④歧义（带档级）")
    assert.deepEqual(amb.candidates, [f.t6a, f.t6z]); assert.equal(amb.matched, "manifest")
    const scratch = join(base, "bare-two"); mkdirSync(join(scratch, "x", ".git"), { recursive: true }); mkdirSync(join(scratch, "y", ".git"), { recursive: true })
    assert.equal(projectView(scratch).matched, "git", "④歧义（裸仓级——报明行变体分野）")
    const bad = join(base, "bad"); mkdirSync(join(bad, ".git"), { recursive: true })
    writeFileSync(join(bad, MANIFEST_REL), "{ not json", "utf8")
    const invalid = projectView(bad)
    assert.equal(invalid.state, "invalid", "⑤档非法")
    assert.match(invalid.errors.join(" "), /JSON/)
    assert.equal(invalid.root, bad); assert.equal(invalid.path, join(bad, MANIFEST_REL))
    // 覆盖位短路（批前「覆盖即覆盖值」语义——归属段与发现段双短路）
    _setProjectRootForTest(base)
    assert.equal(owningProject("ignored"), resolve(base), "owningProject 覆盖位头部短路")
    assert.equal(projectView("ignored").root, resolve(base), "projectView 两段均不落真判据")
  } finally { _resetProjectRootForTest(); rmSync(base, { recursive: true, force: true }) }
})

test("T48 归属形（嵌套 / 按用点）：子优于根 / 不跨兄弟 / 容器锚走发现兜底 / 取档按路径", () => {
  _resetProjectRootForTest(); const base = mkdtempSync(join(tmpdir(), "owning-"))
  try {
    const C = join(base, "C"); const R = join(C, "R"); const S = join(R, "S"); const X = join(C, "X")
    mkdirSync(S, { recursive: true }); mkdirSync(X, { recursive: true })
    writeFileSync(join(R, MANIFEST_REL), JSON.stringify(DEFAULT_MANIFEST), "utf8")
    writeFileSync(join(S, MANIFEST_REL), JSON.stringify({ ...DEFAULT_MANIFEST, docRoot: { ...DEFAULT_MANIFEST.docRoot, design: "docs/s-design" } }), "utf8")
    assert.equal(owningProject(join(S, "f.txt")), S, "①S 内文件 ⇒ S（子优于根）")
    assert.equal(projectView(join(S, "f.txt")).manifest.docRoot.design, "docs/s-design", "①按用点：取 S 的声明")
    assert.equal(owningProject(join(R, "f.txt")), R, "②R 内 S 外 ⇒ R")
    assert.equal(owningProject(join(X, "f.txt")), null, "③X 内 ⇒ 无祖先档（不跨兄弟）")
    assert.equal(projectView(join(X, "f.txt")).state, "no-project", "③旁支带档不可见")
    assert.equal(owningProject(C), null, "④容器自身与祖先均无档")
    assert.deepEqual(discoverProjects(C), { kind: "unique", root: R, candidates: [R], matched: "manifest" }, "④发现兜底：向下恰一")
    assert.equal(projectView(C).root, R, "④容器锚语义保持")
    assert.equal(projectView(C).state, "ok")
    assert.equal(resolveProjectRoot(C), R, "④resolveProjectRoot = 归属 ∨ 发现")
    assert.deepEqual(docRootPaths("docs/s-design", join(S, "f.txt")), [join(S, "docs", "s-design")], "按用点：基数 = 该目标项目根（会话不绑定项目）")
  } finally { rmSync(base, { recursive: true, force: true }) }
})

test("T54 单源结构：`readdirSync` 全档恰 1 处 ∧ 居私有内核 `scanChildren` 体内 ∧ 两梯各含内核调用", () => {
  const raw = readFileSync(new URL("../manifest.mjs", import.meta.url), "utf8")
  // 注释剥除后再扫（承 A20 法——散文提词不构成调用，免假红）；import 声明行剔除——
  // `node:fs` 的绑定名（`readdirSync`）是模块唯一绑定，判据对象 = **扫描实现**恰一处。
  const src = raw.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1").replace(/^\s*import[^\n]*\n/gm, "")
  assert.equal(src.split("readdirSync").length - 1, 1, "readdirSync 全档恰 1 处（禁第二份扫描实现）")
  const bodyOf = (name) => {
    const start = src.indexOf(`function ${name}(`)
    assert.ok(start >= 0, `${name} 在场`)
    const from = src.indexOf("{", start)
    let depth = 0
    let i = from
    for (; i < src.length; i++) {
      if (src[i] === "{") depth++
      else if (src[i] === "}") { depth--; if (depth === 0) break }
    }
    return src.slice(from, i + 1)
  }
  assert.ok(bodyOf("scanChildren").includes("readdirSync"), "readdirSync 居私有内核 scanChildren 体内")
  for (const fn of ["discoverProjects", "discoverRepos"]) {
    assert.ok(bodyOf(fn).includes("scanChildren("), `${fn} 经同一内核取子目录表（两梯一核——KD-M1-23）`)
  }
})

test("T55 init:false 面歧义（VSC depth > 0）：容器 + ≥2 带档子仓 ⇒ 不抛 + code:ambiguous + candidates + 零建档", () => {
  _resetProjectRootForTest(); const base = mkdtempSync(join(tmpdir(), "init-false-"))
  try {
    const c = join(base, "container"); mkdirSync(c, { recursive: true })
    const legal = JSON.stringify(DEFAULT_MANIFEST)
    for (const n of ["alpha", "zed"]) { const d = join(c, n); mkdirSync(join(d, ".git"), { recursive: true }); writeFileSync(join(d, MANIFEST_REL), legal, "utf8") }
    const r = resolveEngineeringManifest(c, { init: false })
    assert.equal(r.ok, false, "非 ok（歧义）")
    assert.equal(r.code, "ambiguous", "与 §2.8 F1 `!init` 歧义出口逐码一致")
    assert.deepEqual(r.candidates, [join(c, "alpha"), join(c, "zed")], "候选全列 + 按名排序")
    assert.match(r.message, /项目不可解析/, "文案族锚句（KD-M1-28）")
    assert.equal(existsSync(join(c, MANIFEST_REL)), false, "锚处零建档")
    for (const n of ["alpha", "zed"]) assert.equal(readFileSync(join(c, n, MANIFEST_REL), "utf8"), legal, "候选档未被改（不建 / 不猜）")
  } finally { rmSync(base, { recursive: true, force: true }) }
})
