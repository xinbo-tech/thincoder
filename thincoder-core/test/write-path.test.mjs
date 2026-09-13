/**
 * write-path.test.mjs — 单一写路径点机检（CORE-UNIFICATION §2.13.5 验收 ①②）。
 *
 * 行为面（双夹具——§2.13.5 验收 ①）：
 *   夹具一 = 假注入面（`configureWritePath`）驱动**全部 8 个写点** ⇒ 每个写点都经过注入面
 *            （openDoc 计数 = 写点数 8 + file_ops 的 **dest 面 1** = 9；内容写点 applyEdit
 *            计数 = 6）且落盘 = 交给注入面的字节；
 *   夹具二 = `resetWritePath()`（不注入）⇒ 回默认 fs 径，**产物与夹具一逐字节同**。
 * 结构面（§2.13.5 验收 ②）：8 个写点所在档零直调 `writeFile`；`tools/**` 的 `writeFile` /
 *   `writeFileSync` 调用点只许出现在单一写路径点 `tools/write-path.mjs`（白名单 1 档）。
 *   另有 `checklist-sync.mjs` 一档已登记豁免（见测试内注释——任务书「白名单 1 档」的字面形
 *   在本仓不可满足，理由与口径写在交付报告 / 批次档 §5）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, relative } from "node:path"
import { fileURLToPath } from "node:url"

import { configureWritePath, resetWritePath, isDirty, lastWriteOf, TMP_SUFFIX } from "../tools/write-path.mjs"
import { readTool, writeTool, editTool, insertAfterTool, hashlineEditTool, hashLine } from "../tools/file.mjs"
import { applyPatchTool, deleteTool } from "../tools/patch.mjs"
import { fileOpsTool } from "../tools/ops.mjs"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")

/** 夹具一的假注入面：三个函数（§2.13.5 契约）+ 调用记录。applyEdit = 端侧"应用并落盘"。 */
function fakeInjection() {
  const calls = { openDoc: [], isDirty: [], applyEdit: [] }
  return {
    calls,
    impl: {
      openDoc(abs) { calls.openDoc.push(abs); return { uri: abs, dirty: false } },
      isDirty(doc) { calls.isDirty.push(doc.uri); return doc.dirty === true },
      async applyEdit(doc, content) { calls.applyEdit.push({ abs: doc.uri, content }); writeFileSync(doc.uri, content) },
    },
  }
}

const CTX = (dir) => ({ cwd: dir })

/** 驱动 §2.13.5 的 **8 个写点**（每点一个独立档——避免跨用例的 read-before-insert 护栏耦合）。 */
async function driveAllWritePoints(dir) {
  const ctx = CTX(dir)
  const results = []
  // ① write
  results.push(await writeTool.execute({ path: "w.txt", content: "alpha\nbeta\n" }, ctx))
  // ② insert_after（先 read 满足 read-before-insert 护栏）
  writeFileSync(join(dir, "i.txt"), "one\ntwo\n", "utf8")
  await readTool.execute({ path: "i.txt" }, ctx)
  results.push(await insertAfterTool.execute({ path: "i.txt", after_line: 1, content: "mid" }, ctx))
  // ③ hashline_edit
  const h = "x\ny\nz\n"
  writeFileSync(join(dir, "h.txt"), h, "utf8")
  const hashes = h.slice(0, -1).split("\n").map(hashLine)
  results.push(await hashlineEditTool.execute({ path: "h.txt", old_hashes: [hashes[1]], new_content: "Y" }, ctx))
  // ④ edit（单形态）
  writeFileSync(join(dir, "e.txt"), "k1\nk2\n", "utf8")
  results.push(await editTool.execute({ path: "e.txt", old_string: "k2", new_string: "K2" }, ctx))
  // ⑤ edit（edits 数组形态）
  results.push(await editTool.execute({ edits: [{ path: "e.txt", old_string: "K2", new_string: "K2b" }] }, ctx))
  // ⑥ apply_patch（两段式：staging → commit）
  writeFileSync(join(dir, "p.txt"), "one\n", "utf8")
  results.push(await applyPatchTool.execute({ patch: "--- a/p.txt\n+++ b/p.txt\n@@ -1,1 +1,2 @@\n one\n+two\n" }, ctx))
  // ⑦ delete
  writeFileSync(join(dir, "d.txt"), "bye\n", "utf8")
  results.push(await deleteTool.execute({ path: "d.txt", force: true }, ctx))
  // ⑧ file_ops（move）
  writeFileSync(join(dir, "mv.txt"), "mv\n", "utf8")
  results.push(await fileOpsTool.execute({ action: "move", source: "mv.txt", dest: "mv2.txt" }, ctx))
  return results
}

/** 目录快照（档名 → 字节）——两夹具产物逐字节比对面。 */
function snapshot(dir) {
  const out = {}
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name)
    if (statSync(p).isFile()) out[name] = readFileSync(p, "utf8")
  }
  return out
}

async function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "core-write-path-"))
  try { return await fn(dir) } finally { rmSync(dir, { recursive: true, force: true }) }
}

test("§2.13.5 验收①·夹具一（注入面）：8 个写点全经过注入面——openDoc 计数 = 9（8 写点 + file_ops dest 面）· 内容写点 applyEdit 计数 = 6", async () => {
  await withTempDir(async (dir) => {
    const { impl, calls } = fakeInjection()
    configureWritePath(impl)
    try {
      await driveAllWritePoints(dir)
      // 父侧裁定补丁（file_ops dest 面）：move 的 src 面 + dest 面各问一次 openDoc ⇒ 8 + 1 = 9。
      assert.equal(calls.openDoc.length, 9, `8 个写点 + file_ops dest 面 1 ⇒ openDoc 恰 9 次（实读 ${calls.openDoc.length}）`)
      assert.equal(calls.isDirty.length, 9, "有 doc ⇒ 每面（写点 src + file_ops dest）都过脏缓冲门禁")
      assert.equal(calls.applyEdit.length, 6, "内容写点 6 个 ⇒ applyEdit 6 次（delete / file_ops 无端侧载体）")
      // 落盘 = 交给注入面的字节（编辑器径是真的落了盘）
      assert.equal(readFileSync(join(dir, "w.txt"), "utf8"), "alpha\nbeta\n")
      assert.equal(readFileSync(join(dir, "i.txt"), "utf8"), "one\nmid\ntwo\n")
      assert.equal(readFileSync(join(dir, "h.txt"), "utf8"), "x\nY\nz\n")
      assert.equal(readFileSync(join(dir, "e.txt"), "utf8"), "k1\nK2b\n")
      assert.equal(readFileSync(join(dir, "p.txt"), "utf8"), "one\ntwo\n")
      // delete / file_ops 走门禁后回默认径
      assert.equal(existsSync(join(dir, "d.txt")), false)
      assert.equal(existsSync(join(dir, "mv.txt")), false)
      assert.equal(readFileSync(join(dir, "mv2.txt"), "utf8"), "mv\n")
      // 无暂存档残留（内容写点全部即时提交）
      assert.equal(existsSync(join(dir, "p.txt" + TMP_SUFFIX)), false)
    } finally { resetWritePath() }
  })
})

test("§2.13.5 验收①·夹具二（不注入）：回默认 fs 径，产物与夹具一逐字节同", async () => {
  let injected
  await withTempDir(async (dir) => {
    const { impl } = fakeInjection()
    configureWritePath(impl)
    try { await driveAllWritePoints(dir); injected = snapshot(dir) } finally { resetWritePath() }
  })
  await withTempDir(async (dir) => {
    resetWritePath()
    await driveAllWritePoints(dir)
    assert.deepEqual(snapshot(dir), injected, "两条径的产物必须逐字节同（默认径 = CLI 语义，零行为变）")
    assert.equal(lastWriteOf(join(dir, "w.txt"))?.type, "write")
    assert.equal(isDirty(join(dir, "w.txt")), false, "记账由写路径点落——写后不脏")
  })
})

test("§2.13.5 门禁（dest 面补丁）：move/rename 覆盖「打开且脏」的目标档 ⇒ 拒写；src 未打开不豁免 dest 门", async () => {
  await withTempDir(async (dir) => {
    const src = join(dir, "src.txt"), dst = join(dir, "dst.txt")
    writeFileSync(src, "S\n", "utf8")
    writeFileSync(dst, "D\n", "utf8")
    // src 未打开（openDoc null）；dest 打开且脏 ⇒ dest 门禁独立成立（src 未打开不豁免）。
    configureWritePath({
      openDoc: (abs) => (abs === dst ? { uri: abs, dirty: true } : null),
      isDirty: (doc) => doc.dirty === true,
      applyEdit: async () => { throw new Error("applyEdit must not run") },
    })
    try {
      await assert.rejects(
        () => fileOpsTool.execute({ action: "move", source: "src.txt", dest: "dst.txt" }, CTX(dir)),
        /unsaved changes in the editor/,
      )
      assert.equal(readFileSync(src, "utf8"), "S\n", "拒移 ⇒ 源档不动")
      assert.equal(readFileSync(dst, "utf8"), "D\n", "拒移 ⇒ 目标档磁盘不变（用户缓冲未被吞）")
      // rename 同族（同一补丁路径）——dest 脏 ⇒ 同拒。
      await assert.rejects(
        () => fileOpsTool.execute({ action: "rename", source: "src.txt", dest: "dst.txt" }, CTX(dir)),
        /unsaved changes in the editor/,
      )
      assert.equal(readFileSync(src, "utf8"), "S\n")
      assert.equal(readFileSync(dst, "utf8"), "D\n")
    } finally { resetWritePath() }

    // 对照：dest 未打开（openDoc null）⇒ 门禁放行、默认径照常 move（补丁不误伤正常路径）。
    configureWritePath({ openDoc: () => null, isDirty: () => { throw new Error("isDirty must not run") }, applyEdit: async () => {} })
    try {
      await fileOpsTool.execute({ action: "move", source: "src.txt", dest: "dst2.txt" }, CTX(dir))
      assert.equal(existsSync(src), false, "放行 ⇒ 正常移动")
      assert.equal(readFileSync(join(dir, "dst2.txt"), "utf8"), "S\n")
    } finally { resetWritePath() }
  })
})

test("§2.13.5 门禁：打开且脏 ⇒ 拒写（注入面裁决），磁盘不变", async () => {
  await withTempDir(async (dir) => {
    const abs = join(dir, "dirty.txt")
    writeFileSync(abs, "original\n", "utf8")
    configureWritePath({
      openDoc: () => ({ uri: abs, dirty: true }),
      isDirty: (doc) => doc.dirty === true,
      applyEdit: async () => { throw new Error("applyEdit must not run on a dirty buffer") },
    })
    try {
      await assert.rejects(
        () => writeTool.execute({ path: "dirty.txt", content: "overwritten\n" }, CTX(dir)),
        /unsaved changes in the editor/,
      )
      assert.equal(readFileSync(abs, "utf8"), "original\n", "拒写 ⇒ 磁盘不变")
    } finally { resetWritePath() }
  })
})

test("§2.13.5 契约：applyEdit 返回 null（未处理）⇒ 回退默认 fs 径（防「报成功但无落盘」）", async () => {
  await withTempDir(async (dir) => {
    const abs = join(dir, "unhandled.txt")
    let applyCalls = 0
    configureWritePath({
      openDoc: () => ({ uri: abs, dirty: false }),
      isDirty: () => false,
      applyEdit: async () => { applyCalls++; return null }, // 已打开但本端不接管 ⇒ 回默认径
    })
    try {
      await writeTool.execute({ path: "unhandled.txt", content: "via fs\n" }, CTX(dir))
      assert.equal(applyCalls, 1, "applyEdit 被问过一次（openDoc 命中）")
      assert.equal(readFileSync(abs, "utf8"), "via fs\n", "未处理 ⇒ 默认径真的落了盘")
    } finally { resetWritePath() }
  })
})

test("§2.13.5 契约与门禁：openDoc 未命中 / 撤销注入 ⇒ 回默认径；applyEdit 无 isDirty ⇒ 配置错；脏缓冲拒删", async () => {
  await withTempDir(async (dir) => {
    // ① openDoc 未命中（未打开）⇒ 未处理 ⇒ 默认 fs 径
    let applyCalls = 0
    configureWritePath({
      openDoc: () => null,
      isDirty: () => { throw new Error("isDirty must not run without a doc") },
      applyEdit: async () => { applyCalls++ },
    })
    try {
      await writeTool.execute({ path: "closed.txt", content: "closed\n" }, CTX(dir))
      assert.equal(applyCalls, 0, "未打开 ⇒ 不调 applyEdit")
      assert.equal(readFileSync(join(dir, "closed.txt"), "utf8"), "closed\n")
    } finally { resetWritePath() }

    // ② configureWritePath(null) ⇒ 注入失效（回默认径）
    configureWritePath({ openDoc: () => ({ uri: join(dir, "x1.txt"), dirty: false }), isDirty: () => false, applyEdit: async () => { applyCalls++ } })
    configureWritePath(null)
    await writeTool.execute({ path: "x1.txt", content: "no injection\n" }, CTX(dir))
    assert.equal(applyCalls, 0, "撤销注入 ⇒ 不再走注入面")

    // ③ fail-closed：给了 applyEdit 而漏给 isDirty ⇒ 抛配置错（不静默退化为无护栏编辑器径）
    const target = join(dir, "cfg.txt")
    writeFileSync(target, "keep\n", "utf8")
    configureWritePath({ openDoc: () => ({ uri: target }), applyEdit: async () => { } })
    try {
      await assert.rejects(
        () => writeTool.execute({ path: "cfg.txt", content: "nope\n" }, CTX(dir)),
        /without isDirty/,
      )
      assert.equal(readFileSync(target, "utf8"), "keep\n")
    } finally { resetWritePath() }

    // ④ 脏缓冲门禁对非内容写点同样生效（delete / file_ops）
    const dAbs = join(dir, "d2.txt"), mAbs = join(dir, "m2.txt")
    writeFileSync(dAbs, "d\n", "utf8")
    writeFileSync(mAbs, "m\n", "utf8")
    configureWritePath({ openDoc: (abs) => ({ uri: abs, dirty: true }), isDirty: (doc) => doc.dirty === true, applyEdit: async () => {} })
    try {
      await assert.rejects(() => deleteTool.execute({ path: "d2.txt", force: true }, CTX(dir)), /unsaved changes in the editor/)
      await assert.rejects(() => fileOpsTool.execute({ action: "move", source: "m2.txt", dest: "m3.txt" }, CTX(dir)), /unsaved changes in the editor/)
      assert.equal(existsSync(dAbs), true, "拒删 ⇒ 档仍在")
      assert.equal(existsSync(join(dir, "m3.txt")), false, "拒移 ⇒ 目标未生成")
    } finally { resetWritePath() }
  })
})

test("§2.13.5 验收②·结构机检：8 个写点所在档零直调 writeFile；tools/** 白名单外只许 1 档已登记豁免", () => {
  // 白名单 1 档（§2.13.5）。**已登记豁免 1 档**：`checklist-sync.mjs` 是 checklist 状态档
  // （.thincoder/checklist.md）的**同步**写机（writeFileSync + mtime 门控 + ID 合并），既非
  // §2.13.5 的 8 个模型面文件编辑写点、也无异步缝可接（改它要把 flushWrite 整链改异步 =
  // 越设计清单）。故登记豁免而非静默放过：命中集合必须**逐档等于**本表（新增命中 / 豁免
  // 消失 ⇒ 红），由设计面裁定是否收编（已在交付报告「未决 / 越段发现」登记）。
  const WHITELIST = new Set(["tools/write-path.mjs"])
  const EXEMPT = new Map([
    ["tools/checklist-sync.mjs",
      "checklist 状态档同步机（.thincoder/checklist.md 的 mtime 门控 + ID 合并）——非模型面文件编辑写点，§2.13.5 的 8 点清单未含"],
  ])
  const strip = (src) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1")
  // 检测面 = 核内可能落盘的写 API（不只 writeFile——别名导入 / appendFile 等同样不许绕过缝）
  const WRITE_CALL = /\b(?:writeFile|writeFileSync|appendFile|appendFileSync|createWriteStream|writeSync)\s*\(/
  const hits = []
  const walk = (d) => {
    for (const n of readdirSync(d)) {
      const p = join(d, n)
      if (statSync(p).isDirectory()) walk(p)
      else if (n.endsWith(".mjs")) {
        const rel = relative(ROOT, p).replace(/\\/g, "/")
        if (WHITELIST.has(rel)) continue
        if (WRITE_CALL.test(strip(readFileSync(p, "utf8")))) hits.push(rel)
      }
    }
  }
  walk(join(ROOT, "tools"))
  assert.deepEqual(
    hits.sort(), [...EXEMPT.keys()].sort(),
    `tools/ 内写 API 调用点只许在 ${[...WHITELIST].join(", ")}（+ 豁免 ${[...EXEMPT.keys()].join(", ")}）；命中：${hits.join(", ")}`,
  )
  // 8 个写点所在档 = 白名单外零命中（**不带豁免**——§2.13.5 验收② 的本体）
  const WRITE_POINT_FILES = ["tools/file.mjs", "tools/edit-diff.mjs", "tools/edit-batch.mjs", "tools/patch.mjs", "tools/ops.mjs"]
  const stragglers = WRITE_POINT_FILES.filter((rel) => WRITE_CALL.test(strip(readFileSync(join(ROOT, rel), "utf8"))))
  assert.deepEqual(stragglers, [], `8 个写点所在档仍有直调 fs 写：${stragglers.join(", ")}`)
  assert.ok(/\bwriteFile\s*\(/.test(readFileSync(join(ROOT, "tools/write-path.mjs"), "utf8")),
    "默认径的 writeFile 必须住 write-path.mjs")
})
