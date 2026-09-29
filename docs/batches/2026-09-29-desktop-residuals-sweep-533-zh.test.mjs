/**
 * 2026-09-29-desktop-residuals-sweep · 微单件（#533 zh 值级更新）—— 临时验证件（潜行形，父侧收位并入批次件）。
 * 判据（派单 ②）：`menuLabels("zh-CN")` ⇒ 三 zh 值（归一后命中）· `menuLabels("fr")` ∕ `menuLabels("")` ⇒ en 回落 ·
 * en 表三值逐字不变（对拍）。
 * 运行 = 自 `thincoder/` 根 `node --test docs/batches/2026-09-29-desktop-residuals-sweep-533-zh.test.mjs`（终位；路径已按终位深度收正 = 父侧 2026-09-29）
 *   （只引 `@thincoder/core` · 零 `/rc/` ⇒ 无需 `--import ./test/rc-resolve.mjs`）。
 */
import test from "node:test"
import assert from "node:assert/strict"

const { menuLabels } = await import(new URL("../../thincoder-desktop/src/main/menu-words.mjs", import.meta.url))

const EN = Object.freeze({ maintenance: "Maintenance", cleanUp: "Clean up session data…", rebuildIndex: "Rebuild session index" })
const ZH = Object.freeze({ maintenance: "维护", cleanUp: "清理会话数据…", rebuildIndex: "重建会话索引" })
const out = (label, value) => console.log(`[读数] ${label}: ${value}`)

test("#533 zh 值级更新：zh-CN 归一命中 zh 三值（提案逐字）+ zh 直命中", () => {
  assert.deepEqual(menuLabels("zh-CN"), ZH) // 归一（zh-CN ⇒ zh）
  assert.deepEqual(menuLabels("zh"), ZH)
  out("menuLabels(zh-CN)", JSON.stringify(menuLabels("zh-CN")))
})

test("#533 回落面：fr ∕ 空 ∕ 缺失 ⇒ en 回落（en 表三值逐字不变 · 对拍）", () => {
  assert.deepEqual(menuLabels("fr"), EN) // 未知 ⇒ en
  assert.deepEqual(menuLabels(""), EN) // 空 ⇒ en
  assert.deepEqual(menuLabels(undefined), EN) // 缺失 ⇒ en
  assert.deepEqual(menuLabels("en"), EN) // en 表三值逐字不变（迁移前字面 · 回归面）
  out("menuLabels(fr) ∕ 空 ∕ 缺失 ∕ en", `${JSON.stringify(menuLabels("fr"))} ∕ ${JSON.stringify(menuLabels(""))} ∕ ${JSON.stringify(menuLabels(undefined))} ∕ ${JSON.stringify(menuLabels("en"))}`)
})
