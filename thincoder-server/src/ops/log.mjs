/**
 * log.mjs — 日志（ops/OPS.md §4）：单行 JSON 到 stdout——逐请求一行 + 启动/引导/错误事件；
 * 采集/落盘 = 部署面（裸机 journald ∥ 容器 docker logs）。
 *
 * 形：`{ ts, level, event, ...fields }`（一行一事件——journald/docker logs 逐行直读）。
 */

/**
 * 建日志器（`stream` 注入面：单位测试用假 stream；缺省 = stdout）。
 * 写失败（管道断裂）不抛——日志面不反噬主链。
 */
export function createLogger({ stream = process.stdout } = {}) {
  const write = (level, event, fields) => {
    const line = { ts: new Date().toISOString(), level, event, ...normalizeFields(fields) }
    try {
      stream.write(`${JSON.stringify(line)}\n`)
    } catch {
      /* stdout 断裂——日志不抛 */
    }
  }
  return {
    info: (event, fields) => write("info", event, fields),
    warn: (event, fields) => write("warn", event, fields),
    error: (event, fields) => write("error", event, fields),
  }
}

/** Error 值归一为可序列化形（`{ name, message }`）——其余字段原样。 */
function normalizeFields(fields) {
  const out = {}
  for (const [key, value] of Object.entries(fields ?? {})) {
    out[key] = value instanceof Error ? { name: value.name, message: value.message } : value
  }
  return out
}
