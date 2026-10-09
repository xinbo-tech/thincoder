# 2026-10-08 · 残项清收
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-08 · 来源 = #1059（parity 收口随正——条件明中）∥ #1058 / #1052（#1054 邻面触发）——用户 2026-10-08 10:51「还有那些能开的，都开吧」。
> 台账 = #1059 · #1058 · #1052（desktop · 归批）。前情 = docs/batches/2026-10-07-add-dialog-unify.md §6（已收口 2026-10-08）∥ docs/batches/2026-10-07-provider-config-parity.md §6（已收口 2026-10-08）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-08
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 点火与轮式（2026-10-08 10:5x · 主 agent）

- 用户 2026-10-08 10:51「还有那些能开的，都开吧」= 点火。
- **轮式 = 轻通道**（三笔均中三条之一：**#1059** = 缺陷修〔测试红 vs 已落实现——parity 收口随正，条件明中〕∥ **#1058** = 缺陷修〔死 ✕——#1054 邻面〕∥ **#1052** = 诊断核〔零链只读〕+ 条件修〔若同病征实锤〕）。
- 不并（写明理由）：#1044（条件未触发——`settings.css` 本批零触）∥ #1039（需键盘走查实锤）∥ #809（涉色位设计选择——非机械）。
- 收口链（轮终）= 设计正式化 → 独立评审 → 批准 → 收口核销；每笔行 = 逐笔披露（change/reach/rollback）+ 走查 + 冻结。

### 1.2 机制转换：轻通道轮 ⇒ 标准批（写闸裁定 · 2026-10-08 11:0x · 主 agent）

- **遭遇**：首笔（#1052 诊断核）零链完成——**核讫非病征**（`keySave` 槽作用域 = 结构上正确：`SETTINGS_SLOT` 唯一宿主 = 设置页段体，`toolsBody` 唯一消费点；组弹窗挂 body 尾仅宿主表单体，工具/env 段无槽外宿主 ⇒ 无病征路径）。第二笔（#1059 重锚）**父侧直改被写闸拒**：`docs/batches/*.test.mjs` 按默认约定归**产品码**（工装/文档豁免面未含该形）⇒ 「设计要求先于任何文件修改」。
- **裁定（遵闸）**：轻通道笔（父侧直改）在本仓对 `.mjs` 档不成立 ⇒ 本轮回退为**标准批**（设计 → 评审 → 批准 → eng-coder 实施）；笔集不变；档头「轻通道轮」字样已删（机械更正 · 父侧直执行 · 可单笔 revert）。
- **重锚设计素材**（父侧实读全链，随设计轮任务书移交）：① 两红腿成因 = 渠道表单入 `providerAdd` 弹窗体且单形（页槽无渠道表单）；② 弹窗体形 = `channelFormTree` `data-form-shape` 恒在（弹窗内唯一定位）；③ 两闸 = `paintSettings` 页树 + 弹窗卡（`modalResidue` 独立残件，同轮同律）；④ 假 DOM 滑面 = `200 + 40×元素数`（截断可测）；⑤ 重锚形 = 腿一「弹窗体 + 页槽」两宿主两轮重绘 ∥ 腿二「弹窗卡根」在途窗（`mcpFormBody` 载入中零表单 = 天然窗口）。
- 设计轮 = eng-designer #5 已派（在跑）。

### 1.3 #1052 前核讫撤回（设计舱反证 · 2026-10-08 11:1x · 主 agent）

- 设计舱复核反证：`src/main/app-menu.mjs:36` 六名组闭集 ⇒ 组弹窗经 `settingsModalTree` 泛支（`views/settings.mjs:410`）**渲染任意段体**、卡挂 `document.body`（`settings-modal.mjs:37-46`——槽外）⇒ tools/providers 段体**存在槽外宿主**（菜单径开窗）。
- ⇒ `keySave`（`mount-settings-segments.mjs:102`）∥ `saveProviderKey`（`mount-settings-segments-providers.mjs:61`）按槽作用域取件 = 组弹窗径取到页槽空件 ⇒ 空值零发送 = **死保存（真病征）**。
- **父侧 §1.2 前核讫（「非病征」）撤回**——漏勘菜单径（只核 `toolsBody` 静态消费点，未核 `SCOPES` 开窗径的泛支渲染）。裁：**并入本批**（修 ×2 + 机检腿；宿主无关现读，沿 `mcpFormNode` 文档序末位先例）。
- 连带修正：#1060（M604 件 **522** 行——内容行数口径）＝ 不拆（延续「认账不排期」裁）；#1040 = 顺延（已并入 #1042 批 T7 腿——零重复）。

### 1.4 设计轮回报与裁（2026-10-08 11:1x · 主 agent）

- 设计舱交付：§2 全量（#1059 两腿重锚全规格 + 断言面对照表零删 ∥ #1058 逐行绑定 ⇒ `#consult-rows` 容器委托 ∥ #1052 并入 ×3 读点）+ 复核修正 7 条（#1058 任务书坐标实况修正「全仓零命中」∥ 菜单径成立 ∥ M604 件 tmp/终位分叉 ∥ 等）。
- **U1 裁 = a 登记**（缺口去向：本轮零扩；两形矩阵覆盖 = parity 批 D2/V2 腿在册——登记指针，不扩腿）。
- 两 `SETTINGS.md` 设计载荷受 D5 冻窗（评审 #7）阻塞——**待窗过即回舱续投**（fix 轮重派）。
- 评审点火 = 候续投完成（设计完整性优先）。

### 1.5 用户授权（自动跑 · 2026-10-08 11:38）

**用户原话**：「自动跑」⇒ 本批**设计评审点火权** ∥ **§4 用户批准权（代签）** ∥ **修正/实施轮派发** ∥ **收口核销与提交**——均委托父侧自动执行，直至本批收口。

**父侧自缚三条（本仓惯例·先例同形）**：① 代签仅当三条件齐备（评审 pass 0🔴 ∧ 修正轮已落地并逐条核验 ∧ token 已签发），每次代签在 §4 写明「父侧代签（用户 11:38 授权）+ 依据」；② 新范围 ∥ 用户口径裁决 ⇒ 停下、只摆那一条；③ 破坏性/不可逆 ⇒ 先停。

### 1.6 U1 父裁（2026-10-08 11:49 · 自动跑授权内）

**U1 = a（登记，本轮零扩）**——依据：本批立面 = 最小修复（既有腿重锚 ∥ 容器委托 ∥ 现读口径）；扩腿 = 新覆盖面（新范围另轮）。缺口 2（nth 消歧）∥ 3（跨形切换）记录面在册（§2.3 + §2.8 D2）并落台账（#1071）——如需扩腿另行开批。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（三笔全规格在册；两 SETTINGS.md 载荷已投（§2.9）；§3 轮 1 修正已落——① ∥ ③ 逐处落 §2.10 ∥ ② 已消解零动作；U1 已裁 = a 登记（§1.4）；desktop §2.19 受影响文件表七行 as-built 回填已落（2026-10-08——「实读（实施落盘）」届盘实读 164 ∥ 162 ∥ 307 ∥ 217 ∥ 529 ∥ 109 ∥ 387；vsc 侧指针零改））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 批次任务（覆盖 · 逐条 · 2026-10-08 设计轮）

**来源** = 残渣清扫批（父侧点火 · 本档 §1）；三笔 = #1059 ∥ #1058 ∥ #1052（#1052 经父侧 2026-10-08 裁：病征认可 · 并入本批）。**写域（本轮）= 本 §2**；两设计档随投遇 D5 冻结窗（评审 #7 在审）⇒ 本轮零写入 · 载荷在册待窗后续投（§2.2）。

| 台账 | 题 | 本批裁 |
|---|---|---|
| #1059 | M604 件两红腿随 #1027–#1029（渠道表单入弹窗体 · 单形）失锚 | 设计（修 = 两腿重锚：断言面零删；腿一 = 两宿主两轮重绘保真 ∥ 腿二 = 弹窗卡根在途窗携带） |
| #1058 | VSC 会诊行 ✕ 滞绑（追加行无监听） | 设计（修 = 容器级委托；判据 = 批内件先红后绿） |
| #1052 | 段出口密钥现读槽作用域 ⇒ 组弹窗体死保存 | **父裁：真病征认可 · 并入本批**（修 = 宿主无关现读 ×3 读点 + 机检腿） |
| #1060 | M604 件 **522** 行 > 500 | **父裁：不拆**（两腿就地重锚；「认账不排期」延续） |
| #1040 | `_delKey` 死码 | **父裁：零涉**（已并 #1042 批 · `_delKey` 收尸住该批） |

**复核修正（任务书 vs 盘上 · 逐项报）**：

- **#1058 任务书描述零命中**：「`onRemoveConsult` 8 处裸调」全仓 0 命中；「`:56 _delKey`」——`thincoder-vscode/webview/settings-models.js:56` 为 `mountModelMenus` 内行、非本项（`_delKey` 定义 = 同仓 `settings-providers.js:38-39`，属 #1040 面）。**实况** = 会诊行 ✕ **滞绑**：`settings-consult-dialog.js:136-151` 提交追加行 ∥ `settings-models.js:210-211` 仅建面期逐行绑定现存行；面板推送不重建（`settings-agent.js:159-160` 自陈）⇒ 追加行 ✕ 在「关面板 → 重开」前无监听——**既存行为**（#1054 前同形），非本批引入。设计按实况。
- **#1052 前提链复核（菜单径补勘）**：`thincoder-desktop/src/main/app-menu.mjs:36` `SETTINGS_GROUPS` 六名（含 `tools` ∥ `providers`）· `:130` 逐项 emit ⇒ `renderer/menu-actions.mjs:37-39` 透传组名 ⇒ `renderer/mount-settings.mjs:157` `openSettingsModal(group)`（`SCOPES` 十名闭集，`:49`）⇒ `renderer/views/settings.mjs:378` `settingsModalTree` 泛支渲染任一段体 ⇒ **段体入住组弹窗卡**（卡挂 `document.body`——`renderer/settings-modal.mjs:44-46`）= 槽外宿主确实存在 ⇒「非病征」结论不成立（漏勘菜单径）。父侧已撤回 · 认病征 · 并入本批。
- **#1052 读点数**：任务书两读点 = `renderer/mount-settings-segments.mjs:102`（`keySave`）∥ `renderer/mount-settings-segments-providers.mjs:61`（`saveProviderKey`）；**同族第三读点** = 同档 `:52`（`cancelKeyEdit`，同串）⇒ 同口径并入（免「两套现读面」；范围 = §2.5）。
- **批内件副本分叉（勘察 · 非阻塞）**：终位 `docs/batches/2026-09-29-desktop-rebuild-fidelity-M604.test.mjs`（522 行 · sha256 前 12 = 4422b9a807ff）与 `.thincoder/tmp/add-dialog-verify/…-patched.test.mjs` 同 sha（同件副本）；`.thincoder/tmp/2026-09-29-desktop-rebuild-fidelity-M604.test.mjs` = 旧副本（500 行 · 分叉）。档头「跑法」行（:9）仍指 `tmp` 旧路径 ⇒ 重锚同步收正（§2.3 件 4）；tmp 两副本清理 = 工程工具面（本批零触 · 报告 2）。

### 2.2 设计档落点（两 SETTINGS.md · 载荷在册 · 待 D5 冻窗后续投）

**冻结说明**：评审 #7 在审 `docs/desktop/design/SETTINGS.md` ∥ `docs/vsc/design/SETTINGS.md` ⇒ 本轮零写入（机械拒 = 避让）；窗口过后按下列载荷续投（父侧通报即投）。批档 ∥ 批内件用例面不受冻——本 §2 即设计全量在册。

**[1] `docs/desktop/design/SETTINGS.md` §2.8（:105-107）**——两笔：① 坐标收正 `:125-133` ⇒ `:207-222`（一致性面 · 报告 4）；② 增条 2（**逐字**）：

> 2. **两腿重锚（2026-10-08 · 台账 #1059）**——三端对齐批（#1027–#1029）后渠道两形表单入 `providerAdd` 弹窗体且单形渲染 ⇒ 波 1 机检两腿重锚：腿一 = 弹窗体富形（`addShape:"custom"`）+ 页槽（工具 key ∥ env shell）两宿主两轮重绘保真；腿二 = 弹窗卡根在途窗（`mcpForm` 跨 `loading`）携带（草稿 ∕ 焦点 ∕ 光标 ∥ 卡滚位）。机检件 = `docs/batches/2026-09-29-desktop-rebuild-fidelity-M604.test.mjs`（验收 = 8/8 全绿）；重锚设计 ∥ 「两形同刷」覆盖缺口与去处 = 批档 `docs/batches/2026-10-08-residue-sweep.md` §2。

**[2] `docs/desktop/design/SETTINGS.md` 增 §2.19**（插于 §2.18 段后 ∥ `## 3. 文件账` 前）——**逐字**：

> ### 2.19 段出口密钥现读宿主无关化（2026-10-08 · 台账 #1052）
>
> **来源** = 残渣清扫批复核（病征确认——组弹窗体宿主经菜单径可达：`src/main/app-menu.mjs:36` 六名 ⇒ `openSettingsModal` ⇒ 段体入卡（`views/settings.mjs:378`））。**病征**：`keySave` ∥ `saveProviderKey`（含 `cancelKeyEdit`）按槽作用域现读 ⇒ 组弹窗内改钥保存取不到件（或取到页槽空件）⇒ 空值零发送 = 死保存。**修 = 宿主无关现读**（文档序末位 = 交互面——沿 `mcpFormNode` 先例；`keySave` `renderer/mount-settings-segments.mjs:102` ∥ `saveProviderKey` ∥ `cancelKeyEdit` `renderer/mount-settings-segments-providers.mjs:61 ∥ :52`）。**边界**：`verifyChannel` 无名径 `presetValue(slot)`（`renderer/mount-settings-exits.mjs:124`）= 向导占槽径（槽内表单即正确宿主）——保持。**判据** = 批内件 `docs/batches/2026-10-08-residue-sweep-desktop.test.mjs`（两组弹窗径 + 页槽径回归 + 源面锁）。

**[3] `docs/vsc/design/SETTINGS.md` 增 §2.18**（插于 §2.17 段后 ∥ `## 3. 已知待办与已知限制` 前）——**逐字**：

> ### 2.18 会诊行 ✕ 容器级委托（2026-10-08 · 台账 #1058）
>
> **来源** = #1054 评审发现 1（🟡 登记）。**病征**：追加的会诊行其 ✕ 在「关面板 → 重开」前无监听（建面期仅逐行绑定现存行——`webview/settings-consult-dialog.js:142` 建行 ∥ `webview/settings-models.js:210-211` 绑定；面板推送不重建）——既存行为（#1054 改动前同形）。**修 = 容器级委托**：`bindConsultRows` 内 `#consult-rows` 一件 `click` 委托（`e.target.closest(".consult-del")` ⇒ 行移除 + 派 `consult-rows-changed`）；逐行绑定循环退场。**零语义外溢**：现存行行为逐字同；行追加口 ∥ 保存链 ∥ 上限 5 判据 ∥ effort 档 ∥ advisor 面零改。**判据** = 批内件 `docs/batches/2026-10-08-residue-sweep.test.mjs`（真 webview：追加行 ✕ 即点即删 + 事件在案 ∥ 现存行回归）。

**[4] `docs/desktop/design/SETTINGS.md` 变更记录（:509 后）+1 行**：

> - 2026-10-08（**残渣清扫批（#1052 ∥ #1058 ∥ #1059）· 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-08-residue-sweep.md` §2 · 台账 #1052 ∥ #1059）：§2 增 **§2.19**（段出口密钥现读宿主无关化）；§2.8 增两腿重锚条 + `paintSettings` 坐标收正（`:125-133 ⇒ :207-222`）。**产品码零触（设计轮）**。明细 = 批档 §2。

**[5] `docs/vsc/design/SETTINGS.md` 变更记录（:795 后）+1 行**：

> - 2026-10-08（**残渣清扫批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-08-residue-sweep.md` §2 · 台账 #1058）：§2 增 **§2.18**（会诊行 ✕ 容器级委托）。**产品码零触（设计轮）**。明细 = 批档 §2。

### 2.3 机制设计 · #1059（M604 两腿重锚 · 全规格）

**件** = `docs/batches/2026-09-29-desktop-rebuild-fidelity-M604.test.mjs`（522 行 · 8 测；两红腿 :272 ∥ :378——红 = `[data-form="preset"]` ∥ `[data-form="custom"]` 在页槽缺位）。**修形 = 两腿就地重锚**（#1060 裁：不拆）：观测根按现拓扑改位，**断言面逐一保留**（对照表见下）；轮注两处（:268-271 ∥ :376-377）收正为【#1059 重锚注】。

**腿一（:272 重写 · 两宿主两轮重绘保真）**——步骤（**全程同步段**——弹窗体初始焦点定时器 50ms 于同步块内不可能插入；勿增 await）：
1. `mountFace(SETTINGS_SEED)`（既有夹具；页槽开态）；`face.openSettingsModal("providerAdd")`（KD-75 ① 表单入弹窗体）；确定性落切片 `providers: { …held, state: "ready", addShape: "custom" }`（沿件内 :416-418 先例——开径触发 `loadProviders` 挂起，显式落 `ready`）。
2. 卡根 = `settingsModalNode()`（`renderer/settings-modal.mjs` 导出——第二闸卡根读面；腿内动态取件）。
3. 首轮填值：弹窗体富形（`[data-form-shape="custom"]`）——`[name="name"]`=`draft-name` ∥ `baseURL`=`http://draft.invalid/v1` ∥ `model`=`draft-model` ∥ `format`=`anthropic` ∥ `proxy`.checked=`true` ∥ `key`=`sk-custom-draft`；页槽两件——`[data-key-input="embedding"]`=`sk-tools-draft` ∥ `[name="shell.path"]`=`C:\draft\shell`。置焦 `name` 件 + `setSelectionRange(2,5)`；卡根 `scrollTop=120` ∥ 槽根 `scrollTop=60`。
4. 次轮触发（沿原腿 = `verify` 切片写）：`store.set(patchSettings(store.get(), { verify: { kind: "ok", count: 2, reason: null } }))`。
5. 断言：`custom2 ≠ custom`（**重建 = 新节点** · 弹窗体换卡）∥ 六值面（name ∥ baseURL ∥ model ∥ format ∥ key ∥ proxy.checked）∥ 页槽两值面 + `toolsInput2 ≠ toolsInput`（页槽同重建）∥ `doc.activeElement === custom2.querySelector('[name="name"]')` + `selectionStart/End = 2/5`（**焦点 ∥ 光标区间**）∥ 卡根 `scrollTop === 120` ∥ 槽根 `scrollTop === 60`（**两根滚位**）。

**腿二（:378 重写 · 弹窗卡根在途窗携带）**——步骤：
1. `mountFace(SETTINGS_SEED)`；`face.openSettingsModal("mcpForm")`；确定性落 `mcp: { …held, state: "ready" }`（同上先例）。
2. 卡根 = `settingsModalNode()`；`[data-form="mcp"]` 内 `[name="name"]`=`inflight-draft` + 置焦 + `setSelectionRange(3,6)`；卡根 `scrollTop = card.scrollHeight - card.clientHeight`（非零断言——判据非平凡）。
3. 读①：`mcp: { …held, state: "loading" }` ⇒ 断言：换卡新节点 ∥ `cardL.querySelector('[data-form="mcp"]') === null`（**在途面零表单**）∥ `cardL.scrollTop < scrollBefore`（**内容短 ⇒ 写入被截——残件携带机制位可观测**）。
4. 读②：`mcp: { …held, state: "ready" }` ⇒ 断言：`[name="name"]` 值 = `inflight-draft`（**草稿跨 loading 窗**）∥ `doc.activeElement` = 新表单名件 + 光标 3/6（**焦点 ∥ 光标**）∥ 卡根 `scrollTop === scrollBefore`（**卡滚位跨途窗保真**——在途面截断不回写 ∥ 携带窗信任规则）。

**断言面对照表（原 ⇒ 新 · 零删）**：

| 原断言面 | 新去处 | 备注 |
|---|---|---|
| 重建 = 新节点（自定形） | 弹窗体富形（+ 页槽件同断） | 主宿主改位 |
| 自定形 name/baseURL/model/format/key 五值 | 弹窗体富形（同五件） | 逐字保留 |
| `active` 复选 `checked` | **`proxy` 复选**（`mark:proxy` 纳域） | 原 `active` 随 KD-75 ② 从设置面表单退场 ⇒ 以 proxy 复现 checked 面（作用域 `add:provider` 单骨——跨形复填前提在案） |
| 预设形 key ∥ preset 值 | 向导腿（本件 :326——`[name="key"]` ∥ `[name="preset"]` 值 ∥ 焦点 ∥ 光标 ∥ 根滚位） | 单形渲染 ⇒ 同轮不可复现；向导表单 = 同 `channelFormTree` 预设形（同闸同机制） |
| MCP command 值 | 本件腿二（MCP 表单 `[name="name"]` 跨 loading 窗） | 表单入弹窗体 ⇒ 观测根随迁 |
| 工具 key ∥ env shell 值 | 本腿页槽两件（逐字保留） | 页槽仍为主宿 |
| 焦点 ∥ 光标（自定形 name 件） | 弹窗体富形 name 件 | 同 id 键回退链 |
| 根 scrollTop（槽根） | 两根（卡根 ∥ 槽根） | 复盖 |
| 同键多例 `id="name"/"key"` nth 消歧 | **缺口**（见下 · 项 2） | 单形 ⇒ 渠道面无自然同键多例复现位 |
| 腿二：草稿 ∥ 焦点 ∥ 光标 ∥ 零表单 ∥ 截断 ∥ 回位 | 弹窗卡根（MCP 表单同名件） | 观测根改位——逐面保留 |

**覆盖缺口与去处（逐项 · 复核结论）**：

1. **「两形同刷」矩阵**（原一轮内两形并断）——单形渲染不可复现（产品已定 · 非缺陷）⇒ 面拆：自定形 → 腿一；预设形 → 向导腿（本件 :326 在册）；「并存」无存活需求（同骨一表）。
2. **同键多例 nth 消歧**——原由两形同 id 三对（name/key/active）承载；单形后渠道面同 id 唯一 ⇒ 无自然复现位。**分叉**：a) 本批不扩腿（登记缺口；机制保留在 `view-state.mjs`）∥ b) 保覆盖 = 页槽 + 工具段弹窗体同键件小断言（`[data-key-input]` 两宿主并存，`mark` 无 id ⇒ nth 面另位）。**倾向 a**（本轮 = 重锚零扩）——上抛 U1。
3. **跨形切换行为面**（KD-75「跨形切换键值保真」句）——**复核结论：父侧「形切换面另有专腿」不成立**——D2 ∥ V2 腿 = **前提 ∥ 序面**断言（`data-draft-scope` 单骨「跨形复填前提」：`docs/batches/2026-10-07-provider-config-parity-desktop.test.mjs:169-170`；VSC `:43` 元素序），**非行为腿**（全批内件零「切换 ⇒ 复填」实证）。**分叉**：a) 登记（条件 = 渠道表单面下次触碰）∥ b) 腿一尾补折返断言（custom ⇒ preset ⇒ custom：键入值经第二闸往返——≈10 行）。**倾向 a**——上抛 U1（与项 2 合裁）。

**件 4（随动两处 · 一致性面 · 报告）**：① 档头「跑法」行（:9）路径收正为现家位（`docs/batches/2026-09-29-desktop-rebuild-fidelity-M604.test.mjs`；「暂存位」括注改历史式指 M604 批档 §5——不得指 `tmp` 旧副本）；② 轮注两处收正为【#1059 重锚注】（文本 = 实施轮落，语义 = 重锚因由 ∥ 新腿形 ∥ 缺口指针见本 §2.3）。

**零行为面外溢**（本件 = 批内归档件——8 测面不增不减；行数 ≈522 ±10 在册）。

### 2.4 机制设计 · #1058（VSC 会诊行 ✕ 容器级委托）

**修**（`thincoder-vscode/webview/settings-models.js:197-214` `bindConsultRows`）：逐行绑定循环（:210-213）⇒ `#consult-rows` 一件 `click` 委托：
`rows.addEventListener("click", (e) => { const del = e.target.closest ? e.target.closest(".consult-del") : null; if (!del) return; del.closest(".consult-row")?.remove(); rows.dispatchEvent(new window.Event("consult-rows-changed", { bubbles: true })) })`
（`closest` 守卫式沿同面先例 `settings-mcp-dialog.js:130`；事件名 ∥ 移除语义 ∥ 派发逐字同原）。
**重入安全**：容器随每次 `buildSettings` 重建（`settings.js:185-199` `body.innerHTML` 全建 + 尾绑定）⇒ 无监听叠加（与既有 `rows.addEventListener("consult-rows-changed", …)` 同前提）。
**零语义外溢**：现存行行为逐字同（移除 + 同事件 + 保存链 `settings-agent.js:189-191` 触发同）；行追加口（`settings-consult-dialog.js:136-151`）∥ 上限 5 判据（`refreshAddBtn`）∥ effort 档 ∥ advisor 面零改。

**判据（批内件 · 真 webview · 先红后绿）** = `docs/batches/2026-10-08-residue-sweep.test.mjs`（新 · ≈120 行 · happy-dom 仓内既有 devDep——头式沿 `docs/batches/2026-10-07-add-dialog-unify.test.mjs:34-37`）：
- C1（核心 · 先红）：夹具（`#consult-rows` ∥ `#consult-add`）⇒ `bindConsultRows()` ⇒ 走真弹窗径追加一行（`openConsultDialog` + 选型 + 提交——沿 #1054 件径）⇒ 点该行 `.consult-del` ⇒ 断言：行移除 ∥ `consult-rows-changed` 计数 ≥1。**修前红**（无监听 ⇒ 行在 ∥ 零事件）——先红证据随跑留档。
- C2（回归）：建面期现存行 ✕ 同径（同断言）。
- C3（源面锁）：`settings-models.js` 内逐行绑定形（循环内 `.consult-del` `addEventListener`）零残留 ∥ 容器委托在案。

### 2.5 机制设计 · #1052（段出口密钥现读宿主无关化）

**病征**（复核链见 §2.1）：工具/渠道组弹窗（菜单径可达）内改钥后保存 ⇒ 空值零发送 = 死保存；页槽关态更直接（零件）。
**修 = 宿主无关现读**（文档序末位 = 交互面——沿 `mcpFormNode` 先例；三读点同口径）：
- `renderer/mount-settings-segments.mjs:102`（`keySave`）⇒ `document.querySelectorAll('[data-key-input="<kind>"]')` 取末位（空集 ⇒ `null`）。
- `renderer/mount-settings-segments-providers.mjs:61`（`saveProviderKey`）∥ `:52`（`cancelKeyEdit`——同族第三读点，同口径并入）⇒ `document.querySelectorAll("[data-provider-key-input]")` 取末位。
- 守卫式保形：`typeof document?.querySelectorAll === "function"`（原 `querySelector` 守卫同义）。

**死依赖清理**（本修直接派生）：两段族 `slot` 依赖净删（解构 `:29` ∥ `:39` + 档头 deps 句 `:10/:26` ∥ `:33`）；`renderer/mount-settings-exits.mjs:178 ∥ :186` 注入键随删。**保持项**：同档 `:124` `presetValue(slot)`（`verifyChannel` 无名径 = **向导占槽径**——向导表单住槽内 ⇒ 槽作用域即正确宿主；非本族病面）；`:195` 既有死注入键（`slot` → mcp 工厂零消费）非本批肇因——未动（报告 3）。
**零语义外溢**：页槽单宿主径逐字同（原唯一工作径）；空值零发送 ∥ 失败草稿 `keyDraft` ∥ 草稿失效（`invalidateDrafts`）∥ 写后复读四件零改。

**判据（批内件 · 假 DOM · 先红后绿）** = `docs/batches/2026-10-08-residue-sweep-desktop.test.mjs`（新 · ≈220 行 · M604 件脚手架收窄式——假 DOM ∥ 假台 `invoke` 记录调用）：
- D1（先红 · 工具组弹窗径）：`openSettingsModal("tools")` + 落 `state:"ready"` + keys ⇒ `onKeyEdit("embedding")` ⇒ **卡内**填入 `sk-modal-draft` ⇒ `onKeySave("embedding")` ⇒ 断言假台收到 `settings:tools` 调用且载荷 = `{ patch: { embedding: { apiKey: "sk-modal-draft" } } }` ∥ 无 "empty key" 记错。
- D2（先红 · 渠道组弹窗径）：`openSettingsModal("providers")` + 落带行切片（`p1` · hasKey）⇒ `onProviderKeyEdit("p1")` ⇒ 卡内填入 ⇒ `onProviderKeySave("p1")` ⇒ 断言假台收到 `provider:setKey` = `{ name: "p1", key: "sk-modal" }`。
- D3（回归 · 页槽径）：不弹窗——两站仍读页槽输入（原工作径逐字保）。
- D4（源面锁）：两档内槽作用域现读形零残留 ∥ `querySelectorAll` 末位形在案；三读点（`keySave` ∥ `saveProviderKey` ∥ `cancelKeyEdit`）逐点断言。
- D5（轻）：弹窗体 `cancelKeyEdit` 径 = 切片回静止态（`edit:null` · `keyDraft:null`）+ 零记错（`invalidateDrafts` 深面由 #652 既有腿承载——不深探）。

### 2.6 受影响文件表（现行 ⇒ 预期 · 设计轮实读）

**设计轮（现已 ∥ 待投）**：

| # | 档 | 现行 ⇒ 预期 | 面 |
|---|---|---|---|
| 1 | `docs/desktop/design/SETTINGS.md` | 510 ⇒ ≈514（§2.8 增条 + 坐标收正 + §2.19 增节 + 变更行） | #1059 ∥ #1052（**待冻窗后投**） |
| 2 | `docs/vsc/design/SETTINGS.md` | 796 ⇒ ≈800（§2.18 增节 + 变更行） | #1058（**待冻窗后投**） |
| 3 | `docs/batches/2026-10-08-residue-sweep.md` §2 | 本轮落 | 全笔 |

**实施轮（eng-coder · 评审 + 批准后）**（行数口径 = 内容行数（文末换行不计）——2026-10-08 fix 轮现行值收正，见 §2.10）：

| # | 档 | 现行 ⇒ 预期 | 面 |
|---|---|---|---|
| 4 | `docs/batches/2026-09-29-desktop-rebuild-fidelity-M604.test.mjs` | 522 ⇒ ≈524（两腿重写 + 两轮注 + 跑法行收正；±10 在册） | #1059 |
| 5 | `thincoder-vscode/webview/settings-models.js` | 214（实读）⇒ ≤±3（委托替换逐行绑定） | #1058 |
| 6 | `thincoder-desktop/renderer/mount-settings-segments.mjs` | 164 ⇒ ≤±2（现读改 + `slot` 依赖净删） | #1052 |
| 7 | `thincoder-desktop/renderer/mount-settings-segments-providers.mjs` | 160 ⇒ ≤±2（两读点改 + `slot` 依赖净删） | #1052 |
| 8 | `thincoder-desktop/renderer/mount-settings-exits.mjs` | 307 ⇒ ≤±2（两注入键删；`presetValue(slot)` 保持） | #1052 |
| 9 | `docs/batches/2026-10-08-residue-sweep.test.mjs`（新 · VSC 半） | 0 ⇒ ≈120 | #1058 |
| 10 | `docs/batches/2026-10-08-residue-sweep-desktop.test.mjs`（新 · 桌面半） | 0 ⇒ ≈220 | #1052 |

**零触面**：其余产品码 ∥ 两 SETTINGS.md 以外的设计档 ∥ 需求档 ∥ 仓套件；`.thincoder/tmp/` 两副本 = 工程工具面（本批零触 · 报告 2）。

### 2.7 验收对照（AC ↔ 条目 · 机检）

| AC | 条目 | 判据（命令 + 预期读数） |
|---|---|---|
| AC-1 | #1059 | `node --test docs/batches/2026-09-29-desktop-rebuild-fidelity-M604.test.mjs`（自仓根 thincoder/）⇒ **8/8 pass · 0 fail**（修前基线 = 6/8——两红 = 本笔修复面） |
| AC-2 | #1058 | `node --test docs/batches/2026-10-08-residue-sweep.test.mjs` ⇒ 全绿；**先红证据** = 修前同跑 C1 红（无监听）留档 |
| AC-3 | #1052 | `node --test docs/batches/2026-10-08-residue-sweep-desktop.test.mjs` ⇒ 全绿；**先红证据** = 修前 D1 ∥ D2 红（零调用）留档 |
| AC-4 | 全笔 | `node --check` 四产品码档 + 两新批内件 ⇒ 全绿；仓套件零跑（收口跑 = 父侧唯一跑点） |
| AC-5 | 设计档 | 两 SETTINGS.md 落点 [1]–[5] 在案（**冻窗后续投**——§2.2 载荷逐字；落定前本批不视为设计面全落） |
| AC-6 | 台账 | #1059 ∥ #1058 ∥ #1052 三行 evidence 收正（父侧；#1052 前「核讫」已撤）｜#1060 维持 ∥ #1040 零涉 |

**需求面归口说明**：三笔皆**缺陷修 ∥ 机检面重锚**（零新需求语义）——需求档零改；归口 = 台账三行 + 源批档（#1059 面基 = M604 批档 §2.10 AC-1 ∥ #1058 = #1054 §2.17 边界注 + 评审发现 1 ∥ #1052 = #1036 同口径先例）。如需需求面补行——父侧另判。

### 2.8 关键决策 + 上抛 ∥ 报告

- **D1（#1059）= 两腿就地重锚（不拆件）**（#1060 父裁认可）。被否：拆分（共享脚手架 ≈160 行复制或第三档——结构动 ≫ 收益）；被否：只改选择器（观测根不改 ⇒ 弹窗体面 ∥ 卡根在途窗两面零覆盖）。
- **D2（#1059）= 断言面零删 + 两处明示缺口**（nth 消歧 ∥ 跨形切换）——去向见 §2.3 缺口 2 ∥ 3。
- **D3（#1058）= 容器级委托**。被否：追加点逐点补绑（新写入点再犯——滞绑类复发）。
- **D4（#1052）= 宿主无关现读（文档序末位）+ 同口径 ×3 读点**。被否：双宿主分支各查先（两套现读面——台账原警示）；被否：仅按名单两读点（`cancelKeyEdit` 留旧口径 = 同档两套现读）。**范围注**：`:52` 为名单外同族点——同口径并入（父侧若要严格两行级，裁掉即可——载荷独立）。
- **U1（待裁）**：§2.3 缺口 2 ∥ 3 的去处分叉（a = 登记 ∥ b = 扩腿）——倾向 a（本轮零扩）。
- **报告 1**：任务书 vs 盘上逐项修正（§2.1——#1058 描述零命中 ∥ #1052 菜单径补勘 + 第三读点）。
- **报告 2**：批内件副本分叉（`tmp` 旧副本 500 行 ∥ 跑法行指旧路径）——重锚同步收正（件 4）；`tmp` 清理 = 工程工具面（父侧另裁）。
- **报告 3**：`mount-settings-exits.mjs:195` 既有死注入键（`slot` → mcp 工厂零消费）——非本批肇因 · 未动（留档）。
- **报告 4**（非阻塞）：`docs/desktop/design/SETTINGS.md:107` 原坐标 `:125-133` 与现盘不合（`paintSettings` 今在 `:207-222`）——随投收正（一致性面 · 报告）。
- **报告 5**（非阻塞）：`docs/vsc/design/SETTINGS.md:795`（#1042 批变更行）载「`_delKey` 死码已清」而 `_delKey` 定义仍在盘（`settings-providers.js:38-39`）——属在飞批 #1042 设计轮笔（该批实施面），本批零涉 · 留档互核。

### 2.9 两设计档载荷投落（fix 续投轮 · 2026-10-08 · eng-designer）

**§2.2 状态随正：「载荷在册 · 待 D5 冻窗后续投」⇒ 已投**——[1]–[5] 逐笔落盘 + 回读核讫；D5 冻窗已过（两 `SETTINGS.md` 解冻）；`docs/vsc/design/WEBVIEW-PROTOCOL.md` 转 #10 冻窗——本轮零碰。

- **[1]** `docs/desktop/design/SETTINGS.md` §2.8（:105-108）——① 坐标收正 `:125-133 ⇒ :207-222`（届盘实读核 = `thincoder-desktop/renderer/mount-settings.mjs:207-222`）；② 增条 2（#1059 两腿重锚——落 :108）。
- **[2]** `docs/desktop/design/SETTINGS.md` 增 §2.19（:242-244）——#1052 段出口密钥现读宿主无关化（插于 §2.18 后 ∥ `## 3. 文件账（本域）` 前）。
- **[3]** `docs/vsc/design/SETTINGS.md` 增 §2.19（:594-596）——#1058 会诊行 ✕ 容器级委托（`## 3. 已知待办与已知限制` 前）。
- **[4]** `docs/desktop/design/SETTINGS.md` 变更记录（:515）+1 行 ∥ **[5]** `docs/vsc/design/SETTINGS.md` 变更记录（:817）+1 行。
- **编号让位（报告 · 一致性面当场修）**：[3] 载荷原节号 §2.18；投落窗口内并行批 #1053（provider 密钥链守卫批）先投其 §2.18（`docs/vsc/design/SETTINGS.md:578`——先投保留）⇒ 本笔实投 **§2.19**（让位）；随动 = 节头 ∥ 变更行节号（本笔自有两处；载荷文本其余逐字零改；#1053 内容零触）。
- **载荷坐标届盘复核 = 全绿**：`keySave` `mount-settings-segments.mjs:102` ∥ `saveProviderKey` `:61` ∥ `cancelKeyEdit` `:52` ∥ `presetValue(slot)` `mount-settings-exits.mjs:124` ∥ `SETTINGS_GROUPS` `app-menu.mjs:36` ∥ `settingsModalTree` `views/settings.mjs:378` ∥ vsc `settings-consult-dialog.js:142` ∥ `settings-models.js:210-211`。
- **零语义外扩 ∥ 零新条款 ∥ 产品码零触 ∥ 批外档零触 ∥ `WEBVIEW-PROTOCOL.md` 零碰（冻窗）。**

### 2.10 §3 轮 1 修正落地（fix 轮 · 2026-10-08 · eng-designer）

**承** = 本档 §3 轮次 1（发现 ① 🟡 ∥ ② 🟡 ∥ ③ 🔵）+ 父侧裁（① ∥ ③ 采纳修正 ∥ ② 已由文档卫生批消解——零动作）。**逐号**：

- **①（受影响文件标注 · 已修）**——desktop `SETTINGS.md`：§2.19 尾补「**受影响文件（本批 · 现行 ⇒ 预期 · 内容行数口径（文末换行不计））**」小表（`:277-:287`——**7 行** = 源档 4 + 批内件 3；批内件注「随实施回填」）+ §2.8 项 2 补表指针（`:109`）；vsc `SETTINGS.md`：§2.19 补全量小表指针（`:622`——落点 = desktop §2.19）。**枚举差报告**：发现①枚举源档三件（审阅视野 = 两档落笔面所载文字）；本表按判据「本批将改动的源档」全量补第 4 件 = `mount-settings-exits.mjs`（§2.5 死依赖清理面）——由 §2.6 既有表直接推得，零新语义。**两档变更行**（desktop `:562` ∥ vsc `:856`）同拍。
- **②（§3.1 九行数值漂移 · 零动作 · 复核结论）**——文档卫生批行数面回填已落：九行届盘现读 = **439** ∥ **261** ∥ **186** ∥ **96** ∥ **264** ∥ **307** ∥ **327** ∥ **192** ∥ **206**（均载「实读 2026-10-08——届盘实读收正（…文档卫生批行数面回填）」）；`307` ∥ `327` 两越线在 §3.1 面可见（回读核 = `docs/desktop/design/SETTINGS.md:317 ∥ :318`；九行逐行核讫——`:305`–`:320` 间）。**消解**。
- **③（判据口径 · 已修）**——desktop `SETTINGS.md` §2.19 第三腿「源面锁」补腿定义（`:274-:275`）：扫描域（本修两件）∥ 判据形状（① 负向零残留 ∥ ② 正向 `querySelectorAll` 末位形 ∥ ③ 三读点逐点断言）∥ 同族出口覆盖点名 + 结论（`keySave` ∥ `saveProviderKey` ∥ `cancelKeyEdit` = 现读点全集；**删钥径** `keyDelete` ∥ `deleteProviderKey` = 零 DOM 现读（按名发送）⇒ 非同面 · 零改）。

**行数口径收正（一致性面 · 当场修 · 逐条报告）**：本批五件现行值按两档「内容行数口径（文末换行不计）」收正——`mount-settings-segments.mjs` **165 ⇒ 164** ∥ `mount-settings-segments-providers.mjs` **161 ⇒ 160** ∥ `mount-settings-exits.mjs` **308 ⇒ 307** ∥ `settings-models.js` **215 ⇒ 214** ∥ M604 件 **523 ⇒ 522**（差因 = 前值按末位空行计入；届盘实读复核 = 164 ∥ 160 ∥ 307 ∥ 214 ∥ 522——sha 核讫 `4422b9a807ff`）。§2.6 五行随正（`:185-:189`）∥ 实施轮表头补口径注（`:181`）∥ §2.1 `:68` ∥ §2.3 `:100` ∥ `:138` 同源收正。
**跨段留档（§1 非本席写域——零触）**：§1 `:28` ∥ `:60`「M604 件 523 行」两处 = 同一 +1 口径差（现读 **522**）——未动，留档互核。
**零触披露**：产品码 ∥ 他批档 ∥ `docs/vsc/design/WEBVIEW-PROTOCOL.md`（冻窗）∥ 批档 §1/§3–§6——零触；本档 §2 仅本块追加 + §2.1/§2.3/§2.6 收正行。
**零新语义**（发现 ∥ 父裁 ∥ 既有设计的直接导出）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

评审对象 = 批 2026-10-08-residue-sweep（#1059 两腿重锚 ∥ #1058 容器委托 ∥ #1052 宿主无关现读）；对象状态 = 待评审。对审 = `thincoder/docs/desktop/design/SETTINGS.md`（全档；本批落笔面 = §2.8 项 2 ∥ §2.19 ∥ 变更记录）∥ `thincoder/docs/vsc/design/SETTINGS.md`（全档；本批落笔面 = §2.19 ∥ 变更记录）。代码坐标未能核（审阅范围限两档、无变更集）——涉码断言均按档内证据或标 unverified。

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | 受影响文件标注（criterion 8） | 🟡 | 在审两档对本批将改动的源档未载「现行行数 + 预期增量」标注：桌面侧 `thincoder-desktop/renderer/mount-settings-segments.mjs`（现行 **164**——desktop:274）∥ `thincoder-desktop/renderer/mount-settings-segments-providers.mjs`（现行 **160**——desktop:276）；VSC 侧 `thincoder-vscode/webview/settings-models.js`（现行 **214**——vsc:567）；另三件批内件（M604 测试档——desktop:108 ∥ residue-sweep 两测试档——desktop:244 / vsc:600）亦无现行行数/增量；§2.19/§2.8 项 2 未指向任何受影响文件表。四件源档皆 <300 ⇒ 无拆档义务；形制先例 = 设计轮即建 §3.2 批块（desktop:470）∥ §3.1 预估行（desktop:506）。 | 补本批受影响文件小表（文件 ⇒ 现行 ⇒ 预期 ≤±N；批内件行数随实施回填），或档内明标「本批受影响文件表 = 批档 §2」指针。 |
| 2 | 文档状态（§3.1 台账 vs §3.2 批块——数值漂移） | 🟡 | desktop §3.1 九行仍停在 add-dialog-unify 之前读值，与同档 §3.2 该批「实读（实施落盘）」抵触：`views/settings.mjs`「398 ⇒ 419」（:260）vs「419 ⇒ 439」（:376）∥ `views/settings-sections-mcp.mjs` **241**（:265）vs「241 ⇒ 261」（:377）∥ `views/settings-sections-models.mjs` **164**（:266）vs「164 ⇒ 186」（:378）∥ `views/settings-sections.mjs` **95**（:261）vs「95 ⇒ 96」（:379）∥ `mount-settings.mjs` **259**（:270）vs「259 ⇒ 264」（:380）∥ `mount-settings-exits.mjs` **289**（:272）vs「289 ⇒ 307」（:381）∥ `mount-settings-segments-mcp.mjs`「已落 · 299」（:273）vs「299 ⇒ 327」（:382）∥ `mount-settings-segments-models.mjs` **169**（:275）vs「169 ⇒ 192」（:383）∥ `mount-settings-reads.mjs` **204**（:271）vs「204 ⇒ 206」（:391）。两件实已越 300（307 ∥ 327——§3.2 有「拆分评估登记」）在 §3.1 面不可见；§3.1 注行称按 `PROJECT.md` §4.1 同值同步（:284）。 | 收口轮把 §3.1 上述九行走读齐平（或标 as-of 并指 §3.2），使 307 ∥ 327 两越线在台账面可见；批例 = :510 ∥ :512。 |
| 3 | 判据口径（Clarity） | 🔵 | desktop §2.19 判据第三腿「源面锁」（:244）为档内新铸词、未给锁定面（扫哪些档 ∥ 何形状）；病征只点名三函数（`keySave` ∥ `saveProviderKey` ∥ `cancelKeyEdit`——:244），同族其余现读点（如删钥径）是否同面未载（产品码不在审阅范围——unverified）。 | §2.19 或批档补腿定义（扫描域 + 判据形状 + 同族出口覆盖点名），与档内逐腿点名式判据同形（如 :94 ∥ :220）。 |

覆盖结论：三项（#1052 ∥ #1058 ∥ #1059）皆有落面 + 机检判据（desktop:244 ∥ vsc:600 ∥ desktop:108）；未见 🔴（无机制级矛盾 ∥ 无不可实现项 ∥ 无验收面缺口）。

计数：🔴 0 ∥ 🟡 2 ∥ 🔵 1。

VERDICT: pass

## §4 用户批准（主 agent）

**父侧代签**（用户 2026-10-08 11:38「自动跑」授权 · 沿本档 §1.5 自缚三条）。

**三条件齐备** ✓：
① **设计评审 pass** ✓（§3 轮次 1 · VERDICT: pass · 🔴 0——🟡2/🔵1 经父裁全采后 fix 轮 #46 落）；
② **修正轮已落地并逐条核验** ✓（#46：① 受影响文件小表 desktop `docs/desktop/design/SETTINGS.md:277–287`（7 行）+ 指针 `:109` ∥ vsc `:622`；② §3.1 九行已消解复核结论（零动作——卫生批回填）；③ 「源面锁」腿定义 `:274–275`；另全场一致面收正五件行数（内容行数口径：164 ∥ 160 ∥ 307 ∥ 214 ∥ 522）+ §2.10 追加块 `:233–244`；父侧抽核在案）；
③ **token 已签发** ✓。
**代签依据** = §3 轮 1「VERDICT: pass」+ 计数（🟡 2 ∥ 🔵 1）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（三笔落码 + 两新批内件全绿（先红后绿留档）；M604 重锚 tmp 副本 8/8、原档落讫归父侧；审计 CLEAN · advisor 轮 2 pass）



**交付摘要**（三笔落码 + 两新批内件 + M604 重锚 tmp；设计 = §2.3–§2.5 全规格落地 · 2026-10-08 · eng-coder）：

- **#1058** `thincoder-vscode/webview/settings-models.js:210-217` —— `bindConsultRows` 逐行绑定循环退场 ⇒ `#consult-rows` 一件 click 委托（`closest` 守卫 ∥ 行移除 ∥ `consult-rows-changed` 派发逐字同原）；214 ⇒ 217 行（+3 · 档 ≤±3 内）。
- **#1052** 三读点宿主无关现读（文档序末位 = 交互面，沿 `mcpFormNode` 先例；守卫式 `typeof document?.querySelectorAll === "function"`）+ 死依赖净删：
  - `thincoder-desktop/renderer/mount-settings-segments.mjs:99-102`（`keySave`）+ `slot` 净删（:10 ∥ :25 ∥ :28）；164 ⇒ 164（±0）。
  - `thincoder-desktop/renderer/mount-settings-segments-providers.mjs:51-53`（`cancelKeyEdit`）∥ `:62-63`（`saveProviderKey`）+ `slot` 净删（:33 ∥ :39）；160 ⇒ 162（+2 · 档 ≤±2 内）。
  - `thincoder-desktop/renderer/mount-settings-exits.mjs:178 ∥ :186` 两注入键随删（:124 `presetValue(slot)` ∥ :195 MCP 族保持）；307 ⇒ 307（±0）。
- **#1059** M604 两腿重锚：**跨批写门禁拒写原档**（工具层拒：「cross-batch batch-record write」）⇒ 成品落 tmp 副本 `.thincoder/tmp/2026-10-08-residue-sweep-M604-reanchored.test.mjs`（529 行 = 原档 522 + 7）；5 处替换 = 跑法行收正（:9-10 现家位）∥ 两轮注收正（:268-271 ∥ :375-377 ⇒【#1059 重锚注】）∥ 两腿重写（腿一 :272-323 两宿主两轮重绘 ∥ 腿二 :378-416 弹窗卡根在途窗）；断言面对照表 11 行逐行有归宿、零删。**原档落讫 = 父侧**（整体覆盖法见读数档末段）。
- 两新批内件：`docs/batches/2026-10-08-residue-sweep.test.mjs`（C1-C3 · 109 行）∥ `docs/batches/2026-10-08-residue-sweep-desktop.test.mjs`（D1-D5 · 387 行）。

**验证读数**（留档 = `.thincoder/tmp/2026-10-08-residue-sweep-readings.txt`）：

- 红基线（产品码修复前）：C1 红（追加行在 1≠0）∥ C3 红（逐行绑定残留）；D1 ∥ D2 红（零调用 + `empty key` 记错）∥ D4 红（槽作用域残留）；M604 原档 6/8（两红 = :272 ∥ :378，`[data-form="preset" ∥ "custom"]` 页槽缺位）。
- 绿（修复后）：`node --test docs/batches/2026-10-08-residue-sweep.test.mjs` ⇒ 3/3 ∥ `…-desktop.test.mjs` ⇒ 5/5 ∥ M604 tmp 副本 ⇒ **8/8**。
- 受影响面既有批内件回归（真跑一次）：`2026-10-07-add-dialog-unify.test.mjs` 8/8 ∥ `…-desktop.test.mjs` 5/5。
- `node --check`：四产品码档 + 两新批内件 + tmp 副本 ⇒ 全 OK。**仓套件零跑**（收口跑 = 父侧唯一跑点）。

**决策透明表**：

| # | 决策 | 依据 |
|---|---|---|
| 1 | M604 原档拒写 ⇒ 产 tmp 副本；落讫归父侧 | 跨批写门禁（工具层拒绝——本舱不可绕）；任务书「原档落讫归父侧（沿结构批先例）」 |
| 2 | 桌面半批内件 387 行 > 设计估算 ≈220 | 假 DOM 脚手架随件自携（设计指定「M604 件脚手架收窄式——假 DOM ∥ 假台 invoke 记录式」）；<500 硬限 · 报告面收口回填 |
| 3 | 源面锁（C3 ∥ D4）按判据形状三件断言（负向零残留 ∥ 正向现读式 ∥ 读点逐点） | §2.10 ③ 腿定义（扫描域 + 判据形状 + 三读点逐点） |

**审计与代码评审轮次与终态**：

- 内部探索分歧审计（只读 · explore）：**CLEAN** —— 四类偏差（实质分歧 ∥ 少做变形 ∥ 越界改动 ∥ 设计档漂移）零命中；两观察：桌面半 387 行（非阻塞）∥ §5 当时空（本轮补写）。
- 内部 advisor 代码评审（轮 1 · type=code）：**changes-required** —— 🔴1（M604 未落声明位 · AC-1 坐标仍 6/8 ⇒ 处置 = 父侧落讫，本舱受写门禁约束不可执行）∥ 🟡2（§5 空 ⇒ 本轮已写 ∥ 桌面半行数 ⇒ 报告面）∥ 🔵4（522>500 已裁不拆 ∥ exits 307 在册 ∥ D5 轻腿不判别 ∥ 设计表回填）。
- fix round：§5 写入（本段补记）∥ 🔴#1 处置 = 父侧落讫（覆盖法在读数档）∥ 代码零改（审计与评审均未要求代码修正）。
- 终态：**clean（代码面）** + 1 项父侧落讫待办（tmp 副本 ⇒ 原档，落讫后 AC-1 原位复读 8/8）。

## §6 验证与收口（父代理）

**收口结算（主 agent · 2026-10-08）**

**腿表（终态全 clean）**：轻通道轮三笔（**#1059** M604 两腿重锚 ∥ **#1058** VSC 会诊行容器级委托 ∥ **#1052** 桌面三读点宿主无关现读 + `slot` 死依赖净删）+ **#64** 设计表 as-built 回填（七行：164 ∥ 162 ∥ 307 ∥ 217 ∥ 529 ∥ 109 ∥ 387）+ M604 原档落讫（父侧 · 逐行 diff 恰 1 行核讫）。

**仓套件（父侧唯一跑点 · 同上一次覆盖并集）**：`thincoder-server` `prepublishOnly` 201/201 · fail 0 · exit 0 ∥ 五包空清单绿。本批批内件：`-residue-sweep.test.mjs` **3/3** ∥ `-desktop.test.mjs` **5/5** ∥ M604 件 **8/8**（父侧落讫复跑）。

**台账结算**：**#1061** 核销（轮档——轻通道轮全链：§2 设计正式化 → §3 独立评审 → §4 代签 → §6 收口）∥ **#1059** 核销（M604 原位 8/8）∥ **#1058** 核销 ∥ **#1052** 核销（两处真病征修讫）。引出条件债：**#1071**（M604 两处明示覆盖缺口——专项轮候选）。

**残留扫描**：全在册；prose 零残留。**前情**：无（独立批）。
