# 2026-09-28 · 桌面输入面板·VSC对齐（承 §3.6）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-28 · 来源 = 用户 2026-09-28 18:39 直斥（输入面板未对齐 VSC）+ 需求档 §3.5b ∕ §3.6（2026-09-26/27 走查在册未开工）。
> 台账 = #526（桌面输入面板·VSC对齐 · 归批）。前情 = docs/batches/2026-09-28-desktop-midturn-input.md §6（已收口 2026-09-28）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-29
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 主题与范围（2026-09-28 18:39 · 用户直斥——P0）
- 用户原话（2026-09-28 18:39）：「我说过无数次让你输入面板跟vsc对齐，到现在你也不对齐！」= **本批最高优先（P0）**；其他批让路。
- **在册依据**：需求档 §3.5b（2026-09-26 22:19 走查「功能至少应该跟 cli/vsc 对齐」）+ **§3.6（2026-09-27 20:45 三点走查——登记后未开工；本批认领该缺失）**。
- **范围**：① **输入面板（composer）⇒ 按 VSC 输入区对齐**（结构 ∕ 交互 ∕ 视觉逐元素；端差异须逐条实证给由）——**R1（本批第一件）**；② §3.6 另两点（状态行 ⇒ CLI 对齐 ∕ 右列 ⇒ 子 agent 面板 ∕ 会话流 ⇒ VSC 对齐）同族——先勘察、随轮（轮序父侧裁）。
- **并入**：桌面输入失效缺陷——父侧真机复现（假 provider 真回合）已抓两实证：末态忙位卡死 `running` 不落 ∥ `msgs` 计数滞后一轮；原始症状（输入彻底失效）未复现 ⇒ 对齐时以 VSC 同面行为为基准逐项对标收正。
- **判据副题**：本批 = 「机制单源」裁（2026-09-28 用户裁）第一块试金石——输入区两端对齐**以 VSC 为基准**，不再本端自造。

### 1.2 前情
- 本会话诸批（align-2 ∕ align-3 ∕ idle-wake ∕ timer-wake p2 ∕ midturn）已收口；「对齐」诸批做的是**行为同义**，输入面板的**面板级对齐**（用户原意）到此仍未开工——本批补账。

### 1.3 台账
- **#526**（需求池 · P0）→ 本批——在途（随实施核销）。

### 1.4 标准收紧（2026-09-28 18:4x · 用户再斥）
- 用户原话：「输入面板都是个生造出来的样子……VSC 那边为了调整面板的功能和结构费了多少时间精力……想让我做 desktop 的时候再重新来一次吗？！」
- **交付标准收正**：不是「按 VSC 的样子重画」，是**直接复用 VSC 输入面板的实现**——默认 = 移植 ∕ 直接消费（**上提共享包优先**，沿 `@thincoder/render-core` 先例）；端适配须逐条实证；桌面侧只留宿主胶水。逐元素表增列「实现来源」列；设计舱已收纠正令（在跑）。

### 1.5 范围扩展令（2026-09-28 18:41 · 用户总纲）
- 用户原话：「整个desktop的处理流，你都跟vsc端好好对一下……已经做过的事情不要让老子再重新来一遍了！」
- **范围**：§1.1 的输入面板 = **第一件**；**整个 desktop 处理流 ⇒ VSC 对位**为总纲（输入 ∕ 回合执行 ∕ 队列 ∕ 悬挂 ∕ 定时 ∕ 会话 ∕ 装配 ∕ 桥 ∕ 通知 ∕ 附件 ∕ 设置……全族）。
- **判据**（沿用 §1.4）：VSC 已有的一律**复用 ∕ 上提共享**（默认）；真端差须「结构性不对称 + 证据 + 裁定」三件齐。
- **推进**：全流对位清单在产（探索舱 #53——机制 × 三端映射 × 三态建议）；出表后**父侧直接按判据排批实施**（不再逐条上桌；仅真端差留项上报）。

### 1.6 父侧裁（设计轮三待裁 + 表外一则 · 2026-09-28 18:5x）
- **U-R1-1（会话头重复面）**：采设计倾——**R1 零触碰会话头面**；与面板控件行的重复面消解归 §3.6 族后续轮（在册）。
- **U-R1-2（D24 机检锁 vs VSC 原样 1px 描边）**：**锁随动**——面板族视觉按 VSC 原样（用户口径「做得一样」）；冲突断言（`views-locks.test.mjs` ∕ `chat-render.test.mjs` 面板相关处）随实施轮逐处改，改动逐行记录。
- **U-R1-3（两缺陷复现差异）**：接受如实差异记录；两缺陷按「落定态断言 + 负控」列为 R1 验收对象（不另立条目）；父侧复现脚本在册（`thincoder-desktop/.thincoder/tmp/repro-input-dead.mjs`）。
- **表外「`turn` 段恒 turn 1/200」**：不并 R1；登记为 **§3.6-①（状态行对齐）轮**的证据项。

### 1.7 父侧裁（设计修正轮附裁 · 2026-09-28 19:0x）
- **KD-23 面板面收正 = 准**（面板面按 VSC 本地先行出泡；交付仍宿主驱动）——U-R1-2 拆 a ∕ b 落 §2。
- **`events.mjs` ∕ `i18n.mjs` 拆分 = 本批承接**（两档已 498 ∕ 490，本批必触 ⇒ 拆档计划入 §2；驻拆档批 `docs/batches/2026-09-28-split-batch.md` R1 相应两行复起时核减——父侧记）。
- **修正轮「就地修正」口径 = 认**（本作者段内 + 打标 §2.14 + 原行可由 git 历史逐字复核；`batch` 工具 append-only 无就地能力——本仓在册先例）。派单误写「§1.7」之悬空以此条闭合。

### 1.8 跨批知会（承对位批设计 §2.9 上抛 9 · 2026-09-28 20:1x）
- `#436`（队列 Enter 行为）= **归先落者**（对位批设计判定 · KD-T6 在册）——本批 R1 实施面（composer ∕ queue 族）**请覆盖 ∕ 落定后由父侧核**；核销锚 = 本批 §6 或对位批 R10。
- 关联：对位批 R10 复核清单含「C7/C8 多实例端侧附加面」；本批不涉。

### 1.9 R1-6 文档回填清单（滚动 · 承各舱上报 · 主 agent 记 · 2026-09-28 20:2x）
- 核件面（#86）：核件组 **6 ⇒ 7 档**（新 `composer/model-menu-css.mjs`）· `model-menu.mjs` **496 ⇒ 449**（§2.7 原估 ≈430，同族偏差第 2 次）· 接线锁跨树只读耦合登记（VSC `controls.css` `@import` 形若变需点名）。
- 渲染面（#73）：B12「快照收敛」实现面补落（镜面去重 + 交付径认领——设计原文未给实现面）。
- 宿主面（#74）：§2.8 R1-3 ② 措辞收正（「零写」⇒「活代理内存零写 + 槽写不回滚」）· §2.5 `ev:flags`「工具驱动翻转」产出点盘面无落点（渲染面已由 `approval:respond` 回执叠加覆盖——定夺后收正）· `IPC.md` §2 两通道行 + `ev:flags` 行 ∕ `PROJECT.md` §10 BE 行（18 ⇒ 19 · 29 ⇒ 31）∕ §4.1 两新档。
- 批级记账：断言改锚实为 **5 处**（U13 ∕ U74 ∕ U76 ∕ U27 ∕ U37——父侧原记 4 处，按断言点收正）+ U95 两臂（审计建议追加）。
- 滚动补充：各舱收口时的新增项继续并入本块。

### 1.10 输入逻辑核查（#92 · 2026-09-28 20:2x）——父侧裁定与收正队列
- **核查结论**：单源已锚实（两端 `node_modules/@thincoder/render-core` 指向同一物理树、逐项同 mtime 同字节）；**12 类机制级一致已抽验**（键位族 ∕ 结构 19 枚 ids ∕ 守卫序 ∕ 忙态派生 ∕ 满队 8 ∕ 附件 ∕ @ 下拉 ∕ 控件行 ∕ 模型菜单 ∕ 视觉变量 ∕ 文案逐字抽 20 键 ∕ 标记原语）。
- **九项不一致 · 裁定**：① B12 出泡时刻 ⇒ **对齐 VSC**（本地先行出泡 + 即时待发送标；承 #73 收敛机制）；② Ctrl+I ⇒ **对齐 VSC**（interrupt 携带 message、同上下文续跑；「msg:interrupt + 另投 msg:send」双投形撤）；③ `susp` 期模型门 ⇒ **收正**（挂起窗遮挡 ∥ 防误写）；④ `mm-*` × 桌面 CSP ⇒ **收正为静态承载**（潜在用户可见缺陷——CSP `style-src 'self'` 下脚本注入 `<style>` 依语义被拒）；⑤ @ 命中面 ⇒ **收窄为名字段前缀**（软链跳过保留 · 安全裁定注记）；⑥ 非视觉降级 = 保持登记（`IPC.md` §2 附件注项 4 在册）；⑦ VSC 死骨架 = 在途（#72 定形）；⑧ 组字门 229 臂 = 小项随收正轮注记；⑨ 端侧残件（`chat.js` Esc ∕ `send.js`）= 清理候选。
- **收正轮 #94 在册**（①②③④⑤ 五点 · 排队在 #73 之后）；**未核清单 7 项**在册（含前提缺口「VSC 原件不可读——仅 git 历史可得」的求证过程）。

### 1.11 R1-6 回填清单（滚动补 · 承舱 2 上报 · 2026-09-28 20:2x）
- VSC 面（#72）：§2.7 VSC 行数表实读收正（`input.js` 126 = OUT 表 + hooks 实量；余 10 档逐值在册）· §2.3「出站」列坐标迁档（14 类统一收进 `input.js` `OUT` 表——理由 = 协议提取器 + fail-loud）· §2.4 P9「骨架保留」句面 ⇒ 实现为「运行时退场」（核件全自建——不得双存）。
- 搬移残渣（`state.js` 的 `_pastedImages` ∕ `_inputHistory` ∕ `_historyIdx` ∕ `_inputDraft` ∕ `selected*` ∕ `isRunning` 初值 = 无读者；同族 `workspace-guard.test.mjs:427` 死写）——随 R1-6 清理。
- VSC webview 真机读数待补（`@import` + `../node_modules` 相对解析实测；资源在盘 ∥ `.vscodeignore:5` 反排除 ∥ CSP ∕ 局部资源根三项已实读）。

### 1.12 R1-6 回填清单（滚动补 · 承舱 3 上报 · 2026-09-28 20:3x）
- 设计缺口登记（承 #73）：① B12 实现面（已由父侧裁定①补齐——回填 = 设计档 Q1 ∕ §2.5）；② `mount-cards.mjs` 回焦耦合（`:54,:57` ⇒ `#input`）+ `store.test.mjs` 改锚 **未列**设计测试表（本舱补登）。
- 行数背离（供 §2.7 收正）：`mount-composer.mjs` **466**（设计估 ≈180——拆分预案 = 写面出档 `renderer/composer-wire.mjs`，`host-floor` 在册例外登记 ∕ 消解窗口 = 越 500 前 ∕ 下次实质触碰）· `chat.css` **488**（估 435）· `i18n-composer.mjs` **93**（估 45——未计逐键 × 两语 ∕ 别名块注释）。
- 评审面：舱 3 内评审（advisor code）因预算耗尽未跑（如实披露）——**父侧已补跑**（parent-side code review 在飞）；结论随到随裁。

### 1.13 #98 代码评审（父侧补跑 · 承舱 3）回执与裁定（2026-09-28 20:4x）
- 结算状态 = **stale**（评审在飞期间被 #94 写动——目标变更 ⇒ 结算不可用；**非缺陷**，属在飞并发）；其发现表仍为有效信号（10 项：🟡5 ∕ 🔵5 ∕ 范围外注 2），**无 🔴、无 must-fix**。
- 裁定：**行 1 ∕ 6 ∕ 8 ∕ 9 → 同笔入 #94**（同档小修——已 send 补件）；**行 2** = #94 原任务已含（Ctrl+I 双投撤）；**行 3 ∕ 4 ∕ 5**（mount-composer **485** ∕ events **491** ∕ store **355** 越 300 债）→ §2.7 收正 + 拆分债在册（events 距硬限余 ≈8——触发 = 越 500 前 ∕ 下次实质触碰）；**行 7**（`isClaimed` 同文重项边界）→ 边界注补第二支（R1-6）；**行 10**（记录 466 ∕ 345 ∕ 482 vs 盘 485 ∕ 355 ∕ 491）→ R1-6 回填。
- 范围外注：① `renderer/views/chrome.mjs:55-56` 注面失效（`isBusy` 已不存在——单源 `busyOf`）→ 批级文案收正；② `test/integration/input-parity-settled.test.mjs` 不在盘（设计 §2.6 机检档）→ **归 #79 承接**（其文件列表已含该档）。
- **计划**：代码评审**重跑 = 冻结点之后**（#94 ∕ #79 落定 ⇒ 静止态复评，免再 stale）；随 §6 收口一并。

### 1.11 待发送件位置裁定（用户 20:5x 直令 + 21:0x 追令 · 2026-09-28 21:0x）
- **用户原话**：「queued输入在消费前应该是停在输入面板上方不进会话流的」＋「按什么暂停键……我说的还不清楚吗？！」——**直令 = 按此执行**（非询问 ∕ 无需再裁）。
- **口径（终态）**：忙态提交 ⇒ 待发送件渲染于**输入面板上方**（composer 面：输入行上方带——`data-composer-notices` 同带 ∕ 或独立带，择最小改动），**会话流内零块 ∕ 零镜面组**；**消费（交付）时刻才进流**（正常 append 恰一枚用户块）。
  - 直发径（非 `queued` 回执）零改；滞后正径（端判闲 ∕ 宿主回执 `queued:true`）⇒ 本地块**须退流**（终态 = 消费前流内零块）；流内镜面组（`chat-pending.mjs` 现行落点「块序列之后」）= **退场**。
- **执行**：#94 ⑤ B12 项**撤回暂停 ⇒ 按本口径实现**（含 T-DSK46 四径随新口径重写——不变式 = 消费前流内零块 ∕ 交付恰一枚块）。
- **设计面收正（R1-6 ∕ 设计面轮在册）**：§2 B12 行 ∕ `docs/desktop/design/UI.md` §1 输入区行 ∕ `PROJECT.md` KD-23 ∕ KD-R1-5 区（「出泡时刻 = VSC 本地先行」句）+ 需求档随动（父侧笔）。
- **VSC 侧**：零改（迁移留后为既有政策）——两端差异 = 登记项（本裁定以用户口径为准；VSC 侧延伸另裁）。

### 1.13 待发送件邻接硬验收（用户 21:05 直斥 · 承 §1.11）
- **用户原话**：「你没看你的queued消息离输入面板有多远吗？！」——现行「块序列之后」流式插入 ⇒ 内容短 ∕ 滚离底部时待发送件离输入框老远。
- **硬验收追加**：待发送件与输入面板**恒定邻接**（贴输入框上沿；任意内容高度 ∕ 滚动位置下视觉距离恒定）——「恒居会话区底」（CLI 语义）按**视觉邻接**落实；机制择最小（候选：内容 flex 推底 ∕ `sticky bottom`）。真机两态各截图：短会话排队 ∕ 长会话滚离底部排队。
- 执行 = #94（第一优先项内追加，已送）。

### 1.14 落位最终口径（用户 21:07 直斥定死 · 承 §1.11 ∕ 更正 §1.13）
- **用户原话**：「它他妈的为什么要挂在流里啊！我没说过没消费之前不挂进流里吗？！你当我说的话都是放屁吗？！」——**§1.13 的「会话区底 ∕ 钉底」读法作废**：不是「钉在流里」，是「**根本不在流里**」。
- **定死口径**：① 待发送件住**输入区上方——紧贴输入框上沿**（composer 面；与流容器分离）；② **流容器内零节点 ∕ 零占位**；③ 消费时刻才进流（恰一枚块）；④ 其余承 §1.11（派生 ∕ ⏳ 形 ∕ 消费即消）。§1.11 原始句「停输入面板上方不进会话流」= 本口径，前两轮父侧转写偏差已更正。
- 执行 = #94（已送「覆盖此前全部落位说法」的最终口径；若已落半步 ⇒ 回退重落）。

### 1.15 回填清单续（承 #79 上报 · 2026-09-28 21:0x）
- §2.7 测试面表实读值收正（R1-6）：`events-reduce` 465 ⇒ ≈471 · `views-chrome` 353 ⇒ ≈222 · 新档（T-DSK47）≈180 ⇒ **257**。
- 批档 §5 章节号重复（两处 `### 5.7`）——归收口维护面点名。
- `input-parity-settled.test.mjs:17` 的「负控读数 = 批档 §5」声明已由 §5.12 兑现（无需动）。
- #79 交付面登记：新档 `test/events-flags.test.mjs`（越 500 修复产物，已注册两向）· `test/views-chrome.test.mjs` ⑦ 行序改判（设计句补齐）· 一次性探针（`turn-face.mjs`）逐字节还原在册。

### 1.16 收正轮（#94）交付登记（2026-09-28 21:2x）
- **第一优先项（待发送件落位）终态**：流里零节点（T-DSK45/46 真机断言恒 0 ∕ 假根同锁）· 落位 = `[data-composer-notices]` 锚内（输入行上方，与流容器分离）· **邻接恒定 8px ∕ 8px**（短 ∕ 长会话两态截图在案）· 消费恰一枚（交付瞬时谓词锁）· 形态逐字对位 CLI（⏳ 标签 + 逐条 + 编号 + clamp + 尾标记）· claim 机制整体退场（U153 零残留锁）。
- **其余项 ①–⑤⑥⑧⑨ 全落**（Ctrl+I 单投 ∕ susp 门 ∕ mm-* CSS 静态承载 ∕ @ 收窄 ∕ 相位 ∕ lastBusy ∕ 测试加固）；**拆档执行**：`composer-wire.mjs` 177 行出档（mount-composer 526 ⇒ 405）。
- 套件：desktop **276 ∕ 276 绿**。
- **披露**：① 内审计 ∕ advisor 评审因预算未跑（终态 = 套件绿 + 自检复跑）——**父侧补跑代码评审在飞**；② 异常留批级复验：交付短窗内块面疑被 `mount-sessions.mjs:56` `applyPage` 整置覆盖（T-DSK46 交付后读数曾见 ∕ T-DSK47 settle 期望 4 ∕ 流内 3 同源疑点）——非本项面，随批级复验在册。

### 1.17 #122 代码评审（父侧补跑 · 承 #94 交付面）回执与裁定（2026-09-28 21:3x）
- 结算状态 = **stale**（评审在飞期间目标变更；**非缺陷**）；发现表为有效信号：**#94 交付面逐项复核 = 全项落正（前表 10 项：6×Fixed ∕ 拆分落形 ∕ 3×在册）+ 五收正可见面全核 + 零新 🔴 · VERDICT pass**。
- 裁定（六项，均非阻断）：① `events.mjs` 483 越 300 → 在册（届盘重锚项，非必修）；② **`store.mjs` ≈345 越 300 且未见于 `host-floor` 全部清单 = 登记缺口** → 批末清单（补 exception 行 ∥ 按候选拆分面「纯动作族出档」登记）；③ 数值漂移（mount-composer 405/409 · composer-wire 177/167 · host-floor ≈408）→ 批末文档同步；④ composer-wire `paintNotices` 区段缩进（纯空白面，结构未断）→ 下次触碰统一；⑤ `views/chrome.mjs:55` 失效注（`isBusy` 已不存在）＋ `pendingOf` 零生产消费（死面）→ 批级文案 ∕ 可选清理；⑥ 页读擦面 anomaly → 批级复验（在册）。
- **冻结点复评仍排定**（全部在飞落地后·静止态执行）——本回执不替代之。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成 · 2026-09-28（评审轮 1 十发现 + 复评轮 2 两发现逐号落修（就地修正 · 打标在册））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目（覆盖）· 依据 · 口径（2026-09-28 · 设计轮）

**口径（最高行 —— 用户 2026-09-28 18:39 直斥 + 父侧两条纠正令 18:4x）：**

- 总标准 = **「把 VSC 已经做过的东西做成一样」——VSC 有什么，桌面原样搬什么**（组件 ∕ 结构 ∕ 交互 ∕ 样式原样）；
- **不再出任何新设计**：凡 VSC 已有形态，照搬即定案（不重设计 ∕ 不优化 ∕ 不现代化）；
- 唯一允许的改动 = **宿主 API 非改不可处**，逐处列出 + 给由；
- 载体（父侧纠正令 1）：VSC 输入区及其依赖**上提共享核** `thincoder-render-core`（沿两端共用宿主无关渲染核在册口径，需求档 §3.6 约束 2026-09-27 20:48）⇒ 桌面**直接消费同一核件**，桌面侧只留宿主胶水；整件复用不可行处 ⇒ 最小适配集逐条实证；
- VSC 不被反向要求（VSC 不改形 ∕ 不改行为；上提改造 = 工厂化 + 注入面，语义零变）。

**本批条目（R1 · 覆盖）：**

| 号 | 条目 | 依据 | 判据（机检 ∕ 走查） |
|---|---|---|---|
| R1-1 | VSC 输入面板全件上提共享核（`composer/` 组：结构 ∕ 交互 ∕ 样式 ∕ 文案单源） | 用户 18:39 ∕ 18:4x；需求档 §3.6 约束句（共用渲染核） | 核件在盘 + VSC 全量测试绿 + 核件新测绿 + 桌面 import 面 = 同一文件（机检） |
| R1-2 | 桌面输入面板换装 —— 对位表逐行「VSC 原样」落位（含控件行七钮） | 同上；需求档 §3.5b ① / §3.6；D3 / D5 / D6 / D13 | E2E 逐元素断言（下表机检列）+ 真机走查对照 |
| R1-3 | 桌面宿主胶水（唯一改点清单落地：新通道 ∕ 新事件 ∕ 映射表） | 同上 | 新通道单测 + E2E 往返 |
| R1-4 | 两缺陷对 VSC 同面收正（① 忙位不落 `running` ∥ ② `msgs` 计数滞后） | 本批 §1.1 并入（父侧实证两件） | E2E 落定态断言（见 2.6） |
| R1-5 | §3.6 ②③ 差异清单（右列 ∕ 会话流 —— 只勘察，轮序父侧裁） | §3.6 走查三点；本批只勘察 | 清单在 2.11 |

**范围边界**：R1 = VSC 工具栏面（`#toolbar` 输入段）——输入行 + 粘贴条 + 控件行 + 两浮层（模型 / 推理）+ @ 下拉 + AUTO 确认；**状态行**（§3.6 ① · 独立轮）、**右列**（§3.6 ②）、**会话流**（§3.6 ③）、**会话头**（U-R1-1 待裁）不在 R1 实施面内。

### 2.2 逐元素对位表（VSC × 桌面 × 处置）

处置两值（父侧纠正令 2）：「**VSC 原样**」= 直接照搬（无差）；「**适配**」= 列明唯一改点。另标「本批外」= 不入 R1 实施面。

处置列口径（原「2.2 补注」并入 —— 评审轮 1 #10 编号唯一化）：「适配」列 = **桌面落位处的唯一改动点**（不改 VSC 形）；凡桌面现形与 VSC 有差、照搬即可的（A5 停止钮可见性口径 ∕ B12 出泡时刻 ∕ B15 占位符 ∕ B19 守卫判据名），操作上 = 「VSC 原样」，其「唯一改点」栏 = 桌面旧形退场 ∕ 收正说明（同表所列）。

**A. 结构面**

| # | 元素 | VSC 源（file:line） | 桌面现状（file:line） | 处置 | 适配唯一改点（若适配） |
|---|---|---|---|---|---|
| A1 | 输入行容器 `#input-row`（胶囊：圆角 20px · `--input-bg` 底 · 1px 边框 · focus-within 转 accent） | `webview/index.html:43` · `controls.css:25-38` | 无（平铺 flex `.composer`）`chat.css:336-343` | VSC 原样 | — |
| A2 | 输入框 `#input`（textarea rows=1 · 透明底无边 · min-height 24 · max-height 120 · 行高 1.45 · placeholder 三态） | `index.html:45` · `controls.css:92-110` | `[data-input="text"]`（有边 · resize:vertical · 无 placeholder）`mount-composer.mjs:120-127` | VSC 原样 | 无（placeholder 三态逻辑随核件） |
| A3 | 附件钮 `#attach-btn`（"Attach" 文本钮 ⇒ 隐藏 `#file-input`） | `index.html:46` · `autocomplete.js:145-146` · `controls.css:166-187` | 无 | VSC 原样 | 宿主：文件选取面 = 桌面既有粘贴采集扩文件径（无新通道） |
| A4 | 发送钮 `#send-btn`（`::after "Send"` · 32px 圆角 16 · running 期隐藏） | `index.html:47` · `controls.css:112-151` · `loading.js:88` | 无 | VSC 原样 | — |
| A5 | 停止钮 `#abort-btn`（"Stop" · running 期显 ∕ 余隐） | `index.html:48` · `controls.css:153-164` · `loading.js:89` | `.composer-interrupt`（锚恒在 · 两态 `disabled`）`mount-composer.mjs:136-143` | 适配 | 可见性口径 = VSC（running 显 ∕ 余隐；「锚恒在」退场） |
| A6 | 粘贴条 `#paste-bar` + 芯片 `.paste-chip`（📎 image N ✕ · 11px 淡字） | `index.html:50-52` · `controls.css:40-90` · `autocomplete.js:164-184` | 附件条（缩略图 + 文件名 + 移除；描述符树）`attach.mjs:124-157` | VSC 原样 | 无（缩略图形态退场——芯片形照 VSC） |
| A7 | 控件行 `#controls-row` + `.ctrl-btn` 七钮（model / reasoning / AUTO / ADVISOR / ENG / PLAN / ⚙） | `index.html:53-63` · `controls.css:189-266` | 无（model ∕ effort 在会话头；模式位只在状态行显示） | VSC 原样 | 写路四键（见 2.5 新通道） |
| A8 | 模型菜单（两级：provider 行 + 悬停 flyout；footer 管理三项） | `model-picker.js:13-32` · `model-menu.js`（全件） | 会话头 `select`（`views/chrome.mjs:112-128`） | VSC 原样 | 写路 = `session:prefs`；footer 三出口 → 设置面（唯一映射点） |
| A9 | 推理下拉（档位列表 + ✓ 选中态） | `model-picker.js:33-69` · `controls.css:268-347` | 会话头 `effort` select | VSC 原样 | 值域 = `model:list` 逐项 `effortEnum` ∕ `thinkOff`（端既有候选面） |
| A10 | AUTO 内联确认（背板 + popover · 焦点默认落取消） | `mode-buttons.js:52-103` · `controls.css:582-658` | 无 | VSC 原样 | — |
| A11 | @ 下拉 `#at-dropdown`（文件建议两列：名 + 路径） | `index.html:42` · `autocomplete.js:19-108` · `controls.css:459-498` | 无 | VSC 原样 | 宿主：新增 `at:complete` 通道（见 2.5） |
| A12 | 状态行 `#status-line`（工具栏内一段） | `index.html:41` · `controls.css:3-15` | 窗口底行状态栏（16 段 · 独立面） | 本批外 | §3.6 ① 邻面（合成形随该轮） |

**B. 交互面**

| # | 元素 | VSC 源（file:line） | 桌面现状（file:line） | 处置 | 适配唯一改点（若适配） |
|---|---|---|---|---|---|
| B1 | Enter 发送 ∕ Shift+Enter 换行 | `input.js:75-85` | 同 `mount-composer.mjs:255-265` | VSC 原样 | — |
| B2 | IME 组字门（`isComposing` ∥ `keyCode 229`） | `input.js:42,77` | 同 `mount-composer.mjs:66-68` | VSC 原样 | — |
| B3 | Ctrl+C（无选区 ∧ running ⇒ 停止；有选区照复制） | `input.js:54-61` | 无 | VSC 原样 | — |
| B4 | Ctrl+I（中断注入模态：Enter 注入 ∕ Esc 取消 ∕ 占位符归模态） | `input.js:19-51` | 无（只有停止钮） | VSC 原样 | 出站 = `msg:interrupt`（见 2.5） |
| B5 | Ctrl+U 清行 | `input.js:68-74` | 无 | VSC 原样 | — |
| B6 | ↑↓ 历史（草稿保护 · 多行边界门 · 单行任意位 · 恒历史态） | `input.js:86-110,140-159` | 无 | VSC 原样 | — |
| B7 | 自增高（rAF 节流 · 组合期跳过 · 高度缓存） | `input.js:112-132` | 无（`resize: vertical`） | VSC 原样 | — |
| B8 | @ 键入激活 ∕ 导航 ∕ Enter·Tab 接受 ∕ Esc 关（+ 请求 seq 防迟） | `autocomplete.js:19-121` | 无 | VSC 原样 | 宿主 `at:complete`（见 A11） |
| B9 | 粘贴图像采集（栅格四型门 · 非栅格拒即提示 · 非图零吞） | `autocomplete.js:122-142` | 同式（`attach.mjs:28,49-72`） | VSC 原样 | 拒提示形 = VSC toast（桌面 `[data-notice]` 行退场；载体 = 核 toast —— 2.4 保留面表） |
| B10 | 文件选取（`accept="image/*" multiple`） | `autocomplete.js:144-153` | 无 | VSC 原样 | — |
| B11 | 芯片删除（✕ · 按 idx splice） | `autocomplete.js:176-183` | 附件条移除钮 | VSC 原样 | — |
| B12 | 忙态提交（本地先行出泡 + 待发送标记 + 快照收敛） | `send.js:32-56` · `queued-mark.js`（全件） | 宿主回执驱动出泡（`composer-send.mjs:56-69` · `ev:queue` 镜面） | 适配 | 出泡时刻 = VSC 本地先行（唯一改点：发起面；**交付仍宿主驱动**；KD-23「零乐观写」面板面收正 = **裁定①已裁（准）** —— 见 U-R1-2b） |
| B13 | 满队（第 9 条）⇒ toast + 文本保留（不出泡 ∕ 不清框） | `send.js:36-39` | `[data-notice="queue-full"]` 行 | VSC 原样 | 无（提示行退场 → toast 形；载体 = 核 toast —— 2.4 保留面表） |
| B14 | 直发清条 ∕ 簿记（历史 dedupe · 清 draft · 清面板 · 标题提示） | `send.js:58-87` | 文本保留判据已有（`mount-composer.mjs:260-264`） | VSC 原样 | 标题提示 = 桌面既有「回合尾刷新」面等价（`events-subscribe.mjs:49-60`） |
| B15 | 忙占位符 ∕ 守卫占位符（优先级：守卫 > busy > 常态） | `loading.js:67-76` | 无占位符 | 适配 | 守卫判据名 = 桌面既有（无活动会话 ⇒ `disabled`）；占位符形照 VSC |
| B16 | 模型 ∕ 推理钮忙态门（`disabled` 不隐藏 + 关浮层） | `loading.js:40-59` | 会话头忙态门（`views/chrome.mjs:112-117`） | VSC 原样 | — |
| B17 | 模式钮两态（active ∕ warning + ENG×PLAN 互斥禁用） | `mode-buttons.js:19-50` | 无 | VSC 原样 | 写路四键（见 2.5） |
| B18 | AUTO 确认两出口（yes 置位 + ⚠ AUTO ∕ no 关闭；Esc 关） | `mode-buttons.js:94-111` · `chat.js:97-110` | 无 | VSC 原样 | — |
| B19 | 无工作区守卫（拒发 + toast + 占位第三态） | `send.js:23-26` | 桌面守卫 = 无活动会话 `disabled`（批 B 追加注项 3） | 适配 | 守卫判据名 = 端既有（桌面无「无工作区」态——项目先于会话）；形照 VSC（出口被触达径 = 核 toast —— 2.4 保留面表） |
| B20 | 会话标题生成提示（`Session N — …`） | `send.js:85-87` | 无 | VSC 原样 | — |
| B21 | 发送失败可见性（P26 提示行 · 桌面在册） | VSC 无同面 | `[data-notice="send-failed"]` `mount-composer.mjs:93-96` | 保留 | VSC 无对照 ⇒ 非本批新增、不构成新设计（列明）；**载体 ∕ 生成者 ∕ 锁改锚 = 2.4 保留面表**（宿主挂件锚） |
| B22 | 附件降级两态提示行（non-vision ∕ partial · 桌面在册 D13） | VSC 无同面（回执经 `degraded` 面另有） | `[data-notice="attach-degraded"]` `attach.mjs:160-168` | 保留 | 同 B21（列明）；载体 ∕ 生成者 ∕ 锁改锚 = 2.4 保留面表 |

**C. 视觉面**

| # | 元素 | VSC 源 | 桌面现状 | 处置 | 适配唯一改点 |
|---|---|---|---|---|---|
| C1 | 输入区样式族（toolbar 内边距 8/14/10 · 胶囊 · 两钮 32px/16 · 控件 chip · 两浮层 · AUTO 确认） | `controls.css:19-266,268-347,582-658` | `.composer` 族 `chat.css:332-374` | VSC 原样 | 桌面 `.composer` 族退场 |
| C2 | 变量族（`--input-bg` ∕ `--btn-bg` ∕ `--border` …） | `base.css:7-66` | `styles.css:7-67`（`--line` 等命名不同） | 适配 | 别名块（`--border → --line` 等；值 = 桌面调色板）——唯一值源改点 |
| C3 | 文案（占位符 ∕ toast ∕ 钮 aria ∕ 模式词） | `locales/*` + `i18n.js` | `renderer/i18n.mjs` 字典 | 适配 | 桌面字典增键（值 = VSC 逐字；核件键随 `setStrings` 机制） |
| C4 | `Send` ∕ `Stop` 静止字面（CSS `content` ∕ HTML 静态串） | `controls.css:133` · `index.html:48` | 桌面惯例 = 全 `t()` | VSC 原样 | 照搬（含 zh 环境英文两钮）——若桌面机检拦，列为实施舱实测点 |

**D. 宿主面（桌面适配 —— 唯一改点清单，明细见 2.5）**

| # | 面 | VSC 形 | 桌面落位 | 适配唯一改点 |
|---|---|---|---|---|
| D1 | 提交出站（`userMessage` ∕ `queuedUserMessage`） | `send.js:55,83` | `msg:send` 单通道（宿主任判忙态） | 映射表（2.5） |
| D2 | 停止 ∕ 中断注入出站（`abort` ∕ `interrupt`） | `input.js:46,58` · `chat.js:48` | `msg:interrupt`（已有） | 通道名映射 |
| D3 | 模型 ∕ 推理选择（`selectModel` ∕ `selectReasoning`） | `model-picker.js:65,81` | `session:prefs`（已有） | 载荷形映射 |
| D4 | 模式位四写（`setAutoApprove` ∕ `setAdvisorGuard` ∕ `setEngineeringEnabled` ∕ `setPlanMode`） | `panel-messages-turn.mjs:174` · `panel-messages-settings.mjs:162-184` | 无 | **新增 `session:flags`**（见 2.5；核 `setSlot*` 写面） |
| D5 | @ 补全请求（`atComplete`） | `panel-messages-turn.mjs:177` | 无 | **新增 `at:complete`**（见 2.5） |
| D6 | 宿主推送八类（`turnState` ∕ `busyQueued` ∕ `models` ∕ `autoApprove` ∕ `planMode` ∕ `agentSettings` ∕ `workspaceGuard` ∕ `atResults`） | `chat-messages.js:51-232` | 桌面事件面（`events.mjs` reduce） | 映射表（2.5）；缺项 = 新事件 `ev:flags` |
| D7 | 图像载荷形（VSC `dataURL` 串列 ∥ 桌面 `{name,mime,dataURL}` 列） | `send.js:55,79` | `composer-send.mjs:63` | 端既有形保留（列明） |

### 2.3 机制设计（上提与落位）

**核件组（新增）**：`thincoder-render-core/composer/` ——

| 核件 | 内容（自 VSC 原件） | 先例 |
|---|---|---|
| `composer/panel.mjs` | 输入行 + 键位（B1–B7）+ 历史 + 自增高 + 忙态派生（占位/两钮显隐/忙态门）+ 出泡时刻（B12） | `toast.mjs` / `cards/question.mjs`（核允许 DOM 直构） |
| `composer/controls.mjs` | 控件行七钮 + 模式钮两态 + AUTO 确认（A7/A10/B17/B18） | 同上 |
| `composer/model-menu.mjs` | 模型两级菜单 + 推理下拉（A8/A9） | 同上 |
| `composer/atmenu.mjs` | @ 下拉（A11/B8） | 同上 |
| `composer/attach.mjs` | 栅格门 + 采集 + 芯片条（A3/A6/B9–B11；判据面与桌面 `attach.mjs` 现物同源合流） | `flow/queued-mark.mjs` |
| `composer/composer.css` | `controls.css` 输入段**原样**（A1–A11 视觉值逐字） | — |

**形态（唯一结构性改造 —— 工厂化 + 注入面）**：VSC 原件的模块级副作用（DOM 查询 ∕ 事件注册 ∕ `vscode.*` 直调）改为工厂式 `createComposerPanel(deps)`（副作用体原样搬进工厂体）。

- **注入面（五项 —— 评审轮 1 #2 补全：原「四项」不全，跨面副作用与本地先行写原无归属）**：① `root`（挂载根 DOM 锚；内部 ids 照 VSC `index.html` 输入段——`#input-row` ∕ `#input` ∕ `#attach-btn` ∕ `#send-btn` ∕ `#abort-btn` ∕ `#file-input` ∕ `#paste-bar` ∕ `#paste-badge` ∕ `#controls-row` ∕ `#model-btn` … ∕ `#at-dropdown`）
  ② `post(type, payload)`（出站归一）③ `state`（读面 + 推送入口：busy ∕ queue ∕ models ∕ 模式位 ∕ 守卫位快照 + `subscribe`）④ **取词供给**（注册面，非 deps 项 —— 核内取词走核模块级 `i18n.t`，端侧 `setStrings` 单点注册；先例 = 核件族 —— `RENDER-CORE.md` §5 桌面消费面段 ∕ §10 H）⑤ `hooks`（跨面副作用 ∕ 跨面状态同步 —— 逐项见下清单）。
- **VSC 侧**：`webview/` 各档缩为「构造 deps + createComposerPanel」接线（逻辑零副本）；行为零变（VSC 测试面 + 真机锁）。
- **桌面侧**：`renderer/` 构造 deps（① `root` = `[data-slot="composer"]` 内以同 id 子树挂入；② `post` → 通道映射表；③ `state` → store 切片；⑤ `hooks` → 桌面跨面绑定（跨面副作用 ∕ 跨面状态同步 —— 逐项见下清单））；④ 取词 = **注册面**（非 deps 项 —— `setStringsSink` 单点注册 = `renderer/app.mjs`；盘面 `renderer/i18n.mjs:34` ∕ `:444`）。
- **结构单源锁**：核件测试断言工厂产物 ids ∕ 类名结构 == VSC `index.html` 输入段骨架（防两端漂移）。

**注入面 · 按档逐处清单（评审轮 1 #2 补全 —— 七源档盘面实读；归属三值 = 核件内生 ∥ 注入 ∥ 出站）**：

| 源档 | 核件内生（随搬） | 注入（读面 ∥ hooks —— 逐处 `file:line`） | 出站（逐处 `file:line`） |
|---|---|---|---|
| `input.js`（160） | 键位 B1–B7 ∕ 历史 ∕ 自增高 ∕ `ctx` 面板态（`_interruptMode` ∕ `isRunning` ∕ `_historyIdx` ∕ `_inputHistory` ∕ `_inputDraft`） ∕ `#at-dropdown` 查询 ∕ 注册序不变量 | 取词（`:24,34,44`） | `abort`（`:58`） ∕ `interrupt`（`:46`） |
| `send.js`（89） | `_pastedImages`（`:50-51,79-80`） ∕ `#paste-bar` ∕ `#paste-badge`（`:52-53,81-82`） ∕ `selectedModel` ∕ `_Reasoning` ∕ `_Provider`（`:55,83`） ∕ `markPending` ∕ `QUEUED_MAX_ITEMS` | 读：`_workspaceRequired`（`:23`） · `_turnState`（`:32`） · `_busyQueuedCount` ∕ `_busyQueuedPending`（`:36,40-41`——共享镜面，`queued-mark.js:22,31` 同面）；hooks：`onTurnStart`（`_turnStart` ∕ `_llmCalls`（`:62-63`）+ `clearPanels`（`:72`））· `onUserEcho`（`addUser`（`:54,73`））· `onWelcomeDismiss`（`:46-47,64-65`） · `onTitleHint`（`:85-86`） | `userMessage` ∕ `queuedUserMessage`（`:55,83`） |
| `loading.js`（96） | 两钮显隐 ∕ 占位符三态 ∕ 忙态门 ∕ `closeModelMenu`（`:56`） | 读：`_turnState`（`:68,88-89`）；hooks：`onStatusRefresh`（`:94`） | — |
| `autocomplete.js`（189） | 栅格门 ∕ 采集 ∕ 芯片条 ∕ `#file-input` ∕ `#attach-btn` ∕ 文档级 paste（`:127`） ∕ `escHtml`（核 `md.mjs` `esc`——先例 `diff.mjs:6`） ∕ 核 toast（`:7,139,150`） | —（推送入口：`atResults` → `showAtDropdown`——`chat-messages.js` 消费面） | `atComplete`（`:33`） |
| `model-picker.js`（152） | 两浮层 ∕ 候选缓存 ∕ `selectedModel` ∕ `_Provider` ∕ `_Reasoning` ∕ `#reasoning-dropdown` | 读：`_models`（`:19,40,116`）；hooks：`confirmRemoveProvider`（`:26`） · `closeSiblingDropdowns`（`:97-98`）；`effortSelection` = 纯归一搬核（VSC `settings-state.js` 改指核件 ∕ 留 re-export） | `addProvider` ∕ `removeProvider` ∕ `setKey`（`:25-28`） ∕ `selectModel`（`:81,131`） ∕ `selectReasoning`（`:65,132`） |
| `model-menu.js`（272） | 全件（overlay ∕ 定位 ∕ flyout ∕ 过滤 ∕ `mm-*` 样式注入） | 取词；**消费面三处**（`model-picker.js:9` · `settings-models.js:6` · `settings-providers.js:9`——落位后同指核件） | —（`onPick` ∕ `footer` 由注入方给） |
| `mode-buttons.js`（131） | 两态 ∕ ENG×PLAN 互斥 ∕ `#input-row.plan-active`（`:127`） ∕ AUTO 确认构面 ∕ `ctx.inputEl.focus()`（`:76,94,108`） | 读：`_advisorOn` ∕ `_engOn` ∕ `_planActive` ∕ `_autoApprove`（`status-bar.js:23` 同面读 `_planActive`——跨面状态 ⇒ 经 hooks 同步）；hooks：`syncModeState` · `onStatusRefresh`（`:129`） · `onAgentSettings`（`:117-118`） | `setAdvisorGuard` ∕ `setEngineeringEnabled` ∕ `setPlanMode` ∕ `setAutoApprove`（`:37,42,49,62,100`） |

**推送入口（宿主 → 核 —— 五类，经注入③ `state` 唯一入口）**：`models`（`model-picker.js:111`）· `autoApprove`（`mode-buttons.js:106`）· `agentSettings`（`:117`）· `planMode`（`:125`）· `atResults`（`chat-messages.js` → `showAtDropdown`）。

**四条跨面依赖 —— 落位 + 给由（评审轮 1 #2 点名单）**：

1. **`#settings-btn` 出口**（`webview/index.html:60` · `webview/chat.js:68`）：落位 = hooks.`openSettings`（控件行第 7 钮出口）；VSC 绑 = 本地 `openSettings`（webview 内嵌设置面板现状）；
   桌面绑 = `renderer/mount-settings.mjs` `openSettings`（既有出口 `:402`；挂载根 `[data-slot="settings"]`）。给由 = 「打开设置」语义单源在核件，设置面的界面载体两端自持（VSC = 面板内 ∕ 桌面 = 窗口级覆盖层）——零新通道。
2. **会话标题提示**（`send.js:85-86`）：落位 = hooks.`onTitleHint`；VSC 绑 = 现状（追加 `session.generatingTitle`）；桌面 = 不绑（列明端差——标题单源 = 会话清单 ∕ 回合尾刷新；无「Session N — 生成中」中间态面；U-R1-1 会话头零触碰）。
3. **状态行刷新**（`loading.js:94` · `mode-buttons.js:129`）：落位 = hooks.`onStatusRefresh`（两触发点）；VSC 绑 = `renderStatusBar`（唯一 writer `status-bar.js`）；桌面 = 不绑（状态行归 §3.6-① 轮；桌面刷新源 = store 订阅 · `mount-status.mjs` 独立面）。
4. **面板清理**（`send.js:72`）：落位 = hooks.`onTurnStart`（提交受理时刻一点）；VSC 绑 = `clearPanels`（含 `S._suspended` 条件）+ `_turnStart` ∕ `_llmCalls` 归零（同点）；桌面 = 不绑（列明——桌面无 goal ∕ task 双面板同面；回合起点动作归宿主事件面）。

### 2.4 移植清单（file-level 行动表 —— 复用面 ∕ 适配面）

**复用面（VSC 原件 → 核件落位 → 两端消费）：**

| # | VSC 原件（行数） | 核件落位 | VSC 侧改动（唯一 = 接线） | 桌面侧落位 | 唯一改点 |
|---|---|---|---|---|---|
| P1 | `webview/input.js`（160） | `composer/panel.mjs` 键位面 | 副作用体搬核；本档留 deps 构造 | `renderer/composer-send.mjs` 退役 → 消费核件 | 工厂化 + 注入面（五项——2.3） |
| P2 | `webview/send.js`（89） | `composer/panel.mjs` 提交面 | 同上 | 同上 | 出站 `post("send",…)` ⇒ 映射表 D1 |
| P3 | `webview/loading.js`（96） | `composer/panel.mjs` 派生面 | 同上 | 消费 | 忙态读面注入 |
| P4 | `webview/queued-mark.js`（41） | 已核化（`flow/queued-mark.mjs`） | 已消费 | 已消费（`ev:queue` 镜面） | 无（两端同源已在盘） |
| P5 | `webview/autocomplete.js`（189） | `composer/attach.mjs` + `composer/atmenu.mjs` | 拆两档搬核；本档留接线 | `renderer/attach.mjs` 收敛 → 消费核件 | `atComplete` ∕ 核 toast 注入 |
| P6 | `webview/model-picker.js`（152） | `composer/model-menu.mjs` | 同 P1 | 消费（候选面注入） | 候选面 ∕ 写路注入 |
| P7 | `webview/model-menu.js`（272） | `composer/model-menu.mjs` | 同 P1 | 消费 | footer 出口注入；**消费面三处**（+ 设置族两档 `settings-models.js:6` ∕ `settings-providers.js:9`——核件落位后同指核件） |
| P8 | `webview/mode-buttons.js`（131） | `composer/controls.mjs` | 同 P1 | 消费 | 四写路注入（D4） |
| P9 | `webview/index.html` 输入段（`#toolbar` L40-64） | `composer/panel.mjs` 结构（ids 锁） | 骨架保留（结构单源 = 同 ids） | `renderer/index.html` 空槽不变；子树挂入 | 挂载根映射 |
| P10 | `webview/controls.css` 输入段 —— **修正区间（评审轮 1 #5）= `:17-349` + `:373-388` + `:459-499` + `:582-658`**；排除段与归属：`:1-15`（`#status-line` ∕ `.status-sep`——状态行面 · §3.6-① 轮）· `:351-372`（`#panels` goal ∕ task）· `:389-441`（会话内搜索）· `:442-458`（`#status-line` loading dots——状态行面）· `:500-581`（task ∕ goal items） | `composer/composer.css`（原样） | 引核件 css（或保留镜像 + 锁） | 引 `/rc/composer/composer.css` | 变量别名块（C2） |
| P11 | `locales/*`（输入面板词键闭集） | 核 `i18n.mjs` 供体（键值逐字） | 已有 `i18n` 消息机制 | `renderer/i18n.mjs` 增键（**经 `renderer/i18n-composer.mjs` 出档合并**）+ `setStringsSink` | 字典补齐（C3） |

**适配面（桌面宿主胶水 —— 新增 ∕ 改动，逐件）：**

| # | 桌面件（现状行数） | 动作 | 唯一改点（给由） |
|---|---|---|---|
| Q1 | `renderer/mount-composer.mjs`（323） | 换装：删自建树（composerTree/composerModel/notices），挂核件面板 + 两个宿主挂件锚（提示行 ∕ 末条复制控件——2.4 保留面表） | 面板主体交由核件（R1 唯一目的）；保留 = deps 构造 + 写面 + 挂件面 |
| Q2 | `renderer/composer-send.mjs`（71） | 退役（−71，档删；提交面入核件；`withUserBlock` ∕ `ask` 面入核件 deps 边） | 同上 |
| Q3 | `renderer/attach.mjs`（180） | 采集 ∕ 芯片判据入核件；本档留载荷投影 `toImages` + 降级码 ∕ 提示行构面 | 载荷形端既有（D7）；降级提示行载体 = 挂件锚（2.4 保留面表） |
| Q4 | `renderer/index.html`（48） | `[data-slot="composer"]` 保持；无静态 ids（子树挂入） | 挂载形端既有 |
| Q5 | `renderer/chat.css`（480） | `.composer` 族样式退场（C1）；D24 锁随动（U-R1-2a——已裁） | 样式单源 = 核件 |
| Q6 | `renderer/app.mjs`（300） | 接线改核件工厂（`attachComposer` 调用面） | deps 装配点 |
| Q7 | `renderer/store.mjs`（329） | 增读面切片（若无）：面板态（models ∕ 模式位 ∕ 队计数） | 读面来源映射（D6） |
| Q8 | `renderer/events.mjs`（498） ∕ `events-subscribe.mjs`（78） | 新增 `ev:flags` 归约 ∕ 订阅（第十九通道）；**归约出档 `renderer/events-flags.mjs`**（拆档计划见 2.7——裁定②本批承接） | 工具驱动翻转可见性（D6 缺项） |
| Q9 | `src/main/ipc.mjs`（262） + `src/preload/preload.cjs`（60） | 新通道 `session:flags` ∕ `at:complete`（白名单 + 处理器两处同动；计数 29 ⇒ 31） | 桌面无对应宿主面（D4/D5） |
| Q10 | `src/main/agent-host.mjs`（375） | 增 `setFlags(key, patch)` ∥ `atComplete(query)` —— **两处理面出档**（`session-flags.mjs` ∕ `at-complete.mjs`；拆分评审结论见 2.7） | 同上 |
| Q11 | `src/main/at-complete.mjs`（新档——Q11 定名） | `at:complete` 文件枚举过滤实现（不扩 `file-links.mjs`——本档判据面 = 链接验存 ∕ 打开目标，非枚举） | 桌面无 `atComplete` 面 |
| Q12 | `test/files.mjs`（26） + 新测档 | 注册（见 2.7 测试面表） | 清单两向自检 |
| Q13 | `renderer/i18n.mjs`（490） | 增输入面板词键（值 = VSC 逐字）—— **经出档 `renderer/i18n-composer.mjs` 合并**（拆档计划见 2.7——裁定②本批承接；直入 `HOST_DICT` 即破 500 硬限） | C3 |

**保留面载体（评审轮 1 #4 定形 —— 删自建树后的载体 ∕ 生成者 ∕ 锁改锚）**：

删树范围 = `mount-composer.mjs` 自建树（`composerTree` ∕ `composerModel` ∕ notices 行）；各族在新结构下的载体逐条定形：

| 族（原锚） | 定形 | 容器 | 生成者 | 锁改锚口径 |
|---|---|---|---|---|
| B21 发送失败（`[data-notice="send-failed"]` · `mount-composer.mjs:95`） | **保留行**（行形不动） | 宿主挂件锚 **`data-composer-notices`**（`[data-slot="composer"]` 内 · 核件面板子树之前） | 桌面胶水（`mount-composer.mjs` 残余——`failedNotice` 面） | 选择器保留（`data-notice` 锚不动）；「树首子」断言 ⇒「挂件锚内」改锚（`views-chrome.test.mjs:154` ∕ `:340`） |
| B22 附件降级（`[data-notice="attach-degraded"]` · `attach.mjs:160-168`） | 保留行 | 同上（同锚） | `renderer/attach.mjs` 残余（`degradedNotice` 面） | 选择器保留；树序断言（`views-attach.test.mjs:145` ∕ `:158-159`）改挂件锚 |
| B13 满队（`[data-notice="queue-full"]`） | **toast 形**（VSC `send.js:37` `input.slotFull` 逐字） | 核 toast（`toast.mjs`——`#paste-toast`） | 核件（提交面） | `views-chrome.test.mjs:148` 改判 toast 面；原提示行退场 |
| B9 非栅格拒（`[data-notice="attach-unsupported"]`） | toast 形（VSC `autocomplete.js:139,150` `paste.unsupportedFormat` 逐字） | 核 toast | 核件（attach 面） | `views-attach.test.mjs:311` ∕ `:327` + `views-chrome.test.mjs:154` 改判 |
| B19 无工作区守卫 | 判据名 = 端既有（桌面 = 无活动会话 `disabled`）；出口被触达径 = VSC toast 形 | 核 toast | 核件（提交面） | 桌面出口不可达（`disabled` 在先）⇒ 锁零改（列明） |
| （本轮补列 · 删树发现项）末条复制控件（`[data-action="chat:last"]`） | 保留（桌面独有面） | 宿主挂件锚 **`data-composer-tail`**（面板子树之后） | `renderer/views/chat-copy.mjs`（零改——`lastCopyNode`） | `views-locks.test.mjs` 控件族四锁（`:341` ∕ `:354` ∕ `:359` ∕ `:366`）中 `.composer-interrupt` 成员随换装退场 ⇒ 组内重锚（余成员不动） |

**挂件锚（桌面宿主胶水 —— 槽内三件）**：`[data-slot="composer"]` = ① `[data-composer-notices]`（提示行族）② 核件面板子树（ids 照 VSC——结构单源）③ `[data-composer-tail]`（末条复制控件）。挂件锚属桌面胶水（非核件结构——不入结构锁）。

### 2.5 桌面宿主胶水（映射表 —— 唯一改点明细）

**新通道（白名单 + 处理器同动；fail-loud 沿既有先例）：**

- `session:flags`：载荷 `{ key, patch }`（`patch` 四键闭集 `planMode` ∕ `autoApprove` ∕ `advisorGuard` ∕ `engineering`，值布尔）⇒ 宿主 `setFlags`：核 `setSlotAutoApprove` ∕ `setSlotPlanMode` ∕ `setSlotEngineering` ∕ `setSlotAdvisorGuard`（`thincoder-core/session-slot-write.mjs:140-158`）+ 活代理重施（`loadAgentSlot`）⇒ 回执 `{ ok, flags }`（成功径携 `flagsOf` 活值——沿 `approval:respond` 成功径叠加先例 `agent-host.mjs:323-329`）；失败径零写 + reason。ENG×PLAN 互斥口径照 VSC（`panel-messages-settings.mjs:169-179`：ON 先清 plan）。
- `at:complete`：载荷 `{ query, seq }` ⇒ 宿主文件枚举过滤 ⇒ 回执 `{ ok, matches: [{ name, path }], seq }`（seq 原样回携——VSC 迟到丢弃判据 `autocomplete.js:29-34` 同式）。

**新事件**：`ev:flags` `{ key, flags }` —— 宿主产（工具驱动翻转 ∕ 写回执后）；渲染面归约 = `sessionFlags` 切片（同 `applyFlags`），订阅并入既有通道表（十八 ⇒ 十九；`events-subscribe.mjs:26-30` + `preload.cjs` `EVENT_CHANNELS` 同动）。

**推送映射表（VSC 消息 → 桌面）：**

| VSC 消息 | 用途 | 桌面对应（现物） | 处置 |
|---|---|---|---|
| `turnState {state}` | 忙位派生（Send ∕ Stop ∕ 占位） | `tabBadges[key] ⊇ running`（`badges.mjs`） | 已有（R1-4 收尾链两缺陷同面） |
| `busyQueued {count,items,…}` | 队计数 + 待发送标记 | `ev:queue` 快照（`queue.mjs` ∕ `flow/queued-mark.mjs`） | 已有（同源核件） |
| `models {models,prefs}` | 模型候选 + 现值 | `provider:list` ∕ `model:list` + `sessionMeta` | 已有面（控件换装后消费同源） |
| `autoApprove {value}` | AUTO 两态 | `sessionFlags.autoApprove`（`events.mjs:458-466`） | 已有切片；增 `ev:flags` 推送 |
| `planMode {active}` | PLAN 两态 | `sessionFlags.planMode` | 同上 |
| `agentSettings {settings}` | ADVISOR ∕ ENG 两态 | `sessionFlags.advisorGuard` ∕ `engineering` | 同上 |
| `workspaceGuard {active}` | 守卫第三态 | 无（桌面判据 = 活动会话，B19） | 适配（列明） |
| `atResults {matches,seq}` | @ 下拉数据 | 新 `at:complete` 回执 | 适配（新增） |

**图像载荷**：面板侧采集两段（粘贴 ∕ 文件选取）出 `dataURL` 串；桌面 deps 包为 `{name,mime,dataURL}` 逐项（D7 —— 端既有形，主侧 `prepareTurnAttachments` 零改）。

### 2.6 两缺陷对 VSC 同面收正（R1-4）

**本侧复跑实证**（脚本 = `thincoder-desktop/.thincoder/tmp/repro-input-dead.mjs`，可读可跑；本设计轮跑 4 组）：

| 组 | 场景 | 落定态读数（本侧） |
|---|---|---|
| G1 | 默认快流 · 直发 3 回合 | 每回合落定：`state=Ready` · `msgs` = 2 ∕ 4 ∕ 6 = 实际消息数；无 `running` 残留 |
| G2 | 慢流（`SLOW_MS=3000`）+ 回合中插入 → 回合尾续发 | 续发链落定（after-turn-2）：`state=Ready` · `msgs=4` = 4 块；无 `running` 残留 |
| G3 | 同 G2 复跑 | 同 G2（`pageErrors: []`） |
| G4 | 慢流 + 中断（`MODE=interrupt`）→ 再发 3 回合 | 各落定点 `state=Ready`；`msgs` 随槽写随动 |

**结论（如实呈报）**：本侧 4 组复跑**未复现**「忙位永久卡死 ∕ msgs 永久滞后」；观测到的 `state=running`、`msgs` 落后读数**均处于在飞窗内**（脚本快照时点 = 首块后 1.5s，流被持 3s ⇒ 回合真在飞，读数正确）。父侧实证（§1.1）按在册采纳为 R1 验收对象：**以落定态断言锁死** —— 若真实可达，实施舱按脚本先复现取证再修因；若不可达，机检以收尾态断言 + 负控保证此类读数不可成为终态。

**对标（VSC 同面）**：

- ① 忙位收尾：VSC = 宿主收尾**无条件广播** `turnState`（`chat-panel.mjs` 推送点 ∕ `panel-turn-loop.mjs` 结算），webview 纯派生（无本地复位窗口）；桌面 = `ev:activity done` 清位（`events.mjs:365-394`），清位依赖终局事件恒达 ⇒ 收正判据 = **直发 ∕ 步边界注入 ∕ 回合尾续发三径终局事件恒达**（核点：`turn-face.mjs:63,67-68`；续发 `turn-chain.mjs:51-68` → `agent-host.mjs:205-220`）。
- ② 计数收尾：VSC 计数面 = 会话槽写后随 `sessions` 消息刷新（`panel-session.mjs:146-150`）；桌面 = 回合尾 `refreshTitles`（`events-subscribe.mjs:49-60`）读 `sessions:list`（核 manifest `messageCount`，落盘先于终局事件）⇒ 收正判据 = **落定后 `msgs` == 流内消息数**（含中插轮 ∕ 续发轮）。

**机检（E2E · 新档）**：`test/integration/input-parity-settled.test.mjs`（注册 `test/files.mjs`）——mock provider（沿 repro 骨架）+ 慢流中插 + 续发：轮询至落定（`state` 段 ∉ running ∧ 无 `running` 位标 ∧ 队空）⇒ 断言 ① 忙位 ∉ running ② `msgs` == 消息数 ③ 输入框可用（Enter 起第 3 回合）④ 队列空 ∕ 待发送气泡清标。负控：临时断 `turn-face` 终局事件 ⇒ 断言判红（鉴别力取证）。

### 2.7 受影响文件与测试面（行数 ∕ 增量 —— 评审轮 1 #1 ∕ #3 ∕ #9 重排）

**行数口径** = 总行数（末换行计一行；`read` 工具「N lines total」同源，可复跑）。§3 旁证个别值为末行不计法（差 1）——本表以本口径为准，两法差 1 不入判。

**核件（新增 · 上提产出 —— `thincoder-render-core/composer/`）**：

| 核件 | 现读 | 预期增量 | 内容 ∕ 备注 |
|---|---|---|---|
| `composer/panel.mjs` | —（新档） | ≈330 | `input.js`(160) + `send.js`(89) + `loading.js`(96) 合流去重（键位 + 历史 + 自增高 + 提交面 + 忙态派生） |
| `composer/controls.mjs` | — | ≈190 | `mode-buttons.js`(131) + 控件行七钮 ∕ AUTO 确认构面 |
| `composer/model-menu.mjs` | — | ≈430 | `model-picker.js`(152) + `model-menu.js`(272) 合流；越 300 顾问线、距 500 硬限余 ≈70 —— 拆分债登记（触发 = 越 500 前 ∕ 下次实质触碰；候选面 = `mm-*` 样式注入面出档） |
| `composer/atmenu.mjs` | — | ≈150 | `autocomplete.js`(189) 的 @ 面 + 文件选取面 |
| `composer/attach.mjs` | — | ≈130 | 栅格门 + 采集 + 芯片条（判据面与桌面 `attach.mjs` 现物同源合流） |
| `composer/composer.css` | — | ≈470 | `controls.css` 输入段原样（P10 修正区间 = `:17-349` + `:373-388` + `:459-499` + `:582-658`）；距 500 硬限余 ≈30 —— 越线前触发拆分（候选面 = 下拉族出档） |
| `test/composer-*.test.mjs` | — | 新增 ≈300 | 结构锁 + 键位表 + 判据面；注册 `test/run.mjs`（核） |
| `package.json`（render-core） | 41 | ≈ +1 | `files` 增 `composer/`（`exports` `./*` 通配已覆盖） |

**VSC（改动 —— 皆「缩为注入接线 + 引核件」，行为零变）**：

| 档 | 现读 | 预期增量 | 备注 |
|---|---|---|---|
| `webview/input.js` | 160 | ≈ −150 | 副作用体搬核；本档留 deps 构造 + 注册序 |
| `webview/send.js` | 89 | ≈ −80 | 提交面入核；本档留接线 |
| `webview/loading.js` | 96 | ≈ −85 | 派生面入核；导出面（`modelSwitchBlocked` ∕ `applyBusyLock`）随核 |
| `webview/autocomplete.js` | 189 | ≈ −170 | 拆两档搬核（`attach.mjs` + `atmenu.mjs`） |
| `webview/model-picker.js` | 152 | ≈ −140 | 消费核件 |
| `webview/model-menu.js` | 272 | ≈ −260（留 re-export shim） | 消费面三处 = 输入面板 + 设置族两档（`settings-models.js:6` ∕ `settings-providers.js:9`）——核件落位后三处同指核件 |
| `webview/settings-state.js` | 99 | ≈ −11（搬核 `:44-56`；留 import ∕ re-export 两行） | `effortSelection` 改指核件 ∕ 留 re-export —— 消费面 `model-picker.js:11` 不断；余面（`effortEnumFor` ∕ `effortSelectView` ∕ `advisorEffort*` ∕ `labelFor`）原位不动 |
| `webview/settings-models.js` | 218 | 不动（经 shim） | `:6` `import { openModelMenu } from "./model-menu.js"` —— 由 = `model-menu.js` 留 re-export shim（同表上行）⇒ 本档零改；菜单消费面（模型槽 ∕ consult 行 ∕ advisor 槽）零碰 |
| `webview/settings-providers.js` | 283 | 不动（经 shim） | `:9` 同上（同由 —— 默认模型菜单 `_defaultModelMenu` 消费 `openModelMenu` 不变） |
| `webview/mode-buttons.js` | 131 | ≈ −120 | 消费核件 |
| `webview/queued-mark.js` | 41 | ±0 | 已核化（`flow/queued-mark.mjs`）；消费面不动 |
| `webview/chat.js` | 148 | ≈ +6 | 接线改核件工厂 + `#settings-btn` 出口注入 |
| `webview/chat-messages.js` | 260 | ≈ +6 | 五类推送转推核件（`models` ∕ `autoApprove` ∕ `planMode` ∕ `agentSettings` ∕ `atResults`） |
| `webview/index.html` | 96 | ±0 | 输入段骨架保留（结构单源 = ids 锁——`#toolbar` L40-64）；`#status-line` 行不动 |
| `webview/controls.css` | 659 | ≈ −470 | 输入段引核件 css；P10 区间外余段留守 |
| `webview/base.css` | 477 | ±0 | 变量供体；别名块在桌面侧（C2） |

**桌面（改动）**：

| 档 | 现读 | 预期增量 | 备注 |
|---|---|---|---|
| `renderer/mount-composer.mjs` | 323 | ≈ −145（批后 ≈180） | 换装：删自建树（≈ −200）+ deps 构造 ∕ 写面 ∕ 挂件面（≈ +55）；挂件面见 2.4 保留面表 |
| `renderer/composer-send.mjs` | 71 | **退役**（−71，档删） | 提交面入核；`ask` ∕ `withUserBlock` 面入核件 deps 边 |
| `renderer/attach.mjs` | 180 | ≈ −100（批后 ≈80） | 留 `toImages` + 降级码 ∕ 词键（`degradedCode` ∕ `degradedNotice`） |
| `renderer/views/chat-copy.mjs` | 114 | ±0 | 保留面（末条复制控件）；挂入点改挂件锚 |
| `renderer/index.html` | 48 | ±0 | 槽 `[data-slot="composer"]` 保持（`class="composer"` 去留随 C1 实施实测） |
| `renderer/chat.css` | 480 | ≈ −45 | `.composer` 族退场（C1）；D24 面板族锁随动（U-R1-2a 已裁） |
| `renderer/app.mjs` | 300 | ≈ +2 | 接线调用面 |
| `renderer/store.mjs` | 329 | ≈ +15 | 读面切片补齐（若无：面板态 `sessionFlags` ∕ 队 ∕ 模型候选） |
| `renderer/events.mjs` | 498 | ≈ −16（批后 ≈482） | **拆档计划（本批承接 · 裁定②）**：新事件归约出档 `renderer/events-flags.mjs`（≈ +75 = `applyFlags` `:458-466` + `sameRecord` `:191-197` 迁入 + `ev:flags` 归约 + 头注）；主档留注册（`reduce` 分派 `:427-451` +≤2 行）；先例 = `subagent-reduce.mjs`（同批续拆）；距 500 硬限余 2 —— 出档为硬需求（非预案） |
| `renderer/events-subscribe.mjs` | 78 | ≈ +5 | `ev:flags` 并入既有通道表（十八 ⇒ 十九） |
| `renderer/i18n.mjs` | 490 | ≈ +3（批后 ≈493） | **拆档计划（本批承接 · 裁定②）**：输入面板词键（≈ +40 键）出档 `renderer/i18n-composer.mjs`（新档 ≈ +45 = 键表 + 头注；沿「新增词族出档」在册拆分落形——先例 = `i18n-views.mjs` 第二档）；主档留注册 ∕ 机制面——**不得直入 `HOST_DICT`**（现读 490 距 500 硬限余 10，直入即破） |
| `renderer/views/chrome.mjs` | 181 | ±0 | U-R1-1 零触碰（裁㈡时加改——条件行） |
| `renderer/mount-head.mjs` | 156 | ±0 | 同上（条件行） |
| `src/main/ipc.mjs` | 262 | ≈ +6 | 白名单两条 handler 行 + 两 import（处理体出档，见下） |
| `src/preload/preload.cjs` | 60 | +2（`CHANNELS` 29 ⇒ 31） | `session:flags` ∕ `at:complete`；`EVENT_CHANNELS` 18 ⇒ 19（`ev:flags`）；注释面计数同改 |
| `src/main/agent-host.mjs` | 375 | ≈ +10（批后 ≈385） | **拆分评审结论**：新增两面零入档——`setFlags`（核 `setSlot*` 四写 + 活代理重施 + `flagsOf` 回执 + ENG×PLAN 互斥）出档新 `src/main/session-flags.mjs`（≈ +110）；`atComplete` 出档新 `src/main/at-complete.mjs`（≈ +60）；主档只留 import + 装配 ∕ 暴露两行 + 头注。存量 375 越 300 顾问线（<500 硬限）—— 拆分债登记（触发 = 越 500 前 ∕ 下次实质触碰；候选面 = `respondTo` + 待决门段出档） |
| `src/main/file-links.mjs` | 64 | ±0 | Q11 定档 = 新档 `src/main/at-complete.mjs`（本档判据面 = 链接验存 ∕ 打开目标，非枚举）；本档零改 |

**测试面（桌面 —— 逐档处置，与 2.8「全量绿」对齐）**：

| 档 | 现读 | 增量 ∕ 处置 | 备注 |
|---|---|---|---|
| `test/files.mjs` | 26 | +1（注册 `input-parity-settled`） | 清单两向自检 |
| `test/views-chrome.test.mjs` | 353 | 改锚（±0） | 自建树 ∕ `composer-send` import 面退役 ⇒ 核件面板 + 挂件锚；`queue-full`(`:148`) ∕ 两提示行序(`:154`) 断言改判 |
| `test/views-attach.test.mjs` | 343 | 改锚（±0） | 树序断言(`:158-159`)改挂件锚；`attach-unsupported`(`:311` ∕ `:327`) ⇒ toast 面；`submitDraft` import(`:23`) 退役 |
| `test/views-chrome-vocab.test.mjs` | 370 | 改锚（±0） | 词键闭集随 `i18n-composer.mjs` 出档（闭集断言面改指新档） |
| `test/views-locks.test.mjs` | 412 | 改锚（净减） | 导出面锁(`:86-89`——`composer-send.mjs` 三件退役)锁改指 ∕ 摘；CSS 锁(`:193-203` ∕ `:341-366` ∕ `:399`)随 C1 ∕ U-R1-2a 逐处改锚；存量越 300（<500）——拆分债登记 |
| `test/integration/chat-render.test.mjs` | 284 | 改锚（±0） | `.composer-input` D24 保留面(`:206` ∕ `:235`)随 U-R1-2a 改判 |
| `test/integration/first-run-smoke.test.mjs` | 172 | 改锚（±0） | INPUT 选择器(`:36`)改核件锚（`#input`）；发送失败行(`:41`)参照挂件锚 |
| `test/views-question.test.mjs` | 444 | 改锚（±0） | 回焦锚(`:370`)`[data-input="text"]` ⇒ 核件 `#input`；存量越 300（<500）——拆分债登记 |
| `test/host-floor.test.mjs` | 364 | 改锚（±0） | 文件基线(`:329`)含 `renderer/composer-send.mjs` ⇒ 退役行摘除（基线随换装收正） |
| `test/events-reduce.test.mjs` | 465 | 改锚（±0） | `applyFlags` 迁档 ⇒ import 面改指 `renderer/events-flags.mjs`；新增 `ev:flags` 归约用例 |
| `test/integration/input-parity-settled.test.mjs` | —（新档） | 新增 ≈180 | 见 2.6；注册 `test/files.mjs` |

（核件测试面 = `thincoder-render-core/test/composer-*.test.mjs` + `test/run.mjs` 清单同动；VSC 测试面 = `test/` 全量 + 面板面随装——见 2.8。）

**设计档落点（本批收口条件 —— 随实施批同笔落；「或父侧回填轮」括注退场 · 评审轮 1 #8）**：

- `docs/desktop/design/UI.md` §1 输入区行（`:20` 起）——对位表逐行落形 + 挂件锚（`data-composer-notices` ∕ `data-composer-tail`）+ C1 ∕ P10 收正；
- `docs/desktop/design/IPC.md` §2 通道表——`msg:send` 行（`:96`）收正 + 新增 `session:flags` ∕ `at:complete` 两行 + 事件表 `ev:flags` 行 + 表注（`:178` 模式位注族）对齐；**计数同改**（通道 29 ⇒ 31 · 事件 18 ⇒ 19——`preload.cjs` ∕ `ipc.mjs` ∕ `PROJECT.md` §10 BE 行三处同值）；
- `docs/desktop/design/PROJECT.md` §2——**KD-23 面板面收正**（裁定①：本地先行出泡）+ KD-40 复核句（交付仍宿主驱动——不变）+ §4.1 本批行数表随动 + 变更记录；
- `docs/render-core/design/RENDER-CORE.md`——§3 逐模块判定表（输入面板 7 档判定「端」⇒「核」收正 + `composer/` 组登记）+ §5 接口契约（核组导出面 + 注入面 + `composer.css` 样式契约）+ §6 受影响文件（核组六档）+ §9（端差登记）+ 变更记录；
- `thincoder-render-core/package.json`（`files` 增 `composer/`）。

以上五项 = **R1-6 验收项**（见 2.8）；查法 = 机检锚（键 ∕ 行在盘，逐处点名）。

### 2.8 验收对照（项级 ∕ 逐文件）

- **R1-1**：核件六档在盘 + 两端 import 同源（机检：import 路径逐点）+ VSC 全量绿 + 核件测试绿。
- **R1-2**：E2E 逐元素断言（A1–A11 ∕ B1–B20 机检锚 = ids ∕ 类名 ∕ 键位行为 ∕ 两浮层）+ 真机走查（输入 ∕ 历史 ∕ 中断模态 ∕ 菜单 ∕ 模式钮七件）。
- **R1-3**：`session:flags` ∕ `at:complete` 往返单测 + 白名单两处同动机检 + 映射表逐行；**失败径 ∕ 边界断言（评审轮 1 #7）**：
  ① `session:flags` 键值闭集越界（`patch` 表外键 ∕ 非布尔 ⇒ 拒 + 零写 + reason）；② 活代理重施失败（`loadAgentSlot` 抛 ⇒ 零写；回执不携 `flags`——禁假造）；③ ENG×PLAN 互斥口径（ON 先清 plan——逐字对 `panel-messages-settings.mjs:169-179` ∕ `panel-messages-turn.mjs:174`）；
  ④ 白名单外通道名（`preload` reject + `ipc.mjs` 无 handler 不注册——两处同源单测）；⑤ `at:complete` **seq 迟到丢弃**（旧 seq 回执 ⇒ 不下发 ∕ 不覆盖——VSC `autocomplete.js:29-34` 同式）+ 空 query ∕ 零命中 ⇒ 关下拉；
  ⑥ **负控（≥1）**：桩断 `flags` 回执 ⇒ 断言渲染面切片不随动（判红取证——鉴别力）。
- **R1-4**：见 2.6 E2E + 负控。
- **R1-5**：清单在册（2.11）。
- 逐文件：核件 —— 单测绿 + 结构锁；VSC —— 零行为差；桌面 —— 全量绿 + E2E 绿（受影响测试档逐档改锚 ∕ 退役处置 = 2.7 测试面表；改毕复绿）+ D24 锁随动（U-R1-2a 已裁）；宿主 —— 单测 + 冒烟（`--smoke` ok）。
- **R1-6（文档面随动 —— 本批收口条件 · 评审轮 1 #8）**：2.7 落点五处（`UI.md` §1 输入区行 · `IPC.md` §2 通道表 + 计数三处同改 · `PROJECT.md` KD-23 收正 ∕ KD-40 复核 + §4.1 · `RENDER-CORE.md` §3 ∕ §5 ∕ §6 ∕ §9 · `package.json` files）逐处收正 —— 查法 = 机检锚（键 ∕ 行在盘，逐处点名）。

### 2.9 关键决策（KD-R1-*）

- **KD-R1-1（载体）**：照搬经**共享核上提**（非桌面复刻）—— 依据 = 父侧纠正令 1「优先上提共享」+ 需求档 §3.6 共用渲染核口径；VSC 语义零变。
- **KD-R1-2（保真）**：一切 VSC 已有形态照搬（含 `Send` ∕ `Stop` 静态字面 · toast 形 · 芯片形 · 两浮层样式）；不新设计 ∕ 不优化。
- **KD-R1-3（改动唯一性）**：允许改动 = 工厂化 + 注入面 + 宿主胶水；每处列由（2.4 ∕ 2.5）。
- **KD-R1-4（结构单源）**：面板结构 ids ∕ 类名 = VSC `index.html` 输入段；核件测试锁两端一致。
- **KD-R1-5（出泡时刻 · 面板面）**：照 VSC 本地先行（B12）；交付链保持宿主驱动（KD-40 主机队列单源不变）；KD-23「零乐观写」面板面收正 —— **裁定①（2026-09-28）：准**（面板面按 VSC 本地先行出泡、交付仍宿主驱动；落句 = U-R1-2b）。

### 2.10 上抛项（U-R1-*）

- **U-R1-1（会话头三值 × 面板控件行 · 重复面待裁）**：R1 落 VSC 控件行后，会话头（`views/chrome.mjs` 三 `select`）与之重复。候选：㈠ 保留头（R1 零触碰）· ㈡ 头撤三值 · ㈢ 随 §3.6 会话面板轮处置。**倾 ㈠**；裁㈡时 R1 加两档（`mount-head.mjs` ∕ `views/chrome.mjs`）。
- **U-R1-2a（D24 静息描边锁 × VSC 原样 —— 已裁，§1.6）**：VSC 控件行 ∕ 输入行静息有 1px 描边（`controls.css:29-33,199-214`），与 D24 归零锁（`views-locks.test.mjs:341-403` ∕ `integration/chat-render.test.mjs:205-235`）冲突。**裁（§1.6）= 锁随动**：面板族按 VSC 原样；冲突断言随实施轮逐处改，改动逐行记录；其余外壳面不动。
- **U-R1-2b（KD-23 面板面收正 —— 裁定①（2026-09-28）：准）**：面板面出泡 = **VSC 本地先行**（提交受理时刻本地出泡）；**交付仍宿主驱动**（KD-40 主机队列单源不变——队列 ∕ 送达 ∕ 消费零改）。收正面（本批收口条件）= `PROJECT.md:61` KD-23「面板面零乐观写 ∕ 回执驱动出泡」+ `UI.md` §1 输入区行 `:20` 对应句逐处收正（落点 = 2.7 文档面 · R1-6）。裁定源 = 父侧（2026-09-28 设计修正轮派单在册）。
- **U-R1-3（两缺陷复现差异 · 报告）**：见 2.6 —— 本侧 4 组未复现永久形态；父侧若另有触发条件（时序 ∕ 操作序）请补一句，以窄化实施舱定位面。

### 2.11 §3.6 ②③ 差异清单（勘察 · 供轮序裁）

**② 右列 ⇒ 子 agent 面（替代 VSC live 面板角色）**

源坐标：VSC `#subagent-activity`（`index.html:35` · 会话流与输入区之间**横带** · `:empty` 隐藏 ∕ 32vh 封顶 ∕ 区内自滚）+ 内容 = 子 agent ∕ advisor ∕ consult 实例块（`activity.js` ∕ `panel-subagent-relay.mjs`）+ ⏹ 停止；桌面 `[data-slot="pool"]`（**右列常驻** · 三族 = 待审批 ∕ 活动块（子 agent）∥ 队列席位（零写者））。

差异（初判 · 深勘随该轮）：

1. **位置 ∕ 容器**：VSC 横带 vs 桌面右列 —— 用户 ② 已裁「右列 = 子 agent 面」⇒ 保留右列位置、内容语义换装（布局骨架 = 桌面三列，在册结构不对称）。
2. **内容族**：VSC = 子 agent 实例 ∕ advisor ∕ consult（+ ⏹）；桌面 = 子 agent 块 + 待审批族（VSC 审批 = 流内卡）—— 族序 ∕ 席位待定形。
3. **数据源**：两端已通（relay 面 —— `panel-subagent-relay.mjs` ↔ `renderer/subagent-reduce.mjs` ∕ `ev:subagent`）。
4. **在册缺口**：桌面池 `approvals` 无会话键维度（`events.mjs:175-177` 注）；VSC「出生即驻留 + 终态留场」vs 桌面 2s 拍 + 事件面 —— 生命期对齐面需核。
5. 桌面板面工具行已摘（「对齐第二批」）—— 与 ② 语义一致（工具操作面 ⇒ 子 agent 面）。

**③ 会话流 ⇒ VSC 对齐**

源坐标：VSC `#messages` —— `.message.user .bubble` **透明无卡壳**（无边框 ∕ 无底 ∕ 块距 14px ∕ user 面宽 100%）· 标签行 14px 粗体 accent（`chat.css:3-59`）；桌面 `.block` = **1px 描边卡壳 + 圆角** ∕ 块距 8px（`chat.css:13-25`）· 标签行已有同字面（`❯ You:` ∕ `❯ ThinCoder:`）。

差异（初判 · 深勘随该轮）：

1. **块壳**：VSC 文本面零卡壳零描边 vs 桌面卡壳 —— 桌面 D24「消息块壳」保留面与本差冲突候选（同 U-R1-2a 族）。
2. **面宽 ∕ 间距**：VSC max-width 90%（user 100%）· 块距 14px vs 桌面满宽 · 块距 8px —— 值面逐条对表。
3. **面内件**：工具卡 ∕ 推理 ∕ 错误面 —— 核件已同源（对齐第二 ∕ 三批），需与 VSC 逐值对表。
4. **流尾件**：桌面独有（digest ∕ timer ∕ ledger ∕ stopMark 行组）—— VSC 无同面 ⇒ 保留面列明。
5. **滚动 ∕ 回填**：VSC `historyPage` 懒加载 + 跟随；桌面 `chat-scroll` 回填 + 停跟 —— 行为对表随该轮。

### 2.12 边界（本批不做）

不触 `@thincoder/core` ∕ CLI；状态行（§3.6 ①）不入 R1；②③ 只勘察不定形；VSC 侧零形态 ∕ 零行为改动（上提改造 = 工厂化 + 注入面）；设置面 ∕ 审批 ∕ 提问卡 ∕ 计划面不动（AUTO 确认 popover 除外 —— 随控件行照搬）；设计档回填 = **本批收口条件（2.7 五处落点 · R1-6）**——「或父侧回填轮」退场。

### 2.13 承 §1.5 总纲（18:41 · 用户总纲）

本 §2 = 全流对位总纲的**第一件**（输入面板）；其余族（回合执行 ∕ 队列 ∕ 悬挂 ∕ 定时 ∕ 会话 ∕ 装配 ∕ 桥 ∕ 通知 ∕ 附件 ∕ 设置…）随全流对位清单（探索舱 #53）由父侧按判据排批；本批 ②③ 勘察清单（2.11）作该清单的输入面。

### 2.14 评审轮 1 修正 —— 打标（§2 就地修正 · 本作者段内 · 2026-09-28 · eng-designer）

本轮 = 设计评审轮 1（§3：🔴2 ∕ 🟡6 ∕ 🔵2）**十发现逐号落修**；笔权限于 §2——§1 ∕ §3–§6 零触碰，设计档 ∕ 代码零改。
**落笔方式**：就地修正（batch 工具 append-only ⇒ 就地修正经文件编辑落地，沿本仓「§2 就地修正 · 打标 · 原行可由 git 历史逐字复核」先例）；§2 状态行经 batch status 同拍更新。
**零新语义**：全部为评审发现与父侧裁定（① KD-23 面板面收正 = 准；② `events.mjs` ∕ `i18n.mjs` 拆分本批承接——两项随父侧修正轮派单在册，§1 段面补记归父侧）的收正 ∕ 补全落笔；编号收正（#10）为纯形态。

| 号 | 落点（§2） | 处置 |
|---|---|---|
| 1 | 2.7 全节重排（受影响文件表 = 现读 + 预期增量；`events.mjs` ∕ `i18n.mjs` 拆档计划——本批承接；`agent-host.mjs` 拆分评审结论；Q8 ∕ Q10 ∕ Q11 ∕ Q13 行定名 ∕ 定档 ∕ 拆档；测试档并入）+ 2.4 Q1–Q13 行数复核 | 落 |
| 2 | 2.3 注入面（原「四项」⇒「五项」；+ 按档逐处清单表（七源档 × 三归属）；+ 四条跨面依赖「落位 + 给由」） | 落 |
| 3 | 2.7 测试面表（10 档：现读 + 增量 + 改锚 ∕ 退役处置；≥300 档拆分债登记） | 落 |
| 4 | 2.4 保留面载体表（B21 ∕ B22 保留 + B13 ∕ B9 ∕ B19 toast + 末条复制控件补列；挂件锚三件；锁改锚口径）+ 2.2 五族行引 | 落 |
| 5 | 2.4 P10 行（区间收窄 = `:17-349` + `:373-388` + `:459-499` + `:582-658`；排除段逐段归属 ∕ 去留声明） | 落 |
| 6 | 2.10 拆 U-R1-2a（描边锁 · 已裁）/ U-R1-2b（KD-23 面板面收正 · 裁定①：准）+ 2.9 KD-R1-5 落句 + 2.2 B12 行引 + 2.11 引用收正 | 落 |
| 7 | 2.8 R1-3（失败径 ∕ 边界六项 + 负控） | 落 |
| 8 | 2.7 落点节（补 `RENDER-CORE.md` 五项 + 回填 = 收口条件）+ 2.8 R1-6 新行 + 2.12 边界句收正 | 落 |
| 9 | 行数复核改值（`i18n.mjs` 490 · `model-menu.js` 272 · `file-links.mjs` 64——2.7 表 + 2.4 Q 表；口径 = 总行数，2.7 表头注） | 落 |
| 10 | 「### 2.2 补注」并入 2.2 处置列口径段（编号唯一化——全文 2.1–2.14 无重号） | 落 |

### 2.15 评审轮 2 修正 —— 打标（§2 就地修正 · 本作者段内 · 2026-09-28 · eng-designer）

本轮 = 设计复评轮 2（§3「轮次 2」：🔴1 ∕ 🟡1）**两发现逐号落修**（父侧裁定：全部接受；#11 采择 = 选项 ①）；笔权限于 §2——§1 ∕ §3–§6 零触碰，设计档 ∕ 代码零改。
**落笔方式**：就地修正（同 2.14 先例 —— `batch` 工具 append-only ⇒ 就地修正经文件编辑落地；原行可由 git 历史逐字复核）；§2 状态行经 batch status 同拍更新。
**零新语义**：两项皆为本轮评审发现的收正（#11 = 注入面两写单源化 —— `:155-158` 逐项对齐；#12 = VSC 受影响表三档补行）——无表外内容。

| 号 | 落点（§2） | 处置 |
|---|---|---|
| 11 | 2.3 桌面侧注入写法（旧「`t` → 桌面字典」列 ⇒ 五项面写法：去 `t`、补 ⑤ `hooks`；取词 = 注册面 `setStringsSink`） | 落 |
| 12 | 2.7 VSC 受影响表（十三行 ⇒ 十六行：补 `settings-state.js` ∕ `settings-models.js` ∕ `settings-providers.js` 三档「现读 + 增量 + 处置」） | 落 |

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象**：R1 输入面板移植 §2（`docs/batches/2026-09-28-desktop-input-vsc-align.md`，45 行对位表 + P1–P11 ∕ Q1–Q13 清单 + 上提机制 + 两缺陷对标）。评审面 = 该档全文；旁证核读限于验收要求的结构档 ∕ 行数核查（无 git diff、无会话史考古）。
**降级声明**：本会话未提供项目文档地图与项目标准档 ⇒ 文档归属判据降级（按 Project Guide 与盘面实存档名判）；方法论合规按 AGENTS.md 现有条目判。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 受影响文件·结构档 | 🔴 | 待改档**零增量标注**（「≤±N」∕「结构不变」两栏全缺：`:243` 只列现读行数，`:173-187` Q 表同形），且跨档无拆档计划：`renderer/events.mjs` 盘面 498 行（档内自标 498；`:182` Q8 要在其中新增 `ev:flags` 归约 ⇒ 破 500 硬顶）；`renderer/i18n.mjs` 标「≈411」而盘面实为 **490** 行（`:243` 对照 `renderer/i18n.mjs:490` 实读）⇒ 加输入面板词键（`:187` Q13）破 500；`src/main/agent-host.mjs` 374 行（`:184` Q10 增 `setFlags` + `atComplete` ⇒ 破 300 顾问档）；`test/views-locks.test.mjs` 盘面 412 行且须再加锁（`:34` 描边锁随动）⇒ 破 300。另 Q11 目标档未定（`:185`「新档或扩 `file-links.mjs`」）⇒ 无档可标。 | 逐档补「现读行数 + 预期增量」两栏；`events.mjs` ∕ `i18n.mjs` 先给拆档计划（新事件归约 ∕ 词表投影各自出档，主档只留注册），`agent-host.mjs` 给拆分评审结论；Q11 先定档名再标注；既有测试档一并入表。 |
| 2 | 机制设计（注入面） | 🔴 | `:148` 断言注入面 =「VSC 三处宿主依赖的对应物」（root ∕ post ∕ state[**读面**] ∕ t 四项），但 7 档源（input/send/loading/autocomplete/model-picker/model-menu/mode-buttons）盘面实测外部依赖远超四项，且多指向 R1 边界外 ∕ 声明零触碰面：`ctx.messagesEl.querySelector(".welcome")`（`webview/send.js:46,64`——会话流面）、`clearPanels()`（`send.js:72`——面板面）、`renderStatusBar()`（`webview/loading.js:94` ∕ `mode-buttons.js:129`——A12 状态行面）、`ctx.sessionTitle` 写（`send.js:85-86`——U-R1-1 零触碰会话头）、`S._turnStart` ∕ `S._llmCalls` ∕ `S._busyQueuedCount` 等**本地先行写**（`send.js:40-41,62-63`）、`window._confirmSecretDelete`（`model-picker.js:26`——设置面确认门）、`ctx.sessionDropdown` ∕ `ctx.sessionSelector`（`model-picker.js:96-98`）；`#settings-btn` → 本地 `openSettings`（`webview/index.html:60` · `webview/chat.js:68`）在 D 表（`:125-131`）无落位（A7 `:78` 只列「写路四键」；对照 A8 `:79` 已为菜单 footer 三出口给映射）。按 `:48` 口径「唯一改动 = 宿主 API 非改不可处**逐处列出**」⇒ 清单不成立，后果 = 自造未声明的面（违 `:47`「不再出新设计」）或静默丢行为。 | 按档逐处补全宿主依赖清单（含跨面副作用 ∕ 本地先行写的归属：核件内生 ∥ 注入 ∥ 出站），并为 `#settings-btn` 出口、会话标题提示、状态行刷新、面板清理四条各给一行「落位 + 给由」；清单定稿前不宜进实施。 |
| 3 | 测试面（受影响档） | 🟡 | 受影响文件表（`:245`）只列 `test/files.mjs` + 新 E2E + 泛称「单元」，未列**既存必被改红的测试档**，而 Q1 ∕ Q2（`:175-176`）删自建树 ∕ 退役 `composer-send.mjs` 恰是这些档的断言对象：`test/views-chrome.test.mjs:18-19`、`test/views-attach.test.mjs:22-23,159`、`test/views-chrome-vocab.test.mjs:104,292-305`（词键闭集）、`test/views-locks.test.mjs:86-89`（导出面锁含 `composer-send.mjs` 三件）· `:195-203` · `:334-403`（CSS ∕ D24 锁含 `.composer-input`）、`test/integration/chat-render.test.mjs:213,235`、`test/integration/first-run-smoke.test.mjs:29,36,42`（选择器 = `[data-slot="composer"] textarea[data-input="text"]`）、`test/views-question.test.mjs:370`（受理回焦 `[data-input="text"]`）、`test/host-floor.test.mjs:329`（文件基线含 `renderer/composer-send.mjs`）。与 `:256`「桌面 —— 全量绿」直接冲突且无处置清单。 | 上述测试档并入受影响文件表，逐档给现读行数 + 增量（≥300 行档附拆分评审），并注明「改锚 ∕ 退役」处置。 |
| 4 | 结构一致性 | 🟡 | B21 ∕ B22 判「保留」（`:109-110`：`[data-notice="send-failed"]` ∕ `attach-degraded`），而其现居容器正是 Q1 要删的自建树（`:175`「删自建树（composerTree/composerModel/notices）」）——盘面核实这些提示行由 `composerTree` ∕ `attachmentBar` 构树产出（`renderer/mount-composer.mjs:95,108,120` · `renderer/attach.mjs:165,176`）；同族 B13 ∕ B9 ∕ B19（`:97,101,107`）又改判「toast 形」⇒ 保留面的新容器 ∕ 生成者未定，既有锁（`test/views-chrome.test.mjs:153-156` · `test/views-attach.test.mjs:311,326`）按哪形改无据。 | 三条提示族逐条定形 + 定落位（容器 ∕ 生成者），使「保留」在删树后有载体；同步指明对应锁的改锚口径。 |
| 5 | 范围（载体取值） | 🟡 | P10（`:168`）取 `controls.css` 区间 **L1-266** 作核件 `composer.css`，而 L1-15 经 A12 自证（`:83` 引 `controls.css:3-15`）正是**本批外**的 `#status-line` 段（盘面 `webview/controls.css:1-15` = Status Line 段，`:19` 起才是 `#toolbar` 输入段，全档 659 行）⇒ 核件将携带本批不拥有、且桌面另有其面（`renderer/index.html:39` `[data-slot="status"]`）的状态行样式。 | 收窄 P10 区间至 `#toolbar` 输入段（排除 `#status-line` ∕ `.status-sep`），或显式声明该段随 §3.6-① 轮的归属与去留。 |
| 6 | 裁定链（协调项） | 🟡 | U-R1-2 一项并两意：`:269` 标题 = D24 描边锁 + 尾注「（一并裁 KD-R1-5 面板面收正）」，`:264` KD-R1-5 = 照 VSC 本地先行出泡 + KD-23「零乐观写」面板面收正（`:100` B12 同指）；而 §1.6 父侧裁（`:34`）只就视觉描边锁判「锁随动 …… 冲突断言随实施轮逐处改」，未落 KD-23 面板面收正的判词 ⇒ 面板面「本地先行出泡」这一行为改动（`:14` 机制单源裁所悬）在册面无裁定。 | 拆两条：描边锁（已裁）∥ KD-23 面板面收正（补判词或改判保持宿主驱动），使 `:100` ∕ `:264` ∕ `:269` 与 §1.6 一一可查。 |
| 7 | 验收（新通道） | 🟡 | `:193` 已定 `session:flags` 失败径零写 + reason ∕ ENG×PLAN 互斥、`:194` 定 `at:complete` seq 原样回携，但 `:253` R1-3 验收仅「往返单测 + 白名单两处同动机检 + 映射表逐行」——无闭集外键 ∕ 非布尔 patch ∕ 活代理重施失败 ∕ 白名单外名抛错 ∕ 迟到 seq 丢弃的断言（对照 R1-4 `:235` 有负控）。 | R1-3 验收行补失败径 ∕ 边界项（键值闭集越界、白名单外 throw、seq 迟到丢弃），至少一条负控。 |
| 8 | 文档归属 ∕ 方法论 | 🟡 | `:247` 落点仅 `docs/desktop/design/UI.md` §1 ∕ `IPC.md` §1–§2 ∕ `PROJECT.md` 且整体「随实施批（或父侧回填轮）」推迟；新增共享核组 `composer/`（`:135,239`）与 `package.json` files ∕ exports 变更（`:239`）的归属档 `docs/render-core/design/RENDER-CORE.md`（盘面在档）未列。AGENTS.md「设计决定须**立即**写档」对表下，新通道表 ∕ KD-23 ∕ KD-40 面属规范面变更。 | 落点清单补 RENDER-CORE.md（核组登记 + 消费面）；新通道表 ∕ KD 两面的收正明确并入 R1 验收（或把回填轮写成本批收口条件），不留「或父侧回填」悬空括注。 |
| 9 | 标注精度 | 🔵 | 数字漂移 ∕ 格式不一：`renderer/i18n.mjs`「≈411」实为 490（`:243`）；VSC `model-menu.js` 记 `12987B`（`:165,241`）非行数（实 272 行）；`src/main/file-links.mjs`(≈) 无值（`:243`）。 | 统一以行数为口径复核改值，清除掩盖结构档风险的偏低标注（i18n 一处尤为关键）。 |
| 10 | 文面（编号） | 🔵 | `:213`「### 2.2 补注（口径澄清）」与 `:64` 的 2.2（逐元素对位表）同号重出且置于 2.5 之后 ⇒ 「见 2.2」类引用歧义；其内容实为 2.2 处置二值的口径澄清。 | 并为单号（2.2.1 或随表归位到 `:66` 处置定义之后），保持全文编号唯一。 |

**计数**：🔴 2 · 🟡 6 · 🔵 2。
**已核旁证**（结构档实读）：`renderer/events.mjs` 498 · `renderer/i18n.mjs` 490 · `src/main/agent-host.mjs` 374 · `renderer/store.mjs` 328 · `renderer/mount-composer.mjs` 322 · `renderer/app.mjs` 299 · `renderer/chat.css` 480 · `renderer/events-subscribe.mjs` 77 · `renderer/composer-send.mjs` 70 · `renderer/views/chrome.mjs` 180 · `renderer/mount-head.mjs` 155 · `src/main/ipc.mjs` 261 · `test/views-locks.test.mjs` 412 · `webview/controls.css` 659 · `webview/model-menu.js` 272 · `webview/input.js` 159 · `send.js` 88 · `loading.js` 95 · `autocomplete.js` 188 · `model-picker.js` 151 · `mode-buttons.js` 130（后六项与档内标注相符）；`preload.cjs` `EVENT_CHANNELS` = 18 条 ∕ `CHANNELS` = 30 条（`:196`「十八 ⇒ 十九」成立）；`protocol.mjs:33` `/rc/` 双根在盘（P10 供给面成立）。

VERDICT: changes-required

### 轮次 2（评审子代理）

**评审对象**：R1 输入面板移植 §2（`thincoder/docs/batches/2026-09-28-desktop-input-vsc-align.md`）。复评轮 = 核验轮 1 十发现落修 + 标记新问题。评审面 = 该档全文实读（本轮）；旁证 = 结构档 ∕ 测试面行数抽核 + 引证抽核 + 盘面机制核对（无 git diff、无会话史考古）。

**轮 1 十发现核验（本轮实读逐号）**：
- #1 🔴 受影响文件·结构档 → **落修**（`:278-361` 四表皆「现读 + 预期增量」；`events.mjs` 498→≈482 出档 `events-flags.mjs`（`:325`）· `i18n.mjs` 490→≈493 出档 `i18n-composer.mjs`（`:327`）· `agent-host.mjs` 375→≈385 两面出档 + 拆分评审结论（`:332`）· Q11 定档 `src/main/at-complete.mjs`（`:215` ∕ `:333`）；口径注 `:280`；抽核八档（store 329 ∕ mount-composer 323 ∕ events-subscribe 78 ∕ attach 180 ∕ chat-copy 114 ∕ VSC send.js 89 ∕ file-links 64 ∕ input.js 160）与盘面一致 ✓）→ **残留 = 本轮 #12**
- #2 🔴 注入面 → **主体落修**（`:155-156` 五项面 · `:161-171` 七源档 × 三归属表 · `:175-181` 四条跨面依赖「落位 + 给由」= `#settings-btn` ∕ 标题提示 ∕ 状态行刷新 ∕ 面板清理）→ **残留 = 本轮 #11**
- #3 🟡 测试面 → 落修（`:335-349` 十档表 + `:351` 注；盘面 grep 复核「composer 锚点触档」无漏档）✓
- #4 🟡 保留面载体 → 落修（`:219-230` 五族定形 + `:232` 挂件锚三件；盘面印证原产出点 = `composerTree` ∕ `attachmentBar`）✓
- #5 🟡 P10 区间 → 落修（`:198` 修正区间 `:17-349` + `:373-388` + `:459-499` + `:582-658`；排除段逐段归属含状态行面两段）✓
- #6 🟡 裁定链 → 落修（§1.7 `:39` 裁定①「准」；`:382` KD-R1-5 · `:387-388` U-R1-2a ∕ 2b · `:107` B12 行引）✓
- #7 🟡 验收（新通道） → 落修（`:367-370` R1-3 失败径 ∕ 边界六项 + 负控 ≥1）✓
- #8 🟡 文档归属 ∕ 方法论 → 落修（`:353-361` 五处落点含 `RENDER-CORE.md` 四项 + `package.json`；`:374` R1-6 验收行；`:419` 边界句收正）✓
- #9 🔵 标注精度 → 落修（`:327` 490 · `:170` ∥ `:304` 272 · `:333` 64 · `:280` 口径注与抽核一致）✓
- #10 🔵 文面（编号） → 落修（2.1–2.14 全文无重号；原「2.2 补注」并入 `:73`）✓

**本轮发现表**：

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 11 | 机制设计（注入面 · 一机制两写） | 🔴 | `:156④` 与 `:158` 同机制两写：`:156` 定「④ **取词供给**（注册面，非 deps 项 —— 核内取词走核模块级 `i18n.t`，端侧 `setStrings` 单点注册…）」；`:158` 仍列「**桌面侧**：`renderer/` 构造 deps（`post` → 通道映射表；`state` → store 切片；`t` → 桌面字典；`root` = `[data-slot="composer"]` 内以同 id 子树挂入）。」⇒ `t` 入 deps 与「非 deps 项」相冲，且该句漏 ⑤ `hooks`（本轮补全的跨面副作用面）。盘面机制侧 = 注册面：`renderer/i18n.mjs:34`「（模块级 `t`）⇒ 端侧经**注册面** `setStringsSink(fn)` 注入 —— 注册单点 = `renderer/app.mjs`」· `:444`「export function setStringsSink(fn) {」⇒ 本批核心契约（注入面）在册面自相矛盾。 | 二选一落定单源：① 改 `:158` 为五项面写法（去 `t`、补 `hooks`，取词 = 注册面）；② 或回改 `:156④` 为 deps 项并同步 P11 ∕ Q13 的 `setStringsSink` 口径 —— 改后 `:155-158` 逐项对齐。 |
| 12 | 受影响文件·清单完整性 | 🟡 | 三档被声明「要改 ∕ 要指」却不在 2.7 VSC 受影响表（`:297-311` 十三行）内：`:169`「`effortSelection` = 纯归一搬核（VSC `settings-state.js` 改指核件 ∕ 留 re-export）」；`:195` ∕ `:170` ∕ `:304`「消费面三处（… `settings-models.js:6` ∕ `settings-providers.js:9`——核件落位后同指核件）」。盘面（本轮 grep）：`webview/settings-models.js:6: import { openModelMenu } from "./model-menu.js"` ∕ `webview/settings-providers.js:9: import { openModelMenu } from "./model-menu.js"` ∕ `webview/settings-state.js:50: export function effortSelection(levels, current, registeredDefault) {`（`model-picker.js:11` 引之）⇒ 至少 `settings-state.js` 须编辑而无「现读 + 增量」行。 | 三档入 VSC 受影响表逐档给「现读 + 增量 + 处置」；若两设置档经 `model-menu.js` re-export shim 消费而零改，表内明写「不动（经 shim）」+ 由，消歧。 |

**计数**：🔴 1 · 🟡 1 · 🔵 0（轮 1 十项皆落修；#1 ∕ #2 残留两点 = 本轮 #12 ∕ #11）。

VERDICT: changes-required

### 轮次 3（评审子代理）

**核验对象**：修正轮 2 落修（复评轮 2 #11 🔴 注入面五项面对齐 ∕ #12 🟡 VSC 表三档补行；§2.15 打标在册 —— `:447-456`）。核验面 = 批次档全文实读（本轮）+ 盘面抽核（三档 VSC 文件 ∕ `renderer/i18n.mjs` ∕ `renderer/app.mjs` ∕ `thincoder-render-core/i18n.mjs`）—— 无 git diff、无会话史考古。

**核验表（轮 3 —— 两项落修 · 无剩余问题）**：

| # | Orig# | File | Severity | Status | Notes |
|---|---|---|---|---|---|
| 11 | §3 轮次 2 #11 | thincoder/docs/batches/2026-09-28-desktop-input-vsc-align.md | 🔴 | Fixed | `:158` 已改写为五项面写法，与 `:155-156` 逐项对齐（去 `t`、补 ⑤ `hooks`、④ 归注册面）：「- **桌面侧**：`renderer/` 构造 deps（① `root` = `[data-slot="composer"]` 内以同 id 子树挂入；② `post` → 通道映射表；③ `state` → store 切片；⑤ `hooks` → 桌面跨面绑定（跨面副作用 ∕ 跨面状态同步 —— 逐项见下清单））；④ 取词 = **注册面**（非 deps 项 —— `setStringsSink` 单点注册 = `renderer/app.mjs`；盘面 `renderer/i18n.mjs:34` ∕ `:444`）。」§2.15 行 11 在册（`:455`）。盘面复核：`thincoder-desktop/renderer/i18n.mjs:34`「端侧经**注册面** `setStringsSink(fn)` 注入 —— 注册单点 = `renderer/app.mjs`」· `:444`「export function setStringsSink(fn) {」· `thincoder-desktop/renderer/app.mjs:52`「setStringsSink(setStrings)」· `thincoder-render-core/i18n.mjs:18`「export function setStrings(strings) {」。 |
| 12 | §3 轮次 2 #12 | thincoder/docs/batches/2026-09-28-desktop-input-vsc-align.md | 🟡 | Fixed | VSC 表 13 ⇒ 16 行（`:305-307` 三档补行）：`:305`「`effortSelection` 改指核件 ∕ 留 re-export —— 消费面 `model-picker.js:11` 不断；余面（`effortEnumFor` ∕ `effortSelectView` ∕ `advisorEffort*` ∕ `labelFor`）原位不动」（现读 99 ∕ ≈ −11）· `:306`「不动（经 shim）」（218）· `:307`「同由 —— 默认模型菜单 `_defaultModelMenu` 消费 `openModelMenu` 不变」（283）；§2.15 行 12 在册（`:456`：十三行 ⇒ 十六行）。盘面复核：`thincoder-vscode/webview/settings-state.js:50: export function effortSelection(levels, current, registeredDefault) {`（搬核块 `:44-56`）· `thincoder-vscode/webview/model-picker.js:11: import { effortSelection } from "./settings-state.js"` · `thincoder-vscode/webview/settings-models.js:6: import { openModelMenu } from "./model-menu.js"` · `thincoder-vscode/webview/settings-providers.js:9: import { openModelMenu } from "./model-menu.js"`；三档末行号与表值一致（99 ∕ 218 ∕ 283）。 |

**计数**：🔴 0 · 🟡 0 · 🔵 0（复评轮 2 两项逐号落修；修正轮 2 未引入新 🔴 —— 收敛验证通过）。
VERDICT: pass

## §4 用户批准（主 agent）

### 4.1 用户批准（父侧代签 · 2026-09-28 19:2x）
- **三条件齐备**：① 设计评审 pass（轮 3 收敛核验通过——复评轮 2 两发现 #11（🔴 注入面五项面对齐）∕ #12（🟡 VSC 表三档补行）逐号落修并核验）；② 修正轮落地并核验（修正轮 2「§2.15 打标在册」+ 轮 3 复核通过）；③ token 已签发（**值为运行态、不落档**——实施舱按凭据面领取）。
- 授权口径 = 点火权延续委托 + §4 代签（自缚三条件齐）；实施序 = **核件上提（`thincoder-render-core/composer/`）→ VSC 改指 → 桌面换装**（分面派舱，各 ≤15 档；串行依赖由调度器排序）。

## §5 实施记录（eng-coder）

### 5.1 交付摘要（核件面上提 · 9 档 · 2026-09-28）

**状态行**：实施完成（舱 5 桌面测试面改锚 + E2E（T-DSK47）· fix round 1 六项 · 本舱面全绿 ∕ 并发轮 3 红如实登记）

**落点（新档 10 件——全部在 `thincoder-render-core/`；VSC ∕ 桌面树零写）**：

| # | 档 | 行数 | 内容（源档 → 落形） |
|---|------|------|------|
| 1 | `composer/panel.mjs` | 440 | `input.js(160)+send.js(89)+loading.js(96)` 合流 → `createComposerPanel(deps)`：结构（ids ∕ 类名照 `index.html:42-63`）· 键位 B1–B7 · 历史 · 自增高 · 提交面（直发 ∕ 排队出泡（B12 本地先行）∕ 满队 toast ∕ 守卫）· 忙态派生（占位符三态 ∕ 两钮显隐 ∕ 忙态门）；返回 `{ inputEl, setLoading(on?), applyBusyLock, isRunning(), models() }` |
| 2 | `composer/controls.mjs` | 206 | `mode-buttons.js(131)` + 控件行七钮（照 `index.html:53-63` 逐字：title ∕ aria ∕ 静止字面）· ENG×PLAN 互斥 · AUTO 内联确认两出口（yes ∕ no）+ Esc 关 · 三推送 handler · 读面初绘 |
| 3 | `composer/model-menu.mjs` | 496 | `model-picker.js(152)+model-menu.js(272)` 合流 + `effortSelection`（自 `settings-state.js:44-56` 搬核）· `mm-*` 懒注入 · 推理下拉点外关 ∕ Esc 关 |
| 4 | `composer/atmenu.mjs` | 146 | `autocomplete.js:10-121` @ 面（150ms 防抖 + 自增 seq ∕ 键盘导航 ∕ Enter·Tab 接受 ∕ Esc 关） |
| 5 | `composer/attach.mjs` | 125 | `autocomplete.js:122-184`（栅格门 `RASTER_MIME` ∕ 文档级 paste ∕ `#file-input`+`#attach-btn` ∕ 芯片条）；判据面与桌面 `renderer/attach.mjs:28` 同源合流（逐字同一字面） |
| 6 | `composer/composer.css` | 482 | `controls.css` 四修正区间（`:17-349`+`:373-388`+`:459-499`+`:582-658`）**逐字**切片（467 行）+ 头注 15 |
| 7 | `test/composer.test.mjs` | 325 | 结构锁 ∥ 样式锁 ∥ 键位表 B1–B7 ∥ 判据面（忙态 ∕ 提交 ∕ 栅格 ∕ effortSelection） |
| 8 | `test/composer-push.test.mjs` | 170 | 模式位读面初值 ∥ ⑤ 模式钮 ∕ AUTO ∕ 模型菜单 footer ∥ 推送五类 ∥ @ 面 |
| 9 | `test/composer-env.mjs` | 279 | 假 DOM 载体 + 面板夹具（非收集档——核 `run.mjs` 只收集 `*.test.mjs`；先例 = 桌面 `test/fake-dom.mjs`） |
| 10 | `package.json` | 42 | `files` 增 `composer/`（`exports "./*"` 通配已覆盖） |

**机检读数（复跑命令 + 结果）**：

- `cd thincoder-render-core && node test/run.mjs` ⇒ **tests 115 ∕ pass 115 ∕ fail 0**（基线 93 ⇒ +22 新 composer 用例；零回归）
- `cd thincoder-core && node test/run.mjs` ⇒ **tests 772 ∕ pass 772 ∕ fail 0**（验收 ① 基线零回归；本舱未触该包，读数佐证）
- **结构锁**：工厂产物 19 枚 `tag#id.class` + `title` ∕ `aria-label` ∕ `multiple` ∕ 钮字面 逐序 == VSC `index.html:42-63`（`#toolbar` 容器 ∕ `#status-line` 属状态行面 A12 本批外——排除在册）
- **样式锁**：`composer.css`（去头注）== VSC `controls.css` 四区间逐字（`assert.equal` 全串）
- **写入面（`git status --short`）**：`thincoder-render-core/{composer/, test/composer-env.mjs, test/composer-push.test.mjs, test/composer.test.mjs, package.json}`；`thincoder-vscode/webview/` ∕ `thincoder-desktop/` **零条目**（3 个 VSC test 档的 M ∕ ?? = 本舱开工前既有——开工基线在册）

### 5.2 决策透明表（设计未逐字之处 · 逐条给由）

| # | 面 | 本席决定 | 给由 |
|---|------|---------|------|
| D1 | 工厂返回面 | `{ inputEl, setLoading(on?), applyBusyLock, isRunning(), models() }` | 设计只定 `createComposerPanel(deps)`，返回形未定。逐项各有消费点：`setLoading()/applyBusyLock()` = VSC `panels.js:95,114` ∕ `chat-messages.js:99` 两调用点的保位（「逻辑零副本」要求可调）；`isRunning()` = 惯用式 `setLoading(ctx, ctx.isRunning)` 的读数；`models()` = VSC `chat.js:61` `getModels: () => ctx._models` 接线面；`inputEl` = 回焦锚（`chat.js:61,105`）。`send` 初稿在返回面，审计点出无消费点 ⇒ 已撤（两钮绑定内生） |
| D2 | 队列镜像 | 读面 `state.queue()` + 核内私有「本地先行增量」（权威值变化即收敛） | VSC `send.js:40-41` 的 +1 写在共享镜面里；镜面所有权转端 ⇒ 增量须留在核内且可收敛。实现 = 上次读到的权威值为标尺，`state.queue()` 值一变即归零增量（受理 → 推送 → 收敛链逐段等价） |
| D3 | `onStatusRefresh` 载荷 | `onStatusRefresh(status?)`，`status = { phase }`（仅 `setLoading` 径给） | `S._phase` 是状态行的读面（`loading.js:87` 写、`status-bar.js:43` 读）；核持相位 ⇒ 刷新钩随携快照，端侧同点镜像。`applyPlanMode` 径无相位变化 ⇒ 不带载荷 |
| D4 | `onTurnStart` 相对序 | 置于 `setLoading(true)` **之前** | VSC 三段（`:62-63` `_turnStart`/`_llmCalls`、`:69` `hadToolResult`、`:72` `clearPanels`）设计并为一钩；取 `_turnStart` 先落位（状态行 elapsed 首帧即新回合——VSC `:62` 早于 `:68` 的可观测面）；`clearPanels` 支随之提前（与状态行刷新零相互依赖，逐帧不可辨）。件头 `panel.mjs:37-39` 在册 |
| D5 | 跨七源档的两处「chat.js 本件」 | 推理下拉「点外关 ∕ Esc 关」+ AUTO 确认「Esc 关 ∕ 背板关」⇒ 归核件自持 | 源在 `chat.js:97-110,121-127`（非七源档）；但该两件是**下拉 ∕ 弹层自身的解散面**——不随核件走则桌面端组件不可关（A9 ∕ B18 要求「VSC 原样」）。端侧旧全局处理保留亦无冲突（幂等） |
| D6 | 解散面 ∕ 残件清理的查询形 | 本档元素引用 + 就近 `document.querySelector`（`.auto-confirm` ∕ `.auto-backdrop`） | 工厂自持元素的解散与残件清理；VSC 原式（`mode-buttons.js:66-69` 残件清）逐字保留 |
| D7 | `flags()` 读面初值 | 构造期 `paintFlags()` 同点落面（钮面 + AUTO 面） | ③ 读面（模式位快照）与「VSC 不可达态（内态与钮面分离）」的消解：缺省全假下与 VSC 静态起始面逐字同形（零差）；构造期零跨面同步（构造非状态变更）。评审建议 ① 落修 |
| D8 | `hadToolResult` | 并入 ⑤ `onTurnStart`（端侧绑定清位） | 设计 §2.3 send.js 行未单列该写点；它是跨面位（`streaming.js` 读）⇒ 随回合起点钩同盟、同点同位 |
| D9 | `_busyQueuedPending` | 核不自持（端侧 queued-mark 面照旧写） | VSC 全树零读者（`state.js:130` 自注「保留字段」）⇒ 核侧无消费点，禁假造；`panel.mjs:270-271` 在册 |

### 5.3 审计与代码评审轮次与终态

| 轮次 | 类型 | 发现 | 处置 |
|------|------|------|------|
| 1 | 内部探索偏离审计（explore · read-only） | **DEVIATIONS ×4**（皆 low：`onTurnStart` 相对序 ∕ `_busyQueuedPending` 镜像 ∕ 返回面两枚 ∕ 行数注记数值）；**PARTIAL = 零 · OUT-OF-LIST = 零 · 自造 = 零**；另报「六件在盘 ∕ 注入面五项 ∕ 出站十一类 ∕ 四条跨面依赖 ∕ 键位与忙态逐处同形 ∕ 双锁为真机检 ∕ 零越域」全部符合 | 逐条处置：序（D4 在册 ∕ 给由）· 镜像（D9 在册）· 返回面（撤 `send`）· 行数注记（改实读值：440 ∕ 496 ∕ 482） |
| 2 | advisor 代码评审（type=code · 同步） | **VERDICT: pass**（🔴 0；🟡 ∕ 🔵 建议 8 项：读面初值未落面 ∕ `--vscode-*` 入核（设计裁 ∕ 回填面）· 样式锁源 = VSC 待改档（下游协调）· 四档 >300 顾问线（拆分债已登记）· 件头行数自述失真 · 用例名与断言不符 · 防抖用例墙钟依赖 · 结构锁面窄） | fix round 1 落修 4 项（见 5.4）；余 4 项 = 设计档回填面 ∕ 下游舱协调（5.5 在册） |

**终态**：`clean`（无未处置 🔴 ∕ 🟡-must-fix；fix round 1 后复跑 115 ∕ 772 全绿）

### 5.4 fix round 1（评审建议落修 · 4 项）

| # | 面 | 修 |
|---|------|-----|
| 1 | 读面初值未落面 | `controls.mjs` 增 `paintFlags()`（钮面 + AUTO 面单点重绘）⇒ 构造期初绘一次 + `applyAutoApprove` ∕ 两点击终点改走同点；件头 ③ 面措辞收正（「初值即落面」）。**零行为差**（缺省全假下与 VSC 起始面逐字同形）；补两用例（缺省面 ∕ 初值面） |
| 2 | 件头行数自述失真 | `panel.mjs` 430 ⇒ **440**（余 70 ⇒ 60）；`model-menu.mjs` 495 ⇒ **496**（余 4）；`composer.css` 480 ⇒ **482**（余 18）；`test/composer.test.mjs` 补体量注记 |
| 3 | 用例名与断言不符 | 改名「取词面（④）：构造期静态字面 = 注册表登记值 ∥ `STRINGS` 闭集在册」（缺键回落支 = 核 `test/i18n.test.mjs` 面，指路在册） |
| 4 | 防抖用例墙钟依赖 + 结构锁面窄 | @ 面用例改「窗内零出站 + 轮询收敛（≤1s，10ms 步）」；结构锁扩面 = `title` ∕ `aria-label` ∕ `multiple` ∕ 钮字面入 `deepEqual`（文字面由人工抽查转机检） |

### 5.5 偏离 ∕ 越域 ∕ 上游注记（披露）

1. **行数估值偏离（设计档面——非本席笔权）**：实读 vs 设计 §2.7 估值：`panel.mjs` **440**（估 ≈330）· `model-menu.mjs` **496**（估 ≈430 ∕「余 ≈70」）· `composer.css` **482**（估 ≈470 ∕「余 ≈30」）· 测试 495 = 325+170（估 ≈300）。三档拆分债注记随头（`panel.mjs:33-35` ∕ `model-menu.mjs:22-26` ∕ `composer.css:8-9`）——`model-menu.mjs` **距 500 硬限仅余 4**：**下次实质触碰须先执行登记拆分（`mm-*` 注入出档，核件组 6 ⇒ 7 档）**。请设计档回填轮把实读值补入 §2.7 ∕ §6。
2. **`--vscode-*` 入核（设计裁 ∥ 回填面）**：`composer.css:270,290,358-359,371,389` + `model-menu.mjs:70,79,82,95-96,99,234` 携宿主主题命名空间——本舱设计（KD-R1-2 + P10 逐字）**有意为之**；与 `RENDER-CORE.md:23`（§1.2 ③）∥ `:342`（§9）「主题变量不入核」相冲，且 C2 别名块未覆盖 `--vscode-*`（桌面端即取 VSC 硬编码回退值）。**回填轮在 §3 判定表收正（7 档「端 ⇒ 核」）时一并处置**——本舱代码零改。
3. **样式锁源 = 待改档（下游协调）**：`test/composer.test.mjs:55-62` 的锁源 = VSC `controls.css` 四区间，而该档已排入 VSC 改指舱改动（§2.7：659 ⇒ ≈ −470）——该舱按 P10 第二选项「保留镜像 + 锁」或同拍改锚（VSC 舱任务书请点名）。
4. **下游舱两则结构性提示**：① VSC `index.html` 输入段骨架「保留」而工厂**全自建**（`panel.mjs:263-265`）⇒ 两存并挂会出现重复 id（静态档成死面）——VSC 舱须定形（删骨架 ∕ hydrate）；② 核内私有增量意味着 `S._busyQueuedCount` 镜面不再含 +1（`queued-mark.js:31-32` 仍按快照写）⇒ VSC 侧断言该镜面的用例须改锚（`queue-visible-vsc.test.mjs:83,97,118` ∕ `busy-injection-vsc-webview.test.mjs:153,158,171,183`）。
5. **核包首个非 `.mjs` 交付件**：`composer.css` ⇒ 设计 §1.3「vsix 只携 `.mjs` + `package.json`」的收窄句需在 VSC 舱随 `asWebviewUri` 引用面收正（打包面已无碍：`.vscodeignore:5` 反排除为 `**` 宽面）。
6. **越域声明**：本轮写入面 = 5.1 表十件（全部 `thincoder-render-core/`）；VSC ∕ 桌面树**零写**（`git status` 自证，开工基线在册）——**无越域**。

### 5.6 核件点修轮 —— `mm-*` 拆分 + 四件导出（eng-coder · 2026-09-28）

**状态行**：实施完成（内部探索偏离审计 1 轮 = 零偏差；advisor 代码评审 1 轮 = pass（🔴0 ∕ 🟡2 ∕ 🔵3）；fix 后置采纳 1 项（🔵）；终态 clean）

**交付（实写 3 档——全部 `thincoder-render-core/`）**：

| # | 档 | 动作 | 读数（口径 = read 工具行数） |
|---|---|---|---|
| 1 | `composer/model-menu.mjs` | 拆分执行（`mm-*` 注入出档）+ 补模块级导出（工厂改指同一实现） | 496 ⇒ **449**（余 51）；导出面四件 |
| 2 | `composer/model-menu-css.mjs`（新） | `mm-*` 样式注入纯出档（CSS 字面体 1922 字符字节级逐字） | 55 行 |
| 3 | `test/composer.test.mjs` | 导出面锁 ∕ 模块级语义用例 ∕ 样式锁改锚（父侧裁定） | 325 ⇒ 427 |

**机检读数（复跑命令 + 结果）**：

- `cd thincoder-render-core && node test/run.mjs` ⇒ **tests 118 ∕ pass 118 ∕ fail 0**（基线 115：退役 1（逐字样式锁——改锚）+ 新增 4（接线锁 ∕ 本体结构锁 ∕ 导出面锁 ∕ 模块级语义））
- 导出面实读 = `{ effortSelection, createModelMenu, openModelMenu, closeModelMenu }`（结构锁 + 实读双证）
- 逐字等价机检（拆分前副本 ∕ VSC 原件对比）：四函数（`closeModelMenu` ∕ `onEsc` ∕ `openModelMenu` ∕ `providerRow`）与 VSC `webview/model-menu.js` 去 `export` 后**全等**；CSS 字面体字节级相等
- 单源机检：`openModelMenu` ∕ `providerRow` 各仅 1 处定义（禁两份成立）；工厂 `close: closeModelMenu` = 同引用

**样式锁改锚（父侧裁定「本舱落」——因并发事件）**：VSC 舱（舱 2）2026-09-28 20:00:51 落 `@import` 形——`webview/controls.css` 13612⇒4394B（输入段移除），原「核 `composer.css` == VSC 四区间逐字」比对源不再存在（本舱开工基线 115/115 绿 ⇒ 并发后该锁转红，实发一次）。改锚形（裁定四件）：① **接线锁**（VSC 现文 `@import` → 核件 `composer/composer.css`，只读断言）② **核件本体结构锁**（四区间序 ∕ 各区间跨 ≥10 行，不依赖 VSC 现文）③ 旧逐字断言**退役 + 注记**（`test/composer.test.mjs:68-72`）④ 改锚动作单列（本节）。

**审计与评审轮次与终态**：

| 轮次 | 类型 | 发现 | 处置 |
|---|---|---|---|
| 1 | 内部探索偏离审计（explore · 只读） | **零偏差**（PARTIAL ∕ 静默简化 ∕ 文档漂移 ∕ 越域四类皆无）；两则上游注记（§5 缺本点修轮记录 ∕ 接线锁正则钉形风险） | 无必修；注记 2 当场硬化采纳（正则放宽至 node_modules ∕ `/rc/` 两形兼容） |
| 2 | advisor 代码评审（type=code · 同步） | **VERDICT: pass**（🔴0；🟡2 = 两档越 300 顾问线（债已登记 ∕ 非必修）；🔵3 = css 头注「逐字」精度 ∕ 接线锁跨树只读耦合（裁定形，显式不改）∕ 退役后内容无锁（裁定取舍，显式不改）） | fix 后置采纳 1 项（🔵 头注精度补括注）；余 2 项显式不改 |

**终态**：`clean`（无未处置 🔴；advisor pass；改锚后复跑 118/118）

**越域披露**：本舱写面 = 上表 3 档（全部 `thincoder-render-core/`）；`thincoder-vscode/` ∕ `thincoder-desktop/` 树**零写**（开工前∕后 988 档清单差分自证：本舱树恰 3 条；VSC 11 条 ∕ 桌面 2 条 = 其他舱并发，非本舱）。设计档漂移（供回填轮 ∕ 父侧记账）：核件组 6 ⇒ **7 档**（新档 `composer/model-menu-css.mjs`）；`model-menu.mjs` 实读 496 ⇒ **449**（§2.7 表原估值 ≈430，同族偏差第 2 次在册）。

### 5.6 交付摘要（桌面渲染面换装 · 舱 3 · 2026-09-28 · eng-coder）

**状态行**：实施完成（内部探索偏离审计 1 轮 = 6 发现逐条处置 + fix round 1 = 两处落修；advisor 代码评审见 5.9）

**落点（13 档 —— 全居 `thincoder-desktop/renderer/`；行数口径 = 末换行计一行，`read` 工具同源）**：

| # | 档 | 行数（前 ⇒ 后） | 内容 |
|---|------|------|------|
| 1 | `renderer/mount-composer.mjs` | 323 ⇒ **466** | 换装：自建树（`composerTree` ∕ `composerModel` ∕ notices 行）退场；核件工厂 `createComposerPanel(deps)` 挂入（deps 五项：`root` = 槽自身 ∕ `post` 通道映射表 ∕ `state` store 切片读面 ∕ ⑤ `hooks` 绑三 ∕ ④ 取词 = 注册面）+ 写面（§2.5 D1–D5 全 14 类出站）+ 挂件面（`data-composer-notices` ∕ `data-composer-tail` 两锚）+ 槽赋 `id="toolbar"` + 核件 css `<link>` 注入 |
| 2 | `renderer/composer-send.mjs` | 71 ⇒ **档删** | 退役（设计 §2.4 Q2）：`ask` 面迁入 mount-composer `call` ∕ `withUserBlock` 面迁入 mount-composer「deps 边」 |
| 3 | `renderer/attach.mjs` | 180 ⇒ **58** | 采集 ∕ 栅格门 ∕ 芯片条入核件（`composer/attach.mjs`）；本档留 `DEGRADED_WORD` ∕ `degradedCode` ∕ `toImages`（载荷投影 —— `dataURL` 串 ⇒ `{name,mime,dataURL}`）∕ `degradedNotice`（B22 行） |
| 4 | `renderer/chat.css` | 480 ⇒ **488** | `.composer` ∕ `.composer-input` ∕ `.composer-interrupt` 三族退场（C1）；**变量别名块 C2** 落位（VSC 变量名 ⇒ 端调色板，含 `--vscode-*` 八键）；两挂件锚样式；D24 交互态组「组内重锚」（U-R1-2a） |
| 5 | `renderer/app.mjs` | 300 ⇒ **300** | 接线改核件工厂（`attachComposer(host, { writeText, openSettings })`）+ 句柄捕获；`boot` 内 `initDict` 之后补 `composer.refresh()`（词面后到重派生）；错误横幅重试改指 `composer.submit`（直发径单副本） |
| 6 | `renderer/store.mjs` | 329 ⇒ **345** | `modelCandidates` 读面切片 + 纯动作 `setModelCandidates`（核件面板 ③ `state.models()` 端侧来源；`sessionFlags` ∕ `pending` 已在盘 ⇒ 不重建） |
| 7 | `renderer/events.mjs` | 498 ⇒ **482** | 拆分（裁定②）：`applyFlags` ∕ `sameRecord` 迁出 + `reduce` 增 `case "ev:flags"` 一行分派 + re-export 两件保名面（页读 ∕ 出站两消费面零改） |
| 8 | `renderer/events-flags.mjs` | — ⇒ **49** | 新档（拆分产物）：模式位归约径三件（`applyFlags` ∕ `sameRecord` ∕ `onFlags`） |
| 9 | `renderer/events-subscribe.mjs` | 78 ⇒ **80** | `ev:flags` 入通道表（十八 ⇒ 十九） |
| 10 | `renderer/i18n.mjs` | 490 ⇒ **495** | 输入面板词族第三档出档合并（`...COMPOSER_DICT` 两语展开）+ 退场四键（`composer.input` ∕ `composer.interrupt` ∕ `composer.queue.full` ∕ `composer.attach.remove` —— 消费面随换装归零）+ 计数链 177 + 28 − 4 = **201** |
| 11 | `renderer/i18n-composer.mjs` | — ⇒ **93** | 新档（拆分产物）：28 键 × 两语（键名 ∕ 值逐字 = VSC `locales/{en,zh}.json` 同名键） |
| 12 | `renderer/mount-settings.mjs` | 500 ⇒ **500** | **越清单**（§2.3 依赖 1 落位所需）：句柄面加 `openSettings` 一枚（控件行第 7 钮 + 菜单 footer 三出口转口；原地改，零增行） |
| 13 | `renderer/mount-cards.mjs` | 185 ⇒ **185** | **越清单**（设计漏列的回焦耦合）：回焦锚 `[data-input="text"]` ⇒ 核件 `#input`（不作改 ⇒ 作答 ∕ 取消回执后回焦静默零动作） |

**机检读数（复跑命令 + 结果）**：

- `cd thincoder-desktop && node test/run.mjs` ⇒ 基线（开工前 `desktop-test4.log`）**tests 250 ∕ pass 250 ∕ fail 0** ⇒ 本舱后 **tests 259 ∕ pass 245 ∕ fail 14**（14 项全为设计预声明的「测试改锚 = 舱 C2 面」项，见暂红清单；**无关项零回归**）
- `cd thincoder-render-core && node test/run.mjs` ⇒ **118 ∕ 118 全绿**（本舱零触碰核件树，读数佐证）
- **真机 E2E 复核（本舱自建探针 · 真 Electron + 假 OpenAI 兼容 provider · 零落盘脚本）**：① 结构面 = 槽 `id=toolbar` ∧ 子序 `notices → at-dropdown → input-row → paste-bar → controls-row → tail` ∧ `#input-row` 20px 胶囊 ∧ `#send-btn` accent 底 + `::after "Send"` ∧ 控件行七钮 VSC 逐字；② 直发径 = 本地先行块恰一枚（`A-稿`）+ 回合外证（chats=1）；③ 真忙态径 = 入队零本地块 ∧ 镜面气泡呈现 ∧ 交付时刻交接恰一枚块 ∧ 待发送组清空；④ **反径（端判忙 ∕ 宿主已闲）= 回执兜底补写恰一枚块**；⑤ `session:flags` 往返 = 回执活值 ⇒ `sessionFlags` 切片 ⇒ 状态行 banner 亮（`ADVISOR`）；⑥ `at:complete` 往返 = `{ ok, matches:[], seq }`（空命中断言关下拉）；⑦ 守卫第三态占位符 = 真词（`Open a folder to start…`）∧ AUTO 确认 popover 两出口 + Esc 关；⑧ 全程 `pageerror` 零
- **行数（≤500 硬限内）**：`mount-composer.mjs` **466**（设计估 ≈180 —— 见 5.9-1）· `i18n.mjs` **495** · `events.mjs` **482** · `events-flags.mjs` 49 · `i18n-composer.mjs` 93 · `app.mjs` **300**（恰线 ∧ `host-floor` U95 「`app.mjs` ≤ 300」成立）· `chat.css` 488

**暂红清单（14 项 —— 交 C2 收；本舱未改任何测试档）**：

| 测试档 | 项 | 红因（面已按设计换装） |
|------|-----|------|
| `test/views-chrome.test.mjs` | 整档 import 失败 | `composer-send.mjs` 档删 + `mount-composer.mjs` 导出面换装（`composerTree` ∕ `composerModel` 退场）⇒ 断言面改锚（设计 §2.7 测试表已列） |
| `test/views-attach.test.mjs` | 整档 import 失败 | 同上 + `attach.mjs` 导出面（`attachmentBar` ∕ `collectImages` ∕ `pasteRejects` ∕ `unsupportedNotice` 退场） |
| `test/views-chrome-vocab.test.mjs` | 整档 import 失败 | `attach.mjs` `attachmentBar` 退场；词键闭集面须改指 `i18n-composer.mjs`（28 键） |
| `test/views-locks.test.mjs` | U52 ∕ U152 ∕ U182 | 导出面锁（含 `composer-send` 三件）+ `.composer` 族 CSS 锁（C1）+ D24 面板族锁（U-R1-2a 逐处改锚） |
| `test/views-question.test.mjs` | U124 ∕ U210 | 回焦锚 `[data-input="text"]` ⇒ `#input`（假面选择器白名单同步；设计测试表所列该项） |
| `test/store.test.mjs` | U75 | 初态键集锁 ⇐ 增 `modelCandidates`（设计测试表**未列本档** —— 补登） |
| `test/events-reduce.test.mjs` | U89 ∕ T-DSK29 | 通道计数 18 ⇒ 19（`ev:flags`）+ `applyFlags` 迁档（import 面与新增归约用例） |
| `test/host-floor.test.mjs` | U95 | `fresh` 清单含已删 `renderer/composer-send.mjs` ⇒ 摘行 + 新档两枚（`events-flags.mjs` ∕ `i18n-composer.mjs`）入清单（`mount-composer.mjs` 466 越 300 ⇒ 入在册例外 ≤500 面，附拆分债） |
| `test/integration/chat-render.test.mjs` | T-DSK37 | `.composer` 顶线归零 D24 断言（U-R1-2a：面板族按 VSC 原样 ⇒ `#toolbar` 顶线 1px `--line`）+ `.composer-input` 保留面 |
| `test/integration/first-run-smoke.test.mjs` | T-DSK32 | `COMPOSER[data-state]` ∕ `textarea[data-input="text"]` ∕ 「输入框 disabled」三锚 ⇒ 核件锚 `#input`（守卫形改 toast ⇒ 两态断言随设计收正） |

### 5.6 交付摘要（R1 输入面板移植 · 实施舱 4 —— 桌面宿主面 · 2026-09-28）

**状态行**：实施完成（内部探索偏离审计 1 轮 + advisor 代码评审 1 轮 = pass；fix round 1 = 4 项落修）

**落点（本舱 7 档 + 父侧授权改锚 3 档；行数 = 设计 §2.7 同口径「总行数 · 末换行计一行」）**：

| # | 档 | 行数 | 内容 |
|---|----|------|------|
| 1 | `src/preload/preload.cjs` | 60 ⇒ 62 | `CHANNELS` 29 ⇒ 31（`session:flags` ∕ `at:complete` 末位）· `EVENT_CHANNELS` 18 ⇒ 19（`ev:flags` 末位）· 头注四处计数 ∕ 定序 ∕ 白名单组成句同改 |
| 2 | `src/main/ipc.mjs` | 262 ⇒ 278 | 两处理体两行（`sessionFlags` ∕ `atComplete` —— 纯转口 `requireAgentHost()`，与 `sessionPrefs` ∕ `subagentStop` 既有行同式）· `HANDLERS` 两行（末位）· 头注「三十一项」+ R1 两项段 + `file:open` 的「白名单末位」旧称退场 |
| 3 | `src/main/session-flags.mjs` | 新档 97 | 模式位四写面：`patch` 四键闭集（严格布尔）· 核 `setSlot*` 四写（写序 `planMode` → `autoApprove` → `advisorGuard` → `engineering`）· ENG×PLAN 互斥（ON 先清 plan —— VSC `panel-messages-settings.mjs:169-179` 逐字）· 活代理重施 `loadAgentSlot` · 回执 `{ok,flags}`（`flagsOf` 活值 ∕ 缺席禁假造）· 成功径 `ev:flags` 出站（写回执后）· 失败径 `{ok:false,reason}` 零写 |
| 4 | `src/main/at-complete.mjs` | 新档 76 | `at:complete` 文件枚举过滤：`@` 剥离 · 排除三目录（VSC 逐字）· 名前缀 ∨ 路径片段前缀 · 封顶 20 · posix 相对 `{name,path}` · `seq` 原样回携 · 空 query ∕ 零命中 ∕ 未开项目 ⇒ 空候选；`file-links.mjs` 零改 |
| 5 | `src/main/agent-host.mjs` | 375 ⇒ 388 | import 2 + 装配 2（`createSessionFlags` ∕ `createAtComplete`）+ 暴露 1 行（返回面 `setFlags, atComplete`）+ 头注段 |
| 6 | `test/agent-host-flags.test.mjs` | 新档 300 | U227–U233 七例（往返 ∕ ① 失败径零写 ∕ ② 重施失败 ∕ ③ 互斥 ∕ ④ 白名单两处同动 ∕ ⑤ `at:complete` ∕ ⑥ 负控） |
| 7 | `test/files.mjs` | 26 ⇒ 27 | 新测档注册（+1，同臂注记） |
| 8 | `test/host-floor.test.mjs`（授权改锚） | 364 ⇒ 369 | U13 ∕ U74 ∕ U76 三处计数（29⇒31 · 18⇒19 + `ev:flags`）· 注释旧计数 4 处同改 · U95 两臂补入本舱三档（审计建议） |
| 9 | `test/projects.test.mjs`（授权改锚） | 205 ⇒ 206 | U27 白名单清单（29 ⇒ 31）+ 题名 |
| 10 | `test/session-contract.test.mjs`（授权改锚） | 332 ⇒ 333 | U37 白名单定序清单（29 ⇒ 31）+ 头注计数 |

**机检读数（复跑命令 + 结果）**：

- `cd thincoder-desktop && node test/run.mjs` ⇒ **tests 230 ∕ pass 202 ∕ fail 28**；**28 红逐条落在渲染面（舱 3/#73 在飞）**，零处涉本舱面：`watch-pending` 导出缺名（U52 `SyntaxError: …'./chat-pending.mjs' does not provide an export named 'pendingOf'`）· `renderer/composer-send.mjs` 退役（U95 `ENOENT`）· 订阅表 18⇒19（U89 ∕ T-DSK29 `handlers.size === 18`）· `store.mjs` 新切片（U75 `modelCandidates`）· `chat.css` `.composer` 族撤（U152 ∕ U182 ∕ T-DSK37）· 真 Electron 集成九档超时（~30s）· `views-*` 多档装载失败（U52 同因）。父侧裁定在册：非本舱回归，留批级复验（舱 5/#79 全绿门）。
- **本舱自证面（定向复跑，全绿）**：`test/agent-host-flags.test.mjs` **7 ∕ 7** · `test/agent-host.test.mjs` **16 ∕ 16** · `test/projects.test.mjs` **9 ∕ 9** · `test/session-contract.test.mjs` **10 ∕ 10** · `test/host-floor.test.mjs` **10 ∕ 11**（余红 = U95 的 #73 面 `ENOENT`）。
- **两处同动**：`CHANNELS`（31）≡ `HANDLERS` 键集（U231 两向机检）；`EVENT_CHANNELS`（19）≡ `renderer/events-subscribe.mjs`（19）—— **U76 实跑绿（自愈已落，无需「待联动」挂账）**。
- **零写自证**：本舱写入面 = 上表 10 档；渲染面 ∕ VSC ∕ 核件树 ∕ `src/main/file-links.mjs` 零写。

**决策透明表（设计未逐字处 —— 逐条给由）**：

| # | 面 | 本席决定 | 给由 |
|---|----|---------|------|
| D1 | 失败 reason 闭集 | `bad-key` ∕ `invalid-patch` ∕ `slot-missing` ∕ `apply-failed` | 设计只写「失败径零写 + reason」；前三档沿 `setPrefs` 既有闭集（`agent-host.mjs:291-297`），`apply-failed` = 重施抛自铸一档（回执零 `flags`，禁假造） |
| D2 | 重施失败口径 | 「零写」= **活代理内存零写 + 槽写不回滚**（槽 = 权威面） | 设计 §2.5 自身序列 = 「四写 + 重施」⇒ 重施抛时槽写必已发生，「字面零写」物理不可达；实现取可达读法并档头列明（`session-flags.mjs:22-25`）+ 用例锁（`agent-host-flags.test.mjs:150`）；同仓先例 `setPrefs`（`agent-host.mjs:302-305`）同形 → 上报父侧文档面收正 |
| D3 | `ev:flags` 出站点 | 仅 `setFlags` 成功径 ∧ 活值在场（「写回执后」半句） | 设计给两产出点（「工具驱动翻转 ∕ 写回执后」）；「工具驱动翻转」在盘面无落点（`suspensions.mjs:118` `always` 置位只写内存，该径渲染面由 `approval:respond` 回执叠加覆盖 `agent-host.mjs:329-335`）→ 上报父侧 |
| D4 | 同 patch 多键写序 | `FLAG_KEYS` 固定序（`engineering` 居末）⇒ 同 patch 双 ON 时清位恒晚于 `planMode` 写点（工程位胜） | VSC 两消息序（ENG ON 清 plan ∕ PLAN ON 于 ENG 下拒绝）在单通道 patch 形下的等价落形 —— 半状态 `{engineering:true, planMode:true}` 不可落 |
| D5 | 多键 patch 非事务 | 无回滚（核写全同步 —— 判据档未触盘、写档核内原子读-改-写） | 单进程同步写无竞态窗；`writeFlag` 失败仅「槽不可读」一因（更无部分写实务路径）——列明不造第二机制 |
| D6 | `at:complete` 自定面 | 遍历序（同目录名序 + 深度优先）· 软链跳过 · 过滤 = 名前缀 ∨ 路径片段前缀 · 未开项目 ⇒ 空候选（非错误） | 设计只写「文件枚举过滤」；排除面 ∕ 封顶 20 ∕ posix 形 ∕ `seq` 回携皆 VSC 逐字，余为端侧自有实现（档头列明「非逐字拷贝」）；排序取「可复跑」 |
| D7 | ipc.mjs 不 import 两新档 | 两处理面出档 + 宿主装配 ∕ 暴露 + ipc 两 handler 转口宿主 | 设计 §2.7 `ipc.mjs` 行记「两 import」；落形沿既有全部行同式（`sessionPrefs` ∕ `subagentStop` ∕ `questionRespond`）—— import 会在 ipc 侧造**第二装配点**（`agents` ∕ `projects` ∕ `post` ∕ `flagsOf` 四 deps 皆宿主闭包面） |
| D8 | 用例号 | 自铸 U227–U233 | 设计归属表无本舱段（沿 `session-prefs.test.mjs` U127–U131 先例） |
| D9 | U95 两臂补入 | `fresh` 补两源档 + 新测档；零 `electron` 臂补两源档 | 审计建议（该档自述惯例「新增码面档一律入 ≤300 臂读数」）；超父侧「4 处计数断言」授权面 —— 随本表披露 |

**审计与代码评审轮次与终态**：

| 轮次 | 类型 | 发现 | 处置 |
|------|------|------|------|
| 1 | 内部探索偏离审计（explore · read-only） | **DEVIATIONS 四类**：① DOC-DRIFT（`IPC.md` ∕ `PROJECT.md` §10 BE 行计数未随 —— 非本舱笔权）② PARTIAL（`ev:flags` 「工具驱动翻转」产出点无落点）③ 口径相抵（§2.8 ②「零写」）④ 注释旧计数 4 处 + 🔵 软链归因措辞不准；**SILENT-SIMPLIFICATION = 零 · 自造项皆档头披露 · OUT-OF-LIST = 仅父侧授权面** | 可动项落修（fix round 1 #1 ∕ #2 ∕ #3）；①② 上报 |
| 2 | advisor 代码评审（type=code · 同步） | **VERDICT: pass**（🔴 0；🟡 4 ∕ 🔵 3：设计句自相矛盾 ∕ `ev:flags` 第二产出点 ∕ U95 三档未入臂 ∕ 协调项；🔵 键归一不一致 ∕ 过滤超集 ∕ 注释 `**` 不成对） | fix round 1 落修 2 项（U95 两臂 + 注释成对）；余为上报项 ∕ 在册债（R3） |

**终态**：`clean`（无未处置 🔴；🟡 全为上报项 ∕ 协调项 ∕ 在册债）

**fix round 1（4 项）**：

| # | 面 | 修 |
|---|----|-----|
| 1 | 注释旧计数（审计 ④） | `host-floor.test.mjs:6/:7/:194` · `session-contract.test.mjs:4` 的「二十九项 ∕ 十七条」⇒ 三十一项 ∕ 十九条 |
| 2 | 软链归因（审计 🔵） | `at-complete.mjs` 档头「取 `findFiles` 的保守形」⇒「**端侧保守自定**（VSC 同档未见显式排除软链的设定）」 |
| 3 | U95 两臂（评审 🟡） | `fresh` 补 `src/main/session-flags.mjs` ∕ `src/main/at-complete.mjs` ∕ `test/agent-host-flags.test.mjs`；零 `electron` 臂补两源档（实测 rows 96 ∕ 75 ∕ 299 皆 ≤300 · `electron` 零命中） |
| 4 | 注释 `**` 成对（评审 🔵） | `preload.cjs:12` 三项各自成对（`subagent:stop` ∕ `file:open` ∕ R1 两项） |

**越域披露（父侧裁决在册 —— 供批级记账）**：`test/host-floor.test.mjs`（U13 ∕ U74 ∕ U76 三断言点 + 注释 4 处 + U95 两臂）· `test/projects.test.mjs:165-176`（U27）· `test/session-contract.test.mjs:148-161`（U37）—— 父侧记「4 处」按断言点实为 **5 处**（+U95 两臂 = 审计建议项），补记即可。

**上报项（父侧裁 ∕ 文档面）**：① §2.8 R1-3 ②「零写」措辞与 §2.5 自身序列相冲（建议收正为「活代理内存零写 + 槽写不回滚」）；② §2.5 `ev:flags`「工具驱动翻转」产出点无落点（建议收正措辞或点名承接舱）；③ 文档面 R1-6：`IPC.md` §2 两通道行 + `ev:flags` 行 · `PROJECT.md` §10 BE 行（18 ⇒ 19 · 29 ⇒ 31）· §4.1 两新档 —— 非本舱笔权。

### 5.7 交付摘要（VSC 改指面 · 舱 2 —— eng-coder · 2026-09-28）

**状态行**：实施完成（内部探索偏离审计 1 轮 = 四类偏差静态面零命中；advisor 代码评审 1 轮 = pass（🔴0 ∕ 🟡2 ∕ 🔵6）；fix round 1 = 建议 5 项落修 + 1 项登记复核）

**范围**：VSC `webview/` 输入面板各档缩为「构造 deps + `createComposerPanel`」接线（逻辑零副本），消费核件 `thincoder-render-core/composer/` 六件；行为零变；`index.html` 骨架 ±0（结构单源仍为该档）。授权口径：父侧裁定 ①(b)「核件面补导出」——第 6 档按核件落定后的导出名收尾为 re-export shim。

**落点（产品 12 档 · 改前 ⇒ 改后 —— 口径 = 总行数，末行不计同 `read` 工具）**

| # | 档 | 改前 ⇒ 改后 | 内容（唯一改点） |
|---|---|---|---|
| 1 | `webview/input.js` | 160 ⇒ **126** | deps 构造 + 工厂装配（① 静态骨架运行时退场 19 id；② 出站表 `OUT` 14 类逐字面 + fail-loud；③ `state` 读面/推送收栈；⑤ hooks 9 枚；`ctx` 七字段重指 + `ctx.isRunning` 活代理） |
| 2 | `webview/send.js` | 89 ⇒ **12** | 提交面入核；本档转发发送钮内生路径（`send()`） |
| 3 | `webview/loading.js` | 96 ⇒ **16** | 派生面入核；留 `setLoading(_ctx,on)` ∕ `applyBusyLock()` 两导出面（调用面零改） |
| 4 | `webview/autocomplete.js` | 189 ⇒ **14** | 拆两档搬核（atmenu + attach）；留 `showAtDropdown` ∕ `closeAtDropdown` 推送入口（chat-messages 消费） |
| 5 | `webview/model-picker.js` | 152 ⇒ **15** | 消费核件：候选面镜像（`ctx._models`）+ `models` 推送转发（`handleModelsMessage`） |
| 6 | `webview/model-menu.js` | 272 ⇒ **10** | re-export shim（`openModelMenu` ∕ `closeModelMenu` ← 核件模块级；设置族两档消费不断） |
| 7 | `webview/settings-state.js` | 99 ⇒ **90** | `effortSelection` 搬核 + import/re-export 两行；余面原位不动 |
| 8 | `webview/mode-buttons.js` | 131 ⇒ **18** | 消费核件：三推送 handler 转发（四写路经注入 `post`） |
| 9 | `webview/chat.js` | 148 ⇒ **141** | 接线改核件工厂（`composerHooks` 导入 + 两枚 hooks 回填）；`#settings-btn` 出口经 `hooks.openSettings`；摘旧 `initAutocomplete` ∕ 两钮绑定 |
| 10 | `webview/chat-messages.js` | 260 ⇒ **260** | `atResults` 改静态 import（原 deps 项）；五类推送转推核件 |
| 11 | `webview/controls.css` | 658 ⇒ **196** | 输入段四区间（`:17-349` ∕ `:373-388` ∕ `:459-499` ∕ `:582-658`）退场，改 `@import` 核件 `composer.css`；P10 区间外各段留守 |
| 12 | `webview/index.html` | 95 ⇒ **95** | ±0（零改） |

**测试面改锚（8 档 —— 「改锚随搬」，断言语义逐条保持 ∕ 弱化处逐条披露）**

| 档 | 改锚内容 |
|---|---|
| `test/helpers/webview-env.mjs` | 输入段骨架改**直读** `webview/index.html` 的 `#toolbar` 段注入（免夹具第三份 ids 声明） |
| `webview-input-enter.test.mjs` | @ 面入口 `initAutocomplete(...)` ⇒ `autocomplete.js` 两推送导出；`ctx._interruptMode` ⇒ `interrupt-mode` 类名；T-B2-4「元素缺失支」退役（下拉由核件自建恒在）⇒ 改判下拉关闭态 |
| `webview-input-history.test.mjs` | 核内历史 ∕ 指针 ∕ 草稿不可直设 ⇒ 文件级 SEED 经真提交径送入；复位 = ↓ 走到底（行为径）；内部态断言改输入框可观测面 |
| `webview-turnstate.test.mjs` | ⑤ 中断模态进出改真键位径（Ctrl+I ∕ Esc）；核内态经类名观测 |
| `webview-model-busy-gate.test.mjs` | W14-1′ 谓词直驱 ⇒ 忙态门应用面（`applyBusyLock()`）观测 |
| `queue-visible-vsc.test.mjs` | T-V16-11 镜像断言（原「本地先行自增 = 2」）⇒「端侧镜面零本地写」（增量住核内） |
| `busy-injection-vsc-webview.test.mjs` | T-V16-5 同改锚（`= 1` ⇒ `= 0`，增量住核内） |
| `model-picker-fallback.test.mjs` | 候选面 ∕ 选中量 ∕ 归一单源搬核 ⇒ 预置改 `models` 推送命中支（`primeResidual`）；状态读面改**提交载荷**（`selectionProbe` = turn echo 同面）；①#3 由「冷启空值」改「覆盖回落」（真冷启态跨用例不可达，逐条给由） |

**机检读数（复跑命令 + 结果）**
- `cd thincoder-vscode && node test/run.mjs` ⇒ **tests 1052 ∕ pass 1052 ∕ fail 0**（基线同数 1052——零回归；改锚后 ∕ fix round 后各复跑一轮；fix round 中途曾现 132 红 = 夹具函数化漏改一行，改正即绿）
- 单档复跑：`webview-input-enter` 7∕7 · `webview-input-history` 8∕8 · `model-picker-fallback` 15∕15 · `webview-turnstate` ∕ `queue-visible-vsc` ∕ `busy-injection-vsc-webview` ∕ `webview-model-busy-gate` 全绿
- 协议面：`protocol-coverage{,-reverse}` 绿（14 类出站判别式与 §13 表同集——出站表 `OUT` 保提取器「形态①」且逐条有宿主 handler）

**写入面（`git status --short` 自证）**：本舱写 = `thincoder-vscode/webview/`（input ∕ send ∕ loading ∕ autocomplete ∕ model-picker ∕ model-menu ∕ settings-state ∕ mode-buttons ∕ chat ∕ chat-messages ∕ controls.css 共 11 档）+ `thincoder-vscode/test/`（helpers/webview-env + 7 档测试）；`thincoder-desktop/**` ∕ `thincoder-render-core/**` 的 git 条目 = 并行舱（桌面换装舱 ∕ 核件面舱）产物（mtime 与本舱窗口交错可辨，逐档内容 = 其面实现）——**本舱零桌面 ∕ 核件树写入**；零改档 `index.html` ∕ `state.js` ∕ `queued-mark.js` ∕ `base.css` ∕ `settings-models.js` ∕ `settings-providers.js` 在 `git status` 中零条目。

### 5.8 决策透明表（VSC 改指面 —— 设计未逐字之处 · 逐条给由）

| # | 面 | 本席决定 | 给由 |
|---|------|---------|------|
| D1 | 静态骨架退场 | `input.js` 启动期按 19 个 id 逐枚 `remove()`，核工厂随后全自建 | 核工厂自建全件（`panel.mjs` 结构面）——「骨架保留」与「同 id 双存」不可兼得（双存 ⇒ 静态档成死面、`getElementById` 命中错件）。终局 DOM 序 ∥ ids ∥ 属性与 `index.html:40-63` 逐字同（核结构锁已绑该档）。设计 §2.4 P9「骨架保留（结构单源 = 同 ids）」句面需回填收正为「运行时退场」。 |
| D2 | 出站表 `OUT`（14 类） | 出站统一收进 `input.js`，逐判别式字面登记 + 载荷 `...payload` 透传 + 未登记 fail-loud | ① 协议提取器（`protocol-coverage-reverse.test.mjs` 形态①）只在 webview 树内认「对象字面量顶级 `type` 字面量」——动态 `post(type,payload)` 桥会把 14 类判别式移出机检面；② 载荷透传 ⇒ 端侧零形状副本（核件 payload 单源）；③ fail-loud 防核件新增出站静默丢失。副作用 = §2.3「出站」列坐标迁档（随 R1-6 回填）。 |
| D3 | `state.ctx` 重指 + `isRunning` 活代理 | 七字段重指核件元素；`ctx.isRunning` 改 `get/set`（读 `composer.isRunning()` ∕ 写 `composer.setLoading()`） | 其余模块（`streaming.js` ∕ `panels.js` ∕ `chat.js` ∕ 测试面）经 `ctx` 读面零改；`panels.js:95,114` 的 `setLoading(ctx, ctx.isRunning)` 重派生惯用式必须读**活值**（写死值会清核件 loading 标记 = 行为差）。 |
| D4 | 推送入口 | 核 `state.subscribe` 收栈，端侧 `pushComposer(m)` 入口；`models` 同点镜像 `ctx._models` | 核件推送面唯一入口 = `subscribe`；`ctx._models` 是设置面板 `getModels`（`chat.js:49`）与菜单初值的共用读面 ⇒ 必须镜像（真实消费点，非假造）。 |
| D5 | `handleAgentSettings` 第二形参退役 | 设置面板刷新改经 `hooks.onAgentSettings`（chat.js 注入 `updateAgentSettings`） | 核 `applyAgentSettings` 同点调用该 hook（单点单源）；chat-messages 调用形（`handleAgentSettings(m, updateAgentSettings)`）保持零改。 |
| D6 | `send()` 适配 | 转发到发送钮内生路径（`#send-btn`.click()，查询域 = 面板子树内） | 核返回面撤 `send`（两钮绑定内生）；`send.js` 导出面保位（消费 = 测试 ∕ 外部触发点）；面板子树内查询免疫夹具同 id 干扰。 |
| D7 | `modelSwitchBlocked` 导出退役 | 谓词住核内（`panel.mjs`），端侧不再另立副本 | 端侧消费面（model-picker 两入口）已随核化退场；保导出 = 逻辑副本（违「机制单源」）。端侧观测面 = `applyBusyLock()` 应用面（W14-1′ 改锚）。 |
| D8 | 样式供给形 | `controls.css` 首条 `@import url("../node_modules/@thincoder/render-core/composer/composer.css")` | 沿 webview 既有 `../node_modules/@thincoder/render-core/...` shim 先例（`i18n.js` ∕ `toast.js` ∥ `queued-mark.js`）；`.vscodeignore:5` 已反排除核件树；CSP `style-src ${csp}` 与扩展根局部资源根相容（`chat-panel.mjs:421-424`）。**该面机检不可达**（happy-dom 只读字面）⇒ 真机读数登记为待补项（见 5.9）。 |
| D9 | 测试改锚 6 类 | 见 5.7 测试面表（内部态直写 ∕ 直读改可观测面；@ 面入口改推送导出；谓词断言改应用面） | 核内态（历史 ∕ 指针 ∕ 草稿 ∕ 中断模态 ∕ 选中量 ∕ 队列增量）单源住核件、无端侧读面 ⇒ 内部态断言无「逐字保持」的锚点，改指**产线同面**（提交载荷 = turn echo 唯一消费口；类名 ∕ 钮面 = 用户可见面）。逐条弱化处已在 5.7 表点名（T-B2-4 支退役 ∕ ①#3 冷启改覆盖回落 ∕ 两处镜像断言改「核内自持」）。 |

### 5.9 审计与代码评审轮次与终态

| 轮次 | 类型 | 发现 | 处置 |
|------|------|------|------|
| 1 | 内部探索偏离审计（explore · read-only） | 判定 PROBLEM（**部分不可核**）：四类偏差（PARTIAL ∕ SILENT-SIMPLIFICATION ∕ DOC-DRIFT ∕ OUT-OF-LIST）静态面**零命中**；审计舱无 `execute` ∕ `git` ⇒ 验收①（测试复跑）与③（越域）两面不可独立核验 | 两面对本舱自跑读数在册（5.7 机检 + 写入面）；审计四条重点（零副本 ∕ 注册序 ∕ 出站 14=14 ∕ `ctx` 读面覆盖）全判「符合」；另报三条观察（骨架退场机制 ∕ `state.js` 死字段 ∕ 行数微差）已并入 5.10。 |
| 2 | advisor 代码评审（type=code · 同步） | **VERDICT: pass** —— 🔴 0；🟡 2（皆非必修：P9 句面偏差 ∕ ①#3 用例鉴别力）；🔵 6（死写三处 ∕ 队列增量泄漏 ∕ 两写者注 ∕ 记录面漂移 ∕ 夹具第三源 ∕ 真机读数面） | fix round 1 落修 5 项（见 5.10）；余 1 项（队列增量收敛）经逐案复核改为登记注 + 前置条件入档 |

**终态**：`clean`（无未处置 🔴 ∕ must-fix；fix round 后复跑 1052 ∕ 1052 全绿）

### 5.10 fix round 1（评审建议落修 · 6 项处置）

| # | 面 | 处置 |
|---|------|------|
| 1 | 设计↔实现偏差（P9 骨架句面） | 不改码：退场为核件全自建的必然（D1 给由）；改由**回填轮**收正 §2.4 P9 句面 + 本块记录 |
| 2 | `model-picker-fallback` ①#3 鉴别力 | 落修：用例改「现值 + prefs 未命中 ⇒ **覆盖回落**」+ 前置 `primeResidual`（鉴别力恢复——原「冷启」前置跨用例不可达，已逐条给由） |
| 3 | 三档测试死写 | 落修：摘 `busy-injection-vsc-webview.test.mjs` ∕ `queue-visible-vsc.test.mjs` 的 `ctx._pastedImages.length = 0`、`webview-model-busy-gate.test.mjs` 的三枚 `ctx.selected*` 写；各补一行注（端侧同名字段已死 ∕ 不设复位之由） |
| 4 | 夹具第三份 ids 声明 | 落修：夹具改**直读** `webview/index.html` 的 `#toolbar` 段（结构单源，免静默分叉） |
| 5 | `chat.js` 端侧幂等保留段 | 落修：Escape ∕ 点外关两段加注（端侧幂等保留；源在核件解散面，核件舱 D5） |
| 6 | 队列增量跨用例泄漏（🔵） | 复核后登记：逐案核过——`busy-injection-vsc-webview` 每次快照推送即收敛（T-V16-5 `:152` ∕ T-V16-8 `:170,182`）、`queue-visible-vsc` 复位即收敛；`resetSend` 头注补收敛条件 + 「续添排队用例前须先推权威快照」前置 |

### 5.11 偏离 ∕ 越域 ∕ 上游注记（披露）

1. **行数估值偏离（设计档面——非本席笔权）**：实读 vs 设计 §2.7 VSC 表估值：`input.js` **126**（估 ≈10——OUT 表 14 行 + deps ∕ ctx 重指 ∕ 9 枚 hooks 绑定的实量，设计只估「留 deps 构造」）· `send.js` 12（估 ≈9）· `loading.js` 16（估 ≈11）· `autocomplete.js` 14（估 ≈19）· `model-picker.js` 15（估 ≈12）· `model-menu.js` 10（估 ≈12）· `settings-state.js` 90（估 ≈88）· `mode-buttons.js` 18（估 ≈11）· `chat.js` 141（估 ≈154）· `chat-messages.js` 260（估 ≈266）· `controls.css` 196（估 ≈189）。
2. **出站坐标迁档（设计档面）**：§2.3「出站」列按源档分列（abort ∥ interrupt ← input.js …selectModel ∥ selectReasoning ← model-picker.js），实现统一收进 `webview/input.js` 的 `OUT` 表（D2 给由）——表内坐标失效，请回填轮收正。
3. **P9 骨架句面（设计档面）**：见 5.8 D1 ∕ 5.10 #1。
4. **`state.js` 搬移残渣（本舱改动面外）**：`ctx.isRunning` 初值 ∕ `_pastedImages` ∕ `_inputHistory` ∕ `_historyIdx` ∕ `_inputDraft` ∕ `selectedModel` ∕ `selectedProvider` ∕ `selectedReasoning` 已无读者（真身住核件）；`state.js` 不在设计 VSC 表改动面 ⇒ 本舱零改，建议随 R1-6 清理（否则续写的测试会照旧踩死写）。同类：`workspace-guard.test.mjs:427` 的 `ctx._interruptMode = false` 死写（该档不在本舱 7 档改锚面）。
5. **VSC webview 真机读数（待补项）**：`@import` + `../node_modules` 相对解析在真 VS Code webview 下的实测（输入区胶囊 ∕ 控件行七钮 ∕ 两浮层 ∕ AUTO 确认样式）——happy-dom 只能读文件字面；本舱已实读资源在盘 ∥ 打包反排除 ∥ CSP/局部资源根相容三项，真机读数建议随 R1-6 或 VSC 冒烟轮补。
6. **核件面（舱 1 · 非本舱）**：`composer/panel.mjs` 440 ∕ `model-menu.mjs` 449 ∕ `composer.css` 482 越 300 顾问线（拆分债在册）；`model-menu.mjs` 的 `openModelMenu` ∕ `closeModelMenu` 模块级导出 = 父侧裁定 ①(b) 追补舱已落定（本舱第 6 档据其落定导出名收尾）。
7. **越域声明**：本轮写入面 = 5.7 表 11 产品档 + 8 测试档（全部 `thincoder-vscode/`）；**零桌面 ∕ 核件树写入**。

### 5.7 快照收敛轮（父侧裁定① · 当轮修净 · 2026-09-28 · eng-coder）

**触发**：内部探索偏离审计（1 轮）报 6 发现 —— OUT-OF-LIST 3（两处必需 + 日志档已清）· DOC-DRIFT 2（设计档回填随 R1-6 轮 ∕ `chat.css` 注释计数失真已修）· **SILENT-SIMPLIFICATION 1（🟡 忙位读数滞后两径的出泡归属）** —— 该条经**真机复现确认可达**（起慢回合后人为抹位标再提交 ⇒ 同条**两枚用户块** + 中途一枚镜面气泡；chat 命中 2 外证回合数正确）。父侧裁定 **① 当轮修净**（不交 C2 收），本舱据此落实现面。

**收敛实现（裁定① · 三写点单源）**：
- **判据单源** = `renderer/store.mjs` `isClaimed(blocks, text)`（`pendingClaim` 标记 ∧ `user` 类 ∧ 同文 —— 纯函数，两消费面同取，零副本）。
- **标记落点** = `renderer/mount-composer.mjs` `claimEcho(key)`：直发径回执言队形（`receipt.queued === true` ⇒ 忙位读数滞后**正径**）⇒ 本地先行块就地转认领标记（换新对象；块已不在序列 ⇒ 零写 —— 诚实回归）。
- **镜面让位** = `renderer/views/chat-pending.mjs` `pendingOf`：条目命中已认领块 ⇒ 不出镜面气泡（队计数不入本判 —— 状态行段 14 直读切片，计数不失真）。
- **交付认领** = `renderer/events.mjs` `onQueue`：`delivered` 命中已认领块 ⇒ 清标记**不追加**（该条恒恰一枚块）；无标记 ⇒ 常规追加（旧径零改）。
- **反径兜底**（同轮修）= `renderer/mount-composer.mjs` `sendQueued`：忙态径收**直发**回执（端判忙 ∕ 宿主已闲）⇒ 回执处补写用户块（**出泡不变式**：每受理消息恰一枚用户块）。

**机检锁（父侧要求 ② ③）**：新档 `test/integration/input-echo-converge.test.mjs`（T-DSK46 · 真 Electron + 本地假 OpenAI 兼容 provider）四径一例 —— ① 直发径（本地先行恰一枚块）· ② 真忙态径（端零本地块 ∧ 镜面在场 ∧ 交付交接恰一枚）· ③ **正径滞后**（队镜面切片在场为证 ⇒ 块恰一枚 ∧ 镜面让位 ∧ 交付认领不追加 —— **双块 ∕ 三块两场景同时锁**）· ④ **反径滞后**（回执兜底恰一枚块 —— 零丢泡）；全程 `pageerror` 零 + 假 provider 回合外证 ≥ 4。登记 = `test/files.mjs`。

**测试改锚轮（同轮 · 父侧要求 ① 全量 0 红）**：本舱按父侧裁定接 C2 面 —— `test/views-chrome.test.mjs`（U118/U119/U126/U153/U207 换装重写：源面形 + 纯面锁；树 / 模型 / 提交面归核件 `test/composer.test.mjs` 同源单锁）· `test/views-attach.test.mjs`（残余档四件重写：`DEGRADED_WORD` ∕ `degradedCode` ∕ `toImages` ∕ `degradedNotice`）· `test/views-chrome-vocab.test.mjs`（词族第三档闭集臂 + 树集改指 `lastCopyNode`；键数链 177 ⇒ **201**）· `test/views-locks.test.mjs`（U52 导出面锁 += `isClaimed` ∕ `setModelCandidates` ∕ 两新档；U152 换装面；U182 D24 组内重锚 + 零 `.composer` 族 / 零 `#toolbar` 反向锁）· `test/store.test.mjs`（初态键集 += `modelCandidates`；**新增 U75b** 认领判据 + 候选面纯动作）· `test/events-reduce.test.mjs`（通道 18 ⇒ 19 + `ev:flags` 在册）· `test/host-floor.test.mjs`（fresh 清单摘 `composer-send` 增两新档；`mount-composer.mjs` 466 入在册例外（拆分预案 = 写面出档 `renderer/composer-wire.mjs`））· `test/views-question.test.mjs` + `test/fake-dom.mjs`（回焦锚 `#input` —— 假面选择器闭集增 `#id` 形；自检写计随动）· `test/integration/chat-render.test.mjs`（D24 顶线改判：`#toolbar` 1px = 端 `--line`，非归零）· `test/integration/first-run-smoke.test.mjs`（输入锚 ⇒ `#input`；守卫两态改判：不禁用 + 拒发 + B21 行 + 本地先行恰一枚块）。

**复跑读数（终态）**：`cd thincoder-desktop && node test/run.mjs` ⇒ **tests 271 ∕ pass 271 ∕ fail 0**（开工前基线 = 250 ∕ 250 ∕ 0）；`cd thincoder-render-core && node test/run.mjs` ⇒ **118 ∕ 118 全绿**（本舱零触碰核件树）。临时日志档（`_c3-*.log`）已清；`renderer/{for(const` 杂件（shell 事故产物）已按父侧指令删除并披露。

### 5.12 交付摘要（桌面测试面改锚 + E2E · 舱 5 · 2026-09-28 · eng-coder）

**状态行**：实施完成（内部探索偏离审计 1 轮 = 代码/断言四类零命中 + 2 条 🔵 文档漂移；advisor 代码评审 1 轮 = changes-required（🔴1 ∕ 🟡1 ∕ 🔵4）；fix round 1 = 六项逐条落修 → 自跑复绿；**全量读数受并发轮污染**——见「并发披露」）

**起跑基线实读（与派单前提的偏差 · 首要披露）**：派单称「舱 3 ∕ 舱 4 已落定」——实证：§2.7 测试面表 11 档中 **2–10 项已由舱 3「快照收敛轮」落定**（`test/views-chrome` ∕ `views-attach` ∕ `views-chrome-vocab` ∕ `views-locks` ∕ `views-question` ∕ `host-floor` ∕ `events-reduce` ∕ `integration/chat-render` ∕ `integration/first-run-smoke` 的锚已按设计处置改定，逐档核读通过）；本舱实做 = ① 新 E2E 档 + ② `test/files.mjs` 注册 + ③ `events-reduce.test.mjs` 的 `ev:flags` 归约用例（设计句「新增 `ev:flags` 归约用例」当时未落）+ ④ `views-chrome` ⑦「两保留行行序」改判断言（设计句「两提示行序(`:154`) 改判」当时未落）。

**落点（本舱实写 5 档 + 1 新档拆出）**：

| # | 档 | 动作 | 读数 |
|---|---|---|---|
| 1 | `test/integration/input-parity-settled.test.mjs`（新档） | E2E 用例 `T-DSK47`：mock provider + 慢流中插 + 续发 ⇒ 落定轮询（设计三条件 ∧ 计数面追平）⇒ 四断言（① 忙位 ∉ running ② `msgs` == 流内消息数 ③ Enter 起第 3 回合 ④ 队空 ∕ 待发送气泡清标） | 新档 ≈257 行（设计估 ≈180 —— 见 §5.13 D6） |
| 2 | `test/files.mjs` | 注册新档（+1；两向自检由 `run.mjs` ∕ `views-locks` U52 承） | 27 ⇒ 28 行 |
| 3 | `test/events-flags.test.mjs`（新档 · 拆分产出） | U234 `ev:flags` 归约用例（自 `events-reduce.test.mjs` 出档 —— 该档加该用例后越 500 硬限） | 新档 51 行 |
| 4 | `test/events-reduce.test.mjs` | 加 U234（后出档）+ 两处计数注释收正（18 ∕ 十三 ⇒ 19）；U234 出档后回归 500 硬限内 | 465 ⇒ ≈471（加用例时曾 ≈515 → 出档后回落；用例 9 绿） |
| 5 | `test/views-chrome.test.mjs` | U118 补 ⑦「两保留行行序」改判断言（原自建树序断言 → 挂件锚内 push 序 + `clear(noticesAnchor)` + append 目标锚三臂） | +5 行 |
| 6 | `test/host-floor.test.mjs` | U95 `fresh` 臂补新档（`test/events-flags.test.mjs` —— 51 行在 ≤300 臂内） | +2 行 |

**机检读数（复跑命令 + 结果）**：

- **逐档复绿（`node --import ./test/rc-resolve.mjs --test <档>`）**：`input-parity-settled` **1 ∕ 1**（连跑 4 次全绿：11.5s ∕ 14.2s ∕ 14.5s ∕ 13.9s）· `events-flags` **1 ∕ 1** · `events-reduce` **9 ∕ 9** · `views-chrome` 8 ∕ 8（其 :143 面在并发轮在飞窗口内曾红，非本舱行）· `host-floor` **11 ∕ 11** · `views-locks` 4 ∕ 4（同因在飞窗口曾红）· 其余改锚档（`views-attach` 4 ∕ 4 · `views-chrome-vocab` 1 ∕ 1 · `views-question` 5 ∕ 5 · `integration/chat-render` 1 ∕ 1 · `integration/first-run-smoke` 1 ∕ 1）复绿。
- **全量（`cd thincoder-desktop && node test/run.mjs`）**：**tests 274 ∕ pass 271 ∕ fail 3**（2026-09-28 21:07:43 起跑 · 23.8s）——**本舱全档零红**；3 红全属并发轮面（`integration/input-echo-converge:109` ∕ `views-chat-frame:54` ∕ `views-chrome:191`），非本舱笔权（依父侧 21:0x 裁定「自身面逐个复绿 + 如实登记并发红」处置）。
- **起跑基线**：21:38 起跑时全量 = **271 ∕ 271 ∕ 0**（本舱开工前，舱 3 ∕ 舱 4 已落定态）。

**负控取证（判红可复算 · 一次性探针已还原）**：

| 步 | 动作 | 读数 |
|---|---|---|
| 1 | 探针前：`git status --short src/main/turn-face.mjs` + SHA256 | 零条目（工作树干净）· `EFA052F3…39DEA5` |
| 2 | 临时断终局事件（`:63` `post("ev:activity", { key, event: "done" })` 注释化 · 一次探针） | — |
| 3 | 复跑本档（`input-parity-settled`） | **判红**：`续发落定: 落定超时（忙位 = ["running"] · 状态段 = "running" ∕ 就绪词 = "Ready" · 队镜面 = [] · 待发送气泡 = []）` · tests 1 ∕ pass 0 ∕ fail 1（31.6s = 落定轮询上限耗尽） |
| 4 | 还原（原行逐字回写） | `git status --short` 零条目 ∧ SHA256 = `EFA052F3…39DEA5`（**与探针前逐字节相同**）· `git diff --stat` 零输出 |
| 5 | 复跑本档 | **回绿** 1 ∕ 1 |

**决策透明表（设计未逐字处 —— 逐条给由）**：

| # | 面 | 本席决定 | 给由 |
|---|---|---|---|
| D1 | 落定判据的「计数面入判」 | 落定轮询 = 设计三条件 ∧ 流内消息数 == 期值 ∧ 左列 `msgs` 读数 == 期值（三面同时真才落定） | 设计句只给三条件；实测两类**假落定**窗口：① 回合交接窗（回合尾 `done` → 续发起跑之间，位标已清 / 队已交而正文未落 —— 实测读到 `["user","user","assistant"]` = 3）；② 左列 `msgs` 随 `refreshTitles` 异步落值（实测满档并发下读数滞后一回合）。两窗都属「在飞读数」而非设计要锁的「终态滞后」；入判后仍判红（不收敛即超时抛 · 携全读数），鉴别力不降（负控同径判红） |
| D2 | 中插前置臂的判据集 | 只留「队镜面切片在场 + 待发送气泡在场 + 端零本地块」三臂；**删去**「忙位在场」臂 | 忙位在场面非设计四断言之一，且满档并发下（同批 10 档真 Electron 并发）镜面快照可能晚于回合落定 ⇒ 墙钟脆性；① 忙位面仍由落定态断言把守 |
| D3 | 待发送气泡读面 | 锚族 `[data-pending]` ∕ `[data-pending-item]` **容器无关**（不绑 `[data-slot="flow"]`）；节点文本读 `[data-raw]` ∕ 退 `textContent` | 该带落点在并发轮中已自流内非块组迁入输入区挂件锚（`mount-composer.mjs:257`）；设计句只钉「待发送气泡」不钉容器 ⇒ 锚族不变而容器迁不得判红 |
| D4 | 忙位就绪读面 | `waitBusy` 读 `store.tabBadges[<活动键>] ⊇ running`（状态判），不读 `#send-btn` 显示位 | 与同批收正轮裁决同式（`input-echo-converge.test.mjs:156`「状态判 —— 不依赖 `#send-btn` 显示位与 `SLOW_MS` 墙钟窗」）；显示位是核件派生实现细节 |
| D5 | `SLOW_MS` 取值 | **4000**（设计 §2.6 G2 复跑用 3000） | 本档入全量套件（同批并发 10 档真 Electron）⇒ 窗宽加一档负载余量，保「第二次 Enter 落在持流窗内」这一中插前提 |
| D6 | U234 拆档 | U234 出档 `test/events-flags.test.mjs`（+ 注册 + `host-floor` 臂） | `events-reduce.test.mjs` 加 U234 后 ≈515 行 **越 500 硬限**（AGENTS.md ≤500 硬限 · 设计 §2.7 该行计划「改锚（±0）」）；出档 = 本仓在册拆层惯例（先例 = 本档档头自记的 300 行拆层 `test/events-page.test.mjs`） |
| D7 | 计数注释收正 | `events-reduce.test.mjs` 两处 + 三处「十八 ∕ 十三路全退」类文案 ⇒ 十九 | 计数面单源（`renderer/events-subscribe.mjs` 实 19 = `preload.cjs` `EVENT_CHANNELS` 19）；D3 计数纪律（数与表同动） |

**审计与代码评审轮次与终态**：

| 轮次 | 类型 | 发现 | 处置 |
|---|---|---|---|
| 1 | 内部探索偏离审计（explore · 只读） | 代码 / 断言四类（PARTIAL ∕ SILENT-SIMPLIFICATION ∕ INTENT-CHANGE ∕ OUT-OF-LIST）**零命中**；2 条 🔵 DOC-DRIFT（§2.7 测试面表现读值与盘面不符 · 批档 §5 尚无本舱段）+ 3 复核点（O1 计数窗披露 / O2 两提示行序断言缺口 / O3 两处 stale 计数注释） | O2 → fix round 落（`views-chrome` ⑦ 补「锚内」臂）；O3 → fix round 落（两处计数收正）；O1 已在档头披露；2 条 DOC-DRIFT 上报（设计档 ∕ 批档非本席笔权） |
| 2 | advisor 代码评审（type=code · 同步） | **VERDICT: changes-required** —— 🔴1（`events-reduce.test.mjs` 越 500 硬限）· 🟡1（忙位读面与同批裁决分叉）· 🔵4（中插窗余量 / 死读面 `STATUS` ∕ `MSGS_SEG` ∕ `runningWord` ∕ `sendHidden` / ⑦ 锚内半边未闭合 / 测试面表数值漂移） | fix round 1 六项逐条落修（见下）→ 复跑复绿 |

**fix round 1（六项）**：① 🔴 U234 出档 `test/events-flags.test.mjs` + 注册 + `host-floor` 臂（D6）· ② 🟡 `waitBusy` 改状态判（D4）· ③ 🔵 `SLOW_MS` 1500 ⇒ 4000（D5）· ④ 🔵 死读面摘除（`STATUS` ∕ `MSGS_SEG` 两常量 + `runningWord` ∕ `sendHidden` 两字段）· ⑤ 🔵 `views-chrome` ⑦ 补 append 目标锚臂（「锚内 ∧ 行序」同断言闭合）· ⑥ 🔵 数值漂移上报（不回填 —— 非本席笔权）。

**终态**：`clean`（本舱面全绿 —— 逐档复绿 + 全量零本舱红；并发轮 3 红如实登记，非本舱笔权）

**并发披露（本舱窗口内的他轮写入 —— 逐条在册）**：本舱起跑后，**eng-coder#94 收正轮**在同一桌面树在飞（`src/main/at-complete.mjs` 20:43:31 · `agent-host.mjs` 20:44:03 ∕ 20:44:04 · `renderer/*` 20:45–21:00 · `test/*` 20:48–21:06 交替写入；含 `renderer/views/chat-pending.mjs` **档删** —— `git status` 记 `D`）。该轮**同时改写本舱交付档 `test/integration/input-parity-settled.test.mjs`**（20:49:15 ∕ 20:57:34 ∕ 21:00:44）——其「中插臂」两行与容器读面按 B12 新口径改锚；本舱后续改动基于其最新盘面续写（未回退其行）。据此：本档最终内容 = 本席骨架 + 该轮 B12 改锚行（**共笔如实披露**）；本舱未触该轮任何产品档与其自有测试档（依父侧 21:0x 裁定）。

### 输入逻辑收正轮 · 实施记录（eng-coder）

**终态**：桌面全量套件 **276/276 绿**（`cd thincoder-desktop && node test/run.mjs` · run17 · 0 fail · 34.6s）；收正轮五项 + 补件四行全部落定；B12 出泡面按最终口径（输入区上方带）重落。

**交付表**

| # | 项 | 状态 | 落点 / 证据 |
|---|---|---|---|
| ① | B12 待发送件落位（终态 = 输入区上方带 · 流里零节点） | ✅ | `renderer/views/chat-pending.mjs`（派生构树：⏳ 标签行两形 + 逐条 dim 正文 + 多编号 + ≤3 行 clamp + 超限尾标记）+ `renderer/mount-composer.mjs` `paintNotices`（贴输入框上沿）；流面零参（`views/chat.mjs` / `chat-chrome.mjs` 无 `[data-pending]` 插点）；`views/chat-pending.mjs` 流内插槽退场；滞后正径退流（`composer-wire.mjs` `retractEcho`）；认领机制整体退场（`pendingClaim`/`isClaimed` 零残留） |
| ② | Ctrl+I 单投 interrupt 携 message | ✅ | `agent-host.mjs` `interrupt(key,message)` ⇒ `abort({interrupt,message})`；`ipc.mjs` 透传；`turn-face.mjs` 中断续跑内层循环（`resume:true` 重入） |
| ③ | `susp` 模型门 | ✅ | `mount-composer.mjs` `turnState` 三值（running>susp>idle）+ `COMPOSER_KEYS` 加 `susp` |
| ④ | `mm-*` CSS 静态承载 | ✅ | 新档 `thincoder-render-core/composer/model-menu.css`（规则体与原注入串字节级相等）· 删 `model-menu-css.mjs` · VSC `controls.css` 第二条 `@import` · 桌面 `RC_SHEETS` 两条 `<link>` |
| ⑤ | @ 命中面收窄（名字段前缀） | ✅ | `at-complete.mjs` `hit()` 收窄 + U232 负控（`@src/ma` / `@ain` 零命中） |
| ⑥ | 行 1 队径清 B21 · 行 6 syncCandidates 相位 · 行 8 lastBusy 刷新 | ✅ | `composer-wire.mjs`（`failed = null` 两径 + `repaint()`）· `mount-composer.mjs`（候选落地复核 / `onLoadingReset`） |
| ⑦ | 行 9 测试加固（T-DSK46 ② 状态判 + 队相非空窗前置） | ✅ | `input-echo-converge.test.mjs`：`waitBusy` 改读 `store.tabBadges` / `waitQueued` / `waitIdle` / 模型面 `waitDelivered` |
| ⑧ | 邻接硬验收（两态截图 + 间距读数） | ✅ | T-DSK45 真机：邻接 **8px / 8px**（短会话 vs 长会话滚离底 —— 恒定）· 截图 `thincoder-desktop/.thincoder/tmp/pending-adjacency-{short,long}.png` |

**拆分落形（在册预案执行）**：`renderer/mount-composer.mjs` 换装后实读 466 → 收正轮增改后越 **500 硬限**（526）⇒ 在册预案「写面出档」本批执行：写面（通道往返 / 逐类型 handler / 本地先行块登记与退流 / B21 态）落 **`renderer/composer-wire.mjs`**（177 行）；本档收为 405（在册例外面内 ≤500）。登记面：`test/host-floor.test.mjs` U95（fresh 清单 + 例外面注记）。

**决策透明表**

| 决策 | 取值 | 依据 |
|---|---|---|
| 待发送块落位 | 输入区提示带（`[data-composer-notices]` 锚内，输入行上方） | 用户 21:07 直令「流里一个节点都不许有」+ 21:05 邻接硬验收；候选「流尾 + sticky」在短会话态不合格（sticky 不推底 ⇒ 仍浮高位），提示带 = 恒定邻接 |
| 待发送块形态 | ⏳ 标签行两形 + 逐条原文 dim + 多编号 + ≤3 行 clamp + 超限尾标记 | CLI 参照（`render-conversation.mjs:359-385` / `TUI.md` §7.5）；词键两语落 `renderer/i18n-views.mjs` |
| 认领机制（`pendingClaim`/`isClaimed`） | 整体退场 | 新口径下消费前流内零真块 ⇒ 去重标记无对象；`onQueue` 恒常规追加恰一枚 |
| `redraw` 触发面 | 带随 `pending` 切片（`COMPOSER_KEYS` 已含） | 零新订阅面 |

**自检 / 审计轮次**：本段未跑内部 explore 分歧审计与 advisor 代码评审（上下文预算耗尽，如实披露）——自检面 = 桌面全量套件 17 轮复跑（最终 276/276）+ 定向真机轨迹取证（T-DSK46 交付时刻模型面轨迹）。

**已知未决 / 异常（非本项面 · 留批级复验）**：交付后短窗内块面可能被会话左列页读刷新（`renderer/mount-sessions.mjs:56` `applyPage` 整置）覆盖 —— T-DSK46 交付后读数曾见该现象（模型面瞬时恰一枚 ✓，随后落零）；T-DSK47（他舱测试档）settle 期望 4 条而流内 3 条，同源疑点。

## §6 验证与收口（父代理）

### 6.1 收口（父侧 · 2026-09-29 03:2x）
- **交付总览**：**R1–R7 七轮全交**（§5 七段状态行在册——舱 5 桌面测试面改锚 + E2E（T-DSK47）· advisor 评审 pass 各族 · fix 轮逐项落修（含 **#436** 队首 Enter 直发判定句）+ **输入失效两实证修复**（忙位卡死 ∕ 计数滞后））；设计面 = 评审轮 1 ∕ 2 共十二发现逐号落修。
- **验证（父侧）**：各轮读数在册（§5 各段）；5.13 并发轮污染 = 如实登记（**非本批面**——归他批）。
- **收口测试行（F9 双半）**：① 本批单元档 = **无随档件**（实施期测试面（含 T-DSK47 改锚）随全清令退役——如实在册）；② 集成影响 = **无**（重建期窗口）。
- **台账结算**：**#526 核销**（依据本节 + §5 七轮）；**#436** 由本批 R1 落定（核销在册）。
- **残留（转出在册）**：#429（VSC slash 堵队）= 已由 tech-debt 轮 8「取批面放行」落定并核销；T-DSK21 键面走查 = #537 家族（用户账）。
- **前置核（D7）**：修正轮先于 close ✓；指针 ∕ changelog 抽核 ✓。
- **本记录收口冻结**（后续变更 = 新批）。
