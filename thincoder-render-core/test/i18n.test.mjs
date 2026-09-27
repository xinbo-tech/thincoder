/**
 * i18n.test.mjs — 核纯函数层：locale helper（`t` / `setStrings`）。
 *
 * 来源 = `thincoder-vscode/webview/i18n.js` 逐字搬迁（R1）；设计权威 =
 * `docs/render-core/design/RENDER-CORE.md` §3 行 16（核——字符串表来源端各给）/ §5（导出面）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { t, setStrings } from "../i18n.mjs"

test("setStrings + t：命中键取值 / 缺键回落键名", () => {
  setStrings({ "welcome.heading": "ThinCoder" })
  assert.equal(t("welcome.heading"), "ThinCoder")
  assert.equal(t("missing.key"), "missing.key", "缺键 ⇒ 键名本身（回落）")
})

test("t：`${name}` 插值（多变量 / 非字符串值 String 化）", () => {
  setStrings({
    "error.failedProvider": "失败：${name}",
    "x.multi": "${a} 与 ${b}",
  })
  assert.equal(t("error.failedProvider", { name: "DeepSeek" }), "失败：DeepSeek")
  assert.equal(t("x.multi", { a: "一", b: 2 }), "一 与 2", "非字符串值 String 化")
})

test("t：无 vars 时占位符原样保留（零隐式插值）", () => {
  setStrings({ "x.raw": "保留 ${name}" })
  assert.equal(t("x.raw"), "保留 ${name}")
})

test("setStrings：整体替换（旧键不残留）/ null ⇒ 空表", () => {
  setStrings({ "a": "1" })
  assert.equal(t("a"), "1")
  setStrings({ "b": "2" })
  assert.equal(t("a"), "a", "旧表整体替换 ⇒ 旧键回落键名")
  assert.equal(t("b"), "2")
  setStrings(null)
  assert.equal(t("b"), "b", "null ⇒ 空表（回落）")
})
