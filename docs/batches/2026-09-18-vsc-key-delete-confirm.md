# 批：2026-09-18 · VSC 密钥类删除二次确认（台账 #92）

> 状态行（§1）：🔄 进行中（设计轮 · eng-designer）
> 批次边界：交付目标 = 「密钥 / 令牌类删除改为二次确认（非密钥类保持单击即删）」；条目集 = 需求档 `docs/vsc/requirements/WEBVIEW.md` **F-W17**（用户 2026-09-18 21:09 裁定「最好确认一下」）。
> 前情 = 配置页批 `docs/batches/2026-09-18-vsc-settings-wiring.md`（其「待用户裁 1 项」= 本条目需求源；该批**已收口冻结** ⇒ 本批 = 新批，不回改旧档）。

## §1 批次任务（父侧）
**状态行**：🔄 进行中（设计轮 · eng-designer）——机读位（`BATCH-RECORD.md` §4.9：解析对象 = §1 段内 `**状态行**：` 前缀行）；档头行（`:3`）保留其值同源副本，本行由 eng-designer 于设计轮补足（原缺口 = 档头行在 `## §1` 段外 ⇒ 工具判「状态行不可解析」而拒写 §2；值逐字未改，见报告上抛项 7）。

### 1.1 目标与理由

用户 21:07 逐字问「key/token 单击即删是什么意思？」→ 父侧给出 A/B/C 三选项（A 保持现状 / B 密钥类二次确认 / C 单击即删 + 撤销）→ 用户 21:09「**最好确认一下**」= **取 B**。理由：密钥/令牌在 UI 只显 `****`（`webview/settings-providers.js:44` · `settings-tools.js:23`/`:51`）⇒ 删除**不可逆**（原文不可复得，只能回服务商重取），不满足既有 P5「**可逆**才单击即删」的前提；provider / MCP server 行（删了可重填）**保持单击即删**。

### 1.2 本批覆盖的条目（逐条可交付）

| # | 需求 | 本批交付 |
|---|---|---|
| ① | **F-W17** 密钥/令牌类删除须显式确认 | 密钥类删除入口（**按需求档实测册**：websearch ✕ · 嵌入 ✕ · 死 handler `_delKey`）加一次显式确认（形式由设计裁定并给判据）；取消 ⇒ 零发值；MCP token/headers **无删除钮**（表单清空路径 ⇒ 转登记） |

### 1.3 本批不做

- **不取撤销机制**（用户 21:07 口径：属加机器，与「强流程·靠结构不靠硬拦」的方向相反）。
- 不改**非密钥类**的单击即删（provider 行 · MCP server 行）——**行为零回归**是本批硬锚。
- 不改宿主侧删除语义（`settings.mjs` / `settings-panel-write.mjs`）· 不改 §2.8 路径册（配置页批已收口）。
- 不碰需求档其余条目与 🔵 八条 / 设计意图十条（登记在册）。

### 1.4 边界

- 写域 = `thincoder-vscode/webview/settings-providers.js` · `settings-tools.js`（两档 = 四类密钥入口所在）+ `locales/`（双语文案）+ 测试面；必要时 `webview/settings.js`（`_confirmDelete` 处，`webview/settings.js:41`）。
- 需求档 = 父侧笔（F-W17 已落）。

### 1.5 验收口径

1. **可机判**：**三处密钥入口**逐条用例（MCP token/headers 无钮 ⇒ 表单路径转登记）——点击 ✕ ⇒ **不立即发删除消息**；确认 ⇒ 发；取消 ⇒ 零发值 ∧ 行内状态不变。
2. **零回归**：非密钥类（provider / MCP server 行）单击即删用例保持绿。
3. `thincoder-vscode` `npm test` 全绿；`doc-check` 按档归属零新增。

## §2 批次任务与设计

（eng-designer 写）

（eng-designer · **initial 轮** 2026-09-18）

**设计落点（单源 · D2）**：机制与判据 = `docs/vsc/design/SETTINGS.md` **§2.10**（类判据 / 入口册 5 行 / 弹框契约 / 四条取消路径 / 协议零增 / 密钥行载体绑定）· UI 决策 = 同档 **§5 U-S11** · 残留登记 = 同档 **§3**（弹框三处同族重复——消解路径 + 到期条件在册）。本段 = 批次面（逐条设计 / 决策记录 / 受影响文件 / 用例 + 先红 / AC / 零回归锚 / 上抛），**不重述机制**。

### 2.1 逐条设计（回指 §1.2 ①）

| 面 | 设计要点（落点 = `SETTINGS.md` §2.10） | 判据（用例号见 §2.4） |
|---|---|---|
| **类判据** | 可逆 ⇒ 单击即删（`window._confirmDelete` 直通，`thincoder-vscode/webview/settings.js:41` **保留**）；密钥 / 令牌类 ⇒ **必过一次显式确认**（新增 `window._confirmSecretDelete`）——P5「可逆才单击即删」对密钥类**判对**；不并入撤销机制 | §2.10 首节判据句；机判 = W17-1…W17-4 |
| **密钥类入口 3 处** | ① Web Search key ✕（`webview/settings-tools.js:263` 生成 → handler `:42-44`）② 嵌入 key ✕（`:276` → `:25-27`）③ provider key（`webview/settings-providers.js:56-58` `window._delKey`） | 点击 ⇒ **不立即发删除消息**（W17-1 / W17-3 / W17-4） |
| **可逆类 2 处（零回归锚）** | ④ provider 行 −（`settings-providers.js:182` 卡 HTML + `:48-49` 编辑行取消重建位）⑤ MCP server 行 ✕（`settings-tools.js:180` 生成 / `:184-188` 绑定）——**载体行 / 绑定行 / 消息名 / 发射条件逐字不变** | 单击 ⇒ 恰 1 条删除消息 ∧ **零弹框**（W17-14 / W17-15 / W17-16） |
| **确认形态** | 面板内轻量确认弹框（复用既有 `.auto-confirm` / `.auto-backdrop` 件；本面单源 = `webview/settings-widgets.js` 的 `showConfirmPopover`）——**否决行内二次点击**（四条理由落 §2.10） | 弹框在位 + 确认后才发（W17-1 / W17-2） |
| **取消路径** | 四条：取消钮 / 遮罩 / 弹框内 Escape（拦截 `stopPropagation`——不连带关面板）/ 关面板（`closeSettings()` 同清）——**均零发值 ∧ 不触碰键行 DOM** | W17-5…W17-8 |
| **载体绑定** | 密钥行 ✕ 由行内 `onclick` 改 `addEventListener`（`renderKeyRow` 单点：渲染 + 绑定同点；两处 `onCancel` 手写重建收敛）；**非密钥类两处不动** | 点击面机判（W17-1）+ 重绘后绑定在位（W17-18） |
| **协议 / 宿主** | 确认 = webview 侧门（确认动作内才 `postMessage`）⇒ 消息名与载荷**零增**；宿主删除语义**零改** | `protocol-coverage-reverse` 全绿（AC-FW17-6）+ `git diff thincoder-vscode/src` 空 |
| **文案** | 新增 1 键 `settings.secretDeleteConfirm`（en / zh 双档）；钮文案复用既有键（确认 = `session.delete`、取消 = `question.cancel`——跨面复用先例 = 会话删除确认用 `question.cancel`） | W17-13（双源在册） |

**设计轮实测（先红形态硬读数 · happy-dom 直驱真 webview 模块 · 零仓内写入 · 临时探针档跑完即删）**：

- 现态调三处密钥 handler ⇒ **立即**各发 1 条删除消息、且 `.auto-confirm` 数 = **0**（无任何确认面）：
  `websearch` ⇒ `[{"type":"deleteWebsearchKey"}]` · `embed` ⇒ `[{"type":"deleteEmbedKey"}]` · `provider key` ⇒ `[{"type":"deleteProviderKey","name":"deepseek"}]`；
- `window._confirmSecretDelete` **不存在**（`typeof = undefined`）· `locales/en.json["settings.secretDeleteConfirm"]` = **undefined**（键未在册）；
- **非密钥类正控**：`provider` 行 − handler ⇒ 立即 `[{"type":"removeProvider","name":"deepseek"}]`（零回归锚现态在位）；
- **载体绑定实测**：`#row-websearch .del-key` 的 `typeof btn.onclick = "object"` ∧ `.click()` ⇒ **posts +0**（happy-dom 不执行行内属性绑定）⇒ 不换绑法即「点击 ✕ ⇒ 不出删除」这一判据句的**动作面无法机判**（= D-W17-3 的硬证据）。

### 2.2 关键决策记录（含否决备选）

| # | 决策 | 否决备选 / 理由 |
|---|---|---|
| D-W17-1 | 确认形态 = **面板内确认弹框**（乙） | 否决**行内二次点击**（甲）四条：① 键行被推送**整行重绘**（`rerenderKeyRow`（`webview/settings-tools.js:283-288`）· `renderProvidersCard`（`settings-providers.js:237-242`）· `renderMcpList`——外部写盘还经 §2.7 推轻量快照）⇒ 武装态存于 DOM 会被抹掉（第二击落空 / 退化重武装），要稳须另立模块态 + 重绘重贴；② 取消路径须第三方机制（定时回退 = P5 已删的「2.5s 两段定时」形态；或只靠失焦兜底——「行内状态复原」无判据）；③ `✕` 是单行 flex 内字形钮，换「确认删除？」破布局且理由文案无容身之处；④ 不可逆删除在本仓已有同形先例（会话删除确认 `session-bar.js:75-107` · AUTO 启用确认 `mode-buttons.js:54-92`），P5 原文亦为「不可逆才**弹**确认」 |
| D-W17-2 | **两门并存**：`_confirmDelete` 直通（可逆）∥ `_confirmSecretDelete` 必确认（密钥类） | ① 单门 + `secret` 布尔 flag：缺省值必须选一侧，漏标即直通（fail-open）；且既有 4 处调用行全要改（动了零回归锚的行）；② 宿主侧守卫：改宿主删除语义（需求明令不改）且须新增「已确认」载荷字段（协议形态新增）；③ 各调用点各写 if：无单点、无形态（违 D2） |
| D-W17-3 | 密钥行 ✕ **换绑 `addEventListener`**（`renderKeyRow` 单点） | ① 保持行内 `onclick`：判据句动作面在测试夹具下不可驱动（实测 `.click()` ⇒ posts +0）⇒ 只能降级为「handler 直驱」，按钮→handler 接线留盲区；② 同族 MCP 行已用 `addEventListener` ⇒ 形态归一；③ 附带收益：两处 `onCancel` 手写 `outerHTML` 重建（`settings-tools.js:20` / `:37`）并入同一重绘点 |
| D-W17-4 | 死 handler `_delKey`（`deleteProviderKey`）**纳入同门**（不删 handler） | 承归档决策（`thincoder-vscode/docs/design/_archive/SETTINGS-PANEL.md` D2：UI 不再暴露「只删 key 留条目」、协议保留不删）；纳入同门后「**所有**密钥类删除路径必过确认」对全入口面成立（含日后重新暴露）。删除 handler = 改协议面（越本批目的） |
| D-W17-5 | 弹框实现落 `webview/settings-widgets.js`（settings 面内单源） | ① 新建公共件 `webview/confirm-popover.js`（拟新增）并迁移既有两处（session-bar / mode-buttons）：**越本批写域**（§1.4）+ 两面**零测试覆盖**（全树 `.auto-confirm` 零测试命中）⇒ 迁移无回归网 ⇒ 登记为消解路径 + 到期条件（`SETTINGS.md` §3）；② 各调用点内联弹框代码（4 处重复）：违 D2 |
| D-W17-6 | **零新增 CSS** | 复用既有 `.auto-confirm` / `.auto-backdrop`（`webview/controls.css:584-658`）+ `index.html` 已加载 controls.css；`z-index` 1000 > 面板 `20`（`webview/settings.css:7`）⇒ 恒在面板之上（零样式改动即达） |

### 2.3 受影响文件表（行数 as-of 2026-09-18 本席实测 · Δ = 预估）

| # | 文件 | 现况 → 预估（Δ） | 面 |
|---|---|---|---|
| 1 | `thincoder-vscode/webview/settings.js` | 123 → ~130（+7） | 双门安装（新增 `_confirmSecretDelete`）+ `_confirmDelete` 注释改判据句 + `closeSettings()`（`:102-107`）经同档清除入口同清弹框与遮罩 |
| 2 | `thincoder-vscode/webview/settings-widgets.js` | 70 → ~105（+35） | `showConfirmPopover` + 同档**清除入口**导出（弹框单源：件复用 / 单例 / 焦点安全默认 / `detail>1` 护栏 / 弹框内 Escape 拦截 / 载荷闭包） |
| 3 | `thincoder-vscode/webview/settings-tools.js` | 368 → ~382（+14；**tier 说明**——该档改动前即在 300 行建议线之上、远未近 500 硬限；本批增量不改结构 / 不增模块职责 ⇒ **拆分另行评估**，不在本批） | 两处密钥 handler 改同门；`rerenderKeyRow` + 两处 `onCancel` 手写重建收敛为 `renderKeyRow`（渲染 + 绑定单点） |
| 4 | `thincoder-vscode/webview/settings-providers.js` | 269 → 269（±0 行；`_delKey` 1 行改同门） | 密钥类 handler 改门；**非密钥类两处零改**（`:182` / `:48-49`） |
| 5 | `thincoder-vscode/locales/en.json` | 258 → 259（+1） | `settings.secretDeleteConfirm`（正文） |
| 6 | `thincoder-vscode/locales/zh.json` | 258 → 259（+1） | 同键 zh 逐字 |
| 7 | `thincoder-vscode/test/files.mjs` | 93 → 94（+1） | 新档登记（清单制——未登记档 `test/run.mjs` fail-closed） |
| 8 | `thincoder-vscode/test/settings-secret-delete-confirm.test.mjs` | 新建 ~230 | W17-1…W17-18（夹具 = `test/helpers/webview-env.mjs` + 真 `chat.js` / `settings.js`） |
| 9 | `docs/vsc/design/SETTINGS.md` | 211 → **288**（+77——**已落**；含设计评审轮 1 修正 **+8**；as-of 2026-09-18 fix 轮末实测——行口径同前：split 计数 288 / `wc -l` 287） | §2.10 新节（62 行）+ §3 残留 +1 条（4 行）+ §5 U-S11（1 行）+ 变更记录 +3 行 + 分节拆行 + fix 轮 +8（域边界 3 行 · 绑定范围 1 行 · 清除入口 3 处同点改笔 · 变更记录拆行） |
| 10 | `docs/vsc/design/WEBVIEW-PROTOCOL.md` | 489 → 489（±0） | **零改**（机检不吃坐标——只吃判别式集 + ④ 处置列；§13 头注已按 D4 声明 as-of 口径）；§13 ② 列 3 行（`deleteProviderKey` / `deleteEmbedKey` / `deleteWebsearchKey`）坐标**可选**随实现轮 `--emit` 实读重出（不重出亦合规） |
| 11 | 零改面（实测） | — | `webview/chat.js`（410——Escape 既有分支 `:93-105` 不动）· `webview/settings-state.js`（53）· `webview/controls.css`（658）· `webview/settings.css` · `webview/session-bar.js`（138）· `webview/mode-buttons.js`（119）· `src/**`（宿主删除语义）· `test/smoke-settings.mjs`（97）· `test/helpers/webview-env.mjs`（91）· `thincoder-core/**` · `thincoder-cli/**` · 需求档 |

**行数口径（D3）**：#9 = 内容行数（`wc -l` 同值，尾空行不计）；#1–#8、#10–#11 为本席实测。`thincoder-vscode/src/extension/panel-messages.mjs` 实测 **487**（父侧口径 488——尾空行差 1）——**本批不触它**（不在 §1.4 写域列）。

### 2.4 用例表（正常 / 取消 / 边界 / 键盘 / 双源 / 结构对账）+ 先红形态

**档** = `thincoder-vscode/test/settings-secret-delete-confirm.test.mjs`（新建 · 登记入 `test/files.mjs`）；夹具 = `test/helpers/webview-env.mjs`（happy-dom + 全量 id 夹具）+ 真 `chat.js` / `settings.js` / 卡模块；驱动 = 真 DOM `.click()`（**不直驱 handler**——除 W17-4 的无 UI 载体入口）。

| 编号 | 组 | 输入 / 动作 | 期望（断言级） |
|---|---|---|---|
| W17-1 | 正常 · **必红** | build（`websearchSettings{hasKey:true}`）→ 点 `#row-websearch .del-key` | `capturedPosts` **零增** ∧ `document.querySelectorAll(".auto-confirm").length === 1`。**先红读数 = 恰 1 条 `deleteWebsearchKey`** |
| W17-2 | 正常 · **必红** | 同 W17-1 → 点 `.auto-confirm-yes` | 恰 1 条 `{type:"deleteWebsearchKey"}` ∧ 弹框 + 遮罩移除。**先红读数 = 弹框不存在（`.auto-confirm` = 0）** |
| W17-3 | 正常 · **必红** | build（`indexStatus{hasEmbedder:true}`）→ 点 `#row-embed .del-key` → 确认 | 点击零发值；确认后恰 1 条 `deleteEmbedKey`。**先红读数 = 点击即 1 条** |
| W17-4 | 正常（无 UI 载体入口）· **必红** | `window._delKey("deepseek", btn)`（provider key 死 handler）→ 确认 | 调用零发值；确认后恰 1 条 `{type:"deleteProviderKey",name:"deepseek"}`。**先红读数 = 调用即 1 条** |
| W17-5 | 取消 | ✕ → 点 `.auto-confirm-no` | 零删除消息 ∧ 弹框 / 遮罩移除 ∧ `#row-websearch` `outerHTML` **逐字同**点击前（行内状态复原） |
| W17-6 | 取消 | ✕ → 点 `.auto-backdrop` | 同 W17-5（零发值 + 移除） |
| W17-7 | 取消 | ✕ → 弹框内派发 `keydown` Escape | 零发值 ∧ 弹框移除 ∧ `#settings-panel` 仍可见（`display === "flex"`——**不连带关面板**） |
| W17-8 | 取消 | ✕ → 点 `#settings-close` | 零发值 ∧ 弹框 + 遮罩移除（`closeSettings()` 同清） |
| W17-9 | 边界（误点连点） | 同一 ✕ 连点两次；再以 `MouseEvent("click",{detail:2})` 派发 `.auto-confirm-yes` | 弹框恒 **1**（单例）∧ 零发值（双击第二击护栏生效） |
| W17-10 | 边界（跨入口单例） | websearch ✕ → embed ✕ → 确认 | 弹框恒 **1** ∧ 零发值；确认后**恰 1 条 `deleteEmbedKey`**（websearch 那条零出现） |
| W17-11 | 边界（弹框在位时重绘） | 开框（websearch）→ 派发 `{type:"websearchSettings", settings:{hasKey:true}}`（整行重绘）→ 确认 | 恰 1 条 `deleteWebsearchKey`（**载荷闭包**：重绘不改删除目标、不吞确认） |
| W17-12 | 键盘 | 开框 → `await sleep(60)` | `document.activeElement` = `.auto-confirm-no`（安全默认） |
| W17-13 | i18n 双源 | 注入 zh / en 全文 → 开框 | 弹框正文 === `zh.json["settings.secretDeleteConfirm"]` / en 同键值（**≠ 键名**——缺键时 `t()` 回退返回键名 ⇒ 断言捕获）。**先红读数 = 键不存在（探针实测 `undefined`）** |
| W17-14 | 零回归（非密钥类） | provider 行 −（卡 HTML 位 `settings-providers.js:182`）单击 | 恰 1 条 `{type:"removeProvider",name}` ∧ **零弹框** |
| W17-15 | 零回归（非密钥类） | provider 编辑行取消重建位 −（`:48-49`——`_editKey` → 取消 ⇒ 重建的 − 钮）单击 | 恰 1 条 `removeProvider` ∧ 零弹框 |
| W17-16 | 零回归（非密钥类） | MCP server 行 ✕（`renderMcpList` 绑定位）单击 | 恰 1 条 `{type:"deleteMcpServer",name}` ∧ 零弹框 |
| W17-17 | 结构对账（fail-closed） | 扫**设置面档** `thincoder-vscode/webview/settings*.js` 的 `postMessage` 顶级 `type` ∈ `delete*` 集 + `_confirmSecretDelete(` 实参范围（域外 `webview/**` 其余 `delete*` 不在扫描内——域边界单源 = `SETTINGS.md` §2.10） | 集（**域内全集 = 4 名**）= {`deleteProviderKey` · `deleteEmbedKey` · `deleteWebsearchKey`}（密钥类——每处发射**落在 `_confirmSecretDelete` 实参括号内**）∪ {`deleteMcpServer`}（可逆类，可直发）；域外 `deleteSession`（`webview/session-bar.js:104`——非密钥类、自有确认面、本批零改）不入集；**未登记新 `delete*` 判别式 ⇒ 红 + 点名**（不静默漏计数） |
| W17-18 | 边界（重绘后绑定在位） | 推送触发整行重绘后：点 `[Change]` 与点 `✕` | `[Change]` ⇒ 行内 `input` 在位（绑定不丢）；`✕` ⇒ 弹框（**不直发**） |

**先红形态汇总（现态必红 · 硬读数见 §2.1 实测）**：① W17-1 / W17-3 / W17-4 = **点击即发**（现态 `settings.js:41` 直通：`deleteWebsearchKey` / `deleteEmbedKey` / `deleteProviderKey` 各 1 条）；
② W17-2 / W17-5…W17-12 / W17-18 = **无弹框可依**（`.auto-confirm` 数恒 0）+ W17-18 侧行内绑定在夹具下不可驱动（`.click()` ⇒ 0 条）；③ W17-13 = 键未在册；
④ W17-17 = 三处密钥类发射**不在** `_confirmSecretDelete` 实参内（且该函数不存在）。
**恒绿档（零回归锚 · 先后同绿）** = W17-14 / W17-15 / W17-16（非密钥类单击即删须**原样**通过——本批若改动该两处载体即本条转红）。

### 2.5 验收标准（回指 F-W17 判据句 · 逐条机判）

| AC | 回指 | 判据（命令 + 断言） |
|---|---|---|
| AC-FW17-1 | 判据句「点击密钥类 ✕ ⇒ 出现确认；确认后才发删除消息」 | `cd thincoder-vscode && node --test test/settings-secret-delete-confirm.test.mjs` 全绿（W17-1/2/3/4；先红读数在册） |
| AC-FW17-2 | 「取消 ⇒ 零发值」 | W17-5…W17-8 全绿（四条取消路径 · 含行内状态 `outerHTML` 逐字复原） |
| AC-FW17-3 | 「非密钥类**行为零回归**（单击即删在位）」 | W17-14/15/16 全绿 ∧ `git diff thincoder-vscode/webview/settings-providers.js` 对 `:182` / `:48-49` 与 `settings-tools.js:180` / `:184-188` **零改动**（结构面复核） |
| AC-FW17-4 | 「i18n 双语文案在册」 | W17-13 全绿 ∧ `locales/{en,zh}.json` 各 +1 键（258 → 259 行；键名同） |
| AC-FW17-5 | 判据句「**所有**密钥 / 令牌 / 凭证类删除按钮」 | W17-17 全绿（**域 = 设置面档 `webview/settings*.js`**；域内发面 `delete*` 判别式集 ↔ 类白名单 **fail-closed** 对账——域内全集 4 名、域外 `deleteSession` 不入集） |
| AC-FW17-6 | §1.3「不改宿主删除语义」+ 协议零增 | `node --test test/protocol-coverage-reverse.test.mjs` 全绿 ∧ `git diff thincoder-vscode/src` **空** |
| AC-FW17-7 | §1.5-3 零回归总门 | `cd thincoder-vscode && npm test` 全绿 ∧ `npm run lint` = OK（既有 `smoke-settings.mjs` 的 `_confirmDelete` 断言不动 ⇒ 必须仍绿） |
| AC-FW17-8 | 文档面 | `node scripts/doc-check.mjs --root .` **按档归属零新增**（读数：悬空 **5** · 行宽 **11**——与本批开工基线同值；见 §2.8 上抛 8） |

### 2.6 零回归锚（列断言 · 非密钥类逐条）

| # | 入口 | 载体（本批**零改动**） | 断言 |
|---|---|---|---|
| R1 | provider 行 − | `thincoder-vscode/webview/settings-providers.js:182`（卡 HTML 生成）+ `window._removeProvider`（`:64-66`） | 单击 ⇒ 恰 1 条 `{type:"removeProvider",name}` ∧ 零弹框（W17-14） |
| R2 | provider 编辑行取消重建 − | 同档 `:48-49`（`_editKey` 的 `onCancel` 重建的 − 钮） | 同 R1（W17-15） |
| R3 | MCP server 行 ✕ | `thincoder-vscode/webview/settings-tools.js:180` 生成 / `:184-188` 绑定 → `deleteMcpServer` | 单击 ⇒ 恰 1 条 `{type:"deleteMcpServer",name}` ∧ 零弹框（W17-16） |
| R4 | `_confirmDelete` 直通语义 | `thincoder-vscode/webview/settings.js:41` | 函数体 `action()` 逐字不变（仅注释改判据句）；**调用点 5 处 = 3 改门 + 2 零改**——改门（密钥类）= `settings-providers.js:57`（`_delKey`）· `settings-tools.js:26`（`_delEmbedKey`）· `settings-tools.js:43`（`_delWebsearchKey`）；**零改**（可逆类）= `settings-providers.js:65`（`_removeProvider`）· `settings-tools.js:186`（`deleteMcpServer`） |

### 2.7 边界（不做）

不改宿主删除语义（`thincoder-vscode/src/extension/settings.mjs` / `settings-panel-write.mjs` 零改）· **不引入撤销机制**（用户 21:07 口径）· 不改非密钥类单击即删行为 ·
不新增协议形态（消息名 / 载荷字段零增）· 不动 MCP 编辑表单的 token / headers 清空语义（表单路径，见上抛 1 / 2）·
不动 `webview/session-bar.js` / `webview/mode-buttons.js` 的既有弹框（只登记消解路径）· 新增 CSS 零 ·
不改需求档（父侧笔）· 不改他批档与 `_archive/**` · 不碰 `thincoder-core/**` · `thincoder-cli/**`。

### 2.8 上抛项（父侧 / 评审面）

| # | 级别 | 发现 | 建议处置 |
|---|---|---|---|
| 1 | 🟡 | **F-W17 枚举与实测不符（需求档笔在父侧）**：判据句括注「provider key · MCP token/headers · websearch key · 嵌入 key」= 四类，实测 = **2 处 live 密钥入口**（websearch key ✕ `settings-tools.js:263`；嵌入 key ✕ `:276`）+ **1 处无 UI 载体的密钥 handler**（`_delKey` `settings-providers.js:56-58`——承归档决策 UI 不再暴露）+ **1 类无删除钮**（MCP token/headers）；且派单括注的「显示位 `settings-tools.js:23` / `:51`」与实测不符（真掩码显示位 = `:260` websearch · `:273` embed；`:23` / `:51` 分别为 `_delEmbedKey` 的 `onCancel` 行与 `toolsCardHtml` 起始行） | 需求档 F-W17 括注按实测收正（**`D3` 计数与清单同改**）；本设计已按「**所有**密钥类删除路径必过确认」的判据句覆盖实测全集（含死 handler），不因计数差异放行 |
| 2 | 🟡 | **「MCP token/headers」无删除按钮**：其唯一删除路径 = 编辑表单清空 token / headers 后保存（`thincoder-vscode/src/config-mcp.mjs:52-54` 的 `if (cfg.token)` / `if (cfg.headers)` ⇒ 条目重建时字段消失；webview 侧 `settings-tools.js:119-128` 读表单 → `:131` 发 `editMcp`）——**表单语义 ≠ 删除按钮**，不在判据句射程 | 父侧裁定：登记（建议——不属「删除按钮」判据句）或另立条目（若要求，须新需求行 + 独立确认形态设计） |
| 3 | 🟡 | **MCP server 行 ✕ 的归类张力**：删整条时其 token / headers 一并消失（原文同样不可复得），而需求档把它归「非密钥类（可逆）」。本批按需求档裁定执行（**单击即删 · 零回归**），但归类与第 1 条的类判据（可逆性）存在张力 | 父侧确认归类（若改为密钥类 ⇒ 属新语义，须另批：会破本批「非密钥类零回归」锚） |
| 4 | 🔵 | **确认弹框形态三处同族重复**（`session-bar.js:75-107` · `mode-buttons.js:54-92` · 本批 settings 面一处）——本批只在 settings 面立单源 | 建议**不本批**迁移（越写域 + 两面零测试覆盖 ⇒ 迁移无回归网）；消解路径 + 到期条件已入 `SETTINGS.md` §3；父侧可裁定扩写域（工作 = 抽 `webview/confirm-popover.js`（拟新增）+ 三点迁移 + 两面补测） |
| 5 | 🔵 | **`_delKey` 死 handler 长期处置**：本批纳入同门（保持其死态 + 协议保留）；「删 handler」或「恢复 UI 只删 key 入口」均待裁 | 建议保持现状（与归档决策 D2 一致）；若要恢复 UI 入口 ⇒ 另立条目（新语义） |
| 6 | 🔵 | **CLI 对位面未核（越本批写域）**：本次仅在本批范围内核 VSC 面；`thincoder-cli/src/**` 未作密钥删除确认对位的深核（探针 grep `removeProviderKey` / `deleteProviderKey` 零命中——**未深核，不作结论**） | 若需求侧要端差登记（`requirements/WEBVIEW.md` §4），另批核 |
| 7 | 🔵 | **批档 §1 机读状态行补足（本席落笔 · 明示）**：原 §1 段内无 `**状态行**：` 前缀行（状态行仅存于档头 `:3` 的引用块 ⇒ **在 `## §1` 段外**），`batch_segment` 按 `BATCH-RECORD.md` §4.9 判「状态行不可解析」**拒写全档**。本席在 §1 标题下**增 1 行机读状态行**（值逐字复制档头行「🔄 进行中（设计轮 · eng-designer）」，档头行与 §1 其余内容**一字未改**）——属「形态收正」（一致性面 · 无内容授权），仍**明示上报**（父侧不认 ⇒ 单行可回退；若认 ⇒ 建议父侧后续档统一用段内形态） | 父侧裁：认可（建议——与 `vsc-settings-wiring` 档同形态）或回退该行并改由父侧落笔 |
| 8 | 🔵 | **`doc-check` 读数（本席复跑）**：悬空 **5** · 行宽 **11**——与本批开工基线（同为 5 / 11）**同值** ⇒ `SETTINGS.md` 归属零新增；`SETTINGS.md` 现无入闸违例（本轮笔中途曾产生 2 条悬空 + 1 条超宽，**均已当场收正**：短形路径改全限定 · 前向引用加 `（拟新增` 标记 · 长行拆行）；新增 `拟新增` 族 1 条（`webview/confirm-popover.js`——列报 · 不入闸，= 设计预期的前向引用形态） | 无需动作 |
| 9 | 🔵 | **行数口径差 1**：`thincoder-vscode/src/extension/panel-messages.mjs` 本席实测 **487**（§1.1 口径 488——尾空行差） | 无需动作（本批不触该档）；父侧收口时按实测口径统一 |

（eng-designer · **fix 轮（设计评审轮 1 后）** 2026-09-18）

**裁决**：评审 id=109 = **PASS**（🔴 0 · 🟡 3 · 🔵 3）——父侧逐条裁定：发现 **3 = 父侧就地落**（§1.2 ① / §1.5-1 计数与清单按需求档实测册收正）；发现 **1 / 2 / 4 / 5 / 6 共 5 项由本席逐号落地**（`Suggestion` 列 = 建议；处置执行人 = 本席）。
**段内处置（append-only 例外已打标）**：§2.3 #1 · #2 · #3 · #9 / §2.4 W17-17 / §2.5 AC-FW17-5 = **就地校正**（D3 计数与清单同改；残留以现值为准）。
**零新语义**：五项均为评审发现 + 父侧裁定的直接导出项（无新需求条目、无新 AC 号、无新用例号、无实现面改动）。

| 号 | 级别 | 处置 | 落点（file:line = as-of fix 轮末） | 读数 |
|---|---|---|---|---|
| 1 | 🟡 | 结构对账**扫描域收窄到设置面档**（`webview/settings*.js`）+ 域边界句 + W17-17 / AC-FW17-5 同步 | `SETTINGS.md:216-217` · 批档 `:118` · `:134` | 域内顶级 `delete*` 发射实测 4 名（`settings-providers.js:57` · `settings-tools.js:26` / `:43` / `:186`）= 与白名单逐名同；域外 `deleteSession` 在 `webview/session-bar.js:104`（自有确认面 `:75-107`）——不属本判据域 |
| 2 | 🟡 | **`renderKeyRow` 绑定范围明示**（该行两个控件：编辑钮 `[Change]` / 空态同位的 `[Add]` + `✕`——同一单点） | `SETTINGS.md:207-208`（+ 理由句 `:212`） | 生成位实读：`settings-tools.js:262` / `:275`（编辑钮）· `:263` / `:276`（✕）· `:264` / `:277`（空态 Add）；W17-18 断言**保留成立**（用例主体零改） |
| 4 | 🔵 | 锚点漂移收正：`settings-tools.js:21` → **`:20`** | `SETTINGS.md:209` · 批档 `:73` | 实读 `:20` = `document.getElementById("row-embed").outerHTML = embedRowHtml()`；`:21` = `},`；websearch 侧 `:37` 原即正确 |
| 5 | 🔵 | 受影响表 #3 补 **tier 说明** | 批档 `:84` | `settings-tools.js` 368 → ~382（+14）：改动前即在 300 行建议线之上、远未近 500 硬限；本批增量不改结构 / 不增模块职责 ⇒ 拆分另行评估 |
| 6 | 🔵 | 弹框**清除入口收敛为 1**（`closeSettings()` 经 `settings-widgets.js` 导出的同一清除入口；开框前单例清理 · 框内三条取消 · 关面板同此入口） | `SETTINGS.md:186` · `:191` · `:203` · 批档 `:82` / `:83`（受影响表镜像同步） | 触点现状实读：`settings.js:102-107`（`closeSettings()`）与弹框件内 close 闭包两处 ⇒ 收敛后 = 1；`closeSettings()` 行数不动 |

**本轮边界（守）**：需求档零改 · 实现面代码零改 · 他批档零改 · `_archive/**` 零改 · 用例主体（W17-1…W17-18：号 / 动作 / 期望）零改 · 机制条文除上述五项同点改笔（域边界 · 绑定范围 · 清除入口 · 坐标 · tier）外零改。
**机检读数（复跑 `node scripts/doc-check.mjs --root .`）**：锚 **悬空 5** · 行宽 **11**——与本批开工基线（§2.8 #8 同值）同值 ⇒ **按档归属零新增**（`docs/vsc/design/SETTINGS.md` 不在失败列；`confirm-popover.js（拟新增）` 一条 = 既有列报 · 不入闸，行号 226→230 随 +4 行移位）。**轮内自捕获 1 条**：新增变更记录行首版 384 字符超宽（行宽读数一度 11→12）⇒ **当场拆行为 3 行**，复跑回 11。
**待裁（2 项 · 非阻断）**：① 评审发现 4 引述「批档 `:84` 载该坐标」——实读该行（§2.3 行 3）**无该坐标**；坐标仅存 `SETTINGS.md:209` + 批档 `:73` 两处，均已收正；② 批档 §2.1「载体绑定」行与 §2.2 D-W17-3 标题的自述主语仍为「密钥行 ✕」（细节单源 = `SETTINGS.md` §2.10——按 D2 未在批档重述；若父侧要批档同宽，各一行可改）。

## §3 设计评审记录

（评审子代理写）

### 轮次 1（评审子代理）

设计评审（对象 = `docs/vsc/design/SETTINGS.md` §2.10 + `docs/batches/2026-09-18-vsc-key-delete-confirm.md` §2；对位 = `docs/vsc/requirements/WEBVIEW.md` F-W17）。评审 = 独立评审者；核对面 = 三档全文 + 设计所引代码锚逐点实读（settings.js / settings-widgets.js / settings-tools.js / settings-providers.js / session-bar.js / mode-buttons.js / chat.js / controls.css / settings.css / i18n.js / locales / test/helpers/webview-env.mjs / test/files.mjs / test/settings-refill.test.mjs / src/config-mcp.mjs）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Acceptance criteria | 🟡 | W17-17（批档 §2.4）声明扫描域 = `thincoder-vscode/webview/**`，期望集只列 4 名（`deleteProviderKey` · `deleteEmbedKey` · `deleteWebsearchKey` ∪ `deleteMcpServer`）；同域内 `webview/session-bar.js:104` 另有顶级 `deleteSession` 发射（已核）⇒ 按所写规则必红，AC-FW17-5「W17-17 全绿」按字面不可达；且设计的两分类白名单（密钥类必确认 / 可逆类可直发）无 `deleteSession` 落位（非密钥类但不可逆，且已有自有确认面 `session-bar.js:75-107`） | 二选一并同步 W17-17 的「集 =」表达式与 AC-FW17-5：① 扫描域收窄到设置面档（`webview/settings*.js`）；② 将 `deleteSession` 入册并给出处置（第三类：非密钥类·已有自有确认面·本批零改） |
| 2 | Clarity | 🟡 | W17-18 断言「点 `[Change]` ⇒ 行内 `input` 在位」，但绑定改造的自述范围只到 ✕（`SETTINGS.md:207` 标题「载体绑定（密钥行 ✕：行内 `onclick` → `addEventListener`）」；`SETTINGS.md:211` 只声明「非密钥类两处不在内」，未论 [Change]）；而本批已实测行内属性绑定在夹具下不可驱动（批档 `:65`：`typeof btn.onclick === "object"` ∧ `.click()` ⇒ posts +0）⇒ [Change] 若保持行内绑定，该半条断言在夹具下不可达 | 明示 `renderKeyRow` 的绑定控件范围：含 [Change]（一并改 `addEventListener`）则 W17-18 成立；仅 ✕ 则把 W17-18 的 [Change] 半条改为非点击面断言 |
| 3 | Document ownership | 🟡 | 批档 `:18`（§1.2 ①）与 `:34`（§1.5-1）仍用收正前的「四类密钥删除入口（provider key · MCP token/headers · websearch key · 嵌入 key）」/「四类密钥入口逐条用例」；需求档 `WEBVIEW.md:34`（21:2x 收正）与 `SETTINGS.md:173` 已判 MCP token/headers **无删除钮**（唯一路径 = 表单清空保存）⇒ 同族计数两处不一致，§1.5-1 与 §2.4 用例面（3 处密钥入口 + 3 处非密钥零回归）不可逐字对齐 | 按收正后实测册改写批档 §1.2 / §1.5 的计数与清单（3 处密钥入口 + 表单路径转登记），与 §2.10 入口册同步（D3 计数与清单同改） |
| 4 | Clarity | 🔵 | 锚点漂移 1 处：`SETTINGS.md:208` 与批档 `:73` / `:84` 把 embed 行 `onCancel` 的手写重建位记为 `settings-tools.js:21`；实读该赋值在 `:20`（`:21` = `},`）；websearch 侧 `:37` 正确 | 改指 `settings-tools.js:20` / `:37`（语义无差） |
| 5 | Affected-file annotation | 🔵 | `settings-tools.js` 368 → ~382（+14）已带现况 + Δ（标注合规）；该档改动前即处 300 行建议线之上（远未近 500 硬限），设计未附拆分评估 | 补一行 tier 说明（本批增量不改结构、拆分另行评估）或给出拆分触发条件 |
| 6 | Clarity | 🔵 | `SETTINGS.md:186` 声明弹框「本面单源 = `settings-widgets.js` 的 `showConfirmPopover`」，而 `SETTINGS.md:203`（取消路径 #4）说 `closeSettings()` 同清弹框与遮罩 ⇒ 弹框 DOM 有两个触点，单源语句与取消路径写法留缝 | 由 `settings-widgets.js` 导出同一清除入口、`closeSettings()` 调它（弹框 DOM 触点收敛为 1） |

已核事实（作为上述判据的底）：F-W17 判据句覆盖完整（3 处密钥入口 2 live + 1 死 handler 全在设计入口册；MCP token/headers 转登记；非密钥 2 处零回归锚）、`_confirmDelete`（`settings.js:41`）与 5 处调用点计数（3 改门 + 2 零改）逐点对得上、`_delKey` 全树零 UI 调用（无 `_delKey(` 调用位）⇒「死 handler」定性成立、`.auto-confirm-yes` / `.auto-confirm-no` / `.auto-backdrop` / `z-index` 1000（controls.css:599）> 面板 20（settings.css:7）、`controls.css` 经 `index.html:9` 加载、`t()` 缺键回退键名（i18n.js:28）、`session.delete` / `question.cancel` 在位且 `settings.secretDeleteConfirm` 未在册、双 locale 258 行、`test/files.mjs` 93 行清单制、`config-mcp.mjs:52-54` 的 `if (cfg.token)` / `if (cfg.headers)` 证词成立、协议零增与宿主零改面自洽。

计数：🔴 0 · 🟡 3 · 🔵 3。

VERDICT: pass

## §4 用户批准

**2026-09-18 21:09 用户直接裁定** —— 逐字「**最好确认一下**」（= 取父侧呈请的 B 方案：密钥类二次确认 · 非密钥类保持单击即删 · 不取撤销机制）。

## §5 实施与修正记录

（eng-coder 写）

（eng-coder · **实现轮** 2026-09-18）

### 5.1 交付摘要

F-W17 逐条落地（判据权威 = `SETTINGS.md` §2.10）：

- **双门并存**：`window._confirmDelete(btn, action)` 直通体逐字未动（`webview/settings.js:43`，仅注释改判据句）；新增 `window._confirmSecretDelete(btn, action)`（`:48-55`）⇒ 弹框。
- **密钥类 3 处全过门**：websearch ✕（`webview/settings-tools.js:45-47`）· embed ✕（`:27-29`）· `_delKey` 死 handler（`webview/settings-providers.js:56-58`）。
- **可逆类 2 处逐字零改**：provider 行 −（载体 `webview/settings-providers.js:182` 行内 onclick 在位 · `_removeProvider` `:64-66` 直通）· MCP 行 ✕（`webview/settings-tools.js:187` 生成 / `:191-195` 绑定 → `_confirmDelete`）。
- **弹框单源** = `webview/settings-widgets.js`：`showConfirmPopover({text,yesLabel,noLabel,onConfirm})`（`:76-104`）+ 唯一清除入口 `closeConfirmPopover()`（`:107-109`）；`showConfirmPopover` 的首行即单例清理，`closeSettings()`（`webview/settings.js:120`）同经该入口。
- **四条取消路径**：取消钮 `:95` / 遮罩 `:80` / 框内 Escape（`:97-101`，`stopPropagation` ⇒ 不连带 `chat.js:93-105` 的关面板分支）/ 关面板同清。
- **弹框契约其余要素**：挂 `document.body`（`:102`）· 载荷闭包（`settings.js:48-55` 传入调用点闭包，`:93` 调 `onConfirm()`）· 焦点安全默认（`:103`）· `e.detail > 1` 连点护栏（`:90-91`）· 零新增 CSS（复用 `.auto-confirm` / `.auto-backdrop`）。
- **载体绑定单点**：`renderKeyRow(id, html, {skipWhileEditing})`（`webview/settings-tools.js:305-315`）——键行两控件（`[Change]`/空态 `[Add]` 与 `✕`）一并装配（`KEY_ROW_ACTIONS` `:289-298`），行内 onclick 摘除；三处重绘（推送回填 / 索引状态 / 两处 `onCancel`）收敛此点。
- **文案净增 1 键**：`settings.secretDeleteConfirm`（`locales/en.json:173` · `locales/zh.json:173`，各 258 → 259 行）；钮文案复用 `session.delete` / `question.cancel`。
- **用例档** `test/settings-secret-delete-confirm.test.mjs`（W17-1…W17-18）新建 + 登记 `test/files.mjs:94`。

### 5.2 受影响文件表（Δ 实测 · 行数 = `split("\n")` 口径）

| # | 文件 | 现况 → 实测 | 说明 |
|---|---|---|---|
| 1 | `thincoder-vscode/webview/settings.js` | 123 → **138**（+15） | 双门安装（新增 `_confirmSecretDelete` · 14 行含注释）+ 导入 2 行 + `closeSettings()` 1 行 |
| 2 | `thincoder-vscode/webview/settings-widgets.js` | 70 → **109**（+39） | `showConfirmPopover` + `closeConfirmPopover` |
| 3 | `thincoder-vscode/webview/settings-tools.js` | 368 → **395**（+27） | 两 handler 改门 · 键行 HTML 摘 onclick · `renderKeyRow` 单点 + `KEY_ROW_ACTIONS` · `bindToolsControls` 两行装配（tier 见批档 §2.3 #3，不改结构） |
| 4 | `thincoder-vscode/webview/settings-providers.js` | 269 → **269**（±0） | `_delKey` 1 行改门（其余逐字不变） |
| 5 | `thincoder-vscode/locales/en.json` | 258 → **259**（+1） | 新键在册 |
| 6 | `thincoder-vscode/locales/zh.json` | 258 → **259**（+1） | 同键 zh |
| 7 | `thincoder-vscode/test/files.mjs` | 93 → **95**（+2） | 新档登记（注释 + 条目） |
| 8 | `thincoder-vscode/test/settings-secret-delete-confirm.test.mjs` | 新建 **333** | W17-1…18（预估 ~230 ⇒ 实测 333，count 漂移以实测为准） |
| 9 | 零改面（实测） | — | `thincoder-vscode/src/**`（`git diff` 空）· `webview/chat.js` · `webview/controls.css` · `webview/session-bar.js` · `webview/mode-buttons.js` · `webview/settings-state.js` · `docs/vsc/design/WEBVIEW-PROTOCOL.md` · 需求档 · 他批档 · `_archive/**` |

### 5.3 先红读数（开工态源码 + 新用例档直驱 `node --test`）

**总读数：14 红 / 4 绿**（`pass 4 · fail 14`）。逐条形态：

| 用例 | 红态实测表现 |
|---|---|
| W17-1 / W17-3 | 点击 ✕ 后 `.auto-confirm` = **0**（无框可依）——注：点击面在夹具下不驱动行内属性绑定 ⇒「零发值」断言在红态空过（与设计轮 §2.1 实测同） |
| W17-2 / W17-5…W17-12 / W17-18 | 无框可依（取消钮 / 遮罩 / yes 钮 / 弹框不在位） |
| W17-4 | `window._delKey(...)` ⇒ **立即 1 条** `{type:"deleteProviderKey",name:"deepseek"}`（点击即发硬读数——handler 直驱，与设计轮实测逐字同） |
| W17-13 | `zh.json["settings.secretDeleteConfirm"]` = **undefined**（键未在册） |
| W17-17 | 密钥类发射**不在** `_confirmSecretDelete` 实参括号内（且该函数不存在） |
| W17-14 / W17-15 / W17-16 | **恒绿（先后同绿）** — 非密钥类零回归锚现态即绿 ✓ |
| W17-8 | 首轮红跑时该例为绿（当轮断言不含「开框在位」）⇒ **当场补强**（补 `.auto-confirm + .auto-backdrop = 2` 断言）；补强后「现态源码下必红」由 W17-1 红读数（点击 ✕ 后弹框 = 0）直接推得，未单独复跑 |

### 5.4 用例与门禁读数（绿态）

- `node --test test/settings-secret-delete-confirm.test.mjs` ⇒ **18/18 pass**（W17-1…W17-18 逐条）。
- `cd thincoder-vscode && npm test` ⇒ **661/661 pass**（开工基线 643 + 本批 18）。
- `npm run lint` ⇒ `check-syntax: 202 JS files OK`。
- `node scripts/doc-check.mjs --root .` ⇒ 悬空 **5** · 行宽 **11**（与开工基线同值 ⇒ 按档归属零新增）。
- `git diff thincoder-vscode/src` ⇒ **空**（宿主删除语义零改）。

### 5.5 决策透明表（实现轮判定点）

| # | 判定 | 理由 / 设计对位 |
|---|---|---|
| D-1 | `renderKeyRow` 签名取 **`(id, html, {skipWhileEditing})`**（设计文本为 `(id, html)`） | 第三参为**守卫开关**：两处 `onCancel` 重建时输入框在位，守卫不显式关则无法回静止态；单点语义（渲染 + 绑定 + 三处重绘收敛）不变，签名为超集 |
| D-2 | `bindToolsControls()` 增两行 `renderKeyRow(...)` 装配 | 行内 onclick 摘除后，**建面路径**也须经单点装配（否则首拍推送到达前钮无绑定——W17-18 判据面对建面同理） |
| D-3 | W17-14 的载体面以**结构对账**钉住（卡 HTML 仍带行内 `onclick`），动作面直驱 handler | 夹具（happy-dom）不执行行内属性绑定（设计轮实测）；载体面 = AC-FW17-3 的结构半条，非掩盖（用例头注 + 批档 §2.1 在册） |
| D-4 | W17-17 识别面**加宽**：引号三态（`"` / `'` / 反引号）+ 属性顺序不限 + 同名声逐处计数（门内数 = 总数） | 只认单一书写形态的识别即 fail-closed 洞（单引号 / `type` 非首属性 / 同名声第二处无门发射都会漏计）；负控已验（合成源四形态逐条点名） |
| D-5 | W17-12 / W17-18 的固定 `sleep` 改**条件轮询** `waitFor` | 消除与 `setTimeout(...,50)` 焦点定时器的抢拍余量（R4） |
| D-6 | **未实现**「取消后焦点归还」 | 设计 §2.10 契约未要求（不自行发明交互）；已登记为残余项（评审 🔵） |

### 5.6 审计与代码评审轮次与终态

- **内部审计**（explore · 读-only 分歧审计）**轮 1**：DEVIATIONS（🔴 0 · 🟡 2 · 🔵 4）；四类偏差：PARTIAL 1（用例动作面）· SILENT-SIMPLIFICATION **无** · DOC-DRIFT 1 · OUT-OF-LIST **无**；结论句 =「实现面无静默降级、无部分实现」。
- **代码评审**（advisor · type=code）**轮 1**：VERDICT **pass**（🔴 0 · 🟡 3 · 🔵 4）——🟡 = ① 用例档 333 行 > 300 建议线（advisory）② 本 §5 写入前为空段（本轮已落笔）③ MCP token/headers 与 MCP 行归类的**协调项**（批档 §2.8 #2/#3 已登记待父侧裁）；🔵 = 扫描识别面加宽 / 墙钟抢拍 / 取消后焦点归还 / `settings-tools.js` 行数（已裁定不重开）。
- **fix 轮（自修）**：D-3 / D-4 / D-5 三项当场落地（用例面，零实现面改动）；D-6 登记不动作；文档面与协调面（设计档漂移 · 批档计数 · §1 状态行）按越界纪律**只报不改**。
- **终态** = `clean`（审计与评审均无 🔴 · 无 must-fix；自修轮 1 轮即收敛，累计审计 1 轮 + 评审 1 轮 + fix 1 轮）。
- **未核项（诚实登记）**：审计/评审侧无执行权限 ⇒ 上述测试与 lint 读数为**本席实跑**（命令与读数见 §5.4）；subagent 无法核验的「零改面」由本席以 `git diff` 实核补齐（`src` 空 ✓ · 非密钥类两档 diff 仅 `_delKey` 1 行 ✓）。

### 5.7 上抛 / 待父侧处置（不阻断 · 设计档与批档写域不在本席）

1. **设计档坐标与命名漂移**（`SETTINGS.md` §2.10 · 未改设计档）：入口册坐标 +7~+8（`:263`→**270** · `:276`→**283** · `:42-44`→**45-47** · `:25-27`→**27-29** · `:180`→**187** · `:184-188`→**191-195**）；两处 `onCancel` 重建位 `:20`/`:37` → **`:22`/`:40`**；「否决理由 #1」引述的 `rerenderKeyRow`（`:283-288`）现名 **`renderKeyRow`（`:305-315`）**；§2.10 载体绑定段所写签名 `renderKeyRow(id, html)` 实为三参超集；§2.10 取消路径 #4「触点收敛为 1」的域 = 设置面档（域外 `chat.js:103-104` 为既有零改面）。
2. **批档 §2.3 计数漂移**（预估 vs 实测）：行 3 = 368 → 预估 ~382，实测 **395**；行 8 = 预估 ~230，实测 **333**。批档 §1 状态行仍为「设计轮 · eng-designer」、§6 待父侧收口。
3. **协调项**（评审 🟡 · 批档 §2.8 #2/#3 已登记）：MCP token/headers 表单清空路径不属「删除按钮」判据句（本批不动表单语义）；MCP server 行归类张力待父侧裁（若改判 ⇒ 另批，会破本批零回归锚）。

## §6 验证与收口

**收口（2026-09-18 21:4x · 父侧直接执行）**

- **交付判据**：设计（id=108）→ 评审 **pass**（id=109 · 0🔴 / 3🟡 / 3🔵）→ 修正（id=110 · 5/5）→ 实现（id=111 · 终态 clean：内部审计无 🔴 + 代码评审 pass + fix 轮）⇒ **F-W17 全闭**。
- **验收读数**：新用例档 **18/18 pass**（**父侧独立复跑同值**）· vsc `npm test` **661/661**（基线 643 + 18）· `npm run lint` OK（202 档）· `git diff thincoder-vscode/src` **空** · `doc-check` 悬空 5 / 行宽 11（= 开工基线 ⇒ 按档归属零新增）。
- **先红后绿**：W17-1/2/3/5…12/18（无框可依）· W17-13（键不存在）· W17-17（三处发射不在门内）· **W17-4 硬读数**（`window._delKey(…)` 调用即发 1 条 `deleteProviderKey`）；**恒绿锚**：W17-14/15/16（非密钥类单击即删先后同绿）。
- **零回归实核**：非密钥类两档 diff 仅 `_delKey` 1 行（其余逐字未变）· `src/**` 零改 · 协议档零改。
- **落地要点**：双门并存（名字即类）· 密钥类 3 处入口全过门 · 弹框单源（`showConfirmPopover` + 导出唯一清除入口 `closeConfirmPopover()`）· 四条取消路径 + 单例 + 连点护栏 + 焦点安全默认 · 密钥行两控件（`[Change]`/`[Add]` + `✕`）绑定收敛 `renderKeyRow` 单点。
- **设计档漂移（登记 · 实现轮回显 · 未改设计档）**：① 入口册坐标 +7~+8（`:263`→**270** · `:276`→**283** · handler `:42-44`→**45-47** / `:25-27`→**27-29** · MCP `:180`→**187** / `:184-188`→**191-195**）；② 两处 `onCancel` 重建位 `:20`/`:37` → **`:22`/`:40`**；③「否决理由 #1」引 `rerenderKeyRow`（`:283-288`）现名 **`renderKeyRow`（`:305-315`）**；④ §2.10 所写签名 `renderKeyRow(id, html)` 实为**三参**（第三参 = 守卫开关）；⑤ 取消路径 #4 的触点收敛域 = 设置面档（域外 `chat.js:103-104` 为既有零改面）。**消解路径 = 设计档作者收正（另轮）**；到期条件 = `SETTINGS.md` 下次触碰。
- **批档计数收正（本轮同笔）**：§2.3 行 3 预估 ~382 → **实测 395**；行 8 预估 ~230 → **实测 333**。
- **状态行**：✅ 已收口 2026-09-18（全档冻结）。
- **台账**：#92 ⇒ 已核销（注：该条目此前被父侧误报「已立」——实际入库时间 = 收口轮，已如实纠正）。
