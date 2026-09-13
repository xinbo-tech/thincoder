# provider.headers 全通路铺开 · 批次记录（2026-09-11）

> 六段 append-only，一段一作者。编制：主 agent · 2026-09-11 15:10 · 来源 = 用户 13:36「都可以」（Gitee #IKDWH7——评估 id=48，父侧「可先开小批」建议获准）。
> （父侧形态更正 2026-09-12：空占位行已清——实体内容见对应节；空占位 = 残留即先例）

---

## §1 讨论（主 agent 记）

### 本批条目（1 条）

| # | 条目 | 内容 |
|---|---|---|
| **F1** | **`provider.headers` 铺到全部遗漏通路** | 现状：主聊天 `src/provider/core.mjs:405-425` 展开 `{...provider.headers, Content-Type, Authorization}` ✓；**遗漏**：`src/provider/responses.mjs:432/451/469`（三处 fetch，连 provider.headers 都没展开）· `src/provider/anthropic.mjs:73-77`（字面头无展开）· `src/provider/google.mjs:119`（仅 Content-Type）· `src/agent/generate-title.mjs:47-55`（自建头、无 provider.headers——**若网关要求该头，标题生成必先挂**）。已展开面（对照）：`list-models.mjs:52/57/73`（OpenAI/Anthropic 分支 ✓）。 |

### 背景与范围口径（父侧裁）
- Gitee #IKDWH7 的 `x-opencode-session` **动态会话头**：400 断言在本地参考树**未证实**（网关 :149 有缺省回落）→ **不在本批**（待报告者给网关证据后另议）；
- 本批 = **静态 `provider.headers` 全通路铺开**（零风险、与断言真伪无关）——顺带修好「用户自定义头在辅助请求面不生效」的实际缺口。

### 待设计裁定
1. 四个遗漏通路逐点落法（headers 展开点/顺序——Content-Type/Authorization 覆盖语义与 core.mjs 对齐）；
2. `generate-title.mjs` 自建头改造形态（改用统一装配 vs 局部补）；
3. 头来源文档小节归属档（5 通路头来源一览）；
4. 受影响文件全清单（行数/增量）+ 用例/AC（逐通路机验：自定义 header 出现在请求）；
5. 既有锁零伤 + 与既有 `provider.headers` 语义（PROVIDER 面）核对——**只引用不重述**（D2）。

### 范围边界（明确不做）
- 不实现会话动态头（x-opencode-session——待证据）；不动 embedding.mjs 独立渠道（域外）；不改头语义（只铺开）；不得新建档（必须 → 打回）。

### 状态
**已收口**（用户批准）。下一步 = 设计。

---

## §2 批次任务（eng-designer 自写）


**状态：任务书就绪**（2026-09-11——需求/设计/测试三层已落档，待设计评审）。实施者 = eng-coder（设计 token 门）。
设计档 = `../design/PROVIDER.md` §21（机制——请求头装配与通路一览）/ §22（需求层）/ §23（设计层）/ §24（测试层）。
本 §2 = coder 任务书本体（不另写副本）。

### 本批条目（1 条——三方一致锚）

| # | 条目 | 三层落点 | 判定句（验收语义） |
|---|---|---|---|
| F1 | `provider.headers` 铺到全部遗漏通路 | 需求 §22.2（R18–R20）/ 设计 §23 / 测试 §24（AC-18–AC-20） | 四遗漏通路（responses / anthropic / google / generate-title）逐通路机验：定制头出现在该通路请求；同名时内置头胜出；零配置时头集合逐字不变 |

**要件细分（F1 内——三层同编号）**：R18 铺开 + 语义对齐（判定句三合一）· R19 测试面随件 · R20 文档面随件（已由 designer 落档）。

### 五问裁定（§1 待设计裁定——结论摘要，论证见设计 §23）

1. **四遗漏通路逐点落法** = 各点内联展开（与 core.mjs / list-models.mjs 现行形态同形）；顺序 = 定制头前、内置头后
   （同名时内置头胜出——与 `core.mjs:408-412` 对齐）；responses 三处 fetch **提升单 `const headers`**（设计 §23.3 a/c）；
2. **generate-title 改造形态** = **局部补**（保持「自建头」结构，仅加一行展开）；「改用统一装配」否决
   （须连 core / list-models 一起改才自洽——超「只铺开」定性）（设计 §23.3 b）；
3. **头来源小节归属档** = **`../design/PROVIDER.md` §21**（通路一览全表）；不拆 SESSION.md、不新建档——
   4/5 通路在 `src/provider/` + 单一权威源（D2）（设计 §23.5 #6）；
4. **受影响文件 + 用例/AC** = 实施者 5 文件（4 源 + 1 新测试档）；用例 T39–T46、AC-18–AC-20（设计 §23.4 / §24）；既有锁零伤 = AC-19；
5. **既有语义核对** = `provider.headers` 语义此前零文档权威（仅代码注释）——本批落档于设计 §21 一处（其余处只引用）；
   sanitize 语义（`config.mjs:237-249`）零改。

### 目标与已知事实（免重复勘察）

**目标**：把静态 `provider.headers` 铺到 4 条遗漏通路——装配顺序对齐 core.mjs（定制头前、内置头后）；
机制零动（净化器 / 覆盖语义 / 内置头集合全不改）。

**已知事实**（as-of 2026-09-11；精确行位）：
- 四遗漏通路行位：`src/provider/responses.mjs:432/451/469`（三处 fetch——提升单 const 后三处改引用）；
  `src/provider/anthropic.mjs:73-77`（既有 const headers）；`src/provider/google.mjs:119`；
  `src/generate-title.mjs:49`（opts 块 :47-55）。
- **路径勘误**（§1 笔误）：§1 写 `src/agent/generate-title.mjs`——实为 `src/generate-title.mjs`
  （`src/agent/` 下无该档）；以实测为准。
- 参照面（零改）：`src/provider/core.mjs:408-412`（顺序语义 = 定制头前、内置头后——内置头胜出）；
  对照面（零改）：`src/provider/list-models.mjs:52/57/73`。
- 净化器（零改）：`src/config.mjs:237-249`（loadConfig 剥离 `authorization`（大小写不敏感）+ 非字符串值）。
- 测试面：新增 `test/provider-headers.test.mjs`（T39–T46——`npm test` 自动 glob 收集，无需注册；
  快层直跑，超 D-T6 800ms 阈值才标 `slow`）；既有头断言 = `test/list-models.test.mjs:39/49/50`（保持绿）。
- mock 形态（设计 §24.1 注——POC 已验）：`globalThis.fetch` 注入记录 `(url, opts)`；native 三格式最小 SSE 帧
  逐字见设计 §24.1；OpenAI 面走非 SSE 单 chunk JSON 兜底；generate-title proxy 分支经 `_deps.proxyFetchImpl` 注入。

### 明确不在本批（= 设计档 §22.4 边界清单——逐条）

- 不实现会话动态头（x-opencode-session）；不改头语义（净化器 / 装配顺序 / 内置头集合）；不动 core.mjs 与 list-models.mjs；
- 不动 embedding 独立渠道；不碰 VS Code 端；不新建档；不改提示词 / README / CHANGELOG / docs/TODO.md；不 commit。

### 受影响文件（实施者写域——spawn `files` 声明同此，共 5 文件）

| 文件 | 改动要点 |
|---|---|
| `thincoder-cli/src/provider/responses.mjs` | `chat()` 内提升单 `const headers`（含展开）——三处 fetch（:432/:451/:469）改引用（494 行 → 净增 ≤2——逼近 500 硬限，不得夹带其它改动） |
| `thincoder-cli/src/provider/anthropic.mjs` | `headers` 对象首行加 `...(provider.headers ?? {})`（:73-77） |
| `thincoder-cli/src/provider/google.mjs` | `headers` 内联展开（:119） |
| `thincoder-cli/src/generate-title.mjs` | `opts.headers` 内联展开（:49） |
| `thincoder-cli/test/provider-headers.test.mjs` | **新增**（T39–T46——用例表见设计 §24.1） |

> 文档面（`../design/PROVIDER.md` §21–§24 + 变更记录）已由 designer 落档——**不在 coder 写域**；发现文档与实现不符 → 报告，勿径改。

### 验收标准（AC-18–AC-20——机器可验证；判据全文 = 设计档 §24.2）

- **AC-18（R18）**：`cd thincoder && node --test test/provider-headers.test.mjs` 全绿（T39–T46）。
- **AC-19（R19）**：`cd thincoder && npm test` 全绿（既有锁零伤）。
- **AC-20（R20）**：`cd thincoder && node scripts/check-doc-width.mjs`——本批文件新增超宽 0 行、新增违规 0 条
  （仓内存量与他批在途面不计——as-of 2026-09-11：宽度 8 文件 10 行 / 一致性新增 4 条均属他批）；
  `cd thincoder-vscode && node scripts/check-doc-width.mjs` 复跑（本批零改动）。

### 并发面（父侧排程）

`src/provider/anthropic.mjs` / `google.mjs` 同时是**第 24 批（ABORT-PROVENANCE）**实施域文件
（其评审在途、未实施）——本批 coder spawn 的 `files` 声明已含 anthropic/google；两批实施先后由
scheduler 文件域串行（或父侧定序）。

### 交付报告格式（eng-coder → §5）

1. **改动清单**：文件 → 实际行数变化 + 要点（逐条对齐设计档 §23.4）。
2. **测试证据**：AC-18–AC-20 逐条命令 + 结果（关键输出行粘贴；长测试落盘再读）。
3. **偏差登记**：与设计档的任何差异 + 理由；无偏差写「零偏差」。
4. **未决项 / 阻塞点**（若有）。

**增补（2026-09-11——错误类用例 T47；判据全文 = 设计档 §24）**：设计档 §24.1 增 **T47（错误类）**——非 2xx（401）路径
定制头携行 + 错误语义不变（anthropic 通路代表；无重试等待、快层可直跑）。用例集自此 = **T39–T47**（上文各处「T39–T46」
以本行为准）；AC-18 判据同步扩为 T39–T47；受影响文件面与写域声明不变（仍 5 文件）。

### 修正轮同步（2026-09-11——设计评审轮次 1 后；本追加与上文本冲突时以本追加为准）

**背景**：设计评审轮次 1 = **pass**（🔴0 · 🟡2 · 🔵5——发现表见 §3「轮次 1」）。本修正轮 = **只改文档**（设计档 `../design/PROVIDER.md` + 本块）：零实现面改动、零新语义、§1 零碰。设计档变更记录已留一行注记（评审修正轮——7 条采纳项落档）。

**逐条落点（7 条全采纳）**：

1. **🟡#1 枚举同步**：设计档 §23.6（b）D3 行 `T39–T46` → `T39–T47`（与 §23.4 / §24.1 同源）；§2 上文各行 `T39–T46`（:58/:76/:94/:100）以 :119–121 增补 + 本块为准。
2. **🟡#2 锚法统一（真值复核）**：`src/provider/responses.mjs` 只读复核——三处调用点起始行 = :430/:449/:467（`headers:` 字面行 = :432/:451/:469；同一三处、锚法差 −2）。设计档 §21.2 / §23.2 #1 / §23.4 统一锚 `proxyFetch(` 调用起始行（§23.6（a）#2 加锚注）；**§2 上文 `432/451/469`（:68/:90）以本行锚法为准**（语义零变）。
3. **🔵#3 文档行注刷新**：设计档 §23.4 文档行 = `1125 → 1369（实测）`、`本批 +~244`（原 `+~130` 失准；评审观测 ≈+240）。
4. **🔵#4 T41 预期补全集合**：设计档 §24.1 T41 预期 = `X-Device-Id` + `Content-Type` + `x-api-key` + `anthropic-version`（明示无 `Authorization`——该通路无此内置头）。
5. **🔵#5 符号锚补记（约定）**：设计档 responses 面 = `chat()` 内提升点 + 三处 `proxyFetch(` 调用点（行号降为 as-of 快照）。
6. **🔵#6 T46 注入缝点名**：config 面缝 = `_setConfigPathForTest`（`src/config.mjs:28-29`）+ tmp config.json——夹具形态复用 `test/config-merge.test.mjs`（`tmpCfg()` :16-21）；设计档 §24.1 注已补。
7. **🔵#7 勘误复核登记（父侧实施入场前一行 glob）**：`src/generate-title.mjs`（存在）· `src/agent/generate-title.mjs`（不存在）——本修正轮已读侧复核通过。

**受影响文件（修正轮）**：`docs/design/PROVIDER.md`（设计者改）+ 本批次档 §2（本块）——实施者 5 文件写域零变化；AC-18–AC-20 判据不变。

**核验（本修正轮）**：零实现面改动；设计档与本批次档 `check-doc-width` 新增超宽 0 行、V1/V2/V3 新增违规 0 条（他批在途项不计）。

**状态**：修正轮就绪。重发评审 / 批准时序由父侧定序——本设计者不发起评审。

## §3 设计评审（评审子代理自写）


### 轮次 1（评审子代理）

核验说明：本轮按对象声明限域读档（未读其他文件）——涉仓内源文件的断言（行数 / 逐字对齐 / 存在性）为设计档转述，本限域内未独立复验；表内引用均可在两档现文核到。五项重点核均已执行（①–④ 除下表净项外无其它问题；⑤ 并发面声明成立、PROVIDER.md:3/:448 两处遗留状态行均已核实在盘面刷新为「已实施并核销」）。

| # | 类别 | 级别 | 问题 | 建议 |
|---|---|---|---|---|
| 1 | 文档一致性 | 🟡 | PROVIDER.md:1271（§23.6(b) D3）仍枚举「T39–T46」——T47 增补后未同步（PROVIDER.md:1313 / :1236 与批次档:119–121 均 = T39–T47），与该行自身「各处点数与列表同源」声明相矛盾 | 设计者一处改「T39–T47」（父侧 doc 层 report-and-fix） |
| 2 | 文档一致性 | 🟡 | responses 三处 fetch 锚点两写：PROVIDER.md:1122「430/449/467」vs PROVIDER.md:1187 / :1227 与批次档:68「432/451/469」（整齐 −2，锚法差异未说明） | 统一锚点约定并两处对齐（建议锚到 `fetch(` 起始行） |
| 3 | 文档卫生 | 🔵 | PROVIDER.md:1242 文档行注「1125 → 本批 +~130」与盘面不符：现档 1365 行（§21–§24 = 1098–1332 共 235 行 + 变更记录新增 5 行 ≈ +240）；.md 行豁免注解，属卫生级 | 刷新该数字（或去估算） |
| 4 | 清晰性 / 机判 | 🔵 | T41（PROVIDER.md:1307）预期「+ x-api-key / anthropic-version 在位」相对基不明——若按 T39 集合叠加将错含 Authorization（anthropic 通路无该内置头） | 写明 = X-Device-Id + Content-Type + x-api-key + anthropic-version |
| 5 | 方法学 | 🔵 | §21–§24 与批次 §2 锚点全部行号化，与 AGENTS.md「symbols, not line numbers」约定相左（仓内同形态在先——PROVIDER.md:455-456（仅作插图，非依据）；**分级判据 = 非本批引入 + Action 列增量补锚 → 不升级**）；#2 即该类漂移实例（另见批次档 §1 的 core.mjs:405-425 vs 设计 408-412） | 行号旁补符号锚（chat() 提升点 / 三处 fetch 调用点），as-of 行号留作快照 |
| 6 | 可行性 / 证据缝 | 🔵 | T46（PROVIDER.md:1312）「临时 config.json → loadConfig」注入缝未点名——§24.1 POC 清单（:1315-1319）只覆盖 fetch / proxyFetchImpl 注入 | 点出该缝，或注明复用既有 config-merge 夹具 |
| 7 | 证据说明 | 🔵 | 勘误（批次档:71-72 / PROVIDER.md:1265）在本限域内无法独立复验文件存在性——内部三方一致 + AGENTS.md 模块表（src/agent/ 9 文件无 generate-title）佐证 | 实施入场前一行 glob 复核（父侧） |

计数：🔴 0 · 🟡 2 · 🔵 5。

VERDICT: pass

### 轮次 2（评审子代理）

**第 32 批轮次 2——单轮校验（只核修正轮 7 条落点）：7/7 落点盘面核实 → 0 发现**（残遗 0 · 未落 0 · 新增矛盾 0）。

落点核验（读侧证据；限域 = 对象声明锚点 ±10 行，未越 7 条落点）：
- 🟡#1：`thincoder-cli/docs/design/PROVIDER.md:1272` = 「R18–R20 / N8–N9 / T39–T47 / AC-18–AC-20」——T39–T46→T39–T47 已落。
- 🟡#2：`thincoder-cli/docs/design/PROVIDER.md:1123`/`:1188`/`:1228` 三锚均 = 「`proxyFetch(` 调用点（as-of :430/:449/:467）」；`:1263` 锚注在位；`thincoder-cli/docs/batches/2026-09-11-PROVIDER-HEADERS.md:130` 声明在位——锚法统一已落。
- 🔵#3：`thincoder-cli/docs/design/PROVIDER.md:1243` = 「1125 → 1369（实测）· 本批 +~244」（1125+244=1369，与盘面总行数一致）——行注刷新已落。
- 🔵#4：`thincoder-cli/docs/design/PROVIDER.md:1308` T41 预期四头明示（`X-Device-Id` / `Content-Type` / `x-api-key` / `anthropic-version`，明示无 `Authorization`）——已落。
- 🔵#5：同上三锚均带符号锚（`chat()` 内提升点 + `proxyFetch(` 调用点；行号降为 as-of 快照）——已落。
- 🔵#6：`thincoder-cli/docs/design/PROVIDER.md:1321` = 「config 面注入缝（T46）= `_setConfigPathForTest`（`src/config.mjs:28-29`）+ tmp config.json」——已落。
- 🔵#7：`thincoder-cli/docs/batches/2026-09-11-PROVIDER-HEADERS.md:135` = 「`src/generate-title.mjs`（存在）· `src/agent/generate-title.mjs`（不存在）——本修正轮已读侧复核通过」——勘误复核登记已落。
- 附：`thincoder-cli/docs/design/PROVIDER.md:1368` 评审修正轮变更记录一行（枚举/锚法/T41/行数注/T46 缝）——已落。

| # | 类别 | 级别 | 问题 | 建议 |
|---|---|---|---|---|
| — | — | — | 0 发现——7/7 落点均在盘面核实（残遗 / 未落 / 新增矛盾均 0） | — |

VERDICT: pass
计数：🔴0 · 🟡0 · 🔵0

## §4 用户批准（主 agent 记）

**2026-09-12 01:05 父侧代签**——用户 12:48 授权（13:38 延展至排空）；三条件齐备：轮次 1 pass（🔴0 · 🟡2 · 🔵5）→ 修正轮 7/7（锚点真值复核 430/449/467 + 符号锚 + config 缝点名）→ **轮次 2 = pass**（7/7 核销 · 0 发现）→ **token 已签发**（值不落档）。

**批准范围**：4 改 + 1 新（`src/provider/responses.mjs`（`chat()` 提升单 `const headers`，三处 fetch 改引用）· `src/provider/anthropic.mjs` · `src/provider/google.mjs`（内联展开）· `src/generate-title.mjs`（`opts.headers` 内联展开；路径勘误以实测为准）+ 新测档 `test/provider-headers.test.mjs`（T39–T47——用例表见设计 §24.1）；全表见批次 :90-94。

**遗留（批准时登记）**：① 勘误复核登记（批次 :135——父侧实施入场前一行复跑）；② commit 待父侧。

## §5 实施记录（eng-coder 自写）


### 交付摘要（eng-coder 自写 · 2026-09-11）

**状态：实施完成**——4 改 + 1 新，全部落在设计 §23.4 实施域表内；AC-18 绿；AC-19/AC-20 见透明表（他批在途面另注）。
设计权威 = `../design/PROVIDER.md` §21–§24；任务书 = 本档 §2 + 修正轮同步块（冲突以修正块为准）。

**改动清单**（file → 实测行数变化 + 要点；逐条对齐 §23.4）

| 文件 | 实测行数（前→后） | 要点 |
|---|---|---|
| `src/provider/responses.mjs` | 494 → 496（+2） | `chat()` :423-424 提升单 `const headers`（含展开；位置 = rateGate :422 之后、首个 requestWithRetry 之前）；三处 `proxyFetch(`（:432/:451/:469）改引用（:434/:453/:471） |
| `src/provider/anthropic.mjs` | 225 → 226（+1） | `headers` 对象首行 :75 加 `...(provider.headers ?? {})`（行内注释） |
| `src/provider/google.mjs` | 258 → 258（±0） | :120 内联展开（行内注释） |
| `src/generate-title.mjs` | 83 → 83（±0） | :49 `opts.headers` 内联展开（直连与 proxy 两分支共用同一 opts） |
| `test/provider-headers.test.mjs` | 新增 253 行 | T39–T47 九用例（§24.1 逐条：5 通路到达 / 覆盖语义 / 零配置回归 / config 全链 / 错误路径） |

> 装配顺序四通路一致 = 定制头前、内置头后（同名内置头胜出）——参照 `core.mjs:402-406`（本批零改）。
> 每点一行注释（展开 + 顺序语义 + `PROVIDER.md §21` 指针）已在位（§23.2 要求）。

**透明表（AC-18–AC-20）**

| # | 判定 | 结果 | 证据 |
|---|---|---|---|
| AC-18 | T39–T47 全绿 | Done | `node --test test/provider-headers.test.mjs` = 9/9 pass；反向控制（临时剥掉四处展开 → T40/T41/T42/T43/T44/T47 六条转红、T39/T45/T46 三条保持绿；恢复后逐字一致）= 断言对行为敏感、非空转 |
| AC-19 | 既有锁零伤 | **本批面 Done；全量层为他批在途红（非本批面）** | `npm test` = 574 tests · 557 pass · 3 fail · 14 skip；3 fail = doc-consistency T41（他批 docs/batches 档 6 条 V1/V2）+ prompts-dual-source T-CL1/T-CL2（第 15 批 prompt 双源在途）——无一条引用本批文件；本批 9 用例全 ✔ |
| AC-20 | 文档宽度/一致性（本批面） | Done | CLI：12 文件 19 行超宽 + 一致性新增 5 条——**全部为他批在途档**，本批文件（`docs/design/PROVIDER.md` + 本档）零命中；VSC 复跑 = OK（宽度 0 / 新增违规 0） |

**测试实测（先落盘再查）**

| 命令 | 结果 | 日志 |
|---|---|---|
| `node --test test/provider-headers.test.mjs` | 9/9 pass（T39–T47） | `%TEMP%\ph-test3.log` |
| `node test/run-fast.mjs`（全量快层，最终态） | 574 tests · 557 pass · 3 fail（他批在途）· 14 skip | `%TEMP%\ph-full2.log` |
| 反向控制（剥展开 → 复跑 → 恢复） | 6 红 / 3 绿 / 恢复 byte-identical OK | 会话内 execute（含恢复核验） |
| `node scripts/check-syntax.mjs` | 290 档 OK | — |
| `node scripts/check-doc-width.mjs`（CLI 仓） | 本批文件零命中（超宽 12 文件 19 行 / 一致性 5 条均他批） | `%TEMP%\ph-width-cli.log` |
| `node scripts/check-doc-width.mjs`（VSC 仓，本批零改动） | OK（无超宽 / 新增违规 0） | `%TEMP%\ph-width-vsc.log` |

**偏差披露（逐条）**

1. **评审修正（advisor 🔵——Fixed）**：T39–T43 补 `assert.equal(m.calls.length, 1)` 单请求断言（5 处），使「头到达」类断言同时锚定请求次数；改后复跑 9/9 绿。
2. **第 24 批（ABORT-PROVENANCE）叠加面——透明登记（非未授权触碰）**：`anthropic.mjs` / `google.mjs` 内 24 批已交付改动在位（`abortError` 面 :11/:82/:190 与 :10/:108/:203/:212）；本批展开点（:75 / :120）与其行区零交叠，24 批内容逐字保留。实施前判定「24 批 §5 已交付、终态 clean = 非在途编写中」，故未触发红线「停下报告」；如父侧口径应为「见 24 批改动即停」，请裁决（本批改动与 24 批可并存、互不覆盖）。
3. **行数口径小差（他批 + 快照）**：实施前实测 vs 设计 §23.4 基线差（anthropic 225/226、google 258/259）源于 24 批未提交改动；本批自身增量 = +2 / +1 / ±0 / ±0（逐档 diff）。新测档 253 行 vs 设计估 ~150（估算偏大，非偏差）。
4. **设计锚点 as-of 漂移（登记——供设计者/父侧）**：设计 §21.2/§23.2 与 §2:130 声明 responses 三处 `proxyFetch(` as-of :430/:449/:467；实施后位于 :432/:451/:469（同一三处、符号锚不变——文档已自声明行号 = as-of 快照）。

**审计与评审（轮次与终态）**

- **① 内部定点审计**（explore，round 1，divergence-only）：**CLEAN**——四类偏差 0（超清单 0 / 未实现 0 / 夹带 0 / 注释失实 0）；观察项 3（设计档行号快照漂移 · 与 24 批零交叠 · 审计无执行能力未独立复跑 AC 命令）。
- **② 内部代码评审**（advisor，round 1，5 档 + 两文档）：**VERDICT pass**——🔴0 · 🟡1 · 🔵1。
  - 🟡（responses.mjs 近 500 硬限）= 既有债，设计 §23.4 已登记 over-tier（后续触碰批次先拆分）；本批 +2 在预算内（496 < 500）——无本轮动作（不升级、不重开）。
  - 🔵（T39–T43 未锁请求次数）= **Fixed**（见偏差披露 1）。
- **终态：clean**（0 🔴 全链；无 must-fix 项）。

**未决项 / 阻塞点**：无。

**交父侧处置项（非本档写域）**：① 设计档锚点/行数快照刷新（设计者域——偏差披露 4 与他批行数差）；② commit 待父侧；③ 偏差披露 2 的口径确认（24 批叠加面登记）。

## §6 验证与收口（父代理自写）

**2026-09-12 05:00 父侧收口**（用户授权窗口 12:48→排空）。

### 父侧验证

- 定向 **9/9**（T39–T47）· **反向控制实证**（剝展开→六红三绿；恢复 byte-identical——断言非空转）· 快层 574/557/3（全他链）· syntax 290 ✓；
- **父侧抽核**：`responses.mjs` 提升块 + 注释 ✓ · `anthropic`/`google` 展开 ✓ · **24 批改动并存零覆盖**（`abortError` 面核在）✓；
- 内部：定点审计 CLEAN + 代码评审 pass（🔵 1 已修——`calls.length===1` 单请求锁）。

### 逐条验收结论

- **AC-18/19/20 全绿**（本批文件零红·零新增）；**Simplified 零 · Not done 零**；偏差 3 条如实（**24 批叠加 = 并存正确**——零交叠已实证）。

### 核销同步清单

- 角色表：无 ✓ · 状态行：§5 clean ✓ · 计数：5 档实测 ✓ · 指针：设计 §23.4 ↔ 用例 ✓ · 待办：三项（下）✓

### 遗留项

1. **设计档锚点/行数快照刷新**（设计者域：:430/:449/:467→:432/:451/:469 · §23.2 边界② 枚举补 google）；
2. `responses.mjs` 496 行近硬限（既有债登记——后续触碰批次先拆分）；
3. **设计 token 已消费（链终）**；commit 待父侧随批提交。
