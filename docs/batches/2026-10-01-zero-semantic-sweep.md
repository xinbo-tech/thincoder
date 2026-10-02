# 2026-10-01 · zero-semantic-sweep
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-01 · 来源 = 台账 #781 ∥ #783 ∥ #753 ∥ #756 ∥ #763 ∥ #774 ∥ #777——用户 2026-10-01 13:0x「A/B/D 先开始处理」+「都开始啊」令。
> 台账 = #781 ∥ #783 ∥ #753 ∥ #756 ∥ #763 ∥ #774 ∥ #777（desktop ∥ vsc ∥ core · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-01
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**零语义清账批**（桌面 ∥ VSC ∥ 核注释与微残面——七项）。

**来源** = 用户 2026-10-01 13:0x「A/B/D 先开始处理」+「都开始啊」令；条目 = 台账 #781 ∥ #783 ∥ #753 ∥ #756 ∥ #763 ∥ #774 ∥ #777（逐条 evidence 在台账）。

**条目与要点（详 = 台账逐行；届盘坐标以设计师实读为准）**：
- **#781**：`turn-driver.mjs:53/:117` 注「三查位 ⇒ 四查位」×2（`PROJECT.md:135` 已升四查位）∥ `turn-face.mjs:161-173` 缩进 2 空格（#719 遗留）；
- **#783**：`streaming.js:125-126` 英文注「removes its own card」归属语义随 D9 陈旧（摘卡已归端壳 `question.js`）；
- **#753**：陈旧注释族「done=settle 时发」（CLI ∥ VSC ~7 处 + `TUI.md:341`）+ `subagent-freeze.mjs:187` `finishSubTasksByRole` dead-export 二择（删 ∥ 保留+注）；
- **#756**：别名撤除残留——`batch.mjs:7` 头注范围 ∥ 库外残留三档（`TOOLS.md:245` ∥ `AGENT-LOOP-UPSTREAM.md:31` ∥ `API-CONTRACT.md:532/:549`）∥ 行宽 as-of（`BATCH-RECORD.md:429`）；
- **#763**：批内件「平 node 直测」跨 `/rc/` 根绝对导入不可跑（实例 = theme-switch 腿 6）——三择：测试环境支持 ∥ 迁真机 ∥ 链改相对导入；
- **#774**：盘符大小写 ⇒ ESM 双实例族性排查（c3/c2 实例已修——同模式扫描；扫出新实例 ⇒ 登记扩面）；
- **#777**：`2026-09-30-desktop-residuals.test.mjs` 两红（M-685b ∥ M-689a）——收正 ∥ 断代二择。

**路由** = 全链（产品码注释/微修面）；**零语义**（注释 ∥ 格式 ∥ 计数 ∥ 测试件/文档残引收正）——禁新机制 ∥ 禁行为改 ∥ 禁扩面。

**授权** = 全链自动授权（代签 ∥ 代点火 ∥ 代派——用户 2026-10-01 令）。

**D5 注意** = 涉档若在途评审冻结（如 `TUI.md` 在 #1 评审面）⇒ 写入遭拒即改期并注明。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成 2026-10-01（七项届盘实读定靶 + fix 轮（评审轮 1 发现 1–5）逐号点修已落（§2.13）；两处待裁判由在册；设计档四笔已落读回；#774 扩面登记 §2.7；产品码+测试件待实施舱）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

（设计轮 · eng-designer · 2026-10-01 · initial——七项逐处**届盘实读**定靶；产品码零触；设计档面四笔本设计轮已落并读回（§2.5）；两处待裁判由 = §2.3；#774 扩面登记 = §2.7。）

【授权与范围】授权 = 批档 §1（台账 #781 ∥ #783 ∥ #753 ∥ #756 ∥ #763 ∥ #774 ∥ #777；用户 2026-10-01 13:0x「A/B/D 先开始处理」+「都开始啊」令 ⇒ 全链自动授权）。**零语义**（注释 ∥ 格式 ∥ 计数 ∥ 测试件 ∥ 文档残引收正）；**禁新机制 ∥ 禁行为改 ∥ 禁扩面**。坐标口径 = **本设计轮逐处届盘实读**（台账 evidence 坐标为起点、行号已漂者以现读为准——清算表 = §2.6）。产品码本设计轮零触（设计档面四笔已落——§2.5）；`API-CONTRACT.md` 生成区 = 父侧重生成（不列实施面）。

### 2.1 本批条目（覆盖 · 三链同源）

| 号 | 条目 | 面 | 承接 |
|---|---|---|---|
| #781 | 桌面宿主面：`turn-driver` 注「三查位 ⇒ 四查位」×2 ∥ `turn-face:161-173` 缩进（#719 遗留） | 码面（desktop） | 实施舱——§2.2-① |
| #783 | VSC webview 注「removes its own card」归属随 D9 陈旧（摘卡归端壳 `question.js`） | 码面（VSC） | 实施舱——§2.2-② |
| #753 | 陈旧注释族「done=settle 时发」收正（CLI ∥ VSC ~7 处 + `TUI.md:341`）∥ `finishSubTasksByRole` dead-export 二择 | 码面（CLI ∥ core）+ 设计档 | 实施舱 + 本设计轮（TUI.md 两处已落）——§2.2-③ ∥ §2.3-A |
| #756 | 别名撤除残留：`batch.mjs:7` 头注 ∥ 库外残留三档 ∥ 行宽 as-of | 码面（core）+ 设计档 | 实施舱 + 本设计轮（TOOLS ∥ UPSTREAM ∥ BATCH-RECORD 三笔已落）——§2.2-④ |
| #763 | 批内件「平 node 直测」跨 `/rc/` 根绝对导入不可跑（theme-switch 腿 6） | 测试件 | 实施舱——§2.2-⑤ ∥ §2.3-B |
| #774 | 盘符大小写 ⇒ ESM 双实例族性排查（扫出新实例 ⇒ 登记扩面如实入 §2） | 排查 + 登记 | 本设计轮已完成全族扫描——登记 = §2.7（本批零修） |
| #777 | `2026-09-30-desktop-residuals.test.mjs` 两红（M-685b ∥ M-689a）——收正 ∥ 断代二择 | 测试件 | 实施舱——§2.2-⑥ |

三链同源 = 本表 ≡ §2.9 验收对照 ≡ 台账七行（本批条目 = tech_todo 行——条目本体即台账行；无需求档条目面）。

### 2.2 逐项设计（靶 ∥ 落点 ∥ 判据 ∥ 禁面）

#### ① #781 桌面宿主面两小件（落点 = 实施舱）

**靶（实读）**：`thincoder-desktop/src/main/turn-driver.mjs:53` 读「三查位同失效（`takeOver` 零重注册 ∕ 步边界缝零取批 ∕ `turn-face.mjs` 回合尾落盘零写）」；同档 `:117` 读「〔中止墓碑三查位同源 —— U-6 ∕ U-7〕」；`docs/desktop/design/PROJECT.md:135` 已升**四查位**（④ = 边界轮 `end` 帧 ∥ 记录零写——`emitDigestEnd` 墓碑查位；M10 派生同拍）。`turn-face.mjs:161-173` = 边界轮 `end` 出站块（注释 161-164 ∥ `endEmitted` 165 ∥ `emitDigestEnd` 166-173）整体 **2 空格缩进**（同级语句 = 4 空格——#719 修复轮 3 遗留、非本轮引入）。

**落点（实施舱）**：
- `turn-driver.mjs:53`：「三查位同失效（`takeOver` 零重注册 ∕ 步边界缝零取批 ∕ `turn-face.mjs` 回合尾落盘零写）」⇒「四查位同失效（`takeOver` 零重注册 ∕ 步边界缝零取批 ∕ `turn-face.mjs` 回合尾落盘零写 ∕ 边界轮 `end` 帧 ∥ 记录零写）」（枚举补第 ④ 项——口径逐字对 `PROJECT.md:135`）。
- 同档 `:117`：「中止墓碑三查位同源」⇒「中止墓碑四查位同源」。
- `turn-face.mjs:161-173`：逐行 **+2 空格**（注释首行 `/**` 与 `*` 缀行、`endEmitted`、`emitDigestEnd` 至收括号——13 行同拍）——纯缩进，零字符内容改。

**判据**：① 源面锁：`thincoder-desktop/src/main/**` 窄域「三查位」零命中 ∥ 两处「四查位」+ 第 ④ 项枚举在位；② 格式锁：该 13 行齐 4 空格（无 2 空格残行）；③ 零行为（注释 ∥ 空白级）。
**禁面**：`PROJECT.md` 零触（:135 已就位）；`PROJECT.md:1273`（U 族机检面描述行仍读「三查位」）**不在本批**——届盘核 = desktop 测试树全清（`thincoder-desktop/test/**` 对 `emitDigestEnd|endEmitted|revoked|epoch` 零命中）、归 #778 族（records-docs-reconcile 在途面）∥ 桌面面下次触碰（登记 = §2.11-U3）。

#### ② #783 VSC webview 注面（落点 = 实施舱）

**靶（实读）**：`thincoder-vscode/webview/streaming.js:124-126` 英文注——「a completed turn answers via questionResponse which removes its own card」。归属已陈旧：作答径摘卡归**端壳**（`webview/question.js:19` `onAnswered: () => { el.remove(); … }` 实读——核零摘除、卡去留归端侧）；extension 主动取消径 = `chat-messages.js:177-186`（`questionCancelled` 精确摘卡）；本行 127 = 中止/错误兜底清扫（现行为真）。

**落点（实施舱）**：该三行注释换文（归属写实；建议文本——「the card is removed by the shell on the answered path (`question.js`)」；末句归属指向端壳即达）。
**判据**：旧串「removes its own card」零命中 ∥ 新锚（`question.js`）在位；零行为（纯注释）。
**禁面**：`question.js` ∥ `chat-messages.js` 零触（现行为真、非本批面）。

#### ③ #753 陈旧注释族「done = settle 时发」收正 + dead-export 二择（落点 = 实施舱 + 本设计轮已落 TUI.md）

**族口径（#746 两态统一后语义真值——改文基准）**：settle 一律发 `⟦ev⟧settled`（`async-settle.mjs:276-279` 单点实读；**done 不再随 settle 发**——`⟦ev⟧done` = 消费面/族发射器补发）；`settled` = 完成（**挂起 ∥ 非挂起两态**）⇒ 驻留面板中间态「done · awaiting digestion」；**冻结 ∥ 归档恒落消费窗**（起跑窗 ∥ reclaim 逐条 ∥ 退出 freezeAll 兜底）。

**族实例（届盘全扫 · 收正表——CLI 6 处 ∥ core 1 处；VSC 实扫零命中，见下）**：

| # | file:line | 现文（旧断言） | 改向（语义锚） |
|---|---|---|---|
| 1 | `thincoder-cli/src/tui/subagent-blocks.mjs:37-39` | 「done = async 完成即冻结（settle 时发）；settled = 挂起期完成——冻结延迟至 digest 消化完成…或池空退出兜底补发」 | done = 消费面补发（#746：settle 一律发 settled）⇒ 收即冻结；settled = 完成（两态）——冻结延迟至消费窗（回收 ∥ 兜底） |
| 2 | `thincoder-cli/src/tui/subagent-blocks.mjs:204-206` | 「done…= 完成即冻结（settle 时发）；settled…= 挂起期完成——驻留面板中间态…池空补发冻结」 | 同 1（两态 ∥ 消费窗） |
| 3 | `thincoder-cli/src/tui/tool-display.mjs:115-118` | 「it freezes via the ⟦ev⟧done event at settle — §6.7.3 D-A3」（英文） | 块保 live——settle 发 `⟦ev⟧settled`；冻结落消费窗（#746 · ASYNC-POOL §6.8） |
| 4 | `thincoder-cli/src/tui/tool-events.mjs:206-208` | 「The block freezes on the ⟦ev⟧done settle event.」（英文） | 同 3 |
| 5 | `thincoder-cli/src/tui/tool-events.mjs:239-242` | 「the block freezes on the ⟦ev⟧done/stopped settle event at flight end」（英文） | settle ⇒ settled 驻留；冻结落消费窗；cancel 径 `⟦ev⟧stopped` 即冻（照旧） |
| 6 | `thincoder-cli/src/tui/agent-turn.mjs:298-301` | 「不冻结——各 settle 事件自行处理」∥「正常态块已在 settle 时各自冻结」 | 不冻结——冻结落消费窗（起跑窗 ∥ reclaim ∥ 退出兜底）；正常态块已在消费窗各自冻结 |
| 7 | `thincoder-core/agent/run-stages.mjs:246-249` | 「The ⟦ev⟧done freeze is NOT emitted here — each settle callback emits it」（英文） | settle 回调只发 `⟦ev⟧settled`；`⟦ev⟧done` 冻结落消费窗（#746 · §6.8） |
| 8-9 | `docs/cli/design/TUI.md:199 ∥ :341` | 「完成后立即冻结进会话流」∥「挂起期**已结算待消化中间态**」 | **本设计轮已落**（§2.5）：async 族结算后驻留、冻结落消费窗 ∥ 两态统一（#746） |

**出族判读（届盘实读——零改）**：`subagent-blocks.mjs:247-249`（`_freezeAt` = settle 刻流位置——锚点定义未变，仍准）· `:40`（stopped = cancel——立即冻结：仍真）· `suspension-drive.mjs:123` ∥ `tool-events.mjs:257-263` ∥ `core agent-tools/consult.mjs:22/:248-250`（consult 子块「settle 时发 done/已冻结」——**现状为真**；consult 发射器 = #748 本体（该批暂缓、评审已放行）——归其触碰面）· VSC 面：**实扫零命中**（`thincoder-vscode/**`（src+webview）done/settle 时点类陈旧句全扫——现注已载两态（`webview/streaming.js:150-156`「settled → awaitingDigest 驻留、回收才归档」）；#746 上抛①「VSC 对位注释同族」按现盘 = 无活面实例）。

**dead-export 二择 = 删**（判由 = §2.3-A）：逐点 = `subagent-freeze.mjs:193-208`（doc 注释 + `finishSubTasksByRole` 函数体全删）∥ `subagent-blocks.mjs:33`（import 列）∥ `:34`（re-export 列）∥ `:55-56`（注释「F-2 后角色匹配完成面 = finishSubTasksByRole」⇒「⏹ 门控/渲染角色判据」）∥ `tool-events.mjs:25`（import 列——未使用导入一并退场）。

**判据**：① 负向锁：七处旧串逐处零命中（`完成即冻结` ∥ `settle 时发`（CLI src 窄域）∥ EN 三串 ∥ `正常态块已在 settle 时各自冻结`）∥ `finishSubTasksByRole` 全仓（`thincoder-cli/src` ∥ `thincoder-core` ∥ `thincoder-vscode/src`）零命中；② 正向锚：七处新串在位（消费面补发 ∥ 两态 ∥ 消费窗）；③ 实跑：`node --check` 语法面 + 载入烟测（`thincoder-cli` 为 cwd 直载 `src/tui/subagent-blocks.mjs` ∥ `src/tui/subagent-freeze.mjs` ⇒ exit 0）；④ 零行为（注释 ∥ 死码——零调用点实证在 §2.3-A）。
**禁面**：consult 族三处 ∥ 出族判读四处零触；`configureBatchSegment` ∥ `resetBatchSegment`（#84 注入缝契约名）零触。

#### ④ #756 别名撤除收尾残留（落点 = 实施舱 + 本设计轮三笔已落）

**四件逐点**：
- ① `thincoder-core/agent-tools/batch.mjs:7` 头注：「用例 BR-1–26」⇒「**用例 §4.8**」（D2「去范围数字」形——alias 批设计半项未执行之补；BR 编号不重编——BR-27–38 留原号）。
- ② 同档档位：**313 行**（>300 顾问线）——**保留裁决**（免拆依据：本批改动 = 单行头注；零职责新增；距 500 硬限余量 187；拆分预案维持 #12 舱遗留在册——若用户裁拆另批）。
- ③ 库外残留三档：`docs/core/design/TOOLS.md:245` ∥ `AGENT-LOOP-UPSTREAM.md:31` —— **本设计轮已落**（§2.5）；`docs/core/design/API-CONTRACT.md` —— **届盘实读零命中**（`batch_segment` ∥ `batchSegmentTool` 全档 = 0——原「生成面 2」残留（旧记 `:532/:549`）已随重生成清面）⇒ **零动作**；随后续重生成随行面 = `finishSubTasksByRole` 两行退场（现读 `:306` ∥ `:337`——父侧）。
- ④ 行宽 as-of 刷新：届盘实读 `BATCH-RECORD.md` 非表行 >300 = **`:431` 一处（371 字）**（旧记 `:429` 系 as-of 漂移——`:429` 现读 299 闸内）；处置 = **折行**（本设计轮已落：`:431-432` 两行 = 190 + 183 字；纯折行零语义——仅插换行 + 续行 2 空格缩进，余字符逐字零改）；折后复扫（两谓词 `^[^|].{300,}` ∥ 长度>300 ∧ 非表行）= **0**。

**判据**：batch.mjs 头注新形在位 ∥ 旧串「BR-1–26」零命中；TOOLS.md ∥ UPSTREAM.md「batch_segment」零命中（活面；**豁免 = `batch.mjs` 错误串前缀 `batch_segment:` = 核锚明裁保留——不扫杀**）；BATCH-RECORD.md 折后非表行 >300 = 0（复扫读数在册）。
**禁面**：**`batch.mjs` 错误串前缀 `batch_segment:` = 核锚**（BATCH-RECORD §4.1 全表锚断言——明裁保留，**不得扫杀**）；`BATCH-RECORD.md:52`（明裁保留沿革注）∥ ALS §6.28 沿革叙述 ∥ 各档变更记录行 ∥ `AGENT-LOOP.md:438/:566`（「batch_segment 记账缝」指称——#756 射程外，登记 §2.11-U7）零触；全局 262 行 >300（#779）零触。

#### ⑤ #763 批内件「平 node 直测」跨 `/rc/` 不可跑（落点 = 实施舱）

**修前基线（本设计轮亲跑 · 2026-10-01 · 仓根 `thincoder/`）**：`node --test docs/batches/2026-09-30-theme-switch.test.mjs`（无钩）⇒ **exit 1**：`ERR_MODULE_NOT_FOUND: Cannot find module 'd:\rc\lib.mjs' imported from …renderer\views\chat-tool.mjs`；加钩（`--import ./thincoder-desktop/test/rc-resolve.mjs`）⇒ **exit 0**（六腿全绿）。链实读 = `views/settings.mjs:23 → views/chat-tool.mjs:22-25 → /rc/*`。

**裁定 = 测试环境支持**（判由 = §2.3-B）：件内静态预载 `import "../../thincoder-desktop/test/rc-resolve.mjs"`（沿 30+ 件先例——`rc-resolve.mjs` 为只读解析钩、registerHooks 归一）⇒ 平跑不带 `--import` 即可；头注跑法（`:18-20`）改平命令形（「件内静态预载解析钩」）。
**判据**：① 源面锁：件内钩 import 在位 ∥ 头注平命令形在位；② 实跑：`node --test docs/batches/2026-09-30-theme-switch.test.mjs`（**无 --import**）⇒ exit 0 ∧ `# pass 6`；③ 负控 = 修前红基线在册（上段读数——灵敏度先证）。
**禁面**：产品码零触（`chat-tool.mjs` ∥ 渲染链 ∥ `rc-resolve.mjs` 本体）；其余批内件零触。

#### ⑥ #777 `desktop-residuals.test.mjs` 两红（落点 = 实施舱）

**修前基线（本设计轮亲跑）**：`node --test docs/batches/2026-09-30-desktop-residuals.test.mjs` ⇒ **exit 1**；两红断言 = `白名单 45 项（单源 = 预载档）`（M-685b `:362`）∥ `尾组 = 四名（压缩行除外）`（M-689a `:466`）——与台账及 #769 附读逐条同签。

**收正（逐点）**：M-685b——`45 ⇒ 46` **五处逐清**（`:12` 头注 ∥ `:361` 用例名 ∥ `:362` 断言（唯一数值字面）∥ `:366` ∥ `:367` 断言消息）；基准 = 单源 `preload.cjs`（头注「四十六项」+ `CHANNELS` 数组 46 字面 + 末位 `record:append` 实读）。M-689a——chat 断言 `chat.includes("四尾组（压缩行除外）")` ⇒ 现盘字面组合「`四尾组` ∧ `压缩行例外 = 流元素冻结点`」（意图零变：零「五尾组」残留 ∥ 尾组四名 + 压缩行例外句在档）；chrome 断言（`:467`）届盘已命中 = 零改。
**判据**：① 源面锁：新字面在位 ∥ 旧字面零残留（五处：`:12` ∥ `:361` ∥ `:362` ∥ `:366` ∥ `:367`）；② 实跑：整件复跑 ⇒ exit 0 ∧ `# pass 15`（修前 13/15 基线在册）；③ 若复跑现**新红** ⇒ 停止扩面、回 §2.11 上抛（不得顺手扩修）。
**判由（收正 vs 断代）**：两红 = 期望值滞后于合法演进的源面（#699 族后留档批增 `record:append` ⇒ 46；#765/#768 链改写 chat 尾组句），非件本体失效；该件在役（复跑批面）——收正成本 = 4 行级 + 一跑，断代 = 15 腿弃用 ⇒ **收正**。
**禁面**：`preload.cjs` 零触（其为单源·读数 46 为真）；本件其余腿零触。

### 2.3 两处待裁（判由）

**A. `finishSubTasksByRole` dead-export——裁定 = 删**：
- 实证：**零调用点**（全仓 `thincoder-cli/src` ∥ `thincoder-core` ∥ `thincoder-vscode` ∥ `test/**` ∥ `docs/batches/*.test.mjs` 扫描——仅三处转口：`subagent-blocks.mjs:33` import ∥ `:34` re-export ∥ `tool-events.mjs:25` import（**未使用**））。
- 其注释自述用途已不成立（「consult N 并行 children 的会话级 settle ∥ 唯一按角色完成面」——F-2 收窄后 `finishSubTaskKey` 为唯一完成路径、consult 子块自结算）；保留+注 = 死钩留存（读者复开死项之弊）+ 注释须虚构「兼容面」主体（无消费者）。
- 对照先例：`finishSubTask` 之保留 ≠ 同类——它仍有活调用点（`tool-events.mjs:227/:253`——no-op 语义面）；本函数为零调用。
- 随动：API-CONTRACT 两行随父侧重生成退场（不列实施面）；文档面零涉（无设计档断言该导出）。
- 兜底：若评审/用户判「保留+注」——改为加注「零调用点（#753 实测）——保留为兼容面；退役窗口 = 下次触碰」，落点同表。

**B. `/rc/` 不可跑三择——裁定 = 测试环境支持**：
- (a) **采纳**：钩件已在位且广泛使用（`thincoder-desktop/test/rc-resolve.mjs`——只读、单源解析、30+ 件静态预载先例）；修前/修后亲跑双读数定音（§2.2-⑤）。
- (b) 迁真机探针——**否决**：失平 node 直测回归面（六腿中五腿本可平测）+ 成本重（CDP 编排），与批内件「随批留存、可复跑」目的相抵。
- (c) 产品码链改相对导入——**否决**：`/rc/` 二根 = 产品加载形（`RENDER-CORE.md` §1.3 ∥ SHELL「node-safe 子集」纪律）；产品链改 = 产品码结构改动，越「禁新机制 ∥ 禁行为改」且动应用面。

### 2.4 受影响文件表（现读 = 本设计轮实读 · 内容行口径 ∥ 预期 δ）

| 文件 | 现读 | 预期 δ | 内容 ∕ 档位 |
|---|---|---|---|
| `thincoder-desktop/src/main/turn-driver.mjs` | 236 | 236 | #781 两行注释换文 |
| `thincoder-desktop/src/main/turn-face.mjs` | 194 | 194 | #781 13 行 +2 缩进 |
| `thincoder-vscode/webview/streaming.js` | 183 | 183 | #783 注释三行换文 |
| `thincoder-cli/src/tui/subagent-freeze.mjs` | 265 | ≈249（−16） | #753 删 def+注释（落点 `:193-208`——净 −16） |
| `thincoder-cli/src/tui/subagent-blocks.mjs` | 462 | ≈461 | #753 转口两列 + 注释收正（462 >300——本批净 −1、无职责新增；距 500 余量 38；拆分登记 = `docs/cli/design/CLI-DEBT.md` §2.1 A9 行） |
| `thincoder-cli/src/tui/tool-events.mjs` | 454 | 454 | #753 注释两处 + import 列（454 >300——存量·本批行内级；距 500 余量 46；拆分登记 = `docs/cli/design/CLI-DEBT.md` §2.1 A10 行） |
| `thincoder-cli/src/tui/tool-display.mjs` | 157 | 157 | #753 注释一处 |
| `thincoder-cli/src/tui/agent-turn.mjs` | 422 | 422 | #753 注释一处（422 >300——存量·行内级；距 500 余量 78；拆分登记 = `docs/cli/design/CLI-DEBT.md` §2.1 A16 行） |
| `thincoder-core/agent/run-stages.mjs` | 271 | 271 | #753 注释一处（core 侧追补实例） |
| `thincoder-core/agent-tools/batch.mjs` | 313 | 313 | #756 头注单行（>300——保留裁决见 §2.2-④②） |
| `docs/batches/2026-09-30-theme-switch.test.mjs` | 266 | ≈267 | #763 钩 import + 头注跑法 |
| `docs/batches/2026-09-30-desktop-residuals.test.mjs` | 468 | 468（±1） | #777 四处收正 |
| `docs/batches/2026-10-01-zero-semantic-sweep.test.mjs` | — | ≈160 新 | 批内件（§2.8） |
| `docs/core/design/TOOLS.md` | 1227 | 1227 | #756③——**已落** |
| `docs/core/design/AGENT-LOOP-UPSTREAM.md` | 1020 | 1020 | #756③——**已落** |
| `docs/cli/design/TUI.md` | 901 | 901 | #753 族句两处——**已落** |
| `docs/core/design/BATCH-RECORD.md` | 488 ⇒ 489 | +1 | #756④ 折行——**已落** |
| `docs/core/design/API-CONTRACT.md` | 2776 | 父侧重生成 | `finishSubTasksByRole` 两行退场（不列实施面） |

### 2.5 设计档落点（本设计轮已落 · D6 读回在册）

- `docs/core/design/TOOLS.md:245`：「`batch_segment` 批次档段写入」⇒「`batch` 批次档生命周期（action = create ∕ append ∕ status ∕ close …）」——读回 ✓。
- `docs/core/design/AGENT-LOOP-UPSTREAM.md:31`：两处名面 ⇒ `batch`——读回 ✓。
- `docs/cli/design/TUI.md:199`：「完成后立即冻结进会话流」⇒「完成后冻结进会话流（async 族 ⇒ 结算后驻留「done · awaiting digestion」、冻结落消费窗…）」；`:341`：「挂起期**已结算待消化中间态**」⇒「**已结算待消化中间态**（settle 一律 `⟦ev⟧settled`——挂起 ∥ 非挂起两态统一 · #746）」——读回 ✓。
- `docs/core/design/BATCH-RECORD.md:431-432`：折行（371 ⇒ 190+183；逐字零改）——读回 ✓ ∥ 折后复扫 = 0。
- **四处均不另立变更记录行**（零语义矫误；沿革 = 本 §2 + 提交——沿 defect-fixes 先例「矫误不另立变更记录行」）；API-CONTRACT 零落笔（父侧）。

### 2.6 坐标漂移清算（台账 ∕ 旧记 → 现读）

| 项 | 旧记 | 现读 | 判 |
|---|---|---|---|
| #753 dead-export 定义行 | `subagent-freeze.mjs:187` | **`:195`** | 漂移 +8（届盘行号为准） |
| #756 API-CONTRACT 面 | `:532/:549` | **全档零命中**（现 `finishSubTasksByRole` 行 = `:306` ∥ `:337`） | 重生成已清面——残留自动消 |
| #756 行宽 | `BATCH-RECORD.md:429` | **`:431`（371 字）**；`:429` = 299 闸内 | as-of 漂移 +2——已按现盘处理 |
| #781 ×2 ∥ #783 ∥ #763 ∥ #777 ∥ #753 族主体 | 台账坐标 | **逐条届盘命中**（注释块 124-126 ∥ :53/:117 ∥ 腿 6 ∥ M-685b/:362 ∥ M-689a/:466） | 无漂移 |
| `batch.mjs` 行数 | 313 | 313（内容行口径） | 一致 |

### 2.7 #774 登记（扩面 · 如实——本批零修）

**扫描**（本设计轮 · 只读族扫 · `docs/batches/*.test.mjs` 108/108 + 四包测试树）：类 a = 跨路 `instanceof`；b = 跨路恒等断言（恒假）；c = seam 分裂（缝设直路实例、消费者 junction 实例）。

**甲 · 新实例 18 行（跨 13 档——真风险；`d:` 小写直路运行下成立）**：
- `2026-09-29-parity-b4-vsc-small.test.mjs` `:29`（b）∥ `:148/:162/:195/:202`（c）
- `2026-09-29-parity-b1-vsc-core.test.mjs` `:725`（b）∥ `:807/:823`（a）∥ `:209`（c）
- `2026-09-30-vsc-paste-cleanup.test.mjs` `:25-26`（b）
- `2026-09-29-missing-face-family.test.mjs` `:21/:242`（a）∥ `:22-26/:47-48`（c）
- `2026-09-29-desktop-residuals-round3.test.mjs` `:430/:619`（a）∥ `:428-429/:438-439/:617-618/:627-628`（c）
- `2026-09-29-model-menu-parity.test.mjs` `:29-30/:58-59`（c）
- `2026-09-29-vsc-carryover-settings.test.mjs` `:321/:326`（c）
- `2026-09-30-vsc-residuals.test.mjs` `:84/:112`（c）
- `2026-09-29-hatch-clearance-2.test.mjs` `:138/:165` ∥ `:161/:163`（c）
- `2026-09-30-crossline-clearance-vsc.test.mjs` `:279/:288`（c）
- `2026-09-28-desktop-session-title.test.mjs` `:20/:39`（c）
- `2026-09-29-desktop-susp-queue.test.mjs` `:208`（c）
- `2026-09-29-desktop-window-queue-parity.test.mjs` `:238`（c）
（已登记行不重复：`2026-09-30-digest-persistence.test.mjs:267`（c）= #750 在途。）

**乙 · 形似待复核 2**：`2026-09-29-parity-b8-ipc.test.mjs:61-63` ∥ `2026-09-29-desktop-carryover-c2.test.mjs:156-159`（依赖未证）。

**出入（如实）**：① c2「已修」出入——父侧口径「c3/c2 实例已修」，盘面可见 c2 最近改动 = audit 批 M4 锁点（DOM 引用面），**未见 ESM 修正点**——请父侧指认坐标或按未修登记；② `2026-09-29-desktop-susp-queue.md:422` 复核句「junction ⇒ 同实例」与 #774 机制**相抵**（该档已收口 = 记录面零回改；其 W5 问答前提失效——本节登记即复锚）。

**机制读数（本设计轮亲跑）**：`node scripts/dev-link.mjs --check` = **exit 0 · 5 链全「规范」**（junction 目标 = `D:\…` 规范形——#577 批已收敛）⇒ 实例为**潜伏面**（`d:` 小写直路运行触发）。
**修法形**（三先例 = c3:54 ∥ audit:816 ∥ cross-end:43）：seam ∕ 类 ∥ 恒等断言一律经**消费者同源 realpath** 取件（`<pkg>/node_modules/@thincoder/core/…` ∥ 产品 re-export ∥ 701 式 hook 归一）。
**处置**：登记扩面 · 本批零修（禁扩面）——建议立「批内件挂载面归一」轻批（或随测试体系重建轮——与 U4 同向）＝上抛 U1。

### 2.8 批内件设计（腿清单——源面锁 ∥ 负向锁 ∥ 实跑）

**新档** `docs/batches/2026-10-01-zero-semantic-sweep.test.mjs`（随批留存、不进仓套件；平 node 直测 = `node --test docs/batches/2026-10-01-zero-semantic-sweep.test.mjs`（仓根 `thincoder/`）；本档自身零 `/rc/` 依赖）：

| 腿 | 类型 | 内容 | 期望 |
|---|---|---|---|
| L1 | 源面锁（#781） | turn-driver.mjs 含「四查位」×2 + 第④项枚举；turn-face.mjs 锚行齐 4 空格 | 全真 |
| L2 | 负向锁（#781） | `thincoder-desktop/src/main/**` 窄域「三查位」= 0 | 零命中 |
| L3 | 源/负向锁（#783） | streaming.js 含 `question.js` ∥ 不含 `removes its own card` | 全真 |
| L4 | 负向/正向锁（#753 族） | 七处旧串（含 EN 三串）逐串零命中 ∥ 新锚（消费面补发 ∥ 两态 ∥ 消费窗）在位 ∥ `finishSubTasksByRole` 零命中（扫描域 = cli/src ∥ core ∥ vscode/src） | 全真 |
| L5 | 实跑（#753 烟测） | `thincoder-cli` cwd：`node --input-type=module -e "await import('./src/tui/subagent-blocks.mjs'); await import('./src/tui/subagent-freeze.mjs')"` | exit 0 |
| L6 | 源面锁（#756） | batch.mjs 含「用例 §4.8」∥ 不含「BR-1–26」；TOOLS.md ∥ UPSTREAM.md 不含 `batch_segment`；BATCH-RECORD.md 非表行 >300 = 0（两谓词复跑） | 全真 |
| L7 | 实跑（#763） | spawnSync `node --test docs/batches/2026-09-30-theme-switch.test.mjs`（无 `--import`） | exit 0 ∧ `# pass 6` |
| L8 | 实跑（#777） | spawnSync `node --test docs/batches/2026-09-30-desktop-residuals.test.mjs` | exit 0 ∧ `# pass 15` |
| L9 | 负控（防空扫假绿） | 已知正例在位断言（如 `async-settle.mjs` 含「消费面补发」——扫描谓词灵敏度先证） | 全真 |

批内件写 = 实施舱（随写随跑）；**锁串写前逐串届盘复核**（他舱并行改动时以现盘为准）。

**实施舱任务面（文件清单 ∥ 逐处落点 = §2.2）**：12 档产品码/测试件（§2.4 上表除「已落」与批内件外全部）+ 批内件新档；顺序建议 = 产品码十档 → 测试件两档 → 批内件 → L1–L9 全跑 → §5 记录。

### 2.9 验收对照（逐项 = 三链同源）

| 号 | 判据（机检） | 腿 |
|---|---|---|
| #781 | 四查位 ×2 + 第④项在位 ∥ 三查位零残留 ∥ 缩进齐位 | L1 ∥ L2 |
| #783 | 旧串零残留 ∥ 新锚在位 | L3 |
| #753 | 七处逐处收正 ∥ dead-export 三档零残留 ∥ 载入烟测 | L4 ∥ L5 |
| #756 | batch.mjs 头注新形 ∥ 两档名面零残留 ∥ BATCH-RECORD 行宽 0 ∥ API-CONTRACT 零命中（已消） | L6 |
| #763 | 平跑 6/6（修前红基线在册——灵敏度先证） | L7 |
| #774 | 登记完成（§2.7 全表）；零代码面——父侧复核 = `dev-link --check`（已亲跑 exit 0） | §2.7 |
| #777 | 整件 15/15（修前 13/15 基线在册） | L8 |

### 2.10 关键决策记录

- **D1（#753-A）**：dead-export = **删**（判由 §2.3-A；备选「保留+注」否决——无消费者主体）。
- **D2（#763-B）**：`/rc/` = **测试环境支持**（rc-resolve 件内静态预载——修前/修后双读数定音；备选迁真机 ∥ 产品链改均否决）。
- **D3（#777）**：两红 = **收正**（期望滞后 ≠ 件失效；断代 = 15 腿弃用，否决）。
- **D4（#756-②）**：`batch.mjs` 313 行 = **保留**（免拆依据在 §2.2-④；拆分预案维持 #12）。
- **D5（#756-④）**：行宽 = **折行收窄**（纯格式零语义；全局 262 行归 #779 零触）。
- **D6**：设计档四处收正**不另立变更记录行**（零语义矫误；沿革 = §2 + 提交——如需补行请於 fix 轮裁）。

### 2.11 上抛与登记

- **U1（#774 扩面——如实）**：§2.7 全表（18 新实例 + 2 待核 + 2 出入）——请父侧裁处置（建议：立「批内件挂载面归一」轻批 ∥ 随测试体系重建轮）。
- **U2（台账坐标收正——父侧笔）**：#753 evidence `:187 ⇒ :195`；#756 两处（API-CONTRACT 原「生成面 2」= **已消**（实读零命中）；行宽 `:429 ⇒ :431`（已在 §2.2-④ 按现盘处理））。
- **U3**：`docs/desktop/design/PROJECT.md:1273`「中止墓碑三查位」（U 族机检面描述行）+ desktop 测试树全清残引 = **#778 族**（records-docs-reconcile 在途 ∥ 桌面面下次触碰）。
- **U4**：全局行宽 262 行（#779）本批零触；`docs/batches/2026-09-29-alias-removal-unblock.md` 自身 >300 非表行 5 处（记录面·冻结）不触。
- **U5**：consult 族三处（`suspension-drive.mjs:123` ∥ `tool-events.mjs:257-263` ∥ `agent-tools/consult.mjs:22/:248-250`）归 **#748**（暂缓）——如重启，其设计已规定 done 补发语义 ⇒ 届时随动。
- **U6**：`AGENT-LOOP.md:438/:566`「batch_segment 记账缝」指称（#756 射程外——活面措辞；契约名 `configureBatchSegment` 保留）——随下次触碰收正。

### 2.12 边界（不做）∥ D5 ∥ 自检

- **不做**：产品行为零改（全注释/缩进/死码）；prompt 面零触；`API-CONTRACT.md` 零直写（父侧重生成）；批档与历史记录零回改；#774 零修（登记）；#748 族归其批；他人段零触；consult 族 ∥ 出族判读面零触。
- **D5**：核 = **无在途评审以 `docs/cli/design/TUI.md` 为对象**（实读：consult-family = 暂缓（§3 已放行）∥ records-docs-reconcile = 桌面/VSC 面——其冻结窗 = PROJECT.md ∥ UI.md）⇒ 本设计轮落笔成功；若父侧另知冻结面 ⇒ 以父侧为准（本节披露）。
- **自检**：① 七项全覆盖（§2.1 表 × §2.2 逐处落点 × §2.9 判据）；② 受影响文件表现读 = 本届盘实读（内容行口径；BATCH-RECORD 折后复扫 = 0 在册）；③ 批内件腿清单（源面锁 ∥ 负向锁 ∥ 实跑——L1–L9）；④ 实施舱任务面（§2.8——12 档 + 批内件，逐处 = §2.2）；⑤ 两处待裁判由（§2.3-A/B）；⑥ 设计档读回（§2.5——四处已落）；⑦ 机检确认：`dev-link --check` = exit 0 ∥ theme-switch 修前红（`d:\rc\lib.mjs`）∥ residuals 修前 13/15（两红同签）——三项亲跑读数均入册。

**自检补记（2026-10-01 · 本设计轮收笔后读回核出）**：§2.2-④ 禁面行末交叉引用 = **§2.11-U6**（`AGENT-LOOP.md:438/:566` 指称条）——上文「§2.11-U7」系编号误植（本批上抛无 U7 条）。其余交叉引用逐条读回核讫（U1–U6 各自命中）；§2 三笔 append + 状态行已 D6 读回。

### 2.13 修复轮（评审轮 1 · 发现 1–5 逐号点修 · eng-designer · 2026-10-01）

**轮性质** = fix（逐号点修——只修五处；未重开探索 ∥ 未扩面 ∥ 零新语义）；**授权** = 本档 §3 轮次 1（**pass**：🔴0 ∥ 🟡3 ∥ 🔵2；父侧裁 = 五号全采纳——Suggestion 列 = 处置建议，处置执行 = 本席）；**落笔方式** = §2 就地修正（本作者段内——修正点直接落 §2 对应行）+ 本块逐号留痕。产品码 ∥ 本档 §1 ∥ §3 ∥ §5 ∥ §6 ∥ 四档已落档（TOOLS ∥ AGENT-LOOP-UPSTREAM ∥ TUI ∥ BATCH-RECORD）∥ `CLI-DEBT.md` 零触；不 re-run 评审。

**逐号点修（号 → 改动 · file:line = 落地后 read-back 实读）**：

| # | 级 | 处置（旧 ⇒ 新 · 落点） |
|---|---|---|
| 1 | 🟡 | §2.4 `subagent-freeze.mjs` 行（`:145`）：现读 `256 ⇒ **265**`（届盘重取——读面内容止 265 ∥ 读工具总行 266；内容行口径 = 265）；δ 维持 `−16`（`≈240 ⇒ **≈249**`）；行注补落点形（`:193-208`——净 −16）。 |
| 2 | 🟡 | §2.2-⑥ M-685b（`:119`）：清单补 `:361`（用例名）∥ `:367`（断言消息）⇒ **五处逐清**（`:12` 头注 ∥ `:361` ∥ `:362` 断言（唯一数值字面）∥ `:366` ∥ `:367`）；判据①（`:120`）「旧字面零星 ⇒ **零残留（五处）**」。 |
| 3 | 🟡 | §2.4 三 >300 行补拆分登记指针 + 距 500 余量：`subagent-blocks.mjs`（`:146`——`docs/cli/design/CLI-DEBT.md` §2.1 A9 行；余量 38）∥ `tool-events.mjs`（`:147`——A10 行；余量 46）∥ `agent-turn.mjs`（`:149`——A16 行；余量 78）；三行均在册（已实读）。 |
| 4 | 🔵 | 「11 档 ⇒ **12 档**」两处：§2.8（`:225`——实施舱任务面）∥ §2.12 自检④（`:261`）；届盘清点 = 产品码十档（turn-driver ∥ turn-face ∥ streaming.js ∥ subagent-freeze ∥ subagent-blocks ∥ tool-events ∥ tool-display ∥ agent-turn ∥ run-stages ∥ batch.mjs）+ 测试件两档（theme-switch ∥ desktop-residuals 件）= 12。**连带收正（披露）**：§2.8 同句「产品码七档」届盘不成立（7 + 2 = 9 ≠ 12）⇒「产品码十档」（一致性面随号收正；如父侧认为越出枚举面，可单点回退）。 |
| 5 | 🔵 | L4 措辞（`:216`）：消「豁免豁免」重复；`batch_segment:` 前缀豁免条**移回名面负向锁**（§2.2-④ 判据 `:104`——括注「核锚明裁保留——不扫杀」）；§2.2-③ 判据①（`:93`）同款误挂括注同轮摘除。收正后 L4 = 七处旧串（含 EN 三串）逐串零命中 ∥ 新锚在位 ∥ `finishSubTasksByRole` 零命中（扫描域 = cli/src ∥ core ∥ vscode/src）。 |

**读回（D6）**：`:93` ∥ `:104` ∥ `:119-120` ∥ `:145-149` ∥ `:216` ∥ `:225` ∥ `:261` 逐处 read-back 核讫 ✓；本轮以外零动。

**披露（只报）**：① `CLI-DEBT.md` 三行读数——A9 ∥ A10 与现读一致（462 ∥ 454）；**A16 = 418（as-of 09-29）≠ 本批现读 422**——行维护①（触碰批刷新）未随本轮落（父侧口径 = CLI-DEBT 零触）⇒ 请父侧裁（如需刷新，一行即落）。② 未及项 = 无（五号全落）；③ 行宽观察：批档非表行 >300 现 9 处（`:34` ∥ `:54` ∥ `:66` ∥ `:89` ∥ `:93` ∥ `:109` ∥ `:119` ∥ `:261` ∥ `:299`）——`:119` 系五处逐清补全所致（302 ⇒ 322，原即 >300）；批档行宽归 #779 全局口径（§2.11-U4），本轮未折。

**残留** = 0（五号全落；本轮零新语义）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**设计评审（首轮 · 零语义清账批 #781∥#783∥#753∥#756∥#763∥#774∥#777）——发现表**

| # | 类别 | 级别 | 发现 | 建议 |
|---|---|---|---|---|
| 1 | 受影响文件行注（判据 8） | 🟡 | `thincoder-cli/src/tui/subagent-freeze.mjs` 现读标 **256** 与现盘不符——现盘 ≈**265** 行（读面内容止 265 ∥ 读工具总行 266；`export function finishSubTasksByRole` 经独立 grep 实核 = `:195`，与设计 `:195` 一致 ⇒ 坐标新、计数旧——README 口径差：其余 11 档抽检落 ≤±1）。δ −16 与落点 `:193-208` 实核一致、不受影响（收正后 ≈249）。 | 行计数按现盘重取（≈264/265）并同步「现读」格；δ 格维持 −16（落点不变）。 |
| 2 | 验收/完整性（#777） | 🟡 | M-685b 收正清单覆盖不齐：旧字面「45 项」现盘共 **5 处**（`:12` 头注 ∥ `:361` 用例名 ∥ `:362` 断言 ∥ `:366` 消息 ∥ `:367` 消息——唯一数值字面 = `:362`，余四处为标题/消息串）；设计清单只列 3 处（`:362` ∥ `:366` ∥ 头注 `:11-12`）。判据①「旧字面**零星**」表述含混（负向锁应为「零残留」或写明豁免域）。 | 清单补 `:361` / `:367`（或明裁字符串面豁免并写明）；判据①改「零残留」或列明豁免域。 |
| 3 | 文件档位/拆分计划（判据 8） | 🟡 | 三个 >300 源档行止于「存量——本批行内级」，未携拆分计划/登记指针：`subagent-blocks.mjs`（**462**——距 500 硬限余量 **38**）∥ `tool-events.mjs`（454）∥ `agent-turn.mjs`（422）；对照 `batch.mjs` 行有保留裁决 + 依据 + 「拆分预案维持 #12 舱遗留在册」，TUI.md §6.8.3.4 先例 = 档位登记指针住 `docs/cli/design/CLI-DEBT.md` §2.1。 | 逐行补登记指针（CLI-DEBT 对应行）或一句拆分复核结论（含距 500 余量）——余量最小者宜显式。 |
| 4 | 清晰 | 🔵 | §2.8 ∥ §2.12「**11 档**产品码/测试件」与 §2.4 表可改行不符——可改 = **12 档**（turn-driver ∥ turn-face ∥ streaming.js ∥ subagent-freeze ∥ subagent-blocks ∥ tool-events ∥ tool-display ∥ agent-turn ∥ run-stages ∥ batch.mjs ∥ theme-switch 件 ∥ desktop-residuals 件）。 | 计数收正为 12（或按文件名清单显式列名，免再数）。 |
| 5 | 清晰 | 🔵 | L4 判据串「**豁免豁免**：不扫 `batch_segment:` 前缀串」重复且错挂——该前缀属 #756/④ 名面（`batch.mjs` 错误串），与 #753 腿（七旧串 + `finishSubTasksByRole` 零命中）无涉；§2.2-③ 判据① 同款括注挂在 `finishSubTasksByRole` 零命中锁后。 | 豁免条移回其生效的名面负向锁并消重复词。 |

**复核实读（本席亲跑/亲读 · 逐条对设计断言）**：TOOLS.md:245 ∥ AGENT-LOOP-UPSTREAM.md:31 ∥ TUI.md:199/:341 落笔态与 §2.5 声明一致；BATCH-RECORD.md 非表行 >300 = **0**（`^[^|].{299,}` 复扫无命中）∥ `:431-432` 折行在位（371 ⇒ 190+183=373=371+2 续行缩进，逐字口径自洽）；API-CONTRACT.md `batch_segment|batchSegment` = **0**；`finishSubTasksByRole` 全仓零调用点（唯三转口 = subagent-blocks.mjs `:33`/`:34` ∥ tool-events.mjs `:25` + API-CONTRACT.md `:306`/`:337` + 记录面/存档面——删面安全）；preload.cjs = **46**（末位 `record:append`）∥ CHANNELS 逐行计数 46；chat.mjs 现读「四尾组」∧「压缩行例外 = 流元素冻结点」（`:31`）∥ chat-chrome.mjs `:171` 全句在位（`:467` 零改成立）；rc-resolve 件内静态预载先例 **30+** 件（含 `../../thincoder-desktop/test/rc-resolve.mjs` 同形）；question.js:19 `onAnswered: () => { el.remove(); … }` 实读；async-settle.mjs `:276-279`「settle 一律 `⟦ev⟧settled` ∥ `⟦ev⟧done` = 消费面补发」——#753 族口径真值成立 ∥ L9 正例（「消费面补发」在位）成立；thincoder-desktop 全域「三查位」仅 `:53`/`:117` 两处（L2 零命中可达）；PROJECT.md:135「四查位」已落 ∥ `:1273` 仍「三查位」（U3 登记如实）；batch.mjs `:7`「用例 BR-1–26」在位。**域外注（不评级）**：`thincoder-core/agent/family-tools.mjs:161-163` = 「batch_segment 挂载形态已随单名化收口退役」沿革注（同族历史注，非活面残留——判非缺陷，未列）。**口径限制**：无项目标准档 / 无文档地图声明——文档归属判据按 Project Guide + 本评审判据降级执行。

**计数**：🔴 0 · 🟡 3 · 🔵 2（域外注 1，不计级）

**VERDICT: pass**

## §4 用户批准（主 agent）

**代签（父侧 · 2026-10-01）**：依据 = 用户全链自动授权（代签 ∥ 代点火 ∥ 代派）+ **设计评审 pass**（轮 1 · 0🔴）+ 修复轮（评审发现 1–5）五号全落（父侧逐处核讫）+ §2.13 修复轮块。**批准范围** = §2 全（§2.1–§2.13）∥ 实施 = 单舱（12 档 + 批内件 158 行）——实施回执 = §5；收口 = §6。

## §5 实施记录（eng-coder）
**状态行**：实施完成 2026-10-01（12 档 + 批内件新档；产品行为零改（注释 ∥ 缩进 ∥ 死码）；批内件 9/9；两处父裁 + 自修 1 处披露见 §5.3）


（实施轮 · eng-coder · 2026-10-01 · initial——12 档 + 批内件新档终值；产品行为零改（全注释 ∥ 缩进 ∥ 死码）；L1–L9 全绿（9/9）；两处父裁 + 本舱自修 1 处，披露 = §5.3。）

### 5.1 落点台账（file:line = 落地后读回 · 行数 = 内容行口径）

| # | 号 | 档 | 落点（改后 file:line） | 内容 | 行数（改前 ⇒ 改后） |
|---|---|---|---|---|---|
| ① | #781 | `thincoder-desktop/src/main/turn-driver.mjs` | `:53` ∥ `:117` | 「三查位」⇒「四查位」×2；`:53` 枚举补第 ④ 项「边界轮 `end` 帧 ∥ 记录零写」（逐字对 `PROJECT.md:135`） | 236 ⇒ 236（δ0） |
| ② | #781 | `thincoder-desktop/src/main/turn-face.mjs` | `:161-173` | `end` 出站块 13 行 +2 空格（纯缩进，逐字零改） | 194 ⇒ 194（δ0） |
| ③ | #783 | `thincoder-vscode/webview/streaming.js` | `:124-126` | 归属写实：旧串「removes its own card」⇒ 端壳 `question.js`（`onAnswered`） | 183 ⇒ 183（δ0） |
| ④ | #753 | `thincoder-cli/src/tui/subagent-freeze.mjs` | 原 `:193-208` 净删 | dead-export 删（D1）：doc 注释 + `finishSubTasksByRole` 体 | 265 ⇒ 248（设计 ≈249；δ −17 vs −16——随删含尾随空行以免双空行，±1 容差内） |
| ⑤ | #753 | `thincoder-cli/src/tui/subagent-blocks.mjs` | `:33` ∥ `:34` ∥ `:37-39` ∥ `:55` ∥ `:203-205` | 转口两列退场；三处注收正（done = 消费面补发 ∥ settled = 完成两态 ∥ 冻结落消费窗） | 462 ⇒ 461 |
| ⑥ | #753 | `thincoder-cli/src/tui/tool-events.mjs` | `:25` ∥ `:206-208` ∥ `:239-242` | import 列退场；两处 EN 注收正（块保 live ∥ 消费窗） | 454 ⇒ 454（δ0） |
| ⑦ | #753 | `thincoder-cli/src/tui/tool-display.mjs` | `:115-118` | 注收正（块保 live——settle 发 `⟦ev⟧settled`；冻结落消费窗） | 157 ⇒ 157（δ0） |
| ⑧ | #753 | `thincoder-cli/src/tui/agent-turn.mjs` | `:298-301` | 注收正（不冻结——冻结落消费窗：起跑窗 ∥ reclaim ∥ 退出兜底） | 422 ⇒ 422（δ0） |
| ⑨ | #753 | `thincoder-core/agent/run-stages.mjs` | `:246-249` | 注收正（settle 回调只发 `⟦ev⟧settled`；`⟦ev⟧done` 冻结落消费窗） | 270 ⇒ 270（δ0） |
| ⑩ | #756 | `thincoder-core/agent-tools/batch.mjs` | `:7` | 头注「用例 BR-1–26」⇒「用例 §4.8」 | 313 ⇒ 313（δ0） |
| ⑪ | #763 | `docs/batches/2026-09-30-theme-switch.test.mjs`（**父侧落**） | `:18` ∥ `:19-20` ∥ `:27` | 件内静态预载解析钩 + 头注平命令形 | 266 ⇒ 267 |
| ⑫ | #777 | `docs/batches/2026-09-30-desktop-residuals.test.mjs`（**父侧落**） | `:12` ∥ `:361` ∥ `:362` ∥ `:366` ∥ `:367` ∥ `:368` ∥ `:466` | 五处 45⇒46 + `:368` 末位 ⇒ `record:append` + M-689a 字面组合 | 468 ⇒ 468 |
| ⑬ | 批内件 | `docs/batches/2026-10-01-zero-semantic-sweep.test.mjs` | L1 `:52` ∥ L2 `:71` ∥ L3 `:78` ∥ L4 `:84` ∥ L5 `:119` ∥ L6 `:126` ∥ L7 `:139` ∥ L8 `:147` ∥ L9 `:155` | 新档九腿（源面锁 ∥ 负向锁 ∥ 实跑；本体零 `/rc/` 依赖） | 新 · 158 行（raw 159；设计 ≈160 估） |

### 5.2 实跑读数（修前 ∥ 修后 · 仓根 `thincoder/`）

| 面 | 命令 | 修前基线 | 修后读数 |
|---|---|---|---|
| #763 | `node --test docs/batches/2026-09-30-theme-switch.test.mjs`（无 `--import`） | exit 1 · 5/6（腿 6 `ERR_MODULE_NOT_FOUND: d:\rc\lib.mjs`——本舱复现） | **exit 0 · 6/6**（父侧落配方后；本舱复跑） |
| #777 | `node --test docs/batches/2026-09-30-desktop-residuals.test.mjs` | exit 1 · 13/15（M-685b `:362` 46≠45 ∥ M-689a `:466` false≠true——本舱复现） | **exit 0 · 15/15**（父侧落配方后；本舱复跑） |
| 全批 | `node --test docs/batches/2026-10-01-zero-semantic-sweep.test.mjs` | — | **exit 0 · 9/9（L1–L9 全绿）** |
| 语法 | `node --check` ×十档 | — | 全 `Syntax OK` |
| 载入 | L5（cli cwd 直载 `subagent-blocks.mjs` ∥ `subagent-freeze.mjs`）+ 附加图核（CLI `tool-events ∥ tool-display ∥ agent-turn`；core `run-stages`） | — | 全 exit 0（零悬挂导入） |
| 仓套件 | `npm test` | — | **零跑**（父侧收口单跑——按 §2 口径） |

### 5.3 决策透明表（越表 ∥ 裁定 ∥ 披露）

| 项 | 内容 | 裁决 ∕ 出处 |
|---|---|---|
| ① | `desktop-residuals.test.mjs:368`（末位 `mcp:reconnect` ⇒ `record:append`）——设计五处清单**外扩收 1 处**（同族同源陈旧期望：45⇒46 后末位实变 `record:append`；`preload.cjs:44` ∥ `ipc-registry.mjs:77/:82` 实证） | **父裁 A**（2026-10-01）：「按章执行到位——停在该处上抛、父侧裁为收正——非扩面」；随 §5 披露（本条） |
| ② | 两档他批测试件（theme-switch ∥ desktop-residuals）写入**被跨批档机械门拒收** | 本舱**零绕门**——逐处配方呈父侧、**父侧执行落盘**（回执在册）；本舱复跑两档终值收口 |
| ③ | L7/L8 假绿诊断（本舱自修）：`NODE_TEST_CONTEXT` 继承 ⇒ 嵌套 `node --test` 子进程静默空跑（exit 0 ∧ 零输出）——案发时 L7/L8 首断言「假绿」通过 | 本舱自诊断自修：L5/L7/L8 子进程环境剥该变量（批内件 `:31-32` 注释在册）——非设计面改动，披露 |
| ④ | `subagent-freeze.mjs` δ = −17（设计 −16）——随删含尾随空行（免双空行） | 本舱口径；验收② ±1 容差内，披露 |

### 5.4 审计与代码评审轮次与终态

- **内部 explore 分歧审计**（只读 · 轮 1）：唯一偏差 = §5 未落（🟡，即本段落账）；产品码十档 + 批内件 = **divergence-free**（逐档落点 ∥ 行数对账 ∥ 负向锁 ∥ 禁面复核）。审计装配无执行工具 ⇒ 运行类腿未独立复跑（结构读面核讫，已明示）。
- **内部 advisor 代码评审**（轮 1 · 对象 = 十档 + 批内件）：**VERDICT = pass**（🔴 0）。🟡 1 = 四档越 300 顾问线（存量·在册·非 must-fix：CLI-DEBT §2.1 A9/A10/A16；`batch.mjs` = D4 保留裁决）；🔵 5 = 可选加固（登记 = §5.5）。评审明示：无执行工具 ⇒ 9/9 未独立复跑，以全锚静态可达性核替代。
- **终态 = clean**（审计 1 处为收尾步本身，已在本段落账；评审 0 must-fix）。

### 5.5 fix round

- 自修 1 处（测试件健壮性，非缺陷）：L5/L7/L8 子进程环境剥 `NODE_TEST_CONTEXT`——诊断证据在册（案发读数：假绿 exit 0 ∧ 零输出 ∥ 剥后真读数 5/6 ∥ 13/15）。
- 评审 🔵 五项（**登记 · 零动作**——随下次触碰 ∥ 父侧裁）：① `streaming.js:137` 缩进残面（`if (aborted)` 块内 137–142 行 6 空格 vs 同级 4 空格——#719 同类，本档不在 #781 射程）；② 批内件 L4 全树存在性弱项（`两态` 在 cli/src 另有 5 处无关命中 ⇒ 该子判据零判别力；`消费窗` 判别力来自按档锁 `:106-113`）；③ L1 固定下标锁（`:60-68`——形状依赖，可选改语义锚定位）；④ L6 缺 `batch_segment:` 核锚**正向锁**（可选补一行）；⑤ 批档 §4 ∥ §6 空段（归主 agent ∥ 父侧）。
- 设计面零返工：十档 + 批内件一轮落盘即过全腿；审计 ∥ 评审零产品码 must-fix。

### 5.6 重叠档复核（consult 舱）与零触面

- **重叠档复核**：本舱开工前对写域重叠三档（`subagent-blocks.mjs` ∥ `subagent-freeze.mjs` ∥ `tool-events.mjs`）**逐档届盘重读**，改动逐处落在现盘最新内容上；`git diff` 复核证 consult ∥ 他舱改动（#748 收正 ∥ #754 起跑窗 ∥ #726 记录点）在盘未损；consult 零触面（`tool-events.mjs` consult_stop 注 ∥ `subagent-freeze.mjs` reclaim consult 支）未触。
- **零触面复核**（全数零触）：`PROJECT.md` ∥ `API-CONTRACT.md`（父侧重生成）∥ `CLI-DEBT.md` ∥ `configureBatchSegment` ∥ `resetBatchSegment` ∥ `batch_segment:` 核锚（`batch.mjs` 错误串前缀仍在盘）∥ prompt 面 ∥ #774（登记不修）∥ 批档与他批记录面。

## §6 验证与收口（父代理）

**收口轮（父侧 · 2026-10-01）**：① **父侧亲跑复验**：批内件独立复跑 = **9/9 绿**（L1–L9——含 L7/L8 实跑两档 ∥ L9 灵敏度）；② **API-CONTRACT 重生成**（父侧笔）：`node scripts/api-contract.mjs --write` ⇒ **WROTE 2761 条（614 档）** ∥ `--check` = **OK 零漂移**——`finishSubTasksByRole` 两行随生成区整区替换退场（存留 = 记录/存档面：`thincoder-cli/CHANGELOG.md` ∥ `_archive/design/TUI.md` ∥ 批档——零回改口径）；③ **CLI-DEBT A16 读数裁决**：418 ⇒ **422**（届盘实读；余量 78）+ 变更记录（父侧③类笔）；④ 两档他批件换写 = 父侧执行（写门实况——§5 披露 2；6/6 ∥ 15/15 复跑在册）；⑤ 披露处置：越表 1 = 父裁 A 在册 ✓ ∥ L7/L8 假绿自修 = 接受（诊断在册）∥ 设计档漂移（§2.4/§2.8 两他批件列舱面）= 本 §6 收正登记 ∥ 🔵 五项：`streaming.js:137` 缩进残面 = 另立行；L4/L1/L6 测试弱项 = §5 留存；本档 §4/§6 = 本收口轮补落；⑥ 台账结算：`#781 ∥ #783 ∥ #753 ∥ #756 ∥ #763 ∥ #774 ∥ #777 → 已核销`（7 笔；#774 = 扫描+登记完成）+ 新立「批内件挂载面归一」行（18 实例 + 2 待核 + 2 出入——§2.7 在册）；⑦ D7 对账：角色表 §1–§6 ✓ ∥ 状态行 ✓ ∥ 计数（12 档 + 批内件 158 行）✓ ∥ 指针（批档 ↔ 台账 ↔ 设计面）✓。**收口完成 ⇒ 冻结。**
