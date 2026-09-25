/**
 * toolcall/variants.mjs — 三变体载荷构造（设计 §11.4 声明式变换 + §11.7 静态腿读数；KD-54 产品面零改）。
 *
 * V0 = 产品面实面逐字：`builtinTools` × `toOpenAISchema`（`thincoder-core/tools/index.mjs` × `shared.mjs`），
 * 能力位 `read_image` 随档（判据 `specForModel(model)?.multimodal`——同 `index.mjs` 注册面）；
 * V1 = 5 档枚举块（`fixture.mjs` 逐字）+ V0 文本逐字 + `edit.edits[].*` 7 项参数描述补齐；
 * V2 = 路由句（`fixture.mjs` `routeHead` 取句规则）+ 实面 schema 逐字。
 * 变换只在**载荷副本**上做——产品描述文本零触（探针不改写产品面）。
 */

import { createHash } from "node:crypto"
import { specForModel } from "../../thincoder-core/config.mjs"
import { builtinTools, readImageTool, toOpenAISchema } from "../../thincoder-core/tools/index.mjs"
import { V1_ENUM_BLOCKS, V1_PARAM_DESCRIPTIONS, routeHead } from "./fixture.mjs"

/** 变体 id 序（CLI `--variants` 取值域与报告列序）。 */
export const VARIANT_IDS = ["V0", "V1", "V2"]

/** V0 载荷逐档实面构造（能力位 `read_image` 同注册面判据）。 */
function v0Tools(model) {
  const tools = builtinTools.map(toOpenAISchema)
  if (specForModel(model)?.multimodal) tools.push(toOpenAISchema(readImageTool))
  return tools
}

/** `edit.edits[]` 嵌套项（V1 唯一参数面缺口——7 项）。 */
function editEntryProps(tools) {
  const edit = tools.find((t) => t.function.name === "edit")
  return edit?.function?.parameters?.properties?.edits?.items?.properties ?? null
}

/** 嵌套参数描述补齐（就地改副本；键 = `V1_PARAM_DESCRIPTIONS` 的 7 项）。 */
function fillEditParamDescriptions(tools) {
  const props = editEntryProps(tools)
  if (!props) throw new Error("V1 参数面补齐失败：载荷内找不到 edit.edits[] 嵌套项（产品面 schema 形态变了）")
  for (const [key, description] of Object.entries(V1_PARAM_DESCRIPTIONS)) {
    if (!props[key]) throw new Error(`V1 参数面补齐失败：edit.edits[] 缺项「${key}」`)
    props[key] = { ...props[key], description }
  }
}

/** 静态读数（§11.7 静态腿 · 确定性）：载荷序列化 chars / bytes + `descriptionChars`
 *  （= 顶层 `function.description` 字符合计；**参数描述不计**——整体体量看 chars / bytes）。 */
function staticRead(tools) {
  const json = JSON.stringify(tools)
  return {
    tools,
    chars: json.length,
    bytes: Buffer.byteLength(json, "utf8"),
    descriptionChars: tools.reduce((sum, t) => sum + String(t.function?.description ?? "").length, 0),
  }
}

/** 三变体载荷（逐模型构造——能力位随档）；返回 `[{id, tools, chars, bytes, descriptionChars}]`。 */
export function buildVariants({ model }) {
  const v0 = v0Tools(model)
  const v1 = structuredClone(v0)
  for (const t of v1) {
    const name = t.function.name
    if (V1_ENUM_BLOCKS[name]) t.function.description = `${V1_ENUM_BLOCKS[name]}\n\n${t.function.description}`
  }
  fillEditParamDescriptions(v1)
  const v2 = structuredClone(v0)
  for (const t of v2) t.function.description = routeHead(t.function.description)
  return [staticRead(v0), staticRead(v1), staticRead(v2)].map((payload, i) => ({ id: VARIANT_IDS[i], ...payload }))
}

/** `payloadDigest`（§11.8 · 体例同 KD-45 `promptsDigest`）= **V0 载荷摘要**（逐档合成——产品面实面变动由本锚显影）。
 *  `entries` = `[{key, variant}]`（`key` = 调用面身份 `provider:model`；序 = 参测序）。 */
export function payloadDigest(entries) {
  const h = createHash("sha256")
  for (const { key, variant } of entries) {
    h.update(String(key)); h.update("\0")
    h.update(JSON.stringify(variant.tools)); h.update("\0")
  }
  return `sha256:${h.digest("hex").slice(0, 16)}`
}
