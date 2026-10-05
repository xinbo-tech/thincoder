/**
 * 2026-10-04-issue-fix-round5.test.mjs — issue 修复批·五批次本地单元件（cli/desktop 面 + 甲面腿移录）。
 * 名随批次档 · 住批次目录 · 不进仓套件；复跑 = 从仓库根 `thincoder/`：
 *   node --test docs/batches/2026-10-04-issue-fix-round5.test.mjs
 * （导入按 `process.cwd()`（仓库根）相对解析；`/rc/` 钩子 = 渲染档取件链。）
 *
 * 腿（批档 §2.2 AC 对位；「先红后绿」红面读数 = 乙面实施前实跑——L3/L4/L5（后半）/L7/L8/L9 红）：
 *   L1 #834 解析序（声明源前缀 ∥ 未声明 ∥ 同名多仓序首者）+ 写门同源（旗文案 = 写门文案去前缀）
 *   L2 #848 basis schema（可选 ⇒ required 仍 = [status]）+ 回显 / 缺省提示（不阻断）/ failed 零段
 *   L3 #842 loadModels：缺渠 ⇒ `model:catalog` 全渠扇出（零 `model:list`）∥ 失败 ⇒ none+report ∥ 空 ⇒ 零候选
 *   L4 #842 带渠行（`provider · id` ∥ 采用 ⇒ onUseModel(行渠, id)）+ 投影穿透 + 同链源码断言（向导零档改）
 *   L5 #863 /undo 双上界（oversize 占位 ∥ 总量逐最旧驱逐）+ cmd-undo oversize 分支（不回退 ∥ 不误删）
 *   L6 #863 console 采集 cap + 逐字标记行 + 未超限零标记 + 拼接先于 offload（甲面移录）
 *   L6b #863 advisor 回收（关闭轻量化 ∥ F2h 复用 ∥ Map 不随代数单调增——甲面移录）
 *   L7 #867 版本门：纯函数假版本 + 接线静态腿 + 真机直调 + 假旧版子进程（exit 1 · 逐字一行）
 *   L7b #867 SKIP_DIRS 两新项（`Library` ∥ `go`——甲面移录）
 *   L8 #867 home 检测：零索引 + 提示行（startup ∥ `/reindex`）+ 非 home 守卫不误触发
 *   L9 负向锁：CLI 死副本零残留 ∥ `thincoder.mjs` 零触（校验点 = `.cjs` shim 首行）
 * 断代重锚（2026-10-05 · 批 2026-10-05-review-gate-gaps · 台账 #940）：L6b ① 输入补 `VERDICT: pass` 行——裁定闸（VERDICT 机械闸 §5.2）落地后回显不再单凭 echo 签发；语义零改。
 */
import { after, test } from "node:test"
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { createRequire } from "node:module"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, truncateSync, writeFileSync } from "node:fs"
import { homedir, tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"

import "../../thincoder-desktop/test/rc-resolve.mjs" // `/rc/` 解析钩子（渲染档 `chat-tool.mjs` 取件链）

const ROOT = process.cwd()
if (!existsSync(resolve(ROOT, "thincoder-core"))) throw new Error(`从仓库根（thincoder/）运行（cwd = ${ROOT}）`)
const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)
const text = (rel) => readFileSync(resolve(ROOT, rel), "utf8")
const require = createRequire(import.meta.url)
const DIRS = []
const mkTmp = (tag) => { const d = mkdtempSync(join(tmpdir(), `r5-${tag}-`)); DIRS.push(d); return d }
after(() => { for (const d of DIRS) { try { rmSync(d, { recursive: true, force: true }) } catch { /* 尽力清理 */ } } })

// ─────────────────────────────── L1 · #834 ───────────────────────────────

test("L1 #834 解析序 + 写门同源", async () => {
  const decl = await mod("thincoder-core/declaration.mjs")
  const base = mkTmp("834")
  const proj = join(base, "proj")
  const pub = join(base, "docs-repo")
  mkdirSync(proj, { recursive: true })
  mkdirSync(pub, { recursive: true })
  writeFileSync(join(pub, "x.md"), "# x\n")
  writeFileSync(join(proj, "local.md"), "# l\n")
  writeFileSync(join(proj, "PROJECT-MANIFEST.json"), JSON.stringify({ index: { publicRepos: ["../docs-repo"] } }))
  decl.clearDeclarationCache()
  assert.equal(decl.resolveDeclaredRef(proj, "docs-repo/x.md").ok, true, "声明源前缀（目标在）⇒ 通过")
  assert.equal(decl.resolveDeclaredRef(proj, "docs-repo/x.md").abs, join(pub, "x.md"), "解析 = 声明根")
  assert.equal(decl.resolveDeclaredRef(proj, "docs-repo/missing.md").ok, false, "声明源前缀（目标缺）⇒ 拒")
  assert.equal(decl.resolveDeclaredRef(proj, "other-repo/z.md").ok, false, "未声明 ⇒ 拒")
  assert.equal(decl.resolveDeclaredRef(proj, "local.md").ok, true, "仓根形（在）⇒ 通过（回归）")
  assert.equal(decl.resolveDeclaredRef(proj, "nope.md").ok, false, "仓根形（缺）⇒ 拒（回归）")

  const base2 = mkTmp("834b")
  const proj2 = join(base2, "proj")
  mkdirSync(join(base2, "r1", "repo"), { recursive: true })
  mkdirSync(join(base2, "r2", "repo"), { recursive: true })
  mkdirSync(proj2, { recursive: true })
  writeFileSync(join(base2, "r2", "repo", "y.md"), "# y\n")
  writeFileSync(join(proj2, "PROJECT-MANIFEST.json"), JSON.stringify({ index: { publicRepos: ["../r1/repo", "../r2/repo"] } }))
  decl.clearDeclarationCache()
  assert.equal(decl.resolveDeclaredRef(proj2, "repo/y.md").ok, false, "同名多仓：序首者缺 ⇒ 不落序次者")
  writeFileSync(join(base2, "r1", "repo", "y.md"), "# y1\n")
  assert.equal(decl.resolveDeclaredRef(proj2, "repo/y.md").abs, join(base2, "r1", "repo", "y.md"), "同名多仓 ⇒ 声明序首者")

  // 写门同源：声明源前缀 ⇒ 放行；目标缺 ⇒ 拒（文案逐字）；迁移旗 = 写门文案去前缀（同判）
  const ledgerDb = await mod("thincoder-core/ledger-db.mjs")
  const ledgerCmd = await mod("thincoder-core/ledger-cmd.mjs")
  const mig = await mod("thincoder-core/ledger-migrate.mjs")
  const ledgerDir = join(base, "ledgerdir")
  mkdirSync(ledgerDir, { recursive: true })
  ledgerDb._setLedgerDirForTest(ledgerDir)
  try {
    const id1 = ledgerCmd.ledgerAdd({ cwd: proj, row: { kind: "tech_todo", title: "A" } })
    ledgerCmd.ledgerUpdate({ cwd: proj, id: id1, patch: { status: "待设计" } })
    assert.deepEqual(
      ledgerCmd.ledgerUpdate({ cwd: proj, id: id1, patch: { status: "在途", task_book: "docs-repo/x.md" } }),
      { id: id1 }, "写门：声明源前缀（在）⇒ 通过")
    const id2 = ledgerCmd.ledgerAdd({ cwd: proj, row: { kind: "tech_todo", title: "B" } })
    ledgerCmd.ledgerUpdate({ cwd: proj, id: id2, patch: { status: "待设计" } })
    let gateMsg = null
    try {
      ledgerCmd.ledgerUpdate({ cwd: proj, id: id2, patch: { status: "在途", task_book: "docs-repo/missing.md" } })
      assert.fail("应拒")
    } catch (e) { gateMsg = e.message }
    assert.ok(gateMsg.startsWith("ledgerUpdate：task_book 指向的档不存在：docs-repo/missing.md（解析 = "), "写门文案（声明源前缀·缺）")

    const { DatabaseSync } = await import("node:sqlite")
    const [vkey] = mig.legacyKeyVariants(proj)
    const db = new DatabaseSync(join(ledgerDir, `${vkey}.db`))
    db.exec(`CREATE TABLE items (id INTEGER PRIMARY KEY, kind TEXT, status TEXT, title TEXT, board TEXT, req_doc TEXT, task_book TEXT, evidence TEXT, trigger TEXT, executor TEXT, created_at TEXT, updated_at TEXT, closed_at TEXT)`)
    const ins = db.prepare(`INSERT INTO items (kind, status, title, task_book) VALUES (?, ?, ?, ?)`)
    ins.run("tech_todo", "在途", "hit", "docs-repo/x.md")
    ins.run("tech_todo", "在途", "missing", "docs-repo/missing.md")
    db.close()
    const plan = mig.planLedgerMigration(proj)
    const byId = Object.fromEntries(plan.flags.map((f) => [f.id, f.flag]))
    assert.equal(byId[1], undefined, "迁移旗：声明源命中 ⇒ 零旗")
    assert.equal(byId[2], gateMsg.replace(/^ledgerUpdate：/, ""), "迁移旗 = 写门文案去前缀（同源同判）")
  } finally { ledgerDb._resetLedgerDirForTest() }
})

// ─────────────────────────────── L2 · #848 ───────────────────────────────

test("L2 #848 basis：schema 可选 + 回显 / 缺省提示（不阻断）/ failed 零段", async () => {
  const vt = await mod("thincoder-core/agent-tools/verify.mjs")
  const base = mkTmp("848")
  const proj = join(base, "proj")
  mkdirSync(join(proj, "src"), { recursive: true })
  writeFileSync(join(proj, "PROJECT-MANIFEST.json"), JSON.stringify({ codePaths: ["src"] }))
  const codeFile = join(proj, "src", "a.mjs")
  writeFileSync(codeFile, "export const x = 1\n")
  const mkCtx = () => ({ agent: { cwd: proj, _touchedFiles: [codeFile], tasks: [] }, signal: undefined })

  const s = vt.verifyTool.parameters.properties.verification
  assert.equal(s.properties.basis?.type, "string", "basis 可选（string）")
  assert.deepEqual(s.required, ["status"], "required 仍 = [status]")
  const c1 = mkCtx()
  assert.ok((await vt.verifyTool.execute({ verification: { status: "passed", basis: "read thincoder-core/tools/file.mjs:25" } }, c1)).includes("  basis: read thincoder-core/tools/file.mjs:25"), "basis ⇒ 回显")
  assert.equal(c1.agent._verifyPassed, true, "passed 放行（零变）")
  const c2 = mkCtx()
  const out2 = await vt.verifyTool.execute({ verification: { status: "passed" } }, c2)
  assert.ok(out2.includes("basis: not declared (advisory"), "缺 basis ⇒ 提示行（advisory）")
  assert.equal(c2.agent._verifyPassed, true, "提示不阻断")
  const c3 = mkCtx()
  const out3 = await vt.verifyTool.execute({ verification: { status: "failed", basis: "b" } }, c3)
  assert.ok(out3.includes("VERIFY BLOCKED"), "failed ⇒ 打回（零变）")
  assert.ok(!out3.includes("basis"), "failed 面零 basis 段")
})

// ─────────────────────────────── L3 · #842（读数）───────────────────────────────

test("L3 #842 loadModels：缺渠 ⇒ 全渠扇出 ∥ 失败 ⇒ none+report ∥ 空 ⇒ 零候选", async () => {
  const { createReads } = await mod("thincoder-desktop/renderer/mount-settings-reads.mjs")
  const asks = []
  const reports = []
  let slices = {}
  let behavior = { ok: true, models: [{ provider: "p1", id: "m1", effortEnum: [], thinkOff: false }, { provider: "p2", id: "m2", effortEnum: [], thinkOff: false }], unavailable: [] }
  const reads = createReads({
    ask: async (channel, payload) => { asks.push([channel, payload]); return behavior },
    store: { get: () => ({ settings: slices }) },
    setSettings: (patch) => { slices = { ...slices, ...patch } },
    report: (...args) => reports.push(args),
  })
  await reads.loadModels(null)
  assert.deepEqual(asks, [["model:catalog", undefined]], "缺渠 ⇒ `model:catalog` 无载荷扇出 ∧ 零 `model:list`")
  assert.equal(slices.model.state, "ready", "段 ready（#842 前 = none 零请求）")
  assert.equal(slices.model.provider, null, "无激活渠（行自带渠）")
  assert.deepEqual(slices.model.models, behavior.models, "候选 = 全渠行 `{ provider, id }`")
  await reads.loadModels("")
  assert.equal(asks.length, 2, "空串同判（全渠扇出）")

  behavior = { ok: false, reason: "probe-down" }
  await reads.loadModels(null)
  assert.equal(slices.model.state, "none", "catalog 失败 ⇒ 段 none")
  assert.deepEqual(slices.model.models, [], "失败 ⇒ 零候选（禁假造）")
  assert.deepEqual(reports.at(-1), ["model", behavior, "model:catalog"], "失败零静默（report 携通道）")

  behavior = { ok: true, models: [] }
  await reads.loadModels(null)
  assert.equal(slices.model.state, "ready", "无已配渠 ⇒ 段 ready")
  assert.deepEqual(slices.model.models, [], "零候选（空态词归视图）")

  behavior = { ok: true, models: [{ id: "m1", effortEnum: [], thinkOff: false }] }
  await reads.loadModels("p1")
  assert.deepEqual(asks.at(-1), ["model:list", { provider: "p1" }], "有渠 ⇒ `model:list`（判据零变）")
  assert.equal(slices.model.state, "ready")
  assert.equal(slices.model.provider, "p1")
})

// ─────────────────────────────── L4 · #842（视图 + 同链）───────────────────────────────

test("L4 #842 带渠行 + 投影穿透 + 同链（向导零档改）", async () => {
  const { initDict } = await mod("thincoder-desktop/renderer/i18n.mjs")
  initDict({ locale: "en" })
  const { modelChoicesTree } = await mod("thincoder-desktop/renderer/views/settings-sections.mjs")
  const { settingsModel } = await mod("thincoder-desktop/renderer/views/settings.mjs")
  const calls = []
  const handlers = { onUseModel: (provider, id) => calls.push([provider, id]) }

  const fanout = { state: "ready", provider: null, current: null, models: [{ provider: "p1", id: "m1" }, { provider: "p2", id: "m2" }] }
  const rows = modelChoicesTree(fanout, handlers)
  assert.equal(rows.length, 2, "全渠候选行")
  assert.equal(rows[0].children[0].children[0], "p1 · m1", "行显示 `provider · id`")
  assert.equal(rows[0].props["data-model"], "m1", "行键 = id")
  rows[1].children[1].props.onClick()
  assert.deepEqual(calls, [["p2", "m2"]], "采用 ⇒ onUseModel(行自带渠, id)")
  const cur = modelChoicesTree({ ...fanout, current: "p1:m1" }, handlers)
  assert.equal(cur[0].props["data-current"], "", "当前项 = `current === provider:id`")
  assert.equal(cur[0].children[1].props.disabled, true, "当前项非采用控件")
  const noChannel = modelChoicesTree({ state: "ready", provider: null, current: null, models: [{ id: "m1" }] }, handlers)
  assert.equal(noChannel[0].children[1].props.disabled, true, "无渠 ⇒ 非死控（禁假造）")

  const normal = modelChoicesTree({ state: "ready", provider: "p1", current: "p1:m1", models: ["m1", "m2"] }, handlers)
  assert.equal(normal[0].children[0].children[0], "m1", "常规面显示零变（裸 id）")
  assert.equal(normal[0].props["data-current"], "", "常规面当前项照旧")
  assert.equal(normal[0].children[1].props.disabled, true, "常规面当前项禁用照旧")
  normal[1].children[1].props.onClick()
  assert.deepEqual(calls.at(-1), ["p1", "m2"], "常规面采用 ⇒ onUseModel(激活渠, id)（零变）")
  const empty = modelChoicesTree({ state: "ready", provider: null, current: null, models: [] }, handlers)
  assert.equal(empty.length, 1)
  assert.equal(empty[0].props["data-empty"], "", "零候选 ⇒ 空态词（禁假造）")

  const projected = settingsModel({ settings: { model: { state: "ready", provider: null, current: null, models: [{ provider: "p1", id: "m1" }] } } })
  assert.deepEqual(projected.model.models, [{ id: "m1", provider: "p1" }], "投影带渠穿透（视图消费面）")
  assert.deepEqual(settingsModel({ settings: { model: { state: "ready", provider: "p1", current: "p1:m1", models: ["m1"] } } }).model.models, [{ id: "m1", provider: null }], "串行投影零变（provider = null）")

  const mount = text("thincoder-desktop/renderer/mount-settings.mjs")
  assert.ok(mount.includes("loadModels: reads.loadModels"), "注入点 = 同一 loadModels 引用（设置面 ∥ 向导同链）")
  assert.ok(mount.includes("useModel: exits.handlers.onUseModel"), "「采用」同经同一出口")
  assert.ok(text("thincoder-desktop/renderer/mount-onboarding.mjs").includes("void loadModels("), "向导步入步 2 ⇒ 调用同一注入引用")
  assert.ok(text("thincoder-desktop/renderer/views/onboarding.mjs").includes("modelChoicesTree(model.model, handlers)"), "向导步 2 复用 modelChoicesTree（单一 owner）")

  // 采用写盘（真出口族 · 全桩）：onUseModel ⇒ 既有 `settings:agent` 写径 + 写后回读（零新 IPC／写面）
  const { createExits } = await mod("thincoder-desktop/renderer/mount-settings-exits.mjs")
  const wire = []
  const exitsState = { settings: { providers: { providers: [] }, model: { state: "ready", provider: null, current: null, models: [] } } }
  const exits = createExits({
    ask: async (channel, payload) => { wire.push([channel, payload]); return { ok: true, fields: [] } },
    store: { get: () => exitsState, set: (next) => { exitsState.settings = { ...exitsState.settings, ...next }; return exitsState } },
    setSettings: (patch) => { exitsState.settings = { ...exitsState.settings, ...patch } },
    report: () => {}, clearReport: () => {}, occupies: () => false,
    reads: { loadProviders: async () => { wire.push(["re-read"]) }, loadModels: async () => {} },
    onProvidersChanged: null, invalidateDrafts: () => {}, slot: "[data-slot=settings]", paintSettings: () => {},
  })
  await exits.handlers.onUseModel("p2", "m2")
  assert.deepEqual(wire, [["settings:agent", { patch: { defaultModel: "p2:m2" } }], ["re-read"]], "采用 ⇒ 既有写径 + 写后回读（零新 IPC／写面）")
})

// ─────────────────────────────── L5 · #863（/undo）───────────────────────────────

test("L5 #863 /undo 双上界 + cmd-undo oversize 分支（不回退 ∥ 不误删）", async () => {
  const undo = await mod("thincoder-core/undo-stack.mjs")
  const { handleUndoCommand } = await mod("thincoder-cli/src/tui/cmd-undo.mjs")
  const base = mkTmp("863")
  assert.deepEqual([undo.MAX_UNDO, undo.MAX_UNDO_BYTES, undo.MAX_UNDO_TOTAL_BYTES], [50, 10_000_000, 64_000_000], "双上界常量")
  const small = join(base, "small.txt")
  writeFileSync(small, "hello")
  const big = join(base, "big.bin")
  writeFileSync(big, "")
  truncateSync(big, 10_000_001)
  const a = {}
  undo.snapshotForUndo(a, "write", { path: small }, base)
  assert.equal(a._undoStack[0].backup, "hello", "小档零回归")
  undo.snapshotForUndo(a, "write", { path: big }, base)
  assert.equal(a._undoStack[1].backup, null)
  assert.equal(a._undoStack[1].oversize, true, "超 10MB ⇒ oversize 占位（与「文件创建」态分判）")
  const e = {}
  for (let i = 0; i < 8; i++) { const f = join(base, `t${i}.bin`); writeFileSync(f, "x".repeat(9_000_000)); undo.snapshotForUndo(e, "write", { path: f }, base) }
  assert.equal(e._undoStack.length, 7, "总量 64MB 超限 ⇒ 逐最旧驱逐")
  assert.ok(!e._undoStack.some((x) => x.path.endsWith("t0.bin")), "最旧被逐")

  const fileOversize = join(base, "oversize.bin")
  writeFileSync(fileOversize, "keep")
  const created = join(base, "created.txt")
  writeFileSync(created, "x")
  const lines = []
  let captured = null
  const stackAgent = { cwd: base, _undoStack: [
    { tool: "write", path: created, backup: null, timestamp: 1 },
    { tool: "write", path: fileOversize, backup: null, oversize: true, timestamp: 2 },
  ] }
  const ctx = (idx) => ({ agent: stackAgent, pushLine: (t) => lines.push(t), showPicker: async (title, entries) => { captured = entries; return { idx } } })
  await handleUndoCommand(ctx(1))
  assert.ok(existsSync(fileOversize), "oversize 选中 ⇒ 不误删档（须先判 oversize 再判 backup === null）")
  assert.ok(lines.some((l) => /Cannot revert/.test(l)), "选中 ⇒ 提示行")
  assert.equal(stackAgent._undoStack.length, 2, "不回退（栈不变）")
  const rowText = captured.find((x) => x.idx === 1).text
  assert.ok(/no snapshot/.test(rowText) && !/was created/.test(rowText), "列表行与「文件创建」态分判")
  await handleUndoCommand(ctx(0))
  assert.equal(existsSync(created), false, "文件创建态 ⇒ 删除（旧行为零变）")
  assert.equal(stackAgent._undoStack.length, 0, "splice 语义零变（不可乱序回退）")
  const mod1 = join(base, "mod.txt")
  writeFileSync(mod1, "new")
  await handleUndoCommand({ agent: { cwd: base, _undoStack: [{ tool: "write", path: mod1, backup: "old", timestamp: 3 }] }, pushLine: (t) => lines.push(t), showPicker: async () => ({ idx: 0 }) })
  assert.equal(readFileSync(mod1, "utf8"), "old", "修改态 ⇒ 还原（旧行为零变）")
})

// ─────────────────────────────── L6 · #863（console）───────────────────────────────

test("L6 #863 console：采集 cap + 逐字标记 + 未超限零标记 + 拼接先于 offload", async () => {
  const dr = await mod("thincoder-core/agent/dispatch-run.mjs")
  const base = mkTmp("863c")
  const exec = (name, fn) => dr.runPreparedItem(
    { toolCall: { name, id: `call-${name}` }, tool: { readonly: true, execute: fn }, args: {} },
    { cwd: base, _logId: "r5" }, 0, undefined, {},
  )
  const flood = await exec("floodtool", async () => { for (let i = 0; i < 2000; i++) console.log(`flood ${i} ` + "x".repeat(30)); return "ok" })
  assert.equal(flood.ok, true)
  assert.equal((flood.result.match(/\[console truncated at 65536 chars\]/g) ?? []).length, 1, "段尾恰一行标记（逐字）")
  const m = /output too large \((\d+) chars total\)/.exec(flood.result)
  assert.ok(m && Number(m[1]) <= 65610, "采集有界（≤ 65536 + 接缝）+ 拼接超 64K ⇒ 落盘预览")
  const quiet = await exec("smalltool", async () => { console.log("a"); console.log("b"); return "ok" })
  assert.ok(quiet.result.includes("[console during smalltool]\na\nb"), "段直拼（零变）")
  assert.ok(!quiet.result.includes("truncated"), "未超限 ⇒ 零标记（负向锁）")
  const spliced = await exec("splicetool", async () => { console.log("z".repeat(10_000)); return "y".repeat(60_000) })
  assert.ok(spliced.result.includes("output too large"), "拼接先于 offload（旧形不落）")
})

// ─────────────────────────────── L6b · #863（advisor 回收 · 甲面移录）───────────────────────────────

test("L6b #863 advisor 回收：关闭轻量化 ∥ F2h 复用 ∥ Map 不随代数单调增", async () => {
  const aa = await mod("thincoder-core/agent-tools/advisor-async.mjs")
  const dt = await mod("thincoder-core/agent-tools/design-token.mjs")
  const base = mkTmp("863adv")
  const docA = join(base, "docA.md")
  writeFileSync(docA, "# a\n")
  // ① approval 关 ⇒ priorOutput = null（design-token 关闭点——AC-863-4）
  const agent0 = { cwd: base, _engDesignTokens: new Map(), _role: "main" }
  const run = { reviewId: "r", reviewType: "design", designId: "d1", round: 1, priorOutput: "BIG", stale: false, open: true, docSetKey: "k" }
  const TOKEN = "11111111-1111-4111-8111-111111111111:4102444800000"
  const settled = dt.settleDesignReview(agent0, run, TOKEN, `# Review\n\nAll good.\n\nVERDICT: pass\n\n${TOKEN}`)
  assert.equal(settled.passed, true)
  assert.equal(run.open, false)
  assert.equal(run.priorOutput, null, "关闭点轻量化")
  // ② F2h designId 复用零变 ∧ 同 docSetKey 保最新 closed ∧ 余者回收
  const agent = { cwd: base }
  const L1 = aa.resolveAdvisorLaunch(agent, "design", { documents: [docA] })
  assert.equal(L1.isNew, true)
  L1.run.open = false
  L1.run.priorOutput = null
  const L2 = aa.resolveAdvisorLaunch(agent, "design", { documents: [docA] })
  assert.equal(L2.designId, L1.designId, "F2h：同 docSetKey 复用 designId")
  assert.equal(agent._advisorRuns.size, 2)
  L2.run.open = false
  const L3 = aa.resolveAdvisorLaunch(agent, "design", { documents: [docA] })
  assert.equal(L3.designId, L2.designId)
  assert.equal(agent._advisorRuns.size, 2, "去重回收：保最新 closed")
  assert.ok(!agent._advisorRuns.has(L1.reviewId) && agent._advisorRuns.has(L2.reviewId) && agent._advisorRuns.has(L3.reviewId))
  // ③ code：新实例创建 ⇒ closed 清除（Map 不随代数单调增——AC-863-5）
  const agent2 = { cwd: base }
  const C1 = aa.resolveAdvisorLaunch(agent2, "code")
  assert.equal(agent2._advisorRuns.size, 1)
  C1.run.open = false
  const C2 = aa.resolveAdvisorLaunch(agent2, "code")
  assert.equal(agent2._advisorRuns.size, 1, "Map 不随代数单调增")
  assert.ok(!agent2._advisorRuns.has(C1.reviewId) && agent2._advisorRuns.has(C2.reviewId))
  // ④ 关闭口 ⇒ 关闭 + priorOutput 释放（AC-863-4）
  const agent3 = { cwd: base }
  const R = aa.resolveAdvisorLaunch(agent3, "code")
  R.run.round = 2
  R.run.priorOutput = "X".repeat(500)
  assert.equal(aa.closeOpenCodeAdvisorRuns(agent3), true)
  assert.equal(R.run.open, false)
  assert.equal(R.run.priorOutput, null)
})

// ─────────────────────────────── L7 · #867（版本门）───────────────────────────────

test("L7 #867 版本门：纯函数假版本 + 接线静态 + 真机直调", () => {
  const gate = require(resolve(ROOT, "thincoder-cli/bin/node-version-gate.cjs"))
  assert.equal(gate.nodeVersionError("20.0.0"), "thincoder requires Node.js >= 24 (current: 20.0.0)", "假旧版 ⇒ 逐字一行")
  assert.equal(gate.nodeVersionError("23.9.9"), "thincoder requires Node.js >= 24 (current: 23.9.9)", "次版本不救")
  assert.equal(gate.nodeVersionError("24.0.0"), null, "达标 ⇒ null")
  assert.equal(gate.nodeVersionError(process.versions.node), null, "真机版本达标")
  assert.equal(gate.enforceNodeMajor(), undefined, "真机腿：执行门直调 ⇒ 静默返回（不 exit）")
  const shim = text("thincoder-cli/bin/thincoder.cjs")
  const iGate = shim.indexOf('require("./node-version-gate.cjs").enforceNodeMajor()')
  const iMain = shim.indexOf('import("./thincoder.mjs")')
  assert.ok(iGate !== -1 && iMain !== -1 && iGate < iMain, "接线：执行门先于 `.mjs` 链 import（ESM 静态求值之前）")
  // 端到端（子进程）：假旧版（`process.versions.node` 直写）⇒ 逐字一行 + exit 1（fail-fast——不触达后续）
  const script = `Object.defineProperty(process.versions,"node",{value:"20.0.0"});require(${JSON.stringify(resolve(ROOT, "thincoder-cli/bin/node-version-gate.cjs"))}).enforceNodeMajor();console.log("SURVIVED")`
  const child = spawnSync(process.execPath, ["-e", script], { encoding: "utf8" })
  assert.equal(child.status, 1, "不达标 ⇒ exit 1")
  assert.equal(child.stderr.trim(), "thincoder requires Node.js >= 24 (current: 20.0.0)", "stderr = 逐字一行（当前版本 = 假版本串）")
  assert.ok(!child.stdout.includes("SURVIVED"), "不触达后续（fail-fast）")
})

// ─────────────────────────────── L7b · #867（SKIP_DIRS · 甲面移录）───────────────────────────────

test("L7b #867 SKIP_DIRS 两新项：Library ∥ go（basename 任意深度剪枝）", async () => {
  const fw = await mod("thincoder-core/memory/file-walk.mjs")
  const sch = await mod("thincoder-core/memory/schema.mjs")
  assert.ok(sch.SKIP_DIRS.has("Library"), "`Library` 在册（macOS 用户目录项）")
  assert.ok(sch.SKIP_DIRS.has("go"), "`go` 在册（Go 工作区）")
  assert.equal(fw.isSkippedRelPath("Users/lwei/Library/x.md"), true, "任意深度剪枝（Library）")
  assert.equal(fw.isSkippedRelPath("home/go/pkg/mod/x.go"), true, "任意深度剪枝（go）")
  assert.equal(fw.isSkippedRelPath("src/library.js"), false, "大小写敏感 basename（负向锁）")
  assert.equal(fw.isSkippedRelPath("src/golang/x.go"), false, "非同名目录不剪（负向锁）")
})

// ─────────────────────────────── L8 · #867（home）───────────────────────────────

test("L8 #867 home 检测：零索引 + 提示行（startup ∥ /reindex）", async () => {
  const { backgroundIndex } = await mod("thincoder-cli/src/tui/startup.mjs")
  const { handleReindexCommand } = await mod("thincoder-cli/src/tui/cmd-reindex.mjs")
  const home = homedir()
  const lines = []
  const state = { status: "initial" }
  const memory = new Proxy({}, { get() { throw new Error("index touched — home guard missed") } })
  await backgroundIndex({ agent: { cwd: home, memory }, state, render: () => {}, pushLine: (t) => lines.push(t) })
  assert.equal(lines.length, 1, "恰一行提示（不阻断启动）")
  assert.ok(lines[0].includes("[index]") && /home/i.test(lines[0]), "提示行含出路")
  assert.equal(state.status, "initial", "零索引（status 未动 ∥ memory 零触）")

  const lines2 = []
  const db = new Proxy({}, { get() { throw new Error("table touched — home guard missed") } })
  await handleReindexCommand({ agent: { cwd: home, memory: { db } }, distillOpts: {}, pushLine: (t) => lines2.push(t) })
  assert.equal(lines2.length, 1, "/reindex ⇒ 恰一行提示")
  assert.ok(lines2[0].includes("[reindex]") && /home/i.test(lines2[0]), "提示行（同款）")

  const project = mkTmp("867p")
  const lines3 = []
  let touched = false
  const boom = new Proxy({}, { get() { touched = true; throw new Error("reached existing path") } })
  try { await handleReindexCommand({ agent: { cwd: project, memory: { db: boom } }, distillOpts: {}, pushLine: (t) => lines3.push(t) }) } catch { /* 假 memory 在既有径内崩 —— 预期 */ }
  assert.ok(touched && lines3.some((l) => l.includes("[reindex] Rebuilding index...")), "非 home ⇒ 守卫不误触发（进既有径）")
  assert.ok(!lines3.some((l) => /Skipped/.test(l)), "非 home ⇒ 零跳过提示")
  assert.ok(text("thincoder-cli/src/tui/index.mjs").includes("backgroundIndex({ agent, state, render, pushLine })"), "提示口接线（index.mjs 调用点）")
  if (process.platform === "win32") {
    // 平台归一（win32 大小写不敏感——两触发面同判）：case 变体入参 ⇒ 仍判 home（零索引 + 提示）
    const lines4 = []
    await backgroundIndex({ agent: { cwd: home.toUpperCase(), memory }, state: { status: "v" }, render: () => {}, pushLine: (t) => lines4.push(t) })
    assert.equal(lines4.length, 1, "startup：win32 case 变体同判 home（resolve 后平台归一）")
    const lines5 = []
    await handleReindexCommand({ agent: { cwd: home.toUpperCase(), memory: { db } }, distillOpts: {}, pushLine: (t) => lines5.push(t) })
    assert.equal(lines5.length, 1, "/reindex：win32 case 变体同判 home")
  }
})

// ─────────────────────────────── L9 · 负向锁 ───────────────────────────────

test("L9 负向锁：CLI 死副本零残留 ∥ thincoder.mjs 零触", () => {
  assert.ok(!/function\s+snapshotForUndo\b/.test(text("thincoder-cli/src/tui/cmd-undo.mjs")), "CLI 死副本清除（单源 = 核 `undo-stack.mjs`）")
  assert.ok(!/MAX_UNDO[A-Z_]*\s*=/.test(text("thincoder-cli/src/tui/cmd-undo.mjs")), "上界常量不复抄（禁本档常量声明）")
  assert.ok(text("thincoder-cli/src/tui/cmd-undo.mjs").includes('from "@thincoder/core/undo-stack.mjs"'), "单源消费在位（核导出面 import）")
  assert.ok(!text("thincoder-cli/bin/thincoder.mjs").includes("node-version-gate"), "`thincoder.mjs` 零触（校验点 = `.cjs` shim 首行）")
})
