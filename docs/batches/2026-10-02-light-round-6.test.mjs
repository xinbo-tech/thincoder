/**
 * 2026-10-02-light-round-6.test.mjs — 批内件（轻通道轮六 · 台账 #819 · 收口侧建与跑）。
 * 判据 = 批档 `docs/batches/2026-10-02-light-round-6.md` §2（必要测试判定——笔一三径）；
 * 决策/形式化单源 = `docs/desktop/design/SETTINGS.md` §2.12 ∥ §1 **KD-68**（轮六句）。
 * 笔二（弹窗头行粘顶）= 纯 CSS 视觉 —— 真机走查读数即验收（零单元件——判定在案）。
 *
 * 三径（平 node —— 树面纯函数直测；经 `settingsModalTree`(providers) 取「行 + 结果节点」整树）：
 *   ① 匹配行 ⇒ 该行校验按钮 `data-verify-state` = 结果态 ∥ 本行明细 `.settings-verify` 在场于行内 ∥ 全场恰一（段末回退零节点）；
 *   ② 无匹配行（结果行名不在现列表）⇒ 段末回退 `.settings-verify` 在场 ∥ 不在任何行内；
 *   ③ 空态（`verify = null`）⇒ 零 `.settings-verify` 节点。
 *
 * 本件不进仓套件（批内件 · 随批留存）；跑法（任意 cwd —— 路径按本档自身位置解析）：
 *   node --test docs/batches/2026-10-02-light-round-6.test.mjs
 */
import test from "node:test"
import assert from "node:assert/strict"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import "../../thincoder-desktop/test/rc-resolve.mjs" // `/rc/` 解析钩子（须先于渲染档取件注册）

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..")
const at = (rel) => pathToFileURL(join(ROOT, rel)).href

const i18n = await import(at("thincoder-desktop/renderer/i18n.mjs"))
i18n.initDict({ locale: "zh" })
const { t } = i18n
const { settingsModalTree } = await import(at("thincoder-desktop/renderer/views/settings.mjs"))

// ─── 树面小工具（null 容错）：深搜 / 全收 ───────────────────────────────────────

const findDeep = (node, pred) => {
  if (node === null || typeof node !== "object") return null
  if (Array.isArray(node)) {
    for (const item of node) { const hit = findDeep(item, pred); if (hit !== null) return hit }
    return null
  }
  if (pred(node)) return node
  return findDeep(node.children ?? null, pred)
}
const collectDeep = (node, pred, out = []) => {
  if (node === null || typeof node !== "object") return out
  if (Array.isArray(node)) { for (const item of node) collectDeep(item, pred, out); return out }
  if (pred(node)) out.push(node)
  collectDeep(node.children ?? null, pred, out)
  return out
}

/** 定位判 = `data-verify` 锚（唯 `verifyNode` 置——与 S2 探词 `data-probe` 区分；防类名双生产者误收）。 */
const isVerifyNode = (n) => typeof n?.props?.["data-verify"] === "string"
const isVerifyButton = (n) => n?.props?.["data-action"] === "settings:verify"
const rowOf = (tree, name) => findDeep(tree.card, (n) => n?.props?.["data-provider"] === name)

/** 状态夹具（providers 面 ready + 两行 p1 ∥ p2；`verify` = 参数——其余切片刻意保 none）。 */
const stateWith = (verify) => ({
  locale: "zh",
  theme: "system",
  activeSession: null,
  sessionFlags: {},
  settings: {
    open: false, notice: null, modal: null, configured: true, defaultModel: null,
    wizard: { step: 1, dismissed: false, notice: null },
    providers: { state: "ready", presets: [], providers: [{ name: "p1", hasKey: true }, { name: "p2", hasKey: false }], edit: null, probe: null, draft: null, keyDraft: null },
    verify,
    model: { state: "none", provider: null, current: null, models: [] },
    agent: { state: "none", fields: [] },
    mcp: { state: "none", servers: [], details: {}, form: null },
    env: { state: "none", proxy: { uri: "", web: true, model: false }, shell: { current: null, candidates: [] }, test: null },
    tools: { state: "none", status: null, building: false, keys: null, edit: null },
    models: { state: "none", consult: [], advisor: { provider: null, model: null }, picker: { provider: "", rows: [], model: null }, advisorPicker: { provider: "", rows: [], model: null } },
  },
})

// ─── 腿 ① 匹配行：本行按钮态 + 本行明细（恰一 —— 段末回退零节点）──────────────────

test("轮六腿① 匹配行：本行按钮态 ∥ 本行明细 ∥ 全场恰一（段末回退零节点）", () => {
  const tree = settingsModalTree(stateWith({ kind: "ok", count: 3, reason: null, name: "p1" }), "providers", {})
  assert.ok(tree !== null && tree !== undefined)

  const row1 = rowOf(tree, "p1")
  const row2 = rowOf(tree, "p2")
  assert.ok(row1 !== null && row2 !== null, "两行在场")

  const btn1 = findDeep(row1, isVerifyButton)
  assert.equal(btn1?.props?.["data-verify-state"], "ok", "匹配行按钮态 = ok")
  assert.deepEqual(btn1?.children, [t("settings.providers.verify.okShort")], "按钮词 = 短形")

  const btn2 = findDeep(row2, isVerifyButton)
  assert.equal(btn2?.props?.["data-verify-state"], undefined, "非匹配行按钮无态")
  assert.deepEqual(btn2?.children, [t("settings.providers.verify")], "非匹配行按钮词 = 原词")

  const inRow = findDeep(row1, isVerifyNode)
  assert.ok(inRow !== null, "本行明细在场")
  assert.equal(inRow.props["data-verify"], "ok")
  assert.equal(findDeep(row2, isVerifyNode), null, "他行无明细")

  assert.equal(collectDeep(tree.card, isVerifyNode).length, 1, "全场恰一（段末回退零节点）")
})

// ─── 腿 ② 无匹配行：段末回退在场 ∥ 不在行内 ────────────────────────────────────

test("轮六腿② 无匹配行：段末回退在场 ∥ 不在任何行内", () => {
  const tree = settingsModalTree(stateWith({ kind: "fail", count: null, reason: "probe-failed", name: "ghost" }), "providers", {})
  assert.ok(rowOf(tree, "p1") !== null && rowOf(tree, "p2") !== null, "两行在场（防空过）")
  const all = collectDeep(tree.card, isVerifyNode)
  assert.equal(all.length, 1, "段末回退恰一")
  assert.equal(all[0].props["data-verify"], "fail")
  assert.equal(findDeep(rowOf(tree, "p1"), isVerifyNode), null, "回退不在行内（p1）")
  assert.equal(findDeep(rowOf(tree, "p2"), isVerifyNode), null, "回退不在行内（p2）")
})

// ─── 腿 ③ 空态：零节点 ∥ 按钮无态 ─────────────────────────────────────────────

test("轮六腿③ 空态：零 settings-verify ∥ 按钮无态", () => {
  const tree = settingsModalTree(stateWith(null), "providers", {})
  assert.equal(collectDeep(tree.card, isVerifyNode).length, 0, "空态零 settings-verify")
  const btn = findDeep(rowOf(tree, "p1"), isVerifyButton)
  assert.equal(btn?.props?.["data-verify-state"], undefined, "空态按钮无态")
})
