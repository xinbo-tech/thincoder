/**
 * config.test.mjs — config 磁盘读层（CODE-HARDENING-BATCH §2.3，2026-09-08）：
 * reloadMcpFromDisk（内含 readMcpSection）mcp.servers 非数组 → ok:false 走畸形回退；
 * 正常数组 → ok:true。纯单元：tmp config.json 注入（readMcpSection 文档化的测试缝）——
 * 无真实 ~/.thincoder、无网络。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { reloadMcpFromDisk } from "../src/config.mjs"

function tmpConfig(content) {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-cfg-"))
  const path = join(dir, "config.json")
  writeFileSync(path, content, "utf8")
  return { path, cleanup: () => rmSync(dir, { recursive: true, force: true }) }
}

test("2.3 mcp.servers 非数组 → ok:false（畸形磁盘配置回退——不再静默空表）", () => {
  const agent = {}
  const t = tmpConfig(JSON.stringify({ mcp: { servers: "not-an-array" } }))
  try {
    const r = reloadMcpFromDisk(agent, t.path)
    assert.equal(r.ok, false)
    assert.ok(r.error, "error carries the malformed-config reason")
  } finally {
    t.cleanup()
  }
})

test("2.3 mcp.servers 正常数组 → ok:true 且 servers 原样返回", () => {
  const agent = {}
  const servers = [{ name: "s1", command: "npx", args: ["-y", "mcp-server"] }]
  const t = tmpConfig(JSON.stringify({ mcp: { servers } }))
  try {
    const r = reloadMcpFromDisk(agent, t.path)
    assert.equal(r.ok, true)
    assert.equal(r.servers.length, 1)
    assert.equal(r.servers[0].name, "s1")
  } finally {
    t.cleanup()
  }
})
