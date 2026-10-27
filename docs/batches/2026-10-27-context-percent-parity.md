# 2026-10-27 · context-percent-parity
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-27 · 来源 = 台账 #1810（`historyPercent` 未随改）+ #1837（`:533` 担保的用例全仓零命中）· 用户 2026-10-27 17:59「起！」。
> 台账 = #1810（CONTEXT-COMPACTION · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-27
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 起批（用户 2026-10-27 17:59「起！」）

**承 `#1810` + `#1837` 两条。** 前批 `2026-10-27-ledger-boundary-fix` 已收口（`#1834` / `#1836` / `#1826` 已核销）；`#1810` 的定义在那一批的 §2.22–§2.30，**设计档四处未落**（该批因冻结错过）。

### 1.2 实读（本席自取，非转述）

**① 核函数不吃 `_tokRatio`** —— `thincoder-core/token-window.mjs:219`：

```js
export function historyPercent(history, provider) {
  return Math.round((estimateTokens(history ?? []) / providerSpec(provider).context) * 100)
}
```

**而 `contextUsage` 的估算支乘了 `ratio = agent?._tokRatio ?? 1`（`:141`–`:142`）** ⇒ **同一个 agent 的两个读数用不同系数。**

**② 四处实现，各算各的（`git grep` 全仓）：**

| 面 | 位置 | 是否调核 |
|---|---|---|
| 核 | `token-window.mjs:219` `historyPercent` | 本体 |
| 核 stats | `agent-tools/context.mjs:108` | ✓ 调核 |
| 核 读数 | `session-lifecycle.mjs:425` | ✓ 调核 |
| desktop | `src/main/agent-host.mjs:169` | ✓ 调核（端侧零重算） |
| **CLI** | `render-loop.mjs:89`（`ctxCache.tokens = estimateTokens(agent.history)`）+ `status-line.mjs:147`（`ctxPct = round(tokens / modelContext * 100)`） | **✗ 自己算** |
| **VSC** | `src/specs.mjs:95` `ctxUsageForHistory` → `:101` `ctxPercentForHistory` | **✗ 自己算** |

**⇒ 「单源」目前只是文档声明：两端各写一份同式公式，靠人守。**

**③ `:533` 的担保与坐标双死** —— `docs/core/design/CONTEXT-COMPACTION.md:533`：

> 状态行口径 = `estimateTokens(history) / providerSpec(provider).context`（CLI `thincoder-cli/src/tui/render-frame.mjs:394-397` + `thincoder-cli/src/tui/render-loop.mjs:89-90`；VSC `ctxPercentForHistory`）——两端已由 `context-percent-parity.test.mjs` 钉死。

- **用例**：`git ls-files` 匹配 `percent-parity` ⇒ **零命中**（`#1837`）
- **坐标**：`render-frame.mjs` 实读 **322 行**，`:394-397` 不存在；真正的 CLI 计算在 `status-line.mjs:147`
- `render-loop.mjs:89-90` 实读存在 ✓

### 1.3 三件事（本批范围）

1. **建 `context-percent-parity.test.mjs`**（三端/四面同一 history + provider ⇒ 同一 pct）—— 先有守卫，再谈口径
2. **`historyPercent` 吃 `_tokRatio`**（`#1810` 本体）
3. **收正 `:533`**：担保句指向真实用例；死坐标改指 `status-line.mjs:147` / `render-loop.mjs:89-90`

### 1.4 边界（不做的）

- **不改端侧显示门**：CLI `ctxPct > 0` 才渲染（`status-line.mjs:149`）、VSC `null` 返回（`specs.mjs`）——`docs/core/design/CONTEXT-COMPACTION.md:540` 已判「不收正」，本批不动
- **不改 `contextUsage`**：其两支承 `_tokRatio` 已落（前批），本批只对齐 `historyPercent`
- **不改压缩线数值**（0.6 口径由 `#1836` 定案，前批已收正）

### 1.5 待设计席定

**`historyPercent` 加 `_tokRatio` 的形**：① 函数签名加第三参（`ratio`）② 或改吃 `agent`（`historyPercent(agent)`，内部取 `history` / `provider` / `_tokRatio`）③ 或维持纯函数、调用面乘。

**②的好处 = 与 `contextUsage` 同源入口（它已吃 agent）；①的约束 = 六处调用点全改。** 三选一由设计席论证，父侧不预设。

**端侧两处（CLI / VSC）是否收成调核**：收 ⇒ 真单源，但要动 CLI 的 `ctxCache` 缓存结构与 VSC 的 `specs.mjs`；不收 ⇒ 用例只能钉「同式」，钉不住「同源」。**design 席给判断。**

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成 2026-10-27
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

本段进度：评审轮次 2 = pass（上轮 11 条全 Fixed）；轮次 2 的两条新发现 N1 / N2 已在 §2.16 处置，本稿待 §4 批准。

### 2.1 本批条目（覆盖）

| # | 条目（回指 §1.3） | 本批状态 |
|---|---|---|
| 1 | 建 `context-percent-parity.test.mjs`（多面同一 history + provider + ratio ⇒ 同一 pct） | **覆盖**——§2.7 案例表 · §2.5 第 9 行（批内单测档，用毕即删） |
| 2 | `historyPercent` 吃 `_tokRatio`（台账 `#1810` 本体） | **覆盖**——§2.2 判据 · §2.3 定形 A · §2.4 定形 B |
| 3 | 收正 `docs/core/design/CONTEXT-COMPACTION.md:533`（担保句 → 真实出处；死坐标 → 真位置） | **覆盖**——§2.14 #2（七行引文 + 回读坐标） |

**明写不做**：`§1.4` 三条边界（端侧显示门 / `contextUsage` / 压缩线数值）原样不动。

### 2.2 判据：口径的单位是「实现点」，不是「公式文本」

父侧问「现在有几处口径」，先定判据——**不先定判据，这个数谁说都算**：

> **判据**：同一个量的口径数 = 该量**可独立改动、可独立漂移的实现点**个数。
> 两处各写一遍同一算式，只要任一处能单独改掉而另一处不知情，**就是两个口径**——文字相同只证明此刻巧合相等，不构成单源。
> **单源** = 该量只有一处实现，其余各处是它的**投影**（调用它，或转发它产出的值）。

按此判据，现状（实读）：

| 面 | 实现点 | 是核的投影？ |
|---|---|---|
| 核 `thincoder-core/token-window.mjs:219`–`:221` | 本体 | — |
| 核 stats `thincoder-core/agent-tools/context.mjs:108` | 调核 ✓ | 是 |
| 打开态读数 `thincoder-core/session-lifecycle.mjs:425` | 调核 ✓ | 是 |
| 桌面 `thincoder-desktop/src/main/agent-host.mjs:169` | 调核 ✓ | 是 |
| **CLI `thincoder-cli/src/tui/render-loop.mjs:90`（`tokens`）∥ `status-line.mjs:147`（`pct`）** | **自己算** | **否** |
| **VSC `thincoder-vscode/src/specs.mjs:96`–`:97`** | **自己算** | **否** |

**⇒ 现状口径数 = 3**（核 / CLI / VSC），消费面 4 类。

**正面回答「stats 不新增第三口径」这句**：

- 按「**同式**」判 → 成立（三处算式文字相同）。
- 按「**同源**」判 → **不成立**（三处可独立改动）。
- **本设计取「同源」，并把判据写进设计档**（§2.9）。理由是可核的事实，不是偏好：复制式公式的漂移**已经发生过一次**——`_tokRatio` 入场时只乘进了 `contextUsage`（`:142`），状态行那一份没跟 → 台账 `#1810`。守卫面也一样：同一批 `:533` 声称有一个 parity 用例钉死三处，实际全仓零命中（`#1837`）。**「同式」这个判据没有守卫能保它继续同式；「同源」有的可判——实现点只有一个。**
- 所以这句在本批之后的真值形：**stats 与状态行同一个核函数出数，口径数 = 1**。

### 2.3 定形 A：ratio 走显参，四个符号落 `thincoder-core/token-window.mjs`

| 名 | 签名 | 语义 |
|---|---|---|
| `historyReading(history, provider, ratio)`（新） | → `{ tokens, pct }` | `tokens = Math.round(estimateTokens(history ?? []) * ratio)`；`pct = Math.round(tokens / providerSpec(provider).context * 100)`——**同一点出两个数**（同屏「X% Yk」不许两把尺） |
| `historyPercent(history, provider, ratio)`（改签名） | → 数 | 薄转口 `historyReading(...).pct`；**名面与 export 不改**，调用方零改名 |
| `tokenRatioOf(agent)`（新） | → 数 | `agent?._tokRatio ?? 1`——中性值 1 的**唯一**出处（现硬写在 `contextUsage` 内 `:142`） |
| `sampleRatio(sample, provider)`（新） | → 数 | 槽 `estimateSample` 过校验 ⇒ `Math.max(1, num/den)`，否则 `1`；**三条校验与 `restoreTokenSample`（`:202`–`:213`）同源共用**（抽出同一判定，不写第二份） |

**为什么不是 ②「改吃 `agent`」**——能力面否掉，不是口味：`sessionReading`（`thincoder-core/session-lifecycle.mjs:412`–`:426`）手里**没有 agent**，只有槽数据（`data.estimateSample` 在 `:215` / `:221` 被消费）。收 agent ⇒ 这一格无解；改它的签名会把「打开态读数」变成要 agent 的函数，而它服务的场景（桌面列会话、未打开）恰好没有 agent。

**为什么不是 ③「调用面乘」**——`pct` 与 `tokens` 会在 5 处各自取整两次，同屏两值不再同尺；且「该式只许存在于一处」的直接后果（§2.8 AC-8）无法达成。

**`ratio` 无缺省**：忘传时 `estimateTokens × undefined` = `NaN` ⇒ 状态行会渲染 `NaN%`，**当场可见**。缺省 `1` 则相反——忘传处静默回到未校准读数，读数看着正常、没人发现，正是 `#1810` 这一类的失败形状。不另加抛错分支（NaN 已足够响，加分支即多一条没有场景的路径）。

### 2.4 定形 B：CLI / VSC 两处收成调核

**判（父侧问题 B）**：收。理由 = §2.2 判据——不收则口径数恒为 3，用例只能钉「同式」，钉不住「同源」，本批改完与改前在结构上同一形状，下一次有人加系数时同样的漏乘会再来一次。

| 面 | 改法 | 缓存 / 形状 |
|---|---|---|
| **CLI** `render-loop.mjs:89`–`:91` | 新增导出 `ctxCacheOf(agent, prev)`：返回 `{ len, ratio, window, tokens, pct }`；`prev` 的 `len` / `ratio` / `window` 三项全等 ⇒ 原引用（零重算）。渲染循环改为 `state.ctxCache = ctxCacheOf(agent, state.ctxCache)` | **缓存键三项**：`history.length` · `ratio` · 解析后的窗口（`providerSpec(provider).context`）。只按 `len` 会留陈旧读数——比可在长度不变时变（`restoreTokenSample` / 口径版本切换），窗口可在切模型时变 |
| **CLI** `status-line.mjs:146`–`:150` | `pct` / `tokens` 全取 `state.ctxCache`；**显示门 `ctxPct > 0`（`:149`）零改** | 端侧零公式 |
| **VSC** `specs.mjs:95`–`:101` | `ctxUsageForHistory(history, provider, ratio)` 委托核 `historyReading`；`pct: tokens ? pct : null` 的**零值不显示门留在端侧** | 返回形 `{ tokens, pct }` 不变（webview 契约零改） |
| **VSC** `panel-callbacks.mjs:231` | 第三参 `tokenRatioOf(panel._agent)`（`:233` 已同档在用 `panel._agent`） | — |

**CLI 缓存为何不收成「每帧调核」**：`estimateTokens` 是全史线性扫描，每帧跑一次是渲染热路径的净开销；`len` / `ratio` / `window` 三项等值即可证明结果不变，故缓存保留，只是缓存的内容从「裸估算」换成「核读数」。

### 2.5 受影响文件（行数 = 本席实读，`node` 逐档统计）

| # | 文件 | 现行数 | 预计增量 | 改什么 |
|---|---|---|---|---|
| 1 | `thincoder-core/token-window.mjs` | 248 | +34 / −4 | §2.3 四个符号；`contextUsage:142` 改用 `tokenRatioOf`（单源）；`historyPercent` 转口 |
| 2 | `thincoder-core/agent-tools/context.mjs` | 182 | +2 / −2 | `:108` 第 6 行：`historyPercent` 与括号内的历史估算数取**同一次** `historyReading` 的两个返回值 |
| 3 | `thincoder-core/session-lifecycle.mjs` | 427 | +2 / −1 | `:425` 第三参 = `sampleRatio(data.estimateSample, provider)` |
| 4 | `thincoder-desktop/src/main/agent-host.mjs` | 339 | +2 / −2 | `:169`–`:170`：`ctxPct` / `ctxTokens` 取同一次 `historyReading`（一帧两值同尺） |
| 5 | `thincoder-vscode/src/specs.mjs` | 102 | +5 / −4 | `:95`–`:101` 委托核（§2.4） |
| 6 | `thincoder-vscode/src/extension/panel-callbacks.mjs` | 360 | +1 / −1 | `:231` 第三参 |
| 7 | `thincoder-cli/src/tui/render-loop.mjs` | 130 | +9 / −2 | `ctxCacheOf` 导出 + `:89`–`:91` 改用 |
| 8 | `thincoder-cli/src/tui/status-line.mjs` | 205 | +2 / −3 | `:146`–`:150` 读缓存 |
| 9 | `.thincoder/tmp/2026-10-27-context-percent-parity.test.mjs`（新，批内单测档） | 0 | ≈170 | §2.7 案例表；**用毕即删**（§2.12 ②） |
| 10 | `test/integration/context-percent-calibrated.test.mjs`（新，集成档） | 0 | ≈90 | §2.10 行 16-1 |

**跨档上限（500 软线）**：无档越线——最大档 `token-window.mjs` 改后 ≈ 278。无拆分计划需要。

### 2.6 关键决策（含被否方案）

| # | 决策 | 被否方案与理由 |
|---|---|---|
| D1 | 核函数吃比 | 否「维持现状，只在设计档写死这是有意的差」：`historyPercent` 自己的档内注释写着「stats 报出的就是用户看到的那个百分比，不新增第三口径」（`token-window.mjs:216`–`:218`），而压缩判据用的是已乘比的 `usage.total` ⇒ 用户看 40%、压缩在 60% 线开火，读数越失真越误导 |
| D2 | `ratio` 显参、无缺省 | 否「缺省 1」：§2.3 末，忘传的两种结果（`NaN` 响亮 ∥ 静默低报）不等价 |
| D3 | `historyReading` 一点出两值 | 否「`tokens` / `pct` 各自算一次」：同屏「context X% Yk」必须同尺；VSC `ctxUsageForHistory` 已是这个形（`specs.mjs:92`–`:94` 自陈），照它对齐 |
| D4 | CLI 缓存键含 `ratio` + `window` | 否「只按 `len` 失效」：§2.4 表两行理由 |
| D5 | CLI / VSC 收成调核 | 否「保留端侧式、用例只钉同式」：§2.2 判据；收了之后 `§2.8 AC-8` 才可判 |

**closest-precedent**：`contextUsage`（`thincoder-core/token-window.mjs:134`–`:156`）——函数内取比并对估算支乘比（`:142` / `:145`–`:147`），本笔是**对齐它**。**偏离一处，有硬理由**：它收 `agent`，读面收显参 `ratio`——`sessionReading` 无 agent（§2.3）。

**survey-evidence**：查了五处——`docs/core/design/CONTEXT-COMPACTION.md` §6.16.4（`:533` 状态行单源句 · `:546` 两口径句 · `:552` 空历史口径与端侧显示门 · `:555` 先例行 · `:679` S3 用例行）∥ `docs/core/design/SESSION.md` §6.24（`:897` 判据句 2 · `:903` 公式 · `:921` 边界）。

另查 `docs/vsc/design/WEBVIEW.md` §4.6（`:197` 节题 · `:199`–`:200` 单一口径句）· `D-W33`（`:730`）∥ `docs/desktop/design/IPC.md` `ev:usage`（`:29` / `:81`，`ctxPct` 与 `ctxTokens` 的来源句）∥ `test/RTM.md`（16 个 CLI 故事，第 16 个 = 本批 16-1 行 `:197`；VSC 端 `:201` ∥ Desktop 端 `:208` 两节明写「尚无集成用例」）。相关者逐处列在 §2.14 #2；无「查过但与本次无关」项。

**公共源面**：独立公共文档仓 = 无（`PROJECT-MANIFEST.json:35` `"publicRepos": []`，本席实读）；外部一手源 = 不适用（本笔口径全部来自仓内实现 + 台账 `#1810` ∥ `#1837`，无可对照的外部规范）。

### 2.7 案例表（批内单测档 `.thincoder/tmp/2026-10-27-context-percent-parity.test.mjs`）

| # | 态 | 输入 | 期望 |
|---|---|---|---|
| C1 | 正常 | `history` = 3 条固定消息；`provider = { name: "t", model: "m", modelContext: { m: 128 } }` ⇒ 窗口 = 128 × 1024 = 131_072（L1 显式声明，**不靠静态表**——`model: "m"` 会前缀命中 1M 档，见 `thincoder-core/model-specs.mjs:170`）；`ratio` ∈ {1, 1.5, 2} | `historyPercent(history, provider, ratio) === Math.round(Math.round(estimateTokens(history) * ratio) / 131_072 * 100)`；`ratio = 1.5 / 2` 严格大于 `ratio = 1` |
| C2 | 边界（零回归） | 同上，`ratio = 1` | 与改前公式 `Math.round(estimateTokens(h)/win*100)` **逐位相等**（用改前式在用例内独立复算） |
| C3 | 正常（同尺） | 同上 | `historyReading(h,p,r).pct === historyPercent(h,p,r)`；`pct === Math.round(tokens/win*100)` |
| C4 | 正常（跨面同数） | 同上，`ratio = 1.5` | 核 `historyPercent` ∥ VSC `ctxUsageForHistory(...).pct` ∥ CLI 状态行渲染串里的 `context N%` ∥ 打开态 `sessionReading(带等价 estimateSample)` —— 四者同为 N |
| C5 | 边界（缓存不陈旧） | CLI `ctxCacheOf`：先 `(agent, null)`，把 `agent._tokRatio` 由 1 改 1.5（`history.length` 不变）再调 | 第二次返回的 `pct` 变大，且 `pct === historyPercent(h,p,1.5)` |
| C6 | 边界（显示门零改） | 空 `history`（`[]`）；provider = C1 同一夹具（窗口 131_072） | 核 `historyPercent([]...) = 0`；VSC `ctxUsageForHistory([]).pct === null`；CLI 渲染串**不含** `context ` 段 |
| C7 | 错误（忘传比的形状） | `historyPercent(h, p)`（`ratio` 缺） | 返回 `NaN`——**不**返回未校准的整数（锁住「无缺省」这条） |
| C8 | 正常（样本单源） | 槽 `estimateSample = {key, num:1473, den:1000, est:ESTIMATOR_VERSION}` ∥ 坏样本（`den:0` / `est` 不符 / `key` 不符） | 好样本 ⇒ `sampleRatio = 1.473` 且 `sessionReading` 与「`restoreTokenSample` 后 `tokenRatioOf`」同值；三种坏样本 ⇒ `1` |

### 2.8 验收（回指 §2.1 三条）

| AC | 判据 | 回指 | 判法 |
|---|---|---|---|
| AC-1 | 比生效（C1） | 条目 2 | `node --test .thincoder/tmp/2026-10-27-context-percent-parity.test.mjs` |
| AC-2 | 未校准零回归（C2） | 条目 2 | 同上 |
| AC-3 | 一点出两值同尺（C3） | 条目 2 | 同上 |
| AC-4 | 四消费面同一 pct（C4） | 条目 1 · 2 | 同上 |
| AC-5 | CLI 缓存随比刷新（C5） | 条目 1 | 同上 |
| AC-6 | 三处显示门零改（C6） | 边界 §1.4 | 同上 |
| AC-7 | 缺比即失败（C7） | 条目 2（D2） | 同上 |
| AC-8 | 端侧零自算式 | 条目 1 · 2（D5） | 行扫 §2.5 第 2–8 行的八个文件：不得再出现「`estimateTokens(...)` 直接除 `providerSpec(...).context`」，该式只许在 `token-window.mjs` 的 `historyReading` 内 |
| AC-9 | 设计档单源句成立 | 条目 3 | 读 `docs/core/design/CONTEXT-COMPACTION.md:533`：公式句 = 核函数名 + 三参；零死坐标（`render-frame.mjs:394-397` / `:413-415` 两处均不在盘上，实读该档 322 行）；零指向批内单测档的担保句 |

**「多面同一 pct」的边界（诚实读数）**：桌面 `postUsage` 在宿主闭包内，不可直调 ⇒ AC-4 的桌面面由**同一输入调核**证明（`agent-host.mjs:169` 的改动后形态 = 一次 `historyReading` 的两个返回值，行扫 + 代码读即判），不进单测档。这是**降级**，不是覆盖。

### 2.9 设计档落点（落点 = §2.14 #2 七行，本节不复制坐标）

七处落点的引文与回读坐标逐行在 **§2.14 #2**，每行同时记着该行的处置现状（六行已在盘，⑥ 已落）。本节不再复述坐标：同一批坐标写两处，两处一定会漂——本批的坐标漂移就是这么来的。

**行文判据（写这些句子的口径）**：设计档只写**现在是什么**；「原先三处同式」这类过去时不进档（历史在 git 与批档）。

### 2.10 集成测试设计（起点 = `test/RTM.md`，按差量答）

实读 `test/RTM.md`：CLI 端 16 个故事（第 16 个「状态行百分比与压缩判据同尺」`:190`，行 16-1 `:197`），VSC 端（`:201`）与 Desktop 端（`:208`）两节**明写「尚无集成用例」**。

| 问 | 答 |
|---|---|
| 本改动**弄坏**哪些行？ | 无。全表无一行断言状态行百分比或 `ctxTokens`（故事 11 的 11-5 只断言「压后仍超 ⇒ 触发压缩」，与本改动的读数面无关） |
| 哪些行**冗余**？ | 无 |
| 缺哪些行？ | **缺 1 行**：用户看得见的那个百分比与压缩判据同尺这件事，全表无行 |

**新行（号先定，标题同号）**：

| 编号 | 怎么做 | 怎么算通过 | 结果 | 证据 |
|---|---|---|---|---|
| 16-1 | CLI 端：恢复一个**带 `estimateSample`** 的会话（`num/den` ⇒ 比 > 1），看状态行的 `context X%` 段 | 显示的 X 与核 `historyReading(mergedLine, provider, sampleRatio).pct` 相等（不是未校准读数）；同一回合 `stats` 第 6 行同值——两处一个数 | 待执行 | `test/integration/context-percent-calibrated.test.mjs` |

- **评估的组件交互**：槽数据（`estimateSample`）→ 核 `restoreTokenSample` / `sampleRatio` → 渲染缓存（`ctxCacheOf`）→ 状态行渲染。
- **业务可观察结果**：用户看到的上下文百分比与压缩实际判据同尺；业务场景（用户据该百分比判断「快压了」）真正需要。
- **入口**：CLI 恢复会话（`resumeSlot`），用户肉眼读状态行。
- **VSC / Desktop 两端**：两节无集成层 ⇒ 本批**不造用例**（跨端那半在 §2.11 记为债，由父侧决定是否另批建层）。

### 2.11 边界（本批不做）

1. **不改端侧显示门**：CLI `ctxPct > 0`（`status-line.mjs:149`）、VSC `pct: null`（`specs.mjs:97`）、核空历史回 0——`docs/core/design/CONTEXT-COMPACTION.md:552`–`:554` 已判「不收正」。
2. **不改 `contextUsage` 的两支承与三段裸估算**：`Segments ≈` 行仍报裸估算并自带 `basis` 标（比 ≠ 1 时三段之和不等于 `total`——上一批已登记，属另一决定）。
3. **不改压缩线 / 阈值 / 守卫 / 校准机制本体**（采样、池化、下界 1、恢复三条校验）。
4. **不合并两口径**：状态行「history 占用」与 stats 首行「全量占用（含 system + tools）」的分母差额保留。
5. **不建 VSC / Desktop 集成层**。

### 2.12 上抛与登记

> ① **[上抛·待裁] 集成面债**：VSC / Desktop 两端无集成层，本改动的跨端同尺只能由 CLI 一端的 16-1 + 单测档证明。要不要另批为两端建集成层——父侧裁（本席不建议在本批扩）。
> ② **[上抛·知会] 批内单测档用毕即删 ⇒ 设计档不得引它作出处**：父侧原话「担保句指向真实用例」。本席的处置是**不指向它**——批内单测档在收口删除，写进设计档就是一条会自己烂掉的指针。担保句改为指向**实现点**（核 `historyReading`）+ **常驻集成行**（RTM 16-1）。这条与父侧给的形不同，明写在此，供裁。
> ③ **[上抛·知会] 两处已知的读数形状差（本批不改）**：`contextUsage` 的 `Segments` 三段裸估算 vs `total` 已乘比（上一批 `#1810` 同批登记过）；CLI 状态行 `ctxTokens` 与 stats `usage.history` 现分属「校准」与「裸估算」两口径——本批只把**显示面两值**（`pct` 与 `Yk`）收成一尺，诊断面 `Segments` 不动。
> ④ **[上抛·知会] 计数口径纠正**：父侧实读 `render-frame.mjs` 为 322 行 —— 本席复核一致（322，口径 = `split('\n').length`），两处旧坐标（`:394-397` / `:413-415`）均不在盘上；CONTEXT-COMPACTION 档内同属死坐标的那一句，已并入 §2.14 #2 ③。

### 2.13 补正（2026-10-27 · 设计席自查，三条机检读数）

**① 案例表 ↔ 验收表：C8 原无 AC ⇒ 补 AC-10**

| AC | 判据 | 回指 | 判法 |
|---|---|---|---|
| AC-10 | 样本比单源（C8） | 条目 2（D5 单源判据） | `node --test .thincoder/tmp/2026-10-27-context-percent-parity.test.mjs` |

AC-10 判的是 §2.3 `sampleRatio` 那一行的「三条校验与 `restoreTokenSample` 同源共用」这句话——此前无 AC 认领：

- 好样本 `{key, num:1473, den:1000, est:ESTIMATOR_VERSION}` ⇒ `sampleRatio(sample, provider) = 1.473`，且两条取比路径同值：`historyPercent(history, provider, sampleRatio(sample, provider))` ≡ `historyPercent(history, provider, tokenRatioOf(agentAfterRestoreTokenSample))`（同一判定，不写第二份）。
- 三种坏样本（`den:0` / `est` 不符 / `key` 不符）⇒ `sampleRatio = 1`（下界 1 守住）。

**AC 全集 = 10 条**（§2.8 的 AC-1–AC-9 + 本节 AC-10）。案例 8 条逐条有归属：C1→AC-1 · C2→AC-2 · C3→AC-3 · C4→AC-4 · C5→AC-5 · C6→AC-6 · C7→AC-7 · C8→AC-10。AC-8 / AC-9 不是案例面（行扫 / 档读）。

**② 两向对齐的三条机检读数**

**(a) 引用集 ↔ 标题集**

- §2 内引用 §1.3–§1.5、§2.1–§2.12 —— 标题全在盘 ✓
- **两处引用错节**（§2.3 末 · §2.6 D5 行原写 `§2.11 AC-8`）：AC-8 实住 §2.8，§2.11 是边界表、无 AC 行 —— 两处已就地改正。
- 跨档引用逐个核过：`docs/core/design/CONTEXT-COMPACTION.md` §6.16.4（该档 `:507` 的粗体小节题）✓ · `docs/core/design/SESSION.md` §6.24（`:889`）✓ · `docs/vsc/design/WEBVIEW.md` §4.6（`:197`）· `D-W33`（`:730`）✓

**(b) 表行 ↔ 汇总计数**

- 对得上的：§2.1 三行 = 「三条」✓ · §2.7 C1–C8 八行 ✓ · §2.8 AC-1–AC-9 九行（+AC-10 ⇒ 十）· §2.9 ①–⑦ 七行 ✓ · §2.11 五条 ✓ · §2.12 ①–④ 四条 ✓
- **一处计数错**：AC-8 写「§2.5 第 2–8 行的**八个**文件」—— 第 2–8 行实为 **7 档**（第 1 行是核本体、第 9/10 行是新建测试档）。**AC-8 的行扫面 = 7 档**。
- §2.10「缺 1 行」核过：`test/RTM.md` 现有 16 个 CLI 故事，行 **16-1 已在盘**（`:197`）✓；其用例档 `test/integration/context-percent-calibrated.test.mjs` 尚未建（实施席建）。

**(c) 断言 ↔ 读数**

设计期未执行任何 AC（设计席不写实现）：AC-1–AC-7 / AC-10 的读数是**计划**（跑批内单测档），AC-8 的行扫 / AC-9 的档读同属计划。设计席已取得的实读只有一条——三档存量长段命中 **76 条 ⇒ 0 条**（`doc_check(report)`，三档 = `docs/core/design/SESSION.md` · `docs/vsc/design/WEBVIEW.md` · `docs/desktop/design/IPC.md`）。

**③ 设计档落点现状（实施席照此核，不重写）**

§2.14 #2 ①–⑥ 已在盘（前一次落盘所留，非本批新写）：`docs/core/design/CONTEXT-COMPACTION.md:533` 现读为「实现点只有一个——核 `historyReading(history, provider, ratio)`」，死坐标与虚假担保句均已不在；`:544` 已把常驻验收指向 `test/RTM.md` 故事 16 行 16-1。

`docs/vsc/design/WEBVIEW.md:730` 的 `D-W33` 已含第三参 `ratio`；`docs/core/design/SESSION.md` §6.24 · `docs/desktop/design/IPC.md:29` / `:81` 同已改到 `historyReading`。⇒ 条目 3 剩下的是**核对 ⑦ 与 §2.14 #2 表逐行对位**，不是重写公式句。

**④ 执行须知（实施席必读）**

- **行数只取 `node` 读数**：`PowerShell Get-Content` 在同一批文件上与 node 差 **26–117 行**（另一次在 `completion.mjs` 上差 **6 行**）。差因本席未立，规则就是不用它——取行数用 `node`（`…split('\n').length`）或 `wc -l` 同口径。
- §2.5 的现状数是设计期 node 实读；实施后逐档重读，收口以实读为准、不以设计值结账。

### 2.14 评审轮次 1 处置（2026-10-27 · 逐号）

> 11 条全认。本节各表**取代** §2.3 / §2.5 / §2.7 / §2.9 / §2.10 的相应旧形；实施席按本节定位，**不按旧行号下手**。

#### #1 🔴 `docs/core/design/SESSION.md` 同节二说 —— 已改（三行一个口径）

本轮回读（改后逐字）：

- `docs/core/design/SESSION.md:897` → ``读数 = `historyReading(mergeAdjacentAssistantEchoes(machineLine), mergedProvider, sampleRatio(data.estimateSample, mergedProvider))`——与 `applySession` 后的 `tokenRatioOf(agent)` 同一取比判定：两处同输入同公式同尺（第三参无缺省）``
- `docs/core/design/SESSION.md:903` → ``第三参 = 估算校准比，**取自槽 `estimateSample`**（`sampleRatio(sample, provider)`——与 `restoreTokenSample` 同一套校验）``（本轮未改，与 `:897` 同口径）
- `docs/core/design/SESSION.md:921` → ``不改 `estimateTokens` / `mergeAdjacentAssistantEchoes`（估算与归并件零改——只组合）；`historyReading` / `historyPercent` 的公式本体不变——`historyPercent(history, provider, ratio)` 三参、`ratio` 无缺省，名面与 export 不变。``

⇒ 「不改 `historyPercent`」那句已从「不做」清单删除；`:897` 的二字面调用已无残留。

#### #2 🟡 §2.9 落点表 —— 旧坐标作废，改为「引文 + 本轮回读坐标」

| # | 档 · 本轮回读坐标 | 引文（逐字） | 处置 |
|---|---|---|---|
| ① | `docs/core/design/CONTEXT-COMPACTION.md:533` | 状态行口径 = **校准后的历史估算 ÷ 窗口**，实现点只有一个——核 `historyReading(history, provider, ratio)` | 已在盘 ✓ |
| ② | 同档 `:535`–`:538`（落点表 ② 的「状态行实现零改…」句**全档已不在**） | stats 第 6 行（`thincoder-core/agent-tools/context.mjs:108`）∥ VSC（`thincoder-vscode/src/specs.mjs:95`）∥ CLI 状态行（`thincoder-cli/src/tui/render-loop.mjs:89`-90 缓存 → `thincoder-cli/src/tui/status-line.mjs:147` 渲染） | 该项随该句消失而核销 |
| ③ | 同档 `:552` | CLI `thincoder-cli/src/tui/status-line.mjs:149` 以 `ctxPct > 0` 才渲染该段；VSC `thincoder-vscode/src/specs.mjs:95`-98 分子 0 ⇒ 返 `null` | 已在盘 ✓ |
| ④ | 同档 `:679`（S3 行） | 第 6 行 pct = 核 `historyReading(history, provider, ratio).pct`（同一调用；端侧零复算式） | 已在盘 ✓ |
| ⑤ | `docs/vsc/design/WEBVIEW.md:199`–`:200` · D-W33 `:730` | `ctxPercentForHistory(history, provider, ratio)`（委托核 `historyReading`——三参，无缺省）∥ 分子 = 核 `historyReading(history, provider, ratio).tokens`（`ratio` = `tokenRatioOf(agent)`） | 已在盘 ✓ |
| ⑥ | `docs/core/design/SESSION.md:897` · `:903` · `:921` | 见 #1 | **本轮改** |
| ⑦ | `docs/desktop/design/IPC.md:29` · `:81` | `ctxPct` = 核 `historyReading(...).pct` 读数投影（端侧零重算·已乘校准比）∥ `ctxTokens` = 核 `historyReading(...).tokens` 直传——与 `ctxPct` **同一调用** | 已在盘 ✓ |

**结论**：七行里六行已在盘，条目 3 剩的真改动只有 ⑥ 一处（本轮已落）。

#### #3 🟡 stats 一个词两个数 —— 取「括号内加标记」

- 弃「第 6 行只出 `%`」：CLI 状态行渲染 `context X% Yk`（`status-line.mjs:150` 的 `ctxTokensHint`），stats 第 6 行存在的意义是复述用户看到的那一行；删掉 token 数就复述不出来了。
- 取「加标记」：第 6 行括号内写 `calibrated history estimate`，与 `Segments ≈` 行的裸 `history` 分名。
- **逐字行已改**：`docs/core/design/CONTEXT-COMPACTION.md:517` → ``Status line: context {statusPct}% ({calibratedHistory} calibrated history estimate / {window} window)``；同档 `:548` 补一句标记语义（已落盘）。
- §2.5 第 2 行改为：`const r = historyReading(agent?.history ?? [], agent?.provider, tokenRatioOf(agent))`；串 = ``Status line: context ${r.pct}% (${r.tokens} calibrated history estimate / ${r.window} window)``。

#### #4 🟡 四新名三问块

`none found` 的判据面 = 全仓 `**/*.mjs` grep 四名一次，**0 命中**（本席实跑）。

| 名 | 三问答案 | 住哪 · 谁消费 |
|---|---|---|
| `historyReading` | `none found: 全仓 **/*.mjs grep 0 命中`——现 `historyPercent`（`token-window.mjs:219`-`:221`）只出 `pct`；`tokens` 的算式现分居 `thincoder-cli/src/tui/render-loop.mjs:90` ∥ `thincoder-vscode/src/specs.mjs:96` | 新导出 `thincoder-core/token-window.mjs`；消费者 = stats / 打开态 / 桌面 / VSC / CLI 五处 |
| `tokenRatioOf` | ``existing but unusable: thincoder-core/token-window.mjs:142 · 逐字名: 无（内联式 `agent?._tokRatio ?? 1`） · failed on: 非导出，只有 `contextUsage` 能取`` | 新导出 `token-window.mjs`；消费者 = `contextUsage:142` 本体 + 五个取比调用点 |
| `sampleRatio` | ``existing but unusable: `thincoder-core/token-window.mjs:205`-`:209`（`restoreTokenSample` 内三道校验 + `Math.max(1, num / den)`） · 逐字名: `"restoreTokenSample"` · failed on: 校验与写入耦合，读面（槽数据 ⇒ 比）取不到`` | 新导出 `token-window.mjs`；判定与 `restoreTokenSample` **同一份**（抽定一次，不写第二份） |
| `ctxCacheOf` | `none found: 全仓 **/*.mjs grep 0 命中`——现缓存更新内联在 `thincoder-cli/src/tui/render-loop.mjs:89`-`:91`，初值在 `thincoder-cli/src/tui/tui-state.mjs:39` | 新导出 `thincoder-cli/src/tui/render-loop.mjs`；消费者 = `render-loop.mjs:89` + `status-line.mjs:146`-`:150` |

**`ctxCacheOf` ↔ `tui-state.mjs:39` 的关系（评审点名要写清）**：初值 `ctxCache: { len: -1, tokens: 0 }` **不改结构**——`len: -1` 恒 ≠ 实长 ⇒ 首帧必落重算支，`ratio` / `window` / `pct` 三键由首次调用补齐；读出方（`status-line`）只读 `ctxCacheOf` 的返回值。

**首帧读到初值的后果已实读**：缓存更新在 `renderRows`（`render-loop.mjs:83`）之后、发生在 `:89` ⇒ 首帧状态行读到初值、`pct` 为 `undefined` ⇒ 显示门 `ctxPct > 0`（`status-line.mjs:149`）为假 ⇒ 该段不显示，与今日同形、零回归。

#### #5 🟡 survey-evidence 补公共源面

§2.6 的 survey-evidence 行尾补：**独立公共文档仓 = 无**（`PROJECT-MANIFEST.json:35` `"publicRepos": []`，本席实读）；**外部一手源 = 不适用**（本笔口径全部来自仓内实现 + 台账 `#1810` ∥ `#1837`，无可对照的外部规范）。

#### #6 🟡 集成行需求回指

- `test/RTM.md:193` 节注已补（本轮落盘）：需求回指 = `docs/core/requirements/CONTEXT-COMPACTION.md`（F-CC1 感知 `:34` ∥ 报面 `:57`「同名输出不得两个无名百分比并存」）。
- §2.10 行 16-1 增「需求回指」列，取值同上；业务主张 = 用户据状态行百分比判断「该压了吗」，而这个百分比必须与压缩实际判据同尺。

#### #7 🟡 CLI 面驱动入口与夹具（C4 / C5 / C6 可执行化）

- **被调函数 = `export function renderStatus(state, agent, cols, slashCommands)`**（`thincoder-cli/src/tui/status-line.mjs:50`）——`buildStatusLine`（`:85`）是私有的，不直接驱动。
- **断言面** = `renderStatus(...)` 返回串含 `context ${ctxPct}%`（`status-line.mjs:150` 的段）；`ctxPct < 80` 时该段不带 ansi 包裹，子串完整可取。
- **最小夹具**：`agent = { history: h, provider: p, config: {}, planMode: false, autoApprove: false, _currentTurn: 0, _maxTurns: 0 }`；`state = { input: [], scroll: 0, processing: false, status: "Ready", permission: null, question: null, picker: null, wizard: null, teamAsk: null, secretPrompt: null, tasks: [], currentTool: null, pendingInput: [], attentionAwaiting: false, tokens: { prompt: 0, completion: 0, cacheHit: 0, cacheMiss: 0, reasoningTokens: 0 }, ctxCache: ctxCacheOf(agent, null) }`；`cols = 120`。
- **`ctxCacheOf` 可 headless 载入（实读）**：`render-loop.mjs:16`-`:19` 四个 import 全是纯函数 / 常量（`render-frame.mjs` · `@thincoder/core/context.mjs` · `ansi.mjs` · `tui-lifecycle.mjs`），无顶层副作用；`ctxCacheOf` 不在渲染路径内 ⇒ 调用不触任何渲染。
- **§2.5 第 10 行补**：集成档标题 = `test('16-1 …')`（与 RTM 号逐字同号）。

#### #8 🟡「无缺省」的后门 —— 补用例与合法 1 的清单

- **新增 C9（agent 不在场）**：`tokenRatioOf(undefined) === 1` ∧ `tokenRatioOf(null) === 1`；且该面读数落**未校准档**（`historyPercent(h, p, tokenRatioOf(undefined)) === historyPercent(h, p, 1)`）——把「降了一层的静默」钉成可断言的值。
- **合法的 1 只有两种**（写进 §2.4）：① 新会话无样本（`agent._tok` 为 `null`，`tokenSampleOf` 落 `null`）；② 打开态槽无 `estimateSample`。**不合法的 1** = 该有 agent 的面拿不到 agent（VSC `panel._agent` 未绑定）——此档由 C9 显式断言，不靠默认值蒙过。
- **两个缓存键的现场**：`ratio` 键 = C5（`agent._tokRatio` 由 1 改 1.5、`history.length` 不变 ⇒ 旧缓存出旧百分比）；`window` 键 = **新增 C10**（同一 `history`，窗口由 131_072 改 32_768——`modelContext` 由 K=128 改 K=32 覆写，长度不变 ⇒ 旧缓存出旧百分比）。
- **新增 C10（边界 · 窗口键）**：`ctxCacheOf(agent, prev)` 先按 C1 夹具（`modelContext: { m: 128 }` ⇒ 131_072）建缓存，再把覆写改成 `modelContext: { m: 32 }`（⇒ 32_768）重调 | `pct` 变大且 `pct === historyPercent(h, p32, ratio)`。

#### #9 🔵 `tui-state.mjs`

§2.5 新增第 11 行：`thincoder-cli/src/tui/tui-state.mjs`（70 行）· `+0 / −0` · **结构不变**（初值 `{ len: -1, tokens: 0 }` 由 `ctxCacheOf` 首次调用覆盖），注释随正（`:39` 的「only recompute when history grows」→ 三个失效键 `len` / `ratio` / `window`）。

#### #10 🔵 `historyReading` 返三键

`historyReading(history, provider, ratio)` → `{ tokens, pct, window }`。`ctxCacheOf` 的 `window` 键直接取该返回值，渲染热路径不再二次 `providerSpec(provider).context`。AC-8 的行扫范围不变。

#### #11 🔵 注释随正（两处「同式」）

并入 §2.5 行 1 / 行 3 的「改什么」列：

- `thincoder-core/token-window.mjs:216` → 「与 CLI 状态行 ∥ VSC `ctxUsageForHistory` **同源**（三处全是这一实现点的投影，端侧零自算式）」。
- `thincoder-core/session-lifecycle.mjs:409` → 「④ 公式 = 核 `historyReading`（与 CLI ∥ VSC 同一实现点的投影）」。

#### 修正后的受影响面（变动行；其余四行不变）

| # | 文件 | 现行数 | 增量 | 改什么（本节修正） |
|---|---|---|---|---|
| 1 | `thincoder-core/token-window.mjs` | 248 | +34 / −4 | 四符号；`historyReading` **返 `{ tokens, pct, window }`**（#10）；`:216` 注释改「同源」（#11） |
| 2 | `thincoder-core/agent-tools/context.mjs` | 182 | +2 / −2 | 第 6 行 = `historyReading` 的两个返回值 + `calibrated` 标记（#3） |
| 3 | `thincoder-core/session-lifecycle.mjs` | 427 | +2 / −1 | `:425` 第三参；`:409` 注释改「投影」（#11） |
| 7 | `thincoder-cli/src/tui/render-loop.mjs` | 130 | +9 / −2 | `ctxCacheOf` 导出；`:17` 的 `estimateTokens` 导入换成 `historyReading` / `tokenRatioOf` |
| 8 | `thincoder-cli/src/tui/status-line.mjs` | 205 | +2 / −3 | `:146`-`:150` 全取 `state.ctxCache`；显示门 `:149` 零改 |
| 11 | `thincoder-cli/src/tui/tui-state.mjs`（新列） | 70 | +0 / −0 | 结构不变 · 注释随正（#9） |

计数核对：本表 **6 行** = 变动 5 行（1 / 2 / 3 / 7 / 8）+ 新增 1 行（11）；§2.5 原十行的 4 / 5 / 6 / 9 / 10 不变。跨档上限不变（最大档 `token-window.mjs` 改后 ≈ 278）。

#### 案例表增量（接 §2.7 的 C1–C8）

| # | 态 | 输入 | 期望 | AC |
|---|---|---|---|---|
| C9 | 边界（agent 不在场） | `tokenRatioOf(undefined)` / `tokenRatioOf(null)` | 皆 `=== 1`；该面读数 = 未校准档（与 `ratio = 1` 逐位相等） | AC-11 |
| C10 | 边界（窗口键失效） | 同一 `history` · 同一 `ratio`；provider 两次：① C1 夹具（`modelContext: { m: 128 }` ⇒ 131_072）② 同一 provider 只把覆写改 `modelContext: { m: 32 }` ⇒ 32_768（K→token 唯一乘点：`thincoder-core/model-specs.mjs:378`） | `pct` 变大 ∧ `pct === historyPercent(h, p32, ratio)` ∧ 两次 `history.length` 相同 | AC-12 |

C4 / C5 / C6 的驱动面按 #7 落（`renderStatus` + 上述最小夹具）。

#### AC 全集 = 13 条

- AC-1–AC-7 · AC-10：不变（§2.8 / §2.13 ①）。
- **AC-11**（新）：`tokenRatioOf` 的缺 agent 档钉成 1 ∧ 未校准档（C9）· 回指条目 2 · 判法 `node --test .thincoder/tmp/2026-10-27-context-percent-parity.test.mjs`。
- **AC-12**（新）：窗口键失效即重算（C10）· 回指条目 1（D5）· 同上判法。
- **AC-13**（新）：stats 第 6 行带 `calibrated` 标记 · 回指条目 3（#3）· 判法 = 行扫 `thincoder-core/agent-tools/context.mjs` 第 6 行字面含 `calibrated history estimate` ∧ `docs/core/design/CONTEXT-COMPACTION.md:517` 逐字行同形。
- AC-8（端侧零自算式 · 7 档行扫）· AC-9（设计档单源句 · 档读）不变。

**案例 ↔ AC 对位**：C1→AC-1 · C2→AC-2 · C3→AC-3 · C4→AC-4 · C5→AC-5 · C6→AC-6 · C7→AC-7 · C8→AC-10 · C9→AC-11 · C10→AC-12。案例 **10 条**逐条有 AC；AC-8 / AC-9 / AC-13 是扫描面与档读面，无案例。AC 全集 13 条。

#### 本节处置对位（逐号不漏）

| 编号 | 处置 | 落点 |
|---|---|---|
| 1 🔴 | 已改（三行） | `docs/core/design/SESSION.md:897` · `:921` |
| 2 🟡 | 旧坐标作废，改「引文 + 回读坐标」 | 本节「#2」表（七行） |
| 3 🟡 | 取「加标记」 | `docs/core/design/CONTEXT-COMPACTION.md:517` · `:548` · §2.5 行 2 |
| 4 🟡 | 四行三问块 + `tui-state` 关系 | 本节「#4」表 |
| 5 🟡 | 补公共源面 | §2.6 survey-evidence（本节 #5 给逐字补句） |
| 6 🟡 | 增需求回指 | `test/RTM.md:193` · §2.10 行 16-1 |
| 7 🟡 | 驱动入口 + 夹具 + 标题形 | 本节 #7 · §2.5 行 10 |
| 8 🟡 | C9 / C10 + 合法 1 清单 + 两键现场 | 本节 #8 · AC-11 / AC-12 |
| 9 🔵 | 新列第 11 行 | §2.5 行 11 |
| 10 🔵 | `historyReading` 返三键 | §2.3 · AC-8 范围不变 |
| 11 🔵 | 两处注释随正 | §2.5 行 1 / 行 3 |

### 2.15 收口：状态行归并 + §3 锚形式清理（2026-10-27 · 父侧判 · 本段）

**① 两条状态行归并。** `:67` 是 `batch` 工具管的那一行（段内首命中、原位改写）；`:70` 的手写重复行已删。

进度信息按父侧口径移入正文，不留在状态位。现在 `:70` 读作：

> 本段进度：评审轮次 1 十一条已全部处置（逐号见 §2.14）；本稿待第二轮评审。

状态位只剩一关键词加日期，经工具改写后逐字为 `**状态行**：设计完成 2026-10-27`。

**② §3 九条命中清零。** `doc_check(report)` 的原始清单 = 8 条锚 + 1 条长段。行号不记——批档是 append-only，段内行号每次追加即漂；按内容定位：

- 8 条裸档名锚，分布在 `docs/core/design/CONTEXT-COMPACTION.md` · `docs/core/design/SESSION.md` · `docs/vsc/design/WEBVIEW.md` · `docs/desktop/design/IPC.md` 四档（成对并列写在一格里）
- 1 条 404 字长段（§3 轮次 1 附注段）

处置 = 裸档名补成仓根相对全路径（同上四档）。

长段按句界插空行，字面零改：404 字拆成 258 / 51 / 95 三段。

**③ 自报越段（同 §2.35 ⑥ / §2.36 ② 口径）。** 本轮 8 笔编辑里 **7 笔落在 §3 轮次 1（评审子代理段）**，只有第 1 笔（状态行归并 / 进度句）在本席 §2。

改因 = 收口文档门判整档，不判本席段。按「一段一作者」，那 7 笔本不属本段——**若父侧判越界，回退 §3 那 7 笔即可，§2 侧不受影响。**

**④ 一处未改（报而不动）。** §3 轮次 1 评审表第 2 行（清晰度条）的单元格里有一个未转义 `|`（`「同档 `:536` | 「状态行实现零改…」」`），该表格行因此多出一个单元格，渲染错列。

修法二选一（写成 `\|`，或把 `|` 换成 `·`），但两法都会动评审记录的字节，越出「只改指针形式、零字面改动」的授权 ⇒ 本席不动，交父侧裁。

**⑤ 机检读数**：`doc_check(mode:"gate", docs=["docs/batches/2026-10-27-context-percent-parity.md"], target="D:\\teamcode\\thincoder")` ⇒ `DOC-CHECK GATE: PASS`（1 档全清，0 段超长）。

### 2.16 修正轮（评审轮次 2 的 N1 / N2 + §2 全档坐标复扫 · 2026-10-27）

**① N1 —— 三处坐标与文对不上**

| 处 | 旧读数 | 本轮回读 | 差因 |
|---|---|---|---|
| `§2.14 #2` ③ | `:550` | `:552` | #3 在 `:548` 插了标记语义两行，旧读数后移 2 行——本轮修法自己造成的漂移 |
| `§2.14 #2` ④ | `:677`（S3 行） | `:679` | `:677` 是 S1 行；评审轮次 2 对 ④ 打的「✓」用的也是这个旧值 |
| `§2.6` survey-evidence | `:536` / `:538` / `:541` / `:665` · SESSION `:845` · WEBVIEW `:182` / `:649` · IPC `:75` ·「15 个故事」 | `:546` / `:552` / `:555` / `:679` · `:897` / `:903` / `:921` · `:197` / `:199`–`:200` · `:81` · 16 个故事 | 六组全部按引文重新定位；「两口径」句在 `:546`，显示门在 `:552`，先例在 `:555` |

**② N1 的根因处理**：`§2.9` 的落点表整表删除，改为指向 `§2.14 #2`。同一批坐标写两处，第二处必然漂——删掉第二处，不再同步第二遍。

**③ N2 —— C10 的构造法写死，同因的 C1 一并改**

`MODEL_SPECS` 全表 context 最小 128_000（`thincoder-core/model-specs.mjs:68`），**没有 32K 模型行** ⇒「128K 切 32K」按字面不可构造。改为 L1 人工声明（K 单位）钉死窗口，与静态表无关：

- C1 夹具：`provider = { name: "t", model: "m", modelContext: { m: 128 } }` ⇒ 窗口 = 128 × 1024 = **131_072**。
- C10 两次：同一夹具 ∥ 只把覆写改成 `modelContext: { m: 32 }` ⇒ **32_768**。

**同因再抓一处（评审两轮均未提）**：C1 原写 `{format:"openai", model:"m"}`（128K 窗）——`model: "m"` 会**前缀命中** `mimo-v2.6-pro`（1M 档，`thincoder-core/model-specs.mjs:170`）⇒ 窗口并不是 128K，用例照字面写必红。改用 L1 钉死后，该面不再依赖查表命中。

**④ 复扫方法与读数**

- 面 = §2 全段。正则抓「路径:行」与「裸 `:行`」两形，共 **175** 处、去重 **87** 个目标，逐个取目标档实读行对文。
- 读数：**除下列刻意的旧值引用外，零处对不上。**
- 刻意保留三处（都是「引旧值为死」的记法，不是失效引用）：§2.8 AC-9 与 §2.12 ④ 的 `render-frame.mjs:394-397` / `:413-415`；`§2.14 #2` ② 的 `:535`–`:538`（该行据实读记「所指句全档已不在」）。
- 行数口径：`render-frame.mjs` = **322**（`split('\n').length`），与父侧读数一致；换「非空行数」口径则差 1。本批行数一律取前者。

**⑤ 范围外两处（报而不动——本批授权只到 §2）**

1. `docs/core/design/CONTEXT-COMPACTION.md:43` 写 `PROJECT-MANIFEST.json:54`，而 `publicRepos` 在 `PROJECT-MANIFEST.json:35`（实读全档仅此一处）⇒ 该坐标失效。修它在设计档，越本批授权。
2. §3 轮次 2 第 2 行把 ④ 的 `:677` 记作「✓」，与本轮回读（`:679`）不一致——§3 是评审段，本席不动。

## §3 设计评审（评审子代理）
**状态行**：评审通过（轮次 3（补录轮）：复核上轮 N1（:552）/ N2（C10 32K 档）皆已修；🔴 0 · 🟡 5 · 🔵 4）



### 轮次 1（评审子代理）

**评审轮次 1 · 独立设计评审 · VERDICT: changes-required**

计数：🔴 1 · 🟡 7 · 🔵 3（共 11 条）

| # | 类别 | 严重度 | 问题 | 建议 |
|---|------|--------|------|------|
| 1 | 文档归属 | 🔴 | §2.9 ⑥ 只改写 `docs/core/design/SESSION.md:903`（「第三参 = 估算校准比，**取自槽 `estimateSample`**」），同节 `:897` 仍写两参调用「读数 = `historyPercent(mergeAdjacentAssistantEchoes(machineLine), mergedProvider)`」，且 `:921` 仍列「不改 `historyPercent` / `estimateTokens` / `mergeAdjacentAssistantEchoes`」。本批把 `historyPercent` 改成三参无缺省 ⇒ 落地后同一机制在同一节有两条互斥描述，`:897` 那条字面调用恒返 `NaN`，`:921` 那句与本批所为相反 | 把 ⑥ 扩成三处：`:897` 改写为三参形（取比 = `sampleRatio`）；`:921` 的「不改」清单删去 `historyPercent`（或收成「不改其公式，只加可选比参数」）；落盘后回读 `:897`/`:903`/`:921` 三行确认无二说 |
| 2 | 清晰度 | 🟡 | §2.9 落点表坐标是落地前读数，已与盘面对不上：②「同档 `:536` \| 「状态行实现零改（字面被测试组①机判锁定）」」——该句全档已不在；③「同档 `:538`」现读为「VSC（`thincoder-vscode/src/specs.mjs:95`）∥ CLI 状态行（…）」，显示门句实住 `docs/core/design/CONTEXT-COMPACTION.md:550`「以 `ctxPct > 0` 才渲染该段」；⑤ 引 `docs/vsc/design/WEBVIEW.md:182` · `:649`（D-W33），实住 `:199`–`:200` · `:730`；⑥ 引 `docs/core/design/SESSION.md:845`，实住 `:903`；⑦ 第二个坐标 `:75`，实住 `docs/desktop/design/IPC.md:81` | 每行改为「引文 + 回读行号」（先把要改的句子逐字抄进表，再附本次回读坐标），并在 §2.13 ③ 后补一句「以下坐标 = 本轮回读」；实施前按引文重新定位，不照旧行号下手 |
| 3 | 验收 / 用户可见面 | 🟡 | §2.5 第 2 行让 stats 第 6 行括号内的历史估算改取 `historyReading` 的 `tokens`，而同一份输出第 3 行仍是裸估算「· history ${usage.history}」（`thincoder-core/agent-tools/context.mjs:105`）⇒ 一个 `history` 词在同一份 stats 里有大小两个数，且括号里没有任何「已校准」标记；§2.12 ③ 只登记了差额，没有让读者在输出面分得清 | 括号内加标记（如 `calibrated history estimate`），或第 6 行干脆不出 token 数只出 `%`；二者择一写进 §2.5 第 2 行与 `docs/core/design/CONTEXT-COMPACTION.md:517` 的逐字行 |
| 4 | 既有件检查 | 🟡 | 四个新名 `historyReading` / `tokenRatioOf` / `sampleRatio` / `ctxCacheOf` 无三问块（`existing: …` / `none found: …` / `existing but unusable: …`）；答案散在正文里（`sampleRatio` 复用 `restoreTokenSample` 校验、`tokenRatioOf` 抽出 `contextUsage` 内的 `agent?._tokRatio ?? 1`——「中性值 1 的**唯一**出处」），`historyReading` 与 `ctxCacheOf` 则没有任何「查过什么、有无同名件」的记录 | 在 §2.3/§2.4 之间补一张四行表：名 · 住哪（文件:行）· 逐字名 · 谁消费，并按三问块形给答案；`ctxCacheOf` 特别要写清它与 `tui-state.mjs` 里 `ctxCache` 初值的关系 |
| 5 | 勘察证据 | 🟡 | §2.6 的 survey-evidence 只列五处仓内档（`docs/core/design/CONTEXT-COMPACTION.md` / `docs/core/design/SESSION.md` / `docs/vsc/design/WEBVIEW.md` / `docs/desktop/design/IPC.md` / `test/RTM.md`），没有记录公共源面（独立公共文档仓 / 外部一手档）查没查、有没有相关内容；而 `docs/core/design/CONTEXT-COMPACTION.md:43` 明写 `publicRepos` = `[]` —— 这正是该记「无相关」的那一格 | survey-evidence 行尾补一句：独立公共文档仓 = 无（`PROJECT-MANIFEST.json` `publicRepos` = `[]`，实读）；外部一手源 = 不适用（本笔口径来自仓内实现与台账 #1810 ∥ #1837） |
| 6 | 集成行回指 | 🟡 | §2.10 新行 16-1 给了交互组件 / 业务可观察结果 / 入口，但没有「回指哪个业务需求」；`test/RTM.md:193` 的节注也只回指设计档（「回指 = docs/core/design/CONTEXT-COMPACTION.md（stats 面「与状态行 ctx% 的单源关系」条：单源 = 核 `historyReading`）」），而同表其余故事都带回指到需求档 | §2.10 行 16-1 增「需求回指」列（如 `docs/core/requirements/CONTEXT-COMPACTION.md` 的 F-CC1 读数面 / 台账 #1810 的业务主张）；RTM 节注同补，别只指设计档 |
| 7 | 清晰度 | 🟡 | C4 / C5 / C6 要求断言「CLI 状态行渲染串里的 `context N%`」，但没点名驱动入口——`buildStatusLine`（`thincoder-cli/src/tui/status-line.mjs:85`）是私有函数，可取的是 `export function renderStatus(state, agent, cols, slashCommands)`（`:50`），且 `state.ctxCache` 夹具形态未给；C5 要直驱的 `ctxCacheOf` 住 `render-loop.mjs`（该档 import 了 `render-frame.mjs` / `ansi.mjs`，用例档能否 headless 载入未写）。另：新集成档标题形 `test('16-1 …')`（号与 RTM 同号逐字）未写进 §2.5 第 10 行 | 在 §2.7 给每条 CLI 面用例点明被调函数与最小 `state` 夹具（`{ ctxCache, processing:false, … }`），在 §2.5 第 10 行补一句「标题 = `test('16-1 …')`」；`ctxCacheOf` 若需从渲染档导出，写明它不触任何渲染副作用 |
| 8 | 无缺省论证的边界 | 🟡 | §2.3 用「忘传 ⇒ `NaN` 当场可见」来否缺省，但五个调用点走 `tokenRatioOf(agent)`（`agent?._tokRatio ?? 1`——「中性值 1 的**唯一**出处」）：agent 不在场（如 `thincoder-vscode/src/extension/panel-callbacks.mjs:231` 的 `panel._agent` 尚未绑定）时静默回 1，正是本条要杀的失败形状，只是降了一层；`ctxCacheOf` 新增的两个失效键（`ratio` / `window`）只给了散文场景（`restoreTokenSample` / 切模型），既无观测引文也无复现路径 | §2.7 补一条「agent 不在场」形状的用例（`tokenRatioOf(undefined) === 1` 且该面读数为未校准档），并在 §2.4 写明哪几种 1 是合法的（新会话无样本）；`ctxCacheOf` 的两个键各补一行现场（切模型后 `history.length` 不变而窗口变 ⇒ 旧缓存出旧百分比）或一条复现步骤 |
| 9 | 受影响文件 | 🔵 | §2.5 未列 `thincoder-cli/src/tui/tui-state.mjs`——该档 `:39` 的 `ctxCache: { len: -1, tokens: 0 }` 是缓存形态的另一个声明点，改后缺 `ratio` / `window` / `pct`（首帧读 `pct` = `undefined` ⇒ 段不显示，与今同，无回归，但注释与形状会陈旧） | 该行补进 §2.5（「结构不变 · 注释随正」）或明写「初值形态由 `ctxCacheOf` 首次调用覆盖，不改此行」 |
| 10 | 简化机会 | 🔵 | `ctxCacheOf` 的缓存键需要窗口，只能再调一次 `providerSpec(provider).context`；`historyReading` 已经算过同一个量却只返 `{ tokens, pct }` | 让 `historyReading` 返 `{ tokens, pct, window }`（或让 `ctxCacheOf` 用 `historyReading` 的 `window`），渲染热路径少一次同量派生；AC-8 的行扫范围不变 |
| 11 | 代码注释随正 | 🔵 | 受影响文件内仍有两处「同式」表述未列入改动：`thincoder-core/token-window.mjs:216`「与 CLI 状态行（`render-frame.mjs` 式）与 VSC `ctxPercentForHistory` **同式**」、`thincoder-core/session-lifecycle.mjs:409`「④ 公式 = `historyPercent`」——本批后两端是投影而非同式 | 并列进 §2.5 第 1 / 3 行的「改什么」列（`+0 / −0` 不算增量，只算同批一次性收正） |

**评审附注（不做缺陷）**：`§2.5` 八档行数逐档实读复算——`token-window.mjs` 248 · `agent-tools/context.mjs` 182 · `session-lifecycle.mjs` 427 · `agent-host.mjs` 339 · `specs.mjs` 102 · `panel-callbacks.mjs` 360 · `render-loop.mjs` 130 · `status-line.mjs` 205，八档全对；无档越 500 软线，无拆分需要。

§2.13 ② 的对齐自查（AC-8 七档、C1–C8↔AC 全归属、AC 全集 10 条）实读成立。

closest-precedent 行（`contextUsage`，偏离理由 = `sessionReading` 无 agent）与 §2.12 ② 的上抛（担保句不指批内单测档）均齐。

VERDICT: changes-required

### 轮次 2（评审子代理）

**评审轮次 2 · 独立设计评审 · VERDICT: pass**

计数：上轮 11 条（🔴1 · 🟡7 · 🔵3）**逐条复核 ⇒ 11 条全部 Fixed**（0 Unfixed · 0 零理由非修）；本节新发现 🔴 0 · 🟡 2 · 🔵 0。

| # | 上轮# | 文件 | 严重度 | 状态 | 证据（本轮回读） |
|---|-------|------|--------|------|------|
| 1 | 1 | `docs/core/design/SESSION.md` | 🔴 | Fixed | `:897` 现读「读数 = `historyReading(mergeAdjacentAssistantEchoes(machineLine), mergedProvider, sampleRatio(data.estimateSample, mergedProvider))`」·`:903`「第三参 = 估算校准比，**取自槽 `estimateSample`**」·`:921`「不改 `estimateTokens` / `mergeAdjacentAssistantEchoes`（估算与归并件零改——只组合）；`historyReading` / `historyPercent` 的公式本体不变——`historyPercent(history, provider, ratio)` 三参、`ratio` 无缺省，名面与 export 不变」——同节二说已消，三行同口径 |
| 2 | 2 | 批档 §2.14 #2 | 🟡 | Fixed | 改为「引文 + 回读坐标」七行，本轮逐条实读：① `docs/core/design/CONTEXT-COMPACTION.md:533`「实现点只有一个——核 `historyReading(history, provider, ratio)`」✓ · ④ `:677`「第 6 行 pct = 核 `historyReading(history, provider, ratio).pct`（同一调用；端侧零复算式）」✓ · ⑤ `docs/vsc/design/WEBVIEW.md:199`–`:200` / `D-W33 :730` ✓ · ⑥ SESSION `:897`/`:903`/`:921` ✓ · ⑦ `docs/desktop/design/IPC.md:29`/`:81` ✓ · ② 所指句全档已不在 ✓（仅 ③ 坐标见本轮新条） |
| 3 | 3 | `docs/core/design/CONTEXT-COMPACTION.md` | 🟡 | Fixed | `:517` 现读「Status line: context {statusPct}% ({calibratedHistory} calibrated history estimate / {window} window)」·`:548`「标记 `calibrated` 即为分辨这两个数而设」·AC-13 行扫（§2.14）——「一个词两个数」在输出面可分 |
| 4 | 4 | 批档 §2.14 #4 | 🟡 | Fixed | 四行三问块齐（`historyReading` / `ctxCacheOf` = `none found`；`tokenRatioOf` / `sampleRatio` = `existing but unusable` + 逐字名 + failed on），并列 `ctxCacheOf ↔ tui-state.mjs:39` 关系与首帧后果 |
| 5 | 5 | 同上 #5 | 🟡 | Fixed | 「独立公共文档仓 = 无（`PROJECT-MANIFEST.json:35` `"publicRepos": []`，本席实读）；外部一手源 = 不适用」已记录（落 §2.14；§2.6 正文按 append-only 未改，见新条） |
| 6 | 6 | `test/RTM.md` | 🟡 | Fixed | `:193` 现读「节注：需求回指 = `docs/core/requirements/CONTEXT-COMPACTION.md`（F-CC1 感知 `:34`「模型可查当前上下文的用量与构成」∥ 报面 `:57`…）」；§2.14 #6 同补设计侧与业务主张 |
| 7 | 7 | 批档 §2.14 #7 | 🟡 | Fixed | 驱动 = `renderStatus(state, agent, cols, slashCommands)`（`:50`；`buildStatusLine` `:85` 私有）、断言面 `context ${ctxPct}%`、最小 `agent` / `state` 夹具逐键给出、headless 载入判据、§2.5 第 10 行标题形 `test('16-1 …')` |
| 8 | 8 | 同上 #8 | 🟡 | Fixed | 新增 C9（`tokenRatioOf(undefined/null) === 1` ∧ 落未校准档）+ C10（窗口键）+ 「合法的 1 只有两种 / 不合法的一档」清单 + AC-11 / AC-12 |
| 9 | 9 | 批档 §2.5 行 11 | 🔵 | Fixed | 新列 `thincoder-cli/src/tui/tui-state.mjs`（70 行）· `+0 / −0` · 结构不变 · 注释随正 |
| 10 | 10 | 同上 #10 | 🔵 | Fixed | `historyReading` → `{ tokens, pct, window }`，`ctxCacheOf` 的 `window` 键直取；§2.3 表内旧形由 §2.14 首句「本节各表取代」覆盖 |
| 11 | 11 | 同上 #11 | 🔵 | Fixed | `thincoder-core/token-window.mjs:216` / `thincoder-core/session-lifecycle.mjs:409` 两处「同式」并入 §2.5 行 1 / 行 3 改写列 |
| N1 | (new) | 批档 §2.14 #2 ③ · §2.6 | 🟡 | New | §2.14 #2 ③ 记「同档 `:550`」，但该显示门句实住 `:552`：`docs/core/design/CONTEXT-COMPACTION.md:552`「**空历史口径（保留分歧 · 登记）**：`historyPercent([])` = **0**（纯公式——分子 0）；两端把「零值不显示」的门放在**端侧显示层**（CLI `thincoder-cli/src/tui/status-line.mjs:149` 以 `ctxPct > 0` 才渲染该段…」。差因 = #3 的修法在 `:548` 插入两行 ⇒ 旧 :550 后移 2 行（同一类缺陷由本轮修法再生）。同因第二处：批档 `:167`「`:536` 状态行实现零改 · `:538` 显示门」等旧坐标仍在，而取代句 `:296`「本节各表**取代** §2.3 / §2.5 / §2.7 / §2.9 / §2.10 的相应旧形」未含 §2.6。引文逐字、可按文定位 ⇒ 可选，不阻断 |
| N2 | (new) | 批档 §2.14 #8 / C10 | 🟡 | New | C10 写「provider 由 128K 模型切 32K」（批档 `:366`「C10 | 边界（窗口键失效） | 同一 `history`，provider 由 128K 模型切 32K | `pct` 变大 ∧ `pct === historyPercent(h, p32, ratio)` | AC-12」），但 `MODEL_SPECS` 全表 context 档最小 128_000（`thincoder-core/model-specs.mjs:68`「{ context: 128_000, maxOutput: 32_000 }],」最小行；`:249`「const DEFAULT_SPEC = { context: 128_000, maxOutput: 32_000 }」）——32K 只能经 provider 覆写（L1 `modelContext` ∥ L2 `context` K 单位）构造，设计未写构造法；实施席须自找路 ⇒ 可选，不阻断 |

**评审附注（不做缺陷）**：`§2.14` 的 AC 计数自洽（AC-1–13 = 13 条；C1–C10 十条逐条有 AC，AC-8/9/13 为扫描面与档读面）；C1 的「128K 窗」假定与兜底档一致（`thincoder-core/model-specs.mjs:249`）；批档 `:296` 的「取代」声明使 §2.3 旧形（`{ tokens, pct }`）不构成二说。

VERDICT: pass

### 轮次 3（评审子代理）

**评审轮次 3 · 独立设计评审（补录轮） · VERDICT: pass**

计数：🔴 0 · 🟡 5 · 🔵 4（共 9 条）；上轮 11 + 2 条复核结论见下。

**上轮两条新发现复核（本轮逐条实读，非转述）**

- **N1（`:550` → `:552`）已修**：批档 `docs/batches/2026-10-27-context-percent-parity.md:308` 现记「同档 `:552`」，引文与盘面逐字一致——`docs/core/design/CONTEXT-COMPACTION.md:552`「CLI `thincoder-cli/src/tui/status-line.mjs:149` 以 `ctxPct > 0` 才渲染该段；VSC `thincoder-vscode/src/specs.mjs:95`-98 分子 0 ⇒ 返 `null`」；同因第二处（§2.6 survey-evidence 旧坐标）已复扫，现有坐标 `:533` · `:546` · `:552` · `:555` · `:679` / SESSION `:897` · `:903` · `:921` 逐条对上盘面；§2.9 旧落点表整表删除改指针（批档 `:204`「本节不再复述坐标」）⇒ 二处并存已消。
- **N2（C10 的 32K 档）已修**：C10 构造法写死为 L1 人工声明——批档 `:395`「同一 provider 只把覆写改 `modelContext: { m: 32 }` ⇒ 32_768」；C1 同步钉 `{ m: 128 }` ⇒ 131_072（批档 `:177`「`provider = { name: "t", model: "m", modelContext: { m: 128 } }`」）；同因自查发现的前缀命中问题亦随之消解（批档 `:473`「`model: "m"` 会**前缀命中** `mimo-v2.6-pro`」）。
- 复核附带读数：`model-specs.mjs` 源档本轮未读（不在评审面）；L1 字段形式在五档评审面内零命中——见新条 7（标 unverified，不阻断）。

**本轮实读面（评审档五处 + 批档 §2 设计面）**

- 单源句逐处对上：CONTEXT-COMPACTION `:533`（「实现点只有一个——核 `historyReading(history, provider, ratio)`」）· `:544`（常驻验收指向 RTM 16-1）· `:548`（`calibrated` 标记语义）· `:679`（S3 行）；SESSION `:897` · `:903` · `:921`；WEBVIEW `:199`–`:200` · `:730`（D-W33）；IPC `:29` · `:81`；RTM `:193`（节注四组件 + 需求回指）· `:197`（行 16-1）。
- 集成设计（准则 12）：§2.10 从 `test/RTM.md` 起步答差量（坏行 0 / 冗余 0 / 缺 1 行 = 16-1），组件交互 / 业务可观察结果 / 入口 / 需求回指四件齐；RTM 行 16-1 已在盘（`:197`），编号先定、标题同号 `test('16-1 …')`（批档 `:353`）。
- 受影响文件（准则 8）：§2.5 十行皆带现行数 + 增量，改后最大档 ≈278 行（无 500 线越级、无拆分计划需要）；两测试档亦标（0 / ≈170 · 0 / ≈90）。
- 验收判法（准则 12 后半）：= `node --test <批内单测档>`（改面单测档），**非**全量套件——合规；集成半在收口行报。
- 无项目标准档 / 无文档地图（本次评审上下文未提供）⇒ 方法论合规按 Project Guide + 准则判断，文档归属按「该主题的拥有档」逐处比对，此限制登记。

| # | 类别 | 严重度 | 问题 | 建议 |
|---|------|--------|------|------|
| 1 | 文档状态 / 清晰度 | 🟡 | `docs/core/design/CONTEXT-COMPACTION.md:552` 仍以单参形写空历史口径：「`historyPercent([])` = **0**（纯公式——分子 0）」，而同档 `:533` 明写三参无缺省（「`ratio` = 该 agent 的估算校准比，经 `tokenRatioOf(agent)` ∥ 槽样本经 `sampleRatio(sample, provider)` 取，**无缺省**」），批档 C7/AC-7 又把「忘传比 ⇒ `NaN`」钉成判据 ⇒ 该字面形在新签名下返 `NaN` 而非 `0`。与轮次 1 的 🔴 #1 同类（字面调用恒返 `NaN`），但此处只涉记法缩写、不改变口径语义 ⇒ 定 🟡 | 该句的调用形补齐三参（如 `historyPercent([], provider, ratio)`，或直接写「核 `historyReading(...).pct` 对空历史 = 0」），与 `:533` / SESSION `:921` 同一书写形；改后回读 `:552` 与`:533` 两行确认无二形 |
| 2 | 验收可判性 | 🟡 | 全部 AC 判法指向的档在工作区不存在：批档 `:190`「`node --test .thincoder/tmp/2026-10-27-context-percent-parity.test.mjs`」（§2.7 表头 `:173` · §2.5 行 9 `:150` 同路径），而盘上批内单测档实住 `docs/batches/2026-10-27-context-percent-parity.test.mjs`（`D:\teamcode\**/.thincoder/tmp/*` glob 零命中）——该位置也正是本档记的批内单测约定（`docs/core/design/CONTEXT-COMPACTION.md:399`「`docs/batches/<batch>-<topic>.test.mjs`」） | 把 AC-1–AC-7 / AC-10–AC-12 的判法串与 §2.5 行 9、§2.7 表头的路径统一改到 `docs/batches/2026-10-27-context-percent-parity.test.mjs`（或明写「`.thincoder/tmp/` 为新建位置，现盘 `docs/batches/` 那份作废」），两处逐字一致 |
| 3 | 清晰度 | 🟡 | VSC 派生单点的符号名在评审档与批档不是同一个：`docs/vsc/design/WEBVIEW.md:200`「派生单点 = `thincoder-vscode/src/specs.mjs` `ctxPercentForHistory(history, provider, ratio)`（委托核 `historyReading`——三参，无缺省）」（D-W33 `:730` 同），而批档改的是同档 `:95` 那个 `ctxUsageForHistory`（`:133`「`ctxUsageForHistory(history, provider, ratio)` 委托核 `historyReading`」），`docs/core/design/CONTEXT-COMPACTION.md:538` 又把消费面指成 `specs.mjs:95`；两个符号实为两条注册行（`docs/core/design/API-CONTRACT.md:4438` / `:4439`，范围外但已实读）⇒ 实施席无法判断第三参到底落在哪一个、还是两个都要 | 在批档 §2.4 / §2.5 行 5 与 WEBVIEW `:200` 各写清三件：`ctxUsageForHistory`（`:95`）与 `ctxPercentForHistory`（`:101`）谁取 `ratio`、谁转口、webview 消费哪一个；两档用同一符号名描述同一件事 |
| 4 | 文档状态（跨档滞后） | 🟡 | `docs/desktop/design/IPC.md:29` 的「读数单源 = `thincoder-core/token-window.mjs:160`」既未写符号名，又与同档 `:81`（「核 `historyReading(...).pct` 直传 · 端零重算 · 已乘校准比」）及 CONTEXT-COMPACTION `:533` 确立的实现点名不对位；且该行号与批档记的 `historyPercent` 落点（`:219`-`:221`）不一致——两处坐标必有一处陈旧（源档未读，标 unverified） | 该行「读数单源」改为符号名 + 现读坐标（`historyReading`，与 `:81` 同一名），并回读 `thincoder-core/token-window.mjs` 把 `:160` 逐条核准或删除；同名坐标散在 API-CONTRACT 登记面时同批一并对齐 |
| 5 | 文档状态（边界句射程） | 🟡 | `docs/core/design/SESSION.md:921` 的「不做（边界）」仍含「不改 CLI / VSC 状态行」，而本批正是改这两个面：CLI `thincoder-cli/src/tui/status-line.mjs:146`-`:150` 改读缓存、VSC `specs.mjs:95`-`:101` 改委托核（批档 `:148`–`:149`）⇒ 落地后该句作为系统事实为假，作为 §6.24 自身范围又未写明射程 | 该句收成射程明确的形（如「本节（打开态读数出口）不改 CLI / VSC 状态行——状态行的改动归 stats/状态行单源面」），或随本批改为「状态行只改取数来源、不改显示门 `ctxPct > 0`」 |
| 6 | 数值漂移 | 🔵 | 批档 `:197` AC-8 仍写「行扫 §2.5 第 2–8 行的八个文件」，而 §2.13 ②(b) 已判定「**AC-8 的行扫面 = 7 档**」（§2.5 第 2–8 行实为 7 行）——两处计数并存 | AC-8 行就地改成「7 档」并保留 §2.13 的算式说明；行扫面清单按文件名列，不按行号区数 |
| 7 | 既有件 / 证据 | 🔵 | C1 / C10 夹具靠 `provider.modelContext: { m: 128 | 32 }` 钉窗（批档 `:177` · `:395`），但该字段形式在五处评审档内零命中（core design 树 + WEBVIEW grep `modelContext` = 0），唯一锚是源档 `thincoder-core/model-specs.mjs:378`（本轮未读）⇒ 夹具可构造性在评审面内属 **unverified** | 在 C1 夹具旁补该字段的规范锚（拥有档的节号或登记面行），并加一句「`modelContext` 缺省 ⇒ 回落 `providers[].context` / 静态表」的降级说明，使夹具失败时实施席能定位是夹具还是实现 |
| 8 | 验收留存 | 🔵 | AC-1–AC-7 / AC-10–AC-12 的判法全部指向「用毕即删」的批内单测档（批档 `:240` 已自报上抛），收口后判法串自己烂掉；常驻承接只有 RTM 16-1 一行（覆盖 C4 的 CLI 面，不覆盖 C1/C2/C5/C7/C9/C10 的核与端侧断言） | 在 AC 表尾加一行「收口后常驻承接 = `test/RTM.md` 16-1（CLI 面）∥ 其余为设计期一次性判据」，让读者一眼看出哪条判据随批消失 |
| 9 | 名面滞后 | 🔵 | `docs/core/design/SESSION.md:1150` D-SE61 仍写「组合既有件：线选 / 回声归并 / 渠道合并〔`applySession` 同判〕/ `historyPercent`——零新公式」，而 `:903` 已把实现点写成 `historyReading`（`historyPercent` 为薄转口）——「零新公式」仍成立，名面落后一处 | 该决策行的组合件名改成「核 `historyReading`（`historyPercent` 为其转口）」，或并在 `:903` 的括注里，两处同一名 |

**判过但不做缺陷的项**：§2.3 表内 `historyReading → { tokens, pct }` 的旧形由 §2.14 首句「本节各表取代 §2.3 / §2.5 / §2.7 / §2.9 / §2.10 的相应旧形」覆盖（`{ tokens, pct, window }` 以 §2.14 #10 为准）。

CONTEXT-COMPACTION `:554` 的「`ctxPercentForHistory` 的 `null` 返回」讲的是端侧显示门、与本批取数改动不冲突。

两口径并排（首行 `total / window` ∥ 第 6 行 `historyReading().pct`）在 `:546` 已具名，非二说。

VERDICT: pass

## §4 用户批准（主 agent）

- **批准**：用户 2026-10-27 18:56 原话「批准」。
- **批准对象**：§2 任务书（`historyReading(h, p, ratio)` 三参无缺省 · 五消费面投影 · CLI `ctxCacheOf` 三键缓存 · 显示门不动）+ §3 评审结论（三轮，末轮 pass，🔴 0）。
- **批准前的门**：§3 状态行 = 评审通过（第三轮补录轮写成）· 文档门 `DOC-CHECK GATE: PASS`（清掉 `:578` 一段超长，分号改句号 + 空行，字面未改）。
- **批准后即实施启动**（FR32）：§5 已由 eng-coder 落盘。

## §5 实施记录（eng-coder）

**状态行**：实施完成 2026-10-27

> **本节为复写 · 读数全本轮重跑（2026-10-27）**：上一轮 §5 原文不在本会话上下文内，盘上 §5 为空 ⇒ 按交付清单重写，**每条读数本轮重新执行**，无一条凭记忆填；口径同前批 `docs/batches/2026-10-27-empty-response-reset.md` 的复写先例。

### 5.1 交付表

| # | 状态 | 条目（回指 §2.1） | 落点与读数 |
|---|---|---|---|
| 1 | ✅ 完成 | 建 parity 单测档（多面同一 history + provider + ratio ⇒ 同一 pct） | `docs/batches/2026-10-27-context-percent-parity.test.mjs`（C1–C10 十条；10 绿 0 红） |
| 2 | ✅ 完成 | `historyPercent` 吃 `_tokRatio`（台账 `#1810` 本体） | 核四符号（`historyReading` / `historyPercent` / `tokenRatioOf` / `sampleRatio`）+ 六个消费面全改投影（读数见 5.2 / 5.3） |
| 3 | ✅ 完成 | 收正设计档 `:533` 的担保句与死坐标 | **核对而非重写**（§2.13 ③ 授权）：`docs/core/design/CONTEXT-COMPACTION.md:533` 公式句 = 核函数名 + 三参；`render-frame.mjs:394-397` / `:413-415` 两处死坐标全档零命中；`:544` 明写批内 parity 单测档用毕即删、不作出处 |
| 4 | ✅ 完成 | 集成行 16-1（§2.10 常驻验收） | `test/integration/context-percent-calibrated.test.mjs`；`test/RTM.md:197` 行 16-1 结果位仍为「待执行」——执行 = 父侧收口 |
| 5 | ✅ 完成 | 三条边界零改（§1.4 / §2.11） | 端侧三处显示门（CLI `ctxPct > 0` · VSC 零值回 `null` · 核空历史 = 0）· `contextUsage` · 压缩线数值——本批零触碰，C6 钉住 |

### 5.2 AC 逐条读数（AC 全集 13 条 = §2.8 九条 + §2.13① AC-10 + §2.14 AC-11…AC-13）

| AC | 判据 | 本轮读数 | 结论 |
|---|---|---|---|
| AC-1 | 比生效（C1） | ratio 1 / 1.5 / 2 ⇒ 23 / 34 / 46（EST = 30_000，窗口 131_072） | ✅ |
| AC-2 | 未校准零回归（C2） | 改前式档内独立复算 = 23 = `historyPercent(h,p,1)`；`tokens(1)` = 30_000 | ✅ |
| AC-3 | 一点出两值同尺（C3） | `{ tokens: 45000, pct: 34, window: 131072 }`；`pct` = `round(tokens/window*100)` | ✅ |
| AC-4 | 四消费面同一 pct（C4） | core 34 · vsc 34 · cli 34 · opened 34（Set 大小 1） | ✅（桌面面见 5.4 ③） |
| AC-5 | CLI 缓存随比刷新（C5） | 三键全等 ⇒ 原引用；`_tokRatio` 1→1.5 且长度不变 ⇒ pct 变大且 = `historyPercent(h,p,1.5)` | ✅ |
| AC-6 | 三处显示门零改（C6） | 核空历史 0 · VSC `null` · CLI 渲染串无 `context ` 段 | ✅ |
| AC-7 | 缺比即失败（C7） | `historyPercent(h,p)` / `.tokens` / `.pct` 皆 `NaN`——无缺省 | ✅ |
| AC-8 | 端侧零自算式（七档行扫） | `thincoder-core/agent-tools/context.mjs` · `session-lifecycle.mjs` · `agent-host.mjs` · `specs.mjs` · `panel-callbacks.mjs` · `render-loop.mjs` · `status-line.mjs` 七档内 `estimateTokens(...) ÷ providerSpec(...).context` 零命中 | ✅（`specs.mjs:83` 见 5.4 ④） |
| AC-9 | 设计档单源句 | `:533` 逐字「实现点只有一个——核 `historyReading(history, provider, ratio)`」；两处死坐标零命中；`percent-parity` 在该档零命中（担保不指批内单测档） | ✅ |
| AC-10 | 样本比单源（C8） | 好样本 1.473；槽路 ≡ 恢复路（`restoreTokenSample` 后 `tokenRatioOf`）；三种坏样本皆 1 | ✅ |
| AC-11 | agent 不在场（C9） | `tokenRatioOf(undefined)` = 1 · `tokenRatioOf(null)` = 1；该面读数 = 未校准档 | ✅ |
| AC-12 | 窗口键失效（C10） | 131_072 → 32_768，长度与比不变 ⇒ pct 变大且 = `historyPercent(h,p32,1.5)` | ✅ |
| AC-13 | stats 标记 | `thincoder-core/agent-tools/context.mjs:111` 字面含 `calibrated history estimate`；`docs/core/design/CONTEXT-COMPACTION.md:517` 同形 | ✅ |

### 5.3 三次实跑（本轮重跑，逐条附读数）

1. `node --test docs/batches/2026-10-27-context-percent-parity.test.mjs` ⇒ tests 10 · pass 10 · fail 0（636 ms）。
2. `node --test test/integration/context-percent-calibrated.test.mjs` ⇒ tests 1 · pass 1 · fail 0（3.4 s）——单条确认性实跑；常驻门仍是父侧收口那一次（`test/RTM.md:197` 结果位 = 待执行）。
3. `node --check` × 11 档（九个产品档 + 两个测试档）⇒ 全 OK；同批 node 实读行数（`split('\n').length`）= `thincoder-core/token-window.mjs` 286 · `thincoder-core/agent-tools/context.mjs` 185 · `thincoder-core/session-lifecycle.mjs` 427 · `thincoder-desktop/src/main/agent-host.mjs` 339 · `thincoder-vscode/src/specs.mjs` 101 · `thincoder-vscode/src/extension/panel-callbacks.mjs` 363 · `thincoder-cli/src/tui/render-loop.mjs` 150 · `thincoder-cli/src/tui/status-line.mjs` 204 · `thincoder-cli/src/tui/tui-state.mjs` 70——最大档 286 行，500 软线未越。

### 5.4 偏离披露（逐条）

**① 批内单测档路径：任务书给 `.thincoder/tmp/…`，实际落盘 `docs/batches/…`。**

- 任务书出现处：§2.5 第 9 行 · §2.7 表头 · §2.8 AC-1…AC-7 判法串 · §2.14 AC-11 / AC-12 判法串——**四处都写 `.thincoder/tmp/2026-10-27-context-percent-parity.test.mjs`**。
- 盘上实际：`docs/batches/2026-10-27-context-percent-parity.test.mjs`——全仓唯一一份（`**/2026-10-27-context-percent-parity.test.mjs` glob 只此一条，`.thincoder/tmp/` 下无同名件）。
- 落盘位置与项目约定一致：`docs/core/design/CONTEXT-COMPACTION.md:399`「批内定向单测（`docs/batches/<batch>-<topic>.test.mjs`——收口随批删）」。
- **一处请父侧以盘面为准**：父侧说「设计档 §2.5 表用的是 `docs/batches/`」——本轮实读 §2.5 第 9 行**也写 `.thincoder/tmp/`**，故与盘面不一致的是四处、不是零处；这四处属 §2（设计席段），不在本席可写段。
- 本条的现场价值：§3 轮次 3 #2 即此条——AC 判法串照原文留在档内，收口后就是一条指空路径。

**② `ctxCacheOf` 三项失效键有一类覆盖不到（已登记 · 未闭）**：内容变而 `history.length` 不变时（`pruneStaleToolOutputs` 原位换内容 · `applySession` 整换机读线且长度巧合相等），状态行沿用变化前的百分比，直到下次长度变。闭它需第四个内容版本键 = 机制变更，本批不自取；登记在 `thincoder-cli/src/tui/render-loop.mjs:29`-32 的注释里。

**③ AC-4 桌面面 = 代码读，不进单测档**：`postUsage` 在宿主闭包内不可直调；证明 = `thincoder-desktop/src/main/agent-host.mjs:170` 一次 `historyReading` 的两个返回值。设计 §2.8 末尾已声明这是**降级**，不是覆盖。

**④ `specs.mjs:83` 的除法留着（不在 AC-8 射程）**：`ctxPercentForModel` 除的是 provider 报告的 `prompt_tokens`，不是历史估算；同档 `:89`-90 注释已把两条量分名。本批未动它，也未把它的消费面并入单源。

**⑤ VSC / Desktop 无集成层 ⇒ 本批不造用例**（§2.11 ⑤）：跨端同尺的常驻承接只有 CLI 一面 16-1 一行；该条仍是 §2.12 ① 的上抛，未裁。

### 5.5 文档漂移（本笔 diff 触及 · 报而不改；设计档归 eng-designer）

| 坐标 | 档内现写 | 本轮实读（盘面） |
|---|---|---|
| `docs/core/design/CONTEXT-COMPACTION.md:535` | stats 第 6 行 = `thincoder-core/agent-tools/context.mjs:108` | `:108` 现为 `Segments ≈` 行；第 6 行在 `:111` |
| 同档 `:537` | 桌面 = `thincoder-desktop/src/main/agent-host.mjs:169` | `:169` 为注释行；读数行 = `:170` |
| 同档 `:538` | CLI 缓存 `render-loop.mjs:89`-90 → `status-line.mjs:147` 渲染 | 缓存 = `render-loop.mjs:36`-43（函数）∥ `:111`（调用点）；`status-line.mjs:146` 取 `pct`、`:148`-149 渲染 |
| 同档 `:552` | `historyPercent([])` = 0（单参形） | 三参无缺省下该字面形返 `NaN`；值 0 需传比（C6 实跑 `historyPercent([], P128, 1)` = 0）。同 §3 轮次 3 #1 |
| `docs/vsc/design/WEBVIEW.md:200` | 派生单点 = `ctxPercentForHistory` | 实际消费链 = `ctxUsageForHistory`（`thincoder-vscode/src/extension/panel-callbacks.mjs:234`）；`ctxPercentForHistory` 生产面零调用。同 §3 轮次 3 #3 |
| `docs/vsc/design/WEBVIEW.md:199` · `:203` | CLI 坐标 `render-loop.mjs:89`-90 / `status-line.mjs:147`；边界句「不引入核改动」 | 坐标同上陈旧；本批正是改核（`historyReading` 等）⇒「不引入核改动」现为假 |
| `docs/core/design/SESSION.md:921` | 边界句「不改 CLI / VSC 状态行」 | 本批改了两端取数来源（`status-line.mjs:146`-150 · `specs.mjs:94`-101）⇒ 作为系统事实为假。同 §3 轮次 3 #5 |
| `docs/desktop/design/IPC.md:29` | 读数单源 = `thincoder-core/token-window.mjs:160` | `:160` 现为 `tokenKey`；核读数 = `:235` `historyReading`。同 §3 轮次 3 #4 |

### 5.6 上抛与轮次

- **`[上抛·待裁]`** §2.12 ① 集成面债（VSC / Desktop 建不建集成层）——随 §4 批准一并裁。
- **`[上抛·知会]`** 5.4 ① 的路径不一致 + 5.5 的八处漂移：**全在设计席的段与档**，本席只报不改（D1 路由：设计档 → eng-designer；批档 §2 → 设计席）。
- 轮次口径：**本轮 = 补记 + 重跑读数**（父侧判定实现已 clean、只写 §5）。上一轮的 explore 审计 ∥ 代码评审轮次**不在本会话上下文内**，本席不代为声称；终态以父侧 §6 的收口判定为准。

## §6 验证与收口（父代理）

### 6.1 交付核对（逐条 = §2.1 条目）

| # | 状态 | 要求 | 证据 |
|---|---|---|---|
| 1 | ✅ 完成 | 口径单源：`historyReading(h,p,ratio)` → `{ tokens, pct, window }` | `thincoder-core/token-window.mjs`（286 行）；`historyPercent` 转口，第三参无缺省 |
| 2 | ✅ 完成 | 校准比 `_tokRatio` 进入显示数（台账 `#1810` 本体） | `tokenRatioOf(agent)` / `sampleRatio(sample, provider)` 与 `restoreTokenSample` 共用 `validSample` |
| 3 | ✅ 完成 | 五消费面同一 pct（核 / CLI / VSC / 桌面 / 打开态） | 单测 C4（核 / VSC / CLI / 打开态同为 34）；桌面面按 §2.8 自陈为降级（宿主闭包不可直调，代码读判） |
| 4 | ✅ 完成 | CLI 缓存键 = `len + ratio + window` | `thincoder-cli/src/tui/render-loop.mjs` `ctxCacheOf`；C5 钉住三项全等回原引用 |
| 5 | ✅ 完成 | 三处显示门零改 | CLI `ctxPct > 0` · VSC `tokens ? pct : null` · 核空历史 0 —— C6 钉住 |
| 6 | ✅ 完成 | 端侧零自算式 | AC-8 行扫七档：`estimateTokens(…) / providerSpec(…).context` 零命中；唯一残留除法分子是 provider 报告值 |
| 7 | ✅ 完成 | 集成行 16-1 落地 | `test/integration/context-percent-calibrated.test.mjs`；`test/RTM.md:197` |
| 8 | ✅ 完成 | 边界：不改压缩线 / 阈值 / 守卫 / 校准机制本体 / 不建两端集成层 | §2.11 五条零改，§5.6 逐条核 |

### 6.2 实跑读数（收口侧亲跑）

```
node --test test/integration/context-percent-calibrated.test.mjs
→ 16-1 ✔   tests 1 / pass 1 / fail 0   （比 1.473 ⇒ 状态行 34%，stats 第 6 行同 34%）

node --test docs/batches/2026-10-27-context-percent-parity.test.mjs（实施侧）
→ tests 10 / pass 10 / fail 0

node --test test/integration/context-overflow-guard.test.mjs（相邻面回归）
→ 9/9 pass

node --check × 11 档 → 全过
```

### 6.3 文档门

`DOC-CHECK GATE: PASS`（本档，0 命中）。清掉 `:578` 一段超长（分号改句号 + 空行，字面未改）。

### 6.4 已知偏离（§5.4 五条，均已登记）

1. 批内单测档落点与设计档四处记的 `.thincoder/tmp/` 不一致（实落 `docs/batches/`，与 `CONTEXT-COMPACTION.md:399` 仓规一致）——**设计档与仓规的口径冲突，非实施侧偏离**，钉在 §5.4 ①。
2. `ctxCacheOf` 的 `window` 键取自 `providerSpec`（判定窗口是否变必先解析当前窗口；按设计字面每帧调核与「不每帧调核」冲突）。
3. 「忘传比 ⇒ 渲染 `NaN%`」不成立：三面显示门把 `NaN` 读作「不显示」⇒ 后果是读数缺席。「无缺省」这条不动（缺省 1 会静默显示未校准数，比缺席坏）。
4. 文档侧漂移（报而不改）。
5. 临时探针建后即删，零残留。

### 6.5 未决 / 转出

| # | 项 | 去向 |
|---|---|---|
| 1 | 设计档漂移 8 处（`CONTEXT-COMPACTION.md:535/:537/:538/:552` · `WEBVIEW.md:199/:200/:203` · `SESSION.md:921` · `IPC.md:29`） | 待 designer 收，记台账 |
| 2 | 评审 🟡 1（`:552` 单参字面）· 🟡 2（四判法路径）· 🟡 3（VSC 派生单点两名）· 🟡 4（IPC `:29` 单源坐标）· 🟡 5（SESSION `:921` 边界句） | 随漂移批同收 |
| 3 | 缓存三项覆盖不到「内容变而长度不变」（`prune` 原位换内容 / `applySession` 换线）——改前只按 `len`，非本批引入；闭它需第四个内容版本键（机制变更） | 记台账 |

### 6.6 延期批复核

无延期批。

### 6.7 收口结论

**本批可收。** 单测 10/10 + 集成 16-1 1/1 + 相邻面 9/9 全绿；AC-1..AC-13 逐条通过；文档门 `PASS`；§1–§6 全段有内容。

**用户可见结果**：上下文占用百分比从三处各算各的收成一个核实现点，校准比首次进入该显示数——CLI / VSC / 桌面 / stats / 打开态读同一个数。
