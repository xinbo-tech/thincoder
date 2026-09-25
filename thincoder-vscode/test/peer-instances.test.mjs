/**
 * peer-instances.test.mjs — VSC 端感知面**分组半段引核**对拍（peer 收口批 · 台账 #302 ·
 * 设计档 `MULTI-INSTANCE-COLLAB.md` §3.1「聚合半段单源」判据② 行为对拍 / 批档 §2.5 AC-302-2）。
 *
 * 对象 = 端 `peer-instances.mjs` 的聚合产物：分组半段（manifest → 按 sessionId 去重分组）**引核**
 * （`groupSlotSessions` 具名导出）⇒ 同 manifest 四形态（多槽同 sessionId / 非数字槽 / 空 sessionId /
 * pid 不可解析）下，端产物 ≡ 核 `groupSlotSessions` 产物（逐字段）。判据①（结构：端档零本地定义 ∧
 * 具名 import 自核）为静态面，由本档对拍背书行为等价。
 *
 * 沙箱 = `_setSessionsDirForTest`（manifest 落点）+ 端探针缝 `_setAliveProbeForTest` /
 * `_setCmdlineProbeForTest`（转核 `_setProcessProbeTestImpl`——真目录零触、零真实 exec）。
 */
import { test, before, after, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"

import { groupSlotSessions } from "@thincoder/core/peer-instances.mjs"
import { _resetSessionsDirForTest, _setSessionsDirForTest, manifestPath } from "../src/extension/session-slots.mjs"
import { _resetPeerInstancesForTest, _setAliveProbeForTest, _setCmdlineProbeForTest, peerInstancesAsync } from "../src/extension/peer-instances.mjs"

let dir, seq = 0
before(() => { dir = mkdtempSync(join(tmpdir(), "vsc-peer-instances-")) })
after(() => {
  _resetPeerInstancesForTest()
  _resetSessionsDirForTest()
  rmSync(dir, { recursive: true, force: true })
})
beforeEach(() => { _setSessionsDirForTest(join(dir, "sessions")) })
afterEach(() => { _resetPeerInstancesForTest() })

/** 本用例独立 cwd + manifest（slot 属主表形态；slotSessions: slot → "pid-ts-rand"）。 */
function cwdWithManifest(slotSessions) {
  const cwd = join(dir, `proj-${++seq}`)
  const mp = manifestPath(cwd)
  mkdirSync(dirname(mp), { recursive: true })
  writeFileSync(mp, JSON.stringify({ slots: {}, sessionId: null, slotSessions }), "utf8")
  return cwd
}

const pick = (o) => ({ sessionId: o.sessionId, pid: o.pid, slots: o.slots })
const byPid = (a, b) => a.pid - b.pid

test("T-PI1 分组半段引核对拍（AC-302-2）：同 manifest 四形态 ⇒ 端聚合产物 ≡ 核 `groupSlotSessions` 产物（逐字段）", async () => {
  // 四形态同盘：多槽同 sessionId（1+2）· 非数字槽（x）· 空 sessionId（3 槽）· pid 不可解析（`bad` / `notanumber-*`）
  const manifest = {
    slots: {}, sessionId: null,
    slotSessions: {
      1: "9800-1-aaaa", 2: "9800-1-aaaa",
      3: "",
      7: "bad",
      x: "9600-2-bbbb",
      9: "notanumber-3-cccc",
    },
  }
  const cwd = cwdWithManifest(manifest.slotSessions)
  _setAliveProbeForTest(() => new Set([process.pid, 9800, 9600]))
  _setCmdlineProbeForTest(() => null) // 命令探测失败 ⇒ 保守保留（本用例只判分组产物）

  const peers = await peerInstancesAsync(cwd)
  const groups = groupSlotSessions(manifest)
  const core = groups.filter((g) => g.pid != null)
  assert.deepEqual(
    peers.filter((p) => !p.self).map(pick).sort(byPid),
    core.map(pick).sort(byPid),
    "同 manifest ⇒ 端聚合产物 ≡ 核分组产物（逐字段——引核即同一实现）",
  )
  // 四形态逐项实读（核产物基准 = 端产物的引核来源）：多槽同 sessionId 合并 / 空 sessionId 跳过 /
  // 非数字槽 key 不入 slots / pid 不可解析置 null
  assert.deepEqual(groups.map(pick), [
    { sessionId: "9800-1-aaaa", pid: 9800, slots: [1, 2] },
    { sessionId: "bad", pid: null, slots: [7] },
    { sessionId: "notanumber-3-cccc", pid: null, slots: [9] },
    { sessionId: "9600-2-bbbb", pid: 9600, slots: [] },
  ], "四形态逐项（槽序 = 整数键升序后跟插入序）")
  assert.deepEqual(peers.filter((p) => !p.self).map((p) => p.pid), [9600, 9800], "pid 不可解析的组不进同伴列表（端调用面跳过）")
})
