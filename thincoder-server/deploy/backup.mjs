#!/usr/bin/env node
/**
 * backup.mjs — 在线一致备份（ops/OPS.md §5.5 ∥ KD-SV-25）：node:sqlite `backup()` 快照——WAL 安全、免停写窗、
 * 与运行实例并存（源库只读开 ⇒ 零触）。自足（零 App 依赖——仅 node 内建，沿 `converge.mjs` 同律：镜像内
 * `deploy/` 与 npm 装的包不同根 ⇒ 不走 `src/ops/config.mjs`，配置档按 JSON 直读定位库）。
 *
 * 运行：node deploy/backup.mjs --config <配置档> [--out <目录>]
 *   `--out` 缺省 = 配置档旁 `backups/`；产物 = `<out>/gateway-<时间戳>.db`（本地时间 `YYYYMMDD-HHmmss`）。
 *   `db` 的 `env:` 引用照配置契约解析（ops/OPS.md §1——缺位 ⇒ 退出 1）。
 *   容器路：docker compose exec server node /app/deploy/backup.mjs --config /app/config/config.json --out /app/data/backups
 * 退出码：0 = 快照已生成（stdout 一行 = 产物路径——可管道消费）∥ 1 = 失败（stderr 说明）。
 * 同名碰撞（同一秒重复运行——时间戳同秒）⇒ 拒写退出 1（不覆盖既有快照——换秒重试或换 `--out`）。
 * 环境回退：若本机 `backup()` 不可用/核验不过 ⇒ 回退 = 停写窗快照方案（停服 ⇒ 以快照替换库 + 清 `-wal`/`-shm`
 *   伴档 ⇒ 起服；README「备份」节明示——本档不做）。
 */
import { existsSync, mkdirSync, readFileSync } from "node:fs"
import { dirname, isAbsolute, join, resolve } from "node:path"
import { DatabaseSync, backup } from "node:sqlite"
import { pathToFileURL } from "node:url"

export const USAGE = "用法：node deploy/backup.mjs --config <配置档> [--out <目录>]（--out 缺省 = 配置档旁 backups/；产物 = gateway-<时间戳>.db）"

/** 时间戳（本地时间 `YYYYMMDD-HHmmss`——可排序 ∥ 文件系统安全）。 */
export function stamp(now = new Date()) {
  const pad = (n) => String(n).padStart(2, "0")
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
}

/** argv 解析（`--名 值` ∥ `--名=值`；未知参数/缺值 ⇒ 抛）。 */
export function parseArgs(argv) {
  const options = {}
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    const eq = arg.indexOf("=")
    const name = arg.startsWith("--") ? (eq >= 0 ? arg.slice(2, eq) : arg.slice(2)) : null
    if (!name || !["config", "out"].includes(name)) throw new Error(`未知参数：${arg}\n${USAGE}`)
    const value = eq >= 0 ? arg.slice(eq + 1) : i + 1 < argv.length && !argv[i + 1].startsWith("--") ? argv[++i] : null
    if (value === null || value === "") throw new Error(`参数缺值：--${name}\n${USAGE}`)
    options[name] = value
  }
  return options
}

/** 配置档 → 库路径（`db` 相对 = 配置档所在目录；缺省 `data/gateway.db`——口径同 ops/OPS.md §1）；
 *  `env:变量名` 引用照配置契约解析（缺位 ⇒ 抛；同档唯一例外 = `providers[].apiKey`——本档不触）。 */
export function resolveDbPath(configPath, { env = process.env } = {}) {
  const configPathAbs = resolve(configPath)
  let raw
  try {
    raw = JSON.parse(readFileSync(configPathAbs, "utf8"))
  } catch (e) {
    throw new Error(`配置档不可读/非合法 JSON：${configPathAbs}（${e.message}）`)
  }
  const dbRef = typeof raw.db === "string" && raw.db.trim() !== "" ? raw.db : "data/gateway.db"
  const db = dbRef.startsWith("env:") ? env[dbRef.slice(4)] : dbRef
  if (typeof db !== "string" || db.trim() === "") throw new Error(`db 的 env: 引用缺位：${dbRef}（配置项 db）`)
  return { dbPath: isAbsolute(db) ? db : resolve(dirname(configPathAbs), db), baseDir: dirname(configPathAbs) }
}

/** 入口：解析 → 定位库 → 快照到 `<out>/gateway-<时间戳>.db`（out 自动建目录）。 */
export async function runBackup(argv = process.argv.slice(2), { print = console.log } = {}) {
  try {
    const options = parseArgs(argv)
    if (!options.config) throw new Error(`缺少配置档（--config <配置档>）\n${USAGE}`)
    const { dbPath, baseDir } = resolveDbPath(options.config)
    const outDir = resolve(options.out ?? join(baseDir, "backups"))
    const target = join(outDir, `gateway-${stamp()}.db`)
    if (existsSync(target)) throw new Error(`目标已存在：${target}（同一秒重复运行——换秒重试 ∥ 换 --out；不覆盖既有快照）`)
    mkdirSync(outDir, { recursive: true })
    const source = new DatabaseSync(dbPath, { readOnly: true }) // 只读开：源库零触（快照 = SQLite 在线备份 API）
    try {
      await backup(source, target)
    } finally {
      source.close()
    }
    print(target)
    return 0
  } catch (e) {
    process.stderr.write(`备份失败：${e.message}\n`)
    return 1
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await runBackup()
}
