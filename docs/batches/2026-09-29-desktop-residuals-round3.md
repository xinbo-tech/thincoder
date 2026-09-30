# 2026-09-29 · desktop-residuals-round3（桌面残余三轮：注释死指针 ∥ 流程面裁 ∥ 设置面残 ∥ relay 对齐）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-29 · 来源 = 挂账族集中处置（用户 2026-09-29 16:52 + 16:56「归批型的那些为啥不处理掉」）——桌面残余三轮载体：台账 #539 ∕ #541 ∕ #543 ∕ #581 ∕ #599 ∕ #610 ∕ #611 ∕ #613 ∕ #615 ∕ #617 ∕ #618。。
> 台账 = #539 ∕ #541 ∕ #543 ∕ #581 ∕ #599 ∕ #610 ∕ #611 ∕ #613 ∕ #615 ∕ #617 ∕ #618（桌面 · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-29
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 本批（父侧 · 2026-09-29 16:5x）

- **来源** = 挂账集中处置令（16:52 + 16:56）；授权 = 13:52 全权（代点火 + 代批准）。
- **条目（11 行）**：**#539**（renderer 注释死指针清扫——`chat-composer.css:61` `.rail-row` 族，届盘全树同扫）· **#541**（digest-cap 面缺——VSC 对位 `base.css:237-247`）· **#543**（撞帽询问待答期 ↑Ctrl+I 携消息语义定形——设计轮给裁定）· **#581**（段 14「窗内提示态」未落——statusline 面）· **#599**（relay 内容 chunk 边界差——desk∥VSC 对齐，跨端差异默认消）· **#610**（「流内」注记三处收正：`app.mjs:59 ∕ mount-composer.mjs:29 ∥ store.mjs:58`）· **#611**（PATH-node 两处待勘：`shared.mjs:247 ∕ verify.mjs:202`；fuse 前提登记归父侧发布面）· **#613**（composer `lastEcho` 单槽竞态）· **#615**（设置面两残：S3 failure 分档登记 ∥ 改钥失败径草稿种子）· **#617**（CH 读面收窄 ∥ CJ 错误面保留出路）· **#618**（S13 残余三处 `****` 收编核 `MASKED` ∕ 判据改述）。
- **边界**：`i18n.mjs` 零触（#5 拆批在飞）；`i18n-views.mjs` 可触（#618 值面）；真机腿 = 父侧探针（Playwright 在位）。
- **授权口径**：设计 = eng-designer；实施 = eng-coder（评审 + 代签 §4 + token 后）；#617 两裁在册（读面收窄 ∥ 保留出路）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（11 行全覆盖 · 27 档 · 修订轮 1 ∕ 2（评审 #26 ∕ #56 处置）· 记录面收尾注（#70 四点）· 四波分批 · 裁定项 R-1..R-7 · 波 D 登记 + 实施后文档面随动（§2.13 · 2026-09-29））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 覆盖与口径

- **覆盖 = 11 行**：#539 · #541 · #543 · #581 · #599 · #610 · #611 · #613 · #615 · #617 · #618。无空值行。
- **本轮写面** = 本档 §2（唯一落笔）。**产品码零改动**。设计档随动清单在 §2.7（待 §3/§4 后同轮落 —— 评审对象冻结于本档，D5）。
- **实读口径**：全部 as-of 2026-09-29 届盘实读（含四路只读勘察），坐标已按现盘校正；台账族记坐标的漂移逐条列于 §2.6。
- **禁止面遵守**：`renderer/i18n.mjs` 零触（#614 拆批在飞）；他批在飞文件零触；无顺手扩面（本席扩入项一律标注 `〔扩入〕`，请评审裁）。

### 2.2 逐行设计（现行 ⇒ 应然 ⇒ 判据）

#### #539 · renderer 注释死指针清扫（`.rail-row` 族 · 届盘全树同扫）

- **现行（实读 · 活指针 6 处 / 5 档）**：
  ① `renderer/chat-composer.css:38`「沿 `.rail-row:focus-visible` 先例」（该族随 R13-A 退场；`renderer/**` 对 `.rail-*` 零活定义，本处为唯一命中）。
  ② `renderer/views/chat.mjs:32`「接线两态沿 `renderer/views/sessions.mjs:161` 通则」（该档已不在盘）。
  ③ `renderer/views/chat-tool.mjs:49` 同 ②（台账族记 `:46` ⇒ 现盘 `:49`）。
  ④ `renderer/views/settings.mjs:15`「`renderer/views/info-row.mjs`」（该档已不在盘）。
  ⑤ `renderer/views/settings.mjs:314`「`views/onboarding.mjs` / `views/info-row.mjs` 两挂载共用本表」（后者不在盘）。
  ⑥ `renderer/settings.css:9`「`views/info-row.mjs`（信息行）」∥ `:10`「变量单源 = `styles.css` `:root`」（`styles.css` 随 R13 四拆退场）。
  已消：`chat-copy.mjs:12`（该档不在盘 ⇒ 无指针可改）。
- **应然（最小改动 · 逐处改锚活面）**：⑥a/① `.rail-row:focus-visible ⇒ .session-item:focus-visible`（活件 `renderer/session-list.css:42` 同三值先例）；
  ②/③ `views/sessions.mjs:161 通则 ⇒ views/chat-tool.mjs`（两态原语单源 = `wire` ∕ `withKey`，`chat-tool.mjs:49-59`）；④/⑤/⑥b `info-row.mjs ⇒ renderer/mount-info.mjs`（在盘）；
  ⑥c `styles.css :root ⇒ theme.css :root`（变量单源现位）。零语义 · 零行为。
- **判据（机判）**：逐处断言新锚在盘（6 断言）+ `renderer/**` 引注式扫（`沿 `.rail-row`` ∕ `views/sessions.mjs:` ∕ `views/info-row.mjs` ∕ `chat-copy.mjs`）= 零命中。
- **不动（判为合规 · 逐条报告）**：`src/main/window.mjs:36` ∕ `:47` 对 `styles.css` 的**显式退场历史注**（自载「R13 四拆退场 ⇒ 落现盘主题档」）；`theme.css:1` ∕ `chrome.css:2` ∕ `skin.css:1` ∕ `settings.css:2` 的四拆**血脉句**（「自 X 四拆」= 沿革非活指针）。
- **落点**：`renderer/chat-composer.css` · `renderer/views/chat.mjs` · `renderer/views/chat-tool.mjs` · `renderer/views/settings.mjs`（2 处）· `renderer/settings.css`（2 处）—— 5 档 6 处。

#### #541 · 流尾 digest-cap 面缺（对位 VSC 四层）

- **现行（实读 · 桌面四层同缺）**：发射 `src/main/suspension-drive.mjs` 仅 `:167` `start` ∕ `:177` `end`（无 cap）；归约 `renderer/events-wake.mjs:44-60` `onDigest` 仅 `start` ∕ `end` 两支（表外 `status` 零写）；节点 `renderer/views/chat-chrome.mjs:51-55` `digestGroupNode` 仅标签行 + 计数行；类 `renderer/chat.css:274-302` 零 `.digest-cap`。
- **VSC 对位件（实读）**：发射 `src/extension/panel-callbacks.mjs:82-84` `postDigestCap(panel, mode, turns)` ⇒ `{type:"digest", status:"cap", mode, turns}`；唯一调用点 `panel-turn-loop.mjs:251`（`"stop"`，ContinueError 支）；
  webview 支 `webview/chat-status.js:97-105`（cap 行 · `mode==="stop"` ⇒ `digest-cap-stop`）；类 `webview/base.css:248-258`；
  词 = 核 `thincoder-core/i18n.mjs:42-43`（`digest.capAuto` ∕ `digest.capStop` —— 桌面 `t()` 可直取，**零新键**）。
- **应然（最小改动 · 四层对位）**：
  ① **发射**：`src/main/turn-face.mjs` ContinueError ∧ 消化轮支（`:110-111`）落 cap 帧 —— `post("ev:digest", { key, status: "cap", mode: "stop", turns: err.turn })`；
  判定点 = 该支已据 `opts` 分档且 `post` 在本档作用域内 ⇒ **零新注入缝**。**轮类判定 = `opts.autoTurn === true && opts.timerTurn !== true`**
  （timer 轮不冒充消化边界 —— 沿 `suspension-drive.mjs:139-140` 在册判据）。
  ② **归约**：`onDigest` 加 cap 支（记 `{ status: "cap", mode, turns }`；`end` 清 —— 沿现式）。
  ③ **节点**：`digestGroupNode` 组尾加 cap 行（锚 `data-digest-cap`），行文 = `t(mode === "stop" ? "digest.capStop" : "digest.capAuto", { turns })`。
  ④ **类**：`chat.css` 补 `.chat-digest .digest-cap` ∕ `.digest-cap.digest-cap-stop`（逐值对位 `webview/base.css:248-258`；`--fg-muted` ∕ `--warn` 角色对位）。
- **判据**：**机判** = ①归约臂（批次件：cap 帧 ⇒ 切片 `{status:"cap",mode:"stop",turns}`；`end` ⇒ 清）②节点臂（`digestGroupNode({status:"cap",mode:"stop",turns:3})` ⇒ 含 `[data-digest-cap]` 且行文 = `digest.capStop` 投影）③样式臂（`chat.css` 两规则在盘）。**人工读回** = 撞帽后流内出现 cap 行（真机 · D16 探针）。
- **落点**：`src/main/turn-face.mjs` · `renderer/events-wake.mjs` · `renderer/views/chat-chrome.mjs` · `renderer/chat.css`（4 档）。
- **登记观察**：`mode:"auto"` **双端均无产出方**（VSC 唯 `"stop"` 调用点；core `digest.capAuto` 键在册未用）⇒ 渲染面两分支按单一源逐字镜像，不裁死。

#### #543 · 撞帽询问待答期 ↑Ctrl+I 携消息（语义定形 —— 裁定 A）

- **现行（实读）**：撞帽询问 = `turn-face.mjs:110-117` ContinueError 支（用户回合径；`autoTurn` 档 `:111` 直接收口，无询问）；询问本体 = `askContinue`（`turn-driver.mjs:82-83` ⇒ `askQuestion(key, "Agent reached N turns (limit). Continue from here?", ["Continue","Stop"])`）。
  待答期 ↑Ctrl+I 携消息 ⇒ `interrupt`（`turn-driver.mjs:237-246`）⇒ `controller.abort({ interrupt: true, message })` + `denyGates(key)`（`:244`）⇒ 询问按取消结算 ⇒ `:113` 返回 `"stopped"`；
  abort 载荷的 `message` **零消费者**（`turn-face.mjs:103-107` resume 支仅在 `run` 抛 AbortError 时达，本态停在 gate await，已离 `run`）⇒ 文本**零入队 ∕ 零历史 ∕ 零落盘**。
- **应然（裁定 A —— 用户输入零丢失）**：`:113` 拒结算处读本代 `live.signal.reason`；命中 `{ interrupt: true, message: 非空串 }` ⇒ 该消息入**宿主忙态队**（`queued.add(key, { text, ts })` + `chain.postQueue(key)` 出镜），再返回 `"stopped"`。
  消费 = 下一回合边界（忙态径同律）。接线形 = 新增注入缝 `onCapCancelled(key, message)`（缺省 ⇒ 零动作）—— `turn-face` 现仅持 `queuedPickup`（不直持 `queued`），缝住 `turn-driver` 装配点。
  零新面（复用 `queued-input` + `ev:queue` 现镜面）。
- **判据**：**机判** = 批次件：假 `askContinue`（悬挂不 resolve）+ 假队列 ⇒ 驱动 `interrupt(key, "msg")` ⇒ 断言 `queued.add` 收到 `"msg"` ∧ 回合结算 = `"stopped"`；反例 = `message` 空 ⇒ 零入队（裸停语义保持）。
- **落点**：`src/main/turn-face.mjs` · `src/main/turn-driver.mjs`（2 档）—— **须 §4 裁定后落**（见 §2.5）。

#### #581 · 段 14「窗内提示态」未落（statusline 面）

**转出注（附 A 裁定 · 父侧 2026-09-29 17:1x · §4.2）**：本行已转出 —— 唯一载体 = `desktop-rebuild-fidelity`（RF 波 5 已按 RF 形实施）；本段文本 = 转出前留档，非本批工单；§2.4 波 B 行内 #581 及同两档同随转出（防双批二次改）。

- **现行（实读）**：段 14 = `renderer/views/statusline-segments.mjs:215-224` `enterSegment(pending, key, codes)` 三态 —— 队 ≥ 1 ⇒ `status.queue.n`；`codes.includes("running")` ⇒ `status.queue.enter`；余 ⇒ `status.enter.send`。
  **无 `susp` 入参** ⇒ 窗在场 ∧ 非忙 ∧ 队空 ⇒ 出 `Enter: send`，与「窗内 Enter = 入队」（`turn-driver.mjs:172-173` `suspension.pushInput`）不符。
  切片在位：`statusline.mjs:68` `susp[active]`（写者 `events-wake.mjs:30-38`）。
- **应然（最小改动）**：`enterSegment` 增第四参 `suspActive`；中间态判据改 `codes.includes("running") || suspActive === true` ⇒ `status.queue.enter`（**三态数不变** —— 窗态复用忙态句，零新词 · 零新态）；`statusline.mjs` 调用点传 `susp[active]?.active === true`。
- **判据**：**机判** = 批次件四向量（队≥1 ∕ 忙 ∕ 窗静 ∕ 全静 ⇒ 四输出逐值）。**人工读回** = 窗在场静息期段 14 出「Enter 排队」（真机可选）。
- **落点**：`renderer/views/statusline-segments.mjs` · `renderer/views/statusline.mjs`（2 档）。
- **台账判据改述**（见 §2.6 F3）：台账原判据「按 VSC 逐点对齐」**不成立** —— VSC 无 enter 提示段（`webview/status-bar.js:17-83` 段序列零 enter 段、`status.enter.send` 全 VSC 树零命中）；
  其窗通知 = `status-bar.js:66/:75`（`S._suspended` ⇒ `⏳` 句），桌面**已有同族**（段 3 挂起句 `statusline-segments.mjs:89` ∕ `:54-61`）。本行判据按「既有三态自身语义自洽（窗内 Enter = 入队 ⇒ 提示句须言入队）」定形。

#### #599 · relay 内容 chunk 边界差（desk ∥ VSC）

- **现行（实读）**：桌面 = `src/main/agent-bridge.mjs:151` **单判** `isRelayToken(text)` 真 ⇒ `:152` `relayEventToSubPatch` ⇒ `:156` `if (patch) sub(patch)` ⇒ `:157` `return true` **无条件消费**（patch = null 静默吞，零复核、不外发）。
  VSC = `src/extension/panel-subagent-relay.mjs:91-109` 三件 —— 快筛 `:93` + rc patch `:94-99` + **null 复核 `:107-108`**（`relayPathOf(text).rest` 起于 `⟦ev⟧` ∕ `[model]` ⇒ 已消费；否则 ⇒ 非本面）⇒ 落内容面（`panel-callbacks.mjs:139` ⇒ `relaySubContentChunk` ⇒ `emitToolPanel`）。
  差例（rc 分类实读）：`"eng-coder#2/text with ⟦ev⟧ inside"` ⇒ `isRelayToken` 真 ∧ patch null ∧ 内容面非 null ⇒ **桌面吞 ∕ VSC 转内容面**（B7 在册 `docs/batches/2026-09-29-parity-b7-minor.md:468`；批内件 `:83` ∕ `:248` 存证）。
- **应然（最小改动）**：`agent-bridge.mjs:151-157` 补 **null 复核** —— patch 为 null 时以 `relayPathOf(text)` 复核 `rest` 前缀；命中 ⇒ 消费（零载荷，现行为保持）；**未命中 ⇒ 不消费**，落本档内容面径（`:161` `subChunkOf("text", text)` ⇒ `chunkOut`）。与 VSC `:107-108` 逐字同判。**不同笔换接** rc `relaySubContentChunk`（见 §2.6 F7）。
- **判据**：**机判** = 批次件以 `createBridge` 假桥驱动 `bridge(key).onToken("eng-coder#2/text with ⟦ev⟧ inside")` ⇒ 出 `ev:subchunk`（现盘 = 零输出 ⇒ 红）；对拍同向量 VSC 判（内容面）⇒ 两端同判。
- **落点**：`src/main/agent-bridge.mjs`（1 档）。

#### #610 · 排队消息「流内」注记收正

- **现行（实读 · 活残留 2 处，非 3）**：`renderer/mount-composer.mjs:29`「…⇒ `pending` 切片 ⇒ **流内**待发送气泡组 + 帧尾核…」· `renderer/store.mjs:59`「读面 = **流内**待发送气泡组（输入区上方）/ 状态行段 14」（台账族记 `:58` ⇒ 现盘 `:59`）。台账所列 **`app.mjs:59` 已零命中**（该档对 `流内` ∕ 待发送 ∕ 气泡 ∕ pending 全零）⇒ 随他轮已消。
- **同机制同族残留 〔扩入 · 待裁〕**：`renderer/frame-dispatch.mjs:21`（「`pending`：流内待发送气泡组」）· `renderer/store.mjs:60`（「用户排队消息改住流内 —— 右列「队列」族不再承载」）· `renderer/views/pool-tree.mjs:125`（「排队消息改住流内 `pending`」）。
- **不错（正确用法 · 零动）**：`views/chat.mjs:8` ∕ `mount-composer.mjs:33` ∕ `:148` ∕ `:157` ∕ `events-slices.mjs:99` —— 「消费前流内零真块」「交付时刻才入流」指**流本身**，与「输入区上方带」不抵。
- **应然**：待发送面一律称「**输入区上方待发送带**」（组名 = 待发送组）；`store.mjs:60` ∕ `pool-tree.mjs:125` 的「改住流内」⇒「改住输入区上方待发送带（`pending` 镜面）」。零行为（注释级）。
- **判据**：**机判** = `renderer/**` 中「流内待发送」零命中 ∧ 改述处各含「输入区上方」。
- **落点**：`renderer/mount-composer.mjs` · `renderer/store.mjs` · `renderer/frame-dispatch.mjs` · `renderer/views/pool-tree.mjs`（4 档）。

#### #611 · execute 修复的邻类前提（PATH-node 两处待勘 + fuse 前提登记）

- **现行（实读）**：两处 **PATH-`node`** 启动 —— ① `thincoder-core/tools/shared.mjs:247` `execFile("node", ["--check", abs], …)`（`autoSyntaxCheck` —— 编辑工具成功径）；
  ② `thincoder-core/agent-tools/verify.mjs:202` `runCommand("node", ["--check", f], …)`（验证工具「建议语法提示」段，`:193-195` 自载「不门禁」）。
  前提类与 #602 修复（`process.execPath` + `ELECTRON_RUN_AS_NODE`）**不同** —— 本两处走 **PATH 解析**。
- **可达性（实读推断 · 实勘腿见下）**：核在桌面宿主进程内运行 ⇒ 两处**均可被触达**；dev 盘 node 在 PATH ⇒ 现态成立；打包态取决于安装器 PATH（**不可判**，须登记）。
  `hooks` ∕ `mcp` ∕ `lsp` 配置命令面（同「PATH 解析」类）另在册 —— 本批不射程。
- **应然（只勘 ∕ 只登记 —— 零行为变更）**：
  ① **实勘腿**（批次件 · 可执行证据）= 以清空 `PATH` 的子环境驱动两处调用 ⇒ 断言「node 不可解析 ⇒ 假失败 ∕ 假『已标红』两形逐字复现」（两形见 §2.6 F7）；
  ② **登记腿** = 两项随本批档在册：**PATH-node 前提**（两处 + 失败形相抵）· **打包 fuse 前提**（`RunAsNode` 在线；现仓零 fuses 配置 ⇒ 现态成立；fuse 关闭 ⇒ #602 修复失效）；
  ③ **路由** = fuse 前提与 `hooks` ∕ `mcp` ∕ `lsp` 命令面归**父侧发布 ∕ 打包面**（本席只勘只报）；PATH-node 两处的行为修复**另裁**（本批禁修）。
- **判据**：**机判** = 探针件两断言（两形逐字）；**登记** = §2.6 F7 + §2.5 R-7 在册 ∧ 批档 §5 勘录。
- **落点**：零产品码改动（探针件 = `docs/batches/2026-09-29-desktop-residuals-round3.test.mjs`）。

#### #613 · composer-wire `lastEcho` 单槽竞态（对位轮裁）

- **现行（实读）**：`renderer/composer-wire.mjs:46` `let lastEcho = null`（单槽 `{ key, block }`）；`noteEcho`（`:210-212`）无条件覆写；`retractEcho`（`:217-227`）判据**仅** `target.key !== key` ⇒ 无「本尝试最新」守卫。
  竞态窗：滞后窗内双提交（A 后接 B）⇒ 槽 = B 块；A 的迟到回执（`sendDirect:79` ∕ `:88` ∕ `sendQueued:136` 三径）调 `retractEcho(key)` ⇒ 按引用摘除**同键当前块**（可能是 B）⇒ 退流错摘 ∕ 同条双现。
  对照：同档 `inFlight`（`:48`）**已持**本键最新尝试令牌（#597 守卫单点）—— `retractEcho` 未接。
- **应然（最小改动 · 槽按尝试键控）**：`lastEcho = { key, attempt, block }`；`noteEcho(key, block, attempt)` 携尝试令牌（调用面 = mount 侧 `onUserEcho` 回调，令牌取 `inFlight.get(key)`）；`retractEcho(key, attempt)` 判据加 `target.attempt !== attempt` ⇒ 零动作。缺令牌调用（旧面）⇒ 退化现行为（不静默变严）。
- **判据**：**机判** = 批次件：假 `call` 双悬挂 ⇒ 提交 A、提交 B（B 后到）⇒ 结算 A 失败 ⇒ 断言 B 块**仍在序**（现盘 ⇒ 红）；反例 = 单提交失败 ⇒ 块退流（现行为保持）。
- **落点**：`renderer/composer-wire.mjs`（本体）+ `renderer/mount-composer.mjs`（调用面）（2 档）。

#### #615 · 设置面两残（S3 failure 分档 ∥ 改钥失败径草稿种子）

**① S3 行面缺 VSC `failure` 分档（端差登记）**

- **现行（实读）**：桌面行面仅 `available` ∕ `unavailableReason` **两键**（`src/main/providers.mjs:105-107`）；失败面 = `renderer/views/settings-sections.mjs:75-77` **两独立节点**（无任何抑制判据）；
  词表 `renderer/views/settings.mjs:49-64` `REASON_WORD` 无 busy 档；探针分档 `providers.mjs:242` 把 `hostBusy` 并入 `malformed`（`:232-233` 自述）；
  宿主忙采样器 **零命中**（`loop-sampler` ∕ `window_ms` ∕ `busy_lag` ∕ `sample_interval` @ 桌面树 = 0；`hostBusy` 产品码仅 `providers.mjs:232-233` 一句注释）。
- **VSC 对位件（实读）**：`src/extension/loop-sampler.mjs:67-69` `probeFailureOf` + `:73-76` `overrideAdmissionIfHostBusy`；行面 `failure` 键随载荷（`settings.mjs:89`）；渲染两档 + **抑制句**（`webview/settings-providers.js:189` ∕ `:192`）；核分类 `thincoder-core/provider/list-models.mjs:118-129`（`hostBusy` 不由核判）。
- **应然（裁定：登记 + 解路 + 到期 —— 非就地实现）**：消除需三件，其一**受阻**：①新采样器档 `src/main/loop-sampler.mjs`（port ≈45 行）；②行面 `failure` 键贯链（`providers.mjs` → 通道 → 渲染）；
  ③**新词键** —— 词载体 `renderer/i18n.mjs` 现 **394 行**且 #614 拆批在飞（本批 §1 明令零触）⇒ **词面无载体**。
  登记须携：**解路** = 拆批落定后随下一桌面设置面轮实现三件；**到期** = #614 拆批收口 ∥ 下一设置面轮。**不作永久先例**（消除才合规 —— 见 §2.6 F4）。
- **判据**：本批 = **登记在册**（本档 + 台账行 —— 台账笔权在父侧）；实现轮预告判据 = 同宿主忙态下两端行面**同词 + 同抑制形**。
- **落点**：零产品码改动。

**② 改钥失败径丢行内输入（草稿种子缺）**

- **现行（实读 · 链路四点闭合）**：提交处从 DOM 现读值（`renderer/mount-settings-segments-providers.mjs:45-46`）；失败径只落 notice 且 `edit` **不复位**（`:52-54`）；notice 写切片（`renderer/mount-settings.mjs:86`）⇒ `SETTINGS_KEYS`（`:36`）命中 ⇒ `paintSettings`；
  `renderer/views/settings.mjs:326-334` `clear(root)` + 整树重建；行内输入描述符**无 `value` 种子**（`renderer/views/settings-sections.mjs:99`）⇒ 已键入文本丢失；
  （`draft` 只喂自定形新增表单：`settings-controls.mjs:74-76` 的 `shape === "custom"` 门）。
- **应然（选定 A · 草稿种子 —— 沿 `draft` 先例）**：`providers` 切片增 `keyDraft`（形 `{ name, value }` ∕ `null`）；失败径写 `keyDraft = { name: row.name, value: typed }`（`typed` = 提交处现读值，同点）；
  `keyControls` 编辑态输入以 `value: deps.keyDraft?.name === row.name ? deps.keyDraft.value : undefined` 为种子；
  成功 ∕ 取消 ∕ 开面 ∕ 关面四处复位（`renderer/mount-settings-exits.mjs:179` ∕ `:193` 同点）。
  **为何不选 B（失败串就地不重绘）**：须造第二条 notice 写径（绕描述符树单写径）⇒ 与「设置面 = 描述符树单写径」相抵且造第二实现；A 沿在册先例、单径不变。
- **判据**：**机判** = 批次件：编辑态键入 ⇒ 失败回执 ⇒ 重挂后输入仍为所键入文本；成功径 ⇒ 零种子残留。**人工读回** = 真机可选（D16）。
- **落点**：`renderer/store.mjs` · `renderer/views/settings.mjs` · `renderer/views/settings-sections.mjs` · `renderer/mount-settings-segments-providers.mjs` · `renderer/mount-settings-exits.mjs`（5 档）。

#### #617 · B10 上抛两裁落地（CH ∥ CJ）

**CH · `agent.engineering` 泛化行读面收窄**

- **现行（实读）**：读面 = `agentFields` 展平全档（`src/main/settings-values.mjs:66-73`）⇒ 该键出行；泛化行渲染 `renderer/views/settings-agent.mjs:138-160`（`editable = 非敏感 ∧ kind ∈ {string,number,boolean}` ⇒ 复选框在场 `:142-152`）+ 段尾保存钮 `:222-226`；
  写面 `src/main/settings.mjs:160` `SLOT_AUTHORITY_PATHS` + `:294-297` 拒 `slot-authority`。**邻键对照**：`agent.advisor.guard` 走具名控件（`kind:"guard"`，写径 = `session:flags`，`mount-settings-segments-agent.mjs:120-143`）；
  该键读面**不是**假可供性（写径本就正确）；`agent.engineering` 无对应具名控件 ⇒ 只剩泛化行。
- **应然（落裁「读面收窄」）**：泛化行渲染**排除 `SLOT_AUTHORITY_PATHS`** —— 两键在泛化面呈**只读**（出值 + 既有词键 `settings.reason.slotAuthority`（`renderer/i18n-views.mjs:187` ∕ `:330`，值 = 「会话级选项——请从输入面板修改」）作提示，**零控件、不入提交 patch**）。写面拒码保留（防御面：非本面调用者仍可触）。**零新词**。
  **可供性零损失**：会话槽真开关在位 —— 输入区 `setEngineeringEnabled`（`renderer/composer-wire.mjs:202` ⇒ `session:flags`）+ 状态行段 1 `eng` 位标（`renderer/views/statusline-banner.mjs:14` ∕ `:20-24`）。
- **判据**：**机判** = 批次件：`agentFields` 含 `agent.engineering` ⇒ 泛化行出**零 `input`** ∧ 段尾 patch 不含该 path；反例 = 普通布尔键仍可编辑。
- **落点**：`renderer/views/settings-agent.mjs`（1 档；若投影需扩 `deps` 则并 `renderer/views/settings.mjs`）。

**CJ · R1 `error` 面保留设置出路**

- **现行（实读）**：`error` 态层 `layer.dataset.state = "error"` + 原因段落在场，**不撤层**（`renderer/app.mjs:205-213`）；层全窗（`renderer/chrome.css:286` `position: fixed; inset: 0; z-index: 200`）**高于**设置面（`renderer/settings.css:13-16` z-index 10）⇒ 设置面「**被盖住**」而非未装配（装配面模块级已完成 `app.mjs:248-299`）；
  层内零控件 ∕ 零出路；档面口径 = `docs/desktop/design/UI.md:31`（「档不可读 ⇒ 向导不进 · 容器空 + 设置面可进 + 明示不可读」）+ KD-12「不静默重置」。
- **应然（落裁「保留设置可进出路」· 错误面非模态）**：`error` 态层**非模态化** —— 载原因而不覆盖交互：`error` 态改**顶部横幅**（保留 `#boot-reason` 文本 + `data-boot="error"` 不变 ⇒ 冒烟判据零变），`ok` ∕ `loading` 两态**零改**（loading 仍全窗转轮）。⇒ 外壳 ⚙ 入口可点、设置面可进、原因可见；向导不进（`configured` 假时本就不进 —— 零改）。
- **判据**：**机判（探针）** = 真机态注入畸形档 ⇒ `data-boot="error"` ∧ Playwright ∕ `test/rc-resolve.mjs` 钩断言：设置按钮**可点** ∧ 设置面**可见** ∧ 原因文本在场 ∧ 向导槽空；反例 = `loading` 态仍全窗（转轮在盘）。**人工读回** = 真机（D16）。
- **落点**：`renderer/chrome.css` · `renderer/skin.css`（+ `renderer/app.mjs` 若须分层）。

#### #618 · S13 残余三处自持 `****`（裁定：判据改述 —— 不收编）

- **现行（实读）**：核 `MASKED` **已 export**（`thincoder-core/agent-tools/settings.mjs:20`「••••（masked）」）；桌面主进程**已收编**（`src/main/settings-values.mjs:15-18` `export const MASK = MASKED` —— B10 W1 落）；VSC 扩展面**已收编**（`src/extension/settings.mjs:18` ∕ `:80` `masked: configured ? MASKED : ""`）。
  残余三处自持：桌面 `renderer/i18n-views.mjs:148`（en）∕ `:292`（zh）`"settings.keySet": "****"`（消费点 = `renderer/views/settings-sections-tools.mjs:119`，`hasKey` 指示位）；VSC `webview/settings-tools.js:270`（websearch 行）∕ `:283`（embed 行）内联字面；`webview/settings-providers.js:44`（`s0.masked || "****"` 兜底）。
- **语义辨析（裁定依据）**：`settings-tools.js:270/283` 与桌面 `keySet` 三处 = **「已配」指示位**（`hasKey ? "****" : "—"` —— 不承载被遮值）；`settings-providers.js:44` = 真遮蔽值面 + 兜底。而**真遮蔽值面三端已逐字同**（核 `MASKED`）。⇒ S13 判据「三端遮罩字面逐字同」对**指示位面**不成立（该位无被遮值 ⇒ 非判据射程）。
- **应然（选定：判据改述 —— 消费核 `MASKED` 不作）**：
  ① **判据收正**为「**遮蔽值面**三端逐字同（核 `MASKED`）；**指示位面**各端自定」；
  ② 桌面 `renderer/views/settings-sections-tools.mjs:7` 注释「配置 ⇒ `••••`」与实值 `****` **相抵** ⇒ 逐字收正为 `****`（注释级 · 零行为）；
  ③ VSC `settings-providers.js:44` 兜底 `"****"`：现形**不可达**（`configured` 真 ⇒ `masked = MASKED` 非空 ⇒ `||` 右支永不取）⇒ **保留为防御兜底 + 登记**（删除跨端档面无收益）。
  **为何不收编三处**：收编需浏览器面拿到核字面，而 ① 渲染面静态闭包禁 `node:` ∕ 裸包（核 `settings.mjs` 引 node 面）② 三处（两 webview + 一 renderer 字典）均无既有注入缝 ⇒ 另加 = 新通道，成本 > 一致性收益（**指示位**本非判据射程）。
- **判据**：**机判** = ①遮蔽值面三方取值 = `core.MASKED`（桌面主进程 `MASK` ∕ VSC 扩展 `masked` ∕ 核导出）—— 已由 B10 批落（`b10-w1w4.test.mjs:148-157` 三方齐）；② `settings-sections-tools.mjs:7` 载 `****`（注值一致）。
- **落点**：`renderer/views/settings-sections-tools.mjs`（1 行注释）+ 判据文本随动（§2.7 · VSC 侧不改码）。

### 2.3 受影响文件表（25 档 · 行数为设计轮实读）

| 档 | 行数（实读） | 涉及行 | 预期 Δ |
|---|---|---|---|
| `thincoder-desktop/renderer/chat-composer.css` | 49 | #539 | ±0 |
| `thincoder-desktop/renderer/views/chat.mjs` | 365 | #539 | ±0 |
| `thincoder-desktop/renderer/views/chat-tool.mjs` | 300 | #539 | ±0 |
| `thincoder-desktop/renderer/views/settings.mjs` | 335 | #539 · #615② | +1 |
| `thincoder-desktop/renderer/settings.css` | — | #539 | ±0 |
| `thincoder-desktop/renderer/mount-composer.mjs` | — | #610 · #613 | +2 |
| `thincoder-desktop/renderer/store.mjs` | 301 | #610 · #615② | +2 |
| `thincoder-desktop/renderer/frame-dispatch.mjs` | — | #610 | ±0 |
| `thincoder-desktop/renderer/views/pool-tree.mjs` | — | #610 | ±0 |
| `thincoder-desktop/renderer/composer-wire.mjs` | 230 | #613 | +6 |
| `thincoder-desktop/src/main/agent-bridge.mjs` | 333 | #599 | +6 |
| `thincoder-desktop/src/main/turn-face.mjs` | 141 | #541 · #543 | +8 |
| `thincoder-desktop/src/main/turn-driver.mjs` | 288 | #543 | +5 |
| `thincoder-desktop/renderer/events-wake.mjs` | 71 | #541 | +6 |
| `thincoder-desktop/renderer/views/chat-chrome.mjs` | — | #541 | +4 |
| `thincoder-desktop/renderer/chat.css` | 312 | #541 | +12 |
| `thincoder-desktop/renderer/views/statusline-segments.mjs` | 198 | #581 | +3 |
| `thincoder-desktop/renderer/views/statusline.mjs` | — | #581 | +1 |
| `thincoder-desktop/renderer/views/settings-agent.mjs` | 120 | #617-CH | +6 |
| `thincoder-desktop/renderer/chrome.css` | 444 | #617-CJ | +3 |
| `thincoder-desktop/renderer/skin.css` | 13 | #617-CJ | ±0 |
| `thincoder-desktop/renderer/views/settings-sections.mjs` | 298 | #615② | +2 |
| `thincoder-desktop/renderer/mount-settings-segments-providers.mjs` | — | #615② | +4 |
| `thincoder-desktop/renderer/mount-settings-exits.mjs` | 274 | #615② | +2 |
| `thincoder-desktop/renderer/views/settings-sections-tools.mjs` | 162 | #618② | ±0 |

- 「—」= 设计轮未逐档读取计数 ⇒ **实施轮届盘重跑为准**（本表 = 设计轮快照，可能再漂）。
- **越 300 顾问线档（本批触碰）**：`views/chat.mjs` 365 · `agent-bridge.mjs` 333 · `chat.css` 312 · `chrome.css` 444 ⇒ **本批零拆**（结构轮债，登记 —— §2.8）。
- **测试面**：批内件 = `docs/batches/2026-09-29-desktop-residuals-round3.test.mjs`（随批档，收口后归档）；核 ∕ 端既有套件零改。

### 2.4 实施分批（建议 —— 27 档 > 15 ⇒ 拆批）

四波（波间可独立验收）：

| 波 | 行 | 档数 | 性质 |
|---|---|---|---|
| **A · 注释面** | #539 · #610 · #618② | 10 | 零行为（注释 ∕ 引注） |
| **B · 行为面小件** | #541 · #581 · #613 · #599 | 9（含重复 2） | 零新通道 · 零新词 |
| **C · 设置面** | #617-CH · #617-CJ · #615② | 10（含重复 2） | 含真机探针腿 |
| **D · 勘 ∕ 登记 ∕ 裁定** | #611 · #615① · #543 | 1（+1 重复） | 零产品码；#543 须 §4 裁定 |

**转出注**：波 B 行内 #581 及同两档（`renderer/views/statusline-segments.mjs` ∕ `renderer/views/statusline.mjs`）已转出至 `desktop-rebuild-fidelity`（§4.2 · 附 A · 父侧 2026-09-29 17:1x；RF 波 5 已按 RF 形实施）—— 本表行 ∕ 档数照转出前快照录。

- **推荐**：单批内四波（一波一验收）；若父侧要求单批 ≤ 15 档 ⇒ **拆为 R3-A（波 A+B）／ R3-B（波 C+D）** 两批，共用本档 §2 与 §3 结论。**唯一档数合计 = 27**（§2.3 表；波列表含跨波重复）。
- **实施序约束**：波 D 的 #543 须待 §4 裁定；#611 的勘腿可先跑（零依赖）。

### 2.5 裁定项（供 §3 复核 ∕ §4 批准）

| # | 行 | 裁定 | 依据 | 状态 |
|---|---|---|---|---|
| R-1 | #543 | **A**：待答期携文 ⇒ 入宿主忙态队 + 回合判 `stopped`（用户输入零丢失） | 忙态径同律；VSC 同族（`chat-panel.mjs:374-388` 窗内 Enter 入队） | **须 §4 用户口径** |
| R-2 | #541 | **补面**（对位 VSC 四层；非「另轮登记」） | 跨端差异默认消；面缺非形差；VSC 单源四件在盘 | 须 §4 确认工作量归属（本批实施 ∥ 另轮） |
| R-3 | #618 | **判据改述**（不收编三处） | 指示位面无被遮值（非判据射程）；收编需新通道 | 须 §3 ∕ §4 复核 |
| R-4 | #617 | 两裁**已在册**（CH 读面收窄 ∥ CJ 保留出路）⇒ 本席只定形，无需再裁 | 批档 §1.1 + `docs/desktop/design/PROJECT.md:1087` ∕ `:1089` | 已裁 |
| R-5 | #615① | **登记 + 解路 + 到期**（非就地实现） | 词面载体 `i18n.mjs` 394 行 ∧ #614 在飞 ⇒ 零载体（见 §2.6 F4） | 须 §3 ∕ §4 复核 |
| R-6 | #610 | 扩入同族三处（`frame-dispatch.mjs:21` · `store.mjs:60` · `views/pool-tree.mjs:125`） | 同机制同形（「待发送带」称「流内」）⇒ 只修两处则缺陷仍立 | 须 §3 裁留 ∕ 去 |
| R-7 | #611 | 只勘 ∕ 只登记（零行为）；fuse 前提与 `hooks` ∕ `mcp` ∕ `lsp` 命令面路由**父侧发布 ∕ 打包面** | 前提类不同（PATH 解析 ≠ `execPath`）；打包态 PATH 不可判 | 须 §4 确认路由 |

### 2.6 报告项（逐条 · 含「本批非阻断」观察）

- **F1 · #539 台账族记漂移**：族记 6 处 ⇒ 届盘 **5 处活指针**（`chat-copy.mjs` 档已不在盘 ⇒ 无指针可改）；坐标漂移 `chat-composer.css:61 ⇒ :38` · `chat-tool.mjs:46 ⇒ :49`。记录面按 as-of 记，不回改。
- **F2 · #610 台账族记核对**：族记三处 ⇒ 届盘 **2 处**（`app.mjs` 已零命中，随他轮消）；另同族三处（R-6）。
- **F3 · #581 台账判据不成立**：族载「按 VSC 逐点对齐」，而 **VSC 零 enter 提示段**（`webview/status-bar.js:17-83` 段序列无 enter；`status.enter.send` 全 VSC 树零命中）⇒ 判据已改述（§2.2 #581）。
- **F4 · #615① 「登记」与「跨端差异默认消」的口径关系**：族载「端差默认消；登记保留已废止」。本席以「登记 + 解路 + 到期」形落，法源 = 登记须携解路与到期（不留永久先例），且**受阻**（词面载器 394 行 ∧ #614 在飞）。**请 §3 ∕ §4 复核该判**。
- **F5 · #618 兜底不可达**：`webview/settings-providers.js:44` 的 `|| "****"` 现形**不可达**（`src/extension/settings.mjs:80`：`configured` 真 ⇒ `masked = MASKED` 非空）⇒ 保留为防御 + 登记（不触 VSC 码）。
- **F6 · #599 邻项（B7 设计 ⑧ 未落）**：桌面仍持**本地** `subChunkOf`（`agent-bridge.mjs:100`；全树对 rc `relaySubContentChunk` 零引用），而 B7 设计 ⑧（`docs/batches/2026-09-29-parity-b7-minor.md:234`）写「desk `subChunkOf` 删、改调核件」、B7 实施舱 C 只落 `summarizeArgs` 转口 ⇒ **设计 ∕ 实施差**。本批不动（零扩面），另裁。
- **F7 · #611 两处失败形相抵（勘得项）**：`thincoder-core/tools/shared.mjs:247` catch ⇒ 返回 `Syntax: FAILED — <err>`（node 缺失 ⇒ **假失败**）；
  `thincoder-core/agent-tools/verify.mjs:202` catch ⇒ 推 `⚠ <f> — node --check flagged it`（node 缺失 ⇒ **假「已标红」**）；
  而档内注 `:193-195` 自载「a missing node simply skips silently」——**注与行为相抵**。本批只勘 ∕ 只登记，零行为变更。
- **F8 · #541 `mode:"auto"` 无产出方**：VSC 唯 `"stop"` 调用点（`panel-turn-loop.mjs:251`），核 `digest.capAuto` 键在册未用 ⇒ 渲染面两分支按单一源逐字镜像，登记观察（不作死条裁）。
- **F9 · 设计档面同族死族（非 #539 射程）**：`docs/desktop/design/UI.md:150-158`（D21 九面表 `.rail-*` 类名族）与 `:241`（`.rail-row:focus-visible` 引注）仍在档 —— sweep 批已「列报待批」（`docs/batches/2026-09-29-desktop-residuals-sweep.md:109`）⇒ 本批零动，随设计面轮。
- **F10 · 超 300 行触碰档**：见 §2.3 注（5 档越线）⇒ 本批零拆，结构债在册。

### 2.7 设计档随动清单（待 §3 ∕ §4 后同轮落 —— 本席笔；本轮评审对象冻结于本档，D5）

| 档 | 落点 | 涉行 |
|---|---|---|
| `docs/desktop/design/UI.md` | §1 表行 14（段 14 中间态判据扩「窗在场」） | #581 |
| `docs/desktop/design/UI.md` | §1 设置面行（`agent.engineering` 泛化面只读 + 提示词键） | #617-CH |
| `docs/desktop/design/UI.md` | 首启向导行 / 错误面（`error` 态非模态 = 顶部横幅） | #617-CJ |
| `docs/desktop/design/RENDERER.md` | §1.1 消化组族（新增 cap 行 · 锚 `data-digest-cap`） | #541 |
| `docs/desktop/design/IPC.md` | §2 `ev:digest` 载荷表补 `status:"cap"` 三键；`ev:queue` 注补撞帽拒径入队 | #541 · #543 |
| `docs/desktop/design/PROJECT.md` | §10 CH ∕ CJ 两行状态收正（落定后转「已落」） | #617 |

### 2.8 本批不做（边界）

- **产品码零改动**（设计轮 —— 本档 §2 为唯一落笔）。
- `renderer/i18n.mjs` **零触**（#614 拆批在飞）；他批在飞文件零触。
- **不收编** `****` 三处（#618 裁定）；**不换接** rc `relaySubContentChunk`（F6）；**不修** #611 两处行为（只勘只登记）。
- **不拆档**（5 档越 300 线 —— 结构轮债）；**不动** UI.md D21 九面表死族（F9）。
- **不自行执行拆批**（§2.4 = 建议，须父侧裁）。

### 2.9 验收对照（本设计轮自检）

| 验收项 | 状态 |
|---|---|
| ① §2 覆盖 11 行（无空值） | ✅ #539 · #541 · #543 · #581 · #599 · #610 · #611 · #613 · #615 · #617 · #618 各有「现行 ⇒ 应然 ⇒ 判据 ⇒ 落点」 |
| ② 受影响文件表 + 实施分批建议 | ✅ §2.3（27 档）+ §2.4（四波 ∕ 拆批建议） |
| ③ 每行判据可机判或注明人工读回 | ✅ 11 行皆「机判」为主；#541 ∕ #581 ∕ #615② ∕ #617-CJ 另注真机人工读回 |
| ④ 零产品码改动 | ✅ 本轮只落本档 §2 |

### 2.10 修订轮 1（评审 #26 · §3 轮次 1 逐号处置 · 2026-09-29）

**缘起**：§3 轮次 1 = changes-required（🔴2 · 🟡3 · 🔵3）。本块 = 号 1–8 处置落文；**本块行文 = 修订后现行版本**（§2.2 ∕ §2.3 ∕ §2.4 ∕ §2.7 ∕ §2.8 ∕ §2.9 中与之相抵的行文 = 修订前版本，留档）；评审轮 2 以本块为准。产品码零改 · 他档零触 · §3 零改。

#### 号 1（🔴 · #541）机制重规格 —— 选形 A（扩门形：cap 行居组内；携 cap 者终态驻留）

- **选形依据（评审二择一之裁）**：① 评审臂句「cap ⇒ 组在场 ∧ 含 `[data-digest-cap]`」于组内形**逐字成立**；② 组内形**零新尾族成员** ⇒ `blockAnchor`（`chat-chrome.mjs:260-264`）与全族 `*AnchorOf` 锚链**零随动**（VSC 独立元素形须并改全尾族锚链约六处 —— 面更大）；③ **驻留为必设**：组为瞬态指示（在册「`end` ⇒ 先更新后摘除」—— `RENDERER.md:45` · idle-wake 批档 `:400`），而撞帽与 `end` 同链（`suspension-drive.mjs:177` finally 紧随 `turn-face` 收口）⇒ cap 行若随 `end` 摘除则人工读回仍不可达；VSC 对位件（`chat-status.js:97-105`）恰为驻留元素。驻留判据 = **携 cap 事实**（部分消化须见）—— 不携 cap 的 `end` 照旧摘除（现行为保持）。
- **现行版机制全文（取代 §2.2 #541 前文）**：
  - **发射**：`src/main/turn-face.mjs` ContinueError ∧ 消化轮支（`:110-111`）落 `post("ev:digest", { key, status: "cap", mode: "stop", turns: err.turn })`；轮类判定 = `opts.autoTurn === true && opts.timerTurn !== true`（timer 轮不冒充消化边界 —— 沿 `suspension-drive.mjs:139-140` 在册判据）。载荷形 = VSC 逐字（`panel-callbacks.mjs:82-84`）。
  - **归约**（`renderer/events-wake.mjs` `onDigest`）：cap 支新增 —— `record = { ...(prev ?? {}), status: "cap", cap: { mode: ev.mode === "stop" ? "stop" : "auto", turns: typeof ev.turns === "number" && Number.isFinite(ev.turns) ? ev.turns : null } }` ⇒ **并前片保 `n`**（免 `end` 行 `n=0`）；`end` 支现式（`{ ...(prev ?? {}), … }`）已并前片 ⇒ **cap 事实跨 `end` 存续**（零改）；下一轮 `start` 换代重写 ⇒ cap 事实清。
  - **两条门（扩）**：构树 `renderer/views/chat.mjs:135` 与帧尾 `renderer/views/chat-chrome.mjs:156-174` 在场判据由 `status === "start"` 扩为 **`start ∨ cap ∨（end ∧ 携 cap 事实）`**；携 cap 者 `end` 更新毕**不摘**（驻留）；不携 cap 者照旧摘除；缺席 ∧ 携 cap ⇒ 按终态构树（幂等自愈）。
  - **节点**：`digestGroupNode` 组尾加 cap 行（锚 `data-digest-cap`；`mode === "stop"` ⇒ 并 `.digest-cap-stop`；行文 = `t("digest.capStop", { turns })` ∕ `t("digest.capAuto")` —— 逐字对位 `chat-status.js:97-105`）；`equivalentDigest` 补 cap 行在场 ∕ 文面比对（幂等零写面随动）。
  - **类**：`renderer/chat.css` 补 `.chat-digest .digest-cap` ∕ `.digest-cap.digest-cap-stop`（值对位 `webview/base.css:248-258`；`--fg-muted` ∕ `--warn` 角色对位 —— `renderer/theme.css:11` ∕ `:47`）。
- **判据（帧尾通路臂 —— 非仅工厂单测）**：①归约臂（start(n=5) ⇒ cap ⇒ 切片含 `cap:{mode:"stop",turns:3}` ∧ **保 `n`=5**；`end` ⇒ 保 `n` ∧ 保 cap 事实；下一 `start` ⇒ cap 事实清）②**cap 帧尾臂**（`syncChrome`：组在场 ∧ 含 `[data-digest-cap]` ∧ 行文 = `digest.capStop` 投影 ∧ 计数行在）③**end 帧尾臂**（携 cap ⇒ 组仍在场 ∧ 计数行已更新为 `digest.done`（`n`=5 · 在位）∧ cap 行在；对照臂 = 不携 cap 的 `end` ⇒ 更新后摘除）④样式臂（两规则在盘）。**人工读回** = 撞帽后流内出现 cap 行且**驻留至下一轮**（真机 · D16 探针 —— 原判据按此增强）。
- **落点（5 档）**：`src/main/turn-face.mjs` · `renderer/events-wake.mjs` · `renderer/views/chat-chrome.mjs` · `renderer/views/chat.mjs` · `renderer/chat.css`。

#### 号 2（🔴 · #613）机制重规格 —— 提交侧认领 ∕ 落槽

- **现行版机制全文（取代 §2.2 #613 前文）**：
  - **序事实**：回声先行于上行 —— `thincoder-render-core/composer/panel.mjs:319` ∕ `:333`（`onUserEcho`）先于 `:321` ∕ `:341`（`post`）；尝试令牌诞生于 `renderer/composer-wire.mjs:66-67`（`sendDirect`）⇒ **令牌不得在 `onUserEcho` 读 `inFlight`**（该刻恒为上一提交令牌）。
  - **认领 ∕ 落槽（提交侧）**：① `noteEcho(key, block)` = **未认领登记**（`lastEcho = { key, block, attempt: null }` —— `:210-212`）；② `sendDirect` 于令牌诞生点（`:66-67`）补认 —— 未认领 ∧ 键同 ⇒ `lastEcho = { key, attempt, block: lastEcho.block }`（回声与上行同同步链相接 ⇒ 认领恒命中本提交）；`sendQueued` 不认领（该径零本地块 · 零 retract 调用 —— 现式 `inFlight.set(key, {})` 保留）。
  - **退流判据**：`retractEcho(key, attempt)`（`:217-227`）判据加 `target.attempt !== attempt ⇒ 零动作`；**调用面三处所传 = 本回执所在尝试的本地令牌**（`:78` ∕ `:88` ∕ `:95` —— 三径均在 `sendDirect` 内，`attempt` 直取；全树零外部调用者 ⇒ 不设旧面退化面）。未命中（槽被后提交覆盖 ∕ 未认领）⇒ **零动作**（诚实回归 —— 沿本档「块已不在序列 ⇒ 零写」先例）。
  - **落点收缩**：`mount-composer.mjs` **零改**（`noteEcho` 签名不变 · 认领径全住写面档）⇒ 落点 = `renderer/composer-wire.mjs`（1 档）。
- **判据**：**机判** = 批次件：假 `call` 双悬挂 ⇒ 提交 A、提交 B（各前置 `noteEcho` —— 回声先行真实序）⇒ 结算 A 失败 ⇒ 断言 B 块**仍在序**（现盘 ⇒ 红）；反例 = 单提交失败 ⇒ 块退流（现行为保持）。
- **落点**：`renderer/composer-wire.mjs`（1 档）。

#### 号 3（🟡 · 表与越线清单）届盘重跑重建 —— §2.3 现行版（27 档）

| 档 | 行数（届盘实读） | 涉及行 | 预期 Δ |
|---|---|---|---|
| `thincoder-desktop/renderer/chat-composer.css` | 49 | #539 | ±0 |
| `thincoder-desktop/renderer/views/chat.mjs` | 291 | #539 · #541 | +1 |
| `thincoder-desktop/renderer/views/chat-tool.mjs` | 300 | #539 | ±0 |
| `thincoder-desktop/renderer/views/settings.mjs` | 335 | #539 · #615② | +1 |
| `thincoder-desktop/renderer/settings.css` | 295 | #539 | ±0 |
| `thincoder-desktop/renderer/mount-composer.mjs` | 245 | #610 | ±0 |
| `thincoder-desktop/renderer/store.mjs` | 301 | #610 · #615② | +2 |
| `thincoder-desktop/renderer/frame-dispatch.mjs` | 56 | #610 | ±0 |
| `thincoder-desktop/renderer/views/pool-tree.mjs` | 175 | #610 | ±0 |
| `thincoder-desktop/renderer/composer-wire.mjs` | 231 | #613 | +4 |
| `thincoder-desktop/src/main/agent-bridge.mjs` | 319 | #599 | +6 |
| `thincoder-desktop/src/main/turn-face.mjs` | 141 | #541 · #543 | +8 |
| `thincoder-desktop/src/main/turn-driver.mjs` | 288 | #543 | +5 |
| `thincoder-desktop/renderer/events-wake.mjs` | 73 | #541 | +5 |
| `thincoder-desktop/renderer/views/chat-chrome.mjs` | 293 | #541 | +14 |
| `thincoder-desktop/renderer/chat.css` | 313 | #541 | +10 |
| `thincoder-desktop/renderer/views/statusline-segments.mjs` | 225 | #581 | +3 |
| `thincoder-desktop/renderer/views/statusline.mjs` | 206 | #581 | +1 |
| `thincoder-desktop/renderer/views/settings-agent.mjs` | 228 | #617-CH | +9 |
| `thincoder-desktop/renderer/chrome.css` | 288 | #617-CJ | +3 |
| `thincoder-desktop/renderer/skin.css` | 19 | #617-CJ | ±0 |
| `thincoder-desktop/renderer/views/settings-sections.mjs` | 298 | #615② | +2 |
| `thincoder-desktop/renderer/mount-settings-segments-providers.mjs` | 135 | #615② | +4 |
| `thincoder-desktop/renderer/mount-settings-exits.mjs` | 225 | #615② | +2 |
| `thincoder-desktop/renderer/views/settings-sections-tools.mjs` | 162 | #618② | ±0 |
| `thincoder-desktop/src/main/settings-values.mjs` | 109 | #617-CH | +5 |
| `thincoder-desktop/src/main/settings.mjs` | 325 | #617-CH | −2 |

- 行数口径 = read 工具报告值（文件 split 计数；`wc -l` 口径 = 各减 1）；实施轮届盘重跑为准（本表 = 修订轮快照）。
- **越 300 顾问线档（本批触碰）**：`renderer/views/settings.mjs` 335 · `src/main/agent-bridge.mjs` 319 · `renderer/chat.css` 313 · `src/main/settings.mjs` 325 · `renderer/store.mjs` 301 ⇒ **本批零拆**（结构轮债，登记 —— §2.8）。修订轮 1 增一例：`src/main/settings.mjs`（随 #617-CH 单源随迁入触碰面）。
- **测试面**：批内件 = `docs/batches/2026-09-29-desktop-residuals-round3.test.mjs`（随批档，收口后归档）；核 ∕ 端既有套件零改。

#### 号 4（🟡 · 指针）收正（并披露一坐标差）

- R-4 依据收正为 **`docs/desktop/design/PROJECT.md:1087 ∕ :1089`**（CH ∕ CJ 两行 —— 本席届盘实读）；#70 读位 `:1086 ∕ :1088` = 同两行（位差 1）；原记 `:1029 ∕ :1031`（现盘 `:1030 ∕ :1032`）实为 AB ∕ AD 行。**波 C 落笔前仍须届盘重读。**
- #613 retract 三径收正为 **`renderer/composer-wire.mjs:78 ∕ :88 ∕ :95`**（三径均在 `sendDirect` 内 —— `sendQueued` 零 retract 调用；原载 `sendDirect:79 ∕ :88 ∕ sendQueued:136` 更正）。

#### 号 5（🟡 · #617-CH 通路）定形 = 扩载荷（单源随迁）

- **信息通路（二择一之裁 = 扩载荷）**：
  - ① **单源随迁**：`SLOT_AUTHORITY_PATHS` 自 `src/main/settings.mjs:158-160` 迁 `src/main/settings-values.mjs`（export；S14a 注随迁）；`settings.mjs` 经既有 import 面（`:40`）取用 —— **零新环**（现依赖向 settings.mjs → settings-values.mjs 保持）。
  - ② **载荷扩项**：`agentFields`（`settings-values.mjs:66-73`）出五键 —— 增 `slotAuthority: SLOT_AUTHORITY_PATHS.includes(path)`（读面权威位标注；值面 ∕ 遮罩零变）。
  - ③ **渲染面**：泛化行对 `field.slotAuthority === true` ⇒ **只读行**（出值 + 提示词 = 既有词键 `settings.reason.slotAuthority`（`renderer/i18n-views.mjs:187` ∕ `:330`）· 锚 `data-field` + `data-readonly` · **零控件**）；段尾保存钮可编辑判据（`settings-agent.mjs:220`）同排除 slotAuthority 行；无控件 ⇒ 不入提交 patch（零机制）。
  - ④ 写面拒码 `slot-authority`（`settings.mjs:294-296`）保留（防御面：非本面调用者仍可触）。**零新词**。
- **判据**：**机判** = 批次件两臂：①主进程臂（`agentFields` 含 `agent.engineering` ⇒ `slotAuthority === true`；普通键 ⇒ `false`）②渲染臂（`agentBody` 以含 `slotAuthority` 键的 fields 驱动 ⇒ 该行**零 `input`** ∧ 含 `settings.reason.slotAuthority` 词值；段尾提交集不含该 path）；反例 = 普通布尔键仍可编辑。
- **落点（3 档）**：`renderer/views/settings-agent.mjs` · `src/main/settings-values.mjs` · `src/main/settings.mjs`。
- **可供性零损失（不变量）**：会话槽真开关在位 —— 输入区 `setEngineeringEnabled`（`renderer/composer-wire.mjs:202` ⇒ `session:flags`）+ 状态行段 1 `eng` 位标（`renderer/views/statusline-banner.mjs:14` ∕ `:20-24`）。

#### 号 6（🔵 · #610）「一律」收口 —— 选「收窄规则表述」

- **收窄后规则（取代 §2.2 #610 应然首句）**：**待发送面不得以「流内」命名**（其位在输入区上方，消费前不在流内）；改述处统一为「输入区上方待发送带（`pending` 镜面）」。**名称归一（「输入行上方带」⟷「输入区上方带」）不在本行射程 —— 另裁**：届盘实读三处异名（`renderer/mount-composer.mjs:34` · `renderer/views/chat-pending.mjs:5` · `renderer/views/chat.mjs:7`），本批零触、登记（评审原注「名称归一另裁」同判 —— 修 `:34` 一处不立「一律」，三处同改则越出本行射程）。
- **判据（收窄后）**：**机判** = `renderer/**` 中「流内待发送」∧「改住流内」零命中 ∧ 改述处各含「输入区上方」。
- **落点（4 档 · 与修订前同）**：`renderer/mount-composer.mjs` · `renderer/store.mjs` · `renderer/frame-dispatch.mjs` · `renderer/views/pool-tree.mjs`。

#### 号 7（🔵 · 数值）收正（并披露两数不立）

- `renderer/i18n.mjs` 计数收正为 **394 行**（read 口径；`wc -l` 393 —— 届盘实读）；§2.2 #615① ∕ §2.5 R-5 ∕ §2.6 F4 三处「473 行」读数随正。**「已过 500 硬限」之说删除**（届盘实未越限 —— 原载 473 ∕ 评审载 501 两数经复核均不立，差异详见报告）；#615①「词面无载体」之理全由 **#614 拆批在飞（本批 §1 零触）** 承载。
- `events-wake.mjs` 表记收正 = 73（read 口径，见号 3 表）。

#### 号 8（🔵 · R-3 ∕ R-5 ∕ R-6）零动作

评审复核无异议（轮 1 第 8 条：R-3 ∕ R-5 在盘成立 · R-6 = 留）⇒ 本块零写（不动其行文）。

#### 计数随动与随动清单（D3）

- 「25 档」⇒ **27 档**（§2 头行 ∕ §2.3 表题 ∕ §2.4 推荐 ∕ §2.9 ② —— 头行经 status 动作收正）。
- 实施分批档数随动（§2.4）：A 10 · B 9（含重复 2 —— `renderer/views/chat.mjs` 入波 B 与 A 重复 ∕ `turn-face.mjs` 与 D 重复；`mount-composer.mjs` 随 #613 落点收缩出波 B）· C 10（含重复 2）· D 1（+1 重复）；唯一档数 = 10 + 8 + (10 − 2) + 1 = **27**（公式取用不变）。
- §2.7 随动两行收正：`RENDERER.md` 行 ⇒ 「§1.1 消化组族：在场判据扩 cap 态（`start ∨ cap ∨（end ∧ 携 cap）`）· cap 行锚 `data-digest-cap` · 携 cap 者终态驻留（下一轮 `start` 换代清除）」（#541）；`IPC.md` 行 ⇒ 「§2 `ev:digest` 载荷表补 `status:"cap"` + `mode` ∕ `turns` 两键（与 start ∕ end 并表）；`ev:queue` 注补撞帽拒径入队」（#541 · #543）。
- §2.8 补两条：① #610 名称归一（「输入行上方带」⟷「输入区上方带」）**另裁** —— 届盘实读三处异名（`mount-composer.mjs:34` · `views/chat-pending.mjs:5` · `views/chat.mjs:7`），本批零触、登记；② #613 认领径全住写面档 —— `mount-composer.mjs` 零改。
- §2.9 增一行：修订轮 1 自检 = 评审 #26 逐号 1–8 处置（1–7 落 · 8 零动作）；两 🔴 机制重规格全文在册（号 1 ∕ 号 2）；表 ∕ 越线集 ∕ 指针 ∕ 计数随动已收。

### 2.11 修订轮 2（评审 #56 · §3 轮次 2 逐号处置 · 2026-09-29）

**缘起**：§3 轮次 2 = pass（前轮 2 🔴 双清 · 抽验相符 25/26）；余 🟡1（chrome.css 族漂项 · 非阻断）· 🔵1（波数）—— 父侧裁定全受理。本块 = 逐号 1–2 处置记录；**就地修正**（收正直接落于本档行文，不设第二层留档）；产品码零改 · §3 零改 · 他档零触。

#### 号 1（🟡 · chrome.css 族漂项 —— 三处届盘重锚）

- **① 越线集**：`renderer/chrome.css` 451 ⇒ **288**（届盘实读 288 行；实 < 300 ⇒ 出集）⇒ 越线集收 5 档（`renderer/views/settings.mjs` 335 · `src/main/agent-bridge.mjs` 319 · `renderer/chat.css` 313 · `src/main/settings.mjs` 325 · `renderer/store.mjs` 301）；号 3 表行随正（本档 :337）。
- **② #617-CJ 引**：「层全窗」锚 `renderer/chrome.css:449` ⇒ **:286**（`.boot-gate { position: fixed; inset: 0; z-index: 200;` —— 值面同）；本档 :166 落。
- **③ #539 ⑥a/① 引**：「同三值先例」活件 `chrome.css:171-175` ⇒ **`renderer/session-list.css:42`**（`.session-item:focus-visible`；`outline` ∕ `outline-offset` ∕ `background` 三值逐字同）；本档 :39 落。
- 机制面不受损（评审判非阻断）；三处 = 纯坐标收正，零语义 ∕ 零行为。

#### 号 2（🔵 · 波数 —— 波 B 记录收正）

- 波 B 记 **9（含重复 2 —— `renderer/views/chat.mjs` 入波 B 与 A 重复 ∕ `turn-face.mjs` 与 D 重复）**；`mount-composer.mjs` 随 #613 落点收缩出波 B；唯一档数公式 27 取用不变。落点：本档 :384（§2.10「计数随动」）· :226（§2.4 B 行）。

#### 就地随动（计数一致面 · 本档）

- 修订轮 1「25 ⇒ 27」余项随落：§2.4 题行（:219）· 推荐（:230）· §2.9 ②（:284）；§2.4 C 行「10（含重复 2）」（:227 —— 随号 5 三档落点）。§2.3 现行版表题 = 号 3「（27 档）」在盘；原 §2.3 表（25 行快照）与其题行留档不动。
- 越线计数随动：F10（:258）· §2.8（:276）「4 档 ⇒ 5 档」。
- `i18n.mjs` 读数随落（号 7 宣）：§2.2 #615①（:135）· §2.5 R-5（:241）· §2.6 F4（:250）「473 ⇒ 394」（届盘复读 394 行相符）。
- §2.9 自检行：修订轮 1 宣「增一行」未单列 —— 自检状态以 §2.10 ∕ §2.11 两块承载。
- 读回核实（D6）：15 处逐处读回在盘（旧值残留仅 §3 评审原文 —— §3 零改）。

### 2.12 记录面收尾注（#70 报告四点处置 · 父侧已裁全受理 · 2026-09-29）

**缘起**：#70 交付报告披露四点（父侧全受理）；本块 = 逐点落位记录。**写面 = 本档 §2；产品码零触 · §1 ∕ §3–§6 零触。**

- **① #581 转出注（附 A 裁定）**：唯一载体 = `desktop-rebuild-fidelity`（父侧 2026-09-29 17:1x；RF 波 5 已按 RF 形实施）—— 两注就地：§2.2 #581 段首（本档 :76）· §2.4 波表下（本档 :232）；波表行 ∕ 档数照转出前快照录（不重算）。
- **② #618② 判据① 前提收正**：三方断言（核 ∕ 桌面主进程 ∕ VSC）已由 B10 批落（`b10-w1w4.test.mjs:148-157` 三方齐）——「此处补『桌面主进程』一支」句收正（本档 :184）。
- **③ §2.7 S13 续项 = 撤出**：给由 = 现盘无锚点（PROJECT.md 中 S13 仅 `:194 ∕ :707` 行数表行，与 R-3 裁定不抵；「届盘重锚」不取 —— 届盘重读亦无锚点）⇒ 撤出防悬项空转；改述后判据以 §2.2 #618 为单源在册（本档 :273）。
- **④ 数值回填**：号 3 表 `views/chat.mjs` 285 ⇒ **291**（届盘实读 · read 报告值口径；#70 载 290 差 1）（本档 :323）；#618 现行 i18n-views 引 `:146 ∕ :288` ⇒ **`:148 ∕ :292`**（本档 :177）；号 4 依据 ⇒ **`PROJECT.md:1087 ∕ :1089`**（届盘实读；#70 读位 `:1086 ∕ :1088` 位差 1）；**波 C 落笔前仍须届盘重读**（本档 :356）。**点外一致性面随正**：`i18n-views.mjs:185 ∕ :326` ⇒ `:187 ∕ :330`（两处 · 本档 :161 ∕ :364）· §2.5 R-4 行依据位（本档 :244）。
- **读回核实（D6）**：逐点读回在盘；跨段旧值残留仅 §3 评审原文 ∕ §5 实施记录（均零改）。

### 2.13 波 D 登记面 + 实施后文档面随动（记录块 · 2026-09-29）

**缘起**：父侧 D3 波 D 派单（勘 ∕ 登记 ∕ 裁定——零产品码）+ 波 A/B/C 落定后文档面随动（四点 + §4.1 行数账族）。**写面 = 本档 §2 + 设计四档（`docs/desktop/design/IPC.md` ∕ `UI.md` ∕ `RENDERER.md` ∕ `PROJECT.md`）；产品码零触 · §1 ∕ §3–§6 零触 · 他档零触。**（记录块编号 = §2.13——按 §2 顺位续编；派单「§2.17+」按「下一顺位记录块」解。）

#### 2.13.1 波 D 登记面

**#611 · PATH-node 两处 + fuse 前提（只勘只登记 · 届盘复核在盘）**

- **两处（届盘实读）**：① `thincoder-core/tools/shared.mjs:247` —— `execFile("node", ["--check", abs], …)`（`autoSyntaxCheck`——编辑工具成功径）；其 catch ⇒ 返回 `Syntax: FAILED — <err>`：node 不可解析（PATH 缺）⇒ **假失败**（成功编辑被误报语法失败）。② `thincoder-core/agent-tools/verify.mjs:202` —— `runCommand("node", ["--check", f], …)`（验证工具「建议语法提示」段）；其 catch ⇒ 推 `⚠ <f> — node --check flagged it`：node 不可解析 ⇒ **假「已标红」**；而同档注 `:193-195` 自载「a missing node simply skips silently」——**注与行为相抵**。
- **前提类** = PATH 解析（≠ `execPath` 类——#602 修复面不覆盖本两处）。
- **路由（§4 R-7 准）**：**打包 fuse 前提**（`RunAsNode` 在线——届盘实读 `thincoder-desktop/package.json` 无 `build` 键 ∧ 无 electron-builder 档 ⇒ 现态成立；fuse 关闭 ⇒ #602 修复失效）+ `hooks` ∕ `mcp` ∕ `lsp` 配置命令面（同「PATH 解析」类）⇒ **父侧发布 ∕ 打包轮登记**；两处行为修复**另裁**（本批禁修）。
- **实勘腿（探针件两断言——设计 §2.2 ①）未落**：波 A/B/C 批内件臂 ①–⑯ 无 #611 臂 ⇒ 本登记按设计勘得项（§2.6 F7）落；如需可执行证据，另派探针件。

**#615① · S3 行面缺 VSC `failure` 分档（登记 + 解路 + 到期 —— §4 R-5 准）**

- **现行（实读）**：桌面行面两键 `available` ∕ `unavailableReason`（`thincoder-desktop/src/main/providers.mjs:105-107`）；探针失败分档端侧闭集仅 `timeout` ∕ `malformed`（`hostBusy` 并入 `malformed`——`:232-233` 自述 ∕ `:242` 映射）；宿主忙采样器桌面零命中 —— **能力缺失（有由）**。
- **解路（三件）**：① 新采样器档 `thincoder-desktop/src/main/loop-sampler.mjs`（port ≈45 行）；② 行面 `failure` 键贯链（`providers.mjs` → 通道 → 渲染）；③ 新词键 —— 词载体现位 = 设置面词族第四档 `thincoder-desktop/renderer/i18n-settings.mjs`（**137**——#614 拆批已落：`renderer/i18n.mjs` 500 ⇒ 393）⇒ **原「词面无载体」受阻已消解**。
- **到期** = 下一桌面设置面轮。

#### 2.13.2 文档面随动（逐处表 —— 档 → file:line（届盘） → 落值）

| 档 | file:line | 落值 |
|---|---|---|
| `IPC.md` | `:25` | `ev:digest` 载荷**三形**（+`cap { mode, turns }`——#541 波 B 落；对位 VSC `postDigestCap`）· 消费句补 cap 行（锚 `data-digest-cap`）终态驻留 · 产出方补 cap 帧坐标（`turn-face.mjs:122`） |
| `IPC.md` | `:30` | `ev:queue` 推送点补**撞帽询问拒径携消息入队**（#543 裁定 A · **实施待落**——标记说明见 2.13.3 ①） |
| `IPC.md` | `:75` | 载荷键集该条随动（`cap { mode, turns }`） |
| `IPC.md` | `:294-297` | §2 项 10 实现坐标三处按盘收正（`settings-values.mjs:70` ∥ `settings.mjs:291-292` ∥ `:304`——S14a 随迁后） |
| `IPC.md` | `:418-420` | 变更记录一行 |
| `UI.md` | `:547` | 本批注（parity-b10-ui）项 6 补 **slot 权威键泛化行只读**（#617-CH 波 C 落） |
| `UI.md` | `:550` | 项 8 收正为 **CJ 裁定落**（`error` 态顶部横幅非模态——#617-CJ 波 C 落） |
| `UI.md` | `:741` | 变更记录一行 |
| `RENDERER.md` | `:41` | `ev:digest` 归约三态（`start` ∕ `cap` ∕ `end`；cap 支并前片保 `n` · cap 事实跨 `end` 存续 · 下一轮 `start` 换代清除） |
| `RENDERER.md` | `:42` | 消化行族行集补 **cap 行**（锚 `data-digest-cap`；stop 档并 `.digest-cap-stop`；行文 = `digest.capStop` ∕ `digest.capAuto`） |
| `RENDERER.md` | `:45` | 在场判据扩 `start ∨ cap ∨（end ∧ 携 cap）` · cap 帧保组（自愈）· **携 cap 者终态驻留** |
| `RENDERER.md` | `:69` ∕ `:79` | 帧尾态刷 ∕ 流内非块节点族两条同拍 |
| `RENDERER.md` | `:242` | 变更记录一行 |
| `PROJECT.md` | `:206` | `renderer/chat.css` **312 ⇒ 327**（波 B 后） |
| `PROJECT.md` | `:171` ∕ `:213` ∕ `:233` ∕ `:235` ∕ `:271` | `turn-face.mjs` **145 ⇒ 153** ∕ `events-wake.mjs` **72 ⇒ 84** ∕ `views/chat.mjs` **290 ⇒ 291** ∕ `frame-dispatch.mjs` **≈50 ⇒ 55**（去「拟新增」标） ∕ `composer-wire.mjs` **230 ⇒ 242** |
| `PROJECT.md` | `:176` ∕ `:184` ∕ `:194` ∕ `:203` ∕ `:248` ∕ `:249` ∕ `:250` ∕ `:255` ∕ `:266` | `agent-bridge.mjs` **319 ⇒ 325** ∕ `settings.mjs` **324 ⇒ 320** ∕ `settings-values.mjs` **109 ⇒ 118** ∕ `chrome.css` **287 ⇒ 291** ∕ `views/settings.mjs` **334 ⇒ 336** ∕ `views/settings-sections.mjs` **297 ⇒ 300** ∕ `settings-agent.mjs` **227 ⇒ 230** ∕ `settings-sections-tools.mjs` **161 ⇒ 163** ∕ `mount-settings-segments-providers.mjs` **134 ⇒ 138** |
| `PROJECT.md` | `:232` ∕ `:236` | `store.mjs` **300 ⇒ 302** ∕ `views/chat-chrome.mjs` **292 ⇒ 335**（两档越 300 ⇒ 越层入册） |
| `PROJECT.md` | `:247` | **新登行**：`views/pool-tree.mjs` **174**（让位修复批拆档产出） |
| `PROJECT.md` | `:297` ∕ `:298-299` | 次大两档句收正（**356 ∕ 337**）· 越层段头 **九 ⇒ 十一档**（+两档新入册说明） |
| `PROJECT.md` | `:302` ∕ `:305` ∕ `:307` ∕ `:308` ∕ `:309` ∕ `:310` | 越层段条目收正（`views/settings.mjs` 336 ∕ `settings.mjs` 320 ∕ `agent-bridge.mjs` 325 ∕ `chat.css` 327）+ **新入册两档**（`store.mjs` 302 ∕ `views/chat-chrome.mjs` 335——预案 = 待裁） |
| `PROJECT.md` | `:311-313` | 贴层段收正（出 `store.mjs`；`settings-sections.mjs` ⇒ 300） |
| `PROJECT.md` | `:1411-1412` | 变更记录一行 |
| 本档 §2 | 本块 | 记录块本体（2.13） |

#### 2.13.3 披露项（上抛 · 父侧裁）

- **① #543 实施未落（本注按裁定形落 + 携实施状态标记）**：届盘实读 `onCapCancelled` 全树零命中（`turn-face.mjs` 拒结算处直接 `return "stopped"`；`turn-driver.mjs` `interrupt` 无入队接线）——#543 裁定 A 的**产品码实施不在本派单射程**（波 D ＝ 零产品码；设计 §2.4 波表同注）。`IPC.md:30` 半句按**裁定 A 应然形**落并携「实施待落」标记；**#543 实施轮须回核本注（去标记）**。
- **② §10 CH ∕ CJ 两行仍载「落点 = 下一桌面（设置面）轮」**（`PROJECT.md:1087` ∕ `:1089`——届盘位）：波 C 已落 ⇒ 该两行落点句已 stale；§2.7 该行（「状态收正——落定后转「已落」」）**未在本派单射程**（派单 a–f 未列）⇒ **只报不触**，一行级收正请父侧裁。
- **③ 实勘腿未落**（同 2.13.1 #611）——如需可执行证据另派。
- **④ doc-check 读数（本笔运行期自测）**：首跑 悬空 **32** ∕ 行宽 **72** —— 其中本笔新增 = 悬空 **2**（变更记录相对简写未解析）+ 超宽 **5**（UI ×2 ∕ PROJECT ×2 ∕ IPC ×1）；**收尾读数 = 悬空 30 ∕ 行宽 65**——本笔新增全清，且触及的两行既存超宽随修归零。行数面差异 **11 条——本笔档全对齐**；余 = 他档在飞漂移（`mount-sessions` ∕ `views/session-control` ∕ `views/chat-scroll` ∕ `views/chrome` ∕ `activity-new` ∕ `settings-controls` ∕ `settings-sections-env` ∕ `settings-sections-mcp` ∕ `mount-settings` ∕ `statusline` ∕ `statusline-segments`——#650 族已登台账）。
- **⑤ 随记**：#611 fuse 前提 + `hooks`∕`mcp`∕`lsp` 命令面 = 发布 ∕ 打包轮登记（§4 R-7 准）；#651（`views/chat-chrome.mjs` 336 越线）已随本笔入 §4.1 越层段（登记完成——台账核销归父侧）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

### 设计评审 · 桌面残余三轮（§2 全量）· 发现表

| # | 类别 | 严重度 | 问题 | 建议 |
|---|----------|----------|-------|------------|
| 1 | 可行性 ∕ 验收（#541） | 🔴 | 设计档 :56-59：cap 以切片 `{status:"cap",…}` 承载 + `digestGroupNode` 组尾加行 —— 但现盘**两条渲染通路均以 `status === "start"` 为门**：`renderer/views/chat.mjs:135`（构树仅 start 态出 `digestGroupNode`）与 `renderer/views/chat-chrome.mjs:156-174`（`syncDigest`：非 start ⇒ 摘除 :160-164；`digestGroupNode` 仅 :167 在 start 态构树）。⇒ cap 帧一到，组被摘除，cap 行**永不渲染**；撞帽轮的 `end` 终态行更新同时被跳过（现有行为回退）。机判三臂（归约 ∕ `digestGroupNode` 单测 ∕ 样式）全绿而功能为死；设计自持人工读回「撞帽后流内出现 cap 行」不可达。VSC 对位件为**独立元素**（`thincoder-vscode/webview/chat-status.js:97-105` append 于消息列、不受消化行组生命周期辖），未被镜像。另：按所载新记录 `{status:"cap",mode,turns}`（不并前片）丢 `n` ⇒ 其后 `end` 行将出 n=0。 | 应然须扩到两条门（cap 态保组 ∕ 构树，或按 VSC 形出独立非块节点），并令 cap 记录并前片（保 `n`）；机判补**帧尾通路臂**（cap 切片 ⇒ 组在场 ∧ 含 `[data-digest-cap]`；`end` ⇒ 终态行），不能只在 `digestGroupNode` 单测层验。 |
| 2 | 可行性（#613） | 🔴 | 设计档 :122：「`noteEcho(key, block, attempt)` … 令牌取 `inFlight.get(key)`」—— 现盘序为**先回声后上行**：`thincoder-render-core/composer/panel.mjs:319` ∕ `:333`（`onUserEcho`）先于 `:321` ∕ `:341`（`post("userMessage" ∕ "queuedUserMessage")`）；尝试令牌在 `renderer/composer-wire.mjs:66-67` 由 `sendDirect` 于 post 之后登记（`sendQueued` 同 :134）⇒ 回声时刻 `inFlight.get(key)` 恒为**上一次**提交的令牌（首提交 = undefined）。槽即成对为（上代令牌, 新块）：A 的迟到回执载 A 令牌、与 B 块所在槽对不上 ⇒ 竞态未消；单提交反例臂亦必失（或按守卫写法反向失）⇒ 两条机判臂**不可能同时成立**。 | 改绑：尝试令牌须由提交侧（post ∕ `sendDirect`）认领 ∕ 落槽，而非在 `onUserEcho` 读 `inFlight`；并写明 `retractEcho` 调用面所传 = 本回执所在尝试的本地令牌。两条机判臂（竞态主臂 + 单提交反例）保留 = 正确验收面。 |
| 3 | 受影响文件表（判据 8） | 🟡 | 七行「—」（无现盘行数；届盘实读均 ≤300：settings.css 295 ∕ mount-composer 245 ∕ frame-dispatch 56 ∕ pool-tree 175 ∕ chat-chrome 293 ∕ statusline 206 ∕ mount-settings-segments-providers 135）之外，多行注记与现盘差：`views/chat.mjs` 365⇒285 · `views/settings-agent.mjs` 120⇒228 · `views/statusline-segments.mjs` 198⇒225 · `mount-settings-exits.mjs` 274⇒225 · `agent-bridge.mjs` 333⇒319 · `chrome.css` 444⇒451 · `skin.css` 13⇒19 · `chat.css` 312⇒313 · `composer-wire.mjs` 230⇒231（表头自称「行数为设计轮实读」:187 不立）。且「越 300 顾问线档」清单（:216）两错：列 `views/chat.mjs`（实 285，未越线）而漏 `views/settings.mjs`（335）与 `store.mjs`（301）。 | 按届盘重跑重建表与越线清单（真实越线集 = settings.mjs 335 ∕ agent-bridge 319 ∕ chat.css 313 ∕ chrome.css 451 ∕ store.mjs 301）；「本批零拆 + 债在册」立场可保持（R3），但登记集须与盘符。 |
| 4 | 引证准确性 | 🟡 | R-4 依据（:240）引 `PROJECT.md:1004` ∕ `:1006` —— 现盘该两行 = BY（池区旗标）∕ BZ（model:list），CH ∕ CJ 两裁实在 `:1014` ∕ `:1016`。另 #613（:120）称 retract 三径 = `sendDirect:79` ∕ `:88` ∕ `sendQueued:136` —— 现盘三处均在 `composer-wire.mjs:78` ∕ `:88` ∕ `:95`，`sendQueued`（:131）零调用。 | 落 §4 ∕ §5 前收正两处指针（本批 #539 之立 = 指针卫生，引证尤须在盘）。 |
| 5 | 清晰度 ∕ 来源（#617-CH） | 🟡 | :159：泛化行「排除 `SLOT_AUTHORITY_PATHS`」—— 该表住主进程（`src/main/settings.mjs:160`），渲染面不可引入；读面载荷（`settings-values.mjs:66-73` ⇒ `{path,value,sensitive,kind}`）无权威位标注；落点（:162）仅列渲染面两档（「若投影需扩 deps」）。信息通路未定：主进程载荷扩项（则 §2.3 ∕ 落点缺该档）∥ 渲染面自持副本（第二源）。 | 二择一并写明：扩载荷（并把主进程档并入 §2.3 与落点）或明许渲染面常量（标注单源关系）。 |
| 6 | 一致性（#610） | 🔵 | :99 称「待发送面一律称『输入区上方待发送带』」，但同带既名「输入行上方带」（`renderer/mount-composer.mjs:34`）未入改述集，机判仅覆盖四处 ⇒「一律」不立。 | 或并把 `:34` 收口入改述集 ∕ 机判，或把「一律」收窄为实际规则（去「流内」名；名称归一另裁）。 |
| 7 | 数值漂移 | 🔵 | `renderer/i18n.mjs` 两处注「现 473 行」（:135 ∕ :241）—— 现盘 **501 行**（已过 500 硬限，反坐实「不触」之理，但数字须正）；`events-wake.mjs` 表记 71 与盘 ~72 微差。 | 正数字（或改述为「>500 硬限 ∧ #614 在飞」）。 |
| 8 | 裁定复核（设计档请 §3 复核之 R-3 ∕ R-5 ∕ R-6） | 🔵 | R-3（#618 判据改述）在盘成立：遮蔽值面三端同（`thincoder-core/agent-tools/settings.mjs:20` ∕ 桌面 `settings-values.mjs:15-18` ∕ `thincoder-vscode/src/extension/settings.mjs:18,:80`），三处 `****` = 指示位 ∕ 不可达兜底（`webview/settings-tools.js:270/:283`；`settings-providers.js:44` 于 :80 判据下不可达）。R-5（#615① 登记+解路+到期）成立（VSC 对位件 `webview/settings-providers.js:189/:192` ∕ `list-models.mjs:118-129` 在盘）。R-6（#610 扩入三处）= **留**（同机制同形，只修两处缺陷仍立）。R-1 ∕ R-2 ∕ R-4 ∕ R-7 按设计归 §4，无异议。 | —— |

计数：🔴×2 ∕ 🟡×3 ∕ 🔵×3。

VERDICT: changes-required

### 轮次 2（评审子代理）

**复核表 · 修订后现行版（§2.10）为准 · 核验基础 = 全数届盘实读（前轮 2 🔴 逐条重验，未引用历史快照）**

核验面：设计档全读 + §2.10 号 1–8 对现盘逐条（`thincoder-desktop/renderer/views/chat.mjs:135` ∕ `renderer/views/chat-chrome.mjs:156-174/:218` ∕ `renderer/events-wake.mjs:44-60` ∕ `renderer/composer-wire.mjs:46/66-67/78/88/95/131-143` ∕ `thincoder-render-core/composer/panel.mjs:319/321/333/341` ∕ `renderer/mount-composer.mjs:153-167` ∕ `src/main/settings.mjs:40/158-160/294-296` ∕ `src/main/settings-values.mjs:66-73` ∕ `renderer/views/settings-agent.mjs:138-160/220` ∕ `docs/desktop/design/PROJECT.md:1029/1031` ∕ `renderer/chrome.css:286` ∕ `renderer/session-list.css:42`）；号 3 表 27 档抽验 26（25 符 · 1 漂）。

| # | 原号 | 对象 | 严重度 | 状态 | 结论 |
|---|------|------|--------|------|------|
| 1 | 1 | §2.10 号 1（#541 扩门形） | 🔴 | Fixed ✅ | 两条门已覆盖：构树门 = `thincoder/thincoder-desktop/renderer/views/chat.mjs:135`（`if (model.digest?.status === "start") children.push(digestGroupNode(model.digest))`）、帧尾门 = `thincoder/thincoder-desktop/renderer/views/chat-chrome.mjs:160`（`if (slice === null || slice.status !== "start") {`，`node.remove()` 于 :163）——修订句「在场判据由 `status === "start"` 扩为 **`start ∨ cap ∨（end ∧ 携 cap 事实）`**；携 cap 者 `end` 更新毕**不摘**（驻留）」。cap 记录「**并前片保 `n`**」与现盘 `thincoder/thincoder-desktop/renderer/events-wake.mjs:56`（`record = { ...(prev ?? {}), status: "end", ok: ev.ok !== false, ms: countOf(ev.ms) }`）相容（下一 `start` 换代重写 ⇒ cap 事实清）；机判补 `**cap 帧尾臂**` ∕ `**end 帧尾臂**`（`syncChrome` = 实存单点 `thincoder/thincoder-desktop/renderer/views/chat-chrome.mjs:218`（`export function syncChrome(root, model, handlers = {}) {`））；等效面补 cap 行比对（`equivalentDigest` `:130` 在盘）。驻留之因（cap 与 end 同链 · 对位件驻留）成立。 |
| 2 | 2 | §2.10 号 2（#613 提交侧认领） | 🔴 | Fixed ✅ | 与现盘序事实相符：`thincoder/thincoder-render-core/composer/panel.mjs:319`（`markPending(hooks.onUserEcho?.(text, Date.now()))`）∕ `:333`（`hooks.onUserEcho?.(text, Date.now())`）先于 `:341`（`post("userMessage", …)`）；令牌诞生 = `thincoder/thincoder-desktop/renderer/composer-wire.mjs:66-67`（`const attempt = {}` ∕ `inFlight.set(key, attempt)`），认领落在 post 之后同步段 ⇒ 恒命中本提交；`sendQueued` 零 retract（`:134` `inFlight.set(key, {})` 保留）；三径 `:78` ∕ `:88` ∕ `:95` 全在 `sendDirect`、全树零外部调用者（grep 实证）⇒ 落点收缩 1 档成立；两机判臂（双提交竞态 ∕ 单提交反例）按新机制可同时成立。 |
| 3 | 3 | §2.10 号 3（27 档表 ∕ 越线集） | 🟡 | Partial ⚠️（余一例 · 非阻断） | 抽验 26 处 · 相符 25（chat.mjs 285 · chat-chrome 293 · composer-wire 231 · mount-composer 245 · settings-agent 228 · statusline-segments 225 · mount-settings-exits 225 · events-wake 73 · chat.css 313 · agent-bridge 319 · store 301 · settings.mjs(main) 325 · settings-values 109 · turn-face 141 · turn-driver 288 · statusline 206 · settings.mjs(views) 335 · settings.css 295 · chat-tool 300 · i18n.mjs 394 等）；唯 `renderer/chrome.css` 表记 **451**（越线集载「`renderer/chrome.css` 451」）与届盘 **288** 不符（实读 `(288 lines total, use offset to continue)`；`:286` = `.boot-gate { position: fixed; inset: 0; z-index: 200;`；offset=440 空回）。连带三处须届盘重锚：①越线集该条（实 288<300，应出集）；②#617-CJ 现行「层全窗（`renderer/chrome.css:449` `position: fixed; inset: 0; z-index: 200`）」（实 :286，值面同）；③#539 ⑥a/①「（活件 `chrome.css:171-175` 同三值先例）」（实于 `thincoder/thincoder-desktop/renderer/session-list.css:42`（`.session-item:focus-visible {`；三值 `outline: 2px solid var(--accent);` ∕ `outline-offset: -2px;` ∕ `background: var(--hover-bg-strong);` 逐字同））。机制面不受损 ⇒ 非阻断，届盘重读收正即可。 |
| 4 | 4 | §2.10 号 4（指针） | 🟡 | Fixed ✅ | `docs/desktop/design/PROJECT.md:1029` 载 CH 行（**裁：读面收窄**）· `:1031` 载 CJ 行（**裁：保留设置可进出路**）——实读相符；对 `:1014 ∕ :1016` = BT ∕ BV 的披露成立；#613 retract 三径收正 :78 ∕ :88 ∕ :95 已在盘。 |
| 5 | 5 | §2.10 号 5（#617-CH 通路） | 🟡 | Fixed ✅ | 扩载荷 ∕ 单源随迁可行：`src/main/settings.mjs:40` 既有 import 面（`import { agentFields, deepEqual, deleteKeyPath, isConfigured, setKeyPath } from "./settings-values.mjs"`）；`SLOT_AUTHORITY_PATHS` 现于 `:160`（`const SLOT_AUTHORITY_PATHS = Object.freeze(["agent.advisor.guard", "agent.engineering"])`）；`settings-values.mjs` 无回引（现仅 node:fs ∕ 核件）⇒ 零新环；`agentFields`（`:66`）可扩第五键；渲染只读行 ∕ 段尾判据（`settings-agent.mjs:140`（`const editable = field.sensitive !== true && EDITABLE_KINDS.includes(field.kind)`）∕ `:220`）可行、零新词（`settings.reason.slotAuthority` 键在册）；落点三档与表补行一致。 |
| 6 | 6 | §2.10 号 6（#610 收窄） | 🔵 | Fixed ✅ | 「一律」已收窄 + 机判补「改住流内」零命中；三处异名实读在盘（`renderer/mount-composer.mjs:34` ∕ `renderer/views/chat-pending.mjs:5` ∕ `renderer/views/chat.mjs:7` 均载「输入行上方带」），归一另裁登记成立。 |
| 7 | 7 | §2.10 号 7（数值） | 🔵 | Fixed ✅ | `renderer/i18n.mjs` = 394（实读相符、「>500」句已删）；`renderer/events-wake.mjs` = 73（相符）。 |
| 8 | 8 | §2.10 号 8（R-3/R-5/R-6） | 🔵 | 零动作 ✓ | 复核结论无异议、修订零动作，与判一致（R-1/R-2/R-4/R-7 仍归 §4）。 |
| 9 | 新 | §2.10「计数随动」段 | 🔵 | New（登记性） | 波 B「9 ⇒ 8」派生句不立：B 花名册 = 9 行（#541 5 档含 `renderer/views/chat.mjs` + #581 2 + #613 1 + #599 1），跨波重复 2（`chat.mjs`（A）· `turn-face.mjs`（D））；8 = 首见唯一数（公式 10+8+(10−2)+1=27 取用无误）；括注「波 B 随 #613 落点收缩 9 ⇒ 8（`mount-composer.mjs` 出波 B）」漏「+`views/chat.mjs` 入波 B」相抵项 ⇒ 随动 §2.4 宜记 `9（含重复 2）`。 |

计数：🔴×0（前轮 2 全清）· 🟡×1 余（chrome.css 族漂项 · 非阻断）· 🔵×1 新。抽验相符 25/26。

VERDICT: pass

## §4 用户批准（主 agent）

**用户批准（父侧代签 · 2026-09-29）**

- **依据** = 用户 2026-09-29 13:52「别等我了，自己跑完」+ 17:02「尽可能消除」令（代点火 + 代批准授权——本批经此授权点火评审 #26（轮 1）∥ #56（轮 2））。
- **三条件核检**：① **评审 pass**——#56 复审轮 2（前轮 2 🔴 双清 · save 余 🟡1 ∕ 🔵1 非阻断；§3 在册）② **修正轮落地并经父侧核验**——#38 修订轮 1（两 🔴 机制重规格：扩门形 ∥ 提交侧认领）+ #67 修订轮 2（15 处 + 随落 6 处；§2.11 在册）③ **凭证**——评审 #56 已通过（token 在手）。
- **批准射程** = 本批 §2 全量（修订后现行版：#539 ∕ #541 ∕ #543 ∕ #599 ∕ #610–#613 ∕ #617-CH ∥ #617-CJ ∥ #581 相关行；波 A–D 27 档）；**不扩面**。
- 〔父侧代签 · 记录在案 · 可 revert〕

**§4.1 裁定项处置（R-1–R-7 · 父侧 · 2026-09-29）**

- **R-1（#543）** = **A**：待答期携文 ⇒ 入宿主忙态队 + 回合判 `stopped`（用户输入零丢失；忙态径同律 ∥ VSC 同族）——准。
- **R-2（#541）** = **本批实施**（补面对位 VSC 四层，不另轮）——准。
- **R-3（#618）** = 判据改述（不收编三处）——准（评审 #56 覆盖核过）。
- **R-5（#615①）** = 登记 + 解路 + 到期（不留永久先例）——准。
- **R-6（#610）** = 扩入同族三处（frame-dispatch ∕ store ∕ pool-tree 同形「流内」）——准。
- **R-7（#611）** = 只勘 ∕ 只登记（零行为）；fuse 前提 + `hooks` ∕ `mcp` ∕ `lsp` 命令面路由 ⇒ **发布 ∕ 打包轮**（登记随动）——准。
- 〔父侧代签组 · 记录在案 · 可 revert〕

**§4.2 射程更正（父侧 · 2026-09-29）**

- **#581 已转出**（附 A 裁定 · 父侧 2026-09-29 17:1x）：唯一载体 = `desktop-rebuild-fidelity`（RF 波 5）——**本批批准射程以「#581 不在本批」为准**（原射程句「+ #581 相关行」及波 B 同两档随 §2 补注转出；防双批二次改）。
- 其余射程不变（波 A–C 按重派各舱执行）。
- 〔父侧更正 · 记录在案 · 可 revert〕

## §5 实施记录（eng-coder）
**状态行**：实施完成（波 A（注释面）：#539 ∕ #610 ∕ #618② 13 处收正 · 10 档；波 B（行为面小件）：#541 ∕ #613 ∕ #599 · 7 产品档 + 批内件 ⑩–⑯；波 C（设置面）：#617-CH ∕ #617-CJ ∕ #615② · 10 档；补遗轮（#543 · 裁定 A）：产品 2 档 + 臂 ⑰（暂存件）；审计 clean ∕ 评审 pass；各轮终态 clean（2026-09-29））


### 波 A（注释面 · 零行为）· #539 ∕ #610 ∕ #618② —— 实施记录（2026-09-29）

**① 逐处表（13 处 → file:line → 落值 · 届盘实读）**

| # | 行 | file:line | 落值 |
|---|---|---|---|
| 1 | #539① | `thincoder-desktop/renderer/chat-composer.css:38` | 「沿 `.session-item:focus-visible` 先例」（活件 = `renderer/session-list.css:42` 三值逐字同） |
| 2 | #539② | `thincoder-desktop/renderer/views/chat.mjs:32` | 「接线两态沿 `renderer/views/chat-tool.mjs` 通则」 |
| 3 | #539③ | `thincoder-desktop/renderer/views/chat-tool.mjs:49` | 「接线两态（两态原语单源 = 本档 `wire` ∕ `withKey`）」 |
| 4 | #539④ | `thincoder-desktop/renderer/views/settings.mjs:15` | 「`renderer/mount-info.mjs`（本档 `reasonWord` 供其失败面出词）」 |
| 5 | #539⑤ | `thincoder-desktop/renderer/views/settings.mjs:314` | 「`views/onboarding.mjs` / `renderer/mount-info.mjs` 两挂载共用本表」 |
| 6 | #539⑥b | `thincoder-desktop/renderer/settings.css:9` | 「`renderer/mount-info.mjs`（信息行）」 |
| 7 | #539⑥c | `thincoder-desktop/renderer/settings.css:10` | 「变量单源 = `theme.css` `:root`」 |
| 8 | #610 | `thincoder-desktop/renderer/mount-composer.mjs:29` | 「⇒ 输入区上方待发送带 + 帧尾核 `markPending` 落笔」 |
| 9 | #610 | `thincoder-desktop/renderer/store.mjs:59` | 「读面 = 输入区上方待发送带 / 状态行段 14」 |
| 10 | #610 | `thincoder-desktop/renderer/store.mjs:60` | 「改住输入区上方待发送带（`pending` 镜面）」 |
| 11 | #610 | `thincoder-desktop/renderer/frame-dispatch.mjs:21` | 「`pending`：输入区上方待发送带」 |
| 12 | #610 | `thincoder-desktop/renderer/views/pool-tree.mjs:125` | 「排队消息改住输入区上方待发送带（`pending` 镜面）」 |
| 13 | #618② | `thincoder-desktop/renderer/views/settings-sections-tools.mjs:7` | 「配置 ⇒ `****`〔键值恒不下发〕」（注值 = 指示位实值 `settings.keySet` 单源一致） |

**② 腿读数**

- `node --check`（本波 8 档 .mjs · 随编辑内置）逐档 Syntax OK；批内件重跑 4/4 绿。
- 批内件（staged）= `.thincoder/tmp/2026-09-29-desktop-residuals-round3.test.mjs`（写门拒 `docs/batches/` 直落 —— 同 #545 潜行形；父侧收位待办，见 ⑤）—— `node --test` 4 臂：① #539 四扫式（`rail-row` ∕ `views/sessions.mjs:` ∕ `views/info-row.mjs` ∕ `chat-copy`）零命中 + 新锚在盘；② #610 `流内待发送` ∧ `改住流内` 零命中 + 五改述处含「输入区上方」；③ #618② 注值一致；④ 13 处改行皆注释形 ∧ 旧文零残留。
- 引注式扫复读（renderer/** 全树 · 独立 grep）：`rail-row`=0 · `views/sessions.mjs:`=0 · `views/info-row.mjs`=0 · `chat-copy`=0 · `流内待发送`=0 · `改住流内`=0。
- `node scripts/doc-check.mjs`：**前后位同**（悬空 161 · 行宽 82 · 行数面差异 0；两跑逐行比对仅采集端编码差）⇒ 本批写域零新增红（写域不在扫描面：`batches` 在 manifest `anchors.exclude`；产品码不在 scanDirs）。

**③ 决策透明表**

| 决策点 | 落值 | 依据 |
|---|---|---|
| #539③ 改锚形 | 「本档 `wire` ∕ `withKey`」自指形（设计映射 `views/chat-tool.mjs` 即本档） | §2.2 #539 应然「逐处改锚活面」（免自引全路径；语义等价） |
| #610 词面 | 三处「流内待发送气泡组」⇒「输入区上方待发送带」；两处「改住流内」⇒ 逐字「改住输入区上方待发送带（`pending` 镜面）」 | §2.10 号 6 收窄后规则（改述处统一词） |
| 批内件落位 | staged `.thincoder/tmp/…`（写门拒 `docs/batches/`） | #545 潜行形先例；文件内载两径同解运行式 |

**④ 内部审计 ∕ 代码评审（轮次与终态）**

- 分歧审计（explore · 只读）**1 轮**：码面四类零偏差（13 处落值 ∕ 四扫零 ∕ 改述五处 ∕ 注值一致 ∕ 零行为）；唯一发现 = 记录面（§5 未落）⇒ 随本 append 关闭。
- 代码评审（advisor）**1 轮**：VERDICT **pass**（0 🔴；🟡5 ∕ 🔵3 全非 must-fix）——处置：①§5/§6 空 ⇒ 本 append（§6 = 父侧）；②批内件 staged ⇒ 上抛收位（⑤）；③§2.2 #618 判据①「补桌面主进程一支」不成立于现盘（b10 批内件 `:150-151` 已落三方遮罩断言）⇒ 设计文本收正上抛；④§2.7 S13 判据行落点待定位 ⇒ 上抛；⑤数值漂（`views/chat.mjs` 285⇒290 · `i18n-views.mjs` 引 :146/:288⇒:148/:292 · 其余 ±1 口径）⇒ 上抛；⑥`views/settings.mjs` 334>300 = 在册结构债（R3 不升级）；⑦批内件扫式有意放宽 ⇒ 件内加注（已落）；⑧名称归一第三名「输入区带」登记未枚举 ⇒ 上抛。评审引文 host 机校 0/1 = 截断引文格式位（`chat-composer.css:38` 逐字复读在盘）。
- **fix round = 0（产品码零修正）**；测试件随评注记 1 行（⑦），重跑 4/4。**终态 = clean**。

**⑤ 披露项（上抛 · 非本席笔）**

- 批内件收位：`.thincoder/tmp/2026-09-29-desktop-residuals-round3.test.mjs` ⇒ 父侧移至 `docs/batches/2026-09-29-desktop-residuals-round3.test.mjs`（迁后按文件内命令重跑）。
- 设计/记录面收正：§2.2 #618 判据①前提（三方已全落于 B10 批内件，本批不重复取证）· §2.7「PROJECT.md §10 S13 判据行」落点待定位 · §2.10 号 3 数值漂逐行收正。
- 触面：10 档 + staged 批内件（余零触）；`renderer/views/settings.mjs`（334 行 >300）与越线集一致、本波零拆（R3）。

### 波 B（行为面小件）· #541 ∕ #613 ∕ #599 —— 实施记录（2026-09-29）

**① 逐处表（设计现行版 = §2.10 号 1 ∕ 号 2 + §2.2 #599；届盘实读）**

| # | 行 | file:line | 落值 |
|---|---|---|---|
| 1 | #541 发射 | `thincoder-desktop/src/main/turn-face.mjs:118-124` | `ContinueError` ∧ `autoTurn` ∧ `¬timerTurn` ⇒ `:122` `post("ev:digest", { key, status: "cap", mode: "stop", turns: err.turn })`，随 `:123` `return "stopped"`；用户回合 ∕ timer 轮零 cap 帧 |
| 2 | #541 归约 | `thincoder-desktop/renderer/events-wake.mjs:57-66` | cap 支 `{ ...(prev ?? {}), status: "cap", cap: { mode: stop?stop:auto, turns: 有限数∨null } }`（并前片保 `n`）；`end`（`:68`）并前片 ⇒ cap 事实跨 end 存续；`start` 换代清 |
| 3 | #541 节点 | `thincoder-desktop/renderer/views/chat-chrome.mjs:71-77` ∕ `:83-88` | cap 行（锚 `data-digest-cap`、stop 档并 `.digest-cap-stop`、行文 `digest.capStop` ∕ `digest.capAuto`）；计数行状态分档（`countRowText` ∕ `countRowClass`，`:48-62`） |
| 4 | #541 两门 ∕ 等效 ∕ 态刷 | 同档 `:189-193`（`digestPresent`）· `:199-217`（`syncDigest`）· `:164-174`（等效补 cap 行比对）· `renderer/views/chat.mjs:136`（构树门引 `digestPresent`） | 在场 = `start ∨ cap ∨ (end ∧ cap≠null)`；携 cap 者 `end` 更新毕驻留、不携 cap 者先更新后摘；缺席 ∧ 携 cap ⇒ 按态构树自愈 |
| 5 | #541 类 | `thincoder-desktop/renderer/chat.css:307-317` | `.chat-digest .digest-cap`（margin 6px 0 ∕ 11px ∕ opacity .75 ∕ `--fg-muted`）+ `.digest-cap.digest-cap-stop`（opacity 1 ∕ `--warn`）——值对位 VSC `webview/base.css:248-258` |
| 6 | #613 认领 | `thincoder-desktop/renderer/composer-wire.mjs:70-75` ∕ `:219-221` | `noteEcho` 落**未认领** `{ key, block, attempt: null }`；`sendDirect` 令牌诞生点认领（未认领 ∧ 键同）；`sendQueued` 不认领 |
| 7 | #613 守卫 ∕ 三径 | 同档 `:228-239`（`target.attempt !== attempt ⇒ 零动作`）· `:86` ∕ `:96` ∕ `:103`（三调用传本回执令牌） | 滞后回执不得错摘后提交块；单提交失败径原样退流 |
| 8 | #599 | `thincoder-desktop/src/main/agent-bridge.mjs:153-168` | `isRelayToken` 支 null 复核（`relayPathOf(text).rest` 起于 `⟦ev⟧` ∕ `[model]` ⇒ 消费；否则落 `subChunkOf("text", text)`）——与 VSC `panel-subagent-relay.mjs:107-108` 逐字同判 |

**② 腿读数**

- 批内件（staged = `.thincoder/tmp/2026-09-29-desktop-residuals-round3.test.mjs`）重跑 **16/16 绿**（波 A ①–④ + 波 C ⑤–⑨ + **波 B ⑩–⑯**：归约 ∕ 发射 ∕ cap 帧尾 ∕ end 帧尾（对照·自愈·换代） ∕ 样式 ∕ 双提交+单提交反例 ∕ relay 保形+VSC 同判）。
- **变异验牙**（临时回退三守卫复跑、随还原）：旧门形 ⇒ ⑫⑬ 红（「组在场」∕「驻留」负）；去守卫 ⇒ ⑮ 红（「B 块仍在序」负）；恒消费 ⇒ ⑯ 红（「零输出」负）——⑩⑪⑭ 不扰；还原后 16/16 复绿。
- 既有锁件复跑（改前 ∕ 改后同绿集）：`2026-09-28-desktop-session-title` 6/6→6/6 · `2026-09-29-missing-face-family` 9/9→9/9 · `2026-09-28-tech-debt-closeout-r6` 7/8→7/8（红 = 旧件 `chatModel` 直取——先于本席）· `2026-09-29-enddiff-clearance` 13/13→13/13 · `2026-09-29-send-busy-timing` 13/13→13/13 · `2026-09-29-queue-pickup-edge-copy-susp-queue` 10/10→10/10 · `2026-09-29-queue-pickup-edge-copy-wq-parity` 9/9→9/9（T8 随重锚复绿）· `2026-09-29-desktop-window-queue-parity` 7/9→7/9（红 = T1 ∕ T9 先于本席；T8 随重锚复绿）· `susp-queue-window` 改后首跑 9/10（W1 红 = 旧锁正则对 `turn-driver.mjs` 三态形；对象档 mtime 18:35 < 本席起跑 19:19，非本席面）。
- `node --check`：六 .mjs 产品档 + 批内件 + 两重锚件 全 Syntax OK。
- `node scripts/doc-check.mjs`：悬空 161（= 波 A 基线读数，零新增）· 行宽 81 ∕ 行数面差异 24（他批在飞 doc 变动）；本批写域（产品码 + `.thincoder/tmp` + 本档）不在扫描面（scanDirs = docs；`batches` 在 `anchors.exclude`）。

**③ 决策透明表**

| 决策点 | 落值 | 依据 |
|---|---|---|
| #613 锁件冲突 | 报父侧裁回「改」：设计字母形落（`retractEcho(key, attempt)` 二参 + 三处传令牌）+ 两条**活锁**最小重锚（`.thincoder/tmp/2026-09-29-queue-pickup-edge-copy-wq-parity.test.mjs:341` ∕ `.thincoder/tmp/2026-09-29-desktop-window-queue-parity.test.mjs:337`，旧形 ⇒ `retractEcho\(key, attempt\)`，意图逐字保留）；`docs/batches/**` 零触（归档副本重锚 = 父侧单，见 ⑤） | 父侧 ask 回复（设计为权威） |
| #541 自愈形 | 缺席 ∧ 携 cap 终态 ⇒ 经 `digestGroupNode` 按态构树（计数行状态分档） | §2.10 号 1「缺席 ∧ 携 cap ⇒ 按终态构树」 |
| 评后随评注记 2 处 | ① `events-wake.mjs:45` 注释补「cap 支为原引用例外」；② 批内件 ⑫ 补词键硬断言（核字典在场 + 非键名回退） | 代码评审 🔵 处置（注释面 ∕ 测试面 · 零行为；fix round 0） |

**④ 内部审计 ∕ 代码评审（轮次与终态）**

- 分歧审计（explore · 只读）**1 轮：CLEAN**（四类零偏差；逐点证据对设计现行版；两点披露 = 归档副本滞后〔`docs/batches` 属父侧写域〕 ∕ 动态复跑受限已由本席自跑补足）。
- 代码评审（advisor）**1 轮：VERDICT pass**（🔴 0；🟡3 ∕ 🔵3 全非 must-fix）——处置：🟡① `views/chat-chrome.mjs` 336 行越 300（**本批新越线、未入设计越线集**）⇒ 登记建议（⑤）；🟡② `src/main/agent-bridge.mjs` 325 行 = 在册债（R3 不升级）；🟡③ staged 批内件收位（⑤）；🔵④⑤ 已随评注记（见③）；🔵⑥ 批内件 607 行 vs 500 字面限 = 同族惯例（对拍件 13–62 KB）⇒ 不拆、登记。范围外注记三：`docs/batches` 归档副本重锚（⑤）· `views/chat-model.mjs:66` 两态注滞后（⑤）· 设计 Δ 预测回填面。
- **fix round = 0（产品行为零修正）**；评后注记 2 处（注释面 ∕ 测试面）后 16/16 复绿。**终态 = clean**。

**⑤ 披露项（上抛 · 非本席笔）**

- 批内件收位：`.thincoder/tmp/2026-09-29-desktop-residuals-round3.test.mjs`（今含波 A+B+C 臂 ①–⑯）⇒ 父侧迁 `docs/batches/2026-09-29-desktop-residuals-round3.test.mjs`（现归档档仅波 A/C，落后）。
- **归档副本重锚（单条 · 父侧 §4 已认领）**：`docs/batches/2026-09-29-desktop-window-queue-parity.test.mjs:341` 旧形 `/retractEcho\(key\)[^\n]*\n[^\n]*recordFailure\("msg:send", receipt\)/` ⇒ 新形 `/retractEcho\(key, attempt\)[^\n]*\n[^\n]*recordFailure\("msg:send", receipt\)/`（活锁同形已落 `.thincoder/tmp/…:337`）；全树仅此一条。
- 结构债登记建议：`renderer/views/chat-chrome.mjs` 336 行（本批新越线，未入设计越线集）——建议父侧登台账 ∕ 结构轮。
- 跨档注释滞后：`renderer/views/chat-model.mjs:66`「起跑 / 终态两态」⇒ 三态（cap 为第三态；随下一触碰轮收正）。
- 触面：7 产品档 + 3 批次件（含两重锚）；**#581 两档（`renderer/views/statusline-segments.mjs` ∕ `renderer/views/statusline.mjs`）零触**；`renderer/i18n.mjs` 零触；`renderer/mount-composer.mjs` 零触。

### 波 C（设置面）· #617-CH ∕ #617-CJ ∕ #615② —— 实施记录（2026-09-29）

**① 逐处表（11 处 → file:line → 落值 · 届盘实读）**

| # | 行 | file:line | 落值 |
|---|---|---|---|
| 1 | #617-CH① | `src/main/settings-values.mjs:66-70` | `SLOT_AUTHORITY_PATHS` 随迁 export（S14a 注随迁；主档本地 const 删） |
| 2 | #617-CH② | `src/main/settings-values.mjs:72-81` | `agentFields` 五键出 —— `slotAuthority: SLOT_AUTHORITY_PATHS.includes(path)` |
| 3 | #617-CH③ | `src/main/settings.mjs:40` ∕ `:291` | 经既有 import 面取用（拒位 `:291-292` 保留 ∕ 拒码 `slot-authority` 零变） |
| 4 | #617-CH④ | `renderer/views/settings-agent.mjs:135-161` | 泛化行 slot 权威键 ⇒ 只读行（`data-readonly` 锚 + 出值 + 提示词 `settings.reason.slotAuthority`；零控件） |
| 5 | #617-CH⑤ | `renderer/views/settings-agent.mjs:223` | 段尾保存判据排除 slotAuthority 行（零控件 ⇒ 不入提交 patch —— 沿 `data-readonly` 既有单点，机制零改） |
| 6 | #617-CJ | `renderer/chrome.css:284-291` | error 态非模态：`:291` 顶部横幅（`inset: 0 0 auto` ∕ `pointer-events: none` ∕ `z-index: 9` < 设置面 z 10）；`:287` 基规则全窗零改 |
| 7 | #615②① | `renderer/store.mjs:12-13` ∕ `:105` | `providers.keyDraft` 槽注册（初值 `null` + 档头注） |
| 8 | #615②② | `renderer/views/settings.mjs:146-147` ∕ `:242` | `keyDraft` 投影归一（`objOf`）+ `sectionBody` deps 注入 |
| 9 | #615②③ | `renderer/views/settings-sections.mjs:94-102` | `keyControls` 编辑态输入按名回种子（名对上 ∧ 串型；`value: seed`） |
| 10 | #615②④ | `renderer/mount-settings-segments-providers.mjs:42` ∕ `:57` ∕ `:61` | 取消 ∕ 成功 ∕ 失败三点（失败落 `keyDraft = { name, value }`（trim 同点）；成功 ∕ 取消双清） |
| 11 | #615②⑤ | `renderer/mount-settings-exits.mjs:179` ∕ `:193` | 开面 ∕ 关面复位（`keyDraft: null`） |

**② 腿读数**

- `node --check`：8 档 .mjs 全 OK（逐档实跑）；`chrome.css` 括号面 47/47 balanced（样式面无 node 检面 —— 结构性自检）。`skin.css` ∕ `i18n.mjs` 本席零触。
- 批内件（staged）= `.thincoder/tmp/2026-09-29-desktop-residuals-round3.test.mjs`（波 A①–④ + 波 C⑤–⑨ + 波 B⑩–⑯ 并发续写）—— `node --test` **16/16 绿**（波 C 五臂：⑤主进程臂 ∕ ⑥渲染臂 ∕ ⑦草稿链 ∕ ⑧CJ 非模态 ∕ ⑨静态闭包）。
- 真机探针（`node .thincoder/tmp/r3-waveC-probe.mjs` · Playwright+Electron · 畸形档夹具）：`boot="error"` ∧ `gate.state="error"` ∧ 原因文本非空在场 ∧ 横幅几何 56px（带高）∕ top 0 ∕ 全宽 1184（viewport 735）∧ `elementFromPoint(100,30)` 命中 `session-head`（非 gate ⇒ 点击穿透成立）∧ 向导槽空（`[data-onboarding]` 不在场）∧ `#settings-btn` Playwright 真点成功 ⇒ 设置面 `[data-settings][data-state="open"]` 可见 + 关闭钮在场 ∧ `settings:close` 真点 ⇒ 开态清零；反例臂：清 `data-state` ⇒ gate 复归全窗（735 = viewport 高 ∧ 中心命中 = gate）。截图：`r3-waveC-error-banner.png` ∕ `r3-waveC-settings-open.png`。
- 锁件复跑（45 件 · 改前 ∕ 改后同跑器逐件复跑）：**改前 35/45 绿 ⇒ 改后 34/45 绿**；差异两处 = ① `desktop-window-queue-parity` 9/0 → 8/1（出绿集）—— 该锁对 `renderer/composer-wire.mjs` 作源文本断言（`:38` ∕ `:336`），波 C 九档与 composer-wire 零交集 ⇒ 归因波 B（#613）在飞件；② `structure-split-round` 5/2 → 4/3（红件增一臂）—— 唯 B2「chrome.css 净差 = +1」臂可被本波触达（chrome.css 288 ⇒ 291 = §2.10 号 3 表 Δ+3 在册）⇒ 另档锁件重锚件已出（见 ⑤）。
- `node scripts/doc-check.mjs`：悬空 **161**（波 A 记同）· 行宽 **81**（波 A 记 82 —— ±1 为文档面漂移，本波零文档书写）· 扫描面 `docs` 152 档、`docs/batches` 零命中行 ⇒ 本波写域（产品码 + `.thincoder/tmp`）不在扫描面 = **零新增红**（闸态两红 = 既存）。
- 行数实读（本波 10 档 —— read 口径）：`settings-values.mjs` 119 · `settings.mjs` 321 · `settings-agent.mjs` 231 · `chrome.css` 292 · `skin.css` 19 · `store.mjs` 303 · `views/settings.mjs` 337 · `settings-sections.mjs` 301 · `mount-settings-segments-providers.mjs` 139 · `mount-settings-exits.mjs` 225（越 300 顾问线三档 = `settings.mjs` ∕ `store.mjs` ∕ `views/settings.mjs` —— §2.10 号 3 越线集在册，本批零拆）。

**③ 决策透明表**

| 决策点 | 落值 | 依据 |
|---|---|---|
| CJ 横幅几何 | `position: fixed; inset: 0 0 auto`（顶部带高）+ `pointer-events: none` + `z-index: 9` | 设计「载原因而不覆盖交互」＋「设置面可进可出」；点击穿透 = 直译（真机读数 hitIsGate=false）；z 序居设置面（z 10）之下 ⇒ 设置面头（含 ✕）不被盖 |
| CJ 值面零改 | `skin.css` 零触（转轮停规则 `:17` 原在；`ok` ∕ `loading` 两态零改） | 设计 §2.2 CJ「`ok` ∕ `loading` 两态零改」 |
| CH 提示词 | 复用 `settings.reason.slotAuthority`（零新词） | §2.10 号 5 ③ |
| #615② 种子值 | 提交点 trim 后 value（同点同值） | 设计「typed = 提交处现读值，同点」 |
| 批内件 ∕ 探针落位 | staged `.thincoder/tmp/`（写门拒 `docs/batches` 直落） | 波 A 先例；真机腿按任务书④「可跑则跑」已跑 |
| 锁件两条差异 | 分流：queue-parity 归波 B（同行收集）∥ structure-split B2 出重锚件 | 零他档书写；重锚模拟三断言全真 |

**④ 内部审计 ∕ 代码评审（轮次与终态）**

- 分歧审计（explore · 只读）**1 轮**：**CLEAN**（四类零偏差：①部分实现零 ②静默简化零 ③记录面缺口 2 项〔§5 待写（随本 append 消解）· §2.7 随动未落（上抛）〕④清单外零；另列注文微瑕 1 条）。
- 代码评审（advisor）**1 轮**：0 🔴；🟡4 ∕ 🔵4 全非 must-fix —— 处置：①🟡 锁件两条差异（协调项：重锚件已备 + 报告句按两条收正）②🟡 IPC.md:294 三坐标（CH 随迁漂移）⇒ 上抛 ③🟡 UI.md:546 ∕ :548 随动未落 ⇒ 上抛 ④🟡 批内件 606 行 vs 500 字面（射程面 343 行；按批件随批单件约定判非阻断）⇒ 上抛父侧裁 ⑤🔵 臂⑤未复原 config 路径 ⇒ **随修**（`finally` 补 `_resetConfigPathForTest()`，重跑 16/16）⑥🔵 CJ 真机证据面（探针已跑，读数入本 §5；正式证据面归 §6）⑦🔵 `skin.css` 未入档单 + §2.10 号 3 表 ±0 漂 ⇒ 上抛 ⑧🔵 三档越 300 顾问线（在册零拆）。
- **fix round = 1**（测试件随修 1 处；产品码零修正 —— 三行收正皆记录面 ∕ 上抛）。**终态 = clean**。

**⑤ 披露项（上抛 · 非本席笔）**

- 批内件收位：`.thincoder/tmp/2026-09-29-desktop-residuals-round3.test.mjs` ⇒ 父侧移至 `docs/batches/…`（迁后按文件内命令重跑；波 B 并发续写 ⑩–⑯ 在同件）。
- 重锚件（另档锁件随动 · 父侧采纳）：`.thincoder/tmp/2026-09-29-structure-split-round.baseline.reanchor.json` ⇒ `docs/batches/2026-09-29-structure-split-round.baseline.json`（`chrome.after` 并入本波 4 行新文；B2 断言模拟 {len, idx, rest} 三真）。
- 探针件 + 截图：`.thincoder/tmp/r3-waveC-probe.mjs` · `r3-waveC-error-banner.png` · `r3-waveC-settings-open.png`。
- 设计/记录面收正（父侧笔）：IPC.md:294 三坐标（改指 `settings-values.mjs:70`）· UI.md:546 ∕ :548 两行随动 · §2.10 号 3 `skin.css` 表值 · 锁件差异句按两条收正 · §2.7 随动清单外补 IPC.md 一行。
- 他档事：`composer-wire.mjs` 锁（`desktop-window-queue-parity`）随 #613 收位；`i18n-split`（3/2 红 · 改前既红）与 `structure-split` C ∕ D 两臂（改前既红）= 他批漂移，非本波。

### 补遗实施轮（#543 · 裁定 A）· 待答期携文入队 —— 实施记录（2026-09-29）

**① 逐处表（5 处 → file:line → 落值 · 届盘实读）**

| # | 行 | file:line | 落值 |
|---|---|---|---|
| 1 | #543 面 | `thincoder-desktop/src/main/turn-face.mjs:29-31` | 档头注「#543 裁定 A」段（拒结算处读本代 reason ⇒ 注入缝 ⇒ 零丢失；裸停零变） |
| 2 | #543 面 | 同档 `:51` ∕ `:54` | 工厂注 `onCapCancelled(key, message)` 缝行 + 形参 `onCapCancelled = null`（缺省 ⇒ 零动作） |
| 3 | #543 面 | 同档 `:130-138` | 拒结算处：本代 `live.signal.reason` 命中 `{ interrupt:true, message:非空串 }` ⇒ `onCapCancelled(key, capMessage)`，随 `return "stopped"`；裸停 ∕ 撤销 ∕ 缺缝 ⇒ 零动作 |
| 4 | #543 缝 | `thincoder-desktop/src/main/turn-driver.mjs:18-19` ∕ `:95-102` ∕ `:113` | 档头注 + 缝定义（`queued.add(key, { text, ts })`，满 ⇒ 零入队 ∕ 零帧；`chain.postQueue(key)` 出镜 —— 沿忙态径原语）+ `createTurnFace` 装配点注入 |
| 5 | 批内件 | `.thincoder/tmp/2026-09-29-desktop-residuals-round3.test.mjs:24` ∕ `:615-726` | 腿集 ⑰ 头注 + 臂 ⑰ 三腿（主臂 ∕ 裸停反例 ∕ 缝缺省臂——末腿评后随评加臂） |

**② 腿读数**

- 批内件（暂存件）`node --test`：**17/17 绿**（×5 定稳；新增 ㈠⑰ 主臂 = 队快照含该条 [`ev:queue.items`=["msg"] ∧ `queueSnapshot` 入队瞬间可观测] + 回合判 `stopped` + 消费 = 下一回合边界取走原文（新回合 `resume:false`）∥ 裸停反例 ⇒ 零入队 ∥ 缝缺省 ⇒ 零动作）；`node --check` 三档全 OK。
- 变异验牙（临时回退复跑、随还原）：MUT-1（turn-face 缝调用面空转）⇒ ⑰ 红；MUT-2（turn-driver 缝空转）⇒ ⑰ 红；还原后 17/17 复绿。
- 既有锁件复跑（改前 ∕ 改后逐件同绿集）：`2026-09-29-desktop-residuals-round3` 16/16⇒17/17 · `2026-09-28-desktop-session-title` 6/6⇒6/6 · `2026-09-29-missing-face-family` 9/9⇒9/9 · `2026-09-28-tech-debt-closeout-r6` 7/8⇒7/8（红 = r6-#425 先于本席）· `2026-09-29-enddiff-clearance` 13/13⇒13/13 · `2026-09-29-send-busy-timing` 13/13⇒13/13 · `2026-09-29-queue-pickup-edge-copy-susp-queue` 10/10⇒10/10 · `2026-09-29-queue-pickup-edge-copy-wq-parity` 9/9⇒9/9 · `2026-09-29-desktop-window-queue-parity` 7/9⇒7/9（红 = T1 ∕ T9 先于本席）· `susp-queue-window` 9/10⇒9/10（红 = W1 先于本席）· 扩展两件：`2026-09-29-parity-b4-vsc-small` 12/12⇒12/12 · `2026-09-29-parity-b8-ipc` 2/5⇒2/5（红 = ①③⑤ 先于本席）。
- `node scripts/doc-check.mjs`：闸态 **悬空 30** ∕ **行宽 65**（皆先于本席既存态；本席写域不在扫描面 ⇒ **零新增红**）；行数面新增**报告** 2 条（本席两档——见 ③）；全量输出留 `.thincoder/tmp/r3-f543-dc-after.log`（scratch，可删）。
- 行数实读（read 口径）：`turn-face.mjs` **166** · `turn-driver.mjs` **311** · 批内件 **728**。

**③ 决策透明表**

| 决策点 | 落值 | 依据 |
|---|---|---|
| 批内件新增臂落位 | 暂存件 `.thincoder/tmp/…`（`docs/batches` 副本零触） | 任务书「`docs/**` 零触」+ 波 A–C 在册潜行形（收位归父侧）；设计判据两腿全落 |
| 缝的容量档 | `queued.add` 非真 ⇒ `return`（零入队 ∕ 零帧）；注释在册 | 沿 `send` 忙态径既有判据（同原语同出镜点）；设计未给容量档 ⇒ 评审 🟡② 上抛 |
| 缺省缝臂 | 直驱 `createTurnFace` 省略 `onCapCancelled` ⇒ 断言 `stopped` 照常 ∧ 零错误帧 | 代码评审 🔵⑥（设计「缺省 ⇒ 零动作」面补验）——评后随评加臂，零产品码 |
| 文档面数值 | 不自行回填（PROJECT.md 行数账 ∕ IPC 标记 ∕ §2.13.3① 皆父侧笔） | 任务书「`docs/**` 零触」；doc-check 行数面 = 报告态 |

**④ 内部审计 ∕ 代码评审（轮次与终态）**

- 分歧审计（explore · 只读）**1 轮：VERDICT clean**（五核验点逐条 file:line 证据；记录面三项待办 = §5〔随本 append 关闭〕· IPC 去标记 ∕ 收位〔父侧〕）。
- 代码评审（advisor）**1 轮：VERDICT pass**（0 🔴；🟡4 ∕ 🔵4 全非 must-fix）——处置：🟡① `turn-driver.mjs` 越 300 顾问线（≥310 行）⇒ 登记建议（⑤）；🟡② 队满静默丢文（设计射程外）⇒ 上抛父侧裁；🟡③ 批内件两副本分叉 ⇒ 父侧收位（⑤）；🟡④ 记录面随动（IPC 两标记 + §2.13.3① + §5）⇒ 父侧笔；🔵⑤ 接受径 reason 不复核（可达性 unverified）⇒ 设计层裁；🔵⑥ 缺省臂 ⇒ **评后随评加臂**（见 ③）；🔵⑦ 批内件 728 行（>500 字面 vs 在册裁定不升级）⇒ 维持登记；🔵⑧ 设计表数值漂 ⇒ 收口轮重跑。
- **fix round = 0（产品码零修正）**；评后随评加臂 1 处（测试面），重跑 17/17。**终态 = clean**。

**⑤ 披露项（上抛 · 非本席笔）**

- 批内件收位：`.thincoder/tmp/2026-09-29-desktop-residuals-round3.test.mjs`（含臂 ⑰ 三腿）⇒ 父侧迁 `docs/batches/…`（现归档副本仅至 ⑯，落后一臂）；迁后按件内命令重跑。
- 文档面收正（父侧笔）：`IPC.md:30` ∕ `:419` 去「实施待落」标记；本档 §2.13.3① 收正；PROJECT.md 行数账随动（doc-check 读数：`turn-face.mjs` 表 153 ⇒ 实读 165，Δ+12 ∕ `turn-driver.mjs` 表 299 ⇒ 实读 310，Δ+11）；§2.3 表两行随收口轮重跑。
- 结构债登记建议：`turn-driver.mjs` **新越 300 顾问线**（≥310 行；本补遗轮为末次触碰轮，本批零拆沿 R3）。
- 触面：2 产品档 + 1 暂存批内件 + 1 scratch 日志；`docs/**` 零触；他档零触。

## §6 验证与收口（父代理）

### 6.1 收口（父侧 · 2026-09-29）

- **交付物全落（四波 + 补遗）**：**波 A**（#539 注释引注 ×7 ∕ #610「流内」改述 ×5 ∕ #618② 注值）∥ **波 B**（#541 cap 帧五档 ∥ #613 提交侧认领 ∥ #599 relay 保形；#543 语义半 = 回合判 `stopped`）∥ **波 C**（#617-CH 只读行 ∥ #617-CJ 非模态横幅 ∥ #615② 草稿种子）∥ **波 D**（#611 勘+登记 ∕ #615① 分档登记——零产品码）∥ **补遗轮**（#543 携文入队缝 `onCapCancelled`——两半合拢）。
- **批内件（归档）**：`docs/batches/2026-09-29-desktop-residuals-round3.test.mjs`（**17/17 绿**——含补遗臂 ⑰）+ `…-waveC-probe.mjs`（真机探针）——父侧收位 ✓。
- **锁件随动**：`structure-split-round` 重锚采纳（chrome after 族 + others 单点）⇒ **7/7**；`desktop-window-queue-parity:341` 正则重锚 ⇒ **9/9**；r8 ∕ i18n-split 等复跑同绿集（先于本批之红逐条归因在册）。
- **验证**：各波 16–17/17 ∥ 真机探针（波 C 畸形档 · 点击穿透）✓；doc-check 本批写域零新增红；**文档面** = #90（24 处）+ 父侧清标（`IPC.md` ×2 去「实施待落」∥ `PROJECT.md` 行数账 `turn-face` **165** ∕ `turn-driver` **310** + 越层段**十二档**入册 ∥ BB 行收正）。
- **集成面**：**不新增**（批内件 + 探针件形）。
- **结算同步清单**：① 角色表 ✓ ② 状态行 ✓ ③ 计数 ✓ ④ 指针 ✓ ⑤ changelog ✓（四档）⑥ **台账勾销：#539 ∥ #541 ∥ #543 ∥ #599 ∥ #610 ∥ #611 ∥ #613 ∥ #615 ∥ #617 ∥ #618 ∥ #653 → 已核销**（两步）；**#581 转 RF**（附 A——其 §6 核销）⑦ 前批遗留交叉核：`enddiff-clearance` 转批（#581 → RF）✓。
- **遗留（显式）**：**#651**（越层登记——拆分预案待裁）∥ **#656**（队满可见形——归批）∥ GUI 真机腿（父侧探针位）∥ `suspension-drive.mjs` 337 越层（续期在册）。
- **收口结论**：本批终止。
