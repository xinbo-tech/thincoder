/**
 * memory-tool.test.mjs — memory tool 五动作面（layer 统一 + 删除语义）· 核面直驱。
 *
 * W8（`docs/batches/2026-09-15-vsc-core-wiring.md` §2 · 2026-09-15）：存储 / 检索已归一核面
 * （`@thincoder/core/memory.mjs`——sqlite）；本档按核面**重述**：工具面（五动作 · layer 值域
 * personal/project · 无 team）仍是本端自持面，执行器 / 输出契约来自核工具生成器
 * （MEMORY.md §6.6.4——两端同文）。
 *
 * 覆盖（逐条回指 W8 §2「逐档判定 · memory-tool 改指」+ MEMORY.md §6.6）：
 *   put/search/list/delete/clear 五动作端到端（personal 行 + project markdown 文件）·
 *   team 明确拒绝（指引 CLI）· layer 值域 / schema 面（无 team、无 scope 词）·
 *   单删 layer 不匹配拒绝（防误删）· 批删门禁（layer 必填 + 过滤必填 + confirm 预览/执行）·
 *   clear 仅 personal · 降级面（记忆面停用 ⇒ 明确 Error、零崩）。
 *
 * 环境隔离：config 路径 + HOME 均指向 tmp（memory.db 落 tmp；embedder 恒 null ⇒ 纯 FTS
 * 检索——确定性、零网络）；句柄经 `_resetMemoryHandleForTest` 逐测重建。
 */
import { test, before, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdtempSync, mkdirSync, readdirSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { memoryTool } from "../src/memory-tool.mjs"
import { applyEngineFloorGuard } from "../extension.mjs"
import { _resetMemoryHandleForTest, ensureMemoryHandle, memoryFor, projectMemoryDir } from "../src/embed-config.mjs"
import { _setConfigPathForTest } from "../src/config-io.mjs"

let root, home, cwd
const savedEnv = {}

before(async () => {
  const ok = await applyEngineFloorGuard() // 真实探针：本机过闸 ⇒ 记忆面启用
  assert.equal(ok, true, "测试机须满足引擎下限（22.13+ / node:sqlite）——否则本档面不可测")
})

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "mem-tool-"))
  home = join(root, "home")
  cwd = join(root, "project")
  mkdirSync(home, { recursive: true })
  mkdirSync(cwd, { recursive: true })
  savedEnv.USERPROFILE = process.env.USERPROFILE
  savedEnv.HOME = process.env.HOME
  process.env.USERPROFILE = home // homedir() 读 env ⇒ embed-config 的 config 读取落在 tmp（无 embedding ⇒ 纯 FTS）
  process.env.HOME = home
  _setConfigPathForTest(join(home, ".thincoder", "config.json")) // memoryDbPath = tmp home 下（逐测新库）
  _resetMemoryHandleForTest()
})

afterEach(() => {
  _setConfigPathForTest(null)
  _resetMemoryHandleForTest()
  if (savedEnv.USERPROFILE === undefined) delete process.env.USERPROFILE
  else process.env.USERPROFILE = savedEnv.USERPROFILE
  if (savedEnv.HOME === undefined) delete process.env.HOME
  else process.env.HOME = savedEnv.HOME
  try { rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 }) } catch { /* Windows handle lag */ }
})

/** Execute the memory tool against the temp cwd (core face ensured). */
const run = (args) => memoryTool.execute(args, { cwd })

// ── 用例 1: 五动作端到端（personal 行 + project markdown 文件）──

test("五动作端到端（核面）：put/search/list/delete/clear —— personal 行 + project 文件", async () => {
  const stored = await run({ action: "put", layer: "personal", type: "rule", title: "personal habit", content: "never block on network", tags: "style" })
  assert.match(stored, /^Saved to personal memory \(id=personal:\d+\): \[rule\] personal habit$/, `personal put 输出契约: ${stored}`)

  const toProject = await run({ action: "put", layer: "project", type: "knowledge", title: "project fact", content: "the db lives in memory.db" })
  assert.match(toProject, /^Saved to project memory \(id=project:.+\): \[knowledge\] project fact$/, `project put 输出契约: ${toProject}`)
  const dir = projectMemoryDir(cwd)
  const files = readdirSync(dir).filter((n) => n.endsWith(".md"))
  assert.equal(files.length, 1, "project 层 = markdown 文件写入项目记忆目录（磁盘为真相）")

  // search：personal 行进 FTS（无 embedder ⇒ 纯 FTS 回退，非空 query 不空回）
  const hit = await run({ action: "search", query: "network block" })
  assert.match(hit, /^\[personal\]\[rule\] personal habit \(id=personal:\d+\)/, `search 行契约: ${hit}`)

  // list：两行带 [layer] 标签 + uid
  const list = await run({ action: "list" })
  assert.match(list, /^\[personal\] personal:\d+ \[rule\] personal habit（\d{4}-\d{2}-\d{2}）$/m, `list personal 行: ${list}`)
  assert.match(list, /^\[project\] project:.+\.md \[knowledge\] project fact/m, `list project 行: ${list}`)

  // delete（单条 · project）：文件 + 索引行同步清掉
  const uid = toProject.match(/id=(project:[^)]+)\)/)[1]
  const deleted = await run({ action: "delete", id: uid })
  assert.match(deleted, /^Deleted project:.+: project fact/, `delete 输出契约: ${deleted}`)
  assert.equal(existsSync(join(dir, uid.split(":").pop())), false, "project 文件已删")

  // clear（personal-only）：清空 personal 全部
  const cleared = await run({ action: "clear", layer: "personal", confirm: true })
  assert.match(cleared, /^Cleared personal memory \(\d+ entries deleted\)$/, `clear 输出契约: ${cleared}`)
  assert.equal(await run({ action: "list", layer: "personal" }), "0 条匹配", "personal 层已空")
})

// ── 用例 2: team 明确拒绝（无 team 层——指引 CLI；schema 值域同规）──

test("team 拒绝 + schema 值域：五动作 layer=team → 明确错误（指引 CLI）；schema/enum 无 team", async () => {
  const actions = ["search", "put", "list", "delete", "clear"]
  for (const action of actions) {
    const out = await run({ action, layer: "team", query: "x", type: "rule", title: "t", content: "c", confirm: true })
    assert.match(out, /^Error: memory (search|put|list|delete|clear): VS Code memory has no team layer — team memory is managed by the CLI$/, `${action}: ${out}`)
  }
  assert.deepEqual(memoryTool.parameters.properties.layer.enum, ["personal", "project"], "schema 值域按端（无 team）")
  assert.equal("scope" in memoryTool.parameters.properties, false, "schema 不暴露 scope")
  assert.ok(memoryTool.description.includes("layer"), "描述面说 layer")
  assert.ok(!/scope/i.test(memoryTool.description + JSON.stringify(memoryTool.parameters)), "模型可见文本无 scope 词")
})

// ── 用例 3: 单删 layer 不匹配拒绝（防误删）──

test("单删 layer 不匹配：id 实际层 ≠ 传入 layer → 明确拒绝且不删", async () => {
  const out0 = await run({ action: "put", layer: "project", type: "rule", title: "mismatch victim", content: "keep me" })
  const uid = out0.match(/id=(project:[^)]+)\)/)[1]
  const out = await run({ action: "delete", id: uid, layer: "personal" })
  assert.match(out, /^Error: id prefix project: 与 layer personal 不匹配$/, `mismatch 拒绝: ${out}`)
  assert.equal(existsSync(join(projectMemoryDir(cwd), uid.split(":").pop())), true, "文件未被删（防误删）")
  // layer 省略 → 按 id 前缀路由删除（同一 uid 直接可删——与 search/list 行对接）
  const ok = await run({ action: "delete", id: uid })
  assert.match(ok, /^Deleted /, `省略 layer 按前缀路由: ${ok}`)
})

// ── 用例 4: 批删门禁（layer 必填 + 过滤必填 + confirm 预览/执行）──

test("批删门禁：无 layer / 无过滤 / 无 confirm 三态拒绝；confirm:true 执行输出契约", async () => {
  await run({ action: "put", layer: "project", type: "rule", title: "batch one", content: "batch" })
  await run({ action: "put", layer: "project", type: "rule", title: "batch two", content: "batch" })
  await run({ action: "put", layer: "project", type: "knowledge", title: "batch keeper", content: "batch" })

  const noLayer = await run({ action: "delete", type: "rule", keyword: "batch" })
  assert.match(noLayer, /^Error: batch delete requires layer plus type and\/or keyword filter$/, `layer 必填: ${noLayer}`)

  const noFilter = await run({ action: "delete", layer: "project" })
  assert.match(noFilter, /^Error: batch delete requires type and\/or keyword filter/, `过滤必填: ${noFilter}`)

  const preview = await run({ action: "delete", layer: "project", type: "rule", keyword: "batch" })
  assert.match(preview, /^将删 2 条\n\[project\] /, `预览（不删）: ${preview}`)
  assert.match(preview, /confirm:true required — re-send with it to execute the deletion$/, "预览尾句")

  const done = await run({ action: "delete", layer: "project", type: "rule", keyword: "batch", confirm: true })
  assert.equal(done, "Deleted 2 entries in layer project", `执行输出契约: ${done}`)
  const after = await run({ action: "list", layer: "project" })
  assert.match(after, /batch keeper/, "未匹配项存活")
  assert.doesNotMatch(after, /batch (one|two)/, "匹配项已删")
})

// ── 用例 5: clear 仅 personal（project 拒绝）──

test("clear 仅 personal：project → 拒绝且不删；缺 confirm → 拒绝", async () => {
  await run({ action: "put", layer: "project", type: "rule", title: "untouchable", content: "x" })
  const refused = await run({ action: "clear", layer: "project", confirm: true })
  assert.match(refused, /^Error: shared layers don't support clear/, `project 拒绝: ${refused}`)
  const noConfirm = await run({ action: "clear", layer: "personal" })
  assert.match(noConfirm, /^Error: clear requires confirm:true/, `confirm 门: ${noConfirm}`)
  assert.match(await run({ action: "list", layer: "project" }), /untouchable/, "project 条目存活")
})

// ── 用例 6: 错误面（未知 action / 非法 layer / 空 query 短路）──

test("错误面：未知 action / 非法 layer / 空 query 短路——输出为 Error/空文案（零崩）", async () => {
  assert.match(await run({ action: "nonsense" }), /^Error: memory: unknown action "nonsense" — expected one of: search\/put\/list\/delete\/clear$/)
  assert.match(await run({ action: "search", layer: "bogus", query: "x" }), /^Error: .*invalid layer "bogus"/)
  assert.equal(await run({ action: "search", query: "  " }), "(no matching memories)", "空 query 短路返回空文案（核口径）")
})

// ── 用例 7: 降级面（引擎护栏停用 ⇒ 明确 Error、零崩）──

test("降级面：记忆面停用（引擎护栏不满足）→ 工具明确报不可用，不抛", async () => {
  try {
    await applyEngineFloorGuard({ version: "20.18.1" }) // 低于下限 ⇒ 旗标 false
    _resetMemoryHandleForTest()
    assert.equal(await memoryFor(cwd), null, "停用 ⇒ 零句柄")
    const out = await run({ action: "search", query: "x" })
    assert.match(out, /^Error: memory is unavailable on this host/, `停用输出: ${out}`)
  } finally {
    const ok = await applyEngineFloorGuard() // 还原：本机过闸
    assert.equal(ok, true)
  }
})

// ── 用例 8: 句柄面（装配点创建 + 单例 + codeOrigin 限定）──

test("句柄面：ensureMemoryHandle 单例 + codeOrigin 逐 cwd 限定（核面按 origin 过滤）", async () => {
  const a = await ensureMemoryHandle()
  const b = await ensureMemoryHandle()
  assert.ok(a && a === b, "句柄单例（幂等创建）")
  assert.equal(await memoryFor(cwd), a, "memoryFor 返回同句柄并限 origin")
  assert.equal(a.codeOrigin, cwd, "codeOrigin = 当前项目根")
  assert.equal(a.projectOrigin, projectMemoryDir(cwd), "projectOrigin = 共享配置 projectDir（CLI 同源）")
})
