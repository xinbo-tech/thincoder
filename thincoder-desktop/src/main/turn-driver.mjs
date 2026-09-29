/**
 * turn-driver.mjs — 宿主**回合驱动族**出档（R3 · 桌面功能对位批：`agent-host.mjs` 届盘 **401** 行越 300 顾问线，
 * 按在册拆点候选「回合驱动族出档 `turn-driver.mjs`」落形 —— `docs/desktop/design/PROJECT.md` §10 **BL** 行；
 * 消解窗口 = 本批（该档下次被触碰的批））。原档同族段逐字搬运 —— 调用面零改（宿主返回面同名）。
 *
 * 六件（§10 BL 点名）+ 该族私有装配面：
 *   ① 在飞表 `flights`（key → AbortController —— 单驱动器不变量：禁双 `runAgent` 竞态）
 *   ② 中止墓碑 `turnEpochs` ∕ `turnGate`（U-6 ∕ U-7 回合代次：起跑落位 ∕ 落盘前查位两查位**同源**）
 *   ③ 单回合执行面 `executeTurn`（`turn-face.mjs` 工厂实例 —— 本档供五件注入 + 步边界取批缝 + 撞帽询问缝）
 *   ④ 回合尾接管 `takeOver`（墓碑查位 ⇒ 队列先于接管 ⇒ 挂起窗；**W2：转 async** —— 续发径降级 await 窗，调用面 fire-and-forget）
 *   ⑤ 输入路由三径 + 会话中止：`send` ∕ `interrupt` ∕ `dispose` ∕ `abortSuspensions`
 *   ⑥ 只读面两枚：`queueSnapshot`（`history:page` 回执 `queue` 键供面）· `busyOf`（在飞判据 ——
 *      `setPrefs` 忙态门消费）
 *   ⑦ **并源队列视图 `queueView`（挂起窗径批 ∥ 窗队列批 · KD-40 ⑥）**：`snapshot` = 忙态队 ∪ 窗输入队合并快照
 *      （链 `postQueue` 全帧 ∥ `queueSnapshot` 同源单点）；取批两件（`plan` ∕ `take`）恒指忙态队单源——两载体不合并
 * **R3（#505）**：单回合执行面增**撞帽续跑询问缝**（`askQuestion` 注入 ⇒ `askContinue` —— 薄形复用既有待决门，
 * KD-T8；文案随 VSC `panel-turn-loop.mjs:144-147` 原文）。
 * 私有装配：排队面（`queued-input.mjs` 单例）· 续发链（`turn-chain.mjs`）· 挂起驱动（`suspension-drive.mjs`）·
 * 提示面（`notify.mjs`）—— 四枚在本档装配；六件为其唯一消费者。
 *
 * 依赖面（皆注入 —— 零宿主依赖 ⇒ 平 node 直测）：`post(channel, payload)` = 出站面 ·
 * `run` = 回合运行器（装配面给 —— 默认 = 核 `runAgent`，住 `agent-host.mjs`）· `bridge(key)` = 回调桥 ·
 * `postUsage(key, agent)` = 回合尾读数（`agent-host.mjs` 单源）· `askQuestion(key, question, options)` =
 * 待决门提问（撞帽询问载体 —— 缺省 ⇒ 询问按拒绝：收口不静默续）· `projects` = 项目面（`currentCwd()`
 * 供附件 / 窗口取值）· `ensure(key, slot)` = 装配取值（懒装配 ∕ 同键复用）· `forgetKey(key)` = 装配表清
 * （agents ∕ 在途 ∕ 令牌表 —— `dispose` 消费）· `forgetAll()` = 装配表全清（切项目级联 —— #515① ∕ #507
 * 装配表清点；缺省 ⇒ 零动作）· `dropScope(key)` = 桥 scope 回收 ·
 * `denyGates(key)` = 本键待决门按拒结算 · 提示面三件（`notify` ∕ `focused` ∕ `reveal` —— 皆可缺省：缺 ⇒ 零动作）。
 */
import { cleanupTurn, degradeTurnAttachments, prepareTurnAttachments } from "./attachments.mjs"
import { loadAgentSlot } from "./session-io.mjs"
import { slotOfKey } from "./session-slots.mjs"
import { createNotifier } from "./notify.mjs"
import { createQueuedInput, textOf } from "./queued-input.mjs"
import { createSuspensionDrive } from "./suspension-drive.mjs"
import { createTurnChain } from "./turn-chain.mjs"
import { createTurnFace } from "./turn-face.mjs"

/** 回合驱动族工厂（族内六件 + 私有装配 —— 见档头依赖面清单）。 */
export function createTurnDriver({
  post, run, bridge, postUsage, askQuestion = null, projects = null,
  ensure, forgetKey, forgetAll = null, dropScope, denyGates, notify = null, focused = null, reveal = null,
}) {
  /** 在飞回合：key → AbortController（单驱动器 ⇒ 禁双 run 竞态）。 */
  const flights = new Map()
  /** 中止墓碑（U-6 ∕ U-7 · 回合代次）：key → 代次计数 —— `dispose` ∕ 切项目两径 +1 ⇒ **该刻前代次**的回合尾
   *  三查位同失效（`takeOver` 零重注册 ∕ 步边界缝零取批 ∕ `turn-face.mjs` 回合尾落盘零写）。回合起跑在代理上落当前代次
   *  （`turn-face.mjs` 单点），查位 = 代次比对 ⇒ 会话重开后的新回合自动合法（**零清除面** —— 无「清墓碑」竞态窗）。*/
  const turnEpochs = new Map()
  /** 本键当前代次（未中止过 ⇒ 0）。 */
  const epochOf = (key) => turnEpochs.get(key) ?? 0
  /** 落墓碑：本键代次 +1 —— 该刻已在飞 ∕ 已结算未接管的回合尾即时失效。 */
  const revokeTurns = (key) => turnEpochs.set(key, epochOf(key) + 1)
  /** 回合代次面注入包（`turn-face.mjs` 起跑落位 ∕ 落盘前查位**同源** —— 判据单点，零第二份）。 */
  const turnGate = {
    stamp: (key, agent) => { if (agent != null) agent._turnEpoch = epochOf(key) },
    revoked: (key, agent) => { const stamped = agent?._turnEpoch; return typeof stamped === "number" && stamped !== epochOf(key) },
  }
  /** 排队面（「回合中插入」批 · KD-40 ①）：宿主**按会话键**内存表 —— 队列单源（渲染面 = 快照镜面）。 */
  const queued = createQueuedInput()
  /** 并源队列视图（KD-40 ⑥ · 挂起窗径批 ∥ 窗队列批）：`snapshot` = 两源合并（忙态队 ∪ 窗输入队——按键互斥 ⇒
   *  单镜无歧义；图不入快照）+ **A9 出站投影**（元素 ⇒ **串数组** —— VSC `busyQueued.items` 同形；`ts` 留内部载体）；
   *  取批两件（`plan` ∕ `take`）恒指忙态队单源（两载体不合并——窗队经核件输入面另缝）。
   *  **窗读面懒取**（`suspension` 构造序在后——取用恒在装配后）；链 `postQueue` 全帧与 `queueSnapshot`
   *  （`history:page` `queue` 键）同源单点。 */
  let suspension = null // 挂起驱动实例（装配在后——`queueView` 经本行懒取窗半）
  const queueView = {
    snapshot: (key) => [...queued.snapshot(key), ...(suspension === null ? [] : suspension.inputSnapshot(key))].map((entry) => textOf(entry)),
    plan: (key) => queued.plan(key),
    take: (key, count) => queued.take(key, count),
  }
  /** 送达面单点（附件装配 ∕ 非视觉降级）：忙态队（链）∥ 窗输入队（驱动）两径**同源**注入（零第二判据）。 */
  const prepare = (text, images, agent) => prepareTurnAttachments(text, images, {
    cwd: projects?.currentCwd(), model: agent?.provider?.model, locale: agent?.config?.locale,
  })
  /** 降级面单点（W2 · 非视觉读图 —— 参数面与 `send` 径同源）：链 ∥ 窗队两径同源注入。 */
  const degrade = (attached, agent, signal) => degradeTurnAttachments(attached, {
    model: agent?.provider?.model, cwd: projects?.currentCwd(), parentAgent: agent, locale: agent?.config?.locale, signal,
  })
  /** 撞帽续跑询问（R3 · #505 · KD-T8 薄形 —— 载体 = 既有待决门）：文案随 VSC `panel-turn-loop.mjs:144-147`
   *  原文（词面内容权 = 主 agent —— 沿 R1 先例登记）；缺注入 ⇒ `null`（turn-face 按拒绝收口）。 */
  const askContinue = typeof askQuestion === "function"
    ? (key, turn) => askQuestion(key, `Agent reached ${turn} turns (limit). Continue from here?`, ["Continue", "Stop"]).then((answer) => answer === "Continue")
    : null
  /** 单回合执行面（`send` ∕ 驱动同源 —— 出档 `turn-face.mjs`；本档供 `post` ∕ `run` ∕ 桥 ∕ 读数 ∕ 在飞表五件
   *  + 步边界取批缝 `queuedPickup`〔用户回合传 ∕ 消化轮不传 —— 分流判据住 turn-face〕
   *  + 回合代次面 `turnGate`〔中止墓碑三查位同源 —— U-6 ∕ U-7〕+ 撞帽询问缝 `askContinue`〔R3 · #505〕）。 */
  const { executeTurn } = createTurnFace({
    post, run, bridge, postUsage, flights,
    // 步边界缝（U-6 第三臂）：中止墓碑同判据查位 —— 陈旧回合零取批（零旧代理消费新会话队 ∕ 迟到投递同族）
    queuedPickup: (key) => (agent) => (turnGate.revoked(key, agent) ? false : chain.stepBoundaryPickup(key, agent)),
    turnGate, // 起跑落代次（stamp）∕ 回合尾落盘前查位（revoked）—— 判据住本档
    askContinue, // 撞帽询问（缺省 ⇒ 拒绝收口 —— 零静默自续）
  })
  /** 回合尾续发链 + 排队面出站（出档 `turn-chain.mjs` —— 队列先于接管 · 续发起跑前查在飞表；KD-40 ②③④）。 */
  const chain = createTurnChain({
    queue: queueView, post, // 并源视图（快照两源合并；取批两件指忙态队——KD-40 ⑥）
    prepare, // 送达面单点（与窗队同源注入）
    degrade, // 降级面单点（与窗队同源注入）
    hold, // W2 降级窗占位（函数声明提升 ⇒ 此处引用先于定义安全）
    drive: (key, agent, text, attached) => drive(key, agent, text, attached),
    busyOf: (key) => flights.has(key),
  })
  /** 提示面（KD-35：失焦门 + 两档合句 + 点击聚焦 —— 策略面 ∕ 平台面分家，见 `notify.mjs`）。 */
  const notifier = createNotifier({ notify, focused, reveal })
  /** 挂起驱动（KD-34：消费核件 —— 会话寄存器 + 端侧钩子（计数 ∕ 回收 ∕ 冻结）+ 边界两发（窗内单回合包装 `autoTurn` 支）
   *  + 输入 ∕ 关闭路由 + 提示面两档；`runTurn` = 本档单回合执行面 —— `send` ∕ 驱动同源）。 */
  suspension = createSuspensionDrive({
    post, runTurn: executeTurn, notify: notifier,
    postQueue: chain.postQueue, // 窗队四帧出站（= 链 `postQueue`——帧构造单点保位 `turn-chain.mjs`）
    prepare, // 送达面单点（窗内携图径——与链同源）
    degrade, // 降级面单点（窗内非视觉读图——与链同源）
    hold, // W2 降级窗占位（窗径两调用点——起窗 ∕ 查位 ∕ `release` 沿链径现式；函数声明提升 ⇒ 此处引用先于定义安全）
    busyOf: (key) => flights.has(key), // 在飞判据（空闲火面用——在飞回合不夺杆；timer-wake 阶段 2 §6.30.11）
    takeOver, // timer 轮后同判（池活 ⇒ 入窗消化——装配点① 回合尾面；函数声明提升 ⇒ 此处引用先于定义安全）
    reloadSlot: (key, agent, cwd) => { // §2.2 会话钉定：每轮起跑前按本窗键重装槽（含 `_slot` 重钉）
      const slot = slotOfKey(key)
      return slot === null || typeof cwd !== "string" || cwd === "" ? false : loadAgentSlot(agent, cwd, slot)
    },
  })

  /** 回合驱动尾（`send` ∥ 续发两径**同源**）：成功径 ⇒ 档①通知 + 接管；失败径 ⇒ 接管（后台项不因回合失败而失管）。 */
  function drive(key, agent, text, attached) {
    void executeTurn(key, agent, text, { attached }).then(
      () => { suspension.turnDone(key, agent); takeOver(key, agent) }, // 成功径 ⇒ 提示面档①（`!autoTurn` —— send 径恒非 auto）
      () => takeOver(key, agent),
    )
  }

  /** 降级窗占位（W2 · §2.2 径② ∕ 窗径两调用点 · `continueTurn` ∕ `createSuspensionDrive` 注入缝）：把占位落进在飞表 ——
   *  降级 `await` 窗内并发 `send` 同键 ⇒ 落队（单驱动器不变量：不起第二回合）；窗内 `interrupt` 命中占位 ⇒ 占位 abort ⇒
   *  降级信号 abort（读图 fail-fast）。返回 `{ signal, active, release }`（`active()` = **占位仍在判据** —— 链 ∥ 窗两径窗后
   *  查位，裁定 (i)）；`release` 幂等且仅当占位仍属本刻时摘表（同 `send` 现式，代次交接零 microtask 空窗）。 */
  function hold(key) {
    const controller = new AbortController()
    flights.set(key, controller)
    return {
      signal: controller.signal,
      active: () => flights.get(key) === controller, // 占位被摘（`dispose` ∕ 切项目级联 ∕ 他人重占）⇒ false
      release: () => { if (flights.get(key) === controller) flights.delete(key) },
    }
  }

  /** 回合尾接管（KD-34 入口）：**中止墓碑查位**（U-6 —— 本刻前代次的回合尾 = 会话已中止 ∕ 项目已切 ⇒ 零
   *  重注册：零续发 ∕ 零窗 ∕ 零闩重武装 ∕ 零新队消费；含新会话已在跑之竞态——陈旧代理不再夺杆）⇒ **队列先于接管**
   *  （KD-40 ③ —— 队非空 ⇒ 先续发；续发起跑前查在飞表）⇒ 队空 ⇒ `poolLive(agent)` 判真 ⇒ 进挂起窗
   *  （核件消费；`cwd` = 窗入口 cwd——窗项持入口键 + 入口 cwd，§2.2）。成功 ∕ 失败两径同接管（后台项不因回合失败而失管）。
   *  **W2：async**（`continueTurn` 转 async —— 续发径降级 await 窗）；调用面 fire-and-forget（返回值无人消费）。 */
  async function takeOver(key, agent) {
    if (turnGate.revoked(key, agent)) return // 中止墓碑（U-6）：会话中止径已落代次 ⇒ 陈旧回合尾零接管
    if (await chain.continueTurn(key, agent)) return // 队列先于接管（续发轮尾自带同接管链 —— 递归至队空）
    if (turnGate.revoked(key, agent)) return // 窗后复查位（裁定 (i) · 降级窗内 dispose ∕ 切项目级联 ⇒ 零挂起窗接管）
    suspension.start(key, agent, { cwd: projects?.currentCwd() ?? null })
  }

  /** `msg:send`：坏键 ⇒ bad-key · **窗内 ⇒ 入挂起队列**（回执 `{ ok: true, queued: true }` 与忙态受理同形；含附件 ⇒
   *  **同受理**——载具层携图，窗条目携 `images`、送达判决随 `delivered.degraded`；`busy` = 窗径竞态防御档）·
   *  **在飞 ⇒ 按会话键入队**（`{ok:true, queued:true}`；满 ⇒ `queue-full` 零入队 —— KD-40 ②）·
   *  provider 无效 ⇒ provider-invalid · **装配 `await` 期跨中止 ∕ 装配窗中止（窗内 Stop）⇒ `aborted`**（#515② ∕ #597 零起跑）；
   *  否则建在飞（**受理即置忙位** —— `ev:activity{turn}` 无帧值先发，#597）、起跑、**立即回 `{ok:true}`**；失败径回执携 `started:false`。
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
      return suspension.pushInput(key, String(text ?? ""), images) ? { ok: true, queued: true } : { ok: false, reason: "busy" }
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
      return { ok: false, reason: "provider-invalid", started: false }
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
    return attached.degraded ? { ok: true, degraded: attached.degraded } : { ok: true }
  }

  /** `msg:interrupt`：无在飞 ⇒ `idle`；在飞 ⇒ abort（**携核 abort 面**：`message` 非空串 ⇒ `{ interrupt: true, message }`
   *  —— Ctrl+I 同上下文续跑，核 `agent.mjs:295-304,417-424` 读 `signal.reason`；缺 ∕ 空 ⇒ 裸 abort = 停回合不续跑）
   *  + 本键待决门按拒结算（**含撞帽续跑询问门**：待答中中止 ⇒ 询问按取消结算 ⇒ 收口）。 */
  function interrupt(key, message) {
    if (slotOfKey(key) === null) return { ok: false, reason: "bad-key" }
    const controller = flights.get(key)
    if (!controller) return { ok: false, reason: "idle" }
    const text = typeof message === "string" && message !== "" ? message : null
    if (text === null) controller.abort()
    else controller.abort({ interrupt: true, message: text })
    denyGates(key)
    return { ok: true }
  }

  /** 装配实例清除（会话关闭面 —— 防泄漏）：**中止墓碑（先落 —— 本刻前代次回合的接管 ∕ 落盘两查位即失效）
   *  ∧ 在飞回合中止 + 在飞表清（会话中止 ⇒ 中止在飞——防四条件态：幽灵在飞把后续提交变「忙态队」，陈旧回合
   *  结算再迟到投递 ∕ 重接管（零复活窗 —— U-6）∕ 复活落盘（U-7）；清表后同键再发 = 起新回合）
   *  ∥ 挂起窗级联中止（§2.2 —— 清池不注入 + 出窗帧；先于摘表 —— 窗仍持 agent 引用）**
   *  ∥ 装配表 / 在途装配 / 本键待决门（按拒结算 —— 不留悬 Promise）/ 本键令牌表 / 本键桥面 relay scope。
   *  **R3b**：同时 = 存活投影**清点**面（该键不再入拍）。 */
  function dispose(key) {
    revokeTurns(key) // 中止墓碑（U-6 ∕ U-7）：无条件落 —— 「在飞 ∕ 已结算未接管」两态回合尾同失效
    const flight = flights.get(key)
    if (flight) { flight.abort(); flights.delete(key) } // 在飞回合中止 + 清（`abort` 幂等 —— 窗内回合随会话信号已中止者同判）
    suspension.abort(key)
    if (queued.clear(key)) chain.postQueue(key) // 会话中止 ⇒ 队清 + 零续发（KD-40 边界；空快照出站 —— 镜面随清）
    forgetKey(key) // 装配表清：agents ∕ 在途装配 / 令牌表（装配面持有 —— 清点语义见入参）
    dropScope(key) // 桥面 relay scope 回收（防同键重开继承陈旧 pending / queued 缓存）
    denyGates(key)
  }

  /** 切项目级联（§2.2：`project:open` 成功且 cwd 变更 ⇒ 旧项目**全键**窗中止 —— 会话键面 = `String(slot)` 项目内命名空间，
   *  跨项目同槽号撞键 + 取值挂 `currentCwd()` 双错位）；**在飞回合同径中止 + 清 + 落中止墓碑**（旧项目代理不再
   *  接管重启后的提交 —— 陈旧回合尾零重接管 ∕ 零落盘，U-6 ∕ U-7）；**级联清装配**（旧项目装配全清 ——
   *  同槽号键不得命中旧项目 agent ∧ 陈旧尾「代次就地覆写」面随对象更换消除；#515① ∕ #507）；
   *  忙态队清（零续发）；**旧 cwd 认领释放**（G-2 —— `ipc.mjs` 成功径同点调用核 `releaseClaimsAll`：
   *  切出后本进程在旧 cwd 的槽认领零残余）；返回中止窗数（`ipc.mjs` 成功径调用）。 */
  function abortSuspensions() {
    for (const [key, controller] of flights) { // 切项目 ⇒ 旧项目在飞全键中止 + 落墓碑（代次 —— 取值面双错位防护同源）
      revokeTurns(key)
      controller.abort()
    }
    flights.clear() // 在飞表清（防陈旧回合迟到投递 —— 同 `dispose` 收口）
    for (const key of queued.clearAll()) chain.postQueue(key) // 切项目 ⇒ 忙态队清（§2.2 级联 —— 零续发）
    forgetAll?.() // 级联清装配（#515① ∕ #507）：agents ∕ 在途装配 / 令牌表全清（缺省 ⇒ 零动作）
    return suspension.abortAll()
  }

  return {
    send, interrupt, dispose, abortSuspensions, takeOver,
    busyOf: (key) => flights.has(key), // 在飞只读面（`setPrefs` 忙态门 —— `flights.has` 单点）
    queueSnapshot: (key) => queueView.snapshot(key), // `history:page` 回执 `queue` 键供面（两源合并快照 —— `ipc.mjs`）
  }
}
