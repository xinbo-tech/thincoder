/**
 * 2026-09-30-defect-fixes-core.test.mjs — 缺陷修复批（#707 ∥ #700）核面批内单测件。
 * 名随批次档 · 住批次目录 · 不进仓套件；复跑（仓根）= `node --test docs/batches/2026-09-30-defect-fixes-core.test.mjs`。
 * 判据面 = 批档 §2 条 1（#707）∥ 条 5（#700）验收腿 + `docs/core/design/MULTI-INSTANCE-COLLAB.md` §3.1
 * ∥ `docs/core/design/MEMORY.md` §6.14 ∕ §8.3。纪律 = 行为断言优先 ∥ 注入缝现成（零真实 exec）。
 *   L707-1：桌面 dev 相对路径启动形 ⇒ isProductProc ∧ classifyEnd=desktop ∧ ownerState=alive。
 *   L707-2（必含「误删风险面」负控）：filterDeadOwners 不判死 ∥ cleanDeadOwners 不删；对照臂三项。
 *   L707-3：五态回归零变（CLI ∥ VSC ∥ 异形 ∥ 缺行 ∥ 探测失败）+ VSC 先判序。
 *   L707-4：显示面 resolveExecutorStates ⇒ alive ∕ desktop ∕ deadExecutors=0 ∕ 尾句非「属主已死」。
 *   L700-1..4/6：谓词 base 换算（等义 ∥ 正腿 ∥ 反腿 ∥ 越界不命中 ∥ 缺省回归）。
 *   L700-5：接线腿（walkProjectFiles 真目录剪枝零列 ∥ sweepStaleRows 桩 db 命中零删 ∥ 非命中照删）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-core"))) throw new Error(`须以仓根（含 thincoder-core/）为 cwd 运行：${ROOT}`)
const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href)

const probe = await load("thincoder-core/process-probe.mjs")
const claims = await load("thincoder-core/session-slot-claims.mjs")
const ledgerExec = await load("thincoder-core/ledger-executors.mjs")
const conv = await load("thincoder-core/conventions.mjs")
const walk = await load("thincoder-core/memory/file-walk.mjs")
const syncTail = await load("thincoder-core/memory/sync-tail.mjs")

/** #707 实测形（台账）：桌面 dev 启动 = 相对路径 electron.exe（无 `thincoder-desktop` 段）。 */
const REL_DEV = "node_modules\\electron\\dist\\electron.exe --remote-debugging-port=9222 --remote-allow-origins=* ."
const ABS_DESKTOP = "\"D:\\teamcode\\thincoder\\thincoder-desktop\\node_modules\\electron\\dist\\electron.exe\" ."
const CLI_FORM = "node /usr/local/lib/node_modules/thincoder-cli/bin/thincoder.cjs chat"
const VSC_FORM = "\"C:\\Program Files\\Microsoft VS Code\\Code.exe\" --type=extensionHost --extensionDevelopmentPath=D:\\x"
const FOREIGN = "notepad.exe C:\\tmp\\a.txt"

// ─── #707 ∥ executor 判活（族扩 + 误删方向负控）────────────────────────────────

test("L707-1·实测相对形 ⇒ 本产品 ∥ desktop ∥ alive（绝对路径形 ∥ 打包名同判）", () => {
  assert.equal(probe.isProductProc(REL_DEV), true, "实测 dev 相对形 ⇒ 本产品")
  assert.equal(probe.classifyEnd(REL_DEV), "desktop", "端标签 = desktop")
  assert.equal(probe.ownerState(19160, { aliveSet: new Set([19160]), cmds: new Map([[19160, REL_DEV]]) }), "alive", "活 + 本产品形 ⇒ alive")
  assert.equal(probe.isProductProc(ABS_DESKTOP), true, "绝对路径形（thincoder-desktop 段）不回归")
  assert.equal(probe.classifyEnd(ABS_DESKTOP), "desktop", "绝对形端标签不变")
})

test("L707-2·误删风险面负控：活属主 + dev 形 ⇒ 不判死 ∥ 不删；对照臂三项", () => {
  // 单条面：filterDeadOwners（cleanDeadOwners 的逐条判据）
  assert.equal(probe.filterDeadOwners(19160, { alive: true, cmdline: REL_DEV }), false, "活 + dev 形 ⇒ 不可删")
  // 清理面真体：cleanDeadOwners（同判据消费——误删方向 = 本次修复要挡的面）
  const m = {
    slotSessions: {
      "2": "19160-1790782638357-lwhku1", // 活桌面 dev 形（本形）⇒ 必不删
      "3": "3101-1790000000000-aaaaaa", // 活 + 异形 ⇒ 可删（pid 复用对照臂）
      "4": "4101-1790000000000-bbbbbb", // 活 + 缺行 ⇒ 保留（D-MI10 对照臂）
      "5": "5101-1790000000000-cccccc", // pid 死 ⇒ 可删（对照组）
    },
  }
  const bundle = {
    aliveSet: new Set([19160, 3101, 4101]),
    cmds: new Map([[19160, REL_DEV], [3101, FOREIGN]]),
  }
  const deletions = claims.cleanDeadOwners(m, bundle)
  assert.notEqual(m.slotSessions["2"], undefined, "误删风险面：活桌面属主条目保留")
  assert.notEqual(m.slotSessions["4"], undefined, "缺行 ⇒ 保守保留")
  assert.equal(m.slotSessions["3"], undefined, "异形（pid 复用）⇒ 删")
  assert.equal(m.slotSessions["5"], undefined, "pid 死 ⇒ 删")
  assert.notEqual(deletions, null, "有删除 ⇒ 返回 deletions 计算函数")
  assert.deepEqual(deletions(), { slotSessions: ["3", "5"] }, "落盘清单 = 仅真死两条")
})

test("L707-3·回归零变：五态与既往逐条同值 + VSC 先判序", () => {
  assert.equal(probe.isProductProc(CLI_FORM), true, "CLI 形 ⇒ 本产品")
  assert.equal(probe.classifyEnd(CLI_FORM), "cli", "CLI 端标签")
  assert.equal(probe.isProductProc(VSC_FORM), true, "VSC 形 ⇒ 本产品")
  assert.equal(probe.classifyEnd(VSC_FORM), "vscode", "VSC 端标签")
  assert.equal(probe.isProductProc(FOREIGN), false, "异形 ⇒ 非本产品")
  const aliveSet = new Set([101, 102, 103, 104])
  assert.equal(probe.ownerState(101, { aliveSet, cmds: new Map([[101, CLI_FORM]]) }), "alive")
  assert.equal(probe.ownerState(102, { aliveSet, cmds: new Map([[102, VSC_FORM]]) }), "alive")
  assert.equal(probe.ownerState(103, { aliveSet, cmds: new Map([[103, FOREIGN]]) }), "dead", "活 + 明确异形 ⇒ dead（PID 复用）")
  assert.equal(probe.ownerState(104, { aliveSet, cmds: new Map() }), "unknown", "缺行 ⇒ unknown")
  assert.equal(probe.ownerState(105, { aliveSet: null, cmds: null }), "unknown", "探测失败 ⇒ unknown")
  assert.equal(probe.ownerState(999, { aliveSet, cmds: new Map() }), "dead", "不在存活集 ⇒ dead")
  assert.equal(probe.filterDeadOwners(104, { alive: true }), false, "缺行 ⇒ 不可删")
  assert.equal(probe.filterDeadOwners(105, {}), false, "未知缺省 ⇒ 不可删")
  assert.equal(probe.filterDeadOwners(103, { alive: true, cmdline: FOREIGN }), true, "异形 ⇒ 可删")
  assert.equal(probe.classifyEnd(`${VSC_FORM} ${ABS_DESKTOP}`), "vscode", "双族同中 ⇒ VSC 先判序不变")
  assert.equal(probe.isProductProc(""), false, "空串 ⇒ false（未知）")
  assert.equal(probe.isProductProc(undefined), false, "undefined ⇒ false（未知）")
})

test("L707-4·显示面：resolveExecutorStates ⇒ alive ∕ desktop ∕ deadExecutors=0 ∕ 尾句非「属主已死」", async () => {
  const prevTtl = ledgerExec._setExecutorProbeTtlForTest(0) // TTL=0 ⇒ 禁缓存恒重探（确定性）
  probe._setProcessProbeTestImpl({
    aliveFn: (pids) => new Set(pids.filter((n) => n === 19160)),
    cmdlineFn: (pids) => new Map(pids.filter((n) => n === 19160).map((n) => [n, REL_DEV])),
  })
  try {
    const live = { inflightExecutors: [{ executor: "19160-1790782638357-lwhku1", updated_at: new Date().toISOString() }] }
    const dead = { inflightExecutors: [{ executor: "77777-1790782638357-dead00", updated_at: new Date().toISOString() }] }
    await ledgerExec.resolveExecutorStates([live, dead], { now: Date.now() })
    assert.deepEqual([live.executors[0].state, live.executors[0].end], ["alive", "desktop"], "活桌面 dev 形 ⇒ alive ∕ desktop")
    assert.equal(live.deadExecutors, 0, "不判死")
    assert.equal(ledgerExec.executorTail(live).includes("属主已死"), false, "尾句非「属主已死」形")
    assert.equal(ledgerExec.executorTail(live).includes("执行中 1"), true, "尾句 = 在途执行中形")
    assert.equal(dead.executors[0].state, "dead", "对照臂：真死 ⇒ dead")
    assert.equal(dead.deadExecutors, 1, "对照臂：deadExecutors 计 1")
    assert.equal(ledgerExec.executorTail(dead).includes("属主已死 1"), true, "对照臂：尾句「属主已死 1」")
  } finally {
    probe._resetProcessProbeTestImpl()
    ledgerExec._setExecutorProbeTtlForTest(prevTtl)
  }
})

// ─── #700 ∥ 排除谓词 base 换算（单源）+ 接线两面 ────────────────────────────────

test("L700-1·等义（cwd=根）+ 前缀边界（openclaw 不吞 openclaw-fork）", () => {
  const root = mkdtempSync(join(tmpdir(), "dx700-"))
  const decl = { root, index: { excludePaths: ["openclaw"] } }
  for (const rel of ["openclaw/a.mjs", "openclaw", "openclaw-fork/a.mjs", "src/openclaw/a.mjs", "other/x.mjs", ""]) {
    assert.equal(conv.isExcludedRelPath(rel, decl, root), conv.isExcludedRelPath(rel, decl), `base=根 与缺省逐字等义：${rel}`)
  }
  assert.equal(conv.isExcludedRelPath("openclaw/a.mjs", decl, root), true, "前缀命中")
  assert.equal(conv.isExcludedRelPath("openclaw", decl, root), true, "恰等命中")
  assert.equal(conv.isExcludedRelPath("openclaw-fork/a.mjs", decl, root), false, "边界不吞")
})

test("L700-2·正腿：base 深于根 ⇒ 换算至根面命中（修前 red）", () => {
  const root = mkdtempSync(join(tmpdir(), "dx700-"))
  const decl = { root, index: { excludePaths: ["sub/build"] } }
  const base = join(root, "sub")
  assert.equal(conv.isExcludedRelPath("build/a.mjs", decl, base), true, "base=根/sub 的 build/a.mjs ⇒ 根面 sub/build/a.mjs ⇒ 排除")
  assert.equal(conv.isExcludedRelPath("build/a.mjs", decl), false, "缺省 = 根相对（对照：同一 rel 不命中）")
  assert.equal(conv.isExcludedRelPath("build", decl, base), true, "恰等（换算后 sub/build）")
  assert.equal(conv.isExcludedRelPath("buildx/a.mjs", decl, base), false, "边界不吞（sub/buildx）")
})

test("L700-3·反腿：base 深于根 ⇒ 反方向不误命中（修前 red）", () => {
  const root = mkdtempSync(join(tmpdir(), "dx700-"))
  const decl = { root, index: { excludePaths: ["docs"] } }
  const base = join(root, "src")
  assert.equal(conv.isExcludedRelPath("docs/b.md", decl, base), false, "src 下的 docs ⇒ 根面 src/docs —— 不排除")
  assert.equal(conv.isExcludedRelPath("docs/b.md", decl), true, "缺省 = 根相对（对照：原样即命中 docs）")
})

test("L700-4·越界腿：越出根面 ⇒ 不命中零抛", () => {
  const root = mkdtempSync(join(tmpdir(), "dx700-"))
  const decl = { root, index: { excludePaths: ["x", "etc", "abs"] } }
  assert.equal(conv.isExcludedRelPath("../x", decl, root), false, "`..` 头 ⇒ 不命中（即便声明 x）")
  assert.equal(conv.isExcludedRelPath("../../etc/a", decl, join(root, "sub")), false, "深一跳越界 ⇒ 不命中")
  assert.equal(conv.isExcludedRelPath("/abs/outside/x", decl, root), false, "绝对形越界 ⇒ 不命中")
  assert.doesNotThrow(() => conv.isExcludedRelPath("../x", decl, root), "零抛")
})

test("L700-5a·接线：walkProjectFiles 真目录剪枝（排除子树零列 ∥ 对照臂 = 零谓词时照列）", async () => {
  const root = mkdtempSync(join(tmpdir(), "dx700-walk-"))
  // 夹具名取非 SKIP 段（`build` 属内建 SKIP_DIRS——会先于谓词剪枝 ⇒ 腿会失判别；见 file-walk.mjs:26 ∥ :94）
  mkdirSync(join(root, "sub", "gen"), { recursive: true })
  mkdirSync(join(root, "sub", "keep"), { recursive: true })
  writeFileSync(join(root, "sub", "gen", "a.mjs"), "export const a = 1\n", "utf8")
  writeFileSync(join(root, "sub", "keep", "b.mjs"), "export const b = 1\n", "utf8")
  const decl = { root, index: { excludePaths: ["sub/gen"] } }
  const control = await walk.walkProjectFiles(root, new Set([".mjs"]))
  assert.deepEqual(control.files.map((f) => f.rel).sort(), ["sub/gen/a.mjs", "sub/keep/b.mjs"], "对照臂：零谓词 ⇒ 排除子树照列（判别力自证）")
  // 接线形 = listProjectFiles 注入面（base = dir）
  const out = await walk.walkProjectFiles(root, new Set([".mjs"]), {
    isExcluded: (rel) => conv.isExcludedRelPath(rel, decl, root),
  })
  assert.deepEqual(out.files.map((f) => f.rel).sort(), ["sub/keep/b.mjs"], "排除子树零列 ∥ 兄弟子树在场")
  assert.equal(out.truncated, false)
})

test("L700-5b·接线：sweepStaleRows 携 base——命中零删 ∥ 非命中照删", async () => {
  const root = mkdtempSync(join(tmpdir(), "dx700-sweep-"))
  const decl = { root, index: { excludePaths: ["sub/build"] } }
  const deleted = []
  const memory = { db: { prepare: (sql) => ({ run: (origin, path) => deleted.push({ origin, path }) }) } }
  // 库内 path = origin 相对（base = 根/sub）；build/old.mjs 的根面形 = sub/build/old.mjs ⇒ 命中排除
  const indexed = new Map([["build/old.mjs", 1], ["gone.mjs", 1]])
  const removed = await syncTail.sweepStaleRows(memory, {
    table: "code_chunks", origin: "d:/x/sub", indexed, seen: new Set(), decl, base: join(root, "sub"),
  })
  assert.equal(removed, 1, "仅非命中一条被删")
  assert.deepEqual(deleted.map((d) => d.path), ["gone.mjs"], "命中排除 ⇒ 零删（修前：同被删）")
})

test("L700-6·缺省回归：[] ∥ 无 index 面 ∥ 空声明 ⇒ 恒 false", () => {
  const root = mkdtempSync(join(tmpdir(), "dx700-"))
  assert.equal(conv.isExcludedRelPath("a/b.mjs", { root, index: { excludePaths: [] } }, root), false, "[] ⇒ false（含 base）")
  assert.equal(conv.isExcludedRelPath("a/b.mjs", { root }, root), false, "无 index 面 ⇒ false")
  assert.equal(conv.isExcludedRelPath("a/b.mjs", null, root), false, "decl 缺 ⇒ false")
  const real = conv.loadProjectDeclaration(root) // 真声明链（无 manifest ⇒ 缺省）
  assert.equal(conv.isExcludedRelPath("a/b.mjs", real, root), false, "缺省声明链 ⇒ false（零行为变化）")
})
