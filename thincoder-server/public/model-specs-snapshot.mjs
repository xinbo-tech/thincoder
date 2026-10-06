/**
 * model-specs-snapshot.mjs — 展示元数据快照（webui/WEBUI.md §2.4③ D 组——KD-SV-34；快照沿 KD-SV-17 先例）：
 * 源 = 核 `thincoder-core/model-specs.mjs` 的行表（只读对照——**运行期零 import 核件**，KD-SV-2）；
 * 子集 = 展示三面：上下文 `context` ∥ 最大输出 `maxOutput` ∥ 多模态 `multimodal`（未声明 ⇒ 位缺省）。
 *
 * `specForDisplay(name)` = 前缀查表纯函数（大小写不敏感 ∥ 最长前缀优先 ∥ 无命中时剥厂商命名空间再查——
 * 与核查表同口径）；**未知 ⇒ `null`（「未收录」——零兜底：不套 DEFAULT_SPEC）**；零端点零探针（纯表）。
 * 漂移 = 手工同步 + 批内件断言（重跑本批件即报——KD-SV-17 先例）。行序 = 核表行序（按名前缀长度降序排用于查表）。
 */
const DISPLAY_SPECS = [
  ["deepseek-flash", 1_000_000, 384_000, true],
  ["deepseek-v4.1-flash", 1_000_000, 384_000, true],
  ["deepseek-v4-pro", 1_000_000, 384_000],
  ["deepseek-v4-flash", 1_000_000, 384_000, true],
  ["deepseek-v4-flash-vision-exp", 1_000_000, 384_000, true],
  ["kimi-k3", 1_000_000, 131_072, true],
  ["kimi/kimi-k3", 1_000_000, 131_072, true],
  ["k3", 1_000_000, 131_072, true],
  ["kimi-for-coding-highspeed", 262_144, 131_072, true],
  ["kimi-for-coding", 1_048_576, 131_072, true],
  ["k3-256k", 262_144, 131_072, true],
  ["kimi-k2.6", 128_000, 32_000],
  ["kimi-k2.7-code", 128_000, 32_000],
  ["kimi-k2.7-code-highspeed", 128_000, 32_000],
  ["glm-5.3", 1_000_000, 128_000],
  ["glm-5.3-flash", 1_000_000, 131_072, true],
  ["glm-5.3-flashx", 1_000_000, 131_072, true],
  ["glm-5.2", 1_000_000, 128_000],
  ["glm-5", 1_000_000, 128_000],
  ["glm-4", 128_000, 32_000],
  ["glm-4.5-air", 128_000, 32_000],
  ["gpt-5.6-sol", 1_050_000, 128_000, true],
  ["gpt-5.6", 1_050_000, 128_000, true],
  ["gpt-4.1", 1_000_000, 128_000],
  ["gpt-4o", 128_000, 16_000, true],
  ["qwen-flash", 128_000, 32_768],
  ["qwen-vl-max", 128_000, 32_768],
  ["qwen3.7-max", 1_000_000, 131_072],
  ["qwen3.7-flash", 1_000_000, 131_072, true],
  ["qwen3.7-plus", 1_000_000, 131_072],
  ["qwen3.8-flash", 1_000_000, 131_072, true],
  ["qwen3.8-max", 1_000_000, 131_072, true],
  ["qwen3.8-omni-flash", 1_000_000, 131_072, true],
  ["qwen3.8-27b", 262_144, 131_072, true],
  ["qwen3.6-flash", 1_000_000, 65_536, true],
  ["qwen3.6-plus", 1_000_000, 65_536, true],
  ["qwen3.6-max-preview", 1_000_000, 65_536, true],
  ["qwen3.6-27b", 1_000_000, 65_536, true],
  ["qwen3.5-27b", 262_144, 65_536],
  ["qwen3.6-35b-a3b", 1_000_000, 65_536, true],
  ["MiniMax-M3", 1_000_000, 128_000, true],
  ["mimo-v2.5-pro", 1_000_000, 131_072],
  ["mimo-v2.5", 1_000_000, 131_072, true],
  ["mimo-v2.6-pro", 1_000_000, 131_072, true],
  ["mimo-v2.6-flash", 1_000_000, 131_072, true],
  ["mimo-v2.6-pro-ultraspeed", 1_000_000, 131_072, true],
  ["minimax-m3", 1_000_000, 128_000, true],
  ["minimax-m1", 256_000, 128_000],
  ["MiniMax-M2.7", 256_000, 128_000],
  ["grok-4.6", 500_000, 64_000, true],
  ["grok-4.5", 500_000, 64_000, true],
  ["grok-4", 500_000, 64_000, true],
  ["grok-4-mini", 128_000, 16_000],
  ["mistral-large", 128_000, 32_000, true],
  ["codestral", 256_000, 32_000],
  ["claude-opus-5", 1_000_000, 128_000, true],
  ["claude-sonnet-5", 1_000_000, 128_000, true],
  ["claude-opus-4", 200_000, 32_000, true],
  ["claude-sonnet-4", 200_000, 32_000, true],
  ["claude-3.5-haiku", 200_000, 8_192],
  ["claude-fable-5.1", 1_000_000, 128_000],
  ["gemini-3-pro", 1_000_000, 64_000, true],
  ["gemini-2.5-pro", 2_000_000, 64_000, true],
  ["gemini-2.5-flash", 1_000_000, 64_000, true],
  ["gemini-3.1-pro", 1_048_576, 65_536],
  ["hy3", 256_000, 128_000],
  ["hy3-preview", 256_000, 128_000],
  ["hy4-preview", 256_000, 128_000],
  ["doubao-seed-2-0-code-preview-260215", 256_000, 131_072, true],
  ["doubao-seed-2-0-lite-260428", 256_000, 131_072, true],
  ["doubao-seed-2-1-pro-260915", 256_000, 524_288],
  ["doubao-seed-2-1-turbo-260628", 256_000, 524_288],
  ["doubao-seed-2-1-lite-260915", 256_000, 524_288],
  ["step-3.7-flash", 262_144, 32_000],
]

/** 查表序（最长前缀优先——核查表同口径；等长前缀不共存于同一名 ⇒ 稳定序无关命中）。 */
const SORTED_SPECS = [...DISPLAY_SPECS].sort((a, b) => b[0].length - a[0].length)
const toSpec = ([, context, maxOutput, multimodal]) => ({ context, maxOutput, ...(multimodal === true ? { multimodal: true } : {}) })

/** 展示规格查表（纯函数——批内件直测）：`provider` 前的厂商命名空间无命中时剥一层再查；未收录 ⇒ `null`。 */
export function specForDisplay(name) {
  const m = (typeof name === "string" ? name : "").toLowerCase()
  const hit = (text) => SORTED_SPECS.find(([prefix]) => text.startsWith(prefix.toLowerCase()))
  const direct = hit(m)
  if (direct) return toSpec(direct)
  const slash = m.indexOf("/")
  if (slash > 0) {
    const bare = hit(m.slice(slash + 1))
    if (bare) return toSpec(bare)
  }
  return null
}
