/**
 * token-ttl.test.mjs — design-token TTL 语义 + 槽台账 reconcile 面（#154 VSC 侧并入）。
 *
 * 行为面：格式 / 过期判定 fail-closed（畸形串不算过期——由门禁格式拒）· 内存过期清理
 * （`reconcileEngTokensFromSlot`——VSC `reconcileEngDesignTokens` 同口径：过期项在任何门禁
 * 都过不了，清理不改变授权结果）· 槽位删 / 清 · 恢复面 TTL 过滤 + legacy 单值镜像一次性迁移。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import {
  tokenExpiryMs, tokenExpired, removeDesignTokenSlot, purgeExpiredDesignTokens,
  restoreEngTokens, reconcileEngTokensFromSlot,
} from "../token-ttl.mjs"

const UUID = "0f8fad5b-d9cb-469f-a165-70867728950e"
const exp = (ms) => `${UUID}:${ms}`

test("tokenExpiryMs：格式合法 → 数值；畸形 → null（fail-closed 单一权威）", () => {
  assert.equal(tokenExpiryMs(exp(123)), 123)
  assert.equal(tokenExpiryMs("not-a-token"), null)
  assert.equal(tokenExpiryMs(`${UUID}:abc`), null)
  assert.equal(tokenExpiryMs("a:b:c"), null)
  assert.equal(tokenExpiryMs(null), null)
})

test("tokenExpired：仅格式合法且已过 expiry 才为真；畸形不算过期（门禁格式拒）", () => {
  const now = Date.now()
  assert.equal(tokenExpired(exp(now - 1000), now), true)
  assert.equal(tokenExpired(exp(now + 100000), now), false)
  assert.equal(tokenExpired("garbage", now), false)
})

test("removeDesignTokenSlot / purgeExpiredDesignTokens：按 id / 按 token 删 + 遍历清过期（防误删值不符项）", () => {
  const now = Date.now()
  const live = exp(now + 100000)
  const dead = exp(now - 1)
  const agent = { _engDesignTokens: new Map([["a", live], ["b", dead]]) }
  assert.equal(removeDesignTokenSlot(agent, "a", live), true)
  assert.equal(agent._engDesignTokens.has("a"), false)
  assert.equal(removeDesignTokenSlot(agent, "b", "other"), false, "值不符 ⇒ 不删")
  assert.equal(removeDesignTokenSlot(agent, null, live), false, "缺 id 且无命中 ⇒ false")
  agent._engDesignTokens.set("a2", live)
  assert.equal(purgeExpiredDesignTokens(agent), 1, "只清过期项")
  assert.deepEqual([...agent._engDesignTokens.keys()].sort(), ["a2"])
})

test("restoreEngTokens：过期不读回 + legacy 单值镜像仅 Map 空且有效时一次性迁移", () => {
  const now = Date.now()
  const live = exp(now + 100000)
  const dead = exp(now - 1)
  const a1 = {}
  restoreEngTokens(a1, { engDesignTokens: { keep: live, drop: dead } })
  assert.deepEqual([...a1._engDesignTokens.keys()], ["keep"])
  const a2 = {}
  restoreEngTokens(a2, { engDesignToken: live })
  assert.equal(a2._engDesignTokens.get(UUID), live)
  const a3 = {}
  restoreEngTokens(a3, { engDesignTokens: { x: live }, engDesignToken: dead })
  assert.deepEqual([...a3._engDesignTokens.keys()], ["x"], "多槽在 ⇒ 不做镜像迁移")
  const a4 = {}
  restoreEngTokens(a4, { engDesignToken: dead })
  assert.equal(a4._engDesignTokens, undefined, "镜像过期 ⇒ 不迁移（drop）")
})

test("#154 reconcile：内存过期项先清（授权结果零变——清理即删）；无槽可读时仍返回清理后的 Map", () => {
  const now = Date.now()
  const live = exp(now + 100000)
  const dead = exp(now - 1)
  const dir = mkdtempSync(join(tmpdir(), "core-token-ttl-"))
  try {
    const agent = { cwd: dir, _engDesignTokens: new Map([["live", live], ["dead", dead]]) }
    const out = reconcileEngTokensFromSlot(agent)
    assert.equal(out instanceof Map, true)
    assert.deepEqual([...out.keys()], ["live"], "过期项清掉、活项保留")
    assert.deepEqual([...agent._engDesignTokens.keys()], ["live"], "内存同源（同一 Map）")
  } finally { rmSync(dir, { recursive: true, force: true }) }
})
