/**
 * git.test.mjs — tests extracted per AGENT-LOOP.md §18.14 (test files split by domain).
 * Source(s): tools.test.mjs.
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync, readFileSync, mkdirSync, existsSync, readdirSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, relative, dirname } from "node:path"
import { slow } from "./slow.mjs"
import { builtinTools } from "../src/tools/index.mjs"



test("T2c D2：安静 commit（输出为空）也清理——commit.ok 判定不依赖输出非空", () => {
  // 行为路径：git commit 成功必有摘要输出（-q 才能安静，工具不传 -q），"输出为空"只能
  // 在代码结构上证明——清理调用与 commit.out 回显同级、同属 commit.ok 分支，不嵌套在
  // 输出非空条件内（D2：commit.ok 即成功判定）。
  const src = readFileSync(join(import.meta.dirname, "..", "src", "tools", "git.mjs"), "utf8")
  const commitCase = src.slice(src.indexOf('case "commit"'), src.indexOf('case "push"'))
  const m = commitCase.match(
    /if \(commit\.ok\) \{\n\s*if \(commit\.out\) parts\.push\(commit\.out\)\n\s*\/\/ F6:[\s\S]*?await deleteCheckpointsForCwd\(ctx\.cwd\)/
  )
  assert.ok(m, "清理调用与 commit.out 回显同级（cleanup 不依赖输出非空）")
  assert.match(commitCase, /\(checkpoints cleared — commit is a new safety baseline\)/, "清理行文本在成功分支内")
})



test("T5b F7：git 工具 action 集精确（既有 21 + 新增 11 = 32，不含 P2）", () => {
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  const enums = byName.git.parameters.properties.action.enum
  const EXPECTED = [
    "diff", "status", "log", "show", "checkpoint", "add", "rm", "commit", "push",
    "tag", "branch", "checkout", "restore", "stash", "fetch", "pull", "reset",
    "revert", "merge", "cherry-pick", "ls-remote",
    "clone", "init", "rebase", "remote", "clean", "switch", "apply", "worktree",
    "archive", "blame", "mv",
  ]
  assert.deepEqual(enums, EXPECTED, "action 集精确（21 既有 + 11 新增）")
  for (const p of ["gc", "config", "fsck", "bisect", "grep", "ls-files", "merge-base", "am", "submodule"]) {
    assert.ok(!enums.includes(p), `不含 P2 action: ${p}`)
  }
})



test("T8 F1：破坏性 action 的 schema 描述含自动快照 + rewind 字样", () => {
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  const props = byName.git.parameters.properties
  const destructiveDescs = [
    props.path.description, // checkout -- path / restore
    props.mode.description, // reset --hard
    props.stashAction.description, // stash pop
    props.branchAction.description, // branch delete
    props.tagAction.description, // tag delete
    props.checkpointAction.description, // rewind
    props.action.description, // clean/rebase（enum 级）
  ]
  for (const d of destructiveDescs) {
    assert.match(d, /自动快照/, `描述含"自动快照": ${d}`)
    assert.match(d, /rewind/, `描述含 rewind: ${d}`)
  }
})



test("git_diff / git_status / git_log: 只读 git 工具", async () => {
  const { execFileSync } = await import("node:child_process")
  const dir = mkdtempSync(join(tmpdir(), "thincoder-git-"))
  try {
    execFileSync("git", ["init", "-q"], { cwd: dir })
    execFileSync("git", ["config", "user.name", "t"], { cwd: dir })
    execFileSync("git", ["config", "user.email", "t@t.dev"], { cwd: dir })
    // 关闭 autocrlf，避免 Windows 下 git 自动转换导致 porcelain 输出格式变化
    execFileSync("git", ["config", "core.autocrlf", "false"], { cwd: dir })
    writeFileSync(join(dir, "a.js"), "1\n")
    execFileSync("git", ["add", "a.js"], { cwd: dir })
    execFileSync("git", ["commit", "-qm", "first"], { cwd: dir })
    writeFileSync(join(dir, "a.js"), "2\n")
    writeFileSync(join(dir, "b.js"), "3\n")

    const ctx = { cwd: dir }
    const git = builtinTools.find((t) => t.name === "git")

    // git diff
    const diff = await git.execute({ action: "diff" }, ctx)
    assert.ok(diff.includes("a.js"))

    // git status
    const status = await git.execute({ action: "status" }, ctx)
    assert.ok(status.includes("a.js"), `missing a.js: ${status}`)
    assert.ok(status.includes("b.js"), `missing b.js: ${status}`)
    assert.ok(
      status.includes("Staged") || status.includes("Unstaged"),
      `missing Staged/Unstaged label: ${status}`,
    )
    assert.ok(status.includes("Untracked"), `missing Untracked: ${status}`)

    // git log
    const log = await git.execute({ action: "log", count: 1 }, ctx)
    assert.ok(log.includes("first"))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



slow("git: 扩充 action（add/commit 分文件、tag、branch、checkout/restore、stash、reset、revert、merge、cherry-pick、参数校验）", async () => {
  const { execFileSync } = await import("node:child_process")
  const dir = mkdtempSync(join(tmpdir(), "thincoder-git-ext-"))
  const g = (...a) => execFileSync("git", a, { cwd: dir, encoding: "utf8" })
  try {
    g("init", "-q")
    g("config", "user.name", "t")
    g("config", "user.email", "t@t.dev")
    g("config", "core.autocrlf", "false")
    writeFileSync(join(dir, "a.js"), "1\n")
    g("add", "a.js")
    g("commit", "-qm", "first")
    const main = g("branch", "--show-current").trim() // main / master 视 git 版本

    const ctx = { cwd: dir }
    const git = builtinTools.find((t) => t.name === "git")

    // add（分文件）+ commit（path 分文件）
    writeFileSync(join(dir, "b.js"), "2\n")
    const addOut = await git.execute({ action: "add", path: "b.js" }, ctx)
    assert.ok(!/failed/i.test(addOut))
    const commitOut = await git.execute({ action: "commit", message: "add b", path: "b.js" }, ctx)
    assert.ok(!/failed/i.test(commitOut))

    // tag：create → list → delete
    assert.ok((await git.execute({ action: "tag", tagAction: "create", name: "v0.1" }, ctx)).includes("created"))
    assert.ok((await git.execute({ action: "tag", tagAction: "list" }, ctx)).includes("v0.1"))
    assert.ok((await git.execute({ action: "tag", tagAction: "delete", name: "v0.1" }, ctx)).includes("deleted"))

    // branch：create → list → switch
    assert.ok((await git.execute({ action: "branch", branchAction: "create", name: "feat" }, ctx)).includes("created"))
    assert.ok((await git.execute({ action: "branch", branchAction: "list" }, ctx)).includes("feat"))
    assert.ok((await git.execute({ action: "branch", branchAction: "switch", name: "feat" }, ctx)).includes("Switched"))
    g("checkout", "-q", main) // 回主分支

    // checkout -- <file>（还原工作区改动，先快照）
    writeFileSync(join(dir, "a.js"), "changed\n")
    const ck = await git.execute({ action: "checkout", path: "a.js" }, ctx)
    assert.ok(!/failed/i.test(ck))
    assert.equal(readFileSync(join(dir, "a.js"), "utf8"), "1\n") // 已还原

    // restore --staged
    writeFileSync(join(dir, "a.js"), "staged\n")
    g("add", "a.js")
    await git.execute({ action: "restore", path: "a.js", staged: true }, ctx)
    assert.ok((await git.execute({ action: "status" }, ctx)).includes("Unstaged"))

    // stash：push → list → pop
    writeFileSync(join(dir, "a.js"), "wip\n")
    assert.ok(!/failed/i.test(await git.execute({ action: "stash", stashAction: "push" }, ctx)))
    assert.ok((await git.execute({ action: "stash", stashAction: "list" }, ctx)).includes("stash"))
    assert.ok(!/failed/i.test(await git.execute({ action: "stash", stashAction: "pop" }, ctx)))

    // reset soft + hard（hard 先快照）
    g("checkout", "-q", "--", ".")
    const soft = await git.execute({ action: "reset", mode: "soft" }, ctx)
    assert.ok(!/failed/i.test(soft))
    const hard = await git.execute({ action: "reset", mode: "hard" }, ctx)
    assert.ok(!/failed/i.test(hard))

    // revert：还原最近一次提交
    const rev = await git.execute({ action: "revert" }, ctx)
    assert.ok(!/failed/i.test(rev))

    // merge + cherry-pick：side 分支提交一个文件，cherry-pick 到 main，再 merge side
    g("checkout", "-q", main)
    await git.execute({ action: "branch", branchAction: "create", name: "side" }, ctx)
    await git.execute({ action: "branch", branchAction: "switch", name: "side" }, ctx)
    writeFileSync(join(dir, "side.js"), "s\n")
    await git.execute({ action: "commit", message: "side", path: "side.js" }, ctx)
    const sideRef = g("rev-parse", "HEAD").trim()
    await git.execute({ action: "branch", branchAction: "switch", name: main }, ctx)
    const cp = await git.execute({ action: "cherry-pick", ref: sideRef }, ctx) // main 没有 side.js，干净应用
    assert.ok(!/fatal|failed/i.test(cp), `cherry-pick: ${cp}`)
    const mg = await git.execute({ action: "merge", ref: "side" }, ctx) // 内容已含 → Already up to date / 干净合并
    assert.ok(!/fatal|failed/i.test(mg), `merge: ${mg}`)

    // 参数校验（缺参报错）
    assert.ok((await git.execute({ action: "commit" }, ctx)).includes("requires message"))
    assert.ok((await git.execute({ action: "tag", tagAction: "create" }, ctx)).includes("requires name"))
    assert.ok((await git.execute({ action: "branch", branchAction: "switch" }, ctx)).includes("requires name"))
    assert.ok((await git.execute({ action: "merge" }, ctx)).includes("requires ref"))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("git: workdir 在 workspace 子目录的 git 仓库运行；越界（外部仓库）正常执行（§10.1 T-w-2 语义改）", async () => {
  const { execFileSync } = await import("node:child_process")
  const dir = mkdtempSync(join(tmpdir(), "thincoder-git-wd-"))
  const ext = mkdtempSync(join(tmpdir(), "thincoder-git-ext-")) // 独立仓库，位于 workspace 之外
  try {
    const sub = join(dir, "sub")
    mkdirSync(sub, { recursive: true })
    execFileSync("git", ["init", "-q"], { cwd: sub })
    execFileSync("git", ["config", "user.name", "t"], { cwd: sub })
    execFileSync("git", ["config", "user.email", "t@t.dev"], { cwd: sub })
    execFileSync("git", ["config", "core.autocrlf", "false"], { cwd: sub })
    writeFileSync(join(sub, "x.js"), "1\n")
    execFileSync("git", ["add", "x.js"], { cwd: sub })
    execFileSync("git", ["commit", "-qm", "init"], { cwd: sub })
    // 外部仓库（dir 之外）：commit 标记 ext-commit
    execFileSync("git", ["init", "-q"], { cwd: ext })
    execFileSync("git", ["config", "user.name", "t"], { cwd: ext })
    execFileSync("git", ["config", "user.email", "t@t.dev"], { cwd: ext })
    execFileSync("git", ["config", "core.autocrlf", "false"], { cwd: ext })
    writeFileSync(join(ext, "y.js"), "2\n")
    execFileSync("git", ["add", "y.js"], { cwd: ext })
    execFileSync("git", ["commit", "-qm", "ext-commit"], { cwd: ext })

    const ctx = { cwd: dir } // workspace 根 = dir
    const git = builtinTools.find((t) => t.name === "git")
    // workdir=sub → 在子仓库运行
    const log = await git.execute({ action: "log", workdir: "sub" }, ctx)
    assert.ok(log.includes("init"), `log 应来自子仓库: ${log}`)
    // T-w-2 语义改（TOOLS.md §10.1）：workdir 指向 workspace 外 → 正常执行（不再报错拒绝）
    const extLog = await git.execute({ action: "log", workdir: relative(dir, ext) }, ctx)
    assert.ok(extLog.includes("ext-commit"), `外部仓库 log 应正常执行: ${extLog}`)
  } finally {
    rmSync(dir, { recursive: true, force: true })
    rmSync(ext, { recursive: true, force: true })
  }
})


// ---------------------------------------------------------------- 2026-08-31 工具体验评审新增


test("git: ls-remote 返回远端 ref（本地 bare remote，无需网络）", async () => {
  const { execFileSync } = await import("node:child_process")
  const dir = mkdtempSync(join(tmpdir(), "thincoder-git-lsr-"))
  const bare = mkdtempSync(join(tmpdir(), "thincoder-git-bare-"))
  const g = (...a) => execFileSync("git", a, { cwd: dir, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })
  try {
    g("init", "-q"); g("config", "user.name", "t"); g("config", "user.email", "t@t.dev")
    writeFileSync(join(dir, "a.js"), "1\n"); g("add", "a.js"); g("commit", "-qm", "first")
    execFileSync("git", ["init", "-q", "--bare", bare], { encoding: "utf8" })
    g("remote", "add", "origin", bare)
    g("push", "-q", "origin", "HEAD")
    const git = builtinTools.find((t) => t.name === "git")
    const out = await git.execute({ action: "ls-remote", remote: "origin", ref: "HEAD" }, { cwd: dir })
    assert.match(out, /[0-9a-f]{40}\s+HEAD/, `ls-remote should list the head ref: ${out}`)
    // config 参数合法化：proxy 项透传不报错（本地文件远端不需要真代理，仅验证参数接线）
    const out2 = await git.execute({ action: "ls-remote", remote: "origin", config: ["http.proxy=http://127.0.0.1:1"] }, { cwd: dir })
    assert.ok(!/Invalid git -c/.test(out2), `config array must be accepted: ${out2}`)
  } finally {
    rmSync(dir, { recursive: true, force: true }); rmSync(bare, { recursive: true, force: true })
  }
})



test("git: 非法 config 参数拒绝（非数组 / 含换行）", async () => {
  const { execFileSync } = await import("node:child_process")
  const dir = mkdtempSync(join(tmpdir(), "thincoder-git-cfg-"))
  const g = (...a) => execFileSync("git", a, { cwd: dir, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })
  try {
    g("init", "-q"); g("config", "user.name", "t"); g("config", "user.email", "t@t.dev")
    const git = builtinTools.find((t) => t.name === "git")
    await assert.rejects(() => git.execute({ action: "status", config: "http.proxy=x" }, { cwd: dir }), /config must be an array/)
    await assert.rejects(() => git.execute({ action: "status", config: ["http.proxy=x\n--global"] }, { cwd: dir }), /invalid git -c config entry/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
