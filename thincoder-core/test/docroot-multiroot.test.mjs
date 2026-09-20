/**
 * docroot-multiroot.test.mjs — `docRoot` 值形态扩展（单串 | 多根数组）单测。
 * 权威验收 = docs/core/design/MANIFEST.md §3.1 AC-7–AC-13 + §3.2 T15–T22。
 * 隔离：用例组 mkdtempSync tmpdir 数据档（项目根注入面——tmp 无 .git）；端到端用例
 * （AC-13）显式复位注入面，走真判据（本仓 .git）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import {
  DEFAULT_MANIFEST, MANIFEST_REL, _resetProjectRootForTest, _setProjectRootForTest,
  docRootPaths, isValidDocRootValue, readManifest, validateManifest, writeManifest,
} from "../manifest.mjs"
import { resolveReviewTargetPaths } from "../agent/write-gate.mjs"
import { resolveBatchDocPath } from "../agent-tools/batch.mjs"

/** 本仓根（thincoder-core/test/ → 上两级）——AC-13 端到端用。 */
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..")

/** 每组一个干净 tmpdir 数据档目录（项目根语义——注入面：tmp 无 .git）。 */
const fixture = () => {
  const dir = mkdtempSync(join(tmpdir(), "docroot-multiroot-"))
  _setProjectRootForTest(dir)
  return { dir, clean: () => { _resetProjectRootForTest(); rmSync(dir, { recursive: true, force: true }) } }
}

const good = () => structuredClone(DEFAULT_MANIFEST)
const writeRaw = (dir, obj) => writeFileSync(join(dir, MANIFEST_REL), JSON.stringify(obj, null, 2))
/** 期望的解析结果（基数 = 项目根 = 注入的 tmp 目录）。 */
const abs = (dir, rel) => resolve(dir, rel)

// ── AC-7 / T15：单串零变（既有形态，语义与解析结果同改造前）──────────────────────
test("AC-7/T15 单串兼容：校验通过 + 解析 = 该单根 + 评审根含该根", () => {
  const { dir, clean } = fixture()
  try {
    const m = { ...good(), docRoot: { ...good().docRoot, design: "docs/core/design" } }
    assert.equal(validateManifest(m).ok, true, "单串 → 校验通过")
    writeRaw(dir, m)
    const r = readManifest(dir)
    assert.deepEqual([r.ok, r.manifest.docRoot.design], [true, "docs/core/design"], "读回原值")
    assert.deepEqual(docRootPaths(r.manifest.docRoot.design, dir), [abs(dir, "docs/core/design")], "单根绝对路径")
    assert.ok(resolveReviewTargetPaths({ cwd: dir }).includes(abs(dir, "docs/core/design")), "评审根含该根")
  } finally { clean() }
})

// ── AC-8 / T16–T18：数组展开（基数 = 项目根，顺序 = 声明序）+ 归一 ─────────────────
test("AC-8/T16 数组展开：三根（顺序 = 声明序；基数 = 项目根）", () => {
  const { dir, clean } = fixture()
  try {
    const decl = ["docs/core/design", "docs/cli/design", "docs/vsc/design"]
    const m = { ...good(), docRoot: { ...good().docRoot, design: decl } }
    assert.equal(validateManifest(m).ok, true, "非空串数组 → 校验通过")
    writeRaw(dir, m)
    const r = readManifest(dir)
    assert.deepEqual(r.manifest.docRoot.design, decl, "数组原值保留（完整声明）")
    assert.deepEqual(docRootPaths(r.manifest.docRoot.design, dir), decl.map((p) => abs(dir, p)), "声明序绝对路径")
    const roots = resolveReviewTargetPaths({ cwd: dir })
    for (const p of decl) assert.ok(roots.includes(abs(dir, p)), `评审根含 ${p}（实际：${roots.join(", ")}）`)
  } finally { clean() }
})

test("T18 归一：元素带 `\\` / 首尾空白 / 尾斜杠 → 归一后命中同一根", () => {
  const { dir, clean } = fixture()
  try {
    assert.deepEqual(docRootPaths(["  docs/core/design  ", "docs\\cli\\design"], dir),
      [abs(dir, "docs/core/design"), abs(dir, "docs/cli/design")], "trim + `\\` 归一")
    assert.deepEqual(docRootPaths(["docs/core/design/", "docs/core/design"], dir),
      [abs(dir, "docs/core/design")], "尾斜杠与无尾斜杠 → resolve 归一后同一根")
  } finally { clean() }
})

// ── AC-9 / T17：去重（键内 + 跨键，保序）───────────────────────────────────────────
test("AC-9/T17 去重：键内重复保序唯一；跨键同值恰一次", () => {
  const { dir, clean } = fixture()
  try {
    writeRaw(dir, {
      ...good(),
      docRoot: {
        ...good().docRoot,
        requirements: ["docs/core/requirements", "docs/core/requirements"],
        design: ["docs/core/design", "docs/cli/design", "docs/core/design"],
        modules: ["docs/cli/design"], // 跨键同值（与 design 第 2 项）
      },
    })
    const r = readManifest(dir)
    assert.equal(r.ok, true)
    assert.deepEqual(docRootPaths(r.manifest.docRoot.design, dir),
      [abs(dir, "docs/core/design"), abs(dir, "docs/cli/design")], "键内去重保序")
    assert.deepEqual(docRootPaths(r.manifest.docRoot.requirements, dir),
      [abs(dir, "docs/core/requirements")], "重复声明 → 唯一")
    const roots = resolveReviewTargetPaths({ cwd: dir })
    assert.equal(roots.length, new Set(roots).size, "跨键去重：集合无重复")
    assert.equal(roots.filter((p) => p === abs(dir, "docs/cli/design")).length, 1, "跨键同值恰一次")
  } finally { clean() }
})

// ── AC-10 / T19：补默认单串 / 数组不合并 ────────────────────────────────────────────
test("AC-10/T19 缺子键补默认单串；给数组 = 该数组原值（默认不追加）", () => {
  const { dir, clean } = fixture()
  try {
    const partial = good()
    delete partial.docRoot.specs
    partial.docRoot.design = ["docs/cli/design", "docs/vsc/design"]
    writeRaw(dir, partial)
    const r = readManifest(dir)
    assert.equal(r.ok, true)
    assert.ok(r.missingKeys.includes("docRoot.specs"), `missingKeys 含 docRoot.specs（实际：${r.missingKeys}）`)
    assert.equal(r.manifest.docRoot.specs, DEFAULT_MANIFEST.docRoot.specs, "缺子键 → 补默认单串")
    assert.deepEqual(r.manifest.docRoot.design, ["docs/cli/design", "docs/vsc/design"], "数组原值保留")
    assert.ok(!r.manifest.docRoot.design.includes(DEFAULT_MANIFEST.docRoot.design), "不含默认 docs/design（不合并）")
    for (const [k, v] of Object.entries(DEFAULT_MANIFEST.docRoot)) {
      assert.equal(typeof v, "string", `默认档 ${k} 保持单串（KD-M1-9）`)
    }
  } finally { clean() }
})

// ── AC-11 / T20：非法形态拒（不静默）───────────────────────────────────────────────
test("AC-11/T20 非法形态拒：validateManifest 拒 + errors 含 docRoot.<键>；readManifest invalid；writeManifest 拒落盘", () => {
  const { dir, clean } = fixture()
  try {
    const bad = ["", "   ", [], ["a", 42], ["a", " "], 123, {}, null, ["docs/a", null], [[]], ["docs/a", ""]]
    for (const v of bad) {
      const res = validateManifest({ ...good(), docRoot: { ...good().docRoot, design: v } })
      assert.equal(res.ok, false, `非法值 ${JSON.stringify(v)} → 拒`)
      assert.match(res.errors.join(" "), /docRoot\.design/, `errors 含 docRoot.design（实际：${res.errors}）`)
      assert.deepEqual(docRootPaths(v, dir), [], `消费面共用判据：docRootPaths(${JSON.stringify(v)}) → []`)
    }
    assert.equal(isValidDocRootValue("docs/a"), true, "合法单串")
    assert.equal(isValidDocRootValue(["docs/a", "docs\\b"]), true, "合法数组（`\\` 形态元素）")
    assert.equal(isValidDocRootValue("  "), false, "空白串非法（trim 后为空）")
    writeRaw(dir, { ...good(), docRoot: { ...good().docRoot, design: [] } })
    const r = readManifest(dir)
    assert.equal(r.ok, false)
    assert.equal(r.reason, "invalid", "整档判 invalid（不静默跳过）")
    assert.match(r.errors.join(" "), /docRoot\.design/)
    assert.throws(() => writeManifest(dir, { ...good(), docRoot: { ...good().docRoot, design: "" } }, { writer: "main" }),
      /校验不过/, "writeManifest 拒落盘")
  } finally { clean() }
})

// ── AC-12 / T21：M3 第二基底（逐基底按序复判）────────────────────────────────────────
test("AC-12/T21 第二基底逐基底复判：第 2 基底命中 → 返回该路径；全不可读 → throw", () => {
  const { dir, clean } = fixture()
  try {
    const second = join(dir, "docs", "cli", "batches")
    mkdirSync(second, { recursive: true })
    writeFileSync(join(second, "r.md"), "# batch record\n", "utf8")
    assert.throws(() => resolveBatchDocPath(dir, "r.md"), /not a readable file/, "无 manifest → v1 单基底 throw")
    writeRaw(dir, { ...good(), docRoot: { ...good().docRoot, batches: ["docs/core/batches", "docs/cli/batches"] } })
    assert.equal(resolveBatchDocPath(dir, "r.md"), join(second, "r.md"), "第 2 基底命中 → 返回该路径")
    writeRaw(dir, { ...good(), docRoot: { ...good().docRoot, batches: ["no1", "no2"] } })
    assert.throws(() => resolveBatchDocPath(dir, "r.md"), /not a readable file/, "全不可读 → throw（fail-closed 不变）")
  } finally { clean() }
})

// ── AC-13 / T22：端到端（本仓数据档声明后，部分层设计档入评审根）────────────────────
test("AC-13/T22 端到端（本仓）：部分层入评审根，部分层设计档过评审根分类", () => {
  _resetProjectRootForTest() // 真判据（本仓 .git）
  const r = readManifest(REPO_ROOT)
  assert.equal(r.ok, true, `本仓数据档合法（errors：${r.errors.join(" ")}）`)
  assert.ok(Array.isArray(r.manifest.docRoot.design), "design = 多根数组")
  const roots = resolveReviewTargetPaths({ cwd: REPO_ROOT })
  for (const rel of ["docs/core/design", "docs/cli/design", "docs/vsc/design",
    "docs/core/requirements", "docs/cli/requirements", "docs/vsc/requirements"]) {
    assert.ok(roots.includes(resolve(REPO_ROOT, rel)), `评审根含 ${rel}（实际：${roots.join(", ")}）`)
  }
  // M6 分类同源口径（advisor.mjs design-review 分支）：文档路径落在某评审根内 → 放行
  const sep = process.platform === "win32" ? "\\" : "/"
  const norm = (p) => p.replace(/[\\/]/g, sep)
  const parts = roots.map(norm)
  const doc = norm(resolve(REPO_ROOT, "docs/cli/design/TUI.md"))
  assert.ok(parts.some((rt) => doc === rt || doc.startsWith(rt + sep)), "部分层设计档 docs/cli/design/TUI.md 过评审根分类")
})
