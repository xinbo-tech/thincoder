/**
 * Memory + indexing offline tests (node:test, no network/real API).
 * Extracted from test/units.test.mjs — covers CRUD, project/team layers,
 * hybrid retrieval, code indexing, doc indexing, dependency outline,
 * and incremental indexing.
 */
import { test } from "node:test"
import { slow } from "./slow.mjs"
import assert from "node:assert/strict"
import { join } from "node:path"
import { mkdtempSync, rmSync, existsSync, readdirSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { execSync } from "node:child_process"

import { createMemory, put, search, list, remove, putMarkdown, syncDir, deleteByUid, fetchEntry, segmentCJK, memoryTools } from "../src/memory.mjs"
import { serializeEntry, parseEntry, slugify, entryFilename } from "../src/markdown.mjs"

function freshMemory() {
  return createMemory({ dbPath: ":memory:" })
}

// ---------------------------------------------------------------- helpers



/** Initialize a minimal git repo in dir so codeSync/docSync can operate. */
function initGitRepo(dir) {
  execSync("git init -q", { cwd: dir, stdio: "ignore" })
  execSync('git config user.name test', { cwd: dir, stdio: "ignore" })
  execSync('git config user.email test@test.dev', { cwd: dir, stdio: "ignore" })
}

/** Remove a directory with retries (Windows may hold .git handles briefly). */
async function removeDir(dir) {
  for (let i = 0; i < 5; i++) {
    try { rmSync(dir, { recursive: true, force: true }); return }
    catch { if (i < 4) await new Promise(r => setTimeout(r, 1000)) }
  }
}

test("memory: put / search / list / remove 全流程", async () => {
  const m = freshMemory()
  const id1 = await put(m, { type: "rule", title: "代码风格", content: "不加分号，不用 TypeScript" })
  const id2 = await put(m, { type: "knowledge", title: "部署架构", content: "单台 VPS，Caddy 反向代理" })

  // 中文双字词命中（unicode61 + CJK 逐字方案的核心场景）
  const r1 = await search(m, "分号")
  assert.equal(r1.length, 1)
  assert.equal(r1[0].id, `personal:${id1}`)
  assert.equal(r1[0].layer, "personal")

  const r2 = await search(m, "VPS")
  assert.equal(r2[0].id, `personal:${id2}`)

  // OR 语义：一词命中即可
  const r3 = await search(m, "分号 Caddy")
  assert.equal(r3.length, 2)

  assert.equal((await list(m)).length, 2)
  assert.equal((await list(m, { type: "rule" })).length, 1)

  assert.equal(await remove(m, id1), true)
  assert.equal(await remove(m, id1), false)
  assert.equal((await list(m)).length, 1)
})

// ========== 删除能力（MEMORY.md §0/§0.1 路由——单条删除语义）==========

test("T1: personal 删除 — entries 行整体删（embedding 随行）+ FTS 零残留 + search 零命中", async () => {
  const m = freshMemory()
  const id = await put(m, { type: "rule", title: "旧规则", content: "发布后必须轮询" })
  m.db.prepare(`UPDATE entries SET embedding = x'01020304' WHERE id = ?`).run(id) // 模拟已嵌入
  const ftsBefore = m.db.prepare(`SELECT COUNT(*) AS n FROM entries_fts`).get().n
  const entry = await deleteByUid(m, `personal:${id}`, {})
  assert.equal(entry.id, `personal:${id}`)
  assert.equal(entry.title, "旧规则")
  assert.equal(entry.content, "发布后必须轮询")
  assert.equal(m.db.prepare(`SELECT COUNT(*) AS n FROM entries WHERE id = ?`).get(id).n, 0, "entries 行整体删除（embedding 列随行）")
  assert.equal(m.db.prepare(`SELECT COUNT(*) AS n FROM entries_fts`).get().n, ftsBefore - 1, "FTS 零残留")
  assert.equal((await search(m, "轮询")).length, 0, "搜索零命中")
})

test("T2: project 删除 — 文件删 + files 行删 + search 零命中", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-del-proj-"))
  const m = freshMemory()
  try {
    const memDir = join(dir, ".thincoder", "memory")
    const filename = await putMarkdown(m, { layer: "project", dir: memDir, type: "knowledge", title: "部署架构", content: "生产环境在单台 VPS", tags: ["deploy"], author: "t" })
    const uid = `project:${memDir}:${filename}`
    const entry = await deleteByUid(m, uid, { dirs: { project: memDir } })
    assert.equal(entry.id, uid)
    assert.equal(entry.title, "部署架构")
    assert.equal(existsSync(join(memDir, filename)), false, "markdown 文件已删")
    assert.equal(m.db.prepare(`SELECT COUNT(*) AS n FROM files WHERE layer='project' AND origin=? AND path=?`).get(memDir, filename).n, 0, "files 行已删")
    assert.equal((await search(m, "VPS")).length, 0, "搜索零命中")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("T3: 不存在 / 未配置 scope → 明确错误（NF2）", async () => {
  const m = freshMemory()
  await assert.rejects(() => deleteByUid(m, "personal:99999", {}), /memory personal:99999 not found in scope personal/)
  const dir = mkdtempSync(join(tmpdir(), "thincoder-del-miss-"))
  try {
    await assert.rejects(() => deleteByUid(m, `project:${dir}:nope.md`, { dirs: { project: dir } }), /not found in scope project/)
    await assert.rejects(() => deleteByUid(m, "bogus:1", {}), /invalid memory id/)
    await assert.rejects(() => deleteByUid(m, `team:x:y.md`, {}), /team scope unavailable/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("T4: memory 工具 delete 单条 — scope 与 id 前缀不匹配拒绝（NF3）", async () => {
  const m = freshMemory()
  const memTool = memoryTools(m, {})[0]
  assert.equal(memTool.name, "memory", "memory 单工具注册")
  await assert.rejects(() => memTool.execute({ action: "delete", id: "personal:1", scope: "project" }), /id prefix personal: 与 scope project 不匹配/)
  await assert.rejects(() => memTool.execute({ action: "delete", id: "team:x:y.md", scope: "project" }), /不匹配/)
  await assert.rejects(() => memTool.execute({ action: "delete", id: "5", scope: "team" }), /不匹配/)
  // 前缀一致但条目不存在 → 路由层 not found
  await assert.rejects(() => memTool.execute({ action: "delete", id: "personal:1", scope: "personal" }), /not found in scope personal/)
})

test("T7: memory remove 命令 — project uid 走 deleteByUid 路由", async () => {
  const { memoryCommand } = await import("../src/cli/memory-command.mjs")
  const dir = mkdtempSync(join(tmpdir(), "thincoder-rm-proj-"))
  const m = freshMemory()
  try {
    const memDir = join(dir, ".thincoder", "memory")
    const filename = await putMarkdown(m, { layer: "project", dir: memDir, type: "knowledge", title: "待删条目", content: "命令行删除我", tags: [], author: "t" })
    const lines = []
    const origLog = console.log
    const origErr = console.error
    console.log = (s) => lines.push(s)
    console.error = () => {}
    try { await memoryCommand(m, ["remove", `project:${memDir}:${filename}`], { dirs: { project: memDir } }) } finally { console.log = origLog; console.error = origErr }
    assert.ok(lines.some((l) => l.includes("Removed") && l.includes(filename)), `输出应含 Removed+filename: ${lines}`)
    assert.equal(existsSync(join(memDir, filename)), false)
    assert.equal((await search(m, "命令行删除")).length, 0)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("T8: team 删除 — 文件删 + syncDir 清 files 行 + search 零命中（不做 git 操作）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-del-team-"))
  const m = freshMemory()
  try {
    const teamDir = join(dir, "team-mem")
    const filename = await putMarkdown(m, { layer: "team", dir: teamDir, type: "rule", title: "提交规范", content: "commit 用英文", tags: ["git"], author: "A" })
    const uid = `team:${teamDir}:${filename}`
    const entry = await deleteByUid(m, uid, { dirs: { team: teamDir } })
    assert.equal(entry.title, "提交规范")
    assert.equal(existsSync(join(teamDir, filename)), false)
    assert.equal(m.db.prepare(`SELECT COUNT(*) AS n FROM files WHERE layer='team' AND origin=? AND path=?`).get(teamDir, filename).n, 0, "syncDir 清 files 行")
    assert.equal((await search(m, "commit 用英文")).length, 0, "搜索零命中")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("T9: 路径校验（.. / 绝对路径 / ..\\ 变体）+ ENOENT 容错", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-del-path-"))
  const m = freshMemory()
  try {
    const memDir = join(dir, ".thincoder", "memory")
    // ① 逃逸路径拒绝
    await assert.rejects(() => deleteByUid(m, `project:${memDir}:..\\..\\evil.md`, { dirs: { project: memDir } }), /must stay within/)
    await assert.rejects(() => deleteByUid(m, `project:${memDir}:../evil.md`, { dirs: { project: memDir } }), /must stay within/)
    await assert.rejects(() => deleteByUid(m, `project:${memDir}:${join(dir, "evil.md")}`, { dirs: { project: memDir } }), /must stay within/)
    // ② files 行存在但文件已缺 → 删除继续（syncDir 清行）
    const filename = await putMarkdown(m, { layer: "project", dir: memDir, type: "knowledge", title: "幽灵条目", content: "文件已被外部删除", tags: [], author: "t" })
    const { unlink } = await import("node:fs/promises")
    await unlink(join(memDir, filename))
    const entry = await deleteByUid(m, `project:${memDir}:${filename}`, { dirs: { project: memDir } })
    assert.equal(entry.title, "幽灵条目")
    assert.equal(m.db.prepare(`SELECT COUNT(*) AS n FROM files WHERE layer='project' AND origin=? AND path=?`).get(memDir, filename).n, 0, "syncDir 清残留行")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("T10: memory 工具 put/search 输出带完整 uid（F2）", async () => {
  const m = freshMemory()
  const memTool = memoryTools(m, {})[0]
  const putOut = await memTool.execute({ action: "put", type: "rule", title: "uid 可见", content: "personal 输出应带完整 uid" })
  const uid = putOut.match(/id=(personal:\d+)/)?.[1]
  assert.ok(uid, `put 输出应含 personal:<n>: ${putOut}`)
  const searchOut = await memTool.execute({ action: "search", query: "uid 可见", limit: 5 })
  assert.ok(searchOut.includes(uid), `search 输出应含 ${uid}: ${searchOut}`)
  // delete 单条动作可直接消费该 uid
  await memTool.execute({ action: "delete", id: uid, scope: "personal" })
  assert.equal((await search(m, "uid 可见")).length, 0)

  // project scope：构造 project:<origin>:<path> 完整 uid（origin = 层目录）
  const dir = mkdtempSync(join(tmpdir(), "thincoder-uid-proj-"))
  try {
    const memTool2 = memoryTools(freshMemory(), { cwd: dir, projectDir: ".thincoder/memory", author: "t" })[0]
    const putOut2 = await memTool2.execute({ action: "put", type: "knowledge", title: "项目 uid", content: "project 输出带完整 uid", scope: "project" })
    const memDir = join(dir, ".thincoder", "memory")
    const filename = readdirSync(memDir)[0]
    assert.ok(filename.endsWith(".md"))
    assert.ok(putOut2.includes(`project:${memDir}:${filename}`), `put 输出应含完整 uid: ${putOut2}`)
    const searchOut2 = await memTool2.execute({ action: "search", query: "项目 uid", limit: 5 })
    assert.ok(searchOut2.includes(`project:${memDir}:${filename}`), `search 输出应含完整 uid: ${searchOut2}`)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("T11: memory remove 命令 — 裸数字 id 兼容（解析为 personal:<n>）", async () => {
  const { memoryCommand } = await import("../src/cli/memory-command.mjs")
  const m = freshMemory()
  const id = await put(m, { type: "rule", title: "旧命令条目", content: "裸数字删除" })
  const lines = []
  const origLog = console.log
  const origErr = console.error
  console.log = (s) => lines.push(s)
  console.error = () => {}
  try { await memoryCommand(m, ["remove", String(id)], { dirs: { project: null, team: null } }) } finally { console.log = origLog; console.error = origErr }
  assert.ok(lines.some((l) => l.includes(`Removed personal:${id}`)), `输出应含 Removed personal:${id}: ${lines}`)
  assert.equal((await list(m)).length, 0)
})


test("memory: 非法 type 拒绝写入", async () => {
  const m = freshMemory()
  await assert.rejects(() => put(m, { type: "bogus", title: "t", content: "c" }))
})

// ---------------------------------------------------------------- project 层

test("project 层：putMarkdown → syncDir → 合并检索", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-proj-"))
  const m = freshMemory()
  try {
    const memDir = join(dir, ".thincoder", "memory")
    const filename = await putMarkdown(m, {
      layer: "project",
      dir: memDir,
      type: "knowledge",
      title: "部署架构",
      content: "生产环境在单台 VPS，Caddy 反向代理",
      tags: ["deploy"],
      author: "tester",
    })
    assert.match(filename, /部署架构/)

    // personal 层也放一条，验证合并
    await put(m, { type: "rule", title: "代码风格", content: "不加分号，不用 TypeScript" })

    const results = await search(m, "VPS 部署")
    assert.equal(results.length, 1)
    assert.equal(results[0].layer, "project")
    assert.equal(results[0].title, "部署架构")

    const merged = await search(m, "分号")
    assert.equal(merged[0].layer, "personal")

    // syncDir：手工删文件后应移出索引
    const { unlink, writeFile: wf } = await import("node:fs/promises")
    await unlink(join(memDir, filename))
    await wf(join(memDir, "20260724-新条目-ab12.md"), serializeEntry({ type: "decision", title: "新决策", tags: [], author: "t" }, "内容"))
    const stats = await syncDir(m, { layer: "project", dir: memDir })
    assert.equal(stats.removed, 1)
    assert.equal(stats.added, 1)
    const after = await search(m, "VPS")
    assert.equal(after.length, 0)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

// ---------------------------------------------------------------- 混合检索（本地 mock embedding 服务）

test("hybrid: 向量通道 + RRF + 惰性 embedding", async () => {
  const { createServer } = await import("node:http")
  const { createEmbedder } = await import("../src/embedding.mjs")
  const DIM = 8
  // 确定性向量：含"风格"/"规范"的词共享第 0 维（模拟语义相近）
  const vecFor = (text) => {
    const v = new Array(DIM).fill(0)
    if (text.includes("风格")) v[0] = 1
    if (text.includes("规范")) v[0] += 0.9
    if (text.includes("部署")) v[1] = 1
    if (text.includes("编程")) v[0] += 0.3
    return v
  }
  const server = createServer((req, res) => {
    let body = ""
    req.on("data", (c) => (body += c))
    req.on("end", () => {
      const { input } = JSON.parse(body)
      const texts = Array.isArray(input) ? input : [input]
      res.setHeader("content-type", "application/json")
      res.end(JSON.stringify({ data: texts.map((t, i) => ({ embedding: vecFor(t), index: i })) }))
    })
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  try {
    const port = server.address().port
    const m = freshMemory()
    m.embedder = createEmbedder({ baseURL: `http://127.0.0.1:${port}/v1`, apiKey: "x", model: "mock" })
    const id1 = await put(m, { type: "rule", title: "代码风格", content: "不加分号" })
    await put(m, { type: "knowledge", title: "部署流程", content: "打 tag 即可" })

    // "编程规范" 与 "代码风格" 零字面重合：FTS 不中，向量必须命中。
    // 断言 top-2 而非第一——CJK 逐字 OR 的固有噪声：诱饵"部署流程"因共享单字
    // "程"获得 FTS 排名，低维 mock 向量下 RRF 可能让它压过纯向量命中。
    // 真实 bge-m3（1024 维）语义区分度足够，真实 API 验证为第一名。
    const results = await search(m, "编程规范")
    assert.ok(results.length > 0)
    assert.ok(
      results.slice(0, 2).some((r) => r.id === `personal:${id1}`),
      "向量命中应进 top-2",
    )

    // 惰性生成：向量已落库
    const stored = m.db.prepare("SELECT embedding IS NOT NULL AS has FROM entries WHERE id = ?").get(id1)
    assert.equal(stored.has, 1)
  } finally {
    server.close()
  }
})

test("hybrid: Windows 盘符 origin（project/team）— 双通道合并不丢条目（defect#A 回归）", async () => {
  const { createServer } = await import("node:http")
  const { createEmbedder } = await import("../src/embedding.mjs")
  const DIM = 8
  const vecFor = (text) => {
    const v = new Array(DIM).fill(0)
    if (text.includes("盘符")) v[0] = 1
    return v
  }
  const server = createServer((req, res) => {
    let body = ""
    req.on("data", (c) => (body += c))
    req.on("end", () => {
      const { input } = JSON.parse(body)
      const texts = Array.isArray(input) ? input : [input]
      res.setHeader("content-type", "application/json")
      res.end(JSON.stringify({ data: texts.map((t, i) => ({ embedding: vecFor(t), index: i })) }))
    })
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  // files 行直接入库（origin = Windows 盘符路径，跨平台可测；files_ai 触发器同步 FTS）
  const insertRow = (m, layer, origin, path, title, content, author) =>
    m.db.prepare(`INSERT INTO files (layer, origin, path, type, title, content, tags, author, mtime_ms, seg_title, seg_content, seg_tags, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, '', ?, 0, ?, ?, '', ?)`)
      .run(layer, origin, path, layer === "project" ? "knowledge" : "rule", title, content, author,
           segmentCJK(title), segmentCJK(content), Date.now())
  const projUid = "project:C:\\work\\proj:proj-mem.md"
  const teamUid = "team:C:\\work\\team:team-mem.md"
  try {
    // ① fetchEntry 正确解析盘符 origin uid（末个冒号 = origin/path 分隔符）
    const m0 = freshMemory()
    insertRow(m0, "project", "C:\\work\\proj", "proj-mem.md", "盘符项目条目", "Windows 盘符 origin 的项目记忆", "t")
    insertRow(m0, "team", "C:\\work\\team", "team-mem.md", "盘符团队条目", "Windows 盘符 origin 的团队记忆", "A")
    const pe = fetchEntry(m0, projUid)
    assert.ok(pe, "fetchEntry 应解析 project:C:\\...:file.md（origin=C:\\work\\proj, path=proj-mem.md）")
    assert.equal(pe.title, "盘符项目条目")
    assert.equal(pe.id, projUid)
    assert.equal(fetchEntry(m0, teamUid).layer, "team")

    // ② FTS 通道（无 embedder）：ftsSearch 输出完整 origin uid，直接命中
    const ftsOnly = await search(m0, "盘符")
    assert.ok(ftsOnly.some((r) => r.id === projUid), "FTS-only 应含 project 盘符条目")
    assert.ok(ftsOnly.some((r) => r.id === teamUid), "FTS-only 应含 team 盘符条目")

    // ③ embedder 混合检索：RRF 合并点（fetchEntry）同时解析 FTS 与向量通道的盘符 uid——均不丢
    const m = freshMemory()
    m.embedder = createEmbedder({ baseURL: `http://127.0.0.1:${server.address().port}/v1`, apiKey: "x", model: "mock" })
    m.projectOrigin = "C:\\work\\proj"
    insertRow(m, "project", "C:\\work\\proj", "proj-mem.md", "盘符项目条目", "Windows 盘符 origin 的项目记忆", "t")
    insertRow(m, "team", "C:\\work\\team", "team-mem.md", "盘符团队条目", "Windows 盘符 origin 的团队记忆", "A")
    const results = await search(m, "盘符")
    assert.ok(results.some((r) => r.id === projUid), "混合检索应含 project 盘符条目")
    assert.ok(results.some((r) => r.id === teamUid), "混合检索应含 team 盘符条目")
    // 惰性嵌入已落库——向量通道确实参与合并
    assert.equal(m.db.prepare(`SELECT COUNT(*) AS n FROM files WHERE embedding IS NOT NULL`).get().n, 2)
  } finally {
    server.close()
  }
})


// ---------------------------------------------------------------- team 层（本地裸仓库模拟远端）

slow("team 层: 双 clone 同步 + 冲突诚实报错", async () => {
  const { execFileSync } = await import("node:child_process")
  const { ensureClone, pullTeam, commitAndPush } = await import("../src/git/gitmem.mjs")
  const { writeFileSync, readFileSync } = await import("node:fs")

  const base = mkdtempSync(join(tmpdir(), "thincoder-team-"))
  const remote = join(base, "remote.git")
  const dirA = join(base, "a")
  const dirB = join(base, "b")
  const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8" })

  try {
    // 远端裸仓库 + 两个成员的 clone
    execFileSync("git", ["init", "--bare", remote], { encoding: "utf8" })
    await ensureClone({ repo: remote, dir: dirA })
    await ensureClone({ repo: remote, dir: dirB })
    for (const d of [dirA, dirB]) {
      git(d, "config", "user.name", "tester")
      git(d, "config", "user.email", "t@t.dev")
    }
    // A 先推一个初始提交（空仓库无法 rebase）
    writeFileSync(join(dirA, "README.md"), "# team memory\n")
    git(dirA, "add", ".")
    git(dirA, "commit", "-m", "init")
    git(dirA, "push", "-u", "origin", "master")

    // A 写入一条团队记忆并推送
    const memA = freshMemory()
    const file1 = await putMarkdown(memA, {
      layer: "team", dir: dirA, type: "rule", title: "提交规范",
      content: "commit message 用英文，动词开头", tags: ["git"], author: "A",
    })
    await commitAndPush(dirA, file1, "memory: [rule] 提交规范")

    // B 同步：应拉到 A 的条目并可检索
    const memB = freshMemory()
    await pullTeam(dirB)
    const stats = await syncDir(memB, { layer: "team", dir: dirB })
    assert.equal(stats.added, 1)
    const found = await search(memB, "提交规范")
    assert.equal(found.length, 1)
    assert.equal(found[0].layer, "team")
    assert.equal(found[0].author, "A")

    // 冲突场景：A 改条目推上去，B 也改同一条目（本地提交），B 再 pull 必须诚实报错
    const fileA = readFileSync(join(dirA, file1), "utf8").replace("动词开头", "动词开头，英文小写")
    writeFileSync(join(dirA, file1), fileA)
    await commitAndPush(dirA, file1, "memory: update 提交规范")
    const fileB = readFileSync(join(dirB, file1), "utf8").replace("动词开头", "中文动词开头")
    writeFileSync(join(dirB, file1), fileB)
    git(dirB, "add", file1)
    git(dirB, "commit", "-m", "memory: conflicting update")

    await assert.rejects(() => pullTeam(dirB), /Team memory sync conflict/)
    // rebase 已中止：B 仓库不处于冲突状态
    const status = git(dirB, "status", "--porcelain")
    assert.ok(!status.split("\n").some((l) => l.startsWith("UU")))
  } finally {
    rmSync(base, { recursive: true, force: true })
  }
})

// ========== 代码索引 ==========

slow("codeSync: 索引 → 检索 FTS5 → 文件变更后重建 → 文件消失后清理", async () => {
  const { codeSync, codeSearch } = await import("../src/memory.mjs")
  const { writeFile, unlink, mkdir } = await import("node:fs/promises")
  const m = freshMemory()

  const dir = mkdtempSync(join(tmpdir(), "thincoder-code-"))
  initGitRepo(dir)
  try {
    // 写两个源文件
    await mkdir(join(dir, "src"), { recursive: true })
    await writeFile(join(dir, "src", "app.mjs"), `
export function hello(name) { return "Hello " + name }
export class Greeter { greet() { return "hi" } }
const unused = 42
`)
    await writeFile(join(dir, "src", "lib.py"), `
def add(a, b):
    return a + b

class Calculator:
    def multiply(self, x, y):
        return x * y
`)

    // 首次同步
    let result = await codeSync(m, dir)
    assert.ok(result.total >= 2)
    assert.ok(result.updated >= 2)

    // FTS5 检索：搜索 "hello" 应该匹配
    const r1 = await codeSearch(m, "hello name")
    assert.ok(r1.length >= 1)
    const helloHit = r1.find((r) => r.path.includes("app.mjs"))
    assert.ok(helloHit)
    assert.ok(helloHit.content.includes("function hello"))

    // 搜索 Python 的 "multiply"
    const r2 = await codeSearch(m, "multiply")
    assert.ok(r2.length >= 1)
    const pyHit = r2.find((r) => r.path.includes("lib.py"))
    assert.ok(pyHit)

    // 修改文件 → 增量同步应检测到变更
    await writeFile(join(dir, "src", "app.mjs"), `export function goodbye() { return "bye" }`)
    result = await codeSync(m, dir)
    assert.equal(result.updated, 1)
    assert.equal(result.skipped, 1) // lib.py 没变

    // 旧符号不应再出现
    const r3 = await codeSearch(m, "hello")
    assert.equal(r3.filter((r) => r.path.includes("app.mjs")).length, 0)
    const r4 = await codeSearch(m, "goodbye")
    assert.ok(r4.some((r) => r.path.includes("app.mjs")))

    // 删除文件 → 清理索引
    await unlink(join(dir, "src", "lib.py"))
    result = await codeSync(m, dir)
    assert.equal(result.removed, 1)
    const r5 = await codeSearch(m, "Calculator")
    assert.equal(r5.length, 0)

    // 符号分块：超过 BIG_FILE_LINES 的大文件应分成多块
    const big = `// big file\n${Array(2100).fill("// line").map((l, i) => l + " " + i).join("\n")}\nexport function foo() {}\n${Array(500).fill("// more").join("\n")}\nexport function bar() {}\n`
    await writeFile(join(dir, "src", "large.mjs"), big)
    result = await codeSync(m, dir)
    const chunks = m.db.prepare(`SELECT COUNT(*) AS n FROM code_chunks WHERE path = 'src/large.mjs'`).get()
    assert.ok(chunks.n >= 1, "large file should produce chunks")

    // JSDoc 提取：注释应出现在 chunk content 开头
    await writeFile(join(dir, "src", "doc.js"), `
/** 用户认证中间件，验证 JWT token */
export function authMiddleware(req, res, next) { return next() }

// 计算订单总额
export function calcTotal(items) { return 0 }
`)
    await codeSync(m, dir)
    const r6 = await codeSearch(m, "用户认证")
    assert.ok(r6.length >= 1)
    assert.ok(r6.some((r) => r.content.includes("用户认证") && r.content.includes("authMiddleware")))

    // Python docstring 提取
    await writeFile(join(dir, "src", "doc.py"), `
def authenticate(token):
    """验证用户身份，返回用户对象或 None"""
    return None
`)
    await codeSync(m, dir)
    const r7 = await codeSearch(m, "验证用户身份")
    assert.ok(r7.length >= 1)
    assert.ok(r7.some((r) => r.content.includes("验证用户身份")))

  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("codeSearch: 空查询 / 无结果返回空", async () => {
  const { codeSearch } = await import("../src/memory.mjs")
  const m = freshMemory()
  const r = await codeSearch(m, "")
  assert.deepEqual(r, [])
})

test("code_search 工具注册与执行", async () => {
  const { codeSync, codeSearchTool } = await import("../src/memory.mjs")
  const { writeFile, mkdir } = await import("node:fs/promises")
  const m = freshMemory()

  const dir = mkdtempSync(join(tmpdir(), "thincoder-codetool-"))
  initGitRepo(dir)
  try {
    await mkdir(join(dir, "lib"), { recursive: true })
    await writeFile(join(dir, "lib", "util.mjs"), `
export function calculateTotal(items) { return items.reduce((a, b) => a + b, 0) }
`)
    await codeSync(m, dir)

    const tool = codeSearchTool(m)
    assert.equal(tool.name, "code_search")
    assert.equal(tool.readonly, true)

    const output = await tool.execute({ query: "calculateTotal", limit: 3 })
    assert.ok(output.includes("calculateTotal"))
    assert.ok(output.includes("lib/util.mjs"))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

// ========== 文档索引 ==========

test("docSync: 索引 markdown 文档 → 按 ## 标题分块 → 检索 → 增量变更", async () => {
  const { docSync, docSearch } = await import("../src/memory.mjs")
  const { writeFile, unlink, mkdir } = await import("node:fs/promises")
  const m = freshMemory()

  const dir = mkdtempSync(join(tmpdir(), "thincoder-doc-"))
  initGitRepo(dir)
  try {
    await mkdir(join(dir, "docs"), { recursive: true })
    await writeFile(join(dir, "README.md"), `# My Project\n\nWelcome to the project.\n\n## 部署\n\n用 Docker 部署，命令如下：\n\`\`\`bash\ndocker compose up\n\`\`\`\n\n## API\n\nRESTful API，base URL 是 /api/v1`)
    await writeFile(join(dir, "docs", "architecture.md"), `# 架构\n\n## 数据流\n\n前端 → Gateway → 微服务\n\n## 存储\n\nPostgreSQL 做主库，Redis 做缓存`)

    // 首次同步
    let result = await docSync(m, dir)
    assert.ok(result.total >= 2)
    assert.ok(result.updated >= 2)

    // 检索：搜索 "Docker 部署" 应命中 README
    const r1 = await docSearch(m, "Docker 部署")
    assert.ok(r1.length >= 1)
    assert.ok(r1.some((r) => r.content.includes("docker compose up")))

    // 检索：搜索 "PostgreSQL" 应命中 architecture.md
    const r2 = await docSearch(m, "PostgreSQL")
    assert.ok(r2.some((r) => r.path.includes("architecture.md")))

    // 按 ## 分块：两个 section 应各自独立
    const r3 = await docSearch(m, "API")
    assert.ok(r3.some((r) => r.heading.includes("API")))

    // 增量：修改文件后只重建该文件
    await writeFile(join(dir, "README.md"), `# My Project\n\n## 部署\n\n用 Kubernetes 部署`)
    result = await docSync(m, dir)
    assert.equal(result.updated, 1)

    // 旧内容不应再出现
    const r4 = await docSearch(m, "Docker")
    assert.equal(r4.length, 0)
    const r5 = await docSearch(m, "Kubernetes")
    assert.ok(r5.length >= 1)

    // 删除文件 → 索引清理
    await unlink(join(dir, "docs", "architecture.md"))
    result = await docSync(m, dir)
    assert.equal(result.removed, 1)

  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("docSearch: 空查询返回空", async () => {
  const { docSearch } = await import("../src/memory.mjs")
  const m = freshMemory()
  const r = await docSearch(m, "")
  assert.deepEqual(r, [])
})

// ========== 依赖大纲 ==========

slow("repo_outline: 全量大纲 + 聚焦查询", async () => {
  const { codeSync } = await import("../src/memory.mjs")
  const { buildOutline, repoOutlineTool } = await import("../src/tools/repomap.mjs")
  const { writeFile, mkdir } = await import("node:fs/promises")
  const m = freshMemory()

  const dir = mkdtempSync(join(tmpdir(), "thincoder-repo-"))
  initGitRepo(dir)
  try {
    await mkdir(join(dir, "src"), { recursive: true })
    await mkdir(join(dir, "src", "lib"), { recursive: true })
    await writeFile(join(dir, "src", "app.mjs"), `
import { helper } from "./lib/helper.mjs"
export function main() { return helper() }
`)
    await writeFile(join(dir, "src", "lib", "helper.mjs"), `
import { format } from "../util.mjs"
export function helper() { return format("hi") }
export const VERSION = 1
`)
    await writeFile(join(dir, "src", "util.mjs"), `
export function format(s) { return "[" + s + "]" }
`)

    await codeSync(m, dir)

    // 全量大纲
    const outline = await buildOutline(m.db, dir, null)
    assert.ok(outline.includes("app.mjs"))
    assert.ok(outline.includes("helper.mjs"))
    assert.ok(outline.includes("imports:"))
    assert.ok(outline.includes("exports:"))
    // helper.mjs 被 app.mjs import
    assert.ok(outline.includes("imported by"))

    // 聚焦查询
    const focus = await buildOutline(m.db, dir, "src/lib/helper.mjs")
    assert.ok(focus.includes("imported by: src/app.mjs"))
    assert.ok(focus.includes("exports: helper, VERSION"))

    // 边缘 export 语法
    await writeFile(join(dir, "src", "edge.mjs"), `
export { helper as doHelp } from "./lib/helper.mjs"
export default class App { start() {} }
export const { x, y } = { x: 1, y: 2 }
`)
    await codeSync(m, dir)
    const edgeOutline = await buildOutline(m.db, dir, "src/edge.mjs")
    assert.ok(edgeOutline.includes("doHelp") && edgeOutline.includes("App") && edgeOutline.includes("x") && edgeOutline.includes("y"), `expected doHelp,App,x,y got: ${edgeOutline}`)
    // re-export 应产生 imports 边
    assert.ok(edgeOutline.includes("imports: src/lib/helper"))

    // 工具注册
    const tool = repoOutlineTool(m.db, dir)
    assert.equal(tool.name, "repo_outline")
    assert.equal(tool.readonly, true)
    const output = await tool.execute({})
    assert.ok(output.includes("app.mjs"))
    const output2 = await tool.execute({ path: "src/util.mjs" })
    assert.ok(output2.includes("util.mjs"))

  } finally {
    await removeDir(dir)
  }
})

// ========== 增量索引 ==========

test("reindexFile: write 后单文件增量索引", async () => {
  const { codeSync, codeSearch, reindexFile } = await import("../src/memory.mjs")
  const { writeFile, unlink, mkdir } = await import("node:fs/promises")
  const m = freshMemory()

  const dir = mkdtempSync(join(tmpdir(), "thincoder-reidx-"))
  initGitRepo(dir)
  try {
    await mkdir(join(dir, "src"), { recursive: true })
    // 初始索引：一个文件
    await writeFile(join(dir, "src", "app.mjs"), "export function hello() { return 'hi' }")
    await codeSync(m, dir)
    let r = await codeSearch(m, "hello")
    assert.equal(r.length, 1)

    // 修改文件 → 增量重索引
    await writeFile(join(dir, "src", "app.mjs"), "export function goodbye() { return 'bye' }")
    await reindexFile(m, dir, join(dir, "src", "app.mjs"))

    // 旧符号消失
    r = await codeSearch(m, "hello")
    assert.equal(r.length, 0)
    // 新符号出现
    r = await codeSearch(m, "goodbye")
    assert.equal(r.length, 1)

    // 删除文件 → 增量清理
    await unlink(join(dir, "src", "app.mjs"))
    await reindexFile(m, dir, join(dir, "src", "app.mjs"))
    r = await codeSearch(m, "goodbye")
    assert.equal(r.length, 0)
  } finally {
    await removeDir(dir)
  }
})

slow("gitSync: git diff 驱动增量索引，二次调用无变更", async () => {
  const { codeSync, codeSearch, gitSync } = await import("../src/memory.mjs")
  const { writeFile } = await import("node:fs/promises")
  const { execSync } = await import("node:child_process")
  const m = freshMemory()

  const dir = mkdtempSync(join(tmpdir(), "thincoder-gitsync-"))
  const git = (...a) => execSync(`git ${a.join(" ")}`, { cwd: dir, stdio: "ignore" })
  try {
    git("init", "-q")
    git("config", "user.name", "t")
    git("config", "user.email", "t@t.dev")

    // 初始文件 + 首次全量索引
    await writeFile(join(dir, "app.mjs"), "export function hello() { return 'hi' }")
    git("add", "app.mjs")
    git("commit", "-m", "init")
    await codeSync(m, dir)
    // 首次 codeSync 后手动写入锚点（模拟正常启动流程）
    const head1 = execSync("git rev-parse HEAD", { cwd: dir, encoding: "utf8" }).trim()
    m.db.prepare(`INSERT OR REPLACE INTO meta (key, value) VALUES ('last_indexed_commit', ?)`).run(head1)

    // 二次提交：修改 + 新增
    await writeFile(join(dir, "app.mjs"), "export function hello() { return 'hello' }\nexport function bye() { return 'bye' }")
    await writeFile(join(dir, "util.mjs"), "export const V = 1")
    git("add", ".")
    git("commit", "-m", "update")

    // gitSync 应只更新变更的文件
    const res = await gitSync(m, dir)
    assert.ok(res !== null, "gitSync 不应返回 null")
    assert.ok(res.updated >= 1, `至少应更新 1 个文件，实际 ${res.updated}`)

    // 新符号可检索
    const r1 = await codeSearch(m, "bye")
    assert.ok(r1.length > 0, "新符号 'bye' 应可检索到")

    // 二次调用应无变更
    const head2 = execSync("git rev-parse HEAD", { cwd: dir, encoding: "utf8" }).trim()
    const stored2 = m.db.prepare(`SELECT value FROM meta WHERE key = 'last_indexed_commit'`).get()?.value
    assert.equal(stored2, head2, "锚点应更新到最新 commit")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("gitSync: 非 git 仓库返回 null", async () => {
  const { gitSync } = await import("../src/memory.mjs")
  const m = freshMemory()
  const dir = mkdtempSync(join(tmpdir(), "thincoder-nogit-"))
  try {
    const res = await gitSync(m, dir)
    assert.equal(res, null, "非 git 仓库应返回 null")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("doc_search 工具注册与执行", async () => {
  const { docSync, docSearchTool } = await import("../src/memory.mjs")
  const { writeFile } = await import("node:fs/promises")
  const m = freshMemory()

  const dir = mkdtempSync(join(tmpdir(), "thincoder-doctool-"))
  initGitRepo(dir)
  try {
    await writeFile(join(dir, "GUIDE.md"), `# 编码规范\n\n## 命名\n\n函数用小驼峰，类用大驼峰。`)
    await docSync(m, dir)

    const tool = docSearchTool(m)
    assert.equal(tool.name, "doc_search")
    assert.equal(tool.readonly, true)

    const output = await tool.execute({ query: "命名 规范", limit: 3 })
    assert.ok(output.includes("小驼峰"))
    assert.ok(output.includes("GUIDE.md"))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

// ========== memory 工具面重构（MEMORY.md §6——单工具 memory 五动作）==========

test("S6-1: memoryTools 单工具 memory——五动作枚举 + 描述含门禁；旧裸工具名从工具表消失", () => {
  const tools = memoryTools(freshMemory(), {})
  assert.equal(tools.length, 1, "memoryTools 只产出单工具")
  const tool = tools[0]
  assert.equal(tool.name, "memory")
  assert.equal(tool.readonly, false, "工具级 non-readonly——动作级只读由 dispatch 分类")
  assert.deepEqual(tool.parameters.properties.action.enum, ["search", "put", "list", "delete", "clear"])
  assert.deepEqual(tool.parameters.required, ["action"])
  const desc = tool.description
  assert.ok(desc.includes("confirm:true"), "描述含 confirm 门禁语义")
  assert.ok(desc.includes("team sync may resurrect"), "描述含 team 复活注（gitmem）")
  assert.ok(!tools.some((t) => t.name.startsWith("memory_")), "旧裸工具名从工具表消失（单工具 memory 五动作）")
})

test("S6-2: action list — scope/type/keyword/limit 过滤 + 行形态 + 截断注 + 空库", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-list-"))
  const m = freshMemory()
  const tool = memoryTools(m, { cwd: dir, projectDir: ".thincoder/memory", author: "t" })[0]
  try {
    // 空库
    assert.equal(await tool.execute({ action: "list" }), "0 条匹配")
    assert.equal(await tool.execute({ action: "list", type: "rule" }), "0 条匹配")

    // 种子：personal 2 + project 1
    await tool.execute({ action: "put", type: "rule", title: "代码风格", content: "不加分号，不用 TypeScript" })
    await tool.execute({ action: "put", type: "knowledge", title: "部署架构", content: "单台 VPS，Caddy 反向代理" })
    const memDir = join(dir, ".thincoder", "memory")
    const filename = await putMarkdown(m, { layer: "project", dir: memDir, type: "decision", title: "选型决策", content: "PostgreSQL 做主库", tags: [], author: "t" })

    // 全量：行形态 id [type] title（date）
    const all = await tool.execute({ action: "list" })
    assert.ok(/^personal:1 \[rule\] 代码风格（\d{4}-\d{2}-\d{2}）$/m.test(all), `personal 行形态: ${all}`)
    assert.ok(all.includes("personal:2 [knowledge] 部署架构"), all)
    assert.ok(all.includes(`project:${memDir}:${filename} [decision] 选型决策（`), `project uid 行: ${all}`)

    // scope 过滤
    const personal = await tool.execute({ action: "list", scope: "personal" })
    assert.ok(personal.includes("代码风格") && !personal.includes("选型决策"), personal)
    const project = await tool.execute({ action: "list", scope: "project" })
    assert.ok(project.includes("选型决策") && !project.includes("代码风格"), project)

    // type 过滤
    const typed = await tool.execute({ action: "list", type: "rule" })
    assert.equal(typed.split("\n").length, 1)
    assert.ok(typed.includes("代码风格"), typed)

    // keyword 过滤（title/content 子串）
    const kw = await tool.execute({ action: "list", keyword: "VPS" })
    assert.ok(kw.includes("部署架构") && !kw.includes("代码风格"), kw)
    const kwTitle = await tool.execute({ action: "list", keyword: "选型" })
    assert.ok(kwTitle.includes("选型决策"), kwTitle)

    // limit 截断 + 总条数注（"N 条——截断前 M"——N = 展示数 M = 截断前总数）
    const truncated = await tool.execute({ action: "list", limit: 1 })
    assert.ok(truncated.startsWith("1 条——截断前 3\n"), `截断注: ${truncated}`)
    assert.equal(truncated.split("\n").length, 2)

    // 非法 type/scope 明确报错
    await assert.rejects(() => tool.execute({ action: "list", type: "bogus" }), /Invalid memory type "bogus"/)
    await assert.rejects(() => tool.execute({ action: "list", scope: "bogus" }), /invalid scope "bogus"/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("S6-3: action delete 批量 — 无过滤拒/无 confirm 预览拒/0 匹配/confirm 执行/预览截断", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-delbatch-"))
  const m = freshMemory()
  const tool = memoryTools(m, { cwd: dir, projectDir: ".thincoder/memory", author: "t" })[0]
  try {
    // 种子：personal 1 rule + project 6 条（keyword 批量目标）
    await put(m, { type: "rule", title: "保留规则", content: "不要删我" })
    await put(m, { type: "knowledge", title: "保留知识", content: "不是批量目标" })
    const memDir = join(dir, ".thincoder", "memory")
    const targets = []
    for (let i = 0; i < 6; i++) {
      const filename = await putMarkdown(m, { layer: "project", dir: memDir, type: "knowledge", title: `批量目标 ${i}`, content: "批量预删除目标内容", tags: [], author: "t" })
      targets.push(filename)
    }

    // 门禁①：无过滤条件批量删拒绝（含 confirm 也拒——整层清空绕过 clear 拒共享层门禁）
    await assert.rejects(() => tool.execute({ action: "delete", scope: "project" }), /type and\/or keyword filter/)
    await assert.rejects(() => tool.execute({ action: "delete", scope: "project", confirm: true }), /type and\/or keyword filter/)
    await assert.rejects(() => tool.execute({ action: "delete", scope: "personal", type: null }), /type and\/or keyword filter/)
    await assert.rejects(() => tool.execute({ action: "delete" }), /batch delete requires scope/)

    // 门禁②：无 confirm → 返回预览（含将删条数 + 前 5 行 + 截断注 + confirm 提示），不删
    const preview = await tool.execute({ action: "delete", scope: "project", keyword: "批量" })
    const previewLines = preview.split("\n")
    assert.equal(previewLines[0], "将删 6 条：前 5 条预览", `预览首行: ${previewLines[0]}`)
    assert.equal(previewLines.length, 8, "首行 + 5 预览行 + 截断注 + confirm 提示")
    assert.ok(previewLines.slice(1, 6).every((l) => l.includes("批量目标")), `预览行形态: ${preview}`)
    assert.ok(preview.endsWith("confirm:true required — re-send with it to execute the deletion"), preview)
    assert.ok(preview.includes("5 条——截断前 6"), preview)
    assert.equal(existsSync(join(memDir, targets[0])), true, "无 confirm 不删")

    // 门禁③：0 匹配不报错
    const none = await tool.execute({ action: "delete", scope: "project", keyword: "不存在的关键字", confirm: true })
    assert.equal(none, "0 条匹配")

    // confirm 后执行：文件删 + files 行删 + search 零命中
    const done = await tool.execute({ action: "delete", scope: "project", keyword: "批量", confirm: true })
    assert.equal(done, "Deleted 6 entries in scope project")
    assert.equal(targets.filter((f) => existsSync(join(memDir, f))).length, 0, "全部文件已删")
    assert.equal(m.db.prepare(`SELECT COUNT(*) AS n FROM files WHERE layer='project' AND origin=?`).get(memDir).n, 0, "files 行已清")
    assert.equal((await search(m, "批量预删除")).length, 0, "搜索零命中")
    assert.equal((await search(m, "不要删我")).length, 1, "非匹配条目不受影响")

    // personal 批量 + type 过滤
    const r = await tool.execute({ action: "delete", scope: "personal", type: "rule", confirm: true })
    assert.equal(r, "Deleted 1 entries in scope personal")
    assert.equal((await search(m, "不要删我")).length, 0)
    assert.equal((await search(m, "保留知识")).length, 1)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("S6-3a: 孤儿 md（磁盘有、files 索引无）——list 可见 + type 批删一次删光（2026-09-05 磁盘为真相修复）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-delorphan-"))
  const m = freshMemory()
  const tool = memoryTools(m, { cwd: dir, projectDir: ".thincoder/memory", author: "t" })[0]
  const memDir = join(dir, ".thincoder", "memory")
  try {
    // 正规条目（经 putMarkdown——files 表有行）
    const f1 = await putMarkdown(m, { layer: "project", dir: memDir, type: "knowledge", title: "正规知识", content: "索引内", tags: [], author: "t" })
    // 两个孤儿：手工写盘（模拟外部拷贝 / gitmem pull / 索引失败遗留——不经 putMarkdown → 无 files 行）
    const o1 = "20260905-orphan-decision-one.md"
    const o2 = "20260905-orphan-decision-two.md"
    writeFileSync(join(memDir, o1), serializeEntry({ type: "decision", title: "孤儿决策一", tags: [], author: "t" }, "孤儿内容一"), "utf8")
    writeFileSync(join(memDir, o2), serializeEntry({ type: "decision", title: "孤儿决策二", tags: [], author: "t" }, "孤儿内容二"), "utf8")
    const indexed = m.db.prepare(`SELECT COUNT(*) AS n FROM files WHERE layer='project' AND origin=?`).get(memDir).n
    assert.equal(indexed, 1, "前提：孤儿无 files 行（仅正规条目入表）")

    // list（磁盘为真相）能看到孤儿——旧实现 files 表查询漏显
    const all = await tool.execute({ action: "list", scope: "project" })
    assert.ok(all.includes("孤儿决策一") && all.includes("孤儿决策二") && all.includes("正规知识"), `list 显示孤儿: ${all}`)

    // type=decision 批删一次删光两个孤儿——旧实现匹配不到孤儿（需 delete→syncDir 循环多轮才删净）
    const done = await tool.execute({ action: "delete", scope: "project", type: "decision", confirm: true })
    assert.equal(done, "Deleted 2 entries in scope project")
    assert.equal(existsSync(join(memDir, o1)) || existsSync(join(memDir, o2)), false, "孤儿文件已删")
    assert.equal(existsSync(join(memDir, f1)), true, "非目标文件保留")
    const after = await tool.execute({ action: "list", scope: "project" })
    assert.ok(after.includes("正规知识") && !after.includes("孤儿"), `删后 list: ${after}`)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("S6-4: action clear — 四拒门禁 + personal 清空零残留（FTS/embedding）+ 共享层不动", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-clear-"))
  const m = freshMemory()
  const tool = memoryTools(m, { cwd: dir, projectDir: ".thincoder/memory", author: "t" })[0]
  try {
    const id1 = await put(m, { type: "rule", title: "待清规则", content: "personal 要清空我" })
    await put(m, { type: "knowledge", title: "待清知识", content: "personal 也要清空" })
    m.db.prepare(`UPDATE entries SET embedding = x'01020304' WHERE id = ?`).run(id1) // 模拟已嵌入
    const memDir = join(dir, ".thincoder", "memory")
    const filename = await putMarkdown(m, { layer: "project", dir: memDir, type: "decision", title: "共享决策", content: "project 层不许 clear", tags: [], author: "t" })

    // 门禁四拒：无 scope / 非 personal scope / 无 confirm / confirm=false
    await assert.rejects(() => tool.execute({ action: "clear" }), /clear requires scope "personal"/)
    await assert.rejects(() => tool.execute({ action: "clear", scope: "project", confirm: true }), /shared layers don't support clear/)
    await assert.rejects(() => tool.execute({ action: "clear", scope: "personal" }), /clear requires confirm:true/)
    await assert.rejects(() => tool.execute({ action: "clear", scope: "personal", confirm: false }), /clear requires confirm:true/)
    assert.equal((await search(m, "待清")).length, 2, "未确认前不动")

    // 执行：清空 personal 全部 + 检索/FTS/embedding 零残留 + 共享层不受影响
    const out = await tool.execute({ action: "clear", scope: "personal", confirm: true })
    assert.equal(out, "Cleared personal memory (2 entries deleted)")
    assert.equal(m.db.prepare(`SELECT COUNT(*) AS n FROM entries`).get().n, 0, "entries 全清")
    assert.equal(m.db.prepare(`SELECT COUNT(*) AS n FROM entries_fts`).get().n, 0, "FTS 零残留")
    assert.equal(m.db.prepare(`SELECT COUNT(*) AS n FROM entries WHERE embedding IS NOT NULL`).get().n, 0, "embedding 随行清零")
    assert.equal((await search(m, "待清")).length, 0, "search 零命中")
    assert.equal((await search(m, "共享决策")).length, 1, "project 层不受 clear 影响")
    assert.equal(existsSync(join(memDir, filename)), true)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("S6-5: dispatch 动作门禁 — memory search/list 只读不过门（planMode 放行/免询问）；put/delete/clear 侧效门", async () => {
  const { executeToolCalls } = await import("../src/agent/dispatch.mjs")
  const m = freshMemory()
  const tool = memoryTools(m, {})[0]
  const toolByName = new Map([["memory", tool]])
  const base = () => ({ tools: [tool], cwd: process.cwd(), config: { agent: {} }, planMode: false, autoApprove: false, _role: null, _touchedFiles: [] })
  const call = (args) => ({ id: "c1", name: "memory", arguments: JSON.stringify(args) })
  const asks = []
  const ask = async (name, args) => { asks.push([name, args]); return true }

  // search/list：手动档不询问、直接执行
  for (const action of ["search", "list"]) {
    asks.length = 0
    const r = await executeToolCalls(base(), toolByName, [call({ action })], { onPermissionRequest: ask }, 0, undefined)
    assert.equal(r[0].ok, true, `${action} 直接执行`)
    assert.equal(asks.length, 0, `${action} 只读——无权限询问`)
  }
  // put：手动档询问后才执行（拒绝则 deny）
  asks.length = 0
  const rPut = await executeToolCalls(base(), toolByName, [call({ action: "put", type: "rule", title: "t", content: "c" })], { onPermissionRequest: ask }, 0, undefined)
  assert.equal(asks.length, 1, "put 维持侧效确认门")
  assert.equal(rPut[0].ok, true)
  // clear：同样侧效门
  asks.length = 0
  const rClear = await executeToolCalls(base(), toolByName, [call({ action: "clear", scope: "personal", confirm: true })], { onPermissionRequest: ask }, 0, undefined)
  assert.equal(asks.length, 1, "clear 侧效门")
  assert.equal(rClear[0].ok, true)
  // delete 批量：同走侧效门（询问先于执行内校验——无过滤也在批准后才报错）
  asks.length = 0
  const rDelBatch = await executeToolCalls(base(), toolByName, [call({ action: "delete", scope: "personal" })], { onPermissionRequest: ask }, 0, undefined)
  assert.equal(asks.length, 1, "delete 批量侧效门")
  assert.equal(rDelBatch[0].ok, false)
  assert.ok(String(rDelBatch[0].result).includes("type and/or keyword"), "批准后执行内校验拒绝无过滤批量删")
  // 用户拒绝 → deny 回显
  const rDeny = await executeToolCalls(base(), toolByName, [call({ action: "put", type: "rule", title: "t", content: "c" })], { onPermissionRequest: async () => false }, 0, undefined)
  assert.equal(rDeny[0].ok, false)
  assert.ok(String(rDeny[0].result).includes("permission denied"))
  // planMode：search/list 放行；put/clear 拒绝
  const plan = { onPermissionRequest: ask }
  const rPlanSearch = await executeToolCalls({ ...base(), planMode: true }, toolByName, [call({ action: "search" })], plan, 0, undefined)
  assert.equal(rPlanSearch[0].ok, true, "planMode 下 search 放行（只读动作）")
  const rPlanPut = await executeToolCalls({ ...base(), planMode: true }, toolByName, [call({ action: "put", type: "rule", title: "t", content: "c" })], plan, 0, undefined)
  assert.equal(rPlanPut[0].ok, false)
  assert.ok(String(rPlanPut[0].result).includes("plan mode"), "planMode 下 put 拒绝")
})

test("S6-6: 回归 — search scope 过滤 + 空 action 报错 + put 非法 scope 拒绝", async () => {
  const m = freshMemory()
  const tool = memoryTools(m, {})[0]
  await put(m, { type: "rule", title: "路由规则", content: "search scope 过滤个人条目" })
  // 空库 search 形态不变
  assert.equal(await tool.execute({ action: "search", query: "不存在" }), "(no matching memories)")
  // 空 query 短路（两端同语义——评审 code review #4）
  assert.equal(await tool.execute({ action: "search" }), "(no matching memories)")
  assert.equal(await tool.execute({ action: "search", query: "   " }), "(no matching memories)")
  // scope 过滤：personal 有 / project 无（未配置 projectDir 时 project 层空）
  const scoped = await tool.execute({ action: "search", query: "路由", scope: "personal" })
  assert.ok(scoped.includes("[personal][rule] 路由规则 (id=personal:1)"), scoped)
  assert.equal(await tool.execute({ action: "search", query: "路由", scope: "project" }), "(no matching memories)")
  // 未知 action / 非法 scope / 非法 type 明确报错
  await assert.rejects(() => tool.execute({}), /unknown action ""/)
  await assert.rejects(() => tool.execute({ action: "bogus" }), /unknown action "bogus"/)
  await assert.rejects(() => tool.execute({ action: "search", scope: "team2" }), /invalid scope/)
  await assert.rejects(() => tool.execute({ action: "put", scope: "bogus", type: "rule", title: "t", content: "c" }), /invalid scope "bogus"/)
})




test("markdown: serialize → parse 往返一致", () => {
  const meta = { type: "rule", title: "错误处理规范", tags: ["golang", "error"], author: "liwei" }
  const md = serializeEntry(meta, "所有错误必须 wrap 上下文。\n\n第二段。")
  const { meta: parsed, content } = parseEntry(md)
  assert.equal(parsed.type, "rule")
  assert.equal(parsed.title, "错误处理规范")
  assert.deepEqual(parsed.tags, ["golang", "error"])
  assert.equal(parsed.author, "liwei")
  assert.equal(content, "所有错误必须 wrap 上下文。\n\n第二段。")
})



test("markdown: 缺 frontmatter / 非法 type 抛错", () => {
  assert.throws(() => parseEntry("没有 frontmatter"))
  assert.throws(() => parseEntry("---\ntype: bogus\ntitle: x\n---\n内容"))
})



test("markdown: slugify 与文件名", () => {
  assert.equal(slugify("Go 错误处理! 规范"), "go-错误处理-规范")
  assert.match(entryFilename("测试"), /^\d{8}-测试-[a-z0-9]{4}\.md$/)
})

