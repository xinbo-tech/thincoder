/**
 * portability-classification.test.mjs — PORTABILITY 批（FR10–FR15 · CLI 面）面①
 * 用例表 T-01–T-09 / T-22（PO-10 · PO-11 文案面）。
 *
 * 断言对象 = @thincoder/core/conventions.mjs（代码/文档/临时分类的唯一权威 + 项目声明面）
 *   + src/agent/dispatch.mjs 父侧设计门 + src/advisor/repos.mjs 守卫换源。
 * 构造手法照先例：executeToolCalls 直驱（design-token-settlement）+ sessions 目录隔离缝
 * （门禁的"任一活槽"判定会回读槽文件——隔离后不碰真实 ~/.thincoder）。
 */
import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import {
  classifyPath, isCodePath, isDocPath, isTempPath, loadConventions, clearConventionsCache,
} from "@thincoder/core/conventions.mjs"
import { hasCodeMutations } from "../src/advisor/repos.mjs"
import { executeToolCalls } from "../src/agent/dispatch.mjs"
import { _setSessionsDirForTest, _resetSessionsDirForTest } from "../src/session-slots.mjs"

let tmp, sessionsDir
beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), "portability-class-"))
  sessionsDir = mkdtempSync(join(tmpdir(), "portability-sess-"))
  _setSessionsDirForTest(sessionsDir)
  clearConventionsCache()
})
afterEach(() => {
  _resetSessionsDirForTest()
  clearConventionsCache()
  rmSync(tmp, { recursive: true, force: true })
  rmSync(sessionsDir, { recursive: true, force: true })
})

/** 写项目声明（对象或原始字符串）→ 清缓存（loadConventions 按根缓存）。 */
function declare(payload) {
  mkdirSync(join(tmp, ".thincoder"), { recursive: true })
  writeFileSync(join(tmp, ".thincoder", "conventions.json"),
    typeof payload === "string" ? payload : JSON.stringify(payload))
  clearConventionsCache()
}

// ─────────────────────────────────────────────────────────────────────────────
// T-01/T-02/T-03/T-04：分类裁判（正常 / 边界 / 嵌套反证 / 分隔符与祖先段）
// ─────────────────────────────────────────────────────────────────────────────
test("T-01 正常：无声明时 src/x.mjs=code · docs/a.md=doc · tmp-x.mjs=temp", () => {
  const conv = loadConventions(tmp)
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
  const conv = loadConventions(tmp)
  assert.equal(classifyPath("packages/foo/src/x.md", conv), "code")
  assert.equal(isDocPath("packages/foo/src/x.md", conv), false)
  // 对照：不在代码段内的同名文档仍是 doc（判据不误伤）
  assert.equal(classifyPath("packages/foo/docs/x.md", conv), "doc")
})

test("T-03 边界：声明 codePaths:['lib'] 替换默认（lib/a.md=code · src/a.md=doc）", () => {
  declare({ codePaths: ["lib"] })
  const conv = loadConventions(tmp)
  assert.equal(classifyPath("lib/a.md", conv), "code")
  assert.equal(classifyPath("src/a.md", conv), "doc")
  // 多段声明（packages/core）按段序列匹配
  declare({ codePaths: ["lib", "packages/core"] })
  const c2 = loadConventions(tmp)
  assert.equal(classifyPath("x/packages/core/y.md", c2), "code")
  assert.equal(classifyPath("lib/a.md", c2), "code")
  assert.equal(classifyPath("src/a.mjs", c2), "code", "非文档扩展名在无代码段时仍算 code")
})

test("T-04 边界：分隔符/绝对路径/点段一致；祖先段反例 C:\\src\\app\\docs\\a.md → code（已登记代价）", () => {
  const conv = loadConventions(tmp)
  assert.equal(classifyPath("src\\a.md", conv), "code")
  assert.equal(classifyPath("D:\\proj\\src\\a.mjs", conv), "code")
  assert.equal(classifyPath("D:/proj/docs/a.md", conv), "doc")
  assert.equal(classifyPath("./docs/a.md", conv), "doc")
  // 祖先段反例（§6 T-04 注）：段匹配含祖先——默认约定已知代价；项目声明 codePaths 即消除
  assert.equal(classifyPath("C:\\src\\app\\docs\\a.md", conv), "code")
  declare({ codePaths: ["mysrc"] })
  const c2 = loadConventions(tmp)
  assert.equal(classifyPath("C:\\src\\app\\docs\\a.md", c2), "doc", "声明后祖先段假阳消除")
})

// ─────────────────────────────────────────────────────────────────────────────
// T-05 错误：声明损坏/类型错 → 回退默认 + 不抛（降级可见）
// ─────────────────────────────────────────────────────────────────────────────
test("T-05 错误：conventions.json 非法 JSON / 类型错 → 回退默认 + console.warn + 不抛", () => {
  const warns = []
  const origWarn = console.warn
  console.warn = (...a) => warns.push(a.join(" "))
  try {
    declare("{ not json")
    const c1 = loadConventions(tmp)
    assert.deepEqual([...c1.codePaths], ["src"], "非法 JSON → 默认 codePaths")
    assert.equal(c1.declared, false)
    assert.ok(warns.some((w) => w.includes("[conventions]")), "非法 JSON → console.warn 在场")
    // 类型错 —— 独立断言（清空告警缓冲：确保该分支自身触发 warn，非前一场景残留）
    warns.length = 0
    declare({ codePaths: "src", index: { codeExtensions: "md" }, advisor: 5 })
    const c2 = loadConventions(tmp)
    assert.deepEqual([...c2.codePaths], ["src"], "类型错 → 默认（不抛）")
    assert.deepEqual([...c2.index.codeExtensions], [], "类型错的扩展名表 → 空（并集不生效）")
    assert.equal(c2.declared, false, "未生效的声明 = not declared（门禁提示据此给声明指路）")
    assert.ok(warns.some((w) => w.includes("[conventions]")), "类型错 → console.warn 在场（逐键类型校验不静默）")
  } finally { console.warn = origWarn }
})

test("T-04b 守卫换源：tmp-x.mjs 不计 code mutation；src/tmp-x.mjs 仍计（既有语义保持）", () => {
  const conv = loadConventions(tmp)
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
  assert.match(text, /declare project conventions in \.thincoder\/conventions\.json to adjust/)
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
