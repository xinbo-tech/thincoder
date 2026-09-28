/**
 * session-prefs.test.mjs — 会话级偏好写面（`session:prefs`）用例（T-DSK28 ①–⑦ · `docs/desktop/design/IPC.md`
 * §2「会话级偏好注」项 2/4/7）：载荷 `{key,patch}` → 写盘 → 回执 `meta` + 失败径零写。
 *   U127 往返（活动槽三形：`{provider,model}` / `{effort}` / `{model}` —— 落盘 ≡ 回读 `meta` ≡ 内存施加；
 *        另例非活动槽只写盘）
 *   U128 拒态零写（`bad-key` 两形 · 在飞 `busy` · `invalid-patch` 六形 · `model-required` · `slot-missing`
 *        两径（槽缺 / `cwd` 无源）—— 每个 reason 皆断言档文不变）
 *   U129 老槽零回填 + 表外归一（无 `effort` 键槽：仅 `{model}` ⇒ 键不新增；表外字面串 ⇒ `null`、其余键照改）
 *   U130 ipc 源面机检（`HANDLERS` 入册行 + 转口宿主写面 + 载荷两键 —— 本档不 import `ipc.mjs`：其
 *        `electron` 依赖不在测试域，沿 `project-info.test.mjs` U112 源面先例）
 *   U131 档位三记号（`off` ∈ 槽值域 ⇒ 照落 ∧ 表外串于**原非 `null`** 槽亦置 `null` —— T-DSK28 ⑤ 明文例；
 *        `Auto` = 清键形 `{ effort: null }` ⇒ 未设 —— T-DSK28 输入列「含 `off` 与 `Auto` 各一例」）
 * 用例号 = 自铸（U127–U131）：设计归属表无本舱段（沿 U120/U121 先例）；披露入批次档 §5。
 * 纪律：真槽文件 + 共享沙箱（tmp sessions 根 + tmp cwd）+ 假 `assemble` ⇒ 零网 / 零 electron / 零用户目录；
 * `meta` 期望值取自核单源（`specForModel` 枚举 / 核 `resolveEffortPatch` 归一）—— 本档只验端面传递与施加，
 * 不重验核归一。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { specForModel } from "@thincoder/core/model-specs.mjs"
import { createAgentHost } from "../src/main/agent-host.mjs"
import { slotPath } from "../src/main/session-slots.mjs"
import { useSlotSandbox } from "./slot-sandbox.mjs"

/** 表内已知模型（枚举非空 —— 档位期望值由此出，勿铸字面副本）。 */
const KNOWN_MODEL = "deepseek-v4-flash"
const KNOWN_LEVEL = specForModel(KNOWN_MODEL).reasoningEffortEnum[0]

const IPC_SRC = readFileSync(new URL("../src/main/ipc.mjs", import.meta.url), "utf8")

/** 写槽档（核形：`version` 2 + `cwd` 匹配 + `history` 数组）。 */
function writeSlot(cwd, slot, data) {
  writeFileSync(slotPath(cwd, slot), JSON.stringify({ version: 2, cwd, history: [], ...data }))
}

const readSlot = (cwd, slot) => JSON.parse(readFileSync(slotPath(cwd, slot), "utf8"))

/** 假代理（同 `session-io.test.mjs` 核形）：`providers` 在场 ⇒ 重施走模型合并支①（槽 provider 命中）。 */
function fakeAgent(cwd, slot) {
  return {
    cwd, provider: { name: "p1", model: KNOWN_MODEL }, providers: [{ name: "p1", model: KNOWN_MODEL }],
    tools: [], config: {}, history: [], _fullHistory: [], _slot: slot,
  }
}

/** 宿主（假 `assemble` / `run` 可换 —— 在飞用例注永不结算的 `run`）。 */
function makeHost(currentCwd, run = () => Promise.resolve()) {
  return createAgentHost({
    emit: () => {},
    run,
    assemble: async ({ cwd, slot }) => fakeAgent(cwd, slot),
    projects: { currentCwd },
  })
}

// ─── U127 活动槽往返（写盘 ≡ 回读 meta ≡ 内存施加）────────────────────

test("U127: 三形 patch 往返 —— 落盘 ≡ 回执 meta ≡ 活动会话内存；非活动槽只写盘（不隐式装配）", async () => {
  const s = useSlotSandbox()
  try {
    writeSlot(s.cwd, 7, { activeProvider: "p1", activeModel: "m1", engineering: true })
    const host = makeHost(() => s.cwd)
    const agent = await host.ensure("7", 7)
    assert.equal(agent.activeModel, "m1", "装配装载（正例在场 —— 防假红）")

    const r1 = host.setPrefs("7", { provider: "p1", model: KNOWN_MODEL })
    assert.deepEqual({ ...r1, meta: undefined }, { ok: true, reason: null, cwd: s.cwd, slot: 7, meta: undefined }, "族信封四键")
    assert.deepEqual(r1.meta, { provider: "p1", model: KNOWN_MODEL }, "回执 meta = 会话头三值投影（与 history:page 同源；两模式位随状态栏对齐批撤出）")
    assert.equal(readSlot(s.cwd, 7).activeModel, KNOWN_MODEL, "落盘（写盘单源 = 核写口）")
    assert.equal(agent.activeModel, KNOWN_MODEL, "施加：活动会话内存即生效")
    assert.equal(agent.provider.model, KNOWN_MODEL)

    const r2 = host.setPrefs("7", { effort: KNOWN_LEVEL })
    assert.equal(readSlot(s.cwd, 7).effort, KNOWN_LEVEL, "档位落盘（期望值 = 核单源枚举成员）")
    assert.equal(r2.meta.effort, KNOWN_LEVEL, "回执 meta 含档位")
    assert.equal(agent._slotEffort, KNOWN_LEVEL, "施加：槽档位记录")
    assert.equal(agent.provider.reasoningEffort, KNOWN_LEVEL, "施加：合并后模型有该枚举 ⇒ 置 provider.reasoningEffort（核单源）")

    const r3 = host.setPrefs("7", { model: "m2" })
    assert.equal(readSlot(s.cwd, 7).activeModel, "m2", "仅换模型 ⇒ 落盘")
    assert.deepEqual(r3.meta, { provider: "p1", model: "m2", effort: KNOWN_LEVEL }, "改模型不清档位（meta 逐键投影）")
    assert.equal(agent.activeModel, "m2", "施加：仅换模型亦重施")

    const before = host.agents.size
    writeSlot(s.cwd, 5, { activeProvider: "p1", activeModel: "m1" })
    const r4 = host.setPrefs("5", { model: "m3" })
    assert.equal(readSlot(s.cwd, 5).activeModel, "m3", "非活动槽：只写盘")
    assert.equal(r4.slot, 5)
    assert.equal(host.agents.size, before, "非活动槽：不隐式装配（施加面不含装配）")
  } finally {
    s.cleanup()
  }
})

// ─── U128 拒态零写 ─────────────────────────────────────────────

test("U128: reason 闭集五档皆零写（bad-key / busy / invalid-patch / model-required / slot-missing）", async () => {
  const s = useSlotSandbox()
  try {
    writeSlot(s.cwd, 6, { activeProvider: "p1", activeModel: "m1" })
    const host = makeHost(() => s.cwd)
    const zero = (h, reason, patch, key = "6") => {
      const before = readFileSync(slotPath(s.cwd, 6), "utf8")
      const r = h.setPrefs(key, patch)
      assert.deepEqual(Object.keys(r).sort(), ["cwd", "ok", "reason", "slot"], "失败径键集（无 `meta` 键 —— IPC.md §2「会话级偏好注」项 7）")
      assert.equal(r.ok, false)
      assert.equal(r.reason, reason)
      assert.equal(r.slot, null, "失败径 slot = null（信封形）")
      assert.equal(readFileSync(slotPath(s.cwd, 6), "utf8"), before, `${reason} ⇒ 失败径零写`)
      return r
    }
    assert.equal(host.setPrefs("6", { model: "m9" }).ok, true, "正例在场（防假红）")
    zero(host, "bad-key", { model: "m9" }, "nope")
    zero(host, "bad-key", { model: "m9" }, 6)
    zero(host, "invalid-patch", undefined)
    zero(host, "invalid-patch", {})
    zero(host, "invalid-patch", { nope: "x" })
    zero(host, "invalid-patch", ["model"])
    zero(host, "invalid-patch", { model: "" })
    zero(host, "invalid-patch", { model: 7 })
    zero(host, "invalid-patch", { effort: 5 })
    zero(host, "model-required", { provider: "p1" })
    const missing = zero(host, "slot-missing", { model: "m9" }, "4")
    assert.equal(existsSync(slotPath(s.cwd, 4)), false, "槽缺 ⇒ 不新建档")
    assert.equal(missing.cwd, s.cwd, "失败信封仍携 cwd")

    // 在飞 busy：同键回合运行中（`run` 永不结算）⇒ 偏好写面拒且零写
    const hanging = makeHost(() => s.cwd, () => new Promise(() => {}))
    assert.equal((await hanging.send("6", "hi")).ok, true, "在飞建立（正例）")
    zero(hanging, "busy", { model: "m9" })

    // cwd 无源（未开项目）：判序在载荷之后 ⇒ 合法载荷 ⇒ slot-missing
    const bare = makeHost(() => null)
    const r = zero(bare, "slot-missing", { model: "m9" })
    assert.equal(r.cwd, null, "cwd 无源 ⇒ 信封 cwd = null")
  } finally {
    s.cleanup()
  }
})

// ─── U129 老槽零回填 + 表外归一 ─────────────────────────────────

test("U129: 老槽（无 `effort` 键）零回填；表外档位字面串 ⇒ `null` 且其余键照改", async () => {
  const s = useSlotSandbox()
  try {
    writeSlot(s.cwd, 10, { activeProvider: "p1", activeModel: KNOWN_MODEL })
    const host = makeHost(() => s.cwd)
    const agent = await host.ensure("10", 10)
    assert.equal(agent._slotEffort, undefined, "老槽键缺 ⇒ 施加面不设（边界表第 1 行：零行为变更）")

    const r1 = host.setPrefs("10", { model: "m4" })
    assert.deepEqual(r1.meta, { provider: "p1", model: "m4" }, "回执 meta 只出槽内有值之键")
    assert.equal("effort" in readSlot(s.cwd, 10), false, "零回填：仅 `{model}` 不新增 `effort` 键")

    const r2 = host.setPrefs("10", { effort: "表外档位", model: "m5" })
    const after = readSlot(s.cwd, 10)
    assert.equal(after.effort, null, "表外字面串 ⇒ 归一 `null`（值置 `null` 不删键）")
    assert.equal(after.activeModel, "m5", "其余键照改（同 patch）")
    assert.deepEqual(r2.meta, { provider: "p1", model: "m5" }, "归一 `null` = 未设 ⇒ meta 零节点")
    assert.equal(agent._slotEffort, null, "施加：键在而值 `null` ⇒ `null`（未设态，非 `undefined`）")
  } finally {
    s.cleanup()
  }
})

// ─── U131 档位三记号（`off` ∈ 槽值域 · 原非 `null` 表外例 · `Auto` 清键形）──

test("U131: 档位三记号 —— `off` 照落（∈ 槽值域、非枚举成员）∧ 表外串于原非 `null` 槽亦置 `null` ∧ `Auto`（清键形）⇒ 未设", async () => {
  const s = useSlotSandbox()
  try {
    writeSlot(s.cwd, 12, { activeProvider: "p1", activeModel: KNOWN_MODEL })
    const host = makeHost(() => s.cwd)

    const r1 = host.setPrefs("12", { effort: "off" })
    assert.equal(readSlot(s.cwd, 12).effort, "off", "`off` ∈ 槽值闭集（IPC.md §2「会话级偏好注」项 3）⇒ 端面照落、不做枚举过滤")
    assert.deepEqual(r1.meta, { provider: "p1", model: KNOWN_MODEL, effort: "off" }, "meta 照出 `off`（非枚举成员亦出串）")

    const r2 = host.setPrefs("12", { effort: "表外档位" })
    const after = readSlot(s.cwd, 12)
    assert.equal(after.effort, null, "原非 `null` 亦置 `null`（T-DSK28 ⑤ 明文例 —— 非「保留原值」）")
    assert.equal("effort" in after, true, "归一 = 键在值 `null`（不删键）")
    assert.deepEqual(r2.meta, { provider: "p1", model: KNOWN_MODEL }, "`null` = 未设 ⇒ meta 零节点")
    assert.equal(after.activeProvider, "p1", "他键零动")

    const r3 = host.setPrefs("12", { effort: KNOWN_LEVEL })
    assert.equal(readSlot(s.cwd, 12).effort, KNOWN_LEVEL, "再建非 `null` 起点（枚举成员照落 —— 与 `off` 同径分叉）")
    assert.equal(r3.meta.effort, KNOWN_LEVEL, "meta 同步出枚举串")

    const r4 = host.setPrefs("12", { effort: null })
    const cleared = readSlot(s.cwd, 12)
    assert.equal(cleared.effort, null, "`Auto`（清键形 `{ effort: null }` —— IPC.md §2 值形「`null` = 清该键 · 仅 `effort` 一键」）⇒ 槽 `null`（未设）")
    assert.equal("effort" in cleared, true, "清键 = 值 `null`（不删键 —— 与表外归一同一出口）")
    assert.deepEqual(r4.meta, { provider: "p1", model: KNOWN_MODEL }, "未设 ⇒ meta 零节点（与 `off` 出串成对）")
  } finally {
    s.cleanup()
  }
})

// ─── U130 ipc 源面 ─────────────────────────────────────────────

test("U130: ipc 源面 —— `session:prefs` 入册（末位）+ 转口宿主写面（载荷两键 · 零算法副本）", () => {
  assert.ok(/\n {2}"session:prefs": sessionPrefs,\n/.test(IPC_SRC), "HANDLERS 入册行（新增行即新增白名单项）")
  assert.ok(IPC_SRC.indexOf('"session:prefs"') > IPC_SRC.indexOf('"question:respond"'), "入册在白名单末项之后（位次 = 末位）")
  assert.ok(
    /function sessionPrefs\(payload\) \{ return requireAgentHost\(\)\.setPrefs\(payload\?\.key, payload\?\.patch\) \}/.test(IPC_SRC),
    "处理体 = 宿主写面转口（载荷 `key` / `patch` 两键）",
  )
})
