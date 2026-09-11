# VSC live 块 UX（流式跟滚 + 高度）· 批次记录（2026-09-11）

> 搬迁注记：本档自 CLI 仓 `thincoder/docs/batches/2026-09-11-VSC-LIVE-UX.md` 迁入本仓 `docs/batches/`（LEDGER-SELF-CONTAINED 批——实施面全在本仓的批档物理迁移，档名不变、文字逐字；源档 blob SHA = 7a4105c7c88a · 源提交 = cfcc621）。

> 六段 append-only，一段一作者。编制：主 agent · 2026-09-11 23:33 · 来源 = 用户 23:29 实测（live 块内容不跟随流式滚动须手动滚 + live 块高度 100→60）。

---

## §1 讨论（主 agent 记）

### 状态

**已收口 2026-09-11**（用户直述两条）。下一步 = **设计**（spawn eng-designer）。

### 用户需求（两条）

1. **U1 流式跟滚**：live 块内容区在流式输出时**自动跟随**（默认钉底）——用户手动上滚时让位（标准 pinned-unless-scrolled-away 语义），滚动回到近底后**重新钉底**。
2. **U2 高度 100 → 60**：live 块内容区 `max-height` 由 **100px 改 60px**。
   - **范围假设（designer 按此设计并在档内标注）**：改 **live 块**（`.sub-block`）；**advisor 评审块维持 100px**——用户原话指 live 块；如要一并改，用户一句话即可（设计档留一行登记）。

### 已核事实（父侧取证——供 designer 免重复勘察；as-of 2026-09-11 现读）

| # | 事实 | 证据 |
|---|---|---|
| 1 | 高度源 = 两处 CSS | `webview/chat.css:318`（`.advisor-content { max-height: 100px; overflow-y: auto; … }`）+ `:468`（`.advisor-block.sub-block .advisor-content { max-height: 100px; }`）；`:465-467` 注释记载「2026-09-05 用户设定：advisor/subagent 均 100px——内容完整、内部滚动」 |
| 2 | 钉底模式已有两处先例（语义对齐基准） | `webview/ui.js:450`（messages 面 `scrollTop = Number.MAX_SAFE_INTEGER`）· `webview/streaming.js:49`（reasoning `scrollTop = scrollHeight`；`:27` 注释记 per-chunk scrollTop 强制同步布局的代价） |
| 3 | live 块内容区**无任何跟滚消费点** | grep `scrollTop`/`scrollIntoView` 于 `webview/*.js`：`.advisor-content` 相关零命中；`activity-view.js:69` 只读 content 做 tailLines（`:71-77`） |
| 4 | 内容更新路径 | `activity-view.js` `refreshBlock`（摘要重建）+ 内容追加面（块内 `.advisor-content` 子元素追加）——具体追加点实现面由设计定 |
| 5 | 区级 pin 已存在（今日活动区批） | 活动区 `_pinActivity`/`maybeScrollActivity`（32vh 区自滚 + 钉底跟新块）——**块级跟滚与区级 pin 的叠加关系须在设计写清**（外层区 / 内层块各管什么） |

### 设计约束（评审会查）

- **先例对齐**：跟滚语义照既有钉底模式（`ui.js`/`streaming.js` 同族）与活动区批的 `maybeScrollActivity`（近底判定 + wheel/touch 让位）——不新造第三种模式。
- **语义边界**：折叠态（details 关闭）不产生滚动副作用；tail-3 摘要面（`refreshBlock`）行为零变。
- **机验**：跟滚行为可测（追加后钉底；手动上滚后追加不回弹；近底恢复后复钉）+ 高度 60 的 CSS 断言——用例落 `test/activity-flow.test.mjs` 同族（designer 定）。
- **单端**：VSC 端独有面（CLI 无 live 块 UI）——CLI 零改动。
- 不与在途批冲突：VSC-CONTEXT-PARITY（评审在飞——注入/提示词面）与机制纪律批（提示词文本面）均不触 `webview/`。

### 范围外

- 活动区本体尺寸/结构（今日活动区批已收口，token 已消费）——本批只动块级跟滚与块高。
- advisor 评审块高度（假设维持 100——见 U2 登记行）。

---

## §2 批次任务（eng-designer 写）

_（待写——eng-designer）_

---

**状态：任务书就绪**（2026-09-11——需求 + 设计 + 测试三层已落档；待设计评审）。实施者 = eng-coder（设计 token 门）。本 §2 = coder 任务书本体（不另写副本；契约逐字 / 用例全文 / AC 判据在设计档各节，本段只做任务书 + 口径锚）。

**落档位置**：需求 = CLI 仓 `docs/requirements/AGENT-LOOP.md` §14（F-LU1/F-LU2 + N-LU1~N-LU3——本批新增）· 设计 + 测试 = VSC 仓 `docs/design/WEBVIEW.md` **§13**（§13.1–§13.9：现场核实 / 选型 / 契约 C-LU1..C-LU5 / 决策 D-LU1..D-LU6 / 用例 T-LU1..T-LU6 / AC-LU1..AC-LU7）+ §12.3 第 6 条高度句改指 + 变更记录顺延 §14（节号 sweep 已在位）。

### 一、覆盖条目（本批条目 = 设计回指 = 需求档条目；三方一致清单）

| # | 条目（§1 来源） | 需求 | 设计 | 用例 | 验收 |
|---|---|---|---|---|---|
| U1 | live 块流式跟滚（§1 用户点一） | §14 F-LU1 | §13.2 选型 · §13.3 C-LU1/C-LU2 | T-LU1..T-LU4 · T-LU6 | AC-LU1..AC-LU4 |
| U2 | 内容区高度 100→60（§1 用户点二） | §14 F-LU2 | §13.3 C-LU3 | T-LU5 | AC-LU5 |
| N1 | 零回归 / 单端 | §14 N-LU1 | §13.5 不动面 · §13.8 | 全表 | AC-LU6 |
| N2 | 可机判 / 文档面 | §14 N-LU2 / N-LU3 | §13.5 · §13.7 | 全表 | AC-LU7 |

### 二、实施任务（逐条——逐字契约见设计 §13.3，不重抄）

1. `webview/activity.js`（C-LU1）：模块内 `initBlockFollow(block)`（内容区 wheel/touchmove 监听——近底 24px 判据写 `内容区._pinFollow`）+
   导出 `maybeScrollBlock(block)`（`isConnected`/`open`/`_pinFollow !== false` 三重守卫 → `scrollTop = Number.MAX_SAFE_INTEGER`）；
   `buildBlock` 在区尾 append 后（`maybeScrollActivity` 邻位）调用 `initBlockFollow(block)`；头注职责段补一行。
2. `webview/streaming.js`（C-LU2）：`_subScrollDirty` 脏集（Set 惰性建）——`subagentChunk` 追加后记入；`scheduleStreamRender` rAF 尾处理（逐块 `maybeScrollBlock` → 置空）；**节流重排条件补 `_subScrollDirty`**（尾 chunk 不丢跟随——边缘点，评审会查）；import 面加 `maybeScrollBlock`。
3. `webview/chat.css`（C-LU3）：`:468` 值 `100px → 60px`（选择器不变）；`:465-467` 注释按 §13.3 引文逐字改述；`:318` 基础行维持 `100px`。
4. 注释 sweep（C-LU4）：`streaming.js:56-58` 注释（「子代理块……无强制滚动」句）改述；`activity.js` 头注；`activity-view.js` 零改（头注「本叶零参与显隐 / pin」句维持——其面零改）。
5. 测试（C-LU5）：新档 `test/activity-live-ux.test.mjs`（T-LU1..T-LU6——手法同 activity-flow / async-visibility webview 侧：`setupWebview` + `installChatFixture` + 真模块动态 import + `until` 轮询等 rAF）；`test/files.mjs` 入册一行（显式清单——不登记不跑）。

### 三、影响文件全清单（行数口径 = `split("\n").length` 含末行；as-of 2026-09-11 实测）

**实施域（VSC 仓——5 改 = 3 源 + 2 测试档：1 新 1 入册；代码面 ~+40 / 测试面 ~+140）**：
`webview/activity.js`(328,+~26) · `webview/streaming.js`(249,+~12) · `webview/chat.css`(477,±4) · `test/activity-live-ux.test.mjs`(新档,~140) · `test/files.mjs`(72,+1)。

**不动面（零碰——反断言）**：`webview/ui.js`（492 近 500 硬限）· `webview/activity-view.js` · `webview/state.js` · `webview/index.html` · `webview/base.css` · `locales/**` · `test/helpers/webview-env.mjs`（fixture 已具） · `test/activity-flow.test.mjs`（近满——零追加）。

**拆分评审注**：activity.js 328→~354 越 300 软线、<500 硬限——不拆（增量 = 2 小函数 + 1 行调用 + 头注——理由见设计 §13.4 D-LU3）；ui.js 近硬限——本批零碰；测试独立新档（activity-flow 486 近满——「不再追加」先例）。

**不入 files**：`docs/**`（设计者 + 父侧写域）· CLI 仓一切文件（本批 VSC 单端——需求档 §14 除外，设计者已落）· `docs/TODO.md` / `CHANGELOG.md`（父侧）。

### 四、验收标准（逐条——判据全文见 §13.7，不重抄）

- **AC-LU1**（U1 钉底）= T-LU1：`subagentChunk` 追加 → 等帧 → 内容区 `scrollTop === Number.MAX_SAFE_INTEGER`（真链：chunk → 脏集 → rAF）。
- **AC-LU2**（U1 让位）= T-LU2：wheel 上滚（gap > 24）→ `_pinFollow === false` → 追加不回弹；区 / 块两层独立（`_pinActivity` 不受块级让位牵动）。
- **AC-LU3**（U1 复钉）= T-LU3：近底 wheel → 追加复钉超值。
- **AC-LU4**（U1 边界）= T-LU4/T-LU6：折叠 / 已移除态零滚动副作用、零抛错。
- **AC-LU5**（U2 高度）= T-LU5：静态断言——子块规则 `max-height: 60px` + 基础行 `100px` 在位。
- **AC-LU6**（零回归 / 单端）= VSC 快层全绿（含新档）；`_advisorScrollDirty` 分支在位（流内 advisor 路径零改）；CLI 仓代码 `git diff` 空。
- **AC-LU7**（文档面）= 设计 §13 全节 + 需求档 §14 在位；`node scripts/check-doc-width.mjs` 新增违规 0。

### 五、纪律与边界（coder 须知）

- **D1 写权**：coder 只写实施域 5 文件（§5 = coder 段自写）；文档域 = 设计者已落——零碰（发现文档需改 → 回报）。
- **运行验证**：`node --test test/activity-live-ux.test.mjs`（新档）；VSC 快层 `npm test`（全绿）；`node scripts/check-doc-width.mjs`（新增违规 0）。
- **逐字纪律**：无新增文案 / locale 键；块头 / tail-3 / ⏹ / 区 pin / 流内 advisor 面零改；C-LU3 注释逐字照 §13.3 引文。
- **边缘点（评审会查）**：① 节流重排条件必须含 `_subScrollDirty`（尾 chunk 不丢跟随）；② 折叠（`open=false`）零滚动副作用；③ `_pinFollow !== false` 默认钉底；④ 写超值不读 scrollHeight（`Number.MAX_SAFE_INTEGER` 口径）。
- 不 commit（改动留工作区）；凭证不落档；越出声明写域 → 停下报告。
- **父侧登记项（批后核销）**：需求池 / `docs/TODO.md` 状态推进 + `CHANGELOG.md`（父侧）。

### 修正轮同步（2026-09-12——设计评审轮次 1 后；本追加与上文本冲突时以本追加为准）

**背景**：设计评审轮次 1 VERDICT = pass（🔴 0 · 🟡 1 · 🔵 2——发现表见 §3 轮次 1）。父侧裁定：🟡#1 + 🔵#2 落修；🔵#3（跨仓引用形态）**Deferred**——登记不改（与 §12.6 先例同形、无实际违规；后续文档清扫批统一）。本轮 = 修正轮（**只改文档、不碰实现**；未新建档；`src/**` 零改动、未 commit、未发起评审——待父侧核验）。

**落点（逐条——设计档 `WEBVIEW（VSC 仓）§13`；行号 as-of 落修后 2026-09-12）**：

| # | 级别 | 落点 |
|---|---|---|
| 1 | 🟡 | §13.7 AC-LU6（L1331-1333）补扩展端反断言——`src/extension/**` 零改动（扩展端协议与实现零改——`git status` 机检；修正轮 #1）；需求 §14.4「不动扩展端协议与实现」对位（先例 NFR-J1 / AC-R7） |
| 2 | 🔵 | §13.4 D-LU6（L1287）与设计档变更记录 sweep 行（L1360）「§1 沿革行」标签订正为「§2 沿革行」（修正轮 #2——沿革行实位 §2、零语义）；变更记录新增修正轮条目（L1353-1356） |
| 3 | 🔵 | 跨仓引用形态未改——**Deferred 登记**（父侧裁定；后续文档清扫批统一；与 §12.6 先例同形、无实际违规） |

**任务书侧同步（修正轮 #1 直出）**：AC-LU6 执行面 = 本 §2「四、验收标准」AC-LU6 行原判据 + `src/extension/**` 零改动机检（VSC 仓工作树该路径零改动；判据全文 = 设计 §13.7）；机检结果随交付报告。

**核验（D6 回读 + 机检）**：VSC 仓 `node scripts/check-doc-width.mjs` = 宽度全绿 + 一致性新增违规 0（含本次落修面，落修后复跑）；CLI 仓同脚本 = 本档追加面零新增（报告在列其余项——§3 评审段与批次档他页——非本追加引入，留父侧处置）。

## §3 设计评审（评审子代理写）

_（待写——评审子代理）_

---

### 轮次 1（评审子代理）

设计评审（VSC-LIVE-UX——需求 §14 / WEBVIEW §13 跟滚 + 高度 100→60）

评审范围：thincoder/docs/requirements/AGENT-LOOP.md §14 + VSC 仓 WEBVIEW.md 的 §13（新节 + §12.3 第 6 条改指 + 节号 sweep + 变更记录 §14）。〔父侧修正引用形态（V1）2026-09-12〕。证据核验（实测）：§13.1 全部 file:line 引用在位（streaming.js:26-27/43/56-62/59-60/239-248 · ui.js:448-456/460-463/481-491 · chat.css:317-326/465-468）；
  受影响文件行数逐档抽检一致（activity.js 328 · streaming.js 249 · chat.css 477 · ui.js 492 · activity-flow 486 · files.mjs 72）；「.advisor-content 唯一 scrollTop 写点」grep 实证；happy-dom 20.11.2 rAF = setImmediate（BrowserWindow.js:2089-2140）→「until 轮询等帧」可行；
  geometry 桩/超值断言/WheelEvent 均有既有先例（activity-flow.test.mjs:241-268）；新档未落地、webview 无 _subScrollDirty/initBlockFollow/maybeScrollBlock（设计先行成立）；无既有测试锁 100px（AC-LU6 零回归前提成立）；两仓触碰档 check-doc-width 宽度/V1/V2 风险面逐项核过。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Acceptance criteria | 🟡 | AC-LU6 只机检 CLI 仓代码 diff 空；需求 §14.4「不动扩展端协议与实现」无对应反断言（§12 先例 NFR-J1/AC-R7 有 extension 端 git diff 空） | AC-LU6 或 §13.5 不动面补「`src/extension/**` 零改动」机检一句 |
| 2 | Clarity | 🔵 | D-LU6（WEBVIEW.md:1287）与变更记录（:1355）把 sweep 落点写作「§1 沿革行」；该沿革行实际位于 §2（WEBVIEW.md:43——sweep 内容本身正确执行） | 标签改「§2 沿革行」 |
| 3 | Doc-state | 🔵 | 跨仓引用「`docs/requirements/AGENT-LOOP.md` §14」按 V1 正则（反引号包裹形态）不构成段引用、无实际违规；但同 basename AGENT-LOOP.md 在本仓存在（docs/design/AGENT-LOOP.md）——形态与 README §3.7 建议形态（名称（仓别）§N）不一致，若后续去掉反引号会按错档解析 | 可选：统一为「AGENT-LOOP（CLI 仓）§14」形态（先例 §12.6 同形——不阻断） |

VERDICT: pass

计数：🔴 0 · 🟡 1 · 🔵 2

## §4 用户批准（主 agent 记）

**2026-09-12 00:20 父侧代签**——用户 23:43「自动推进到排空」授权；条件齐备：轮次 1 pass（0🔴 · 1🟡 · 2🔵）→ 修正轮落地（#15——AC-LU6 扩展端反断言 + sweep 标签订正；🔵#3 Deferred 已固化）→ token 已签发（值不落档）。

**批准范围**：VSC live 块 UX（流式跟滚 + 内容区高度 60px）——实施面 = 设计 §13.5 受影响文件（`activity.js` 载体 + `chat.css:468` 高度 + 新测档 + `files.mjs` 入册）；实施者 = eng-coder（设计 token 门）。

**遗留**：① 批次档 §3 的评审段超宽行/引用项——父侧随收口折行打标；② commit 随「扫」批。

---

## §5 实施记录（eng-coder 自写）

_（待写——eng-coder）_

---

**2026-09-12 00:56 · eng-coder 交付**（VSC-LIVE-UX——live 块流式跟滚 + 内容区高度 60px；实施域 = 设计 §13.5 清单 5 档）

**一、交付摘要（逐档——行数口径 = `split("\n").length` 含末行）**

| 文件 | 状态 | 落点 |
|---|---|---|
| `webview/activity.js` | ✅ 354 行（设计预测 ~354） | `initBlockFollow`（:121-127——wheel/touchmove 让位监听 `{passive:true}`，近底 24px 写 `内容区._pinFollow`）+ `maybeScrollBlock` 导出（:132-137——isConnected / open / `_pinFollow !== false` 三重守卫 + `Number.MAX_SAFE_INTEGER` 写超值不读 scrollHeight）+ `buildBlock` 接线（:111——出生/接管/补桩三路径共用）+ 头注（:29-31） |
| `webview/streaming.js` | ✅ 257 行（设计预测 ~261） | `_subScrollDirty` 脏集（:32 惰性 Set）+ 节流重排条件含脏集（:44——边缘点③尾 chunk 不丢）+ rAF 尾逐块应用→置空（:64-68）+ `subagentChunk` 记入（:253-254）+ 注释改述（:57-62） |
| `webview/chat.css` | ✅ 477 行（±4） | `:468` 子块 100→60px（选择器不变）+ `:465-467` 注释按 §13.3 引文逐字改述；`:318` 基础行 100px 零改（advisor 流内评审块） |
| `test/activity-live-ux.test.mjs` | ✅ 新档 172 行 | T-LU1..T-LU6（§13.6 用例表逐行对位；`installChatFixture` + 真模块动态 import + `until` 轮询等帧） |
| `test/files.mjs` | ✅ +1 行 | `:73` 入册（显式清单——不登记不跑） |

**二、验证证据（真跑——先落盘再查）**

- 定向档：`node --test test/activity-live-ux.test.mjs` → **6/6 pass · 0 fail**（~1.0s；修正轮后复跑同绿）
- VSC 快层：`npm test` → **601 tests / 587 pass / 0 fail / 14 skipped**（exit 0——含新档；此前跑次 598/584/0 同绿）
- 变异核验（判据鉴别力自证）：临时移除重排条件中的 `_subScrollDirty` → T-LU2/T-LU4 转红（尾 chunk 丢跟随被抓住）→ 已回滚（现树绿）
- AC-LU6 机检：`_advisorScrollDirty` 分支在位（`streaming.js:57-63`——逻辑逐字未动、仅注释改述）；`src/extension/**` git diff 哈希 = 开工基线（7edd449a6dc3fdac——零改动）；CLI 仓零改动（本交付全部写操作仅 VSC 仓 5 档）
- AC-LU7：`node scripts/check-doc-width.mjs`（VSC 仓）→ 宽度全绿（69 文件）+ 一致性新增违规 0
- 环境注（非本批引入）：本机并发负载下慢测门（800ms reporter）偶发对既有档 `test/verify-redesign.test.mjs` T-V4 报红（隔离跑 ~130-160ms，快层负载下 800-960ms）——**无本批档的基线对照同样复现**，属既有档临界/环境抖动

**三、决策透明表（超出设计字面的动作——逐条披露）**

| # | 动作 | 依据 | 类别 |
|---|---|---|---|
| 1 | `streaming.js:255` subagentChunk 尾注改述（原「无块内自滚 pin——简单形态」句） | C-LU4 口径 sweep——该句因本批 C-LU2 变假；不扫即 doc-code drift | 注释（零语义） |
| 2 | `activity.js:28-29` 头注「import 面不变」措辞随实况调整（re-export 事实保留，注明 §13 起加 maybeScrollBlock） | 头注与 import 实况一致（新增 maybeScrollBlock import 边） | 注释（零语义） |
| 3 | 测试加强：T-LU2 预置 `_pinActivity=false` 反向正控 / T-LU5 注释逐字锁 / T-LU6 null+无内容区防御 / `before` 统一绑定区监听 | §13.6 用例输入输出内的加强（替代零） | 测试面 |
| 4 | `test/activity-live-ux.test.mjs` 172 行 vs 设计预计 ~140 | 六用例全文 + 上述加强断言 | 估算漂移（远低于 500 硬限） |

**四、审计与代码评审轮次与终态**

- **分歧审计**（只读 explore 子代理）：**CLEAN**——四类偏差（部分实现 / 静默简化 / 文档漂移 / 超范围）零发现；观察项 2 条（flushStreamRender 不处理脏集 = 规范未要求；块监听无解绑 = 既有块模式）。
- **代码评审**（advisor 同步）：VERDICT **pass**（🔴 0 · 🟡 1 · 🔵 2）。
- **裁决**：🟡1 activity.js 354 行越 300 软线 → **Deferred**（设计 §13.5 拆分评估已裁定不拆 + 需求 N-LU3 登记；拆分属结构变更、超修正轮边界）；🔵2 files.mjs 行数漂移 → **Not an issue**（本批自身恰 +1，差额 = 并发在途批同域条目）；🔵3 区监听逐测重复绑定 → **Fixed**（修正轮 #1：统一到 `before` 一次绑定，复跑 6/6 绿）。
- **修正轮**：1 次（🔵#3——测试面 hygiene，零生产代码改动；未夹带新语义）。
- **终态：clean**（审计零偏差 → 评审 pass 0🔴 → 修正轮收敛 → 全绿）。

**五、父侧待办提示**：本批不 commit（改动留工作区）；需求池 / `docs/TODO.md` / `CHANGELOG.md` 归父侧；慢测门临界档（verify-redesign T-V4）如需 slow 归册属他批域。

## §6 验证与收口（父代理自写）

**2026-09-12 00:52 收口（父侧核验）**

- **真跑**：新档 `test/activity-live-ux.test.mjs` → **6/6 绿** ✓；VSC 快层 → **601 例 / 586 过 / 1 fail / 14 skip**——唯一 fail = **存量抖动 T-V4**（`test/verify-redesign.test.mjs:87`，809.7ms 越 800ms slow 门；并发负载下偶发、隔离跑 ~130–160ms；**已在 `docs/TODO.md` 技术待办登记**——非本批因果，无本批档基线对照同样复现）；
- **机检**：`_advisorScrollDirty` 分支在位（`streaming.js`）✓；**变异核验**（临时移除 `_subScrollDirty` → T-LU2/T-LU4 转红）✓ 判据有鉴别力；`src/extension/**` 改动 = CONTEXT-PARITY 批（#13 声明域）——**非本批**；
- **交付表 5 项全 Done**；内部审计 CLEAN + 代码评审 pass（1 修正：区监听绑定前置）；
- **遗留**：设计 §13.5 `files.mjs` as-of 72（现值 75——随他批推后）→ 随收口划扫刷新；commit 随「扫」批；
- **链终**：design 链令牌已消费（值不落档）——再动需新评审。
