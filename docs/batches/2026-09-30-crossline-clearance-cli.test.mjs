/**
 * 2026-09-30-crossline-clearance-cli.test.mjs — 跨线清零批 · A 舱（CLI 端 I1 ∕ I2 ∕ I6 ∕ I8）批内单测件。
 * 名随批次档 · 住批次目录 · 不进仓套件；复跑（仓根）= `node --test docs/batches/2026-09-30-crossline-clearance-cli.test.mjs`。
 * 判据面 = 批档 §2.8 I1 ∕ I2 ∕ I6 ∕ I8 判据腿 + `docs/cli/design/TUI.md` §7.4 ∕ §7.5 · `docs/cli/design/CLI-ENTRY.md` §3；纪律 = 行为断言优先 ∕ 结构断言只落机器可核形。
 *   T-XL1（I1）：含注入块样本 ⇒ 恢复面（historyToLines ∕ restoreLines）零 `[File: …]`（与 VSC 同形 = 核 `stripAtRefs` 直驱对拍）；负向锁 = 手打 `[File: x]` 形近样本零误伤。
 *   T-XL2（I2）：title 空 ⇒ 显回退链值（对位 VSC `panel-session.mjs:243-247` 链式逐字；生成前 ∕ 失败期两端同值）；负向锁 = title 有值 ⇒ 显活值（回退分支零触）。
 *   T-XL6（I6）：多条态首行（含 `i. ` 编号）≤ `cols − 1`（修前形超宽 = 先红证）；负向锁 = 单条态零编号（同 wrapText）。
 *   T-XL8（I8）：三 shell 输出各含 ledger 子命令 ∕ 旗标字面（与实装命令集同源）；负向锁 = 既有命令集逐字不变。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-core"))) throw new Error(`须以仓根（含 thincoder-core/）为 cwd 运行：${ROOT}`)
const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href)
const text = (rel) => readFileSync(join(ROOT, rel), "utf8")
const stripAnsi = (s) => s.replace(/\x1b\[[0-9;?]*[a-zA-Z]/g, "")

const CL = await load("thincoder-cli/src/tui/render-conversation.mjs")
const RF = await load("thincoder-cli/src/tui/render-frame.mjs")
const RM = await load("thincoder-cli/src/tui/render.mjs")
const SU = await load("thincoder-cli/src/tui/startup.mjs")
const COMP = await load("thincoder-cli/src/completions.mjs")
const FR = await load("thincoder-core/file-refs.mjs")

const stubAgent = (over = {}) => ({
  provider: null, config: {}, autoApprove: false, planMode: false,
  _currentTurn: 0, _maxTurns: 0, title: "", _pendingTimers: [], _fullHistory: [], _recordStore: null,
  ...over,
})
const stubState = (over = {}) => ({
  lines: [], streaming: "", reasoning: "", _advisorBlocks: [],
  input: [], cursor: 0, scroll: 0, _followTail: true,
  processing: false, status: "Ready", currentTool: null, processingStarted: 0, lastOutputAt: 0, permission: null, question: null, picker: null, wizard: null,
  tasks: [], tokens: { prompt: 0, completion: 0, cacheHit: 0, cacheMiss: 0, reasoningTokens: 0 },
  ctxCache: { len: -1, tokens: 0 }, pendingInput: [], suspended: false, _suspPending: false,
  attentionAwaiting: false, ledger: null, subTasks: {}, _linesChars: 0, _lineIdCounter: 0,
  ...over,
})

/* ── T-XL1 · I1 恢复面剥离（B5 消） ── */
test("T-XL1 · I1 恢复面剥离：注入块样本 ⇒ 零 `[File: …]`（对拍核 stripAtRefs）∧ 负向锁 = 手打形近零误伤", () => {
  const dir = mkdtempSync(join(tmpdir(), "xl-cli-"))
  try {
    writeFileSync(join(dir, "a.txt"), "SENTINEL-内容", "utf8")
    const injected = FR.injectAtRefs("请看 @a.txt 的哨兵", dir, { readFileSync, existsSync, statSync })
    assert.ok(injected.includes("[File: a.txt]"), "样本须为注入展开文（前置条件）")
    const history = [{ role: "user", content: injected }]
    const rows = SU.historyToLines(history, 0, 1)
    const userLine = rows.find((l) => l._kind === "text")
    assert.equal(userLine.text, "请看 @a.txt 的哨兵", "恢复面还原为用户原文（`@路径` 简洁形）")
    assert.equal(userLine.text, FR.stripAtRefs(injected), "与 VSC 同形（核 stripAtRefs 直驱对拍）")
    assert.equal(userLine.text.includes("[File: "), false, "恢复面零 `[File: …]`")
    const state = { lines: [], _linesChars: 0, _lineIdCounter: 0 }
    SU.restoreLines(state, { history, total: 1 })
    assert.equal(state.lines.find((l) => l._kind === "text").text, "请看 @a.txt 的哨兵", "restoreLines（恢复渲染入口）同款")
    // 负向锁：手打 `[File: x]` 形近文本（无摘要块尾）⇒ 零误伤（逐字不变）
    const hand = "手打的 [File: x.txt] 字样\n```\nhi\n```\n纯文本"
    const handLine = SU.historyToLines([{ role: "user", content: hand }], 0, 1).find((l) => l._kind === "text")
    assert.equal(handLine.text, hand, "手打样本逐字不变")
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

/* ── T-XL2 · I2 标题段回退链（B6 消） ── */
test("T-XL2 · I2 标题段回退链：title 空 ⇒ 显回退链值（对位 VSC 链式逐字）∧ 负向锁 = title 有值 ⇒ 显活值", () => {
  const cols = 300
  // 对位形（逐字抄自 `thincoder-vscode/src/extension/panel-session.mjs:243-247` 链）
  const truncate = (s, n) => (s.length <= n ? s : s.slice(0, n - 1) + "…")
  const vscChain = (title, firstMessage) => title || (firstMessage ? `"${truncate(firstMessage, 40)}"` : "(empty)")
  // 盘面锚（防手抄件失锚——链式字面须在 VSC 源档在场）：两端漂移时本腿即刻变红
  assert.ok(text("thincoder-vscode/src/extension/panel-session.mjs").includes("truncate(s.firstMessage, 40)"), "VSC 链式字面在盘（同值对拍基准）")
  const fm1 = "帮我看一下 @a.txt 的处理逻辑"
  const a1 = stubAgent({ title: "", _recordStore: { counters: () => ({ firstMessage: fm1 }) } })
  assert.ok(stripAnsi(RF.renderStatus(stubState(), a1, cols, [])).includes(` │ ${vscChain("", fm1)}`), "绑定态槽摘要字段 ⇒ 引号形链值")
  const fm2 = "第二个会话的首条消息"
  const a2 = stubAgent({ title: "", _fullHistory: [{ role: "user", content: fm2 }] })
  assert.ok(stripAnsi(RF.renderStatus(stubState(), a2, cols, [])).includes(` │ ${vscChain("", fm2)}`), "未绑定回退内存人读线 ⇒ 同值")
  assert.ok(stripAnsi(RF.renderStatus(stubState(), stubAgent({ title: "" }), cols, [])).includes(` │ ${vscChain("", "")}`), "无首条消息 ⇒ (empty)")
  const fm4 = "x".repeat(60)
  const a4 = stubAgent({ title: "", _recordStore: { counters: () => ({ firstMessage: fm4 }) } })
  assert.ok(stripAnsi(RF.renderStatus(stubState(), a4, cols, [])).includes(` │ ${vscChain("", fm4)}`), "超 40 字符 ⇒ 截断值逐字同链")
  // 负向锁：title 有值 ⇒ 显活值（回退分支零触——即便首条消息在场）
  const a5 = stubAgent({ title: "MyTitle", _recordStore: { counters: () => ({ firstMessage: fm1 }) } })
  const out5 = stripAnsi(RF.renderStatus(stubState(), a5, cols, []))
  assert.ok(out5.includes(" │ MyTitle"), "title 有值 ⇒ 显活值")
  assert.equal(out5.includes("(empty)") || out5.includes(vscChain("", fm1)), false, "零回退注入（(empty) ∕ 首条消息形两臂）")
})

/* ── T-XL6 · I6 编号态首行预扣除（B12 消） ── */
test("T-XL6 · I6 编号态首行预扣除：多条态首行 ≤ `cols − 1`（含编号）∧ 负向锁 = 单条态零编号（同 wrapText）", () => {
  const cols = 40
  const long = "x".repeat(120)
  const oldFirst = `1. ${RM.wrapText(long, cols - 1)[0]}`
  assert.ok(RM.stringWidth(oldFirst) > cols - 1, "样本须触发缺陷（修前形：编号 + 未扣除折行首段 ⇒ 超宽）")
  const multi = CL.buildConvLines(stubState({ pendingInput: [long, "second"] }), cols, 0)
  const labelIdx = multi.findIndex((l) => l.text.includes("待发送 · 2 条消息"))
  assert.ok(labelIdx >= 0, "多条态标签行在盘")
  const first = multi[labelIdx + 1].text
  assert.equal(first, `1. ${"x".repeat(cols - 1 - 3)}`, "首行 = 编号 + 收窄预算内容")
  assert.ok(RM.stringWidth(first) <= cols - 1, "首行（含编号）≤ cols − 1")
  assert.equal(multi[labelIdx + 5].text, "2. second", "第 2 条编号首行（编号 + 内容）")
  // 负向锁：单条态零编号 ∧ 逐行同 wrapText（形态不变）
  const single = CL.buildConvLines(stubState({ pendingInput: [long] }), cols, 0)
  const li = single.findIndex((l) => l.text.includes("待发送 · 不打断当前执行"))
  assert.ok(li >= 0, "单条态标签行在盘")
  const rows = RM.wrapText(long, cols - 1)
  for (let i = 0; i < 3; i++) assert.equal(single[li + 1 + i].text, rows[i], `单条态第 ${i + 1} 行同 wrapText`)
  assert.equal(single.slice(li + 1).some((l) => /^\d+\.\s/.test(l.text)), false, "单条态零编号")
})

/* ── T-XL8 · I8 补全补落（B14-T2 消） ── */
test("T-XL8 · I8 补全：三 shell 各含 ledger 子命令 ∕ 旗标字面（实装同源）∧ 负向锁 = 既有命令集逐字不变", () => {
  const capture = (sh) => {
    const c = []
    const orig = process.stdout.write
    process.stdout.write = (s) => { c.push(s); return true }
    try { COMP.printCompletion(sh) } finally { process.stdout.write = orig }
    return c.join("")
  }
  const bash = capture("bash"), zsh = capture("zsh"), fish = capture("fish")
  // 实装面单源（分发面 + 核解析面——字面同源基准）
  const dispatch = text("thincoder-cli/src/command-table.mjs")
  const impl = text("thincoder-core/ledger-migrate.mjs")
  assert.ok(dispatch.includes('args[0] === "migrate" || args[0] === "audit"'), "实装分发面子命令集 = migrate ∕ audit")
  for (const lit of ["--dry-run", "--confirm", "--from", "--root"]) assert.ok(impl.includes(`"${lit}"`), `核解析面含 ${lit}`)
  // 三 shell 输出各含定界字面（fish 形 = `-l <名>`——同 MS-2 先例「fish 形」口径）
  for (const [sh, out, lits] of [
    ["bash", bash, ["migrate", "audit", "--dry-run", "--confirm", "--from", "--root"]],
    ["zsh", zsh, ["migrate", "audit", "--dry-run[", "--confirm[", "--from:", "--root:"]],
    ["fish", fish, ["migrate", "audit", "-l dry-run", "-l confirm", "-l from", "-l root"]],
  ]) {
    for (const lit of lits) assert.ok(out.includes(lit), `${sh} 输出须含 ${lit}`)
  }
  for (const out of [bash, zsh]) for (const bad of ["--from=", "--root="]) assert.equal(out.includes(bad), false, "零 `=` 贴身形建议（核解析仅认空格形——ledger-migrate.mjs:170 ∕ :287）")
  assert.ok(bash.includes('ledger) case "\\$prev" in') && bash.includes('"migrate audit" -- "\\$cur"'), "bash ledger 分支 ∕ 子命令词表行（家族同形）")
  assert.ok(zsh.includes('ledger) case "\\$words[2]" in'), "zsh ledger 分支（家族同形）")
  assert.ok(fish.includes("__fish_seen_subcommand_from ledger' -a 'migrate audit'"), "fish 子命令行")
  // 负向锁：既有命令集逐字不变（窄锁——顶层词表 ∕ 家族样板行）
  assert.ok(bash.includes('COMPREPLY=( \\$(compgen -W "tui chat acp memory sync reindex distill upgrade completion session ledger -v --version -h --help" -- "\\$cur") )'), "bash 顶层词表逐字")
  assert.ok(bash.includes('COMPREPLY=( \\$(compgen -W "list search put remove sweep" -- "\\$cur") )'), "bash memory 子命令逐字")
  assert.ok(bash.includes('COMPREPLY=( \\$(compgen -W "--origin= --dry-run --confirm" -- "\\$cur") )'), "bash sweep 旗标逐字")
  assert.ok(zsh.includes("'memory[Manage long-term memory]'"), "zsh 顶层词逐字")
  assert.ok(zsh.includes("'ledger[Ledger variants: migrate / audit]'"), "zsh 顶层 ledger 词逐字")
  assert.ok(fish.includes("complete -c thincoder -a memory   -d 'Manage long-term memory'"), "fish 顶层词逐字")
  assert.ok(fish.includes("complete -c thincoder -n '__fish_seen_subcommand_from memory' -a sweep  -d 'Sweep dead origins'"), "fish memory 子命令逐字")
})
