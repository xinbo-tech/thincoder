/**
 * 2026-10-01-digest-replay-choices.test.mjs — 批内件（消化重放口径批 · 台账 #771 ∥ #773 · 实施轮）。
 * 任务书 = `docs/batches/2026-10-01-digest-replay-choices.md` §2（以修复轮 1 收正面为准——归属 = **活流侧优先**）
 * ∥ 腿 1–7。机制单源 = `docs/core/design/SESSION.md` §6.26 ∥ `docs/desktop/design/RENDERER.md` §1.1。
 * 腿族：
 *   腿 1 未结轮照现（桌面 · 点名腿）：末页尾残轮（起跑 + cap、无 `end`）⇒ 照出该轮（起跑 ∥ 计数 ∥ cap——零终态）。
 *   腿 2 可证面（桌面）：轮间（后起跑已现）⇒ 产出 ∥ 非末页尾残 ⇒ 零产 ∥ 起跑未载的 `cap`/`end` ⇒ 零产 ∥
 *        末页未结 + 其后普通消息（非 digest 记录）⇒ 照现（判据 = 扫描结束仍 `open`）。
 *   腿 3 归属（桌面 · 活流侧优先）：运行期未结轮在场 ⇒ 单副本（运行期侧——其帧更新存续：`cap` ∥ `end` 就末轮）
 *        ∥ 运行期缺位（重开径）⇒ 折叠未结末轮照并入 ∥ 折叠末轮终态 ⇒ 运行期轮余整清 ∥ 零跨侧去重键（结构）。
 *   腿 4 `n = 0` 守句（桌面 · 点名腿）：`n = 0` 且 `end` ⇒ 行集 = [起跑行]（零计数 ∥ 零终态）；`n > 0` 对照。
 *   腿 5 位次门（#773）：起跑记录无 `idx`（终态 ∥ 未结两径）⇒ 该轮零产 ∥ 产出轮全体 `at` 数为断言。
 *   腿 6 VSC：末页尾残轮 ⇒ 起跑/cap 元素出（终态零）∥ 非末页尾残 ⇒ 零元素 ∥ 孤立 `end` ⇒ 零元素 ∥
 *        同页完整轮 ⇒ 起跑+计数+终态 ∥ `n = 0` ⇒ 零终态；6b = 页级 pass 接线（`older` 判面双向）；
 *        6c = 幂等（同页二次页级 pass ⇒ 同位 `[data-idx]` 命中 ⇒ 零新元素）。
 *   腿 7 CLI（薄腿）：`digestTraceLines`（`end`，`n = 0`）⇒ `[]` ∥ 未结轮记录照出（逐条复列——零截点）；
 *        同件对照 = 完整轮 ⇒ 终态行照出。
 * 跨批复跑（读数入批档 §5）= `docs/batches/2026-10-01-digest-rows-natural-form.test.mjs` ∥
 *   `docs/batches/2026-10-01-digest-rows-natural-form-cli-vsc.test.mjs`（L4 ∥ L7 照绿——CLI 口径不变）。
 * 跑法（仓根 `thincoder/`）：node --test docs/batches/2026-10-01-digest-replay-choices.test.mjs
 * 本件不入仓套件（批内件 · 随批留存）；真机一条（D16）= 父侧闭合（本档只落机检面）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"
import "../../thincoder-desktop/test/rc-resolve.mjs" // `/rc/` 解析钩子（须先于桌面模块取件注册）

const ROOT = process.cwd()
if (!readFileSync(resolve(ROOT, "thincoder-core/context.mjs"), "utf8")) throw new Error(`从仓库根（thincoder/）运行（cwd = ${ROOT}）`)
const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)

// ─── VSC 假 DOM bootstrap（腿 6——沿 #790 批内件先例：happy-dom 注册 + vscode API 桩）──
const { GlobalRegistrator } = await import(pathToFileURL(resolve(ROOT, "thincoder-vscode/node_modules/@happy-dom/global-registrator/lib/index.js")).href)
GlobalRegistrator.register()
document.body.innerHTML = `
  <div id="chat-container">
    <div id="messages"></div>
    <div id="subagent-activity"></div>
    <div id="toolbar"><div id="status-line"></div><div id="input-row"><textarea id="input"></textarea></div></div>
    <div id="model-dropdown"></div><div id="reasoning-dropdown"></div><div id="session-dropdown"></div>
    <button id="session-selector"></button><span id="session-title"></span>
  </div>`
globalThis.acquireVsCodeApi = () => ({ postMessage() {}, getState: () => ({}), setState() {} })

// ─── 模块装载（桌面四件 ∥ VSC 三件 ∥ CLI 两件）──
const [wake, pageRead, rows, i18n, i18nCore, wstate, wi18n, wrestore, whistory, lifecycle, startup] = await Promise.all([
  mod("thincoder-desktop/renderer/events-wake.mjs"), // `ev:digest` 归约（帧更新门）
  mod("thincoder-desktop/renderer/page-read.mjs"), // 页读径（折叠 ∥ 并入）
  mod("thincoder-desktop/renderer/views/chat-digest-rows.mjs"), // 行族构树（行集判据）
  mod("thincoder-desktop/renderer/i18n.mjs"), // 词面投影（行文断言）
  mod("thincoder-core/i18n.mjs"), // 核字典投影（词面单源）
  mod("thincoder-vscode/webview/state.js"), // VSC ctx（messagesEl）
  mod("thincoder-vscode/webview/i18n.js"), // VSC 词面注入（哨兵值——只作占位，不作断言锚）
  mod("thincoder-vscode/webview/record-restore.js"), // VSC 重建件（扫轮 ∥ 元素面）
  mod("thincoder-vscode/webview/history.js"), // VSC 页级 pass（`older` 判面接线）
  mod("thincoder-cli/src/tui/lifecycle-records.mjs"), // CLI 痕行（`digestTraceLines`）
  mod("thincoder-cli/src/tui/startup.mjs"), // CLI 读面复列（记录分支）
])
i18n.initDict({ locale: "zh", dict: i18nCore.projectDictionary("zh") }) // 行文断言词面（单源 = 核字典）
wi18n.setStrings({}) // 词键面非本件断言对象（结构与在场判据为断言面）

// ─── 桌面夹具（沿 `2026-10-01-digest-rows-natural-form.test.mjs` 先例）──
const KEY = "1"
const pageState = (over = {}) => ({
  activeSession: KEY, blocks: [], digest: {}, stopMark: {}, timerNotice: {}, compress: {}, helpLines: {},
  sessionMeta: {}, following: false, pendingNew: 0, history: { hasOlder: false, inFlight: false }, ...over,
})
const receipt = (messages, over = {}) => ({ ok: true, messages, hasOlder: false, next: null, meta: {}, flags: null, queue: null, ...over })
const startRec = (idx, n, over = {}) => ({ kind: "digest", status: "start", n, tier: null, idx, ...over })
const capRec = (idx, over = {}) => ({ kind: "digest", status: "cap", mode: "stop", turns: 2, idx, ...over })
const endRec = (idx, over = {}) => ({ kind: "digest", status: "end", ok: true, ms: 900, idx, ...over })
const liveRound = (over = {}) => ({ status: "start", n: 2, tier: null, from: null, msg: null, ...over })
const baseState = (over = {}) => ({
  activeSession: KEY, blocks: [], digest: {}, stopMark: {}, following: true, pendingNew: 0, history: { hasOlder: false, inFlight: false }, ...over,
})
const rowType = (row) => ["label", "count", "cap", "end"].find((name) => row.props?.[`data-digest-${name}`] != null) ?? null
const typesOf = (round) => rows.digestRows(round).map(rowType)

// ─── VSC 夹具 ───
const wctx = wstate.ctx
const digestRec = (status, idx, over = {}) => ({ kind: "digest", status, idx, ...over })
const elKind = (el) => (el.classList.contains("digest-turn") ? "label"
  : el.classList.contains("digest-cap") ? "cap"
    : el.classList.contains("digest-done") || el.classList.contains("digest-failed") ? "end"
      : el.classList.contains("digest-status") ? "count" : "?")
const elsOf = (messages, tail, ctx = wctx) => {
  const plan = wrestore.scanPageRounds(messages, tail)
  return messages.flatMap((msg, index) => wrestore.restoreRecordEls(ctx, msg, plan.get(index)))
}

// ═══ 腿 1：未结轮照现（桌面 · 点名腿）═══

test("腿 1·未结轮照现（点名腿）：末页尾残轮（起跑 + cap、无 `end`）⇒ 照出该轮（非终态 ∥ cap 在位 ∥ `at` = 起跑 `idx`）∥ 行集 = 起跑 ∥ 计数 ∥ cap——零终态", () => {
  const s = pageRead.applyPage(pageState(), receipt([startRec(10, 2), capRec(12)]), { key: KEY, before: null })
  const rounds = s.digest[KEY]
  assert.equal(rounds.length, 1, "尾残轮照出（未结轮照现——旧「末轮无 `end` 不产」退场）")
  const round = rounds[0]
  assert.notEqual(round.status, "end", "不产终态（status 非 `end`）")
  assert.deepEqual(round.cap, { mode: "stop", turns: 2 }, "cap 记录照出（cap 在位）")
  assert.equal(round.n, 2, "起跑计数照出")
  assert.equal(round.at, 10, "位次 = 起跑记录 `idx`")
  assert.deepEqual(typesOf(round), ["label", "count", "cap"], "行集 = 起跑 ∥ 计数 ∥ cap——零终态行")
  assert.equal(s.digest[KEY][0].status === "end", false, "终态行零产（无 `end` 记录）")
  const tree = rows.digestRows(round)
  assert.equal(tree[1].children[0], i18n.t("digest.start", { n: 2 }), "计数行文 = 起跑文（digest.start 携 n——与活流同算式）")
  assert.equal(tree[2].children[0], i18n.t("digest.capStop", { turns: 2 }), "cap 行文 = digest.capStop（turns——零新键）")
})

// ═══ 腿 2：可证面（桌面）═══

test("腿 2·可证面：轮间（后起跑已现）⇒ 前未结轮照出 ∥ 非末页尾残 ⇒ 零产 ∥ 起跑未载的 `cap`/`end` ⇒ 零产 ∥ 末页未结 + 其后普通消息 ⇒ 照现", () => {
  // 2a 轮间可证（轮序单链：`end` 若在必在其间）
  const a = pageRead.applyPage(pageState(), receipt([startRec(20, 2), startRec(30, 1), endRec(34)]), { key: KEY, before: null })
  assert.equal(a.digest[KEY].length, 2, "轮间：前未结轮照出 ∥ 后完整轮照出")
  assert.deepEqual(a.digest[KEY].map((round) => round.at), [20, 30], "两轮位次按记录序")
  assert.notEqual(a.digest[KEY][0].status, "end", "前轮不产终态（未结照现）")
  assert.equal(a.digest[KEY][1].status, "end", "后轮终态照出")
  // 2b 非末页尾残起跑（回填径）⇒ 零产（可能为他页完整轮之半——不可证）
  const b = pageRead.applyPage(pageState(), receipt([startRec(40, 3)], { hasOlder: true, next: 5 }), { key: KEY, before: 9 })
  assert.equal(b.digest[KEY], undefined, "非末页尾残起跑 ⇒ 零产（容差①）")
  // 2c 起跑未载的 `cap` ∥ `end` 记录 ⇒ 零产（跨页截断——防并轮错位；首屏 ∥ 回填同判）
  const c = pageRead.applyPage(pageState(), receipt([endRec(50), capRec(52)]), { key: KEY, before: null })
  assert.equal(c.digest[KEY], undefined, "起跑未载 ⇒ 该轮本页零产（零并轮零借位）")
  const c2 = pageRead.applyPage(pageState(), receipt([endRec(50), capRec(52)], { hasOlder: true, next: 5 }), { key: KEY, before: 9 })
  assert.equal(c2.digest[KEY], undefined, "回填径同判：起跑未载 ⇒ 零产")
  // 2d 末页未结 + 其后普通消息（非 digest 记录）：扫描结束仍 `open` ⇒ 照现
  const d = pageRead.applyPage(pageState(), receipt([startRec(60, 2), { kind: "assistant", text: "轮中", idx: 62 }]), { key: KEY, before: null })
  assert.equal(d.digest[KEY].length, 1, "非 digest 记录不改判（扫描结束仍 `open`——`end` 若在必在页内）")
  assert.equal(d.digest[KEY][0].at, 60, "位次仍归起跑记录")
  assert.equal(d.blocks.length, 1, "普通记录照入块序（零涉）")
  // 2e 旧页轮间同判（后轮起跑已现 ⇒ 前未结轮照出——页位不预判据）
  const e = pageRead.applyPage(pageState(), receipt([startRec(100, 2), startRec(110, 1), endRec(114)], { hasOlder: true, next: 5 }), { key: KEY, before: 9 })
  assert.deepEqual(e.digest[KEY].map((round) => round.at), [100, 110], "旧页轮间：前未结轮照出 ∥ 后完整轮照出")
  assert.notEqual(e.digest[KEY][0].status, "end", "旧页前轮不产终态")
})

// ═══ 腿 3：归属（桌面 · 活流侧优先）═══

test("腿 3·归属（活流侧优先）：运行期未结轮在场 ⇒ 单副本（运行期侧）∥ 其帧更新存续 ∥ 运行期缺位 ⇒ 照并入 ∥ 折叠末轮终态 ⇒ 余整清", () => {
  const foldedTail = [startRec(70, 2), capRec(72)] // 折叠末轮 = 未结（尾残）
  const live = liveRound({ n: 5 })
  // 3a 运行期未结轮在场 ⇒ 折叠未结末轮不并入（唯一副本 = 运行期轮）
  const s1 = pageRead.applyPage(pageState({ digest: { [KEY]: [live] } }), receipt(foldedTail), { key: KEY, before: null })
  assert.equal(s1.digest[KEY].length, 1, "并入单副本（运行期侧）——折叠未结末轮不并入")
  assert.equal(s1.digest[KEY][0], live, "唯一副本 = 运行期轮（原引用零改写）")
  assert.equal(s1.digest[KEY].some((round) => round.at === 70), false, "折叠未结末轮（at = 70）零在场（所失面登记：暂不并入——随后续落盘投影复现）")
  // 3b 活轮在场 ⇒ 其帧更新仍在场（`cap` ∥ `end` 就末轮更新——行照出）
  let st = wake.onDigest(s1, { key: KEY, status: "cap", mode: "stop", turns: 3 })
  assert.equal(st.digest[KEY].length, 1, "cap 帧就末轮更新（零叠条）")
  assert.deepEqual(st.digest[KEY][0].cap, { mode: "stop", turns: 3 }, "cap 事实落活轮（末轮 = 活轮）")
  assert.deepEqual(typesOf(st.digest[KEY][0]), ["label", "count", "cap"], "活轮 cap 行照出")
  st = wake.onDigest(st, { key: KEY, status: "end", ok: true, ms: 900 })
  assert.equal(st.digest[KEY][0].status, "end", "end 帧就末轮更新")
  assert.deepEqual(typesOf(st.digest[KEY][0]), ["label", "count", "cap", "end"], "活轮整轮行集齐出（活轮不被抹）")
  // 3c 运行期未结轮缺（重开径）⇒ 折叠未结末轮照并入（照现）
  const s3 = pageRead.applyPage(pageState(), receipt(foldedTail), { key: KEY, before: null })
  assert.equal(s3.digest[KEY].length, 1, "运行期缺位 ⇒ 折叠未结末轮照并入")
  assert.equal(s3.digest[KEY][0].at, 70, "折叠未结末轮携位次")
  assert.notEqual(s3.digest[KEY][0].status, "end", "照现 = 不产终态")
  // 3d 折叠末轮终态 ⇒ 运行期轮余整清（内容随折叠承接）
  const endedLive = { status: "end", n: 2, tier: null, from: null, msg: null, ok: true, ms: 100 }
  const s4 = pageRead.applyPage(pageState({ digest: { [KEY]: [endedLive] } }), receipt([startRec(80, 2), endRec(84)]), { key: KEY, before: null })
  assert.equal(s4.digest[KEY].length, 1, "终态运行期轮整清（零叠）")
  assert.equal(s4.digest[KEY].some((round) => round === endedLive), false, "运行期副本退场（内容随折叠承接）")
  assert.equal(s4.digest[KEY][0].at, 80, "折叠轮承接（携位次）")
  // 3e 零跨侧去重键（结构断言）：`at` 只随折叠轮侧 ∥ 并集 = 纯串联
  assert.equal("at" in s1.digest[KEY][0], false, "现轮集零位置面（并入后仍无 `at` 面——零跨侧去重键）")
  assert.equal(s1.digest[KEY].filter((round) => "at" in round).length, 0, "运行期侧零位次面（过滤后）")
  // 3g 运行期缺位 + 折叠全终态 ⇒ 全量照并入（照现基线）
  const s6 = pageRead.applyPage(pageState(), receipt([startRec(60, 1), endRec(64), startRec(66, 2), capRec(68)]), { key: KEY, before: null })
  assert.equal(s6.digest[KEY].length, 2, "运行期缺位 ⇒ 折叠轮全量并入（已结 ∥ 未结并存）")
  assert.deepEqual(s6.digest[KEY].map((round) => round.at), [60, 66], "并入序 = 记录序")
  const s5 = pageRead.applyPage(pageState({ digest: { [KEY]: [live] } }), receipt([startRec(90, 2), endRec(94)]), { key: KEY, before: null })
  assert.deepEqual(s5.digest[KEY].map((round) => round.at ?? null), [90, null], "并序 = 折叠轮居前 ∥ 现轮集随后（零按键比对）")
  assert.equal(s5.digest[KEY][1], live, "现轮集原引用（零改写）")
  // 3f 回填径同判：折叠集含未结轮（轮间可证）——活轮未结 ⇒ 折叠未结轮不并入 ∥ 活轮终态 ⇒ 照并入
  const backPage = [startRec(70, 2), startRec(80, 1), endRec(84)]
  const b1 = pageRead.applyPage(baseState({ digest: { [KEY]: [live] } }), receipt(backPage, { hasOlder: true, next: 5 }), { key: KEY, before: 9 })
  assert.deepEqual(b1.digest[KEY].map((round) => round.at ?? null), [80, null], "回填径：折叠未结轮不并入（活轮未结——单副本）")
  assert.equal(b1.digest[KEY][1], live, "唯一副本 = 运行期轮（居末）")
  const b2 = pageRead.applyPage(baseState({ digest: { [KEY]: [endedLive] } }), receipt(backPage, { hasOlder: true, next: 5 }), { key: KEY, before: 9 })
  assert.deepEqual(b2.digest[KEY].map((round) => round.at ?? null), [70, 80, null], "回填径：活轮终态 ⇒ 折叠未结轮照并入（照现）")
})

// ═══ 腿 4：`n = 0` 守句（桌面 · 点名腿）═══

test("腿 4·`n = 0` 守句（点名腿）：`n = 0` 且 `end` ⇒ 行集 = [起跑行]（零计数 ∥ 零终态）∥ `n > 0` 对照 ⇒ 终态行在场", () => {
  assert.deepEqual(typesOf({ status: "end", n: 0, tier: null, from: null, msg: null, ok: true, ms: 900 }), ["label"], "`n = 0` ⇒ 零计数 ∥ 零终态（禁幻影行）")
  assert.deepEqual(typesOf({ status: "end", n: 0, tier: null, from: null, msg: null, ok: false, ms: 100 }), ["label"], "aborted 档同守（`n = 0` ⇒ 零终态）")
  assert.deepEqual(typesOf({ status: "end", n: 2, tier: null, from: null, msg: null, ok: true, ms: 900 }), ["label", "count", "end"], "`n > 0` 对照 ⇒ 计数行 ∥ 终态行在场")
  assert.deepEqual(typesOf({ status: "end", n: 0, tier: null, from: null, msg: null, ok: true, ms: 900, cap: { mode: "stop", turns: 2 } }), ["label", "cap"], "`n = 0` + cap：cap 行照出（守句只及计数 ∥ 终态两行）")
  // 记录径同判（ask-only 轮：起跑 n = 0 + `end` ⇒ 起跑行独存）
  const s = pageRead.applyPage(pageState(), receipt([
    { kind: "digest", status: "start", n: 0, tier: "ask", from: "eng-designer#8", msg: "请复核", idx: 11 },
    endRec(13),
  ]), { key: KEY, before: null })
  assert.deepEqual(typesOf(s.digest[KEY][0]), ["label"], "记录径同判（ask-only 轮 ⇒ 起跑行独存）")
})

// ═══ 腿 5：位次门（#773）═══

test("腿 5·位次门（#773）：起跑记录无 `idx`（终态 ∥ 未结两径）⇒ 该轮零产 ∥ 产出轮全体 `at` 数为断言", () => {
  const a = pageRead.applyPage(pageState(), receipt([
    { kind: "digest", status: "start", n: 2, tier: null }, endRec(12),
  ]), { key: KEY, before: null })
  assert.equal(a.digest[KEY], undefined, "终态径：起跑位次不可得 ⇒ 该轮零产")
  const b = pageRead.applyPage(pageState(), receipt([{ kind: "digest", status: "start", n: 2, tier: null }]), { key: KEY, before: null })
  assert.equal(b.digest[KEY], undefined, "未结径：起跑位次不可得 ⇒ 该轮零产（两径同门）")
  const c = pageRead.applyPage(pageState(), receipt([
    startRec(20, 1), endRec(22),
    { kind: "digest", status: "start", n: 2, tier: null }, endRec(32),
  ]), { key: KEY, before: null })
  assert.equal(c.digest[KEY].length, 1, "混排：不可位次轮零产 ∥ 可位次轮照出")
  assert.ok(c.digest[KEY].every((round) => Number.isFinite(round.at)), "产出轮全体 `at` 数为断言（折叠面无 `at = null` 轮）")
  assert.equal(c.digest[KEY][0].at, 20)
  const d = pageRead.applyPage(pageState(), receipt([
    { kind: "digest", status: "start", n: 2, tier: null }, capRec(52),
  ]), { key: KEY, before: null })
  assert.equal(d.digest[KEY], undefined, "未结径 + cap：位次不可得 ⇒ 该轮零产（cap 记录不借位）")
})

// ═══ 腿 6：VSC ═══

test("腿 6·VSC：末页尾残轮 ⇒ 起跑/cap 元素出（终态零）∥ 非末页尾残 ⇒ 零元素 ∥ 孤立 `end` ⇒ 零元素 ∥ 同页完整轮 ⇒ 起跑+计数+终态 ∥ `n = 0` ⇒ 零终态", () => {
  const tail = [digestRec("start", 10, { n: 2, tier: "digest" }), digestRec("cap", 12, { mode: "stop", turns: 2 })]
  // 6a 末页（`tail = true`）尾残轮（起跑 + cap、无 `end`）⇒ 起跑/cap 元素出
  const a = elsOf(tail, true)
  assert.deepEqual(a.map(elKind), ["label", "count", "cap"], "末页尾残轮照现（起跑 ∥ 计数 ∥ cap——零终态元素）")
  assert.deepEqual(a.map((el) => el.dataset.idx), ["10", "10", "12"], "位次锚 = 记录 `idx`（分页游标 ∥ 防双渲染）")
  assert.equal(a[1].dataset.n, "2", "计数元素携起跑数（dataset.n——终态取数源）")
  assert.equal(a[2].className, "digest-cap digest-cap-stop", "cap 元素形 = 两档（stop 档类）")
  // 6b 非末页（`tail = false`）尾残 ⇒ 零元素（不可证——容差①）
  assert.deepEqual(elsOf(tail, false), [], "非末页尾残 ⇒ 零元素")
  // 6c 孤立 `cap` ∥ `end` ⇒ 零元素（起跑未载——零并轮零借位）
  assert.deepEqual(elsOf([digestRec("end", 40, { ok: true, ms: 900 })], true), [], "孤立 `end` ⇒ 零元素")
  assert.deepEqual(elsOf([digestRec("cap", 42, { mode: "stop", turns: 2 })], true), [], "孤立 `cap` ⇒ 零元素")
  // 6d 同页完整轮 ⇒ 起跑 + 计数 + 终态（末页 ∥ 旧页同判）
  const full = [digestRec("start", 50, { n: 2, tier: "digest" }), digestRec("end", 52, { ok: true, ms: 900 })]
  assert.deepEqual(elsOf(full, true).map(elKind), ["label", "count", "end"], "同页完整轮 ⇒ 三元素齐出")
  assert.deepEqual(elsOf(full, false).map(elKind), ["label", "count", "end"], "旧页完整轮照出（与尾残零产对照——可证面）")
  const fullCap = [digestRec("start", 54, { n: 2, tier: "digest" }), digestRec("cap", 56, { mode: "stop", turns: 2 }), digestRec("end", 58, { ok: true, ms: 900 })]
  assert.deepEqual(elsOf(fullCap, true).map(elKind), ["label", "count", "cap", "end"], "完整轮 + cap：cap 元素随轮出（四元素齐出）")
  // 6e `n = 0` ⇒ 零计数 ∥ 零终态（守句——幻影元素禁出）
  const ask = [digestRec("start", 60, { n: 0, tier: "ask", from: "eng-designer#8", msg: "请复核" }), digestRec("end", 62, { ok: true, ms: 900 })]
  assert.deepEqual(elsOf(ask, true).map(elKind), ["label"], "`n = 0` ⇒ 起跑元素独存（零计数 ∥ 零终态）")
  // 6f 轮间（非末页）：后起跑已现 ⇒ 前未结轮的起跑/cap 元素照出
  const mid = [digestRec("start", 70, { n: 2, tier: "digest" }), digestRec("cap", 72, { mode: "stop", turns: 1 }), digestRec("start", 80, { n: 1, tier: "digest" }), digestRec("end", 82, { ok: true, ms: 800 })]
  assert.deepEqual(elsOf(mid, false).map(elKind), ["label", "count", "cap", "label", "count", "end"], "轮间：前未结轮元素照出（旧页亦判）")
})

test("腿 6b·VSC 页级 pass 接线：`older` 判面随动（末页尾残 ⇒ 元素入页 ∥ 旧页同记录 ⇒ 零元素）", () => {
  const page = [digestRec("start", 90, { n: 2, tier: "digest" }), digestRec("cap", 92, { mode: "stop", turns: 2 })]
  whistory.applyHistoryPage(wctx, { messages: page, hasOlder: true, older: false })
  assert.equal(wctx.messagesEl.querySelectorAll(".digest-turn").length, 1, "末页（`older` 缺省）⇒ 尾残轮起跑元素入页")
  assert.equal(wctx.messagesEl.querySelectorAll(".digest-cap").length, 1, "cap 元素入页")
  assert.equal(wctx.messagesEl.querySelectorAll(".digest-done, .digest-failed").length, 0, "终态元素零产")
  wctx.messagesEl.replaceChildren()
  whistory.applyHistoryPage(wctx, { messages: page, hasOlder: true, older: true })
  assert.equal(wctx.messagesEl.querySelectorAll(".digest-turn").length, 0, "旧页（`older: true`）⇒ 同一记录零元素（不可证）")
})

test("腿 6c·VSC 幂等：同页二次页级 pass（不清屏）⇒ 同位 `[data-idx]` 命中 ⇒ 零新元素（复列可重入）", () => {
  const page = [digestRec("start", 120, { n: 2, tier: "digest" }), digestRec("cap", 122, { mode: "stop", turns: 2 })]
  wctx.messagesEl.replaceChildren()
  whistory.applyHistoryPage(wctx, { messages: page, hasOlder: true, older: false })
  const first = wctx.messagesEl.querySelectorAll("[data-idx]").length
  assert.equal(first, 3, "首跑：起跑 ∥ 计数 ∥ cap 三元素入页")
  whistory.applyHistoryPage(wctx, { messages: page, hasOlder: true, older: false })
  assert.equal(wctx.messagesEl.querySelectorAll("[data-idx]").length, first, "二次应用：同位命中 ⇒ 零新元素（幂等）")
  assert.equal(wctx.messagesEl.querySelectorAll(".digest-turn").length, 1, "起跑元素零重复")
})

// ═══ 腿 7：CLI（薄腿）═══

test("腿 7·CLI（薄腿）：`digestTraceLines`（`end`，`n = 0`）⇒ `[]` ∥ 未结轮记录照出（逐条复列——零截点）", async () => {
  const { t } = await mod("thincoder-core/i18n.mjs")
  assert.deepEqual(lifecycle.digestTraceLines({ kind: "digest", status: "end", ok: true, ms: 900 }, 0), [], "`n = 0` ⇒ 零终态行（守句）")
  assert.equal(lifecycle.digestTraceLines({ kind: "digest", status: "end", ok: true, ms: 900 }, 2).length, 1, "`n > 0` 对照 ⇒ 终态行在场")
  assert.equal(lifecycle.digestTraceLines({ kind: "digest", status: "end", ok: true, ms: 900 }, null).length, 0, "`n` 不可得 ⇒ 零终态行（fail-closed）")
  const H = [
    { role: "user", content: "问", ts: 1 },
    { kind: "digest", status: "start", n: 2, tier: "digest", ts: 2 },
    { kind: "digest", status: "cap", mode: "stop", turns: 2, ts: 3 },
  ]
  const texts = startup.historyToLines(H, 0, H.length).map((line) => line.text)
  assert.deepEqual(texts.slice(-3), [
    t("digest.turnLabel"), t("digest.start", { n: 2 }), t("digest.capStop", { turns: 2 }),
  ], "未结轮照出（逐条复列——零截点；CLI 口径零改）")
  assert.equal(texts.filter((text) => text === t("digest.turnLabel")).length, 1, "恰一枚起跑标签（记录逐条复列——零重复零截）")
  // 对照（同件可判）：完整轮 ⇒ 终态行照出
  const H2 = [...H, { role: "user", content: "问二", ts: 4 }, { kind: "digest", status: "start", n: 1, tier: "digest", ts: 5 }, { kind: "digest", status: "end", ok: true, ms: 500, ts: 6 }]
  const texts2 = startup.historyToLines(H2, 0, H2.length).map((line) => line.text)
  assert.deepEqual(texts2.slice(-3), [
    t("digest.turnLabel"), t("digest.start", { n: 1 }), t("digest.done", { n: 1, seconds: "0.5" }),
  ], "完整轮 ⇒ 终态行照出（未结零产 ∥ 完整有产——同件对照）")
})
