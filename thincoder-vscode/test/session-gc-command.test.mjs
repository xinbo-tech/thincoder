/** session-gc-command.test.mjs — STARTUP-LATENCY 批 F-SL2 端侧命令面（SESSION.md §6.17 D-SE38）：
 *  T-VSC-SG1（空候选 / 确认 / 驳回 = 零删除 + 命令注册与直调点机检）· T-VSC-SG2（删除期某组变活
 *  ⇒ 该组拒绝行 + 其余组继续 + 汇总含跳过计数）。
 *  夹具纪律：装置**显式传 temp `dir`**（沙箱缝）+ mock vscode（宿主面注入 `api`）——禁触真实
 *  `~/.thincoder`；`deleteColdCwd` 与 CLI 面同源（核数据面）。 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, utimesSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, dirname } from "node:path"
import { runSessionGcCommand } from "../src/extension/session-gc-command.mjs"

const dirs = []
const tmpRoot = () => { const d = mkdtempSync(join(tmpdir(), "tc-vsc-sg-")); dirs.push(d); return d }
process.on("exit", () => { for (const d of dirs) { try { rmSync(d, { recursive: true, force: true }) } catch { /* ignore */ } } })
const sessionsRoot = () => { const root = tmpRoot(); const dir = join(root, "sessions"); mkdirSync(dir); return { root, dir } }
/** 回收根（与核 `trashRootFor` 同口径：sessions 根同级 `sessions-trash`）。 */
const trashFor = (dir) => join(dirname(dir), "sessions-trash")
const deadProbe = () => ({ aliveSet: new Set(), cmds: null })

/** 组夹具：manifest（可选属主）+ 数据文件（cwd 指向不存在路径）；mtime 回拨 8 天（过 7 天窗）。 */
function seedGroup(dir, hash, { slotSessions = {}, dataCwd = null } = {}) {
  const prefix = `${hash}.json`
  const write = (name, text) => {
    const p = join(dir, name)
    writeFileSync(p, text, "utf8")
    const t = new Date(Date.now() - 8 * 86_400_000)
    utimesSync(p, t, t)
  }
  write(`${prefix}.manifest`, JSON.stringify({ slots: { 1: { ts: Date.now(), title: "t" } }, active: 1, slotSessions }))
  write(`${prefix}.1`, JSON.stringify({ version: 2, cwd: dataCwd ?? join(tmpdir(), `vsc-gone-${hash.slice(-4)}`), history: [] }))
}

/** mock vscode：记录调用并按脚本作答。 */
function mockApi(reply) {
  const calls = { warn: [], info: [] }
  return {
    calls,
    api: {
      window: {
        showWarningMessage: async (msg, opts, ...items) => { calls.warn.push({ msg, opts, items }); return reply === undefined ? undefined : reply },
        showInformationMessage: async (msg) => { calls.info.push(msg); return undefined },
      },
    },
  }
}

test("T-VSC-SG1a 空候选：零删除 + 提示（不弹确认）", async () => {
  const { dir } = sessionsRoot()
  const { api, calls } = mockApi("Delete")
  const r = await runSessionGcCommand({ dir, api, probeFn: deadProbe })
  assert.deepEqual(r, { candidates: 0, confirmed: false, deleted: 0, files: 0, skipped: 0 })
  assert.equal(calls.warn.length, 0, "空候选不弹确认门")
  assert.equal(calls.info.length, 1, "零删除提示")
})

test("T-VSC-SG1b 确认 ⇒ 逐组 deleteColdCwd（模态确认 + 落回收批）", async () => {
  const { dir } = sessionsRoot()
  seedGroup(dir, "a".repeat(40))
  seedGroup(dir, "b".repeat(40))
  const before = readdirSync(dir).length
  const { api, calls } = mockApi("Delete")
  const r = await runSessionGcCommand({ dir, api, probeFn: deadProbe })
  assert.equal(r.confirmed, true)
  assert.equal(r.candidates, 2)
  assert.equal(r.deleted, 2, "逐组回收")
  assert.equal(r.files, before, "文件全量移入回收批")
  assert.equal(calls.warn.length, 1, "模态确认恰一次")
  assert.deepEqual(calls.warn[0].opts, { modal: true }, "模态警告（{ modal: true }）")
  assert.deepEqual(calls.warn[0].items, ["Delete"])
  assert.equal(readdirSync(dir).length, 0, "原目录零残留")
  assert.equal(readdirSync(trashFor(dir)).length, 1, "回收批在（可回退）")
})

test("T-VSC-SG1c 驳回（undefined）⇒ 零删除", async () => {
  const { dir } = sessionsRoot()
  seedGroup(dir, "a".repeat(40))
  const before = readdirSync(dir).length
  const { api } = mockApi(undefined)
  const r = await runSessionGcCommand({ dir, api, probeFn: deadProbe })
  assert.equal(r.confirmed, false)
  assert.equal(r.deleted, 0)
  assert.equal(readdirSync(dir).length, before, "零删除")
})

test("T-VSC-SG2 边界：删除期某组变活 ⇒ 该组拒绝行 + 其余组继续 + 汇总含跳过计数", async () => {
  const { dir } = sessionsRoot()
  seedGroup(dir, "a".repeat(40))
  seedGroup(dir, "b".repeat(40))
  const bManifest = join(dir, `${"b".repeat(40)}.json.manifest`)
  // 确认门回调内使 B 组变活（删除期竞态夹具）：manifest 写入活属主 + 探测面判活
  const calls = { warn: [], info: [] }
  const api = {
    window: {
      showWarningMessage: async (msg, opts, ...items) => {
        calls.warn.push({ msg, opts, items })
        writeFileSync(bManifest, JSON.stringify({ slots: { 1: {} }, active: 1, slotSessions: { 1: "888-1-x" } }), "utf8")
        return "Delete"
      },
      showInformationMessage: async (msg) => { calls.info.push(msg); return undefined },
    },
  }
  const probeFn = () => ({ aliveSet: new Set([888]), cmds: new Map([[888, "node thincoder.mjs"]]) })
  const r = await runSessionGcCommand({ dir, api, probeFn })
  assert.equal(r.deleted, 1, "其余组继续")
  assert.equal(r.skipped, 1, "变活组拒绝（计入汇总跳过计数）")
  assert.ok(calls.info[0].includes("skipped 1"), "汇总含跳过计数")
  assert.equal(existsSync(join(dir, `${"a".repeat(40)}.json.manifest`)), false, "A 组照常回收")
  assert.ok(existsSync(bManifest), "B 组零删除（TOCTOU 重校验拒绝）")
})

test("T-VSC-SG1d 接线机检：命令注册（package.json）+ 直调点（extension.mjs）+ 不消费 runSessionGc", () => {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"))
  const cmds = (pkg.contributes?.commands ?? []).map((c) => c.command)
  assert.ok(cmds.includes("thincoder.sessionGc"), "contributes.commands 注册")
  const ext = readFileSync(new URL("../extension.mjs", import.meta.url), "utf8")
  assert.match(ext, /registerCommand\("thincoder\.sessionGc"/, "extension.mjs 挂处理体（同址簇）")
  assert.match(ext, /runSessionGcCommand\(/, "处理体 = 端侧命令档")
  const cmdSrc = readFileSync(new URL("../src/extension/session-gc-command.mjs", import.meta.url), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1") // 注释剥除（判据看代码面）
  assert.equal(/\brunSessionGc\b/.test(cmdSrc), false, "不消费 runSessionGc（核内零消费方结构机检保持）")
  assert.match(cmdSrc, /sessionsDir\(\)/, "目录来源 = 端侧派生的 sessions 根")
  const manifest = readFileSync(new URL("./files.mjs", import.meta.url), "utf8")
  for (const f of ["test/trace-cleanup.test.mjs", "test/session-gc-command.test.mjs"]) {
    assert.ok(manifest.includes(`"${f}"`), `单元清单登记（未登记 ⇒ runner fail-closed）：${f}`)
  }
})
