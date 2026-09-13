/**
 * settings-tool.test.mjs — SETTINGS-TOOL 第 8 批（null 默认值键形状约束——2026-09-11）VS Code 面
 * + 第 12 批（同族键 `agent.subagentModels` 第 4 条——2026-09-11）。
 * 用例 T-S2.30–T-S2.37（8 例）：本端 null 叶子（`agent.subagentModel` / `agent.compactThreshold`）
 * + 跨端 3 键（`defaultModel` / `shell` / `memory.team`——住在共享 config.json，由 CLI 读侧消费）
 * + 同族 1 键（`agent.subagentModels` roleMap——本端读侧消费）+ 防漂移锁 + 描述句逐字（N-S1.4）。
 * 测试缝：`config-io.mjs _setConfigPathForTest`（本端读写同缝——无需双缝）+ `_` 形状表/校验器导出。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { AGENT_DEFAULTS, TRACES_DEFAULTS, _setConfigPathForTest } from "../src/config-io.mjs"
import {
  settingsTool, _buildShapeTable, _nullLeafPaths, _NULL_LEAF_SHAPES, _SIBLING_SHAPES, _checkShapeCompleteness,
} from "../src/agent-tools/settings.mjs"

async function withCfg(content, fn) {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-vsc-settings-tool-"))
  const p = join(dir, "config.json")
  writeFileSync(p, JSON.stringify(content, null, 2) + "\n", "utf8")
  _setConfigPathForTest(p)
  try {
    return await fn(p)
  } finally {
    _setConfigPathForTest(null)
    rmSync(dir, { recursive: true, force: true })
  }
}

const readText = (p) => readFileSync(p, "utf8")
const diskOf = (p) => JSON.parse(readText(p))

async function trySet(key, value, ctx) {
  try {
    return { ok: true, message: await settingsTool.execute({ action: "set", key, value }, ctx) }
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

test("T-S2.31 本端 null 叶子（边界）：agent.compactThreshold number ∪ null 接受；字符串/对象拒绝", async () => {
  await withCfg({}, async (p) => {
    const ctx = { agent: { config: {} } }
    const ok = await trySet("agent.compactThreshold", "100000", ctx)
    assert.equal(ok.ok, true, ok.message)
    assert.equal(diskOf(p).agent.compactThreshold, 100000)
    const nul = await trySet("agent.compactThreshold", "null", ctx)
    assert.equal(nul.ok, true, nul.message)
    assert.equal(diskOf(p).agent.compactThreshold, null, "null = auto（显式清除态）")
    const before = readText(p)
    for (const v of ['"100000"', "{}"]) { // '"100000"' → 解析为字符串（VSC parseValue 返回解析值）
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

test("T-S2.33 防漂移（N-S1.5）：本端 null 叶子锁（2 键）+ 跨端/同族 4 键存在性 + 未声明键捕获", () => {
  assert.deepEqual(Object.keys(_NULL_LEAF_SHAPES).sort(), _nullLeafPaths({ agent: AGENT_DEFAULTS }).sort(), "本端 null 叶子键集 == _NULL_LEAF_SHAPES 键集")
  for (const k of ["defaultModel", "shell", "memory.team", "agent.subagentModels"]) assert.ok(k in _SIBLING_SHAPES, `${k} ∈ _SIBLING_SHAPES（存在性断言——不参与集合相等）`)
  assert.equal(Object.keys(_SIBLING_SHAPES).length, 4, "跨端 3 + 同族 1 = 4 条（第 12 批第 4 条；与 TOOLS 档计数一致）")
  const warns = []
  const missing = _checkShapeCompleteness({ agent: { compactThreshold: null, freshKey: null } }, (m) => warns.push(m))
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
  const root = { agent: AGENT_DEFAULTS, traces: TRACES_DEFAULTS } // 与类型表同根（键空间 = 工具寻址路径）
  const derived = _buildShapeTable(root)
  for (const [k, v] of Object.entries(oldBuildTypeMap(root))) {
    if (v === "object") continue // null 叶子（派生规则未变——其约束由形状表接管）
    assert.equal(derived[k], v, `${k} 派生结果与旧实现逐键相等`)
  }
  assert.equal(derived["agent.maxTurns"], "number")
  assert.equal(derived["traces.enabled"], "boolean")
  assert.equal(derived["agent.consultModels"], "array")
  // 键空间归一（裸名 → `agent.*` 全路径——本批，CLI parity）后：非 null 叶子类型校验在 VSC 实际生效
  await withCfg({}, async (p) => {
    const ctx = { agent: { config: {} } }
    const bad = await trySet("agent.maxTurns", "abc", ctx)
    assert.equal(bad.ok, false, "非 null 叶子类型不符 → 拒（归一后生效）")
    assert.match(bad.message, /expects number/)
    const good = await trySet("agent.maxTurns", "200", ctx)
    assert.equal(good.ok, true, good.message)
    assert.equal(diskOf(p).agent.maxTurns, 200)
  })
})

test("T-S2.35 文案：工具 description 逐字断言（§8.6 VSC 新句——整句出现）", () => {
  const NEW_SENTENCE = "Known keys are type-checked: scalar keys against the built-in defaults (agent.maxTurns a number, traces.enabled a boolean); keys whose default is null (or that live only in the shared config.json) against their real consumption shape — defaultModel \"provider:model\", agent.subagentModel / shell non-empty string, agent.compactThreshold a number, memory.team object with a repo — so a value the app would silently drop is refused (null clears the key). Unknown keys under a known section are stored as given. Values parse as JSON first (true/false/numbers/objects/arrays), else stay strings."
  assert.ok(settingsTool.description.includes(NEW_SENTENCE), "新句整句逐字出现")
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
    // 消费面探针（表驱动）：接受集 == 读侧可消费集（`subagent.mjs` effectiveSubagentModel）
    const { effectiveSubagentModel } = await import("../src/agent-tools/subagent.mjs")
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
