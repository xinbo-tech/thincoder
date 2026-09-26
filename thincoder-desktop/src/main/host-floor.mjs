/**
 * host-floor.mjs — 宿主下限纯谓词 + `node:sqlite` 探针（PROJECT.md §2 KD-7；批档 §2.6 D-2）。
 * **零 `electron` 导入**：`main.mjs` 顶层静态 import `electron` ⇒ 平 node 导入必炸；
 * 本档为叶子模块，自动层（`npm test`）可直接 import（拆分理由 = 批档 §2.3 末段 · R-2）。
 * 下限事实单源 = `MIN_NODE`；判据面 = 启动自检实测，不把下限压在外部档上（KD-7）。
 */

/** 宿主内置 Node 下限：Node 24 主版本底线（核依赖 `node:sqlite` 免 flag 自 Node 22.13 起 ⇒ 宿主须 Electron ≥ 44.x，内置 Node 24.21.0；Electron 37 面已 EOL）。 */
export const MIN_NODE = "24.0.0"

/** 版本解析：仅接受 `x` / `x.y` / `x.y.z` 纯数字段；含预发布标记（`-rc.1` 等）⇒ null（保守不过闸）。 */
function parseVersion(version) {
  const match = /^(\d+)(?:\.(\d+))?(?:\.(\d+))?$/.exec(String(version ?? "").trim())
  if (!match) return null
  return [Number(match[1]), Number(match[2] ?? 0), Number(match[3] ?? 0)]
}

const [FLOOR_MAJOR, FLOOR_MINOR] = parseVersion(MIN_NODE)

/** 宿主版本谓词：`24` 按 24.0 判 ⇒ 恰达过闸（下限 minor 归 0）；措辞面见 MIN_NODE。 */
export function hostFloorMet(version) {
  const parsed = parseVersion(version)
  if (parsed === null) return false
  const [major, minor] = parsed
  return major > FLOOR_MAJOR || (major === FLOOR_MAJOR && minor >= FLOOR_MINOR)
}

/** `node:sqlite` 探针：可动态导入 ⇒ true；缺模块 / 其它失败 ⇒ false（不抛——下限面判定，非异常面）。 */
export async function sqliteAvailable(loadSqlite = () => import("node:sqlite")) {
  try {
    await loadSqlite()
    return true
  } catch (error) {
    console.warn(`[host-floor] node:sqlite unavailable: ${error?.message ?? error}`)
    return false
  }
}

/** 复合下限谓词（自检调用面）：Node 够 ∧ `node:sqlite` 可载。 */
export async function engineFloorMet({ version, loadSqlite } = {}) {
  return hostFloorMet(version) && (await sqliteAvailable(loadSqlite))
}
