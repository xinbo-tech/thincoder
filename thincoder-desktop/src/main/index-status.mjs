/**
 * index-status.mjs — 语义索引面处理体（R2 · 桌面功能对位批 · 批档 §2.4 R2 #3）：构建入口 + 状态读数。
 *
 * 两面（源 = VSC `thincoder-vscode/src/extension/panel-index.mjs:146/:180/:186-187`；核出口 =
 * `thincoder-core/memory/code-sync.mjs:192`（`codeSync`）· `memory/docs.mjs:25`（`docSync`）· 同档 `gitSync`）：
 *   ① `runIndexBuild` —— 构建入口：先 `gitSync`（增量径；**无锚 ∕ 非 git 仓 ∕ git 不可得 ⇒ `null`**）⇒ 落
 *      全量 `codeSync` ∥ `docSync`（不同表 —— 核内注释「SQLite WAL 支持并行」；VSC ∕ CLI 同律）。回执 =
 *      计数摘要 ∥ 失败句（**不抛** —— 失败落 `{ ok:false, reason }`，失败面端侧可见；沿
 *      `session-maintenance.mjs` 同批先例）。
 *   ② `readIndexCounts` —— 状态读数：核**只读出口** `memoryStatus()`（R2 · 台账 #412 正解）单点，端侧
 *      **零 SQL ∕ 零表名**（判据：端侧直读核内表不授权——`docs/desktop/design/PROJECT.md` §10 N 行）；
 *      按归一 origin 限定本项目（核 `memoryStatus` 内归一，端侧原样传目录）。
 *
 * 纪律：**零 `electron` 依赖**（宿主面 = 回执 —— 平 node 可直测）；**无本项目 ⇒ 读数零计数 ∕ 构建
 * `no-project`**（禁假造：不跨项目读全库、不落假计数）；**库不在盘 ⇒ 读数零计数且不建库**（读面零副作用
 * —— 建库归构建 ∕ 装配径）；句柄 ∕ embedder 装配形沿 `agent-assemble.mjs:67-71`（配置 `memory.dbPath` +
 * 有 `embedding.apiKey` 才附 embedder —— 装配面单形）。
 */
import { existsSync } from "node:fs"
import { loadConfig } from "@thincoder/core/config.mjs"
import { createEmbedder } from "@thincoder/core/embedding.mjs"
import { codeSync, createMemory, docSync, gitSync, memoryStatus } from "@thincoder/core/memory.mjs"

/** 句柄装配（形 = `agent-assemble.mjs:67-71` —— 同一配置面取值；有 embedding key 才附 embedder）。 */
function openMemory(config) {
  const memory = createMemory({ dbPath: config.memory.dbPath })
  if (config.embedding?.apiKey) memory.embedder = createEmbedder(config.embedding)
  return memory
}

/** ② 状态读数（本项目 origin 限定）⇒ `{ indexed, files, chunks }`：
 *  - `dir` 缺 ∕ 非非空串 ⇒ 零计数（**不跨项目读全库**）；
 *  - 库不在盘 ⇒ 零计数且**不建库**（读面零副作用）；
 *  - 计数 = 核 `memoryStatus()` 的 `totals`（code + doc 两表：去重文件数 ∕ 分块数）。 */
export function readIndexCounts({ dir = null } = {}) {
  if (typeof dir !== "string" || dir === "") return { indexed: false, files: 0, chunks: 0 }
  const config = loadConfig()
  if (!existsSync(config.memory.dbPath)) return { indexed: false, files: 0, chunks: 0 }
  const memory = openMemory(config)
  try {
    const status = memoryStatus(memory, { origin: dir })
    return { indexed: status.indexed, files: status.totals.files, chunks: status.totals.chunks }
  } finally { memory.db.close() }
}

/** ① 构建入口 ⇒ `{ ok:true, files, chunks }` ∥ `{ ok:false, reason }`：
 *  无本项目 ⇒ `no-project`（零动作）；全量两 sync 有失败项 ⇒ 失败句并（**不吞** —— 部分成功不冒充成功）；
 *  其余异常落回执。回执计数 = 构建后同源读数（核出口；端侧随刷新面另复读 —— VSC `buildIndex` 尾同律）。 */
export async function runIndexBuild({ dir = null } = {}) {
  if (typeof dir !== "string" || dir === "") return { ok: false, reason: "no-project" }
  let memory = null
  try {
    memory = openMemory(loadConfig())
    const incremental = await gitSync(memory, dir)
    if (incremental === null) {
      const [code, doc] = await Promise.allSettled([codeSync(memory, dir), docSync(memory, dir)])
      const failed = [code, doc]
        .filter((settled) => settled.status === "rejected")
        .map((settled) => settled.reason?.message ?? String(settled.reason))
      if (failed.length) return { ok: false, reason: failed.join("; ") }
    }
    const status = memoryStatus(memory, { origin: dir })
    return { ok: true, files: status.totals.files, chunks: status.totals.chunks }
  } catch (error) {
    return { ok: false, reason: error?.message ?? String(error) }
  } finally { memory?.db?.close() }
}
