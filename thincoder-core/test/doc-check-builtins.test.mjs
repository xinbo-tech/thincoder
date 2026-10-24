// thincoder-core/test/doc-check-builtins.test.mjs — FR42 批内单元用例（AC-47 / AC-50 / AC-51）
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { dirname, join, relative, resolve } from "node:path"
import { tmpdir } from "node:os"
import { fileURLToPath } from "node:url"
import { DOC_CHECK_BUILTINS, runDocCheck } from "../doc-check/index.mjs"

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, "../..")
const posix = (p) => p.replace(/\\/g, "/")
const relOf = (root, p) => posix(relative(root, p))

/** 已退场参数名的拼装式（本档自身在扫描面内——字面写会让零消费检查命中自己）。 */
const RETIRED_PARAMS = ["scan" + "Dirs", "anchors." + "domain", "anchors." + "roots"]

/** 五键 manifest（**无**退场键——AC-47 的前提：工具照常判）。 */
function fiveKeyManifest() {
  return {
    version: 1,
    phase: "initial-dev",
    docRoot: {
      requirements: "docs/requirements",
      specs: "docs/requirements/specs",
      design: "docs/design",
      modules: "docs/design/modules",
      batches: "docs/batches",
    },
    codePaths: ["src"],
    index: { codeExtensions: [], docExtensions: [], excludePaths: [], publicRepos: [] },
  }
}

/** 夹具：a.md 干净 · b.md 一条悬空指针 · canary.md 一条悬空指针（不传入）· notes.txt 非 markdown */
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "doc-check-builtins-"))
  const w = (p, text = "") => { const abs = join(root, p); mkdirSync(dirname(abs), { recursive: true }); writeFileSync(abs, text) }
  w("PROJECT-MANIFEST.json", JSON.stringify(fiveKeyManifest(), null, 2) + "\n")
  w("docs/a.md", "# A\n\n本档干净。\n")
  w("docs/b.md", "# B\n\n见 absent-doc.md 一节。\n")
  w("docs/canary.md", "# 哨兵\n\n见 canary-absent.md。\n")
  w("docs/notes.txt", "非 markdown\n")
  return root
}

function* codeFiles(dir) {
  if (!existsSync(dir)) return
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === ".git" || e.name === "dist" || e.name === "build" || e.name === "coverage" || e.name === ".turbo" || e.name === ".thincoder") continue
    const p = join(dir, e.name)
    if (e.isDirectory()) yield* codeFiles(p)
    else if (/\.(?:mjs|cjs|js)$/.test(e.name)) yield p
  }
}

test("内置常量 · DOC_CHECK_BUILTINS：阈值 300 / 两项空列表 / 无参数族键", () => {
  assert.ok(Object.isFrozen(DOC_CHECK_BUILTINS))
  assert.equal(DOC_CHECK_BUILTINS.lineWidth, 300)
  assert.deepEqual([...DOC_CHECK_BUILTINS.widthExemptZones], [])
  assert.deepEqual([...DOC_CHECK_BUILTINS.exemptions], [])
  assert.deepEqual(Object.keys(DOC_CHECK_BUILTINS).sort(), ["exemptions", "lineWidth", "widthExemptZones"])
})

test("AC-47 · 无 checkConfig 的 manifest 上 gate 照常判；引擎源码面不读 manifest", () => {
  const root = fixture()
  try {
    const pass = runDocCheck(root, { mode: "gate", docs: ["docs/a.md"] })
    assert.equal(pass.report.split("\n")[0], "DOC-CHECK GATE: PASS")
    assert.doesNotMatch(pass.report, /ERROR|缺参数|取参失败/, "缺参数拒跑那一层已退场")
    const refused = runDocCheck(root, { mode: "gate", docs: ["docs/b.md"] })
    assert.equal(refused.report.split("\n")[0], "DOC-CHECK GATE: REFUSED（命中 1 条）")
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
  for (const f of ["index", "anchors", "width", "version"]) {
    const text = readFileSync(join(REPO, "thincoder-core/doc-check", `${f}.mjs`), "utf8")
    assert.equal(text.includes("readManifest"), false, `doc-check/${f}.mjs 仍读 manifest`)
  }
  const tool = readFileSync(join(REPO, "thincoder-core/agent-tools/doc-check.mjs"), "utf8")
  assert.equal(tool.includes("readManifest"), false, "工具面仍读 manifest")
})

test("AC-50① · 全仓源码：已退场参数名零消费（thincoder-core ∥ scripts ∥ 两端 src）", () => {
  const hits = []
  for (const dir of ["thincoder-core", "scripts", "thincoder-cli", "thincoder-vscode/src", "thincoder-desktop/src", "thincoder-render-core"]) {
    for (const f of codeFiles(join(REPO, dir))) {
      const text = readFileSync(f, "utf8")
      for (const token of RETIRED_PARAMS) {
        if (text.includes(token)) hits.push(`${posix(relative(REPO, f))} ⇒ ${token}`)
      }
    }
  }
  assert.deepEqual(hits, [], `仍消费已退场参数：${hits.join(" ∥ ")}`)
})

test("AC-50② · 不给 docs ⇒ 明确报错（两种问法）；report 空清单同报错；零目录遍历", () => {
  const root = fixture()
  try {
    assert.throws(() => runDocCheck(root), /`docs` is required/)
    assert.throws(() => runDocCheck(root, { mode: "gate" }), /`docs` is required/)
    assert.throws(() => runDocCheck(root, { docs: [] }), /docs is empty/)
    assert.throws(() => runDocCheck(root, { docs: "docs/a.md" }), /`docs` must be an array of paths/)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
  const engine = readFileSync(join(REPO, "thincoder-core/doc-check/index.mjs"), "utf8")
  for (const api of ["readdirSync", "scanDomain", "discoverDomains"]) {
    assert.equal(engine.includes(api), false, `引擎入口仍引目录遍历面：${api}`)
  }
})

test("AC-50③ · 传两档 ⇒ 只判这两档（哨兵不入判）；判定集 = 解析集", () => {
  const root = fixture()
  try {
    const r = runDocCheck(root, { docs: ["docs/a.md", "docs/b.md"] })
    assert.deepEqual(r.checkFiles.map((p) => relOf(root, p)), ["docs/a.md", "docs/b.md"])
    assert.deepEqual(r.files, r.checkFiles, "判定集与解析集同一集合")
    assert.equal(r.hits.total, 1, "哨兵（canary）不在清单内 ⇒ 不入判")
    assert.doesNotMatch(r.report, /canary/)
    assert.match(r.report, /^范围：传入清单 2 档（整档入判 · 判定范围 = 解析范围）$/m)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test("AC-50③ · 引用目标点查：节在盘读目标档；裸名不跨目录解析", () => {
  const root = mkdtempSync(join(tmpdir(), "doc-check-target-"))
  const w = (p, text = "") => { const abs = join(root, p); mkdirSync(dirname(abs), { recursive: true }); writeFileSync(abs, text) }
  try {
    w("PROJECT-MANIFEST.json", JSON.stringify(fiveKeyManifest(), null, 2) + "\n")
    w("docs/ref.md", "# 引用方\n\n见 docs/target.md §2 的说明。\n")
    w("docs/target.md", "# 1\n\n占位\n")
    w("docs/common.md", "# 公共\n")
    w("docs/deep/x.md", "# 裸名\n\n见 common.md 的说明。\n")
    const miss = runDocCheck(root, { docs: ["docs/ref.md"] }).report
    assert.match(miss, /✗ 锚·节缺 docs\/ref\.md:3 `docs\/target\.md`（目标 docs\/target\.md 无 §2）/, "§2 不在盘 ⇒ 节缺（目标档已读）")
    writeFileSync(join(root, "docs/target.md"), "# 1\n\n## 2\n\n占位\n")
    assert.doesNotMatch(runDocCheck(root, { docs: ["docs/ref.md"] }).report, /节缺/, "§2 在盘 ⇒ 不再报（同一目标档的读数翻转）")
    // 裸名只在仓根 / 本档目录解析——`docs/deep/x.md` 里的 `common.md` 不在 deep/ 下 ⇒ 档缺
    assert.match(runDocCheck(root, { docs: ["docs/deep/x.md"] }).report, /✗ 锚·档缺 docs\/deep\/x\.md:3 `common\.md`/)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test("AC-47 · 无 manifest 的目录照常判（manifest 报错归 manifest 工具，不在本工具面）", () => {
  // 引擎不读 manifest：无档目录上，传入的可判档照常出 verdict
  const root = mkdtempSync(join(tmpdir(), "doc-check-nomanifest-"))
  try {
    mkdirSync(join(root, "docs"), { recursive: true })
    writeFileSync(join(root, "docs/a.md"), "# A\n")
    const r = runDocCheck(root, { mode: "gate", docs: ["docs/a.md"] })
    assert.equal(r.report.split("\n")[0], "DOC-CHECK GATE: PASS")
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
