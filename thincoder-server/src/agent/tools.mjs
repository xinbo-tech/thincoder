/**
 * tools.mjs — 管理面 agent 工具面五件（agent/ADMIN-AGENT.md §3 ∥ sandbox/SANDBOX.md §3 托管接入；runner-admin-console 批——台账 #1237）：
 * `exec(host, command, step?, timeoutS?)`（目标机真跑一条命令——SSH 传输）∥ `docker(host, op, args?, step?)`（Docker API 动词——与控制台同一客户端；
 * 十动词执行器 = `docker-ops.mjs`（两驱动单源——admin-agent-chat 批提取））
 * ∥ `register(host, endpoint, name?, step?)`（连通自检 + 登记进控制面——与「添加节点」同函数）∥ `verify(host, endpoint?, step?)`（自检读数复述）
 * ∥ `report(ok, summary, step?, readings?)`（终态报告）。
 *
 * 口径（用户 2026-10-10 22:19–22:25 + 15:02 裁）：**无白名单围栏**——能力面从实际场景反推；护栏 = 任务简报 ∥ **每动作一条审计行**
 * （命令/调用 ∥ 退出码/结果码 ∥ 摘要——**秘密掩蔽后**）∥ 自主边界停下报告（由 `run.mjs` 的环终止 + 简报承载）。
 * 工具入参按主机寻址（本任务单机——`host` 不匹配 ⇒ 拒绝）；凭据 = 该主机任务所授（不落审计、不回显）。
 * 未知工具/参数不合 ⇒ 返回 `{ ok: false, error }`（交模型自行决定——非抛）。
 */
import { createDockerClient, selfCheckDocker } from "../sandbox/docker.mjs"
import { insertRunner } from "../sandbox/registry.mjs"
import { DOCKER_OPS, assertDockerOp, runDockerOp } from "./docker-ops.mjs"

/** 工具名全集（五件——§3 表；断言面）。 */
export const TOOL_NAMES = Object.freeze(["exec", "docker", "register", "verify", "report"])

/** 步骤骨架 id（§3 步骤表——工具 `step` 标签的合法集）。 */
export const STEP_IDS = Object.freeze(["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"])

/** 掩蔽（秘密永不入审计/日志/回显——§3 凭据纪律「每步审计 = 秘密掩蔽后才入」）。 */
export function maskSecrets(text, secrets = []) {
  let out = typeof text === "string" ? text : text === null || text === undefined ? "" : String(text)
  for (const secret of secrets) {
    if (typeof secret !== "string" || secret.length < 4) continue
    out = out.split(secret).join("***")
  }
  return out
}

function truncate(text, max = 4000) {
  const value = typeof text === "string" ? text : text === null || text === undefined ? "" : String(text)
  return value.length > max ? `${value.slice(0, max)}\n…（截断——实长 ${value.length}）` : value
}

function asString(value, { field, max = 500, allowEmpty = false } = {}) {
  const text = typeof value === "string" ? value.trim() : ""
  if (!allowEmpty && text === "") throw new Error(`${field}不可为空`)
  if (text.length > max) throw new Error(`${field}超长（≤ ${max}）`)
  return text
}

/**
 * 装配五工具（§3）：`ssh` = `createSshExecutor` 产物 ∥ `auth` = 本任务凭据（含 host/port/user/authKind/secret/sudoSecret——
 * 只进传输，永不入审计）∥ `audit` = 任务面审计 sink（含 actor/掩蔽）∥ `journal` = 步骤日志 sink ∥ `defaultName` = 节点缺省名。
 */
export function createOnboardingTools({ db, runId, auth, ssh, fetchImpl = fetch, defaultName = null, audit = null, journal = null } = {}) {
  if (!db || !ssh || !auth) throw new Error("createOnboardingTools：缺少 db ∥ ssh ∥ auth")
  const secrets = [auth.secret, auth.sudoSecret].filter((value) => typeof value === "string" && value.length > 0)
  const dockerClients = new Map() // endpoint → Promise<client>（协商一次——KD-SV-81）
  let terminal = null // report 槽（终态报告——driver 读取）

  const mask = (text) => maskSecrets(text, secrets)

  function assertHost(host) {
    const value = asString(host, { field: "host", max: 200 })
    if (value !== auth.host) throw new Error(`本任务仅限目标主机 ${auth.host}（收到 ${value}）`)
    return value
  }

  function auditCall({ tool, call, resultCode, summary, step = null }) {
    audit?.({ tool, call: mask(call), resultCode, summary: mask(summary), step })
  }

  function journalStep({ step, readings, status = "done" }) {
    if (typeof step === "string" && STEP_IDS.includes(step)) journal?.(step, { status, readings })
  }

  /** Docker 客户端（端点协商一次——`http://<host>:2375` 缺省；与控制台同一客户端栈）。 */
  function dockerClientFor(endpoint) {
    const key = endpoint
    if (!dockerClients.has(key)) {
      const pending = selfCheckDocker({ address: endpoint, fetchImpl }).then((check) => ({ check, client: createDockerClient({ baseUrl: check.baseUrl, apiVer: check.apiVer, fetchImpl }) }))
      pending.catch(() => dockerClients.delete(key)) // 失败不缓存（自愈后重试不被陈旧 rejection 拦住）
      dockerClients.set(key, pending)
    }
    return dockerClients.get(key)
  }

  async function runDocker({ host, op, args = {} }) {
    const target = assertHost(host)
    assertDockerOp(op) // 未知动词 ⇒ 抛（调用侧 catch 转工具级错误）
    const endpoint = args?.endpoint ?? `http://${target}:2375`
    const { client } = await dockerClientFor(endpoint)
    return runDockerOp({ client, op, args }) // 动词语义单源 = `docker-ops.mjs`（任务面/聊天面两驱动同函数）
  }

  const schemas = [
    {
      type: "function",
      function: {
        name: "exec",
        description: "在目标主机上执行一条命令（SSH——非交互、逐条；返回退出码与 stdout/stderr 截断）。需要提权时用 `sudo -S <命令>`（口令由任务注入 stdin，不要写进口令）。每次调用请用 step 标出所属步骤 id。",
        parameters: {
          type: "object",
          properties: {
            host: { type: "string", description: "目标主机（本任务 = 提交时给的地址）" },
            command: { type: "string", description: "要执行的命令原文" },
            step: { type: "string", enum: STEP_IDS, description: "所属步骤 id（S1–S8）——步骤读数归属" },
            timeoutS: { type: "number", description: "超时秒数（缺省 60）" },
          },
          required: ["host", "command"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "docker",
        description: "对目标机的 Docker API 执行一个动词（与控制台同一客户端）：version ∥ info ∥ ps ∥ images ∥ pull ∥ create ∥ start ∥ stop ∥ rm ∥ logs。",
        parameters: {
          type: "object",
          properties: {
            host: { type: "string", description: "目标主机" },
            op: { type: "string", enum: DOCKER_OPS, description: "Docker 动词" },
            args: { type: "object", description: "动词参数（如 { image, tag } / { name, body } / { id } / { endpoint }）" },
            step: { type: "string", enum: STEP_IDS, description: "所属步骤 id" },
          },
          required: ["host", "op"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "register",
        description: "把目标机登记为 runner 节点（连通自检 + 落行——与控制台「添加节点」同一条路）。endpoint 缺省 http://<host>:2375。",
        parameters: {
          type: "object",
          properties: {
            host: { type: "string", description: "目标主机" },
            endpoint: { type: "string", description: "Docker API 地址（缺省 http://<host>:2375）" },
            name: { type: "string", description: "节点名（可选；缺省取任务给的名称 ∥ 主机名）" },
            step: { type: "string", enum: STEP_IDS, description: "所属步骤 id（通常 S6）" },
          },
          required: ["host"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "verify",
        description: "自检（Docker API 连通 + 版本协商 + 读数复述）——不落库；用于登记前后确认。",
        parameters: {
          type: "object",
          properties: {
            host: { type: "string", description: "目标主机" },
            endpoint: { type: "string", description: "Docker API 地址（缺省 http://<host>:2375）" },
            step: { type: "string", enum: STEP_IDS, description: "所属步骤 id（通常 S7）" },
          },
          required: ["host"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "report",
        description: "终态报告：成功/失败 + 停在哪步 + 读数。调用即结束本任务（成功或失败以 ok 为准）。",
        parameters: {
          type: "object",
          properties: {
            ok: { type: "boolean", description: "true = 接入成功；false = 失败（停下报告）" },
            summary: { type: "string", description: "一句话结论（失败时含停在哪步与原因）" },
            step: { type: "string", enum: STEP_IDS, description: "停在哪步 / 完成步" },
            readings: { type: "object", description: "可复述读数（可选）" },
          },
          required: ["ok", "summary"],
        },
      },
    },
  ]

  async function invoke(name, args = {}) {
    try {
      if (!TOOL_NAMES.includes(name)) return { ok: false, error: `未知工具：${String(name)}（${TOOL_NAMES.join(" ∥ ")}）` }
      if (args === null || typeof args !== "object" || Array.isArray(args)) return { ok: false, error: "工具入参须为对象" }
      switch (name) {
        case "exec": {
          const host = assertHost(args.host)
          const command = asString(args.command, { field: "command", max: 8000 })
          const timeoutS = Number.isFinite(Number(args.timeoutS)) && Number(args.timeoutS) > 0 ? Number(args.timeoutS) : 60
          const result = await ssh.exec({ ...auth, host, command, timeoutS })
          const summary = `exit=${result.exitCode}${result.stdout ? `；out: ${truncate(result.stdout, 200)}` : ""}${result.stderr ? `；err: ${truncate(result.stderr, 200)}` : ""}`
          auditCall({ tool: "exec", call: `exec ${command}`, resultCode: result.exitCode, summary, step: args.step ?? null })
          journalStep({ step: args.step, readings: { command: mask(command), exitCode: result.exitCode, stdout: mask(truncate(result.stdout, 600)), stderr: mask(truncate(result.stderr, 600)) } })
          return { ok: true, exitCode: result.exitCode, stdout: result.stdout, stderr: result.stderr }
        }
        case "docker": {
          const host = assertHost(args.host)
          const out = await runDocker({ host, op: String(args.op ?? ""), args: args.args ?? {} })
          const summary = `docker ${args.op} ⇒ ${out.resultCode}`
          auditCall({ tool: "docker", call: `docker ${args.op} ${JSON.stringify(args.args ?? {})}`, resultCode: out.resultCode, summary, step: args.step ?? null })
          journalStep({ step: args.step, readings: { call: `docker ${args.op}`, resultCode: out.resultCode } })
          return { ok: true, resultCode: out.resultCode, data: out.data }
        }
        case "register": {
          const host = assertHost(args.host)
          const endpoint = typeof args.endpoint === "string" && args.endpoint.trim() !== "" ? args.endpoint.trim() : `http://${host}:2375`
          const check = await selfCheckDocker({ address: endpoint, fetchImpl })
          const row = insertRunner(db, { name: args.name ?? defaultName ?? host, address: check.baseUrl, runtime: check.readings })
          auditCall({ tool: "register", call: `register ${check.baseUrl}`, resultCode: 0, summary: `runner #${row.id}`, step: args.step ?? null })
          journalStep({ step: args.step ?? "S6", readings: { runnerId: row.id, address: check.baseUrl, readings: check.readings } })
          return { ok: true, runnerId: row.id, address: check.baseUrl, readings: check.readings }
        }
        case "verify": {
          const host = assertHost(args.host)
          const endpoint = typeof args.endpoint === "string" && args.endpoint.trim() !== "" ? args.endpoint.trim() : `http://${host}:2375`
          const check = await selfCheckDocker({ address: endpoint, fetchImpl })
          auditCall({ tool: "verify", call: `verify ${check.baseUrl}`, resultCode: 0, summary: `Version=${check.readings.version} ApiVersion=${check.readings.apiVersion} 协商=${check.readings.apiVer}`, step: args.step ?? null })
          journalStep({ step: args.step ?? "S7", readings: check.readings })
          return { ok: true, address: check.baseUrl, readings: check.readings }
        }
        case "report": {
          const summary = asString(args.summary, { field: "report.summary", max: 2000 })
          terminal = { ok: args.ok === true, summary, step: args.step ?? null, readings: args.readings ?? null }
          return { ok: true, terminal: true }
        }
        default:
          return { ok: false, error: `未知工具：${String(name)}` }
      }
    } catch (e) {
      const message = e?.message ?? String(e)
      const kind = e?.kind ?? null // SshError/DockerError 分类（供简报/模型判断）
      auditCall({ tool: name, call: String(name), resultCode: -1, summary: `失败：${message}`, step: args?.step ?? null })
      return { ok: false, error: maskSecrets(message, secrets), kind }
    }
  }

  return {
    names: TOOL_NAMES,
    schemas,
    invoke,
    /** 终态报告槽（report 调用后 = `{ ok, summary, step, readings }`；未调 ⇒ null）。 */
    terminal: () => terminal,
    runId,
  }
}
