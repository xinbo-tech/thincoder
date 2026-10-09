/**
 * 2026-10-07-provider-config-parity-cli.test.mjs — 批内件（核 + CLI 舱；随批档存档；直接跑：node --test）。
 *
 * 三端对齐批（`docs/batches/2026-10-07-provider-config-parity.md`——台账 #1027–#1035）本档腿：
 *  - C1（核）：`addProviderEntry` 受 `proxy`——三径（`true` 落旗 ∥ 缺 ⇒ 零键 ∥ 非真 ⇒ 零键），载荷/落条实读（tmp config 直驱）。
 *  - L1a–L1c（CLI）：三探针点收敛源锁（`provider-admin.mjs` ∥ `cmd-config.mjs` ∥ `wizard.mjs`）+ 添加流代理问句/问序 + 核 `probeTargetOf` 同判定自证（执行）。
 *
 * 用 temp 配置注入（`_setConfigPathForTest`）——绝不触碰真 `~/.thincoder/config.json`。
 * 拆档由来 = 共享件破 500 硬限 ⇒ 按舱拆档（cli ∥ vsc ∥ desktop——收口轮 2026-10-07）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const CORE = new URL("../../thincoder-core/", import.meta.url).href
const CLI = new URL("../../thincoder-cli/", import.meta.url).href

/** temp config 路径（每用例各自目录——隔离真配置）。 */
function tmpConfigPath() {
  return join(mkdtempSync(join(tmpdir(), "tc-provider-parity-")), "config.json")
}

/** 源锁读面（批档 §2.6 机检面 = 读源文本断言字面）。 */
function readSrc(rel) {
  return readFileSync(new URL(rel, CLI), "utf8")
}

// ═══ C1（核 · 舱一）：addProviderEntry 受 proxy——三径 ═══

test("C1 addProviderEntry 受 proxy：true 落旗 ∥ 缺 ⇒ 零键 ∥ 非真 ⇒ 零键（载荷/落条实读——2026-10-09 清除批随正：条目零 `model`）", async () => {
  const { addProviderEntry, _setConfigPathForTest, _resetConfigPathForTest, PROVIDER_PRESETS } =
    await import(CORE + "config-io.mjs")
  const cfgPath = tmpConfigPath()
  _setConfigPathForTest(cfgPath)
  try {
    // ① proxy: true ⇒ 同批落 `proxy: true`
    assert.equal(addProviderEntry({ custom: { name: "tc-a", baseURL: "https://a.example.com/v1" }, proxy: true }), null)
    // ② 缺（payload 无 proxy 键）⇒ 零键
    assert.equal(addProviderEntry({ custom: { name: "tc-b", baseURL: "https://b.example.com/v1" } }), null)
    // ③ 非真 ⇒ 零键（判据 = `=== true`；false ∥ 字符串 "true" 均不落）
    assert.equal(addProviderEntry({ custom: { name: "tc-c", baseURL: "https://c.example.com/v1" }, proxy: false }), null)
    assert.equal(addProviderEntry({ custom: { name: "tc-d", baseURL: "https://d.example.com/v1" }, proxy: "true" }), null)
    // ④ 预设形同径（旗判据在分支合流后——两形共享同一条）
    const presetName = Object.keys(PROVIDER_PRESETS)[0]
    assert.equal(addProviderEntry({ preset: presetName, proxy: true }), null)

    const raw = JSON.parse(readFileSync(cfgPath, "utf8"))
    const get = (n) => raw.providers.find((p) => p?.name === n)
    assert.deepEqual(get("tc-a"), { name: "tc-a", baseURL: "https://a.example.com/v1", proxy: true })
    assert.deepEqual(get("tc-b"), { name: "tc-b", baseURL: "https://b.example.com/v1" })
    assert.deepEqual(get("tc-c"), { name: "tc-c", baseURL: "https://c.example.com/v1" })
    assert.deepEqual(get("tc-d"), { name: "tc-d", baseURL: "https://d.example.com/v1" })
    assert.equal(get(presetName).proxy, true)
    assert.equal(get(presetName).name, presetName)
  } finally {
    _resetConfigPathForTest()
  }
})

// ═══ L1（CLI · 舱一）：三探针点收敛 + 代理问句/问序 + 同判定自证 ═══

test("L1a 三探针点收敛源锁：目标构造 = 核 probeTargetOf（执行体与返形零改）", async () => {
  const admin = readSrc("src/tui/provider-admin.mjs")
  const cmdConfig = readSrc("src/tui/cmd-config.mjs")
  const wizard = readSrc("src/tui/wizard.mjs")
  const catalog = readSrc("src/tui/model-catalog.mjs")
  // ① probeChannelFlow（添加流 ∥ 设 key 流共用的流尾探针）
  assert.ok(admin.includes("probeChannelModels(probeTargetOf(cfg))"), "provider-admin:probeChannelFlow 目标构造应收敛 probeTargetOf")
  // ② /config 默认模型子菜单探针
  assert.ok(cmdConfig.includes("probeChannelModels(probeTargetOf(p))"), "cmd-config 探针行应收敛 probeTargetOf")
  // ③ 首启向导流尾探针
  assert.ok(wizard.includes("probeChannelModels(probeTargetOf(channel))"), "wizard 探针行应收敛 probeTargetOf")
  // D9：执行体（tui/model-catalog.mjs——同名异签名）零改——仍收单 cfg
  assert.ok(catalog.includes("export async function probeChannelModels(providerConfig)"), "执行体签名零改")
})

test("L1b 添加流代理问句：两支各一（No (direct) 缺省 ∥ Yes (proxy)）∥ 问序 key → proxy → 探针", async () => {
  const admin = readSrc("src/tui/provider-admin.mjs")
  // 代理问句两支各一（picker 标题字面 ×2）
  assert.equal((admin.match(/Route this provider's model requests through the proxy/g) ?? []).length, 2, "代理问句应两支各一")
  assert.equal((admin.match(/"No \(direct\)"/g) ?? []).length, 2, "picker 行 No (direct)（缺省项）×2")
  assert.equal((admin.match(/"Yes \(proxy\)"/g) ?? []).length, 2, "picker 行 Yes (proxy) ×2")
  // 仅 Yes 落旗（Esc/No ⇒ 零键零写——两支各一）
  assert.equal((admin.match(/route\?\.name === "yes"/g) ?? []).length, 2, "Yes 为唯一写径")
  assert.equal((admin.match(/cfg\.proxy = true/g) ?? []).length, 2, "两支各落一旗（cfg.proxy = true ×2）")
  // 问序（#1028 · 残余端差登记见批档 §2.9⑤）：key 后、流尾探针前——两支各验
  const customSeg = admin.slice(admin.indexOf('if (se.kind === "custom")'), admin.indexOf("const preset = PRESETS[se.name]"))
  const presetSeg = admin.slice(admin.indexOf("const preset = PRESETS[se.name]"), admin.indexOf("async function removeProviderFlow"))
  for (const [seg, label] of [[customSeg, "custom 支"], [presetSeg, "预设支"]]) {
    const ik = seg.indexOf("Enter API key for")
    const ip = seg.indexOf("Route this provider")
    const iProbe = seg.indexOf("probeChannelFlow(")
    assert.ok(ik !== -1 && ip !== -1 && iProbe !== -1, `${label}：key ∥ 代理问句 ∥ 探针三问应在场`)
    assert.ok(ik < ip && ip < iProbe, `${label}：问序应为 key → proxy → 探针`)
    // 行序：No 在前（picker 首项 = 缺省 = 直连）；Yes 只由显式选择落旗
    const ino = seg.indexOf('"No (direct)"')
    const iyes = seg.indexOf('"Yes (proxy)"')
    assert.ok(ino !== -1 && iyes !== -1 && ino < iyes, `${label}：No (direct) 应为前项（缺省 = 直连）`)
    // 旗落位 = 问句后、流尾探针前（Yes 径：落盘 + 内存镜像，随后才探）
    const iMirror = seg.indexOf("cfg.proxy = true")
    assert.ok(ip < iMirror && iMirror < iProbe, `${label}：旗落应在代理问句后、流尾探针前`)
  }
})

test("L1c 同判定自证（执行）：逐渠旗 ∧ 在案 uri ⇒ 代理目标 ∥ 否则直连（2026-10-08 去全局闸随正）", async () => {
  const { _setConfigPathForTest, _resetConfigPathForTest } = await import(CORE + "config-io.mjs")
  const { probeTargetOf } = await import(CORE + "provider-flows.mjs")
  const cfgPath = tmpConfigPath()
  _setConfigPathForTest(cfgPath)
  try {
    writeFileSync(cfgPath, JSON.stringify({ proxy: { uri: "http://127.0.0.1:9", model: true } }))
    const on = probeTargetOf({ name: "p", baseURL: "https://p.example.com/v1", apiKey: " sk ", format: "anthropic", proxy: true })
    assert.equal(on.proxyUri, "http://127.0.0.1:9", "渠旗 ∧ uri 在案 ⇒ 探针走代理目标")
    assert.deepEqual(Object.keys(on).sort(), ["apiKey", "baseURL", "format", "name", "proxyUri"], "返形 = listModels 可消费目标")
    assert.equal(on.apiKey, "sk", "apiKey 归一（trim）")
    // 逐渠旗缺 ∥ 非真 ⇒ 直连（同一 uri 在案也不走）
    assert.equal(probeTargetOf({ name: "p", baseURL: "https://p.example.com/v1" }).proxyUri, undefined)
    assert.equal(probeTargetOf({ name: "p", baseURL: "https://p.example.com/v1", proxy: false }).proxyUri, undefined)
    // 盘上 model 键零影响（逐渠独立——去全局闸）：model:false ⇒ 仍走代理
    writeFileSync(cfgPath, JSON.stringify({ proxy: { uri: "http://127.0.0.1:9", model: false } }))
    assert.equal(probeTargetOf({ name: "p", baseURL: "https://p.example.com/v1", proxy: true }).proxyUri, "http://127.0.0.1:9", "model 键零影响（旗 ∧ 在案 uri）")
  } finally {
    _resetConfigPathForTest()
  }
})
