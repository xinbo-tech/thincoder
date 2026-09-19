/**
 * settings-tool.test.mjs — SETTINGS-TOOL 第 8 批（null 默认值键形状约束——2026-09-11）VS Code 面
 * + 第 12 批（同族键 `agent.subagentModels`——2026-09-11）。
 * W16（2026-09-15）：settings 工具 = **核单源工厂**（`@thincoder/core/agent-tools/settings.mjs`
 * `settingsTool(opts)`——#87/A5 已裁「以 CLI 为准」：类型表由核全量 DEFAULTS 派生）；本档改判
 * 逐例：核形状表四键（`defaultModel` / `agent.subagentModel` / `shell` / `memory.team`）+
 * 同族一键（`agent.subagentModels`）+ 派生表逐键对拍 + 描述句（核逐字）。
 * 测试缝（双缝并用）：写侧 = `settingsTool({ configPath })`；读侧 = `_setConfigPathForTest`——
 * 同一临时文件（CLI 先例 `thincoder-cli/test/settings.test.mjs`）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { settingsTool, _buildShapeTable, _nullLeafPaths, _NULL_LEAF_SHAPES, _SIBLING_SHAPES, _checkShapeCompleteness } from "@thincoder/core/agent-tools/settings.mjs"
import { DEFAULTS, _setConfigPathForTest } from "@thincoder/core/config.mjs"
// #45 参数腿：端侧包装（`setup.mjs` `vscSettingsFace`）——execute 返回后置位 `_settingsTouched`
import { vscSettingsFace } from "../src/agent/setup.mjs"

/** 当前沙箱 config 路径（写侧工具实例化用——双缝同指）。 */
let _cfgPath = null
/** 写侧：核工厂实例（configPath = 当前沙箱——不触真实用户配置）。 */
const tool = () => settingsTool({ configPath: _cfgPath })

async function withCfg(content, fn) {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-vsc-settings-tool-"))
  const p = join(dir, "config.json")
  writeFileSync(p, JSON.stringify(content, null, 2) + "\n", "utf8")
  _setConfigPathForTest(p)
  _cfgPath = p
  try {
    return await fn(p)
  } finally {
    _setConfigPathForTest(null)
    _cfgPath = null
    rmSync(dir, { recursive: true, force: true })
  }
}

const readText = (p) => readFileSync(p, "utf8")
const diskOf = (p) => JSON.parse(readText(p))

async function trySet(key, value, ctx) {
  try {
    return { ok: true, message: await tool().execute({ action: "set", key, value }, ctx) }
  } catch (e) {
    return { ok: false, message: e.message }
  }
}

test("T-S2.30 本端 null 叶子：set agent.subagentModel 非空串接受；对象/空串拒绝", async () => {
  await withCfg({}, async (p) => {
    const ctx = { agent: { config: {} } }
    const ok = await trySet("agent.subagentModel", "kimi:k3", ctx)
    assert.equal(ok.ok, true, ok.message)
    assert.match(ok.message, /persisted \+ hot-applied/)
    assert.equal(diskOf(p).agent.subagentModel, "kimi:k3", "共享 config.json 落盘")
    const before = readText(p)
    for (const v of ["{}", ""]) {
      const r = await trySet("agent.subagentModel", v, ctx)
      assert.equal(r.ok, false, `${JSON.stringify(v)} 应拒绝`)
      assert.match(r.message, /expects non-empty string/)
    }
    assert.equal(readText(p), before, "拒绝 → 磁盘零变化")
  })
})

test("T-S2.31 派生表 number 叶子：agent.compactThreshold number 接受；字符串/对象/null 拒绝（W16 改判）", async () => {
  await withCfg({}, async (p) => {
    const ctx = { agent: { config: {} } }
    const ok = await trySet("agent.compactThreshold", "100000", ctx)
    assert.equal(ok.ok, true, ok.message)
    assert.equal(diskOf(p).agent.compactThreshold, 100000)
    const before = readText(p)
    // W16 改判：核 DEFAULTS.agent.compactThreshold = 100000（number 叶子——非 null 形状表），
    // 故 `null` 现按类型拒（原 VSC 窄表把该键列为 null 叶子收 null=auto——A4/A5 已裁「以 CLI
    // 为准（全量类型表）」；VSC 面板清空路径 = undefined 删键，不经该值）。
    for (const v of ['"100000"', "{}", "null"]) {
      const r = await trySet("agent.compactThreshold", v, ctx)
      assert.equal(r.ok, false, `${v} 应拒绝`)
      assert.match(r.message, /expects number/)
    }
    assert.equal(readText(p), before, "拒绝 → 磁盘零变化")
  })
})

test("T-S2.32 跨端三键：不可消费形态拒绝（未落地前零条目 = 全收）；合法形态接受", async () => {
  await withCfg({}, async (p) => {
    const ctx = { agent: { config: {} } }
    const before = readText(p)
    const rejects = [
      ["defaultModel", "{}"], // 对象 → CLI 读侧静默置 null
      ["defaultModel", "bogus"], // 无冒号——provider:model 形态面（评审修正轮补）
      ["shell", "{}"],
      ["memory.team", "abc"], // CLI 读侧 !team?.repo → 团队层静默关
    ]
    for (const [key, v] of rejects) {
      const r = await trySet(key, v, ctx)
      assert.equal(r.ok, false, `${key} ${v} 应拒绝`)
      assert.match(r.message, /expects /)
    }
    assert.equal(readText(p), before, "拒绝 → 共享 config.json 零变化")
    for (const [key, v] of [["defaultModel", "probe:m1"], ["shell", "pwsh"], ["memory.team", '{"repo":"r"}']]) {
      const r = await trySet(key, v, ctx)
      assert.equal(r.ok, true, `${key} ${v}: ${r.message}`)
    }
    const disk = diskOf(p)
    assert.equal(disk.defaultModel, "probe:m1")
    assert.equal(disk.shell, "pwsh")
    assert.equal(disk.memory.team.repo, "r")
  })
})

test("T-S2.33 防漂移（N-S1.5）：核 null 叶子锁（4 键）+ 同族 1 键存在性 + 未声明键捕获", () => {
  assert.deepEqual(Object.keys(_NULL_LEAF_SHAPES).sort(), _nullLeafPaths(DEFAULTS).sort(), "核 null 叶子键集 == _NULL_LEAF_SHAPES 键集（相等面）")
  for (const k of ["defaultModel", "agent.subagentModel", "shell", "memory.team"]) assert.ok(k in _NULL_LEAF_SHAPES, `${k} ∈ _NULL_LEAF_SHAPES（W16：跨端三键与本端键同居核表）`)
  for (const k of ["agent.subagentModels"]) assert.ok(k in _SIBLING_SHAPES, `${k} ∈ _SIBLING_SHAPES（存在性断言——不参与集合相等）`)
  assert.equal(Object.keys(_SIBLING_SHAPES).length, 1, "同族 1 条（与核 TOOLS 档计数一致）")
  const warns = []
  const missing = _checkShapeCompleteness({ agent: { freshKey: null } }, (m) => warns.push(m))
  assert.deepEqual(missing, ["agent.freshKey"], "未声明 null 叶子被捕获")
  assert.equal(warns.length, 1, "一次性警告")
  assert.match(warns[0], /agent\.freshKey/, "警告列出键名")
})

test("T-S2.34 防漂移：派生表非 null 叶子逐键对拍旧实现（agent.maxTurns→number 等）", async () => {
  const oldBuildTypeMap = (obj, prefix = "", out = {}) => { // 旧实现（逐字复刻——对拍基准）
    for (const [k, v] of Object.entries(obj)) {
      const p = prefix ? `${prefix}.${k}` : k
      if (v !== null && typeof v === "object" && !Array.isArray(v)) oldBuildTypeMap(v, p, out)
      else out[p] = Array.isArray(v) ? "array" : typeof v
    }
    return out
  }
  const derived = _buildShapeTable(DEFAULTS) // 派生根 = 核全量 DEFAULTS（工具寻址路径）
  for (const [k, v] of Object.entries(oldBuildTypeMap(DEFAULTS))) {
    if (v === "object") continue // null 叶子（派生规则未变——其约束由形状表接管）
    assert.equal(derived[k], v, `${k} 派生结果与旧实现逐键相等`)
  }
  assert.equal(derived["agent.maxTurns"], "number")
  assert.equal(derived["traces.enabled"], "boolean")
  assert.equal(derived["agent.consultModels"], "array")
  // 非 null 叶子类型校验实际生效（核全量域路径归一）
  await withCfg({}, async (p) => {
    const ctx = { agent: { config: {} } }
    const bad = await trySet("agent.maxTurns", "abc", ctx)
    assert.equal(bad.ok, false, "非 null 叶子类型不符 → 拒")
    assert.match(bad.message, /expects number/)
    const good = await trySet("agent.maxTurns", "200", ctx)
    assert.equal(good.ok, true, good.message)
    assert.equal(diskOf(p).agent.maxTurns, 200)
  })
})

test("T-S2.35 文案：核工具 description 逐字断言（W16 收正——以 CLI 为准；原 VSC 括注句退场）", () => {
  const NEW_SENTENCE = "Known keys are type-checked: scalar keys against the built-in defaults (agent.maxTurns a number, traces.enabled a boolean); keys whose default is null against their real consumption shape — defaultModel \"provider:model\", agent.subagentModel / shell non-empty string, memory.team object with a repo — so a value the app would silently drop is refused (null clears the key). Unknown keys under a known section are stored as given. Values parse as JSON first (true/false/numbers/objects/arrays), else stay strings."
  assert.ok(settingsTool({ configPath: "x" }).description.includes(NEW_SENTENCE), "核句整句逐字出现")
})

test("T-S2.36 同族键（角色映射）：roleMap 接受落盘；字符串 / 数组 / 含空串值拒绝（磁盘零变化）", async () => {
  await withCfg({}, async (p) => {
    const ctx = { agent: { config: {} } }
    const ok = await trySet("agent.subagentModels", '{"coder":"x:m1","explore":"y"}', ctx)
    assert.equal(ok.ok, true, ok.message)
    assert.match(ok.message, /persisted \+ hot-applied/)
    assert.deepEqual(diskOf(p).agent.subagentModels, { coder: "x:m1", explore: "y" }, "共享 config.json 落盘")
    const before = readText(p)
    for (const v of ['"coder"', "[]", '{"coder":""}', '{"coder":5}']) {
      const r = await trySet("agent.subagentModels", v, ctx)
      assert.equal(r.ok, false, `${v} 应拒绝`)
      assert.match(r.message, /expects object of role→non-empty string/, "拒例带期望形态（F-S1.8 可操作原因）")
    }
    assert.equal(readText(p), before, "拒绝 → 磁盘零变化")
  })
})

test("T-S2.37 同族键（边界）：null 显式清除 / {} 清除态接受 / 消费面 effectiveSubagentModel 命中", async () => {
  await withCfg({ agent: { subagentModels: { coder: "x:m1" } } }, async (p) => {
    const ctx = { agent: { config: {} } }
    const nul = await trySet("agent.subagentModels", "null", ctx)
    assert.equal(nul.ok, true, nul.message)
    assert.equal(diskOf(p).agent.subagentModels, null, "null = 显式清除（回未设置）")
    const empty = await trySet("agent.subagentModels", "{}", ctx)
    assert.equal(empty.ok, true, empty.message)
    assert.deepEqual(diskOf(p).agent.subagentModels, {}, "{} = 有效清除态（非对象拒绝的反面——空对象接受）")
    // 消费面探针（表驱动）：接受集 == 读侧可消费集（W13：核单源 `subagent-spawn.mjs` effectiveSubagentModel）
    const { effectiveSubagentModel } = await import("@thincoder/core/agent-tools/subagent-spawn.mjs")
    for (const [value, role, want] of [
      [{ coder: "x:m1" }, "coder", "x:m1"],
      [{}, "coder", null],
    ]) {
      const parent = { config: { agent: { subagentModels: value, subagentModel: null } } }
      assert.equal(effectiveSubagentModel(parent, role, undefined), want, `${JSON.stringify(value)} → 可消费结果`)
    }
    await trySet("agent.subagentModels", '{"coder":"x:m1"}', ctx)
    const parent = { config: { agent: { subagentModels: diskOf(p).agent.subagentModels, subagentModel: null } } }
    assert.equal(effectiveSubagentModel(parent, "coder", undefined), "x:m1", "落盘值读侧命中（写了即生效）")
  })
})

// ─── #45 参数腿（WEBVIEW-PROTOCOL.md §3.3 判据② · AC-E）：端包裹位（工具驱动参数变更联动 UI）───

test("T-S2.38 端包裹（#45）：execute 返回 ⇒ 置位 `_settingsTouched`；抛错 ⇒ 不置位", async () => {
  await withCfg({}, async () => {
    const wrapped = vscSettingsFace(tool())
    const agent = { config: {} }
    const ctx = { agent }
    const out = await wrapped.execute({ action: "set", key: "agent.maxTurns", value: "150" }, ctx)
    assert.match(out, /persisted \+ hot-applied/)
    assert.equal(agent._settingsTouched, true, "execute 返回后置位（同步点读后复位）")
    // 读侧 action 同样置位——置位不做「成功」判定（语义 = 该批动过 settings 面；重推幂等）
    agent._settingsTouched = false
    const read = await wrapped.execute({ action: "list" }, ctx)
    assert.ok(read.length > 0)
    assert.equal(agent._settingsTouched, true, "读侧同置位")
    // 抛错路径：execute 未返回 ⇒ 不置位
    agent._settingsTouched = false
    await assert.rejects(() => wrapped.execute({ action: "bogus" }, ctx))
    assert.equal(agent._settingsTouched, false, "抛错 ⇒ 不置位")
    // 无 agent 的 ctx：核侧既有护栏照旧抛（端包裹不吞错、不另爆包装层）
    await assert.rejects(() => wrapped.execute({ action: "list" }, {}), /no live agent config/)
  })
})
