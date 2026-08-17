/**
 * embedding.mjs — vector embeddings
 * OpenAI-compatible /v1/embeddings (SiliconFlow bge-m3 / Ollama / OpenAI all supported),
 * reuses provider.mjs fetch + retry pattern, zero dependencies.
 * Vectors are normalized before storage; dot product then equals cosine similarity.
 */

import { RETRYABLE_STATUS } from "./provider/index.mjs"
const MAX_RETRIES = 3
const BATCH_SIZE = 32 // max texts per request (within SiliconFlow limits)

/** Create an embedder. config: { baseURL, apiKey, model } */
export function createEmbedder(config) {
  if (!config?.baseURL) throw new Error("embedding config: baseURL is required — configure embedding.baseURL in ~/.thincoder/config.json")
  if (!config?.apiKey) throw new Error("embedding config: apiKey is required — configure embedding.apiKey in ~/.thincoder/config.json")
  if (!config?.model) throw new Error("embedding config: model is required — configure embedding.model in ~/.thincoder/config.json")
  return {
    baseURL: config.baseURL.replace(/\/+$/, ""),
    apiKey: config.apiKey,
    model: config.model,
  }
}

/**
 * Batch embedding. texts: string[] → Float32Array[] (normalized)
 * Auto-batches, retries on failure (exponential backoff).
 */
export async function embed(embedder, texts, { signal } = {}) {
  if (texts.length === 0) return []
  const vectors = []
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE)
    const data = await requestWithRetry(embedder, batch, signal)
    // Mismatched count is a hard error — silently accepting would misalign vectors with texts, poisoning the entire index
    if (!Array.isArray(data.data) || data.data.length !== batch.length) {
      throw new Error(`Embedding API returned ${data.data?.length ?? 0} vectors for ${batch.length} inputs`)
    }
    // Spec says data[] order matches input, but sort by index field if present — don't bet on server implementation
    const items = data.data.every((d) => typeof d.index === "number")
      ? [...data.data].sort((a, b) => a.index - b.index)
      : data.data
    for (const item of items) {
      vectors.push(normalize(Float32Array.from(item.embedding)))
    }
  }
  return vectors
}

/** Cosine similarity (inputs are normalized, dot product equals cosine) */
export function cosine(a, b) {
  if (a.length !== b.length) return 0
  let sum = 0
  const n = a.length
  for (let i = 0; i < n; i++) sum += a[i] * b[i]
  return sum
}

/** Float32Array → Buffer suitable for sqlite BLOB storage */
export function toBlob(vec) {
  return Buffer.from(vec.buffer, vec.byteOffset, vec.byteLength)
}

/** sqlite BLOB → Float32Array */
export function fromBlob(buf) {
  // BLOB may come from Buffer pool where byteOffset isn't 4-aligned; creating a view directly would RangeError — copy to align first
  if (buf.byteOffset % 4 !== 0) buf = new Uint8Array(buf)
  if (buf.byteLength % 4 !== 0) return new Float32Array(0)
  return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4)
}

// ---------------------------------------------------------------- internal

async function requestWithRetry(embedder, input, signal) {
  let lastError
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) await sleep(2 ** (attempt - 1) * 1000)

    let response
    try {
      response = await fetch(`${embedder.baseURL}/embeddings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${embedder.apiKey}`,
        },
        body: JSON.stringify({ model: embedder.model, input }),
        signal: signal
          ? AbortSignal.any([signal, AbortSignal.timeout(60_000)])
          : AbortSignal.timeout(60_000),
      })
    } catch (error) {
      if (error.name === "AbortError") throw error
      lastError = error
      continue
    }

    if (response.ok) return response.json()

    const text = await response.text().catch(() => "")
    const message = `Embedding API error ${response.status}: ${text}`
    if (RETRYABLE_STATUS.has(response.status)) {
      lastError = new Error(message)
      continue
    }
    throw new Error(message)
  }
  throw lastError
}

function normalize(vec) {
  let sum = 0
  for (let i = 0; i < vec.length; i++) sum += vec[i] * vec[i]
  const norm = Math.sqrt(sum) || 1
  for (let i = 0; i < vec.length; i++) vec[i] /= norm
  return vec
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
