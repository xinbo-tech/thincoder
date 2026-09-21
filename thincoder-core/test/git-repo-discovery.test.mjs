/**
 * git-repo-discovery.test.mjs — #62 仓发现：`git` 工具复用 manifest 发现单源（判据 A14–A20）。
 * 权威设计 = docs/core/design/TOOLS.md §6.13 · docs/core/design/MANIFEST.md §2.2 / KD-M1-22。
 * 2026-09-21（#188 · 仓梯新级）：A21 / A22 = **裸仓级**（零个「.git ∧ 档」子仓时才看 `.git` 裸仓）
 * ——两格均**先红**（批前 `none` ⇒ §6.12 fail-closed）；A14–A20 带档级行为逐字不变。
 * 路径纪律（§6.13 用例表）：A14–A19 一律经 `gitTool.execute(args, ctx)` 真调用面（禁绕过工具直调
 * `discoverRepos`）；夹具 = 真 `git init` 仓 + 真 `PROJECT-MANIFEST.json` 档（禁 mock / 手写）；
 * A20 = `tools/git.mjs` 源码结构断言（无夹具）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { gitTool, configureGitApproval, resetGitApproval } from "../tools/git.mjs"
import { DEFAULT_MANIFEST, MANIFEST_REL, _resetProjectRootForTest } from "../manifest.mjs"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
_resetProjectRootForTest() // 发现面走真判据（注入面复位——§6.13 测试面）

const GIT_ID = ["-c", "user.name=fixture", "-c", "user.email=fixture@example.invalid"]

async function withTmp(fn) {
  const dir = mkdtempSync(join(tmpdir(), "git-repo-discovery-"))
  try { return await fn(dir) } finally { rmSync(dir, { recursive: true, force: true }) }
}

/** 真仓夹具：`git init` + 基线提交（身份内联——不依赖全局 git config；manifest 档随基线入库，
 *  使 porcelain 只剩本用例新增的改动条目）。 */
function makeRepo(dir, { manifest = true } = {}) {
  mkdirSync(dir, { recursive: true })
  execFileSync("git", ["init", "-q", "-b", "main"], { cwd: dir, stdio: ["ignore", "pipe", "ignore"] })
  writeFileSync(join(dir, "base.txt"), "base\n")
  if (manifest) writeFileSync(join(dir, MANIFEST_REL), JSON.stringify(DEFAULT_MANIFEST), "utf8")
  execFileSync("git", [...GIT_ID, "add", "-A"], { cwd: dir })
  execFileSync("git", [...GIT_ID, "commit", "-q", "-m", "base"], { cwd: dir, stdio: ["ignore", "pipe", "ignore"] })
}

/** 同刻 porcelain（真判据基线——A8 同款对账口径）。 */
const porcelain = (cwd) => execFileSync("git", ["status", "--porcelain"], { cwd, encoding: "utf8" }).replace(/\r/g, "").trim()

// ── A14 正常：唯一态（本工作区形态）——重定向 + 注记首行 + 条目级与同刻 porcelain 一致 ─────────
test("A14 唯一态：容器 cwd ⇒ 重定向到唯一带 manifest 子仓（porcelain 条目一致 + 注记首行）", async () => {
  await withTmp(async (container) => {
    const repo = join(container, "proj")
    makeRepo(repo)
    writeFileSync(join(repo, "stage-me.txt"), "s\n")
    execFileSync("git", ["add", "stage-me.txt"], { cwd: repo })
    writeFileSync(join(repo, "untracked.txt"), "u\n")
    makeRepo(join(container, "decoy"), { manifest: false }) // 含 .git 无 manifest——判别合取（只扫 .git 的第二实现会选错）
    const out = await gitTool.execute({ action: "status" }, { cwd: container })
    const [note, ...rest] = out.split("\n")
    assert.equal(note, `(repo: ${repo})`, "重定向注记 = 结果首行 + 仓根绝对路径")
    const body = rest.join("\n")
    const base = porcelain(repo) // 同刻基线（调用前后无写 ⇒ 同判据）
    assert.deepEqual(base.split("\n"), ["A  stage-me.txt", "?? untracked.txt"], "夹具自证：porcelain 恰两条目")
    // 条目级一致 + 分组渲染形（禁字符串等值——承 A8 落地形）
    assert.match(body, /^Staged \(1\):\nA stage-me\.txt\n\n/, "暂存组 = 分组形 + porcelain 条目「A  stage-me.txt」")
    assert.match(body, /\n\nUntracked \(1\):\nuntracked\.txt$/, "未跟踪组 = 分组形 + porcelain 条目「?? untracked.txt」")
    for (const group of ["Unstaged (", "Conflicts ("]) assert.equal(body.includes(group), false, `无 ${group} 组（夹具无此类条目）`)
    // 端拒执行串原样返回、**不加注记**（§6.13 产出注记末句——拒串在注记之前返回）
    try {
      configureGitApproval({ gate: () => "REFUSED-BY-END" })
      assert.equal(await gitTool.execute({ action: "status" }, { cwd: container }), "REFUSED-BY-END", "拒串原样、无注记")
    } finally { resetGitApproval() }
  })
})

// ── A15 边界：零态 ⇒ §6.12 fail-closed 语义零改（前置 #55 已落地）────────────────────────────
test("A15 零态：容器 + 空子目录 ⇒ 不重定向、非仓失败（not a git repository）", async () => {
  await withTmp(async (container) => {
    mkdirSync(join(container, "empty"))
    await assert.rejects(() => gitTool.execute({ action: "status" }, { cwd: container }), (e) => {
      assert.match(e.message, /not a git repository/, "#55 非仓谓词（零态兜底 = §6.12 语义不变）")
      assert.ok(e.message.includes(container), "消息 cwd = 原锚（未重定向）")
      assert.equal(/clean — no changes/.test(e.message), false, "失败不渲染洁净")
      return true
    })
    assert.equal(existsSync(join(container, ".git")), false, "零态零副作用（不落仓）")
  })
})

// ── A16 错误：多态 ⇒ throw（列两候选绝对路径 + 指 workdir；不含 clean——不猜）──────────────────
test("A16 多态：容器 + 两带 manifest 子仓 ⇒ throw（候选全列 + 指 workdir + 不含 clean）", async () => {
  await withTmp(async (container) => {
    const [a, b] = ["alpha-repo", "beta-repo"].map((n) => join(container, n))
    for (const d of [a, b]) makeRepo(d)
    await assert.rejects(() => gitTool.execute({ action: "status" }, { cwd: container }), (e) => {
      assert.ok(e.message.includes(a), "候选①绝对路径在册")
      assert.ok(e.message.includes(b), "候选②绝对路径在册")
      assert.match(e.message, /workdir/, "指引用显式 workdir")
      assert.equal(e.message.includes("clean"), false, "不含 clean（不与假洁净同形）")
      return true
    })
  })
})

// ── A17 边界：显式 workdir（真值在场）⇒ 零发现、无注记；workdir:"" ≡ 缺省（走发现 + 注记）───────
test("A17 workdir 优先：显式 workdir ⇒ 零发现、无注记；workdir:\"\" 与缺省同判（真值判定）", async () => {
  await withTmp(async (container) => {
    const repo = join(container, "proj")
    makeRepo(repo)
    const other = join(container, "other")
    makeRepo(other, { manifest: false })
    writeFileSync(join(repo, "in-proj.txt"), "p\n")
    writeFileSync(join(other, "in-other.txt"), "o\n")
    const out = await gitTool.execute({ action: "status", workdir: "other" }, { cwd: container })
    assert.equal(out.startsWith("(repo: "), false, "workdir 在场 ⇒ 零发现 ⇒ 无注记")
    assert.match(out, /Untracked \(1\):\nin-other\.txt$/, "在 workdir 仓执行（非发现结果）")
    assert.equal(out.includes("in-proj"), false, "发现结果仓未被触碰")
    // 判据 = 真值判定（与 `execute()` 头部的 `if (args.workdir)` 同源，非「键在场」）⇒ 空串 = 缺省同判
    const out2 = await gitTool.execute({ action: "status", workdir: "" }, { cwd: container })
    assert.equal(out2.split("\n")[0], `(repo: ${repo})`, "空串 workdir 与缺省同判 ⇒ 发现生效 + 注记")
    assert.match(out2, /Untracked \(1\):\nin-proj\.txt$/)
  })
})

// ── A18 边界：仓内锚 / 仓的子目录 ⇒ 零行为变（不重定向、无注记）──────────────────────────────
test("A18 仓内锚与仓的子目录：零行为变（不重定向、无注记）", async () => {
  await withTmp(async (container) => {
    const repo = join(container, "proj")
    makeRepo(repo)
    mkdirSync(join(repo, "sub", "nested"), { recursive: true })
    writeFileSync(join(repo, "u.txt"), "u\n")
    const atRoot = await gitTool.execute({ action: "status" }, { cwd: repo })
    assert.equal(atRoot.startsWith("(repo: "), false, "self：锚已是仓根 ⇒ 不重定向 / 无注记")
    assert.match(atRoot, /Untracked \(1\):\nu\.txt$/, "仓根锚照旧")
    const atSub = await gitTool.execute({ action: "status" }, { cwd: join(repo, "sub") })
    assert.equal(atSub, atRoot, "仓内子目录（锚无 .git、子目录无 manifest ⇒ none）⇒ 靠 git 自身向上搜索")
    assert.equal(atSub.startsWith("(repo: "), false, "none：不重定向 / 无注记（零行为变）")
  })
})

// ── A19 边界：创建类动作例外（init / clone 判据同 init）⇒ 落点 = cwd、不进发现的子仓 ────────────
test("A19 创建类动作例外：init / clone 以 cwd 为落点（不做发现）", async () => {
  await withTmp(async (base) => {
    // ① init：唯一态容器 ⇒ `.git` 落容器（不是发现的子仓）
    const c1 = join(base, "c1")
    const proj1 = join(c1, "proj")
    makeRepo(proj1)
    const configBefore = readFileSync(join(proj1, ".git", "config"), "utf8")
    const out1 = await gitTool.execute({ action: "init" }, { cwd: c1 })
    assert.equal(out1.startsWith("(repo: "), false, "init 例外 ⇒ 不重定向 / 无注记")
    assert.equal(existsSync(join(c1, ".git")), true, "init 落点 = cwd（容器）")
    assert.equal(readFileSync(join(proj1, ".git", "config"), "utf8"), configBefore, "子仓 .git 未被重写")
    // ② clone：判据同 init——落点 = cwd 相对路径（源仓在容器外 ⇒ 目标名不撞车）
    const c2 = join(base, "c2")
    const proj2 = join(c2, "proj")
    makeRepo(proj2)
    const src = join(base, "src-repo")
    makeRepo(src, { manifest: false })
    const out2 = await gitTool.execute({ action: "clone", remote: src.replace(/\\/g, "/") }, { cwd: c2 })
    assert.equal(/failed/.test(out2), false, `clone 应成功（实得：${out2}）`)
    assert.equal(out2.startsWith("(repo: "), false, "clone 例外 ⇒ 不重定向 / 无注记")
    assert.equal(existsSync(join(c2, "src-repo", ".git")), true, "clone 落点 = cwd 相对（容器）")
    assert.equal(existsSync(join(proj2, "src-repo")), false, "未克隆进发现的子仓")
  })
})

// ── A21 / A22（#188 裸仓级——先红面：批前均落 §6.12 fail-closed）────────────────────────────

test("A21 裸仓级命中：容器 + 恰一裸子仓 ⇒ 重定向 + 注记首行（批前 = none ⇒ fail-closed）", async () => {
  await withTmp(async (container) => {
    const repo = join(container, "bare-proj")
    makeRepo(repo, { manifest: false })
    writeFileSync(join(repo, "untracked.txt"), "u\n")
    const out = await gitTool.execute({ action: "status" }, { cwd: container })
    const [note, ...rest] = out.split("\n")
    assert.equal(note, `(repo: ${repo})`, "裸仓级命中同享重定向注记（首行 + 仓根绝对路径）")
    assert.match(rest.join("\n"), /Untracked \(1\):\nuntracked\.txt$/, "porcelain 条目级一致")
    assert.equal(existsSync(join(container, ".git")), false, "零副作用（不落仓于容器）")
    assert.equal(existsSync(join(repo, MANIFEST_REL)), false, "发现面不建档（纯 fs 只判存在性）")
  })
})

test("A22 裸仓级歧义：容器 + 两裸子仓 ⇒ throw（消息 = 裸仓档变体——不书带档句）", async () => {
  await withTmp(async (container) => {
    const [a, b] = ["alpha-repo", "beta-repo"].map((n) => join(container, n))
    for (const d of [a, b]) makeRepo(d, { manifest: false })
    await assert.rejects(() => gitTool.execute({ action: "status" }, { cwd: container }), (e) => {
      assert.ok(e.message.includes(a), "候选①绝对路径在册")
      assert.ok(e.message.includes(b), "候选②绝对路径在册")
      assert.match(e.message, /workdir/, "指引用显式 workdir")
      assert.equal(e.message.includes("clean"), false, "不含 clean（不与假洁净同形）")
      assert.equal(/carry \.git and PROJECT-MANIFEST\.json/.test(e.message), false, "裸仓档变体：不书带档句")
      assert.match(e.message, /none carries PROJECT-MANIFEST\.json/, "裸仓档变体明示「无一带档」（§6.13 A22）")
      return true
    })
  })
})

// ── A20 错误 / 结构面：单源机判（禁第二份发现实现——KD-M1-22）────────────────────────────────
test("A20 单源机判：git.mjs 经 manifest.mjs 复用发现（node:fs / 扫描谓词零命中）", () => {
  const raw = readFileSync(join(ROOT, "tools", "git.mjs"), "utf8")
  // 注释剥除后再扫（承 core-hygiene.test.mjs 的 stripComments 先例——散文提词不构成 import / 调用，免假红）
  const src = raw.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1")
  assert.match(src, /import\s*\{[^}]*\bdiscoverRepos\b[^}]*\}\s*from\s*"\.\.\/manifest\.mjs"/,
    "① 单源：discoverRepos 自 ../manifest.mjs import 命中（两消费者共用同一导出）")
  assert.equal(src.includes("node:fs"), false, "② 本档无 fs import（注释剥除后）⇒ 物理上无法自写目录扫描")
  for (const pred of ["readdirSync", "existsSync", "statSync"]) {
    assert.equal(src.includes(pred), false, `③ 扫描谓词零命中：${pred}`)
  }
})
