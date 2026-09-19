/**
 * portability-index.test.mjs — PORTABILITY 批（FR10–FR15 · CLI 面）面② 索引
 * 用例表 T-13–T-17（PO-8 · PO-9）。
 *
 * 断言对象 = @thincoder/core/memory/file-walk.mjs（walk 回退）+ code-sync/docs 接线
 * （{entries, unlisted} / indexExtensions / unlistedExts）+ cmd-reindex 提示行。
 * 全离线：临时目录 + :memory: 库（不跑 git 索引真实仓库）。
 * 归册（2026-09-12 收尾轮 9）：T-13/T-14/T-16 为真 fs 索引构建（临时项目全遍历）——
 * slow() 门控（快层 skip、test:full 照跑）。
 */
import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { slow } from "./slow.mjs"

import { walkProjectFiles, isSkippedRelPath, MAX_WALK_FILES } from "@thincoder/core/memory/file-walk.mjs"
import { listProjectFiles, indexExtensions, codeSync } from "@thincoder/core/memory/code-sync.mjs"
import { docSync } from "@thincoder/core/memory/docs.mjs"
import { CODE_EXTS, DOC_EXTS } from "@thincoder/core/memory/schema.mjs"
import { detectLanguage } from "@thincoder/core/memory/code-index.mjs"
import { handleReindexCommand } from "../src/tui/cmd-reindex.mjs"
import { createMemory } from "@thincoder/core/memory.mjs"
import { clearConventionsCache } from "@thincoder/core/conventions.mjs"

let tmp
beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), "portability-idx-"))
  clearConventionsCache()
})
/** Windows：句柄释放滞后 → rmSync 偶发 EPERM——短重试兜底（eng-designer-role 同款手法）。 */
async function rmTmp(dir) {
  for (let i = 0; ; i++) {
    try { rmSync(dir, { recursive: true, force: true }); return } catch { if (i >= 10) return; await new Promise((r) => setTimeout(r, 100)) }
  }
}
afterEach(async () => {
  clearConventionsCache()
  await rmTmp(tmp)
})

const w = (rel, text = "x\n") => {
  const abs = join(tmp, rel)
  mkdirSync(join(abs, ".."), { recursive: true })
  writeFileSync(abs, text)
  return abs
}
const declare = (payload) => {
  mkdirSync(join(tmp, ".thincoder"), { recursive: true })
  writeFileSync(join(tmp, ".thincoder", "conventions.json"), JSON.stringify(payload))
  clearConventionsCache()
}

slow("T-13 正常（非 git）：列表面覆盖 a.mjs/b.md；索引非空（原为全空）", async () => {
  w("a.mjs", "export const a = 1\n")
  w("b.md", "# doc\n")
  const mem = createMemory({ dbPath: ":memory:" })
  const { entries } = await listProjectFiles(tmp, new Set([...indexExtensions(tmp).code, ...indexExtensions(tmp).doc]))
  assert.deepEqual(entries.map((e) => e.rel).sort(), ["a.mjs", "b.md"], "非 git 走 walk：两文件都在列出面")
  const cr = await codeSync(mem, tmp)
  assert.equal(cr.total, 1, "代码面收录 a.mjs")
  assert.equal(mem.db.prepare("SELECT COUNT(*) n FROM code_chunks").get().n > 0, true, "非 git 项目索引非空（原为全空）")
})

slow("T-14 边界（walk）：node_modules/.hidden 跳过；超限截断标记；上限常量在册", async () => {
  w("ok.mjs")
  w("node_modules/junk.mjs")
  w(".hidden/h.mjs")
  w(".git/config")
  const walked = await walkProjectFiles(tmp, new Set([".mjs"]))
  assert.deepEqual(walked.files.map((f) => f.rel), ["ok.mjs"], "跳过规则：node_modules / 点目录")
  assert.equal(walked.truncated, false)
  const capped = await walkProjectFiles(tmp, new Set([".mjs"]), { maxFiles: 0 })
  assert.equal(capped.truncated, true, "超限即停 + 截断标记")
  assert.equal(MAX_WALK_FILES, 20000, "上限护栏常量（文档口径）")
  // 截断标记不丢层（评审 🔵 修正）：listProjectFiles 传播 + 日志事件
  const lp = await listProjectFiles(tmp, new Set([".mjs"]), { maxFiles: 0 })
  assert.equal(lp.truncated, true, "非 git 列表把截断标记传回调用方")
  assert.deepEqual(lp.entries, [], "超限即停（无条目）")
  // 跳过谓词与 git 路径同源（同一函数）
  assert.equal(isSkippedRelPath("node_modules/a/b.mjs"), true)
  assert.equal(isSkippedRelPath(".thincoder/conventions.json"), true)
  assert.equal(isSkippedRelPath("src\\a.mjs"), false)
})

test("T-15 正常（扩展名）：.dart/.lua/.cs/.org 默认可索引 + 语言标签", async () => {
  for (const ext of [".dart", ".lua", ".cs", ".clj", ".zig", ".tf", ".proto"]) assert.ok(CODE_EXTS.has(ext), `代码扩展名缺 ${ext}`)
  for (const ext of [".org", ".wiki", ".tex", ".mdx"]) assert.ok(DOC_EXTS.has(ext), `文档扩展名缺 ${ext}`)
  for (const [f, lang] of [["a.dart", "dart"], ["a.lua", "lua"], ["a.cs", "csharp"], ["a.tf", "terraform"]]) {
    assert.equal(detectLanguage(f), lang, `语言标签（${f}）`)
  }
  // 声明面（indexExtensions）→ 默认表对新扩展名生效（端到端索引由 T-13/T-16 承载）
  const { code, doc } = indexExtensions(tmp)
  for (const ext of [".dart", ".lua", ".cs"]) assert.ok(code.has(ext), `声明面缺代码扩展名 ${ext}`)
  for (const ext of [".org", ".wiki"]) assert.ok(doc.has(ext), `声明面缺文档扩展名 ${ext}`)
})

slow("T-16 边界（声明）：index.codeExtensions 声明后 .xyz 入索引；未列入 → unlistedExts 计数", async () => {
  w("a.xyz", "payload\n")
  w("b.mjs")
  const listed = await listProjectFiles(tmp, indexExtensions(tmp).code)
  assert.deepEqual(listed.entries.map((e) => e.rel), ["b.mjs"], "未声明时 .xyz 不进索引")
  assert.equal(listed.unlisted.count, 1, "unlisted 计数可见")
  assert.deepEqual(listed.unlisted.exts, [{ ext: ".xyz", count: 1 }], "unlisted 样本含扩展名")
  declare({ index: { codeExtensions: [".xyz"] } })
  const mem2 = createMemory({ dbPath: ":memory:" })
  const cr2 = await codeSync(mem2, tmp)
  assert.equal(cr2.total, 2, "声明后 .xyz 入索引（并集）")
  assert.equal(cr2.unlistedExts.count, 0, "声明后不再计入 unlisted")
  assert.equal(mem2.db.prepare("SELECT COUNT(*) n FROM code_chunks WHERE path LIKE '%.xyz'").get().n > 0, true, "声明扩展名的文件已索引")
})

/** 慢例（test/slow.mjs ≡ test）：/reindex = code+doc 两次全量重建（真实 fs + git 子进程），
 *  slow ≡ test 后无快层 skip——慢就慢，全量跑。 */
slow("T-17 正常（文案）：/reindex 在存在 unlisted 时打印声明指路提示行", async () => {
  w("a.xyz")
  const mem = createMemory({ dbPath: ":memory:" })
  const lines = []
  await handleReindexCommand({
    agent: { memory: mem, cwd: tmp },
    distillOpts: {},
    pushLine: (t) => lines.push(String(t)),
  })
  const hint = lines.find((l) => l.includes("unlisted extension"))
  assert.ok(hint, "提示行在场")
  assert.match(hint, /\.thincoder\/conventions\.json/, "声明指路在位")
  assert.match(hint, /index\.codeExtensions \/ index\.docExtensions/, "声明的键名在案")
  // 对照（反证非空转）：去掉 unlisted 文件后信号归零（提示行的判据字段）
  rmSync(join(tmp, "a.xyz"))
  const cr = await codeSync(createMemory({ dbPath: ":memory:" }), tmp)
  assert.equal(cr.unlistedExts.count, 0, "无未列入扩展名 → 计数归零（提示行不触发）")
})
