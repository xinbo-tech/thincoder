# 批：2026-09-19 · VSC provider 行删除二次确认（台账 #95）

**状态行**：🔄 进行中（设计轮 · eng-designer）

> 批次边界：交付目标 = 「**provider 行 ✕ 入确认门**」；条目集 = 需求档 `docs/vsc/requirements/WEBVIEW.md` **F-W17**（判据句收正：原「非密钥类保持单击即删」作废）；用户 2026-09-19 08:11 逐字「**A，也入。**」
> 前情 = `docs/batches/2026-09-18-vsc-mcp-delete-confirm.md`（MCP 行入确认门 · 已收口）· `docs/batches/2026-09-18-vsc-key-delete-confirm.md`（密钥类确认门 · 弹框单源已建）。

## §1 批次任务（父侧）

**状态行**：🔄 进行中（设计轮 · eng-designer）

### 1.1 目标与理由

用户 08:11 裁定 **A**：provider 行 ✕ **删除整条时其 `apiKey` 原文一并消失、不可复得**（`thincoder-core/config-io.mjs:201-208` 写 / `:262-277` 整条 filter）⇒ 按 F-W17 判据（**不可复得 ⇒ 须一次显式确认**）与 MCP 行同类。此前父侧以「重填 URL/名即可逆」为由把它列为零回归锚——**该理由被 `apiKey` 事实推翻**（MCP 批评审 id=113 上抛 ③ 已登记该张力，用户本日裁定收口）。

### 1.2 本批覆盖的条目（逐条可交付）

| # | 需求 | 本批交付 |
|---|---|---|
| ① | **F-W17（再扩域）** provider 行 ✕ 须显式确认 | `webview/settings-providers.js` 两处载体（`:182` 行内 onclick · `:48-49` 取消重建位）改走 `_confirmSecretDelete` 门（与密钥/MCP 类**同一弹框单源**）；取消 ⇒ 零发值 |

### 1.3 本批不做

- **不改 `_removeProvider` 本体语义**（仍为直通动作 ⇒ 门在**调用侧**，同 MCP 批口径）。
- 不取撤销机制（承用户口径）。
- 不改宿主删除语义（`src/**`）· 协议零改 · 不改弹框件（`settings-widgets.js` 零改）。

### 1.4 边界

- 写域 = `thincoder-vscode/webview/settings-providers.js` + 用例档（`test/settings-secret-delete-confirm.test.mjs` 扩例）+ `docs/vsc/design/SETTINGS.md`（§2.10 入口册第 4 行归类改判 + 判据句）· `test/files.mjs`（如新档才登）。
- 需求档 = 父侧笔（F-W17 已收正）。

### 1.5 验收口径

1. **可机判**：provider 行 ✕ ⇒ **不立即发删除消息**；确认 ⇒ 发；取消 ⇒ 零发值 ∧ 行内复原。
2. **零回归锚变更**：原锚「provider 两处载体逐字不变」**作废**——新锚 = `_confirmDelete(` **调用点收敛为 0** ∧ **门名由 `_confirmDelete` 改判为 `_confirmSecretDelete`**（1 token——调用点即动作体入口，故「本体零改」指**动作体与消息面**（`removeProvider` 消息名 / 载荷 / 语义）零改，**不含门名 token**——本条 2026-09-19 按设计轮上抛 1 收正）；
3. `thincoder-vscode` `npm test` 全绿 + lint OK + `doc-check` 按档归属零新增。

## §2 批次任务与设计

（eng-designer 写）

（eng-designer · **initial 轮** 2026-09-19）

**落点（单源 · D2）** = `docs/vsc/design/SETTINGS.md` §2.10（类判据句 / 入口册 5 行 / 弹框契约 / 四条取消路径 / 载体段 / 判据域边界）· UI 决策 = 同档 §5 U-S11 · 残留登记 = 同档 §3（本批：provider 张力条**核销** + 直通门死码条**新增** + 用例档拆分条**改判**）。
本段 = 批次面（逐条设计 / 决策 / 受影响文件 / 用例 + 先红 / AC / 零回归锚 / 上抛），**不重述机制**。

### 2.1 逐条设计（回指 §1.2 ①）

| 面 | 设计要点（落点 = `SETTINGS.md` §2.10） | 判据（用例号见 §2.4） |
|---|---|---|
| **归类改判** | 入口册 #4（provider 行 −）「可重填类（受裁例外）」⇒ **不可复得类**——裁据 = 删整条时其 `apiKey` 原文随条目消失（`thincoder-core/config-io.mjs:201-208` 写 / `:262-277` 整条 filter；本席实核）。受裁例外条作废 + 新增「本批后态（唯一门）」 | §2.10 判据句；机判 = W17-17（域内 5 名全落本门） |
| **载体 ①（卡 HTML）** | `webview/settings-providers.js:182`：行内 `onclick` → `data-name="${escHtml(name)}"` 承载（类名 / `disabled` / `title` / 钮字面 `−` 零改）+ 卡级装配位 `bindAddProviderForm()` 绑 `addEventListener`（两条建面路径共同单点：`settings.js:131` · `settings-providers.js:241`）；选择器 `#prov-list .del-key[data-name]`（重建位的 − 无 `data-name` ⇒ 不重复绑） | W17-14（真点击 ⇒ 不即发 ∧ 确认面在位）/ W17-26（确认 ⇒ 恰 1 条） |
| **载体 ②（编辑行取消重建位）** | `webview/settings-providers.js:48-49` **逐字零改**（本已 `addEventListener`；目标 `name` 取自闭包） | W17-15（真点击 ⇒ 不即发 ∧ 确认面在位） |
| **门位（调用链入口件）** | 两处汇入 `_removeProvider`（`:64-66`）——本批**只改门名**（`window._confirmDelete` → `window._confirmSecretDelete`）：动作闭包 / 消息名 `removeProvider` / 载荷 `name` 逐字不变；载荷闭包 = **开框时捕获** | W17-29（弹框在位时卡重绘：不改目标 / 不吞确认）；W17-17（`_confirmDelete(` 调用点 = 0） |
| **绑定形态改判理由** | 行内属性绑定在夹具（happy-dom）下**不可驱动**（本席实测：对 − 钮 `.click()` ⇒ 零事件；`typeof el.onclick === "object"`）⇒「点击 ⇒ 不即发」的动作面**无法机判**；处置 = 同密钥行先例（`SETTINGS.md` 载体绑定段理由 ①②） | W17-14 内结构半条（`data-name` 承载在位 ∧ 行内 `onclick` 退场） |
| **确认形态 / 取消 / 文案** | 复用既有弹框单源（`webview/settings-widgets.js` `showConfirmPopover` + 清除入口）——**弹框件零改 / 零新增 CSS**；取消路径 #1 = W17-27 · #4 = W17-28（#2 / #3 同件等价覆盖）；文案**零改**（`settings.secretDeleteConfirm` 已是类通用式，provider 行陈述成立；`locales/**` 不入写域） | W17-27 / W17-28；i18n 双源由既有 W17-13 / W17-24 等价覆盖（同件同键） |
| **协议 / 宿主** | 确认 = webview 侧门 ⇒ 消息名与载荷**零增**（`{type:"removeProvider",name}` 逐字不变）；宿主删除语义（`thincoder-vscode/src/**`）**零改** | AC-FW17C-5（`git diff thincoder-vscode/src` 空 + `protocol-coverage-reverse` 绿） |
| **零回归锚** | `_removeProvider` 动作体逐字不变（仅门名 token）· `:48-49` 逐字零改 · 弹框件零改 · 密钥类 / MCP 既有面原样绿；**新锚** = `_confirmDelete` 调用点 = **0**（§1.5-2 上半句） | 恒绿 = W17-1…W17-13 / W17-18 + MCP 组；W17-17 |

**设计轮实测（先红形态硬读数 · happy-dom 直驱真模块 · 本席实跑 · 零仓内写入）**：

- **卡载体真点击 = 点不到 handler**：开面板 → `providerStatus{providers:{deepseek}}` → 对 `#prov-deepseek` 的 − 钮 `.click()` ⇒ 新增消息 `[]` ∧ `.auto-confirm` = **0** ∧ `.auto-backdrop` = **0**；`typeof btn.onclick` = `"object"` ∧ `getAttribute("onclick")` = `window._removeProvider('deepseek', this)` ⇒ **行内属性绑定在夹具下不驱动**（判别断言 = 「确认面在位」，非「零发值」——后者现态**空真**）。
- **直驱 `window._removeProvider("deepseek", btn)`（现态）** ⇒ 恰 1 条 `[{"type":"removeProvider","name":"deepseek"}]` ∧ 弹框 0（**点击即发**——W17-14 旧断言对象）。
- **编辑行取消重建位真点击（现态）** ⇒ 同 1 条即发 ∧ 弹框 0（该载体是 `addEventListener` ⇒ 可驱动 ⇒ **真红**）。
- **门已在位**：`typeof window._confirmSecretDelete === "function"`；直调门 ⇒ 弹框 1 ∧ 零发值，点确认 ⇒ 动作执行 ⇒ 本批缺口 = **入口未过门**（非门缺失）。
- **现态基线**：`node --test test/settings-secret-delete-confirm.test.mjs` ⇒ **25 pass / 0 fail**（含待改判的 W17-14 / W17-15 / W17-17）。
- **结构面（本席实跑扫描）**：域 = `webview/settings*.js` **8 档**；`delete*` 4 名 gated 1/1；`removeProvider` gated **0/1**（**红**）；`_confirmDelete(` 调用点 = **1**（**红**，目标 0）；`_confirmSecretDelete(` 调用点 = 4；域外正控 `deleteSession` 在（`session-bar.js`）；`_removeProvider` 全树仅 `settings-providers.js` 引用（定义 + 两载体 = 3 处）。
- **弹框在位重绘的触发条件（W17-29 前提，本席实跑）**：`providerStatus` **同值**重推 ⇒ 卡**不**重建（行节点同一）；**值变**重推 ⇒ 行节点被替换（`renderProvidersCard` 走 `outerHTML`）⇒ 用例须推**值变**载荷。

### 2.2 关键决策记录（含否决备选）

| # | 决策 | 否决备选 / 理由 |
|---|---|---|
| D-P1 | 入口册 #4 判入**不可复得类**（用户 08:11 裁定 A 落地；受裁例外条作废） | 否决「保持例外」：原「重填 URL/名即可逆」前提被 `apiKey` 事实推翻；否决「按 key 在场与否分叉」：行内不显 key 在场与否 ⇒ 分叉须新可见面 + 两分支两判据 |
| D-P2 | **门位 = `_removeProvider`（调用链入口件）改门名**——两载体汇入同一门；动作体 / 消息名 / 载荷逐字不变 | 否决「载体各自过门 + `_removeProvider` 降为纯动作」：① 该读法**不满足 §1.5-2 的「调用点收敛为 0」**（直通门仍留 1 个调用点）；② 载荷表达式会在两处重复（违 D2 单源）；③ 结构对账形态崩（发射串落在门区间**外**，机检须追函数间接）；**本项与 §1.5-2「本体零改」半句互斥——上抛 §2.8 #1** |
| D-P3 | 卡载体绑定形态：行内 `onclick` → `data-name` + `bindAddProviderForm()` 单点 `addEventListener`（同密钥行先例） | 否决「保持行内 `onclick` + 直驱 handler 判据」：判据句「点击 ⇒ 不即发 / 确认 ⇒ 发」在夹具下**不可驱动**（本席实测）⇒ 只能结构面 + 直驱，动作面判据降级为**空真**；否决「`#prov-list` 事件委托」：新绑定形态（全仓无先例）+ 越本批目的 |
| D-P4 | 载荷闭包 = **开框时捕获**（click 时取 `dataset.name` / 闭包 `name`） | 否决「确认时读 DOM」：违 §2.10 弹框契约既有判据（弹框在位期间卡重绘 ⇒ 目标漂移） |
| D-P5 | 用例承载 = **既有档扩例**（W17-14 / W17-15 / W17-17 同号改判 + W17-26…W17-30 新增）；**拆分**按 §3 登记执行（触发 = 实现轮末实读 ≥ 500 ⇒ MCP 组析出） | 否决「本批不拆、越线后补」：§3 登记已明写「越线即当场拆」（500 硬限无豁免）；否决「拆 provider 组」：登记组边界 = MCP 组（本席不擅改组边界） |
| D-P6 | **不碰 `webview/settings.js`**（写域外）：直通门定义保留（`test/smoke-settings.mjs:95` 依赖）+ 注释失实入 §3 登记 | 否决「本批删门 + 收正 smoke 断言」：写域 +2 档（§1.4 未列）⇒ 越界；而本批两条 AC（调用点 = 0 / 全入口过门）不需该档改动即达成 |
| D-P7 | 不引入撤销机制 · 不改宿主删除语义 · 协议零增 · 弹框件零改 · `locales/**` 零改 · 不动 MCP / 密钥类既有行为（承 §1.3 + 用户口径） | —— |

### 2.3 受影响文件表（行数 as-of 2026-09-19 initial 轮末 · 本席实测；Δ = 预估）

**行数口径（D3）**：`wc -l` 等价 `split("\n")` 去尾空行。

| # | 文件 | 现况 → 预估（Δ） | 面 |
|---|---|---|---|
| 1 | `thincoder-vscode/webview/settings-providers.js` | 269 → **~277**（+8） | 卡 HTML `:182`（行内 `onclick` → `data-name`，同址换承载不加行）+ 卡级装配位绑定循环（+5~6 行含注；选择器 `#prov-list .del-key[data-name]`）+ `_removeProvider:65` 门名（+0~1 行注）。**tier 复核**：预估 ~277 < **300** 建议线 ⇒ 本批不越线（拆分登记不触发） |
| 2 | `thincoder-vscode/test/settings-secret-delete-confirm.test.mjs` | 439 → **~516**（+77）**或**（拆分触发后）**~421** | 同号改判 3 例（W17-14 / W17-15 / W17-17）+ 新增 5 例（W17-26…W17-30）+ 头注 / 夹具助手（`provStatus` / `provDel`）；**预估 ≥ 500 ⇒ 预期触发 §3 拆分** |
| 3 | `thincoder-vscode/test/settings-mcp-delete-confirm.test.mjs`（拟新增 · **条件档**） | — → **~160** | 拆分目标（W17-16 / W17-19…W17-25 + 自持 `before` / `beforeEach` / 驱动助手）；触发 = 上档实读 ≥ 500 |
| 4 | `thincoder-vscode/test/files.mjs` | 99 → **100**（+1）· 或 **99**（±0） | 拆分触发 ⇒ 登记新档（主档条注释随组边界同笔收正）；未触发 ⇒ 零改 |
| 5 | `docs/vsc/design/SETTINGS.md` | 418 → **440**（+22 —— **本席 initial 轮实读落盘值**） | §2.10（判据句 / #4 改判 / provider 载体段 / 载体绑定句 / 需求对位 / 取消路径 2 格 / 判据域边界三层范围限制 / 机检面）+ §3（张力核销 + 拆分条改判 + 直通门条）+ §5 U-S11 + 变更记录 |
| 6 | 零改面（本席实读） | — | `webview/settings.js`（**138**——含 `_confirmDelete` 定义与失实注释，上抛 #2）· `webview/settings-widgets.js`（109）· `webview/settings-tools.js`（398）· `webview/settings-agent.js` / `-env.js` / `-models.js` / `-state.js` · `test/smoke-settings.mjs`（98）· `thincoder-vscode/src/**` · `thincoder-core/**` · `locales/en.json` / `zh.json`（260）· `docs/vsc/design/WEBVIEW-PROTOCOL.md` · 需求档（父侧笔）· 他批档 / `_archive/**` |

### 2.4 用例表（正常 / 边界 / 取消 / 结构对账）+ 先红形态

**档** = `thincoder-vscode/test/settings-secret-delete-confirm.test.mjs`（同档扩例；拆分触发时 MCP 组析出 = §2.3 #3）；夹具 = `test/helpers/webview-env.mjs`；驱动 = 真 DOM `.click()`。

| 编号 | 组 | 输入 / 动作 | 期望（断言级） | 先红读数（本席实跑） |
|---|---|---|---|---|
| W17-14（改判） | 正常（卡载体）· **必红** | `providerStatus{p1}` → 开面板 → 点 `#prov-p1` 的 `.del-key`（**真点击**） | `capturedPosts` **零增** ∧ `.auto-confirm` = 1 ∧ `.auto-backdrop` = 1；结构半条 = 卡源码含 `data-name` 承载 ∧ **不含** `onclick="window._removeProvider(` | 真点击 ⇒ `[]` ∧ 弹框 **0**（行内属性不驱动 ⇒ 判别断在「确认面在位」；「零发值」现态**空真**）；直驱 handler ⇒ 1 条即发 ∧ 弹框 0 |
| W17-15（改判） | 正常（编辑行重建位）· **必红** | `_editKey("p1")` → 点 [Cancel] 重建 → 点重建行 `.del-key`（真点击） | 零发值 ∧ 确认面在位（`.auto-confirm` = 1） | 真点击 ⇒ 恰 **1 条即发** ∧ 弹框 0（该载体可驱动 ⇒ 真红） |
| W17-26 | 正常 · **必红** | 卡行 − → 点 `.auto-confirm-yes` | 恰 1 条 `{type:"removeProvider", name:"p1"}` ∧ 弹框 + 遮罩移除 | 无框可依（`.auto-confirm-yes` 为 null） |
| W17-27 | 取消 · 路径 #1 · **必红** | 开框 → 点 `.auto-confirm-no` | 零发值（任何消息）∧ 弹框 / 遮罩移除 ∧ 该行 `outerHTML` **逐字同**点击前 | 无框可依（现态点击即发 1 条） |
| W17-28 | 取消 · 路径 #4 · **必红** | 开框 → 点 `#settings-close` | 零发值 ∧ 弹框 + 遮罩移除（`closeSettings()` 同清路径覆盖 provider 入口） | 开框在位读数 = **0**（期望 2） |
| W17-29 | 边界（弹框在位时卡重绘）· **必红** | 开框（p1）→ 推 `providerStatus`（**值变** ⇒ `renderProvidersCard` 重建；断言旧行节点被替换）→ 确认 | 弹框在位态不被打断 ∧ 恰 1 条 `{type:"removeProvider", name:"p1"}`——**判「在位不改目标 / 不吞确认」，不判闭包形态**（`outerHTML` 整体替换下两形态同载荷；形态由 D-P4 代码面复核守） | 弹框在位读数 = **0**（期望 1） |
| W17-30 | 边界（多行取目标）· **必红** | `providerStatus{p1,p2}` → 点**第 2 行** − → 确认 | 恰 1 条 `name:"p2"` ∧ **零** `p1`（载荷取点击钮的 `data-name`） | 无框可依 |
| W17-17（改判） | 结构对账（fail-closed） | 扫域 = `webview/settings*.js`（8 档）：发射名集 `delete*` ∪ `remove*` + 门实参区间 | ① 域内删除入口集 = **5 名** = {deleteEmbedKey · deleteWebsearchKey · deleteProviderKey · deleteMcpServer · removeProvider} 逐名 `gated == total`；② `_confirmDelete(` 调用点 = **0**；③ 域外正控 `deleteSession` 在且不入集；④ 未登记名 ⇒ 红 + 点名 | `removeProvider` gated **0/1** ∧ `_confirmDelete(` = **1**（两条均红） |

**取消路径的入口级覆盖（与 `SETTINGS.md` §2.10 取消路径表同源）**：provider 入口持**专属例** = #1（W17-27）与 #4（W17-28）；#2 遮罩 / #3 框内 Escape 的处理器在**弹框件内**（`webview/settings-widgets.js:80` / `:97-101`），入口侧零专属代码 ⇒ 由密钥类批**同件** W17-6 / W17-7 **等价覆盖**（不另设 provider 例；不按「逐入口 × 四条路径全列出例」读）。

**先红 / 恒绿汇总**：

- **先红档** = W17-14 / W17-15 / W17-17 / W17-26…W17-30（**9 例**；现态读数见上表右列）；
- **恒绿档** = W17-1…W17-13 / W17-18 + MCP 组（W17-16 / W17-19…W17-25）——后者本批零改动面，须原样保持绿；
- 「单击即删」旧断言两例（W17-14 / W17-15 的「恰 1 条 `removeProvider` ∧ 零弹框」）**随改判退场**——该类已被用户 08:11 裁定宣告空域，不再存在对应零回归锚。

### 2.5 验收标准（回指 F-W17 判据句 · 逐条机判）

| AC | 回指 | 判据（命令 + 断言） |
|---|---|---|
| AC-FW17C-1 | 「点击后必须有一次显式确认」 | `cd thincoder-vscode && node --test test/settings-secret-delete-confirm.test.mjs` 全绿；W17-14 / W17-15（两载体真点击 ⇒ 零发值 ∧ 确认面在位）+ 先红读数在册 |
| AC-FW17C-2 | 「确认后才发删除消息」 | W17-26 绿（恰 1 条 `{type:"removeProvider",name}` ∧ 框清；先红 = 无框可依） |
| AC-FW17C-3 | 「取消 ⇒ 零发值」 | W17-27（#1 · 含行 `outerHTML` 逐字复原）/ W17-28（#4）绿 ∧ #2 / #3 由同件 W17-6 / W17-7 等价覆盖（不按逐入口四路径读） |
| AC-FW17C-4 | 「所有删除入口均须过一次显式确认」（fail-closed 结构面） | W17-17 绿（域内 5 名逐名 `gated == total` ∧ `_confirmDelete(` 调用点 = 0 ∧ 域外正控在） |
| AC-FW17C-5 | §1.3「不改宿主删除语义 / 协议零增」 | `git diff thincoder-vscode/src` **空** ∧ `node --test test/protocol-coverage-reverse.test.mjs` 绿 |
| AC-FW17C-6 | §1.5-3 总门 | `cd thincoder-vscode && npm test` 全绿 ∧ `npm run lint` = OK |
| AC-FW17C-7 | 文档面 | `node scripts/doc-check.mjs --root .` **按档归属零新增**（读数 as-of initial 轮 = 悬空 **5** · 行宽 **12** · 拟新增 **6**——与开工基线同值；本批档 / `SETTINGS.md` 不在失败列） |
| AC-FW17C-8 | 拆分（§2.3 #2 / #3） | 实现轮末实读 `wc -l test/settings-secret-delete-confirm.test.mjs`：≥ 500 ⇒ MCP 组析出 + `files.mjs` 登记 + 两档各自 `node --test` 全绿（读数入 §5）；< 500 ⇒ 不拆（读数入 §5） |
| AC-FW17C-9 | 新锚「`_confirmDelete` 调用点收敛为 0」（§1.5-2） | W17-17 第 ② 条（域内 `_confirmDelete(` 次数 = **0**）——**判调用点计数，不判 `_removeProvider` 逐字**（§2.8 #1） |

### 2.6 零回归锚（列断言）

| # | 面 | 载体（本批零改动 / 新锚） | 断言 |
|---|---|---|---|
| R1 | `_removeProvider` **动作体** | `settings-providers.js:65` 的闭包（消息名 / 载荷 / 括号结构） | 逐字不变（仅门名 token 变）——W17-17 判其在确认门实参内 |
| R2 | 编辑行取消重建位 | `settings-providers.js:48-49` | 逐字零改（`git diff` 面复核）；行为由门承载（W17-15） |
| R3 | 弹框件 / 门体 | `settings-widgets.js`（109 逐字）· `settings.js:48-55` / `:116-122` | 原样绿（W17-6 / W17-7 / W17-28） |
| R4 | 密钥类 / MCP 既有面 | `settings-tools.js:27-29` / `:45-47` / `:191-198` · `settings-providers.js:56-58` | W17-1…W17-13 / W17-18 + MCP 组原样保持绿 |
| R5 | 协议 / 宿主 / 文案 / CSS | `thincoder-vscode/src/**` · `webview/settings-tools.js` · `locales/**` · `controls.css` | `git diff` 空 / 零改；protocol-coverage-reverse 绿 |
| R6 | `_confirmDelete` **定义** | `settings.js:43`（写域外） | 逐字零改 ∧ 调用点 = **0**（新锚——W17-17 第 ② 条） |

### 2.7 边界（不做）

不改宿主删除语义（`thincoder-vscode/src/**` 零改）· **不引入撤销机制**（用户 21:07 口径）· 不新增协议形态（消息名 / 载荷零增）· 不新增 CSS / 不改弹框件 · 不改 `locales/**`（文案已是类通用式，provider 行陈述成立）· **不改 `webview/settings.js`**（写域外——死门 + 失实注释入 §2.8 #2 / §3）· 不改 `settings-tools.js` 与其余设置面档 · 不碰 `thincoder-core/**` / `thincoder-cli/**` · 不改需求档（父侧笔）· 不改已收口批档与 `_archive/**` · 不新增「行内二次点击」形态 · **不按 transport / key 在场与否分叉归类**（归类按条目整体）。

### 2.8 上抛项（父侧 / 评审面）

| # | 级别 | 发现 | 建议处置 |
|---|---|---|---|
| 1 | 🟡 | **§1.5-2 两个半句互斥**：「`_removeProvider` 本体逐字零改」⟺「`_confirmDelete` 调用点收敛为 0」不可同真——门调用点就在 `_removeProvider:65`（实读：域内 `_confirmDelete(` = **1**，仅此一处）。本设计取**门名改判**（1 个 token；动作体 / 消息名 / 载荷逐字不变），与 MCP 批「绑定位改门名」同口径（D-P2 三条否决理由在册） | 父侧确认该读法（或改笔 §1.5-2）；若坚持「本体逐字零改」⇒ 调用点必留 1 ⇒ 新锚与 AC-FW17C-9 须同改。**［2026-09-19 已消解：§1.5-2 已按本上抛收正（门名 token 可变 · 动作体/消息面零改）］** |
| 2 | 🟡 | **写域外 1 档（失实自述 + 死门）**：本批后 `webview/settings.js:42`「Single-click delete — the re-fillable class only (provider rows … ruling exception)」**失实**、`:44-47` 类定义未含 provider 行、`_confirmDelete`（`:43`）调用点归零而定义仍在（`test/smoke-settings.mjs:95` 的 handler 在位断言依赖它） | 父侧择一：① 补列写域 `webview/settings.js`（注释 ±0 行、零代码——同 MCP 批先例）；② 同批删门 + 收正 smoke 断言（写域再 +1 档）；③ 明确零改 ⇒ 失实注释 + 死门按 §3 新条登记（消解路径 + 到期条件已在册）。**［2026-09-19 已裁：取 ① 为下次触碰首选修法，本轮维持登记不修（注释改笔 = 产品代码面，须走完整流程）——详 `SETTINGS.md:394`］** |
| 3 | 🟡 | **需求档 F-W17「实测入口册」未列 provider 行**（`docs/vsc/requirements/WEBVIEW.md:34`）：判据句已含 provider 行，但「以上述实测册为准」的册只列 live 密钥 2 + 死 handler 1 + MCP 行 ⇒ 册与判据句枚举不同步 | 父侧在册内补 provider 行一条（载体 = `settings-providers.js:182` 卡载体 / `:48-49` 重建位；消息 `removeProvider`）——本席不改需求档。**［2026-09-19 已消解：`WEBVIEW.md:34` 册已含 provider 行 + 模型菜单入口行（#6/6）；其载体形态另已收正为 `data-name` + `:185` / `:229-246` / 动作 `:67-69`］** |
| 4 | 🔵 | `SETTINGS.md` §3 文案面登记的到期条件已达未核销（MCP 批 §5.8 #1 在册）：本席按「不自取未派工面」未动笔 | 父侧在本批或文档卫生轮同笔核销 |
| 5 | 🔵 | 派工措辞笔误：派工称「现 25 例 · 含 **W17-16** 结构对账」——结构对账 = **W17-17**（W17-16 = MCP 行正常例）；用例数 25 ✓ 本席实读 | 无需动作（口径澄清） |
| 6 | 🔵 | `test/files.mjs` 主档条注释仍写 `W17-1…W17-18`（MCP 批 §5.8 #4 在册）：本批**触发拆分** ⇒ 该注释随组边界**必然**重写（不再是「值级收正」而是组内容变化）；未触发 ⇒ 维持登记不动 | 父侧裁（与 AC-FW17C-8 同笔） |

**三链对齐（自检）**：批档 §2 条目（§1.2 ① = F-W17 序域扩展：provider 行入本门）↔ 设计档 `SETTINGS.md` §2.10 入口册 **#4** + 类判据句（本席 initial 轮已落盘——实读 `:154-163` 判据句块 / `:180` 入口册 #4 行 / `:248-253` provider 载体段）↔ 需求档 F-W17 判据句（「所有删除入口（密钥 / 令牌 / MCP 行 / provider 行）均须过一次显式确认」）——差集 = 需求档实测册未列 provider 行（§2.8 #3，父侧笔）。

## §3 设计评审记录

（评审子代理写）

### 轮次 1（评审子代理）

**评审对象** = 设计档 `docs/vsc/design/SETTINGS.md`（§2.10 provider 行改判落盘）· 批档 `docs/batches/2026-09-19-vsc-provider-delete-confirm.md`（§2 设计轮）· 需求档 `docs/vsc/requirements/WEBVIEW.md`（F-W17 判据句收正）。范围限制：未声明项目标准档 / 文档地图（方法学按 Project Guide + 评审判据判）；代码档行数未独立对账（评审范围限三份文档）——SETTINGS.md 实读末行 = 440，与批档 §2.3 #5 的「440」声明一致。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 文档状态（跨档滞后） | 🟡 | 批档 §2.8 #3（`docs/batches/2026-09-19-vsc-provider-delete-confirm.md:154`）与「三链对齐」自检（同档:159）断言需求档「实测入口册」未列 provider 行；实读 `docs/vsc/requirements/WEBVIEW.md:34` 该册已含「**provider 行 ✕ = 须确认类**」（载体 `settings-providers.js:182` + `:48-49` · 动作 `:64-66` · 消息 `removeProvider`）——上抛项前提已不成立 | §2.8 #3 与 :159 按实况改笔（标「已消解」或删条）；差集句改为「册与判据句已同步」 |
| 2 | 文档状态（批内不一致） | 🟡 | 批档 §2.8 #1（:152）仍以「待确认读法 / 或改笔 §1.5-2」列在上抛表，而 §1.5-2（:36）已按其收正（括注「本条 2026-09-19 按设计轮上抛 1 收正」）⇒ 同档「已收正」与「待确认」并存 | §2.8 #1 补核销标注或删条，使门位读法（`_removeProvider` 改门名）在 §1.5-2 / §2.1 D-P2 / AC-FW17C-9 三处收敛为一处权威表述 |
| 3 | 文档归属 / 措辞不一致 | 🟡 | 需求档 I-9（`WEBVIEW.md:75`）仍无条件把「单击即删」列进「设计意图（**勿误修**）」清单，而同档 F-W17（`:34`）与 `:85` 已收正为「限可重填类 · 该类已空域」——同一行为同档两处措辞不等，旧措辞仍带「勿误修」读法 | I-9 行补 `:85` 同款限定语（或改指 F-W17），使全档「单击即删」只余一种读法 |
| 4 | 验收标准（可机判性） | 🟡 | AC-FW17C-5（批档:127）与零回归锚 R2（:138）/ R5（:141）的判据 = `git diff <路径>` 为空；本评审上下文声明「No git repository detected（change-set context is unavailable）」⇒ 该命令不可执行，该 AC 现无落地判法 | AC-FW17C-5 / R2 / R5 补非 git 等价判据（关键档内容哈希 / 逐档指纹 / 文件清单+行数快照比对），或写明 git 不可用时的替代验证 |
| 5 | 结构（尺寸档） | 🟡 | 测试档拆分后主档预估 ≈421 行（`SETTINGS.md:353` · 批档:90）——仍越 **300 行建议线**；§3 登记的触发与到期只覆盖 ≥500 硬限（「未越线 ⇒ 不拆」），拆分后新档无下一步拆分复核触发 | §3 拆分登记同笔给主档（≈421）的下一档触发阈值 + 组边界（密钥行族 / provider 行族），使拆后档不落在无登记状态 |
| 6 | 数字漂移 | 🔵 | `settings-tools.js` 行数两处不等：`SETTINGS.md:347` 记 **395**（`wc -l` 口径）/ 批档:94 记 **398**（同口径 · as-of 2026-09-19 实读） | 两处按同一时点实读统一（刷新登记值或注明各自读数时点） |
| 7 | 清晰度 / 边界表述 | 🔵 | 范围限制段（`SETTINGS.md:263-264`）称三层识别面之外的入口「本门不认」，同句又写「既不静默漏计数」——对族外名（如 `clear*`）机检面既不计数也不点名，与 `:260`「未登记入口 ⇒ 红 + 点名」的 fail-closed 读法存在字面张力 | 两处并读加限定句（fail-closed 射程 = 命名 / 书写 / 枚举三层内；族外形态兜底 = 动作面用例 + 评审），并给该边界补消解路径 / 到期条件 |
| 8 | 用例完备性 | 🔵 | W17-17 改判后的期望块（批档:109）列 ①–④，未复述 `SETTINGS.md:264` 登记的「域档数下限断言（≥5）」——扫描域 = 平铺 `readdirSync` `settings*.js`，缩域（移入子目录）靠该下限兜底，改判时易被丢 | W17-17 期望块补入域档数下限（≥5）断言一条 |
| 9 | 需求侧前提（unverified） | 🔵 | 批档 §2.1（:57）以「`settings.secretDeleteConfirm` **已是类通用式**」为前提作 `locales/**` 不入写域的零改决策；而 `SETTINGS.md:343-346` 仍以「本批实现轮（落盘并核对 AC-FW17B-6 后核销）」登记该键值级改写（未核销）——文案现值是否已为类通用式在本评审范围（三份文档）**不可核实**；若未落盘，provider / MCP 行文案陈述不成立 | 写域核对点 = 两语实读值（`locales/zh.json:173` / `en.json:173`）与 §3 登记对齐；不一致 ⇒ 文案档入写域 |

**正向核验（无发现）**：F-W17 判据句 ↔ 设计档 §2.10（类判据 / 入口册 1–5 / 本批后态「唯一门」）↔ 批档 §1.2 / §2.1 三链一致；载体两处（`settings-providers.js:182` 卡 HTML · `:48-49` 取消重建位）与动作件 `_removeProvider`（`:64-66`）齐备；AC 与用例（W17-14 / W17-15 / W17-17 改判 + W17-26…W17-30）可机判且有先红读数；协议零增 / 宿主零改 / 弹框件零改 / 不取撤销机制均与需求档第三列一致；受影响文件表逐档有现况行数 + Δ（纯 .md 豁免），`settings-providers.js` 269 → ~277 未越 300 线。

**计数**：🔴 0 · 🟡 5 · 🔵 4

VERDICT: pass

## §4 用户批准

**2026-09-19 08:11 用户直接裁定** —— 逐字「**A，也入。**」（= provider 行 ✕ 入确认门；「单击即删」类自此为空域）。

## §5 实施与修正记录

（eng-coder 写）

**（eng-coder · 实现轮 2026-09-19）**

### 5.1 交付摘要

provider 行 −（删整条）由直通（`_confirmDelete`）改判入**不可复得类确认门**（`_confirmSecretDelete`）：卡 HTML 载体行内 `onclick` → `data-name` + 卡级装配位（`bindAddProviderForm()`）绑定；编辑行取消重建位零改；`_removeProvider` 只改门名（动作体 / 消息名 / 载荷逐字不变）。条目 = 批档 §1.2 ①（F-W17 序域扩展：provider 行入本门）⇒ **✅ 完成**（AC-FW17C-1…9 逐条落地，读数见 5.4 / 5.5）。用例档按 500 硬限触发拆分：MCP 组析出为 `test/settings-mcp-delete-confirm.test.mjs`。

### 5.2 受影响文件表（文件 / 改动 / Δ 实测）

**行数口径（D3）**：`split("\n")` 去尾空行（= `wc -l`）。

| # | 文件 | 改动 | Δ 实测 |
|---|---|---|---|
| 1 | `thincoder-vscode/webview/settings-providers.js` | ① 卡 HTML `:185`：`onclick="window._removeProvider('${escHtml(name)}', this)"` → `data-name="${escHtml(name)}"`（类名 / `disabled` / `title` / 钮字面 `−` 零改）；② `bindAddProviderForm()`（`:229-246`）：新增 `document.querySelectorAll("#prov-list .del-key[data-name]")` 绑定循环（`const name = btn.dataset.name` → `window._removeProvider(name, btn)`；载荷 = 开框时捕获）+ 函数头注同步（职责含删除钮）；③ `_removeProvider`（`:67-69`）：门名 `_confirmDelete` → `_confirmSecretDelete`（1 token；动作闭包 / `removeProvider` / 载荷逐字不变）+ 3 行注 | 269 → **282**（+13）；设计预估 ~277——差 3 行 = 注记多 3 行（无语义差）。**< 300 建议线** ✅ |
| 2 | `thincoder-vscode/test/settings-secret-delete-confirm.test.mjs` | W17-14 / W17-15 / W17-17 **同号改判** + W17-26…W17-30 **新增 5 例** + 头注同步（provider 批档指针 + MCP 组析出说明）+ 夹具助手 `provDel` / `provEntry` / `pushProviders` + `emitsIn` 判据扩为 `delete* ∪ remove*`；**MCP 组 8 例迁出**（→ #3） | 439 →（扩例后 505）→ 拆后 **405**；设计预估拆后 ~421 |
| 3 | `thincoder-vscode/test/settings-mcp-delete-confirm.test.mjs`（**新建**） | MCP 组（W17-16 / W17-19…W17-25）析出：自持 `before` / `beforeEach` / 驱动助手（零跨档 import；夹具经 `test/helpers/webview-env.mjs` 共享） | — → **177**；设计预估 ~160 |
| 4 | `thincoder-vscode/test/files.mjs` | 新档登记（`:96`）+ 主档条注释随组边界收正（`:95`：`W17-1…W17-18` → `W17-1…W17-15 / W17-17 / W17-18 + W17-26…W17-30` + MCP 组析出指引） | 99 → **100**（+1） |
| 5 | 零改面（复核读数） | `webview/settings.js` · `settings-widgets.js` · `settings-tools.js` · 其余 `settings-*.js` 4 档 · `controls.css` · `settings.css` · `session-bar.js` · `mode-buttons.js` · `chat.js` · `i18n.js` · `ui.js` · `test/smoke-settings.mjs` · `thincoder-vscode/src/**` · `locales/{en,zh}.json` · `thincoder-core/config-io.mjs` · 设计档 / 需求档 / 他批档 / `_archive/**` | 逐档 SHA256 与开工基线同（详见 5.6 判据） |

### 5.3 先红读数（真分发路径：真 webview 模块 + 真点击；禁夹具手写载荷）

**红跑命令**：`node --test test/settings-secret-delete-confirm.test.mjs`（写域内用例档已改判 + 新增 5 例，实现面未改）⇒ **22 pass / 8 fail**：

| 红档 | 首断言读数（实跑） |
|---|---|
| W17-14 | `.auto-confirm` 实读 0 !== 1（行内属性绑定夹具下不驱动 ⇒ 判别断在「确认面在位」；零发值现态空真） |
| W17-15 | 点击即发：`[{type:'removeProvider', name:'p1'}]` !== `[]`（该载体 `addEventListener` ⇒ 真红） |
| W17-17 | `removeProvider：0/1`（未落门内） |
| W17-26 / W17-27 / W17-30 | `.auto-confirm-yes` / `.auto-confirm-no` 为 **null**（无框可依） |
| W17-28 | 开框在位 0 !== 2 |
| W17-29 | 弹框在位 0 !== 1 |

**同时段恒绿**：W17-1…W17-13 / W17-18 + MCP 组 8 例（原样绿）。实现落盘后复跑 ⇒ **30/30**（未拆态）。（批档 §2.4 表头记「先红档 = 9 例」——表内必红行实为 **8**；W17-16 属 MCP 批已收口面。计数差上抛 5.8 #3。）

### 5.4 用例读数（命令 + pass/fail）

| 命令（cwd = `thincoder-vscode`） | 读数 |
|---|---|
| `node --test test/settings-secret-delete-confirm.test.mjs` | **22 pass / 0 fail**（= W17-1…W17-15 / W17-17 / W17-18 / W17-26…W17-30） |
| `node --test test/settings-mcp-delete-confirm.test.mjs` | **8 pass / 0 fail**（= W17-16 / W17-19…W17-25） |
| `npm test`（`node test/run.mjs` 全量快层） | **720 pass / 0 fail / 0 cancelled / 0 skipped**（清单自检含新档登记 ✅） |
| `npm run lint`（`node scripts/check-syntax.mjs`） | **check-syntax: 217 JS files OK** |
| `npm run doc:check`（root = `thincoder`） | 悬空 **5** · 行宽 **12** · 拟新增 **6**——与开工基线同值；**按档归属零新增**（失败列无本批四档；`docs/vsc/**` 仅既有条目） |

### 5.5 AC-FW17C-1…9 逐条读数

| AC | 判据 | 读数 |
|---|---|---|
| AC-FW17C-1 | 点击 ⇒ 确认面；先红在册 | W17-14 / W17-15（两载体真点击 ⇒ 零发值 ∧ `.auto-confirm` = 1）+ 5.3 先红读数 ✅ |
| AC-FW17C-2 | 确认后才发 | W17-26 ⇒ 恰 1 条 `{type:"removeProvider", name:"p1"}` ∧ 框/遮罩移除 ✅ |
| AC-FW17C-3 | 取消 ⇒ 零发值 | W17-27（#1 · 含行 `outerHTML` 逐字复原）· W17-28（#4 关面板同清）✅；#2 / #3 由同件 W17-6 / W17-7 等价覆盖（同轮绿） |
| AC-FW17C-4 | 全入口过门（fail-closed） | W17-17 绿：域内删除发射集（`delete* ∪ remove*`）= **5 名**逐名 `gated == total` ∧ `_confirmDelete(` 调用点 = **0** ∧ 域档数 ≥5 ∧ 域外正控 `deleteSession` 在且不入集 ✅ |
| AC-FW17C-5 | 宿主零改 / 协议零增 | `git diff --stat thincoder-vscode/src` = **空** ∧ `protocol-coverage-reverse` 绿（含于 npm test）✅ |
| AC-FW17C-6 | 总门 | `npm test` 720/720 ∧ lint OK ✅ |
| AC-FW17C-7 | 文档面 | doc-check 与开工基线同值（悬空 5 / 行宽 12 / 拟新增 6）· 按档归属零新增 ✅ |
| AC-FW17C-8 | 拆分 | 实现轮末实读 **505 ≥ 500** ⇒ MCP 组析出 + `files.mjs` 登记 + 两档各自全绿（22/22 · 8/8）✅ |
| AC-FW17C-9 | 新锚（调用点收敛为 0） | W17-17 第 ② 条（域内 `_confirmDelete(` 计数 = 0，全树仅 `settings.js:43` 定义 + `:47` 注释名）✅ |

### 5.6 零回归锚（R1–R6）复核 + 非 git 等价判据

- **R1**（`_removeProvider` 动作体）：`git diff` 仅门名 1 token + 3 行注；闭包 / `type:"removeProvider"` / 载荷 `name` 逐字同 ✅
- **R2**（`:48-49` 取消重建位）：diff 无该区 hunk（逐字零改）✅
- **R3**（弹框件 / 门体）：`settings-widgets.js` · `settings.js` 指纹与基线同；W17-6 / W17-7 / W17-28 绿 ✅
- **R4**（密钥类 / MCP 既有面）：W17-1…W17-13 / W17-18 + MCP 组 8 例原样绿 ✅
- **R5**（协议 / 宿主 / 文案 / CSS）：`thincoder-vscode/src/**` · `locales/{en,zh}.json` · `controls.css` 零改（指纹 + git diff 双证）✅
- **R6**（`_confirmDelete` 定义）：逐字零改（指纹同）∧ 调用点 = 0（W17-17）✅
- **非 git 等价判据（评审 id=135 🟡4）**：开工前对 97 档（`src/**` 全树 79 + webview 17 + locales 2 + `test/files.mjs` / 用例档 / `smoke-settings.mjs`）建 **SHA256(12) + 行数** 基线快照；本批终态复核 = **24 档零改面逐档指纹与基线同**（含 `src/**` 抽样 6 档 + 弹框件 + 工具档 + `settings.js` + 两语 + 两 CSS）；改动仅 3 档（写域内）+ 1 新档。内容哈希口径，不依赖 git。

### 5.7 越界项

**无**——四档（实现面 + 两用例档 + `files.mjs`）全在批档 §1.4 写域内；`git status` 面另见 `docs/**` 改动均属 eng-designer / 父侧既有笔（本席零写）。设计档 / 需求档 / `src/**` / `locales/**` / 弹框件逐档指纹同。

### 5.8 上抛（父侧 / 设计侧 · 本席只报不改）

1. **🟡（代码评审轮）主用例档 405 行 > 300 建议线**：批内只处理了 500 硬限（505 ⇒ 拆）；§3 拆分登记的到期条件（「provider 行批实现轮末实读」）已消耗，**未给拆后主档的下一档触发 / 组边界** ⇒ 请父侧 / 设计侧同笔登记（如 ≥450 或「provider 行族 / 密钥行族」组边界）或裁定保留不拆。
2. **🔵（代码评审轮）结构半条 = 源码字面串匹配**（主档 `:244-245` + MCP 档 `:89`，house pattern）：属性换行 / 序调整即假红。本席**登记不修**——该形态是设计 W17-14 明写的判据（「卡源码含 `data-name` 承载 ∧ 不含 `onclick=`」），且假红安全、动作面已由真点击例覆盖；若要收敛建议另批统一改属性级判定。
3. **🔵 批档 §2.4「先红档 = 9 例」计数存疑**：表内必红行实为 **8**（W17-14 / W17-15 / W17-17 / W17-26…W17-30），本席实跑红档与 8 例逐号同；W17-16 属 MCP 批已收口面（本轮恒绿）。请父侧值级收正或确认口径。
4. **🔵 设计档坐标 as-of 漂移族（本席改动所致）**：`SETTINGS.md` §2.10 的 `settings-providers.js:182` → 现 **:185**；`:241` → 现 **:254**；`:64-66` → 现 **:67-69**；`:56-58` / `:48-49` 不动；档长 269 → **282**。本席不改设计档（坐标收正 = 父侧文档卫生轮口径）。
5. **🔵 `SETTINGS.md` §3 文案面登记（`:343-346`）到期条件已达未核销**（承批档 §2.8 #4）：文案两语现值 = 类通用式（实读 `locales/{zh,en}.json:174`，与 §2.10 改写值逐字同）。
6. **🔵 域外未登记删除入口（候选——审计与评审同报）**：`webview/model-picker.js:25`（模型下拉底部「− 移除 provider…」）发**裸** `removeProvider` → 宿主 `removeProviderFlow()`（`src/extension/provider-flows.mjs:142-147`）只出 QuickPick 即 `removeProviderEntry(sel.label)`——**无确认步**；该路径删条目同样使 `apiKey` 不可复得，但不在 §2.10 判据域（`settings*.js`）与需求档实测册内 ⇒ 是否入册 / 入域请父侧裁（本席写域外 + 属设计判定，未擅动）。
7. **🔵 直通门死码 + `settings.js:42` 失实注释**：确认仅存于写域外档（本批按 D-P6 零改）；`SETTINGS.md` §3 登记条（消解路径 + 到期条件）仍在册，父侧择机处置。

### 5.9 分歧审计轮（explore · 只读审计子代理 · 轮次 1）与修正

**审计结论**：**DEVIATIONS — 2 项**（`PARTIAL` ×1 · `DOC-DRIFT` ×1）；代码 / 用例面四类（静默降级 · 越界 · 空真断言 · 夹具代造载荷）**零发现**。审计独立复核通过项（非本席自述）：门名 + 载荷闭包 + 绑定单点 + 重建位零改逐条同形；W17-17 的 5 名 / 调用点 0 / 域外正控 / 域档下限真可判；W17-14 结构半条与动作半条互补、无空真（改造前真点击到不了 handler ⇒ 必红）；W17-29 只判「在位不改目标」（与 §2.10 判别面明示一致）；两档零跨档 import、各自可独立跑；失实注释仅在写域外档、四档零外溢。

| # | 类别 | 处置 |
|---|---|---|
| 1 | `PARTIAL`：批档 §5 空 ⇒ AC-FW17C-8「读数入 §5」半句无落地证据 | **已消解**：本段（5.1–5.11）即该读数落点 |
| 2 | `DOC-DRIFT`：`test/files.mjs:95` 主档条注释仍写 `W17-1…W17-18`（含已析出的 W17-16） | **已修**：收正为 `W17-1…W17-15 / W17-17 / W17-18 + W17-26…W17-30` + MCP 组析出指引（修后复跑 720/720） |

**附带观察（登记）**：行数口径差 1（审计按「末行号」= 283 / 177，本席按 D3「`wc -l` 去尾空行」= 282 / 177）——两者均远低于阈值，无后果；W17-17 期望块的「域档数下限 ≥5」只在我的用例里（批档 §2.4 表未列，设计评审 id=135 发现 8 的落点已在 `SETTINGS.md` §2.10:264）；设计档 as-of 坐标漂移族见 5.8 #4（只报不改）。

### 5.10 代码评审轮（advisor · type=code · 轮次 1）与修正

**评审面**：paths = 4 档（实现面 + 两用例档 + `files.mjs`）；documents = 本批档 + `SETTINGS.md` + `docs/vsc/requirements/WEBVIEW.md`；review-object 声明在册（排除面 = `src/**` · `settings.js` · `settings-widgets.js` · `settings-tools.js` · `locales/**` · `controls.css` · 设计档 / 需求档 · 撤销机制 · MCP / 密钥类既有行为面）。
**结论**：**pass**（🔴 **0** · 🟡 **1**（非 must-fix）· 🔵 **3**）。

| 号 | 级别 | 处置 | 落点 / 读数 |
|---|---|---|---|
| 1 | 🟡（非 must-fix） | **登记 + 上抛**（5.8 #1）：主用例档 405 > 300 建议线；拆后主档下一档触发 / 组边界未落笔（属父侧 / 设计侧笔） | 批档 5.2 #2 · `SETTINGS.md` §3:351-353 |
| 2 | 🔵 | **已修**：`settings-providers.js:64` 注释自引坐标「卡 HTML `:182`」失实（该钮现落 `:185`）⇒ 改注 `:185`（行数 ±0，纯注记） | `settings-providers.js:64`（现读） |
| 3 | 🔵 | **登记不修**（5.8 #2）：结构半条 = 源码字面串匹配（两档同款 house pattern；设计 W17-14 明写该判据形态；假红安全） | 主档 `:244-245` · MCP 档 `:89` |
| 4 | 🔵 | **已修（注记式）**：`emitsIn` / `callArgSpans` 头注补「扫描对象 = 原始源码文本（注释 / 字符串体一并计入；遮蔽面由评审判）」——把该启发式限制显式化（主用例档 +2 行） | 主档 `:373-375` · `:390-391`（现读） |

**评审局限（评审子代理自报）**：无执行面 ⇒ 绿 / 红读数采信本席记录（5.3 / 5.4）；先红读数与拆前 505 实读**不可自现行树复算**（该态已被拆分覆盖）。
**注记（时序透明）**：🔵2 / 🔵4 两处修订落在**评审轮之后**（纯注释面 · 零行为）；`settings-providers.js` 行数 ±0（282），主用例档 403 → **405**；复跑两档 **30/30** + `npm test` **720/720** + `npm run lint` OK。
**宿主校验提示「0/3 citations」说明**：评审所引路径缺 `thincoder/` 前缀（相对解析失败，非内容不符）——三处引文（`:64` 的 `:182` · `:185` 的按钮行 · 主档 `403 }`）本席已逐条实读相符。

### 5.11 终态

**终态 = `clean`**（无 must-fix 待修项；🟡1 = 登记 + 上抛，🔵2 / 🔵4 已修，🔵3 登记，5.8 #3–#7 = 登记 / 上抛项）。轮次：审计 1 轮（2 项偏差，2 项已消解）+ 代码评审 1 轮（pass，2 项已修 / 1 项登记 / 1 项上抛）+ 评审后注记式修订 1 次（复跑全绿）。

## §6 验证与收口

**收口（2026-09-19 08:4x · 父侧直接执行）**

- **交付判据**：用户 08:11「**A，也入。**」→ 立批 §1 → 设计 id=134 → 评审 **pass**（id=135 · 0🔴/5🟡/4🔵）→ 实现 id=137（终态 clean）⇒ **F-W17 第四入口（provider 行）全闭，「单击即删」类就此空域**。
- **父侧独立复跑**：两用例档 **22 pass / 0 fail** + **8 pass / 0 fail**（与 coder 报数一致）。
- **验收读数**：vsc `npm test` **720/720** · lint OK（217 档）· `doc-check` 按档归属零新增 · `settings-providers.js` **282 < 300**。
- **先红（真模块 + 真点击）**：**22 pass / 8 fail**——W17-14（弹框 0）· W17-15（即发 `[{removeProvider,p1}]`）· W17-17（`removeProvider` 0/1）· W17-26/27/28/29/30（无框可依）；恒绿 = W17-1…13 / 18 + MCP 组。
- **拆分当场执行**（越 500 即拆）：`settings-secret-delete-confirm.test.mjs` 扩例后 **505 ≥ 500** ⇒ MCP 组析出为 `settings-mcp-delete-confirm.test.mjs`（177）⇒ 两档 **405 / 177**；`test/files.mjs` 登记 + 主档条注释随组边界收正。
- **零改面双证**：97 档 SHA256+行数基线快照 vs 终态（24 档零改面指纹逐档同）+ `git diff src…locales` 空。
- **设计档坐标漂移（登记 · 待收正）**：`SETTINGS.md` §2.10 `:182`→`:185` · `:241`→`:254` · `:64-66`→`:67-69`（`:48-49` / `:56-58` 不动）· 档长 269→282——**消解路径 = 父侧下一次文档卫生同笔**；到期 = 该档下次触碰。
- **上抛（待裁 · 不阻塞）**：§5.8 #5 §3 文案条到期未核销 · **§5.8 #6 域外候选未登记入口 `webview/model-picker.js:25`（裸 `removeProvider` → 宿主 QuickPick 即删、无确认步）**——父侧待裁（同类不得留白）。
- **状态行**：✅ 已收口 2026-09-19（全档冻结）。
- **台账**：⚠️ **本批未入台账**——原文「#95 ⇒ 已核销」**不实**（该号未建，后已为他项占用）⇒ **交付记录以本档 §6 为准**；补登记待裁。（2026-09-19 22:0x 父侧自纠）
