/**
 * 2026-10-11-admin-agent-chat-tools.test.mjs — thincoder-server 批内单测件（`admin-agent-chat` 批 · **后台舱**——管理面工具面七件；
 * 名随批档 · 住 `docs/batches/` · 随批留存 · 与本批另两件（`…chat` ∥ `…-ui`）同批）。
 * 运行（自 `thincoder/` 仓根）：`node --test docs/batches/2026-10-11-admin-agent-chat-tools.test.mjs`
 *
 * 射程（判据源 = 批档 §2.4 工具面行 ∥ `docs/server/design/agent/ADMIN-AGENT.md` §12 ∥ KD-SV-90/91）：
 *   七件逐件（动词面 + 参数校验）：`members`（六）∥ `providers`（五）∥ `models`（五）∥ `usage`（summary/rows）∥ `audit`（query）
 *   ∥ `runners`（list/add/remove）∥ `docker`（十动词——绑定注册节点；未在册 ⇒ 工具级错误回灌）；
 *   口径面：进程内直取域件（零 HTTP）∥ 写链与控制台同函数（provider 换表热生效 ∥ 成员重置链）∥ 工具级错误 ⇒ `{ ok:false, message }`（**回合不停**——不抛）
 *   ∥ 秘密面（apiKey 回显掩码——本档；入参/结果/审计摘要掩蔽 = 驱动层 `…chat.test.mjs` 掩蔽腿）∥ **不双记**（chat 面建成员/重置/删节点 ⇒ 既有域型零行）
 * 假件面：假 Docker 引擎（真 HTTP——`fetchImpl` 注入）∥ 假发现探针（`discoverFetchImpl` 注入——与控制台 discover 同出口）∥ 假登录守卫（清计探针）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdtempSync } from "node:fs"
import { createServer } from "node:http"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-server"))) throw new Error(`须从仓库根（thincoder/）运行——cwd = ${ROOT}`)
const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href)

const DB = await load("thincoder-server/src/store/db.mjs")
const TOOLS = await load("thincoder-server/src/agent/chat-tools.mjs")
const DOCKER_OPS = await load("thincoder-server/src/agent/docker-ops.mjs")
const MEMBERS = await load("thincoder-server/src/accounts/members.mjs")
const KEYS = await load("thincoder-server/src/accounts/keys.mjs")
const PROVIDERS = await load("thincoder-server/src/gateway/providers.mjs")
const USAGE = await load("thincoder-server/src/metering/usage.mjs")

const tempRoot = mkdtempSync(join(tmpdir(), "tc-chat-tools-"))
const PASSWORD = "password-123"

// ── 假件：假 Docker 引擎 ∥ 假发现探针 ∥ 假守卫 ────────────────────────────────

async function startFakeDocker({ version = { Version: "29.1.3", ApiVersion: "1.52", MinAPIVersion: "1.44", Os: "linux", Arch: "amd64" }, containers = [] } = {}) {
  const calls = []
  const state = { containers: [...containers] }
  const server = createServer((req, res) => {
    const url = new URL(req.url, "http://engine")
    calls.push({ method: req.method, path: url.pathname, query: url.search })
    const json = (status, payload) => {
      res.writeHead(status, { "content-type": "application/json" })
      res.end(payload === undefined ? "" : JSON.stringify(payload))
    }
    const p = url.pathname.replace(/^\/v?[0-9.]+/, "") || "/"
    if (p === "/version") return json(200, version)
    if (p === "/info") return json(200, { ServerVersion: version.Version, Containers: state.containers.length, ContainersRunning: 0 })
    if (p === "/containers/json") return json(200, state.containers)
    if (p === "/images/json") return json(200, [{ Id: "sha256:abc", RepoTags: ["alpine:latest"], Size: 7, Created: 1 }])
    if (p.startsWith("/containers/") && p.endsWith("/logs")) {
      res.writeHead(200, { "content-type": "text/plain" })
      return res.end("hello from container")
    }
    if (req.method === "DELETE" && p.startsWith("/containers/")) {
      state.containers = state.containers.filter((item) => !p.includes(item.Id))
      res.writeHead(204)
      return res.end()
    }
    return json(404, { message: `unknown ${url.pathname}` })
  })
  await new Promise((resolve, reject) => {
    server.once("error", reject)
    server.listen(0, "127.0.0.1", resolve)
  })
  return {
    base: `http://127.0.0.1:${server.address().port}`,
    calls,
    state,
    async close() {
      server.closeAllConnections?.()
      await new Promise((resolve) => server.close(resolve))
    },
  }
}

/** 假发现探针（`/models` ⇒ `{ data: [{ id }] }`；`fetchImpl` 注入面）。 */
function fakeDiscover({ models = ["m-a", "m-b"], status = 200, body = null } = {}) {
  const calls = []
  const fetchImpl = async (url, init) => {
    calls.push({ url: String(url), authorization: init?.headers?.authorization ?? null })
    if (body !== null) return new Response(body, { status })
    return new Response(JSON.stringify({ data: models.map((id) => ({ id })) }), { status, headers: { "content-type": "application/json" } })
  }
  return { fetchImpl, calls }
}

// ── 装配 ──────────────────────────────────────────────────────────────────────

async function makeTools({ db = DB.openDatabase(":memory:"), fetchImpl = fetch, discoverFetchImpl = null, guard = null, runtime = null, config = {} } = {}) {
  const admin = (await MEMBERS.createMember(db, { username: "admin", role: "admin", password: PASSWORD })).member
  const providerRuntime = runtime ?? PROVIDERS.createProviderRuntime(PROVIDERS.createProviderRegistry(PROVIDERS.listProviderEntries(db)))
  const tools = TOOLS.createChatTools({ db, runtime: providerRuntime, config, env: {}, fetchImpl, guard, log: null, ...(discoverFetchImpl ? { discoverFetchImpl } : {}) })
  return { db, admin, runtime: providerRuntime, tools }
}

function seedProvider(db, { name = "fake", models = ["fake-model"], apiKey = "sk-secret-1234" } = {}) {
  const now = new Date().toISOString()
  db.prepare("INSERT INTO providers (name, base_url, api_key, models_json, created_at, updated_at) VALUES (?,?,?,?,?,?)").run(
    name,
    "http://127.0.0.1:9/v1",
    apiKey,
    JSON.stringify(models),
    now,
    now,
  )
}

// ── ① 工具面：七件在场 ∥ 动词面 ∥ 错误回灌（不抛）──────────────────────────────

test("七件在场：名集 ∥ schemas 逐件 ∥ 动词枚举与 §12 逐行一致", async () => {
  const { tools } = await makeTools()
  assert.deepEqual(tools.names, ["members", "providers", "models", "usage", "audit", "runners", "docker"])
  assert.equal(tools.schemas.length, 7)
  for (const schema of tools.schemas) {
    assert.equal(schema.type, "function")
    assert.ok(tools.names.includes(schema.function.name), `schema 名在册：${schema.function.name}`)
    assert.equal(schema.function.parameters.type, "object")
  }
  assert.deepEqual(tools.ops.members, ["list", "create", "reset_password", "revoke_key", "set_quota", "set_disables"])
  assert.deepEqual(tools.ops.providers, ["list", "add", "update", "remove", "discover"])
  assert.deepEqual(tools.ops.models, ["list", "enable", "disable", "settings", "alias"])
  assert.deepEqual(tools.ops.usage, ["summary", "rows"])
  assert.deepEqual(tools.ops.audit, ["query"])
  assert.deepEqual(tools.ops.runners, ["list", "add", "remove"])
  const dockerSchema = tools.schemas.find((schema) => schema.function.name === "docker")
  assert.deepEqual(dockerSchema.function.parameters.properties.op.enum, [...DOCKER_OPS.DOCKER_OPS])
  assert.deepEqual([...DOCKER_OPS.DOCKER_OPS], ["version", "info", "ps", "images", "pull", "create", "start", "stop", "rm", "logs"])
  const membersSchema = tools.schemas.find((schema) => schema.function.name === "members")
  assert.deepEqual(membersSchema.function.parameters.properties.op.enum, [...tools.ops.members])
})

test("错误回灌（回合不停）：未知工具 ∥ 缺 op ∥ 未知 op ∥ 入参非对象 ⇒ `{ ok:false, message }`（不抛）", async () => {
  const { tools } = await makeTools()
  const unknownTool = await tools.invoke("nope", {})
  assert.equal(unknownTool.ok, false)
  assert.match(unknownTool.message, /未知工具/)
  const noOp = await tools.invoke("members", {})
  assert.equal(noOp.ok, false)
  assert.match(noOp.message, /缺 op/)
  const badOp = await tools.invoke("members", { op: "nuke" })
  assert.equal(badOp.ok, false)
  assert.match(badOp.message, /未知 members 动词/)
  const badArgs = await tools.invoke("usage", "not-an-object")
  assert.equal(badArgs.ok, false, "入参非对象 ⇒ 工具级错误（不抛）")
})

// ── ② members（六动词 + 重置链边界）──────────────────────────────────────────

test("members：list ∥ create ∥ set_quota ∥ set_disables ∥ revoke_key ∥ reset_password（清计 + 既有域型零增）", async () => {
  const clears = []
  const guard = { clearUsername: (username) => clears.push(username) }
  const { db, tools, runtime } = await makeTools({ guard })
  seedProvider(db)
  runtime.set(PROVIDERS.createProviderRegistry(PROVIDERS.listProviderEntries(db), { env: {} }))

  const created = await tools.invoke("members", { op: "create", username: "alice", name: "Alice", role: "user" })
  assert.equal(created.ok, true)
  assert.equal(created.member.username, "alice")
  assert.ok(typeof created.tempPassword === "string" && created.tempPassword.length >= 8, "一次性临时密码回显（转告用户）")

  const listed = await tools.invoke("members", { op: "list" })
  assert.equal(listed.ok, true)
  assert.deepEqual(listed.members.map((row) => row.username).sort(), ["admin", "alice"])

  const quota = await tools.invoke("members", { op: "set_quota", member: "alice", quotas: { "fake/fake-model": 1000, "alias-x": null } })
  assert.equal(quota.ok, true)
  assert.deepEqual(quota.modelQuotas, { "fake/fake-model": 1000 })
  const badQuota = await tools.invoke("members", { op: "set_quota", member: "alice", quotas: { " /x": 1 } })
  assert.equal(badQuota.ok, false, "键形非法 ⇒ 工具级错误（库零变）")

  const disables = await tools.invoke("members", { op: "set_disables", member: "alice", disables: { "fake/fake-model": true } })
  assert.equal(disables.ok, true)
  assert.deepEqual(disables.modelDisables, { "fake/fake-model": true })

  const key = KEYS.issueKey(db, created.member.id, { name: "chat-key" })
  const revoked = await tools.invoke("members", { op: "revoke_key", member: "alice", keyId: key.id })
  assert.equal(revoked.ok, true)
  assert.equal(KEYS.getKeyById(db, key.id).status, "revoked")
  const crossMember = await tools.invoke("members", { op: "revoke_key", member: "admin", keyId: key.id })
  assert.equal(crossMember.ok, false, "key 不属该成员 ⇒ 工具级错误")

  // 重置链：改密 + 清计（+ 会话吊销）——既有域型零增（chat 侧只 `chat_call` 行——KD-SV-91）
  const before = db.prepare("SELECT COUNT(*) AS n FROM audit_events WHERE type = 'password_reset'").get().n
  const reset = await tools.invoke("members", { op: "reset_password", member: "alice" })
  assert.equal(reset.ok, true)
  assert.ok(typeof reset.tempPassword === "string" && reset.tempPassword.length >= 8)
  assert.deepEqual(clears, ["alice"], "清计路径（guard.clearUsername——装配面注入）")
  const after = db.prepare("SELECT COUNT(*) AS n FROM audit_events WHERE type = 'password_reset'").get().n
  assert.equal(after, before, "chat 重置 ⇒ 既有域型零增（不双记——password_reset 零行）")
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM audit_events WHERE type = 'member_create'").get().n, 0, "chat 建成员 ⇒ 既有域型零增（member_create 零行）")
  const missing = await tools.invoke("members", { op: "reset_password", member: "ghost" })
  assert.equal(missing.ok, false)
  assert.match(missing.message, /成员不存在/)
})

// ── ③ providers（五动词——写链与控制台同函数：库 + 运行时换表同动）────────────

test("providers：add ∥ list（apiKey 掩码）∥ update（settings 键级合并）∥ remove ∥ discover（假探针）——换表热生效", async () => {
  const discover = fakeDiscover({ models: ["m-a", "m-b"] })
  const { db, tools, runtime } = await makeTools({ discoverFetchImpl: discover.fetchImpl })

  const added = await tools.invoke("providers", { op: "add", name: "lab", baseURL: "https://lab.example/v1", apiKey: "sk-plain-9999", models: ["m-a", { name: "m-b", alias: "fast-b" }] })
  assert.equal(added.ok, true)
  assert.equal(added.name, "lab")
  assert.equal(runtime.get().entries().map((item) => item.ref).sort().join(","), "fast-b,lab/m-a", "运行时换表（保存即热生效）")

  const listed = await tools.invoke("providers", { op: "list" })
  assert.equal(listed.ok, true)
  const lab = listed.providers.find((row) => row.name === "lab")
  assert.equal(lab.apiKey, "…9999", "密钥面回显 = 掩码（明文不出）")
  assert.ok(!JSON.stringify(listed).includes("sk-plain-9999"), "明文密钥零入结果面")

  const updated = await tools.invoke("providers", { op: "update", id: added.id, settings: { "m-a": { rpm: 60 } } })
  assert.equal(updated.ok, true)
  const after = db.prepare("SELECT settings_json FROM providers WHERE id = ?").get(added.id)
  assert.equal(JSON.parse(after.settings_json)["m-a"].rpm, 60)

  const badAdd = await tools.invoke("providers", { op: "add", name: "lab", baseURL: "https://lab2.example/v1", models: [] })
  assert.equal(badAdd.ok, false)
  assert.match(badAdd.message, /provider 名已存在/)

  const discovered = await tools.invoke("providers", { op: "discover", baseURL: "https://lab.example/v1", apiKey: "sk-draft" })
  assert.equal(discovered.ok, true)
  assert.deepEqual(discovered.models, ["m-a", "m-b"])
  assert.equal(discover.calls[0].authorization, "Bearer sk-draft", "discover 携明传 key（Authorization 同转发口径）")
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM providers").get().n, 1, "discover 不落库（草稿——库内仍只新增的那一家）")

  const removed = await tools.invoke("providers", { op: "remove", id: added.id })
  assert.equal(removed.ok, true)
  assert.equal(runtime.get().entries().some((item) => item.provider.name === "lab"), false, "删后换表随动")
})

// ── ④ models（五动词——enable/disable/settings/alias + 唯一性）─────────────────

test("models：list ∥ enable ∥ settings（子字段合并）∥ alias（唯一性撞 ⇒ 工具级错误）∥ disable", async () => {
  const { db, tools, runtime } = await makeTools({})
  seedProvider(db, { name: "fake", models: ["fake-model"] })
  seedProvider(db, { name: "other", models: ["other-model"] })
  runtime.set(PROVIDERS.createProviderRegistry(PROVIDERS.listProviderEntries(db), { env: {} }))

  const before = await tools.invoke("models", { op: "list" })
  assert.deepEqual(before.models.map((row) => row.external).sort(), ["fake/fake-model", "other/other-model"])

  const enabled = await tools.invoke("models", { op: "enable", provider: "fake", model: "fake-model-2" })
  assert.equal(enabled.ok, true)
  assert.deepEqual(enabled.models, ["fake-model", "fake-model-2"])
  assert.equal(runtime.get().entries().some((item) => item.ref === "fake/fake-model-2"), true, "开放即热生效")

  const settings = await tools.invoke("models", { op: "settings", provider: "fake", model: "fake-model-2", settings: { rpm: 30, note: "内部试用" } })
  assert.equal(settings.ok, true)
  assert.equal(settings.settings.rpm, 30)
  assert.equal(settings.settings.note, "内部试用")
  assert.equal(settings.settings.tpm, null, "未设子字段 ⇒ 显式 null（单源归一形）")
  const badSettings = await tools.invoke("models", { op: "settings", provider: "fake", model: "fake-model-2", settings: { bogus: 1 } })
  assert.equal(badSettings.ok, false, "未知子字段 ⇒ 工具级错误（库零变）")

  const alias = await tools.invoke("models", { op: "alias", provider: "fake", model: "fake-model-2", alias: "fast2" })
  assert.equal(alias.ok, true)
  assert.equal(runtime.get().entries().some((item) => item.ref === "fast2"), true, "别名即换表")
  const clash = await tools.invoke("models", { op: "alias", provider: "other", model: "other-model", alias: "fast2" })
  assert.equal(clash.ok, false, "别名全服唯一（撞 ⇒ 工具级错误）")
  assert.match(clash.message, /别名/)

  const cleared = await tools.invoke("models", { op: "alias", provider: "fake", model: "fast2", alias: "" })
  assert.equal(cleared.ok, true)
  assert.equal(runtime.get().entries().some((item) => item.ref === "fake/fake-model-2"), true, "清别名 ⇒ 回落 provider/model")

  const disabled = await tools.invoke("models", { op: "disable", provider: "fake", model: "fake-model-2" })
  assert.equal(disabled.ok, true)
  assert.deepEqual(disabled.models, ["fake-model"])
  const missing = await tools.invoke("models", { op: "disable", provider: "fake", model: "ghost" })
  assert.equal(missing.ok, false, "不在开放清单 ⇒ 工具级错误")
})

// ── ⑤ usage ∥ ⑥ audit（读面 + 过滤 + 参数校验）───────────────────────────────

test("usage：summary ∥ rows（limit ≤100 收窄 ∥ 成员/模型/端点过滤）；audit：query（型过滤 ∥ 非法型 ⇒ 工具级错误）", async () => {
  const { db, tools, admin } = await makeTools({})
  seedProvider(db)
  const key = KEYS.issueKey(db, admin.id, { name: "k" })
  const alice = (await MEMBERS.createMember(db, { username: "alice", role: "user", password: PASSWORD })).member
  const aliceKey = KEYS.issueKey(db, alice.id, { name: "k2" })
  const day = Date.now()
  USAGE.recordUsage(db, { ts: day, memberId: admin.id, keyId: key.id, endpoint: "chat", provider: "fake", model: "fake-model", status: "ok", totalTokens: 100, durationMs: 5 })
  USAGE.recordUsage(db, { ts: day, memberId: alice.id, keyId: aliceKey.id, endpoint: "chat", provider: "fake", model: "fake-model", status: "ok", totalTokens: 50, durationMs: 5 })
  USAGE.recordUsage(db, { ts: day - 86400000 * 40, memberId: alice.id, keyId: aliceKey.id, endpoint: "embeddings", provider: "", model: "text-embed", status: "ok", totalTokens: 7, durationMs: 1 })

  const summary = await tools.invoke("usage", { op: "summary" })
  assert.equal(summary.ok, true)
  assert.equal(summary.totals.totalTokens, 150, "缺省窗 = 近 30 天（旧行不入）")
  assert.equal(summary.byModel.find((row) => row.model === "fake/fake-model").requests, 2)

  const byMember = await tools.invoke("usage", { op: "summary", member: "alice" })
  assert.equal(byMember.totals.totalTokens, 50)

  const rows = await tools.invoke("usage", { op: "rows", endpoint: "embeddings", from: 0 })
  assert.equal(rows.ok, true)
  assert.equal(rows.rows.length, 1)
  assert.equal(rows.rows[0].endpoint, "embeddings")
  const capped = await tools.invoke("usage", { op: "rows", limit: 9999 })
  assert.equal(capped.ok, true, "limit 超上限 ⇒ 夹 100（非错）")
  const badLimit = await tools.invoke("usage", { op: "rows", limit: -1 })
  assert.equal(badLimit.ok, false)
  const badEndpoint = await tools.invoke("usage", { op: "summary", endpoint: "nope" })
  assert.equal(badEndpoint.ok, false)

  const audit = await tools.invoke("audit", { op: "query", type: "agent_event" })
  assert.equal(audit.ok, true)
  const badType = await tools.invoke("audit", { op: "query", type: "nope" })
  assert.equal(badType.ok, false, "类型非法 ⇒ 工具级错误（枚举校验归 queryAudit）")
})

// ── ⑦⑧ runners ∥ docker（绑定注册节点；未在册 ⇒ 工具级错误回灌）──────────────

test("runners：list ∥ add（连通自检 + 落行）∥ remove（容器处置 ∥ 承载确认）；docker：绑定注册节点 ∥ 未在册 ⇒ 工具级错误", async () => {
  const engine = await startFakeDocker({ containers: [{ Id: "c1", Names: ["/box-1"], Image: "alpine:latest", State: "running", Status: "Up" }] })
  try {
    const { db, tools } = await makeTools({ fetchImpl: fetch })
    const empty = await tools.invoke("runners", { op: "list" })
    assert.deepEqual(empty.runners, [])

    const added = await tools.invoke("runners", { op: "add", name: "node-1", address: engine.base.replace("http://", "") })
    assert.equal(added.ok, true)
    assert.equal(added.runner.address, engine.base)
    assert.equal(added.runner.selfCheck.apiVer, "1.44", "自检读数逐值（引导步 → 协商：max(1.44, MinAPIVersion) = 1.44 → 复读）")
    const dup = await tools.invoke("runners", { op: "add", name: "node-1", address: engine.base })
    assert.equal(dup.ok, false, "重名 ⇒ 工具级错误")

    // docker：绑定注册节点（名 ∥ 地址两径）
    const ps = await tools.invoke("docker", { host: "node-1", op: "ps" })
    assert.equal(ps.ok, true)
    assert.equal(ps.resultCode, 200)
    assert.equal(ps.data[0].Names[0], "/box-1")
    const byAddress = await tools.invoke("docker", { host: engine.base, op: "info" })
    assert.equal(byAddress.ok, true)
    const logs = await tools.invoke("docker", { host: "node-1", op: "logs", args: { id: "c1" } })
    assert.equal(logs.ok, true)
    assert.match(String(logs.data), /hello from container/)
    const images = await tools.invoke("docker", { host: "node-1", op: "images" })
    assert.equal(images.ok, true)
    const badOp = await tools.invoke("docker", { host: "node-1", op: "exec" })
    assert.equal(badOp.ok, false, "非十动词 ⇒ 工具级错误")
    assert.match(badOp.message, /未知 docker 动词/)
    const noId = await tools.invoke("docker", { host: "node-1", op: "rm" })
    assert.equal(noId.ok, false)
    assert.match(noId.message, /rm\.id/)
    const unregistered = await tools.invoke("docker", { host: "node-ghost", op: "ps" })
    assert.equal(unregistered.ok, false, "未在册 ⇒ 工具级错误回灌（回合不停）")
    assert.match(unregistered.message, /节点未在册/)

    // remove：有容器未给处置 ⇒ 工具级错误；keep/remove 两径
    const noDisposition = await tools.invoke("runners", { op: "remove", id: added.runner.id })
    assert.equal(noDisposition.ok, false)
    assert.match(noDisposition.message, /keep.*remove/)
    const removed = await tools.invoke("runners", { op: "remove", id: added.runner.id, containers: "remove" })
    assert.equal(removed.ok, true)
    assert.equal(removed.removed, 1)
    assert.equal(engine.state.containers.length, 0, "连删逐删强删")
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM sandbox_runners").get().n, 0, "登记行删除")
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM audit_events WHERE type = 'sandbox_event'").get().n, 0, "chat 侧零双记（sandbox_event 零行——只 chat_call）")
    const missing = await tools.invoke("runners", { op: "remove", id: 999 })
    assert.equal(missing.ok, false, "节点不存在 ⇒ 工具级错误")
  } finally {
    await engine.close()
  }
})

test("runners.remove：承载工作区未确认 ⇒ 工具级错误（confirm 缺；零删行）；不可达节点 ⇒ 仅 keep 可过", async () => {
  const { db, tools } = await makeTools({})
  const now = new Date().toISOString()
  const admin = MEMBERS.findMemberByUsername(db, "admin")
  const key = KEYS.issueKey(db, admin.id, { name: "ws" })
  db.prepare("INSERT INTO sandbox_runners (name, address, status, runtime_json, created_at) VALUES (?,?,?,?,?)").run("node-x", "http://127.0.0.1:9", "active", "{}", now)
  const runner = db.prepare("SELECT * FROM sandbox_runners WHERE name = 'node-x'").get()
  db.prepare("INSERT INTO sandbox_workspaces (name, owner_member_id, key_id, key_plain, runner_id, limits_json, created_at) VALUES (?,?,?,?,?,?,?)").run(
    "ws-1",
    admin.id,
    key.id,
    key.plain,
    runner.id,
    "{}",
    now,
  )
  const blocked = await tools.invoke("runners", { op: "remove", id: runner.id, containers: "keep" })
  assert.equal(blocked.ok, false)
  assert.match(blocked.message, /工作区/)
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM sandbox_runners").get().n, 1, "拒 ⇒ 零删行")
  const forced = await tools.invoke("runners", { op: "remove", id: runner.id, containers: "keep", confirm: true })
  assert.equal(forced.ok, true)
  assert.equal(forced.kept, 0)
  assert.equal(db.prepare("SELECT runner_id FROM sandbox_workspaces WHERE name = 'ws-1'").get().runner_id, null, "工作区解绑（与控制台同函数）")
})
