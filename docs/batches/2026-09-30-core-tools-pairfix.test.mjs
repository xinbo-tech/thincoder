/**
 * 2026-09-30-core-tools-pairfix.test.mjs — 批次本地单元件（核心工具族两修 · 台账 #732 ∥ #733）。
 * 名随批次档 · 住批次目录 · 不进仓套件；复跑（仓根 thincoder/）：
 *   node --test docs/batches/2026-09-30-core-tools-pairfix.test.mjs
 *
 * 覆盖 = 批档 §2.2 ∥ §2.3 验收腿：
 *   ①L1 解析四态：LF ∥ CRLF ∥ 混合（状态行 CRLF）∥ 混合（状态行 LF）⇒ open ∧ §1 行在册；
 *       已收口-CRLF ⇒ closed；畸形值 ∥ 无 §1 ⇒ unknown（fail-closed 保真）。
 *   ①L2 消费全链（CRLF ∥ LF 对齐）：append ∥ status 过门；close 成；close 后 append ∥ status ∥
 *       再 close 全拒。「再 close 拒」= LF 既有行为对齐（门施于冻结档——非本批新增契约）；
 *       在飞扫描受控基底（fixture 根 + 既有注入缝 `_setProjectRootForTest`）：缺省基底 =
 *       <fixtureRoot>/docs/batches ∥ 仅 CRLF 命中 ∥ LF+CRLF 双在飞按复数判（不扫仓内 docs/batches）。
 *   ①L3 写面保真：替换四态（close）⇒ §1 状态行恰一行 ∧ 除被替换行外全文字节零变（串等值法——
 *       行尾随原行自身）；缺行自建 LF ∥ CRLF（#422③ close 对无状态行档自建机读位）⇒ 除新增块外
 *       零变 ∧ 新增块行尾 = 标题行自身行尾。
 *   ①L4 复现对照：§2.4 口径重演——CRLF ∥ 混合两态读数逐项 = LF 读数（修复形对照）。
 *   ②L1 落盘形 ∥ 根零残留：savePastedImageBuffer ⇒ <cwd>/.thincoder/tmp/paste-<id>-0.png ∧ 件在场 ∧
 *       cwd 根零新 `.thincoder-paste-*`。
 *   ②L2 非一次性：同一件连续两次 read_image ⇒ 两次成功 ∧ 档仍在。
 *   ②L3 清理窗（3 天）：tmp 内超龄件（mtime 回拨 >3 天）⇒ 下次落盘后被清 ∥ 未超龄件保留。
 *   ②L4 路径稳定（捕获缝驱动）：pasteClipboardImage ⇒ { insert, path }：path = 最终绝对路径
 *       （≠ staging）∧ insert = `read_image <path>`（实际插入文本）∧ staging 用毕即清 ∧ 同路径两读可解。
 *   ②L5 失败径不静默（捕获缝驱动）：无图（捕获抛 ∥ 零字节）∥ 超阈（捕获落巨件）∥ 写败（cwd 取
 *       不可建目录之形）⇒ 提示行在场 ∧ staging 清 ∧ 零插入；超阈以核 IMAGE_MAX_BYTES 单源早筛
 *       （失筛则落写败径——两提示行可辨）。
 *   ②L6 面零改：核 attachments.mjs 行为零回归（fs 缝驱动探针）∧ read_image 其余语义（svg ∥ 非视觉门
 *       ∥ 15MB 闸）零回归。桌面 ∥ VSC 消费面零触 = 交付报告 `git diff` 读数（不在本件落 git 依赖
 *       断言——脏仓瞬时漂移面）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, truncateSync, utimesSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { basename, dirname, isAbsolute, join } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-core"))) throw new Error(`须从仓库根（thincoder/）运行——cwd = ${ROOT}`)
const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href)

const SK = await load("thincoder-core/agent-tools/batch-skeleton.mjs")
const LIFE = await load("thincoder-core/agent-tools/batch-lifecycle.mjs")
const BATCH = await load("thincoder-core/agent-tools/batch.mjs")
const MANIFEST = await load("thincoder-core/manifest.mjs")
const FILE = await load("thincoder-core/tools/file.mjs")
const ATT = await load("thincoder-core/attachments.mjs")
const CLIP = await load("thincoder-cli/src/tui/clipboard.mjs")

/* ── 夹具与公共助手 ─────────────────────────────────────────────── */

const ST_OK = "🔄 进行中（夹具）"
const LF = { hdrEol: "\n", statusEol: "\n", restEol: "\n" }
const CRLF = { hdrEol: "\r\n", statusEol: "\r\n", restEol: "\r\n" }
const MIX_STATUS_CRLF = { hdrEol: "\n", statusEol: "\r\n", restEol: "\n" }
const MIX_STATUS_LF = { hdrEol: "\r\n", statusEol: "\n", restEol: "\r\n" }

/** 夹具：六段骨架形记录（§1 标题行 / §1 状态行 / 余行行尾各参——混合档按需指定；零死占位字面）。 */
function fixture({ hdrEol = "\n", statusEol = "\n", restEol = "\n", status = ST_OK, withStatus = true } = {}) {
  const rows = [
    ["# 2026-09-30 · 夹具记录", restEol],
    ["> 六段 append-only，一段一作者。", restEol],
    ["## §1 讨论（主 agent）", hdrEol],
    ...(withStatus ? [[`**状态行**：${status}`, statusEol]] : []),
    ["## §2 批次任务与设计（eng-designer）", restEol],
    ["**状态行**：（eng-designer 写入时更新）", restEol],
    ["## §3 设计评审（评审子代理）", restEol],
    ["## §4 用户批准（主 agent）", restEol],
    ["## §5 实施记录（eng-coder）", restEol],
    ["## §6 验证与收口（父代理）", restEol],
    ["收口内容（夹具）。", restEol],
  ]
  return rows.map(([t, e]) => t + e).join("")
}

/** §1 段内状态行列表（段界定 = sectionHeaderRe + 下一 `## §`；行切分 = /\r?\n/——EOL 形态无关）。 */
function s1StatusLines(src) {
  const hdr = SK.sectionHeaderRe(1).exec(src)
  if (!hdr) return []
  const nextRe = /^## §\d/gm
  nextRe.lastIndex = hdr.index + hdr[0].length
  const next = nextRe.exec(src)
  const body = src.slice(hdr.index + hdr[0].length, next ? next.index : src.length)
  return body.split(/\r?\n/).filter((l) => SK.STATUS_LINE_RE.test(l))
}

const tmpRoot = (tag) => mkdtempSync(join(tmpdir(), `pairfix-${tag}-`))

/** close 驱动（显式 path——不经在飞扫描）：返回写后全文。 */
async function driveClose(src) {
  const root = tmpRoot("close")
  const record = join(root, "record.md")
  writeFileSync(record, src)
  try {
    await BATCH.batchTool(null).execute({ action: "close", path: record }, { agent: { cwd: root }, depth: 0 })
    return readFileSync(record, "utf8")
  } finally { rmSync(root, { recursive: true, force: true }) }
}

/** 消费全链驱动（受控基底 = fixture 根）：append ∥ status ∥ close 成 ∥ close 后三拒 + 各读数。 */
async function runConsumptionChain(eols) {
  const root = tmpRoot("chain")
  const batches = join(root, "docs", "batches")
  mkdirSync(batches, { recursive: true })
  const record = join(batches, "record.md")
  writeFileSync(record, fixture(eols))
  MANIFEST._setProjectRootForTest(root)
  try {
    const tool = BATCH.batchTool(null)
    const ctx = { agent: { cwd: root }, depth: 0 }
    const appendMsg = await tool.execute({ action: "append", segment: 1, text: "### 1.6 夹具追加行" }, ctx)
    const statusMsg = await tool.execute({ action: "status", value: "进行中" }, ctx)
    await tool.execute({ action: "append", segment: 6, text: "收口段内容（夹具）。" }, ctx)
    const closeMsg = await tool.execute({ action: "close" }, ctx)
    const refusals = {}
    const probes = [
      ["append", () => tool.execute({ action: "append", segment: 1, path: record, text: "x" }, ctx)],
      ["status", () => tool.execute({ action: "status", path: record, value: "进行中" }, ctx)],
      ["reclose", () => tool.execute({ action: "close", path: record }, ctx)],
    ]
    for (const [name, call] of probes) {
      try { await call(); refusals[name] = "accepted" } catch (e) { refusals[name] = e.message.includes("已收口档不回改") ? "refused:已收口档不回改" : `refused:${e.message}` }
    }
    const src = readFileSync(record, "utf8")
    let scanAfterClose = "found"
    try { LIFE.findInFlightBatch(root, BATCH.batchDocBases(root)) } catch { scanAfterClose = "none" }
    return {
      appendOk: /appended/.test(appendMsg),
      statusOk: /status line updated/.test(statusMsg),
      closeOk: /已收口/.test(closeMsg),
      refusals,
      closedParse: SK.readBatchStatusLine(src),
      s1StatusCount: s1StatusLines(src).length,
      scanAfterClose,
    }
  } finally {
    MANIFEST._resetProjectRootForTest()
    rmSync(root, { recursive: true, force: true })
  }
}

/* ── ①L1 解析四态 ─────────────────────────────────────────────── */

test("①L1 解析四态 ∥ 已收口 ∥ 畸形：LF ∥ CRLF ∥ 混合两态 ⇒ open ∧ 行在册；已收口-CRLF ⇒ closed；畸形 ∥ 无 §1 ⇒ unknown", () => {
  for (const [name, eols] of [["LF", LF], ["CRLF", CRLF], ["混合-状态行 CRLF", MIX_STATUS_CRLF], ["混合-状态行 LF", MIX_STATUS_LF]]) {
    const src = fixture(eols)
    assert.equal(SK.readBatchStatusLine(src), "open", `${name}：解析 = open`)
    assert.equal(SK.sectionHasStatusLine(src, 1), true, `${name}：§1 状态行在册`)
  }
  const closed = fixture({ ...CRLF, status: "已收口 2026-09-30" })
  assert.equal(SK.readBatchStatusLine(closed), "closed", "已收口-CRLF ⇒ closed")
  assert.equal(SK.sectionHasStatusLine(closed, 1), true, "已收口-CRLF：行在册（close 再入口门判据面）")
  assert.equal(SK.readBatchStatusLine(fixture({ status: "（未填写）" })), "unknown", "畸形值 ⇒ unknown（fail-closed 保真）")
  assert.equal(SK.sectionHasStatusLine(fixture({ status: "（未填写）" }), 1), true, "畸形值：行在册但值不可解析 ⇒ close 仍 fail-closed")
  assert.equal(SK.readBatchStatusLine("# 无段\n无行"), "unknown", "无 §1 段 ⇒ unknown")
})

/* ── ①L2 消费全链 ∥ 在飞扫描 ───────────────────────────────────── */

test("①L2 消费全链（CRLF ∥ LF 对齐）：append ∥ status 过门；close 成；close 后 append ∥ status ∥ 再 close 全拒；读数逐项 = LF", async () => {
  const crlf = await runConsumptionChain(CRLF)
  const lf = await runConsumptionChain(LF)
  for (const [name, r] of [["CRLF", crlf], ["LF", lf]]) {
    assert.equal(r.appendOk, true, `${name}：append 过门`)
    assert.equal(r.statusOk, true, `${name}：status 过门`)
    assert.equal(r.closeOk, true, `${name}：close 成`)
    assert.deepEqual(r.refusals, { append: "refused:已收口档不回改", status: "refused:已收口档不回改", reclose: "refused:已收口档不回改" }, `${name}：close 后三拒`)
    assert.equal(r.closedParse, "closed", `${name}：close 后解析 = closed`)
    assert.equal(r.s1StatusCount, 1, `${name}：§1 状态行恰一行`)
    assert.equal(r.scanAfterClose, "none", `${name}：close 后不在在飞扫描面`)
  }
  assert.deepEqual(crlf, lf, "CRLF 读数逐项 = LF（「再 close 拒」= LF 既有行为对齐——非本批新增契约）")
})

test("①L2（续）在飞扫描受控基底：缺省基底 = <fixtureRoot>/docs/batches（注入缝）；仅 CRLF 命中 ∥ LF+CRLF 双在飞按复数判", () => {
  const root = tmpRoot("scan")
  const batches = join(root, "docs", "batches")
  mkdirSync(batches, { recursive: true })
  const crlfRecord = join(batches, "crlf.md")
  const lfRecord = join(batches, "lf.md")
  writeFileSync(crlfRecord, fixture(CRLF))
  MANIFEST._setProjectRootForTest(root)
  try {
    assert.deepEqual(BATCH.batchDocBases(root), [batches], "缺省基底 = <fixtureRoot>/docs/batches")
    assert.equal(LIFE.findInFlightBatch(root, BATCH.batchDocBases(root)), crlfRecord, "仅 CRLF 在飞 ⇒ 命中")
    assert.equal(LIFE.findInFlightBatch(root, [batches]), crlfRecord, "直调（bases = 显式注入面）同判")
    writeFileSync(lfRecord, fixture(LF))
    assert.throws(() => LIFE.findInFlightBatch(root, [batches]), /2 batch records are in flight/, "LF+CRLF 双在飞 ⇒ 复数判")
    assert.throws(() => LIFE.findInFlightBatch(root, [batches]), (e) => e.message.includes(crlfRecord) && e.message.includes(lfRecord), "复数判消息列出两候选")
  } finally {
    MANIFEST._resetProjectRootForTest()
    rmSync(root, { recursive: true, force: true })
  }
})

/* ── ①L3 写面保真 ─────────────────────────────────────────────── */

test("①L3 替换四态（close）：§1 状态行恰一行 ∧ 除被替换行外全文字节零变（串等值法——行尾随原行自身）", async () => {
  for (const [name, eols] of [["LF", LF], ["CRLF", CRLF], ["混合-状态行 CRLF", MIX_STATUS_CRLF], ["混合-状态行 LF", MIX_STATUS_LF]]) {
    const src = fixture(eols)
    const written = await driveClose(src)
    assert.equal(s1StatusLines(written).length, 1, `${name}：§1 状态行恰一行`)
    const line = s1StatusLines(written)[0]
    assert.match(line, /^\*\*状态行\*\*：已收口 \d{4}-\d{2}-\d{2}$/, `${name}：值形 = 已收口 <日期>（期望以写后文本为准——免加载期时钟）`)
    const key = `**状态行**：${ST_OK}`
    assert.equal(src.indexOf(key), src.lastIndexOf(key), `${name}：样本行唯一（断言前提）`)
    assert.equal(written, src.replace(key, line), `${name}：除被替换行外字节零变 ∧ 行尾随原行自身`)
  }
})

test("①L3（续）缺行自建（#422③ close 对无状态行档自建机读位）：LF ∥ CRLF——除新增块外零变 ∧ 新增块行尾 = 标题行自身行尾", async () => {
  for (const [name, h] of [["LF", "\n"], ["CRLF", "\r\n"]]) {
    const src = fixture({ hdrEol: h, statusEol: h, restEol: h, withStatus: false })
    const written = await driveClose(src)
    assert.equal(s1StatusLines(written).length, 1, `${name}：自建恰一行`)
    const line = s1StatusLines(written)[0]
    assert.match(line, /^\*\*状态行\*\*：已收口 \d{4}-\d{2}-\d{2}$/, `${name}：自建值形 = 已收口 <日期>`)
    const anchor = `## §1 讨论（主 agent）${h}`
    assert.equal(src.indexOf(anchor), src.lastIndexOf(anchor), `${name}：锚行唯一（断言前提）`)
    assert.equal(written, src.replace(anchor, anchor + line + h + h + h), `${name}：除新增块外零变 ∧ 新增块行尾 = 标题行自身行尾`)
  }
})

/* ── ①L4 复现对照 ─────────────────────────────────────────────── */

test("①L4 复现对照（§2.4 口径重演）：CRLF ∥ 混合读数逐项 = LF（修复形对照——消费 ∥ 扫描 ∥ 写面计数）", async () => {
  const base = await runConsumptionChain(LF)
  for (const [name, eols] of [["CRLF", CRLF], ["混合-状态行 CRLF", MIX_STATUS_CRLF], ["混合-状态行 LF", MIX_STATUS_LF]]) {
    const row = await runConsumptionChain(eols)
    assert.deepEqual(row, base, `${name}：逐项读数 = LF 行`)
  }
})

/* ── ②L1 ∥ ②L2 ∥ ②L3 ─────────────────────────────────────────── */

const PNG_BYTES = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64, 7)])

test("②L1 落盘形 ∥ 根零残留：savePastedImageBuffer ⇒ <cwd>/.thincoder/tmp/paste-<id>-0.png ∧ 件在场 ∧ cwd 根零新 `.thincoder-paste-*`", async () => {
  const cwd = tmpRoot("l1")
  try {
    const path = await CLIP.savePastedImageBuffer(PNG_BYTES, cwd)
    assert.ok(path, "落盘回路：路径 ∥ null ⇒ 路径")
    assert.equal(dirname(path), join(cwd, ".thincoder", "tmp"), "落盘目录 = <cwd>/.thincoder/tmp")
    assert.match(basename(path), /^paste-.+-0\.png$/, "命名 = paste-<id>-0.png（核 savePastedImages 单源形）")
    assert.equal(existsSync(path), true, "件在场")
    assert.equal(isAbsolute(path), true, "绝对路径")
    assert.deepEqual(readdirSync(cwd).filter((n) => n.startsWith(".thincoder-paste-")), [], "cwd 根零新 `.thincoder-paste-*`")
  } finally { rmSync(cwd, { recursive: true, force: true }) }
})

test("②L2 非一次性：同一件连续两次 read_image ⇒ 两次成功 ∧ 档仍在", async () => {
  const cwd = tmpRoot("l2")
  try {
    const path = await CLIP.savePastedImageBuffer(PNG_BYTES, cwd)
    const first = await FILE.readImageTool.execute({ path }, { cwd })
    const second = await FILE.readImageTool.execute({ path }, { cwd })
    for (const [n, out] of [["第一次", first], ["第二次", second]]) {
      const parsed = JSON.parse(out)
      assert.equal(parsed.images.length, 1, `${n}读：图载荷在场`)
      assert.match(parsed.text, /read_image: /, `${n}读：文本标注在场`)
    }
    assert.equal(existsSync(path), true, "两次读后档仍在（读后即删已撤）")
  } finally { rmSync(cwd, { recursive: true, force: true }) }
})

test("②L3 清理窗（3 天）：tmp 内超龄件 ⇒ 下次落盘后被清 ∥ 未超龄件保留", async () => {
  const cwd = tmpRoot("l3")
  try {
    const tmp = join(cwd, ".thincoder", "tmp")
    mkdirSync(tmp, { recursive: true })
    const aged = join(tmp, "paste-aged-0.png")
    const fresh = join(tmp, "paste-fresh-0.png")
    writeFileSync(aged, PNG_BYTES)
    writeFileSync(fresh, PNG_BYTES)
    const oldSec = (Date.now() - (3 * 24 * 3600 * 1000 + 3600 * 1000)) / 1000
    utimesSync(aged, oldSec, oldSec)
    const path = await CLIP.savePastedImageBuffer(PNG_BYTES, cwd)
    assert.equal(existsSync(aged), false, "超龄件（mtime 回拨 >3 天）被清")
    assert.equal(existsSync(fresh), true, "未超龄件保留")
    assert.equal(existsSync(path), true, "新件在场")
  } finally { rmSync(cwd, { recursive: true, force: true }) }
})

/* ── ②L4 路径稳定（捕获缝驱动） ────────────────────────────────── */

test("②L4 路径稳定：{ insert, path } 契约——path = 最终绝对路径（≠ staging）∧ insert = `read_image <path>` ∧ staging 用毕即清 ∧ 同路径两读可解", async () => {
  const cwd = tmpRoot("l4")
  try {
    let staging = null
    const lines = []
    const state = { input: [], cursor: 0 }
    const out = await CLIP.pasteClipboardImage(
      { agent: { cwd }, state, pushLine: (line) => lines.push(line), render: () => {} },
      async (dest) => { staging = dest; writeFileSync(dest, PNG_BYTES) },
    )
    assert.ok(out, "成功径 ⇒ { insert, path }（非 null）")
    assert.equal(out.insert, `read_image ${out.path}`, "insert = `read_image <最终绝对路径>`")
    assert.equal(dirname(out.path), join(cwd, ".thincoder", "tmp"), "path 目录 = 核落盘族")
    assert.match(basename(out.path), /^paste-.+-0\.png$/, "最终路径形 = paste-<id>-0.png")
    assert.equal(isAbsolute(out.path), true, "最终路径为绝对路径")
    assert.ok(staging, "捕获缝收到 staging 路径")
    assert.notEqual(out.path, staging, "path = 最终绝对路径——非 staging")
    assert.equal(staging.startsWith(tmpdir()), true, "staging 落系统临时区（不入项目树）")
    assert.equal(existsSync(staging), false, "staging 用毕即清（读取后）")
    assert.equal(lines.filter((l) => l.startsWith("[image pasted → ")).length, 1, "贴图回显一行")
    assert.equal(state.input.join(""), out.insert, "实际插入文本 = insert")
    const r1 = await FILE.readImageTool.execute({ path: out.path }, { cwd })
    const r2 = await FILE.readImageTool.execute({ path: out.path }, { cwd })
    assert.equal(JSON.parse(r1).images.length, 1, "同路径首读可解")
    assert.equal(JSON.parse(r2).images.length, 1, "同路径再读可解")
    assert.equal(existsSync(out.path), true, "两读后档仍在")
  } finally { rmSync(cwd, { recursive: true, force: true }) }
})

/* ── ②L5 失败径不静默（捕获缝驱动） ───────────────────────────── */

test("②L5 失败径不静默：无图（捕获抛 ∥ 零字节）∥ 超阈 ∥ 写败 ⇒ 提示行在场 ∧ staging 清 ∧ 零插入", async () => {
  const NO_IMAGE = "Clipboard does not contain an image, or clipboard access failed"
  const newCtx = (cwd) => {
    const lines = []
    return { lines, ctx: { agent: { cwd }, state: { input: [], cursor: 0 }, pushLine: (line) => lines.push(line), render: () => {} } }
  }
  {
    const cwd = tmpRoot("l5a")
    try {
      let staging = null
      const { lines, ctx } = newCtx(cwd)
      const out = await CLIP.pasteClipboardImage(ctx, async (dest) => { staging = dest; throw new Error("no image on clipboard") })
      assert.equal(out, null, "无图（捕获抛）⇒ null")
      assert.equal(lines.at(-1), NO_IMAGE, "无图（捕获抛）⇒ 既有句逐字沿用")
      assert.equal(existsSync(staging), false, "无图（捕获抛）⇒ staging 清（ENOENT 容忍）")
      assert.equal(ctx.state.input.length, 0, "零插入")
    } finally { rmSync(cwd, { recursive: true, force: true }) }
  }
  {
    const cwd = tmpRoot("l5b")
    try {
      let staging = null
      const { lines, ctx } = newCtx(cwd)
      const out = await CLIP.pasteClipboardImage(ctx, async (dest) => { staging = dest; writeFileSync(dest, Buffer.alloc(0)) })
      assert.equal(out, null, "无图（零字节）⇒ null")
      assert.equal(lines.at(-1), NO_IMAGE, "无图（零字节）⇒ 既有句逐字沿用")
      assert.equal(existsSync(staging), false, "无图（零字节）⇒ staging 清")
      assert.equal(ctx.state.input.length, 0, "零插入")
    } finally { rmSync(cwd, { recursive: true, force: true }) }
  }
  {
    const cwd = tmpRoot("l5c")
    try {
      let staging = null
      const { lines, ctx } = newCtx(cwd)
      const out = await CLIP.pasteClipboardImage(ctx, async (dest) => {
        staging = dest
        writeFileSync(dest, Buffer.alloc(1))
        truncateSync(dest, ATT.IMAGE_MAX_BYTES + 1)
      })
      assert.equal(out, null, "超阈 ⇒ null")
      assert.equal(lines.at(-1), "Clipboard image too large (max 15MB)", "超阈 ⇒ 单源文案（早筛分支——非写败分支）")
      assert.equal(existsSync(staging), false, "超阈 ⇒ staging 清")
      assert.equal(ctx.state.input.length, 0, "零插入")
    } finally { rmSync(cwd, { recursive: true, force: true }) }
  }
  {
    const cwd = tmpRoot("l5d")
    try {
      const blocker = join(cwd, "blocker")
      writeFileSync(blocker, "x")
      let staging = null
      const { lines, ctx } = newCtx(join(blocker, "sub"))
      const out = await CLIP.pasteClipboardImage(ctx, async (dest) => { staging = dest; writeFileSync(dest, PNG_BYTES) })
      assert.equal(out, null, "写败 ⇒ null")
      assert.equal(lines.at(-1), "Clipboard image could not be saved (write failed)", "写败 ⇒ 写败文案")
      assert.equal(existsSync(staging), false, "写败 ⇒ staging 清（用毕即清——同成功径口径）")
      assert.equal(ctx.state.input.length, 0, "零插入")
    } finally { rmSync(cwd, { recursive: true, force: true }) }
  }
})

/* ── ②L6 面零改（核行为探针 + read_image 其余语义） ────────────── */

test("②L6 面零改：核 attachments.mjs 行为零回归（fs 缝驱动）∧ read_image 其余语义（svg ∥ 非视觉门 ∥ 15MB 闸）零回归", async () => {
  const calls = []
  const fsStub = { mkdirSync: (p) => calls.push(["mkdir", p]), writeFileSync: (p, buf) => calls.push(["write", p, buf.length]) }
  const ok = ATT.savePastedImages([`data:image/png;base64,${PNG_BYTES.toString("base64")}`], "X:/pairfix-probe", { fs: fsStub })
  assert.equal(ok.dropped, 0, "有效项零弃")
  assert.equal(ok.paths.length, 1, "有效项落盘一项")
  assert.equal(dirname(ok.paths[0]), join("X:/pairfix-probe", ".thincoder", "tmp"), "族目录 = <cwd>/.thincoder/tmp（核单源形）")
  assert.match(basename(ok.paths[0]), /^paste-.+-0\.png$/, "源序命名零变")
  assert.deepEqual(calls.map((c) => c[0]), ["mkdir", "write"], "写面调用序零变（懒建 ⇒ 写）")
  const dropped = ATT.savePastedImages(["data:image/svg+xml;base64,QUJD"], "X:/pairfix-probe", { fs: fsStub })
  assert.deepEqual(dropped, { paths: [], dropped: 1 }, "表外类型 ⇒ 弃（栅格四型白名单零变）")
  assert.deepEqual(calls.map((c) => c[0]), ["mkdir", "write"], "弃项不触写面")
  assert.deepEqual(ATT.savePastedImages([], undefined, {}), { paths: [], dropped: 0 }, "空表早退先于缝校验（零判据面）")
  assert.equal(ATT.IMAGE_MAX_BYTES, 15_000_000, "单项阈常量零变（与 read_image 内闸同值同单位——单源）")
  assert.equal(ATT.parseDataUrl("data:image/jpeg;base64,QUJD").ext, "jpg", "jpeg 归一 jpg 零变")
  assert.equal(ATT.parseDataUrl("data:image/bmp;base64,QUJD"), null, "表外媒体类型 ⇒ null 零变")

  const dir = tmpRoot("l6")
  try {
    writeFileSync(join(dir, "mark.svg"), '<svg xmlns="http://www.w3.org/2000/svg"/>')
    const svgOut = await FILE.readImageTool.execute({ path: "mark.svg" }, { cwd: dir })
    assert.match(svgOut, /svg source/, "svg ⇒ 文本源（无视觉门）")
    writeFileSync(join(dir, "shot.png"), PNG_BYTES)
    await assert.rejects(
      () => FILE.readImageTool.execute({ path: "shot.png" }, { cwd: dir, agent: { provider: { model: "glm-5.2" } } }),
      /does not support image input/,
      "非视觉门：text-only 模型 ⇒ 拒（可见错误不静默丢）",
    )
    writeFileSync(join(dir, "huge.png"), Buffer.alloc(1))
    truncateSync(join(dir, "huge.png"), 15_000_001)
    await assert.rejects(() => FILE.readImageTool.execute({ path: "huge.png" }, { cwd: dir }), /Image too large/, "15MB 闸零回归")
  } finally { rmSync(dir, { recursive: true, force: true }) }
})
