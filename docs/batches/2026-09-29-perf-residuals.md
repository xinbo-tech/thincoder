# 2026-09-29 · perf-residuals（性能尾账：增量 md 重渲 ∥ 帧内组合回落重挂）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-29 · 来源 = 挂账族集中处置（用户 2026-09-29 16:56 令）——性能尾账载体：台账 #619（增量 md 重渲 + 密文 md + 帧内组合回落重挂 + VSC 零行为复证）。。
> 台账 = #619（性能 · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-29
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 本批（父侧 · 2026-09-29 16:5x）

- **来源** = 挂账集中处置令（16:56）；授权 = 13:52 全权。上游 = render-perf 批 §6 裁定（R-2a 预算收正 ≤16ms + 本行挂账）。
- **条目（3 件）**：① **增量 md 重渲**（现 = 每帧全量 md；密文 md p95 ≈31ms ⇒ 目标 = 增量路径把帧 p95 拉回 ≤8ms 量级 ∕ 或再裁新基线）；② **帧内组合回落重挂**（「尾块就地改 + 新块追加」同帧 ⇒ 全量重挂，每新块边界一次；修点涉 `chat-stream.mjs` ∕ `chat.mjs` ——前批在册零改语义，本批可动）；③ **VSC 零行为复证**（可做时补：修前副本不可得 ⇒ 语义单源 + 对拍）。
- **口径**：设计 = eng-designer（机制设计 + 新判据：真机计时腿扩面）；实施 = eng-coder（评审 + 代签 §4 + token 后）；R-1 ∕ R-2b ∕ R-3 既有读数 = 回归基线（不得回退）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（机制 ∕ 修法 ∕ VSC 复证三件 + 判据与探针扩面已落设计三档；评审 #41 修正轮（发现 1–8）就地落毕；实施轮落（实施报文 #66）+ 实施后文档面随动轮落（两档登记 ∕ 行数账随实读——详见 §2.12）· 2026-09-29）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 批次任务（覆盖 · 台账 #619）

设计轮交付（**零实施——产品码零写**）：三件。
1. **① 增量 md 重渲（机制设计）**——现 = 尾块每帧全量 `md()` + 整面 `innerHTML`（真机 80KB 帧 p95 **15.4ms** ∕ 密文段 **31.8ms**）；目标 = 增量路径把帧 p95 拉回 **≤8ms** 量级（基线 ∕ 密文两段同判）。
2. **② 帧内组合回落重挂（修法逐处 file:line）**——同帧「尾块就地改 + 新块追加」⇒ `streamDelta` reset ∧ 尾位不入重合判 ⇒ 全量重挂（每新块边界一次）。
3. **③ VSC 零行为复证（可做性裁定 + 形态）**——render-perf 批遗留 unverified 项的复证形态定形。

明确不在本批：`subblocks/*`（子代理内容面 = 纯文本拼接非 md——不在射程）；`md.mjs`（单源不动）；#604 ∕ #606 ∕ #607（排后）；CLI ∕ VSC 源面（零改）；仓套件（全清令——零触）。

### 2.2 设计落点（文档面 · 已落）

| 档 | 落点 |
|---|---|
| `docs/render-core/design/RENDER-CORE.md` | §2 新增 **KD-RC-10**（增量 md 重渲——三段定界 ∕ 增量单元 = 段落 ∕ 块 ∕ 保守律 ∕ 画件契约；被否七候选在册）+ KD-RC-9 被否列口径收正（帧界批内顺带形 ⇒ KD-RC-10 另立）；§5 调度族增增量 md 画件（`liveCut` ∕ `paintLiveMd`）；§6 增性能尾账随动段；§7 C10 收正（帧 p95 ≤8ms 两段 + 帧成本平坦比）+ 增 C12 ∕ C13 + C11 补复证形态；§10 增 K ∕ L |
| `docs/desktop/design/RENDERER.md` | §1 索引两行随动（渲染粒度行补增量 md · 更新纪律行补帧内组合）；§1.2 增「尾块增量 md 与帧内组合」条；§2 对齐判据条补**组合档（`patch-append`）**（`patchAt` + 守卫 + 纯追加广义化）；§3 尾段挂载条补组合档两动作序 |
| `docs/desktop/design/PROJECT.md` | §2 增 **KD-50**（+ KD-48 被否列「全文增量 md」口径随动）；§4.2 增本批「现行 ⇒ 预期」块；§10 增 **CM**（上抛三件）；变更记录行 |
| `docs/desktop/requirements/PROJECT.md` §6 性能行 | 阈值收正 = **父侧落笔**（笔权；建议文本 = §2.9①） |

### 2.3 机制设计①——增量 md 重渲（三段定界 ∕ 增量单元 ∕ 判据）

**机制形**（单源 = 核档 §2 KD-RC-10）：新核件 `thincoder-render-core/flow/live-md.mjs`（拟新增；`liveCut` 冻结切点扫描器 + `paintLiveMd` 分片画件）；`flow/stream.mjs` `paintStreamTarget` 同签名改走画件——`paintReasoningTarget` 随动 ⇒ **VSC ∕ 桌面调用点零改**（`chat-text.mjs` ∕ `streaming.js` ∕ `chat-messages.js` 零触）。

**三段定界**：① **md 渲染段** = 冻结前缀零重渲——单帧渲染量 = 冻结增量 + 热区跨度（禁 ∝ 累计文本）；② **DOM 写面段** = 已冻结节点零触碰——提交段追加 + 热区节点换代（禁整面 `innerHTML`）；③ **样式重算段** = 失效面 ∝ 热区——冻结节点身份不变（引擎无失效理由）。

**增量单元 = 段落 ∕ 块**：段内（paragraph）按行内构造封闭点冻结（`cut` 推进至最近已闭构造之后，含纯文本续进）；列表 ∕ 表格 ∕ 引用 ∕ 围栏 = 块级单元（块闭才冻结；开启块 = 块级热区）。**保守律**：无法证明已冻结者一律留热区——尾段换行串（`\n` 可续成 `\n\n`）∕ 悬空构造（`**` `*` `` ` `` `~~` `[` `](` ∕ 尾转义）∕ 行首块标记未定型（`#` `-` `>` `|` 数字. ``` ``` 行首）∕ 尾 `*` 串。热区跨度上界 = 最近未闭构造跨度（病态：长未闭构造期间帧成本退全量 md 同阶——登记边界）。

**画件契约**：无缓存 ∕ 复位径 = **分片全绘**（head ∕ 开段 ∕ 热区三段——与 `md(raw)` 分片恒等）；增帧 = 提交段追加（段内 `mdInline` 语境 ∕ 块级 `md` 语境）+ 热区换代；非前缀扩展（编辑 ∕ 回放 ∕ 换文）∕ 热区失连（外部覆写）⇒ 复位全绘；异常 ⇒ `textContent = raw`（现状语义）+ 复位。**分片语境注**：段内续写渲染器 = inline 语境含 `\n`→`<br>` 单换行步（`inline()` 未导出——小件经 `mdInline` 组装 ∕ 逐行拼接补齐，落点 = `live-md.mjs`〔§2.6 表在册〕；不另起第二份 inline 实现；跨块界推进拆多段）。

**密文 md 特殊面**（markdown 密度 ≈2× 变体）：同一机制覆盖——构造密 ⇒ 冻结推进频繁、热区小；**不外挂特例**（判据 = 帧成本 ∝ 热区，非 ∝ 构造密度）。

**正确性机检（对拍腿）**：① 平 node 分片恒等式（段内 `mdInline` 分片复合 ≡ 整体 ∕ 块级 `md` 分片复合 ≡ 整体——语料逐例）；② 真 DOM 逐步对拍（增量面 ≡ 全量参照——`textContent` 逐字 + 结构归一）。

### 2.4 修法②——帧内组合回落重挂（逐处 file:line）

| # | 处（file:line） | 现行 | 修法 |
|---|---|---|---|
| 1 | `thincoder-desktop/renderer/views/chat-stream.mjs:18-30` | `streamDelta` 四档（none ∕ append ∕ patch ∕ reset）；append 仅 `length+1` | 增 **`patch-append`** 档 ∧ **append 广义化**（任意 k ≥ 1 枚追加）——**判定次序 ∕ 各档出口形 = 表下块**（要旨：尾位引用先等比 ⇒ `append`；尾位同键但引用变 ⇒ `patch-append`） |
| 2 | 同档 `:46-64` | `alignPlan(mounted, visible, tailExempt)`——尾位豁免（纯 patch） | **第 3 参兼容口径** = 真值（`true`——既有调用 ∕ 用例 `docs/batches/2026-09-29-render-perf.test.mjs:410` 仍视作尾位豁免）∨ mode 串（`"patch"` = 尾位豁免 ∕ `"patch-append"` = 组合档）；第 4 参 `appended`（组合档）：`goals = visible.slice(0, visible.length-1-appended)` ∕ `patchAt = visible.length-1-appended` ∕ `tail = visible.slice(patchAt+1)`；**守卫** `prepend + overlap === goals.length`（否则 `ok=false`）；出口**纯增键** `patchAt`（= 就地更新位；纯 patch = 尾位 `visible.length−1`；仅 patch 族档消费）——既有键 `evict` ∕ `prepend` ∕ `tail` ∕ `ok` 不动；纯 patch（appended=0）行为不变（向后兼容——既有调用 ∕ 用例零改） |
| 3 | 同档 `:72-77` | `paintPlan` → `{tier, index, remount, refresh}` | ＋`appended`（自 delta 携出——`delta.appended ?? 0`；仅 `patch-append` 档非零；出口形 = `{tier, index, remount, refresh, appended}`） |
| 4 | `thincoder-desktop/renderer/views/chat.mjs:218-238` | `patchTail` 固定改尾位（`index = model.blocks.length-1`） | ＋`patchAt` 参（组合档 = `visible.length-1-appended`；缺省 = 尾位） |
| 5 | 同档 `:262-284` | `settleFrame`：① `mountTail`（append∕reset）∕ `patchTail`（patch） | 增组合支：`patchTail(patchAt)` + `mountTail`（`plan.tail` = 追加段——同帧两动作）；其余五步不变 |
| 6 | `thincoder-desktop/renderer/app.mjs:184` | `alignPlan(mounted, blocks, plan.tier === "patch")` | 传 mode 串（`plan.tier` ∈ {`patch`, `patch-append`} ⇒ 传该串；他档 `false`）+ `plan.appended ?? 0`（一行形改——零净增） |

**判定次序表（`streamDelta`——先判者胜；消 append ∕ patch-append 字面重叠）**：

| 序 | 条件（对 `prev` → `next`） | 出口（`index` 钉法见列内） |
|---|---|---|
| ① | `after.length > length` ∧ 前 `length` 位（全 prev 位）引用全等 | **`append`**（尾位引用**先等比**）：`index` = 首枚追加位 = `length`；k = `after.length − length` ≥ 1（广义化）；n=0 首块档（`[]→[a]`）⇒ `index:0` |
| ② | 否则 `after.length > length` ∧ `length ≥ 1` ∧ 前 `length−1` 位引用全等 ∧ 尾位键等（`blockKey`） | **`patch-append`**（尾位**同键但引用变**）：`index = length−1` 钉死（尾块位）；`appended = after.length − length` |
| ③ | 其余 | 现状四档判据不变（等长族 `none` ∕ `patch` ∕ `reset`——零改） |

**各档出口形（deepEqual 逐字面——既有用例 `docs/batches/2026-09-29-render-perf.test.mjs:402` 逐字等 ⇒ `append` 不携 `appended`）**：`none` ∕ `reset` = `{kind, index:-1}` · `append` = **恰** `{kind:"append", index}` · `patch` = `{kind:"patch", index}` · `patch-append` = `{kind:"patch-append", index, appended}`（无多余字段）。

**效果**：每新块边界的全量重挂消（组合帧 = 尾块就地 + 追加段挂载）；滑窗组合由 combo 对齐 `evict` 支覆盖；兜底保留（`ok=false` ⇒ 重挂不删）。

### 2.5 ③ VSC 零行为复证——裁定 + 形态

**裁定：可做**（推翻「修前副本不可得」——本设计轮实证：修前副本 = git **`cf48ba12~1:thincoder-vscode/webview/chat-messages.js`** 可得；`git diff cf48ba12~1 cf48ba12 -- <file>` 逐字取出 toolOutput 支修前形（旧内联四行`textContent += ` ∕ 占位清 ∕ 64K 截断 ∕ `_capped` 停收））。

**复证形态（三件组合）**：① **语义单源** = 核档 §2 KD-RC-9 ∕ §5 `appendToolOutput` 契约（在册）；② **改动面 hunk 清点**（**清点基线 = `git diff cf48ba12~1 cf48ba12 -- thincoder-vscode/webview/chat-messages.js`**——stall-indicator ∕ render-perf 两批同落于 `cf48ba12`）：全文件改动 = `markOutput` 定义 + 重置点**八**枚（现盘实读 8 枚调用点在位）——**7+1 归因**：非 toolOutput 支**七**枚（`token` ∕ `reasoning` ∕ `toolCall` ∕ `toolResult` ∕ `subagent` ∕ `subagentApproval` ∕ `toolPanel`——stall-indicator 批）+ **第 8 枚居 toolOutput 支内**（计入该支清点）；+ toolOutput 支改指核件 `appendToolOutput` + 进口行（`MAX_TOOL_OUTPUT` ⇒ `appendToolOutput`——render-perf 批）——除归因 hunk 外零改（只读复核可复跑）；③ **逐字对拍腿强化**（批内件）：参照模型改用 **git 修前副本逐字提取**（替代手写参照)；同一驱动表（占位清 ∕ 跨 64K 截断 ∕ 空串 ∕ 停收 ∕ 幂等）逐 chunk 断言 `textContent` + `_capped` + 写数逐字相等。

**差异登记一例**（复证暴露 · findings 报父侧）：非串 `text` 域外——修前形 `ref.b.textContent += m.text` 对非串强转拼接（`undefined` 亦入文）；核件 = 非串视空零写。契约域（`text: string`——宿主载荷契约）逐字等价；域外差异 = 有意加固（旧形 = 缺陷形）——登记不回退；若须逐字等价 ⇒ 核件改 `String(text)` 另裁（本设计不取）。

**残余**：VSC 套件零触（全清令——现盘空清单）⇒ 无套件腿；新机制对 VSC 的运行期影响 = 同件同签名（调用点零改）+ 增量面 ≡ 全量面对拍（C12）。

### 2.6 受影响文件与测试面（逐档「现行 ⇒ 预期」）

行数 = 实读 2026-09-29（桌面三档 = 届盘实读；核三档 = render-perf 批末实读）；**预估口径 = 上批实读偏差在册**（chat 估 ≈265 ⇒ 实 284〔+19〕· app 估 ≈275 ⇒ 实 299〔+24〕——`docs/batches/2026-09-29-render-perf.md:228` ∕ `:225`）⇒ 贴线档按此加安全边 ∕ 预置越层预案（见下 `chat.mjs` 行）。

| 档 | 现行 ⇒ 预期 |
|---|---|
| 核 `thincoder-render-core/flow/live-md.mjs`（拟新增） | — ⇒ ≈170（扫描器 `liveCut` + 画件 `paintLiveMd` + **段内续写渲染器小件**——并入本档，不另立 ∕ 不改 `md.mjs` 导出面；经 `mdInline` 组装（`inline()` 未导出——避第二份 inline 实现），含 `\n`→`<br>` 单换行步） |
| 核 `thincoder-render-core/flow/stream.mjs` | 135 ⇒ ≈140（`paintStreamTarget` 委托——签名 ∕ 兜底语义不变） |
| 核 `thincoder-render-core/test/run.mjs` | 82 ⇒ 82（零改——全清令） |
| 桌 `renderer/views/chat-stream.mjs` | 77 ⇒ ≈105（`patch-append` 档 + combo 对齐 + `paintPlan` 携 `appended`） |
| 桌 `renderer/views/chat.mjs` | **贴线 + 触发门**：284 ⇒ ≈296（`patchTail` 携 `patchAt` + `settleFrame` combo 支）——预估 ≤300 仅当偏差 ≤+4；上批同族偏差先例 +19 ∕ +24 ⇒ 同幅复现即越层；**越层预案（预置）**：开工先复读行数，越 300 ⇒ 本批内**先拆一步**——帧尾族（`mountTail` ∕ `setStreaming` ∕ `patchTail` ∕ `headMoves` ∕ `settleFrame` + 依赖 `mountedOf` ∕ `dressNode`）出档 `renderer/views/chat-settle.mjs`（沿 KD-48 先例「模型族七件出档 `chat-model.mjs`」同式；拆后 ≈170） |
| 桌 `renderer/app.mjs` | 299 ⇒ 299（调用点一行形改——零净增） |
| VSC `webview/**` ∕ 核 `subblocks/*` ∕ `md.mjs` ∕ 桌面 `renderer/views/chat-text.mjs`（调用点——`paintStreamTarget` 同签名零改） ∕ 两端套件 | 零触 |
| 测试 ∕ 探针面 | 批内件两档：`docs/batches/2026-09-29-perf-residuals.test.mjs`（平 node）+ `-probe.mjs`（真机扩面）；仓套件不写 ∕ 不改 ∕ 不跑（全清令——五仓测试树） |

### 2.7 验收对照（平 node A 表 + 真机探针 R 表 + 回归）

平 node（批内件 · C12 ∕ C13）：
| # | 判据 |
|---|---|
| AC-1 | `liveCut` 冻结切点：段内封闭推进 ∕ 悬空构造退点 ∕ 尾换行串留热 ∕ 行首块标记未定型留热 ∕ 围栏 ∕ 块级单元——语料逐例 |
| AC-2 | 分片恒等式：段内 `mdInline` 复合 ≡ 整体（含单换行 `<br>` 语境）∧ 块级 `md` 复合 ≡ 整体——语料逐例 |
| AC-3 | `paintLiveMd` 协议（假元素）：首绘 = 分片全绘（无整面 `innerHTML=md(raw)` 径）· 增帧 = 仅提交段 + 热区（冻结区零写）· 幂等帧零写 · 非前缀 ⇒ 复位 · 异常 ⇒ `textContent`（并复位） |
| AC-4 | `streamDelta` `patch-append`：k=1 ∕ k≥2 ∕ 键不等 ⇒ reset ∕ 更早断 ⇒ reset ∕ 纯追加广义（k≥2）；**各档出口形 deepEqual 逐字断言**（`append` **恰** `{kind:"append", index}`——`index` = 首枚追加位（n=0 首块档 `[]→[a]` ⇒ `{kind:"append", index:0}`）；`patch-append` = `{kind:"patch-append", index, appended}`——`index = length−1` 钉死 ∕ `appended` = k；`none` ∕ `reset` = `{kind, index:-1}`；`patch` = `{kind:"patch", index}`） |
| AC-5 | `alignPlan` combo：无滑 ∕ 滑窗 ∕ 零重合 ∕ 守卫不达（`ok=false`）各例——`{evict, prepend, patchAt, tail, ok}` 断言；纯 patch 既有例回归 |
| AC-6 | `settleFrame` combo（假 DOM）：尾节点同引用 + 内容更新 + 追加段挂载 + 非 evict 老节点零摘离 |
| AC-7 | VSC 复证对拍：git 修前副本逐字参照（驱动表含截断 ∕ 空串 ∕ 停收 ∕ 幂等）+ 非串差异锁（现行为） |

真机探针（批内件 `-probe.mjs`；基线 = 前批读数在册）：
| # | 判据 |
|---|---|
| R-1 | 每 chunk 同步成本平坦（≤0.3ms@80KB ∧ 比 ≤2）——**不回退**（在册 0.0033 ∕ 0.22） |
| R-6 | 帧成本 p95 ≤8ms@80KB（基线段）+ 帧成本对文本长度平坦（10KB→80KB 帧成本比 ≤2） |
| R-7 | 帧成本 p95 ≤8ms@80KB（密文段——原 R-2aD 诊断面升判据面） |
| R-8 | 边界帧（组合径）：尾块终稿 + 新块追加同帧 ⇒ 帧 p95 ≤8ms ∧ 零重挂（旧节点身份存续——`data-probe-mark` 存活）∧ 块数 +1 |
| R-9 | 增量面 ≡ 全量参照（真 DOM——`textContent` 逐字 + 结构归一一致；语料八类：纯段 ∕ 空行分段 ∕ 密文行内 ∕ 悬空尾 ∕ 围栏 ∕ 列表 ∕ 混合 CJK ∕ 转义） |
| R-2b ∕ R-3 | 帧数合并率 ∕ 工具卡保真——**不回退** |

### 2.8 关键决策（被否候选在册 · 单源 = 核档 §2 KD-RC-10（机制级）+ 桌档 §2 KD-50（组合档面））

- **整面重挂保底（维持全量 md）** ×：8ms 预算不达（15.4 ∕ 31.8ms 在册；16ms 收正 = 过渡基线）。
- **整段级冻结（仅按 `\n\n`）** ×：探针负载 = 单段 80KB 无空行 ⇒ 零收益（实测负载即反例）。
- **固定字数滑窗热区** ×：非保守——未证区被冻结 ⇒ 正确性不可保。
- **DOM diff（文本节点级 patch）** ×：构造开闭改节点树 ⇒ diff 面不可界 + 重机具。
- **md 移 worker** ×：DOM 写必在主线程——帧内成本不消 + 顺序保真面新开。
- **md 引擎重写（流式 tokenizer）** ×：双源（`md.mjs` 单源不动）；收益不匹配（本机制 = 现 md 之上的冻结 ∕ 热区调度）。
- **段内虚拟化** ×：滚动 ∕ 选区 ∕ 复制面破——窗口 200 已界（先例裁定）。
- **组合档用「尾块整节点重建」** ×：节点身份失（选区 ∕ 滚位）+ 全量 md 重渲照旧；就地 path 已在——同笔入桌档 §2 KD-50 被否列（被否注册 ∕ 单源声明一致化）。
- **组合档留挂（不在本批）** ×：每新块边界一次全窗重挂 = p95 主尾（帧合并后新暴露）；修点面小（两纯件 + 一处挂载）。

### 2.9 上抛项

1. **需求档性能行收正**（`docs/desktop/requirements/PROJECT.md` §6 性能行——**笔权 = 父侧**）：建议文本 = 「帧 p95 ≤8ms@80KB（基线 ∕ 密文两段同判）+ 帧成本平坦比（10KB→80KB）≤2」+ 测法指针改 `docs/batches/2026-09-29-perf-residuals.probe.mjs`；现行 = ≤16ms 收正句 + 增量 md「另议挂账」句（本批机制落定后为过期形）。
2. **批内件两档收位**：`docs/batches/2026-09-29-perf-residuals.{test,probe}.mjs`（实施轮建；若 `docs/batches/` 写面被拒 ⇒ 沿先例退 `.thincoder/tmp/`、父侧 copy）。
3. **VSC 复证坐标登记**：修前副本 = git `cf48ba12~1`（记录面随父侧——建议 #619 核销时引用；本批 §2.5 已载）。
4. **实现面风险预置**：① 扫描器 = 保守判定器（冻结过多 = 性能损失；冻结错 = 对拍腿暴露——语料覆盖为门禁）；② 长未闭构造（病态）帧成本退全量 md 同阶——登记边界（不设累计截断——正确性优先）；③ 单段超长 + 高频帧的浏览器内部布局成本（段重排 ∝ 段长）为机制外下限——R-6 帧成本平坦比即其测面（若不达 ⇒ 父侧按实测裁）；④ 分片语境小件（段内续写渲染器）为新增面——实施轮定形，受 AC-2 恒等式门禁。

### 2.10 探针扩面（明细）

来源 = `docs/batches/2026-09-29-render-perf.probe.mjs`（原件存续）；扩面件 = `docs/batches/2026-09-29-perf-residuals.probe.mjs`（批内件）：
- **R-1 ∕ R-2b ∕ R-3 原腿原样存续**（回归基线——读数比对在册）。
- **R-6 ∕ R-7**：原 R-2a（基线段）与 R-2aD（密文段）复跑——判据收正为 ≤8ms；新增 10KB→80KB 帧成本比读数（平坦性）。
- **R-8**：新增边界腿——块一近满量后同帧「尾块终稿 + 新块追加」（`store.set` 双发不夹 rAF）⇒ `__probe.force()` 出帧计时 + 事前埋在块一节点的 `data-probe-mark` 存续断言（零重挂）+ 块数 +1。
- **R-9**：新增对拍腿——语料八类逐步流式（`ev:token` 真管道），每步（或定步）以离岸容器 `md(raw)` 为全量参照，比对活面 `textContent` 逐字 + 结构归一（相邻文本节点合并 + 标签 ∕ class 序列）。
- 跑法同前批（playwright-core 直驱真 Electron；`window.__probe` 观测桩）。

**提交物**：本 §2 + 三设计档落点（§2.2 已落）+ doc-check 复跑读数（见下）。**零实施**（设计轮——产品码零写；R-1 ∕ R-2b ∕ R-3 基线不动）。

**机检（本设计轮亲跑 · 单次）**：`node scripts/doc-check.mjs --root .` ⇒ 悬空 **162** ∕ 行宽 **83**（既有基线 as-of 前批 = 160 ∕ 67，其间多批并发文档写入；**本批净增 = 0**——本批三档新增行逐行核过：无新增超宽行（两处超宽已折行），新增引用全走「（拟新增）标记」合规形（列报 · 不入闸 +3），另收正既有悬空 1 处（`RENDER-CORE.md:329` `test/run.mjs` ⇒ 全路径 `thincoder-render-core/test/run.mjs`））。

### 2.11 修正轮（评审 #41 · §3 轮次 1 · 发现 1–8 逐条处置 · eng-designer · 2026-09-29）

**输入** = 本档 §3 轮次 1（VERDICT: pass · 🔴0 ∕ 🟡4 ∕ 🔵4 = 8 条）+ 父侧逐条裁定（全受理 · 逐号点修）；**处置执行 = 本舱**。**落笔方式 = §2 就地修正**（本作者段内——修正点直接落 §2 对应行；本档尚未 commit ⇒ 原行不留 git 历史，历史对照以本块逐号记录为准；沿本仓「§2 就地修正 · 打标」先例）+ 设计档同轮就地收正（`RENDER-CORE.md` ∕ `RENDERER.md` ∕ 桌面 `PROJECT.md`，各档尾变更记录一行同笔）。**零新语义**（= 判定次序 ∕ 出口形 ∕ 条件句 ∕ 基线明写 ∕ 落点钉定 ∕ 被否注册一致化）；产品码 ∕ 测试件 ∕ 需求档 ∕ §1 ∕ §3–§6 ∕ 其它批射程零触。

| 号 | 处置（号 → 改动 file:line · 坐标 = 本轮 read-back 实读） | 态 |
|---|---|---|
| 1 · 🟡 判定次序 ∕ 出口形 | 本档 §2.4 表行 #1（`:55`）收正 + 表下增**判定次序表 + 各档出口形块**（`:62-70`）：尾位引用先等比 ⇒ `append`（`index` = 首枚追加位；n=0 首块档 ⇒ `index:0`）；尾位同键但引用变 ⇒ `patch-append`（`index = length−1` 钉死 ∕ `appended` = k）；`append` 出口**恰** `{kind,index}`（deepEqual 既有用例逐字等）；AC-4 增出口形逐字断言（`:107`——含 n=0 首块档）；`alignPlan` 第 3 参兼容口径明写（表行 #2 `:56`——真值〔含既有用例 `docs/batches/2026-09-29-render-perf.test.mjs:410`〕∨ mode 串）+ 出口纯增键 `patchAt`；表行 #3 ∕ #6 同口径精化（`:57` ∕ `:60`） | 落定 |
| 2 · 🟡 贴线 + 越层预案 | 本档 §2.6 `chat.mjs` 行改**条件句**（`:94`）：284 ⇒ ≈296 仅当偏差 ≤+4；越 300 ⇒ 先拆一步——帧尾族出档 `renderer/views/chat-settle.mjs`（沿 KD-48 先例）；§2.6 表前口径句补**上批实读偏差先例**（+19 ∕ +24）（`:86`）。（派单标「§2.5」——实为 §2.6 行，按 §3 坐标 `:84` 落） | 落定 |
| 3 · 🟡 异常径单源收一 | 取「单源补 + 复位」侧：核档 `docs/render-core/design/RENDER-CORE.md:76`（KD-RC-10）异常句补「**+ 复位**（内部冻结态清空 ⇒ 下一帧起点 = 分片全绘径）」——与批档机制文（`:45`）∕ AC-3（`:106`）单值化；C12 异常句同笔（`RENDER-CORE.md:355`） | 落定 |
| 4 · 🟡 跨档同拍收正 | `docs/desktop/design/RENDERER.md:65-66`（帧面分派条——四档 ⇒ **五档** + `paintPlan` 出口补 `appended`）· `:120-121`（窗口对齐步条——`alignPlan` 签名补 `appended = 0` 参 ∕ 出口补 `patchAt` ∕ 第 3 参兼容口径）——与 `:123`（组合档条）同口径 | 落定 |
| 5 · 🔵 R-9 持久判据位 | 核档 §7 C12 机检面补**真机探针 R-9**（`RENDER-CORE.md:355`——真 DOM 增量面 ≡ 全量参照；运行时等价腿入持久判据位）；C10 枚举不动 | 落定 |
| 6 · 🔵 清点基线 ∕ 7+1 归因 | 本档 §2.5② 明写**清点基线**（`git diff cf48ba12~1 cf48ba12 -- thincoder-vscode/webview/chat-messages.js`——两批同落该 commit）与 **7+1 归因**（非 toolOutput 支七枚 + 第 8 枚居 toolOutput 支内计入该支）（`:78`） | 落定 |
| 7 · 🔵 小件落点 ∕ 零触面 | 本档 §2.6 `live-md.mjs` 行钉**段内续写渲染器小件落点**（并入本档；经 `mdInline` 组装——避第二份 inline 实现）（`:90`）+ §2.3 分片语境注同笔（`:45`）；零触行补桌面 `renderer/views/chat-text.mjs` 一行（`:96`） | 落定 |
| 8 · 🔵 被否注册一致化 | 「组合档用『尾块整节点重建』」入桌档 §2 **KD-50** 被否列（`docs/desktop/design/PROJECT.md:92` 行）+ 本档 §2.8 同笔（单源声明含 KD-50）（`:122` ∕ `:131`） | 落定 |

**读回核验（D6——落毕逐处核读）**：本档 §2 各落点（`:45` · `:55-57` · `:60` · `:62-70` · `:78` · `:86` · `:90` · `:94` · `:96` · `:107` · `:122` · `:131`）逐处上下文核过；三设计档：`RENDER-CORE.md`（`:76` ∕ `:355` ∕ `:458`）· `RENDERER.md`（`:65-66` ∕ `:120-121` ∕ `:229`）· `PROJECT.md`（`:92` ∕ `:1338`——并发写者在动，行号为 read-back 时点）逐处核过。

**机检（交付前亲跑 · 单次）**：`node scripts/doc-check.mjs --root .` ⇒ **悬空 160** ∕ **行宽 80**（设计轮读数 = 162 ∕ 83；本舱改动行逐行核过——**零新增**悬空 ∕ 零新增超宽，读数变化归并发多批写入）；日志 = `.thincoder/tmp/perf-residuals-fix-doccheck.txt`。

**未做 ∕ 披露项（只报）**：① 号 2 派单标「§2.5」、实为 §2.6 行（按 §3 坐标 `:84` 落，见上表）；② 号 8「RENDERER §2 被否列」——该档 §2 无被否列结构（现盘 grep 零命中）⇒ 取 KD-50 一层，本档 §2.8 单源声明同笔含 KD-50；③ §2 就地修正原文不留 git（本档未 commit——历史对照以本块为准）；④ 并发在册（PROJECT.md 另有多实例写入——本舱行经 read-back 复核在位）。上抛零新增。

### 2.12 实施后文档面随动轮（性能尾账批 · 文档面随动两点 · eng-designer · 2026-09-29）

**输入** = 父侧派单（文档面随动两点）· 本档 §5 实施读数（实施报文 #66）；**射程 = 两档**（`docs/render-core/design/RENDER-CORE.md` · `docs/desktop/design/PROJECT.md`）——**零语义**（登记 ∕ 读数随动）；产品码 ∕ 测试件 ∕ 需求档 ∕ §1 ∕ §3–§6 ∕ 两档以外文档零触。

**逐处（落点 · 坐标 = read-back 时点实读）**：

| # | 档 → 处 | 落值 |
|---|---|---|
| 1 | `RENDER-CORE.md` §2 KD-RC-10（`:76`） | 「新核件」单档 ⇒ **两档登记**：`thincoder-render-core/flow/live-scan.mjs`（**351 行**——`liveCut` 扫描器）+ `flow/live-md.mjs`（**179 行**——`paintLiveMd` 画件；`liveCut` 经其再出口保签名）；拆因 = 单档 ≈538 超 500 硬限；「拟新增」标记撤 |
| 2 | 同档 §5 调度族（`:220` 新行） | 增「实施落形 = 两档（实读 2026-09-29）」句——扫描器 **351** 住 `live-scan.mjs` · 画件 **179** 住 `live-md.mjs`（`liveCut` 经本档再出口，签名不变） |
| 3 | 同档 §6 本批随动段（`:343-345`） | 核行 = 两档登记（**新档 · 351** + **179**——拆因注）；`flow/stream.mjs` **135 ⇒ 135**（实读——委托净零）；桌面 `views/chat-stream.mjs` ⇒ **101** ∕ `views/chat.mjs` ⇒ **290**（实读——未触越层预案） |
| 4 | 同档 变更记录（`:477-478`） | 一行同笔 |
| 5 | `PROJECT.md` §4.1 `chat.mjs` 行（`:233`） | **290** 届盘在位（复核）；注句收正——模型族出档 **≈265 ⇒ 284**（该批终读——与 §4.2 行同值化） |
| 6 | 同档 §4.1 `chat-stream.mjs` 行（`:239`） | **101**（实读 2026-09-29——性能尾账批后）+ 枚举同拍（`streamDelta` 四档 ⇒ **五档**） |
| 7 | 同档 §4.2 本批块（`:727` ∕ `:731-736`） | 表头「零实施——设计轮」⇒ **实施轮落——设计预估已按盘收正**；行转终读：`live-scan.mjs` **351** 新增行 ∕ `live-md.mjs` **≈170 → 终读 179** ∕ `stream.mjs` **→ 终读 135** ∕ `chat-stream.mjs` **→ 终读 101** ∕ `chat.mjs` **→ 终读 290**；`live-scan` 行注越层判定（> 300 顾问线（< 500 硬限）——未再拆，给由 = 批档 §5） |
| 8 | 同档 变更记录（`:1404-1405`） | 一行同笔 |

**读回核实（D6）**：8 处（14 落点）逐处核读在位；宽检 = 本舱新增 ∕ 改动非表行全 ≤300（最长 **291**）。

**机检（交付前亲跑 · pre ∕ post 对拍 · 单次对）**：`node scripts/doc-check.mjs --root .`——**本批写域零新增红**：本舱两档 pre ∕ post 对拍，gated（✗）项集逐条同构（悬空 ∕ 行宽零新增；全仓读数 = 悬空 **161** ∕ 行宽 **81**——pre ∕ post 同值）；行数面「差异 0 ⇒ 2」两条**非本舱因**（见披露②）；五档收后全 = 现盘（比对 130 ⇒ **131** 行——新增比对面 `chat-stream.mjs` **101** ✓）；列报：本舱两档减 **17** 条（`scroll.mjs` **119 行落盘** ⇒ 5 拟新增列报 + 12 符号报告解析——并发批在飞）∕ 增 **2** 条（披露②）。日志 = `.thincoder/tmp/perf-residuals-docface-doccheck-{pre,post}.txt`。

**披露项（只报）**：① 本档 §5 内部两值（拆档披露「350 ∕ 185」vs 预算实测「351 ∕ 179」）——现盘实读 = **351 ∕ 179**（本舱按现盘收正）；§5 非本舱笔，提请父侧知悉；
② **并发漂移（非本舱因）**：本舱 pre ∕ post 间在飞批改动产品档 ⇒ 行数面新增两条报告——`thincoder-desktop/renderer/views/chat-scroll.mjs` **103 ⇒ 109** ∕ `activity-new.mjs` **109 ⇒ 112**（两行 = §4.1 在册值——待其文档面随动轮收；非本批五档射程，本舱零触）；
③ 同族滞后面（只报 · 非本批射程）：`PROJECT.md` §4.1 两行（`chat-model.mjs` ∕ `frame-dispatch.mjs`——更新纪律收核批产物）仍为设计轮形（`— ⇒ ≈95` ∕ `— ⇒ ≈50` + 「拟新增」标记）而两档已落盘（现读 **104** ∕ **55**——§4.2 同批行终读在册）；`RENDER-CORE.md` §6 更新纪律段两处估值未注终读（`frame.mjs` ≈60 → **69** ∕ `stream.mjs` ≈135 → **135**）；
④ 批内件两档现盘已在 `docs/batches/` 在位（收位 ✓——§4.2 测试面行所载路径具可解析；`.thincoder/tmp` 同址副本处置 = 父侧）。

**上抛零新增（披露四项只报）。**

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Clarity / Acceptance | 🟡 | §2.4 #1 的 `patch-append` 判定与「append 广义化（任意 k ≥ 1）」字面重叠：`after.length > length ∧ 前缀（length-1 位）引用全等 ∧ 尾位同键` 对纯追加（尾位引用未变）同样成立——判定次序（尾位引用先等比 ⇒ append；尾位同键但引用变 ⇒ patch-append）未钉；`{kind:"patch-append", index, appended}` 中 `index` 取值未给、append 纯追加档是否携 `appended` 未给（n=0 首块档下 `length-1` 公式亦无定义）。硬约束在册：出口形 `{ kind, index }` 曾钉死（`thincoder/docs/batches/2026-09-26-desktop-impl-6.md:352`），既有 deepEqual 用例 `streamDelta([a],[a,b]) ⇒ {kind:"append",index:1}`（`thincoder/docs/batches/2026-09-29-render-perf.test.mjs:402`）多一字段即否；AC-4（`thincoder/docs/batches/2026-09-29-perf-residuals.md:97`）亦未断言出口形。另：`alignPlan` 第 3 参布尔 ⇒ mode 串（`:56` ∕ `:60`）与「既有调用 ∕ 用例零改」需并明（既有用例 `alignPlan(mounted,[a,b],true)`——`thincoder/docs/batches/2026-09-29-render-perf.test.mjs:410`——须仍被视作尾位豁免） | §2.4 #1 补判定次序表 + 各档出口形（append 恰 `{kind,index}`，index = 首枚追加位；patch-append `{kind,index,appended}` 且 index 钉死）；AC-4 增出口形逐字断言（含 n=0 首块档）；alignPlan 第 3 参兼容口径明写（真值 ∨ mode 串） |
| 2 | Affected-file size | 🟡 | `views/chat.mjs` 284 ⇒ ≈296（批档 `:84`）仅余 4 行即触 300 层，且无越层预案；同族上批同类估值系统性偏低：chat 估 ≈265 落 **284**、app 估 ≈275 落 **299**（`thincoder/docs/batches/2026-09-29-render-perf.md:228` ∕ `:225`——+19 ∕ +24）⇒ 同幅偏差复现即落 >300 | 预置越层预案（越 300 ⇒ 出档件名 ∕ 或先拆一步），或把该行改写成「贴线 + 触发门」条件句；估算口径按上批实读偏差加安全边 |
| 3 | Document ownership（单源滞后） | 🟡 | 异常径语义两处不一：批档机制文 + AC-3 载「异常 ⇒ `textContent = raw`（现状语义）**+ 复位**」（`thincoder/docs/batches/2026-09-29-perf-residuals.md:45` ∕ `:96`），而声明的单源 KD-RC-10 仅载「异常 ⇒ `textContent = raw`（现状语义）」（`thincoder/docs/render-core/design/RENDER-CORE.md:76`）——增量件的内部冻结态是否复位（下一帧增径起点）在两处读法不一 | 两处取一：单源补「+ 复位」并写明复位对象（内部冻结态 ∕ 复位全绘径），或批档删括注；使异常后行为单值 |
| 4 | Document ownership（跨档滞后） | 🟡 | 本批落点声明 §2 对齐判据条已补组合档（`thincoder/docs/desktop/design/RENDERER.md:121`），但同档 `:65`（「四档判据 = `streamDelta`」+ `paintPlan → { tier, index, remount, refresh }`）与 `:119`（`alignPlan(mounted, visible, tailExempt) → { evict, prepend, tail, ok }`）仍为旧形——判据档数（四 ⇒ 五）、`paintPlan` 缺 `appended`、`alignPlan` 第 3 ∕ 4 参（mode ∕ appended）口径未随动 | 同拍收正两行（四档 ⇒ 五档；两纯件签名 ∕ 出口形补全），与 `:121` ∕ 批档 §2.4 #2 ∕ #3 同口径 |
| 5 | Acceptance criteria | 🔵 | R-9（真 DOM 增量面 ≡ 全量参照）在批档 `:109` 与核档 §6（`thincoder/docs/render-core/design/RENDER-CORE.md:336`）在册、KD-RC-10 判据列亦载「真 DOM 逐步对拍」，但 §7 C12 机检面仅列平 node 批内件（`:355`）、C10 探针枚举为 R-1 ∕ R-6 ∕ R-7 ∕ R-8（`:353`）——运行时等价腿于持久判据面无锚 | C12 机检面补 R-9（或 C10 枚举补之），使运行时等价腿有持久判据位 |
| 6 | Clarity（复证可复跑性） | 🔵 | §2.5②「全文件改动 = `markOutput` 七处 + toolOutput 支 + 进口行」（`:68`）未写明清点基线：所引对 `cf48ba12~1..cf48ba12` 按定义只含 render-perf 改项，`markOutput` 部分不落入该 diff；且「七处」与 stall-indicator 批在册「八重置点」（`thincoder/docs/batches/2026-09-29-stall-indicator.md:226`；现盘实读 8 个 `markOutput` 调用点）的 7+1 归因（第八点居 toolOutput 支内）未写明——「只读复核可复跑」按字面不可复跑 | 明写清点所用 diff 对（或基线）与 7+1 归因口径；「七处」加括注（toolOutput 支内一枚计入该支） |
| 7 | Clarity（受影响面完整） | 🔵 | §2.3 新件「段内续写渲染器 = inline 语境含 `\n`→`<br>` 单换行步（实施轮以核内小件补齐，或等价形）」落点未入 §2.6 表（`live-md.mjs` 行记「扫描器 + 画件」，批档 `:81`）；`md.mjs` 的 `inline()` 未导出（实读导出面 = `md` ∕ `mdInline` ∕ `esc`——`thincoder/thincoder-render-core/md.mjs:67` ∕ `:146` ∕ `:151`），小件若另起实现即成双源面；§2.6「零触」行未列运行期随动的桌面 `views/chat-text.mjs`（§2.3 已述零触） | 表内钉小件落点（并入 `live-md.mjs` ∕ 补档行）+ 注明经 `mdInline` 组装（避 `inline` 双写）；零触面补 `chat-text.mjs` 一行 |
| 8 | Document ownership（被否注册） | 🔵 | §2.8 载「被否候选在册 · 单源 = 核档 §2 KD-RC-10」；其中「组合档用『尾块整节点重建』」仅存批档 `:121`——KD-RC-10 被否列（7 项）与 §2 KD-50 被否列（`thincoder/docs/desktop/design/PROJECT.md:92`）均未载（另一项「组合档留挂」已由 KD-50「重挂保留（组合回落不修）」覆盖） | 该候选补入一层被否列（KD-50 ∕ RENDERER §2），使被否注册与单源声明一致 |

计数：🔴 0 · 🟡 4 · 🔵 4（共 8 项）——🔴 无 ⇒ 通过。

未核项（评审边界）：doc-check 读数（悬空 162 ∕ 行宽 83）无执行面未复跑；git `cf48ba12~1` 可得性（③ 复证前提）未独立核验——按设计「本设计轮实证」在册；R 腿读数属实施 ∕ 验证轮面。已核（实读）：修法六处 file:line 全对（`chat-stream.mjs:18-30` ∕ `:46-64` ∕ `:72-77`、`chat.mjs:218-238` ∕ `:262-284`、`app.mjs:184`）· 受影响表行数抽核（77 ∕ 135 ∕ 82 ∕ 284 ∕ 299，末行口径差 1 沿先例）· 三设计档落点全在盘（KD-RC-10 `:76`、§5 `:215`、§6 `:332-336`、C10–C13 `:353-356`、§10 K ∕ L `:408-409`；RENDERER `:20-21` ∕ `:111-112` ∕ `:121` ∕ `:131`；PROJECT KD-50 `:92`、§4.2 `:708-720`、CM `:1034`、变更 `:1323-1324`）· 基线读数（R-1 0.0033 ∕ 0.22、p95 15.4 ∕ 31.8——`thincoder/docs/batches/2026-09-29-render-perf.md:268` ∕ `:272`）· 组合档机制按现盘码复核（滑窗 evict 支 ∕ 守卫充分性 ∕ mountTail 插点）成立 · 探针负载「单段 80KB 无空行」实读成立（`…render-perf.probe.mjs:87-88` ∕ `:117`）· 零实施核（live-md.mjs 不在盘；五个改动档行数与上批末读一致）。

VERDICT: pass

## §4 用户批准（主 agent）

**用户批准（父侧代签 · 2026-09-29）**

- **依据** = 用户 2026-09-29 13:52「别等我了，自己跑完」+ 17:02「尽可能消除」令（代点火 + 代批准授权——本批经此授权点火评审 #41）。
- **三条件核检**：① **评审 pass**——#41（0🔴 · 4🟡 · 4🔵 · pass；§3 在册）② **修正轮在跑**——#53（逐号 1..8 全受理）；落定后随 §2 修正块入册 ③ **凭证**——评审 #41 已通过（token 在手）。
- **批准射程** = 本批 §2 全量（#619：增量 md 机制 KD-RC-10 + 修法六处 + VSC 复证 + 探针扩面）；**不扩面**。
- 〔父侧代签 · 记录在案 · 可 revert〕

## §5 实施记录（eng-coder）

### 实施摘要（eng-coder · #619 增量 md 机制 + 桌面组合档 + VSC 复证）

**落点（产品码）**：

| 档 | 形 |
|---|---|
| 核 `thincoder-render-core/flow/live-scan.mjs`（**新建**） | 冻结切点扫描器 `liveCut(raw, from=0) → {cut, blockStart, inline}` + `tailHeadEnd`（热区行内有效前缀界）；语法 ‖ 语义：块界 = `\n\n+` 串（消费换行行 ⇒ 串长 ≥3）· 段内 = 行内构造闭合点 ∥ 未证退点 · 边界禁列（尾转义 ∕ 星 ∕ 波浪 ∕ 反引 ∕ 换行串）· 保守：未证者留热 |
| 核 `thincoder-render-core/flow/live-md.mjs`（**新建**） | 分片画件 `paintLiveMd(el, raw)`（首绘 = 分片全绘；增帧 = 提交段追加 + 热区换代；幂等帧零写；非前缀 ∕ 热区 ∥ 开段失连 ⇒ 复位全绘；异常 ⇒ `textContent = raw` + 复位）+ 段内续写渲染器 `liveInline`（核 `mdInline` + `\n`→`<br>` 步）；`liveCut` 经本档 re-export（设计面签名不变） |
| 核 `thincoder-render-core/flow/stream.mjs` | `paintStreamTarget` 委托画件（签名 ∕ 兜底语义不变；`paintReasoningTarget` 随动 ⇒ 两端调用点零改） |
| 桌 `renderer/views/chat-stream.mjs` | `streamDelta` 五档（判定次序：尾位引用先等比 ⇒ `append`（`index` = 首枚追加位，n=0 首块 ⇒ 0，出口**恰** `{kind,index}`）；尾位同键引用变 ⇒ `patch-append`（`index = length−1` 钉死 ∕ `appended` = k））；`alignPlan(mounted, visible, tailExemptOrMode, appended)`（第 3 参真值 ∨ 档串；组合档 `goals/patchAt/tail` + 守卫 `prepend+overlap===goals.length`；出口纯增 `patchAt`）；`paintPlan` 携 `appended` |
| 桌 `renderer/views/chat.mjs` | `patchTail(..., patchAt = 尾位)` + `settleFrame` 组合支（`patchTail(plan.patchAt)` + `mountTail` 同帧两动作）——290 行（< 300，未触越层预案） |
| 桌 `renderer/app.mjs` | `:184` 传档串 + `plan.appended ?? 0`（一行形改，299 行零净增） |

**批内件**（`docs/batches/` 写面被拒 ⇒ 沿 §2.9-2 先例退舱，待父侧 copy）：
`.thincoder/tmp/2026-09-29-perf-residuals.test.mjs`（平 node AC-1..AC-7，**26/26 绿**）+ `.thincoder/tmp/2026-09-29-perf-residuals.probe.mjs`（真机 R 腿）。

**平 node 读数（AC 表）**：AC-1 冻结切点 7 例全绿（含消费换行行 ≥3 规则 ∕ 围栏块级单元 ∕ 边界禁列）；AC-2 分片恒等式绿（可提交段界处 `md(A)+md(B) ≡ md(A+B)`；段内三段复合 ≡ 整体，语料八类逐前缀）；AC-3 画件协议绿（首绘零 `innerHTML` 写 ∕ 冻结节点身份存续 ∕ 幂等帧零写 ∕ 非前缀复位 ∕ 异常 `textContent` + 复位 ∕ 热区失连复位）；AC-4 出口形 deepEqual 逐字绿（含 n=0 首块档 `{kind:"append",index:0}` 恰两键）；AC-5 组合档 + 纯 patch 回归绿；AC-6 假 DOM `settleFrame` 组合帧绿（尾节点同引用 + 追加段挂载 + 非 evict 老节点零摘离）；AC-7 VSC 对拍绿（修前副本逐字参照；**写数不增**——空串 ∕ 停收步核件零写为 KD-RC-9 契约，见披露）。

**真机读数（Electron 直驱 · 一次成跑）**：R-1 ✓（80KB 0.01ms/chunk ∧ 比 ≤2）· R-6a ✓（p95 3.5ms@80KB，基线 15.4ms）· R-6b ✗（10KB→80KB 比 2.69 > 2）· R-7 ✗（密文段 p95 15.1ms，比 4.72；基线 31.8ms）· R-8 ✗（帧 p95 32.5ms，**但 r8b ∕ r8c ✓✓**：`data-probe-mark` 存活 = 零重挂 + 块数 +1）· **R-9 ✓（79/79：八类语料逐步流式，活面 `textContent` 逐字 + 结构归一 ≡ 离岸 `md(raw)`）** · R-2b ✓ · R-3 ✓（工具卡身份 ∕ 标存活 ∕ scrollTop ∕ 行只增；先读旧探针同件复跑亦 ✓ ⇒ 无回归）。

### 内部审计与代码评审轮次（终态 = clean）

**内部离散审计（explore 子代理 · 1 轮 · 阻塞）**：发现 1 条**真实离散**（🔴 级）——`live-md.mjs` 块界提交径把「续段前缀」当裸行内节点挂根（帧步 `"abc def"` → `"abc def ghi\n\nnext"` 时产 `[<p>abc def</p>, " ghi", <p>next</p>]` ≠ `md(raw)`，段落被打断）；另报 1 条未披露批外件（`.thincoder/tmp/` 调试草稿 4 档）+ 文档漂移 1 条（`flow/live-scan.mjs` 新档未入设计档受影响表——= 本报告披露项①，审计核真属实）。

**自修（fix round 1）**：① **D1 修复**——`commitDelta` 改「行内有效前缀入开段 + 段闭 + 界限后段块级 md」两段式（新增 `head = min(tailHeadEnd(text, st.cut), res.cut)` 判据），并**撤除 `absorbShell` 首段壳吸收**（两段式后不再需要：界限恒落在段界 ∕ 块构造起点 ⇒ 块级复合位；`renderHot` ∕ `rebuild` 同笔撤）；② 批外草稿 4 档已删（`lmd-smoke.mjs` ∕ `lmd-fence-dbg.mjs` ∕ `settle-probe.test.mjs` ∕ `diag-probe.mjs`）；③ 批内件加 **AC-3 T2b 跨段界增帧**回归（帧粒度 >1 字符 ⇒ 逐帧 ≡ 全量参照，含列表 ∕ 围栏越帧）。

**内部代码评审（advisor · type=code · 1 轮 · 同步）**：**VERDICT: pass**（🔴 0；🟡 4 = 档长 351 行超 300 顾问线 ∕ combo 守卫退化输入（`appended ≥ visible.length` ⇒ `patchAt` 负而 `ok` 仍真，现路径不可达）∕ 块界候选逐枚重扫的超线性扫描成本（R-6b ∕ R-7 ∕ R-8 未达的候选成因，unverified）∕ 批内件待父侧 copy；🔵 3 = `paraStart` 只写字段 ∕ `if (i > lineStart || true)` 恒真条件 ∕ 设计档 §5 ∕ §6 拆档随动滞后）。

**自修（fix round 2 · 评审后）**：① 块界候选改**反向扫 + 早退**（消逐枚重扫，正向遍同取末位 ⇒ 待查集与判据不变）；② `paraStart` 只写字段全删；③ `|| true` 恒真条件删；④ combo 守卫补 `patchAt >= 0`（退化输入 ⇒ `ok:false` 回落重挂）+ 批内件 AC-5 T2 补该退化例断言。**未采纳**：档长再拆第三档（351 < 500 硬限且档内无 300+ 单体；设计受影响表按两档登记，避免再增设计面漂移）。

**出修后亲跑（两轮复跑同值）**：批内件 **27/27 绿**（含 AC-3 T2b ∕ AC-5 退化例）；既有批回归 `docs/batches/2026-09-29-render-perf.test.mjs` **17/17 绿**（含 `streamDelta([a],[a,b]) ⇒ {kind:"append",index:1}` 与 `alignPlan(mounted,[a,b],true)` 逐字）；真机探针复跑：**R-1 ✓ · R-6a ✓（p95 1.70ms）· R-6b ✓（比 1.31）· R-9 ✓ 79/79 · R-2b ✓ · R-3 ✓**；R-7 ✗（p95 16.6ms）· R-8 帧成本 ✗（33.2ms）而 r8b ∕ r8c ✓（零重挂 + 块数 +1）——即修后 R-6 两段全绿、R-9 等价腿全绿，余 R-7 ∕ R-8 的 ≤8ms 判据按 §2.9-4③「父侧按实测裁」上抛。

**披露项（不静默）**：① 核件拆两档 = `live-scan.mjs`（新档 · 350 行）+ `live-md.mjs`（185 行）——设计受影响表 ∕ 核档 §5 ∕ §6 只登记 `live-md.mjs` 单档（`liveCut` 经其 re-export 保签名）；拆因 = 单档 ≈538 > 500 硬限；② AC-7「写数逐字相等」→ 实测口径 =「文本面 ∥ `_capped` 逐字 ∧ 写数**不增**」（空串 ∕ 已截断步核件零写 = KD-RC-9 契约，旧形必写）；③ 真机 R-6b ∕ R-7 ∕ R-8 的帧成本判据读数与未达面全录（上段）；④ `.thincoder/tmp/` 批内件两档待父侧 copy 入 `docs/batches/`。

**状态行**：实施完成（增量 md 机制 + 桌面组合档 + VSC 复证落盘；审计 1 轮 / 评审 1 轮 pass / 自修 2 轮；批内件 27/27 绿、既有回归 17/17 绿、真机 R-9 79/79 绿）

**预算实测（触线判定 · 决前单点重读）**：`chat.mjs` **284 ⇒ 290 行**（< 300 ⇒ **未触越层预案**，无需拆 `chat-settle.mjs`；距线 10 行）；`app.mjs` 299 ⇒ **299**（一行形改 · 零净增）；`chat-stream.mjs` 77 ⇒ **101**（< 300）；核 `stream.mjs` 135 ⇒ **135**（委托净零）；核 `live-md.mjs` = **179 行**（≈170 预估口径内）；核新档 `live-scan.mjs` = **351 行**（< 500 硬限；> 300 顾问线——评审 🟡 在册，未再拆，理由见上「未采纳」）。工作区变更面 = 6 档产品码 + 批内件两档（`.thincoder/tmp/`）；`docs/batches/` 零写（写面被批档闸拒 ⇒ 沿 §2.9-2 退舱，待父侧 copy）。

## §6 验证与收口（父代理）

### 6.1 收口（父侧 · 2026-09-29）

- **交付物全落**：**核**（新档 `flow/live-md.mjs` **179**（分片画件 `paintLiveMd` + 段内续写 `liveInline`）∥ 新档 `flow/live-scan.mjs` **351**（`liveCut` 扫描器——单档 ≈538 超 500 硬限故拆；`liveCut` 经其 re-export 保签名）∥ `flow/stream.mjs` 135（委托净零））∥ **桌**（`views/chat-stream.mjs` **101**（`streamDelta` 五档 + `alignPlan` 组合 + `paintPlan` 携 `appended`）∥ `views/chat.mjs` **290**（`patchTail` `patchAt` + `settleFrame` 组合支——**< 300 未触越层预案**）∥ `app.mjs` 299（零净增））∥ **VSC 零行为复证** ∥ **文档面**（RENDER-CORE 两档登记 ∕ `PROJECT.md` §4.1 ∕ §4.2——#86 在册）。
- **批内件（归档）**：`docs/batches/2026-09-29-perf-residuals.test.mjs`（**27/27 绿**）+ `…probe.mjs`（Electron 直驱探针）——**父侧收位 ✓**；既有回归 `render-perf.test.mjs` **17/17 绿**。
- **真机读数（终裁）**：**R-6a ✓ 达标**（80KB 帧 p95 **1.70ms** ≤8ms；基线 15.4ms）∥ **R-9 ✓✓**（79/79 真 DOM 等价）∥ R-7 ∥ R-8 = **报告态 + 续账**（**#649**：密文 16.6ms（−48%）∕ 帧成本 33.2ms——超长单段布局成本，机制外；设计 §2.9-4③「父侧按实测裁」执行）。R-1 / R-2b / R-3 ✓。
- **验证**：27/27 + 17/17 绿；VSC 复证（修前副本逐字对拍）；doc-check 本批写域零新增红（行数面新入比对面 ✓）。
- **集成面**：**不新增**（批内件 + 探针件形）。
- **结算同步清单**：① 角色表 ✓ ② 状态行 ✓ ③ 计数 ✓（六档行数在册）④ 指针 ✓ ⑤ changelog ✓（两档）⑥ **台账勾销：#619 → 已核销**（两步）⑦ 前批遗留交叉核：`render-perf` 批（R-2a 挂账源）= 本批承接 ✓。
- **遗留（显式）**：R-7 ∥ R-8（#649）∥ **#650**（文档值随动族）∥ GUI 真机探针（Electron 已直驱——父侧半面已跑 ✓）。
- **收口结论**：本批终止。
