/**
 * config-admin.mjs — 配置面（控制台——仅 admin；gateway/API.md §2.4 ∥ ops/OPS.md §1 ∥ KD-SV-56）：
 * `GET /api/admin/config`（**文件面读**——有效值（文件在场值 ∥ 缺省回填） ∥ 密钥掩码 ∥ `bootstrap.password` 面零列）
 * ∥ `PATCH /api/admin/config`（白名单五键写 ∥ 成功 ⇒ `{ ok: true }`）。
 *
 * 写路径五步（ops/OPS.md §1）：① 白名单（未知键 ∥ 空提交 ⇒ 400）→ ② 合并原档（**保未知键**；
 * `proxyUri: ""` ⇒ 删 `proxy` 段）→ ③ 门 = `resolveEnvRefs` + `validateConfig`（**载入面等价两跳**——
 * 写入的文件必可载入；不过 ⇒ 400 原报文 + 文件零变）→ ④ 原子写（同目录 tmp ⇒ `rename` 覆盖；
 * 落盘形 = 2 空格缩进 + 末尾换行——与现档同形；失败 ⇒ 文件零变 + 500）→ ⑤ 审计 `config_update`
 * （detail = 键名清单；值永不入——写盘成功后一条；审计失败 ⇒ warn，不反噬已落盘事实）。
 * 读改写 = 同步段一气（`await` 仅 body 读——不跨写段）；单写者（进程内同步 + 部署模型单实例——跨进程并发 = 不做）。
 *
 * `embedding` 子键级 = 缺省 = 不动 ∥ 明填 = 替换（`apiKey: ""` = 显式空——§2.4）；**掩码回显形不作明传值**——
 * `apiKey` 三态 = 未编辑 ⇒ 不携（= 不变） ∥ 编辑 ⇒ 明传 ∥ 清除勾 ⇒ `""`；回显形误送回 ⇒ 按「不携」处置
 * （掩码永不落盘）。`env:` 引用 = 明传值（写前经载入面门——缺位 ⇒ 400）。**生效 = 重启**（配置文件不热载——
 * `ops/OPS.md` §10 不破；统一标注）。
 *
 * 判权 = `requireAdmin`（`user` ⇒ 403 ∥ 无/过期会话 ⇒ 401）；错误码全沿用（零新码）；写端点 JSON 型门 = 服务层径。
 */
import { readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs"

import { recordAudit } from "../accounts/audit.mjs"
import { requireAdmin } from "../accounts/session.mjs"
import { DEFAULT_AUTO_UPDATE, DEFAULT_DB, DEFAULT_PORT, DEFAULT_USAGE_RETENTION_DAYS, resolveEnvRefs, validateConfig } from "../ops/config.mjs"
import { HttpError, sendJson } from "./errors.mjs"
import { maskApiKey } from "./provider-admin.mjs"
import { readJsonBody } from "./server.mjs"

/** 写白名单（§2.4——出现的键 = 应用，未出现 = 不动；未知键 ⇒ 400）。 */
export const CONFIG_WRITABLE_KEYS = Object.freeze(["autoUpdate", "trustProxy", "usageRetentionDays", "proxyUri", "embedding"])

/** `embedding` 子键白名单（§2.4——子键级：缺省 = 不动 ∥ 明填 = 替换）。 */
export const CONFIG_EMBEDDING_KEYS = Object.freeze(["baseURL", "model", "apiKey"])

/** fs 面（缺省 = node:fs 四件；批内件替身经注册参数覆盖——写失败腿注入）。 */
const FS = { readFileSync, writeFileSync, renameSync, unlinkSync }

const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value)

/** 掩码回显形（§2.2 规则 = `…` + 末 4——恒 ≤5 字符）——**不作明传值**（§2.4：保存 ⇒ 不变 ∥ 探活 ⇒ 运行配置回落）。 */
export function isMaskEcho(value) {
  return typeof value === "string" && value.startsWith("…") && value.length <= 5
}

/** 读配置档（GET ∥ PATCH 前置——每次请求实读；读档失败 ⇒ 500：不盲写）。 */
export function readConfigFile(configPath, { fs: fsImpl = FS } = {}) {
  let text
  try {
    text = fsImpl.readFileSync(configPath, "utf8")
  } catch (e) {
    throw new HttpError("internal_error", `配置档不可读：${configPath}（${e.message}）`)
  }
  try {
    return JSON.parse(text)
  } catch (e) {
    throw new HttpError("internal_error", `配置档非合法 JSON：${configPath}（${e.message}）`)
  }
}

/** GET 视图（§2.4——**有效值**：文件在场值 ∥ 缺省回填（回填口径沿 `validateConfig`）；密钥掩码；
 *  `bootstrap.password` 面零列（永不回显））。 */
export function configView(raw) {
  const embedding = isObject(raw.embedding) ? raw.embedding : null
  const bootstrap = isObject(raw.bootstrap) ? raw.bootstrap : null
  return {
    host: typeof raw.host === "string" ? raw.host : null,
    port: raw.port ?? DEFAULT_PORT,
    db: raw.db ?? DEFAULT_DB,
    autoUpdate: raw.autoUpdate ?? DEFAULT_AUTO_UPDATE,
    trustProxy: raw.trustProxy === undefined ? false : raw.trustProxy,
    usageRetentionDays: raw.usageRetentionDays === undefined ? DEFAULT_USAGE_RETENTION_DAYS : raw.usageRetentionDays,
    proxyUri: isObject(raw.proxy) && typeof raw.proxy.uri === "string" ? raw.proxy.uri : null,
    embedding: embedding === null ? null : {
      baseURL: embedding.baseURL ?? null,
      model: embedding.model ?? null,
      apiKey: maskApiKey(embedding.apiKey ?? ""), // 掩码回显（§2.2 规则——明文不出响应）
    },
    bootstrap: bootstrap === null ? null : { username: typeof bootstrap.username === "string" ? bootstrap.username : null },
  }
}

/** PATCH 合并（写路径 ①②——§2.4）：出 = `{ config（原档浅拷贝 + 应用的键）, keys（本次生效键名清单——审计 detail）}`。
 *  未知键 ∥ 空提交 ∥ 无键生效 ⇒ 抛（调用方转 400 原报文——文件零变）；入档不被改动。
 *  值判据不在本层先行（除 `proxyUri: ""` 的删段分叉）——归载入面门（校验单源）。 */
export function mergeConfigPatch(raw, patch) {
  if (!isObject(patch)) throw new Error(`配置写提交体须为 JSON 对象（白名单五键：${CONFIG_WRITABLE_KEYS.join(" ∥ ")}）`)
  const carried = Object.keys(patch)
  if (carried.length === 0) throw new Error("空提交（未携任何键——出现的键 = 应用，未出现 = 不动）")
  for (const key of carried) {
    if (!CONFIG_WRITABLE_KEYS.includes(key)) throw new Error(`未知键：${key}（写白名单：${CONFIG_WRITABLE_KEYS.join(" ∥ ")}）`)
  }
  const config = { ...(isObject(raw) ? raw : {}) }
  const keys = []
  for (const key of carried) {
    const value = patch[key]
    if (key === "proxyUri") { // `""` ⇒ 删 `proxy` 段（§2.4）；其余值经门校验（非法 uri ⇒ 门 400）
      if (value === "") delete config.proxy
      else config.proxy = { ...(isObject(config.proxy) ? config.proxy : {}), uri: value }
      keys.push(key)
      continue
    }
    if (key === "embedding") { // 子键级：缺省 = 不动 ∥ 明填 = 替换（§2.4）
      if (!isObject(value)) throw new Error(`embedding 须为对象（子键：${CONFIG_EMBEDDING_KEYS.join(" ∥ ")}）`)
      const subs = Object.keys(value)
      if (subs.length === 0) throw new Error("空提交：embedding 未携任何子键（缺省 = 不动）")
      for (const sub of subs) {
        if (!CONFIG_EMBEDDING_KEYS.includes(sub)) throw new Error(`未知键：embedding.${sub}（合法子键：${CONFIG_EMBEDDING_KEYS.join(" ∥ ")}）`)
      }
      const next = { ...(isObject(config.embedding) ? config.embedding : {}) } // 未携子键 = 不动（原档未知子键保形）
      for (const sub of subs) {
        if (sub === "apiKey" && isMaskEcho(value[sub])) continue // 掩码回显形不作明传值（§2.4——误送回 ⇒ 按「不携」= 不变）
        next[sub] = value[sub]
        keys.push(`embedding.${sub}`)
      }
      config.embedding = next
      continue
    }
    config[key] = value
    keys.push(key)
  }
  if (keys.length === 0) throw new Error("空提交（未携任何可生效的键——掩码回显形不作明传值）")
  return { config, keys }
}

/** 原子写（写路径 ④——§1）：落盘形 = 2 空格缩进 + 末尾换行；同目录 tmp ⇒ `rename` 覆盖；
 *  失败 ⇒ 清 tmp（零残留）+ 抛（调用方转 500——文件零变）。tmp 名 = `<配置档>.tmp`（同目录——单写者）。 */
export function writeConfigAtomic(configPath, config, { fs: fsImpl = FS } = {}) {
  const tmpPath = `${configPath}.tmp`
  try {
    fsImpl.writeFileSync(tmpPath, `${JSON.stringify(config, null, 2)}\n`, "utf8")
    fsImpl.renameSync(tmpPath, configPath)
  } catch (e) {
    try {
      fsImpl.unlinkSync(tmpPath) // 尽力清理（write 失败 ⇒ 本无 tmp ∥ rename 失败 ⇒ 移除）
    } catch {
      /* tmp 清理尽力而为——原错误优先 */
    }
    throw new HttpError("internal_error", `配置写盘失败：${configPath}（${e.message}）——文件零变`)
  }
}

/**
 * 注册配置面两端点（§2.4）：`db` = openDatabase 产物 ∥ `configPath` = 配置档绝对路径（`loadConfig` 归一出参——
 * 每次请求实读；生效 = 重启）。
 * 注入口径（批内件替身）：`env`（`env:` 引用解析面）∥ `fs`（读/写/改名/删四件——写失败腿注入）∥
 * `recordAuditFn`（审计失败腿注入）走可覆盖参数（缺省 = 生产行为不变）。
 */
export function registerConfigAdminRoutes(routes, { db, configPath, log = null, env = process.env, fs: fsImpl = FS, recordAuditFn = recordAudit } = {}) {
  if (!db || typeof configPath !== "string" || configPath === "") {
    throw new Error("registerConfigAdminRoutes：缺少 db ∥ configPath（装配面须传全）")
  }

  routes.add("GET", "/api/admin/config", (req, res) => {
    requireAdmin(db, req) // user ⇒ 403 ∥ 无/过期会话 ⇒ 401（同族口径）
    sendJson(res, 200, { config: configView(readConfigFile(configPath, { fs: fsImpl })) }) // 读档失败 ⇒ 500
  })

  routes.add("PATCH", "/api/admin/config", async (req, res) => {
    const session = requireAdmin(db, req)
    const body = await readJsonBody(req)
    const raw = readConfigFile(configPath, { fs: fsImpl }) // 前置：原档（读档失败 ⇒ 500——不盲写）
    let merged
    try {
      merged = mergeConfigPatch(raw, body) // ① 白名单 ∥ ② 合并保未知键
    } catch (e) {
      throw new HttpError("invalid_request_error", e.message) // 400 原报文（文件零变）
    }
    try {
      validateConfig(resolveEnvRefs(merged.config, env)) // ③ 门 = 载入面等价两跳（写入的文件必可载入）
    } catch (e) {
      throw new HttpError("invalid_request_error", e.message) // 400 原报文（文件零变）
    }
    writeConfigAtomic(configPath, merged.config, { fs: fsImpl }) // ④ 原子写（失败 ⇒ 500 + 文件零变）
    try {
      recordAuditFn(db, { type: "config_update", actor: session.member.name, actorId: session.member.id, detail: { keys: merged.keys } }) // ⑤ detail = 键名清单——值永不入
    } catch (e) {
      log?.warn("config_audit_failed", { message: e.message }) // 审计失败 ⇒ warn（不反噬已落盘事实）
    }
    log?.info("config_updated", { keys: merged.keys })
    sendJson(res, 200, { ok: true })
  })
}
