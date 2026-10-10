/**
 * docker-ops.mjs — Docker 十动词执行器（`agent/ADMIN-AGENT.md` §3 工具表 ∥ §12 工具面第七件；admin-agent-chat 批——台账 #1254）：
 * 自 `agent/tools.mjs` 提取（任务式/聊天式**两驱动单源**——KD-SV-90 §12「写链与路由同函数」同口径）；客户端 = `sandbox/docker.mjs`
 * （与控制台同一套调用——用户 22:25 口径）。
 *
 * 动词面（十件）：version ∥ info ∥ ps ∥ images ∥ pull ∥ create ∥ start ∥ stop ∥ rm ∥ logs——逐动词参数校验 ∥ 结果 `{ resultCode, data }`。
 * 调用侧只管**寻址**（任务面 = 主机 + `args.endpoint`；聊天面 = 注册节点名/地址查 `sandbox_runners`）与客户端装配（协商版本一次），
 * 动词语义全在本档（单源——两驱动零分叉）。
 */
/** 动词全集（§3 表——两驱动同一清单；断言面）。 */
export const DOCKER_OPS = Object.freeze(["version", "info", "ps", "images", "pull", "create", "start", "stop", "rm", "logs"])

/** 单行文本校验（trim 非空 ∥ ≤ max）——参数面（调用侧 catch 转工具级/结构错误）。 */
export function requireText(value, { field, max = 500 } = {}) {
  const text = typeof value === "string" ? value.trim() : ""
  if (text === "") throw new Error(`${field}不可为空`)
  if (text.length > max) throw new Error(`${field}超长（≤ ${max}）`)
  return text
}

/** 读面文本截断（逐字保形；超限 ⇒ 尾部注实长——沿任务面口径）。 */
export function truncateText(text, max = 4000) {
  const value = typeof text === "string" ? text : text === null || text === undefined ? "" : String(text)
  return value.length > max ? `${value.slice(0, max)}\n…（截断——实长 ${value.length}）` : value
}

/** 动词校验（调用侧先行——错误报文含全集；`runDockerOp` 内再做一次兜底）。 */
export function assertDockerOp(op) {
  if (!DOCKER_OPS.includes(op)) throw new Error(`未知 docker 动词：${String(op)}（${DOCKER_OPS.join(" ∥ ")}）`)
  return op
}

/**
 * 跑一个动词（§3）：`client` = `createDockerClient` 产物（协商版本已在前）∥ `op` = 十动词 ∥ `args` = 动词参数。
 * 出 = `{ resultCode, data }`（`resultCode` = 引擎状态码；`data` = 结构化读数——`logs` 为截断文本）。
 * 抛 = 参数不合（`requireText`）∥ 传输失败（`DockerError`——调用侧映射）。
 */
export async function runDockerOp({ client, op, args = {} } = {}) {
  if (!client || typeof client.raw !== "function") throw new Error("runDockerOp：缺 Docker 客户端（createDockerClient 产物）")
  assertDockerOp(op)
  const params = args !== null && typeof args === "object" && !Array.isArray(args) ? args : {}
  switch (op) {
    case "version": {
      const res = await client.version()
      return { resultCode: res.status, data: res.json }
    }
    case "info": {
      const res = await client.info()
      return { resultCode: res.status, data: res.json }
    }
    case "ps": {
      const path = params.all === false ? "/containers/json" : "/containers/json?all=1"
      const res = await client.raw("GET", path)
      return { resultCode: res.status, data: res.json }
    }
    case "images": {
      const res = await client.raw("GET", "/images/json")
      return { resultCode: res.status, data: res.json }
    }
    case "pull": {
      const image = requireText(params.image, { field: "pull.image", max: 200 })
      const tag = typeof params.tag === "string" && params.tag.trim() !== "" ? params.tag.trim() : "latest"
      const res = await client.raw("POST", `/images/create?fromImage=${encodeURIComponent(image)}&tag=${encodeURIComponent(tag)}`, { timeoutMs: 10 * 60 * 1000 })
      return { resultCode: res.status, data: { image, tag } }
    }
    case "create": {
      const name = requireText(params.name, { field: "create.name", max: 128 })
      const res = await client.createContainer(name, params.body ?? {})
      return { resultCode: res.status, data: res.json }
    }
    case "start":
    case "stop": {
      const id = requireText(params.id, { field: `${op}.id`, max: 200 })
      const res = op === "start" ? await client.startContainer(id) : await client.stopContainer(id)
      return { resultCode: res.status, data: { id } }
    }
    case "rm": {
      const id = requireText(params.id, { field: "rm.id", max: 200 })
      const res = await client.deleteContainer(id, { force: params.force !== false })
      return { resultCode: res.status, data: { id } }
    }
    case "logs": {
      const id = requireText(params.id, { field: "logs.id", max: 200 })
      const res = await client.raw("GET", `/containers/${encodeURIComponent(id)}/logs?stdout=1&stderr=1`)
      return { resultCode: res.status, data: truncateText(res.text) }
    }
    default:
      throw new Error(`未知 docker 动词：${String(op)}（${DOCKER_OPS.join(" ∥ ")}）`)
  }
}
