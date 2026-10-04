/**
 * 2026-10-04-core-patch-batch.test.mjs — 核面小修批（#796 ∥ #802 ∥ #793）批次本地件。
 * 名随批次档 · 住批次目录 · **不进仓套件**；复跑（仓根 d:/teamcode/thincoder 下）：
 *   node --test docs/batches/2026-10-04-core-patch-batch.test.mjs
 *
 * 覆盖 = 批档 §2 验收对照（三件 × 四腿 = 12 腿）：
 *   #796（汇总行）：① 逐字 `edit batch: 3/3 entries — a.mjs, b.mjs`（末行恰一次）
 *                ② 路径去重保序首现序（同档两条目 ⇒ 2/2 — a.mjs；乱序首现 ⇒ b.mjs, a.mjs）
 *                ③ 恒定（N=1 与 N=n 皆附）
 *                ④ >64K 回执经 offloadToolResult（临时目录）⇒ preview 保尾含汇总行（git 夹具产大 diff）
 *   #802（未知键告警）：① validateManifest 产 unknownKeys（顶层 + 点形嵌套键；ok:true）；零未知键 ⇒ []
 *                ② readManifest 返回携 unknownKeys + 恰一行 console.warn（含键名）+ logEvent 落盘
 *                ③ 去重：同档同键集连读 ⇒ 恰一次；读到零未知键清 memo ⇒ 同键集复现重告警
 *                ④ 负向锁：零未知键 ⇒ 零告警（连读两次）
 *   #793（环边界 abort）：① 回归锁：非中止撞帽 ⇒ 仍 ContinueError(maxTurns)
 *                ② 环尾：maxTurns=0 + 中止信号 ⇒ AbortError(detail=turn-tail；e.reason 透传)
 *                ③ 环头：预置中止 ⇒ AbortError(detail=turn-head) + 注入族 / 模型调用零触
 *                ④ 中断态：reason={interrupt:true,message} ⇒ AbortError 携该 reason（继续判定 ⇒ resume）
 *
 * 红绿对照（先红 = 批前码，见批档 §5 实施记录）：先红实测 11 红 ∥ 1 绿——#796 四腿（无汇总行）∥ #802 ①
 * ②③④（①~③ 因 unknownKeys 缺席；④ 告警面本已绿而返回面断言红）∥ #793 ②③④（无环边界前置——②仍 ContinueError、
 * ③④续跑至模型调用哨兵）；#793① 回归锁 = 批前即绿（锁「零变」面）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const ROOT = fileURLToPath(new URL("../../", import.meta.url)) // 仓根（thincoder/）
const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href)
const BATCH = await load("thincoder-core/tools/edit-batch.mjs")
const SCHEMA = await load("thincoder-core/manifest-schema.mjs")
const MAN = await load("thincoder-core/manifest.mjs")
const LOOP = await load("thincoder-core/agent/turn-loop.mjs")
const HELP = await load("thincoder-core/agent/helpers.mjs")
const DECIDE = await load("thincoder-core/agent/continue-decision.mjs")
const LOG = await load("thincoder-core/log.mjs")

const out = (label, value) => console.log(`[读数] ${label}: ${value}`)
const created = []
const tmp = (tag) => { const d = mkdtempSync(join(tmpdir(), `cpb-${tag}-`)); created.push(d); return d }
const cleanup = () => {
  for (const d of created.splice(0)) {
    try { rmSync(d, { recursive: true, force: true }) } catch { /* 临时目录尽力清理 */ }
  }
}

/** console.warn + logEvent 落盘捕获（log 面经 _setLogsDirForTest 缝强制写临时目录）。 */
async function withWarnCapture(fn, logsDir) {
  const warns = []
  const orig = console.warn
  console.warn = (...a) => warns.push(a.join(" "))
  if (logsDir) LOG._setLogsDirForTest(logsDir)
  try {
    const value = await fn()
    return { warns, value }
  } finally {
    console.warn = orig
    if (logsDir) LOG._resetLogsDirForTest()
  }
}

/* ── #796 · 大工具回执 offload 盲区（汇总行） ─────────────────────────────── */

test("#796-① 汇总行逐字（末行恰一次）：3 条目 ⇒ 2 去重路径", async () => {
  const dir = tmp("796a")
  try {
    writeFileSync(join(dir, "a.mjs"), "const a = 1\nconst b = 2\n")
    writeFileSync(join(dir, "b.mjs"), "const c = 3\n")
    const receipt = await BATCH.applyEditBatch({
      edits: [
        { path: "a.mjs", old_string: "const a = 1", new_string: "const a = 11" },
        { path: "a.mjs", old_string: "const b = 2", new_string: "const b = 22" },
        { path: "b.mjs", old_string: "const c = 3", new_string: "const c = 33" },
      ],
    }, { cwd: dir })
    const lines = receipt.split("\n")
    assert.equal(lines.at(-1), "edit batch: 3/3 entries — a.mjs, b.mjs", "末行 = 逐字汇总行（N = 条目数 ∥ 清单 = 去重路径）")
    assert.equal(lines.filter((l) => l.startsWith("edit batch:")).length, 1, "汇总行恰一次")
    assert.equal(readFileSync(join(dir, "a.mjs"), "utf8"), "const a = 11\nconst b = 22\n", "批量真落盘（原子写面）")
    out("#796-①", `末行「${lines.at(-1)}」✓ · 恰一次 ✓`)
  } finally { cleanup() }
})

test("#796-② 路径去重保序首现序（同档两条目 ⇒ 2/2；乱序首现 ⇒ 首现序）", async () => {
  const dir = tmp("796b")
  try {
    writeFileSync(join(dir, "a.mjs"), "const a = 1\nconst b = 2\n")
    const r1 = await BATCH.applyEditBatch({
      edits: [
        { path: "a.mjs", old_string: "const a = 1", new_string: "const a = 11" },
        { path: "a.mjs", old_string: "const b = 2", new_string: "const b = 22" },
      ],
    }, { cwd: dir })
    assert.equal(r1.split("\n").at(-1), "edit batch: 2/2 entries — a.mjs", "同档两条目 ⇒ 一去重路径")
    writeFileSync(join(dir, "b.mjs"), "const c = 3\n")
    const r2 = await BATCH.applyEditBatch({
      edits: [
        { path: "b.mjs", old_string: "const c = 3", new_string: "const c = 33" },
        { path: "a.mjs", old_string: "const a = 11", new_string: "const a = 111" },
        { path: "b.mjs", old_string: "const c = 33", new_string: "const c = 333" },
      ],
    }, { cwd: dir })
    assert.equal(r2.split("\n").at(-1), "edit batch: 3/3 entries — b.mjs, a.mjs", "去重保序首现序（b 先于 a 首现）")
    out("#796-②", `2/2 — a.mjs ✓ · 3/3 — b.mjs, a.mjs ✓`)
  } finally { cleanup() }
})

test("#796-③ 恒定：N=1 与 N=n 皆附汇总行", async () => {
  const dir = tmp("796c")
  try {
    writeFileSync(join(dir, "x.mjs"), "const x = 1\nconst x2 = 2\n")
    const r1 = await BATCH.applyEditBatch({
      edits: [{ path: "x.mjs", old_string: "const x = 1", new_string: "const x = 10" }],
    }, { cwd: dir })
    assert.equal(r1.split("\n").at(-1), "edit batch: 1/1 entries — x.mjs", "N=1 亦附（恒定——无「仅大回执」分支）")
    writeFileSync(join(dir, "y.mjs"), "const y = 1\nconst y2 = 2\n")
    const r4 = await BATCH.applyEditBatch({
      edits: [
        { path: "x.mjs", old_string: "const x = 10", new_string: "const x = 11" },
        { path: "x.mjs", old_string: "const x2 = 2", new_string: "const x2 = 22" },
        { path: "y.mjs", old_string: "const y = 1", new_string: "const y = 11" },
        { path: "y.mjs", old_string: "const y2 = 2", new_string: "const y2 = 22" },
      ],
    }, { cwd: dir })
    assert.equal(r4.split("\n").at(-1), "edit batch: 4/4 entries — x.mjs, y.mjs", "N=n 恒附")
    out("#796-③", `1/1 ✓ · 4/4 ✓`)
  } finally { cleanup() }
})

test("#796-④ >64K 回执经 offloadToolResult（临时目录）⇒ preview 保尾含汇总行", async () => {
  const dir = tmp("796d")
  try {
    const long = "x".repeat(600)
    const bulk = Array.from({ length: 200 }, (_, i) => `line ${i} ${long}`).join("\n") + "\n"
    writeFileSync(join(dir, "big.txt"), bulk)
    execFileSync("git", ["init", "-q", dir]) // 大 diff 夹具（git 仓 + 暂存档 ⇒ 编辑后 diff ≈ 90K）
    execFileSync("git", ["-C", dir, "add", "big.txt"])
    const oldChunk = bulk.split("\n").slice(0, 150).join("\n")
    const receipt = await BATCH.applyEditBatch({
      edits: [{ path: "big.txt", old_string: oldChunk, new_string: "replaced" }],
    }, { cwd: dir })
    assert.ok(receipt.length > 64 * 1024, `大回执夹具成立（${receipt.length} chars > 64K）`)
    const summary = "edit batch: 1/1 entries — big.txt"
    assert.equal(receipt.split("\n").at(-1), summary, "大回执末行 = 汇总行")
    const preview = await HELP.offloadToolResult(receipt, "batch-796", join(dir, "offload"))
    assert.ok(preview.includes("[middle omitted:"), "offload 生效（双端 preview——中段省略）")
    assert.ok(preview.includes(summary), "preview 保尾 ⇒ 汇总结论恒可见")
    assert.ok(preview.length < receipt.length, "preview 小于原文（offload 预算在效）")
    const saved = preview.match(/full content saved to: (.+?)\n/)
    assert.ok(saved && existsSync(saved[1]), "全文落盘（临时目录）")
    out("#796-④", `receipt ${receipt.length} chars ⇒ preview ${preview.length} chars · 含末行 ✓`)
  } finally { cleanup() }
})

/* ── #802 · 未知 manifest 键可见化（最小告警） ─────────────────────────────── */

const UNKNOWN_MANIFEST = {
  version: 1,
  phase: "initial-dev",
  docRoot: { requirements: "docs/requirements" },
  mysteryTop: true,
  advisor: { docMap: "", standardsDoc: "", mysteryAdvisor: 1 },
}
const CLEAN_MANIFEST = { version: 1, phase: "initial-dev" }
const mkManifestFile = (dir, obj) => {
  writeFileSync(join(dir, "PROJECT-MANIFEST.json"), JSON.stringify(obj, null, 2))
  return dir
}

test("#802-① validateManifest 产 unknownKeys（顶层 + 点形嵌套键；ok:true）；零未知键 ⇒ []", () => {
  const base = structuredClone(SCHEMA.DEFAULT_MANIFEST)
  const obj = {
    ...base,
    extraTop: 1,
    docRoot: { ...base.docRoot, extraRoot: "d" },
    checkConfig: { ...base.checkConfig, extraCheck: 2 },
    index: { ...base.index, extraIdx: 3 },
    advisor: { ...base.advisor, extraAdv: "x" },
  }
  const v = SCHEMA.validateManifest(obj)
  assert.equal(v.ok, true, "未知键非拒（ok 定性零变）")
  assert.deepEqual(
    [...v.unknownKeys].sort(),
    ["advisor.extraAdv", "checkConfig.extraCheck", "docRoot.extraRoot", "extraTop", "index.extraIdx"].sort(),
    "顶层 + 四嵌套层（点形）全产",
  )
  assert.deepEqual(SCHEMA.validateManifest(structuredClone(SCHEMA.DEFAULT_MANIFEST)).unknownKeys, [], "零未知键 ⇒ []")
  assert.deepEqual(SCHEMA.validateManifest(null).unknownKeys, [], "顶层非对象早退面 ⇒ []（形态恒在）")
  out("#802-①", `5 未知键（含 4 嵌套层）⇒ ok:true · 零未知键 / 非对象 ⇒ [] ✓`)
})

test("#802-② readManifest 返回携 unknownKeys + 恰一行 console.warn（含键名）+ 事件落盘", async () => {
  const dir = tmp("802b")
  try {
    mkManifestFile(dir, UNKNOWN_MANIFEST)
    const { warns, value } = await withWarnCapture(async () => {
      const r = MAN.readManifest(dir)
      const logFile = LOG.todayLogPath() // 捕获窗内取路径（窗复位后缺省回调真实目录——避免误读）
      const logText = existsSync(logFile) ? readFileSync(logFile, "utf8") : ""
      return { r, logText }
    }, join(dir, "logs"))
    const r = value.r
    assert.equal(r.ok, true, "非拒定性零变")
    assert.deepEqual([...r.unknownKeys].sort(), ["advisor.mysteryAdvisor", "mysteryTop"], "返回面携 unknownKeys")
    assert.ok(!("mysteryTop" in r.manifest), "搬运语义零改（未知键不进 manifest）")
    assert.equal(warns.length, 1, "恰一行 console.warn")
    assert.ok(warns[0].includes("mysteryTop") && warns[0].includes("advisor.mysteryAdvisor"), "告警含键名")
    assert.ok(value.logText, "logEvent 落盘（manifest:unknown-keys）")
    const logLine = value.logText.trim().split("\n").at(-1)
    assert.ok(logLine.includes("manifest:unknown-keys") && logLine.includes("mysteryTop"), "事件行含事件名 + 键名")
    out("#802-②", `unknownKeys ${r.unknownKeys.length} 项 · warn 1 行（含键名）· 事件在盘 ✓`)
  } finally { cleanup() }
})

test("#802-③ 去重：同档同键集连读 ⇒ 恰一次；零未知键清 memo ⇒ 同键集复现重告警", async () => {
  const dir = tmp("802c")
  try {
    const file = join(dir, "PROJECT-MANIFEST.json")
    mkManifestFile(dir, UNKNOWN_MANIFEST)
    const warns = []
    const orig = console.warn
    console.warn = (...a) => warns.push(a.join(" "))
    try {
      MAN.readManifest(dir)
      MAN.readManifest(dir) // 连读两次：键集未变 ⇒ 零新告警
      assert.equal(warns.length, 1, "同档同键集 ⇒ 恰一次告警")
      mkManifestFile(dir, CLEAN_MANIFEST)
      MAN.readManifest(dir) // 读到零未知键 ⇒ 清该档 memo（零告警）
      assert.equal(warns.length, 1, "零未知键读 ⇒ 零新告警（memo 清）")
      mkManifestFile(dir, UNKNOWN_MANIFEST)
      MAN.readManifest(dir) // 同键集复现（先删后加）⇒ 状态值每次读刷新 ⇒ 重告警
      assert.equal(warns.length, 2, "同键集复现 ⇒ 重告警（memo = 档路径 → 上次观测键集）")
    } finally { console.warn = orig }
    assert.ok(existsSync(file), "夹具档在盘（读面单点）")
    out("#802-③", `连读 2 次 ⇒ 1 告警 · 清 memo 后同键集复现 ⇒ 第 2 告警 ✓`)
  } finally { cleanup() }
})

test("#802-④ 负向锁：零未知键 ⇒ 零告警（连读两次）", async () => {
  const dir = tmp("802d")
  try {
    mkManifestFile(dir, CLEAN_MANIFEST)
    const { warns, value } = await withWarnCapture(async () => {
      const r1 = MAN.readManifest(dir)
      const r2 = MAN.readManifest(dir)
      return [r1, r2]
    })
    assert.equal(warns.length, 0, "零未知键 ⇒ 零告警")
    assert.deepEqual(value.map((r) => r.unknownKeys), [[], []], "两读 unknownKeys 皆空")
    assert.equal(value[0].ok, true, "合法档照常 ok:true")
    out("#802-④", `warn 0 行 · unknownKeys [] ×2 ✓`)
  } finally { cleanup() }
})

/* ── #793 · 核环边界 abort 前置（环头 / 环尾双检查点） ─────────────────────── */

/** 回合环夹具：provider 访问即抛哨兵（「模型调用零触」的机判锚——环头前置未生效时该错误先于 AbortError 现形）。 */
function mkLoopAgent() {
  const agent = {
    _touchedFiles: [], _zeroWriteTurns: 0, _turnSeq: 0, _currentTurn: 0, _maxTurns: 0,
    history: [], cwd: process.cwd(), config: {},
  }
  Object.defineProperty(agent, "provider", {
    get() { throw new Error("model call touched — 环边界前置未生效") },
  })
  return agent
}
const loopOpts = (signal, extra = {}) => ({
  maxTurns: 0, threshold: 100_000, toolSchemas: [], toolByName: new Map(), systemPrompt: "test",
  depth: 0, signal, autoTurn: false, streamOutput: false,
  consumeInjected: null, consumeQueuedInput: null, callbacks: {}, distillSignal: null, ...extra,
})

test("#793-① 回归锁：非中止撞帽 ⇒ 仍 ContinueError(maxTurns)", async () => {
  const ctrl = new AbortController()
  await assert.rejects(
    () => LOOP.runTurnLoop(mkLoopAgent(), loopOpts(ctrl.signal, { maxTurns: 0 })),
    (e) => {
      assert.equal(e.name, "ContinueError", "非中止面零变")
      assert.ok(e instanceof HELP.ContinueError, "类型 = ContinueError")
      assert.equal(e.turn, 0, "载荷 maxTurns")
      return true
    },
  )
  out("#793-①", "ContinueError(0) ✓（非中止撞帽零变）")
})

test("#793-② 环尾：maxTurns=0 + 中止信号 ⇒ AbortError（detail=turn-tail；e.reason 透传）", async () => {
  const ctrl = new AbortController()
  ctrl.abort({ abortTrigger: "stop" })
  await assert.rejects(
    () => LOOP.runTurnLoop(mkLoopAgent(), loopOpts(ctrl.signal, { maxTurns: 0 })),
    (e) => {
      assert.equal(e.name, "AbortError", "中止恒以 AbortError 收束——不落 ContinueError")
      assert.equal(e.reason, ctrl.signal.reason, "e.reason 透传（同引用）")
      assert.deepEqual(e.abortInfo, { trigger: "stop", layer: "agent", detail: "turn-tail" }, "环尾检查点来源标注")
      assert.equal(DECIDE.continueDecision(e, { reason: e.reason }), "stop", "消费判定照常（stop）")
      return true
    },
  )
  out("#793-②", "AbortError · detail=turn-tail · reason 透传 ✓")
})

test("#793-③ 环头：预置中止 ⇒ AbortError（detail=turn-head）+ 注入族 / 模型调用零触", async () => {
  const ctrl = new AbortController()
  ctrl.abort({ abortTrigger: "stop" })
  const agent = mkLoopAgent()
  let queuedTouched = false
  await assert.rejects(
    () => LOOP.runTurnLoop(agent, loopOpts(ctrl.signal, { maxTurns: 1, consumeQueuedInput: () => { queuedTouched = true } })),
    (e) => {
      assert.equal(e.name, "AbortError", "环头直抛（中止信号下不开启新轮）")
      assert.deepEqual(e.abortInfo, { trigger: "stop", layer: "agent", detail: "turn-head" }, "环头检查点来源标注")
      return true
    },
  )
  assert.equal(queuedTouched, false, "环头注入族零触（检查点先于消费点）")
  assert.equal(agent._turnSeq, 0, "不开启新轮（编号帧未推进）")
  assert.equal(agent.history.length, 0, "历史零注入")
  out("#793-③", "AbortError · detail=turn-head · 注入 / 模型 / 帧零触 ✓")
})

test("#793-④ 中断态：reason={interrupt:true,message} ⇒ AbortError 携该 reason（继续判定 ⇒ resume）", async () => {
  const ctrl = new AbortController()
  const reason = { interrupt: true, message: "keep going" }
  ctrl.abort(reason)
  await assert.rejects(
    () => LOOP.runTurnLoop(mkLoopAgent(), loopOpts(ctrl.signal, { maxTurns: 1 })),
    (e) => {
      assert.equal(e.name, "AbortError")
      assert.equal(e.reason, reason, "中断 reason 逐字携出（外层换代续跑契约）")
      assert.deepEqual(e.abortInfo, { trigger: "user", layer: "agent", detail: "turn-head" }, "trigger=user")
      assert.equal(DECIDE.continueDecision(e, { reason: e.reason }), "resume", "外围判定 ⇒ resume（Ctrl+I 续跑零变）")
      return true
    },
  )
  out("#793-④", "AbortError · reason={interrupt:true,message} 携出 · continueDecision ⇒ resume ✓")
})