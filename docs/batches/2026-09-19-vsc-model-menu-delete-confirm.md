# 批：2026-09-19 · VSC 模型菜单 provider 删除确认（台账 #97）

**状态行**：🔄 进行中（设计轮 · eng-designer）

> 批次边界：交付目标 = 「模型菜单底部 **Remove provider** 入口入确认门」（F-W17 **入口册 #6/6**——口径 = 册序）；条目集 = 父侧实核（本档 §1.2）+ 判据「不可复得 ⇒ 须一次显式确认」。
> 前情 = `docs/batches/2026-09-19-vsc-provider-delete-confirm.md`（已收口 · provider 行 ✕ 已过门）——**本批为其同消息的第二载体**（发现来源 = 该批 §5.8 #6 上抛 · 父侧实核）。

## §1 批次任务（父侧）

**状态行**：🔄 进行中（设计轮 · eng-designer）

### 1.1 目标与理由

`removeProvider` 这条 webview→host 消息有**两个载体**：settings 面板行 ✕（`webview/settings-providers.js:68` → `_confirmSecretDelete` 门 · **已收口**）与**模型菜单 footer**（`webview/model-picker.js:25` → `vscode.postMessage({ type: "removeProvider" })` **裸发、零确认**）⇒ 删 provider 连同其 `apiKey` 原文不可复得，**同一判据下此路漏门**。

### 1.2 已知事实（父侧实核 · 勿重查）

| # | 事实 | 坐标 |
|---|---|---|
| ① | 模型菜单 footer 三入口：Add provider / **Remove provider** / Set key；**Remove 直发**（无 name ⇒ host 侧 QuickPick 选） | `thincoder-vscode/webview/model-picker.js:23-27`（`:25` 为 Remove） |
| ② | settings 面同消息**已过门** | `thincoder-vscode/webview/settings-providers.js:67-68`（`window._removeProvider` → `_confirmSecretDelete`） |
| ③ | 门与弹框单源 | `webview/settings.js` `_confirmSecretDelete` · `webview/settings-widgets.js` `showConfirmPopover`/`closeConfirmPopover` |
| ④ | **host 侧处理器待核**（设计轮实读）：`src/extension/**` 内 `type === "removeProvider"` 的落点 + QuickPick 选择面 | 待核 |

### 1.3 本批覆盖的条目

| # | 交付 |
|---|---|
| ① | 模型菜单 **Remove provider** ⇒ **过一次显式确认**（门位 = 设计裁：a) host QuickPick 选定后二次确认；b) host 把选定 name 回给 webview 走既有弹框；c) 其他——**须给选型理由**，并说明与既有「确认件单源」原则的关系） |
| ② | 取消 ⇒ **零删除 ∧ 零消息副作用**（不得先删后问、不得静默降级） |
| ③ | 需求档 F-W17 **入口册补行**（**入口册 #6/6** · 口径 = 册序——2026-09-19 已落 `WEBVIEW.md:34`/`:178`） |

### 1.4 本批不做

- 不改 settings 面已收口的门（`:67-68` 逐字零改）。
- 不改 host 删除语义（`config-io` 写盘 / 级联）。
- 不取撤销机制。

### 1.5 验收口径

1. **可机判**：模型菜单 Remove ⇒ **不立即发删除生效**；确认 ⇒ 删；取消 ⇒ 零删除 ∧ 零消息副作用。
2. **先红**：现态**必须先红**（真分发路径：真 webview 模块点击 + 真 host 处理器；**禁夹具手写载荷**）。
3. **零回归**：Add provider / Set key 两入口零改 · settings 面门零改 · 协议零改 · 宿主删除语义零改。
4. `thincoder-vscode` `npm test` 全绿 + lint OK + `doc-check` 按档归属零新增。

## §2 批次任务与设计

（eng-designer 写）

（eng-designer · **initial 轮** 2026-09-19）

**落点（单源 · D2）** = `docs/vsc/design/SETTINGS.md` §2.10（类判据句 / 入口册 **6 行** / 弹框契约 / 四条取消路径 / 新增「模型菜单入口」段 / 判据域边界）+ §3（+1 条登记）+ §5 U-S11（计数同步）+ 变更记录。本段 = 批次面（待核结论 / 逐条设计 / 决策 / 受影响文件 / 用例 + 先红 / AC / 零回归锚 / 上抛），**不重述机制**。

### 2.1 待核项结论（§1.2 ④ 结清——宿主侧链实读）

| # | 环节 | 坐标（as-of 2026-09-19 · 本席实读） |
|---|---|---|
| ① | 路由（webview→host 消息消费位） | `thincoder-vscode/src/extension/panel-messages.mjs:225`（`case "removeProvider": await handleRemoveProvider(panel, msg)`） |
| ② | 处理器 | `src/extension/panel-messages-settings.mjs:82-90`——`msg.name` 有 ⇒ 直落 `persistRemoveProvider(msg.name)`（= `settings.mjs:166` → 核 `config-io` `removeProviderEntry`）+ `_pushSettings()`；**无 `name` ⇒ `:88` `await removeProviderFlow(() => panel._pushSettings())`** |
| ③ | QuickPick 选择面 | `src/extension/provider-flows.mjs:129-150`——候选 = providers 减 active（`:137`）· 空集早退（`:139`）· `showQuickPick`（`:142-145`）· **取消早退 `if (!sel) return`（`:146`）** · 删 `removeProviderEntry(sel.label)`（`:147`）· 错 ⇒ `showErrorMessage`，否则 `refresh`（`:148-149`） |
| ④ | 菜单渲染位（门位前提） | `webview/model-menu.js:128-134`（footer 行）；`:132` = 「先 `closeModelMenu()`、后调 `f.onClick()`」⇒ 弹框开在菜单 overlay 移除**之后**（`.auto-confirm` z-index 1000 / `.auto-backdrop` 999——无菜单在场即无遮挡） |

**门位结论 = webview 侧调用点**（批档 §1.3 ① 枚举的 **c 案**）：改动 = **单点一行**

```
webview/model-picker.js:25
{ label: t("model.removeProvider"), onClick: () => window._confirmSecretDelete(null, () => vscode.postMessage({ type: "removeProvider" })) }
```

**选型理由（与既有「确认件单源」原则的关系）**：① 与入口册 1–5 **同门同件**（`_confirmSecretDelete` + `.auto-confirm` / `.auto-backdrop`，单源 = `webview/settings-widgets.js`）⇒ 单源**强化**（不新增确认形态）；② 门在 **post 之前** ⇒「取消 ⇒ 零发值」**严格读成立**（批档 §1.3 ② / §1.5 ①）；③ 入口落 webview 档 ⇒ 结构对账**扩域即钉住**。
**否决 a 案（宿主 QuickPick 选定后二次确认）**：宿主侧确认只能落 VS Code 原生件（`showWarningMessage` modal / 二次 QuickPick）⇒ **第二套确认面**，类判据句「不可复得类 ⇒ `_confirmSecretDelete`」字面映射失效；且第一跳 `removeProvider` 已在确认**前**发出（「零消息副作用」只剩宽松读法）。
**否决 b 案（宿主把选定 `name` 回给 webview 走既有弹框）**：需新增宿主→webview 消息 + webview 新 case ⇒ **协议零改**（§1.5 ③）破 + `WEBVIEW-PROTOCOL.md` §13 判别式集须同步（写域外）；且同 a 案的第一跳问题。
**否决第三备选（webview 侧自建目标选择面）**：候选规则单源在 `provider-flows.mjs:137-145`（非 active 过滤 / `model` 描述 / 空集提示）⇒ 自建 = 候选语义**双源**（D2 破 + 两侧不一致的 fail-open 风险）。
**已裁代价（登记 = 设计档 §3）**：确认发生在**目标选定之前**（弹框文案 = 类通用式 `settings.secretDeleteConfirm`、不携 `name`）⇒ 确认的「目标绑定」弱于入口 1–5；补偿 = ① 目标选定步（QuickPick）**自身是一次显式选择**（选定才删）② 选定后取消仍零删除（`provider-flows.mjs:146` 零改）。**消解路径 + 到期条件 = 设计档 §3 该条。**

### 2.2 逐条设计（回指 §1.3 ①②）

| # | §1.3 条目 | 设计要点（落点 = 设计档 §2.10） | 判据 |
|---|---|---|---|
| ① | 模型菜单 Remove ⇒ 过一次显式确认 | 门位 = webview 侧调用点（c 案）；`_confirmSecretDelete(null, () => vscode.postMessage({ type: "removeProvider" }))`——**消息名与载荷逐字不变**（无 `name`）；`btn = null` 依据 = 该实参实现内未使用（`webview/settings.js:47` 注）+ footer `onClick` 由 `model-menu.js:132` 调用时**不传参** | W17-31 / W17-32 |
| ② | 取消 ⇒ 零删除 ∧ 零消息副作用（不得先删后问 / 不得静默降级） | 门在 post 之前 ⇒ 取消 = **零发值** ⇒ 宿主零调用 ⇒ 盘面逐字节不变；**不取防御式回退**（`?.`）——门缺失须响亮失败 | W17-33（+ 恒绿锚 W17-34） |
| ③ | 需求档 F-W17 入口册补行（父侧笔） | 设计档先行落册（**#6 行**）；需求档差集 = §2.9 上抛 1/2/3 | 设计档 §2.10 入口册 6 行 |

**同门同件（弹框族）**：件 = `webview/settings-widgets.js` `showConfirmPopover` / `closeConfirmPopover`（**零改**）；门 = `webview/settings.js:48-55`（**零改**）；四条取消路径 = #1 取消钮（W17-33）· #2 遮罩 / #3 框内 Escape（同件等价覆盖 W17-6 / W17-7）· #4 关面板**本入口不适用**（设置面板不参与；菜单已在开框前关闭 ⇒ 无行内状态可复原——设计档「逐入口完备性」已明示）。
**语言面**：文案键零改（`settings.secretDeleteConfirm` 类通用式 + `session.delete` / `question.cancel` 复用）⇒ `locales/**` 零改、i18n 双源由既有 W17-13 / W17-24 同件等价覆盖。

### 2.3 关键决策记录（含否决备选）

| # | 决策 | 否决备选 / 理由 |
|---|---|---|
| D-M1 | **门位 = webview 侧调用点**（c 案） | 否决 a / b / 自建选择面三案（理由见 §2.1）；本项 = 批档 §1.3 ① 明确交设计裁的项 |
| D-M2 | `btn` 实参取 **`null`** | 否决「改 `webview/model-menu.js:132` 传 `e.currentTarget`」：共享件（footer 渲染）回调契约改动影响 4 处调用方而收益为零；该实参实现内未使用（`settings.js:47`） |
| D-M3 | **结构对账扩域**（域 = `settings*.js` ∪ 显式名单 `model-picker.js` = **9 档**；下限断言 `≥5 ⇒ ≥6`） | 否决「域不动 + 另立第二对账」：结构面单源破（两处判据集可漂移）；否决「域不动、入口 6 不钉」：该入口成**唯一不经门**的载体 ⇒ fail-open 缺口 |
| D-M4 | 用例承载 = **新档** `test/model-menu-delete-confirm.test.mjs`（W17-31…W17-34）+ 主档 **W17-17 同号改判** | 否决「四例全塞主档」：主档 405 + ~100 ⇒ 越 **500 硬限**（越线即当场拆）；结构对账留主档 = 结构面单源 |
| D-M5 | 跨面夹具 = 真 webview 点击 → 捕获消息**逐条喂回真宿主分发**（`handlePanelMessage`，先例 `test/settings-empty-no-write.test.mjs:86-90`）+ 临时 config（`_setConfigPathForTest`） | **禁夹具手写载荷**（§1.5 ②）⇒ 载荷必来自真 webview 点击；宿主 UI 桩（`vscode.window.showQuickPick` 两态：返回候选 / 返回 `undefined`）**非载荷夹具**（模拟用户选目标）；面板桩覆写 `_pushSettings` 为记录（理由 = 真推送族 `fullStatus` 会发起真实探针窗——`settings.mjs:380-392`——用例须零网络），删盘发生在 refresh **之前** ⇒ 判据面（盘面 / 消息面）不受影响 |
| D-M6 | 不取撤销机制 · 不改 settings 面已收口门 · 不改宿主删除语义 · 不改弹框件 / CSS / locales · 不改 `model-menu.js` | 承 §1.4 |

### 2.4 受影响文件表（行数 as-of 2026-09-19 initial 轮末 · 本席实读；Δ = 预估）

**行数口径（D3）**：`wc -l` 等价 `split("\n")` 去尾空行。

| # | 文件 | 现况 → 预估（Δ） | 面 |
|---|---|---|---|
| 1 | `thincoder-vscode/webview/model-picker.js` | **143** → ~**145**（+2） | `:25` footer Remove 项过门（同行改门 + 1 行注：门位 + `btn=null` 依据）。**tier 复核**：< 300 建议线 ⇒ 不越线 |
| 2 | `thincoder-vscode/test/settings-secret-delete-confirm.test.mjs` | **405** → ~**415**（+10） | W17-17 同号改判（域过滤 +`model-picker.js` · 档数下限 `≥5`→`≥6` · 注释/断言名同步）；**结构面仍单源驻此档**。**tier**：405 + 10 < **500** 硬限 ⇒ 本批不触发拆分 |
| 3 | `thincoder-vscode/test/model-menu-delete-confirm.test.mjs`（拟新增） | — → ~**180** | W17-31…W17-34 + 跨面夹具（happy-dom 真 webview + `handlePanelMessage` 真宿主 + tmp config）；登记落 `test/files.mjs`（runner fail-closed 清单） |
| 4 | `thincoder-vscode/test/files.mjs` | **100** → **101**（+1） | 新档登记（未登记 ⇒ runner 启动即败） |
| 5 | `docs/vsc/design/SETTINGS.md` | **441** → **484**（+43 · **已落盘**——本席 initial 轮） | §2.10（入口册 +#6 行 · 「模型菜单入口」段 · 取消路径表 · 逐入口完备性 · 判据域边界 · 机检面）+ §3（+1 条）+ §5 U-S11 + 变更记录一行 |
| 6 | **零改面（明示）** | — | `webview/model-menu.js`（271 行逐字零改）· `webview/settings*.js` 全 8 档（含 settings 面已收口门 `settings-providers.js:67-68`）· `src/**`（宿主删除语义 = `config-io` 写盘 / 级联）· `locales/**` · `webview/settings-widgets.js` · `webview/controls.css` · `src/extension/provider-flows.mjs` |

### 2.5 用例表（正常 / 边界 / 反例 + 先红形态）

| # | 用例 | 驱动（**真分发路径**） | 期望（机判） | 先红形态 / 读数 |
|---|---|---|---|---|
| W17-31 | 正常 · 点击不即发（先红：点击即发） | 真 `webview/chat.js` 模块图 + `models` 推送 ⇒ 点 `#model-btn` ⇒ 点 footer 行「− Remove provider…」（文本 = en locale `model.removeProvider`） | 新增消息 **`[]`** ∧ `.auto-confirm` **×1** ∧ `.auto-backdrop` **×1** ∧ `.mm-overlay` **= 0** | 现态：新增消息 `[{"type":"removeProvider"}]` ∧ 框/幕/overlay = **`0/0/0`**（无框可依）——**本席实跑** |
| W17-32 | 正常 · 端到端确认即删（先红：无框可依 + 选定即删） | 续 W17-31 ⇒ 点 `.auto-confirm-yes` ⇒ 捕获消息**逐条喂回**真宿主 `handlePanelMessage(桩面板, msg)`（`showQuickPick` 桩返回 `{label:"kimi"}`；tmp config = deepseek(active) + kimi） | 恰 1 条 `{type:"removeProvider"}`（**无 `name`**——逐字同既有）∧ 框 / 幕移除 ∧ 盘面 `providers` = `["deepseek"]` ∧ kimi 的 `apiKey` 原文消失 ∧ `_pushSettings` 调用 1 次 | 现态：**无确认面在场即完成删除**（本席实跑：`_pushSettings` 1 次 · `providers=["deepseek"]` · `apiKey` 原文消失 = **「选定即删」实锤**） |
| W17-33 | **反例 · 取消（路径 #1 取消钮）** | 续 W17-31 ⇒ 点 `.auto-confirm-no` ⇒ 捕获集为空 ⇒ **宿主零调用**（不喂回） | **零发值**（任何消息都不发）∧ 框 / 幕移除 ∧ `.mm-overlay` 零在场（菜单不复活）∧ `config.json` **逐字节不变** | 现态：无框可依（点击已即发） |
| W17-34 | 边界 · 宿主侧选定取消（**恒绿锚**） | 续 W17-32 的确认消息 ⇒ `showQuickPick` 桩返回 `undefined` | `config.json` **逐字节不变** ∧ 零 `providerError` 推送（`provider-flows.mjs:146` `if (!sel) return` 零改） | **恒绿**（既有行为——回归锚，非改判项） |
| W17-17（改判） | 结构对账 fail-closed · **域扩** | 读盘扫描（`readdirSync` 平铺 + 正则 `emitsIn` + 括号配对 `callArgSpans`） | 域 = **9 档**（`settings*.js` 8 + `model-picker.js`）· 发射名集 = **5 名**逐名同册 · 逐名 gated = total（`removeProvider` **2/2**）· `_confirmDelete(` = **0** · 档数下限 `≥6` | 现态扩域读数（**本席实跑**）：域 9 档 · 名集同册 ✓ · `removeProvider` gated **1/2（红）** · `_confirmDelete(` = 0 ✓ |

**先红形态汇总（本席实跑 · happy-dom 真模块 + 真宿主分发 · 零仓内写入）**：① footer 行文本实读 = `["+ Add provider…","− Remove provider…","Key…"]`；② 点击 ⇒ `[{"type":"removeProvider"}]` ∧ 弹框 0（**红**）；③ 喂回真分发 ⇒ 删除落盘（**红**）；④ 门侧预演（`_confirmSecretDelete(null, …)`）：四条取消路径全零发值 · 确认 ⇒ 恰 1 条 · 单例（连开两框仍 1 框）——**门与件在 model 面可用**（`btn=null` 成立）；⑤ 结构面：扩域后 gated 1/2（红）。

### 2.6 验收标准（回指 §1.5 ①–④ · 逐条机判）

| # | AC | 机判 |
|---|---|---|
| AC-M1 | §1.5 ①：模型菜单 Remove **不立即发删除生效**（点击 ⇒ 零新增消息 ∧ 确认面在位） | W17-31 |
| AC-M2 | §1.5 ①：确认 ⇒ 删（恰 1 条**载荷逐字同既有**的消息；端到端删除落盘） | W17-32 |
| AC-M3 | §1.5 ①：取消 ⇒ **零删除 ∧ 零消息副作用**（零发值 ∧ 宿主零调用 ∧ 盘面逐字节不变） | W17-33 |
| AC-M4 | 反例锚：选定目标步取消 ⇒ 零删除（宿主既有早退零改） | W17-34 |
| AC-M5 | 结构 fail-closed：域 9 档 / 名集同册 / `removeProvider` gated **2/2** / `_confirmDelete(` = 0 | W17-17（域扩改判） |
| AC-M6 | §1.5 ③ 协议零改 + 宿主零改：`git diff thincoder-vscode/src` 空 ∧ webview 发射名集与载荷形态不变 | 命令行读数 + `protocol-coverage-reverse` / `protocol-coverage` 绿 |
| AC-M7 | §1.5 ④：`thincoder-vscode` `npm test` 全绿（含 W17-1…W17-30 恒绿）+ `npm run lint` OK | 读数入批档 §5 |
| AC-M8 | §1.5 ④：`node scripts/doc-check.mjs` **按档归属零新增** | §2.9 读数 |

### 2.7 零回归锚（恒绿面）

`model-picker.js` 另两 footer 行（Add provider / Set key）**逐字零改** · settings 面两载体（`settings-providers.js:182` / `:48-49`）**零改** · `model-menu.js` 零改 · 弹框件 / CSS 零改 · `locales/**` 零改 · **协议零改**（消息名与载荷逐字不变）· **宿主零改**（`git diff thincoder-vscode/src` 空）· 既有用例 W17-1…W17-30 恒绿。

### 2.8 三链对齐（自检）

批档 §2 条目（§1.3 ① = 模型菜单 Remove 过一次显式确认）↔ 设计档 `SETTINGS.md` §2.10 **入口册 #6** + 「模型菜单入口」段 + 类判据句（1–6 全数）↔ 需求档 F-W17 判据句（「**所有删除入口**均须过一次显式确认——单击即删类已空域」）——**差集 = 需求档实测册未列本入口**（§1.3 ③ 已登记 = 父侧笔；设计档侧册行与判据域已先行落地，见上抛 1/2/3）。

### 2.9 机检读数 + 上抛项

**doc-check 读数（本席实跑 `node scripts/doc-check.mjs`——仓根 `thincoder/`）**：
- **改前**：汇总 候选 **16611** · 悬空 **5** · 注记豁免 43 · 拟新增 6 · 迁移期引文 222；`FAIL(锚): 5 条悬空`；`FAIL(行宽): 12 行超 300 字符`。
- **改后**：汇总 候选 **16678** · 悬空 **5** · 注记豁免 43 · 拟新增 **6** · 迁移期引文 222；`FAIL(锚): 5 条悬空`；`FAIL(行宽): 12 行超 300 字符`。
- **按档归属零新增** ✓：悬空 5 条全在 `docs/core/**`（既有，非本批写域）；行宽 12 行的 `docs/vsc` 唯一一条 = `docs/vsc/requirements/WEBVIEW.md:176`（**320 字符 · 父侧笔既有 · 非本批所致**）；`docs/vsc/design/SETTINGS.md` 行 = 既有 2 条「拟新增——列报 · 不入闸」（现 `:376` / `:386` = 原 `:339` / `:349` 行号平移）+ 2 条符号宽报告面 ⇒ **零新增**（本席首轮曾自造 1 条 326 字符行 + 1 条 441 字符行，**已就地收正**——题干「零新增」为准）。

**上抛项**：

| # | 项 | 处置建议 |
|---|---|---|
| 1 | **「第五入口」序号口径差 1**（需求档 / 批档 §1 用「第五入口 / 补第五行」）——按**册序**实读：需求档实测册现 **5 条**（live 密钥 2 + 死 handler 1 + provider 行 ✕ + MCP 行 ✕）⇒ 本入口 = 册第 **6** 行；父侧「第五」= 按**有 UI 载体的入口**计数（live 2 + provider 行 + MCP 行 = 4 ⇒ 本入口第 5，死 handler 不计）。**两读法差 1** ⇒ 需求档侧措辞请父侧定夺 | 本席设计档按**册序**落 **#6 / 6 行**（D3 计数与清单同改）；若父侧取「入口」口径，请同步收正批档 §1 与设计档 §2.10 / §5 的「6 行」措辞（一行改动） |
| 2 | 需求档 F-W17 实测册**补本入口一行**（父侧笔；§1.3 ③ 已登记）——建议坐标随行：载体 `webview/model-picker.js:25` · 渲染位 `webview/model-menu.js:128-134` · 消息 `removeProvider`（无 `name` ⇒ 宿主 QuickPick） | 父侧直接执行（可 revert） |
| 3 | 需求档 F-W17 **判据句枚举**「（密钥 / 令牌 / MCP 行 / provider 行）」未含「模型菜单 footer」⇒ 与册行同笔补枚举（或改指册） | 父侧笔（与上抛 2 同笔） |
| 4 | 需求档 `WEBVIEW.md:176` **行宽 320 > 300**（doc-check 行宽 FAIL 列报之一）——父侧笔既有，非本批所致 | 父侧笔；本批只登记 |
| 5 | 「**取消 ⇒ 零消息副作用**」读法（**严格 = 零发值** / 宽松 = 无持久副作用）——本席按严格读取 c 案（批档 §1.3 ① 交设计裁的项）；**若父侧取宽松读并偏好「确认绑定目标」**（a 案），须回写设计档 §2.10（门位段 + 类判据映射）+ §3 登记（第二确认形态例外） | 非阻塞（本设计两读法下均合规）；裁定后一行改动 |
| 6 | 域外观察（非本批）：`webview/model-menu.js:132` 的 footer 回调**不传参**（`f.onClick()`）——共享件契约；若日后要「确认绑定目标」的形态，此处是改点（本批零改） | 仅登记 |

## §3 设计评审记录

（评审子代理写）

### 轮次 1（评审子代理）

**评审对象**：designId 见回执；评审档 = `docs/vsc/design/SETTINGS.md`（全档 487 行）· `docs/batches/2026-09-19-vsc-model-menu-delete-confirm.md`（全档 176 行）· `docs/vsc/requirements/WEBVIEW.md`（全档 177 行）。工程模式（设计评审）——只读、不改档。
**限制**：未声明项目标准档（方法学按 Project Guide / AGENTS.md 判）· 无文档地图（Document ownership 判据降级为按 Project Guide 判放置面）· 代码侧坐标未复核（评审范围限上述三档）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements（协调项） | 🟡 | 需求档 F-W17 实测入口册仍 5 条、判据句括注枚举未含本入口（`docs/vsc/requirements/WEBVIEW.md:34`）；设计侧已先行落册（`docs/vsc/design/SETTINGS.md:183` 入口册 #6 · `:169` 差集登记）并在批档在册（`docs/batches/2026-09-19-vsc-model-menu-delete-confirm.md:156-157`）⇒ 三链对账（批档 §2.8）在需求档补行前不闭合（非设计缺陷） | 在 F-W17 实测册补一行（载体 `webview/model-picker.js:25` · 渲染位 `webview/model-menu.js:128-134` · 消息 `removeProvider`（无 `name` ⇒ 宿主 QuickPick）），并把判据句括注枚举改为指向实测册（或补枚举），使册序 / 枚举与设计侧 6 行一致 |
| 2 | Doc-state（序号口径） | 🟡 | 同一入口两套序号：批档用「第五入口 / 补第五行」（批档 `:5` · `:31` · `:155`），设计档按册序落「#6 / 6 行」（`SETTINGS.md:183` · `:161` · `:436`）；差 1 已登记但两侧措辞未统一 | 择一口径（建议以实测册行序为准）后同步批档 §1 与设计档 §2.10 / §5 U-S11 的「第五 / 6 行」措辞 |
| 3 | Doc-state（登记条目到期未落） | 🟡 | 用例档拆分条三档不自洽：设计档记「现 **439**（MCP 批实读）→ 预估 ~516 ⇒ 触发拆分 · 到期 = provider 行批实现轮末实读」（`SETTINGS.md:388-390`，同旨 `:290`），而 provider 行批已收口（批档 `:6`）、本批实读 **405 → ~415**（批档 `:105`，§2.2 D-M4 同按 405 计）⇒ 到期条件已过而结论未落；拆分是否已执行、MCP 组用例现驻哪一档在三档内无从判定（`SETTINGS.md:289` 的「W17-1…W17-30」归属括注随拆分失真） | 按 provider 行批实现轮实读把该条收正为终结态（已拆 ⇒ 注明 MCP 档名 + `test/files.mjs` 在册读数 + 主档实际行数；未拆 ⇒ 439/516 改实读并重述未越线结论），并同步 `SETTINGS.md:289-290` 的档 / 用例归属括注 |
| 4 | Doc-state（需求档载体滞后） | 🟡 | provider 行载体两档描述不同：需求档写「`settings-providers.js:182`（**行内 onclick**）」（`WEBVIEW.md:34`），设计档已改判为 `data-name` 承载 + 卡级装配位 `addEventListener`（`SETTINGS.md:181` · `:259-264`）——需求档未随 provider 行批收正（机制句一致，仅载体形态滞后） | 需求档该括注改为与设计档一致的载体形态（或加 as-of 限定语），避免按旧形态回改 |
| 5 | Affected-file 标注（数值 spot-check） | 🔵 | 两处标注与实读 / 自身括注不符：① `webview/model-picker.js` **143 → ~145（+2）**，其面列却写「同行改门 + 1 行注」（批档 `:104`）——按此括注应为 +1；② 设计档标 **484**（「已落盘」）（批档 `:108`），本档实读尾内容行 = `SETTINGS.md:486` ⇒ 486（同口径去尾空行）。tier 结论均不受影响（143/145 < 300；.md 免注） | 对齐两处数字与其括注 / 实读（model-picker Δ 按改动实际形态写 +1 或注明第二行来源；设计档按实读收正） |
| 6 | Clarity（坐标复用歧义） | 🔵 | 「点击前门必已安装」这一前提的坐标冲突：`SETTINGS.md:272` 以 `webview/settings.js:48-55` 标 `_confirmSecretDelete` 定义，`SETTINGS.md:284` 又以 `webview/settings.js:48` 标 `initSettings()` 安装位——同一行指两个构造，读者无法判定门是模块顶层赋值还是在 `initSettings()` 体内赋值（此判定直接支撑「不取防御式回退」的选择） | 三处坐标分开标注（门赋值语句行 · 其外层函数定义行 · `chat.js:57` 调用行），使「点击前门必已安装」可独立复核 |
| 7 | Acceptance criteria（判据可执行性） | 🔵 | AC-M6 的机判之一 = 「`git diff thincoder-vscode/src` 空」（批档 `:132`）；本评审环境报告未检出 git 仓（评审上下文原文「No git repository detected」）⇒ 若实现轮环境同此，该判据不可执行（同 AC 的 `protocol-coverage*` 一侧不受影响） | 补一条不依赖 git 工作树的兜底判据（按 `src/**` 清单做内容 / mtime 扫描），或写明该判据的前置条件 |
| 8 | Doc hygiene（需求档内部口径） | 🔵 | 需求档设计意图表仍写「I-9 单击即删 / 空值清代理」（`WEBVIEW.md:75`），而同档收正后表述为「单击即删（**限可重填类**）」（`WEBVIEW.md:85`）——I-9 未加限定语，读者可能把直通门当须保留的在用路径 | 给 I-9 补「限可重填类（现为空域）」限定语，与 `:85` 同口径 |
| 9 | Doc hygiene（到期未核销） | 🔵 | 弹框文案条仍标「到期条件 = **本批实现轮**（落盘并核对 AC-FW17B-6 后核销）」（`SETTINGS.md:383`）；该条 2026-09-18 落笔、所指批已收口，且同档已把改写值列为在册值（`:221-224`）、本批申报 `locales/**` 零改（批档 `:85`）⇒ 到期条件已满足而条目标记未核销（对照 `:378` 条已标「已消解」） | 核销该条（标「已落盘」+ 落盘值引用）或改写到新的到期条件 |

**计数**：🔴 0 · 🟡 4 · 🔵 5（🟡 / 🔵 均不阻断）
**通过面复核**：批档 §1.3 ①②③ 逐条有落点（`SETTINGS.md:266-287` / `:183`）· §1.2 ④ 结清（批档 §2.1 与设计档 `:192-195` 坐标一致）· 门位选型三案取舍在册（`:270-277`）· 取消四路径覆盖明示（`:226-241`）· 协议/宿主零改在册（`:243`）· 判据域 9 档与 D3 计数映射自洽（`:295-297` vs 批档 `:119`）· 受影响文件表含 tier 复核与零改面（批档 `:104-109`）。

VERDICT: pass

## §4 用户批准

**2026-09-19 08:39 父侧裁定 + 09-19 自动模式授权** —— 发现来源 = 上一批 §5.8 #6 上抛（域外候选未登记入口）；父侧实核成立（§1.2 ①②）⇒ 按判据「不可复得 ⇒ 须一次显式确认」立批。用户 08:29「后续你自动跑吧，到排空」= 本批在授权射程内。

## §5 实施与修正记录

（eng-coder 写）

（eng-coder · 实现轮 2026-09-19）

### 5.1 交付摘要（实现面 = 设计 §2.1 单点一行 · 逐条照设计）

| # | 文件 | 改动 | Δ 实测 |
|---|---|---|---|
| 1 | `thincoder-vscode/webview/model-picker.js` | `:25` footer「− Remove provider…」的 `onClick` 由裸发改过门（`window._confirmSecretDelete(null, () => vscode.postMessage({ type: "removeProvider" }))`——消息名与载荷逐字不变）+ `:26` 注（门位 + `btn=null` 依据） | 143 → **144**（**+1**） |
| 2 | `thincoder-vscode/test/settings-secret-delete-confirm.test.mjs` | W17-17 同号改判（域 = 设置面档 8 档 ∪ **显式名单** `model-picker.js` = **9 档** · 档数下限 `≥5 → ≥6` · 断言名 / 注释同步 · 头注补本批单源指针） | 405 → **412**（+7） |
| 3 | `thincoder-vscode/test/model-menu-delete-confirm.test.mjs`（新增） | W17-31…W17-34 + 跨面夹具（happy-dom 真 webview 点击 → 逐条喂回真宿主 `handlePanelMessage` + tmp config） | 0 → **161** |
| 4 | `thincoder-vscode/test/files.mjs` | 新档登记（runner fail-closed 清单）+ 主档条注释同步（域扩 9 档） | 100 → **101**（+1） |

**预估 vs 实测**（设计 §2.4 预估 → 实测）：`model-picker.js` ~145（+2）→ **144（+1）**（评审 🔵5① 口径：同行改门 + 1 行注 ⇒ +1）；主档 ~415（+10）→ **412（+7）**；新档 ~180 → **161**；`files.mjs` 101 → **101** ✓。
**零改面（实测复核）**：`webview/model-menu.js` **271** · `webview/settings-providers.js` **282** · `webview/settings*.js` 其余 7 档 · `src/extenion/**` 全 74 档（指纹见 5.4） · `locales/**` · 协议档 · 需求档（父侧笔）——逐字零改。

### 5.2 先红读数（实现轮自跑 · 真分发路径 · 零仓内写入）

**新档未修态实跑**（`node --test test/model-menu-delete-confirm.test.mjs`——exit 1 · 3 红 1 绿）：

- W17-31 ✖：点击 footer 行 ⇒ 新增消息 **`[{"type":"removeProvider"}]`**（期望 `[]`）——**点击即发实锤**；
- W17-32 ✖ / W17-33 ✖：`.auto-confirm-yes` / `.auto-confirm-no` **不在位**（**无框可依**）；
- W17-34 ✔（**恒绿锚**——宿主侧选定取消零删除与门无关，先红态即绿）。

**端到端先红探针**（临时档 `thincoder-vscode/.tmp-red-probe.mjs`——真模块 + 真宿主分发，跑完即删）：

footer 行文本实读 `["+ Add provider…","− Remove provider…","Key…"]` · 点击后新增消息 `[{"type":"removeProvider"}]` · 弹框 / 遮罩 / overlay = `0 0 0` · 喂回真宿主（`showQuickPick` 桩 → `{label:"kimi"}`）⇒ `_pushSettings` **1** 次 · 盘面 `providers = ["deepseek"]` · **apiKey 原文在盘面消失**（「选定即删」实锤——与设计轮读数逐项一致）。

**W17-17 未修态实跑**（`node --test --test-name-pattern=W17-17 test/settings-secret-delete-confirm.test.mjs`——exit 1）：域 **9 档**实读 ✓ · 名集同册 ✓ · `removeProvider` gated **1/2（红）** · `_confirmDelete(` = 0 ✓。

### 5.3 修后读数（命令 + 结果）

- `node --test test/model-menu-delete-confirm.test.mjs` → **4/4 pass · exit 0**（W17-31…W17-34 全绿）。
- `node --test test/settings-secret-delete-confirm.test.mjs test/settings-mcp-delete-confirm.test.mjs` → **30/30 pass · exit 0**（W17-17 域扩改判转绿 + W17-1…W17-16 / W17-18…W17-30 恒绿）。
- `npm test`（全域清单）→ **tests 724 · pass 724 · fail 0 · exit 0**（含 `protocol-coverage` / `protocol-coverage-reverse`——协议面零改侧证）。
- `npm run lint`（`scripts/check-syntax.mjs`）→ **218 JS files OK · exit 0**。
- `npm run doc:check`（`node ../scripts/doc-check.mjs --root ..`）→ 汇总 候选 **16685** · 悬空 **5** · 注记豁免 43 · 拟新增 6 · 迁移期引文 222；`FAIL(锚)` 5 条**全在 `docs/core/**`**（既有）；`FAIL(行宽)` 12 行中 `docs/vsc` 唯一一条 = `requirements/WEBVIEW.md:178`（351 字符——**父侧 20:5x 笔**，本批写域外）⇒ **按档归属零新增** ✓。

### 5.4 AC-M6 双判据（宿主零改 + 协议零改）

- **git 面**：`git diff thincoder-vscode/src` = **空**；`git ls-files` 实读该域 **74 档全部在册**（非 ignored ⇒ 该判据实质有效，非「无仓真空集」）；`git status --porcelain thincoder-vscode` = 恰本批 3 改 + 1 新（上表四档），`src/**` 零条目。
- **非 git 兜底（内容指纹 · 评审 🔵7 补判据）**：实现前后两轮 `src/**` 全档 sha256(16) + size + mtime 扫描比对——**74 / 74 档**、宿主链四档逐档同（`panel-messages.mjs` `ce01c7acf1b31bda` · `panel-messages-settings.mjs` `6e6d16a1741e7b64` · `provider-flows.mjs` `6f34303d9fd0a250` · `settings.mjs` `570b29588060a9f8`）；全档指纹串 `328e4ecf979747f84079fba40cf3164a9ccf1ca192993105dd2fce84cd7d7d60`。
- **协议面**：消息名与载荷逐字不变（`{ type: "removeProvider" }`，**无 `name`**）——W17-32 的 `deepEqual([{type:"removeProvider"}])` 逐字钉住 + 协议两档全绿。

### 5.5 决策透明表（实现轮）

| # | 决策 | 依据 / 与设计的关系 |
|---|---|---|
| I-1 | 注行置于改动行**之后**（`:26`），而非之前 | 设计档 / 批档多处以 `model-picker.js:25` 为门位坐标（入口册 #6 等）——注行在前会把过门行挤到 `:26` ⇒ 全链坐标漂移。注行在后 ⇒ `:25` 仍为准确切面（Δ = +1 与评审 🔵5① 口径一致） |
| I-2 | 新档 W17-34 驱动 = `confirmIfGateInPlace()`（门在位则过确认那一步） | 设计定其为**恒绿锚**（非改判项）⇒ 须在先红态也绿；两态同取「真 webview 点击产出的消息」——禁夹具手写载荷不破 |
| I-3 | 宿主桩覆写 `_pushSettings` 为记录 | 设计 §2.2 D-M5 明示（真推送族会发起真实探针窗——用例须零网络）；删盘发生在 refresh 之前 ⇒ 判据面不受影响 |
| I-4 | 无自创项 / 无简化项 / 无偏离项 | 逐条照设计：门位 c 案 · `btn = null` · 载荷逐字不变 · 域扩 9 档 · 下限 ≥6 · 新档登记 · 不取防御式回退 |

### 5.6 行数 tier 复核（实测）

`model-picker.js` **144**（< 300 建议线）· 新档 **161**（< 500 硬限）· 主档 **412**（< 500——承 provider 行批拆分登记；本批未触发再拆）· `files.mjs` **101**。

### 5.7 越界项

无。写域 = 批档 §2.4 表 1/2/3/4 四项；临时先红探针档 `thincoder-vscode/.tmp-red-probe.mjs` 跑完即删——交付态零残留（git status 实读佐证）。

### 5.8 内部审计与代码评审轮次（终态 = **clean**）

**修正笔（先记前文两处复核差异——以本节为准）**：

- §5.1 / §5.6 记新档 `test/model-menu-delete-confirm.test.mjs` = **161** 行 → 实读 **162 行**（口径 = `split("\n")` 去尾空行）。差 1 的来源 = 内部审计观察 1 的即时收口（见下 ①）补入的 `models` 推送一行；**以 162 为准**。
- §5.1「零改面」中 `src/extenion/**` 系错字 → 应为 **`src/extension/**`**（该行其余读数不变：74 档 · 指纹串见 §5.4）。

**① 内部 explore 分歧审计（read-only · 对照设计实读）**：**VERDICT: clean（零分歧）**——①改动面 = 设计单点逐字（无夹带）·②W17-31…W17-34 逐条对上 §2.5「期望（机判）」列（多处断言强于期望列）·③**零夹具手写载荷**（喂回消息全部出自真 webview 点击链）·④真模块 / 真分发成立 ·⑤主档改动仅 W17-17 + 头注（用例清单不变）·⑥表外改动零 ·⑦设计坐标全数仍准确。
审计非分歧观察 1 条**已即时收口**：设计 §2.5 驱动列含「真 `models` 推送」而新档未推 ⇒ **补入 `before()` 一行**（`send({ type:"models", … , prefs:{} })`——`prefs` 无命中 ⇒ 零回写 post；补后新档 4/4 复绿）。
**② 自修轮**：1 轮（即上条；**零设计偏离**——补的正是设计驱动列的明列项）。

**③ 内部 advisor 代码评审（同步 · 轮次 1）**：**VERDICT: pass**——0🔴 · 3🟡（均非阻断）· 4🔵。

**评审发现响应表（逐条）**：

| # | 级 | 发现 | 处置 |
|---|---|---|---|
| 1 | 🟡 | 主档 `settings-secret-delete-confirm.test.mjs` **412 行** > 300 建议线（< 500 硬限） | **不改（承设计裁定 · 登记）**：设计 §3 拆分条已裁（触发 = 实读 ≥ 500；本批 412 未触发；拆分动作已执行一次）⇒ 下一触碰再析出（候选 = provider 行组）；「设计 §3 明写越线裁量句」= 设计档笔，**上抛父侧** |
| 2 | 🟡 | `SETTINGS.md:436 / :481` 与批档 `:5 / :31` 仍用「第五入口」措辞（需求档已定案册序 #6/6） | **不改（写域外）+ 上抛**：设计档 = 设计者笔 · 批档 §1 = 父侧笔；本席 §5 全程用「入口 6 / #6」并在此登记差集 |
| 3 | 🟡 | 拆分条与用例归属滞后（`SETTINGS.md:388-390`「现 439 / 预估 ~516 / 拟新增」· `:289` 括注把 MCP 组用例归主档；实态 = MCP 档已落盘 + 主档 412） | **不改（写域外）+ 上抛**（设计评审 🟡3 同条未闭合） |
| 4 | 🔵 | W17-17 域下限 `>= 6` vs 实读 9 档（松量 3 档） | **不改 + 上抛**：设计 §2.10 字面「下限 ≥6」⇒ 本席不越设计定值；建议项（按实读收为 ≥9）留父侧裁定 |
| 5 | 🔵 | 新档以硬编码英文子串定位 footer 行（未取自 locale 字典） | **不改 + 上抛（低值可选）**：设计 §2.5 驱动列字面即「文本 = en locale `model.removeProvider`」——本席照字面取该文案子串；改字典取值 = 1 行可选强化，留父侧定 |
| 6 | 🔵 | 批档 §2.7 列 Add provider / Set key 两行为「零回归锚」但无专属用例 | **不改 + 上抛**：设计用例表 = W17-31…W17-34（本席不越表增例）；两行零改由单点差分（git diff 逐行实读）+ W17-17 域扫描共同承载 |
| 7 | 🔵 | 批档 §5.1/§5.6 新档行数 161 vs 现态 162；`src/extenion/**` 错字 | **已修（本席写域）**——见本节首「修正笔」 |

**④ 设计评审修正项（本任务书点名 · 逐条落位）**：**🔵5①** Δ 按实测 = **+1**（143 → 144，见 §5.1/§5.6，未照抄 145）· **🔵7** AC-M6 补非 git 兜底判据（`src/**` 74 档 sha256+size+mtime 扫描比对，见 §5.4）· **🔵6** 门坐标三处分列（本席 §5 引坐标处即本段，照分列式）：**定义（赋值语句行）= `webview/settings.js:48-55`**（`window._confirmSecretDelete = function(btn, action) { showConfirmPopover(…) }`）· **其外层函数定义行 = `webview/settings.js:25`**（`export function initSettings({ onClose, getModels }) {`——门赋值在体内）· **调用行 = `webview/chat.js:57`**（`const _settings = initSettings({ onClose: …, getModels: … })`，模块顶调用）⇒「点击前门必已安装」的判定据此三行独立可复核。

**⑤ 终态 = clean**：0🔴 · 无 must-fix 🟡；🟡/🔵 全部处置完毕（2 项已修/已收口 · 3 项「写域外 / 越设计定值」= 登记 + 上抛 · 2 项 = 设计裁定登记）。评审后**零代码再改**（唯一后续动作 = 本节追加）⇒ 无 round 2 需求。
**交付态终验读数（最终产物的最后一次全域跑）**：`npm run lint` = **218 JS files OK** · `npm test` = **724/724 pass · fail 0 · exit 0**。

## §6 验证与收口

**收口（2026-09-19 21:1x · 父侧直接执行）**

- **交付判据**：父侧实核（批档 §1.2）→ 设计 id=141 → 评审 **pass**（id=142 · 0🔴/4🟡/5🔵）→ 实现 id=143（终态 clean）⇒ **F-W17 入口册 #6/6 全闭**（websearch ✕ · 嵌入 ✕ · 死 handler · MCP 行 ✕ · provider 行 ✕ · 模型菜单 footer）。
- **父侧独立复跑**：三档合跑 **34/34 pass**（与 coder 报数一致）。
- **验收读数**：vsc `npm test` **724/724** · lint OK（218 档）· `doc-check` 按档归属零新增。
- **先红（真 webview 点击 + 真宿主分发）**：W17-31 ⇒ 点击即发 `[{&quot;type&quot;:&quot;removeProvider&quot;}]` ∧ 框/幕/overlay `0/0/0`；端到端 ⇒ 选定即删、`apiKey` 原文消失；结构面 `removeProvider` gated **1/2**。
- **零改面（70+ 档指纹）**：`src/**` 74 档 sha256 逐档同（宿主链四档在内）+ `git diff src` 空 + git 未检出的非 git 兜底判据已落（评审 🔵7）。
- **行数实测（覆盖预估）**：`model-picker.js` **144（+1）** · 主测档 **412** · 新档 **162**（均 &lt;500）。
- **文档漂移登记（待收正 · 不入本批写域）**：① `SETTINGS.md:436`/`:481` 与批档 `:5`/`:31` 残留「第五入口」措辞（需求档已定案册序 #6/6）；② `SETTINGS.md:388-390` 拆分条与 `:289` 用例归属滞后（MCP 档已落盘登记 · 主档实读 **412**）；③ 需求档 `WEBVIEW.md:34` provider 行载体仍写「行内 onclick」（实际形态 = `data-name` + 卡级绑定位）。
- **域外登记不阻塞**：`webview/settings.js:42` 注释失实 + `_confirmDelete` 死门 ⇒ `SETTINGS.md:391-394` 已在册（含消解路径 + 到期条件）。
- **状态行**：✅ 已收口 2026-09-19（全档冻结）。
- **台账**：⚠️ **本批未入台账**——原文「#97 ⇒ 已核销」**不实**（该号未建，后已为他项占用）⇒ **交付记录以本档 §6 为准**；补登记待裁。（2026-09-19 22:0x 父侧自纠）
