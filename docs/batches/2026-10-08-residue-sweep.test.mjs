/**
 * 2026-10-08-residue-sweep.test.mjs — 批内件（残项清收批 · 2026-10-08 · 台账 #1058）**VSC 半**。
 *
 * 腿集（判据源 = `thincoder/docs/vsc/design/SETTINGS.md` §2.19 ∥ 批档 `docs/batches/2026-10-08-residue-sweep.md` §2.4；
 * 腿 ↔ 用例逐条对照在括号）：
 *   C1（核心 · 先红）容器委托：夹具（`#consult-rows` ∥ `#consult-add`）⇒ `bindConsultRows()` ⇒ 走真弹窗径追加一行
 *     （`openConsultDialog` + 选型 + 提交）⇒ 点该行 `.consult-del` ⇒ 行移除 ∥ `consult-rows-changed` 计数 ≥1。
 *     修前红：追加行无监听（滞绑）⇒ 行在 ∥ 零事件。
 *   C2（回归）建面期现存行 ✕ 同径（同断言）。
 *   C3（源面锁）逐行绑定形零残留 ∥ `#consult-rows` 容器委托在案（closest 守卫 ∥ 行移除 ∥ 原事件派发逐字）。
 *   桌面半（#1052 段出口密钥现读）住同批姊妹件 `docs/batches/2026-10-08-residue-sweep-desktop.test.mjs`。
 *
 * 跑法（自仓库根 thincoder/）：`node --test docs/batches/2026-10-08-residue-sweep.test.mjs`
 * 纪律：零网络 ∥ 零第三方新增（happy-dom = `thincoder-vscode/` 仓内既有 devDep，实读在盘）；随批留存 ·
 * 不进仓套件（VSC `test/files.mjs` 清单 = 空）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, "..", "..")
if (!existsSync(join(ROOT, "thincoder-desktop"))) throw new Error(`须从仓库根（thincoder/）运行——解析根 = ${ROOT}`)
const src = (p) => readFileSync(join(ROOT, p), "utf8")
const mod = (p) => import(pathToFileURL(join(ROOT, p)).href)

// ─── VSC 真 webview（happy-dom —— 仓内既有 devDep，实读在盘；夹具前注册 —— 沿批内件先例）──────────
const { GlobalRegistrator } = await import(pathToFileURL(join(ROOT, "thincoder-vscode/node_modules/@happy-dom/global-registrator/lib/index.js")).href)
GlobalRegistrator.register()
if (typeof Element.prototype.scrollIntoView !== "function") Element.prototype.scrollIntoView = function () {}

const vscState = await mod("thincoder-vscode/webview/settings-state.js")
const vscConsult = await mod("thincoder-vscode/webview/settings-consult-dialog.js")
const vscModels = await mod("thincoder-vscode/webview/settings-models.js")

// ─── VSC 夹具（行容器 + 添加入口 + 假宿主）──────────────────────────────────────────────
function vscReset() {
  vscConsult.closeConsultDialog()
  window._vscode = { postMessage: () => {} }
  window._mcpServers = []
  document.body.innerHTML = `<div id="consult-rows"></div><button id="consult-add"></button>`
}

/** 会诊选型（真浮层径：开菜单 ⇒ provider 行 ⇒ 浮层模型行 ⇒ 点选回填）。 */
function pickConsult(provider, model) {
  vscState.SS.getModels = () => [{ provider, id: model, label: model }]
  document.getElementById("consult-pick-btn").click()
  const providerRow = document.querySelector(".mm-panel .mm-row")
  assert.ok(providerRow !== null, "模型菜单在场（provider 行）")
  providerRow.click()
  const modelRow = document.querySelector(".mm-flyout .mm-row")
  assert.ok(modelRow !== null, "浮层在场（模型行）")
  modelRow.click()
  assert.equal(document.getElementById("consult-provider-value").textContent, vscState.labelFor(provider), "点选回填 provider")
  assert.equal(document.getElementById("consult-model-value").textContent, model, "点选回填 model")
}

/** 弹窗径追加一行（前置真：恰一新增行 + 关框）。 */
function addViaDialog(provider, model) {
  vscConsult.openConsultDialog()
  pickConsult(provider, model)
  document.getElementById("consult-save-btn").click()
  assert.equal(document.getElementById("consult-add-dialog"), null, "提交 ⇒ 关框")
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// C 腿（VSC —— 真 webview ∥ 源面）
// ═══════════════════════════════════════════════════════════════════════════════════════

test("C1 追加行 ✕ 即点即删（先红：无监听 ⇒ 行在 ∥ 零事件）", () => {
  vscReset()
  const rows = document.getElementById("consult-rows")
  let changed = 0
  rows.addEventListener("consult-rows-changed", () => { changed += 1 })
  vscModels.bindConsultRows()
  addViaDialog("deepseek", "m1")
  assert.equal(rows.querySelectorAll(".consult-row").length, 1, "前置：追加行在场")
  changed = 0
  rows.querySelector(".consult-row .consult-del").click()
  assert.equal(rows.querySelectorAll(".consult-row").length, 0, "即点即删（行移除）")
  assert.ok(changed >= 1, "派 `consult-rows-changed`（计数 ≥1）")
})

test("C2 现存行 ✕ 回归：建面期行同径即点即删", () => {
  vscReset()
  const rows = document.getElementById("consult-rows")
  rows.innerHTML = `<div class="consult-row" data-provider="p0" data-model="m0"><span class="consult-model-slot"></span><button class="consult-del">✕</button></div>`
  let changed = 0
  rows.addEventListener("consult-rows-changed", () => { changed += 1 })
  vscModels.bindConsultRows()
  rows.querySelector(".consult-row .consult-del").click()
  assert.equal(rows.querySelectorAll(".consult-row").length, 0, "即点即删（行移除）")
  assert.ok(changed >= 1, "派 `consult-rows-changed`")
})

test("C3 源面锁：逐行绑定形零残留 ∥ 容器委托在案", () => {
  const models = src("thincoder-vscode/webview/settings-models.js")
  const from = models.indexOf("export function bindConsultRows()")
  assert.ok(from >= 0, "bindConsultRows 在档")
  const bind = models.slice(from)
  assert.equal(bind.includes(`row.querySelector(".consult-del")?.addEventListener`), false, "逐行 ✕ 监听零残留")
  assert.equal(/for \(const row of rows\.querySelectorAll\("\.consult-row"\)\)/.test(bind), false, "逐行绑定循环零残留")
  assert.match(bind, /rows\.addEventListener\("click", \(e\) => \{/, "容器 click 委托在案")
  assert.match(bind, /const del = e\.target\.closest \? e\.target\.closest\("\.consult-del"\) : null/, "closest 守卫式（沿 settings-mcp-dialog.js:130）")
  assert.match(bind, /del\.closest\("\.consult-row"\)\?\.remove\(\)/, "行移除语义在案")
  assert.match(bind, /rows\.dispatchEvent\(new window\.Event\("consult-rows-changed", \{ bubbles: true \}\)\)/, "事件名 ∥ 派发逐字同原")
})
