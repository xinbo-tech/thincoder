/**
 * skip-dirs.mjs — 目录排除名单**零依赖叶档**（本批 E12：四份名单合一份）。
 *
 * 四份并存曾是漂移源：`index-discover.mjs:28`（8 项）· `tools/shared.mjs:27`（6 项，名 `IGNORED_DIRS`）·
 * `tools/tree.mjs:13`（13 项）· `memory/schema.mjs:48-69`（39 项 + 折叠集 + 前缀族）。同一个问题
 * （「哪些目录不是人要读的东西」）四个答案；索引面与检索面各剪各的，同一批文件在两个面上一进一出。
 * 单源 = 本档，四个消费面只 import 名单，不各自持有副本。
 *
 * **名单只此一份**：`SKIP_DIRS`（42 项）答「索引 / 遍历 / 搜索时跳过什么」——剪掉的是噪音。
 * 面判不读任何排除名单：面只有两值（文档面放行 ∥ 其余产品面拦），「什么算产物」不参与面判定。
 *
 * 三条处置（理由写在项旁，防后人「顺手补回去」）：
 * - `bin` **不列**：`thincoder-cli/bin/` 有 2 个 `.mjs` 是 CLI 入口、产品代码；列进名单会把入口
 *   漏出索引与检索面。
 * - `turbo` 并入 `.turbo`：`tools/tree.mjs` 旧名单里的 `turbo`（无点）是笔误，另三份都是 `.turbo`，
 *   工作区递归查 `*turbo*` 零命中该目录。
 * - `.thincoder` / `.vs` / `.idea` 本批补入：工具临时目录与 IDE 配置——进索引是噪音。
 *
 * 零依赖：本档只出常量，无 import——四处引它不成环、不加重量（`memory/schema.mjs` 引 `node:sqlite`、
 * `conventions.mjs` 的依赖链被 `declaration.mjs` → `manifest.mjs` 拖着走，两条都不适合当单源落点）。
 */

/** 索引 / 遍历 / 搜索的剪枝全集（42 项）。精确段匹配（`memory/file-walk.mjs` 另叠折叠与前缀口径）。 */
export const SKIP_DIRS = new Set([
  // 产物 / 依赖（19）
  "node_modules", ".git", "dist", "build", ".turbo", "coverage",
  "__pycache__", ".venv", "venv", "target", ".next", ".nuxt", ".svelte-kit",
  "vendor", "Pods", "bower_components", "third_party", "obj", "out",
  // Windows 用户目录（14——永不含项目代码）
  "AppData", "Application Data", "Desktop", "Documents", "Downloads",
  "Music", "Pictures", "Videos", "OneDrive", "Contacts", "Favorites",
  "Links", "Saved Games", "Searches",
  // 其他非代码目录（6——Library = macOS 用户目录；go = Go workspace；三项 Windows 系统目录）
  "Library", "go", "Program Files", "Program Files (x86)", "Windows", "$Recycle.Bin",
  // 本批补（3——工具临时目录 / IDE 配置；见头注）
  ".thincoder", ".vs", ".idea",
])

/** win32 大小写折叠子集（18 项——那台文件系统不区分大小写，`Node_Modules` 仍要剪）。
 *  `.git` 不在：它由 `memory/file-walk.mjs` 的点段规则覆盖，不属本族。 */
export const SKIP_DIRS_FOLD = new Set([
  "node_modules", "dist", "build", ".turbo", "coverage",
  "__pycache__", ".venv", "venv", "target", ".next", ".nuxt", ".svelte-kit",
  "vendor", "Pods", "bower_components", "third_party", "obj", "out",
])

/** 目录名前缀族（`bazel-<workspace>` 无法枚举——workspace 名任意）。 */
export const SKIP_DIR_PREFIXES = ["bazel-"]
