# 2026-09-28 · 桌面 · 子 agent 块跟滚接线（核件留端补接）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-28 · 来源 = 用户 2026-09-28 18:15–18:17 走查（「子agent区块里面的内容都不滚动！」→ 质问核件「这个为什么要留端」）；父侧实读 = 核件留端清单（`initBlockFollow`/`maybeScrollBlock`/`maybeScrollActivity`）· VSC 已接（`activity.js:160-176` + 帧尾调用）· 桌面零接线。
> 台账 = #518（docs/desktop/requirements/PROJECT.md · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：进行中（复启（排查已落地·处置归本批）·设计轮已派）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 来源（用户 2026-09-28 18:15–18:17 走查 + 设计质问）

原话：「子agent区块咋还是没跟vsc对齐？里面的内容都不滚动！」→「核件明确写了『块级跟滚接线（initBlockFollow）= 留端』——这么愚蠢的设计？这个为什么要留端啊！有什么理由啊！」

### 1.2 实读定性（父侧 · 三端对照 + 归因）

- **核件留端清单在册**（`thincoder-render-core/subblocks/block.mjs` 档头）：出生位 ∕ 说明行判重与插入点 ∕ **区钉底（`maybeScrollActivity`）** ∕ **块级跟滚接线（`initBlockFollow`）** ∕ 痕迹 ∕ 帧调度。
- **VSC 已接**：`thincoder-vscode/webview/activity.js:160-166`（`initBlockFollow`——wheel/touchmove ⇒ 近底 24px 写 `_pinFollow`）· `:171-176`（`maybeScrollBlock`——`isConnected` ∕ `open` ∕ `_pinFollow !== false` 三重守卫 ⇒ `scrollTop = Number.MAX_SAFE_INTEGER`）；调用面 `webview/streaming.js:31-32`（帧尾 `subScroll` + `frameEnd`）。
- **桌面零接线**：`renderer` 全树 `advisor-content` 仅两处命中（`core.css:285` 样式 ∕ `views/activity.mjs:248` 说明行插入）——零滚动写者；对照 = 会话流主跟滚（`views/chat-scroll.mjs`）另有其面，**不覆盖块内容区**。
- **归因（父侧 · 附据）**：① 该接线源出 VSC 2026-09-11 设计（`WEBVIEW.md` §13.3 C-LU1，彼时住 `webview/activity.js`）；② 核化时划入「留端」（档头在册）——边界为「DOM 构件核化 ∕ 帧调度与滚动策略留端」；③ **align-2 审计盲区**：「滚动跟滚主机制」被标「已搜未得（零缺口面）· 各自在册等价」（`docs/batches/2026-09-28-desktop-vsc-align-2.md:79`）——只查会话流主滚动，漏块内容区（#494 推理块钉底 = 同族已修；本项 = 子 agent 块面）。
- **留端的技术账 ∕ 工程账（父侧裁读）**：技术账可解释（调用时机属端侧帧循环——VSC 帧尾脏块集 + 写超值不读 `scrollHeight`；钉底 ∕ 不夺阅读位属各端 UX 策略面）；**工程账不成立**——函数本体纯 DOM、零调度依赖，可提核共用，端侧只留「何时调」；且核自 `paintReasoningTarget` 即自带 pin 先例（核并不避讳 scrollTop）。现状 = 同一份十余行逻辑要求每端复刻 ⇒ 注定再漏（本轮即证）。

### 1.3 本批条目（拟 · 设计轮定形）

- **B1 块内容区跟滚**：桌面补核件留端语义（wheel/touchmove ⇒ 近底判据写 `_pinFollow`；帧尾 ∕ 刷新点 ⇒ 钉底写 `scrollTop`）——行为对齐 VSC §13 C-LU1（含折叠 ∕ 已移除 no-op、不夺阅读位）；
- **B2 留端清单逐项对账**：区钉底（`maybeScrollActivity`）∕ 出生位 ∕ 痕迹等余项——凡桌面未接 ⇒ 本批补或显式登记（防同族再漏）；
- **B3 形态裁定**：**提核共用件** ∥ 端侧复刻——父侧倾向提核（纯 DOM 零调度依赖 · `paintReasoningTarget` 先例 · 防第三端再漏），设计给由定稿。

### 1.4 边界与串行

核件改动仅限「提核」被裁定时（纯函数搬移 + 端侧调用点，行为零变）；不新增机械门；桌面文件面与在途批同片 ⇒ 串行（在途 = 会话标题批（设计在跑）· 回填轮 #511 ∕ 拆档批 #510 在册）。

### 1.5 落点

台账 = **#518**（待设计 → 在途）；同族 = #494（推理块钉底 · 已核销）· #496（子 agent 块接核件 · 已核销）；需求档 D 点随落 = 父侧。

### 1.6 处置：设计暂缓（用户 2026-09-28 18:24 指令 + 全量排查归批）

用户原话：「块跟滚设计还跑着干嘛？！」——承 18:19 指令「先全量排查，再按类归批，不要我说一句你就开一批」。

- ① 设计舱（eng-designer #2）**已撤**（撤时**零文件改动**——§2 未落笔，实读确认）；
- ② 本批**暂缓 ∕ 保留**（不废）：批档 ∕ 台账 #518（在途）在册；
- ③ 待全量排查两份报告（explore #3 = render-core 留端 × 三端矩阵 · explore #4 = core 缝 ∕ 注入面 × 三端）落地 ⇒ **按类归批**：本项大概率并入「留端对账」类批一次做掉（含 B3「提核 ∕ 端侧」裁定）；排查落地前本档 §2 零写入；
- ④ 复核时点 = 排查报告入档（父侧）。

### 1.7 复启（2026-09-29 03:1x · 父侧）

- **复核条件已满足**（§1.6 ④）：全量排查已入档——`docs/batches/2026-09-28-desktop-feature-parity.md` §2.3「对账节」第 3 项：区钉底 ∕ 块级跟滚 =「零接线」⇒ 处置 = **归先落者 = 本批**（≠另立「留端对账」批）；同批 `:485` 已否「端侧复刻」（第二实现 = 漂移面）。
- **用户 2026-09-29 03:10–03:12 走查复报**：子 agent 块输出仍不滚（修复从未进实施）；亲斥「都不用老子说话，就会自动帮老子暂缓」⇒ **复启不得再向用户索要指令**。本批实证 = 冻批复核条件写进 §1 而无人触发 ⇒ 8.8h 空转——过程教训另记台账。
- **处置 = 复启**：设计轮即派（本会话 · 承 §1.3 B1/B2/B3）；桌面文件面串行约束照旧（§1.4）。

### 1.2 #44 设计交付收下 + 两上抛裁定（父侧 · 2026-09-29 03:2x）
- **交付**（#44 · initial）：§2.1–2.8 全节（六项对账表 · 提核裁定 B3 · P1–P6 实施序 · 验收 A1–A6）＋设计正文五档（`RENDER-CORE.md` KD-RC-8 ∕ `RENDERER.md` §3 ∕ `UI.md` §1 本批注 ∕ `PROJECT.md` §10 BT ∕ `WEBVIEW.md` §5.5）。自检：read-back 五档 ✓ · 行宽 0 · doc-check 本舱 Δ=0（锚 174⇒170）· 产品码零写。
- **U1 裁定 = 准（含 P2 · VSC 改指）**：多实现面纪律默认消除（同一机制落两份 = 漂移面）+ R2 先例（机械 · 行为零变）⇒ 「核 ∕ 桌面两树」定界不构成保留副本的理由；实施须 VSC 改指。
- **U2 裁定 = 已落**：判据句已并入需求档 **D4 ∕ D20**（主 agent 笔权 · 父侧直接执行〔可 revert〕）+ §变更记录一行；**零新 D 行**（D 表仍 D1–D27）。
- **U3 维持**（值面两行并批）· **U4 披露收下**（区钉底帧尾径缺口 = 本轮对账发现）。
- **发现项收下**：doc-check 存量 170 锚 ∕ 行宽 1 = 归文档残留轮（#45 在飞）；§4.2 未落行 = 微批口径随实施轮落。
- **下一步**：设计评审点火（父侧代执行——排空授权内）→ pass + 修正落地后 §4 → 实施轮。

### 1.8 双线协调注（2026-09-29 03:3x · 本会话父侧）

- **本会话复启时（03:15）派出之设计舱已于 03:34 撤回**（HALT 令 · **零写零退** · 收尾报在案）——因另一活跃会话（并行线）同期已全程推进本批：设计 #44 交付（提交 `5617954b`）→ §3 评审（changes-required · 7 项）→ **§2.9 修正轮全数落定**（落盘 03:33）。
- **撤回前独立复核**（本会话舱 · 零写）：五档落点逐处核读（`RENDER-CORE.md:114/135/136/164/207/286/307/418` · `RENDERER.md:30/122-123` · `UI.md:476` · `WEBVIEW.md:320/453` · `PROJECT.md:188/189/205/226/531-538/645/1068-1069`）+ 行数对盘（`activity.mjs` 259 ∕ `core.css` 281 ∕ 两搜索端壳 26 ∕ 18）——与 §2.9 声言一致。
- **双写核查**：并行两线写域时序错开、各写各节，抽查未见互相覆盖；本批推进权归并行线（其父侧跟 §4）。
- **批现态** = 设计 + 评审 + 修正轮全落定 ⇒ **§4 待用户批准**（批准 → §5 实施）。

### 1.3 #48 复审通过 + 实施轮派发（父侧 · 2026-09-29 03:4x）
- **复审（轮 2 · 只验七条）**：**pass**——7 条 = Fixed **5**（#1 搜索单源相抵全消、#3 池面对位、#4 四点枚举、#6 T-DSK18、#7 heartbeat 行）· 部分修 **2**（#2 残 🔵：`pool-subagents.mjs` ∕ `activity-new.mjs` 两档 §4.1 行未补〔§4.2 已就地给数〕；#5 残 🟡：D-W13 括注「`activity.js` 持旗标 + wheel/touch 让位 + rAF 帧应用」与 §5.5 相抵）· 新观察 **1**（🔵：两处批次期「桌面无搜索」语句未注记——PROJECT:732 ∕ UI:427）。**非阻塞**（平台已判 pass）。
- **机检警报核销**：平台引用机检报 0 ∕ 27 不匹配 = **误报**（匹配器受引注批注格式致盲）；父侧逐点复核在盘——`createSearch` ∕ `拆 9` ∕ `桌面已承载` ∕ `接线四点` ∕ `heartbeat.mjs 47` ∕ `≤ 40px` 全实锤；三档 git 干净（#47 后零覆写）。
- **token 已签发**（值不落档）；**三条件齐** ⇒ 实施轮已派（eng-coder · P1–P6 · 测试件暂存 `.thincoder/tmp/`——写门所限，父侧收位）。
- **残项归档**：#2 ∕ #5 残项 + #8 观察 → 随下一桌面设计面轮（不阻塞实施）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（initial 轮 · #518 · 对账表+文件表+实施序在册）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.0 交付形态 · 判据 · 计量口径（去重）

**交付物** = 本 §2（任务书）+ 设计正文**五档随落（本轮已全部落盘）**：`docs/render-core/design/RENDER-CORE.md`（§2 **KD-RC-8** + §3 行 4 ∕ §5 构件族 ∕ §6 行数账）· `docs/desktop/design/RENDERER.md`（§3 增两条 + §1.1 触面枚举）· `docs/desktop/design/UI.md`（§1 增「本批注（子 agent 块内容区跟滚 · #518 收口）」+ 项 3 行内指针）· `docs/desktop/design/PROJECT.md`（§10 **BT**）· `docs/vsc/design/WEBVIEW.md`（§5.5 内层 ∕ 帧驱动 + §3 `activity.js` 行）。五档 changelog 各一行。

**判据（三态 · 沿 KD-42 与「对齐」口径）**：复用 ∕ 上提 ∕ 真端差；**举证不足 ⇒ 消除**；本批零「真端差」项。

**计量口径**：行数 = 内容行数口径（文末换行不计；本轮为设计轮实读，实施轮以届盘为准）。

### 2.1 本批条目（§1.3 B1–B3 逐条落点）

| 号 | 条目 | 落点 | 态 |
|---|---|---|---|
| B1 | 块内容区跟滚（桌面补核件留端语义） | 核原语提核（P1）+ 桌面四点接线（P3）；行为对齐 VSC `webview/activity.js:160-176`（§5.5） | 归本批落（主体） |
| B2 | 留端清单逐项对账（六项） | §2.2 对账表（六项逐项）；含两处「归本批落」（块级跟滚 ∕ 区钉底帧尾径）+ 表外同族两值 | 归本批落 |
| B3 | 形态裁定：提核 ∥ 端侧复刻 | **裁定 = 提核**（§2.3；KD-RC-8 全表 = 核档 §2） | 已裁定 |

### 2.2 核件留端清单逐项对账表（KD-42 强制输入 · 现读原档 · 台账 #518 根因面）

现读输入 = `thincoder-render-core/subblocks/block.mjs:5-6`（档头「留端：」行——项级一行，**每次现读、不抄副本**）——六项逐项：

| # | 留端项（现读） | 桌面现状（file:line 实读） | 处置 | 理由 / 备注 |
|---|---|---|---|---|
| 1 | 出生位（活动区区尾 append） | 已接 —— `renderer/views/pool-subagents.mjs:76-85` `createSubBlock` 族尾 `family.append` | 已接 | 端形 = 池族容器（VSC = `#subagent-activity`）——重定位已裁（R10） |
| 2 | 说明行判重与插入点 | 已接 —— `pool-subagents.mjs:78-80`（族内首块一次性 + `.advisor-content` 前插入） | 已接（存差在册） | 判据**会话级**（桌面）⟷ 面板级（VSC）= `UI.md:320` 存差登记（待裁——消差 ∕ 保留）；本批零触 |
| 3 | 区钉底（`maybeScrollActivity`） | **半接**：出生径在（`views/activity-new.mjs:35-43` `notePoolBirth` + `:95-98` `scroll` 旗标 + 计数钮 R10 E6）；**帧尾径零** | **归本批落（帧尾径补）** | VSC `streaming.js:32` `frameEnd` 每帧重写；桌面流式期区随长 ⇒ 帧尾补一写 = `maybePinPool`（P3） |
| 4 | 块级跟滚接线（`initBlockFollow`） | **零接线**（renderer 全树 `initBlockFollow` ∕ `_pinFollow` 零命中） | **归本批落（主体）** | 核原语提核 + 桌面四点接线（P1 ∕ P3）；语义对齐 VSC §5.5 |
| 5 | 痕迹 | 零面 —— 判**不落**（父侧已裁） | **明确留端（已裁）** | 承 R5 裁③「痕迹不落」（`docs/batches/2026-09-28-desktop-feature-parity.md` §5 D3 行）；本批零触 |
| 6 | 帧调度 | 端侧各自（桌面 = store 变更帧 + 2s 拍；无 rAF） | **明确留端（端帧模型）** | 核原语零调度依赖（KD-RC-8 边界）；桌面应用 = 直调（非脏集） |

**计数（D3）**：六项 = 已接 **2**（1 / 2）· 归本批落 **2**（3 帧尾径 / 4）· 明确留端 **2**（5 / 6）。

**同族发现（表外 · 本批补 · 供复核）**：`.sub-block .advisor-content` 高度 ∕ `.sub-block > summary` 透明度两值——R10 映射源范围（VSC `chat.css:298-374` / `:328-371`）未含 `:466-467` ⇒ 桌面缺 60px ∕ 0.75 两条（现盘 = 基础 100px ∕ 无透明度，`renderer/core.css:115-123` / `:155-158`）——**本批补**（P4；值源逐字）；漏项成因同族于 #518（映射范围外），已入 §2.7 验收。

### 2.3 裁定：提核（B3 定稿）

**裁定 = 提核共用件**（核件接线出口 + 桌面消费；VSC 改指随迁）。逐字口径：核件持**原语**（怎么调），端侧持**调用时机**（何时调）。

**理由**：① 函数本体纯 DOM、零调度依赖——不触「宿主无关」边界（核内先例 = `paintReasoningTarget` 已写 `scrollTop`，`flow/stream.mjs:27-30`）；② 同一份十余行逻辑要求每端复刻 ⇒ **已证漏**（#518：桌面零接线；align-2 审计盲区之根因）；③ 原「留端」的技术账可解释、**工程账不成立**（§1.2 父侧裁读）。

**影响面**：① 核 `subblocks/block.mjs` += 两导出（纯搬移）；② 桌面 = 消费方（四点接线 + 区帧尾）；③ **VSC = 改指**（本地两函数删净、改指核件——机械 · 行为零变 · 先例 = R2 换接）——不随之则同一机制落**两份实现**（多实现面纪律默认消除）；④ 文档面五档随落（§2.0）。

**被否候选（全表 = 核档 §2 KD-RC-8）**：端侧留端（每端复刻——已证漏）· 端侧复刻（桌面第二实现 + 双源漂移面）· 核持调度（rAF ∕ 帧模型属端——违「与宿主无关」定性边界）。

### 2.4 机制设计（落点级）

1. **核原语（P1）**：`thincoder-render-core/subblocks/block.mjs` += `initBlockFollow(block)`（`.advisor-content` 挂 `wheel` / `touchmove`（passive）⇒ 近底 24px 判据写旗标 `_pinFollow`）· `maybeScrollBlock(block)`（三重守卫 = `isConnected` ∧ `open` ∧ `_pinFollow !== false` ⇒ `scrollTop = Number.MAX_SAFE_INTEGER`）——**自 VSC `webview/activity.js:160-166` ∕ `:171-176` 逐字搬移**；档头留端清单收正（块级跟滚移出留端项 ⇒ 表述为「原语住本档 · 调用时机留端」）。
2. **桌面块内容区接线（P3）**：`renderer/views/pool-subagents.mjs` 四点——① `subElementOf` 尾 `initBlockFollow(element)`（出生 ∕ 接管共用点，同 VSC `buildBlockEl`）；② `replayRows` 追加段后 `maybeScrollBlock(element)`（内容增量）；③ `createSubBlock` `family.append` 后 `maybeScrollBlock(element)`（挂载补钉——重挂重放场景）；④ 接管径 `replaceWith` 后 `maybeScrollBlock(next)`。折叠 ∕ 已移除 = 原语 no-op；`_pinFollow=false` ⇒ 零写（不夺阅读位）。
3. **桌面区帧尾（P3）**：`renderer/views/activity-new.mjs` += `maybePinPool(root)`（`_poolPin !== false` ⇒ `scrollTop` 写 MAX；`notePoolBirth` 复用该写）；`renderer/views/activity.mjs` `mountPool` 尾调用（VSC `streaming.js:32` `frameEnd` 对位）。
4. **VSC 改指（P2）**：`webview/activity.js` 删两本地函数 ⇒ import 并入核件行（`renderSubBlock` 同模块）+ 保留 `export { maybeScrollBlock }` 转口 ⇒ `webview/streaming.js` **零改**；档头注随动。
5. **值面（P4）**：`renderer/core.css` ④ 段 += `.advisor-block.sub-block .advisor-content { max-height: 60px }` · `.advisor-block.sub-block > summary { opacity: 0.75 }`（值源 = VSC `chat.css:466-467` 逐字；档头值源行同拍）。

### 2.5 受影响文件与测试面（实读 = 内容行数口径 · 2026-09-29 本舱）

| 树 | 档 | 现读 ⇒ 预期 | 变更 |
|---|---|---|---|
| 核 | `thincoder-render-core/subblocks/block.mjs` | **45 ⇒ ≈66** | +2 导出（纯搬移）+ 档头留端句收正 |
| VSC | `thincoder-vscode/webview/activity.js` | **190 ⇒ ≈176** | 删两本地函数 ⇒ 改指核件（import + 转口）；档头注 |
| VSC | `thincoder-vscode/webview/streaming.js` | **182 零改** | 转口保留 ⇒ 零触 |
| 桌面 | `renderer/views/pool-subagents.mjs` | **108 ⇒ ≈118** | +import + 四点接线 |
| 桌面 | `renderer/views/activity-new.mjs` | **100 ⇒ ≈109** | +`maybePinPool` + `notePoolBirth` 复用 |
| 桌面 | `renderer/views/activity.mjs` | **259 ⇒ ≈262** | `mountPool` 尾一调 + import |
| 桌面 | `renderer/core.css` | **281 ⇒ ≈287** | +两值规则 + 值源行 |
| 测试 | `docs/batches/2026-09-28-desktop-subblock-follow.test.mjs` | 拟新增 | 批次本地件（随批留存 · 不入仓套件） |

四档产品码皆 ≪300 ✓（VSC `activity.js` 190 ⇒ ≈176 回线内）。

**测试面（批次本地件口径）**：复跑 = `node --test docs/batches/2026-09-28-desktop-subblock-follow.test.mjs`。用例面四组 = ① 核心原语（默认钉底写 ∕ 近底双向写旗标 ∕ 让位零写 ∕ 守卫 no-op：折叠 ∕ 已移除 ∕ 无内容区）② 桌面接线（增量 ⇒ 写；`_pinFollow=false` ⇒ 零写；接管 ⇒ 新元素回默认跟底）③ 区钉底（`_poolPin` 两向）④ 值落点锁（core.css 两值逐字）。**harness 已实证**（本舱 probe 实跑）：`../../thincoder-desktop/test/rc-resolve.mjs`（静态 import 注册钩子）⇒ 动态 import 渲染档（`/rc/` 取件）+ mini 假 DOM（`document` 最小实现）⇒ `syncSubBlocks` 全通路可跑。

### 2.6 实施序（逐步可执行）

**P1** 核原语提核（纯搬移 + 档头收正）→ **P2** VSC 改指（行为零变）∥ **P3** 桌面接线（四点 + 区帧尾）→ **P4** 值面两行 → **P5** 批次本地测试件 → **P6** 验证（`node --check` 全档 + 跑批次本地件 + 父侧真机走查）。P1 先行（P2 ∕ P3 依赖核导出）；P2 ∥ P3 不同树可并行；P4 ∥ P5 最后。

### 2.7 验收对照（回指 B1–B3 · 用户可观察行为并机检具体化）

| 号 | 验收（用户可观察） | 机检具体化 |
|---|---|---|
| A1 | 流式内容跟滚：子 agent 运行中，块内容区随内容自动保持底部（最新行可见） | 接线例：增量 ⇒ `内容区.scrollTop === MAX_SAFE_INTEGER` 写 |
| A2 | 近底复跟：用户上滚后滚回近底（< 24px）⇒ 恢复跟随 | 旗标例：`wheel` 双向 ⇒ `_pinFollow` 真 ∕ 假 |
| A3 | 上滚不抢：流式期用户上滚（> 24px）⇒ 内容区不再被拉动 | 让位例：`_pinFollow=false` 后增量 ⇒ 零写 |
| A4 | 换块行为：新代接管 ⇒ 新元素默认跟底；折叠 ∕ 已移除块零滚动副作用 | 接管例 + no-op 例（`open=false` ∕ 非在连） |
| A5 | 区近底保持：流式期池区不漂移（近底保持） | 区例：`_poolPin` 两向 ⇒ 写 ∕ 零写 |
| A6 | 形对齐：块内容区高 60px · 表头 0.75 透明度（VSC 同值） | 值落点锁（两规则逐字） |

**判据句（供父侧落需求档 §4 D20 ∕ D4——需求档笔权在父侧）**：「子 agent 块内容区流式**跟滚**（最新内容保持可见）· 用户上滚**不抢**（不夺阅读位）· 回到近底**复跟**；子 agent 区（右列）流式期近底保持」——建议措辞，落点与加工归父侧。

### 2.8 关键决策与上抛（供评审 ∕ §4）

| # | 项 | 类型 | 处置 |
|---|---|---|---|
| U1 | VSC 改指（P2）——居父侧「核 ∕ 桌面两树」定界外一笔 | 上抛（归父侧裁） | 依 = 多实现面纪律默认消除 + R2 先例；若维持两树边界 ⇒ 摘除 P2 并转出（VSC 留副本 = 待消除差异） |
| U2 | 需求档判据句（§2.7 末行） | 上抛（需求档笔权归父侧） | 建议文本在册；本舱零触需求档 |
| U3 | 值面两条（P4）——表外同族发现 | 已并入本批设计 | 若父侧判越界 ⇒ 单点摘除（两行 CSS）；单源 = `UI.md` 本批注项 3 |
| U4 | 「区钉底」原为「已接」读法——帧尾径缺口为本轮对账发现 | 披露 | 依据 = VSC `streaming.js:32` `frameEnd` × 桌面帧模型对照；补法 = `maybePinPool` |

**需求档合规检查（eng-designer 侧 · 五要素口径）**：D4 ∕ D20 覆盖「子 agent 块面」（内容回显 / 态机 / 归档入流），**未含**「块内容区跟滚 ∕ 上滚不抢 ∕ 区近底保持」判据句——属需求档缺口（详见 U2）；其余依赖面（宿主通道 / 核件加载形）在册，设计可写。**本舱零触需求档。**

**边界（本批不做）**：会话流主跟滚面（R12 既落在册）· marks ∕ 态机三面 ∕ goal（R5 已落）· 核件其余留端项（出生位 ∕ 说明行 ∕ 痕迹 / 帧调度——§2.2）· 机械门零新增。

### 2.9 修复轮（评审轮 1 · 发现 1–7 逐条落地 · eng-designer · 2026-09-29）

**输入** = 批档 §3 轮次 1（VERDICT: changes-required · 🔴1 ∕ 🟡4 ∕ 🔵2）+ 父侧逐条裁定接受与逐号落点指令（7 项）；**处置执行 = 本舱**；**零产品码触**；§3 与需求档零触（U1 ∕ U2 已由父侧处置——不重开）。

| 号 | 落点（file:line） | 态 |
|---|---|---|
| 1 · 🔴 搜索 | `docs/render-core/design/RENDER-CORE.md` §3 行 32（`:114`）判定 端 ⇒ **拆**（实读盘面：VSC `thincoder-vscode/webview/search.js` = 18 行端壳 ∕ 桌面 `thincoder-desktop/renderer/search.mjs` = 26 行端壳 ∕ 实现整件入核 `thincoder-render-core/search.mjs` `createSearch`）+ 计数行（`:135`）核 9 ∕ 拆 8 ∕ 端 34 ⇒ **核 9 ∕ 拆 9 ∕ 端 33** + 静置面句（`:136`）四档 ⇒ 三档 + §4 行 20（`:164`）「桌面本轮不承载」⇒ **已承载** + §5（`:207`）构件族补 `createSearch` + §6（`:286` 档数 17 ⇒ **18** ∕ `:307` `search.js` 行补登＝依评审「两端受影响文件账同拍补登」臂）；`docs/desktop/design/PROJECT.md` §4.1（`:188`）与 §4.2（`:484`）search 档行实读补（**26 行**） | 落定 |
| 2 · 🟡 行数账 | `PROJECT.md` §4.1 `views/activity.mjs`（`:205`）**321 ⇒ 259** ∕ `core.css`（`:226`）**345 ⇒ 281**（盘面实读取一 · 实读 2026-09-29）——**未越 300**，越层段（`:239-240`）两档除名；§4.2（`:529-538`）增本批「现行 ⇒ 预期」块 = 四档（`pool-subagents` 108 ⇒ ≈118 ∕ `activity-new` 100 ⇒ ≈109 ∕ `activity` 259 ⇒ ≈262 ∕ `core.css` 281 ⇒ ≈287）+ 测试面 + 设计档；核档 §6 与 §4.1 同拍（259 ∕ 281 ∕ 108 ∕ 100） | 落定 |
| 3 · 🟡 记录≠正文 | `docs/desktop/design/RENDERER.md` §1.1（`:29-30`）「DOM 触面四处」的「帧尾滚动作」**落笔补池面对位**（`settleFrame` ∕ 池面 `mountPool` 尾——与 §3 池区帧尾钉底条自洽；行拆两行守 300）——取「落该笔」臂（记录句随实转真） | 落定 |
| 4 · 🟡 四点枚举 | `RENDERER.md` §3（`:122-123`）与 `docs/desktop/design/UI.md` §1 本批注项 1（`:476`）**四点枚举统一**＝① 出生 ∕ 接管（`subElementOf`）· ② 内容增量（`replayRows` 追加后）· ③ 挂载补钉（`createSubBlock` `family.append` 后）· ④ 接管径补钉（`replaceWith` 后）——同序号同指位 | 落定 |
| 5 · 🟡 WEBVIEW 两处 | `docs/vsc/design/WEBVIEW.md` §3（`:320`）读数 **450 ⇒ 190**（R2 提核后实读；本批 ⇒ ≈176）· 撤「越 300」句；**D-W13**（`:453`）载体句 ⇒ 「**原语入核 · 本端留调用点 ∕ 帧驱动**」（与 §5.5 `:399-401` 自洽；被否候选面不动） | 落定 |
| 6 · 🔵 验收数值 | `PROJECT.md` §7 T-DSK18（`:645`）scrollTop ≤ 48 ⇒ **≤ 40px**；「100 块」⇒ 按核 `historyWindow` 缺省 200 条口径（条 ≠ 块） | 落定 |
| 7 · 🔵 缺行 | 实核 `thincoder-desktop/renderer/heartbeat.mjs` = **在盘**（47 行）⇒ `PROJECT.md` §4.1（`:189`）**补行**（现行行数 + 结构注 = 2s 拍面 ∕ 判据三件同序——单源 = `RENDERER.md` §1.1 拍面条） | 落定 |

**变更记录行同笔**（五档各一行）：`RENDER-CORE.md:418` · `RENDERER.md:200` · `UI.md:624` · `WEBVIEW.md:707` · `PROJECT.md:1068-1069`。

**机检（node scripts/doc-check.mjs）**：前 = 悬空 173 ∕ 行宽 9（本域五档：悬空 63 ∕ 行宽 7；拟新增 28）；后 = 悬空 173 ∕ 行宽 9（本域：63 ∕ 7）——**Δ = 0**（本域悬空 Δ ≤ 0 ✓ · 行宽无新增 ✓；PROJECT 唯一超宽行 = 531 字符 = 存量行位置平移，非新增）。**read-back：五档逐处核过**（逐处上下文核读——含 §4.2 块整表核读）。

**边界说明（只报）**：§6 判定表 17 ⇒ 18 档 + `search.js` 行补登 = 依评审 Suggestion「§5 导出面与两端受影响文件账同拍补登」之「受影响文件账」臂落（父侧指令列 §5 导出面 ∕ 连带 PROJECT 行；§6 = VSC 侧受影响文件账）——若判越界 ⇒ 单点摘除（一行 + 档数两字）。**除 7 项外零扩面、零新语义**。

**同舱观察（非本批面 · 零触）**：① §4.1/越层段存量档位与现盘漂移（示例：`events.mjs` 标 497 ∕ 现盘 246；`mount-pool.mjs` 标 89 ∕ 现盘 95；`renderer/styles.css` 已被拆/改名 ⇒ 全仓 173 悬空之主源）——归台账 **#551** 统一届盘重锚（feat-parity 批档 §1 已登记）· 归文档回填轮；② `WEBVIEW.md:462` D-W22 内「450 行」为 as-of 决策理由面（dated）⇒ 未动（本批射程外）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

设计评审（第五轮·本评审实例）发现表 —— 射程 = RENDER-CORE.md ∕ desktop/{RENDERER,UI,PROJECT}.md ∕ vsc/WEBVIEW.md（评审限制：无项目标准档 ⇒ 方法学按 Project Guide + 档内自定纪律判；无文档地图 ⇒ ownership 判据退化；需求档不在射程 ⇒ 需求符合度只经档内引用判；盘面实读核验超出射程——相关数字标 unverified）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership | 🔴 | 「会话内搜索」同一机制两档相抵：`docs/desktop/design/UI.md:16`「键位注册住核件工厂 `thincoder-render-core/search.mjs`，两端同件单源」∥ `docs/render-core/design/RENDER-CORE.md:114`（§3 行 32）「`search.js` = 端 · 端搜索面；桌面本轮不承载」+ `:136` 静置面「`search.js` … 在本轮核化射程外」+ `:164`（§4 行 20）「搜索（`search.js`）桌面本轮不承载（VSC 端面）」——搜索实现单源归属（核 ∕ 端）与桌面承载两面互斥；UI.md 所指核件在核档 §3 判定表 ∕ §5 导出面 ∕ §6 受影响面零登记（核 9 ∕ 拆 8 ∕ 端 34 计数与静置面句同受影响）。 | 先裁定以哪一侧为准，再单侧收正：若确已入核 ⇒ RENDER-CORE §3 行 32 判定 + 计数行、`:136` 静置面句、`:164` §4 行 20、§5 导出面与两端受影响文件账同拍补登；若仍属端侧 ⇒ `UI.md:16`「核件单源」句收正（该能力面落点核对同拍）。 |
| 2 | Affected-file annotations | 🟡 | 本批（子 agent 块跟滚）桌面四档行数账只住 `RENDER-CORE.md:314`（`views/pool-subagents.mjs` 108 ⇒ ≈118 · `views/activity-new.mjs` 100 ⇒ ≈109 · `views/activity.mjs` **259 ⇒ ≈262** · `renderer/core.css` **281 ⇒ ≈287**），与本端预算单源 `PROJECT.md:200`（`views/activity.mjs` **321**——实读 2026-09-28）∕ `PROJECT.md:222`（`core.css` **345**——实读 2026-09-28）同两档数值不一致（259∕281 对 321∕345——越 ∕ 未越 300 线判定相反）；`views/pool-subagents.mjs` ∕ `views/activity-new.mjs` 在 PROJECT.md §4.1 无行、§4.2 无本批行（本端自定「逐文件预算单源 = PROJECT.md §4.1」——`RENDERER.md:11`）。 | 以盘面实读取一为准（两档各定单值），把本批四档「现行 ⇒ 预期」补入 §4.1 行 ∕ §4.2 本批行（就地给数），消与 `RENDER-CORE.md:314` 的差异；越 300 判定随实读值同拍。（unverified——盘上核验超出射程） |
| 3 | Doc-state | 🟡 | `RENDERER.md:196` 变更记录声称「§1.1 「DOM 触面四处」枚举的「帧尾滚动作」补池面对位（`mountPool` 尾）」，但正文 `RENDERER.md:29` 仍为「帧尾滚动作（`settleFrame`——本档 §3）」——无池面对位（§3 已定义池面帧尾动作 `:123`，边界条 `:124` 点名）。 | 落该笔（「帧尾滚动作」条目补池面 ∕ `mountPool` 尾对位）或收正记录句，使正文与记录、与 §3 两条自洽。 |
| 4 | Clarity | 🟡 | 同一机制应用点计数两档不可互推：`RENDERER.md:121`「`maybeScrollBlock`（应用四点：① 内容增量逐批 = `replayRows` 追加后 ② 挂载补钉 = `createSubBlock` `family.append` 后 ∕ 接管 `replaceWith` 后）」——「四点」仅枚举 ① ②（② 含两径）；`UI.md:480` 本批注项 1 枚举为「四点接线 = 出生 ∕ 接管（`subElementOf`）· 内容增量（`replayRows`）· 挂载补钉（`createSubBlock` ∕ 接管径）」。 | 统一四点枚举与序号（出生 ∕ 接管 ∕ 内容增量 ∕ 挂载补钉）及逐点调用位置，两档同拍。 |
| 5 | Doc-state | 🟡 | WEBVIEW.md 两处未随：（a）`WEBVIEW.md:320`「`activity.js` 现 **450 行**（as-of 2026-09-20）… 越 300 建议线」对 R2 后现值（`RENDER-CORE.md:299` R2 实读 **190** · `:313` 本批 190 ⇒ ≈176）为陈旧当前态陈述；（b）`WEBVIEW.md:453` D-W13「块级跟滚载体落 `activity.js`（旗标 + wheel/touch 让位 + rAF 帧应用）」对 `WEBVIEW.md:399-401` §5.5（原语 = 核 `subblocks/block.mjs`；本端 = 调用点）与 `RENDER-CORE.md:74` KD-RC-8 ∕ `:86` §3 行 4（提核）为陈旧载体句。 | （a）行数按 R2 ∕ 提核后实读收正（撤「越 300」句）；（b）D-W13 载体句收正为「原语入核 · 端留调用点 ∕ 帧驱动」（被否候选面不动）。 |
| 6 | Acceptance | 🔵 | 验收行数值滞后：`PROJECT.md:608` T-DSK18「scrollTop ≤ **48**」「取更早一页（**100 块**）」对 `RENDERER.md:112` ∕ `:134` 机制单源（阈值 **40px**；页量 = 核 `historyWindow` 缺省 **200 条**——条 ≠ 块；R12 同步轮已收 §3 ∕ §4，未及 §7）。 | T-DSK18 同拍：阈值 40px；页量口径改「按核缺省页量·条 ≠ 块」（或就地注 as-of）。 |
| 7 | Affected-file annotations | 🔵 | `RENDERER.md:84` 声称「2s 拍面（R10 落）：`thincoder-desktop/renderer/heartbeat.mjs`」，但本次三档 grep 范围内 PROJECT.md §4.1 ∕ §4.2 未见该档行（受影响文件账缺行）。 | §4.1 补行（现行行数 + 结构注）或与发现 2 同拍收正。 |

计数：🔴 1 · 🟡 4 · 🔵 2 = 7 项。

VERDICT: changes-required

### 轮次 2（评审子代理）

**轮次 2 · 复审（只验轮次 1 七条 · 实读 2026-09-29）**

| # | Orig# | File | Severity | Status | Notes |
|---|---|---|---|---|---|
| 1 | 1（原 🔴 搜索单源） | RENDER-CORE.md（+ UI.md ∕ PROJECT.md 同拍） | — | Fixed | :114 行 32 判定「**拆**」+ 实现整件入核（`thincoder-render-core/search.mjs` `createSearch`——R6 上提）；:135 计数「核 9 ∕ 拆 9 ∕ 端 33」；:136 静置面三档（search 除名）；:164 §4 行 20「桌面已承载」；:207 构件族补 `createSearch`；:307 §6 search.js 行（165 ⇒ 18）；UI.md:16 ∕ PROJECT.md:188 同拍——跨档相抵全消。 |
| 2 | 2 | PROJECT.md | 🔵 | Partially fixed | :205 activity.mjs **259**（未越 300）· :226 core.css **281**（未越 300）与 RENDER-CORE.md:315 一致；:529-538 本批行（108/100/259/281 ⇒ ≈118/≈109/≈262/≈287）已落。残余：pool-subagents.mjs ∕ activity-new.mjs 仍无 §4.1 行（全档仅 :533-534 命中）。 |
| 3 | 3 | RENDERER.md | — | Fixed | :30 已补「帧尾滚动作（`settleFrame` ∕ 池面 `mountPool` 尾——本档 §3）」；:200 修复轮记录。 |
| 4 | 4 | RENDERER.md ∕ UI.md | — | Fixed | RENDERER.md:123「接线四点」四点全列；UI.md:476 同序号同指位。 |
| 5 | 5 | WEBVIEW.md | 🟡 | Partially fixed | (a) :320「现 **190 行**（R2 提核后实读 2026-09-29；本批随提核改指 ⇒ ≈176）」——450 ∕ 越 300 已撤 ✓；(b) :453 主句已收正，但括注仍作「`activity.js` 持旗标 + wheel/touch 让位 + rAF 帧应用」，与 §5.5（:399-401「本端 = 调用点」；核件 `initBlockFollow` 挂 wheel/touch 写 `_pinFollow`）相抵——残余。 |
| 6 | 6 | PROJECT.md | — | Fixed | :645 T-DSK18「scrollTop ≤ 40px」「页量按核 `historyWindow` 缺省 200 条——条 ≠ 块」。 |
| 7 | 7 | PROJECT.md | — | Fixed | :189 heartbeat.mjs（R10 落）**47** 入表。 |
| 8 | —（观察） | PROJECT.md ∕ UI.md | 🔵 | Note | R6 后桌面已承载搜索，但两处批次期语句未同拍：PROJECT.md:732「搜索面（暂缓面——KD-RC-5）」；UI.md:427「其余浮层族（下拉 / 菜单 / 搜索 / 中断模式）桌面零对位面 ⇒ 零动」。 |

计数：8 行 = Fixed 5 · Partially fixed 2 · 观察 1；🔴 0 · 🟡 1 · 🔵 2（均不阻塞）。

VERDICT: pass

## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
