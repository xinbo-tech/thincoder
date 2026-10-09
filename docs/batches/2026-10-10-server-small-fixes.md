# 2026-10-10 · server-small-fixes
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-10 · 来源 = 用户 2026-10-10 03:49「不认自设条件——等条件的一起拿出来清理」+ 清账二遍 = server 面 9 条（#1024 ∥ #1025 ∥ #1056 ∥ #1057 ∥ #1137 ∥ #1146 + 待设计三件 #967 ∥ #1008 ∥ #1010）。
> 台账 = #1137（server · 归批）。前情 = docs/batches/2026-10-10-ledger-full-triage.md（已收口 2026-10-10 · 清账二遍）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-10
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**状态行**：🔄 进行中（设计轮已发）

**直令**：用户 2026-10-10 03:49 清账二遍令——本批 = server 面小收；授权 = 会话全自动沿用。

**条目（9）**：
- `#1024`：设计板档 §6 各批总账行补录（2026-10-07 五批：布局/配额/配额v2/元数据/列式）。
- `#1025`：「密钥 ∥ key」一名两形跨面统一（nav/管理/审计/接入卡 ↔ 新页）。
- `#1056`：`statCard` 两处并存去重（`views-overview.mjs` 变参件 ∥ `views-usage.mjs` 单值件）。
- `#1057`：me 用量批评审余三条（壁钟锚定 ∥ `from` 键模板字面量 ∥ `byMember` 复用注）。
- `#1137`：`proxy.mjs:144` 看门狗 'readable' 复位语义——慢消费者腿实跑。
- `#1146`：`embedding-admin.mjs:42` `textExcerpt` 非 2xx 整段读——有界流式读硬化。
- `#967`（待设计）：种子 `env:` 缺位 ⇒ 库留行+拒启无回滚——README/运维面注记。
- `#1008`（待设计）：带空白键静默通过（`members.mjs` `assertModelRefKey`）——trim ∥ 拒形。
- `#1010`（待设计）：模型元数据三处设计口径留白——WEBUI.md §2.4④/§2.6 邻 ∥ API.md §2.2 邻补记。

**边界**：`thincoder-server/**` + `docs/server/**` 对应行；不触核 ∥ 端面。

**授权口径**：会话全自动（03:07「全自动」+ 03:49 清账二遍令）——设计 → 评审（用户点火）→ 批准 → 实施。

**父裁（2026-10-10）**：① `#1025` = **「API Key」** ✓（用户 16:41/16:43 定音为源；「密钥」= 定音前旧形——§1 原「统一向」未指定方向，设计以定音正之）；② 面内补全两键（`audit.keyHint` ∥ `usage.col.key`）**收进本批**（同一实体——不留半清；实施按同表规则落、两行值现读推）；③ provider 凭证三键 ∥ `vector.clearApiKey` = 异实体零触 ✓；④ 随正件（门禁七件 N⇒N+2、现读 35⇒37）+ `#1024` 五行取数 = 实施轮/父侧随正轮（同 ⑧⑨⑩ 先例）；⑤ `#967`/`#1008`（拒形）/`#1010` = 核销 ✓。

**父裁（2026-10-10 · 评审 #79 pass 回执）**：3 🟡 ∥ 5 🔵 逐条——F1（文档链随正缺位：`ops/OPS.md:115-116` ∥ `design/PROJECT.md:226` 板级行 35 ⇒ 37）⇒ **随正面补两处**（沿 `design/PROJECT.md:180` 先例；父侧/实施随正轮同派）∥ F2（随正件行数注）⇒ **父侧代注**（内容行数口径）：门禁七件 241/498/495/228/494/447/**740**（740 件「免拆（≤800）」在册——`design/PROJECT.md:295`）∥ `-server-public-structure` 157 ∥ `-me-usage-charts` 228 ∥ `package.json` 26 ∥ F3（#1146 容差未定值）⇒ 实施轮**显式定值**（64 KiB 起、实测定，取数入 §5）∥ 🔵（#1024 五值无机械判据 ∥ 功能点名残形 ∥ .md ±1 计数 ∥ 其余）= 随实施或维持。**实施派工 = eng-coder #92**（跨批写门如拒 ⇒ 待父侧落清单）；产物回后进 §6。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（round=initial——9 条落地表 ∥ 3 裁定 ∥ 受影响文件与测试面 ∥ 上抛 5 项；待评审（§3））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**设计轮（eng-designer · 2026-10-10 · round=initial 初始轮）**

**范围一句话**：本批 = server 板小修/清账批（9 条）——产品面改动四处（`views-usage.mjs` 去重 ∥ `embedding-admin.mjs` 有界读 ∥ i18n 八档术语值改 ∥ 本批两件测试档），其余 = 设计/需求档面收正与核销。零新机制 ∥ 零新档 ∥ 零迁移 ∥ 零端点契约变化（SD/AC 编号零增）。

**裁定前置（全文见「三」）**：#1025 统一向 = 「API Key」（zh 保留英文原形 ∥ en = "API key"）；#1008 = 拒形（不取 trim）；#1056 去重向 = `views-overview` 变参件。

### 一、逐条落地表（9 条全覆）

| # | 动作 | 目标（file:line——本设计轮现读） | 期望 | 机检法 |
|---|---|---|---|---|
| #1024 | 设计板档 §6 五批总账行补录 + §9 R40② 收正 | `docs/server/design/PROJECT.md:221-222`（滞账注两条 ⇒ 删、原位补五行）∥ `:420`（R40② 句）∥ 变更记录 +1 行 | 五行体例 = 相邻既行（样例 `:181-183`「provider 默认模型清除批」行）；数值 = 逐批自五批档 §5/§6 实读取数（五源见 2.5）；R40② ⇒ 「已补（2026-10-10 本批）」；「未回填/滞账」字样归零（D8） | `node scripts/doc-check.mjs` EXIT 0 ∥ 收口轮父侧抽核（抽 2 批逐值对读）——**不新设文档句断言**（禁句锚） |
| #1025 | 术语统一「API Key」：13 键 × 两语值改 + 设计档收正 | 值面 = 八档（`public/i18n-{zh,en}-{shell,me,admin,system}.mjs`——逐键现读行号 = 2.1 表）；文面 = `webui/WEBUI.md:101`（词汇口径条）∥ `:151`（页题句）∥ `:215`（「key 数」列名句）∥ `design/PROJECT.md:420`（R40③ 口径句）∥ 两档变更记录各 +1 行 | 13 键逐字 = 2.1 表；键集零变（389 ∥ 394）；`system.accessHint` 内嵌 nav 值随 nav 同拍；口径条 = 统一现状句（零「另笔/一名两形」残留） | 批内件：① 13 键 × 两语逐字断言 ② 交叉一致 `ZH["system.accessHint"].includes(ZH["nav.page.me.keys"])`（EN 同）③ 旧形扫描（13 键 zh 值零「密钥」∧ 零裸小写 `key`）④ 键数 389 ∥ 394；随正件 = `-server-public-structure.test.mjs:52-53` 指纹两枚刷新（跨批——父侧落） |
| #1056 | `statCard` 去重：删本地件、调用点保形 | `public/views-usage.mjs:105-107`（本地件删）∥ `:85-86`（调用点）∥ import 自 `public/views-overview.mjs:49-51`（单源） | DOM 逐值同修前（两枚 `section.card > .stat-label + .stat-value`）；零新档；行数净 ≈−2 | 批内件：`views-usage.mjs` 零 `function statCard` ∧ 含 import 行 ∧ 桩 DOM 腿两卡值逐字；既有 `-me-usage-charts-ui.test.mjs`（`:392` 导出签名正则）全绿 |
| #1057 | 三条余条清账（① 修 ∥ ②③ 收口为「既成」） | ① `docs/batches/2026-10-07-me-usage-charts.test.mjs:107`（`now` 捕获）∥ `:179`（`from` 窗）② `views-me.mjs:156-161`（`from` 模板字面量）③ `metering/report.mjs:170`（`byMember` 连带注） | ① 钉钟（`mock.timers.enable({ apis: ["Date"], now: 定值 })`——node 24 原生，本设计轮实测可用）+ 新增近零点腿（钉 23:59:59.500——修前必抖条件显式复现）②③ 零改 | ① 直跑该件全绿（父侧落讫后）∥ 近零点腿红绿对照（修前抖 ⇒ 修后绿）② 行为腿：me 页桩 api 断言请求 URL 含 `from=` 且值 = 窗换算（模板字面量 ∥ 引号形行为等价） |
| #1137 | 代理慢消费腿（实跑补证——产品码零改） | 新件 `docs/batches/2026-10-10-server-small-fixes-proxy.test.mjs`；夹具沿 `2026-10-09-server-gemini-openai-preset.test.mjs:67-139`；看门狗在盘 = `src/gateway/proxy.mjs:122-127/:144` | 三腿定义 = 2.3；腿 A/A2 零误杀 ∧ 字节逐值；腿 B = 真静默杀断（报文字面 `Response body timeout (idle 120s)`） | 批内件三腿；腿 B 备选 = 注入缝（须显式上报取用） |
| #1146 | 探活摘录 = 有界流式读 | `src/gateway/embedding-admin.mjs:45-51`（`textExcerpt` 改写）；调用点 `:92` 零改 | 见 2.4：读帽 8192 字节 + `reader.cancel()`；摘录语义不变（`trim` + 首 200 字符） | 批内件：假引擎（非 2xx + 大体 + 字节计数）⇒ `writtenBytes ≤ 8192 + 容差` ∧ 摘录逐字 ∧ 计时读数在册 |
| #967 | 清账核销（零改） | `thincoder-server/README.md:62-63` ∥ `design/ops/OPS.md:52`（残 nuance 注——本设计轮现读在盘） | 台账 #967 核销（父侧） | 本设计轮读数在案（本条即证据行）∥ `doc-check` EXIT 0——**不新设句锚** |
| #1008 | 清账核销（零改——拒形已落） | `src/gateway/providers.mjs:27-32`（`isExternalModelRef`）∥ `src/accounts/members.mjs:150-157`（`assertModelRefKey` 委托） | 拒形沿单源；空白形键 ⇒ 400 库零变；裸名照收（别名形） | 直跑 `docs/batches/2026-10-09-server-model-alias.test.mjs` 全绿（覆盖 B27/E23 腿）+ 本设计轮现读 |
| #1010 | 清账核销（零改） | `design/gateway/API.md:67`（① displayName 源）∥ `:72`（② 撤销面口径）∥ `webui/WEBUI.md:259`（③ 富项各占独立列·行内无分隔符） | 三句均在盘（本设计轮现读） | 同 #967（核销笔——零新断言） |

### 二、落地细节要素

**2.1 #1025 值表（13 键 × 两语——zh 保留「API Key」英文原形 ∥ en = "API key"）**

| 键 | zh 现 ⇒ 新 | en 现 ⇒ 新 |
|---|---|---|
| `nav.page.me.keys` | key 与签发 ⇒ API Key 与签发 | Keys & issuing ⇒ API keys & issuing |
| `me.keys.title` | 我的 key ⇒ 我的 API Key | My keys ⇒ My API keys |
| `me.keys.secretLabel` | 新 key（明文）⇒ 新 API Key（明文） | New key (plaintext) ⇒ New API key (plaintext) |
| `admin.members.tableTitle` | 成员表（key 清单——吊销在行内）⇒ 成员表（API Key 清单——吊销在行内） | Members (keys listed inline with revoke) ⇒ Members (API keys listed inline with revoke) |
| `admin.members.colKeys` | key 清单 ⇒ API Key 清单 | Keys ⇒ API keys |
| `admin.members.colKeyCount` | key 数 ⇒ API Key 数 | Keys ⇒ API keys |
| `admin.members.colKey` | 密钥 ⇒ API Key | Key ⇒ API key |
| `audit.type.key_issue` | key 签发 ⇒ API Key 签发 | Key issued ⇒ API key issued |
| `audit.type.key_revoke` | key 吊销 ⇒ API Key 吊销 | Key revoked ⇒ API key revoked |
| `audit.type.key_rotate` | key 轮换 ⇒ API Key 轮换 | Key rotated ⇒ API key rotated |
| `system.accessHint` | …key 由本人在「我的 → key 与签发」自助签发… ⇒ …API Key 由本人在「我的 → API Key 与签发」自助签发… | …keys are self-issued under “My → Keys & issuing”… ⇒ …API keys are self-issued under “My → API keys & issuing”… |
| `audit.keyHint`〔面内补全〕 | key ⇒ API Key | key ⇒ API key |
| `usage.col.key`〔面内补全〕 | key ⇒ API Key | key ⇒ API key |

- 零触已合规面（两语）：`me.keys.listTitle`（API Key 清单）∥ `me.keys.colKey`（API Key）∥ `me.keys.issue`（签发新 API Key）∥ `me.keys.empty`（含「签发新 API Key」）∥ `me.keys.accessTitle`/`accessHint`/`accessKeyRow`。
- 末两键 = 口径条枚举未穷举、但实体同一（成员 API Key 的名字面：审计详情键提示形 ∥ 用量表列头）——**显式列为面内补全（可裁删：删则机检面 −4 断言，零结构影响）**。

**2.2 #1056 去重落法**：`views-usage.mjs:85-86` 两调用点改为变参件 + 显式包值节点——`statCard(h, t("usageReport.requests"), h("div", { class: "stat-value", text: String(summary.totals?.requests ?? 0) }))`（同形第二枚）；本地件 `:105-107` 删净；`views-overview.mjs:49-51` 签名 `statCard(h, label, ...content)` **冻结**（已导出面——`views-me.mjs:16` 复用 + 既有批件正则断言）。

**2.3 #1137 三腿定义**（夹具 = 进程内假代理（net）∥ 假上游（http）；出口 = `proxyFetch`；**目标非 loopback**——loopback 恒直连 ⇒ 假代理零命中，先例 `-server-gemini-openai-preset.test.mjs:390-410`）：

- 腿 A（慢写 + 缓读——不误杀）：假代理按 `Content-Length` 分块慢写（≈5 块 × 300ms），下游逐块缓读（≈400ms/块）⇒ 流毕 ∧ 字节逐值 ∧ 零 `Response body timeout`。
- 腿 A2（泄压窗——排空期不杀）：突写 ≤16KB（HWM 内）后停写、下游缓排空 ⇒ 排空期 `'readable'` 重接（`proxy.mjs:144`）不杀；排空毕继续等待。
- 腿 B（真静默 ⇒ 杀断）：首块后上游零写 ∧ 下游不读 ⇒ `mock.timers`（`setTimeout` 面）`tick` 推进 ≥120s ⇒ for-await 抛 `Response body timeout (idle 120s)`（`:125` 报文字面）∧ 假代理侧观测拆连。
- 备选（**须实施轮显式上报取用**）：`proxyFetch` 增可选 `idleTimeoutMs` 注入缝（缺省 120s 不变——沿 `embedding-admin.mjs`「注入口径（批内件替身）」先例）以替换腿 B 钉钟；取用则该件 `proxy.mjs` 行数 +≈2。

**2.4 #1146 有界读落法**：`textExcerpt` 改写为 `response.body.getReader()` 流式读，累积至 **读帽 8192 字节**（上限 200 字符的自然字节面 ≤ 800B——帽 10× 裕量）⇒ `reader.cancel()`（余量不读、连接即还）⇒ `TextDecoder` 解码 → `trim().slice(0, limit)`（语义逐字不变）；`body` 缺失（测试替身）⇒ 回落 `await response.text()`（现行为——有界性降级仅替身面）。调用点 `:92` 零改。

**2.5 文档面收正**：

- `design/PROJECT.md:221-222` 滞账注两条 ⇒ 删（D8——失效表达式不留现面），原位补 **五行总账行**；五源 = `docs/batches/2026-10-07-{console-layout ∥ quota-per-model ∥ quota-v2-member-models ∥ provider-model-metadata ∥ provider-picks-columns}.md`（各批 §5/§6 + 域档小计互证；数值须逐批实读、禁估）；R40②（`:420`）⇒ 「已补（2026-10-10 本批——五行在 §6）」。
- `webui/WEBUI.md:101` 词汇口径条 ⇒ 统一现状句（「四面 + 新页统一 = 「API Key」（2026-10-10 本批——台账 #1025）」；零「另笔/一名两形」残留）；`:151` 页题句「我的 key」⇒「我的 API Key」；`:215`「key 数」⇒「API Key 数」。
- `design/PROJECT.md:420` R40③ 词汇口径句 ⇒ 统一已办（指针同 R40②）；`design/PROJECT.md` ∥ `webui/WEBUI.md` 变更记录各 +1 行。
- 现形句判定 = 「陈述当前 UI 文案处」；历史/批注/KD/AC 行名（如功能点名「我的·key 与签发」）= 记录面，**零改**。

### 三、关键裁定（3 条）

① **#1025 统一向 = 「API Key」**（zh 保留英文原形 ∥ en = "API key"）。依据 = 用户 16:41 问「惯例都叫apikey」+ 16:43 裁定「B」（`requirements/PROJECT.md:291` 在册：功能点 25②③ 词位收正「密钥 ⇒ API Key」；「既有四面（nav/管理/审计/接入卡）统一 = 另笔轻通道（台账 #1025）」）。**派发文「统一向 = 新页『密钥』」与盘面相抵**——盘面新页现用「API Key」（`i18n-zh-me.mjs:25/:27/:32` 三键实读；`WEBUI.md:97` 改值在案）；「密钥」= 16:41 前旧形（需求 §2:25③ 原字面，已被 `:291` 收正）。同向旁证 = 客户端面 #1035 已统一（`-provider-config-parity-{desktop,vsc}.test.mjs`「zh 裸『密钥』清零」判据在册）。本设计按「API Key」出案；如父侧/用户确有他裁 ⇒ 须先翻 `:291` 再回设计（不得两写并存）。

② **#1008 = 拒形**（空 ∥ 首尾空白 ∥ 斜杠空段 ⇒ 400/拒）：不取 trim（trim 会造「同一实体两名」与键面歧义——trim 语义仅存在于别名/显示名面，键形面沿单源否决）；盘面已落（`providers.mjs:27-32` + `members.mjs:150-157` 委托零自实现）；本批 = 核销。

③ **#1056 去重向 = `views-overview` 变参件**：其已是导出面（`views-me.mjs:16` 复用 + 既有批件断言签名）⇒ 取为单源；调用点显式包 `.stat-value` 保 DOM 零漂移（视觉不变）。

### 四、受影响文件与测试面（行数 = 本设计轮现读）

**产品面**：

- `thincoder-server/public/views-usage.mjs` **139 ⇒ ≈137**（#1056：本地件 −3 ∥ import +1）。
- i18n 八档——**值改、行数全 ±0**（逐值就地替换）：`i18n-zh-shell.mjs` 74（1 键）∥ `i18n-en-shell.mjs` 72（1）∥ `i18n-zh-me.mjs` 68（3）∥ `i18n-en-me.mjs` 69（3）∥ `i18n-zh-admin.mjs` 141（4）∥ `i18n-en-admin.mjs` 145（4）∥ `i18n-zh-system.mjs` 172（5）∥ `i18n-en-system.mjs` 172（5）。
- `thincoder-server/src/gateway/embedding-admin.mjs` **117 ⇒ ≈125**（#1146 +≈8）。
- `thincoder-server/src/gateway/proxy.mjs` **267 ±0**（#1137 纯补腿；取注入缝备选 ⇒ +≈2）。
- `thincoder-server/package.json` **26 ±0**（`prepublishOnly` 清单 35 ⇒ **37**——本批两件入链；单行清单行数零变）。

**设计档**：`design/PROJECT.md` 495 ⇒ ≈501（五行 + §9 R40②/③ 就地 + 变更记录）∥ `webui/WEBUI.md` 720 ⇒ ≈721（三处现形句就地 + 变更记录）∥ `design/ops/OPS.md` ∥ `design/gateway/API.md` ∥ `design/accounts/ACCOUNTS.md` ∥ `design/metering/METERING.md` ∥ `design/store/STORE.md` **零改**（#1008/#1010 核销面已合规——本设计轮现读）。

**需求档（主 agent 笔——父侧面）**：`requirements/PROJECT.md:291` 句尾「统一 = 另笔轻通道」⇒ 已办（2026-10-10）+ 变更记录 +1 行。

**测试面**：

- 新批内件 **两件**（拆档预案先立——各 <500 硬线）：`docs/batches/2026-10-10-server-small-fixes.test.mjs`（文案值面 ∥ statCard 去重 ∥ 有界读 ∥ me 页 from 行为腿——估 ≈420）∥ `docs/batches/2026-10-10-server-small-fixes-proxy.test.mjs`（慢消费三腿——估 ≈220）。
- 随正件（**跨批面 = 父侧落**，沿先例）：`docs/batches/2026-10-08-server-public-structure.test.mjs`（`:50` 注 ∥ `:52-53` 指纹两枚 ∥ `:59` 标题——值改后必漂）∥ `docs/batches/2026-10-07-me-usage-charts.test.mjs`（#1057① 钉钟 + 近零点腿）∥ 门禁件数断言族七件 N ⇒ N+2（现值实读 35 ⇒ **37**）——以实施当刻盘面为准。
- 旧断言件核（**预计零破——实读为界**）：`-me-keys-redo-ui`（`:150/:151/:320/:326` 自读表值或零触键）∥ `-console-layout`（`:400` 断言为标签形，非文案）∥ `-console-modals`（键在场非值）∥ `-server-i18n`（nav 键在场非值）。

### 五、上抛项

1. **[上抛·待裁] 派发文与盘面相抵**：派发文「#1025 统一向 = 新页『密钥』」vs 盘面（新页现用「API Key」）+ 用户定音（`requirements/PROJECT.md:291`）——本设计按「API Key」出案（裁定①）；如确为他裁（取「密钥」）⇒ 请先翻 `:291` 并回设计轮（13 键值表方向随之反转）。
2. **[上抛·知会] 面内补全两键**（`audit.keyHint` ∥ `usage.col.key`）：口径条枚举未穷举、实体同一（成员 API Key）——纳入 （裁定权在评审/父侧，删则 −4 断言、零结构影响）。
3. **[上抛·知会] 跨批落笔面**：随正件全部依赖父侧落笔（跨批写门沿先例）；`package.json` 件链 + 产品面 = coder 面。
4. **[上抛·知会] #1024 数值面**：五行数值须逐批实读自五批档 §5/§6（本设计轮未转录——实施轮取数、收口轮抽核；禁估数）。
5. **[上抛·知会] 边界外延问**（不扩本批——显式登记）：provider 面凭证三键（`admin.providers.colKey`/`clearKey`/`keepKeyNone`）∥ `vector.clearApiKey` 仍用「密钥」——指别 = 上游/引擎凭证实体（非成员 key）⇒ 本批零触；如要求一并清零（客户端面有先例）⇒ 另笔/翻需求面，请裁。

### 六、零触确认（边界）

- 零触：`src/**` 除 `embedding-admin.mjs` 外全档（`providers.mjs`/`members.mjs`/`proxy.mjs`/`routes.mjs`/`config.mjs` 零改）∥ webui 结构四档（`views-me`/`views-overview`/`app.mjs`/`nav.mjs`）∥ `style.css` ∥ 键集（值面 only）∥ 端点/契约/审计型表/存储版本（v10 不动）∥ SD/AC 编号（零增）。
- 本批不做：术语外延清零（上抛 5）∥ `byMember` 连带优化（#1057③ 钉死接缝）∥ 看门狗参数/语义变更（#1137 补证不改造）∥ 探活超时/重试策略（#1146 只收读界）。
- 本块 = 设计轮初稿；评审（§3）后按发现逐条落修。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

评审对象 = 本档 §2（设计轮 initial）；抽核 = thincoder-server 产品面 + docs/server 设计/需求档 + docs/batches 批档现读——引用坐标逐一落盘（13 键现值逐键相符 ∥ `proxy.mjs:125` 报文字面相符 ∥ 五批档在场 ∥ 行数注 14 处逐值相符：139/117/267/26/74/72/68/69/141/145/172/172/495/720）。

| # | 类别 | 级别 | 发现 | 建议 |
|---|------|------|------|------|
| 1 | 覆盖·文档链 | 🟡 | 本批 `prepublishOnly` 35 ⇒ 37（`:111`），而 §四 判 `design/ops/OPS.md` ∥ … ∥ `design/store/STORE.md` **零改**（`:113`）——`design/ops/OPS.md:115-116`（「批内件 30 ⇒ 31 ⇒ 32 ⇒ 33 ⇒ 34 ⇒ **35 件**」）与 `design/PROJECT.md:226` 板级行（「`prepublishOnly` 清单 30 ⇒ 31 ⇒ 32 ⇒ 33 ⇒ 34 ⇒ **35 件**」）将滞账；先例 = `design/PROJECT.md:180`「文档链随正 = `ops/OPS.md` §5.1 ∥ 本档 §6 板级行（29 ⇒ 30 件）」 | 随正清单/文档面补两处 35 ⇒ 37（OPS.md §5.1 ∥ PROJECT.md §6 板级行） |
| 2 | 行数注（标准 8） | 🟡 | 随正测试件 8 件将被改动（`-server-public-structure` ∥ `-me-usage-charts` ∥ 门禁族七件）均无「现值 ⇒ ≤±N」注（`:120`「门禁件数断言族七件 N ⇒ N+2（现值实读 35 ⇒ 37）」）；实读 `-quota-v2-member-models` ≈741 ∥ `-server-auto-update` 498 ∥ `-console-layout` 495 ∥ `-provider-model-metadata` 494（近/超 500 软线；`design/PROJECT.md:295` 在册「档位结论 = **免拆**（≤800）」） | 沿 §6 注⑩–⑯ 先例补逐件「现值 ⇒ ≤±N」行数注；>500 件引在册「免拆」结论 |
| 3 | 验收·#1146 | 🟡 | `:49`「`writtenBytes ≤ 8192 + 容差` ∧ 摘录逐字 ∧ 计时读数在册」——容差未定 ∧ 计时项非断言 ⇒ 不可机检 | 钉定容差上界（或拆为客户端读数 + 服务端早关双断言）；计时项给判据或标记述 |
| 4 | 清晰·#1025 文面 | 🔵 | 口径条整条跨 `webui/WEBUI.md:100-101`（`:100` = 「**词汇口径（一名两形——登记）**」），设计目标仅 `:101`，而目标含「零「另笔/一名两形」残留」（`:45`）——按单行实施会漏 `:100` | 目标扩记 `webui/WEBUI.md:100-101` |
| 5 | 引用·#1025 | 🔵 | `:45`「逐键现读行号 = 2.1 表」——2.1 表无行号列 | 删括注或补行号 |
| 6 | 数值·#1024 | 🔵 | `:113`「495 ⇒ ≈501（五行 + §9 R40②/③ 就地 + 变更记录）」与编辑账（删 2 + 补 5 + 变更记录 1 ⇒ ≈499）差 ≈2；.md 免注 | 以实施实读取代估算 |
| 7 | 证据·#1057① | 🔵 | `:47`「本设计轮实测可用」（`mock.timers` Date 面）属运行断言、盘面不可复核（unverified）；仓内先例仅 `setTimeout` 面（`docs/batches/2026-10-03-crash-guards.test.mjs:129`） | 例毕 `mock.timers.reset()`；不可用则回退 `now` 参数注入 |
| 8 | 语义·#1146 | 🔵 | `:86`「`TextDecoder` 解码 → `trim().slice(0, limit)`（语义逐字不变）」——帽位截断（前 8192B 全空白/诊断文在帽外 ⇒ 摘录短于整段读）与读失败回落（现 catch ⇒ `""`）未进 AC | AC 显式接受两边界（帽位截断 ∥ 读失败空摘录） |

范围外注（无级别）：§1 `:19` 坐标 `embedding-admin.mjs:42` 与盘面相抵（`textExcerpt` 在盘 = `:44-51`；§2 记 `:45-51` 正确）。

**计数**：🔴 0 ∥ 🟡 3 ∥ 🔵 5

VERDICT: pass

## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）

**§5 实施记录（eng-coder · 2026-10-10 · round=initial——9 条全实现 + 枚举外延 +1（父侧本刻裁定））**

**状态行**：实施完成（9 条全实现 + 枚举外延 +1；批内件 8/8 ∥ 3/3；内审计零命中；内评审 pass；跨批 8 件待父侧落）

**交付摘要（逐条）**：

- **#1025**（术语统一）：13 键 × 两语值改（八档）**+ 父侧本刻裁定枚举外延 +1** ⇒ 合计 **14 键**（`system.teamKey`：zh「团队 key」⇒「团队 API Key」∥ en "Team key" ⇒ "Team API key"——同一实体（成员 API Key，`system.teamKeyValue` = `sk-tc-…（#/me/keys 自助签发）`），沿「同实体不留半清」口径收；配值句零称名 ⇒ 零动）。键集零变（**389 ∥ 394** 复算在案）。旧形扫描：14 键 zh 值零「密钥」∧ 零裸小写 `key`。交叉一致：`system.accessHint` 内嵌 nav 键值（两语）。
- **#1056**（statCard 去重）：`views-usage.mjs` 本地件删净 ⇒ import 单源自 `views-overview.mjs`；两调用点显式包 `.stat-value` 值节点（DOM 逐值保形）；行数 **139 ⇒ 137**（设计估 ≈137）。
- **#1057**：① 落点在跨批件（见「待父侧落」）；② `views-me.mjs:156-161` `from` 模板字面量 = 零改（本批件以**行为腿**机检：请求 URL 含 `from=` ∧ 值 = 窗换算 ∧ 两读同参）；③ `metering/report.mjs:170` `byMember` 复用注 = 零改（既成）。
- **#1137**（代理慢消费）：`src/gateway/proxy.mjs` **产品码零改**；新件 `-proxy.test.mjs` 三腿（A 慢写缓读 2.4s 流毕字节逐值 ∥ A2 泄压窗排空不杀 ∥ B `mock.timers` 推进 ≥120s ⇒ 报文字面 `Response body timeout (idle 120s)` 杀断）+ 假代理侧拆连观测——**3/3 绿**（未取用注入缝备选）。
- **#1146**（有界流式读）：`embedding-admin.mjs` `textExcerpt` 改 `body.getReader()` 流式读——读帽 `EMBEDDING_EXCERPT_READ_CAP = 8192`（导出）+ 帽满/读毕/读错三径 `reader.cancel()`（`finally`，`.catch(() => {})` 护栏）∥ `body` 缺失（替身）⇒ 回落 `response.text()` ∥ 摘录语义逐字不变（`trim().slice(0, limit)`）∥ 调用点零改。行数 **117 ⇒ 实读 140**（越设计注 ≈125 —— 常量导出 + 注释扩写；≤500 软线内）。
- **#1024**（五批总账行）：`design/PROJECT.md` §6 滞账注两条**删**（D8）+ 原位补 **五行**（逐批实读自五批档 §5/§6：布局 ∥ 配额分模型 ∥ 配额 v2 ∥ 模型元数据 ∥ 列式；抽核 3/5——列式 367/352/355/3350 ∥ 布局 318/215/185/…/8-8 绿/148-148 ∥ 配额 275/207/321/446/155-155——逐值相符）；R40② ⇒ 「已补（2026-10-10 本批——五行在 §6）」。
- **#967 ∥ #1008 ∥ #1010**（核销——零改）：证据在盘复核（`README.md:62-63` 残 nuance ∥ `providers.mjs:27-32` `isExternalModelRef` + `members.mjs:153-157` 委托 ∥ `API.md:67/:72` + `WEBUI.md:259`）⇒ 核销面交父侧。
- **文档链随正（F1）**：`design/PROJECT.md` §6 板级行件数链 30 ⇒ … ⇒ 36 ⇒ **38 件**（组成式尾同拍 23 ⇒ **25 件**）∥ `ops/OPS.md` §5.1 同两处 ∥ `webui/WEBUI.md` 词汇口径条（统一现状句——零「另笔/一名两形」残留）+ 页题「我的 API Key」+ 成员表列「API Key 数」+ 接入卡「团队 API Key」提示句 ∥ 三档变更记录各 +1 行。
- **F2（行数注）**：父侧代注——本侧如实读提供（下表）。

**逐档实读（2026-10-10 本会话）**：

| 档 | 实读 | 备注 |
|---|---|---|
| `public/views-usage.mjs` | **137** | 139 ⇒ 137（估 ≈137 ✓） |
| `public/i18n-{zh,en}-{shell,me,admin,system}.mjs` | **74 ∥ 72** ∥ **68 ∥ 69** ∥ **141 ∥ 145** ∥ **172 ∥ 172** | 值改——行数全 ±0（与设计注逐值相符） |
| `src/gateway/embedding-admin.mjs` | **140** | 117 ⇒ 140（设计注 ≈125——越注 ≈15，披露） |
| `src/gateway/proxy.mjs` | **267 ±0** | 产品码零改（仅测试补腿） |
| `thincoder-server/package.json` | **26 行 ±0** | 清单 **38 件**（36 + 本批两件；38 项目标实读全在盘） |
| `docs/batches/2026-10-10-server-small-fixes.test.mjs` | **353** | 新件（8 例） |
| `docs/batches/2026-10-10-server-small-fixes-proxy.test.mjs` | 见件 | 新件（3 例） |

**#1146 容差定值（父裁 F3——取数在案）**：假引擎体量旋钮 = 8 MiB ∥ 8 MiB ∥ **32 MiB**（三轮）；实测 `writtenBytes` = **2,425,148 B（三轮同值——确定性；= 内核/流缓冲可吸纳量，非读帽）**；客户端拆连（`reader.cancel()` 生效）读数 = **9–25 ms**；closed = true。⇒ 件内上界 = 读帽 8192 + **容差 8 MiB**（设计「64 KiB 起、实测定」授权下取实测值的 ≥3× 裕量）+ 判别断言 `writtenBytes < BODY_BYTES`（32 MiB——整段读必破）。**披露**：容差 = 主机 socket 缓冲依赖量（换机可能越上界——内评审列为 🔵，判别力实由「非整段」腿承载）。

**决策透明表**：

| # | 决策 | 依据 | 备选与否决 |
|---|---|---|---|
| 1 | 14 键（13 + 枚举外延 1） | 父侧 2026-10-10 本刻裁定「收——同一实体不留半清」；证据 = `system.teamKeyValue` = `sk-tc-…`（成员 Key 实体） | 维持 13（枚举表原文）——父侧否决（同实体残留一名两形） |
| 2 | `system.teamKeyValue` 零动 | 配值句零「key/密钥」称名（`sk-tc-…（#/me/keys 自助签发）`——`#/me/keys` = 路由，非文案称名） | 连带改称名（无称名可改 ⇒ 空动作） |
| 3 | 容差取实测值 8 MiB（非设计示例 64 KiB） | F3「64 KiB 起、实测定」授权 + 实测 2,425,148 B（三轮同值）；判别力由「非整段」腿（< 32 MiB）承载 | 64 KiB（与引擎侧实测不符 ⇒ 恒红）；仅留「非整段」单腿（弱化有界性判别） |
| 4 | `views-usage.mjs` import 注释移行（原尾注 ⇒ 独立行） | 旧件 `-server-i18n.test.mjs:180` 以**行式**解析 import（尾注致解析失败——实跑抓出）；语义零变 | 改旧件解析器（跨批件面——父侧落，不在本批权限） |
| 5 | 本批件腿 D 删「源码形」断言（原 :336 模板字面量形冻结） | 内评审 🔵：设计机检法只要**行为腿**且明文「两形式行为等价」；形冻结 = 形耦合（未定位到需该形的冻结扫描） | 保留形断言（锁死 `views-me.mjs` 源码形——零触档，越权面） |
| 6 | 本批件腿 D 加钉钟（`mock.timers` 本地正午） | 内评审 🔵：断言时刻与视图渲染时刻各取 `new Date()` ⇒ 跨零点抖（与 #1057① 同类） | 维持裸壁钟（复刻 #1057① 缺陷） |
| 7 | 文档面随正三档由本侧落（非父侧） | 批档 §2 五「跨批写门如拒 ⇒ 待父侧落清单」——`docs/server/design/**` 非跨批件、写门放行 ⇒ 本侧落；行数注（F2）= 父侧 | 全推父侧（无必要——非跨批面） |

**审计与代码评审轮次与终态**：

- **① 内探索背离审计（explore · 只读 · 1 轮）**：四类判据（部分实现 ∥ 静默简化 ∥ 文档漂移 ∥ 超清单）**零命中**；逐条核过 7 项点名（14 键逐字 ∥ 去重落法 ∥ 有界读 ∥ 键数 389/394 复算 ∥ 五行抽核 3/5 逐值相符 ∥ 零超清单 ∥ 跨批四红构成）——附 2 候选（C1 `system.teamKey` 残形 ⇒ 父裁「收」已落；C2 R40③ 失效句残留 ⇒ 已修）+ 3 待落项（§5 ∥ 需求档 ∥ 跨批随正）。
- **② 自修轮（fix round 1——审计后）**：C2 收正——`design/PROJECT.md` R40③ 删失效句「nav/管理面/审计/接入卡仍用「key」（本批零触——admin 面边界）」⇒ 并列「统一已办」（D8 精神——失效表达式不留现面）。
- **③ 自修轮（fix round 2——内代码评审后）**：① 枚举外延 +1 落地（两语值 + 批内件 +1 断言 + WEBUI 口径条/接入卡句 + 变更记录 13 ⇒ 14——D3 计数同拍）；② 腿 D 钉钟 + 删形断言（决策 5/6）；③ 组成式尾 23 ⇒ 25 件（PROJECT.md ∥ OPS.md）。
- **④ 内代码评审（advisor · type=code · 1 轮）**：**VERDICT pass**（🔴 0 ∥ 🟡 2〔① `system.teamKey` 同实体残形 = 交付前即修（父裁落）；② 批档 §2 记「35 ⇒ 37」与落地 38 相抵——父侧面，落笔取 38〕∥ 🔵 6——逐条处置：容差主机依赖（接受 + 披露）∥ 腿 D 裸壁钟（已钉）∥ 形断言/注释引注（已删断言；`views-usage.mjs` 注释补注见披露）∥ embedding-admin 行数注（已入上表实读）∥ §5 取数（本节已落）∥ 恒等 map（已清））。**终态 = clean**（0 must-fix）。
- **⑤ 交付前自跑（全绿，读数见下）**；跨批四红 = 随正件未落（父侧落讫即归零——patched 副本 8 件已验绿）。

**自跑读数（命令 + 结果 · cwd = `thincoder/`）**：

- `node --test docs/batches/2026-10-10-server-small-fixes.test.mjs` ⇒ **8/8 绿**；`… -proxy.test.mjs` ⇒ **3/3 绿**。
- 零破复跑（既有件——实跑）：`-me-usage-charts-ui` 6/6 ∥ `-me-keys-redo-ui` 6/6 ∥ `-console-modals` 6/6 ∥ `-console-completeness-2` 6/6 ∥ `-server-embedding-decouple` 17/17 ∥ `-server-console-config` 24/24 ∥ `-server-face-residues` 12/12 ∥ `-server-model-alias` 21/21 ∥ `-server-i18n` **6/6**（自修后——曾 5/6：`views-usage.mjs` import 尾注致旧行式解析器失败，见决策 4）。
- 跨批 patched 副本（`.thincoder/tmp/2026-10-10-server-small-fixes/patched/`）8 件全绿（含 `-server-public-structure` 指纹两枚刷新：zh `9ff4bdfde426c1372f266879c0c1b3dbd4712453376d299e15664afa0c1f0dd2` ∥ en `f233d77d198c4c214d571d5727d35333d37a8d109546e777cc08b0ed5aa37058`）。
- 近零点腿红绿对照（`near-zero-leg-redproof.mjs`——探针）：钉钟 23:59:59.500 跨日序列——修前形断言 **RED**（窗末 = 次日 vs 捕获时 dayKey = 当日 ⇒ 抖源复现）∥ 修后形 **GREEN**（窗沿随钟 ∧ 原日落前一日槽 ∧ 行不丢）。
- `node --check`：14 个改动 JS 档全 OK；`node scripts/doc-check.mjs` ⇒ **悬空 5（全落 `docs/core` ∥ `docs/vsc` 他面既存——本批零增）∧ 行宽 OK（0 行 >300）**。
- **not repo-suite verified — the parent-side closeout run is the only repo-suite run.**

**披露（上抛/待落）**：

1. **[待父侧落] 跨批随正件 8 件**（跨批写门机械拒——已取拒证）：门禁件数断言七件（`-console-list-style` ∥ `-server-auto-update` ∥ `-console-layout` ∥ `-me-usage-charts` ∥ `-provider-model-metadata` ∥ `-quota-per-model` ∥ `-quota-v2-member-models`：现值 **35 ⇒ 38**）+ `-server-public-structure`（基线注 ∥ 指纹两枚 ∥ 标题）；其中 `-me-usage-charts` 另含 **#1057① 钉钟 + 近零点腿**（23:59:59.500）。patched 副本已备 = `.thincoder/tmp/2026-10-10-server-small-fixes/patched/`（逐件实跑绿）。
2. **[待父侧] 批档 §2 记数相抵**：§2 记「`prepublishOnly` 35 ⇒ **37**」，落地实况 = **38**（`package.json` 实读 38 件 ∥ 本档板级行 ∥ `OPS.md` §5.1 均已收正 38；`-face-residues` 档 §6 亦明定「合并单趟 35 ⇒ 38」）——父侧落笔请取 **38**。
3. **[待父侧] 需求档回笔**：`requirements/PROJECT.md:291` 句尾「统一 = 另笔轻通道（台账 #1025）」+ 变更记录 1 行 = 主 agent 笔。
4. **[披露] 文档面 `views-usage.mjs:31` 注释**（既有——非本批新增）：称「引号形 `from` 键会撞批内件依赖面扫描正则」，未给件:行；本侧 grep 未定位该类扫描（唯一主张该形者 = 本批件原 :336，已删）——下次触碰该档时补具体件:行或改回引号形。
5. **[披露] 容差 8 MiB 为主机缓冲依赖量**（判别力由「非整段」腿承载）——换机误红风险在册（内评审 🔵，接受不修：真机腿本即诊断面）。
6. **[披露] `embedding-admin.mjs` 越设计注 ≈15 行**（117 ⇒ 实读 140）——实读入上表，行数注（F2）= 父侧代注。

## §6 验证与收口（父代理）

**交付物**：9/9 ✅（eng-coder #92）—— `#1025` 术语统一（14 键 × 两语值改，八档 + 枚举外延 +1 = `system.teamKey`「团队 API Key」）∥ `#1056` `statCard` 去重（本地件删净 → `views-overview` 单源；139 ⇒ 137）∥ `#1057`（②③ 零改收口 ∥ ① 钉钟 + 近零点腿 = 跨批件）∥ `#1137` 代理慢消费（产品码零改——三腿证行为已对）∥ `#1146` 有界流式读（读帽 8192 + `reader.cancel()` 三径）∥ `#1024` 五批总账行（滞账注删 + 五行补录；R40② ⇒ 已补）∥ `#967`/`#1008`/`#1010` 核销（零改）∥ F1 文档链随正（`design/PROJECT.md` + `ops/OPS.md` 36 ⇒ 38）；批内件 8/8 + 3/3。

**父侧验证读数（跨批随正 8 件落讫 · 父侧笔）**：门禁七件 35 ⇒ **38**（21 处落笔 + 1 自纠；整跑 **57/57 绿 · exit 0**）∥ `-server-public-structure` 基线注 + 指纹两枚（zh `9ff4bdfd…` ∥ en `f233d77d…`）+ 标题（**6/6 绿**）∥ `-me-usage-charts` patched 版落位（#1057① 钉钟 + 近零点腿 23:59:59.500；**4/4 绿**）∥ 需求档回笔（`requirements/PROJECT.md:291` 句尾 + 变更记录 1 行）。

**上抛处置**：① 派发文与盘面相抵（「密钥」⇄「API Key」）⇒ 按裁定①落「API Key」（`requirements/PROJECT.md:291` 定音为源）——回笔已落 ∥ ② `-server-public-structure` ①（i18n 指纹漂移）⇒ 已随正（新指纹两枚）∥ ③ `views-usage.mjs:31` 注释引「扫描正则」未给件:行 ⇒ 并入 #1187（注漂移族）∥ ④ `embedding-admin.mjs` 越设计注 ≈15 行（实读 140）= 父侧行数注面（披露在案）。

**评审终态**：advisor 代码评审 1 圆 = pass（0🔴 ∥ 2🟡 ∥ 6🔵 逐条处置）；探索审计 1 圆四类零命中；**近零点腿红绿对照**（修前 RED ⇒ 修后 GREEN）实证；终态 = clean。

**结算**：#1024 ∥ #1025 ∥ #1056 ∥ #1057 ∥ #1137 ∥ #1146 ∥ #967 ∥ #1008 ∥ #1010 ⇒ 核销（evidence = 本档 + 各读数）。**待办**：波尾 scoped commit；无未决项。
