/**
 * providers.mjs — provider 注册与模型派发（KD-SV-4：`provider/model` 复合键精确匹配——非别名 ∥ 非策略路由）
 * + 模型清单装配（`/v1/models` 清单 = 配置派生：chat 带前缀名 ∪ 引擎模型）。
 *
 * 派发键 = `provider/model`（首斜杠切分：首段 = provider `name` ∥ 余段 = 上游模型名（可含斜杠）；
 * 两段非空；裸名不解析）；未命中 ∥ 裸名 ⇒ 404 `model_not_found`（提示带前缀形）。
 * 同名模型跨 provider 并存且各自可达；同 provider 内重名 = 配置校验拒启（`ops/config.mjs`）。
 * 端点注册与鉴权 = `routes.mjs`（OpenAI 面统一登记处，勿双主）。
 */
import { errorBody } from "./errors.mjs"

/** 首斜杠切分：`{ provider, model }`（两段均非空）；无斜杠 ∥ 空段 ⇒ null（裸名不解析）。 */
export function splitModelRef(ref) {
  if (typeof ref !== "string") return null
  const cut = ref.indexOf("/")
  if (cut <= 0 || cut === ref.length - 1) return null
  return { provider: ref.slice(0, cut), model: ref.slice(cut + 1) }
}

/** provider 注册表：外部标识 `provider/model` → `{ provider, 上游模型名 }`（配置序建表）。 */
export function createProviderRegistry(config) {
  const entries = [] // chat 侧外部标识条目（配置序）：`{ ref, provider, model }`
  for (const provider of config.providers) {
    for (const model of provider.models) entries.push({ ref: `${provider.name}/${model}`, provider, model })
  }
  const engineModel = config.embedding?.model ?? null
  return {
    /** 派发（KD-SV-4）：命中 ⇒ `{ provider, model }`（model = 上游模型名——首斜杠余段，随请转上游）；
     *  未命中 ∥ 裸名 ⇒ `{ miss }`（404 `model_not_found` 形——message 提示带前缀形）。 */
    dispatch(ref) {
      const cut = splitModelRef(ref)
      if (!cut) {
        return { miss: { status: 404, body: errorBody("model_not_found", `模型标识须为 provider/model 前缀形（裸名不解析）：${String(ref)}`) } }
      }
      const provider = config.providers.find((item) => item.name === cut.provider)
      if (!provider || !provider.models.includes(cut.model)) {
        return { miss: { status: 404, body: errorBody("model_not_found", `模型未配置：${ref}（对外标识 = provider/model 前缀形）`) } }
      }
      return { provider, model: cut.model }
    },
    /** chat 侧清单条目（配置序——`{ ref, provider, model }`）。 */
    entries: () => entries,
    /** 嵌入引擎模型（`embedding.model`——非 provider 面，原样）。 */
    engineModel: () => engineModel,
  }
}

/** `/v1/models` 清单（配置派生：chat = 带前缀名 ∥ 引擎模型原样——N4）。 */
export function modelList(config) {
  const registry = createProviderRegistry(config)
  const data = registry.entries().map(({ ref, provider }) => ({ id: ref, object: "model", created: 0, owned_by: provider.name }))
  const engine = registry.engineModel()
  if (engine) data.push({ id: engine, object: "model", created: 0, owned_by: "embedding" })
  return { object: "list", data }
}
