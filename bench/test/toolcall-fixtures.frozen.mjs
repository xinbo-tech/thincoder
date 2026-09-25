/**
 * test/toolcall-fixtures.frozen.mjs — 工具调用探针夹具**冻结副本**（§11.2 两层同源 · 两层机检的另一侧）。
 *
 * 本档 = **逐字复制**自 `bench/toolcall/fixture.mjs`（版本 / `SYSTEM_BASE` / V1 枚举块 5 档）与
 * `bench/toolcall/cases.mjs`（用例集 14 例 + 谓词数据）——字面常量，**不是 import、不是再派生**；
 * 两层机检 = 两档字面逐字等值（改夹具须两档同改 + `TOOL_PROBE_VERSION + 1`）。
 */

export const FROZEN_TOOL_PROBE_VERSION = 1

export const FROZEN_SYSTEM_BASE = "你是通用助手。请按用户请求作答：需要工具时调用工具；不需要时直接回答。"

export const FROZEN_V1_ENUM_BLOCKS = {
  read: `read：
**选择面（枚举）**
- 单文件整读 / 分页读（已知文件）⇒ read
- 找行 / 找符号位置（尚不知在哪）⇒ grep（不选 read）
- 只按名找文件 ⇒ glob；列目录 ⇒ ls；目录树 ⇒ tree（不选 read）
- 看图 ⇒ read_image（不选 read）`,
  grep: `grep：
**选择面（枚举）**
- 按内容模式（正则 / 字面）在文件或目录里找行 ⇒ grep
- 按文件名 / 路径模式找文件 ⇒ glob（不选 grep）
- 已知文件、要读内容或某段 ⇒ read（不选 grep）`,
  bash: `bash：
**选择面（枚举）**
- 构建 / 测试 / 包管理 / 一次性管道（无专用工具可表达）⇒ bash
- 读文件（cat / type / head / tail）⇒ read；列目录（ls / dir）⇒ ls；按名找文件（find）⇒ glob；按内容找行（grep / rg / findstr）⇒ grep
- 写文件（echo > / sed -i / printf >）⇒ write / edit / hashline_edit / apply_patch
- 仓内 git 操作（status / diff / log / add / commit / push…）⇒ git
- 删单文件 ⇒ delete；删目录（含递归）⇒ bash（rm -rf）
- 要解析 / 计算 / 循环的复杂逻辑 ⇒ execute（node 进程内）`,
  git: `git：
**选择面（枚举）**
- 仓内 git 操作（状态 / 差异 / 提交 / 分支 / 标签 / 快照 / 远端）⇒ git
- 非 git 的 shell 命令（构建 / 测试 / 包管理）⇒ bash（不选 git）
- 改文件内容 ⇒ edit / write（git 只管版本面，不改内容）`,
  edit: `edit：
**选择面（枚举）**
- 已知目标区（内容或行号）做替换 / 删除 ⇒ edit
- 整篇重写 ⇒ write（不选 edit）
- 在某行之后新增一行 ⇒ insert_after（不选 edit）
- 多文件同改 / 一次建多档 ⇒ apply_patch
- 行号可能漂移 / 空白噪声大 ⇒ hashline_edit`,
}

const eq = (key, value) => ({ k: "eq", key, value })
const absent = (key) => ({ k: "absent", key })
const notTrue = (key) => ({ k: "notTrue", key })
const isString = (key) => ({ k: "string", key })
const matches = (key, src) => ({ k: "re", key, src })
const includes = (key, value) => ({ k: "includes", key, value })
const linesEq = (key, value) => ({ k: "linesEq", key, value })
const emptyArgs = { k: "empty" }

export const FROZEN_CASES = [
  {
    id: "tool.1", kind: "pair",
    prompt: "看一下 `docs/a.txt` 从第 10 行开始的 5 行。",
    expect: { name: "read", argsOk: [eq("path", "docs/a.txt"), eq("offset", 10), eq("limit", 5)] },
  },
  {
    id: "tool.2", kind: "pair",
    prompt: "在 `src/` 下搜索字符串 `TODO(`——按**字面**匹配，不要当正则。",
    expect: { name: "grep", argsOk: [eq("pattern", "TODO("), eq("literal", true), eq("path", "src")] },
  },
  {
    id: "tool.3", kind: "pair",
    prompt: "把 `docs/notes.txt` 里**所有** `旧口径` 替换成 `已收正`。",
    expect: {
      name: "edit",
      argsOk: [eq("path", "docs/notes.txt"), eq("old_string", "旧口径"), eq("new_string", "已收正"), eq("replace_all", true)],
    },
  },
  {
    id: "tool.4", kind: "pair",
    prompt: "新建 `docs/plan.txt`，整篇内容就是三行：`A` / `B` / `C`（各占一行，没有别的）。",
    expect: { name: "write", argsOk: [eq("path", "docs/plan.txt"), linesEq("content", ["A", "B", "C"])] },
  },
  {
    id: "tool.5", kind: "pair",
    prompt: "跑一下全量测试（`node --test`），把输出贴给我。",
    expect: { name: "bash", argsOk: [isString("command"), matches("command", "node\\s+--test")] },
  },
  {
    id: "tool.6", kind: "pair",
    prompt: "看看当前工作树里有哪些**还没提交**的改动（只要文件清单）。",
    expect: { name: "git", argsOk: [eq("action", "status")] },
  },
  {
    id: "tool.7", kind: "pair",
    prompt: "在 `docs/CHANGELOG.txt` 第 12 行**之后**插入一行：`- 2026-09-25：工具面探针。`",
    expect: {
      name: "insert_after",
      argsOk: [eq("path", "docs/CHANGELOG.txt"), eq("after_line", 12), includes("content", "工具面探针")],
    },
  },
  {
    id: "tool.8", kind: "pair",
    prompt: "把 `docs/notes.txt` 的第 40 行整行删掉（别的行不要动）。",
    expect: { name: "edit", argsOk: [eq("path", "docs/notes.txt"), eq("line", 40), absent("new_string")] },
  },
  {
    id: "tool.9", kind: "pair",
    prompt: "把临时文件 `tmp/scratch.txt` 删掉。",
    expect: { name: "delete", argsOk: [eq("path", "tmp/scratch.txt"), notTrue("force")] },
  },
  {
    id: "tool.10", kind: "pair",
    prompt: "把 `tmp/build-out/` 这整个目录连同里面的东西一起删掉。",
    expect: { name: "bash", argsOk: [includes("command", "tmp/build-out"), matches("command", "-[a-zA-Z]*[rRfF]|--recursive")] },
  },
  {
    id: "tool.11", kind: "boundary",
    prompt: "把 git 标签 `v1.2.0` 删掉。",
    expect: { name: "git", argsOk: [eq("action", "tag"), eq("tagAction", "delete"), eq("name", "v1.2.0")] },
  },
  {
    id: "tool.12", kind: "boundary",
    prompt: "在 `docs/` 下搜 `暂缓核销`，只看 `.md` 文件（排除 `tmp/` 子目录），每条命中前后各带 2 行上下文。",
    expect: {
      name: "grep",
      argsOk: [eq("pattern", "暂缓核销"), includes("glob", ".md"), includes("glob", "!"), eq("before", 2), eq("after", 2)],
    },
  },
  {
    id: "tool.13", kind: "boundary",
    prompt: "一年有几个月？直接回答，不用工具。",
    expect: { name: null, argsOk: null },
  },
  {
    id: "tool.14", kind: "normal",
    prompt: "现在几点了？用工具取当前时间。",
    expect: { name: "get_current_time", argsOk: [emptyArgs] },
  },
]
