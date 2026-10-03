/**
 * embedding.mjs — vector embeddings
 * OpenAI-compatible /v1/embeddings (SiliconFlow bge-m3 / Ollama / OpenAI all supported),
 * reuses provider.mjs fetch + retry pattern, zero dependencies.
 * Vectors are normalized before storage; dot product then equals cosine similarity.
 */

import { RETRYABLE_STATUS } from "./provider/index.mjs"
import { resolveEnvRefs } from "./env-ref.mjs"
// #859（MEMORY.md §6.3 ∥ §7 D-MEM31）：嵌入路径发送前净化孤立 UTF-16 代理——sanitize 单源复用
import { sanitizeLoneSurrogates } from "./escape.mjs"
const MAX_RETRIES = 3
const BATCH_SIZE = 32 // max texts per request (within SiliconFlow limits)

/** Create an embedder. config: { baseURL, apiKey, model } */
export function createEmbedder(config) {
  if (!config?.baseURL) throw new Error("embedding config: baseURL is required — configure embedding.baseURL in ~/.thincoder/config.json")
  if (!config?.apiKey) throw new Error("embedding config: apiKey is required — configure embedding.apiKey in ~/.thincoder/config.json")
  if (!config?.model) throw new Error("embedding config: model is required — configure embedding.model in ~/.thincoder/config.json")
  return {
    baseURL: config.baseURL.replace(/\/+$/, ""),
    // #57（provider-config-family 批）：值位 `${env:VAR}` 消费侧解析（CONFIG.md §6.3）——embedder 持解析值，请求侧零改。
    apiKey: resolveEnvRefs(config.apiKey),
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

/**
 * 毒行隔离消费面（MEMORY.md §6.3 ∥ §7 D-MEM31 · 台账 #859）：补嵌批的容错版 `embed`。
 * 整批失败且错误携 `httpStatus === 400`（发送前清洗后仍 400 的未知毒形）⇒ 逐条独试：
 * 成功者照常返回、仍败者置 `null`（调用面跳过不写 + 一行可见回执）；其余错误（网络 ∕ 401 等）
 * 照旧整抛——隔离只兜 400 类。query 面（搜索侧单条嵌入）不走本函数（语义零变）。
 * @returns {Promise<{vectors: (Float32Array|null)[], skipped: string[]}>}
 */
export async function embedTolerant(embedder, texts, { signal } = {}) {
  try {
    return { vectors: await embed(embedder, texts, { signal }), skipped: [] }
  } catch (err) {
    if (err?.httpStatus !== 400) throw err
    const vectors = []
    const skipped = []
    for (let i = 0; i < texts.length; i++) {
      try {
        const [vec] = await embed(embedder, [texts[i]], { signal })
        vectors.push(vec)
      } catch (e) {
        vectors.push(null)
        skipped.push(`input #${i}: ${e.message}`)
      }
    }
    return { vectors, skipped }
  }
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
        // #859 主修：发送前逐条净化孤立代理（存量毒行 ⇒ 硅基流动 400/20015；清洗后根因消除）
        body: JSON.stringify({ model: embedder.model, input: input.map((t) => sanitizeLoneSurrogates(t)) }),
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
    const err = new Error(message)
    err.httpStatus = response.status // #859：隔离层判据（400 类 ⇒ embedTolerant 逐条独试）
    if (RETRYABLE_STATUS.has(response.status)) {
      lastError = err
      continue
    }
    throw err
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
