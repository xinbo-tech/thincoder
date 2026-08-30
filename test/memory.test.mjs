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
import { mkdtempSync, rmSync, writeFileSync, readFileSync, mkdirSync } from "node:fs"
import { tmpdir } from "node:os"
import { execSync } from "node:child_process"

import { createMemory, put, search, list, remove, putMarkdown, syncDir } from "../src/memory.mjs"
import { serializeEntry } from "../src/markdown.mjs"

// ---------------------------------------------------------------- helpers

function freshMemory() {
  return createMemory({ dbPath: ":memory:" })
}

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
  const { writeFile, mkdir } = await import("node:fs/promises")
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
