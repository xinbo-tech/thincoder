/**
 * 2026-10-08-diskroot-gate-index-excludes.test.mjs — 盘根门 ∥ 索引排除批批次本地单元件
 *   （批档 `docs/batches/2026-10-08-diskroot-gate-index-excludes.md` §2.6 验收对照逐行；台账 #1080 ∥ #1081）。
 * 名随批次档 · 住批次目录 · 不进仓套件；复跑 = 从仓库根 `thincoder/`：
 *   node --test docs/batches/2026-10-08-diskroot-gate-index-excludes.test.mjs
 *
 * 腿（§2.6 判定句 → 机检形）：
 *   L1 N10 会话面硬拦 · 门根矩阵 11 例（直调 · win32 ∥ POSIX 双道；文案逐字含 em dash）
 *   L2 N10 维护面放行 · 无强开旗（命令面矩阵 + 入参面结构锁）
 *   L3 N10 子进程 e2e（卷根 cwd：缺省 ⇒ stderr 恰一行 + exit 1；`--tui-wrapped` 复判；同 cwd `-v` ⇒ exit 0；沙箱 HOME）
 *   L4 F-S9 判真 ∥ 判假 · 谓词矩阵双道 47 例（族分折版）
 *   L5 名表对账（39 名 = 垃圾族 18 ∥ 位置族 20 ∥ `.git` 单列；`bin` 不入；前缀表）
 *   L6 F-S9 三路同谓词（git ∥ walk 双径夹具同剪 + codeSync ∥ docSync 落库同剪）
 *   L7 L-⑤② 单源结构腿（三表匹配点唯一 + 两新名全产品树引用面 + 四消费面一参调用 + 门接线顺序 + shim 零触）
 *   L8 F-S9 存量清算（sweep --path 沙箱库：干跑只 delete ∥ `--confirm` 命中 0 ∧ 非命中逐键不变 ∧ 备份 ok ∥ 零命中零写）
 *   L9 N-S7 零回归系统腿（39 名逐名：POSIX 精确 ∥ 大小写变体判假 ∥ 垃圾族 win32 折）
 */
import { after, test } from "node:test"
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, parse, resolve } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(resolve(ROOT, "thincoder-core"))) throw new Error(`从仓库根（thincoder/）运行（cwd = ${ROOT}）`)
const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)
const text = (rel) => readFileSync(resolve(ROOT, rel), "utf8")
const DIRS = []
const mkTmp = (tag) => { const d = mkdtempSync(join(tmpdir(), `drg-${tag}-`)); DIRS.push(d); return d }
after(() => { for (const d of DIRS) { try { rmSync(d, { recursive: true, force: true, maxRetries: 3 }) } catch { /* 尽力清理 */ } } })

// ─────────────────────────────── L1 · N10 门根矩阵（11 例）───────────────────────────────

/** [platform, cwd, 判真?]——win32 大小写 ∥ 卷根 ∥ UNC 根 ∥ POSIX 根（批档 §2.6 行 1）。 */
const ROOT_MATRIX = [
  ["win32", "D:\\", true],
  ["win32", "d:\\", true],
  ["win32", "D:/", true],
  ["win32", "C:\\", true],
  ["win32", "D:\\teamcode", false],
  ["win32", "d:/teamcode", false],
  ["win32", "\\\\server\\share\\", true],
  ["win32", "\\\\server\\share\\dir", false],
  ["posix", "/", true],
  ["posix", "/home/tester", false],
  ["posix", "/tmp/proj", false],
]

test("L1 N10 门根矩阵 11 例（直调 · win32 ∥ POSIX 双道）", async () => {
  const { diskRootGateError, DISK_ROOT_MESSAGE } = await mod("thincoder-cli/bin/disk-root-gate.mjs")
  assert.equal(ROOT_MATRIX.length, 11, "矩阵 = 11 例")
  for (const [platform, cwd, atRoot] of ROOT_MATRIX) {
    const got = diskRootGateError({ command: "tui", cwd, platform })
    assert.equal(got, atRoot ? DISK_ROOT_MESSAGE : null, `${platform} · ${JSON.stringify(cwd)} ⇒ ${atRoot ? "拦" : "放行"}`)
  }
  assert.equal(diskRootGateError({ command: undefined, cwd: "D:\\", platform: "win32" }), DISK_ROOT_MESSAGE,
    "无参默认路径（command === undefined）= 会话面 ⇒ 同拦")
  // 文案逐字（CLI-ENTRY §1 定稿——含 em dash U+2014）
  assert.equal(DISK_ROOT_MESSAGE, "thincoder cannot start from a disk root — cd into a working directory and start again")
  assert.ok(DISK_ROOT_MESSAGE.includes("\u2014"), "含 em dash")
})

// ─────────────────────────────── L2 · N10 命令面矩阵 ───────────────────────────────

/** 信息维护面（放行面——批档 §2.6 行 2 点名集合；另列同判的非会话命令）。 */
const MAINTENANCE = ["-v", "--version", "--help", "-h", "memory", "upgrade", "completion", "session", "sync", "reindex", "distill", "ledger"]

test("L2 N10 命令面矩阵（会话面 ∥ 维护面 ∥ 无强开旗）", async () => {
  const { diskRootGateError, DISK_ROOT_MESSAGE, SESSION_COMMANDS } = await mod("thincoder-cli/bin/disk-root-gate.mjs")
  assert.deepEqual([...SESSION_COMMANDS].sort(), ["acp", "chat", "tui"], "会话集 = tui ∥ chat ∥ acp（无参 = undefined 另判）")
  for (const command of [undefined, "tui", "chat", "acp"]) {
    assert.equal(diskRootGateError({ command, cwd: "/", platform: "posix" }), DISK_ROOT_MESSAGE, `根 + 会话面「${command}」⇒ 拦`)
  }
  for (const command of MAINTENANCE) {
    assert.equal(diskRootGateError({ command, cwd: "D:\\", platform: "win32" }), null, `维护面「${command}」⇒ 放行`)
  }
  assert.equal(diskRootGateError({ command: undefined, cwd: "D:\\teamcode", platform: "win32" }), null, "非根 cwd ⇒ 会话面亦放行")
  // 无强开旗 = 结构性（入参面仅三参）：多传未知旗标不构成强开面
  assert.equal(diskRootGateError({ command: "tui", cwd: "D:\\", platform: "win32", force: true, allowDiskRoot: true }),
    DISK_ROOT_MESSAGE, "未知旗标不改判定")
  const src = text("thincoder-cli/bin/disk-root-gate.mjs")
  const sig = src.match(/export function diskRootGateError\(\{([^}]*)\}/)
  assert.ok(sig, "函数签名在位")
  const params = sig[1].split(",").map((s) => s.trim().split("=")[0].trim()).filter(Boolean).sort()
  assert.deepEqual(params, ["command", "cwd", "platform"], "入参面 = 三参（无旗标面）")
})

// ─────────────────────────────── L3 · N10 子进程 e2e ───────────────────────────────

test("L3 N10 子进程 e2e（卷根 cwd：缺省 ⇒ 恰一行 + exit 1；--tui-wrapped 复判；同 cwd `-v` ⇒ exit 0）", async () => {
  const { DISK_ROOT_MESSAGE } = await mod("thincoder-cli/bin/disk-root-gate.mjs")
  const volRoot = parse(tmpdir()).root // 当前卷根（可移植：win32 `C:\` ∥ posix `/`）
  const home = mkTmp("home") // 沙箱 HOME 纪律（CLI-ENTRY §3——禁触真实 ~/.thincoder）
  const env = { ...process.env, HOME: home, USERPROFILE: home }
  delete env.NODE_TEST_CONTEXT
  const bin = resolve(ROOT, "thincoder-cli/bin/thincoder.mjs")
  const run = (argv) => spawnSync(process.execPath, [bin, ...argv], { cwd: volRoot, encoding: "utf8", env, timeout: 120000 })

  const gated = run([])
  assert.equal(gated.status, 1, "卷根（无参）⇒ exit 1")
  assert.equal(gated.stderr.trim(), DISK_ROOT_MESSAGE, "stderr 逐字 = 文案")
  assert.equal(gated.stderr.trim().split("\n").length, 1, "stderr 恰一行")
  assert.equal(gated.stdout, "", "stdout 零输出（未达分发）")

  const wrapped = run(["--tui-wrapped"])
  assert.equal(wrapped.status, 1, "包装子进程形态（argv 自剥离后同判）⇒ 同拦（幂等）")
  assert.equal(wrapped.stderr.trim(), DISK_ROOT_MESSAGE, "子进程复判 = 同一行文案")

  const versioned = run(["-v"])
  assert.equal(versioned.status, 0, "同 cwd `-v` ⇒ 照常（维护面放行）")
  const pkgVersion = JSON.parse(text("thincoder-cli/package.json")).version
  assert.equal(versioned.stdout.trim(), pkgVersion, "-v 输出 = 版本号")
  assert.ok(existsSync(join(home, ".thincoder", "crash-reports")), "沙箱 HOME 生效（子进程 ~/.thincoder 落沙箱）")
})

// ─────────────────────────────── L4 · 谓词矩阵双道 47 例 ───────────────────────────────

/** [rel, win32 期望, posix 期望]——族分折版 47 例（MEMORY.md §6.14 面④ 正例 ∥ 判假围栏表逐例）。 */
const PREDICATE_MATRIX = [
  // 垃圾 ∥ 产物族正例（精确 ∥ 任意深度；`.turbo` ∥ `.venv` 两行另锁点段规则——既有行为零回归）
  ["node_modules/x.js", true, true],
  ["dist/x.js", true, true],
  ["src/build/x.js", true, true],
  [".turbo/cache/x.js", true, true],
  ["sub/__pycache__/x.pyc", true, true],
  [".venv/lib/x.py", true, true],
  ["vendor/x.go", true, true],
  ["a/b/Pods/x.h", true, true],
  ["bower_components/jquery/x.js", true, true],
  ["third_party/zlib/x.c", true, true],
  ["src/obj/x.o", true, true],
  ["out/x.js", true, true],
  ["src/out", true, true], // 裸文件名形：段名精确即中（本不入索引 = 扩展名门——净零影响）
  // 垃圾族 win32 拼写变体（win32 折 ∥ POSIX 不折）
  ["NODE_MODULES/x.js", true, false],
  ["src/Dist/x.js", true, false],
  ["Node_Modules/pkg/x.js", true, false],
  ["OBJ/x.o", true, false],
  ["Vendor/x.go", true, false],
  ["Bazel-bin/x", true, false],
  // 前缀形（`bazel-`——POSIX 字面 ∥ win32 折）
  ["bazel-bin/x", true, true],
  ["a/bazel-out/k8/x", true, true],
  ["bazel-testlogs/x", true, true],
  // 位置族正例（精确拼写 · 全平台）
  ["AppData/Local/x.js", true, true],
  ["Users/u/Desktop/a.md", true, true],
  ["Documents/a.md", true, true],
  ["Library/Application Support/x", true, true],
  ["go/pkg/mod/x.go", true, true],
  ["Windows/System32/x.dll", true, true],
  ["$Recycle.Bin/S-1/x", true, true],
  ["Program Files/Common/x.dll", true, true],
  // 位置族变体判假（win32 同锁——全表折误剪面 443 行的护栏）
  ["desktop/a.md", false, false],
  ["library/x.md", false, false],
  ["documents/a.md", false, false],
  ["windows/x.dll", false, false],
  // 判假围栏：近似名（精确 basename——非前缀 ∕ 非子串）
  ["output/x.js", false, false],
  ["outbox/x.js", false, false],
  ["outside/x", false, false],
  ["objc/x.m", false, false],
  ["objects/x", false, false],
  ["vendors/x.js", false, false],
  ["bower-components/x", false, false],
  ["third-party/x", false, false],
  // 判假围栏：前缀护栏（前缀字面 = `bazel-`）
  ["bazel/x", false, false],
  ["bazel_x/y", false, false],
  // 判假围栏：用户裁定面（`bin` 保持入索引）
  ["thincoder-cli/bin/x.mjs", false, false],
  // 判假围栏：文件名形（段名精确不中）
  ["out.md", false, false],
  ["obj.js", false, false],
]

test("L4 F-S9 谓词矩阵双道 47 例（族分折）", async () => {
  const { isSkippedRelPath } = await mod("thincoder-core/memory/file-walk.mjs")
  assert.equal(PREDICATE_MATRIX.length, 47, "矩阵 = 47 例")
  for (const [rel, win32, posix] of PREDICATE_MATRIX) {
    assert.equal(isSkippedRelPath(rel, "win32"), win32, `win32 · ${rel}`)
    assert.equal(isSkippedRelPath(rel, "posix"), posix, `posix · ${rel}`)
  }
})

// ─────────────────────────────── L5 · 名表对账（39 名）───────────────────────────────

/** 垃圾 ∥ 产物族（18 = 既有 12 + 新六——折叠子集全列）。 */
const JUNK_FAMILY = [
  "node_modules", "dist", "build", ".turbo", "coverage", "__pycache__", ".venv", "venv", "target", ".next", ".nuxt", ".svelte-kit",
  "vendor", "Pods", "bower_components", "third_party", "obj", "out",
]
/** 位置族（20——全平台精确）。 */
const POSITION_FAMILY = [
  "AppData", "Application Data", "Desktop", "Documents", "Downloads", "Music", "Pictures", "Videos", "OneDrive", "Contacts",
  "Favorites", "Links", "Saved Games", "Searches", "Library", "go", "Program Files", "Program Files (x86)", "Windows", "$Recycle.Bin",
]

test("L5 名表对账（39 名 = 垃圾族 18 ∥ 位置族 20 ∥ `.git` 单列）", async () => {
  const sch = await mod("thincoder-core/memory/schema.mjs")
  assert.equal(JUNK_FAMILY.length, 18, "垃圾族 = 18")
  assert.equal(POSITION_FAMILY.length, 20, "位置族 = 20")
  assert.equal(sch.SKIP_DIRS.size, 39, "SKIP_DIRS = 39 名（既有 33 + 新六）")
  for (const name of [...JUNK_FAMILY, ...POSITION_FAMILY, ".git"]) assert.ok(sch.SKIP_DIRS.has(name), `${name} 在册`)
  assert.equal(sch.SKIP_DIRS_FOLD.size, 18, "SKIP_DIRS_FOLD = 垃圾族全列")
  for (const name of JUNK_FAMILY) assert.ok(sch.SKIP_DIRS_FOLD.has(name), `${name} ∈ 折叠子集`)
  for (const name of POSITION_FAMILY) assert.ok(!sch.SKIP_DIRS_FOLD.has(name), `${name} ∉ 折叠子集（位置族精确）`)
  assert.ok(!sch.SKIP_DIRS_FOLD.has(".git"), "`.git` 不入两族（点段规则覆盖）")
  for (const name of sch.SKIP_DIRS_FOLD) assert.ok(sch.SKIP_DIRS.has(name), "折叠子集 ⊆ SKIP_DIRS")
  assert.equal(sch.SKIP_DIRS.size - sch.SKIP_DIRS_FOLD.size, 21, "余 21 = 位置族 20 + `.git` 1")
  assert.deepEqual(sch.SKIP_DIR_PREFIXES, ["bazel-"], "前缀表 = [\"bazel-\"]")
  assert.ok(!sch.SKIP_DIRS.has("bin") && !sch.SKIP_DIRS_FOLD.has("bin"), "`bin` 不入排除表（用户裁定——保持入索引）")
})

// ─────────────────────────────── L6 · 三路同谓词（双径夹具）───────────────────────────────

/** 夹具期望留存（判假围栏 + 用户裁定面——两径同集）。 */
const FIXTURE_KEEP = [
  "bin/x.js",
  "bazel/x.js",
  "bazel_x/y.js",
  "desktop/x.js",
  "keep/a.mjs",
  "library/x.js",
  "objc/x.js",
  "out.md",
  "outbox/x.js",
  "output/x.js",
  "src/b.js",
  "thincoder-cli/bin/y.js",
  "vendors/x.js",
]
/** 夹具期望剪除（新名 + 既有名 + 任意深度 + 前缀形——两径同剪）。 */
const FIXTURE_DROP = [
  "bazel-bin/x.js",
  "bower_components/x.js",
  "dist/x.js",
  "node_modules/x.js",
  "obj/x.js",
  "out/x.js",
  "Pods/x.js",
  "src/deep/vendor/z.js",
  "third_party/x.js",
  "vendor/x.js",
]

const writeFixtureFile = (base, rel) => {
  const abs = join(base, ...rel.split("/"))
  mkdirSync(dirname(abs), { recursive: true })
  writeFileSync(abs, rel.endsWith(".md") ? "# fixture\n" : "export const x = 1\n")
}

test("L6 F-S9 三路同谓词（git ∥ walk 双径同剪 + codeSync ∥ docSync 落库同剪）", async () => {
  const { listProjectFiles } = await mod("thincoder-core/memory/file-list.mjs")
  const { isSkippedRelPath } = await mod("thincoder-core/memory/file-walk.mjs")
  const base = mkTmp("fixture")
  const proj = join(base, "proj")
  for (const rel of [...FIXTURE_KEEP, ...FIXTURE_DROP]) writeFixtureFile(proj, rel)
  const exts = new Set([".js", ".mjs", ".md"])

  // ① 非 git 径（walk）：新名同剪 ∥ 判假围栏留存
  const walked = await listProjectFiles(proj, exts)
  assert.equal(walked.truncated, false, "walk 未截断")
  const walkRels = walked.entries.map((e) => e.rel.replace(/\\/g, "/")).sort()
  assert.deepEqual(walkRels, [...FIXTURE_KEEP].sort(), "walk 径：期望留存逐字（剪除面零出现）")

  // ② git 径（ls-files）：同树 init 后复跑——逐字同集（excludes 隔离：repo-local 覆盖宿主全局 core.excludesFile，防宿主 ignore 隐去留存面）
  const init = spawnSync("git", ["init", "-q"], { cwd: proj, encoding: "utf8" })
  assert.equal(init.status, 0, `git init（夹具）：${init.stderr}`)
  const excludeFile = join(base, "empty-excludes")
  writeFileSync(excludeFile, "")
  const conf = spawnSync("git", ["config", "core.excludesFile", excludeFile.replaceAll("\\", "/")], { cwd: proj, encoding: "utf8" })
  assert.equal(conf.status, 0, `夹具仓 excludes 隔离：${conf.stderr}`)
  const listed = await listProjectFiles(proj, exts)
  const gitRels = listed.entries.map((e) => e.rel.replace(/\\/g, "/")).sort()
  assert.deepEqual(gitRels, walkRels, "git ∥ walk 同剪（逐字同集）")

  // ③ codeSync ∥ docSync（= `/reindex` 链经 `listProjectFiles` 同谓词）落库：零跳过段
  const { createMemory } = await mod("thincoder-core/memory/schema.mjs")
  const { codeSync } = await mod("thincoder-core/memory/code-sync.mjs")
  const { docSync } = await mod("thincoder-core/memory/docs.mjs")
  const memory = createMemory({ dbPath: join(base, "memory.db") })
  try {
    await codeSync(memory, proj)
    await docSync(memory, proj)
    const codePaths = memory.db.prepare(`SELECT path FROM code_chunks`).all().map((r) => r.path).sort()
    const docPaths = memory.db.prepare(`SELECT path FROM doc_chunks`).all().map((r) => r.path).sort()
    assert.deepEqual(codePaths, FIXTURE_KEEP.filter((r) => !r.endsWith(".md")).sort(), "code 落库 = 留存面（剪除面零行）")
    assert.deepEqual(docPaths, ["out.md"], "doc 落库 = 文件名形 `out.md`（段名 `out.md` 不中）")
    for (const p of [...codePaths, ...docPaths]) assert.ok(!isSkippedRelPath(p), `库内零跳过段：${p}`)
  } finally { memory.db.close() }
})

// ─────────────────────────────── L7 · 单源结构腿 ───────────────────────────────

test("L7 L-⑤② 单源结构腿（匹配点唯一 ∥ 消费面一参 ∥ 门接线顺序 ∥ shim 零触）", () => {
  // ① 三表在产品码内仅经 `isSkippedRelPath` 消费（匹配点唯一）
  const usageRe = /SKIP_DIRS\.has\(|SKIP_DIRS_FOLD\.has\(|SKIP_DIR_PREFIXES\.(some|includes|has)\(/
  const memDir = resolve(ROOT, "thincoder-core/memory")
  const hits = readdirSync(memDir).filter((f) => f.endsWith(".mjs")).filter((f) => usageRe.test(readFileSync(join(memDir, f), "utf8")))
  assert.deepEqual(hits, ["file-walk.mjs"], "匹配点唯一 = file-walk.mjs")
  // ①b 两新名（`SKIP_DIRS_FOLD` ∥ `SKIP_DIR_PREFIXES`）全产品树引用面 = 定义 + 消费两档
  //（`SKIP_DIRS` 同名自持常量在别处合法存在——批档 §2.1 明列独立面；两新名无此歧义 ⇒ 全树锁）
  const refFiles = []
  const scanDir = (dir) => {
    let entries
    try { entries = readdirSync(dir, { withFileTypes: true }) } catch { return }
    for (const e of entries) {
      if (e.isDirectory()) {
        if (!["node_modules", "dist", ".git", ".thincoder", "coverage", "build", "out"].includes(e.name) && !e.name.startsWith("dist-")) scanDir(join(dir, e.name))
        continue
      }
      if (!/\.(mjs|js|cjs)$/.test(e.name)) continue
      const p = join(dir, e.name)
      if (/SKIP_DIRS_FOLD|SKIP_DIR_PREFIXES/.test(readFileSync(p, "utf8"))) refFiles.push(p.slice(ROOT.length + 1).replace(/\\/g, "/"))
    }
  }
  for (const d of ["thincoder-core", "thincoder-cli", "thincoder-vscode", "thincoder-desktop", "thincoder-render-core", "thincoder-server"]) {
    if (existsSync(join(ROOT, d))) scanDir(join(ROOT, d))
  }
  assert.deepEqual(refFiles.sort(), ["thincoder-core/memory/file-walk.mjs", "thincoder-core/memory/schema.mjs"],
    "两新名产品树引用面 = schema.mjs（定义）+ file-walk.mjs（消费）——零第三方引用")

  // ② 四消费面一参调用（签名扩平台入参——调用点零改）
  const oneArg = (rel) => (text(rel).match(/isSkippedRelPath\(rel\)/g) ?? []).length
  assert.equal(oneArg("thincoder-core/memory/file-walk.mjs"), 2, "walk 双守卫（现 :106 ∥ :109——设计 as-of :94 ∥ :97）一参")
  assert.equal(oneArg("thincoder-core/memory/file-list.mjs"), 1, "git 列面（:81）一参")
  assert.equal(oneArg("thincoder-core/memory/code-sync.mjs"), 2, "diff 缝（:98）∥ 单文件缝（:249）一参")
  for (const rel of ["thincoder-core/memory/file-list.mjs", "thincoder-core/memory/code-sync.mjs"]) {
    assert.ok(!text(rel).includes("isSkippedRelPath(rel,"), `${rel}：无二参调用点`)
  }
  assert.match(text("thincoder-core/memory/file-walk.mjs"), /export function isSkippedRelPath\(rel, platform = process\.platform\)/,
    "谓词签名 = 平台入参（默认 process.platform）")

  // ③ 门接线：argv 解析后 ∥ TUI 包装块前；shim 零触（非 shim——版本门先例只属运行时依赖面）
  const cli = text("thincoder-cli/bin/thincoder.mjs")
  const iParse = cli.indexOf("const [command, ...args]")
  const iGate = cli.indexOf("diskRootGateError({")
  const iWrap = cli.indexOf("spawnTuiWrapped()")
  assert.ok(iParse !== -1 && iGate !== -1 && iWrap !== -1, "三锚在位")
  assert.ok(iParse < iGate && iGate < iWrap, "落点 = argv 解析后 ∥ 包装块前（阻断 ⇒ 包装不发生）")
  assert.ok(!text("thincoder-cli/bin/thincoder.cjs").includes("diskRootGate"), "shim 零触（门不住 shim）")
})

// ─────────────────────────────── L8 · 存量清算（sweep --path 沙箱库）───────────────────────────────

test("L8 F-S9 存量清算（sweep --path：干跑只 delete ∥ --confirm 命中 0 ∧ 非命中逐键不变 ∧ 备份 ok ∥ 零命中零写）", async () => {
  const { createMemory } = await mod("thincoder-core/memory/schema.mjs")
  const { normalizeOrigin } = await mod("thincoder-core/memory/origin.mjs")
  const { planSweep, sweepMemory } = await mod("thincoder-core/memory/sweep.mjs")
  const base = mkTmp("sweep")
  const dbPath = join(base, "memory.db")
  const memory = createMemory({ dbPath })
  const origin = normalizeOrigin(join(base, "proj"))
  const HITS = ["vendor/x.js", "vendor/sub/y.js"]
  const KEEPS = ["bin/d.js", "outbox/e.js", "src/keep/a.js", "src/vendor/b.js", "vendor2/c.js"]
  const insCode = memory.db.prepare(`INSERT INTO code_chunks (origin, path, language, chunk_type, symbol_name, content, line_start, line_end, mtime_ms, seg_content) VALUES (?, ?, 'javascript', 'file', '', ?, 0, 0, 1, '')`)
  const insDoc = memory.db.prepare(`INSERT INTO doc_chunks (origin, path, language, heading, content, line_start, line_end, mtime_ms, seg_content) VALUES (?, ?, 'markdown', '', ?, 0, 0, 1, '')`)
  for (const p of [...HITS, ...KEEPS]) insCode.run(origin, p, `code ${p}`)
  insDoc.run(origin, "vendor/readme.md", "doc vendor")
  insDoc.run(origin, "src/keep/readme.md", "doc keep")
  memory.db.prepare(`INSERT INTO files (layer, path, type, title, content, updated_at, origin) VALUES ('project', 'vendor/mem.md', 'knowledge', 't', 'c', 1, ?)`).run(origin)
  const rowsOf = (table) => memory.db.prepare(`SELECT origin, path, line_start, content, mtime_ms FROM ${table} ORDER BY origin, path, line_start`).all()
    .map((r) => ({ origin: r.origin, path: r.path, line_start: r.line_start, content: r.content, mtime_ms: r.mtime_ms }))
  const hitRow = (p) => p === "vendor" || p.startsWith("vendor/")
  const nonHit = (rows) => rows.filter((r) => !hitRow(r.path))
  const codeBefore = rowsOf("code_chunks"), docBefore = rowsOf("doc_chunks")
  try {
    assert.throws(() => planSweep(memory, { path: "vendor" }), /须与 `--origin` 同用/, "`--path` 须与 `--origin` 同用")

    // ① 干跑：仅命中行动作 `delete` ∥ 零写
    const dry = sweepMemory(memory, { origin, path: "vendor" })
    assert.equal(dry.dryRun, true, "干跑默认")
    assert.equal(dry.rows.length, 1, "`--origin` 档 = 单行")
    assert.equal(dry.rows[0].action, "delete", "仅命中行动作 = delete")
    assert.deepEqual([dry.rows[0].code, dry.rows[0].doc, dry.rows[0].files], [2, 1, 0], "计数 = code 2 ∥ doc 1 ∥ files 0（files 表不涉）")
    assert.equal(dry.hits, 3, "命中 = 3 行")
    assert.equal(dry.backupPath, null, "干跑零备份")
    assert.deepEqual(rowsOf("code_chunks"), codeBefore, "干跑零写（code 逐键不变）")
    assert.deepEqual(rowsOf("doc_chunks"), docBefore, "干跑零写（doc 逐键不变）")

    // ② --confirm：备份先行（判据 = 存在 ∧ 大小 > 0 ∧ integrity_check = ok）⇒ 命中 0 ∧ 非命中逐键不变
    const conf = sweepMemory(memory, { origin, path: "vendor", confirm: true, dbPath })
    assert.ok(conf.backupPath && existsSync(conf.backupPath) && statSync(conf.backupPath).size > 0, "备份存在 ∧ 大小 > 0")
    const { DatabaseSync } = await import("node:sqlite")
    const bdb = new DatabaseSync(conf.backupPath, { readOnly: true })
    try { assert.equal(Object.values(bdb.prepare("PRAGMA integrity_check").get() ?? {})[0], "ok", "备份 integrity_check = ok") } finally { bdb.close() }
    const hitLeft = (table) => Number(memory.db.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE origin = ? AND (path = ? OR substr(path, 1, ?) = ?)`).get(origin, "vendor", 7, "vendor/").n)
    assert.equal(hitLeft("code_chunks"), 0, "命中行 0（code）")
    assert.equal(hitLeft("doc_chunks"), 0, "命中行 0（doc）")
    assert.deepEqual(nonHit(rowsOf("code_chunks")), nonHit(codeBefore), "非命中行逐键不变（code）")
    assert.deepEqual(nonHit(rowsOf("doc_chunks")), nonHit(docBefore), "非命中行逐键不变（doc）")
    assert.equal(Number(memory.db.prepare(`SELECT COUNT(*) AS n FROM files WHERE origin = ? AND path = ?`).get(origin, "vendor/mem.md").n), 1,
      "`files` 表不涉（记忆层行存续）")

    // ③ 零命中：不取备份 ∥ 零写
    const beforeFiles = readdirSync(base).sort()
    const codeNow = rowsOf("code_chunks"), docNow = rowsOf("doc_chunks")
    const zero = sweepMemory(memory, { origin, path: "nowhere", confirm: true, dbPath })
    assert.equal(zero.hits, 0, "零命中")
    assert.equal(zero.backupPath, null, "零命中不取备份")
    assert.deepEqual(rowsOf("code_chunks"), codeNow, "零命中零写（code）")
    assert.deepEqual(rowsOf("doc_chunks"), docNow, "零命中零写（doc）")
    assert.deepEqual(readdirSync(base).sort(), beforeFiles, "零命中不新增备份档")
  } finally { memory.db.close() }
})

// ─────────────────────────────── L9 · N-S7 零回归系统腿 ───────────────────────────────

test("L9 N-S7 零回归系统腿（39 名逐名：POSIX 精确 ∥ 大小写变体判假 ∥ 垃圾族 win32 折）", async () => {
  const { isSkippedRelPath } = await mod("thincoder-core/memory/file-walk.mjs")
  const { SKIP_DIRS, SKIP_DIRS_FOLD } = await mod("thincoder-core/memory/schema.mjs")
  const all = [...SKIP_DIRS]
  assert.equal(all.length, 39, "全表 = 39 名")
  for (const name of all) assert.equal(isSkippedRelPath(`a/${name}/x.js`, "posix"), true, `POSIX 精确命中：${name}`)
  for (const name of all.filter((n) => !n.startsWith("."))) {
    const variant = name.toUpperCase()
    assert.equal(isSkippedRelPath(`a/${variant}/x.js`, "posix"), false, `POSIX 一律精确（变体不折）：${variant}`)
    const expectWin = SKIP_DIRS_FOLD.has(name)
    assert.equal(isSkippedRelPath(`a/${variant}/x.js`, "win32"), expectWin, `win32 ${expectWin ? "垃圾族折" : "位置族精确"}：${variant}`)
  }
})
