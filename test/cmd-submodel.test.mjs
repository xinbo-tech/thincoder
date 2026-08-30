/**
 * cmd-submodel.test.mjs — /submodel command: per-type subagent model config.
 */
import { test } from "node:test"
import assert from "node:assert/strict"

function makeCtx(initial = { subagentModel: null, subagentModels: {} }) {
  const calls = []
  const agent = { config: { agent: { ...initial } }, activeProvider: "glm", provider: { model: "glm-5.2" } }
  const ctx = {
    agent,
    pushLine: (t) => calls.push(t),
    showPicker: async () => null,
    askQuestion: async () => null,
    pickModelForSlot: async () => null,
    persistRaw: async (fn) => {
      const raw = JSON.parse(JSON.stringify(agent.config))
      fn(raw)
      agent.config = raw
      calls.push(`persist:${JSON.stringify(raw.agent)}`)
    },
  }
  return { ctx, calls, agent }
}

test("/submodel <value> sets the global default", async () => {
  const { ctx, agent } = makeCtx()
  await handleSubmodelCommand(ctx, ["deepseek:deepseek-v4-flash"])
  assert.equal(agent.config.agent.subagentModel, "deepseek:deepseek-v4-flash")
})

test("/submodel <type> <value> sets only that type", async () => {
  const { ctx, agent } = makeCtx()
  await handleSubmodelCommand(ctx, ["coder", "deepseek-v4-flash"])
  assert.equal(agent.config.agent.subagentModels.coder, "deepseek-v4-flash")
  assert.equal(agent.config.agent.subagentModel, null, "global untouched")
  assert.equal(agent.config.agent.subagentModels.explore, undefined)
})

test("/submodel <type> with no value shows the slot", async () => {
  const { ctx, calls } = makeCtx({ subagentModel: "deepseek:x", subagentModels: { coder: "glm:glm-5.2" } })
  await handleSubmodelCommand(ctx, ["coder"])
  assert.ok(calls.some((c) => c.includes("coder") && c.includes("glm:glm-5.2")), "shows type value")
  await handleSubmodelCommand(ctx, ["explore"])
  assert.ok(calls.some((c) => c.includes("explore") && c.includes("deepseek:x")), "shows global fallback")
})

test("/submodel reset clears global; reset <type> clears only that type", async () => {
  const { ctx, agent } = makeCtx({ subagentModel: "deepseek:x", subagentModels: { coder: "glm:glm-5.2" } })
  await handleSubmodelCommand(ctx, ["reset", "coder"])
  assert.equal(agent.config.agent.subagentModels, undefined, "empty subagentModels object removed from config")
  assert.equal(agent.config.agent.subagentModel, "deepseek:x", "global kept")
  await handleSubmodelCommand(ctx, ["reset"])
  assert.equal(agent.config.agent.subagentModel, null)
})

test("/submodel unknown type errors", async () => {
  const { ctx, calls } = makeCtx()
  await handleSubmodelCommand(ctx, ["nope", "deepseek:x"])
  assert.ok(calls.some((c) => c.includes("Unknown subagent type")), "errors on unknown type")
})

test("/submodel picker: slot pick writes picked model to that slot", async () => {
  const { ctx, agent } = makeCtx()
  // Slot menu → pick "coder"; slot submenu → "set"; pickModelForSlot returns selection.
  // The main menu is re-shown after each slot edit — return null on the 2nd visit to exit.
  let menuVisits = 0
  ctx.showPicker = async (title) => {
    if (title === "Subagent Models") {
      menuVisits++
      return menuVisits === 1 ? { action: "slot", slot: "coder" } : null
    }
    if (title === "Subagent coder") return { action: "set" }
    return null
  }
  ctx.pickModelForSlot = async () => ({ provider: "deepseek", model: "deepseek-v4-flash" })
  await handleSubmodelCommand(ctx, [])
  assert.equal(agent.config.agent.subagentModels.coder, "deepseek:deepseek-v4-flash")
})

import { handleSubmodelCommand } from "../src/tui/cmd-submodel.mjs"
