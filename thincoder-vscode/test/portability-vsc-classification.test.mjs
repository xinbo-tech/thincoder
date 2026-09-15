/**
 * portability-vsc-classification.test.mjs — 批次二（可移植性 VSC 镜像面）用例表 1:1：
 * T-V01–T-V06（设计档 `thincoder-vscode/docs/design/PORTABILITY.md` §6）+ AC-V02–AC-V03 机判面（§7）。
 * 零网络 / 零真实 LLM（门禁面 = `executeToolBatches` 假工具夹具——与 T-VG19 同型）。
 * 判据权威 = §3.1（分类权威）/ §3.2（接线表）/ §4.1（声明 schema）/ §4.3（文案逐字）。
 * 2026-09-12 PROSE-ANCHOR-RETIRE：AC-V01 静态面（src/ 全仓判据副本扫描）整删——读 src 文本 = 散文锚
 *（判据见 CLI 侧设计档 TESTING.md §11）。
 */
import { test, after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { classifyPath, clearConventionsCache, isCodePath, isDocPath, isTempPath, loadConventions } from "@thincoder/core/conventions.mjs"
// W12（2026-09-15）：advisor 镜像删旧——`isDocOnlyChange` / 陈旧判定改指核单源
// （`@thincoder/core/advisor/repos.mjs` / `advisor-settle.mjs` 的 `reviewIsStale`——读 `_mutLog`）。
import { isDocOnlyChange } from "@thincoder/core/advisor/repos.mjs"
import { hasCodeMutations } from "../src/agent/run-helpers.mjs"
import { reviewIsStale } from "@thincoder/core/agent-tools/advisor-settle.mjs"
import { executeToolBatches } from "../src/agent/execute-tools.mjs"

// ─── 夹具 ─────────────────────────────────────────────────────────────────────

const tmpDirs = []
after(() => { for (const d of tmpDirs) rmSync(d, { recursive: true, force: true }); clearConventionsCache() })

/** 隔离临时工作区（声明面 / 门禁面——不动真实仓）。 */
function mkws() {
  const dir = mkdtempSync(join(tmpdir(), "pvc-"))
  tmpDirs.push(dir)
  return dir
}
const write = (root, rel, content) => {
  const p = join(root, ...rel.split("/"))
  mkdirSync(join(p, ".."), { recursive: true })
  writeFileSync(p, content, "utf8")
  return p
}
/** 抑制预期内的 console.warn（降级可见性本身由断言/回读证明）。 */
function silenceWarn(fn) {
  const orig = console.warn
  const seen = []
  console.warn = (...a) => seen.push(a.join(" "))
  try { return { value: fn(), warnings: seen } } finally { console.warn = orig }
}
// ─── T-V01–T-V04：分类裁判（VP-10 / AC-V02） ─────────────────────────────────

test("T-V01 正常：无声明 —— src/x.mjs=code / docs/a.md=doc / tmp-x.mjs=temp（AC-V02）", () => {
  const ws = mkws()
  const conv = loadConventions(ws)
  assert.equal(conv.declared, false, "无声明 → declared=false")
  assert.equal(classifyPath("src/x.mjs", conv), "code")
  assert.equal(classifyPath("docs/a.md", conv), "doc")
  assert.equal(classifyPath("tmp-x.mjs", conv), "temp")
  assert.equal(isTempPath("scratch.tmp"), true)
  assert.equal(isDocPath("src/prompts/x.md", conv), false, "src/** 下的 .md 是产品代码")
  // 消费面同源：verify 的 doc-only 快路径 / 变更记账 guard 均走同一裁判
  assert.equal(isDocPath("docs/a.md", conv), true)
  assert.equal(hasCodeMutations({ _touchedFiles: [join(ws, "src", "x.mjs")] }), true)
  assert.equal(hasCodeMutations({ _touchedFiles: [join(ws, "docs", "a.md")] }), false)
})

test("T-V02 边界（原缺陷反证）：packages/foo/src/x.md 判 code（嵌套漏判消除）", () => {
  const ws = mkws()
  const conv = loadConventions(ws)
  assert.equal(classifyPath("packages/foo/src/x.md", conv), "code", "嵌套布局不再当文档绕过门禁")
  assert.equal(isDocPath("packages/foo/src/x.md", conv), false)
  assert.equal(isCodePath("packages/foo/src/x.md", conv), true)
  // win32 反斜杠 / 大小写形态同判（段匹配非锚定 + 大小写不敏感）
  assert.equal(classifyPath("packages\\foo\\SRC\\x.md", conv), "code")
  // 对照：非 code 段的深层文档仍为 doc（不过度拦截）
  assert.equal(classifyPath("packages/foo/docs/x.md", conv), "doc")
})

test("T-V03 边界：声明 codePaths:[\"lib\"] —— lib/a.md=code / src/a.md=doc（声明替换默认）", () => {
  const ws = mkws()
  write(ws, ".thincoder/conventions.json", JSON.stringify({ codePaths: ["lib"] }))
  const conv = loadConventions(ws)
  assert.equal(conv.declared, true)
  assert.deepEqual([...conv.codePaths], ["lib"])
  assert.equal(classifyPath("lib/a.md", conv), "code", "声明段内 .md = 产品代码")
  assert.equal(classifyPath("src/a.md", conv), "doc", "默认段被替换——src 不再是 code 段")
  // isDocOnlyChange 消费面（repos.mjs → conventions 换源）：声明的 code 段结束 doc-only 流
  assert.equal(isCodePath("lib/a.md", conv), true)
  // 全接线（VP-10）：声明面同样驱动变更记账 guard 与在途评审陈旧判定
  assert.equal(hasCodeMutations({ cwd: ws, _touchedFiles: [join(ws, "lib", "notes.md")] }), true, "声明段文件计入代码变更（guard 接声明）")
  assert.equal(hasCodeMutations({ cwd: ws, _touchedFiles: [join(ws, "src", "notes.md")] }), false, "默认段被替换后不再计入（非死记 src）")
  // W12：陈旧判定 = 核 `reviewIsStale`（`_mutLog` 账本——launchSeq 后变更按 code 面判）；
  // 声明面（codePaths）由核 conventions 单源消费。
  const staleEntry = { reviewType: "code", launchSeq: 0, cwd: ws }
  const mutAfter = (abs) => ({ cwd: ws, _mutLog: [{ seq: 1, paths: [abs] }] })
  assert.equal(reviewIsStale(mutAfter(join(ws, "lib", "notes.md")), staleEntry), true, "在途评审陈旧判定按声明段")
  assert.equal(reviewIsStale(mutAfter(join(ws, "src", "notes.md")), staleEntry), false, "声明替换后 src/notes.md 不判陈旧")
})

test("T-V04 错误：conventions.json 非法 JSON / 类型错 → 回退默认 + warn + 不抛；clearConventionsCache() 后重读生效", () => {
  const ws = mkws()
  write(ws, ".thincoder/conventions.json", "{ not json")
  const r1 = silenceWarn(() => {
    let conv
    assert.doesNotThrow(() => { conv = loadConventions(ws) })
    return conv
  })
  assert.deepEqual([...r1.value.codePaths], ["src"], "损坏 → 回退默认（不抛）")
  assert.equal(r1.value.declared, false)
  assert.ok(r1.warnings.some((w) => w.includes("conventions")), "warn 可见（不静默吞）")
  // 类型错（识别键存在但类型错）→ 该键回退 + warn
  write(ws, ".thincoder/conventions.json", JSON.stringify({ codePaths: "lib", index: { codeExtensions: 5 } }))
  clearConventionsCache()
  const r2 = silenceWarn(() => loadConventions(ws))
  assert.deepEqual([...r2.value.codePaths], ["src"], "类型错键回退默认")
  assert.equal(r2.value.declared, false)
  assert.ok(r2.warnings.some((w) => w.includes("invalid value types")), "类型错 warn（不静默）")
  // 清缓存 → 重读生效（缓存 seam）
  write(ws, ".thincoder/conventions.json", JSON.stringify({ codePaths: ["lib"] }))
  clearConventionsCache()
  assert.deepEqual([...loadConventions(ws).codePaths], ["lib"], "clearConventionsCache 后重读声明生效")
})

// ─── T-V05–T-V06：门禁面（VP-10 · VP-11 / AC-V03） ──────────────────────────

/** 门禁夹具：工程模式父代理 + 假 write 工具（touchedPaths 走 args.path）。 */
function gateFixture(ws) {
  const parent = { cwd: ws, history: {}, config: { agent: { engineering: true } }, _touchedFiles: [] }
  const executed = []
  const writeTool = {
    name: "write",
    readonly: false,
    touchedPaths: (a) => [a.path],
    execute: async (args) => { executed.push(args.path); return `Wrote ${args.path}` },
  }
  const runWrite = async (args) => {
    const history = []
    await executeToolBatches(parent, {
      response: { toolCalls: [{ id: "t1", name: "write", arguments: JSON.stringify(args) }] },
      history, fullHistory: [], toolByName: new Map([["write", writeTool]]),
      getAuto: () => true, callbacks: {}, cwd: ws, recentSigs: [], depth: 0,
    })
    return String(history.find((m) => m.role === "tool")?.content ?? "")
  }
  return { parent, executed, runWrite }
}

test("T-V05 正常（门禁）：工程模式 + 无令牌 + 写 src/x.mjs → 拒绝；hint 无 `in docs/`、含声明指路；声明后行为切换（AC-V03）", async () => {
  const ws = mkws()
  const { executed, runWrite } = gateFixture(ws)
  const blocked = await runWrite({ path: "src/x.mjs", content: "x" })
  assert.ok(blocked.startsWith("Error: engineering design gate — "), "前缀保留（§4.3 落笔边界——单串形态）")
  assert.ok(
    blocked.includes("Engineering mode: write the design document first（location per your project's document conventions）, then call advisor with type='design' to review it, and wait for user approval. Implementation is done by eng-coder subagents."),
    "新核心句逐字（§4.3）",
  )
  assert.ok(!blocked.includes("in docs/"), "旧 `in docs/` 指路零残留（AC-V09）")
  assert.ok(
    blocked.includes(" — this path was classified as product code by the default conventions (code paths: src); declare project conventions in .thincoder/conventions.json to adjust."),
    "未声明 → 声明指路追加句逐字（§4.3）",
  )
  assert.deepEqual(executed, [], "被拒写入零执行")
  // 声明后行为切换：codePaths=["lib"] → src/notes.md 判 doc 放行、lib/notes.md 判 code 拒
  // （.mjs 文件两态下都算 code——非文档扩展即产品代码；切换的可观测面 = 文档扩展名的归属）
  write(ws, ".thincoder/conventions.json", JSON.stringify({ codePaths: ["lib"] }))
  clearConventionsCache()
  const allowed = await runWrite({ path: "src/notes.md", content: "x" })
  assert.ok(!allowed.includes("Error: engineering design gate"), "声明替换后 src/notes.md 判 doc → 放行")
  const libBlocked = await runWrite({ path: "lib/notes.md", content: "x" })
  assert.ok(libBlocked.includes("Error: engineering design gate"), "新声明段 lib/notes.md 判 code → 拒（声明面生效）")
  assert.ok(!libBlocked.includes("declare project conventions in .thincoder/conventions.json"), "已声明 → 无声明指路句（declared=true）")
  assert.deepEqual(executed, ["src/notes.md"], "恰放行项执行一次")
})

test("T-V06 边界（门禁）：嵌套 packages/foo/src/x.md 与非字符串路径 → 均拒绝（AC-V03）", async () => {
  const ws = mkws()
  const { executed, runWrite } = gateFixture(ws)
  const nested = await runWrite({ path: "packages/foo/src/x.md", content: "x" })
  assert.ok(nested.includes("Error: engineering design gate"), "嵌套布局漏判消除（原锚定式会放行的路径现被拒）")
  assert.deepEqual(executed, [], "嵌套路径零执行")
  // 非字符串路径（工具未给可解析 path）→ 保守拦截保持
  const noPath = await runWrite({ content: "x" })
  assert.ok(noPath.includes("Error: engineering design gate"), "未知/缺失路径保守拦截保持")
  assert.deepEqual(executed, [], "零执行（保守面）")
})

