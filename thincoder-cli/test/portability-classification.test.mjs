/**
 * portability-classification.test.mjs — PORTABILITY 批（FR10–FR15 · CLI 面）面①
 * 用例表 T-01–T-09 / T-22（PO-10 · PO-11 文案面）；声明载体换源（2026-09-27 退役批）：T-29 无档等值 / T-30 旧档在场 / T-31 档非法。
 * F9 辅助面（2026-09-27）：T-26 分类四例 · T-27 父侧门放行与仍拒 · T-28 token 门零变。
 *
 * 断言对象 = @thincoder/core/conventions.mjs（代码/文档/临时/辅助分类的唯一权威 + 项目声明面
 *   ——`PROJECT-MANIFEST.json` 三族键：codePaths / index.*Extensions / advisor.{docMap,standardsDoc}）
 *   + thincoder-core/agent/dispatch.mjs 父侧设计门 + thincoder-core/advisor/repos.mjs 守卫换源。
 * 构造手法照先例：executeToolCalls 直驱（design-token-settlement）+ sessions 目录隔离缝
 * （门禁的"任一活槽"判定会回读槽文件——隔离后不碰真实 ~/.thincoder）。
 */
import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import {
  classifyPath, isCodePath, isDocPath, isTempPath, isAuxPath,
  loadProjectDeclaration, clearDeclarationCache, DEFAULT_DECLARATION,
} from "@thincoder/core/conventions.mjs"
import { _setLogsDirForTest, _resetLogsDirForTest } from "@thincoder/core/log.mjs"
import { hasCodeMutations } from "@thincoder/core/advisor/repos.mjs"
import { executeToolCalls } from "@thincoder/core/agent/dispatch.mjs"
import { recordToolResults } from "@thincoder/core/agent/record-results.mjs"
import { _setSessionsDirForTest, _resetSessionsDirForTest } from "@thincoder/core/session-slots.mjs"

let tmp, sessionsDir
beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), "portability-class-"))
  sessionsDir = mkdtempSync(join(tmpdir(), "portability-sess-"))
  _setSessionsDirForTest(sessionsDir)
  clearDeclarationCache()
})
afterEach(() => {
  _resetSessionsDirForTest()
  clearDeclarationCache()
  rmSync(tmp, { recursive: true, force: true })
  rmSync(sessionsDir, { recursive: true, force: true })
})

/** 写项目声明入 manifest 三族键（对象或原始字符串）→ 清缓存（`loadProjectDeclaration` 按**档路径**缓存）。 */
function declare(payload) {
  writeFileSync(join(tmp, "PROJECT-MANIFEST.json"),
    typeof payload === "string" ? payload : JSON.stringify(payload))
  clearDeclarationCache()
}

/** 隔离日志目录：指定事件名的事件行计数（`log.mjs` 写门在 NODE_TEST_CONTEXT 下需显式测试缝）。 */
function logEventCount(dir, ev) {
  let names = []
  try { names = readdirSync(dir) } catch { return 0 }
  return names.flatMap((n) => readFileSync(join(dir, n), "utf8").split("\n"))
    .filter((l) => l.includes(`"${ev}"`)).length
}

// ─────────────────────────────────────────────────────────────────────────────
// T-01/T-02/T-03/T-04：分类裁判（正常 / 边界 / 嵌套反证 / 分隔符与祖先段）
// ─────────────────────────────────────────────────────────────────────────────
test("T-01 正常：无声明时 src/x.mjs=code · docs/a.md=doc · tmp-x.mjs=temp", () => {
  const conv = loadProjectDeclaration(tmp)
  assert.equal(conv.declared, false, "无声明 = 默认约定")
  assert.equal(classifyPath("src/x.mjs", conv), "code")
  assert.equal(classifyPath("docs/a.md", conv), "doc")
  assert.equal(classifyPath("tmp-x.mjs", conv), "temp")
  assert.equal(isCodePath("src/x.mjs", conv), true)
  assert.equal(isDocPath("docs/a.md", conv), true)
  assert.equal(isTempPath("tmp-x.mjs"), true)
  // src/prompts/*.md 是产品代码（文档扩展名 ≠ 文档，落在代码段内）
  assert.equal(isDocPath("src/prompts/x.md", conv), false)
  // tmp-*.md 仍是文档扩展名（temp 归类不改变 isDocPath 谓词——门禁放行语义保持）
  assert.equal(isDocPath("docs/tmp-x.md", conv), true)
})

test("T-02 边界（原缺陷反证）：packages/foo/src/x.md 判 code——嵌套布局不再绕过设计门禁", () => {
  const conv = loadProjectDeclaration(tmp)
  assert.equal(classifyPath("packages/foo/src/x.md", conv), "code")
  assert.equal(isDocPath("packages/foo/src/x.md", conv), false)
  // 对照：不在代码段内的同名文档仍是 doc（判据不误伤）
  assert.equal(classifyPath("packages/foo/docs/x.md", conv), "doc")
})

test("T-03 边界：声明 codePaths:['lib'] 替换默认（lib/a.md=code · src/a.md=doc）", () => {
  declare({ codePaths: ["lib"] })
  const conv = loadProjectDeclaration(tmp)
  assert.equal(classifyPath("lib/a.md", conv), "code")
  assert.equal(classifyPath("src/a.md", conv), "doc")
  // 多段声明（packages/core）按段序列匹配
  declare({ codePaths: ["lib", "packages/core"] })
  const c2 = loadProjectDeclaration(tmp)
  assert.equal(classifyPath("x/packages/core/y.md", c2), "code")
  assert.equal(classifyPath("lib/a.md", c2), "code")
  assert.equal(classifyPath("src/a.mjs", c2), "code", "非文档扩展名在无代码段时仍算 code")
})

test("T-04 边界：分隔符/绝对路径/点段一致；祖先段反例 C:\\src\\app\\docs\\a.md → code（已登记代价）", () => {
  const conv = loadProjectDeclaration(tmp)
  assert.equal(classifyPath("src\\a.md", conv), "code")
  assert.equal(classifyPath("D:\\proj\\src\\a.mjs", conv), "code")
  assert.equal(classifyPath("D:/proj/docs/a.md", conv), "doc")
  assert.equal(classifyPath("./docs/a.md", conv), "doc")
  // 祖先段反例（§6 T-04 注）：段匹配含祖先——默认约定已知代价；项目声明 codePaths 即消除
  assert.equal(classifyPath("C:\\src\\app\\docs\\a.md", conv), "code")
  declare({ codePaths: ["mysrc"] })
  const c2 = loadProjectDeclaration(tmp)
  assert.equal(classifyPath("C:\\src\\app\\docs\\a.md", c2), "doc", "声明后祖先段假阳消除")
})

// ─────────────────────────────────────────────────────────────────────────────
// T-05 错误：声明损坏/类型错 → 回退默认 + 不抛（降级可见）
// ─────────────────────────────────────────────────────────────────────────────
test("T-05 错误：manifest 非法 JSON / 形态错 → 回退默认 + console.warn + 不抛", () => {
  const warns = []
  const origWarn = console.warn
  console.warn = (...a) => warns.push(a.join(" "))
  try {
    declare("{ not json")
    const c1 = loadProjectDeclaration(tmp)
    assert.deepEqual([...c1.codePaths], ["src"], "非法 JSON → 默认 codePaths")
    assert.equal(c1.declared, false)
    assert.ok(warns.some((w) => w.includes("[declaration]")), "非法 JSON → console.warn 在场")
    // 形态错（三族键形态非法 = manifest 非法——fail-closed）——独立断言（清空告警缓冲）
    warns.length = 0
    declare({ codePaths: "src", index: { codeExtensions: "md" }, advisor: 5 })
    const c2 = loadProjectDeclaration(tmp)
    assert.deepEqual([...c2.codePaths], ["src"], "形态错 → 默认（不抛）")
    assert.deepEqual([...c2.index.codeExtensions], [], "形态错的扩展名表 → 空（并集不生效）")
    assert.equal(c2.declared, false, "未生效的声明 = not declared（门禁提示据此给声明指路）")
    assert.ok(warns.some((w) => w.includes("[declaration]")), "形态错 → console.warn 在场（fail-closed 不静默）")
  } finally { console.warn = origWarn }
})

test("T-04b 守卫换源：tmp-x.mjs 不计 code mutation；src/tmp-x.mjs 仍计（既有语义保持）", () => {
  const conv = loadProjectDeclaration(tmp)
  assert.equal(hasCodeMutations({ _touchedFiles: ["docs/a.md"], _mutatedThisRun: true, cwd: tmp }), false, "纯文档不算代码变更")
  assert.equal(hasCodeMutations({ _touchedFiles: [`${tmp}/tmp-x.mjs`], _mutatedThisRun: true, cwd: tmp }), false, "scratch 临时文件不算代码变更")
  assert.equal(hasCodeMutations({ _touchedFiles: [`${tmp}/src/tmp-x.mjs`], _mutatedThisRun: true, cwd: tmp }), true, "src/** 无条件算代码（含 tmp-*）")
  assert.equal(hasCodeMutations({ _touchedFiles: [], _mutatedThisRun: true, cwd: tmp }), true, "无路径记账 → 保守算代码")
  assert.equal(classifyPath(`${tmp}/src/a.md`, conv), "code", "绝对路径同样判 code")
})

// ─────────────────────────────────────────────────────────────────────────────
// T-06–T-09 / T-22：父侧设计门（正常 / 嵌套反证 / 设计产物豁免 / 文案 / 保守拦截）
// ─────────────────────────────────────────────────────────────────────────────
const writeTool = { name: "write", readonly: false, touchedPaths: (a) => [a.path], execute: async () => "written" }
const toolByName = new Map([["write", writeTool]])
const call = (args) => ({ name: "write", arguments: JSON.stringify(args), id: "c1" })
const engParent = (over = {}) => ({
  cwd: tmp, _slot: null, config: { agent: { engineering: true } }, _role: undefined,
  planMode: false, autoApprove: false, _mutLog: [], _mutationSeq: 0, _engDesignTokens: undefined, ...over,
})
const runWrite = (p, agent = engParent()) => executeToolCalls(agent, toolByName, [call({ path: p })], {}, 0, undefined)

test("T-06/T-07/T-08 门禁：src/x.mjs 拒 · packages/foo/src/x.md 拒（原为放行=反证锁）· docs/design/x.md 放行", async () => {
  const r1 = await runWrite("src/x.mjs")
  assert.equal(r1[0].ok, false)
  assert.match(String(r1[0].result), /design review required/)
  const r2 = await runWrite("packages/foo/src/x.md")
  assert.equal(r2[0].ok, false, "嵌套布局下的 src 文档——原判据放行、现拒绝")
  assert.match(String(r2[0].result), /design review required/)
  const r3 = await runWrite("docs/design/x.md")
  assert.equal(r3[0].ok, false, "无权限处理器时仍不执行——但不是设计门")
  assert.match(String(r3[0].result), /no permission handler configured/)
  assert.ok(!String(r3[0].result).includes("design review required"), "设计产物豁免保持")
})

test("T-09 文案：门禁拒绝 hint 含声明指路、不含 `in docs/`；声明生效后指路消失", async () => {
  const r = await runWrite("src/x.mjs")
  const text = String(r[0].result)
  assert.ok(!text.includes("in docs/"), "旧文案 `in docs/` 零残留")
  assert.match(text, /location per your project's document conventions/)
  assert.match(text, /declare project conventions in PROJECT-MANIFEST\.json to adjust/)
  // 声明生效（AC-04 行为切换）：codePaths ['lib'] → lib/*.md 拒绝、src/a.md 放行
  declare({ codePaths: ["lib"] })
  const rLib = await runWrite("lib/a.md")
  assert.match(String(rLib[0].result), /design review required/, "声明后的代码段进入门禁")
  assert.ok(!String(rLib[0].result).includes("declare project conventions"), "已声明 → 不再提示声明")
  const rSrc = await runWrite("src/a.md")
  assert.ok(!String(rSrc[0].result).includes("design review required"), "声明替换默认后 src 不再判代码")
})

test("T-22 边界（门禁·保守）：touchedPaths 返回非字符串/缺失 → 拒绝（未知路径不放行）", async () => {
  const oddTool = { name: "write", readonly: false, touchedPaths: () => [undefined], execute: async () => "written" }
  const oddByName = new Map([["write", oddTool]])
  const r1 = await executeToolCalls(engParent(), oddByName, [call({ path: "src/x.mjs" })], {}, 0, undefined)
  assert.equal(r1[0].ok, false)
  assert.match(String(r1[0].result), /design review required/, "非字符串路径 = 保守拦截（保持）")
  const noPathsTool = { name: "write", readonly: false, touchedPaths: () => [], execute: async () => "written" }
  const r2 = await executeToolCalls(engParent(), new Map([["write", noPathsTool]]), [call({ path: "docs/a.md" })], {}, 0, undefined)
  assert.match(String(r2[0].result), /no permission handler configured/, "空路径集 → 不吃保守分支（文档豁免按声明判）")
})

// ─────────────────────────────────────────────────────────────────────────────
// #327（TOOLS.md §6.17）：`args = null` 边界——消费面零裸抛（T-22 族扩）
// ─────────────────────────────────────────────────────────────────────────────

test("T-23 边界（#327）：args = null 两态 ⇒ 设计闸零裸抛、保守拒（原裸 TypeError 逸出）", async () => {
  // 态①：有钩子——钩子对 null 裸解引用（#327 前的裸抛根因）
  const hooked = { name: "write", readonly: false, touchedPaths: (a) => [a.path], execute: async () => "written" }
  const r1 = await executeToolCalls(engParent(), new Map([["write", hooked]]), [{ name: "write", arguments: "null", id: "c1" }], {}, 0, undefined)
  assert.equal(r1[0].ok, false)
  assert.match(String(r1[0].result), /design review required/, "未知路径（非字符串）⇒ 保守拦截保持")
  // 态②：无钩子——单参兜底 ⇒ [undefined]（同判）
  const bare = { name: "write", readonly: false, execute: async () => "written" }
  const r2 = await executeToolCalls(engParent(), new Map([["write", bare]]), [{ name: "write", arguments: "null", id: "c2" }], {}, 0, undefined)
  assert.equal(r2[0].ok, false)
  assert.match(String(r2[0].result), /design review required/)
})

test("T-25 边界（#327 同族）：畸形 args（null）下工具抛错 ⇒ 整跑不崩、收口为成形 Error 结果", async () => {
  // 触发面 = autoApprove 短路（非工程面，设计闸不入）——异常路径同样不得裸解引用 args
  const boom = { name: "write", readonly: false, touchedPaths: (a) => [a.path], execute: async () => { throw new TypeError("boom: tool-side null deref") } }
  const agent = engParent({ autoApprove: true, config: { agent: {} }, _touchedFiles: [] })
  const r = await executeToolCalls(agent, new Map([["write", boom]]), [{ name: "write", arguments: "null", id: "c1" }], {}, 0, undefined)
  assert.equal(r[0].ok, false)
  assert.match(String(r[0].result), /^Error: boom: tool-side null deref/, "成形 Error 结果（不得以裸 TypeError 逸出整跑）")
})

test("T-24 消费面（#327）：畸形 arguments（null）零裸抛——记账面跳过、流程成形收口", async () => {
  const agent = { cwd: tmp, history: [], config: { agent: {} }, _touchedFiles: [] }
  const tool = { name: "write", readonly: false, touchedPaths: (a) => [a.path] }
  await assert.doesNotReject(recordToolResults(agent, new Map([["write", tool]]), [
    { toolCall: { name: "write", arguments: "null", id: "c1" }, result: "written", ok: true },
  ]), "畸形 args 不再裸抛（#327 前 = TypeError 逸出 agent 循环）")
  assert.deepEqual(agent._touchedFiles, [], "畸形 args ⇒ 零记账（尽力而为面）")
  // 对照（正常面零回归）：合法 args ⇒ 记账在位
  await recordToolResults(agent, new Map([["write", tool]]), [
    { toolCall: { name: "write", arguments: JSON.stringify({ path: "src/x.mjs" }), id: "c2" }, result: "written", ok: true },
  ])
  assert.deepEqual(agent._touchedFiles, [join(tmp, "src", "x.mjs")])
})

// ─────────────────────────────────────────────────────────────────────────────
// F9 辅助面缺省（2026-09-27）：分类四例 + 父侧门放行与仍拒 + token 门零变（设计档 §5）
// ─────────────────────────────────────────────────────────────────────────────

test("T-26 边界（F9 辅助面）：test / scripts / .thincoder/tmp 判 aux；src/test/** 仍 code；tests→doc 前置不变", () => {
  const conv = loadProjectDeclaration(tmp)
  // 四例读数（J1–J5）
  assert.equal(classifyPath("test/x.mjs", conv), "aux", "J1 test 段 ⇒ aux（≠ code）")
  assert.equal(classifyPath("scripts/x.mjs", conv), "aux", "J2 scripts 段 ⇒ aux")
  assert.equal(classifyPath(".thincoder/tmp/a.mjs", conv), "aux", "J3 .thincoder/tmp 序列 ⇒ aux")
  assert.equal(classifyPath("tests/a/b.md", conv), "doc", "J4 doc 前置——既有文档判据不变（≠ code）")
  assert.equal(classifyPath("src/test/x.mjs", conv), "code", "J5 代码段优先（反例）")
  assert.equal(isAuxPath("test/x.mjs", conv), true, "谓词面 = classifyPath === 'aux'")
  assert.equal(isAuxPath("src/test/x.mjs", conv), false)
  // 边界：任意深度 / 大小写 / 两段序列 / win32 分隔符 / 绝对路径
  assert.equal(classifyPath("packages/foo/tests/deep/x.mjs", conv), "aux", "任意深度")
  assert.equal(classifyPath("PKG/TESTS/x.mjs", conv), "aux", "大小写不敏感（段匹配非锚定）")
  assert.equal(classifyPath(".thincoder\\TMP\\a.mjs", conv), "aux", "两段序列 + win32 分隔符")
  assert.equal(classifyPath(`${tmp}/scripts/x.mjs`, conv), "aux", "绝对路径同判")
  // 前置规则零变：temp 先于 aux（辅助面内的 tmp-* 仍判 temp）
  assert.equal(classifyPath("test/tmp-x.mjs", conv), "temp", "temp 前置（aux 不吞 temp 词义）")
  assert.equal(classifyPath("docs/a.md", conv), "doc", "既有 doc 判据零变")
  // J11 收回：codePaths 列入同段序列 ⇒ 代码段优先命中，辅助面缺省失效
  declare({ codePaths: ["src", "test"] })
  const c2 = loadProjectDeclaration(tmp)
  assert.equal(classifyPath("test/x.mjs", c2), "code", "J11 声明收回 ⇒ 恢复 code（门禁恢复拒）")
  assert.equal(isAuxPath("test/x.mjs", c2), false)
  assert.equal(classifyPath("scripts/x.mjs", c2), "aux", "未列入的辅助面段不受影响")
  assert.equal(classifyPath(".thincoder/tmp/a.mjs", c2), "aux")
})

test("T-27 门禁（F9 辅助面）：无活槽父侧写辅助面放行（恰执行一次）；src/** 仍拒", async () => {
  // auto-approve 夹具（设计档 §5 T-27 注）：豁免写才有「恰执行一次」的可观测读数
  const executed = []
  const writeTool = {
    name: "write", readonly: false, touchedPaths: (a) => [a.path],
    execute: async (a) => { executed.push(a.path); return "written" },
  }
  const byName = new Map([["write", writeTool]])
  const agent = engParent({ autoApprove: true, _touchedFiles: [] })
  const r1 = await executeToolCalls(agent, byName, [call({ path: "test/x.mjs" })], {}, 0, undefined)
  assert.equal(r1[0].ok, true, "J6 辅助面无令牌放行")
  assert.ok(!String(r1[0].result).includes("design review required"), "无设计门拒绝句")
  const r2 = await executeToolCalls(agent, byName, [call({ path: "scripts/x.mjs" })], {}, 0, undefined)
  const r3 = await executeToolCalls(agent, byName, [call({ path: ".thincoder/tmp/a.mjs" })], {}, 0, undefined)
  assert.equal(r2[0].ok, true, "scripts 段同判")
  assert.equal(r3[0].ok, true, ".thincoder/tmp 序列同判")
  assert.deepEqual(executed, ["test/x.mjs", "scripts/x.mjs", ".thincoder/tmp/a.mjs"], "恰各执行一次")
  // J7 仍拒：代码段（含 src/test/**——代码段优先）
  const r4 = await executeToolCalls(agent, byName, [call({ path: "src/x.mjs" })], {}, 0, undefined)
  assert.equal(r4[0].ok, false, "J7 src/** 仍拒")
  assert.match(String(r4[0].result), /design review required/)
  const r5 = await executeToolCalls(agent, byName, [call({ path: "src/test/x.md" })], {}, 0, undefined)
  assert.match(String(r5[0].result), /design review required/, "src/test/** 代码段优先仍拒")
  assert.deepEqual(executed, ["test/x.mjs", "scripts/x.mjs", ".thincoder/tmp/a.mjs"], "被拒项零执行")
})

test("T-28 门禁（F9）：eng-coder 无令牌写辅助面仍拒——token 门零变（判据不看路径）", async () => {
  const executed = []
  const writeTool = {
    name: "write", readonly: false, touchedPaths: (a) => [a.path],
    execute: async (a) => { executed.push(a.path); return "written" },
  }
  const byName = new Map([["write", writeTool]])
  const child = engParent({ _role: "eng-coder", autoApprove: true })
  const r = await executeToolCalls(child, byName, [call({ path: "test/x.mjs" })], {}, 0, undefined)
  assert.equal(r[0].ok, false, "J8 无令牌 ⇒ 拒（辅助面路径不放行）")
  assert.match(String(r[0].result), /Call advisor with type='design' to review the design document before any file modification/, "eng-coder 门文案（判据 = 令牌，非路径）")
  assert.deepEqual(executed, [], "零执行")
  // 正控：令牌在位 ⇒ 同一辅助面路径放行（门行为零变，唯令牌驱动）
  const reviewed = engParent({ _role: "eng-coder", autoApprove: true, _engDesignReviewed: true })
  const r2 = await executeToolCalls(reviewed, byName, [call({ path: "test/x.mjs" })], {}, 0, undefined)
  assert.equal(r2[0].ok, true, "令牌在位 ⇒ 放行")
  assert.deepEqual(executed, ["test/x.mjs"], "恰执行一次")
})

// ── 声明载体换源（2026-09-27 · conventions.json 退役批）：T-29 无档等值 · T-30 旧档在场 · T-31 档非法（判据线 = PORTABILITY §3.1/§3.2/§3.4 + §5）──

test("T-29 正常（无档逐条等值）：loadProjectDeclaration 输出 deepEqual DEFAULT_DECLARATION + 五值读数", () => {
  const conv = loadProjectDeclaration(tmp)
  assert.deepEqual(conv, DEFAULT_DECLARATION, "无 manifest ⇒ 逐条等值默认声明")
  assert.equal(conv.declared, false)
  assert.deepEqual([...conv.codePaths], ["src"])
  assert.deepEqual({ ...conv.index }, { codeExtensions: [], docExtensions: [] })
  assert.deepEqual({ ...conv.advisor }, { docMap: "", standardsDoc: "" })
  assert.deepEqual(["src/x.mjs", "docs/a.md", "tmp-x.mjs", "test/x.mjs", "src/test/x.mjs"].map((p) => classifyPath(p, conv)),
    ["code", "doc", "temp", "aux", "code"], "五值读数（J2）")
})

test("T-30 边界（旧档在场）：哨兵 / 坏 JSON 两态内容零生效 + 一行告警 + 事件 + 基准断言", () => {
  const logDir = mkdtempSync(join(tmpdir(), "portability-retired-log-"))
  _setLogsDirForTest(logDir)
  const warns = []
  const origWarn = console.warn
  console.warn = (...a) => warns.push(a.join(" "))
  const retiredWarns = () => warns.filter((w) => w.includes(".thincoder/conventions.json") && w.includes("retired")).length
  try {
    mkdirSync(join(tmp, ".thincoder"), { recursive: true })
    writeFileSync(join(tmp, ".thincoder", "conventions.json"), JSON.stringify({ codePaths: ["sentinel"] }))
    clearDeclarationCache()
    const c1 = loadProjectDeclaration(tmp)
    assert.deepEqual(c1, DEFAULT_DECLARATION, "哨兵声明零生效（内容零解析——逐条等值默认）")
    assert.equal(classifyPath("sentinel/a.md", c1), "doc", "哨兵段位未进入分类面")
    assert.equal(retiredWarns(), 1, "恰一行退役告警")
    // ② 坏 JSON——零解析：不产 JSON / 非法档错误句（内容从不被读）
    writeFileSync(join(tmp, ".thincoder", "conventions.json"), "{ not json")
    clearDeclarationCache()
    assert.deepEqual(loadProjectDeclaration(tmp), DEFAULT_DECLARATION, "坏 JSON 零生效")
    assert.equal(retiredWarns(), 2, "坏 JSON 态仍是退役告警（每缓存一次一行）")
    assert.ok(!warns.some((w) => /JSON|not a usable declaration/.test(w)), "内容零解析（无 JSON 错误句）")
    assert.equal(logEventCount(logDir, "declaration:retired-file"), 2, "日志事件 declaration:retired-file 逐次在场")
    // ③ 基准断言：旧档落项目根、cwd 深于项目根 ⇒ 仍命中（基准 = manifestFilePath 项目根）
    declare({ codePaths: ["lib"] })
    mkdirSync(join(tmp, "sub", "deep"), { recursive: true })
    const c3 = loadProjectDeclaration(join(tmp, "sub", "deep"))
    assert.equal(c3.declared, true, "深 cwd 读的是项目根的档（三族生效）；基准 = manifestFilePath")
    assert.deepEqual([...c3.codePaths], ["lib"])
    assert.equal(retiredWarns(), 3, "旧档落根、cwd 更深 ⇒ 退役告警仍命中")
  } finally {
    console.warn = origWarn
    _resetLogsDirForTest()
    rmSync(logDir, { recursive: true, force: true })
  }
})

test("T-31 错误（档非法 / 形态错）：整声明回默认 + warn + 不抛（非逐族降级）", () => {
  const warns = []
  const origWarn = console.warn
  console.warn = (...a) => warns.push(a.join(" "))
  try {
    for (const bad of [{ advisor: 5 }, { index: { codeExtensions: "md" } }, { codePaths: ["src", 7] }]) {
      declare(bad)
      const c = loadProjectDeclaration(tmp)
      assert.deepEqual(c, DEFAULT_DECLARATION, `形态错 ⇒ 整声明回默认（${JSON.stringify(bad)}）`)
      assert.equal(c.declared, false)
    }
    assert.equal(warns.filter((w) => w.includes("[declaration]")).length, 3, "每档各一行 warn（fail-closed 可见）")
  } finally { console.warn = origWarn }
})
