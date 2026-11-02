/*
 * edit-line-anchor.test.mjs — 集成用例 28-1（RTM CLI 端故事 28「拿行号改文档不会静默改错行」）。
 *
 * 回指 = 设计档 §7（行号锚护栏，判据单源）+ 批档 `docs/batches/2026-11-02-edit-line-anchor-guard.md` §2。
 * 业务入口 = 模型面 `edit` 工具（工具体 `thincoder-core/tools/file.mjs`，走装配给它的工具 ctx——
 * 不直调内部区间函数）。它答的业务问题：**同一会话内前一笔记账之后，再拿旧行号改同一段，
 * 会不会静默改到隔壁几行、回执还写成一次成功**（改前 = 会；本用例断言那条旧行为已退场）。
 *
 * 用例只有一条（失败面）：放行半边由批档单测覆盖（批档 §2「U3 · 为什么不加第二行」）。
 *
 * 复跑（cwd = 仓根）：`node --test test/integration/edit-line-anchor.test.mjs`
 */
import { test, after } from "node:test"
import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { editTool } from "../../thincoder-core/tools/file.mjs"

const projects = []
after(() => {
  for (const p of projects) rmSync(p, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 })
})

const sha = (abs) => createHash("sha256").update(readFileSync(abs)).digest("hex")

/** 会话夹具：一个工作区 + 一份 12 行文档 + 装配面同形的工具 ctx（`cwd` 决定相对路径）。 */
function fixture(tag) {
  const root = mkdtempSync(join(tmpdir(), `ela-${tag}-`))
  projects.push(root)
  const abs = join(root, "doc.md")
  writeFileSync(abs, Array.from({ length: 12 }, (_, i) => `line ${i + 1}`).join("\n") + "\n")
  return { root, abs, ctx: { cwd: root } }
}

test("28-1 同一会话内先一笔 edit 改到第 3 行附近，再拿旧行号改第 6-7 行 ⇒ 当场拒、文件字节零改", async () => {
  const { abs, ctx } = fixture("guard")
  const rel = "doc.md"

  // 第一笔：第 3 行换成两行（快照 = 上次写入 L3、净漂移 +1）
  const first = await editTool.execute({ path: rel, line: 3, new_string: "line 3a\nline 3b" }, ctx)
  assert.match(first, /^Edited doc\.md: replaced 1 occurrence\(s\)/, "第一笔正常成功")
  const beforeHash = sha(abs)

  // 第二笔：仍是模型 read 时的那套行号（第 6-7 行，落在受影响区内）
  await assert.rejects(
    () => editTool.execute({ path: rel, startLine: 6, endLine: 7, new_string: "rewritten" }, ctx),
    (err) => {
      const m = err.message
      assert.ok(m.includes(abs) || m.includes(rel), "拒文点名路径")
      assert.match(m, /was at L3/, "拒文点名上次写入行")
      assert.match(m, /offset by \+1/, "拒文点名漂移量")
      assert.match(m, /read this file again and retry with the new line numbers/, "下一步一：重 read")
      assert.match(m, /old_string|hashline_edit/, "下一步二：位置无关寻址")
      assert.ok(!/^Edited /m.test(m), "拒面上不出现 Edited … 成功句")
      return true
    }
  )

  assert.equal(sha(abs), beforeHash, "文件字节零改（改前后内容哈希相同）")
})
