/**
 * 2026-09-30-pool-width-drag.test.mjs — 批内件（右栏宽度拖动批 · 台账 #742 · 实施轮）。
 * 判据表 = 批档 `docs/batches/2026-09-30-pool-width-drag.md` §2（KD-58 机制 ∥ 评审修复轮 #1–#6）∥ §五（五腿）。
 * 五腿（全绿 = 批内验收）：
 *   腿 1 拖柄在盘：`index.html`（`data-pool-resizer`）∥ `chrome.css`（`.pool-resizer`）∥ `pool-width.mjs` 三处字面；
 *   腿 2 持久化写读：存储值 ⇒ 装配读回（内联 `--pool-w` = 该值）∥ 落定 ⇒ `setItem` 收读回实宽 ∥ 非法值（`"abc"` ∥ 负 ∥ NaN 族）降级
 *        ∥ storage 抛两臂（读抛 ⇒ `console.error` + 零抛 + 降级；写抛 ⇒ `console.error` + 会话内照常）；
 *   腿 3 未拖过零写：无存储 ⇒ `setProperty` 调用数 0（`--pool-w` 恒等默认）；
 *   腿 4 落定读回：假 rect 300.4 ⇒ 存储 300（取整读取回值——所见即所存）∥ 序臂（rAF 待写在场 ⇒ 撤帧 + 同步落待值先行于读回
 *        ∥ 落定后零迟到写）∥ rAF 合帧（每帧至多一写——中间移动丢弃）；
 *   腿 5 仲裁负控：`pool-width.mjs` import 面零 `store` ∥ `events` + 界三常量仅 `chrome.css` 一处字面（模块侧零界常量）。
 * 附臂（测试面随修随加 · 不占设计条目）：可及名注入两值（裁决 B 载重径 —— boot 词表置位点 + locale 支同源）。
 * 夹具口径：全假件（假 doc ∥ win ∥ storage ∥ 拖柄 —— 注入缝 `{ doc, win, storage, root }`）；rAF 由手动 `flushFrames` 驱动。
 * 本件不进仓套件（批内件 · 随批留存）；跑法（仓根 `thincoder/`）：
 *   node --test docs/batches/2026-09-30-pool-width-drag.test.mjs
 */
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
const rel = (p) => resolve(ROOT, p)
const src = (p) => readFileSync(rel(p), "utf8")

if (!src("thincoder-desktop/renderer/pool-width.mjs")) throw new Error(`从仓库根（thincoder/）运行（cwd = ${ROOT}）`)
const { initPoolWidth, refreshResizerLabel } = await import(pathToFileURL(rel("thincoder-desktop/renderer/pool-width.mjs")).href)

// ─── 夹具 ────────────────────────────────────────────────────────────────────

const KEY = "thincoder.desktop.poolWidth"

/** 假环境（注入缝面）：记录 CSSOM 写（`cssWrites`）/ 动作序（`seq`——序臂面）/ rAF 排程（`rafs`）。 */
function createEnv({ stored = undefined, rect = 576, throwRead = false, throwWrite = false } = {}) {
  const cssWrites = []
  const seq = [] // 元素 = [动作, …]：css ∥ cancel ∥ read ∥ class-add ∥ class-remove ∥ capture ∥ store-set
  const classes = new Set()
  const data = new Map()
  if (stored !== undefined) data.set(KEY, stored)
  const doc = {
    documentElement: { style: { setProperty(name, value) { cssWrites.push([name, value]); seq.push(["css", name, value]) } } },
    body: {
      classList: {
        add: (name) => { classes.add(name); seq.push(["class-add", name]) },
        remove: (name) => { classes.delete(name); seq.push(["class-remove", name]) },
      },
    },
  }
  const box = { width: rect, getBoundingClientRect() { seq.push(["read", box.width]); return { width: box.width } } }
  const listeners = new Map()
  const attrs = new Map()
  const root = {
    parentElement: box,
    addEventListener(type, fn) { listeners.set(type, fn) },
    setPointerCapture() { seq.push(["capture"]) },
    setAttribute(name, value) { attrs.set(name, value) },
  }
  const rafs = new Map()
  let rafSeq = 0
  const cancelled = []
  const win = {
    requestAnimationFrame(fn) { const id = ++rafSeq; rafs.set(id, fn); return id },
    cancelAnimationFrame(id) { cancelled.push(id); seq.push(["cancel", id]); rafs.delete(id) },
  }
  const storage = {
    getItem(key) { if (throwRead) throw new Error("read-boom"); return data.has(key) ? data.get(key) : null },
    setItem(key, value) { if (throwWrite) throw new Error("write-boom"); data.set(key, value); seq.push(["store-set", key, value]) },
  }
  return {
    doc, win, storage, root, box, cssWrites, seq, classes, data, rafs, cancelled, attrs,
    init: () => initPoolWidth({ doc, win, storage, root }),
    fire(type, event) { const fn = listeners.get(type); assert.equal(typeof fn, "function", `listener ${type} in place`); fn(event) },
    flushFrames() { const fns = [...rafs.values()]; rafs.clear(); for (const fn of fns) fn() },
  }
}

/** 指针事件假件（`pointerId` 恒 1；`preventDefault` 记录到序）。 */
const ev = (x) => ({ clientX: x, pointerId: 1, preventDefault() {} })

/** `console.error` 捕获（同步面——断言行数 = 零静默判据）。 */
function capture(fn) {
  const lines = []
  const original = console.error
  console.error = (...args) => { lines.push(args.map(String).join(" ")) }
  try { return { value: fn(), lines } } finally { console.error = original }
}

// ─── 腿 1 · 拖柄在盘（骨架 ∥ 样式 ∥ 模块三处字面）──────────────────────────────

test("腿 1 · 拖柄在盘：骨架 ∥ 样式 ∥ 模块三处字面", () => {
  const html = src("thincoder-desktop/renderer/index.html")
  assert.match(html, /class="pool-resizer"/)
  assert.match(html, /data-pool-resizer/)
  assert.match(html, /role="separator"/)
  assert.match(html, /aria-orientation="vertical"/)
  const css = src("thincoder-desktop/renderer/chrome.css")
  assert.match(css, /\.pool-resizer\b/)
  const mod = src("thincoder-desktop/renderer/pool-width.mjs")
  assert.match(mod, /data-pool-resizer/)
})

// ─── 腿 2 · 持久化写读（读回 ∥ 落定写入 ∥ 非法降级 ∥ 抛出两臂）──────────────────

test("腿 2 · 持久化写读：读回应用 ∥ 落定写入 ∥ 非法降级 ∥ 抛出两臂", () => {
  // (a) 存储值在场 ⇒ 装配读回（内联 `--pool-w` = 该值）
  const envA = createEnv({ stored: "300" })
  envA.init()
  assert.deepEqual(envA.cssWrites, [["--pool-w", "300px"]])

  // (b) 落定 ⇒ setItem 收读回实宽（300.4 ⇒ 300）；归一写回同值
  const envB = createEnv()
  envB.init()
  envB.box.width = 512
  envB.fire("pointerdown", ev(500))
  envB.box.width = 300.4
  envB.fire("pointermove", ev(300))
  envB.flushFrames()
  envB.fire("pointerup", ev(300))
  assert.equal(envB.data.get(KEY), "300")
  assert.deepEqual(envB.cssWrites.at(-1), ["--pool-w", "300px"])
  assert.ok(envB.seq.some((e) => e[0] === "class-add" && e[1] === "pool-resizing"), "拖动期类在场")
  assert.ok(envB.seq.some((e) => e[0] === "class-remove" && e[1] === "pool-resizing"), "落定撤类")
  assert.deepEqual(envB.cancelled, [], "无待写 ⇒ 落定前置零动作（不撤帧）")

  // (c) 非法存储值 ⇒ 视同未拖过（零内联写）
  for (const bad of ["abc", "-5", "NaN", "", "0", "-0", "Infinity"]) {
    const env = createEnv({ stored: bad })
    env.init()
    assert.deepEqual(env.cssWrites, [], `非法值降级：${JSON.stringify(bad)}`)
  }

  // (d) storage 抛 —— 读抛：console.error + 零抛 + 降级（零内联写）
  const envD = createEnv({ throwRead: true })
  const read = capture(() => envD.init())
  assert.equal(read.lines.length, 1, "读失败 ⇒ 恰一行零静默")
  assert.deepEqual(envD.cssWrites, [], "读失败 ⇒ 视同未拖过")

  // (d) storage 抛 —— 写抛：console.error + 会话内照常（归一写回仍生效）
  const envE = createEnv({ throwWrite: true })
  envE.init()
  envE.box.width = 512
  envE.fire("pointerdown", ev(500))
  envE.box.width = 301.6
  envE.fire("pointermove", ev(200))
  envE.flushFrames()
  const write = capture(() => envE.fire("pointerup", ev(200)))
  assert.equal(write.lines.length, 1, "写失败 ⇒ 恰一行零静默")
  assert.deepEqual(envE.cssWrites.at(-1), ["--pool-w", "302px"], "写失败 ⇒ 会话内照常生效（fail-soft）")
})

// ─── 腿 3 · 未拖过零写（`--pool-w` 恒等默认）────────────────────────────────────

test("腿 3 · 未拖过零写：无存储 ⇒ 零内联写", () => {
  const env = createEnv()
  env.init()
  assert.equal(env.cssWrites.length, 0)
  assert.equal(env.cssWrites.filter(([name]) => name === "--pool-w").length, 0)
})

// ─── 腿 4 · 落定读回 + 序臂 + rAF 合帧 ──────────────────────────────────────────

test("腿 4 · 落定读回（所见即所存）+ 序臂 + rAF 合帧", () => {
  // (a) 假 rect 300.4 ⇒ 存储 300（取整读取回值）
  const envA = createEnv()
  envA.init()
  envA.box.width = 400
  envA.fire("pointerdown", ev(500))
  envA.box.width = 300.4
  envA.fire("pointermove", ev(300))
  envA.flushFrames()
  envA.fire("pointerup", ev(300))
  assert.equal(envA.data.get(KEY), "300")

  // (b) 序臂：rAF 待写在场 ⇒ 撤帧 + 同步落待值先行于读回 ∥ 落定后零迟到写
  const envB = createEnv()
  envB.init()
  envB.box.width = 400
  envB.fire("pointerdown", ev(500))
  envB.fire("pointermove", ev(100)) // pending = 400 + 400 = 800（未刷）
  assert.equal(envB.rafs.size, 1)
  const rafId = [...envB.rafs.keys()][0]
  envB.box.width = 300.4
  envB.fire("pointerup", ev(100))
  assert.deepEqual(envB.cancelled, [rafId], "落定前置：撤帧")
  assert.equal(envB.rafs.size, 0)
  const iCancel = envB.seq.findIndex((e) => e[0] === "cancel")
  const iSync = envB.seq.findIndex((e) => e[0] === "css" && e[2] === "800px")
  const iRead = envB.seq.findIndex((e, i) => e[0] === "read" && i > iSync)
  assert.ok(iCancel !== -1 && iSync !== -1 && iRead !== -1)
  assert.ok(iCancel < iSync, "撤帧先于同步落待值")
  assert.ok(iSync < iRead, "同步落待值先于落定读回（末次 move 位不丢）")
  assert.equal(envB.data.get(KEY), "300", "读回实宽落存储（所见即所存）")
  const writesAfter = envB.cssWrites.length
  envB.flushFrames() // 残余帧（应为空 —— 零迟到写）
  envB.fire("pointermove", ev(50)) // 落定后迟到 move（零动作）
  assert.equal(envB.cssWrites.length, writesAfter, "落定后零迟到写")

  // (c) rAF 合帧：连发三 move ⇒ 每帧至多一写（中间移动丢弃 —— 写末位值）
  const envC = createEnv()
  envC.init()
  envC.box.width = 400
  envC.fire("pointerdown", ev(500))
  envC.fire("pointermove", ev(490))
  envC.fire("pointermove", ev(480))
  envC.fire("pointermove", ev(470))
  assert.equal(envC.rafs.size, 1, "一帧至多一排程")
  envC.flushFrames()
  assert.deepEqual(envC.cssWrites.filter(([n]) => n === "--pool-w"), [["--pool-w", "430px"]], "每帧至多一写")
})

// ─── 腿 5 · 仲裁负控（零 store ∥ events import + 界单落点）──────────────────────

test("腿 5 · 仲裁负控：模块零 store ∥ events 依赖 + 界三常量仅 chrome.css 一处", () => {
  const mod = src("thincoder-desktop/renderer/pool-width.mjs")
  const imports = [...mod.matchAll(/import\s[^;]*?from\s+["']([^"']+)["']/g)].map((m) => m[1])
  assert.ok(imports.length >= 1, "至少一条 import（词面）")
  for (const spec of imports) assert.ok(!/store|events/.test(spec), `import 面零 store ∥ events：${spec}`)
  for (const token of ["15rem", "36rem", "30rem"]) {
    assert.ok(!mod.includes(token), `pool-width.mjs 不含界字面 ${token}`)
    assert.ok(!src("thincoder-desktop/renderer/app.mjs").includes(token), `app.mjs 不含界字面 ${token}`)
  }
  const css = src("thincoder-desktop/renderer/chrome.css")
  const clamp = "clamp(15rem, var(--pool-w), max(36rem, 100vw - 30rem))"
  assert.equal(css.split(clamp).length - 1, 1, "界 = chrome.css 栅格行单落点")
})

// ─── 附臂 · 可及名注入（裁决 B 载重径 —— 测试面随修随加 · 不占设计条目）────────────

test("附臂 · 可及名注入：en ∥ zh 两值", async () => {
  const i18n = await import(pathToFileURL(rel("thincoder-desktop/renderer/i18n.mjs")).href)
  const env = createEnv()
  refreshResizerLabel({ doc: env.doc, root: env.root })
  assert.equal(env.attrs.get("aria-label"), "Resize activity panel")
  i18n.initDict({ locale: "zh", dict: {} })
  try {
    refreshResizerLabel({ doc: env.doc, root: env.root })
    assert.equal(env.attrs.get("aria-label"), "拖动调整活动栏宽度")
  } finally {
    i18n.initDict({ locale: "en", dict: {} }) // 复位（i18n 模块级语言态 —— 防跨用例污染）
  }
})
