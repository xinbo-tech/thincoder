/**
 * 2026-09-29-parity-b5-assemble.test.mjs — 批次本地对拍锁（parity-b5-assemble · B5 装配序上提）。
 * 运行（仓根）：node --test docs/batches/2026-09-29-parity-b5-assemble.test.mjs
 * （本刻暂存 `.thincoder/tmp/` 同名件——两层深 ⇒ 终位同命令；**导入以 `process.cwd()` 为仓库根解析**）
 * 判据（设计 §2.5）= 可观察面 + 结构面：L1 同源锁 · B1 装配序 · B2 工具终形缝 · B3 `teamConfig` ·
 * B4 `validateProvider` · B5 desk adapter · B6 CLI adapter。判据句（§2.4-③ desk 统一后可观察零变）的
 * 人工面不在本件（本锁 = 本批唯一机检承载）。
 * 批次本地单测件：名随批次档、住批次目录、不进仓套件（复跑 = 上行命令；改后盘 = 对拍锁）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

// 仓根 = 运行 cwd（本件在 `.thincoder/tmp` 与 `docs/batches` 两层深 ⇒ 同一命令）。
const root = process.cwd()
const at = (rel) => pathToFileURL(join(root, rel)).href
const CORE = "thincoder-core/agent/assemble.mjs"
const DESK = "thincoder-desktop/src/main/agent-assemble.mjs"
const CLI = "thincoder-cli/src/cli/make-agent.mjs"
const FOUR = ["teamConfig", "gitAuthor", "validateProvider", "DEFAULT_DEPS"]

const { configDir } = await import(at("thincoder-core/config.mjs"))
const CWD = join(tmpdir(), "b5-cwd")
const tmp = (p) => mkdtempSync(join(tmpdir(), p))

/** 假 config（核装配序消费面形：provider ∕ providersList ∕ memory ∕ embedding ∕ agent）。 */
function fakeConfig({ provider = { name: "p1", model: "m1", baseURL: "https://api.invalid/v1" }, projectDir = null, team = null, apiKey = "", streamRules = [], extra = {} } = {}) {
  return {
    provider,
    providersList: [{ name: "p1" }],
    memory: { dbPath: "fake.db", projectDir, team },
    embedding: apiKey ? { baseURL: "https://embed.invalid/v1", apiKey, model: "emb-1" } : undefined,
    agent: { streamRules },
    ...extra,
  }
}

/** 假 deps（八缺省缝 + `injectProxy`）：逐调用记 tag（序断言）+ 关键入参（注入值断言）。 */
function harness(config, { fileRules = [], team = null } = {}) {
  const calls = []
  const seen = { sync: [] }
  const memory = {}
  const baseTools = [{ name: "read" }]
  const agent = { provider: config.provider, config }
  const deps = {
    loadConfig: () => { calls.push("loadConfig"); return config },
    createMemory: (opts) => { calls.push("createMemory"); seen.createMemory = opts; return memory },
    createAgent: (opts) => { calls.push("createAgent"); seen.createAgent = opts; return agent },
    assembleBuiltinTools: async (opts) => { calls.push("assembleBuiltinTools"); seen.tools = opts; return baseTools },
    discoverRules: (cwd) => { calls.push("discoverRules"); seen.rulesCwd = cwd; return fileRules },
    syncDir: async (m, opts) => { calls.push(`syncDir:${opts.layer}`); seen.sync.push(opts) },
    team: () => { calls.push("team"); return team },
    author: () => { calls.push("author"); return "fake-author" },
    injectProxy: (providers) => { calls.push("injectProxy"); providers[0].proxyUri = "http://proxy.invalid" },
  }
  return { deps, calls, seen, memory, baseTools, agent }
}

/** 判据主序（设计 §2.5-B1 八步 —— 装配层调用序列；两取值面调用 `team` ∕ `author` 不入本列）。 */
const CORE_ORDER = ["loadConfig", "injectProxy", "createMemory", "discoverRules", "syncDir:project", "syncDir:team", "assembleBuiltinTools", "createAgent"]

/** 实际调用序列（`team` = 团队层取值（项目层同步之后）；`author` = `assembleBuiltinTools` 入参求值）。 */
function expectedOrder({ project = false, team = false } = {}) {
  return [
    "loadConfig", "injectProxy", "createMemory", "discoverRules",
    ...(project ? ["syncDir:project"] : []),
    "team",
    ...(team ? ["syncDir:team"] : []),
    "author", "assembleBuiltinTools", "createAgent",
  ]
}

/** 假 team（`dir` 预置 `.git` —— `gitmem.mjs:33` existsSync 早退 ⇒ 零 clone ∕ 零网络）。 */
function teamFixture() {
  const dir = tmp("b5-team-")
  mkdirSync(join(dir, ".git"))
  return { name: "t1", repo: "https://example.invalid/t.git", dir }
}

/** 判据过滤投影：只保留设计主序八步。 */
const coreSeq = (calls) => calls.filter((c) => CORE_ORDER.includes(c))

// ─── L1 · 同源锁（四名恒等 + 两转口档零本地定义）────────────────────────────

test("L1: 四名转口 === 核件同一绑定；desk ∕ CLI 两转口档零本地定义", async () => {
  const core = await import(at(CORE))
  const desk = await import(at(DESK))
  const cli = await import(at(CLI))
  for (const name of FOUR) {
    assert.equal(desk[name], core[name], `desk.${name} 恒等核绑定`)
    assert.equal(cli[name], core[name], `cli.${name} 恒等核绑定`)
  }
  for (const [label, rel] of [["desk", DESK], ["cli", CLI]]) {
    const src = readFileSync(join(root, rel), "utf8")
    for (const name of FOUR) {
      const local = new RegExp(`(function\\s+${name}\\b)|(const\\s+${name}\\s*=)|(let\\s+${name}\\s*=)|(class\\s+${name}\\b)`)
      assert.ok(!local.test(src), `${label}: ${name} 零本地定义（结构扫描）`)
    }
  }
})

// ─── B1 · 装配序 + 注入值（核件 · 假 deps）────────────────────────────────

test("B1: 装配序 + 注入值（假 team dir 预置 .git ⇒ 零网络；embedding 两形）", async () => {
  const { assembleAgent } = await import(at(CORE))
  const teamObj = teamFixture()
  const abs = join(tmpdir(), "b5-abs-mem")

  // 形 ①：projectDir（相对）+ team + embedding
  const fileRules = [{ pattern: "a" }, { pattern: "b" }]
  const config = fakeConfig({ projectDir: "mem", team: { repo: "https://example.invalid/t.git" }, apiKey: "k", streamRules: [{ pattern: "b" }, { pattern: "c" }] })
  const h = harness(config, { fileRules, team: teamObj })
  const out = await assembleAgent({ cwd: CWD, deps: h.deps })

  assert.equal(out, h.agent)
  assert.deepEqual(coreSeq(h.calls), CORE_ORDER, "序 = 设计 §2.5-B1（八步）")
  assert.deepEqual(h.calls, expectedOrder({ project: true, team: true }), "实际调用序列")
  // 注入值
  assert.equal(h.memory.codeOrigin, CWD, "memory.codeOrigin = cwd")
  assert.equal(h.memory.projectOrigin, join(CWD, "mem"), "相对 projectDir 按 cwd 解析")
  assert.deepEqual(h.seen.sync, [{ layer: "project", dir: join(CWD, "mem") }, { layer: "team", dir: teamObj.dir }])
  assert.equal(h.seen.rulesCwd, CWD)
  assert.deepEqual(config.agent.streamRules.map((r) => r.pattern), ["a", "b", "c"], "streamRules 合并：文件规则在前 ∕ 同 pattern 去重")
  assert.equal(config.agent.streamRules[0], fileRules[0], "文件规则对象原样（非副本）")
  assert.equal(h.seen.tools.author, "fake-author", "assembleBuiltinTools 入参 author")
  assert.equal(h.seen.tools.team, teamObj, "assembleBuiltinTools 入参 team")
  assert.equal(h.seen.tools.model, "m1", "assembleBuiltinTools 入参 model（provider.model）")
  assert.equal(h.seen.tools.memory, h.memory)
  assert.equal(h.seen.tools.cwd, CWD)
  assert.equal(config.provider.proxyUri, "http://proxy.invalid", "provider.proxyUri 同步注入结果")
  assert.equal(h.agent.providers, config.providersList, "三字段：providers")
  assert.equal(h.agent.activeProvider, "p1", "三字段：activeProvider")
  assert.equal(h.agent.activeModel, "m1", "三字段：activeModel")
  assert.equal(h.seen.createAgent.tools, h.baseTools, "缺席 toolsFinalize ⇒ baseTools 原样")
  assert.equal(h.seen.createAgent.cwd, CWD)
  assert.equal(h.seen.createAgent.memory, h.memory)
  assert.equal(h.seen.createAgent.config, config)
  assert.equal(h.memory.embedder.model, "emb-1", "embedding.apiKey 在场 ⇒ embedder 附着")

  // 形 ②：绝对 projectDir + 无 team + 无 embedding
  const c2 = fakeConfig({ projectDir: abs })
  const h2 = harness(c2)
  await assembleAgent({ cwd: CWD, deps: h2.deps })
  assert.deepEqual(h2.calls, expectedOrder({ project: true }), "无 team ⇒ 跳过团队层（且序位不变）")
  assert.equal(h2.memory.projectOrigin, abs, "绝对 projectDir 原样")
  assert.equal(h2.memory.embedder, undefined, "无 embedding.apiKey ⇒ 零 embedder")
})

// ─── B2 · 工具终形缝（同步返回值 ∕ Promise ∕ 缺席）──────────────────────────

test("B2: toolsFinalize（同步返回值 ∕ 返回 Promise ∕ 缺席 ⇒ 恒等）", async () => {
  const { assembleAgent } = await import(at(CORE))
  const ctxSeen = []
  const syncTools = [{ name: "sync-tool" }]
  const promiseTools = [{ name: "promise-tool" }]

  // ① 在场（同步返回值）
  const c1 = fakeConfig()
  const h1 = harness(c1)
  const out1 = await assembleAgent({ cwd: CWD, deps: h1.deps, toolsFinalize: (base, ctx) => { ctxSeen.push([base, ctx]); return syncTools } })
  assert.equal(ctxSeen[0][0], h1.baseTools, "入参 = baseTools")
  assert.equal(ctxSeen[0][1].config, c1)
  assert.equal(ctxSeen[0][1].cwd, CWD)
  assert.equal(ctxSeen[0][1].provider, c1.provider)
  assert.equal(h1.seen.createAgent.tools, syncTools, "同步返回值进 createAgent")
  assert.equal(out1, h1.agent)

  // ② 在场（返回 Promise ⇒ 其 await 值）
  const c2 = fakeConfig()
  const h2 = harness(c2)
  await assembleAgent({ cwd: CWD, deps: h2.deps, toolsFinalize: (base) => new Promise((r) => setImmediate(() => r(promiseTools))) })
  assert.equal(h2.seen.createAgent.tools, promiseTools, "Promise ⇒ 其 await 值进 createAgent")
  assert.ok(!(h2.seen.createAgent.tools instanceof Promise))

  // ③ 缺席 ⇒ 恒等
  const c3 = fakeConfig()
  const h3 = harness(c3)
  await assembleAgent({ cwd: CWD, deps: h3.deps })
  assert.equal(h3.seen.createAgent.tools, h3.baseTools, "缺席 ⇒ baseTools 原样（恒等）")
})

// ─── B3 · teamConfig ──────────────────────────────────────────────────────

test("B3: teamConfig（无 repo ⇒ null；缺省名 ∕ dir；显式优先）", async () => {
  const { teamConfig } = await import(at(CORE))
  assert.equal(teamConfig({ memory: { team: { name: "x" } } }), null, "无 repo ⇒ null")
  assert.equal(teamConfig({}), null)
  assert.equal(teamConfig(undefined), null, "config 缺省不抛（`config?.` 形）")
  const d = teamConfig({ memory: { team: { repo: "https://example.invalid/r.git" } } })
  assert.deepEqual(d, { name: "default", repo: "https://example.invalid/r.git", dir: join(configDir, "teams", "default") })
  assert.ok(d.dir.endsWith(join("teams", "default")), "缺省 dir = <configDir>/teams/default")
  assert.deepEqual(
    teamConfig({ memory: { team: { repo: "r", name: "n1", dir: "/x/y" } } }),
    { name: "n1", repo: "r", dir: "/x/y" },
    "显式 name ∕ dir 优先",
  )
})

// ─── B4 · validateProvider ────────────────────────────────────────────────

test("B4: validateProvider（有效清标 ∕ 三档文案逐字 ∕ config 覆盖含空串）", async () => {
  const { validateProvider } = await import(at(CORE))
  // 有效（携旧标）⇒ 清两标 + 返 agent
  const a1 = { provider: { name: "n", model: "m", baseURL: "b" }, _providerInvalid: true, _providerInvalidReason: "stale" }
  assert.equal(validateProvider(a1, {}), a1, "返回 agent")
  assert.ok(!("_providerInvalid" in a1) && !("_providerInvalidReason" in a1), "有效 ⇒ 清两标")
  // 三档文案逐字
  const three = [
    [{ model: "m", baseURL: "b" }, "provider 不存在"],
    [{ name: "n", baseURL: "b" }, "model 缺失"],
    [{ name: "n", model: "m" }, "缺少 baseURL"],
    [undefined, "provider 不存在"],
  ]
  for (const [provider, reason] of three) {
    const a = { provider }
    validateProvider(a, {})
    assert.equal(a._providerInvalid, true)
    assert.equal(a._providerInvalidReason, reason)
  }
  // config 覆盖（`??` 判——空串亦覆盖）
  const a2 = { provider: { name: "n", model: "m" } }
  validateProvider(a2, { providerInvalidReason: "cfg-reason" })
  assert.equal(a2._providerInvalidReason, "cfg-reason", "覆盖值优先")
  const a3 = { provider: { name: "n", model: "m" } }
  validateProvider(a3, { providerInvalidReason: "" })
  assert.equal(a3._providerInvalidReason, "", "空串亦覆盖（`??` 判——已判定可忽略差）")
})

// ─── B5 · desk adapter ────────────────────────────────────────────────────

test("B5: desk assembleFor（核调用 + `_slot` ∕ 校验调用 · deps 透传 · 序 = B1）", async () => {
  const desk = await import(at(DESK))
  const teamFix = teamFixture()
  /** 假装配面（projectDir + team 齐备 ⇒ 与 B1 同形序）。 */
  const mk = (provider) => {
    const config = fakeConfig({ provider, projectDir: "mem", team: { repo: "https://example.invalid/t.git" } })
    return { config, h: harness(config, { team: teamFix }) }
  }

  // ① 无效 provider（缺 baseURL）+ 无覆盖 ⇒ 统一三档文案
  const one = mk({ name: "p1", model: "m1" })
  const out1 = await desk.assembleFor({ cwd: CWD, slot: 7, deps: one.h.deps })
  assert.equal(out1, one.h.agent)
  assert.equal(out1._slot, 7, "_slot = 注入槽值")
  assert.equal(out1._providerInvalid, true, "校验已跑（无效形可判）")
  assert.equal(out1._providerInvalidReason, "缺少 baseURL", "统一三档文案")
  assert.deepEqual(one.h.calls, expectedOrder({ project: true, team: true }), "序 = B1 序")
  assert.deepEqual(coreSeq(one.h.calls), CORE_ORDER, "序 = 设计 §2.5-B1（八步）")
  assert.equal(one.h.seen.createAgent.cwd, CWD, "cwd = 注入项目根（非 process.cwd()）")
  assert.equal(one.h.seen.createAgent.tools, one.h.baseTools, "desk 无工具终形缝 ⇒ baseTools 原样")

  // ② 无效 provider + config 覆盖 ⇒ 覆盖值可见（证明 `agent.config` 传校验）
  const two = mk({ name: "p1", model: "m1" })
  two.config.providerInvalidReason = "cfg-reason"
  const out2 = await desk.assembleFor({ cwd: CWD, slot: 1, deps: two.h.deps })
  assert.equal(out2._providerInvalidReason, "cfg-reason", "`agent.config` 传校验")

  // ③ 有效 provider ⇒ 零标记
  const three = mk()
  const out3 = await desk.assembleFor({ cwd: CWD, slot: 2, deps: three.h.deps })
  assert.equal(out3._providerInvalid, undefined)
  assert.equal(out3._providerInvalidReason, undefined)
  assert.equal(out3._slot, 2)
})

// ─── B6 · CLI adapter ─────────────────────────────────────────────────────

test("B6: CLI assembleAgent（空 MCP ⇒ `_mcpWarnings` 空数组 · 非工程 ⇒ manifest null · 恒等剔除）", async () => {
  const cli = await import(at(CLI))
  // 位置无关：本用例打真 `process.cwd()`（端壳留面）⇒ 换到无 `.mcp.json` 的临时 cwd 再跑（finally 复原）。
  const prevCwd = process.cwd()
  process.chdir(tmp("b5-cli-cwd-"))
  try {
    assert.ok(!existsSync(join(process.cwd(), ".mcp.json")), "前置：cwd 无 .mcp.json（空 MCP 路径）")
    const config = fakeConfig({ projectDir: "mem", team: { repo: "https://example.invalid/t.git" }, extra: { mcp: { servers: [] } } })
    const h = harness(config, { team: teamFixture() })
    const out = await cli.assembleAgent({ deps: h.deps })

    assert.equal(out, h.agent)
    assert.ok(Array.isArray(out._mcpWarnings), "`_mcpWarnings` 在场")
    assert.deepEqual(out._mcpWarnings, [], "空 MCP 配置 ⇒ 空数组")
    assert.equal(out.manifest, null, "非工程 ⇒ attachManifest 已跑（manifest null）")
    assert.equal(out._providerInvalid, undefined, "有效 provider ⇒ 零标记")
    assert.deepEqual(h.calls, expectedOrder({ project: true, team: true }), "序 = B1 序")
    assert.equal(h.seen.createAgent.cwd, process.cwd(), "cwd = process.cwd()（端壳留面）")
    assert.equal(h.seen.rulesCwd, process.cwd())
    assert.deepEqual(h.seen.createAgent.tools, h.baseTools, "空 MCP + 空剔除 ⇒ 工具原样")
    // `applyToolExclusions` 恒等语义（空列表 / 缺省 ⇒ 原数组原样返）
    assert.equal(cli.applyToolExclusions(h.baseTools, []), h.baseTools)
    assert.equal(cli.applyToolExclusions(h.baseTools), h.baseTools)
  } finally {
    process.chdir(prevCwd)
  }
})
