/**
 * host-shim.mjs — web 快筛 host shim（设计单源 = `docs/desktop/design/WEB-QUICKCHECK.md` §3.2）：
 * `window.thincoder` 窄桥**同形**（`invoke(channel, payload) → Promise<receipt>` ∥ `on(name, cb) → off`——
 * 装配面 = `thincoder-desktop/src/preload/preload.cjs:76`）+ **7 通道 stub 表**（= 引导链实际调用集）；
 * 表外 ⇒ `Promise.reject`（沿 preload 表外 reject 先例——`preload.cjs:73`）+ `__quickcheck.unstubbed` 记名
 * ——冒烟收口断言零（产品 boot 新增通道 ⇒ 此处红 ⇒ 同批扩表——防静默漏面）。
 * 注入 = **服务端静态注入**（`serve.mjs` 把本档脚本行插于 `app.mjs` 前——手动浏览与 Playwright 同一形）。
 * v1 零事件发射：`on` 登记入记录面 ⇒ 返回空退订（事件面不在本冒烟——设计档 §7-5）。
 */

/** 7 通道 stub 表（回执逐形 = 设计档 §3.2 表；扩表走设计档修订——不在工具里就地长语义）。 */
const STUBS = Object.freeze({
  "config:read": () => ({ config: {}, locale: "en", dict: {}, configured: true }),
  "project:recent": () => ({ cwd: null, recent: [] }),
  "sessions:list": () => ({ sessions: [], ledger: null }),
  "model:catalog": () => ({ ok: true, models: [], unavailable: [] }),
  "provider:list": () => ({ ok: true, active: null, presets: [], providers: [] }),
  "ledger:read": () => ({ ok: true, counts: null, thresholdReached: false }),
  "batch:status": () => ({ ok: true, phase: null }),
})

/** 装配（`target` = 注入缝——页面面缺省 `globalThis`，平 node 直测传入假载体）：记录面 + 窄桥两件 ⇒ 返记录面（= `target.__quickcheck`）。 */
export function installHostShim(target = globalThis) {
  const record = { calls: [], unstubbed: [], subscriptions: [] }
  const invoke = (channel, payload) => {
    record.calls.push(channel)
    if (!Object.hasOwn(STUBS, channel)) {
      record.unstubbed.push(channel)
      return Promise.reject(new Error(`[quickcheck] channel not stubbed: ${channel}`))
    }
    return Promise.resolve(STUBS[channel](payload))
  }
  const on = (name, cb) => {
    record.subscriptions.push(name)
    return () => {}
  }
  target.__quickcheck = record
  target.thincoder = { invoke, on }
  return record
}

if (typeof window !== "undefined" && typeof document !== "undefined") installHostShim()
