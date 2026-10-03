/**
 * turn-input.mjs — 宿主**回合输入面**出档（structure-split-2 批 · 自 `thincoder-desktop/src/main/turn-driver.mjs`
 * 提取 —— 该档越 300 顾问线）：**msg 双通道族**（`msg:send` ∥ `msg:interrupt`）两函数逐字迁出（语义零改）；
 * 宿主经注入面装配、**返回面同名转口** `{ send, interrupt }` ⇒ `createTurnDriver` 调用面零改
 * （`agent-host.mjs` ∥ `ipc.mjs` 零改）。登记面 = `docs/desktop/design/PROJECT.md` §4.1 越层段 ∥ §4.2 本批行；
 * 切点 = 批档 `docs/batches/2026-09-29-structure-split-2.md` §2.2-E。
 * 依赖面（皆注入 —— 宿主在飞 ∥ 队 ∥ 链 ∥ 窗 ∥ 关联面**引用共享**）：`post` ∥ `ensure` ∥ `flights`（Map）∥
 * `queued` ∥ `chain` ∥ `suspension` ∥ `drive`（回合驱动尾）∥ `projects` ∥ `denyGates` ∥ `capPending`
 * （cap 登记表 = #656 登记面 —— 与宿主 `askContinue` ∥ `dispose` 共享）；本档自 import = 附件三件
 * （装配 ∕ 降级 ∕ 清理）∥ 槽键（`slotOfKey`）。**零环**：宿主 → 本档单向。
 */
import { cleanupTurn, degradeTurnAttachments, prepareTurnAttachments } from "./attachments.mjs"
import { providerStateOf, slotOfKey } from "./session-slots.mjs"

/** provider 无效**真因分类**（闭集 `defaultModel` ∥ `provider` —— `provider-invalid` 回执 `providerKind` 键单源；
 *  批档 §2 补录 ∥ 修正轮发现 6）：**结构判定**（零字符串嗅探 ∥ 零解析副本）——取装配产物**已算值**：
 *   ① `config.provider?.name` 非空 ⇒ `provider`（`defaultModel` 解析已通过 ⇒ 无效因在**条目结构**
 *      〔缺 `baseURL` 等〕——修点在渠道面）；
 *   ② `defaultModel` 非空而解析未过（未知渠 ∕ 模型段空 ∕ 形态非法）⇒ `defaultModel`；
 *   ③ `defaultModel` 缺 ∥ 空 ⇒ **有持 key 渠道** ? `defaultModel` : `provider`（#841 判据换源：
 *      「渠表非空」⇒「有持 key 渠道」——全无 key 态出真·无 key 词；持 key 判据 = `apiKey` trim 非空，
 *      与核 `hasKey` 同判（`thincoder-core/model-ref.mjs:78-81`）、env 变量不是密钥源）；
 *   ④ `config` 不可用（测试桩 ∥ 缺）⇒ `provider`（保守——落回现词）。
 *  纯函数、零副作用（`renderer/composer-sync.mjs` 词路由按类出词）。 */
export function providerKindOf(agent) {
  const config = agent?.config
  if (config === null || typeof config !== "object" || Array.isArray(config)) return "provider"
  const name = config.provider?.name
  if (typeof name === "string" && name !== "") return "provider"
  const defaultModel = config.defaultModel
  if (typeof defaultModel === "string" && defaultModel.trim() !== "") return "defaultModel"
  const table = Array.isArray(config.providers) ? config.providers
    : Array.isArray(config.providersList) ? config.providersList : []
  return table.some((p) => typeof p?.apiKey === "string" && p.apiKey.trim() !== "") ? "defaultModel" : "provider"
}

/** 回合输入面工厂（msg 双通道族 —— 见档头）：返回 `{ send, interrupt }`（逐字迁出自 `turn-driver.mjs`）。 */
export function createTurnInput({ post, ensure, flights, queued, chain, suspension, drive, projects, denyGates, capPending }) {
  /** `msg:send`：坏键 ⇒ bad-key · **窗内 ⇒ 入挂起队列**（回执 `{ ok: true, queued: true }` 与忙态受理同形；含附件 ⇒
   *  **同受理**——载具层携图，窗条目携 `images`、送达判决随 `delivered.degraded`；`busy` = 窗径竞态防御档）·
   *  **在飞 ⇒ 按会话键入队**（`{ok:true, queued:true}`；满 ⇒ `queue-full` 零入队 —— KD-40 ②）·
   *  provider 无效 ⇒ provider-invalid（**另携真因分类 `providerKind`** —— 闭集 `defaultModel` ∥ `provider`，
   *  `providerKindOf` 结构判定；`reason` 裸码零改）· **装配 `await` 期跨中止 ∕ 装配窗中止（窗内 Stop）⇒ `aborted`**（#515② ∕ #597 零起跑）；
   *  否则建在飞（**受理即置忙位** —— `ev:activity{turn}` 无帧值先发，#597）、起跑、**立即回 `{ok:true}`**；失败径回执携 `started:false`。
   *  **#841**：成功回执另携 `providerState`（发送时点刷新 —— `docs/desktop/design/IPC.md` §2「provider 态投影注」）。
   *  结算三映射（done / stopped / error）收尾清在飞 —— 三径各出一次回合尾 `ev:usage`（读数同点、终局事件之前）。
   *  三路结算**先落盘再出终局事件**（§1.14 ② —— 渲染侧收尾重读即可见本回合增量；CLI 先例 = 回合
   *  finally 尾部保存 ⇒ 中断 / 错误同样留现场）。
   *  附件面（`IPC.md` §2「附件注」）：`images` = dataURL 串列（元素形 = 严格串——A1）；判决与落盘全在
   *  `prepareTurnAttachments`、非视觉降级在 `degradeTurnAttachments`（W2 —— 皆出口零抛 ⇒ 回合驱动零承担），
   *  弃项 ∕ 降级码经回执 `degraded` 浮出（零静默）；落盘件随三径结算在 `executeTurn` finally 清理
   *  （**先释放锁**再清理 —— 清理由本档自吞错，锁必释放）；**降级窗后复查在飞占位**（占位已摘 ⇒
   *  `aborted` 零起跑，落盘件随闸自清 —— 裁定 (i) · #515② 同不变量）。 */
  async function send(key, text, images) {
    const slot = slotOfKey(key)
    if (slot === null) return { ok: false, reason: "bad-key" }
    if (suspension.active(key)) { // 挂起窗口头（KD-34）：窗内输入 ⇒ 驱动器队列 + 唤醒（用户输入优先序沿核件）
      const routed = suspension.pushInput(key, String(text ?? ""), images) // 三态：受理 ∕ "full"（#625 容量拒）∕ false（未入窗）
      if (routed === "full") return { ok: false, reason: "queue-full" } // 同忙态径码（渲染面失败径承接）
      return routed ? { ok: true, queued: true } : { ok: false, reason: "busy" }
    }
    if (flights.has(key)) { // 忙态受理（KD-40 ②）：按会话键入队（不中断 · 下一步生效）；满 ⇒ queue-full（零入队）
      const entry = { text: String(text ?? ""), ts: Date.now() }
      if (Array.isArray(images) && images.length > 0) entry.images = images
      if (queued.add(key, entry).ok !== true) return { ok: false, reason: "queue-full" }
      chain.postQueue(key)
      return { ok: true, queued: true }
    }
    // 占位先于装配 await：首跑仍在懒装配时的同键再发亦落队（在飞表占位同判）——单驱动器不许双 `runAgent`。
    const controller = new AbortController()
    flights.set(key, controller)
    // 受理即置（#597 · 案 C）：提交即切忙态 —— 位标单源新产点（`{event:"turn"}` 无帧值：归约面零改，回合槽由真实首帧补）；
    // 回收 = 回执面（失败径 `started:false` ⇒ 渲染面 `clearRunning`）。
    post("ev:activity", { key, event: "turn" })
    const release = () => {
      if (flights.get(key) === controller) flights.delete(key)
    }
    let agent = null
    try {
      agent = await ensure(key, slot)
    } catch (err) {
      release() // 装配抛先摘本键在飞（否则本键永锁 `busy`）——非吞回执：原文案随 `reason` 浮出（渲染面据 `started:false` 清位）
      return { ok: false, reason: String(err?.message ?? err), started: false }
    }
    // 跨中止闸（#515②）：装配 `await` 期被 `dispose` ∕ 切项目级联（占位已清）⇒ 本 send 不起跑——
    // 防「跨中止的回合」凭空起跑 + 结算落盘（墓碑拦不住的窗口：本回合非陈旧尾）；新 reason 码 `aborted`。
    if (flights.get(key) !== controller) return { ok: false, reason: "aborted", started: false }
    if (agent._providerInvalid) {
      release()
      return { ok: false, reason: "provider-invalid", providerKind: providerKindOf(agent), started: false }
    }
    // 附件装配（项 1–4）：文本 / 路径 / 弃项 / 降级码四件——`cwd` = 项目根、`model` = 本回合实跑模型、
    // `locale` = 装配实例配置（`createAgent` 存本 —— 零二次 `loadConfig`），非视觉说明词面随之就地定局。
    let attached = prepareTurnAttachments(text, images, {
      cwd: projects?.currentCwd(), model: agent.provider?.model, locale: agent.config?.locale,
    })
    // 非视觉降级窗（W2 · §2.2 径①）：占位仍在（`release` 前 —— 降级窗内 `flights` 占位在）⇒ 窗内 `interrupt`
    // 命中本占位 ⇒ 降级信号 abort（读图 fail-fast）；成功 = 描述注文 ∕ 失败 = 说明行（`degraded` 随回执浮出）。
    attached = await degradeTurnAttachments(attached, {
      model: agent.provider?.model, cwd: projects?.currentCwd(), parentAgent: agent, locale: agent.config?.locale,
      signal: controller.signal,
    })
    // 窗后查位（裁定 (i) · #515② 同不变量）：降级窗内 `dispose` ∕ 切项目级联 ⇒ 占位已摘 ⇒ 零起跑
    //（防「跨中止的回合」凭空起跑 + 结算落盘）；本径落盘件随本闸自清（回合尾清理面不达）。
    if (flights.get(key) !== controller) {
      cleanupTurn(attached?.paths ?? [])
      return { ok: false, reason: "aborted", started: false }
    }
    // 装配窗受理中止（#597 · 2.3(4)）：窗内 Stop（含 Ctrl+C）⇒ 占位已 abort 而仍在飞表 —— 取消才是本职语义
    //（消息尚未入史：零起跑 ∕ 零历史入账 ∕ 稿 ↑ 可召回）；落盘件随本闸自清（回合尾清理面不达）。
    if (controller.signal.aborted) {
      release()
      cleanupTurn(attached?.paths ?? [])
      return { ok: false, reason: "aborted", started: false }
    }
    release() // 占位交接给 `executeTurn`（同刻重占 —— 零 microtask 空窗）
    drive(key, agent, attached.text, attached) // 回合驱动尾（续发径同源）
    // #841（「provider 态投影注」）：成功回执携 `providerState` —— 发送时点刷新（渲染面落切片 ⇒
    // 提示带明示行重派生）；失败径零叠加（沿 #840 `providerKind` 面）。
    const providerState = providerStateOf(agent.config)
    return attached.degraded ? { ok: true, degraded: attached.degraded, providerState } : { ok: true, providerState }
  }

  /** `msg:interrupt`：无在飞 ⇒ `idle`；在飞 ⇒ abort（**携核 abort 面**：`message` 非空串 ⇒ `{ interrupt: true, message }`
   *  —— Ctrl+I 同上下文续跑，核 `agent.mjs:295-304,417-424` 读 `signal.reason`；缺 ∕ 空 ⇒ 裸 abort = 停回合不续跑）
   *  + 本键待决门按拒结算（**含撞帽续跑询问门**：待答中中止 ⇒ 询问按取消结算 ⇒ 收口）。
   *  **#656（KD-52 ②）**：cap 询问待答 ∧ 携文 ⇒ **入口预检**（`queued.add` 权威判）——满 ⇒ 整调用回
   *  `{ ok: false, reason: "queue-full" }` 且**零中止**（不 abort ∕ 不 `denyGates`——询问在场 ∕ 回合照旧 ∕
   *  零丢失；文本由端侧回注输入框）；成功 ⇒ 该条即本代入队（入队单点前移——`onCapCancelled` 退为结算通知）。 */
  function interrupt(key, message) {
    if (slotOfKey(key) === null) return { ok: false, reason: "bad-key" }
    const controller = flights.get(key)
    if (!controller) return { ok: false, reason: "idle" }
    const text = typeof message === "string" && message !== "" ? message : null
    if (text !== null && capPending.has(key)) { // cap 待答径预检（#656 · KD-52 ②④）：先执入队权威判——满 ⇒ 零中止零入队
      const entry = { text, ts: Date.now() }
      if (queued.add(key, entry).ok !== true) return { ok: false, reason: "queue-full" }
    }
    if (text === null) controller.abort()
    else controller.abort({ interrupt: true, message: text })
    denyGates(key)
    return { ok: true }
  }

  return { send, interrupt }
}
