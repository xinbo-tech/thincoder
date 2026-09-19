/**
 * manifest.test.mjs — M1 项目状态档 manifest 单测。
 * 权威验收 = docs/core/design/modules/ENGINEERING-MODE-V2-MODULE-MANIFEST.md §3
 * （AC-M1-1..5 回指规格 AC 号 + T1–T7 用例表）。
 * 隔离：每用例组 mkdtempSync tmpdir 数据档（无真仓污染）；全同步 fs——快层安全。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { basename, join, resolve } from "node:path"
import {
  readManifest, validateManifest, initManifest, writeManifest, requireManifest, resolveProjectRoot, discoverRepos,
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

// ── AC-M1-2（规格 AC-M1-2 · T5）：整档缺失 → 拒进正常循环（不静默 fallback）──────────
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
    assert.deepEqual(discoverRepos(f.selfRepo), { kind: "self", root: f.selfRepo, candidates: [] }, "①self：锚即根")
    assert.deepEqual(discoverRepos(f.container), { kind: "unique", root: f.unique, candidates: [f.unique] }, "②unique：干扰目录无 manifest 不入选")
    assert.deepEqual(discoverRepos(f.empty), { kind: "none", root: null, candidates: [] }, "③none：零候选")
    assert.deepEqual(discoverRepos(f.two), { kind: "ambiguous", root: null, candidates: [f.alpha, f.zed] }, "④ambiguous：候选全列 + 按名排序")
  } finally { rmSync(base, { recursive: true, force: true }) }
})

test("T42 resolveProjectRoot 零语义回归：四态映射与批前逐字同（self/unique ⇒ 路径；none/ambiguous ⇒ null）", () => {
  _resetProjectRootForTest(); const base = mkdtempSync(join(tmpdir(), "projroot-regress-"))
  try {
    const f = fourStates(base)
    for (const [d, want] of [[f.selfRepo, f.selfRepo], [f.container, f.unique], [f.empty, null], [f.two, null]]) assert.equal(resolveProjectRoot(d), want, `四态映射：${basename(d)}`)
    _setProjectRootForTest(base); assert.equal(resolveProjectRoot("ignored"), resolve(base), "覆盖语义保持（覆盖在场 ⇒ 覆盖值——批前短路逐字同）")
  } finally { _resetProjectRootForTest(); rmSync(base, { recursive: true, force: true }) }
})
