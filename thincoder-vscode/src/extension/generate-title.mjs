/**
 * generate-title.mjs — LLM-generated session titles（端壳转口）
 * Called from ChatPanel._generateTitle() with (userContent, providerName, modelName).
 *
 * W6（CONTEXT-COMPACTION 单元）改指：标题生成三格式分派（openai 兼容 / anthropic /
 * google——IK9UZ8 thinking 禁用语义） = 核内实现
 * （`@thincoder/core/generate-title.mjs`——§2.5 #163 / §2.13.4 #163「已满足」）。
 * 本档只留端侧解析面：key 检查 + provider 构建（本端 presets.mjs），随后委核生成。
 * 失败语义不变：零 key / 无 provider / 生成失败 ⇒ null（标题生成永不阻断回合）。
 */
import { getKey, buildProvider } from "./presets.mjs"
import { generateTitle as coreGenerateTitle } from "@thincoder/core/generate-title.mjs"

/** Generate a session title from the first user message using an LLM. Returns title string or null. */
export async function generateTitle(userContent, providerName, _modelName) {
  try {
    const key = await getKey(providerName)
    if (!key) return null
    const prov = await buildProvider(providerName)
    if (!prov) return null
    return await coreGenerateTitle(userContent, prov)
  } catch {
    return null
  }
}
