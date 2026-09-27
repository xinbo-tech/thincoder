/**
 * manifest-discovery.test.mjs — M1 **发现 / 归属面**用例组（2026-09-27 自 `manifest.test.mjs` 拆出，
 * 纯搬移零语义——拆档登记：`docs/core/design/MANIFEST.md` §2.3 表下「>300 软线 / 硬限面」注块，
 * 触发条件 = 本批增量使主档越 500 硬限）。
 * 权威验收 = `docs/core/design/MANIFEST.md` §2.2（发现梯两表 / 归属形 / 按用点解析）+ §3.2
 * （T41–T45 / T48 / T54）。
 * 隔离：真判据夹具（tmp 自建 `.git` / `MANIFEST_REL` 档；逐组复位注入面）——全同步 fs。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { basename, join, resolve } from "node:path"
import {
  discoverRepos, discoverProjects, owningProject, projectView, resolveProjectRoot, docRootPaths,
  MANIFEST_REL, DEFAULT_MANIFEST, _resetProjectRootForTest, _setProjectRootForTest,
} from "../manifest.mjs"

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

// ── AC-23 / AC-24 / AC-26 / AC-30（T43–T48 · T54——发现梯 / 归属形 / 单源结构）──

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
