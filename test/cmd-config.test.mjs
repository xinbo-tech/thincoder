/**
 * cmd-config.mjs tests — embeddingPatch three-piece backfill (TUI.md §9.3D, GitHub thincoder#1).
 */
import { test } from "node:test"
import assert from "node:assert/strict"

import { embeddingPatch } from "../src/tui/cmd-config.mjs"
import { DEFAULTS } from "../src/config.mjs"

test("T1: empty config — apiKey saved, baseURL/model filled from DEFAULTS", () => {
  const r = embeddingPatch({}, "K", DEFAULTS.embedding)
  assert.equal(r.apiKey, "K")
  assert.equal(r.baseURL, DEFAULTS.embedding.baseURL)
  assert.equal(r.model, DEFAULTS.embedding.model)
})

test("T2: existing custom baseURL/model (Ollama) preserved, apiKey updated", () => {
  const raw = { embedding: { apiKey: "old", baseURL: "http://localhost:11434", model: "nomic-embed" } }
  const r = embeddingPatch(raw, "new", DEFAULTS.embedding)
  assert.equal(r.apiKey, "new")
  assert.equal(r.baseURL, "http://localhost:11434")
  assert.equal(r.model, "nomic-embed")
})

test("T3: raw.embedding undefined — still fills all three", () => {
  const r = embeddingPatch({}, "K", DEFAULTS.embedding)
  assert.deepEqual(r, { apiKey: "K", baseURL: DEFAULTS.embedding.baseURL, model: DEFAULTS.embedding.model })
})

test("T4: apiKey-only legacy config backfilled", () => {
  const r = embeddingPatch({ embedding: { apiKey: "legacy" } }, "K", DEFAULTS.embedding)
  assert.equal(r.apiKey, "K")
  assert.equal(r.baseURL, DEFAULTS.embedding.baseURL)
  assert.equal(r.model, DEFAULTS.embedding.model)
})