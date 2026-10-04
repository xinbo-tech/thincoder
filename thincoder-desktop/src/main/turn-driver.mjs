/**
 * turn-driver.mjs — 宿主**回合驱动族**出档（R3 · 桌面功能对位批：`agent-host.mjs` 届盘 **401** 行越 300 顾问线，
 * 按在册拆点候选「回合驱动族出档 `turn-driver.mjs`」落形 —— `docs/desktop/design/PROJECT.md` §10 **BL** 行；
 * 消解窗口 = 本批（该档下次被触碰的批））。原档同族段逐字搬运 —— 调用面零改（宿主返回面同名）。
 *
 * 六件（§10 BL 点名）+ 该族私有装配面：
 *   ① 在飞表 `flights`（key → AbortController —— 单驱动器不变量：禁双 `runAgent` 竞态）
 *   ② 中止墓碑 `turnEpochs` ∕ `turnGate`（U-6 ∕ U-7 回合代次：起跑落位 ∕ 落盘前查位两查位**同源**）
 *   ③ 单回合执行面 `executeTurn`（`turn-face.mjs` 工厂实例 —— 本档供五件注入 + 步边界取批缝 + 撞帽询问缝 + 用户文本注入缝）
 *   ④ 回合尾接管 `takeOver`（墓碑查位 ⇒ 队列先于接管 ⇒ 挂起窗；**W2：转 async** —— 续发径降级 await 窗，调用面 fire-and-forget）
 *   ⑤ 输入路由三径 + 会话中止：`send` ∕ `interrupt`（出档 `turn-input.mjs`）∕ `dispose` ∕ `abortSuspensions`
 *   ⑥ 只读面两枚：`queueSnapshot`（`history:page` 回执 `queue` 键供面）· `busyOf`（在飞判据 ——
 *      `setPrefs` 施加顺延消费）
 *   ⑦ **并源队列视图 `queueView`（挂起窗径批 ∥ 窗队列批 · KD-40 ⑥）**：`snapshot` = 忙态队 ∪ 窗输入队合并快照
 *      （链 `postQueue` 全帧 ∥ `queueSnapshot` 同源单点）；取批三件（`plan` ∕ `peek` ∕ `take`）恒指忙态队单源——两载体不合并
 * **R3（#505）**：单回合执行面增**撞帽续跑询问缝**（`askQuestion` 注入 ⇒ `askContinue` —— 薄形复用既有待决门，
 * KD-T8；文案随 VSC `panel-turn-loop.mjs:144-147` 原文）。
 * **#543（裁定 A · 用户输入零丢失）**：撞帽询问**待答期携消息**中断 ⇒ 消息入宿主忙态队（`queued-input` 原语）；
 * 消费 = 下一回合边界（接管续发链同点）。**#656（KD-52）**：入队单点前移 = `interrupt` 入口（cap 待答 ∧ 携文
 * ⇒ 先执 `queued.add` 权威判；满 ⇒ 整调用回执 `queue-full` **零中止**——询问在场 ∕ 回合照旧 ∕ 零丢失）；
 * `onCapCancelled` 退为核结算通知（零二次入队）。
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
import { degradeTurnAttachments, prepareTurnAttachments } from "./attachments.mjs"
import { injectAtRefs } from "./file-refs.mjs"
import { loadAgentSlot } from "./session-io.mjs"
import { slotOfKey } from "./session-slots.mjs"
import { createNotifier } from "./notify.mjs"
import { createQueuedInput, textOf } from "./queued-input.mjs"
import { createSuspensionDrive } from "./suspension-drive.mjs"
import { createTurnChain } from "./turn-chain.mjs"
import { createTurnFace } from "./turn-face.mjs"
import { createTurnInput } from "./turn-input.mjs"

/** 回合驱动族工厂（族内六件 + 私有装配 —— 见档头依赖面清单）。 */
export function createTurnDriver({
  post, run, bridge, postUsage, askQuestion = null, projects = null,
  ensure, forgetKey, forgetAll = null, dropScope, denyGates, notify = null, focused = null, reveal = null,
}) {
  /** 在飞回合：key → AbortController（单驱动器 ⇒ 禁双 run 竞态）。 */
  const flights = new Map()
  /** 中止墓碑（U-6 ∕ U-7 · 回合代次）：key → 代次计数 —— `dispose` ∕ 切项目两径 +1 ⇒ **该刻前代次**的回合尾
   *  四查位同失效（`takeOver` 零重注册 ∕ 步边界缝零取批 ∕ `turn-face.mjs` 回合尾落盘零写 ∕ 边界轮 `end`/`cap` 帧 ∥ 记录零写）。回合起跑在代理上落当前代次
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
   *  取批三件（`plan` ∕ `peek` ∕ `take`）恒指忙态队单源（两载体不合并——窗队经核件输入面另缝）。
   *  **窗读面懒取**（`suspension` 构造序在后——取用恒在装配后）；链 `postQueue` 全帧与 `queueSnapshot`
   *  （`history:page` `queue` 键）同源单点。 */
  let suspension = null // 挂起驱动实例（装配在后——`queueView` 经本行懒取窗半）
  const queueView = {
    snapshot: (key) => [...queued.snapshot(key), ...(suspension === null ? [] : suspension.inputSnapshot(key))].map((entry) => textOf(entry)),
    plan: (key) => queued.plan(key),
    peek: (key) => queued.peek(key),
    take: (key) => queued.take(key),
  }
  /** 送达面单点（附件装配 ∕ 非视觉降级）：忙态队（链）∥ 窗输入队（驱动）两径**同源**注入（零第二判据）。 */
  const prepare = (text, images, agent) => prepareTurnAttachments(text, images, {
    cwd: projects?.currentCwd(), model: agent?.provider?.model, locale: agent?.config?.locale,
  })
  /** 降级面单点（W2 · 非视觉读图 —— 参数面与 `send` 径同源）：链 ∥ 窗队两径同源注入。 */
  const degrade = (attached, agent, signal) => degradeTurnAttachments(attached, {
    model: agent?.provider?.model, cwd: projects?.currentCwd(), parentAgent: agent, locale: agent?.config?.locale, signal,
  })
  /** 用户文本注入缝（#632 · @ 文件引用对齐 —— `turn-face.mjs` 起跑前单点消费）：解析基 = 项目根
   *  `projects.currentCwd()`；无根（非串 ∥ 空）⇒ **原样返回**（无根零解析，同 `file-links` 无根判据义）。 */
  const injectUserText = (text) => {
    const cwd = projects?.currentCwd()
    return typeof cwd === "string" && cwd !== "" ? injectAtRefs(text, cwd) : text
  }
  /** 撞帽待答登记（#656 · KD-52 ②）：key → 登记令牌 —— `interrupt` 入口预检判据（cap 待答 ∧ 携文）；
   *  询问结算（作答 ∥ 打断拒结算）即清（`.finally`；守卫 = 本次令牌 —— 防迟到清位误抹后次待答）。 */
  const capPending = new Map()
  /** 撞帽续跑询问（R3 · #505 · KD-T8 薄形 —— 载体 = 既有待决门）：文案随 VSC `panel-turn-loop.mjs:144-147`
   *  原文（词面内容权 = 主 agent —— 沿 R1 先例登记）；缺注入 ⇒ `null`（turn-face 按拒绝收口）。
   *  #656：待答态按会话键登记（`capPending` —— `interrupt` 入口预检判据，落点 = 本包装）。 */
  const askContinue = typeof askQuestion === "function"
    ? (key, turn) => {
      const token = {}
      capPending.set(key, token)
      return askQuestion(key, `Agent reached ${turn} turns (limit). Continue from here?`, ["Continue", "Stop"])
        .then((answer) => answer === "Continue")
        .finally(() => { if (capPending.get(key) === token) capPending.delete(key) })
    }
    : null
  /** 撞帽拒径携文**结算通知**（#543 裁定 A ∕ #656 · KD-52 ④）：入队单点已前移至 `interrupt` 入口（cap 待答 ∧
   *  携文 ⇒ 预检成功即入队）⇒ 本缝**零二次入队** —— 只作队列帧出镜（镜面整置 · 幂等）；预入队条目消费
   *  = 下一回合边界（结算即交付 —— 接管续发链同点）。`chain` 于装配后取用（调用恒在驱动装配完成后 ⇒
   *  惰性引用安全）。 */
  const onCapCancelled = (key) => {
    chain.postQueue(key)
  }
  /** 单回合执行面（`send` ∕ 驱动同源 —— 出档 `turn-face.mjs`；本档供 `post` ∕ `run` ∕ 桥 ∕ 读数 ∕ 在飞表五件
   *  + 步边界取批缝 `queuedPickup`〔用户回合传 ∕ 消化轮不传 —— 分流判据住 turn-face〕
   *  + 回合代次面 `turnGate`〔中止墓碑四查位同源 —— U-6 ∕ U-7〕+ 撞帽询问缝 `askContinue`〔R3 · #505〕）。 */
  const { executeTurn } = createTurnFace({
    post, run, bridge, postUsage, flights,
    // 步边界缝（U-6 第三臂）：中止墓碑同判据查位 —— 陈旧回合零取批（零旧代理消费新会话队 ∕ 迟到投递同族）；
    // 组合 = **窗优先**（挂起窗在飞期窗内提交于步边界可达——#623）⇒ 链（忙态队）同判
    queuedPickup: (key) => (agent) => (turnGate.revoked(key, agent) ? false : suspension.stepBoundaryPickup(key, agent) || chain.stepBoundaryPickup(key, agent)),
    turnGate, // 起跑落代次（stamp）∕ 回合尾落盘前查位（revoked）—— 判据住本档
    askContinue, // 撞帽询问（缺省 ⇒ 拒绝收口 —— 零静默自续）
    onCapCancelled, // #543 ∕ #656：撞帽拒径携文结算通知（入队单点已前移至 interrupt 入口 —— 零二次入队；缺省 ⇒ 零动作）
    injectUserText, // 注入缝（#632 —— 用户回合起跑前单点；系统轮不扫，判据住 turn-face）
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
  /** 挂起驱动（KD-34：消费核件 —— 会话寄存器 + 端侧钩子（计数 ∕ 回收 ∕ 冻结）+ 边界起跑发（窗内单回合包装 `autoTurn` 支 —— 收尾 `end` 在 `turn-face.mjs` 结算序，修复轮 3）
   *  + 输入 ∕ 关闭路由 + 提示面两档；`runTurn` = 本档单回合执行面 —— `send` ∕ 驱动同源）。 */
  suspension = createSuspensionDrive({
    post, runTurn: executeTurn, notify: notifier,
    postQueue: chain.postQueue, // 窗队五帧出站（= 链 `postQueue`——帧构造单点保位 `turn-chain.mjs`）
    prepare, // 送达面单点（窗内携图径——与链同源）
    degrade, // 降级面单点（窗内非视觉读图——与链同源）
    hold, // W2 降级窗占位（窗径两调用点——起窗 ∕ 查位 ∕ `release` 守卫序列 `suspension-guard.mjs`；函数声明提升 ⇒ 此处引用先于定义安全）
    busyOf: (key) => flights.has(key), // 在飞判据（空闲火面用——在飞回合不夺杆；timer-wake 阶段 2 §6.30.11）
    takeOver, // timer 轮后同判（池活 ⇒ 入窗消化——装配点① 回合尾面；函数声明提升 ⇒ 此处引用先于定义安全）
    reloadSlot: (key, agent, cwd) => { // §2.2 会话钉定：每轮起跑前按本窗键重装槽（含 `_slot` 重钉）
      const slot = slotOfKey(key)
      return slot === null || typeof cwd !== "string" || cwd === "" ? false : loadAgentSlot(agent, cwd, slot)
    },
  })

  /** 回合输入面（msg 双通道族出档 `turn-input.mjs` —— 见档头 ⑤；返回面同名转口 ⇒ 调用面零改）：`interrupt` 预检
   *  所需 cap 登记表与宿主 `askContinue` ∥ `dispose` 共享引用（#656）。 */
  const { send, interrupt } = createTurnInput({
    post, ensure, flights, queued, chain, suspension, drive, projects, denyGates, capPending,
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
    capPending.delete(key) // #656：cap 态登记表随会话中止清点（防陈旧登记驻留；询问结算面 `.finally` 幂等 —— 零二次清）
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
    capPending.clear() // #656：cap 态登记表随级联清点（同 `dispose` —— 旧项目询问登记零残余）
    forgetAll?.() // 级联清装配（#515① ∕ #507）：agents ∕ 在途装配 / 令牌表全清（缺省 ⇒ 零动作）
    return suspension.abortAll()
  }

  return {
    send, interrupt, dispose, abortSuspensions, takeOver,
    busyOf: (key) => flights.has(key), // 在飞只读面（`setPrefs` 施加顺延 —— `flights.has` 单点）
    queueSnapshot: (key) => queueView.snapshot(key), // `history:page` 回执 `queue` 键供面（两源合并快照 —— `ipc.mjs`）
  }
}
