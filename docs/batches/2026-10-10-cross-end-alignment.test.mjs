/**
 * 2026-10-10-cross-end-alignment.test.mjs — 批内件（跨端对齐批 · 台账 #821 ∥ #1011 ∥ #1046 · 实施轮）。
 * 任务书 = `docs/batches/2026-10-10-cross-end-alignment.md` §2（§三.1 归一向 ∥ §三.2 随正 ∥ §三.3 行集化；
 * §四 落地表；§六 AC-1..AC-5；评审 #3 裁定：errPart 移位仅 error 面 ∥ 评审 #4 裁定：拒收三判据入 L4）。
 * 四腿：
 *   L1 事实面（平 node 直测）：冻结单点 `errored`（非停止 ∧ lastError ⇒ 在场；纯 done / stopped ⇒ 零事实）∥
 *      合成件 `errored`（error ∥ failed ⇒ true；stopped/done/缺省/未知 ⇒ false）∥ 记录往返同判
 *      （`subagentRecord` status ⇄ `synthSubTask` errored）。
 *   L2 CLI 成品形（`historyToLines` + `frozenSubSeg` 直驱——沿 #795 批件 L3 先例）：错误面 =
 *      `[⏹ … · error Ns · turn t/m] — err`（注记括号外）∥ 负控面逐字（stopped ∥ done ∥ waiting ∥
 *      ⏸ 审批优先级；errPart 内容零改——仅 error 面移位）。
 *   L3 跨端对拍（同 meta：CLI 折叠头 vs 核件 `refreshBlock` ⇒ `.sub-hdr`——icon ∥ verb ∥ 注记位
 *      三段对齐；happy-dom 真链，沿 #794 批件 L2 先例；禁复制字面 = 两侧实件直出对拍）。
 *   L4 CLI `/mcp` 行集（stub-ctx 直驱 `fieldPicker`）：值含逗号/等号/引号存取往返保真 ∥ 加/删/改
 *      三操作 ∥ 提交四判据（trim ∥ 空行不提交 ∥ 重复后行胜 ∥ 全空删字段）∥ 拒收三判据（空键 ∥ 空值 ∥
 *      无 `=`）∥ 串式半语法零残留（行为 + 源扫）∥ 敏感值掩码。
 * 跑法（仓根 thincoder/）：`node --test docs/batches/2026-10-10-cross-end-alignment.test.mjs`
 * 纪律：平 node · 零网络 · 零第三方新增（happy-dom = 仓内既有 devDep，实读在盘）；随批留存 · 不进仓套件。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"
import "../../thincoder-desktop/test/rc-resolve.mjs" // `/rc/` 解析钩子（桌面链取件——须先于核件模块装载）

const ROOT = process.cwd()
if (!readFileSync(resolve(ROOT, "thincoder-core/context.mjs"), "utf8")) throw new Error(`从仓库根（thincoder/）运行（cwd = ${ROOT}）`)
const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)

// ─── happy-dom 真 DOM（实读在盘：`thincoder-vscode/node_modules/@happy-dom/**`——沿批内件先例）──
const { GlobalRegistrator } = await import(pathToFileURL(resolve(ROOT, "thincoder-vscode/node_modules/@happy-dom/global-registrator/lib/index.js")).href)
GlobalRegistrator.register()
if (typeof Element.prototype.scrollIntoView !== "function") Element.prototype.scrollIntoView = function () {} // happy-dom 缺项垫片

// ─── 词面注入（canonical 词面——核 i18n 单实例：VSC shim 与桌面链 `/rc/` 同源；两侧同表方有对拍义）──
const wi18n = await mod("thincoder-vscode/webview/i18n.js")
wi18n.setStrings({
  "sub.done": "done", "sub.error": "error", "sub.stopped": "stopped", "sub.async": "async",
  "sub.sync": "sync", "sub.queued": "queued", "sub.waiting": "waiting", "sub.thinking": "thinking",
})
assert.equal(wi18n.t("sub.error"), "error", "词面注入生效（single-instance 前提——本件隐性前提）")

// ─── 模块装载：CLI 四件 ∥ 桌面链三件（核件 `refreshBlock` 真链）─────────────────────────────
const [freeze, lifecycle, startup, segments, form] = await Promise.all([
  mod("thincoder-cli/src/tui/subagent-freeze.mjs"), // 冻结单点（`freezeSubTaskLines`）
  mod("thincoder-cli/src/tui/lifecycle-records.mjs"), // 记录形 ∥ `synthSubTask`
  mod("thincoder-cli/src/tui/startup.mjs"), // CLI 重放（`historyToLines`）
  mod("thincoder-cli/src/tui/render-segments.mjs"), // CLI 折叠头（`frozenSubSeg`）
  mod("thincoder-cli/src/tui/cmd-mcp-form.mjs"), // #1046 行集编辑（`fieldPicker`）
])
const [pageRead, chatSubagent, dom] = await Promise.all([
  mod("thincoder-desktop/renderer/page-read.mjs"), // 记录 ⇒ 块归一（`blockOfMessage`）
  mod("thincoder-desktop/renderer/views/chat-subagent.mjs"), // 回显链（壳 + 核件）
  mod("thincoder-desktop/renderer/dom.mjs"), // 描述符建树（壳）
])

// ─── 夹具 ─────────────────────────────────────────────────────────────────────────────────

const segState = { foldEnabled: true } // CLI 折叠段状态最小形（`frozenSubSeg` 只读 fold 面）

/** 冻结桩：桩 state + 桩 sub 过冻结单点（真驱动）。 */
function freezeOne(fields = {}) {
  const state = { lines: [], subTasks: {} }
  const sub = { key: "eng-coder#5", role: "eng-coder", model: "glm", started: 1000, doneAt: 2000, turn: 2, maxTurns: 100, blocks: [], ...fields }
  freeze.freezeSubTaskLines(state, sub)
  return { state, sub }
}

/** CLI 折叠头（桩 sub 直驱）：默认桩字段 + 冻结载体行 ⇒ `frozenSubSeg` 首行（`▶ ` 之后到 ` … subagent activity` 之前）。 */
function cliHeadOfSub(fields = {}) {
  const { state } = freezeOne(fields)
  const carrier = state.lines.find((l) => l._frozenSubTask)
  const first = segments.frozenSubSeg(segState, carrier, 0, 100, 30)[0].text
  return first.slice(first.indexOf("["), first.lastIndexOf(" … subagent activity"))
}

/** CLI 折叠头（记录直驱）：记录 ⇒ `historyToLines` ⇒ 冻结载体行 ⇒ `frozenSubSeg`。 */
function cliHeadOfRecord(rec) {
  const lines = startup.historyToLines([rec], 0, 1)
  const carrier = lines.find((l) => l._frozenSubTask)
  const first = segments.frozenSubSeg(segState, carrier, lines.indexOf(carrier), 100, 30)[0].text
  return first.slice(first.indexOf("["), first.lastIndexOf(" … subagent activity"))
}

/** 记录夹具（CLI 写面形：`meta` 块头事实 + rows）。 */
const rec = (status, extra = {}) => ({
  kind: "subagent", ts: 1,
  meta: { key: "sub:eng-coder#5", role: "eng-coder", model: "glm", startedAt: 1000, doneAt: 2000, turn: 2, maxTurns: 100, pool: false, status, ...extra },
  rows: [],
})

/** 桌面读面（核件真链——沿 #794 批件 L2 先例）：记录 ⇒ `blockOfMessage` ⇒ 壳 ⇒ `fillSubagentEcho` ⇒ `.sub-hdr`。 */
function coreHeadOf(rec0) {
  const [block] = pageRead.blockOfMessage(rec0)
  const shell = dom.build(chatSubagent.subagentNode(block, "0"))
  chatSubagent.fillSubagentEcho(shell, block)
  return shell.querySelector(".advisor-block").querySelector(".sub-hdr").textContent
}

/** L4 stub-ctx：picks/answers 逐调用取脚本（真 `fieldPicker` 驱动；零终端）。 */
function stubCtx({ picks = [], answers = [] } = {}) {
  const rec0 = { titles: [], entries: [], asks: [], pushes: [] }
  let pi = 0
  let ai = 0
  const ctx = {
    // 脚本耗尽 = 响亮失败（防流程变更后静默降级为「取消 ∥ 空=不变」）；流程尾须以显式 `null` 收（= Esc）。
    showPicker: async (title, entries) => {
      rec0.titles.push(title); rec0.entries.push(entries)
      if (pi >= picks.length) throw new Error(`stub 脚本耗尽（picker #${pi + 1}「${title}」——脚本未覆盖本调用）`)
      return picks[pi++]
    },
    askQuestion: async (prompt) => {
      rec0.asks.push(prompt)
      if (ai >= answers.length) throw new Error(`stub 脚本耗尽（问句 #${ai + 1}「${prompt}」——脚本未覆盖本调用）`)
      return answers[ai++]
    },
    pushLine: (text, color) => rec0.pushes.push({ text, color }),
  }
  return { ctx, rec: rec0 }
}

// ─── L1 · 事实面（冻结单点 ∥ 合成件 ∥ 记录往返）──────────────────────────────────────────────

test("L1-1 冻结单点：非停止 ∧ lastError ⇒ `errored` 在场 ∥ 纯 done ∥ stopped ∥ 无 lastError ⇒ 零事实", () => {
  assert.equal(freezeOne({ lastError: "boom" }).sub.errored, true, "非停止 ∧ lastError ⇒ errored（与写面 status 推导同式）")
  assert.equal(freezeOne({}).sub.errored, undefined, "纯 done ⇒ 零事实")
  assert.equal(freezeOne({ lastError: null }).sub.errored, undefined, "lastError 缺 ⇒ 零事实")
  assert.equal(freezeOne({ stopped: true, lastError: "boom" }).sub.errored, undefined, "stopped 面 ⇒ 零置（写面 status = stopped——停止面优先）")
})

test("L1-2 合成件：`error` ∥ `failed` ⇒ errored=true；stopped ∥ done ∥ 缺省 ∥ 未知 ⇒ false", () => {
  const synth = (status) => lifecycle.synthSubTask({ meta: { key: "sub:eng-coder#5", role: "eng-coder", status }, rows: [] })
  assert.equal(synth("error").errored, true, "错误面词 error")
  assert.equal(synth("failed").errored, true, "错误面词 failed（§6.26 判据②词集）")
  for (const status of ["stopped", "cancelled", "terminated", "done", "settled", "answered", undefined, "weird"]) {
    assert.equal(synth(status).errored, false, `非错误面（${String(status)}）⇒ false（缺省 ∥ 未知照 done——沿 #795 判据）`)
  }
})

test("L1-3 记录往返同判：`subagentRecord` status ⇄ `synthSubTask` errored（写读两缝同式）", () => {
  const errSub = { key: "eng-coder#5", role: "eng-coder", started: 1000, doneAt: 2000, turn: 2, maxTurns: 100, lastError: "boom" }
  const errRec = lifecycle.subagentRecord(errSub)
  assert.equal(errRec.meta.status, "error", "写面：非停止 ∧ lastError ⇒ status=error")
  assert.equal(lifecycle.synthSubTask(errRec).errored, true, "读面：该记录 ⇒ errored（往返保真）")
  const doneRec = lifecycle.subagentRecord({ key: "eng-coder#5", role: "eng-coder", started: 1000, doneAt: 2000 })
  assert.equal(doneRec.meta.status, "done", "写面：纯 done")
  assert.equal(lifecycle.synthSubTask(doneRec).errored, false, "读面：纯 done ⇒ 非错误面")
  const stopRec = lifecycle.subagentRecord({ key: "eng-coder#5", role: "eng-coder", started: 1000, doneAt: 2000, stopped: true, lastError: "interrupted" })
  assert.equal(stopRec.meta.status, "stopped", "写面：stopped 优先")
  const stopSynth = lifecycle.synthSubTask(stopRec)
  assert.deepEqual([stopSynth.errored, stopSynth.stopped], [false, true], "读面：stopped 面（不并错误面）")
})

// ─── L2 · CLI 成品形（冻结路径 ∥ 记录路径 + 负控面逐字）────────────────────────────────────

test("L2-1 成品形 · 错误面：`[⏹ … · error Ns · turn t/m] — err`（注记括号外）——冻结 ∥ 记录两路同形", () => {
  const live = cliHeadOfSub({ lastError: "boom", doneAt: 2000 })
  assert.equal(live, "[⏹ eng-coder#5 · sync · glm · error 1s · turn 2/100] — boom", `冻结路径成品形（实读：${live}）`)
  const rebuilt = cliHeadOfRecord(rec("error", { error: "boom" }))
  assert.equal(rebuilt, live, "记录路径同形（`errored` 两路同判）")
  assert.equal(cliHeadOfRecord(rec("failed", { error: "boom" })), live, "错误面词 failed ⇒ 同形")
  console.log(`[读数] L2-1: ${live}`)
})

test("L2-2 负控：stopped ∥ done ∥ waiting（queued）∥ ⏸ 审批四面逐字不变；errPart 内容零改（仅 error 面移位）", () => {
  assert.equal(cliHeadOfSub({ stopped: true, lastError: "boom", doneAt: 2000 }),
    "[⏹ eng-coder#5 · sync · glm · stopped 1s · turn 2/100 — boom]", "stopped 面（注记仍在括号内——逐字）")
  assert.equal(cliHeadOfSub({ stopped: true, doneAt: 2000 }),
    "[⏹ eng-coder#5 · sync · glm · stopped 1s · turn 2/100]", "stopped 面（无注记）")
  assert.equal(cliHeadOfSub({ doneAt: 2000 }),
    "[✓ eng-coder#5 · sync · glm · done 1s · turn 2/100]", "done 面")
  assert.equal(cliHeadOfSub({ queued: true, doneAt: 2000 }),
    "[✓ eng-coder#5 · waiting · glm · done 1s · turn 2/100]", "queued（waiting）面（不标 sync——未启动）")
  assert.equal(cliHeadOfSub({ approval: "write", stopped: true, lastError: "boom", doneAt: 2000 }),
    "[⏸ eng-coder#5 · sync · glm · stopped 1s · turn 2/100 — boom]", "⏸ 审批优先级不变（压过 ⏹）")
  assert.equal(cliHeadOfSub({ approval: "write", lastError: "boom", doneAt: 2000 }),
    "[⏸ eng-coder#5 · sync · glm · error 1s · turn 2/100] — boom", "⏸ + 错误面：icon 取 ⏸、注记位同错误面（三段互斥秩序：审批 > 错误）")
  // errPart 内容零改 = 文本逐字（含长文本无截断——仅移位）
  const longErr = "x".repeat(300)
  assert.ok(cliHeadOfSub({ lastError: longErr, doneAt: 2000 }).endsWith(`] — ${longErr}`), "errPart 文本内容零改（无截断——仅移位）")
  // AC-1 第四个负控面：awaitingDigest（挂起中间态——面板态词，单源 = subagent-panel.mjs 活区；冻结头零读）
  assert.equal(cliHeadOfSub({ awaitingDigest: true, doneAt: 2000 }), cliHeadOfSub({ doneAt: 2000 }),
    "awaitingDigest 面逐字不变（冻结头不读该字段——零泄漏进折叠头）")
})

// ─── L2b · U-C 披露面（本批接受——记录面词面化）────────────────────────────────────────

test("L2b U-C 披露面：携 lastError 的非停止块（interrupted ∥ turn-cap）随写面 status=error 词面化 = `⏹ error` + 括号外注记", () => {
  // 写面推导（`lifecycle-records.mjs` `subagentRecord`）= `stopped ? stopped : lastError ? error : done`——
  // 中断清场（`freezeAllSubTasks`：`lastError = "interrupted"`）∥ turn-cap 消息同落 status:"error" ⇒ 本批归一后
  // 显示随记录字面（改前 = `✓ done` + 括号内注记，与记录 status 相抵）。设计裁定 = 本批零动写面、接受该显示面化（U-C）。
  assert.equal(cliHeadOfSub({ lastError: "interrupted", doneAt: 2000 }),
    "[⏹ eng-coder#5 · sync · glm · error 1s · turn 2/100] — interrupted", "中断清场面（U-C 披露——显示随记录 status 字面）")
  assert.equal(cliHeadOfRecord(rec("error", { error: "interrupted" })),
    "[⏹ eng-coder#5 · sync · glm · error 1s · turn 2/100] — interrupted", "重建面同判（记录 status=error ⇒ 同形）")
})

// ─── L3 · 跨端对拍（CLI 折叠头 vs 核件 `.sub-hdr`——同 meta 逐字）──────────────────────

test("L3-1 跨端对拍 · 错误面：同 meta ⇒ CLI 折叠头 ≡ 核件 `.sub-hdr`（icon ∥ verb ∥ 注记位三段对齐）", () => {
  const r = rec("error", { error: "boom" })
  const cli = cliHeadOfRecord(r)
  const core = coreHeadOf(r)
  assert.ok(cli.startsWith("[⏹ ") && core.startsWith("[⏹ "), `icon 段对齐（CLI=${cli} ∥ 核=${core}）`)
  assert.ok(cli.includes(" · error 1s ") && core.includes(" · error 1s "), "verb 段对齐（error + 冻结耗时）")
  assert.ok(cli.endsWith("] — boom") && core.endsWith("] — boom"), "注记位对齐（括号外 ` — <err>`）")
  assert.equal(cli, core, "同 meta ⇒ 逐字同头（跨端归一面）")
  console.log(`[读数] L3-1: CLI ≡ 核件 = ${cli}`)
})

test("L3-2 跨端对拍 · done 面负控：同 meta ⇒ 两端口径逐字同（本批零动面）", () => {
  const r = rec("done")
  assert.equal(cliHeadOfRecord(r), coreHeadOf(r), "done 面两端口径同（本批零动——负控）")
})

// ─── L4 · CLI `/mcp` 行集（真 `fieldPicker` 驱动）───────────────────────────────────────

test("L4-1 行集往返：值含逗号 ∥ 等号 ∥ 引号 ∥ 空格保真（零切分零剥离）；加 ⇒ 行 +1 ∥ 改 ⇒ 原位 ∥ 删 ⇒ 行 −1", async () => {
  const entry = { name: "srv", url: "https://x", headers: { A: "1" } }
  const { ctx } = stubCtx({
    picks: [{ action: "field:headers" }, { action: "add" }, { action: "row:A" }, { action: "back" }, { action: "save" }],
    answers: ["KEY=va,lue", "x=y"],
  })
  const r = await form.fieldPicker(ctx, { title: "T", mode: "edit", entry, transport: "http" })
  assert.equal(r.action, "save", "Save 直通（entry 预填齐）")
  assert.deepEqual(r.entry.headers, { A: "x=y", KEY: "va,lue" }, "逗号值单对保真 ∥ 等号值原样 ∥ 改值原位（插入序保持）")
  const { ctx: ctx2 } = stubCtx({
    picks: [{ action: "field:headers" }, { action: "add" }, { action: "back" }, null],
    answers: ['Q="x"'],
  })
  const r2 = await form.fieldPicker(ctx2, { title: "T", mode: "edit", entry: { name: "s", url: "u", headers: {} }, transport: "http" })
  assert.equal(r2.entry.headers.Q, '"x"', "引号原样（零剥离——串式半语法退场）")
  const { ctx: ctx3, rec: log3 } = stubCtx({
    picks: [{ action: "field:headers" }, { action: "row:A" }, { action: "back" }, null],
    answers: ["-"],
  })
  const r3 = await form.fieldPicker(ctx3, { title: "T", mode: "edit", entry: { name: "s", url: "u", headers: { A: "1", B: "2" } }, transport: "http" })
  assert.deepEqual(r3.entry.headers, { B: "2" }, "`-` ⇒ 删该行（行集内删除）")
  const rowPicker = log3.entries.find((es) => es.some((e) => String(e.action ?? "").startsWith("row:"))) // 行集选择器 = 载 `row:<key>` 行的那一屏（零位次依赖）
  assert.ok(rowPicker.some((e) => e.text === "B=2"), "行集选择器逐对列示")
  assert.deepEqual(rowPicker.slice(-2).map((e) => e.text), ["＋ Add row", "← Back"], "末两行形态")
  assert.ok(rowPicker.some((e) => e.action === "row:B"), "行 action = `row:<key>`")
})

test("L4-2 提交四判据：trim ∥ 空行不提交 ∥ 重复键后行胜 ∥ 全空 ⇒ 字段删除", async () => {
  // 全空（唯余行删）⇒ 字段删除
  const { ctx } = stubCtx({
    picks: [{ action: "field:env" }, { action: "row:KEEP" }, { action: "back" }, null],
    answers: ["-"],
  })
  const r = await form.fieldPicker(ctx, { title: "T", mode: "edit", entry: { command: "npx", env: { KEEP: "1" } }, transport: "stdio" })
  assert.equal("env" in r.entry, false, "全删 ⇒ 字段删除（沿 GUI 全空 ⇒ 字段删除；零空对象残壳）")
  // trim：键 ∥ 值两端；内部空格原样
  const { ctx: ctx2 } = stubCtx({
    picks: [{ action: "field:headers" }, { action: "add" }, { action: "back" }, null],
    answers: ["  SP = padded value  "],
  })
  const r2 = await form.fieldPicker(ctx2, { title: "T", mode: "edit", entry: { name: "s", url: "u" }, transport: "http" })
  assert.deepEqual(r2.entry.headers, { SP: "padded value" }, "trim（键 ∥ 值两端）+ 内部空格原样")
  // 重复键 ⇒ 后行胜
  const { ctx: ctx3 } = stubCtx({
    picks: [{ action: "field:headers" }, { action: "add" }, { action: "add" }, { action: "back" }, null],
    answers: ["DUP=1", "DUP=2"],
  })
  const r3 = await form.fieldPicker(ctx3, { title: "T", mode: "edit", entry: { name: "s", url: "u" }, transport: "http" })
  assert.deepEqual(r3.entry.headers, { DUP: "2" }, "重复键 ⇒ 后行胜")
})

test("L4-3 拒收三判据：空键 ∥ 空值 ∥ 无 `=` ⇒ 拒 + 提示（零写入）；`-` 不再整串清空", async () => {
  const { ctx, rec: log } = stubCtx({
    picks: [{ action: "field:headers" }, { action: "add" }, { action: "add" }, { action: "add" }, { action: "add" }, { action: "back" }, null],
    answers: ["plain", "=v", "k=", "-"],
  })
  const r = await form.fieldPicker(ctx, { title: "T", mode: "edit", entry: { name: "s", url: "u", headers: { KEEP: "1" } }, transport: "http" })
  assert.deepEqual(r.entry.headers, { KEEP: "1" }, "四拒 ⇒ 零写入（存量行不动；`-` = 无 `=` 同拒——不再整串清空）")
  assert.equal(log.pushes.length, 4, "四拒各一提示")
  assert.ok(log.pushes.every((p) => p.text.startsWith("[mcp] ")), "提示形 `[mcp] …`（沿表内错误面）")
  assert.ok(log.pushes[0].text.includes("needs key=value"), `无 \`=\` ⇒ 提示（实读：${log.pushes[0].text}）`)
  assert.ok(log.pushes[1].text.includes("key is empty"), `空键 ⇒ 提示（实读：${log.pushes[1].text}）`)
  assert.ok(log.pushes[2].text.includes("value is empty"), `空值 ⇒ 提示（实读：${log.pushes[2].text}）`)
  assert.ok(log.pushes[3].text.includes("needs key=value"), "`-`（无 `=`）⇒ 同拒（串式「整串清空」退场）")
  // 拒后仍可加（拒 ≠ 卡死）
  const { ctx: ctx2 } = stubCtx({
    picks: [{ action: "field:headers" }, { action: "add" }, { action: "back" }, null],
    answers: ["OK=1"],
  })
  const r2 = await form.fieldPicker(ctx2, { title: "T", mode: "edit", entry: { name: "s", url: "u" }, transport: "http" })
  assert.deepEqual(r2.entry.headers, { OK: "1" }, "拒后正常追加在位")
})

test("L4-4 敏感值掩码：行集列示 ∥ 编辑问句两处脱敏（核 `isSensitiveKey` 单源）；非敏感值保可读", async () => {
  const { ctx, rec: log } = stubCtx({
    picks: [{ action: "field:headers" }, { action: "row:TOKEN" }, { action: "back" }, null],
    answers: ["newsecret"],
  })
  const r = await form.fieldPicker(ctx, { title: "T", mode: "edit", entry: { name: "s", url: "u", headers: { TOKEN: "secret1", PLAIN: "1" } }, transport: "http" })
  const texts = log.entries.find((es) => es.some((e) => String(e.action ?? "").startsWith("row:"))).map((e) => e.text) // 行集选择器（零位次依赖）
  assert.ok(texts.includes("TOKEN=••••"), "敏感键值位脱敏（行集列示）")
  assert.ok(texts.includes("PLAIN=1"), "非敏感值保可读")
  assert.ok(!texts.join("|").includes("secret1"), "行集列示零明文")
  assert.ok(!log.asks[0].includes("secret1"), "编辑问句零明文（current 段脱敏）")
  assert.ok(log.asks[0].includes("••••"), `问句 current = 掩码（实读：${log.asks[0]}）`)
  assert.ok(log.asks[0].includes("'-' removes; empty keeps"), "问句语义提示在位（`-` 删 ∥ 空=不变）")
  assert.equal(r.entry.headers.TOKEN, "newsecret", "字面设置（零剥离）")
  // 空 = 不变
  const { ctx: ctx2 } = stubCtx({
    picks: [{ action: "field:headers" }, { action: "row:PLAIN" }, { action: "back" }, null],
    answers: [""],
  })
  const r2 = await form.fieldPicker(ctx2, { title: "T", mode: "edit", entry: { name: "s", url: "u", headers: { PLAIN: "1" } }, transport: "http" })
  assert.equal(r2.entry.headers.PLAIN, "1", "空输入 = 不变")
})

test("L4-5 串式半语法零残留：源扫（`mergeKeyValuePairs` ∥ comma-separated ∥ 引号剥离 ∥ `-` 整串清空零命中）", () => {
  const src = readFileSync(resolve(ROOT, "thincoder-cli/src/tui/cmd-mcp-form.mjs"), "utf8")
  for (const dead of ["mergeKeyValuePairs", "comma-separated", "'-' clears all", 'split(",")']) {
    assert.ok(!src.includes(dead), `串式半语法零残留：\`${dead}\` 零命中`)
  }
  assert.ok(!/replace\(\/\^\["'\]/.test(src), "引号剥离正则零命中")
})

test("L4-6 桩守卫自证：脚本耗尽 ⇒ 响亮失败（防流程变更后静默降级为「取消 ∥ 空=不变」）", async () => {
  const { ctx } = stubCtx({ picks: [], answers: [] })
  await assert.rejects(
    () => form.fieldPicker(ctx, { title: "T", mode: "edit", entry: { name: "s", url: "u" }, transport: "http" }),
    /stub 脚本耗尽/,
    "零脚本驱动 ⇒ 首屏 picker 即抛（静默降级路径已封）")
})
