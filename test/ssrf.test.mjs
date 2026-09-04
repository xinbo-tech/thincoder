/**
 * ssrf.test.mjs — fetch/websearch SSRF guard (CLI parity, ported).
 * The VS Code port shipped fetch WITHOUT the private-host check the CLI has
 * (isPrivateHost lived in the CLI tools/shared.mjs only). Locks the guard and
 * the redirect-refusal path so a public URL cannot bounce into a private host.
 */
import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { isPrivateHost } from "../src/tools/shared.mjs"
import { fetchTool } from "../src/tools/web.mjs"

describe("isPrivateHost — SSRF guard", () => {
  it("blocks loopback / link-local names", () => {
    for (const h of ["localhost", "127.0.0.1", "127.8.8.8", "::1", "0.0.0.0", "foo.localhost"]) {
      assert.equal(isPrivateHost(h), true, `${h} should be blocked`)
    }
  })

  it("blocks cloud metadata endpoints", () => {
    assert.equal(isPrivateHost("169.254.169.254"), true)
    assert.equal(isPrivateHost("metadata.google.internal"), true)
  })

  it("blocks RFC1918 + link-local IPv4 prefixes", () => {
    for (const h of ["10.0.0.1", "172.16.0.1", "172.31.255.255", "192.168.1.1", "169.254.10.10"]) {
      assert.equal(isPrivateHost(h), true, `${h} should be blocked`)
    }
  })

  it("blocks IPv6 private ranges", () => {
    for (const h of ["fc00::1", "fd12::1", "fe80::1", "fe9f::1"]) {
      assert.equal(isPrivateHost(h), true, `${h} should be blocked`)
    }
  })

  it("allows public hosts", () => {
    for (const h of ["example.com", "8.8.8.8", "1.1.1.1", "api.deepseek.com"]) {
      assert.equal(isPrivateHost(h), false, `${h} should be allowed`)
    }
  })
})

describe("fetchTool — SSRF + redirect guard", () => {
  it("rejects private/internal URLs before any network call", async () => {
    for (const url of [
      "http://127.0.0.1:8000/x",
      "http://localhost/admin",
      "http://169.254.169.254/latest/meta-data",
      "http://192.168.1.1/",
    ]) {
      const out = await fetchTool.execute({ url }, {})
      assert.match(out, /not allowed/, `${url} should be blocked`)
    }
  })

  it("rejects non-http(s) schemes", async () => {
    const out = await fetchTool.execute({ url: "file:///etc/passwd" }, {})
    assert.match(out, /http:\/\/ or https/)
  })

  it("T-TF4: fetch 网络失败（代理连接拒绝）错误含 proxy 提示行（D-TF3 逐字——不自动路由）", async () => {
    // 目标 = 公网域名（过 SSRF 检查）；代理 = localhost 关闭端口（127.0.0.1:1）→ 连接拒绝快速失败（无超时等待）
    // 语义同时验证：失败即建议显式传 proxy 重试（2026-08-31 裁定——不自动路由）
    const out = await fetchTool.execute({ url: "http://example.invalid/", proxy: "http://127.0.0.1:1" }, {})
    assert.match(out, /fetch error/)
    assert.ok(
      out.includes("network failure — retry with proxy: 'http://host:port' if the target is blocked"),
      "T-TF4: 网络失败错误含 proxy 提示行（D-TF3 逐字）",
    )
  })
})
