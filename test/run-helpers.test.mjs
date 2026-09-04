/**
 * run-helpers.test.mjs — offloadToolResult 落盘与写时自清理（CLI parity，2026-08-21）。
 * 用例：① >3 天旧文件删除、新文件与子目录保留；② 3 天内边界文件保留；
 *       ③ 目录不存在时清理静默且 offload 照常；④ 落盘行为回归（全量+64K 预览+小结果不落盘）；
 *       ⑤ 64K 边界（65536 不落盘 / 65537 落盘）；⑥ 落盘失败回退截断；
 *       ⑦ §5 D-4.1 预览保头保尾（T-4.1 头尾双端 + T-4.2 16K 头边界 + T-4.4 回退同口径）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync, readFileSync, mkdirSync, existsSync, utimesSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { offloadToolResult, TMP_RETENTION_MS } from "../src/agent/run-helpers.mjs"

test("offloadToolResult: >3 天旧文件删除，新文件与子目录保留", () => {
  const cwd = mkdtempSync(join(tmpdir(), "thincoder-vscode-tmp-"))
  try {
    const tmpDir = join(cwd, ".thincoder", "tmp")
    mkdirSync(tmpDir, { recursive: true })
    const oldFile = join(tmpDir, "tool-old.txt")
    writeFileSync(oldFile, "stale")
    const old = new Date(Date.now() - TMP_RETENTION_MS - 24 * 3600 * 1000) // 4 天前
    utimesSync(oldFile, old, old)
    const freshFile = join(tmpDir, "paste-fresh.png") // 同目录粘贴图片（paste-*）一并按保留期回收
    writeFileSync(freshFile, "png-bytes")
    const subdir = join(tmpDir, "keep-dir")
    mkdirSync(subdir)
    writeFileSync(join(subdir, "nested.txt"), "nested")

    const out = offloadToolResult(cwd, "x".repeat(70_000))
    assert.ok(!existsSync(oldFile), ">3 天旧文件应被删除")
    assert.ok(existsSync(freshFile), "刚写入的新文件应保留")
    assert.ok(existsSync(join(subdir, "nested.txt")), "子目录不动")
    // 回归：offload 本身行为不变（磁盘全量 + 64K 预览 + 路径指引）
    const m = out.match(/\[Large output saved\. Read the full result with the read tool: (.+)\]/)
    assert.ok(m, "应包含落盘路径")
    assert.equal(readFileSync(m[1], "utf8").length, 70_000)
    assert.ok(out.length > 20_000, "preview 放大到 64K（原 2K 限制已破）")
    assert.ok(out.length <= 64 * 1024 + 500, "preview 上限 64K + 路径开销")
    // 回归：小结果不落盘、不触发清理
    assert.equal(offloadToolResult(cwd, "short"), "short")
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("offloadToolResult: 3 天内的边界文件保留", () => {
  const cwd = mkdtempSync(join(tmpdir(), "thincoder-vscode-tmp-"))
  try {
    const tmpDir = join(cwd, ".thincoder", "tmp")
    mkdirSync(tmpDir, { recursive: true })
    const boundary = join(tmpDir, "boundary.txt")
    writeFileSync(boundary, "keep me")
    const t = new Date(Date.now() - (TMP_RETENTION_MS - 3600 * 1000)) // 2 天 23 小时前，3 天内
    utimesSync(boundary, t, t)
    offloadToolResult(cwd, "y".repeat(70_000))
    assert.ok(existsSync(boundary), "mtime 在 3 天内的文件应保留")
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("offloadToolResult: 目录不存在时清理静默，offload 正常落盘", () => {
  const cwd = mkdtempSync(join(tmpdir(), "thincoder-vscode-tmp-"))
  try {
    const out = offloadToolResult(cwd, "z".repeat(70_000)) // cwd 下无 .thincoder/tmp
    assert.match(out, /\[Large output saved\./, "目录不存在不抛异常，offload 正常返回落盘结果")
    const m = out.match(/\[Large output saved\. Read the full result with the read tool: (.+)\]/)
    assert.equal(readFileSync(m[1], "utf8").length, 70_000)
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("offloadToolResult: 64K 边界 — 65536 不落盘原样返回，65537 落盘（AC1/AC2）", () => {
  const cwd = mkdtempSync(join(tmpdir(), "thincoder-vscode-tmp-"))
  try {
    // 恰好 64K：不落盘，返回原文（=== 输入）
    const at = "x".repeat(64 * 1024)
    assert.equal(offloadToolResult(cwd, at), at, "65536 字符应原样返回（不落盘）")
    // 64K + 1：落盘 + 64K preview + 路径指引，磁盘全量
    const over = "x".repeat(64 * 1024 + 1)
    const out = offloadToolResult(cwd, over)
    const m = out.match(/\[Large output saved\. Read the full result with the read tool: (.+)\]/)
    assert.ok(m, "65537 字符应落盘并返回路径指引")
    assert.equal(readFileSync(m[1], "utf8").length, 64 * 1024 + 1, "磁盘全量 65537")
    assert.ok(out.length > 20_000 && out.length <= 64 * 1024 + 500, "preview 放大到 64K（原 2K 限制已破）")
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("offloadToolResult: 落盘失败回退截断 = 65536 + 双端切片（T-4.4 / 评审 #6）", () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-vscode-tmp-"))
  try {
    // cwd 指向一个普通文件 → mkdir .thincoder/tmp 必然失败 → 走回退截断路径
    const fileAsCwd = join(dir, "not-a-dir")
    writeFileSync(fileAsCwd, "occupied")
    // 标注报原文总长 + 落盘失败原因（评审 #1：原"truncated 超出量"数字在双端切片下与省略注矛盾）
    const suffix = "\n... (truncated 65537 chars total — offload to disk failed)"
    const out = offloadToolResult(fileAsCwd, "x".repeat(64 * 1024 + 1))
    assert.equal(out.length, 64 * 1024 + suffix.length, "回退截断 = 65536 + 截断标注")
    assert.ok(out.startsWith("x".repeat(16 * 1024)), "回退截断保头 16K（T-4.4 双端切片——不再纯头截断）")
    assert.ok(out.includes("middle omitted:"), "回退截断含省略注（与主路径同口径）")
    assert.ok(out.endsWith(suffix), "截断标注存在（原文总长 + 落盘失败原因）")
    assert.ok(!out.includes("Large output saved"), "回退无路径提示（落盘从未成功）")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

// ─── §5 D-4.1：预览保头保尾（2026-09-04 用户拍板 A——T-4.1/T-4.2/T-4.4）───

/** 提取 preview 本体（去路径提示行）——本端格式 `[Large output saved...: PATH]\n\n<preview>`。 */
function previewOf(out) {
  return out.slice(out.indexOf("]\n\n") + 3)
}

test("T-4.1 (N): 65537 字符含头尾标记 → 预览双端都在 + 省略注 + 总长 ≤ 65536+路径", () => {
  const cwd = mkdtempSync(join(tmpdir(), "thincoder-vscode-tmp-"))
  try {
    // 头 16K "A" + 中段 "B" + 尾部 "ZZZZ"（尾标记落在 preview 的尾段内）
    const text = "A".repeat(16 * 1024) + "B".repeat(65_537 - 16 * 1024 - 4) + "ZZZZ"
    assert.equal(text.length, 65_537)
    const out = offloadToolResult(cwd, text)
    const m = out.match(/\[Large output saved\. Read the full result with the read tool: (.+)\]/)
    assert.ok(m, "路径指引格式不变（AC-4.4）")
    assert.equal(readFileSync(m[1], "utf8").length, 65_537, "磁盘全量（N-4.1 保持）")
    const preview = previewOf(out)
    assert.ok(preview.startsWith("A".repeat(16 * 1024)), "头段 16K 'A' 保留")
    assert.ok(preview.endsWith("ZZZZ"), "尾段 'ZZZZ' 保留（结果/统计/结论所在——F-4.1 核心）")
    assert.ok(preview.includes("middle omitted:"), "中间省略注存在")
    assert.ok(preview.length <= 64 * 1024, "head + note + tail ≤ 65536（round1 评审 #2 预算）")
    assert.ok(out.length <= 64 * 1024 + 500, "总长 = preview + 路径开销")
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-4.2 (E): 恰好 16K 头后立即超限 → 头段保留、尾段出现、省略注在（双端切片边界）", () => {
  const cwd = mkdtempSync(join(tmpdir(), "thincoder-vscode-tmp-"))
  try {
    // 头恰好 16K "A"，其余 49153 个 "B"——Preview 头=A×16384，尾=B 段（非空即证明尾段来自文本尾部）
    const text = "A".repeat(16 * 1024) + "B".repeat(65_537 - 16 * 1024)
    const out = offloadToolResult(cwd, text)
    const preview = previewOf(out)
    assert.ok(preview.startsWith("A".repeat(16 * 1024)), "头段完整保留（16K 边界不吞字符）")
    assert.ok(preview.endsWith("B".repeat(4)), "尾段来自文本尾部（B 段）")
    assert.ok(preview.includes("middle omitted:"), "省略注在")
    assert.ok(preview.length <= 64 * 1024, "总长仍受 65536 预算约束")
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-4.4 (A): 落盘失败 → 回退截断同用双端切片（头+省略注+尾——无路径提示）", () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-vscode-tmp-"))
  try {
    const fileAsCwd = join(dir, "not-a-dir")
    writeFileSync(fileAsCwd, "occupied")
    const text = "A".repeat(16 * 1024) + "B".repeat(65_537 - 16 * 1024 - 4) + "ZZZZ"
    const out = offloadToolResult(fileAsCwd, text)
    assert.ok(out.startsWith("A".repeat(16 * 1024)), "回退保头 16K")
    assert.ok(out.includes("middle omitted:"), "回退含省略注（与主路径同口径）")
    assert.ok(out.endsWith("ZZZZ\n... (truncated 65537 chars total — offload to disk failed)"), "回退保尾 + 标注（原文总长 + 落盘失败原因）")
    assert.ok(!out.includes("Large output saved"), "无路径提示")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})


// ─── V2（CLI §14.7 对齐清单 #2）：UTF-16 安全截断——截断点落高代理向前收一码元 ───

import { safeSliceUTF16, safeSliceUTF16Tail } from "../src/agent/run-helpers.mjs"

test("safeSliceUTF16: 截断点落高代理 → 向前收一码元（不产生孤立代理）", () => {
  // 🔴 = D83D+DD34；`"ab" + "🔴" + "cd"` 长度 6（b 在 index 1）
  const s = "ab\uD83D\uDD34cd"
  assert.equal(s.length, 6)
  // max=3 → 截断点 index 2 = 高代理 D83D → 收到 2（丢掉整个代理对）
  assert.equal(safeSliceUTF16(s, 3), "ab", "截断点落高代理 → 向前收一码元（代理对整体丢弃）")
  assert.equal(safeSliceUTF16(s, 4), "ab\uD83D\uDD34", "截断点落低代理（配对内）→ 正常截到低代理后")
  assert.equal(safeSliceUTF16(s, 5), "ab\uD83D\uDD34c", "非代理边界 → 原样 slice")
  assert.equal(safeSliceUTF16(s, 6), s, "不超长 → 原样返回")
  // 净化兜底：即使某处漏切产生孤立代理，escape 层 U+FFFD 兜底（双保险）
  const lone = "\uD83D"
  assert.equal(safeSliceUTF16(lone, 1), lone, "截断点不在高代理上（len 1 ≤ max 1）→ 原样")
})

test("offloadToolResult: 预览截断与回退截断不产生孤立代理（safeSliceUTF16/Tail 接入）", () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-vscode-tmp-"))
  try {
    // 构造 64K+1 且截断点恰在高代理上的文本：65535 个 'a' + 高代理 D83D + 低代理 DD34
    const text = "a".repeat(64 * 1024 - 1) + "\uD83D\uDD34"
    const out = offloadToolResult(dir, text) // 65537 长度 → 落盘 + preview
    const preview = previewOf(out)
    // 双端切片后的断言：完整代理对保留在尾段（配对不算孤立）——只检孤立代理形态
    assert.ok(!/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/.test(preview), "preview 无孤立高代理")
    assert.ok(!/(?:^|[^\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(preview), "preview 无孤立低代理")
    // 回退路径（落盘失败）：同样安全——尾部孤立高代理被 safeSliceUTF16Tail 终点修剪掉
    const fileAsCwd = join(dir, "not-a-dir")
    writeFileSync(fileAsCwd, "occupied")
    const fb = offloadToolResult(fileAsCwd, "a".repeat(64 * 1024) + "\uD83D")
    assert.ok(!/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/.test(fb), "回退截断无孤立高代理")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("offloadToolResult: tail 起点代理对安全——集成断言（safeSliceUTF16Tail 直接单测见下）", () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-vscode-tmp-"))
  try {
    // 双边界同测（集成视角——预览整体无孤立代理）：① head 切点 16383/16384 落代理对 →
    // safeSliceUTF16 前收一码元（head = a×16383）；② 收敛后 tail 起点（65537−49119 = 16418）
    // 落 pair2 高半（D83D）——代理对完整保留在 tail 内（起点"低代理前移"分支由直接单测
    // 覆盖——迭代预算对边界位置敏感，集成层只断言无孤立代理结果）
    const text = "a".repeat(16_383) + "\uD83D\uDD34" + "m".repeat(16_418 - 16_385) + "\uD83D\uDD34" + "b".repeat(65_537 - 16_420)
    assert.equal(text.length, 65_537)
    const out = offloadToolResult(dir, text)
    const preview = previewOf(out)
    assert.ok(!/(?:^|[^\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(preview), "preview 无孤立低代理")
    assert.ok(!/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/.test(preview), "preview 无孤立高代理")
    // head 边界：代理对整体丢弃——预览以 a×16383 开头（不产生孤立高代理）
    assert.ok(preview.startsWith("a".repeat(16_383)), "head 边界代理对整体丢弃")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("safeSliceUTF16Tail 直接单测: 起点低代理前移 / 起点高代理对完整 / 终点孤立高代理修剪 / 不超长原样", () => {
  // "a\uD83D\uDD34b" → 0:a 1:D83D(高) 2:DD34(低) 3:b
  const s = "a\uD83D\uDD34b"
  // max=2 → start=4−2=2 = 低代理 → 前移一码元 → slice(3) = "b"（代理对整体丢弃）
  assert.equal(safeSliceUTF16Tail(s, 2), "b", "起点落低代理 → 前移一码元（分支真实进入）")
  // max=3 → start=1 = 高代理（对首）→ 原样——完整代理对保留在 tail 内
  assert.equal(safeSliceUTF16Tail(s, 3), "\uD83D\uDD34b", "起点落高代理（对完整）→ 原样")
  // "ab\uD83D" len 3——max=2 → 切点后 tail = "b\uD83D" 终点孤立高代理 → 修剪
  assert.equal(safeSliceUTF16Tail("ab\uD83D", 2), "b", "终点孤立高代理 → 去掉")
  // 不超长 → 原样返回
  assert.equal(safeSliceUTF16Tail("abc", 5), "abc", "不超长 → 原样")
  // "a\uD83D" len 2——max=1 → tail = "\uD83D"（单高代理）→ 终点修剪 → 空（无孤立）
  assert.equal(safeSliceUTF16Tail("a\uD83D", 1), "", "单码元高代理尾 → 修剪为空（无孤立）")
})

test("compactHistory/explore 序列化: emoji 在截断边界 → 摘要请求体无孤立代理（V2 接入 compact.mjs）", async () => {
  const { compactHistory } = await import("../src/compact.mjs")
  const { createServer } = await import("node:http")
  const requests = []
  const server = createServer((req, res) => {
    let body = ""
    req.on("data", (c) => (body += c))
    req.on("end", () => {
      requests.push(body)
      res.writeHead(200, { "Content-Type": "text/event-stream" })
      res.end(
        `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: "摘要" } }] })}\n\n` +
        `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
        `data: [DONE]\n\n`
      )
    })
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const provider = { baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "unknown-model" }
  try {
    // 单条超 8000 码元（user cap）且第 8000 码元恰为高代理的消息 → 序列化不得产生孤立代理
    const messages = []
    for (let i = 0; i < 40; i++) messages.push({ role: "user", content: `m${i} `.repeat(200) })
    messages.push({ role: "user", content: "a".repeat(7999) + "\uD83D\uDD34tail" })
    messages.push({ role: "assistant", content: "done" })
    await compactHistory(messages, "sys", provider)
    const body = requests.at(-1) ?? ""
    assert.ok(!body.includes("\\ud83d"), "摘要请求体无孤立代理转义（截断点安全）")
    assert.ok(!/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/.test(body), "请求体无孤立高代理字符")
  } finally {
    server.close()
  }
})
