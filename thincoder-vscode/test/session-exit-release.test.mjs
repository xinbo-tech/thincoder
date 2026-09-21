/** session-exit-release.test.mjs — EXIT-CLAIM-RELEASE 批（2026-09-21 · SESSION.md §6.18）T5：
 *  VSC 退出释放端壳机判——`releaseClaimsOnExit` 沙箱（无 workspace 跳过 / 有 workspace 转核 /
 *  核返回值透传）+ `deactivate` 结构机检（async 形 / 释放前置 / workspace 判据 = 入参形——
 *  评审 #3 钉死 / 包装 vscode-free）。端壳 = 纯转口（F-XR4——容忍逻辑全在核）；核面行为归
 *  thincoder-core `session-slot-write.test.mjs` T1/T2/T3（零复制）。 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { _setSessionsDirForTest, _resetSessionsDirForTest, claimSlot, getSessionId, loadManifest, manifestPath, readEndMarker, writeEndMarker } from "@thincoder/core/session-slots.mjs"
import { releaseClaimsOnExit } from "../src/extension/session-io.mjs"

const CWD = process.platform === "win32" ? "C:\\proj\\vsc-exit-release" : "/proj/vsc-exit-release"

/** 盘面夹具：本进程认领 7 + marker 指 7（真核面驱动——端壳转口后落核同一路径）。 */
function seed() {
  const dir = mkdtempSync(join(tmpdir(), "tc-vsc-exit-"))
  _setSessionsDirForTest(dir)
  writeFileSync(manifestPath(CWD), JSON.stringify({ version: 2, slots: { 7: { updatedAt: 1 } }, slotSessions: {}, sessionId: null }))
  claimSlot(CWD, 7)
  writeEndMarker(CWD, 7)
  return dir
}

function cleanup(dir) {
  _resetSessionsDirForTest()
  rmSync(dir, { recursive: true, force: true })
}

test("T5a 有 workspace ⇒ 转核释放（返回 true ∧ 盘面无本进程条目 ∧ marker 路标保留）", () => {
  const dir = seed()
  try {
    assert.equal(releaseClaimsOnExit(CWD, true), true, "有 workspace ⇒ 转核（核 true 透传）")
    const m = loadManifest(CWD)
    assert.equal(m.slotSessions[7], undefined, "本进程认领已释放（核 releaseClaimsAll 已跑）")
    assert.equal(readEndMarker(CWD)?.slot, 7, "marker 仍指 7——路标保留（F-XR2 零触碰 marker 面）")
  } finally { cleanup(dir) }
})

test("T5b 无 workspace ⇒ 跳过释放（false ∧ 盘面零动——不给宿主 cwd 造盘面）", () => {
  const dir = seed()
  try {
    assert.equal(releaseClaimsOnExit(CWD, false), false, "hasWorkspace false ⇒ 端壳短路返回 false（不落核）")
    assert.equal(loadManifest(CWD).slotSessions[7], getSessionId(), "认领保留（零写）")
    assert.equal(readEndMarker(CWD)?.slot, 7, "marker 零动")
  } finally { cleanup(dir) }
})

test("T5c 核 false 透传：有 workspace 但本进程无认领 ⇒ false（端壳零吞值，他端条目零动）", () => {
  const dir = mkdtempSync(join(tmpdir(), "tc-vsc-exit-"))
  _setSessionsDirForTest(dir)
  try {
    writeFileSync(manifestPath(CWD), JSON.stringify({ version: 2, slots: {}, slotSessions: { 9: "999999-0-ghost" }, sessionId: null }))
    assert.equal(releaseClaimsOnExit(CWD, true), false, "核 false（无本进程认领早退）透传")
    assert.equal(loadManifest(CWD).slotSessions[9], "999999-0-ghost", "他端条目零动（值条件天然）")
  } finally { cleanup(dir) }
})

test("T5d deactivate 结构机检：async 形 ∧ 释放前置 ∧ workspace 判据参数形 ∧ 包装 vscode-free ∧ 清单登记", () => {
  const ext = readFileSync(new URL("../extension.mjs", import.meta.url), "utf8")
  assert.match(ext, /export\s+async\s+function\s+deactivate\(\)/, "deactivate = async 形（宿主 await 窗口）")
  const body = ext.slice(ext.indexOf("export async function deactivate"))
  const rel = body.indexOf("releaseClaimsOnExit(")
  const stop = body.indexOf("stopSampler()")
  assert.ok(rel > -1, "释放调用在 deactivate 体内")
  assert.ok(stop > -1 && rel < stop, "释放前置于既有三步（stopSampler / closeAllMcp / dispose）")
  assert.match(body, /workspaceFolders/, "workspaceFolders 在本侧解析（import vscode 侧——评审 #3 参数形）")

  // 包装体 vscode-free（评审 #3——node 可测缝保持）：函数体代码面（剥注释）零 vscode 依赖
  const io = readFileSync(new URL("../src/extension/session-io.mjs", import.meta.url), "utf8")
  const fnBody = io.slice(io.indexOf("export function releaseClaimsOnExit"), io.indexOf("Model prefs"))
  const fnCode = fnBody.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1")
  assert.equal(/\bvscode\b/.test(fnCode), false, "包装 vscode-free（workspace 判据 = 入参形）")
  assert.match(fnCode, /releaseClaimsAll/, "转核薄函数（端壳纯转口——容忍逻辑全在核）")

  // 清单登记（runner fail-closed——未登记永不执行）
  const manifest = readFileSync(new URL("./files.mjs", import.meta.url), "utf8")
  assert.ok(manifest.includes('"test/session-exit-release.test.mjs"'), "单元清单登记（test/files.mjs）")
})
