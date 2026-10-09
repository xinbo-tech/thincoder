# 2026-10-10 · server-face-residues
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-10 · 来源 = 用户 2026-10-10「全清了」直令（承 03:39「归批清理」）+ 清账轮批档簇Ⅱ = #1161 ∥ #1162 ∥ #1169 ∥ #1170（server 面小收）。
> 台账 = #1161（server · 归批）。前情 = docs/batches/2026-10-10-ledger-full-triage.md（已收口 2026-10-10 · 簇Ⅱ）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-10
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**状态行**：🔄 进行中（设计轮已发）

**直令**：用户 2026-10-10「全清了」（承 03:39「归批清理」）——本批 = 清账轮簇Ⅱ（`docs/batches/2026-10-10-ledger-full-triage.md` §1 ②）；授权 = 会话全自动沿用。

**条目（4）**：
- `#1161`：server 六处旧口径注释/报文随 alias 机制收正（`src/metering/quota.mjs:10` ∥ `src/gateway/routes.mjs:4/:66` ∥ `src/store/db.mjs:65` ∥ `src/metering/routes.mjs:112` ∥ `src/accounts/routes-admin.mjs:104`）。
- `#1162`：`METERING.md` §3 补澄清句（派发 404 ∥ 过滤逐值可达不对称）。
- `#1169`：`thincoder-server/public/model-specs-snapshot.mjs:97` 命名空间单跳兜底 ⇒ 取末段（与核 `#1167` 同判同形）。
- `#1170`：配置项计数口径复核——AC-28「可写五」（`requirements/PROJECT.md:193`）vs WEBUI「可写四项 ⇒ 三写控件」（`webui/WEBUI.md:542`）⇒ 裁定唯一口径 + 两档同拍（D3）。

**边界**：server 面（src 注释/报文 + `METERING.md`/`WEBUI.md`/`requirements/PROJECT.md` 相关行）；不触核 ∥ 端面；`#1169` 不动 `#1167` 批的核侧落点。

**授权口径**：会话全自动（2026-10-10 03:07「全自动」+ 03:44「全清了」）——设计 → 评审（用户点火）→ 批准 → 实施。

**预mise 补（2026-10-10 · 父侧）**：设计轮实读发现同类残迹 +2 处（`thincoder-server/src/store/db.mjs:99` ∥ `thincoder-server/src/gateway/routes.mjs:48`）——父裁：**随本批同拍**（条目语义 = 「server 面同类注释残迹」，两处在射程内；同文件同族、零行为句级）。fix 轮已派（§2 落地表 +2 行）；`#1161` 条目口径不变。

**父裁（2026-10-10 · #69 fix 轮回执）**：① C 腿句随正已落（六坐标 ⇒ 八坐标；两例移出「误伤」列——已成靶句）✓（父侧笔 · 机械计数面 · 可 revert）；② 上抛③（行 1 目标句录文与 `store/STORE.md:78` 现文四处不齐）= 裁 **以 `:78` 现文复读定版**——实施轮照现文落（镜像同字原则：现文 = 源面，录文服从）；③ 落笔行号以当刻复读为准 ✓（沿 alias 批先例）。

**父裁（2026-10-10 · 评审 #77 pass 回执）**：5 🟡 ∥ 3 🔵 逐条——F1（#1162 澄清句无逐字块）⇒ 实施轮按事实源自拟逐字（必含语义点：派发 404 ⟺ 过滤逐值可达不对称）+ 读回对位 ∥ F2（目标句 #2 退化碎片）⇒ 改写为明文（两形精确匹配），C 腿片段同源 ∥ F3（坐标 4 录文 vs `store/STORE.md:78` 四不齐）⇒ **照 `:78` 现文逐字落**（与 §1 前裁同向）∥ F4（随正件未入受影响表）⇒ **父侧已补行**（§2 `:85-87`：`package.json` 26 ∥ 七门禁件 241/498/495/228/494/447/740——740 件 **不拆**注在册；父侧笔 · 可 revert）∥ F5（链组成式）⇒ 实施轮同拍（`design/PROJECT.md:227` ∥ `ops/OPS.md:116`）∥ 🔵 F6（测试名计数字样）/F7（注⑰）/F8（两处注文读回）= 随实施轮（F7 除非该批口径为不落注 ⇒ §5 明写豁免句）。**实施派工 = eng-coder #90**；产物回后进 §6。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（清账轮簇Ⅱ server 面小收——逐条落地表（4/4）+2 处补（父裁随批——行 5/6）+ 六坐标目标句 + KD-1（#1170 分列口径）∥ KD-2（#1169 取末段同形）∥ KD-3（句族单源）+ 随正件（链 35⇒36）在节内）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**设计轮（eng-designer · 2026-10-10）· 清账轮簇Ⅱ——server 面小收（#1161 ∥ #1162 ∥ #1169 ∥ #1170）**

**本批条目（覆盖）**：四条全覆。依据 = 批档 §1 + 本席现盘实读（坐标逐处现读核实——2026-10-10 03:5x）。本段 = 设计轮交付；产品码/文档零写（实施笔另派）。

**设计档落点**：清账小收——无新设计档。设计文字面 = ① 本表（批档 §2）② `docs/server/design/metering/METERING.md` §3 澄清句（#1162）③ `docs/server/design/webui/WEBUI.md` §2.1/§5 口径句（#1170）＋ 两档变更记录各 1 行（#1162/#1169/#1170 登记）。

**逐条落地表**（动作 ∥ 目标 file:line ∥ 期望结果 ∥ 机检法）：

| # | 条目 | 动作 | 目标 file:line（现读） | 期望结果 | 机检法 |
|---|---|---|---|---|---|
| 1 | #1161 | 六处旧口径注释/报文收正——句级替换（行数逐处 ±0；逐字目标 = 下「六坐标目标句」块） | `thincoder-server/src/metering/quota.mjs:10` ∥ `thincoder-server/src/gateway/routes.mjs:4-5` ∥ `routes.mjs:66` ∥ `thincoder-server/src/store/db.mjs:65` ∥ `thincoder-server/src/metering/routes.mjs:112` ∥ `thincoder-server/src/accounts/routes-admin.mjs:104` | 六处 = alias 期口径（「对外标识 = 配别名 ⇒ 别名 ∥ 未配 ⇒ `provider/model`」族）；报文两处与 `members.mjs:163/:199` 双形同字；旧句零残留 | 注释四处：`node --check` ×5 档 ＋ 实施轮读回对位（D6）；报文两处：批内件 B 腿（400 报文断言——行为形）；全六处：批内件 C 腿（源句扫描——旧句片段 0 命中 ∥ 目标句在位） |
| 2 | #1162 | `METERING.md` §3 补澄清句（派发 ∥ 过滤不对称；目标句见下块）＋ 变更记录 +1 行 | `docs/server/design/metering/METERING.md` §3 块末（`:74` 后——当刻盘面）∥ 变更记录 `:149` 段尾 | 「派发 404 ∥ 过滤逐值可达」不对称成句在册；事实源 = `report.mjs:48-56` ∥ `API.md:32-33` | `node scripts/doc-check.mjs`（仓根）= EXIT 0（悬空 0 ∥ 行宽 0）＋ 读回对位 |
| 3 | #1169 | 快照命名空间兜底单跳 ⇒ 取末段：`m.indexOf("/")` ⇒ `m.lastIndexOf("/")`（守卫 `slash > 0` 保持）＋ 注两处机制句收正 | `thincoder-server/public/model-specs-snapshot.mjs:97`（码）∥ `:6-7`（档头注）∥ `:91`（函数注） | `qwen/ZHIPU/GLM-5.3` 形末段命中；单斜杠 ∥ 裸名 ∥ 未知面零回归；与核 `#1167` 修向同形（KD-2） | 批内件 A 腿 7 例（纯函数直测）；回归 = 链件 `2026-10-06-models-config.test.mjs` ⑥ 复跑绿（单斜杠两法等价） |
| 4 | #1170 | 唯一口径裁定（KD-1——分列式）＋ 两档随正句（逐字目标见下块） | `docs/server/requirements/PROJECT.md:193`（AC-28——主 agent 笔）∥ `docs/server/design/webui/WEBUI.md:59`（§2.1）∥ `WEBUI.md:542`（§5） | 面级五 = 卡三 ＋ 代理页一 ＋ 向量卡一（3+1+1=5 逐项对读）；「可写四项」带「卡面」作用域词 | `node scripts/doc-check.mjs` = EXIT 0 ＋ 读回对位 ＋ 枚举 ⇄ `config-admin.mjs:30` 白名单逐键对读 |
| 5 | #1161 补① | v5 ① 注行句面收正——与镜像 `store/STORE.md:121` 收正形同字（保留 `-- ` 行前缀与反引号转义；块头 `:95`「§2 v5 段逐字」声明同拍；行数 ±0） | `thincoder-server/src/store/db.mjs:99` | `-- ① usage 两字段拆列（KD-SV-40）：内部真名两字段（对外显示 = 别名回映射——2026-10-09 alias 批）；`model` 可含斜杠；嵌入行 `provider = ''`（无前缀命名空间）` | 并入 C 腿扫描面（补 2 处同扫——完整旧句片段 0 命中 ∥ 目标句片段在位） |
| 6 | #1161 补② | 术语收正——「复合键派发」⇒「对外标识派发」（句面替换；与收正后 `:4` 句族同字；行数 ±0） | `thincoder-server/src/gateway/routes.mjs:48` | `// [4] 对外标识派发（裸名 ∥ 未命中 ⇒ 404 model_not_found；派发时快照）` | 并入 C 腿扫描面（补 2 处同扫——完整旧句片段 0 命中 ∥ 目标句片段在位） |

**#1161 六坐标目标句**（逐字；落笔保留行内前缀（` * `／缩进）与反引号，仅句面替换）：

1. `quota.mjs:10`：`键口径：覆盖键 = 对外标识（配别名 ⇒ 别名 ∥ 未配 ⇒ `provider/model`——KD-SV-59）∥ 计数键 = 拆列两段（provider + 上游模型名）。`
2. `routes.mjs:4-5`（两行）：`链（PROJECT.md §2）：[2] 鉴权（团队 key——sha256 查库）→ [4] 对外标识派发（别名（配了）∥ `provider/model` 前缀形——` ／ `精确匹配；上游请求体 model = 上游模型名；记账 = 拆列两字段）→ [4.5] 准入（派发命中后/转发前）：`
3. `routes.mjs:66`：`model: dispatch.model, // 记账 model 列 ∥ 上游请求体 model = 上游模型名（对外标识 = 配别名 ⇒ 别名 ∥ 未配 ⇒ `provider/model`——KD-SV-59）`
4. `db.mjs:65`（注面）：`开放清单（JSON 数组——条目两形：字符串 = 上游模型名（无别名）∥ 对象 { name, alias }；对外标识 = 别名 ∥ `provider/model`）`（与 `store/STORE.md:78` v2 段同字——块头 `:58`「逐字」声明同拍）
5. `metering/routes.mjs:112`：`缺 quotas（{ "<对外标识（别名（裸名） ∥ provider/model 前缀形）>": N|null }——值 null = 删键）`
6. `routes-admin.mjs:104`：`缺 disables（{ "<对外标识（别名（裸名） ∥ provider/model 前缀形）>": true|null }——true = 禁用；值 null = 删键恢复）`

**关键决策 1（#1170 唯一口径裁定——明确分列）**：

- **事实核（现读）**：可写面白名单五键 = `src/gateway/config-admin.mjs:30` `CONFIG_WRITABLE_KEYS`（`autoUpdate` ∥ `trustProxy` ∥ `usageRetentionDays` ∥ `proxyUri` ∥ `embedding`——同档 `:4`/`:86`/`:90` 自称「白名单五键」）；服务配置卡写控件三 = `public/views-system-config.mjs:90-95`（select ∥ checkbox ∥ number+「不限」——档头注 `:2-5` 自称「只读三行 ∥ 可写三项」）；`PATCH /api/admin/config` 白名单在代理页批零变（`webui/WEBUI.md:513`）。
- **裁定**：「可写」之计数**单源 = 面级白名单五键**（配置面口径）；界面承载 = **分列读数**——服务配置卡三写控件 ＋ 代理页一（`proxyUri`）＋ 向量卡一（`embedding`）（3 + 1 + 1 = 5 逐项对读）。`WEBUI.md:542`「可写四项」= 代理页批前的**卡面**读数（记录面历史），非并列第二口径——出现处补「（卡面）」作用域词。**不取单侧**：取「五」删卡面数 = 与卡面实读相抵；取「三」改「五」= 与白名单实读相抵——明确分列为唯一与盘面全相容的口径。
- **两档随正句（逐字目标）**：
  - ① `requirements/PROJECT.md:193`（AC-28）：`配置项全量（只读三 + 可写五——可写五 = 白名单五键（`autoUpdate` ∥ `trustProxy` ∥ `usageRetentionDays` ∥ `proxyUri` ∥ `embedding`）；界面承载分列 = 服务配置卡三写控件 + 代理页/向量卡各一）`（原句「配置项全量（只读三 + 可写五）」——句内替换）。
  - ② `WEBUI.md:59`（§2.1）句尾补：`**计数口径**：卡面可写三 = 配置面白名单五键 − 代理页 `proxyUri` − 向量卡 `embedding`；面级计数 = 五（需求 AC-28 同源）。`
  - ③ `WEBUI.md:542`（§5）两处「可写四项」补作用域词：其一 `只读三行 ∥ 可写四项（卡面）`，其二 `可写四项（卡面）⇒ **三写控件**`。

**关键决策 2（#1169 同形句）**：「取末段」——完整名未命中且含 `/` ⇒ 取**最后一个** `/` 之后的段，重试前缀扫描**一次**（`lastIndexOf`——单次重试形态保持）。同形锚 = 核 `#1167` 批（`thincoder-core/model-specs.mjs:268-274` 邻——`indexOf` ⇒ `lastIndexOf`、守卫 `slash > 0` 保持；用户 2026-10-10 03:05「只取最后一段就可以」）。**快照档 = 手工同步本**（档头 `:8`：漂移 = 手工同步 + 批内件断言）——**改动面以快照自身为准**（核侧 ∥ 端面 ∥ `#1167` 落点零触）。**认账的行为翻转类**（与核同判）：≥2 斜杠 ∧ 倒数第二段为在册前缀（`x/glm-5.3/zzz`——旧形命中 ⇒ 新形不命中）——批内件 A6 钉新形；守卫形 `/glm-5.3` ⇒ `null`（`slash > 0` 保持——A7 钉）。**否决「逐段迭代」**（核批 KD-1 已裁——扫描次数无界）。

**关键决策 3（#1161 句族单源）**：报文两处与 `members.mjs:163/:199` 双形同字（「对外标识（别名（裸名） ∥ provider/model 前缀形）」——单一措辞族，消「报文家族内一套、成员面另一套」）；注释四处沿 `providers.mjs:2/:9` 族形（「对外标识 = 别名（配了）∥ `provider/model`」）。被否候选：① 报文用简形「别名 ∥ provider/model 前缀形」（与 members.mjs 不一致——否）；② 注释保留「复合键」术语仅追加别名半句（半收正、术语族分裂——否）。

**受影响文件与行数预算**（设计估 ⇒ 实施后回填）：

| 档 | 现状（现读） | 本批 | 落点 |
|---|---|---|---|
| `thincoder-server/src/metering/quota.mjs` | 41 | ±0（句面） | #1161① |
| `thincoder-server/src/gateway/routes.mjs` | 115 | ±0（句面 ×2 处） | #1161②③ |
| `thincoder-server/src/store/db.mjs` | 256 | ±0（注面句） | #1161④ |
| `thincoder-server/src/metering/routes.mjs` | 118 | ±0（报文句） | #1161⑤ |
| `thincoder-server/src/accounts/routes-admin.mjs` | 110 | ±0（报文句） | #1161⑥ |
| `thincoder-server/public/model-specs-snapshot.mjs` | 104 | ±0（1 token ＋ 注两处） | #1169 |
| `docs/server/design/metering/METERING.md` | 168 | +2（§3 澄清句 ∥ 变更记录） | #1162 |
| `docs/server/design/webui/WEBUI.md` | 721 | +1~2（§2.1 句补 ∥ §5 作用域词（就地）∥ 变更记录 1 行） | #1170 ∥ #1169 登记 |
| `docs/server/requirements/PROJECT.md` | 303 | +1（AC-28 句内改 ±0 ∥ 变更记录 1 行；主 agent 笔） | #1170 |
| `docs/batches/2026-10-10-server-face-residues.test.mjs`（新——批内件） | —— | ≈150（A 腿 7 例 ∥ B 腿 2 例 ∥ C 腿源句扫描 ∥ 链自检） | 载体 |

**随正件（将改 · 文本收正 ±0 行——内容行数口径；评审 #77 F4 补行 · 父侧笔 · 可 revert）**：`thincoder-server/package.json`（26；清单 35 ⇒ 36）∥ 七门禁测试档（六件 <500 · 一件 740）：
`2026-10-06-console-list-style.test.mjs` 241 ∥ `2026-10-06-server-auto-update.test.mjs` 498 ∥ `2026-10-07-console-layout.test.mjs` 495 ∥ `2026-10-07-me-usage-charts.test.mjs` 228 ∥
`2026-10-07-provider-model-metadata.test.mjs` 494 ∥ `2026-10-07-quota-per-model.test.mjs` 447 ∥ `2026-10-07-quota-v2-member-models.test.mjs` **740**（>500 档线——本批文本收正 ±0、**不拆**：拆分评审随下次结构触碰）；面 = 链随正（逐条坐标见下方「随正件」节）。

**批内件（新 · 名随批档 · 住 `docs/batches/` · 入链）**：

- **A 腿（#1169——纯函数直测）**：A1 `qwen/ZHIPU/GLM-5.3` ⇒ `glm-5.3` 行（1_000_000 ∥ 128_000——末段命中；快照行 `:25`）∥ A2 `qwen/ZHIPU/GLM-5.3-FlashX` ⇒ `glm-5.3-flashx` 行（1_000_000 ∥ 131_072 ∥ 多模态——`:27`）∥ A3 大小写变体同判 ∥ A4 回归四锚（`zhipu/glm-5.3` 单斜杠 ∥ `deepseek-flash` 裸名 ∥ `k3-256k-x` 最长前缀 ∥ `hy3-preview` 位缺省——沿旧件 ⑥ 锚回抄）∥ A5 未知双段（`a/b/no-such-model`）∥ 非串（`null`／`""`）⇒ `null` ∥ A6 认账翻转类 `x/glm-5.3/zzz` ⇒ `null` ∥ A7 守卫形 `/glm-5.3` ⇒ `null`。
- **B 腿（#1161 报文——两例）**：B1 `POST /api/members/:id/model-quotas`（admin 会话；body `{}`——缺 `quotas`）⇒ 400 `invalid_request_error` ∧ message 含「对外标识」「别名（裸名）」「provider/model 前缀形」∧ 不含旧裸形 `"<provider/model>"` ∥ B2 同形（`model-disables`）。助手 = 沿 `2026-10-09-server-model-alias.test.mjs` 形（进程内服务 ＋ `accounts/session.mjs` `createSession` 直建会话（`tc_session` cookie 头）——或沿该件登录助手形；member = `createMember` 直建）。
- **C 腿（#1161 注释面——源句扫描）**：八坐标旧句片段 0 命中 ∥ 目标句片段在位（按完整旧句/新句片段精确匹配——规避同文件近义句误伤）；扫描面 = 五源档。
- **链自检**：`prepublishOnly` 含本批件（`includes` 形——沿 `-models-config.test.mjs:267` 形）。
- **复跑**：本件单跑（`node --test docs/batches/2026-10-10-server-face-residues.test.mjs`）；回归 = `node --test docs/batches/2026-10-06-models-config.test.mjs`（⑥ 快照漂移件在列——预期绿）。

**随正件（父侧/实施轮同拍——断点以当刻盘面实读为准）**：

- ① `thincoder-server/package.json:13`——`prepublishOnly` 清单末位增本批件（35 ⇒ 36；单行零变）。
- ② 门禁件数断言七件（35 ⇒ 36；断言消息与注释同拍）：`docs/batches/2026-10-06-console-list-style.test.mjs:238` ∥ `2026-10-06-server-auto-update.test.mjs:480`（＋头注 `:9`/`:439` 陈值同拍） ∥ `2026-10-07-console-layout.test.mjs:449` ∥ `2026-10-07-me-usage-charts.test.mjs:225` ∥ `2026-10-07-provider-model-metadata.test.mjs:491` ∥ `2026-10-07-quota-per-model.test.mjs:444` ∥ `2026-10-07-quota-v2-member-models.test.mjs:428`（皆 `assert.equal(batchFiles.length, …)`）。
- ③ 链值两处：`docs/server/design/PROJECT.md:226` ∥ `docs/server/design/ops/OPS.md:115-116`（「… ⇒ 35 件」⇒「… ⇒ 36 件」）。

**验收对照**（条目 → 判据）：

| 条目 | 判据 | 载体 |
|---|---|---|
| #1161 | 六坐标目标句在位 ∧ 旧句零残留；报文两例 400 双形；`node --check` ×5 | 批内件 B/C 腿 ＋ 读回 |
| #1162 | §3 澄清句在位（句面）∧ 事实与 `report.mjs:48-56` 逐点相符；`doc-check` EXIT 0 | 读回 ＋ 机检 |
| #1169 | A 腿 7/7 ∧ 链件 `-models-config` ⑥ 绿（回归） | 批内件 A 腿 |
| #1170 | 两档随正句在位 ∧ 五键枚举 ⇄ `config-admin.mjs:30` 逐键相等 ∧ `doc-check` EXIT 0 | 读回 ＋ 机检 |

**边界（不做）**：不扩条目（六坐标外同类残留 2 处 = 父裁随批——已纳入本表（行 5/6））∥ 报文错误码/结构零改（纯文本）∥ 快照行表零动（#1169 只动机制句）∥ 需求档自笔零涉（主 agent 笔）∥ 核 ∥ 端面 ∥ `#1167` 落点零触。

**上抛与披露**：

- **[父裁 2026-10-10] 两处随批同拍 → 纳入落地表（行 5/6）**：原上抛 2 处 = 六坐标外同类残留（`db.mjs:99` v5 ① 注 ∥ `routes.mjs:48` 术语）。
- **[披露] 派单边界句并读**：「不动 `model-specs-snapshot.mjs` 之外的 server 面」按 #1169 条目界读（该条目只动快照档自身）；#1161/#1162/#1170 按批档 §1（`:19`）边界行（server 面 src 注释/报文 ＋ `METERING.md`/`WEBUI.md`/`requirements/PROJECT.md` 相关行）执行——两读并读无冲突（§1 = 边界单源）。
- **[披露] 行号时效**：`requirements/PROJECT.md` 持续增长——本表坐标 = 2026-10-10 03:5x 当刻盘面值（AC-28 = `:193`）；落笔以当刻复读为准（沿 alias 批先例）。
- **[披露] #1170 复核读数**：无第三种读法——白名单五键（`config-admin.mjs:30`）∥ 卡三写控件（`views-system-config.mjs:90-95`）两实读全相容；本批只补面级关联句与作用域词，两计数零改。
- **[披露] #1169 快照行表零动**：行集/行序漂移由链件 `-models-config` ⑥ 漂移件在位持续报（本批不动表）。

**零触确认**：核（`thincoder-core/**`）零触 ∥ 端面零触（`thincoder-vscode/**` ∥ `thincoder-desktop/**`——VSC 面随正 = `#1167` 批落点，不在本批）∥ `#1167` 批落点零触 ∥ server 面非本批坐标文件零触（#1169 改动面 = 快照档一件）。本批改动面 = 四条目所列坐标合集（src 五档 ＋ 三文档 ＋ 批内件 ＋ 链随正件）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Clarity | 🟡 | #1162 澄清句以「目标句见下块」引出（`docs/batches/2026-10-10-server-face-residues.md:42`），但 §2 无该块——现有逐字块仅 `:48`（#1161 六坐标）∥ `:61`（#1170 两档随正句）；`METERING.md` §3 无逐字录文，验收「§3 澄清句在位（句面）」（`:104`）无锚句可判 | 补 #1162 逐字澄清句块（派发 404 ∥ 过滤逐值可达；事实源 = `report.mjs:48-56` ∥ `API.md:32-33`），或明写「自拟 + 读回」口径并列必含语义点 |
| 2 | Clarity | 🟡 | 逐字目标 #2（`docs/batches/2026-10-10-server-face-residues.md:51`）含退化碎片「前缀形——` ／ `精确匹配」（空码跨 + 孤「／」）——逐字复制入源注释不可读；C 腿「目标句片段在位」对该坐标无可判片段 | 该半句改写成可直接复制的明文（两形精确匹配——沿 `providers.mjs:2`/`:9` 措辞），C 腿片段同源 |
| 3 | Clarity | 🟡 | 坐标 4 录文（`docs/batches/2026-10-10-server-face-residues.md:53`）与 `docs/server/design/store/STORE.md:78` 现文四处不齐（缺「（配别名）」∥「别名」⇄「alias」∥缺「——2026-10-09 alias 批」∥反引号形），句内仍自称「同字」；§1 父裁（`:25`②）已定「照现文落」但 §2 未回录 ⇒ C 腿该坐标片段歧 | 该坐标明写「以 `store/STORE.md:78` 现文为准（逐字从之）」，或按现文回录，使 C 腿片段唯一 |
| 4 | Affected-file size annotations | 🟡 | 随正件（`docs/batches/2026-10-10-server-face-residues.md:96`：`package.json` ∥ 七门禁测试档）为将改文件而未入受影响文件表（`:70`）——无现状行数/增量标注；其中 `docs/batches/2026-10-07-quota-v2-member-models.test.mjs` 现 **741** 行（>500 档线）未带拆分评审/计划（`docs/batches/2026-10-06-server-auto-update.test.mjs` 499 行贴线） | 表内补随正件行（现状行数 + 「±0（断言文本就地收正）」）；741 行件补拆分评审句（明写不拆理由或拆分打算） |
| 5 | Methodology | 🟡 | 随正件③（`docs/batches/2026-10-10-server-face-residues.md:97`）只覆链头「… ⇒ 35 件」⇒「… ⇒ 36 件」；同句组成式「现册 34 = 8 + 4 + 1 + 21（alias 件已入链；代理页件入链 ⇒ 35）」（`docs/server/design/PROJECT.md:227` ∥ `docs/server/design/ops/OPS.md:116`）未在更新面 ⇒ 落笔后同句 36/35 并存（沿 2026-10-09 fix 轮先例——`docs/server/design/PROJECT.md:494`） | ③ 扩为「链头 + 组成式」同拍（本批 +1 ⇒ 现册 35 ⇒ 36 ∥ 补本批件项） |
| 6 | Methodology | 🔵 | 「断言消息与注释同拍」（`docs/batches/2026-10-10-server-face-residues.md:96`）未覆各件测试名所含计数字样（`docs/batches/2026-10-06-console-list-style.test.mjs:236` ∥ `docs/batches/2026-10-07-console-layout.test.mjs:447` ∥ `docs/batches/2026-10-07-me-usage-charts.test.mjs:222` ∥ `docs/batches/2026-10-07-provider-model-metadata.test.mjs:462` ∥ `docs/batches/2026-10-07-quota-per-model.test.mjs:442` ∥ `docs/batches/2026-10-07-quota-v2-member-models.test.mjs:426`——皆「三十五件/35 件」）——对照：`-server-auto-update` `:9`/`:439` 陈值已明列 | 同拍面明写「全部计数字样（注释 ∥ 测试名 ∥ 断言消息）」 |
| 7 | Methodology | 🔵 | 随正件登记注未列：设计档 §6 注系列（注①–⑯——每批一注；同型「门禁件数 +1」= 注⑮/⑯——`docs/server/design/PROJECT.md:311` ∥ `:319`）中无本批落点 | 沿先例在 `design/PROJECT.md` §6 添注⑰（随正件登记）+ §9 同批登记；如口径为不落注，明写豁免句 |
| 8 | Acceptance criteria | 🔵 | #1169 的「注两处机制句收正」（`docs/batches/2026-10-10-server-face-residues.md:43`）无对应判据——验收（`:105`）仅 A 腿 7/7 + ⑥ 回归；C 腿扫描面 = 五源档（不含快照档）⇒ 两处注文落否无检查 | 验收行/机检法补「注两处读回对位」，或把快照档两处注文纳入某腿扫描 |

计数：🔴 0 ∥ 🟡 5 ∥ 🔵 3

VERDICT: pass

## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）

**状态行**：实施完成（承 §2 + §3 F1–F8 父裁；批内件 12/12 绿；审计 1 轮 + 代码评审 1 轮 ⇒ clean；七门禁件随正 = 父侧落（回执在案））

### 5.1 交付摘要（eng-coder · 承 §2 设计 + §3 评审 F1–F8 父裁）

**产品码 · 句面（#1161 八坐标——全在五源档）**

| 坐标 | 落点 | 读数 |
|---|---|---|
| ① `src/metering/quota.mjs` | `:10` 键口径句 ⇒「配别名 ⇒ 别名 ∥ 未配 ⇒ `provider/model`——KD-SV-59」 | 行数 ±0 |
| ② `src/gateway/routes.mjs` | `:4-5` 链句（F2 明文化 =「两形精确匹配」） | 行数 ±0 |
| ③ 同档 `:66` | 记账注 ⇒「对外标识 = 配别名 ⇒ 别名 ∥ 未配 ⇒ `provider/model`——KD-SV-59」 | 行数 ±0 |
| ④ `src/store/db.mjs:65` | 开放清单注 = `store/STORE.md:78` 现文逐字（F3——含「（配别名）」「= alias」「——2026-10-09 alias 批」；块头 `:58`「逐字」声明保持） | 行数 ±0 |
| ⑤ 同档 `:99` | usage 拆列注 = `STORE.md:121` 现文（JS 模板串内反引号转义保形） | 行数 ±0 |
| ⑥ `src/metering/routes.mjs:112` | `缺 quotas` 报文 ⇒ 外标双形族（与 `accounts/members.mjs:163` 同字） | 行数 ±0 |
| ⑦ `src/accounts/routes-admin.mjs:104` | `缺 disables` 报文 ⇒ 同族（与 `members.mjs:199` 同字） | 行数 ±0 |
| ⑧ `src/gateway/routes.mjs:48` | 「复合键派发」⇒「对外标识派发」（句面替换） | 行数 ±0 |

**产品码 · 行为面（#1169）**：`public/model-specs-snapshot.mjs`——`:97` `indexOf("/")` ⇒ `lastIndexOf("/")`（守卫 `slash > 0` 保持）；注两处机制句收正（`:6-7` 档头注 ∥ `:91` 函数注——「剥一层」⇒「取末段（最后一个 `/` 之后的段）重试前缀匹配一次」）；**行表（`DISPLAY_SPECS`）零动** ⇒ 103 行 ±0。

**设计档**：`metering/METERING.md` §3 增澄清句（`:76`——派发 404 ∥ 过滤逐值可达、两径不对称；事实源 = `thincoder-server/src/metering/report.mjs:48-56` ∥ `gateway/API.md:32-33`）+ 变更记录 ⇒ 170 行（净 +2）∥ `webui/WEBUI.md` §2.1 计数口径句（`:60`）+ §5 两处「（卡面）」作用域词（`:543`）+ 变更记录（#1170/#1169 登记）⇒ 722 行（净 +2）∥ `design/PROJECT.md` §6 板级行 + 组成式（`:226-227`：…⇒ 35 ⇒ **36 件** ∥「后续各批 …⇒ 23 件」∥「现册 35 = 8 + 4 + 1 + 22（…⇒ 36）」）+ §6 增**注⑰**（`:328-331`）+ 变更记录 ⇒ 501 行（净 +5）∥ `ops/OPS.md` §5.1 链 + 组成式（`:115-116`）+ 变更记录 ⇒ 365 行（净 +1）。

**随正件 / 批内件**：`thincoder-server/package.json:13` `prepublishOnly` 清单末位增本批件（35 ⇒ **36**——实读 36 件；26 行 ±0）∥ 新批内件 `docs/batches/2026-10-10-server-face-residues.test.mjs`（**197** 行——A 腿 7 例 ∥ B 腿 2 例 ∥ C 腿 2 例 ∥ 链自检 1 例）。

### 5.2 机检读数（全在盘实跑——仓根 = `thincoder/`）

1. 批内件单跑 `node --test docs/batches/2026-10-10-server-face-residues.test.mjs` = **12/12 绿 ∥ 0 红**。
2. 回归 `node --test docs/batches/2026-10-06-models-config.test.mjs` = **7/7 绿**（⑥ D 快照漂移件含 `specForDisplay` 四锚 + 未知零兜底）。
3. `node --check` ×7（五源档 + 快照 + 批内件）= **全绿**。
4. 七门禁件 + alias 件 + gateway 两件（共 10 件）合并跑 = **93 测 ∥ 86 过 ∥ 7 红——恰为七门禁档件数断言 `36 !== 35`**（链已 36、断言待随正；见 5.4 D3）。
5. `node scripts/doc-check.mjs`：首跑 3 条本批悬空（`METERING.md:76/:170` 的 `src/metering/report.mjs:48-56` ∥ `metering/routes.mjs` 短路径锚）⇒ **就地收正为仓根相对形**（零语义）；复跑**本批面 0 悬空 ∥ 行宽 0 超**（区带豁免在效）；余 1 条悬空 = `docs/vsc/design/SETTINGS.md:865`（非本批面，仅登记）。

### 5.3 决策透明表

| # | 决策 | 依据 | 影响/可逆 |
|---|---|---|---|
| D1 | 两处落「修正后形」而非逐字照 §2 录文（②= F2 明文化 ∥ ④= `STORE.md:78` 现文） | §3 F2/F3 父裁（F2 = 退化为可直接复制的明文；F3 = 照 `:78` 现文逐字） | 现文与 §2 `:53`/`:55` 录文不同形——已上报（评审 🔵2 同点）；§2 append-only ⇒ 回录建议入 §6 |
| D2 | `package.json` 本舱落（35 ⇒ 36） | 派单 ② 逐项列出；跨批写门禁只拦「他批 companion 档」 | 单行机械、可回退（反向删一项） |
| D3 | 七门禁测试档**不改**（留父侧） | 跨批写门禁拒（gate：「belongs to a different batch…parent handles other batch records」）＋ §2 `:82`「父侧笔」＋先例（alias 批「package.json 父侧落 · 本轮按简报零触」） | 已 [上抛·知会] 父侧；回执 =「= 父侧落，本刻落；你不再试、不算未落项」 |
| D4 | §6 落注⑰、**不落 §9 R50** | 父裁 ⑥ 明定「§6 落注⑰（随正件登记）」；§9 R 行 = 设计轮面（本批设计未落，评审建议含 §9，父裁收窄至 §6） | 如需 R50 ⇒ 父侧/设计轮补一行 |
| D5 | METERING §3 澄清句自拟并落（含「派发 404 ⟺ 过滤逐值可达」+ 双事实源） | F1 父裁（语义点 + 事实源） | 句面；评审已逐点对读 `report.mjs:49-55` ∥ `API.md:32-33` 相符 |
| D6 | 批内件 A1 测试名收正（「不再降级 128K 默认」⇒「旧形双段失配 ⇒ `null`」） | 代码评审 🔵4（旧形返回 = `null`「未收录」，非核侧 `DEFAULT_SPEC`；`views-models.mjs:248` ⟸ `model-specs-snapshot.mjs:7` 零兜底） | 名面；改后复跑 12/12 绿 |

### 5.4 审计与代码评审轮次与终态

- **内部偏差审计（explore · 只读）轮次 1**：四类 = **0 ∥ 0 ∥ 0 ∥ 0**（部分实现/静默简化/文档漂移/越清单）；附注 1 条 = §2 `:53`/`:55` 录文未随 F2/F3 回录（记录面 · 父侧面，与 D1 同点）；射程外备注若干（`ratelimit.mjs:28`「复合键」注 ∥ `requirements/PROJECT.md` 旧残句 ∥ 旧批档件测试名——留后续清账批）。
- **内部代码评审（advisor · code）轮次 1**：**VERDICT pass**——0 🔴 ∥ 1 🟡 ∥ 4 🔵。逐条处置：🟡1（#1170 ① `requirements/PROJECT.md:193` AC-28 扩句未落——KD-1 自标「主 agent 笔」⇒ **父侧收口项**，非实施面缺陷，未标 must-fix）= **上抛**；🔵2（§2 录文滞后）= **accepted**（同 D1，建议 §6 对照句）；🔵3（WEBUI 变更记录段两处「可写四项」历史原样）= **accepted**（记录面不随口径收正；此处登记即闭合）；🔵4（A1 测试名）= **Fixed**（见 D6）；🔵5（收口回填面）= **本段即回填**（批内件实读 **197** 行；§4/§5/§6 待父侧收口）。
- **fix round = 1 轮**（仅 🔵4 名面改动；改后批内件复跑 12/12 绿）⇒ **终态 = clean**。

### 5.5 零触确认（边界）

核 `thincoder-core/**` 零触（同形旁证 = `thincoder-core/model-specs.mjs:269` `lastIndexOf`——属 #1167 批面，本舱零笔）∥ `public/**` 除快照档外零触（行表零动、`DISPLAY_SPECS` 逐行未动）∥ `docs/server/requirements/PROJECT.md` 零触（AC-28 句 = 主 agent 笔——见 🟡1）∥ 端面 `thincoder-vscode/**` 零触 ∥ 报文错误码/HTTP 结构零改（仅 message 文本两处）∥ 七门禁测试档零触（D3）∥ 仓根 `docs/batches/` 内仅本批件为新建（其余批档零笔）。

## §6 验证与收口（父代理）

**交付物**：7 件全 ✅（eng-coder #90）—— `#1161` 八坐标句面（旧句零残留）∥ `#1162` METERING §3 派发 ∥ 过滤不对称澄清句 ∥ `#1169` 快照 `indexOf` ⇒ `lastIndexOf`（行表零动）∥ `#1170` 计数口径（WEBUI 句 + 卡面作用域词）∥ 随正件 = `package.json` 35 ⇒ **36** ∥ 批内件 197 行 = **12/12** ∥ 七门禁件 35 ⇒ 36 = 父侧（**改判：与 Ⅸb 合并单趟 35 ⇒ 38**——等 #92 落 package.json）。

**父侧验证读数**：批内件 **12/12 绿**（父侧实跑 · 683ms）∥ 回归 `-models-config.test.mjs` 7/7 ∥ `node --check` ×7 全绿。

**父侧载荷落讫（可 revert）**：① `docs/server/requirements/PROJECT.md:193` AC-28 扩句（白名单五键点名 + 承载分列）+ 变更记录行——#1170 两档同拍闭合；② 四处行宽拆行（`docs/desktop/design/IPC.md:307` ∥ `docs/desktop/design/SETTINGS.md:148` ∥ `docs/desktop/design/UI.md:406` ∥ `docs/vsc/design/SETTINGS.md:484`）。

**上抛处置**：① §9 R50 未落（父裁 ⑥ 定「§6 注⑰」——已在案）∥ ② `SETTINGS.md:865` 悬空复核 = 现盘零命中（已消）∥ ③ doc-check 余 5 项 = vision-channel.mjs 锚（API-CONTRACT:3298 ∥ MODEL-SPECS:115/:179/:215/:2136）——Ⅹ/Ⅳ 删档随正；**MODEL-SPECS:115 列入收尾随正**。

**评审终态**：顾问代码评审 1 轮 = pass（0🔴 ∥ 1🟡〔AC-28——父侧落讫〕∥ 4🔵——🔵4 已修、余 accepted）；探索审计 1 轮（四类全 0）；终态 = clean。

**结算**：#1161 ∥ #1162 ∥ #1169 ∥ #1170 ⇒ 核销（evidence = 本档 + 12/12 读数）。**待办**：波尾 scoped commit；七门禁 35⇒38 单趟（等 #92）。
