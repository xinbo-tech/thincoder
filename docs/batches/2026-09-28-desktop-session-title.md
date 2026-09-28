# 2026-09-28 · 桌面 · 会话标题生成接线
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-28 · 来源 = 用户 2026-09-28 18:10 走查（桌面会话恒显「未命名会话」）；父侧四端实读 = 核生成器在位 · CLI/VSC 已接 · 桌面零调用；台账 #517。
> 台账 = #517（docs/desktop/requirements/PROJECT.md · 归批）。前情 = docs/batches/2026-09-28-desktop-midturn-input.md §6（已收口 2026-09-28）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 来源（用户 2026-09-28 18:10 走查）

用户原话：「为啥desktop的开的会话永远是untitled session？还缺什么没接线吗？」

### 1.2 实读定性（父侧 · 四端对照）

| 端 | 标题生成接线 | 证据 |
|---|---|---|
| 核（生成器） | 在位（自守卫 + 非致命） | `thincoder-core/generate-title.mjs`：`generateTitle` :26 · `ensureSessionTitle` :107-123（`agent.title` 在场 ⇒ 短路；前置 = provider `apiKey`/`baseURL`/`model`；失败静默 null） |
| CLI | ✅ 已接（回合尾 · 保存前） | `thincoder-cli/src/tui/agent-turn.mjs:311`（:323 注「Save session after every turn」） |
| VSC | ✅ 已接（回合阶段 · 端壳包装 · 随回合尾整档落盘） | `thincoder-vscode/src/extension/panel-turn-stages.mjs:130`（`panel._generateTitle`） |
| 桌面 | ❌ 零调用（全树仅 `src/main/notify.mjs:35` 读 `agent.title` 作通知标题） | ⇒ `agent.title` 恒空 ⇒ 槽落盘 `title:""`（核 `session.mjs:125`）⇒ `sessions:list` 行空 ⇒ 渲染面回落词 `rail.session.untitled`（`renderer/views/sessions.mjs:257`） |

### 1.3 本批条目（拟 · 设计轮定形）

- **B1 标题生成接线**：单回合执行面（`turn-face.mjs`）回合尾接 `ensureSessionTitle(agent)` —— 落点须在**槽落盘前**（两 save 点之前）；判据 = 首条真实 user 消息（核 `isRealUserMsg` 单源）；失败非致命；一次/会话（核自守卫 `agent.title`）。
- **B2 联动面**：通知标题（`notify.mjs:35` 现读恒空 —— 修复后档①通知将携会话标题；设计核验零改 ∕ 随动）· 列表 ∕ 标签条 ∕ 状态行标题显示（既有读面——零改，新标题即证）。

### 1.4 边界与串行

核件零改（生成器只接不改）；不新增机械门；不碰已冻结批档（`2026-09-28-desktop-midturn-input.md` §6 已冻结——本项原拟并入该批、其收口前未及 ⇒ 另起本批）；桌面文件面与在途批同片 ⇒ 串行（当前在册未启 = 回填轮 #511 ∕ 拆档批 #510）。

### 1.5 落点

台账 = **#517**（待设计 → 在途）；同族 = 桌面「缺失接线」族（承 `2026-09-28-desktop-midturn-input.md`——插入指令已收口）；需求档 D 点随落 = 父侧（设计定形后）。

### 1.6 正文收正轮 #18 交付收下（父侧 · 2026-09-29 00:2x）
- **交付**：实施前复核 8 条 + 追加三处全落（批档订正③–⑨ · `:119-142`）：测试承载（E1–E6 改**批次本地件** ∕ T-DSK46 不重建 E2E ∕ files.mjs = 3 空清单）· 坐标按符号重锚（KD-41 ∕ §4.1 ∕ §4.2 同拍）· E5 ∕ E6 补例 · 算术重算（129 ⇒ ≈139）· 措辞 ∕ 同形句 · 指针 · §7 号序注 + 变更记录（`:1028-1031`）。
- **doc-check**：悬空 **175 ⇒ 171（Δ −4）** ∕ 行宽 **OK**（`:1027` 303 字符行已折除；T-DSK41 两处引用经登记式消悬空）。
- **观察处置**：① ~41 条存量悬空（styles.css 系 ∕ sessions ∕ tabbar ∕ info-row 等）——桌面四档面归对位批 **#22**（在跑）清扫，余量入台账；② **D 号计数面**（设计档档头 ∕ §6.1 表头 D1–D25 vs 需求已 D1–D26）→ 转 **#22**（其射程含 `PROJECT.md`；若跨档 ⇒ 停并报）；③ 在途时序（turn-face ≈129 ⇒ 接线后 ≈139）已按符号吸收 ✓。
- **实施舱**：#19 排队（等 #8 让出 `turn-face.mjs`）——修正在其落笔前已入档 ✓。

### 1.7 实施舱 #19 交付收下 + 落位（父侧 · 2026-09-29 00:4x）
- **交付**（#19 · 终态 clean · fix 0）：`turn-face.mjs` 129 ⇒ **140**（`settleTurn` 单实现 `:55-60`——四步：查位 → `ensureSessionTitle` → 再查位 → `saveAgentSlot`；两 save 点 `:124` ∕ `:128` 原地一对一替换）；B2 四读面读数在册；内审 1 轮 clean + 代码评审 1 轮 pass（🟡1 消解于 §5；🔵3 记录）。
- **落位（裁定 ② 兑现）**：暂存件 `.thincoder/tmp/2026-09-28-desktop-session-title.test.mjs`（sha256 `e2670f2c…`）→ `docs/batches/2026-09-28-desktop-session-title.test.mjs`（copy 零改字节）；**终位复跑 6/6 · 0 fail · 0 skip**（父侧亲跑 · ≈747ms）。
- **父侧抽验**：`settleTurn` 四步 ∕ 两调用点 ∕ `:114-116` 续跑换代 ∕ `:126` 终局事件序——逐行实读吻合 ✓。
- **设计面订正（舱列 · 非阻断）**：§2.10 ④∕⑥ 坐标与数面滞后（129 ∕ `:113` ∕ `:117` ∕ ≈139 ⇒ 实 = **140 内容行** ∕ `:124` ∕ `:128`）——届盘 ∕ 设计面微轮收正。
- **台账**：#517 在途 → **待核销**（已核验）；写门暂存机制首用（台账 #545 在册）。

## §2 批次任务与设计（eng-designer）
**状态行**：✅ 设计完成 2026-09-28（KD-41 ∕ §4.2 ∕ §6.1 ∕ §7 T-DSK46 ∕ §10 BO+BP 已落 PROJECT.md；SESSION.md §6.7 三端收正；§2.9 并发写披露 + §2.10 正文收正轮（2026-09-29 · 实施前复核 8 条 · 以 §2.10 为准））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目（覆盖 ∕ 不覆盖）

- **B1 标题生成接线**（覆盖）：单回合执行面 `turn-face.mjs` 回合尾落**结算单实现** `settleTurn(key, agent)`——**标题先于落盘**；两 save 点（成功径 `:61` ∕ 失败径 `:65`）改调该面；中止墓碑查位 1 处 ⇒ 2 处（入位 ∕ 落盘前）——U-7「零写」语义原样；核件零改（只接不改）。
- **B2 联动面**（覆盖——**零码改**，逐项核验见 §2.7）：通知标题 · 列表刷新时序 · 左列行 ∕ 标签条 ∕ 状态行 `title` 段三读面。
- **不覆盖**：存量 `title:""` 槽的**列表侧回填**（裁读 = 仅自然补——§2.5）；核件生成器 / 提示词 / 超时与写契约零改；机械门零新增；已冻结批档 `2026-09-28-desktop-midturn-input.md` 零触碰。

### 2.2 机制设计（落点 · 调用点精确位置）

**（a）调用点** = `thincoder-desktop/src/main/turn-face.mjs`（现形 **77** 行·实读）——`executeTurn` 内两处结算行（成功径 `:61` ∕ catch 径 `:65`，现形同句 `if (!revokedTurn(key, agent)) saveAgentSlot(agent)`）替换为 `await settleTurn(key, agent)`；本档新增局部函数（单实现 · 两径同源；对位 = CLI 链尾统一 `agent-turn.mjs:311` ∕ VSC `panel-turn-stages.mjs:130` 标题前置于整档 save）：

```js
// 导入一行：import { ensureSessionTitle } from "@thincoder/core/generate-title.mjs"
async function settleTurn(key, agent) {
  if (revokedTurn(key, agent)) return   // ① 已故会话（dispose ∕ 切项目）⇒ 零标题 ∕ 零写（省一次网络）
  await ensureSessionTitle(agent)       // ② 核件自守卫（title 在场 ⇒ 短路零网）+ 非致命（自吞错——回合链零承担）
  if (revokedTurn(key, agent)) return   // ③ 标题等待窗（≤10s）内中止 ⇒ 零写（U-7 零复活不因新增 await 破口）
  saveAgentSlot(agent)                  // ④ 落盘（原判据位不变）
}
```

**结算序 = 标题 → 落盘 → 读数（`postUsage`）→ 终局事件**——读数 ∕ 终局两段序零动，「落盘先于终局事件」不变量保住（B2 时序面 = §2.7）。
**（b）失败径处置**：同一 `settleTurn`（用户中断 ∕ provider 错 ∕ 前端抛——三态同序；中止墓碑 catch 径同两查位 ⇒ 已故会话零标题零写）。
**（c）覆盖的回合类型**：单回合执行面被 `send` 径 ∕ 挂起驱动（消化轮 · timer 轮）/ 残输入续发共用 ⇒ 四类回合尾同点接；核件自守卫 + 无非真实 user 消息 ⇒ 零网 —— 四类同时接无重复成本。
**（d）await 语义（裁定）**：**await（阻塞 · 界 = 核件 10s `AbortSignal.timeout`）——与 CLI ∕ VSC 同形**，不后台化。由：① 写形**单写**纪律（链单源 = `docs/core/design/SESSION.md` §6.7「标题值随回合尾整档 save 落盘」——后台化 ⇒ 首回合落盘仍空（B1 判据不成立）或另开第二写面）；② 时点纪律（链单源 = 回合尾、整档 save **之前**）；③ 有界且一次/会话（自守卫短路；最坏 10s 只在「无标题 ∧ 有真实首条 user 消息 ∧ provider 前置齐」的首回合）；④ 等待期 = 在飞表未释 ⇒ 忙态受理（`send` ⇒ 按会话键入队 · KD-40）——**零丢失**，与 VSC「标题期 = busy 窗口」同义。**被否**：后台化（破先标题后落盘判据 + 竞态窗）；被否：沿用现判据位后补写（第二写面——违单写纪律）。**风险披露（沿 VSC 同句）**：首回合终局事件 ∕ 在飞释放最多延后 10s（通常 ≈1s）——CLI ∕ VSC 既有同形风险，非本批新引入。
**（e）首条消息可得性（核验注）**：**绑定态**（装载过的槽）⇒ `agent._recordStore.firstUserMessage()` 在场——桌面 `session-io.mjs:25` 恒传 `{ slot }` ⇒ 核 `session-lifecycle.mjs:151-157` 绑定 ⇒ `session-store.mjs:360-367` 置 `_recordStore`（首扫段 1、缓存 —— `session-store.mjs:253-261`，不随 200 窗口滑失）；**新建态**（首回合无槽文件）⇒ `loadAgentSlot` 返 false 不绑定 ⇒ 核件回退内存（`generate-title.mjs:114` `agent._fullHistory ?? agent.history`）——`pushReal` 已把首条 user 消息落 `_fullHistory` ∕ `history`（`context.mjs:93-103`；窗口 200 ≫ 首回合）⇒ **两态皆可得，端层零新增判据**。

### 2.3 受影响文件与测试面（现行 ⇒ 预期 · 内容行数口径）

| 文件 | 现行 ⇒ 预期 | 构成 |
|---|---|---|
| `thincoder-desktop/src/main/turn-face.mjs` | **77 ⇒ ≈95** | `settleTurn`（≈8 行）+ 核件导入 1 行 + 两调用点净 −2 行 + 档头注 ≈+3 行 |
| `thincoder-desktop/test/session-title.test.mjs`（拟新增） | — ⇒ **≈120** | 四例：链路 ∕ 时序 ∕ 短路 ∕ 失败（§2.4） |
| `thincoder-desktop/test/files.mjs` | **25 ⇒ 27** | 单元新档 + 集成新档各 1 行（两向自检在册） |
| `thincoder-desktop/test/integration/session-title-face.test.mjs`（拟新增） | — ⇒ **≈130** | **T-DSK46**（真 Electron——§2.4 真机面） |
| 设计档 | `docs/desktop/design/PROJECT.md`（KD-41 ∕ §4.2 ∕ §6.1 ∕ §7 ∕ §10 ∕ §4.1 两值收正 ∕ 变更记录）+ `docs/core/design/SESSION.md` §6.7（第三端登记） | 本批（已落——§2.8） |

测试面纪律：零真实网络 stub 先例 = 核 `test/provider-merge.test.mjs:129-160`（`globalThis.fetch` 换桩 + try/finally 复档）；桌面侧同法（假 provider 携 `apiKey` + `baseURL` 指向不可达端口 `http://127.0.0.1:1/v1`，fetch 换桩 ⇒ 零真实网络）；沙箱 `thincoder-desktop/test/slot-sandbox.mjs`（零用户目录）+ 假装配 + 假 `run`（经核 `pushReal` 动内存）+ 假 `emit`。

### 2.4 验收对照（回指 §1.3 B1 ∕ B2；机检 + 真机）

**机检**（新档 `thincoder-desktop/test/session-title.test.mjs`）：
- **E1 链路例**：首回合（provider 携 `apiKey`）⇒ `agent.title` 非空 ∧ 槽文件 `title` 非空（核 `session.mjs:125` 写面）∧ `listSessions(cwd).rows[0].title` 非空（`sessions:list` 读面 —— `sessions.mjs:39`）。
- **E2 时序例**（B2 列表刷新时序证法）：终局事件（`ev:activity done`）**发射当场**读槽 ⇒ `title` 已在（落盘先于终局事件 ⇒ 渲染面 `refreshTitles`（`events-subscribe.mjs:67-68`）读到即新值——沿 `session-io.test.mjs` U97「发射当场读盘」式样）。
- **E3 短路例**：槽 `title` 在场（装载即短路）⇒ 换桩计数 = **0**（零网络）∧ 标题不被改写。
- **E4 失败例**：provider 缺前置（无 `apiKey`）⇒ `generateTitle` 返 null ∧ 换桩计数 = **0** ∧ 回合正常结算（终局事件在册 ∧ 槽照常落盘 ∧ `title` 空）——非致命。
**真机**（D16 义务 · **T-DSK46**）：集成域新档 `thincoder-desktop/test/integration/session-title-face.test.mjs`——夹具槽 `title` 在场 ⇒ 开页后 ① 左列行标题 = 槽值（`rail.session.untitled` **零节点**——负断言）② 标签条活动标签 = 同值 ③ 状态行 `title` 段 = 同值 + PNG 落 `test/artifacts/`；**离线不可产面**（真 provider 回合 ⇒ 生成 ⇒ 落盘 ⇒ 三面随动 + 失焦通知携标题）= 人工走查 + 父侧真跑闭合。

### 2.5 关键决策（摘要）+ 存量回填裁读

**KD-41 = 桌面标题链 = 回合尾结算单实现（标题先于落盘）+ await 同形 + 存量仅自然补**（全文 = `docs/desktop/design/PROJECT.md` §2）。被否：两径各自内联调用（实现分叉面）；后台化；标题独立第二写。
**存量未命名会话面（父侧补充项）裁读 = 仅自然补**：该会话下一回合后补生成（核自守卫 ⇒ 一次性、失败下回合再试）+ 左列既有**手动改名面**（`session:rename` ⇒ 核 `renameSlot`；`renderer/views/sessions.mjs` 行控件两件在册）为零新机制的用户出路；**列表侧回填不做**——由：① 生成触发面单源 = 回合尾（链单源 §6.7）；列表 = 只读面，读面生写 = 新副作用面——每次 `sessions:list`（回合尾刷新 + 开面板）会向全部存量槽发网络调用，无准入 ∕ 无节流；② 群发回填需新机制（并发闸 ∕ 去重 ∕ 失败重试 ∕ provider 装配持有）——越本批边界；③ 用户出路已有（改名面）。登记 = `docs/desktop/design/PROJECT.md` §10 **BN**（消解路 = 若须做 ⇒ 另批立需求面）。

### 2.6 设计档落点清单（本批已落）

- `docs/desktop/design/PROJECT.md`：§2 **KD-41**（KD 表末）；§4.2 本批行「现行 ⇒ 预期」；§4.1 两值按盘收正（`turn-face.mjs` **52 ⇒ 77**、`test/files.mjs` **22 ⇒ 25**——实测落后；本批触档立即收正，余量归 #516）；§6.1 批注段（需求回指）；§7 **T-DSK46** 行 + 注；§10 **BN / BO** 两行；变更记录一行。
- `docs/core/design/SESSION.md` §6.7：「双端」⇒「**三端**」+ 桌面端壳行（file:line）+ 空窗差行补桌面（回退词形同 VSC）。
- 联动面零改 = `docs/desktop/design/IPC.md` ∕ `UI.md` ∕ `RENDERER.md` 零触碰（通知载荷形 ∕ 词键 / 读面 / 归约面皆不变）。

### 2.7 B2 联动面逐项核验（零码改 · 证据）

| 面 | 读源 ∕ 时点 | 结论 |
|---|---|---|
| 通知标题 | `notify.mjs:35` 活读 `agent.title`；触点 = `drive` 成功径 `.then`（`agent-host.mjs:207` → `suspension-drive.mjs:107` `turnDone`）——**晚于**本回合结算 | **随动零改**（标题非空 ⇒ 携；未生成 ∕ 不可得 ⇒ 零携判据原样） |
| 列表 | `sessions.mjs:39` 核 `listSlots` 投影 `entry.title` | 零改 |
| 左列行 ∕ 标签条 ∕ 状态行 `title` 段 | 同行源（`store.sessions`——`events-subscribe.mjs:49-59` 由 `sessions:list` 刷新；`views/sessions.mjs:257` ∕ `views/tabbar.mjs:92` ∕ `views/statusline.mjs:181`） | 零改（新标题即证）；未生成 ⇒ 回落词 `rail.session.untitled` 原样；行不在列表 ⇒ 段零节点（`statusline.mjs:180`）原样 |

**时序证法**：终局事件（`ev:activity done|stopped` ∕ `ev:error`）恒在落盘**之后**发射（三径同序——`turn-face.mjs:61-63` ∕ `:65-68`；本批插入点只改「标题先于落盘」，不触该序）⇒ 渲染面回合尾刷（`isTurnTail` ⇒ `refreshTitles`）必读见新槽值。

### 2.8 上抛项

1. **需求档 D 点**（拟 **D26**「会话标题链接线」——号面 ∕ 落笔归父侧）：设计已定形（§2.2–2.5）；需求档 §4 D 表补行 + §3.5 ∕ §6 随动；本设计 §6.1 以批注段回指（D 点号面变化 ⇒ 随之）。
2. **存量未命名会话面**：裁读 = 仅自然补（由见 §2.5）——需求侧若判须列表侧回填 ⇒ 另批（须立机制面：触发 ∕ 节流 ∕ 并发 ∕ 失败语义）。
3. **在途批触碰面提示**：`#516 文档回填+卫生轮`（待讨论）同触 §4.1 值面——本批只收正自触两档（turn-face ∕ files.mjs），余值归 #516；`#510 拆档批` 在册（`agent-host.test.mjs` 迁例 ∕ events.mjs 特挂）——本批新档另立、零冲突（turn-face.mjs 不在其拆档清单）。

### 2.9 落笔补充轮（并发写披露 · 两处订正）

- **订正 ①（§2.3 表内 §4.1 诉求）**：`turn-face.mjs` ∕ `test/files.mjs` 两值收正**已由并行「文档回填与卫生轮」（台账 #516）落定**（实读在册 = **77** ∕ **25**，`docs/desktop/design/PROJECT.md` §4.1）——本舱零重落（原列「本批触档立即收正」句作废，值以 §4.1 现表为准）。
- **订正 ②（§2.6 / §2.8 的 §10 行号）**：**BN 已被回填轮占用**（状态词计数注释面残留）⇒ 本批两行改 = **BO**（存量未命名会话面 · 仅自然补裁读）· **BP**（`T-DSK46` 用例号自铸披露）；§2.5 / §2.8 文内「§10 BN」处按此读。
- **并发写披露（发现项 · 沿「停该步并上抛」口径报告）**：批档 §1.4 前提「在途批 = 在册未启（#511 ∕ #510）」实测不成立——#516 文档回填轮 ∕ #510 拆档批为**活跃并行写者**（设计档 mtime 与 #516 变更记录行 = 本刻前后）；本舱落 PROJECT.md 时收 `[peer-collab]` 告警：另一活实例（cli pid=7900）对该档持写意向声明（4 分钟前认领 · 租约 29 分钟）。**本舱落地面与对端为加性互异区**（本舱 = KD-41 / §4.2 本批行 / §6.1 验收注 / §7 T-DSK46 / §10 BO+BP / 变更记录行 + 核档 `docs/core/design/SESSION.md` §6.7 三端收正 9 处——已读回验证）；**风险 = 对端覆写**（评审前请复核上述锚点在位）；后续桌面设计档批次建议与 #516 串行。已另发父侧 note。

### 2.10 正文收正轮（实施前复核发现 1–8 逐条 · 2026-09-29 · 按现盘实读对齐）
（前接 §2.9 订正 ① ∕ ②；批档 append-only ⇒ 本段订正 ③–⑨ 起，以下均以本段为准）

**订正 ③（发现 1 · 测试面承载收正）**：测试面全清重置（`docs/batches/2026-09-28-test-layer-prompts.md` §1.17）后本批验收承载按重建规则重述——**E1–E4 语义不变**，承载改**批次本地件** `docs/batches/2026-09-28-desktop-session-title.test.mjs`（拟新增 · 随批落；名随批次档 · 住批次目录 · 随批留存 · 不入仓套件——重置规则同档 §1.15 ∕ §1.21 ∕ §1.23）；原 §2.3 单元新档落点（`session-title.test.mjs`——测试树内）作废；§2.3 测试面纪律段所引先例 ∕ 助手（核 provider-merge 桩例 · 桌面 slot-sandbox ∕ session-io 用例 · U97）已随重置退役——换桩法自持（`globalThis.fetch` 换桩 + 假 provider 携 `apiKey` ∕ `baseURL` 指向不可达端口 `http://127.0.0.1:1/v1`；临时家沙箱自持）。**T-DSK46 裁定 = 本轮不重建 E2E 基建**：转父侧真机冒烟 + 人工走查闭合；集成用例（`thincoder-desktop/test/integration/session-title-face.test.mjs`）登记待基建重建。**§2.3 `files.mjs` 行收正 = 3 · 空清单（`export default []`）· 单元件不登记 · 集成件登记 = 落盘时 +1 行**；`thincoder-desktop/test/` 现盘 = `files.mjs` ∕ `rc-resolve.mjs` ∕ `run.mjs` 三档。

**订正 ④（发现 2 · 坐标重锚 + 落位按符号）**：下列坐标按 2026-09-29 现盘实读重锚（取位按符号，行号随并行批漂移）——
- `turn-face.mjs` = **129** 行（§2.1 ∕ §2.2(a) 记 77——其后两笔写入：评审时 ≈108、落笔时 129）；两 `saveAgentSlot` 结算行 `:113` ∕ `:117`（记 `:61` ∕ `:65`）；中止墓碑查位 = `revokedTurn`（定义现值 `:46`；记 `:33-36`）· 回合代次落位 = `turnGate?.stamp?.()`（现值 `:55`；记 `:42`）。
- 核 `generate-title.mjs` = **139** 行（`ensureSessionTitle :123-139` · 自守卫 `:124` · 10s `:105`；记 `:107-123` ∕ `:108` ∕ `:89`）；内存回退支 `:130`（记 `:114`）；`session-lifecycle.mjs:152-157`（记 `:151-157`）⇒ `session-store.mjs:364` ∕ `:254`（记 `:360-367` ∕ `:253-261`）；新建态 `context.mjs:94-100`（记 `:93-103`）。
- 核 `session.mjs` title 写面 `:128`（记 `:125`）；通知政策体上提核 = `thincoder-core/notify-policy.mjs:44-45`（端 `thincoder-desktop/src/main/notify.mjs` = **11** 行 re-export；记 `notify.mjs:35`）；渲染面现形 = `thincoder-desktop/renderer/views/session-control.mjs:56` ∕ `:67` ∕ `:138`（记 `views/sessions.mjs:257` ∕ `views/tabbar.mjs:92`——两档不在盘）· `thincoder-desktop/renderer/events-subscribe.mjs:51` ∕ `:70`（记 `:49-59` ∕ `:67-68`）· `thincoder-desktop/renderer/views/statusline.mjs:182`（记 `:181`）。

**订正 ⑤（发现 3 · E5 ∕ E6 补例——§2.4 机检例增至六例）**：
- **E5 窗内受理例**（KD-41 ② ∕ §2.2(d) ④「零丢失」正证）：标题窗期（首回合 `settleTurn` 在飞）二次 `send` ⇒ 回执 `{ ok: true, queued: true }`（KD-40 入队）∧ 结算后该条续发不丢（照常注入 ∧ 用户块入流）。
- **E6 窗内中止例**（新查位 ② 正证 · U-7 语义）：标题窗期 `dispose` ⇒ 槽零写（`title` 仍空 ∧ 文件内容零变）∧ 标题零落。
需求侧对应 = **D26**（`docs/desktop/requirements/PROJECT.md:171`「验收 = 机检 E1–E6 + 真机 T-DSK46」）——三链同源补齐（设计档 §6.1 批注同拍）。

**订正 ⑥（发现 4 · 构成算术）**：§2.3 `turn-face.mjs` 行重算 = **129 ⇒ ≈139**（Δ ≈ +10 = `settleTurn` ≈8 + 导入 1 − 2 + 档头注 ≈3——与构成项之和取齐；原表列「77 ⇒ ≈95」作废）。

**订正 ⑦（发现 5 ∕ 6 · 措辞与同形口径）**：§2.2(d) 两处收正——① 「一次/会话（…最坏 10s 只在…首回合）」⇒「**每个未成功生成标题的回合**均重试（核短路判据 = `agent.title` 在场——`generate-title.mjs:124`；成功一次即止）」（以需求 D26 句为准）；② 「与 CLI ∕ VSC 同形」⇒「**await 时点同形**；窗期受理面 = **VSC 同形 ∕ CLI 并发受理**（CLI 窗期 `state.controller = null` + `Ready`——`thincoder-cli/src/tui/agent-turn.mjs:300-311` ∕ `:316-319`；桌面 = 忙态入队 KD-40）」。

**订正 ⑧（发现 7 · §2.9 订正 ② 指针细则）**：订正 ② 所指残句实际位置 = **§2.5:89**（「§10 BN」句）· **§2.6:93**（§4.1 两值收正诉求句）· **§2.3:73**（同承 §4.1 诉求语）；订正 ② 标头「§2.6 ∕ §2.8 的 §10 行号」与正文「§2.5 ∕ §2.8 文内『§10 BN』处」两处口径均按本行读。订正 ① 所述「值以 §4.1 现表为准」继续有效——§4.1 本轮已按盘重锚（`turn-face.mjs` **129** ∕ `test/run.mjs` · `files.mjs` **49 ∕ 3** ∕ 通知档 **11**）。

**订正 ⑨（发现 8 · §7 号序）**：`T-DSK41` ∕ `T-DSK44` ∕ `T-DSK45` 无 §7 表行——登记 = §10 自铸行 **AX** ∕ **BJ** ∕ **BK**（择「明记」路线）；设计档 §7 已增号序注。

**设计档同步（本轮同拍 · `docs/desktop/design/PROJECT.md`，明细 = 该档变更记录 2026-09-29 行）**：KD-41 引证重锚 + ② 同形句 + ⑤ 措辞；§4.1 三行（`turn-face.mjs` **129** ∕ `test/run.mjs` · `files.mjs` **49 ∕ 3** ∕ `notify.mjs` **11**）；§4.2 本批行（**129 ⇒ ≈139**；`files.mjs` **3 ⇒ 3**；测试面 = 批次本地件 + T-DSK46 裁定）；§6.1 批注（D26 已落 + E5 ∕ E6 + 真机面转父侧真机冒烟）；§7 T-DSK46 行 + 号序注。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**设计评审 · 会话标题接线（#517）**——审对象 = 批档 §2（2.1–2.9）+ `docs/desktop/design/PROJECT.md`（KD-41 ∕ §2.2 ∕ §4.1 ∕ §4.2 ∕ §6.1 ∕ §7 T-DSK46 ∕ §10 BO+BP）+ `docs/core/design/SESSION.md` §6.7 三端收正。
**实读核验（本轮回读）**：核心前提全部在位——`thincoder-desktop` 全树零 `ensureSessionTitle` ∕ `generateTitle` 调用（仅 `src/main/notify.mjs:35` 读 `agent.title`）⇒ 槽恒 `title:""`（`thincoder-core/session.mjs:125`）；`turn-face.mjs` **77** 行 ∕ 两 save 点 `:61` ∕ `:65` ∕ 墓碑查位 `:33-36` ∕ 代次落位 `:42` 与设计坐标一致；`ensureSessionTitle`（`thincoder-core/generate-title.mjs:107-123`）自守卫 `:108` ∕ 10s（`:89`）∕ 非致命（`:98-100`）在位；两态首条消息可得（`session-io.mjs:25` ⇒ `session-lifecycle.mjs:151-157` ⇒ `session-store.mjs:360-367` ∕ `:253-261`；新建态 `context.mjs:93-103`）；四类回合尾同经 `executeTurn`（`agent-host.mjs:136-141` ∕ `:155-163`）；B2 触点晚于结算（`agent-host.mjs:207` ⇒ `suspension-drive.mjs:107`）；CLI ∕ VSC 同序（`agent-turn.mjs:311` ∕ `panel-turn-stages.mjs:130`）；行数预算 77 ∕ 25 与 §4.1 现值一致；落地锚点（KD-41 `:80` · §4.2 `:490-497` · §6.1 `:550-552` · §7 `:623` · §10 `:755-756` · SESSION.md §6.7 三端行）全部在位（§2.9 并发写披露项已复核）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Acceptance criteria | 🟡 | 新增 await 使两项承重行为落地，但机检例 E1–E4（批档 §2.4:80-83）均未覆盖：① 标题窗期（≤10s，`flights` 持有）忙态受理「零丢失」（KD-41 ② ∕ 批档 §2.2(d) ④ —— 该主张正是「阻塞式 await」的正当性来源）；② 窗内落中止墓碑 ⇒ 零标题零写（新查位 ②，U-7 语义） | 补两例（标题窗内二次 `send` ⇒ 回执 `{ok:true,queued:true}` ∧ 结算后续发不丢；窗内 `dispose` ⇒ 槽零写 ∧ 标题零落），或指名既有 U217–U226 中的等效面 |
| 2 | Requirements coverage（存量面出路） | 🟡 | KD-41 ⑤（`docs/desktop/design/PROJECT.md:80`）与 §10 BO（`:755`）把「既有手动改名面」列为存量未命名会话的用户出路，但桌面改名成功径**只写盘、不触内存**（`ipc.mjs:137` ⇒ `session-actions.mjs:51-56` 纯转口核 `renameSlot`），装配实例 `agent.title` 不随动（只在 `session-lifecycle.mjs:114` 装载时刷新；`agent-host.mjs:192-202` `ensure` 复用缓存实例 ⇒ `send` 径不重载）；下一回合尾 `saveSession` 为全量覆盖写（`session.mjs:122-125` ∕ `:169-170`）⇒ 用户标题可被静默回退为空串（接线后多为生成的标题，更不可察觉）。CLI 有对照实现（`thincoder-cli/src/tui/cmd-session.mjs:35` `agent.title = title`） | 把该边界补入 BO 行（或核对既有登记）；并核验「改名成功径同步内存标题」是否需列为落点（越本批 turn-face 面 ⇒ 归属另裁） |
| 3 | Requirements coverage（协调项 · 非缺陷） | 🟡 | 需求档面未落：拟 D26 行 ∕ 需求 §3.5 ∕ §6 随动（批档 §2.8:109 已上抛 ∕ PROJECT.md §6.1:550 以批注段回指），当前 §6.1 表头仍为 `D1–D25` | D 点落笔时按「D 号诸处同改」同笔同步档头 §4 计数 ∕ §6.1 表头 ∕ 兄弟档档头（IPC.md ∕ UI.md ∕ RENDERER.md ∕ SHELL.md） |
| 4 | Clarity（构成算术） | 🔵 | §2.3:69 构成项之和（`settleTurn` ≈8 + 导入 1 − 2 + 档头注 ≈3 ≈ **+10**）与表列「**77 ⇒ ≈95**」（Δ **+18**）不齐；§4.2:494 同承该值 | 两者取齐（补足未列举行，或按实测重估 Δ） |
| 5 | Clarity（语义范围） | 🔵 | §2.2(d):62「有界且**一次/会话**（…最坏 10s 只在…**首回合**）」与 §2.5:89「失败下回合再试」并存——核短路判据 = `agent.title` 在场（`generate-title.mjs:108`），生成失败后**每个无标题回合**都会重试 ⇒ 10s 界非「首回合」独有 | 措辞收正为「每个未成功生成标题的回合」（防实施侧误加「一次/会话」标记） |
| 6 | Clarity（同形口径） | 🔵 | §2.2(d):62「与 CLI ∕ VSC 同形」未含窗期受理面差：CLI 标题窗期 `state.controller = null` + `Ready`（`thincoder-cli/src/tui/agent-turn.mjs:300-311`，同档 `:316-319` 自注「a submit during this window starts the next runAgentTurn concurrently」）= 允许并发下一回合；桌面 = 忙态入队 | 同形句限定为「await 时点同形；窗期受理面 = VSC 同形 ∕ CLI 为并发受理」 |
| 7 | Doc hygiene（批档指针） | 🔵 | §2.9:116 订正 ② 标头写「§2.6 ∕ §2.8 的 §10 行号」，正文写「§2.5 ∕ §2.8 文内『§10 BN』处」——实际残句在 §2.5:89 与 §2.6:93；§2.3:73 亦承 §4.1 诉求句（订正 ① 已声明作废） | 订正句点明实际行号（批档 append-only ⇒ 以追加订正为准） |
| 8 | Doc-state（报告项） | 🔵 | §7 表内缺 `T-DSK41` ∕ `T-DSK44` ∕ `T-DSK45` 行（仅在 §10 自铸行 ∕ §6.1 注登记）⇒ 新插 `T-DSK46`（PROJECT.md:623）与前行号序不连续 | 收口轮并笔补登，或明记「无行（登记 = §10 自铸行）」以消号序歧义 |

**计数**：🔴 0 · 🟡 3 · 🔵 5 —— 无 Critical。

VERDICT: pass

### 轮次 2（评审子代理）

**设计评审 · 轮次 2（实施前复核 ∕ 令牌重签发）**——审对象 = 批档 §2（2.1–2.9）+ 设计档锚点（`docs/desktop/design/PROJECT.md` · `docs/core/design/SESSION.md` §6.7）；判据坐标一律以本刻盘面实读为准。

**实读核验（本轮回读）**：核心前提仍在位——桌面全树零 `ensureSessionTitle` ∕ `generateTitle` 调用（grep 实读）；核件自守卫 ∕ 10s ∕ 非致命在位（`thincoder-core/generate-title.mjs:124` ∕ `:105` ∕ `:114-116`）；CLI ∕ VSC 同链在位（`thincoder-cli/src/tui/agent-turn.mjs:311` ∕ `thincoder-vscode/src/extension/panel-turn-stages.mjs:130`）；两态首条消息可得（`thincoder-desktop/src/main/session-io.mjs:25` ⇒ `thincoder-core/session-lifecycle.mjs:152-157` ⇒ `session-store.mjs:254` ∕ `:364`；新建态 `context.mjs:94-100`）；设计档锚点全在位（`PROJECT.md:80` KD-41 · `:516-517` · `:574-576` · `:647` · `:779-780`；`SESSION.md:172-184`——§2.9 并发写披露项复核无覆写）；需求档 **D26 已落**（`docs/desktop/requirements/PROJECT.md:171`）。**前轮发现 #2（改名内存标题不同步）已由 #525 修复**（`thincoder-desktop/src/main/ipc.mjs:147-149` ⇒ `agent-host.mjs:333-335` `syncTitle`）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements coverage（验收承载） | 🟡 | 设计落笔后测试面整体退役（用户 2026-09-28 23:18「全清重置」令 + 随即重建规则——`docs/batches/2026-09-28-test-layer-prompts.md:100-104` ∕ `:112-118` ∕ `:142` ∕ `:151`），§2.3 ∕ §2.4 验收承载与盘面不再对应：① `thincoder-desktop/test/files.mjs` 现值 = 3 行空清单（`export default []`——`:3`；§2.3:71 记「25 ⇒ 27」、§2.9:115 记 25）；② 单元新档落点 `thincoder-desktop/test/session-title.test.mjs`（§2.3:70）与在行重建规则相抵——单元 = 批次本地件（名随批次档 · 住 `docs/batches/` · 随批留存 · 不进套件）；③ 所述先例 ∕ 助手已随重置删除（`test/slot-sandbox.mjs`、`session-io.test.mjs` U97、核 `test/provider-merge.test.mjs:129-160` 均不在盘——实读 `thincoder-desktop/test/` 仅 files.mjs ∕ rc-resolve.mjs ∕ run.mjs；`thincoder-core/test/` 仅 run.mjs ∕ slow.mjs）；④ 集成域 `thincoder-desktop/test/integration/` 为空目录、E2E 基建载体全删。⇒ E1–E4 与 T-DSK46 的法定承载面当前不存在；照原样实施会把新档落进已退役树（与在行令相抵） | 追加订正句按现行重建规则重述验收承载：E1–E4 语义不变、改落批次本地件（如 `docs/batches/2026-09-28-desktop-session-title.test.mjs`）；T-DSK46 按「三前端集成 · 50–100 ∕ 仓」重新裁定承载 ∕ 基建重建口径；§2.3 行按盘收正（`files.mjs` 现值 3 · 空清单；单元件不登记——集成件落盘时登记 +1 行） |
| 2 | Doc-state（坐标漂移） | 🟡 | 设计落笔后核心档被并行批改写，批档内外引证坐标大面积失效（按号取位会落空）：`turn-face.mjs` 现值 ≈108 行（read 至 `:108`；§2.2(a):47 记 77）；两 save 点现 `:91` ∕ `:95`（记 `:61` ∕ `:65`）；墓碑查位现 `:37-40`、代次落位 `:45`（记 `:33-36` ∕ `:42`）——续跑轮等插入所致；核 `generate-title.mjs` 现 139 行（`ensureSessionTitle :123-139` · 自守卫 `:124` · 10s `:105`；记 `:107-123` ∕ `:108` ∕ `:89`）；核 `session.mjs` title 写面现 `:128`（记 `:125`）；通知政策体已上提核（`src/main/notify.mjs` 现 11 行 re-export；读面现 `thincoder-core/notify-policy.mjs:44-45`；记 `notify.mjs:35`）；渲染面 `views/sessions.mjs` ∕ `views/tabbar.mjs` 已不在盘（现形 = `views/session-control.mjs:56` ∕ `:67` ∕ `:138`；`events-subscribe.mjs:51` ∕ `:70`；`statusline.mjs:182`）。设计档镜像同值（`PROJECT.md` §4.1:153 = 77 · `:226` = 43 ∕ 25；§4.2:516-517；KD-41:80 携两处旧引证） | 追加订正以现盘实读重锚全部坐标（含 `PROJECT.md` §4.1 ∕ §4.2 两行与 KD-41 内两处引证）；落位表述改按符号（「两 `saveAgentSlot` 结算行」）而非行号，吸收并行批行漂 |
| 3 | Requirements coverage（号码面） | 🟡 | 需求档 D26（`docs/desktop/requirements/PROJECT.md:171`）写「验收 = 机检 **E1–E6**」，设计现行仅定义 **E1–E4**（§2.4:80-83；`PROJECT.md` §6.1:575 同记「链路 ∕ 时序 ∕ 短路 ∕ 失败四例」）——E5 ∕ E6 全档无踪；前轮发现 #1 的两条补例（标题窗内忙态受理零丢失 ∕ 窗内中止零标题零写）未落设计面 | 二选一同笔收齐：补 E5 ∕ E6（判据 = 窗内二次 `send` ⇒ 回执 `{ok:true,queued:true}` ∧ 结算后续发不丢；窗内 `dispose` ⇒ 槽零写 ∧ 标题零落），或把 D26 号码面收作 E1–E4 |
| 4 | Clarity（构成算术） | 🔵 | §2.3:69 构成项之和（≈8 + 1 − 2 + ≈3 ≈ +10）与表列「77 ⇒ ≈95」（Δ +18）不齐；且现盘现值已变（≈108）⇒ 两值均失效 | 按盘收正现值并重算 Δ（预期仍 ≈ +8~10——insert 一组 + 导入 1 行） |
| 5 | Clarity（语义范围） | 🔵 | §2.2(d):62「一次/会话…最坏 10s 只在…首回合」与 §2.5:89「失败下回合再试」并存；核短路判据 = `agent.title` 在场（`generate-title.mjs:124`）⇒ 未成功生成的每个无标题回合都会重试；需求 D26:171 已作「未成功每回合重试」 | 措辞收正为「每个未成功生成标题的回合」（以需求句为准），防实施侧误加「一次/会话」标记 |
| 6 | Clarity（同形口径） | 🔵 | §2.2(d):62「与 CLI ∕ VSC 同形」未含窗期受理面差：CLI 窗期 `state.controller = null` + `Ready`（`thincoder-cli/src/tui/agent-turn.mjs:300-311`；`:316-319` 自注窗期提交 ⇒ 并发下一回合）；桌面 = 忙态入队（KD-40） | 同形句限定为「await 时点同形；窗期受理面 = VSC 同形 ∕ CLI 并发受理」 |
| 7 | Doc hygiene（批档指针） | 🔵 | §2.9:116 订正 ② 标头「§2.6 ∕ §2.8 的 §10 行号」与正文「§2.5 ∕ §2.8 文内『§10 BN』处」均与实际残句位置不齐——「§10 BN」残句在 §2.5:89；§4.1 诉求残句在 §2.6:93（订正 ① 已声明作废） | 追加订正句点明实际行号（append-only ⇒ 以追加订正为准） |
| 8 | Doc-state（报告项） | 🔵 | §7 表内无 `T-DSK41` ∕ `T-DSK44` ∕ `T-DSK45` 行（实读 `PROJECT.md` §7 = T-DSK40 `:643` · T-DSK42 `:644` · T-DSK43 `:645` · 本批 T-DSK46 `:647`）⇒ T-DSK46 与前行号序不连续；三号仅在 §10 自铸行登记 | 补登三行，或明记「无行（登记 = §10 自铸行）」以消号序歧义 |

**计数**：🔴 0 · 🟡 3 · 🔵 5 —— 无 Critical。

VERDICT: pass

## §4 用户批准（主 agent）

**批准**：用户 2026-09-29 00:04 回「批」——本批实施批准生效。依据 = §3 设计评审 VERDICT pass（在册 `:139`）+ §2 设计完成（KD-41 ∕ T-DSK46 在册）。实施 = eng-coder（`turn-face.mjs` 一处接线 + B2 联动面核验）；令牌因宿主进程崩溃需重签发（评审重跑在飞——父侧 00:04 点火）。

## §5 实施记录（eng-coder）

**状态行**：实施完成（B1 接线已落：`turn-face.mjs` 129 ⇒ 140 内容行 · E1–E6 六例 3 连跑 6/6 绿 · B2 四读面核验在册 · 批次本地件暂存待父侧落位（裁定 ①②）· 内部审计 1 轮 clean + 代码评审 1 轮 pass · fix round 0 · 终态 clean · 2026-09-29）

### 5.1 改动面（逐档表）

| 档 | 现状 ⇒ 预期 | 实读 | 构成 |
|---|---|---|---|
| `thincoder-desktop/src/main/turn-face.mjs` | 129 ⇒ ≈139 | **129 ⇒ 140**（内容行口径；`read` 工具报 141 = 含文末空行位） | 核件导入 1（`:28`）+ 档头注 2（`:8-9`）+ `settleTurn` 8（`:53-60`：JSDoc 2 行 + 体 6 行）；两 save 点**原地一对一替换**（净 0——设计表「两调用点净 −2」未发生）：`:124` 成功径 ∕ `:128` catch 径 |
| `.thincoder/tmp/2026-09-28-desktop-session-title.test.mjs`（批次本地件 · 暂存） | 新档 | 285 行 · 13739 字节 · sha256 `e2670f2cd6ccde846652ab5abaa5ef917abfae588a1f0094b62cd7cd7380fd7d` | 六例 E1–E6（换桩自持 · 沙箱 = `_setSessionsDirForTest`） |
| 其余（核件 ∕ `session-io` ∕ `session-lifecycle` ∕ `session-store` ∕ `ipc` ∕ `agent-host` ∕ B2 四读面 ∕ `thincoder-desktop/test/**`） | 零改 | 零改 | `git diff` 实读：本舱唯一产品码改动 = `turn-face.mjs` |

**`settleTurn` 实读**（`:55-60`，与 §2.2(a) 片断逐句同形）：① `revokedTurn` 入位查位 ⇒ ② `await ensureSessionTitle(agent)` ⇒ ③ `revokedTurn` 落盘前查位 ⇒ ④ `saveAgentSlot(agent)`；成功 ∕ catch 两径同源 ⇒ U-7 零写语义原样；结算序（标题 → 落盘 → 读数 → 终局事件）两径同序未动（`:124-126` ∕ `:128-131`）。单点接线核验：`createTurnFace` 仅 `turn-driver.mjs:66` 一实例 ⇒ 四类回合尾同点接。

### 5.2 六例读数（`node --test .thincoder/tmp/2026-09-28-desktop-session-title.test.mjs` · 仓根）

3 连跑 = **6/6 pass · 0 fail · exit 0**（duration ≈0.61–0.64s；无 flake）。逐例：**E1** 链路（`agent.title` 非空 ∧ 槽 `title` 非空 ∧ `listSessions` 行非空 ∧ 桩计数 1）· **E2** 时序（标题窗内 `sessions` 根零写 ∧ `ev:activity done` 发射当场槽已携标题）· **E3** 短路（装载态桩计数 0 ∧ 标题不改写）· **E4** 失败两形（前置缺 ⇒ 计数 0；网络抛 ⇒ 计数 1 ∧ 零标题零阻断；两形正常结算 ∧ 零 `ev:error`）· **E5** 窗内忙态（窗期 `busyOf` 真 ⇒ 二次 `send` 回执 `{ok:true,queued:true}` ∧ 续发不丢 ∧ 用户块入流 ∧ 二回合零二次生成）· **E6** 窗内中止（`dispose` 后槽文件字节零变 ∧ title 仍空）。

判别力（评审加验）：E2 窗内零写断言在「先落盘后标题」实现下必红；E6 在缺第③查位下必红；E3 ∕ E1 计数构成正负配对。

### 5.3 B2 四读面读数（零码改 · 逐面实读）

| 面 | 坐标 | 读数 |
|---|---|---|
| 通知标题 | 核 `notify-policy.mjs:44-45`（端 `src/main/notify.mjs` = 11 行 re-export） | 活读 `agent.title`，非空才携 `payload.title` ⇒ 接线后档①通知携会话标题；不可得 ⇒ 零携原样 |
| 列表刷新 | `renderer/events-subscribe.mjs:51`（`refreshTitles`）∕ `:70`（`isTurnTail` ⇒ 调） | 回合尾事件 ⇒ `sessions:list` 重读 ⇒ `store.set({sessions})`；E2 已证终局事件当场槽已携标题 |
| 会话标题 span | `renderer/views/session-control.mjs:56` ∕ `:67` ∕ `:138` | 行标题非空取之，空 ⇒ `rail.session.untitled`（`:56`）；`:67` 活动行投影；`:138` 选择器 span |
| 状态行 `title` 段 | `renderer/views/statusline.mjs:182`（段 13） | 行标题非空取之；无行 ⇒ `:181` 零节点；空 ⇒ 缺省词原样 |

列表读面另经核链复核：`session-slots.mjs:210` `title: meta.title ?? ""` ⇒ `sessions.mjs:23` `title: entry.title`（新标题即证）。

### 5.4 落位（门冲突 · 沿父侧裁定 ① ②）

- 指定终位 `docs/batches/2026-09-28-desktop-session-title.test.mjs` 的写入被系统写门拒（拒文「cross-batch batch-record write」；判据 = 子写者对批次基底内非绑定档 fail-closed）——不绕门，已上抛、裁定归父侧。
- 现形：终稿内容暂存 `.thincoder/tmp/2026-09-28-desktop-session-title.test.mjs`（与终位同为两层深 ⇒ 相对 import 逐字一致，copy 无须改字节；档头 `:3` 复跑命令已按终位书写）。
- 终位落位 = 父侧（depth 0 免门）；落位后按终位名复跑即可取同读数。

### 5.5 决策透明表

| # | 决策 | 由据 |
|---|---|---|
| 1 | E4 采两形同例（形 A = 前置缺〔设计主形〕；形 B = 网络抛〔派单 E4 表述〕）——并集非简化 | 设计 §2.4 E4 + 派单；两形皆「非致命」正证 |
| 2 | 测试件暂存 + 父侧落位（不绕门、不改指定名 ∕ 落点） | 用户裁定 ① ②；写门 fail-closed |
| 3 | 行数如实报 140（内容行）vs 设计预期 ≈139——不凑数、不改设计档 | 设计档 §2.10 订正 ⑥「≈」口径；文档笔归设计 ∕ 父侧 |

### 5.6 审计与评审轮次（终态 = clean）

- 内部审计（explore · 只读 · 1 轮）：四类偏差零发现（四步序 ∕ 六例语义 ∕ 越界 ∕ Δ 核对）——clean，零修正。
- 内部代码评审（advisor · 1 轮）：无 🔴；🟡 1（§5 段空——本笔即补）+ 🔵 3（坐标滞后 ∕ 暂存待落位 ∕ 内存 title 赋值记录项）；VERDICT pass。
- **fix round = 0**（无代码修正：🟡 由本 §5 落笔消解；🔵 全为记录项 ∕ 父侧笔）。

### 5.7 记录项（评审 🔵 #4 建议句）

窗内中止（`dispose` ∕ 切项目）= **槽零写**；内存 `agent.title` 可已赋值（生成先于第③查位；代次墓碑下不可落盘——回合起跑重 `stamp`，陈旧实例纵复用亦不落错值）。

### 5.8 义务句

not repo-suite verified — the parent-side closeout run is the only repo-suite run.

## §6 验证与收口（父代理）
