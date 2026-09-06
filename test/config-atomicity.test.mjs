/**
 * config-atomicity.test.mjs — R10 F5（config.json 写原子性）验收测试
 * （MULTI-INSTANCE-COLLAB.md §2a.2 / §2a.8 AC-R10a）。
 *
 * T-F5a：mtime-conflict + .bak 落盘 + V2（对端新值）未被抹——writeConfigAtomic 门控
 * T-F5b：整节内存写回消灭——syncProviderField / pickers 流在「内存旧 + 磁盘新」下操作
 *        单 provider → 磁盘其他改动（B 的 key 变更 + B 新增 provider）保留
 * T-F5e：cmd-mcp remove 写回改造专属——磁盘其他 server 改动保留
 * T-F5d：无并发零回归（正常保存/顺序保存/首建/畸形拒写/内存镜像）
 *
 * 伪属主范式：seedFile 直写模拟对端（无真 spawn）——冲突窗口用 mutate 内写盘模拟；
 * pickers 流用「real-disk fake persistRaw」注入（与 mcp.test T23 同型）——闭包在真实
 * 磁盘新鲜 raw 上执行，断言语义 = 不再整节替换。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { mkdtempSync, rmSync, writeFileSync, readFileSync, readdirSync, statSync, utimesSync, existsSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const PROJECT_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const { writeConfigAtomic } = await import("../src/config.mjs")
const { createConfigHelpers } = await import("../src/tui/config-helpers.mjs")
const { createPickers } = await import("../src/tui/pickers.mjs")
const { createWizard } = await import("../src/tui/wizard.mjs")
const { handleMcpCommand } = await import("../src/tui/cmd-mcp.mjs")

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const disk = (p) => JSON.parse(readFileSync(p, "utf8"))
const bakFiles = (dir) => readdirSync(dir).filter((n) => /^config\.json\.bak-\d+$/.test(n))

/** 伪属主写盘：写后强制 mtime 前进（粗粒度 FS 免疫——同 tick 写会被门控漏判）。 */
function seedWrite(fp, content) {
  writeFileSync(fp, content)
  const st = statSync(fp)
  utimesSync(fp, st.atime, new Date(st.mtimeMs + 5000))
}

/** real-disk fake persistRaw：读真实磁盘 → mutate（被测闭包）→ 写回（与 mcp.test T23 同型）。 */
function realDiskPersist(cfgPath) {
  return async (mutate) => {
    const raw = disk(cfgPath)
    mutate(raw)
    writeFileSync(cfgPath, JSON.stringify(raw, null, 2) + "\n")
  }
}

/** pickers ctx mock（pickers.test / provider-spec.test 同风格）+ real-disk persistRaw。 */
function pickersCtx(agent, cfgPath) {
  const state = {}
  const lines = []
  return {
    ctx: {
      agent, state,
      render: () => {},
      ansi: { bold: "" },
      C: { tool: "", text: "", dim: "", error: "" },
      pushLine: (t) => lines.push(t),
      pushLabel: (t) => lines.push(t),
      persistRaw: realDiskPersist(cfgPath),
      askQuestion: async () => "",
      maskKey: () => "***",
    },
    state, lines,
  }
}

// ====================================================================
// T-F5a —— writeConfigAtomic mtime 门控（冲突放弃 + .bak + V2 未被抹）
// ====================================================================

test("T-F5a mtime-conflict：A 新鲜读后对端写 V2 → A 保存放弃（{ok:false}）+ .bak 落盘 + 文件内容 = V2", () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-f5a-"))
  const cfg = join(dir, "config.json")
  const V1 = JSON.stringify({ providers: [{ name: "a", apiKey: "sk-a" }] }, null, 2) + "\n"
  const V2 = JSON.stringify({ providers: [{ name: "a", apiKey: "sk-a" }, { name: "b", apiKey: "sk-b" }] }, null, 2) + "\n"
  writeFileSync(cfg, V1)
  try {
    const r = writeConfigAtomic(cfg, (raw) => {
      // A 已持 V1 新鲜读（raw）——对端此刻写 V2（伪属主 seedFile）
      seedWrite(cfg, V2)
      raw.providers ??= []
      raw.providers.push({ name: "stale", apiKey: "sk-x" }) // 本端已 mutate——冲突后必须整体丢弃
    })
    assert.deepEqual(r, { ok: false, reason: "mtime-conflict" }, "返回 mtime-conflict")
    assert.equal(readFileSync(cfg, "utf8"), V2, "文件内容 = V2（对端改动未被抹）")
    const baks = bakFiles(dir)
    assert.equal(baks.length, 1, ".bak 落盘")
    assert.equal(readFileSync(join(dir, baks[0]), "utf8"), V2, ".bak 内容 = V2（保现场）")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("T-F5a-b 对端在 A 读后创建文件 → 同型冲突放弃 + .bak（t0=null 基线）", () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-f5ab-"))
  const cfg = join(dir, "config.json")
  const V2 = JSON.stringify({ providers: [{ name: "b", apiKey: "sk-b" }] }, null, 2) + "\n"
  try {
    const r = writeConfigAtomic(cfg, () => {
      seedWrite(cfg, V2) // 本端读时文件缺失（{}）——对端此刻创建
    })
    assert.deepEqual(r, { ok: false, reason: "mtime-conflict" })
    assert.equal(readFileSync(cfg, "utf8"), V2, "对端创建的内容保持在线")
    assert.equal(bakFiles(dir).length, 1, ".bak 落盘")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("T-F5d 无并发零回归：正常保存 / 顺序多写（自写不误冲突）/ 首建（父目录自动创建）/ 畸形拒写", () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-f5d-"))
  const cfg = join(dir, "sub", "config.json") // 父目录不存在——首建路径
  try {
    // 首建：文件缺失 → ok:true + 文件生成
    let r = writeConfigAtomic(cfg, (raw) => { raw.providers = [{ name: "a", apiKey: "sk-a" }] })
    assert.deepEqual(r, { ok: true })
    assert.equal(disk(cfg).providers[0].name, "a")

    // 顺序多写：第二次保存基于第一次结果——不误判冲突、不丢前次改动
    r = writeConfigAtomic(cfg, (raw) => { raw.activeProvider = "a"; raw.providers[0].model = "m1" })
    assert.deepEqual(r, { ok: true })
    const d = disk(cfg)
    assert.equal(d.activeProvider, "a")
    assert.equal(d.providers[0].model, "m1", "前次写的内容保留（自写刷新基线）")
    assert.equal(bakFiles(join(dir, "sub")).length, 0, "无冲突不产生 .bak")

    // 畸形文件拒写（不静默覆盖）
    writeFileSync(cfg, "{broken", "utf8")
    assert.throws(() => writeConfigAtomic(cfg, (raw) => { raw.x = 1 }), /not parseable/)
    assert.equal(readFileSync(cfg, "utf8"), "{broken", "畸形文件未被覆盖")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

// ====================================================================
// T-F5b —— 整节写回消灭：#1 syncProviderField
// ====================================================================

test("T-F5b#1 syncProviderField：内存 providers 旧 + 磁盘新 → 单字段补丁，磁盘 B 改动保留", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-f5b1-"))
  const cfg = join(dir, "config.json")
  const agent = {
    providers: [{ name: "deepseek", baseURL: "https://api.deepseek.com", model: "deepseek-chat", apiKey: "sk-old" }],
    activeProvider: "deepseek",
  }
  seedWrite(cfg, JSON.stringify({
    providers: [
      { name: "deepseek", baseURL: "https://api.deepseek.com", model: "deepseek-chat", apiKey: "sk-new" }, // B 改了 key
      { name: "kimi", baseURL: "https://api.moonshot.cn/v1", model: "kimi-k3", apiKey: "sk-kimi" }, // B 新增
    ],
    activeProvider: "deepseek",
  }))
  try {
    const { syncProviderField } = createConfigHelpers(agent, { configPath: cfg })
    await syncProviderField("deepseek", "reasoningEffort", "high")
    const d = disk(cfg)
    const ds = d.providers.find((p) => p.name === "deepseek")
    assert.equal(ds.apiKey, "sk-new", "B 的 key 改动保留（不再整节写回内存快照）")
    assert.equal(ds.reasoningEffort, "high", "单字段补丁生效")
    assert.ok(d.providers.some((p) => p.name === "kimi"), "B 新增的 provider 保留")
    assert.equal(d.providers.length, 2, "无整节替换的额外副作用")
    assert.equal(agent.providers[0].reasoningEffort, "high", "内存镜像同步")
    assert.equal(bakFiles(dir).length, 0, "无 mtime 冲突（B 写在前）——不产生 .bak")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

// ====================================================================
// T-F5b —— 整节写回消灭：#2-6 pickers 五流（内存旧 + 磁盘新 → 磁盘 B 改动保留）
// ====================================================================

/** 内存 = 启动快照（旧 key、无 kimi）；磁盘 = B 改过（deepseek sk-new + kimi 新增 + glm）。 */
function staleScenario() {
  const agent = {
    providers: [
      { name: "deepseek", baseURL: "https://api.deepseek.com", model: "deepseek-chat", apiKey: "sk-old" },
      { name: "glm", baseURL: "https://open.bigmodel.cn/api/paas/v4", model: "glm-5.2", apiKey: "sk-glm" },
    ],
    activeProvider: "deepseek",
    activeModel: null,
    provider: { name: "deepseek", baseURL: "https://api.deepseek.com", model: "deepseek-chat", apiKey: "sk-old" },
    config: {},
  }
  const diskBody = {
    providers: [
      { name: "deepseek", baseURL: "https://api.deepseek.com", model: "deepseek-chat", apiKey: "sk-new" },
      { name: "kimi", baseURL: "https://api.moonshot.cn/v1", model: "kimi-k3", apiKey: "sk-kimi" },
      { name: "glm", baseURL: "https://open.bigmodel.cn/api/paas/v4", model: "glm-5.2", apiKey: "sk-glm" },
    ],
    activeProvider: "deepseek",
  }
  return { agent, diskBody }
}

async function popItem(state, popPicker, find, ms = 25) {
  await sleep(ms)
  const item = state.picker?.filteredItems?.find(find)
  assert.ok(item, `picker item not found (${String(find)}) — title: ${state.picker?.title ?? "(none)"}`)
  popPicker(item)
}

test("T-F5b#2/3 add（preset + custom）：磁盘 fresh raw 上 push——B 改动保留", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-f5b23-"))
  const cfg = join(dir, "config.json")
  try {
    // ── preset 路径（openai——内存/磁盘都无 → 不撞号）──
    {
      const { agent, diskBody } = staleScenario()
      writeFileSync(cfg, JSON.stringify(diskBody, null, 2) + "\n")
      const { ctx, state } = pickersCtx(agent, cfg)
      ctx.askQuestion = async () => "sk-openai"
      const { openModelPicker, popPicker } = createPickers(ctx)
      const flow = openModelPicker()
      await popItem(state, popPicker, (e) => e.action === "add")
      await popItem(state, popPicker, (e) => e.kind === "preset" && e.name === "openai", 40)
      await sleep(40) // key 问询 + 落盘
      popPicker(null) // 主菜单重开 → Esc
      await flow
      const d = disk(cfg)
      assert.ok(d.providers.some((p) => p.name === "openai"), "preset 落盘")
      assert.equal(d.providers.find((p) => p.name === "deepseek").apiKey, "sk-new", "preset 流保留 B 改动")
      assert.ok(d.providers.some((p) => p.name === "kimi"), "preset 流保留 B 新增")
    }
    // ── custom 路径（my-custom——format 默认 openai 直过）──
    {
      const { agent, diskBody } = staleScenario()
      writeFileSync(cfg, JSON.stringify(diskBody, null, 2) + "\n")
      const asks = ["my-custom", "https://api.custom.example.com/v1", "custom-model", ""]
      const { ctx, state } = pickersCtx(agent, cfg)
      ctx.askQuestion = async () => asks.shift() ?? ""
      const { openModelPicker, popPicker } = createPickers(ctx)
      const flow = openModelPicker()
      await popItem(state, popPicker, (e) => e.action === "add")
      await popItem(state, popPicker, (e) => e.kind === "custom")
      await sleep(60) // name/baseURL/model 三连问
      await popItem(state, popPicker, (e) => e.name === "openai", 40) // API format 默认
      await sleep(40) // key 问询（空 → 跳过）→ 主菜单重开
      popPicker(null)
      await flow
      const d = disk(cfg)
      assert.ok(d.providers.some((p) => p.name === "my-custom"), "custom 落盘")
      assert.equal(d.providers.find((p) => p.name === "deepseek").apiKey, "sk-new", "custom 流保留 B 改动")
      assert.ok(d.providers.some((p) => p.name === "kimi"), "custom 流保留 B 新增")
    }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("T-F5b#4 remove：磁盘 fresh raw 上 splice——B 改动保留", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-f5b4-"))
  const cfg = join(dir, "config.json")
  const { agent, diskBody } = staleScenario()
  writeFileSync(cfg, JSON.stringify(diskBody, null, 2) + "\n")
  const { ctx, state } = pickersCtx(agent, cfg)
  const { openModelPicker, popPicker } = createPickers(ctx)
  try {
    const flow = openModelPicker()
    await popItem(state, popPicker, (e) => e.action === "remove")
    await popItem(state, popPicker, (e) => e.name === "glm", 40)
    await sleep(40)
    popPicker(null) // 主菜单重开 → Esc
    await flow
    const d = disk(cfg)
    assert.ok(!d.providers.some((p) => p.name === "glm"), "glm 已移除")
    assert.equal(d.providers.find((p) => p.name === "deepseek").apiKey, "sk-new", "remove 流保留 B 改动")
    assert.ok(d.providers.some((p) => p.name === "kimi"), "remove 流保留 B 新增")
    assert.ok(!agent.providers.some((p) => p.name === "glm"), "内存同步移除")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("T-F5b#5 setProviderKey：磁盘 fresh raw 上改目标项 key——B 改动保留", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-f5b5-"))
  const cfg = join(dir, "config.json")
  const { agent, diskBody } = staleScenario()
  writeFileSync(cfg, JSON.stringify(diskBody, null, 2) + "\n")
  const { ctx } = pickersCtx(agent, cfg)
  const { setProviderKey } = createPickers(ctx)
  try {
    await setProviderKey("glm", "sk-glm-new")
    const d = disk(cfg)
    assert.equal(d.providers.find((p) => p.name === "glm").apiKey, "sk-glm-new", "目标项 key 已改")
    assert.equal(d.providers.find((p) => p.name === "deepseek").apiKey, "sk-new", "setKey 流保留 B 改动")
    assert.ok(d.providers.some((p) => p.name === "kimi"), "setKey 流保留 B 新增")
    assert.equal(agent.providers.find((p) => p.name === "glm").apiKey, "sk-glm-new", "内存同步")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("T-F5b#6 setContextFlow：磁盘 fresh raw 上改目标项 context——B 改动保留", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-f5b6-"))
  const cfg = join(dir, "config.json")
  const { agent, diskBody } = staleScenario()
  writeFileSync(cfg, JSON.stringify(diskBody, null, 2) + "\n")
  const { ctx, state } = pickersCtx(agent, cfg)
  ctx.askQuestion = async () => "128"
  const { setContextFlow, popPicker } = createPickers(ctx)
  try {
    const flow = setContextFlow()
    await popItem(state, popPicker, (e) => e.name === "deepseek")
    await flow
    const d = disk(cfg)
    assert.equal(d.providers.find((p) => p.name === "deepseek").context, 128, "目标项 context 已写")
    assert.equal(d.providers.find((p) => p.name === "deepseek").apiKey, "sk-new", "setContext 流保留 B 改动")
    assert.ok(d.providers.some((p) => p.name === "kimi"), "setContext 流保留 B 新增")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("T-F5b selectModel：磁盘 fresh raw 上改目标项 model + active 指针——B 改动保留（清单外同型写回补正）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-f5b-sel-"))
  const cfg = join(dir, "config.json")
  const { agent, diskBody } = staleScenario()
  writeFileSync(cfg, JSON.stringify(diskBody, null, 2) + "\n")
  const { ctx } = pickersCtx(agent, cfg)
  const { selectModel } = createPickers(ctx)
  try {
    await selectModel({ provider: "deepseek", model: "deepseek-v4-pro" })
    const d = disk(cfg)
    assert.equal(d.providers.find((p) => p.name === "deepseek").model, "deepseek-v4-pro", "目标项 model 已切")
    assert.equal(d.providers.find((p) => p.name === "deepseek").apiKey, "sk-new", "selectModel 保留 B 改动")
    assert.ok(d.providers.some((p) => p.name === "kimi"), "selectModel 保留 B 新增")
    assert.equal(d.activeProvider, "deepseek")
    assert.equal(d.activeModel, "deepseek-v4-pro")
    assert.equal(agent.activeProvider, "deepseek")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("T-F5b wizard finishWizard：磁盘 fresh raw 上 upsert——既有磁盘 provider（对端改动）保留", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-f5b-wiz-"))
  const cfg = join(dir, "config.json")
  const agent = { providers: [], activeProvider: "", activeModel: null, provider: {}, config: { agent: { compactThresholdAuto: false } } }
  const state = { wizard: null, input: [], cursor: 0 }
  const ctx = {
    agent, state,
    pushLine: () => {}, pushLabel: () => {}, render: () => {},
    persistRaw: realDiskPersist(cfg),
    openModelPicker: async () => {},
  }
  // 磁盘已存在 provider（B 场景——wizard 复跑不因内存空快照抹掉它）
  writeFileSync(cfg, JSON.stringify({ providers: [{ name: "deepseek", baseURL: "https://api.deepseek.com", model: "deepseek-chat", apiKey: "sk-new" }] }, null, 2) + "\n")
  const w = createWizard(ctx)
  const submit = (text) => { state.input = [...text]; w.wizardSubmitText() }
  try {
    w.startWizard()
    w.wizardChooseProvider({ kind: "custom" })
    submit("my-wiz")
    submit("https://api.wiz.example.com/v1")
    submit("wiz-model")
    submit("") // format 默认 openai
    submit("sk-wiz")
    submit("") // embedkey 跳过 → finish
    const d = disk(cfg)
    assert.ok(d.providers.some((p) => p.name === "my-wiz"), "wizard 新 provider 落盘")
    assert.equal(d.providers.find((p) => p.name === "deepseek").apiKey, "sk-new", "既有磁盘 provider 改动保留（不再整节写回内存空快照）")
    assert.equal(d.activeProvider, "my-wiz")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

// ====================================================================
// T-F5e —— cmd-mcp removeServer 专属（评审修正 #1）
// ====================================================================

test("T-F5e cmd-mcp remove：内存 mcp.servers 旧 + 磁盘新 → 只删目标条目，磁盘其他 server 改动保留", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-f5e-"))
  const cfg = join(dir, "config.json")
  // 内存 = 启动快照 [x(旧 token), y]；磁盘 = B 改过 x 的 token + 新增 z
  const agent = {
    config: { mcp: { servers: [{ name: "x", url: "http://x/mcp", token: "tok-old" }, { name: "y", url: "http://y/mcp" }] } },
    tools: [],
  }
  writeFileSync(cfg, JSON.stringify({
    mcp: { servers: [
      { name: "x", url: "http://x/mcp", token: "tok-new" }, // B 改了 x
      { name: "y", url: "http://y/mcp" },
      { name: "z", url: "http://z/mcp" }, // B 新增 z
    ] },
  }, null, 2) + "\n")
  const lines = []
  const ctx = { agent, pushLine: (l) => lines.push(l), pushLabel: () => {}, persistRaw: realDiskPersist(cfg) }
  try {
    await handleMcpCommand(ctx, ["remove", "x"])
    assert.ok(lines.some((l) => l.includes("x removed")), "remove 成功提示")
    const servers = disk(cfg).mcp.servers
    assert.deepEqual(servers.map((s) => s.name), ["y", "z"], "磁盘 = y + B 新增的 z（x 已删；不再整节写回内存快照）")
    assert.deepEqual(agent.config.mcp.servers.map((s) => s.name), ["y"], "内存已删 x")
    assert.ok(!agent.tools.some((t) => t._mcpName === "x"), "连接工具已摘除")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

// ====================================================================
// T-F5d —— setup-wizard 走 writeConfigAtomic 收口（HOME 隔离子进程端到端）
// ====================================================================

test("T-F5d setup-wizard：首配经 writeConfigAtomic 落盘（HOME 隔离——不碰真实 ~/.thincoder）", () => {
  const home = mkdtempSync(join(tmpdir(), "thincoder-f5wiz-"))
  const script = `
import { readFileSync, existsSync } from "node:fs"
const { homedir } = await import("node:os")
const { setupWizard } = await import("./src/cli/setup-wizard.mjs")
const r = await setupWizard()
if (!r || r.name !== "deepseek") throw new Error("wizard failed: " + JSON.stringify(r))
const cfg = homedir() + "/.thincoder/config.json"
if (!existsSync(cfg)) throw new Error("config not written")
const raw = JSON.parse(readFileSync(cfg, "utf8"))
if (raw.activeProvider !== "deepseek" || raw.providers[0].apiKey !== "sk-zz") throw new Error("content mismatch: " + JSON.stringify(raw))
console.log("setup-wizard flow OK")
`
  try {
    const out = execFileSync(process.execPath, ["--input-type=module", "-e", script], {
      cwd: PROJECT_ROOT,
      env: { ...process.env, USERPROFILE: home, HOME: home },
      input: "1\nsk-zz\n\n", // preset #1（deepseek）→ key → embedkey 跳过
      encoding: "utf8",
    })
    assert.match(out, /setup-wizard flow OK/)
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})
