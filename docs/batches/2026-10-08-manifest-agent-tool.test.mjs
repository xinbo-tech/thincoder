/**
 * 2026-10-08-manifest-agent-tool.test.mjs — manifest agent 工具面批（台账 #1098）批次本地件。
 * 名随批次档 · 住批次目录 · **不进仓套件**；复跑（仓根 d:/teamcode/thincoder 下）：
 *   node --test docs/batches/2026-10-08-manifest-agent-tool.test.mjs
 *
 * 覆盖 = 设计档 `docs/core/design/MANIFEST.md` §3.2 T63–T73（11 格）+ §3.1 AC-40–AC-43：
 *   T63 read ok（未知键 / 缺键行 + 回读 = readManifest 直读） · T64 read 四非 ok 态（均不抛）
 *   T65 init 三格 + 不覆盖（sha256） · T66 write 点改逐键族（八面 + `null` + 回写收敛）
 *   T67 写 / 建拒面（`refused` + 盘零变） · T68 装配 × 权限面（五格零挂 / 两模式同挂 / writer 闸 / 源码面）
 *   T69 报告面随动（KD-M1-40——同回合内存值不即时变 / 非锚对照格） · T70 参数面（登记册）
 *   T71 分类谓词（read 只读格 / init ∥ write 侧效门） · T72 描述单源逐字节 · T73 value 三值解析
 *
 * 红绿对照（先红 = 批前码——`thincoder-core/agent-tools/manifest.mjs` 尚不存在）：
 *   整档不可载入（顶层 import 失败）⇒ 11 格全红；实施轮落地后全绿。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const ROOT = fileURLToPath(new URL("../../", import.meta.url)) // 仓根（thincoder/）
const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href)

const MAN = await load("thincoder-core/manifest.mjs")
const TOOLMOD = await load("thincoder-core/agent-tools/manifest.mjs")
const REG = await load("thincoder-core/agent-tools.mjs")
const FAMILY = await load("thincoder-core/agent/family-tools.mjs")
const GATES = await load("thincoder-core/agent/dispatch-gates.mjs")
const REM = await load("thincoder-core/agent/setup-reminders.mjs")

const REL = MAN.MANIFEST_REL
const defaults = () => structuredClone(MAN.DEFAULT_MANIFEST)
/** 会话 ctx 夹具（dispatch 形态：`{ cwd, agent }`）。 */
const CTX = (dir) => ({ agent: { cwd: dir }, cwd: dir })

const created = []
const tmp = (tag) => { const d = mkdtempSync(join(tmpdir(), `mat-${tag}-`)); created.push(d); return d }
const cleanup = () => {
  for (const d of created.splice(0)) {
    try { rmSync(d, { recursive: true, force: true }) } catch { /* 临时目录尽力清理 */ }
  }
}
const mkDir = (p) => { mkdirSync(p, { recursive: true }); return p }
const mkBareRepo = (dir) => { mkDir(join(dir, ".git")); return dir }
/** 建项目夹具：`dir/PROJECT-MANIFEST.json` = 给定对象（缺省 = DEFAULT_MANIFEST）。 */
const mkProject = (dir, obj = defaults()) => { writeFileSync(join(dir, REL), JSON.stringify(obj, null, 2) + "\n"); return dir }
const sha256 = (p) => createHash("sha256").update(readFileSync(p)).digest("hex")
const tool = (args, ctx) => TOOLMOD.manifestTool.execute(args, ctx)
/** 非目标**已知**键逐字零变（目标键 = key 点分路径首段 —— 嵌套键时同族其余子键各查）。 */
const assertOthersUnchanged = (before, after, key, label) => {
  const segs = key.split(".")
  for (const k of MAN.MANIFEST_SCHEMA.keys) {
    if (k !== segs[0]) { assert.equal(JSON.stringify(after[k]), JSON.stringify(before[k]), `${label}：非目标键 ${k} 零变`); continue }
    if (segs.length === 1) continue // 目标整键
    for (const sub of MAN.MANIFEST_SCHEMA.nestedKeys[k] ?? []) {
      if (sub === segs[1]) continue
      assert.equal(JSON.stringify(after[k][sub]), JSON.stringify(before[k][sub]), `${label}：非目标键 ${k}.${sub} 零变`)
    }
  }
}

/* ── T63 · read ok（未知键 + 缺键各一） ─────────────────────────────────────── */

test("T63 read ok：state=ok + manifest JSON + missingKeys / unknownKeys 行（errors 空）", async () => {
  const dir = tmp("t63")
  try {
    const obj = defaults()
    delete obj.promptsLanding
    obj.unknownZ = 1
    mkProject(dir, obj)
    const out = await tool({ action: "read", target: dir }, CTX(dir))
    assert.match(out, /state=ok/, "稳定锚 state=ok")
    const jsonLine = out.split("\n").find((l) => l.startsWith("manifest="))
    assert.ok(jsonLine, "manifest JSON 行在场")
    assert.deepEqual(JSON.parse(jsonLine.slice("manifest=".length)), MAN.readManifest(dir).manifest, "回读 = readManifest 直读（已知键逐键相等）")
    assert.match(out, /missingKeys=.*promptsLanding/, "缺键路径行")
    assert.match(out, /unknownKeys=.*unknownZ/, "未知键行含键名")
    assert.ok(!out.includes("errors="), "errors 行非空才出（本格空）")
  } finally { cleanup() }
})

/* ── T64 · read 四非 ok 态（均不抛） ────────────────────────────────────────── */

test("T64 read 四非 ok 态：missing / no-project / ambiguous / invalid——皆不抛", async () => {
  const root = tmp("t64")
  try {
    // ① 缺档（裸仓）⇒ state=missing + init 引导
    const repo = mkBareRepo(mkDir(join(root, "repo")))
    const r1 = await tool({ action: "read", target: repo }, CTX(repo))
    assert.match(r1, /state=missing/)
    assert.match(r1, /action=init/, "缺档报明附 init 引导")

    // ② 无项目（空目录）⇒ state=no-project
    const empty = mkDir(join(root, "empty"))
    const r2 = await tool({ action: "read", target: empty }, CTX(empty))
    assert.match(r2, /state=no-project/)

    // ③ 歧义（双带档子目录）⇒ state=ambiguous + 候选全列
    const cont = mkDir(join(root, "cont"))
    const a = mkProject(mkDir(join(cont, "aaa")))
    const b = mkProject(mkDir(join(cont, "bbb")))
    const r3 = await tool({ action: "read", target: cont }, CTX(cont))
    assert.match(r3, /state=ambiguous/)
    assert.ok(r3.includes(a) && r3.includes(b), "候选全列")

    // ④ 档非法（坏 JSON ∥ 非法枚举）⇒ state=invalid + errors 行
    const bad = mkDir(join(root, "bad"))
    writeFileSync(join(bad, REL), "{not json")
    const r4 = await tool({ action: "read", target: bad }, CTX(bad))
    assert.match(r4, /state=invalid/)
    assert.match(r4, /errors=/)
    const bad2 = mkProject(mkDir(join(root, "bad2")), { ...defaults(), phase: "bogus" })
    const r5 = await tool({ action: "read", target: bad2 }, CTX(bad2))
    assert.match(r5, /state=invalid/)
    assert.match(r5, /phase/, "errors 点名键")
  } finally { cleanup() }
})

/* ── T65 · init 三格 + 不覆盖 ───────────────────────────────────────────────── */

test("T65 init：梯② / 梯④ / 梯⑤ 三格落点 + 已带档拒（sha256 零变）", async () => {
  const root = tmp("t65")
  try {
    // ① 梯② 裸仓无档 ⇒ 落裸仓
    const repo = mkBareRepo(mkDir(join(root, "repo")))
    const o1 = await tool({ action: "init", target: repo }, CTX(repo))
    assert.ok(o1.includes(`path=${join(repo, REL)}`), "结果行含落点 path")
    assert.deepEqual(MAN.readManifest(repo).manifest, defaults(), "档内容 = DEFAULT_MANIFEST")

    // ② 梯④ 容器 + 恰一裸仓 ⇒ 落裸仓（容器处零建档）
    const parent = mkDir(join(root, "parent"))
    const child = mkBareRepo(mkDir(join(parent, "child-repo")))
    const o2 = await tool({ action: "init", target: parent }, CTX(parent))
    assert.ok(o2.includes(`path=${join(child, REL)}`), "落点 = 裸仓")
    assert.ok(existsSync(join(child, REL)))
    assert.ok(!existsSync(join(parent, REL)), "容器处零建档")

    // ③ 梯⑤ 空目录 ⇒ 落 target 自身
    const empty = mkDir(join(root, "empty"))
    const o3 = await tool({ action: "init", target: empty }, CTX(empty))
    assert.ok(o3.includes(`path=${join(empty, REL)}`), "落点 = target 自身")
    assert.deepEqual(MAN.readManifest(empty).manifest, defaults())

    // ④ 已带档 ⇒ 拒 + 零覆盖（sha256）
    const before = sha256(join(repo, REL))
    await assert.rejects(() => tool({ action: "init", target: repo }, CTX(repo)), /refused/)
    assert.equal(sha256(join(repo, REL)), before, "零覆盖")
  } finally { cleanup() }
})

/* ── T66 · write 点改逐键族（八面 + null + 回写收敛） ───────────────────────── */

test("T66 write 点改逐键族：八面各一例 + null（本面无）+ 回写收敛", async () => {
  const dir = tmp("t66")
  try {
    await tool({ action: "init", target: dir }, CTX(dir))
    const cases = [
      { key: "version", value: "2", expect: 2 },
      { key: "phase", value: "production", expect: "production" },
      { key: "docRoot.design", value: "docs/design", expect: "docs/design" },
      { key: "promptsLanding", value: "docs/landing", expect: "docs/landing" },
      { key: "checkConfig.lineWidth", value: "120", expect: 120 },
      { key: "codePaths", value: '["src","app"]', expect: ["src", "app"] },
      { key: "index.publicRepos", value: '["../shared"]', expect: ["../shared"] },
      { key: "advisor.docMap", value: "docs/design/MANIFEST.md", expect: "docs/design/MANIFEST.md" },
    ]
    for (const c of cases) {
      const before = MAN.readManifest(dir).manifest
      const out = await tool({ action: "write", target: dir, key: c.key, value: c.value }, CTX(dir))
      assert.ok(out.includes(`path=${join(dir, REL)}`), `write 回执含落点（${c.key}）`)
      const after = MAN.readManifest(dir).manifest
      const segs = c.key.split(".")
      const got = segs.length === 1 ? after[c.key] : after[segs[0]][segs[1]]
      assert.deepEqual(got, c.expect, `${c.key} 回读相等`)
      assertOthersUnchanged(before, after, c.key, c.key)
    }

    // docRoot.* 的「本面无」：`"null"` ⇒ null（不被默认补回 + 零根）
    await tool({ action: "write", target: dir, key: "docRoot.specs", value: "null" }, CTX(dir))
    const m = MAN.readManifest(dir).manifest
    assert.equal(m.docRoot.specs, null, "null 保持（不补默认）")
    assert.deepEqual(MAN.docRootPaths(m.docRoot.specs, dir), [], "null ⇒ 零根")

    // 回写收敛（KD-M1-11）：未知键丢 / 缺键补默认
    const conv = tmp("t66c")
    const obj = defaults()
    delete obj.advisor
    obj.unknownZ = 1
    mkProject(conv, obj)
    await tool({ action: "write", target: conv, key: "phase", value: "production" }, CTX(conv))
    const converged = MAN.readManifest(conv).manifest
    assert.ok(!("unknownZ" in converged), "未知键回写丢（收敛语义）")
    assert.deepEqual(converged.advisor, defaults().advisor, "缺键回写补默认")
  } finally { cleanup() }
})

/* ── T67 · 写 / 建拒面（refused + 盘零变） ──────────────────────────────────── */

test("T67 写 / 建拒面：非法值 · 白名单外 · 缺档 · 歧义 · 无项目——皆拒 + 盘零变", async () => {
  const root = tmp("t67")
  try {
    const proj = mkProject(mkDir(join(root, "proj")))
    const file = join(proj, REL)
    const sha0 = sha256(file)

    // ① 非法值写 ⇒ 拒 + 档逐字节未变
    for (const [key, value] of [["phase", "bogus"], ["docRoot.specs", '""'], ["advisor.docMap", "5"]]) {
      await assert.rejects(() => tool({ action: "write", target: proj, key, value }, CTX(proj)), /refused/, `非法值 ${key}=${value}`)
      assert.equal(sha256(file), sha0, `非法值 ${key} 盘零变`)
    }

    // ② 白名单外 key（含四族整键写 ∥ 原型链名——`Object.prototype` 继承名不得漏拒）⇒ 拒 + 零变
    for (const [key, value] of [
      ["phas", "production"], ["docRoot.xxx", '"x"'],
      ["docRoot", "{}"], ["checkConfig", "{}"], ["index", "{}"], ["advisor", "{}"],
      ["__proto__.x", "1"], ["constructor.x", "1"], ["toString.x", "1"],
    ]) {
      await assert.rejects(() => tool({ action: "write", target: proj, key, value }, CTX(proj)), /refused/, `白名单外 ${key}`)
      assert.equal(sha256(file), sha0, `白名单外 ${key} 盘零变`)
    }

    // ③ 缺档 write ⇒ 拒 + 引导 init（零建档）
    const repo = mkBareRepo(mkDir(join(root, "repo")))
    await assert.rejects(() => tool({ action: "write", target: repo, key: "phase", value: "production" }, CTX(repo)), /refused/)
    await assert.rejects(() => tool({ action: "write", target: repo, key: "phase", value: "production" }, CTX(repo)), /action=init/, "缺档引导 init")
    assert.ok(!existsSync(join(repo, REL)), "零建档")

    // ④ 歧义（write / init）⇒ 拒 + 候选全列 + 零写
    const cont = mkDir(join(root, "cont"))
    const a = mkProject(mkDir(join(cont, "aaa")))
    const b = mkProject(mkDir(join(cont, "bbb")))
    for (const action of ["write", "init"]) {
      const err = await tool({ action, target: cont, key: "phase", value: "production" }, CTX(cont)).then(() => null, (e) => e)
      assert.ok(err, `${action} 歧义拒`)
      assert.match(err.message, /refused/)
      assert.ok(err.message.includes(a) && err.message.includes(b), `${action} 候选全列`)
    }
    assert.ok(!existsSync(join(cont, REL)), "歧义零写")

    // ⑤ 无项目 write ⇒ 拒 + 引导 init（零建档）
    const empty = mkDir(join(root, "empty"))
    const err5 = await tool({ action: "write", target: empty, key: "phase", value: "production" }, CTX(empty)).then(() => null, (e) => e)
    assert.ok(err5 && /refused/.test(err5.message) && /action=init/.test(err5.message), "无项目拒 + init 引导")
    assert.ok(!existsSync(join(empty, REL)), "零建档")
  } finally { cleanup() }
})

/* ── T68 · 装配 × 权限面 ────────────────────────────────────────────────────── */

test("T68 装配 × 权限面：depth-0 两模式恰一 · depth>0 五格零挂 · writer 闸 · 源码面", async () => {
  const dir = tmp("t68")
  try {
    // ① 装配：depth-0 两模式恰一；depth>0 五格（eng-coder / eng-designer / coder / consult / 兜底）零
    for (const engineering of [false, true]) {
      const tools = await FAMILY.assembleFamilyTools({ depth: 0, engineering, consultModels: [] })
      assert.equal(tools.filter((t) => t.name === "manifest").length, 1, `depth-0 engineering=${engineering} 恰一`)
    }
    for (const engineering of [false, true]) {
      for (const role of ["eng-coder", "eng-designer", "coder", "consult", null]) {
        const tools = await FAMILY.assembleFamilyTools({ depth: 1, role, engineering, consultModels: [] })
        assert.equal(tools.filter((t) => t.name === "manifest").length, 0, `depth>0 role=${role} engineering=${engineering} 零挂`)
      }
    }

    // ② 主 agent 实调放行（init / write 落盘，writer:'main'）
    await tool({ action: "init", target: dir }, CTX(dir))
    await tool({ action: "write", target: dir, key: "phase", value: "production" }, CTX(dir))
    assert.equal(MAN.readManifest(dir).manifest.phase, "production", "主 agent init / write 实调放行")

    // ③ 写门：缺省（subagent）拒——AC-5 同一闸（同步抛 ⇒ assert.throws）
    assert.throws(() => MAN.writeManifest(dir, defaults(), {}), /writer/)
    assert.throws(() => MAN.initManifest(dir, { writer: "subagent" }), /writer/)

    // ④ 源码面：落盘恒经两函数 + writer "main" 字面量
    const src = readFileSync(join(ROOT, "thincoder-core/agent-tools/manifest.mjs"), "utf8")
    assert.ok(src.includes('writer: "main"'), '源码面 writer: "main" 字面量')
    assert.ok(src.includes("writeManifest(") && src.includes("initManifest("), "源码面落盘恒经 writeManifest / initManifest")
  } finally { cleanup() }
})

/* ── T69 · 报告面随动（KD-M1-40） ───────────────────────────────────────────── */

test("T69 报告面随动：工具写盘 ⇒ 下回合 ③b 采纳；内存值不即时变；非锚对照格", async () => {
  const dir = tmp("t69anchor")
  try {
    await tool({ action: "init", target: dir }, CTX(dir))
    const agent = { cwd: dir, config: { agent: { engineering: true } }, history: [] }
    assert.equal(REM.pushManifestStateReminder(agent), true, "首推 = 初始相位行")
    assert.match(agent.history.at(-1).content, /phase: initial-dev \(rigor: light\)/)

    // 锚项目写入：同回合内存值不即时变（反证格——第二值源否）
    await tool({ action: "write", target: dir, key: "phase", value: "production" }, { agent, cwd: dir })
    assert.equal(agent.manifest.phase, "initial-dev", "反证格：工具不写 agent.manifest")
    const f = join(dir, REL)
    const bump = new Date(Date.now() + 2000)
    utimesSync(f, bump, bump) // mtime 推进（同 ms 写 → 门控兜底）
    assert.equal(REM.pushManifestStateReminder(agent), true, "下回合重推（③b mtime 门控采纳新值）")
    assert.match(agent.history.at(-1).content, /phase: production \(rigor: strict\)/, "行 = 新值")
    assert.equal(agent.history.filter((m) => typeof m.content === "string" && m.content.startsWith("[System reminder: project state:")).length, 1, "单活体")

    // 对照格：非锚目标写入 ⇒ 锚行不变
    const other = tmp("t69other")
    mkProject(other, defaults())
    await tool({ action: "write", target: other, key: "phase", value: "production" }, { agent, cwd: dir })
    assert.equal(REM.pushManifestStateReminder(agent), false, "非锚写入 ⇒ 行不变")
    assert.match(agent.history.at(-1).content, /phase: production/, "仍为锚项目状态（非锚值不串）")
  } finally { cleanup() }
})

/* ── T70 · 参数面（登记册） ─────────────────────────────────────────────────── */

test("T70 参数面：action ∈ {read,init,write} 必填 ∧ target / key / value 可选", async () => {
  const t = REG.manifestTool
  assert.equal(t, TOOLMOD.manifestTool, "登记册导出 = 工具对象（注册面单一）")
  assert.equal(t.name, "manifest")
  const p = t.parameters
  assert.equal(p.type, "object")
  assert.deepEqual(p.properties.action.enum, ["read", "init", "write"], "action 枚举")
  assert.deepEqual(p.required, ["action"], "必填位 = action 唯一")
  assert.deepEqual(Object.keys(p.properties).sort(), ["action", "key", "target", "value"], "字段名逐项")
})

/* ── T71 · 分类谓词（只读格） ───────────────────────────────────────────────── */

test("T71 分类谓词：read ⇒ 只读类；init / write ⇒ 侧效门", () => {
  const t = TOOLMOD.manifestTool
  assert.equal(GATES.readonlyActionOf(t, "manifest", { action: "read" }), true, "read = 只读类")
  assert.equal(GATES.readonlyActionOf(t, "manifest", { action: "init" }), false, "init = 侧效门")
  assert.equal(GATES.readonlyActionOf(t, "manifest", { action: "write" }), false, "write = 侧效门")
})

/* ── T72 · 描述单源逐字节 ───────────────────────────────────────────────────── */

test("T72 描述单源：manifestTool.description ↔ tool-docs/manifest.md 逐字节", () => {
  const doc = readFileSync(join(ROOT, "thincoder-core/tool-docs/manifest.md"), "utf8")
  assert.equal(TOOLMOD.manifestTool.description, doc, "逐字节相等（DESC 单解析面）")
})

/* ── T73 · value 三值解析 ───────────────────────────────────────────────────── */

test("T73 value 三值解析：\"null\" ⇒ null · JSON 数组 ⇒ 数组 · 裸串 ⇒ 字面串", async () => {
  const dir = tmp("t73")
  try {
    await tool({ action: "init", target: dir }, CTX(dir))
    await tool({ action: "write", target: dir, key: "docRoot.design", value: "null" }, CTX(dir))
    await tool({ action: "write", target: dir, key: "index.publicRepos", value: '["../shared"]' }, CTX(dir))
    await tool({ action: "write", target: dir, key: "advisor.docMap", value: "docs/design" }, CTX(dir))
    const m = MAN.readManifest(dir).manifest
    assert.equal(m.docRoot.design, null, '"null" ⇒ null（本面无——KD-M1-37）')
    assert.deepEqual(MAN.docRootPaths(m.docRoot.design, dir), [], "null ⇒ 零根")
    assert.deepEqual(m.index.publicRepos, ["../shared"], "JSON 数组 ⇒ 数组")
    assert.equal(m.advisor.docMap, "docs/design", "裸串 ⇒ 字面串（JSON.parse 失败取字面）")
  } finally { cleanup() }
})
