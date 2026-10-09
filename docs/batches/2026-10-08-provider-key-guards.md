# 2026-10-08 · provider 密钥链守卫（双写原子化 ∥ 缺钥可读 ∥ 宿主拒回执）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-08 · 来源 = 用户 2026-10-08 11:13「都修了吧」= 快车道全链点火；来源 = 同日 gemini provider 诊断（#1062/#1063 新落账 ∥ #1053 首个活实例）。
> 台账 = #1062 · #1063 · #1053（core · 归批）。前情 = docs/batches/2026-10-07-provider-config-parity.md §6（已收口 2026-10-08）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-08
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 点火与范围（2026-10-08 11:13 · 主 agent）

- **点火**：用户 11:13「都修了吧」= 快车道全链（承同日 11:09 gemini provider 诊断——「检查一下」）。
- **合并扫描**：三件同根（provider 密钥链静默失败面）并入一批——#1062（保存双写丢钥）∥ #1063（Gemini 缺钥无守卫）∥ #1053（VSC 密钥保存宿主后置拒 ⇒ 发消息后关——本轮获**首个活实例**）。不并：#1064（桌面 freeze 事故——无复现材料，复核条件在册）。
- **背景实例**（诊断在案）：用户 gemini 条目（`~/.thincoder/config.json`）无 `apiKey`——13 个 provider 唯此一条；机械后果 = `google.mjs:107` 实发 `key=undefined` ⇒ API 必拒。代理链已实测排除（两代理隧道通、直连超时=预期）。
- **范围**：`thincoder-core`（配置写原子性 ∥ provider 传输守卫）∥ `thincoder-vscode`（密钥保存回执链）。桌面同族仅巡检（有面则列）。
- **设计轮** = eng-designer 已派。

### 1.6 用户授权（自动跑 · 2026-10-08 11:38）

**用户原话**：「自动跑」⇒ 本批**设计评审点火权** ∥ **§4 用户批准权（代签）** ∥ **修正/实施轮派发** ∥ **收口核销与提交**——均委托父侧自动执行，直至本批收口。

**父侧自缚三条（本仓惯例·先例同形）**：① 代签仅当三条件齐备（评审 pass 0🔴 ∧ 修正轮已落地并逐条核验 ∧ token 已签发），每次代签在 §4 写明「父侧代签（用户 11:38 授权）+ 依据」；② 新范围 ∥ 用户口径裁决 ⇒ 停下、只摆那一条；③ 破坏性/不可逆 ⇒ 先停。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（三档俱落（PROVIDER ∥ SETTINGS ∥ WEBVIEW-PROTOCOL）· 机检零本批新增 · 修正轮（§3 轮次 1 发现 1–5）逐号落地——§2.10）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目（覆盖）

- **#1062**（core · 归批）：provider 保存双写丢钥 ⇒ **单写原子 + 错误透传**。定案 = `addProviderEntry` 落条与设钥合一（同一 `persistRaw` 回调内 push 后直接置 `entry.apiKey`）；返回 = 单写 `conflictError(r)`；空钥不落键 ∥ F5b 冲突零落盘 ∥ 三消费面（VSC ∥ 桌面 ∥ CLI 流程）返回语义零改。
- **#1063**（core · 归批）：Gemini 缺钥无守卫 ⇒ **可读错误 + 零请求**。定案 = `chatImpl` 单点前置守卫（`resolveProviderSecrets` 后 ∥ 格式分派前；trim 空 ⇒ 抛 `API key missing for provider "…"`）；四 transport 凭据位裸插值由单点关闭；同族巡检表入档（`list-models` `?? ""` ∥ `createProvider` 既有守卫 = 零改面）。
- **#1053**（vsc · 归批）：VSC 密钥行保存宿主后置拒 ⇒ **回执链收正**。定案 = 受理回执消息 `providerKeySaved { name }`（成功径）；拒 ⇒ 零闪（徽标移离发送点）+ 行不关（卡重绘在编守卫）+ 拒因可见（既有 `providerError` banner）；受理 ⇒ 恢复静态行 + 闪。边界 = 添加弹窗径残余重指向（§2.8 知会项）。

### 2.2 设计档落点

| 档 | 落点 | 状态 |
|---|---|---|
| `docs/core/design/PROVIDER.md` | §6.23（`:496-533`）+ 变更记录（`:673`）——#1062 ∥ #1063 | **已落**（2026-10-08 设计轮） |
| `docs/vsc/design/SETTINGS.md` | §2.18（`:578-592`）+ §3 残余条（`:596`）+ §2.16 ① 残余句收正（`:482`）+ 变更记录（`:813`）——#1053 | **已落** |
| `docs/vsc/design/WEBVIEW-PROTOCOL.md` | §3.2 行 25 + 标题计数二十四 ⇒ 二十五项 ∥ §7 D-P11 计数 ∥ §12 对表行 | **未落**——#10 评审冻窗避让；登记文本见 §2.3④，窗口过后照投 |

### 2.3 机制设计（逐件）

① **#1062 保存单写原子**（`thincoder-core/config-io.mjs:257-262` 现行两写）——定形（单写）：

```js
// 现问题：write1 落条（:257-259）→ write2 设钥（:260-261，返回值零检查）
// 定形：同一 mutate 回调内落条 + 置钥（直接改 pushed 引用——不按名重查、无二次读改写窗）
const k = (key || "").trim()
const r = persistRaw((raw) => {
  (raw.providers ??= []).push(entry)
  if (k) entry.apiKey = k
})
return conflictError(r)
```

边界：`entry` = 本地构造引用（presetToEntry ∥ custom 两形——push 与置钥同对象）；`k` 空 ⇒ 不落 `apiKey` 键（沿现行判据）；F5b 冲突 ⇒ 提示串 + **零落盘**（半状态不可达）。

② **#1063 缺钥前置守卫**（`thincoder-core/provider/core.mjs` `chatImpl`——`resolveProviderSecrets`（`:122`）之后）：

```js
const apiKey = typeof provider?.apiKey === "string" ? provider.apiKey.trim() : ""
if (!apiKey) throw new Error(`API key missing for provider "${provider?.name ?? provider?.model ?? "unknown"}" — configure it in Settings (Providers) or ~/.thincoder/config.json`)
```

零请求（先于 rateGate ∥ 全部 fetch）；单点覆盖四 transport + 全链（`chat()` = 单一入口——`:78-84`）；同族结论见 §2.5。

③ **#1053 密钥行回执链**：
- 宿主：`handleSaveProviderKey`（`panel-messages-settings.mjs:29-32`）成功径（`err` 空）⇒ `postMessage({ type:"providerKeySaved", name: msg.name })`；失败径照旧 `postProviderError`（加 `return`——不落回执）。
- webview（`webview/settings-providers.js`）：`_editKey` onSave 去 `flashSaved`（只发消息）；新增导出 `onProviderKeySaved(name)`——同名字行在编（`input[type=password]` 在位）⇒ 恢复静态行（现读 SS——与 onCancel 同形，抽共用助手）+ `flashSaved`；无在编 ⇒ 零动作；`updateProviderStatus` 卡重绘加在编守卫（`#prov-list` 内 password 输入在位 ⇒ 本拍只更新 SS 不重绘）。
- 消费接线（`webview/chat-messages.js`）：新增 `case "providerKeySaved"` → 转 `onProviderKeySaved`（沿 `providerError` 同径）。

④ **WEBVIEW-PROTOCOL.md 登记文本（待投）**：
- §3.2 增行 25：`| 25 | providerKeySaved（**新消息**——host → webview） | { name }——密钥行保存**受理回执**（宿主保存成功径才发；拒径零回执 ⇒ 徽标零闪 ∥ 行不关——拒因走既有 providerError） | panel-messages-settings.mjs handleSaveProviderKey（实施后实读回填） | webview/chat-messages.js case → webview/settings-providers.js onProviderKeySaved（恢复静态行 + flashSaved） |`
- 计数三处同改：§3.2 标题「二十四项 ⇒ **二十五项**」∥ §7 D-P11 计数同拍 ∥ §12 新增行（`| providerKeySaved | …发射点… | …消费位… | 活 | 保存受理回执（#1053——回执语义单源 = doc:SETTINGS.md:§2.18）；§3.2 行 25 |`，②③ 列实施后实读回填）。

### 2.4 受影响文件与测试面

| # | 文件 | 现行 ⇒ 预估 | 改动面 |
|---|---|---|---|
| 1 | `thincoder-core/config-io.mjs` | 282 ⇒ ≈280 | 两写合一（#1062） |
| 2 | `thincoder-core/provider/core.mjs` | 461 ⇒ ≈466 | 缺钥守卫 + 注释（#1063） |
| 3 | `thincoder-vscode/src/extension/panel-messages-settings.mjs` | 239 ⇒ ≈243 | 回执发射 ∥ 错误径 return（#1053） |
| 4 | `thincoder-vscode/webview/settings-providers.js` | 176 ⇒ ≈188 | 去闪 ∥ 卡重绘守卫 ∥ `onProviderKeySaved` + 恢复助手（#1053） |
| 5 | `thincoder-vscode/webview/chat-messages.js` | 268 ⇒ ≈271 | 新 case（#1053） |
| 6 | 设计档三件 | — | §2.2 表（WEBVIEW-PROTOCOL 待投） |
| 7 | 批内件 `docs/batches/2026-10-08-provider-key-guards-core.test.mjs` | 新 | #1062 ∥ #1063 机检腿 |
| 8 | 批内件 `docs/batches/2026-10-08-provider-key-guards-vsc.test.mjs` | 新 | #1053 机检腿（含 SETTINGS.md §2.18 机检面） |

零触面：桌面三档（巡检见 §2.5）∥ `provider/list-models.mjs` ∥ `createProvider` ∥ `settings-provider-dialog.js`（残余条件行）∥ 既有套件 ∥ i18n 词面（零新键）。

**批内件用例面（三件各机检腿）**：
- #1062：T-C1 单写共落——`onConfigSelfWrite` 逐拍快照 ⇒ 数**恰 1** ∧ 该拍盘面同含条目 + `apiKey`（旧实现：write1 快照无钥 ∥ 两拍——红）∥ T-C2 键语义回归（`" sk "` ⇒ 落 trim 值；空 ∥ 全空白 ⇒ 无 `apiKey` 键）。
- #1063：T-G1 四 format 逐档（google ∥ anthropic ∥ openai ∥ responses）无钥 + `globalThis.fetch` 计数桩 ⇒ 拒且含 `API key missing for provider` ∧ fetch 数 **0** ∥ T-G2 全空白钥同判 ∥ T-G3 有钥负控 ⇒ fetch 被调（守卫放行）。
- #1053：T-V1 宿主成功径（sink 恰 `providerStatus` + `providerKeySaved`）∥ T-V2 宿主冲突径（假 config-io 短接——沿 `docs/batches/2026-09-30-vsc-cleanup-695.test.mjs` 先例）⇒ 恰 `providerError{scope:"providers",reason:"mtime-conflict"}` ∧ 零回执 ∥ T-V3 webview 门控（保存动作 ⇒ 零闪；回执 ⇒ 行恢复 + 徽标显）∥ T-V4 在编守卫（状态推送在位 ⇒ 卡不重绘——password 输入与在编值俱在）∥ T-V5 拒径复合（banner 在场 + 行在 + 零闪）。

### 2.5 同族巡检结论

- **#1063 全族逐档**（全文表 = PROVIDER.md §6.23）：`google.mjs:107` ∥ `anthropic.mjs:77` ∥ `responses.mjs:234` ∥ `core.mjs:385` 四档凭据位 = 裸插值（同类缺守卫——缺钥字面 `undefined` 外发）；`list-models.mjs:61/:66/:83` = `?? ""` 归一在位（探针径空钥 ⇒ 准入失败读数 = M8/M9 既有语义，零改）；`createProvider`（`core.mjs:43-46`）= 既有必填守卫（用面 = CLI 脚本 ∥ 探棒，非运行时链）。结论 = 单点守卫（chatImpl）关闭四档；不各档加守卫（避判据增殖）。
- **#1053 桌面巡检**：`provider:setKey` 链**已收正**（renderer `mount-settings-segments-providers.mjs:57-79`——回执非 ok ⇒ 失败面 + 失败草稿回填 ∥ 主面 `providerSetKey` 回读核验「零假成功」`providers.mjs:198-209`）；`providerSave`（`:136-167`）错误串直传 + renderer 成功径关框（`mount-settings-exits.mjs:101-108`）——**无面**。
- **#1062 消费面巡检**：VSC `panel-messages-settings.mjs:72` ∥ 桌面 `providers.mjs:145-154` ∥ CLI 流程面——返回（`null` ∥ 串）语义零改、错误面既有（banner ∥ `{ok,reason}` 失败面）——**无面**。
- 桌面 11:00 freeze 事故（`#1064`）= 批外零涉（复核条件在册）。

### 2.6 验收对照（三链一致）

| 号 | 条目（台账） | 验收判据（机检腿） | 设计回指 |
|---|---|---|---|
| 1 | #1062 保存双写丢钥 ⇒ 单写原子 + 错误透传 | T-C1 ∥ T-C2 | PROVIDER.md §6.23 判据 1 |
| 2 | #1063 缺钥无守卫 ⇒ 可读错误 + 零请求 | T-G1 ∥ T-G2 ∥ T-G3 | PROVIDER.md §6.23 判据 2 |
| 3 | #1053 宿主后置拒无回执可相关 ⇒ 保存回执 | T-V1–T-V5 | SETTINGS.md §2.18 + WEBVIEW-PROTOCOL §3.2 行 25（待投） |

live 实例锚：改后三出口（弹窗加渠径 ∥ 密钥行径 ∥ 桌面径）密钥链失败面俱可达——静默面清零（弹窗径：核错误串经 banner 可见 + #1062 原子化后不再半落）。

### 2.7 关键决策（含被否）

- **KD-PK-1 保存 = 单写原子**（被否：write2 返回值检查——治标留半状态；回滚写——第三写）。详见 PROVIDER.md §6.23。
- **KD-PK-2 缺钥守卫 = chatImpl 单点**（被否：仅修 google ∥ 四档各加）。同上。
- **KD-PK-3 缺钥拒 = 前置校验（零请求）**（被否：`?? ""` + 错误句收正——仍外发一请求）。同上。
- **KD-V1 回执 = 成功单消息 `providerKeySaved`**（被否：`{ok,reason}` 全回执——与 `providerError` 双载同一拒绝、显示冗余；且 #640 机制受扰）。
- **KD-V2 面不关 = webview 卡重绘在编守卫**（被否：宿主拒径不推状态——迟到探针推送（`_retryFailed` flush）仍可清行，非确定解）。

### 2.8 上抛 / 知会

- **[知会] WEBVIEW-PROTOCOL.md 冻结（#10）**：协议登记（§2.3④ 文本）挂起——窗口过后照投。
- **[知会] #1053 处置面判读 = 密钥行**（派单点名落点：`settings.mjs` 密钥保存 handler ∥ `settings-providers.js` 保存/关闭径）；添加弹窗径宿主拒残余**未并入本批**（SETTINGS.md §2.16 ① 收窄 + §3 条件行登记）——如需并入另裁（+1 对位回执 + `paSave` 关径门控）。

### 2.9 追记（2026-10-08 · 设计轮收尾）

- **WEBVIEW-PROTOCOL.md 已解冻（#10 终）⇒ 登记落盘**：§3.2 行 25（`:120`——`providerKeySaved` 新消息）+ 标题计数（`:86` 二十四 ⇒ 二十五项）∥ 纪律行「行 1–25」（`:122`）∥ §7 D-P11（`:349`）∥ 变更记录（`:756`）。§2.2 表该行「未落」状态由本追记取代。**§12 对表行 = 实施轮补**（两表只收实测在位行——档内既定口径）。
- **机检复核（`scripts/doc-check.mjs`，2026-10-08 设计轮）**：本批三档新增内容——**悬空锚 0 ∥ 超宽行 0**（6 处悬空已成当场修：重名歧义短路径（`provider/core.mjs` ∥ `src/extension/settings.mjs` ∥ `src/main/providers.mjs` 等）改全路径；5 处超宽行折行）。档级存量（PROVIDER `:291`/`:337` ∥ SETTINGS `:327`/`:479-482`/`:496`/`:504-513`/`:555`/`:625` 等）= 在册存量，非本批引入（复核后全仓超宽计数 44 ⇒ 39、悬空 48 ⇒ 42——净减 = 本批修复数）。
- **并发落盘观察**：`docs/vsc/design/SETTINGS.md` 于本批编辑窗口内获并行批写入 **§2.19**（会诊行 ✕ 容器级委托——台账 #1058）；编号 2.18 ∥ 2.19 顺位无冲突；其 §2.19 来源行（`:600`，495 字符）越宽在册——**非本批面**（列报）。
- **#1053 处置面判读（知会）**：派单点名落点 = 密钥行（`settings.mjs` 密钥保存 handler ∥ `settings-providers.js` 保存/关闭径）——本批按密钥行收正；添加弹窗径宿主拒残余**未并入**（SETTINGS.md §2.16 ① 收窄 + §3 条件行登记）；如需并入另裁（+1 对位回执 + `paSave` 关径门控）。

- **坐标收正（折行 ∥ 并发插入后按现盘重锚）**：§2.2 表两行读数终值——`PROVIDER.md` §6.23 `:496-537` ∥ 变更记录 `:676`；`SETTINGS.md` §2.18 `:578-597` ∥ §3 残余条 `:604-605` ∥ §2.16 ① `:482`（零动）∥ 变更记录 `:823`；`WEBVIEW-PROTOCOL.md` §3.2 行 25 `:120` ∥ 标题 `:86` ∥ 纪律行 `:122` ∥ §7 D-P11 `:349` ∥ 变更记录 `:756`。

### 2.10 修正轮（评审轮 1 · 发现 1–5 逐号落地 · 2026-10-08）

**口径**：父侧逐条裁定——1–5 受理 ∥ 6 = 范围声明零动作；本轮点修（零新语义 ∥ 产品码零触 ∥ 批外档零触 ∥ `WEBVIEW-PROTOCOL.md` 零碰〔#22 复评冻窗〕）；§1 ∥ §3–§6 零动。

**逐号落盘（号 → 落点 file:line）**：

- **#1**（🟡）→ `docs/core/design/PROVIDER.md` §5 落点指针块：**本批行** `:70` + 同族两缺项随拍补录（responses-robustness `:67` ∥ provider-config-parity `:68`）。
- **#2**（🟡）→ `docs/core/design/PROVIDER.md:534`（§6.23 断言 ④——#1062 冲突支；§2.4 #1062 腿组随补一支 ∥ §2.6 表行 1 判据列以本块追补）——核级真径注入：`registerHooks` 假 `node:fs` 视图（唯 `config-io.mjs` 的 `statSync`——目标路径二阶读抬升 mtime）⇒ 真「写前重 stat ≠ t0」分支；断言 = 返回串（非 null）∧ `onConfigSelfWrite` 快照 **0** ∧ 盘面逐字节不变。**技法探证（2026-10-08 · node v24.21.0 实跑）**：armed ⇒ 返回 `CONFIG_CONFLICT_HINT` ∥ 快照 **0** ∥ 盘面逐字节不变 ∥ `.bak` 现场 1；disarm 负控 ⇒ 正常落盘（现实现双写 = 快照 2——修后单写应恰 1）。
- **#3**（🟡）→ `docs/core/design/PROVIDER.md:524`（§6.23 判据 1 追句）——persistRaw 失败契约实读定形：非 ok reason 唯一 `mtime-conflict`（`config-io.mjs:79`）∥ 余失败走异常通道（`:70` 不可解析 ∥ `:64`/`:81`/`:83` 抛出）⇒「错误透传」限缩 = **冲突 + 异常两通道**（`conflictError(r) === null` 即 `r.ok === true`）。
- **#4**（🔵）→ `docs/vsc/design/SETTINGS.md:705`（§5 +**U-S19**——密钥行保存回执契约）。
- **#5**（🔵）→ `docs/core/design/PROVIDER.md:544`（§6.23 边界后认账句）——无钥渠道不可运行 = 设计态（已认账行为变更，非缺陷）；「此前可实际可用」实读核 = 无守卫不拦（请求实发 ∥ 凭据字面 `undefined`；忽略鉴权头的端点类此前可通——对端应答与否取决于对端，仓内不可验）。
- **#6**（🔵）→ 零动作（评审自记——范围声明项）。

**变更行（同拍）**：`docs/core/design/PROVIDER.md:687-689` ∥ `docs/vsc/design/SETTINGS.md:829`。

**坐标漂移随记（本轮编辑所致）**：`PROVIDER.md` 全档 +7——§6.23 现 `:500-544` ∥ 本批设计行 `:684` ∥ fix 行 `:687-689`；`SETTINGS.md` +1——本批设计行 `:824` ∥ fix 行 `:829`（§2.2 ∥ §2.9 所载 = as-of 设计轮读数）。

**产品码零触（fix 轮）**。明细 = §3 轮次 1 ∥ 本块。

**追记（§2.10 同轮 · 行宽收正 · 2026-10-08）**：`docs/core/design/PROVIDER.md:524`（334 字符——机检 FAIL 单点）按本批折行口径收正（折后 `:524-525` = 236 ∥ 98 字符，实读）⇒ 该行以下坐标 +1：判据 1 追句 `:524-525` ∥ 断言 ④ `:535` ∥ 认账 `:545` ∥ §6.23 现 `:500-545` ∥ fix 变更行 `:688-690`（前块读数各 +1）。**零语义改（折行）**。

**追记注（读数口径 · 同日）**：前块「全档 +7 ∥ +1」= 首批插入位移基准；另计折行（+1）∥ 变更行（PROVIDER +3 ∥ SETTINGS +1）⇒ 全档净增 **PROVIDER +11 ∥ SETTINGS +2**；各点终坐标以前条追记为准。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

| # | 类别 | 严重度 | 发现 | 建议 |
|---|---|---|---|---|
| 1 | 文档一致性 | 🟡 | PROVIDER.md §5「落点指针」块（:60-67）未登记本批行——块头为「**2026-10-0x 批次落点指针**（本档涉批——落点表 = 各批档 §2 · 一次性材料承载面）：」，而本批实改本档（新增 §6.23；变更记录 :677）；同日先例 = proxy 批补录「落点指针块 + 本批行（记录面补录——评审发现 4）」（:679）；同族缺口另见 2026-10-04-responses-robustness ∥ 2026-10-07-provider-config-parity 两批未列。 | §5 补一行：「本批（provider 密钥链守卫 · 2026-10-08）落点表 = `docs/batches/2026-10-08-provider-key-guards.md` §2（唯一承载面——一次性批次材料）。」；同族两缺项可随拍 sweep。 |
| 2 | 验收标准 | 🟡 | #1062 可机检断言（PROVIDER.md:527-529）只盖成功径原子共落（「快照数**恰 1** ∧ 该拍盘面**同时**含条目与 `apiKey`」）∥ 键语义回归 ∥ 守卫零请求——F5b 冲突/零落盘分支（判据句「F5b 冲突 ⇒ 返回提示串且**零落盘**」= #1062「半状态不可达」主张的失败支，:520）无断言；与 §2.18 ① 已载冲突注入腿（SETTINGS.md:595）不对称。 | 补一条冲突注入断言：注入 mtime 冲突 ⇒ 返回串（非 null）∧ `onConfigSelfWrite` 快照数 0 ∧ 盘面逐字节不变（条目 ∥ 钥俱不落）。 |
| 3 | 清晰度/完备 | 🟡 | 「错误透传」（#1062 判据题）的返回定形 = 「返回值 = 该单写的 `conflictError(r)`」（PROVIDER.md:520），而 SETTINGS.md:459 载「核 `conflictError` 的唯一非空返回」= CONFIG_CONFLICT_HINT（mtime 冲突专形）；设计自列失败面「write2 失败（F5b mtime 冲突 ∥ 盘错）」（:503）若非异常而经 reason 返回 ⇒ `conflictError(r)` 落 null ⇒ 调用面仍收「成功回执」（= #1062 所修同形）；该支归宿未定形。 | 明写 persistRaw 失败契约（异常 ∥ reason 两通道）与非冲突 reason 的映射（透传 ∥ 抛）；或显式限缩「错误透传 = 冲突 + 异常两通道」。 |
| 4 | 方法论/一致性 | 🔵 | §2.18 交互契约（拒 ⇒ 零闪/行不关/拒因可见；受理 ⇒ 闪 + 行关）未入 SETTINGS §5 U-S 表（同族先例：§2.8/§2.9 ⇒ U-S8–U-S10；§2.13/§2.14/§2.16/§2.17 ⇒ U-S12–U-S18）。 | §5 补一条 U-S 行（或明示该类决策归批档、不入本表）。 |
| 5 | 边界/边缘 | 🔵 | #1063 守卫把「apiKey trim 空 ⇒ 拒 + 零请求」落成四 transport 全链硬约束（含 `findProvider` 直调面——PROVIDER.md:515 ∥ 守卫句 :522-523）——keyless（无鉴权）端点亦被同一守卫关闭；档内立场（§6.22「**持 key**」判据 = `providers[].apiKey` trim 后非空 :454 ∥ `createProvider`「`apiKey` 必填守卫在位」:513）已按「空钥 = 不可用渠道」行事 ⇒ 方向一致，但该行为变更未在 §6.23 边界显式认账（对照 §6.22 对 ACP 的「已认账行为变更，非缺陷」写法 :482）。「keyless 端点此前可实际可用」= unverified。 | 边界补一句：无钥渠道不可运行 = 设计态；或如 keyless 端点属预期场景 ⇒ 明写配置指引。 |
| 6 | 评审范围限制 | 🔵 | 未见项目标准档 / 文档地图 ⇒ 方法论与文档归属按档内既定形制 + AGENTS.md 判；受影响文件行数/增量标注（第 8 项）在本三档内无载体（按分层纪律住批档 §2，出本评审范围）——`thincoder-core/config-io.mjs` / `thincoder-core/provider/core.mjs` / `webview/settings-providers.js` 等被改文件的现行行数与 delta 无法在范围内核。 | 受影响文件行数/增量以批档 §2 受影响文件表为准（本范围外）；三档内无需改。 |

VERDICT: pass

计数：🔴 0 ∥ 🟡 3 ∥ 🔵 3（发现 6 条）

## §4 用户批准（主 agent）

### 4.1 父侧代签（用户 2026-10-08 11:38 授权「自动跑」✓）

**三条件齐备** ✓：① **设计评审 pass** ✓（§3 轮次 1 · 🔴 0 · 🟡 3 ∥ 🔵 3——六条逐号核讫）；② **修正轮已落地并逐条核验** ✓（§2.10 + 父侧实读：`:70` 本批行 + 同族补录 `:67`/`:68` ∥ `:524-525` 失败契约定形〔非 ok reason 唯一 `mtime-conflict`；余走异常——「错误透传」= 冲突 + 异常两通道〕∥ `:535` 断言 ④ 冲突支〔注入法**实跑探证**：armed ⇒ 快照 0 ∥ 盘面逐字节不变 ∥ `.bak` 1；负控正常落盘〕∥ vsc `SETTINGS.md:705` U-S19 ∥ `:545` keyless 认账句；变更行 `:688-690` ∥ `:829`）；③ **token 已签发** ✓。**代签依据 = §3 轮次 1「VERDICT: pass」+ 计数（🟡 3 ∥ 🔵 3）**。

**实施面预告**：产品档 + 批内件两件（清单 = §2.4 受影响文件表 `:76-88`）；`WEBVIEW-PROTOCOL.md` §12 对表行 = 实施后回填（父侧）。

## §5 实施记录（eng-coder）

**状态行**：实施完成（5 产品档 ∥ 2 批内件 · 核 15/15 ∥ VSC 6/6 · 偏差审计 clean · 代码评审轮 1–3 pass · 终态 clean · 2026-10-08）

### 5.1 交付摘要（逐笔落点）

- **#1062 保存双写丢钥 → 单写原子**：`thincoder-core/config-io.mjs:257-264`——落条与置钥合为同一次 `persistRaw`（回调内 push 后对 entry 引用置 `apiKey`，非空才置）；返回该单写的 `conflictError(r)`；非 ok reason 唯一 `mtime-conflict`，余走异常通道（不捕，沿设计）。
- **#1063 缺钥守卫 → chatImpl 前置单点**：`thincoder-core/provider/core.mjs:122-127`——`resolveProviderSecrets` 后、格式分派前；trim 空（含非 string）⇒ 抛 `API key missing for provider "<name>" …`（前缀锁定，尾句 = 配置指路）；**零请求**（先于 rateGate ∥ 全部 fetch）；四 transport 不各自加守卫。
- **#1053 VSC 密钥行拒径**：宿主 `thincoder-vscode/src/extension/panel-messages-settings.mjs:28-38`——成功径发 `providerKeySaved{name}`；拒径 `providerError` + `return`（零回执）；webview `webview/settings-providers.js`——`_editKey` 保存点去闪（`:31-37`）∥ 抽共用 `restoreKeyRow`（`:13-26`）∥ 新导出 `onProviderKeySaved`（`:95-102`，在编才恢复 + 闪）∥ `updateProviderStatus` 在编守卫（`:190`）；接线 `webview/chat-messages.js:36,160`（导入 + case 转发）。
- 批内件两件（随批归档 · 不入仓套件 · 手动 `node --test` 可复跑）：`2026-10-08-provider-key-guards-core.test.mjs` ∥ `-vsc.test.mjs`。

### 5.2 先红后绿读数（逐件实跑）

- 核舱：修前 **6 pass / 9 fail**（T-C1 单写红——快照实读 2 ∥ T-G1×4 ∥ T-G2×4 守卫缺失红）⇒ 修后 **15/15 pass**。
- VSC 舱：修前 **1 pass / 5 fail**（T-V1 回执缺 ∥ T-V3 ∥ T-V4 ∥ T-V5 ∥ T-V5b 红）⇒ 修后 **6/6 pass**。
- 否定演练（评审采纳后）：临时废守卫 ⇒ **T-V4 :342 ∥ T-V5 :369 双红**（判别力实证）⇒ 守卫逐字还原 ⇒ 6/6 绿（演练残迹 0 命中）。
- 行数实读（≤500 硬限）：config-io **283** ∥ provider/core **465** ∥ panel-messages-settings **244** ∥ settings-providers **192** ∥ chat-messages **271**；全档 ≤500；provider/core 越 300 咨询线 = 存量（批前 461）。
- 零触面实读（只读核）：桌面档 ∥ `settings-provider-dialog.js` ∥ `list-models.mjs` ∥ `createProvider` ∥ locales ∥ 既有套件零碰；临时探针 `pk-guards-probe.mjs` 用后已删（零残留）。

### 5.3 决策透明表

| # | 决定 | 依据 / 说明 |
|---|------|-------------|
| 1 | 逐点按设计定形落码，零自创语义 | 设计单源 `PROVIDER.md` §6.23 ∥ `SETTINGS.md` §2.18；错误文案 / 消息名 / 载荷逐字锁定 |
| 2 | 异常通道不捕 | 设计「错误透传 = 冲突 + 异常两通道」——catch 面零加 |
| 3 | T-V4/T-V5 重绘判据统一身份式 | 代码评审轮 1 发现 6 + 轮 2 残留采纳；真 DOM 同效（重绘 ⇒ 同 id 为新节点） |
| 4 | 空钥 false-ack 潜径不改码 | 设计只锁定「err 空 ⇒ 发回执」；语义扩展需验收方裁定（见 5.6 上抛） |
| 5 | 不跑仓套件 | 父侧收口为唯一跑点；本腿只跑两批内件 |

### 5.4 内部偏差审计与代码评审（轮次 ∥ 终态）

- **偏差审计（explore，只读）**：clean——四类偏差（未落 / 缩水 / 自创 / 越出文件表）零；八点核验（#1062 ∥ #1063 ∥ #1053 宿主 ∥ #1053 webview ∥ 接线 ∥ 批内件面 ∥ 越界面 ∥ 设计档零触）全过。
- **代码评审轮 1（全量）**：pass——🔴0 ∥ 🟡3 ∥ 🔵4；引证机核 6/6。
- **代码评审轮 2（修复验证）**：pass——发现 6 修复两腿（判据身份式 ∥ 档头注记）核实；另报同类残留 🔵（T-V5 子判据判别力）→ 采纳。
- **代码评审轮 3（末次修复验证）**：pass——`:342/:348/:369` 身份式齐备 + 否定演练还原保真（`:190` 在位、残迹 0、调用点唯一）核实。
- **终态：clean**（无未决 🔴；🟡/🔵 类 = 登记 / 采纳，见 5.6）。

### 5.5 fix round（共 2 轮 · 产品码零改动）

- **R1**：T-V4 判据改身份式（`:342` ∥ `:348`）+ 台面重绘模型档头注记（`:19-20`）。
- **R2**：T-V5 `:369` 统一身份式 + 否定演练（废守卫双红 → 逐字还原 → 绿）。

### 5.6 上抛 / 登记（交父侧）

- **[上抛·待裁] 空钥空转仍发受理回执（潜径）**：`presets.mjs:46` 空 / 全空白钥早退（零写盘、零错误）⇒ `panel-messages-settings.mjs:37` 仍发回执（行恢复 + 闪「已保存」）。UI 侧不可达（`settings-widgets.js` doSave trim 后转 onCancel），非回归；契约由发送方而非宿主保证。两案：①宿主区分「无写」与「写成功」，仅真写才发回执（推荐）；②`SETTINGS.md` §2.18 / §3 登记「空钥不上行 = 发送方前置判据」为边界。
- **登记（结构性）**：`provider/core.mjs` 465 行越 300 咨询线（存量债）；vsc 批内件 380 行越建议线（沿 412 行先例，不拆）。
- **另笔（父侧）**：`WEBVIEW-PROTOCOL.md` §12 对表行 + 三档「实施后实读回填」；§2.4 行数预估列按实读收正（±5 行内）。
- 备注：designId 具体值未在本腿消息面回显（任务书声称已签发）——未验证项，如实登记。

## §6 验证与收口（父代理）

### 6.1 收口结算（2026-10-08 · 主 agent）

**实施核讫**：产品 5 档 + 批内件 2 件全落（§5）；**父侧复跑两件同跑 = tests 21 · pass 21 · fail 0**；抽核 3/3 在位（`config-io.mjs:257-264` 单写原子 ∥ `provider/core.mjs:122-127` 前置守卫 ∥ `panel-messages-settings.mjs:31-38` 回执链）。
**as-built 行数（§2.4 Δ 列以本行为准）**：283 ∥ 465 ∥ 244 ∥ 192 ∥ 271（`provider/core.mjs` 465 越 300 咨询线 = 存量债在册）。
**实施后回填面核**：`WEBVIEW-PROTOCOL.md` 落讫——§12 补 `providerKeySaved` 行（②`:37` ∥ ③`:160`）∥ §3.2 行 25 两格实读回填 ∥ 变更行 `:760`（父侧直接执行〔机械登记〕· 可 revert）；`PROVIDER.md` ∥ `SETTINGS.md` 两档设计轮即终值（无实现后占位——grep 实核）✓。
**上抛处置**：① 空钥早退仍发受理回执（潜径 · 非回归）——现姿势 = 发送方前置判据为边界（UI 不可达）；①案（宿主区分「无写 / 写成功」）入册 = **台账 #1073**（归批）。② 结构登记两条（`provider/core.mjs` 465 存量债 ∥ vsc 批内件 380 沿先例不拆）——在册。
**台账**：#1062 ∥ #1063 ∥ #1053 → **已核销**（证据 = 落点坐标 + 复核读数）。
**结算同步清单**：角色表 ✓ ∥ 状态行 ✓ ∥ 计数 ✓（本块）∥ 指针 ✓（§2 表重锚 + 追记）∥ 变更记录 ✓（三档）∥ 待办勾销 ✓ ∥ 前批遗留交叉核 = 无 ∥ 台账可见面 = 结算行随报（本会话）。
**暂缓批复核：无**。
**收口**：记录冻结（回改禁止 · 只读）；批终。
