/**
 * at-complete.mjs — `at:complete` 文件枚举过滤出档（R1 输入面板移植 · 桌面宿主面；Q11 定档 ——
 * **不扩 `file-links.mjs`**：该档判据面 = 链接验存 ∕ 打开目标，非枚举；本档零改该档）。
 *
 * 语义同源 = VSC `panel-index.mjs:58-86`（多实现面各自落地 —— 端侧自有实现，非逐字拷贝）：
 * `@` 前缀剥离 → 项目树枚举 → 过滤 → 封顶 20 → `{ name, path }`（`path` = 项目根相对 **posix** 串）。
 * 排除面照 VSC 逐字 = `node_modules` ∕ `.git` ∕ `dist` 三目录不入遍历；软链一律跳过（**安全裁定** —— 防环；
 * VSC 同档未见显式排除软链的设定 —— 端侧保守自定，收正轮注记保位）。过滤 = **名字段前缀**（末段 `startsWith`，
 * 大小写不敏感 —— 对位 VSC `findFiles("**∕<pattern>*")` 的名字段语义；路径前缀 ∕ 路径中段两支**退场**）。
 * 回执 `{ ok, matches, seq }`：**`seq` 原样回携**（宿主不改写 ∕ 不重编号 —— 迟到丢弃判据 = 消费面，
 * VSC `autocomplete.js:29-34` 同式）；空 query ∕ 空 pattern ∕ 零命中 ⇒ `matches: []`（⇒ 消费面关下拉）。
 * 读面纪律：只读盘（`node:fs/promises` 异步遍历 —— 主进程不阻塞）；不可读目录 = 零贡献（不抛 —— 沿
 * `file-links.mjs` 验存面「不可达 ≠ 错误」同款）；命中满 `AT_MAX_MATCHES` 即止（沿 VSC `maxResults` 语义）。
 */
import { readdir } from "node:fs/promises"
import { join, relative, sep } from "node:path"

/** 命中封顶（值同源 = VSC `findFiles(..., 20)` ∕ `uris.slice(0, 20)`）。 */
export const AT_MAX_MATCHES = 20

/** 排除三目录（VSC 排除面逐字 —— 名面匹配，任意深度）。 */
const SKIP_DIRS = Object.freeze(["node_modules", ".git", "dist"])

/** 相对路径 → posix 串（回执 `path` 形 —— VSC `relative(base, …).replace(/\\/g, "/")` 同式）。 */
const posixOf = (path) => (sep === "/" ? path : path.split(sep).join("/"))

/** 过滤判据（**收窄** —— VSC `findFiles("**∕<pattern>*")` 的名字段前缀语义）：名字段（末段）前缀匹配、大小写
 *  不敏感（两平台同式 —— VSC glob 同源）；原「路径前缀 ∨ 路径中段」两支退场（收正轮：两端命中面一致）。 */
function hit(name, pattern) {
  return name.toLowerCase().startsWith(pattern.toLowerCase())
}

/** 项目树枚举（深度优先；同目录内按名序 —— 输出可复跑）：命中原样 `{ name, path }` 累入，满顶即止。 */
async function findMatches(cwd, pattern) {
  const matches = []
  const walk = async (dir) => {
    if (matches.length >= AT_MAX_MATCHES) return
    let entries
    try {
      entries = await readdir(dir, { withFileTypes: true })
    } catch {
      return // 不可读目录（权限 / 竞态删除）= 零贡献（不抛 —— 枚举面 fail-soft）
    }
    for (const entry of [...entries].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))) {
      if (matches.length >= AT_MAX_MATCHES) return
      if (entry.isSymbolicLink()) continue // 软链（含目录链）不入遍历 —— 防环
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.includes(entry.name)) await walk(join(dir, entry.name))
        continue
      }
      if (!entry.isFile()) continue // 常规文件才成候选（回执 path 须为可读件）
      const rel = posixOf(relative(cwd, join(dir, entry.name)))
      if (hit(entry.name, pattern)) matches.push({ name: entry.name, path: rel })
    }
  }
  await walk(cwd)
  return matches
}

/** 造 `at:complete` 处理面：deps 注入（`projects` = 项目面取值 —— 本档零全局）——返回 `{ atComplete }`。 */
export function createAtComplete({ projects } = {}) {
  /** `atComplete(query, seq)` ⇒ `{ ok, matches, seq }`：`query` 非串 ⇒ 按空 pattern；未开项目（cwd 无源）⇒
   *  空候选（无项目无枚举对象 —— 回执形不缺 ∕ 零假造）。 */
  async function atComplete(query, seq) {
    const raw = typeof query === "string" ? query : ""
    const pattern = raw.startsWith("@") ? raw.slice(1) : raw
    const cwd = projects?.currentCwd()
    const receipt = (matches) => ({ ok: true, matches, seq: seq ?? null })
    if (pattern === "" || typeof cwd !== "string" || cwd === "") return receipt([])
    return receipt(await findMatches(cwd, pattern))
  }

  return { atComplete }
}
