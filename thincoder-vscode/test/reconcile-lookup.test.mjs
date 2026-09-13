/**
 * reconcile-lookup.test.mjs — 层 3 反查用例（DOC-CODE-RECONCILE 批 §5 · T-DC15）。
 *
 * 判据权威 = `docs/design/DOC-CODE-RECONCILE.md` §5（输入 / 变更抽取 / 反查 / 输出 / 判据句 / 边界）。
 * 夹具 = 临时 **git 仓**（`git init` + 两次提交——夹具 diff 改 `scanGroups` 定义）。
 * 慢层（slow()）：真 git 子进程（单例 >500ms——快层 skip、全量照跑）。
 * 边界硬项：**只读、不写、不阻断**（退出码恒 0）；跑前后 `git status --porcelain` 同集；只读本域（S4 单仓化——对端面并入仓内）。
 */
import { test } from "node:test"
import { slow } from "./slow.mjs"
import assert from "node:assert/strict"
import { execFileSync, spawnSync } from "node:child_process"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { DEFAULT_RANGE, changedTokens, main, lookup } from "../scripts/reconcile-lookup.mjs"

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const git = (cwd, args) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })

/** 夹具：临时 git 仓（一次提交）。 */
function gitRepo(files) {
  const dir = mkdtempSync(join(tmpdir(), "reconcile-lookup-"))
  git(dir, ["init", "-q"])
  git(dir, ["config", "user.email", "fixture@example.invalid"])
  git(dir, ["config", "user.name", "fixture"])
  for (const [rel, content] of Object.entries(files)) {
    const p = join(dir, rel)
    mkdirSync(dirname(p), { recursive: true })
    writeFileSync(p, content, "utf8")
  }
  git(dir, ["add", "-A"])
  git(dir, ["commit", "-qm", "fixture-1"])
  return dir
}
const runMain = (args) => {
  const out = []
  const code = main(args, { log: (s) => out.push(s) })
  return { code, text: out.join("\n"), out }
}

// ── T-DC15 静态：抽取器单源 + 默认 range（AC-DC10） ──────────────────────────
test("T-DC15 静态：抽取器单源（复用 V5 `extractTokens`——无第二份抽取正则）+ 默认 range", () => {
  const src = readFileSync(join(REPO, "scripts", "reconcile-lookup.mjs"), "utf8")
  assert.ok(/import\s*\{\s*collectDocStems,\s*extractTokens\s*\}\s*from\s*"\.\.\/\.\.\/scripts\/doc-anchors\.mjs"/.test(src), "抽取器复用 V5（同一函数导入——S4 单仓化改指仓根统一版）")
  assert.ok(!/T\(\?:-\[A-Za-z\]/.test(src), "无第二份 A1 抽取式")
  assert.ok(!/mjs\|js\|json\|md\|css\|html/.test(src), "无第二份 A3 抽取式")
  assert.ok(!src.includes("A1_TOKEN_RE"), "零第二份抽取常量")
  assert.equal(DEFAULT_RANGE, "HEAD~1..HEAD", "默认 = HEAD~1..HEAD（设计 §5 #1）")
  // 同一函数面：变更行抽取走 V5 抽取器（A1 用例号 + A2 符号同规）
  const tokens = changedTokens(["const scanGroups = 1", "回归面 T-VS1 / 100% 覆盖"], REPO).map((t) => t.token)
  assert.ok(tokens.includes("scanGroups") && tokens.includes("T-VS1"), JSON.stringify(tokens))
})

// ── T-DC15 错误 / 边界：夹具 diff → 档清单；空 diff；非仓路径；零写 ──────────
slow("T-DC15 错误/边界：反查——夹具 diff 改 `scanGroups` ⇒ 档清单含设计档；空 diff 零输出；非仓路径不报错；零写", () => {
  const dir = gitRepo({
    "docs/design/LEDGER-SELF-CONTAINED.md": "# LEDGER\n\n数字单源 = `scanGroups`（本仓 `src/ledger.mjs`）\n",
    "docs/requirements/ENGINEERING-MODE.md": "# 需求\n\n零锚正文。\n",
    "src/ledger.mjs": "export function scanGroups(lines) { return [] }\n",
  })
  const outsider = mkdtempSync(join(tmpdir(), "reconcile-outside-"))
  try {
    const before = git(dir, ["status", "--porcelain"])
    writeFileSync(join(dir, "src", "ledger.mjs"), "export function scanGroups(lines, extra) { return extra ?? [] }\n", "utf8")
    git(dir, ["add", "-A"])
    git(dir, ["commit", "-qm", "fixture-2"])

    const hit = runMain(["--repo", dir, "--range", "HEAD~1..HEAD"])
    assert.equal(hit.code, 0, "反查不阻断（退出码恒 0）")
    assert.ok(hit.out.some((l) => l.startsWith("docs/design/LEDGER-SELF-CONTAINED.md — 命中 scanGroups（:")), hit.text)
    assert.ok(/反查: \d+ 档 \/ \d+ 行 · 变更 token \d+ 处（只读不阻断）$/.test(hit.text.trim().split("\n").slice(-1)[0]), hit.text)

    // 空 diff ⇒ 零输出不报错
    const empty = runMain(["--repo", dir, "--range", "HEAD..HEAD"])
    assert.equal(empty.code, 0, empty.text)
    assert.ok(!empty.text.includes("— 命中"), `空 diff 零输出：${empty.text}`)
    assert.ok(empty.text.includes("反查: 0 档 / 0 行"), empty.text)

    // 仓外路径（非 git 目录）⇒ 不报错、不阻断
    const outside = runMain(["--repo", outsider, "--range", "HEAD~1..HEAD"])
    assert.equal(outside.code, 0, outside.text)
    assert.ok(outside.text.includes("反查跳过（不阻断）"), outside.text)

    // 零写：跑前后 `git status --porcelain` 同集
    assert.equal(git(dir, ["status", "--porcelain"]), before, "零写（跑前后同集）")

    // `--json` 同形机读 + 进程面（真 spawn——shebang / 入口活）
    const j = lookup({ repo: dir, range: "HEAD~1..HEAD" })
    assert.deepStrictEqual(Object.keys(j).sort(), ["counts", "files", "range", "repo", "tokens"])
    assert.ok(j.files.some((f) => f.file === "docs/design/LEDGER-SELF-CONTAINED.md"))
    const spawned = spawnSync(process.execPath, [join(REPO, "scripts", "reconcile-lookup.mjs"), "--repo", dir, "--range", "HEAD~1..HEAD", "--json"], { encoding: "utf8" })
    assert.equal(spawned.status, 0, spawned.stderr)
    assert.equal(JSON.parse(spawned.stdout).counts.files, j.counts.files, "CLI 与 API 同形")
  } finally {
    rmSync(dir, { recursive: true, force: true })
    rmSync(outsider, { recursive: true, force: true })
  }
})
