/**
 * settings.test.mjs — SETTINGS-TOOL 第 8 批（null 默认值键形状约束——2026-09-11）CLI 面回归网。
 * 用例：T-S2.1–T-S2.24 + T-S2.17b（25 例——设计档 §5.1）：形状接受/拒绝 + 无静默表驱动（真读取器）
 * + 防漂移锁 + 既有工具面回归（list/get/set/未知键/类型拒绝/遮罩/D-F5b/描述句）；
 * 第 13 批（2026-09-11）追加 T-S3.1–T-S3.3（3 例——设计档 §9.5；parseValue 两端统一 ① 去引号）。
 * 测试缝（双缝并用——§5.1）：写侧 = `settingsTool({ configPath })`；读侧 = config.mjs
 * `_setConfigPathForTest`——两缝必须指向同一临时文件，否则读写落到真实用户配置。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { DEFAULTS, loadConfig, _setConfigPathForTest, _resetConfigPathForTest } from "../src/config.mjs"
import { parseModelRef } from "@thincoder/core/model-ref.mjs"
import { effectiveSubagentModel } from "../src/agent-tools/subagent-spawn.mjs"
import { teamConfig } from "../src/cli/make-agent.mjs"
import {
  settingsTool, _buildShapeTable, _nullLeafPaths, _NULL_LEAF_SHAPES, _SIBLING_SHAPES, _checkShapeCompleteness,
} from "../src/agent-tools/settings.mjs"

function tmpCfg(content = {}) {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-settings-"))
  const p = join(dir, "config.json")
  writeFileSync(p, JSON.stringify(content, null, 2) + "\n", "utf8")
  return { dir, p }
}

/** 双缝并用：写侧 settingsTool({ configPath }) + 读侧 _setConfigPathForTest——同一临时文件。 */
async function withCfg(content, fn) {
  const t = tmpCfg(content)
  _setConfigPathForTest(t.p)
  try { return await fn(t) } finally { _resetConfigPathForTest(); rmSync(t.dir, { recursive: true, force: true }) }
}

const ctxOf = (config = {}) => ({ agent: { config } })
const readText = (t) => readFileSync(t.p, "utf8")
const diskOf = (t) => JSON.parse(readText(t))

/** set 驱动（返回 { ok, message }——成功取回显，失败取错误文本）。 */
async function set(t, key, value, ctx) {
  try {
    return { ok: true, message: await settingsTool({ configPath: t.p }).execute({ action: "set", key, value }, ctx) }
  } catch (e) {
    return { ok: false, message: e.message }
  }
}

/** 直写夹具（表驱动 T-S2.13 用——绕过工具，供真读取器消费）。 */
function setPath(obj, path, value) {
  const segs = path.split(".")
  let cur = obj
  for (const s of segs.slice(0, -1)) {
    if (cur[s] === null || typeof cur[s] !== "object") cur[s] = {}
    cur = cur[s]
  }
  cur[segs[segs.length - 1]] = value
}

/* ─── 接受面（T-S2.1–T-S2.5 · T-S2.12） ─── */

test("T-S2.1 接受：set defaultModel 复合串——磁盘 ∧ 热应用 ∧ loadConfig 读回同串", async () => {
  await withCfg({}, async (t) => {
    const ctx = ctxOf({})
    const r = await set(t, "defaultModel", "deepseek:deepseek-flash", ctx)
    assert.equal(r.ok, true, r.message)
    assert.match(r.message, /persisted \+ hot-applied/)
    assert.equal(ctx.agent.config.defaultModel, "deepseek:deepseek-flash", "内存 hot-apply")
    assert.equal(diskOf(t).defaultModel, "deepseek:deepseek-flash", "磁盘写入")
    assert.equal(loadConfig().defaultModel, "deepseek:deepseek-flash", "读取侧读回同串（F-S1.7）")
  })
})

test("T-S2.2 接受：set shell 非空串——磁盘 ∧ 内存 config.shell", async () => {
  await withCfg({}, async (t) => {
    const ctx = ctxOf({})
    const r = await set(t, "shell", "pwsh", ctx)
    assert.equal(r.ok, true, r.message)
    assert.equal(ctx.agent.config.shell, "pwsh")
    assert.equal(diskOf(t).shell, "pwsh")
    assert.equal(loadConfig().shell, "pwsh")
  })
})

test("T-S2.3 接受：set agent.subagentModel 非空串——effectiveSubagentModel 返回该串", async () => {
  await withCfg({}, async (t) => {
    const ctx = ctxOf({})
    const r = await set(t, "agent.subagentModel", "kimi:k3", ctx)
    assert.equal(r.ok, true, r.message)
    assert.equal(effectiveSubagentModel({ config: ctx.agent.config }, "explore"), "kimi:k3")
    assert.equal(effectiveSubagentModel({ config: loadConfig() }, "explore"), "kimi:k3", "重启后（读盘）同串")
  })
})

test("T-S2.4 接受：set memory.team 含非空 repo 对象——读取器条件不成立", async () => {
  await withCfg({}, async (t) => {
    const ctx = ctxOf({})
    const r = await set(t, "memory.team", '{"repo":"git@x:y.git"}', ctx)
    assert.equal(r.ok, true, r.message)
    const team = teamConfig(loadConfig())
    assert.ok(team, "make-agent.mjs:150 `!team?.repo → null` 不成立")
    assert.equal(team.repo, "git@x:y.git")
    assert.equal(team.name, "default")
  })
})

test("T-S2.5 接受（边界）：四键 + agent.subagentModels 各 set null——显式清除态（读取侧回未设置）", async () => {
  await withCfg({}, async (t) => {
    const ctx = ctxOf({})
    for (const key of ["defaultModel", "agent.subagentModel", "shell", "memory.team", "agent.subagentModels"]) {
      const r = await set(t, key, "null", ctx)
      assert.equal(r.ok, true, `${key}: ${r.message}`)
    }
    const c = loadConfig()
    assert.equal(c.defaultModel, null)
    assert.equal(c.agent.subagentModel, null)
    assert.equal(c.shell, null)
    assert.equal(c.memory.team, null)
    assert.equal(c.agent.subagentModels, null)
    assert.equal(effectiveSubagentModel({ config: c }, "explore"), null, "读取侧未设置态")
    assert.equal(teamConfig(c), null, "团队层未配置态")
  })
})

test("T-S2.12 接受（W3 正控）：set agent.subagentModels 角色映射——effectiveSubagentModel 命中", async () => {
  await withCfg({}, async (t) => {
    const ctx = ctxOf({})
    const r = await set(t, "agent.subagentModels", '{"coder":"x"}', ctx)
    assert.equal(r.ok, true, r.message)
    assert.equal(effectiveSubagentModel({ config: ctx.agent.config }, "coder"), "x")
    assert.deepEqual(diskOf(t).agent.subagentModels, { coder: "x" })
  })
})

/* ─── 拒绝面（T-S2.6–T-S2.11） ─── */

const ZERO_CHANGE = (t, ctx, before, mem) => {
  assert.equal(readText(t), before, "磁盘零变化")
  assert.equal(JSON.stringify(ctx.agent.config), mem, "内存零变化")
}

test("T-S2.6 拒绝：set defaultModel 对象——抛错 ∧ 磁盘/内存零变化", async () => {
  await withCfg({}, async (t) => {
    const ctx = ctxOf({})
    const before = readText(t), mem = JSON.stringify(ctx.agent.config)
    const r = await set(t, "defaultModel", '{"a":1}', ctx)
    assert.equal(r.ok, false)
    assert.match(r.message, /expects non-empty string \("provider:model" composite\)/)
    ZERO_CHANGE(t, ctx, before, mem)
  })
})

test("T-S2.7 拒绝（边界）：defaultModel 空串 / 无冒号 / 尾段空——三种均抛错 ∧ 零变化", async () => {
  await withCfg({}, async (t) => {
    const ctx = ctxOf({})
    const before = readText(t), mem = JSON.stringify(ctx.agent.config)
    for (const v of ["", "bogus", "a:"]) {
      const r = await set(t, "defaultModel", v, ctx)
      assert.equal(r.ok, false, `${JSON.stringify(v)} 应拒绝`)
      assert.match(r.message, /expects non-empty string \("provider:model" composite\)/)
    }
    ZERO_CHANGE(t, ctx, before, mem)
  })
})

test("T-S2.8 拒绝：set shell 对象 / 空串——抛错 ∧ 零变化", async () => {
  await withCfg({}, async (t) => {
    const ctx = ctxOf({})
    const before = readText(t), mem = JSON.stringify(ctx.agent.config)
    for (const v of ["{}", ""]) {
      const r = await set(t, "shell", v, ctx)
      assert.equal(r.ok, false, `${JSON.stringify(v)} 应拒绝`)
      assert.match(r.message, /expects non-empty string/)
    }
    ZERO_CHANGE(t, ctx, before, mem)
  })
})

test("T-S2.9 拒绝：set agent.subagentModel 对象 / 空串 / 数组——抛错 ∧ 零变化", async () => {
  await withCfg({}, async (t) => {
    const ctx = ctxOf({})
    const before = readText(t), mem = JSON.stringify(ctx.agent.config)
    for (const v of ["{}", "", "[1,2]"]) {
      const r = await set(t, "agent.subagentModel", v, ctx)
      assert.equal(r.ok, false, `${JSON.stringify(v)} 应拒绝（原会在 spawn 期 TypeError / 静默回落）`)
      assert.match(r.message, /expects non-empty string/)
    }
    ZERO_CHANGE(t, ctx, before, mem)
  })
})

test("T-S2.10 拒绝：set memory.team 字符串——抛错（期望对象形态）", async () => {
  await withCfg({}, async (t) => {
    const ctx = ctxOf({})
    const before = readText(t), mem = JSON.stringify(ctx.agent.config)
    const r = await set(t, "memory.team", "abc", ctx)
    assert.equal(r.ok, false)
    assert.match(r.message, /expects object \{ repo: string, name\?, dir\? \}/)
    ZERO_CHANGE(t, ctx, before, mem)
  })
})

test("T-S2.11 拒绝（边界）：memory.team 缺 repo / repo 空串——抛错（requires a non-empty \"repo\"）", async () => {
  await withCfg({}, async (t) => {
    const ctx = ctxOf({})
    const before = readText(t), mem = JSON.stringify(ctx.agent.config)
    for (const v of ["{}", '{"name":"x"}', '{"repo":""}']) {
      const r = await set(t, "memory.team", v, ctx)
      assert.equal(r.ok, false, `${v} 应拒绝`)
      assert.match(r.message, /requires a non-empty "repo" \(team layer stays off without it\)/)
    }
    ZERO_CHANGE(t, ctx, before, mem)
  })
})

/* ─── 无静默（T-S2.13——表驱动集合相等） ─── */

test("T-S2.13 无静默（F-S1.8）：接受集 == 应用侧可消费集 ∧ 拒绝集 == 不可消费集（真读取器）", async () => {
  // 逐键消费判据——取自应用侧读取器本体（SETTINGS-TOOL.md §8.5）；defaultModel 串另经
  // thincoder-core/model-ref.mjs:25-36 形态面（夹具 provider `probe` 避开存在性层 :38-43——D-S2.5）。
  const CONSUMES = {
    defaultModel: (c, v) => typeof v === "string" && v.trim() !== "" && c.defaultModel === v && parseModelRef(v, c.providers).ok,
    "agent.subagentModel": (c, v) => {
      const m = effectiveSubagentModel({ config: c }, "explore")
      return typeof v === "string" && v.trim() !== "" && m === v
    },
    shell: (c, v) => typeof v === "string" && v.trim() !== "" && c.shell === v,
    "memory.team": (c, v) => {
      const tc = teamConfig(c)
      return Boolean(v) && typeof v === "object" && !Array.isArray(v) && typeof v.repo === "string" && v.repo.trim() !== "" && tc?.repo === v.repo
    },
    "agent.subagentModels": (c, v) => {
      const m = effectiveSubagentModel({ config: c }, "coder")
      return Boolean(v) && typeof v === "object" && !Array.isArray(v)
        && Object.values(v).every((x) => typeof x === "string" && x.trim() !== "") && m === v.coder
    },
  }
  const rows = [
    { key: "defaultModel", raw: "probe:m1", value: "probe:m1" },
    { key: "defaultModel", raw: '{"a":1}', value: { a: 1 } },
    { key: "defaultModel", raw: "bogus", value: "bogus" },
    { key: "defaultModel", raw: "", value: "" },
    { key: "agent.subagentModel", raw: "kimi:k3", value: "kimi:k3" },
    { key: "agent.subagentModel", raw: '{"a":1}', value: { a: 1 } },
    { key: "agent.subagentModel", raw: "", value: "" },
    { key: "shell", raw: "pwsh", value: "pwsh" },
    { key: "shell", raw: "", value: "" },
    { key: "shell", raw: '{"a":1}', value: { a: 1 } },
    { key: "memory.team", raw: '{"repo":"r:1"}', value: { repo: "r:1" } },
    { key: "memory.team", raw: "abc", value: "abc" },
    { key: "memory.team", raw: '{"repo":""}', value: { repo: "" } },
    { key: "agent.subagentModels", raw: '{"coder":"x"}', value: { coder: "x" } },
    { key: "agent.subagentModels", raw: "abc", value: "abc" }, // W3 行：字符串 → 拒（静默回落 subagentModel）
    { key: "agent.subagentModels", raw: '{"coder":""}', value: { coder: "" } },
  ]
  await withCfg({}, async (t) => {
    const fixture = () => ({ providers: [{ name: "probe", baseURL: "https://probe.invalid/v1", model: "m1" }] })
    for (const row of rows) {
      // ① 应用侧可消费性：直写配置文件（绕过工具）→ 真读取器判定
      const direct = fixture()
      setPath(direct, row.key, row.value)
      writeFileSync(t.p, JSON.stringify(direct, null, 2) + "\n", "utf8")
      const consumable = CONSUMES[row.key](loadConfig(), row.value)
      // ② 工具接受性：同一夹具起点（工具路径全链：校验 → 写盘 → 热应用）
      writeFileSync(t.p, JSON.stringify(fixture(), null, 2) + "\n", "utf8")
      const before = readText(t)
      const ctx = ctxOf({})
      const mem = JSON.stringify(ctx.agent.config)
      const r = await set(t, row.key, row.raw, ctx)
      assert.equal(r.ok, consumable, `<${row.key}> ${row.raw}: 工具接受 == 应用侧可消费（${r.message}）`)
      if (!r.ok) ZERO_CHANGE(t, ctx, before, mem)
    }
  })
})

/* ─── 防漂移（T-S2.14/T-S2.15） ─── */

test("T-S2.14 防漂移（N-S1.5）：完备性锁 + 同族存在性 + 夹具未声明键捕获 + 一次性警告", () => {
  assert.deepEqual(Object.keys(_NULL_LEAF_SHAPES).sort(), _nullLeafPaths(DEFAULTS).sort(), "null 叶子键集 == _NULL_LEAF_SHAPES 键集")
  assert.ok("agent.subagentModels" in _SIBLING_SHAPES, "同族键单列于 _SIBLING_SHAPES（存在性断言——不参与集合相等）")
  // 夹具注入新 null 叶子 → 未声明键被捕获 + 一次性警告列出键名
  const fixture = { agent: { subagentModel: null, freshKey: null } }
  assert.deepEqual(_nullLeafPaths(fixture), ["agent.subagentModel", "agent.freshKey"])
  const first = []
  assert.deepEqual(_checkShapeCompleteness(fixture, (m) => first.push(m)), ["agent.freshKey"], "未声明 null 叶子被捕获")
  const second = []
  _checkShapeCompleteness(fixture, (m) => second.push(m))
  assert.equal(first.length, 1, "一次性警告")
  assert.equal(second.length, 0, "第二次调用不重复警告")
  assert.match(first[0], /agent\.freshKey/, "警告列出键名")
  assert.deepEqual(_checkShapeCompleteness(DEFAULTS, () => {}), [], "真实 DEFAULTS 无未声明 null 叶子")
})

test("T-S2.15 防漂移（N-S1.5/F-S1.5）：派生表非 null 叶子逐键对拍旧实现 + 真实 DEFAULTS 抽样", () => {
  const oldBuildTypeMap = (obj, prefix = "", out = {}) => { // 旧实现（逐字复刻——对拍基准）
    for (const [k, v] of Object.entries(obj)) {
      const p = prefix ? `${prefix}.${k}` : k
      if (v !== null && typeof v === "object" && !Array.isArray(v)) oldBuildTypeMap(v, p, out)
      else out[p] = Array.isArray(v) ? "array" : typeof v
    }
    return out
  }
  const fixture = { agent: { maxTurns: 200, consultModels: [], nested: { flag: true } }, traces: { enabled: false }, maybeNull: null }
  const derived = _buildShapeTable(fixture)
  for (const [k, v] of Object.entries(oldBuildTypeMap(fixture))) {
    if (v === "object") continue // null 叶子（旧实现记 "object"）——其约束由形状表接管
    assert.equal(derived[k], v, `${k} 派生结果与旧实现逐键相等`)
  }
  const real = _buildShapeTable(DEFAULTS)
  assert.equal(real["agent.maxTurns"], "number")
  assert.equal(real["traces.enabled"], "boolean")
  assert.equal(real["agent.consultModels"], "array")
  assert.deepEqual(_buildShapeTable({ x: 1 }, { x: "patched" }), { x: "patched" }, "patch 覆盖缝")
})

/* ─── 回归网（T-S2.16–T-S2.23 + T-S2.17b） ─── */

test("T-S2.16 回归：list 全键展平 + 类型标注 + 敏感键遮罩", async () => {
  await withCfg({}, async (t) => {
    const ctx = ctxOf({ agent: { maxTurns: 200, customFlag: true }, providers: [{ name: "p", apiKey: "sk-secret" }] })
    const out = await settingsTool({ configPath: t.p }).execute({ action: "list" }, ctx)
    assert.deepEqual(out.split("\n"), [ // 全键展平集合（排序）+ 类型标注 + 敏感键值遮罩
      "agent.customFlag = true (boolean)",
      "agent.maxTurns = 200 (number)",
      "providers.0.apiKey = ••••（masked） (string)",
      "providers.0.name = p (string)",
    ])
    assert.ok(!out.includes("sk-secret"), "明文零出现")
  })
})

test("T-S2.17 回归：get 缺失键——报错 no such key + 就近提示（父键存在 / 顶层缺失两形态）", async () => {
  await withCfg({}, async (t) => {
    await assert.rejects(
      settingsTool({ configPath: t.p }).execute({ action: "get", key: "agent.nonexistent" }, ctxOf({ agent: {} })),
      (e) => /no such key "agent\.nonexistent"/.test(e.message) && /父键 agent 存在——无 nonexistent 子键/.test(e.message),
    )
    await assert.rejects(
      settingsTool({ configPath: t.p }).execute({ action: "get", key: "nonexistentKey" }, ctxOf({ agent: {} })),
      (e) => /no such key "nonexistentKey"/.test(e.message) && /config 顶层无此键——顶层可用键见 settings list/.test(e.message),
    )
  })
})

test("T-S2.17b 回归：get 成功态——回显 agent.maxTurns = <夹具值> (number)", async () => {
  await withCfg({}, async (t) => {
    const out = await settingsTool({ configPath: t.p }).execute({ action: "get", key: "agent.maxTurns" }, ctxOf({ agent: { maxTurns: 321 } }))
    assert.equal(out, "agent.maxTurns = 321 (number)")
  })
})

test("T-S2.18 回归：set agent.maxTurns 500——磁盘写入 + 内存热应用 + 非遮罩回显", async () => {
  await withCfg({}, async (t) => {
    const ctx = ctxOf({ agent: { maxTurns: 200 } })
    const r = await set(t, "agent.maxTurns", "500", ctx)
    assert.equal(r.ok, true, r.message)
    assert.match(r.message, /persisted \+ hot-applied/)
    assert.ok(!r.message.includes("masked"))
    assert.equal(ctx.agent.config.agent.maxTurns, 500)
    assert.equal(diskOf(t).agent.maxTurns, 500)
    assert.equal(loadConfig().agent.maxTurns, 500)
  })
})

test("T-S2.19 回归：set 未知键 agent.customFlag true——JSON 原样写入生效", async () => {
  await withCfg({}, async (t) => {
    const ctx = ctxOf({ agent: {} })
    const r = await set(t, "agent.customFlag", "true", ctx)
    assert.equal(r.ok, true, r.message)
    assert.equal(diskOf(t).agent.customFlag, true, "布尔原样（JSON.parse 路径）")
    assert.equal(ctx.agent.config.agent.customFlag, true)
  })
})

test("T-S2.20 回归：set agent.maxTurns \"abc\"——类型不符拒绝 ∧ 磁盘/内存不变", async () => {
  await withCfg({}, async (t) => {
    const ctx = ctxOf({ agent: { maxTurns: 200 } })
    const before = readText(t), mem = JSON.stringify(ctx.agent.config)
    const r = await set(t, "agent.maxTurns", "abc", ctx)
    assert.equal(r.ok, false)
    assert.match(r.message, /expects number/)
    ZERO_CHANGE(t, ctx, before, mem)
  })
})

test("T-S2.21 回归：set 敏感键 providers.0.apiKey——写入真实生效 ∧ 回显遮罩 ∧ 明文零出现", async () => {
  await withCfg({ providers: [{ name: "p" }] }, async (t) => {
    const ctx = ctxOf({ providers: [{}] })
    const r = await set(t, "providers.0.apiKey", "sk-xxx", ctx)
    assert.equal(r.ok, true, r.message)
    assert.match(r.message, /••••（masked）/)
    assert.ok(!r.message.includes("sk-xxx"), "明文零出现")
    assert.equal(diskOf(t).providers[0].apiKey, "sk-xxx", "写入真实生效")
  })
})

test("T-S2.22 回归：敏感键错误文案零明文（D-S2.4）——判据可见 + 值位遮罩", async () => {
  await withCfg({}, async (t) => {
    const ctx = ctxOf({})
    const before = readText(t), mem = JSON.stringify(ctx.agent.config)
    const r = await set(t, "websearch.apiKey", '{"k":"sk-SECRET"}', ctx)
    assert.equal(r.ok, false)
    assert.match(r.message, /expects string/, "判据全量可见")
    assert.match(r.message, /••••（masked）/, "值位遮罩")
    assert.ok(!r.message.includes("sk-SECRET"), "零明文")
    ZERO_CHANGE(t, ctx, before, mem)
  })
})

test("T-S2.23 回归（D-F5b）：写盘前对端改 mtime——放弃 + 抛冲突 ∧ 内存不热应用", async () => {
  await withCfg({}, async (t) => {
    const ctx = ctxOf({ agent: { maxTurns: 200 } })
    const mem = JSON.stringify(ctx.agent.config)
    const before = readText(t)
    // 对端改 mtime 的确定性模拟：writeConfigAtomic 的新鲜读与写前 stat 之间，mutate 窗口内
    // 一次 `args.key` 读取即推进 mtime（t0 ≠ t1 → 门控放弃）。
    let tick = 0
    const base = Math.floor(Date.now() / 1000)
    const args = {
      action: "set",
      get key() { tick += 1; utimesSync(t.p, base + tick, base + tick); return "agent.maxTurns" },
      value: "500",
    }
    await assert.rejects(settingsTool({ configPath: t.p }).execute(args, ctx), /config changed on disk concurrently/)
    assert.equal(JSON.stringify(ctx.agent.config), mem, "内存不热应用（零虚假成功）")
    assert.equal(readText(t), before, "磁盘未写入")
    assert.ok(!JSON.parse(readText(t)).agent, "被设键未落盘")
  })
})

test("T-S2.24 文案：工具 description 逐字断言（§8.6 CLI 新句——整句出现）", () => {
  const NEW_SENTENCE = "Known keys are type-checked: scalar keys against the built-in defaults (agent.maxTurns a number, traces.enabled a boolean); keys whose default is null against their real consumption shape — defaultModel \"provider:model\", agent.subagentModel / shell non-empty string, memory.team object with a repo — so a value the app would silently drop is refused (null clears the key). Unknown keys under a known section are stored as given. Values parse as JSON first (true/false/numbers/objects/arrays), else stay strings."
  assert.ok(settingsTool().description.includes(NEW_SENTENCE), "新句整句逐字出现")
})

/* ─── 第 13 批（T-S3.1–T-S3.3——parseValue 两端统一 ① 去引号；§9.5） ─── */

/** 点分路径读（断言磁盘/内存叶子值）。 */
const deep = (o, p) => p.split(".").reduce((x, k) => x?.[k], o)

test("T-S3.1 正常（① 去引号）：set 串型键传值字面含引号——落盘/内存/读回 = 解析值", async () => {
  await withCfg({}, async (t) => {
    const ctx = ctxOf({})
    const r = await set(t, "defaultModel", '"probe:model"', ctx)
    assert.equal(r.ok, true, r.message)
    assert.equal(diskOf(t).defaultModel, "probe:model", "磁盘 = 解析值（去引号——① 裁定）")
    assert.equal(ctx.agent.config.defaultModel, "probe:model", "内存热应用同值")
    assert.equal(loadConfig().defaultModel, "probe:model", "读取侧读回解析值")
  })
})

test("T-S3.2 正常：既有值解析形态零回归（裸串 / 数字 / 布尔 / 对象 / 数组）", async () => {
  await withCfg({}, async (t) => {
    const ctx = ctxOf({})
    const cases = [
      ["agent.customFlag", "plain", "plain"],
      ["agent.customNum", "5", 5],
      ["agent.customBool", "true", true],
      ["agent.customObj", '{"a":1}', { a: 1 }],
      ["agent.customArr", "[1,2]", [1, 2]],
    ]
    for (const [key, raw, want] of cases) {
      const r = await set(t, key, raw, ctx)
      assert.equal(r.ok, true, `${key}: ${r.message}`)
      assert.deepEqual(deep(diskOf(t), key), want, `${key}: 磁盘值零回归`)
      assert.deepEqual(deep(ctx.agent.config, key), want, `${key}: 内存热应用零回归`)
    }
  })
})

test("T-S3.3 错误：含引号数字赋给数值键——拒绝 + 磁盘/内存零变化", async () => {
  await withCfg({}, async (t) => {
    const ctx = ctxOf({ agent: { maxTurns: 200 } })
    const before = readText(t), mem = JSON.stringify(ctx.agent.config)
    const r = await set(t, "agent.maxTurns", '"500"', ctx)
    assert.equal(r.ok, false)
    assert.match(r.message, /expects number/, "判据全量可见")
    ZERO_CHANGE(t, ctx, before, mem)
  })
})
