/**
 * attachments.test.mjs — 回合附件主进程半用例（批 B ⑧ `8a` 舱 · 形态单源 = `docs/desktop/design/IPC.md` §2「附件注」项 1–6 ·
 * 任务书 = `docs/batches/2026-09-27-desktop-chat-panel-b.md` §2 `T-DSK30`（主进程半）+ §1.12 #93 立舱）：
 *   U142 载荷门（项 1）：缺 / 非数组 / 空数组 ⇒ 无附件径（零落盘 · 零注入 · 零降级）；
 *   U143 非视觉门（项 4）：不落盘不注入 · 文本尾一行（词面**消费**渲染面词表）· 门先于阈 · 零核错抛 · 源面零第二口径；
 *   U144 受理与阈（项 2+3）：命名形 / 绝对路径序 / 指引行**消费**核单源 / 弃项五源 ⇒ `partial`（含全弃）；
 *   U145 回执三形 + 宿主接线（项 5+6）：`send` 携图 ⇒ 装配文本入 run · 三径结算同清理 · 挂点序零假动作。
 * 用例号 = 自铸（`U142–U145`）：渲染半占 `U138–U141`（`test/views-attach.test.mjs`），本档续号。
 * 单源消费纪律（本档零第二口径）：词面读 `renderer/i18n.mjs` `HOST_DICT` · 门读核 `specForModel` ·
 *   指引行读核 `appendImagePointer`（同函数同输入 ⇒ 逐字等价断言，不抄行文）；源面机检另证本档零模型名单 /
 *   零词面字面 / 零指引行副本。
 * 平 node：零 electron / 零网（落盘面 = tmp 项目根；会话槽面 = `useSlotSandbox` 模块级一次）。
 */
import { after, test } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { isAbsolute, join } from "node:path"
import { appendImagePointer } from "@thincoder/core/agent/setup-reminders.mjs"
import { specForModel } from "@thincoder/core/model-specs.mjs"
import { createAgentHost } from "../src/main/agent-host.mjs"
import { cleanupTurn, IMAGE_MAX_BYTES, NON_VISION_KEY, prepareTurnAttachments, TURN_MAX_BYTES } from "../src/main/attachments.mjs"
import { FALLBACK_LOCALE, HOST_DICT } from "../renderer/i18n.mjs"
import { useSlotSandbox } from "./slot-sandbox.mjs"

const sandbox = useSlotSandbox() // 模块级：U145 经真 `send` 必走回合尾保存 ⇒ 不沙箱即写真实用户 sessions 目录
after(sandbox.cleanup)

const SRC = readFileSync(new URL("../src/main/attachments.mjs", import.meta.url), "utf8")
const KEY = "1"
const VISION = "gpt-4o" // 前提守卫在用例内（条2：核 spec 直读 —— 名字面随核退化即红）
const BLIND = "deepseek-v4-pro"
const NON_VISION = "non-vision"
const PARTIAL = "partial"

// ─── 夹具 ──────────────────────────────────────────────────────────────

/** 项目根（tmp 真目录 —— 落盘面真跑；整个子域随 `t.after` 清）。 */
function projectRoot(t, tag = "proj") {
  const dir = mkdtempSync(join(tmpdir(), `tc-att-${tag}-`))
  const cwd = join(dir, "root")
  mkdirSync(cwd, { recursive: true })
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  return cwd
}
const tmpDir = (cwd) => join(cwd, ".thincoder", "tmp")
/** 本回合落盘件（目录缺 ⇒ 空表 —— 「零目录」判据的另一半）。 */
const filesIn = (cwd) => (existsSync(tmpDir(cwd)) ? readdirSync(tmpDir(cwd)) : [])

/** dataURL 载荷（真形）：解码字节数 = `sized(bytes)`（阈断言不猜 —— 基64 4/3 取整）。 */
const sized = (bytes) => Math.ceil(bytes / 3) * 3
const dataUrl = (mime, bytes) => `data:image/${mime};base64,${"A".repeat((sized(bytes) / 3) * 4)}`
const item = (mime, bytes) => ({ name: `p.${mime}`, mime: `image/${mime}`, dataURL: dataUrl(mime, bytes) })

/** `console.error` 录面（零静默判据 —— 诊断串非面向用户文案，不经 `t()`）。 */
function captureErrors(t) {
  const lines = []
  const prior = console.error
  console.error = (...args) => { lines.push(args) }
  t.after(() => { console.error = prior })
  return lines
}
/** 剥注释（源面机检两口径：名单 / 词面字面看全源〔注释也算味〕；行文副本看代码面）。 */
function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^[ \t]*\/\/.*$/gm, "")
}
const CODE = stripComments(SRC)
const flush = () => new Promise((resolve) => setImmediate(resolve))
/** 词面单源读数（项 4 —— 与 `prepareTurnAttachments` 同取值面）。 */
const word = (locale) => HOST_DICT[locale ?? FALLBACK_LOCALE][NON_VISION_KEY]

/** 假宿主（真 `assembleFor` + 假 deps；`run` 由用例注入）—— 桩形同 `test/agent-host.test.mjs`（+ `config.locale`）。 */
function makeHost({ cwd, model = VISION, locale, invalid = false, run }) {
  const out = []
  const provider = invalid ? { name: "", model: "", baseURL: "" } : { name: "p1", model, baseURL: "http://127.0.0.1:1/v1" }
  const agent = { provider: { ...provider }, tools: [], cwd, history: [], _fullHistory: [], config: { agent: { streamRules: [] }, locale } }
  const deps = {
    loadConfig: () => ({
      provider: { ...provider },
      providersList: provider.name ? [{ name: "p1", model }] : [],
      agent: { streamRules: [] }, memory: { dbPath: ":memory:", projectDir: "proj-mem" },
      providerInvalidReason: invalid ? "no provider configured" : undefined,
    }),
    injectProxy: () => {}, createMemory: () => ({ codeOrigin: null, projectOrigin: null }),
    discoverRules: () => [{ pattern: "AGENTS.md" }], syncDir: async () => {}, team: () => null, author: () => "tester",
    assembleBuiltinTools: () => [{ name: "read" }], createAgent: () => agent,
  }
  const host = createAgentHost({ emit: (c, p) => out.push([c, p]), run, deps, projects: { currentCwd: () => cwd } })
  return { host, out, agent }
}
/** 捕获型假 `run`：收装配文本 + 常驻 Promise（用例自行结算）。 */
function captureRun() {
  const box = {}
  return { box, run: (agent, text, cb, opts) => { Object.assign(box, { agent, text, cb, opts }); return new Promise((r) => { box.resolve = r; box.reject = (e) => r(Promise.reject(e)) }) } }
}

// ─── U142 载荷门（项 1）──────────────────────────────────────────────
test("U142: 载荷门 —— 缺 / 非数组 / 空数组 ⇒ 无附件径（文本原样 · 零目录 · 零降级）", (t) => {
  const cwd = projectRoot(t, "load")
  const miss = (images, label) => {
    assert.deepEqual(prepareTurnAttachments("hi", images, { cwd, model: VISION }), { text: "hi", paths: [], degraded: null }, label)
    assert.equal(existsSync(join(cwd, ".thincoder")), false, `${label} ⇒ 零落盘（目录懒建）`)
  }
  miss(undefined, "缺 `images` 键")
  miss(null, "`images: null`")
  miss([], "空数组")
  miss({ dataURL: dataUrl("png", 3) }, "非数组（对象）")
  miss(dataUrl("png", 3), "非数组（串）")
  // 项形表外 ≠ 无附件径：项已递上 ⇒ 弃项面（项 3 ⇒ `partial`）—— 两径不得互混
  assert.deepEqual(prepareTurnAttachments("hi", [null, {}, 7], { cwd, model: VISION }), { text: "hi", paths: [], degraded: PARTIAL }, "数组但逐项非项形 ⇒ 全弃 ⇒ partial（零注入）")
  assert.equal(existsSync(join(cwd, ".thincoder")), false, "全弃径零落盘")
  // 无附件径不看模型：非视觉闸亦不触发（回执三形之「纯 ok」面 —— 零降级噪声）
  assert.deepEqual(prepareTurnAttachments("hi", [], { cwd, model: BLIND }), { text: "hi", paths: [], degraded: null }, "零附件 + 非视觉模型 ⇒ 零降级")
  assert.equal(prepareTurnAttachments(undefined, [], { cwd }).text, "", "非串文本 ⇒ 空串（交核契约：出口恒为串）")
})

// ─── U143 非视觉门（项 4）────────────────────────────────────────────
test("U143: 非视觉门 —— 不落盘不注入 · 文本尾一行（词面单源 · 语言经核归一）· 先于阈 · 零核错抛", (t) => {
  assert.notEqual(specForModel(BLIND).multimodal, true, "前提守卫：BLIND = 核 spec 非视觉")
  const cwd = projectRoot(t, "blind")
  for (const [locale, key, label] of [
    ["zh-CN", "zh", "`zh-CN` ⇒ 核归一 `zh`"],
    ["zh", "zh", "`zh` 原样"],
    [undefined, "en", "缺 `locale` ⇒ 缺省语言"],
    ["xx-YY", "en", "表外语言 ⇒ 缺省语言（零缺键面）"],
  ]) {
    const got = prepareTurnAttachments("看图", [item("png", 12)], { cwd, model: BLIND, locale })
    assert.equal(got.degraded, NON_VISION, `${label} ⇒ 降级码`)
    assert.deepEqual(got.paths, [], `${label} ⇒ 不落盘（零路径）`)
    assert.equal(got.text, `看图\n\n${word(key)}`, `${label} ⇒ 文本尾一行（词面 = 渲染面词表消费）`)
  }
  assert.equal(existsSync(join(cwd, ".thincoder")), false, "非视觉径零目录（门先于落盘）")
  // 门先于阈：超单项阈之项 + 非视觉模型 ⇒ 仍 non-vision（不落盘 ⇒ 无弃项概念）
  assert.equal(prepareTurnAttachments("x", [item("png", IMAGE_MAX_BYTES + 3000)], { cwd, model: BLIND }).degraded, NON_VISION, "非视觉优先于阈判定")
  // 表外项形 + 空正文：说明独占（零前导空行）· 出口零抛
  const alone = prepareTurnAttachments("", [null, {}, 7, item("bmp", 12)], { cwd, model: BLIND })
  assert.equal(alone.text, word(undefined), "正文空 ⇒ 说明独占 · 表外项形零抛")
  assert.deepEqual([alone.paths, alone.degraded], [[], NON_VISION], "同径同码")
  // 源面：零模型名单 / 零词面字面 / 零指引行副本（第二口径即缺陷 —— 门与词面皆消费）
  assert.ok(!/gpt-4|claude|gemini|qwen|deepseek|grok|glm|kimi/i.test(SRC), "源面零模型名单（门 = 核 `specForModel` 单源）")
  assert.ok(!/图片未随发|Images not sent/.test(SRC), "源面零词面字面（词面 = 渲染面词表消费）")
  assert.ok(!CODE.includes("[Attached images"), "代码面零指引行副本（指引 = 核 `appendImagePointer` 单源 —— 档头引注不计）")
})

// ─── U144 受理与阈（项 2+3）──────────────────────────────────────────
test("U144: 受理 —— 命名形 / 绝对路径序 / 指引行同核 · 弃项五源 ⇒ partial · 清理只删本回合件", (t) => {
  assert.equal(specForModel(VISION).multimodal, true, "前提守卫：VISION = 核 spec 多模态")
  const cwd = projectRoot(t, "store")
  // ① 全收：命名 `paste-<id>-<i>.<ext>`（index = 源序 · id 同回合一致）+ 绝对路径 + 原样序 + 落盘字节 = 载荷字节
  const got = prepareTurnAttachments("看图", [item("png", 12), item("jpeg", 15), item("gif", 9), item("webp", 6)], { cwd, model: VISION })
  assert.equal(got.degraded, null, "全收 ⇒ 零降级（回执纯 ok 面）")
  assert.equal(got.paths.length, 4, "四件全收")
  const names = got.paths.map((p) => p.split(/[\\/]/).pop())
  const ids = new Set(names.map((n) => n.split("-")[1]))
  assert.equal(ids.size, 1, "同回合 id 一致（一次 `runId`）")
  const exts = ["png", "jpg", "gif", "webp"] // jpeg ⇒ jpg（ext 面 = dataURL 媒体类型）
  names.forEach((n, i) => assert.match(n, new RegExp(`^paste-[0-9a-z]{8,16}-${i}\\.${exts[i]}$`), `第 ${i} 件命名形（源序 + ext 面）`))
  assert.deepEqual(got.paths.map((p) => isAbsolute(p) && p.startsWith(tmpDir(cwd))), [true, true, true, true], "四路径皆绝对且在 `<cwd>/.thincoder/tmp/` 下")
  assert.deepEqual(got.paths.map((p) => statSync(p).size), [sized(12), sized(15), sized(9), sized(6)], "盘上字节 = 载荷解码字节（逐项非空写）")
  assert.deepEqual([...readdirSync(tmpDir(cwd))].sort(), [...names].sort(), "磁盘面 = 路径表（零孤儿件）")
  // 交核文本 = 核 `appendImagePointer` 同输入同输出（指引行零副本 —— 含模型入参可辨）
  const mirror = { role: "user", content: "看图" }
  appendImagePointer(mirror, got.paths, VISION, { depth: 0 })
  assert.equal(got.text, mirror.content, "交核文本 = 核单源等价（指引行 + 词面逐字同）")
  assert.ok(got.text.includes(got.paths[0]), "文本携绝对路径（模型可读面）")
  cleanupTurn(got.paths) // 显式清理本用例（后续臂不共享 cwd）
  assert.deepEqual(filesIn(cwd), [], "清理本回合四件")

  // ② 弃项五源 ⇒ partial 且其余照发（表外媒体类型 / 空载荷 / 非项形 / 超单项阈 / 超合计预算）
  const mixed = prepareTurnAttachments("x", [item("png", 12), { dataURL: "data:image/bmp;base64,AAAA" }, null, item("jpeg", 15)], { cwd, model: VISION })
  assert.equal(mixed.degraded, PARTIAL, "表外媒体类型 + 非项形 ⇒ partial")
  assert.deepEqual(mixed.paths.map((p) => p.split(/[\\/]/).pop().replace(/paste-[0-9a-z]+-/, "")), ["0.png", "3.jpg"], "弃项不重编号（index = 源序）· 其余照发")
  const alone = prepareTurnAttachments("x", [{ dataURL: "data:image/bmp;base64,AAAA" }], { cwd, model: VISION })
  assert.deepEqual([alone.text, alone.paths, alone.degraded], ["x", [], PARTIAL], "全弃 ⇒ partial ∧ 零注入（不阻断发送）")
  const over = prepareTurnAttachments("x", [item("png", IMAGE_MAX_BYTES + 3), item("gif", 9)], { cwd, model: VISION })
  assert.deepEqual([over.paths.length, over.degraded], [1, PARTIAL], `单项 > ${IMAGE_MAX_BYTES} 弃 ⇒ 其余照发`)
  // 合计预算：`running + size ≤ TURN_MAX_BYTES` 才收 —— 溢出项弃后**继续扫**（后到小件仍收）
  const big = dataUrl("png", Math.ceil(TURN_MAX_BYTES / 3) + 1)
  const budget = prepareTurnAttachments("x", [{ dataURL: big }, { dataURL: big }, { dataURL: big }, item("webp", 3)], { cwd, model: VISION })
  assert.deepEqual(
    [budget.paths.length, budget.degraded, budget.paths.at(-1).split(/[\\/]/).pop().split("-").at(-1) === "3.webp"],
    [3, PARTIAL, true],
    "合计超阈 ⇒ 溢出项弃（第 3 件）+ 后到小件仍收（第 4 件）",
  )
  const spent = budget.paths.reduce((n, p) => n + statSync(p).size, 0)
  assert.ok(spent <= TURN_MAX_BYTES, `落盘合计 ≤ ${TURN_MAX_BYTES}（实 ${spent}）`)
  // ③ 无 cwd ⇒ 全弃 + partial（零抛 · 一次诊断 —— 宿主取值面缺口可见）
  const errs = captureErrors(t)
  const noCwd = prepareTurnAttachments("x", [item("png", 12)], { model: VISION })
  assert.deepEqual([noCwd.text, noCwd.paths, noCwd.degraded], ["x", [], PARTIAL], "无 cwd ⇒ 全弃（不阻断）")
  assert.equal(errs.length, 1, "无 cwd ⇒ 恰一次诊断（零静默）")
  // ④ 清理面：他回合件保留（不删目录）· 幂等（非数组 / 缺件零抛）
  const foreign = join(tmpDir(cwd), "paste-otherturn-0.png")
  writeFileSync(foreign, "x")
  cleanupTurn(["gone-already"]); cleanupTurn(null)
  assert.equal(existsSync(foreign), true, "他回合件保留（清理只认传入路径 · 不删目录）")
  assert.equal(existsSync(tmpDir(cwd)), true, "清理不删目录")
})

// ─── U145 回执三形 + 宿主接线（项 5+6）───────────────────────────────
test("U145: 宿主接线 —— send 携图 ⇒ run 收装配文本 · 三径结算同清理 · 挂点序（坏径零落盘）", async (t) => {
  const cwd = projectRoot(t, "host")
  // ① 全收：回执纯 ok · run 收装配文本 · 在飞件在场 · resolve ⇒ done + 清理
  const a = captureRun()
  const h = makeHost({ cwd, run: a.run })
  const receipt = await h.host.send(KEY, "看图", [item("png", 12)])
  assert.deepEqual(receipt, { ok: true }, "全收 ⇒ 回执第一形（纯 ok）")
  const live = filesIn(cwd).map((n) => join(tmpDir(cwd), n))
  assert.deepEqual([live.length, existsSync(live[0]), a.box.text.includes(live[0])], [1, true, true], "在飞 ⇒ 件在场且路径已入交核文本")
  assert.equal(a.box.opts.signal.aborted, false, "run 收 {signal}（未中断）")
  a.box.resolve()
  await flush()
  assert.deepEqual([filesIn(cwd), h.out.filter(([, p]) => p.event === "done").length], [[], 1], "resolve ⇒ done + 本回合件清（项 6）")
  // ② 非视觉模型：回执携降级码 · 文本尾随说明（locale 读装配实例 `config.locale`）· 零落盘
  const cwd2 = projectRoot(t, "host-blind")
  const b = captureRun()
  const h2 = makeHost({ cwd: cwd2, model: BLIND, locale: "zh", run: b.run })
  assert.deepEqual(await h2.host.send(KEY, "看图", [item("png", 12)]), { ok: true, degraded: NON_VISION }, "非视觉 ⇒ 回执第二形")
  assert.equal(b.box.text, `看图\n\n${HOST_DICT.zh[NON_VISION_KEY]}`, "装配文本入 run（词面经 `config.locale` 定局）")
  assert.deepEqual(filesIn(cwd2), [], "非视觉径零落盘")
  // ③ 弃项：回执携 `partial` · 其余照发
  const cwd3 = projectRoot(t, "host-partial")
  const c = captureRun()
  const h3 = makeHost({ cwd: cwd3, run: c.run })
  assert.deepEqual(await h3.host.send(KEY, "x", [item("bmp", 12), item("png", 12)]), { ok: true, degraded: PARTIAL }, "弃项 ⇒ 回执第三形")
  assert.ok(c.box.text.includes(".thincoder"), "弃项不阻断：受理件仍入交核文本")
  c.box.resolve()
  await flush()
  // ④ 错误 / 中断径同样清（`finally` 单点）+ 三径各出一次回合尾事件
  const cwd4 = projectRoot(t, "host-abort")
  const d = captureRun()
  const h4 = makeHost({ cwd: cwd4, run: d.run })
  await h4.host.send(KEY, "x", [item("png", 9)])
  assert.equal(filesIn(cwd4).length, 1, "起跑即落盘")
  h4.host.interrupt(KEY)
  d.box.reject(new Error("AbortError: aborted"))
  await flush()
  assert.deepEqual([filesIn(cwd4), h4.out.filter(([, p]) => p.event === "stopped").length], [[], 1], "中断径 ⇒ stopped + 件同样清")
  // ⑤ 挂点序：坏径（bad-key / provider-invalid）先于附件装配 ⇒ 零落盘零假动作
  const cwd5 = projectRoot(t, "host-bad")
  const e = captureRun()
  const h5 = makeHost({ cwd: cwd5, run: e.run })
  assert.deepEqual(await h5.host.send("nope", "x", [item("png", 12)]), { ok: false, reason: "bad-key" }, "坏键 ⇒ 附件面零进入")
  const h6 = makeHost({ cwd: cwd5, invalid: true, run: e.run })
  assert.deepEqual(await h6.host.send(KEY, "x", [item("png", 12)]), { ok: false, reason: "provider-invalid" }, "provider 无效 ⇒ 零假回合")
  assert.equal(existsSync(join(cwd5, ".thincoder")), false, "两坏径皆零落盘（挂点在判定之后）")
})
