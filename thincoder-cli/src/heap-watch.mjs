/**
 * heap-watch.mjs — 堆遥测/看门狗（TUI-OOM-ROOTCAUSE 批——CRASH-REPORTS.md §8）。
 *
 * 事故会话堆爬升 ~19 分钟无任何事前信号（「炸了才知道」）；本模块补「事前预警」：
 * 60s 采样 + 堆上限比例双档（70% / 85%）边缘触发 → stderr 行 + TUI 行（订阅制）+
 * 事件日志。**只看不治**（不强制 GC、不阻断、不触发快照——D-HW2）。
 *
 * 关口（§8.3）：阈值 = `heapUsed / v8.getHeapStatistics().heap_size_limit`（比例——可移植，
 * 无绝对 MB 常量）；双档边缘触发（每档一次/进程——不重复刷屏）；零常态开销
 * （60s 一次 memoryUsage()，无输出——D-HW5）。
 *
 * 开关单点：`THINCODER_HEAP_WATCH`——关值集合 {`0`,`false`,`off`,`no`}（trim + 大小写
 * 不敏感）→ 不启动；未设/空串/其他值 → 启动（默认开——与 F3② 同约定）。
 *
 * 注入缝（N5 可测）：`sample` / `heapLimit` / `timer`——测试以假实现 + `checkNow()`
 * 直驱（零等待）；失败面全吞（采样抛错不阻断——样本失败静默跳过本次）。
 */
import { getHeapStatistics } from "node:v8"
import { logEvent } from "./log.mjs"

/** 关值集合（单点判定——§3.2 同约定复用）。 */
export const HEAP_WATCH_OFF = new Set(["0", "false", "off", "no"])

/** 开关判定（单点——grep 面：仅本模块读 env.THINCODER_HEAP_WATCH）。 */
export function heapWatchEnabled(env = process.env) {
  const v = String(env.THINCODER_HEAP_WATCH ?? "").trim().toLowerCase()
  return !HEAP_WATCH_OFF.has(v)
}

// 订阅表（TUI 行接线——§8.3 订阅制；模块级：武装在 bin、订阅在 startTUI）
const _subscribers = new Set()

/** 订阅预警行（返回退订函数）。 */
export function onHeapWarn(cb) {
  if (typeof cb !== "function") return () => {}
  _subscribers.add(cb)
  return () => _subscribers.delete(cb)
}

/** 预警行格式化（逐字——§8.3；U/L 一位小数、P 取整）。 */
export function heapWarnLine(used, limit, ratio) {
  const gb = (n) => (n / 1024 / 1024 / 1024).toFixed(1)
  return `[heap] warning: heapUsed ${gb(used)} GB / ${gb(limit)} GB heap limit (${Math.round(ratio * 100)}%) — long session; consider /new to reset context`
}

/**
 * 启动看门狗（返回 `{ stop(), checkNow() }`——checkNow 直驱一次采样并返回本轮新发预警行）。
 * 关值（§8.3）→ 不注册定时器（返回惰性句柄）。
 */
export function startHeapWatch({
  intervalMs = 60_000,
  ratios = [0.7, 0.85],
  sample = process.memoryUsage,
  heapLimit = () => getHeapStatistics().heap_size_limit,
  env = process.env,
  timer = setInterval,
} = {}) {
  const warned = new Set()
  const checkNow = () => {
    const out = []
    try {
      const used = sample()?.heapUsed ?? 0
      const limit = heapLimit()
      if (!(limit > 0)) return out
      const ratio = used / limit
      for (const r of ratios) {
        if (ratio >= r && !warned.has(r)) {
          warned.add(r) // 每档一次/进程
          const line = heapWarnLine(used, limit, ratio)
          out.push(line)
          try { console.error(line) } catch { /* 输出失败不阻断 */ } // stderr（headless 主面——§8.3）
          for (const cb of _subscribers) { try { cb(line) } catch { /* 订阅者失败不阻断 */ } }
          try { logEvent("heap-warn", { kind: "heap-warn", used, limit, ratio: Number(ratio.toFixed(3)) }) } catch { /* 日志失败不阻断（D-HW4） */ }
        }
      }
    } catch { /* 失败面全吞（N5——采样/上限抛错不阻断、状态保持） */ }
    return out
  }
  if (!heapWatchEnabled(env)) return { stop() {}, checkNow }
  const handle = timer(checkNow, intervalMs)
  try { handle?.unref?.() } catch { /* unref 失败不阻断（一次性命令自然退出） */ }
  return {
    stop() {
      try { clearInterval(handle) } catch { /* 已停/不可清——静默（尽力面） */ }
    },
    checkNow,
  }
}
