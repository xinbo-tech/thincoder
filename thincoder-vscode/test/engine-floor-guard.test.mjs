/**
 * engine-floor-guard.test.mjs — W8 前置笔（引擎下限护栏 · A8 裁定 2026-09-15）。
 * 任务书 = `docs/batches/2026-09-15-vsc-core-wiring.md` §2 W8「门 1（引擎下限）」：
 * 值 = `engines.vscode ^1.104.0`；运行期核验 = `activate()` 首步自检（Node 版本 ≥ 22.13
 * 且 `node:sqlite` 可导入）；不满足 ⇒ `showErrorMessage` 明确提示 + 停用记忆面、不崩（不抛）。
 *
 * 覆盖：版本闸边界（22.13）/ 探针分支（Node 够而 sqlite 缺——Electron #47706 形态）/
 * 低于下限 → 提示恰一次（含所需下限 + 实探测版本）+ 记忆面停用 + 不抛 / 本机真探针过闸
 * （兼作环境契约：测试机即产品下限面——dev 机须满足 22.13+）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { window as vscodeWindow } from "vscode"
import { nodeFloorMet, engineFloorMet, applyEngineFloorGuard, isMemoryFaceEnabled } from "../extension.mjs"

/** 提示捕获（mock `window` 是共享对象——临时换 showErrorMessage，finally 还原）。 */
async function withMessageSpy(fn) {
  const calls = []
  const orig = vscodeWindow.showErrorMessage
  vscodeWindow.showErrorMessage = async (msg) => { calls.push(msg) }
  try {
    return { result: await fn(), calls }
  } finally {
    vscodeWindow.showErrorMessage = orig
  }
}

// ─── 版本闸边界（22.13）─────────────────────────────────────────

test("engine floor: Node >= 22.13 boundary", () => {
  assert.equal(nodeFloorMet("22.13.0"), true)
  assert.equal(nodeFloorMet("22.13.1"), true)
  assert.equal(nodeFloorMet("23.4.0"), true)
  assert.equal(nodeFloorMet("24.19.0"), true)
  assert.equal(nodeFloorMet("22.12.9"), false)
  assert.equal(nodeFloorMet("20.18.1"), false)
  assert.equal(nodeFloorMet("22"), false, "major-only 版本按 22.0 判——保守不过闸")
})

// ─── 探针分支：Node 够、node:sqlite 缺（Electron #47706 形态）───

test("engine floor: node:sqlite missing → below floor despite Node >= 22.13", async () => {
  const missing = await engineFloorMet({
    version: "22.18.0",
    loadSqlite: async () => { throw new Error("No such built-in module: node:sqlite") },
  })
  assert.equal(missing, false)
  const present = await engineFloorMet({ version: "22.18.0", loadSqlite: async () => {} })
  assert.equal(present, true, "探针可导入 = 过闸（对照）")
})

// ─── 低于下限：提示 + 记忆面停用 + 不抛 ─────────────────────────

test("engine floor: below floor → one clear notice + memory face off, activation survives", async () => {
  try {
    const { result, calls } = await withMessageSpy(() => applyEngineFloorGuard({ version: "20.18.1" }))
    assert.equal(result, false)
    assert.equal(isMemoryFaceEnabled(), false)
    assert.equal(calls.length, 1, "提示恰一次")
    assert.match(calls[0], /1\.104/)
    assert.match(calls[0], /22\.13/)
    assert.match(calls[0], /20\.18\.1/, "提示携实测版本")
  } finally {
    const ok = await applyEngineFloorGuard() // 还原：本机过闸
    assert.equal(ok, true)
    assert.equal(isMemoryFaceEnabled(), true)
  }
})

// ─── 本机通过路径（真版本 + 真 node:sqlite 探针）─────────────────

test("engine floor: this host passes (real node:sqlite probe)", async () => {
  const ok = await applyEngineFloorGuard()
  assert.equal(ok, true)
  assert.equal(isMemoryFaceEnabled(), true)
})
