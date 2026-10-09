/**
 * 2026-10-08-proxy-per-channel.test.mjs — 批内件（proxy 逐渠独立批（去全局闸）；随批档存档；直接跑：node --test）。
 *
 * 用例单源 = 批档 `docs/batches/2026-10-08-proxy-per-channel.md` §2.5（T1–T8；读法以 §2.13 收正块为准）：
 *  - T1 拆档面：三档在盘 ∥ ≤300 咨询线 ∥ facade 导出集 ⊇ 旧七名（再出口 ≡ 新档原体）
 *  - T2 判定式：`injectProxy` 三态 × 盘上 `model` 键两值零影响（含 env 回落在案 guard——D-PX4）
 *  - T3 探针字段面：`probeTargetOf` 同三态 + `headers` 门（plain object ⇒ 携；缺 ∥ 非法 ⇒ 零键）
 *  - T4 VSC 门句：源零 `proxyCfg.model` 合取 + 行为腿（旗 ∧ uri ⇒ `proxyUri`；无 uri ⇒ 零）
 *  - T5 #1048②：`setup-wizard` 探针 ≡ 写后运行态（假 HOME 子进程实跑 + 假代理回放实捕）
 *  - T6 文案面：`settings.proxyModel` 两语零命中（A 案）∥ `proxyRowTitle` 值净（两语两端——零「proxy.model」字样）∥ `provider-admin` 问句尾注零残留
 *  - T7 #1040：`webview/settings-providers.js` 零 `_delKey` 字面（宿主链保留）
 *  - T8 全局面（A 形腿）：VSC `settings-env.js` 零 `px-model` ∥ 桌面 env 树零 `proxy.model` 节点（三档 = 段体 ∥ 读切片 ∥ 主侧；store ∥ views 两档随 #1090 扩腿闭合并断言——见 ②′） ∥ CLI 菜单随形A（全局面模型行删）
 *  - W1 ∥ W2 向导补步（#1049——`docs/core/design/PROXY.md` §5 设计落法；2026-10-08 裁「补步」）：
 *    两向导末问「走 proxy」（形 ≡ add 流既有问句——`provider-admin.mjs:74`∥`:102`）；答 Yes ⇒ 条目 `proxy: true`，
 *    No ∥ 缺省 ⇒ 零 `proxy` 键（渠道条目照落）。W1 首配向导（`src/cli/setup-wizard.mjs`——readline `ask` 载 y/N）
 *    ∥ W2 TUI 向导（`src/tui/wizard.mjs`——`showPicker` 同形调用，ctx 注入）——两腿均假 HOME 子进程实跑（W2 = mock ctx 行为腿）。
 *
 * 补全（A 案落讫——2026-10-08 · `proxy.model` 键退役）：T6 全三条 ∥ T8 三端腿随本件落（#41 报表项 4）；
 * T5 ∥ W1 共用向导实跑 harness（假 HOME 子进程——答卷末项 = #1049「走 proxy」问句）；
 * M604 原档随正已由父侧落讫（选择器去 `[name="proxy.model"]` 恰 1 行），非本件面。
 * 启动形 = **绝对路径（大写盘符）**：相对 ∥ 小写盘符形有 `@thincoder/core` 符号链接 realpath 大小写分裂伪红（T4——批档 §5 A案落 报表项 3，勿用）。
 * 真 `~/.thincoder/config.json` 绝不触碰：配置面用例一律 tmp 注入（`_setConfigPathForTest`），
 * 向导用例走假 HOME 子进程（`HOME` ∥ `USERPROFILE` 重定向）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { spawnSync } from "node:child_process"

const HERE = dirname(fileURLToPath(import.meta.url)) // docs/batches
const ROOT = join(HERE, "..", "..") // 仓根（thincoder/）
const CORE = pathToFileURL(join(ROOT, "thincoder-core") + "/").href
const VSC = pathToFileURL(join(ROOT, "thincoder-vscode") + "/").href
const CLI = join(ROOT, "thincoder-cli")

const read = (rel) => readFileSync(join(ROOT, rel), "utf8")
/** 内容行数（尾空行不計——同 `2026-09-29-structure-split-2.test.mjs` 口径）。 */
const lineCount = (rel) => {
  const parts = read(rel).split("\n")
  if (parts.at(-1) === "") parts.pop()
  return parts.length
}
const tmpConfigPath = () => join(mkdtempSync(join(tmpdir(), "tc-proxy-pc-")), "config.json")

// ═══ T1 拆档面（#1037 · D-PX10）═══

test("T1 拆档面：三档在盘 ∥ ≤300 咨询线 ∥ facade 导出集 ⊇ 旧七名（再出口 ≡ 新档原体）", async () => {
  const files = ["thincoder-core/proxy.mjs", "thincoder-core/proxy-target.mjs", "thincoder-core/proxy-transport.mjs"]
  for (const f of files) assert.ok(existsSync(join(ROOT, f)), `${f} 在盘`)
  const [main, target, transport] = files.map(lineCount)
  assert.ok(main <= 300, `proxy.mjs = ${main} 应 ≤300（咨询线）`)
  assert.ok(target <= 300 && transport <= 300, `新两档 = ${target} ∥ ${transport} 应 ≤300（三档同口径）`)
  // facade（消费面 import 零改）：旧七名在场
  const facade = await import(CORE + "proxy.mjs")
  for (const n of ["resolveProxyConfig", "resolveWebProxy", "isLoopbackTarget", "injectProxy", "streamHttpResponse", "tunnelHttps", "proxyFetch"]) {
    assert.equal(typeof facade[n], "function", `facade 导出 ${n}`)
  }
  // 再出口 ≡ 新档原体（同一函数对象——非二份拷贝）
  const t = await import(CORE + "proxy-target.mjs")
  const tr = await import(CORE + "proxy-transport.mjs")
  assert.equal(facade.resolveProxyConfig, t.resolveProxyConfig, "resolveProxyConfig 再出口 ≡ proxy-target 原体")
  assert.equal(facade.resolveWebProxy, t.resolveWebProxy, "resolveWebProxy 再出口 ≡ proxy-target 原体")
  assert.equal(facade.isLoopbackTarget, t.isLoopbackTarget, "isLoopbackTarget 再出口 ≡ proxy-target 原体")
  assert.equal(facade.streamHttpResponse, tr.streamHttpResponse, "streamHttpResponse 再出口 ≡ proxy-transport 原体")
  assert.equal(facade.tunnelHttps, tr.tunnelHttps, "tunnelHttps 再出口 ≡ proxy-transport 原体")
  console.log(`[读数] T1 行数：proxy.mjs ${main} ∥ proxy-target.mjs ${target} ∥ proxy-transport.mjs ${transport}（皆 ≤300）· facade 七名在场`)
})

// ═══ T2 判定式（#1042 · D-PX1）═══

test("T2 injectProxy：逐渠旗 ∧ uri 在案（三态）∥ 盘上 model 键两值零影响", async () => {
  const { injectProxy } = await import(CORE + "proxy.mjs")
  const one = (flag) => [{ name: "p", ...(flag === undefined ? {} : { proxy: flag }) }]
  const URI = "http://127.0.0.1:7890"
  // ① 旗 ∧ uri 在案 ⇒ 注入（model 真 ∥ 假同值——零影响；裸串形 = 旧格式兼容同在案）
  for (const model of [true, false]) {
    const ps = one(true)
    injectProxy(ps, { proxy: { uri: URI, model } })
    assert.equal(ps[0].proxyUri, URI, `旗 ∧ uri 在案 ⇒ 注入（model:${model} 零影响）`)
  }
  const psStr = one(true)
  injectProxy(psStr, { proxy: URI })
  assert.equal(psStr[0].proxyUri, URI, "裸串形在案（旧格式兼容）⇒ 注入")
  // ② 旗 ∧ uri 不在案 ⇒ 零注入（proxy 字段缺席 ∥ 无 uri ∥ 显式 null）
  for (const cfg of [{}, { proxy: { web: true } }, { proxy: null }]) {
    const ps = one(true)
    injectProxy(ps, cfg)
    assert.equal(ps[0].proxyUri, undefined, `旗 ∧ uri 不在案 ⇒ 零注入（${JSON.stringify(cfg)}）`)
  }
  // ③ env 回供不算「在案」（D-PX4）：盘上 proxy 字段缺席 ⇒ env 在案亦零注入
  const bakHttps = process.env.HTTPS_PROXY
  process.env.HTTPS_PROXY = "http://env-proxy:1"
  try {
    const ps = one(true)
    injectProxy(ps, {})
    assert.equal(ps[0].proxyUri, undefined, "env 回落不供模型代理（逐渠旗只对在案 uri 生效）")
  } finally {
    if (bakHttps === undefined) delete process.env.HTTPS_PROXY
    else process.env.HTTPS_PROXY = bakHttps
  }
  // ④ 无旗 ∥ 旗非真 ⇒ 零注入（uri 在案亦然）
  for (const flag of [undefined, false]) {
    const ps = one(flag)
    injectProxy(ps, { proxy: { uri: URI } })
    assert.equal(ps[0].proxyUri, undefined, `无旗（proxy=${String(flag)}）⇒ 零注入（uri 在案亦然）`)
  }
  // ⑤ 恒赋值语义：既存 proxyUri 复跑（无在案 uri）⇒ 清残不残留
  const ps = [{ name: "p", proxy: true, proxyUri: "http://stale:1" }]
  injectProxy(ps, {})
  assert.equal(ps[0].proxyUri, undefined, "无在案 uri ⇒ 既存 proxyUri 被清（恒赋值）")
  console.log("[读数] T2 判定矩阵：9 态（旗 ∧ uri × model 两值 ∥ 缺 uri 三形 ∥ env ∥ 无旗两值 ∥ 清残）全中")
})

// ═══ T3 探针字段面（#1048①）═══

test("T3 probeTargetOf：三态同判 ∥ headers 仅 plain-object 携（缺 ∥ 非法 ⇒ 零键）", async () => {
  const { _setConfigPathForTest, _resetConfigPathForTest } = await import(CORE + "config-io.mjs")
  const { probeTargetOf } = await import(CORE + "provider-flows.mjs")
  const cfgPath = tmpConfigPath()
  _setConfigPathForTest(cfgPath)
  const writeProxy = (extra) => writeFileSync(cfgPath, JSON.stringify({ proxy: { uri: "http://127.0.0.1:9", ...extra } }))
  try {
    // ① 旗 ∧ uri 在案 ⇒ 携（model 两值零影响）
    writeProxy({ model: true })
    assert.equal(probeTargetOf({ name: "p", baseURL: "https://p.example.com/v1", proxy: true }).proxyUri, "http://127.0.0.1:9", "旗 ∧ uri 在案 ⇒ proxyUri 携")
    writeProxy({ model: false })
    assert.equal(probeTargetOf({ name: "p", baseURL: "https://p.example.com/v1", proxy: true }).proxyUri, "http://127.0.0.1:9", "盘上 model:false 零影响（逐渠）")
    // ② 无旗 ⇒ 零（uri 在案亦然）
    assert.equal(probeTargetOf({ name: "p", baseURL: "https://p.example.com/v1" }).proxyUri, undefined, "无旗 ⇒ 零")
    assert.equal(probeTargetOf({ name: "p", baseURL: "https://p.example.com/v1", proxy: false }).proxyUri, undefined, "旗非真 ⇒ 零")
    // ③ 旗 ∧ uri 不在案 ⇒ 零
    writeFileSync(cfgPath, JSON.stringify({ proxy: { web: true } }))
    assert.equal(probeTargetOf({ name: "p", baseURL: "https://p.example.com/v1", proxy: true }).proxyUri, undefined, "旗 ∧ uri 不在案 ⇒ 零")
    // ④ env 回供不算在案（D-PX4）：盘上 proxy 字段缺席 ⇒ env 在案亦零（探针读盘不读 env）
    writeFileSync(cfgPath, JSON.stringify({}))
    const bakEnv = process.env.HTTPS_PROXY
    process.env.HTTPS_PROXY = "http://env-proxy:1"
    try {
      assert.equal(probeTargetOf({ name: "p", baseURL: "https://p.example.com/v1", proxy: true }).proxyUri, undefined, "env 回落不供探针代理目标")
    } finally {
      if (bakEnv === undefined) delete process.env.HTTPS_PROXY
      else process.env.HTTPS_PROXY = bakEnv
    }
    // ⑤ headers 门：plain object ⇒ 携
    writeProxy({ model: true })
    const h = { "X-Extra": "1" }
    assert.deepEqual(probeTargetOf({ name: "p", headers: h }).headers, h, "plain object ⇒ headers 携")
    // 缺 ∥ 非法（null ∥ 数组 ∥ 串 ∥ 数）⇒ 零键
    for (const bad of [undefined, null, ["X-Extra", "1"], "X-Extra: 1", 7]) {
      assert.equal("headers" in probeTargetOf({ name: "p", headers: bad }), false, `headers 非法（${JSON.stringify(bad)}）⇒ 零键`)
    }
    // ⑥ 同档其余字段面零改（apiKey 归一律）
    assert.equal(probeTargetOf({ name: "p", apiKey: " sk " }).apiKey, "sk", "apiKey trim 归一不变")
  } finally {
    _resetConfigPathForTest()
  }
  console.log("[读数] T3 探针：三态 7 断（含 env 不在案）+ headers 门 1 携 5 零键 —— 全中")
})

// ═══ T4 VSC 门句（第二注入点 · 2.3.1②）═══

test("T4 VSC providerFromConfig：源零 proxyCfg.model ∥ 行为腿（旗 ∧ uri ⇒ proxyUri；无 uri ⇒ 零）", async () => {
  const src = read("thincoder-vscode/src/extension/presets.mjs")
  assert.equal((src.match(/proxyCfg\.model/g) ?? []).length, 0, "源零 proxyCfg.model 合取（第二注入点同判）")
  const { _setConfigPathForTest, _resetConfigPathForTest } = await import(CORE + "config-io.mjs")
  const { providerFromConfig } = await import(VSC + "src/extension/presets.mjs")
  const cfgPath = tmpConfigPath()
  _setConfigPathForTest(cfgPath)
  const entry = { name: "vsc-p", baseURL: "https://p.example.com/v1", model: "m", apiKey: "sk", proxy: true }
  try {
    writeFileSync(cfgPath, JSON.stringify({ providers: [entry], proxy: { uri: "http://127.0.0.1:7890", model: true } }))
    assert.equal(providerFromConfig("vsc-p").proxyUri, "http://127.0.0.1:7890", "旗 ∧ uri 在案 ⇒ 运行期 provider 携 proxyUri")
    writeFileSync(cfgPath, JSON.stringify({ providers: [entry], proxy: { uri: "http://127.0.0.1:7890", model: false } }))
    assert.equal(providerFromConfig("vsc-p").proxyUri, "http://127.0.0.1:7890", "盘上 model:false 零影响（逐渠）")
    writeFileSync(cfgPath, JSON.stringify({ providers: [entry], proxy: { web: true } }))
    const off = providerFromConfig("vsc-p")
    assert.equal("proxyUri" in off && off.proxyUri !== undefined, false, "uri 不在案 ⇒ 零（键不落）")
  } finally {
    _resetConfigPathForTest()
  }
  console.log("[读数] T4 VSC 注入点：源锁 0 命中 ∥ 行为腿三态全中")
})

// ═══ T5 setup-wizard 探针 ≡ 写后运行态（#1048②）═══

/** 子进程驱动器（住假 HOME）：起假代理 P → 写 fixture config → 跑真 `setupWizard` → 回放读数。 */
const DRIVER = `
import { createServer } from "node:http"
import { writeFileSync } from "node:fs"

const hits = []
const P = createServer((req, res) => {
  hits.push({ url: req.url, xMerged: req.headers["x-merged"] ?? null })
  const body = JSON.stringify({ data: [{ id: "m-1" }] })
  res.writeHead(200, { "content-type": "application/json", "content-length": Buffer.byteLength(body) })
  res.end(body)
})
await new Promise((r) => P.listen(0, "127.0.0.1", r))
const fixture = JSON.parse(process.env.TC_FIXTURE)
fixture.proxy = { uri: "http://127.0.0.1:" + P.address().port }
writeFileSync(process.env.TC_CFG, JSON.stringify(fixture, null, 2))
// 直连径观测点：探针不经代理 ⇒ 必落 fetch（记录后短路——不触外网）
globalThis.fetch = async (u) => { console.log("[DIRECT] " + String(u)); throw new Error("direct-fetch-intercepted") }
const { setupWizard } = await import(process.env.TC_WIZ)
const r = await setupWizard()
console.log("[WIZARD] " + JSON.stringify(r ? r.name : null))
console.log("[PROXY_HITS] " + JSON.stringify(hits))
P.close(); P.closeAllConnections?.()
// 两条管道冲刷后再退（process.exit 不等管道写——读数截断即父侧断言失据）
await new Promise((resolve) => process.stdout.write("", resolve))
await new Promise((resolve) => process.stderr.write("", resolve))
process.exit(0)
`

/** T5 ∥ W1 共用实跑 harness（假 HOME 子进程——真 `~/.thincoder/config.json` 零触）：驱动器落盘 + 参数化 spawn。
 *  返回 spawnSync 结果（stdout = 读数面 ∥ stderr = 提问面）；hitsOf 解析 [PROXY_HITS] 回放。 */
const WIZ_HOME = mkdtempSync(join(tmpdir(), "tc-pc-home-"))
const WIZ_CFG = join(WIZ_HOME, ".thincoder", "config.json")
mkdirSync(dirname(WIZ_CFG), { recursive: true })
const WIZ_DRIVER = join(WIZ_HOME, "wizard-driver.mjs")
writeFileSync(WIZ_DRIVER, DRIVER)
const runWizard = (fixture, answers) => {
  const r = spawnSync(process.execPath, [WIZ_DRIVER], {
    cwd: CLI,
    env: {
      ...process.env, HOME: WIZ_HOME, USERPROFILE: WIZ_HOME,
      TC_CFG: WIZ_CFG, TC_FIXTURE: JSON.stringify(fixture),
      TC_WIZ: pathToFileURL(join(CLI, "src/cli/setup-wizard.mjs")).href,
    },
    input: answers.join("\n") + "\n", encoding: "utf8", timeout: 120_000,
  })
  assert.equal(r.status, 0, `向导子进程应正常退出（stderr 尾：${(r.stderr ?? "").split("\n").slice(-3).join(" / ")}）`)
  return r
}
const hitsOf = (out) => {
  const m = /\[PROXY_HITS\] (.*)/.exec(out)
  assert.ok(m, `子进程应回放 [PROXY_HITS] 读数（stdout=${JSON.stringify(out)}）`)
  return JSON.parse(m[1])
}

test("T5 setup-wizard 探针 ≡ 写后运行态：既有渠（旗 + headers）⇒ 经代理；新渠 ⇒ 直连（假 HOME 子进程实跑）", async () => {
  const { PROVIDER_PRESETS } = await import(CORE + "config.mjs")
  const customChoice = String(Object.keys(PROVIDER_PRESETS).length + 1) // 自定形末项（Custom endpoint）
  // ① 既有渠（盘上旗 + headers）：探针目标 = 合并条目 ⇒ 携 proxyUri（经代理）+ 盘上 headers
  // （末答 = #1049 补步「走 proxy」问句——缺省 No：零键零写 ⇒ 既有旗 upsert 保留）
  const outA = runWizard(
    { providers: [{ name: "tc-wiz", baseURL: "http://tc-wiz.invalid/v1", model: "m-wiz", apiKey: "sk-old", proxy: true, headers: { "X-Merged": "1" } }] },
    [customChoice, "tc-wiz", "http://tc-wiz.invalid/v1", "m-wiz", "sk-new", "", ""],
  ).stdout ?? ""
  assert.ok(!outA.includes("[DIRECT]"), "既有渠：探针未落直连 fetch")
  const hitsA = hitsOf(outA)
  assert.equal(hitsA.length, 1, "既有渠：探针经代理恰一次")
  assert.equal(hitsA[0].url, "http://tc-wiz.invalid/v1/models", "代理侧请求行 = 绝对形")
  assert.equal(hitsA[0].xMerged, "1", "盘上 headers 随合并条目到场（X-Merged 实捕）")
  const afterA = JSON.parse(readFileSync(WIZ_CFG, "utf8"))
  const entryA = afterA.providers.find((p) => p.name === "tc-wiz")
  assert.equal(entryA.proxy, true, "写后（upsert）仍携旗——探针所见 ≡ 运行态")
  assert.deepEqual(entryA.headers, { "X-Merged": "1" }, "写后仍携 headers")
  // ② 新渠：目标零 proxyUri ⇒ 探针直连（代理零命中）；写后零 proxy 键
  const outB = runWizard(
    { providers: [] },
    [customChoice, "tc-wiz-new", "http://tc-wiz.invalid/v1", "m-wiz", "sk-new", "", ""],
  ).stdout ?? ""
  assert.ok(outB.includes("[DIRECT] http://tc-wiz.invalid/v1/models"), "新渠：探针落直连 fetch（origin 面 URL）")
  assert.deepEqual(hitsOf(outB), [], "新渠：代理零命中")
  const afterB = JSON.parse(readFileSync(WIZ_CFG, "utf8"))
  assert.equal("proxy" in afterB.providers.find((p) => p.name === "tc-wiz-new"), false, "新渠写后零 proxy 键")
  console.log(`[读数] T5 既有渠：hits=${JSON.stringify(hitsA)} ∥ 新渠：直连实捕 + hits=[]`)
})

// ═══ T6 文案面（键面 ∥ 值净 ∥ 尾注）═══

test("T6 文案面：proxyModel 两语零命中 ∥ proxyRowTitle 值净（两语两端）∥ provider-admin 尾注零残留", () => {
  // ① settings.proxyModel 键退役（A 案）：两语两端三载体零命中
  for (const f of ["thincoder-vscode/locales/en.json", "thincoder-vscode/locales/zh.json", "thincoder-desktop/renderer/i18n-views.mjs"]) {
    assert.equal((read(f).match(/proxyModel/g) ?? []).length, 0, `${f} 零 proxyModel（键已退役）`)
  }
  // ② proxyRowTitle 值净（两语两端）：零「proxy.model」字样 ∥ 零旧门文案（needs global ∥ 需全局）
  const dirty = /proxy\.model|needs global|需全局/i
  let clean = 0
  for (const f of ["thincoder-vscode/locales/en.json", "thincoder-vscode/locales/zh.json"]) {
    const v = JSON.parse(read(f))["settings.proxyRowTitle"]
    assert.equal(typeof v, "string", `${f} proxyRowTitle 在场`)
    assert.ok(v.length > 0 && !dirty.test(v), `${f} proxyRowTitle 值净：${v}`)
    clean++
  }
  const dskVals = [...read("thincoder-desktop/renderer/i18n-settings.mjs").matchAll(/"settings\.proxyRowTitle":\s*"([^"]*)"/g)].map((m) => m[1])
  assert.equal(dskVals.length, 2, "桌面两语各一（en ∥ zh）")
  for (const v of dskVals) {
    assert.ok(v.length > 0 && !dirty.test(v), `桌面 proxyRowTitle 值净：${v}`)
    clean++
  }
  // ③ provider-admin 尾注零残留（问句本体勿随删）
  const admin = read("thincoder-cli/src/tui/provider-admin.mjs")
  assert.equal((admin.match(/proxy\.model/g) ?? []).length, 0, "provider-admin 零 proxy.model 残留（尾注已随正）")
  assert.equal((admin.match(/needs global/g) ?? []).length, 0, "零 needs global 尾注残留")
  assert.equal((admin.match(/Route this provider's model requests through the proxy/g) ?? []).length, 2, "问句本体两支各一")
  console.log(`[读数] T6 键面三载体 0 命中 ∥ 值净 ${clean}/4（两语两端）∥ provider-admin 尾注 0 ∥ 问句本体 ×2`)
})

// ═══ T7 _delKey 收尸（#1040）═══

test("T7 #1040：webview/settings-providers.js 零 _delKey 字面（宿主链保留）", () => {
  const src = read("thincoder-vscode/webview/settings-providers.js")
  assert.equal((src.match(/_delKey/g) ?? []).length, 0, "webview 档零 _delKey 字面（本体已收尸）")
  // 宿主链保留（协议面——只删本体）：三环在场
  assert.match(read("thincoder-vscode/src/extension/panel-messages.mjs"), /case "deleteProviderKey"/, "宿主链：panel-messages case 在案")
  assert.match(read("thincoder-vscode/src/extension/panel-settings-push.mjs"), /export async function deleteProviderKey/, "宿主链：panel-settings-push 转口在案")
  assert.match(read("thincoder-vscode/src/extension/settings.mjs"), /export async function deleteProviderKey/, "宿主链：settings 执行体在案")
  console.log("[读数] T7 _delKey 0 命中 ∥ 宿主链三环在案")
})

// ═══ T8 全局面（A 形腿——三端）═══

test("T8 全局面：VSC env 卡零 px-model ∥ 桌面 env 树（三档）零 proxy.model 节点 ∥ CLI 菜单随形A", () => {
  // ① VSC env 卡：模型复选行退役（uri ∥ web 两控件在案）
  const vscEnv = read("thincoder-vscode/webview/settings-env.js")
  assert.equal((vscEnv.match(/px-model/g) ?? []).length, 0, "VSC env 卡零 px-model")
  assert.ok(vscEnv.includes("px-uri") && vscEnv.includes("px-web"), "卡本体在案（px-uri ∥ px-web）")
  // ② 桌面 env 树零 proxy.model 节点（三档 = 段体 ∥ 读切片 ∥ 主侧；store ∥ views 两档残留已登记——§5 A案 报表项 2）——含裸 model 键形态（审计观察项 1 闭合）
  const sec = read("thincoder-desktop/renderer/views/settings-sections-env.mjs")
  const reads = read("thincoder-desktop/renderer/mount-settings-reads.mjs")
  const main = read("thincoder-desktop/src/main/settings-env.mjs")
  for (const [f, src] of [["views/settings-sections-env.mjs", sec], ["mount-settings-reads.mjs", reads], ["src/main/settings-env.mjs", main]]) {
    assert.equal((src.match(/proxy[.-]model/g) ?? []).length, 0, `桌面 ${f} 零 proxy.model 节点残`)
  }
  assert.equal((sec.match(/model/gi) ?? []).length, 0, "段体零 model 键任何形态")
  assert.equal((main.match(/model/gi) ?? []).length, 0, "主侧零 model 键任何形态（白名单 ∥ 校验 ∥ 缺省形）")
  const slices = [...reads.matchAll(/proxy: \{[^}]*\}/g)].map((m) => m[0])
  assert.ok(slices.length >= 2, `读切片两形在场（缺省 ∥ ready）——实读 ${slices.length}`)
  for (const s of slices) assert.ok(!/model/i.test(s), `读切片零 model 键：${s}`)
  assert.match(sec, /"data-field": "proxy\.uri"/, "段体在案（proxy.uri 行）")
  assert.match(reads, /proxy: \{ uri:/, "读切片在案（proxy 两键形）")
  assert.match(main, /normalizeProxy/, "主侧在案（normalizeProxy 投影）")
  assert.match(main, /\["uri", "web"\]/, "主侧白名单两键在案")
  // ②′ store ∥ views 两档零残（#1090 扩腿——三形态容错：proxy.model ∥ proxy?.model ∥ proxy: {…model…}）
  for (const f of ["thincoder-desktop/renderer/store.mjs", "thincoder-desktop/renderer/views/settings.mjs"]) {
    const src = read(f)
    assert.equal((src.match(/proxy[?.\s]*\.?model/gi) ?? []).length, 0, `${f} 零 proxy.model 残（含 ?. 形态）`)
    assert.equal((src.match(/proxy:\s*\{[^}]*\bmodel\b/is) ?? []).length, 0, `${f} 零 proxy 内联 model 键残`)
  }
  // ③ CLI 菜单随形A（全局面模型行删——零行 ∥ 零 toggle ∥ 零模板残）
  const cli = read("thincoder-cli/src/tui/cmd-config.mjs")
  assert.equal((cli.match(/Model requests/g) ?? []).length, 0, "菜单行零（Model requests…）")
  assert.equal((cli.match(/togglemodel/g) ?? []).length, 0, "toggle 分支零（togglemodel）")
  assert.equal((cli.match(/model:\s*false/g) ?? []).length, 0, "seturi 模板零 model:false")
  assert.equal((cli.match(/model:\$\{/g) ?? []).length, 0, "proxySummary 零 model: 段")
  assert.ok(cli.includes("Set proxy URI"), "Proxy 子菜单本体在案")
  console.log("[读数] T8：VSC px-model 0 ∥ 桌面 env 树 0（三档 + 裸键形态）∥ store/views 两档 0（#1090 扩腿）∥ CLI 行删 0 残（Model requests ∥ togglemodel ∥ seturi 模板 ∥ 摘要段）")
})

// ═══ W1 ∥ W2 向导补步（#1049——走 proxy 问句 · 2026-10-08 裁「补步」）═══

test("W1 setup-wizard 补步：答 Yes ⇒ 盘上 proxy: true（探针经代理实捕）∥ No ∥ 缺省 ⇒ 零 proxy 键（假 HOME 子进程实跑三案）", async () => {
  const { PROVIDER_PRESETS } = await import(CORE + "config.mjs")
  const customChoice = String(Object.keys(PROVIDER_PRESETS).length + 1) // 自定形末项（Custom endpoint）
  const answersFor = (name, route) => [customChoice, name, "http://tc-wiz.invalid/v1", "m-wiz", "sk-new", "", route]
  // ① 答 Yes：探针条目携答案（探针 ≡ 写后运行态）⇒ 经代理（假代理实捕）；随落盘一次写 ⇒ 盘上 proxy: true
  const rY = runWizard({ providers: [] }, answersFor("tc-wiz-y", "y"))
  assert.ok(rY.stderr.includes("Route this provider's model requests through the proxy"), "问句本体在 stderr（readline ask 载体）")
  assert.ok(!rY.stdout.includes("[DIRECT]"), "答 Yes：探针未落直连（探针条目携答案）")
  const hitsY = hitsOf(rY.stdout)
  assert.equal(hitsY.length, 1, "答 Yes：探针经代理恰一次")
  assert.equal(hitsY[0].url, "http://tc-wiz.invalid/v1/models", "代理侧请求行 = 绝对形")
  assert.equal(JSON.parse(readFileSync(WIZ_CFG, "utf8")).providers.find((p) => p.name === "tc-wiz-y").proxy, true, "答 Yes ⇒ 盘上 proxy: true")
  // ② 答 No：零键零写 + 直连探针（代理零命中）
  const rN = runWizard({ providers: [] }, answersFor("tc-wiz-n", "n"))
  assert.ok(rN.stdout.includes("[DIRECT] http://tc-wiz.invalid/v1/models"), "答 No：探针落直连")
  assert.deepEqual(hitsOf(rN.stdout), [], "答 No：代理零命中")
  assert.equal("proxy" in JSON.parse(readFileSync(WIZ_CFG, "utf8")).providers.find((p) => p.name === "tc-wiz-n"), false, "答 No ⇒ 零 proxy 键")
  // ③ 缺省（空输入）：同 No
  const rD = runWizard({ providers: [] }, answersFor("tc-wiz-d", ""))
  assert.ok(rD.stdout.includes("[DIRECT]"), "缺省：探针落直连")
  assert.equal("proxy" in JSON.parse(readFileSync(WIZ_CFG, "utf8")).providers.find((p) => p.name === "tc-wiz-d"), false, "缺省 ⇒ 零 proxy 键")
  console.log(`[读数] W1：答 Yes ⇒ proxy:true + 代理实捕 ${hitsY.length} 次（绝对形）∥ 答 No ⇒ 直连 + 零键 ∥ 缺省 ⇒ 直连 + 零键`)
})

/** W2 驱动器（假 HOME 子进程——mock ctx 行为腿）：真 `createWizard` 全流程 × 三答案（yes ∥ no ∥ Esc）；
 *  读数 = picker 调用形（正文 ∥ 两选项）+ persistRaw 捕获的落盘条目；直连探针短路（零真网络）。 */
const W2_DRIVER = `
globalThis.fetch = async (u) => { throw new Error("direct-fetch-intercepted: " + String(u)) }
const { createWizard } = await import(process.env.TC_WIZ)

async function runCase(name, route) {
  const persisted = []
  const pickerCalls = []
  const state = { input: [], cursor: 0 }
  const agent = { providers: [], config: {}, activeProvider: null, activeModel: null }
  let done
  const finished = new Promise((r) => { done = r })
  const ctx = {
    agent, state,
    pushLine: () => {}, pushLabel: () => {}, render: () => {},
    persistRaw: async (fn) => { const raw = { providers: [] }; await fn(raw); persisted.push(JSON.parse(JSON.stringify(raw))) }, // 快照 = 落盘内容（先盘后存语义——探针失败标记等内存态不落盘）
    openModelPicker: async () => { done() },
    onModalClose: () => {},
    showPicker: async (title, entries) => { pickerCalls.push({ title, entries }); return route },
  }
  const w = createWizard(ctx)
  w.startWizard()
  w.wizardChooseProvider({ kind: "custom", name: null, label: "Custom endpoint" })
  // 步序 = name → baseURL → model → format（空 = openai 默认）→ key → embedkey（空 = 跳过）
  const answers = [name, "http://tc-tui-wiz.invalid/v1", "m-tui", "", "sk-new", ""]
  for (const val of answers) {
    state.input = [...val]
    state.cursor = state.input.length
    w.wizardSubmitText()
  }
  await Promise.race([finished, new Promise((_, rej) => setTimeout(() => rej(new Error("wizard flow did not finish")), 10_000))])
  const picker = pickerCalls.at(-1) ?? null
  console.log("[W2] " + JSON.stringify({
    name, route: route?.name ?? null, persists: persisted.length,
    picker: picker ? { title: picker.title, items: picker.entries.map((e) => ({ text: e.text, name: e.name })) } : null,
    provider: persisted.at(-1)?.providers?.[0] ?? null,
  }))
}

await runCase("tc-tui-y", { name: "yes" })
await runCase("tc-tui-n", { name: "no" })
await runCase("tc-tui-esc", null) // Esc = pop 并 resolve(null)（真 showPicker 返形——pickers.mjs）
// 两条管道冲刷后再退（process.exit 不等管道写——读数截断即父侧断言失据）
await new Promise((resolve) => process.stdout.write("", resolve))
await new Promise((resolve) => process.stderr.write("", resolve))
process.exit(0)
`

test("W2 TUI 向导补步：picker 形 ≡ add 流（正文 ∥ 两选项）∥ 答 Yes ⇒ 条目 proxy: true ∥ No ∥ Esc ⇒ 零 proxy 键（mock ctx 假 HOME 实跑）", async () => {
  const home = mkdtempSync(join(tmpdir(), "tc-pc-w2-"))
  const driverPath = join(home, "w2-driver.mjs")
  writeFileSync(driverPath, W2_DRIVER)
  const r = spawnSync(process.execPath, [driverPath], {
    cwd: CLI,
    env: { ...process.env, HOME: home, USERPROFILE: home, TC_WIZ: pathToFileURL(join(CLI, "src/tui/wizard.mjs")).href },
    encoding: "utf8", timeout: 120_000,
  })
  assert.equal(r.status, 0, `W2 子进程应正常退出（stderr 尾：${(r.stderr ?? "").split("\n").slice(-3).join(" / ")}）`)
  const cases = [...(r.stdout ?? "").matchAll(/^\[W2\] (.*)$/gm)].map((m) => JSON.parse(m[1]))
  assert.equal(cases.length, 3, "三答案案读数齐（yes ∥ no ∥ Esc）")
  for (const c of cases) {
    assert.equal(c.persists, 1, `${c.name}：落盘恰一次（随各自落盘一次写）`)
    assert.equal(c.provider.name, c.name, `${c.name}：渠道条目照落（name 在案）`)
    assert.equal("model" in c.provider, false, `${c.name}：渠道条目零 model 键（清除批——不携模型；父侧随正 2026-10-10）`)
    assert.equal(c.picker.title, "Route this provider's model requests through the proxy", `${c.name}：picker 正文 ≡ add 流`)
    assert.deepEqual(c.picker.items, [{ text: "No (direct)", name: "no" }, { text: "Yes (proxy)", name: "yes" }], `${c.name}：两选项 ≡ add 流（缺省 No = 首项）`)
  }
  const byName = Object.fromEntries(cases.map((c) => [c.name, c]))
  assert.equal(byName["tc-tui-y"].provider.proxy, true, "答 Yes ⇒ 条目 proxy: true")
  assert.equal("proxy" in byName["tc-tui-n"].provider, false, "答 No ⇒ 零 proxy 键")
  assert.equal("proxy" in byName["tc-tui-esc"].provider, false, "Esc ⇒ 零 proxy 键")
  console.log("[读数] W2：picker 形 3/3 中（正文 + 两选项逐字）∥ Yes ⇒ proxy:true ∥ No/Esc ⇒ 零键 ∥ 各案落盘恰一次")
})
