/**
 * checkpoint.test.mjs — tests extracted per AGENT-LOOP.md §18.14 (test files split by domain).
 * Source(s): tools.test.mjs.
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync, readFileSync, mkdirSync, existsSync, readdirSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, relative, dirname } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { slow } from "./slow.mjs"
import { builtinTools } from "../src/tools/index.mjs"


// ---------------------------------------------------------------- checkpoint 快照与回滚


slow("checkpoint: 全量回滚被禁，单文件恢复可用（v2 全量副本）", async () => {
  const { execFileSync } = await import("node:child_process")
  const { createCheckpoint, rewind, listCheckpoints } = await import("../src/git/checkpoint.mjs")
  const { writeFile, readFile: rf, mkdir: mk, rm: del } = await import("node:fs/promises")

  const dir = mkdtempSync(join(tmpdir(), "thincoder-cp-"))
  const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8" })
  try {
    // 初始化仓库：一个已跟踪文件
    git("init", "-q")
    git("config", "user.name", "t")
    git("config", "user.email", "t@t.dev")
    await writeFile(join(dir, "app.js"), "const v = 1\n")
    git("add", ".")
    git("commit", "-qm", "init")

    // 快照（含一个未跟踪文件）
    await writeFile(join(dir, "note.md"), "原始笔记\n")
    const cp = await createCheckpoint(dir)
    assert.ok(cp?.id)

    // 全量回滚被禁（跟 git checkout 一样危险——静默丢弃快照后所有工作）
    await assert.rejects(
      () => rewind(dir, cp.id),
      /Full rewind is disabled/,
    )

    // agent 搞破坏：改跟踪文件、删未跟踪文件、新建垃圾文件
    await writeFile(join(dir, "app.js"), "const v = 999 // 改坏了\n")
    await del(join(dir, "note.md"))
    await mk(join(dir, "src"), { recursive: true })
    await writeFile(join(dir, "src", "junk.js"), "agent 新建的文件\n")

    // 单文件恢复（逐个）
    const s1 = await rewind(dir, cp.id, { path: "app.js" })
    assert.equal(s1.restored, true)
    assert.equal((await rf(join(dir, "app.js"), "utf8")).replace(/\r\n/g, "\n"), "const v = 1\n") // 跟踪文件还原
    const s2 = await rewind(dir, cp.id, { path: "note.md" })
    assert.equal(s2.restored, true)
    assert.equal(await rf(join(dir, "note.md"), "utf8"), "原始笔记\n") // 未跟踪文件还原
    // 快照后新建的文件不动
    assert.equal(await rf(join(dir, "src", "junk.js"), "utf8"), "agent 新建的文件\n")

    const cps2 = await listCheckpoints(dir)
    assert.ok(cps2.length >= 3) // 原始 + 两次恢复前的 pre-restore 快照
  } finally {
    await cleanupCheckpoints(dir)
    rmSync(dir, { recursive: true, force: true })
  }
})



slow("checkpoint: 快照后 commit 再回滚仍然恢复（v2 副本与 HEAD 无关）", async () => {
  const { execFileSync } = await import("node:child_process")
  const { createCheckpoint, rewind } = await import("../src/git/checkpoint.mjs")
  const { writeFile, readFile: rf } = await import("node:fs/promises")

  const dir = mkdtempSync(join(tmpdir(), "thincoder-cp2-"))
  const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8" })
  try {
    git("init", "-q")
    git("config", "user.name", "t")
    git("config", "user.email", "t@t.dev")
    await writeFile(join(dir, "app.js"), "const v = 1\n")
    git("add", ".")
    git("commit", "-qm", "init")

    // 快照（工作区修改 app.js）
    await writeFile(join(dir, "app.js"), "const v = 2 // snapshot state\n")
    const cp = await createCheckpoint(dir)
    assert.ok(cp?.id)

    // 快照后：commit 该修改 + 再改坏（v1 的 patch 基准在此失效）
    git("add", ".")
    git("commit", "-qm", "snapshot state")
    await writeFile(join(dir, "app.js"), "const v = 999 // 改坏了\n")

    // v2 回滚：副本覆盖，与 HEAD 无关（单文件恢复）
    const summary = await rewind(dir, cp.id, { path: "app.js" })
    const restored = (await rf(join(dir, "app.js"), "utf8")).replace(/\r\n/g, "\n")
    assert.equal(restored, "const v = 2 // snapshot state\n", "commit 后回滚仍恢复快照状态")
    assert.equal(summary.restored, true)
  } finally {
    await cleanupCheckpoints(dir)
    rmSync(dir, { recursive: true, force: true })
  }
})



slow("checkpoint: 超大文件跳过副本并提示（skipped 列表）", async () => {
  const { execFileSync } = await import("node:child_process")
  const { createCheckpoint, rewind } = await import("../src/git/checkpoint.mjs")
  const { writeFile } = await import("node:fs/promises")

  const dir = mkdtempSync(join(tmpdir(), "thincoder-cp3-"))
  const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8" })
  try {
    git("init", "-q")
    git("config", "user.name", "t")
    git("config", "user.email", "t@t.dev")
    await writeFile(join(dir, "app.js"), "const v = 1\n")
    git("add", ".")
    git("commit", "-qm", "init")

    // 大文件（>5MB 模拟：直接写 6MB）—— tracked
    await writeFile(join(dir, "big.bin"), Buffer.alloc(6 * 1024 * 1024, 1))
    const cp = await createCheckpoint(dir)
    assert.ok(cp.skipped.includes("big.bin"), "大文件进 skipped 列表: " + cp.skipped.join(","))

    // 改坏大文件后单文件恢复：skipped 文件明确报错（副本不存在，不可恢复）
    await writeFile(join(dir, "big.bin"), Buffer.alloc(6 * 1024 * 1024, 2))
    await assert.rejects(
      () => rewind(dir, cp.id, { path: "big.bin" }),
      /was NOT snapshotted/,
    )
  } finally {
    await cleanupCheckpoints(dir)
    rmSync(dir, { recursive: true, force: true })
  }
})



slow("checkpoint: listFileVersions 区分同一文件的多个历史副本", async () => {
  const { execFileSync } = await import("node:child_process")
  const { createCheckpoint, listFileVersions, restoreFile } = await import("../src/git/checkpoint.mjs")
  const { writeFile, readFile: rf } = await import("node:fs/promises")

  const dir = mkdtempSync(join(tmpdir(), "thincoder-cpv-"))
  const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8" })
  try {
    git("init", "-q")
    git("config", "user.name", "t")
    git("config", "user.email", "t@t.dev")
    await writeFile(join(dir, "app.js"), "const v = 1\n")
    git("add", ".")
    git("commit", "-qm", "init")

    // 三个快照，app.js 三个不同版本 + 一个 untracked 文件
    await writeFile(join(dir, "app.js"), "const v = 2\n")
    await writeFile(join(dir, "note.md"), "v1-note\n")
    const cp1 = await createCheckpoint(dir)

    await writeFile(join(dir, "app.js"), "const v = 3\n")
    await writeFile(join(dir, "note.md"), "v2-note\n")
    const cp2 = await createCheckpoint(dir)

    // 同一内容（v3 不变）再快照一次
    const cp3 = await createCheckpoint(dir)

    // tracked 文件：3 个版本，按时间倒序，sha 可区分，相同内容标注
    const versions = await listFileVersions(dir, "app.js")
    assert.equal(versions.length, 3)
    assert.equal(versions[0].snapshotId, cp3.id, "最新在前")
    assert.equal(versions[1].snapshotId, cp2.id)
    assert.equal(versions[2].snapshotId, cp1.id)
    assert.equal(versions[0].sha, versions[1].sha, "cp3 与 cp2 内容相同")
    assert.notEqual(versions[1].sha, versions[2].sha, "cp2 与 cp1 内容不同")
    assert.equal(versions[0].source, "tracked")
    assert.ok(versions[0].size > 0)

    // untracked 文件：3 个版本（cp3 时 note.md 未变但仍被快照），内容相同可识别
    const noteVersions = await listFileVersions(dir, "note.md")
    assert.equal(noteVersions.length, 3)
    assert.ok(noteVersions.every((v) => v.source === "untracked"))
    assert.equal(noteVersions[0].sha, noteVersions[1].sha, "cp3/cp2 内容相同")
    assert.notEqual(noteVersions[1].sha, noteVersions[2].sha, "cp2/cp1 内容不同")

    // 恢复指定版本：把 app.js 改坏后恢复到 cp1 的版本（v=2）
    await writeFile(join(dir, "app.js"), "const v = 999 // broken\n")
    const r = await restoreFile(dir, "app.js", cp1.id)
    assert.equal(r.restored, true)
    assert.equal((await rf(join(dir, "app.js"), "utf8")).replace(/\r\n/g, "\n"), "const v = 2\n", "恢复到 cp1 版本")

    // 未在快照中的文件 → 空列表
    assert.equal((await listFileVersions(dir, "never-existed.js")).length, 0)
  } finally {
    await cleanupCheckpoints(dir)
    rmSync(dir, { recursive: true, force: true })
  }
})



slow("checkpoint 工具：versions 子命令列出文件历史版本", async () => {
  const { execFileSync } = await import("node:child_process")
  const dir = mkdtempSync(join(tmpdir(), "thincoder-cpver-"))
  const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8" })
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  const ctx = { cwd: dir }
  try {
    git("init", "-q")
    git("config", "user.name", "t")
    git("config", "user.email", "t@t.dev")
    writeFileSync(join(dir, "app.js"), "const v = 1\n")
    git("add", ".")
    git("commit", "-qm", "init")
    writeFileSync(join(dir, "app.js"), "const v = 2\n")
    const created = await byName.git.execute({ action: "checkpoint", checkpointAction: "create" }, ctx)
    const id = created.match(/Checkpoint (\S+) created/)[1]

    const out = await byName.git.execute({ action: "checkpoint", checkpointAction: "versions", path: "app.js" }, ctx)
    assert.ok(out.includes(id), `versions 应包含快照 id: ${out}`)
    assert.ok(out.includes("sha:"), "包含内容 hash")
    assert.match(out, /checkpointAction=rewind checkpointId=/, "提示恢复方式")

    // versions 缺 path 报错
    await assert.rejects(
      () => byName.git.execute({ action: "checkpoint", checkpointAction: "versions" }, ctx),
      /path is required for versions/,
    )
  } finally {
    await cleanupCheckpoints(dir)
    rmSync(dir, { recursive: true, force: true })
  }
})



slow("checkpoint 工具：list / create / rewind 走工具入口", async () => {
  const { execFileSync } = await import("node:child_process")
  const dir = mkdtempSync(join(tmpdir(), "thincoder-cptool-"))
  const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8" })
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  const ctx = { cwd: dir }
  try {
    git("init", "-q")
    git("config", "user.name", "t")
    git("config", "user.email", "t@t.dev")
    writeFileSync(join(dir, "app.js"), "const v = 1\n")
    git("add", ".")
    git("commit", "-qm", "init")

    // create → list 能查到
    const created = await byName.git.execute({ action: "checkpoint", checkpointAction: "create" }, ctx)
    const id = created.match(/Checkpoint (\S+) created/)[1]
    const listed = await byName.git.execute({ action: "checkpoint", checkpointAction: "list" }, ctx)
    assert.ok(listed.includes(id))

    // 改坏 → 单文件 rewind 恢复（path 必填；全量恢复被禁）
    writeFileSync(join(dir, "app.js"), "const v = 999\n")
    await assert.rejects(
      () => byName.git.execute({ action: "checkpoint", checkpointAction: "rewind", checkpointId: id }, ctx),
      /path is required for rewind/,
    )
    await byName.git.execute({ action: "checkpoint", checkpointAction: "rewind", checkpointId: id, path: "app.js" }, ctx)
    assert.equal(readFileSync(join(dir, "app.js"), "utf8").replace(/\r\n/g, "\n"), "const v = 1\n")

    // rewind 缺 id 报错；非 git 仓库报错
    await assert.rejects(() => byName.git.execute({ action: "checkpoint", checkpointAction: "rewind" }, ctx), /checkpointId is required/)
    const plain = mkdtempSync(join(tmpdir(), "thincoder-cptool-plain-"))
    await assert.rejects(() => byName.git.execute({ action: "checkpoint", checkpointAction: "list" }, { cwd: plain }), /Not a git repository/)
    rmSync(plain, { recursive: true, force: true })
  } finally {
    await cleanupCheckpoints(dir)
    rmSync(dir, { recursive: true, force: true })
  }
})



slow("checkpoint 工具：list 的文件名做 XML 转义（防注入模型上下文）", async () => {
  const { execFileSync } = await import("node:child_process")
  const dir = mkdtempSync(join(tmpdir(), "thincoder-cpxml-"))
  const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8" })
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  const ctx = { cwd: dir }
  try {
    git("init", "-q")
    git("config", "user.name", "t")
    git("config", "user.email", "t@t.dev")
    writeFileSync(join(dir, "app.js"), "const v = 1\n")
    git("add", ".")
    git("commit", "-qm", "init")
    // Windows 合法但 XML 敏感的字符 & ' 出现在文件名里（<>"/" Windows 不允许）
    writeFileSync(join(dir, "a&'b'.txt"), "x\n")
    const created = await byName.git.execute({ action: "checkpoint", checkpointAction: "create" }, ctx)
    const id = created.match(/Checkpoint (\S+) created/)[1]


    const overview = await byName.git.execute({ action: "checkpoint", checkpointAction: "list" }, ctx)
    assert.ok(overview.includes("a&amp;&apos;b&apos;.txt"), `overview 应转义文件名: ${overview}`)
    assert.ok(!overview.includes("a&'b'.txt"))

    const tree = await byName.git.execute({ action: "checkpoint", checkpointAction: "list", checkpointId: id }, ctx)
    assert.ok(tree.includes("a&amp;&apos;b&apos;.txt"), `file tree 应转义文件名: ${tree}`)
  } finally {
    await cleanupCheckpoints(dir)
    rmSync(dir, { recursive: true, force: true })
  }
})


// ---------------------------------------------------------------- CHECKPOINT 事故恢复闭环（F1-F7，2026-09-01）

/** cwdHash12 契约（与 src/git/checkpoint.mjs 相同）：sha1(normalizeCwd(cwd)).slice(0,12) */
async function cpRoot(cwd) {
  const { createHash } = await import("node:crypto")
  const { configDir } = await import("../src/config.mjs")
  const norm = cwd.replace(/^([a-z]):/, (_, d) => d.toUpperCase() + ":")
  return join(configDir, "checkpoints", createHash("sha1").update(norm).digest("hex").slice(0, 12))
}

/** 测试自清理：删除该 cwd 的快照目录（测试 repo 是唯一 mkdtemp 目录，hash 不与他人冲突） */
async function cleanupCheckpoints(cwd) {
  const { rm } = await import("node:fs/promises")
  await rm(await cpRoot(cwd), { recursive: true, force: true })
}


slow("T1 F6：commit 成功后清空该项目 checkpoint（返回附清理行）", async () => {
  const { execFileSync } = await import("node:child_process")
  const dir = mkdtempSync(join(tmpdir(), "thincoder-cp-t1-"))
  const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8" })
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  const ctx = { cwd: dir }
  const root = await cpRoot(dir)
  try {
    git("init", "-q")
    git("config", "user.name", "t")
    git("config", "user.email", "t@t.dev")
    git("config", "core.autocrlf", "false")
    writeFileSync(join(dir, "a.js"), "const v = 1\n")
    git("add", ".")
    git("commit", "-qm", "init")

    await byName.git.execute({ action: "checkpoint", checkpointAction: "create" }, ctx)
    assert.ok(existsSync(root), "快照目录存在")

    writeFileSync(join(dir, "a.js"), "const v = 2\n")
    const out = await byName.git.execute({ action: "commit", message: "second" }, ctx)
    assert.match(out, /\(checkpoints cleared — commit is a new safety baseline\)/, "返回附清理行")
    assert.ok(!existsSync(root), "checkpointRoot(cwd) 目录已删除")
  } finally {
    await cleanupCheckpoints(dir)
    rmSync(dir, { recursive: true, force: true })
  }
})



slow("T2 F6/NF7：commit 失败不清空（nothing to commit → commit.ok=false）", async () => {
  const { execFileSync } = await import("node:child_process")
  const dir = mkdtempSync(join(tmpdir(), "thincoder-cp-t2-"))
  const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8" })
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  const ctx = { cwd: dir }
  const root = await cpRoot(dir)
  try {
    git("init", "-q")
    git("config", "user.name", "t")
    git("config", "user.email", "t@t.dev")
    git("config", "core.autocrlf", "false")
    writeFileSync(join(dir, "a.js"), "const v = 1\n")
    git("add", ".")
    git("commit", "-qm", "init")
    await byName.git.execute({ action: "checkpoint", checkpointAction: "create" }, ctx)

    // 无任何改动 → add -A 成功但 commit 失败（nothing to commit）
    const out = await byName.git.execute({ action: "commit", message: "nope" }, ctx)
    assert.match(out, /git commit failed/, "commit 失败如实上报")
    assert.ok(existsSync(root) && readdirSync(root).length >= 1, "快照保留")
  } finally {
    await cleanupCheckpoints(dir)
    rmSync(dir, { recursive: true, force: true })
  }
})



slow("T2b NF7：清理失败不阻断 commit 结果（返回 cleanup skipped，快照保留）", async () => {
  const { execFileSync } = await import("node:child_process")
  const { open, chmod } = await import("node:fs/promises")
  const dir = mkdtempSync(join(tmpdir(), "thincoder-cp-t2b-"))
  const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8" })
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  const ctx = { cwd: dir }
  const root = await cpRoot(dir)
  try {
    git("init", "-q")
    git("config", "user.name", "t")
    git("config", "user.email", "t@t.dev")
    git("config", "core.autocrlf", "false")
    writeFileSync(join(dir, "a.js"), "const v = 1\n")
    git("add", ".")
    git("commit", "-qm", "init")
    await byName.git.execute({ action: "checkpoint", checkpointAction: "create" }, ctx)
    writeFileSync(join(dir, "a.js"), "const v = 2\n")

    // 模拟删除失败：Windows 打开快照内文件句柄不释放；POSIX 把快照目录改为只读（unlink 需目录写权限）
    let fh = null
    if (process.platform === "win32") {
      fh = await open(join(root, readdirSync(root)[0], "meta.json"), "r")
    } else {
      await chmod(root, 0o555)
    }
    try {
      const out = await byName.git.execute({ action: "commit", message: "second" }, ctx)
      assert.match(out, /git commit failed|file changed/, "commit 结果正常返回")
      assert.match(out, /\(checkpoint cleanup skipped: /, "清理失败附 skipped 行")
      assert.ok(!out.includes("checkpoints cleared"), "不谎报清理成功")
      assert.ok(existsSync(root), "快照保留")
    } finally {
      if (fh) await fh.close()
      if (process.platform !== "win32") await chmod(root, 0o755)
    }
  } finally {
    await cleanupCheckpoints(dir)
    rmSync(dir, { recursive: true, force: true })
  }
})

slow("T3 F6 懒兜底：外部 git commit 后 checkpoint list 触发清空（all-or-nothing）", async () => {
  const { execFileSync } = await import("node:child_process")
  const dir = mkdtempSync(join(tmpdir(), "thincoder-cp-t3-"))
  const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8" })
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  const ctx = { cwd: dir }
  const root = await cpRoot(dir)
  try {
    git("init", "-q")
    git("config", "user.name", "t")
    git("config", "user.email", "t@t.dev")
    git("config", "core.autocrlf", "false")
    writeFileSync(join(dir, "a.js"), "const v = 1\n")
    git("add", ".")
    git("commit", "-qm", "init")
    await byName.git.execute({ action: "checkpoint", checkpointAction: "create" }, ctx)

    // 外部 commit（绕过 git 工具）：HEAD 时间比最新快照新 → list 触发清空
    writeFileSync(join(dir, "b.js"), "const v = 2\n")
    await new Promise((r) => setTimeout(r, 1100)) // %ct 是 epoch 秒——确保 HEAD_ms > 快照 ms
    git("add", ".")
    git("commit", "-qm", "external")
    const listed = await byName.git.execute({ action: "checkpoint", checkpointAction: "list" }, ctx)
    assert.equal(listed, "(no checkpoints yet)", "懒检查清空后返回空输出")
    assert.ok(!existsSync(root), "目录已删除")

    // all-or-nothing：外部 commit 后立即手动 create（快照比 HEAD 新）→ 整体跳过不清空
    writeFileSync(join(dir, "c.js"), "const v = 3\n")
    git("add", ".")
    git("commit", "-qm", "external2")
    await byName.git.execute({ action: "checkpoint", checkpointAction: "create" }, ctx) // 快照时间 > HEAD
    const kept = await byName.git.execute({ action: "checkpoint", checkpointAction: "list" }, ctx)
    assert.ok(kept.includes("意外丢弃改动"), "快照比 HEAD 新 → 不清空（安全启发式）")
  } finally {
    await cleanupCheckpoints(dir)
    rmSync(dir, { recursive: true, force: true })
  }
})



slow("T4 F2/NF4：checkpoint list 提示行固定文本且幂等（两次调用各只出现一次）", async () => {
  const { execFileSync } = await import("node:child_process")
  const dir = mkdtempSync(join(tmpdir(), "thincoder-cp-t4-"))
  const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8" })
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  const ctx = { cwd: dir }
  try {
    git("init", "-q")
    git("config", "user.name", "t")
    git("config", "user.email", "t@t.dev")
    writeFileSync(join(dir, "a.js"), "const v = 1\n")
    git("add", ".")
    git("commit", "-qm", "init")
    await byName.git.execute({ action: "checkpoint", checkpointAction: "create" }, ctx)

    const HINT = "(意外丢弃改动？checkpointAction=rewind 可恢复操作前状态)"
    const l1 = await byName.git.execute({ action: "checkpoint", checkpointAction: "list" }, ctx)
    const l2 = await byName.git.execute({ action: "checkpoint", checkpointAction: "list" }, ctx)
    for (const l of [l1, l2]) {
      assert.ok(l.endsWith(HINT), `输出尾部为 D7 定稿文本: ${l.slice(-40)}`)
      assert.equal((l.match(/意外丢弃改动/g) || []).length, 1, "只出现一次（幂等）")
    }
  } finally {
    await cleanupCheckpoints(dir)
    rmSync(dir, { recursive: true, force: true })
  }
})



test("T4b NF1：schema 描述追加段每处 ≤ 60 字符（F1 描述精简）", () => {
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  const props = byName.git.parameters.properties
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
  // 新增破坏性 action（clean/rebase）同样带快照字样
  assert.match(props.action.description, /clean\/rebase 操作前自动快照，checkpointAction=rewind 恢复/)
  assert.match(props.rebaseAction.description, /操作前自动快照，checkpointAction=rewind 恢复/)
  assert.match(props.dryRun.description, /操作前自动快照，checkpointAction=rewind 恢复/)
})



test("T5 F2：checkpoint list 空输出不变（(no checkpoints yet)）", async () => {
  const { execFileSync } = await import("node:child_process")
  const dir = mkdtempSync(join(tmpdir(), "thincoder-cp-t5-"))
  const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8" })
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    git("init", "-q")
    git("config", "user.name", "t")
    git("config", "user.email", "t@t.dev")
    writeFileSync(join(dir, "a.js"), "const v = 1\n")
    git("add", ".")
    git("commit", "-qm", "init")
    const out = await byName.git.execute({ action: "checkpoint", checkpointAction: "list" }, { cwd: dir })
    assert.equal(out, "(no checkpoints yet)")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



slow("T6 NF6：创建 101 个快照 → 最旧被淘汰（上限 100）", async () => {
  const { execFileSync } = await import("node:child_process")
  const { createCheckpoint, listCheckpoints } = await import("../src/git/checkpoint.mjs")
  const dir = mkdtempSync(join(tmpdir(), "thincoder-cp-t6-"))
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



slow("T7 F5 跨端互通：VS Code 镜像建的快照 CLI 直接 list/rewind（同目录同格式）", async () => {
  const { execFileSync } = await import("node:child_process")
  const { dirname } = await import("node:path")
  const { fileURLToPath } = await import("node:url")
  const vscodeCp = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "thincoder-vscode", "src", "tools", "checkpoint.mjs")
  if (!existsSync(vscodeCp)) return // standalone thincoder clone——vscode 端跑自身镜像一致性测试
  const vs = await import((await import("node:url")).pathToFileURL(vscodeCp).href)
  const { createCheckpoint, listCheckpoints, rewind } = await import("../src/git/checkpoint.mjs")
  const dir = mkdtempSync(join(tmpdir(), "thincoder-cp-t7-"))
  const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8" })
  try {
    git("init", "-q")
    git("config", "user.name", "t")
    git("config", "user.email", "t@t.dev")
    git("config", "core.autocrlf", "false")
    writeFileSync(join(dir, "a.js"), "const v = 1\n")
    git("add", ".")
    git("commit", "-qm", "init")

    // VS Code 镜像建快照 → CLI 可见
    writeFileSync(join(dir, "a.js"), "const v = 2\n")
    const vscp = await vs.createCheckpoint(dir)
    const cps = await listCheckpoints(dir)
    assert.equal(cps.length, 1, "CLI 直接可见 VS Code 建的快照")
    assert.equal(cps[0].id, vscp.id, "id 格式一致")

    // CLI rewind 恢复 VS Code 建的快照
    writeFileSync(join(dir, "a.js"), "const v = 999\n")
    const s = await rewind(dir, vscp.id, { path: "a.js" })
    assert.equal(s.restored, true)
    assert.equal(readFileSync(join(dir, "a.js"), "utf8").replace(/\r\n/g, "\n"), "const v = 2\n")

    // 反向：CLI 建 → VS Code 可见
    const clicp = await createCheckpoint(dir)
    const vscps = await vs.listCheckpoints(dir)
    assert.ok(vscps.some((c) => c.id === clicp.id), "CLI 建的快照 VS Code 可见")
  } finally {
    await cleanupCheckpoints(dir)
    rmSync(dir, { recursive: true, force: true })
  }
})



slow("T8b F7：新增 11 个 action 可用；clean/rebase 执行前输出 snapshot 行", async () => {
  const { execFileSync } = await import("node:child_process")
  const dir = mkdtempSync(join(tmpdir(), "thincoder-cp-t8b-"))
  const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8" })
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  const ctx = { cwd: dir }
  try {
    git("init", "-q")
    git("config", "user.name", "t")
    git("config", "user.email", "t@t.dev")
    git("config", "core.autocrlf", "false")
    writeFileSync(join(dir, "a.js"), "const v = 1\n")
    git("add", ".")
    git("commit", "-qm", "init")

    // clone（本地 bare）
    const bare = join(dir, "bare.git")
    execFileSync("git", ["init", "-q", "--bare", bare], { cwd: dir })
    const cl = await byName.git.execute({ action: "clone", remote: bare, path: "cl" }, ctx)
    assert.ok(!/failed/i.test(cl), `clone: ${cl}`)
    assert.ok(existsSync(join(dir, "cl", ".git")), "clone 产物存在")

    // init（非 git 子目录）
    mkdirSync(join(dir, "plain"), { recursive: true })
    const init = await byName.git.execute({ action: "init" }, { cwd: join(dir, "plain") })
    assert.match(init, /Initialized|Reinitialized/, `init: ${init}`)

    // rebase（快照行 + 失败语义）
    const reb = await byName.git.execute({ action: "rebase", ref: "HEAD" }, ctx)
    assert.match(reb, /\[snapshot \S+ created before rebase\]/, "rebase 先行快照")

    // remote add/list/set-url/remove
    const ra = await byName.git.execute({ action: "remote", remoteAction: "add", remote: "origin", remoteUrl: "https://example.com/x.git" }, ctx)
    assert.match(ra, /added/, `remote add: ${ra}`)
    assert.match(await byName.git.execute({ action: "remote" }, ctx), /origin/)
    assert.match(await byName.git.execute({ action: "remote", remoteAction: "set-url", remote: "origin", remoteUrl: "https://example.com/y.git" }, ctx), /URL set/)
    assert.match(await byName.git.execute({ action: "remote", remoteAction: "remove", remote: "origin" }, ctx), /removed/)
    assert.match(await byName.git.execute({ action: "blame", path: "a.js" }, ctx), /^[\^]?[0-9a-f]{7,}\s+\(/, "blame 输出提交哈希（干净文件）")
    // clean（快照行 + 删除）与 dryRun（预览不快照）
    writeFileSync(join(dir, "junk.tmp"), "x\n")
    const clean = await byName.git.execute({ action: "clean" }, ctx)
    assert.match(clean, /\[snapshot \S+ created before clean\]/, "clean 先行快照")
    assert.ok(!existsSync(join(dir, "junk.tmp")), "untracked 文件被清")
    writeFileSync(join(dir, "junk2.tmp"), "x\n")
    const n = readdirSync(await cpRoot(dir)).length
    const dry = await byName.git.execute({ action: "clean", dryRun: true }, ctx)
    assert.match(dry, /Would remove/, `dryRun 预览: ${dry}`)
    assert.equal(readdirSync(await cpRoot(dir)).length, n, "dryRun 不产生快照")
    assert.ok(existsSync(join(dir, "junk2.tmp")), "dryRun 不删除")

    // switch（含 -c）
    assert.match(await byName.git.execute({ action: "switch", create: true, name: "feat" }, ctx), /Switched/)
    assert.match(await byName.git.execute({ action: "switch", name: "master" }, ctx), /Switched/)

    // apply（format-patch 产物：mod commit → reset 回 patch 基准 → 干净应用）
    writeFileSync(join(dir, "a.js"), "const v = 2\n")
    await byName.git.execute({ action: "commit", message: "mod", path: "a.js" }, ctx)
    const patch = git("format-patch", "-1", "--stdout")
    writeFileSync(join(dir, "p.patch"), patch)
    git("reset", "-q", "--hard", "HEAD~1") // 回到 patch 基准（a.js = v1）
    const ap = await byName.git.execute({ action: "apply", path: "p.patch" }, ctx)
    assert.ok(!/failed/i.test(ap), `apply: ${ap}`)
    assert.equal(readFileSync(join(dir, "a.js"), "utf8").replace(/\r\n/g, "\n"), "const v = 2\n", "patch 应用生效")
    // worktree add（commit ref）/list/remove
    const head = git("rev-parse", "HEAD").trim()
    const wa = await byName.git.execute({ action: "worktree", worktreeAction: "add", path: "wt", ref: head }, ctx)
    assert.ok(!/failed/i.test(wa), `worktree add: ${wa}`)
    assert.ok(existsSync(join(dir, "wt", "a.js")), "worktree 检出")
    assert.match(await byName.git.execute({ action: "worktree" }, ctx), /wt/)
    assert.match(await byName.git.execute({ action: "worktree", worktreeAction: "remove", path: "wt" }, ctx), /removed/)

    // archive / mv（blame 在 apply 之前已验——a.js 被 patch 应用后有未提交改动，
    // blame 会显示 Not Committed Yet；blame 干净文件在 remote 段之后执行过）
    const ar = await byName.git.execute({ action: "archive", path: "out.tar" }, ctx)
    assert.ok(!/failed/i.test(ar), `archive: ${ar}`)
    assert.ok(existsSync(join(dir, "out.tar")), "archive 产物存在")
    assert.match(await byName.git.execute({ action: "mv", path: "a.js", dest: "a2.js" }, ctx), /Moved/)
    assert.ok(existsSync(join(dir, "a2.js")), "mv 生效")
  } finally {
    await cleanupCheckpoints(dir)
    rmSync(dir, { recursive: true, force: true })
  }
})



slow("T8c F7：rebase 保护——未提交改动存在时 snapshotBefore 先行，快照可恢复", async () => {
  const { execFileSync } = await import("node:child_process")
  const dir = mkdtempSync(join(tmpdir(), "thincoder-cp-t8c-"))
  const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8" })
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  const ctx = { cwd: dir }
  try {
    git("init", "-q")
    git("config", "user.name", "t")
    git("config", "user.email", "t@t.dev")
    git("config", "core.autocrlf", "false")
    writeFileSync(join(dir, "a.js"), "const v = 1\n")
    git("add", ".")
    git("commit", "-qm", "init")

    // 未提交改动存在时 rebase：裸 rebase 拒绝（belt-and-braces），但快照先行
    writeFileSync(join(dir, "a.js"), "const v = 2 // 未提交改动\n")
    const out = await byName.git.execute({ action: "rebase", ref: "HEAD" }, ctx)
    assert.match(out, /\[snapshot \S+ created before rebase\]/, "rebase 前自动快照")
    assert.match(out, /git rebase failed/, "裸 rebase 拒绝未提交改动")

    // 快照恢复未提交改动（rewind 单文件）
    const id = out.match(/snapshot (\S+) created before rebase/)[1]
    const { rewind } = await import("../src/git/checkpoint.mjs")
    const s = await rewind(dir, id, { path: "a.js" })
    assert.equal(s.restored, true)
    assert.equal(readFileSync(join(dir, "a.js"), "utf8").replace(/\r\n/g, "\n"), "const v = 2 // 未提交改动\n")
  } finally {
    await cleanupCheckpoints(dir)
    rmSync(dir, { recursive: true, force: true })
  }
})



slow("bash 护栏：checkout ./restore/clean -f/链式写法先快照后放行，安全写法不触发", async () => {
  const { execFileSync } = await import("node:child_process")
  const dir = mkdtempSync(join(tmpdir(), "thincoder-guard-"))
  const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8" })
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  const ctx = { cwd: dir }
  try {
    git("init", "-q")
    git("config", "user.name", "t")
    git("config", "user.email", "t@t.dev")
    writeFileSync(join(dir, "app.js"), "const v = 1\n")
    git("add", ".")
    git("commit", "-qm", "init")
    writeFileSync(join(dir, "app.js"), "const v = 2\n") // 未提交改动 → 快照保护对象

    // 这些命令全部放行（不拦截模型 git 操作），但执行前自动快照
    for (const cmd of [
      "git checkout .",
      "git checkout -- app.js",
      "git reset --hard",
      "git restore app.js",
      "git restore .",
      "git clean -fd",
      "echo ok && git checkout .",   // 链式绕过
      "cd . ; git reset --hard HEAD", // 分号链式
    ]) {
      const r = await byName.bash.execute({ command: cmd }, ctx)
      assert.match(r, /\[auto-protection\]/, `${cmd} 应快照后放行: ${r.slice(0, 80)}`)
    }

    // 命令已执行（app.js 被重置回 v1），但从快照可恢复未提交改动
    assert.equal(readFileSync(join(dir, "app.js"), "utf8").replace(/\r\n/g, "\n"), "const v = 1\n")
    const { listCheckpoints, rewind } = await import("../src/git/checkpoint.mjs")
    const cps = await listCheckpoints(dir)
    assert.ok(cps.length >= 1, "应有自动快照")
    // 倒序（最新→最旧）：最旧 = 第一个命令前的快照（app.js 仍为 v2）——单文件恢复
    await rewind(dir, cps[cps.length - 1].id, { path: "app.js" })
    assert.equal(readFileSync(join(dir, "app.js"), "utf8").replace(/\r\n/g, "\n"), "const v = 2\n", "快照恢复未提交改动")

    // 安全写法不误伤：切分支（无路径）、restore --staged、clean -n dry-run —— 不触发快照
    for (const cmd of ["git checkout -b feature-x", "git restore --staged app.js", "git clean -nd"]) {
      const r = await byName.bash.execute({ command: cmd }, ctx)
      assert.ok(!r.includes("[auto-protection]"), `${cmd} 不应触发快照`)
    }
    git("checkout", "-q", "-") // 回到原分支，清理
  } finally {
    await cleanupCheckpoints(dir)
    rmSync(dir, { recursive: true, force: true })
  }
})
