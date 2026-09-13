/**
 * cmd-undo.test.mjs — /undo 命令快照/恢复（CODE-HARDENING-BATCH §2.1，2026-09-08）：
 * 绝对路径 undo 恢复成功（快照与恢复两处 isAbsolute 分支）+ 相对路径无回归。
 * 纯单元：tmp 目录写删 + 注入 showPicker/pushLine——无 git、无网络、无定时器。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { snapshotForUndo, handleUndoCommand } from "../src/tui/cmd-undo.mjs"

/** tmp 基底 + 清理（t.after 等价——finally 用法保持每用例独立）。 */
function tmp() {
  const base = mkdtempSync(join(tmpdir(), "thincoder-undo-"))
  return { base, cleanup: () => rmSync(base, { recursive: true, force: true }) }
}

/** 以 picker 命中 idx 走一次 /undo，收集 pushLine 输出。 */
async function undo(agent, pickIdx) {
  const lines = []
  await handleUndoCommand({ agent, pushLine: (l) => lines.push(l), showPicker: async () => ({ idx: pickIdx }) })
  return lines
}

test("2.1 绝对路径：快照取绝对文件 + 修改后 undo 原位恢复（旧 join 会 ENOENT——假路径）", async () => {
  const { base, cleanup } = tmp()
  try {
    const cwd = join(base, "cwd")
    const outDir = join(base, "out") // 绝对目标在 cwd 之外
    mkdirSync(cwd, { recursive: true })
    mkdirSync(outDir, { recursive: true })
    const abs = join(outDir, "f.txt")
    writeFileSync(abs, "original", "utf8")
    const agent = { cwd }
    snapshotForUndo(agent, "write", { path: abs }, cwd)
    assert.equal(agent._undoStack.length, 1)
    assert.equal(agent._undoStack[0].path, abs, "raw absolute path kept in the stack")
    assert.equal(agent._undoStack[0].backup, "original")
    writeFileSync(abs, "v2-model-wrote", "utf8") // 快照后模型写入
    const lines = await undo(agent, 0)
    assert.ok(lines.some((l) => l.includes("Reverted")), lines.join("|"))
    assert.equal(readFileSync(abs, "utf8"), "original", "absolute-path file restored in place")
  } finally {
    cleanup()
  }
})

test("2.1 绝对路径：新建文件（backup null）undo 删除原位文件", async () => {
  const { base, cleanup } = tmp()
  try {
    const cwd = join(base, "cwd")
    mkdirSync(cwd, { recursive: true })
    const abs = join(base, "created.txt")
    assert.ok(!existsSync(abs))
    const agent = { cwd }
    snapshotForUndo(agent, "write", { path: abs }, cwd)
    assert.equal(agent._undoStack[0].backup, null)
    writeFileSync(abs, "created", "utf8")
    await undo(agent, 0)
    assert.ok(!existsSync(abs), "created file removed by undo (backup was null)")
  } finally {
    cleanup()
  }
})

test("2.1 相对路径回归：join(cwd, path) 快照/恢复不变", async () => {
  const { base, cleanup } = tmp()
  try {
    const cwd = join(base, "cwd")
    mkdirSync(join(cwd, "sub"), { recursive: true })
    const rel = "sub/rel.txt"
    const target = join(cwd, rel)
    writeFileSync(target, "v1", "utf8")
    const agent = { cwd }
    snapshotForUndo(agent, "write", { path: rel }, cwd)
    assert.equal(agent._undoStack[0].backup, "v1")
    writeFileSync(target, "v2", "utf8")
    await undo(agent, 0)
    assert.equal(readFileSync(target, "utf8"), "v1", "relative-path restore unchanged")
  } finally {
    cleanup()
  }
})
