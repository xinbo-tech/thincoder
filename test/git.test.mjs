/**
 * git.test.mjs — git tool — unified actions / checkpoint mirror / bash destructive protection + background capture.
 *
 * Split from test/tools.test.mjs (AGENT-LOOP.md §18.14/§18.14.1 D-T1.1 domain rule —
 * blocks moved verbatim; test names/semantics unchanged).
 */

import { describe, it, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync, existsSync, readFileSync, mkdirSync, symlinkSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

let tmp, cwd

const ctx = () => ({ cwd })

function setup() {
  tmp = mkdtempSync(join(tmpdir(), "thincoder-vscode-tools-test-"))
  cwd = tmp
}

function cleanup() { rmSync(tmp, { recursive: true, force: true }) }

/** cwdHash12 契约（CHECKPOINT.md F5/验收 12，与 src/tools/checkpoint.mjs 相同）：
 *  sha1(normalizeCwd(cwd)).slice(0,12)——Windows 盘符大写归一化，跨端互通前提。 */
async function vsCheckpointRoot(cwdPath) {
  const { createHash } = await import("node:crypto")
  const { configDir } = await import("../src/config-io.mjs")
  const norm = cwdPath.replace(/^([a-z]):/, (_, d) => d.toUpperCase() + ":")
  return join(configDir, "checkpoints", createHash("sha1").update(norm).digest("hex").slice(0, 12))
}

/** 测试自清理：删除该 cwd 的快照目录（测试 repo 是唯一 mkdtemp 目录，hash 不与他人冲突） */
async function cleanupCheckpoints(cwdPath) {
  const { rm } = await import("node:fs/promises")
  await rm(await vsCheckpointRoot(cwdPath), { recursive: true, force: true })
}

describe("git — unified tool (CLI parity: action subcommands)", () => {
  beforeEach(setup)
  afterEach(cleanup)

  it("builtin registry exposes git as a single tool (no git_diff/status/log/checkpoint)", async () => {
    const { builtinTools } = await import("../src/tools/index.mjs")
    const names = builtinTools.map((t) => t.name)
    assert.ok(names.includes("git"))
    assert.ok(!names.includes("git_diff"))
    assert.ok(!names.includes("git_status"))
    assert.ok(!names.includes("git_log"))
    assert.ok(!names.includes("checkpoint"))
    assert.ok(names.includes("hashline_edit"))
  })

  it("diff/status/log run against a real repo", async () => {
    const { gitTool } = await import("../src/tools/git.mjs")
    const { execSync } = await import("node:child_process")
    execSync("git init -q", { cwd })
    execSync('git config user.email t@t && git config user.name t', { cwd })
    writeFileSync(join(cwd, "f.txt"), "hello\n")
    execSync("git add f.txt && git commit -qm init", { cwd })
    writeFileSync(join(cwd, "f.txt"), "hello world\n")
    const st = await gitTool.execute({ action: "status" }, ctx())
    assert.match(st, /f\.txt/, "modified file listed: " + st)
    const df = await gitTool.execute({ action: "diff" }, ctx())
    assert.match(df, /hello world/)
    const lg = await gitTool.execute({ action: "log", oneline: true }, ctx())
    assert.match(lg, /init/)
  })

  it("unknown action returns guidance", async () => {
    const { gitTool } = await import("../src/tools/git.mjs")
    const r = await gitTool.execute({ action: "nope" }, ctx())
    assert.match(r, /Unknown action 'nope'/)
  })

  it("show returns commit stat; rm untracks; commit+push work", async () => {
    const { gitTool } = await import("../src/tools/git.mjs")
    const { execSync } = await import("node:child_process")
    execSync("git init -q", { cwd })
    execSync("git config user.email t@t && git config user.name t", { cwd })
    writeFileSync(join(cwd, "a.txt"), "hello\n")
    execSync("git add a.txt && git commit -qm init", { cwd })
    writeFileSync(join(cwd, "b.txt"), "world\n")

    // show: 默认 HEAD，有 init 提交的 stat
    const sh = await gitTool.execute({ action: "show" }, ctx())
    assert.match(sh, /init/)

    // rm: 把 b.txt 移出跟踪（文件保留）
    execSync("git add b.txt", { cwd })
    const rm = await gitTool.execute({ action: "rm", path: "b.txt" }, ctx())
    assert.match(rm, /Removed from tracking: b\.txt/)
    const tracked = execSync("git ls-files", { cwd, encoding: "utf8" })
    assert.ok(tracked.includes("a.txt"))
    assert.ok(!tracked.includes("b.txt"))
    assert.ok(existsSync(join(cwd, "b.txt"))) // 磁盘还在

    // commit + push: 提交一个文件
    writeFileSync(join(cwd, "c.txt"), "c\n")
    const cm = await gitTool.execute({ action: "commit", message: "add c" }, ctx())
    assert.match(cm, /add c/)
    const lg = await gitTool.execute({ action: "log", oneline: true }, ctx())
    assert.match(lg, /add c/)
  })

  it("filter keeps only matching lines on read-only actions", async () => {
    const { gitTool } = await import("../src/tools/git.mjs")
    const { execSync } = await import("node:child_process")
    execSync("git init -q", { cwd })
    execSync("git config user.email t@t && git config user.name t", { cwd })
    writeFileSync(join(cwd, "target.txt"), "x\n")
    writeFileSync(join(cwd, "other.txt"), "y\n")
    execSync("git add -A && git commit -qm init", { cwd })
    writeFileSync(join(cwd, "target.txt"), "changed\n")

    const st = await gitTool.execute({ action: "status", filter: "target" }, ctx())
    assert.match(st, /target\.txt/)
    assert.ok(!st.includes("other.txt"))
  })

  it("isReadonlyAction distinguishes read vs write actions", async () => {
    const { gitTool } = await import("../src/tools/git.mjs")
    assert.ok(gitTool.isReadonlyAction({ action: "status" }))
    assert.ok(gitTool.isReadonlyAction({ action: "diff" }))
    assert.ok(gitTool.isReadonlyAction({ action: "log" }))
    assert.ok(gitTool.isReadonlyAction({ action: "show" }))
    assert.ok(gitTool.isReadonlyAction({ action: "ls-remote" }))
    assert.ok(gitTool.isReadonlyAction({ action: "checkpoint", checkpointAction: "list" }))
    assert.ok(gitTool.isReadonlyAction({ action: "checkpoint", checkpointAction: "cat" }))
    assert.ok(!gitTool.isReadonlyAction({ action: "rm" }))
    assert.ok(!gitTool.isReadonlyAction({ action: "commit" }))
    assert.ok(!gitTool.isReadonlyAction({ action: "push" }))
    assert.ok(!gitTool.isReadonlyAction({ action: "checkpoint", checkpointAction: "create" }))
    assert.ok(!gitTool.isReadonlyAction({ action: "checkpoint", checkpointAction: "rewind" }))
    assert.ok(!gitTool.isReadonlyAction({ action: "nope" }))
  })

  it("扩充 action：add/commit 分文件、tag、branch、checkout/restore、stash、reset、revert、merge、cherry-pick、参数校验", async () => {
    const { gitTool } = await import("../src/tools/git.mjs")
    const { execSync, execFileSync } = await import("node:child_process")
    const g = (...a) => execFileSync("git", a, { cwd, encoding: "utf8" })
    execSync("git init -q", { cwd })
    execSync("git config user.email t@t && git config user.name t", { cwd })
    execSync("git config core.autocrlf false", { cwd })
    writeFileSync(join(cwd, "a.js"), "1\n")
    execSync("git add a.js && git commit -qm first", { cwd })
    const main = g("branch", "--show-current").trim()

    // add 分文件 + commit path
    writeFileSync(join(cwd, "b.js"), "2\n")
    assert.doesNotMatch(await gitTool.execute({ action: "add", path: "b.js" }, ctx()), /failed/i)
    assert.doesNotMatch(await gitTool.execute({ action: "commit", message: "add b", path: "b.js" }, ctx()), /failed/i)

    // tag create/list/delete
    assert.match(await gitTool.execute({ action: "tag", tagAction: "create", name: "v0.1" }, ctx()), /created/)
    assert.match(await gitTool.execute({ action: "tag", tagAction: "list" }, ctx()), /v0\.1/)
    assert.match(await gitTool.execute({ action: "tag", tagAction: "delete", name: "v0.1" }, ctx()), /deleted/)

    // branch create/list/switch
    assert.match(await gitTool.execute({ action: "branch", branchAction: "create", name: "feat" }, ctx()), /created/)
    assert.match(await gitTool.execute({ action: "branch", branchAction: "list" }, ctx()), /feat/)
    assert.match(await gitTool.execute({ action: "branch", branchAction: "switch", name: "feat" }, ctx()), /Switched/)
    g("checkout", "-q", main)

    // checkout -- file（还原工作区改动）
    writeFileSync(join(cwd, "a.js"), "changed\n")
    assert.doesNotMatch(await gitTool.execute({ action: "checkout", path: "a.js" }, ctx()), /failed/i)
    assert.equal(readFileSync(join(cwd, "a.js"), "utf8"), "1\n")

    // restore --staged
    writeFileSync(join(cwd, "a.js"), "staged\n"); g("add", "a.js")
    await gitTool.execute({ action: "restore", path: "a.js", staged: true }, ctx())
    assert.match(await gitTool.execute({ action: "status" }, ctx()), /Unstaged/)

    // stash push/list/pop
    writeFileSync(join(cwd, "a.js"), "wip\n")
    assert.doesNotMatch(await gitTool.execute({ action: "stash", stashAction: "push" }, ctx()), /failed/i)
    assert.match(await gitTool.execute({ action: "stash", stashAction: "list" }, ctx()), /stash/)
    assert.doesNotMatch(await gitTool.execute({ action: "stash", stashAction: "pop" }, ctx()), /failed/i)

    // reset soft/hard + revert
    g("checkout", "-q", "--", ".")
    assert.doesNotMatch(await gitTool.execute({ action: "reset", mode: "soft" }, ctx()), /failed/i)
    assert.doesNotMatch(await gitTool.execute({ action: "reset", mode: "hard" }, ctx()), /failed/i)
    assert.doesNotMatch(await gitTool.execute({ action: "revert" }, ctx()), /failed/i)

    // merge + cherry-pick（side 分支提交，main 干净应用）
    g("checkout", "-q", main)
    await gitTool.execute({ action: "branch", branchAction: "create", name: "side" }, ctx())
    await gitTool.execute({ action: "branch", branchAction: "switch", name: "side" }, ctx())
    writeFileSync(join(cwd, "side.js"), "s\n")
    await gitTool.execute({ action: "commit", message: "side", path: "side.js" }, ctx())
    const sideRef = g("rev-parse", "HEAD").trim()
    await gitTool.execute({ action: "branch", branchAction: "switch", name: main }, ctx())
    assert.doesNotMatch(await gitTool.execute({ action: "cherry-pick", ref: sideRef }, ctx()), /fatal|failed/i)
    assert.doesNotMatch(await gitTool.execute({ action: "merge", ref: "side" }, ctx()), /fatal|failed/i)

    // 参数校验
    assert.match(await gitTool.execute({ action: "commit" }, ctx()), /requires message/)
    assert.match(await gitTool.execute({ action: "merge" }, ctx()), /requires ref/)
  })

  it("workdir 在 workspace 子目录的 git 仓库运行；越界不再拒绝（TOOLS.md §10.1 T-w-2：git 本身不限目录）", async () => {
    const { gitTool } = await import("../src/tools/git.mjs")
    const { execFileSync } = await import("node:child_process")
    const { mkdirSync } = await import("node:fs")
    const sub = join(cwd, "sub")
    mkdirSync(sub, { recursive: true })
    execFileSync("git", ["init", "-q"], { cwd: sub })
    execFileSync("git", ["config", "user.name", "t"], { cwd: sub })
    execFileSync("git", ["config", "user.email", "t@t.dev"], { cwd: sub })
    execFileSync("git", ["config", "core.autocrlf", "false"], { cwd: sub })
    writeFileSync(join(sub, "x.js"), "1\n")
    execFileSync("git", ["add", "x.js"], { cwd: sub })
    execFileSync("git", ["commit", "-qm", "init"], { cwd: sub })

    // 2026-08-31：ls-remote 读取本地子仓库远端（bare）——不依赖网络；config 数组合法化
    const bare = join(cwd, "bare.git")
    execFileSync("git", ["init", "-q", "--bare", bare])
    execFileSync("git", ["-C", sub, "remote", "add", "origin", bare])
    execFileSync("git", ["-C", sub, "push", "-q", "origin", "HEAD"])
    const lsr = await gitTool.execute({ action: "ls-remote", remote: "origin", ref: "HEAD", workdir: "sub" }, ctx())
    assert.match(lsr, /[0-9a-f]{40}\s+HEAD/, `ls-remote should list the head ref: ${lsr}`)
    await assert.rejects(() => gitTool.execute({ action: "status", config: "x=y" }, ctx()), /config must be an array/)
    await assert.rejects(() => gitTool.execute({ action: "status", config: ["x\n--global"] }, ctx()), /invalid git -c config entry/)

    const log = await gitTool.execute({ action: "log", workdir: "sub" }, ctx())
    assert.match(log, /init/)
    // 边界断言已移除（2026-09-02）：workdir 越界正常解析执行——git 在该目录跑并返回自身错误信息
    const outside = await gitTool.execute({ action: "status", workdir: "../escape" }, ctx())
    assert.ok(!/escapes the workspace/.test(outside), `不再拒绝越界 workdir: ${outside.slice(0, 120)}`)
  })
})

describe("bash — git destructive-command protection (CLI parity)", () => {
  beforeEach(setup)
  afterEach(async () => { await cleanupCheckpoints(cwd); cleanup() })

  it("T7d guard 对齐：checkout -- . 触发全量副本快照 + rewind 指引，无 stash（CHECKPOINT.md D4）", async () => {
    const { bashTool } = await import("../src/tools/shell.mjs")
    const { execSync } = await import("node:child_process")
    const { rm } = await import("node:fs/promises")
    execSync("git init -q", { cwd })
    execSync("git config user.email t@t && git config user.name t", { cwd })
    writeFileSync(join(cwd, "app.js"), "const v = 1\n")
    execSync("git add app.js && git commit -qm init", { cwd })
    writeFileSync(join(cwd, "app.js"), "const v = 2 // uncommitted\n")

    // 不拦截：全量副本快照后放行，命令正常执行
    const r = await bashTool.execute({ command: "git checkout -- ." }, { cwd })
    assert.match(r, /\[auto-protection\]/, "应提示自动快照: " + r.slice(0, 120))
    assert.match(r, /snapshot \S+ created BEFORE execution/, "输出含快照 id（CLI gitGuardSnapshot 同构）")
    assert.match(r, /checkpointAction=rewind checkpointId=\S+/, "通知含 rewind 恢复指引")
    assert.equal(readFileSync(join(cwd, "app.js"), "utf8").replace(/\r\n/g, "\n"), "const v = 1\n", "命令已执行（未被拦截）")

    // 无 stash 产生（guard 路径已从 stash 迁到全量副本）
    const stash = execSync("git stash list", { cwd, encoding: "utf8" })
    assert.ok(!stash.includes("thincoder-auto-"), "guard 不再产生 stash")

    // 从全量副本快照恢复未提交工作（rewind，与 CLI 同存储同格式）
    const { rewind } = await import("../src/tools/checkpoint.mjs")
    const id = r.match(/snapshot (\S+) created BEFORE execution/)[1]
    const s = await rewind(cwd, id, { path: "app.js" })
    assert.equal(s.restored, true)
    assert.equal(readFileSync(join(cwd, "app.js"), "utf8").replace(/\r\n/g, "\n"), "const v = 2 // uncommitted\n", "快照恢复未提交工作")
    await rm(join(await vsCheckpointRoot(cwd), id), { recursive: true, force: true })
  })

  it("T7d 变体 `git checkout HEAD -- .` 同样触发全量副本快照，untracked 可恢复", async () => {
    const { bashTool } = await import("../src/tools/shell.mjs")
    const { execSync } = await import("node:child_process")
    const { rm } = await import("node:fs/promises")
    execSync("git init -q", { cwd })
    execSync("git config user.email t@t && git config user.name t", { cwd })
    writeFileSync(join(cwd, "app.js"), "const v = 1\n")
    execSync("git add app.js && git commit -qm init", { cwd })
    writeFileSync(join(cwd, "app.js"), "const v = 2 // uncommitted\n")
    writeFileSync(join(cwd, "new.js"), "export const fresh = 42\n")

    // 变体：宽匹配覆盖 → 全量副本快照 → 放行
    const r = await bashTool.execute({ command: "git checkout HEAD -- ." }, { cwd })
    assert.match(r, /\[auto-protection\]/, "变体命令触发自动快照: " + r.slice(0, 120))
    assert.match(r, /checkpointAction=rewind checkpointId=\S+/, "含 rewind 指引")
    assert.equal(readFileSync(join(cwd, "app.js"), "utf8").replace(/\r\n/g, "\n"), "const v = 1\n", "tracked 修改被回滚抹掉")

    // 从全量副本快照恢复 tracked + untracked（CLI parity）
    const { rewind } = await import("../src/tools/checkpoint.mjs")
    const id = r.match(/snapshot (\S+) created BEFORE execution/)[1]
    await rewind(cwd, id, { path: "app.js" })
    await rewind(cwd, id, { path: "new.js" })
    assert.equal(readFileSync(join(cwd, "app.js"), "utf8").replace(/\r\n/g, "\n"), "const v = 2 // uncommitted\n", "快照恢复 tracked 修改")
    assert.equal(readFileSync(join(cwd, "new.js"), "utf8").replace(/\r\n/g, "\n"), "export const fresh = 42\n", "快照恢复 untracked 新文件")
    await rm(join(await vsCheckpointRoot(cwd), id), { recursive: true, force: true })
  })

  it("non-destructive git commands are untouched; non-repo is silent", async () => {
    const { bashTool } = await import("../src/tools/shell.mjs")
    const { execSync } = await import("node:child_process")
    execSync("git init -q", { cwd })
    execSync("git config user.email t@t && git config user.name t", { cwd })
    writeFileSync(join(cwd, "app.js"), "const v = 1\n")
    execSync("git add app.js && git commit -qm init", { cwd })

    // 注意：不用 git checkout --help 验证——git 的 --help 会打开系统浏览器（Windows），测试不得触发
    for (const cmd of ["git status", "git log --oneline", "git checkout -b tmp-branch", "git branch"]) {
      const r = await bashTool.execute({ command: cmd }, { cwd })
      assert.ok(!r.includes("[auto-protection]"), `${cmd} 不应触发保护`)
    }
    // 非 git 仓库：无快照、不拦截（git 自己的 stderr 返回给模型）
    const plain = mkdtempSync(join(tmpdir(), "thincoder-vscode-shell-plain-"))
    const r4 = await bashTool.execute({ command: "git restore ." }, { cwd: plain })
    assert.ok(!r4.includes("[auto-protection]"), "非 git 仓库保护静默")
    rmSync(plain, { recursive: true, force: true })
  })
})

describe("checkpoint — 全量副本镜像（CHECKPOINT.md F5 存储统一，CLI parity）", () => {
  beforeEach(setup)
  afterEach(async () => { await cleanupCheckpoints(cwd); cleanup() })

  it("git 工具 checkpoint：create/list/rewind/cat/versions 走镜像（同存储同格式）", async () => {
    const { gitTool } = await import("../src/tools/git.mjs")
    const { execSync, execFileSync } = await import("node:child_process")
    execSync("git init -q", { cwd })
    execSync("git config user.email t@t && git config user.name t", { cwd })
    writeFileSync(join(cwd, "app.js"), "const v = 1\n")
    execSync("git add app.js && git commit -qm init", { cwd })

    // create → list（含 D7 提示行）
    writeFileSync(join(cwd, "app.js"), "const v = 2\n")
    const created = await gitTool.execute({ action: "checkpoint", checkpointAction: "create" }, ctx())
    const id = created.match(/Checkpoint (\S+) created/)[1]
    assert.ok(id, `create 返回 id: ${created}`)
    const listed = await gitTool.execute({ action: "checkpoint", checkpointAction: "list" }, ctx())
    assert.ok(listed.includes(id), "list 含快照 id")
    assert.ok(listed.endsWith("(意外丢弃改动？checkpointAction=rewind 可恢复操作前状态)"), "D7 提示行在尾部")
    assert.equal((listed.match(/意外丢弃改动/g) || []).length, 1, "提示行只出现一次")

    // versions
    const versions = await gitTool.execute({ action: "checkpoint", checkpointAction: "versions", path: "app.js" }, ctx())
    assert.ok(versions.includes(id), `versions 含快照 id: ${versions}`)

    // cat
    const cat = await gitTool.execute({ action: "checkpoint", checkpointAction: "cat", checkpointId: id, path: "app.js" }, ctx())
    assert.equal(cat.replace(/\r\n/g, "\n"), "const v = 2\n", "cat 读取快照内容")

    // rewind 恢复（改坏后单文件恢复）
    writeFileSync(join(cwd, "app.js"), "const v = 999\n")
    const rew = await gitTool.execute({ action: "checkpoint", checkpointAction: "rewind", checkpointId: id, path: "app.js" }, ctx())
    assert.match(rew, /Restored "app\.js"/)
    assert.equal(readFileSync(join(cwd, "app.js"), "utf8").replace(/\r\n/g, "\n"), "const v = 2\n", "rewind 恢复快照状态")

    // 空 list 输出不变
    const g2 = mkdtempSync(join(tmpdir(), "thincoder-vscode-cp-empty-"))
    execFileSync("git", ["init", "-q"], { cwd: g2 })
    const empty = await gitTool.execute({ action: "checkpoint", checkpointAction: "list" }, { cwd: g2 })
    assert.equal(empty, "(no checkpoints yet)")
    rmSync(g2, { recursive: true, force: true })
  })

  it("T7b F6：commit 成功后 checkpointRoot(cwd) 目录删除（返回附清理行）", async () => {
    const { gitTool } = await import("../src/tools/git.mjs")
    const { execSync } = await import("node:child_process")
    execSync("git init -q", { cwd })
    execSync("git config user.email t@t && git config user.name t", { cwd })
    writeFileSync(join(cwd, "app.js"), "const v = 1\n")
    execSync("git add app.js && git commit -qm init", { cwd })
    await gitTool.execute({ action: "checkpoint", checkpointAction: "create" }, ctx())
    const root = await vsCheckpointRoot(cwd)
    assert.ok(existsSync(root), "快照目录存在")

    writeFileSync(join(cwd, "app.js"), "const v = 2\n")
    const out = await gitTool.execute({ action: "commit", message: "second" }, ctx())
    assert.match(out, /\(checkpoints cleared — commit is a new safety baseline\)/, "返回附清理行")
    assert.ok(!existsSync(root), "checkpointRoot(cwd) 目录已删除")
  })

  it("T7c F5：存量 stash 快照隔离——工具操作只涉及全量副本，stash 不动", async () => {
    const { gitTool } = await import("../src/tools/git.mjs")
    const { execSync } = await import("node:child_process")
    execSync("git init -q", { cwd })
    execSync("git config user.email t@t && git config user.name t", { cwd })
    writeFileSync(join(cwd, "app.js"), "const v = 1\n")
    execSync("git add app.js && git commit -qm init", { cwd })

    // 旧 stash 快照（存量用户数据）
    writeFileSync(join(cwd, "app.js"), "const v = 2 // old stash\n")
    execSync("git stash push -m thincoder-guard-legacy -q", { cwd })
    const stashBefore = execSync("git stash list", { cwd, encoding: "utf8" })
    assert.match(stashBefore, /thincoder-guard-legacy/)

    // 新全量副本快照 + list/rewind —— 只动 checkpoint 目录
    writeFileSync(join(cwd, "app.js"), "const v = 3\n")
    const created = await gitTool.execute({ action: "checkpoint", checkpointAction: "create" }, ctx())
    const id = created.match(/Checkpoint (\S+) created/)[1]
    const listed = await gitTool.execute({ action: "checkpoint", checkpointAction: "list" }, ctx())
    assert.ok(listed.includes(id), "全量副本快照可见")

    const stashAfter = execSync("git stash list", { cwd, encoding: "utf8" })
    assert.equal(stashAfter, stashBefore, "stash 不动（存量隔离，用户可手动 git stash drop）")

    // rewind 从全量副本恢复（不触碰 stash）
    writeFileSync(join(cwd, "app.js"), "const v = 999\n")
    await gitTool.execute({ action: "checkpoint", checkpointAction: "rewind", checkpointId: id, path: "app.js" }, ctx())
    assert.equal(readFileSync(join(cwd, "app.js"), "utf8").replace(/\r\n/g, "\n"), "const v = 3\n")
    const stashFinal = execSync("git stash list", { cwd, encoding: "utf8" })
    assert.equal(stashFinal, stashBefore, "rewind 后 stash 仍不动")
  })

  it("T4b NF1 + T8 F1：schema 描述追加段 ≤60 字符且含自动快照/rewind 字样", async () => {
    const { gitTool } = await import("../src/tools/git.mjs")
    const props = gitTool.parameters.properties
    const appends = [
      "（checkout/restore 操作前自动快照，checkpointAction=rewind 恢复）",
      "（操作前自动快照，checkpointAction=rewind 恢复）",
      "（delete 操作前自动快照，checkpointAction=rewind 恢复）",
      "（pop 操作前自动快照，checkpointAction=rewind 恢复）",
      "（rewind 可恢复操作前状态，恢复前自动快照可逆）",
    ]
    const allDesc = [
      props.path.description, props.mode.description, props.tagAction.description,
      props.branchAction.description, props.stashAction.description,
      props.checkpointAction.description, props.action.description,
      props.rebaseAction.description, props.dryRun.description,
    ]
    for (const a of appends) {
      assert.ok(allDesc.some((d) => d.includes(a)), `schema 描述含追加段: ${a}`)
      assert.ok(a.length <= 60, `增量 ≤60 字符（实际 ${a.length}）: ${a}`)
    }
    for (const d of allDesc) {
      assert.match(d, /自动快照/, "描述含自动快照")
      assert.match(d, /rewind/, "描述含 rewind")
    }
  })

  it("T5b F7：action 集精确（32 个，不含 P2）；两端 action 集一致（CLI parity）", async () => {
    const { gitTool } = await import("../src/tools/git.mjs")
    const enums = gitTool.parameters.properties.action.enum
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
    // 两端 action 集一致（standalone vscode clone 时跳过——CLI 侧跑 T7 跨端测试）
    const cliGit = join(import.meta.dirname, "..", "..", "thincoder", "src", "tools", "git.mjs")
    if (existsSync(cliGit)) {
      const { pathToFileURL } = await import("node:url")
      const cli = await import(pathToFileURL(cliGit).href)
      assert.deepEqual(cli.gitTool.parameters.properties.action.enum, enums, "两端 action 集一致")
    }
  })

  it("T8b F7：新增 11 个 action 可用；clean/rebase 执行前输出 snapshot 行", async () => {
    const { gitTool } = await import("../src/tools/git.mjs")
    const { execSync, execFileSync } = await import("node:child_process")
    const g = (...a) => execFileSync("git", a, { cwd, encoding: "utf8" })
    execSync("git init -q", { cwd })
    execSync("git config user.email t@t && git config user.name t", { cwd })
    writeFileSync(join(cwd, "a.js"), "const v = 1\n")
    execSync("git add a.js && git commit -qm init", { cwd })

    // rebase（快照行）+ remote + clean（快照行/dryRun）+ switch -c
    const reb = await gitTool.execute({ action: "rebase", ref: "HEAD" }, ctx())
    assert.match(reb, /\[snapshot \S+ created before rebase\]/, "rebase 先行快照")
    assert.match(await gitTool.execute({ action: "remote", remoteAction: "add", remote: "origin", remoteUrl: "https://example.com/x.git" }, ctx()), /added/)
    assert.match(await gitTool.execute({ action: "remote" }, ctx()), /origin/)
    writeFileSync(join(cwd, "junk.tmp"), "x\n")
    const clean = await gitTool.execute({ action: "clean" }, ctx())
    assert.match(clean, /\[snapshot \S+ created before clean\]/, "clean 先行快照")
    assert.ok(!existsSync(join(cwd, "junk.tmp")), "untracked 文件被清")
    writeFileSync(join(cwd, "junk2.tmp"), "x\n")
    const dry = await gitTool.execute({ action: "clean", dryRun: true }, ctx())
    assert.ok(existsSync(join(cwd, "junk2.tmp")), "dryRun 不删除")
    assert.ok(!dry.includes("[snapshot"), "dryRun 不产生快照")
    assert.match(await gitTool.execute({ action: "switch", create: true, name: "feat" }, ctx()), /Switched/)
    assert.match(await gitTool.execute({ action: "switch", name: "master" }, ctx()), /Switched/)

    // init（非 git 子目录）+ clone（本地 bare）+ apply + worktree + archive + blame + mv
    const plain = join(cwd, "plain")
    mkdirSync(plain, { recursive: true })
    assert.match(await gitTool.execute({ action: "init" }, { cwd: plain }), /Initialized|Reinitialized/)
    const bare = join(cwd, "bare.git")
    execFileSync("git", ["init", "-q", "--bare", bare], { cwd })
    assert.ok(!/failed/i.test(await gitTool.execute({ action: "clone", remote: bare, path: "cl" }, ctx())))
    writeFileSync(join(cwd, "a.js"), "const v = 2\n")
    await gitTool.execute({ action: "commit", message: "mod", path: "a.js" }, ctx())
    const patch = g("format-patch", "-1", "--stdout")
    writeFileSync(join(cwd, "p.patch"), patch)
    g("reset", "-q", "--hard", "HEAD~1")
    assert.ok(!/failed/i.test(await gitTool.execute({ action: "apply", path: "p.patch" }, ctx())))
    const head = g("rev-parse", "HEAD").trim()
    assert.ok(!/failed/i.test(await gitTool.execute({ action: "worktree", worktreeAction: "add", path: "wt", ref: head }, ctx())))
    assert.match(await gitTool.execute({ action: "worktree" }, ctx()), /wt/)
    assert.ok(!/failed/i.test(await gitTool.execute({ action: "archive", path: "out.tar" }, ctx())))
    assert.ok(existsSync(join(cwd, "out.tar")))
    assert.match(await gitTool.execute({ action: "blame", path: "a.js" }, ctx()), /^[\^]?[0-9a-f]{7,}\s+\(/)
    assert.match(await gitTool.execute({ action: "mv", path: "a.js", dest: "a2.js" }, ctx()), /Moved/)
  })

  it("T6b NF6：创建 101 个快照 → 最旧被淘汰（上限 100，镜像 CLI T6）", async () => {
    const { execFileSync } = await import("node:child_process")
    const { createCheckpoint, listCheckpoints } = await import("../src/tools/checkpoint.mjs")
    const dir = mkdtempSync(join(tmpdir(), "thincoder-vscode-cp-t6-"))
    const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8" })
    try {
      git("init", "-q")
      git("config", "user.name", "t")
      git("config", "user.email", "t@t.dev")
      writeFileSync(join(dir, "a.js"), "const v = 1\n")
      git("add", ".")
      git("commit", "-qm", "init")
      const ids = []
      for (let i = 0; i < 101; i++) {
        const cp = await createCheckpoint(dir)
        ids.push(cp.id)
      }
      const cps = await listCheckpoints(dir)
      assert.equal(cps.length, 100, "总数 100")
      assert.ok(!cps.some((c) => c.id === ids[0]), "最旧的 1 个被删")
      assert.equal(cps[cps.length - 1].id, ids[1], "倒数第二旧的保留（新→旧排列尾部）")
    } finally {
      await cleanupCheckpoints(dir)
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

describe("bash — background process does not hang (CLI parity)", () => {
  beforeEach(setup)
  afterEach(cleanup)

  it("returns after grace when a background child holds the output pipe", async () => {
    const { bashTool } = await import("../src/tools/shell.mjs")
    // 独立目录：后台子进程 cwd 占用，不能动共享 cwd（describe 级 cleanup）
    const bgDir = mkdtempSync(join(tmpdir(), "thincoder-vscode-bg-"))
    try {
      const cmd = process.platform === "win32"
        ? 'start /b node -e "setTimeout(() => process.exit(0), 5000)"'
        : 'node -e "setTimeout(() => process.exit(0), 5000)" &'
      const t0 = Date.now()
      const r = await bashTool.execute({ command: cmd }, { cwd: bgDir })
      const elapsed = Date.now() - t0
      assert.ok(elapsed < 10000, `应在 grace 后返回而非卡到超时，实际 ${elapsed}ms`)
      assert.match(r, /\[background\]/, "提示后台进程持有管道: " + r.slice(0, 120))
    } finally {
      // 后台子进程 cwd 是 bgDir，5 秒自退后才可删除——轮询等待
      for (let i = 0; i < 20; i++) {
        try { rmSync(bgDir, { recursive: true, force: true }); break } catch { await new Promise((r) => setTimeout(r, 500)) }
      }
    }
  })

  it("normal commands still return full output (callback wins the race)", async () => {
    const { bashTool } = await import("../src/tools/shell.mjs")
    const r = await bashTool.execute({ command: "echo hello-from-vscode" }, { cwd })
    assert.ok(r.includes("hello-from-vscode"), "正常命令输出完整: " + r)
    assert.ok(!r.includes("(background)"), "正常命令不触发 background 提示")
  })

  it("bash output does NOT go to the side panel (it belongs in the conversation tool card)", async () => {
    const { bashTool } = await import("../src/tools/shell.mjs")
    let panelCalled = false
    const r = await bashTool.execute({ command: "echo side-panel-check" }, {
      cwd,
      callbacks: { onToolPanel: () => { panelCalled = true } },
    })
    assert.equal(panelCalled, false, "bash must not push output to the side tool panel")
    assert.match(r, /side-panel-check/, "output still returned for the in-conversation tool card")
  })
})
