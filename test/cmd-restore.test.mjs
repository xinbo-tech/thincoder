/**
 * cmd-restore.test.mjs — /restore command: two-level picker (snapshot → file) + edge cases.
 * 真实 git 仓库（checkpoint/rewind 走真实现），故按 slow 分层。
 */
import { test } from "node:test"
import { slow } from "./slow.mjs"
import assert from "node:assert/strict"
import { existsSync, mkdtempSync, rmSync, writeFileSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { execFileSync } from "node:child_process"

import { handleRestoreCommand } from "../src/tui/cmd-restore.mjs"

/** ctx mock：showPicker 按 (title, entries) 回调驱动；pushLine/pushLabel 都记进 calls。 */
function makeCtx(cwd, onPicker) {
  const calls = []
  const ctx = {
    agent: { cwd },
    pushLine: (t) => calls.push(t),
    pushLabel: (t) => calls.push(t),
    showPicker: async (title, entries) => (onPicker ? onPicker(title, entries, calls) : null),
  }
  return { ctx, calls }
}

function initRepo(dir) {
  const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8" })
  git("init", "-q")
  git("config", "user.name", "t")
  git("config", "user.email", "t@t.dev")
  return git
}

/** cwdHash12 契约（与 src/git/checkpoint.mjs 相同）：sha1(normalizeCwd(cwd)).slice(0,12) */
async function cpRoot(cwd) {
  const { createHash } = await import("node:crypto")
  const { configDir } = await import("../src/config.mjs")
  const norm = cwd.replace(/^([a-z]):/, (_, d) => d.toUpperCase() + ":")
  return join(configDir, "checkpoints", createHash("sha1").update(norm).digest("hex").slice(0, 12))
}

/** 测试自清理（tools.test.mjs 同款）：删除该 cwd 的快照目录——测试 repo 是唯一 mkdtemp 目录，hash 不与他人冲突 */
async function cleanupCheckpoints(cwd) {
  const { rm } = await import("node:fs/promises")
  await rm(await cpRoot(cwd), { recursive: true, force: true })
}

slow("/restore: 选快照 → 选文件 → rewind 成功（摘要 v2 字段 + untracked 显示为数字）", async () => {
  const { createCheckpoint } = await import("../src/git/checkpoint.mjs")
  const dir = mkdtempSync(join(tmpdir(), "thincoder-restore-"))
  try {
    const git = initRepo(dir)
    writeFileSync(join(dir, "app.js"), "const v = 1\n")
    git("add", ".")
    git("commit", "-qm", "init")
    // 快照时状态：app.js 已改坏 + note.md 未跟踪
    writeFileSync(join(dir, "app.js"), "const v = 999 // 改坏了\n")
    writeFileSync(join(dir, "note.md"), "原始笔记\n")
    const cp = await createCheckpoint(dir)
    assert.ok(cp?.id)
    // 快照之后继续破坏 → rewind 应恢复到快照时状态
    writeFileSync(join(dir, "app.js"), "const v = 42 // 快照后又被改\n")

    let snapshotEntries, fileEntries
    const pickerCalls = []
    const { ctx, calls } = makeCtx(dir, (title, entries) => {
      if (title === "Restore Checkpoint") {
        snapshotEntries = entries
        pickerCalls.push("snapshot")
        return entries.find((e) => e.type === "item") // 唯一快照
      }
      if (title === "Restore File") {
        fileEntries = entries
        pickerCalls.push("file")
        return entries.find((e) => e.type === "item" && e.id === "app.js")
      }
      return null
    })
    await handleRestoreCommand(ctx)

    // 一级 picker：untracked 显示为数组长度；顶部标注全量恢复已禁用
    assert.match(snapshotEntries[0].text, /全量恢复已禁用，逐文件恢复/, `header: ${snapshotEntries[0].text}`)
    assert.match(snapshotEntries[1].text, /\+1 untracked files/, `untracked 是数字: ${snapshotEntries[1].text}`)
    // 二级 picker：tracked + untracked 合并列表
    const ids = fileEntries.filter((e) => e.type === "item").map((e) => e.id)
    assert.deepEqual(ids, ["app.js", "note.md"], "合并列表含 tracked 与 untracked")
    // 摘要行用 v2 返回字段 { path, type, restored }
    assert.ok(calls.includes("❯ Rewind"), "pushLabel")
    assert.ok(calls.includes("Restored tracked: app.js"), `摘要行: ${calls}`)
    assert.ok(calls.some((c) => c.includes("current state saved as new checkpoint")), "可逆提示保留")
    assert.deepEqual(pickerCalls, ["snapshot", "file"], "两级 picker 流程")
    // 文件恢复到快照时状态（v2 语义），未跟踪文件不受影响
    assert.equal(readFileSync(join(dir, "app.js"), "utf8"), "const v = 999 // 改坏了\n")
    assert.equal(readFileSync(join(dir, "note.md"), "utf8"), "原始笔记\n", "未跟踪文件不受影响")
  } finally {
    await cleanupCheckpoints(dir)
    rmSync(dir, { recursive: true, force: true })
  }
})

slow("/restore: 空快照提示无法逐文件恢复，不再弹二级 picker", async () => {
  const { createCheckpoint } = await import("../src/git/checkpoint.mjs")
  const dir = mkdtempSync(join(tmpdir(), "thincoder-restore-empty-"))
  try {
    const git = initRepo(dir)
    writeFileSync(join(dir, "a.txt"), "x\n")
    git("add", ".")
    git("commit", "-qm", "init")
    // 干净树 → 空快照（tracked/untracked 均为空数组）
    const cp = await createCheckpoint(dir)
    assert.equal(cp.tracked.length + cp.untracked.length, 0, "空快照前置条件")

    let level2Shown = false
    const { ctx, calls } = makeCtx(dir, (title, entries) => {
      if (title === "Restore Checkpoint") return entries.find((e) => e.type === "item")
      level2Shown = true
      return null
    })
    await handleRestoreCommand(ctx)
    assert.ok(calls.includes("该快照无文件，无法逐文件恢复"), `提示: ${calls}`)
    assert.equal(level2Shown, false, "空快照不弹二级 picker")
    assert.ok(!calls.includes("❯ Rewind"), "未执行 rewind")
  } finally {
    await cleanupCheckpoints(dir)
    rmSync(dir, { recursive: true, force: true })
  }
})

test("/restore: 非 git 目录提示不可用（既有行为保持）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-restore-nongit-"))
  let pickerCalled = false
  try {
    const { ctx, calls } = makeCtx(dir, () => { pickerCalled = true; return null })
    await handleRestoreCommand(ctx)
    assert.ok(calls.includes("[rewind] not a git repository, checkpoints unavailable"), `提示: ${calls}`)
    assert.equal(pickerCalled, false, "不弹 picker")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("/restore: 无快照提示（既有行为保持）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-restore-nocp-"))
  try {
    const git = initRepo(dir)
    writeFileSync(join(dir, "a.txt"), "x\n")
    git("add", ".")
    git("commit", "-qm", "init")
    const { ctx, calls } = makeCtx(dir, () => null)
    await handleRestoreCommand(ctx)
    assert.ok(calls.includes("(no checkpoints — created automatically before each task)"), `提示: ${calls}`)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

slow("/restore: F6 懒兜底——外部 git commit 后不再列出过期快照", async () => {
  const { createCheckpoint } = await import("../src/git/checkpoint.mjs")
  const dir = mkdtempSync(join(tmpdir(), "thincoder-restore-f6-"))
  let pickerCalled = false
  try {
    const git = initRepo(dir)
    writeFileSync(join(dir, "a.txt"), "x\n")
    git("add", ".")
    git("commit", "-qm", "init")
    await createCheckpoint(dir)

    // 外部 commit（绕过 git 工具，tools.test.mjs T3 同款）：HEAD 时间 > 最新快照 →
    // /restore 的列表触发懒清空（lazyClearIfCommitted），不再列出 commit 前过期快照
    writeFileSync(join(dir, "b.txt"), "y\n")
    await new Promise((r) => setTimeout(r, 1100)) // %ct 是 epoch 秒——确保 HEAD_ms > 快照 ms
    git("add", ".")
    git("commit", "-qm", "external")

    const { ctx, calls } = makeCtx(dir, () => { pickerCalled = true; return null })
    await handleRestoreCommand(ctx)
    assert.ok(calls.includes("(no checkpoints — created automatically before each task)"), `提示: ${calls}`)
    assert.equal(pickerCalled, false, "过期快照已清空，不弹 picker")
    assert.ok(!existsSync(await cpRoot(dir)), "快照目录已删除")
  } finally {
    await cleanupCheckpoints(dir)
    rmSync(dir, { recursive: true, force: true })
  }
})

slow("/restore: 一级 picker 取消（Esc）直接返回，不执行任何操作", async () => {
  const { createCheckpoint } = await import("../src/git/checkpoint.mjs")
  const dir = mkdtempSync(join(tmpdir(), "thincoder-restore-esc1-"))
  try {
    const git = initRepo(dir)
    writeFileSync(join(dir, "app.js"), "const v = 1\n")
    git("add", ".")
    git("commit", "-qm", "init")
    writeFileSync(join(dir, "app.js"), "const v = 999 // 改坏了\n")
    await createCheckpoint(dir)

    let level2Shown = false
    const { ctx, calls } = makeCtx(dir, (title) => {
      if (title === "Restore Checkpoint") return null // Esc
      level2Shown = true
      return null
    })
    await handleRestoreCommand(ctx)
    assert.equal(level2Shown, false)
    assert.ok(!calls.includes("❯ Rewind"), "未执行 rewind")
    assert.equal(readFileSync(join(dir, "app.js"), "utf8"), "const v = 999 // 改坏了\n", "工作树未动")
  } finally {
    await cleanupCheckpoints(dir)
    rmSync(dir, { recursive: true, force: true })
  }
})

slow("/restore: 二级 picker 取消（Esc）直接返回，不执行 rewind", async () => {
  const { createCheckpoint } = await import("../src/git/checkpoint.mjs")
  const dir = mkdtempSync(join(tmpdir(), "thincoder-restore-esc2-"))
  try {
    const git = initRepo(dir)
    writeFileSync(join(dir, "app.js"), "const v = 1\n")
    git("add", ".")
    git("commit", "-qm", "init")
    writeFileSync(join(dir, "app.js"), "const v = 999 // 改坏了\n")
    await createCheckpoint(dir)

    const { ctx, calls } = makeCtx(dir, (title, entries) => {
      if (title === "Restore Checkpoint") return entries.find((e) => e.type === "item") // 真实快照
      return null // 二级 Esc
    })
    await handleRestoreCommand(ctx)
    assert.ok(!calls.includes("❯ Rewind"), "未执行 rewind")
    assert.equal(readFileSync(join(dir, "app.js"), "utf8"), "const v = 999 // 改坏了\n", "工作树未动")
  } finally {
    await cleanupCheckpoints(dir)
    rmSync(dir, { recursive: true, force: true })
  }
})
