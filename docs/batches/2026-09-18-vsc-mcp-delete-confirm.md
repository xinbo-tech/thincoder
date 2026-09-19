# 批：2026-09-18 · VSC MCP server 行删除二次确认（台账 #93）

> 状态行：🔄 进行中（设计轮 · eng-designer）
> 批次边界：交付目标 = 「**MCP server 行 ✕ 过确认门**」；条目集 = 需求档 `docs/vsc/requirements/WEBVIEW.md` **F-W17**（判据句扩域）。
> 前情 = `docs/batches/2026-09-18-vsc-key-delete-confirm.md`（已收口冻结 · 密钥类确认门已实现）——本批为其**同机制扩域**（新交付目标 ⇒ 新批，不回改旧档）。

## §1 批次任务（父侧）

**状态行**：🔄 进行中（设计轮 · eng-designer）——机读位（`BATCH-RECORD.md` §4.9：解析对象 = §1 段内 `**状态行**：` 前缀行）；值同源档头行（`:3`）。由 eng-designer 于设计轮补足（§1 其余内容一字未改——形态收正 · 已在上抛项明示）。


### 1.1 目标与理由

用户 2026-09-18 22:21 逐字「**mcp 删除那个还是要确认一下好**」⇒ 推翻父侧 22:13 的默认裁定 ②（MCP server 行保持单击即删）。理由（父侧 21:07 起已登记在册的张力）：**删整条 MCP server 时其 token / headers 一并消失、不可复得**（同 `F-W17` 判据「不可逆 ⇒ 须确认」），而 provider 行删除后重填 URL/名即可逆 ⇒ 两者不同类。

### 1.2 本批覆盖的条目（逐条可交付）

| # | 需求 | 本批交付 |
|---|---|---|
| ① | **F-W17（扩域）** MCP server 行 ✕ 须显式确认 | `webview/settings-tools.js` MCP 行 ✕（`:191-195` 绑定位）改走 `_confirmSecretDelete` 门（与密钥类同一弹框单源）；取消 ⇒ 零发值 |

### 1.3 本批不做

- **不改 provider 行**（`settings-providers.js:182` 行内 onclick + `:65` 直通）：保持单击即删（可逆）——**零回归硬锚**。
- 不取撤销机制（承用户口径）。
- 不改宿主删除语义（`src/**`）· 不改协议（`WEBVIEW-PROTOCOL.md` 零改）。
- 不碰已收口批档 / 需求档其余条目 / 🔵 八条与设计意图十条。

### 1.4 边界

- 写域 = `thincoder-vscode/webview/settings-tools.js` · **`thincoder-vscode/webview/settings.js`**（注释自述同步——已裁：源注释 `:42`「reversible class only（provider rows / MCP servers can be re-added）」已被 22:21 改判推翻，「失效的表达一定要删掉」）· **`thincoder-vscode/locales/{en,zh}.json`**（文案值级改写——类通用式，键数不变）· 用例档（`test/settings-secret-delete-confirm.test.mjs` 扩例 · `test/files.mjs` 如新档才登）· `docs/vsc/design/SETTINGS.md`（§2.10 同步）。
- 需求档 = 父侧笔（F-W17 已改）。

### 1.5 验收口径

1. **可机判**：MCP 行 ✕ 点击 ⇒ **不立即发 `deleteMcpServer`**；确认 ⇒ 发；取消 ⇒ 零发值 ∧ 行内不变。
2. **零回归**：provider 行（两处载体）单击即删用例保持绿。
3. `thincoder-vscode` `npm test` 全绿；`doc-check` 按档归属零新增。

## §2 批次任务与设计

（eng-designer 写）

（eng-designer · **initial 轮** 2026-09-18）

**落点（单源 · D2）** = `docs/vsc/design/SETTINGS.md` §2.10（类判据 / 入口册 5 行 / 弹框契约 / 四条取消路径 / 载体 / 判据域边界）· UI 决策 = 同档 §5 U-S11 · 残留登记 = 同档 §3（本批 +2 条）。本段 = 批次面（逐条设计 / 决策 / 受影响文件 / 用例 + 先红 / AC / 零回归锚 / 上抛），**不重述机制**。

### 2.1 逐条设计（回指 §1.2 ①）

| 面 | 设计要点（落点 = `SETTINGS.md` §2.10） | 判据（用例号见 §2.4） |
|---|---|---|
| **类判据（扩域）** | 由「密钥 / 令牌 / 凭证类」重述为**可复得性**判据：删除使凭证原文随条目消失 ⇒ 不可复得类（必确认）；仅使可重填配置消失 ⇒ 可重填类（单击即删）。需求侧对位映射落 §2.10（「密钥 / 令牌 / 凭证类」≙ 不可复得类；「非密钥类（provider 行）」≙ 可重填类） | §2.10 判据句；机判 = W17-17（域内 4 名全落本门） |
| **入口册 #5 改判** | MCP server 行 ✕：可逆类 ⇒ **不可复得类**（删整条时 token / headers 一并消失——同 `thincoder-vscode/src/config-mcp.mjs:52-54` 语义）；归类按**条目整体**（不按 transport 分叉：行内不显凭证在场与否 ⇒ 分叉须新可见面 + 两分支两判据） | W17-16（点击不即发 ∧ 确认面在位）/ W17-19（确认后恰 1 条） |
| **两处载体（明示）** | **生成位** `thincoder-vscode/webview/settings-tools.js:187`（`.mcp-del-btn` 钮字面）**逐字零改**；**绑定位** `:191-195` 改门名（`_confirmDelete` → `_confirmSecretDelete`）+ 载荷闭包改**开框时捕获**（`const name = btn.dataset.name` 于 click 时取值）。绑定形态（`addEventListener`）零改——MCP 行不入 `renderKeyRow` 单点装配域 | W17-25（多行取目标不取首行）/ W17-23（在位重绘：不改目标 / 不吞确认——**不判闭包形态**，见 §2.4） |
| **确认形态 / 取消 / 文案** | 复用既有弹框单源（`thincoder-vscode/webview/settings-widgets.js` `showConfirmPopover` + 清除入口）——**零新增件 / 零新增 CSS**；四条取消路径同 §2.10（零发值 ∧ 行内状态复原）；文案 = **复用既有键 + 值级改写为类通用式**（**净增文案键 = 0 · 键数不变 · 键名不动**——父侧 2026-09-18 裁定（评审发现 5 的 ② 案）；改写值 zh / en = `SETTINGS.md` §2.10 文案条） | W17-20 / W17-21（取消：MCP 专属例）/ W17-22（跨入口单例）/ W17-24（i18n 双源——断言取档值） |
| **协议 / 宿主** | 确认 = webview 侧门（确认动作内才 `postMessage`）⇒ 消息名与载荷**零增**（`{type:"deleteMcpServer",name}` 逐字不变）；宿主删除语义（`thincoder-vscode/src/**`）**零改** | AC-FW17B-5（`git diff thincoder-vscode/src` 空 + `protocol-coverage-reverse` 绿） |
| **零回归锚** | provider 行**两处载体**逐字不变（`thincoder-vscode/webview/settings-providers.js:182` 行内 `onclick` · `:48-49` 编辑行取消重建位 · `:65` `_removeProvider` 直通）；密钥类既有面保持绿 | W17-14 / W17-15（恒绿）+ AC-FW17B-3（结构面复核） |

**设计轮实测（先红形态硬读数 · happy-dom 直驱真模块 · 本席实跑）**：

- **现态点击即发**：打开面板（真 `openSettings` → `#settings-btn` + `agentSettings` 回拍）→ `mcpStatus{servers:[{name:"srv1",desc:"stdio: npx",...}]}` → 点 `.mcp-del-btn` ⇒ 新增消息 = `[{"type":"deleteMcpServer","name":"srv1"}]` ∧ `.auto-confirm` = **0** ∧ `.auto-backdrop` = **0**（**无确认面**）；
- 门**已在位**（`typeof window._confirmSecretDelete === "function"`——`thincoder-vscode/webview/settings.js:48-55`）⇒ 本批缺口 = **入口未过门**（非门缺失）；
- 现用例档复跑 = **18/18 pass**（含 W17-16「MCP 行 ✕ ⇒ 恰 1 条 `deleteMcpServer` ∧ 零弹框」——该例 = 本批**恒绿锚转先红**的读数；命令 = `cd thincoder-vscode && node --test test/settings-secret-delete-confirm.test.mjs`）。

### 2.2 关键决策记录（含否决备选）

| # | 决策 | 否决备选 / 理由 |
|---|---|---|
| D-M1 | 入口册 #5 判入**不可复得类**（用户 2026-09-18 22:21 裁定落地） | 否决「保持单击即删」：删整条时 token / headers 不可复得（原判据前提不成立）；否决「按 transport 分叉（stdio 直删 / http·ws 确认）」：行内不显凭证在场与否 ⇒ 分叉须新可见面 + 两分支两判据 |
| D-M2 | 类判据按**可复得性**重述（类名 = 不可复得类 / 可重填类） | 否决「保留『密钥类』名 + 加附注」：类名与判据不同源 ⇒ 漏标即 fail-open（两门设计的立足点 = 名字即类） |
| D-M3 | 确认形态**复用**既有弹框单源 | 否决「MCP 专用确认件 / 行内二次点击」：前者 = 同机制二次实现（违 D2）；后者否决理由四条已在 §2.10（行被整行重绘 / 取消路径无判据 / 布局 / 同族先例） |
| D-M4 | 载荷闭包改为**开框时捕获**（`const name = btn.dataset.name`） | 否决「保留确认时读 `btn.dataset.name`」：违 §2.10「载荷闭包 = 开框时捕获（不是确认时读 DOM）」既有判据（弹框在位期间列表会被 `mcpStatus` 推送整表重绘） |
| D-M5 | 文案 = **复用既有键 + 值级改写为类通用式**（父侧 2026-09-18 裁定 · 评审发现 5 的 ② 案） | 否决「新增 MCP 行专用键」：值级改写已达贴合（键数 / 键名零动），新键 = 多一维护面；写域 +`locales/{en,zh}.json` 两档（**§1.4 写域未列——待父侧补列，见 §2.8 #8**） |
| D-M6 | 用例承载 = **既有档扩例**（W17-16 / W17-17 同号改判 + W17-19…W17-25 新增） | 否决「新档」：结构对账（W17-17）须与 4 入口同档单一权威 + 夹具与用例序列共享。**拆分计划** = 若实测越 500 硬限 ⇒ 同批拆出 MCP 组（新档 + `test/files.mjs` 登记，夹具经 `test/helpers/webview-env.mjs` 共享）；**300 线复核结论 + 组边界 / 触发阈值 = `SETTINGS.md` §3**（本批不拆） |
| D-M7 | 不引入撤销机制 · 不改宿主删除语义 · 协议零增 · 不动 provider 行（承用户口径 + §1.3） | —— |

### 2.3 受影响文件表（行数 as-of 2026-09-18 本席实测 · Δ = 预估）

**行数口径（D3）**：`wc -l` 等价 `split("\n")` 去尾空行（本表同值；如 `settings-tools.js` split 396 / `wc -l` 395）。

| # | 文件 | 现况 → 预估（Δ） | 面 |
|---|---|---|---|
| 1 | `thincoder-vscode/webview/settings-tools.js` | 395 → ~397（+2） | 绑定位 `:191-195`：门名改判 + 载荷闭包开框时捕获（注释行由实现轮自定）；生成位 `:187` 零改。**tier 说明**：改动前即在 300 建议线之上、远未近 500 硬限；本批增量不改结构 / 不增职责 ⇒ **拆分复核结论 + 组边界 / 触发阈值 = `SETTINGS.md` §3**（本批不拆） |
| 2 | `thincoder-vscode/webview/settings.js` | 138 → 138（±0） | **注释自述同步**（`:42` 可直发类实例收窄为 provider 行；`:44-47` 不可复得类定义按判据重述）——**零代码 / 零行为**；`_confirmDelete`（`:43`）/ `_confirmSecretDelete`（`:48-55`）/ `closeSettings()`（`:116-122`）逐字零改（写域说明 = §2.8 #1） |
| 3 | `thincoder-vscode/test/settings-secret-delete-confirm.test.mjs` | 333 → ~415（+~82） | W17-16 / W17-17 同号改判 + W17-19…W17-25 新增 7 例 + 头注同步；**300 线复核结论**（本批不拆）+ 组边界 / 触发阈值 = `SETTINGS.md` §3；越 500 硬限即按 D-M6 同批拆 |
| 4 | `thincoder-vscode/test/files.mjs` | 95 → 95（±0） | 同档扩例 ⇒ 清单零变 |
| 5 | `docs/vsc/design/SETTINGS.md` | 292 → **346**（+54——initial 轮 **+26**（实读 318；原记 317 差 1 收正）+ fix 轮 **+28**） | §2.10 类判据重述 + 入口册 #5 改判 + #4 受裁例外 + MCP 行载体段 + 文案条 + 机检面 / 判据域边界同步；**fix 轮** = 受裁例外本体条 + 载荷闭包判别面 + 取消路径覆盖列 / 完备性注 + 文案类通用式 + W17-25 范围 + 命名形态依赖 + §3 +2 拆分登记 |
| 6 | `thincoder-vscode/locales/en.json` | 259 → 259（±0 行 · **值级改写 1 行**） | `settings.secretDeleteConfirm`（`:173`）值改类通用式（本档入写域 = fix 轮定案——§2.8 #8）；键名 / 键数（257 键）/ 其余键零改 |
| 7 | `thincoder-vscode/locales/zh.json` | 259 → 259（±0 行 · **值级改写 1 行**） | 同键 zh 逐字（改写值 = `SETTINGS.md` §2.10 文案条） |
| 8 | 零改面（实测） | — | `thincoder-vscode/webview/settings-providers.js`（269 逐字）· `webview/settings-widgets.js`（109）· `webview/chat.js` · `webview/controls.css` · `webview/session-bar.js` · `webview/mode-buttons.js` · `thincoder-vscode/src/**` · `thincoder-core/**`（只读——张力证据面）· `docs/vsc/design/WEBVIEW-PROTOCOL.md`（0）· 需求档（父侧笔）· 他批档 / `_archive/**` |

### 2.4 用例表（正常 / 取消 / 边界 / 双源 / 结构对账）+ 先红形态

**档** = `thincoder-vscode/test/settings-secret-delete-confirm.test.mjs`（同档扩例）；夹具 = `test/helpers/webview-env.mjs`（happy-dom + 全量 id 夹具）+ 真 `chat.js` / `settings.js` / 卡模块；驱动 = 真 DOM `.click()`。

| 编号 | 组 | 输入 / 动作 | 期望（断言级） |
|---|---|---|---|
| W17-16（改判） | 正常 · **必红** | 打开面板 → `mcpStatus{servers:[srv1（stdio，无 token）]}` → 点 `.mcp-del-btn` | `capturedPosts` **零增** ∧ `.auto-confirm` = 1 ∧ `.auto-backdrop` = 1。**先红读数 = 点击即 1 条 `{"type":"deleteMcpServer","name":"srv1"}` ∧ 弹框 0**（条目级归类：stdio 无 token 亦须确认） |
| W17-19 | 正常 · **必红** | 同 W17-16 → 点 `.auto-confirm-yes` | 恰 1 条 `{type:"deleteMcpServer",name:"srv1"}` ∧ 弹框 + 遮罩移除。**先红读数 = 无框可依** |
| W17-20 | 取消 · **必红** | 开框 → 点 `.auto-confirm-no` | 零发值（任何消息）∧ 弹框 / 遮罩移除 ∧ MCP 行 `outerHTML` **逐字同**点击前（行内状态复原） |
| W17-21 | 取消 · **必红** | 开框 → 点 `#settings-close` | 零发值 ∧ 弹框 + 遮罩移除（`closeSettings()` 同清路径覆盖 MCP 入口） |
| W17-22 | 边界（跨入口单例）· **必红** | MCP ✕ → websearch ✕ → 确认 | 弹框恒 **1** ∧ 零发值；确认后恰 1 条 `deleteWebsearchKey` ∧ **零** `deleteMcpServer`（动作只属最后一次开框） |
| W17-23 | 边界（弹框在位时整表重绘）· **必红** | 开框（srv1）→ 派发 `mcpStatus`（`renderMcpList` 整表重绘）→ 确认 | 弹框在位态不被打断 ∧ 恰 1 条 `{type:"deleteMcpServer",name:"srv1"}`——**本例判「在位不改目标 / 不吞确认」，不判别闭包形态**（整表 `innerHTML` 重建 ⇒ 旧钮脱离后 `dataset.name` 仍原名：两形态同载荷；闭包形态 = D-M4 代码面复核——评审 id=116 发现 9） |
| W17-24 | i18n 双源 · **必红** | 注入 zh / en 全文 → 开框（MCP 行） | 正文 === 该 locale 的 `settings.secretDeleteConfirm`（**≠ 键名**——缺键回退即红）；两 locale 逐条。**断言取档值不取字面** ⇒ 值级改写（类通用式）后同断言成立 |
| W17-25 | 边界（多行列表取目标）· **必红** | `mcpStatus{servers:[srv1, srv2]}` → 点**第 2 行** ✕ → 确认 | 恰 1 条 `{type:"deleteMcpServer",name:"srv2"}` ∧ **零** `srv1`（不取首行——载荷取点击钮的 `data-name`） |
| W17-17（改判） | 结构对账（fail-closed） | 扫**设置面档** `thincoder-vscode/webview/settings*.js` 的 `postMessage` 顶级 `type` ∈ `delete*` 集 + `_confirmSecretDelete(` / `_confirmDelete(` 实参区间 | 域内 `delete*` 全集 = **4 名** = {`deleteProviderKey` · `deleteEmbedKey` · `deleteWebsearchKey` · `deleteMcpServer`} ⇒ **每处发射落在 `_confirmSecretDelete` 实参括号内**（逐名 gated == total）；`_confirmDelete(` 实参内 `delete*` 发射 = **0**；域外 `deleteSession`（`thincoder-vscode/webview/session-bar.js:104`）不入集；**未登记新 `delete*` 判别式 ⇒ 红 + 点名** |

**取消路径的入口级覆盖（评审 id=116 发现 10 · 与 `SETTINGS.md` §2.10 取消路径表同源）**：MCP 入口持**专属例** = #1 取消钮（W17-20）与 #4 关面板（W17-21）；
#2 遮罩 / #3 框内 Escape 的处理器在**弹框件内**（`webview/settings-widgets.js:80` / `:97-101`），入口侧零专属代码 ⇒ 由密钥类批**同件** W17-6 / W17-7 **等价覆盖**（不另设 MCP 例；不按「逐入口 × 四条路径全列出例」读）。

**先红 / 恒绿汇总**：

- **先红档** = W17-16 / W17-19…W17-25（现态：点击即发 1 条 + 弹框恒 0；W17-24 无框可依；W17-17 按改判后形态对账 ⇒ `deleteMcpServer` 不在门内 = 3/4）；
- **恒绿档（零回归锚）** = **W17-14 / W17-15**（provider 行两处载体单击即删——本批若触碰该两处即转红）+ 密钥类既有面 **W17-1…W17-13 / W17-18**（同档同夹具，须原样保持绿）；
- 改判两例（W17-16 / W17-17）在**现态源码下必红**（其断言对象 = 新归类）；W17-16 旧断言（单击即删 ∧ 零弹框）**随改判退场**——该零回归锚由 W17-14 / W17-15 承接（MCP 行不再属可直发类）。

### 2.5 验收标准（回指 F-W17 扩域判据句 · 逐条机判）

| AC | 回指 | 判据（命令 + 断言） |
|---|---|---|
| AC-FW17B-1 | 判据句「点击 ⇒ 出现确认；确认后才发」 | `cd thincoder-vscode && node --test test/settings-secret-delete-confirm.test.mjs` 全绿（W17-16 / W17-19；先红读数在册） |
| AC-FW17B-2 | 「取消 ⇒ 零发值」 | W17-20 / W17-21 全绿（含 MCP 行 `outerHTML` 逐字复原）∧ 路径 #2 / #3 由**同件** W17-6 / W17-7 覆盖（等价覆盖注 = §2.4 · 不按逐入口四路径读） |
| AC-FW17B-3 | 「非密钥类（provider 行）行为零回归」 | W17-14 / W17-15 恒绿 ∧ `git diff thincoder-vscode/webview/settings-providers.js` **空**（`:48-49` · `:65` · `:182` 逐字复核） |
| AC-FW17B-4 | 「所有不可复得类删除入口 ⇒ 必过一次确认」（fail-closed 结构面） | W17-17 全绿（域内 4 名逐名 gated == total ∧ `_confirmDelete` 实参内 `delete*` = 0） |
| AC-FW17B-5 | §1.3「不改宿主删除语义 / 协议零增」 | `git diff thincoder-vscode/src` **空** ∧ `node --test test/protocol-coverage-reverse.test.mjs` 全绿 |
| AC-FW17B-6 | 「i18n 双语文案在册（类通用式）」 | W17-24 全绿 ∧ **键数不变**：两档 **259 ±0 行**（各 257 键）∧ `git diff --numstat thincoder-vscode/locales` **恰 2 行**且各为 `1 1`（= 每档恰 1 处**值级改写**——`settings.secretDeleteConfirm` 单键）∧ 改写值逐字 = `SETTINGS.md` §2.10 文案条（键名 / 其余键零改） |
| AC-FW17B-7 | §1.5-3 总门 | `cd thincoder-vscode && npm test` 全绿 ∧ `npm run lint` = OK |
| AC-FW17B-8 | 文档面 | `node scripts/doc-check.mjs --root .` **按档归属零新增**（读数 as-of fix 轮 = 悬空 **5** · 行宽 **11**——与开工基线同值；`SETTINGS.md` / 本批档不在失败列） |

### 2.6 零回归锚（列断言）

| # | 入口 / 面 | 载体（本批**零改动**） | 断言 |
|---|---|---|---|
| R1 | provider 行 − | `thincoder-vscode/webview/settings-providers.js:182`（卡 HTML 行内 `onclick`）+ `_removeProvider`（`:64-66` 直通） | 单击 ⇒ 恰 1 条 `{type:"removeProvider",name}` ∧ 零弹框（W17-14） |
| R2 | provider 编辑行取消重建 − | 同档 `:48-49`（`_editKey` 的 `onCancel` 重建位） | 同 R1（W17-15） |
| R3 | 密钥类既有面 | `thincoder-vscode/webview/settings-tools.js:27-29` / `:45-47` · `webview/settings-providers.js:56-58` · `webview/settings.js:48-55` | W17-1…W17-13 / W17-18 原样保持绿；`_confirmSecretDelete` 函数体逐字零改 |
| R4 | `_confirmDelete` 直通语义 | `thincoder-vscode/webview/settings.js:43`（函数体 `action()` 逐字不变——仅 `:42` / `:44-47` 注释自述同步） | 调用点收敛为 **1**（`settings-providers.js:65`）；`_confirmDelete(` 实参内 `delete*` 发射 = 0（W17-17） |
| R5 | MCP ✕ 的**生成位** | `thincoder-vscode/webview/settings-tools.js:187`（类名 / `data-name` / 钮字面） | 逐字零改（结构面：`mcp-del-btn` 载体串在位） |

### 2.7 边界（不做）

不改宿主删除语义（`thincoder-vscode/src/**` 零改——`config-mcp.mjs` / `settings.mjs` / `panel-messages.mjs` 全零）· **不引入撤销机制**（用户 21:07 口径）· 不动 provider 行（两处载体 + 直通体逐字零改）· 不新增协议形态（消息名 / 载荷字段零增）· 不新增 CSS / 不改弹框件 · 不动 MCP 编辑表单的 token / headers 清空语义（表单路径 ≠ 删除按钮判据域——22:13 裁定 ③ 在册）· 不并入 `renderKeyRow` 单点（结构改动越本批目的）· 不改需求档（父侧笔）· 不改已收口批档与 `_archive/**` · 不碰 `thincoder-core/**` / `thincoder-cli/**` · **`locales/` 只改 `settings.secretDeleteConfirm` 单键值**（键数 / 键名 / 其余键零改——判据 = AC-FW17B-6）。

### 2.8 上抛项（父侧 / 评审面）

| # | 级别 | 发现 | 建议处置 |
|---|---|---|---|
| 1 | 🟡 | **写域外 1 档（已并入受影响表 #2）**：`thincoder-vscode/webview/settings.js` 注释自述在改判后**失实**——`:42`「reversible class only (provider rows / **MCP servers** can be re-added)」· `:44-47` 不可复得类定义按密钥类写就 ⇒ 设计与实现须同步该注释块（±0 行、零代码 / 零行为）。§1.4 写域未列该档；且用户 2026-09-18 已有裁定「**失效的表达一定要删掉**」（`docs/batches/2026-09-18-stale-expression-purge.md`）——留失实自我描述违该口径 | 父侧裁：认可（建议）或改为另批；不认 ⇒ 实现轮零改该档，注释失实入册 |
| 2 | 🟡 | **【已消解 · 评审 id=116 发现 2 核销】原记：需求档 F-W17「实测入口册」未含 MCP 行 + 坐标陈旧**（实测册只列 3 条 · 坐标落后实读 +7）——**现况已收正，本项作废**：`docs/vsc/requirements/WEBVIEW.md:34` 现册 = **4 条**（live 2 = `settings-tools.js:270` websearch ✕ / `:283` 嵌入 ✕ + 死 handler 1 = `settings-providers.js:56-58` + MCP server 行 ✕ = 须确认类），掩码位 = `:267` / `:280`（父侧 21:2x / 22:2x 已落——见需求档变更记录） | 无需动作（已消解——本设计入口册（`SETTINGS.md` §2.10）与需求档现册逐条同源）；不再重复执行收正 |
| 3 | 🟡 | **provider 行 − 的凭证归类张力**（本批为该张力第二次被登记）：provider 行条目内含 `apiKey`（写入 `thincoder-core/config-io.mjs:201-208` · 删条目 filter `:262-277`）⇒ 删行同时移除 key 原文——按可复得性判据与 MCP 行**同类**；且「删整条含 key」比已在门内的「只删 key」（`_delKey`）更具破坏性 | **【已裁 ② · 已落】**（父侧 2026-09-18 本轮 · 评审 id=116 发现 1②）= 明列为判据例外并写明裁据——例外本体 = `SETTINGS.md` §2.10 类判据的受裁例外条（provider 行保持单击即删）；张力本体仍在册（`SETTINGS.md` §3——到期 = provider 面下次被触碰时） |
| 4 | 🔵 | **【已裁 ② · 待实现轮交付】本门弹框文案的类贴合度**：`settings.secretDeleteConfirm` 原按密钥类写就（「该密钥」·「界面只显示 ****」）——对 MCP 行两处措辞不成立（列表行不显掩码、删除目标 = 整条 server 条目） | **裁 = ② 本键文案改类通用式**（父侧 2026-09-18 本轮 · 评审 id=116 发现 5）——值级改写 · 键数不变 · 键名不动；改写值 = `SETTINGS.md` §2.10 文案条；实现轮落 `locales/{en,zh}.json:173`（受影响表 #6 / #7）；判据 = AC-FW17B-6（原「`git diff locales` 空」已随之作废） |
| 5 | 🔵 | **批档 §1 机读状态行补足（本席落笔 · 明示）**：§1 段内原无 `**状态行**：` 前缀行（状态行仅存档头 `:3` 引用块 ⇒ 在 `## §1` 段外）⇒ `batch_segment` 按 `BATCH-RECORD.md` §4.9 判「不可解析」**拒写全档**。本席在 `## §1` 标题下**增 1 行机读状态行**（值逐字同档头行；§1 其余内容一字未改）——形态收正（一致性面 · 无内容授权），明示上报 | 父侧裁：认可（建议——与 `vsc-key-delete-confirm` 档同形态）或回退该行并改由父侧落笔 |
| 6 | 🔵 | **先红读数口径**：本席先红读数 = **实跑**（inline 探针 + 现用例档复跑 18/18——见 §2.1 实测段）；探针**零仓内写入**（不落档）。另：`SETTINGS.md` 本轮两处机检自捕获（新增段 1 行 344 字符超宽 + 1 条符号·宽报告行）**均当场收正**，复跑回基线 | 无需动作 |
| 7 | 🔵 | **`thincoder-vscode/webview/settings-providers.js` 行数**：现 269（前批 §5.2 同值）——本批零改（仅结构面复核） | 无需动作 |
| 8 | 🟡 | **§1.4 写域与 fix 轮定案不同步（父侧笔 · 本席只报）**：① 评审发现 5 的 ② 案（文案值级改写）⇒ 写域 +`thincoder-vscode/locales/en.json` / `locales/zh.json` 两档（受影响表 #6 / #7）；② 发现 3 的 `webview/settings.js` 注释同步（受影响表 #2）。而 §1.4 写域（`:31`）现仍只列 `settings-tools.js` + 用例档 + `test/files.mjs` + `SETTINGS.md`（本席实读 as-of 22:3x；父侧所述「已自落 1① / 3 / 6 / 7」的落点在本席实读时尚未见于 §1.4 / 需求档——值机读时点差异，仅报不改） | 父侧在 §1.4 补列两档（`locales/` ×2 + `webview/settings.js`）——与发现 3 同笔落地；不改则实现轮缺写域依据（写域外改动 = 越界） |

**三链对齐（自检）**：批档 §2 条目（§1.2 ① F-W17 扩域）↔ 设计档 `SETTINGS.md` §2.10 入口册 #5 + 判据句 ↔ 需求档 F-W17 判据句（映射句落 §2.10；实测册差集 = 无——§2.8 #2 已消解核销）。

（eng-designer · **fix 轮（设计评审轮 1 后）** 2026-09-18）

**裁决**：评审 id=116 = **PASS**（🔴 0 · 🟡 7 · 🔵 4）——父侧逐条裁定：发现 **1① / 3 / 6 / 7 = 父侧自落**（需求档 / §1）；发现 **1② / 2 / 4 / 5 / 8 / 9 / 10 / 11 共 8 项由本席逐号落地**（`Suggestion` 列 = 建议；处置执行人 = 本席）。
**段内处置（append-only 例外已打标）**：§2.1 ×2 / D-M5 / D-M6 / §2.3 #1·#3·#5（+新增 #6·#7 两行，原零改面行顺延 #8）/ §2.4 W17-23·W17-24·W17-17 区（+覆盖注）/ §2.5 AC-2·AC-6·AC-8 / §2.7 / §2.8 #2·#3·#4（+#8）= **就地校正**（D3 计数与清单同改；残留以现值为准）。
**零新语义**：八项均为评审发现 + 父侧裁定的直接导出项（无新需求条目、无新用例号、无实现面改动；受影响表新增 #6 / #7 = 已裁定改动面的补列）。

| 号 | 级别 | 处置 | 落点（file:line = as-of fix 轮末） | 读数 |
|---|---|---|---|---|
| 1② | 🟡 | provider 行**受裁例外 + 裁据**写进 §2.10 **类判据句本体**（判据句 ↔ 实例册同读一致）；§3 归类面登记标**已裁 ②** | `SETTINGS.md:158-160`（例外条）· `:164`（对位句）· `:180`（入口册注）· `:263-264`（§3） | 判据句现三块：不可复得类 `:156` / 可重填类 `:157` / **受裁例外 `:158-160`**（裁据两条 = 需求档 F-W17 明列 + 用户 22:21 裁定射程）；入口册 #4（`:174`）「可重填类（**受裁例外**）」与之同读 |
| 2 | 🟡 | 上抛 #2 标注**已消解**（写明现况） | 批档 `:149` · 三链自检句 `:157` | 需求档 `WEBVIEW.md:34` 实读 = **4 条**（`settings-tools.js:270` / `:283` + `settings-providers.js:56-58` + MCP server 行 ✕）；掩码位 `:267` / `:280`；三链差集改「无」 |
| 4 | 🟡 | §3 补**两条拆分登记**（300 线复核结论 + 组边界 + 触发阈值 + 到期条件）；§2.3 #1 / #3 与 D-M6 同点改指 | `SETTINGS.md:271-274`（`settings-tools.js`）· `:275-278`（用例档）· 批档 `:83` / `:85` / `:74` | 实读：`settings-tools.js` **395**（`wc -l` 口径 / split 396）· 用例档 **333**；拆出目标两档带 `（拟新增` 标记（列报 · 不入闸） |
| 5 | 🔵 | 文案改**类通用式**（值级改写 · 键数不变 · 键名不动）+ **AC-FW17B-6 同步修订**；§3 文案面登记标**已裁 ②** | `SETTINGS.md:205-209`（改写值 zh / en 在册）· `:267-268`（§3）· 批档 `:126`（AC）· `:55` / `:73` / `:88-89` / `:151` | zh = `确定删除？删除后无法恢复——凭证原文不可复得，只能重新配置或回服务商重取。`；en 同义句（`:208`）。实读 `locales/{en,zh}.json`：各 **259 行 / 257 键**（键数基线在册）；AC 判据 = `git diff --numstat thincoder-vscode/locales` 恰 2 行各 `1 1` |
| 8 | 🔵 | 机检面范围 `W17-1…W17-24` → **`W17-1…W17-25`** + 边界括注补「**多行取目标**」 | `SETTINGS.md:240` | 与批档 §2.4 用例表（W17-25 = 多行取目标）同域；批档侧无需改（本就用例表在册） |
| 9 | 🔵 | W17-23 描述**收窄**为「在位不改目标 / 不吞确认」+ 明示**不判闭包形态** | `SETTINGS.md:200-201`（载荷闭包 + 判别面明示）· 批档 `:103`（W17-23 行）· `:54` | 实读 `renderMcpList`：`list.innerHTML = servers.map(…)`（`settings-tools.js:173-190`）⇒ 旧钮脱离 DOM、`dataset.name` 仍原名 ⇒ 两形态同载荷（发现 9 前提成立）；闭包形态改由 D-M4 代码面复核守 |
| 10 | 🔵 | **采等价覆盖**（不补两例）：§2.10 取消路径表补**入口级覆盖列** + 「逐入口完备性」注；批档 §2.4 补同源注；AC-FW17B-2 同点补 | `SETTINGS.md:213-217`（表）· `:220`（触点收敛注拆出）· `:222-223`（完备性注）· 批档 `:108-109` · `:122` | 实读 `settings-widgets.js`：遮罩 click `:80` / 框内 keydown `:97-101` 均在**件内**（入口侧零专属代码）⇒ #2 / #3 由密钥类批 W17-6 / W17-7 同件覆盖成立；MCP 专属例 = W17-20（#1）/ W17-21（#4） |
| 11 | 🔵 | §2.10 判据域边界补**命名形态依赖**（fail-closed 域 = `delete*` 命名集） | `SETTINGS.md:248` | 域内 `delete*` = 4 名（`settings-providers.js:57` · `settings-tools.js:26` / `:43` / `:186`）；`removeProvider` 非 `delete*` 名不入集（由动作面 W17-14 / W17-15 覆盖） |

**本轮边界（守）**：实现面代码零改（`thincoder-vscode/**` 零 diff）· 需求档零改（父侧笔）· 批档 §1 零改（父侧笔）· §3 评审段零改 · 他批档 / `_archive/**` 零改 · 用例号零增（仍 W17-1…W17-25）· 机制条文除上述八项同点改笔外零改。
**机检读数（复跑 `node scripts/doc-check.mjs --root .`）**：锚 **悬空 5** · 行宽 **11**——与开工基线同值 ⇒ **按档归属零新增**（设计档 / 本批档均不在失败列）；`拟新增` 列报 12 → **13**（+1 = `thincoder-vscode/webview/settings-mcp.js`——拆分计划前向引用，列报 · 不入闸）。轮内自捕获 1 条：取消路径 #4 行加第 4 列后 **322 字符超宽** ⇒ 当场把「触点收敛」父注拆为独立注行，复跑回 11；另 `test/files.mjs` 简写形态一度被判为拟新增列报 ⇒ 改全限定路径后消。
**待裁（1 项 · 非阻断）**：§1.4 写域未列本次定案新增的 `locales/en.json` / `locales/zh.json` 两档与发现 3 的 `webview/settings.js`（父侧笔）——已登记 §2.8 #8；落地前实现轮无写域依据。

## §3 设计评审记录

（评审子代理写）

### 轮次 1（评审子代理）

**评审面**：设计轮 · 范围 = `docs/vsc/design/SETTINGS.md`（§2.10 / §3 / §5 U-S11）· `docs/batches/2026-09-18-vsc-mcp-delete-confirm.md`（§1–§2）· `docs/vsc/requirements/WEBVIEW.md`（F-W17）。为核受影响表行数与本设计坐标，抽读被引源档（`webview/settings-tools.js` · `settings.js` · `settings-widgets.js` · `settings-providers.js` · `controls.css` · `settings.css` · `locales/{en,zh}.json` · `test/settings-secret-delete-confirm.test.mjs`）——仅作证据抽核，未作评审对象。

**抽核通过**（与设计陈述一致）：`settings-tools.js` split 396 / `wc -l` 395（表注同口径）· `settings.js` 138 · 用例档 333 · `settings-providers.js` 269 · `settings-widgets.js` 109；入口册坐标逐条命中（`:270` · `:283` · `:187` · `:191-195` · 掩码 `:267`/`:280` · `renderKeyRow :305-315` · `settings.js:43`/`:48-55`/`:116-122`）；域内 `delete*` 全集实读 = 4 名、`_confirmDelete(` 实参内 `delete*` = 0、调用点现 2 → 改判后 1；域外仅 `deleteSession`（`session-bar.js:104`）；`.auto-confirm` z-index 1000 > 面板 20（`controls.css:599` / `settings.css:7`）；`_delKey` 确无 UI 调用点；`git diff` 类 AC 在 `thincoder/`（`.git` 于 `thincoder/.git`）下可执行。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership / Requirements fit | 🟡 | 类判据两处并存且措辞不同源：需求档 F-W17 判据句按「密钥 / 令牌 / 凭证类」/「非密钥类」分类（`WEBVIEW.md:34`），设计档改按可复得性重述并自称「本节的单源判据句」（`SETTINGS.md:154`），映射句只落设计侧（`SETTINGS.md:161`）；同档内判据句与实例册亦不自洽——判据只二分且不含例外，实例册 #4 标「可重填类（受裁例外）」（`SETTINGS.md:171`），§3 又承认该行按判据与 #5 同类（`SETTINGS.md:177`）。五个现册入口产出行为一致（非机制级冲突），但「单源」句与实例册对新增入口可给出不同归类 | ① 需求档 F-W17 判据句的类名同步为可复得性口径（实测册仍为权威），或把 ≙ 映射句写进该条；② 把 provider 行例外及裁据（用户 22:21 / 需求档明列）写进 `SETTINGS.md` §2.10 类判据句本体，使判据句与实例册同读一致（或按 §3 另一选项并入本门） |
| 2 | Doc-state（cross-file lag） | 🟡 | 批档上抛 #2 的前提与现行需求档不符：该条称 F-W17 实测册「仍只列 3 条」且坐标落后实读 +7（`:263`→`:270` · `:276`→`:283`），而 `WEBVIEW.md:34` 现册为 4 条（已含 MCP server 行 ✕ = 须确认类；掩码位 `:267`/`:280`）且入口坐标已是 `:270`/`:283` | 把上抛 #2 改写/标注为「已消解（需求档已含 MCP 行 + 坐标已收正）」，避免同一收正被再执行一遍 |
| 3 | Scope | 🟡 | 受影响表 #2 将 `thincoder-vscode/webview/settings.js`（注释自述同步，±0 行、零代码）纳入实施面，而 §1.4 写域未列该档（`…mcp-delete-confirm.md:31`；设计自报见 `:84`/`:143`）；不做的后果是源码注释 `:42`「reversible class only (provider rows / MCP servers can be re-added)」与改判后的类判据相反 | 落一次写域裁定：批准该档注释同步，或把注释同步拆出为独立登记项（消解路径 + 到期条件）——两种走法在实现轮开工前定，避免实现轮临场取舍 |
| 4 | Affected-file size / tier | 🟡 | 受影响表 #1 `webview/settings-tools.js` 现况在 300 建议线之上（表注 395 · 实读 split 396/`wc -l` 395，已核），该行「tier 说明」把拆分留在「另行评估」（`:83`）——无拆分计划亦无到期条件；#3 用例档 333 → ~415 同越 300 线，D-M6 的计划只以 500 硬限为触发（`:74`） | 在 §3 残留登记补两条（或表内补列）：`settings-tools.js` 与用例档的 300 线拆分复核结论 + 到期条件（如「MCP / provider 面下次结构改动时」），或写明拆分计划（组边界 + 触发阈值） |
| 5 | Requirements fit / i18n | 🟡 | 确认文案沿用密钥类键 `settings.secretDeleteConfirm`（`locales/en.json:173` / `zh.json:173`：「该密钥」「界面只显示 ****」），对 MCP server 行两处措辞不成立（列表行显名/desc/transport、无掩码位；删除目标 = 整条条目）——设计已登记（`SETTINGS.md:255`）+ 上抛 4（`:146`），但本批若维持复用即携不准确文案上线 | 二选一并同步改 AC：① 新增 MCP 行专用 locale 键（写域 +`locales/`，AC-FW17B-6 的「`git diff locales` 空」须同改）；② 本键文案改类通用式（同样破 AC-6）；若维持复用，把裁据写进 §3 该条并加注 AC-FW17B-6 |
| 6 | Methodology | 🟡 | 批档 §1（父侧段）内被补入机读状态行（`…mcp-delete-confirm.md:9`，自述「本席落笔 · 明示」并给回退选项）——段作者边界被跨；根因（§1 模板只在档头引用块持状态行，而 `BATCH-RECORD.md` §4.9 解析对象 = 「§1 段内 `**状态行**：` 前缀行」）会每批复现 | 对该行做一次追认或回退裁定，并把 §1 模板形态与 §4.9 解析要求对齐，使后续批次不再需要跨作者补行 |
| 7 | Doc-state（requirements hygiene） | 🟡 | 需求档三处滞后：① `WEBVIEW.md:64`「待用户裁 1 项」仍悬，而同档变更记录 21:1x 条已记「由此结清」（`:144`）；② 设计意图 I-9（`:52`）与 `:62`「单击即删（`webview/settings.js:41`）」坐标陈旧（单击即删门现在 `:43`，已核）；③「勿误修」措辞未反映 F-W17 对不可复得类的剪除 | 删/闭合「待用户裁 1 项」；`:41` 收正为 `:43`；在 I-9 与 `:62` 加 F-W17 剪除注（不可复得类不过本意图） |
| 8 | Clarity / 判据域 | 🔵 | `SETTINGS.md:228` 机检面列 W17-1…W17-24，而本批用例表新增到 W17-25（多行列表取目标）；该边界也未出现在设计档用例边界括注 | 机检面范围改 W17-1…W17-25 并在边界括注补「多行取目标」，或注明以批档 §2.4 为唯一权威 |
| 9 | Clarity / 用例判别力 | 🔵 | W17-23（弹框在位时整表重绘）不判别闭包形态：`renderMcpList` 走 `list.innerHTML = …` 重建（`settings-tools.js:173-190`），旧钮节点脱离后 `dataset.name` 仍为原名 ⇒「确认时读 DOM」与「开框时捕获」在同场景产出同一载荷；该例现态必红只因弹框缺失 | 明确该例覆盖「在位不改目标 / 不吞确认」；若要判别闭包形态，补一例节点复用 / 列表重排或目标行被移除的场景 |
| 10 | Acceptance coverage | 🔵 | 取消路径册四条（`SETTINGS.md:204`）中 #2（点遮罩）/#3（框内 Escape）无 MCP 入口专属用例（用例表只给 #1 = W17-20 / #4 = W17-21） | 补两例（MCP 入口），或在 §2.4 注明「由共享弹框的 W17-6 / W17-7 等价覆盖」的理由，使判据不被读作逐入口完备 |
| 11 | Fail-closed scope | 🔵 | 结构对账 W17-17 的 fail-closed 门以 `delete*` 命名为门槛（`SETTINGS.md:232`「新增直发项未登记即红」）——非 `delete*` 名的新删除入口（形态同 `removeProvider`）不入扫描集；设计已明示 #4 不入集，但未写明该门对命名形态的依赖 | 在 §2.10 判据域边界补一句范围限制（fail-closed 域 = `delete*` 命名集），或加一条不依赖命名的动作面断言 |

**局限**：无项目标准档与文档地图声明 ⇒ 文档归属/方法论面按 `AGENTS.md` 与各档自述头注判读。

**计数**：🔴 0 · 🟡 7 · 🔵 4

VERDICT: pass

## §4 用户批准

**2026-09-18 22:21 用户直接裁定** —— 逐字「**mcp 删除那个还是要确认一下好**」（= MCP server 行删除入确认门；provider 行保持单击即删）。设计评审与实现轮均在此授权下推进（父侧按 22:13 常设规则「按建议执行」继续跑）。

## §5 实施与修正记录

（eng-coder 写）

**（eng-coder · 实现轮 2026-09-18）**

### 5.1 交付摘要

MCP server 行 ✕ 由直通（`_confirmDelete`）改判入**不可复得类**确认门（`_confirmSecretDelete`）+ **载荷闭包改为开框时捕获**；弹框文案值级改写为类通用式；`settings.js:42-47` 注释自述同步（零行为）。条目 = 批档 §1.2 ①（F-W17 扩域）⇒ **✅ 完成**（全 8 条 AC 逐条落地，读数见 5.5）。

### 5.2 受影响文件表（文件 / 改动 / Δ 实测）

**行数口径（D3）**：`wc -l` 等价 `split("\n")` 去尾空行（同 §2.3 表注）。

| # | 文件 | 改动 | Δ 实测 |
|---|---|---|---|
| 1 | `thincoder-vscode/webview/settings-tools.js` | 绑定位 `:191-195`：门名 `_confirmDelete` → `_confirmSecretDelete` + 载荷闭包开框时捕获（`const name = btn.dataset.name`；闭包只发 `{type:"deleteMcpServer", name}`）+ 2 行注（归类判据 / 闭包语义，指 `SETTINGS.md` §2.10）。绑定形态（`addEventListener`）零改；生成位 `:187` **逐字零改**（R5 结构面在例内钉住） | 395 → **398**（+3；设计预估 +2——多的 1 行 = 注释拆两行） |
| 2 | `thincoder-vscode/webview/settings.js` | 注释自述同步（`:42` 可直发类收窄为 provider 行 + 受裁例外；`:44-47` 类名按可复得性重述为 unrecoverable class）——**零代码 / 零行为**；`:43` / `:48-55` / `:116-122` 逐字零改 | 138 → **138**（±0 ✅ 同设计预估） |
| 3 | `thincoder-vscode/locales/zh.json` · `en.json` | `settings.secretDeleteConfirm`（`:173`）值级改写为类通用式（逐字 = `SETTINGS.md:207` / `:208`）；键名 / 键数 / 其余键零改 | 各 259 → **259**（±0 行 · 各 `1 1` numstat）；键数 257 不变 |
| 4 | `thincoder-vscode/test/settings-secret-delete-confirm.test.mjs` | W17-16 / W17-17 **同号改判** + W17-19…W17-25 新增 7 例 + 头注同步（双批档指针）+ 夹具助手 `mcpDel` / `mcpSrv` | 333 → **439**（+106；设计预估 ~415） |
| 5 | `thincoder-vscode/test/files.mjs` | 零改（同档扩例 ⇒ 清单不动；§2.3 #4 / §1.4「如新档才登」） | 95 → 95 |
| 6 | 零改面（复核读数） | `webview/settings-providers.js` 269 · `webview/settings-widgets.js` 109 · `thincoder-vscode/src/**`（`git diff` 空）· `WEBVIEW-PROTOCOL.md` · 需求档 · 他批档 / `_archive/**` | 全零 diff |
| 7 | `docs/vsc/design/SETTINGS.md` | **本席零改**（§2.10 由设计轮写就即本批终态；§3 三条到期/坐标项 = 上抛 5.8 #1–#3，未擅自改笔） | 346 → 346 |

### 5.3 先红读数（硬读数 · 两路独立）

**路 ①（inline 探针 · 零仓内写入）**：开面板（真 `openSettings` + `agentSettings` 回拍）→ `mcpStatus{servers:[srv1]}` → 点 `.mcp-del-btn` ⇒ 新增消息 = `[{"type":"deleteMcpServer","name":"srv1"}]`（**点击即发**）∧ `.auto-confirm` = **0** ∧ `.auto-backdrop` = **0**（**无确认面**）；门**已在位**（`typeof window._confirmSecretDelete === "function"`）⇒ 本批缺口 = 入口未过门。

**路 ②（用例级真红 · 临时回退绑定位后实跑）**：`node --test test/settings-secret-delete-confirm.test.mjs` ⇒ **16 pass / 9 fail**，红档逐号 = **W17-16 · W17-17 · W17-19 · W17-20 · W17-21 · W17-22 · W17-23 · W17-24 · W17-25**（与 §2.4「先红档」预测**逐号同**）；绿档 = W17-1…W17-15 / W17-18（密钥类既有面 + provider 两载体锚，原样绿）。失败首断言读数：
W17-16 `actual=[{type:'deleteMcpServer',name:'srv1'}] expected=[]` · W17-17 `deleteMcpServer：0/1`（未落门内）· W17-19 / W17-20 / W17-25 `.auto-confirm-yes` 为 **null**（无框可依）· W17-21 开框在位 `0 !== 2` · W17-22 开框零发值失败（`[{deleteMcpServer,srv1}]`）· W17-23 弹框在位 `0 !== 1` · W17-24 正文 `undefined`（无框）。探毕即恢复实现 ⇒ 复跑 **25/25 pass**。

### 5.4 用例读数（命令 + pass/fail）

| 命令（cwd = `thincoder-vscode`） | 读数 |
|---|---|
| `node --test test/settings-secret-delete-confirm.test.mjs` | **25 pass / 0 fail**（W17-1…W17-25；含恒绿锚 W17-1…W17-15 / W17-18） |
| `node --test test/settings-secret-delete-confirm.test.mjs test/protocol-coverage-reverse.test.mjs` | **28 pass / 0 fail**（AC-FW17B-5 后半） |
| `npm test`（`node test/run.mjs` · 全量快层） | **668 pass / 0 fail / 0 cancelled / 0 skipped** |
| `npm run lint`（`node scripts/check-syntax.mjs`） | **check-syntax: 202 JS files OK** |
| `node scripts/doc-check.mjs --root .`（cwd = `thincoder`） | 悬空 **5** · 行宽 **11**——与开工基线同值；**按档归属零新增**（失败列无 `docs/vsc/**`；`SETTINGS.md` 仅出现在「拟新增」列报行 `:261` / `:273`——拆分计划前向引用，列报 · 不入闸） |

### 5.5 AC-FW17B-1…8 逐条读数

| AC | 判据 | 读数 |
|---|---|---|
| AC-FW17B-1 | 点击 ⇒ 出现确认；确认后才发 | W17-16（点击零发值 ∧ 弹框/遮罩各 1）· W17-19（确认后恰 1 条 `{deleteMcpServer,srv1}` ∧ 框清）——先红读数在 5.3 ✅ |
| AC-FW17B-2 | 取消 ⇒ 零发值 | W17-20（取消钮 · 零发值 ∧ 框清 ∧ MCP 行 `outerHTML` 逐字复原）· W17-21（关面板同清路径）✅；#2 / #3 由同件 W17-6 / W17-7 等价覆盖（同轮绿） |
| AC-FW17B-3 | provider 行行为零回归 | W17-14 / W17-15 恒绿 ∧ `git diff thincoder-vscode/webview/settings-providers.js` = **空** ✅ |
| AC-FW17B-4 | 不可复得类全数过门（fail-closed 结构面） | W17-17 绿：域内 `delete*` 全集 = 4 名（`deleteEmbedKey` / `deleteMcpServer` / `deleteProviderKey` / `deleteWebsearchKey`）逐名 `gated == total` ∧ 可直发类在集内 = **∅**；`_confirmDelete` 实参内 `delete*` = **0** ∧ 调用点收敛 = **1** ✅ |
| AC-FW17B-5 | 宿主零改 / 协议零增 | `git diff thincoder-vscode/src` = **空** ∧ protocol-coverage-reverse 绿（W12-1/2/3）✅ |
| AC-FW17B-6 | 文案类通用式 + 键数不变 | W17-24 绿（MCP 入口 · zh / en 双源逐字 = 档值 ∧ ≠ 键名）∧ `git diff --numstat thincoder-vscode/locales` = **恰 2 行各 `1 1`** ∧ 两档 **259 行 / 257 键**不变 ∧ 改写值逐字 = `SETTINGS.md:207-208` ✅ |
| AC-FW17B-7 | 总门 | `npm test` 668/668 全绿 ∧ `npm run lint` OK ✅ |
| AC-FW17B-8 | 文档面 | `doc-check` 悬空 5 / 行宽 11——按档归属零新增 ✅ |

### 5.6 零回归锚（R1–R5）复核

- **R1 / R2**（`settings-providers.js:182` 行内 `onclick` + `:64-66` 直通 + `:48-49` 取消重建位）：W17-14 / W17-15 绿 ∧ 该档 `git diff` 空（269 行不变）✅
- **R3**（密钥类既有面）：W17-1…W17-13 / W17-18 原样绿；`_confirmSecretDelete` 函数体逐字零改（`settings.js:48-55` 零 diff）✅
- **R4**（`_confirmDelete` 直通语义）：`settings.js:43` 函数体逐字不变（仅 `:42` / `:44-47` 注释）；调用点由 2 收敛为 **1**（`settings-providers.js:65`）——W17-17 结构面钉住 ✅
- **R5**（MCP ✕ 生成位）：`:187` 逐字零改——W17-16 内结构断言（类名 / `data-name` / 钮字面串在位）✅

### 5.7 越界项

**无**——改动全部落在 §1.4 写域内（`settings-tools.js` · `settings.js` · `locales/{en,zh}.json` · 用例档）；`test/files.mjs` 按设计零改（同档扩例）；`SETTINGS.md` 零改（不擅改设计档，三条到期/坐标项上抛 5.8）。

### 5.8 上抛（父侧 / 设计侧 · 本席只报不改）

1. **`SETTINGS.md` §3 文案面登记（`:267-270`）到期条件已达**——值级改写已落盘（`locales/{en,zh}.json:173`）+ AC-FW17B-6 读数在册（numstat 恰 2 行各 `1 1`）⇒ **待核销**（本席不擅自改设计档）。
2. **`SETTINGS.md:271` 坐标漂移**：「该档现 **395** 行」为本席改动前读数；本批后 = **398**（`wc -l`）。拆分结论不变（398 < 450 触发阈值 ⇒ 本批不拆，同 §2.2 D-M6）。
3. **`SETTINGS.md:275-278` 用例档实读**：「现 333 → 本批预估 ~415」；**本批实读 = 439**（< 500 硬限 ⇒ 按 D-M6「越线即当场拆」判据**不拆**；组边界 / 触发阈值登记继续有效）。同理 `:271` 登记之 `settings-tools.js` 395→398 未近 450。
4. **`test/files.mjs` 条目注释仍写 `W17-1…W17-18`**（本批用例号扩至 W17-25）：批档 §2.3 #4 定「同档扩例 ⇒ 清单零变」+ §1.4「如新档才登」⇒ 本席按设计**零改**；注释漂移登记待父侧裁（改笔 = 值级收正 1 行、零行数变化）。
5. **批档 §2.8 #8 已消解（实读确认）**：§1.4（`:31`）现含 `webview/settings.js` + `locales/{en,zh}.json` 两处补列 ⇒ 本批写域依据成立，该项无需再动。
6. **实现与设计的 Δ 偏差（明示）**：`settings-tools.js` 实测 +3 行（设计预估 +2；差 1 = 注释拆两行，无语义差）；用例档实测 439（设计预估 ~415；差的 24 行 = R5 结构断言 3 行 + 各例换行/夹具助手与缩进）。**零语义偏差**：机制 / 判据 / 门名 / 载荷 / 文案值逐条与 §2.1 / §2.10 同源。

### 5.9 分歧审计轮（explore · 只读审计子代理 · 轮次 1）与修正

**审计结论**：**DEVIATIONS — 1 项**（类 = DOC-DRIFT）；**PARTIAL / SILENT-SIMPLIFICATION / OUT-OF-LIST 三类零发现**。
审计面 = 批档 §2（2.1–2.8）+ §3 + §5 ↔ `SETTINGS.md` §2.10 ↔ 实读四档（`settings-tools.js` / `settings.js` / `locales/*.json` / 用例档）；逐条核 A–F 六问（AC 全覆盖 / 设计元素是否降级 / 越界 / 文案逐字 / 漂移完整性 / 真跑）。

**审计独立复核通过项**（非本席自述）：W17-17 判据**真可判**（域内 `delete*` 恰 4 名且四处发射各自落在 `_confirmSecretDelete(` 实参括号内 = 逐名 `gated == total`；`_confirmDelete(` 调用点恰 1 = `settings-providers.js:65` 且实参内非 `delete*`；域外正控 `session-bar.js:104` 在）· W17-23 **确实不判闭包形态**（含整表重绘已发生的反证）· W17-24 取档值不取字面 · W17-25 真取第 2 行 · 门名替换 / 载荷开框时捕获（`const name = btn.dataset.name`）/ 生成位 `:187` 逐字 / `addEventListener` 形态 / 弹框件与 provider 两载体与 `src/**` 零改（mtime + 内容双证）/ 协议零增（`deleteMcpServer` 为既有判别式）/ 无撤销机制 · 文案两档逐字 = `SETTINGS.md:207-208` · 改动 5 档全在 §1.4 写域内。

**发现 1（🟡 · DOC-DRIFT）= 本席 +3 行插入使活坐标指针整体后移，§5.8 只登记了行数 / 到期三条，坐标族未登记。**
处置 = **本 5.9 全族登记**（依 D1「设计档 = eng-designer 笔」+ 前批先例「坐标收正 = 父侧文档卫生轮同笔直接执行」——`SETTINGS.md` 变更记录 `:335-338` ⇒ 本席**不改笔设计档**，只报）。

**坐标漂移族（旧值 as-of 设计轮 = HEAD 版实读；现值 = 本批后实读；漂移量 = +3 = 插入行数）**：

| 档:行 | 引用 | 旧值 | 现读 |
|---|---|---|---|
| `SETTINGS.md:171` | `settings-tools.js:270`（websearch ✕ 生成位） | 270 | **273** |
| `SETTINGS.md:172` | `settings-tools.js:283`（嵌入 ✕ 生成位） | 283 | **286** |
| `SETTINGS.md:188` · `:227` | `settings-tools.js:305-315`（`renderKeyRow` 单点） | 305-315 | **308-318** |
| `SETTINGS.md:189` | `settings-tools.js:165-227`（`renderMcpList`） | 165-227 | **165-230**（尾坐标；起点不变） |
| `SETTINGS.md:234-238`（§2.10 MCP 行载体段） | 「绑定位 `:191-195`」 | 191-195 | **191-198**（区带；`:193-195` = 新增 2 行注 + `const name`，发射落 `:196`） |
| `docs/vsc/requirements/WEBVIEW.md:34`（**父侧笔**） | `settings-tools.js:270` / 掩码位 `:267` / `:280` / `:293-295` / `:297-300` | — | **273** / **270** / **283** / **296-298** / **300-303** |
| `docs/vsc/design/WEBVIEW-PROTOCOL.md:409`（**禁止范围**） | `webview/settings-tools.js:193` | 193 | **196** |

**逐条确认不动项**（≤ 新 192 行——实读验证未动）：生成位 `:187`（R5 锚）· 两 handler 块 `:27-29` / `:45-47` · 表单读段 `:117-136` · 域内发射 `:28` / `:46`；`settings.js` 全档 ±0 行 ⇒ 该档坐标（`:42` / `:43` / `:48-55` / `:116-122`）不动。
**为何不致红**：`protocol-coverage-reverse` 只比对判别式**名集合**（坐标格仅作非空校验与展示）⇒ 协议面机检零影响（本席 5.4 读数仍 28/28 绿）。
**域外两档**（需求档 = 父侧笔；协议档 = §2.7 禁止范围）**只报不改**。

**轮内自修正（审计范围外观察 · 措辞精度）**：W17-23 的断言消息原写「确认动作 = 开框时捕获的闭包」——按设计自身发现 9（本场景两形态同载荷）该措辞强于断言判别力 ⇒ 消息收窄为「确认后仍发原载荷目标（重绘不改删除目标）——本例不判闭包形态（形态由代码面复核守）」。**零断言变更 / 零行数变化**；复跑 **25/25 pass**。

**本轮净差**：报告面登记（无代码 / 无断言需修）；发现 1 以本 5.9 登记为处置，**无待修项**。

### 5.10 代码评审轮（advisor · type=code · 轮次 1）与修正

**评审面**：paths = 5 档（`webview/settings-tools.js` · `webview/settings.js` · `locales/{zh,en}.json` · 用例档）；documents = 本批档 + `SETTINGS.md` + `docs/vsc/requirements/WEBVIEW.md`；review-object 声明在册（排除面 = `src/**` · `settings-widgets.js` · `settings-providers.js` · 各档文档 · 撤销机制）。
**结论**：**pass**（🔴 **0** · 🟡 **3**（全部「可选 · 非 must-fix」）· 🔵 **3**）。

**评审独立实核通过项**（非本席自述）：门名 + 载荷闭包（`:195` `const name` / `:196` 门调用）· 域内 `delete*` 4 处发射**全落门内**（`settings-providers.js:57` · `settings-tools.js:28` · `:46` · `:196`）· `_confirmDelete(` 调用点收敛 **1**（`settings-providers.js:65`）· 域外 `deleteSession` 不入集 · 生成位 `:187` 逐字 · 门体 `settings.js:48-55` 与 `closeSettings()` 清除位 `:120` 逐字未改 · 文案两档逐字 = `SETTINGS.md:207-208` · 需求对位（用户 22:21 逐字 ⇒ 点击不即发 / 确认才发 / 取消零发值）逐条一致 · 旧措辞全树零残留 · provider 两载体零回归。
**评审局限（评审子代理自报）**：该角色无执行面（无 shell / git / execute）⇒ `npm test` 668/668 · 用例档 25/25 · 9 例先红读数 · `git diff`/`numstat` 类 AC 为其「认读记录」（记录面 = 本席 §5.3 / §5.4）；`locales` 键数 257 未逐键核（值 / 行数已核）。

| 号 | 级别 | 处置 | 落点 / 读数 |
|---|---|---|---|
| 1 | 🟡（可选 · 非 must-fix） | **已修**：`settings.js:44-47` 类注释把判据放大为绝对断言「the UI never shows the original」——MCP 入口实况为**编辑表单可见原文**（`settings-tools.js:385` 预填 `#mcp-token` value + 控件 `:70` 非 password + 宿主下发 `src/extension/panel-mcp.mjs:118`）⇒ 措辞收窄为「the rows show no original (only the edit form's fields do)」（与设计档「行内不显凭证在场与否」同口径）。**4 行不变 ⇒ `settings.js` 138 ±0**；**零行为**（注释面）；复跑 25/25 + `npm run lint` OK | `settings.js:44-47`（现读）· 本 §5.2 #2 的 ±0 结论不变 |
| 2 | 🟡（可选） | **登记不升级**（R3 裁定不重开）：`settings-tools.js` 实读末行 **398** > 300 建议线（< 500）——拆分复核结论 + 组边界 + 触发 450 行已在 `SETTINGS.md` §3 在册 | `SETTINGS.md:271-274` |
| 3 | 🟡（可选） | **登记不升级**：用例档实读末行 **439**（333 → 439；设计预估 ~415）> 300 建议线（< 500）——拆分计划（触发 500 硬限 / MCP 用例组下次增例 → 拆 `settings-mcp-delete-confirm.test.mjs`）已在 `SETTINGS.md` §3 在册 | `SETTINGS.md:275-278` |
| 4 | 🔵 | **登记**（本席不改设计档）：W17-17 识别面比设计登记的「命名形态依赖」多一层——`emitsIn`（用例档 `:411-413`）只认 `type` 后**字面量**串（常量 / 变量 / 拼接书写的新 `delete*` 发射静默漏计）；域枚举 `readdirSync(WEBVIEW_DIR)` 非递归 + 计数守卫（`:269-270`）⇒ 移入子目录即静默缩域。今日域内 4 处全为字面量（实读），无假阴性。建议 = `SETTINGS.md` §2.10 判据域边界补「命名 + 书写 + 枚举」三层范围限制（父侧/设计侧笔） | 用例档 `:269-270` / `:411-413` |
| 5 | 🔵 | **登记**：用例间 i18n 词典未还原（W17-24 `:389-396` 循环末尾把 en 留在全局；`beforeEach` `:39-42` 只清弹框）⇒ 后续新增的本地化断言例会受用例顺序影响（W17-13 `:216-223` 同形先例；当前无实害）。建议 = `beforeEach` 还原词典（确定性） | 用例档 `:39-42` / `:389-396` |
| 6 | 🔵 | **登记（已裁项 · 不重开）**：弹框不回显被删 server 名（`locales/*:173` 类通用式 + 门只传 text/钮文案 `settings.js:49-54`）⇒ 多 server 在位时两次弹框逐字相同（W17-25 即双行场景）。承父侧 2026-09-18 裁定 ②「值级改写 · 键数不变 · 键名不动」⇒ 本批零动作；若日后需目标名可见 = 新键/带参文案（另批） | `SETTINGS.md:206-209` |

**越界与漂移**：§5.9 坐标漂移族经评审抽核**一致**（`WEBVIEW-PROTOCOL.md:409` 仍写 `settings-tools.js:193` → 现 `:196`；需求档 `:34` 坐标 +3；`SETTINGS.md:271` / `:275` 行数读数），无新增项。
**注记（时序透明）**：🟡1 的措辞收窄落在**评审轮之后**（注释面 · 零行为 · 零行数变化）；评审对 `settings.js` 的字节级核验针对收窄前版本，其余四档评审后零改动。
**终态 = `clean`**（无待修项；🟡1 已修，🟡2/🟡3 与 🔵4/🔵5/🔵6 = 登记项）。

## §6 验证与收口

**收口（2026-09-18 22:5x · 父侧直接执行）**

- **交付判据**：设计（id=113）→ 评审 **pass**（id=116 · 0🔴/7🟡/4🔵）→ 修正（id=119 · 8/8）→ 实现（id=122 · 终态 clean：内部分歧审计 + 代码评审 pass + 修轮 2）⇒ **F-W17 扩域全闭**。
- **验收读数**：用例档 **25/25 pass**（父侧独立复跑同值）· vsc `npm test` **668/668** · `npm run lint` OK · `git diff src` 空 · `git diff settings-providers.js` 空 · locales numstat 恰 2 行各 `1 1`（键数 257 不变）· `doc-check` 按档归属零新增。
- **先红双路**：inline 探针（点击即发 1 条 + 弹框 0）+ 用例级真红（**16 pass / 9 fail**，红档与设计 §2.4 预测逐号同）。
- **落地**：MCP 行 ✕ 改走 `_confirmSecretDelete` + 载荷闭包开框捕获（生成位 `:187` 逐字零改）· 文案类通用式值级改写 · `settings.js` 注释自述同步（零行为）· provider 行两处载体零改（`_confirmDelete` 调用点收敛为 1）。
- **设计档坐标漂移（登记 · 只报不改）**：本批 +3 行使 `SETTINGS.md:171/:172/:188/:189/:227`（`:270`→273 · `:283`→286 · `305-315`→308-318 · `165-227`→165-230）· `requirements/WEBVIEW.md:34`（+3）· `WEBVIEW-PROTOCOL.md:409`（`:193`→196）——**消解路径 = 父侧文档卫生轮同笔收正**；到期 = 两档下次触碰。另 `SETTINGS.md:271`「现 395 行」→ 实读 398 · `:275`「333 → ~415」→ 实读 **439**（拆分结论不变：<450 / <500）。
- **状态行**：✅ 已收口 2026-09-18（全档冻结）。
- **台账**：#93 ⇒ 已核销。
