# 2026-09-29 · missing-face-family（缺面族批补：桌面 @ 文件引用面——file-refs 上提核件 + 注入 ∕ 剥离）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-29 · 来源 = 端差全表（#15 ④-B7）+ 父侧裁（附 B：归「缺面族批补」——UI.md:383 为准）+ enddiff-clearance 设计 §2（#632 转批 · 零动作交接）。
> 台账 = #632（端差缺面族 · 归批）。前情 = 无（独立批——自 enddiff-clearance 转批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-29
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 本批（父侧 · 2026-09-29 17:2x）

- **来源** = 端差全表（#15 ④-B7：桌面 `fileRef|at-ref|stripAtRefs` 全树零命中 ∥ VSC `thincoder-vscode/src/extension/file-refs.mjs:2/:58` + 消费 `panel-chat.mjs:30`）+ 父侧裁定（附 B：**归「缺面族批补」**——`UI.md:383` 为准；closeout §2.9 宿主例外定性不采——非宿主约束、属缺面）。
- **条目（1 行）**：**#632** @ 文件引用缺面——补批要点（enddiff-clearance §2 在册）：file-refs 上提核件 + 桌面接注入 ∕ 剥离（两端单一权威源）。
- **口径**：方向 = 对齐 VSC 形（@ 引用注入 ∕ 剥离全链）；设计 = eng-designer（§2）；实施 = eng-coder（评审 + 代签 §4 + token 后）；真机腿 = 父侧探针。

### 1.2 授权口径

- 授权 = 13:52 全权 + 17:02「尽可能消除」令；批件全链自动（设计 → 代点火评审 → 修正 → 代签 → 实施 → 收口）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（#632 全链修法表（注入 ∕ 剥离 ∕ 消费）+ 拆批 A ∕ B ∕ C + 上抛 U-A–U-F · 修订轮 1（评审 #55 逐号 1–7 处置）；本轮零产品码（2026-09-29））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.0 本批覆盖与口径

- **覆盖** = 台账 #632（端差缺面族 · 桌面 @ 文件引用面）全链三面：**注入 ∥ 剥离 ∥ 消费**；方向 = 端差默认消灭（用户可见端差 = 缺陷）⇒ 对齐 VSC 形。
- **单源** = `enddiff-clearance` §2.1 #632 行（批外分流①「补批要点在册」）+ 父侧两裁（`enddiff-clearance.md:13`：归缺面族批补；closeout §2.9:121 宿主例外定性不采——非宿主约束、属缺面）。
- **本轮零产品码改动**（本 §2 为唯一交付面）；机制设计见 2.3；逐处修法见 2.2；受影响文件表 + 拆批见 2.4。
- 坐标口径：as-of 2026-09-29 17:2x 届盘实读；实施轮按「届盘重读」重锚。
- 需求侧承载：`docs/vsc/requirements/WEBVIEW.md:40` F-W15（机制条目）+ `docs/vsc/design/WEBVIEW.md` §4.4（契约面：恢复面 ≡ 活面、标题源不携文件正文）；桌面侧无独立需求条目（登记承载 = `UI.md:383` 端差登记——见 2.5）。

### 2.1 裁定「上提 ∕ 双端各持」= **上提核件单源**（给由 + 被否）

**裁定**：`file-refs` 上提核件 `thincoder-core/file-refs.mjs`（`injectAtRefs` ∕ `stripAtRefs` 同档单源），**两端各持薄壳**（`node:fs` 探针端侧注入）；VSC 形（行为面）零改。

**由（四条）**：

1. **非结构性不对称**：现档实读零宿主依赖（`thincoder-vscode/src/extension/file-refs.mjs:5-6` import 仅 `node:fs` ∕ `node:path`；vscode API 零引用）⇒ 不属 ④ 端特有桶（沿 #183 `history-window` 收正判据「纯函数、零宿主依赖 ⇒ 非结构性不对称」——`CORE-UNIFICATION.md:336-337`）；closeout §2.9:121 的「受 VSC 编辑器能力约束」定性父侧已不采（无宿主约束证据）。
2. **成对契约不可劈**：注入语法与其逆变换互锁（strip 的 fail-closed 判据逐字依赖 inject 的输出格式——现档头自注「语法与其逆变换同住一处，零第二实现」`file-refs.mjs:50-51`）⇒ 双端各持 = 把互锁对劈成两份，任一侧微调即恢复面灾难（回吐文件正文 ∕ 剥离失败）。
3. **先例同构且一步收口**：`file-links`（R2 上提 + parity-b4 VSC 改指 = 「双写窗口收口」——`thincoder-core/file-links.mjs:5-6` 在册）为本形直接先例；parity 程序判「半落（VSC 未迁）= 债」⇒ 本批一步收口，不开双写窗口。
4. **迁移机械面极小**：VSC 侧 = 单档薄壳化（三调用面零改）；桌面侧 = 新壳 + 两缝——皆 ≤ 既有先例尺度。

**被否候选**：

- **双端各持**（桌面复制一份）：违单源纪律；成对契约劈开（由 2）；漂移无同步面（VSC 侧后续改动零随动）——反证 = `file-links`「多实现面各自落地」判为债收口。
- **两步形**（核件 + 桌面落，VSC 自持留后批）：双写窗口期两副本并行（在册债形态）；VSC 转口极小 ⇒ 零收益。
- **宿主例外**（VSC-only 能力面）：父侧已裁不采；本轮不重开。

**「VSC 侧零改」口径**（任务书禁止项读法）= **形（行为面）零改**：VSC 注入 ∕ 剥离 ∕ 消费三面行为逐字冻结（对齐基准）；上提的唯一机械动点 = VSC 档体薄壳化（`file-refs.mjs` 81 行 ⇒ ≈25 行），三调用面（`panel-chat.mjs:30/:187` · `panel-session.mjs:19/:185` · `panel-session-write.mjs:24/:139`）零改。备选读法（严格字面 = VSC 档体零触）⇒ 两步形——见 U-B。

### 2.2 逐处表（处 → 现行 → 应然 → 判据（机检优先） → 真机腿）

| 处 | 现行（届盘实读 file:line） | 应然 | 判据（机检） | 真机腿 |
|---|---|---|---|---|
| ① 核件新档 `thincoder-core/file-refs.mjs` | 无（自持位 = `thincoder-vscode/src/extension/file-refs.mjs:9` `injectAtRefs` ∕ `:58` `stripAtRefs`） | 核单源：`injectAtRefs(text, cwd, probe)`（fs 三件 `readFileSync` ∕ `existsSync` ∕ `statSync` 转探针注入缝——缺 ∕ 形违 ⇒ 抛，沿 `thincoder-core/file-links.mjs:29-31` fail-loud 先例）+ `stripAtRefs(text)` 纯函数；regex ∕ 4000 截断 ∕ `[File: …]` 围栏 ∕ 摘要块格式**逐字不动**（`WEBVIEW.md:154`「落线文本逐字不变」契约） | 批内件：注入六臂（命中 ∕ 不存在 ∕ 目录 ∕ 超 4000 截断 ∕ 多引 ∕ 非串）+ 探针缺 ⇒ 抛 + strip 回环（`strip(inject(x)) === x`）+ 失败闭合（形近文本 ∕ 缺摘要块 ⇒ 原样） | 腿 1 ∕ 腿 3 间接覆盖 |
| ② VSC 薄壳 `thincoder-vscode/src/extension/file-refs.mjs` | 81 行自持（同 ①）；消费三处 = `panel-chat.mjs:187`（注入）· `panel-session.mjs:185`（恢复剥离）· `panel-session-write.mjs:139`（标题剥离） | 薄壳（≈25）：`node:fs` 三件探针 + 核件注入转口 + `stripAtRefs` re-export；**调用面三处零改**——VSC 行为逐字不变 | 批内件：结构扫描（壳内零 `[Referenced files:` 字面 ∕ 零 regex 定义 ∕ 零 readFileSync 直用面）+ 行为对拍（同临时目录：壳输出 === 核件 + 真探针输出）+ 三 import 面 diff 零命中 | 腿 4（VSC 回归复读——形不变） |
| ③ 标题源 `thincoder-core/generate-title.mjs` | `:132` `generateTitle(firstUser.content, …)`——注入形直入标题请求 | `:132` 读源处剥离：`generateTitle(stripAtRefs(firstUser.content), …)`（谓词单源 `isRealUserMsg` 保证串形——`thincoder-core/session-store.mjs:254-260`；CLI 无注入 ⇒ 零动作） | 批内件：fetch 桩（经核 `_deps.proxyFetchImpl` 缝）——请求体零哨兵正文 ∧ 含 `@a.txt`；自守卫短路不触网 | 腿 2（标题） |
| ④ 桌面薄壳新档 `thincoder-desktop/src/main/file-refs.mjs` | 无（全树 `fileRef∥at-ref∥stripAtRefs` 零命中——#632 在册） | 薄壳（≈35；沿 `thincoder-desktop/src/main/file-links.mjs:12-24` 形）：`node:fs` 三件探针 + 核件注入转口 + `stripAtRefs` re-export | 批内件：真临时目录注入（壳输出 = 期望注入形）+ probe 面实读 | 腿 1 |
| ⑤ 注入缝 `thincoder-desktop/src/main/turn-driver.mjs` | 用户文本三径（窗注入 ∕ 忙队续发 ∕ 直发）皆原文直达；无注入面 | 新增 `injectUserText(text)` 闭包（取值 = `projects.currentCwd()`；cwd 非串 ∥ 空 ⇒ **原样返回**——无根零解析，沿核 `file-links`「无根 ⇒ 相对 token 零判据」同义）⇒ 注入 `createTurnFace`（`:88-94`）；**行数额度 = 288 ⇒ ≤300**（+≤12——触线 ⇒ 拆点顺判） | 批内件：cwd 空 ⇒ 零动作；注入面抵达 createTurnFace（交接实读） | 腿 1 |
| ⑥ 注入执行点 `thincoder-desktop/src/main/turn-face.mjs` | `executeTurn`（`:63-138`）以 `text` 直起跑（`:91` `run(agent, text, …)` 为桌面主侧唯一 `run` 调用点——`src/main/**` 实读）；无注入 | 起跑前单点：`opts.autoTurn !== true`（用户回合）⇒ `body = injectUserText(text)`（缺缝 ⇒ 原样——向后兼容）；resume 循环复用同一 `body`（**恰一次注入**——核 resume 不重推用户消息）；序 = 附件（prepare ∕ degrade）先、注入后（= VSC 序：降级 → `panel-chat.mjs:187` 注入） | 批内件：用户回合 ⇒ run 收注入形；`autoTurn` 轮 ⇒ 原文（timer ∕ 消化 ∕ 上行三径负向锁）；中断续跑 ⇒ 注入恰一次；缺缝 ⇒ 原文 | 腿 1（模型复述哨兵） |
| ⑦ 恢复面 `thincoder-desktop/src/main/session-slots.mjs` | `pageHistory`（`:168-182`）：`historyWindow`（`:175`）产物直出——注入形随盘上历史进回执 | `:175-179` 映射面：user 消息文本过 `stripAtRefs`（首屏 + 回填同门；assistant ∕ tool 零动）——同位 = VSC `panel-session.mjs:184-185`「端侧显示边界」 | 批内件：沙箱槽文件含注入形 ⇒ 回执 user 文本 = `@x` 简洁形 ∧ 非 user 零动 ∧ 回填页（before 非空）同判 | 腿 2（切会话 ∕ 重开） |
| ⑧ 活面 ∕ 队面（零改 · 负向锁） | 本地先行出泡 = 键入串逐字（`renderer/mount-composer.mjs:153-167`）；队快照 = 条目原文（`src/main/queued-input.mjs:39`）；消费回执 `delivered.text` = 条目原文（`src/main/window-queue.mjs:41`） | **零改**——注入不得前移至受理 ∕ 入队面；三显示面（活面气泡 ∕ 待发送带 ∕ 队镜面）恒原文 | 批内件（负向锁）：忙态入队 → 续发消费全程 ⇒ `ev:queue` 快照与 `delivered.text` 零 `[File:` 命中；注入恰发生在 run 入参 | 腿 1（活面气泡原文） |
| ⑨ 步边界 pickup（零改 · 两端同形） | VSC `queued-pickup.mjs:38` ∕ 桌面 `turn-chain.mjs:58`：`pushReal` 原文直落——**两端皆无注入**（发现 F1） | 保持零改（对齐 VSC 形——本批不造桌面部差） | 批内件（负向锁）：pickup 径推送文本 == 原文 | —（F1 另批裁） |
| ⑩ 欢迎条词面 `thincoder-desktop/renderer/i18n-views.mjs` | `:52`（en）`:194`（zh）`welcome.shortcuts` = 「Enter 发送 · Shift+Enter 换行」——缺 `@` 段（登记 = `UI.md:383` ∕ `renderer/views/chat-guide.mjs:36`「随缺面族批补」） | 补 `@` 段（值 = U-A 核定）：zh「输入 @ 引用文件 · Enter 发送 · Shift+Enter 换行」∥ en「Type @ for file references · Enter to send · Shift+Enter for newline」（plain-text 形——端渲染面无标记） | 词表锁：两语值含 `@` 段（值 = U-A 核定后锁定） | 腿 5（空会话首屏） |
| ⑪ 文档面收正（随实施波 · 逐靶） | `UI.md:383`（端差登记句）· `renderer/views/chat-guide.mjs:36`（同句注释）· `PROJECT.md` KD 表（末行 = KD-50，`:92`）· `CORE-UNIFICATION.md:328`（#183 行枚举含 `file-links` + `file-refs`）· `WEBVIEW.md:146` ∕ `:151`（「产者住端侧」句）· `WEBVIEW.md:152`（N-W6 登记句） | 逐靶收正：登记句退场 / 指针改核单源（形 = 「语义同源 = `thincoder-core/file-refs.mjs`——上提后核单源；两端薄壳 = 探针注入」——沿 KD-39 收正先例 `PROJECT.md:79`）；#183 收正注（**`file-refs` + `file-links` 两半同笔**——各移出 ④ + ④ 清单与计数随改（覆盖对账同轮同步）——沿 `history-window` 先例 `CORE-UNIFICATION.md:336-339`）；WEBVIEW.md §4.4 「产者住端侧」句退场（前提失效——F3）；`WEBVIEW.md:152` N-W6 登记句加**并列注**（VSC + 桌面 ∥ CLI——消解路 ∕ 到期随动）；UI.md 落笔形 = 输入区行**行内指针**（→ 本档新注「本批注（@ 文件引用对齐 · 2026-09-29）」）+ 本批注项（**注入 ∕ 剥离 ∕ 欢迎条词值 + 判据** + D3 计数行——沿 `UI.md:671-672` ∕ `:699` 先例）；指针目标点名 = 本档新注 ∕ 决策单源 = `PROJECT.md` **KD-51**；PROJECT.md 增 KD 行（= **KD-51**——末行 KD-50 顺延落位） | 文档面 = 句级（dead 句零残留；指针指向核单源；D3 计数同改） | — |

### 2.3 机制设计（注入缝 ∥ 剥离面——语义与边界）

**三面单源链**（一条用户消息的一生）：

- **注入**（模型输入面）：`executeTurn` 起跑前单点（用户回合）⇒ 注入形随 `run` 入参落核 `pushReal`（`thincoder-core/agent/setup.mjs:134`——run 入参即 user 消息 content）⇒ **盘上人读线 ∕ 机读线皆携注入形**（= VSC「落盘消息携注入形」同判）。
- **剥离**（显示 ∕ 标题面）：恢复面（`pageHistory`）与标题源（`ensureSessionTitle`）两处同读核件 `stripAtRefs`（零第二实现；落点 = 读侧显示边界——盘面 ∕ 机读线零触碰，沿 `WEBVIEW.md:151` ③）。
- **消费**（显示面）：活面气泡 = 键入串（本地先行出泡）；待发送带 ∕ 队镜面 = 条目原文；重开 ∕ 切回（恢复面）= 剥离形；标题 = 剥离形。

**注入点选择（为什么是 `executeTurn`，而非 `send` ∕ `drive`）**：

- 全部用户文本投递径收口于单回合执行面：直发（`turn-driver.mjs:230` `drive`）· 忙队续发（`turn-chain.mjs:94` `drive`）· 窗内消费 ∕ 残续发（`suspension-drive.mjs:172/:210` → `runTurn` = `executeTurn`；核件（`thincoder-core/agent/suspension.mjs:217`）`await runTurn(item)` 传递原始文本）——`run` 唯一调用点 = `turn-face.mjs:91`（全档实读）⇒ **单缝覆盖四径**（= VSC `runPanelChat` 注入位的结构同位——VSC 侧直发 ∕ 忙队 ∕ 窗径同收口于 `panel-chat.mjs:187`）。
- 若注入在 `send`（受理 ∕ 入队面）：注入形进队条目 ⇒ 队镜面（`ev:queue` 快照）· 待发送带 · `delivered.text` 三显示面全污染——与 VSC 形分叉（VSC 队载原文、注入发生在起跑刻）。
- **系统轮排除**：`autoTurn` 真（timer ∕ 消化 ∕ 上行）为系统产文 ⇒ 不扫（同一门已在同档 `turn-face.mjs:82` 用于 pickup 分流——判据同居单点）。
- **步边界 pickup 径**（`turn-chain.mjs:58` 不经 `executeTurn`）⇒ 与 VSC 同缺（F1；本批不造桌面部差——见 2.8）。

**剥离面（两处 · 同读一函数）**：

- **恢复面** `pageHistory`（`session-slots.mjs:175-179` 映射位）：`m.kind === "user"` ⇒ `{ ...m, text: stripAtRefs(m.text) }`；首屏与回填同门；assistant ∕ tool 零动（对位 VSC `sendHistoryPage` user 分支 `panel-session.mjs:185`）。
- **标题源** `ensureSessionTitle`（核 `generate-title.mjs:132`）：首条真实 user 消息读取处剥离——VSC 同位 = 其自持标题链 `panel-session-write.mjs:139`（零改）。
- 边界：剥离只在读侧施加、不回写盘面（注入形 = 落盘形，模型 ∕ 恢复两态据此分家）。

**跨端续用与端差面**：桌面 ∕ VSC 会话互 resume——注入形对两端历史读取零影响（模型线原文入库 ∕ 显示面剥离）；**CLI 恢复面维持 N-W6 登记**（CLI 恢复渲染仍显展开文——`WEBVIEW.md:152`；本批桌面并入 VSC 剥离侧，CLI 侧零触，到期 = CLI 恢复渲染面下次触碰）。

**cwd 语义**：注入解析基 = `projects.currentCwd()`（项目根；**非** `process.cwd()`——沿装配端差取值面 `agent-assemble.mjs:7-8`）；无根态在桌面发送面不可达（输入区禁用判据 = 活动会话在场 ∧ 会话需项目——判据锚 `UI.md:20`（输入区行）∕ `:67`（批 B 追加注项 3））⇒ 无根臂 = 防御臂（fail-closed 原样返回）。VSC 侧 = `_cwd() || process.cwd()`（恒有 workspace）——两端差异 = **免登记给据句**（评审 #55-7）：零用户可见差（两基同义 = 会话项目根 ∥ 工作区根）+ 无根态两臂皆不可达的判据；差异仅防御臂取值（兜底 ∥ 原样返回）。

### 2.4 受影响文件表 + 拆批

（行数口径 = **read 总行数**（内容行 = −1 折算——文末换行不计；沿 `i18n-split` §2.9 R6 注）；届盘实读 2026-09-29 17:2x（已勘正：`CORE-UNIFICATION.md` 记 1994 ⇒ 现盘实读 **2000**；`turn-driver.mjs` = **288**（read 总行）∕ **287**（内容行）；`PROJECT.md` 记 1326 ⇒ 现盘实读 **1340**）；增量 = 设计预期，实施轮届盘重读重锚）

**批 A · 核件上提 + VSC 转口（形零改）**

| 文件 | 现行 | 增量 |
|---|---|---|
| `thincoder-core/file-refs.mjs`（新档） | 0 | ≈100–110（自持档 81 行逐字搬 + 探针缝 + 档头） |
| `thincoder-vscode/src/extension/file-refs.mjs` | 81 | ⇒ ≈25（薄壳化；三调用面零改） |
| `thincoder-core/generate-title.mjs` | 139 | +≈3（import + 剥离调用 + 注） |
| `thincoder-vscode/src/extension/panel-chat.mjs` ∕ `panel-session.mjs` ∕ `panel-session-write.mjs` | 261 ∕ 326 ∕ 145 | ±0（三 import 面零改——批内件证） |
| 批内件 `docs/batches/2026-09-29-missing-face-family.test.mjs`（新档 · 名随批次档 · 复跑 `node --test` 直驱 · 随批归档） | 0 | ≈260–360（两波共持单件） |

**批 B · 桌面接入**

| 文件 | 现行 | 增量 |
|---|---|---|
| `thincoder-desktop/src/main/file-refs.mjs`（新档） | 0 | ≈35 |
| `thincoder-desktop/src/main/turn-driver.mjs` | **288**（read 总行）∕ **287**（内容行） | +≤12（**288 ⇒ ≤300 额度在册**——两口径下均 ≤300；触线 ⇒ 拆点顺判） |
| `thincoder-desktop/src/main/turn-face.mjs` | 141 | +≤8 |
| `thincoder-desktop/src/main/session-slots.mjs` | 227 | +≤6 |
| 批内件（同上件） | — | 见批 A |

**批 C · 词面 + 文档面**

| 文件 | 现行 | 增量 |
|---|---|---|
| `thincoder-desktop/renderer/i18n-views.mjs` | **329**（read 总行）∕ **328**（内容行） | ±2（两语值——U-A 核定后落；该档越 300 顾问线在册——**在册越层档（预案 = 词族按视图面续拆）**，单源 = `PROJECT.md:298`；本批 ±2 非结构性触碰不触拆分窗口） |
| `thincoder-desktop/renderer/views/chat-guide.mjs` | 81 | ±2（登记句收正） |
| `docs/desktop/design/PROJECT.md` | **1340**（read 总行——设计轮记 1326；实施轮届盘重读） | +KD 行 1（= **KD-51**——末行 KD-50 顺延）+ 变更记录 1 行 |
| `docs/desktop/design/UI.md` | 709 | 输入区行**行内指针**（→ 本档新注「本批注（@ 文件引用对齐 · 2026-09-29）」）+ 本批注项（注入 ∕ 剥离 ∕ 欢迎条词值 + 判据 + D3 计数行；决策单源 = `PROJECT.md` KD-51）+ `:383` 登记句收正 + 变更记录 1 行 |
| `docs/core/design/CORE-UNIFICATION.md` | **2000**（read 总行口径；设计轮记 1994——现盘实读已正 ∕ 实施轮届盘重读） | #183 收正注（**`file-refs` + `file-links` 两半同笔**——各移出 ④ + ④ 清单与计数随改（覆盖对账同轮同步）——沿 `history-window` 收正注形） |
| `docs/vsc/design/WEBVIEW.md` | 730 | §4.4 `:146` ∕ `:151` 收正（核单源 + 端壳；「产者住端侧」句退场） |

**拆批依据**：A 先行（B 依赖 A 核件；VSC 形零改为 A 的前置约束）；C 文案 ∕ 文档与代码零依赖（串行避同档冲突即可）。三批可一次评审 + 代签（覆盖 = 本表全量）；实施 = 逐批 serial（A → B → C），token 按批签发。

**测试面**：① 本批单元件 = `docs/batches/2026-09-29-missing-face-family.test.mjs`（随批归档、零仓套件消费）；② 集成面 = 不新增 ∕ 不修改（预算纪律——桌面集成套件重建时随真机腿对照，本批不开）；③ 真机腿 = 父侧探针（见 2.5）。

### 2.5 验收对照（三链同源）

- **本批条目** = 台账 #632（唯一行）⟺ 本 §2.2 逐处表 ⟺ 登记面（`UI.md:383` ∕ `docs/vsc/requirements/WEBVIEW.md:40` F-W15 ∕ `docs/vsc/design/WEBVIEW.md` §4.4）。
- **父侧本轮验收对照**：① §2 覆盖 #632 全链三面 ✓（2.2 ①–⑨：注入 ∥ 剥离 ∥ 消费）② 受影响文件表 + 行数 + 分批 ✓（2.4 批 A ∕ B ∕ C）③ 零产品码改动 ✓（本档为唯一落盘面）。
- **机检面** = 批内件 `docs/batches/2026-09-29-missing-face-family.test.mjs`（逐条见 2.2 判据列；复跑 `node --test docs/batches/2026-09-29-missing-face-family.test.mjs`）；零散文锚。
- **真机腿**（父侧探针）：
  - **腿 1（注入）**：桌面项目含哨兵文件 `a.txt`；输入 `@a.txt 把文件里的哨兵串说出来` ⇒ 发送 ⇒ ① 盘上槽人读线 user 消息含 `[File: a.txt]` 围栏 + `[Referenced files:` 摘要块 ② 模型回复复述哨兵串 ③ 活面气泡 = 键入原文。
  - **腿 2（剥离）**：同会话切走再切回（或重启）⇒ 恢复面气泡 = `@a.txt …` 简洁形（非围栏块）；标题不含 `[File:`（标题生成后复读槽 `title`）。
  - **腿 3（负向）**：`@不存在文件` ⇒ 发送 ⇒ 盘上 user 消息 = 原文（零围栏 ∕ 零摘要块）；零报错。
  - **腿 4（VSC 回归复读）**：VSC 注入 ∕ 恢复 ∕ 标题三面行为不变（壳化前后同输入对拍——形零改实证）。
  - **腿 5（伴随项）**：空会话首屏欢迎条快捷键行含 `@` 段（词值 = U-A）。
- **需求侧合规复核**：① 桌面需求档无 `@` 引用独立条目（承载 = `UI.md:383` 端差登记 + VSC 侧 F-W15）——建议主 agent 随动一句（U-E，非阻塞）；② F-W15「口径二选一先裁」已由 A 形（恢复剥离）落定——桌面按 A 对齐（非新裁）；③ F-W15 边界「不改 `injectAtRefs` 展开本体」——本批逐字搬 + 零语义改 ✓（`WEBVIEW.md:154` 契约保持）。

### 2.6 边界（不做）

- **零产品码**（本轮 = 设计轮；§2 为唯一交付面）。
- **VSC 行为零改**（对齐基准冻结；唯一机械动点 = 档体薄壳化——口径见 2.1；备选两步形 = U-B）。
- **不扩面**：CLI 零触；`CORE-UNIFICATION` #183 行内 `file-links` 半（前批 stale）⇒ **同笔收正**（评审 #55-5 裁定——不留半新半旧行，见 F2）；VSC 测试树死指针（F5）只报；`at-complete` ∕ 核件 atmenu 零触（已在位——#632 在册）。
- **不发明**：regex ∕ 4000 截断 ∕ 围栏 ∕ 摘要块格式逐字搬（零语义改良）；不造第二注入点；不改核 `generateTitle` 签名；零新 IPC 通道 ∕ 零载荷形改（`msg:send` 等全族零动）。
- **不并批**：**在飞面逐档点名 + 串行**（实施届盘重读他批笔迹，同档 ⇒ 串行——沿 `ipc.mjs` 观察先例）——点名：`turn-driver.mjs` ∕ `session-slots.mjs`（有他批改动史）；`thincoder-desktop/renderer/i18n-views.mjs`（在飞批触碰面 = residuals-round3 #618 值面——该批现态 = §4∕§5∕§6 空置 = 未批准 ∕ 未实施，`PROJECT.md:298` ∕ 批档 `docs/batches/2026-09-29-desktop-residuals-round3.md:432-434`）；批 C 四文档靶 `PROJECT.md` ∕ `UI.md` ∕ `CORE-UNIFICATION.md` ∕ `WEBVIEW.md`（他批笔面——doc-backfill 批实施中（波 2 已落 ∕ 波 1 在队，`docs/batches/2026-09-29-doc-backfill.md:242`）；沿其「按文件串行」先例 `:120`；见 U-F）。

### 2.7 上抛项（父侧裁）

- **U-A** 词值核定（内容权 = 主 agent）：欢迎条 `@` 段两语值——zh「输入 @ 引用文件 · Enter 发送 · Shift+Enter 换行」∥ en「Type @ for file references · Enter to send · Shift+Enter for newline」（段义沿 VSC `welcome.shortcutsHtml`「输入 @ 引用文件」；plain-text 形——端渲染面无标记）。
- **U-B** 「VSC 侧零改」口径确认：形零改（lean——上提机械动点 = 档体薄壳化在册）∥ 严格字面（VSC 档体零触 ⇒ 备选 = 两步形，双写窗口在册）。
- **U-C** 伴随项入批确认：欢迎条 `@` 段 + 文档靶（2.2 ⑪）随本批落（登记窗口 = 「缺面族批补」——`UI.md:383` ∕ `docs/batches/2026-09-28-desktop-vsc-align-3.md:173`）；如判扩面 ⇒ 分离另批。
- **U-D** F1（步边界 pickup 缺口）处置：本批零改保持两端同形；另批（须动 VSC——两端同修）∥ 接受登记（到期 = 该径下次触碰）。
- **U-E** 需求档随动（主 agent 笔 · 如判需要）：桌面 `@` 引用面一句（现承载 = `UI.md:383` 端差登记——本批兑现后退场）。
- **U-F** 批 C 排期裁定（评审 #55-1）：四文档靶 ∕ `i18n-views.mjs` 落笔与他批在飞笔同档 ⇒ 按文件串行（他批落定后落地，或父侧定序——沿 doc-backfill 波 2 先例 `docs/batches/2026-09-29-doc-backfill.md:120`；`i18n-views.mjs` 对 residuals-round3（未实施态）同判）。

### 2.8 发现（报告 · 含非阻塞项）

- **F1（跨端同形缺口 · 本批不修）**：步边界 pickup 径推送原文、无注入——VSC `queued-pickup.mjs:38` ∥ 桌面 `turn-chain.mjs:58`（实读）；两端同形 ⇒ 非端差，但模型输入面同缺（用户排队 `@` 消息经步边界送达时不携文件正文）。处置 = U-D。
- **F2（前批 stale · 本批同笔收正）**：`CORE-UNIFICATION.md:328` #183 行枚举含 `file-links` + `file-refs`——`file-links` 半自 R2 上提 + parity-b4 改指后 stale ∕ `file-refs` 半随本批上提失效 ⇒ **两半同笔收正**（各移出 ④ + 计数随改——见 2.2 ⑪；评审 #55-5 裁定）。
- **F3（前提失效 · 收正靶）**：`WEBVIEW.md:151` 落点判据 ②「注入语法的产者住端侧」——上提后失效（产者 = 核件）⇒ 随本批收正（2.2 ⑪）。
- **F4（登记前设失真 · 收正靶）**：`UI.md:383` ∕ `chat-guide.mjs:36` 登记句内「桌面 @-补全 = 缺整面族」前设失真（@ 补全已随输入面板批在位——`at:complete` 通道 ∕ `at-complete.mjs:1-13`）⇒ 该句随本批退场（登记兑现）。
- **F5（死指针 · 非本批）**：`panel-session-write.mjs:15` 注释引 `at-refs-restore.test.mjs:19`——该测试档不在盘（`thincoder-vscode/test/` 现读零命中）⇒ 归属 = VSC 测试树重建批（只报）。
- **F6（端差面随动说明）**：N-W6（CLI 恢复面显展开文）为在册端差——本批桌面并入 VSC 剥离侧后，该登记两端 = VSC + 桌面 ∥ CLI ⇒ **登记句随批加并列注**（句级——见 2.2 ⑪；消解路 ∕ 到期 = CLI 恢复渲染面下次触碰，按在册）——评审 #55-6 裁定。

### 2.9 记录块（决策落档）

- 本 §2 = 本批设计正文（裁定「上提核件单源」+ 逐处表 11 处 + 机制设计 + 文件表 + 拆批 A ∕ B ∕ C + 验收 + 边界 + 上抛 U-A–U-F + 发现 F1–F6）；设计档落点 = `docs/desktop/design/{PROJECT,UI}.md` ∕ `docs/core/design/CORE-UNIFICATION.md` ∕ `docs/vsc/design/WEBVIEW.md` 句级 ∕ 行级增补（随实施波落笔，逐靶 = 2.2 ⑪）。
- 决策落档 = 本档同日；实施 = 评审 → 代签 §4 → token 后按 2.4 拆批（A → B → C）。
- 状态行 = 设计完成（2026-09-29）。

### 2.10 修正轮 1（评审 #55 · §3 轮次 1 · 2026-09-29 · eng-designer）

父侧逐条裁定：七条全数受理。就地修正（docs first；§3 零改；零产品码 ∕ 他档零改）。落点均在本档（`docs/batches/2026-09-29-missing-face-family.md`）——下表记 `:行`（修正后实读）：

| 号 | 处置 | 落点（修正后实读） |
|---|---|---|
| 1 | 2.6「不并批」改「在飞面逐档点名 + 串行」口径——清单补 `i18n-views.mjs` 与批 C 四文档靶（`PROJECT.md` ∕ `UI.md` ∕ `CORE-UNIFICATION.md` ∕ `WEBVIEW.md`）；§2.7 增 U-F 排期上抛（沿 doc-backfill 波 2 先例） | `:149` ∕ `:158`（U-F） |
| 2 | 2.2 ⑪ ∕ 2.4 同步 `UI.md` 落笔形 = 输入区行行内指针 + 本批注项（注入 ∕ 剥离 ∕ 欢迎条词值 + 判据 + D3 计数行）；指针目标点名 = 本档新注「本批注（@ 文件引用对齐 · 2026-09-29）」∕ 决策单源 = `PROJECT.md` KD-51 | `:64` ∕ `:122` |
| 3 | 行数口径注 = read 总行（内容行 = −1 折算——沿 i18n-split §2.9 R6）；`CORE-UNIFICATION.md` 记 1994 ⇒ **2000**；`turn-driver.mjs` = **288** ∕ **287** 与 `i18n-views.mjs` = **329** ∕ **328** 两口径注明；同族勘正 `PROJECT.md` 记 1326 ⇒ **1340** | `:93` ∕ `:110` ∕ `:119` ∕ `:121` ∕ `:123` |
| 4 | `i18n-views.mjs` 归因「i18n-split 批产物」⇒「**在册越层档（预案 = 词族按视图面续拆）**」（单源 = `PROJECT.md:298`） | `:119` |
| 5 | `CORE-UNIFICATION.md:328` #183 行 `file-links` 半**同笔收正**（与 `file-refs` 两半 → 各移出 ④ + ④ 清单与计数随改 ∕ 覆盖对账同轮同步——沿 `history-window` 收正注形）；2.6 不扩面句与 F2 同步 | `:64` ∕ `:147` ∕ `:163` |
| 6 | `WEBVIEW.md:152`（N-W6 登记句）入 ⑪ 收正靶——句级加并列注（**VSC + 桌面 ∥ CLI**，消解路 ∕ 到期随动）；F6 去「登记文本零改」 | `:64` ∕ `:167` |
| 7 | cwd 语义段：补判据锚 `UI.md:20` ∕ `:67`；「有意分歧在册」⇒ **免登记给据句**（零用户可见差 + 判据） | `:89` |

同笔随动：§2.9 上抛计数句 U-A–U-E ⇒ U-A–U-F（`:171`）；§2 状态行收正（修订轮 1 在册）。

验收：① 逐条 1..7 落位（上表读数——修正后逐区实读复核）② 读回核实（D6——十三处单行替换 + U-F 一行插入，总改点 14；行数 197 ⇒ 198）③ 零产品码 ∕ 他档改动（本档外零笔；§3 零改）。

披露（同族勘正 · 评审未点）：`i18n-views.mjs` 329 ∕ 328 与 `PROJECT.md` 1326 ⇒ 1340 两处为随 #3 口径同族勘正（均 read 总行口径实读——`PROJECT.md` 现盘 1340 已复核；i18n-views 末行 = `:329`）。

### 批 C 文档面随动（2026-09-29 · eng-designer · 缺面族批补轮）

**轮次** = initial（文档面随动）；**写域** = `docs/desktop/design/{PROJECT,UI}.md` ∕ `docs/core/design/CORE-UNIFICATION.md` ∕ `docs/vsc/design/WEBVIEW.md` 句级收正 ∕ 补句（零产品码 · 零他档 · 零新语义 · 不发起评审——父侧门）；**逐靶** = §2.2 ⑪ + §2.10（修正后）。行号 = 落笔后届盘实读（PROJECT.md **1373** 行 ∕ UI.md **728** 行 ∕ CORE-UNIFICATION.md **2004** 行 ∕ WEBVIEW.md **736** 行——read 总行口径）。**段位注** = dispatch 点名「§5 写入」；机械段白名单 eng-designer = §2 ⇒ 落 §2 本小节（沿 `docs/batches/2026-09-29-enddiff-clearance.md` §2「批 C 文档随动」同构先例）。

**逐处表（档 → 落点 → 落值）**

| 档 | 落点 | 落值 |
|---|---|---|
| PROJECT.md | :93 | 新增 **KD-51**——@ 文件引用 = 核单源（`thincoder-core/file-refs.mjs`：`injectAtRefs` ∕ `stripAtRefs` 同档）+ 两端薄壳（探针注入）+ 注入位 ∕ 剥离位 + 有意分歧给据（cwd 基——免登记给据句）；形式沿 KD-39 收正先例（含被否三条） |
| PROJECT.md | §4.1 :166 ∕ :171 ∕ :179 ∕ :275 | 行数账族按盘收正——`turn-driver.mjs` **291 ⇒ 299**（read 总行 300 · 触线入列贴层） ∕ `turn-face.mjs` **140 ⇒ 145** ∕ `session-slots.mjs` **226 ⇒ 231** ∕ `views/chat-guide.mjs` **80 ⇒ 81** |
| PROJECT.md | §4.1 :190 | 新档行——`thincoder-desktop/src/main/file-refs.mjs` **19**（端薄壳：fs 三件探针 + 核件注入转口 + `stripAtRefs` re-export） |
| PROJECT.md | §4.1 :307 | 贴层行补列——`src/main/turn-driver.mjs` **299**（@ 文件引用对齐批入列——read 总行 300） |
| PROJECT.md | 变更记录 :1370-1371 | 本批一行（KD-51 ∕ 行数账族） |
| UI.md | :20 | 输入区行**行内指针**——@ 文件引用对齐批（注入 ∕ 剥离 ∕ 标题三面链 → 本档新注 ＋ `docs/desktop/design/PROJECT.md` **KD-51**） |
| UI.md | :382-:383（「对齐第三批 · 小修族」项 15） | 端差登记句收正（登记兑现退场——`@` 段已落 ⇒ **端差消解**句；前设「@-补全 = 缺整面族」失真句删净）+ 落点串按盘收正（`i18n.mjs` ⇒ `renderer/i18n-views.mjs`——`welcome.*` 词条现住） |
| UI.md | :552-:561 | 新增「**本批注（@ 文件引用对齐 · 2026-09-29）**」五项（注入 ∕ 剥离 ∕ 欢迎条词值〔U-A 逐字〕 ∕ 判据 ∕ D3 计数行）——指针目标 = 本注 ∕ 决策单源 = `PROJECT.md` **KD-51** |
| UI.md | 变更记录 :726-727 | 本批一行 |
| CORE-UNIFICATION.md | :328（#183 行） | 枚举两半同笔移出（`file-links` ∕ `file-refs` 自 `extension/**` 清单除名）+ 括号注（「两档已上提核——收正见下表后注」）+ 末列「不迁（…项收正）」随收正 |
| CORE-UNIFICATION.md | :340-:341（收正注） | 新 bullet——承 R2 处理流批上提 ∕ #632 上提（理由一行 = 两档纯函数零宿主依赖 ⇒ 非结构性不对称〔A9〕）+ **④ 清单与计数收正**（**十八档 → 十六档**——覆盖对账同轮同步） |
| CORE-UNIFICATION.md | :366 ∕ :372 ∕ :374（计数随改） | `extension/**` 对位 **18 → 20** 档 ∕ ④ **20 → 18** 档（#183 十八档 → 十六档） ∕ ④ 桶合计 **101 → 99** ∕ 其余 **141 → 143**（对位行 **140 → 142**） |
| CORE-UNIFICATION.md | 变更记录 :2000-2001 | 本批一行 |
| WEBVIEW.md | :146 | 「剥离函数与注入产者同档」改核单源（语义同源 = `thincoder-core/file-refs.mjs`——上提后核单源；本端档 = 薄壳〔探针注入 ∕ re-export〕——「同住一处」句保持） |
| WEBVIEW.md | :151 | 落点判据 ②「注入语法的产者住端侧」句退场（前提失效——产者 = 核件）；③ 顺次改 ② |
| WEBVIEW.md | :152-:153 | N-W6 登记加**并列注**（**VSC + 桌面 ∥ CLI**——桌面并入本端剥离侧；消解路 ∕ 到期保持同判） |
| WEBVIEW.md | :155 | `injectAtRefs` 补核单源限定（契约句本体零改） |
| WEBVIEW.md | 变更记录 :734-735 | 本批一行 |

**披露项**

1. **段位（任务书 §5 vs 机械段）**：dispatch 点名「§5 写入本批档」——机械段白名单 eng-designer = **§2**（§5 归 eng-coder）⇒ 落 §2 本小节；先例 = enddiff 批「批 C 文档随动」亦住 §2。
2. **一致性面追加（同笔披露）**：UI.md :383 落点串 `i18n.mjs` ⇒ `renderer/i18n-views.mjs`——依据 = `welcome.*` 词条实住 `thincoder-desktop/renderer/i18n-views.mjs`（该档 :48-:52 实读；`renderer/i18n.mjs:89` 自注「单源 = renderer/i18n-views.mjs」）。
3. **行数面回填闭合**：§4.1 收正后行数面差异 **4 ⇒ 0**（比对 129 ⇒ 130 行——新增 file-refs 行入比较面）；原四差异（turn-driver ∕ turn-face ∕ session-slots ∕ chat-guide）即 §2.4 ∕ §5.2 在册「回填工单」——本批收正生效。
4. **在册红行改面（非新增红）**：PROJECT.md 贴层行（:305 ⇒ :307）423 ⇒ **504** 字符——该行基线即 >300（在册行宽红行）；行宽 FAIL 总数 82 不变。
5. **机检读数**（`node scripts/doc-check.mjs` · 落笔后）：悬空 **160**（= 届盘基线 160——**零新增**）· 行宽 **82 行**（= 基线 82——**零新增**）· 行数面差异 **0**。**本批写域零新增红** ✓。（§5.2 记悬空 161——本轮基线实读 160；前后一致，差 1 非本批引入。）
6. **发现（报告项 · 非本批写域）**：① `thincoder-desktop/renderer/views/chat-guide.mjs:26` 注释「词面住 `renderer/i18n.mjs`」与现盘不符（`welcome.*` 实住 `renderer/i18n-views.mjs`；同档 :36-37 新注已指 i18n-views）——产品码注释面，归后续触碰该档的批；② `docs/vsc/requirements/WEBVIEW.md` §4 F-W15 行仍为「本端 ∕ CLI」二分措辞（桌面并入剥离侧后登记两端集合偏：VSC + 桌面 ∥ CLI）——需求档（主 agent 笔），报告不落。

**读回核实（D6）**：27 处改点逐处读回在案（含块级插入两处 = UI.md 本批注 ∕ CORE 收正注；行拆两处 = UI.md :382-383 ∕ WEBVIEW.md :152-153；变更记录四档各一行）。

**边界**：零产品码 · 零他档（四档 = 点名单内）· 不发起评审（父侧门）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**范围与限界**：无项目标准档 ∕ 无文档地图（方法学与 Document ownership 判据降级——按 Project Guide + 仓内批档惯例核对）；核对面 = 设计所引代码 ∕ 文档坐标逐处实读（约 30 处 file:line 抽验，除发现 3 外全部命中）；台账（SQLite）不在仓内 ⇒ #632 行原文未读（unverified，覆盖性按 enddiff-clearance 转批要点对照）；本轮发现表 + 计数 + VERDICT 逐字落此。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Scope（协调项 · R5） | 🟡 | 「他批在飞文件零触」与批 C 实际写面不符：批 C 写 `thincoder-desktop/renderer/i18n-views.mjs`（`thincoder/docs/batches/2026-09-29-missing-face-family.md:119`），而该档在册注明「在飞批触碰面（residuals-round3 #618 值面）」（`thincoder/docs/desktop/design/PROJECT.md:296`；该批边界句 `thincoder/docs/batches/2026-09-29-desktop-residuals-round3.md:13`，现态 = §4∕§5∕§6 空置 = 未批准 ∕ 未实施，同档 `:410-412`）；同族面 = 批 C 四文档靶（PROJECT.md ∕ UI.md ∕ CORE-UNIFICATION.md ∕ WEBVIEW.md）均有在飞批笔（`thincoder/docs/batches/2026-09-29-doc-backfill.md:115` ∕ `:120`——该批自按「按文件串行」处置）。设计 2.6 的「届盘重读 + 串行」清单只列 `turn-driver.mjs` ∕ `session-slots.mjs`（同档 `:149`） | 把 `i18n-views.mjs` 与批 C 文档靶并入点名清单（或把「他批在飞文件零触」改写为「在飞面逐档点名 + 串行」口径）；必要时在 §2.7 增一条排期上抛（沿 doc-backfill 波 2 先例：他批落定后落地或定序） |
| 2 | Clarity（文档靶） | 🟡 | 文档靶两处不同步：2.4 批 C 行声明 `UI.md` 改点 = 「输入区行指针 + `:383` 登记句收正 + 变更记录 1 行」（同档 `:122`），而 2.2 ⑪ 逐靶列（同档 `:64`）无「输入区行指针」项，且未给该指针的指向与承载——本批的 @ 面形态 ∕ 判据（注入位 ∕ 剥离面 ∕ 欢迎条词值）在 UI.md 无点名落点；UI.md 惯例 = 行内指针 + 「本批注（…）」块承载（先例 `thincoder/docs/desktop/design/UI.md:671-672` ∕ `:699`；D3 计数行先例 `UI.md:455`） | 在 2.2 ⑪ 与 2.4 同步 UI.md 落笔形（行内指针 + 本批注项：注入 ∕ 剥离 ∕ 欢迎条词值 + 判据）并点名指针目标（KD-51 ∕ 本档新注），或改写 2.4 行与 ⑪ 一致 |
| 3 | 数值漂移（R7c） | 🔵 | 两处读数与届盘不符：(a) `docs/core/design/CORE-UNIFICATION.md` 记 **1994**（同档 `:123`），现盘实读 **2000** 行（`thincoder/docs/core/design/CORE-UNIFICATION.md:2000` 为末行）；(b) `turn-driver.mjs` 记 **288**（同档 `:110`），并行批按「内容行数口径」记 **287**（`thincoder/docs/batches/2026-09-29-doc-backfill.md:67`）——本档声明口径「内容行口径」（同档 `:93`）但数值似为 read 总行口径。两档皆不改额度结论（.md 豁免 ∕ 两口径下 turn-driver 均 ≤300） | 实施轮按届盘重读两值；口径注明「read 总行数」或「内容行（文末换行不计）」二择一（沿 i18n-split §2.9 R6 口径注先例） |
| 4 | Document ownership（归因） | 🔵 | 归因句「该档越 300 顾问线在册——i18n-split 批产物」（同档 `:119`）与在册不符：`i18n-views.mjs` 标注为「（对齐第三批拆分产出）」（`thincoder/docs/desktop/design/PROJECT.md:224`），且 i18n-split 批明载该档**不拆 ∕ 零改**（`thincoder/docs/batches/2026-09-29-i18n-split.md:30` ∕ `:139`）。实质结论（越 300 在册 + ±2 非结构性触碰不触拆分窗口）经核成立（`PROJECT.md:296`；消解窗口口径 `PROJECT.md:291`） | 归因句改为「在册越层档（预案 = 词族按视图面续拆）」，或删归因、保留「越 300 顾问线在册」实质句 |
| 5 | Doc-state（句级收正） | 🔵 | F2 只报半行：`CORE-UNIFICATION.md:328` 的 #183 行同列 `file-links` 与 `file-refs` 两项（`thincoder/docs/core/design/CORE-UNIFICATION.md:328`），本批只收正 `file-refs` 半（同档 `:162` ∕ `:64`）——该行改后呈半新半旧（`file-links` 半自 R2 上提后 stale） | 该行既已落笔，同笔收正 `file-links` 半（沿 `history-window` 收正注形），或在该行加「`file-links` 半待收（R2 上提后 stale）」注，防整行被读作已核 |
| 6 | Doc-state（登记随动） | 🔵 | 桌面并入剥离侧后，N-W6 登记（`thincoder/docs/vsc/design/WEBVIEW.md:152`：人读线为 CLI 与该端共文件、「同一消息两端不同形」）的对端集合与批后事实面偏；F6 明载「登记文本零改」（同档 `:166`），但该句是跨端读数面（消解路 ∕ 到期判据挂其上） | 随批加并列注（VSC + 桌面 ∥ CLI）或把 `WEBVIEW.md:152` 列入 2.2 ⑪ 收正靶（句级） |
| 7 | Clarity（依据锚） | 🔵 | cwd 语义段（同档 `:89`）两个断点：(a)「无根态在桌面发送面不可达（输入区禁用判据 = 活动会话在场 ∧ 会话需项目）」未附坐标——未附锚但实质成立（`thincoder/docs/desktop/design/UI.md:20` ∕ `:67`）；(b)「有意分歧在册」未点名登记面（2.2 ⑪ 靶同档 `:64` 未含该条） | (a) 补判据锚 `UI.md:20` ∕ `:67`；(b)「在册」改为点名落点，或改写为免登记给据句（零用户可见差 + 判据） |

**计数**：🔴 0 ∕ 🟡 2 ∕ 🔵 5。

VERDICT: pass

## §4 用户批准（主 agent）

**用户批准（父侧代签 · 2026-09-29）**

- **依据** = 用户 2026-09-29 13:52「别等我了，自己跑完」+ 17:02「尽可能消除」令（代点火 + 代批准授权——本批即经此授权点火评审 #55）。
- **三条件核检**：① **评审 pass**——#55（0🔴 · 2🟡 · 5🔵 · pass；§3 在册）② **修正轮落地并经父侧核验**——#62 逐号 1..7 全落（§2.10 修正块在册，含同族勘正披露）③ **凭证**——评审 #55 已通过（token 在手）。
- **批准射程** = 本批 §2 全量（批 A：核件上提 + VSC 薄壳 ∥ 批 B：桌面接线 ∥ 批 C：词面 + 文档靶；上抛 U-A–U-F 按档内给据处置，U-A 词值 = 父侧核定随实施入）。
- **不扩面**；〔父侧代签 · 记录在案 · 可 revert〕

## §5 实施记录（eng-coder）
**状态行**：实施完成（批 A+B+C 码面全量 + 批内件 9/9 绿 + 审计 1 轮（补 ⑨ 例）+ advisor 轮 1 pass（0🔴））



### 5.1 交付摘要（首实现轮 · 2026-09-29 · eng-coder）

批 A+B+C 码面全量落地（9 产品档 + 批内件 1 档）；§2.2 ①–⑩ 码面逐处落位、⑪ 文档面按任务书零触（另舱）；VSC 三调用面零改（形冻结——三 import 面与调用形逐字在盘）。

| 处 | 落点（现盘实读 file:line） | 读数 ∕ 证据 |
|---|---|---|
| ① 核件新档 | `thincoder-core/file-refs.mjs`（103 行）——探针缝 `:21` · `injectAtRefs` `:30`（早退 `:31` · regex `:33` · 4000 `:48` · 围栏 `:59` · 摘要块 `:65`）· `stripAtRefs` `:81`（fail-closed `:83-102`） | 注入六臂 ∥ 探针缺/形违⇒抛 ∥ strip 回环+失败闭合——批内件 ① 两例绿；inject 半与上提前快照（`.thincoder/tmp/head/thincoder-vscode/src/extension/file-refs.mjs:9-45`）逐字同构，差异仅 = 探针缝 + 非串/空串早退（设计在册） |
| ② VSC 薄壳 | `thincoder-vscode/src/extension/file-refs.mjs`（18 行）——fs 探针 `:9` · 转口 `:16-18` · 纯 re-export `:13` | 81⇒18；壳输出 === 核件+真探针（行为对拍）；壳内零语法副本（零摘要块字面 ∕ 零 regex ∕ 零 readFileSync 直用）；三调用面零改实证：`panel-chat.mjs:30/:187` · `panel-session.mjs:19/:185` · `panel-session-write.mjs:24/:139` |
| ③ 标题源 | `thincoder-core/generate-title.mjs:17`（import）+ `:136`（`generateTitle(stripAtRefs(firstUser.content), …)`） | 批内件 ③ 例：请求体零哨兵正文 ∧ 含 `@a.txt`（`_deps.proxyFetchImpl` 换桩——零真实网络）；串形保证 = `isRealUserMsg`（`history-window.mjs:17-19`） |
| ④ 桌面薄壳 | `thincoder-desktop/src/main/file-refs.mjs`（19 行）——探针 `:10` · 转口 `:17-19` · re-export `:14` | 真临时目录注入 = 核件输出（行为对拍绿） |
| ⑤ 注入缝 | `thincoder-desktop/src/main/turn-driver.mjs:31`（import）· `:82-87`（`injectUserText` 闭包：`projects.currentCwd()`；非串/空⇒原样）· `:104`（注入 `createTurnFace`） | 批内件 ⑤⑥ 例（驱动面）：无根⇒原样 ∥ 有根⇒注入形入 run；行数额度读数 = 300（read 总行）∕ 299（内容行）≤300 |
| ⑥ 注入执行点 | `thincoder-desktop/src/main/turn-face.mjs:45`（缝注）· `:47`（签名 `injectUserText = null`）· `:87`（`body` 住续跑循环外）· `:96`（`run(agent, body, …)`） | 批内件 ⑤⑥ 例四臂绿：用户回合注入 ∥ `autoTurn` 不扫 ∥ 缺缝原样 ∥ 恰一次（resume 复用同一 body） |
| ⑦ 恢复面 | `thincoder-desktop/src/main/session-slots.mjs:58`（import）· `:180`（`m.kind === "user"` ⇒ `stripAtRefs(m.text)` 映射） | 批内件 ⑦ 例：首屏+回填同门 ∥ assistant 零动 ∥ 盘面零改（注入形=落盘形） |
| ⑧ 活面/队面（负向锁） | 零改——`queued-input.mjs` ∕ `window-queue.mjs` ∕ `turn-chain.mjs` ∕ `suspension-drive.mjs` ∕ `send` 面零 `injectAtRefs` 引用 | 批内件 ⑧ 例：忙态入队→续发全程 `ev:queue` 快照 ∥ `delivered.text` 零 `[File:`；注入恰在 run 入参 |
| ⑨ 步边界 pickup（负向锁） | 零改——`turn-chain.mjs:58` `pushReal` 原文 ∥ VSC `queued-pickup.mjs:40` 原文 | 批内件 ⑨ 例：pickup 推送文本 == 原文 + 两链件零注入引用（两端同形 · F1 保持） |
| ⑩ 词面 | `thincoder-desktop/renderer/i18n-views.mjs:52`（en）∥ `:196`（zh）——`:51` 旧登记注收正；`renderer/views/chat-guide.mjs:36-37` 旧登记句收正 | 词值 = U-A 核定逐字（见 5.3）；批内件 ⑩ 例词表锁 |

### 5.2 机检读数

- **批内件** = `.thincoder/tmp/2026-09-29-missing-face-family.test.mjs`（349 行 · 9 例）：`node --test .thincoder/tmp/2026-09-29-missing-face-family.test.mjs` ⇒ **9/9 绿**（首轮 8 例绿；审计后补 ⑨ 例 ⇒ 9 例全绿）。
- `node --check` 全改档 10 件 ⇒ ALL-SYNTAX-OK。
- `node scripts/doc-check.mjs`：**本批写域零新增红**；锚面悬空 160 ⇒ **161**（+1 = `docs/vsc/requirements/WEBVIEW.md:40` 锚 `file-refs.mjs:34-42`——三同名档基名歧义；**文档面** ∕ 另舱，已上抛父侧）；行宽 FAIL 82 条 = 既存（非本批写域）。
- 近邻回归（只跑自变面）：session-title 6/6 ∥ send-busy-timing 12/12 ∥ queue-pickup-edge Q1–Q8 ∥ parity-b4-vsc-small 12/12 ∥ queue-pickup-edge-copy-wq-parity + copy-susp-queue 19/19 全绿。`2026-09-29-desktop-window-queue-parity.test.mjs` 2 红（T1 `q.take` / T9 `held?.signal`）= **他批在飞漂移**（窗口队 `take`⇒`stepPickup` ∕ 挂起守卫重构；该批自带新版副本 19/19 绿）——非本批所致。
- **真机腿 1–5**（§2.5）：本轮可跑者 = 机检代理面（上列）；真机四腿（桌面注入 ∕ 剥离 ∥ 负向 ∥ VSC 回归 ∥ 欢迎条视觉）= **父侧探针位**（本环境无 GUI 会话）。

### 5.3 披露（诚实项）

- **U-A 词形（父侧复核）**：zh = `输入 @ 引用文件 · Enter 发送 · Shift+Enter 换行`；en = `Type @ for file references · Enter to send · Shift+Enter for newline`（= VSC `welcome.shortcutsHtml` 去标记同序 · plain-text 形；分隔符沿同键行 ` · `）。
- **批内件落点**：实件 = `.thincoder/tmp/2026-09-29-missing-face-family.test.mjs`（父侧 spawn 指定 tmp 落点）；§2.4/§2.5 声明路径（`docs/batches/…`）未落 ⇒ 归档 ∕ 指针收正归父侧（报告项，见 5.4）。
- **触线顺判（⑤ 预算）**：turn-driver = 300 ∕ 299 ≤300（未越）；本批**判不拆**——增量 +9 单主题（注入缝）；可拆点候选 = 队视图面 ∕ 接管面 ∕ 挂起装配面，归下次触碰该档的批顺判。
- **零改实证**：VSC 三调用面 ∥ 队面 ∥ pickup 面 ∥ 活面（renderer 显示面）零改；他批在飞未提交笔迹未被本批触碰（本批仅增量落点）。
- **未做项**：真机腿 1–5 的 GUI 实跑（父侧位）；⑪ 文档面（另舱零触）。

### 5.4 审计与评审轮次与终态

- **explore 审计轮 1**（逐处比对）：3 项低度——① ⑨ pickup 负向锁用例缺（设计 §2.2 ⑨ 判据列）⇒ **已修正**（批内件 8⇒9 例，复跑绿）② 批内件落点 vs §2.4/§2.5（父侧协调项 · 报告）③ §5 空置（待本段落笔 · 非缺陷）。
- **advisor 代码评审轮 1**：🔴 0 ∕ 🟡 3（皆非阻塞：落点协调 ∥ i18n-views 越层在册 ∥ 批内件 349 行设计预算内）∥ 🔵 4（数值漂移 ⟶ 5.1/5.2 已届盘重锚；turn-driver 触线顺判 ⟶ 5.3 在册；批内件 wall-clock 等待沿用同批先例 `2026-09-28-desktop-session-title.test.mjs:95-102`；strip 非串归一 = 无触达·全部调用面皆传串）。**VERDICT: pass**。
- **终态 = clean**（fix round 1 = 审计项①，已复跑全绿；评审零阻塞，无第 2 轮）。

## §6 验证与收口（父代理）

### 6.1 收口（父侧 · 2026-09-29）

- **交付物全落**：**批 A**（核件上提 `thincoder-core/file-refs.mjs` 103 行 ∥ VSC 薄壳 81 ⇒ **18**（三调用面零改）∥ `generate-title.mjs:136` 读源剥离）∥ **批 B**（桌面薄壳 19 行 ∥ `turn-driver.mjs` `injectUserText` ∥ `turn-face.mjs:96` 起跑单点（恰一次 ∕ 系统轮不扫）∥ `session-slots.mjs:180` 恢复剥离）∥ **批 C**（词面 `renderer/i18n-views.mjs:52/:196`（U-A 逐字）+ `chat-guide.mjs:36` 登记句收正；**文档面 27 处**——#69 在册：KD-51 ∥ §4.1 族 ∥ UI.md 行内指针 + 本批注 ∥ CORE-UNIFICATION #183 两半 ∥ WEBVIEW N-W6 并列注）。
- **批内件（归档）**：`docs/batches/2026-09-29-missing-face-family.test.mjs`（349 行 · **父侧收位 ✓**）——复跑读数附下。
- **验证**：9/9 腿绿（#68 在册）；doc-check 本批写域零新增红；**行数面差异 4 ⇒ 0**（#69 回填闭合）；F-W15 锚修复 = 父侧另笔（悬空 161 ⇒ 160 ✓）+ 需求档 F-W15 行收正（口径先裁 = A 已落）。
- **集成面**：**不新增**（批内件形）。
- **结算同步清单**：① 角色表 ✓ ② 状态行 ✓ ③ 计数 ✓ ④ 指针 ✓ ⑤ changelog ✓（四档）⑥ **台账勾销：#632 → 已核销**（两步）⑦ 前批遗留交叉核：`enddiff-clearance` 转批（#632）承接 ✓。
- **遗留（显式）**：GUI 真机腿（父侧探针）∥ `chat-guide.mjs:26` 注释残（入 #647）∥ `turn-driver.mjs` 299 贴层入列（已登记 §4.1）。
- **收口结论**：本批终止。
