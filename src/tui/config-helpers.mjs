/** persistRaw / syncProviderField / maskKey: config read/write helpers.
 *  Extracted from index.mjs for shared use by slash-commands, wizard, and pickers.
 *  createConfigHelpers(agent) returns { persistRaw, syncProviderField, maskKey }
 *  R10 F5（D-F5b）：persistRaw 全链（磁盘新鲜读→mutate→写）收口进 config.mjs
 *  writeConfigAtomic——mtime 门控 + .bak + 冲突放弃（见 MULTI-INSTANCE-COLLAB.md §2a.2）。
 *  createConfigHelpers(agent, opts)：opts.configPath 为测试注入缝（默认 configPath——
 *  生产 index.mjs 单参调用零变化）。 */
export function createConfigHelpers(agent, opts = {}) {
  const cfgPath = opts.configPath ?? null // null → 默认 configPath（动态 import 解）

  /** 磁盘新鲜读 → mutate（单操作）→ mtime 门控写；冲突时 throw（提示语见下——TUI
   *  slash 分发层统一 [error] 行展示；调用方若自带 try/catch 展示 Save failed 同文案）。 */
  async function persistRaw(mutate) {
    const { writeConfigAtomic, configPath } = await import("../config.mjs")
    const r = writeConfigAtomic(cfgPath ?? configPath, mutate)
    if (!r.ok) throw new Error("config changed on disk concurrently — retry")
  }

  /** Sync a field of a provider (by name) to the providers array and persist to disk.
   *  D-F5a（#1）：磁盘 fresh raw.providers 上单字段补丁——不取 agent.providers 整数组
   *  （长跑进程的内存 providers 快照不得整体写回——会抹掉对端对磁盘其他改动的保留）。
   *  内存 agent.providers 目标项同步镜像（旧行为：改内存 + 整节写盘——镜像保留内存
   *  一致性，磁盘写只剩单字段）。value === undefined → 删除该字段。 */
  async function syncProviderField(name, field, value) {
    const mem = agent.providers?.find((p) => p?.name === name)
    if (!mem) return // 内存无此 provider（旧语义 early return——不产生空写）
    await persistRaw((raw) => {
      raw.providers ??= []
      const target = raw.providers.find((p) => p?.name === name)
      if (!target) return // 磁盘目标已被对端删除 → 只做内存镜像，不落盘
      if (value === undefined) delete target[field]
      else target[field] = value
    })
    if (value === undefined) delete mem[field]
    else mem[field] = value
  }

  /** Mask API key for display */
  function maskKey(key) {
    if (!key) return "(none)"
    if (key.length <= 8) return "***"
    return key.slice(0, 5) + "\u2026" + key.slice(-4)
  }

  return { persistRaw, syncProviderField, maskKey }
}
