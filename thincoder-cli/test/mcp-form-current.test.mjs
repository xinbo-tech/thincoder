/**
 * mcp-form-current.test.mjs — #58（hygiene-sweep 批 · 台账 #58）机器验收：`/mcp` 字段表单
 * 「现值」提示的脱敏面。
 *
 * 判据（台账处置句）：headers/env 现值改走脱敏——敏感键名（谓词 = 核 settings 同源
 * `isSensitiveKey`）的值位一律遮；非敏感键名保可读。手法 = 直驱 `fieldPicker`（ctx 桩：
 * showPicker 选字段一次再取消；askQuestion 捕获提示串）——生产同码路径（`currentText`）。
 * 零网络零 TTY。
 */
import { test } from "node:test"
import assert from "node:assert/strict"

import { fieldPicker } from "../src/tui/cmd-mcp-form.mjs"

/** 直驱 fieldPicker：逐次 showPicker 依次返回给定字段选择（末次 null = 取消），捕获提示串。 */
async function promptsFor(entry, fields) {
  const prompts = []
  const picks = [...fields, null]
  const ctx = {
    showPicker: async () => (picks.length ? { action: `field:${picks.shift()}` } : null),
    askQuestion: async (q) => { prompts.push(String(q)); return "" }, // 空 = 不变
    pushLine: () => {},
  }
  await fieldPicker(ctx, { title: "Edit", mode: "edit", entry, transport: "http" })
  return prompts
}

test("#58 正常：headers 现值——敏感键值位遮、非敏感键保可读（明文敏感值零出现）", async () => {
  const entry = {
    name: "svc", url: "https://x",
    headers: { Authorization: "Bearer sk-secret-1", "X-Api-Key": "sk-secret-2", "X-Trace": "abc123" },
  }
  const [p] = await promptsFor(entry, ["headers"])
  assert.ok(p.includes("X-Trace=abc123"), "非敏感键保可读（原样列示）")
  assert.ok(p.includes("Authorization=••••") && p.includes("X-Api-Key=••••"), "敏感键值位遮")
  assert.ok(!p.includes("sk-secret-1") && !p.includes("sk-secret-2"), "明文敏感值零出现（提示串）")
})

test("#58 边界：env 同规；空值 → none；无敏感键时逐对可读", async () => {
  const entry = { name: "svc", url: "https://x", env: { API_KEY: "sk-env-1", PATH: "/usr/bin" } }
  const [p] = await promptsFor(entry, ["env"])
  assert.ok(p.includes("PATH=/usr/bin"), "非敏感变量可读")
  assert.ok(p.includes("API_KEY=••••") && !p.includes("sk-env-1"), "敏感变量值位遮（明文零出现）")

  const [empty] = await promptsFor({ name: "svc", url: "https://x" }, ["env"])
  assert.ok(empty.includes("none"), "无 env ⇒ none")
})
