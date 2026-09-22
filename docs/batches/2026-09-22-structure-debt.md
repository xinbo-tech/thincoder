# 2026-09-22 · structure-debt
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-22 · 来源 = 用户 2026-09-22 09:21「1/2/3 都走」（承 09:19 台账消化——本批 = D 面结构债 5 条 · 拆分方案先行）。
> 台账 = #67 #159 #163 #169 #226（5 条 · 结构债拆分 · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**批件（用户 2026-09-22 09:21「1/2/3 都走」——D 面结构债 5 条）**

**收录**：#67（`AGENT-LOOP-SUBAGENT.md` 2155 行单档——纯结构可读性债；档内 `:980-982` 拆档建议两分在册）· #159（`startTUI` ≈417 行 · `thincoder-cli/src/tui/index.mjs`）· #226（`createKeyHandler` ≈459 行 · `thincoder-cli/src/tui/key-handler.mjs`）· #169（两测试档压线 500：`chat-panel-messages.test.mjs` 521 · `agent-lifecycle-singleton.test.mjs`）· #163（`chat.js` ~446 行 >300 advisory）。

**要点**：**拆分方案先行**（§2 先出方案再实施）；拆分 = 零语义（纯搬移 + 导出面稳定）；拆后全测绿 + 机检零新增；与在飞实施面（`busy-extend` 触 `key-handler.mjs` / `index.mjs`）冲突时以排队 / 落点适配处置（父侧调度）。

**边界**：不改判据面；不新增行为；档内指针随拆更新（同批）。

**链**：§2 → §3 → §4 → 实施 → §6。

**用户授权（2026-09-22 09:29「都自动跑吧」）**：本批链上——① 设计评审点火权 ② §4 用户批准权（代签）③ 修正轮 / 实施轮派发 ④ 收口核销（提交 / 推送 / 台账迁移）——均**委托父侧自动执行**，至本批收口。**父侧自缚**：① 代签仅当「评审 pass（0 🔴）∧ 修正轮已落地并逐条核验 ∧ token 已签发」三条件齐备；② 每次代签在 §4 写明「父侧代签（用户 09:29 授权）+ 依据（评审 id / 核验结论 / 发现处置表）」；③ 需**新范围**或**用户口径裁决** ⇒ 停下（不因授权扩张射程）。

**设计轮核验 + 上抛裁定（父侧 · 2026-09-22 09:3x）**

- **核验**：§2 五条方案在档（`:21`–`:305`）· 机检与批前基线逐数一致（悬空 16 / 行宽 12 · 零新增）✓ · 交付表 5/5。
- **上抛 1（读数漂移）**：台账已收正（#169 524 · #163 454 · #226 461 · #67 2238）——**#169 已越 500 硬限**，本批拆分即其正解。
- **上抛 2（需求档指称改指）**：**主 agent 落笔**（实施 L3 同步交付——`requirements/AGENT-LOOP.md` · `ADVISOR-CONVERGENCE.md` · `ENGINEERING-MODE-V2.md`）。
- **上抛 3（档内 `:983-985` 旧「两分」建议句）**：**同批收正**（不留并存陈述）✓。
- **上抛 4（`:2094` 存量行宽 345）**：**判不并**——该行属 hygiene-sweep 批 #203 射程（已在案），本批不重复施工。
- **上抛 5（`test/files.mjs` 登记面）**：实施轮硬动作（非纯搬移），已记。
- **序（硬前提）**：`busy-extend`（#224）落定提交前本批不动手（方案 = 其落点之上再拆）；**评审轮亦待其收口后点火**（被拆档与在飞实施面同档，避 D5 冻结冲突与坐标漂移——本决定为父侧调度裁定）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（2026-09-22 评审轮 1（id=23）修正轮落地：10 条逐条（#1 二段接口 · #2 令牌阈值=AC 数 · #3 读数归一 · #4 注释面逐档 28 · #5 越线核查 · #6 chat.js 指称清单 · #7 计数 17/2246/144 · #8 块界 122 · #9 五族序列 · #10 本行）；发现 11 项（§2.10 八 + §2.11 三）；#11 登记性零动作；机检基线 悬空 16 · 行宽 14 零新增）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**本批条目（覆盖 5/5）**：#67（`docs/core/design/AGENT-LOOP-SUBAGENT.md` 单档承载——纯结构可读性债）· #159（`startTUI`）· #226（`createKeyHandler`）· #169（VSC 两测试档）· #163（`vsc webview/chat.js`）。

**落点与口径（先立三条）**：

1. **设计正文落点 = 本 §2**（批专属设计面）——`docs/core/design/STRUCTURE-DEBT.md` 自述「总账 + 入口路由，**不承载单批设计正文**」（该档 §1）；其 §2 → §3 的消解移档 = **收口轮**（该档 §4 纪律 3），本轮不动该档。
2. **读数口径 = `wc -l`（换行符计数）· as-of 2026-09-22 09:4x 本席实读**；在飞批 `busy-extend`（台账 #224）**正并发写入本批三档**（`key-handler.mjs` / `index.mjs` / `chat-panel-messages.test.mjs`）⇒ 台账记值与现盘有差（见 §2.6 发现 1）；**实施轮一律按落点重取**行号与读数。
3. **拆分铁律（5 条共守）**：**零语义** = 迁出块**逐字搬移**（唯一允许差异 = 移出函数体后的去缩进 + 新档头）+ **导出面稳定**（既有导出名集恒等）+ **不改行为 / 不改判据面**（`prompts/**` 与需求档零行；断言语义零改、零增、零删——测试侧唯一新增 = 登记行与结构机检）。

**写域拆分（实施轮两条车道）**：**代码/测试车道 = eng-coder**（designToken 门）；**设计档面车道 = eng-designer**（D1 写权矩阵：设计档 = eng-designer；先例 = `DOC-DISCIPLINE.md` §3.9 落笔行）。两车道**不可互替**，档面车道后置于代码车道（新档名与坐标以落点为准）。

## 2.1 #226 `createKeyHandler` — 拆函数为五分族档 + 分派器

**现读读数**：`thincoder-cli/src/tui/key-handler.mjs` = **498 行**（≤500 硬限 · 距硬限余 2 行）；`createKeyHandler` = `:38`–`:498` = **461 行**（台账 #226 记 `:38-496` ≈459 = 前批读数）。判据 = `docs/core/requirements/METHODOLOGY.md` F3-1「函数 ≥300 必拆骨干」。

**拆分后形态**（新档 5 + 留守 1；搬移边界按现盘行号，实施时按落点重取）：

| 新档（拟新增 · 目录同现档 `thincoder-cli/src/tui/`） | 导出面 | 搬移边界（现盘） | 目标读数 |
|---|---|---|---|
| `key-handler-ctrlc.mjs` | `handleCtrlCFamily(str, key, ctx)`（**落点实读**——无返回值；路由 = 分派器守卫 ⇔ 原块入口条件） | `:56`–`:161`（Ctrl+C 五分支：picker 取消 / 武装窗口全停 / 挂起态两级中止 / 回合 interrupt / 空闲退出武装；含 `ctx.suspArmTimer` / `ctx.exitArmTimer` 复用） | ≤200 行 |
| `key-handler-modals.mjs` | `handlePickerKeys(str, key, ctx)` · `handleWizardKeys(str, key, ctx)`（落点实读） | `:196`–`:238`（picker 导航 + 窗口高同源）+ `:241`–`:266`（wizard 两 step） | ≤200 行 |
| `key-handler-busy.mjs` | `handleBusyEnter(str, key, state, ctx)`（**落点实读**——签名含 `str` / `key`（块体实读）；无返回值；同上下） | `:288`–`:320`（**busy 门禁**：Enter 单槽受理 + 吞面四（模态/斜杠/空/槽满）+ 槽满提示 + 唤醒）——**busy-extend 落点整块搬移** | ≤200 行 |
| `key-handler-scroll.mjs` | `handleScrollKeys(key, ctx)` · `handleHistoryKeys(key, ctx)` · `handleCursorKeys(key, ctx)`（落点实读） | `:269`–`:286`（PgUp/PgDn + `loadOlder` 边界加载）+ `:341`–`:384`（↑↓ 三规则 + 历史导航）+ `:387`–`:406`（←→/Home/End） | ≤200 行 |
| `key-handler-edit.mjs` | `handleEditKeys(str, key, ctx)` | `:323`–`:335`（Tab 补全 / Ctrl+U 清框）+ `:409`–`:425`（退格 / 删除）+ `:426`–`:460`（Enter：多行换行 / 挂起单槽 / `submit()`）+ `:465`–`:496`（Ctrl+V 文本 / Alt+V 图片 / 可打印字符） | ≤200 行 |

**导出面收正（落点实读 · 2026-09-22 实施轮）**：五族函数签名 = 上表实读形；**布尔契约（`→ boolean`）未采纳**——块内裸 `return` 共 35 处，boolean 化须逐行改写 → 破 AC-1「迁出块逐字」闸；实际路由 = **分派器委派守卫 ⇔ 原块入口条件**（守卫表达式与块内 `if` 逐字同源；两处非全路径返回的族（wizard / busy）守卫 = 块内返回分支条件逐条对应）。该取舍经实施轮呈父侧、**已裁定接受**（代码评审 🟡#1）。

**留守 `key-handler.mjs`**（目标 ≤200 行）：`clearAttention`（`:16`–`:21`）· `convMaxScroll`（`:24`–`:30`）**零改** + 分派器 `createKeyHandler`（目标 **≤120 行**）= attention 清位 + 三模态前置委派（permission/question/search）+ Ctrl+C 委派 + F1 快捷键表（`:164`–`:179`）+ Ctrl+I 入口（`:182`–`:189`）+ interrupt 模态 + 五族顺序委派（`if (handleX(...)) return`）。

**五族调用序列（评审 #9 落点 · 零语义硬判据）**：单次调用一族 ≠ 原交错序逐字 ⇒ 等价性按「族内原序 + 跨族覆盖序」判（判据可复算）：

| 序 | 分派器条目 | 族内块序（现盘行段） |
|---|---|---|
| — | attention 清位 + 三模态前置委派（permission / question / search——`key-modes.mjs` 族） | `:44`–`:54`（逐字原位） |
| **1** | `handleCtrlCFamily(str, key, ctx)`（ctrl+C 族） | `:56`–`:161`（五分支原序） |
| — | F1 快捷键表 · Ctrl+I 入口 · interrupt 模态 | `:164`–`:193`（逐字原位） |
| **2** | modals 族（`handlePickerKeys` + `handleWizardKeys`） | `:196`–`:238` + `:241`–`:266` |
| **3** | scroll 族（`handleScrollKeys` + `handleHistoryKeys` + `handleCursorKeys`） | `:269`–`:286` + `:341`–`:384` + `:387`–`:406` |
| **4** | busy 族（`handleBusyEnter`） | `:288`–`:320` |
| **5** | edit 族（`handleEditKeys`） | `:323`–`:335` + `:409`–`:425` + `:426`–`:460` + `:465`–`:496` |

**交错等价判据**：唯一跨族重叠面 = **`tab` 与 `enter`/`\r`**（busy 族 `:295`/`:296` 与 edit 族 `:323`/`:426`）——序 4 ≺ 序 5 保 busy 吞面；其余各键单族命中（键集两两不相交：`ctrl+c` / modals 吞面 / `pageup`·`pagedown` / `↑`·`↓` / `←`·`→`·`home`·`end` / `backspace`·`delete`·`ctrl+u`·`ctrl+v`·`alt+v`·可打印）⇒ 跨族重排零语义。**零语义对表口径随之收窄**：族内块逐字（去行首空白）+ 跨族序按本条判据（不再要求逐字复现原交错序）。

**关键决策（含否决备选）**：

- **D-K1 分族 = 按「前置模态 → 全局键 → 编辑族」三段顺序**（保持现档逐分支先后序 ⇒ 零语义可达）。否决「按行数均分」——分族边界必须可由现档分支顺序机械判定。
- **D-K2 busy 槽（`:306`–`:318`）与挂起槽（`:440`–`:455`）不合并**——两分支近似但非同源（busy 支含斜杠/模态守卫 + 条件唤醒）；合并即语义面。否决「同槽 helper」。
- **D-K3 F1 帮助表留在分派器**（16 行展示数据，外提仅增一层转发）。

**导出面/调用面影响**：导出名集 = `{ createKeyHandler, clearAttention, convMaxScroll }` **恒等**（消费面 = `index.mjs:38` + 8 测试档：`arrow-editing` / `attention-state` / `busy-injection` / `cli-delete-confirm` / `input-lock` / `integration/tui-basics` / `tui-exit-cleanup` / `tui-selection-surfaces`）。`index.mjs:458`–`:463` 的 ctx 键集**零改**（族函数经同一 ctx 取值——新增键 = 无）。文档面 6 处指称本档坐标的行随档面车道改指（见 §2.4 表）。

**回归判据（可机检）**：

- `cd thincoder-cli && npm test` 全绿（重点族：input-lock / busy-injection / attention-state / arrow-editing / cli-delete-confirm / tui-exit-cleanup / tui-selection-surfaces / integration/tui-basics / queued-stop / digest-end-line）。
- 结构机检（ASCII 令牌 · 单行 `node -e`；顶层函数长度扫描——`^(export )?(async )?function ` 起、`^}$` 止）：
  `node -e "const fs=require('fs');const P=['thincoder-cli/src/tui/key-handler.mjs','thincoder-cli/src/tui/key-handler-ctrlc.mjs','thincoder-cli/src/tui/key-handler-modals.mjs','thincoder-cli/src/tui/key-handler-busy.mjs','thincoder-cli/src/tui/key-handler-scroll.mjs','thincoder-cli/src/tui/key-handler-edit.mjs'];let bad=0;for(const p of P){const L=fs.readFileSync(p,'utf8').split('\n');if(L.length-1>200){bad++;console.log('FILE-LONG',p,L.length-1)}let s=-1;L.forEach((l,i)=>{if(/^(export )?(async )?function /.test(l))s=i;if(l==='}'&&s>=0){const n=i+1-s;const cap=p.endsWith('/key-handler.mjs')?120:150;if(n>cap){bad++;console.log('FUNC-LONG',p,(s+1)+'-'+(i+1),n)}s=-1}})}if(bad)throw new Error('AC-1 BAD');console.log('AC-1 OK')"`
  （判据 = 令牌本体 · 阈值 = AC-1 自身数：文件 >200 / 分派器（`key-handler.mjs` 顶层）函数 >120 / 五新档函数 >150 ⇒ 抛错（exit 1）。扫描锚 = 六档名 + 顶层 `function` 起锚——**名称锚（非行号）**：导出面恒等 ⇒ 拆前拆后同锚、无需重取。**计数口径 = `wc -l`（尾换行档 = `split('\n').length − 1`——父侧核正 2026-09-22 · 可 revert；与 §2.0 `:40` 口径一致**）。）
- 导出名集机检：`node -e "import('./thincoder-cli/src/tui/key-handler.mjs').then(m=>{const k=Object.keys(m).sort().join(',');if(k!=='clearAttention,convMaxScroll,createKeyHandler')throw new Error('export drift: '+k);console.log('EXPORT OK')})"`（cwd = 仓根）。
- 零语义对表：迁出块 vs `git show HEAD:thincoder-cli/src/tui/key-handler.mjs` 对应行段，**去行首空白后逐字相等 + 行序不变**（脚本对表，差异非零即红）。

**拆后读数目标**：`createKeyHandler` ≤**120** 行 · 五新档各 ≤**200** 行（档内最长顶层函数 ≤**150**）· `key-handler.mjs` ≤**200** 行（现 498）。

## 2.2 #159 `startTUI` — 拆闭包装配为四新档 + 装配序列

**现读读数**：`thincoder-cli/src/tui/index.mjs` = **499 行**（≤500 硬限 · 距硬限余 1 行）；`startTUI` = `:77`–`:493` = **417 行**。同档另有导出函数 `promptProviderIfInvalid`（`:58`–`:70` · 13 行）与本地 `summarize`（`:495`–`:499`）——**均在函数外，不动**。

**拆分后形态**（新档 4；搬移边界按现盘行号）：

| 新档（拟新增 · `thincoder-cli/src/tui/`） | 导出面 | 搬移边界（现盘） | 目标读数 |
|---|---|---|---|
| `tui-state.mjs` | `createTuiState({ cols, rows, agent })` → state | `:92`–`:144`（state 字面量逐字；`makeDimsState` 随迁 import；`tasks: agent.tasks ?? []` 入参承接） | ≤200 行 |
| `input-face.mjs` | `createInputFace(ctx)` → `{ keyStream, mountKeys(deps), mountMouse(deps) }`（**二段接口**——接口面见下） | **早挂载工厂**（`:153` 原址调用）＝ ① `:153`–`:178`（keyStream / raw mode / startup 序列 / loading 行 / `setTuiActive` / 解码器）+ ② `:180`–`:288`（`process.stdin.on("data")` 处理器整块）；**后置挂载入口**（原址调用）＝ ③ `:455`–`:471`（`createKeyHandler` + keypress 挂载）· ④ `:473`–`:474`（`createMouseDispatch`） | ≤250 行 |
| `conversation-writer.mjs` | `createConversationWriter({ state, render })` → `{ pushLine, pushLabel, ensureAssistantLabel, assistantLabeled 存取器 }` | `:293`–`:334`（行额度单点 + 头裁锚校正 + 消息标签 + assistant 标签单次位） | ≤200 行 |
| `turn-face.mjs` | `createTurnFace(ctx)` → `{ submit, turn, turnCtx, askPermission, askQuestion, askBatchPermission, pasteClipboardImage }` | `:366`–`:412`（submit 门禁 + interaction 装配 + 图片粘贴 + turnCtx + turn） | ≤200 行 |

**接口面（#1 落点——构造期读值 ⇒ 二段接口）**：③④ 是**构造期一次性读值**——`thincoder-cli/src/tui/key-handler.mjs:39` 构造时一次解构 18 键（`handleSlash` / `handleTab` / `pushLine` / `render` / `popPicker` / `renderPickerLines` / `loadOlder` / `pasteClipboardImage` / `wizard*`）· `thincoder-cli/src/tui/mouse.mjs:197` 参数解构 `{ agent, state, pushLine, render, popPicker }`；对应绑定在 `index.mjs` `:293`（`pushLine`）/`:342`（`render`）/`:346`（`loadOlder`）/`:403`/`:420`/`:425`/`:434` 才初始化 ⇒ 若在 `:153` 处执行 ③④ = 启动期 TDZ（`node test-startup.mjs` 必红）。故接口拆二段：

- `createInputFace(ctx)` = **早挂载工厂**（①+②）：ctx = `state` + **惰性取值器**三条（`get render()` / `get pushLine()` / `get loadOlder()`——先例 = `renderLoop` ctx 的 `get showUpdateNotice()`）；② 内鼠标两路（`onMouseClick` / `mouseCtx`——原 `:474` 解构产物）以后置槽承接（`mountMouse` 回填；② 内 `:243`/`:261` 调用点逐字不变）。
- `mountKeys(deps)` = **后置挂载入口③**（`index.mjs` 原 `:455` 址调用；`deps` = 现 `:458`–`:463` 键集 18 键）；`mountMouse(deps)` = **后置挂载入口④**（原 `:473` 址调用；`deps` = 现 `:474` 键集 5 键）。
- 逐字口径：①/②/③/④ 块体逐字（② 中 `render` / `pushLine` / `loadOlder` 三个晚定义名由档内转发名承接——`const render = (...a) => ctx.render(...a)` 形态，属新档头允许的差异）。

**留守 `index.mjs`**（目标 ≤**300** 行）：imports + `promptProviderIfInvalid` + 装配序列（dims 采样 `:89`–`:90` · agent 挂载 `:145`–`:151` · cleanup/exit 钩 `:290`–`:291` · render loop `:338`–`:342` · `loadOlder` `:346` · heap-watch `:350`–`:353` · resize `:360`–`:362` · 命令层 `:414`–`:453` · 启动屏/台账面/后台索引 `:478`–`:492`）+ `summarize`。

**顺序不变量（零语义硬约束 · 实施轮必须逐条保）**：

1. **输入面挂载点 = 现址二段**：**早挂载** `:153`（仍早于 `render`（`:342`）/ `pushLine`（`:293`）/ `loadOlder`（`:346`）定义）；**后置挂载入口** ③④ = 原 `:455`/`:473` 址（此时 18 + 5 键全已初始化）。早挂载 ctx 以**惰性取值器**承接（`get render()` / `get pushLine()` / `get loadOlder()`）⇒ ② 的现形 TDZ 语义逐字保持；**禁前移/后移任一挂载址**。
2. `turnCtx.handleSlash = handleSlash` 的**回填时序**不变（现 `:453`，循环依赖逐字保留）。
3. `createKeyHandler` 的 ctx 键集与现 `:458`–`:463` **逐字相同**。
4. 命令层（`:414`–`:453` · 40 行装配块）**不拆**——外提仅省 ~20 行且须传 12 键 ctx。**否决备选（登记）**：拆 `command-layer.mjs`。

**导出面/调用面影响**：导出名集 = `{ startTUI, promptProviderIfInvalid, upgradeFailureText, pendingNoticeReady }` **恒等**（消费面：`src/tui.mjs:5` re-export shim → `bin/thincoder.mjs:359` 动态 import；`test-startup.mjs:62` 直引 `src/tui/index.mjs`）⇒ **三处消费面零改**。`promptProviderIfInvalid` 实扫无外部导入者（仅档内 `:480` 调用）——**保留导出**（面稳定优先）。

**回归判据（可机检）**：

- `cd thincoder-cli && npm test` 全绿 + `node test-startup.mjs`（启动自检）通过。
- 结构机检（ASCII 令牌 · 单行 `node -e` · 判据 = 令牌本体）：`startTUI` ≤160 ∧ `index.mjs` ≤300 ∧ 四新档上限（`input-face.mjs` ≤250 · `tui-state.mjs` / `conversation-writer.mjs` / `turn-face.mjs` 各 ≤200）：
  `node -e "const fs=require('fs');const S=fs.readFileSync('thincoder-cli/src/tui/index.mjs','utf8').split('\n');if(S.length-1>300)throw new Error('index.mjs '+(S.length-1));let s=-1,len=0;S.forEach((l,i)=>{if(/^export async function startTUI/.test(l))s=i;if(s>=0&&l==='}'&&i>s&&!len)len=i+1-s});if(!len)throw new Error('startTUI anchor missing');if(len>160)throw new Error('startTUI '+len);const F=[['tui-state.mjs',200],['input-face.mjs',250],['conversation-writer.mjs',200],['turn-face.mjs',200]];for(const [q,cap] of F){const n=fs.readFileSync('thincoder-cli/src/tui/'+q,'utf8').split('\n').length-1;if(n>cap)throw new Error(q+' '+n)}console.log('SIZE OK startTUI='+len)"`
  （扫描锚 = `^export async function startTUI` + 四档名清单——**名称锚（非行号）**：导出面恒等 ⇒ 拆前拆后同锚。四档上限逐档单一数。）
- 导出名集机检：`node -e "import('./thincoder-cli/src/tui/index.mjs').then(m=>{const k=Object.keys(m).sort().join(',');if(k!=='pendingNoticeReady,promptProviderIfInvalid,startTUI,upgradeFailureText')throw new Error('export drift: '+k);console.log('EXPORT OK')})"`。
- 零语义对表：四迁出块 vs `git show HEAD:thincoder-cli/src/tui/index.mjs` 对应行段，去行首空白后逐字相等 + 行序不变。

**拆后读数目标（单一口径）**：`startTUI` ≤**160** 行（现 417）· `index.mjs` ≤**300** 行（现 499）· 四新档上限 = `input-face.mjs` ≤**250**（承载 ①–④ 四条输入路径）· `tui-state.mjs` / `conversation-writer.mjs` / `turn-face.mjs` 各 ≤**200**；估读（§2.6 Δ 列）：input-face ≈205 · 其余三档 ≈65 / 55 / 60。

## 2.3 #169 两压线测试档 — 迁出主题连贯用例组（判据 = `DOC-DISCIPLINE.md` §3.2 条目 D-2）

**现读读数**：`thincoder-vscode/test/chat-panel-messages.test.mjs` = **524 行**（**>500 硬限——已在违规态**；台账 #169 记 521 = 前批读数，busy-extend 又 +3）· `thincoder-vscode/test/agent-lifecycle-singleton.test.mjs` = **500 行**（硬限在位 · **零余量**）。判据 = D-2（迁出「主题连贯的一组用例」→ 新档；**新档头部自持**（imports + 助手 + 常量）、**零跨档 import**；迁出用例**逐字搬移**；**用例数守恒**；两档各 ≤500）。

**拆分后形态**（两条独立方案；边界按现盘行号）：

**A · `chat-panel-messages.test.mjs` → 迁出「取消路由 / 事件中继」族**

- 迁出块 = **⑫ F-2 取消路由**（`:367`–`:411` · 45 行）+ **⑬ W15 事件中继**（`:413`–`:455` · 43 行）+ **⑭ T-AF11 advisor 目标取消**（`:457`–`:490` · 34 行）＝ **122 行**（3 例）。
- 新档 = `panel-cancel-routing.test.mjs`（拟新增 · 同目录 `thincoder-vscode/test/`）；**自持头** = imports 子集（`node:test` / `assert` / `handlePanelMessage`——按迁出块实需 ≈3 行）+ `stubPanel` **逐字副本**（`:33`–`:59` = 27 行〔JSDoc 起 `:33`；函数起 `:36`〕——原档共享面，不可迁出）+ 档头 ≈ 10 ⇒ 自持头 ≈ **40 行**；`poolHistory`（`:370`–`:381`〔JSDoc 起；函数起 `:372`〕）与 `advisorQueuedEntry`（`:459`–`:469`〔JSDoc 起；函数起 `:461`〕）**随 ⑫⑭ 块迁出**（原档其后再无引用）⇒ 新档 ≈ **162 行**（≤250 内）。
- 原档保留 ① ② ③ ⑤ ⑦ ⑧ ⑪ ⑮（8 例）⇒ ≈ **402 行**（524 − 122）；**用例守恒 = 11 → 8 + 3 ✓**。
- **越线核查（拆后 · 评审 #5 落点）**：拆后仍越 300 advisory 线（≤500 硬限——余量 ~98）。**终点理由** = 余 8 组共享 `stubPanel` 全量夹具与同族面板断言面，再拆任一组须整组自持头（≳ 组本体）⇒ 300 在该档不可达而不破 D-2（自持头 / 零跨档 import）。**下次拆分触发** = 该档下次实质增改（≥ +60 行——逼近硬限）或 VSC 侧引入 test 档位门时，外提 ⑮ 命令面（`:492` 起 ≈34 行）+ ⑧ sendMessage 守卫面（`:280`–`:334`）两组候选。

**B · `agent-lifecycle-singleton.test.mjs` → 迁出「会话级三字段 round-trip」族**

- 迁出块 = `:366`–`:454`（**4 例**：`agentState` 六字段快照 / `agentState → saveLines → 重建回填` 闭环 / `saveLines` 键缺席保留 / 干净完成空态即权威）＝ 89 行。
- 新档 = `agent-session-fields-roundtrip.test.mjs`（拟新增）；**自持头** = imports 子集 + `sessionsDir` / `manifestPreexisted` / `liveTok` / `cfgBag` / `rmDirRetry` / `beforeEach` / `afterEach` 逐字副本（`:40`–`:83` 段内实需者）≈ 65 行 ⇒ 新档 ≈ **155 行**。
- 原档保留 10 例 + `slow` 例 ⇒ ≈ **411 行**（500 − 89）；**用例守恒 = 15（14 `test` + 1 `slow`）→ 11 + 4 ✓**；`slow.mjs` 只在原档（新档不自持 `slow`）。
- **越线核查（拆后 · 评审 #5 落点）**：拆后仍越 300 advisory 线（≤500 硬限——余量 ~89）。**终点理由** = 装置面（`sessionsDir` / `beforeEach` / `afterEach` / `rmDirRetry`——`:40`–`:83` 段）由全档共享，任一组外提须整段自持 ⇒ 300 在该档不可达而不破 D-2。**下次拆分触发** = 该档下次实质增改或 VSC 侧引入 test 档位门时，外提 `applySlotSessionState` 三例族（`:197`–`:278` ≈82 行）。

**调用面/登记面影响（非纯搬移项 · 硬动作）**：`thincoder-vscode/test/files.mjs`（设计轮读数 130 行 ⇒ **落点 134 行** = 本批 +2 登记行 + 他批先前 +2）= VSC 测试**登记册**，且 VSC `npm test`（`test/run.mjs`）含「**无漏登记反查**」⇒ 两新档**必须各加一行登记**（+2 行）；CLI 侧无对应登记册（`thincoder-cli/test/run.mjs:36`–`:41` 只做**两层 glob 漏收集反查**——本批 CLI 侧不新增测试档，不受影响）。

**回归判据（可机检）**：

- `cd thincoder-vscode && npm test` 全绿（登记反查覆盖新档存在性）。
- 用例数守恒机检（ASCII 令牌）：四档内 `test(` / `slow(` 顶层计数之和 = 26（现两档合计）；单档拆分后计数 = 8 / 3 / 11 / 4。
- 尺寸机检：四档各 ≤500 行。
- **零跨档 import 反向断言**：两新档内不得出现对 `./chat-panel-messages.test.mjs` / `./agent-lifecycle-singleton.test.mjs` 的 import。

**拆后读数目标**：`chat-panel-messages.test.mjs` 524 → **≤420** · `agent-lifecycle-singleton.test.mjs` 500 → **≤430** · 两新档 ≤**250** / ≤**200**（四档全 ≤500）。

## 2.4 #163 `webview/chat.js` — 拆「消息分发」与「状态行三件」为两档

**现读读数**：`thincoder-vscode/webview/chat.js` = **454 行**（>300 咨询线 · 距 500 硬限 46 行；台账 #163 记 ~446 = 前批读数）。判据 = F3-1 文件维（>300 主动审视抽模块）。

**拆分后形态**：

| 新档（拟新增 · `thincoder-vscode/webview/`） | 导出面 | 搬移边界（现盘） | 目标读数 |
|---|---|---|---|
| `chat-status.js` | `clearStatusText` · `handleStatusText` · `showCompressStatus` · `showDigestStatus` | `:336`–`:383`（压缩状态行 + 状态段两函数）+ `:386`–`:446`（digest 轮可见面；模块级 `_digestRoundEl` 随迁） | ≤150 行 |
| `chat-messages.js` | `initMessageLoop(deps)` | `:144`–`:333`（`window.addEventListener("message", …)` + 开关表 188 行）整块 | ≤250 行 |

**留守 `chat.js`**（目标 ≤**200** 行）= 装配（init / autocomplete / settings / toolbar / 全局键盘与点击 / 侧效 import）+ **原址显式调用** `initMessageLoop(deps)`（`deps` = 现档闭包实需的 settings 解构面 + `showAtDropdown` + `dismissLoadingScreenOnce` + `_loadingTimeout` + 状态面两函数——按迁出块实需逐项对表）+ `dismissLoadingScreen` 族 + 启动握手。

**关键决策（含否决备选）**：

- **D-C1 注册时序逐字保持**：消息监听**不在新档做副作用注册**——新档只导出 `initMessageLoop`，由 `chat.js` 在**现址**（`:146`）调用。否决「副作用 import」（ESM import 提升会前移 `window.addEventListener` 的注册点）。
- **D-C2 分发单表不拆族**：`switch (m.type)` 单表保持（协议机检的提取对象；拆族即多份判别面）。否决「按族拆多表」。
- **D-C3 状态行三件与 digest 面同档**（同 = 「显示状态元素」一类问题；`_digestRoundEl` 与 `showDigestStatus` 同生共死）。

**导出面/调用面影响**：

- chat.js 是 **webview 入口模块**（非库）——`index.html:93` 的 `__CHAT_URI__` 替换面（`src/extension/chat-panel.mjs:483`）**零改**；新档经**相对 import** 加载（同 `state.js` / `ui.js` / `status-bar.js` 先例）⇒ **宿主面零改**。
- **协议机检面零登记改动**：`test/protocol-coverage.test.mjs`（host→webview 收面）与 `test/protocol-coverage-reverse.test.mjs`（发面）**递归自动 glob `webview/**`**（`esmFiles` / `webviewFiles`）⇒ 新档自动入扫。
- 测试夹具面：`test/helpers/webview-env.mjs`（happy-dom + 全量 id fixture + 真 `chat.js` 模块图）驱动 ⇒ 新档随图自动覆盖。
- 文档面（档面车道）：`docs/vsc/design/WEBVIEW.md` §3 文件表 +1 行（读数面）· `docs/vsc/design/VSC-DEBT.md:288` §12.1 主档越线登记收正 · `docs/vsc/design/WEBVIEW-PROTOCOL.md` §12/§13 的 **webview 消费列坐标**按档内 `--emit` 程序重出 · 指称行改指新档（`PROJECT-SWITCHER.md:46` 的 `case "project"` 路由 · `CONTEXT-COMPACTION.md:202` 的 `webview/chat.js showCompressStatus`）。
- **VSC 测试注释面（#163 消费位指称——评审 #6 落点·同批改指）**：坐标 / 「`case` 在 chat.js」结构位指称改指 `chat-messages.js`；真 `chat.js` 模块图**入口**指称零改。逐处 = `test/settings-refill.test.mjs:9`（`消费位 webview/chat.js:213-224`）· `test/model-menu-delete-confirm.test.mjs:11`/`:52`（`chat.js:57`）· `test/activity-flow.test.mjs:238` · `test/async-visibility.test.mjs:370` · `test/webview-turnstate.test.mjs:18`（三处「`chat.js` case 消费位」名指——评审实核 5 处）；本席实扫补 4 处 = `test/activity-closure.test.mjs:232` · `test/busy-injection-vsc.test.mjs:148` · `test/workspace-guard.test.mjs:404` · `test/tool-output-payload.test.mjs:58`。
  **入口 gloss 形（父侧核正 2026-09-22 · 可 revert · 零改类）**：8 档 11 处 = `test/settings-refill.test.mjs:8`/`:27` · `test/settings-empty-no-write.test.mjs:38` · `test/settings-mcp-delete-confirm.test.mjs:14`/`:36` · `test/settings-open-snapshots.test.mjs:47` · `test/settings-secret-delete-confirm.test.mjs:15`/`:41` · `test/workspace-guard.test.mjs:387` · `test/webview-permission-batch-release.test.mjs:142` —— **零改**（行为指称：拆后经 `chat.js` 模块图仍得消息 `case`；与 `workspace-guard.test.mjs:404` 同族）；该类不入机检正则（`/chat\.js:\d/` 不覆盖），如实登记为界外零改类。`node -e "const fs=require('fs'),path=require('path');let n=0;const w=d=>{for(const x of fs.readdirSync(d)){const q=path.join(d,x);if(fs.statSync(q).isDirectory())w(q);else if(x.endsWith('.mjs'))fs.readFileSync(q,'utf8').split('\n').forEach(l=>{if(/chat\.js:\d/.test(l))n++})}};w('thincoder-vscode/test');if(n)throw new Error('chat.js coord pointers left: '+n);console.log('CHAT-COORD OK')"`

**回归判据（可机检）**：

- `cd thincoder-vscode && npm test` 全绿（重点：protocol-coverage 两档 / digest-visibility / busy-injection-vsc / workspace-guard / status-line / webview-input-enter / webview-input-history / settings-open-snapshots / activity-flow）。
- 结构机检（ASCII 令牌）：三档各 ≤300 行。
- **协议不变量机检**：`node test/protocol-coverage.test.mjs` 与 `node test/protocol-coverage-reverse.test.mjs` 全绿 ∧ 两档 `--emit` 输出与拆前**差集 = 0**（除坐标列）∧ `case "<name>":` 标签集恒等（拆前后逐字比对）。
- 零语义对表：迁出两块 vs `git show HEAD:thincoder-vscode/webview/chat.js` 对应行段，去行首空白后逐字相等。

**拆后读数目标**：`chat.js` ≤**200** 行（现 454）· `chat-messages.js` ≤**250** · `chat-status.js` ≤**150**。

## 2.5 #67 `AGENT-LOOP-SUBAGENT.md` — 单档三分（结构可读性）

**现读读数（2026-09-22 评审轮后复读）**：`docs/core/design/AGENT-LOOP-SUBAGENT.md` = **2246 行**（台账 #67 记 2155 = 前批读数；设计轮读数 2238 → +8 = 他批在飞落笔：§6.27 段 +2 · 变更记录 +6）；**17 个 `§6.x` 顶节**（`:10` `:120` `:164` `:186` `:221` `:265` `:299` `:318` `:339` `:518` `:608` `:634` `:728` `:745` `:859` `:1034` `:2032`）；变更记录 `:2103`–`:2246` = **144 行**。

**判据口径（先立 · 防误引）**：**文档无行数义务**——`DOC-DISCIPLINE.md` §3.7（2026-09-16 用户裁定：300/500 **只约束程序代码**；不限行数、不登记读数、不写拆分规划）。故本条判据 = **结构可读性**（单档承载 18 个机制族 + 多批设计正文，读者定位成本高）；**拆后目标 = 结构目标**（下），**不设行数阈值**。

**拆分后形态（三分 · 按「一档答一类问题」）**：

| 档 | 承载节（节号沿用——全仓指针只改档名、不改节号） | 主题 | 现盘行段 |
|---|---|---|---|
| `AGENT-LOOP-SUBAGENT.md`（留守） | §6.7 · §6.9 · §6.12 · §6.21 · §6.22 · §6.23 · §6.24 · §6.25 · §6.26 · §6.28 | 子代理工具契约与装配面（角色/动作面/depth 门/文件域/取号/装配 enum/审计注入/VSC 改名镜面） | `:10-119` `:164-185` `:265-298` `:518-2102`（除迁出段） |
| `AGENT-LOOP-ASYNC-POOL.md`（拟新增） | §6.8 · §6.10 · §6.11 · §6.18（含 `:308-317` 英文声明块） · §6.19 · §6.20 | 后台异步池 · 挂起回合与 digest · 评审实例面（池模型 / 评审池可观测 / 中止丢弃对称 / 评审对象锚 + 判定铁律） | `:120-163` `:186-264` `:299-338` `:339-517` |
| `AGENT-LOOP-UPSTREAM.md`（拟新增） | §6.27（含 §6.27.12 全族 + `:1306`/`:1331` 两段无编号 `##` 提示词面文本块） | 子→父上行通道与唤醒面（队列 / 谓词 / 域文本 / 信号提示行 / VSC 对位） | `:1034-2031` |

**搬移边界（零语义 · 拆分纪律同 2026-09-15 拆档先例）**：

1. 迁出节**逐字搬移**（段零改动）；**节号全局编号不变**。
2. 两新档头**各撰**：归属（`docs/core/design/AGENT-LOOP.md` 机制族拆分面）+ 母档指针 + 「节号沿用母档全局编号」声明 + 建档行（本批 + 三分说明）。
3. **变更记录随留守档逐字保留**（历史归记录面）；两新档各立新 变更记录（首行 = 本批建档行）。
4. 留守档头部「归属 / 母档」句按三分收正 + 变更记录 +1 行。

**关键决策（含否决备选）**：

- **D-D1 三分（非两分）**：档内 `:983-985` 在册的旧建议「子代理族 / 评审池族**两分**」不再切合现状——两分下最大档仍 ≈1000 行（§6.27）且「评审池」与「工具装配」不同问题类。三分 = 工具装配 / 池与挂起与评审实例 / 上行与唤醒。
- **D-D2 §6.27 不按其子节再切**（§6.27.1–11 机制契约与 §6.27.12 唤醒面同族——切开即失上下文）。否决「§6.27 内切」。
- **D-D3 节号零改、只改档名**（既有全仓指针的最小改法）。
- **D-D4 旧建议句收正归档面车道**：`:983-985` 的「两分」句为设计档活面陈述——拆档落地时**同批**收正为本三分形态（不留失效/并存陈述）。

**调用面（指针面 · 影响清单）**：全仓 `AGENT-LOOP-SUBAGENT.md` 指称 ≈**611 处**（约 50 档；量级：`AGENT-LOOP.md` 38 · `DOC-DISCIPLINE.md` 17 · `requirements/AGENT-LOOP.md` 11 · `cli/design/TUI.md` 7 · `CONFIG.md` 7 · 代码面 ~30 档）。

- **规则**：指称**迁出节**（§6.8 / §6.10 / §6.11 / §6.18 / §6.19 / §6.20 / §6.27\*）者**改指新档名**（节号不动）；指称**留守节**者**零改**（例：`thincoder-vscode/test/files.mjs:49` 引 §6.24 = 留守 ⇒ 零改）。
- **本席写域**（设计档 + 代码注释面）：`AGENT-LOOP.md` · `DOC-DISCIPLINE.md` · `TUI*.md` · `CONFIG.md` · `MEMORY.md` · `TOOLS.md` · `ADVISOR-CONVERGENCE.md` · `PROMPT-SYSTEM.md` · `CONTEXT-COMPACTION.md` · `docs/vsc/design/*` · 代码面 ~30 档注释。
- **非本席写域（上抛主 agent · 需求档 = 主 agent 笔）**：`docs/core/requirements/AGENT-LOOP.md`（§6.10 / §6.20 / §6.27\* 指称）· `docs/core/requirements/ADVISOR-CONVERGENCE.md:151`（§6.18）· `docs/core/requirements/ENGINEERING-MODE-V2.md`（1 处）——清单交父侧落笔。
- **地图登记**：`docs/README.md` §4（+2 档登记 + 计数核对行收正）。

**回归判据（可机检）**：

- `node scripts/doc-check.mjs --root .`：本批触碰档**零新增**（悬空 / 行宽）。
- 结构机检（ASCII 令牌 · 单行 `node -e`；两读 + 一否定）：
  ① **迁出节 × 留守档名共现 = 0**（对 §6.8 / §6.10 / §6.11 / §6.18 / §6.19 / §6.20 / §6.27，全仓不得存在「`AGENT-LOOP-SUBAGENT.md` 同句 + 该节号」）；
  ② **迁出节标题齐备**（§6.8 / §6.10 / §6.11 / §6.18 / §6.19 / §6.20 在新档存在；§6.27 及其 `#### 6.27.12.x` 全族在 UPSTREAM 档存在）；
  ③ **段零改动**：迁出节文本与 `git show HEAD:docs/core/design/AGENT-LOOP-SUBAGENT.md` 对应行段**逐字相等**（含缩进——本项无缩进变化）。
- 引用解析：改指后全仓对 §6.\* 的档名归属**唯一**（同节号不得两档同时被指称——① 的强化形式）。

**拆后结构目标（非阈值 · as-of 复读对表供实施轮用）**：三档承载族数 = **10 / 6 / 1**（= 17 顶节）；最大单节 = §6.27（998 行 · 单机制族随迁）；两新档头 + 两新建档行齐备；变更记录随留守档（144 行零改）。**行账（逐项自洽）**：留守 **906** = 头 9 + 十节 753 + 变更记录 144；ASYNC-POOL = **342**（44 + 79 + 40 + 179）；UPSTREAM = **998**（§6.27 一族）；合计 = **2246** = 现档全行数（两新档另加新头）。**仅作对表参考，不作判据**（§3.7）。

## 2.6 受影响文件表（含新增档）

**源 / 测试档**（行数口径 = `wc -l` · 现量 = as-of 2026-09-22 09:4x 本席实读）：

| # | 文件 | 现量 | Δ（估） | 动作 | 条目 |
|---|---|---|---|---|---|
| 1 | `thincoder-cli/src/tui/key-handler.mjs` | 498 | → ~160 | 留守（清位/`convMaxScroll` + 分派器） | #226 |
| 2 | `thincoder-cli/src/tui/index.mjs` | 499 | → ~250 | 留守（装配序列 + 导出面） | #159 |
| 3 | `thincoder-cli/src/tui/key-handler-ctrlc.mjs`（拟新增） | 0 | +~120 | 新档（Ctrl+C 五分支） | #226 |
| 4 | `thincoder-cli/src/tui/key-handler-modals.mjs`（拟新增） | 0 | +~90 | 新档（picker / wizard） | #226 |
| 5 | `thincoder-cli/src/tui/key-handler-busy.mjs`（拟新增） | 0 | +~50 | 新档（busy 门禁——busy-extend 落点整块） | #226 |
| 6 | `thincoder-cli/src/tui/key-handler-scroll.mjs`（拟新增） | 0 | +~105 | 新档（翻页 / 历史 / 光标） | #226 |
| 7 | `thincoder-cli/src/tui/key-handler-edit.mjs`（拟新增） | 0 | +~105 | 新档（Tab / 清框 / 编辑 / Enter / 粘贴 / 可打印） | #226 |
| 8 | `thincoder-cli/src/tui/tui-state.mjs`（拟新增） | 0 | +~65 | 新档（state 工厂） | #159 |
| 9 | `thincoder-cli/src/tui/input-face.mjs`（拟新增） | 0 | +~205（上限 ≤250） | 新档（早挂载工厂：输入流 + data 处理器；后置挂载入口：键盘接线 + 鼠标 dispatch） | #159 |
| 10 | `thincoder-cli/src/tui/conversation-writer.mjs`（拟新增） | 0 | +~55 | 新档（pushLine / pushLabel / 标签位） | #159 |
| 11 | `thincoder-cli/src/tui/turn-face.mjs`（拟新增） | 0 | +~60 | 新档（submit / turn / 交互 / 粘贴） | #159 |
| 12 | `thincoder-vscode/webview/chat.js` | 454 | → ~180 | 留守（装配 + 握手 + 显式 init 调用） | #163 |
| 13 | `thincoder-vscode/webview/chat-messages.js`（拟新增） | 0 | +~230 | 新档（消息分发单表） | #163 |
| 14 | `thincoder-vscode/webview/chat-status.js`（拟新增） | 0 | +~120 | 新档（状态段 / 压缩行 / digest 轮） | #163 |
| 15 | `thincoder-vscode/test/chat-panel-messages.test.mjs` | 524 | → ~400（−3 例） | 迁出 ⑫⑬⑭ | #169A |
| 16 | `thincoder-vscode/test/panel-cancel-routing.test.mjs`（拟新增） | 0 | +~162（+3 例） | 新档（自持头：stubPanel 副本 + 迁出块 122 行） | #169A |
| 17 | `thincoder-vscode/test/agent-lifecycle-singleton.test.mjs` | 500 | → ~410（−4 例） | 迁出 round-trip 族 | #169B |
| 18 | `thincoder-vscode/test/agent-session-fields-roundtrip.test.mjs`（拟新增） | 0 | +~155（+4 例） | 新档（自持头） | #169B |
| 19 | `thincoder-vscode/test/files.mjs` | 130 | +2 | 登记两新测档（漏登记反查会红） | #169 |

**文档档**（`DOC-DISCIPLINE.md` §3.7 口径：`.md` 行**不列**「当前行数 / 预计增量」两列）：

| 档 | 动作 | 车道 |
|---|---|---|
| `docs/core/design/AGENT-LOOP-SUBAGENT.md` | 留守 + 头部收正 + 变更记录 +1 · `:983-985` 旧「两分」建议句收正为三分 | 档面 |
| `docs/core/design/AGENT-LOOP-ASYNC-POOL.md`（拟新增） | 新档（§6.8/§6.10/§6.11/§6.18/§6.19/§6.20 + 新头 + 新建档行） | 档面 |
| `docs/core/design/AGENT-LOOP-UPSTREAM.md`（拟新增） | 新档（§6.27 全族 + 新头 + 新建档行） | 档面 |
| `docs/README.md` | §4 地图 +2 档登记 + 计数核对行收正 | 档面 |
| `docs/core/design/AGENT-LOOP.md` · `DOC-DISCIPLINE.md` · `CONFIG.md` · `MEMORY.md` · `TOOLS.md` · `ADVISOR-CONVERGENCE.md` · `PROMPT-SYSTEM.md` · `CONTEXT-COMPACTION.md` | 迁出节指称改指新档名（节号不动）；`MEMORY.md:314` 的 `index.mjs:169` 坐标随 #159 改指 | 档面 |
| `docs/cli/design/TUI.md` · `TUI-INPUT-BOX.md` · `TUI-SESSION-VIEW.md` · `TUI-COMMANDS.md` | 模块地图 / 职责行按新档清单收正 + 已迁出函数与块的坐标改指 | 档面 |
| `docs/vsc/design/WEBVIEW.md` · `WEBVIEW-PROTOCOL.md` · `VSC-DEBT.md` · `WEBVIEW-INPUT.md` · `PROJECT-SWITCHER.md` | §3 文件表 +1 行 · §12.1 越线登记收正 · §12/§13 消费列坐标按 `--emit` 重出 · 指称行改指 | 档面 |
| 代码注释面 **28 档**（实扫 · 2026-09-22——逐档见下方表；改指 = 行内替换 ⇒ **Δ = 0**） | 指称**迁出节**（§6.8/§6.10/§6.11/§6.18/§6.19/§6.20/§6.27\*）者改档名；指称**留守节**者零改 | 代码车道 |
| `docs/core/requirements/AGENT-LOOP.md` · `ADVISOR-CONVERGENCE.md` · `ENGINEERING-MODE-V2.md` | 迁出节指称改指（**需求档 = 主 agent 笔**） | **上抛** |
| `docs/core/design/STRUCTURE-DEBT.md` | §2 → §3 移档（消解证据） | 收口轮 |

**代码注释面逐档（`AGENT-LOOP-SUBAGENT.md` 指称 · 实扫 as-of 2026-09-22 · 行数 = `wc -l`；评审 #4 落点）**：命中 = 该档引用的节号与处数；`改指` = 含迁出节引用（行内改档名 · **结构未变**）；`零改` = 仅留守节引用。

| 档 | 现量 | 命中（处数） | 处置 |
|---|---|---|---|
| `thincoder-core/agent/family-tools.mjs` | 187 | §6.27.4 ×1 | 改指 |
| `thincoder-core/agent/helpers.mjs` | 421 | §6.8 ×2 · §6.27.12.8 ×1 | 改指 |
| `thincoder-core/agent/run-stages.mjs` | 266 | §6.20 ×2 | 改指 |
| `thincoder-core/agent-tools/advisor-async.mjs` | 481 | §6.10 ×4 · §6.21 ×1 | 改指（§6.21 处零改） |
| `thincoder-core/agent-tools/advisor.mjs` | 280 | §6.10 ×1 | 改指 |
| `thincoder-core/agent-tools/async-discard.mjs` | 143 | §6.20 ×1 | 改指 |
| `thincoder-core/agent-tools/escalate-async.mjs` | 302 | §6.21 ×1 | 零改 |
| `thincoder-core/agent-tools/parent-channel.mjs` | 248 | §6.27 ×1 · §6.27.12.13 ×1 | 改指 |
| `thincoder-core/agent-tools/subagent-actions.mjs` | 495 | §6.25 ×1 | 零改 |
| `thincoder-core/agent-tools/subagent-async.mjs` | 456 | §6.10 ×1 | 改指 |
| `thincoder-core/agent-tools/subagent-run.mjs` | 208 | §6.21 ×1 | 零改 |
| `thincoder-core/agent-tools/subagent-scheduler.mjs` | 446 | §6.21 ×2 | 零改 |
| `thincoder-core/agent-tools/subagent-spawn.mjs` | 478 | §6.27.4 ×1 | 改指 |
| `thincoder-core/agent-tools.mjs` | 30 | §6.27.4 ×1 | 改指 |
| `thincoder-core/agent.mjs` | 436 | §6.27.4 ×1 | 改指 |
| `thincoder-core/config.mjs` | 419 | §6.10 ×1 | 改指 |
| `thincoder-core/test/advisor-pool-queue.test.mjs` | 219 | §6.10 ×1 | 改指 |
| `thincoder-core/test/async-discard.test.mjs` | 253 | §6.20 ×1 | 改指 |
| `thincoder-core/test/core-hygiene.test.mjs` | 177 | §6.27.6 ×1 | 改指 |
| `thincoder-core/test/parent-channel-upstream.test.mjs` | 146 | §6.27.12.9 ×1 | 改指 |
| `thincoder-core/test/parent-channel.test.mjs` | 294 | §6.27.9 ×1 | 改指 |
| `thincoder-core/test/turn-domain-mode.test.mjs` | 57 | §6.8 ×1 | 改指 |
| `thincoder-cli/src/tui/suspension-drive.mjs` | 334 | §6.27.12 ×2 · §6.20 ×2 | 改指 |
| `thincoder-cli/test/subagent-scheduler.test.mjs` | 265 | §6.21 ×1 | 零改 |
| `thincoder-vscode/src/agent/turn-domains.mjs` | 35 | §6.27.12.x ×2（`:3` + `:22`——父侧核正 2026-09-22 · 可 revert） | 改指 |
| `thincoder-vscode/src/extension/suspension.mjs` | 439 | §6.27.12.12 ×1 | 改指 |
| `thincoder-vscode/test/files.mjs` | 130 | §6.24 ×1 | 零改 |
| `thincoder-vscode/test/upstream-parity.test.mjs` | 275 | §6.27.12.12 ×1 | 改指 |

> 计数自洽：28 档 = 改指 **22** + 零改 **6**（thincoder-core 22 = 18 + 4 · thincoder-cli 2 = 1 + 1 · thincoder-vscode 4 = 3 + 1）。
> 逐档标注规则：改指 = 行内字符串替换（`AGENT-LOOP-SUBAGENT.md` → 新档名）⇒ 行数 **Δ = 0**、结构未变；本表 = as-of 复取面（不追值）——实施轮若因他批在飞使任一行数 ≠ 上表，逐处说明。
> **落点实测漂移 3 档（2026-09-22 实施轮实读 `wc -l`——本表 as-of 值不回改）**：`thincoder-core/agent-tools/subagent-spawn.mjs` **478 → 406**（他批在飞改写）· `thincoder-core/test/core-hygiene.test.mjs` **177 → 183**（他批在飞）· `thincoder-vscode/test/files.mjs` **130 → 134**（本批 +2 登记行 + 他批先前 +2）；其余 25 档逐数相符。本席 22 档改指均为行内替换（Δ = 0）——漂移均为「文件本体他批增删、改指行未增删」（机检令牌实跑读数 = 3 drift / 28）。
> **行数不变机检（ASCII 令牌 · 单行 `node -e`）**：`node -e "const fs=require('fs');const T=['thincoder-core/agent/family-tools.mjs:187','thincoder-core/agent/helpers.mjs:421','thincoder-core/agent/run-stages.mjs:266','thincoder-core/agent-tools/advisor-async.mjs:481','thincoder-core/agent-tools/advisor.mjs:280','thincoder-core/agent-tools/async-discard.mjs:143','thincoder-core/agent-tools/escalate-async.mjs:302','thincoder-core/agent-tools/parent-channel.mjs:248','thincoder-core/agent-tools/subagent-actions.mjs:495','thincoder-core/agent-tools/subagent-async.mjs:456','thincoder-core/agent-tools/subagent-run.mjs:208','thincoder-core/agent-tools/subagent-scheduler.mjs:446','thincoder-core/agent-tools/subagent-spawn.mjs:478','thincoder-core/agent-tools.mjs:30','thincoder-core/agent.mjs:436','thincoder-core/config.mjs:419','thincoder-core/test/advisor-pool-queue.test.mjs:219','thincoder-core/test/async-discard.test.mjs:253','thincoder-core/test/core-hygiene.test.mjs:177','thincoder-core/test/parent-channel-upstream.test.mjs:146','thincoder-core/test/parent-channel.test.mjs:294','thincoder-core/test/turn-domain-mode.test.mjs:57','thincoder-cli/src/tui/suspension-drive.mjs:334','thincoder-cli/test/subagent-scheduler.test.mjs:265','thincoder-vscode/src/agent/turn-domains.mjs:35','thincoder-vscode/src/extension/suspension.mjs:439','thincoder-vscode/test/files.mjs:130','thincoder-vscode/test/upstream-parity.test.mjs:275'];for(const s of T){const i=s.lastIndexOf(':');const p=s.slice(0,i),n=+s.slice(i+1);const c=(fs.readFileSync(p,'utf8').match(/\n/g)||[]).length;if(c!==n)throw new Error(p+' '+c+'!='+n)}console.log('COMMENT-FACE OK (28)')"`

## 2.7 验收对照（逐条回指 · 可机检）

| # | 判据 | 回指 |
|---|---|---|
| AC-1 | `cd thincoder-cli && npm test` 全绿 ∧ `key-handler.mjs` 最长顶层函数 ≤120 ∧ 五新档最长顶层函数 ≤150 ∧ 六档各 ≤200 行 ∧ 导出名集 `clearAttention,convMaxScroll,createKeyHandler` 恒等 ∧ 迁出块逐字对表通过 | #226（§2.1） |
| AC-2 | 同上 CLI 面 ∧ `startTUI` ≤160 行 ∧ `index.mjs` ≤300 行 ∧ 四新档上限 = `input-face.mjs` ≤250 / 其余三档各 ≤200 ∧ `input-face.mjs` 二段接口（早挂载 `:153` 原址 + 后置挂载入口 `:455`/`:473` 原址）∧ 导出名集 `pendingNoticeReady,promptProviderIfInvalid,startTUI,upgradeFailureText` 恒等 ∧ `node test-startup.mjs` 通过 | #159（§2.2） |
| AC-3 | `cd thincoder-vscode && npm test` 全绿 ∧ 四档各 ≤500 行 ∧ 用例数守恒 26（8/3/11/4）∧ 两新档 `files.mjs` 登记在位 ∧ 新档零跨档 import | #169（§2.3） |
| AC-4 | 同上 VSC 面 ∧ 三档各 ≤300 行 ∧ `protocol-coverage` 两档全绿 ∧ `--emit` 差集 = 0（除坐标列）∧ `case` 标签集恒等 ∧ VSC 测试注释面 `chat.js:<N>` 坐标残留 = 0（§2.4 令牌） | #163（§2.4） |
| AC-5 | `node scripts/doc-check.mjs --root .` 本批触碰档零新增（悬空 / 行宽）∧ 迁出节 × 留守档名共现 = 0 ∧ 迁出节标题在新档齐备 ∧ 迁出节逐字对表（`git show HEAD` 比对）通过 ∧ `docs/README.md` §4 登记 +2 且计数自洽 ∧ 代码注释面 28 档行数逐档对表（Δ = 0——§2.6 令牌） | #67（§2.5） |
| AC-6 | **零语义面**：`git diff --stat -- thincoder-core/prompts docs/core/design/prompts` 为空 ∧ 需求档零行（本批自身）∧ 断言语义零改增删（测试侧唯一新增 = `files.mjs` 2 行登记）∧ 判据面（`docs/**/requirements/**`）零触碰 | 批件铁律（§1） |
| AC-7 | 三端全绿读数：核 `npm test`（不涉本批写域，回归确认）· CLI `npm test` · VSC `npm test` | 全体 |

## 2.8 顺序与在飞批对齐

1. **前提（硬）**：在飞批 `busy-extend`（台账 #224 · 未提交改动覆盖 `key-handler.mjs` / `index.mjs` / `render-frame.mjs` / `suspension-drive.mjs` / VSC 测档 / 设计档 8 档）**先落定并提交**——本批方案按**现盘**设计，实施 = **busy-extend 落点之上再拆**：拆前先 `git status --porcelain` 确认在飞批已收，行号与读数**按落点重取**；`key-handler-busy.mjs` 的搬移边界 = busy-extend 改写后的 busy 门禁块**整块**。
2. **批内排序（父侧调度）**：**L1（VSC 包 · eng-coder）** #169 → #163（先测试档后 webview；同包内零文件交）∥ **L2（CLI 包 · eng-coder）** #226 → #159（同包；两档互不依赖，顺序化以避同批并发写）；L1 ∥ L2 可并行（不同包）。
3. **档面车道（L3 · eng-designer · 无 token）**：#67 三分 + 全档指称改指 + 模块地图收正——**后置于 L1 / L2**（新档名与坐标以落点为准）；其中 **#67 的正文搬移**（纯文档域、与代码零交）可与 L1 / L2 **并行**，**指称改指 + 地图登记**须后置。
4. **依赖说明**：本批三条目互不共享文件（CLI 两档同包不同文件；VSC 两档不同层）；**唯一串行约束 = busy-extend 落定**（父侧排队）。

## 2.9 边界（本批不做）

1. **不实施**（本轮 = 设计轮）；不改判据面（`prompts/**` · 需求档 · 设计判据句）；不扩扫（**5 条为界**——发现项入 §2.10 另册）。
2. **不改行为**：断言语义零改增删；无新增机制 / 状态位 / 常量；不新增 i18n 键。
3. **不做**：`STRUCTURE-DEBT.md` §2 → §3 移档（收口轮）· 需求档指称改指（主 agent 笔）· `docs/core/requirements/**` 零触碰 · `_archive/**` 与冻结批档零触碰 · `thincoder-core/src` 业务面零触碰（本批写域仅 CLI TUI 三档 + VSC webview 两档 + VSC 测试四档 + 设计档面）。
4. **不做**：为拆分新建测试语义（唯一新增断言 = 结构机检与登记行）；不合并近似分支（D-K2）· 不拆分发单表（D-C2）· 不拆 §6.27 子节（D-D2）。

## 2.10 发现与上抛（逐条 · 不静默）

1. **读数漂移 4 处**（在飞批并发写入 ⇒ 台账记值 ≠ 现盘）：#169 521 → **524**（且 524 **已在 >500 违规态**——busy-extend 又 +3）· #163 446 → **454** · #226 459 → **461** · #67 2155 → **2238**。台账行本体 = 父侧笔 ⇒ 上抛。
2. **#67 的旧建议与现案不同形**：档内 `:983-985` 在册建议 = 「子代理族 / 评审池族**两分**」，本方案 = **三分**（D-D1，理由在 §2.5）。该句为设计档活面陈述 ⇒ 拆档落地时**同批收正**（归档面车道；不留并存陈述）。
3. **`agent-lifecycle-singleton.test.mjs` = 500 = 硬限在位零余量**（非违规，但任一增量即越限）——台账 #169 判「压线」属实。
4. **`thincoder-vscode/test/files.mjs` 登记面**：VSC `npm test` 含无漏登记反查 ⇒ 两新测试档**必须登记**（非纯搬移项，实施轮硬动作）。
5. **CLI 测试收集面 fail-closed**：`thincoder-cli/test/run.mjs:36`–`:41` 只收集 `test/` 与 `test/integration/` 两层，深层测试档 = 永不执行 ⇒ 本批 CLI 侧不新增测试档（无需新增即不涉此约束，登记备查）。
6. **`docs/core/design/MEMORY.md:314` 坐标 `index.mjs:169`**（stdin 回调）已漂（现 `:180`–`:288`）⇒ 随 #159 档面改指（非阻塞 · 属 #159 调用面）。
7. **文档口径提醒（防误引）**：`DOC-DISCIPLINE.md` §3.7「文档无行数义务」⇒ #67 判据 = 结构可读性；请评审按此口径核（不得以行数为 #67 的拆分依据或达标判据）。
8. **协议提取器兼容性已核（正面结论）**：`protocol-coverage` 两档**递归自动 glob `webview/**`** ⇒ #163 新档自动入扫，零登记改动；**唯一硬约束 = 分发形态逐字同形**（§2.4 AC-4）。

## 2.11 轮内机检读数与追加发现（设计轮终态 · 2026-09-22 09:5x）

**机检读数（本席实跑一次 · 交付前闸）**：`node scripts/doc-check.mjs --root .` = **悬空 16 · 行宽 12**（exit 1）——**与批前基线逐数一致**（对照 = busy-extend 批档 §2「悬空 16（基线）· 行宽 12（基线）」）⇒ **本批零新增**。exit 1 = **存量红**（各档逐条在册于台账 #203 / #216 族，非本批引入、非本批写域）。

**口径核准（本轮实读 `PROJECT-MANIFEST.json` `checkConfig`）**：`scanDirs = ["docs"]` · `lineWidth = 300` · `anchors.exclude = ["_archive", "batches"]`，且行宽检查复用同一 exclude（`scripts/doc-check.mjs:64`）⇒ **`docs/batches/**` 不入锚 / 行宽扫描域**（本节存在的长行不构成本批新增；§2 表格行按可读性尽力折行，非闸项）。

**追加发现（承 §2.10 · 续号）**：

9. **本批写域内含存量行宽违规 1 处**：`docs/core/design/AGENT-LOOP-SUBAGENT.md:2094`（345 字符——位于 §6.28，**押留守档**；系台账 #203 在册基线项，锚定读数已随 busy-extend 写入由 `:2091` → `:2094`）。建议：**不并在本批**（不扩扫 · #203 在册），如需，则由档面车道**随触顺手折行**（纯折行 · 语义零改）——请父侧裁。
10. **`docs/cli/requirements/TUI.md:93`（560 字符）** = 存量行宽违规且属**需求档**（主 agent 写域）⇒ 仅登记（非本批面）。
11. **结构债总账档的登记时点**：`docs/core/design/STRUCTURE-DEBT.md` 现盘未列本批 5 条（其 §2 为 4 条历史条目）——本批 5 条以**台账 #67/#159/#226/#169/#163 + 本 §2** 为在册面；该档 §2 → §3 的消解移档（含 5 条证据行）= **收口轮**（§4 纪律 3）。**登记备查：本设计轮未动该档**（§2.9 边界 3）。

**设计轮交付清单（本席）**：本 §2（§2.1–§2.11）+ 状态行；**未动任何设计档 / 源码 / 测试档 / 需求档**（写域 = 仅本批档 §2 段）。

### §2 修正块（评审轮 1 · 10 条逐条落位 · 2026-09-22 · eng-designer）

**依据** = 本档 §3 轮次 1 发现表（🔴1 · 🟡5 · 🔵5）逐条修正；**就地替换**（不留失效表达）。#11 = 登记性说明（零动作）。**本轮不做**：五条方案本体（#226 / #159 / #169 / #163 / #67 的拆分语义）· 源码 / 需求档 / 冻结档 / 台账零触 · 不扩扫。

| # | 落位（号 → 改动处） |
|---|---|
| 1 🔴 | §2.2 改**二段接口**：表行 `:103`（`createInputFace(ctx)` → `{ keyStream, mountKeys(deps), mountMouse(deps) }` + 早挂载/后置挂载边界）+ **接口面新段** `:107`–`:111`（构造期读值证据 `key-handler.mjs:39` / `mouse.mjs:197` + TDZ 判据）+ 顺序不变量 1 `:117`（早挂载 `:153` 原址 + 后置入口 `:455`/`:473` 原址）+ §2.6 行 9 `:263`（Δ +~205）+ AC-2 `:332`（导出面 / 可达性回指） |
| 2 🟡 | 两令牌抛错阈值 = AC 自身数：§2.1 `:87`（文件 >200 / 分派器 >120 / 五新档函数 >150 ⇒ throw）+ 判据注 `:88`；§2.2 `:128`（`index.mjs` >300 / `startTUI` >160 / 四档上限 200·250 ⇒ throw）+ `:129`——旧版「>250 不抛 / 恒真分支（`len<200||len>200`）/ 形态示意」全部替除；扫描锚钉死为**名称锚**（六档名 / `^export async function startTUI` / 四档名） |
| 3 🟡 | §2.2 表行 `:103` ≤250（原 ≤200 收正）+ 拆后读数目标 `:133` 单一口径（input-face ≤250 · 其余三档各 ≤200）；§2.6 行 9 `:263` Δ = +~205（原 +~185）；**同族顺修（报告不隐匿）**：§2.1 五档表列 `:53`–`:57` 与读数目标 `:92` 归一到 ≤200（档内最长顶层函数 ≤150 另列——与 AC-1 单一口径） |
| 4 🟡 | §2.6 注释面行 `:286` 改「28 档（实扫 · Δ = 0）」+ **逐档表** `:290`–`:319`（28 行：现量 + 命中节 ×处数 + 改指/零改）+ 计数自洽注 `:321` + 逐档标注规则 `:322` + 行数不变机检令牌 `:325` |
| 5 🟡 | §2.3 两档各补越线核查：`:146`（chat-panel：终点理由 = 共享 `stubPanel` 全量夹具 ⇒ 300 不可达而不破 D-2 + 触发 = 实质增改 ≥+60 / test 档位门）· `:153`（agent-lifecycle：装置面 `:40`–`:83` 共享 + 触发 = 外提 `applySlotSessionState` 三例族）——形态对照 `AGENT-LOOP-SUBAGENT.md` §6.27.12.7 ② |
| 6 🟡 | §2.4 增 **VSC 测试注释面**改指清单 `:191`（评审实核 5 处 + 本席实扫补 4 处；规则 = 坐标 / 「case 在 chat.js」结构位指称改指 `chat-messages.js` · 入口指称零改）+ 坐标残留机检 `:192`；AC-4 `:334` 回收该判据 |
| 7 🔵 | §2.5 现读读数 `:205` 收正：**17 顶节**（18 收正）· 文件 **2246**（2238 → +8——他批在飞：§6.27 段 +2 · 变更记录 +6）· 变更记录 `:2103`–`:2246` = **144 行**；表内两区间 `:213` / `:215` 同步（`:518-2102` · `:1034-2031` · `:1306`/`:1331`）；结构目标 `:247` 行账 = 906（头 9 + 十节 753 + 变更记录 144）+ 342 + 998 = **2246**（算式逐项自洽） |
| 8 🔵 | §2.3 块界复取：`:143` ⑫⑬⑭ = 45 + 43 + 34 = **122 行**（124 收正）；`:144` 两助手区间双口径（JSDoc 起 / 函数起 `:372` · `:461`）+ 自持头 ≈40 + 新档 ≈**162**（原 ≈220）；`:145` 原档 ≈**402** |
| 9 🔵 | §2.1 增「五族调用序列」表 `:61`–`:71` + 交错等价判据 `:73`（唯一跨族重叠 = `tab` 与 `enter`/`\r`；序 4 ≺ 序 5 保 busy 吞面；余键单族命中）+ 零语义对表口径收窄句 |
| 10 🔵 | §2 状态行：发现计数随 §2.11 收正 → **11 项**（§2.10 八 + §2.11 三） |

**读数复取（本轮实读 · as-of 2026-09-22 10:0x）**：`AGENT-LOOP-SUBAGENT.md` = **2246 行**（评审轮后 +8——他批在飞落笔；`git status` 实见该档 M）。§2.10-1 / §2.11-9 两处为设计轮 as-of 发现记录（记录面不回改）——现读数以 §2.5 与本块为准。

**机检基线（开工前实跑 → 交付前复跑）**：`node scripts/doc-check.mjs --root .` = **悬空 16 · 行宽 14**（开工前）→ **悬空 16 · 行宽 12**（交付前）——−2 系他批在飞两处折行收正（`AGENT-LOOP-SUBAGENT.md:2105` · `MEMORY.md:472`，非本批写入）。写域 = 仅本档 §2（`docs/batches/**` 不入锚 / 行宽扫描域——§2.11 口径核准）⇒ 两侧读数**本批零新增**。存量红：悬空 16（#203 / #216 族在册）· 行宽 12（需求档 6 行 + 设计档 6 行——各在册）。

**边界确认**：本轮零触碰源码 / 测试档 / 需求档 / 冻结档 / 台账；唯一写域 = 本档 §2（就地替换 + 本块 append）。

### §2 实施轮（档面车道 · eng-designer · 2026-09-22）

**依据** = 父侧派单（§2.5 三分 + §2.6 档面行 + §2.7 验收对照；轮次 = initial）· 台账 #67 · §4 代签批准（三条件齐备）。
**写域** = 设计档面（`docs/core/design/**` · `docs/cli/design/**` · `docs/vsc/design/**` · `docs/README.md`）；**代码 / 测试 / 需求档 / 台账 / 冻结档（`_archive` · 既有批档）零触**。
**实现机制（如实声明）**：迁出 = 「整档字节复制 → 工具级行段删除（非脚本改写）」；新档头 / 变更记录 / 收正句 = 本席逐句撰写；逐字性由机检 ③（SHA256 对表）背书。

**交付（三分 + 头部收正 + 指针面 · 全部落地）**

| # | 动作 | 落点 / 读数（`wc -l`） |
|---|---|---|
| 1 | 留守档 = 子代理工具契约与装配面 | `docs/core/design/AGENT-LOOP-SUBAGENT.md` = **917**（§6.7 · §6.9 · §6.12 · §6.21–§6.26 · §6.28 + 头 + 变更记录） |
| 2 | 新档 = 后台异步池 / 挂起与 digest / 评审实例面 | `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` = **357**（§6.8 · §6.10 · §6.11 · §6.18（含英文声明块）· §6.19 · §6.20 + 新头 + 新建档行） |
| 3 | 新档 = 子 → 父上行与唤醒面 | `docs/core/design/AGENT-LOOP-UPSTREAM.md` = **1013**（§6.27 全族 + §6.27.8 内两段无编号 `##` 提示词面文本块 + 新头 + 新建档行） |
| 4 | 留守档头部收正 | 标题（→「子代理工具契约与装配面」）· 归属句（+ 三分映射行）· 节号句（本档承接节）· 变更记录 +1（三分条目） |
| 5 | 旧「两分」建议句收正 | §6.26 尾句（`:644`–`:645`）→ 三分落地现态（不留并存 / 失效陈述） |
| 6 | 档面指针改指 | 12 档（见下表）· 行内改档名 / 节号不动 |
| 7 | 地图登记 | `docs/README.md` §4（顾问 / 协作 / 子代理面 **7 → 9 档**）+ 计数核对行收正 + 变更记录一行 |

**机检读数（实跑 · cwd = 仓根）**

- **doc-check**：`node scripts/doc-check.mjs --root .` = **悬空 4 · 行宽 2** —— **≡ 开工前基线**（悬空 4 / 行宽 2；与 §2.11 记的 16 / 12 不同 = 他批在飞已收正）⇒ **本批零新增**（exit 1 = 存量红：悬空 4 = `SESSION.md:784` + `TOOLS.md:923`/`:929`；行宽 2 = `BATCH-RECORD.md:358`/`:365`——均在册、非本批写域）。
- **机检 ③（段零改动）**：**PASS** —— ASYNC-POOL 正文 341 行 sha `029de1a1…e0f5` ≡ 开工前快照；UPSTREAM 正文 997 行 sha `b1155107…87b6` ≡ 开工前快照（逐字含缩进；另与 `git show HEAD` 版本差异 = 他批在飞落笔的 8 处，见偏离 1）。
- **机检 ②（迁出节标题齐备）**：ASYNC-POOL 7 锚 ∧ UPSTREAM 18 锚 —— **缺失 0**。
- **机检 ①（迁出节 × 留守档名共现 = 0）**：**未达字面 0**（读数分类见下）——**① 与 ③ 在本设计下令不可同时为 0**（迁出块内的历史「受影响文件表」行含旧档名 + 节号，改即破 ③）。分类读数：**档面 live 9**（其中 **7 = 改指后的正确双档陈述**：`AGENT-LOOP.md:495`/`:530` · `DOC-DISCIPLINE.md:419`/`:1004`/`:1042`/`:1199` · `DOC-MIGRATION.md:30`；**2 = 边界零改**：`ADVISOR-CONVERGENCE.md:331` 否定式无节号 · `TODO-archive.md:263` 记录面）· **新档迁出块内 4**（`ASYNC-POOL.md:283` · `UPSTREAM.md:251`/`:667`/`:956`）· **需求档 8**（上抛面）· **代码面 30（20 档）**（代码车道）· 冻结档 152（`_archive` / 既有批档）。
- **行账（逐项自洽）**：**917 + 357 + 1013 = 2287**；对照落点原档 2251：**+36** = 留守 +6（头 +1 · §6.26 句折行 +1 · 变更记录 +4）+ 两新档头 2×11 + 两新建档行块 2×5 − 迁出块尾空行 2。**§2.5 行账对照**：设计值 906/342/998（as-of 2246）→ 落点实读 **911/342/998**（as-of 2251）⇒ 本批按落点重取。

**档面指针改指（行内 · 节号不动 · 逐处读回 `file:line`）**

| # | 档 | 处 | 处（改后行号） |
|---|---|---|---|
| 1 | `docs/core/design/AGENT-LOOP.md` | 28 | `:11` `:43` `:103` `:110` `:120` `:147` `:173` `:195` `:219` `:221` `:303` `:389` `:414` `:418` `:422` `:446` `:474` `:475` `:476` `:487` `:495` `:505` `:510` `:514` `:528` `:530` `:556` `:565`（`:9`–`:11` / `:173` / `:303` / `:495` / `:530` = 跨面行，按三档拆分改写） |
| 2 | `docs/core/design/DOC-DISCIPLINE.md` | 5 | `:409` `:419` `:1004` `:1042` `:1199`（`:419`/`:1004`/`:1042`/`:1199` = 双档锚点拆分） |
| 3 | `docs/core/design/CONFIG.md` | 7 | `:96` `:112` `:113` `:123` `:146` `:148` `:149` |
| 4 | `docs/core/design/TOOLS.md` | 1 | `:801` |
| 5 | `docs/core/design/DOC-MIGRATION.md` | 1 | `:30` |
| 6 | `docs/cli/design/TUI.md` | 5 | `:129` `:321` `:525` `:675` `:693` |
| 7 | `docs/cli/design/TUI-INPUT-BOX.md` | 4 | `:71` `:73` `:303` `:349` |
| 8 | `docs/cli/design/TUI-SESSION-VIEW.md` | 4 | `:20` `:83` `:199` `:212` |
| 9 | `docs/cli/design/TUI-COMMANDS.md` | 1 | `:44` |
| 10 | `docs/vsc/design/WEBVIEW-PROTOCOL.md` | 2 | `:52` `:511` |
| 11 | `docs/vsc/design/WEBVIEW.md` | 1 | `:574` |
| 12 | `docs/README.md` | 4 | `:71` `:73` `:76`–`:77` `:92` |

（全仓「两新档名」指称读回 = 70 行 / 15 档——含两新档自身头与留守档自身 4 处。）

**偏离与发现（逐条 · 不静默）**

1. **读数漂移**：派单「现读 2246」→ 落点实读 **2251**（+5 = 他批在飞落笔）⇒ 全文按落点重取；**机检 ③ 的参考面随之改为「开工前落点快照」**（`git show HEAD` 版本 = 2246 态，与落点差他批 8 处——逐处可归因，非本批写入）。
2. **机检 ① 与 ③ 互斥**（见上）⇒ 请父侧裁：① 定义收窄（排除迁出块内文 / 记录面 / 否定式）或另案改那 4 行（代价 = 破段零改动）。
3. **零改边界 3 项**：`ADVISOR-CONVERGENCE.md:331`（否定式「非 `AGENT-LOOP-SUBAGENT.md`」· 无节号 ⇒ 陈述仍真）· `TODO-archive.md:263`（档案档记录面）· `ANCHOR-DEBT-REPAIR.md:101`/`:328`（裸档名读数行 · 无节号）。
4. **`docs/README.md` 计数面**：实档 **54** = 本图登记 **53** + **待补登 1**（`MODEL-SPECS.md`——他批新档；本批不代裁，已在档面如实登记）。
5. **代码注释面落点实扫 = 31 档（20 含迁出节 + 11 仅留守节）**，§2.6 原表记 28 档（22 改指 + 6 零改）——差异逐档点名交代码车道按落点重取；本批零触。
6. **需求档 8 处**（`requirements/AGENT-LOOP.md` 7 处 · `requirements/ADVISOR-CONVERGENCE.md` 1 处）= 上抛面（主 agent 笔）；`requirements/ENGINEERING-MODE-V2.md` 2 处 = 裸档名（无节号 ⇒ 零改）。
7. **`AGENT-LOOP-SUBAGENT.md` 存量行宽（§2.11-9 记 `:2094`）**：他批（hygiene-sweep）已收正 ⇒ 本批不涉（无随触折行发生）。
8. **裸节号指称未改（登记）**：留守档与各档内以裸 §6.x 指向已迁出节者（如 §6.26 内「已在 §6.20.4 登记」）——本批规则 = 行内改档名、不新增指称 ⇒ 未动；跨档后可解析性下降，如需补档名请父侧派另轮。

### §2 档面车道尾账（fix 轮 · 5 项逐条 · 2026-09-22 · eng-designer）

**依据** = 父侧派单（号 1–5 · 指派列 = 父侧裁定 · 执行人 = 本席）· 台账 #163 / #226 / #159 的**档面尾账**（代码面 = id=34 已交回；#67 三分与已落指针 = id=35，**本轮不重开**）。
**写域** = 设计档面（`docs/vsc/design/**` · `docs/cli/design/**` · `docs/core/design/CONTEXT-COMPACTION.md` · 本档 §2）；**代码 / 测试 / 需求档 / 台账 / 冻结档零触**。

| # | 改动（号 → 落点） | 读数 / 核在 |
|---|---|---|
| 1 | `docs/vsc/design/WEBVIEW-PROTOCOL.md` §12 / §13 —— ② ③ 列**逐行按 `--emit` 现跑读数重出**（as-of 行同步为 2026-09-22 structure-debt 批）+ ③ 列改指 `webview/chat-messages.js` + 三处逐行 as-of 尾注（`busyQueued` / `workspaceGuard` / `queuedUserMessage`）随表级 as-of 行退场 + 变更记录一行 | 两表 **行数不变 = 53 / 51**（`| \`` 行计数实核）· §12 内 `webview/chat.js:` 残留 = **0** · §13 四行（`abort` / `cancelSubagent` / `openFile` / `webviewReady`）= 真留守发射点 |
| 2 | `docs/vsc/design/WEBVIEW.md` §3 文件表 +2 行（`chat-messages.js` **234** / `chat-status.js` **124**——读数 + 面）+ `chat.js` 行收正（职责收窄 + `webviewReady` `:426` → **`:147`** + 读数 **147**）+ 档数收正为 **44 档模块**口径 + 档内五处改指（§2 shell 句 `chat.js:31`/`chat-messages.js:141`/`chat.js:43` · §4.1 `chat-messages.js:194-200` · §4.5 边界 `toolOutput` 标记改指 · §5.x 握手 `chat.js:147` + host `panel-messages.mjs:276`/`:288` · D-W3 `:90` → **`:94`**）+ 变更记录一行 | 三档行数 `find /c /v ""` 实读 = 147 / 234 / 124 逐数相符 · 档数口径 = `.js` / `.mjs` 计数（CSS 5 + `index.html` 另列） |
| 3 | `docs/vsc/design/VSC-DEBT.md` §12.1 增 **#163 拆分后越线收正块**（`chat.js` **454 → 147** · 越线登记关闭；两新档 **234** / **124** 均 ≤300 ⇒ 不入登记）+ §11 变更记录一行 · `docs/vsc/design/PROJECT-SWITCHER.md:46` 改指（`chat.js:202` → `chat-messages.js:134`）+ 变更记录一行 · `docs/core/design/CONTEXT-COMPACTION.md:202` 改指（`chat.js showCompressStatus` → `chat-status.js showCompressStatus`）+ 变更记录一行 | 节点坐标按 `--emit` 反向实测（`project` = `chat-messages.js:134`；`compress` 消费位 = `chat-messages.js:179`） |
| 4 | `docs/cli/design/TUI.md` —— §1 模块地图收正：`index.mjs` 行改「装配序列」+ **补 4 行**（`tui-state` / `input-face` / `conversation-writer` / `turn-face`）；`key-handler.mjs` 行改「分派器」+ **补 5 行**（`key-handler-{ctrlc,modals,busy,scroll,edit}`）；§2 标题与启动序坐标改指 `input-face.mjs:39` / `:45`；§7.2 清位鼠标点（`input-face.mjs:62`）与 state 字面量（`tui-state.mjs`）改指 · `docs/cli/design/TUI-INPUT-BOX.md` —— §4/§4.1 执行序（`key-handler-busy.mjs`）· 先例坐标（`key-handler-edit.mjs:60-64`）· submit 拒分支（`turn-face.mjs:21-25`）· 边界 Ctrl+I（`:176-183` → **`:81-88`**）· §5.2 两处指称 · §6 表按新档清单收正（补五族 + `tui-state` / `input-face` 行） | `TUI-SESSION-VIEW.md` / `TUI-COMMANDS.md` / `TUI-TOOL-OUTPUT.md` 实读 `index.mjs` / `key-handler` / `startTUI` 命中 = **0 ⇒ 核在零改**（逐档披露）· 新档签名与坐标均按落点实读 |
| 5 | 本 §2 两处：**§2.1 导出面列按实现读法收正**（`:53`–`:56` 四行 + 新注 `:59`——布尔契约未采纳：逐字闸 AC-1 优先、实际路由 = 分派器守卫 ⇔ 原块入口条件、父侧已裁定接受）· **§2.6 三档读数漂移归因登记**（`:327`——`subagent-spawn.mjs` 478 → **406** · `core-hygiene.test.mjs` 177 → **183** · `files.mjs` 130 → **134**；本表 as-of 值不回改）+ §2.3 `:157` files.mjs 落点读数补记 | COMMENT-FACE 机检令牌实跑 = **3 drift / 28**（与登记逐数相符）· §2.1 五族签名与落点 `export function` 实读逐字相符 |

**机检读数（实跑）**：`node scripts/doc-check.mjs --root .` = **悬空 4 · 行宽 2**（≡ 开工前基线；存量红 = `SESSION.md:789` + `TOOLS.md:925`/`:931` · `BATCH-RECORD.md:358`/`:365`——均在册、非本席写域）；协议两表 `--emit` 复跑 = exit 0（`# 提取集 53` / `# 提取集 51`，处置分布 `活`）。

**偏离与发现（逐条 · 不静默）**：① 父侧派单「§2.4 / §2.6 三档读数漂移」中 `files.mjs` 落点亦见于 **§2.3 `:155`**（现 `:157`）——已在两处同笔登记（§2.6 表注 + §2.3 括注）。② 本档 `:605`–`:608` 等记录面（§5 / 评审行）零改。③ **`html`/`css` 均零触**；文档面零行宽新增。
**边界确认**：本轮零触碰源码 / 测试档 / 需求档（`docs/**/requirements/**`）/ 台账 / 冻结档；#67 三分面与已落指针未重开。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象**：`docs/batches/2026-09-22-structure-debt.md`（§2 设计面 · 5 条结构债拆分方案）· 设计评审 · 无项目标准档 / 无文档地图声明（判据降级，见发现 11）。

**计数：🔴 1 · 🟡 5 · 🔵 5（11 项）**

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Feasibility | 🔴 | §2.2 把 `:455`–`:471`（`createKeyHandler` + keypress 挂载）与 `:473`–`:474`（`createMouseDispatch`）列为 `input-face.mjs` 迁出块（`:88`），而顺序不变量 #1 把该档的挂载点钉在 `:153` 且"禁前移/后移挂载点"（`:96`）——两块都是**构造期读值**：`thincoder-cli/src/tui/key-handler.mjs:39` 构造时一次解构 18 键（`handleSlash`/`handleTab`/`pushLine`/`render`/`popPicker`/`renderPickerLines`/`loadOlder`/`pasteClipboardImage`/`wizard*`），`thincoder-cli/src/tui/mouse.mjs:197` 参数解构 `{ agent, state, pushLine, render, popPicker }`；对应绑定在 `thincoder-cli/src/tui/index.mjs:293`（`pushLine`）·`:342`（`render`）·`:346`（`loadOlder`）·`:403`·`:420`·`:425`·`:434` 才初始化 ⇒ 由 `:153` 处调用的工厂执行 ③④ = 启动期 TDZ ReferenceError（AC-2 的 `node test-startup.mjs` 必红）。设计给的惰性取值器仅覆盖 `render`/`pushLine`，对"构造期读值"无效 | 把 `input-face.mjs` 接口拆成「早挂载工厂（① 流 + ② data 处理器）」+「后置挂载入口（③ 按键接线 + ④ 鼠标 dispatch）」，后置入口在原 `:455`/`:473` 位置调用；或把 ③④ 留在 `index.mjs` 留守装配序列，并同步该档导出面与目标读数（`index.mjs` ≤300 仍可达） |
| 2 | Acceptance criteria | 🟡 | 机检令牌阈值比其 AC 松，令牌全绿不能证明 AC：`:73` 文件长度仅 >250 行抛错（AC-1 `:269` 要求六档各 ≤200）、函数长度仅 >150 点红（AC-1 要求分派器 ≤120）；`:107` 的 §2.2 令牌自注"形态示意"，判据式 `if(len<200||len>160+40)` 恒真只打印不失败，且四新档按 ≤250 判（AC-2 `:270` 要求 ≤200 / `input-face.mjs` ≤250） | 两处令牌的抛错阈值改为 AC 自身数（200 / 120 / 150 / 300 / 250），删恒真分支；落点重取时钉死扫描锚（`startTUI` 行、四新档名），使"令牌绿 ⇒ AC 绿" |
| 3 | Clarity | 🟡 | `input-face.mjs` 目标读数三处不一致：`:88` 表 ≤200 行 · `:112` 与 AC-2（`:270`）例外上限 ≤250 · §2.6（`:238`）估 +~185 | 统一为单一上限，并同步 §2.6 的 Δ 估值 |
| 4 | Affected-file annotations | 🟡 | §2.6 把"代码注释面 ~30 档"（`:261`）作聚合行，无现量 / Δ（或"结构未变"）、无逐档清单；实核（`thincoder-core` 一包即 22 档：`agent/family-tools.mjs:166` · `agent/helpers.mjs:390/400/404` · `agent/run-stages.mjs:17/176` · `agent-tools/advisor-async.mjs:2/23/283/371/377` · `agent-tools/parent-channel.mjs:3/33` · `agent-tools/subagent-spawn.mjs:469` · `config.mjs:52` · `test/turn-domain-mode.test.mjs:5` 等）⇒ 将被改动的源档无行数/增量标注，档位（是否越 300/500）不可审 | 逐档列出（`现量` + "结构未变（仅注释改指）"或 `≤±N`），或给该行补"逐档标注规则 + 行数不变机检"两项 |
| 5 | Tier / split plan | 🟡 | 拆后两档仍越 300 咨询线且只有目标值、无越线核查/触发计划：`chat-panel-messages.test.mjs` → ≈400（`:141`，现 524）· `agent-lifecycle-singleton.test.mjs` → ≈410（`:141`，现 500）；同仓先例 = 越线登记 + 触发式拆分计划（`docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.27.12.6 尾注 / §6.27.12.7 ② 形态） | 每档补一行越线核查（为何 ≤420/≤430 为终点 + 下次拆分触发条件），或把目标压到 ≤300 |
| 6 | Affected-file completeness | 🟡 | #163 移出消息分发（现 `thincoder-vscode/webview/chat.js:144`–`:333`）后，VSC 测试注释中按 `chat.js` 行号钉"消费位"的指针失效，但未列入影响清单（`:243`–`:248` 只含两新档 + `files.mjs`）：`thincoder-vscode/test/settings-refill.test.mjs:9`（`消费位 webview/chat.js:213-224`）· `test/activity-flow.test.mjs:238` · `test/async-visibility.test.mjs:370` · `test/webview-turnstate.test.mjs:18` · `test/model-menu-delete-confirm.test.mjs:52`（`chat.js:57`） | 把"chat.js 消费面/行号指针"列入同批指称改指清单（或显式登记为延后项），与 §1"档内指针随拆更新（同批）"口径一致 |
| 7 | Numeric drift | 🔵 | §2.5 内部矛盾：`:180` 记"18 个 `§6.x` 顶节"，实盘 `## 6.x` 顶节 = **17**（`:10`/`:120`/`:164`/`:186`/`:221`/`:265`/`:299`/`:318`/`:339`/`:518`/`:608`/`:634`/`:728`/`:745`/`:859`/`:1034`/`:2030`），且本设计自陈分布 10 / 6 / 1（`:222`）= 17；`:180` "变更记录（`:2101`–`:2238` · 139 行）"按区间 = 138；`:222` "留守 ≈900（正文 762 + 变更记录 139）" = 901 | 收正为 17 / 138（或改记区间），使 762+139 算式自洽 |
| 8 | Numeric drift | 🔵 | §2.3 "⑫⑬⑭ = 124 行"（`:122`）与其自陈区间之和不符（`:367`–`:411` 45 + `:413`–`:455` 43 + `:457`–`:490` 34 = 122）；两助手子区间比现盘小 2 行（`thincoder-vscode/test/chat-panel-messages.test.mjs:372` `poolHistory` 记 `:370` · `:461` `advisorQueuedEntry` 记 `:459`）——同批 #169B 区间（`:366`–`:454` · `:40`–`:83`）与现盘逐字相符 | 实施轮按落点重取 #169A 块界与助手区间，并同步 124/122、≈220/≈400 估算 |
| 9 | Clarity | 🔵 | 分派器族序未钉死：现档 scroll（`key-handler.mjs:269`–`:286` · `:341`–`:384` · `:387`–`:406`）与 busy（`:288`–`:320`）、edit（`:323`–`:335` · `:409`–`:425` · `:426`–`:460` · `:465`–`:496`）交错，D-K1（`:63`）只给"保持现档逐分支先后序"的规则；每族单次调用无法逐字复现原序列 ⇒ 零语义对表不可机械复算 | 写明五族实际调用序列（或给出交错等价的判据说明），使"零语义"可机检 |
| 10 | Doc state | 🔵 | §2 状态行（`:32`）仍记"发现 8 项"，而 §2.11 已追加发现 9–11（`:310`–`:312`）⇒ 状态行与正文计数不一致 | 状态行计数随 §2.11 收正（或改活口径"发现 N 项（§2.10 + §2.11）"） |
| 11 | Scope note（非缺陷） | 🔵 | 判据降级登记：无项目标准档 / 文档地图声明；归属维度改按设计自身引用实核——`docs/core/design/STRUCTURE-DEBT.md:12`（总账不承载单批设计正文 ⇒ §2 落点成立）· `docs/core/design/DOC-DISCIPLINE.md:192`–`:195`（§3.7 文档无行数义务 ⇒ #67 按结构可读性判）均与设计所述一致；判据引用同核实（`docs/core/requirements/METHODOLOGY.md:44` F3-1 · `DOC-DISCIPLINE.md:103` D-2）；数值面抽核相符项：`key-handler.mjs` 498 · `index.mjs` 499 · `chat-panel-messages.test.mjs` 524 · `agent-lifecycle-singleton.test.mjs` 500 · `AGENT-LOOP-SUBAGENT.md` 变更记录起 `:2101` · `thincoder-cli/test/run.mjs:36`–`:41` · `PROJECT-MANIFEST.json:20`–`:32` + `scripts/doc-check.mjs:64` | —（登记性说明，无需动作） |

**结论**：§2.1（#226）· §2.3（#169）· §2.4（#163）· §2.5（#67）的现盘边界与引用面**逐处实核相符**（含机检面论证：`thincoder-vscode/test/protocol-coverage.test.mjs:225` 递归 glob `webview/**` · `test/protocol-coverage-reverse.test.mjs:66/175` 同）；唯一阻断项 = 发现 1（#159 的 `input-face.mjs` 挂载接口）。

VERDICT: changes-required

§3 写入：本轮报告（表 + VERDICT + 计数）已 append 至本批档 §3。

### 轮次 2（评审子代理）

**评审对象**：`docs/batches/2026-09-22-structure-debt.md`（§2 + 「§2 修正块」· 修正轮 1 后）· 设计评审 · 轮 2 = 核验修正轮 1（10 项）落位 + 新问题。判据降级登记不变（无项目标准档 / 无文档地图声明 ⇒ 归属维度按设计自身引用实核）。**未复核对象**（范围声明）：本轮指令另列 7 档（session-index / pending-triage / SESSION.md / requirements/TUI.md / PROMPT-SYSTEM.md / TOOLS.md / doc-check.mjs）不属本对象——仅其中两档（requirements 的 TOOLS.md / PROMPT-SYSTEM.md）被用作 #67 指针面证据（见下），非评审对象。

**计数：🔴 0 · 🟡 5（全 Fixed）· 🔵 9（旧 5 Fixed + 登记 1 + 本轮新观察 3）——旧 11 项全部落位，无新增 🔴。**

| # | Orig# | 位置 | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | 本档 `:103`/`:107`–`:111`/`:117` · AC-2 `:332` | 🔴 | Fixed | 二段接口入档：`:103` 表行 ＝ `createInputFace(ctx)` → `{ keyStream, mountKeys(deps), mountMouse(deps) }`；`:107` 明写构造期读值证据 + TDZ 判据；`:109`–`:110` 早挂载工厂（`get render()`/`get pushLine()`/`get loadOlder()`）+ 后置入口 `mountKeys(deps)`（原 `:455` 址）/`mountMouse(deps)`（原 `:473` 址）；`:117`「禁前移/后移任一挂载址」。前提实核（本轮）：`key-handler.mjs:39` 构造期一次解构 18 键 ✓ · `mouse.mjs:197` `({ agent, state, pushLine, render, popPicker })` 参数解构 ✓ · 后定义绑定 `index.mjs:293`/`:342`/`:346`/`:403`/`:420`/`:425`/`:434` ✓ ⇒ ③④ 在原址执行时键全已初始化，TDZ 破除；② 内晚定义名（`render`/`pushLine`/`loadOlder`/`mouseCtx`/`onMouseClick`）由三条惰性取值器 + `mountMouse` 后置槽全覆盖，无遗漏名。 |
| 2 | 2 | 本档 `:87`/`:88`/`:128`/`:129` | 🟡 | Fixed | 令牌阈值 = AC 自身数：§2.1 `if(L.length>200){bad++;…}` + `const cap=p.endsWith('/key-handler.mjs')?120:150` + `if(bad)throw new Error('AC-1 BAD')`；§2.2 `if(S.length>300)throw` / `if(len>160)throw` / 四档 200·250·200·200 逐档 throw；旧「形态示意 / 恒真分支 / >250 不抛」已除。余留口径项见 #12（🔵，fail-closed 方向）。 |
| 3 | 3 | 本档 `:103`/`:133`/`:263`/`:92` | 🟡 | Fixed | 单一上限归一：`:103`「≤250 行」· `:133`「四新档上限 = `input-face.mjs` ≤250（≈205）· 其余三档各 ≤200」· §2.6 行 9「+~205（上限 ≤250）」✓；§2.1 五档表列 `:53`–`:57` 与 `:92` 同步 ≤200，与 AC-1 `:331` 一致。 |
| 4 | 4 | 本档 `:286`/`:290`–`:321`/`:322`/`:323`/`:325` | 🟡 | Fixed | 注释面 28 档逐档表（现量 + 命中节×处数 + 改指/零改）+ 标注规则「改指 ＝ 行内替换 ⇒ Δ = 0、结构未变」+ 计数自洽 28 = 22 + 6 + 行数不变令牌。抽核（本轮）：`thincoder-core/agent-tools.mjs` 表 30 = 现盘 30 ✓（§6.27.4 在 `:28`）· `thincoder-vscode/src/agent/turn-domains.mjs` 表 35 = 现盘 35 ✓ · `thincoder-core/agent/helpers.mjs` 命中「§6.8 ×2 · §6.27.12.8 ×1」逐处相符（`:390`/`:400`/`:404`）✓。一处处数偏差见 #13（🔵）。 |
| 5 | 5 | 本档 `:146`/`:153` | 🟡 | Fixed | 两档越线核查在档（终点理由 = 共享夹具/装置面不可再拆而不破 D-2 · 下次拆分触发条件 + 外提候选），形态对齐 `AGENT-LOOP-SUBAGENT.md` §6.27.12.7 ② 先例。 |
| 6 | 6 | 本档 `:191`/`:192` · AC-4 `:334` | 🟡 | Fixed | 坐标类：9 处清单 + 残留机检 `/chat\.js:\d/` = 0。本轮全量复扫 `thincoder-vscode/test` 的 `chat.js` 指称：坐标形恰 3 处（`model-menu-delete-confirm.test.mjs:11`/`:52` · `settings-refill.test.mjs:9`）均在清单 ✓；机检域外无本批遗漏（余两处命中在 `.thincoder/tmp/emit-*.txt` ＝ 产物 · `docs/_archive/**` ＝ 冻结面）。入口 gloss 类边界见 #14（🔵）。 |
| 7 | 7 | 本档 `:205`/`:213`–`:215`/`:247` | 🔵 | Fixed | 收正后与现盘逐数相符：`## 6.x` 顶节 17 处（`:10` `:120` `:164` `:186` `:221` `:265` `:299` `:318` `:339` `:518` `:608` `:634` `:728` `:745` `:859` `:1034` `:2032`）· 档 2246 行 · 变更记录 `:2103`–`:2246` = 144 行 · 行账 906（头 9 + 十节 753 + 记录 144）+ 342（44+79+40+179）+ 998（`:1034`–`:2031`）= 2246 逐项自洽。 |
| 8 | 8 | 本档 `:143`/`:144`/`:145` | 🔵 | Fixed | 122 行（45+43+34）+ 助手双口径（JSDoc 起 / 函数起 `:372`/`:461`）+ 新档 ≈162 / 原档 ≈402。本轮实核结构：`:367` ⑫ banner · `:372 function poolHistory()` · `:383` ⑫ 用例 · `:413` ⑬ banner · `:415` ⑬ 用例 · `:457` ⑭ banner · `:461 function advisorQueuedEntry()` · `:471` ⑭ 用例 · `:492` ⑮ banner ⇒ 块界相符 ✓；两助手现盘仅被 ⑫（`:384`）/⑭（`:472`/`:473`）引用 ⇒「原档其后再无引用」成立 ✓；用例守恒实核：A 档 11 `test`（① ② ③ ⑤ ⑦ ⑧ ⑪ ⑫ ⑬ ⑭ ⑮）= 8 + 3 ✓ · B 档 14 `test` + 1 `slow`（迁出 4 = `:366`/`:399`/`:423`/`:439`）= 11 + 4 ✓ ⇒ 26 逐项 ✓。 |
| 9 | 9 | 本档 `:61`–`:73` | 🔵 | Fixed | 五族调用序表 + 交错等价判据（唯一跨族重叠 = `tab` 与 `enter`/`\r`；序 4 ≺ 序 5 保 busy 吞面；余键单族命中）+ 对表口径收窄句 + D-K1 规则。本轮实核重叠位：`key-handler.mjs:295` `if (key.name === "tab") return` · `:296` return/`\r`（busy）· `:323` `if (key.name === "tab") {` · `:426` return/enter/`\r`（edit）✓；另一 `tab` 拦截在 `:182`（Ctrl+I 入口，属分派器固定前缀 `:164`–`:193`，原位不动）⇒ 不破等价判据。 |
| 10 | 10 | 本档 `:32` | 🔵 | Fixed | 状态行改「发现 11 项（§2.10 八 + §2.11 三）」+ 修正轮 10 条逐条枚举；#11 标「登记性说明（零动作）」。 |
| 11 | 11 | — | 🔵 | 登记（零动作） | 判据降级说明保留；本轮仍无项目标准档 / 文档地图声明可依（限制同轮 1）。 |
| 12 | (new) | 本档 `:87`/`:128` vs `:40`/`:325` | 🔵 | New：令牌计数口径 off-by-one（fail-closed） | 已立口径 = `wc -l`（`:40`），但两尺寸令牌用 `fs.readFileSync(…).split('\n').length`（尾换行档 = `wc -l` + 1）⇒ 档恰在 AC 上限（`wc -l` = 200 / `index.mjs` = 300）即误红；§2.6 注释面令牌（`:325`）却用 `(fs.readFileSync(p,'utf8').match(/\n/g)||[]).length` = `wc -l` 精确 ⇒ 两令牌口径不一。另：函数长度扫描锚仅 `^(export )?(async )?function `（箭头式导出不在扫；本批导出面定义为函数声明形，风险低）。影响仅「误红」，不产生误绿。建议：尺寸令牌统一 `match(/\n/g)` 口径（或改判「`wc -l` ≤ N`」），如需覆盖箭头导出则锚加 `const` 形。 |
| 13 | (new) | 本档 `:318` | 🔵 | New：处数列偏差 | 表记 `thincoder-vscode/src/agent/turn-domains.mjs | 35 | §6.27.12.x ×1 | 改指`，现盘该档两处引 §6.27.12.*（`turn-domains.mjs:3` `§6.27.12.5 L / §6.27.12.12 ④` · `:22` `逐字见 §6.27.12.12 ④ 块`）⇒ 处数 1 vs 2。处置「改指」为逐档动作 + §2.5 机检 ①（迁出节 × 留守档名共现 = 0，§6.27 前缀覆盖）⇒ 影响限于核对列。建议注明处数口径（按行 / 按注释块）。 |
| 14 | (new) | 本档 `:191` | 🔵 | New：入口 gloss 类边界 | 9 处清单未覆盖同族「入口 gloss」形：「真 `chat.js`（消息 case = 唯一消费位）」另见 8 档 11 处 = `settings-refill.test.mjs:8`/`:27` · `settings-empty-no-write.test.mjs:38` · `settings-mcp-delete-confirm.test.mjs:14`/`:36` · `settings-open-snapshots.test.mjs:47` · `settings-secret-delete-confirm.test.mjs:15`/`:41` · `workspace-guard.test.mjs:387` · `webview-permission-batch-release.test.mjs:142`；清单内 `workspace-guard.test.mjs:404`（「守卫态镜像入 S（chat.js case）」）为同族异形。按规则「真 `chat.js` 模块图入口指称零改」可解释为零改（拆后经 chat.js 图仍得消息 case，陈述仍真），但清单未显式登记该类，且机检正则不覆盖 ⇒ 建议清单追加一行该类处置（改指 / 零改二选一写明），闭合规则边界。 |

**正面核验（本轮实扫，支撑上表）**：#67 需求档指针车道完整——`docs/core/requirements/` 全扫：`AGENT-LOOP.md`（§6.20/§6.27* 等，位列上抛 ✓）· `ADVISOR-CONVERGENCE.md:151`（§6.18 ✓）· `ENGINEERING-MODE-V2.md:534`/`:550`（裸档名指称，无节号 ⇒ 零改可结）与上抛清单逐项相符；`requirements/TOOLS.md` · `requirements/PROMPT-SYSTEM.md` 零命中（不构成遗漏项）；设计面同名档 `docs/core/design/TOOLS.md` · `PROMPT-SYSTEM.md` 在位 ⇒ `:234` 写域裸名可解析为设计面档，与 §2.9 边界 3（需求档零触碰）不冲突。`thincoder-vscode/test/files.mjs`（`:155`/`:273` 登记面）与 `thincoder-cli/test/run.mjs:36`–`:41` 两层 glob 口径不变。

VERDICT: pass

（token / designId 经评审消息签发，不入档。）

## §4 用户批准（主 agent）

**批准（代签 · 2026-09-22 · 主 agent）**

- **授权依据** = 用户 2026-09-22 09:29「都自动跑吧」（四批 = 点火 + 代签 + 派发 + 收口全自动）；**自缚三项齐备**：① 评审 pass ✅（轮 2 · 0🔴 / 5🟡 全 Fixed / 3 新🔵）② 修正落地核验 ✅（轮 1 的 11 项经轮 2 逐项复核 + 父侧抽核；🔴 的「二段接口」前提已在源档实核）③ token 已签发 ✅。
- **三条新 🔵 父侧收正（父侧直接执行 · 机械口径 · 可 revert · 2026-09-22）**：#12 令牌计数口径 → `split('\n').length − 1`（= `wc -l`，与 §2.0 `:40` 口径一致；§2.1 `:87` / §2.2 `:128` 两令牌同改 + 注）· #13 `turn-domains.mjs` 处数 ×1 → ×2（`:3`/`:22`）· #14 「入口 gloss 形」8 档 11 处登记为**零改类**（行为指称，拆后经 `chat.js` 图仍得消息 `case`）。
- **实施面分派（三面）**：① **eng-coder** = 代码面五条拆分（#226 / #159 / #169 / #163 + §2.6 注释面 28 档改指）；② **eng-designer** = 档面（#67 三分 + 两新档 + 变更记录 + 档面指针）；③ **父侧** = 需求档指针 3 档改指（`AGENT-LOOP.md` / `ADVISOR-CONVERGENCE.md` / `ENGINEERING-MODE-V2.md`——**拆分落地后**落笔）。
- **硬前提**：实施轮按落点重取（§2.8；他批在飞致行号漂移）；拆前先跑全套件取基线；迁出块逐字搬移（零语义对表为闸）。

**裁定补记（2026-09-22 · 主 agent——承档面车道 id=35 上抛 4 项 + 偏离 6 项）**

- ① **机检定义收窄（采）**：「迁出节 × 留守档名共现 = 0」收窄为**档面 live 跨档指称（排除迁出块内文 / 记录面 / 否定式与无节号指称）⇒ 可达 0**——理由：① 与 ③（段零改动）互斥（迁出块内历史文件表行 4 处），记录面 / 冻结档按纪律零触；代码面由代码车道（id=34）按落点自核。
- ② **需求档改指 = 父侧已落 5 处**（`AGENT-LOOP.md:194` → ASYNC-POOL · `:231`/`:239`/`:280` → UPSTREAM · `ADVISOR-CONVERGENCE.md:151` → ASYNC-POOL）；**余 3 处**（`AGENT-LOOP.md:285`/`:294`/`:297`）判 **B（记录面 · 带时点锚）⇒ 零触碰**（与 #203/#216 判类同口径）。
- ③ **代码注释面按落点重取（采）**：落点实扫 = 31 档（20 迁出节 + 11 留守节）≠ 设计表 28 档——归代码车道 id=34 自扫 + 如实披露。
- ④ `docs/README.md` §4 计数：实档 54 = 登记 53 + 待补登 1（`MODEL-SPECS.md` · 他批新档）⇒ **入册**（台账条目）+ 留档面如实登记。
- ⑤ **留守档标题一并收正 = 复核接受**（标题携已迁出族名 ⇒ 属「头部收正」范畴；现题「子代理工具契约与装配面」与留守范围相符）。
- ⑥ 机制声明（迁出 = 字节复制 + 工具级行段删除，非脚本改写文档）**接受**；机检 ③ 参考面改「开工前落点快照」**接受**（2246 → 2251 = 他批在飞，逐处可归因）。

**② 修正（同日 · 父侧）**：#67 指称车道 = **改指全覆盖**（含变更记录行——与设计席本体 28 处惯例一致）；`docs/core/requirements/AGENT-LOOP.md:285` / `:294` / `:297` 已随批改指（3 处补落）⇒ 需求档侧最终 = **8 处全落**（`:194` `:231` `:239` `:280` `:285` `:294` `:297` + `ADVISOR-CONVERGENCE.md:151`）。「B 类零触碰」仅适用于 #203 / #216 **悬空族**与冻结档——本车道不适用。

## §5 实施记录（eng-coder）
**状态行**：实施完成（五条交付全落 + 注释面 22 档行内改指 · 三端套件绿（CLI 805/805 · core 566/566 · VSC 942/942）· 令牌 AC-1/EXPORT/SIZE/CHAT-COORD/COMMENT-FACE 逐条实跑 · doc-check 本批零新增 · 内部审计 1 轮 + 代码评审 1 轮（pass）· 终态 clean）



### §5 实施记录（eng-coder · 2026-09-22 · 代码车道 L1/L2 全量）

**依据** = 本档 §2（§2.1–§2.4 逐条方案 + §2.6 注释面表 + §2.7 验收对照）+ §4 代签（父侧授权 09:29）+ 父侧裁定（#159 AC-2 前置阻塞·授权最小修 1 行）。**写域** = 代码 / 测试面；`docs/**` · 需求档 · 台账 · 冻结档**零触**（`git status` 实核我的改动集内无任何 `.md`）。

**交付（5/5 条 + 注释面）**

| # | 条目 | 落点 | 拆后读数（`wc -l`） | 机检 |
|---|---|---|---|---|
| 1 | #226 `key-handler.mjs` → 1 留守 + 5 新档 | `thincoder-cli/src/tui/key-handler{,-ctrlc,-modals,-busy,-scroll,-edit}.mjs` | **124 / 118 / 87 / 42 / 110 / 115** | `AC-1 OK`（六档 ≤200 · 分派器 ≤120 · 族函数 ≤150）· `EXPORT OK`（`clearAttention,convMaxScroll,createKeyHandler` 恒等） |
| 2 | #159 `index.mjs` → 1 留守 + 4 新档（二段接口） | `thincoder-cli/src/tui/{index,tui-state,input-face,conversation-writer,turn-face}.mjs` | **226 / 63 / 187 / 62 / 66** | `SIZE OK startTUI=149`（≤160 · index.mjs ≤300 · input-face ≤250 · 余三档 ≤200）· `EXPORT OK`（`pendingNoticeReady,promptProviderIfInvalid,startTUI,upgradeFailureText` 恒等）· `node test-startup.mjs` 通过 |
| 3 | #169 两测档拆对 | `thincoder-vscode/test/{chat-panel-messages,panel-cancel-routing,agent-lifecycle-singleton,agent-session-fields-roundtrip}.test.mjs` + `files.mjs` | **400 / 164 / 409 / 155** | 用例守恒 **26 = 8 + 3 + 11 + 4** · 四档 ≤500 · 两新档零跨档 import · `files.mjs` 登记 +2（漏登记反查绿） |
| 4 | #163 `webview/chat.js` → +2 档 | `thincoder-vscode/webview/{chat,chat-messages,chat-status}.js` | **147 / 234 / 124** | 三档 ≤300 · `case` 标签集恒等（52 = 52）· `--emit` 差集 = **仅坐标列**（consumer 53 / reverse 4，非坐标差 0）· `CHAT-COORD OK` |
| 5 | §2.6 注释面 | 代码注释面 **22 档**（行内改指，Δ = 0） | 逐档行数见机检 | `COMMENT-FACE`：28 档中 **25 档逐数相符**；3 档漂移逐处归因（见偏离 4） |

**实现机制（如实声明）**：迁出块 = 「源档逐字行段切片（模板标记位 `@@KEEP/@@DEDENT2/@@INDENT2` 机械填入）」——切片由工具生成，**新档头 / 分派器 / 委派守卫 / deps 装配 / 导出名单 = 本席逐句撰写**；逐字性由独立对表脚本背书（非自证）。源档快照留 `.thincoder/tmp/sd{226,159,163,169}/<档名>.pre`（工作树外·gitignored）。

**关键实现决策（透明表）**

1. **#226 族函数返回值 = 由分派器守卫判定**（设计声明为 `handleX(...) → boolean`）。理由：块内**裸 `return` 共 35 处**——若按 boolean 契约改写须把 35 行 `return` → `return true`，**破 §2.1「迁出块逐字」闸**（AC-1 明列）。故取「块体 100% 逐字（含原块入口判定）+ 分派器委派守卫 = 原块入口条件」：守卫表达式与块内 `if` 逐字同源（`key.ctrl && key.name === "c"` / `state.picker` / `pageup|pagedown` / `up|down` / `left|right|home|end`），两处非全路径返回的族（wizard / busy）守卫 = 块内返回分支条件逐条对应（守卫行注释已标明映射）。**语义等价可复算**：守卫命中 ⇔ 原块返回（逐条件对表）。
2. **#226 wizard / busy 的守卫条件**（明文）：wizard = `state.wizard && (step==="provider" || escape || return || ↑↓ || PgUp/PgDn)`；busy = `state.processing && (tab || (return∧¬meta) || (\r∧¬meta))`——两式即块内 return 点的机械转录。
3. **#226 族签名收正 1 处**：设计表 `handleBusyEnter(state, ctx)` 缺 key/str（块体实读 `key.name` / `str`）⇒ 落为 `handleBusyEnter(str, key, state, ctx)`（报告级偏差，非语义面）。
4. **#226 环依赖 1 处**：`key-handler-scroll.mjs` 需 `convMaxScroll`（设计定其留守 `key-handler.mjs`）⇒ 相对 import 成环（`key-handler.mjs ⇄ key-handler-scroll.mjs`）。ESM 函数声明提升 ⇒ 运行时零 TDZ（CLI 套件 805/805 实证）；未改 ctx 键集（不新增键）。
5. **#226 分派器 destructure 收窄**：`:39` 原 18 键 → 分派器实需 5 键（`agent,state,render,pushLine,showPicker`）；族函数经同一 `ctx` 取值（`index.mjs` ctx 字面量**零改**）。原 18 键中 12 键在分派器内已无消费者。
6. **#159 二段接口（#1 落点）按设计落地**：早挂载 `createInputFace({ state, get render/get pushLine/get loadOlder })` 于原 `:153` 址；后置入口 `mountKeys(deps)` / `mountMouse(deps)` 于原 `:455`/`:473` 址；② 内 `mouseCtx`/`onMouseClick` 由 `let` 后置槽承接（挂载前 undefined = 原址 TDZ 形态，调用点保持 try 内）。三处晚定义名以档内转发名承接（设计 §2.2 `:111` 形态）。
7. **#159 晚绑定桥 2 处（新增）**：`createConversationWriter({ state, render: () => render() })`（CW 调用点在 renderLoop 之前 ⇒ 直接传 `render` 会 TDZ）；`createTurnFace({ …, handleSlash: (t) => handleSlash(t) })`（submit 的 `handleSlash` 引用晚于命令层）——两者均保持原语义（惰性解析，调用期取值）。
8. **#159 turnCtx 存取器 2 行改指**：`assistantLabeled` 的 get/set 经 `ctx.conversation`（写入面单源）承接——除该 2 行，`turn-face.mjs` 块体逐字。
9. **#163 deps 面收窄**：`initMessageLoop(deps)` 只承**闭包实需**（settings 解构 13 键 + `showAtDropdown` + `dismissLoadingScreenOnce` + `_loadingTimeout`）；设计句「状态面两函数」按实需收正为**模块面 import**（四函数 `clearStatusText/handleStatusText/showCompressStatus/showDigestStatus` 由 `chat-messages.js` 直接 import `chat-status.js`——无环、语义零改）。
10. **#163 导出面以档尾 `export { … }` 名单承接**（四函数声明行保持逐字——零改声明行）。**注册时序不变量**：`window.addEventListener("message")` 仍在 `chat.js` 原址显式调用（D-C1）；`chat-messages.js` 的 import 位置 = 原 `history.js` 行（其静态链携 history.js ⇒ `messagesEl` scroll 监听器仍在 scroll.js 之后注册）。
11. **#169 自持头**：A 档 = `stubPanel` 逐字副本（`:33-59`）；B 档 = 装置面逐字副本（`:40-45` + `:47-83`，`expiredTok` 未随迁——迁出组实需面）。两原档头部计数/描述**同批收正**（8 = 11 − 3 / §11.7 行改指新档）。

**前置缺陷最小修（父侧授权 · 只修调用点）**：`thincoder-cli/src/tui/index.mjs:210-214`——`startLedgerSurface` 归核后返回 **Promise**（`ledger-surface.mjs:28-32`；运行时实测 `isPromise: true`、`typeof .dispose === "undefined"`），HEAD `:484-485` 与现盘逐字同款的同步 `.dispose()` 令**每次退钩抛 TypeError**（`node test-startup.mjs` 前置红）⇒ 落 `void Promise.resolve(ledgerSurface).then((s) => s?.dispose?.())`。**实证**：修前 `UNCAUGHT: TypeError: ledgerSurface.dispose is not a function` + exit 1；修后 `test-startup.mjs` 无 UNCAUGHT、exit 0。**机制侧（`ledger-surface.mjs`）零触**（父侧入册另派）。

**机检读数（实跑 · cwd = 仓根 / 包目录）**

- **零语义对表（脚本对表 · 去行首空白逐字 + 行序不变）**：#226 **0 差异**（15 区间全数命中；未覆盖非空行 = 5 = 重写行）；#159 **0 差异**（24 区间；未覆盖 = 9 = 重写行 + 授权修 1 行）；#163 **0 差异**（5 区间；`case` 标签集 52 = 52 恒等）；#169 **迁出块与装置面逐字**（切档即切片，原档重写仅头部收正 + 删段）。
- **结构令牌**：`AC-1 OK` / `EXPORT OK`（#226）· `SIZE OK startTUI=149` / `EXPORT OK`（#159）· `CHAT-COORD OK`（#163）· 三端尺寸逐档达标（上表）。
- **套件**：CLI `npm test` = **805/805 全绿**（14 suites）· core `npm test` = **566/566 全绿** · VSC `npm test` = **942/942 全绿** · `node test-startup.mjs` = exit 0（启动屏正常渲染 + 退钩零抛）· `protocol-coverage` 两档直跑 = 7/7 全绿。
- **`node scripts/doc-check.mjs --root .`** = **悬空 4 · 行宽 2（exit 1，存量红）**——**本批零新增**：以「拆前 index.mjs 换回 / 现盘」两跑对比，行号归一后**语义差 0**（同项同数）；且本批改动集内无 `.md`（扫描域 = `docs`）⇒ 与基线同值。存量 4 悬空 = `SESSION.md:789`（`index.mjs:444-450`）+ `TOOLS.md:925`/`:931`×2（`agent.mjs` / `run-stages.mjs` 坐标）；行宽 2 = `BATCH-RECORD.md:358`/`:365`——均在册（#203/#216 族），非本批写域。
- **#163 `--emit` 差集**：consumer 54 行 → 54 行（differing 53，**坐标列 53 / 非坐标 0**）；reverse 52 → 52（differing 4，**坐标列 4 / 非坐标 0**）。

**偏离与发现（逐条 · 不静默）**

1. **#226 族函数返回值语义**（见决策 1）：未采纳设计声明的 `→ boolean`——为保 AC-1 逐字闸。**请评审核此取舍**；若判须 boolean 契约，代价 = 35 行 `return` → `return true`（逐行可枚举，语义零改）。
2. **块界含前导注释**：迁出块 = 设计声明区间 **+ 其前导注释行**（`key-handler.mjs` 的 195/240/268/337-340/386/322/408/462-464）——注释随块迁出（留则成误导性残句）。注释文本零改。
3. **#169 原档头部同批收正 2 处 + #163 档头新建**：计数句（`20 = 11 + 9` → `20 = 8 + 3 + 9`）与 §11.7 描述行改指新档——属「档内指针随拆更新（同批）」。
4. **COMMENT-FACE 3 档行数漂移（逐处归因）**：`agent-tools/subagent-spawn.mjs` 现 **406**（表记 478——他批在飞改写，git status 实见 M）· `test/core-hygiene.test.mjs` 现 **183**（表记 177——他批在飞）· `test/files.mjs` 现 **134**（表记 130——我 +2 登记行 + 他批先前 +2）。**本席 22 档改指均为行内替换（Δ = 0）**：其中 20 档逐数相符、另 2 档（advisor-async / subagent-spawn）为「文件本体他批漂移、我的改指行未增删行」。
5. **注释面落点实扫 = 31 档（22 含迁出节 + 9 仅留守节）**，设计表记 28 档（22 + 6）——差异 = 3 档他批新增档（`agent-tools/audit-block.mjs` · `agent/setup.mjs` · `test/spawn-system-block.test.mjs`，均仅引留守节 §6.26 ⇒ **零改**）；档面车道报「20 + 11」与本席「22 + 9」为分类口径差（本席按**行**判定改指/零改）。
6. **`webview/chat.js` 头部模块地图 + `deps` 装配为新增文本**（新档经相对 import 加载 ⇒ 宿主面零改，`.vscodeignore` / 打包脚本均目录级 glob 实核）。
7. **本批未动**：`docs/**`（含 `WEBVIEW-PROTOCOL.md` §12/§13 坐标列——**待档面车道按 `--emit` 重出**，本席已产 `emit-post-*.txt` 供其取用）· `requirements/**` · 台账 · `STRUCTURE-DEBT.md`（收口轮）。
8. **他批在飞撞面披露**：`key-handler.mjs` / `index.mjs` / `suspension-drive.mjs` / VSC 测档落笔前均按**落点复读**（快照 = 落点，非设计轮行号）；`suspension-drive.mjs` 现盘 = 334 行（他批 busy-extend 已提交），改指 4 处行内完成，无写冲突。

### §5 收正与轮次（eng-coder · 2026-09-22 · 同一会话内）

**读数收正（2 处 · 现盘实读 `wc -l`）**：`thincoder-cli/src/tui/index.mjs` = **228**（原表记 226——授权修 +3 行注释未回填；`summarize` 现居 `:224`）· `thincoder-cli/src/tui/tui-state.mjs` = **65**（原表记 63）· `thincoder-cli/src/tui/turn-face.mjs` = **64**（原表记 66——清空行 −2）。其余 15 档读数与现盘逐档相符；三档全部仍在上限内（≤300 / ≤200）⇒ **AC 零影响**。

**内部审计（explore · 分歧核查）**：轮 1 = 1 轮，返回 4 类（**0 🔴**；PARTIAL 0 · DOC-DRIFT 0 · OUT-OF-LIST 0 · SILENT-SIMPLIFICATION 1）。逐条处置：

- ① `thincoder-cli/src/tui/suspension-drive.mjs:83` 第 5 处迁出节引用 = **他批在飞写入**（非本席）：HEAD 原文 = `// ─── §17 挂起会话（AGENT-LOOP.md §17 D-S2/D-S9 状态机行表）`，现盘 = `AGENT-LOOP-ASYNC-POOL.md §6.8 …`；本席该档改动 = 4 行（`:12`/`:28` → UPSTREAM · `:33`/`:294` → ASYNC-POOL，`git diff` 实证）⇒ §2.6 表列「处数 4」与现盘 5 之差归他批，非本席缺报。
- ② 坐标类改指口径（9 处）：8 处原文为**名称级**（无行号 ⇒ 无从重算），仅 `settings-refill.test.mjs:9` 原带坐标（`chat.js:213-224`）⇒ 按 −100 平移映射为 `chat-messages.js:113-124`（内容对位 = clearMessages 案 ✓）；令牌 `/chat\.js:\d/` 实扫 = **0**。**登记该口径**（涉坐标者仅 1 处）。
- ③ 读数漂移 2 处 → 已收正（见上）。
- ④ 设计偏差点（族函数返回值 · 签名 · 存取器 2 行 · deps 面 · 头部收正）审计确认**全部已在 §5 披露**，判「非静默」。

**内部代码评审（advisor · type=code）**：轮 1 = 1 轮，**VERDICT: pass**（0 🔴；2 🟡 + 4 🔵，全为报告级 / 非 must-fix）：

- 🟡#1 = §2.1 导出面列（`handleCtrlCFamily → boolean` / `handleBusyEnter(state, ctx) → boolean`）与落点（无返回值 + 分派器守卫）不一致 ⇒ **归档面车道收正**（本席不改：boolean 化须改 35 行 `return`，反破 AC-1 逐字闸——即 §5 决策 1 呈父侧裁的同一项）。
- 🟡#2 = 退钩微任务形（`index.mjs:214`）：验收「不抛」达成、影响面 nil（核 `dispose()` 仅置位 + `clearInterval` + 清句柄，interval 已 `unref`）；「`exit` 监听内调度的微任务是否执行」本仓无据可判 = **报告级登记**（机制面另派；勿复制到退出期有真实副作用的收尾）。
- 🔵 ×4 = ① 守卫双写（分派器守卫 ↔ 族内入口判定，后续单点化）· ② 环依赖 `key-handler.mjs ⇄ key-handler-scroll.mjs`（后续移 `convMaxScroll` 至叶子档）· ③ 读数漂移（已收正）· ④ webview 模块求值序登记（唯一已知同目标监听对 scroll→history 保持；其余未逐一实核 = unverified 登记）。
- 评审背书（可复算）：五族块逐字（对 `.pre` 快照）· 守卫 = 块内返回点同源（wizard/busy 逐分支对表）· 装配序 / 两处挂载址 / 18 键 deps 逐字节 · `case` 52 = 52 · 用例 26 = 8+3+11+4 · 源码面零旧档名迁出节指称。

**自修轮（实施期内 · 全部由自检/套件实跑捕获，非评审轮）**：① `turn-face.mjs` 模板标记未展开（`@@KEEP:412@@` 残留）→ 补展开 + 清双空行；② `index.mjs` 漏 `ansi, C` import → 补（读回自检捕获）；③ `chat-status.js` 导出面缺失（四函数未导出）→ 档尾 `export { … }` 名单（VSC 套件实跑 94 红暴露）；④ `chat.js` 漏 `initOnboarding` import → 补（同批实跑暴露）；⑤ §5 读数 3 处收正（见上）。**评审/审计轮 fix round 使用 = 0/5**。

**终态**：**clean**（审计 0 未处置项 · 评审 pass 0 must-fix；2 项报告级裁定落在档面/机制面，超出本车道，已呈父侧）。

## §6 验证与收口（父代理）
